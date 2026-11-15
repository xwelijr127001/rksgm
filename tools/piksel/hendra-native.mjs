/**
 * Pak Hendra — langkah 1 (T-013 Stage 1): tiga lembar Designer (character/hendra-pixel-v1, TIDAK diubah) -> bahan native
 * SATU palet. Dipanggil oleh bangun-hendra.mjs; bisa juga sendiri: `node tools/piksel/hendra-native.mjs` (menulis tinjauan).
 *
 * Skala (D-83):
 *  - master 1024 x 1536: pitch grid diukur lib.cariPitch (x 7, y 7,4; skor lemah karena sumber generatif) -> dipakai
 *    P_MASTER = 7,4 px sumber / px seni: badan ±196 px seni (Miss Raksa 184; pria dewasa sedikit lebih tinggi).
 *  - Aturan kepala: proporsi pria dewasa DIPERTAHANKAN (rekomendasi D-83 #2), kepala TIDAK diskalakan ke 54 px seni
 *    Miss Raksa. Lebar kepala diukur (pita rambut-telinga) dan lembar ekspresi/pose di-sampel pada pitch yang membuat
 *    lebar kepalanya SAMA dengan kepala master native, supaya wajah ekspresi bisa ditempel ke tubuh master.
 * Sampel: sumber dipetakan dulu ke palet (OKLab, lib.kuantisasi <= 40 warna dari ketiga lembar), lalu MODUS per sel
 * (sel buram bila >= 50 % piksel alpha >= 128). RGB ber-alpha 0 tidak pernah dibaca. Tanpa cermin (hadap kiri saja).
 */
import path from 'node:path';
import * as L from './lib.mjs';

export const SUMBER = path.join(L.ROOT, 'character', 'hendra-pixel-v1');
export const P_MASTER = 7.4;
/** Urutan sel lembar (baris lalu kolom), README Designer. */
export const SEL_POSE = ['cemas', 'panik', 'kecewa', 'tenang', 'senang', 'menjelaskan'];
export const SEL_EKSPRESI = ['panik', 'cemas', 'kecewa', 'tenang', 'senang', 'kedip'];

const sel = (img, i) => L.potong(img, (i % 3) * 512, Math.floor(i / 3) * 512, 512, 512);

/** Lebar kepala (px sumber): baris terlebar pita [atas+15 %, atas+55 %] dari tinggi pita kepala `pita` (px). */
export function lebarKepala(img, pita) {
  const k = L.kotakAlpha(img);
  let maks = 0;
  for (let y = Math.round(k.y + pita * 0.15); y < k.y + pita * 0.55; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < img.w; x++) if (img.d[L.idx(img, x, y) + 3] >= 128) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 >= 0) maks = Math.max(maks, x1 - x0 + 1);
  }
  return maks;
}

/** Sampel modus pada pitch p, asal (ox, oy). */
export function sampel(img, p, ox, oy, w, h) {
  const o = L.buat(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hit = new Map(); let n = 0, buram = 0;
    for (let sy = Math.floor(oy + y * p); sy < Math.floor(oy + (y + 1) * p); sy++) for (let sx = Math.floor(ox + x * p); sx < Math.floor(ox + (x + 1) * p); sx++) {
      n++;
      if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
      const i = L.idx(img, sx, sy);
      if (img.d[i + 3] < 128) continue;
      buram++;
      const kk = (img.d[i] << 16) | (img.d[i + 1] << 8) | img.d[i + 2];
      hit.set(kk, (hit.get(kk) || 0) + 1);
    }
    if (!n || buram * 2 < n) continue;
    let bk = 0, bn = -1; for (const [kk, c] of hit) if (c > bn) { bn = c; bk = kk; }
    const j = L.idx(o, x, y); o.d[j] = bk >> 16; o.d[j + 1] = (bk >> 8) & 255; o.d[j + 2] = bk & 255; o.d[j + 3] = 255;
  }
  return o;
}

/** Sampel seluruh isi alpha gambar pada pitch p (kotak alpha + 1 sel tepi). */
export function sampelIsi(img, p) {
  const k = L.kotakAlpha(img);
  const ox = k.x - p, oy = k.y - p;
  return sampel(img, p, ox, oy, Math.ceil(k.w / p) + 2, Math.ceil(k.h / p) + 2);
}

export function bahanNative() {
  const master0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'hendra-pixel-master-v1.png')));
  const pose0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'hendra-pixel-poses-v1.png')));
  const eks0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'hendra-pixel-expressions-v1.png')));
  // Palet bersama dari ketiga lembar.
  const warna = new Map();
  for (const img of [master0, pose0, eks0]) for (const [kk, n] of L.hitungWarna(img)) warna.set(kk, (warna.get(kk) || 0) + n);
  const daftar = [...warna].map(([kk, n]) => ({ c: kk.split(',').map(Number), n }));
  const palet = L.kuantisasi(daftar, 40, { kunci: [[22, 14, 16]] });
  const master = L.petakanPalet(master0, palet), pose = L.petakanPalet(pose0, palet), eks = L.petakanPalet(eks0, palet);

  const kM = L.kotakAlpha(master);
  const pitaM = 300; // puncak rambut -> dagu master ±300 px sumber
  const wM = lebarKepala(master, pitaM);
  const tubuh = sampelIsi(master, P_MASTER);
  const lebarSeni = wM / P_MASTER;

  const ukurSel = (lembar, i, pita) => lebarKepala(sel(lembar, i), pita);
  // Lembar ekspresi: kepala ±330 px pita; lembar pose ±210.
  const wE = SEL_EKSPRESI.map((_, i) => ukurSel(eks, i, 330));
  const wP = SEL_POSE.map((_, i) => ukurSel(pose, i, 210));
  const rata = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const pE = rata(wE.slice(0, 5)) / lebarSeni; // tanpa kedip (kepala sama dengan tenang)
  const pP = rata(wP) / lebarSeni;
  const ekspresi = Object.fromEntries(SEL_EKSPRESI.map((e, i) => [e, sampelIsi(sel(eks, i), pE)]));
  const gestur = Object.fromEntries(SEL_POSE.map((g, i) => [g, sampelIsi(sel(pose, i), pP)]));
  return {
    palet, tubuh, ekspresi, gestur,
    laporan: {
      master: { kotak: kM, pitch: P_MASTER, lebarKepalaSumber: wM, lebarKepalaSeni: +lebarSeni.toFixed(2), tinggiSeni: tubuh.h },
      ekspresi: { pitch: +pE.toFixed(3), lebarKepalaSumber: wE },
      pose: { pitch: +pP.toFixed(3), lebarKepalaSumber: wP },
    },
  };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const b = bahanNative();
  console.log(JSON.stringify(b.laporan, null, 1));
  const keluar = path.join(L.ROOT, 'character', 'piksel', 'hendra', 'native');
  L.tulis(path.join(keluar, 'tubuh.png'), L.perbesar(b.tubuh, 4));
  for (const [e, img] of Object.entries(b.ekspresi)) L.tulis(path.join(keluar, `e-${e}.png`), L.perbesar(img, 4));
  for (const [g, img] of Object.entries(b.gestur)) L.tulis(path.join(keluar, `g-${g}.png`), L.perbesar(img, 4));
}
