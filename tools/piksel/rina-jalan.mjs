/**
 * Bu Rina — bingkai jalan kedua `jalan-b` (bingkai LINTAS), dirakit dari frame native yang sudah ada.
 *
 * Reviu 27 Sep: jalan 2 bingkai `jalan-a` <-> `berdiri` terbaca "langkah-rapat" (kaki yang sama selalu di depan, kedua
 * telapak rapat di bingkai kedua), kepala naik-turun 5 px, dan badan atas dua gambar yang berbeda (± 5 % siluet).
 *
 * Rakitan (parameter & alasan di rina-suntingan.JALAN_B):
 *  1. Badan atas TERKUNCI: semua piksel `jalan-a` di atas baris `yPotong` (kepala, hijab, badan, lengan, kunci,
 *     keliman, pangkal paha) disalin apa adanya -> 0 piksel beda di atas garis itu.
 *  2. Kaki = kaki `berdiri` (mulai baris `kakiDari`, di bawah garis keliman), digeser (dx, dy) sehingga selangkangan
 *     berada di bawah selangkangan `jalan-a` dan telapak kaki DEKAT (kanan gambar) `bob` px di bawah telapak `jalan-a`
 *     -> setelah dijangkar di lantai, badan `bob` px lebih tinggi (posisi lintas = titik tertinggi langkah).
 *  3. Kaki JAUH (kiri gambar, di belakang kaki dekat): bagian di bawah lutut diangkat `angkat` px dan digeser miring
 *     (0 di lutut -> `geserX` di telapak) ke bawah badan -> satu kaki menapak, satu kaki terayun (bukan dua telapak rapat).
 *  4. Celah transparan antara keliman `jalan-a` dan pangkal kaki `berdiri` diisi warna kaki di bawahnya (per kolom).
 * Jangkar `jalan-b` = jangkar `jalan-a` (x sama -> badan tidak bergeser mendatar) dengan y + `bob`.
 */
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';

const dalamKotak = (rects, x, y) => rects.some(([a, b, w, h]) => x >= a && y >= b && x < a + w && y < b + h);

export function bangunJalanB(atas, kaki, P) {
  const { yPotong, kakiDari, geser: { dx, dy }, kakiJauh, lututJauh, angkat, geserX } = P;
  const o = L.buat(atas.w, atas.h);
  const tulis = (x, y, c) => { if (x >= 0 && y >= 0 && x < o.w && y < o.h) R.setel(o, x, y, c); };
  let nJauh = 0, nDekat = 0, nAtas = 0, nIsi = 0;
  // 1. kaki jauh (di belakang): di atas lutut tetap, di bawah lutut diangkat & digeser
  for (let y = kakiDari; y < kaki.h; y++) for (let x = 0; x < kaki.w; x++) {
    if (!R.buramXY(kaki, x, y) || !dalamKotak(kakiJauh, x, y) || y >= lututJauh) continue;
    tulis(x + dx, y + dy, R.warna(kaki, x, y)); nJauh++;
  }
  // geser mendatar bertahap (geser miring/shear) dari 0 di lutut ke geserX di telapak: tulang kering condong ke belakang
  let yBawah = lututJauh; for (let y = lututJauh; y < kaki.h; y++) for (let x = 0; x < kaki.w; x++) if (R.buramXY(kaki, x, y) && dalamKotak(kakiJauh, x, y)) yBawah = y;
  for (let y = lututJauh; y < kaki.h; y++) for (let x = 0; x < kaki.w; x++) {
    if (!R.buramXY(kaki, x, y) || !dalamKotak(kakiJauh, x, y)) continue;
    const gx = Math.round(geserX * (y - lututJauh) / Math.max(1, yBawah - lututJauh));
    tulis(x + dx + gx, y + dy - angkat, R.warna(kaki, x, y)); nJauh++;
  }
  // 2. kaki dekat (di depan)
  for (let y = kakiDari; y < kaki.h; y++) for (let x = 0; x < kaki.w; x++) {
    if (!R.buramXY(kaki, x, y) || dalamKotak(kakiJauh, x, y)) continue;
    tulis(x + dx, y + dy, R.warna(kaki, x, y)); nDekat++;
  }
  // 3. badan atas jalan-a (di atas yPotong) menimpa
  for (let y = 0; y < Math.min(yPotong, atas.h); y++) for (let x = 0; x < atas.w; x++) {
    if (!R.buramXY(atas, x, y)) continue;
    tulis(x, y, R.warna(atas, x, y)); nAtas++;
  }
  // 4. celah keliman <-> pangkal kaki: per kolom, piksel transparan di pita [yPotong-4, kakiDari+dy+2) yang punya
  //    piksel buram di atasnya (<= 4 px) dan di bawahnya (<= 4 px) -> warna piksel buram di bawah.
  const y0 = yPotong - 4, y1 = kakiDari + dy + 2;
  for (let x = 0; x < o.w; x++) for (let y = y0; y < y1; y++) {
    if (R.buramXY(o, x, y)) continue;
    let atasAda = false; for (let k = 1; k <= 4; k++) if (R.buramXY(o, x, y - k)) atasAda = true;
    let bawah = null; for (let k = 1; k <= 4 && !bawah; k++) if (R.buramXY(o, x, y + k)) bawah = R.warna(o, x, y + k);
    if (atasAda && bawah) { R.setel(o, x, y, bawah); nIsi++; }
  }
  return { img: o, laporan: { kakiJauh: nJauh, kakiDekat: nDekat, badanAtas: nAtas, celahDiisi: nIsi } };
}
