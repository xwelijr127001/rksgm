/**
 * T-061b: latar PIKSEL gudang untuk misi acara 06 (gudang alat berat, geometri latar m08) dan 07 (Gudang Sentra Niaga pasca
 * banjir, geometri latar m07). Gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia; dunia 640 x 480 = 160 x 120 sel.
 * Semua koordinat di komentar = dunia; di kode = sel (dunia / 4). Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { AIR, KAYU, KAYU_GELAP, KAYU_TUA, TINTA, teksBesar } from './piksel-umum';

const DINDING = '#f1e8d4';
const PANEL = '#e5d9bf';
const BETON = '#cfc8ba';
const BETON_TUA = '#b5ad9d';
const BESI = '#9aa3a8';
const BESI_TUA = '#6f787d';
const HIJAU = '#3f8f5a';

/** Dinding gelombang + plafon + lantai beton (y 300). */
function dasar(p: Piksel): void {
  p.rect(0, 0, 160, 75, DINDING);
  for (let x = 3; x < 160; x += 7) p.rect(x, 4, 0.5, 71, PANEL).rect(x + 0.5, 4, 0.5, 71, '#f7f0e2');
  p.rect(0, 0, 160, 4, '#e2d4b4').rect(0, 4, 160, 0.5, '#cdbd98');
  p.rect(0, 75, 160, 45, BETON).rect(0, 75, 160, 2, BETON_TUA);
  for (let y = 84; y < 120; y += 9) p.rect(0, y, 160, 0.5, BETON_TUA);
  for (let x = 10; x < 160; x += 20) p.garis(x, 77, x + (x - 80) * 0.12, 120, BETON_TUA, 1);
  p.dither(0, 77, 160, 43, '#c4bcad', 0.06);
}

/** Papan nama hijau bertulisan krem, kotak dunia (x, y, w, h). */
function papanNama(p: Piksel, x: number, y: number, w: number, h: number, teks: string): void {
  p.kartu(x / 4, y / 4, w / 4, h / 4, HIJAU, '#245c39');
  const lebar = teks.length * 6 - 1; // sel halus
  teksBesar(p, x / 4 + (w / 4 - lebar / 2) / 2, y / 4 + (h / 4 - 3.5) / 2, teks, '#fff1e2');
}

/** Pintu gulung terbuka (rangka besi) dengan isi luar `luar` digambar di dalam bukaan. */
function pintuGulung(p: Piksel, x0: number, y0: number, x1: number, y1: number, luar: () => void): void {
  luar();
  p.rect(x0 / 4 - 2, y0 / 4 - 4, (x1 - x0) / 4 + 4, 4, BESI).rect(x0 / 4 - 2, y0 / 4 - 4, (x1 - x0) / 4 + 4, 0.5, '#c5ccd0');
  for (let y = y0 / 4 - 3; y < y0 / 4; y += 1) p.rect(x0 / 4 - 1.5, y, (x1 - x0) / 4 + 3, 0.5, BESI_TUA);
  p.rect(x0 / 4 - 2, y0 / 4, 2, (y1 - y0) / 4, BESI).rect(x1 / 4, y0 / 4, 2, (y1 - y0) / 4, BESI);
  p.rect(x0 / 4 - 0.5, y0 / 4, 0.5, (y1 - y0) / 4, BESI_TUA).rect(x1 / 4, y0 / 4, 0.5, (y1 - y0) / 4, BESI_TUA);
}

function langit(p: Piksel, x0: number, y0: number, x1: number, y1: number): void {
  p.rect(x0 / 4, y0 / 4, (x1 - x0) / 4, (y1 - y0) / 4, '#cfe8f5');
  p.rect(x0 / 4, y0 / 4, (x1 - x0) / 4, (y1 - y0) / 12, '#b7dcef');
  const awan = (cx: number, cy: number, r: number) => p.bulat(cx, cy, r, '#ffffff').bulat(cx + r, cy + 0.5, r * 0.8, '#ffffff').bulat(cx - r, cy + 0.5, r * 0.7, '#ffffff').rect(cx - r * 1.6, cy + 0.5, r * 3.4, r * 0.8, '#ffffff');
  awan(x0 / 4 + 10, y0 / 4 + 7, 2.2);
  awan(x0 / 4 + 30, y0 / 4 + 5, 1.6);
}

// ================================================================== misi 06: gudang alat berat (m08)

export function latarA06(): Piksel {
  const p = new Piksel(160, 120, null, 2);
  dasar(p);
  // papan gabus kiri atas (dunia 50..186, 2..100)
  p.kartu(12.5, 0.5, 34, 24.5, '#e3cda4', KAYU_GELAP).rect(14, 2, 31, 21.5, '#d8b98a');
  for (let i = 0; i < 40; i++) p.rect(14.5 + ((i * 7) % 30), 2.5 + ((i * 5) % 20), 0.5, 0.5, '#c4a26f');
  for (const [x, y, c] of [[16, 4, '#fff1e2'], [26, 6, '#cfe8f5'], [35, 3.5, '#fff1c2']] as const) p.kartu(x, y, 8, 9, c, TINTA).rect(x + 3.5, y - 0.5, 1, 1, '#d32f2f');
  papanNama(p, 224, 20, 216, 34, 'GUDANG ALAT BERAT'); // dilebarkan dari 196: 17 huruf 5 x 7 = 101 sel halus
  // pintu gulung terbuka ke halaman (dunia 10..180, 120..300) + ekskavator jauh
  pintuGulung(p, 10, 120, 180, 300, () => {
    langit(p, 10, 120, 180, 300);
    p.rect(2.5, 62.5, 42.5, 12.5, '#dcc79f').rect(2.5, 62.5, 42.5, 1.5, '#cbb489');
    p.kotakTangga(5, 59.5, 14, 3.5, '#b9ab8e', 1).kartu(7, 53.5, 7.5, 6.5, '#e2c77e', '#b9a35e').rect(8.5, 55, 3.5, 2.5, '#eef3f6');
    p.garis(14.5, 55, 22, 49, '#e2c77e', 2).garis(22, 49, 27, 56, '#e2c77e', 2).rect(26, 56, 3, 2.5, '#b9a35e');
  });
  // papan perkakas kanan (dunia 474..628, 122..294)
  p.kartu(118.5, 30.5, 38.5, 43, '#e6d3ae', KAYU_GELAP);
  for (let x = 120.5; x < 156; x += 2.5) for (let y = 32.5; y < 72; y += 2.5) p.rect(x, y, 0.5, 0.5, '#cbb48c');
  p.rect(121.5, 36, 1.5, 10, BESI).kotakTangga(120, 34, 3.5, 3, BESI_TUA, 0.5); // kunci pas
  p.rect(126, 34, 6, 1.5, KAYU_TUA).rect(128.5, 35, 1, 10, KAYU_TUA); // palu
  p.rect(121.5, 55.5, 1.5, 11, KAYU_TUA).kotakTangga(120, 53.5, 4, 3, BESI, 0.5); // obeng besar
  p.rect(153.5, 56.5, 1.25, 10, BESI).kartu(152.25, 65.5, 3.5, 2.5, '#2f6fb0', TINTA);
  p.kartu(135, 40, 12, 9, '#ffffff', TINTA).rect(136, 41, 10, 2, '#ff9000').rect(136.5, 45, 7, 0.5, '#a4a4a4'); // catatan servis
  // meja sortir (dunia 20..580, permukaan y 412) + kaki + lajur jalan kaki (y 460)
  p.rect(5, 103, 140, 3.5, KAYU).rect(5, 103, 140, 0.5, '#e0bb88').rect(6, 106, 138, 2.5, KAYU_TUA);
  for (const x of [9, 75.25, 138]) p.rect(x, 108, 3, 10.5, KAYU_TUA).rect(x, 108, 0.5, 10.5, KAYU_GELAP);
  p.rect(0, 115, 160, 5, '#d4cbb9').rect(0, 115, 160, 0.75, BETON_TUA);
  return p;
}

// ================================================================== misi 07: Gudang Sentra Niaga pasca banjir (m07)

export interface OpsiA07 { meja: { x0: number; x1: number }; palangY: number; pel: { dx: number; dy: number }; ember: { dx: number; dy: number } }

export function latarA07(o: OpsiA07): Piksel {
  const p = new Piksel(160, 120, null, 2);
  dasar(p);
  // bekas air di dinding (garis air bergelombang y ~262, di kanan pintu)
  for (let x = 44; x < 160; x += 0.5) {
    const y = 65.5 + Math.round(Math.sin(x * 0.4) * 1.5) * 0.5;
    p.rect(x, y, 0.5, 75 - y, '#e4d3ae').rect(x, y, 0.5, 0.75, '#bba378');
    if (Math.sin(x * 0.4 + 1) > 0.3) p.rect(x, y + 2, 0.5, 0.5, '#d6c39c');
  }
  papanNama(p, 196, 24, 248, 38, 'GUDANG SENTRA NIAGA');
  // pintu gulung terbuka: jalan di luar masih tergenang + karung pasir (dunia 18..174, 78..300)
  pintuGulung(p, 18, 78, 174, 300, () => {
    langit(p, 18, 78, 174, 300);
    p.kartu(6, 38, 15.5, 26, '#d9c6a3', '#b9a582');
    p.kartu(23.5, 45.5, 18.5, 18.5, '#c8d8c9', '#9fb5a1');
    for (let y = 41; y < 62; y += 4) for (const x of [8, 12.5, 17]) p.rect(x, y, 2.5, 2, '#cfe6ee');
    for (let y = 48.5; y < 62; y += 4) for (const x of [26, 31, 36]) p.rect(x, y, 3, 2, '#cfe6ee');
    p.rect(4.5, 62.5, 39, 12.5, '#6f7377');
    for (let x = 4.5; x < 43.5; x += 0.5) { const y = 64.5 + Math.round(Math.sin(x * 0.8) * 1) * 0.5; p.rect(x, y, 0.5, 75 - y, '#8fc3e0'); p.rect(x, y, 0.5, 0.5, '#e9f5f9'); }
    for (let i = 0; i < 5; i++) p.kotakTangga(5 + i * 7.75, 70.5, 8, 4.5, '#cdb88e', 1);
    for (let i = 0; i < 4; i++) p.kotakTangga(9 + i * 7.75, 67, 8, 4, '#d9c7a0', 1);
  });
  // rak barang kanan (dunia 520..632, 112..300) + kardus (dua terbawah basah)
  p.rect(130, 28, 1.5, 47, BESI_TUA).rect(156.5, 28, 1.5, 47, BESI_TUA);
  for (const y of [42, 57, 71]) p.rect(130, y, 28, 1.5, BESI).rect(130, y, 28, 0.5, '#c5ccd0');
  const kardus = (x: number, y: number, w: number, h: number, basah = false) => {
    p.kartu(x, y, w, h, '#c99a62', '#8a6236').rect(x + 0.5, y + 1.5, w - 1, 0.5, '#e0bb88').rect(x + w / 2 - 0.5, y, 1, 2, '#e8d2a9');
    if (basah) p.dither(x + 0.5, y + h * 0.45, w - 1, h * 0.55 - 0.5, '#8a6a4a', 0.55);
  };
  kardus(133.5, 23.5, 10, 9.5); kardus(145, 25, 9, 8);
  kardus(133, 38.5, 11.5, 8.5); kardus(145.5, 40, 9, 7);
  kardus(133.5, 52.5, 9.5, 8.5); kardus(144, 54, 10.5, 7);
  kardus(133, 66.5, 11, 8.5, true); kardus(145, 67.5, 10, 7.5, true);
  // genangan air dangkal di lantai (y ~337..480): biru tembus pandang (dither), garis kilap
  for (let x = 0; x < 160; x += 0.5) {
    const y = 84 + Math.round(Math.sin(x * 0.09) * 2 + Math.sin(x * 0.23) * 1) * 0.5;
    p.dither(x, y, 0.5, 120 - y, AIR, 0.28);
    p.rect(x, y, 0.5, 0.5, '#ffffff');
  }
  for (const [x, y, w] of [[6, 94.5, 9], [64.5, 103, 12], [75, 116, 10], [112, 112, 11], [153, 105, 4.5]] as const) p.rect(x, y, w, 0.75, '#ffffffb0');
  // pel bersandar & ember (posisi sama dengan m07 + geser opsi)
  const pdx = o.pel.dx / 4, pdy = o.pel.dy / 4, edx = o.ember.dx / 4, edy = o.ember.dy / 4;
  p.garis(132 + pdx, 79.5 + pdy, 128.5 + pdx, 99.5 + pdy, KAYU_TUA, 2);
  p.kotakTangga(126 + pdx, 99 + pdy, 5.5, 2.5, '#c5ccd0', 0.5);
  p.kotakTangga(115 + edx, 94 + edy, 8.5, 8, '#8fc3e0', 1).rect(115.5 + edx, 94 + edy, 8, 0.5, '#5f8db0');
  p.garis(115.5 + edx, 94 + edy, 119.5 + edx, 90.5 + edy, BESI_TUA, 1).garis(119.5 + edx, 90.5 + edy, 123 + edx, 94 + edy, BESI_TUA, 1);
  // meja tinggi kering (dunia x0..x1, daun 304..328, kaki ke 432, palang = rak kartu)
  const X0 = o.meja.x0 / 4, X1 = o.meja.x1 / 4;
  p.rect(X0 + 3, 81.5, 3, 26.5, BESI).rect(X1 - 6, 81.5, 3, 26.5, BESI).rect(X0 + 3, 81.5, 0.5, 26.5, BESI_TUA).rect(X1 - 3.5, 81.5, 0.5, 26.5, BESI_TUA);
  p.rect(X0 + 3, o.palangY / 4, X1 - X0 - 6, 2.25, '#b9c1c5').rect(X0 + 3, o.palangY / 4 + 2, X1 - X0 - 6, 0.5, BESI_TUA);
  p.kotakTangga(X0 + 1.5, 107, 6, 1.5, BESI_TUA, 0.5).kotakTangga(X1 - 7.5, 107, 6, 1.5, BESI_TUA, 0.5);
  for (const cx of [X0 + 4.5, X1 - 4.5]) for (let i = -5; i <= 5; i += 0.5) if (Math.abs(i) > 3) p.rect(cx + i, 108.5, 0.5, 0.5, '#ffffff');
  p.rect(X0, 76, X1 - X0, 3, '#ddb27d').rect(X0, 76, X1 - X0, 0.5, '#f0cf9e');
  p.rect(X0, 78.5, X1 - X0, 3.5, KAYU_TUA).rect(X0, 81.5, X1 - X0, 0.5, KAYU_GELAP);
  return p;
}
