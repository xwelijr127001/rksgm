/**
 * Bu Rina — langkah 2: sumber alpha (rina-latar.mjs) -> frame native satu skala + palet ternormalisasi.
 *
 *   node tools/piksel/rina-native.mjs
 *
 * Skala: 1 piksel seni = P piksel sumber. P lembar `pose` = 4,00 dipilih supaya ukuran WAJAH Bu Rina cocok dengan
 * wajah Miss Raksa pada master-nya sendiri (7,34 px sumber / px seni); ukuran & alasan di docs/cerita/aset/BU-RINA-PIKSEL.md.
 * Lembar lain diskalakan ke wajah yang sama: P_lembar = 4,00 x (lebar+tinggi kotak kulit wajah lembar / lembar pose) / 2.
 * Sampling: moda klaster di inti sel (lib.sampelGrid, inti 0,55) pada fasa grid dengan energi tepi terbesar.
 * Lalu: buang pijar tepi, rapikan alpha, palet gabungan <= 40 warna (OKLab, lib.kuantisasi; garis luar dikunci ke
 * warna garis Miss Raksa), buang bintik noise JPEG (beda nada tipis saja).
 *
 * Keluaran: character/piksel/bu-rina/native/mentah/<nama>.png (hasil sampling, sebelum palet),
 *           character/piksel/bu-rina/native/palet/<nama>.png (sesudah palet & bersih; sebelum suntingan tangan),
 *           character/piksel/bu-rina/native/palet.json, character/piksel/bu-rina/native/laporan-native.json
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as R from './rina-lib.mjs';
import { LINDUNG_TEPI as LINDUNG } from './rina-suntingan.mjs';

export const DIR = path.join(L.ROOT, 'character', 'piksel', 'bu-rina');
const SUMBER = path.join(DIR, 'sumber');

/** Figur per lembar (urut baris lalu kolom). null = tidak dipakai (tidak diekspor). */
export const LEMBAR = {
  pose: { porsiAtas: 0.3, figur: ['berdiri', 'jalan-a', 'ref-duduk-pose', 'duduk-condong'] },
  jalan: { porsiAtas: 0.3, figur: ['ref-berdiri-jalan', 'ref-jalan-2', 'ref-jalan-3', 'duduk-turun'] },
  'gestur-duduk': { porsiAtas: 0.32, figur: ['lipat-tangan', 'genggam', 'dagu', 'dada', 'duduk', 'telepon'], abaikanUkur: ['dagu'] },
  ekspresi: { porsiAtas: 1, figur: ['e-kesal', 'e-cemas', 'e-bingung', 'e-lega', 'e-senang', 'e-netral', 'e-serius', 'e-tersenyum'] },
};

export const P_POSE = 4.0;
/** Warna garis luar Miss Raksa (persentil 5-25 piksel tepi master: 14,10,17 .. 17,11,20). */
export const GARIS_MISS = [15, 11, 17];
export const JUMLAH_WARNA = 40;
/** Putih mata/kilap netral (sampel lembar ekspresi 248,244,238), dikunci supaya tidak jatuh ke krem apron. */
export const PUTIH_MATA = [247, 242, 234];
/** Logam kunci (bilah): abu perak netral, dikunci supaya bilah tidak jatuh ke krem/cokelat. */
export const PERAK = [188, 186, 182];


function figurLembar(img) {
  const { out } = R.komponen(img, (p) => img.d[p * 4 + 3] > 0);
  const besar = out.filter((k) => k.n > 3000).sort((a, b) => (Math.round(a.y / 300) - Math.round(b.y / 300)) || a.x - b.x);
  return besar.map((k) => ({ x: k.x, y: k.y, w: k.w, h: k.h }));
}

export function bangunNative({ tulis = true } = {}) {
  const laporan = { P_POSE, lembar: {} };
  const sumber = {};
  const ukur = {};
  for (const nm of Object.keys(LEMBAR)) {
    const img = L.baca(path.join(SUMBER, `${nm}-alfa.png`));
    const figs = figurLembar(img);
    if (figs.length !== LEMBAR[nm].figur.length) throw new Error(`${nm}: ${figs.length} figur, harap ${LEMBAR[nm].figur.length}`);
    const kulit = figs.map((k) => R.kotakKulit(img, k, LEMBAR[nm].porsiAtas));
    sumber[nm] = { img, figs, kulit };
    const dipakai = kulit.filter((_, i) => !(LEMBAR[nm].abaikanUkur || []).includes(LEMBAR[nm].figur[i]));
    ukur[nm] = [dipakai.reduce((a, k) => a + k.w, 0) / dipakai.length, dipakai.reduce((a, k) => a + k.h, 0) / dipakai.length];
  }
  const mentah = {};
  for (const nm of Object.keys(LEMBAR)) {
    const { img, figs, kulit } = sumber[nm];
    const skala = (ukur[nm][0] / ukur.pose[0] + ukur[nm][1] / ukur.pose[1]) / 2;
    const p = +(P_POSE * skala).toFixed(3);
    const sin = L.sinyalTepi(img);
    laporan.lembar[nm] = { pitch: p, skalaWajah: +skala.toFixed(4), kulitRata: ukur[nm].map((v) => +v.toFixed(1)), figur: [] };
    figs.forEach((k, i) => {
      const nama = LEMBAR[nm].figur[i];
      const f = R.fasaTerbaik(sin, k, p);
      const ox = f.x.f + Math.floor((k.x - f.x.f) / p) * p - 2 * p, oy = f.y.f + Math.floor((k.y - f.y.f) / p) * p - 2 * p;
      const W = Math.ceil((k.x + k.w - ox) / p) + 2, H = Math.ceil((k.y + k.h - oy) / p) + 2;
      const r = L.sampelGrid(img, { sx: p, sy: p, ox, oy, w: W, h: H, inti: 0.55 });
      mentah[nama] = r.img;
      laporan.lembar[nm].figur.push({ nama, kotakSumber: [k.x, k.y, k.w, k.h], kulitSumber: [kulit[i].x, kulit[i].y, kulit[i].w, kulit[i].h], asal: [+ox.toFixed(3), +oy.toFixed(3)], ukuran: [W, H], skorFasa: [+f.x.skor.toFixed(2), +f.y.skor.toFixed(2)], ...r.laporan });
    });
  }
  // bersih tepi + alpha
  const bersih = {};
  for (const [nama, img0] of Object.entries(mentah)) {
    const img = L.salin(img0);
    const nTepi = R.bersihTepi(img, { lindungi: LINDUNG[nama] || [], garis: GARIS_MISS });
    const ra = R.rapikanAlpha(img);
    bersih[nama] = img;
    laporan[nama] = { pijar: nTepi, ...ra };
  }
  // hampir-hitam netral (garis luar Bu Rina, nyaris 0,0,0) diseragamkan ke warna garis Miss Raksa sebelum kuantisasi
  let nHitam = 0;
  for (const img of Object.values(bersih)) for (let i = 0; i < img.d.length; i += 4) {
    if (img.d[i + 3] < 128) continue;
    const lab = L.keOklab([img.d[i], img.d[i + 1], img.d[i + 2]]);
    if (lab[0] < 0.2 && Math.hypot(lab[1], lab[2]) < 0.03) { img.d[i] = GARIS_MISS[0]; img.d[i + 1] = GARIS_MISS[1]; img.d[i + 2] = GARIS_MISS[2]; nHitam++; }
  }
  laporan.hitamKeGarisMiss = nHitam;
  // palet gabungan
  const semua = R.kumpulkanWarna(Object.values(bersih));
  const palet = L.kuantisasi(semua, JUMLAH_WARNA, { eksponen: 0.5, iterasi: 40, kunci: [GARIS_MISS, PUTIH_MATA, PERAK] });
  const hasil = {};
  for (const [nama, img] of Object.entries(bersih)) {
    const q = L.petakanPalet(img, palet);
    const nb = R.buangBintik(q);
    hasil[nama] = q;
    laporan[nama].bintik = nb;
    laporan[nama].warna = L.hitungWarna(q).size;
  }
  laporan.palet = palet.map(L.hex);
  if (tulis) {
    for (const [nama, img] of Object.entries(mentah)) L.tulis(path.join(DIR, 'native', 'mentah', `${nama}.png`), img);
    for (const [nama, img] of Object.entries(hasil)) L.tulis(path.join(DIR, 'native', 'palet', `${nama}.png`), img);
    fs.writeFileSync(path.join(DIR, 'native', 'palet.json'), JSON.stringify(laporan.palet, null, 1));
    fs.writeFileSync(path.join(DIR, 'native', 'laporan-native.json'), JSON.stringify(laporan, null, 1));
  }
  return { hasil, palet, laporan };
}

if (process.argv[1]?.endsWith('rina-native.mjs')) {
  const { laporan } = bangunNative();
  for (const [nm, v] of Object.entries(laporan.lembar)) console.log(nm, 'pitch', v.pitch, 'skala', v.skalaWajah, v.figur.map((f) => `${f.nama} ${f.ukuran.join('x')}`).join(', '));
  console.log('palet', laporan.palet.length, laporan.palet.join(' '));
}
