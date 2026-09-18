/**
 * Kit gambar adegan 2D RAKSA GAME.
 *
 * SISTEM VISUAL (dipakai semua adegan):
 * - Gaya "diorama ilustratif": tampak depan/samping, bentuk membulat, warna datar.
 * - Latar belakang TANPA garis tepi dan sedikit lebih pucat; objek yang bisa
 *   diketuk & karakter memakai garis tepi tinta 3 satuan supaya menonjol.
 * - Bayangan = elips tinta 15%; sorotan = putih 25%.
 * - Warna dari palet brand (shared/brand.ts) + netral hangat di bawah.
 * - Merah/hijau TIDAK dipakai sebagai tanda pilihan sebelum pembahasan
 *   (hijau = tepat, merah-oranye = kurang tepat hanya saat REVEAL).
 *
 * Semua fungsi mengembalikan string SVG (warna literal; variabel CSS tidak
 * berlaku saat SVG dirasterisasi menjadi tekstur).
 */

import type { ArtRef } from '../types';

export const P = {
  kuning: '#f6c445',
  kuningTua: '#d8a41f',
  kuningPucat: '#fbe7a6',
  hijau: '#176b45',
  hijauMuda: '#2e9a66',
  hijauDaun: '#58b56f',
  hijauPucat: '#dff0e4',
  krem: '#fff9e9',
  kremTua: '#f3e7c9',
  tinta: '#17362a',
  tintaLembut: '#47604f',
  cokelat: '#5b4636',
  cokelatMuda: '#8a6a4f',
  kayu: '#c8955f',
  kayuTua: '#9c6b3f',
  merah: '#c4452f',
  oranye: '#e8833a',
  biru: '#2f6fb0',
  biruMuda: '#7fb3e0',
  biruPucat: '#e2edf8',
  langit: '#cfe8f5',
  langitAtas: '#a9d4ee',
  putih: '#ffffff',
  kaca: '#cfe6f5',
  besi: '#6b7a72',
  besiTua: '#3f4d46',
  besiMuda: '#a7b3ac',
  aspal: '#77837c',
  beton: '#ddd5c5',
  betonTua: '#c3b9a6',
  tanah: '#d2b48a',
  tanahTua: '#a88862',
  air: '#6fb3de',
  ungu: '#7a5aa6',
  teal: '#2e7d7a',
} as const;

/** Garis tepi objek interaktif & karakter. */
export const INK = `stroke="${P.tinta}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
export const INK_TIPIS = `stroke="${P.tinta}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

/** Bungkus isi menjadi ArtRef. Ukuran piksel diisi saat rasterisasi. */
export function art(key: string, w: number, h: number, body: string): ArtRef {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="__W__" height="__H__">` +
    body +
    `</svg>`;
  return { key, svg, w, h };
}

export function shadow(cx: number, cy: number, rx: number, ry = rx * 0.28, opacity = 0.15): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${P.tinta}" opacity="${opacity}"/>`;
}

export function rect(x: number, y: number, w: number, h: number, fill: string, extra = ''): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
}

export function rrect(x: number, y: number, w: number, h: number, r: number, fill: string, extra = ''): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
}

export function circle(cx: number, cy: number, r: number, fill: string, extra = ''): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
}

export function path(d: string, fill: string, extra = ''): string {
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}

export function line(d: string, color: string, width: number, extra = ''): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

/** Teks di dalam gambar (papan nama). Font sistem; jangan untuk kalimat panjang. */
export function text(x: number, y: number, s: string, size: number, fill: string, weight = 800, anchor = 'middle'): string {
  const aman = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${aman}</text>`;
}

export function linearGradient(id: string, top: string, bottom: string): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`;
}

// ------------------------------------------------------------------ elemen latar

export function cloud(x: number, y: number, s = 1, opacity = 0.95): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
    <ellipse cx="0" cy="0" rx="34" ry="14" fill="${P.putih}"/>
    <circle cx="-16" cy="-6" r="13" fill="${P.putih}"/>
    <circle cx="4" cy="-13" r="17" fill="${P.putih}"/>
    <circle cx="22" cy="-4" r="12" fill="${P.putih}"/></g>`;
}

export function tree(x: number, y: number, s = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${shadow(0, 0, 20, 6)}
    <rect x="-5" y="-34" width="10" height="34" rx="5" fill="${P.cokelatMuda}"/>
    <circle cx="-13" cy="-40" r="15" fill="${P.hijauMuda}"/>
    <circle cx="13" cy="-37" r="13" fill="${P.hijau}"/>
    <circle cx="0" cy="-54" r="17" fill="${P.hijauDaun}"/>
    <circle cx="-6" cy="-60" r="6" fill="${P.putih}" opacity="0.18"/></g>`;
}

/** Gedung latar (tanpa garis tepi), jendela rapi. */
export function building(x: number, baseY: number, w: number, h: number, body: string, opts: { roof?: string; windows?: boolean; sign?: string } = {}): string {
  const top = baseY - h;
  let win = '';
  if (opts.windows !== false) {
    const cols = Math.max(1, Math.floor((w - 16) / 28));
    const rows = Math.max(1, Math.floor((h - 26) / 30));
    const gap = (w - cols * 16) / (cols + 1);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        win += rrect(x + gap + c * (16 + gap), top + 14 + r * 30, 16, 18, 3, P.kaca, 'opacity="0.95"');
      }
    }
  }
  return `<g>
    ${rrect(x, top, w, h, 4, body)}
    ${rect(x, top, w, 8, opts.roof ?? '#000', `opacity="${opts.roof ? 1 : 0.12}"`)}
    ${win}
    ${opts.sign ? rrect(x + 8, top + 6, w - 16, 18, 4, P.krem) + text(x + w / 2, top + 20, opts.sign, 12, P.hijau) : ''}
  </g>`;
}

/** Pola garis ubin/beton untuk lantai. */
export function floorLines(y0: number, y1: number, w: number, color: string, gap = 64): string {
  let s = '';
  for (let x = -40; x < w + 40; x += gap) s += line(`M${x} ${y1} L${x + (x - w / 2) * 0.35} ${y0}`, color, 2, 'opacity="0.35"');
  s += line(`M0 ${(y0 + y1) / 2} H${w}`, color, 2, 'opacity="0.25"');
  return s;
}

// ------------------------------------------------------------------ penanda umum

/** Retakan/penyok kecil + garis benturan (tanpa warna penilaian). */
export function impactMarks(cx: number, cy: number, s = 1): string {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    ${line('M-10 -14 l-6 -10 M2 -18 l2 -12 M14 -12 l9 -8', P.oranye, 4)}
  </g>`;
}
