/**
 * T-061b: seni PIKSEL misi acara 05 "Kerusakan Sama, Nasib Beda" (gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia).
 * Latar: dinding kantor Episode 2 (./a05.gen.ts, dunia y 0..148) + meja kerja besar tampak atas (y 148..430) dengan rak stempel
 * di tepi belakang dan tiga alas kerja, lalu lantai ubin. Geometri sama dengan latar m05 (rak x 48..568 y 124..154, meja y 148).
 * Map kasus, kartu polis, dan stempel SERAGAM antar kolom (beda hanya huruf / warna tinta & simbol stempel). Murni.
 */
import { Piksel } from '../../art/piksel';
import { DINDING_A05 } from './a05.gen';
import { KAYU, KAYU_GELAP, KAYU_TUA, KREM, TINTA, bayangan, teksBesar } from './piksel-umum';
import { pikselDariRle } from './rle';

/** Alas kerja [x, y, w, h] dalam dunia (sama dengan a05.ts). */
export type AlasA05 = readonly [number, number, number, number];

export function latarA05(alas: readonly AlasA05[]): Piksel {
  const p = new Piksel(160, 120, null, 2);
  p.tempel(pikselDariRle(DINDING_A05), 0, 0);
  // meja besar tampak atas, y 37..107.5 sel (dunia 148..430): kayu hangat, serat, tepi belakang lebih gelap
  p.rect(0, 37, 160, 70.5, '#d9b27f');
  p.dither(0, 37, 160, 70.5, '#cfa572', 0.08);
  for (const y of [49.5, 66, 83.5, 99]) for (let x = 0; x < 160; x += 0.5) if (Math.sin(x * 0.35 + y) > -0.6) p.rect(x, y + Math.round(Math.sin(x * 0.12 + y) * 1) * 0.5, 0.5, 0.5, '#c99d68');
  p.rect(0, 37, 160, 2.5, '#b98a57').rect(0, 39.5, 160, 0.5, '#e6c595');
  // rak stempel di tepi belakang meja (dunia x 48..568, y 124..154)
  p.rect(12, 31, 130, 3.5, '#c69a66').rect(12, 31, 130, 0.5, '#e0bb88');
  p.rect(12, 34, 130, 4.5, KAYU_TUA).rect(12, 34, 130, 0.5, '#7a5232').rect(12, 38, 130, 0.5, KAYU_GELAP);
  for (const x of [13, 140]) p.rect(x, 33, 1, 5.5, KAYU_GELAP);
  // tiga alas kerja (hijau lembut bertepi, jahitan terang)
  for (const [x, y, w, h] of alas) {
    const X = x / 4, Y = y / 4, W = w / 4, H = h / 4;
    p.kotakTangga(X + 0.5, Y + 0.5, W, H, '#b88f5e', 1);
    p.kartu(X, Y, W, H, '#a9c9a7', '#5f8a64');
    for (let i = X + 1.5; i < X + W - 1.5; i += 1) p.rect(i, Y + 1, 0.5, 0.5, '#cfe3cc').rect(i, Y + H - 1.5, 0.5, 0.5, '#cfe3cc');
  }
  // tepi depan meja + lantai ubin (dunia 430..480)
  p.rect(0, 105, 160, 2.5, '#b98a57').rect(0, 107, 160, 0.5, '#8e6a42');
  p.rect(0, 107.5, 160, 12.5, '#ead9c6');
  for (let x = 0; x < 160; x += 16) p.garis(x, 107.5, x + (x - 80) * 0.15, 120, '#d6c2ab', 1);
  p.rect(0, 113, 160, 0.5, '#d6c2ab');
  return p;
}

const SIMBOL: Record<'cek' | 'silang' | 'tanya', readonly string[]> = {
  cek: ['........##', '.......##.', '##....##..', '.##..##...', '..####....', '...##.....'],
  silang: ['##....##', '.##..##.', '..####..', '..####..', '.##..##.', '##....##'],
  tanya: ['.####.', '##..##', '...##.', '..##..', '......', '..##..'],
};

/** Stempel kayu 21 x 26 sel (84 x 104): kenop & leher kayu, badan warna tinta bersimbol putih, alas karet + jejak tinta. */
export function stempelA05(warna: string, simbol: 'cek' | 'silang' | 'tanya'): Piksel {
  const p = new Piksel(21, 26, null, 2);
  bayangan(p, 10.5, 25.5, 9);
  // kenop
  p.bulat(10.5, 4.5, 4.4, KAYU_GELAP).bulat(10.5, 4.5, 3.9, KAYU).bulat(9, 3, 1.2, '#e8c79c');
  p.rect(8.5, 8, 4, 4, KAYU_GELAP).rect(9, 8, 3, 4, KAYU_TUA);
  // badan berwarna tinta
  p.kartu(2.5, 11.5, 16, 9, warna, TINTA);
  p.rect(3, 12, 15, 0.5, '#ffffff55');
  const g = SIMBOL[simbol];
  p.polaHalus(10.5 - g[0]!.length / 4, 13.5, g, { '#': '#ffffff' });
  // alas karet & bantalan
  p.kartu(1.5, 20.5, 18, 3, '#33363f', TINTA);
  p.rect(2.5, 23, 16, 1, warna);
  return p;
}

/** Map kasus 30 x 22 sel (120 x 88): sampul kuning bertab, foto mobil berpenyok dijepit, kartu polis kecil, huruf kasus. */
export function mapA05(huruf: string): Piksel {
  const p = new Piksel(30, 22, null, 2);
  bayangan(p, 15, 21.5, 13);
  p.kartu(2.5, 0.5, 11, 3.5, '#e2ad3e', TINTA);
  p.kartu(0.5, 2.5, 29, 18.5, '#f3cb63', TINTA);
  p.rect(1.5, 4.5, 27, 0.5, '#e2ad3e');
  // foto (dijepit klip besi)
  p.kartu(2.5, 6, 13, 11, '#ffffff', TINTA);
  p.rect(3.5, 7, 11, 6, '#cfe8f5').rect(3.5, 11.5, 11, 4.5, '#b8c4bb');
  p.kotakTangga(4.5, 10, 8.5, 2.5, '#2a8c8c', 1).rect(6.5, 9, 4, 1.5, '#2a8c8c');
  p.bulat(6, 12.5, 0.9, TINTA).bulat(11.5, 12.5, 0.9, TINTA);
  p.rect(4, 9.5, 0.5, 1, '#ff9000').rect(4.5, 9, 0.5, 0.5, '#ff9000');
  p.rect(7, 4.5, 1, 3, '#a4a4a4');
  // kartu polis kecil
  p.kartu(17.5, 6, 10, 7.5, KREM, TINTA).rect(18, 6.5, 9, 2, '#3f8f5a');
  p.rect(18.5, 10, 6, 0.5, '#a4a4a4').rect(18.5, 11.5, 4.5, 0.5, '#a4a4a4');
  // huruf kasus
  p.kartu(19.5, 14.5, 8, 5.5, '#ffffff', TINTA);
  teksBesar(p, 22.5, 15.5, huruf, TINTA);
  return p;
}

/** Kartu polis kecil 16 x 12 sel (64 x 48), tajuk hijau, lencana huruf persegi. Tegak: kemiringan vektor lama (3-4 derajat)
 * membuat huruf piksel pecah, jadi `miring` hanya menggeser kartu 1 sel halus ke kiri/kanan supaya ketiganya tidak kaku. */
export function kartuA05(huruf: string, miring: number): Piksel {
  const p = new Piksel(16, 12, null, 2);
  bayangan(p, 8, 11.5, 7);
  const k = new Piksel(15, 10, null, 2);
  k.kartu(0, 0, 15, 10, KREM, TINTA).rect(0.5, 0.5, 14, 3, '#3f8f5a');
  k.rect(1.5, 1.25, 5, 0.75, '#cfe3cc'); // garis judul tajuk (huruf piksel 'POLIS' tidak muat di kartu 64 dunia)
  k.rect(1.5, 5, 6.5, 0.5, '#a4a4a4').rect(1.5, 6.5, 7.5, 0.5, '#a4a4a4').rect(1.5, 8, 5, 0.5, '#a4a4a4');
  k.kartu(9.5, 4, 4.5, 5, '#fff1c2', TINTA);
  teksBesar(k, 10.5, 4.75, huruf, TINTA);
  p.tempel(k, miring < 0 ? 0 : 0.5, 1);
  return p;
}
