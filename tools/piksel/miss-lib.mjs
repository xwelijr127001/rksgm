/**
 * Pembantu khusus Miss Raksa (di atas tools/piksel/lib.mjs, yang hanya DIIMPOR, tidak diubah).
 * Beberapa fungsi disalin/diadaptasi dari rina-lib.mjs (milik alur Bu Rina) supaya alat Miss tidak bergantung pada
 * berkas yang bisa berubah di alur lain.
 *
 * Gambar di memori = { w, h, d } RGBA (sama dengan lib.mjs). Keluaran native: alpha tepat 0/255.
 *
 * Isi:
 *  - piksel: warna, setel, buramXY, samaW, key, selisih, geser, komponen
 *  - tepi: bersihTepi (pijar di luar garis), rapikanAlpha (yatim & lubang tunggal)
 *  - suntingan ASCII: gambarAscii (tempel pola huruf -> warna palet), dumpAscii (baca wilayah sebagai huruf palet)
 *  - atlas: kemas (skyline), tulisPngIndeks (PNG terindeks 8-bit + tRNS)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as L from './lib.mjs';

export const warna = (img, x, y) => { const i = L.idx(img, x, y); return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
export const setel = (img, x, y, c) => {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = L.idx(img, x, y);
  if (!c) { img.d[i] = img.d[i + 1] = img.d[i + 2] = img.d[i + 3] = 0; return; }
  img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = 255;
};
export const buramXY = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.d[L.idx(img, x, y) + 3] >= 128;
export const samaW = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
export const key = (c) => `${c[0]},${c[1]},${c[2]}`;

/** Selisih piksel dua gambar sama ukuran: daftar [x,y] yang berbeda (RGBA; RGB hanya dibandingkan bila buram). */
export function selisih(a, b) {
  const out = [];
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const i = L.idx(a, x, y);
    if (a.d[i + 3] !== b.d[i + 3] || (a.d[i + 3] && (a.d[i] !== b.d[i] || a.d[i + 1] !== b.d[i + 1] || a.d[i + 2] !== b.d[i + 2]))) out.push([x, y]);
  }
  return out;
}

/** Geser gambar (dx,dy) di kanvas berukuran w x h (bawaan sama). */
export function geser(img, dx, dy, w = img.w, h = img.h) {
  const o = L.buat(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x - dx, sy = y - dy; if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
    img.d.copy(o.d, L.idx(o, x, y), L.idx(img, sx, sy), L.idx(img, sx, sy) + 4);
  }
  return o;
}

/** Komponen terhubung. pred(p) dengan p = indeks piksel. */
export function komponen(img, pred, conn8 = true) {
  const { w, h } = img; const lab = new Int32Array(w * h).fill(-1); const out = [];
  for (let p0 = 0; p0 < w * h; p0++) {
    if (lab[p0] >= 0 || !pred(p0)) continue;
    const id = out.length; const st = [p0]; lab[p0] = id; let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0; const px = [];
    while (st.length) {
      const p = st.pop(); n++; px.push(p); const x = p % w, y = (p / w) | 0;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!conn8 && dx && dy) continue; const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const q = yy * w + xx;
        if (lab[q] < 0 && pred(q)) { lab[q] = id; st.push(q); }
      }
    }
    out.push({ id, n, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, px });
  }
  return { lab, out };
}

/**
 * Rapikan tepi siluet: piksel tepi (bertetangga-4 dengan transparan) yang jauh lebih terang (>= 0,15 L OKLab) dari
 * tetangga-dalam tergelapnya yang GELAP (garis, L < 0,33) dibuang (pijar/halo di luar garis gelap). `putaran` kali.
 */
export function bersihTepi(img, { putaran = 2 } = {}) {
  let hapus = 0;
  const tet = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const tepi = (x, y) => tet.some(([dx, dy]) => !buramXY(img, x + dx, y + dy));
  const lab = (x, y) => L.keOklab(warna(img, x, y));
  for (let it = 0; it < putaran; it++) {
    const daftar = [];
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!buramXY(img, x, y) || !tepi(x, y)) continue;
      const p = lab(x, y);
      const q = tet.filter(([dx, dy]) => buramXY(img, x + dx, y + dy)).map(([dx, dy]) => lab(x + dx, y + dy)).sort((u, v) => u[0] - v[0])[0];
      if (q && q[0] < 0.33 && p[0] > q[0] + 0.15) daftar.push([x, y]);
    }
    for (const [x, y] of daftar) setel(img, x, y, null);
    hapus += daftar.length;
  }
  return hapus;
}

/** Hapus piksel buram yatim (tanpa tetangga-4 buram) & isi lubang transparan tunggal (4 tetangga buram). */
export function rapikanAlpha(img) {
  let a = 0, b = 0;
  const s = L.salin(img);
  const T = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const tet = T.filter(([dx, dy]) => buramXY(s, x + dx, y + dy)).length;
    if (buramXY(s, x, y) && tet === 0) { setel(img, x, y, null); a++; }
    if (!buramXY(s, x, y) && tet === 4) {
      const m = new Map();
      for (const [dx, dy] of T) { const c = warna(s, x + dx, y + dy); const k = key(c); m.set(k, { c, n: (m.get(k)?.n || 0) + 1 }); }
      setel(img, x, y, [...m.values()].sort((p, q) => q.n - p.n || (key(p.c) < key(q.c) ? -1 : 1))[0].c); b++;
    }
  }
  return { yatim: a, lubang: b };
}

/* ------------------------------------------------------------------ suntingan ASCII */

/**
 * Tempel pola ASCII. `baris`: string sama panjang; `kunci`: huruf -> '#rrggbb' | null (transparan).
 * Huruf '.' (atau yang tidak ada di kunci) = biarkan. Kembalian: daftar [x,y] yang berubah.
 */
export function gambarAscii(img, x0, y0, baris, kunci) {
  const ubah = [];
  baris.forEach((s, j) => {
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '.' || !(ch in kunci)) continue;
      const x = x0 + i, y = y0 + j;
      if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
      const c = kunci[ch] === null ? null : L.dariHex(kunci[ch]);
      const lama = warna(img, x, y);
      const sama = c ? lama[3] >= 128 && samaW(lama, c) : lama[3] < 128;
      if (!sama) { setel(img, x, y, c); ubah.push([x, y]); }
    }
  });
  return ubah;
}

/** Baca wilayah sebagai huruf palet (indeks palet -> huruf HURUF; transparan '_'). Untuk menyusun suntingan. */
export const HURUF = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export function dumpAscii(img, palet, x0, y0, w, h) {
  const peta = new Map(palet.map((c, i) => [key(c), HURUF[i]]));
  const out = [];
  for (let y = y0; y < y0 + h; y++) {
    let s = '';
    for (let x = x0; x < x0 + w; x++) s += buramXY(img, x, y) ? peta.get(key(warna(img, x, y))) ?? '?' : '_';
    out.push(s);
  }
  return out;
}

/* ------------------------------------------------------------------ atlas */

/** Kemas persegi (skyline kiri-bawah) ke lebar W; celah 1 px. items: [{w,h}] -> set .x .y; kembalikan tinggi. */
export function kemas(items, W) {
  const tinggi = new Int32Array(W);
  const urut = [...items].sort((a, b) => b.h - a.h || b.w - a.w || (a.kunci < b.kunci ? -1 : a.kunci > b.kunci ? 1 : 0));
  for (const it of urut) {
    const w = it.w + 1; let bx = -1, by = Infinity;
    for (let x = 0; x + w <= W; x++) {
      let y = 0; for (let k = x; k < x + w; k++) if (tinggi[k] > y) y = tinggi[k];
      if (y < by) { by = y; bx = x; }
    }
    if (bx < 0) throw new Error('lebar atlas terlalu kecil');
    it.x = bx; it.y = by;
    for (let k = bx; k < bx + w; k++) tinggi[k] = by + it.h + 1;
  }
  return Math.max(...items.map((it) => it.y + it.h));
}

/**
 * Tulis PNG terindeks (colorType 3, 8 bit, PLTE + tRNS). Indeks 0 = transparan penuh; urutan palet = `urutan`
 * (warna yang tidak ada di `urutan` ditambahkan menurut kemunculan). Hanya alpha 0/255 yang diterima.
 */
export function tulisPngIndeks(file, img, urutan = []) {
  const warnaKe = new Map(); const pal = [[0, 0, 0]];
  for (const c of urutan) { const k = (c[0] << 16) | (c[1] << 8) | c[2]; if (!warnaKe.has(k)) { warnaKe.set(k, pal.length); pal.push([c[0], c[1], c[2]]); } }
  const idx = Buffer.alloc(img.w * img.h);
  for (let p = 0; p < img.w * img.h; p++) {
    const a = img.d[p * 4 + 3];
    if (a !== 0 && a !== 255) throw new Error('alpha bukan biner');
    if (!a) continue;
    const k = (img.d[p * 4] << 16) | (img.d[p * 4 + 1] << 8) | img.d[p * 4 + 2];
    let i = warnaKe.get(k);
    if (i === undefined) { i = pal.length; if (i > 255) throw new Error('> 255 warna'); warnaKe.set(k, i); pal.push([img.d[p * 4], img.d[p * 4 + 1], img.d[p * 4 + 2]]); }
    idx[p] = i;
  }
  // buang warna palet yang tidak terpakai di gambar (urutan tetap)
  const dipakai = new Set(idx); dipakai.add(0);
  const baru = new Map(); const pal2 = [];
  pal.forEach((c, i) => { if (dipakai.has(i)) { baru.set(i, pal2.length); pal2.push(c); } });
  for (let p = 0; p < idx.length; p++) idx[p] = baru.get(idx[p]);
  const baris = Buffer.alloc((img.w + 1) * img.h);
  for (let y = 0; y < img.h; y++) { baris[y * (img.w + 1)] = 0; idx.copy(baris, y * (img.w + 1) + 1, y * img.w, (y + 1) * img.w); }
  const chunk = (tipe, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(tipe, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 3;
  const out = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal2.flat())), chunk('tRNS', Buffer.from([0])), chunk('IDAT', zlib.deflateSync(baris, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  return { warna: pal2.length - 1, byte: out.length };
}
