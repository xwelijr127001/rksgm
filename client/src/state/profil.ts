/**
 * Profil & progres solo, tersimpan DI PERANGKAT INI (localStorage). Tidak pernah dikirim ke server
 * kecuali nama + tampilan saat pemain bergabung ke sebuah room.
 *
 *  raksa:profil = { nickname, look }               "Main sebagai X"
 *  raksa:solo   = { misi: { [id]: CatatanMisi }, rekor }
 *  raksa:solo:rekorLalu = angka; rekor saat "Main lagi" terakhir (untuk tanda "Rekor baru!")
 *
 * Penyimpanan bisa gagal (mode privat, kuota): semua akses dibungkus try/catch dan halaman tetap
 * berjalan dengan nilai bawaan.
 */
import { useSyncExternalStore } from 'react';
import type { PlayerLook } from '@shared/types';

export interface Profil {
  nickname: string;
  look: PlayerLook;
}

export interface CatatanMisi {
  /** Akurasi terbaik 0..1. */
  akurasi: number;
  /** Poin terbaik (dasar + bonus cepat). */
  poin: number;
  /** 0..3, lihat bintangUntuk(). */
  bintang: number;
  /** Berapa kali dicoba. */
  kali: number;
}

export interface ProgresSolo {
  misi: Record<string, CatatanMisi>;
  /** Total poin terbaik yang pernah dicapai di perangkat ini. */
  rekor: number;
}

const KUNCI_PROFIL = 'raksa:profil';
const KUNCI_SOLO = 'raksa:solo';
const KUNCI_REKOR_LALU = 'raksa:solo:rekorLalu';
const KUNCI_LOOK_LAMA = 'raksa:look';

export const LOOK_BAWAAN: PlayerLook = { body: 0, skin: 2, hair: 0, color: 0, accessory: 'jaket' };

const pendengar = new Set<() => void>();
let versi = 0;
function kabari() {
  versi += 1;
  pendengar.forEach((f) => f());
}

/**
 * Cadangan di memori. Bila localStorage diblokir (mode privat tertentu), profil tetap berlaku selama
 * tab ini terbuka; tanpa ini /kenalan -> /solo -> /kenalan berputar karena profil "tidak pernah ada".
 */
const memori = new Map<string, string>();

function baca<T>(kunci: string): T | null {
  let mentah: string | null = null;
  try {
    mentah = localStorage.getItem(kunci);
  } catch {
    /* diblokir: pakai cadangan di bawah */
  }
  if (mentah === null) mentah = memori.get(kunci) ?? null;
  if (!mentah) return null;
  try {
    return JSON.parse(mentah) as T;
  } catch {
    return null;
  }
}

function tulis(kunci: string, nilai: unknown): void {
  const mentah = JSON.stringify(nilai);
  memori.set(kunci, mentah);
  try {
    localStorage.setItem(kunci, mentah);
  } catch {
    /* penyimpanan penuh / diblokir: cadangan memori tetap berlaku, halaman tetap jalan */
  }
}

const AKSESORI: PlayerLook['accessory'][] = ['none', 'helm', 'jaket', 'headset', 'topi'];

function lookSah(v: unknown): v is PlayerLook {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  return ['body', 'skin', 'hair', 'color'].every((k) => Number.isFinite(l[k])) && AKSESORI.includes(l.accessory as PlayerLook['accessory']);
}

/** Profil tersimpan, atau null bila pemain belum pernah "kenalan". */
export function savedProfil(): Profil | null {
  const p = baca<Profil>(KUNCI_PROFIL);
  if (!p || typeof p.nickname !== 'string' || p.nickname.trim().length < 2 || !lookSah(p.look)) return null;
  return { nickname: p.nickname.trim().slice(0, 16), look: p.look };
}

export function simpanProfil(profil: Profil): void {
  const bersih: Profil = { nickname: profil.nickname.trim().slice(0, 16), look: profil.look };
  tulis(KUNCI_PROFIL, bersih);
  // Halaman lama membaca tampilan terakhir dari kunci ini.
  tulis(KUNCI_LOOK_LAMA, bersih.look);
  kabari();
}

export function hapusProfil(): void {
  memori.delete(KUNCI_PROFIL);
  try {
    localStorage.removeItem(KUNCI_PROFIL);
  } catch {
    /* abaikan */
  }
  kabari();
}

/** 3 = semua tepat, 2 = akurasi >= 0,6, 1 = sudah dicoba. */
export function bintangUntuk(akurasi: number): number {
  if (akurasi >= 0.999) return 3;
  if (akurasi >= 0.6) return 2;
  return 1;
}

export function progresSolo(): ProgresSolo {
  const p = baca<ProgresSolo>(KUNCI_SOLO);
  if (!p || typeof p !== 'object' || !p.misi || typeof p.misi !== 'object') return { misi: {}, rekor: 0 };
  return { misi: p.misi, rekor: Number.isFinite(p.rekor) ? p.rekor : 0 };
}

export function totalPoin(p: ProgresSolo): number {
  return Object.values(p.misi).reduce((n, c) => n + (Number.isFinite(c.poin) ? c.poin : 0), 0);
}

/** Catat satu percobaan; yang disimpan adalah hasil TERBAIK per misi. Mengembalikan progres baru. */
export function catatHasilSolo(missionId: string, akurasi: number, poin: number): ProgresSolo {
  const p = progresSolo();
  const lama = p.misi[missionId];
  const lebihBaik = !lama || poin > lama.poin;
  const misi: Record<string, CatatanMisi> = {
    ...p.misi,
    [missionId]: {
      akurasi: Math.max(lama?.akurasi ?? 0, akurasi),
      poin: lebihBaik ? poin : lama.poin,
      bintang: Math.max(lama?.bintang ?? 0, bintangUntuk(akurasi)),
      kali: (lama?.kali ?? 0) + 1,
    },
  };
  const baru: ProgresSolo = { misi, rekor: 0 };
  baru.rekor = Math.max(p.rekor, totalPoin(baru));
  tulis(KUNCI_SOLO, baru);
  kabari();
  return baru;
}

/**
 * "Main lagi": bintang & poin per misi dihapus, rekor pribadi dipertahankan. Rekor saat itu
 * dicatat sebagai "rekor yang harus dipecahkan" putaran berikutnya (lihat rekorLalu()).
 */
export function ulangSolo(): void {
  const rekor = progresSolo().rekor;
  tulis(KUNCI_REKOR_LALU, rekor);
  tulis(KUNCI_SOLO, { misi: {}, rekor });
  kabari();
}

/**
 * Rekor yang harus dipecahkan pada putaran ini: rekor pribadi saat "Main lagi" terakhir ditekan.
 * 0 = putaran pertama di perangkat ini (belum ada rekor lama untuk dipecahkan).
 */
export function rekorLalu(): number {
  const n = baca<number>(KUNCI_REKOR_LALU);
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

function langganan(f: () => void) {
  pendengar.add(f);
  return () => pendengar.delete(f);
}

/** Render ulang saat profil/progres berubah (di tab ini). */
export function useProfil(): { profil: Profil | null; progres: ProgresSolo } {
  useSyncExternalStore(langganan, () => versi, () => 0);
  return { profil: savedProfil(), progres: progresSolo() };
}
