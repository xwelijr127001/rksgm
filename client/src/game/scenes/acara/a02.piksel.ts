/**
 * T-061a: seni PIKSEL misi acara 02 "Jepret Dulu, Baru Angkut" (gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia).
 * Ukuran tiap gambar = ukuran ArtRef lama dibulatkan ke sel (tata letak & area sentuh di a02.ts tidak berubah).
 * Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { KREM, TINTA, bayangan, peti, teksBesar } from './piksel-umum';

/** Spanduk promo toko sebelah, 33 x 14 sel (132 x 56): tali, kain ungu, lingkaran kuning "%", tulisan PROMO. */
export function spandukA02(): Piksel {
  const p = new Piksel(33, 14, null, 2);
  p.garis(0.5, 1, 4, 3.5, '#5f5f5f', 1).garis(32.5, 1, 29, 3.5, '#5f5f5f', 1).garis(0.5, 13, 4, 11, '#5f5f5f', 1).garis(32.5, 13, 29, 11, '#5f5f5f', 1);
  p.kartu(3, 2.5, 27, 9.5, '#7b5ea7', TINTA);
  p.rect(3.5, 10.5, 26, 1, '#634a8c');
  p.rect(3.5, 3, 26, 0.5, '#9a80c4');
  p.bulat(8, 7, 3.2, TINTA).bulat(8, 7, 2.7, '#f6d25c');
  p.polaHalus(6.5, 5, ['#..#', '..#.', '.#..', '#..#'], { '#': TINTA });
  teksBesar(p, 12.5, 4.5, 'PROMO', KREM);
  // ring tali
  for (const [x, y] of [[3.5, 3], [29, 3], [3.5, 11], [29, 11]] as const) p.rect(x, y, 0.5, 0.5, '#c0c0c0');
  return p;
}

/** Gerobak es di trotoar, 25 x 23 sel (100 x 92): payung biru-putih, kotak pendingin putih, gelas es, roda. */
export function gerobakA02(): Piksel {
  const p = new Piksel(25, 23, null, 2);
  bayangan(p, 12.5, 22, 10);
  p.rect(12, 6, 1, 7, '#5f5f5f');
  // payung kubah bergaris
  for (let y = 1; y < 7; y += 0.5) {
    const half = Math.min(11.5, 3 + (y - 1) * 2.2);
    for (let x = 12.5 - half; x < 12.5 + half; x += 0.5) {
      const pita = Math.floor((x - (12.5 - half)) / (half / 3)) % 2 === 0;
      p.rect(x, y, 0.5, 0.5, y < 1.5 || y > 6 ? '#2f6f9f' : pita ? '#5aa1d6' : '#ffffff');
    }
  }
  p.rect(1, 6.5, 23, 0.5, '#245a82');
  // gelas es di atas pendingin
  p.kartu(4, 9.5, 2.5, 3, '#f4b8c6', TINTA).kartu(7.5, 10, 2.5, 2.5, '#fff1c2', TINTA).kartu(15, 9, 5, 3.5, '#d3e3ee', TINTA);
  // kotak pendingin
  p.kartu(3, 12.5, 19, 7.5, '#ffffff', TINTA);
  p.rect(3.5, 17, 18, 1.5, '#5aa1d6');
  p.bulat(12.5, 14.5, 1.3, '#f4b8c6').rect(12, 15.5, 1, 1.5, '#d9a23a');
  // pegangan & roda
  p.garis(22, 14, 24.5, 11.5, '#5f5f5f', 1);
  for (const x of [7, 18]) p.bulat(x, 20.5, 2, TINTA).bulat(x, 20.5, 1.2, '#8c8c8c').bulat(x, 20.5, 0.4, TINTA);
  return p;
}

/** Palet berisi lima peti (bawah #1-#3, atas #4 & #6), 43 x 23 sel (172 x 92). Peti #5 sudah diturunkan ke depan. */
export function tumpukanA02(): Piksel {
  const p = new Piksel(43, 23, null, 2);
  bayangan(p, 21.5, 22.5, 20);
  p.rect(1, 19.5, 41, 2, '#9c6b3f').rect(1, 19.5, 41, 0.5, '#c3976a');
  for (const x of [3, 20, 37]) p.rect(x, 21.5, 3, 1, '#6f4c2e');
  for (const [i, n] of ['1', '2', '3'].entries()) peti(p, 1.5 + i * 13.5, 10, 13, 9.5, n);
  for (const [i, n] of ['4', '6'].entries()) peti(p, 8 + i * 14, 0.5, 13, 9.5, n);
  return p;
}

/** Peti #5 penyok di SATU sisi (kanan), 20 x 18 sel (80 x 72): pojok remuk, cekungan gelap, retak, garis benturan jingga. */
export function petiPenyokA02(): Piksel {
  const p = new Piksel(20, 18, null, 2);
  bayangan(p, 10, 17.5, 9);
  peti(p, 0.5, 2, 18.5, 15, '5', { remuk: 'kanan' });
  // cekungan penyok di sisi kanan: bidang gelap + sorot putih di tepi bawah
  p.bulat(15.5, 10.5, 2.6, '#7a5232').bulat(15, 10, 1.6, '#5f4030');
  p.garis(13.5, 13, 17.5, 12, '#f3e6cc', 1);
  p.garis(16, 7.5, 17.5, 9, TINTA, 1).garis(17.5, 9, 16.5, 10.5, TINTA, 1);
  // garis benturan jingga di pojok atas
  p.garis(16, 1.5, 17.5, 0, '#ff9000', 2).garis(18.5, 2, 19.5, 0.5, '#ff9000', 2);
  return p;
}

/** Label kiriman yang diperbesar, 26 x 18 sel (104 x 72): strip kurir, nomor 5, alamat, kode batang; ekor ke peti #5 (kiri atas). */
export function labelA02(): Piksel {
  const p = new Piksel(26, 18, null, 2);
  bayangan(p, 15, 17.5, 10);
  // ekor bertangga ke kiri atas
  for (let i = 0; i < 4; i += 0.5) p.rect(0.5 + i, 0.5 + i, 4 - i * 0.5, 0.5, i === 0 ? TINTA : '#fff1e2').rect(0.5 + i, 0.5 + i, 0.5, 0.5, TINTA);
  p.kartu(3.5, 2.5, 22, 14, '#fff1e2', TINTA);
  p.rect(5, 4, 10.5, 2.5, '#ff9000');
  p.kartu(17.5, 3.5, 6.5, 5, '#ffffff', TINTA);
  teksBesar(p, 19.5, 4.5, '5', TINTA);
  p.rect(5, 8.5, 10, 0.5, '#a4a4a4').rect(5, 10, 8, 0.5, '#a4a4a4');
  // kode batang
  const pola = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 3];
  let x = 5;
  pola.forEach((n, i) => { if (i % 2 === 0) p.rect(x, 12, n * 0.5, 3, TINTA); x += n * 0.5; });
  p.kartu(19, 11, 4.5, 4, '#c69d6e', '#6f4c2e').rect(19.5, 12.5, 3.5, 0.5, '#9c6b3f');
  return p;
}

/** Ponsel di tongkat berkaki tiga, 19 x 28 sel (76 x 112): layar = petugas & kurir berswafoto. */
export function selfieA02(): Piksel {
  const p = new Piksel(19, 28, null, 2);
  bayangan(p, 9.5, 27.5, 6);
  p.rect(9, 12, 1, 14, TINTA).rect(9.5, 12, 0.5, 14, '#8c8c8c');
  p.garis(9.5, 22, 5, 27, TINTA, 1).garis(9.5, 22, 14, 27, TINTA, 1).garis(9.5, 22, 9.5, 27.5, TINTA, 1);
  p.kartu(1, 0.5, 17, 12.5, '#33363f', TINTA);
  p.rect(2, 1.5, 15, 10.5, '#fff1c2');
  // petugas (kiri): kepala kulit, rambut gelap, baju hijau
  p.rect(3, 9, 6, 3, '#3f8f5a').bulat(6, 6.5, 2.2, '#e0ac7e').rect(4, 4, 4, 1.2, '#2b2118').rect(5, 7.5, 2, 0.5, TINTA);
  // kurir (kanan): topi & baju jingga
  p.rect(10, 9, 6, 3, '#ff9000').bulat(13, 6.5, 2.2, '#c98f62').rect(11, 4, 4.5, 1.2, '#e07e00').rect(14.5, 4.5, 1.5, 0.5, '#e07e00').rect(12, 7.5, 2, 0.5, TINTA);
  p.rect(2, 1.5, 15, 0.5, '#ffffff');
  // garis kilat "jepret"
  p.rect(17.5, 1, 1, 0.5, '#f6d25c').rect(18, 4, 1, 0.5, '#f6d25c').rect(17.5, 7, 1, 0.5, '#f6d25c');
  return p;
}
