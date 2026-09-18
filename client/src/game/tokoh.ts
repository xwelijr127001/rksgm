/**
 * Sprite tokoh Raksa (Mr Roger, Miss Raksa, Bu Isti) untuk panel HTML. Tokoh tidak
 * digambar di adegan supaya tidak pernah menutupi objek, label, atau tanda pembahasan.
 * Gambar di client/public/karakter/ dibuat oleh `node tools/siapkan-karakter.mjs`.
 * Bila gambar gagal dimuat, tokoh dilewati diam-diam: permainan tetap jalan.
 */

import { TOKOH, type IdTokoh } from '@shared/brand';
import meta from './art/karakter-sprite.json';

/** Sheet besar (halaman HTML & proyektor) per tokoh: awalan berkas + ukuran frame. */
export const SPRITE_BESAR: Record<IdTokoh, { dasar: string; frameW: number; frameH: number; frames: number }> = {
  ceo: { dasar: `/karakter/${meta.ceo.berkas}-besar`, ...meta.ceo.besar, frames: meta.frames },
  missRaksa: { dasar: `/karakter/${meta.missRaksa.berkas}-besar`, ...meta.missRaksa.besar, frames: meta.frames },
  isti: { dasar: `/karakter/${meta.isti.berkas}-besar`, ...meta.isti.besar, frames: meta.frames },
};
const sudahDiunduh: HTMLImageElement[] = [];

/**
 * Unduh sprite halaman selagi koneksi masih ada. Bu Isti tampil justru saat koneksi HP
 * terputus, jadi gambarnya harus sudah ada di memori sebelum itu terjadi.
 */
export function prefetchSpriteHalaman(): void {
  if (sudahDiunduh.length) return;
  // Pilih format yang sama dengan yang dipakai CSS (image-set WebP, selain itu PNG).
  const webp = typeof CSS !== 'undefined' && CSS.supports('background-image', 'image-set(url("a.webp") type("image/webp"))');
  for (const id of ['isti', 'missRaksa', 'ceo'] as const) {
    if (!TOKOH[id].aktif) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = `${SPRITE_BESAR[id].dasar}.${webp ? 'webp' : 'png'}`;
    sudahDiunduh.push(img);
  }
}

/** Kalimat bergiliran menurut nomor (misi), supaya tiap misi terasa berbeda. */
export function kalimatKe(daftar: readonly string[], nomor: number): string {
  if (!daftar.length) return '';
  const n = Math.abs(Math.trunc(nomor));
  return daftar[n % daftar.length]!;
}
