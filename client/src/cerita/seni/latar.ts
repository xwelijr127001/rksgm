/**
 * Latar PANGGUNG mode cerita (640 x 480, ditampilkan `xMidYMid slice` di belakang Bu Rina).
 *
 * - kantor   : meja layanan Kantor Raksa tampak depan. Bahan & warna dari latar misi 5
 *              (dinding krem bergaris, jendela kota, jam dinding, tanaman, kayu meja). Latar m05
 *              sendiri adalah meja tampak atas dengan papan nama bertulisan, jadi tidak dipakai utuh:
 *              di panggung ia akan terpotong & tulisan bisa bertumpuk dengan tokoh/label.
 * - parkiran : latar parkiran misi 1 apa adanya + mobil Bu Rina (plat TANPA tulisan) di kanan.
 *
 * Aturan: TANPA teks (label suasana & nama ditaruh tampilan di atas latar), isi penting di pita
 * tengah (y 110..370) supaya tetap terlihat saat panggung lebar memotong atas-bawah, dan satu
 * string per latar (di-cache).
 */

import type { IdLatar } from '../tipe';
import { P, circle, cloud, line, path, rect, rrect } from '../../game/art/kit';
import { latar as latarParkiran } from '../../game/scenes/m01-parkiran';
import { MOBIL_H, MOBIL_W, mobilRinaUtuh } from './mobil';

export const LATAR_W = 640;
export const LATAR_H = 480;

/** Warna kantor, sama dengan latar misi 5 (scenes/m05-kantor.ts). */
const DINDING = '#f4ead6';
const GARIS_DINDING = '#f0e4cc';
const KAYU_MEJA = '#e0bd92';
const KAYU_TEPI = '#c99f70';
const KAYU_DEPAN = '#b98a58';

function jendelaKota(x: number, y: number, w: number, h: number): string {
  const dx = x + 10;
  const dy = y + 10;
  const iw = w - 20;
  const ih = h - 20;
  return `
    ${rrect(x, y, w, h, 8, '#e0cfac')}
    ${rect(dx, dy, iw, ih, P.langit)}
    ${rect(dx, dy, iw, ih * 0.36, P.langitAtas, 'opacity="0.55"')}
    ${cloud(dx + iw * 0.3, dy + ih * 0.2, 0.7)}
    ${rrect(dx + 8, dy + ih * 0.52, iw * 0.3, ih * 0.48, 2, '#dcc9a6')}
    ${rrect(dx + iw * 0.44, dy + ih * 0.38, iw * 0.34, ih * 0.62, 2, '#c8d8c9')}
    ${rrect(dx + iw * 0.82, dy + ih * 0.6, iw * 0.18, ih * 0.4, 2, '#e3d6bd')}
    ${[0, 1, 2].map((r) => rect(dx + iw * 0.5, dy + ih * (0.46 + r * 0.16), 10, 12, P.kaca) + rect(dx + iw * 0.64, dy + ih * (0.46 + r * 0.16), 10, 12, P.kaca)).join('')}
    ${rect(dx, dy + ih - 14, iw, 14, '#b9cfa8')}
    ${line(`M${x + w / 2} ${dy} V${dy + ih} M${dx} ${dy + ih * 0.45} H${dx + iw}`, '#e0cfac', 6)}`;
}

function jam(cx: number, cy: number): string {
  return `${circle(cx, cy, 34, '#e3d3b2')}${circle(cx, cy, 27, P.krem)}
    ${line(`M${cx} ${cy} V${cy - 17} M${cx} ${cy} L${cx + 12} ${cy + 7}`, P.tintaLembut, 4, 'opacity="0.7"')}
    ${circle(cx, cy, 3.6, P.tintaLembut, 'opacity="0.7"')}`;
}

function tanaman(x: number, dasar: number): string {
  return `
    ${circle(x - 18, dasar - 96, 24, P.hijauMuda, 'opacity="0.8"')}
    ${circle(x + 16, dasar - 110, 22, P.hijauDaun, 'opacity="0.8"')}
    ${circle(x - 2, dasar - 134, 20, P.hijauDaun, 'opacity="0.7"')}
    ${circle(x + 22, dasar - 78, 16, P.hijauMuda, 'opacity="0.75"')}
    ${path(`M${x - 30} ${dasar - 64} L${x + 30} ${dasar - 64} L${x + 24} ${dasar} L${x - 24} ${dasar} Z`, '#c9876a', 'opacity="0.9"')}
    ${rect(x - 30, dasar - 64, 60, 8, '#000', 'opacity="0.08"')}`;
}

/** Papan gambar Raksa tanpa tulisan: rumah, mobil, dan payung di bawah matahari. */
function papanGambar(x: number, y: number): string {
  return `
    ${rrect(x, y, 136, 104, 8, '#d9c7a2')}
    ${rrect(x + 8, y + 8, 120, 88, 5, P.hijauPucat)}
    ${circle(x + 98, y + 32, 14, P.kuningPucat)}
    ${path(`M${x + 20} ${y + 78} L${x + 20} ${y + 56} L${x + 38} ${y + 42} L${x + 56} ${y + 56} L${x + 56} ${y + 78} Z`, P.putih, 'opacity="0.95"')}
    ${rect(x + 33, y + 64, 10, 14, '#c8d8c9')}
    ${rrect(x + 64, y + 64, 44, 14, 6, P.hijauMuda)}
    ${path(`M${x + 70} ${y + 64} L${x + 76} ${y + 56} L${x + 96} ${y + 56} L${x + 102} ${y + 64} Z`, P.hijauMuda)}
    ${circle(x + 74, y + 79, 4, P.besiTua)}${circle(x + 98, y + 79, 4, P.besiTua)}
    ${path(`M${x + 30} ${y + 30} C${x + 30} ${y + 18} ${x + 62} ${y + 18} ${x + 62} ${y + 30} Z`, P.hijau, 'opacity="0.85"')}
    ${line(`M${x + 46} ${y + 30} V${y + 40}`, P.hijau, 2.4, 'opacity="0.85"')}
    ${rect(x + 8, y + 84, 120, 12, '#b9cfa8')}`;
}

/** Tepi atas meja layanan. Cukup tinggi supaya meja tetap terlihat di panggung HP (y ~45..435). */
const MEJA_Y = 340;

/** Meja layanan (tepi depan) di bawah: permukaan kayu, sisi depan dengan pita hijau Raksa, bel & tempat pena. */
function mejaLayanan(): string {
  const y = MEJA_Y;
  return `
    ${rect(0, y, 640, 22, KAYU_MEJA)}
    ${rect(0, y - 2, 640, 5, KAYU_TEPI)}
    ${rect(0, y + 20, 640, LATAR_H - y - 20, KAYU_DEPAN)}
    ${rect(0, y + 20, 640, 5, '#c99c68')}
    ${[20, 230, 440].map((x) => rrect(x, y + 40, 180, 70, 8, '#c49565')).join('')}
    ${rect(0, y + 28, 640, 6, P.hijau, 'opacity="0.85"')}
    <!-- bel layanan (kiri) -->
    ${path(`M72 ${y} C72 ${y - 18} 104 ${y - 18} 104 ${y} Z`, P.besiMuda)}${rect(66, y - 2, 44, 5, P.besi)}${circle(88, y - 20, 3.4, P.besi)}
    <!-- tempat pena & kertas (kanan) -->
    ${rrect(520, y - 22, 26, 22, 4, P.hijau, 'opacity="0.85"')}
    ${line(`M526 ${y - 22} L522 ${y - 38} M534 ${y - 22} L536 ${y - 40} M540 ${y - 22} L546 ${y - 35}`, P.tintaLembut, 3)}
    ${rrect(556, y - 12, 60, 12, 3, P.putih, 'opacity="0.9"')}${rrect(560, y - 18, 58, 10, 3, '#f7f3ea')}`;
}

function kantor(): string {
  let garis = '';
  for (let x = 20; x < LATAR_W; x += 52) garis += rect(x, 14, 18, 262, GARIS_DINDING);
  return `
    ${rect(0, 0, LATAR_W, LATAR_H, DINDING)}
    ${garis}
    ${rect(0, 0, LATAR_W, 14, '#e6d7b7')}
    ${rect(0, 276, LATAR_W, MEJA_Y - 276, '#eadcc0')}
    ${rect(0, 274, LATAR_W, 6, '#dccaa6')}
    ${jam(112, 120)}
    ${papanGambar(176, 110)}
    ${jendelaKota(446, 72, 156, 196)}
    ${tanaman(44, MEJA_Y)}
    ${tanaman(612, MEJA_Y)}
    ${mejaLayanan()}`;
}

/** Skala & letak mobil Bu Rina di latar parkiran (kanan, di pita tengah yang tetap terlihat). */
const S_MOBIL = 0.64;
const MOBIL_X = LATAR_W - MOBIL_W * S_MOBIL - 6;
const MOBIL_Y = 206;

function parkiran(): string {
  return `
    ${latarParkiran()}
    <g transform="translate(${MOBIL_X} ${MOBIL_Y}) scale(${S_MOBIL})">${mobilRinaUtuh({ teksPlat: false })}</g>`;
}

const cache = new Map<IdLatar, string>();

/** Isi SVG (tanpa pembungkus) latar panggung 640 x 480. Di-cache per latar. */
export function latarPanggung(id: IdLatar): string {
  const ada = cache.get(id);
  if (ada) return ada;
  const svg = id === 'parkiran' ? parkiran() : kantor();
  cache.set(id, svg);
  return svg;
}

/** Kotak mobil di latar parkiran (satuan latar), untuk tampilan yang ingin tidak menutupinya. */
export const MOBIL_LATAR = { x: MOBIL_X, y: MOBIL_Y, w: MOBIL_W * S_MOBIL, h: MOBIL_H * S_MOBIL } as const;
