/**
 * Miss Raksa — kepala terkunci & wajah ekspresi (v5: fitur MASTER dipertahankan).
 *
 * SATU kepala dasar per arah (koordinat kanvas kanonik miss-tubuh.KANVAS):
 *  - 'kiri': sel ekspresi `e-netral` (native, palet) APA ADANYA: mata, alis, mulut, rona pipi, bayangan rahang master
 *    TIDAK dihapus (v4 menghapusnya lalu menggambar sprite ASCII generik -> wajah sayu & rata). Di atasnya hanya
 *    suntingan tangan kecil yang tercatat (WAJAH.dasar: bukaan mata & arah tatapan dibaca ulang dari lembar master).
 *    Digeser KEPALA_GESER (kerah sel ekspresi -> KERAH kanonik).
 *  - 'kanan': cermin 'kiri' di sumbu kerah + suntingan belahan rambut (WAJAH.belahanKanan): belahan kembali ke sisi
 *    kepala yang sama (kepala KIRI pemakai), bukan ikut tercermin.
 *
 * Ekspresi & varian = kepala dasar + operasi di WAJAH.ekspresi[e] / WAJAH.varian[v][e] (koordinat sel e-netral):
 *  - { cangkok: 'e-prihatin', kotak: [x,y,w,h] }: CANGKOK wilayah fitur dari sel ekspresi lain yang sudah didaftarkan
 *    ke kepala e-netral (daftarSel: geser bulat terbaik pada siluet + kelas warna rambut/kulit/garis DI LUAR kotak
 *    fitur, jadi registrasi memakai sanggul/garis rambut/telinga/kerah, bukan fitur). Hanya piksel yang buram di KEDUA
 *    gambar yang ditulis; kulit, hidung, pipi, rambut di luar kotak tetap milik kepala dasar -> kepala tidak bergeser.
 *  - { x, y, baris }: pola huruf HURUF ('.' = biarkan) = suntingan tangan (sambungan cangkok, tatapan, kelopak).
 * Kotak fitur manifest (wajah/mata/mulut) = kotak gabungan piksel yang BENAR-BENAR berubah (dihitung dari render).
 */
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';
import { HURUF, WAJAH } from './miss-suntingan.mjs';
import { KERAH, EMAS, cerminKanvas } from './miss-tubuh.mjs';

export const EKSPRESI = ['netral', 'senyum', 'prihatin', 'serius', 'lega'];
export const VARIAN = ['kedip', 'bawah', 'bicara'];
/** Geser koordinat sel ekspresi -> kanvas kanonik (kerah e-netral tengah x 44, puncak y 55). */
export const KEPALA_GESER = { dx: KERAH.x - 44, dy: KERAH.y - 55 };
/** Kotak fitur kasar e-netral (alis, mata, hidung, mulut) yang DIKECUALIKAN dari registrasi. */
export const KOTAK_REGISTRASI = { fitur: [18, 28, 33, 25], baris: 56, jangkau: 8 };

const hexXY = (img, x, y) => L.hex(M.warna(img, x, y));
const dalam = (x, y, [x0, y0, w, h]) => x >= x0 && y >= y0 && x < x0 + w && y < y0 + h;

/** Kelas piksel untuk registrasi: 0 transparan, 1 garis/rambut gelap, 2 kulit/terang, 3 lain. */
function kelas(img, x, y) {
  if (!M.buramXY(img, x, y)) return 0;
  const c = M.warna(img, x, y);
  if (L.keOklab(c)[0] < 0.3) return 1;
  return c[0] > 200 && c[1] > 120 ? 2 : 3;
}

/**
 * Daftarkan sel ekspresi `s` ke kepala `dasar` (keduanya kanvas sel 79 x 79): geser bulat (dx,dy) |d| <= jangkau yang
 * meminimalkan beda kelas piksel di baris < KOTAK_REGISTRASI.baris DI LUAR kotak fitur. Seri -> |dx|+|dy| terkecil,
 * lalu dy, dx (deterministik).
 */
export function daftarSel(dasar, s) {
  const { fitur, baris, jangkau } = KOTAK_REGISTRASI;
  let best = null;
  for (let dy = -jangkau; dy <= jangkau; dy++) for (let dx = -jangkau; dx <= jangkau; dx++) {
    let beda = 0, tot = 0;
    for (let y = 0; y < baris; y++) for (let x = 0; x < dasar.w; x++) {
      if (dalam(x, y, fitur)) continue;
      const a = kelas(dasar, x, y), b = kelas(s, x - dx, y - dy);
      if (!a && !b) continue;
      tot++; if (a !== b) beda++;
    }
    const k = { dx, dy, beda, rasio: +(beda / tot).toFixed(3) };
    if (!best || beda < best.beda || (beda === best.beda && (Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy) || (Math.abs(dx) + Math.abs(dy) === Math.abs(best.dx) + Math.abs(best.dy) && (dy < best.dy || (dy === best.dy && dx < best.dx)))))) best = k;
  }
  return best;
}

/** Sel ekspresi terdaftar (koordinat sel e-netral). nat = hasil bangunNative. */
export function selTerdaftar(nat, log) {
  const dasar = nat['e-netral'];
  const o = { 'e-netral': dasar };
  if (nat.rata) o['r:e-netral'] = nat.rata['e-netral'];
  for (const n of ['e-prihatin', 'e-senyum', 'e-serius', 'e-lega', 'e-kedip']) {
    const r = daftarSel(dasar, nat[n]);
    log?.({ op: 'daftarSel', frame: n, berubah: 0, geser: [r.dx, r.dy], bedaKelas: r.beda, rasio: r.rasio, alasan: 'registrasi sel ekspresi ke kepala e-netral pada sanggul/garis rambut/telinga/kerah (kotak fitur dikecualikan)' });
    o[n] = M.geser(nat[n], r.dx, r.dy);
    // sel RATA (rata-rata area, kisi sama dengan sel moda) memakai geser registrasi yang sama
    if (nat.rata) o['r:' + n] = M.geser(nat.rata[n], r.dx, r.dy);
  }
  return o;
}

/**
 * Rentang MUKA per baris [x0,x1] di kotak (gambar img): dari tiap sisi kotak lewati piksel transparan lalu deret piksel
 * GELAP (OKLab L < 0,4: rambut, garis rahang) yang menyambung dari tepi -> sisanya = bagian dalam muka (kulit, mata,
 * alis, mulut). Garis luar kepala & rambut tetap milik kepala dasar (siluet/registrasi tidak berubah).
 */
const gelapXY = (img, x, y) => L.keOklab(M.warna(img, x, y))[0] < 0.4;
function rentangKulit(img, [x0, y0, w, h]) {
  const o = {};
  for (let y = y0; y < y0 + h; y++) {
    let a = x0, b = x0 + w - 1;
    while (a <= b && !M.buramXY(img, a, y)) a++;
    while (a <= b && gelapXY(img, a, y)) a++;
    while (b >= a && !M.buramXY(img, b, y)) b--;
    while (b >= a && gelapXY(img, b, y)) b--;
    if (a <= b) o[y] = [a, b];
  }
  return o;
}

/** Terapkan satu operasi wajah (koordinat sel) ke gambar sel. Kembalian: daftar [x,y] berubah. */
function terapkanOp(img, op, sel) {
  if (op.rata) {
    // cangkok dari sel RATA terdaftar; kulit:true = hanya di rentang kulit per baris (garis rahang/rambut tetap dasar)
    const s = sel['r:' + op.rata]; if (!s) throw new Error('sel rata tak ada: ' + op.rata);
    const sebelum = L.salin(img); const [x0, y0, w, h] = op.kotak;
    const rk = op.kulit ? rentangKulit(sebelum, op.kotak) : null;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (rk && !(rk[y] && x >= rk[y][0] && x <= rk[y][1])) continue;
      if (M.buramXY(img, x, y) && M.buramXY(s, x, y)) M.setel(img, x, y, M.warna(s, x, y));
    }
    return M.selisih(sebelum, img);
  }
  if (op.cangkok) {
    const s = sel[op.cangkok]; if (!s) throw new Error('sel cangkok tak ada: ' + op.cangkok);
    const sebelum = L.salin(img); const [x0, y0, w, h] = op.kotak;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (M.buramXY(img, x, y) && M.buramXY(s, x, y)) M.setel(img, x, y, M.warna(s, x, y));
    return M.selisih(sebelum, img);
  }
  return M.gambarAscii(img, op.x, op.y, op.baris, HURUF);
}

/**
 * Wajah (koordinat sel e-netral) untuk ekspresi e & varian v ('dasar' | 'kedip' | 'bawah' | 'bicara').
 * Urutan: e-netral -> WAJAH.dasar -> WAJAH.ekspresi[e] -> WAJAH.varian[v][e] (bila ada; bawaan varian[v]._).
 * `catat` (opsional) menerima satu entri per operasi.
 */
export function wajahSel(sel, e, v = 'dasar', catat, opsi = {}) {
  const img = L.salin(sel['e-netral']);
  const jalan = (daftar, lapis) => { for (const op of daftar || []) { const n = terapkanOp(img, op, sel).length; catat?.({ op: op.rata ? 'cangkokRata' : op.cangkok ? 'cangkok' : 'wajahTangan', lapis, ekspresi: e, varian: v, ...(op.rata ? { dari: op.rata, kotak: op.kotak, kulit: !!op.kulit } : op.cangkok ? { dari: op.cangkok, kotak: op.kotak } : { x: op.x, y: op.y }), berubah: n, alasan: op.alasan }); } };
  jalan(WAJAH.dasar, 'dasar');
  if (e !== 'netral') jalan(WAJAH.ekspresi[e], 'ekspresi');
  if (v !== 'dasar') {
    const V = WAJAH.varian[v]; const nama = opsi.varian ?? v;
    jalan((WAJAH.varian[nama] || V)[e] ?? (WAJAH.varian[nama] || V)._, 'varian:' + nama);
  }
  return img;
}

/**
 * Blok kepala dari gambar sel (koordinat e-netral): semua piksel di atas kerah + piksel non-emas baris kerah (55..63)
 * di x 35..53 (kerah putih, leher). Ditulis ke kanvas kanonik `w x h`.
 */
export function blokKepala(eImg, w, h) {
  const o = L.buat(w, h);
  for (let y = 0; y < 64; y++) for (let x = 0; x < eImg.w; x++) {
    if (!M.buramXY(eImg, x, y)) continue;
    if (y >= 55 && (x < 35 || x > 53 || EMAS.has(hexXY(eImg, x, y)))) continue;
    M.setel(o, x + KEPALA_GESER.dx, y + KEPALA_GESER.dy, M.warna(eImg, x, y));
  }
  return o;
}

const PUTIH_MATA = new Set(['#f7f2ea', '#e1dee2', '#cdc8ce']);
/**
 * Tatapan arah kanan (v5): master menatap KAMERA (iris di sisi kanan gambar pada kepala yang menoleh ke kiri). Cermin
 * murni membuat kepala 'kanan' tetap menatap kamera, menjauh dari Bu Rina. Isi BUKAAN mata (iris, kilap, putih; kotak
 * WAJAH.bukaanMata, koordinat sel arah kiri) dibalik horizontal di dalam kotaknya sesudah cermin -> iris kembali ke
 * sisi kanan gambar = menatap Bu Rina; garis bulu mata, sudut & sayap tetap tercermin. Mata tertutup (tanpa putih)
 * tidak disentuh. Kembalian: jumlah piksel berubah.
 */
function tatapKanan(kanan) {
  const W0 = kanan.w; const sebelum = L.salin(kanan);
  for (const { x0, x1, y0, y1 } of WAJAH.bukaanMata) {
    const a = W0 - 1 - (x1 + KEPALA_GESER.dx), b = W0 - 1 - (x0 + KEPALA_GESER.dx);
    let putih = 0;
    for (let y = y0; y <= y1; y++) for (let x = a; x <= b; x++) if (M.buramXY(kanan, x, y + KEPALA_GESER.dy) && PUTIH_MATA.has(hexXY(kanan, x, y + KEPALA_GESER.dy))) putih++;
    if (!putih) continue;
    for (let y = y0; y <= y1; y++) {
      const yy = y + KEPALA_GESER.dy;
      for (let x = a; x <= b; x++) M.setel(kanan, x, yy, M.buramXY(sebelum, a + b - x, yy) ? M.warna(sebelum, a + b - x, yy) : null);
    }
  }
  return M.selisih(sebelum, kanan).length;
}

/** Kepala kanan = cermin kepala kiri + belahan rambut dipindah + tatapan ke Bu Rina (tatapKanan). */
export function keKanan(kiri, log) {
  const kanan = cerminKanvas(kiri);
  for (const s of WAJAH.belahanKanan) {
    const ubah = M.gambarAscii(kanan, s.x, s.y, s.baris, HURUF);
    log?.({ op: 'belahanKanan', frame: 'kepala-kanan', berubah: ubah.length, alasan: s.alasan });
  }
  const n = tatapKanan(kanan);
  log?.({ op: 'tatapKanan', frame: 'kepala-kanan', berubah: n, alasan: 'isi bukaan mata dibalik di tempat: arah kanan menatap Bu Rina (cermin murni = menatap kamera)' });
  return kanan;
}

/**
 * Semua render kepala (kanvas kanonik): kunci `${arah}:${e}:${v}` (+ `:${varian pengganti}` untuk mata bawah khusus
 * frame, lihat FRAME.mataBawah). Log hanya untuk arah kiri (kanan = cermin yang sama).
 */
export function renderSemua(nat, w, h, log, pengganti = []) {
  const sel = selTerdaftar(nat, log);
  const render = {};
  const buat = (e, v, opsi, kunci) => {
    const s = wajahSel(sel, e, v, log, opsi);
    const kiri = blokKepala(s, w, h);
    render[`kiri:${kunci}`] = kiri;
    render[`kanan:${kunci}`] = keKanan(kiri, kunci === 'netral:dasar' ? log : null);
  };
  for (const e of EKSPRESI) for (const v of ['dasar', ...VARIAN]) buat(e, v, {}, `${e}:${v}`);
  for (const p of pengganti) for (const e of EKSPRESI) buat(e, 'bawah', { varian: p }, `${e}:bawah:${p}`);
  return { sel, render };
}

/** Kotak gabungan [x,y,w,h] dari daftar titik ([] -> null). */
function kotakTitik(tt) {
  if (!tt.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of tt) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

/**
 * Kotak fitur per arah dari render: wajah = semua piksel yang berbeda dari netral dasar di ekspresi/varian mana pun;
 * mata = beda kedip/bawah vs dasar ekspresi yang sama; mulut = beda bicara vs dasar. mata & mulut di dalam wajah.
 */
export function kotakFitur(render, arah, pengganti = []) {
  const n0 = render[`${arah}:netral:dasar`];
  const semua = [], mata = [], mulut = [];
  for (const e of EKSPRESI) {
    const d = render[`${arah}:${e}:dasar`];
    for (const v of ['dasar', ...VARIAN]) semua.push(...M.selisih(n0, render[`${arah}:${e}:${v}`]));
    for (const p of pengganti) semua.push(...M.selisih(n0, render[`${arah}:${e}:bawah:${p}`]));
    mata.push(...M.selisih(d, render[`${arah}:${e}:kedip`]), ...M.selisih(d, render[`${arah}:${e}:bawah`]));
    for (const p of pengganti) mata.push(...M.selisih(d, render[`${arah}:${e}:bawah:${p}`]));
    mulut.push(...M.selisih(d, render[`${arah}:${e}:bicara`]));
  }
  return { wajah: kotakTitik(semua), mata: kotakTitik(mata), mulut: kotakTitik(mulut) };
}
