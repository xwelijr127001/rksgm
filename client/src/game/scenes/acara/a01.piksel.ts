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
  const p = new Piksel(160, 120, null, 2);
  // dinding plester krem + bintik halus, plafon
  p.rect(0, 0, 160, 25, '#f1ddbf');
  p.dither(0, 3, 160, 21, '#e8cfab', 0.07);
  p.rect(0, 0, 160, 3, '#e2cda5');
  p.rect(0, 3, 160, 0.5, '#cdb48a');
  // T-054 Fix 1: BEKAS KEBAKARAN yang jelas (api sudah padam, aman): jelaga hitam naik dari rak ke plafon, plafon menghitam,
  // pojok kiri atas gosong. Lidah api tergambar sebagai lidah jelaga bertingkat (cokelat tua -> hitam di tengahnya).
  const lidah = (i: number, j: number, lebar: number) => {
    const t = Math.abs(Math.sin((i + 2) * 0.42)) * 0.6 + 0.4; // tinggi lidah 40..100 %
    return (21 - j) / 21 < t * lebar ? 1 : 0;
  };
  p.rect(34, 0, 52, 3, '#5f4c3e').rect(38, 3, 44, 1, '#4a3b30'); // plafon menghitam di atas rak
  p.dither(30, 3, 60, 21, '#a48b70', (i, j) => lidah(i - 4, j, 1.0) * 0.85);
  p.dither(36, 3, 48, 21, '#6f5a49', (i, j) => lidah(i, j, 0.85));
  p.dither(40, 3, 40, 21, HANGUS, (i, j) => lidah(i + 3, j, 0.7));
  p.dither(44, 6, 32, 18, '#2a211e', (i, j) => lidah(i + 5, j, 0.45));
  p.rect(0, 0, 9, 3, '#5f4c3e').dither(0, 3, 6, 6, '#6f5a49', (i, j) => (6 - i - j) / 6); // pojok kiri atas gosong
  // asap tipis di bawah plafon (tersisa sesudah dipadamkan)
  p.dither(0, 4, 160, 4, '#d9d2c8', (i, j) => (4 - j) / 4 * 0.35);
  // rak hangus: tiang & papan menghitam, bibir papan gosong, kotak gosong
  p.rect(47, 5, 2, 19, '#4a3b30').rect(75, 5, 2, 19, '#4a3b30');
  p.rect(46, 12, 32, 2, '#2a211e').rect(46, 21, 32, 2, '#2a211e');
  for (let x = 46; x < 78; x += 3) p.set(x, 11, '#2a211e').set(x + 1, 20, '#2a211e');
  const kotak = (x: number, y: number, w: number, h: number, c: string) => { p.rect(x, y, w, h, c); p.rect(x, y, w, 2, HANGUS); p.dither(x, y + 2, w, 2, HANGUS, 0.6); p.set(x + 1, y + 2, '#2a211e'); };
  kotak(50, 6, 8, 6, '#8d7663'); kotak(60, 8, 6, 4, '#7e6c5d'); kotak(67, 5, 7, 7, '#978269');
  kotak(50, 16, 5, 5, '#908a82'); kotak(57, 17, 9, 4, '#806a58'); p.bulat(70, 18.5, 2.5, '#8c7b6b').bulat(70, 18.5, 1, '#6b5a4c');
  // APAR merah di dinding
  p.rect(5, 9, 10, 1, '#8c8c8c');
  p.kartu(7, 6, 6, 14, '#d32f2f', '#9e1f1f');
  p.rect(8, 11, 4, 3, '#fff1e2').rect(8, 8, 1, 10, '#ef9a9a');
  p.rect(8, 3, 3, 3, '#33363f').rect(11, 4, 3, 1, '#33363f');
  // papan nama toko di dinding (T-054 Fix 1: pindah dari atas pintu supaya pemilik di ambang pintu tidak menutupinya)
  p.kartu(20, 4, 21, 15, '#ff9000', '#9a4f00');
  // huruf 5 x 7 sel halus (T-055): 'TOKO' 23 sel halus lebar, dua baris dalam papan 21 x 15 sel
  p.teksHalus(24.5, 6, 'TOKO', TINTA);
  p.teksHalus(24.5, 11.5, 'KAIN', TINTA);
  p.set(39, 5, '#5f4c3e').set(38, 5, '#5f4c3e').set(39, 6, '#5f4c3e'); // sudut papan terkena jelaga
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
  // gulungan pintu rolling (bilah besi, sisi kiri ikut berjelaga)
  p.rect(84, 2, 52, 6, '#b8b8b8');
  for (let y = 2.5; y < 8; y += 1) p.rect(84, y, 52, 0.5, '#9a9a9a');
  p.rect(84, 7, 52, 1, '#6f6f6f');
  p.dither(84, 2, 10, 6, '#6f5a49', (i) => (10 - i) / 12);
  // lantai keramik
  p.rect(0, 25, 160, 95, '#e9dfcb');
  for (let y = 30; y < 120; y += 6) p.rect(0, y, 160, 0.5, '#d6c6a6');
  for (let x = 0; x < 160; x += 10) p.rect(x, 25, 0.5, 95, '#ddd0b4');
  p.rect(0, 23, 160, 2, '#dccaa6');
  // lemari kiri + gulungan kain di atasnya (sebagian gosong)
  p.rect(2, 84, 34, 2, '#d4c3a2');
  p.rect(3, 56, 28, 28, '#d2ab7c').rect(2, 54, 30, 3, '#b98f60');
  p.kartu(5, 60, 24, 10, '#c69d6e', '#a97b50').kartu(5, 71, 24, 10, '#c69d6e', '#a97b50');
  p.rect(14, 64, 6, 2, '#9c6b3f').rect(14, 75, 6, 2, '#9c6b3f');
  const gulung = (x: number, y: number, w: number, c: string, tua: string, gosong: boolean) => {
    p.kotakTangga(x, y, w - 1, 5, c, 2);
    p.rect(x + 1, y + 4.5, w - 3, 0.5, tua).rect(x + 2, y + 0.5, w - 6, 0.5, '#ffffff');
    p.bulat(x + w - 2, y + 2.5, 2.6, tua).bulat(x + w - 2, y + 2.5, 1.8, c).bulat(x + w - 2, y + 2.5, 0.7, '#f3e6cc');
    if (gosong) p.rect(x, y, 3, 5, HANGUS).set(x + 3, y + 1, HANGUS).set(x + 3, y + 3, HANGUS).set(x + 4, y + 2, JELAGA);
  };
  gulung(4, 49, 26, '#dcb0a6', '#c29188', false);
  gulung(6, 44, 22, '#aec8da', '#8fb0c6', true);
  gulung(8, 39, 18, '#e7d59a', '#cfba78', true);
  // tumpukan kain hangus di lantai depan lemari (sudah dingin): gundukan hitam + abu
  p.kotakTangga(2, 86, 18, 5, '#2a211e').kotakTangga(4, 84, 12, 3, HANGUS);
  p.rect(5, 85, 3, 1, '#7a5a48').rect(12, 88, 4, 1, '#5f4c3e').set(8, 89, '#8d7663').set(16, 87, '#8d7663');
  p.dither(1, 91, 22, 1, '#a59c90', 0.5);
  // genangan air bekas pemadaman (biru pucat, kilap), di lantai kiri dan di bawah meja
  const genangan = (x: number, y: number, w: number) => {
    p.kotakTangga(x, y, w, 4, '#aec8da').rect(x + 1, y + 1, w - 2, 2, '#c3d8e6');
    p.rect(x + 2, y + 1, Math.max(2, Math.floor(w / 3)), 1, '#eef6fa');
  };
  genangan(6, 95, 22); genangan(20, 101, 10);
  // meja panjang tampak atas-depan (sama dengan m03)
  p.rect(32, 113, 128, 3, '#d4c3a2');
  p.rect(37, 112, 4, 7, '#9c6b3f').rect(151, 112, 4, 7, '#9c6b3f');
  for (let y = 24; y < 110; y++) {
    const kiri = Math.round(38.5 - ((y - 24) / 86) * 6);
    p.rect(kiri, y, 160 - kiri, 1, '#e3c49b');
    p.set(kiri, y, '#eed7b5').set(kiri + 1, y, '#eed7b5');
  }
  p.rect(38, 24, 122, 2, '#d3b083');
  p.rect(37, 56, 123, 0.5, '#d4b286').rect(36, 90, 124, 0.5, '#d4b286');
  p.dither(40, 27, 118, 82, '#dcba8d', 0.05);
  // tepi belakang meja ikut berjelaga di bawah rak
  p.dither(38, 24, 44, 3, HANGUS, (i) => Math.max(0, 0.7 - Math.abs(i - 22) / 30));
  p.rect(32, 110, 128, 3, '#c3976a').rect(32, 110, 128, 0.5, '#a97b50').rect(32, 112.5, 128, 0.5, '#a97b50');
  // genangan di lantai depan meja (di atas bayangan meja)
  p.kotakTangga(60, 115, 18, 4, '#aec8da').rect(61, 116, 16, 2, '#c3d8e6').rect(62, 116, 5, 1, '#eef6fa');
  p.kotakTangga(104, 116, 12, 3, '#aec8da').rect(106, 117, 3, 1, '#eef6fa');
  return p;
}

/** Lampu gantung 10 x 17 sel (40 x 68 dunia). */
export function lampuA01(): Piksel {
  const p = new Piksel(10, 17, null, 2);
  p.rect(5, 0, 1, 8, '#5f5f5f');
  p.bulat(5, 13, 4.5, '#fff1c2');
  p.rect(2, 8, 7, 1, '#33363f').rect(1, 9, 9, 2, '#33363f').rect(1, 10, 9, 1, '#5f5f5f');
  p.rect(4, 11, 3, 2, '#fff9e8');
  return p;
}

/** Tumpukan tiga gulungan kain di meja, 33 x 21 sel (132 x 84 dunia); yang paling atas gosong di ujungnya. */
export function kainA01(): Piksel {
  const p = new Piksel(33, 21, null, 2);
  p.rect(2, 19, 30, 2, '#cfb085');
  const rol = (x: number, y: number, w: number, c: string, tua: string, terang: string, gosong: boolean) => {
    p.kotakTangga(x, y, w - 2, 7, c, 2);
    p.rect(x + 2, y + 1, w - 7, 0.5, terang).rect(x + 1, y + 6, w - 4, 0.5, tua);
    p.bulat(x + w - 2.5, y + 3.5, 3.5, tua).bulat(x + w - 2.5, y + 3.5, 2.6, c).bulat(x + w - 2.5, y + 3.5, 1, '#f3e6cc');
    if (gosong) p.kotakTangga(x, y, 4, 7, HANGUS).set(x + 4, y + 1, HANGUS).set(x + 4, y + 4, HANGUS).set(x + 5, y + 2, JELAGA).set(x + 4, y + 3, JELAGA);
  };
  rol(1, 13, 31, '#dcb0a6', '#c29188', '#ead0c9', false);
  rol(3, 7, 27, '#aec8da', '#8fb0c6', '#d3e3ee', true);
  rol(5, 1, 24, '#e7d59a', '#cfba78', '#f3e8c1', true);
  // T-054 Fix 1: gulungan atas hangus sampai separuh (hitam, bertepi cokelat) + noda gosong di gulungan tengah
  p.kotakTangga(5, 1, 12, 7, '#2a211e').rect(17, 2, 1, 5, HANGUS).set(18, 3, JELAGA).set(18, 5, JELAGA).set(17, 1, HANGUS);
  p.rect(7, 2, 3, 1, '#5f4c3e').set(12, 5, '#5f4c3e');
  p.rect(14, 8, 3, 2, HANGUS).set(17, 9, JELAGA);
  return p;
}

// ------------------------------------------------------------------ lima kartu pilihan, 24 x 22 sel (96 x 88 dunia)

export type JenisKartuA01 = 'foto' | 'lapor' | 'perbaiki' | 'buang' | 'buka';

/** Kartu kosong: kertas krem bertangga, garis tinta, bayangan 1 sel di meja. */
function kartuDasar(): Piksel {
  const p = new Piksel(24, 22, null, 2);
  p.kotakTangga(1, 2, 23, 20, '#c3a27a');
  p.kartu(0, 0, 23, 20, '#fff9f5', TINTA);
  p.rect(1.5, 17.5, 20, 1, '#f3ded3');
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
    for (const y of [8, 9.5, 11, 12.5, 14]) p.rect(7, y, y === 14 ? 4 : 7, 0.5, '#a4a4a4');
    p.bulat(16.5, 13.5, 3.6, '#ff9000').bulat(16.5, 13.5, 2.6, '#ff9000');
    p.pola(14, 12, ['....#', '#..#.', '.##..'], { '#': '#ffffff' });
  } else if (jenis === 'perbaiki') {
    // obeng (garis halus): batang besi miring, gagang jingga bertepi gelap + kilap, dua sekrup kecil
    p.garis(4.5, 16.5, 12, 9, '#5f5f5f', 3).garis(4.5, 16.5, 12, 9, '#a4a4a4', 2);
    p.garis(12, 9, 17, 4, '#9a4f00', 7).garis(12, 9, 17, 4, '#ff9000', 5).garis(13, 7.5, 16, 4.5, '#ffd9a8', 1);
    p.garis(11.5, 9.5, 12.5, 8.5, '#33363f', 5);
    for (const [x, y] of [[15.5, 14], [18.5, 16.5]] as const) { p.bulat(x, y, 1.3, '#33363f').bulat(x, y, 0.8, '#a4a4a4'); p.titik(x * 2 - 1, y * 2, '#33363f').titik(x * 2, y * 2, '#33363f'); }
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
    p.teksHalus(5.5, 9, 'BUKA', '#5b2533');
  }
  return p;
}
