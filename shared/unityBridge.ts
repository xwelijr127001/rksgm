/**
 * Kontrak pesan JavaScript <-> Unity untuk RAKSA GAME.
 *
 * Aturan penting:
 * - Server tetap sumber kebenaran. Unity TIDAK menghitung skor.
 * - Setiap pesan yang berkaitan dengan misi WAJIB membawa missionId + roundIndex
 *   supaya penerima bisa menolak pesan dari misi/ronde lama.
 * - ID objek di Unity memakai ID dari data misi (shared/missions.ts), sehingga
 *   pilihan dari canvas dan pilihan dari kontrol HTML mengisi draft jawaban yang sama.
 * - Kunci jawaban tidak pernah dikirim ke Unity.
 */

import type { Phase, PlayerLook, SceneKey } from './types';

/** Naikkan bila bentuk pesan berubah supaya versi lama ditolak dengan jelas. */
export const BRIDGE_VERSION = 1;

/** Nama objek/anchor di scene Unity. Harus stabil & sama di kedua sisi. */
export function anchorId(stepId: string, optionId: string): string {
  return `${stepId}:${optionId}`;
}

export function parseAnchorId(anchor: string): { stepId: string; optionId: string } | null {
  const i = anchor.indexOf(':');
  if (i <= 0 || i === anchor.length - 1) return null;
  return { stepId: anchor.slice(0, i), optionId: anchor.slice(i + 1) };
}

/** Jenis interaksi objek di scene, menentukan bentuk penanda & respons tap. */
export type BridgeObjectKind = 'hotspot' | 'bukti' | 'dokumen' | 'kasus' | 'angka';

/** Satu objek yang dapat diketuk di dalam scene. */
export interface BridgeObject {
  stepId: string;
  optionId: string;
  /** Label singkat untuk penanda & aksesibilitas (bukan kunci jawaban). */
  label: string;
  kind: BridgeObjectKind;
  /** Nama anchor di scene; default anchorId(stepId, optionId). */
  anchor?: string;
  /** true bila opsi ini boleh dipilih bersamaan dengan opsi lain pada langkah yang sama. */
  multi: boolean;
}

/** Pilihan pemain saat ini untuk satu langkah (dipakai restoreSelections). */
export interface BridgeSelection {
  stepId: string;
  /** Opsi yang sedang dipilih. Untuk assign: optionId = itemId, bucketId terisi. */
  optionIds: string[];
  /** Untuk langkah assign: pasangan item -> bucket. */
  assign?: Record<string, string>;
  /** Untuk langkah number. */
  angka?: number | null;
}

export type CameraView = 'default' | 'depan' | 'kiri' | 'kanan' | 'atas';

export type FeedbackKind = 'benar' | 'salah' | 'netral' | 'selesai' | 'kirim';

export type QualityTier = 'auto' | 'tinggi' | 'ringan';

// ---------------------------------------------------------------- React -> Unity

export type ToUnityMessage =
  | {
      type: 'initialize';
      version: number;
      reducedMotion: boolean;
      quality: QualityTier;
      /** Batas devicePixelRatio yang boleh dipakai Unity. */
      maxDpr: number;
    }
  | { type: 'setPlayerAppearance'; look: PlayerLook }
  | {
      type: 'loadMission';
      missionId: string;
      roundIndex: number;
      scene: SceneKey;
      /** Judul & instruksi hanya untuk penanda di scene, bukan kunci jawaban. */
      title: string;
      objects: BridgeObject[];
    }
  | { type: 'setPhase'; missionId: string; roundIndex: number; phase: Phase }
  | {
      type: 'restoreSelections';
      missionId: string;
      roundIndex: number;
      selections: BridgeSelection[];
    }
  | { type: 'setInteractionEnabled'; missionId: string; roundIndex: number; enabled: boolean }
  | {
      type: 'showFeedback';
      missionId: string;
      roundIndex: number;
      kind: FeedbackKind;
      stepId?: string;
      optionId?: string;
    }
  | { type: 'setCameraView'; missionId: string; roundIndex: number; view: CameraView }
  | { type: 'setReducedMotion'; reducedMotion: boolean }
  | { type: 'setQuality'; quality: QualityTier; maxDpr: number }
  | { type: 'ping'; nonce: number };

// ---------------------------------------------------------------- Unity -> React

export type FromUnityMessage =
  | { type: 'unityReady'; version: number }
  | { type: 'missionReady'; missionId: string; roundIndex: number }
  | {
      type: 'objectSelected';
      missionId: string;
      roundIndex: number;
      stepId: string;
      optionId: string;
      /** Untuk langkah assign: bucket tujuan. */
      bucketId?: string;
    }
  | {
      type: 'evidenceToggled';
      missionId: string;
      roundIndex: number;
      stepId: string;
      optionId: string;
      added: boolean;
    }
  | { type: 'cameraViewChanged'; missionId: string; roundIndex: number; view: CameraView }
  | { type: 'sfx'; name: string }
  | {
      type: 'interactionError';
      code: 'misi-tidak-dikenal' | 'objek-tidak-dikenal' | 'fase-salah' | 'scene-gagal' | 'lain';
      message: string;
      missionId?: string;
      roundIndex?: number;
    }
  | { type: 'pong'; nonce: number };

// ---------------------------------------------------------------- validasi

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const FROM_UNITY_TYPES = new Set([
  'unityReady',
  'missionReady',
  'objectSelected',
  'evidenceToggled',
  'cameraViewChanged',
  'sfx',
  'interactionError',
  'pong',
]);

/**
 * Validasi pesan dari Unity. Mengembalikan pesan yang sudah bertipe, atau
 * alasan penolakan. Pesan dari Unity adalah DATA, bukan perintah: jangan
 * pernah memakainya untuk menentukan benar/salah atau skor.
 */
export function parseFromUnity(raw: unknown): { ok: true; msg: FromUnityMessage } | { ok: false; alasan: string } {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, alasan: 'bukan JSON yang sah' };
    }
  }
  if (!isObj(data)) return { ok: false, alasan: 'bukan objek' };
  const type = data.type;
  if (typeof type !== 'string' || !FROM_UNITY_TYPES.has(type)) {
    return { ok: false, alasan: `type tidak dikenal: ${String(type)}` };
  }

  const butuhMisi = (): string | null => {
    if (typeof data.missionId !== 'string' || data.missionId.length === 0) return 'missionId kosong';
    if (!Number.isInteger(data.roundIndex)) return 'roundIndex bukan bilangan bulat';
    return null;
  };

  switch (type) {
    case 'unityReady':
      if (!Number.isInteger(data.version)) return { ok: false, alasan: 'version tidak sah' };
      break;
    case 'pong':
      if (!Number.isInteger(data.nonce)) return { ok: false, alasan: 'nonce tidak sah' };
      break;
    case 'sfx':
      if (typeof data.name !== 'string' || data.name.length > 40) return { ok: false, alasan: 'nama sfx tidak sah' };
      break;
    case 'interactionError':
      if (typeof data.code !== 'string' || typeof data.message !== 'string') {
        return { ok: false, alasan: 'interactionError tidak lengkap' };
      }
      break;
    case 'missionReady':
    case 'cameraViewChanged': {
      const e = butuhMisi();
      if (e) return { ok: false, alasan: e };
      break;
    }
    case 'objectSelected':
    case 'evidenceToggled': {
      const e = butuhMisi();
      if (e) return { ok: false, alasan: e };
      if (typeof data.stepId !== 'string' || !data.stepId) return { ok: false, alasan: 'stepId kosong' };
      if (typeof data.optionId !== 'string' || !data.optionId) return { ok: false, alasan: 'optionId kosong' };
      if (type === 'evidenceToggled' && typeof data.added !== 'boolean') {
        return { ok: false, alasan: 'added bukan boolean' };
      }
      if (type === 'objectSelected' && data.bucketId !== undefined && typeof data.bucketId !== 'string') {
        return { ok: false, alasan: 'bucketId tidak sah' };
      }
      break;
    }
  }

  return { ok: true, msg: data as unknown as FromUnityMessage };
}

/** Pesan hanya relevan bila misi & ronde-nya sama dengan yang sedang berjalan. */
export function pesanMasihRelevan(
  msg: FromUnityMessage,
  kini: { missionId: string | null; roundIndex: number | null },
): boolean {
  if (!('missionId' in msg) || msg.missionId === undefined) return true;
  if (kini.missionId === null || kini.roundIndex === null) return false;
  return msg.missionId === kini.missionId && msg.roundIndex === kini.roundIndex;
}

/** Fase yang mengizinkan pemain berinteraksi dengan scene. */
export function faseBolehInteraksi(phase: Phase): boolean {
  return phase === 'ACTIVE' || phase === 'TUTORIAL';
}
