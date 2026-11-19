/**
 * T-061a: potongan seni PIKSEL bersama untuk adegan acara 2-4 (gaya kasus 1, k = 2: 1 sel tata letak = 4 dunia, sel halus = 2
 * dunia). Murni (tanpa DOM / Phaser).
 */
import { HURUF_HALUS, Piksel, type Warna } from '../../art/piksel';

export const TINTA = '#2a211e';
export const KAYU = '#c69d6e';
export const KAYU_TUA = '#9c6b3f';
export const KAYU_GELAP = '#6f4c2e';
export const KREM = '#fff1e2';
export const AIR = '#8fc3e0';

/** Angka & huruf 3 x 5 dalam sel HALUS (nomor peti, plat, kode kecil). */
const MINI: Record<string, readonly string[]> = {
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
  3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'], B: ['##.', '#.#', '##.', '#.#', '##.'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], ' ': ['.', '.', '.', '.', '.'],
};

/** Teks mini 3 x 5 sel halus mulai (x, y) sel tata letak; kembali: lebar dalam sel halus. */
export function teksMini(p: Piksel, x: number, y: number, s: string, c: Warna): number {
  let X = 0;
  for (const ch of s.toUpperCase()) {
    const g = MINI[ch] ?? MINI[' ']!;
    p.polaHalus(x, y, g.map((r) => ' '.repeat(X) + r), { '#': c });
    X += g[0]!.length + 1;
  }
  return X - 1;
}
export const lebarMini = (s: string): number => [...s].reduce((n, ch) => n + (MINI[ch.toUpperCase()] ?? MINI[' ']!)[0]!.length + 1, 0) - 1;

export interface RusakPeti { remuk?: 'kanan' | 'kiri'; basah?: boolean; terbuka?: boolean }

/**
 * Peti kayu piksel `w` x `h` sel di (x, y): bingkai kayu tua, dua papan melintang, palang diagonal, pelat krem bernomor.
 * Kerusakan: remuk (pojok atas terlipat ke dalam + retak), basah (noda air biru + tetesan di bawah), terbuka (tutup terangkat
 * di atas peti, isi gelap terlihat).
 */
export function peti(p: Piksel, x: number, y: number, w: number, h: number, nomor: string, o: RusakPeti = {}): Piksel {
  if (o.terbuka) {
    // tutup miring di atas peti
    for (let i = 0; i < w - 1; i += 0.5) p.rect(x - 1 + i, y - 4 + (i / (w - 1)) * 3 - 0.5, 0.5, 2, i < 1 || i > w - 2.5 ? KAYU_GELAP : KAYU);
    p.garis(x - 1, y - 3.5, x + w - 2, y - 1, KAYU_GELAP, 1);
  }
  p.kartu(x, y, w, h, KAYU, KAYU_GELAP);
  p.rect(x + 0.5, y + h * 0.3, w - 1, 0.5, KAYU_TUA).rect(x + 0.5, y + h * 0.7, w - 1, 0.5, KAYU_TUA);
  p.garis(x + 0.75, y + 0.75, x + w - 1, y + h - 1, '#b58b5c', 1);
  p.rect(x + 0.5, y + 0.5, w - 1, 0.5, '#d9b48a');
  if (o.terbuka) p.rect(x + 0.5, y + 0.5, w - 1, 1, '#3f3226');
  if (o.remuk) {
    const kanan = o.remuk === 'kanan';
    const x0 = kanan ? x + w - 3.5 : x;
    // pojok atas terlipat: segitiga gelap + garis lipatan + retak
    for (let j = 0; j < 3.5; j += 0.5) p.rect(kanan ? x0 + j : x0, y + j, 3.5 - j, 0.5, j === 0 ? null : '#7a5232');
    p.rect(kanan ? x + w - 0.5 : x, y, 0.5, 3.5, null).rect(kanan ? x + w - 3.5 : x, y, 3.5, 0.5, null);
    p.garis(kanan ? x + w - 4 : x + 4, y + 0.5, kanan ? x + w - 0.5 : x + 0.5, y + 4, KAYU_GELAP, 1);
    p.garis(kanan ? x + w - 3 : x + 3, y + 3.5, kanan ? x + w - 2 : x + 2, y + 5.5, KAYU_GELAP, 1);
  }
  if (o.basah) {
    p.dither(x + 0.5, y + h * 0.55, w - 1, h * 0.45 - 0.5, AIR, (i, j) => 0.35 + j * 0.5);
    p.rect(x + 1, y + h, 0.5, 1, AIR).rect(x + w / 2, y + h + 0.5, 0.5, 1, AIR).rect(x + w - 2, y + h, 0.5, 0.5, AIR);
  }
  // pelat nomor krem: tepi 1 + jarak 1 sel halus di tiap sisi, diselaraskan ke kisi halus, digambar paling akhir (tetap terbaca)
  const lw = lebarMini(nomor) + 4;
  const px = Math.round((x + w / 2 - lw / 4) * 2) / 2, py = Math.round((y + h / 2 - 2.25) * 2) / 2;
  p.kartu(px, py, lw / 2, 4.5, KREM, KAYU_GELAP);
  teksMini(p, px + 1, py + 1, nomor, TINTA);
  return p;
}

/** Bayangan lonjong di lantai, pusat (cx, cy) sel tata letak, setengah lebar rx (tinta 14 %). */
export function bayangan(p: Piksel, cx: number, cy: number, rx: number): Piksel {
  for (let i = -rx; i < rx; i += 0.5) { const t = Math.sqrt(Math.max(0, 1 - ((i + 0.25) / rx) ** 2)); if (t > 0.2) p.rect(cx + i, cy - (t > 0.7 ? 0.5 : 0), 0.5, t > 0.7 ? 1 : 0.5, '#2a211e24'); }
  return p;
}

/** Tambahan huruf 5 x 7 sel halus yang belum ada di HURUF_HALUS (C, D, M, P, R, angka). */
const BESAR: Record<string, readonly string[]> = {
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
};
/** Teks 5 x 7 sel halus (HURUF_HALUS + BESAR); kembali: lebar dalam sel halus. */
export function teksBesar(p: Piksel, x: number, y: number, s: string, c: Warna): number {
  let X = 0;
  for (const ch of s.toUpperCase()) {
    const g = BESAR[ch] ?? HURUF_HALUS[ch] ?? HURUF_HALUS[' ']!;
    p.polaHalus(x, y, g.map((r) => ' '.repeat(X) + r), { '#': c });
    X += g[0]!.length + 1;
  }
  return X - 1;
}
