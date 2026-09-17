/**
 * Lapisan pesan JS <-> Unity untuk RAKSA GAME.
 *
 * - Pesan ke Unity diantrekan bila Unity belum mengirim 'unityReady'.
 *   Pengecualian: 'initialize' adalah jabat tangan yang MEMICU unityReady,
 *   jadi ia dikirim begitu instance tersedia (kalau diantrekan, Unity tidak
 *   akan pernah siap - lihat RaksaBridge.Receive di sisi C#).
 * - Pesan dari Unity adalah DATA, bukan perintah. Divalidasi, lalu pesan dari
 *   misi/ronde lama dibuang. Skor tetap dihitung server.
 *
 * Catatan impor: memakai path relatif ke shared/ (bukan alias @shared) supaya
 * bridge.test.ts bisa dijalankan langsung dengan tsx dari root repo.
 */

import {
  parseFromUnity,
  pesanMasihRelevan,
  type FromUnityMessage,
  type ToUnityMessage,
} from '../../../shared/unityBridge';
import { unityRuntime } from './unityLoader';

export type UnityEventHandler = (msg: FromUnityMessage) => void;

/** Bentuk minimal instance Unity (dapat di-mock pada tes). */
interface UnityInstanceLike {
  SendMessage(objectName: string, methodName: string, value: string): void;
}

/** Bentuk minimal objek global yang dipakai bridge (dapat di-mock pada tes). */
interface UnityGlobalLike {
  RaksaUnityReceive?: (json: string) => void;
  __raksaUnityQueue?: unknown[];
}

interface Antre {
  tipe: ToUnityMessage['type'];
  json: string;
}

/** ponytail: antrean dibatasi; kalau penuh, pesan tertua dibuang. */
const MAKS_ANTREAN = 60;

let konteks: { missionId: string | null; roundIndex: number | null } = {
  missionId: null,
  roundIndex: null,
};
let handlers = new Set<UnityEventHandler>();
let antrean: Antre[] = [];
let siap = false;
let instanceUji: UnityInstanceLike | null = null;
let globalUji: UnityGlobalLike | null = null;
let terpasang = false;
let lepasRuntime: (() => void) | null = null;

function objekGlobal(): UnityGlobalLike | null {
  if (globalUji) return globalUji;
  return typeof window !== 'undefined' ? (window as unknown as UnityGlobalLike) : null;
}

function kirimMentah(json: string): boolean {
  if (instanceUji) {
    try {
      instanceUji.SendMessage('RaksaBridge', 'Receive', json);
      return true;
    } catch (e) {
      console.warn('[bridge] gagal mengirim ke Unity:', e);
      return false;
    }
  }
  return unityRuntime.send(json);
}

function kuras(): void {
  const sisa: Antre[] = [];
  for (const item of antrean) {
    if (kirimMentah(item.json)) continue;
    sisa.push(item);
  }
  antrean = sisa;
}

/** Kirim jabat tangan yang masih tertahan (tanpa menunggu unityReady). */
function kurasHandshake(): void {
  const sisa: Antre[] = [];
  for (const item of antrean) {
    if (item.tipe === 'initialize' && kirimMentah(item.json)) continue;
    sisa.push(item);
  }
  antrean = sisa;
}

function terima(json: string): void {
  const hasil = parseFromUnity(json);
  if (!hasil.ok) {
    console.warn('[bridge] pesan Unity dibuang:', hasil.alasan);
    return;
  }
  const msg = hasil.msg;
  if (msg.type === 'unityReady') {
    siap = true;
    kuras();
  }
  if (!pesanMasihRelevan(msg, konteks)) return;
  for (const h of [...handlers]) {
    try {
      h(msg);
    } catch (e) {
      console.warn('[bridge] handler pesan Unity gagal:', e);
    }
  }
}

function pasang(): void {
  if (terpasang) return;
  const g = objekGlobal();
  if (!g) return;
  terpasang = true;
  g.RaksaUnityReceive = terima;
  // Pesan yang sudah mengantre di jslib sebelum handler terpasang.
  const tertahan = g.__raksaUnityQueue;
  g.__raksaUnityQueue = [];
  if (Array.isArray(tertahan)) {
    for (const item of tertahan) {
      if (typeof item === 'string') terima(item);
      else console.warn('[bridge] antrean Unity berisi data tidak sah');
    }
  }
  if (!instanceUji && !lepasRuntime) {
    lepasRuntime = unityRuntime.subscribe((s) => {
      if (s === 'ready') kurasHandshake();
    });
  }
}

/** Kirim satu pesan ke Unity (diantrekan bila Unity belum siap). */
export function sendToUnity(msg: ToUnityMessage): void {
  pasang();
  const json = JSON.stringify(msg);
  if ((siap || msg.type === 'initialize') && kirimMentah(json)) return;
  if (antrean.length >= MAKS_ANTREAN) antrean.shift();
  antrean.push({ tipe: msg.type, json });
}

export const unityBridge = {
  /** Konteks misi aktif; pesan dari misi/ronde lain akan dibuang. */
  setContext(ctx: { missionId: string | null; roundIndex: number | null }): void {
    konteks = { missionId: ctx.missionId, roundIndex: ctx.roundIndex };
  },
  send: sendToUnity,
  on(handler: UnityEventHandler): void {
    pasang();
    handlers.add(handler);
  },
  off(handler: UnityEventHandler): void {
    handlers.delete(handler);
  },
  dispose(): void {
    const g = objekGlobal();
    if (g && g.RaksaUnityReceive === terima) delete g.RaksaUnityReceive;
    lepasRuntime?.();
    lepasRuntime = null;
    handlers = new Set();
    antrean = [];
    siap = false;
    terpasang = false;
    instanceUji = null;
    globalUji = null;
    konteks = { missionId: null, roundIndex: null };
  },
  /** Hanya untuk tes: suntik instance Unity & objek global tiruan. */
  __setInstanceForTest(instance: UnityInstanceLike | null, globalObj?: UnityGlobalLike): void {
    instanceUji = instance;
    if (globalObj) globalUji = globalObj;
    pasang();
  },
};
