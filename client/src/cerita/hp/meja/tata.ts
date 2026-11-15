/**
 * TATA LETAK MEJA KASUS (satuan dunia 360 x 400, tampak atas): satu sumber koordinat untuk adegan Phaser DAN lapisan
 * tombol HTML di atas kanvas (keyboard / pembaca layar), jadi keduanya selalu menunjuk benda yang sama.
 * Kotak = pusat (x, y) + ukuran sasaran sentuh (w, h). Pada lebar HP terkecil (kanvas ±328 px CSS) 1 satuan ≈ 0,91 px:
 * semua sasaran >= 80 satuan (>= 72 px CSS).
 */
import type { TempatMeja } from '../../tipe';

export const MEJA_W = 360;
export const MEJA_H = 400;

export interface Kotak { x: number; y: number; w: number; h: number }
export type ObjekMeja = 'map' | TempatMeja;

/** Objek meja: map di alas hijau (kiri), baki Komite & kontak di kolom kanan, papan kelengkapan di bawah map. */
export const OBJEK: Record<ObjekMeja, Kotak> = {
  map: { x: 115, y: 170, w: 206, h: 214 },
  komite: { x: 290, y: 78, w: 128, h: 132 },
  kontak: { x: 290, y: 230, w: 128, h: 156 },
  papan: { x: 115, y: 343, w: 206, h: 98 },
};

/** Kartu status pengajuan (bukan sasaran sentuh). */
export const STATUS: Kotak = { x: 290, y: 362, w: 128, h: 60 };

/** Letak map (pusat + skala) saat direncanakan di tiap tempat; 'kontak' = map tetap di tempatnya, laporannya yang pindah. */
export const LETAK_MAP: Record<'rumah' | TempatMeja, { x: number; y: number; s: number }> = {
  rumah: { x: 115, y: 160, s: 1 },
  komite: { x: 290, y: 66, s: 0.5 },
  papan: { x: 66, y: 340, s: 0.42 },
  kontak: { x: 115, y: 160, s: 1 },
};

/** Sasaran sentuh map: kotak objek map di alas, atau kotak map kecil di tempat rencananya (papan / baki). */
export function kotakMapDi(tempat: TempatMeja | null): Kotak {
  if (!tempat || tempat === 'kontak') return OBJEK.map;
  const l = LETAK_MAP[tempat];
  return { x: l.x, y: l.y, w: Math.max(96, 190 * l.s + 16), h: Math.max(84, 140 * l.s + 16) };
}

/** Lembar laporan saat direncanakan ke kontak: diselipkan di sisi kiri atas kartu kontak. */
export const LETAK_LAPORAN = { x: 244, y: 192, s: 0.5 };

/** Bidikan dekat map terbuka: map memenuhi dunia, kartu berkas 2 kolom x 4 baris (urut tabel fakta, baca kiri -> kanan). */
export const MAP_BUKA: Kotak = { x: 180, y: 200, w: 344, h: 372 };
export const KARTU = { w: 148, h: 80 };
export function kotakKartu(i: number): Kotak {
  const kol = i % 2;
  const baris = Math.floor(i / 2);
  return { x: 22 + kol * 168 + KARTU.w / 2, y: 30 + baris * 90 + KARTU.h / 2, w: KARTU.w, h: KARTU.h };
}

/** Kotak dunia -> persen kotak kanvas (lapisan tombol HTML). */
export function persen(k: Kotak): { left: string; top: string; width: string; height: string } {
  return {
    left: `${((k.x - k.w / 2) / MEJA_W) * 100}%`,
    top: `${((k.y - k.h / 2) / MEJA_H) * 100}%`,
    width: `${(k.w / MEJA_W) * 100}%`,
    height: `${(k.h / MEJA_H) * 100}%`,
  };
}
