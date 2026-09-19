/**
 * Bahasa yang didukung game. Bawaan SELALU Bahasa Indonesia; pemain memilih bahasa lain
 * per perangkat (tersimpan di HP itu). Id misi/langkah/opsi tidak pernah diterjemahkan,
 * jadi draft jawaban, kunci, dan skor sama untuk semua bahasa.
 */
export type Bahasa = 'id' | 'en' | 'zh';
/** Bahasa selain bawaan (punya berkas terjemahan). */
export type BahasaLain = Exclude<Bahasa, 'id'>;

export const BAHASA_BAWAAN: Bahasa = 'id';

export const DAFTAR_BAHASA: { kode: Bahasa; nama: string; singkat: string; htmlLang: string }[] = [
  { kode: 'id', nama: 'Bahasa Indonesia', singkat: 'ID', htmlLang: 'id' },
  { kode: 'en', nama: 'English', singkat: 'EN', htmlLang: 'en' },
  // Aksara sederhana (yang umum diajarkan & dipakai di Indonesia).
  { kode: 'zh', nama: '简体中文', singkat: '中文', htmlLang: 'zh-Hans' },
];

export function bahasaSah(x: unknown): x is Bahasa {
  return x === 'id' || x === 'en' || x === 'zh';
}
