/**
 * Geometri adegan jalan "Periksa rambu" (T-020 batch 1: seni PIKSEL, 1 piksel seni = 1 px CSS). Murni angka, tanpa React.
 * Sumber kebenaran = README set jalan (character/aktivitas-ep2-pixel-v1/jalan/README.md) dan berkas PNG di
 * seni/aktivitas/jalan/: blok jalan 278 px (bahu 7 + empat lajur 66 + bahu 7) di tengah adegan selebar W, tinggi adegan 236.
 * seni.test.ts memeriksa angka di sini terhadap ukuran berkas PNG itu.
 *
 * Dulu (ekspor Claude Design): persen dari ruang 360 x 360 milik jalan-empat-lajur.svg. Kini piksel tetap, karena seni piksel
 * tidak boleh diskalakan.
 */
export const TINGGI_ADEGAN = 236;
/** Blok jalan: lebar total, bahu di tiap sisi, lebar satu lajur. */
export const LEBAR_JALAN = 278;
export const BAHU = 7;
export const LEBAR_LAJUR = 66;
export const JUMLAH_LAJUR = 4;
export const LAJUR_TRUK = 2;
/** Truk tampak atas (truk-atas.png 40 x 124): 13 px dari kiri lajurnya, 80 px dari atas adegan; bayangan di (+3, +3). */
export const TRUK = { w: 40, h: 124, geser: 13, atas: 80, bayangan: 3 } as const;
/** Cincin putus-putus di sekeliling truk: 6 px dari kiri lajur, atas 74, 54 x 136. */
export const CINCIN = { geser: 6, atas: 74, w: 54, h: 136 } as const;
/** Panah marka (18 x 27): 24 px dari kiri lajur, atas 14. */
export const PANAH = { w: 18, h: 27, geser: 24, atas: 14 } as const;
/** Tuts lajur (atlas tuts-lajur.png, sel 40 x 30; kolom = lajur 1..4, baris = keadaan): 13 px dari kiri lajur, atas 200. */
export const TUTS = { w: 40, h: 30, geser: 13, atas: 200 } as const;
export type KeadaanTuts = 'biasa' | 'terpilih' | 'dilarang' | 'lajurKiri';
export const BARIS_TUTS: Readonly<Record<KeadaanTuts, number>> = { biasa: 0, terpilih: 1, dilarang: 2, lajurKiri: 3 };

/** Tepi kiri blok jalan pada adegan selebar W. */
export function x0Jalan(W: number): number { return (W - LEBAR_JALAN) / 2; }
/** Tepi kiri lajur n (1 = paling kiri) pada adegan selebar W. */
export function kiriLajur(n: number, W: number): number { return x0Jalan(W) + BAHU + (n - 1) * LEBAR_LAJUR; }
export function tengahLajur(n: number, W: number): number { return kiriLajur(n, W) + LEBAR_LAJUR / 2; }
/** Kiri truk di lajur `lajur`. */
export function kiriTruk(lajur: number, W: number): number { return kiriLajur(lajur, W) + TRUK.geser; }

/**
 * Jarak (px) dari tepi kiri BLOK JALAN ke tepi kiri lajur n: dipakai DOM sebagai `calc(var(--x0) + Npx)`, jadi adegan tidak
 * perlu mengukur lebarnya sendiri.
 */
export function geserLajur(n: number): number { return BAHU + (n - 1) * LEBAR_LAJUR; }
/** Posisi latar sel tuts lajur n pada keadaan tertentu (px, negatif) di atlas. */
export function selTuts(n: number, keadaan: KeadaanTuts): { x: number; y: number } {
  return { x: -(n - 1) * TUTS.w, y: -BARIS_TUTS[keadaan] * TUTS.h };
}
