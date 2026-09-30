/**
 * Miss Raksa — bangun frame produksi piksel (deterministik): native -> kepala terkunci -> badan per pose & arah ->
 * wajah ekspresi (5 x dasar/kedip/bawah/bicara) -> atlas + manifest.
 *
 *   node tools/piksel/bangun-miss.mjs            (± 10 dtk)
 *   node tools/piksel/miss-tinjau.mjs <folder>   (lembar tinjau, disusun ulang HANYA dari atlas + manifest)
 *
 * Keluaran: character/piksel/miss-raksa/native/  (bahan & frame native, log-suntingan.json)
 *           client/src/cerita/seni/piksel/miss-raksa.png + .json   (skema: docs/cerita/aset/MISS-RAKSA-PIKSEL.md)
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';
import * as T from './miss-tubuh.mjs';
import * as W from './miss-wajah.mjs';
import { bangunNative, DIR } from './miss-native.mjs';
import { SEL_DETAIL, LENCANA, DUDUK, BAWAH, TURUN, HURUF, FRAME, PALET, WAJAH } from './miss-suntingan.mjs';
import * as A from './miss-atlas.mjs';
import { P_MASTER, P_GESTUR, P_EKSPRESI } from './miss-native.mjs';

export const KELUAR_PNG = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel', 'miss-raksa.png');
export const KELUAR_JSON = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel', 'miss-raksa.json');

const hexXY = (img, x, y) => L.hex(M.warna(img, x, y));

/** Nama varian mata `bawah` pengganti per frame (FRAME[...].mataBawah), urut & unik. */
export const PENGGANTI = [...new Set(Object.values(FRAME).flatMap((R) => Object.values(R.mataBawah || {})))].sort();

/**
 * Badan per arah dari badan dasar (arah kiri): kiri = lambang placeholder -> lencana polos; kanan = cermin + kancing &
 * garis bukaan dikembalikan ke sisi kanan pemakai + lencana polos. Kembalian { img, n }.
 */
function badanArah(src, arah, d) {
  const K = T.KANVAS;
  if (arah === 'kiri') {
    const mLen = T.maskDetail(src, { lencana: d.lencana });
    const img = T.isiJas(src, mLen).img;
    const u = T.gambarDiJas(img, LENCANA.kiri.x, LENCANA.kiri.y, LENCANA.baris);
    return { img, n: mLen.reduce((a, v) => a + v, 0) + u.length };
  }
  const mDet = T.maskDetail(src, d);
  const cer = T.cerminKanvas(src);
  const mC = new Uint8Array(mDet.length);
  for (let p = 0; p < mDet.length; p++) if (mDet[p]) { const x = p % K.w, y = (p / K.w) | 0; mC[y * K.w + (K.w - 1 - x)] = 1; }
  const img = T.isiJas(cer, mC).img;
  T.tempelMask(img, src, T.maskDetail(src, { kancing: d.kancing.filter((_, i) => !(d.kananLewati || []).includes(i)), plaket: d.plaket }), d.kananGeser || 0, true);
  const u = T.gambarDiJas(img, LENCANA.kanan.x, LENCANA.kanan.y, LENCANA.baris);
  return { img, n: mDet.reduce((a, v) => a + v, 0) + u.length };
}

export function bangunFrame(nat, catat) {
  const K = T.KANVAS;
  const { render } = W.renderSemua(nat, K.w, K.h, catat, PENGGANTI);
  // kepala dasar = wajah netral (fitur master); ekspresi lain = render (lapisan wajah di atlas)
  const kepala = { kiri: render['kiri:netral:dasar'], kanan: render['kanan:netral:dasar'] };
  const kepalaNetral = kepala;
  const master = nat.master;
  const sel = {};
  const ambilSel = (n) => {
    if (sel[n]) return sel[n];
    const s = T.sejajarSel(nat[n]);
    const tk = T.tanpaKepala(s.img);
    catat({ op: 'sejajarKerah', frame: n, geser: s.geser, berubah: tk.dihapus, alasan: 'kepala sel dibuang (diganti kepala dasar terkunci)' });
    return (sel[n] = { img: tk.img, geser: s.geser });
  };
  const frame = {};
  for (const [pose, R] of Object.entries(FRAME)) {
    const s = ambilSel(R.sel);
    let dasar = s.img;
    if (R.jenis === 'berdiri') {
      const b = T.pasangBawah(dasar, master, BAWAH);
      dasar = b.img;
      catat({ op: 'pasangBawah', frame: pose, ...BAWAH, berubah: b.n, alasan: 'rok + kaki + sepatu master di bawah jas lembar gestur (rok emas mengikuti sprite lama; ramp digeser 1 tingkat ke emas lembar gestur)' });
    }
    // duduk v5: lengan bawah + tangan diturunkan ke permukaan meja (badan lebih tinggi terhadap meja), SEBELUM
    // pecah kiri/kanan supaya kedua arah (kanan = cermin) memakai badan yang sama; detail jas dihitung sesudahnya.
    let lenganMask = null, tanpaLengan = null;
    for (const P of R.lengan ? [].concat(R.lengan) : []) {
      const t = T.turunkanLengan(dasar, P);
      dasar = t.img; tanpaLengan ||= t.tanpa;
      if (!lenganMask) lenganMask = t.lengan; else for (let p = 0; p < t.lengan.length; p++) lenganMask[p] |= t.lengan[p];
      catat({ op: 'turunkanLengan', frame: pose, R0: P.R0, R1: P.R1, D: P.D, berubah: t.n, alasan: 'duduk v5: badan naik terhadap meja (garisMeja ' + DUDUK.garisMeja + '); lengan bawah + manset + tangan turun ' + P.D + ' baris ke permukaan meja (regang siku -> manset), jas di balik tangan diisi' + (P.alasan ? '; ' + P.alasan : '') });
    }
    const d = SEL_DETAIL[R.sel];
    for (const arah of R.arah) {
      const id = `${pose}-${arah}`;
      const b = badanArah(dasar, arah, d);
      let img = b.img;
      if (arah === 'kiri') catat({ op: 'lencanaPolos', frame: id, berubah: b.n, alasan: 'lambang placeholder lembar dihapus -> batang emas polos (dada kiri pemakai)' });
      else catat({ op: 'detailKanan', frame: id, berubah: b.n, alasan: 'cermin: kancing & garis bukaan dikembalikan ke sisi kanan pemakai (kiri gambar), lencana polos ke dada kiri pemakai (kanan gambar)' });
      const ops = (daftar) => (daftar || []).filter((o) => o.arah === arah || o.arah === 'keduanya').map((o) => (arah === 'kanan' && o.cermin ? cerminOp(o) : o));
      // sumber salinPoligon: badan tanpa lengan bawah (turunkanLengan), lewat badanArah yang SAMA (kanan: cermin +
      // kancing/garis bukaan dikembalikan) supaya badan yang dikembalikan cocok dengan badan frame
      const sumber = tanpaLengan ? { tanpaLengan: badanArah(tanpaLengan, arah, d).img } : {};
      for (const op of ops(R.suntingan)) catat({ op: op.op, frame: id, berubah: T.terapkan(img, op, sumber), alasan: op.alasan });
      // kepala dasar (wajah netral terpanggang)
      L.tempel(img, kepalaNetral[arah], 0, 0);
      for (const op of ops(R.depan)) catat({ op: op.op, frame: id, berubah: T.terapkan(img, op), alasan: op.alasan, lapisan: 'depan' });
      const f = { id, pose, arah, jenis: R.jenis, sel: R.sel };
      if (R.jenis === 'duduk') {
        const sp = R.simpan?.[arah] === 'cermin' ? cerminSimpan(R.simpan.kiri) : R.simpan?.[arah] || {};
        const pm = T.potongMeja(img, DUDUK.garisMeja, []);
        // kembalikan piksel simpan dari gambar sebelum potong
        const cut = pm.img;
        for (const [ys, iv] of Object.entries(sp)) { const y = +ys; for (const [x0, x1] of iv) for (let x = x0; x <= x1; x++) if (M.buramXY(img, x, y)) M.setel(cut, x, y, M.warna(img, x, y)); }
        // + piksel lengan/tangan yang diturunkan (turunkanLengan; kanan = cermin), di bawah garis meja
        if (lenganMask && R.simpanLengan !== false) for (let p = 0; p < lenganMask.length; p++) {
          if (!lenganMask[p]) continue; const y = (p / K.w) | 0; if (y < DUDUK.garisMeja) continue;
          const x = arah === 'kanan' ? K.w - 1 - (p % K.w) : p % K.w;
          if (!(R.simpanLengan?.kecuali || []).some(([x0, y0, w, h]) => { const xx = arah === 'kanan' ? K.w - 1 - x : x; return xx >= x0 && xx < x0 + w && y >= y0 && y < y0 + h; }) && M.buramXY(img, x, y)) M.setel(cut, x, y, M.warna(img, x, y));
        }
        catat({ op: 'potongMeja', frame: id, garisMeja: DUDUK.garisMeja, berubah: pm.dihapus, alasan: 'badan di bawah garis meja tertutup meja; hanya lengan bawah/tangan yang bertumpu di meja disimpan' });
        img = cut;
        f.garisMeja = DUDUK.garisMeja;
        f.jangkar = { ...DUDUK.pinggul[arah] };
        // kolom lengan di baris tepi jauh meja (garisMeja - 1): diAtasMeja naik 1 baris hanya di sini
        const tl = R.tepiLengan === 'otomatis' ? intervalTepi(img, DUDUK.garisMeja) : R.tepiLengan === 'lengan' ? intervalMask(lenganMask, DUDUK.garisMeja - 1, arah, img) : R.tepiLengan?.[arah] === 'cermin' ? cerminInterval(R.tepiLengan.kiri) : R.tepiLengan?.[arah] || [];
        if (tl.length) {
          f.tepiLengan = tl;
          const n = tl.reduce((a, [x0, x1]) => { let k = 0; for (let x = x0; x <= x1; x++) if (M.buramXY(img, x, DUDUK.garisMeja - 1)) k++; return a + k; }, 0);
          catat({ op: 'tepiLengan', frame: id, baris: DUDUK.garisMeja - 1, interval: tl, berubah: 0, pikselLengan: n, alasan: 'lengan yang melintas tepi jauh meja digambar DI ATAS garis tepi (diAtasMeja +1 baris hanya di kolom lengan; torso tetap di balik meja)' });
        }
      }
      if (R.jenis === 'turun') {
        // bingkai antara: badan di bawah garis meja (posisi antara) tertutup meja -> dibuang; jangkar kaki di bawah rect
        const pm = T.potongMeja(img, TURUN.garisMeja, []);
        catat({ op: 'potongMeja', frame: id, garisMeja: TURUN.garisMeja, berubah: pm.dihapus, alasan: 'duduk-turun: badan di bawah tepi meja (lutut menekuk, paha) tertutup meja pada posisi antara' });
        img = pm.img;
        const kb = A.jangkarKaki(frame[`berdiri-${arah}`].img);
        f.garisMeja = TURUN.garisMeja;
        f.jangkar = { x: kb.x, y: TURUN.kakiY };
        f.turun = { ...TURUN, kakiBerdiri: kb };
      }
      if (R.mataBawah?.[arah]) f.mataBawah = R.mataBawah[arah];
      if (R.tanganMeja?.[arah]) f.tanganMeja = R.tanganMeja[arah];
      f.img = img;
      frame[id] = f;
    }
  }
  return { frame, kepala, kepalaNetral, sel, render, pengganti: PENGGANTI };
}

/**
 * Pemeriksaan mata TERBUKA (v5, dari render kepala kiri): di tiap kotak mata (WAJAH.kotakMata: jauh & dekat, kanvas)
 * varian `dasar` & `bawah` (+ mata pengganti per frame) setiap ekspresi harus punya iris (#340d03 #461605 #581f08
 * #7b3914) >= 3 piksel pada >= 2 baris dan putih mata (#f7f2ea #e1dee2 #cdc8ce) >= 1 piksel; varian `kedip` harus
 * TANPA putih mata (tertutup). Ronde 3 v4: versi `bawah` yang terbaca terpejam gagal di sini. Gagal = lempar galat.
 */
const IRIS = new Set(['#340d03', '#461605', '#581f08', '#7b3914']);
const PUTIH_MATA = new Set(['#f7f2ea', '#e1dee2', '#cdc8ce']);
export function periksaMata(render) {
  const hasil = {};
  const hitung = (img, [x0, y0, w, h]) => {
    let iris = 0, putih = 0; const baris = new Set();
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (!M.buramXY(img, x, y)) continue; const c = hexXY(img, x, y);
      if (IRIS.has(c)) { iris++; baris.add(y); } else if (PUTIH_MATA.has(c)) putih++;
    }
    return { iris, barisIris: baris.size, putih };
  };
  for (const e of W.EKSPRESI) for (const v of ['dasar', 'bawah', 'kedip', ...PENGGANTI.map((p) => 'bawah:' + p)]) {
    const img = render[`kiri:${e}:${v}`];
    const r = Object.fromEntries(Object.entries(WAJAH.kotakMata).map(([n, k]) => [n, hitung(img, k)]));
    for (const [n, h] of Object.entries(r)) {
      if (v === 'kedip') { if (h.putih) throw new Error(`mata ${n} ${e}/kedip masih terbuka: putih ${h.putih}`); continue; }
      if (h.iris < 3 || h.barisIris < 2 || h.putih < 1) throw new Error(`mata ${n} ${e}/${v} terbaca tertutup: iris ${h.iris} px / ${h.barisIris} baris, putih ${h.putih}`);
    }
    hasil[`${e}:${v}`] = r;
  }
  return hasil;
}

/**
 * Kolom lengan di baris y (tepi jauh meja) dari mask turunkanLengan (arah kiri; kanan = cermin), hanya piksel yang
 * masih buram di gambar frame (lengan yang dihapus/diganti pose lain tidak ikut). Kembalian [[x0,x1],...] inklusif.
 */
function intervalMask(mask, y, arah, img) {
  const W0 = T.KANVAS.w; const iv = []; let a = -1;
  for (let x = 0; x <= W0; x++) {
    const xs = arah === 'kanan' ? W0 - 1 - x : x;
    const on = x < W0 && mask && mask[y * W0 + xs] && M.buramXY(img, x, y);
    if (on && a < 0) a = x; else if (!on && a >= 0) { iv.push([a, x - 1]); a = -1; }
  }
  return iv;
}

/** Kolom [x0,x1] di baris y-1 yang buram DAN buram di baris y (lengan/tangan melintas tepi meja y). */
function intervalTepi(img, y) {
  const iv = []; let a = -1;
  for (let x = 0; x <= img.w; x++) {
    const on = x < img.w && M.buramXY(img, x, y - 1) && M.buramXY(img, x, y);
    if (on && a < 0) a = x; else if (!on && a >= 0) { iv.push([a, x - 1]); a = -1; }
  }
  return iv;
}

/** Cermin operasi suntingan (sumbu kerah). */
function cerminOp(o) {
  const W0 = T.KANVAS.w;
  if (o.op === 'ascii') { const w = Math.max(...o.baris.map((b) => b.length)); return { ...o, x: W0 - o.x - w, baris: o.baris.map((b) => [...b.padEnd(w, '.')].reverse().join('')) }; }
  if (o.op === 'hapusPoligon' || o.op === 'salinPoligon') return { ...o, poligon: o.poligon.map(([x, y]) => [W0 - x, y]) };
  if (o.op === 'ganti') return { ...o, kotak: T.cerminKotak(o.kotak) };
  throw new Error('cermin op ' + o.op);
}
function cerminSimpan(sp) { const o = {}; for (const [y, iv] of Object.entries(sp)) o[y] = cerminInterval(iv); return o; }
function cerminInterval(iv) { return iv.map(([a, b]) => [T.KANVAS.w - 1 - b, T.KANVAS.w - 1 - a]).reverse(); }

/**
 * Jendela sisipan telepon (koordinat frame): kepala UTUH (y 0 = 1 px di atas puncak sanggul) + gagang + tangan + mulut.
 * x = tengah kotak piksel buram di atas kerah (kepala, gagang, tangan; kanvas y < KERAH) dipusatkan di jendela.
 */
function jendelaTelepon(F, S, id, sisi) {
  const img = F.frame[id].img; const kv = S.frame[id].kanvas;
  let x0 = Infinity, x1 = -Infinity;
  for (let y = 0; y < T.KERAH.y; y++) for (let x = 0; x < img.w; x++) if (M.buramXY(img, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); }
  const pusatX = (x0 + x1) / 2 - kv.x;
  return A.jendela(id, sisi, 1, { x: pusatX, y: sisi / 2 });
}

export function bangun({ tulis = true, periksa = true } = {}) {
  const log = [];
  const catat = (o) => { log.push(o); return o; };
  const { hasil, rata, laporan: lapNative } = bangunNative({ tulis });
  const nat = { ...hasil, rata };
  const F = bangunFrame(nat, catat);
  if (periksa) catat({ op: 'periksaMata', frame: '*', berubah: 0, hasil: periksaMata(F.render), alasan: 'v5: dasar & bawah = mata terbuka (iris 2+ baris, putih terlihat); kedip = tertutup' });
  const S = A.susun(F);
  for (const a of ['kiri', 'kanan']) for (const e of W.EKSPRESI) for (const v of ['dasar', ...W.VARIAN]) {
    catat({ op: 'fiturWajah', frame: `kepala-${a}`, ekspresi: e, varian: v, berubah: M.selisih(F.kepala[a], S.render[`${a}:${e}:${v}`]).length, alasan: 'beda vs netral dasar (fitur master e-netral + cangkok/suntingan WAJAH di miss-suntingan.mjs)' });
  }
  const pose = {};
  for (const fr of Object.values(F.frame)) { (pose[fr.pose] ||= {})[fr.arah] = fr.id; }
  pose['berdiri-sambut'].catatan = 'pembuka: kiri (menghadap pemain)';
  pose['berdiri-persilakan'].catatan = 'kanan: telapak terbuka ke kursi pengunjung (kanan gambar)';
  pose['duduk-tunjuk'].bawaan = 'kanan';
  pose['duduk-tunjuk'].kartu = { arah: 'kanan', varian: 'bawah', catatan: 'momen kartu: telunjuk DAN pandangan ke kartu (kartuMeja, kanan gambar)' };
  pose['duduk-tunjuk'].catatan = 'bawaan/momen kartu = kanan + varian bawah. kiri HANYA untuk bicara ke pemain sambil menunjuk (kepala & mata ke pemain); varian bawah frame kiri = mata melirik kanan-bawah ke kartu (frame.mataBawah = lirikKanan), kepala tetap ke pemain';
  pose.telepon.catatan = 'satu gagang di tangan dekat, di telinga dekat; panggung hanya menggambar pesawat tanpa gagang';
  pose['duduk-turun'].bawaan = 'kanan';
  pose['duduk-turun'].catatan = 'bingkai antara berdiri <-> duduk (hanya animasi panggung, seperti duduk-turun Bu Rina): kanan = kedatangan (berdiri-persilakan-kanan -> duduk-turun-kanan -> duduk-dengar-kanan); kiri = sama ke arah pemain. Jangkar kaki di y lantai tempat.mentorBerdiri, x sehingga kepala di tengah kepala berdiri & duduk; gambar DI BALIK meja';
  const fd = S.frame['duduk-dengar-kiri'];
  const wajahD = fd.titikWajah; const kepalaD = fd.kepala;
  const manifest = {
    versi: 1, dibuat: 'tools/piksel/bangun-miss.mjs', tokoh: 'miss-raksa', piksel: 4, gambar: 'miss-raksa.png', ukuranAtlas: [S.atlas.w, S.atlas.h],
    satuan: { dunia: 'piksel seni x 4', catatan: 'koordinat = piksel seni relatif pojok kiri-atas frame (rect trim); titik di batas piksel; tampilkan dengan skala bulat & nearest-neighbour' },
    skala: {
      unitDuniaPerPikselSeni: 4, pxSumberPerPikselSeni: { master: P_MASTER, gestur: P_GESTUR, ekspresi: P_EKSPRESI },
      kepala: 'puncak sanggul -> dagu = ' + fd.kepalaTinggi + ' piksel seni (skala native master 7,34 px sumber/px seni)',
    },
    palet: PALET,
    ekspresi: W.EKSPRESI, varian: ['dasar', ...W.VARIAN],
    ekspresiDari: A.EKSPRESI_DARI,
    urutanGambar: ['tubuh (frame.rect; wajah netral terpanggang)', 'wajah ekspresi dasar (frame.ekspresi[e].dasar di frame.wajah.kotak)', 'kedip ATAU bawah (di frame.wajah.mata)', 'bicara (di frame.wajah.mulut)', 'duduk: gambar tubuh yang SAMA dipotong ke frame.diAtasMeja, sesudah permukaan meja & prop'],
    frame: S.frame,
    pose,
    pandang: {
      lawan: { arah: 'kanan', catatan: 'menatap Bu Rina' }, pemain: { arah: 'kiri' }, depan: { arah: 'kiri' },
      bawah: { varian: 'bawah', catatan: 'lirik ke bawah (membaca kartu/dokumen): garis bulu mata turun 1 baris, iris 2 baris tetap terlihat di antara putih mata (bukan mata terpejam); arah mengikuti pose. duduk-tunjuk: arah kanan (pose.duduk-tunjuk.kartu); bila tetap kiri, frame kiri melirik kanan-bawah ke kartu' },
    },
    animasi: {
      duduk: ['berdiri-persilakan', 'duduk-turun', 'duduk-dengar'], berdiriDariDuduk: ['duduk-dengar', 'duduk-turun', 'berdiri'],
      catatan: 'pose (arah sama, bawaan kanan); duduk-turun ditahan singkat (seperti TAHAN_TURUN Bu Rina) supaya kepala turun dua langkah, bukan satu lompatan',
    },
    potret: {
      frame: 'duduk-dengar-kiri', catatan: 'tubuh duduk + wajah ekspresi, potong jendela (koordinat frame duduk-dengar-kiri); skala bulat',
      jendela: { 32: A.jendela('duduk-dengar-kiri', 32, 1, { x: wajahD.x, y: wajahD.y - 3 }), 44: A.jendela('duduk-dengar-kiri', 44, 1, { x: wajahD.x, y: wajahD.y - 6 }), 52: A.jendela('duduk-dengar-kiri', 52, 1, { x: kepalaD.x, y: kepalaD.y + 2 }), 64: A.jendela('duduk-dengar-kiri', 64, 1, { x: kepalaD.x, y: kepalaD.y + 7 }), 96: A.jendela('duduk-dengar-kiri', 48, 2, { x: kepalaD.x, y: kepalaD.y + 1 }) },
      dekat: { 52: A.jendela('duduk-dengar-kiri', 26, 2, wajahD), 64: A.jendela('duduk-dengar-kiri', 32, 2, { x: wajahD.x, y: wajahD.y - 1 }), 96: A.jendela('duduk-dengar-kiri', 32, 3, { x: wajahD.x, y: wajahD.y - 1 }) },
      saran: 'avatar 52-96 px: jendela dekat (wajah x2/x3) paling terbaca; 32-44 px hanya x1 (fitur 1 px)',
    },
    telepon: { frame: 'telepon-kiri', jendela: jendelaTelepon(F, S, 'telepon-kiri', 56), catatan: 'kepala UTUH (sanggul) + gagang + tangan + mulut, sama dengan sisipan Bu Rina (56 px, y 0); skala bulat (x1 = 56 px, x2 = 112 px)' },
    aktivitas: { frame: 'berdiri-kiri', ekspresi: 'senyum', catatan: 'berdiri, tangan bertaut; wajah senyum ditempel dari lapisan ekspresi' },
  };
  if (tulis) {
    for (const fr of Object.values(F.frame)) L.tulis(path.join(DIR, 'native', `${fr.id}.png`), fr.img);
    for (const a of ['kiri', 'kanan']) { L.tulis(path.join(DIR, 'native', 'wajah', `kepala-dasar-${a}.png`), F.kepala[a]); for (const e of W.EKSPRESI) for (const v of ['dasar', ...W.VARIAN]) L.tulis(path.join(DIR, 'native', 'wajah', `${a}-${e}-${v}.png`), S.render[`${a}:${e}:${v}`]); }
    fs.writeFileSync(path.join(DIR, 'native', 'log-suntingan.json'), JSON.stringify({ suntingan: log }, null, 1));
    const ip = M.tulisPngIndeks(KELUAR_PNG, S.atlas, PALET.map(L.dariHex));
    manifest.berkas = { byte: ip.byte, warna: ip.warna, format: 'PNG terindeks 8-bit + tRNS (indeks 0 transparan)' };
    fs.writeFileSync(KELUAR_JSON, JSON.stringify(manifest, null, 1));
  }
  return { nat, ...F, S, manifest, log };
}

if (process.argv[1]?.endsWith('bangun-miss.mjs')) {
  const t0 = Date.now();
  const r = bangun();
  console.log('frame', Object.keys(r.frame).length, 'atlas', r.manifest.ukuranAtlas.join('x'), r.manifest.berkas?.byte, 'byte', r.manifest.berkas?.warna, 'warna', 'dalam', ((Date.now() - t0) / 1000).toFixed(1), 'dtk');
}
