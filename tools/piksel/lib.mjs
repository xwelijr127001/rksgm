/**
 * Pustaka bersama alat piksel (plain node + pngjs). Tidak ada layanan luar, tidak ada chroma key.
 *
 * Gambar di memori: { w, h, d } dengan d = Buffer RGBA (4 byte per piksel), sama dengan pngjs.
 *
 * Aturan yang dipegang di semua fungsi:
 *  - RGB piksel ber-alpha 0 TIDAK PERNAH dibaca (sumber generatif menyimpan RGB gelap/emas tersembunyi di sana).
 *  - Keluaran native: alpha tepat 0 atau 255.
 *  - Pembesaran hanya nearest-neighbour dengan faktor bulat.
 *
 * Isi:
 *  - IO & dasar: baca, tulis, buat, salin, potong, tempel, perbesar, datarkan, cermin, kotakAlpha, hitungWarna
 *  - Grid: sinyalTepi, cariPitch, medanFasa (fasa grid lokal, dirata-ratakan melingkar), sampelGrid (moda inti sel)
 *  - Warna: keOklab, dariOklab, jarakOk, kuantisasi (median cut + k-means tertimbang di OKLab), petakanPalet
 *  - Tinjauan: tulisTeks (font bitmap 3x5), lembarTinjau (latar putih/krem/hijau/gelap), susun (baris gambar berlabel)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { PNG } = require('pngjs');

/* ------------------------------------------------------------------ IO & dasar */

export function baca(f) {
  const p = PNG.sync.read(fs.readFileSync(f));
  return { w: p.width, h: p.height, d: p.data };
}

export function tulis(f, img) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const p = new PNG({ width: img.w, height: img.h });
  img.d.copy(p.data);
  fs.writeFileSync(f, PNG.sync.write(p, { colorType: 6 }));
}

export function buat(w, h, isi = [0, 0, 0, 0]) {
  const d = Buffer.alloc(w * h * 4);
  if (isi.some((v) => v)) for (let i = 0; i < w * h; i++) { d[i * 4] = isi[0]; d[i * 4 + 1] = isi[1]; d[i * 4 + 2] = isi[2]; d[i * 4 + 3] = isi[3] ?? 255; }
  return { w, h, d };
}

export const salin = (img) => ({ w: img.w, h: img.h, d: Buffer.from(img.d) });
export const idx = (img, x, y) => (y * img.w + x) * 4;
export const buram = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.d[idx(img, x, y) + 3] >= 128;

/** Potong kotak; bagian di luar sumber menjadi transparan. */
export function potong(img, x0, y0, w, h) {
  const o = buat(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y;
    if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
    img.d.copy(o.d, (y * w + x) * 4, idx(img, sx, sy), idx(img, sx, sy) + 4);
  }
  return o;
}

/** Tempel src ke dst di (x,y); hanya piksel src ber-alpha >= 128 yang ditulis (alpha biner). */
export function tempel(dst, src, x0, y0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const dx = x0 + x, dy = y0 + y;
    if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue;
    const i = (y * src.w + x) * 4;
    if (src.d[i + 3] < 128) continue;
    const j = idx(dst, dx, dy);
    dst.d[j] = src.d[i]; dst.d[j + 1] = src.d[i + 1]; dst.d[j + 2] = src.d[i + 2]; dst.d[j + 3] = 255;
  }
  return dst;
}

/** Pembesaran nearest-neighbour faktor bulat. */
export function perbesar(img, k) {
  k = Math.max(1, Math.round(k));
  const o = buat(img.w * k, img.h * k);
  for (let y = 0; y < o.h; y++) {
    const sy = (y / k) | 0;
    for (let x = 0; x < o.w; x++) img.d.copy(o.d, (y * o.w + x) * 4, idx(img, (x / k) | 0, sy), idx(img, (x / k) | 0, sy) + 4);
  }
  return o;
}

/** Komposit di atas latar polos: alpha >= 128 -> RGB piksel, lainnya -> latar. Hasil buram penuh. */
export function datarkan(img, latar = [255, 255, 255]) {
  const o = buat(img.w, img.h);
  for (let i = 0; i < img.w * img.h; i++) {
    const a = img.d[i * 4 + 3] >= 128;
    o.d[i * 4] = a ? img.d[i * 4] : latar[0];
    o.d[i * 4 + 1] = a ? img.d[i * 4 + 1] : latar[1];
    o.d[i * 4 + 2] = a ? img.d[i * 4 + 2] : latar[2];
    o.d[i * 4 + 3] = 255;
  }
  return o;
}

export function cermin(img) {
  const o = buat(img.w, img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) img.d.copy(o.d, idx(o, img.w - 1 - x, y), idx(img, x, y), idx(img, x, y) + 4);
  return o;
}

/** Kotak alpha (alpha >= ambang). null jika kosong. */
export function kotakAlpha(img, ambang = 128) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.d[idx(img, x, y) + 3] < ambang) continue;
    n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return n ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n } : null;
}

/** Paksa alpha biner. */
export function binerkanAlpha(img, ambang = 128) {
  for (let i = 3; i < img.d.length; i += 4) img.d[i] = img.d[i] >= ambang ? 255 : 0;
  for (let i = 0; i < img.d.length; i += 4) if (!img.d[i + 3]) { img.d[i] = 0; img.d[i + 1] = 0; img.d[i + 2] = 0; }
  return img;
}

/** Warna unik di piksel buram: Map 'r,g,b' -> jumlah. */
export function hitungWarna(img) {
  const m = new Map();
  for (let i = 0; i < img.d.length; i += 4) {
    if (img.d[i + 3] < 128) continue;
    const k = `${img.d[i]},${img.d[i + 1]},${img.d[i + 2]}`;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

export const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
export const dariHex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

/* ------------------------------------------------------------------ Grid */

/**
 * Sinyal tepi di area buram: kol[y*w+x] = |RGB(x) - RGB(x-1)| (batas di antara x-1 dan x),
 * bar[y*w+x] = |RGB(x,y) - RGB(x,y-1)|. Pasangan yang salah satunya transparan bernilai 0
 * (tidak membaca RGB tersembunyi).
 */
export function sinyalTepi(img) {
  const { w, h, d } = img;
  const kol = new Float32Array(w * h), bar = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] < 128) continue;
    if (x > 0 && d[i - 1] >= 128) kol[y * w + x] = Math.abs(d[i] - d[i - 4]) + Math.abs(d[i + 1] - d[i - 3]) + Math.abs(d[i + 2] - d[i - 2]);
    if (y > 0 && d[i - w * 4 + 3] >= 128) bar[y * w + x] = Math.abs(d[i] - d[i - w * 4]) + Math.abs(d[i + 1] - d[i - w * 4 + 1]) + Math.abs(d[i + 2] - d[i - w * 4 + 2]);
  }
  return { kol, bar, w, h };
}

/** Skor fasa satu proyeksi: proporsi energi tepi yang jatuh dalam +-0,75 px dari garis grid, dibagi lebar garis. */
function skorFasa(sig, a0, a1, p, f) {
  let s = 0, t = 0;
  for (let i = a0; i < a1; i++) {
    const v = sig[i]; if (!v) continue;
    const g = ((i - f) % p + p) % p;
    t += v; if (Math.min(g, p - g) < 0.75) s += v;
  }
  return t ? (s / t) / (1.5 / p) : 0;
}

/** Proyeksi sinyal tepi dalam kotak: per kolom (untuk kol) atau per baris (untuk bar). */
export function proyeksi(sin, kotak, sumbu) {
  const { x, y, w, h } = kotak;
  const out = new Float64Array(sumbu === 'x' ? sin.w : sin.h);
  const s = sumbu === 'x' ? sin.kol : sin.bar;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) out[sumbu === 'x' ? xx : yy] += s[yy * sin.w + xx];
  return out;
}

/** Cari pitch & fasa terbaik pada kotak. rentang [pMin, pMax], langkah 0,02. */
export function cariPitch(img, kotak = { x: 0, y: 0, w: img.w, h: img.h }, pMin = 3, pMax = 12, sin = sinyalTepi(img)) {
  const hasil = {};
  for (const sb of ['x', 'y']) {
    const pr = proyeksi(sin, kotak, sb);
    const a0 = sb === 'x' ? kotak.x : kotak.y, a1 = a0 + (sb === 'x' ? kotak.w : kotak.h);
    const daftar = [];
    for (let p = pMin; p <= pMax + 1e-9; p += 0.02) {
      let best = { skor: -1 };
      for (let f = 0; f < p; f += 0.25) { const s = skorFasa(pr, a0, a1, p, f); if (s > best.skor) best = { p: +p.toFixed(2), f, skor: +s.toFixed(3) }; }
      daftar.push(best);
    }
    daftar.sort((a, b) => b.skor - a.skor);
    hasil[sb] = daftar.slice(0, 5);
  }
  return hasil;
}

/**
 * Medan fasa lokal. Untuk ubin (ukuran `ubin`, langkah ubin/2) cari fasa f (mod p) terbaik untuk kolom & baris;
 * fasa disimpan sebagai vektor satuan (cos, sin 2*pi*f/p) berbobot energi*kepercayaan, lalu dihaluskan
 * dengan Gauss (sigma = `halus` ubin). Rata-rata melingkar menghindari lompatan palsu di batas p -> 0.
 * Mengembalikan fungsi koreksi (x,y) -> [dx, dy] relatif ke grid global (ox, oy), dalam (-p/2, p/2].
 */
export function medanFasa(img, { px, py, ox, oy, ubin = 64, halus = 1.2, sin = sinyalTepi(img) }) {
  const langkah = ubin / 2;
  const nx = Math.ceil(img.w / langkah), ny = Math.ceil(img.h / langkah);
  const vx = new Float64Array(nx * ny * 2), vy = new Float64Array(nx * ny * 2), wx = new Float64Array(nx * ny), wy = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = { x: Math.max(0, Math.round(i * langkah + langkah / 2 - ubin / 2)), y: Math.max(0, Math.round(j * langkah + langkah / 2 - ubin / 2)) };
    k.w = Math.min(ubin, img.w - k.x); k.h = Math.min(ubin, img.h - k.y);
    for (const [sb, p, v, wv] of [['x', px, vx, wx], ['y', py, vy, wy]]) {
      const pr = proyeksi(sin, k, sb);
      const a0 = sb === 'x' ? k.x : k.y, a1 = a0 + (sb === 'x' ? k.w : k.h);
      let tot = 0; for (let a = a0; a < a1; a++) tot += pr[a];
      if (tot < 1500) continue; // ubin hampir kosong/datar
      let best = { skor: -1, f: 0 };
      for (let f = 0; f < p; f += 0.125) { const s = skorFasa(pr, a0, a1, p, f); if (s > best.skor) best = { skor: s, f }; }
      const yakin = Math.max(0, best.skor - 1); // 1 = acak
      const bobot = yakin * Math.sqrt(tot);
      const t = (2 * Math.PI * best.f) / p;
      const n = j * nx + i;
      v[n * 2] = Math.cos(t) * bobot; v[n * 2 + 1] = Math.sin(t) * bobot; wv[n] = bobot;
    }
  }
  const halusVec = (v, wv, p, o0) => {
    const r = Math.ceil(halus * 3);
    const hasil = new Float64Array(nx * ny);
    const g0 = ((o0 % p) + p) % p;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let c = 0, s = 0, wt = 0;
      for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) {
        const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const g = Math.exp(-(a * a + b * b) / (2 * halus * halus));
        const n = jj * nx + ii; c += v[n * 2] * g; s += v[n * 2 + 1] * g; wt += wv[n] * g;
      }
      let f = g0;
      if (wt > 0 && Math.hypot(c, s) > 1e-6) f = ((Math.atan2(s, c) / (2 * Math.PI)) * p + p) % p;
      let dlt = f - g0; dlt = ((dlt % p) + p) % p; if (dlt > p / 2) dlt -= p;
      hasil[j * nx + i] = dlt;
    }
    return hasil;
  };
  const dxs = halusVec(vx, wx, px, ox), dys = halusVec(vy, wy, py, oy);
  const ambil = (arr, x, y) => {
    // bilinear antar pusat ubin; hindari interpolasi melewati lompatan > p/2 (ambil tetangga terdekat saja)
    const fx = Math.min(nx - 1, Math.max(0, x / langkah - 0.5)), fy = Math.min(ny - 1, Math.max(0, y / langkah - 0.5));
    const i0 = Math.floor(fx), j0 = Math.floor(fy), i1 = Math.min(nx - 1, i0 + 1), j1 = Math.min(ny - 1, j0 + 1);
    const tx = fx - i0, ty = fy - j0;
    const a = arr[j0 * nx + i0], b = arr[j0 * nx + i1], c = arr[j1 * nx + i0], e = arr[j1 * nx + i1];
    const mx = Math.max(a, b, c, e), mn = Math.min(a, b, c, e);
    if (mx - mn > 2) return arr[Math.round(fy) * nx + Math.round(fx)];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
  };
  const fn = (x, y) => [ambil(dxs, x, y), ambil(dys, x, y)];
  fn.peta = { nx, ny, langkah, dxs, dys };
  return fn;
}

/**
 * Sampel sumber "bergaya piksel" ke grid native.
 * opsi: sx, sy (piksel sumber per piksel seni), ox, oy (koordinat sumber sudut kiri-atas sel (0,0)),
 *       w, h (ukuran native), inti (porsi tengah sel yang disampel, 0,55), koreksi (fungsi (x,y)->[dx,dy] | null),
 *       toleransi (jarak RGB untuk satu klaster, 36), ambangAlpha (0,5)
 * Warna sel = rata-rata anggota klaster terpadat (moda) di jendela inti, hanya piksel alpha >= 128.
 * Alpha sel = mayoritas piksel buram di jendela inti.
 * Laporan: jumlah sel ambigu (klaster pemenang < 50 % piksel buram jendela) & alpha ambigu (35-65 %).
 */
export function sampelGrid(img, o) {
  const { sx, sy, ox, oy, w, h } = o;
  const inti = o.inti ?? 0.55, tol = o.toleransi ?? 36, ambA = o.ambangAlpha ?? 0.5;
  const out = buat(w, h);
  const ambigu = new Uint8Array(w * h); // 1 = warna ambigu, 2 = alpha ambigu
  let nAmbWarna = 0, nAmbAlpha = 0, nIsi = 0;
  const r = [], g = [], b = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let cx = ox + (i + 0.5) * sx, cy = oy + (j + 0.5) * sy;
    if (o.koreksi) { const [dx, dy] = o.koreksi(cx, cy); cx += dx; cy += dy; }
    const hx = (inti * sx) / 2, hy = (inti * sy) / 2;
    const x0 = Math.ceil(cx - hx - 0.5), x1 = Math.floor(cx + hx - 0.5), y0 = Math.ceil(cy - hy - 0.5), y1 = Math.floor(cy + hy - 0.5);
    r.length = g.length = b.length = 0;
    let total = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= img.w || y >= img.h) { total++; continue; }
      total++;
      const k = (y * img.w + x) * 4;
      if (img.d[k + 3] < 128) continue;
      r.push(img.d[k]); g.push(img.d[k + 1]); b.push(img.d[k + 2]);
    }
    const n = r.length;
    const fa = total ? n / total : 0;
    if (fa > 0.35 && fa < 0.65) { ambigu[j * w + i] |= 2; nAmbAlpha++; }
    if (fa < ambA || !n) continue;
    // klaster terpadat
    let bi = 0, bc = -1;
    for (let p = 0; p < n; p++) {
      let c = 0;
      for (let q = 0; q < n; q++) if (Math.abs(r[p] - r[q]) + Math.abs(g[p] - g[q]) + Math.abs(b[p] - b[q]) <= tol) c++;
      if (c > bc) { bc = c; bi = p; }
    }
    let sr = 0, sg = 0, sb = 0, m = 0;
    for (let q = 0; q < n; q++) if (Math.abs(r[bi] - r[q]) + Math.abs(g[bi] - g[q]) + Math.abs(b[bi] - b[q]) <= tol) { sr += r[q]; sg += g[q]; sb += b[q]; m++; }
    const k = (j * w + i) * 4;
    out.d[k] = Math.round(sr / m); out.d[k + 1] = Math.round(sg / m); out.d[k + 2] = Math.round(sb / m); out.d[k + 3] = 255;
    nIsi++;
    if (bc / n < 0.5) { ambigu[j * w + i] |= 1; nAmbWarna++; }
  }
  return { img: out, ambigu, laporan: { w, h, isi: nIsi, ambiguWarna: nAmbWarna, ambiguAlpha: nAmbAlpha } };
}

/* ------------------------------------------------------------------ Warna (OKLab) */

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const gam = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); };

export function keOklab([r, g, b]) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export function dariOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}

/** Jarak OKLab (L sedikit diberatkan supaya tangga terang-gelap terjaga). */
export const jarakOk = (p, q) => Math.hypot((p[0] - q[0]) * 1.2, p[1] - q[1], p[2] - q[2]);

/**
 * Kuantisasi warna gabungan beberapa gambar ke <= n warna.
 * warna: Array<{ c:[r,g,b], n:jumlah }>. bobot per warna = n ** eksponen (0,5 memberi suara pada warna kecil
 * seperti bibir/putih mata). Median cut untuk benih, lalu k-means (Lloyd) di OKLab.
 * kunci: warna wajib (mis. hitam garis) yang tidak boleh hilang; dimasukkan sebagai pusat tetap.
 */
export function kuantisasi(warna, n, { eksponen = 0.5, iterasi = 30, kunci = [] } = {}) {
  const titik = warna.map((w) => ({ lab: keOklab(w.c), bobot: w.n ** eksponen, n: w.n, c: w.c }));
  // median cut di OKLab
  let kotak = [titik];
  while (kotak.length < n - kunci.length) {
    let bi = -1, bs = -1, bsb = 0;
    kotak.forEach((k, i) => {
      if (k.length < 2) return;
      for (let s = 0; s < 3; s++) {
        let mn = Infinity, mx = -Infinity; for (const t of k) { mn = Math.min(mn, t.lab[s]); mx = Math.max(mx, t.lab[s]); }
        const berat = k.reduce((a, t) => a + t.bobot, 0);
        const sk = (mx - mn) * (s === 0 ? 1.2 : 1) * Math.sqrt(berat);
        if (sk > bs) { bs = sk; bi = i; bsb = s; }
      }
    });
    if (bi < 0) break;
    const k = kotak[bi].sort((a, b) => a.lab[bsb] - b.lab[bsb]);
    const tot = k.reduce((a, t) => a + t.bobot, 0);
    let acc = 0, cut = 1;
    for (let i = 0; i < k.length; i++) { acc += k[i].bobot; if (acc >= tot / 2) { cut = Math.max(1, Math.min(k.length - 1, i)); break; } }
    kotak.splice(bi, 1, k.slice(0, cut), k.slice(cut));
  }
  let pusat = kotak.map((k) => { const s = [0, 0, 0]; let wt = 0; for (const t of k) { for (let q = 0; q < 3; q++) s[q] += t.lab[q] * t.bobot; wt += t.bobot; } return s.map((v) => v / wt); });
  const tetap = kunci.map((c) => keOklab(c));
  for (let it = 0; it < iterasi; it++) {
    const semua = [...tetap, ...pusat];
    const jum = pusat.map(() => [0, 0, 0, 0]);
    for (const t of titik) {
      let bi = 0, bd = Infinity;
      semua.forEach((p, i) => { const dd = jarakOk(t.lab, p); if (dd < bd) { bd = dd; bi = i; } });
      if (bi < tetap.length) continue;
      const j = jum[bi - tetap.length]; for (let q = 0; q < 3; q++) j[q] += t.lab[q] * t.bobot; j[3] += t.bobot;
    }
    pusat = pusat.map((p, i) => (jum[i][3] ? jum[i].slice(0, 3).map((v) => v / jum[i][3]) : p));
  }
  const hasil = [...kunci.map((c) => [...c]), ...pusat.map((p) => dariOklab(p))];
  // buang duplikat RGB
  const unik = []; const seen = new Set();
  for (const c of hasil) { const k = c.join(','); if (!seen.has(k)) { seen.add(k); unik.push(c); } }
  return unik;
}

/** Petakan setiap piksel buram ke warna palet terdekat (OKLab). Alpha tetap biner. */
export function petakanPalet(img, palet) {
  const lab = palet.map(keOklab);
  const cache = new Map();
  const o = salin(img);
  for (let i = 0; i < o.d.length; i += 4) {
    if (o.d[i + 3] < 128) { o.d[i] = o.d[i + 1] = o.d[i + 2] = o.d[i + 3] = 0; continue; }
    const k = (o.d[i] << 16) | (o.d[i + 1] << 8) | o.d[i + 2];
    let bi = cache.get(k);
    if (bi === undefined) {
      const L = keOklab([o.d[i], o.d[i + 1], o.d[i + 2]]);
      let bd = Infinity; bi = 0;
      lab.forEach((p, j) => { const dd = jarakOk(L, p); if (dd < bd) { bd = dd; bi = j; } });
      cache.set(k, bi);
    }
    o.d[i] = palet[bi][0]; o.d[i + 1] = palet[bi][1]; o.d[i + 2] = palet[bi][2]; o.d[i + 3] = 255;
  }
  return o;
}

/* ------------------------------------------------------------------ Tinjauan */

// Font bitmap 3x5 (baris atas -> bawah, 3 bit per baris). Cukup untuk label & penggaris.
const FONT = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', '/': '001001010100100',
  '_': '000000000000111', ' ': '000000000000000', 'x': '000101010101000', '(': '010100100100010', ')': '010001001001010', '=': '000111000111000', '%': '101001010100101',
};

/** Tulis teks (huruf besar) dengan font 3x5, skala k. */
export function tulisTeks(img, teks, x, y, warna = [0, 0, 0], k = 2) {
  let cx = x;
  for (const ch of String(teks).toUpperCase()) {
    const f = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      if (f[r * 3 + c] !== '1') continue;
      for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) {
        const px = cx + c * k + xx, py = y + r * k + yy;
        if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
        const i = idx(img, px, py); img.d[i] = warna[0]; img.d[i + 1] = warna[1]; img.d[i + 2] = warna[2]; img.d[i + 3] = 255;
      }
    }
    cx += 4 * k;
  }
  return img;
}

export function isiKotak(img, x, y, w, h, c) {
  for (let yy = Math.max(0, y); yy < Math.min(img.h, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(img.w, x + w); xx++) {
    const i = idx(img, xx, yy); img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = c[3] ?? 255;
  }
}

export const LATAR = { putih: [255, 255, 255], krem: [246, 236, 214], hijau: [72, 160, 96], gelap: [36, 32, 40] };

/**
 * Lembar tinjau: setiap gambar diperbesar k (nearest), diletakkan di atas empat latar (putih, krem, hijau, gelap)
 * berjajar; satu baris per gambar, label di kiri atas baris.
 * item: Array<{ img, label, k? }>.
 */
export function lembarTinjau(item, { k = 4, latar = ['putih', 'krem', 'hijau', 'gelap'], jarak = 8 } = {}) {
  const baris = item.map((it) => { const kk = it.k ?? k; return { ...it, kk, bw: it.img.w * kk, bh: it.img.h * kk }; });
  const lebar = Math.max(...baris.map((b) => b.bw)) + jarak * 2;
  const W = lebar * latar.length, H = baris.reduce((a, b) => a + b.bh + 20 + jarak, jarak);
  const o = buat(W, H, [200, 200, 200, 255]);
  let y = jarak;
  for (const b of baris) {
    tulisTeks(o, b.label ?? '', 4, y, [0, 0, 0], 2);
    y += 14;
    const besar = perbesar(b.img, b.kk);
    latar.forEach((nm, li) => {
      const c = LATAR[nm] ?? nm;
      isiKotak(o, li * lebar + jarak / 2, y - 2, lebar - jarak, b.bh + 4, c);
      tempel(o, besar, li * lebar + jarak, y);
    });
    y += b.bh + 6 + jarak;
  }
  return o;
}

/**
 * Susun beberapa gambar (sudah jadi, buram) berjajar horizontal dengan label di atas, latar abu.
 * item: Array<{ img, label }>. Tinggi baris = maksimum.
 */
export function susun(item, { jarak = 12, latar = [200, 200, 200], kLabel = 2 } = {}) {
  const W = item.reduce((a, it) => a + it.img.w + jarak, jarak), H = Math.max(...item.map((it) => it.img.h)) + jarak * 2 + 6 * kLabel + 4;
  const o = buat(W, H, [...latar, 255]);
  let x = jarak;
  for (const it of item) {
    tulisTeks(o, it.label ?? '', x, jarak / 2, [0, 0, 0], kLabel);
    const tinggi = jarak / 2 + 6 * kLabel + 4;
    for (let y = 0; y < it.img.h; y++) it.img.d.copy(o.d, idx(o, x, tinggi + y), idx(it.img, 0, y), idx(it.img, 0, y) + it.img.w * 4);
    x += it.img.w + jarak;
  }
  return o;
}

/** Tumpuk gambar vertikal (lebar = maksimum), latar abu. */
export function tumpuk(daftar, { jarak = 8, latar = [200, 200, 200] } = {}) {
  const W = Math.max(...daftar.map((g) => g.w)), H = daftar.reduce((a, g) => a + g.h + jarak, 0);
  const o = buat(W, H, [...latar, 255]);
  let y = 0;
  for (const g of daftar) { for (let yy = 0; yy < g.h; yy++) g.d.copy(o.d, idx(o, 0, y + yy), idx(g, 0, yy), idx(g, 0, yy) + g.w * 4); y += g.h + jarak; }
  return o;
}
