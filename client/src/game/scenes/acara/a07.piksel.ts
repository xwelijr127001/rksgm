/**
 * T-061b: seni PIKSEL misi acara 07 "Tiga Polis, Satu Banjir" (gaya kasus 1: k = 2, 1 sel = 4 dunia).
 * Netral seperti versi vektor: ketiga binder SERAGAM (bentuk, ukuran, warna abu batu di luar warna stiker; beda hanya huruf),
 * ketiga kartu polis identik (beda huruf), laporan tanpa tulisan & tanpa tanggal. Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';
import { AIR, KAYU, KAYU_GELAP, KREM, TINTA, bayangan, teksBesar } from './piksel-umum';

const BATU = '#5f6b73';
const BATU_TUA = '#46515a';
const BATU_MUDA = '#7d8a93';

/** Binder berdiri 20 x 25 sel (80 x 100): punggung bercincin, sampul abu batu, jendela label putih berhuruf. */
export function binderA07(huruf: string): Piksel {
  const p = new Piksel(20, 25, null, 2);
  bayangan(p, 10, 24.5, 8.5);
  p.kartu(2.5, 0.5, 15, 23.5, BATU, TINTA);
  p.rect(3, 1, 3.5, 22.5, BATU_TUA).rect(6.5, 1, 0.5, 22.5, TINTA);
  for (const y of [4, 11.5, 19]) p.kartu(3.5, y, 2.5, 2, '#c5ccd0', TINTA);
  p.rect(7.5, 1, 9.5, 0.5, BATU_MUDA);
  p.kartu(8.5, 5, 7.5, 8, '#ffffff', TINTA);
  teksBesar(p, 10.75, 7.25, huruf, TINTA);
  p.rect(8.5, 16, 7.5, 0.5, BATU_MUDA).rect(8.5, 17.5, 5.5, 0.5, BATU_MUDA);
  p.rect(2.5, 23.5, 15, 0.5, BATU_TUA);
  return p;
}

/** Kartu polis kecil di penyangga kayu, 18 x 16 sel (72 x 64). Beda hanya huruf. */
export function kartuA07(huruf: string): Piksel {
  const p = new Piksel(18, 16, null, 2);
  bayangan(p, 9, 15.5, 7.5);
  p.garis(5.5, 10, 3.5, 15, TINTA, 3).garis(5.5, 10, 3.5, 15, KAYU, 1).garis(12.5, 10, 14.5, 15, TINTA, 3).garis(12.5, 10, 14.5, 15, KAYU, 1);
  p.kartu(1, 1, 16, 10.5, KREM, TINTA).rect(1.5, 1.5, 15, 3, '#3f8f5a');
  p.rect(3, 6.5, 6, 0.75, '#a4a4a4').rect(3, 8.5, 4.5, 0.75, '#a4a4a4');
  p.bulat(12.75, 7.75, 2.6, TINTA).bulat(12.75, 7.75, 2.2, '#f6d25c');
  teksBesar(p, 11.5, 6, huruf, TINTA);
  return p;
}

/** Papan klip laporan kejadian tergantung di paku, 18 x 22 sel (72 x 88). Tanpa tulisan & tanpa tanggal. */
export function laporanA07(): Piksel {
  const p = new Piksel(18, 22, null, 2);
  p.kotakTangga(3.5, 5, 14, 16.5, '#00000020', 1);
  p.garis(9, 1.25, 5.5, 4, '#6f787d', 1).garis(9, 1.25, 12.5, 4, '#6f787d', 1).bulat(9, 1.25, 0.9, '#6f787d');
  p.kartu(2, 3.5, 14, 17, KAYU, TINTA);
  p.rect(3.5, 5.5, 11, 13.5, '#ffffff');
  p.kartu(6, 2.5, 6, 3, '#9aa3a8', TINTA);
  p.rect(4.5, 7, 7.5, 2, '#c9a27a');
  for (const [y, w] of [[11, 9], [13, 7.5], [15, 9], [17, 5.5]] as const) p.rect(4.5, y, w, 0.75, '#8c8c8c');
  return p;
}

/** Tumpukan kardus basah di genangan, 32 x 25 sel (128 x 100): noda air gelap naik dari bawah, riak di sekeliling. */
export function kardusA07(): Piksel {
  const p = new Piksel(32, 25, null, 2);
  // riak genangan
  for (let i = -15; i < 15; i += 0.5) { const t = Math.sqrt(Math.max(0, 1 - (i / 15) ** 2)); p.rect(16 + i, 22.5 + t * 1.5, 0.5, 0.5, '#ffffffb0').rect(16 + i, 22.5 - t * 1.5, 0.5, 0.5, '#ffffff80'); }
  p.dither(2, 21.5, 28, 2.5, AIR, 0.5);
  const kotak = (x: number, y: number, w: number, h: number, noda: number) => {
    p.kartu(x, y, w, h, '#c99a62', '#8a6236');
    p.rect(x + 0.5, y + 0.5, w - 1, 0.5, '#e0bb88').rect(x + w / 2 - 0.75, y, 1.5, h * 0.35, '#e8d2a9');
    // noda basah bergelombang dari bawah setinggi `noda` sel
    for (let i = x + 0.5; i < x + w - 0.5; i += 0.5) {
      const top = y + h - noda + Math.round(Math.sin(i * 1.3) * 1) * 0.5;
      p.rect(i, top, 0.5, y + h - 0.5 - top, '#8a6a4a').rect(i, top, 0.5, 0.5, '#6f5236');
    }
  };
  kotak(2, 10, 13, 12.5, 6);
  kotak(15.5, 12, 14, 10.5, 5);
  kotak(7, 1, 12, 9.5, 2.5);
  p.rect(9, 3, 4, 0.5, KAYU_GELAP).rect(19, 15, 5, 0.5, KAYU_GELAP);
  return p;
}
