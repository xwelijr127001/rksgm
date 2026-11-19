/**
 * T-054: seni PIKSEL misi acara 01 "Setelah Api Padam" (toko kain di ruko, api sudah padam dan aman). 1 sel = 4 satuan dunia
 * (dunia 640 x 480 = 160 x 120 sel). Tata letak SAMA dengan latar m03 lama (tepi belakang meja y 96 = baris 24, meja panjang
 * x 130..640, pintu rolling x 344..534, lemari kiri) supaya slot objek, label, dan acakPosisi tidak berubah.
 * Warna: PALET.md (krem, jingga merek, tinta) + warna bahan ruko (kayu, kain, besi) seperti ruang piksel Episode 2.
 * Murni: tanpa DOM / Phaser (pratinjau node: character/acara-a01-t054/pratinjau.mts).
 */
import { Piksel } from '../../art/piksel';

const TINTA = '#2a211e';
const HANGUS = '#4a3b30';
const JELAGA = '#5f4c3e';

// ------------------------------------------------------------------ latar 160 x 120 sel

export function latarA01(): Piksel {
  const p = new Piksel(160, 120);
  // dinding plester krem + bintik halus, plafon
  p.rect(0, 0, 160, 25, '#f1ddbf');
  p.dither(0, 3, 160, 21, '#e8cfab', 0.07);
  p.rect(0, 0, 160, 3, '#e2cda5');
  p.rect(0, 3, 160, 1, '#cdb48a');
  // jelaga: lidah asap di dinding di atas rak (api sudah padam, bekasnya tinggal)
  const lidah = (i: number, j: number, kuat: number) => Math.max(0, (j / 20) * kuat + Math.abs(Math.sin((i + 3) * 0.55)) * 0.45 - 0.55);
  p.dither(40, 3, 40, 21, '#d8bf9b', (i, j) => lidah(i, j, 1.2));
  p.dither(40, 3, 40, 21, '#b59c7c', (i, j) => lidah(i, j, 0.9) - 0.15);
  p.dither(44, 3, 30, 3, '#d8bf9b', 0.35);
  // rak hangus: dua tiang, dua papan, kotak gosong
  p.rect(47, 5, 2, 19, '#6f5a49').rect(75, 5, 2, 19, '#6f5a49');
  p.rect(46, 12, 32, 2, JELAGA).rect(46, 21, 32, 2, JELAGA);
  const kotak = (x: number, y: number, w: number, h: number, c: string) => { p.rect(x, y, w, h, c); p.dither(x, y, w, 2, HANGUS, 0.7); p.set(x + 1, y + 2, HANGUS); };
  kotak(50, 6, 8, 6, '#8d7663'); kotak(60, 8, 6, 4, '#7e6c5d'); kotak(67, 5, 7, 7, '#978269');
  kotak(50, 16, 5, 5, '#908a82'); kotak(57, 17, 9, 4, '#806a58'); p.bulat(70, 18.5, 2.5, '#8c7b6b').bulat(70, 18.5, 1, '#6b5a4c');
  // APAR merah di dinding
  p.rect(5, 9, 10, 1, '#8c8c8c');
  p.kartu(7, 6, 6, 14, '#d32f2f', '#9e1f1f');
  p.rect(8, 11, 4, 3, '#fff1e2').rect(8, 8, 1, 10, '#ef9a9a');
  p.rect(8, 3, 3, 3, '#33363f').rect(11, 4, 3, 1, '#33363f');
  // bingkai foto
  p.kartu(23, 5, 14, 11, '#aec8da', '#73502f');
  p.rect(24, 12, 12, 3, '#8db07a').set(33, 8, '#f6d25c').set(34, 8, '#f6d25c');
  // pintu rolling terangkat + jalan cerah di luar
  p.rect(86, 7, 48, 18, '#cfe6ee');
  p.rect(86, 7, 48, 2, '#b8dbe8');
  p.rect(90, 9, 5, 1, '#ffffff').rect(89, 10, 8, 1, '#ffffff').rect(112, 10, 6, 1, '#ffffff');
  p.rect(88, 14, 16, 7, '#e2cba7').rect(106, 15, 20, 6, '#d9c9b8');
  for (let x = 90; x < 103; x += 4) p.rect(x, 16, 2, 2, '#aec8da');
  for (let x = 108; x < 125; x += 4) p.rect(x, 17, 2, 2, '#aec8da');
  p.rect(86, 21, 48, 4, '#7a7a7a').rect(86, 21, 48, 1, '#9a9a9a');
  for (let x = 88; x < 134; x += 6) p.rect(x, 23, 3, 1, '#f6d25c');
  p.rect(84, 7, 2, 18, '#8c8c8c').rect(134, 7, 2, 18, '#8c8c8c');
  // gulungan pintu rolling (bilah besi) + papan "TOKO KAIN"
  p.rect(84, 2, 52, 6, '#b8b8b8');
  for (let y = 3; y < 8; y += 2) p.rect(84, y, 52, 1, '#9a9a9a');
  p.rect(84, 7, 52, 1, '#6f6f6f');
  p.kartu(91, 1, 37, 7, '#ff9000', '#9a4f00');
  p.teks(93, 2, 'TOKO KAIN', TINTA);
  // lantai keramik
  p.rect(0, 25, 160, 95, '#e9dfcb');
  for (let y = 30; y < 120; y += 6) p.rect(0, y, 160, 1, '#d6c6a6');
  for (let x = 0; x < 160; x += 10) p.rect(x, 25, 1, 95, '#ddd0b4');
  p.rect(0, 23, 160, 2, '#dccaa6');
  // lemari kiri + gulungan kain di atasnya (sebagian gosong)
  p.rect(2, 84, 34, 2, '#d4c3a2');
  p.rect(3, 56, 28, 28, '#d2ab7c').rect(2, 54, 30, 3, '#b98f60');
  p.kartu(5, 60, 24, 10, '#c69d6e', '#a97b50').kartu(5, 71, 24, 10, '#c69d6e', '#a97b50');
  p.rect(14, 64, 6, 2, '#9c6b3f').rect(14, 75, 6, 2, '#9c6b3f');
  const gulung = (x: number, y: number, w: number, c: string, tua: string, gosong: boolean) => {
    p.rect(x, y, w, 5, c);
    p.rect(x + w - 2, y, 2, 5, tua).set(x + w - 1, y + 2, '#f3e6cc');
    p.rect(x, y + 4, w, 1, tua);
    if (gosong) p.rect(x, y, 3, 5, HANGUS).set(x + 3, y + 1, HANGUS).set(x + 3, y + 3, HANGUS).set(x + 4, y + 2, JELAGA);
  };
  gulung(4, 49, 26, '#dcb0a6', '#c29188', false);
  gulung(6, 44, 22, '#aec8da', '#8fb0c6', true);
  gulung(8, 39, 18, '#e7d59a', '#cfba78', false);
  // meja panjang tampak atas-depan (sama dengan m03)
  p.rect(32, 113, 128, 3, '#d4c3a2');
  p.rect(37, 112, 4, 7, '#9c6b3f').rect(151, 112, 4, 7, '#9c6b3f');
  for (let y = 24; y < 110; y++) {
    const kiri = Math.round(38.5 - ((y - 24) / 86) * 6);
    p.rect(kiri, y, 160 - kiri, 1, '#e3c49b');
    p.set(kiri, y, '#eed7b5').set(kiri + 1, y, '#eed7b5');
  }
  p.rect(38, 24, 122, 2, '#d3b083');
  p.rect(37, 56, 123, 1, '#d4b286').rect(36, 90, 124, 1, '#d4b286');
  p.dither(40, 27, 118, 82, '#dcba8d', 0.05);
  p.rect(32, 110, 128, 3, '#c3976a').rect(32, 110, 128, 1, '#a97b50');
  return p;
}

/** Lampu gantung 10 x 17 sel (40 x 68 dunia). */
export function lampuA01(): Piksel {
  const p = new Piksel(10, 17);
  p.rect(5, 0, 1, 8, '#5f5f5f');
  p.bulat(5, 13, 4.5, '#fff1c2');
  p.rect(2, 8, 7, 1, '#33363f').rect(1, 9, 9, 2, '#33363f').rect(1, 10, 9, 1, '#5f5f5f');
  p.rect(4, 11, 3, 2, '#fff9e8');
  return p;
}

/** Tumpukan tiga gulungan kain di meja, 33 x 21 sel (132 x 84 dunia); yang paling atas gosong di ujungnya. */
export function kainA01(): Piksel {
  const p = new Piksel(33, 21);
  p.rect(2, 19, 30, 2, '#cfb085');
  const rol = (x: number, y: number, w: number, c: string, tua: string, terang: string, gosong: boolean) => {
    p.kotakTangga(x, y, w, 7, c);
    p.rect(x + 2, y + 1, w - 6, 1, terang);
    p.kotakTangga(x + w - 4, y, 4, 7, tua).rect(x + w - 3, y + 3, 2, 1, '#f3e6cc');
    if (gosong) p.kotakTangga(x, y, 4, 7, HANGUS).set(x + 4, y + 1, HANGUS).set(x + 4, y + 4, HANGUS).set(x + 5, y + 2, JELAGA).set(x + 4, y + 3, JELAGA);
  };
  rol(1, 13, 31, '#dcb0a6', '#c29188', '#ead0c9', false);
  rol(3, 7, 27, '#aec8da', '#8fb0c6', '#d3e3ee', false);
  rol(5, 1, 24, '#e7d59a', '#cfba78', '#f3e8c1', true);
  return p;
}

// ------------------------------------------------------------------ lima kartu pilihan, 24 x 22 sel (96 x 88 dunia)

export type JenisKartuA01 = 'foto' | 'lapor' | 'perbaiki' | 'buang' | 'buka';

/** Kartu kosong: kertas krem bertangga, garis tinta, bayangan 1 sel di meja. */
function kartuDasar(): Piksel {
  const p = new Piksel(24, 22);
  p.kotakTangga(1, 2, 23, 20, '#c3a27a');
  p.kartu(0, 0, 23, 20, '#fff9f5', TINTA);
  p.rect(2, 17, 19, 1, '#f3ded3');
  return p;
}

export function kartuA01(jenis: JenisKartuA01): Piksel {
  const p = kartuDasar();
  if (jenis === 'foto') {
    // kamera: badan tinta, lensa biru, lampu kilat kuning, tombol jingga
    p.kotakTangga(4, 5, 15, 10, '#33363f');
    p.rect(6, 4, 4, 2, '#33363f').rect(15, 4, 3, 1, '#ff9000');
    p.rect(5, 6, 13, 1, '#5f5f5f');
    p.bulat(11.5, 10, 3.6, '#1d1b20').bulat(11.5, 10, 2.4, '#5f8db0').set(10, 9, '#d3e3ee');
    p.rect(16, 7, 2, 1, '#f6d25c');
  } else if (jenis === 'lapor') {
    // lembar laporan bergaris + lencana centang jingga
    p.kartu(5, 3, 11, 14, '#ffffff', TINTA);
    p.rect(13, 3, 3, 1, null).set(13, 3, TINTA).rect(13, 4, 2, 2, '#ecd5cb');
    p.rect(7, 6, 5, 1, '#ff9000');
    for (const y of [8, 10, 12, 14]) p.rect(7, y, 7, 1, '#a4a4a4');
    p.bulat(16.5, 13.5, 3.6, '#ff9000').bulat(16.5, 13.5, 2.6, '#ff9000');
    p.pola(14, 12, ['....#', '#..#.', '.##..'], { '#': '#ffffff' });
  } else if (jenis === 'perbaiki') {
    // obeng: gagang jingga, batang besi miring, dua sekrup
    p.pola(4, 2, [
      '...........dd...',
      '..........dOOd..',
      '.........dOOOd..',
      '........dOyOd...',
      '.......kdOOd....',
      '......kkdd......',
      '.....kss........',
      '....kss.........',
      '...kss..........',
      '..kss...........',
      '.kss............',
      '.ks.............',
      '..k.............',
    ], { d: '#9a4f00', O: '#ff9000', y: '#ffd9a8', k: '#33363f', s: '#a4a4a4' });
    p.pola(14, 12, ['.k.', 'ksk', '.k.'], { k: '#33363f', s: '#a4a4a4' }).pola(17, 15, ['.k.', 'ksk', '.k.'], { k: '#33363f', s: '#a4a4a4' });
  } else if (jenis === 'buang') {
    // tong sampah besi + barang hangus di atasnya
    p.rect(6, 7, 11, 1, TINTA).kotakTangga(5, 8, 13, 2, '#8c8c8c');
    p.rect(7, 10, 9, 7, '#a4a4a4').rect(7, 16, 9, 1, '#8c8c8c');
    p.rect(9, 11, 1, 5, '#8c8c8c').rect(11, 11, 1, 5, '#8c8c8c').rect(13, 11, 1, 5, '#8c8c8c');
    p.kotakTangga(7, 3, 5, 4, '#7e6c5d').dither(7, 3, 5, 2, HANGUS, 0.9);
    p.kotakTangga(12, 4, 4, 3, '#8d7663').dither(12, 4, 4, 2, HANGUS, 0.9);
    p.set(9, 1, '#a4a4a4').set(10, 2, '#a4a4a4').set(14, 2, '#a4a4a4');
  } else {
    // papan gantung "BUKA" (marun) seperti di pintu toko
    p.garis(7, 7, 11, 3, '#5f5f5f').garis(16, 7, 12, 3, '#5f5f5f');
    p.bulat(11.5, 3, 1.2, '#8c8c8c');
    p.kartu(3, 7, 17, 9, '#5b2533', '#3e1620');
    p.rect(4, 8, 15, 7, '#fff1e2');
    p.teks(4, 9, 'BUKA', '#5b2533');
  }
  return p;
}
