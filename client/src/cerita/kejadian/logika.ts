/**
 * Logika murni prototipe "Kejadian" v2 (irisan K10 Episode 2). Tanpa React, tanpa penyimpanan.
 *
 * Aturan isi (dari naskah K10, teks.id.ts 395-406 dan aktivitas selisih):
 *  - Adegan hanya memakai fakta yang disepakati semua saksi. Urutan menabrak pembatas vs truk kecil, arah, dan posisi
 *    tidak ada di naskah, jadi keduanya satu kartu dan gambar berlabel ilustrasi.
 *  - Tiga hal berbeda di catatan: jam (20.10 polisi, 20.15 petugas tol), nama supir truk kecil (nama asli TIDAK ada di
 *    naskah, jadi tidak ditampilkan dan tidak dijadikan teka-teki), dan catatan "kurang antisipasi" yang hanya ada di
 *    catatan tol (penilaian, bukan fakta).
 *  - Pemain menyiapkan PERTANYAAN klarifikasi untuk satu hal. Jawaban pihak lain TIDAK dikarang: pertanyaan hanya
 *    ditempel ke catatan kasus dengan status "belum ada jawaban".
 *  - Tidak ada penilaian bahwa perbedaan "kecil/wajar", tidak ada hasil klaim, tidak ada tuduhan.
 * Semua teks pemain di sini DRAF, perlu ditinjau Tim Claim sebelum dipakai di acara.
 */

export type IdKejadian = 'pindah' | 'banting' | 'tabrak';

export interface KartuKejadian { id: IdKejadian; teks: string }

/** Urutan tampil kartu sengaja BUKAN urutan kejadian (supaya susunan tidak bocor). */
export const KARTU: readonly KartuKejadian[] = [
  { id: 'tabrak', teks: 'Truk menabrak pembatas jalan dan truk kecil yang sedang berhenti ganti ban' },
  { id: 'pindah', teks: 'Mobil kecil tiba-tiba pindah dari lajur 3 ke lajur 2' },
  { id: 'banting', teks: 'Supir truk kaget dan banting setir ke kiri' },
];

/** Urutan menurut keterangan semua saksi (naskah K10). Dipakai catatan kasus. */
export const URUTAN_SAKSI: readonly IdKejadian[] = ['pindah', 'banting', 'tabrak'];

export const JUMLAH_LANGKAH = 3;
export type Susunan = ReadonlyArray<IdKejadian | null>;

export const SUSUNAN_KOSONG: Susunan = [null, null, null];

export function teksKartu(id: IdKejadian): string {
  return KARTU.find((k) => k.id === id)?.teks ?? '';
}

/** Kartu terpilih ditaruh di slot. Penghuni lama slot kembali ke daftar; kartu yang sudah ada di slot lain dipindah. */
export function taruh(s: Susunan, kartu: IdKejadian, slot: number): Susunan {
  if (slot < 0 || slot >= JUMLAH_LANGKAH) return s;
  return s.map((v, i) => (i === slot ? kartu : v === kartu ? null : v));
}

export function lepas(s: Susunan, slot: number): Susunan {
  return s.map((v, i) => (i === slot ? null : v));
}

export function penuh(s: Susunan): boolean {
  return s.every((v) => v !== null);
}

export function idDiSlot(s: Susunan): IdKejadian[] {
  return s.filter((v): v is IdKejadian => v !== null);
}

/** Kartu yang belum ditaruh (yang masih ditampilkan di daftar kartu). */
export function kartuTersisa(s: Susunan): readonly KartuKejadian[] {
  return KARTU.filter((k) => !s.includes(k.id));
}

/** Susunan pemain sama dengan urutan keterangan saksi? (Hanya untuk satu kalimat netral; tidak memblokir apa pun.) */
export function sesuaiSaksi(s: Susunan): boolean {
  return s.length === URUTAN_SAKSI.length && s.every((v, i) => v === URUTAN_SAKSI[i]);
}

/** Keadaan adegan setelah `langkah` kejadian pertama dari susunan pemain diputar (0 = awal). */
export interface KeadaanAdegan {
  mobil: 'asal' | 'pindah';
  truk: 'lurus' | 'kiri' | 'tabrak';
  /** Kejadian terakhir yang diputar (null di awal). */
  terakhir: IdKejadian | null;
}

export function keadaanAdegan(s: Susunan, langkah: number): KeadaanAdegan {
  const k: KeadaanAdegan = { mobil: 'asal', truk: 'lurus', terakhir: null };
  const urut = idDiSlot(s).slice(0, Math.max(0, langkah));
  for (const id of urut) {
    k.terakhir = id;
    if (id === 'pindah') k.mobil = 'pindah';
    else if (id === 'banting') k.truk = 'kiri';
    else k.truk = 'tabrak';
  }
  return k;
}

/** Keterangan semua saksi (naskah K10, apa adanya). */
export const KETERANGAN_SAKSI = 'Semua saksi sepakat: ada mobil kecil yang tiba-tiba pindah dari lajur 3 ke lajur 2. Supir kaget dan banting setir ke kiri, lalu menabrak pembatas jalan dan sebuah truk kecil yang sedang berhenti untuk ganti ban. Tidak ada korban.';

// ---------------------------------------------------------------------------------------------------------------- perbandingan catatan

export type IdBaris = 'pokok' | 'jam' | 'catatan';
export type JenisBaris = 'beda' | 'sama' | 'satu';

export interface BarisCatatan {
  id: IdBaris;
  label: string;
  polisi: string;
  tol: string;
  jenis: JenisBaris;
  /** Penjelasan netral setelah diperiksa (tanpa kata benar/salah, tanpa menuduh, tanpa menilai besar-kecil). */
  penjelasan: string;
}

export const BARIS: readonly BarisCatatan[] = [
  { id: 'pokok', label: 'Kronologi', polisi: 'Mobil kecil pindah, truk banting kiri, menabrak', tol: 'Mobil kecil pindah, truk banting kiri, menabrak', jenis: 'sama',
    penjelasan: 'Isinya sama di kedua catatan, sesuai keterangan semua saksi.' },
  { id: 'jam', label: 'Jam kejadian', polisi: '20.10', tol: '20.15', jenis: 'beda',
    penjelasan: '20.10 di catatan polisi, 20.15 di catatan petugas tol. Penyebabnya belum diketahui.' },
  { id: 'catatan', label: 'Catatan petugas', polisi: 'Tidak ada di kutipan ini', tol: 'Supir "kurang antisipasi"', jenis: 'satu',
    penjelasan: 'Dalam kutipan ini hanya catatan tol yang memuatnya. Belum diketahui apakah catatan polisi memuat hal serupa. Ini penilaian petugas, bukan kejadian yang terlihat.' },
];

/** Baris yang berbeda atau hanya ada di satu catatan. */
export const BARIS_BEDA: readonly IdBaris[] = BARIS.filter((b) => b.jenis !== 'sama').map((b) => b.id);

export interface Temuan {
  ditandaiBeda: IdBaris[]; // baris berbeda yang ditandai pemain
  terlewat: IdBaris[]; // baris berbeda yang belum ditandai
  berlebih: IdBaris[]; // baris yang sama tetapi ditandai
}

export function periksa(ditandai: ReadonlyArray<IdBaris>): Temuan {
  const set = new Set(ditandai);
  return {
    ditandaiBeda: BARIS_BEDA.filter((id) => set.has(id)),
    terlewat: BARIS_BEDA.filter((id) => !set.has(id)),
    berlebih: BARIS.filter((b) => b.jenis === 'sama' && set.has(b.id)).map((b) => b.id),
  };
}

/** Catatan di bawah hasil perbandingan: hal ketiga ada di naskah tetapi tidak bisa ditampilkan tanpa mengarang nama. */
export const CATATAN_NAMA = 'Ada satu perbedaan lagi: nama supir truk kecil tertulis berbeda di dua catatan. Namanya disamarkan, jadi tidak ditampilkan di sini.';

// ---------------------------------------------------------------------------------------------------------------- catatan kasus + pertanyaan

export type IdHal = 'jam' | 'nama' | 'catatan';
export type IdPihak = 'tol' | 'polisi';

export const NAMA_PIHAK: Record<IdPihak, string> = { tol: 'Petugas tol', polisi: 'Polisi' };

export interface HalBeda {
  id: IdHal;
  judul: string;
  ringkas: string;
  /** Pihak yang boleh ditanya. Tidak dibatasi oleh dugaan "tidak ada di catatan polisi": itu belum dikonfirmasi Tim Claim. */
  pihak: readonly IdPihak[];
}

export const HAL: readonly HalBeda[] = [
  { id: 'jam', judul: 'Jam kejadian', ringkas: '20.10 di catatan polisi, 20.15 di catatan petugas tol', pihak: ['tol', 'polisi'] },
  { id: 'nama', judul: 'Nama supir truk kecil', ringkas: 'Tertulis berbeda di dua catatan (nama disamarkan)', pihak: ['tol', 'polisi'] },
  { id: 'catatan', judul: 'Catatan "kurang antisipasi"', ringkas: 'Tertulis di catatan tol, tidak ada di kutipan polisi. Penilaian petugas, bukan kejadian yang terlihat', pihak: ['tol', 'polisi'] },
];

export interface Pertanyaan { hal: IdHal; pihak: IdPihak; teks: string }

export function cariHal(id: IdHal): HalBeda {
  return HAL.find((h) => h.id === id) as HalBeda;
}

/** Pertanyaan klarifikasi yang disiapkan pemain. Hanya pertanyaan: tidak memuat jawaban atau dugaan penyebab. */
export function susunPertanyaan(hal: IdHal, pihak: IdPihak): string {
  const untuk = `Untuk ${NAMA_PIHAK[pihak]}: `;
  if (hal === 'jam') return `${untuk}jam kejadian tertulis 20.10 di catatan polisi dan 20.15 di catatan petugas tol. Dari mana jam itu diambil?`;
  if (hal === 'nama') return `${untuk}nama supir truk kecil tertulis berbeda di catatan polisi dan catatan petugas tol. Dari dokumen apa nama itu dicatat?`;
  if (pihak === 'polisi') return `${untuk}catatan tol menulis supir "kurang antisipasi". Apakah catatan polisi memuat penilaian serupa?`;
  return `${untuk}catatan tol menulis supir "kurang antisipasi". Apa dasar penilaian itu?`;
}

export function pihakBoleh(hal: IdHal, pihak: IdPihak): boolean {
  return cariHal(hal).pihak.includes(pihak);
}

/** Menempel pertanyaan ke catatan kasus. Satu pertanyaan per hal: yang baru menggantikan yang lama. */
export function tambahPertanyaan(daftar: ReadonlyArray<Pertanyaan>, hal: IdHal, pihak: IdPihak): Pertanyaan[] {
  if (!pihakBoleh(hal, pihak)) return [...daftar];
  const baru: Pertanyaan = { hal, pihak, teks: susunPertanyaan(hal, pihak) };
  return [...daftar.filter((p) => p.hal !== hal), baru];
}

export function pertanyaanUntuk(daftar: ReadonlyArray<Pertanyaan>, hal: IdHal): Pertanyaan | undefined {
  return daftar.find((p) => p.hal === hal);
}

/** Yang sudah pasti menurut semua saksi, urutan saksi (bukan urutan pemain). */
export function pasti(): string[] {
  return [...URUTAN_SAKSI.map(teksKartu), 'Tidak ada korban.'];
}

export interface RingkasCatatan {
  pasti: string[];
  beda: Array<{ hal: HalBeda; status: 'belum' | 'ditanyakan'; pihak?: IdPihak }>;
  klarifikasi: Pertanyaan[];
  belumJelas: number;
}

export function ringkasCatatan(daftar: ReadonlyArray<Pertanyaan>): RingkasCatatan {
  const beda = HAL.map((hal) => {
    const p = pertanyaanUntuk(daftar, hal.id);
    return p ? { hal, status: 'ditanyakan' as const, pihak: p.pihak } : { hal, status: 'belum' as const };
  });
  return { pasti: pasti(), beda, klarifikasi: HAL.flatMap((h) => pertanyaanUntuk(daftar, h.id) ?? []), belumJelas: HAL.length };
}

/** Penutup singkat Pak Hendra. Tidak menilai perbedaan dan tidak menyebut hasil klaim. */
export function penutupHendra(jumlahPertanyaan: number): string {
  if (jumlahPertanyaan >= HAL.length) return 'Terima kasih, semuanya sudah ditanyakan. Saya tunggu jawabannya.';
  return 'Terima kasih. Saya tunggu jawabannya, dan sisanya masih bisa ditanyakan nanti.';
}
