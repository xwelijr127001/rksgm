/**
 * REGRESI TEMUAN REVIEW 26 SEPTEMBER 2026 (A-F) + tangkapan SESUDAH perbaikan.
 *
 * Temuan asli : C:\Users\User\Desktop\raksa-review-20260926\REVIEW.md (live = build 99fb182)
 * Target      : docs/rancangan-mode-cerita.md bagian 5; angka SEBELUM perbaikan: bagian 9.
 * Tangkapan   : docs/tangkapan-cerita/README.md (pasangan sebelum/sesudah + mode cerita).
 *
 * PRASYARAT (tidak dimasukkan ke dependensi proyek, sama dengan tools/e2e-browser.mjs):
 *   npm install --no-save puppeteer-core      (socket.io-client sudah ada di workspace)
 *   server + client berjalan: "npm run build && npm start" (UI_BASE bawaan http://127.0.0.1:4000),
 *   atau Vite dev: cd client && VITE_SERVER_URL=http://localhost:4230 npx vite --port 4312
 *   UI_BASE=http://localhost:4312 npm run test:review              # semua temuan A-F
 *   npm run test:review -- A,C                                     # sebagian temuan
 *   npm run test:review -- --cerita                                # + tangkapan mode cerita (HP & desktop)
 *   npm run test:review -- --cerita-saja                           # hanya tangkapan mode cerita
 * Env : UI_BASE, RAKSA_CHROME (chrome.exe), RAKSA_SHOTS (folder tangkapan, bawaan shots-review),
 *       RAKSA_SERVER (alamat socket untuk room uji temuan C; bawaan = UI_BASE, Vite mem-proxy /socket.io),
 *       RAKSA_PIN (PIN panitia bila server memakainya), RAKSA_GERAK=kurang (uji gerak dikurangi).
 *
 * Setiap skenario memakai konteks browser BARU (penyimpanan kosong = kunjungan pertama) dengan profil
 * pemain "Weli" di localStorage 'raksa:profil'. Ambang di bawah SENGAJA sama dengan target kontrak;
 * bila ada yang GAGAL, perbaiki aplikasinya (atau catat alasannya), jangan longgarkan ambangnya.
 * Semua viewport = emulasi Chrome (bukan HP fisik). Animasi MENYALA (prefers-reduced-motion:
 * no-preference) seperti kebanyakan HP pemain; Chrome headless mewarisi setelan "kurangi gerak" OS
 * bila tidak diemulasikan. Tangkapan pasangan memakai deviceScaleFactor 1 (sama dengan tangkapan
 * review); tangkapan mode cerita di HP memakai deviceScaleFactor 2.
 * Keluar dengan kode 1 bila ada pemeriksaan GAGAL.
 *
 *   A  checklist misi 3 (penuh / ?adegan=ringan / engine gagal) + info kalender misi 7 lewat HTML
 *   B  dialog Dokumen misi 10: fokus terkunci, latar inert, Escape, gulir keyboard; dibuka dari kanvas
 *   C  kunjungan pertama misi 1 (390x844 & 360x740): "Siap mulai", bonus belum berjalan, opsi pertama
 *      di atas bar aksi; multiplayer: briefing berisi cara main, durasi fase tidak berubah
 *   D  hasil HP: vonis & tombol aksi di layar pertama, di atas adegan; misi 2 sebagian: baris rincian
 *   E  bintang = ketepatan terbaik (0 bintang + "sudah dicoba"), migrasi progres lama + cadangan
 *   F  wordmark bersama host & pemain, tombol utama host hijau, font judul sama; halaman awal mengikuti kontrak PRD v0.2
 *      + review staf #1–#6 (Join Game di atas & di layar pertama; Mini Games + cerita solo di bagian mode lama). Kontrak
 *      lama "tiga pintu, pintu cerita utama" sengaja diganti (docs/prd-v02/REVIEW-HANDOFF.md, perubahan kontrak uji).
 *      Jalankan dengan server RAKSA_LEGACY=on (mode lama).
 *
 * --cerita (tangkapan mode cerita v2, docs/rancangan-mode-cerita.md bagian 11; pemeriksaan lengkapnya di
 * tools/uji-cerita.mjs): percakapan, keputusan, aktivitas bukti (album "n/3 foto"), umpan balik, aktivitas polis
 * (kartu polis di atas tiga pilihan, baris dibuka untuk artinya; kartu di dialog Dokumen), kartu akhir (dua aksi
 * terlihat tanpa gulir), "Lihat perjalananku" (cerita-akhir-ringkasan-hp.png) dan pemilih bagian
 * (cerita-akhir-pemilih-hp.png).
 */

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { io as ioClient } from 'socket.io-client';

const BASE = (process.env.UI_BASE || 'http://127.0.0.1:4000').replace(/\/+$/, '');
const SERVER = (process.env.RAKSA_SERVER || BASE).replace(/\/+$/, '');
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve(process.env.RAKSA_SHOTS || 'shots-review');
const GERAK = process.env.RAKSA_GERAK === 'kurang' ? 'reduce' : 'no-preference';
const ARG = process.argv.slice(2);
const CERITA_SAJA = ARG.includes('--cerita-saja');
const TANGKAP_CERITA = CERITA_SAJA || ARG.includes('--cerita');
const pilihan = ARG.find((a) => /^[A-F](,[A-F])*$/i.test(a));
const TEMUAN = CERITA_SAJA ? [] : pilihan ? pilihan.toUpperCase().split(',') : ['A', 'B', 'C', 'D', 'E', 'F'];
fs.mkdirSync(OUT, { recursive: true });

const LOOK = { body: 1, skin: 2, hair: 2, color: 2, accessory: 'topi' };
const PROFIL = JSON.stringify({ nickname: 'Weli', look: LOOK });

// Tangkapan pasangan: ukuran & skala sama dengan tangkapan review (deviceScaleFactor 1).
const HP390 = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const HP360 = { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const HP390_TAJAM = { ...HP390, deviceScaleFactor: 2 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

/** Chunk Phaser: dev = /node_modules/.vite/deps/phaser.js?v=..., build = /assets/phaser-<hash>.js. */
const POLA_PHASER = /\/phaser(?:[-.][\w-]+)?\.js(?:\?|$)/i;

/** Progres format lama (tanpa `versi`): 1 bintang untuk 0% (kontrak bagian 9, temuan E). */
const PROGRES_LAMA_E = '{"misi":{"m01-parkir":{"akurasi":0,"poin":0,"bintang":1,"kali":1}},"rekor":0}';
/** Progres yang sama dengan tangkapan review progress-persisted.png (misi 1 salah, misi 2 & 9 tepat). */
const PROGRES_LAMA_REVIEW = JSON.stringify({
  misi: {
    'm01-parkir': { akurasi: 0, poin: 0, bintang: 1, kali: 1 },
    'm02-detektif-penyok': { akurasi: 1, poin: 1000, bintang: 3, kali: 1 },
    'm09-hitung-teliti': { akurasi: 1, poin: 1278, bintang: 3, kali: 1 },
  },
  rekor: 2278,
});

/** Angka review (kontrak bagian 9 & REVIEW.md), untuk ringkasan sebelum/sesudah. */
const SEBELUM = {
  'C 390x844 "Siap mulai" y': 'tanpa gerbang, bonus langsung berjalan',
  'C bonus sebelum interaksi': '18 -> 16 dtk tanpa interaksi',
  'C 390x844 setelah mulai: opsi pertama y / bar aksi y / adegan y / gulir': '968 / 747 / 608 / 0',
  'D 390 vonis y': 539,
  'D 390 tombol aksi y': '807 ("Coba lagi")',
  'E bintang 0%': 1,
};

// ------------------------------------------------------------------ catatan hasil

const hasil = [];
const gagal = [];
/** Pengamatan di luar ambang tugas (tidak membuat skrip gagal), dicetak di ringkasan. */
const peringatan = [];
const ukur = [];
const konsol = [];
const tangkapan = [];
let temuanKini = '-';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function periksa(ok, pesan) {
  const b = Boolean(ok);
  hasil.push({ temuan: temuanKini, ok: b, pesan });
  console.log(`${b ? 'ok   ' : 'GAGAL'} [${temuanKini}] ${pesan}`);
  if (!b) gagal.push(`[${temuanKini}] ${pesan}`);
  return b;
}
function catatUkur(nama, nilai) {
  ukur.push({ nama, nilai });
}
function beri(pesan) {
  peringatan.push(`[${temuanKini}] ${pesan}`);
  console.log(`CATAT [${temuanKini}] ${pesan}`);
}

/** Tunggu sampai `fn` di halaman bernilai benar (tanpa mencatat apa pun). */
async function tungguDiam(page, fn, ms = 20000, arg) {
  const batas = Date.now() + ms;
  while (Date.now() < batas) {
    try { if (await page.evaluate(fn, arg)) return true; } catch { /* navigasi / render ulang */ }
    await tidur(150);
  }
  return false;
}

/** Tunggu sampai `fn` di halaman bernilai benar. Timeout = GAGAL dengan `label`. */
async function tunggu(page, fn, label, ms = 20000, arg) {
  if (await tungguDiam(page, fn, ms, arg)) return true;
  periksa(false, `timeout: ${label}`);
  return false;
}

// ------------------------------------------------------------------ browser

let browser = null;

function pantau(page, nama) {
  page.on('console', (m) => { if (m.type() === 'error') konsol.push({ nama, tipe: 'error', teks: m.text().slice(0, 200) }); });
  page.on('pageerror', (e) => konsol.push({ nama, tipe: 'pageerror', teks: String(e).slice(0, 200) }));
  page.on('response', (r) => { if (r.status() >= 500 && r.url().startsWith(BASE)) konsol.push({ nama, tipe: 'http' + r.status(), teks: r.url() }); });
}

/**
 * Halaman di konteks BARU (localStorage kosong). `profil` = pasang profil Weli; `suntikSolo` = teks
 * mentah raksa:solo yang dipasang SEKALI sebelum skrip aplikasi jalan; `gagalEngine` = cegat chunk Phaser.
 */
async function halamanBaru({ vp, nama, profil = true, suntikSolo = null, gagalEngine = false, gerak = GERAK }) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  await page.setViewport(vp);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: gerak }]);
  if (!gagalEngine) pantau(page, nama);
  if (profil || suntikSolo !== null) {
    await page.evaluateOnNewDocument((p, solo) => {
      try {
        if (p && !localStorage.getItem('raksa:profil')) localStorage.setItem('raksa:profil', p);
        if (solo !== null && !sessionStorage.getItem('uji:suntik')) {
          sessionStorage.setItem('uji:suntik', '1');
          localStorage.setItem('raksa:solo', solo);
        }
      } catch { /* penyimpanan diblokir */ }
    }, profil ? PROFIL : null, suntikSolo);
  }
  const info = { dicegat: 0 };
  if (gagalEngine) {
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      if (POLA_PHASER.test(r.url())) { info.dicegat++; void r.abort('failed'); } else void r.continue();
    });
  }
  return { page, info, tutup: () => ctx.close().catch(() => {}) };
}

async function tangkap(page, nama, { penuh = false, gulirAtas = true, tanpaFokus = false } = {}) {
  try {
    // tanpaFokus: tanpa cincin fokus dari klik skrip (ketukan jari sungguhan tidak menampilkannya).
    if (tanpaFokus) await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    if (gulirAtas) { await page.evaluate(() => window.scrollTo(0, 0)); await tidur(350); }
    const file = path.join(OUT, nama);
    await page.screenshot({ path: file, fullPage: penuh, captureBeyondViewport: penuh });
    tangkapan.push({ nama, kb: Math.round(fs.statSync(file).size / 1024) });
  } catch (e) {
    console.log('[tangkap gagal]', nama, String(e?.message || e).slice(0, 100));
  }
}

/** Klik tombol HTML yang teksnya diawali `teks` (lipatan daftar dibuka dulu), seperti e2e-browser.mjs. */
function klikTeks(page, sel, teks) {
  return page.evaluate((s, t) => {
    const norm = (x) => (x || '').replace(/\s+/g, ' ').trim().toLowerCase();
    document.querySelectorAll('details.daftar-alternatif:not([open])').forEach((d) => { d.open = true; });
    const b = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getClientRects().length > 0 && norm(x.textContent).startsWith(norm(t)));
    if (!b) return false;
    b.click();
    return true;
  }, sel, teks);
}

function klik(page, sel) {
  return page.evaluate((s) => {
    const b = document.querySelector(s);
    if (!b || b.disabled) return false;
    b.click();
    return true;
  }, sel);
}

const objekAdegan = (page) => page.evaluate(() => window.__raksaStage?.scene?.objects ?? []);

/**
 * Tunggu adegan interaktif ('ready') DAN daftar objek uji (window.__raksaStage.scene) untuk ketukan kanvas.
 * Di Vite dev, React StrictMode memasang adegan dua kali; instance yang dibuang kadang menghapus registri
 * instance yang hidup (engine/stage.ts: destroy mencocokkan missionId saja). Build produksi tidak terkena.
 * Bila registri kosong, halaman dimuat ulang (paling banyak 4x) lalu `siapkan()` mengembalikan keadaan.
 */
async function adeganBerobjek(page, label, siapkan = null) {
  for (let i = 0; i < 4; i++) {
    if (i > 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      if (siapkan) await siapkan();
    }
    if (!(await tungguDiam(page, () => document.querySelector('.adegan')?.getAttribute('data-status') === 'ready', 45000))) continue;
    await tidur(1500); // instance StrictMode yang dibuang selesai boot & dihancurkan dulu
    if ((await objekAdegan(page)).length > 0) return true;
  }
  periksa(false, `${label}: adegan interaktif dengan daftar objek uji`);
  return false;
}

/** Ketuk objek adegan pada koordinat dunia 640x480 (mouse atau sentuh). */
async function ketukDunia(page, x, y, sentuh) {
  const r = await page.evaluate(() => {
    const el = document.querySelector('.adegan');
    el?.scrollIntoView({ block: 'center' });
    const q = el?.getBoundingClientRect();
    return q ? { x: q.x, y: q.y, w: q.width, h: q.height } : null;
  });
  if (!r) return false;
  await tidur(200);
  const px = r.x + (x / 640) * r.w;
  const py = r.y + (y / 480) * r.h;
  if (sentuh) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
  return true;
}

/** Dialog modal teratas: ada? fokus di dalam? latar #root inert? */
function infoDialog(page) {
  return page.evaluate(() => {
    const d = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].pop() ?? null;
    const a = document.activeElement;
    return {
      ada: Boolean(d),
      fokusDalam: Boolean(d && a && d.contains(a)),
      aktif: a && a !== document.body ? `${a.tagName.toLowerCase()} "${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30)}"` : 'body',
      rootInert: document.getElementById('root')?.hasAttribute('inert') ?? false,
      teks: d?.textContent ?? '',
      butirChecklist: d?.querySelectorAll('.misi-dok-checklist li').length ?? 0,
    };
  });
}

/** Tekan Tab dari awal halaman sampai elemen `sel` menerima fokus. 0 = tidak tercapai. */
async function tabSampai(page, sel, maks = 60) {
  await page.evaluate(() => { window.scrollTo(0, 0); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  for (let i = 1; i <= maks; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => document.activeElement?.matches?.(s) ?? false, sel)) return i;
  }
  return 0;
}

const modeMisi = (m) => document.querySelector('.misi')?.getAttribute('data-mode') === m;

/** Buka /solo/main?misi=N dan tunggu kartu "Siap mulai" (mode intro). */
async function bukaMisi(page, no, adegan = 'penuh') {
  await page.goto(`${BASE}/solo/main?misi=${no}&adegan=${adegan}`, { waitUntil: 'domcontentloaded' });
  return tunggu(page, modeMisi, `misi ${no}: kartu "Siap mulai"`, 30000, 'intro');
}

/** Tekan "Siap mulai" dan tunggu mode menjawab (termasuk geser halus sesudahnya). */
async function siapMulai(page) {
  const ok = await klik(page, '.misi-mulai-aksi .primary-action');
  await tunggu(page, modeMisi, 'mode menjawab setelah "Siap mulai"', 10000, 'play');
  await tidur(1100);
  return ok;
}

/** Teks cara main/petunjuk yang meminta mengetuk gambar/adegan (tidak boleh saat adegan tidak interaktif). */
const mintaKetukGambar = (teks) => /ketuk[^.:]*\b(gambar|adegan)\b/i.test(teks);
const ringkasTeks = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 90);

let DATA = null; // /api/missions
const misiNo = (n) => DATA.missions.find((m) => m.number === n);
const labelOpsi = (n, stepId, id) => misiNo(n).steps.find((s) => s.id === stepId).options.find((o) => o.id === id).label;

// ------------------------------------------------------------------ A: checklist & info adegan lewat HTML

async function ujiA() {
  for (const varian of ['penuh', 'ringan', 'gagal']) {
    const { page, info, tutup } = await halamanBaru({ vp: DESKTOP, nama: `A-${varian}`, gagalEngine: varian === 'gagal' });
    try {
      await bukaMisi(page, 3, varian === 'ringan' ? 'ringan' : 'penuh');
      const target = { penuh: 'ready', ringan: 'static', gagal: 'failed' }[varian];
      periksa(await tunggu(page, (s) => document.querySelector('.adegan')?.getAttribute('data-status') === s, `misi 3 ${varian}: adegan '${target}'`, 45000, target),
        `misi 3 ${varian}: status adegan '${target}'`);
      if (varian === 'gagal') periksa(info.dicegat > 0, `misi 3 gagal: request chunk Phaser dicegat (${info.dicegat}x)`);
      if (varian === 'penuh') await adeganBerobjek(page, 'misi 3 penuh', () => tungguDiam(page, modeMisi, 30000, 'intro'));

      const kartu = await page.evaluate(() => ({
        cek: Boolean(document.querySelector('.misi-mulai [data-misi-buka="checklist"]')),
        cara: document.querySelector('.misi-mulai-cara')?.textContent ?? '',
      }));
      periksa(kartu.cek, `misi 3 ${varian}: kartu "Siap mulai" punya tombol "Lihat checklist"`);
      if (varian !== 'penuh') periksa(!mintaKetukGambar(kartu.cara), `misi 3 ${varian}: cara main di kartu tidak meminta mengetuk gambar ("${ringkasTeks(kartu.cara)}")`);

      await siapMulai(page);
      const html = await page.evaluate(() => {
        const vis = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        return {
          kanvas: document.querySelectorAll('canvas').length,
          tombol: [...document.querySelectorAll('[data-misi-buka="checklist"]')].filter(vis).length,
          diBaki: [...document.querySelectorAll('.baki [data-misi-buka="checklist"]')].some(vis),
          petunjuk: document.querySelector('.misi-petunjuk')?.textContent ?? '',
        };
      });
      if (varian !== 'penuh') periksa(html.kanvas === 0, `misi 3 ${varian}: tanpa kanvas (${html.kanvas})`);
      periksa(html.tombol >= 1, `misi 3 ${varian}: tombol HTML "Lihat checklist" terlihat saat menjawab (${html.tombol})`);
      periksa(html.diBaki, `misi 3 ${varian}: "Lihat checklist" di kepala Folder laporan (dekat folder)`);
      if (varian !== 'penuh') periksa(!mintaKetukGambar(html.petunjuk), `misi 3 ${varian}: petunjuk pertanyaan memakai daftar ("${ringkasTeks(html.petunjuk)}")`);
      if (varian === 'ringan') await tangkap(page, 'sesudah-mission3-light.png', { penuh: true });

      const n = await tabSampai(page, '[data-misi-buka="checklist"]');
      periksa(n > 0, `misi 3 ${varian}: "Lihat checklist" dicapai dengan Tab (${n}x dari awal halaman)`);
      await page.evaluate(() => document.activeElement?.setAttribute('data-uji-pembuka', '1'));
      await page.keyboard.press('Enter');
      await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), `misi 3 ${varian}: dialog checklist terbuka`, 5000);
      await tidur(400);
      const d = await infoDialog(page);
      periksa(d.butirChecklist === 4, `misi 3 ${varian}: dialog berisi checklist 4 butir (${d.butirChecklist})`);
      periksa(d.fokusDalam, `misi 3 ${varian}: fokus di dalam dialog (${d.aktif})`);
      await tidur(300);
      await page.keyboard.press('Escape');
      await tidur(350);
      const k = await page.evaluate(() => ({ dialog: Boolean(document.querySelector('[role="dialog"]')), kembali: document.activeElement?.hasAttribute('data-uji-pembuka') ?? false }));
      periksa(!k.dialog && k.kembali, `misi 3 ${varian}: Escape menutup checklist & fokus kembali ke tombolnya`);

      if (varian !== 'penuh') {
        // Tangkapan bantuan tanpa cincin fokus sisa dialog tadi (sama dengan keadaan tangkapan review).
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
        await klik(page, 'button[aria-controls="misi-bantuan"]');
        await tunggu(page, () => Boolean(document.querySelector('#misi-bantuan')), `misi 3 ${varian}: Cara main terbuka`, 5000);
        const teks = await page.evaluate(() => document.querySelector('#misi-bantuan')?.textContent ?? '');
        periksa(teks.length > 20 && !mintaKetukGambar(teks) && /daftar/i.test(teks), `misi 3 ${varian}: Cara main memakai petunjuk daftar, bukan ketuk gambar ("${ringkasTeks(teks)}")`);
        if (varian === 'ringan') await tangkap(page, 'sesudah-mission3-light-help.png', { penuh: true });
      } else {
        // Folder laporan di kanvas -> checklist yang sama; setelah ditutup fokus ke tombol HTML.
        const o = (await objekAdegan(page)).find((x) => x.role === 'doc' && x.refId === 'checklist');
        if (periksa(Boolean(o), 'misi 3 penuh: objek "Folder laporan" (doc) ada di adegan')) {
          await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
          await ketukDunia(page, o.x, o.y, false);
          await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), 'misi 3 penuh: checklist dari kanvas', 5000);
          await tidur(700);
          const d2 = await infoDialog(page);
          periksa(d2.butirChecklist === 4 && d2.fokusDalam, `misi 3 penuh: ketuk folder di kanvas membuka checklist 4 butir, fokus di dialog (${d2.butirChecklist}, ${d2.aktif})`);
          await page.keyboard.press('Escape');
          await tidur(350);
          const f = await page.evaluate(() => ({ buka: document.activeElement?.getAttribute('data-misi-buka') ?? null, teks: (document.activeElement?.textContent ?? '').trim().slice(0, 30) }));
          periksa(f.buka === 'checklist', `misi 3 penuh: dari kanvas, fokus kembali ke tombol HTML "${f.teks}"`);
        }
      }
    } finally {
      await tutup();
    }
  }

  // Misi 7 mode ringan: keterangan kalender (objek `info` di adegan) terbaca lewat HTML.
  const { page, tutup } = await halamanBaru({ vp: HP390, nama: 'A-m07' });
  try {
    await bukaMisi(page, 7, 'ringan');
    await siapMulai(page);
    periksa(await klik(page, '.tugas-alat [data-misi-buka="dokumen"]'), 'misi 7 ringan: tombol Dokumen ada');
    await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), 'misi 7 ringan: dialog dokumen', 5000);
    await tidur(300);
    const d = await infoDialog(page);
    const kalender = /Tanggal kejadian:?\s*05 Sep 2026/.test(d.teks);
    periksa(kalender, `misi 7 ringan: "Tanggal kejadian: 05 Sep 2026" terbaca di dialog HTML${kalender ? '' : ` ("${ringkasTeks(d.teks)}")`}`);
    periksa((await page.evaluate(() => document.querySelectorAll('canvas').length)) === 0, 'misi 7 ringan: tanpa kanvas');
  } finally {
    await tutup();
  }
}

// ------------------------------------------------------------------ B: fokus dialog

async function ujiB() {
  const { page, tutup } = await halamanBaru({ vp: HP390, nama: 'B-m10' });
  try {
    await bukaMisi(page, 10, 'penuh');
    await siapMulai(page);
    const sel = '.tugas-alat [data-misi-buka="dokumen"]';
    if (!periksa(await page.$(sel), 'misi 10: tombol Dokumen di baris alat')) return;
    await page.focus(sel);
    await page.evaluate((s) => document.querySelector(s)?.setAttribute('data-uji-pembuka', '1'), sel);
    await page.keyboard.press('Enter');
    await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), 'misi 10: dialog Dokumen terbuka', 5000);
    await tidur(450);
    const d = await infoDialog(page);
    periksa(d.fokusDalam, `misi 10: fokus masuk ke dialog saat dibuka (${d.aktif})`);
    periksa(d.rootInert, 'misi 10: #root inert selama dialog terbuka');

    // Di 390x844 isinya hanya sedikit lebih panjang dari kotak: cukup dipastikan sisanya terjangkau keyboard.
    // Gulir isi PANJANG diuji di HP mendatar (ujiGulirDialog) supaya PageDown benar-benar bermakna.
    const g0 = await gulirDialog(page);
    catatUkur('B 390 isi dialog misi 10 (tinggi isi / kotak)', g0 ? `${g0.sh} / ${g0.ch}px` : '-');
    if (g0 && g0.sh > g0.ch + 1) {
      await page.keyboard.press('ArrowDown');
      await tidur(450);
      await page.keyboard.press('PageDown');
      await tidur(550);
      const g1 = await gulirDialog(page);
      periksa(g1 && g1.st >= g1.sh - g1.ch - 1, `misi 10 390x844: sisa isi dialog terjangkau dengan panah/PageDown (${g0.st} -> ${g1?.st}px dari maks ${g1 ? g1.sh - g1.ch : '?'})`);
    }

    // Tab & Shift+Tab masing-masing 10x: fokus tidak pernah keluar dialog.
    const keluar = [];
    const dikunjungi = new Set();
    for (let i = 1; i <= 10; i++) {
      await page.keyboard.press('Tab');
      await tidur(60);
      const x = await infoDialog(page);
      dikunjungi.add(x.aktif);
      if (!x.fokusDalam) keluar.push(`Tab ${i}: ${x.aktif}`);
      if (i === 1) await tangkap(page, 'sesudah-modal-focus-behind.png', { gulirAtas: false });
    }
    await page.keyboard.down('Shift');
    for (let i = 1; i <= 10; i++) {
      await page.keyboard.press('Tab');
      await tidur(60);
      const x = await infoDialog(page);
      dikunjungi.add(x.aktif);
      if (!x.fokusDalam) keluar.push(`Shift+Tab ${i}: ${x.aktif}`);
    }
    await page.keyboard.up('Shift');
    periksa(keluar.length === 0, `misi 10: Tab 10x & Shift+Tab 10x tetap di dalam dialog${keluar.length ? ` (keluar: ${keluar.slice(0, 3).join('; ')})` : ''}`);
    catatUkur('B tujuan fokus Tab di dialog', [...dikunjungi].join(' | '));
    periksa((await infoDialog(page)).rootInert, 'misi 10: #root tetap inert setelah Tab berputar');

    await page.keyboard.press('Escape');
    await tidur(400);
    const e = await page.evaluate(() => ({
      dialog: Boolean(document.querySelector('[role="dialog"]')),
      kembali: document.activeElement?.hasAttribute('data-uji-pembuka') ?? false,
      aktif: (document.activeElement?.textContent ?? '').trim().slice(0, 30),
      inert: document.getElementById('root')?.hasAttribute('inert') ?? false,
    }));
    periksa(!e.dialog, 'misi 10: Escape menutup dialog');
    periksa(e.kembali, `misi 10: fokus kembali ke tombol Dokumen pembuka ("${e.aktif}")`);
    periksa(!e.inert, 'misi 10: #root tidak inert lagi setelah ditutup');
  } finally {
    await tutup();
  }

  await ujiGulirDialog();

  // Dialog dibuka dari ketukan kanvas (kartu polis misi 5, HP sentuh): fokus kembali ke tombol HTML Dokumen.
  const h = await halamanBaru({ vp: HP390, nama: 'B-m05' });
  try {
    await bukaMisi(h.page, 5, 'penuh');
    await adeganBerobjek(h.page, 'misi 5', () => tungguDiam(h.page, modeMisi, 30000, 'intro'));
    await siapMulai(h.page);
    const o = (await objekAdegan(h.page)).find((x) => x.role === 'doc');
    if (periksa(Boolean(o), `misi 5: objek dokumen (kartu polis) ada di adegan (${o?.id})`)) {
      await h.page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await ketukDunia(h.page, o.x, o.y, true);
      await tunggu(h.page, () => Boolean(document.querySelector('[role="dialog"]')), 'misi 5: dialog dari kanvas', 5000);
      await tidur(700);
      const d = await infoDialog(h.page);
      periksa(d.ada && d.rootInert, 'misi 5: ketuk kartu polis di kanvas membuka dialog, latar inert');
      if (!d.fokusDalam) {
        // Ketukan sentuh diikuti event mouse tiruan (mousedown) di titik yang sama, yang kini jatuh di isi
        // dialog yang tidak bisa difokus: browser memindah fokus ke body. Bukan ambang tugas; dicatat.
        beri(`misi 5 (sentuh): setelah dialog dibuka dari ketukan kanvas fokus ada di ${d.aktif}, bukan di dalam dialog`);
        await h.page.keyboard.press('Tab');
        await tidur(150);
        const t = await infoDialog(h.page);
        periksa(t.fokusDalam, `misi 5: Tab dari body masuk ke dalam dialog (${t.aktif})`);
      } else periksa(true, `misi 5: fokus di dalam dialog (${d.aktif})`);
      await h.page.keyboard.press('Escape');
      await tidur(400);
      const f = await h.page.evaluate(() => ({ buka: document.activeElement?.getAttribute('data-misi-buka') ?? null, teks: (document.activeElement?.textContent ?? '').trim().slice(0, 30), dialog: Boolean(document.querySelector('[role="dialog"]')) }));
      periksa(!f.dialog && f.buka === 'dokumen', `misi 5: setelah ditutup fokus ke tombol HTML "${f.teks}" (bukan body/kanvas)`);
    }
  } finally {
    await h.tutup();
  }
}

const gulirDialog = (page) => page.evaluate(() => {
  const i = document.querySelector('[role="dialog"] .mdl-isi');
  return i ? { st: Math.round(i.scrollTop), sh: i.scrollHeight, ch: i.clientHeight } : null;
});

/** Isi dialog panjang (Dokumen misi 10 di HP mendatar 844x390): panah, PageDown, wilayah isi, sentuh. */
async function ujiGulirDialog() {
  const vp = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 1 };
  const { page, tutup } = await halamanBaru({ vp, nama: 'B-m10-mendatar' });
  try {
    await bukaMisi(page, 10, 'penuh');
    await siapMulai(page);
    await page.focus('.tugas-alat [data-misi-buka="dokumen"]');
    await page.keyboard.press('Enter');
    await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), 'misi 10 mendatar: dialog Dokumen', 5000);
    await tidur(450);
    const g0 = await gulirDialog(page);
    if (!periksa(g0 && g0.sh > g0.ch + 200, `misi 10 844x390: isi dialog panjang (${g0?.sh} > ${g0?.ch}px)`)) return;
    await page.keyboard.press('ArrowDown');
    await tidur(450);
    const g1 = await gulirDialog(page);
    await page.keyboard.press('PageDown');
    await tidur(550);
    const g2 = await gulirDialog(page);
    periksa(g1.st > g0.st, `misi 10 844x390: panah bawah menggulir isi (${g0.st} -> ${g1.st}px)`);
    periksa(g2.st - g1.st > 40, `misi 10 844x390: PageDown menggulir isi satu halaman (${g1.st} -> ${g2.st}px)`);
    // Wilayah isi bisa dicapai Tab dan digulir dengan tombol halaman bawaan browser.
    let wilayah = false;
    for (let i = 0; i < 8 && !wilayah; i++) {
      await page.keyboard.press('Tab');
      wilayah = await page.evaluate(() => document.activeElement?.classList.contains('mdl-isi') ?? false);
    }
    periksa(wilayah, 'misi 10 844x390: wilayah isi dialog bisa difokus dengan Tab');
    if (wilayah) {
      await page.keyboard.press('PageDown');
      await tidur(550);
      const g3 = await gulirDialog(page);
      periksa(g3.st > g2.st || g3.st >= g3.sh - g3.ch - 1, `misi 10 844x390: PageDown di wilayah isi menggulir (${g2.st} -> ${g3.st}px)`);
      await page.keyboard.press('Home');
      await tidur(550);
    }
    // Sentuh: geser jari ke atas di dalam isi dialog.
    await page.evaluate(() => { const i = document.querySelector('[role="dialog"] .mdl-isi'); if (i) i.scrollTop = 0; });
    await tidur(200);
    const q = await page.evaluate(() => { const r = document.querySelector('[role="dialog"] .mdl-isi').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.75, h: r.height }; });
    await page.touchscreen.touchStart(q.x, q.y);
    for (let i = 1; i <= 10; i++) { await page.touchscreen.touchMove(q.x, q.y - i * (q.h * 0.05)); await tidur(16); }
    await page.touchscreen.touchEnd();
    await tidur(600);
    const g4 = await gulirDialog(page);
    periksa(g4.st > 0, `misi 10 844x390: geser jari menggulir isi dialog (0 -> ${g4.st}px)`);
    await tangkap(page, 'sesudah-dialog-panjang-mendatar.png', { gulirAtas: false });
  } finally {
    await tutup();
  }
}

// ------------------------------------------------------------------ C: onboarding HP & bonus

const bacaBonus = (page) => page.evaluate(() => {
  const b = document.querySelector('.solo-bonus');
  const m = (b?.textContent ?? '').match(/(\d+)\s*dtk/);
  return { detik: m ? Number(m[1]) : null, status: b?.getAttribute('data-status') ?? null };
});

async function ujiC() {
  for (const [nama, vp] of [['390x844', HP390], ['360x740', HP360]]) {
    const { page, tutup } = await halamanBaru({ vp, nama: `C-${nama}` });
    try {
      await bukaMisi(page, 1, 'penuh');
      await tidur(700);
      const gerbang = await page.evaluate(() => {
        const b = document.querySelector('.misi-mulai-aksi .primary-action');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        const atas = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, sy: Math.round(scrollY), tertutup: !(atas && b.contains(atas)) };
      });
      periksa(gerbang && gerbang.sy === 0 && gerbang.top >= 0 && gerbang.bottom <= gerbang.vh && !gerbang.tertutup,
        `misi 1 ${nama} kunjungan pertama: "Siap mulai" terlihat tanpa gulir (y ${gerbang?.top}-${gerbang?.bottom}, viewport ${gerbang?.vh})`);
      catatUkur(`C ${nama} "Siap mulai" y`, gerbang ? `${gerbang.top}-${gerbang.bottom}` : '-');

      const b0 = await bacaBonus(page);
      await tidur(3500);
      const b1 = await bacaBonus(page);
      periksa(b0.detik !== null && b0.detik === b1.detik && b1.status === 'siap',
        `misi 1 ${nama}: bonus tidak berkurang sebelum "Siap mulai" (${b0.detik} -> ${b1.detik} dtk setelah 3,5 dtk, status ${b1.status})`);
      if (nama === '390x844') {
        catatUkur('C bonus sebelum interaksi', `${b0.detik} -> ${b1.detik} dtk (3,5 dtk)`);
        await tangkap(page, 'sesudah-mission1-mobile-viewport.png');
      }

      await siapMulai(page);
      const m = await page.evaluate(() => {
        const panel = document.querySelector('.misi-panel');
        const pertama = [...(panel?.querySelectorAll('.opsi, .angka, .kolom, .item-chip') ?? [])].find((el) => el.getClientRects().length > 0 && !el.closest('details:not([open])'));
        const aksi = document.querySelector('.misi-aksi');
        const adegan = document.querySelector('.misi-adegan');
        const r = (el) => (el ? el.getBoundingClientRect() : null);
        const o = r(pertama); const a = r(aksi); const g = r(adegan);
        return {
          opsi: o ? { top: Math.round(o.top), bottom: Math.round(o.bottom), teks: (pertama.textContent || '').trim().slice(0, 30) } : null,
          aksiTop: a ? Math.round(a.top) : null,
          adeganTop: g ? Math.round(g.top) : null,
          vh: innerHeight, sy: Math.round(scrollY),
          kiat: Boolean(document.querySelector('.misi-kiat .misi-kiat-tutup')),
        };
      });
      const terlihat = m.opsi && m.aksiTop !== null && m.opsi.top >= 0 && m.opsi.bottom <= m.aksiTop + 1 && m.opsi.bottom <= m.vh;
      periksa(terlihat, `misi 1 ${nama}: setelah mulai, opsi pertama terlihat penuh di atas bar aksi (opsi ${m.opsi?.top}-${m.opsi?.bottom}, bar aksi ${m.aksiTop}, gulir ${m.sy})`);
      catatUkur(`C ${nama} setelah mulai: opsi pertama y / bar aksi y / adegan y / gulir`, `${m.opsi?.top}-${m.opsi?.bottom} / ${m.aksiTop} / ${m.adeganTop} / ${m.sy}`);
      if (nama === '390x844') await tangkap(page, 'sesudah-mission1-mobile-mulai.png', { gulirAtas: false });
      // Bantuan kunjungan pertama ringkas & bisa ditutup (kontrak 5C).
      if (periksa(m.kiat, `misi 1 ${nama}: petunjuk kunjungan pertama tampil satu baris dengan tombol tutup`)) {
        await klik(page, '.misi-kiat .misi-kiat-tutup');
        await tidur(250);
        periksa(!(await page.$('.misi-kiat')), `misi 1 ${nama}: petunjuk kunjungan pertama bisa ditutup`);
      }
      // Bonus baru berjalan setelah "Siap mulai" (adegan siap atau batas tunggu adegan 8 dtk).
      const mulai = Date.now();
      let jalan = null;
      while (Date.now() - mulai < 14000) {
        const b = await bacaBonus(page);
        if (b.status === 'jalan' && b.detik !== null && b.detik < (b0.detik ?? 0)) { jalan = b; break; }
        await tidur(400);
      }
      periksa(jalan, `misi 1 ${nama}: bonus mulai berjalan setelah "Siap mulai" (${jalan ? `${b0.detik} -> ${jalan.detik} dtk` : 'tidak berjalan'})`);
    } finally {
      await tutup();
    }
  }
  await ujiCMultiplayer();
}

const rpc = (sock, ev, payload) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('timeout ' + ev)), 12000);
  sock.emit(ev, payload, (r) => { clearTimeout(t); res(r); });
});

/** Multiplayer: room uji 1 pemain. Briefing menampilkan cara main; durasi fase tetap dari server (tanpa gerbang). */
async function ujiCMultiplayer() {
  const m1 = misiNo(1);
  const host = ioClient(SERVER, { transports: ['websocket'], forceNew: true, reconnection: false });
  let code = null;
  let hostToken = null;
  let halaman = null;
  try {
    await Promise.race([new Promise((r) => host.once('connect', r)), tidur(10000).then(() => { throw new Error('socket host tidak tersambung ke ' + SERVER); })]);
    const dibuat = await rpc(host, 'host:create', { eventName: 'Uji Temuan Review C', ...(process.env.RAKSA_PIN ? { pin: process.env.RAKSA_PIN } : {}) });
    if (!periksa(dibuat?.ok, `multiplayer: room uji dibuat di ${SERVER}${dibuat?.ok ? '' : ` (${dibuat?.error})`}`)) return;
    ({ code, hostToken } = dibuat.data);
    let S = dibuat.data.state;
    const riwayat = [];
    host.on('state', (st) => { S = st; riwayat.push({ phase: st.phase, dur: st.phaseDurationMs, round: st.roundIndex }); });

    const pemain = ioClient(SERVER, { transports: ['websocket'], forceNew: true, reconnection: false });
    await new Promise((r) => pemain.once('connect', r));
    const jm = await rpc(pemain, 'player:join', { code, nickname: 'Weli', look: LOOK });
    pemain.close();
    if (!periksa(jm?.ok, `multiplayer: pemain Weli bergabung ke room ${code}`)) return;

    halaman = await halamanBaru({ vp: HP390, nama: 'C-acara' });
    const { page } = halaman;
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((id) => {
      localStorage.setItem(`raksa:player:${id.code}`, JSON.stringify(id));
      localStorage.setItem('raksa:player:last', JSON.stringify(id.code));
    }, { code, playerId: jm.data.playerId, playerToken: jm.data.playerToken, nickname: 'Weli', look: LOOK });
    await page.goto(`${BASE}/lobby`, { waitUntil: 'domcontentloaded' });
    await tunggu(page, () => /Saya siap|Ganti karakter|segera/i.test(document.body.innerText), 'multiplayer: lobby pemain', 20000);

    const mulai = await rpc(host, 'host:action', { code, hostToken, action: 'startMatch' });
    if (mulai?.data?.state) S = mulai.data.state;
    periksa(mulai?.ok && S.phase === 'BRIEFING', `multiplayer: host memulai pertandingan -> BRIEFING (${S.phase})`);
    // Misi ronde pertama mengikuti playlist bawaan server (bisa paket latihan atau paket acara).
    const misi = S.mission ?? m1;
    const harapBriefing = misi.briefingSeconds > 0 ? misi.briefingSeconds * 1000 : 10_000; // shared/brand.ts PHASE_DURATIONS.briefingMs
    catatUkur('C multiplayer: misi ronde 1', `${misi.id} (briefing ${harapBriefing} ms, ronde ${misi.durationSeconds * 1000} ms)`);
    periksa(S.phaseDurationMs === harapBriefing, `multiplayer: durasi BRIEFING tetap dari data misi ${misi.id} (${S.phaseDurationMs} ms = ${harapBriefing} ms)`);

    const ok = await tunggu(page, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'intro' && Boolean(document.querySelector('.misi-panel .misi-cara-ringkas')), 'multiplayer: panel BRIEFING dengan cara main', harapBriefing);
    if (ok) {
      const b = await page.evaluate(() => {
        const cara = document.querySelector('.misi-panel .misi-cara-ringkas');
        const li = [...(cara?.querySelectorAll('li') ?? [])].filter((x) => x.getClientRects().length > 0);
        const r = cara?.getBoundingClientRect();
        return { n: li.length, teks: li.map((x) => x.textContent.trim()).join(' / '), top: r ? Math.round(r.top) : null, gerbang: Boolean(document.querySelector('.misi-mulai-aksi .primary-action')) };
      });
      periksa(b.n >= 2, `multiplayer: briefing menampilkan cara main ringkas (${b.n} baris: "${ringkasTeks(b.teks)}")`);
      periksa(!b.gerbang, 'multiplayer: tanpa tombol "Siap mulai" (waktu ronde sama untuk semua pemain)');
      catatUkur('C multiplayer: cara main di briefing y', b.top);
      await tangkap(page, 'sesudah-briefing-acara-hp.png');
    }
    // Setelah briefing server sendiri yang memulai ronde; durasi ACTIVE = durasi misi.
    const batas = Date.now() + harapBriefing + 6000;
    while (Date.now() < batas && S.phase === 'BRIEFING') await tidur(200);
    periksa(S.phase === 'ACTIVE' && S.phaseDurationMs === misi.durationSeconds * 1000,
      `multiplayer: ronde ACTIVE mulai sesuai jadwal server, durasi ${misi.durationSeconds} dtk (${S.phase}, ${S.phaseDurationMs} ms)`);
    periksa(await tunggu(page, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', 'multiplayer: pemain langsung menjawab', 8000),
      'multiplayer: pemain langsung masuk mode menjawab (tanpa gerbang)');
    catatUkur('C multiplayer: fase & durasi', riwayat.map((x) => `${x.phase}:${x.dur}`).filter((v, i, a) => a.indexOf(v) === i).join(' '));
  } catch (e) {
    periksa(false, `multiplayer: ${String(e?.message || e).slice(0, 120)}`);
  } finally {
    if (code && hostToken) await rpc(host, 'host:action', { code, hostToken, action: 'end' }).catch(() => {});
    host.disconnect();
    await halaman?.tutup();
  }
}

// ------------------------------------------------------------------ D & E: hasil HP dan bintang

async function kirimJawaban(page) {
  await klik(page, '.misi-aksi .primary-action');
  const ok = await tunggu(page, modeMisi, 'hasil misi tampil', 15000, 'reveal');
  await tidur(1400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await tidur(300);
  return ok;
}

const bacaRaihan = (page) => page.evaluate(() => {
  const b = document.querySelector('.hasil-raihan .solo-bintang');
  return {
    bintang: b ? Number(b.getAttribute('data-jumlah')) : null,
    teks: document.querySelector('.hasil-raihan')?.textContent ?? '',
    arti: document.querySelector('.hasil-raihan .solo-arti')?.textContent ?? '',
  };
});

const bacaSolo = (page) => page.evaluate(() => {
  try { return { solo: JSON.parse(localStorage.getItem('raksa:solo') ?? 'null'), cadangan: localStorage.getItem('raksa:solo:cadangan-v1') }; } catch { return { solo: null, cadangan: null }; }
});

/** Kartu titik misi di peta (urut misi 1..10): bintang & tanda dicoba. */
const bacaPeta = (page) => page.evaluate(() => {
  const titik = [...document.querySelectorAll('.solo-jalur .solo-titik')].map((li) => ({
    bintang: Number(li.querySelector('.solo-capai .solo-bintang')?.getAttribute('data-jumlah') ?? -1),
    dicoba: /Sudah dicoba/i.test(li.querySelector('.solo-tanda-dicoba')?.textContent ?? ''),
  }));
  const angka = [...document.querySelectorAll('.solo-angka > div')].map((d) => `${(d.querySelector('dt')?.textContent ?? '').trim()} ${(d.querySelector('dd')?.textContent ?? '').replace(/\s+/g, '').trim()}`);
  return { titik, angka, legenda: document.querySelector('.solo-legenda')?.textContent ?? '' };
});

async function ujiDE() {
  const { page, tutup } = await halamanBaru({ vp: HP390, nama: 'DE-hp' });
  try {
    // D + E: jawaban salah misi 1 (0%).
    temuanKini = 'D';
    await bukaMisi(page, 1, 'penuh');
    await siapMulai(page);
    const salah = misiNo(1).steps[0].options.find((o) => o.id !== 'dokumentasi');
    periksa(await klikTeks(page, 'button.opsi', salah.label), `misi 1: pilih jawaban salah "${salah.label}"`);
    await tidur(200);
    await kirimJawaban(page);
    const h = await page.evaluate(() => {
      const r = (s) => { const el = document.querySelector(s); if (!el || el.getClientRects().length === 0) return null; const q = el.getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(q.bottom) }; };
      return { vonis: r('.hasil-judul'), vonisTeks: document.querySelector('.hasil-judul')?.textContent ?? '', adegan: r('.misi-adegan'), aksi: r('.hasil-aksi .primary-action'), aksiTeks: (document.querySelector('.hasil-aksi .primary-action')?.textContent ?? '').trim(), vh: innerHeight, sy: Math.round(scrollY) };
    });
    periksa(h.vonis && h.adegan && h.vonis.top < h.adegan.top, `misi 1 salah 390x844: vonis "${h.vonisTeks}" di atas adegan (vonis y ${h.vonis?.top}, adegan y ${h.adegan?.top})`);
    periksa(h.vonis && h.sy === 0 && h.vonis.bottom <= h.vh, `misi 1 salah 390x844: vonis di layar pertama (y ${h.vonis?.top}-${h.vonis?.bottom}, viewport ${h.vh})`);
    periksa(h.aksi && h.aksi.top >= 0 && h.aksi.bottom <= h.vh, `misi 1 salah 390x844: tombol aksi utama "${h.aksiTeks}" terlihat tanpa gulir (y ${h.aksi?.top}-${h.aksi?.bottom})`);
    catatUkur('D 390 vonis y', h.vonis?.top);
    catatUkur('D 390 tombol aksi y', h.aksi ? `${h.aksi.top}-${h.aksi.bottom} ("${h.aksiTeks}")` : '-');
    catatUkur('D 390 adegan y', h.adegan?.top);
    await tangkap(page, 'sesudah-mission1-wrong-mobile.png', { penuh: true });

    temuanKini = 'E';
    const r0 = await bacaRaihan(page);
    periksa(r0.bintang === 0 && /0 dari 3 bintang/.test(r0.teks), `misi 1 0%: 0 bintang di hasil (data-jumlah ${r0.bintang})`);
    periksa(/sudah dicoba/i.test(r0.teks), 'misi 1 0%: hasil menyebut percobaan tercatat "sudah dicoba"');
    periksa(/ketepatan/i.test(r0.arti), `misi 1 0%: arti bintang dijelaskan di hasil ("${ringkasTeks(r0.arti)}")`);
    catatUkur('E bintang 0%', r0.bintang);
    const s0 = await bacaSolo(page);
    const c0 = s0.solo?.misi?.['m01-parkir'];
    periksa(s0.solo?.versi === 2 && c0?.bintang === 0 && c0?.kali === 1, `misi 1 0%: tersimpan bintang ${c0?.bintang}, kali ${c0?.kali}, versi ${s0.solo?.versi}`);

    await page.goto(`${BASE}/solo?adegan=penuh`, { waitUntil: 'domcontentloaded' });
    await tunggu(page, () => document.querySelectorAll('.solo-jalur .solo-titik').length === 10, 'peta misi', 15000);
    const p0 = await bacaPeta(page);
    periksa(p0.titik[0]?.bintang === 0 && p0.titik[0]?.dicoba, `peta: misi 1 = 0 bintang + "Sudah dicoba" (${JSON.stringify(p0.titik[0])})`);
    periksa(/ketepatan/i.test(p0.legenda), 'peta: arti bintang dijelaskan (legenda)');

    // Akurasi 1 -> 3 bintang (terbaik menggantikan 0).
    await bukaMisi(page, 1, 'penuh');
    await siapMulai(page);
    periksa(await klikTeks(page, 'button.opsi', labelOpsi(1, 's1', 'dokumentasi')), 'misi 1: pilih jawaban tepat');
    await tidur(200);
    await kirimJawaban(page);
    const r1 = await bacaRaihan(page);
    periksa(r1.bintang === 3 && /3 dari 3 bintang/.test(r1.teks), `misi 1 100%: 3 bintang di hasil (data-jumlah ${r1.bintang})`);
    const s1 = await bacaSolo(page);
    periksa(s1.solo?.misi?.['m01-parkir']?.bintang === 3 && s1.solo?.misi?.['m01-parkir']?.kali === 2, `misi 1 100%: tersimpan 3 bintang, kali 2 (${JSON.stringify(s1.solo?.misi?.['m01-parkir'])})`);

    // D: misi 2 jawaban sebagian (2 tepat + 1 salah).
    temuanKini = 'D';
    await bukaMisi(page, 2, 'penuh');
    await siapMulai(page);
    for (const id of ['foto-full', 'foto-depan-kiri', 'foto-kucing']) {
      periksa(await klikTeks(page, 'button.opsi', labelOpsi(2, 'bukti', id)), `misi 2: pilih "${labelOpsi(2, 'bukti', id)}" lewat daftar`);
      await tidur(200);
    }
    await kirimJawaban(page);
    const s = await page.evaluate(() => {
      const vis = (el) => el && el.getClientRects().length > 0 && !el.closest('details:not([open])');
      const adegan = document.querySelector('.misi-adegan')?.getBoundingClientRect().top ?? null;
      const baris = [...document.querySelectorAll('.hasil-daftar .rl-baris li')].filter(vis).map((li) => ({ teks: (li.textContent || '').replace(/\s+/g, ' ').trim(), top: Math.round(li.getBoundingClientRect().top), bottom: Math.round(li.getBoundingClientRect().bottom) }));
      const alasan = document.querySelector('.hasil-alasan');
      const aksi = document.querySelector('.hasil-aksi .primary-action');
      const q = (el) => (vis(el) ? { top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom) } : null);
      return { status: document.querySelector('.hasil')?.getAttribute('data-hasil'), baris, alasan: q(alasan), alasanTeks: alasan?.textContent ?? '', aksi: q(aksi), adegan: adegan === null ? null : Math.round(adegan), vh: innerHeight };
    });
    const kamuPilih = s.baris.find((b) => /^Kamu pilih:/.test(b.teks));
    // Baris jawaban tepat: "Yang tepat:" (bila belum ada yang tepat) atau, untuk pilihan ganda sebagian,
    // "Masih terlewat:" (jawaban tepat yang belum dipilih) di samping "Sudah tepat:" (lihat HasilMisi.BarisRinci).
    const yangTepat = s.baris.find((b) => /^(Yang tepat|Masih terlewat):/.test(b.teks));
    const sudahTepat = s.baris.find((b) => /^Sudah tepat:/.test(b.teks));
    const diAtasAdegan = (x) => x && s.adegan !== null && x.bottom <= s.adegan;
    const diLayar = (x) => x && x.top >= 0 && x.bottom <= s.vh;
    periksa(s.status === 'sebagian', `misi 2: hasil "sebagian" (${s.status})`);
    periksa(kamuPilih && diAtasAdegan(kamuPilih) && diLayar(kamuPilih), `misi 2 sebagian: baris "${kamuPilih?.teks ?? 'Kamu pilih'}" terlihat di layar pertama, di atas adegan (y ${kamuPilih?.top})`);
    periksa(yangTepat && diAtasAdegan(yangTepat) && diLayar(yangTepat), `misi 2 sebagian: baris jawaban tepat "${yangTepat?.teks ?? 'Yang tepat'}" terlihat di layar pertama (y ${yangTepat?.top})`);
    periksa(sudahTepat && diLayar(sudahTepat), `misi 2 sebagian: baris "${sudahTepat?.teks ?? 'Sudah tepat'}" terlihat (y ${sudahTepat?.top})`);
    periksa(s.alasan && diAtasAdegan(s.alasan) && diLayar(s.alasan), `misi 2 sebagian: alasan singkat terlihat tanpa membuka lipatan (y ${s.alasan?.top}-${s.alasan?.bottom}: "${ringkasTeks(s.alasanTeks)}")`);
    periksa(s.aksi && diLayar(s.aksi), `misi 2 sebagian: tombol aksi utama terlihat tanpa gulir (y ${s.aksi?.top}-${s.aksi?.bottom})`);
    catatUkur('D 390 misi 2 sebagian: Kamu pilih / jawaban tepat / alasan / aksi / adegan y', `${kamuPilih?.top} / ${yangTepat?.top} / ${s.alasan?.top} / ${s.aksi?.top} / ${s.adegan}`);
    await tangkap(page, 'sesudah-mission2-sebagian-mobile.png');
  } finally {
    await tutup();
  }

  // E: progres format lama tersuntik -> dimigrasi, dicadangkan mentah.
  temuanKini = 'E';
  for (const [mentah, nama] of [[PROGRES_LAMA_E, 'kontrak'], [PROGRES_LAMA_REVIEW, 'review']]) {
    const { page: p, tutup: t } = await halamanBaru({ vp: DESKTOP, nama: `E-${nama}`, suntikSolo: mentah });
    try {
      await p.goto(`${BASE}/solo?adegan=penuh`, { waitUntil: 'domcontentloaded' });
      await tunggu(p, () => document.querySelectorAll('.solo-jalur .solo-titik').length === 10, `peta misi (progres lama ${nama})`, 15000);
      await tidur(500);
      const peta = await bacaPeta(p);
      const s = await bacaSolo(p);
      periksa(peta.titik[0]?.bintang === 0 && peta.titik[0]?.dicoba, `progres lama (${nama}): peta misi 1 = 0 bintang + "Sudah dicoba" (${JSON.stringify(peta.titik[0])})`);
      periksa(s.cadangan === mentah, `progres lama (${nama}): 'raksa:solo:cadangan-v1' berisi data mentah lama`);
      const c = s.solo?.misi?.['m01-parkir'];
      periksa(s.solo?.versi === 2 && c?.bintang === 0 && c?.akurasi === 0 && c?.poin === 0 && c?.kali === 1, `progres lama (${nama}): dimigrasi ke versi 2, bintang 0, akurasi/poin/kali tetap (${JSON.stringify(c)})`);
      if (nama === 'review') {
        const ok = peta.titik[1]?.bintang === 3 && peta.titik[8]?.bintang === 3 && peta.titik.filter((x) => x.dicoba).length === 3;
        periksa(ok, `progres lama (review): misi 2 & 9 tetap 3 bintang, 3 misi dicoba (${peta.angka.join(' | ')})`);
        catatUkur('E peta progres review (angka kepala)', peta.angka.join(' | '));
        await tangkap(p, 'sesudah-progress-persisted.png', { penuh: true });
      }
    } finally {
      await t();
    }
  }
}

// ------------------------------------------------------------------ F: konsistensi visual

const gayaHalaman = () => {
  const vis = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  const m = [...document.querySelectorAll('header .mrk')].find(vis) ?? null;
  const judul = [...document.querySelectorAll('main h1, main h2')].find((h) => vis(h) && !h.classList.contains('sr-only')) ?? null;
  const utama = [...document.querySelectorAll('.btn-utama, .primary-action')].find(vis) ?? null;
  const cs = (el) => getComputedStyle(el);
  return {
    merek: Boolean(m),
    kata: m ? [m.querySelector('.mrk-raksa')?.textContent ?? '', m.querySelector('.mrk-game')?.textContent ?? ''].join(' ').trim() : '',
    fontMerek: m ? cs(m).fontFamily : null,
    fontJudul: judul ? cs(judul).fontFamily : null,
    judul: judul ? (judul.textContent || '').trim().slice(0, 30) : null,
    tombol: utama ? { teks: (utama.textContent || '').trim().slice(0, 30), bg: cs(utama).backgroundColor, radius: cs(utama).borderRadius } : null,
  };
};

const rgb = (s) => (s || '').match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
const hijau = (s) => { const [r, g, b] = rgb(s); return g > r + 25 && g > b + 10; };
const kuning = (s) => { const [r, g, b] = rgb(s); return r > 200 && g > 150 && b < 120; };

async function ujiF() {
  const g = {};
  // Host (tanpa room): header bersama, tombol utama, judul.
  {
    const { page, tutup } = await halamanBaru({ vp: DESKTOP, nama: 'F-host', profil: false });
    try {
      await page.goto(`${BASE}/acara/host`, { waitUntil: 'domcontentloaded' });
      await tunggu(page, () => Boolean(document.querySelector('header .mrk') && document.querySelector('main h1, main h2') && document.querySelector('.btn-utama')), 'layar host', 20000);
      await tidur(800);
      g.host = await page.evaluate(gayaHalaman);
      await tangkap(page, 'sesudah-host-desktop.png', { penuh: true });
    } finally {
      await tutup();
    }
  }
  // Pemain: halaman awal (HP & desktop), peta solo & layar misi desktop.
  for (const [nama, vp, file] of [['awal-hp', HP390, 'sesudah-home-mobile.png'], ['awal-desktop', DESKTOP, 'sesudah-home-desktop.png']]) {
    const { page, tutup } = await halamanBaru({ vp, nama: `F-${nama}` });
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await tunggu(page, () => document.querySelector('.lp-join') && document.querySelectorAll('.lp-pintu').length >= 2, `halaman awal ${nama}`, 20000);
      await tidur(900);
      g[nama] = await page.evaluate(gayaHalaman);
      const p = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const c = q('.lp-join');
        const r = c?.getBoundingClientRect();
        const pusat = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        const judul = q('.lp-judul');
        return {
          cerita: q('.lp-pintu-cerita-solo')?.getAttribute('href') ?? null, latihan: q('.lp-pintu-latihan')?.getAttribute('href') ?? null, acara: c ? '/join' : null,
          ceritaTeks: (q('.lp-join-judul')?.textContent ?? '').trim().slice(0, 40),
          top: r ? Math.round(r.top) : null, bottom: r ? Math.round(r.bottom) : null, tertutup: !(pusat && c?.contains(pusat)),
          vh: innerHeight, sy: Math.round(scrollY), fontLp: judul ? getComputedStyle(judul).fontFamily : null,
        };
      });
      g[nama].fontJudul = p.fontLp ?? g[nama].fontJudul;
      periksa(/\/cerita$/.test(p.cerita ?? '') && /\/solo$/.test(p.latihan ?? '') && p.acara === '/join', `halaman awal ${nama}: Join Game + mode lama Mini Games / cerita solo (${p.cerita}, ${p.latihan}, ${p.acara})`);
      periksa(p.sy === 0 && p.top !== null && p.top >= 0 && p.bottom <= p.vh && !p.tertutup, `halaman awal ${nama}: kartu "${p.ceritaTeks}" terlihat di layar pertama (y ${p.top}-${p.bottom}, viewport ${p.vh})`);
      catatUkur(`F ${nama}: kartu Join Game y`, `${p.top}-${p.bottom} / ${p.vh}`);
      await tangkap(page, file);
    } finally {
      await tutup();
    }
  }
  {
    const { page, tutup } = await halamanBaru({ vp: DESKTOP, nama: 'F-solo' });
    try {
      await page.goto(`${BASE}/solo?adegan=penuh`, { waitUntil: 'domcontentloaded' });
      await tunggu(page, () => Boolean(document.querySelector('.solo-aksi .primary-action')), 'peta solo', 15000);
      g.solo = await page.evaluate(gayaHalaman);
      await bukaMisi(page, 1, 'penuh');
      g.misi = await page.evaluate(gayaHalaman);
      await page.goto(`${BASE}/acara/layar`, { waitUntil: 'domcontentloaded' });
      await tunggu(page, () => Boolean(document.querySelector('.mrk')), 'layar proyektor', 15000);
      g.proyektor = { merek: await page.evaluate(() => Boolean([...document.querySelectorAll('.mrk')].find((m) => m.getClientRects().length > 0))) };
    } finally {
      await tutup();
    }
  }

  for (const k of ['host', 'awal-hp', 'awal-desktop', 'solo', 'misi']) {
    periksa(g[k]?.merek && g[k].kata === 'RAKSA GAME', `wordmark bersama (Merek) di header ${k} ("${g[k]?.kata}")`);
  }
  periksa(g.proyektor?.merek, 'wordmark bersama (Merek) di layar proyektor');
  const fontMerek = new Set(['host', 'awal-hp', 'awal-desktop', 'solo', 'misi'].map((k) => g[k]?.fontMerek));
  periksa(fontMerek.size === 1, `font wordmark sama di host & pemain (${[...fontMerek].join(' || ')})`);
  periksa(g.host?.tombol && hijau(g.host.tombol.bg) && !kuning(g.host.tombol.bg), `tombol utama host "${g.host?.tombol?.teks}" berlatar hijau, bukan kuning (${g.host?.tombol?.bg})`);
  periksa(g.host?.tombol && g.solo?.tombol && g.host.tombol.bg === g.solo.tombol.bg, `tombol utama host & pemain berwarna sama (${g.host?.tombol?.bg} / ${g.solo?.tombol?.bg})`);
  periksa(g.host?.tombol && g.solo?.tombol && g.host.tombol.radius === g.solo.tombol.radius, `bentuk tombol utama host & pemain sama (sudut ${g.host?.tombol?.radius} / ${g.solo?.tombol?.radius})`);
  periksa(g.host?.fontJudul && g.host.fontJudul === g['awal-desktop']?.fontJudul && g.host.fontJudul === g.solo?.fontJudul,
    `font judul sama: host "${g.host?.judul}" / halaman awal / peta solo (${g.host?.fontJudul})`);
  catatUkur('F tombol utama host', g.host?.tombol ? `${g.host.tombol.teks}: ${g.host.tombol.bg}, sudut ${g.host.tombol.radius}` : '-');
}

// ------------------------------------------------------------------ tangkapan mode cerita (--cerita)

/** Pilihan jalur terbaik episode AUTO-1 (docs/rancangan-mode-cerita.md 3.1) + pemulihan bila tersesat. */
const JALUR = {
  'b1-datang': 'dengar', 'b1-pulih': 'maaf', 'b2-saran': 'dokumentasi', 'b2-bengkel-akibat': 'koreksi', 'b2-ringan-akibat': 'lihat-dulu',
  'b3-bukti-kurang': 'lengkapi', 'b4-polis-salah': 'baca-ulang', 'b5-keberatan': 'jujur', 'b5-tutup': 'rangkum',
};

const snapCerita = (page) => page.evaluate(() => {
  const m = document.querySelector('.cer-main');
  return {
    tampilan: m?.getAttribute('data-tampilan') ?? null,
    node: m?.getAttribute('data-node') ?? null,
    ketik: Boolean(document.querySelector('.cer-dialog-sisa')),
    lanjut: Boolean(document.querySelector('.cer-lanjut')),
    opsi: [...document.querySelectorAll('.cer-opsi')].map((b) => b.getAttribute('data-pilihan')),
    akt: document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') ?? null,
  };
});

/** Maju di dialog (ketuk kotak = kalimat utuh, "Lanjut", pilihan jalur terbaik) sampai `sampai(snap)` benar. */
async function majuCerita(page, sampai, label) {
  for (let i = 0; i < 160; i++) {
    const s = await snapCerita(page);
    if (sampai(s)) return s;
    if (s.tampilan === 'dialog') {
      if (s.ketik) await klik(page, '.cer-dialog');
      else if (s.opsi.length) {
        const p = JALUR[s.node] ?? s.opsi[0];
        await klik(page, `.cer-opsi[data-pilihan="${p}"]`);
      } else if (s.lanjut) await klik(page, '.cer-lanjut');
    } else if (s.tampilan === 'aktivitas' && s.akt === 'reveal') {
      await klik(page, '.cer-umpan-aksi .primary-action');
    }
    await tidur(260);
  }
  periksa(false, `cerita: tidak sampai ke ${label}`);
  return null;
}

/** Pilih opsi langkah aktivitas: ketuk adegan bila interaktif, selain itu lewat daftar HTML. */
async function pilihAktivitas(page, refId, label) {
  const o = (await objekAdegan(page)).find((x) => x.role === 'option' && x.refId === refId);
  if (o) { await ketukDunia(page, o.x, o.y, (await page.viewport()).hasTouch); await tidur(450); return true; }
  const ok = await klikTeks(page, 'button.opsi', label);
  await tidur(250);
  return ok;
}

async function tangkapCerita() {
  temuanKini = 'cerita';
  for (const [akhiran, vp] of [['hp', HP390_TAJAM], ['desktop', DESKTOP]]) {
    const { page, tutup } = await halamanBaru({ vp, nama: `cerita-${akhiran}` });
    try {
      await page.goto(`${BASE}/cerita/auto-1`, { waitUntil: 'domcontentloaded' });
      await tunggu(page, () => Boolean(document.querySelector('.cer-main')), 'panggung cerita', 20000);
      if (await majuCerita(page, (s) => s.node === 'b1-datang' && !s.ketik && s.lanjut, 'baris pertama Bu Rina')) {
        await tidur(400);
        await tangkap(page, `cerita-percakapan-${akhiran}.png`, { tanpaFokus: true });
      }
      if (await majuCerita(page, (s) => s.opsi.length > 0, 'pilihan pertama')) {
        await tidur(700);
        await tangkap(page, `cerita-keputusan-${akhiran}.png`, { gulirAtas: false, tanpaFokus: true });
      }
      // Aktivitas bukti: kartu -> adegan -> dua foto dipilih (tangkap) -> foto ketiga -> umpan balik (tangkap).
      if (await majuCerita(page, (s) => s.tampilan === 'aktivitas' && s.node === 'b3-bukti', 'aktivitas bukti')) {
        const mulaiBukti = async () => {
          await tunggu(page, () => Boolean(document.querySelector('.cer-akt-mulai .primary-action')), 'kartu aktivitas bukti', 20000);
          await klik(page, '.cer-akt-mulai .primary-action');
          await tunggu(page, modeMisi, 'bukti: mode menjawab', 10000, 'play');
        };
        await mulaiBukti();
        await adeganBerobjek(page, 'cerita bukti', mulaiBukti);
        await page.evaluate(() => window.scrollTo(0, 0));
        await tidur(500);
        await pilihAktivitas(page, 'foto-full', 'Foto seluruh mobil');
        await pilihAktivitas(page, 'foto-penyok', 'Foto dekat bemper');
        await tidur(600);
        await tangkap(page, `cerita-aktivitas-bukti-${akhiran}.png`, { tanpaFokus: true });
        await pilihAktivitas(page, 'foto-plat', 'Foto plat nomor');
        await klik(page, '.misi-aksi .primary-action');
        if (await tunggu(page, () => Boolean(document.querySelector('.cer-umpan')), 'bukti: umpan balik', 10000)) {
          await tidur(1500);
          periksa(await page.evaluate(() => document.querySelector('.cer-umpan')?.getAttribute('data-hasil') === 'tepat'), 'cerita: aktivitas bukti dinilai tepat (3 foto benar)');
          await tangkap(page, `cerita-umpan-balik-${akhiran}.png`, { tanpaFokus: true });
        }
      }
      // Aktivitas polis (v2, docs/rancangan-mode-cerita.md 11.5): kartu polis di atas tiga pilihan, baris "Kerusakan
      // benturan" dibuka untuk artinya (tangkap), kartu yang sama di dialog Dokumen (tangkap), lalu jawaban tepat.
      if (await majuCerita(page, (s) => s.tampilan === 'aktivitas' && s.node === 'b4-polis' && s.akt !== 'reveal', 'aktivitas polis')) {
        await tunggu(page, () => Boolean(document.querySelector('.cer-akt-mulai .primary-action')), 'kartu aktivitas polis', 20000);
        periksa(await page.evaluate(() => !document.querySelector('.cer-akt-mulai .kpp, .cer-akt-mulai .misi-mulai-bonus')), 'cerita: kartu aktivitas polis hanya tugas + "Mulai" (kartu polis tampil saat menjawab)');
        await klik(page, '.cer-akt-mulai .primary-action');
        await tunggu(page, modeMisi, 'polis: mode menjawab', 10000, 'play');
        await tidur(1200);
        const kartu = await page.evaluate(() => {
          const k = document.querySelector('.misi-panel .cer-akt-sisipan .kpp');
          const o = document.querySelector('.misi-panel button.opsi');
          return { ada: Boolean(k), diAtas: Boolean(k && o && k.getBoundingClientRect().bottom <= o.getBoundingClientRect().top + 1), opsi: document.querySelectorAll('.misi-panel button.opsi').length };
        });
        periksa(kartu.ada && kartu.diAtas && kartu.opsi === 3, `cerita: kartu polis di atas ${kartu.opsi} pilihan saat menjawab`);
        const baris = await page.evaluate(() => {
          const b = [...document.querySelectorAll('.misi-panel .kpp-tombol')].find((x) => /^Kerusakan benturan/.test((x.textContent || '').trim()));
          if (!b) return null;
          b.click();
          b.scrollIntoView({ block: 'center' });
          return b.getAttribute('aria-controls');
        });
        await tidur(500);
        periksa(baris && await page.evaluate((id) => { const a = document.getElementById(id); return Boolean(a && !a.hidden && a.textContent.trim().length > 20); }, baris), 'cerita: baris kartu "Kerusakan benturan" bisa diketuk untuk melihat artinya');
        await tangkap(page, `cerita-aktivitas-polis-kartu-${akhiran}.png`, { gulirAtas: false, tanpaFokus: true });
        if (await klik(page, '.tugas-alat [data-misi-buka="dokumen"]')) {
          await tunggu(page, () => Boolean(document.querySelector('[role="dialog"]')), 'polis: dialog dokumen', 5000);
          await tidur(700);
          await tangkap(page, `cerita-aktivitas-polis-${akhiran}.png`, { gulirAtas: false });
          await page.keyboard.press('Escape');
          await tidur(400);
        } else periksa(false, 'cerita: tombol Dokumen di aktivitas polis');
        // Jawaban tepat (teks.id.ts akt.polis.opsi.bisa-dinilai, revisi 2 tinjauan: "bisa dilanjutkan untuk dinilai").
        periksa(await klikTeks(page, 'button.opsi', 'Kerusakan ini bisa dilanjutkan'), 'cerita: pilih penjelasan kartu polis yang tepat lewat daftar');
        await tidur(250);
        await klik(page, '.misi-aksi .primary-action');
        if (await tunggu(page, () => Boolean(document.querySelector('.cer-umpan')), 'polis: umpan balik', 10000)) {
          periksa(await page.evaluate(() => document.querySelector('.cer-umpan')?.getAttribute('data-hasil') === 'tepat'), 'cerita: aktivitas polis dinilai tepat');
        }
        await tidur(800);
      }
      // Sampai akhir: SATU kartu hasil (v2, docs/rancangan-mode-cerita.md 11.1), lalu "Lihat perjalananku" dan
      // pemilih bagian ("Coba jalur lain"), masing-masing Modal.
      if (await majuCerita(page, (s) => s.tampilan === 'akhir', 'layar akhir')) {
        await tidur(1200);
        const k = await page.evaluate(() => {
          window.scrollTo(0, 0);
          const bawah = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().bottom) : null; };
          return {
            node: document.querySelector('.cer-main')?.getAttribute('data-node'),
            judul: (document.querySelector('[data-ukur="akhir-judul"]')?.textContent ?? '').trim(),
            aturan: document.querySelector('.akh-kartu')?.getAttribute('data-aturan'),
            aksi: [...document.querySelectorAll('.akh-aksi > a, .akh-aksi > button')].map((e) => (e.textContent || '').trim()),
            utama: bawah('[data-ukur="aksi-utama"]'), kedua: bawah('[data-ukur="aksi-kedua"]'), vh: innerHeight,
          };
        });
        periksa(k.node === 'akhir-tuntas' && k.aturan === 'tuntas-jelas', `cerita: jalur terbaik berakhir di akhir-tuntas, kartu "${k.judul}" (${k.aturan})`);
        periksa(k.aksi.length === 2 && k.utama !== null && k.kedua !== null && k.utama <= k.vh && k.kedua <= k.vh, `cerita ${akhiran}: kartu akhir dengan dua aksi terlihat tanpa gulir ("${k.aksi.join('" / "')}", y<=${Math.max(k.utama ?? 0, k.kedua ?? 0)} / ${k.vh})`);
        catatUkur(`cerita ${akhiran}: kartu akhir aksi utama / kedua y`, `${k.utama} / ${k.kedua} (layar ${k.vh})`);
        await tangkap(page, `cerita-akhir-${akhiran}.png`, { tanpaFokus: true, penuh: akhiran === 'desktop' });
        if (akhiran === 'hp') {
          // "Lihat perjalananku": tiga kelompok (yang membantu / perlu diperhatikan / kenapa) + akhir ditemukan.
          if (await klik(page, '.akh-lihat') && await tunggu(page, () => Boolean(document.querySelector('[role="dialog"] .akh-tinjauan')), 'cerita: Lihat perjalananku', 5000)) {
            await tidur(600);
            const g = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] .akh-kelompok')].map((x) => x.getAttribute('data-kelompok')));
            periksa(g.slice(0, 4).join(',') === 'membantu,perhatian,kenapa,temuan', `cerita: "Lihat perjalananku" berisi kelompok ${g.join(', ')}`);
            await tangkap(page, `cerita-akhir-ringkasan-${akhiran}.png`, { gulirAtas: false, tanpaFokus: true });
            await page.keyboard.press('Escape');
            await tidur(400);
          }
          // Pemilih bagian dari "Coba jalur lain" (akhir baik).
          if (await klik(page, '[data-ukur="aksi-kedua"]') && await tunggu(page, () => Boolean(document.querySelector('[role="dialog"] .akh-pemilih-bab')), 'cerita: pemilih bagian', 5000)) {
            await tidur(600);
            const n = await page.evaluate(() => document.querySelectorAll('[role="dialog"] .akh-pemilih-bab').length);
            periksa(n === 5, `cerita: pemilih bagian menampilkan ${n} bagian yang bisa diulang`);
            await tangkap(page, `cerita-akhir-pemilih-${akhiran}.png`, { gulirAtas: false, tanpaFokus: true });
            await page.keyboard.press('Escape');
            await tidur(400);
          }
        }
      }
    } finally {
      await tutup();
    }

    // Checklist misi 3 di mode ringan (tanpa kanvas).
    const r = await halamanBaru({ vp, nama: `checklist-${akhiran}` });
    try {
      await bukaMisi(r.page, 3, 'ringan');
      await siapMulai(r.page);
      await klik(r.page, '.tugas-alat [data-misi-buka="checklist"]');
      if (await tunggu(r.page, () => Boolean(document.querySelector('[role="dialog"]')), 'checklist ringan', 5000)) {
        await tidur(600);
        await tangkap(r.page, `checklist-ringan-${akhiran}.png`, { gulirAtas: false });
      }
    } finally {
      await r.tutup();
    }
  }
}

// ------------------------------------------------------------------ utama

const UJI = { A: ujiA, B: ujiB, C: ujiC, D: null, E: null, F: ujiF };
let kode = 0;
try {
  const r = await fetch(`${BASE}/api/missions`);
  DATA = await r.json();
  if (!DATA?.missions?.length) throw new Error('data misi kosong');
} catch (e) {
  console.error(`Tidak bisa membaca ${BASE}/api/missions: ${e?.message || e}. Jalankan server/Vite dulu (lihat kepala berkas).`);
  process.exit(1);
}

browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  defaultViewport: null,
  protocolTimeout: 180000,
});
const mulaiUji = Date.now();
try {
  for (const k of TEMUAN) {
    if (k === 'E' && TEMUAN.includes('D')) continue; // D & E dijalankan bersama (hasil yang sama)
    temuanKini = k;
    const fn = k === 'D' || k === 'E' ? ujiDE : UJI[k];
    console.log(`\n--- temuan ${k === 'D' || k === 'E' ? 'D & E' : k}`);
    try { await fn(); } catch (e) { periksa(false, `pengecualian: ${String(e?.stack || e).split('\n').slice(0, 2).join(' ')}`); }
  }
  if (TANGKAP_CERITA) {
    console.log('\n--- tangkapan mode cerita');
    try { await tangkapCerita(); } catch (e) { periksa(false, `pengecualian: ${String(e?.stack || e).split('\n').slice(0, 2).join(' ')}`); }
  }
} finally {
  await browser.close().catch(() => {});
  const lulus = hasil.filter((h) => h.ok).length;
  console.log('\n================ RINGKASAN UJI TEMUAN REVIEW ================');
  console.log(`alamat ${BASE} | socket ${SERVER} | gerak ${GERAK} | ${Math.round((Date.now() - mulaiUji) / 1000)} dtk`);
  for (const k of [...new Set(hasil.map((h) => h.temuan))]) {
    const x = hasil.filter((h) => h.temuan === k);
    console.log(`  ${k.padEnd(7)} ${x.filter((h) => h.ok).length}/${x.length} lulus`);
  }
  console.log('\nangka terukur (sesudah) | sebelum (review 26 Sep, kontrak bagian 9):');
  for (const u of ukur) console.log(`  ${u.nama}: ${u.nilai}${SEBELUM[u.nama] !== undefined ? `   | sebelum ${SEBELUM[u.nama]}` : ''}`);
  console.log('\ntangkapan:', OUT);
  for (const t of tangkapan) console.log(`  ${t.nama} (${t.kb} KB)`);
  console.log(`\nconsole error / pageerror / HTTP 5xx (info, di luar skenario engine gagal): ${konsol.length}`);
  for (const c of konsol.slice(0, 15)) console.log(`  [${c.nama}/${c.tipe}] ${c.teks}`);
  console.log(`\ncatatan di luar ambang (tidak menggagalkan): ${peringatan.length}`);
  for (const p of peringatan) console.log('  - ' + p);
  console.log(`\npemeriksaan: ${lulus}/${hasil.length} lulus, GAGAL ${gagal.length}`);
  for (const g of gagal) console.log('  - ' + g);
  console.log('=============================================================\n');
  kode = gagal.length ? 1 : 0;
}
process.exit(kode);
