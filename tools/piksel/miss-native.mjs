/**
 * Miss Raksa — langkah 1: tiga master generatif (TIDAK diubah) -> bahan native SATU skala + palet tetap.
 *
 *   node tools/piksel/miss-native.mjs      (dipanggil juga oleh bangun-miss.mjs)
 *
 * Skala: kepala (puncak sanggul -> dagu) ± 52-54 piksel seni = skala native master sendiri.
 *  - master (1024 x 1536, berdiri): pitch grid terukur lib.cariPitch = 7,34 px sumber / px seni; fasa grid lokal
 *    lib.medanFasa (fasa bergeser sampai setengah sel), moda inti sel lib.sampelGrid.
 *  - lembar gestur (3 x 2 sel 512 px) & lembar ekspresi (3 x 2): TIDAK punya grid kasar (skor fasa ± 1,4 = acak), jadi
 *    di-sampel ulang pada pitch yang membuat siluet kepala (46 baris teratas: sanggul, rambut, pipi) paling cocok dengan
 *    kepala master native (IoU 0,93-0,97 per sel): gestur 4,45-4,65 -> 4,57 untuk semua sel; ekspresi 6,45-6,55 -> 6,5.
 *    Satu pitch per lembar supaya badan antar-gestur berskala sama.
 * RGB piksel ber-alpha 0 tidak pernah dibaca (lib.sampelGrid hanya memakai alpha >= 128); tanpa chroma key.
 *
 * v5 RATA WAJAH: lembar ekspresi juga di-sampel dengan RATA-RATA AREA (bukan moda inti) pada kisi yang sama (pitch 6,5,
 *   asal 0 -> piksel (x,y) = kotak sumber [x*6,5, (x+1)*6,5)), lalu dipetakan ke PALET_MUKA (subset palet: garis, rambut,
 *   iris, kulit, bibir, putih; tanpa emas jas/abu/gagang). Moda inti menebalkan bulu mata jadi 2 baris & menelan baris
 *   atas iris (mata 'sayu'); rata-rata area menjaga bukaan mata, iris, alis tipis, rona pipi & bayangan rahang master.
 *   Dipakai miss-wajah (op 'rata') untuk wajah dasar & cangkok ekspresi. Keluaran native/rata/<e-*>.png.
 * Keluaran: character/piksel/miss-raksa/native/mentah/<nama>.png (sampel, sebelum palet)
 *           character/piksel/miss-raksa/native/palet/<nama>.png  (sesudah rapikan alpha + palet tetap)
 *           character/piksel/miss-raksa/native/laporan-native.json
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';
import { PALET, PALET_MUKA } from './miss-suntingan.mjs';

export const DIR = path.join(L.ROOT, 'character', 'piksel', 'miss-raksa');
export const SUMBER = path.join(L.ROOT, 'character', 'miss-raksa-pixel-v4');
export const P_MASTER = 7.34, P_GESTUR = 4.57, P_EKSPRESI = 6.5;
/** Urutan sel (baris lalu kolom) sesuai README master. */
export const SEL_GESTUR = ['g-sambut', 'g-dengar', 'g-empati', 'g-jelaskan', 'g-tunjuk', 'g-lega'];
export const SEL_EKSPRESI = ['e-senyum', 'e-netral', 'e-prihatin', 'e-serius', 'e-lega', 'e-kedip'];

function sampelMaster(img, laporan) {
  const kotak = L.kotakAlpha(img);
  const sin = L.sinyalTepi(img);
  const cp = L.cariPitch(img, kotak, 7, 7.7, sin);
  const fx = cp.x.find((c) => Math.abs(c.p - P_MASTER) < 0.03) ?? cp.x[0];
  const fy = cp.y.find((c) => Math.abs(c.p - P_MASTER) < 0.05) ?? cp.y[0];
  const p = P_MASTER;
  const kor = L.medanFasa(img, { px: p, py: p, ox: fx.f, oy: fy.f, ubin: 64, halus: 1.2, sin });
  const ox = fx.f + Math.floor((kotak.x - fx.f) / p) * p - 2 * p, oy = fy.f + Math.floor((kotak.y - fy.f) / p) * p - 2 * p;
  const W = Math.ceil((kotak.x + kotak.w - ox) / p) + 2, H = Math.ceil((kotak.y + kotak.h - oy) / p) + 2;
  const r = L.sampelGrid(img, { sx: p, sy: p, ox, oy, w: W, h: H, inti: 0.55, koreksi: kor });
  laporan.master = { pitch: p, fasa: [fx.f, fy.f], skorFasa: [fx.skor, fy.skor], asal: [+ox.toFixed(3), +oy.toFixed(3)], ...r.laporan };
  return r.img;
}

function sampelSel(img, p, nama, laporan) {
  const hasil = {};
  nama.forEach((n, c) => {
    const cx = (c % 3) * 512, cy = Math.floor(c / 3) * 512;
    const sel = L.potong(img, cx, cy, 512, 512);
    const W = Math.ceil(512 / p), H = Math.ceil(512 / p);
    const r = L.sampelGrid(sel, { sx: p, sy: p, ox: 0, oy: 0, w: W, h: H, inti: 0.55 });
    hasil[n] = r.img;
    laporan[n] = { pitch: p, sel: [cx, cy, 512, 512], ...r.laporan };
  });
  return hasil;
}

/**
 * Rata-rata area (alpha >= 128 saja; RGB alpha 0 tidak dibaca) tiap sel lembar pada kisi pitch p asal 0. Piksel buram
 * bila >= 50 % sumbernya buram. Kembalian { nama: gambar RGB (belum palet) }.
 */
export function sampelRata(img, p, nama) {
  const hasil = {};
  nama.forEach((n, c) => {
    const cx = (c % 3) * 512, cy = Math.floor(c / 3) * 512;
    const W = Math.ceil(512 / p); const o = L.buat(W, W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const x0 = Math.floor(x * p), x1 = Math.floor((x + 1) * p), y0 = Math.floor(y * p), y1 = Math.floor((y + 1) * p);
      let r = 0, g = 0, b = 0, a = 0, t = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        t++; if (xx >= 512 || yy >= 512) continue;
        const i = L.idx(img, xx + cx, yy + cy); if (img.d[i + 3] < 128) continue;
        r += img.d[i]; g += img.d[i + 1]; b += img.d[i + 2]; a++;
      }
      if (!a || a / t < 0.5) continue;
      M.setel(o, x, y, [Math.round(r / a), Math.round(g / a), Math.round(b / a)]);
    }
    hasil[n] = o;
  });
  return hasil;
}

export function bangunNative({ tulis = true } = {}) {
  const laporan = {};
  const mentah = {};
  mentah.master = sampelMaster(L.baca(path.join(SUMBER, 'miss-raksa-pixel-master-v1.png')), laporan);
  Object.assign(mentah, sampelSel(L.baca(path.join(SUMBER, 'miss-raksa-pixel-poses-v1.png')), P_GESTUR, SEL_GESTUR, laporan));
  Object.assign(mentah, sampelSel(L.baca(path.join(SUMBER, 'miss-raksa-pixel-expressions-v1.png')), P_EKSPRESI, SEL_EKSPRESI, laporan));
  const rataMentah = sampelRata(L.baca(path.join(SUMBER, 'miss-raksa-pixel-expressions-v1.png')), P_EKSPRESI, SEL_EKSPRESI);
  const pal = PALET.map(L.dariHex);
  const palMuka = PALET_MUKA.map(L.dariHex);
  const rata = Object.fromEntries(Object.entries(rataMentah).map(([n, img]) => [n, L.petakanPalet(img, palMuka)]));
  const hasil = {};
  for (const [n, img0] of Object.entries(mentah)) {
    const img = L.salin(img0);
    const ra = M.rapikanAlpha(img);
    hasil[n] = L.petakanPalet(img, pal);
    laporan[n] = { ...laporan[n], ...ra, warna: L.hitungWarna(hasil[n]).size };
  }
  if (tulis) {
    for (const [n, img] of Object.entries(mentah)) L.tulis(path.join(DIR, 'native', 'mentah', `${n}.png`), img);
    for (const [n, img] of Object.entries(hasil)) L.tulis(path.join(DIR, 'native', 'palet', `${n}.png`), img);
    for (const [n, img] of Object.entries(rata)) L.tulis(path.join(DIR, 'native', 'rata', `${n}.png`), img);
    fs.writeFileSync(path.join(DIR, 'native', 'laporan-native.json'), JSON.stringify(laporan, null, 1));
  }
  return { mentah, hasil, rata, laporan };
}

if (process.argv[1]?.endsWith('miss-native.mjs')) {
  const { laporan } = bangunNative();
  for (const [n, v] of Object.entries(laporan)) console.log(n, v.pitch, `${v.w}x${v.h}`, 'ambigu', v.ambiguWarna, v.ambiguAlpha, 'warna', v.warna);
}
