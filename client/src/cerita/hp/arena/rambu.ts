/**
 * LOGIKA POLA RAMBU (K08, fungsi MURNI): satu adegan jalan, satu petunjuk pada satu waktu.
 *
 * Susunan = MissionAnswer misi sintetis aktivitas 'rambu' (sama dengan penilaian & pemetaan mesin):
 *  - satu langkah assign per rambu: item `${awalanItem}${n}` (n = nomor lajur dari kiri) -> wadah `wadah` = lajur n DITANDAI pemain;
 *  - satu langkah single `simpul` = kesimpulan kepada tokoh (id opsi = alternatif naskah).
 * Urutan langkah layar (`LangkahRambu`, hanya tampilan; disimpan per kunjungan agar muat ulang kembali ke langkah yang sama):
 *   progres 0 ketuk rambu 1 -> 1 tandai rambu 1 -> 2 ketuk rambu 2 -> 3 tandai rambu 2 -> 4 = selesai memeriksa (kesimpulan).
 * `lihat` = rambu yang dibuka ulang untuk dilihat/diubah (kemajuan tidak mundur).
 *
 * Tanda pemain TIDAK dinilai saat menandai. Setelah kesimpulan dikirim, `tanggapan` membandingkannya dengan (1) tulisan rambu yang
 * menyebut nomor lajur dan (2) kesimpulan pemain sendiri. Tafsir rambu yang tidak menyebut nomor lajur ("lajur kiri") tidak
 * dibandingkan: naskah menyatakannya belum dikonfirmasi.
 */
import type { MissionAnswer } from '@shared/types';
import type { KonfigArena, KunciTeks, RambuArena } from '../../tipe';
import { lepaskan, petaLangkah, pilihOpsi, tetapkan } from './dasar';

export type ArenaRambu = Extract<KonfigArena, { pola: 'rambu' }>;

export interface LangkahRambu {
  progres: number;
  lihat: number | null;
}

export const LANGKAH_AWAL: LangkahRambu = { progres: 0, lihat: null };

/** Id item langkah assign untuk lajur `n` pada rambu `r`. */
export const idItemLajur = (r: RambuArena, n: number): string => `${r.awalanItem}${n}`;

export function semuaItemRambu(k: ArenaRambu): string[] {
  return k.rambu.flatMap((r) => Array.from({ length: k.jumlahLajur }, (_, i) => idItemLajur(r, i + 1)));
}

// ------------------------------------------------------------------ susunan <-> jawaban

/** Lajur yang ditandai pemain untuk rambu ke-`indeks` (urut naik). */
export function lajurDitandai(k: ArenaRambu, j: MissionAnswer, indeks: number): number[] {
  const r = k.rambu[indeks];
  if (!r) return [];
  const p = petaLangkah(j, r.langkah);
  return Array.from({ length: k.jumlahLajur }, (_, i) => i + 1).filter((n) => p[idItemLajur(r, n)] === r.wadah);
}

/** Ketuk lajur: menyalakan/mematikan tanda untuk rambu ke-`indeks`. Nomor di luar jalan diabaikan. */
export function alihLajur(k: ArenaRambu, j: MissionAnswer, indeks: number, n: number): MissionAnswer {
  const r = k.rambu[indeks];
  if (!r || !Number.isInteger(n) || n < 1 || n > k.jumlahLajur) return j;
  const id = idItemLajur(r, n);
  return petaLangkah(j, r.langkah)[id] === r.wadah ? lepaskan(j, r.langkah, id) : tetapkan(j, r.langkah, id, r.wadah);
}

export function simpulDipilih(k: ArenaRambu, j: MissionAnswer): string | null {
  const v = j[k.simpul.langkah];
  return typeof v === 'string' && k.simpul.pilihan.some((x) => x.id === v) ? v : null;
}

export function pilihSimpul(k: ArenaRambu, j: MissionAnswer, id: string): MissionAnswer {
  return k.simpul.pilihan.some((x) => x.id === id) ? pilihOpsi(j, k.simpul.langkah, id) : j;
}

/** Bagian yang belum diputuskan: rambu tanpa tanda + kesimpulan (0 = boleh dikirim). */
export function sisaRambu(k: ArenaRambu, j: MissionAnswer): number {
  return k.rambu.filter((_, i) => lajurDitandai(k, j, i).length === 0).length + (simpulDipilih(k, j) ? 0 : 1);
}

// ------------------------------------------------------------------ urutan langkah layar

const jumlahLangkah = (k: ArenaRambu): number => k.rambu.length * 2;

export function selesaiPeriksa(k: ArenaRambu, s: LangkahRambu): boolean {
  return s.progres >= jumlahLangkah(k) && s.lihat === null;
}

/** Rambu yang sedang aktif (indeks): yang dibuka ulang, atau yang sedang diperiksa menurut kemajuan. */
export function rambuAktif(k: ArenaRambu, s: LangkahRambu): number {
  if (s.lihat !== null) return s.lihat;
  return Math.min(Math.floor(s.progres / 2), k.rambu.length - 1);
}

/** 'ketuk' = menunggu pemain mengetuk rambu; 'tandai' = lajur bisa ditandai; 'putus' = semua rambu diperiksa, kesimpulan. */
export function tahap(k: ArenaRambu, s: LangkahRambu): 'ketuk' | 'tandai' | 'putus' {
  if (s.lihat !== null) return 'tandai';
  if (s.progres >= jumlahLangkah(k)) return 'putus';
  return s.progres % 2 === 0 ? 'ketuk' : 'tandai';
}

/** Pemain mengetuk rambu di adegan (hanya berarti saat tahap 'ketuk'). */
export function ketukRambu(k: ArenaRambu, s: LangkahRambu): LangkahRambu {
  return tahap(k, s) === 'ketuk' ? { ...s, progres: s.progres + 1 } : s;
}

export function bolehLanjut(k: ArenaRambu, j: MissionAnswer, s: LangkahRambu): boolean {
  return tahap(k, s) === 'tandai' && lajurDitandai(k, j, rambuAktif(k, s)).length > 0;
}

/** Lanjut dari tahap menandai: menutup tinjauan ulang, atau maju ke langkah berikutnya. */
export function lanjutRambu(k: ArenaRambu, j: MissionAnswer, s: LangkahRambu): LangkahRambu {
  if (!bolehLanjut(k, j, s)) return s;
  return s.lihat !== null ? { ...s, lihat: null } : { ...s, progres: s.progres + 1 };
}

/** Indeks rambu yang sudah dibuka (boleh dilihat lagi tanpa kehilangan kemajuan). */
export function rambuTerbuka(k: ArenaRambu, s: LangkahRambu): number[] {
  return k.rambu.map((_, i) => i).filter((i) => s.progres >= i * 2 + 1);
}

export function bukaUlang(k: ArenaRambu, s: LangkahRambu, indeks: number): LangkahRambu {
  return rambuTerbuka(k, s).includes(indeks) ? { ...s, lihat: indeks } : s;
}

/** Tanda tersimpan -> langkah layar; tanpa catatan langkah, diperkirakan dari tanda pemain (muat ulang tidak membuang pekerjaan). */
export function pulihkanLangkah(k: ArenaRambu, j: MissionAnswer, tersimpan: LangkahRambu | null): LangkahRambu {
  if (tersimpan && Number.isInteger(tersimpan.progres) && tersimpan.progres >= 0 && tersimpan.progres <= jumlahLangkah(k)) {
    const lihat = tersimpan.lihat !== null && rambuTerbuka(k, tersimpan).includes(tersimpan.lihat) ? tersimpan.lihat : null;
    return { progres: tersimpan.progres, lihat };
  }
  if (simpulDipilih(k, j)) return { progres: jumlahLangkah(k), lihat: null };
  // Rambu terakhir yang sudah punya tanda: lanjut ke "ketuk rambu berikutnya" (tanda tetap, rambu lama bisa dibuka ulang).
  let terakhir = -1;
  k.rambu.forEach((_, i) => { if (lajurDitandai(k, j, i).length) terakhir = i; });
  return { progres: terakhir < 0 ? 0 : (terakhir + 1) * 2, lihat: null };
}

export function serialLangkah(s: LangkahRambu): string {
  return `${s.progres}:${s.lihat ?? '-'}`;
}

export function uraiLangkah(teks: unknown): LangkahRambu | null {
  if (typeof teks !== 'string') return null;
  const m = /^(\d{1,2}):(\d{1,2}|-)$/.exec(teks);
  return m ? { progres: Number(m[1]), lihat: m[2] === '-' ? null : Number(m[2]) } : null;
}

// ------------------------------------------------------------------ teks dan tanggapan

type TxParam = (kunci: KunciTeks, param?: Record<string, string | number>) => string;

const HAN = /[\u3400-\u9fff]/;
const LATIN = /[A-Za-z0-9]/;
/** Sambung dua potong teks; spasi disisipkan di batas aksara Han <-> Latin/angka (aturan teks zh: "和 Darto", "Hendra 先生"). */
export function sambung(a: string, b: string): string {
  const x = a.slice(-1), y = b.slice(0, 1);
  return a + ((HAN.test(x) && LATIN.test(y)) || (LATIN.test(x) && HAN.test(y)) ? ' ' : '') + b;
}
/** "A, B dan C" dalam bahasa `tx` (kunci daftar.pemisah / daftar.dan): en "A, B and C", zh "A、B和 C". */
export function daftarNama(nama: readonly string[], tx: TxParam): string {
  if (nama.length <= 1) return nama.join('');
  return sambung(sambung(nama.slice(0, -1).join(tx('daftar.pemisah')), tx('daftar.dan')), nama[nama.length - 1]!);
}
/** Gabung kalimat utuh: spasi di antaranya, kecuali sesudah tanda baca lebar penuh (zh "。"). */
export function gabungKalimat(kalimat: readonly string[]): string {
  return kalimat.reduce((a, k) => (a ? a + (/[。！？：，]$/.test(a) ? '' : ' ') + k : k), '');
}

/**
 * Daftar lajur dalam bahasa `tx` (T-014 fix: dulu kata "lajur"/"dan" tertulis di kode dan bocor ke en/zh). id: "lajur 3 dan 4",
 * "lajur 2, 3, dan 4", "belum ada lajur"; en: "lanes 3 and 4"; zh: "第 3、4 车道". Kata & penyambung = kunci arena.rambu.lajur*.
 */
export function daftarLajur(n: ReadonlyArray<number>, tx: TxParam): string {
  const u = [...n].sort((a, b) => a - b);
  if (u.length === 0) return tx('arena.rambu.lajurKosong');
  if (u.length === 1) return tx('arena.rambu.lajurSatu', { lajur: String(u[0]) });
  const angka = u.length === 2
    ? `${u[0]}${tx('arena.rambu.lajurDan')}${u[1]}`
    : `${u.slice(0, -1).join(tx('arena.rambu.lajurPemisah'))}${tx('arena.rambu.lajurDanAkhir')}${u[u.length - 1]}`;
  return tx('arena.rambu.lajurBanyak', { lajur: angka });
}

export interface Tanggapan {
  jenis: 'tulisan' | 'sikap' | 'sama';
  teks: KunciTeks;
  param: Record<string, string>;
  /** Daftar lajur yang masih berupa ANGKA (jenis 'tulisan'): dijadikan teks {tanda}/{tulisan} oleh paramTanggapan(tx). */
  lajur?: { tanda: number[]; tulisan: number[] };
}

/** Parameter teks tanggapan dalam bahasa `tx` (daftar lajur dirakit di sini, bukan di logika). */
export function paramTanggapan(t: Tanggapan, tx: TxParam): Record<string, string> {
  return t.lajur ? { ...t.param, tanda: daftarLajur(t.lajur.tanda, tx), tulisan: daftarLajur(t.lajur.tulisan, tx) } : t.param;
}

/**
 * Pak Bima mencocokkan tanda rambu bernomor lajur dengan tulisannya dan dengan kesimpulan pemain. Hanya perbandingan, tanpa
 * penilaian dan tanpa menyebut hasil klaim:
 *  - 'tulisan': tanda berbeda dari lajur yang disebut tulisan rambu;
 *  - 'sikap': kesimpulan "melanggar" padahal lajur truk tidak ditandai terlarang, atau "tidak melanggar" padahal ditandai;
 *  - 'sama': tanda sama dengan tulisan dan tidak bertentangan dengan kesimpulan.
 */
export function tanggapan(k: ArenaRambu, j: MissionAnswer): Tanggapan[] {
  const indeks = k.rambu.findIndex((r) => (r.tulisan?.length ?? 0) > 0);
  const hasil: Tanggapan[] = [];
  if (indeks < 0) return hasil;
  const r = k.rambu[indeks]!;
  const tertulis = r.tulisan!;
  const tanda = lajurDitandai(k, j, indeks);
  const sama = tanda.length === tertulis.length && tertulis.every((x) => tanda.includes(x));
  const rambu = { rambu: `${indeks + 1}` };
  if (!sama) hasil.push({ jenis: 'tulisan', teks: 'arena.rambu.tanggap.tulisan', param: rambu, lajur: { tanda: [...tanda], tulisan: [...tertulis] } });
  const pilih = simpulDipilih(k, j);
  const sikap = pilih ? k.simpul.sikap[pilih] : undefined;
  const trukDitandai = tanda.includes(k.lajurTruk);
  if (sikap === 'melanggar' && !trukDitandai) hasil.push({ jenis: 'sikap', teks: 'arena.rambu.tanggap.sikapMelanggar', param: { truk: String(k.lajurTruk) } });
  else if (sikap === 'tidak' && trukDitandai) hasil.push({ jenis: 'sikap', teks: 'arena.rambu.tanggap.sikapTidak', param: { truk: String(k.lajurTruk) } });
  if (hasil.length === 0) hasil.push({ jenis: 'sama', teks: 'arena.rambu.tanggap.sama', param: rambu });
  return hasil;
}

/** Satu kalimat tindakan pemain ("Rambu 1: lajur 3 dan 4. Rambu 2: lajur 1."), tanpa penilaian. */
export function ringkasTanda(k: ArenaRambu, j: MissionAnswer, tx: TxParam): string {
  return k.rambu.map((r, i) => `${tx(r.label)}${tx('daftar.titikDua')}${daftarLajur(lajurDitandai(k, j, i), tx)}`).join(tx('daftar.antarKalimat')) + tx('daftar.titik');
}

/** Tulisan ilustrasi jalan (lokasi/Adegan.tsx) dalam bahasa `tx` (T-014 fix). */
export function labelAdegan(tx: TxParam): { jalan: string; truk: string; keterangan: string; lajur: (n: number) => string; lajurTruk: (n: number) => string } {
  return {
    jalan: tx('arena.rambu.adegan.jalan'), truk: tx('arena.rambu.adegan.truk'), keterangan: tx('arena.rambu.adegan.keterangan'),
    lajur: (n) => tx('arena.rambu.adegan.lajur', { lajur: String(n) }), lajurTruk: (n) => tx('arena.rambu.adegan.lajurTruk', { lajur: String(n) }),
  };
}
