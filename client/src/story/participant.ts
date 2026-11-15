/**
 * Participant session for one Story Room (no account): the server returns a room-scoped credential on join, kept in
 * this device's localStorage under the room code so a refresh or reconnect resumes the CURRENT round (never by name).
 * The store only mirrors server snapshots; it never decides timing, correctness or score.
 */
import { useSyncExternalStore } from 'react';
import type { StoryAck, StoryErrorCode, StoryFinalSummary, StoryJoinResult, StoryPrivateState, StoryPublicState } from '@shared/story/protocol';
import { serverUrl } from './base';
import { ServerClock } from './clock';
import { storyRpc, storySocket } from './net';

export interface ParticipantSession {
  code: string;
  participantId: string;
  credential: string;
  name: string;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export interface ParticipantState {
  connection: ConnectionStatus;
  session: ParticipantSession | null;
  room: StoryPublicState | null;
  me: StoryPrivateState | null;
  /** The host removed this participant. */
  removed: boolean;
  /** Why the stored session could not be resumed (room gone, credential unknown). */
  lost: { code: StoryErrorCode; error: string } | null;
}

const STORAGE_PREFIX = 'raksa:story:sesi:';
const clock = new ServerClock();
const listeners = new Set<() => void>();
let state: ParticipantState = { connection: 'idle', session: null, room: null, me: null, removed: false, lost: null };
let wired = false;

function set(patch: Partial<ParticipantState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function savedSession(code: string): ParticipantSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + code);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ParticipantSession>;
    if (typeof v.participantId !== 'string' || typeof v.credential !== 'string' || typeof v.name !== 'string') return null;
    return { code, participantId: v.participantId, credential: v.credential, name: v.name };
  } catch {
    return null;
  }
}

function saveSession(s: ParticipantSession): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + s.code, JSON.stringify({ participantId: s.participantId, credential: s.credential, name: s.name }));
  } catch {
    /* storage blocked: the session still works until this tab closes */
  }
}

export function forgetSession(code: string): void {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + code);
  } catch {
    /* ignore */
  }
}

function wire(): void {
  if (wired) return;
  wired = true;
  const socket = storySocket();
  set({ connection: socket.connected ? 'connected' : 'connecting' });
  socket.on('connect', () => {
    set({ connection: 'connected' });
    // After a drop the server has unbound this socket: resume with the credential (same round, elapsed time kept).
    const s = state.session;
    // Not after the room is known to be gone (finished/interrupted/unknown): retrying would only burn the shared
    // failed-lookup budget of everyone behind the same network.
    if (s && !state.removed && !state.lost) void resume(s.code);
  });
  socket.on('disconnect', () => set({ connection: 'reconnecting' }));
  socket.io.on('reconnect_attempt', () => set({ connection: 'reconnecting' }));
  socket.on('story:public', (room: StoryPublicState) => {
    if (!state.session || room.code !== state.session.code) return;
    clock.sample(room.serverNow);
    set({ room });
  });
  socket.on('story:private', (me: StoryPrivateState) => {
    if (!state.session || me.participantId !== state.session.participantId) return;
    set({ me });
  });
  socket.on('story:removed', (p: { code?: string }) => {
    if (!state.session || p.code !== state.session.code) return;
    set({ removed: true });
  });
}

function adopt(session: ParticipantSession, room: StoryPublicState, me: StoryPrivateState): void {
  clock.sample(room.serverNow);
  set({ session, room, me, removed: false, lost: null });
}

export async function joinRoom(code: string, name: string): Promise<StoryAck<StoryJoinResult>> {
  wire();
  const res = await storyRpc<StoryJoinResult>(storySocket(), 'participant:join', { code, name, acceptNotice: true });
  if (res.ok) {
    const session: ParticipantSession = { code: res.data.state.code, participantId: res.data.participantId, credential: res.data.credential, name: res.data.me.name };
    saveSession(session);
    adopt(session, res.data.state, res.data.me);
  }
  return res;
}

/** Resume the stored session for `code` (refresh, reconnect, coming back after leaving). */
export async function resume(code: string): Promise<boolean> {
  wire();
  const stored = savedSession(code);
  if (!stored) {
    set({ lost: { code: 'unauthorized', error: 'Belum bergabung di room ini dari perangkat ini.' } });
    return false;
  }
  const res = await storyRpc<{ participantId: string; state: StoryPublicState; me: StoryPrivateState }>(storySocket(), 'participant:resume', {
    code,
    credential: stored.credential,
  });
  if (!res.ok) {
    if (res.code === 'forbidden') {
      set({ session: stored, removed: true });
      return false;
    }
    // A finished room may already be gone from memory: its result stays readable over REST with the credential.
    if (res.code !== 'rate_limited') set({ session: stored, room: null, me: null, lost: { code: res.code, error: res.error } });
    return false;
  }
  adopt({ ...stored, name: res.data.me.name }, res.data.state, res.data.me);
  return true;
}

export function answer(option: string): Promise<StoryAck<{ roundId: string; receivedAt: number; elapsedMs: number; duplicate: boolean }>> {
  const roundId = state.room?.scene?.roundId;
  return storyRpc(storySocket(), 'participant:answer', { roundId, option });
}

export function markReady(roundId: string): Promise<StoryAck<{ ready: boolean }>> {
  return storyRpc(storySocket(), 'participant:ready', { roundId });
}

export async function rename(name: string): Promise<StoryAck<{ name: string }>> {
  const res = await storyRpc<{ name: string }>(storySocket(), 'participant:rename', { name });
  if (res.ok && state.session) {
    const session = { ...state.session, name: res.data.name };
    saveSession(session);
    set({ session });
  }
  return res;
}

/** Leave the room screen. The credential stays on this device, so the participant can come back while it runs. */
export async function leaveRoom(): Promise<void> {
  if (state.session) await storyRpc(storySocket(), 'participant:leave', {}, 3000);
  set({ session: null, room: null, me: null, removed: false, lost: null });
}

/** Personal result of a closed room (live or persisted), authorized by the stored credential. */
export async function fetchResult(code: string): Promise<{ ok: true; summary: StoryFinalSummary } | { ok: false; status: number; error: string }> {
  const stored = savedSession(code);
  if (!stored) return { ok: false, status: 401, error: 'Belum bergabung di room ini dari perangkat ini.' };
  try {
    const r = await fetch(serverUrl(`/api/story/rooms/${encodeURIComponent(code)}/result`), { headers: { 'x-story-credential': stored.credential, accept: 'application/json' } });
    const json = (await r.json()) as { ok?: boolean; summary?: StoryFinalSummary; error?: string };
    if (r.ok && json.ok && json.summary) return { ok: true, summary: json.summary };
    return { ok: false, status: r.status, error: json.error ?? 'Hasil belum bisa dibuka.' };
  } catch {
    return { ok: false, status: 0, error: 'Server tidak bisa dihubungi.' };
  }
}

export function participantServerNow(): number {
  return clock.now();
}

export function participantState(): ParticipantState {
  return state;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useParticipant(): ParticipantState {
  return useSyncExternalStore(subscribe, participantState, participantState);
}
