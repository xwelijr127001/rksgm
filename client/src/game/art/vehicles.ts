/**
 * Kendaraan & alat berat (tampak samping, bergaris tepi tinta).
 * Dipakai beberapa adegan supaya bentuknya konsisten di seluruh kota.
 */

import { INK, INK_TIPIS, P, circle, line, path, rrect, shadow } from './kit';

/** Roda kartun. */
export function wheel(cx: number, cy: number, r: number): string {
  return circle(cx, cy, r, '#2f3a34', INK) + circle(cx, cy, r * 0.45, P.besiMuda, INK_TIPIS) + circle(cx, cy, r * 0.15, P.besiTua);
}

/**
 * Mobil sedan menghadap KIRI (depan di kiri), 300 x 130 satuan, dasar roda y=122.
 * `penyok` menambah lekukan di spatbor depan kiri.
 */
export function carSide(body: string, opts: { penyok?: boolean; x?: number; y?: number } = {}): string {
  const ox = opts.x ?? 0;
  const oy = opts.y ?? 0;
  return `<g transform="translate(${ox} ${oy})">
    ${shadow(150, 124, 140, 9)}
    ${path('M14 96 C12 82 18 74 32 72 L70 68 L102 34 C108 28 116 26 124 26 L204 26 C214 26 222 30 228 38 L252 68 L278 74 C290 77 294 86 293 98 L292 108 L14 108 Z', body, INK)}
    ${path('M112 36 L128 36 L128 66 L86 66 Z', P.kaca, INK_TIPIS)}
    ${path('M136 36 L200 36 C208 36 212 40 216 46 L230 66 L136 66 Z', P.kaca, INK_TIPIS)}
    ${line('M132 36 V104', P.tinta, 2, 'opacity="0.45"')}
    ${line('M20 90 H290', '#000', 3, 'opacity="0.12"')}
    ${rrect(156, 76, 18, 5, 2.5, P.besiTua)}
    ${rrect(86, 76, 18, 5, 2.5, P.besiTua)}
    ${rrect(16, 78, 18, 10, 4, '#fff1b8', INK_TIPIS)}
    ${rrect(280, 80, 12, 10, 4, P.merah, INK_TIPIS)}
    ${path('M112 38 L120 38 L100 60 L96 60 Z', P.putih, 'opacity="0.55"')}
    ${wheel(74, 108, 20)}
    ${wheel(234, 108, 20)}
    ${opts.penyok ? '' : ''}
  </g>`;
}

/** Lekukan penyok (dipasang di atas spatbor depan kiri mobil, koordinat lokal 70 x 60). */
export function dentPatch(): string {
  return `
    ${path('M8 44 C4 30 10 18 22 14 C34 10 50 14 58 24 C64 32 62 44 54 50 C42 58 20 56 8 44 Z', '#000', 'opacity="0.18"')}
    ${line('M16 30 l10 6 -8 7 m16 -18 l6 10 -6 5 m12 -6 l6 8', P.tinta, 3)}
    ${line('M26 8 l-3 -7 M44 8 l2 -8 M58 16 l7 -5', P.oranye, 4)}`;
}

/** Excavator menghadap KANAN, 300 x 170, dasar y=160. */
export function excavator(opts: { rusak?: boolean } = {}): string {
  return `
    ${shadow(120, 162, 120, 9)}
    ${rrect(20, 120, 180, 40, 20, P.besiTua, INK)}
    ${[44, 80, 116, 152, 184].map((x) => circle(x, 140, 11, P.besi, INK_TIPIS)).join('')}
    ${rrect(52, 104, 120, 18, 8, P.kuningTua, INK)}
    ${rrect(40, 52, 170, 58, 12, P.kuning, INK)}
    ${rrect(50, 18, 70, 70, 12, '#eef3f6', INK)}
    ${rrect(60, 28, 50, 32, 6, P.kaca, INK_TIPIS)}
    ${path('M62 30 L76 30 L64 50 L60 50 Z', P.putih, 'opacity="0.5"')}
    ${path('M200 74 L256 20 L272 34 L214 92 Z', P.kuning, INK)}
    ${path('M256 20 L292 70 L276 80 L246 34 Z', P.kuning, INK)}
    ${path('M280 72 C300 78 306 96 300 110 L272 112 C270 98 272 86 280 72 Z', P.besi, INK)}
    ${circle(256, 24, 7, P.besiTua, INK_TIPIS)}
    ${rrect(186, 34, 10, 20, 4, P.besi, INK_TIPIS)}
    ${opts.rusak ? line('M236 50 l14 8 -12 8 m18 -24 l12 10', P.tinta, 3) + line('M242 30 l4 -10 M262 44 l12 -6', P.oranye, 4) : ''}`;
}

/** Forklift menghadap KANAN, 220 x 170, dasar y=160. */
export function forklift(opts: { penyok?: boolean } = {}): string {
  return `
    ${shadow(100, 162, 96, 8)}
    ${rrect(20, 86, 120, 60, 12, P.kuning, INK)}
    ${rrect(20, 128, 120, 18, 8, P.kuningTua, INK_TIPIS)}
    ${rrect(34, 30, 10, 60, 5, P.besi, INK)}${rrect(104, 30, 10, 60, 5, P.besi, INK)}
    ${rrect(30, 24, 90, 12, 6, P.besi, INK)}
    ${rrect(54, 70, 40, 20, 6, '#3c4a52', INK_TIPIS)}
    ${rrect(150, 20, 12, 128, 5, P.besiTua, INK)}${rrect(166, 20, 12, 128, 5, P.besiTua, INK)}
    ${rrect(150, 140, 66, 10, 4, P.besiTua, INK)}
    ${wheel(48, 146, 18)}${wheel(118, 148, 15)}
    ${opts.penyok ? path('M60 96 C70 90 92 90 100 100 C104 110 96 120 84 122 C70 122 58 114 60 96 Z', '#000', 'opacity="0.2"') + line('M68 102 l10 6 -8 6 m16 -16 l8 10', P.tinta, 3) + line('M76 88 l-2 -9 M96 92 l7 -6', P.oranye, 4) : ''}`;
}

/** Truk kargo menghadap KIRI, 340 x 170, dasar y=160. */
export function truck(body = P.biru): string {
  return `
    ${shadow(170, 162, 160, 9)}
    ${rrect(110, 30, 220, 110, 8, '#e9eef0', INK)}
    ${line('M150 30 V140 M190 30 V140 M230 30 V140 M270 30 V140 M310 30 V140', P.besiMuda, 2)}
    ${path('M20 140 L20 84 C20 70 30 62 44 62 L80 62 L104 90 L104 140 Z', body, INK)}
    ${path('M40 70 L76 70 L94 92 L40 92 Z', P.kaca, INK_TIPIS)}
    ${rrect(14, 118, 12, 10, 4, '#fff1b8', INK_TIPIS)}
    ${wheel(58, 146, 18)}${wheel(170, 146, 18)}${wheel(290, 146, 18)}`;
}
