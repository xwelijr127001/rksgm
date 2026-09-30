/**
 * Alat gambar lapisan ruang v3 (string SVG, satuan DUNIA 1600 x 900). Dipakai dinding/pintu/meja/kursi/prop/
 * luar/parkiran. Gaya (docs/cerita/ADEGAN-AUTO1.md bagian 7): garis tipis cokelat tua hangat, bayangan lembut 2 nada
 * + gradien, cahaya dari kiri atas. Semua id gradien diberi awalan per lokasi & lapisan (`rg-<lokasi>-<lapisan>-…`)
 * supaya beberapa lapisan/lokasi di halaman yang sama tidak bentrok.
 */
import type { LapisanSvg } from './tipe';

/** Garis hangat (kontrak bagian 7). */
export const GARIS = '#3a2620';

/**
 * GAYA GAMBAR: 'svg' (bawaan, lapisan SVG panggung/cadangan) atau 'piksel' (SUMBER lapisan piksel yang dirender
 * alat tools/piksel/bangun-ruang.mjs lalu dikuantisasi ke grid 4 satuan): tanpa tekstur garis tipis, bidang lebih
 * datar, garis penting ≥ 1 piksel seni. Hanya alat bangun yang memakai 'piksel' (lewat `denganGaya`).
 */
let gayaKini: 'svg' | 'piksel' = 'svg';
export const modePiksel = (): boolean => gayaKini === 'piksel';
export function denganGaya<T>(g: 'svg' | 'piksel', fn: () => T): T {
  const lama = gayaKini;
  gayaKini = g;
  try {
    return fn();
  } finally {
    gayaKini = lama;
  }
}

/** Angka ringkas (1 desimal) untuk atribut SVG. */
export const n = (v: number): string => (Math.round(v * 10) / 10).toString();

export type Tt = readonly [number, number];

export const titik = (ps: readonly Tt[]): string => ps.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');

/** Poligon terisi (opsional garis). */
export function poli(ps: readonly Tt[], isi: string, ekstra = ''): string {
  return `<polygon points="${titik(ps)}" fill="${isi}" ${ekstra}/>`;
}

export function kotak(x: number, y: number, w: number, h: number, isi: string, ekstra = ''): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${isi}" ${ekstra}/>`;
}

export function jalur(d: string, isi: string, ekstra = ''): string {
  return `<path d="${d}" fill="${isi}" ${ekstra}/>`;
}

/** Opasitas dari atribut ekstra (`opacity=".3"`), 1 bila tidak ada. */
const opasitasEkstra = (ekstra: string): number => {
  const m = /(?:^|\s)opacity="([\d.]+)"/.exec(ekstra);
  return m ? Number(m[1]) : 1;
};

/**
 * Garis (stroke) tanpa isi. Mode piksel: garis tekstur samar (opasitas < 0,3) dibuang (menjadi derau setelah
 * kuantisasi), garis lain minimal 4 satuan (1 piksel seni) supaya tidak hilang saat disampel.
 */
export function gores(d: string, warna: string, tebal: number, ekstra = ''): string {
  if (modePiksel()) {
    if (opasitasEkstra(ekstra) < 0.3) return '';
    tebal = Math.max(tebal, 4);
  }
  return `<path d="${d}" fill="none" stroke="${warna}" stroke-width="${n(tebal)}" stroke-linecap="round" stroke-linejoin="round" ${ekstra}/>`;
}

export function elips(cx: number, cy: number, rx: number, ry: number, isi: string, ekstra = ''): string {
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${isi}" ${ekstra}/>`;
}

/** Atribut garis tepi hangat. */
export const tepi = (tebal = 1.6, opasitas = 0.85): string =>
  modePiksel()
    ? `stroke="${GARIS}" stroke-width="4" stroke-opacity="${Math.min(1, opasitas + 0.1)}" stroke-linejoin="round" stroke-linecap="round"`
    : `stroke="${GARIS}" stroke-width="${n(tebal)}" stroke-opacity="${opasitas}" stroke-linejoin="round" stroke-linecap="round"`;

type Henti = readonly [number, string, number?];

const henti = (hs: readonly Henti[]): string =>
  hs.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

/** Gradien linear dalam satuan dunia. */
export function gradLinear(id: string, x1: number, y1: number, x2: number, y2: number, hs: readonly Henti[]): string {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${henti(hs)}</linearGradient>`;
}

/** Gradien radial (elips bila ry ≠ r) dalam satuan dunia. */
export function gradRadial(id: string, cx: number, cy: number, r: number, hs: readonly Henti[], ry?: number): string {
  const t = ry !== undefined && ry !== r ? ` gradientTransform="translate(${n(cx)} ${n(cy)}) scale(1 ${n(ry / r)}) translate(${n(-cx)} ${n(-cy)})"` : '';
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${t}>${henti(hs)}</radialGradient>`;
}

/** Cahaya lembut (elips radial memudar) — pengganti filter blur yang mahal di HP. */
export function cahaya(id: string, cx: number, cy: number, rx: number, ry: number, warna: string, kuat: number, ekstra = ''): string {
  return `<defs>${gradRadial(id, cx, cy, rx, [[0, warna, kuat], [0.55, warna, kuat * 0.42], [1, warna, 0]], ry)}</defs>${elips(cx, cy, rx, ry, `url(#${id})`, ekstra)}`;
}

/** Pembangkit acak berbenih (hasil gambar stabil antar-render & bisa di-cache/diuji). */
export function acak(benih: number): () => number {
  let s = benih >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Bungkus isi (digambar dalam koordinat dunia) menjadi lapisan dengan viewBox lokal `0 0 w h`. */
export function lapisan(isiDunia: string, x: number, y: number, w: number, h: number): LapisanSvg {
  const svg = x === 0 && y === 0 ? isiDunia : `<g transform="translate(${n(-x)} ${n(-y)})">${isiDunia}</g>`;
  return { svg, x, y, w, h };
}

/** Path poligon bersudut membulat (radius r per sudut, atau satu angka untuk semua). */
export function bulat(ps: readonly Tt[], r: number | readonly number[]): string {
  const m = ps.length;
  let d = '';
  for (let i = 0; i < m; i += 1) {
    const p = ps[i];
    const a = ps[(i - 1 + m) % m];
    const b = ps[(i + 1) % m];
    const ri = typeof r === 'number' ? r : r[i];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ka = Math.min(ri, la / 2) / (la || 1);
    const kb = Math.min(ri, lb / 2) / (lb || 1);
    const p1: Tt = [p[0] + (a[0] - p[0]) * ka, p[1] + (a[1] - p[1]) * ka];
    const p2: Tt = [p[0] + (b[0] - p[0]) * kb, p[1] + (b[1] - p[1]) * kb];
    d += `${i === 0 ? 'M' : 'L'}${n(p1[0])} ${n(p1[1])} Q${n(p[0])} ${n(p[1])} ${n(p2[0])} ${n(p2[1])} `;
  }
  return `${d}Z`;
}

/** Interpolasi linear titik. */
export const lerp = (a: Tt, b: Tt, t: number): Tt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/**
 * Ruas kurva HALUS melewati semua titik `ps`, TANPA perintah M awal (sambungkan ke jalur yang sudah berada di ps[0]).
 * Arah garis singgung ala Catmull-Rom, tetapi panjang titik kendali = 1/3 panjang ruasnya sendiri, jadi jarak sampel
 * yang tidak rata (busur rapat lalu sisi lurus panjang) tidak membuat kurva melenceng/berpilin. Untuk kontur benda
 * lengkung yang disampel (kursi) supaya tidak bersegi.
 */
export function halus(ps: readonly Tt[]): string {
  const arah = (i: number): Tt => {
    const a = ps[Math.max(0, i - 1)];
    const b = ps[Math.min(ps.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  let d = '';
  for (let i = 0; i + 1 < ps.length; i += 1) {
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const k = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3;
    const t1 = arah(i);
    const t2 = arah(i + 1);
    d += `C${n(p1[0] + t1[0] * k)} ${n(p1[1] + t1[1] * k)} ${n(p2[0] - t2[0] * k)} ${n(p2[1] - t2[1] * k)} ${n(p2[0])} ${n(p2[1])} `;
  }
  return d;
}

/**
 * Bungkus isi dengan clipPath persegi `k` (id `${id}-klip`, berawalan lokasi seperti id lain): isi yang meluber
 * (tanaman, pendar) tidak tampil di luar bukaan walau lapisan panggung ber-overflow visible.
 */
export function klipKotak(id: string, k: { x: number; y: number; w: number; h: number }, isi: string): string {
  return `<defs><clipPath id="${id}-klip"><rect x="${n(k.x)}" y="${n(k.y)}" width="${n(k.w)}" height="${n(k.h)}"/></clipPath></defs><g clip-path="url(#${id}-klip)">${isi}</g>`;
}

/**
 * Proyeksi benda kecil (kursi, telepon) di sekitar satu titik dunia: X kanan, Y atas, Z menjauh (cm).
 * `s` = skala kedalaman benda; bidang datar tampak dari sedikit atas (pemendekan `datar`), menjauh menggeser sedikit
 * ke titik hilang (kiri bila benda di kanan tengah).
 */
export function proyektor(ox: number, oy: number, s: number, opsi: { datar?: number; geserZ?: number } = {}) {
  const K = 5.8 * s;
  const datar = opsi.datar ?? 0.24;
  const geserZ = opsi.geserZ ?? -0.1;
  return (X: number, Y: number, Z: number): Tt => [ox + K * (X + Z * geserZ), oy - K * Y - K * datar * Z];
}
