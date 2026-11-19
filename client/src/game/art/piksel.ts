/**
 * Kanvas seni PIKSEL kecil untuk adegan engine yang masih memakai SVG (ArtRef.svg). Gambar disusun per sel lalu dikeluarkan
 * sebagai deretan <rect> per baris (shape-rendering crispEdges), jadi seni piksel memakai jalur rasterisasi SVG yang sudah ada
 * (engine/raster.ts) tanpa atlas baru. Murni (tanpa DOM): bisa dipakai alat pratinjau di node.
 *
 * T-055: kepadatan HALUS. Koordinat gambar tetap dalam sel TATA LETAK (`w` x `h`, mis. 160 x 120 untuk dunia 640 x 480), tetapi
 * kisi sebenarnya `k` kali lebih rapat (`W` x `H`). Kotak dan pola tetap mengikuti sel tata letak, sedangkan garis tepi kartu,
 * sudut bertangga, dither, lingkaran, dan garis digambar pada sel HALUS (1 / k sel). Dengan k = 2 dan svg(4), 1 sel halus =
 * 2 satuan dunia: kepadatan ruang piksel cerita Episode 1 (+- 1 piksel seni per px CSS di HP). Koordinat boleh pecahan
 * (0.5 = satu sel halus pada k = 2).
 */

export type Warna = string | null;

export class Piksel {
  /** Ukuran dalam sel tata letak. */
  readonly w: number;
  readonly h: number;
  /** Sel halus per sel tata letak. */
  readonly k: number;
  /** Ukuran kisi halus. */
  readonly W: number;
  readonly H: number;
  readonly d: Warna[];

  constructor(w: number, h: number, isi: Warna = null, k = 1) {
    this.w = w;
    this.h = h;
    this.k = Math.max(1, Math.round(k));
    this.W = w * this.k;
    this.H = h * this.k;
    this.d = new Array<Warna>(this.W * this.H).fill(isi);
  }

  /** Sel tata letak -> sel halus. */
  private f(v: number): number { return Math.round(v * this.k); }

  /** Satu sel HALUS. */
  titik(X: number, Y: number, c: Warna): this {
    X = Math.round(X); Y = Math.round(Y);
    if (X >= 0 && Y >= 0 && X < this.W && Y < this.H) this.d[Y * this.W + X] = c;
    return this;
  }

  /** Warna satu sel HALUS. */
  ambil(X: number, Y: number): Warna {
    return X >= 0 && Y >= 0 && X < this.W && Y < this.H ? this.d[Y * this.W + X]! : null;
  }

  /** Satu sel tata letak (k x k sel halus). */
  set(x: number, y: number, c: Warna): this {
    return this.rect(x, y, 1, 1, c);
  }

  /** Warna sel tata letak (pojok kiri atasnya). */
  get(x: number, y: number): Warna {
    return this.ambil(this.f(x), this.f(y));
  }

  rect(x: number, y: number, w: number, h: number, c: Warna): this {
    const X0 = this.f(x), Y0 = this.f(y), X1 = this.f(x + w), Y1 = this.f(y + h);
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) this.titik(X, Y, c);
    return this;
  }

  /** Kotak bersudut tangga: `tangga` sel halus dikosongkan di tiap sudut (bawaan 1). */
  kotakTangga(x: number, y: number, w: number, h: number, c: Warna, tangga = 1): this {
    const X0 = this.f(x), Y0 = this.f(y), X1 = this.f(x + w), Y1 = this.f(y + h);
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
      const dx = Math.min(X - X0, X1 - 1 - X), dy = Math.min(Y - Y0, Y1 - 1 - Y);
      if (dx + dy < tangga) continue;
      this.titik(X, Y, c);
    }
    return this;
  }

  /** Bingkai bersudut tangga (tebal `tebal` sel halus, bawaan 1) + isi. */
  kartu(x: number, y: number, w: number, h: number, isi: Warna, tepi: Warna, tebal = 1): this {
    this.kotakTangga(x, y, w, h, tepi, tebal);
    const t = tebal / this.k;
    this.kotakTangga(x + t, y + t, w - 2 * t, h - 2 * t, isi, tebal);
    return this;
  }

  /** Pola Bayer 4x4 (pada sel halus) di dalam kotak: `rapat` 0..1, atau fungsi (i, j) dalam sel tata letak relatif kotak. */
  dither(x: number, y: number, w: number, h: number, c: Warna, rapat: number | ((i: number, j: number) => number)): this {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const X0 = this.f(x), Y0 = this.f(y), X1 = this.f(x + w), Y1 = this.f(y + h);
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
      const r = typeof rapat === 'function' ? rapat((X - X0) / this.k, (Y - Y0) / this.k) : rapat;
      if ((B[(Y & 3) * 4 + (X & 3)]! + 0.5) / 16 < r) this.titik(X, Y, c);
    }
    return this;
  }

  /** Lingkaran terisi (pusat & jari-jari dalam sel tata letak), digambar pada sel halus. */
  bulat(cx: number, cy: number, r: number, c: Warna): this {
    const k = this.k, CX = cx * k, CY = cy * k, R = r * k;
    for (let Y = Math.floor(CY - R); Y <= Math.ceil(CY + R); Y++) for (let X = Math.floor(CX - R); X <= Math.ceil(CX + R); X++) {
      if ((X + 0.5 - CX) ** 2 + (Y + 0.5 - CY) ** 2 <= R * R) this.titik(X, Y, c);
    }
    return this;
  }

  /** Garis (Bresenham) dari pusat sel ke pusat sel, tebal `tebal` sel halus (bawaan = k, yaitu satu sel tata letak). */
  garis(x0: number, y0: number, x1: number, y1: number, c: Warna, tebal = this.k): this {
    const k = this.k;
    let X0 = Math.floor((x0 + 0.5) * k - tebal / 2), Y0 = Math.floor((y0 + 0.5) * k - tebal / 2);
    const X1 = Math.floor((x1 + 0.5) * k - tebal / 2), Y1 = Math.floor((y1 + 0.5) * k - tebal / 2);
    const dx = Math.abs(X1 - X0), sx = X0 < X1 ? 1 : -1, dy = -Math.abs(Y1 - Y0), sy = Y0 < Y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      for (let j = 0; j < tebal; j++) for (let i = 0; i < tebal; i++) this.titik(X0 + i, Y0 + j, c);
      if (X0 === X1 && Y0 === Y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; X0 += sx; }
      if (e2 <= dx) { e += dx; Y0 += sy; }
    }
    return this;
  }

  /** Pola sel TATA LETAK: baris string, tiap huruf = kunci `peta` ('.' / spasi = kosong). */
  pola(x: number, y: number, baris: readonly string[], peta: Record<string, Warna>): this {
    baris.forEach((r, j) => [...r].forEach((ch, i) => { if (ch in peta) this.set(x + i, y + j, peta[ch]!); }));
    return this;
  }

  /** Pola sel HALUS, mulai di sel tata letak (x, y). */
  polaHalus(x: number, y: number, baris: readonly string[], peta: Record<string, Warna>): this {
    const X0 = this.f(x), Y0 = this.f(y);
    baris.forEach((r, j) => [...r].forEach((ch, i) => { if (ch in peta) this.titik(X0 + i, Y0 + j, peta[ch]!); }));
    return this;
  }

  /** Teks huruf piksel 3 x 5 sel TATA LETAK (huruf besar, spasi). Mengembalikan x sesudah teks. */
  teks(x: number, y: number, s: string, c: Warna): number {
    for (const ch of s.toUpperCase()) {
      const g = HURUF[ch] ?? HURUF[' ']!;
      this.pola(x, y, g, { '#': c });
      x += g[0]!.length + 1;
    }
    return x;
  }

  /** Teks huruf piksel 5 x 7 sel HALUS (lebih halus dari teks()), mulai di sel tata letak (x, y). Mengembalikan lebar (sel halus). */
  teksHalus(x: number, y: number, s: string, c: Warna): number {
    let X = 0;
    for (const ch of s.toUpperCase()) {
      const g = HURUF_HALUS[ch] ?? HURUF_HALUS[' ']!;
      this.polaHalus(x, y, g.map((r) => ' '.repeat(X) + r), { '#': c });
      X += g[0]!.length + 1;
    }
    return X - 1;
  }

  /** Salin kanvas lain dengan k SAMA (sel kosong tidak menimpa), di sel tata letak (x, y). */
  tempel(src: Piksel, x: number, y: number): this {
    const X0 = this.f(x), Y0 = this.f(y);
    for (let J = 0; J < src.H; J++) for (let I = 0; I < src.W; I++) { const c = src.ambil(I, J); if (c) this.titik(X0 + I, Y0 + J, c); }
    return this;
  }

  /** Isi SVG: <rect> per deretan sel halus sewarna; `sel` = satuan dunia per sel TATA LETAK, crispEdges. */
  svg(sel = 4): string {
    const s = sel / this.k;
    const out: string[] = [];
    for (let Y = 0; Y < this.H; Y++) {
      let X = 0;
      while (X < this.W) {
        const c = this.d[Y * this.W + X];
        if (!c) { X++; continue; }
        let e = X + 1;
        while (e < this.W && this.d[Y * this.W + e] === c) e++;
        out.push(`<rect x="${X * s}" y="${Y * s}" width="${(e - X) * s}" height="${s}" fill="${c}"/>`);
        X = e;
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

/** Huruf piksel 5 x 7 (sel halus). */
export const HURUF_HALUS: Record<string, readonly string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'], K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'], O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'], U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};
