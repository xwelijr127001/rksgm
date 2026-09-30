/**
 * Profil & progres solo, tersimpan DI PERANGKAT INI (localStorage). Tidak pernah dikirim ke server
 * kecuali nama + tampilan saat pemain bergabung ke sebuah room.
 *
 *  raksa:profil = { nickname, look }               "Main sebagai X"
 *  raksa:solo   = { versi: 2, misi: { [id]: CatatanMisi }, rekor }
 *  raksa:solo:rekorLalu = angka; rekor saat "Main lagi" terakhir (untuk tanda "Rekor baru!")
 *  raksa:solo:cadangan-v1   = teks mentah raksa:solo format lama, disimpan SEKALI sebelum migrasi
 *  raksa:solo:cadangan-rusak = teks mentah raksa:solo yang tidak terbaca, disimpan SEKALI sebelum ditimpa
 *
 * Arti bintang (versi 2, docs/rancangan-mode-cerita.md bagian 5E): bintang = KETEPATAN TERBAIK per
 * misi (lihat bintangUntuk). "Sudah dicoba" = catatan misinya ADA; itu tanda terpisah, bukan bintang.
 * Format lama (tanpa field `versi`) memberi 1 bintang untuk sekadar mencoba; saat dibaca, progres
 * lama dimigrasi: bintang dihitung ulang dari akurasi tersimpan, akurasi/poin/kali/rekor tidak diubah.
 *
 * Penyimpanan bisa gagal (mode privat, kuota): semua akses dibungkus try/catch dan halaman tetap
 * berjalan dengan nilai bawaan. Data mentah tidak pernah dihapus diam-diam: yang lama/rusak
 * dicadangkan dulu, entri misi yang tidak terbaca ikut ditulis ulang apa adanya.
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
  /** 0..3 = ketepatan terbaik, selalu bintangUntuk(akurasi). Ada catatan = misi sudah dicoba. */
  bintang: number;
  /** Berapa kali dicoba. */
  kali: number;
}

export interface ProgresSolo {
  /** Versi format (VERSI_SOLO). Progres dari progresSolo()/catatHasilSolo() selalu versi terbaru. */
  versi?: number;
  misi: Record<string, CatatanMisi>;
  /** Total poin terbaik yang pernah dicapai di perangkat ini. */
  rekor: number;
}

/** 1 = lama (tanpa field versi; 1 bintang = sudah dicoba). 2 = bintang berarti ketepatan terbaik. */
export const VERSI_SOLO = 2;

const KUNCI_PROFIL = 'raksa:profil';
const KUNCI_SOLO = 'raksa:solo';
const KUNCI_REKOR_LALU = 'raksa:solo:rekorLalu';
const KUNCI_CADANGAN_V1 = 'raksa:solo:cadangan-v1';
const KUNCI_CADANGAN_RUSAK = 'raksa:solo:cadangan-rusak';
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

/** Khusus tes unit: lupakan cadangan memori (tiap tes mulai dari penyimpanan kosong). */
export function kosongkanMemoriUntukTes(): void {
  memori.clear();
}

function bacaMentah(kunci: string): string | null {
  let mentah: string | null = null;
  try {
    mentah = localStorage.getItem(kunci);
  } catch {
    /* diblokir: pakai cadangan di bawah */
  }
  if (mentah === null) mentah = memori.get(kunci) ?? null;
  return mentah;
}

function baca<T>(kunci: string): T | null {
  const mentah = bacaMentah(kunci);
  if (!mentah) return null;
  try {
    return JSON.parse(mentah) as T;
  } catch {
    return null;
  }
}

/** Tulis teks apa adanya. true = tersimpan di localStorage (bukan hanya di memori tab ini). */
function tulisMentah(kunci: string, mentah: string): boolean {
  memori.set(kunci, mentah);
  try {
    localStorage.setItem(kunci, mentah);
    return true;
  } catch {
    /* penyimpanan penuh / diblokir: cadangan memori tetap berlaku, halaman tetap jalan */
    return false;
  }
}

function tulis(kunci: string, nilai: unknown): void {
  tulisMentah(kunci, JSON.stringify(nilai));
}

/**
 * Simpan teks mentah ke kunci cadangan SEKALI: cadangan yang sudah ada tidak pernah ditimpa.
 * true = cadangan aman: sudah ada / baru tersimpan di localStorage, atau penyimpanan diblokir total
 * (semua data memang hanya di memori tab ini). false = localStorage menolak menulis (kuota penuh).
 */
function cadangkanSekali(kunci: string, mentah: string): boolean {
  let ada: string | null;
  try {
    ada = localStorage.getItem(kunci);
  } catch {
    if (!memori.has(kunci)) memori.set(kunci, mentah);
    return true;
  }
  if (ada !== null) return true;
  return tulisMentah(kunci, mentah);
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

/**
 * Bintang = KETEPATAN (bukan "sudah mencoba"): 3 = semua tepat (>= 0,999), 2 = sebagian besar
 * (>= 0,6), 1 = ada yang tepat (> 0), 0 = belum ada yang tepat. Sudah dicoba = catatan misi ada.
 * Ambang 0,6 diberi toleransi pembulatan (rata-rata berbobot 0,6 bisa jadi 0,59999...).
 */
export function bintangUntuk(akurasi: number): number {
  if (!Number.isFinite(akurasi) || akurasi <= 0) return 0;
  if (akurasi >= 0.999) return 3;
  if (akurasi >= 0.6 - 1e-9) return 2;
  return 1;
}

/** Hasil membaca raksa:solo apa adanya (belum ditulis ulang). */
interface BacaanSolo {
  /** Teks mentah tersimpan; null/'' = belum ada. */
  mentah: string | null;
  /** kosong = belum ada; rusak = tidak terbaca (JSON rusak / bentuk salah); v1 = perlu migrasi; v2 = terbaru. */
  format: 'kosong' | 'rusak' | 'v1' | 'v2';
  /** Progres yang tampil (sudah bermakna versi terbaru). */
  progres: ProgresSolo;
  /** Entri misi yang tidak terbaca: dilewati di tampilan, tetapi ikut ditulis ulang apa adanya. */
  rusak: Record<string, unknown>;
}

function angkaSah(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Satu entri misi -> CatatanMisi bermakna baru, atau null bila tidak terbaca (tanpa akurasi yang sah). */
function catatanSah(v: unknown): CatatanMisi | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const c = v as Record<string, unknown>;
  if (!angkaSah(c.akurasi)) return null;
  return {
    akurasi: c.akurasi,
    poin: angkaSah(c.poin) ? c.poin : 0,
    // Selalu dihitung dari akurasi: tahan terhadap progres lama & tab lama yang masih memakai arti lama.
    bintang: bintangUntuk(c.akurasi),
    kali: angkaSah(c.kali) && c.kali >= 1 ? c.kali : 1,
  };
}

function bacaSolo(): BacaanSolo {
  const kosong = (): ProgresSolo => ({ versi: VERSI_SOLO, misi: {}, rekor: 0 });
  const mentah = bacaMentah(KUNCI_SOLO);
  if (!mentah) return { mentah, format: 'kosong', progres: kosong(), rusak: {} };
  let data: unknown;
  try {
    data = JSON.parse(mentah);
  } catch {
    return { mentah, format: 'rusak', progres: kosong(), rusak: {} };
  }
  const d = (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
  const isi = d.misi;
  if (!isi || typeof isi !== 'object' || Array.isArray(isi)) return { mentah, format: 'rusak', progres: kosong(), rusak: {} };
  const misi: Record<string, CatatanMisi> = {};
  const rusak: Record<string, unknown> = {};
  for (const [id, v] of Object.entries(isi)) {
    const c = catatanSah(v);
    if (c) misi[id] = c;
    else rusak[id] = v;
  }
  // Versi lebih baru dari yang dikenal (mis. sesudah rollback build) dibaca sebaik mungkin, tidak dimigrasi.
  const format = angkaSah(d.versi) && d.versi >= VERSI_SOLO ? 'v2' : 'v1';
  return { mentah, format, progres: { versi: VERSI_SOLO, misi, rekor: angkaSah(d.rekor) ? d.rekor : 0 }, rusak };
}

/** Bentuk yang ditulis ke raksa:solo. Entri rusak ikut apa adanya (entri sah dengan id sama menang). */
function bentukSimpan(p: ProgresSolo, rusak: Record<string, unknown>) {
  return { versi: VERSI_SOLO, misi: { ...rusak, ...p.misi }, rekor: p.rekor };
}

/**
 * Sebelum raksa:solo DITIMPA: teks mentah format lama / rusak dicadangkan sekali.
 * true = aman ditimpa (tidak ada yang perlu dicadangkan, atau cadangan tersimpan/sudah ada).
 */
function cadangkanSebelumMenimpa(b: BacaanSolo): boolean {
  if (!b.mentah) return true;
  if (b.format === 'v1') return cadangkanSekali(KUNCI_CADANGAN_V1, b.mentah);
  if (b.format === 'rusak') return cadangkanSekali(KUNCI_CADANGAN_RUSAK, b.mentah);
  return true;
}

/**
 * Progres solo di perangkat ini. Progres format lama langsung dimigrasi (sekali; idempoten):
 * teks mentahnya dicadangkan ke raksa:solo:cadangan-v1, lalu ditulis ulang sebagai versi 2.
 * Tanpa kabari(): isi yang tampil sama sebelum & sesudah ditulis, jadi aman dipanggil saat render.
 * Bila cadangan gagal disimpan (kuota penuh), data lama dibiarkan dan migrasi diulang di memori.
 * Data rusak tidak ditulis apa pun saat dibaca (tampil sebagai progres kosong).
 */
export function progresSolo(): ProgresSolo {
  const b = bacaSolo();
  if (b.format === 'v1' && cadangkanSebelumMenimpa(b)) tulis(KUNCI_SOLO, bentukSimpan(b.progres, b.rusak));
  return b.progres;
}

export function totalPoin(p: ProgresSolo): number {
  return Object.values(p.misi).reduce((n, c) => n + (Number.isFinite(c.poin) ? c.poin : 0), 0);
}

/**
 * Catat satu percobaan; yang disimpan adalah hasil TERBAIK per misi (akurasi & poin masing-masing
 * terbaik, bintang dari akurasi terbaik). Misi yang dicatat = sudah dicoba, walau 0 bintang.
 * Mengembalikan progres baru.
 */
export function catatHasilSolo(missionId: string, akurasi: number, poin: number): ProgresSolo {
  const b = bacaSolo();
  cadangkanSebelumMenimpa(b);
  const p = b.progres;
  const lama = p.misi[missionId];
  const poinIni = angkaSah(poin) ? poin : 0;
  const terbaik = Math.max(lama?.akurasi ?? 0, angkaSah(akurasi) ? akurasi : 0);
  const lebihBaik = !lama || poinIni > lama.poin;
  const misi: Record<string, CatatanMisi> = {
    ...p.misi,
    [missionId]: {
      akurasi: terbaik,
      poin: lebihBaik ? poinIni : lama.poin,
      bintang: bintangUntuk(terbaik),
      kali: (lama?.kali ?? 0) + 1,
    },
  };
  const baru: ProgresSolo = { versi: VERSI_SOLO, misi, rekor: 0 };
  baru.rekor = Math.max(p.rekor, totalPoin(baru));
  tulis(KUNCI_SOLO, bentukSimpan(baru, b.rusak));
  kabari();
  return baru;
}

/**
 * "Main lagi": bintang & poin per misi dihapus, rekor pribadi dipertahankan. Rekor saat itu
 * dicatat sebagai "rekor yang harus dipecahkan" putaran berikutnya (lihat rekorLalu()).
 * Progres format lama/rusak tetap dicadangkan dulu (progresSolo + cadangan sebelum menimpa).
 */
export function ulangSolo(): void {
  const rekor = progresSolo().rekor;
  cadangkanSebelumMenimpa(bacaSolo());
  tulis(KUNCI_REKOR_LALU, rekor);
  tulis(KUNCI_SOLO, { versi: VERSI_SOLO, misi: {}, rekor });
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
