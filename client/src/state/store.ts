/**
 * State pertandingan di client.
 * Server tetap sumber kebenaran: store ini hanya cache snapshot terakhir.
 * localStorage HANYA untuk identitas sesi & preferensi, BUKAN leaderboard.
 */

import { useSyncExternalStore } from 'react';
import type { MePrivate, MissionAnswer, PlayerLook, Prizes, RoomPublicState } from '@shared/types';
import { getSocket, rpc } from '../net/socket';

export type ConnStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface Identity {
  code: string;
  playerId: string;
  playerToken: string;
  nickname: string;
  look: PlayerLook;
}

export interface GameState {
  status: ConnStatus;
  room: RoomPublicState | null;
  me: MePrivate | null;
  identity: Identity | null;
  hostToken: string | null;
  role: 'host' | 'player' | 'spectator' | null;
  /** Selisih jam server - jam client (ms), untuk timer yang sinkron. */
  clockOffset: number;
  error: string | null;
  notice: string | null;
  kicked: boolean;
  /** Bertambah saat host meminta pemain memuat ulang adegan (scene:retry). */
  sceneNonce: number;
}

const DEFAULT_LOOK: PlayerLook = { body: 0, skin: 1, hair: 0, accessory: 'none', color: 0 };

let state: GameState = {
  status: 'connecting',
  room: null,
  me: null,
  identity: null,
  hostToken: null,
  role: null,
  clockOffset: 0,
  error: null,
  notice: null,
  kicked: false,
  sceneNonce: 0,
};

const listeners = new Set<() => void>();

function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function getState(): GameState {
  return state;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// ------------------------------------------------------------------ localStorage

const LS = {
  player: (code: string) => `raksa:player:${code.toUpperCase()}`,
  host: (code: string) => `raksa:host:${code.toUpperCase()}`,
  lastLook: 'raksa:look',
  lastHostRoom: 'raksa:host:last',
  lastPlayerRoom: 'raksa:player:last',
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* mode privat / storage penuh: abaikan */
  }
}

export function savedIdentity(code: string): Identity | null {
  return readJson<Identity>(LS.player(code));
}

export function savedHostToken(code: string): string | null {
  return readJson<string>(LS.host(code));
}

export function savedLastHostRoom(): string | null {
  return readJson<string>(LS.lastHostRoom);
}

export function savedLastPlayerRoom(): string | null {
  return readJson<string>(LS.lastPlayerRoom);
}

/**
 * Pulihkan sesi pemain dari localStorage saat halaman dibuka/refresh.
 * Server tetap sumber kebenaran; ini hanya identitas sesi.
 */
export async function bootstrapPlayer(code?: string | null): Promise<boolean> {
  const target = (code || savedLastPlayerRoom() || '').toUpperCase();
  if (!target) return false;
  if (!savedIdentity(target)) return false;
  const res = await actions.rejoin(target);
  return res.ok;
}

/** Pulihkan sesi host saat halaman host dibuka/refresh. */
export async function bootstrapHost(code?: string | null): Promise<boolean> {
  const target = (code || savedLastHostRoom() || '').toUpperCase();
  if (!target) return false;
  const token = savedHostToken(target);
  if (!token) return false;
  return actions.hostAttach(target, token);
}

export function savedLook(): PlayerLook {
  return readJson<PlayerLook>(LS.lastLook) ?? { ...DEFAULT_LOOK };
}

export function saveLook(look: PlayerLook) {
  writeJson(LS.lastLook, look);
}

export function forgetRoom(code: string) {
  try {
    localStorage.removeItem(LS.player(code));
    localStorage.removeItem(LS.host(code));
  } catch {
    /* abaikan */
  }
}

// ------------------------------------------------------------------ socket wiring

let wired = false;

export function initConnection() {
  if (wired) return;
  wired = true;
  const sock = getSocket();

  sock.on('connect', () => {
    set({ status: 'connected', error: null });
    void resync();
  });
  sock.on('disconnect', () => set({ status: 'reconnecting' }));
  sock.io.on('reconnect_attempt', () => set({ status: 'reconnecting' }));
  sock.io.on('error', () => set({ status: 'reconnecting' }));

  sock.on('state', (room: RoomPublicState) => {
    set({ room, clockOffset: room.serverNow - Date.now() });
  });
  sock.on('me', (me: MePrivate) => set({ me }));
  sock.on('kicked', () => {
    const code = state.identity?.code;
    if (code) forgetRoom(code);
    set({ kicked: true, notice: 'Panitia mengeluarkanmu dari permainan ini.' });
  });
  // Host menekan "Minta muat ulang adegan": muat ulang adegan ronde ini saja.
  sock.on('scene:retry', () => set({ sceneNonce: state.sceneNonce + 1 }));
}

/** Pulihkan sesi setelah reconnect: server adalah sumber state. */
async function resync() {
  const { identity, hostToken, room, role } = state;
  const code = identity?.code ?? room?.code;
  if (!code) return;
  if (role === 'host' && hostToken) {
    const res = await rpc<{ state: RoomPublicState }>('host:attach', { code, hostToken });
    if (res.ok && res.data) set({ room: res.data.state });
    return;
  }
  if (identity) {
    const res = await rpc<{ state: RoomPublicState; me: MePrivate }>('player:rejoin', {
      code: identity.code,
      playerToken: identity.playerToken,
    });
    if (res.ok && res.data) set({ room: res.data.state, me: res.data.me });
    return;
  }
  if (role === 'spectator') {
    const res = await rpc<{ state: RoomPublicState }>('spectator:join', { code });
    if (res.ok && res.data) set({ room: res.data.state });
  }
}

// ------------------------------------------------------------------ aksi

export const actions = {
  clearError() {
    set({ error: null });
  },
  clearNotice() {
    set({ notice: null });
  },

  async hostCreate(eventName: string): Promise<{ ok: boolean; code?: string; error?: string }> {
    const res = await rpc<{ code: string; hostToken: string; state: RoomPublicState }>('host:create', {
      eventName,
    });
    if (!res.ok || !res.data) {
      set({ error: res.error ?? 'Gagal membuat room' });
      return { ok: false, error: res.error };
    }
    writeJson(LS.host(res.data.code), res.data.hostToken);
    writeJson(LS.lastHostRoom, res.data.code);
    set({
      role: 'host',
      hostToken: res.data.hostToken,
      room: res.data.state,
      error: null,
      clockOffset: res.data.state.serverNow - Date.now(),
    });
    return { ok: true, code: res.data.code };
  },

  async hostAttach(code: string, hostToken: string): Promise<boolean> {
    const res = await rpc<{ state: RoomPublicState }>('host:attach', { code, hostToken });
    if (!res.ok || !res.data) {
      set({ error: res.error ?? 'Token host tidak valid' });
      return false;
    }
    writeJson(LS.host(code), hostToken);
    writeJson(LS.lastHostRoom, code.toUpperCase());
    set({
      role: 'host',
      hostToken,
      room: res.data.state,
      error: null,
      clockOffset: res.data.state.serverNow - Date.now(),
    });
    return true;
  },

  async hostAction(action: string, extra: Record<string, unknown> = {}): Promise<boolean> {
    const { room, hostToken } = state;
    if (!room || !hostToken) return false;
    const res = await rpc<{ state: RoomPublicState }>('host:action', {
      code: room.code,
      hostToken,
      action,
      ...extra,
    });
    if (!res.ok) {
      set({ error: res.error ?? 'Tindakan gagal' });
      return false;
    }
    if (res.data?.state) set({ room: res.data.state });
    return true;
  },

  async hostSettings(patch: { eventName?: string; autoAdvance?: boolean; prizes?: Partial<Prizes> }) {
    const { room, hostToken } = state;
    if (!room || !hostToken) return false;
    const res = await rpc<{ state: RoomPublicState }>('host:settings', {
      code: room.code,
      hostToken,
      ...patch,
    });
    if (!res.ok) {
      set({ error: res.error ?? 'Pengaturan gagal disimpan' });
      return false;
    }
    if (res.data?.state) set({ room: res.data.state });
    return true;
  },

  async join(
    code: string,
    nickname: string,
    look: PlayerLook,
  ): Promise<{ ok: boolean; error?: string }> {
    const upper = code.trim().toUpperCase();
    const res = await rpc<{
      playerId: string;
      playerToken: string;
      state: RoomPublicState;
      me: MePrivate;
    }>('player:join', { code: upper, nickname, look });
    if (!res.ok || !res.data) {
      set({ error: res.error ?? 'Gagal bergabung' });
      return { ok: false, error: res.error };
    }
    const identity: Identity = {
      code: upper,
      playerId: res.data.playerId,
      playerToken: res.data.playerToken,
      nickname,
      look,
    };
    writeJson(LS.player(upper), identity);
    writeJson(LS.lastPlayerRoom, upper);
    saveLook(look);
    set({
      identity,
      role: 'player',
      room: res.data.state,
      me: res.data.me,
      error: null,
      kicked: false,
      clockOffset: res.data.state.serverNow - Date.now(),
    });
    return { ok: true };
  },

  async rejoin(code: string): Promise<{ ok: boolean; error?: string }> {
    const upper = code.trim().toUpperCase();
    const saved = savedIdentity(upper);
    if (!saved) return { ok: false, error: 'Tidak ada identitas tersimpan untuk room ini' };
    const res = await rpc<{ playerId: string; state: RoomPublicState; me: MePrivate }>('player:rejoin', {
      code: upper,
      playerToken: saved.playerToken,
    });
    if (!res.ok || !res.data) {
      set({ error: res.error ?? 'Gagal menyambung ulang' });
      return { ok: false, error: res.error };
    }
    set({
      identity: { ...saved, nickname: res.data.me.nickname, look: res.data.me.look },
      role: 'player',
      room: res.data.state,
      me: res.data.me,
      error: null,
      kicked: false,
      clockOffset: res.data.state.serverNow - Date.now(),
    });
    return { ok: true };
  },

  async updateLook(nickname: string, look: PlayerLook): Promise<boolean> {
    const { identity } = state;
    if (!identity) return false;
    const res = await rpc<{ me: MePrivate }>('player:look', {
      code: identity.code,
      playerToken: identity.playerToken,
      nickname,
      look,
    });
    if (!res.ok) {
      set({ error: res.error ?? 'Gagal menyimpan karakter' });
      return false;
    }
    const next = { ...identity, nickname, look };
    writeJson(LS.player(identity.code), next);
    saveLook(look);
    set({ identity: next, me: res.data?.me ?? state.me });
    return true;
  },

  async setReady(ready: boolean) {
    const { identity } = state;
    if (!identity) return;
    await rpc('player:ready', { code: identity.code, playerToken: identity.playerToken, ready });
  },

  /**
   * Kirim jawaban final. Mengembalikan hasil acknowledgement server.
   * Pengiriman ulang aman: server menandai duplicate dan tidak menambah skor.
   */
  async submit(
    roundIndex: number,
    answer: MissionAnswer,
  ): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
    const { identity } = state;
    if (!identity) return { ok: false, error: 'Belum bergabung' };
    const res = await rpc<{ accepted: boolean; duplicate: boolean }>('player:submit', {
      code: identity.code,
      playerToken: identity.playerToken,
      roundIndex,
      answer,
    });
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, duplicate: Boolean(res.data?.duplicate) };
  },

  /**
   * Laporkan adegan 3D ronde ini sudah siap di perangkat pemain.
   * Hanya informasi untuk host: server TIDAK memberi tambahan waktu individual.
   */
  async sceneReady(roundIndex: number): Promise<boolean> {
    const { identity } = state;
    if (!identity) return false;
    const res = await rpc<{ accepted: boolean }>('player:sceneReady', {
      code: identity.code,
      playerToken: identity.playerToken,
      roundIndex,
    });
    return res.ok && Boolean(res.data?.accepted);
  },

  async spectate(code: string): Promise<{ ok: boolean; error?: string }> {
    const upper = code.trim().toUpperCase();
    const res = await rpc<{ state: RoomPublicState }>('spectator:join', { code: upper });
    if (!res.ok || !res.data) {
      set({ error: res.error ?? 'Room tidak ditemukan' });
      return { ok: false, error: res.error };
    }
    set({
      role: 'spectator',
      room: res.data.state,
      error: null,
      clockOffset: res.data.state.serverNow - Date.now(),
    });
    return { ok: true };
  },

  async requestState(code: string) {
    const res = await rpc<{ state: RoomPublicState }>('state:request', { code: code.toUpperCase() });
    if (res.ok && res.data) set({ room: res.data.state, clockOffset: res.data.state.serverNow - Date.now() });
    return res.ok;
  },

  leave() {
    const code = state.identity?.code ?? state.room?.code;
    if (code) forgetRoom(code);
    set({ identity: null, me: null, room: null, role: null, kicked: false, error: null });
  },
};

/** Jam server (perkiraan) untuk timer yang tidak bisa dicurangi di client. */
export function serverNow(): number {
  return Date.now() + state.clockOffset;
}
