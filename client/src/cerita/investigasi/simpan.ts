/**
 * T-076 EPISODE 1 INVESTIGATOR: REKAMAN PERANGKAT mode investigasi (kontrak rencana "Interfaces"). Kunci SENDIRI
 * `raksa:investigasi:v1`, terpisah dari progres cerita (`raksa:cerita`, entri per episode) dan dari profil pemain:
 *   { versi: 1, terbaik: { <idKasus>: skor terbaik 0..100 }, stempel: [<idKasus>, ...], intipKasus2: <jumlah ketukan> }
 * - Main lagi menyimpan skor TERBAIK (tidak pernah turun); total = jumlah skor terbaik semua kasus.
 * - Stempel = kasus yang pernah diselesaikan (satu per kasus). Pangkat dari jumlah stempel:
 *   0 Investigator Muda, >= 1 Investigator, >= 3 Senior, >= 4 Kepala.
 * - `tamuBaru()` menghapus HANYA rekaman ini (progres cerita episode lain dan profil tidak disentuh).
 * - T-087 `intipKasus2`: berapa kali kartu "Kasus 2 · segera hadir" di layar hasil diketuk (minat sukarela, untuk uji coba
 *   sepuluh tamu). Penghitung PERANGKAT, bukan milik satu tamu: `tamuBaru()` TIDAK mengenolkannya.
 * Semua akses dibungkus try/catch; bila localStorage diblokir / penuh, salinan di memori berlaku selama tab terbuka.
 * Isi yang rusak atau versi lain dibaca sebagai rekaman kosong (tidak melempar).
 */
import { SKOR_MAKS } from './skor';

export interface RekamanInvestigasi {
  versi: 1;
  terbaik: Record<string, number>;
  stempel: string[];
  /** T-087: jumlah ketukan pratinjau kasus 2 di perangkat ini (bertahan melewati "Tamu baru"). */
  intipKasus2: number;
}

export type Pangkat = 'muda' | 'investigator' | 'senior' | 'kepala';

export const KUNCI_INVESTIGASI = 'raksa:investigasi:v1';

const kosong = (): RekamanInvestigasi => ({ versi: 1, terbaik: {}, stempel: [], intipKasus2: 0 });

/** Salinan di memori bila penyimpanan menolak (null = pakai localStorage). */
let memori: string | null = null;
let versi = 0;
const pendengar = new Set<() => void>();

function kabari(): void {
  versi += 1;
  for (const f of pendengar) f();
}

function bacaMentah(): string | null {
  if (memori !== null) return memori;
  try { return localStorage.getItem(KUNCI_INVESTIGASI); } catch { return null; }
}

function tulisMentah(nilai: string | null): void {
  try {
    if (nilai === null) localStorage.removeItem(KUNCI_INVESTIGASI);
    else localStorage.setItem(KUNCI_INVESTIGASI, nilai);
    memori = null;
  } catch {
    // Penyimpanan diblokir / penuh: rekaman hanya di memori selama tab terbuka ('' = sudah dihapus).
    memori = nilai ?? '';
  }
  kabari();
}

/** Rekaman dari bentuk apa pun (isi rusak / versi lain = kosong; nilai tidak sah dibuang). */
export function bersihkanRekaman(data: unknown): RekamanInvestigasi {
  if (!data || typeof data !== 'object' || Array.isArray(data) || (data as { versi?: unknown }).versi !== 1) return kosong();
  const d = data as { terbaik?: unknown; stempel?: unknown; intipKasus2?: unknown };
  const terbaik: Record<string, number> = {};
  if (d.terbaik && typeof d.terbaik === 'object' && !Array.isArray(d.terbaik)) {
    for (const [k, v] of Object.entries(d.terbaik as Record<string, unknown>)) {
      if (k && typeof v === 'number' && Number.isFinite(v)) terbaik[k] = Math.max(0, Math.min(SKOR_MAKS, Math.round(v)));
    }
  }
  const stempel = Array.isArray(d.stempel) ? [...new Set(d.stempel.filter((x): x is string => typeof x === 'string' && x.length > 0))] : [];
  const intip = typeof d.intipKasus2 === 'number' && Number.isFinite(d.intipKasus2) ? Math.max(0, Math.min(1e6, Math.floor(d.intipKasus2))) : 0;
  return { versi: 1, terbaik, stempel, intipKasus2: intip };
}

export function bacaRekaman(): RekamanInvestigasi {
  const mentah = bacaMentah();
  if (!mentah) return kosong();
  try { return bersihkanRekaman(JSON.parse(mentah)); } catch { return kosong(); }
}

/**
 * Catat kasus yang selesai: skor terbaik = maks(lama, baru), stempel kasus ditambahkan sekali. Idempoten (memanggilnya dua kali
 * dengan nilai sama tidak mengubah apa pun), jadi aman dari efek ganda React StrictMode dan muat ulang di layar hasil.
 */
export function catatHasil(kasus: string, total: number): RekamanInvestigasi {
  const r = bacaRekaman();
  if (!kasus) return r;
  const baru = Math.max(0, Math.min(SKOR_MAKS, Math.round(Number.isFinite(total) ? total : 0)));
  const lama = r.terbaik[kasus];
  const naik = lama === undefined || baru > lama;
  const stempelBaru = !r.stempel.includes(kasus);
  if (!naik && !stempelBaru) return r;
  const berikut: RekamanInvestigasi = {
    ...r,
    terbaik: naik ? { ...r.terbaik, [kasus]: baru } : r.terbaik,
    stempel: stempelBaru ? [...r.stempel, kasus] : r.stempel,
  };
  tulisMentah(JSON.stringify(berikut));
  return berikut;
}

/** Jumlah skor terbaik semua kasus. */
export function totalSkor(r: Pick<RekamanInvestigasi, 'terbaik'> = bacaRekaman()): number {
  return Object.values(r.terbaik).reduce((a, b) => a + b, 0);
}

/**
 * T-090: kasus yang bisa dimainkan (urut nomor). Total terbaik ditampilkan "x / (100 x jumlah ini)", mis. "185 / 200".
 */
export const KASUS_TERSEDIA: readonly string[] = ['kasus-1', 'kasus-2'];
export const TOTAL_MAKS = SKOR_MAKS * KASUS_TERSEDIA.length;
/** Stempel yang dibutuhkan untuk pangkat Senior. */
export const STEMPEL_SENIOR = 3;

/** Pangkat dari jumlah stempel: 0 muda, >= 1 investigator, >= 3 senior, >= 4 kepala. */
export function pangkat(stempel: number): Pangkat {
  return stempel >= 4 ? 'kepala' : stempel >= STEMPEL_SENIOR ? 'senior' : stempel >= 1 ? 'investigator' : 'muda';
}

/** "Tamu baru": hapus HANYA rekaman mode investigasi di perangkat ini (penghitung uji coba `intipKasus2` bertahan). */
export function tamuBaru(): void {
  const intip = bacaRekaman().intipKasus2;
  tulisMentah(intip > 0 ? JSON.stringify({ ...kosong(), intipKasus2: intip }) : null);
}

/** T-087: satu ketukan sukarela pada kartu "Kasus 2 · segera hadir". Mengembalikan jumlah sesudahnya. */
export function catatIntipKasus2(): number {
  const r = bacaRekaman();
  const berikut: RekamanInvestigasi = { ...r, intipKasus2: r.intipKasus2 + 1 };
  tulisMentah(JSON.stringify(berikut));
  return berikut.intipKasus2;
}

/** Ada rekaman tamu sebelumnya (untuk menawarkan "Tamu baru")? */
export function adaRekaman(r: RekamanInvestigasi = bacaRekaman()): boolean {
  return r.stempel.length > 0 || Object.keys(r.terbaik).length > 0;
}

// ---- langganan (useSyncExternalStore): rekaman berubah di tab ini atau tab lain
export function berlanggananInvestigasi(f: () => void): () => void {
  pendengar.add(f);
  const dariTabLain = (e: StorageEvent): void => { if (e.key === null || e.key === KUNCI_INVESTIGASI) kabari(); };
  if (typeof window !== 'undefined') window.addEventListener('storage', dariTabLain);
  return () => {
    pendengar.delete(f);
    if (typeof window !== 'undefined') window.removeEventListener('storage', dariTabLain);
  };
}

export function versiInvestigasi(): number {
  return versi;
}
