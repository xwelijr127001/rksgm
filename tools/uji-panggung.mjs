/**
 * UJI BROWSER PANGGUNG CERITA v3 (docs/cerita/ADEGAN-AUTO1.md bagian 4): gerak panggung, interupsinya, dan
 * "tanpa badan ganda" pada episode AUTO-1. Pelengkap tools/uji-cerita.mjs (alur cerita) dan tes unit
 * client/src/cerita/ui/panggung/*.test.ts (rencana murni).
 *
 *   npm install --no-save puppeteer-core
 *   npm run build && npm start              # server di http://127.0.0.1:4000 (ubah lewat UI_BASE, mis. Vite dev)
 *   node tools/uji-panggung.mjs             # semua uji; "node tools/uji-panggung.mjs hantu,aksi" = uji tertentu
 *
 * Env: UI_BASE (bawaan http://127.0.0.1:4000), RAKSA_CHROME (chrome.exe), RAKSA_SHOTS (folder tangkapan; kosong =
 *      tanpa tangkapan). Gerak AKTIF kecuali di uji `ringan`.
 * State cerita dihitung MESIN sungguhan lewat tsx (client/src/cerita/mesin.ts + episode + uji/jalurEpisode.ts), bukan
 * fixture beku, jadi tetap cocok bila naskah berubah (id node/baris tetap). Galat konsol WebSocket / socket.io / API
 * tidak dihitung (server permainan tidak diperlukan; mode cerita sepenuhnya di klien).
 *
 * Uji (nama = filter):
 *  pembuka  mulai baru: pembuka berjalan & "Lewati pembuka" (>= 44 px) tampil sejak bingkai pertama; lewati di awal =
 *           komposisi akhir tanpa aktor sementara, state cerita TIDAK ditulis, kalimat tetap mengetik; muat ulang =
 *           tanpa pembuka lagi.
 *  lewati   lewati di tengah kedatangan: komposisi akhir (keduanya duduk, tepat satu Bu Rina), state sama.
 *  tempatlewati  (v5.1) "Lewati pembuka" di LUAR gambar: di baris kaki kotak dialog (sebelum Lanjut dalam urutan Tab),
 *           tidak bersinggungan dengan kotak panggung, >= 44 x 44; selama pembuka & kedatangan kotak dialog, baris kaki,
 *           dan Lanjut tidak bergeser saat tombol muncul/hilang (juga dengan petunjuk pertama kali), Lanjut tetap di
 *           layar; 360 x 740, 390 x 844, 1440 x 900, 844 x 390. Ketuk GANDA pada tombol (ketukan kedua jatuh ke baris
 *           kaki sesudah tombol hilang) dan ketukan yang meleset tipis di sel tombol TIDAK memajukan cerita.
 *  lanjut   6 ketukan Lanjut cepat = tepat 3 kali maju (Lanjut saat bergerak = gerak selesai lalu Lanjut sekali).
 *  enter    Enter ditahan (autorepeat) = satu aksi.
 *  bahasa   ganti bahasa saat bergerak: gerak tidak diulang / tidak berhenti; label suasana ikut bahasa.
 *  ukuran   lebar berubah = gerak selesai + bingkai HP; tinggi saja berubah sedikit (HP pendek, panggung dibatasi
 *           dvh: bilah alamat) = gerak TIDAK selesai, kamera dipaskan ulang, lalu selesai normal (diulang maks. 3x bila
 *           HMR Vite me-remount panggung di tengah gerak); tinggi berubah banyak = selesai.
 *           HMR Vite (suntingan berkas di server dev bersama) dicatat per halaman sebagai INFO.
 *  dialog   Bantuan & Riwayat dibuka saat bergerak: gerak selesai; ditutup: tidak diputar ulang, state sama.
 *  tab      tab tersembunyi: aksi selesai, napas/kedip/mulut dijeda, tidak ada kedip terjadwal; kembali: tanpa putar ulang,
 *           napas lanjut (tokoh SVG) atau kedip terjadwal lagi (tokoh piksel: tanpa napas).
 *  muat     muat ulang di tengah kedatangan: tepat satu Bu Rina, pose akhir benar, tanpa putar ulang.
 *  bab      jalur "pergi": aksi pergi diputar, kartu akhir tanpa panggung, ulang bab dari pemilih = dialog tanpa gerak sisa.
 *  ringan   gerak dikurangi & mode ringan (localStorage raksa:adegan / ?adegan=ringan): tanpa pembuka, 0 animasi,
 *           komposisi akhir langsung; ?adegan=ringan disimpan ke localStorage (juga dari profil BARU yang dialihkan
 *           ke /kenalan); ?adegan=penuh menghapusnya (gerak kembali).
 *  aset     atlas PNG SATU tokoh gagal dimuat (permintaan gambar diblokir; 1440 & 390, juga epilog telepon) -> KEDUA
 *           tokoh siluet netral + nama sebagai teks (tanpa seni SVG v3 / piksel campur), potret sisipan telepon siluet,
 *           cerita tetap maju. Generator tokoh melempar -> pengganti + nama sebagai teks; hasil null (= gagal di
 *           seni/tokoh) -> siluet + nama (atau kotak polos), cerita tetap jalan (bagian generator butuh Vite dev: modul
 *           sumber diimpor langsung; build produksi = DILEWATI dengan catatan).
 *  bocor    banyak baris & pilihan: animasi, pendengar window/document, dan elemen panggung tidak menumpuk.
 *  hantu    bingkai-demi-bingkai (animasi dijeda, currentTime tiap 20 md) untuk kedatangan, kepergian, kartu, telepon,
 *           pindah lokasi, dan ganti antarbaris, di 1440x900 & 390x844: tidak pernah dua badan tokoh yang sama
 *           sama-sama > 25 % terlihat (dunia utama + salinan adegan).
 *  aksi     kartu (larut lokasi dulu, lalu kartu melengkung & menunjuk), telepon (Miss Raksa pose telepon, satu
 *           pesawat telepon tanpa gagang ganda, sisipan panggilan dengan aturan potret menurut ukuran), pergi
 *           (berjalan hadap kanan tanpa cermin CSS), di 1440x900 & 390x844: aksi berjalan lalu komposisi akhir tanpa
 *           aktor sisa.
 *  panas    respons ketukan yang MEMULAI kedatangan (aturan <= 200 md): 390x844, sesudah pemain membaca baris 1,5 dtk
 *           (cache seni dipanaskan saat idle). Respons = event.timeStamp pointerdown sampai kerja main thread bingkai
 *           pertama yang memuat perubahan selesai (rAF yang melihat perubahan + MessageChannel; definisi agen kinerja,
 *           batas bawah tanpa GPU/layar); median 3 kali <= 200 md. Build produksi: CPU diperlambat 4x (profil HP);
 *           Vite dev (React dev): tanpa perlambatan.
 *  piksel   RUANG PIKSEL UJI (fixture sintetis di bawah, BUKAN seni; atau seni/piksel/ruang.json bila ada): kamera diam
 *           piksel bulat (skala x 4 x dpr bulat, terjemahan di piksel perangkat) pada 1440x900, 1920x1080, 390x844,
 *           360x740, 844x390 (DPR 2) + 1440x900 DPR 1,25 & 1,5 (CDP deviceScaleFactor); tangkapan layar dibaca per
 *           baris/kolom: panjang deret warna papan catur = k piksel perangkat. DPR berubah di halaman yang sama =
 *           k dihitung ulang. PNG ditunda: dialog tampil segera, dunia polos lalu muncul sekali. PNG gagal (404) =
 *           ruang SVG, cerita tetap maju.
 *  tokohpiksel  TOKOH RASTER UJI (fixture sintetis, BUKAN seni; untuk jalur penyusun tokoh piksel berikutnya): penggambar
 *           tokoh diganti (pasangGenerator, Vite dev) dengan gambar raster + tempelan wajah/mata/mulut + kotak di atas
 *           meja. Diperiksa: skala 1 & sudut di kisi piksel seni, tanpa napas, salinan dasar/kedip/bicara raster
 *           (tempelan berbeda), tangan di atas meja = gambar sama dipotong (clip-path), kedip & mulut berjalan.
 *  heap     ± 150 langkah maju termasuk ulang bab (panggung dipasang ulang 10+ kali): panggung TIDAK PERNAH meminta
 *           gambar tokoh dengan id per pemasangan (awalan 'pg…'): cache generator LRU berkunci id, jadi id per
 *           pemasangan = entri baru tiap pasang ulang sampai batas cache (heap ± +11 MB). Butuh Vite dev (generator
 *           dibungkus pencatat lewat modul sumber); build produksi = pemeriksaan id DILEWATI. Heap JS sesudah GC
 *           (langkah 40 -> akhir) selalu dilaporkan sebagai INFO.
 *  tokohasli  TOKOH PIKSEL ASLI (atlas + manifest seni/piksel lewat penyusun): di 1440x900, 1920x1080, 390x844@2,
 *           360x740@2, 844x390@2 x 5 momen (awal, datang, kartu, parkir, telepon) kedua tokoh raster skala 1, piksel
 *           perangkat per piksel seni = k kamera (bulat) & salinan di kisi perangkat; kartu: ujung telunjuk di landasan
 *           kartu (dunia) & di atas kartu yang tampil (layar); telepon: satu gagang (frame telepon-*), pesawat meja PNG
 *           tanpa gagang. Kedip/mulut: salinan diklon, kotak & lapisan wajah sama dengan dasar, selisih piksel tangkapan
 *           layar hanya di lapisan mata/mulut (kepala tidak bergeser). Baris istilah selama diketik + muat ulang 2x di
 *           tengah ketikan dengan profil baru (skenario 'CadanganIstilah is not defined'): tanpa galat & halaman gagal.
 *  kamera   KEDATANGAN v5 (ruang & tokoh piksel asli, gerak penuh) di 390x844@2, 360x740@2, 844x390@2, 390x844@3,
 *           1440x900: transform kamera tiap bingkai: k tidak pernah di bawah k percakapan (tidak menjauh ke seluruh
 *           ruangan), skala tidak naik lagi (tanpa dekat-jauh-dekat), sebagian pintu tampak; desktop tanpa zoom.
 * RAKSA_PIKSEL=1: SEMUA uji memakai ruang piksel uji (regresi alur dengan lapisan raster).
 * Keluar kode 1 bila ada GAGAL.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const BASE = (process.env.UI_BASE || 'http://127.0.0.1:4000').replace(/\/+$/, '');
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.env.RAKSA_SHOTS ? path.resolve(process.env.RAKSA_SHOTS) : null;
const SEMUA_UJI = ['pembuka', 'lewati', 'tempatlewati', 'lanjut', 'enter', 'bahasa', 'ukuran', 'dialog', 'tab', 'muat', 'bab', 'ringan', 'aset', 'bocor', 'hantu', 'aksi', 'panas', 'heap', 'kedip', 'fokus', 'tombol', 'hub', 'piksel', 'tokohpiksel', 'tokohasli', 'kamera'];
const HANYA = process.argv[2] ? process.argv[2].split(',').map((s) => s.trim()).filter(Boolean) : SEMUA_UJI;
const AKAR = path.resolve(import.meta.dirname, '..');
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const EP = 'auto-1';
const HALAMAN = '/cerita/' + EP;
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 1, skin: 2, hair: 2, color: 2, accessory: 'topi' } });
const D1440 = { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
const H390 = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const H360P = { width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const GALAT_ABAIKAN = /WebSocket|socket\.io|Failed to load resource|ERR_CONNECTION|net::ERR|\/api\//;
/** Pesan klien Vite saat modul diganti (HMR) atau halaman dimuat ulang karena suntingan berkas di server dev. */
const HMR = /\[vite\] (hot updated|page reload|invalidate)/;

// ------------------------------------------------------------------ state dari mesin (tsx)

const req = createRequire(path.join(AKAR, 'package.json'));
const tsx = await import(pathToFileURL(req.resolve('tsx/esm/api')).href);
const impor = (rel) => tsx.tsImport(pathToFileURL(path.join(AKAR, rel)).href, { parentURL: import.meta.url, tsconfig: path.join(AKAR, 'client/tsconfig.json') });
const jalurEp = await impor('client/src/cerita/uji/jalurEpisode.ts');
const { EPISODE_AUTO_1 } = await impor('client/src/cerita/episode/auto-1/episode.ts');
const { adeganKini } = await impor('client/src/cerita/ui/adegan.ts');
const BUKTI = jalurEp.jawab('b3-bukti', { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] });
const POLIS = jalurEp.jawab('b4-polis', { penjelasan: 'bisa-dinilai' });
const JALUR = {
  terbaik: ['b1-datang/dengar', 'b2-saran/dokumentasi', BUKTI, POLIS, 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  janji: ['b1-datang/dengar', 'b2-saran/dokumentasi', BUKTI, POLIS, 'b5-keberatan/janjikan', 'b5-tutup/rangkum'],
  pergi: ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan'],
};
const JEJAK = Object.fromEntries(Object.entries(JALUR).map(([k, l]) => {
  const h = jalurEp.mainkanJalur(EPISODE_AUTO_1, l);
  return [k, [h.awal, ...h.jejak]];
}));
const salin = (x) => JSON.parse(JSON.stringify(x));
/** State SEBELUM baris ke-n yang membawa aksi panggung `jenis` di jalur k (Lanjut berikutnya = baris bercue). */
function sebelumAksi(k, jenis, n = 0) {
  const j = JEJAK[k];
  let c = 0;
  for (let i = 1; i < j.length; i++) {
    if (adeganKini(EPISODE_AUTO_1, j[i]).aksi?.jenis === jenis && c++ === n) return salin(j[i - 1]);
  }
  throw new Error(`aksi ${jenis} #${n} tidak ada di jalur ${k}`);
}
/** State pada node#baris di jalur k. */
function stateDi(k, node, baris) {
  const s = JEJAK[k].find((x) => x.node === node && x.baris === baris);
  if (!s) throw new Error(`state ${k} ${node}#${baris} tidak ada`);
  return salin(s);
}
const ST = {
  awal: salin(JEJAK.terbaik[0]),
  datang: stateDi('terbaik', 'b1-datang', 1),
  kartu: sebelumAksi('terbaik', 'kartu'),
  pindah: sebelumAksi('terbaik', 'pindah', 0),
  telepon: sebelumAksi('janji', 'pindah', 1),
  pergi: sebelumAksi('pergi', 'pergi'),
};

// ------------------------------------------------------------------ ruang piksel UJI (fixture, bukan seni)

/**
 * Ruang piksel SINTETIS untuk menguji jalur raster panggung tanpa menunggu seni ruang: bidang warna polos pada
 * kotak geometri ruang SVG (dinding, lantai, papan, pintu, meja, kursi) + pita PAPAN CATUR 1 piksel seni (4 baris
 * di dinding, y dunia 400-416) untuk mengukur panjang deret piksel di tangkapan layar. Disajikan lewat intersepsi
 * permintaan (/__uji-piksel/*) dan localStorage raksa:uji:ruang-piksel (kait uji Vite dev di sumberPiksel.ts).
 */
const PIKSEL_SEMUA = process.env.RAKSA_PIKSEL === '1';
const { PNG } = req('pngjs');
const { ruangAdegan } = await impor('client/src/cerita/seni/ruang/index.ts');
const WARNA_A = [255, 244, 214];
const WARNA_B = [106, 58, 26];
const PITA = { y0: 100, baris: 4 };
function buatRuangUji() {
  const r = ruangAdegan('meja');
  const g = (v) => Math.round(v / 4);
  const kotakP = (k) => { const x0 = Math.floor(k.x / 4), y0 = Math.floor(k.y / 4); return { x: x0, y: y0, w: Math.ceil((k.x + k.w) / 4) - x0, h: Math.ceil((k.y + k.h) / 4) - y0 }; };
  const lap = { latar: { x: 0, y: 0, w: 400, h: 225 } };
  const b = r.pintu?.bukaan;
  if (b) { lap.koridor = kotakP(b); lap.daun = kotakP(b); }
  for (const [n, l] of [['belakangMeja', r.belakangMeja], ['depanMeja', r.depanMeja], ['kursiBelakang', r.kursi?.belakang]]) if (l) lap[n] = kotakP(l);
  // Atlas: latar di atas, lapisan lain bertumpuk di bawahnya (lebar maks 400).
  let y = 225;
  const tempat = {};
  for (const [n, k] of Object.entries(lap)) { if (n === 'latar') { tempat[n] = [0, 0]; continue; } tempat[n] = [0, y]; y += k.h; }
  const W = 400, H = y;
  const png = new PNG({ width: W, height: H });
  png.data.fill(0);
  const isi = (x0, y0, w, h, rgb, a = 255) => {
    for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const i = (yy * W + xx) * 4; png.data[i] = rgb[0]; png.data[i + 1] = rgb[1]; png.data[i + 2] = rgb[2]; png.data[i + 3] = a;
    }
  };
  const bidang = (ox, oy, w, h, rgb, tepi) => { isi(ox, oy, w, h, tepi); isi(ox + 1, oy + 1, w - 2, h - 2, rgb); };
  // latar: dinding + lantai + papan + pita papan catur
  const lantai = g(r.tempat?.nasabahBerdiri ? 600 : 600);
  isi(0, 0, 400, lantai, [227, 179, 92]);
  isi(0, lantai, 400, 225 - lantai, [176, 122, 72]);
  isi(0, lantai, 400, 1, [120, 78, 44]);
  if (r.papanNama) { const k = kotakP(r.papanNama); bidang(k.x - 4, k.y - 4, k.w + 8, k.h + 8, [90, 58, 34], [58, 38, 32]); }
  for (let yy = 0; yy < PITA.baris; yy++) for (let xx = 0; xx < 400; xx++) isi(xx, PITA.y0 + yy, 1, 1, (xx + yy) % 2 ? WARNA_B : WARNA_A);
  const warna = { koridor: [244, 239, 224], daun: [138, 90, 52], belakangMeja: [200, 149, 90], depanMeja: [168, 112, 62], kursiBelakang: [201, 138, 138] };
  for (const [n, k] of Object.entries(lap)) if (n !== 'latar') bidang(tempat[n][0], tempat[n][1], k.w, k.h, warna[n], [58, 38, 32]);
  const L = (n) => ({ gambar: 'ruang', sumber: [tempat[n][0], tempat[n][1], lap[n].w, lap[n].h], piksel: [lap[n].x, lap[n].y] });
  const lok = {
    latar: { gambar: 'ruang', sumber: [0, 0, 400, 225], dunia: [0, 0] },
    ...(lap.koridor ? { koridor: L('koridor'), pintu: { daun: L('daun'), engsel: [lap.daun.x * 4, (lap.daun.y + lap.daun.h / 2) * 4], bukaan: [lap.daun.x * 4, lap.daun.y * 4, lap.daun.w * 4, lap.daun.h * 4] } } : {}),
    ...(lap.belakangMeja ? { belakangMeja: L('belakangMeja') } : {}),
    ...(lap.depanMeja ? { depanMeja: L('depanMeja') } : {}),
    ...(lap.kursiBelakang ? { kursi: { belakang: L('kursiBelakang') } } : {}),
  };
  return {
    json: { satuan: 4, warnaTepi: '#e3b35c', catatan: 'FIXTURE UJI tools/uji-panggung.mjs, bukan seni', gambar: { ruang: { berkas: 'ruang.png', w: W, h: H } }, lokasi: { meja: lok, telepon: lok } },
    png: PNG.sync.write(png, { colorType: 6 }),
  };
}
const RUANG_UJI = buatRuangUji();

/**
 * Atlas TOKOH UJI 64 x 96 piksel seni (fixture, bukan seni): tubuh 40 x 60 di (0,0), wajah 12 x 12 di (40,0), mata
 * tertutup 12 x 4 di (40,12), mulut terbuka 6 x 3 di (40,16). Warna mencolok supaya mudah dikenali di tangkapan layar.
 */
function buatTokohUji() {
  const png = new PNG({ width: 64, height: 96 });
  png.data.fill(0);
  const isi = (x0, y0, w, h, rgb) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const i = (y * 64 + x) * 4; png.data[i] = rgb[0]; png.data[i + 1] = rgb[1]; png.data[i + 2] = rgb[2]; png.data[i + 3] = 255;
    }
  };
  isi(0, 0, 40, 60, [40, 30, 20]); isi(1, 1, 38, 58, [70, 120, 170]); isi(12, 2, 16, 16, [230, 190, 150]);
  isi(40, 0, 12, 12, [240, 200, 160]); isi(42, 4, 3, 2, [30, 30, 30]); isi(47, 4, 3, 2, [30, 30, 30]); isi(44, 9, 4, 1, [150, 60, 60]);
  isi(40, 12, 12, 4, [240, 200, 160]); isi(42, 14, 3, 1, [30, 30, 30]); isi(47, 14, 3, 1, [30, 30, 30]);
  isi(40, 16, 6, 3, [120, 30, 30]);
  return PNG.sync.write(png, { colorType: 6 });
}
const TOKOH_UJI = buatTokohUji();

/** Sajikan ruang piksel uji ke halaman (sebelum navigasi). `gagal` = PNG 404; `tunda` = PNG ditahan (md). */
async function pasangRuangUji(p, { gagal = false, tunda = 0 } = {}) {
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    const u = r.url();
    if (r.isInterceptResolutionHandled?.()) return;
    if (!u.includes('/__uji-piksel/')) { r.continue(); return; }
    if (u.endsWith('/ruang.json')) { r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(RUANG_UJI.json) }); return; }
    if (u.endsWith('/tokoh.png')) { r.respond({ status: 200, contentType: 'image/png', body: TOKOH_UJI }); return; }
    if (u.endsWith('/ruang.png')) {
      const kirim = () => (gagal ? r.respond({ status: 404, contentType: 'text/plain', body: 'tidak ada' }) : r.respond({ status: 200, contentType: 'image/png', body: RUANG_UJI.png }));
      if (tunda) setTimeout(kirim, tunda); else kirim();
      return;
    }
    r.respond({ status: 404, contentType: 'text/plain', body: 'tidak ada' });
  });
}

// ------------------------------------------------------------------ hasil

let grup = '';
const hasil = [];
function cek(ok, label, data) {
  hasil.push({ grup, ok: !!ok, label, ...(ok || data === undefined ? {} : { data }) });
  console.log(`${ok ? 'OK   ' : 'GAGAL'} [${grup}] ${label}${!ok && data !== undefined ? ' -> ' + JSON.stringify(data).slice(0, 400) : ''}`);
  return !!ok;
}
const catat = (teks) => console.log(`INFO  [${grup}] ${teks}`);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ peramban

const peramban = await puppeteer.launch({
  executablePath: CHROME, headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/**
 * Halaman baru (konteks terpisah = penyimpanan bersih). `state` = progres tersimpan (null = mulai baru); `pembuka`
 * false = pembuka ditandai sudah diputar di tab ini; `gerak` 'kurang' = prefers-reduced-motion; `ringan` = mode ringan.
 * Sebelum dokumen: penahan timer (window.__tahan: timer >= 400 md ditahan selama langkah bingkai) dan penghitung
 * pendengar window/document.
 */
async function halaman({ vp = D1440, state = null, pembuka = true, gerak = 'penuh', ringan = false, kueri = '', piksel = PIKSEL_SEMUA, pikselGagal = false, pikselTunda = 0, blokirGambar = null, petunjukBaru = false } = {}) {
  const ctx = await peramban.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(vp);
  // Permintaan GAMBAR yang cocok digagalkan (atlas tokoh gagal dimuat). Hanya jenis 'image': di Vite dev modul `?url`
  // untuk berkas yang sama adalah skrip, dan menggagalkannya mematahkan rute (bukan skenario produksi).
  if (blokirGambar) {
    await p.setRequestInterception(true);
    p.on('request', (r) => {
      if (r.isInterceptResolutionHandled?.()) return;
      if (r.resourceType() === 'image' && blokirGambar.test(r.url())) { r.abort('failed'); return; }
      if (!piksel) r.continue();
    });
  }
  if (piksel) await pasangRuangUji(p, { gagal: pikselGagal, tunda: pikselTunda });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: gerak === 'penuh' ? 'no-preference' : 'reduce' }]);
  p.galat = [];
  // Pembaruan HMR Vite (berkas lain disunting di server dev bersama) me-remount panggung: gerak yang sedang berjalan
  // selesai ke komposisi akhir (perilaku benar untuk pasang ulang). Dicatat supaya uji gerak bisa mengulang, bukan flake.
  p.hmr = 0;
  p.on('pageerror', (e) => p.galat.push(String(e).slice(0, 240)));
  p.on('console', (m) => {
    if (HMR.test(m.text())) p.hmr++;
    if (m.type() === 'error' && !GALAT_ABAIKAN.test(m.text())) p.galat.push('konsol: ' + m.text().slice(0, 240));
  });
  await p.evaluateOnNewDocument(() => {
    const asli = window.setTimeout.bind(window);
    window.__tahan = false;
    window.__ditahan = [];
    window.setTimeout = (fn, ms, ...a) => {
      if (window.__tahan && ms >= 400 && ms < 20000) { window.__ditahan.push(fn); return -1; }
      return asli(fn, ms, ...a);
    };
    const n = { window: 0, document: 0 };
    window.__pendengar = n;
    const tambah = EventTarget.prototype.addEventListener;
    const lepas = EventTarget.prototype.removeEventListener;
    const jenis = (t) => (t === window ? 'window' : t === document ? 'document' : null);
    EventTarget.prototype.addEventListener = function (...a) { const j = jenis(this); if (j) n[j]++; return tambah.apply(this, a); };
    EventTarget.prototype.removeEventListener = function (...a) { const j = jenis(this); if (j) n[j]--; return lepas.apply(this, a); };
  });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate((st, profil, pb, g, r, px, pj) => {
    localStorage.clear();
    sessionStorage.clear();
    if (px) localStorage.setItem('raksa:uji:ruang-piksel', '/__uji-piksel/ruang.json');
    localStorage.setItem('raksa:profil', profil);
    if (!pj) localStorage.setItem('raksa:cerita:petunjuk', '1');
    if (g === 'penuh') localStorage.setItem('raksa:gerak', 'penuh');
    if (r) localStorage.setItem('raksa:adegan', 'ringan');
    if (!pb) sessionStorage.setItem('raksa:cerita:pembuka:auto-1', '1');
    if (st) localStorage.setItem('raksa:cerita', JSON.stringify({ format: 1, episode: { 'auto-1': { versi: 1, state: st, disimpan: 0 } }, akhir: {}, arsip: [] }));
  }, state, PROFIL, pembuka, gerak, ringan, piksel, petunjukBaru);
  await p.goto(BASE + HALAMAN + kueri, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.cer-panggung', { timeout: 30000 });
  return p;
}
async function tutup(p) {
  if (p.hmr) catat(`HMR Vite ${p.hmr}x selama halaman ini (berkas disunting di server dev bersama): panggung bisa dipasang ulang`);
  cek(p.galat.length === 0, 'tanpa galat halaman / konsol', p.galat);
  await p.browserContext().close();
}
async function tangkap(p, nama) {
  if (!OUT) return;
  await p.screenshot({ path: path.join(OUT, `${grup}-${nama}.png`), captureBeyondViewport: false });
}

/** Ringkasan keadaan halaman + panggung. */
const info = (p) => p.evaluate(() => {
  let st = null;
  try { st = JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state ?? null; } catch { /* abaikan */ }
  const pg = document.querySelector('.cer-panggung');
  const op = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).opacity : null; };
  return {
    node: document.querySelector('.cer-main')?.getAttribute('data-node') ?? null,
    tampilan: document.querySelector('.cer-main')?.getAttribute('data-tampilan') ?? null,
    simpan: st ? { node: st.node, baris: st.baris, langkah: st.langkah } : null,
    gerak: pg?.getAttribute('data-gerak') ?? null,
    lokasi: pg?.getAttribute('data-lokasi') ?? null,
    lewati: !!document.querySelector('.cer-pg-lewati'),
    xAktor: document.querySelectorAll('[data-aktor^="x:"]').length,
    anim: document.getAnimations().length,
    animAksi: document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity && Number(a.effect?.getTiming().duration) >= 200).length,
    nasabah: op('[data-aktor="tokoh:nasabah"]'),
    mentor: op('[data-aktor="tokoh:mentor"]'),
    jumlahNasabah: document.querySelectorAll('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-tokoh[data-siapa="nasabah"]:not([data-lapis])').length,
    pose: [...document.querySelectorAll('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-tokoh:not(.cer-pg-sementara):not([data-lapis])')].map((e) => `${e.getAttribute('data-siapa')}:${e.getAttribute('data-pose')}`),
    sisa: document.querySelector('.cer-dialog-sisa')?.textContent?.length ?? 0,
    bahasa: document.documentElement.lang,
    bingkai: pg?.getAttribute('data-bingkai') ?? null,
    elemen: pg ? pg.querySelectorAll('*').length : 0,
  };
});
const klikLanjut = (p) => p.evaluate(() => { const e = [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length); if (e) { e.click(); return true; } return false; });
const klikLewati = (p) => p.evaluate(() => { const e = document.querySelector('.cer-pg-lewati'); if (e) { e.click(); return true; } return false; });
const lengkapi = (p) => p.evaluate(() => { if (document.querySelector('.cer-dialog-sisa')) document.querySelector('.cer-dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
async function tungguGerak(p, jenis, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await p.evaluate(() => document.querySelector('.cer-panggung')?.getAttribute('data-gerak'))) === jenis) return true;
    await tidur(25);
  }
  return false;
}
async function tungguDiam(p, ms = 7000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (!(await p.evaluate(() => document.querySelector('.cer-panggung')?.getAttribute('data-gerak')))) return true;
    await tidur(50);
  }
  return false;
}
/** Dari mulai baru: lewati pembuka, kalimat utuh, Lanjut = narasi pintu (aksi masuk). */
async function keKedatangan(p) {
  await klikLewati(p);
  await lengkapi(p);
  await tidur(80);
  await klikLanjut(p);
  return tungguGerak(p, 'masuk', 2000);
}

// ------------------------------------------------------------------ langkah bingkai (animasi dijeda)

/**
 * Kalimat kini utuh, lalu timer ditahan & Lanjut (atau, di node pilihan, pilihan `pilihan` jalur uji); menunggu
 * rencana mulai lalu menjeda animasinya. Durasi (md) atau 0 bila tidak ada rencana.
 */
async function mulaiTerjeda(p, pilihan = 'dokumentasi') {
  await lengkapi(p);
  await tidur(150);
  await p.evaluate(() => { window.__tahan = true; });
  await p.evaluate((id) => {
    const l = [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length);
    if (l) l.click();
    else document.querySelector(`.cer-opsi[data-pilihan="${id}"]`)?.click();
  }, pilihan);
  for (let k = 0; k < 100; k++) {
    const d = await p.evaluate(() => {
      if (!document.querySelector('.cer-panggung')?.getAttribute('data-gerak')) return 0;
      // Rencana yang ditahan sampai bingkai mengalir (Sutradara `tunggu`) masih dijeda di posisi awal: tunggu ia
      // berjalan dulu, supaya jeda uji tidak ditimpa play() milik panggung.
      const panjang = document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity && Number(a.effect?.getTiming().duration) >= 200);
      if (panjang.some((a) => a.playState !== 'running')) return 0;
      let d = 0;
      for (const a of document.getAnimations()) {
        a.pause();
        const tm = a.effect?.getTiming();
        if (!tm) continue;
        if (tm.iterations === Infinity) a.currentTime = 0;
        else if (Number(tm.duration) >= 200) d = Math.max(d, Number(tm.duration));
      }
      return d;
    });
    if (d) return d;
    await tidur(10);
  }
  return 0;
}
const setelWaktu = (p, t) => p.evaluate((tt) => {
  for (const a of document.getAnimations()) {
    const tm = a.effect?.getTiming();
    if (tm && tm.iterations !== Infinity) a.currentTime = Math.min(tt, Number(tm.duration));
  }
}, t);
/**
 * Opasitas efektif setiap badan tokoh (dunia utama, pose sementara, salinan pejalan, salinan adegan). Dua badan
 * dengan pose SAMA di kotak layar yang SAMA (± 1,5 px), mis. Miss Raksa yang tetap di kursinya di salinan adegan
 * lama dan di dunia utama selama larut meja -> telepon, berimpit menjadi SATU badan (komposit a·X + (1-a)·X = X):
 * dihitung sekali dengan opasitas terbesar.
 */
const ukurBadan = (p) => p.evaluate(() => {
  const pg = document.querySelector('.cer-panggung');
  const efektif = (el) => {
    let o = 1;
    for (let e = el; e && e !== pg; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  };
  const h = { mentor: [], nasabah: [] };
  for (const t of pg.querySelectorAll('.cer-pg-tokoh[data-siapa]:not([data-lapis])')) {
    const siapa = t.getAttribute('data-siapa');
    const salinan = [...t.querySelectorAll('[data-aktor^="x:jalan:"]')];
    for (const g of salinan.length ? salinan : [t]) {
      const svg = [...g.querySelectorAll('svg.cer-pg-varian')];
      const op = Math.max(0, ...svg.map(efektif));
      const dasar = svg.find((x) => x.getAttribute('data-varian') !== 'kedip' && x.getAttribute('data-varian') !== 'bicara') ?? svg[0];
      const r = dasar?.getBoundingClientRect();
      h[siapa]?.push({
        op: Math.round(op * 1000) / 1000,
        aktor: g.getAttribute('data-aktor') ?? g.querySelector('[data-aktor]')?.getAttribute('data-aktor') ?? (t.closest('.cer-pg-lapis') ? 'salinan-adegan' : '?'),
        pose: salinan.length ? dasar?.getAttribute('data-varian') : t.getAttribute('data-pose'),
        kotak: r ? [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10) : null,
      });
    }
  }
  for (const siapa of Object.keys(h)) {
    const satu = [];
    for (const b of h[siapa]) {
      const sama = satu.find((x) => x.pose && x.pose === b.pose && x.kotak && b.kotak && x.kotak.every((v, i) => Math.abs(v - b.kotak[i]) <= 1.5));
      if (sama) { sama.op = Math.max(sama.op, b.op); sama.aktor += '+' + b.aktor; } else satu.push({ ...b });
    }
    h[siapa] = satu;
  }
  return h;
});
async function lepasTahan(p) {
  await p.evaluate(() => { window.__tahan = false; for (const fn of window.__ditahan.splice(0)) { try { fn(); } catch { /* abaikan */ } } });
  await tidur(200);
}
/** Menelusuri seluruh rencana yang terjeda tiap `langkah` md; mengembalikan bingkai yang memuat badan ganda. */
async function telusuri(p, durasi, langkah = 20, amati = null) {
  const ganda = [];
  let n = 0;
  for (let t = 0; t <= durasi; t += langkah) {
    await setelWaktu(p, t);
    const b = await ukurBadan(p);
    n++;
    for (const siapa of ['mentor', 'nasabah']) {
      const terlihat = b[siapa].filter((x) => x.op > 0.25);
      if (terlihat.length >= 2) ganda.push({ t, siapa, badan: terlihat });
    }
    if (amati) await amati(t, b);
  }
  return { ganda, bingkai: n };
}

// ================================================================== uji

async function ujiPembuka() {
  const p = await halaman();
  const i0 = await info(p);
  cek(i0.gerak === 'pembuka' && i0.lewati, 'mulai baru: pembuka berjalan & "Lewati pembuka" tampil sejak bingkai pertama', i0);
  const tombol = await p.evaluate(() => { const r = document.querySelector('.cer-pg-lewati')?.getBoundingClientRect(); return r ? { w: r.width, h: r.height } : null; });
  cek(tombol && tombol.h >= 44 && tombol.w >= 44, 'tombol lewati >= 44 px', tombol);
  await tangkap(p, 'awal');
  await tidur(250);
  // Kalimat yang masih mengetik tepat sebelum lewati (muat pertama yang berat bisa membuat ketikan sudah utuh:
  // pemeriksaan "tetap mengetik" hanya bermakna bila sebelumnya belum utuh).
  const sisaSebelum = (await info(p)).sisa;
  await klikLewati(p);
  await tidur(60);
  const i1 = await info(p);
  cek(!i1.gerak && !i1.lewati && i1.xAktor === 0 && i1.simpan === null && i1.node === 'b1-mentor', 'lewati di awal: komposisi akhir, tanpa aktor sementara, state cerita tidak ditulis', i1);
  // Hanya bermakna bila sisa ketikan cukup panjang: sisa beberapa huruf bisa habis sendiri dalam jeda 60 md.
  if (sisaSebelum > 15) cek(i1.sisa > 0, 'lewati tidak melengkapi/memajukan kalimat (ketikan tetap berjalan)', { sebelum: sisaSebelum, sesudah: i1.sisa });
  else catat(`sisa ketikan hanya ${sisaSebelum} huruf sebelum lewati (muat lambat); pemeriksaan "ketikan tetap berjalan" tidak bermakna di putaran ini`);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.cer-panggung');
  const i2 = await info(p);
  cek(!i2.gerak && !i2.lewati, 'muat ulang di awal episode: pembuka tidak diputar ulang di tab ini', i2);
  await tutup(p);
}

async function ujiLewati() {
  const p = await halaman();
  const ok = await keKedatangan(p);
  const i0 = await info(p);
  cek(ok && i0.lewati && i0.simpan?.baris === 2, 'narasi pintu: aksi masuk berjalan, tombol lewati tampil', i0);
  await tidur(900);
  await tangkap(p, 'masuk-tengah');
  const tengah = await info(p);
  await klikLewati(p);
  await tidur(60);
  const i1 = await info(p);
  cek(!i1.gerak && i1.xAktor === 0 && i1.nasabah === '1' && i1.mentor === '1' && JSON.stringify(i1.simpan) === JSON.stringify(tengah.simpan), 'lewati di tengah kedatangan: komposisi akhir, state sama', { tengah: tengah.simpan, i1 });
  cek(i1.pose.includes('nasabah:duduk') && i1.pose.includes('mentor:duduk-dengar') && i1.jumlahNasabah === 1, 'pose akhir: tepat satu Bu Rina duduk, Miss Raksa duduk mendengar', i1.pose);
  await tutup(p);
}

/**
 * v5.1: "Lewati pembuka" di luar gambar. Tata letak kotak dialog diukur selama tombol ada dan sesudah tombol hilang
 * (baris yang sama): tidak boleh ada lompatan (kotak dialog, baris kaki, Lanjut), tombol tidak bersinggungan dengan
 * panggung, Lanjut tetap di layar.
 */
async function ujiTempatLewati() {
  const ukurTata = (p) => p.evaluate(() => {
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
    const lw = document.querySelector('.cer-pg-lewati');
    const lanjut = [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length) ?? null;
    const pj = document.querySelector('.cer-dialog-petunjuk');
    return {
      lewati: r(lw),
      diKaki: !!lw?.closest('.cer-dialog-kaki'),
      diPanggung: !!lw?.closest('.cer-panggung'),
      sebelumLanjut: !!(lw && lanjut && (lw.compareDocumentPosition(lanjut) & Node.DOCUMENT_POSITION_FOLLOWING)),
      panggung: r(document.querySelector('.cer-panggung')),
      dialog: r(document.querySelector('.cer-dialog')),
      kaki: r(document.querySelector('.cer-dialog-kaki')),
      lanjut: r(lanjut),
      petunjuk: pj ? getComputedStyle(pj).visibility : null,
      tinggiLayar: window.innerHeight,
      teks: (lw?.textContent || '').trim(),
    };
  });
  const potong = (a, b) => !!(a && b) && a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  const sama = (a, b) => !!(a && b) && ['x', 'y', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.6);
  const tungguHilang = async (p, ms) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (!(await p.evaluate(() => !!document.querySelector('.cer-pg-lewati')))) return true; await tidur(40); }
    return false;
  };
  const H360 = { width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const L844 = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  for (const [nama, vp] of [['360x740', H360], ['390x844', H390], ['1440x900', D1440], ['844x390', L844]]) {
    for (const petunjukBaru of [false, true]) {
      if (petunjukBaru && nama !== '360x740' && nama !== '390x844') continue;
      const lbl = `${nama}${petunjukBaru ? ' (petunjuk pertama kali)' : ''}`;
      const p = await halaman({ vp, petunjukBaru });
      for (const [tahap, mulai] of [['pembuka', async () => true], ['kedatangan', async () => { await lengkapi(p); await tidur(80); await klikLanjut(p); return tungguGerak(p, 'masuk', 2500); }]]) {
        const ok = await mulai();
        const a = await ukurTata(p);
        cek(ok && a.lewati && a.diKaki && !a.diPanggung, `${lbl} ${tahap}: "Lewati pembuka" di baris kaki kotak dialog, bukan di panggung`, a);
        cek(a.lewati && !potong(a.lewati, a.panggung), `${lbl} ${tahap}: tombol tidak bersinggungan dengan gambar panggung`, { lewati: a.lewati, panggung: a.panggung });
        cek(a.lewati && a.lewati.w >= 44 && a.lewati.h >= 44 && a.teks === 'Lewati pembuka', `${lbl} ${tahap}: >= 44 x 44 px, label jelas`, { lewati: a.lewati, teks: a.teks });
        cek(a.sebelumLanjut && a.lanjut && !potong(a.lewati, a.lanjut), `${lbl} ${tahap}: sebelum Lanjut (urutan Tab), tidak menimpa Lanjut`, { lewati: a.lewati, lanjut: a.lanjut });
        // Petunjuk 'Ketuk kotak ini…' hanya di baris awal episode (pembuka); baris kedatangan tanpa petunjuk.
        if (petunjukBaru && (tahap === 'pembuka' || a.petunjuk !== null)) cek(a.petunjuk === 'hidden', `${lbl} ${tahap}: petunjuk tersembunyi (tetap memesan tempatnya) selama tombol ada`, a.petunjuk);
        const hilang = await tungguHilang(p, tahap === 'pembuka' ? 6000 : 4500);
        await tidur(60);
        const b = await ukurTata(p);
        cek(hilang && !b.lewati, `${lbl} ${tahap}: tombol hilang saat gerak selesai`, b.lewati);
        cek(sama(a.dialog, b.dialog) && sama(a.kaki, b.kaki) && sama(a.lanjut, b.lanjut), `${lbl} ${tahap}: kotak dialog, baris kaki & Lanjut tidak bergeser saat tombol hilang`, { dengan: { dialog: a.dialog, kaki: a.kaki, lanjut: a.lanjut }, tanpa: { dialog: b.dialog, kaki: b.kaki, lanjut: b.lanjut } });
        cek(b.lanjut && b.lanjut.y + b.lanjut.h <= b.tinggiLayar + 0.5 && a.lanjut && a.lanjut.y + a.lanjut.h <= a.tinggiLayar + 0.5, `${lbl} ${tahap}: Lanjut tetap di layar`, { lanjut: a.lanjut, tinggi: a.tinggiLayar });
        if (petunjukBaru && (tahap === 'pembuka' || b.petunjuk !== null)) cek(b.petunjuk === 'visible', `${lbl} ${tahap}: petunjuk tampil lagi sesudah tombol hilang`, b.petunjuk);
        if (tahap === 'kedatangan') await tangkap(p, `kedatangan-${nama}${petunjukBaru ? '-petunjuk' : ''}`);
      }
      await tutup(p);
    }
  }
  // Ketukan pointer sungguhan (mouse puppeteer) di HP: ketuk ganda pada tombol & ketukan meleset di selnya.
  for (const [nama, vp] of [['360x740', H360], ['390x844', H390]]) {
    const p = await halaman({ vp });
    await klikLewati(p);
    await lengkapi(p);
    await tidur(80);
    await klikLanjut(p);
    const ok = await tungguGerak(p, 'masuk', 2500);
    // a) Meleset: titik di sel kiri baris kaki, di KANAN tombol (masih di sel, bukan Lanjut).
    const r = await p.evaluate(() => {
      const b = document.querySelector('.cer-pg-lewati')?.getBoundingClientRect();
      const c = document.querySelector('.cer-dialog-kaki-kiri')?.getBoundingClientRect();
      return b && c ? { bx: b.x + b.width / 2, by: b.y + b.height / 2, mx: Math.min(b.right + 8, c.right - 2), my: b.y + b.height / 2, sel: c.right - b.right } : null;
    });
    const i0 = await info(p);
    if (r && r.sel > 4) {
      await p.mouse.click(r.mx, r.my);
      await tidur(80);
      const i1 = await info(p);
      cek(ok && i1.gerak === 'masuk' && i1.lewati && JSON.stringify(i1.simpan) === JSON.stringify(i0.simpan), `${nama}: ketukan meleset di sel tombol tidak memajukan cerita (gerak & kalimat tetap)`, { i0: i0.simpan, i1: i1.simpan, gerak: i1.gerak });
    } else catat(`${nama}: sel kiri tidak menyisakan ruang di kanan tombol (${JSON.stringify(r)}); uji meleset dilewati`);
    // b) Ketuk ganda pada tombol: gerak selesai, cerita TIDAK maju (state & kalimat sama).
    const sisaSebelum = (await info(p)).sisa;
    await p.mouse.click(r.bx, r.by);
    await tidur(90);
    await p.mouse.click(r.bx, r.by);
    await tidur(700);
    const i2 = await info(p);
    cek(!i2.gerak && !i2.lewati && JSON.stringify(i2.simpan) === JSON.stringify(i0.simpan) && i2.node === i0.node, `${nama}: ketuk ganda pada "Lewati pembuka": gerak selesai, cerita tidak maju`, { i0: i0.simpan, i2: i2.simpan, gerak: i2.gerak });
    if (sisaSebelum > 20) cek(i2.sisa > 0, `${nama}: ketuk ganda tidak melengkapi kalimat yang masih diketik`, { sebelum: sisaSebelum, sesudah: i2.sisa });
    // c) Sesudah jeda, ketukan biasa pada kotak dialog kembali berfungsi.
    await lengkapi(p);
    await tidur(100);
    await klikLanjut(p);
    await tidur(300);
    const i3 = await info(p);
    cek(JSON.stringify(i3.simpan) !== JSON.stringify(i0.simpan), `${nama}: sesudah jeda, Lanjut kembali memajukan cerita`, { i0: i0.simpan, i3: i3.simpan });
    await tutup(p);
  }
}

async function ujiLanjut() {
  const p = await halaman();
  const jejak = [];
  for (let k = 0; k < 6; k++) {
    await klikLanjut(p);
    await tidur(120);
    const i = await info(p);
    jejak.push({ k: k + 1, simpan: i.simpan, gerak: i.gerak });
  }
  await tungguDiam(p);
  const akhir = await info(p);
  // 1 = pembuka selesai + kalimat utuh; 2 = maju (kedatangan mulai); 3 = kedatangan selesai + kalimat utuh; 4 = maju;
  // 5 = kalimat utuh; 6 = maju => langkah 3 (b1-datang baris 2).
  cek(akhir.simpan?.langkah === 3 && akhir.simpan?.node === 'b1-datang' && akhir.simpan?.baris === 2, '6 ketukan Lanjut cepat = tepat 3 kali maju', { jejak, akhir: akhir.simpan });
  cek(jejak[0].gerak === null && jejak[2].gerak === null, 'ketukan saat bergerak menyelesaikan gerak seketika (lalu semantik Lanjut sekali)', jejak.map((j) => j.gerak));
  cek(akhir.xAktor === 0 && !akhir.gerak, 'tidak ada aktor sementara tersisa', akhir);
  await tutup(p);
}

async function ujiEnter() {
  const p = await halaman();
  await p.evaluate(() => document.activeElement?.blur?.());
  await p.keyboard.down('Enter');
  for (let k = 0; k < 12; k++) { await tidur(40); await p.keyboard.down('Enter'); }
  await p.keyboard.up('Enter');
  await tidur(150);
  const i = await info(p);
  cek(i.simpan === null && !i.gerak && i.sisa === 0, 'Enter ditahan: satu aksi (pembuka selesai + kalimat utuh), tidak maju', i);
  await tutup(p);
}

async function ujiBahasa() {
  const p = await halaman();
  await keKedatangan(p);
  await tidur(500);
  await p.select('.player-header-right select', 'en');
  await tidur(80);
  const i1 = await info(p);
  cek(i1.bahasa.startsWith('en'), 'bahasa berganti ke en', i1.bahasa);
  cek(i1.gerak === 'masuk', 'ganti bahasa saat bergerak: gerak tidak diulang / tidak berhenti', i1);
  await tungguDiam(p);
  await tidur(600);
  const i2 = await info(p);
  cek(!i2.gerak && i2.xAktor === 0 && i2.nasabah === '1', 'sesudah selesai: komposisi akhir, tidak diputar ulang', i2);
  const label = await p.evaluate(() => document.querySelector('.cer-suasana [aria-hidden="true"]')?.textContent);
  cek(/Rina/.test(label ?? ''), 'label suasana ikut bahasa', label);
  await p.select('.player-header-right select', 'id');
  await tidur(300);
  cek(!(await info(p)).gerak, 'ganti bahasa lagi: tidak memutar apa pun');
  await tutup(p);
}

async function ujiUkuran() {
  // Lebar berubah: gerak selesai, bingkai HP.
  {
    const p = await halaman();
    await keKedatangan(p);
    await tidur(600);
    // Lebar saja (isMobile/hasTouch tetap: mengubahnya membuat puppeteer memuat ulang halaman).
    await p.setViewport({ ...D1440, width: 390, height: 844 });
    await tidur(250);
    const i = await info(p);
    cek(!i.gerak && i.xAktor === 0 && i.nasabah === '1', 'lebar berubah saat bergerak: langsung komposisi akhir', i);
    cek(i.bingkai === 'hp', 'kamera berganti ke bingkai HP', i.bingkai);
    await p.setViewport(D1440);
    await tidur(400);
    cek(!(await info(p)).gerak, 'ukuran kembali: tidak memutar ulang');
    await tutup(p);
  }
  // HP pendek (panggung dibatasi 38dvh): tinggi saja berubah sedikit = kamera dipaskan ulang, gerak jalan terus.
  // Flake 28 Sep ("gerak TIDAK diselesaikan" gagal sekali di run penuh, lulus sendiri): BUKAN waktu/beban (24 run
  // termasuk CPU 6x lulus; ketikan kalimat di run gagal sama dengan run lulus, ± 0,9 dtk sesudah Lanjut, jauh sebelum
  // gerak 3 dtk habis) dan bukan kode resize, melainkan HMR Vite: berkas lain disunting di server dev bersama selama
  // gerak -> Fast Refresh me-remount panggung -> komposisi akhir tanpa memutar ulang (perilaku pasang ulang yang benar).
  // Terbukti: menyentuh modul panggung di tengah gerak mereproduksi kegagalan persis (gerak null, xAktor 0). Uji ini
  // mengulang skenario (maks. 3x) bila halaman menerima HMR di jendela ukurnya.
  for (let coba = 1; coba <= 3; coba++) {
    const p = await halaman({ vp: H360P, pembuka: false, state: ST.awal });
    const h0 = await p.evaluate(() => document.querySelector('.cer-panggung').clientHeight);
    await lengkapi(p);
    await tidur(100);
    const hmr0 = p.hmr;
    await klikLanjut(p);
    const ok = await tungguGerak(p, 'masuk', 2000);
    await tidur(700);
    const kamSebelum = await p.evaluate(() => getComputedStyle(document.querySelector('[data-aktor="kamera"]')).transform);
    await p.setViewport({ ...H360P, height: 600 });
    await tidur(150);
    const h1 = await p.evaluate(() => document.querySelector('.cer-panggung').clientHeight);
    const i = await info(p);
    const kamSesudah = await p.evaluate(() => getComputedStyle(document.querySelector('[data-aktor="kamera"]')).transform);
    if (p.hmr > hmr0 && coba < 3) {
      catat(`tinggi saja: HMR Vite di tengah gerak (percobaan ${coba}) me-remount panggung; skenario diulang`);
      await p.browserContext().close();
      continue;
    }
    cek(ok && h1 < h0 && (h0 - h1) / h0 < 0.15, `tinggi panggung berubah sedikit saja (${h0} -> ${h1} px)`, { h0, h1 });
    cek(i.gerak === 'masuk' && i.xAktor > 0, 'tinggi saja berubah sedikit (bilah alamat): gerak TIDAK diselesaikan', { ...i, hmr: p.hmr - hmr0 });
    cek(kamSesudah !== kamSebelum, 'kamera dipaskan ulang ke kotak baru selama gerak', { kamSebelum, kamSesudah });
    await tungguDiam(p);
    await tidur(200);
    const i2 = await info(p);
    cek(!i2.gerak && i2.xAktor === 0 && i2.jumlahNasabah === 1 && i2.nasabah === '1' && i2.pose.includes('mentor:duduk-dengar'), 'lalu selesai normal: komposisi akhir, tepat satu Bu Rina', i2);
    await tutup(p);
    break;
  }
  // Tinggi berubah banyak (> 15 %): gerak selesai.
  {
    const p = await halaman({ vp: H360P, pembuka: false, state: ST.awal });
    await lengkapi(p);
    await tidur(100);
    await klikLanjut(p);
    await tungguGerak(p, 'masuk', 2000);
    await tidur(500);
    await p.setViewport({ ...H360P, height: 480 });
    await tidur(200);
    const i = await info(p);
    cek(!i.gerak && i.xAktor === 0 && i.nasabah === '1', 'tinggi berubah banyak: gerak diselesaikan', i);
    await tutup(p);
  }
}

async function ujiDialog() {
  for (const [nama, idx] of [['Bantuan', 2], ['Riwayat', 0]]) {
    const p = await halaman();
    await keKedatangan(p);
    await tidur(400);
    await p.evaluate((n) => [...document.querySelectorAll('.cer-alat-tombol')][n]?.click(), idx);
    await tidur(150);
    const i = await info(p);
    cek(!i.gerak && i.xAktor === 0, `${nama} dibuka saat bergerak: gerak diselesaikan`, i);
    await p.keyboard.press('Escape');
    await tidur(400);
    const i2 = await info(p);
    cek(!i2.gerak && i2.nasabah === '1' && JSON.stringify(i2.simpan) === JSON.stringify(i.simpan), `${nama} ditutup: komposisi akhir, tidak diputar ulang, state sama`, i2);
    await tutup(p);
  }
}

async function ujiTab() {
  const p = await halaman();
  await keKedatangan(p);
  await tidur(400);
  const sembunyi = (v) => p.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { value: h, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);
  await sembunyi(true);
  await tidur(100);
  const i = await info(p);
  const berjalan = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => {
    const t = a.effect?.target;
    return { jenis: a.constructor.name, nama: a.transitionProperty ?? a.animationName ?? null, durasi: a.effect?.getTiming().duration, ulang: a.effect?.getTiming().iterations,
      target: t ? `${t.tagName?.toLowerCase()}.${String(t.className?.baseVal ?? t.className ?? '').split(' ')[0]}[${t.getAttribute?.('data-varian') ?? t.getAttribute?.('data-aktor') ?? ''}]` : null };
  }));
  cek(!i.gerak && i.xAktor === 0, 'tab tersembunyi: aksi diselesaikan', i);
  // Transisi CSS singkat (sorotan pembicara) yang mulai bersamaan dengan penyelesaian aksi bukan gerak kecil.
  const kecilJalan = berjalan.filter((a) => a.jenis !== 'CSSTransition');
  cek(kecilJalan.length === 0, 'tab tersembunyi: gerak kecil (napas/kedip/mulut) dijeda', berjalan);
  await tidur(6500);
  const kedip = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().duration === 120).length);
  cek(kedip === 0, 'tidak ada kedip selama tersembunyi', kedip);
  await sembunyi(false);
  await tidur(200);
  const i2 = await info(p);
  const berjalan2 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  // Tokoh RASTER tanpa napas (skala pecahan merusak piksel): gerak kecil yang lanjut = kedip terjadwal lagi (3-6 dtk).
  const raster = await p.evaluate(() => [...document.querySelectorAll('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-tokoh:not([data-lapis])')].every((t) => t.hasAttribute('data-piksel')));
  const kedipLagi = raster ? await p.evaluate(() => new Promise((selesai) => {
    const t0 = performance.now();
    const f = () => {
      if (document.getAnimations().some((a) => a.effect?.getTiming().duration === 120)) selesai(true);
      else if (performance.now() - t0 > 7500) selesai(false); else requestAnimationFrame(f);
    };
    f();
  })) : null;
  cek(!i2.gerak && i2.xAktor === 0 && (raster ? kedipLagi : berjalan2 > 0), `kembali ke tab: tanpa memutar ulang aksi, ${raster ? 'kedip (tokoh raster) terjadwal lagi' : 'napas lanjut'}`, { i2, berjalan2, raster, kedipLagi });
  await tutup(p);
}

async function ujiMuat() {
  const p = await halaman();
  await keKedatangan(p);
  await tidur(700);
  const sebelum = await info(p);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.cer-panggung');
  await tidur(60);
  const i = await info(p);
  cek(!i.gerak && !i.lewati && i.xAktor === 0 && JSON.stringify(i.simpan) === JSON.stringify(sebelum.simpan), 'muat ulang di tengah kedatangan: tanpa memutar ulang, state sama', i);
  cek(i.jumlahNasabah === 1 && i.nasabah === '1', 'tepat satu Bu Rina di panggung', i);
  cek(i.pose.includes('nasabah:duduk') && i.pose.includes('mentor:duduk-dengar'), 'pose akhir benar (keduanya duduk)', i.pose);
  await tangkap(p, 'muat-ulang');
  await tutup(p);
}

async function ujiBab() {
  const p = await halaman({ state: ST.pergi, pembuka: false });
  let lihatPergi = false;
  for (let k = 0; k < 14; k++) {
    if ((await p.evaluate(() => document.querySelector('.cer-main')?.getAttribute('data-tampilan'))) === 'akhir') break;
    await lengkapi(p);
    await tidur(60);
    await klikLanjut(p);
    await tidur(150);
    if ((await p.evaluate(() => document.querySelector('.cer-panggung')?.getAttribute('data-gerak'))) === 'pergi') {
      lihatPergi = true;
      await tidur(900);
      await tangkap(p, 'pergi-tengah');
    }
  }
  cek(lihatPergi, 'narasi pergi memutar aksi pergi');
  const t = await p.evaluate(() => document.querySelector('.cer-main')?.getAttribute('data-tampilan'));
  cek(t === 'akhir', 'kartu akhir tampil', t);
  cek(!(await p.evaluate(() => !!document.querySelector('.cer-panggung'))), 'kartu akhir tanpa panggung besar');
  await p.evaluate(() => [...document.querySelectorAll('.cer-main button')].find((x) => /Coba|jalur/i.test(x.textContent))?.click());
  await tidur(300);
  const bab = await p.evaluate(() => { const e = document.querySelector('.akh-pemilih-bab'); const b = e?.getAttribute('data-bab'); e?.click(); return b; });
  await tidur(500);
  const i = await info(p);
  cek(i.tampilan === 'dialog' && !i.gerak && i.xAktor === 0, 'ulang bab dari kartu akhir: dialog dengan komposisi bab itu, tanpa gerak sisa', { bab, i });
  await tutup(p);
}

async function ujiRingan() {
  for (const [nama, opsi] of [['gerak dikurangi', { gerak: 'kurang' }], ['mode ringan', { ringan: true }], ['mode ringan ?adegan=ringan', { kueri: '?adegan=ringan' }]]) {
    const p = await halaman(opsi);
    const i0 = await info(p);
    cek(!i0.gerak && !i0.lewati, `${nama}: tanpa pembuka, tanpa tombol lewati`, i0);
    await lengkapi(p);
    await tidur(50);
    await klikLanjut(p);
    await tidur(60);
    const i1 = await info(p);
    cek(!i1.gerak && i1.nasabah === '1' && i1.anim === 0 && i1.jumlahNasabah === 1, `${nama}: narasi pintu = komposisi akhir langsung, 0 animasi`, i1);
    if (opsi.kueri) cek((await p.evaluate(() => localStorage.getItem('raksa:adegan'))) === 'ringan', `${nama}: pilihan disimpan (localStorage raksa:adegan=ringan)`);
    await tutup(p);
  }
  // Profil BARU (tanpa raksa:profil): /cerita/auto-1?adegan=ringan dialihkan ke /kenalan (query hilang), tetapi
  // pilihan ringan sudah disimpan, jadi episode yang dibuka sesudah kenalan tetap ringan.
  {
    const ctx = await peramban.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport(H390);
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await p.goto(BASE + HALAMAN + '?adegan=ringan', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => location.pathname.startsWith('/kenalan'), { timeout: 15000 }).catch(() => undefined);
    const r = await p.evaluate(() => ({ jalur: location.pathname + location.search, adegan: localStorage.getItem('raksa:adegan') }));
    cek(r.jalur.startsWith('/kenalan') && r.adegan === 'ringan', 'profil baru + ?adegan=ringan: dialihkan ke /kenalan dan mode ringan tersimpan', r);
    await ctx.close();
  }
  // ?adegan=penuh menghapus mode ringan yang tersimpan: pembuka kembali berjalan.
  {
    const p = await halaman({ ringan: true, kueri: '?adegan=penuh' });
    const i0 = await info(p);
    const ls = await p.evaluate(() => localStorage.getItem('raksa:adegan'));
    cek(ls === null && i0.gerak === 'pembuka', '?adegan=penuh: mode ringan dihapus, pembuka berjalan lagi', { ls, gerak: i0.gerak });
    await tutup(p);
  }
}

/** Keadaan tokoh panggung: seni per tokoh, label nama (siluet), jumlah raster, sisipan telepon. */
const bacaTokohSeni = (p) => p.evaluate(() => {
  const pg = document.querySelector('.cer-panggung');
  const dunia = '.cer-pg-dunia[data-aktor="kamera"]';
  const tokoh = [...document.querySelectorAll(`${dunia} > .cer-pg-tokoh[data-siapa]:not([data-lapis])`)];
  const sisip = document.querySelector('.cer-pg-telepon');
  return {
    seni: pg?.getAttribute('data-tokoh-seni') ?? null,
    tokoh: tokoh.map((t) => t.getAttribute('data-siapa')),
    raster: tokoh.filter((t) => t.hasAttribute('data-piksel')).length,
    label: [...document.querySelectorAll(`${dunia} .cer-pg-label`)].map((e) => e.textContent),
    sisip: sisip ? { siluet: sisip.hasAttribute('data-siluet'), piksel: !!sisip.querySelector('.cer-pg-telepon-potret[data-piksel]') } : null,
    rusak: !!document.querySelector('.cer-panggung[data-rusak]'),
    memuat: !!document.querySelector(`${dunia}[data-memuat]`),
    dialog: !!document.querySelector('.cer-dialog'),
    langkah: JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah ?? null,
  };
});

/**
 * Atlas SATU tokoh gagal dimuat (permintaan gambar diblokir; build produksi juga: nama berkas ber-hash): KEDUA tokoh
 * memakai siluet netral + nama sebagai teks, tidak pernah seni SVG v3 yang ditolak di samping tokoh piksel; potret
 * sisipan telepon ikut siluet; cerita tetap maju tanpa galat halaman.
 */
async function ujiAsetAtlas() {
  const ATLAS = { miss: /\/miss-raksa(-[\w-]+)?\.png(\?|$)/, rina: /\/bu-rina(-[\w-]+)?\.png(\?|$)/ };
  const kasus = [
    { nama: 'atlas Bu Rina gagal (1440)', vp: D1440, blokir: ATLAS.rina, state: ST.datang, telepon: false },
    { nama: 'atlas Miss Raksa gagal (390)', vp: H390, blokir: ATLAS.miss, state: ST.datang, telepon: false },
    { nama: 'atlas Miss Raksa gagal, epilog telepon (390)', vp: H390, blokir: ATLAS.miss, state: ST.telepon, telepon: true },
  ];
  for (const k of kasus) {
    const p = await halaman({ vp: k.vp, state: k.state, pembuka: false, blokirGambar: k.blokir });
    if (k.telepon) {
      await tidur(300);
      await lengkapi(p); await tidur(80);
      await klikLanjut(p);
      await tungguDiam(p);
    }
    const harus = k.telepon ? 1 : 2;
    let s = null;
    for (const t0 = Date.now(); Date.now() - t0 < 10000;) {
      s = await bacaTokohSeni(p);
      if (s.tokoh.length === harus && s.raster === 0 && s.label.length === harus && !s.memuat) break;
      await tidur(100);
    }
    cek(s.tokoh.length === harus && s.raster === 0 && s.label.length === harus && s.seni === (k.telepon ? 'svg' : 'svg svg') && !s.rusak && !s.memuat && s.dialog,
      `${k.nama}: ${k.telepon ? 'Miss Raksa' : 'kedua tokoh'} siluet netral + nama sebagai teks (seragam, tanpa seni v3 / piksel campur)`, s);
    if (k.telepon) cek(s.sisip && s.sisip.siluet && !s.sisip.piksel, `${k.nama}: potret sisipan telepon = siluet (bukan v3)`, s.sisip);
    await tangkap(p, `atlas-gagal-${k.telepon ? 'telepon-' : ''}${k.vp.width}`);
    // Cerita tetap maju (Lanjut / pilihan pertama), tetap siluet.
    const l0 = s.langkah;
    await lengkapi(p); await tidur(80);
    await p.evaluate(() => ([...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length) ?? document.querySelector('.cer-opsi'))?.click());
    await tidur(500);
    const s2 = await bacaTokohSeni(p);
    cek(s2.dialog && !s2.rusak && s2.langkah > l0 && s2.raster === 0, `${k.nama}: cerita tetap maju, tokoh tetap siluet`, { l0, ...s2 });
    await tutup(p);
  }
}

async function ujiAset() {
  await ujiAsetAtlas();
  const p = await halaman({ state: ST.datang, pembuka: false });
  // Modul generator yang DIPAKAI halaman (Vite dev menambah ?t=... sesudah HMR, jadi URL-nya dibaca dari resource).
  const modul = await p.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/cerita/seni/tokoh/index.ts')).pop() ?? null;
    if (!url) return null;
    try { await import(url); return url; } catch { return null; }
  });
  const vite = !!modul;
  if (!vite) {
    catat('DILEWATI: generator hanya bisa diganti lewat modul sumber (Vite dev); jalankan dengan UI_BASE ke Vite dev untuk uji ini');
    await p.browserContext().close();
    return;
  }
  await p.evaluate(async (url) => {
    const m = await import(url);
    m.pasangGenerator({ missRaksa: () => { throw new Error('uji aset gagal'); }, buRina: () => { throw new Error('uji aset gagal'); } });
  }, modul);
  await lengkapi(p); await tidur(60); await klikLanjut(p); await tidur(300);
  const a = await p.evaluate(() => ({ label: [...document.querySelectorAll('.cer-pg-label')].map((e) => e.textContent), rusak: !!document.querySelector('.cer-panggung[data-rusak]'), dialog: !!document.querySelector('.cer-dialog') }));
  cek(a.label.length >= 1 && !a.rusak && a.dialog, 'generator melempar: pengganti sementara + nama sebagai teks, dialog tetap ada', a);
  await p.evaluate(async (url) => {
    const m = await import(url);
    m.pasangGenerator({ missRaksa: () => null, buRina: () => null });
  }, modul);
  const l0 = await p.evaluate(() => JSON.parse(localStorage.getItem('raksa:cerita')).episode['auto-1'].state.langkah);
  await lengkapi(p); await tidur(60);
  await p.evaluate(() => document.querySelector('.cer-opsi')?.click() ?? [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length)?.click());
  await tidur(400);
  await lengkapi(p); await tidur(60); await klikLanjut(p); await tidur(300);
  // seni/tokoh `aman`: hasil null = GAGAL (sama dengan melempar) -> siluet + nama sebagai teks; panggung yang tetap
  // rusak (BatasGagal) juga diterima. Yang wajib: dialog tetap ada dan cerita maju.
  const b = await p.evaluate(() => ({
    label: document.querySelectorAll('.cer-pg-label').length,
    rusak: !!document.querySelector('.cer-panggung[data-rusak]'), dialog: !!document.querySelector('.cer-dialog'),
    langkah: JSON.parse(localStorage.getItem('raksa:cerita')).episode['auto-1'].state.langkah,
    tampilan: document.querySelector('.cer-main')?.getAttribute('data-tampilan') ?? null,
    node: document.querySelector('.cer-main')?.getAttribute('data-node') ?? null,
    judul: document.querySelector('h1, h2')?.textContent?.slice(0, 80) ?? null,
  }));
  if (!cek((b.rusak || b.label >= 1) && b.dialog && b.langkah > l0, 'data gambar null: siluet + nama sebagai teks (atau kotak polos), cerita tetap maju', { ...b, l0, galat: p.galat.slice(0, 3) })) await tangkap(p, 'rusak');
  // Galat konsol yang DISENGAJA (peringatan batas panggung) tidak dihitung di sini.
  p.galat = p.galat.filter((g) => !/uji aset gagal|Panggung cerita gagal|Cannot read|null/.test(g));
  await tutup(p);
}

async function ujiBocor() {
  const p = await halaman({ state: ST.datang, pembuka: false });
  await tidur(600);
  const awal = await p.evaluate(() => ({ anim: document.getAnimations().length, pendengar: { ...window.__pendengar }, elemen: document.querySelector('.cer-panggung').querySelectorAll('*').length }));
  for (let k = 0; k < 10; k++) {
    await lengkapi(p); await tidur(60);
    await klikLanjut(p); await tidur(300);
    if (await p.$('.cer-opsi')) { await p.evaluate(() => (document.querySelector('.cer-opsi[data-pilihan="dengar"]') ?? document.querySelector('.cer-opsi'))?.click()); await tidur(300); }
  }
  await tungguDiam(p);
  await tidur(1200);
  const akhir = await p.evaluate(() => ({
    anim: document.getAnimations().length,
    aksi: document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running' && Number(a.effect?.getTiming().duration) >= 200).length,
    x: document.querySelectorAll('[data-aktor^="x:"]').length,
    pendengar: { ...window.__pendengar },
    elemen: document.querySelector('.cer-panggung')?.querySelectorAll('*').length ?? 0,
    node: document.querySelector('.cer-main')?.getAttribute('data-node'),
  }));
  cek(akhir.anim <= awal.anim + 3 && akhir.aksi === 0 && akhir.x === 0, 'animasi tidak menumpuk setelah banyak baris (hanya napas, kedip, mulut)', { awal, akhir });
  cek(akhir.pendengar.window <= awal.pendengar.window + 2 && akhir.pendengar.document <= awal.pendengar.document + 2, 'pendengar window/document tidak menumpuk', { awal: awal.pendengar, akhir: akhir.pendengar });
  cek(akhir.elemen <= awal.elemen * 1.6 + 40, `elemen panggung tidak menumpuk (${awal.elemen} -> ${akhir.elemen})`, { awal: awal.elemen, akhir: akhir.elemen, node: akhir.node });
  await tutup(p);
}

async function ujiHantu() {
  const skenario = [
    ['kedatangan', ST.awal, 'masuk'],
    ['kepergian', ST.pergi, 'pergi'],
    ['kartu sesudah pindah lokasi', ST.kartu, 'kartu'],
    ['epilog telepon', ST.telepon, 'pindah'],
    ['pindah ke parkiran', ST.pindah, 'pindah'],
  ];
  for (const [vpNama, vp] of [['1440', D1440], ['390', H390]]) {
    for (const [nama, st, jenis] of skenario) {
      const p = await halaman({ vp, state: st, pembuka: false });
      await tidur(500);
      const durasi = await mulaiTerjeda(p);
      const j = await p.evaluate(() => document.querySelector('.cer-panggung')?.getAttribute('data-gerak'));
      if (!cek(durasi > 0 && j === jenis, `${nama} ${vpNama}px: aksi ${jenis} dimulai (${durasi} md)`, { durasi, j })) { await lepasTahan(p); await tutup(p); continue; }
      // Urutan pose Bu Rina & Miss Raksa yang terlihat (> 25 %), untuk tukar berdiri <-> duduk lewat bingkai antara
      // duduk-turun.
      const urutan = [];
      const urutanM = [];
      const r = await telusuri(p, durasi, 20, (t, b) => {
        const pose = b.nasabah.filter((x) => x.op > 0.25).map((x) => x.pose).join('+') || '-';
        if (urutan[urutan.length - 1]?.pose !== pose) urutan.push({ t, pose });
        const poseM = b.mentor.filter((x) => x.op > 0.25).map((x) => x.pose).join('+') || '-';
        if (urutanM[urutanM.length - 1]?.pose !== poseM) urutanM.push({ t, pose: poseM });
      });
      if (jenis === 'masuk') {
        // Miss Raksa (atlas dengan frame duduk-turun): persilakan -> duduk-turun (tahan singkat) -> duduk, tanpa hantu.
        const adaM = await p.evaluate(() => !!document.querySelector('[data-aktor="x:turun-mentor"]'));
        catat(`${nama} ${vpNama}px: pose Miss Raksa ${urutanM.map((u) => `${u.t}:${u.pose}`).join(' > ')}`);
        if (adaM) {
          const i = urutanM.findIndex((u) => u.pose === 'duduk-turun');
          const lama = i >= 0 && i + 1 < urutanM.length ? urutanM[i + 1].t - urutanM[i].t : 0;
          cek(i > 0 && urutanM[i - 1].pose === 'berdiri-persilakan' && /^duduk-(dengar|jelaskan|tunjuk)$/.test(urutanM[i + 1]?.pose ?? '') && lama >= 180 && lama <= 300,
            `${nama} ${vpNama}px: Miss Raksa persilakan -> duduk-turun (${lama} md) -> duduk`, urutanM);
        } else {
          catat(`${nama} ${vpNama}px: atlas Miss Raksa belum punya frame duduk-turun: persilakan -> duduk seketika (cadangan)`);
        }
      }
      cek(r.ganda.length === 0, `${nama} ${vpNama}px: ${r.bingkai} bingkai, tidak ada dua badan tokoh yang sama > 25 %`, r.ganda.slice(0, 4));
      if (jenis === 'masuk' || jenis === 'pergi') {
        const adaAntara = await p.evaluate(() => !!document.querySelector('[data-aktor="x:turun"]'));
        const ringkas = urutan.filter((u) => !/^jalan-[ab]$/.test(u.pose)).map((u) => `${u.t}:${u.pose}`).join(' > ');
        catat(`${nama} ${vpNama}px: pose Bu Rina ${ringkas}`);
        if (adaAntara) {
          const i = urutan.findIndex((u) => u.pose === 'duduk-turun');
          const lama = i >= 0 && i + 1 < urutan.length ? urutan[i + 1].t - urutan[i].t : 0;
          const ok = i > 0 && (jenis === 'masuk'
            ? /berdiri|diam/.test(urutan[i - 1].pose) && urutan[i + 1]?.pose === 'duduk'
            : urutan[i - 1].pose === 'duduk' && /berdiri-pergi/.test(urutan[i + 1]?.pose ?? ''));
          cek(ok && lama >= 100 && lama <= 200, `${nama} ${vpNama}px: bingkai antara duduk-turun di antara berdiri & duduk (${lama} md)`, urutan);
        } else {
          catat(`${nama} ${vpNama}px: generator Bu Rina belum punya pose duduk-turun: tukar berdiri <-> duduk seketika (cadangan)`);
        }
      }
      await lepasTahan(p);
      const i = await info(p);
      cek(!i.gerak && i.xAktor === 0, `${nama} ${vpNama}px: sesudahnya komposisi akhir tanpa aktor sisa`, i);
      await tutup(p);
    }
  }
  // Ganti antarbaris (pose/wajah/pandang) dalam percakapan: setiap rencana 'ganti' ditelusuri.
  const p = await halaman({ state: ST.datang, pembuka: false });
  await tidur(500);
  let rencana = 0;
  const ganda = [];
  for (let k = 0; k < 6; k++) {
    if (await p.$('.cer-opsi')) { await p.evaluate(() => (document.querySelector('.cer-opsi[data-pilihan="dengar"]') ?? document.querySelector('.cer-opsi'))?.click()); await tidur(400); continue; }
    const d = await mulaiTerjeda(p);
    if (d) {
      rencana++;
      const r = await telusuri(p, d, 10);
      ganda.push(...r.ganda);
    }
    await lepasTahan(p);
  }
  cek(rencana >= 2 && ganda.length === 0, `ganti antarbaris: ${rencana} rencana ditelusuri, tanpa badan ganda`, { rencana, ganda: ganda.slice(0, 4) });
  await tutup(p);
}

/**
 * Masker piksel (piksel seni, relatif kiri-atas potongan) untuk cek kartu vs tangan: piksel buram tiap frame duduk
 * Miss Raksa SELAIN tunjuk di dalam kotak `diAtasMeja` (lapisan tangan yang digambar di atas meja & kartu), dan
 * piksel buram PNG kartu. Dibaca sekali dari atlas + manifest seni/piksel.
 */
let maskerKartuTangan = null;
function maskerTangan() {
  if (maskerKartuTangan) return maskerKartuTangan;
  const dir = path.join(AKAR, 'client/src/cerita/seni/piksel');
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'miss-raksa.json'), 'utf8'));
  const atlas = PNG.sync.read(fs.readFileSync(path.join(dir, m.gambar)));
  const ruang = JSON.parse(fs.readFileSync(path.join(dir, 'ruang.json'), 'utf8'));
  const kartu = PNG.sync.read(fs.readFileSync(path.join(dir, ruang.prop.kartu.berkas)));
  const buram = (png, x0, y0, w, h, dalam) => {
    const px = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (png.data[((y0 + y) * png.width + x0 + x) * 4 + 3] && dalam(x, y)) px.push([x, y]);
    return px;
  };
  const tangan = {};
  for (const [id, f] of Object.entries(m.frame)) {
    if (!Array.isArray(f.diAtasMeja) || id.includes('tunjuk')) continue;
    const [rx, ry, rw, rh] = f.rect;
    tangan[id] = { w: rw, px: buram(atlas, rx, ry, rw, rh, (x, y) => f.diAtasMeja.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh)) };
  }
  return (maskerKartuTangan = { tangan, kartu: { w: kartu.width, px: buram(kartu, 0, 0, kartu.width, kartu.height, () => true) } });
}

/**
 * Bingkai demi bingkai (animasi dijeda, tiap `langkah` md) selama aksi kartu: kotak layar kartu & setiap badan Miss
 * Raksa yang terlihat (opasitas efektif > 0,25) dengan frame duduk selain tunjuk -> celah piksel (Chebyshev, piksel
 * seni) antara piksel kartu dan piksel tangan-di-meja. < 0 = kartu melintas di bawah tangan; 0 = bersentuhan.
 */
async function kartuLewatTangan(p, durasi, langkah = 20) {
  const M = maskerTangan();
  let min = Infinity;
  let di = null;
  let n = 0;
  const skala = [];
  for (let t = 0; t <= durasi; t += langkah) {
    await setelWaktu(p, t);
    const u = await p.evaluate(() => {
      const pg = document.querySelector('.cer-panggung');
      const efektif = (el) => {
        let o = 1;
        for (let e = el; e && e !== pg; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
          o *= parseFloat(cs.opacity);
        }
        return o;
      };
      const k = pg?.querySelector('[data-aktor="prop:kartu"] svg');
      const kr = k?.getBoundingClientRect();
      const badan = [...(pg?.querySelectorAll('.cer-pg-tokoh[data-siapa="mentor"]:not([data-lapis])') ?? [])].map((t) => {
        const v = t.querySelector('svg.cer-pg-varian[data-varian="dasar"]') ?? t.querySelector('svg.cer-pg-varian');
        const r = v?.getBoundingClientRect();
        return { frame: t.getAttribute('data-frame'), op: v ? efektif(v) : 0, x: r?.x ?? 0, y: r?.y ?? 0, w: r?.width ?? 0 };
      });
      return { kartu: k && kr ? { x: kr.x, y: kr.y, w: kr.width, op: efektif(k) } : null, badan };
    });
    if (!u.kartu || u.kartu.op <= 0.02) continue;
    const sk = u.kartu.w / M.kartu.w;
    for (const b of u.badan) {
      const T = M.tangan[b.frame];
      if (!T || b.op <= 0.25 || !b.w) continue;
      const s = b.w / T.w;
      skala.push(Math.round((sk / s) * 1000) / 1000);
      n++;
      let c = Infinity;
      for (const [x, y] of M.kartu.px) {
        const X = u.kartu.x + x * sk, Y = u.kartu.y + y * sk;
        for (const [hx, hy] of T.px) {
          const HX = b.x + hx * s, HY = b.y + hy * s;
          const d = Math.max(HX - (X + sk), X - (HX + s), HY - (Y + sk), Y - (HY + s)) / s;
          if (d < c) c = d;
        }
      }
      if (c < min) { min = c; di = { t, frame: b.frame, kartu: { x: Math.round(u.kartu.x), y: Math.round(u.kartu.y) } }; }
    }
  }
  return { n, min: Number.isFinite(min) ? Math.round(min * 100) / 100 : null, di, skalaSama: skala.every((v) => Math.abs(v - 1) < 0.02) };
}

async function ujiAksi() {
  for (const [vpNama, vp] of [['1440', D1440], ['390', H390]]) {
    // Kartu: larut dulu (salinan parkiran di atas, kartu belum tampil), lalu kartu melengkung & Miss Raksa menunjuk.
    {
      const p = await halaman({ vp, state: ST.kartu, pembuka: false });
      await tidur(500);
      const durasi = await mulaiTerjeda(p);
      const baca = () => p.evaluate(() => {
        const op = (s) => { const e = document.querySelector(s); return e ? Math.round(parseFloat(getComputedStyle(e).opacity) * 100) / 100 : null; };
        return { lama: op('[data-aktor="x:lama"]'), kartu: op('[data-aktor="prop:kartu"]'), mentor: op('[data-aktor="tokoh:mentor"]'), lokasi: document.querySelector('.cer-panggung')?.getAttribute('data-lokasi'), lokasiLama: document.querySelector('[data-aktor="x:lama"]') ? 'ada' : null };
      });
      await setelWaktu(p, 150);
      const a = await baca();
      await setelWaktu(p, 460);
      const b = await baca();
      // Kartu dibuka PEMAIN (di luar bingkai, kiri kamera): muncul di tepi dekat meja di sisi kiri-bawah titik akhirnya,
      // di dalam kotak panggung, lalu meluncur ke tengah meja; Miss Raksa baru menunjuk sesudah kartu mendarat.
      const kotakKartu = () => p.evaluate(() => {
        const k = document.querySelector('[data-aktor="prop:kartu"] svg')?.getBoundingClientRect();
        const pg = document.querySelector('.cer-panggung').getBoundingClientRect();
        return k ? { x: Math.round(k.x + k.width / 2 - pg.x), y: Math.round(k.y + k.height - pg.y), w: Math.round(pg.width), h: Math.round(pg.height) } : null;
      });
      await setelWaktu(p, 450 + 170);
      const kMuncul = await kotakKartu();
      await setelWaktu(p, 450 + 640);
      const d = await baca();
      await setelWaktu(p, durasi - 20);
      const c = await baca();
      const kAkhir = await kotakKartu();
      cek(durasi >= 1200 && a.lama > 0.5 && a.kartu === 0 && a.lokasi === 'meja' && a.lokasiLama, `kartu ${vpNama}px: mula-mula larut dari parkiran (salinan adegan lama di atas, kartu belum tampil)`, { durasi, a });
      cek(b.lama === 0 && b.kartu !== null && b.kartu > 0 && b.mentor === 0, `kartu ${vpNama}px: sesudah larut, kartu mulai bergerak; Miss Raksa belum menunjuk`, b);
      cek(kMuncul && kAkhir && kMuncul.x < kAkhir.x - 10 && kMuncul.y > kAkhir.y && kMuncul.x > 0 && kMuncul.y <= kMuncul.h + 4,
        `kartu ${vpNama}px: muncul di tepi dekat meja di sisi pemain (kiri-bawah titik akhir, di dalam panggung)`, { kMuncul, kAkhir });
      cek(d.kartu === 1 && d.mentor === 0, `kartu ${vpNama}px: kartu sudah mendarat, Miss Raksa belum menunjuk (menanggapi, bukan memindahkan)`, d);
      cek(c.kartu === 1 && c.mentor === 1, `kartu ${vpNama}px: kartu mendarat, Miss Raksa menunjuk`, c);
      // Kartu digambar DI BAWAH lapisan tangan-di-meja: selama kartu bergerak (Miss Raksa masih mendengar dengan tangan
      // bertumpu di meja) kartu tidak boleh melintas di bawah / menyentuh tangan itu (temuan verifikasi 28 Sep).
      const lewat = await kartuLewatTangan(p, durasi);
      cek(lewat.n >= 20 && lewat.skalaSama && lewat.min !== null && lewat.min >= 0.5,
        `kartu ${vpNama}px: bingkai demi bingkai (${lewat.n} cuplikan / 20 md) kartu tidak melintas di bawah atau menyentuh tangan Miss Raksa di meja (celah min ${lewat.min} piksel seni)`, lewat);
      await lepasTahan(p);
      const i = await info(p);
      cek(!i.gerak && i.xAktor === 0 && i.pose.includes('mentor:duduk-tunjuk') && i.lokasi === 'meja', `kartu ${vpNama}px: komposisi akhir (menunjuk, kartu di meja)`, i);
      await tangkap(p, `kartu-akhir-${vpNama}`);
      await tutup(p);
    }
    // Telepon: pose telepon (gagang digambar oleh tokohnya), satu pesawat di meja tanpa gagang ganda, sisipan panggilan.
    {
      const p = await halaman({ vp, state: ST.telepon, pembuka: false });
      await tidur(400);
      await lengkapi(p); await tidur(80);
      await klikLanjut(p);
      const ok = await tungguGerak(p, 'pindah', 1500);
      await tungguDiam(p);
      await tidur(300);
      const i = await info(p);
      const t = await p.evaluate(() => {
        const dpr = window.devicePixelRatio;
        const pesawat = [...document.querySelectorAll('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-prop[data-prop="telepon"]')];
        const m = document.querySelector('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-tokoh[data-siapa="mentor"]:not([data-lapis])');
        const e = document.querySelector('.cer-pg-telepon-potret');
        const v = e?.querySelector('.cer-pg-telepon-varian[data-varian="dasar"]');
        const r = v?.getBoundingClientRect();
        const vb = v?.getAttribute('viewBox')?.split(/\s+/).map(Number);
        return {
          pesawat: pesawat.length,
          pesawatPng: pesawat.map((x) => x.querySelector('image')?.getAttribute('href') ?? 'svg'),
          frameMiss: m?.getAttribute('data-frame') ?? null,
          sisip: !!document.querySelector('.cer-pg-telepon'),
          nama: document.querySelector('.cer-pg-telepon b')?.textContent ?? '',
          potret: e ? {
            px: Math.round(e.getBoundingClientRect().width), jendela: Number(e.getAttribute('data-jendela')),
            piksel: e.hasAttribute('data-piksel') ? Number(e.getAttribute('data-piksel')) : null,
            // Piksel perangkat per piksel seni potret raster (lebar tampil x dpr / lebar viewBox) + asal di piksel perangkat.
            k: r && vb ? (r.width * dpr) / vb[2] : null, x: r ? r.x * dpr : null, y: r ? r.y * dpr : null,
          } : null,
        };
      });
      const bulat = (x) => x !== null && Math.abs(x - Math.round(x)) < 0.02;
      if (t.potret?.piksel) {
        // Potret PIKSEL (penyusun teleponSisipan): skala bulat, 1 piksel seni = `data-piksel` piksel perangkat, di kisi.
        cek(Number.isInteger(t.potret.piksel) && t.potret.piksel >= 1 && Math.abs(t.potret.k - t.potret.piksel) < 0.01 && bulat(t.potret.x) && bulat(t.potret.y),
          `telepon ${vpNama}px: potret sisipan piksel ${t.potret.px} px, ${t.potret.piksel} px perangkat per piksel seni (bulat, di kisi)`, t.potret);
      } else {
        // Aturan potret SVG (sama dengan Miss Raksa): <= 52 px jendela kecil (160), 53-75 px sedang (188), >= 76 V3 (220).
        const harus = t.potret ? (t.potret.px <= 52 ? 160 : t.potret.px <= 75 ? 188 : 220) : null;
        cek(t.potret && t.potret.jendela === harus, `telepon ${vpNama}px: potret sisipan ${t.potret?.px} px memakai jendela ${harus}`, t.potret);
      }
      cek(ok && !i.gerak && i.xAktor === 0 && i.pose.includes('mentor:telepon') && i.lokasi === 'telepon', `telepon ${vpNama}px: aksi berjalan lalu Miss Raksa pose telepon`, i);
      cek(t.pesawat === 1 && t.sisip && /Rina/.test(t.nama), `telepon ${vpNama}px: tepat satu pesawat telepon di meja, sisipan panggilan dengan nama`, t);
      // Gagang KEDUA: frame raster Miss Raksa `telepon-*` menggambar gagangnya sendiri, jadi pesawat di meja = PNG tanpa gagang.
      if (t.frameMiss) cek(/^telepon-/.test(t.frameMiss) && t.pesawatPng.length === 1 && /tanpa-gagang/.test(t.pesawatPng[0]), `telepon ${vpNama}px: tanpa gagang kedua (frame ${t.frameMiss} memegang gagang, pesawat meja tanpa gagang)`, t);
      await tangkap(p, `telepon-akhir-${vpNama}`);
      await tutup(p);
    }
    // Pergi: berjalan ke pintu menghadap kanan dengan gambar sendiri (tanpa cermin CSS), lalu kursi kosong.
    {
      const p = await halaman({ vp, state: ST.pergi, pembuka: false });
      await tidur(400);
      const durasi = await mulaiTerjeda(p);
      await setelWaktu(p, 1200);
      const w = await p.evaluate(() => ({
        cermin: [...document.querySelectorAll('[data-aktor="x:jalan:a"] .cer-pg-cermin, [data-aktor="x:jalan:b"] .cer-pg-cermin')].map((e) => e.style.transform || 'none'),
        pejalan: !!document.querySelector('[data-aktor="x:jalan"]'),
      }));
      cek(durasi > 0 && w.pejalan && w.cermin.length === 2 && w.cermin.every((c) => !/scaleX\(-1\)/.test(c)), `pergi ${vpNama}px: berjalan ke pintu dengan pose hadap kanan (tanpa cermin CSS)`, { durasi, w });
      await lepasTahan(p);
      const i = await info(p);
      cek(!i.gerak && i.xAktor === 0 && i.jumlahNasabah === 0, `pergi ${vpNama}px: komposisi akhir, kursi kosong`, i);
      await tutup(p);
    }
  }
}

async function ujiPanas() {
  const nilai = [];
  let mode = '';
  for (let k = 0; k < 3; k++) {
    const p = await halaman({ vp: H390, state: ST.awal, pembuka: false });
    const vite = await p.evaluate(() => performance.getEntriesByType('resource').some((e) => e.name.includes('/src/')));
    mode = vite ? 'Vite dev, CPU 1x' : 'build produksi, CPU 4x';
    await lengkapi(p);
    await tidur(1500); // pemain membaca baris: cache seni untuk kedatangan dipanaskan saat idle
    const cdp = await p.createCDPSession();
    if (!vite) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.evaluate(() => {
      window.__lt = [];
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask' }); } catch { /* tidak didukung */ }
      const tanda = () => [document.querySelector('.cer-main')?.getAttribute('data-node'), document.querySelector('.cer-dialog-teks')?.textContent ?? '', document.querySelector('.cer-panggung')?.getAttribute('data-gerak') ?? ''].join('|');
      const R = (window.__r = { awal: tanda(), t0: null, tCat: null });
      window.addEventListener('pointerdown', (e) => { if (R.t0 === null) R.t0 = e.timeStamp; }, { capture: true });
      const f = () => {
        if (R.t0 !== null && tanda() !== R.awal) {
          const mc = new MessageChannel();
          mc.port1.onmessage = () => { R.tCat = performance.now(); };
          mc.port2.postMessage(0);
          return;
        }
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    const kotak = await p.evaluate(() => { const e = [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await tidur(200);
    if (kotak) await p.mouse.click(kotak.x, kotak.y);
    await tidur(1200);
    const r = await p.evaluate(() => ({
      lt: window.__lt.slice(), gerak: document.querySelector('.cer-panggung')?.getAttribute('data-gerak') ?? null,
      respon: window.__r.t0 !== null && window.__r.tCat !== null ? Math.round(window.__r.tCat - window.__r.t0) : null,
    }));
    if (!vite) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    nilai.push(r.respon ?? Infinity);
    catat(`ketukan kedatangan #${k + 1} (${mode}): respons ${r.respon} md, tugas panjang ${JSON.stringify(r.lt)} md, gerak=${r.gerak}`);
    await tungguDiam(p);
    await tutup(p);
  }
  const urut = [...nilai].sort((a, b) => a - b);
  cek(urut[1] <= 200, `ketukan yang memulai kedatangan: respons median ${urut[1]} md <= 200 md (${mode}; ${nilai.join(', ')})`, nilai);
}

async function ujiHeap() {
  const p = await halaman({ state: ST.datang, pembuka: false });
  // Vite dev: bungkus generator final dengan pencatat id (modul sumber yang DIPAKAI halaman).
  const pencatat = await p.evaluate(async () => {
    const url = (bagian) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(bagian)).pop() ?? null;
    const [uIndex, uRina, uMiss] = [url('/src/cerita/seni/tokoh/index.ts'), url('/src/cerita/seni/tokoh/buRina.ts'), url('/src/cerita/seni/tokoh/missRaksa.ts')];
    if (!uIndex || !uRina || !uMiss) return false;
    try {
      const [m, r, mr] = await Promise.all([import(uIndex), import(uRina), import(uMiss)]);
      window.__idGambar = [];
      const catat = (siapa) => (o) => { window.__idGambar.push(`${siapa}:${o.id ?? ''}`); return siapa === 'rina' ? r.gambarBuRina(o) : mr.gambarMissRaksa(o); };
      m.pasangGenerator({ buRina: catat('rina'), missRaksa: catat('miss') });
      return true;
    } catch { return false; }
  });
  const cdp = await p.createCDPSession();
  await cdp.send('HeapProfiler.enable');
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.collectGarbage');
    return Math.round(((await cdp.send('Runtime.getHeapUsage')).usedSize / 1048576) * 100) / 100;
  };
  // Satu langkah: lengkapi/maju/pilih (jalur pendek 'ringan' -> kartu akhir -> ulang bab = panggung dipasang ulang).
  const langkah = () => p.evaluate(() => {
    const vis = (e) => e && e.getClientRects().length > 0;
    const t = document.querySelector('.cer-main')?.getAttribute('data-tampilan');
    if (t === 'aktivitas') return 'aktivitas';
    if (t === 'akhir') {
      const bab = document.querySelector('.akh-pemilih-bab') ?? document.querySelector('.akh-utama[data-bab]');
      if (bab) { bab.click(); return 'ulangBab'; }
      const b = [...document.querySelectorAll('.cer-main button')].find((x) => /Coba|jalur/i.test(x.textContent));
      if (b) { b.click(); return 'buka'; }
      return 'buntu';
    }
    const l = [...document.querySelectorAll('.cer-lanjut')].find(vis);
    if (document.querySelector('.cer-dialog-sisa') && l) { l.click(); return 'lengkapi'; }
    if (l) { l.click(); return 'maju'; }
    const o = [...document.querySelectorAll('.cer-opsi')].filter(vis);
    if (o.length) { (o.find((e) => ['ringan', 'tetap-ringan', 'dengar'].includes(e.getAttribute('data-pilihan'))) ?? o[0]).click(); return 'pilih'; }
    return 'buntu';
  });
  let maju = 0;
  let pasang = 0;
  let h40 = null;
  for (let i = 0; i < 900 && maju < 150; i++) {
    const j = await langkah();
    if (j === 'maju' || j === 'pilih') maju++;
    if (j === 'ulangBab') pasang++;
    if (j === 'aktivitas' || j === 'buntu') break;
    await tidur(j === 'lengkapi' ? 60 : 260);
    if (maju === 40 && h40 === null) { await tidur(600); h40 = await heap(); }
  }
  await tidur(800);
  const hAkhir = await heap();
  catat(`heap sesudah GC: langkah 40 = ${h40} MB, langkah ${maju} = ${hAkhir} MB (+${h40 === null ? '?' : (hAkhir - h40).toFixed(2)} MB), panggung dipasang ulang ${pasang}x`);
  cek(maju >= 120 && pasang >= 3, `jalur heap berjalan (${maju} langkah maju, ${pasang} ulang bab)`, { maju, pasang });
  if (pencatat) {
    const id = await p.evaluate(() => window.__idGambar);
    const panggung = id.filter((x) => /:pg/.test(x));
    // (Potret dialog/aktivitas memanggil generator langsung dari modulnya, tidak lewat pencatat ini.)
    catat(`${id.length} permintaan gambar tokoh lewat seni/tokoh/index.ts (panggung)`);
    cek(id.length > 50 && panggung.length === 0, `panggung tidak pernah meminta gambar dengan id per pemasangan (${panggung.length} dari ${id.length})`, panggung.slice(0, 6));
  } else {
    catat('DILEWATI pemeriksaan id: generator hanya bisa dibungkus lewat modul sumber (Vite dev)');
  }
  await tutup(p);
}

async function ujiKedip() {
  // Kedip yang SEDANG berjalan saat baris berganti (pose/wajah di tempat yang sama): salinan kedip masih berisi pose
  // LAMA (data-basi) sampai diperbarui saat idle. Tepat sesudah ketukan (bingkai yang sama) dan di bingkai berikutnya
  // tidak boleh ada salinan basi yang terlihat, kedip lama tidak boleh masih berjalan, dan paling banyak satu salinan
  // (dasar / kedip / mulut) tokoh itu terlihat. CPU diperlambat 4x supaya salinan kedip belum sempat diperbarui.
  const skenario = [
    ['Miss Raksa b2-ringan-akibat#1 -> #2 (duduk-dengar -> duduk-jelaskan)', stateDi('pergi', 'b2-ringan-akibat', 1), 'mentor'],
    ['Bu Rina b1-datang#1 -> #2 (kesal -> cemas)', stateDi('terbaik', 'b1-datang', 1), 'nasabah'],
  ];
  for (const [nama, st, siapa] of skenario) {
    const masalah = [];
    let diuji = 0;
    for (let coba = 0; coba < 3; coba++) {
      const p = await halaman({ state: st, pembuka: false });
      await lengkapi(p);
      await tidur(400);
      const cdp = await p.createCDPSession();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const r = await p.evaluate((siapa) => new Promise((selesai) => {
        const akar = document.querySelector(`.cer-pg-dunia[data-aktor="kamera"] [data-aktor="tokoh:${siapa}"]`);
        const kedip = akar?.querySelector('[data-varian="kedip"]');
        if (!akar || !kedip) { selesai({ gagal: 'tokoh / salinan kedip tidak ada' }); return; }
        const ukur = () => {
          const a = document.querySelector(`.cer-pg-dunia[data-aktor="kamera"] [data-aktor="tokoh:${siapa}"]`);
          const v = [...a.querySelectorAll('.cer-pg-varian[data-varian="dasar"], .cer-pg-varian[data-varian="kedip"], .cer-pg-varian[data-varian="bicara"]')];
          const terlihat = v.filter((e) => getComputedStyle(e).visibility === 'visible');
          return {
            terlihat: terlihat.map((e) => e.getAttribute('data-varian') + (e.hasAttribute('data-basi') ? '(basi)' : '')),
            kedipJalan: document.getAnimations().filter((x) => x.playState === 'running' && x.effect?.getTiming().duration === 120 && a.contains(x.effect?.target)).length,
          };
        };
        const mulai = performance.now();
        const cari = () => {
          const k = document.getAnimations().find((x) => x.effect?.target === kedip && x.playState === 'running');
          if (k && typeof k.currentTime === 'number' && k.currentTime < 60) {
            const sebelum = { basi: kedip.hasAttribute('data-basi'), node: document.querySelector('.cer-main')?.dataset.node };
            [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length)?.click();
            // React memproses pembaruan ketukan di microtask (sesudah callback ini, sebelum cat): diukur sesudahnya =
            // keadaan bingkai yang sama dengan ketukan; lalu sekali lagi di bingkai berikutnya.
            queueMicrotask(() => {
              const seketika = { ...ukur(), node: document.querySelector('.cer-main')?.dataset.node, basiAda: !!document.querySelector('.cer-pg-varian[data-basi]') };
              requestAnimationFrame(() => selesai({ sebelum, seketika, bingkai: ukur(), node: document.querySelector('.cer-main')?.dataset.node }));
            });
            return;
          }
          if (performance.now() - mulai > 15000) { selesai({ gagal: 'tidak ada kedip dalam 15 dtk' }); return; }
          requestAnimationFrame(cari);
        };
        cari();
      }), siapa);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      if (r.gagal) { catat(`${nama} #${coba + 1}: ${r.gagal}`); await tutup(p); continue; }
      diuji++;
      for (const [saat, u] of [['seketika', r.seketika], ['bingkai berikut', r.bingkai]]) {
        if (u.terlihat.some((x) => x.includes('basi')) || u.terlihat.length > 1 || u.kedipJalan > 0) masalah.push({ coba, saat, ...u });
      }
      catat(`${nama} #${coba + 1}: seketika ${JSON.stringify(r.seketika)}, bingkai berikut ${JSON.stringify(r.bingkai)}`);
      await tutup(p);
    }
    cek(diuji >= 2 && masalah.length === 0, `${nama}: kedip yang berjalan saat baris berganti dibatalkan, salinan basi tidak pernah terlihat (${diuji} percobaan)`, masalah.slice(0, 3));
  }
}

async function ujiFokus() {
  const aktif = (p) => p.evaluate(() => { const e = document.activeElement; return e === document.body || !e ? 'body' : e.classList.contains('cer-lanjut') ? 'lanjut' : e.classList.contains('cer-pg-lewati') ? 'lewati' : e.classList.contains('cer-alat-tombol') ? 'alat' : (e.className || e.tagName); });
  // a) Fokus di "Lewati pembuka" dan kedatangan selesai SENDIRI: fokus pindah ke Lanjut (tidak jatuh ke <body>).
  {
    const p = await halaman({ state: ST.awal, pembuka: false });
    await lengkapi(p); await tidur(100); await klikLanjut(p);
    const ok = await tungguGerak(p, 'masuk', 2000);
    await p.focus('.cer-pg-lewati');
    const f0 = await aktif(p);
    await tungguDiam(p);
    await tidur(200);
    const f1 = await aktif(p);
    const lewati = await p.evaluate(() => !!document.querySelector('.cer-pg-lewati'));
    cek(ok && f0 === 'lewati' && !lewati && f1 === 'lanjut', `"Lewati pembuka" hilang sendiri saat berfokus: fokus pindah ke Lanjut (${f0} -> ${f1})`, { f0, f1, lewati });
    await tutup(p);
  }
  // b) Pembuka yang selesai sendiri saat tombolnya berfokus: sama.
  {
    const p = await halaman({ vp: H390 });
    const ok = await tungguGerak(p, 'pembuka', 2000);
    await p.focus('.cer-pg-lewati');
    await tungguDiam(p);
    await tidur(200);
    cek(ok && (await aktif(p)) === 'lanjut', 'pembuka selesai sendiri saat "Lewati pembuka" berfokus: fokus ke Lanjut', await aktif(p));
    await tutup(p);
  }
  // c) Enter pada "Lewati pembuka": gerak selesai, fokus ke Lanjut (perilaku lama tetap).
  {
    const p = await halaman({ state: ST.awal, pembuka: false });
    await lengkapi(p); await tidur(100); await klikLanjut(p);
    const mulai = await tungguGerak(p, 'masuk', 2000);
    await p.focus('.cer-pg-lewati');
    const f0 = await aktif(p);
    await p.evaluate(() => {
      window.__penanda = true;
      window.__jejakFokus = [];
      document.addEventListener('focusin', (e) => window.__jejakFokus.push(`in:${e.target.className}`), true);
      document.addEventListener('focusout', (e) => window.__jejakFokus.push(`out:${e.target.className}`), true);
    });
    await p.keyboard.press('Enter');
    await tidur(200);
    const i = await info(p);
    const jejak = await p.evaluate(() => ({ muatUlang: window.__penanda !== true, fokus: window.__jejakFokus ?? null }));
    cek(!i.gerak && (await aktif(p)) === 'lanjut', 'Enter pada "Lewati pembuka": gerak selesai, fokus ke Lanjut', { mulai, f0, gerak: i.gerak, aktif: await aktif(p), ...jejak, node: i.node });
    await tutup(p);
  }
  // d) Fokus di tempat lain (tombol Riwayat) atau tanpa fokus saat gerak selesai: fokus TIDAK diambil.
  for (const [nama, pasang] of [['tombol Riwayat', (p) => p.focus('.cer-alat-tombol')], ['tanpa fokus', (p) => p.evaluate(() => document.activeElement?.blur?.())]]) {
    const p = await halaman({ state: ST.awal, pembuka: false });
    await lengkapi(p); await tidur(100); await klikLanjut(p);
    await tungguGerak(p, 'masuk', 2000);
    // Tunggu dua bingkai: pemulihan fokus CeritaMain sesudah ganti tampilan (klik Lanjut) berjalan di rAF berikutnya dan
    // memang memindahkan fokus yang hilang ke Lanjut (aturan v2). Yang diuji di sini hanya SELESAINYA kedatangan.
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pasang(p);
    const f0 = await aktif(p);
    await tungguDiam(p);
    await tidur(200);
    const f1 = await aktif(p);
    cek(f0 === f1 && f1 !== 'lanjut', `${nama} saat kedatangan selesai: fokus tidak dipindahkan (${f0} -> ${f1})`, { f0, f1 });
    await tutup(p);
  }
}

async function ujiTombol() {
  // Baris bertombol istilah (narasi pintu b1-mentor.4, "Apa itu nasabah?"): ruang baris istilah dipesan selama kalimat
  // diketik, jadi tombol Lanjut TIDAK bergeser saat kalimat utuh (ketukan menjelang selesai tidak meleset). Tombol
  // istilah sungguhan baru ada sesudah kalimat utuh.
  for (const [vpNama, vp] of [['390', H390], ['1440', D1440]]) {
    const p = await halaman({ vp, state: ST.awal, pembuka: false });
    await lengkapi(p); await tidur(100); await klikLanjut(p);
    await tidur(60);
    const baca = () => p.evaluate(() => {
      const l = [...document.querySelectorAll('.cer-lanjut')].find((x) => x.getClientRects().length)?.getBoundingClientRect();
      const d = document.querySelector('.cer-dialog')?.getBoundingClientRect();
      return {
        sisa: document.querySelector('.cer-dialog-sisa')?.textContent?.length ?? 0,
        tombol: document.querySelectorAll('.cer-istilah-tombol').length,
        cadangan: [...document.querySelectorAll('.cer-istilah-cadangan')].map((e) => ({ vis: getComputedStyle(e).visibility, aria: e.getAttribute('aria-hidden'), inert: e.inert, fokus: e.querySelectorAll('button, a, [tabindex]').length })),
        lanjut: l ? { x: Math.round(l.x), y: Math.round(l.y + window.scrollY) } : null,
        dialogH: d ? Math.round(d.height) : null,
      };
    });
    const a = await baca();
    for (let k = 0; k < 80 && (await baca()).sisa > 0; k++) await tidur(50);
    await tidur(150);
    const b = await baca();
    cek(a.sisa > 0 && a.tombol === 0 && a.cadangan.length === 1 && a.cadangan[0].vis === 'hidden' && a.cadangan[0].aria === 'true' && a.cadangan[0].inert && a.cadangan[0].fokus === 0,
      `${vpNama}px b1-mentor.4 selama diketik: tanpa tombol istilah; ruang barisnya dipesan (tak terlihat, aria-hidden, inert, tanpa kontrol)`, a);
    cek(b.sisa === 0 && b.tombol >= 1 && b.cadangan.length === 0, `${vpNama}px b1-mentor.4 sesudah utuh: tombol istilah tampil`, b);
    cek(a.lanjut && b.lanjut && a.lanjut.y === b.lanjut.y && a.lanjut.x === b.lanjut.x && a.dialogH === b.dialogH,
      `${vpNama}px: tombol Lanjut tidak bergeser saat kalimat utuh (y ${a.lanjut?.y} -> ${b.lanjut?.y}, kotak ${a.dialogH} -> ${b.dialogH} px)`, { a, b });
    await tutup(p);
  }
}

async function ujiHub() {
  // Kartu episode /cerita: potongan ruang layanan v3 (papan nama Raksa Silver Club, lapisan ruang panggung) di sekitar
  // Bu Rina, diam (tanpa animasi), ukuran kartu tetap; ?adegan=ringan di /cerita tersimpan & terbawa ke episode.
  for (const [vpNama, vp] of [['390', H390], ['1440', D1440]]) {
    const ctx = await peramban.createBrowserContext();
    const p = await ctx.newPage();
    p.galat = [];
    p.on('pageerror', (e) => p.galat.push(String(e).slice(0, 240)));
    p.on('console', (m) => { if (m.type() === 'error' && !GALAT_ABAIKAN.test(m.text())) p.galat.push('konsol: ' + m.text().slice(0, 240)); });
    await p.setViewport(vp);
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.evaluate((profil) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('raksa:profil', profil); localStorage.setItem('raksa:cerita:petunjuk', '1'); localStorage.setItem('raksa:gerak', 'penuh'); }, PROFIL);
    await p.goto(BASE + '/cerita?adegan=ringan', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('.cer-ep-seni svg', { timeout: 30000 });
    await tidur(300);
    const k = await p.evaluate(() => {
      const s = document.querySelector('.cer-ep-seni');
      const r = s.getBoundingClientRect();
      return {
        papan: s.querySelector('text')?.textContent ?? (s.querySelector('image[href*="ruang-meja-latar"]') ? 'dipanggang di latar piksel' : null), latarLama: !!s.querySelector('.cseni-latar'),
        seni: [Math.round(r.width), Math.round(r.height)], anim: document.getAnimations().filter((a) => s.contains(a.effect?.target)).length,
        adegan: localStorage.getItem('raksa:adegan'), elemen: s.querySelectorAll('*').length,
      };
    });
    await tangkap(p, `kartu-${vpNama}`);
    const ukuranOk = vpNama === '390' ? k.seni[1] === 150 : k.seni[0] === 280 && k.seni[1] >= 220;
    cek((k.papan === 'Raksa Silver Club' || k.papan === 'dipanggang di latar piksel') && !k.latarLama && k.anim === 0 && ukuranOk, `/cerita ${vpNama}px: kartu episode memakai ruang layanan v3 (papan nama, tanpa latar kantor lama), diam, ukuran seni tetap (${k.seni.join('x')})`, k);
    cek(k.adegan === 'ringan', `/cerita?adegan=ringan ${vpNama}px: pilihan mode ringan tersimpan`, k.adegan);
    await p.evaluate(() => document.querySelector('.cer-ep-aksi a.primary-action')?.click());
    await p.waitForSelector('.cer-panggung', { timeout: 30000 });
    await tidur(200);
    const i = await info(p);
    const diam = await p.evaluate(() => document.querySelector('.cer-panggung')?.hasAttribute('data-diam'));
    cek(diam && !i.gerak && i.anim === 0, `/cerita?adegan=ringan ${vpNama}px -> Mulai: episode dalam mode ringan (tanpa pembuka, 0 animasi)`, { diam, i });
    await tutup(p);
  }
}

// ------------------------------------------------------------------ piksel bulat

/** Tunggu ruang piksel tampil (manifest terpasang & PNG didekode). */
async function tungguPiksel(p, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await p.evaluate(() => {
      const pg = document.querySelector('.cer-panggung');
      return pg?.getAttribute('data-seni') === 'piksel' && !pg.querySelector('.cer-pg-dunia[data-aktor="kamera"][data-memuat]');
    });
    if (ok) return true;
    await tidur(50);
  }
  return false;
}

/** Kamera & kotak yang diukur di halaman (px CSS) + devicePixelRatio. */
const ukurPiksel = (p) => p.evaluate(() => {
  const pg = document.querySelector('.cer-panggung');
  const d = pg?.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
  if (!pg || !d) return null;
  const m = new DOMMatrixReadOnly(getComputedStyle(d).transform);
  const latar = d.querySelector(':scope > .cer-pg-piksel:not(.cer-pg-tepi)');
  const rl = latar?.getBoundingClientRect();
  const rp = pg.getBoundingClientRect();
  return {
    seni: pg.getAttribute('data-seni'), k: Number(pg.getAttribute('data-piksel')), dprData: Number(pg.getAttribute('data-dpr')), asal: pg.getAttribute('data-asal'),
    dpr: devicePixelRatio, s: m.a, tx: m.e, ty: m.f, gerak: pg.getAttribute('data-gerak'),
    latar: rl ? { x: rl.x, y: rl.y, w: rl.width, h: rl.height } : null,
    panggung: { x: rp.x + pg.clientLeft, y: rp.y + pg.clientTop, w: pg.clientWidth, h: pg.clientHeight },
    latarPanggung: getComputedStyle(pg).backgroundColor,
    pikselImg: [...d.querySelectorAll('.cer-pg-piksel image')].every((e) => getComputedStyle(e).imageRendering === 'pixelated'),
    tepi: d.querySelectorAll(':scope > .cer-pg-tepi').length,
  };
});

/**
 * Panjang deret warna pita papan catur (fixture) di tangkapan layar (px perangkat). Baris: tiap baris pita dibaca
 * di tengahnya, deret A/B yang diapit A/B di kedua sisi = satu piksel seni penuh. Kolom: beberapa kolom di dalam pita.
 */
function analisaPita(png, u) {
  const img = PNG.sync.read(png);
  const dpr = u.dpr;
  const warna = (x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
  const kelas = (c) => (c.every((v, j) => Math.abs(v - WARNA_A[j]) <= 3) ? 'A' : c.every((v, j) => Math.abs(v - WARNA_B[j]) <= 3) ? 'B' : '-');
  const deret = (nilai) => {
    const d = [];
    for (const v of nilai) { if (d.length && d[d.length - 1][0] === v) d[d.length - 1][1]++; else d.push([v, 1]); }
    const dalam = [];
    for (let i = 1; i < d.length - 1; i++) if (d[i][0] !== '-' && d[i - 1][0] !== '-' && d[i + 1][0] !== '-') dalam.push(d[i][1]);
    return dalam;
  };
  const x0 = Math.ceil(Math.max(u.panggung.x, u.latar.x) * dpr) + 1;
  const x1 = Math.floor(Math.min(u.panggung.x + u.panggung.w, u.latar.x + u.latar.w) * dpr) - 1;
  const baris = [];
  const semua = [];
  for (let r = 0; r < PITA.baris; r++) {
    const y = Math.round((u.latar.y + ((PITA.y0 + r + 0.5) * u.latar.h) / 225) * dpr);
    if (y < 0 || y >= img.height || y < u.panggung.y * dpr || y > (u.panggung.y + u.panggung.h) * dpr) continue;
    const nilai = [];
    for (let x = Math.max(0, x0); x <= Math.min(img.width - 1, x1); x++) nilai.push(kelas(warna(x, y)));
    const d = deret(nilai);
    baris.push({ y, n: d.length, panjang: [...new Set(d)].sort((a, b) => a - b) });
    semua.push(...d);
  }
  const kolom = [];
  const ya = Math.round((u.latar.y + ((PITA.y0 - 2) * u.latar.h) / 225) * dpr);
  const yb = Math.round((u.latar.y + ((PITA.y0 + PITA.baris + 2) * u.latar.h) / 225) * dpr);
  // Banyak kolom contoh: tokoh (piksel, lebih besar) boleh menutupi sebagian pita; kolom tertutup = tanpa deret.
  for (const f of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]) {
    const x = Math.round(x0 + (x1 - x0) * f);
    const nilai = [];
    for (let y = Math.max(0, ya); y <= Math.min(img.height - 1, yb); y++) nilai.push(kelas(warna(x, y)));
    const d = deret(nilai);
    if (d.length) kolom.push({ x, panjang: d });
  }
  return { baris, kolom, semua, kolomSemua: kolom.flatMap((k) => k.panjang) };
}

/**
 * Ruang piksel ASLI (seni/piksel/ruang.json): baris dinding teratas yang terlihat (3 baris piksel seni, jauh dari
 * kepala tokoh) dibaca per warna persis; setiap deret di antara tepi potongan harus kelipatan k piksel perangkat
 * (satu piksel seni = k px, piksel bertetangga yang sewarna menyatu menjadi 2k, 3k, ...).
 */
function analisaKelipatan(png, u) {
  const img = PNG.sync.read(png);
  const dpr = u.dpr;
  const skala = u.latar.h / 900; // px CSS per satuan dunia
  // Sudut panggung membulat (radius <= 20 px CSS, antialias): baris dibaca 24 px CSS dari tepi kiri/kanan panggung.
  const x0 = Math.ceil((Math.max(u.panggung.x, u.latar.x) + 24) * dpr);
  const x1 = Math.floor((Math.min(u.panggung.x + u.panggung.w, u.latar.x + u.latar.w) - 24) * dpr);
  const baris0 = Math.ceil((u.panggung.y + 4 - u.latar.y) / skala / 4); // baris piksel seni pertama yang utuh terlihat
  const hasil = [];
  for (const b of [baris0, baris0 + 2, baris0 + 4]) {
    const y = Math.round((u.latar.y + (b * 4 + 2) * skala) * dpr);
    if (y < 0 || y >= img.height) continue;
    const d = [];
    let lalu = null;
    for (let x = Math.max(0, x0); x <= Math.min(img.width - 1, x1); x++) {
      const i = (y * img.width + x) * 4;
      const c = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
      if (c === lalu) d[d.length - 1]++; else { d.push(1); lalu = c; }
    }
    const dalam = d.slice(1, -1);
    hasil.push({ baris: b, y, deret: dalam.length, bukanKelipatan: dalam.filter((n) => n % u.k !== 0).slice(0, 12), terpendek: Math.min(...dalam) });
  }
  return hasil;
}

/** true bila UI_BASE adalah Vite dev (modul /@vite/client tersaji sebagai JavaScript). */
async function adaViteDev() {
  try {
    const r = await fetch(BASE + '/@vite/client');
    return r.ok && /javascript/.test(r.headers.get('content-type') ?? '');
  } catch {
    return false;
  }
}

/**
 * KAMERA KEDATANGAN v5 (review HP 28 Sep: pembuka dekat -> seluruh ruangan jauh (k 1) -> percakapan dekat lagi).
 * Ruang & tokoh piksel ASLI, gerak penuh, dari mulai baru: lewati pembuka, lalu narasi pintu (aksi masuk). Transform
 * kamera dicuplik tiap bingkai (rAF) selama kedatangan: k (piksel perangkat per piksel seni) TIDAK PERNAH di bawah k
 * percakapan akhir (tidak menjauh ke seluruh ruangan), skala tidak naik lagi sesudah turun (tanpa dekat-jauh-dekat),
 * dan sebagian daun/bukaan pintu tampak di panggung selama kedatangan (HP >= 360 px dpr 2 & desktop). Desktop
 * 1440x900: k tetap sepanjang kedatangan (bingkai percakapan sudah memuat pintu).
 */
async function ujiKamera() {
  const VPK = [
    ['390x844@2', H390, true],
    ['360x740@2', { width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, true],
    ['844x390@2', { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, true],
    ['390x844@3', { ...H390, deviceScaleFactor: 3 }, true],
    ['1440x900', D1440, true],
  ];
  for (const [nama, vp, pintuHarus] of VPK) {
    let hasil = null;
    for (let coba = 0; coba < 3 && !hasil; coba++) {
      const p = await halaman({ vp, piksel: false });
      await klikLewati(p);
      await tungguDunia(p);
      await lengkapi(p);
      await tidur(200);
      await p.evaluate(() => {
        const cuplik = [];
        window.__kamera = cuplik;
        const pg = document.querySelector('.cer-panggung');
        const ambil = () => {
          const e = pg.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
          const pt = pg.querySelector('[data-aktor="pintu"]');
          const r = pg.getBoundingClientRect();
          const m = e ? new DOMMatrixReadOnly(getComputedStyle(e).transform) : null;
          let pintu = 0;
          if (pt) {
            const q = pt.getBoundingClientRect();
            pintu = Math.max(0, Math.min(q.right, r.right) - Math.max(q.left, r.left));
          }
          cuplik.push({ t: performance.now(), s: m ? m.a : null, x: m ? m.e : null, gerak: pg.getAttribute('data-gerak'), pintu, lebar: r.width });
        };
        const lingkar = () => { ambil(); if (cuplik.length < 2000) requestAnimationFrame(lingkar); };
        requestAnimationFrame(lingkar);
      });
      await klikLanjut(p);
      const mulai = await tungguGerak(p, 'masuk', 3000);
      await tungguDiam(p, 8000);
      await tidur(300);
      const c = await p.evaluate(() => window.__kamera.splice(0));
      const hmr = p.hmr;
      await tangkap(p, `akhir-${nama}`);
      await tutup(p);
      if (!mulai || hmr) { catat(`${nama}: kedatangan tidak mulai / HMR (${hmr}) - diulang`); continue; }
      hasil = c;
    }
    if (!cek(!!hasil, `${nama}: kedatangan tercuplik`)) continue;
    const q = 4 * vp.deviceScaleFactor;
    const selama = hasil.filter((x) => x.gerak === 'masuk' && x.s);
    const kAkhir = hasil.filter((x) => !x.gerak && x.s).map((x) => Math.round(x.s * q * 1000) / 1000).pop();
    const ks = selama.map((x) => Math.round(x.s * q * 1000) / 1000);
    const kMin = Math.min(...ks);
    let naik = 0;
    for (let i = 1; i < ks.length; i++) if (ks[i] > ks[i - 1] + 0.01) naik++;
    const pintuMaks = Math.max(0, ...selama.map((x) => x.pintu));
    catat(`${nama}: ${selama.length} bingkai, k ${ks[0]} -> min ${kMin} -> akhir ${kAkhir}; pintu tampak maks ${pintuMaks.toFixed(0)} px CSS`);
    cek(selama.length >= 10 && kMin >= kAkhir - 0.01, `${nama}: kedatangan tidak pernah lebih jauh daripada percakapan (k min ${kMin} >= k akhir ${kAkhir})`, { ks: ks.filter((_, i) => i % 5 === 0) });
    cek(naik === 0, `${nama}: tanpa kamera dekat-jauh-dekat (skala tidak naik lagi selama kedatangan)`, { naik, ks: ks.filter((_, i) => i % 5 === 0) });
    if (nama === '1440x900') cek(ks.every((k) => Math.abs(k - kAkhir) < 0.01), `${nama}: desktop tanpa zoom selama kedatangan`, { ks: [...new Set(ks)] });
    if (pintuHarus) cek(pintuMaks >= 8, `${nama}: sebagian pintu tampak selama kedatangan (${pintuMaks.toFixed(0)} px CSS)`, { pintuMaks });
  }
}

async function ujiPiksel() {
  const VP = [
    ['1440x900', D1440],
    ['1920x1080', { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false }],
    ['390x844@2', H390],
    ['360x740@2', { width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['844x390@2', { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['1440x900@1.25', { ...D1440, deviceScaleFactor: 1.25 }],
    ['1440x900@1.5', { ...D1440, deviceScaleFactor: 1.5 }],
  ];
  // 1) Ruang piksel ASLI (bila seni/piksel/ruang.json terpasang): tangkapan layar per ukuran + deret kelipatan k.
  for (const [nama, vp] of VP) {
    const p = await halaman({ vp, state: ST.datang, pembuka: false, piksel: false });
    const siap = await tungguPiksel(p, 6000);
    if (!siap) { catat(`${nama}: ruang piksel asli tidak tampil (manifest belum ada?) - DILEWATI`); await tutup(p); break; }
    await lengkapi(p);
    await tidur(500);
    const u = await ukurPiksel(p);
    const kHitung = u.s * 4 * u.dpr;
    const bulat = (v) => Math.abs(v - Math.round(v)) < 0.02;
    cek(u.k >= 1 && Math.abs(kHitung - u.k) < 1e-3, `ASLI ${nama}: skala kamera x 4 x dpr = ${kHitung.toFixed(4)} bulat (k ${u.k})`, u);
    cek(bulat(u.latar.x * u.dpr) && bulat(u.latar.y * u.dpr), `ASLI ${nama}: asal dunia di piksel perangkat bulat (${(u.latar.x * u.dpr).toFixed(3)}, ${(u.latar.y * u.dpr).toFixed(3)})`, u);
    const shot = await p.screenshot({ type: 'png', captureBeyondViewport: false });
    if (OUT) {
      fs.writeFileSync(path.join(OUT, `asli-${nama}.png`), shot);
      await p.screenshot({ path: path.join(OUT, `asli-${nama}-panggung.png`), clip: { x: u.panggung.x, y: u.panggung.y, width: u.panggung.w, height: u.panggung.h } });
    }
    const a = analisaKelipatan(shot, u);
    catat(`ASLI ${nama}: k ${u.k}, dpr ${u.dpr}, baris ${JSON.stringify(a)}`);
    cek(a.length >= 2 && a.reduce((n, b) => n + b.deret, 0) >= 10 && a.every((b) => b.deret >= 2 && b.bukanKelipatan.length === 0), `ASLI ${nama}: baris dinding di tangkapan layar: semua deret warna kelipatan ${u.k} px perangkat`, a);
    await tutup(p);
  }

  // 2) Ruang piksel UJI (papan catur): panjang deret persis k. Kait uji (localStorage raksa:uji:ruang-piksel) hanya
  //    aktif di Vite dev (sumberPiksel.ts), jadi di build produksi bagian 2-5 DILEWATI dengan catatan.
  if (!(await adaViteDev())) {
    catat('DILEWATI ruang piksel UJI (papan catur, PNG ditunda, PNG 404): kait uji hanya aktif di Vite dev; ruang ASLI di atas tetap diperiksa');
    return;
  }
  for (const [nama, vp] of VP) {
    const p = await halaman({ vp, state: ST.datang, pembuka: false, piksel: true });
    const siap = await tungguPiksel(p);
    await lengkapi(p);
    await tidur(500);
    const u = await ukurPiksel(p);
    if (!cek(siap && u && u.seni === 'piksel' && u.latar, `${nama}: ruang piksel tampil (manifest + PNG didekode)`, u)) { await tutup(p); continue; }
    const kHitung = u.s * 4 * u.dpr;
    const bulat = (v) => Math.abs(v - Math.round(v)) < 0.02;
    cek(u.k >= 1 && Math.abs(kHitung - u.k) < 1e-3 && u.dprData === u.dpr, `${nama}: skala kamera x 4 x dpr = ${kHitung.toFixed(4)} bulat (k ${u.k}, dpr ${u.dpr})`, u);
    cek(bulat(u.latar.x * u.dpr) && bulat(u.latar.y * u.dpr), `${nama}: asal dunia (tepi piksel seni) di piksel perangkat bulat (${(u.latar.x * u.dpr).toFixed(3)}, ${(u.latar.y * u.dpr).toFixed(3)}; asal kotak ${u.asal})`, u);
    cek(u.pikselImg, `${nama}: semua <image> raster image-rendering: pixelated`);
    const letterbox = u.latar.x > u.panggung.x + 0.5 || u.latar.x + u.latar.w < u.panggung.x + u.panggung.w - 0.5 || u.latar.y > u.panggung.y + 0.5 || u.latar.y + u.latar.h < u.panggung.y + u.panggung.h - 0.5;
    if (letterbox) cek(u.tepi === 8, `${nama}: letterbox = tepi latar diperpanjang (8 potongan tepi, bukan pita kosong)`, u);
    const shot = await p.screenshot({ type: 'png', captureBeyondViewport: false });
    if (OUT) {
      fs.writeFileSync(path.join(OUT, `piksel-${nama}.png`), shot);
      await p.screenshot({ path: path.join(OUT, `piksel-${nama}-panggung.png`), clip: { x: u.panggung.x, y: u.panggung.y, width: u.panggung.w, height: u.panggung.h } });
    }
    const a = analisaPita(shot, u);
    const salah = a.semua.filter((n) => n !== u.k);
    catat(`${nama}: k ${u.k}, pandangan dunia ${letterbox ? 'LETTERBOX' : 'penuh'}, deret baris ${a.semua.length} (panjang ${JSON.stringify(a.baris.map((b) => b.panjang))}), kolom ${JSON.stringify(a.kolom.map((k) => k.panjang))}`);
    cek(a.semua.length >= 20 && salah.length === 0, `${nama}: tangkapan layar, pita papan catur: ${a.semua.length} deret baris semuanya ${u.k} px perangkat`, { salah: salah.slice(0, 20), baris: a.baris });
    cek(a.kolomSemua.length >= 2 && a.kolomSemua.every((n) => n === u.k), `${nama}: pita papan catur arah kolom: deret ${u.k} px perangkat`, a.kolom);
    await tutup(p);
  }

  // Zoom peramban di halaman yang sama (1440x900 layar, zoom 125/150/200/100 %): viewport CSS mengecil & DPR naik
  // bersamaan (seperti Ctrl +), k dihitung ulang dan tetap bulat, asal dunia tetap di piksel perangkat.
  // (Perubahan deviceScaleFactor SAJA lewat CDP tidak memicu peristiwa apa pun di Chrome headless (resize / media
  // query resolusi), jadi tidak bisa diuji di sini; di peramban sungguhan pindah layar memicu media query resolusi.)
  {
    const p = await halaman({ vp: D1440, state: ST.datang, pembuka: false, piksel: true });
    await tungguPiksel(p);
    await lengkapi(p);
    await tidur(300);
    const hasilDpr = [];
    for (const z of [1.25, 1.5, 2, 1]) {
      await p.setViewport({ width: Math.round(1440 / z), height: Math.round(900 / z), deviceScaleFactor: z, isMobile: false, hasTouch: false });
      await tidur(500);
      const u = await ukurPiksel(p);
      hasilDpr.push({ zoom: z, dataDpr: u.dprData, k: u.k, kHitung: +(u.s * 4 * u.dpr).toFixed(4), asal: [+(u.latar.x * u.dpr).toFixed(3), +(u.latar.y * u.dpr).toFixed(3)] });
      if (OUT) await p.screenshot({ path: path.join(OUT, `piksel-zoom-${z}.png`) });
    }
    catat(`zoom di halaman yang sama: ${JSON.stringify(hasilDpr)}`);
    const bulat = (v) => Math.abs(v - Math.round(v)) < 0.02;
    cek(hasilDpr.every((h) => h.dataDpr === h.zoom && h.k >= 1 && Math.abs(h.kHitung - h.k) < 1e-3 && h.asal.every(bulat)), 'zoom peramban 125 -> 150 -> 200 -> 100 % di halaman yang sama: kamera dihitung ulang, skala & asal tetap bulat', hasilDpr);
    await tutup(p);
  }

  // PNG ditunda 2,5 dtk: dialog langsung tampil & mengetik; dunia raster tak terlihat (warna ruang polos); lalu muncul.
  {
    const p = await halaman({ vp: H390, state: ST.datang, pembuka: false, piksel: true, pikselTunda: 2500 });
    await tidur(300);
    const a = await p.evaluate(() => {
      const pg = document.querySelector('.cer-panggung');
      const d = pg?.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
      return {
        seni: pg?.getAttribute('data-seni'), memuat: !!d?.hasAttribute('data-memuat'), opasitas: d ? getComputedStyle(d).opacity : null,
        latar: pg ? getComputedStyle(pg).backgroundColor : null, dialog: !!document.querySelector('.cer-dialog'),
        teks: (document.querySelector('.cer-dialog-teks')?.textContent ?? '').length,
      };
    });
    cek(a.seni === 'piksel' && a.memuat && a.opasitas === '0' && /^rgb\(/.test(a.latar ?? '') && a.dialog && a.teks > 0, 'PNG belum didekode: dialog sudah tampil, dunia raster tersembunyi di atas warna panggung polos', a);
    await tangkap(p, 'memuat');
    const siap = await tungguPiksel(p, 8000);
    const b = await p.evaluate(() => {
      const d = document.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
      return { muncul: !!d?.hasAttribute('data-muncul'), animasi: document.getAnimations().filter((x) => x.animationName === 'cer-pg-muncul').length };
    });
    await tidur(400);
    const c = await p.evaluate(() => getComputedStyle(document.querySelector('.cer-pg-dunia[data-aktor="kamera"]')).opacity);
    cek(siap && b.muncul && c === '1', 'PNG siap: dunia raster muncul sekali (pudar masuk), lalu tampil penuh', { siap, ...b, opasitas: c });
    await tutup(p);
  }

  // PNG gagal (404): kembali ke ruang SVG, cerita tetap maju.
  {
    const p = await halaman({ vp: D1440, state: ST.datang, pembuka: false, piksel: true, pikselGagal: true });
    const t0 = Date.now();
    let seni = null;
    while (Date.now() - t0 < 6000) {
      seni = await p.evaluate(() => document.querySelector('.cer-panggung')?.getAttribute('data-seni'));
      if (seni === 'svg') break;
      await tidur(50);
    }
    const l0 = await p.evaluate(() => JSON.parse(localStorage.getItem('raksa:cerita')).episode['auto-1'].state.langkah);
    await lengkapi(p); await tidur(60); await klikLanjut(p); await tidur(300);
    const b = await p.evaluate(() => ({
      memuat: !!document.querySelector('.cer-pg-dunia[data-memuat]'), dialog: !!document.querySelector('.cer-dialog'),
      langkah: JSON.parse(localStorage.getItem('raksa:cerita')).episode['auto-1'].state.langkah, lapisan: document.querySelectorAll('.cer-pg-dunia .cer-pg-lapisan').length,
    }));
    cek(seni === 'svg' && !b.memuat && b.dialog && b.lapisan > 0 && b.langkah > l0, 'PNG ruang gagal (404): panggung kembali ke ruang SVG, dialog tetap, cerita maju', { seni, ...b, l0 });
    await tangkap(p, 'gagal-svg');
    await tutup(p);
  }

  // Gerak dikurangi: tanpa animasi pudar masuk; ruang piksel tetap bulat.
  {
    const p = await halaman({ vp: D1440, state: ST.datang, pembuka: false, piksel: true, gerak: 'kurang', pikselTunda: 800 });
    const siap = await tungguPiksel(p);
    const u = await ukurPiksel(p);
    const anim = await p.evaluate(() => document.getAnimations().length);
    cek(siap && u.k >= 1 && anim === 0, 'gerak dikurangi: ruang piksel muncul tanpa animasi, kamera bulat', { siap, k: u.k, anim });
    await tutup(p);
  }
}

async function ujiTokohPiksel() {
  for (const [vpNama, vp] of [['1440', D1440], ['390', H390]]) {
    const p = await halaman({ vp, state: ST.datang, pembuka: false, piksel: true });
    await tungguPiksel(p);
    const modul = await p.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/cerita/seni/tokoh/index.ts')).pop() ?? null;
      if (!url) return null;
      try { await import(url); return url; } catch { return null; }
    });
    if (!modul) { catat('DILEWATI: penggambar tokoh hanya bisa diganti lewat modul sumber (Vite dev)'); await p.browserContext().close(); return; }
    await p.evaluate(async (url) => {
      const m = await import(url);
      const png = '/__uji-piksel/tokoh.png';
      const atlas = { w: 64, h: 96 };
      const potong = (x, y, w, h) => ({ url: png, atlas, sumber: { x, y, w, h } });
      const gambar = (o) => ({
        svg: '', w: 160, h: 240, jangkar: { x: 80, y: 236 }, kepala: { x: 80, y: 40 }, kepalaTinggi: 64,
        tangan: { kanan: { x: 124, y: 164 } },
        piksel: potong(0, 0, 40, 60),
        tempelan: [{ p: potong(40, 0, 12, 12), x: 14, y: 4 }, ...(o.kedip ? [{ p: potong(40, 12, 12, 4), x: 14, y: 8 }] : []), ...(o.bicara ? [{ p: potong(40, 16, 6, 3), x: 17, y: 12 }] : [])],
        diAtasMejaPiksel: [{ x: 0, y: 144, w: 160, h: 48 }],
      });
      m.pasangGenerator({ missRaksa: gambar, buRina: gambar });
      window.__ujiTokohPiksel = true;
    }, modul);
    // Baris berikut (ekspresi Bu Rina berubah) = susunan baru dengan penggambar raster.
    await lengkapi(p); await tidur(60); await klikLanjut(p);
    await tungguDiam(p);
    await tidur(300);
    const a = await p.evaluate(() => {
      const d = document.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
      const tokoh = [...d.querySelectorAll(':scope > .cer-pg-tokoh:not([data-lapis])')];
      return tokoh.map((t) => {
        const napas = t.querySelector('.cer-pg-napas');
        const varian = [...t.querySelectorAll('[data-varian]')].map((v) => ({
          v: v.getAttribute('data-varian'), raster: v.classList.contains('cer-pg-piksel'), tempel: v.querySelectorAll(':scope > svg > image').length,
          gambar: v.querySelectorAll('image').length, kiri: parseFloat(v.style.left), atas: parseFloat(v.style.top),
        }));
        const atasMeja = d.querySelector(`.cer-pg-diatas-meja[data-lapis="diatas-meja"]`);
        return {
          siapa: t.getAttribute('data-siapa'), piksel: t.hasAttribute('data-piksel'), transform: t.style.transform,
          kiri: parseFloat(t.style.left), atas: parseFloat(t.style.top),
          napasPiksel: napas?.hasAttribute('data-piksel') ?? false, napasAnim: napas ? napas.getAnimations().length : -1, varian,
          klip: t.getAttribute('data-siapa') === 'mentor' ? (atasMeja?.querySelector('.cer-pg-piksel')?.style.clipPath ?? null) : undefined,
        };
      });
    });
    catat(`${vpNama}: ${JSON.stringify(a).slice(0, 900)}`);
    const semua = a.length === 2 && a.every((t) => t.piksel && t.transform === 'scale(1)');
    cek(semua, `${vpNama}: kedua tokoh raster, skala 1`, a);
    cek(a.every((t) => (t.kiri - 80) % 4 === 0 && (t.atas - 236) % 4 === 0), `${vpNama}: sudut kiri-atas gambar tokoh di kisi piksel seni (kelipatan 4 satuan)`, a.map((t) => [t.kiri, t.atas]));
    cek(a.every((t) => t.napasPiksel && t.napasAnim === 0), `${vpNama}: tokoh raster tanpa napas (skala pecahan)`, a.map((t) => [t.napasPiksel, t.napasAnim]));
    cek(a.every((t) => { const d = t.varian.find((v) => v.v === 'dasar'); const k = t.varian.find((v) => v.v === 'kedip'); return d?.raster && d.tempel === 1 && (!k || (k.raster && k.tempel === 2)); }),
      `${vpNama}: salinan dasar & kedip raster, tempelan wajah (1) dan wajah + mata tertutup (2)`, a.map((t) => t.varian));
    const m = a.find((t) => t.siapa === 'mentor');
    cek(!!m && typeof m.klip === 'string' && m.klip.startsWith('path('), `${vpNama}: tangan di atas meja = gambar yang sama dipotong clip-path`, m?.klip ?? null);
    await tangkap(p, `tokoh-${vpNama}`);
    // Kedip berjalan pada salinan raster dalam 8 dtk; mulut bergantian saat kalimat diketik.
    const kedip = await p.evaluate(() => new Promise((selesai) => {
      const t0 = performance.now();
      const f = () => {
        const ada = document.getAnimations().some((x) => x.effect?.target?.getAttribute?.('data-varian') === 'kedip' && x.effect.target.classList.contains('cer-pg-piksel'));
        if (ada) selesai(true); else if (performance.now() - t0 > 8000) selesai(false); else requestAnimationFrame(f);
      };
      f();
    }));
    cek(kedip, `${vpNama}: kedip berjalan pada salinan raster`);
    await lengkapi(p); await tidur(60); await klikLanjut(p);
    await tidur(150);
    const mulut = await p.evaluate(() => document.getAnimations().some((x) => x.effect?.target?.getAttribute?.('data-varian') === 'bicara' && x.effect.target.classList.contains('cer-pg-piksel')));
    const sisa = await p.evaluate(() => !!document.querySelector('.cer-dialog-sisa'));
    cek(mulut || !sisa, `${vpNama}: mulut bergantian pada salinan raster selama kalimat diketik`, { mulut, sisa });
    await tutup(p);
  }
}

// ------------------------------------------------------------------ tokoh piksel ASLI (atlas & manifest nyata)

const D1920 = { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
const H360 = { width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const L844 = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VP_ASLI = [['1440x900', D1440], ['1920x1080', D1920], ['390x844@2', H390], ['360x740@2', H360], ['844x390@2', L844]];
const { LANDASAN_KARTU, PAPAN, SEKAT } = await impor('client/src/cerita/seni/ruang/geometri.ts');
/** Plakat nama + rak dua lilin di bawahnya (dunia). */
const PLAKAT_RAK = { x: PAPAN.x, y: PAPAN.y, w: PAPAN.w, h: PAPAN.rakBawah - PAPAN.y };
/** Dinding kosong kanan plakat: sampai sekat pintu, di atas lapisan kursi pengunjung (dunia). */
const DINDING_KOSONG = { x: PAPAN.x + PAPAN.w, y: 0, w: SEKAT.x - SEKAT.sisi - (PAPAN.x + PAPAN.w), h: ruangAdegan('telepon').kursi.belakang.y };

/** Tunggu dunia utama diam & PNG susunan kini didekode (tanpa data-memuat). */
async function tungguDunia(p, ms = 9000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await p.evaluate(() => {
      const pg = document.querySelector('.cer-panggung');
      return !!pg && !pg.getAttribute('data-gerak') && !!pg.querySelector('.cer-pg-dunia[data-aktor="kamera"]') && !pg.querySelector('.cer-pg-dunia[data-aktor="kamera"][data-memuat]');
    });
    if (ok) return true;
    await tidur(50);
  }
  return false;
}

/**
 * Tokoh di dunia utama: frame atlas, piksel perangkat per piksel seni (lebar tampil salinan dasar x dpr / lebar
 * viewBox = potongan atlas), asal salinan di piksel perangkat, ujung telunjuk (satuan dunia -> px CSS lewat titik
 * uji di dunia), kotak kartu di meja.
 */
const ukurTokoh = (p) => p.evaluate(() => {
  const pg = document.querySelector('.cer-panggung');
  const d = pg?.querySelector('.cer-pg-dunia[data-aktor="kamera"]');
  if (!pg || !d) return null;
  const dpr = devicePixelRatio;
  const layar = (x, y) => {
    const e = document.createElement('div');
    e.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`;
    d.appendChild(e);
    const r = e.getBoundingClientRect();
    e.remove();
    return { x: r.x, y: r.y };
  };
  const tokoh = [...d.querySelectorAll(':scope > .cer-pg-tokoh[data-siapa]:not([data-lapis])')].map((t) => {
    const v = t.querySelector('[data-varian="dasar"]');
    const r = v?.getBoundingClientRect();
    const vb = v?.getAttribute('viewBox')?.split(/\s+/).map(Number);
    const tj = t.getAttribute('data-telunjuk')?.split(',').map(Number) ?? null;
    return {
      siapa: t.getAttribute('data-siapa'), pose: t.getAttribute('data-pose'), frame: t.getAttribute('data-frame'), piksel: t.hasAttribute('data-piksel'),
      transform: t.style.transform, k: r && vb ? (r.width * dpr) / vb[2] : null, kh: r && vb ? (r.height * dpr) / vb[3] : null,
      x: r ? r.x * dpr : null, y: r ? r.y * dpr : null, png: v?.querySelector('image')?.getAttribute('href') ?? null,
      telunjuk: tj, telunjukLayar: tj ? layar(tj[0], tj[1]) : null,
    };
  });
  const kartu = d.querySelector(':scope > .cer-pg-prop[data-prop="kartu"] svg')?.getBoundingClientRect();
  return { k: Number(pg.getAttribute('data-piksel')), dpr, tokohSeni: pg.getAttribute('data-tokoh-seni'), tokoh, kartu: kartu ? { x: kartu.x, y: kartu.y, w: kartu.width, h: kartu.height } : null };
});

/**
 * Sisipan panggilan (epilog telepon): kotaknya, plakat + rak lilin & dinding kosong (dunia -> layar lewat transform kamera;
 * seni/ruang/geometri.ts PAPAN, SEKAT, kursi pengunjung), dan skala potret piksel (px perangkat per piksel seni).
 */
const ukurSisipan = (p) => p.evaluate((plakatD, dindingD) => {
  const dpr = window.devicePixelRatio;
  const pg = document.querySelector('.cer-panggung');
  const P = pg.getBoundingClientRect();
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(document.querySelector('.cer-pg-dunia[data-aktor="kamera"]').style.transform);
  const [tx, ty, sk] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const layar = (k) => ({ x: P.x + pg.clientLeft + tx + k.x * sk, y: P.y + pg.clientTop + ty + k.y * sk, w: k.w * sk, h: k.h * sk });
  const kotak = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const s = document.querySelector('.cer-pg-telepon');
  const potret = s?.querySelector('.cer-pg-telepon-potret');
  const v = potret?.querySelector('.cer-pg-telepon-varian[data-varian="dasar"]');
  const r = v?.getBoundingClientRect();
  const vb = v?.getAttribute('viewBox')?.split(/\s+/).map(Number);
  return {
    sisip: s ? kotak(s) : null, ringkas: !!s?.hasAttribute('data-ringkas'), panggung: { x: P.x, y: P.y, w: P.width, h: P.height },
    plakat: layar(plakatD), dinding: layar(dindingD),
    piksel: potret ? Number(potret.getAttribute('data-piksel')) : null, k: r && vb ? (r.width * dpr) / vb[2] : null, px: r ? r.x * dpr : null, py: r ? r.y * dpr : null,
  };
}, PLAKAT_RAK, DINDING_KOSONG);

async function ujiTokohAsli() {
  const bulat = (x) => x !== null && Math.abs(x - Math.round(x)) < 0.02;
  // 1) Kedua tokoh PIKSEL hadir, skala 1, k bulat (= kamera), salinan di piksel perangkat bulat, di 5 ukuran x 5 momen.
  const MOMEN = [
    ['awal', ST.awal, ['mentor']], ['datang', ST.datang, ['mentor', 'nasabah']], ['kartu', stateDi('terbaik', 'b4-polis-intro', 1), ['mentor', 'nasabah']],
    ['parkir', stateDi('terbaik', 'b3-bukti-intro', 1), ['mentor', 'nasabah']], ['telepon', stateDi('janji', 'akhir-janji', 2), ['mentor']],
  ];
  for (const [vpNama, vp] of VP_ASLI) {
    for (const [momen, st, harus] of MOMEN) {
      const p = await halaman({ vp, state: st, pembuka: false, piksel: false });
      const siap = await tungguDunia(p);
      await lengkapi(p);
      await tidur(350);
      const u = await ukurTokoh(p);
      const t = u?.tokoh ?? [];
      const ok = siap && Number.isInteger(u.k) && u.k >= 1 && t.length === harus.length && harus.every((s) => t.some((x) => x.siapa === s))
        && t.every((x) => x.piksel && x.frame && x.transform === 'scale(1)' && Math.abs(x.k - u.k) < 0.01 && Math.abs(x.kh - u.k) < 0.01 && bulat(x.x) && bulat(x.y));
      cek(ok, `${vpNama} ${momen}: tokoh piksel (${t.map((x) => `${x.siapa}:${x.frame}`).join(', ')}) skala 1, ${u?.k} px perangkat per piksel seni, di kisi perangkat`, u);
      if (momen === 'kartu') {
        // Ujung telunjuk Miss Raksa di landasan kartu (dunia) DAN di atas kotak kartu yang tampil (layar, ± 1 piksel seni).
        const m = t.find((x) => x.siapa === 'mentor');
        const L = LANDASAN_KARTU;
        const di = m?.telunjuk && m.telunjuk[0] >= L.x && m.telunjuk[0] <= L.x + L.w && m.telunjuk[1] >= L.y && m.telunjuk[1] <= L.y + L.h;
        const s = u.k / u.dpr;
        const kl = u.kartu && m?.telunjukLayar && m.telunjukLayar.x >= u.kartu.x - s && m.telunjukLayar.x <= u.kartu.x + u.kartu.w + s
          && m.telunjukLayar.y >= u.kartu.y - s && m.telunjukLayar.y <= u.kartu.y + u.kartu.h + s;
        cek(m?.frame === 'duduk-tunjuk-kanan' && di && kl, `${vpNama} kartu: ujung telunjuk (${m?.telunjuk}) di landasan kartu & di atas kartu yang tampil`, { m, kartu: u.kartu, L });
        await tangkap(p, `kartu-${vpNama}`);
      }
      if (momen === 'telepon') {
        const png = await p.evaluate(() => [...document.querySelectorAll('.cer-pg-dunia[data-aktor="kamera"] > .cer-pg-prop[data-prop="telepon"] image')].map((e) => e.getAttribute('href')));
        cek(t[0]?.frame?.startsWith('telepon-') && png.length === 1 && /tanpa-gagang/.test(png[0]), `${vpNama} telepon: satu gagang (di tangan Miss Raksa), pesawat meja tanpa gagang`, { frame: t[0]?.frame, png });
        // Sisipan panggilan di dinding kosong kanan plakat: tidak menutupi plakat / rak lilin, di dalam panggung, potret
        // piksel >= 2 px perangkat per piksel seni (wajah terbaca) di kisi perangkat.
        const s = await ukurSisipan(p);
        const potong = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        const bersih = s.sisip && !potong(s.sisip, s.plakat) && s.sisip.x >= s.panggung.x && s.sisip.y >= s.panggung.y
          && s.sisip.x + s.sisip.w <= s.panggung.x + s.panggung.w && s.sisip.y + s.sisip.h <= s.panggung.y + s.panggung.h;
        const diDinding = s.sisip && s.sisip.x >= s.dinding.x - 0.5 && s.sisip.x + s.sisip.w <= s.dinding.x + s.dinding.w + 0.5 && s.sisip.y + s.sisip.h <= s.dinding.y + s.dinding.h + 0.5;
        cek(bersih && diDinding, `${vpNama} telepon: sisipan panggilan${s.ringkas ? ' (ringkas)' : ''} di dinding kosong kanan plakat, tidak menutupi plakat & rak lilin`, s);
        cek(Number.isInteger(s.piksel) && s.piksel >= 2 && Math.abs(s.k - s.piksel) < 0.01 && bulat(s.px) && bulat(s.py),
          `${vpNama} telepon: potret sisipan ${s.piksel} px perangkat per piksel seni (>= 2, bulat, di kisi)`, s);
        await tangkap(p, `telepon-${vpNama}`);
      }
      await tutup(p);
    }
  }

  // 2) Kedip & mulut: hanya piksel wajah yang berubah (kepala/tubuh tidak bergeser). Salinan kedip/bicara diklon
  //    (salinan bicara hanya ada selama kalimat diketik), lalu dibandingkan dengan salinan dasar: kotak elemen sama,
  //    viewBox sama, dan selisih piksel tangkapan layar hanya di kotak lapisan mata / mulut.
  for (const [vpNama, vp] of [['1440x900', D1440], ['390x844@2', H390]]) {
    for (const [nama, st, siapa] of [['Miss Raksa awal (bicara)', ST.awal, 'mentor'], ['Bu Rina datang (bicara)', ST.datang, 'nasabah'], ['Miss Raksa kartu (mata bawah)', stateDi('terbaik', 'b4-polis-intro', 1), 'mentor']]) {
      const p = await halaman({ vp, state: st, pembuka: false, piksel: false });
      await tungguDunia(p);
      // Klon salinan bicara selagi kalimat diketik (jalur uji: elemen di luar React, tak terlihat).
      const klonBicara = await p.evaluate((s) => new Promise((selesai) => {
        const t0 = performance.now();
        const f = () => {
          const t = document.querySelector(`.cer-pg-dunia[data-aktor="kamera"] [data-aktor="tokoh:${s}"]`);
          const b = t?.querySelector('.cer-pg-varian[data-varian="bicara"]');
          if (b) { const c = b.cloneNode(true); c.setAttribute('data-varian', 'uji-bicara'); c.style.visibility = 'hidden'; b.parentElement.appendChild(c); selesai(true); return; }
          if (performance.now() - t0 > 3000) selesai(false); else requestAnimationFrame(f);
        };
        f();
      }), siapa);
      await lengkapi(p);
      // Salinan kedip diperbarui saat idle: tunggu tanpa data-basi, lalu klon juga.
      const klonKedip = await p.evaluate((s) => new Promise((selesai) => {
        const t0 = performance.now();
        const f = () => {
          const t = document.querySelector(`.cer-pg-dunia[data-aktor="kamera"] [data-aktor="tokoh:${s}"]`);
          const k = t?.querySelector('.cer-pg-varian[data-varian="kedip"]:not([data-basi])');
          if (k) { const c = k.cloneNode(true); c.setAttribute('data-varian', 'uji-kedip'); c.style.visibility = 'hidden'; k.parentElement.appendChild(c); selesai(true); return; }
          if (performance.now() - t0 > 4000) selesai(false); else requestAnimationFrame(f);
        };
        f();
      }), siapa);
      // Jeda gerak kecil (tab tersembunyi) & batalkan animasi, supaya tangkapan layar hanya berbeda karena salinannya.
      await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await tidur(400);
      const tampil = (varian) => p.evaluate((s, v) => {
        for (const a of document.getAnimations()) a.cancel();
        const t = document.querySelector(`.cer-pg-dunia[data-aktor="kamera"] [data-aktor="tokoh:${s}"]`);
        const semua = [...t.querySelectorAll('.cer-pg-napas > .cer-pg-varian')];
        for (const e of semua) e.style.visibility = e.getAttribute('data-varian') === v ? 'visible' : 'hidden';
        const e = semua.find((x) => x.getAttribute('data-varian') === v);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        const lapis = [...e.querySelectorAll(':scope > svg')].map((x) => { const q = x.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height, vb: x.getAttribute('viewBox') }; });
        return { kotak: { x: r.x, y: r.y, w: r.width, h: r.height }, viewBox: e.getAttribute('viewBox'), lapis };
      }, siapa, varian);
      // Kotak tangkapan = kotak salinan dasar dipotong ke kotak panggung (px CSS bulat; isi di luar panggung terpotong).
      const pgR = await p.evaluate(() => { const r = document.querySelector('.cer-panggung').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
      const potret = async (kotak) => {
        const x0 = Math.ceil(Math.max(kotak.x, pgR.x)); const y0 = Math.ceil(Math.max(kotak.y, pgR.y));
        const x1 = Math.floor(Math.min(kotak.x + kotak.w, pgR.x + pgR.w)); const y1 = Math.floor(Math.min(kotak.y + kotak.h, pgR.y + pgR.h));
        const img = PNG.sync.read(await p.screenshot({ type: 'png', clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } }));
        img.x0 = x0; img.y0 = y0;
        return img;
      };
      const dasar = await tampil('dasar');
      const gDasar = await potret(dasar.kotak);
      const dpr = vp.deviceScaleFactor;
      for (const [v, ada] of [['uji-kedip', klonKedip], ['uji-bicara', klonBicara]]) {
        if (!ada) { if (v === 'uji-kedip') cek(false, `${vpNama} ${nama}: salinan kedip (tidak basi) ada`); else catat(`${vpNama} ${nama}: tanpa salinan bicara (${siapa} tidak berbicara di baris ini)`); continue; }
        const x = await tampil(v);
        const gX = await potret(dasar.kotak);
        // Kotak selisih (px perangkat relatif sudut tangkapan).
        let bx0 = Infinity; let by0 = Infinity; let bx1 = -Infinity; let by1 = -Infinity; let n = 0;
        for (let yy = 0; yy < gDasar.height; yy++) {
          for (let xx = 0; xx < gDasar.width; xx++) {
            const i = (yy * gDasar.width + xx) * 4;
            if (gDasar.data[i] !== gX.data[i] || gDasar.data[i + 1] !== gX.data[i + 1] || gDasar.data[i + 2] !== gX.data[i + 2]) {
              n++; bx0 = Math.min(bx0, xx); by0 = Math.min(by0, yy); bx1 = Math.max(bx1, xx); by1 = Math.max(by1, yy);
            }
          }
        }
        // Lapisan yang BERBEDA dari salinan dasar (mata / mulut): selisih wajib di dalamnya (± 1 px perangkat).
        const beda = x.lapis.filter((l) => !dasar.lapis.some((d) => d.vb === l.vb && Math.abs(d.x - l.x) < 0.01 && Math.abs(d.y - l.y) < 0.01));
        const dalam = n === 0 || beda.some((l) => {
          const lx = (l.x - gDasar.x0) * dpr; const ly = (l.y - gDasar.y0) * dpr;
          return bx0 >= lx - 1 && by0 >= ly - 1 && bx1 <= lx + l.w * dpr + 1 && by1 <= ly + l.h * dpr + 1;
        });
        const samaKotak = ['x', 'y', 'w', 'h'].every((k) => Math.abs(x.kotak[k] - dasar.kotak[k]) < 0.01) && x.viewBox === dasar.viewBox;
        const wajahSama = dasar.lapis.length > 0 && x.lapis[0] && x.lapis[0].vb === dasar.lapis[0].vb && Math.abs(x.lapis[0].x - dasar.lapis[0].x) < 0.01 && Math.abs(x.lapis[0].y - dasar.lapis[0].y) < 0.01;
        cek(samaKotak && wajahSama && n > 0 && dalam, `${vpNama} ${nama}: salinan ${v.slice(4)} = kotak & wajah dasar sama, ${n} px perangkat berubah hanya di lapisan ${v === 'uji-kedip' ? 'mata' : 'mulut'}`,
          { kotak: [dasar.kotak, x.kotak], selisih: [bx0, by0, bx1, by1, n], beda });
      }
      p.galat = [];
      await p.browserContext().close();
    }
  }

  // 3) Baris istilah saat kalimat diketik + muat ulang di tengah ketikan (PROFIL BARU = konteks peramban baru, cache &
  //    penyimpanan kosong): skenario "CadanganIstilah is not defined" dari review. Tanpa galat, tanpa halaman gagal,
  //    baris istilah tampil (cadangan saat diketik, tombol sesudah utuh). Dua kali muat ulang berturut-turut.
  for (const [vpNama, vp] of [['390', H390], ['1440', D1440]]) {
    const p = await halaman({ vp, pembuka: true, piksel: false });
    const modul = await p.evaluate(async () => {
      try {
        const r = await fetch('/src/cerita/ui/KotakDialog.tsx');
        const s = await r.text();
        const def = s.indexOf('function CadanganIstilah');
        return { vite: r.ok && /CadanganIstilah/.test(s), def, pakai: s.indexOf('CadanganIstilah') };
      } catch { return { vite: false }; }
    });
    if (modul.vite) cek(modul.def > 0, `${vpNama}: modul KotakDialog yang DISAJIKAN memuat definisi CadanganIstilah (def ${modul.def}, pakai pertama ${modul.pakai})`, modul);
    await klikLewati(p);
    await lengkapi(p); await tidur(100); await klikLanjut(p);
    await tidur(80);
    const baca = () => p.evaluate(() => ({
      node: document.querySelector('.cer-main')?.getAttribute('data-node') ?? null,
      sisa: document.querySelector('.cer-dialog-sisa')?.textContent?.length ?? 0,
      cadangan: document.querySelectorAll('.cer-istilah-cadangan').length,
      tombol: document.querySelectorAll('.cer-istilah-tombol').length,
      gagal: /belum bisa dibuka/i.test(document.body.innerText),
      dialog: !!document.querySelector('.cer-dialog'),
    }));
    const a = await baca();
    cek(a.sisa > 0 && a.cadangan === 1 && !a.gagal, `${vpNama}: ${a.node} baris istilah selama diketik (cadangan tak terlihat)`, a);
    const hasilMuat = [];
    for (let k = 0; k < 2; k++) {
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.cer-dialog', { timeout: 20000 }).catch(() => null);
      await tidur(60);
      const b = await baca();
      for (let j = 0; j < 80 && (await baca()).sisa > 0; j++) await tidur(50);
      await tidur(150);
      hasilMuat.push({ segera: b, utuh: await baca() });
    }
    cek(hasilMuat.every((h) => !h.segera.gagal && h.segera.dialog && (h.segera.cadangan === 1 || h.segera.tombol >= 1) && !h.utuh.gagal && h.utuh.tombol >= 1) && p.galat.length === 0,
      `${vpNama}: muat ulang 2x di tengah ketikan: tanpa galat / halaman gagal, baris istilah tampil`, { hasilMuat, galat: p.galat });
    await tutup(p);
  }

  // 4) Potret kecil (< 44 px CSS: Riwayat 32) = IKON KEPALA MINI (kepala utuh), bukan jendela wajah 1:1: data-jendela
  //    ikon.32, 1 piksel ikon = dpr piksel perangkat (bulat), kedua tokoh, tanpa galat.
  for (const [vpNama, vp] of [['1440x900', D1440], ['390x844@2', H390]]) {
    const p = await halaman({ vp, state: stateDi('terbaik', 'b2-saran', 1), pembuka: false, piksel: false });
    await tungguDunia(p);
    await lengkapi(p);
    await tidur(200);
    await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Riwayat|History/.test(x.textContent ?? ''))?.click());
    await p.waitForSelector('.cer-riwayat .tokoh-potret', { timeout: 5000 }).catch(() => null);
    await tidur(400);
    const r = await p.evaluate(() => [...document.querySelectorAll('.cer-riwayat .tokoh-potret')].map((e) => ({
      tokoh: e.getAttribute('data-tokoh'), jendela: e.getAttribute('data-jendela'), piksel: Number(e.getAttribute('data-piksel')), seni: e.getAttribute('data-seni'),
      w: Math.round(e.getBoundingClientRect().width), png: e.querySelector('image')?.getAttribute('href')?.split('/').pop()?.split('?')[0] ?? null,
    })));
    const dpr = vp.deviceScaleFactor;
    const ok = r.length >= 2 && new Set(r.map((x) => x.tokoh)).size === 2
      && r.every((x) => x.w === 32 && x.seni === 'piksel' && x.jendela === 'ikon.32' && x.piksel === dpr && /^ikon-/.test(x.png ?? ''));
    cek(ok && p.galat.length === 0, `${vpNama} Riwayat: potret 32 px = ikon kepala mini kedua tokoh (${r.length}), ${dpr} px perangkat per piksel ikon`, { r: r.slice(0, 4), galat: p.galat });
    await tangkap(p, `riwayat-ikon-${vpNama}`);
    await tutup(p);
  }
}

const UJI = {
  pembuka: ujiPembuka, lewati: ujiLewati, tempatlewati: ujiTempatLewati, lanjut: ujiLanjut, enter: ujiEnter, bahasa: ujiBahasa, ukuran: ujiUkuran, dialog: ujiDialog,
  tab: ujiTab, muat: ujiMuat, bab: ujiBab, ringan: ujiRingan, aset: ujiAset, bocor: ujiBocor, hantu: ujiHantu, aksi: ujiAksi,
  panas: ujiPanas, heap: ujiHeap, kedip: ujiKedip, fokus: ujiFokus, tombol: ujiTombol, hub: ujiHub, piksel: ujiPiksel, tokohpiksel: ujiTokohPiksel,
  tokohasli: ujiTokohAsli, kamera: ujiKamera,
};
for (const nama of HANYA) {
  if (!UJI[nama]) { console.log(`uji tidak dikenal: ${nama}`); continue; }
  grup = nama;
  try {
    await UJI[nama]();
  } catch (e) {
    cek(false, `uji ${nama} berhenti dengan galat`, String(e?.stack ?? e).slice(0, 400));
  }
}
await peramban.close();

const gagal = hasil.filter((h) => !h.ok);
if (OUT) fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(`\n${hasil.length - gagal.length}/${hasil.length} lulus${gagal.length ? `, ${gagal.length} GAGAL` : ''}`);
process.exit(gagal.length ? 1 : 0);
