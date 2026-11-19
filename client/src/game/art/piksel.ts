/**
 * T-054: kanvas seni PIKSEL kecil untuk adegan engine yang masih memakai SVG (ArtRef.svg). Gambar disusun per sel (1 sel =
 * `sel` satuan dunia, bawaan 4, sama dengan ruang piksel cerita), lalu dikeluarkan sebagai deretan <rect> per baris
 * (shape-rendering crispEdges). Jadi seni piksel memakai jalur rasterisasi SVG yang sudah ada (engine/raster.ts) tanpa
 * atlas baru, dan tetap tajam karena tepi tiap sel jatuh di kelipatan bulat dunia. Murni (tanpa DOM): bisa dipakai alat
 * pratinjau di node (character/acara-a01-t054/pratinjau.mts).
 */

export type Warna = string | null;

export class Piksel {
  readonly w: number;
  readonly h: number;
  readonly d: Warna[];

  constructor(w: number, h: number, isi: Warna = null) {
    this.w = w;
    this.h = h;
    this.d = new Array<Warna>(w * h).fill(isi);
  }

  set(x: number, y: number, c: Warna): this {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
    return this;
  }

  get(x: number, y: number): Warna {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x]! : null;
  }

  rect(x: number, y: number, w: number, h: number, c: Warna): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  /** Kotak bersudut tangga 1 sel (sudut dikosongkan). */
  kotakTangga(x: number, y: number, w: number, h: number, c: Warna): this {
    this.rect(x + 1, y, w - 2, h, c).rect(x, y + 1, w, h - 2, c);
    return this;
  }

  /** Bingkai 1 sel bersudut tangga + isi. */
  kartu(x: number, y: number, w: number, h: number, isi: Warna, tepi: Warna): this {
    this.kotakTangga(x, y, w, h, tepi).kotakTangga(x + 1, y + 1, w - 2, h - 2, isi);
    return this;
  }

  /** Pola papan catur (dither) di dalam kotak: `rapat` 0..1 = bagian sel yang diwarnai (pola Bayer 4x4). */
  dither(x: number, y: number, w: number, h: number, c: Warna, rapat: number | ((i: number, j: number) => number)): this {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const r = typeof rapat === 'function' ? rapat(i, j) : rapat;
      const X = x + i, Y = y + j;
      if ((B[(Y & 3) * 4 + (X & 3)]! + 0.5) / 16 < r) this.set(X, Y, c);
    }
    return this;
  }

  /** Lingkaran terisi (pusat & jari-jari dalam sel). */
  bulat(cx: number, cy: number, r: number, c: Warna): this {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, c);
    }
    return this;
  }

  /** Garis 1 sel (Bresenham). */
  garis(x0: number, y0: number, x1: number, y1: number, c: Warna): this {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }

  /** Pola teks / gambar kecil: baris string, tiap huruf = kunci `peta` ('.' / spasi = kosong). */
  pola(x: number, y: number, baris: readonly string[], peta: Record<string, Warna>): this {
    baris.forEach((r, j) => [...r].forEach((ch, i) => { if (ch in peta) this.set(x + i, y + j, peta[ch]!); }));
    return this;
  }

  /** Teks huruf piksel 3 x 5 (huruf besar, angka, spasi). Mengembalikan x sesudah teks. */
  teks(x: number, y: number, s: string, c: Warna): number {
    for (const ch of s.toUpperCase()) {
      const g = HURUF[ch] ?? HURUF[' ']!;
      this.pola(x, y, g, { '#': c });
      x += g[0]!.length + 1;
    }
    return x;
  }

  /** Salin kanvas lain (sel kosong tidak menimpa). */
  tempel(src: Piksel, x: number, y: number): this {
    for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const c = src.get(i, j); if (c) this.set(x + i, y + j, c); }
    return this;
  }

  /** Isi SVG: <rect> per deretan sel sewarna, `sel` satuan dunia per sel, crispEdges. */
  svg(sel = 4): string {
    const out: string[] = [];
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.d[y * this.w + x];
        if (!c) { x++; continue; }
        let e = x + 1;
        while (e < this.w && this.d[y * this.w + e] === c) e++;
        out.push(`<rect x="${x * sel}" y="${y * sel}" width="${(e - x) * sel}" height="${sel}" fill="${c}"/>`);
        x = e;
      }
    }
    return `<g shape-rendering="crispEdges">${out.join('')}</g>`;
  }
}

/** Huruf piksel 3 x 5. */
export const HURUF: Record<string, readonly string[]> = {
  A: ['###', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['###', '#..', '#..', '#..', '###'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], N: ['#.#', '###', '###', '#.#', '#.#'], O: ['###', '#.#', '#.#', '#.#', '###'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['###', '#..', '###', '..#', '###'], P: ['##.', '#.#', '##.', '#..', '#..'], L: ['#..', '#..', '#..', '#..', '###'],
  G: ['###', '#..', '#.#', '#.#', '###'], J: ['..#', '..#', '..#', '#.#', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  M: ['#.#', '###', '###', '#.#', '#.#'], ' ': ['.', '.', '.', '.', '.'],
};
