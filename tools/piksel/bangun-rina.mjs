/**
 * Bu Rina — bangun frame produksi piksel: native -> suntingan tercatat -> keluarga & jangkar -> wajah terkunci-kepala
 * (8 ekspresi x dasar/kedip/bawah/bicara) -> atlas + manifest.
 *
 *   node tools/piksel/rina-latar.mjs     (sekali; lepas latar JPG -> character/piksel/bu-rina/sumber/*-alfa.png)
 *   node tools/piksel/bangun-rina.mjs    (native, suntingan, atlas, manifest)
 *   node tools/piksel/rina-tinjau.mjs <folder>  (lembar tinjau)
 *
 * Keluaran:
 *   character/piksel/bu-rina/native/*.png            frame final (native, wajah netral terpanggang) + log-suntingan.json
 *   character/piksel/bu-rina/native/wajah/*.png      kepala ekspresi tersejajar + varian (koordinat kepala netral)
 *   client/src/cerita/seni/piksel/bu-rina.png/.json  atlas & manifest (skema: docs/cerita/aset/BU-RINA-PIKSEL.md)
 *
 * Koordinat manifest = piksel seni relatif ke pojok kiri-atas frame; titik = batas piksel (x=10 berarti tepi kiri
 * piksel ke-10). 1 piksel seni = 4 satuan dunia panggung.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';
import * as W from './rina-wajah.mjs';
import { bangunNative, DIR, P_POSE } from './rina-native.mjs';
import { SUNTING_NATIVE, SUNTING_KELUARGA, PENGHALANG, KOTAK_WAJAH, SUNTING_EKSPRESI, SUNTING_VARIAN, KOTAK_FITUR, AMBANG_FITUR, JALAN_B, LINDUNG_TEPI } from './rina-suntingan.mjs';
import { HARMONI, harmonikanTubuh, harmonikanKepala } from './rina-harmoni.mjs';
import { bangunJalanB } from './rina-jalan.mjs';

export const KELUAR_PNG = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel', 'bu-rina.png');
export const KELUAR_JSON = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel', 'bu-rina.json');
export const EKSPRESI = ['netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum'];
export const VARIAN = ['kedip', 'bawah', 'bicara'];

/** Keluarga duduk: satu kanvas & satu jangkar (pinggul di dudukan) untuk semua badan duduk. */
const KELUARGA_DUDUK = ['duduk', 'lipat-tangan', 'genggam', 'dagu', 'dada', 'telepon', 'duduk-condong'];
/** Titik pinggul di dudukan, koordinat native `duduk` (perkiraan visual: di balik pangkuan, di atas ujung gaun belakang). */
const PINGGUL_DUDUK = { x: 56, y: 120 };
const PAD = 8;

/** Titik kunci (pusat gantungan kunci) per frame native, bila kunci tergambar. Diukur dari kisi 10x. */
const KUNCI = { berdiri: { x: 11.5, y: 92 }, 'jalan-a': { x: 11.5, y: 91 }, 'jalan-b': { x: 11.5, y: 91 }, 'duduk-condong': { x: 27, y: 119 }, 'duduk-turun': { x: 12, y: 117 } };
/** Gagang telepon (pusat) di frame telepon, koordinat native. */
const GAGANG = { x: 31, y: 45 };

/** Tubuh ekspresi saat duduk (kontrak lead): kesal=lipat tangan, cemas=genggam, bingung=dagu, lega=dada, lainnya=duduk. */
export const TUBUH_EKSPRESI = { kesal: 'lipat-tangan', cemas: 'genggam', bingung: 'dagu', lega: 'dada', netral: 'duduk', serius: 'duduk', tersenyum: 'duduk', senang: 'duduk' };

const log = [];
const catat = (o) => { log.push(o); return o; };

function terdekat(palet, c) {
  const lab = L.keOklab(c); let b = palet[0], bd = Infinity;
  for (const p of palet) { const d = L.jarakOk(lab, L.keOklab(p)); if (d < bd) { bd = d; b = p; } }
  return b;
}

function terapkan(op, frames, palet) {
  const img = frames[op.frame];
  const warna = (h) => (h === null ? null : terdekat(palet, L.dariHex(h)));
  const sebelum = img ? L.salin(img) : null;
  if (op.op === 'hapusBaris') {
    const o = L.buat(img.w, img.h - op.n);
    for (let y = 0; y < o.h; y++) { const sy = y < op.y ? y : y + op.n; img.d.copy(o.d, y * o.w * 4, sy * img.w * 4, (sy + 1) * img.w * 4); }
    frames[op.frame] = o;
    return catat({ ...op, berubah: `${op.n} baris dihapus` });
  }
  if (op.op === 'px') { for (const [x, y] of op.titik) R.setel(img, x, y, warna(op.warna)); }
  else if (op.op === 'kotak') { const [x0, y0, w, h] = op.kotak; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) R.setel(img, x, y, warna(op.warna)); }
  else if (op.op === 'ganti') {
    const [x0, y0, w, h] = op.kotak; const dari = op.dari.map((h) => R.key(L.dariHex(h)));
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (R.buramXY(img, x, y) && dari.includes(R.key(R.warna(img, x, y)))) R.setel(img, x, y, warna(op.ke));
  } else throw new Error('op tak dikenal ' + op.op);
  return catat({ ...op, berubah: R.selisih(sebelum, img).length });
}

/** Registrasi bagian bawah (porsi dari atas kotak alpha) B ke A: A(x,y) ~ B(x-dx, y-dy). */
function registrasi(A, B, porsi = 0.62, rentang = 10) {
  const bA = L.kotakAlpha(A); const y0 = Math.round(bA.y + bA.h * porsi);
  let best = null;
  for (let dy = -rentang; dy <= rentang; dy++) for (let dx = -rentang; dx <= rentang; dx++) {
    let s = 0, n = 0;
    for (let y = y0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
      const oa = R.buramXY(A, x, y), ob = R.buramXY(B, x - dx, y - dy);
      if (!oa && !ob) continue; n++;
      if (oa !== ob) { s += 1; continue; }
      s += Math.min(1, L.jarakOk(L.keOklab(R.warna(A, x, y)), L.keOklab(R.warna(B, x - dx, y - dy))) * 4);
    }
    const v = s / n; if (!best || v < best.v) best = { dx, dy, v: +v.toFixed(3) };
  }
  return best;
}

/** Jangkar kaki: tengah rentang x piksel buram di 10 baris terbawah; y = tepi bawah baris buram terbawah. */
function jangkarKaki(img) {
  const b = L.kotakAlpha(img); const yb = b.y + b.h;
  let x0 = Infinity, x1 = -Infinity;
  for (let y = yb - 10; y < yb; y++) for (let x = 0; x < img.w; x++) if (R.buramXY(img, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); }
  return { x: (x0 + x1) / 2, y: yb };
}

function trimKotak(img, pinggir = 1) {
  const b = L.kotakAlpha(img);
  return { x: b.x - pinggir, y: b.y - pinggir, w: b.w + 2 * pinggir, h: b.h + 2 * pinggir };
}

const geserTitik = (t, dx, dy) => (t ? { x: t.x + dx, y: t.y + dy } : t);
const cerminTitik = (t, w) => (t ? { x: w - t.x, y: t.y } : t);
const cerminKotak = (k, w) => [w - k[0] - k[2], k[1], k[2], k[3]];
const penghalangMask = (img, rects) => { const m = new Uint8Array(img.w * img.h); for (const [x0, y0, w, h] of rects || []) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < img.w && y < img.h) m[y * img.w + x] = 1; return m; };

const merahHijab = (c) => { const [h, sat, v] = R.hsv(c[0], c[1], c[2]); return (h < 17 || h > 340) && sat > 0.55 && v > 0.45; };
function maskBersama(img, M0) {
  const M = new Uint8Array(M0.length);
  for (let p = 0; p < M0.length; p++) {
    if (!M0[p]) continue; const x = p % img.w, y = (p / img.w) | 0;
    if (!R.buramXY(img, x, y)) continue;
    const tepi = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !M0[(y + dy) * img.w + x + dx]);
    if (tepi && merahHijab(R.warna(img, x, y))) continue;
    M[p] = 1;
  }
  return M;
}

export function bangun({ tulis = true } = {}) {
  const { hasil: nat, palet, laporan: lapNative } = bangunNative({ tulis });
  const warnaP = (c) => terdekat(palet, c);
  const GARIS_MATA = warnaP([41, 13, 4]), RONGGA = warnaP([61, 20, 6]), BIBIR = warnaP([133, 42, 21]);

  /* ---------- A. suntingan native */
  const fr = { ...nat };
  for (const op of SUNTING_NATIVE) terapkan(op, fr, palet);
  /* ---------- A2. harmonisasi dengan gaya Miss v5 (rina-harmoni.mjs): garis siluet cokelat tua, tepi JPEG, bintik */
  // Jangkar kaki dihitung dari frame SEBELUM harmonisasi: taji/lekuk di tepi sepatu tidak boleh menggeser titik lantai
  // (0,5 px seni = pembulatan posisi dunia berbeda -> tokoh meloncat 1 px saat ganti frame).
  const kakiAsli = {};
  for (const n of ['berdiri', 'jalan-a', 'duduk-turun']) kakiAsli[n] = jangkarKaki(fr[n]);
  for (const n of ['berdiri', 'jalan-a', 'duduk-turun', ...KELUARGA_DUDUK]) {
    const lindung = [...(LINDUNG_TEPI[n] || []), ...(PENGHALANG[n] || [])];
    catat({ op: 'harmoni', frame: n, berubah: harmonikanTubuh(fr[n], { lindung }), lindung, alasan: 'brief v4-polish §6: logika garis & kepadatan detail sama dengan Miss (lihat rina-harmoni.mjs)' });
  }
  // jalan-b = bingkai lintas: badan atas jalan-a terkunci + kaki berdiri (kaki jauh terayun). Lihat rina-jalan.mjs.
  { const jb = bangunJalanB(fr['jalan-a'], fr.berdiri, JALAN_B); fr['jalan-b'] = jb.img; catat({ op: 'jalanB', frame: 'jalan-b', ...JALAN_B, berubah: jb.laporan, alasan: 'reviu: jalan 2 bingkai terbaca langkah-rapat, kepala naik-turun 5 px, badan atas beda gambar' }); }

  /* ---------- B. keluarga duduk: registrasi ke `duduk`, kanvas bersama */
  const reg = {};
  for (const n of KELUARGA_DUDUK) reg[n] = n === 'duduk' ? { dx: 0, dy: 0, v: 0 } : registrasi(fr.duduk, fr[n]);
  const minDx = Math.min(...Object.values(reg).map((r) => r.dx)), minDy = Math.min(...Object.values(reg).map((r) => r.dy));
  const ox = PAD - minDx, oy = PAD - minDy;
  const KW = Math.max(...KELUARGA_DUDUK.map((n) => fr[n].w + reg[n].dx + ox)) + PAD, KH = Math.max(...KELUARGA_DUDUK.map((n) => fr[n].h + reg[n].dy + oy)) + PAD;
  const kan = {};
  for (const n of KELUARGA_DUDUK) { const c = L.buat(KW, KH); L.tempel(c, fr[n], reg[n].dx + ox, reg[n].dy + oy); kan[n] = c; }
  for (const op of SUNTING_KELUARGA) {
    if (op.op !== 'salinKeluarga') throw new Error(op.op);
    const src = kan[op.dari]; const y0 = op.yMulai + oy;
    for (const t of op.ke) {
      const img = kan[t]; const sebelum = L.salin(img);
      for (let y = y0; y < KH; y++) src.d.copy(img.d, y * KW * 4, y * KW * 4, (y + 1) * KW * 4);
      catat({ ...op, ke: t, berubah: R.selisih(sebelum, img).length, yKanvas: y0 });
    }
  }
  const pinggul = { x: PINGGUL_DUDUK.x + ox, y: PINGGUL_DUDUK.y + oy };

  /* ---------- C. daftar tubuh (kanvas masing-masing, sebelum trim) */
  const tubuh = {};
  const tambah = (id, img, info) => { tubuh[id] = { id, img, ...info }; };
  for (const n of ['berdiri', 'jalan-a', 'jalan-b', 'duduk-turun']) {
    const img = fr[n];
    // jalan-b: jangkar = jangkar jalan-a (badan atas identik, x sama), y + bob (kaki dekat menapak bob px lebih rendah)
    const jk = n === 'jalan-b' ? (() => { const a = kakiAsli['jalan-a']; return { x: a.x, y: a.y + JALAN_B.bob }; })() : kakiAsli[n];
    tambah(n, img, { hadap: 'kiri', jenisJangkar: 'kaki', jangkar: jk, kaki: jk, kunci: KUNCI[n] || null, penghalang: PENGHALANG[n], asal: { lembar: n === 'duduk-turun' ? 'jalan #4' : n === 'berdiri' ? 'pose #1' : n === 'jalan-b' ? 'dirakit: badan atas pose #2 + kaki pose #1 (rina-jalan.mjs)' : 'pose #2' } });
  }
  for (const n of KELUARGA_DUDUK) {
    const img = kan[n]; const d = { x: reg[n].dx + ox, y: reg[n].dy + oy };
    const asal = n === 'duduk-condong' ? 'pose #4' : `gestur-duduk #${['lipat-tangan', 'genggam', 'dagu', 'dada', 'duduk', 'telepon'].indexOf(n) + 1}`;
    tambah(n, img, {
      hadap: 'kiri', jenisJangkar: 'pinggul', jangkar: pinggul, kaki: jangkarKaki(img),
      kunci: KUNCI[n] ? geserTitik(KUNCI[n], d.x, d.y) : null, gagang: n === 'telepon' ? geserTitik(GAGANG, d.x, d.y) : null,
      penghalang: (PENGHALANG[n] || []).map(([x, y, w, h]) => [x + d.x, y + d.y, w, h]), registrasi: reg[n], asal: { lembar: asal },
    });
  }

  /* ---------- D. kepala ekspresi: sejajarkan ke netral (siluet hijab), bersihkan, suntingan ekspresi, varian */
  // kanvas kepala kanonik 70 x 80 (lembar ekspresi menghasilkan kepala 65-66 px lebar)
  const KW0 = 70, KH0 = 80;
  const E0 = L.potong(nat['e-netral'], 0, 0, KW0, KH0);
  const IZIN_WAJAH = W.paletWajah(palet, warnaP([247, 242, 234]));
  const ME0 = W.maskWajah(E0, { x: 0, y: 0, w: E0.w, h: 60 });
  const kepala = {};
  for (const e of EKSPRESI) {
    const B = nat[`e-${e}`]; const MB = W.maskWajah(B, { x: 0, y: 0, w: B.w, h: 60 });
    let best = null;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      let s = 0, n = 0;
      for (let y = 0; y < 60; y++) for (let x = 0; x < B.w; x++) {
        const ax = x - dx, ay = y - dy; const oa = R.buramXY(E0, ax, ay), ob = R.buramXY(B, x, y);
        const fa = oa && ME0[ay * E0.w + ax], fb = MB[y * B.w + x];
        if (fa || fb || (!oa && !ob)) continue; n++;
        s += oa !== ob ? 1 : Math.min(1, 3 * L.jarakOk(L.keOklab(R.warna(E0, ax, ay)), L.keOklab(R.warna(B, x, y))));
      }
      const v = s / n; if (!best || v < best.v) best = { dx, dy, v: +v.toFixed(3) };
    }
    const img = L.potong(B, best.dx, best.dy, KW0, KH0);
    // Mask wajah bersama = mask kepala netral (semua kepala sudah sejajar hijab). Mask kulit per ekspresi bisa
    // kehilangan mata yang menempel garis pipi (kesal, lega); piksel hijab merah di tepi mask tidak diambil.
    const M = maskBersama(img, ME0);
    const nb = W.bersihWajah(img, M, IZIN_WAJAH);
    kepala[e] = { dasar: img, M, geser: best, bersih: nb };
  }
  // Harmonisasi kulit wajah netral (bintik nada tipis) di luar kotak fitur; ekspresi lain mewarisinya lewat susunFitur.
  { const k = kepala.netral; catat({ op: 'harmoniKepala', frame: 'netral', berubah: harmonikanKepala(k.dasar, k.M, { fitur: Object.values(KOTAK_FITUR) }), alasan: 'brief v4-polish §6: kulit wajah tanpa bercak JPEG' }); k.M = maskBersama(k.dasar, ME0); }
  // Wajah ekspresi = wajah netral + fitur ekspresi saja (alis, mata, mulut, lipatan) -> kulit/hidung/pipi tidak meletup.
  const fitur = {};
  for (const e of EKSPRESI) {
    if (e === 'netral') continue;
    const k = kepala[e];
    const { img, diambil } = W.susunFitur(kepala.netral.dasar, k.dasar, ME0, Object.values(KOTAK_FITUR), { ambangL: AMBANG_FITUR });
    k.dasar = img; k.M = maskBersama(img, ME0); fitur[e] = diambil;
  }
  catat({ op: 'susunFitur', frame: '*', kotak: KOTAK_FITUR, ambangL: AMBANG_FITUR, berubah: fitur, alasan: 'ekspresi = netral + fitur (reviu: kulit meletup saat ganti ekspresi)' });
  for (const op of SUNTING_EKSPRESI) {
    for (const e of op.frame === '*' ? EKSPRESI : [op.frame]) {
      const k = kepala[e];
      if (op.op === 'kelopak') {
        const sebelum = L.salin(k.dasar); const kb = KOTAK_WAJAH[e];
        W.mataBawah(k.dasar, kb.mk, { garis: GARIS_MATA, turun: op.turun }); W.mataBawah(k.dasar, kb.mn, { garis: GARIS_MATA, turun: op.turun });
        catat({ ...op, frame: e, berubah: R.selisih(sebelum, k.dasar).length });
      } else { const t = { [e]: k.dasar }; terapkan({ ...op, frame: e }, t, palet); k.dasar = t[e]; }
      k.M = maskBersama(k.dasar, ME0);
    }
  }
  for (const e of EKSPRESI) {
    const k = kepala[e]; const kb = KOTAK_WAJAH[e];
    const ked = L.salin(k.dasar), baw = L.salin(k.dasar), bic = L.salin(k.dasar);
    if (kb.mk) {
      W.kedipMata(ked, kb.mk, { garis: GARIS_MATA, sisi: 'kiri' }); W.kedipMata(ked, kb.mn, { garis: GARIS_MATA, sisi: 'kanan' });
      // ronde 3: lirik ke bawah (iris tetap terlihat), bukan kelopak turun 2 px (terbaca terpejam di ukuran nyata)
      const lk = W.lirikBawah(baw, kb.mk, { garis: GARIS_MATA }), ln = W.lirikBawah(baw, kb.mn, { garis: GARIS_MATA });
      for (const [sisi, h] of [['kiri', lk], ['kanan', ln]]) if (!h || h.bukaan < 2) throw new Error(`bawah ${e} mata ${sisi}: bukaan ${h?.bukaan} baris (< 2) = terbaca terpejam`);
      catat({ op: 'lirikBawah', frame: `${e}:bawah`, berubah: lk.n + ln.n, garis: [lk.barisGaris, ln.barisGaris], bukaan: [lk.bukaan, ln.bukaan], alasan: 'ronde 3: lirik ke bawah, garis bulu mata di baris putih teratas, iris & putih di bawahnya tetap' });
    }
    if (kb.bicara !== 'manual') W.bukaMulut(bic, kb.mulut, { rongga: RONGGA, bibir: BIBIR });
    k.kedip = ked; k.bawah = baw; k.bicara = bic;
  }
  for (const op of SUNTING_VARIAN) { const k = kepala[op.frame]; const t = { x: k[op.varian] }; terapkan({ ...op, frame: 'x' }, t, palet); log[log.length - 1].frame = `${op.frame}:${op.varian}`; }

  /* ---------- E. wajah per tubuh */
  const HEAD_H = 64;
  for (const t of Object.values(tubuh)) {
    const hal = penghalangMask(t.img, t.penghalang);
    const kk = L.kotakAlpha(t.img);
    let M = W.maskWajah(t.img, { x: 0, y: kk.y, w: t.img.w, h: HEAD_H });
    for (let p = 0; p < M.length; p++) if (hal[p]) M[p] = 0;
    // buang komponen mask kecil yang terpisah (sisa jari) — pertahankan komponen terbesar
    const kom = R.komponen(t.img, (p) => M[p] === 1, false).out.sort((a, b) => b.n - a.n);
    for (const c of kom.slice(1)) for (const p of c.px) M[p] = 0;
    const d = W.cocokWajah(kepala.netral.dasar, kepala.netral.M, t.img, M);
    t.M = M; t.cocok = d;
    // Lengkapi mask tubuh dengan piksel wajah-netral-tergeser yang terlewat mask kulit (mata/alis yang menempel
    // garis pipi), KECUALI garis bingkai: piksel gelap yang bertetangga dengan hijab merah atau transparan.
    { const E0m = kepala.netral.M; const pts = [];
      for (let y = 0; y < t.img.h; y++) for (let x = 0; x < t.img.w; x++) {
        const ex = x - d.dx, ey = y - d.dy; if (ex < 0 || ey < 0 || ex >= E0.w || ey >= E0.h || !E0m[ey * E0.w + ex]) continue;
        const p = y * t.img.w + x; if (M[p] || hal[p] || !R.buramXY(t.img, x, y)) continue;
        const c = R.warna(t.img, x, y); if (merahHijab(c)) continue;
        let bingkai = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; if (!R.buramXY(t.img, x + dx, y + dy) || merahHijab(R.warna(t.img, x + dx, y + dy))) bingkai = true; }
        if (bingkai) continue;
        pts.push([x, y]);
      }
      for (const [x, y] of pts) M[y * t.img.w + x] = 1;
      t.maskTambahan = pts.length; }
    t.kotakWajah = W.kotakMask(M, t.img.w);
    t.wajah = {};
    for (const e of EKSPRESI) {
      t.wajah[e] = {};
      for (const v of ['dasar', ...VARIAN]) {
        const src = kepala[e][v];
        const { img } = W.tempelWajah(src, kepala[e].M, t.img, M, d, hal);
        t.wajah[e][v] = img;
      }
    }
    // kotak mata & mulut per tubuh = gabungan piksel yang berubah (semua ekspresi)
    const gab = (v) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const e of EKSPRESI) for (const [x, y] of R.selisih(t.wajah[e].dasar, t.wajah[e][v])) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; };
    const km = gab('kedip'), kb2 = gab('bawah');
    t.kotakMata = km && kb2 ? [Math.min(km[0], kb2[0]), Math.min(km[1], kb2[1]), 0, 0] : km || kb2;
    if (km && kb2) { t.kotakMata[2] = Math.max(km[0] + km[2], kb2[0] + kb2[2]) - t.kotakMata[0]; t.kotakMata[3] = Math.max(km[1] + km[3], kb2[1] + kb2[3]) - t.kotakMata[1]; }
    t.kotakMulut = gab('bicara');
    // tubuh final: wajah netral terpanggang
    t.imgFinal = t.wajah.netral.dasar;
    // titik kepala: tengah mask wajah (x), tengah antara puncak kepala & dagu (y); leher: bawah dagu
    const kw = t.kotakWajah;
    let puncak = kk.y;
    for (let y = kk.y; y < kk.y + HEAD_H; y++) { let ada = false; for (let x = kw.x; x < kw.x + kw.w; x++) if (R.buramXY(t.img, x, y)) ada = true; if (ada) { puncak = y; break; } }
    t.kepala = { x: kw.x + kw.w / 2, y: (puncak + kw.y + kw.h + 1) / 2 };
    t.leher = { x: kw.x + kw.w / 2, y: kw.y + kw.h + 1 };
    t.titikWajah = { x: kw.x + kw.w / 2, y: kw.y + kw.h / 2 };
  }

  /* ---------- F. cermin (hadap kanan) untuk berdiri & jalan-a */
  for (const n of ['berdiri', 'jalan-a', 'jalan-b']) {
    const s = tubuh[n]; const w = s.img.w;
    const c = { id: `${n}-kanan`, hadap: 'kanan', cerminDari: n, jenisJangkar: 'kaki', asal: { lembar: s.asal.lembar + ' (dicermin)' } };
    c.img = L.cermin(s.img); c.imgFinal = L.cermin(s.imgFinal);
    for (const k of ['jangkar', 'kaki', 'kunci', 'kepala', 'leher', 'titikWajah']) c[k] = cerminTitik(s[k], w);
    c.kotakWajahR = cerminKotak([s.kotakWajah.x, s.kotakWajah.y, s.kotakWajah.w, s.kotakWajah.h], w);
    c.kotakMata = s.kotakMata && cerminKotak(s.kotakMata, w); c.kotakMulut = s.kotakMulut && cerminKotak(s.kotakMulut, w);
    c.wajah = {}; for (const e of EKSPRESI) { c.wajah[e] = {}; for (const v of ['dasar', ...VARIAN]) c.wajah[e][v] = L.cermin(s.wajah[e][v]); }
    const Mc = new Uint8Array(s.M.length); for (let p = 0; p < s.M.length; p++) if (s.M[p]) { const x = p % w, y = (p / w) | 0; Mc[y * w + (w - 1 - x)] = 1; }
    c.M = Mc; c.cocok = s.cocok;
    tubuh[c.id] = c;
  }
  for (const t of Object.values(tubuh)) if (!t.kotakWajahR) t.kotakWajahR = [t.kotakWajah.x, t.kotakWajah.y, t.kotakWajah.w, t.kotakWajah.h];

  /* ---------- G. potongan: tubuh (trim), wajah (kotak mask), mata, mulut */
  const potongan = []; // { kunci, img }
  const potongMask = (img, M, k) => { const o = L.buat(k[2], k[3]); for (let y = 0; y < k[3]; y++) for (let x = 0; x < k[2]; x++) { const sx = k[0] + x, sy = k[1] + y; if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h || !M[sy * img.w + sx]) continue; R.setel(o, x, y, R.warna(img, sx, sy)); } return o; };
  for (const t of Object.values(tubuh)) {
    const tr = trimKotak(t.imgFinal); t.trim = tr;
    potongan.push({ kunci: `tubuh:${t.id}`, img: L.potong(t.imgFinal, tr.x, tr.y, tr.w, tr.h) });
    for (const e of EKSPRESI) {
      potongan.push({ kunci: `wajah:${t.id}:${e}:dasar`, img: potongMask(t.wajah[e].dasar, t.M, t.kotakWajahR) });
      if (t.kotakMata) for (const v of ['kedip', 'bawah']) potongan.push({ kunci: `wajah:${t.id}:${e}:${v}`, img: potongMask(t.wajah[e][v], t.M, t.kotakMata) });
      if (t.kotakMulut) potongan.push({ kunci: `wajah:${t.id}:${e}:bicara`, img: potongMask(t.wajah[e].bicara, t.M, t.kotakMulut) });
    }
  }

  /* ---------- H. atlas (rak/shelf, dedup identik) */
  const unik = new Map(); const peta = {};
  for (const p of potongan) {
    const h = crypto.createHash('sha1').update(p.img.d).update(`${p.img.w}x${p.img.h}`).digest('hex');
    if (!unik.has(h)) unik.set(h, { img: p.img, h });
    peta[p.kunci] = h;
  }
  const daftar = [...unik.values()];
  // lebar atlas: coba beberapa, ambil luas terkecil (tinggi <= 1024)
  let pilih = null;
  for (const Wc of [384, 448, 512, 576, 640, 768, 896, 1024]) {
    const it = daftar.map((u) => ({ w: u.img.w, h: u.img.h, u }));
    let Hc; try { Hc = R.kemas(it, Wc); } catch { continue; }
    if (Hc > 1024) continue;
    if (!pilih || Wc * Hc < pilih.W * pilih.H) pilih = { W: Wc, H: Hc, it };
  }
  for (const t of pilih.it) { t.u.x = t.x; t.u.y = t.y; }
  const LEBAR = pilih.W, AH = pilih.H;
  const atlas = L.buat(LEBAR, AH);
  for (const u of daftar) L.tempel(atlas, u.img, u.x, u.y);
  const rect = (kunci) => { const u = unik.get(peta[kunci]); return u ? [u.x, u.y, u.img.w, u.img.h] : null; };

  /* ---------- I. manifest */
  const rel = (t, p) => (p ? { x: +(p.x - t.trim.x).toFixed(2), y: +(p.y - t.trim.y).toFixed(2) } : undefined);
  const relK = (t, k) => (k ? [k[0] - t.trim.x, k[1] - t.trim.y, k[2], k[3]] : undefined);
  const frame = {};
  for (const t of Object.values(tubuh)) {
    const f = {
      rect: rect(`tubuh:${t.id}`), hadap: t.hadap, jenisJangkar: t.jenisJangkar,
      jangkar: rel(t, t.jangkar), kaki: rel(t, t.kaki), kepala: rel(t, t.kepala), leher: rel(t, t.leher), titikWajah: rel(t, t.titikWajah),
      tangan: t.kunci ? { kunci: rel(t, t.kunci) } : t.gagang ? { telepon: rel(t, t.gagang) } : undefined,
      kunciTergambar: !!t.kunci, teleponTergambar: !!t.gagang,
      wajah: { kotak: relK(t, t.kotakWajahR), mata: relK(t, t.kotakMata), mulut: relK(t, t.kotakMulut) },
      ekspresi: {}, asal: t.asal, cerminDari: t.cerminDari,
    };
    for (const e of EKSPRESI) {
      f.ekspresi[e] = { dasar: rect(`wajah:${t.id}:${e}:dasar`) };
      if (t.kotakMata) { f.ekspresi[e].kedip = rect(`wajah:${t.id}:${e}:kedip`); f.ekspresi[e].bawah = rect(`wajah:${t.id}:${e}:bawah`); }
      if (t.kotakMulut) f.ekspresi[e].bicara = rect(`wajah:${t.id}:${e}:bicara`);
    }
    frame[t.id] = f;
  }
  const d = tubuh.duduk; const fw = { x: d.titikWajah.x - d.trim.x, y: d.titikWajah.y - d.trim.y };
  const jendela = (sisi, skala, dy = 0) => ({ frame: 'duduk', x: Math.round(fw.x - sisi / 2), y: Math.round(fw.y - sisi / 2 + dy), sisi, skala, tampil: sisi * skala });
  const tl = tubuh.telepon; const fwt = { x: tl.titikWajah.x - tl.trim.x, y: tl.titikWajah.y - tl.trim.y };
  const manifest = {
    versi: 1, dibuat: 'tools/piksel/bangun-rina.mjs', tokoh: 'bu-rina', piksel: 4, gambar: 'bu-rina.png', ukuranAtlas: [LEBAR, AH],
    satuan: { dunia: 'piksel seni x 4', catatan: 'koordinat = piksel seni relatif pojok kiri-atas frame; tampilkan dengan skala bulat & nearest-neighbour' },
    skala: {
      unitDuniaPerPikselSeni: 4, pxSumberPerPikselSeni: Object.fromEntries(Object.entries(lapNative.lembar).map(([k, v]) => [k, v.pitch])),
      dasar: `wajah Bu Rina disamakan dengan wajah Miss Raksa pada master-nya (7,34 px sumber/px seni); lembar pose = ${P_POSE}`,
    },
    palet: palet.map(L.hex),
    ekspresi: EKSPRESI, varian: ['dasar', ...VARIAN],
    urutanGambar: ['tubuh (frame.rect)', 'wajah ekspresi dasar (frame.ekspresi[e].dasar di frame.wajah.kotak)', 'kedip ATAU bawah (di frame.wajah.mata)', 'bicara (di frame.wajah.mulut)'],
    frame,
    pose: {
      berdiri: { kiri: 'berdiri', kanan: 'berdiri-kanan' },
      'jalan-a': { kiri: 'jalan-a', kanan: 'jalan-a-kanan' },
      'jalan-b': { kiri: 'jalan-b', kanan: 'jalan-b-kanan', catatan: 'bingkai lintas: badan atas = jalan-a (terkunci), satu kaki menapak, kaki jauh terayun; badan 1 px lebih tinggi' },
      'berdiri-pergi': { kanan: 'berdiri-kanan' },
      'duduk-turun': { kiri: 'duduk-turun' },
      duduk: { kiri: 'duduk', tubuhEkspresi: TUBUH_EKSPRESI },
      'duduk-condong': { kiri: 'duduk-condong' },
      telepon: { kiri: 'telepon', catatan: 'hanya untuk sisipan panggilan (kepala & bahu)' },
    },
    animasi: {
      jalan: { kiri: ['jalan-a', 'jalan-b'], kanan: ['jalan-a-kanan', 'jalan-b-kanan'], catatan: 'langkah <-> lintas; badan atas identik di atas keliman; jangkar x sama, kepala naik-turun 1 px (lintas lebih tinggi); berhenti -> berdiri' },
      duduk: ['berdiri', 'duduk-turun', 'duduk'], berdiriDariDuduk: ['duduk', 'duduk-turun', 'berdiri'],
    },
    keluargaDuduk: { frame: KELUARGA_DUDUK, catatan: 'rect trim berbeda, tetapi jangkar pinggul menunjuk titik dunia yang sama; kaki & sepatu identik antar gestur (kecuali duduk-condong)' },
    potret: {
      frame: 'duduk', catatan: 'gambar tubuh duduk + wajah ekspresi, lalu potong jendela (koordinat frame duduk); skala bulat',
      jendela: { 32: jendela(32, 1, 2), 44: jendela(44, 1, 4), 52: jendela(52, 1, 6), 64: jendela(64, 1, 10), 96: jendela(48, 2, 6) },
      dekat: { 52: jendela(26, 2, 3), 64: jendela(32, 2, 2), 96: jendela(32, 3, 2) },
      saran: 'avatar 52-96 px: jendela dekat (wajah x2/x3) paling terbaca; 32-44 px hanya x1 (fitur 1 px, beda ekspresi halus)',
    },
    telepon: { frame: 'telepon', jendela: { x: Math.round(fwt.x - 29), y: Math.max(0, Math.round(fwt.y - 29)), sisi: 56 }, catatan: 'kepala utuh + gagang + bahu; skala bulat (x1 = 56 px, x2 = 112 px)' },
    aktivitas: { frame: 'berdiri', ekspresi: 'netral', catatan: 'berdiri membawa kunci; tubuh sudah berwajah netral sehingga cukup satu gambar untuk Phaser' },
  };
  if (tulis) {
    for (const t of Object.values(tubuh)) L.tulis(path.join(DIR, 'native', `${t.id}.png`), t.imgFinal);
    for (const e of EKSPRESI) for (const v of ['dasar', ...VARIAN]) L.tulis(path.join(DIR, 'native', 'wajah', `${e}-${v}.png`), kepala[e][v]);
    fs.writeFileSync(path.join(DIR, 'native', 'log-suntingan.json'), JSON.stringify({ suntingan: log, registrasiDuduk: reg, geserEkspresi: Object.fromEntries(EKSPRESI.map((e) => [e, kepala[e].geser])), bersihWajah: Object.fromEntries(EKSPRESI.map((e) => [e, kepala[e].bersih])), cocokWajah: Object.fromEntries(Object.values(tubuh).map((t) => [t.id, t.cocok])) }, null, 1));
    const ip = R.tulisPngIndeks(KELUAR_PNG, atlas); manifest.berkas = { byte: ip.byte, warna: ip.warna, format: 'PNG terindeks 8-bit + tRNS (indeks 0 transparan)' };
    fs.writeFileSync(KELUAR_JSON, JSON.stringify(manifest, null, 1));
  }
  return { tubuh, kepala, atlas, manifest, palet, log };
}

if (process.argv[1]?.endsWith('bangun-rina.mjs')) {
  const t0 = Date.now();
  const { manifest, log: lg } = bangun();
  console.log('atlas', manifest.ukuranAtlas.join('x'), 'frame', Object.keys(manifest.frame).length, 'dalam', ((Date.now() - t0) / 1000).toFixed(1), 'dtk');
  for (const l of lg) console.log(' suntingan', l.op, l.frame || l.ke, l.berubah);
  const st = fs.statSync(KELUAR_PNG); console.log('png', (st.size / 1024).toFixed(1), 'KB');
}
