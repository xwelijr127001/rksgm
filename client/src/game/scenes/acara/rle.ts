/**
 * T-061a: kisi piksel hasil generator (character/acara-t061/bangun.mjs) disimpan ringkas sebagai baris RLE: tiap deret = satu
 * huruf palet (lihat ABJAD; '.' = transparan) diikuti jumlah ulang desimal bila > 1. Murni (tanpa DOM / Phaser).
 */
import { Piksel } from '../../art/piksel';

export interface KisiRle {
  /** Lebar & tinggi dalam sel HALUS (1 sel halus = 2 dunia pada k = 2, svg(4)). */
  w: number;
  h: number;
  palet: readonly string[];
  baris: readonly string[];
}

/** Huruf palet (tanpa angka, kutip, garis miring terbalik, backtick, '.'). Sama dengan generator. */
export const ABJAD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+,-/:;<=>?@[]^_{|}~';

export function kisiDariRle(d: KisiRle): (string | null)[][] {
  return d.baris.map((r) => {
    const out: (string | null)[] = [];
    let i = 0;
    while (i < r.length) {
      const ch = r[i]!;
      i++;
      let n = '';
      while (i < r.length && r.charCodeAt(i) >= 48 && r.charCodeAt(i) <= 57) n += r[i++];
      const c = ch === '.' ? null : d.palet[ABJAD.indexOf(ch)] ?? null;
      for (let k = Number(n || 1); k > 0; k--) out.push(c);
    }
    while (out.length < d.w) out.push(null);
    return out;
  });
}

/** Kisi RLE -> kanvas Piksel k = 2 (ukuran tata letak = ceil(w / 2) x ceil(h / 2)). */
export function pikselDariRle(d: KisiRle): Piksel {
  const p = new Piksel(Math.ceil(d.w / 2), Math.ceil(d.h / 2), null, 2);
  kisiDariRle(d).forEach((r, y) => r.forEach((c, x) => { if (c) p.titik(x, y, c); }));
  return p;
}
