/**
 * Misi 4 - Excavator Miring (proyek jalan baru).
 * Mekanik: CATATAN TEMUAN. Ketuk empat bagian adegan yang memberi informasi
 * pemeriksaan; tiap ketukan dicatat (operator = didengar). Ketuk lagi untuk batal.
 *
 * Excavator digambar sekali dalam koordinat dunia (miring, bagian belakang
 * masuk tepi galian). Bagian yang bisa diketuk (plat seri, roda rantai, boom)
 * "dipotong" dari gambar dunia yang sama supaya pas menempel di badan unit.
 */

import type { ArtRef, SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, circle, line, linearGradient, path, rect, rrect, shadow, text, tree } from '../art/kit';
import { personArt } from '../art/characters';

// ------------------------------------------------------------------ geometri excavator

/** Titik tumpu = ujung depan-bawah roda rantai (masih di tanah). */
export const PX = 384;
export const PY = 392;
/** Kemiringan (derajat, negatif = depan naik, belakang turun ke galian). */
const MIRING = -9;
const RAD = Math.PI / 180;
const COS = Math.cos(MIRING * RAD);
const SIN = Math.sin(MIRING * RAD);

export type Titik = [number, number];

/** Koordinat lokal excavator (x ke depan/kanan, y ke atas negatif) -> dunia. */
export function dunia(lx: number, ly: number): Titik {
  return [PX + lx * COS - ly * SIN, PY + lx * SIN + ly * COS];
}

/** Bungkus gambar lokal excavator supaya ikut miring di dunia. */
export function miring(isi: string): string {
  return `<g transform="translate(${PX} ${PY}) rotate(${MIRING})">${isi}</g>`;
}

/**
 * Potong sebagian gambar dunia menjadi ArtRef + titik tengahnya.
 * `titik` = sudut-sudut bagian (dunia); kotak = batasnya + `pad`.
 */
export function potong(key: string, titik: Titik[], pad: number, isiDunia: string): { art: ArtRef; x: number; y: number } {
  const xs = titik.map((t) => t[0]);
  const ys = titik.map((t) => t[1]);
  const x0 = Math.floor(Math.min(...xs) - pad);
  const y0 = Math.floor(Math.min(...ys) - pad);
  const w = Math.ceil(Math.max(...xs) + pad) - x0;
  const h = Math.ceil(Math.max(...ys) + pad) - y0;
  return { art: art(key, w, h, `<g transform="translate(${-x0} ${-y0})">${isiDunia}</g>`), x: x0 + w / 2, y: y0 + h / 2 };
}

export function kotakLokal(x: number, y: number, w: number, h: number): Titik[] {
  return [dunia(x, y), dunia(x + w, y), dunia(x, y + h), dunia(x + w, y + h)];
}

// Bagian-bagian (lokal)
export const RANTAI = { x: -194, y: -50, w: 194, h: 50 };
const PLAT = { cx: -133, cy: -93, w: 72, h: 40 };
export const SIKU: Titik = [62, -232]; // sendi boom-lengan
export const ROOT: Titik = [-18, -104]; // pangkal boom

export function rodaRantaiLokal(): string {
  let tapak = '';
  for (let x = -172; x <= -22; x += 15) tapak += line(`M${x} -49 v9 M${x} -10 v9`, P.besiTua, 3, 'opacity="0.9"');
  const roda = (cx: number, r: number): string => circle(cx, -25, r, P.besi, INK_TIPIS) + circle(cx, -25, r * 0.38, P.besiTua);
  return `
    ${rrect(RANTAI.x, RANTAI.y, RANTAI.w, RANTAI.h, 25, '#2f3a34', INK)}
    ${tapak}
    ${rrect(-176, -37, 158, 24, 12, P.besiTua)}
    ${roda(-169, 15)}${roda(-25, 15)}
    ${[-136, -108, -80, -52].map((x) => circle(x, -25, 7.5, P.besiMuda, INK_TIPIS)).join('')}
    ${path('M-194 -18 C-190 -4 -176 2 -160 0 L-150 -6 C-164 -4 -180 -8 -186 -22 Z', P.tanahTua, 'opacity="0.9"')}
    ${circle(-150, -3, 4, P.tanahTua)}`;
}

function platLokal(): string {
  const { cx, cy, w, h } = PLAT;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return `
    ${rrect(x - 3, y - 3, w + 6, h + 6, 7, P.besiTua, INK)}
    ${rrect(x + 1, y + 1, w - 2, h - 2, 4, '#eef2f0')}
    ${rrect(x + 5, y + 5, 24, h - 10, 3, P.biru)}
    ${text(x + 17, cy + 5, 'SN', 13, P.putih, 900)}
    ${line(`M${x + 36} ${cy - 9} H${x + w - 8} M${x + 36} ${cy} H${x + w - 8} M${x + 36} ${cy + 9} H${x + w - 20}`, P.besiTua, 3.4)}
    ${circle(x + 3, y + 3, 1.8, P.besiMuda)}${circle(x + w - 3, y + 3, 1.8, P.besiMuda)}
    ${circle(x + 3, y + h - 3, 1.8, P.besiMuda)}${circle(x + w - 3, y + h - 3, 1.8, P.besiMuda)}`;
}

/**
 * Goresan di boom (relatif ke pangkal boom): cat terkelupas memperlihatkan besi,
 * garis gores zig-zag, dan satu lekukan kecil dekat tekukan. Warna besi netral
 * (bukan merah/oranye) supaya tidak lebih mencolok dari objek lain.
 */
function goresBoom(rx: number, ry: number): string {
  return `<g transform="translate(${rx} ${ry})">
    ${path('M1 -24 L12 -31 L16 -45 L22 -57 L25 -75 L16 -73 L10 -60 L4 -44 Z', P.besiMuda, 'opacity="0.95"')}
    ${line('M-1 -22 l4 -10 l-2 -3 l5 -12 l-1 -4 l4 -10', P.besiTua, 2.6)}
    ${line('M9 -28 l3 -9 l-2 -3 l5 -12 l-1 -4 l5 -12', P.besiTua, 2.6)}
    ${line('M19 -34 l2 -6 l-1 -3 l3 -8', P.besiTua, 2.2)}
    <ellipse cx="31" cy="-92" rx="9" ry="5.5" transform="rotate(-28 31 -92)" fill="${P.tinta}" opacity="0.2"/>
    ${line('M24 -88 l5 -5 l2 4 l6 -7', P.tinta, 2)}
  </g>`;
}

export function boomLokal(): string {
  const [ex, ey] = SIKU;
  const [rx, ry] = ROOT;
  return `
    ${line(`M${rx + 16} ${ry - 4} L${rx + 36} ${ry - 64}`, P.tinta, 14)}
    ${line(`M${rx + 16} ${ry - 4} L${rx + 36} ${ry - 64}`, P.besi, 9)}
    ${line(`M${rx + 34} ${ry - 58} L${rx + 46} ${ry - 92}`, P.tinta, 9)}
    ${line(`M${rx + 34} ${ry - 58} L${rx + 46} ${ry - 92}`, P.besiMuda, 4.5)}
    ${path(`M${rx - 16} ${ry + 4} L${rx + 12} ${ry - 100} C${rx + 18} ${ry - 122} ${ex - 34} ${ey - 10} ${ex - 14} ${ey - 16} L${ex + 12} ${ey - 4} L${ex + 6} ${ey + 14} C${ex - 20} ${ey + 20} ${rx + 40} ${ry - 84} ${rx + 16} ${ry + 6} Z`, P.kuning, INK)}
    ${line(`M${rx - 4} ${ry - 20} L${rx + 18} ${ry - 100} C${rx + 22} ${ry - 112} ${ex - 36} ${ey + 2} ${ex - 18} ${ey - 4}`, P.putih, 3, 'opacity="0.35"')}
    ${goresBoom(rx, ry)}
    ${circle(rx, ry, 8, P.besiTua, INK_TIPIS)}${circle(rx, ry, 3, P.besiMuda)}
    ${circle(ex, ey, 9, P.besiTua, INK_TIPIS)}${circle(ex, ey, 3.4, P.besiMuda)}`;
}

/** Badan excavator (rumah mesin, kabin, lengan & bucket) - tidak bisa diketuk. */
export function badanDunia(): string {
  const [ex, ey] = dunia(SIKU[0], SIKU[1]);
  // Lengan: dari sendi siku turun ke bucket yang bertumpu di tanah.
  const bx = ex + 38;
  const by = 338;
  const dx = bx - ex;
  const dy = by - ey;
  const n = Math.hypot(dx, dy);
  const px = (-dy / n) * 11;
  const py = (dx / n) * 11;
  const lengan = `M${ex + px} ${ey + py} L${ex - px} ${ey - py} L${bx - px * 0.8} ${by - py * 0.8} L${bx + px * 0.8} ${by + py * 0.8} Z`;
  const rumah = `
    ${rrect(-150, -66, 110, 18, 5, P.besiTua, INK_TIPIS)}
    ${rrect(-212, -120, 52, 58, 18, P.kuningTua, INK)}
    ${rrect(-196, -126, 180, 66, 14, P.kuning, INK)}
    ${rrect(-190, -78, 168, 12, 6, P.kuningTua)}
    ${line('M-189 -112 v22 M-182 -112 v22', P.kuningTua, 3)}
    ${rrect(-120, -146, 9, 22, 3, P.besiTua, INK_TIPIS)}
    ${rrect(-92, -202, 70, 82, 11, '#eef3f6', INK)}
    ${rrect(-84, -194, 52, 44, 7, P.kaca, INK_TIPIS)}
    ${path('M-80 -190 L-66 -190 L-78 -164 L-80 -164 Z', P.putih, 'opacity="0.6"')}
    ${line('M-84 -140 H-34', P.besiMuda, 2.4)}
    ${rrect(-44, -136, 10, 4, 2, P.besiTua)}
    ${rrect(-98, -208, 82, 11, 5, P.kuningTua, INK_TIPIS)}
    ${rrect(-36, -120, 28, 34, 8, P.kuningTua, INK)}`;
  return `
    ${shadow(PX - 96, PY + 4, 110, 10)}
    ${path(lengan, P.kuning, INK)}
    ${circle(ex, ey, 11.5, P.kuning, INK)}
    ${line(`M${ex + px * 1.6 + 4} ${ey + py * 1.6 + 18} L${bx + px * 1.4} ${by - 60}`, P.tinta, 10)}
    ${line(`M${ex + px * 1.6 + 4} ${ey + py * 1.6 + 18} L${bx + px * 1.4} ${by - 60}`, P.besiMuda, 5)}
    ${shadow(bx + 2, by + 31, 36, 5)}
    ${path(`M${bx - 30} ${by - 6} C${bx - 30} ${by - 30} ${bx + 16} ${by - 36} ${bx + 30} ${by - 14} L${bx + 34} ${by + 22} L${bx - 14} ${by + 26} C${bx - 26} ${by + 20} ${bx - 30} ${by + 8} ${bx - 30} ${by - 6} Z`, P.besi, INK)}
    ${line(`M${bx - 12} ${by + 26} v6 M${bx + 4} ${by + 25} v6 M${bx + 20} ${by + 24} v6`, P.tinta, 4)}
    ${circle(bx, by - 6, 6, P.besiTua, INK_TIPIS)}
    ${circle(ex, ey, 9, P.besiTua, INK_TIPIS)}
    ${miring(rumah)}`;
}

// ------------------------------------------------------------------ latar

function kerucut(x: number, y: number, s = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${shadow(0, 0, 16, 4)}
    ${path('M-5 -40 L5 -40 L14 -2 L-14 -2 Z', P.oranye)}
    ${rect(-8, -26, 16, 6, P.putih)}
    ${rrect(-17, -4, 34, 6, 3, '#d4732f')}</g>`;
}

function barikade(x: number, y: number, w = 70): string {
  let belang = '';
  for (let i = 0; i < w; i += 20) belang += path(`M${x + i} ${y} L${x + i + 10} ${y} L${x + i + 4} ${y + 14} L${x + i - 6} ${y + 14} Z`, P.putih, 'opacity="0.9"');
  return `
    ${rect(x + 6, y + 10, 5, 26, '#b9ada0')}${rect(x + w - 11, y + 10, 5, 26, '#b9ada0')}
    <g>${rrect(x, y, w, 14, 3, P.oranye)}<clipPath id="bk${x}"><rect x="${x}" y="${y}" width="${w}" height="14" rx="3"/></clipPath><g clip-path="url(#bk${x})">${belang}</g></g>`;
}

export function latar(): string {
  const langit = linearGradient('m04-langit', P.langitAtas, '#e4f2f8');
  const kota = [
    [20, 58, 44, '#d9cdb7'], [66, 40, 60, '#cddbd0'], [112, 52, 38, '#e1d3bb'], [300, 46, 52, '#d6cfc0'],
    [352, 36, 34, '#cfdcd2'], [470, 44, 48, '#dccfb8'], [520, 60, 30, '#cfd9d2'],
  ] as const;
  const gedung = kota.map(([x, w, h, c]) => {
    let jendela = '';
    for (let yy = 196 - h + 10; yy < 186; yy += 14) for (let xx = x + 8; xx < x + w - 8; xx += 14) jendela += rect(xx, yy, 7, 7, '#eef5f7', 'opacity="0.8"');
    return rect(x, 196 - h, w, h, c) + jendela;
  }).join('');
  return `
    ${langit}
    ${rect(0, 0, 640, 214, 'url(#m04-langit)')}
    ${circle(492, 54, 22, '#fff4c9', 'opacity="0.9"')}
    ${path('M0 196 C70 170 150 176 230 188 C300 198 380 172 470 176 C540 180 600 186 640 180 L640 214 L0 214 Z', '#cfe3cf')}
    ${gedung}
    ${tree(560, 204, 0.7)}${tree(598, 208, 0.62)}${tree(250, 206, 0.6)}
    <!-- tanah proyek -->
    ${rect(0, 204, 640, 276, '#ead8b6')}
    ${rect(0, 204, 640, 8, '#dcc59c')}
    ${path('M0 250 C160 240 480 244 640 252 L640 262 C480 254 160 250 0 260 Z', '#e0caa2', 'opacity="0.7"')}
    <!-- pagar pengaman belakang (sedikit pucat: latar, bukan objek) -->
    <g opacity="0.82">${barikade(10, 214)}${barikade(96, 214)}${barikade(182, 214)}${barikade(470, 214)}${barikade(556, 214)}</g>
    <!-- jalan baru (aspal) di depan -->
    ${rect(0, 440, 640, 40, '#a3aba4')}
    ${rect(0, 436, 640, 6, '#c9c0ae')}
    ${line('M20 462 H80 M130 462 H190 M240 462 H300 M350 462 H410 M460 462 H520 M570 462 H630', '#f3ead2', 4, 'opacity="0.85"')}
    <!-- galian -->
    <!-- bibir tanah galian -->
    ${path('M24 372 C32 342 130 332 240 338 C274 342 286 366 282 390 C278 420 250 438 196 440 C130 444 56 440 34 424 C18 410 16 388 24 372 Z', P.tanah)}
    <!-- lubang: dasar gelap, dinding jauh lebih terang (terlihat dari depan) -->
    ${path('M42 370 C54 352 140 346 234 352 C256 356 266 372 264 390 C262 412 240 426 196 428 C136 432 72 428 52 418 C36 406 34 384 42 370 Z', '#5f4a33')}
    ${path('M42 370 C54 352 140 346 234 352 C256 356 266 372 264 390 C262 398 258 404 252 408 C226 396 150 392 58 402 C42 394 36 382 42 370 Z', '#8c6d4c')}
    ${line('M58 374 C110 364 190 364 244 372', P.tanahTua, 3, 'opacity="0.7"')}
    ${line('M50 390 C110 380 200 380 256 392', '#74583c', 2.5, 'opacity="0.7"')}
    ${line('M54 420 C92 434 160 434 224 428', '#ecd8b2', 4, 'opacity="0.9"')}
    <!-- gumpalan tanah jatuh dari ujung roda rantai -->
    ${circle(170, 402, 4.5, P.tanahTua)}${circle(162, 414, 3.4, P.tanahTua)}${circle(174, 418, 3, P.tanahTua)}
    <!-- kerucut & pita pengaman di depan galian -->
    ${line('M10 428 L96 434 L190 436 L404 428', P.kuning, 3, 'opacity="0.9"')}
    ${kerucut(96, 452, 0.9)}${kerucut(190, 454, 0.9)}${kerucut(404, 446, 0.9)}
    <!-- bekas roda di tanah -->
    ${line('M300 420 C360 416 420 410 470 404 M300 430 C360 426 420 420 470 414', P.tanahTua, 3, 'opacity="0.25"')}`;
}

// ------------------------------------------------------------------ objek pengecoh & NPC

/**
 * Awan 140 x 66: bentuk awan mengisi kotaknya (tanpa ruang kosong di atas),
 * supaya titik ketuk di pojok kanan atas menempel pada awan seperti objek lain.
 * Koordinat digambar langsung (tanpa scale) supaya garis tepi tetap 3 satuan.
 */
function awan(): string {
  return `
    ${path('M19.5 60 C3.6 60 1.3 39.6 17.2 35 C15 19.1 33.2 10 46.9 19.1 C53.7 3.1 81.1 0.8 90.2 16.8 C103.9 7.7 124.4 14.5 122.1 32.8 C140 35 140 60 122.1 60 Z', P.putih, INK)}
    ${path('M24 51 C49 55.6 101.6 55.6 119.8 51', 'none', `stroke="${P.langit}" stroke-width="5.5" stroke-linecap="round"`)}
    ${circle(51.4, 25.9, 6.8, P.putih)}${circle(44.6, 28.2, 3.4, P.langit, 'opacity="0.5"')}`;
}

function spanduk(): string {
  return `
    ${shadow(66, 94, 60, 5)}
    ${rrect(10, 10, 8, 84, 4, P.kayuTua, INK_TIPIS)}${rrect(114, 10, 8, 84, 4, P.kayuTua, INK_TIPIS)}
    ${path('M18 14 L114 14 L114 62 C90 58 42 58 18 62 Z', P.krem, INK)}
    ${rect(18, 14, 96, 12, P.biru)}
    ${line('M18 14 L114 14', P.tinta, 3)}
    ${text(66, 44, 'PROYEK', 15, P.tinta, 900)}
    ${text(66, 56, 'JALAN', 10, P.tintaLembut, 800)}
    ${circle(14, 10, 5, P.kuning, INK_TIPIS)}${circle(118, 10, 5, P.kuning, INK_TIPIS)}`;
}

function warung(): string {
  let atap = '';
  for (let i = 0; i < 6; i += 1) atap += path(`M${10 + i * 18} 22 L${28 + i * 18} 22 L${28 + i * 18} 38 C${22 + i * 18} 44 ${16 + i * 18} 44 ${10 + i * 18} 38 Z`, i % 2 ? P.krem : P.biru);
  return `
    ${shadow(60, 104, 56, 6)}
    ${rect(16, 38, 6, 60, P.kayuTua)}${rect(98, 38, 6, 60, P.kayuTua)}
    ${rrect(12, 64, 96, 36, 5, P.kayu, INK)}
    ${line('M12 76 H108', P.kayuTua, 3)}
    ${rrect(40, 72, 40, 16, 4, P.krem, INK_TIPIS)}
    ${text(60, 85, 'KOPI', 12, P.cokelat, 900)}
    ${rrect(20, 50, 16, 14, 3, P.putih, INK_TIPIS)}${path('M36 54 C42 54 42 62 36 62', 'none', `stroke="${P.tinta}" stroke-width="2"`)}
    ${rrect(84, 44, 18, 20, 4, P.besi, INK_TIPIS)}${line('M86 48 l-6 -4', P.besiTua, 3)}
    ${line('M24 46 q-3 -5 1 -9 M31 46 q-3 -5 1 -9', P.besiMuda, 2)}
    ${path('M4 22 L60 6 L116 22 Z', P.biru, INK)}
    ${atap}
    ${path('M10 22 L118 22', 'none', `stroke="${P.tinta}" stroke-width="3" stroke-linecap="round"`)}
    ${path('M10 22 L10 38 C16 44 22 44 28 38 L28 22 M46 22 L46 38 C52 44 58 44 64 38 L64 22 M82 22 L82 38 C88 44 94 44 100 38 L100 22', 'none', INK_TIPIS)}
    ${path('M8 22 L112 22 L112 38 C106 44 100 44 94 38', 'none', INK)}`;
}

function operator(): ArtRef {
  const o = personArt({ key: 'm04-operator', shirt: P.biru, pants: '#4b5563', helmet: true, vest: true, pose: 'bicara', mood: 'netral' });
  return { ...o, w: 68, h: 130 };
}

// ------------------------------------------------------------------ adegan

/** Geser label ke titik dunia (tx, ty) - engine menaruh label default di bawah gambar. */
export function labelKe(o: { x: number; y: number; art: ArtRef }, tx: number, ty: number): { labelDx: number; labelDy: number } {
  return { labelDx: Math.round(tx - o.x), labelDy: Math.round(ty - (o.y + o.art.h / 2 + 18)) };
}

export function sceneProyek(): SceneSpec {
  const bg = art('m04-latar', 640, 480, latar());

  const siku = dunia(SIKU[0], SIKU[1]);
  const badan = potong(
    'm04-excavator',
    // Sertakan sendi siku supaya pangkal lengan tidak terpotong di tepi atas gambar.
    [dunia(-214, -210), dunia(10, -210), dunia(-214, 0), dunia(10, 0), [siku[0] - 16, siku[1] - 16], [siku[0] + 90, 380], [PX - 210, PY + 16]],
    8,
    badanDunia(),
  );
  const rantai = potong('m04-rantai', kotakLokal(RANTAI.x, RANTAI.y, RANTAI.w, RANTAI.h), 6, miring(rodaRantaiLokal()));
  const plat = potong('m04-plat', kotakLokal(PLAT.cx - PLAT.w / 2 - 4, PLAT.cy - PLAT.h / 2 - 4, PLAT.w + 8, PLAT.h + 8), 6, miring(platLokal()));
  const boom = potong(
    'm04-boom',
    [dunia(ROOT[0] - 18, ROOT[1] + 12), dunia(ROOT[0] + 20, ROOT[1] + 12), dunia(SIKU[0] + 14, SIKU[1] - 20), dunia(SIKU[0] + 16, SIKU[1] + 16), dunia(SIKU[0] - 40, SIKU[1] - 20)],
    6,
    miring(boomLokal()),
  );

  return {
    missionId: 'm04-excavator',
    background: bg,
    props: [{ id: 'excavator', x: badan.x, y: badan.y, art: badan.art, depth: 10 }],
    hero: { x: 40, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 462, maxY: 478 },
    objects: [
      {
        id: 'awan', role: 'option', stepId: 'temuan', refId: 'awan', fx: 'note',
        x: 120, y: 74, art: art('m04-awan', 140, 66, awan()), label: 'Awan', depth: 20,
      },
      {
        id: 'operator', role: 'option', stepId: 'temuan', refId: 'operator', fx: 'talk',
        x: 74, y: 256, art: operator(), label: 'Operator', depth: 20,
      },
      {
        id: 'rantai', role: 'option', stepId: 'temuan', refId: 'posisi', fx: 'note',
        x: rantai.x, y: rantai.y, art: rantai.art, label: 'Posisi unit', depth: 20,
        labelDy: -8,
      },
      {
        // Plat kecil di atas roda rantai: kedalaman lebih tinggi supaya ketukannya menang.
        id: 'plat', role: 'option', stepId: 'temuan', refId: 'seri', fx: 'note',
        x: plat.x, y: plat.y, art: plat.art, label: 'Nomor seri', depth: 26,
        // Label di atas-kiri plat, tidak menutupi pipa knalpot / kabin.
        hit: { w: 88, h: 78 }, ...labelKe(plat, plat.x - 54, 264),
      },
      {
        id: 'boom', role: 'option', stepId: 'temuan', refId: 'rusak', fx: 'note',
        x: boom.x, y: boom.y, art: boom.art, label: 'Bagian rusak', depth: 22,
        // Label DI ATAS ujung boom (bukan di bawah: di sana ada kabin & roda rantai;
        // bukan di kanan: di sana label terbaca seperti judul spanduk).
        ...labelKe(boom, 360, 96),
      },
      {
        id: 'spanduk', role: 'option', stepId: 'temuan', refId: 'spanduk', fx: 'note',
        x: 556, y: 228, art: art('m04-spanduk', 132, 100, spanduk()), label: 'Spanduk', depth: 20,
      },
      {
        id: 'warung', role: 'option', stepId: 'temuan', refId: 'warung', fx: 'note',
        x: 552, y: 384, art: art('m04-warung', 120, 108, warung()), label: 'Warung kopi', depth: 20,
        labelDx: -10,
      },
    ],
  };
}
