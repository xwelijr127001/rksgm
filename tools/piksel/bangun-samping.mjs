/**
 * Tokoh samping Episode 2 (T-013 Stage 2, D-85): rudi, bima, darto, admin, tol, polisi -> SATU atlas + manifest per tokoh.
 *
 *   node tools/piksel/bangun-samping.mjs
 *
 * Masukan: character/tokoh-samping-ep2-pixel-v1 (sheet badan v1 = identitas kanonik, sheet ekspresi v2; TIDAK diubah).
 * Keluaran: client/src/cerita/seni/piksel/samping.png + samping.json ({ tokoh: { <id>: manifest skema susun.ts } }),
 *           character/piksel/samping/tinjau-samping.png.
 *
 * - Skala: lebar kepala tiap sel (pita rambut/topi) disamakan dengan kepala master Pak Hendra (36 piksel seni), per sel
 *   (kepala sheet ekspresi ± 1,3x sheet badan -> pitch sendiri, dinormalkan).
 * - Badan: pinggang ke atas (sheet) + BAGIAN BAWAH PROSEDURAL (rekomendasi D-85 (a)): celana dua kaki dari warna per tokoh,
 *   garis tepi gelap, sepatu; tinggi total ± 188 piksel seni (sedikit di bawah Hendra 198).
 * - Wajah: `netral` = wajah sheet badan (terpanggang), `prihatin` = wajah sheet ekspresi v2 diregistrasi ke kepala badan
 *   (IoU siluet atas kepala) dan ditempel di kotak wajah. ekspresiDari (D-85): netral|tersenyum|senang|lega -> netral,
 *   cemas|serius|bingung|kesal -> prihatin. Tanpa kedip, tanpa bicara, hadap KIRI saja (sheet tidak punya varian kanan).
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import { kemas, tulisPngIndeks } from './miss-lib.mjs';
import { lebarKepala, sampelIsi } from './hendra-native.mjs';
import { kepalaDari, komponenUtama, registrasi } from './bangun-hendra.mjs';

const SUMBER = path.join(L.ROOT, 'character', 'tokoh-samping-ep2-pixel-v1');
const KELUAR = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const LEBAR_KEPALA = 36;
const TINGGI = 188;
/** id naskah -> sel (baris lalu kolom) + warna celana & sepatu (dari palet sheet badan, dipilih per kostum). */
export const SAMPING = {
  rudi: { sel: 0, celana: [52, 58, 74], sepatu: [40, 30, 26] },
  bima: { sel: 1, celana: [62, 60, 62], sepatu: [36, 28, 24] },
  darto: { sel: 2, celana: [70, 78, 98], sepatu: [70, 46, 30] },
  admin: { sel: 3, celana: [44, 44, 50], sepatu: [30, 26, 26] },
  tol: { sel: 4, celana: [40, 48, 70], sepatu: [30, 28, 28] },
  polisi: { sel: 5, celana: [92, 72, 56], sepatu: [26, 22, 22] },
};
const EKSPRESI_DARI = { netral: 'netral', tersenyum: 'netral', senang: 'netral', lega: 'netral', cemas: 'prihatin', serius: 'prihatin', bingung: 'prihatin', kesal: 'prihatin' };
const sel = (img, i) => L.potong(img, (i % 3) * 512, Math.floor(i / 3) * 512, 512, 512);
const buram = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.d[L.idx(img, x, y) + 3] >= 128;

/** Bagian bawah prosedural di bawah badan pinggang-ke-atas. */
function tambahKaki(badan, celana, sepatu, garis) {
  const tinggiKaki = Math.max(40, TINGGI - badan.h);
  let x0 = badan.w, x1 = -1;
  for (let y = badan.h - 3; y < badan.h; y++) for (let x = 0; x < badan.w; x++) if (buram(badan, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const lebar = Math.round((x1 - x0 + 1) * 0.62);
  const kiri = Math.round((x0 + x1 + 1) / 2 - lebar / 2);
  const o = L.buat(badan.w + 4, badan.h + tinggiKaki);
  L.tempel(o, badan, 0, 0);
  const isi = (x, y, c) => { if (x < 0 || x >= o.w) return; const j = L.idx(o, x, y); o.d[j] = c[0]; o.d[j + 1] = c[1]; o.d[j + 2] = c[2]; o.d[j + 3] = 255; };
  const gelap = celana.map((v) => Math.round(v * 0.78));
  const celah = Math.round(tinggiKaki * 0.25);
  for (let dy = 0; dy < tinggiKaki; dy++) {
    const y = badan.h + dy;
    const sepatuBaris = dy >= tinggiKaki - 6;
    for (let x = kiri - (sepatuBaris ? 3 : 0); x < kiri + lebar; x++) {
      const lx = x - kiri;
      const tengah = Math.floor(lebar / 2);
      if (dy > celah && Math.abs(lx - tengah) <= 1) continue; // celah antar kaki
      const tepi = x === kiri - (sepatuBaris ? 3 : 0) || x === kiri + lebar - 1 || (dy > celah && Math.abs(lx - tengah) === 2) || dy === tinggiKaki - 1;
      if (tepi) isi(x, y, garis);
      else if (sepatuBaris) isi(x, y, sepatu);
      else isi(x, y, lx < tengah ? celana : gelap); // kaki belakang (kanan gambar) sedikit lebih gelap
    }
  }
  return o;
}

export function bangunSamping() {
  const badan0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'tokoh-samping-badan-v1.png')));
  const eks0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'tokoh-samping-ekspresi-v2.png')));
  const warna = new Map();
  for (const img of [badan0, eks0]) for (const [kk, n] of L.hitungWarna(img)) warna.set(kk, (warna.get(kk) || 0) + n);
  const kunciWarna = [[22, 14, 16], ...Object.values(SAMPING).flatMap((x) => [x.celana, x.celana.map((v) => Math.round(v * 0.78)), x.sepatu])];
  const palet = L.kuantisasi([...warna].map(([kk, n]) => ({ c: kk.split(',').map(Number), n })), 64, { kunci: kunciWarna });
  const badan = L.petakanPalet(badan0, palet), eks = L.petakanPalet(eks0, palet);
  const garis = palet[0];
  const hasil = {};
  const laporan = {};
  for (const [id, c] of Object.entries(SAMPING)) {
    const sb = sel(badan, c.sel), se = sel(eks, c.sel);
    const wB = lebarKepala(sb, 190), wE = lebarKepala(se, 250);
    const pB = wB / LEBAR_KEPALA, pE = wE / LEBAR_KEPALA;
    const b = komponenUtama(sampelIsi(sb, pB));
    const e = komponenUtama(sampelIsi(se, pE));
    const tubuh = tambahKaki(b, c.celana, c.sepatu, garis);
    const kB = kepalaDari(tubuh, 22);
    const r = registrasi(tubuh, e, 22);
    const wajah = { x: kB.x0 + 8, y: kB.atas + 12, w: Math.max(18, kB.x1 - kB.x0 - 7), h: 30 };
    const potongE = L.potong(e, wajah.x - r.dx, wajah.y - r.dy, wajah.w, wajah.h);
    const potongN = L.potong(tubuh, wajah.x, wajah.y, wajah.w, wajah.h);
    hasil[id] = { tubuh, wajah, potongE, potongN, kB };
    laporan[id] = { pitchBadan: +pB.toFixed(3), pitchEkspresi: +pE.toFixed(3), badan: [b.w, b.h], tinggi: tubuh.h, registrasi: r };
  }
  // Atlas.
  const bagian = Object.entries(hasil).flatMap(([id, h]) => [{ id: `${id}-tubuh`, img: h.tubuh }, { id: `${id}-netral`, img: h.potongN }, { id: `${id}-prihatin`, img: h.potongE }]);
  const kotak = bagian.map((x) => ({ id: x.id, kunci: x.id, w: x.img.w, h: x.img.h }));
  const W = 512;
  const H = kemas(kotak, W);
  const pos = Object.fromEntries(kotak.map((x) => [x.id, x]));
  const atlas = L.buat(W, H);
  for (const x of bagian) L.tempel(atlas, x.img, pos[x.id].x, pos[x.id].y);
  const r = (i) => [pos[i].x, pos[i].y, pos[i].w, pos[i].h];
  const manifest = {};
  for (const [id, h] of Object.entries(hasil)) {
    const k = L.kotakAlpha(h.tubuh);
    let a = h.tubuh.w, bb = 0;
    for (let y = h.tubuh.h - 2; y < h.tubuh.h; y++) for (let x = 0; x < h.tubuh.w; x++) if (buram(h.tubuh, x, y)) { a = Math.min(a, x); bb = Math.max(bb, x); }
    const kaki = { x: Math.round((a + bb + 1) / 2), y: k.y + k.h - 1 };
    const kepalaTinggi = h.wajah.y + h.wajah.h - h.kB.atas;
    const kepala = { x: (h.kB.x0 + h.kB.x1 + 1) / 2, y: h.kB.atas + kepalaTinggi / 2 };
    const jendela = (sisi, skala, gy = 0) => ({ frame: 'berdiri-kiri', x: Math.round(kepala.x - sisi / 2), y: Math.round(kepala.y - sisi / 2 + gy), sisi, skala, tampil: sisi * skala });
    manifest[id] = {
      versi: 1,
      dibuat: 'tools/piksel/bangun-samping.mjs',
      tokoh: id,
      piksel: 4,
      gambar: 'samping.png',
      ukuranAtlas: [W, H],
      skala: { unitDuniaPerPikselSeni: 4, pxSumberPerPikselSeni: { badan: laporan[id].pitchBadan, ekspresi: laporan[id].pitchEkspresi }, kepala: `lebar kepala ${LEBAR_KEPALA} piksel seni (= Pak Hendra)` },
      ekspresi: ['netral', 'prihatin'],
      varian: ['dasar'],
      ekspresiDari: EKSPRESI_DARI,
      frame: {
        'berdiri-kiri': {
          rect: r(`${id}-tubuh`), hadap: 'kiri', jenisJangkar: 'kaki', jangkar: kaki, kaki, kepala, kepalaTinggi,
          wajah: { kotak: [h.wajah.x, h.wajah.y, h.wajah.w, h.wajah.h], mata: [h.wajah.x, h.wajah.y + 4, h.wajah.w, 8], mulut: [h.wajah.x + 4, h.wajah.y + 20, 8, 4] },
          ekspresi: { netral: { dasar: r(`${id}-netral`) }, prihatin: { dasar: r(`${id}-prihatin`) } },
        },
      },
      pose: { berdiri: { kiri: 'berdiri-kiri', bawaan: 'kiri' } },
      pandang: { lawan: { arah: 'kiri' }, pemain: { arah: 'kiri' }, depan: { arah: 'kiri' }, bawah: {} },
      potret: {
        frame: 'berdiri-kiri',
        jendela: { 32: jendela(32, 1, 2), 44: jendela(44, 1, 4), 52: jendela(52, 1, 6), 64: jendela(64, 1, 8), 96: jendela(48, 2, 4) },
        dekat: { 52: jendela(26, 2, 2), 64: jendela(32, 2, 2), 96: jendela(32, 3, 2) },
      },
      telepon: { frame: 'berdiri-kiri', jendela: jendela(56, 1, 10) },
    };
  }
  return { atlas, manifest, palet, hasil, laporan };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const s = bangunSamping();
  const png = tulisPngIndeks(path.join(KELUAR, 'samping.png'), s.atlas, s.palet);
  fs.writeFileSync(path.join(KELUAR, 'samping.json'), JSON.stringify({ versi: 1, dibuat: 'tools/piksel/bangun-samping.mjs', tokoh: s.manifest }, null, 1) + '\n');
  const item = [];
  for (const [id, h] of Object.entries(s.hasil)) {
    const t = L.salin(h.tubuh);
    L.tempel(t, h.potongE, h.wajah.x, h.wajah.y);
    item.push({ label: id, img: L.datarkan(h.tubuh, [246, 236, 214]) }, { label: `${id} prihatin`, img: L.datarkan(t, [246, 236, 214]) });
  }
  L.tulis(path.join(L.ROOT, 'character', 'piksel', 'samping', 'tinjau-samping.png'), L.perbesar(L.susun(item), 2));
  console.log(JSON.stringify({ atlas: [s.atlas.w, s.atlas.h], png, laporan: s.laporan }));
}
