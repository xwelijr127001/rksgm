/**
 * Geometri adegan jalan "Periksa rambu" (aset dari ekspor Claude Design). Murni angka, tanpa React: dipakai komponen DOM sekarang
 * dan bisa dipakai adegan Phaser nanti (koordinat dalam ruang 360 x 360 milik jalan-empat-lajur.svg).
 *
 * Sumber kebenaran = berkas svg/jalan-empat-lajur.svg (jalan x 44..316, pembatas lajur di 112, 180, 248) dan svg/truk-biru.svg
 * (viewBox 60 x 170). seni.test.ts memeriksa angka di sini terhadap isi berkas itu.
 */
export const RUANG = 360;
export const JALAN_X0 = 44;
export const JALAN_X1 = 316;
export const JUMLAH_LAJUR = 4;
export const LEBAR_LAJUR = (JALAN_X1 - JALAN_X0) / JUMLAH_LAJUR; // 68

/** Truk: viewBox 60 x 170, lebar 15% dari ruang, atas 27.78%, sehingga tengahnya tepat di tengah lajur 2. */
export const TRUK_VIEWBOX = { w: 60, h: 170 };
export const TRUK_LEBAR_PERSEN = 15;
export const TRUK_ATAS_PERSEN = 27.78;
export const LAJUR_TRUK = 2;

/** Batas kiri lajur n (1 = paling kiri) dalam ruang 360. */
export function xLajur(n: number): number { return JALAN_X0 + (n - 1) * LEBAR_LAJUR; }
export function tengahLajur(n: number): number { return xLajur(n) + LEBAR_LAJUR / 2; }

/** Posisi/ukuran kotak lajur n sebagai persen dari ruang (untuk tombol DOM yang menutupi lajur). */
export function persenLajur(n: number): { kiri: number; lebar: number; tengah: number } {
  return { kiri: (xLajur(n) / RUANG) * 100, lebar: (LEBAR_LAJUR / RUANG) * 100, tengah: (tengahLajur(n) / RUANG) * 100 };
}

/** Kiri truk (persen) agar tengahnya berimpit dengan tengah lajur `lajur`. */
export function kiriTrukPersen(lajur: number): number {
  return persenLajur(lajur).tengah - TRUK_LEBAR_PERSEN / 2;
}

/** Tinggi truk (persen dari ruang) menurut perbandingan viewBox. */
export function tinggiTrukPersen(): number {
  return TRUK_LEBAR_PERSEN * (TRUK_VIEWBOX.h / TRUK_VIEWBOX.w);
}
