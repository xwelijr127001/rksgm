/**
 * T-061c: seni PIKSEL misi acara 10 "Grand Mission: Banjir Susulan" (gaya kasus 1: k = 2, 1 sel = 4 dunia).
 * Latar kompleks usaha tergenang (geometri m10: langit, kota jauh, papan nama, pagar, halaman tergenang y 170-346, tanggul karung
 * pasir + jalan kering y 346-480). Empat kasus SETARA (skala, garis, sama-sama tergenang, pelat identitas IDENTIK tanpa tulisan):
 * mobil operasional (van), alat berat (excavator), gudang, palet kiriman. Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { AIR, KREM, TINTA, peti, poligon, teksBesar } from './piksel-umum';

const AIR_LATAR = '#9ccbe0';
const AIR_MUDA = '#bfe0ee';
const KUNING = '#f6c445';
const KUNING_TUA = '#d9a22a';
const BESI = '#9aa3a8';
const BESI_TUA = '#5f666d';

/** Pelat identitas tanpa tulisan, 5.5 x 3 sel (22 x 12). SAMA PERSIS di keempat kasus. */
export function pelatId(p: Piksel, x: number, y: number): void {
  p.kartu(x, y, 5.5, 3, KREM, TINTA);
  p.rect(x + 0.5, y + 1.25, 0.5, 0.5, BESI).rect(x + 4.5, y + 1.25, 0.5, 0.5, BESI);
  p.rect(x + 1.5, y + 1, 2.5, 0.5, '#7a7a7a').rect(x + 1.5, y + 2, 2, 0.5, '#7a7a7a');
}

/** Genangan di kaki kasus: pita air setengah tembus + riak putih, lebar w sel, tepi atas y. */
function genangan(p: Piksel, w: number, y: number): void {
  p.dither(0.5, y, w - 1, p.h - y, AIR, 0.6);
  for (let x = 2; x < w - 4; x += 8) p.rect(x, y + 0.5, 3, 0.5, '#ffffff').rect(x + 3, y, 1, 0.5, '#ffffff');
}

/** Excavator samping menghadap kanan, 36 x 20 sel (dipakai kasus B dan miniatur meja misi 9). */
export function excavatorSamping(): Piksel {
  const p = new Piksel(36, 20, null, 2);
  // roda rantai
  p.kotakTangga(1, 14.5, 20, 5, TINTA, 2).kotakTangga(1.5, 15, 19, 4, '#2f3a34', 2);
  for (const x of [4, 8, 12, 16]) p.bulat(x + 0.5, 17, 1.2, BESI);
  // rumah mesin + kabin
  p.kartu(1, 8, 18, 6.5, KUNING, TINTA).rect(1.5, 12.5, 17, 1.5, KUNING_TUA).rect(0, 9, 2, 5, KUNING_TUA);
  p.kartu(10, 2, 7.5, 7, '#eef3f6', TINTA).rect(11, 3, 5.5, 4, '#bfe0ea').rect(11.5, 3.5, 1, 2, '#ffffff');
  p.rect(9.5, 1.5, 8.5, 1, KUNING_TUA);
  // boom & lengan & bucket
  poligon(p, [[17, 10], [19, 8], [27, 1], [29.5, 2], [21, 11.5]], TINTA);
  poligon(p, [[17.75, 10], [19.5, 8.25], [27.25, 1.75], [28.5, 2.5], [20.5, 10.75]], KUNING);
  poligon(p, [[27, 1.5], [29.5, 1.5], [32.5, 11], [30.5, 11.5]], TINTA);
  poligon(p, [[27.75, 2], [29, 2], [31.75, 10.75], [31, 10.75]], KUNING);
  poligon(p, [[29, 11], [34.5, 10.5], [35, 15], [31, 16], [28.5, 13.5]], TINTA);
  poligon(p, [[29.5, 11.5], [34, 11], [34.5, 14.5], [31, 15.25], [29.25, 13.25]], BESI);
  p.bulat(28.25, 2, 0.8, BESI_TUA);
  return p;
}

// ------------------------------------------------------------------ empat kasus

/** Kasus A: van operasional biru menghadap kiri, tergenang, 35 x 19 sel (140 x 76). */
export function mobilA10(): Piksel {
  const p = new Piksel(35, 19, null, 2);
  poligon(p, [[2.5, 15.5], [2.5, 11], [5, 10], [8, 9.5], [12, 3], [14, 2], [32.5, 2], [34, 3.5], [34, 16], [3, 16]], TINTA);
  poligon(p, [[3, 15.5], [3, 11.25], [5.25, 10.5], [8.5, 10], [12.5, 3.5], [14.25, 2.5], [32.25, 2.5], [33.5, 3.75], [33.5, 15.5]], '#2f6fb0');
  poligon(p, [[12.75, 4.25], [16.5, 4.25], [16.5, 9.5], [9.75, 9.5]], '#bfe0ea');
  p.rect(18, 4.25, 7, 5.25, '#bfe0ea').rect(26.5, 4.25, 6, 5.25, '#bfe0ea').rect(13.5, 4.75, 0.5, 2, '#ffffff');
  p.rect(3, 11.5, 30.5, 0.75, '#5a8bd0').rect(17.25, 2.5, 0.5, 13, '#24548a');
  p.rect(3, 12, 2, 1.5, '#f6d25c');
  pelatId(p, 4, 13.25);
  for (const x of [9, 28]) p.bulat(x, 15.5, 2.6, TINTA).bulat(x, 15.5, 1.6, '#2a2d33').bulat(x, 15.5, 0.6, BESI);
  genangan(p, 35, 14);
  return p;
}

/** Kasus B: excavator menghadap kanan dengan pelat seri (tanpa tulisan), tergenang, 35 x 20 sel (140 x 80). */
export function alatBeratA10(): Piksel {
  const p = new Piksel(35, 20, null, 2);
  p.tempel(excavatorSamping(), -0.5, 0);
  pelatId(p, 3.5, 9.5);
  genangan(p, 35, 15.5);
  return p;
}

/** Kasus C: gudang beratap pelana, pintu gulung & pelat nomor (tanpa tulisan), tergenang, 33 x 22 sel (132 x 88). */
export function gudangA10(): Piksel {
  const p = new Piksel(33, 22, null, 2);
  poligon(p, [[0.5, 7], [16.5, 0.5], [32.5, 7], [32.5, 8], [0.5, 8]], TINTA);
  poligon(p, [[1.5, 7], [16.5, 1.5], [31.5, 7]], '#3f8f5a');
  p.kartu(2.5, 7, 28, 14, '#efe6d2', TINTA);
  for (let x = 4; x < 30; x += 2.5) p.rect(x, 7.5, 0.5, 13, '#e0d5bd');
  p.kartu(10, 10.5, 13, 10.5, '#9aa3a8', TINTA);
  for (let y = 11.5; y < 20.5; y += 1) p.rect(10.5, y, 12, 0.5, '#7f888d');
  p.kartu(4, 9.5, 4, 3.5, '#cfe8f5', TINTA).kartu(25, 9.5, 4, 3.5, '#cfe8f5', TINTA);
  pelatId(p, 24.25, 14.5);
  genangan(p, 33, 17.5);
  return p;
}

/** Kasus D: palet kiriman (lima peti, baris bawah basah) setengah tergenang, 35 x 21 sel (140 x 84). */
export function kirimanA10(): Piksel {
  const p = new Piksel(35, 21, null, 2);
  p.rect(1.5, 18.5, 32, 1.5, '#9c6b3f').rect(1.5, 18.5, 32, 0.5, '#c3976a');
  for (let i = 0; i < 3; i++) peti(p, 1.5 + i * 10.75, 10.5, 10.25, 8, '', { basah: true });
  for (let i = 0; i < 2; i++) peti(p, 7 + i * 10.75, 2.5, 10.25, 8, '');
  pelatId(p, 14.75, 14.5);
  genangan(p, 35, 17);
  return p;
}

/** Perahu karet kuning dengan karyawan berpelampung yang melambai, 22 x 18 sel (88 x 72), hiasan. */
export function perahuA10(): Piksel {
  const p = new Piksel(22, 18, null, 2);
  // karyawan (kecil): kepala, rambut, pelampung jingga, lengan melambai
  p.bulat(11, 4, 1.8, TINTA).bulat(11, 4, 1.4, '#e0ac7e').rect(9.75, 2.25, 2.5, 0.75, '#2b2118');
  p.rect(10.5, 4.5, 0.5, 0.5, TINTA).rect(11.5, 4.5, 0.5, 0.5, TINTA);
  p.kartu(9, 6, 4.5, 5, '#ff9000', TINTA).rect(9.5, 8, 3.5, 0.5, '#fff1e2');
  p.garis(13.5, 7, 15.5, 3.5, '#e0ac7e', 1).rect(15, 2.5, 1, 1, '#e0ac7e');
  // perahu
  p.kotakTangga(1, 10.5, 20, 5.5, TINTA, 2).kotakTangga(1.5, 11, 19, 4.5, KUNING, 2);
  p.rect(3, 12, 16, 0.5, '#fbe58f').rect(3, 14.5, 16, 0.5, KUNING_TUA);
  for (const x of [6, 11, 16]) p.bulat(x, 13.5, 0.6, BESI_TUA);
  p.dither(0, 16, 22, 2, AIR, 0.55);
  for (let x = 1.5; x < 21; x += 4) p.rect(x, 16, 2, 0.5, '#ffffff');
  return p;
}

// ------------------------------------------------------------------ latar

export function latarA10(): Piksel {
  const p = new Piksel(160, 120, null, 2);
  // langit + matahari + awan
  p.rect(0, 0, 160, 45, '#dcedf5').rect(0, 0, 160, 15, '#cfe6f2');
  p.bulat(11, 10, 5, '#fff1c2');
  const awan = (cx: number, cy: number, r: number) => p.bulat(cx, cy, r, '#ffffff').bulat(cx + r * 1.2, cy + 0.5, r * 0.8, '#ffffff').bulat(cx - r * 1.1, cy + 0.6, r * 0.7, '#ffffff').rect(cx - r * 1.8, cy + 0.5, r * 3.8, r * 0.8, '#ffffff');
  awan(37.5, 24, 2.5); awan(107.5, 8.5, 3.2); awan(75, 26, 2);
  // bukit & kota jauh (pucat)
  for (let x = 0; x < 160; x += 0.5) { const y = 33 + Math.sin(x * 0.045) * 3 + Math.sin(x * 0.13) * 1.2; p.rect(x, y, 0.5, 42.5 - y, '#d3e4d6'); }
  for (const [x, top, w, c] of [[70, 88, 54, '#e3d7c2'], [186, 106, 44, '#d6dfe2'], [360, 74, 60, '#e6d9bf'], [470, 100, 48, '#d9e4dc'], [540, 114, 70, '#e8dcc6']] as const) {
    p.rect(x / 4, top / 4, w / 4, (158 - top) / 4, c);
    for (let yy = top + 10; yy < 150; yy += 22) for (let xx = x + 8; xx < x + w - 10; xx += 20) p.rect(xx / 4, yy / 4, 3, 3, '#cfe6ee');
  }
  const pohon = (x: number, s: number) => { p.rect(x / 4 - 0.5, 34, 1, 6, '#8a6a4f'); p.bulat(x / 4, 33 - 2 * s, 3.2 * s, '#7fae7d').bulat(x / 4 - 1.2 * s, 32 - 2.5 * s, 2 * s, '#9cc69a'); };
  for (const [x, s] of [[34, 1.1], [150, 1], [296, 1.05], [448, 1], [622, 1.1]] as const) pohon(x, s);
  // papan nama kompleks (tiang 206 / 338, papan 192..358 x 26..60)
  p.rect(51.5, 10.5, 1.5, 29, '#b9a98b').rect(84.5, 10.5, 1.5, 29, '#b9a98b');
  // dilebarkan ke 184 dunia: 14 huruf 5 x 7 = 83 sel halus + tepi
  p.kartu(45.5, 6.5, 46, 8.5, '#3f8f5a', '#245c39');
  teksBesar(p, 47.75, 8.75, 'KOMPLEKS USAHA', '#fff1e2');
  // pagar belakang
  p.rect(0, 39, 160, 3, '#e8dfcc').rect(0, 41.5, 160, 1, '#d4c8ae');
  for (let i = 0; i < 9; i++) p.rect(2.5 + i * 19.5, 37.5, 3, 5, '#dccfb3');
  // halaman tergenang
  p.rect(0, 42.5, 160, 44, AIR_LATAR).rect(0, 42.5, 160, 4.5, AIR_MUDA);
  const riak = (x: number, y: number, w: number) => { for (let i = 0; i < w / 4; i += 4) p.rect(x / 4 + i, y / 4, 2, 0.5, '#ffffff').rect(x / 4 + i + 2, y / 4 - 0.5, 1.5, 0.5, '#ffffff'); };
  for (const [x, y, w] of [[24, 184, 40], [250, 206, 32], [560, 182, 36], [460, 212, 28], [14, 318, 44], [210, 326, 36], [420, 320, 40], [600, 326, 30], [203, 262, 26], [412, 270, 26]] as const) riak(x, y, w);
  // rambu P
  p.rect(3, 33, 1.25, 16, '#9aa8a0').kartu(0.5, 29, 6.5, 6, '#5a8bd0', '#2f6fb0');
  teksBesar(p, 2.5, 30.25, 'P', '#ffffff');
  // tanggul karung pasir + jalan kering
  p.rect(0, 86.5, 160, 33.5, '#e6ddcb').rect(0, 86.5, 160, 2, '#d3c7ae');
  for (let i = 0; i < 20; i++) p.kotakTangga(i * 8 - 1, 84.5, 8.5, 3.5, i % 2 ? '#cdb88e' : '#d9c7a0', 1);
  p.rect(0, 112.75, 160, 0.75, '#d3c7ae');
  for (const x of [40, 150, 260, 370, 480, 590]) p.rect(x / 4, 116.5, 11, 1, '#ffffff');
  for (const [cx, cy, rx] of [[59, 101, 7.5], [109.5, 102.5, 6]] as const) for (let i = -rx; i < rx; i += 0.5) { const t = Math.sqrt(1 - (i / rx) ** 2); p.rect(cx + i, cy - t * 0.75, 0.5, t * 1.5, AIR_MUDA); }
  return p;
}
