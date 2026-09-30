/**
 * Bu Rina — langkah 1: lepas latar putih JPG TANPA chroma key pada tokoh.
 *
 *   node tools/piksel/rina-latar.mjs
 *
 * Masukan : character/bu-rina-pixel-v1/*.jpg (tidak diubah; di-decode ffmpeg ke RGBA di memori/berkas sementara).
 * Keluaran: character/piksel/bu-rina/sumber/<lembar>-alfa.png (resolusi asli, alpha 0/255) + laporan JSON.
 *
 * Cara:
 *  1. Isi-banjir (4-tetangga) dari SEMUA piksel tepi gambar melewati piksel hampir putih (min RGB >= 226 dan
 *     max-min <= 30). Isi berhenti di garis luar gelap; daerah terang di dalam tokoh (apron krem, kilap kunci,
 *     putih mata) tidak tersentuh selama tidak tersambung ke tepi melewati piksel hampir putih.
 *  2. Pijar/halo JPEG di sisi luar garis: paling banyak 3 putaran, piksel non-latar yang bertetangga (8) dengan
 *     latar dan terang-pucat (min >= 188, max-min <= 48) ikut menjadi latar. Kedalaman terbatas -> tidak bisa
 *     memakan bidang terang di dalam.
 *  3. Kantong latar tertutup (mis. celah lengan-badan, celah tumit) hanya dibuang bila luas >= 30 px dan SANGAT putih
 *     (rata-rata min >= 238, rata-rata max-min <= 9). Putih mata di lembar badan terukur max-min 9,9-15 (luntur kroma
 *     JPEG dari kulit) sehingga tetap; apron jauh lebih kuning.
 *     Daftar kantong dicatat di laporan untuk diperiksa. Lembar ekspresi: kantong TIDAK dibuang (semua kantong
 *     >= 80 px di sana ternyata putih mata besar; lembar itu hanya kepala sehingga tidak punya celah latar tertutup).
 *  4. Bintik buram lepas < 40 px (sisa noise) dibuang.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as L from './lib.mjs';

const SUMBER = path.join(L.ROOT, 'character', 'bu-rina-pixel-v1');
const KELUAR = path.join(L.ROOT, 'character', 'piksel', 'bu-rina', 'sumber');
export const LEMBAR = ['pose', 'ekspresi', 'jalan', 'gestur-duduk'];

/** Decode JPG -> gambar RGBA memakai ffmpeg (konversi kroma penuh, pembulatan akurat). */
export function decodeJpg(f) {
  const tmp = path.join(os.tmpdir(), `rina-${process.pid}-${path.basename(f, '.jpg')}.png`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', f, '-sws_flags', 'bicubic+accurate_rnd+full_chroma_int', '-pix_fmt', 'rgba', tmp]);
  const img = L.baca(tmp);
  fs.rmSync(tmp, { force: true });
  return img;
}

const minc = (d, i) => Math.min(d[i], d[i + 1], d[i + 2]);
const sat = (d, i) => Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);

export function lepasLatar(img, { buangKantong = true } = {}) {
  const { w, h, d } = img;
  const N = w * h;
  const latar = new Uint8Array(N);
  const putih = (p) => minc(d, p * 4) >= 226 && sat(d, p * 4) <= 30;
  // 1. isi banjir dari tepi
  const antre = new Int32Array(N); let a = 0, b = 0;
  const dorong = (p) => { if (!latar[p] && putih(p)) { latar[p] = 1; antre[b++] = p; } };
  for (let x = 0; x < w; x++) { dorong(x); dorong((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { dorong(y * w); dorong(y * w + w - 1); }
  while (a < b) {
    const p = antre[a++], x = p % w, y = (p / w) | 0;
    if (x > 0) dorong(p - 1); if (x < w - 1) dorong(p + 1); if (y > 0) dorong(p - w); if (y < h - 1) dorong(p + w);
  }
  // 2. halo terbatas
  let nHalo = 0;
  for (let it = 0; it < 3; it++) {
    const tambah = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x; if (latar[p]) continue;
      const i = p * 4; if (minc(d, i) < 188 || sat(d, i) > 48) continue;
      let dekat = false;
      for (let dy = -1; dy <= 1 && !dekat; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        if (latar[yy * w + xx]) { dekat = true; break; }
      }
      if (dekat) tambah.push(p);
    }
    for (const p of tambah) latar[p] = 1;
    nHalo += tambah.length;
  }
  // 3. kantong tertutup hampir putih
  const lihat = new Uint8Array(N); const kantong = [];
  for (let p0 = 0; p0 < N; p0++) {
    if (latar[p0] || lihat[p0] || !putih(p0)) continue;
    const kom = [p0]; lihat[p0] = 1;
    for (let k = 0; k < kom.length; k++) {
      const p = kom[k], x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q < 0 || lihat[q] || latar[q] || !putih(q)) continue; lihat[q] = 1; kom.push(q);
      }
    }
    if (kom.length < (process.env.RINA_KANTONG_MIN ? +process.env.RINA_KANTONG_MIN : 30)) continue;
    let sm = 0, ss = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (const p of kom) { sm += minc(d, p * 4); ss += sat(d, p * 4); const x = p % w, y = (p / w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const info = { n: kom.length, kotak: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], min: +(sm / kom.length).toFixed(1), sat: +(ss / kom.length).toFixed(1) };
    info.buang = buangKantong && info.min >= 238 && info.sat <= 9;
    kantong.push(info);
    if (info.buang) for (const p of kom) latar[p] = 1;
  }
  // 4. bintik buram lepas
  const lihat2 = new Uint8Array(N); let nBintik = 0;
  for (let p0 = 0; p0 < N; p0++) {
    if (latar[p0] || lihat2[p0]) continue;
    const kom = [p0]; lihat2[p0] = 1;
    for (let k = 0; k < kom.length; k++) {
      const p = kom[k], x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx; if (lihat2[q] || latar[q]) continue; lihat2[q] = 1; kom.push(q);
      }
    }
    if (kom.length < 40) { for (const p of kom) latar[p] = 1; nBintik += kom.length; }
  }
  const o = L.salin(img);
  for (let p = 0; p < N; p++) {
    if (latar[p]) { o.d[p * 4] = o.d[p * 4 + 1] = o.d[p * 4 + 2] = o.d[p * 4 + 3] = 0; } else o.d[p * 4 + 3] = 255;
  }
  return { img: o, laporan: { halo: nHalo, bintik: nBintik, kantong } };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('rina-latar.mjs')) {
  fs.mkdirSync(KELUAR, { recursive: true });
  const lap = {};
  for (const nm of LEMBAR) {
    const src = decodeJpg(path.join(SUMBER, `bu-rina-${nm}-v1.jpg`));
    // ekspresi: kepala saja, tidak ada celah latar tertutup; kantong putih di sana = putih mata (diperiksa visual).
    const { img, laporan } = lepasLatar(src, { buangKantong: nm !== 'ekspresi' });
    L.tulis(path.join(KELUAR, `${nm}-alfa.png`), img);
    lap[nm] = { w: img.w, h: img.h, ...laporan };
    console.log(nm, img.w, img.h, 'halo', laporan.halo, 'bintik', laporan.bintik, 'kantong', laporan.kantong.map((k) => `${k.n}@${k.kotak.join(',')} min${k.min} sat${k.sat}${k.buang ? ' BUANG' : ''}`).join(' | '));
  }
  fs.writeFileSync(path.join(KELUAR, 'laporan-latar.json'), JSON.stringify(lap, null, 1));
}
