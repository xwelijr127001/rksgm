/**
 * T-061c: seni PIKSEL misi acara 09 "Hitung Berlapis" (gaya kasus 1: k = 2, 1 sel = 4 dunia).
 * Latar meja hitung Kantor Raksa dengan geometri m09 (dinding y 0-364, papan lembar hitung di dinding = papan engine PAPAN, rak
 * kapur di bawahnya, jam, jendela, meja dengan lampu, kalkulator, tumpukan map, tempat pensil, lantai kayu). Dua dokumen SETARA
 * (estimasi bengkel, kartu polis HVC) + miniatur excavator (pemanis). Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { excavatorSamping } from './a10.piksel';
import { KAYU, KAYU_GELAP, KAYU_TUA, KREM, TINTA, poligon, skala, teksBesar } from './piksel-umum';

/** Papan lembar hitung m09 (x pusat 250, atas 24, lebar 410, 3 baris): bawah papan = 24 + 44 + 3 x 40 = 188. */
const PAPAN = { kiri: 45, bawah: 188, w: 410 };

export function latarA09(): Piksel {
  const p = new Piksel(160, 120, null, 2);
  // dinding + wainscot
  p.rect(0, 0, 160, 91, '#f4ecd9').rect(0, 0, 160, 3, '#e3d5b4');
  p.rect(0, 65.5, 160, 25.5, '#ecdfc4').rect(0, 64.5, 160, 1.5, '#ddcba6');
  for (let x = 6; x < 160; x += 12) p.rect(x, 66, 0.5, 25, '#e2d3b4');
  // rak kapur di bawah papan + kapur + penghapus
  p.rect((PAPAN.kiri + 24) / 4, (PAPAN.bawah + 8) / 4, (PAPAN.w - 48) / 4, 2, '#b08556').rect((PAPAN.kiri + 24) / 4, (PAPAN.bawah + 9.5) / 4, (PAPAN.w - 48) / 4, 0.5, KAYU_GELAP);
  p.rect((PAPAN.kiri + 64) / 4, (PAPAN.bawah + 3) / 4, 5.5, 1.5, '#ffffff').rect((PAPAN.kiri + 94) / 4, (PAPAN.bawah + 3) / 4, 4, 1.5, '#fff1c2');
  p.kartu((PAPAN.kiri + PAPAN.w - 96) / 4, (PAPAN.bawah + 1) / 4, 7.5, 2, '#8aa296', '#6c8478');
  // jam dinding (506, 78)
  p.bulat(126.5, 19.5, 6.25, '#dccaa4').bulat(126.5, 19.5, 5, KREM);
  for (const [x, y] of [[126.25, 15.25], [126.25, 23.25], [122.25, 19.25], [130.25, 19.25]] as const) p.rect(x, y, 0.5, 0.5, '#7a7a7a');
  p.garis(126.5, 19.5, 126.5, 16.5, TINTA, 1).garis(126.5, 19.5, 128.5, 20.5, TINTA, 1);
  // jendela kecil ke kota (478..620, 126..250)
  p.kartu(119.5, 31.5, 35.5, 31, '#e2d2ae', '#cdb98f');
  p.rect(122, 34, 30.5, 26, '#cfe8f5').rect(122, 34, 30.5, 9, '#b7dcef');
  p.bulat(131, 40.5, 1.6, '#ffffff').bulat(133, 40.5, 1.2, '#ffffff').rect(129.5, 41, 5, 1, '#ffffff');
  p.rect(124, 50, 6, 10, '#dccfb3').rect(131, 46, 7, 14, '#c8d8c9').rect(139.5, 52, 6, 8, '#e1d3bb');
  for (const [x, y] of [[125, 51.5], [127.5, 51.5], [132, 47.5], [135, 47.5], [132, 51.5], [135, 51.5]] as const) p.rect(x, y, 1.5, 1.5, '#eef5f7');
  p.rect(137, 34, 1, 26, '#e2d2ae').rect(122, 46.5, 30.5, 1, '#e2d2ae');
  // lantai kayu
  p.rect(0, 91, 160, 29, '#e4d4b3').rect(0, 90, 160, 1.5, '#d3bf98');
  for (const y of [99, 110]) p.rect(0, y, 160, 0.5, '#d5c29e');
  for (const [i, x] of [70, 190, 330, 470, 600].entries()) p.rect((x + (i % 2) * 30) / 4, 91.5, 0.5, 7.5, '#d5c29e').rect((x - 40) / 4, 99, 0.5, 11, '#d5c29e').rect((x + 20) / 4, 110, 0.5, 10, '#d5c29e');
  // meja: permukaan, tepi, ruang kaki, laci
  poligon(p, [[8.5, 74.5], [136.5, 74.5], [140, 79.5], [5, 79.5]], '#dcb27c');
  p.rect(5, 79.5, 135, 3.5, '#c8955f').rect(5, 82.5, 135, 0.5, '#a97a4b');
  p.rect(49, 83, 47, 16.5, '#a97a4b').rect(49, 83, 47, 2, '#946a40');
  for (const x of [9, 96]) {
    p.kartu(x, 83, 40, 25.5, '#c08d59', '#a97a4b');
    p.rect(x + 1.5, 91.5, 37, 0.75, '#a97a4b').rect(x + 1.5, 100, 37, 0.75, '#a97a4b');
    for (const y of [86.5, 95, 103.5]) p.kotakTangga(x + 16, y, 8, 1.5, '#8a6a4f', 0.5);
  }
  // lampu meja kiri (digeser -8) + sorot
  p.dither(16.5, 63, 39, 12, '#fff1c2', (i, j) => (j / 12) * 0.45 * (1 - Math.abs(i - 19) / 22));
  p.kotakTangga(8.5, 75.5, 12, 3, '#2a7a55', 1);
  p.garis(14.5, 76, 17.5, 66, '#51645a', 2).garis(17.5, 66, 26, 58.5, '#51645a', 2);
  poligon(p, [[23, 57], [29.5, 55], [32.5, 61], [26, 63]], '#2a7a55');
  // kalkulator (+12)
  p.kartu(37.5, 53.5, 28, 25, '#7d8c84', '#6c7b73').rect(37.5, 73.5, 28, 5, '#6c7b73');
  p.rect(40, 56, 23, 7.5, '#dde9d6').rect(40.5, 56.5, 22, 2, '#eef5ea');
  teksBesar(p, 58.5, 57.25, '0', '#56705f');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) p.rect(40.5 + c * 5.5, 65.5 + r * 4, 4.25, 3, c === 3 ? (r === 2 ? '#efd9a0' : '#e6dcc4') : '#f4eedf');
  // tumpukan map kanan
  for (const [y, w, x, c] of [[298, 104, 376, '#e2b54a'], [286, 100, 380, '#86b6de'], [274, 104, 374, '#efe6cf'], [262, 98, 382, '#9fcfae'], [250, 102, 378, '#f0c860']] as const) {
    p.rect(x / 4, y / 4, w / 4, 3.25, c).rect(x / 4, y / 4 + 2.25, w / 4, 1, '#00000014').rect(x / 4 + 2, y / 4 - 0.5, 15, 0.75, '#ffffff');
  }
  // tempat pensil
  p.garis(126, 72.5, 124.5, 64, '#f6c445', 1).garis(128, 72.5, 129, 63, '#2f6fb0', 1).garis(130, 72.5, 132, 65.5, '#d32f2f', 1);
  p.kartu(124, 70, 8, 8.5, '#2a8c8c', '#1d6464').rect(124.5, 72.5, 7, 1, '#4fb3ad');
  return p;
}

/** Lembar Estimasi Bengkel di papan klip, 23 x 27 sel (92 x 108): strip judul jingga + lencana kunci pas. */
export function estimasiA09(): Piksel {
  const p = new Piksel(23, 27, null, 2);
  p.kotakTangga(2.5, 3, 20, 24, '#00000020', 1);
  p.kartu(1.5, 2, 20, 23.5, KAYU, TINTA);
  p.kartu(3.25, 4.25, 16.5, 19.5, '#ffffff', '#a4a4a4');
  p.kartu(7.5, 1, 8, 3, '#9aa3a8', TINTA);
  p.rect(5, 6.25, 13, 3.5, '#ff9000').rect(6.5, 7, 2, 2, KREM).rect(10, 7.75, 6, 0.75, KREM);
  p.rect(5, 11, 13, 0.5, '#c5ccd0').rect(12.25, 11, 0.5, 11.5, '#c5ccd0');
  for (let i = 0; i < 4; i++) p.rect(5.5, 12.5 + i * 3, i % 2 ? 4.5 : 6, 0.75, '#a4a4a4').rect(13.5, 12.5 + i * 3, i === 3 ? 2.5 : 4, 0.75, '#7a7a7a');
  // lencana kunci pas
  p.bulat(17, 20.5, 3.2, TINTA).bulat(17, 20.5, 2.7, '#f6c445');
  p.garis(15.5, 22, 18, 19.5, TINTA, 2).bulat(18.25, 19.25, 1, TINTA).rect(18.25, 18.75, 0.5, 0.5, '#f6c445');
  return p;
}

/** Kartu polis HVC 28 x 19 sel (112 x 76): tajuk hijau "HVC", baris data, lencana. */
export function kartuA09(): Piksel {
  const p = new Piksel(28, 19, null, 2);
  p.kotakTangga(1.5, 2, 26, 17, '#00000020', 1);
  p.kartu(0.5, 1, 26, 17, KREM, TINTA);
  p.rect(1, 1.5, 25, 5, '#3f8f5a');
  teksBesar(p, 2.5, 2.25, 'HVC', '#fff1e2');
  p.rect(14, 3.25, 10, 1, '#cfe3cc');
  for (const [y, w] of [[9, 12], [11.5, 14], [14, 9]] as const) p.rect(2.5, y, w, 0.75, '#a4a4a4');
  p.bulat(21.5, 12.5, 3.2, TINTA).bulat(21.5, 12.5, 2.7, '#fff1c2').rect(20.5, 11, 2, 0.75, '#3f8f5a').rect(20.5, 12.5, 2, 0.75, '#3f8f5a').rect(20.5, 14, 2, 0.75, '#3f8f5a');
  return p;
}

/** Miniatur excavator kuning di alas kayu, 20 x 13 sel (80 x 52), pemanis meja. */
export function miniExcavatorA09(): Piksel {
  const p = new Piksel(20, 13, null, 2);
  p.tempel(skala(excavatorSamping(), 0.5), 0.5, 0);
  p.kotakTangga(1, 10, 13, 2.5, KAYU_TUA, 0.5).rect(1.5, 10, 12, 0.5, '#c69d6e');
  return p;
}
