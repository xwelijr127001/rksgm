/**
 * Bu Rina — sistem wajah terkunci-kepala.
 *
 *  - maskWajah: kulit wajah di dalam bingkai hijab (komponen kulit terbesar di kotak kepala, ditutup 1 px, lubang
 *    (mata, alis, mulut) diisi). Garis dagu & tepi hijab TIDAK termasuk, jadi bingkai kepala tubuh tidak pernah berubah.
 *  - cocokWajah: geser (dx,dy) wajah ekspresi ke wajah tubuh dengan memaksimalkan tumpang-tindih peta gelap
 *    (alis, bulu mata, iris, garis hidung, mulut) di dalam kedua mask. Hanya translasi (skala wajah sudah sama).
 *  - tempelWajah: isi mask tubuh dengan piksel wajah ekspresi; piksel mask tubuh yang tidak tertutup mask ekspresi
 *    diisi merambat dari tetangga yang sudah terisi (kulit tepi). `penghalang`: piksel tubuh yang tidak boleh ditimpa
 *    (jari di dagu, gagang telepon).
 *  - bersihWajah: bintik dingin/abu hasil JPEG di dalam wajah -> coklat gelap (bila gelap) / kulit tetangga.
 *  - varian: kedip (mata tertutup), bawah (lirik ke bawah: garis bulu mata turun 1 baris, iris & putih mata tetap
 *    terlihat; `lirikBawah`), bicara (mulut terbuka). `mataBawah` kini hanya untuk suntingan kelopak `lega`. HANYA piksel di
 *    kotak mata / mulut yang berubah; dibuktikan dengan diff di lembar tinjau.
 */
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';

export const kulitW = (c) => { const [h, s, v] = R.hsv(c[0], c[1], c[2]); return h >= 18 && h <= 45 && s >= 0.3 && v >= 0.55; };
const labW = (img, x, y) => L.keOklab(R.warna(img, x, y));

export function maskWajah(img, kk) {
  const { x: kx, y: ky, w: kw, h: kh } = kk;
  const di = (x, y) => x >= kx && y >= ky && x < kx + kw && y < ky + kh && x >= 0 && y >= 0 && x < img.w && y < img.h;
  const K = R.komponen(img, (p) => { const x = p % img.w, y = (p / img.w) | 0; return di(x, y) && R.buramXY(img, x, y) && kulitW(R.warna(img, x, y)); }, false).out.sort((a, b) => b.n - a.n)[0];
  const N = img.w * img.h;
  const m = new Uint8Array(N); for (const p of K.px) m[p] = 1;
  const at = (arr, x, y) => (di(x, y) ? arr[y * img.w + x] : 0);
  const dil = new Uint8Array(N);
  for (let y = ky; y < ky + kh; y++) for (let x = kx; x < kx + kw; x++) { let a = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (at(m, x + dx, y + dy)) a = 1; if (di(x, y)) dil[y * img.w + x] = a; }
  const tut = new Uint8Array(N);
  for (let y = ky; y < ky + kh; y++) for (let x = kx; x < kx + kw; x++) { if (!di(x, y)) continue; let a = 1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(dil, x + dx, y + dy)) a = 0; tut[y * img.w + x] = a | m[y * img.w + x]; }
  const luar = R.komponen(img, (p) => { const x = p % img.w, y = (p / img.w) | 0; return di(x, y) && !tut[p]; }, false).out;
  const M = Uint8Array.from(tut);
  for (const c of luar) {
    const sentuh = c.x <= Math.max(0, kx) || c.y <= Math.max(0, ky) || c.x + c.w >= Math.min(img.w, kx + kw) || c.y + c.h >= Math.min(img.h, ky + kh);
    if (!sentuh) for (const p of c.px) M[p] = 1;
  }
  // hanya piksel buram
  for (let p = 0; p < N; p++) if (M[p] && img.d[p * 4 + 3] < 128) M[p] = 0;
  return M;
}

export const kotakMask = (M, w) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
  for (let p = 0; p < M.length; p++) if (M[p]) { n++; const x = p % w, y = (p / w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return n ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n } : null;
};

const petaGelap = (img, M) => { const g = new Uint8Array(M.length); for (let p = 0; p < M.length; p++) if (M[p]) g[p] = labW(img, p % img.w, (p / img.w) | 0)[0] < 0.5 ? 1 : 0; return g; };

/** B(x,y) <- E(x-dx, y-dy). Cari di sekitar tebakan (selisih pusat kotak mask). */
export function cocokWajah(E, ME, B, MB, rentang = 6) {
  const kE = kotakMask(ME, E.w), kB = kotakMask(MB, B.w);
  const t = { dx: Math.round(kB.x + kB.w / 2 - (kE.x + kE.w / 2)), dy: Math.round(kB.y + kB.h / 2 - (kE.y + kE.h / 2)) };
  const gE = petaGelap(E, ME), gB = petaGelap(B, MB);
  let best = null;
  for (let dy = t.dy - rentang; dy <= t.dy + rentang; dy++) for (let dx = t.dx - rentang; dx <= t.dx + rentang; dx++) {
    let s = 0, lap = 0, luar = 0;
    for (let y = kB.y - 2; y < kB.y + kB.h + 2; y++) for (let x = kB.x - 2; x < kB.x + kB.w + 2; x++) {
      if (x < 0 || y < 0 || x >= B.w || y >= B.h) continue;
      const p = y * B.w + x, ex = x - dx, ey = y - dy;
      const ine = ex >= 0 && ey >= 0 && ex < E.w && ey < E.h && ME[ey * E.w + ex];
      if (MB[p] && ine) { lap++; const a = gB[p], b = gE[ey * E.w + ex]; if (a && b) s += 2; else if (a !== b) s -= 1; } else if (MB[p] || ine) luar++;
    }
    const v = s - 0.5 * luar;
    if (!best || v > best.v) best = { dx, dy, v, lap, luar };
  }
  return best;
}

/** Wajah baru untuk tubuh B: salinan B dengan isi mask diganti wajah E (geser d). */
export function tempelWajah(E, ME, B, MB, d, penghalang = null) {
  const o = L.salin(B);
  const isi = new Uint8Array(MB.length);
  const boleh = (p) => MB[p] && !(penghalang && penghalang[p]);
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
    const p = y * B.w + x; if (!boleh(p)) continue;
    const ex = x - d.dx, ey = y - d.dy;
    if (ex >= 0 && ey >= 0 && ex < E.w && ey < E.h && ME[ey * E.w + ex]) { R.setel(o, x, y, R.warna(E, ex, ey)); isi[p] = 1; }
  }
  let sisa = 0;
  for (let it = 0; it < 8; it++) {
    const baru = [];
    for (let p = 0; p < MB.length; p++) {
      if (!boleh(p) || isi[p]) continue; const x = p % B.w, y = (p / B.w) | 0;
      for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= B.w || yy >= B.h) continue; const q = yy * B.w + xx; if (isi[q] && kulitW(R.warna(o, xx, yy))) { baru.push([p, R.warna(o, xx, yy)]); break; } }
    }
    for (const [p, c] of baru) { R.setel(o, p % B.w, (p / B.w) | 0, c); isi[p] = 1; sisa++; }
  }
  return { img: o, dirambat: sisa };
}

/**
 * Palet wajah yang diizinkan: nada kulit (kulitW, saturasi 0,5-0,88), gelap hangat (L < 0,45, rona merah-cokelat), merah bibir/garis hidung
 * (rona hangat, kroma > 0,1), putih mata. Warna lain (biru baju, abu/krem apron, perak kunci) = noise JPEG di wajah.
 */
export function paletWajah(palet, putihMata) {
  return palet.filter((c) => {
    if (c[0] === putihMata[0] && c[1] === putihMata[1] && c[2] === putihMata[2]) return true;
    const sat = R.hsv(c[0], c[1], c[2])[1];
    if (kulitW(c)) return sat >= 0.5 && sat <= 0.88; // krem/tan apron (s < 0,5) & oranye trim (s > 0,88) bukan kulit
    const lab = L.keOklab(c); const C = Math.hypot(lab[1], lab[2]); const hue = Math.atan2(lab[2], lab[1]) * 180 / Math.PI;
    const hangat = hue > 15 && hue < 60;
    if (lab[0] < 0.45 && (hangat || C < 0.02)) return true;
    return hangat && C > 0.1 && lab[0] < 0.6;
  });
}

/** Petakan piksel di mask wajah yang warnanya di luar palet wajah ke warna palet wajah terdekat (OKLab). */
export function bersihWajah(img, M, izin) {
  const labIzin = izin.map((c) => L.keOklab(c)); const kunci = new Set(izin.map((c) => R.key(c)));
  let n = 0;
  for (let p = 0; p < M.length; p++) {
    if (!M[p]) continue; const x = p % img.w, y = (p / img.w) | 0;
    const c = R.warna(img, x, y); if (kunci.has(R.key(c))) continue;
    const lab = L.keOklab(c); let bi = 0, bd = Infinity;
    labIzin.forEach((q, i) => { const d = L.jarakOk(lab, q); if (d < bd) { bd = d; bi = i; } });
    R.setel(img, x, y, izin[bi]); n++;
  }
  return n;
}

/** Piksel fitur: bukan kulit (garis, iris, putih mata, bibir) atau kulit gelap (lipatan senyum/cemberut, L OKLab < ambang). */
export const pikselFitur = (img, x, y, ambangL) => {
  if (!R.buramXY(img, x, y)) return false;
  const c = R.warna(img, x, y);
  return !kulitW(c) || L.keOklab(c)[0] < ambangL;
};

/**
 * Wajah ekspresi = wajah NETRAL + hanya fitur dari kepala ekspresi E. Di dalam `kotak` (alis+mata, mulut+lipatan) dan di
 * dalam mask wajah netral `M0`: piksel yang fitur di N ATAU di E diambil dari E; piksel yang kulit di keduanya tetap N.
 * Di luar kotak: N. Jadi tekstur kulit, hidung & pipi tidak "meletup" saat ganti ekspresi.
 * Kembalian { img, diambil } (jumlah piksel yang berbeda dari N).
 */
export function susunFitur(N, E, M0, kotak, { ambangL = 0.66 } = {}) {
  const o = L.salin(N); let diambil = 0;
  for (const [x0, y0, w, h] of kotak) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (x < 0 || y < 0 || x >= N.w || y >= N.h || !M0[y * N.w + x]) continue;
    if (!pikselFitur(N, x, y, ambangL) && !pikselFitur(E, x, y, ambangL)) continue;
    const c = R.buramXY(E, x, y) ? R.warna(E, x, y) : null;
    if (c && R.buramXY(o, x, y) && R.samaW(c, R.warna(o, x, y))) continue;
    R.setel(o, x, y, c); diambil++;
  }
  return { img: o, diambil };
}

/* ------------------------------------------------------------------ varian mata & mulut (di koordinat kepala ekspresi) */

const dalam = (b, x, y) => x >= b[0] && y >= b[1] && x <= b[2] && y <= b[3];

/** Piksel "mata" di kotak: bukan kulit (garis bulu mata, iris, putih mata). */
function pikselMata(img, b) {
  const out = [];
  for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) if (R.buramXY(img, x, y) && !kulitW(R.warna(img, x, y))) out.push([x, y]);
  return out;
}

/** Warna kulit per kolom: piksel kulit pertama di bawah kotak (atau di atas bila tak ada). */
function kulitKolom(img, b, x) {
  for (let y = b[3] + 1; y <= b[3] + 4; y++) if (R.buramXY(img, x, y) && kulitW(R.warna(img, x, y))) return R.warna(img, x, y);
  for (let y = b[1] - 1; y >= b[1] - 3; y--) if (R.buramXY(img, x, y) && kulitW(R.warna(img, x, y))) return R.warna(img, x, y);
  return null;
}

/**
 * Kedip: piksel mata di kotak -> kulit kolomnya; garis kelopak tertutup (warna bulu mata) pada baris `lid`
 * sepanjang lebar mata, ujung luar naik 1 px. sisi: 'kiri' | 'kanan' (ujung luar mata di sisi itu).
 */
export function kedipMata(img, b, { garis, sisi, lid }) {
  const px = pikselMata(img, b); if (!px.length) return 0;
  const xs = px.map((p) => p[0]); const x0 = Math.min(...xs), x1 = Math.max(...xs);
  // satu warna kelopak per mata (moda kulit di baris bawah kotak) supaya tidak tampak tambalan belang
  const m = new Map(); for (let x = x0; x <= x1; x++) for (const yy of [b[3] + 1, b[3] + 2]) { if (!R.buramXY(img, x, yy)) continue; const c = R.warna(img, x, yy); if (!kulitW(c)) continue; const k = R.key(c); m.set(k, { c, n: (m.get(k)?.n || 0) + 1 }); }
  const kel = [...m.values()].sort((p, q) => q.n - p.n)[0]?.c;
  for (const [x, y] of px) { const k = kel || kulitKolom(img, b, x); if (k) R.setel(img, x, y, k); }
  const y = lid ?? Math.round((Math.min(...px.map((p) => p[1])) + Math.max(...px.map((p) => p[1]))) / 2 + 0.5);
  for (let x = x0; x <= x1; x++) R.setel(img, x, y, garis);
  if (sisi === 'kiri') R.setel(img, x0, y - 1, garis); else R.setel(img, x1, y - 1, garis);
  return px.length;
}

/**
 * Melihat ke bawah: baris atas mata (bulu mata + bagian atas iris/putih) menjadi kelopak (kulit), garis bulu mata
 * turun `turun` px; kilap putih di atas iris dihapus. Iris & putih bagian bawah tetap.
 */
export function mataBawah(img, b, { garis, turun = 2, kelopak }) {
  const px = pikselMata(img, b); if (!px.length) return 0;
  const yTop = Math.min(...px.map((p) => p[1]));
  const xs = px.filter((p) => p[1] <= yTop + turun).map((p) => p[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let n = 0;
  for (const [x, y] of px) if (y < yTop + turun) { R.setel(img, x, y, kelopak ?? kulitKolom(img, b, x)); n++; }
  for (let x = x0; x <= x1; x++) { R.setel(img, x, yTop + turun, garis); n++; }
  return n;
}

const PUTIH_MATA = '247,242,234';

/**
 * Varian `bawah` (ronde 3) = LIRIK KE BAWAH dengan iris tetap terlihat. Versi lama (mataBawah turun 2 dari piksel
 * non-kulit teratas kotak) menurunkan kelopak sampai 1 baris iris tersisa -> pada 2-3 px perangkat terbaca MATA
 * TERPEJAM (terutama `lega`, yang kelopaknya sudah turun 1 px).
 * Sekarang garis bulu mata diletakkan di baris PUTIH MATA TERATAS mata dasar (baris bukaan pertama): bukaan mata
 * turun tepat 1 baris untuk setiap ekspresi, dan baris-baris di bawahnya (iris gelap + putih di sisi + kelopak bawah)
 * TIDAK diubah -> 2+ baris iris/putih tetap terlihat. Hanya kolom mata (putih mata ± 2 px) yang disentuh: garis wajah /
 * tepi hijab di kotak tidak ikut. Kelopak (di atas garis baru) = satu warna kulit (moda 2 baris di bawah kotak).
 * `senang` (mata sudah tertutup-senyum, tanpa putih) tidak diubah di sini; lihat SUNTING_VARIAN.
 * Kembalian: { n (piksel berubah), barisGaris, bukaan (baris di bawah garis yang berisi putih/iris) } atau null.
 */
export function lirikBawah(img, b, { garis }) {
  const putih = [];
  for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) if (R.buramXY(img, x, y) && R.key(R.warna(img, x, y)) === PUTIH_MATA) putih.push([x, y]);
  if (!putih.length) return null;
  const xa = Math.max(b[0], Math.min(...putih.map((p) => p[0])) - 2), xb = Math.min(b[2], Math.max(...putih.map((p) => p[0])) + 2);
  const yG = Math.min(...putih.map((p) => p[1]));
  const px = pikselMata(img, b).filter(([x]) => x >= xa && x <= xb);
  const xs = px.filter(([, y]) => y >= yG - 1 && y <= yG).map((p) => p[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const m = new Map();
  for (let x = x0; x <= x1; x++) for (const yy of [b[3] + 1, b[3] + 2]) {
    if (!R.buramXY(img, x, yy)) continue; const c = R.warna(img, x, yy); if (!kulitW(c)) continue;
    const k = R.key(c); m.set(k, { c, n: (m.get(k)?.n || 0) + 1 });
  }
  const kel = [...m.values()].sort((p, q) => q.n - p.n || (R.key(p.c) < R.key(q.c) ? -1 : 1))[0]?.c;
  // bukaan: baris (dari y0 sampai kotak) yang berisi putih mata atau iris gelap (L < 0,45)
  const bukaanDari = (y0) => {
    let k = 0;
    for (let y = y0; y <= b[3]; y++) {
      let ada = false;
      for (let x = x0; x <= x1; x++) { if (!R.buramXY(img, x, y)) continue; const c = R.warna(img, x, y); if (R.key(c) === PUTIH_MATA || (!kulitW(c) && L.keOklab(c)[0] < 0.45)) ada = true; }
      if (ada) k++;
    }
    return k;
  };
  // Mata dasar yang bukaannya sudah 2 baris (mis. `serius` kiri: kelopak berat) TIDAK diturunkan lagi: menurunkannya
  // menyisakan 1 baris = terpejam. Mata itu sudah setengah tertutup; varian bawahnya = dasar.
  if (bukaanDari(yG) < 3) return { n: 0, barisGaris: yG - 1, bukaan: bukaanDari(yG), tetap: true };
  let n = 0;
  if (kel) for (const [x, y] of px) if (y < yG) { R.setel(img, x, y, kel); n++; }
  for (let x = x0; x <= x1; x++) { R.setel(img, x, yG, garis); n++; }
  return { n, barisGaris: yG, bukaan: bukaanDari(yG + 1) };
}

/**
 * Bicara: garis mulut dibuka. Piksel mulut = bukan kulit di kotak. Per kolom (kecuali dua ujung) piksel mulut
 * terbawah y: y+1 -> rongga mulut, y+2 -> bibir bawah (warna garis mulut). `lebar`: 1 = rongga 1 px.
 */
export function bukaMulut(img, b, { rongga, bibir, lebar = 1 }) {
  // garis mulut = piksel non-kulit yang GELAP (L < 0,52); bayangan bibir merah terang tidak ikut
  const px = []; for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) if (R.buramXY(img, x, y) && !kulitW(R.warna(img, x, y)) && L.keOklab(R.warna(img, x, y))[0] < 0.52) px.push([x, y]);
  if (!px.length) return 0;
  const kol = new Map(); for (const [x, y] of px) kol.set(x, Math.max(kol.get(x) ?? -1, y));
  const xs = [...kol.keys()].sort((a, c) => a - c); const x0 = xs[0], x1 = xs[xs.length - 1];
  let n = 0;
  for (const x of xs) {
    if (x === x0 || x === x1) continue;
    const y = kol.get(x);
    for (let k = 1; k <= lebar; k++) { R.setel(img, x, y + k, rongga); n++; }
    R.setel(img, x, y + lebar + 1, bibir); n++;
  }
  return n;
}
