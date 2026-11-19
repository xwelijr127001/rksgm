/**
 * T-061b: seni PIKSEL misi acara 06 "Satu per Satu, Pak Kepala Gudang" (gaya kasus 1: k = 2, 1 sel = 4 dunia).
 * Lima tindakan SETARA (23 x 20 sel = 92 x 80, tatakan & garis tinta sama), rak besi bengkok, forklift GT-220 menghadap kiri,
 * jam dinding sore. Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { KAYU, KAYU_GELAP, KAYU_TUA, KREM, TINTA, bayangan, teksBesar } from './piksel-umum';

const BESI = '#9aa3a8';
const BESI_TUA = '#6f787d';
const KUNING = '#f6c445';
const KUNING_TUA = '#c9971a';

/** Kanvas tindakan + tatakan krem yang sama (permukaan y 67 dunia = 16.75 sel). */
function tindakan(): Piksel {
  const p = new Piksel(23, 20, null, 2);
  bayangan(p, 11.5, 19.5, 10.5);
  p.kartu(1, 16.5, 21, 2.5, '#efe3c8', TINTA);
  return p;
}

export type TindakanA06 = 'lapor' | 'perbaiki' | 'buang' | 'dok' | 'survei';

export function tindakanA06(j: TindakanA06): Piksel {
  const p = tindakan();
  if (j === 'lapor') {
    // lembar catatan miring + ponsel berformulir + gelombang kirim
    p.kartu(2.5, 9.5, 5.5, 7, '#ffffff', TINTA).rect(3.5, 11.5, 3.5, 0.5, '#a4a4a4').rect(3.5, 13, 3.5, 0.5, '#a4a4a4').rect(3.5, 14.5, 2.5, 0.5, '#a4a4a4');
    p.kartu(8, 2.5, 9, 14, '#33363f', TINTA).rect(9, 4, 7, 10.5, '#ffffff');
    p.rect(9.5, 4.5, 6, 1.5, '#3f8f5a').rect(9.5, 7, 6, 0.5, '#a4a4a4').rect(9.5, 8.5, 6, 0.5, '#a4a4a4').rect(9.5, 10, 4, 0.5, '#a4a4a4');
    p.rect(10.5, 11.5, 4, 2, '#f6d25c').rect(11.5, 15, 2, 0.5, '#5f5f5f');
    for (const [x, c] of [[18, '#2f6fb0'], [20, '#8fc3e0']] as const) for (let y = 4; y < 12; y += 0.5) p.rect(x + Math.round(Math.sin(((y - 4) / 8) * Math.PI) * (x === 18 ? 1 : 1.5) * 2) / 2, y, 0.5, 0.5, c);
  } else if (j === 'perbaiki') {
    // kotak perkakas merah + stang las berpercikan
    p.kartu(1.5, 9, 13, 7.5, '#c8443a', TINTA).rect(2, 11.5, 12, 0.5, '#8f2f29').kartu(5.5, 7, 5, 2.5, '#9aa3a8', TINTA);
    p.rect(7.5, 12.5, 1.5, 1.5, '#f6d25c');
    p.garis(21, 16.5, 19, 10, TINTA, 3).garis(21, 16.5, 19, 10, BESI, 2).garis(19, 10, 17.5, 7, TINTA, 2).garis(19, 10, 17.5, 7, '#c5ccd0', 1);
    p.bulat(17.25, 6.25, 1.2, '#fff1c2');
    p.rect(17, 2.5, 0.5, 2, '#ff9000').rect(19.5, 3.5, 1, 0.5, '#ff9000').rect(14.5, 3.5, 1, 0.5, '#ff9000').rect(20.5, 6, 1.5, 0.5, '#ff9000');
  } else if (j === 'buang') {
    // tempat sampah + potongan komponen patah
    p.kotakTangga(3, 6.5, 10, 1.5, '#7a8a80', 0.5).rect(3, 6.5, 10, 0.5, TINTA);
    p.kartu(3.5, 8, 9, 8.5, '#93a398', TINTA);
    for (const x of [5.5, 8, 10.5]) p.rect(x, 9.5, 0.5, 6, '#6f7f74');
    p.rect(7, 5.5, 2, 1, TINTA);
    p.pola(14, 11, ['#.#..', '#####', '#####'], { '#': BESI_TUA }).rect(14, 14, 8, 2.5, BESI_TUA).rect(14.5, 14.5, 7, 0.5, BESI).rect(14, 11, 8, 0.5, TINTA);
  } else if (j === 'dok') {
    // kamera + pelat nomor seri "SN"
    p.kartu(2, 6.5, 12, 10, '#4b5058', TINTA).rect(4, 5.5, 4.5, 1.5, '#4b5058').rect(10.5, 7.5, 2, 1.5, '#f6d25c');
    p.bulat(8, 12, 3.2, TINTA).bulat(8, 12, 2.6, '#bfe0ea').bulat(8, 12, 1.4, '#2f6fb0').rect(7, 11, 0.5, 0.5, '#ffffff');
    p.kartu(12.5, 9.5, 9.5, 7, KREM, TINTA);
    for (const [x, y] of [[13.5, 10.5], [20.5, 10.5], [13.5, 15], [20.5, 15]] as const) p.rect(x, y, 0.5, 0.5, BESI_TUA);
    teksBesar(p, 14.75, 10.75, 'SN', TINTA);
    p.rect(14.5, 15, 5, 0.5, '#7a7a7a');
  } else {
    // papan klip pemeriksaan + helm kuning
    p.kartu(2, 3, 9.5, 13.5, KAYU, TINTA).rect(3, 5, 7.5, 10.5, '#ffffff').kartu(4.5, 2, 4.5, 2, '#9aa3a8', TINTA);
    for (const y of [7, 9, 11, 13]) p.rect(4, y, y === 13 ? 3.5 : 5.5, 0.5, '#a4a4a4');
    p.rect(9, 7, 0.5, 0.5, '#3f8f5a').rect(9, 9, 0.5, 0.5, '#3f8f5a');
    for (let y = 10.5; y < 15; y += 0.5) { const half = Math.sqrt(Math.max(0, 1 - ((15 - y) / 4.5) ** 2)) * 5; p.rect(17 - half, y, half * 2, 0.5, KUNING); }
    p.rect(11.5, 14.5, 11, 1.5, KUNING).rect(11.5, 15.5, 11, 0.5, KUNING_TUA).rect(16.75, 10.5, 0.5, 4, KUNING_TUA);
  }
  return p;
}

/** Rak besi tiga tingkat 20 x 60 sel (80 x 240): tiang kiri bengkok setinggi pemberat forklift, palang miring, kardus bergeser. */
export function rakA06(): Piksel {
  const p = new Piksel(20, 60, null, 2);
  bayangan(p, 11, 59, 9);
  p.rect(16, 1.5, 2, 56.5, BESI).rect(16, 1.5, 0.5, 56.5, '#c5ccd0').rect(17.5, 1.5, 0.5, 56.5, BESI_TUA);
  // tiang kiri: lurus, lalu bengkok ke dalam di 150..210 dunia (37.5..52.5 sel)
  for (let y = 1.5; y < 58; y += 0.5) {
    const d = y < 37.5 ? 0 : y < 45 ? (y - 37.5) * 0.27 : y < 52.5 ? (52.5 - y) * 0.27 : 0;
    p.rect(3.5 + d, y, 2, 0.5, BESI).rect(3.5 + d, y, 0.5, 0.5, BESI_TUA);
  }
  for (const y of [7.5, 23, 55.5]) p.rect(3, y, 16, 2, '#b9c1c5').rect(3, y + 1.5, 16, 0.5, BESI_TUA);
  p.garis(5.5, 41.5, 18.5, 39.5, '#b9c1c5', 3).garis(5.5, 42.5, 18.5, 40.5, BESI_TUA, 1); // palang miring
  p.kartu(5.5, 2, 5.5, 5.5, '#dfc69c', '#a9895a').kartu(11.5, 3.5, 4.5, 4, '#e6d2ae', '#a9895a');
  p.kartu(7, 15.5, 8, 7.5, KAYU, KAYU_GELAP).rect(7.5, 18, 7, 0.5, KAYU_TUA);
  // kardus bergeser miring di atas palang miring
  for (let y = 0; y < 6; y += 0.5) p.rect(10 + y * 0.25, 33.5 + y - (y < 6 ? 0 : 0), 6.5, 0.5, y < 0.5 ? '#a9895a' : '#dfc69c');
  p.rect(12.5, 33.5, 0.5, 6, '#cdb083');
  // garis benturan jingga di sisi forklift
  p.garis(2.5, 41.5, 1, 40, '#ff9000', 2).rect(0.5, 45, 1.5, 0.5, '#ff9000').garis(2.5, 48.5, 1, 50, '#ff9000', 2);
  return p;
}

/** Jam dinding 13 x 13 sel (52 x 52), sore (jarum pendek ke 5, panjang ke 8). */
export function jamA06(): Piksel {
  const p = new Piksel(13, 13, null, 2);
  p.bulat(6.75, 7, 5.6, '#00000020').bulat(6.5, 6.5, 5.6, TINTA).bulat(6.5, 6.5, 5, KREM);
  for (const [x, y] of [[6.25, 2], [6.25, 10.5], [2, 6.25], [10.5, 6.25]] as const) p.rect(x, y, 0.5, 0.5, '#7a7a7a');
  p.garis(6.5, 6.5, 8, 9, TINTA, 2).garis(6.5, 6.5, 3.25, 4.5, TINTA, 1);
  p.rect(6.25, 6.25, 0.5, 0.5, '#d32f2f');
  return p;
}

/** Forklift GT-220 menghadap KIRI, 101 x 66 sel (404 x 264): garpu & tiang di kiri, kabin berpelindung, pemberat di kanan. */
export function forkliftA06(): Piksel {
  const p = new Piksel(101, 66, null, 2);
  bayangan(p, 54, 65, 45);
  // tiang angkat (mast) & rantai
  p.rect(17, 0.5, 3, 60, '#4b5058').rect(23, 0.5, 3, 60, '#4b5058').rect(17, 0.5, 0.5, 60, TINTA).rect(25.5, 0.5, 0.5, 60, TINTA);
  for (const y of [6, 22, 38, 52]) p.rect(17, y, 9, 1.5, '#5f666d');
  p.rect(20.5, 2, 2, 50, '#33363f');
  // garpu (di kiri, dekat lantai) + sandaran beban
  p.rect(14, 40, 2.5, 21, BESI_TUA).rect(1, 59, 15.5, 2, BESI_TUA).rect(1, 59, 15.5, 0.5, '#c5ccd0').rect(1, 60.5, 15.5, 0.5, TINTA);
  // pelindung atas kabin (overhead guard)
  p.rect(30, 6, 44, 2.5, '#33363f').rect(30, 6, 44, 0.5, '#5f666d');
  p.rect(31, 8.5, 2, 26, '#33363f').rect(70, 8.5, 2, 26, '#33363f');
  // badan kuning + kap mesin + pemberat kanan
  p.kotakTangga(26, 34, 75, 21, KUNING, 2);
  p.rect(26, 34, 75, 0.5, TINTA).rect(26.5, 35, 74, 1, '#fbe58f').rect(26, 54.5, 75, 0.5, TINTA);
  p.kotakTangga(80, 22, 20.5, 13, KUNING, 2).rect(80, 22, 20.5, 0.5, TINTA).rect(80.5, 23, 19.5, 1, '#fbe58f');
  p.rect(84, 26, 13, 0.5, KUNING_TUA).rect(84, 28.5, 13, 0.5, KUNING_TUA).rect(84, 31, 13, 0.5, KUNING_TUA); // kisi mesin
  p.rect(26, 47, 75, 1.5, '#33363f');
  // kursi & kemudi
  p.kartu(54, 22, 9, 12, '#33363f', TINTA).rect(55, 23, 7, 9, '#4b5058');
  p.garis(42, 25, 47, 31, '#33363f', 2).rect(40, 23.5, 5, 1.5, '#33363f');
  // tulisan GT-220 + garis peringatan
  teksBesar(p, 52, 39.5, 'GT-220', '#33363f');
  for (let x = 28; x < 50; x += 3) p.garis(x, 50.5, x + 1.5, 49, '#33363f', 1);
  // roda
  for (const [cx, r] of [[38, 9.5], [85, 8.5]] as const) {
    p.bulat(cx, 56, r, TINTA).bulat(cx, 56, r - 1, '#2a2d33').bulat(cx, 56, r * 0.45, '#9aa3a8').bulat(cx, 56, r * 0.18, '#4b5058');
  }
  return p;
}
