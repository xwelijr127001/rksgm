/**
 * Bu Rina — lembar tinjau, SELURUHNYA disusun ulang dari atlas + manifest (menguji manifest sekaligus).
 *
 *   node tools/piksel/rina-tinjau.mjs <folder-keluaran>
 *
 * Isi folder: 01-frame-ekspresi-4x-<frame>.png, 02-semua-2x.png, 03-potret.png, 04-jalan-bawang.png,
 * 05-kedip-bicara-diff.png, 06-bersama-miss.png, 07-keluarga-duduk.png, 08-ukuran-nyata.png, laporan-tinjau.json
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';
import { KELUAR_PNG, KELUAR_JSON } from './bangun-rina.mjs';

const man = JSON.parse(fs.readFileSync(KELUAR_JSON, 'utf8'));
const atlas = L.baca(KELUAR_PNG);
const ambil = (r) => L.potong(atlas, r[0], r[1], r[2], r[3]);

/** Komposisi acuan (sama dengan yang harus dilakukan panggung): tubuh -> wajah ekspresi -> mata varian -> mulut. */
export function komposit(frameId, ekspresi = 'netral', { kedip = false, bawah = false, bicara = false } = {}) {
  const f = man.frame[frameId];
  const o = ambil(f.rect);
  const e = f.ekspresi[ekspresi];
  L.tempel(o, ambil(e.dasar), f.wajah.kotak[0], f.wajah.kotak[1]);
  if (kedip && e.kedip) L.tempel(o, ambil(e.kedip), f.wajah.mata[0], f.wajah.mata[1]);
  else if (bawah && e.bawah) L.tempel(o, ambil(e.bawah), f.wajah.mata[0], f.wajah.mata[1]);
  if (bicara && e.bicara) L.tempel(o, ambil(e.bicara), f.wajah.mulut[0], f.wajah.mulut[1]);
  return o;
}

const KREM = [246, 236, 214], DINDING = [224, 178, 96], GELAP = [36, 32, 40];

function label(img, teks, x, y, k = 2, c = [0, 0, 0]) { L.tulisTeks(img, teks, x, y, c, k); }

/** Baris gambar pada latar, rata bawah (jangkar opsional), dengan label. */
function baris(items, { k = 4, bg = KREM, jarak = 6, tinggiLabel = 14 } = {}) {
  const imgs = items.map((it) => ({ ...it, big: L.perbesar(L.datarkan(it.img, bg), k) }));
  const W = imgs.reduce((a, it) => a + it.big.w + jarak, jarak), H = Math.max(...imgs.map((it) => it.big.h)) + tinggiLabel + jarak * 2;
  const o = L.buat(W, H, [...bg, 255]);
  let x = jarak;
  for (const it of imgs) { L.tempel(o, it.big, x, H - jarak - it.big.h); label(o, it.label || '', x, 4); x += it.big.w + jarak; }
  return o;
}

export function tinjau(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const lap = { frame: {} };
  const frames = Object.keys(man.frame);
  const E = man.ekspresi;
  // 01: per frame x ekspresi, 4x
  for (const fid of frames) {
    const items = E.map((e) => ({ img: komposit(fid, e), label: e }));
    L.tulis(path.join(dir, `01-frame-ekspresi-4x-${fid}.png`), baris(items, { k: 4 }));
  }
  // 02: semua 2x
  const rows = frames.map((fid) => baris(E.map((e) => ({ img: komposit(fid, e), label: fid === frames[0] ? e : '' })), { k: 2, tinggiLabel: 12 }));
  const W2 = Math.max(...rows.map((r) => r.w)), H2 = rows.reduce((a, r) => a + r.h, 0);
  const s2 = L.buat(W2 + 120, H2, [...KREM, 255]); let yy = 0;
  for (const [i, r] of rows.entries()) { L.tempel(s2, r, 120, yy); label(s2, frames[i], 4, yy + r.h / 2, 2); yy += r.h; }
  L.tulis(path.join(dir, '02-semua-2x.png'), s2);
  // 03: potret pada ukuran tampil nyata (skala bulat), semua ekspresi
  const jen = man.potret.jendela;
  const ukuran = Object.keys(jen).map(Number).sort((a, b) => a - b);
  const pot = [];
  for (const u of ukuran) {
    const j = jen[u];
    const sel = E.map((e) => L.perbesar(L.datarkan(L.potong(komposit(j.frame, e), j.x, j.y, j.sisi, j.sisi), KREM), j.skala));
    pot.push({ u, sel });
  }
  for (const [u, j] of Object.entries(man.potret.dekat)) pot.push({ u: `${u}d`, sel: E.map((e) => L.perbesar(L.datarkan(L.potong(komposit(j.frame, e), j.x, j.y, j.sisi, j.sisi), KREM), j.skala)) });
  const PW = 110 + E.length * (96 + 8), PH = pot.reduce((a, p) => a + p.sel[0].h + 10, 30);
  const s3 = L.buat(PW, PH, [255, 255, 255, 255]); let py = 20;
  E.forEach((e, i) => label(s3, e, 110 + i * 104, 4, 2));
  for (const p of pot) { label(s3, `${p.u} PX`, 4, py + 4, 2); p.sel.forEach((g, i) => L.tempel(s3, g, 110 + i * 104, py)); py += p.sel[0].h + 10; }
  L.tulis(path.join(dir, '03-potret-ukuran-nyata.png'), s3);
  L.tulis(path.join(dir, '03b-potret-x3.png'), L.perbesar(s3, 3));
  // 04: jalan — dua bingkai disejajarkan pada jangkar kaki (bawang) + berdampingan dengan garis tanah
  const jl = (a, b, nama) => {
    const fa = man.frame[a], fb = man.frame[b];
    const A = komposit(a), B = komposit(b);
    const kx = Math.max(fa.jangkar.x, fb.jangkar.x), ky = Math.max(fa.jangkar.y, fb.jangkar.y);
    const w = Math.ceil(Math.max(kx - fa.jangkar.x + A.w, kx - fb.jangkar.x + B.w)) + 2, h = Math.ceil(ky) + 3;
    const o = L.buat(w, h, [255, 255, 255, 255]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const pa = [x - Math.round(kx - fa.jangkar.x), y - Math.round(ky - fa.jangkar.y)], pb = [x - Math.round(kx - fb.jangkar.x), y - Math.round(ky - fb.jangkar.y)];
      const ia = R.buramXY(A, pa[0], pa[1]), ib = R.buramXY(B, pb[0], pb[1]);
      const c = ia && ib ? [90, 60, 110] : ia ? [230, 80, 70] : ib ? [60, 150, 230] : [255, 255, 255];
      R.setel(o, x, y, c);
    }
    for (let x = 0; x < w; x++) R.setel(o, x, Math.round(ky), [0, 0, 0]);
    for (let y = 0; y < h; y++) R.setel(o, Math.round(kx), y, [0, 170, 0]);
    // kepala: selisih
    const dKep = { x: +((fb.kepala.x - fb.jangkar.x) - (fa.kepala.x - fa.jangkar.x)).toFixed(2), y: +((fb.kepala.y - fb.jangkar.y) - (fa.kepala.y - fa.jangkar.y)).toFixed(2) };
    // badan atas terkunci? sejajarkan pada titik kepala: jumlah baris identik (warna+alpha) dari atas, dan beda siluet total
    const ox = Math.round(fb.kepala.x - fa.kepala.x), oy = Math.round(fb.kepala.y - fa.kepala.y);
    let barisSama = 0; for (let y = 0; y < A.h; y++) { let sama = true; for (let x = -4; x < A.w + 4 && sama; x++) { const ia = R.buramXY(A, x, y), ib = R.buramXY(B, x + ox, y + oy); if (ia !== ib || (ia && !R.samaW(R.warna(A, x, y), R.warna(B, x + ox, y + oy)))) sama = false; } if (!sama) break; barisSama++; }
    let xor = 0, gab = 0; for (let y = -4; y < A.h + 4; y++) for (let x = -4; x < A.w + 4; x++) { const ia = R.buramXY(A, x, y), ib = R.buramXY(B, x + ox, y + oy); if (ia || ib) gab++; if (ia !== ib) xor++; }
    lap[`jalan-${nama}`] = { bingkai: [a, b], selisihKepalaTerhadapJangkar: dKep, dasarKaki: { a: +(fa.kaki.y - fa.jangkar.y).toFixed(2), b: +(fb.kaki.y - fb.jangkar.y).toFixed(2) }, barisIdentikDariAtas: barisSama, tinggiA: A.h, siluetBeda: xor, siluetBedaPersen: +(100 * xor / gab).toFixed(1) };
    const side = baris([{ img: A, label: a }, { img: B, label: b }], { k: 3, bg: [255, 255, 255] });
    return { onion: L.perbesar(o, 3), side };
  };
  // pasangan jalan = animasi.jalan (jalan-a <-> jalan-b); 'berhenti' = jalan-a -> berdiri (sekali, saat tiba)
  const [ja, jb] = man.animasi.jalan.kiri, [jak, jbk] = man.animasi.jalan.kanan;
  const j1 = jl(ja, jb, 'kiri'), j2 = jl(jak, jbk, 'kanan'); jl('jalan-a', 'berdiri', 'berhenti');
  const parts = [j1.onion, j1.side, j2.onion, j2.side];
  const W4 = parts.reduce((a, g) => a + g.w + 10, 10), H4 = Math.max(...parts.map((g) => g.h)) + 20;
  const o4 = L.buat(W4, H4, [220, 220, 220, 255]); let x4 = 10; for (const g of parts) { L.tempel(o4, g, x4, 10); x4 += g.w + 10; }
  L.tulis(path.join(dir, '04-jalan-bawang.png'), o4);
  // 05: kedip/bicara/bawah diff: per frame (netral & satu ekspresi lain), piksel beda ditandai magenta; hitung beda di luar kotak
  const dif = []; lap.diff = {};
  for (const fid of frames) {
    for (const e of E) {
      const base = komposit(fid, e);
      for (const v of ['kedip', 'bawah', 'bicara']) {
        const img = komposit(fid, e, { [v]: true });
        const d = R.selisih(base, img);
        const f = man.frame[fid]; const k = v === 'bicara' ? f.wajah.mulut : f.wajah.mata;
        const luar = d.filter(([x, y]) => !(x >= k[0] && y >= k[1] && x < k[0] + k[2] && y < k[1] + k[3])).length;
        lap.diff[`${fid}:${e}:${v}`] = { beda: d.length, diLuarKotak: luar };
        if ((e === 'netral' || e === 'kesal') && ['berdiri', 'duduk', 'lipat-tangan', 'telepon'].includes(fid)) {
          const kw = f.wajah.kotak; const pad = 3;
          const crop = (g) => L.potong(L.datarkan(g, KREM), kw[0] - pad, kw[1] - pad, kw[2] + 2 * pad, kw[3] + 2 * pad);
          const m = crop(img); for (const [x, y] of d) R.setel(m, x - kw[0] + pad, y - kw[1] + pad, [255, 0, 255]);
          dif.push({ img: crop(base), label: `${fid.slice(0, 6)} ${e.slice(0, 4)}` }, { img: crop(img), label: v }, { img: m, label: `${d.length}PX` });
        }
      }
    }
  }
  const difRows = []; for (let i = 0; i < dif.length; i += 9) difRows.push(baris(dif.slice(i, i + 9), { k: 5 }));
  const W5 = Math.max(...difRows.map((r) => r.w)), H5 = difRows.reduce((a, r) => a + r.h, 0);
  const o5 = L.buat(W5, H5, [...KREM, 255]); let y5 = 0; for (const r of difRows) { L.tempel(o5, r, 0, y5); y5 += r.h; }
  L.tulis(path.join(dir, '05-kedip-bawah-bicara-diff.png'), o5);
  lap.diffMaksDiLuarKotak = Math.max(...Object.values(lap.diff).map((v) => v.diLuarKotak));
  // ganti ekspresi: semua piksel yang berubah (vs netral) harus di dalam kotak wajah -> hijab, garis kepala, badan tetap
  lap.ekspresiDiLuarKotakWajah = 0; lap.ekspresiBedaMaks = 0;
  for (const fid of frames) {
    const base = komposit(fid, 'netral'); const k = man.frame[fid].wajah.kotak;
    for (const e of E) for (const op of [{}, { kedip: true }, { bawah: true }, { bicara: true }, { kedip: true, bicara: true }, { bawah: true, bicara: true }]) {
      const d = R.selisih(base, komposit(fid, e, op));
      lap.ekspresiBedaMaks = Math.max(lap.ekspresiBedaMaks, d.length);
      lap.ekspresiDiLuarKotakWajah += d.filter(([x, y]) => !(x >= k[0] && y >= k[1] && x < k[0] + k[2] && y < k[1] + k[3])).length;
    }
  }
  // kantong putih (reviu 27 Sep: sisa latar JPG di celah jari-dagu): komponen piksel HAMPIR PUTIH (L OKLab > 0,9, kroma
  // < 0,04) di luar wajah.mata (+1 px) yang dikelilingi piksel TIDAK terang (< 3 tetangga-8 ber-L >= 0,8; kilap krem
  // apron dikelilingi krem sehingga lolos). Harus 0 di semua frame x ekspresi x varian.
  lap.kantongPutih = [];
  for (const fid of frames) {
    const f = man.frame[fid]; const mk = f.wajah.mata;
    const diMata = (x, y) => mk && x >= mk[0] - 1 && y >= mk[1] - 1 && x < mk[0] + mk[2] + 1 && y < mk[1] + mk[3] + 1;
    const lihat = new Set();
    for (const e of E) for (const op of [{}, { kedip: true }, { bawah: true }, { bicara: true }]) {
      const img = komposit(fid, e, op);
      const putih = (p) => { const x = p % img.w, y = (p / img.w) | 0; if (!R.buramXY(img, x, y) || diMata(x, y)) return false; const q = L.keOklab(R.warna(img, x, y)); return q[0] > 0.9 && Math.hypot(q[1], q[2]) < 0.04; };
      for (const c of R.komponen(img, putih, true).out) {
        const di = new Set(c.px); let terang = 0, tembus = 0, n = 0;
        for (const p of c.px) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = (p % img.w) + dx, y = ((p / img.w) | 0) + dy; const q = y * img.w + x;
          if ((!dx && !dy) || di.has(q)) continue; n++;
          if (!R.buramXY(img, x, y)) { tembus++; continue; }
          if (L.keOklab(R.warna(img, x, y))[0] >= 0.8) terang++;
        }
        if (terang >= 3) continue;
        const kunci = `${c.x},${c.y},${c.n}`; if (lihat.has(kunci)) continue; lihat.add(kunci);
        lap.kantongPutih.push({ frame: fid, ekspresi: e, varian: Object.keys(op)[0] || 'dasar', kotak: [c.x, c.y, c.w, c.h], n: c.n, tetanggaTerang: terang, tetanggaTembus: tembus });
      }
    }
  }
  // 07: keluarga duduk disejajarkan pinggul (bawang terhadap duduk) — kaki harus sama
  const kel = ['lipat-tangan', 'genggam', 'dagu', 'dada', 'telepon', 'duduk-condong'].map((fid) => {
    const fa = man.frame.duduk, fb = man.frame[fid];
    const A = komposit('duduk'), B = komposit(fid, 'netral');
    const kx = Math.max(fa.jangkar.x, fb.jangkar.x) + 2, ky = Math.max(fa.jangkar.y, fb.jangkar.y) + 2;
    const w = Math.ceil(Math.max(kx - fa.jangkar.x + A.w, kx - fb.jangkar.x + B.w)) + 2, h = Math.ceil(Math.max(ky - fa.jangkar.y + A.h, ky - fb.jangkar.y + B.h)) + 2;
    const o = L.buat(w, h, [255, 255, 255, 255]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ia = R.buramXY(A, x - Math.round(kx - fa.jangkar.x), y - Math.round(ky - fa.jangkar.y)), ib = R.buramXY(B, x - Math.round(kx - fb.jangkar.x), y - Math.round(ky - fb.jangkar.y));
      R.setel(o, x, y, ia && ib ? [90, 60, 110] : ia ? [230, 80, 70] : ib ? [60, 150, 230] : [255, 255, 255]);
    }
    R.setel(o, Math.round(kx), Math.round(ky), [0, 200, 0]);
    lap[`duduk-vs-${fid}`] = { kakiY: +((fb.kaki.y - fb.jangkar.y) - (fa.kaki.y - fa.jangkar.y)).toFixed(2), kepala: { x: +((fb.kepala.x - fb.jangkar.x) - (fa.kepala.x - fa.jangkar.x)).toFixed(2), y: +((fb.kepala.y - fb.jangkar.y) - (fa.kepala.y - fa.jangkar.y)).toFixed(2) } };
    return { img: o, label: fid };
  });
  const o7 = baris(kel, { k: 3, bg: [255, 255, 255] });
  L.tulis(path.join(dir, '07-keluarga-duduk-bawang.png'), o7);
  // 06: bersama Miss Raksa (atlasnya bila ada; bila tidak, master disampel pada pitch 7,34 di sini)
  let miss = null, sumberMiss = '';
  const missJson = path.join(path.dirname(KELUAR_JSON), 'miss-raksa.json');
  if (fs.existsSync(missJson)) {
    try {
      const mm = JSON.parse(fs.readFileSync(missJson, 'utf8'));
      const ma = L.baca(path.join(path.dirname(KELUAR_JSON), mm.gambar || 'miss-raksa.png'));
      const ff = mm.frame?.berdiri || mm.frame?.['berdiri-sambut'] || Object.values(mm.frame || {})[0];
      if (ff?.rect) { miss = L.potong(ma, ...ff.rect); sumberMiss = 'atlas miss-raksa.json'; }
    } catch { miss = null; }
  }
  if (!miss) {
    const mst = L.baca(path.join(L.ROOT, 'character', 'miss-raksa-pixel-v4', 'miss-raksa-pixel-master-v1.png'));
    const b = L.kotakAlpha(mst, 200);
    const p = 7.34; const W = Math.ceil(b.w / p) + 2, H = Math.ceil(b.h / p) + 2;
    miss = L.binerkanAlpha(L.sampelGrid(mst, { sx: p, sy: p, ox: b.x - p, oy: b.y - p, w: W, h: H, inti: 0.55, ambangAlpha: 0.6 }).img);
    sumberMiss = 'master v4 disampel 7,34 px (tanpa normalisasi palet; hanya pembanding ukuran)';
  }
  lap.pembandingMiss = sumberMiss;
  const bers = baris([{ img: miss, label: 'MISS' }, { img: komposit('berdiri'), label: 'RINA BERDIRI' }, { img: komposit('duduk'), label: 'RINA DUDUK' }, { img: komposit('berdiri', 'tersenyum'), label: 'TERSENYUM' }], { k: 4, bg: DINDING });
  // garis bantu tinggi tiap 10 px seni
  for (let y = bers.h - 6; y > 0; y -= 40) L.isiKotak(bers, 0, y, bers.w, 1, [120, 90, 40]);
  L.tulis(path.join(dir, '06-bersama-miss-4x.png'), bers);
  L.tulis(path.join(dir, '06b-bersama-miss-2x.png'), baris([{ img: miss, label: 'MISS' }, { img: komposit('berdiri'), label: 'RINA' }, { img: komposit('duduk', 'cemas'), label: 'CEMAS' }], { k: 2, bg: DINDING }));
  // 08: ukuran nyata panggung (1 px seni = 4 unit dunia; panggung 1600x900 ditampilkan 1440 lebar -> 0,9 px/unit ->
  // tidak bulat; tampilkan pada 3 px/px seni (1200x675) dan 2 px/px seni (800x450) sebagai skala bulat terdekat)
  for (const k of [2, 3]) {
    const o = L.buat(400 * k, 225 * k, [...DINDING, 255]);
    L.isiKotak(o, 0, 160 * k, 400 * k, 65 * k, [176, 128, 80, 255]);
    const put = (img, fx, jx, jy, fk) => L.tempel(o, L.perbesar(img, fk), Math.round((fx - jx) * fk), Math.round((200 - jy) * fk));
    const fm = man.frame.duduk; put(komposit('duduk', 'cemas'), 300, fm.kaki.x, fm.kaki.y, k);
    const fb = man.frame.berdiri; put(komposit('berdiri'), 200, fb.jangkar.x, fb.jangkar.y, k);
    put(miss, 90, miss.w / 2, miss.h, k);
    L.tulis(path.join(dir, `08-ukuran-nyata-${k}x.png`), o);
  }
  // hitungan warna & alpha atlas
  let alphaLain = 0; for (let i = 3; i < atlas.d.length; i += 4) if (atlas.d[i] !== 0 && atlas.d[i] !== 255) alphaLain++;
  lap.atlas = { ukuran: [atlas.w, atlas.h], warna: L.hitungWarna(atlas).size, alphaBukanBiner: alphaLain };
  fs.writeFileSync(path.join(dir, 'laporan-tinjau.json'), JSON.stringify(lap, null, 1));
  return lap;
}

if (process.argv[1]?.endsWith('rina-tinjau.mjs')) {
  const dir = process.argv[2] || path.join(L.ROOT, 'character', 'piksel', 'bu-rina', 'tinjau');
  const lap = tinjau(dir);
  console.log(JSON.stringify({ atlas: lap.atlas, diffMaksDiLuarKotak: lap.diffMaksDiLuarKotak, ekspresiDiLuarKotakWajah: lap.ekspresiDiLuarKotakWajah, ekspresiBedaMaks: lap.ekspresiBedaMaks, kantongPutih: lap.kantongPutih, jalanKiri: lap['jalan-kiri'], jalanKanan: lap['jalan-kanan'], pembandingMiss: lap.pembandingMiss }, null, 1));
  for (const k of Object.keys(lap).filter((k) => k.startsWith('duduk-vs'))) console.log(k, JSON.stringify(lap[k]));
}
