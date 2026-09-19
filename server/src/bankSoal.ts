/**
 * REGISTRI BANK SOAL - SERVER ONLY. Satu pintu untuk mencari misi + kunci berdasarkan id:
 *   latihan  shared/missions.ts        + ./answerKeys.ts
 *   acara    shared/missions.acara.ts  + ./acara/
 *   kustom   tabel SQLite soal_kustom  -> ./bankKustom.ts (berkas ini sengaja TANPA DB & config,
 *            supaya rooms.ts tetap bisa dipakai/diuji tanpa membuka SQLite atau membaca .env)
 *
 * `EntriSoal` MEMUAT KUNCI. Yang boleh keluar dari server hanya: `misi` (tanpa kunci),
 * `RingkasSoal`, dan pembahasan saat REVEAL. Kontrak: docs/rancangan-bank-soal.md bagian 3.
 */

import { BATAS_PLAYLIST, type AsalSoal, type IdPaket, type RingkasSoal, type Tingkat } from '../../shared/bankSoal';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../shared/missions';
import { MISSIONS_ACARA } from '../../shared/missions.acara';
import type { MissionKey } from '../../shared/scoring';
import type { MissionPublic } from '../../shared/types';
import { KUNCI_ACARA } from './acara';
import { MISSION_KEYS, TIEBREAK_KEY, TUTORIAL_KEY } from './answerKeys';

export interface EntriSoal {
  misi: MissionPublic;
  kunci: MissionKey;
  asal: AsalSoal;
}

/** Pencari soal berdasarkan id. Room menerimanya lewat konstruktor supaya bisa diuji tanpa DB. */
export type PencariSoal = (id: string) => EntriSoal | undefined;

/** Tingkat bawaan menurut posisi di paket (10 soal): 1-3 mudah, 4-7 sedang, 8-10 sulit. */
export function tingkatPosisi(posisi: number): Tingkat {
  if (posisi <= 2) return 1;
  if (posisi <= 6) return 2;
  return 3;
}

let bawaan: Map<string, EntriSoal> | null = null;

/** Paket bawaan tidak berubah selama proses hidup, jadi cukup disusun sekali. */
function entriBawaan(): Map<string, EntriSoal> {
  if (bawaan) return bawaan;
  const peta = new Map<string, EntriSoal>();
  const muat = (misiPaket: MissionPublic[], kunciPaket: MissionKey[], asal: IdPaket) => {
    misiPaket.forEach((m, i) => {
      const kunci = kunciPaket.find((k) => k.missionId === m.id);
      // Misi tanpa kunci tidak bisa dinilai: tidak masuk bank (assertKeysComplete menangkapnya saat boot).
      if (!kunci) return;
      peta.set(m.id, { misi: { ...m, level: m.level ?? tingkatPosisi(i) }, kunci, asal });
    });
  };
  muat(MISSIONS, MISSION_KEYS, 'latihan');
  muat(MISSIONS_ACARA, KUNCI_ACARA, 'acara');
  bawaan = peta;
  return peta;
}

/** Urutan id satu paket bawaan (hanya soal yang punya kunci). */
export function idPaket(paket: IdPaket): string[] {
  const sumber = paket === 'acara' ? MISSIONS_ACARA : MISSIONS;
  const peta = entriBawaan();
  return sumber.map((m) => m.id).filter((id) => peta.has(id));
}

/** Playlist room baru: paket yang diminta; paket kosong (acara belum diisi) jatuh ke latihan. */
export function playlistPaket(paket: IdPaket): string[] {
  const ids = idPaket(paket);
  return ids.length ? ids : idPaket('latihan');
}

/** Cari soal di paket bawaan (latihan + acara). Pencari lengkap (dengan soal kustom): bankKustom.ts. */
export const cariSoalBawaan: PencariSoal = (id) => (typeof id === 'string' ? entriBawaan().get(id) : undefined);

/** Semua soal paket bawaan, urut paket. */
export function semuaSoalBawaan(): EntriSoal[] {
  return [...entriBawaan().values()];
}

/**
 * Soal yang boleh dinilai /api/practice/grade: HANYA paket latihan + tutorial (+ ronde penentuan
 * bila diizinkan). Paket acara & soal kustom sengaja tidak bisa: kuncinya tidak boleh terpancing.
 */
export function soalLatihan(id: unknown, opsi: { penentuan?: boolean } = {}): EntriSoal | undefined {
  if (typeof id !== 'string') return undefined;
  if (id === TUTORIAL_MISSION.id) return { misi: TUTORIAL_MISSION, kunci: TUTORIAL_KEY, asal: 'latihan' };
  if (id === TIEBREAK_MISSION.id) {
    return opsi.penentuan ? { misi: TIEBREAK_MISSION, kunci: TIEBREAK_KEY, asal: 'latihan' } : undefined;
  }
  const e = entriBawaan().get(id);
  return e && e.asal === 'latihan' ? e : undefined;
}

/** Misi paket latihan untuk /api/missions (tanpa kunci), lengkap dengan tingkat. */
export function misiLatihan(): MissionPublic[] {
  const peta = entriBawaan();
  return MISSIONS.map((m) => peta.get(m.id)?.misi ?? m);
}

export function ringkas(e: EntriSoal): RingkasSoal {
  return {
    id: e.misi.id,
    judul: e.misi.title,
    produk: e.misi.product,
    tingkat: e.misi.level ?? 2,
    asal: e.asal,
    langkah: e.misi.steps.length,
    durasi: e.misi.durationSeconds,
    gambar: e.misi.image?.src ?? null,
  };
}

// Teks galat playlist: tetap (tanpa parameter) supaya client bisa menerjemahkannya lewat kamus `server`.
export const GALAT_PLAYLIST = {
  bentuk: 'Playlist harus berupa daftar id soal',
  jumlah: `Playlist harus berisi ${BATAS_PLAYLIST.min} sampai ${BATAS_PLAYLIST.maks} soal`,
  ganda: 'Playlist tidak boleh memuat soal yang sama dua kali',
  takDikenal: 'Ada soal di playlist yang tidak ada di bank soal',
  bukanLobby: 'Playlist hanya bisa diubah saat lobby',
  kosong: 'Playlist kosong. Pilih minimal 1 soal.',
} as const;

/** Periksa playlist kiriman host. Melempar Error berpesan Indonesia bila tidak sah. */
export function periksaPlaylist(raw: unknown, cari: PencariSoal): string[] {
  if (!Array.isArray(raw) || raw.some((x) => typeof x !== 'string')) throw new Error(GALAT_PLAYLIST.bentuk);
  const ids = raw as string[];
  if (ids.length < BATAS_PLAYLIST.min || ids.length > BATAS_PLAYLIST.maks) throw new Error(GALAT_PLAYLIST.jumlah);
  if (new Set(ids).size !== ids.length) throw new Error(GALAT_PLAYLIST.ganda);
  if (ids.some((id) => !cari(id))) throw new Error(GALAT_PLAYLIST.takDikenal);
  return [...ids];
}
