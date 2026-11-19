/**
 * T-061a: seni PIKSEL misi acara 03 "Empat Foto, Apa Tugasnya?" (gaya kasus 1: k = 2, 1 sel = 4 dunia, sel halus = 2 dunia).
 * Mobil nasabah (hatchback teal) menghadap KANAN, penyok di bemper belakang kanan (ujung kiri gambar). Empat polaroid SERAGAM
 * (bingkai, ukuran, jepitan, letak huruf); yang beda hanya isi fotonya. Murni (tanpa DOM / Phaser).
 */
import { Piksel, type Warna } from '../../art/piksel';
import { TINTA, bayangan, teksBesar, teksMini } from './piksel-umum';

const TEAL = '#2a8c8c';
const TEAL_TUA = '#1d6464';
const TEAL_MUDA = '#4fb3ad';
const KACA = '#bfe0ea';
const BESI = '#a4a4a4';
const BAN = '#26232a';

/** Mobil penyok 75 x 33 sel (300 x 132), menghadap kanan; penyok di bemper belakang (kiri). */
export function mobilA03(): Piksel {
  const p = new Piksel(75, 33, null, 2);
  bayangan(p, 37.5, 31.5, 34);
  // kabin (atap & kaca) trapesium
  for (let y = 4; y < 14; y += 0.5) {
    const t = (y - 4) / 10;
    const x0 = 18 - t * 6, x1 = 50 + t * 9;
    p.rect(x0, y, x1 - x0, 0.5, y < 4.5 ? TINTA : TEAL);
    p.rect(x0, y, 0.5, 0.5, TINTA).rect(x1 - 0.5, y, 0.5, 0.5, TINTA);
  }
  // kaca belakang & depan, pilar
  for (let y = 5.5; y < 13; y += 0.5) {
    const t = (y - 4) / 10;
    const x0 = 18 - t * 6 + 1.5, x1 = 50 + t * 9 - 1.5;
    p.rect(x0, y, 15 + t * 2, 0.5, KACA).rect(x0 + 18 + t * 2, y, x1 - (x0 + 18 + t * 2), 0.5, KACA);
  }
  p.rect(18, 6, 4, 0.5, '#ffffff').rect(37, 6, 5, 0.5, '#ffffff');
  // badan bawah
  p.kotakTangga(2, 13.5, 71, 13, TEAL, 2);
  p.rect(2, 13.5, 71, 0.5, TINTA).rect(2.5, 14.5, 70, 1, TEAL_MUDA);
  p.rect(2, 26, 71, 0.5, TINTA).rect(2, 21, 71, 0.5, TEAL_TUA);
  p.rect(33, 14, 0.5, 11, TEAL_TUA).rect(51, 14, 0.5, 11, TEAL_TUA); // pintu
  p.rect(28, 17, 3, 0.5, TINTA).rect(46, 17, 3, 0.5, TINTA); // gagang
  // lampu: belakang merah (kiri), depan kuning (kanan); bemper abu
  p.rect(2.5, 16, 2, 3, '#d32f2f').rect(71, 16, 2, 2.5, '#f6d25c');
  p.rect(0.5, 22, 6, 4, BESI).rect(68.5, 22, 6, 4, BESI).rect(0.5, 22, 6, 0.5, TINTA).rect(68.5, 22, 6, 0.5, TINTA);
  // roda
  for (const x of [16, 58]) {
    p.bulat(x, 26.5, 6.2, '#173f3f');
    p.bulat(x, 26.5, 5.2, BAN).bulat(x, 26.5, 2.6, BESI).bulat(x, 26.5, 1, '#5f5f5f');
  }
  // PENYOK bemper belakang kanan: cekungan gelap + sorot + retak cat + garis benturan jingga
  p.bulat(5.5, 21, 3, TEAL_TUA).bulat(5, 20.5, 1.8, '#134848');
  p.garis(2.5, 23.5, 8, 23, '#e6f4f2', 1);
  p.garis(4, 18, 6.5, 19.5, TINTA, 1).garis(6.5, 19.5, 5, 21.5, TINTA, 1);
  p.rect(1, 22.5, 3, 1, '#7a7a7a');
  p.garis(0, 17, 1.5, 15.5, '#ff9000', 2).garis(0, 20, 0.5, 19, '#ff9000', 2);
  return p;
}

/** Tali foto 160 x 6 sel (640 x 24): melendut di antara empat titik jepit (x 92 / 244 / 396 / 548 dunia, y 9). */
export function taliA03(): Piksel {
  const p = new Piksel(160, 6, null, 2);
  const jepit = [0, 23, 61, 99, 137, 160];
  const yJ = [1.5, 2.25, 2.25, 2.25, 2.25, 1.5];
  for (let x = 0; x < 160; x += 0.5) {
    let i = 0; while (i < jepit.length - 2 && x >= jepit[i + 1]!) i++;
    const a = jepit[i]!, b = jepit[i + 1]!, t = (x - a) / (b - a);
    const y = yJ[i]! + (yJ[i + 1]! - yJ[i]!) * t + Math.sin(t * Math.PI) * 1.6;
    p.rect(x, Math.round(y * 2) / 2 + 0.5, 0.5, 0.5, '#00000018');
    p.rect(x, Math.round(y * 2) / 2, 0.5, 0.5, '#7a5232');
  }
  return p;
}

/** Jendela foto polaroid: 17 x 13 sel (34 x 26 sel halus) mulai (3, 5.5). Isi digambar di kanvas kecil lalu ditempel. */
type IsiFoto = (f: Piksel) => void;

/** Tempel `src` diperkecil (tetangga terdekat) ke `p` pada (x, y) sel tata letak, faktor `s` (< 1). */
function tempelKecil(p: Piksel, src: Piksel, x: number, y: number, s: number, batas: { w: number; h: number }): void {
  const W = Math.floor(src.W * s), H = Math.floor(src.H * s);
  for (let J = 0; J < H; J++) for (let I = 0; I < W; I++) {
    const c = src.ambil(Math.floor(I / s), Math.floor(J / s));
    if (!c || c.length > 7) continue; // tanpa bayangan transparan
    const X = x * p.k + I, Y = y * p.k + J;
    if (I + x * p.k < batas.w * p.k && J + y * p.k < batas.h * p.k) p.titik(X, Y, c);
  }
}

export const FOTO_A03: Record<'seluruh' | 'detail' | 'plat' | 'selfie', IsiFoto> = {
  // A: seluruh mobil dari samping di lantai bengkel
  seluruh: (f) => {
    f.rect(0, 0, 17, 13, '#f1e6cf').rect(0, 9, 17, 4, '#c9c4b8').rect(0, 9, 17, 0.5, '#a8a294');
    tempelKecil(f, mobilA03(), 0.5, 3.5, 0.215, { w: 17, h: 13 });
  },
  // B: bemper belakang kanan dari dekat (potongan kiri mobil yang sama, 1 : 1)
  detail: (f) => {
    f.rect(0, 0, 17, 13, '#f1e6cf').rect(0, 10.5, 17, 2.5, '#c9c4b8');
    const m = mobilA03();
    for (let J = 0; J < 26; J++) for (let I = 0; I < 34; I++) { const c = m.ambil(I, J + 28); if (c && c.length <= 7) f.titik(I, J, c); }
  },
  // C: plat nomor + pelat rangka
  plat: (f) => {
    f.rect(0, 0, 17, 13, '#dfe6e2');
    f.kartu(1, 1, 15, 6, TINTA, TINTA).rect(1.5, 1.5, 14, 5, '#f5f5f0');
    teksMini(f, 2.5, 2.5, 'B1703', TINTA);
    f.kartu(1.5, 8.5, 14, 3.5, BESI, '#5f5f5f');
    f.rect(2, 9, 0.5, 0.5, '#5f5f5f').rect(14.5, 9, 0.5, 0.5, '#5f5f5f');
    f.rect(4, 9.5, 9, 0.5, '#5f5f5f').rect(4, 10.5, 6, 0.5, '#5f5f5f');
  },
  // D: swafoto nasabah di depan bengkel (wajah dekat, papan nama hijau di belakang)
  selfie: (f) => {
    f.rect(0, 0, 17, 13, '#f4ead3').rect(0, 11, 17, 2, '#c9c4b8');
    f.rect(8, 1, 8.5, 3, '#3f8f5a').rect(9, 2, 6.5, 0.5, '#fff1e2');
    f.rect(0.5, 2, 4, 9, '#cfe6ee').rect(0, 1.5, 5, 1, BESI);
    f.kotakTangga(2.5, 9.5, 12, 3.5, '#2f6f9f', 1); // bahu baju biru
    f.rect(7, 8, 2.5, 2, '#e0ac7e');
    f.bulat(8.25, 5.5, 3, '#e0ac7e');
    f.rect(5.5, 2.5, 5.5, 1.5, '#2b2118').rect(5, 3.5, 1, 2.5, '#2b2118').rect(10.5, 3.5, 1, 1.5, '#2b2118');
    f.rect(7, 5.5, 0.5, 0.5, TINTA).rect(9.5, 5.5, 0.5, 0.5, TINTA).rect(7.5, 7, 2, 0.5, '#9a4f00');
    f.garis(12.5, 9, 16.5, 12.5, '#e0ac7e', 2); // lengan memegang ponsel
  },
};

/** Polaroid SERAGAM 23 x 25 sel (92 x 100): bingkai putih, jendela foto 17 x 13 sel, huruf di tepi bawah, jepitan kayu. */
export function polaroidA03(huruf: string, isi: IsiFoto): Piksel {
  const p = new Piksel(23, 25, null, 2);
  p.kotakTangga(2, 3.5, 20, 21.5, '#00000024' as Warna);
  p.kartu(1.5, 2.5, 20, 22, '#ffffff', TINTA);
  const f = new Piksel(17, 13, null, 2);
  isi(f);
  p.tempel(f, 3, 5.5);
  p.rect(3, 5.5, 17, 0.5, '#00000030').rect(3, 5.5, 0.5, 13, '#00000030');
  teksBesar(p, 10, 20, huruf, '#5f5f5f');
  // jepitan kayu di tengah atas (di atas tali)
  p.kartu(10, 0, 3, 5, '#c69d6e', '#6f4c2e').rect(10.5, 2.25, 2, 0.5, '#8c8c8c');
  return p;
}
