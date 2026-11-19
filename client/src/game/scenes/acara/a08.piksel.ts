/**
 * T-061c: seni PIKSEL misi acara 08 "Lini Masa Excavator" (gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia).
 * Excavator EX-2085 digambar di KANVAS DUNIA (160 x 120 sel) dengan geometri m04 yang sama (titik pusat PX/PY, miring -9 derajat
 * lewat dunia()), satu kanvas per lapis: badan (rumah mesin, kabin, lengan, bucket), roda rantai, boom penyok, kaca pecah, ruang
 * mesin terbuka, tapak aus, selang bocor. a08.ts memotong tiap lapis di kotak yang sama dengan potong() lama, jadi posisi bagian,
 * stiker, dan label tidak berubah. Netral: kelima bagian sama-sama memperlihatkan kondisinya, tanpa tanda/warna penilaian.
 * Murni (tanpa DOM / Phaser).
 */
import { Piksel, type Warna } from '../../art/piksel';
import { ROOT, SIKU, dunia } from '../m04-proyek';
import { KAYU, TINTA, poligon, teksBesar } from './piksel-umum';

const KUNING = '#f6c445';
const KUNING_TUA = '#d9a22a';
const KUNING_MUDA = '#fbe08f';
const BESI = '#9aa3a8';
const BESI_TUA = '#5f666d';
const BESI_MUDA = '#c5ccd0';
const RANTAI_C = '#2f3a34';
const KACA = '#bfe0ea';
const OLI = '#4a3524';

type T = readonly [number, number];
/** Titik lokal excavator -> sel tata letak dunia. */
const L = (lx: number, ly: number): T => { const [x, y] = dunia(lx, ly); return [x / 4, y / 4]; };
const W = (x: number, y: number): T => [x / 4, y / 4];
const kanvas = (): Piksel => new Piksel(160, 120, null, 2);

/** Kotak lokal miring (x, y, w, h) bertepi tinta 1 sel halus (tepi = 2 satuan lokal di luar). */
function kotakMiring(p: Piksel, x: number, y: number, w: number, h: number, c: Warna, tepi: Warna = TINTA): void {
  if (tepi) poligon(p, [L(x - 2, y - 2), L(x + w + 2, y - 2), L(x + w + 2, y + h + 2), L(x - 2, y + h + 2)], tepi);
  poligon(p, [L(x, y), L(x + w, y), L(x + w, y + h), L(x, y + h)], c);
}
const garisL = (p: Piksel, a: T, b: T, c: string, tebal = 1) => p.garis(a[0], a[1], b[0], b[1], c, tebal);
const bulatL = (p: Piksel, lx: number, ly: number, r: number, c: string) => { const [x, y] = L(lx, ly); p.bulat(x, y, r / 4, c); };

/** Lengan & bucket (dunia) dari sendi siku, sama dengan badanDunia() m04. */
function lenganDunia() {
  const [ex, ey] = dunia(SIKU[0], SIKU[1]);
  const bx = ex + 38, by = 338;
  const dx = bx - ex, dy = by - ey, n = Math.hypot(dx, dy);
  const px = (-dy / n) * 11, py = (dx / n) * 11;
  return { ex, ey, bx, by, px, py };
}

// ------------------------------------------------------------------ lapis

export function badanA08(): Piksel {
  const p = kanvas();
  const { ex, ey, bx, by, px, py } = lenganDunia();
  // lengan
  poligon(p, [W(ex + px * 1.25, ey + py * 1.25), W(ex - px * 1.25, ey - py * 1.25), W(bx - px, by - py), W(bx + px, by + py)], TINTA);
  poligon(p, [W(ex + px, ey + py), W(ex - px, ey - py), W(bx - px * 0.8, by - py * 0.8), W(bx + px * 0.8, by + py * 0.8)], KUNING);
  p.garis((ex + px * 1.6 + 4) / 4, (ey + py * 1.6 + 18) / 4, (bx + px * 1.4) / 4, (by - 60) / 4, TINTA, 3);
  p.garis((ex + px * 1.6 + 4) / 4, (ey + py * 1.6 + 18) / 4, (bx + px * 1.4) / 4, (by - 60) / 4, BESI_MUDA, 1);
  p.bulat(ex / 4, ey / 4, 3.2, TINTA).bulat(ex / 4, ey / 4, 2.7, KUNING).bulat(ex / 4, ey / 4, 1.2, BESI_TUA);
  // bucket di tanah
  poligon(p, [W(bx - 32, by - 8), W(bx - 10, by - 36), W(bx + 32, by - 16), W(bx + 36, by + 24), W(bx - 14, by + 28), W(bx - 30, by + 12)], TINTA);
  poligon(p, [W(bx - 29, by - 6), W(bx - 10, by - 33), W(bx + 29, by - 14), W(bx + 33, by + 21), W(bx - 13, by + 25), W(bx - 27, by + 10)], BESI);
  for (const d of [-12, 4, 20]) p.rect((bx + d) / 4, (by + 25) / 4, 1, 1.5, TINTA);
  p.bulat(bx / 4, (by - 6) / 4, 1.5, BESI_TUA);
  // rumah mesin, pemberat, kabin (lokal miring)
  kotakMiring(p, -150, -66, 110, 18, BESI_TUA, null);
  kotakMiring(p, -212, -120, 52, 58, KUNING_TUA);
  kotakMiring(p, -196, -126, 180, 66, KUNING);
  kotakMiring(p, -190, -78, 168, 12, KUNING_TUA, null);
  poligon(p, [L(-194, -124), L(-18, -124), L(-18, -120), L(-194, -120)], KUNING_MUDA);
  garisL(p, L(-189, -112), L(-189, -90), KUNING_TUA, 1); garisL(p, L(-182, -112), L(-182, -90), KUNING_TUA, 1);
  kotakMiring(p, -120, -146, 9, 22, BESI_TUA);
  kotakMiring(p, -92, -202, 70, 82, '#eef3f6');
  kotakMiring(p, -84, -194, 52, 44, KACA, BESI_TUA);
  poligon(p, [L(-80, -190), L(-68, -190), L(-78, -166), L(-80, -166)], '#ffffff');
  garisL(p, L(-84, -140), L(-34, -140), BESI, 1);
  kotakMiring(p, -98, -208, 82, 11, KUNING_TUA);
  kotakMiring(p, -36, -120, 28, 34, KUNING_TUA);
  // tulisan unit
  const [tx, ty] = L(-176, -106);
  teksBesar(p, tx, ty, 'EX-2085', '#7a5a10');
  return p;
}

export function rantaiA08(): Piksel {
  const p = kanvas();
  kotakMiring(p, -194, -50, 194, 50, RANTAI_C);
  for (let x = -172; x <= -22; x += 15) { garisL(p, L(x, -49), L(x, -40), BESI_TUA, 2); garisL(p, L(x, -10), L(x, -1), BESI_TUA, 2); }
  kotakMiring(p, -176, -37, 158, 24, BESI_TUA, null);
  for (const [x, r] of [[-169, 15], [-25, 15]] as const) { bulatL(p, x, -25, r + 1.5, TINTA); bulatL(p, x, -25, r, BESI); bulatL(p, x, -25, r * 0.38, BESI_TUA); }
  for (const x of [-136, -108, -80, -52]) { bulatL(p, x, -25, 9, TINTA); bulatL(p, x, -25, 7.5, BESI_MUDA); }
  return p;
}

export function boomA08(): Piksel {
  const p = kanvas();
  const [ex, ey] = SIKU, [rx, ry] = ROOT;
  // silinder hidrolik
  garisL(p, L(rx + 16, ry - 4), L(rx + 36, ry - 64), TINTA, 4); garisL(p, L(rx + 16, ry - 4), L(rx + 36, ry - 64), BESI, 2);
  garisL(p, L(rx + 34, ry - 58), L(rx + 46, ry - 92), TINTA, 3); garisL(p, L(rx + 34, ry - 58), L(rx + 46, ry - 92), BESI_MUDA, 1);
  // badan boom (lengkung dibulatkan jadi poligon)
  const luar: T[] = [L(rx - 18, ry + 6), L(rx + 10, ry - 102), L(rx + 30, ry - 128), L(ex - 36, ey - 12), L(ex - 14, ey - 18), L(ex + 14, ey - 5), L(ex + 8, ey + 16), L(ex - 22, ey + 22), L(rx + 44, ry - 82), L(rx + 18, ry + 8)];
  const dalam: T[] = [L(rx - 15, ry + 4), L(rx + 12, ry - 100), L(rx + 31, ry - 125), L(ex - 35, ey - 9), L(ex - 14, ey - 15), L(ex + 11, ey - 4), L(ex + 6, ey + 13), L(ex - 21, ey + 19), L(rx + 41, ry - 83), L(rx + 15, ry + 5)];
  poligon(p, luar, TINTA);
  poligon(p, dalam, KUNING);
  garisL(p, L(rx - 4, ry - 22), L(rx + 18, ry - 102), KUNING_MUDA, 1);
  // PENYOK di tengah boom: cekungan gelap + sorot + gores
  const [dx, dy] = L(rx + 30, ry - 116);
  p.bulat(dx, dy, 2.6, KUNING_TUA).bulat(dx - 0.5, dy - 0.25, 1.6, '#b7861c');
  p.garis(dx - 2, dy + 2.25, dx + 2, dy + 1.5, KUNING_MUDA, 1);
  p.garis(dx - 1.5, dy - 3, dx + 1, dy - 1, TINTA, 1).garis(dx + 1, dy - 1, dx + 0.25, dy + 0.75, TINTA, 1);
  // pin pangkal & siku
  for (const [x, y, r] of [[rx, ry, 8], [ex, ey, 9]] as const) { bulatL(p, x, y, r + 1.5, TINTA); bulatL(p, x, y, r, BESI_TUA); bulatL(p, x, y, r * 0.38, BESI_MUDA); }
  return p;
}

export function kacaA08(): Piksel {
  const p = kanvas();
  kotakMiring(p, -84, -194, 52, 44, KACA, BESI_TUA);
  poligon(p, [L(-80, -190), L(-68, -190), L(-78, -166), L(-80, -166)], '#ffffff');
  // lubang pecahan + retakan menjalar
  poligon(p, [L(-52, -183), L(-44, -187), L(-38, -178), L(-42, -169), L(-51, -171), L(-56, -177)], '#5d7482');
  for (const [a, b] of [[[-52, -183], [-62, -193]], [[-44, -187], [-41, -194]], [[-38, -178], [-32, -176]], [[-42, -169], [-36, -152]], [[-51, -171], [-58, -152]], [[-56, -177], [-72, -174]], [[-72, -174], [-84, -180]], [[-66, -188], [-60, -166]]] as const) garisL(p, L(a[0], a[1]), L(b[0], b[1]), TINTA, 1);
  garisL(p, L(-62, -191), L(-53, -182), '#ffffff', 1);
  return p;
}

export function mesinA08(): Piksel {
  const p = kanvas();
  // pintu samping terangkat
  garisL(p, L(-130, -90), L(-124, -138), BESI_MUDA, 1);
  poligon(p, [L(-182, -118), L(-122, -118), L(-118, -152), L(-174, -158)], TINTA);
  poligon(p, [L(-180, -120), L(-124, -120), L(-120, -150), L(-172, -156)], KUNING);
  poligon(p, [L(-174, -125), L(-129, -125), L(-126, -146), L(-168, -151)], '#e0b23a');
  // ruang mesin: blok mesin, puli, sabuk
  kotakMiring(p, -178, -118, 52, 38, '#2c3833');
  kotakMiring(p, -173, -112, 24, 27, BESI, BESI_TUA);
  for (const x of [-167, -161, -155]) garisL(p, L(x, -108), L(x, -89), BESI_TUA, 1);
  bulatL(p, -138, -96, 10, TINTA); bulatL(p, -138, -96, 8.5, BESI_MUDA); bulatL(p, -138, -96, 3, BESI_TUA);
  garisL(p, L(-149, -104), L(-140, -110), BESI_TUA, 1); garisL(p, L(-140, -110), L(-130, -103), BESI_TUA, 1);
  return p;
}

export function tapakA08(): Piksel {
  const p = kanvas();
  // tapak menipis & mengilap di separuh DEPAN roda rantai (hanya tanda aus)
  for (let x = -106; x <= -31; x += 15) { kotakMiring(p, x - 5, -48.5, 10, 5, BESI_MUDA, null); kotakMiring(p, x - 5, -6.5, 10, 5, BESI_MUDA, null); }
  garisL(p, L(-25, -45), L(-10, -40), BESI_MUDA, 1); garisL(p, L(-10, -40), L(-5, -25), BESI_MUDA, 1);
  garisL(p, L(-5, -25), L(-10, -10), BESI_MUDA, 1); garisL(p, L(-10, -10), L(-25, -5), BESI_MUDA, 1);
  return p;
}

/** Titik-titik kurva Bezier kubik (dunia). */
function bezier(a: T, b: T, c: T, d: T, n = 12): T[] {
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]] as T; });
}

export function selangA08(): Piksel {
  const p = kanvas();
  // genangan oli kecil
  for (let i = -4; i < 4; i += 0.5) { const t = Math.sqrt(1 - (i / 4) ** 2); p.rect(118.75 + i, 94.25 - t * 0.75, 0.5, t * 1.5 + 0.5, OLI); }
  const alur = [...bezier([435, 258], [455, 262], [473, 284], [465, 306], 8), ...bezier([465, 306], [461, 318], [454, 322], [450, 329], 4)];
  for (let i = 0; i + 1 < alur.length; i++) p.garis(alur[i]![0] / 4, alur[i]![1] / 4, alur[i + 1]![0] / 4, alur[i + 1]![1] / 4, TINTA, 4);
  for (let i = 0; i + 1 < alur.length; i++) p.garis(alur[i]![0] / 4, alur[i]![1] / 4, alur[i + 1]![0] / 4, alur[i + 1]![1] / 4, '#4a5750', 2);
  // bagian bawah selang basah oli + kilap
  p.garis(117, 72.5, 116, 77.5, OLI, 2).garis(111, 66, 115.5, 70, BESI_MUDA, 1);
  // sambungan
  p.kartu(107.25, 63, 3.25, 2.75, BESI_MUDA, TINTA).kartu(110.75, 81, 3.25, 2.75, BESI_MUDA, TINTA);
  // tiga tetes jatuh
  for (const [x, y, s] of [[117, 81.25, 1], [117.75, 86.5, 0.85], [118.25, 90.75, 0.7]] as const) {
    p.rect(x, y - 1.5 * s, 0.5, 0.5, OLI).rect(x - 0.5, y - s, 1.5, s * 1.5, OLI).rect(x - 0.25, y - 0.5 * s, 0.5, 0.5, '#9a8572');
  }
  return p;
}

// ------------------------------------------------------------------ latar proyek jalan (geometri m04)

export function latarA08(): Piksel {
  const p = kanvas();
  // langit bertingkat + matahari
  p.rect(0, 0, 160, 54, '#e4f2f8').rect(0, 0, 160, 14, '#c6e2f1').rect(0, 14, 160, 12, '#d4eaf4');
  p.bulat(123, 13.5, 5.5, '#fff4c9');
  // bukit & kota jauh
  for (let x = 0; x < 160; x += 0.5) { const y = 46 + Math.sin(x * 0.06) * 2.5 + Math.sin(x * 0.17) * 1; p.rect(x, y, 0.5, 54 - y, '#cfe3cf'); }
  for (const [x, w, h, c] of [[20, 58, 44, '#d9cdb7'], [66, 40, 60, '#cddbd0'], [112, 52, 38, '#e1d3bb'], [300, 46, 52, '#d6cfc0'], [352, 36, 34, '#cfdcd2'], [470, 44, 48, '#dccfb8'], [520, 60, 30, '#cfd9d2']] as const) {
    p.rect(x / 4, (196 - h) / 4, w / 4, h / 4, c);
    for (let yy = 196 - h + 10; yy < 186; yy += 14) for (let xx = x + 8; xx < x + w - 8; xx += 14) p.rect(xx / 4, yy / 4, 1.5, 1.5, '#eef5f7');
  }
  const pohon = (x: number, y: number, s: number) => { p.rect(x - 0.5, y - 5 * s, 1, 5 * s, '#8a6a4f'); p.bulat(x, y - 7 * s, 3.2 * s, '#7fae7d').bulat(x - 1.5 * s, y - 8.5 * s, 2 * s, '#9cc69a'); };
  pohon(140, 51, 1); pohon(149.5, 52, 0.9); pohon(62.5, 51.5, 0.85);
  // tanah proyek
  p.rect(0, 51, 109, 69, '#ead8b6').rect(0, 51, 160, 69, '#ead8b6').rect(0, 51, 160, 2, '#dcc59c');
  for (let x = 0; x < 160; x += 0.5) { const y = 62.5 + Math.sin(x * 0.05) * 0.75; p.rect(x, y, 0.5, 2, '#e0caa2'); }
  p.dither(0, 53, 160, 67, '#e2cda8', 0.08);
  // barikade pucat di belakang
  const barikade = (x: number) => {
    p.rect(x / 4 + 1.5, 56, 1.25, 6.5, '#c7bcae').rect(x / 4 + 15, 56, 1.25, 6.5, '#c7bcae');
    p.kartu(x / 4, 53.5, 17.5, 3.5, '#f3a24a', '#d98a33');
    for (let i = 0; i < 17; i += 5) p.garis(x / 4 + i + 2, 53.75, x / 4 + i + 0.5, 56.75, '#fbefe2', 2);
  };
  for (const x of [10, 96, 182, 470, 556]) barikade(x);
  // jalan baru (aspal) di depan + marka putus-putus
  p.rect(0, 109, 160, 1.5, '#c9c0ae').rect(0, 110, 160, 10, '#a3aba4');
  for (let x = 5; x < 160; x += 27.5) p.rect(x, 115.25, 15, 1, '#f3ead2');
  // galian: bibir tanah, dinding terang, dasar gelap (lonjong dari poligon)
  const lonjong = (cx: number, cy: number, rx: number, ry: number, c: string, n = 28) => poligon(p, Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry] as T), c);
  lonjong(38.5, 97, 33.5, 13.5, '#c9a679');
  lonjong(38, 97.5, 28.5, 10.5, '#8c6d4c');
  lonjong(38, 100, 27, 7.5, '#5f4a33');
  p.garis(14.5, 93.5, 61, 93, '#a0805c', 1).garis(14, 106, 56, 107, '#ecd8b2', 2);
  for (const [x, y, r] of [[42.5, 100.5, 1.1], [40.5, 103.5, 0.9], [43.5, 104.5, 0.8]] as const) p.bulat(x, y, r, '#a0805c');
  // pita pengaman & kerucut
  p.garis(2.5, 107, 24, 108.5, '#f6c445', 1).garis(24, 108.5, 47.5, 109, '#f6c445', 1).garis(47.5, 109, 101, 107, '#f6c445', 1);
  const kerucut = (x: number, y: number) => {
    poligon(p, [[x - 1.25, y - 9.5], [x + 1.25, y - 9.5], [x + 3.25, y - 0.5], [x - 3.25, y - 0.5]], '#ff9000');
    p.rect(x - 2, y - 6.5, 4, 1.5, '#ffffff').kartu(x - 4, y - 1, 8, 1.5, '#d4732f', '#b55e22');
  };
  kerucut(24, 113); kerucut(47.5, 113.5); kerucut(101, 111.5);
  // bekas roda
  p.garis(75, 105, 117.5, 101, '#d5bf98', 1).garis(75, 107.5, 117.5, 103.5, '#d5bf98', 1);
  return p;
}

/** Papan klip laporan kejadian digantung tali di rel barikade, 16 x 25 sel (64 x 100). */
export function laporanA08(): Piksel {
  const p = new Piksel(16, 25, null, 2);
  p.garis(4.5, 0.75, 8, 4.5, '#6f787d', 1).garis(8, 4.5, 11.5, 0.75, '#6f787d', 1);
  p.kotakTangga(1.5, 5, 14, 19.5, '#00000020', 1);
  p.kartu(1, 4.5, 14, 19.5, KAYU, TINTA);
  p.rect(2.25, 6.5, 11.5, 16, '#ffffff');
  p.kartu(5, 3.5, 6, 3, '#9aa3a8', TINTA);
  p.rect(3.5, 8, 7.5, 2, '#ff9000');
  for (const [y, w] of [[12, 9], [14.5, 7.5], [17, 9], [19.5, 5.5]] as const) p.rect(3.5, y, w, 0.75, '#8c8c8c');
  return p;
}
