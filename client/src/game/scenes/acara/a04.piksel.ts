/**
 * T-061a: seni PIKSEL misi acara 04 "Peti yang Tak Sampai" (gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia).
 * Isi gambar SAMA dengan versi vektor (misi 6): 21 peti dengan kemasan rusak #3 penyok kanan, #9 basah, #15 terbuka, #20 penyok
 * kiri & basah; papan foto berisi enam foto sesuai tabel; daftar kiriman; bukti terima bercap; empat papan aksi SERAGAM.
 * Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { AIR, KAYU, KAYU_GELAP, KAYU_TUA, KREM, TINTA, bayangan, peti, teksBesar, type RusakPeti } from './piksel-umum';

const KOLOM = 7;
const TINGKAT = 3;
const KEMASAN_RUSAK: Record<number, RusakPeti> = {
  3: { remuk: 'kanan' },
  9: { basah: true },
  15: { terbuka: true },
  20: { remuk: 'kiri', basah: true },
};

/** 21 peti, 7 kolom x 3 tingkat, nomor naik dari bawah ke atas per kolom; 64 x 29 sel (256 x 116). */
export function tumpukanA04(): Piksel {
  const p = new Piksel(64, 29, null, 2);
  bayangan(p, 32, 28.5, 31);
  // tingkat bawah dulu (tetesan air dari atas tetap terlihat)
  for (let t = 0; t < TINGKAT; t++) for (let k = 0; k < KOLOM; k++) {
    const n = k * TINGKAT + t + 1;
    peti(p, 0.5 + k * 9, 5 + (TINGKAT - 1 - t) * 7.5, 8.5, 7, String(n), KEMASAN_RUSAK[n] ?? {});
  }
  return p;
}

/** Foto kecil 7 x 8 sel: bingkai putih, langit + lantai, isi = gambar peti mini. */
function fotoKecil(p: Piksel, x: number, y: number, isi: (x: number, y: number) => void): void {
  p.kartu(x, y, 7, 8, '#ffffff', TINTA);
  p.rect(x + 0.5, y + 0.5, 6, 5, '#cfe8f5').rect(x + 0.5, y + 4, 6, 1.5, '#c9c4b8');
  isi(x + 0.5, y + 0.5);
  p.bulat(x + 3.5, y + 0.25, 0.6, '#f6d25c');
}

/** Papan gabus 26 x 19 sel (104 x 76) berisi ENAM foto penerimaan (sesuai tabel), dua baris. */
export function fotoEnamA04(): Piksel {
  const p = new Piksel(26, 19, null, 2);
  bayangan(p, 13, 18.5, 12);
  p.kartu(0.5, 0.5, 25, 17.5, '#d9b88a', TINTA).rect(1.5, 1.5, 23, 15.5, '#c9a06c');
  for (let i = 0; i < 30; i++) p.rect(2 + ((i * 7) % 22), 2 + ((i * 5) % 14), 0.5, 0.5, '#b38a58');
  const kotak = (x: number, y: number, w: number, h: number, c = KAYU) => p.rect(x, y, w, h, c).rect(x, y, w, 0.5, KAYU_GELAP);
  // baris atas: tumpukan | penyok kanan | basah
  fotoKecil(p, 2, 1.5, (x, y) => { kotak(x + 0.5, y + 2.5, 2.5, 2.5); kotak(x + 3, y + 2.5, 2.5, 2.5, KAYU_TUA); kotak(x + 1.75, y + 0.5, 2.5, 2); });
  fotoKecil(p, 9.5, 1.5, (x, y) => { kotak(x + 1, y + 1, 4, 4); p.rect(x + 3.5, y + 1, 1.5, 1.5, '#cfe8f5').garis(x + 3.5, y + 1, x + 5, y + 2.5, KAYU_GELAP, 1); });
  fotoKecil(p, 17, 1.5, (x, y) => { kotak(x + 1, y + 1, 4, 4); p.rect(x + 1, y + 3, 4, 2, AIR).rect(x + 2, y + 0.5, 0.5, 0.5, AIR).rect(x + 4, y + 0.5, 0.5, 0.5, AIR); });
  // baris bawah: terbuka | penyok kiri | basah bawah
  fotoKecil(p, 2, 9.5, (x, y) => { kotak(x + 1, y + 2, 4, 3); p.rect(x + 1.5, y + 2, 3, 0.5, '#3f3226').garis(x + 0.5, y + 2, x + 1.5, y + 0.5, KAYU_GELAP, 1).rect(x + 1.5, y + 0.5, 2, 0.5, KAYU_TUA); });
  fotoKecil(p, 9.5, 9.5, (x, y) => { kotak(x + 1, y + 1, 4, 4); p.rect(x + 1, y + 1, 1.5, 1.5, '#cfe8f5').garis(x + 2.5, y + 1, x + 1, y + 2.5, KAYU_GELAP, 1); });
  fotoKecil(p, 17, 9.5, (x, y) => { kotak(x + 1, y + 1, 4, 4); p.rect(x + 1, y + 4, 4, 1, AIR).rect(x + 0.5, y + 5, 5, 0.5, AIR); });
  return p;
}

/** Papan klip daftar kiriman 18 x 24 sel (72 x 96): kertas, ikon kapal & peti warna-warni, baris daftar. */
export function papanKirimanA04(): Piksel {
  const p = new Piksel(18, 24, null, 2);
  bayangan(p, 9, 23.5, 7);
  p.kartu(1, 2, 16, 21, KAYU, TINTA);
  p.rect(2.5, 4, 13, 17.5, '#ffffff');
  p.kartu(5.5, 0.5, 7, 3.5, '#a4a4a4', TINTA);
  // peti di atas kapal
  p.rect(4.5, 6, 2, 2, '#ff9000').rect(7, 6, 2, 2, '#2a8c8c').rect(9.5, 6.5, 1.5, 1.5, '#d9a23a');
  for (let y = 8; y < 10.5; y += 0.5) { const s = (y - 8) * 0.8; p.rect(3.5 + s, y, 10 - s * 2, 0.5, '#2f6f9f'); }
  for (const y of [12.5, 15, 17.5]) p.rect(3.5, y, y === 17.5 ? 6.5 : 9.5, 0.75, '#7a7a7a');
  return p;
}

/** Lembar bukti terima 18 x 23 sel (72 x 92): judul teal, ikon peti, baris, cap bulat ungu, sudut terlipat. */
export function lembarTerimaA04(): Piksel {
  const p = new Piksel(18, 23, null, 2);
  bayangan(p, 9, 22.5, 7.5);
  p.kartu(1, 1, 16, 20.5, '#ffffff', TINTA);
  for (let i = 0; i < 4; i += 0.5) p.rect(13 + i, 1, 4 - i, 0.5, null).rect(13, 1 + i, i + 0.5, 0.5, '#ecd5cb');
  p.garis(13, 1, 17, 5, TINTA, 1);
  p.rect(3, 3, 8, 2.5, '#2a8c8c');
  p.kartu(3, 7.5, 5.5, 4.5, KAYU, KAYU_GELAP).rect(3.5, 9.5, 4.5, 0.5, KAYU_TUA);
  p.rect(10, 8.5, 4.5, 0.75, '#a4a4a4').rect(10, 10.5, 3.5, 0.75, '#a4a4a4');
  p.rect(3, 14.5, 11, 0.75, '#a4a4a4').rect(3, 16.5, 6.5, 0.75, '#a4a4a4');
  // cap bulat ungu (cincin)
  p.bulat(13, 17.5, 2.6, '#7b5ea7').bulat(13, 17.5, 2.1, '#ffffff').bulat(13, 17.5, 1.3, '#7b5ea7').bulat(13, 17.5, 0.8, '#ffffff');
  return p;
}

export type IkonAksiA04 = 'catat' | 'semua' | 'ttd' | 'separuh';

/** Papan aksi berdiri SERAGAM 21 x 21 sel (84 x 84): papan krem bertepi tinta di tiang besi; ikon di bidang 19 x 14 sel. */
export function papanAksiA04(ikon: IkonAksiA04): Piksel {
  const p = new Piksel(21, 21, null, 2);
  bayangan(p, 10.5, 20.5, 6);
  p.rect(5, 18.5, 11, 1.5, '#5f5f5f').rect(5, 18.5, 11, 0.5, TINTA);
  p.kartu(9.5, 14, 2, 5, '#a4a4a4', TINTA);
  p.kartu(1, 1, 19, 14, KREM, TINTA);
  p.rect(1.5, 13.5, 18, 1, '#f3ded3');
  if (ikon === 'catat') {
    // papan klip + kamera
    p.kartu(3, 3, 7, 10, KAYU, TINTA).rect(4, 4.5, 5, 7.5, '#ffffff').kartu(5, 2.5, 3, 1.5, '#a4a4a4', TINTA);
    for (const y of [6, 7.5, 9]) p.rect(4.5, y, y === 9 ? 2.5 : 3.5, 0.5, '#7a7a7a');
    p.kartu(10.5, 6.5, 8, 6, '#a4a4a4', TINTA).rect(12, 5.5, 3, 1, '#a4a4a4');
    p.bulat(14.5, 9.5, 2, TINTA).bulat(14.5, 9.5, 1.3, '#5f8db0').rect(17, 7.5, 0.5, 0.5, '#f6d25c');
  } else if (ikon === 'semua') {
    // tumpukan koin + kantong uang "Rp"
    for (const [x, y] of [[3, 11], [3, 9.5], [3.5, 8]] as const) p.kartu(x, y, 5.5, 1.75, '#f6d25c', TINTA);
    p.kotakTangga(9, 5, 9, 8, '#fff1c2', 2);
    p.rect(11, 3, 5, 2, '#fff1c2').rect(11, 4.5, 5, 0.5, '#9a4f00');
    teksBesar(p, 10.5, 7.5, 'RP', '#9a4f00');
  } else if (ikon === 'ttd') {
    // lembar bergaris dengan tanda tangan biru + pena
    p.kartu(3, 2.5, 9, 11, '#ffffff', TINTA).rect(4.5, 4, 4.5, 1.5, '#2a8c8c');
    p.rect(4.5, 7, 6, 0.5, '#a4a4a4').rect(4.5, 8.5, 5, 0.5, '#a4a4a4').rect(4.5, 12, 6, 0.5, '#7a7a7a');
    p.polaHalus(4.5, 10, ['.#...#..#...', '#.#.#.#.#.#.', '...#...#..#.'], { '#': '#2f6f9f' });
    p.garis(17, 4, 12.5, 11.5, '#2f6f9f', 2).garis(12.5, 11.5, 12, 12.5, '#fff1c2', 1).rect(16.5, 3.5, 1.5, 1, '#5f5f5f');
  } else {
    // papan klip tanpa kamera: peti + tanda kurang (hitungan kurang)
    p.kartu(6, 3, 9, 10.5, KAYU, TINTA).rect(7, 4.5, 7, 8, '#ffffff').kartu(8.5, 2.5, 4, 1.5, '#a4a4a4', TINTA);
    p.rect(7.5, 5.5, 5, 0.5, '#7a7a7a').rect(7.5, 7, 3.5, 0.5, '#7a7a7a');
    p.kartu(7.5, 8.5, 3, 3, KAYU, KAYU_GELAP).rect(8, 10, 2, 0.5, KAYU_TUA);
    p.rect(11.5, 9.75, 2, 0.75, TINTA);
  }
  return p;
}
