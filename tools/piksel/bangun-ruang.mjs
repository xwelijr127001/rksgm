/**
 * BANGUN RUANG PIKSEL (agen ruang-piksel, 27 Sep): lapisan ruang adegan AUTO-1 (Silver Club `meja`/`telepon`,
 * koridor pembuka `pintu-luar`, `parkiran`) + prop meja menjadi seni piksel NATIVE pada kontrak 1 piksel seni = 4 satuan
 * dunia (dunia 1600 x 900 = 400 x 225 piksel).
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/piksel/bangun-ruang.mjs [--tinjau <folder>] [--kering]
 *
 * Alur (deterministik: generator SVG berbenih, Chrome SwiftShader, tanpa acak):
 *  1. Generator SVG ruang dalam GAYA PIKSEL (client/src/cerita/seni/ruang/sumberPiksel.ts: tekstur tipis dibuang,
 *     garis >= 1 piksel, bidang datar) dirender di Chrome headless dengan supersampel 8 x 8 per piksel seni.
 *  2. Palet ruang BERSAMA (<= 48 warna) dari warna moda setiap sel semua lapisan (median cut + k-means OKLab,
 *     tools/piksel/lib.mjs), dengan warna kunci (garis hangat, emas teks, bayang teks).
 *  3. Tiap sel 4 x 4 satuan: setiap sampel dipetakan ke palet, warna sel = MODA suara (bukan rata-rata: tanpa warna
 *     campuran di tepi). Alpha lapisan tumpang = mayoritas sampel buram -> tepat 0/255.
 *  4. Rapikan: piksel yatim yang mirip tetangganya dilebur, lubang/bintik alpha dibuang, garis luar 1 piksel
 *     (warna sendiri digelapkan) di tepi siluet lapisan tumpang.
 *  5. Teks plakat dari LOKASI_AUTO_1.nama (episode/auto-1/teks.ts) ditulis dengan FONT BITMAP buatan tangan (tinggi
 *     huruf besar 7 piksel, baris 1 tebal), emas + bayang 1 piksel, langsung di grid piksel.
 *  6. Tulis client/src/cerita/seni/piksel/ruang-*.png (RGBA native, lapisan identik di-dedupe) dan ruang.json
 *     (manifest per lokasi: kotak dunia, ukuran piksel, z, engsel, prop, tempat, teks plakat). Panggung memuatnya
 *     lewat import.meta.glob (ui/panggung/sumberPiksel.ts) & membacanya dengan bacaManifestRuang (ui/panggung/piksel.ts).
 *  7. --tinjau <folder>: lembar tinjau (tiap lokasi disusun pada 4 & 2 px/piksel seni, lembar prop & teks).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import * as L from './lib.mjs';
import { sumberPiksel } from '../../client/src/cerita/seni/ruang/sumberPiksel.ts';
import { LOKASI_AUTO_1 } from '../../client/src/cerita/episode/auto-1/teks.ts';

const ROOT = L.ROOT;
const require = createRequire(path.join(ROOT, 'package.json'));
const { PNG } = require('pngjs');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const KELUAR = path.join(ROOT, 'client/src/cerita/seni/piksel');
const P = 4; // satuan dunia per piksel seni
const SS = 2; // piksel render per satuan dunia -> 8 x 8 sampel per piksel seni
const N_PALET = 48;

const arg = process.argv.slice(2);
const TINJAU = arg.includes('--tinjau') ? arg[arg.indexOf('--tinjau') + 1] : null;
const KERING = arg.includes('--kering');

/* ------------------------------------------------------------------ warna */

const GARIS = L.dariHex('#3a2620');
const EMAS = L.dariHex('#e9c46a');
const EMAS_TUA = L.dariHex('#b8892f');
const BAYANG_TEKS = L.dariHex('#26120a');
/**
 * Warna KUNCI palet selain garis & teks: bidang datar identitas Silver Club yang tidak boleh bergeser saat k-means
 * (dinding pasir hangat v5 + genangan cahaya 2 nada, puncak meja jati v5, aspal parkiran, walnut plakat, kain mauve kursi
 * tub). Harus sama dengan warna datar di generator gaya piksel (seni/ruang/dinding.ts, meja.ts, parkiran.ts, kursi.ts).
 */
const KUNCI_RUANG = ['#d5b788', '#dabd90', '#dfc499', '#cbac7c', '#ad7546', '#c69162', '#9c978e', '#8f8a82', '#553019', '#8c5634', '#361c0d', '#dcaaa2', '#c9948d', '#b27d7b', '#98645f', '#76484b', '#e8841c', '#fbe6b4', '#8f8878', '#b9bec4'].map(L.dariHex);

/* ------------------------------------------------------------------ font bitmap plakat */

/**
 * Font piksel buatan tangan: tinggi huruf besar & asender 7 baris (0-6), x-height 5 (baris 2-6), desender 2 (7-8).
 * Huruf kecil ditulis hanya baris x-height (5 baris) atau lengkap 7 baris bila berasender; desender di properti `d`.
 */
const FONT = (() => {
  const b = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###', '#...', '#...', '#...', '#...', '#...', '.###'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['####', '#...', '#...', '###.', '#...', '#...', '####'], F: ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'], J: ['..##', '...#', '...#', '...#', '...#', '#..#', '.##.'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#...', '#...', '#...', '#...', '#...', '#...', '####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.###', '#...', '#...', '.##.', '...#', '...#', '###.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.##.', '#..#', '#..#', '#..#', '#..#', '#..#', '.##.'], 1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
    2: ['.##.', '#..#', '...#', '..#.', '.#..', '#...', '####'], 3: ['###.', '...#', '...#', '.##.', '...#', '...#', '###.'],
    4: ['#..#', '#..#', '#..#', '####', '...#', '...#', '...#'], 5: ['####', '#...', '#...', '###.', '...#', '...#', '###.'],
    6: ['.##.', '#...', '#...', '###.', '#..#', '#..#', '.##.'], 7: ['####', '...#', '..#.', '..#.', '.#..', '.#..', '.#..'],
    8: ['.##.', '#..#', '#..#', '.##.', '#..#', '#..#', '.##.'], 9: ['.##.', '#..#', '#..#', '.###', '...#', '...#', '.##.'],
  };
  const k = {
    a: ['.##.', '...#', '.###', '#..#', '.###'], b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'], c: ['.##', '#..', '#..', '#..', '.##'],
    d: ['...#', '...#', '.###', '#..#', '#..#', '#..#', '.###'], e: ['.##.', '#..#', '####', '#...', '.###'], f: ['.##', '#..', '###', '#..', '#..', '#..', '#..'],
    g: { r: ['.###', '#..#', '#..#', '#..#', '.###'], d: ['...#', '.##.'] }, h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'],
    i: ['#', '.', '#', '#', '#', '#', '#'], j: { r: ['.#', '..', '.#', '.#', '.#', '.#', '.#'], d: ['.#', '#.'] }, k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
    l: ['#', '#', '#', '#', '#', '#', '#'], m: ['####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'], n: ['###.', '#..#', '#..#', '#..#', '#..#'],
    o: ['.##.', '#..#', '#..#', '#..#', '.##.'], p: { r: ['###.', '#..#', '#..#', '#..#', '###.'], d: ['#...', '#...'] },
    q: { r: ['.###', '#..#', '#..#', '#..#', '.###'], d: ['...#', '...#'] }, r: ['#.##', '##..', '#...', '#...', '#...'], s: ['.###', '#...', '.##.', '...#', '###.'],
    t: ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#'], u: ['#..#', '#..#', '#..#', '#..#', '.###'], v: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
    w: ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'], x: ['#..#', '#..#', '.##.', '#..#', '#..#'], y: { r: ['#..#', '#..#', '#..#', '#..#', '.###'], d: ['...#', '.##.'] },
    z: ['####', '..#.', '.#..', '#...', '####'],
  };
  const f = {};
  const kosong = (w) => '.'.repeat(w);
  for (const [c, rows] of Object.entries(b)) f[c] = [...rows, kosong(rows[0].length), kosong(rows[0].length)];
  for (const [c, v] of Object.entries(k)) {
    const r = Array.isArray(v) ? v : v.r;
    const d = Array.isArray(v) ? [] : v.d;
    const w = r[0].length;
    const atas = r.length === 7 ? r : [kosong(w), kosong(w), ...r];
    f[c] = [...atas, ...(d.length ? d : [kosong(w), kosong(w)])];
  }
  f[' '] = Array(9).fill('...');
  f['.'] = ['.', '.', '.', '.', '.', '.', '#', '.', '.'];
  f[','] = ['..', '..', '..', '..', '..', '.#', '.#', '#.', '..'];
  f['-'] = ['...', '...', '...', '###', '...', '...', '...', '...', '...'];
  f["'"] = ['#', '#', '.', '.', '.', '.', '.', '.', '.'];
  f['&'] = ['.##..', '#..#.', '.##..', '.#..#', '#.##.', '#..#.', '.##.#', '.....', '.....'];
  for (const [c, rows] of Object.entries(f)) if (rows.length !== 9 || rows.some((r) => r.length !== rows[0].length)) throw new Error(`glif ${c} rusak`);
  return f;
})();

/** Lebar teks (piksel) dengan jarak 1 antarhuruf; tebal = +1 per huruf. */
function lebarTeks(teks, tebal = false) {
  let w = 0;
  [...teks].forEach((ch, i) => {
    const g = FONT[ch];
    if (!g) throw new Error(`font plakat tidak punya huruf "${ch}" (nama lokasi "${teks}")`);
    w += g[0].length + (tebal ? 1 : 0) + (i ? 1 : 0);
  });
  return w;
}

/** Tulis teks (baris atas glif di y) ke gambar; kembalikan daftar piksel tinta untuk uji. */
function tulisGlif(img, teks, x0, y0, warna, tebal = false) {
  let x = x0;
  for (const ch of teks) {
    const g = FONT[ch];
    const w = g[0].length;
    for (let r = 0; r < 9; r++) for (let c = 0; c < w; c++) {
      if (g[r][c] !== '#') continue;
      for (const dx of tebal ? [0, 1] : [0]) {
        const px = x + c + dx;
        const py = y0 + r;
        if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
        const i = (py * img.w + px) * 4;
        img.d[i] = warna[0]; img.d[i + 1] = warna[1]; img.d[i + 2] = warna[2]; img.d[i + 3] = 255;
      }
    }
    x += w + (tebal ? 1 : 0) + 1;
  }
}

/**
 * Tata letak nama di kotak teks (piksel seni): satu baris tebal bila muat, selain itu dua baris (kata pertama tebal,
 * sisanya biasa). Kembalikan baris & posisi (x, y baris atas glif).
 */
function tataTeks(nama, kotak) {
  const tinggiBaris = 7;
  const satu = lebarTeks(nama, true);
  if (satu <= kotak.w) {
    return [{ teks: nama, tebal: true, x: kotak.x + Math.floor((kotak.w - satu) / 2), y: kotak.y + Math.floor((kotak.h - tinggiBaris) / 2) }];
  }
  const sp = nama.indexOf(' ');
  if (sp < 0) throw new Error(`nama "${nama}" tidak muat di plakat (${satu} > ${kotak.w} piksel)`);
  const b1 = nama.slice(0, sp);
  const b2 = nama.slice(sp + 1);
  const w1 = lebarTeks(b1, true);
  const w2 = lebarTeks(b2, false);
  if (w1 > kotak.w || w2 > kotak.w) throw new Error(`nama "${nama}" tidak muat di plakat dua baris (${w1}/${w2} > ${kotak.w})`);
  const jarak = 3;
  const total = tinggiBaris * 2 + jarak;
  const y = kotak.y + Math.floor((kotak.h - total) / 2);
  return [
    { teks: b1, tebal: true, x: kotak.x + Math.floor((kotak.w - w1) / 2), y },
    { teks: b2, tebal: false, x: kotak.x + Math.floor((kotak.w - w2) / 2), y: y + tinggiBaris + jarak },
  ];
}

/** Teks plakat: bayang 1 piksel (kanan-bawah) lalu emas; baris tebal diberi sorot emas muda di baris atas glif. */
function tulisPapan(img, nama, kotakDunia) {
  const k = { x: Math.round(kotakDunia.x / P), y: Math.round(kotakDunia.y / P), w: Math.floor(kotakDunia.w / P), h: Math.floor(kotakDunia.h / P) };
  const baris = tataTeks(nama, k);
  for (const b of baris) tulisGlif(img, b.teks, b.x + 1, b.y + 1, BAYANG_TEKS, b.tebal);
  for (const b of baris) tulisGlif(img, b.teks, b.x, b.y, EMAS, b.tebal);
  return baris.map((b) => ({ ...b, w: lebarTeks(b.teks, b.tebal), h: 7 }));
}

/* ------------------------------------------------------------------ render SVG -> sampel */

async function bukaChrome() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', '--disable-lcd-text'],
  });
  return browser;
}

/**
 * Render satu SVG di halaman BARU (halaman yang dipakai ulang lintas ukuran viewport memberi tangkapan yang sedikit
 * berbeda antarjalan: palet bergeser; halaman baru + dua bingkai animasi = hasil identik antarjalan).
 */
async function render(browser, svg, w, h) {
  const page = await browser.newPage();
  try {
    return await renderDi(page, svg, w, h);
  } finally {
    await page.close();
  }
}

async function renderDi(page, svg, w, h) {
  const W = w * SS;
  const H = h * SS;
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">${svg}</svg></body></html>`);
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
  const buf = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
  const p = PNG.sync.read(buf);
  return { w: p.width, h: p.height, d: p.data };
}

const K = P * SS; // sampel per sisi sel

/** Warna wakil sel (moda ember RGB 5 bit, rata-rata anggotanya) + cakupan alpha. */
function wakilSel(src, cx, cy) {
  const ember = new Map();
  let buram = 0;
  for (let y = cy * K; y < cy * K + K; y++) for (let x = cx * K; x < cx * K + K; x++) {
    const i = (y * src.w + x) * 4;
    if (src.d[i + 3] < 128) continue;
    buram++;
    const e = ((src.d[i] >> 3) << 10) | ((src.d[i + 1] >> 3) << 5) | (src.d[i + 2] >> 3);
    let v = ember.get(e);
    if (!v) { v = [0, 0, 0, 0]; ember.set(e, v); }
    v[0] += src.d[i]; v[1] += src.d[i + 1]; v[2] += src.d[i + 2]; v[3]++;
  }
  let best = null;
  for (const v of ember.values()) if (!best || v[3] > best[3]) best = v;
  return { cakupan: buram / (K * K), warna: best ? [Math.round(best[0] / best[3]), Math.round(best[1] / best[3]), Math.round(best[2] / best[3])] : null };
}

/* ------------------------------------------------------------------ palet & kuantisasi */

function petaPalet(palet) {
  const lab = palet.map(L.keOklab);
  const cache = new Map();
  return (r, g, b) => {
    const k = (r << 16) | (g << 8) | b;
    let bi = cache.get(k);
    if (bi === undefined) {
      const q = L.keOklab([r, g, b]);
      let bd = Infinity;
      bi = 0;
      lab.forEach((p, j) => { const dd = L.jarakOk(q, p); if (dd < bd) { bd = dd; bi = j; } });
      cache.set(k, bi);
    }
    return bi;
  };
}

/** Sel -> indeks palet (moda suara sampel) ; -1 = transparan. */
function kuantisasiLapisan(src, pw, ph, buram, peta) {
  const idx = new Int16Array(pw * ph).fill(-1);
  const suara = new Int32Array(64);
  for (let cy = 0; cy < ph; cy++) for (let cx = 0; cx < pw; cx++) {
    suara.fill(0);
    let n = 0;
    for (let y = cy * K; y < cy * K + K; y++) for (let x = cx * K; x < cx * K + K; x++) {
      const i = (y * src.w + x) * 4;
      if (src.d[i + 3] < 128) continue;
      n++;
      suara[peta(src.d[i], src.d[i + 1], src.d[i + 2])]++;
    }
    if (!n || (!buram && n < (K * K) / 2)) continue;
    let bi = 0;
    for (let j = 1; j < 64; j++) if (suara[j] > suara[bi]) bi = j;
    idx[cy * pw + cx] = bi;
  }
  return idx;
}

/* ------------------------------------------------------------------ rapikan */

const T4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const T8 = [...T4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

function rapikan(idx, pw, ph, paletLab, { buram }) {
  const o = Int16Array.from(idx);
  // 1. Piksel yatim: berbeda dari ke-8 tetangga & tetangga mayoritas (>= 5) mirip -> lebur.
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const v = idx[y * pw + x];
    if (v < 0) continue;
    const hitung = new Map();
    let sama = 0;
    let n = 0;
    for (const [dx, dy] of T8) {
      const xx = x + dx; const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= pw || yy >= ph) continue;
      const u = idx[yy * pw + xx];
      n++;
      if (u === v) sama++;
      if (u >= 0) hitung.set(u, (hitung.get(u) || 0) + 1);
    }
    if (sama || n < 5) continue;
    let mu = -1; let mc = 0;
    for (const [u, c] of hitung) if (c > mc) { mc = c; mu = u; }
    if (mc >= 5 && L.jarakOk(paletLab[v], paletLab[mu]) < 0.09) o[y * pw + x] = mu;
  }
  if (!buram) {
    // 2. Bintik buram tanpa tetangga-4 buram dibuang; lubang dengan 4 tetangga buram diisi moda tetangga.
    const a = Int16Array.from(o);
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const i = y * pw + x;
      const tetangga = T4.map(([dx, dy]) => [x + dx, y + dy]).filter(([xx, yy]) => xx >= 0 && yy >= 0 && xx < pw && yy < ph).map(([xx, yy]) => a[yy * pw + xx]);
      const nb = tetangga.filter((u) => u >= 0);
      if (a[i] >= 0 && nb.length === 0) o[i] = -1;
      if (a[i] < 0 && nb.length === 4) {
        const c = new Map(); nb.forEach((u) => c.set(u, (c.get(u) || 0) + 1));
        o[i] = [...c.entries()].sort((p, q) => q[1] - p[1])[0][0];
      }
    }
  }
  return o;
}

/** Garis luar 1 piksel: piksel buram bertetangga-4 transparan (di dalam kotak) -> versi gelap warnanya. */
function garisLuar(idx, pw, ph, gelap) {
  const o = Int16Array.from(idx);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const v = idx[y * pw + x];
    if (v < 0) continue;
    const tepi = T4.some(([dx, dy]) => {
      const xx = x + dx; const yy = y + dy;
      return xx >= 0 && yy >= 0 && xx < pw && yy < ph && idx[yy * pw + xx] < 0;
    });
    if (tepi) o[y * pw + x] = gelap[v];
  }
  return o;
}

/** Untuk tiap warna palet: warna palet lebih gelap terdekat ke (L x 0,6) ber-hue sama; tanpa kandidat -> garis hangat. */
function tabelGelap(palet, paletLab, iGaris) {
  return paletLab.map((c) => {
    const target = [c[0] * 0.6, c[1] * 0.9, c[2] * 0.9];
    let bi = iGaris; let bd = Infinity;
    paletLab.forEach((p, j) => {
      if (p[0] > c[0] - 0.1) return;
      const dd = L.jarakOk(p, target);
      if (dd < bd) { bd = dd; bi = j; }
    });
    return bi;
  });
}

function keGambar(idx, pw, ph, palet) {
  const img = L.buat(pw, ph);
  for (let i = 0; i < pw * ph; i++) {
    const v = idx[i];
    if (v < 0) continue;
    img.d[i * 4] = palet[v][0]; img.d[i * 4 + 1] = palet[v][1]; img.d[i * 4 + 2] = palet[v][2]; img.d[i * 4 + 3] = 255;
  }
  return img;
}

/* ------------------------------------------------------------------ utama */

async function utama() {
  const t0 = Date.now();
  const sumber = sumberPiksel();
  const nama = LOKASI_AUTO_1.nama;
  const browser = await bukaChrome();
  const tugas = [];
  try {
    for (const lok of sumber.lokasi) {
      for (const l of lok.lapisan) {
        const src = await render(browser, l.svg, l.w, l.h);
        tugas.push({ jenis: 'lapisan', lok: lok.lokasi, l, src, pw: l.w / P, ph: l.h / P, buram: l.buram, garis: l.garisLuar });
      }
    }
    for (const p of sumber.prop) {
      if (p.w % P || p.h % P || p.jangkar.x % P || p.jangkar.y % P) throw new Error(`prop ${p.id}: ukuran/jangkar bukan kelipatan ${P}`);
      const src = await render(browser, p.svg, p.w, p.h);
      tugas.push({ jenis: 'prop', p, src, pw: p.w / P, ph: p.h / P, buram: false, garis: true });
    }
  } finally {
    await browser.close();
  }

  // Palet bersama dari warna wakil sel semua lapisan & prop.
  const kumpul = new Map();
  for (const t of tugas) {
    for (let cy = 0; cy < t.ph; cy++) for (let cx = 0; cx < t.pw; cx++) {
      const s = wakilSel(t.src, cx, cy);
      if (!s.warna || (!t.buram && s.cakupan < 0.5)) continue;
      const k = s.warna.join(',');
      const v = kumpul.get(k);
      if (v) v.n++; else kumpul.set(k, { c: s.warna, n: t.jenis === 'prop' ? 6 : 1 });
      if (v && t.jenis === 'prop') v.n += 5; // prop kecil tetap bersuara
    }
  }
  const palet = L.kuantisasi([...kumpul.values()], N_PALET, { eksponen: 0.5, iterasi: 24, kunci: [GARIS, EMAS, BAYANG_TEKS, EMAS_TUA, ...KUNCI_RUANG] });
  const paletLab = palet.map(L.keOklab);
  const peta = petaPalet(palet);
  const iGaris = 0;
  const gelap = tabelGelap(palet, paletLab, iGaris);

  // Kuantisasi + rapikan tiap lapisan/prop.
  const hasil = [];
  for (const t of tugas) {
    let idx = kuantisasiLapisan(t.src, t.pw, t.ph, t.buram, peta);
    idx = rapikan(idx, t.pw, t.ph, paletLab, { buram: t.buram });
    if (t.garis) idx = garisLuar(idx, t.pw, t.ph, gelap);
    const img = keGambar(idx, t.pw, t.ph, palet);
    hasil.push({ ...t, img, src: undefined });
  }

  // Teks plakat di latar (dari konfigurasi episode).
  const teksPapan = {};
  for (const h of hasil) {
    if (h.jenis !== 'lapisan' || h.l.id !== 'latar') continue;
    const lok = sumber.lokasi.find((x) => x.lokasi === h.lok);
    if (!lok.papan) continue;
    teksPapan[h.lok] = tulisPapan(h.img, nama, lok.papan);
  }

  // Dedupe & nama berkas.
  const berkas = new Map(); // hash -> nama
  const namaBerkas = (h) => (h.jenis === 'prop' ? `ruang-prop-${kebab(h.p.id)}.png` : `ruang-${h.lok}-${kebab(h.l.id)}.png`);
  const tulisan = [];
  for (const h of hasil) {
    const png = new PNG({ width: h.img.w, height: h.img.h });
    h.img.d.copy(png.data);
    const buf = PNG.sync.write(png, { colorType: 6 });
    const hash = crypto.createHash('sha1').update(h.img.d).digest('hex');
    if (!berkas.has(hash)) { berkas.set(hash, namaBerkas(h)); tulisan.push({ nama: namaBerkas(h), buf }); }
    h.berkas = berkas.get(hash);
    h.hash = hash.slice(0, 12);
  }

  // Manifest.
  const manifest = {
    versi: 1,
    dibuat: 'tools/piksel/bangun-ruang.mjs',
    piksel: P,
    dunia: { w: 1600, h: 900, pw: 400, ph: 225 },
    palet: palet.map(L.hex),
    /** Warna di luar dunia (letterbox panggung, dibaca ui/panggung/piksel.ts): kayu gelap hangat, netral untuk semua lokasi. */
    warnaTepi: '#2b1d14',
    teksPapan: nama,
    lokasi: {},
    prop: {},
  };
  for (const lok of sumber.lokasi) {
    const lapisan = hasil.filter((h) => h.jenis === 'lapisan' && h.lok === lok.lokasi).map((h) => ({
      id: h.l.id, berkas: h.berkas, x: h.l.x, y: h.l.y, w: h.l.w, h: h.l.h, pw: h.pw, ph: h.ph, z: h.l.z, alpha: !h.buram,
      ...(h.l.engsel ? { engsel: h.l.engsel } : {}),
    }));
    const t = lok.tempat;
    manifest.lokasi[lok.lokasi] = {
      lapisan,
      ...(lok.bukaan ? { bukaan: lok.bukaan } : {}),
      ...(lok.papan && teksPapan[lok.lokasi] ? {
        papan: {
          teks: nama,
          kotak: { x: lok.papan.x, y: lok.papan.y, w: lok.papan.w, h: lok.papan.h },
          baris: teksPapan[lok.lokasi].map((b) => ({ teks: b.teks, tebal: b.tebal, x: b.x * P, y: b.y * P, w: b.w * P, h: b.h * P })),
        },
      } : {}),
      tempat: t,
    };
  }
  for (const h of hasil.filter((x) => x.jenis === 'prop')) {
    manifest.prop[h.p.id] = {
      berkas: h.berkas, w: h.p.w, h: h.p.h, pw: h.pw, ph: h.ph, jangkar: h.p.jangkar,
      ...(h.p.diLapisan ? { diLapisan: h.p.diLapisan } : {}),
    };
  }

  const ukuran = tulisan.reduce((a, t) => a + t.buf.length, 0);
  console.log(`palet ${palet.length} warna; ${hasil.length} gambar -> ${tulisan.length} berkas, ${(ukuran / 1024).toFixed(1)} KB; ${((Date.now() - t0) / 1000).toFixed(1)} dtk`);
  for (const h of hasil) console.log(`  ${(h.jenis === 'prop' ? `prop ${h.p.id}` : `${h.lok}.${h.l.id}`).padEnd(24)} ${String(h.pw).padStart(3)}x${String(h.ph).padEnd(3)} ${h.berkas}`);

  if (!KERING) {
    fs.mkdirSync(KELUAR, { recursive: true });
    for (const f of fs.readdirSync(KELUAR)) if (/^ruang-.*\.png$/.test(f) && !tulisan.some((t) => t.nama === f)) fs.unlinkSync(path.join(KELUAR, f));
    for (const t of tulisan) fs.writeFileSync(path.join(KELUAR, t.nama), t.buf);
    fs.writeFileSync(path.join(KELUAR, 'ruang.json'), JSON.stringify(manifest, null, 1) + '\n');
    console.log(`ditulis: ${path.relative(ROOT, KELUAR)}/ruang-*.png, ruang.json`);
  }

  if (TINJAU) await tinjau(TINJAU, hasil, sumber, manifest, palet);
}

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/* ------------------------------------------------------------------ lembar tinjau (dasar) */

async function tinjau(dir, hasil, sumber, manifest, palet) {
  fs.mkdirSync(dir, { recursive: true });
  for (const lok of sumber.lokasi) {
    const dunia = L.buat(400, 225, [0, 0, 0, 255]);
    for (const h of hasil.filter((x) => x.jenis === 'lapisan' && x.lok === lok.lokasi).sort((a, b) => a.l.z - b.l.z)) {
      L.tempel(dunia, h.img, h.l.x / P, h.l.y / P);
    }
    L.tulis(path.join(dir, `dunia-${lok.lokasi}-1x.png`), dunia);
    L.tulis(path.join(dir, `dunia-${lok.lokasi}-4x.png`), L.perbesar(dunia, 4));
    L.tulis(path.join(dir, `dunia-${lok.lokasi}-2x.png`), L.perbesar(dunia, 2));
  }
  // Prop & palet.
  const props = hasil.filter((x) => x.jenis === 'prop');
  L.tulis(path.join(dir, 'prop-4x.png'), L.lembarTinjau(props.map((h) => ({ img: h.img, label: h.p.id, k: 4 })), { k: 4 }));
  const pal = L.buat(palet.length * 12, 12, [0, 0, 0, 255]);
  palet.forEach((c, i) => L.isiKotak(pal, i * 12, 0, 12, 12, c));
  L.tulis(path.join(dir, 'palet.png'), L.perbesar(pal, 2));
  fs.writeFileSync(path.join(dir, 'manifest-salinan.json'), JSON.stringify(manifest, null, 1));
  console.log(`tinjau: ${dir}`);
}

await utama();
