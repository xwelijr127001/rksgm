/**
 * Miss Raksa — badan: sel gestur tersejajar kerah -> tanpa kepala -> suntingan tercatat -> (berdiri) rok + kaki master /
 * (duduk) potong garis meja. Semua di KANVAS kanonik (kerah tengah = KERAH.x, puncak kerah = KERAH.y).
 *
 * Arah 'kiri' = arah sumber (menghadap kiri gambar). 'kanan' = cermin di sumbu KERAH.x + perbaikan detail depan jas
 * (kancing & garis bukaan tetap di sisi KANAN pemakai = kiri gambar, lencana di dada KIRI pemakai = kanan gambar).
 */
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';
import { HURUF } from './miss-suntingan.mjs';

export const KANVAS = { w: 121, h: 200 };
export const KERAH = { x: 60, y: 52 };
export const EMAS = new Set(['#b87228', '#ca812d', '#d98f35', '#e49b3d', '#eda544', '#f3ae4b', '#f8b754', '#fbc05d', '#fdc765', '#fdd172']);
const PUTIH = new Set(['#f7f2ea', '#e1dee2', '#cdc8ce', '#afa7aa']);
const hexXY = (img, x, y) => L.hex(M.warna(img, x, y));

/** Cermin di sumbu x = KERAH.x (lebar kanvas ganjil 2*KERAH.x+1 sehingga kerah tetap di tempat). */
export const cerminX = (x) => 2 * KERAH.x - x;
export function cerminKanvas(img) { return L.cermin(img); }
export const cerminKotak = ([x, y, w, h]) => [2 * KERAH.x + 1 - x - w, y, w, h];

/** Sejajarkan sel gestur (native palet) ke kanvas: tengah piksel putih kerah baris 48-61 -> KERAH. */
export function sejajarSel(img) {
  const xs = [], ys = [];
  for (let y = 48; y < 62; y++) for (let x = 20; x < img.w - 13; x++) if (M.buramXY(img, x, y) && PUTIH.has(hexXY(img, x, y))) { xs.push(x); ys.push(y); }
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = Math.min(...ys);
  const dx = Math.round(KERAH.x - cx), dy = KERAH.y - cy;
  return { img: M.geser(img, dx, dy, KANVAS.w, KANVAS.h), geser: { dx, dy } };
}

/** Hapus kepala sel: semua baris < KERAH.y, dan piksel non-emas baris KERAH.y..KERAH.y+8 di sekitar kerah. */
export function tanpaKepala(img) {
  const o = L.salin(img); let n = 0;
  const RAMBUT_KULIT = (c) => !EMAS.has(c) && !['#340d03', '#461605', '#581f08', '#7b3914'].includes(c);
  for (let y = 0; y < KERAH.y + 9; y++) for (let x = 0; x < o.w; x++) {
    if (!M.buramXY(o, x, y)) continue;
    const c = hexXY(o, x, y);
    // di atas kerah: semua; baris kerah: di rentang kerah blok kepala (x KERAH.x-9..KERAH.x+9) semua non-emas,
    // di luar rentang itu hanya warna rambut/kulit/putih (garis bahu cokelat jas tetap)
    const kena = y < KERAH.y || (x >= KERAH.x - 9 && x <= KERAH.x + 9 ? !EMAS.has(c) : RAMBUT_KULIT(c));
    if (kena) { M.setel(o, x, y, null); n++; }
  }
  return { img: o, dihapus: n };
}

/* ------------------------------------------------------------------ operasi suntingan (koordinat kanvas) */

const dalamPoligon = (x, y, P) => {
  // uji titik tengah piksel (x+0,5, y+0,5) terhadap poligon (titik = batas piksel)
  const px = x + 0.5, py = y + 0.5; let masuk = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) masuk = !masuk;
  }
  return masuk;
};
export const maskPoligon = (w, h, daftar) => {
  const m = new Uint8Array(w * h);
  for (const P of daftar) {
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(h, Math.ceil(Math.max(...ys))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(w, Math.ceil(Math.max(...xs))); x++) if (dalamPoligon(x, y, P)) m[y * w + x] = 1;
  }
  return m;
};

/**
 * Terapkan satu operasi. Jenis:
 *  { op:'ascii', x, y, baris }                   pola huruf HURUF ('.' biarkan, '_' transparan)
 *  { op:'hapusPoligon', poligon:[[x,y],...] }    jadikan transparan
 *  { op:'salinPoligon', dari:<nama sumber>, poligon, geser:[dx,dy], kosongkan? }  salin piksel buram sumber di poligon
 *                                                 (koordinat sumber) ke gambar di (x+dx, y+dy); kosongkan:true = piksel
 *                                                 transparan sumber juga ditulis (kembalikan badan persis sumber)
 *  { op:'ganti', kotak:[x,y,w,h], dari:'abc', ke:'b' }   ganti huruf warna di kotak
 * `sumber`: peta nama -> gambar kanvas (untuk salinPoligon).
 * Kembalian: jumlah piksel berubah.
 */
export function terapkan(img, op, sumber = {}) {
  const sebelum = L.salin(img);
  if (op.op === 'ascii') M.gambarAscii(img, op.x, op.y, op.baris, HURUF);
  else if (op.op === 'hapusPoligon') { const m = maskPoligon(img.w, img.h, [op.poligon]); for (let p = 0; p < m.length; p++) if (m[p]) M.setel(img, p % img.w, (p / img.w) | 0, null); }
  else if (op.op === 'salinPoligon') {
    const S = sumber[op.dari]; if (!S) throw new Error('sumber tak ada: ' + op.dari);
    const m = maskPoligon(S.w, S.h, [op.poligon]); const [dx, dy] = op.geser || [0, 0];
    for (let p = 0; p < m.length; p++) { if (!m[p]) continue; const x = p % S.w, y = (p / S.w) | 0; if (!M.buramXY(S, x, y)) { if (op.kosongkan) M.setel(img, x + dx, y + dy, null); continue; } M.setel(img, x + dx, y + dy, M.warna(S, x, y)); }
  } else if (op.op === 'ganti') {
    const [x0, y0, w, h] = op.kotak; const dari = new Set([...op.dari].map((c) => HURUF[c])); const ke = L.dariHex(HURUF[op.ke]);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (M.buramXY(img, x, y) && dari.has(hexXY(img, x, y))) M.setel(img, x, y, ke);
  } else throw new Error('op tak dikenal ' + op.op);
  return M.selisih(sebelum, img).length;
}

/* ------------------------------------------------------------------ detail depan jas */

const DASAR_JAS = new Set(['#fdc765', '#fbc05d', '#f8b754', '#f3ae4b', '#fdd172']);
/**
 * Piksel detail (kancing: gelap L < 0,5 di kotak kancing; garis bukaan: bukan warna dasar jas di kotak plaket;
 * lencana: semua bukan-dasar di kotak lencana). Kembalian Uint8Array mask.
 */
export function maskDetail(img, d) {
  const m = new Uint8Array(img.w * img.h);
  const isi = (kotak, uji) => { for (const [x0, y0, w, h] of kotak || []) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (M.buramXY(img, x, y) && uji(hexXY(img, x, y))) m[y * img.w + x] = 1; };
  isi(d.kancing, (c) => L.keOklab(L.dariHex(c))[0] < 0.5);
  isi(d.plaket, (c) => !DASAR_JAS.has(c) && EMAS.has(c));
  isi(d.lencana, (c) => !DASAR_JAS.has(c) || c === '#fdd172');
  return m;
}

/** Isi piksel mask dengan warna dasar jas terdekat di baris yang sama (kiri/kanan, maks 6 px), lalu kolom. */
export function isiJas(img, m) {
  const o = L.salin(img); let n = 0;
  for (let p = 0; p < m.length; p++) {
    if (!m[p]) continue; const x = p % img.w, y = (p / img.w) | 0; let c = null;
    for (let r = 1; r <= 6 && !c; r++) for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= img.w || yy >= img.h || m[yy * img.w + xx] || !M.buramXY(img, xx, yy)) continue;
      const h = hexXY(img, xx, yy); if (DASAR_JAS.has(h)) { c = L.dariHex(h); break; }
    }
    if (c) { M.setel(o, x, y, c); n++; }
  }
  return { img: o, n };
}

/**
 * Salin piksel mask dari A ke B di (x+dx, y). `hanyaDasar`: hanya menimpa piksel B berwarna dasar jas (tidak menimpa
 * garis lengan, manset, kulit). Kembalian: jumlah piksel ditulis.
 */
export function tempelMask(B, A, m, dx = 0, hanyaDasar = false) {
  let n = 0;
  for (let p = 0; p < m.length; p++) {
    if (!m[p]) continue; const x = p % A.w, y = (p / A.w) | 0;
    if (!M.buramXY(A, x, y)) continue;
    if (hanyaDasar && !(M.buramXY(B, x + dx, y) && DASAR_JAS.has(hexXY(B, x + dx, y)))) continue;
    M.setel(B, x + dx, y, M.warna(A, x, y)); n++;
  }
  return n;
}

/** Gambar pola ASCII hanya di atas piksel dasar jas (lencana tidak menimpa tangan/lengan yang menutup dada). */
export function gambarDiJas(img, x0, y0, baris) {
  const ubah = [];
  baris.forEach((s, j) => { for (let i = 0; i < s.length; i++) {
    const x = x0 + i, y = y0 + j; if (s[i] === '.' || !M.buramXY(img, x, y) || !DASAR_JAS.has(hexXY(img, x, y))) continue;
    M.setel(img, x, y, L.dariHex(HURUF[s[i]])); ubah.push([x, y]);
  } });
  return ubah;
}

/* ------------------------------------------------------------------ bawah (rok + kaki master) */

/** Petakan rok master ke ramp emas lembar gestur (satu langkah lebih gelap): a->b, b->c, c->d, d->e, e->f, f->F, F->l, l->L. */
const GELAPKAN = { '#fdd172': '#fdc765', '#fdc765': '#fbc05d', '#fbc05d': '#f8b754', '#f8b754': '#f3ae4b', '#f3ae4b': '#eda544', '#eda544': '#e49b3d', '#e49b3d': '#d98f35', '#d98f35': '#ca812d' };
/**
 * Tempel rok + kaki master (baris master >= `dariBaris`) di bawah jas: baris kanvas >= `keBaris` diganti.
 * geser x: tengah rok master -> `tengahX`.
 */
export function pasangBawah(img, master, { dariBaris, keBaris, geserX }) {
  const o = L.salin(img); let n = 0;
  for (let y = keBaris; y < o.h; y++) for (let x = 0; x < o.w; x++) M.setel(o, x, y, null);
  for (let y = dariBaris; y < master.h; y++) for (let x = 0; x < master.w; x++) {
    if (!M.buramXY(master, x, y)) continue;
    let c = hexXY(master, x, y); if (GELAPKAN[c]) c = GELAPKAN[c];
    M.setel(o, x + geserX, y - dariBaris + keBaris, L.dariHex(c)); n++;
  }
  return { img: o, n };
}

/* ------------------------------------------------------------------ meja */

/**
 * Potong garis meja: baris >= garis dihapus, KECUALI piksel di dalam poligon `simpan` (lengan bawah & tangan yang
 * bertumpu di meja). Hasil: di bawah garis meja hanya lengan/tangan -> kotak diAtasMeja boleh selebar frame.
 */
export function potongMeja(img, garis, simpan) {
  const o = L.salin(img);
  const m = maskPoligon(o.w, o.h, simpan || []);
  let n = 0;
  for (let y = garis; y < o.h; y++) for (let x = 0; x < o.w; x++) if (M.buramXY(o, x, y) && !m[y * o.w + x]) { M.setel(o, x, y, null); n++; }
  return { img: o, dihapus: n };
}

/* ------------------------------------------------------------------ duduk v5: lengan bawah turun ke meja */

/** Interval per baris {y: [[x0,x1],...]} -> uji (x,y). */
const dalamInterval = (iv, x, y) => (iv[y] || []).some(([a, b]) => x >= a && x <= b);

/**
 * Duduk v5 (tokoh lebih tinggi terhadap meja): lengan bawah + manset + tangan DITURUNKAN `D` baris supaya tetap
 * bertumpu di permukaan meja yang kini lebih rendah di frame. Koordinat kanvas arah kiri (sebelum cermin).
 *  - `lengan`: interval per baris {y: [[x0,x1],...]} = piksel lengan/tangan SUMBER yang dipindah (baris >= R0).
 *  - Baris sasaran R0 .. R1+D-1 diambil dari sumber R0 .. R1-1 (regang vertikal: lengan bawah lebih panjang/curam,
 *    siku tetap; `sumber` = daftar baris sumber per baris sasaran bila diberikan, supaya yang diulang hanya baris
 *    lengan polos, bukan lipatan), baris sasaran >= R1+D dari sumber y-D (manset & tangan utuh, hanya bergeser).
 *  - `tanpa` (kembalian): gambar SESUDAH lengan dibuang & pinggang diisi, SEBELUM lengan digambar lagi = badan tanpa
 *    lengan bawah (sumber op salinPoligon 'tanpaLengan' untuk frame yang mengganti satu lengan: tunjuk, telepon).
 *  - `pinggang`: badan jas yang semula tertutup lengan/tangan diisi dulu: baris dari..ke, tepi kiri/kanan
 *    diinterpolasi linear ([x@dari, x@ke]), garis tepi gelap 'x', bayang 'd'/'c' di tepi, dasar 'b', garis bukaan
 *    'n' di x `plaket`. Lengan yang diturunkan digambar DI ATASNYA.
 * Kembalian { img, tanpa, lengan: Uint8Array (piksel sasaran yang berasal dari lengan), n (piksel berubah) }.
 */
export function turunkanLengan(img, P) {
  const { R0, R1, D, lengan, pinggang, sumber } = P;
  if (sumber && sumber.length !== R1 - R0 + D) throw new Error('turunkanLengan: sumber harus ' + (R1 - R0 + D) + ' baris');
  const src = L.salin(img); const o = L.salin(img);
  const mask = new Uint8Array(o.w * o.h);
  for (let y = R0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (dalamInterval(lengan, x, y)) M.setel(o, x, y, null);
  if (pinggang) {
    const { dari, ke, kiri, kanan, plaket } = pinggang;
    const lerp = ([a, b], y) => Math.round(a + ((b - a) * (y - dari)) / Math.max(1, ke - dari));
    const c = (h) => L.dariHex(HURUF[h]);
    for (let y = dari; y <= ke; y++) {
      const xl = lerp(kiri, y), xr = lerp(kanan, y);
      for (let x = xl; x <= xr; x++) {
        if (M.buramXY(o, x, y)) continue;
        const h = x === xl || x === xr ? 'x' : x === xl + 1 || x === xr - 1 ? 'd' : x === xl + 2 || x === xr - 2 ? 'c' : x === plaket ? 'n' : 'b';
        M.setel(o, x, y, c(h));
      }
    }
  }
  const tanpa = L.salin(o);
  const peta = (y) => (y < R0 ? y : y < R1 + D ? (sumber ? sumber[y - R0] : R0 + Math.floor(((y - R0) * (R1 - R0)) / (R1 - R0 + D))) : y - D);
  for (let y = R0; y < o.h; y++) {
    const ys = peta(y); if (ys >= src.h) continue;
    for (let x = 0; x < o.w; x++) {
      if (!dalamInterval(lengan, x, ys) || !M.buramXY(src, x, ys)) continue;
      M.setel(o, x, y, M.warna(src, x, ys)); mask[y * o.w + x] = 1;
    }
  }
  return { img: o, tanpa, lengan: mask, n: M.selisih(img, o).length };
}
