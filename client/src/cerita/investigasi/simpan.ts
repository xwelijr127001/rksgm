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
 *
 * T-106 (Investigator lengkap, kartu 5): seri = TIGA kasus, total / 300. Kunci dan `versi: 1` TIDAK berubah; rekaman lama (dua
 * kasus) dibaca apa adanya dan skor, stempel serta pangkatnya bertahan. Dua field OPSIONAL baru:
 *   penjelasan: { <idKasus>: { putusan, pesan, babak? } }   pilihan pada permainan TERBAIK kasus itu (arsip kasus menampilkan
 *                                                           pesannya; rekaman lama tanpa field ini = arsip berisi ringkasan fakta)
 *   hadiah: [<idHadiah>, ...]                                hadiah seri yang SUDAH diumumkan (tiap hadiah diumumkan sekali)
 * Pangkat (rubrik bersama `rankOf`): 0 stempel Muda, 1-2 Investigator, 3 Senior, 3 stempel dan total terbaik >= 255 Kepala.
 */
import { AWARD_IDS, awardsOf, rankOf, SENIOR_STAMPS, SERIES_CASE_IDS, SERIES_MAX, type AwardId } from '@shared/investigator/rubric';
import { SKOR_MAKS } from './skor';

/** Pilihan pada permainan terbaik sebuah kasus (id pilihan saja, tanpa teks). */
export interface PenjelasanTerbaik { putusan: string; pesan: string; babak?: string[] }

export interface RekamanInvestigasi {
  versi: 1;
  terbaik: Record<string, number>;
  stempel: string[];
  /** T-087: jumlah ketukan pratinjau kasus 2 di perangkat ini (bertahan melewati "Tamu baru"). */
  intipKasus2: number;
  /** T-106: pilihan pada permainan terbaik tiap kasus (opsional; rekaman lama tidak punya). */
  penjelasan?: Record<string, PenjelasanTerbaik>;
  /** T-106: hadiah seri yang sudah diumumkan di layar hasil (opsional). */
  hadiah?: AwardId[];
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
  const hasil: RekamanInvestigasi = { versi: 1, terbaik, stempel, intipKasus2: intip };
  const d2 = data as { penjelasan?: unknown; hadiah?: unknown };
  const idSah = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 40;
  if (d2.penjelasan && typeof d2.penjelasan === 'object' && !Array.isArray(d2.penjelasan)) {
    const penjelasan: Record<string, PenjelasanTerbaik> = {};
    for (const [k, v] of Object.entries(d2.penjelasan as Record<string, unknown>)) {
      const p = v as { putusan?: unknown; pesan?: unknown; babak?: unknown } | null;
      if (!k || !p || typeof p !== 'object' || !idSah(p.putusan) || !idSah(p.pesan)) continue;
      penjelasan[k] = { putusan: p.putusan, pesan: p.pesan, ...(Array.isArray(p.babak) && p.babak.length <= 8 && p.babak.every(idSah) ? { babak: p.babak as string[] } : {}) };
    }
    if (Object.keys(penjelasan).length) hasil.penjelasan = penjelasan;
  }
  if (Array.isArray(d2.hadiah)) {
    const hadiah = AWARD_IDS.filter((a) => (d2.hadiah as unknown[]).includes(a));
    if (hadiah.length) hasil.hadiah = hadiah;
  }
  return hasil;
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
export function catatHasil(kasus: string, total: number, penjelasan?: PenjelasanTerbaik): RekamanInvestigasi {
  const r = bacaRekaman();
  if (!kasus) return r;
  const baru = Math.max(0, Math.min(SKOR_MAKS, Math.round(Number.isFinite(total) ? total : 0)));
  const lama = r.terbaik[kasus];
  const naik = lama === undefined || baru > lama;
  const stempelBaru = !r.stempel.includes(kasus);
  // T-106: pilihan permainan terbaik ikut disimpan saat skor terbaik naik, atau saat skornya sama dan belum ada catatan pilihan
  // (rekaman lama). Seri = permainan terbaik yang pertama yang tercatat.
  const catatPilihan = !!penjelasan && (naik || (baru === lama && !r.penjelasan?.[kasus]));
  if (!naik && !stempelBaru && !catatPilihan) return r;
  const berikut: RekamanInvestigasi = {
    ...r,
    terbaik: naik ? { ...r.terbaik, [kasus]: baru } : r.terbaik,
    stempel: stempelBaru ? [...r.stempel, kasus] : r.stempel,
    ...(catatPilihan ? { penjelasan: { ...r.penjelasan, [kasus]: penjelasan! } } : {}),
  };
  tulisMentah(JSON.stringify(berikut));
  return berikut;
}

/**
 * T-106: kasus seri (urut nomor) = manifes rubrik bersama. Total terbaik ditampilkan "x / 300". Id kasus lain di rekaman lama
 * tetap disimpan tetapi tidak dihitung.
 */
export const KASUS_TERSEDIA: readonly string[] = SERIES_CASE_IDS;
export const TOTAL_MAKS = SERIES_MAX;
/** Stempel yang dibutuhkan untuk pangkat Senior (= semua kasus seri). */
export const STEMPEL_SENIOR = SENIOR_STAMPS;

/** Jumlah skor terbaik kasus-kasus seri. */
export function totalSkor(r: Pick<RekamanInvestigasi, 'terbaik'> = bacaRekaman()): number {
  return KASUS_TERSEDIA.reduce((a, k) => a + (Object.prototype.hasOwnProperty.call(r.terbaik, k) ? r.terbaik[k]! : 0), 0);
}

/** Stempel seri yang BERBEDA, urut didapat (kartu petugas menggambarnya dalam urutan ini). */
export function stempelSeri(r: Pick<RekamanInvestigasi, 'stempel'> = bacaRekaman()): string[] {
  return [...new Set(r.stempel)].filter((k) => KASUS_TERSEDIA.includes(k));
}

type Capaian = Pick<RekamanInvestigasi, 'stempel' | 'terbaik'>;
/** Pangkat dari stempel yang berbeda dan total terbaik (rubrik bersama): Senior = 3 stempel; Kepala = 3 stempel dan >= 255 / 300. */
export function pangkatRekaman(r: Capaian = bacaRekaman()): Pangkat {
  return rankOf(stempelSeri(r).length, totalSkor(r));
}

/** Hadiah seri yang sudah diraih: lencana dua kasus (2 stempel), segel panel (3 stempel), bingkai Kepala. */
export function hadiahRekaman(r: Capaian = bacaRekaman()): AwardId[] {
  return awardsOf(stempelSeri(r).length, totalSkor(r));
}

/** Tandai hadiah sebagai sudah diumumkan (idempoten). */
export function catatHadiah(id: readonly AwardId[]): void {
  const r = bacaRekaman();
  const baru = id.filter((a) => !r.hadiah?.includes(a));
  if (!baru.length) return;
  tulisMentah(JSON.stringify({ ...r, hadiah: AWARD_IDS.filter((a) => r.hadiah?.includes(a) || baru.includes(a)) }));
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
