/**
 * Pembantu khusus Bu Rina (di atas tools/piksel/lib.mjs, yang hanya DIIMPOR, tidak diubah).
 * Semua gambar = { w, h, d } RGBA; keluaran native alpha 0/255.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as L from './lib.mjs';

const createRequireZlib = () => createRequire(import.meta.url)('node:zlib');

export const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
  let h = 0;
  if (dd) { if (mx === r) h = ((g - b) / dd) % 6; else if (mx === g) h = (b - r) / dd + 2; else h = (r - g) / dd + 4; }
  h *= 60; if (h < 0) h += 360;
  return [h, mx ? dd / mx : 0, mx / 255];
};

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

/** Kotak kulit wajah: komponen kulit (4-tetangga) terbesar di bagian atas figur. */
export function kotakKulit(img, kotak, porsiAtas) {
  const batas = kotak.y + Math.round(kotak.h * porsiAtas);
  const kulit = (p) => {
    const x = p % img.w, y = (p / img.w) | 0;
    if (x < kotak.x || x >= kotak.x + kotak.w || y < kotak.y || y >= batas) return false;
    const i = p * 4; if (!img.d[i + 3]) return false;
    const [hh, s, v] = hsv(img.d[i], img.d[i + 1], img.d[i + 2]);
    return hh >= 18 && hh <= 42 && s >= 0.3 && v >= 0.6;
  };
  const k = komponen(img, kulit, false).out.sort((a, b) => b.n - a.n)[0];
  return k ? { x: k.x, y: k.y, w: k.w, h: k.h, n: k.n } : null;
}

/** Fasa grid terbaik (skor energi tepi) untuk pitch p tetap pada kotak. */
export function fasaTerbaik(sin, kotak, p) {
  const best = {};
  for (const sb of ['x', 'y']) {
    const pr = L.proyeksi(sin, kotak, sb); const a0 = sb === 'x' ? kotak.x : kotak.y, a1 = a0 + (sb === 'x' ? kotak.w : kotak.h);
    let bb = { skor: -1, f: 0 };
    for (let f = 0; f < p; f += 0.125) {
      let s = 0, t = 0;
      for (let a = a0; a < a1; a++) { const g = ((a - f) % p + p) % p; t += pr[a]; if (Math.min(g, p - g) < 0.75) s += pr[a]; }
      const sk = t ? s / t / (1.5 / p) : 0; if (sk > bb.skor) bb = { skor: sk, f };
    }
    best[sb] = bb;
  }
  return best;
}

/**
 * Rapikan tepi siluet (pijar/halo JPEG) di native, sadar garis:
 *  a. piksel tepi (bertetangga-4 dengan transparan) yang lebih terang >= 0,15 L dari tetangga-dalam tergelapnya
 *     dan tetangga itu GELAP (garis, L < 0,33) -> dibuang (pijar di luar garis). Diulang `putaran` kali.
 *  b. piksel tepi pucat yang tetangga-dalamnya TIDAK gelap: bila lebih terang (>= 0,08 L) DAN lebih kusam
 *     (kroma turun >= 0,03 atau rona beda > 60 derajat) daripada rata-rata tetangga-dalam -> diwarnai garis
 *     (garis yang hilang tertutup pijar). Apron krem di tepi siluet tidak terkena karena tetangganya krem juga.
 * `lindungi`: kotak native yang tidak disentuh (bilah kunci logam terang).
 */
export function bersihTepi(img, { lindungi = [], putaran = 2, garis = [15, 11, 17] } = {}) {
  let hapus = 0, warnai = 0;
  const dilindungi = (x, y) => lindungi.some(([a, b, c, d]) => x >= a && y >= b && x < a + c && y < b + d);
  const tet = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const tepi = (x, y) => tet.some(([dx, dy]) => !buramXY(img, x + dx, y + dy));
  const lab = (x, y) => L.keOklab(warna(img, x, y));
  const kroma = (p) => Math.hypot(p[1], p[2]);
  for (let it = 0; it < putaran; it++) {
    const daftar = [];
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!buramXY(img, x, y) || dilindungi(x, y) || !tepi(x, y)) continue;
      const p = lab(x, y);
      const q = tet.filter(([dx, dy]) => buramXY(img, x + dx, y + dy)).map(([dx, dy]) => lab(x + dx, y + dy)).sort((u, v) => u[0] - v[0])[0];
      if (q && q[0] < 0.33 && p[0] > q[0] + 0.15) daftar.push([x, y]);
    }
    for (const [x, y] of daftar) setel(img, x, y, null);
    hapus += daftar.length;
  }
  const ganti = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!buramXY(img, x, y) || dilindungi(x, y) || !tepi(x, y)) continue;
    const p = lab(x, y); if (p[0] < 0.33) continue;
    const qs = tet.filter(([dx, dy]) => buramXY(img, x + dx, y + dy)).map(([dx, dy]) => lab(x + dx, y + dy));
    if (!qs.length || qs.some((q) => q[0] < 0.33)) continue;
    const m = [0, 1, 2].map((k) => qs.reduce((s, q) => s + q[k], 0) / qs.length);
    const beda = Math.abs(((Math.atan2(p[2], p[1]) - Math.atan2(m[2], m[1])) * 180 / Math.PI + 540) % 360 - 180);
    if (p[0] >= m[0] + 0.08 && (kroma(p) <= kroma(m) - 0.03 || (beda > 60 && kroma(m) > 0.04))) ganti.push([x, y]);
  }
  for (const [x, y] of ganti) setel(img, x, y, garis);
  warnai = ganti.length;
  return { hapus, warnai };
}

/** Hapus piksel buram yatim (tanpa tetangga-4 buram) & lubang transparan tunggal di dalam. */
export function rapikanAlpha(img) {
  let a = 0, b = 0;
  const salinan = L.salin(img);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const tet = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => buramXY(salinan, x + dx, y + dy)).length;
    if (buramXY(salinan, x, y) && tet === 0) { setel(img, x, y, null); a++; }
    if (!buramXY(salinan, x, y) && tet === 4) {
      // isi lubang dengan warna tetangga terbanyak
      const m = new Map();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = warna(salinan, x + dx, y + dy); const k = key(c); m.set(k, { c, n: (m.get(k)?.n || 0) + 1 }); }
      setel(img, x, y, [...m.values()].sort((p, q) => q.n - p.n)[0].c); b++;
    }
  }
  return { yatim: a, lubang: b };
}

/**
 * Buang bintik noise JPEG: piksel tanpa tetangga-8 berwarna sama, yang >= `mayor` tetangganya berwarna sama c2 dan
 * jarak OKLab ke c2 < `jarak` (hanya beda nada tipis — detail kontras tinggi seperti kilap mata tidak disentuh).
 * `kecuali`: kotak yang tidak disentuh (mis. wajah).
 */
export function buangBintik(img, { mayor = 6, jarak = 0.09, kecuali = [] } = {}) {
  const src = L.salin(img); let n = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!buramXY(src, x, y)) continue;
    if (kecuali.some(([a, b, c, d]) => x >= a && y >= b && x < a + c && y < b + d)) continue;
    const c = warna(src, x, y); const m = new Map(); let sama = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; if (!buramXY(src, x + dx, y + dy)) continue;
      const q = warna(src, x + dx, y + dy); if (samaW(q, c)) { sama++; continue; }
      const k = key(q); m.set(k, { c: q, n: (m.get(k)?.n || 0) + 1 });
    }
    if (sama) continue;
    const top = [...m.values()].sort((p, q) => q.n - p.n)[0];
    if (!top || top.n < mayor) continue;
    if (L.jarakOk(L.keOklab(c), L.keOklab(top.c)) >= jarak) continue;
    setel(img, x, y, top.c); n++;
  }
  return n;
}

/** Hitung warna unik gabungan beberapa gambar -> Array<{c,n}>. */
export function kumpulkanWarna(imgs) {
  const m = new Map();
  for (const img of imgs) for (const [k, n] of L.hitungWarna(img)) m.set(k, (m.get(k) || 0) + n);
  return [...m.entries()].map(([k, n]) => ({ c: k.split(',').map(Number), n }));
}

/** Kotak buram (alpha >= 128). */
export const kotak = (img) => L.kotakAlpha(img);

/** Geser gambar (dx,dy) di kanvas sama ukuran. */
export function geser(img, dx, dy) {
  const o = L.buat(img.w, img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const sx = x - dx, sy = y - dy; if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
    img.d.copy(o.d, L.idx(o, x, y), L.idx(img, sx, sy), L.idx(img, sx, sy) + 4);
  }
  return o;
}

/** Selisih piksel dua gambar sama ukuran: daftar [x,y] yang berbeda (RGBA). */
export function selisih(a, b) {
  const out = [];
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const i = L.idx(a, x, y);
    if (a.d[i + 3] !== b.d[i + 3] || (a.d[i + 3] && (a.d[i] !== b.d[i] || a.d[i + 1] !== b.d[i + 1] || a.d[i + 2] !== b.d[i + 2]))) out.push([x, y]);
  }
  return out;
}

/**
 * Tulis PNG terindeks (colorType 3, 8 bit, PLTE + tRNS) — atlas <= 256 warna + transparan jauh lebih kecil daripada RGBA.
 * Indeks 0 = transparan penuh. Hanya alpha 0/255 yang diterima.
 */
export function tulisPngIndeks(file, img) {
  const zlib = createRequireZlib();
  const warnaKe = new Map(); const pal = [[0, 0, 0]];
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
  const baris = Buffer.alloc((img.w + 1) * img.h);
  for (let y = 0; y < img.h; y++) { baris[y * (img.w + 1)] = 0; idx.copy(baris, y * (img.w + 1) + 1, y * img.w, (y + 1) * img.w); }
  const chunk = (tipe, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(tipe, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 3; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const plte = Buffer.from(pal.flat());
  const trns = Buffer.from([0]); // hanya indeks 0 transparan; sisanya buram (default 255)
  const out = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('tRNS', trns), chunk('IDAT', zlib.deflateSync(baris, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  return { warna: pal.length - 1, byte: out.length };
}

/** Kemas persegi (tinggi-peta / skyline kiri-bawah) ke lebar W; celah 1 px. items: [{w,h}] -> set .x .y; kembalikan tinggi. */
export function kemas(items, W) {
  const tinggi = new Int32Array(W);
  const urut = [...items].sort((a, b) => b.h - a.h || b.w - a.w);
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
