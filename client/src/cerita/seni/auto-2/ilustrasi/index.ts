/**
 * Aset ILUSTRASI tokoh & kantor EPISODE AUTO-2 (turunan aset pemilik: tools/cerita/bangun-ilustrasi-auto2.mjs; sumber,
 * sha256, statistik tepi di ilustrasi.json; pemetaan & kekurangan di docs/cerita/aset/ILUSTRASI-AUTO2.md).
 *
 * - URL WebP: `import.meta.glob(..., { query: '?url' })` di Vite (aset ber-hash, dimuat saat dipakai saja); di tes node
 *   (tsx) URL berkas `new URL(..., import.meta.url)` (pola seni/piksel/index.ts).
 * - Ekspresi: potret Miss Raksa & Pak Hendra per ekspresi naskah (pemetaan di manifest); tokoh lain hanya punya badan
 *   penuh (ekspresi apa pun = badan itu), termasuk polisi (aset reasset).
 * - KANTOR: interior pilihan pemilik + lapisan meja depan; letak tokoh di balik meja & bingkai HP/lebar diukur dari
 *   gambar 1672 x 941 (tepi jauh meja kaca y 604-668).
 * - LAPANGAN (pool, bengkel, tol, ruang wawancara): latar reasset + badan penuh berpijak menurut perspektif gambar, truk
 *   trailer sebagai benda berkedalaman, papan/rambu/nomor lajur dari kode.
 * Modul ini tidak menyentuh DOM.
 */
import json from './ilustrasi.json';
import { KABUR_AUTO_2 } from './kabur';
import type { BendaIlustrasi, Ekspresi, GambarTokoh, LokasiIlustrasi, TokohIlustrasi, VarianGambar } from '../../../tipe';

let urlVite: Record<string, string> = {};
try {
  urlVite = import.meta.glob('./*.webp', { eager: true, query: '?url', import: 'default' });
} catch {
  /* bukan Vite (tes node): URL berkas di bawah */
}
const url = (berkas: string): string => urlVite[`./${berkas}`] ?? new URL(`./${berkas}`, import.meta.url).href;

interface VarianJson { w: number; h: number; berkas: string }
interface GambarJson { kepala: GambarTokoh['kepala']; rasio: number; dekat: VarianJson[]; avatar: VarianJson[] }
interface Manifest {
  potret: Record<string, GambarJson & { tokoh: string; ekspresi: Ekspresi[] }>;
  badan: Record<string, GambarJson & { tokoh: string; tinggiSumber: number }>;
  benda: Record<string, { rasio: number; alasPerSepertiga: number[]; gambar: VarianJson[] }>;
  latar: Record<string, { ukuranSumber: [number, number]; gambar: VarianJson[]; depan?: VarianJson[] }>;
}
const M = json as unknown as Manifest;

const varian = (v: VarianJson[]): readonly VarianGambar[] => v.map((x) => ({ w: x.w, h: x.h, src: url(x.berkas) }));
const gambar = (g: GambarJson): GambarTokoh => ({ varian: varian(g.dekat), rasio: g.rasio, kepala: g.kepala });

/**
 * Tinggi badan penuh di dunia panggung kode per piksel sumber: figur ~1530 px -> ~160 satuan dunia, setara tinggi tokoh
 * panggung sebelumnya, jadi slot & kamera lokasi lapangan tetap pas. Satu faktor untuk semua tokoh (tinggi relatif
 * antartokoh dari sumber tetap).
 */
const SKALA_BADAN = 160 / 1530;

function tokoh(id: string): TokohIlustrasi {
  const potret = Object.values(M.potret).filter((p) => p.tokoh === id);
  const badan = Object.values(M.badan).find((b) => b.tokoh === id);
  const b = badan ? { ...gambar(badan), tinggi: Math.round(badan.tinggiSumber * SKALA_BADAN) } : undefined;
  if (!potret.length) {
    if (!badan || !b) throw new Error(`aset ilustrasi "${id}" tidak ada`);
    return { avatar: { netral: varian(badan.avatar) }, dekat: { netral: b }, badan: b };
  }
  const avatar: Partial<Record<Ekspresi, readonly VarianGambar[]>> = {};
  const dekat: Partial<Record<Ekspresi, GambarTokoh>> = {};
  for (const p of potret) {
    const [av, dk] = [varian(p.avatar), gambar(p)];
    for (const e of p.ekspresi) { avatar[e] = av; dekat[e] = dk; }
  }
  if (!avatar.netral || !dekat.netral) throw new Error(`aset ilustrasi "${id}" tanpa ekspresi netral`);
  return { avatar: { ...avatar, netral: avatar.netral }, dekat: { ...dekat, netral: dekat.netral }, ...(b ? { badan: b } : {}) };
}

/** Aset per pemeran Episode 2 (id pemeran -> aset). */
export const TOKOH_AUTO_2: Readonly<Record<string, TokohIlustrasi>> = Object.fromEntries(
  ['missRaksa', 'hendra', 'rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'].map((id) => [id, tokoh(id)]),
);

const latar = (id: string) => {
  const l = M.latar[id];
  if (!l) throw new Error(`latar ilustrasi "${id}" tidak ada`);
  return { w: l.ukuranSumber[0], h: l.ukuranSumber[1], latar: varian(l.gambar), ...(l.depan ? { depan: varian(l.depan) } : {}), ...(KABUR_AUTO_2[id] ? { kabur: KABUR_AUTO_2[id] } : {}) };
};

/**
 * Interior kantor (pilihan pemilik) dengan tokoh di balik meja kaca. HP tegak (panggung 4:3 visual novel): potongan 800 px
 * berpusat ke tokoh (wajah & tangan besar; lebih sempit = latar 1672 px diperbesar > 1,6x di DPR 3), lebar: hampir seluruh ruangan. Baki berkas di sisi kanan meja.
 */
export const KANTOR_AUTO_2: LokasiIlustrasi = {
  ...latar('kantor'),
  tokoh: { jenis: 'dekat', slot: { 1: [880], 2: [760, 1010], 3: [700, 880, 1060] }, atasKepala: 262, tinggiKepala: 214 },
  // hpDekat: beat pendek di panggung HP 1:1 = Miss Raksa memenuhi panggung (latar dikaburkan halus, PanggungLatar).
  bingkai: { hp: { cx: 955, cy: 430, lebar: 800 }, lebar: { cx: 880, cy: 470, lebar: 1600 }, hpDekat: { cx: 900, cy: 470, lebar: 540 } },
  objek: { berkas: { seni: 'bundel.berkas', x: 1110, y: 524, w: 230 } },
};

// ------------------------------------------------------------------ lapangan (latar reasset 1672 x 941)
//
// Keempat latar digambar dari ketinggian mata yang sama: cakrawala (titik hilang lantai/rak/marka) di y ~455 (tol ~500).
// `mata` = tinggi kamera (m) yang membuat ukuran benda acuan masuk akal (pintu pos 2,1 m, lis dinding ~1 m, rel pengaman).
// Tokoh = badan penuh berpijak di titik slot; semua tulisan (papan antrean, rambu, nomor lajur) digambar kode.

const trailer = M.benda.trailer!;
/**
 * Truk trailer kasus di pool: roda depan menapak di (kanan, alas), lebar `w`. Skala dari perspektif: tinggi kabin ~3,9 m
 * pada alas y 650 (cakrawala 455, mata 1,7 m -> 115 px/m) = lebar 985 px. Fokus = kepala truk yang ringsek + pangkal bak.
 */
function trukDi(kanan: number, alas: number, w: number): BendaIlustrasi {
  const h = w / trailer.rasio;
  const y = alas - trailer.alasPerSepertiga[2]! * h;
  const x = kanan - w;
  return { varian: varian(trailer.gambar), kotak: { x, y, w, h }, alas, fokus: { x: x + w * 0.5, y, w: w * 0.5, h: alas - y } };
}

/**
 * Pool truk Pak Hendra: halaman beton, pos jaga & gudang (tanpa kendaraan di gambar), truk trailer ringsek diparkir di
 * depan gudang (satu-satunya truk: tidak ada truk ganda). Tokoh berdiri di kanan depan kepala truk (memeriksa ringsek).
 */
export const POOL_AUTO_2: LokasiIlustrasi = {
  ...latar('pool'),
  tokoh: {
    jenis: 'berdiri', cakrawala: 455, mata: 1.7,
    slot: { 1: [{ x: 1500, y: 860 }], 2: [{ x: 1330, y: 850 }, { x: 1530, y: 865 }], 3: [{ x: 300, y: 840 }, { x: 1330, y: 850 }, { x: 1530, y: 865 }] },
  },
  bingkai: { hp: { cx: 1180, cy: 500, lebar: 800 }, lebar: { cx: 900, cy: 470, lebar: 1672 } },
  benda: [trukDi(1420, 650, 985)],
};

/**
 * Bengkel Mitra: tiga bay sudah terisi truk (bagian gambar), papan berdiri kosong di kanan = papan antrean (tulisan kode).
 * Admin berdiri di pelataran, di kiri papan (tidak menutupi tulisan). Foto kerusakan dijepit di bawah tulisan papan.
 */
export const BENGKEL_AUTO_2: LokasiIlustrasi = {
  ...latar('bengkel'),
  tokoh: {
    jenis: 'berdiri', cakrawala: 455, mata: 1.7,
    slot: { 1: [{ x: 1250, y: 900 }], 2: [{ x: 1060, y: 880 }, { x: 1260, y: 905 }], 3: [{ x: 880, y: 870 }, { x: 1060, y: 890 }, { x: 1260, y: 905 }] },
  },
  bingkai: { hp: { cx: 1300, cy: 600, lebar: 800 }, lebar: { cx: 1200, cy: 560, lebar: 1150 } },
  papan: [{
    kotak: { x: 1430, y: 496, w: 190, h: 150 }, latar: null, wajib: true,
    baris: [
      { teks: 'latar.bengkel.antrean', ukuran: 26, warna: '#3b2d20', tebal: 700 },
      { teks: 'latar.bengkel.penuh', ukuran: 44, warna: '#c0392b', tebal: 900 },
    ],
  }],
  objek: { foto: { seni: 'foto.bundel', x: 1470, y: 648, w: 116 } },
};

/**
 * Ruas tol: bahu jalan kiri + lajur menjauh ke kiri atas (gambar). Gantri dua rambu di atas jalan (kode) = SUASANA lokasi.
 * Bukti yang dibaca pemain (rambu terbaca + diagram lajur & posisi truk menurut naskah) ada di lembar bukti babak 8
 * (`dokumen.rambu.skema`), bukan di gambar ini: lajur pada gambar hasil generasi bukan bukti geometri jalan.
 */
export const TOL_AUTO_2: LokasiIlustrasi = {
  ...latar('tol'),
  tokoh: {
    jenis: 'berdiri', cakrawala: 500, mata: 1.5,
    slot: { 1: [{ x: 560, y: 935 }], 2: [{ x: 420, y: 915 }, { x: 650, y: 935 }], 3: [{ x: 300, y: 905 }, { x: 480, y: 925 }, { x: 660, y: 935 }] },
  },
  bingkai: { hp: { cx: 620, cy: 560, lebar: 800 }, lebar: { cx: 640, cy: 520, lebar: 1350 } },
  tiang: [{ x: 196, y: 314, w: 14, h: 236 }, { x: 1048, y: 314, w: 14, h: 238 }, { x: 190, y: 314, w: 878, h: 14 }],
  papan: [
    {
      kotak: { x: 220, y: 330, w: 408, h: 178 }, latar: '#2a6a3f', tepi: '#fffdf6', wajib: true,
      baris: [{ teks: 'latar.tol.rambu1a', ukuran: 36, warna: '#fffdf6', tebal: 800 }, { teks: 'latar.tol.rambu1b', ukuran: 36, warna: '#fffdf6', tebal: 800 }],
    },
    {
      kotak: { x: 638, y: 330, w: 408, h: 178 }, latar: '#1f4f8a', tepi: '#fffdf6', wajib: true,
      baris: [{ teks: 'latar.tol.rambu2a', ukuran: 36, warna: '#fffdf6', tebal: 800 }, { teks: 'latar.tol.rambu2b', ukuran: 36, warna: '#fffdf6', tebal: 800 }],
    },
  ],
};

/** Ruang wawancara: ruang rapat kosong (tanpa meja di gambar); saksi berdiri berjajar di lantai. */
export const WAWANCARA_AUTO_2: LokasiIlustrasi = {
  ...latar('wawancara'),
  tokoh: {
    jenis: 'berdiri', cakrawala: 454, mata: 1.5,
    slot: { 1: [{ x: 830, y: 905 }], 2: [{ x: 650, y: 895 }, { x: 1010, y: 895 }], 3: [{ x: 520, y: 885 }, { x: 830, y: 900 }, { x: 1140, y: 885 }] },
  },
  bingkai: { hp: { cx: 830, cy: 600, lebar: 800 }, lebar: { cx: 836, cy: 470, lebar: 1500 } },
};
