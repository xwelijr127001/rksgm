/**
 * Ruang piksel EPISODE 2 (T-013 Stage 1): kantor layanan klaim (character/kantor-ep2-pixel-v1, D-80), pola bangun-ruang.mjs.
 *
 *   node tools/piksel/bangun-ruang-ep2.mjs
 *
 * Manifest TERPISAH dari ruang.json Episode 1 (seni/piksel/ruang-ep2.json): ruang.json dimuat & dipanaskan seluruhnya
 * oleh panggung Episode 1 (ui/panggung/sumberPiksel.ts), dan IdLokasiAdegan Episode 1 tidak boleh bertambah; jadi Episode 1
 * tidak pernah mengunduh berkas kantor ini, dan Episode 2 tidak mengunduh ruang Episode 1.
 *
 * Langkah: referensi 2720 x 1536 -> 400 x 225 piksel seni (rata-rata AREA, pitch 6,8) -> palet <= 48 warna (OKLab, lib.kuantisasi)
 * -> lapisan menurut kotak yang DIUKUR dari referensi (README Designer memperkirakan meja di y 70-125; gambar nyata: atas meja
 * y 95-112, muka hijau 113-159, alas cokelat 160-169).
 *  - `latar` (z 10, buram): dinding, papan nama KOSONG, poster, jam, laci, meja, lantai. Map kuning DIHAPUS (diisi warna atas
 *    meja) karena map = prop `berkas` yang muncul akibat keputusan.
 *  - `meja` (z 30, alpha): baris meja (atas + muka + alas) + telepon, tempat kartu, tanaman yang berdiri di atasnya: digambar
 *    DI ATAS Miss Raksa (berdiri di balik meja: pinggang ke bawah tertutup) dan DI BAWAH Hendra (berdiri di depan meja).
 *  - prop `map` (map klaim kuning, dari referensi) dan `surat` (lembar surat putih, digambar kode: tidak ada di referensi).
 * Tempat tokoh (satuan dunia): Miss Raksa kaki (560, 756) di balik meja hadap kanan; Hendra kaki (1040, 860) di depan meja
 * hadap kiri; jarak kepala 480 = 120 piksel seni (D-80). Papan nama: teks runtime (`papan.teksKunci`).
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import { tulisPngIndeks } from './miss-lib.mjs';
import { sampel } from './hendra-native.mjs';

const SUMBER = path.join(L.ROOT, 'character', 'kantor-ep2-pixel-v1', 'kantor-ep2-referensi-v1.png');
const KELUAR = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const PW = 400, PH = 225, K = 4;

/** Rata-rata area (sumber buram penuh) ke PW x PH. */
function turunkan(img) {
  const o = L.buat(PW, PH);
  const sx = img.w / PW, sy = img.h / PH;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = Math.floor(y * sy); yy < Math.floor((y + 1) * sy); yy++) for (let xx = Math.floor(x * sx); xx < Math.floor((x + 1) * sx); xx++) {
      const i = L.idx(img, xx, yy); r += img.d[i]; g += img.d[i + 1]; b += img.d[i + 2]; n++;
    }
    const j = L.idx(o, x, y); o.d[j] = Math.round(r / n); o.d[j + 1] = Math.round(g / n); o.d[j + 2] = Math.round(b / n); o.d[j + 3] = 255;
  }
  return o;
}
const warnaDi = (img, x, y) => { const i = L.idx(img, x, y); return [img.d[i], img.d[i + 1], img.d[i + 2]]; };
const isi = (img, k, c) => L.isiKotak(img, k.x, k.y, k.w, k.h, c);

export const KOTAK = {
  atasMeja: 95, // baris pertama atas meja krem
  dasarMeja: 170, // baris pertama lantai di bawah alas
  map: { x: 55, y: 96, w: 37, h: 12 },
  telepon: { x: 134, y: 86, w: 37, h: 22 },
  kartu: { x: 236, y: 91, w: 27, h: 17 },
  tanaman: { x: 360, y: 64, w: 37, h: 44 },
  papan: { x: 78, y: 20, w: 87, h: 18 },
};

export function bangunRuangEp2() {
  const ref = turunkan(L.baca(SUMBER));
  const warna = [...L.hitungWarna(ref)].map(([kk, n]) => ({ c: kk.split(',').map(Number), n }));
  const palet = L.kuantisasi(warna, 48, { eksponen: 0.5 });
  const latar = L.petakanPalet(ref, palet);
  // Map: potong dulu (prop), lalu hapus dari latar dengan warna atas meja di sebelahnya (baris yang sama).
  const mapProp = L.potong(latar, KOTAK.map.x, KOTAK.map.y, KOTAK.map.w, KOTAK.map.h);
  const atas = warnaDi(latar, KOTAK.map.x - 4, KOTAK.atasMeja + 4);
  // Prop map: buang piksel yang sama dengan warna atas meja (sisa latar) -> alpha.
  for (let i = 0; i < mapProp.w * mapProp.h; i++) {
    const c = [mapProp.d[i * 4], mapProp.d[i * 4 + 1], mapProp.d[i * 4 + 2]];
    if (L.jarakOk(L.keOklab(c), L.keOklab(atas)) < 0.06) mapProp.d[i * 4 + 3] = 0;
  }
  L.binerkanAlpha(mapProp);
  for (let y = KOTAK.map.y; y < KOTAK.map.y + KOTAK.map.h; y++) for (let x = KOTAK.map.x; x < KOTAK.map.x + KOTAK.map.w; x++) {
    const c = warnaDi(latar, KOTAK.map.x - 3, y);
    const j = L.idx(latar, x, y); latar.d[j] = c[0]; latar.d[j + 1] = c[1]; latar.d[j + 2] = c[2];
  }
  // Lapisan meja (alpha): baris meja + benda yang berdiri di atasnya.
  const meja = L.buat(PW, PH);
  const salinKotak = (k) => { for (let y = k.y; y < k.y + k.h; y++) latar.d.copy(meja.d, L.idx(meja, k.x, y), L.idx(latar, k.x, y), L.idx(latar, k.x + k.w, y)); };
  salinKotak({ x: 0, y: KOTAK.atasMeja, w: PW, h: KOTAK.dasarMeja - KOTAK.atasMeja });
  // Benda di atas meja: hanya piksel yang BUKAN warna dinding (dinding kayu = warna terbanyak baris tepat di atas meja).
  const dinding = new Set();
  for (let x = 0; x < PW; x++) for (let y = KOTAK.atasMeja - 12; y < KOTAK.atasMeja; y++) {
    if ([KOTAK.telepon, KOTAK.kartu, KOTAK.tanaman].some((k) => x >= k.x - 2 && x < k.x + k.w + 2)) continue;
    dinding.add(warnaDi(latar, x, y).join(','));
  }
  for (const k of [KOTAK.telepon, KOTAK.kartu, KOTAK.tanaman]) for (let y = k.y; y < KOTAK.atasMeja; y++) for (let x = k.x; x < k.x + k.w; x++) {
    const c = warnaDi(latar, x, y);
    if (dinding.has(c.join(','))) continue;
    const j = L.idx(meja, x, y); meja.d[j] = c[0]; meja.d[j + 1] = c[1]; meja.d[j + 2] = c[2]; meja.d[j + 3] = 255;
  }
  const kMeja = L.kotakAlpha(meja);
  const mejaPotong = L.potong(meja, 0, kMeja.y, PW, kMeja.y + kMeja.h - kMeja.y);
  // Surat (kode): lembar putih 14 x 10 dengan garis tulisan & tepi gelap.
  const surat = L.buat(14, 10, [0, 0, 0, 0]);
  const tepi = palet.reduce((a, c) => (L.keOklab(c)[0] < L.keOklab(a)[0] ? c : a));
  const putih = palet.reduce((a, c) => (L.keOklab(c)[0] > L.keOklab(a)[0] ? c : a));
  L.isiKotak(surat, 0, 0, 14, 10, [...tepi, 255]);
  L.isiKotak(surat, 1, 1, 12, 8, [...putih, 255]);
  for (const y of [3, 5, 7]) L.isiKotak(surat, 3, y, y === 7 ? 5 : 8, 1, [...tepi, 255]);
  const kMap = L.kotakAlpha(mapProp);
  const mapRapi = L.potong(mapProp, kMap.x, kMap.y, kMap.w, kMap.h);
  return { latar, meja: mejaPotong, mejaY: kMeja.y, map: mapRapi, mapXY: { x: KOTAK.map.x + kMap.x, y: KOTAK.map.y + kMap.y }, surat, palet };
}

// ------------------------------------------------------------------ Stage 2: ruang lapangan (D-84) + trailer

/** Referensi Stage 2 (1680 x 944, ÷ 4,2): latar saja (tanpa meja/pagar: tokoh berdiri di depan semua isi ruang). */
const RUANG_LAPANGAN = {
  // D-100 (final fix): jangkar tokoh samping kini di tengah kedua telapak; slot digeser + 58 (kanan) / - 58 (kiri) supaya
  // gambar yang disetujui tetap di tempatnya; wawancara 2/3 memakai angka Designer (670/990, 500/830/1160).
  // D-93: hadap per slot (seni menghadap kanan; 'kiri' = cermin di panggung). D-94: slot & fokus pool. D-95: fokus layar lebar.
  bengkel: { sumber: 'bengkel-ep2-pixel-v1/bengkel-ep2-referensi-v1.png', slot: { 1: [[940, 'kiri']], 2: [[758, 'kanan'], [1002, 'kiri']], 3: [[578, 'kanan'], [878, 'kanan'], [1062, 'kiri']] }, kaki: 860 },
  tol: { sumber: 'tol-ep2-pixel-v1/tol-ep2-referensi-v1.png', slot: { 1: [[620, 'kanan']], 2: [[518, 'kanan'], [818, 'kanan']], 3: [[418, 'kanan'], [658, 'kanan'], [898, 'kanan']] }, kaki: 880, fokus: { x: 960, y: 380, w: 300, h: 180 } },
  pool: { sumber: 'pool-ep2-pixel-v1/pool-ep2-referensi-v1.png', slot: { 1: [[420, 'kanan', { hendra: 360 }]], 2: [[218, 'kanan'], [518, 'kanan']], 3: [[178, 'kanan'], [358, 'kanan'], [538, 'kanan']] }, kaki: 860, fokus: { x: 640, y: 240, w: 400, h: 460 } },
  wawancara: { sumber: 'wawancara-ep2-pixel-v1/wawancara-ep2-referensi-v1.png', slot: { 1: [[890, 'kanan']], 2: [[670, 'kanan'], [990, 'kiri']], 3: [[500, 'kanan'], [830, 'kanan'], [1160, 'kiri']] }, kaki: 870 },
};

/** Ruang lapangan: rata-rata area ke 400 x 225, palet <= 48 (OKLab). */
export function bangunLapangan(id) {
  const ref = turunkan(L.baca(path.join(L.ROOT, 'character', RUANG_LAPANGAN[id].sumber)));
  const warna = [...L.hitungWarna(ref)].map(([kk, n]) => ({ c: kk.split(',').map(Number), n }));
  const palet = L.kuantisasi(warna, 48, { eksponen: 0.5 });
  return { latar: L.petakanPalet(ref, palet), palet };
}

/** Trailer RUSAK (baris bawah sheet, hadap kiri): sampel modus pada pitch yang membuat lebarnya 150 piksel seni, palet 32. */
export function bangunTrailer() {
  const sheet = L.binerkanAlpha(L.baca(path.join(L.ROOT, 'character', 'trailer-ep2-pixel-v1', 'trailer-ep2-sheet-v1.png')));
  const bawah = L.potong(sheet, 0, sheet.h / 2, sheet.w, sheet.h / 2);
  const k = L.kotakAlpha(bawah);
  const warna = [...L.hitungWarna(bawah)].map(([kk, n]) => ({ c: kk.split(',').map(Number), n }));
  const palet = L.kuantisasi(warna, 32, { kunci: [[22, 18, 18]] });
  const ber = L.petakanPalet(bawah, palet);
  // D-94: 450 piksel seni lebar (pitch ± 2,95), disampel LANGSUNG dari sheet (bukan lapisan 150 px diperbesar).
  const p = k.w / 450;
  const img = sampel(ber, p, k.x, k.y, 450, Math.ceil(k.h / p));
  const kk = L.kotakAlpha(img);
  // Dipotong di kontainer pada tepi kanan dunia (art x 160 + 240 = 400); kabin utuh.
  return { img: L.potong(img, kk.x, kk.y, Math.min(kk.w, 240), kk.h), pitch: +p.toFixed(3), palet };
}

/** Foto bukti (kode): cetak foto 12 x 9, tepi putih, isi abu kebiruan + oranye kabin. */
function fotoProp(palet) {
  const dekat = (c) => palet.reduce((a, b) => (L.jarakOk(L.keOklab(b), L.keOklab(c)) < L.jarakOk(L.keOklab(a), L.keOklab(c)) ? b : a));
  // D-99: 20 x 15 piksel seni, setinggi mata di kiri admin.
  const f = L.buat(20, 15);
  L.isiKotak(f, 0, 0, 20, 15, [...dekat([40, 30, 30]), 255]);
  L.isiKotak(f, 1, 1, 18, 13, [...dekat([245, 240, 230]), 255]);
  L.isiKotak(f, 3, 3, 14, 9, [...dekat([120, 140, 150]), 255]);
  L.isiKotak(f, 3, 9, 14, 3, [...dekat([90, 90, 90]), 255]);
  L.isiKotak(f, 5, 6, 6, 5, [...dekat([200, 90, 40]), 255]);
  L.isiKotak(f, 11, 5, 6, 5, [...dekat([150, 150, 150]), 255]);
  return f;
}

const sering = (img) => L.hex([...L.hitungWarna(img)].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number));

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const r = bangunRuangEp2();
  const hasil = [];
  const tulis = (nama, img, urut) => { const x = { nama, ...tulisPngIndeks(path.join(KELUAR, nama), img, urut) }; hasil.push(x); return x; };
  tulis('ep2-ruang-kantor-latar.png', r.latar, r.palet);
  tulis('ep2-ruang-kantor-meja.png', r.meja, r.palet);
  tulis('ep2-ruang-prop-map.png', r.map, r.palet);
  tulis('ep2-ruang-prop-surat.png', r.surat, r.palet);
  const lap = (id, berkas, x, y, img, z, alpha) => ({ id, berkas, x: x * K, y: y * K, w: img.w * K, h: img.h * K, pw: img.w, ph: img.h, z, alpha });
  const prop = (berkas, x, y, img, z = 35) => ({ berkas, x: x * K, y: y * K, w: img.w * K, h: img.h * K, pw: img.w, ph: img.h, z });
  // Elemen ke-3 (opsional) = x khusus per tokoh: { hendra: 360 } (D-100: jangkar Hendra sudah di tengah, jadi ia TIDAK ikut digeser).
const slotDari = (slot, kaki) => Object.fromEntries(Object.entries(slot).map(([n, xs]) => [n, xs.map(([x, hadap, xTokoh]) => ({ x, y: kaki, hadap, ...(xTokoh ? { xTokoh } : {}) }))]));
  const lokasi = {
    'kantor-ep2': {
      warnaTepi: sering(r.latar),
      lapisan: [lap('latar', 'ep2-ruang-kantor-latar.png', 0, 0, r.latar, 10, false), lap('meja', 'ep2-ruang-kantor-meja.png', 0, r.mejaY, r.meja, 30, true)],
      papan: { kotak: { x: KOTAK.papan.x * K, y: KOTAK.papan.y * K, w: KOTAK.papan.w * K, h: KOTAK.papan.h * K }, teksKunci: 'lokasi.kantor', warna: '#f3ead2' },
      // D-87: papan nama TERUKUR art px 78-165 (bukan 57-121 perkiraan README), jadi Miss Raksa di x 800 (kepala ± art px 182-218),
      // papan utuh di kirinya; slot pengunjung digeser ke 1120 (jarak 80 art px, sama dengan saran D-87).
      tempat: { balikMeja: { x: 800, y: 756 } },
      // Pengunjung berdiri di DEPAN meja (Hendra, Pak Bima K07).
      // D-93: pengunjung menghadap KIRI (ke meja & Miss Raksa); slot 1 di x 1040.
      // D-135 (T-019): Hendra (tiga akhir, berdiri di samping Miss Raksa) di x 1040 supaya tidak menutupi lengannya; Pak Bima
      // K07 tetap 980. y slot tetap 860.
      slot: slotDari({ 1: [[980, 'kiri', { hendra: 1040 }]], 2: [[980, 'kiri'], [1242, 'kiri']], 3: [[980, 'kiri'], [1182, 'kiri'], [1382, 'kiri']] }, 860),
      prop: { map: prop('ep2-ruang-prop-map.png', r.mapXY.x, r.mapXY.y, r.map), surat: prop('ep2-ruang-prop-surat.png', 196, 98, r.surat) },
      bingkai: { hp: { x: 300, y: 0, w: 1100, h: 900 }, lebar: { x: 0, y: 0, w: 1600, h: 900 } },
    },
  };
  for (const id of Object.keys(RUANG_LAPANGAN)) {
    const c = RUANG_LAPANGAN[id];
    const b = bangunLapangan(id);
    const berkas = `ep2-ruang-${id}-latar.png`;
    tulis(berkas, b.latar, b.palet);
    const L1 = { warnaTepi: sering(b.latar), lapisan: [lap('latar', berkas, 0, 0, b.latar, 10, false)], tempat: {}, slot: slotDari(c.slot, c.kaki), prop: {}, bingkai: { hp: { x: 300, y: 0, w: 1000, h: 900 }, lebar: { x: 0, y: 0, w: 1600, h: 900 } } };
    if (c.fokus) L1.fokus = c.fokus;
    // D-95: layar lebar memperlihatkan ruangnya (perbesaran maks 1,15 di PanggungPiksel).
    if (id === 'pool') {
      const t = bangunTrailer();
      tulis('ep2-ruang-pool-trailer.png', t.img, t.palet);
      // Prop trailer rusak SELALU tampak di pool (D-84): lapisan z 25 (di belakang tokoh, di depan kerb), roda menapak y 170.
      L1.lapisan.push({ ...lap('trailer', 'ep2-ruang-pool-trailer.png', 160, 172 - t.img.h, t.img, 25, true), pitch: t.pitch });
    }
    if (id === 'bengkel') {
      const f = fotoProp(b.palet);
      tulis('ep2-ruang-prop-foto.png', f, b.palet);
      L1.prop.foto = prop('ep2-ruang-prop-foto.png', 196, 40, f);
    }
    lokasi[`${id}-ep2`] = L1;
    L.tulis(path.join(L.ROOT, 'character', 'piksel', 'kantor-ep2', `tinjau-${id}.png`), L.perbesar(b.latar, 2));
  }
  const manifest = { versi: 2, dibuat: 'tools/piksel/bangun-ruang-ep2.mjs', piksel: K, dunia: { w: PW * K, h: PH * K, pw: PW, ph: PH }, warnaTepi: lokasi['kantor-ep2'].warnaTepi, lokasi };
  fs.writeFileSync(path.join(KELUAR, 'ruang-ep2.json'), JSON.stringify(manifest, null, 1) + '\n');
  console.log(JSON.stringify(hasil.map((x) => [x.nama, x.byte, x.warna])));
}
