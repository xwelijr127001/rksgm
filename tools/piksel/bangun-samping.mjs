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
/** Tinggi figur badan v2 (px sumber, README: 945) -> 198 piksel seni seperti Pak Hendra. */
const PITCH_BADAN = 945 / 198;
/** id naskah -> sel (baris lalu kolom) + warna celana & sepatu (dari palet sheet badan, dipilih per kostum). */
export const SAMPING = { rudi: { sel: 0 }, bima: { sel: 1 }, darto: { sel: 2 }, admin: { sel: 3 }, tol: { sel: 4 }, polisi: { sel: 5 } };
/**
 * T-017 (D-104): bingkai JALAN per tokoh. Lembar 1024 x 1024 = dua sel 512 x 1024 (kiri kontak, kanan lintas), hadap kanan,
 * grid sama dengan badan v2. `pitch` = px sumber per piksel seni. Rudi: 4,35 (BUKAN 4,444 Designer): pada 4,444 bingkai jalan
 * 194 piksel seni vs berdiri 198, jadi kepala naik 4 piksel seni saat berhenti; pada 4,35 tinggi 198 dan lebar kepala tetap
 * 36/35 (= berdiri 35), tanpa lompatan. Jangkar x = pusat kepala terukur dibulatkan ke bawah (aturan Designer "pusat kepala
 * - 0,5", sama dengan bingkai berdiri: pusat 36,5 -> 36), y = telapak. Wajah terpanggang: tanpa lapisan ekspresi/kedip.
 * Tokoh lain (mis. Hendra, D-105 menunggu owner) cukup ditambah di sini / memanggil bingkaiJalan() dari pembangunnya sendiri.
 */
export const JALAN = { rudi: { berkas: 'rudi-jalan-v1.png', pitch: 4.35 } };
/** Dua bingkai jalan (kontak, lintas) pada skala atlas, dipetakan ke palet yang SUDAH ada (tanpa warna baru). */
export function bingkaiJalan(berkasPng, palet, pitch) {
  const src = L.petakanPalet(L.binerkanAlpha(L.baca(berkasPng)), palet);
  return ['kontak', 'lintas'].map((nama, i) => {
    const img = komponenUtama(sampelIsi(L.potong(src, i * 512, 0, 512, 1024), pitch));
    const k = kepalaDari(img, 22), kotak = L.kotakAlpha(img);
    const pusat = (k.x0 + k.x1 + 1) / 2;
    return { nama, img, kepala: { x: pusat, atas: k.atas, lebar: k.x1 - k.x0 + 1 }, kaki: { x: Math.floor(pusat), y: kotak.y + kotak.h - 1 } };
  });
}
const EKSPRESI_DARI = { netral: 'netral', tersenyum: 'netral', senang: 'netral', lega: 'netral', cemas: 'prihatin', serius: 'prihatin', bingung: 'prihatin', kesal: 'prihatin' };
const sel = (img, i) => L.potong(img, (i % 3) * 512, Math.floor(i / 3) * 512, 512, 512);
const buram = (img, x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.d[L.idx(img, x, y) + 3] >= 128;

/** Kotak mata dari wajah: piksel putih mata (terang, kroma rendah) di paruh atas kotak wajah. */
function kotakMata(muka) {
  let y0 = 99, y1 = -1;
  for (let y = 2; y < Math.min(20, muka.h); y++) for (let x = 0; x < muka.w; x++) {
    const i = L.idx(muka, x, y);
    if (muka.d[i + 3] < 128) continue;
    const [r, g, b] = [muka.d[i], muka.d[i + 1], muka.d[i + 2]];
    if (Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 50) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return y1 < 0 ? { y: 6, h: 6 } : { y: Math.max(0, y0 - 2), h: y1 - y0 + 5 };
}

/**
 * Strip KEDIP (D-96 a): salinan pita mata dengan mata tertutup: piksel mata (putih + iris/pupil gelap di antara baris putih
 * mata) diganti warna kulit kelopak (kulit terbanyak wajah), garis bulu mata gelap di baris bawah mata.
 */
function stripKedip(muka, m) {
  const pita = L.potong(muka, 0, m.y, muka.w, m.h);
  const hit = new Map();
  for (let i = 0; i < muka.w * muka.h; i++) {
    const [r, g, b] = [muka.d[i * 4], muka.d[i * 4 + 1], muka.d[i * 4 + 2]];
    if (muka.d[i * 4 + 3] < 128 || !(r > 150 && r > b + 40 && g > 70)) continue; // kulit: jingga terang
    const k = `${r},${g},${b}`; hit.set(k, (hit.get(k) || 0) + 1);
  }
  const kulit = ([...hit].sort((a, b) => b[1] - a[1])[1] ?? [...hit].sort((a, b) => b[1] - a[1])[0])[0].split(',').map(Number);
  const putih = (x, y) => { const i = L.idx(pita, x, y); return pita.d[i + 3] >= 128 && Math.min(pita.d[i], pita.d[i + 1], pita.d[i + 2]) > 185 && Math.max(pita.d[i], pita.d[i + 1], pita.d[i + 2]) - Math.min(pita.d[i], pita.d[i + 1], pita.d[i + 2]) < 50; };
  // Kolom yang punya putih mata (± 2 kolom: iris di sebelahnya), baris putih mata.
  const kol = new Set(); let r0 = 99, r1 = -1;
  for (let y = 0; y < pita.h; y++) for (let x = 0; x < pita.w; x++) if (putih(x, y)) { for (let d = -2; d <= 2; d++) kol.add(x + d); r0 = Math.min(r0, y); r1 = Math.max(r1, y); }
  if (r1 < 0) return pita;
  const gelap = [38, 22, 18];
  for (const x of kol) {
    if (x < 0 || x >= pita.w) continue;
    for (let y = r0; y <= r1 + 1 && y < pita.h; y++) {
      const i = L.idx(pita, x, y);
      if (pita.d[i + 3] < 128) continue;
      const c = y === r1 ? gelap : kulit;
      pita.d[i] = c[0]; pita.d[i + 1] = c[1]; pita.d[i + 2] = c[2];
    }
  }
  return pita;
}

export function bangunSamping() {
  // D-92: badan PENUH digambar (badan v2, sel 512 x 1024, tapak di y sel 983); kaki prosedural dibuang.
  const badan0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'tokoh-samping-badan-v2.png')));
  const eks0 = L.binerkanAlpha(L.baca(path.join(SUMBER, 'tokoh-samping-ekspresi-v2.png')));
  const warna = new Map();
  for (const img of [badan0, eks0]) for (const [kk, n] of L.hitungWarna(img)) warna.set(kk, (warna.get(kk) || 0) + n);
  const palet = L.kuantisasi([...warna].map(([kk, n]) => ({ c: kk.split(',').map(Number), n })), 62, { kunci: [[22, 14, 16], [38, 22, 18]] });
  const badan = L.petakanPalet(badan0, palet), eks = L.petakanPalet(eks0, palet);
  const hasil = {};
  const laporan = {};
  for (const [id, c] of Object.entries(SAMPING)) {
    const sb = L.potong(badan, (c.sel % 3) * 512, Math.floor(c.sel / 3) * 1024, 512, 1024), se = sel(eks, c.sel);
    const tubuh = komponenUtama(sampelIsi(sb, PITCH_BADAN));
    const kB = kepalaDari(tubuh, 22);
    // Kepala lembar ekspresi (± 1,3x) dinormalkan ke lebar kepala badan v2 yang TERUKUR.
    const wB = lebarKepala(sb, 190) / PITCH_BADAN;
    const pE = lebarKepala(se, 250) / wB;
    const e = komponenUtama(sampelIsi(se, pE));
    const r = registrasi(tubuh, e, 22);
    const wajah = { x: kB.x0 + 8, y: kB.atas + 12, w: Math.max(18, kB.x1 - kB.x0 - 7), h: 30 };
    const potongE = L.potong(e, wajah.x - r.dx, wajah.y - r.dy, wajah.w, wajah.h);
    const potongN = L.potong(tubuh, wajah.x, wajah.y, wajah.w, wajah.h);
    const m = kotakMata(potongN);
    const mata = { x: wajah.x, y: wajah.y + m.y, w: wajah.w, h: m.h };
    hasil[id] = { tubuh, wajah, potongE, potongN, kB, mata, kedipN: stripKedip(potongN, m), kedipE: stripKedip(potongE, m) };
    laporan[id] = { pitchBadan: +PITCH_BADAN.toFixed(3), pitchEkspresi: +pE.toFixed(3), lebarKepala: +wB.toFixed(1), badan: [tubuh.w, tubuh.h], tinggi: tubuh.h, registrasi: r };
  }
  // T-017: bingkai jalan (palet tetap; bagian lama tidak berubah isinya).
  for (const [id, j] of Object.entries(JALAN)) {
    hasil[id].jalan = bingkaiJalan(path.join(SUMBER, j.berkas), palet, j.pitch);
    laporan[id].jalan = { pitch: j.pitch, bingkai: hasil[id].jalan.map((f) => ({ nama: f.nama, ukuran: [f.img.w, f.img.h], lebarKepala: f.kepala.lebar, pusatKepala: f.kepala.x, kaki: f.kaki })) };
  }
  // Atlas.
  const bagian = Object.entries(hasil).flatMap(([id, h]) => [{ id: `${id}-tubuh`, img: h.tubuh }, { id: `${id}-netral`, img: h.potongN }, { id: `${id}-prihatin`, img: h.potongE }, { id: `${id}-kedip-netral`, img: h.kedipN }, { id: `${id}-kedip-prihatin`, img: h.kedipE }, ...(h.jalan ?? []).map((f) => ({ id: `${id}-jalan-${f.nama}`, img: f.img }))]);
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
    // D-100: jangkar = titik tengah di antara KEDUA telapak (12 baris terbawah: sepatu depan sedikit lebih tinggi daripada
    // sepatu belakang, jadi 2 baris terbawah hanya memuat kaki belakang dan figur cermin bergeser ke tetangganya).
    for (let y = h.tubuh.h - 12; y < h.tubuh.h; y++) for (let x = 0; x < h.tubuh.w; x++) if (buram(h.tubuh, x, y)) { a = Math.min(a, x); bb = Math.max(bb, x); }
    // Rentang kedua telapak terukur (a..bb) memuat ujung sepatu depan, jadi titik tengahnya ± 40; jangkar dipasang di TENGAH
    // BADAN (tengah frame, 35-36 = angka Designer 35-37) supaya slot = pusat badan dan cermin simetris.
    const kaki = { x: Math.round(h.tubuh.w / 2), y: k.y + k.h - 1 };
    void a; void bb;
    const kepalaTinggi = h.wajah.y + h.wajah.h - h.kB.atas;
    const kepala = { x: (h.kB.x0 + h.kB.x1 + 1) / 2, y: h.kB.atas + kepalaTinggi / 2 };
    const jendela = (sisi, skala, gy = 0) => ({ frame: 'berdiri-kanan', x: Math.round(kepala.x - sisi / 2), y: Math.round(kepala.y - sisi / 2 + gy), sisi, skala, tampil: sisi * skala });
    const frameJalan = Object.fromEntries((h.jalan ?? []).map((f) => [`jalan-${f.nama}-kanan`, { rect: r(`${id}-jalan-${f.nama}`), hadap: 'kanan', jenisJangkar: 'kaki', jangkar: f.kaki, kaki: f.kaki, kepala: { x: f.kepala.x, y: f.kepala.atas + kepalaTinggi / 2 }, kepalaTinggi }]));
    manifest[id] = {
      versi: 1,
      dibuat: 'tools/piksel/bangun-samping.mjs',
      tokoh: id,
      piksel: 4,
      gambar: 'samping.png',
      ukuranAtlas: [W, H],
      skala: { unitDuniaPerPikselSeni: 4, pxSumberPerPikselSeni: { badan: laporan[id].pitchBadan, ekspresi: laporan[id].pitchEkspresi }, kepala: `lebar kepala ${LEBAR_KEPALA} piksel seni (= Pak Hendra)` },
      ekspresi: ['netral', 'prihatin'],
      varian: ['dasar', 'kedip'],
      ekspresiDari: EKSPRESI_DARI,
      frame: {
        'berdiri-kanan': {
          rect: r(`${id}-tubuh`), hadap: 'kanan', jenisJangkar: 'kaki', jangkar: kaki, kaki, kepala, kepalaTinggi,
          wajah: { kotak: [h.wajah.x, h.wajah.y, h.wajah.w, h.wajah.h], mata: [h.mata.x, h.mata.y, h.mata.w, h.mata.h], mulut: [h.wajah.x + 4, h.wajah.y + 20, 8, 4] },
          ekspresi: { netral: { dasar: r(`${id}-netral`), kedip: r(`${id}-kedip-netral`) }, prihatin: { dasar: r(`${id}-prihatin`), kedip: r(`${id}-kedip-prihatin`) } },
        },
        ...frameJalan,
      },
      pose: { berdiri: { kanan: 'berdiri-kanan', bawaan: 'kanan' }, ...(h.jalan ? { 'jalan-a': { kanan: 'jalan-kontak-kanan', bawaan: 'kanan' }, 'jalan-b': { kanan: 'jalan-lintas-kanan', bawaan: 'kanan' } } : {}) },
      pandang: { lawan: { arah: 'kanan' }, pemain: { arah: 'kanan' }, depan: { arah: 'kanan' }, bawah: {} },
      potret: {
        frame: 'berdiri-kanan',
        jendela: { 32: jendela(32, 1, 2), 44: jendela(44, 1, 4), 52: jendela(52, 1, 6), 64: jendela(64, 1, 8), 96: jendela(48, 2, 4) },
        dekat: { 52: jendela(26, 2, 2), 64: jendela(32, 2, 2), 96: jendela(32, 3, 2) },
      },
      telepon: { frame: 'berdiri-kanan', jendela: jendela(56, 1, 10) },
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
    const kd = L.salin(h.tubuh);
    L.tempel(kd, h.kedipN, h.mata.x, h.mata.y);
    item.push({ label: `${id} kedip`, img: L.datarkan(L.potong(kd, 0, 0, kd.w, 70), [246, 236, 214]) });
    item.push({ label: id, img: L.datarkan(h.tubuh, [246, 236, 214]) }, { label: `${id} prihatin`, img: L.datarkan(t, [246, 236, 214]) });
  }
  L.tulis(path.join(L.ROOT, 'character', 'piksel', 'samping', 'tinjau-samping.png'), L.perbesar(L.susun(item), 2));
  console.log(JSON.stringify({ atlas: [s.atlas.w, s.atlas.h], png, laporan: s.laporan }));
}
