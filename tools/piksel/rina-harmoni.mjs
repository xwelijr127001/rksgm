/**
 * Bu Rina — HARMONISASI dengan gaya Miss Raksa v5 (brief v4-polish §6: "selaraskan bayangan, sorotan, ketebalan garis,
 * dan kepadatan detail Miss dan Bu Rina"). Dijalankan bangun-rina.mjs pada frame native (sesudah suntingan tahap A,
 * sebelum jalan-b & keluarga duduk) dan pada kepala wajah netral (di luar kotak fitur). Deterministik: setiap langkah
 * membaca SALINAN gambar (Jacobi), urutan piksel tetap, seri diputus urutan tetangga tetap. Hanya warna palet yang
 * sudah ada yang dipakai (palet & jumlah warna tidak berubah).
 *
 * Temuan yang ditangani (diukur di lembar Miss vs Bu Rina, alat ukur di scratchpad v5/konsistensi):
 *  1. GARIS SILUET: Miss memakai garis cokelat tua hangat (#461605/#340d03 = 61 % piksel tepi siluet, hitam 31 %);
 *     Bu Rina hitam #0f0b11 (44-50 %) -> garis Bu Rina terbaca lebih tebal/berat. Garis siluet hitam diganti cokelat tua
 *     palet Bu Rina (`garisKe`), KECUALI di bahan yang memang gelap (celana, sepatu: tetangga dalam L < `bahanGelap`) dan
 *     di kotak lindung (kunci, gagang).
 *  2. TEPI JPEG: taji (piksel buram dengan >= 3 tetangga-4 transparan) & lekuk (transparan dengan >= 3 tetangga-4
 *     buram) membuat garis tepi putus-putus/bergerigi; Miss hampir tanpa taji (4) & lekuk (13) per frame, Bu Rina 15-19
 *     & 20-34. Taji dibuang, lekuk diisi warna garis tetangganya; komponen buram lepas <= `lepasMaks` px dibuang.
 *  3. BINTIK DALAM: bercak 1-2 px nada tetangga (sisa noise JPG) di hijab, tunik, celana, kulit. Piksel yang punya <= 1
 *     tetangga-8 sewarna, sedangkan >= `mayoritasMin` tetangganya satu warna c2 dengan jarak OKLab < `ambangBintik`
 *     (beda nada tipis satu bahan), diganti c2. Garis lipatan yang jelas (beda >= 2 nada), fitur wajah (kotak fitur),
 *     kilap mata, bros, kunci & jari (kotak lindung) tidak disentuh.
 * Bentuk tubuh, pose, wajah/ekspresi, warna identitas (hijab bata, tunik biru, apron, bros, kunci) tidak digambar ulang.
 */
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';

export const HARMONI = {
  /** Komponen buram lepas (tetangga-8) sebesar ini atau kurang dibuang. */
  lepasMaks: 2,
  /** Warna garis siluet yang diganti (hitam netral garis bersama + hampir-hitam hangat). */
  garisHitam: ['#0f0b11', '#180401'],
  /** Cokelat tua hangat palet Bu Rina (Miss: #340d03 L 0,22 / #461605 L 0,27). */
  garisKe: '#290e05',
  /** Bahan gelap (celana abu tua, sepatu): garis siluet di sebelahnya tetap hitam supaya tepi tetap terbaca. */
  bahanGelap: 0.36,
  /** Bintik: jarak OKLab maks ke warna mayoritas tetangga, jumlah tetangga-8 mayoritas minimum, putaran. */
  ambangBintik: 0.075,
  mayoritasMin: 5,
  /** Tetangga-8 sewarna maksimum agar piksel dihitung bercak (2 = bercak <= 3 px). */
  samaMaks: 2,
  /** Goresan di bahan gelap kusam (celana): jarak OKLab maks. */
  ambangGores: 0.16,
  putaranBintik: 2,
  /** Kepala: abu-cokelat keruh sisa JPG di tepi wajah (garis pipi/rahang) -> garis cokelat tua seperti rahang Miss. */
  keruhWajah: ['#76502f', '#53473d'],
  garisWajah: '#3d1406',
  /** Baris kepala dari puncak siluet (sama dengan HEAD_H bangun-rina). */
  tinggiKepala: 64,
};

const T4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const T8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const dalam = (kotak, x, y) => kotak.some(([a, b, c, d]) => x >= a && y >= b && x < a + c && y < b + d);

/** Cache OKLab per warna (palet kecil). */
const cacheLab = new Map();
function lab(c) {
  const k = (c[0] << 16) | (c[1] << 8) | c[2];
  let v = cacheLab.get(k);
  if (!v) { v = L.keOklab(c); cacheLab.set(k, v); }
  return v;
}

/** 1. Komponen buram lepas kecil (bukan badan utama) -> transparan. */
function buangLepas(img, lindung, maks) {
  const { out } = R.komponen(img, (p) => img.d[p * 4 + 3] >= 128, true);
  let n = 0;
  for (const k of out) {
    if (k.n > maks) continue;
    if (k.px.some((p) => dalam(lindung, p % img.w, (p / img.w) | 0))) continue;
    for (const p of k.px) { R.setel(img, p % img.w, (p / img.w) | 0, null); n++; }
  }
  return n;
}

/** 2a. Taji: buram dengan >= 3 tetangga-4 transparan -> transparan. */
function buangTaji(img, lindung) {
  const src = L.salin(img); const daftar = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    if (T4.filter(([dx, dy]) => !R.buramXY(src, x + dx, y + dy)).length >= 3) daftar.push([x, y]);
  }
  for (const [x, y] of daftar) R.setel(img, x, y, null);
  return daftar.length;
}

/** 2b. Lekuk: transparan dengan >= 3 tetangga-4 buram -> warna tetangga-4 tergelap (garis). */
function isiLekuk(img, lindung) {
  const src = L.salin(img); const daftar = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    const q = T4.filter(([dx, dy]) => R.buramXY(src, x + dx, y + dy)).map(([dx, dy]) => R.warna(src, x + dx, y + dy));
    if (q.length < 3) continue;
    q.sort((a, b) => lab(a)[0] - lab(b)[0]);
    daftar.push([x, y, q[0]]);
  }
  for (const [x, y, c] of daftar) R.setel(img, x, y, c);
  return daftar.length;
}

/** 3. Garis siluet hitam -> cokelat tua (kecuali di bahan gelap / kotak lindung). */
function warnaiGaris(img, lindung, { garisHitam, garisKe, bahanGelap }) {
  const hitam = garisHitam.map((h) => R.key(L.dariHex(h)));
  const ke = L.dariHex(garisKe);
  const src = L.salin(img); const daftar = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    if (!hitam.includes(R.key(R.warna(src, x, y)))) continue;
    if (!T4.some(([dx, dy]) => !R.buramXY(src, x + dx, y + dy))) continue;
    // bahan di dalam: piksel buram bukan-garis dalam radius 2 (terdekat dulu); tanpa bahan = biarkan
    let bahan = null;
    for (let r = 1; r <= 2 && !bahan; r++) {
      const cand = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !R.buramXY(src, x + dx, y + dy)) continue;
        const c = R.warna(src, x + dx, y + dy);
        if (lab(c)[0] < 0.26) continue; // garis/hampir-hitam lain
        cand.push(c);
      }
      if (cand.length) bahan = cand.sort((a, b) => lab(a)[0] - lab(b)[0])[0];
    }
    if (!bahan || lab(bahan)[0] < bahanGelap) continue;
    daftar.push([x, y]);
  }
  for (const [x, y] of daftar) R.setel(img, x, y, ke);
  return daftar.length;
}

/**
 * 3b. Tepi pipi/rahang keruh: abu-cokelat sisa JPG (`keruhWajah`) yang bertetangga kulit DAN (transparan atau hijab)
 * -> garis cokelat tua; hanya di baris kepala (`yMaks`) supaya keliman celana di atas mata kaki tidak ikut.
 */
function garisPipi(img, lindung, yMaks, { keruhWajah, garisWajah }) {
  const keruh = keruhWajah.map((h) => R.key(L.dariHex(h)));
  const kulit = (c) => { const p = lab(c); const h = (Math.atan2(p[2], p[1]) * 180) / Math.PI; return p[0] > 0.6 && Math.hypot(p[1], p[2]) > 0.1 && h > 40 && h < 75; };
  const hijab = (c) => { const p = lab(c); const h = (Math.atan2(p[2], p[1]) * 180) / Math.PI; return Math.hypot(p[1], p[2]) > 0.12 && h > 20 && h < 45 && p[0] < 0.6; };
  const src = L.salin(img); const daftar = [];
  for (let y = 0; y < Math.min(img.h, yMaks); y++) for (let x = 0; x < img.w; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y) || !keruh.includes(R.key(R.warna(src, x, y)))) continue;
    const t = T4.map(([dx, dy]) => (R.buramXY(src, x + dx, y + dy) ? R.warna(src, x + dx, y + dy) : null));
    if (!t.some((c) => c && kulit(c))) continue;
    if (!t.some((c) => !c || hijab(c))) continue;
    daftar.push([x, y]);
  }
  for (const [x, y] of daftar) R.setel(img, x, y, L.dariHex(garisWajah));
  return daftar.length;
}

/**
 * 3c. Pijar tepi tersisa: piksel terang kusam (L > 0,55, kroma < 0,09: sisa latar putih JPG yang tercampur) di tepi
 * siluet, yang tepat di sisi dalamnya (arah berlawanan dengan tetangga transparan) berupa BAHAN gelap (L 0,25-0,5, bukan
 * garis) -> garis cokelat tua. Contoh: tepi kiri celana `duduk` (4 piksel krem di tempat garis). Pita apron (krem di
 * sebelah garis gelap) tidak kena karena sisi dalamnya garis (L < 0,25).
 */
function pijarTepi(img, lindung, { garisKe }) {
  const src = L.salin(img); const daftar = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    const p = lab(R.warna(src, x, y));
    if (p[0] <= 0.55 || Math.hypot(p[1], p[2]) >= 0.09) continue;
    let kena = false;
    for (const [dx, dy] of T4) {
      if (R.buramXY(src, x + dx, y + dy) || !R.buramXY(src, x - dx, y - dy)) continue;
      const q = lab(R.warna(src, x - dx, y - dy));
      if (q[0] >= 0.25 && q[0] <= 0.5 && q[0] < p[0] - 0.15) kena = true;
    }
    if (kena) daftar.push([x, y]);
  }
  for (const [x, y] of daftar) R.setel(img, x, y, L.dariHex(garisKe));
  return daftar.length;
}

/**
 * 3d. Goresan di bahan gelap kusam (celana): piksel kontras sedang (jarak OKLab < `ambangGores`) dengan <= 2 tetangga
 * sewarna, yang >= `mayoritasMin` tetangganya satu warna gelap kusam (L < 0,5, kroma < 0,035) -> warna itu (bukan garis: L >= 0,25). Hanya bahan
 * kusam gelap (celana), jadi lipatan hijab/tunik dan jahitan oranye tidak tersentuh.
 */
function rataGores(img, lindung, { ambangGores, mayoritasMin }) {
  const src = L.salin(img); const daftar = [];
  for (let y = 1; y < img.h - 1; y++) for (let x = 1; x < img.w - 1; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    const c = R.warna(src, x, y);
    let sama = 0, penuh = true; const m = [];
    for (const [dx, dy] of T8) {
      if (!R.buramXY(src, x + dx, y + dy)) { penuh = false; break; }
      const q = R.warna(src, x + dx, y + dy);
      if (R.samaW(q, c)) { sama++; continue; }
      const k = R.key(q); const e = m.find((v) => v.k === k);
      if (e) e.n++; else m.push({ k, c: q, n: 1 });
    }
    if (!penuh || sama > 2) continue;
    m.sort((a, b) => b.n - a.n);
    const top = m[0];
    if (!top || top.n < mayoritasMin) continue;
    const t = lab(top.c);
    if (t[0] < 0.25 || t[0] >= 0.5 || Math.hypot(t[1], t[2]) >= 0.035) continue;
    if (lab(c)[0] < 0.2 || L.jarakOk(lab(c), t) >= ambangGores) continue;
    daftar.push([x, y, top.c]);
  }
  for (const [x, y, c] of daftar) R.setel(img, x, y, c);
  return daftar.length;
}

/** 4. Bintik dalam: <= 1 tetangga-8 sewarna, mayoritas >= min, beda nada tipis -> warna mayoritas. */
function rataBintik(img, lindung, { ambangBintik, mayoritasMin, samaMaks }) {
  const src = L.salin(img); const daftar = [];
  for (let y = 1; y < img.h - 1; y++) for (let x = 1; x < img.w - 1; x++) {
    if (!R.buramXY(src, x, y) || dalam(lindung, x, y)) continue;
    const c = R.warna(src, x, y);
    if (lab(c)[0] < 0.2 || lab(c)[0] > 0.93) continue; // garis & kilap putih
    let sama = 0, penuh = true; const m = [];
    for (const [dx, dy] of T8) {
      if (!R.buramXY(src, x + dx, y + dy)) { penuh = false; break; }
      const q = R.warna(src, x + dx, y + dy);
      if (R.samaW(q, c)) { sama++; continue; }
      const k = R.key(q); const e = m.find((v) => v.k === k);
      if (e) e.n++; else m.push({ k, c: q, n: 1 });
    }
    if (!penuh || sama > samaMaks) continue;
    m.sort((a, b) => b.n - a.n);
    const top = m[0];
    if (!top || top.n < mayoritasMin) continue;
    if (L.jarakOk(lab(c), lab(top.c)) >= ambangBintik) continue;
    daftar.push([x, y, top.c]);
  }
  for (const [x, y, c] of daftar) R.setel(img, x, y, c);
  return daftar.length;
}

/**
 * Harmonisasi satu frame tubuh (koordinat native). `lindung` = kotak [x,y,w,h] yang tidak disentuh (kunci, gagang,
 * jari di dagu). Mengubah `img` di tempat; kembalikan jumlah piksel per langkah.
 */
export function harmonikanTubuh(img, { lindung = [], opsi = HARMONI } = {}) {
  const sebelum = L.salin(img);
  const lepas = buangLepas(img, lindung, opsi.lepasMaks);
  const taji = buangTaji(img, lindung);
  const lekuk = isiLekuk(img, lindung);
  const lepas2 = buangLepas(img, lindung, opsi.lepasMaks);
  const garis = warnaiGaris(img, lindung, opsi);
  const kk = L.kotakAlpha(img);
  const pipi = garisPipi(img, lindung, kk.y + opsi.tinggiKepala, opsi);
  const pijar = pijarTepi(img, lindung, opsi);
  let gores = 0;
  for (let i = 0; i < opsi.putaranBintik; i++) gores += rataGores(img, lindung, opsi);
  let bintik = 0;
  for (let i = 0; i < opsi.putaranBintik; i++) bintik += rataBintik(img, lindung, opsi);
  return { lepas: lepas + lepas2, taji, lekuk, garis, pipi, pijar, gores, bintik, total: R.selisih(sebelum, img).length };
}

/**
 * Harmonisasi kepala wajah (koordinat kepala netral 70 x 80), hanya di dalam mask wajah `M` dan di luar kotak fitur
 * (alis, mata, mulut tidak disentuh): (a) garis tepi pipi/rahang abu-cokelat keruh sisa JPG -> cokelat tua (rahang Miss
 * juga bergaris cokelat tua), (b) bintik nada tipis di kulit. Hijab di sekitar wajah berasal dari frame tubuh (sudah
 * diharmonikan).
 */
export function harmonikanKepala(img, M, { fitur = [], opsi = HARMONI } = {}) {
  const lindung = [...fitur];
  const asli = L.salin(img);
  const keruh = opsi.keruhWajah.map((h) => R.key(L.dariHex(h)));
  const daftar = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!M[y * img.w + x] || dalam(lindung, x, y) || !keruh.includes(R.key(R.warna(asli, x, y)))) continue;
    if (!T4.some(([dx, dy]) => R.buramXY(asli, x + dx, y + dy) && lab(R.warna(asli, x + dx, y + dy))[0] > 0.6)) continue;
    daftar.push([x, y]);
  }
  for (const [x, y] of daftar) R.setel(img, x, y, L.dariHex(opsi.garisWajah));
  const sesudahKeruh = L.salin(img);
  for (let i = 0; i < opsi.putaranBintik; i++) rataBintik(img, lindung, opsi);
  // hanya piksel di dalam mask wajah yang boleh berubah
  for (let p = 0; p < M.length; p++) {
    if (M[p]) continue;
    for (let k = 0; k < 4; k++) img.d[p * 4 + k] = sesudahKeruh.d[p * 4 + k];
  }
  return { keruh: daftar.length, bintik: R.selisih(sesudahKeruh, img).length, total: R.selisih(asli, img).length };
}
