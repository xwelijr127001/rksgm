/**
 * T-028: UJI ASAP ROOM dari skenario Episode 2 "Truk Trailer di Jalan Tol" (seed server `sc_ep2_trailer`): host membuka room dari
 * skenario itu, dua peserta masuk dari HP, babak 1 dimainkan sampai peringkat. Sekali jalan penuh (Chromium, bahasa Indonesia)
 * diteruskan sampai 15 babak dan ringkasan akhir; jalan pendek kedua memakai antarmuka Inggris, jalan pendek ketiga WebKit.
 *
 * Server uji = BUILD UJI + DB UJI (aturan tools/uji-room-cerita.mjs, DECISIONS D-35). JANGAN `npm run build` / `npm start`
 * (menimpa / melayani client/dist + server/dist yang bisa sedang dipakai server lain) dan JANGAN data/raksa-game.db:
 *   npx tsc -p server/tsconfig.json --outDir server/dist-uji
 *   DB_FILE=<uji>/raksa-game.db npm run story:dev-setup          # akun uji + seed Episode 2 terbit di DB uji
 *   (cd server && PORT=4003 DB_FILE=<uji>/raksa-game.db CLIENT_DIST=<build client> PUBLIC_BASE_URL=http://127.0.0.1:4003 \
 *     node dist-uji/server/src/index.js)
 *   UI_BASE=http://127.0.0.1:4003 RAKSA_KREDENSIAL=<uji>/dev-staff-credentials.json node tools/cek-room-t028.mjs
 *       [--tanpa-webkit] [--hanya penuh|en|webkit]
 *   <uji> = folder absolut di luar repo; <build client> = build client apa pun dari sumber yang sama (tidak perlu dibuat ulang:
 *   T-028 tidak mengubah client). Waktu room = waktu produksi (baca bersama 8-25 d, jawab 30 d, konsekuensi 10 d).
 * Env wajib: UI_BASE (loopback; port 4000-4002 ditolak: alat ini membuat room), RAKSA_KREDENSIAL (kata sandi akun uji dari
 * dev-setup DB uji: uji.host dan uji.reviewer; isinya tidak pernah dicetak).
 *
 * Jalan PENUH (Chromium; host 1280x800, Ani 390x645 DPR 3, Budi 360x640 DPR 2; bahasa Indonesia; host mengatur laju):
 *  - pemilih skenario host memuat skenario Episode 2 (judul, versi, tanda DEMO, sinopsis "untuk uji acara"); room terbuka dengan
 *    kode 6 karakter; dua peserta masuk lewat /join dan melihat lobi berjudul skenario itu;
 *  - babak 1 dengan waktu asli: adegan (Babak 1/15, judul naskah, pembuka Miss Raksa dengan NAMA PESERTA SENDIRI), lima pilihan
 *    = lima balasan naskah (teks dicocokkan dengan versi terbit lewat API reviewer), Ani memilih yang disarankan, Budi yang
 *    keliru; konsekuensi masing-masing (balasan Pak Hendra + akibat naskah); peringkat: Ani di atas dengan 700-1000 poin, Budi 0,
 *    sama di kedua HP;
 *  - babak 2-15 dipercepat host ("Buka pilihan sekarang", "Lanjut ke peringkat", "Babak berikutnya"): babak 2 = meja berkas
 *    (berkas bersama bisa dibuka) dan Budi TIDAK menjawab (waktu habis: "Tidak menjawab" + kalimat konverter); babak 12 Budi
 *    berjanji tanggal 20; babak 11 konsekuensi tersusun (sisi berkas + kutipan + sisi kabar) tampil utuh di kartu hasil;
 *    babak 14 hanya Budi yang melihat protes Pak Hendra dan status turun 12; babak 15 lalu ringkasan akhir: Ani "Puas" dengan
 *    15 keputusan tepat, Budi "Kurang puas"; nilai total = baris peringkat akhir; host melihat "Selesai";
 *  - tanpa galat halaman dan tanpa gulir mendatar di HP.
 * Jalan EN (Chromium) dan WEBKIT (id): room baru, babak 1 sampai peringkat. EN: antarmuka peserta berbahasa Inggris, tetapi ISI
 * cerita tetap Indonesia (runtime room hanya membaca satu bahasa konten: dicatat, bukan kegagalan alat ini).
 * Tangkapan layar + hasil.json -> team/evidence/T-028/fullstack/. Kode keluar: 0 lulus, 1 ada yang gagal, 2 argumen / env /
 * server uji tidak bisa dipakai atau penjaga waktu.
 */
import fs from 'node:fs';
import path from 'node:path';
import { denganBatas, luncur, pasangPenjaga, tunggu } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama: Node + browser otomasi ke prioritas rendah

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'team/evidence/T-028/fullstack');
const ID_SKENARIO = 'sc_ep2_trailer';
const JUDUL = 'Truk Trailer di Jalan Tol';
const HOST = { n: '1280x800', w: 1280, h: 800, dpr: 1 };
const HP390 = { n: 'hp390', w: 390, h: 645, dpr: 3 };
const HP360 = { n: 'hp360', w: 360, h: 640, dpr: 2 };
const PORT_TERLARANG = ['4000', '4001', '4002'];

function tolak(pesan) {
  console.error(`DITOLAK: ${pesan}`);
  process.exit(2);
}
const argumen = (nama) => { const i = process.argv.indexOf(nama); return i >= 0 ? process.argv[i + 1] ?? null : null; };
const hanya = argumen('--hanya');
if (hanya && !['penuh', 'en', 'webkit'].includes(hanya)) tolak('--hanya penuh | en | webkit');
const JALAN = [
  { nama: 'penuh', mesin: 'chromium', bahasa: 'id', penuh: true },
  { nama: 'en', mesin: 'chromium', bahasa: 'en', penuh: false },
  ...(process.argv.includes('--tanpa-webkit') ? [] : [{ nama: 'webkit', mesin: 'webkit', bahasa: 'id', penuh: false }]),
].filter((j) => !hanya || j.nama === hanya);

const BASE = (process.env.UI_BASE || '').replace(/\/+$/, '');
let url;
try { url = new URL(BASE); } catch { tolak('UI_BASE wajib diisi, mis. http://127.0.0.1:4003 (server uji)'); }
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) tolak(`UI_BASE harus server uji loopback, bukan ${url.hostname}`);
if (PORT_TERLARANG.includes(url.port || '80')) tolak(`port ${url.port} milik server lain (pemilik / reviewer): alat ini membuat room`);
const berkasKred = process.env.RAKSA_KREDENSIAL;
if (!berkasKred || !fs.existsSync(berkasKred)) tolak('RAKSA_KREDENSIAL wajib: dev-staff-credentials.json dari story:dev-setup DB uji');
let KRED;
try { KRED = JSON.parse(fs.readFileSync(berkasKred, 'utf8')); } catch { tolak('RAKSA_KREDENSIAL tidak terbaca sebagai JSON (isinya tidak ditampilkan)'); }
for (const akun of ['uji.host', 'uji.reviewer']) if (typeof KRED[akun] !== 'string') tolak(`RAKSA_KREDENSIAL tidak berisi akun ${akun} (story:dev-setup)`);
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------ kamus antarmuka (dibaca dari sumbernya, bukan disalin)

const KAMUS = fs.readFileSync(path.join(ROOT, 'client/src/i18n/kamus/ruang.ts'), 'utf8').replace(/\r\n/g, '\n');
/** Teks antarmuka room `kunci` dalam `bahasa`: blok `  id: {` .. `  },` di kamus/ruang.ts. */
function kamus(bahasa, kunci) {
  const i = KAMUS.indexOf(`\n  ${bahasa}: {`); const j = KAMUS.indexOf('\n  },', i);
  if (i < 0 || j < 0) throw new Error(`kamus ruang: blok ${bahasa} tidak ditemukan`);
  const k = kunci.replace(/\./g, '\\.');
  const m = new RegExp(`\\n\\s+(?:'${k}'|${k}): '((?:[^'\\\\]|\\\\.)*)'`).exec(KAMUS.slice(i, j));
  if (!m) throw new Error(`kamus ruang ${bahasa}: ${kunci} tidak ada`);
  return m[1].replace(/\\'/g, "'");
}

// ------------------------------------------------------------------ API (sisi Node)

async function masukApi(akun) {
  const r = await fetch(`${BASE}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: akun, password: KRED[akun] }) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(`login ${akun} gagal (${r.status})`);
  return j.token;
}
async function api(jalur, token) {
  const r = await fetch(BASE + jalur, { headers: { authorization: `Bearer ${token}` } });
  return r.json();
}

/** Versi terbit skenario Episode 2 di server uji + isinya (kunci jawaban hanya untuk bot alat ini; peserta tidak pernah menerimanya). */
async function muatSkenario() {
  let opsi;
  try {
    opsi = (await api('/api/host/scenarios', await masukApi('uji.host'))).scenarios?.find((s) => s.scenarioId === ID_SKENARIO);
  } catch (e) { tolak(`server uji ${BASE} tidak bisa dipakai: ${e.message}`); }
  if (!opsi) tolak(`skenario ${ID_SKENARIO} belum terbit di server uji (seed mati? STORY_SEED=off)`);
  const isi = (await api(`/api/cms/versions/${opsi.versionId}`, await masukApi('uji.reviewer'))).content;
  if (!isi?.rounds || isi.rounds.length !== 15) tolak('isi versi skenario tidak terbaca');
  return { opsi, isi };
}

// ------------------------------------------------------------------ pembantu halaman (puppeteer dan playwright)

async function buka(mesin, b, vp, bahasa, jalur) {
  const hp = vp.w < 800;
  const skrip = (a) => { try { localStorage.setItem('raksa:bahasa', a.bahasa); sessionStorage.setItem('raksa:loader:v1', '1'); } catch { /* abaikan */ } };
  let ctx, p;
  if (mesin === 'chromium') {
    ctx = await b.createBrowserContext();
    p = await ctx.newPage();
    p.setDefaultTimeout(20000); p.setDefaultNavigationTimeout(30000);
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    await p.evaluateOnNewDocument(skrip, { bahasa });
  } else {
    ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    ctx.setDefaultTimeout(20000); ctx.setDefaultNavigationTimeout(30000);
    p = await ctx.newPage();
    await p.addInitScript(skrip, { bahasa });
  }
  const galat = [];
  p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 200)));
  await p.goto(BASE + jalur, { waitUntil: 'domcontentloaded' });
  return { p, galat, vp, tutup: () => denganBatas(ctx.close(), 10000, 'tutup konteks').catch(() => {}) };
}

/** Ulangi `fn` di halaman sampai hasilnya benar (paling lama `ms`); galat bernama bila tidak. */
async function sampai(p, fn, arg, ms, nama) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = await p.evaluate(fn, arg).catch(() => null);
    if (v) return v;
    await tunggu(150);
  }
  throw new Error(`batas waktu ${Math.round(ms / 1000)} d: ${nama}`);
}
/** Isi kolom React terkendali lewat setter asli supaya React melihat perubahannya. */
const isi = (p, daftar) => p.evaluate((d) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  for (const [sel, i, nilai] of d) { const el = document.querySelectorAll(sel)[i]; set.call(el, nilai); el.dispatchEvent(new Event('input', { bubbles: true })); }
}, daftar);
const potret = (p, nama, penuh = false) => p.screenshot({ path: path.join(OUT, `${nama}.png`), fullPage: penuh });

/** Keadaan layar peserta: fase, kepala babak, pilihan, hasil, peringkat, ringkasan akhir. */
const keadaan = (p) => p.evaluate(() => {
  const r = document.querySelector('.sr-ronde[data-fase]');
  const akhir = document.querySelector('.sr-hasil-akhir');
  const teksOpsi = (kartu) => { const t = kartu.querySelector('.sr-opsi-teks')?.cloneNode(true); t?.querySelectorAll('.sr-opsi-bentuk, .sr-only').forEach((x) => x.remove()); return (t?.textContent ?? '').trim(); };
  const se = document.scrollingElement;
  return {
    fase: r?.getAttribute('data-fase') ?? (akhir ? 'finished' : document.querySelector('.sr-lobi') ? 'lobby' : 'lain'),
    babak: r?.querySelector('.sr-ronde-babak')?.textContent ?? '',
    judul: r?.querySelector('.sr-ronde-judul')?.textContent ?? '',
    tataLetak: r?.querySelector('[data-aktivitas]')?.getAttribute('data-aktivitas') ?? null,
    suasana: r?.querySelector('[data-suasana]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    opsi: [...document.querySelectorAll('[data-pilihan]')].map((k) => ({ pegangan: k.getAttribute('data-pilihan'), teks: teksOpsi(k), mati: k.disabled })),
    kirim: document.querySelector('[data-kirim]')?.textContent?.trim() ?? null,
    terkirim: !!document.querySelector('[data-terkirim]'),
    hasil: document.querySelector('[data-hasil]')?.innerText ?? null,
    berkas: [...new Set([...document.querySelectorAll('[data-berkas]')].map((x) => x.getAttribute('data-berkas')))],
    peringkat: [...document.querySelectorAll('[data-peringkat] .sr-peringkat-baris')].map((li) => [li.querySelector('.sr-peringkat-no')?.textContent ?? '', (li.querySelector('.sr-peringkat-nama')?.firstChild?.textContent ?? '').trim(), li.querySelector('.sr-peringkat-poin')?.textContent ?? '']),
    teks: document.body.innerText,
    gulirMendatar: se.scrollWidth > window.innerWidth + 1,
    akhir: akhir ? {
      judul: akhir.querySelector('h1')?.textContent ?? '',
      total: akhir.querySelector('.sr-total-angka b')?.textContent ?? '',
      keputusan: [...akhir.querySelectorAll('.sr-keputusan')].map((d) => (/sr-keputusan-(\w+)/.exec(d.className.replace('sr-keputusan ', '')) ?? [])[1] ?? '?'),
      peringkat: [...akhir.querySelectorAll('.sr-peringkat-baris')].map((li) => [li.querySelector('.sr-peringkat-no')?.textContent ?? '', (li.querySelector('.sr-peringkat-nama')?.firstChild?.textContent ?? '').trim(), li.querySelector('.sr-peringkat-poin')?.textContent ?? '']),
      jejak: akhir.querySelector('.sr-jejak')?.innerText ?? null,
    } : null,
  };
});
const tungguFase = (p, fase, ms, nama) => sampai(p, (f) => (document.querySelector('.sr-ronde[data-fase]')?.getAttribute('data-fase') ?? (document.querySelector('.sr-hasil-akhir') ? 'finished' : '')) === f, fase, ms, `${nama}: fase ${fase}`);
const angka = (s) => Number(String(s).replace(/[^\d]/g, '') || NaN);

// ------------------------------------------------------------------ langkah host dan peserta

async function hostBukaRoom(h, opsi, nama, hasilPotret) {
  await sampai(h.p, () => document.querySelectorAll('.stf-masuk-kartu input').length >= 2, null, 30000, 'form masuk staf');
  await isi(h.p, [['.stf-masuk-kartu input', 0, 'uji.host'], ['.stf-masuk-kartu input', 1, KRED['uji.host']]]);
  await h.p.click('.stf-masuk-kartu button[type=submit]');
  await sampai(h.p, () => !!document.querySelector('.stf-pilih-skenario .stf-opsi'), null, 30000, 'pemilih skenario host');
  const pilih = await h.p.evaluate((judul) => {
    const semua = [...document.querySelectorAll('.stf-pilih-skenario .stf-opsi')];
    const i = semua.findIndex((l) => l.querySelector('b')?.textContent.trim() === judul);
    if (i < 0) return { ada: false, judul: semua.map((l) => l.querySelector('b')?.textContent.trim()) };
    semua[i].querySelector('input').click();
    const kecil = [...semua[i].querySelectorAll('small')].map((s) => s.textContent.trim());
    return { ada: true, urutan: i + 1, judul: semua.map((l) => l.querySelector('b')?.textContent.trim()), keterangan: kecil[0] ?? '', sinopsis: kecil[1] ?? '' };
  }, JUDUL);
  if (!pilih.ada) throw new Error(`skenario "${JUDUL}" tidak ada di pemilih host: ${JSON.stringify(pilih.judul)}`);
  await sampai(h.p, () => !!document.querySelector('.stf-pilih-skenario .stf-opsi.terpilih'), null, 5000, 'skenario terpilih');
  // Host mengatur laju: "Lanjut otomatis" dimatikan, jadi peringkat menunggu host.
  await h.p.evaluate(() => { const c = document.querySelector('.stf-pilih-skenario').closest('.stf-kartu').querySelector('.stf-centang input'); if (c.checked) c.click(); });
  if (hasilPotret) await potret(h.p, 'host-pemilih-skenario');
  const s = [];
  if (pilih.keterangan !== `Auto · versi ${opsi.versionNo} · tingkat 2 · DEMO (tidak masuk rekap kompetisi)`) s.push(`keterangan pemilih: "${pilih.keterangan}"`);
  if (!/untuk uji acara\.$/.test(pilih.sinopsis)) s.push(`sinopsis pemilih: "${pilih.sinopsis.slice(-60)}"`);
  await h.p.evaluate(() => document.querySelector('.stf-pilih-skenario').closest('.stf-kartu').querySelector('button.btn-utama').click());
  await sampai(h.p, () => !!document.querySelector('.stf-room-kode') && new URL(location.href).searchParams.get('room'), null, 20000, 'room terbuka');
  const kode = await h.p.evaluate(() => new URL(location.href).searchParams.get('room'));
  const judulRoom = await h.p.evaluate(() => document.querySelector('.stf-room-kendali h2')?.textContent ?? '');
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(kode ?? '')) s.push(`kode room "${kode}"`);
  if (judulRoom !== JUDUL) s.push(`judul room "${judulRoom}"`);
  lapor(`${nama}-host-buka-room`, s.length === 0, { sebab: s, daftarSkenario: pilih.judul, urutan: pilih.urutan, keterangan: pilih.keterangan, kode });
  return kode;
}

/** Tombol utama host (Mulai cerita / Buka pilihan sekarang / Lanjut ke peringkat / Babak berikutnya / Tampilkan hasil akhir). */
async function hostLanjut(h, label, ms = 15000, sudah = null) {
  // `sudah` = label yang berarti fase itu sudah lewat sendiri (mis. konsekuensi 10 d habis): tidak ditekan lagi.
  const kini = await sampai(h.p, (ls) => { const b = document.querySelector('.stf-room-kendali .stf-tombol .btn-utama'); const t = b?.textContent.trim(); return b && !b.disabled && ls.includes(t) ? t : null; }, [label, ...(sudah ? [sudah] : [])], ms, `tombol host "${label}"`);
  if (kini === label) await h.p.click('.stf-room-kendali .stf-tombol .btn-utama');
  return kini;
}
const faseHost = (h) => h.p.evaluate(() => document.querySelector('.stf-fase')?.textContent?.trim() ?? '');

async function gabung(mesin, b, vp, bahasa, kode, nama) {
  const x = await buka(mesin, b, vp, bahasa, `/join?room=${kode}${bahasa === 'id' ? '' : `&lang=${bahasa}`}`);
  await sampai(x.p, () => !!document.querySelector('.sr-join-nama input.kolom'), null, 30000, `${nama}: langkah nama`);
  await isi(x.p, [['.sr-join-nama input.kolom', 0, nama]]);
  await x.p.evaluate(() => { const c = document.querySelector('.sr-setuju input'); if (!c.checked) c.click(); });
  await x.p.click('.sr-join-nama button[type=submit]');
  await sampai(x.p, () => location.pathname.startsWith('/room/') && !!document.querySelector('.sr-lobi'), null, 20000, `${nama}: lobi`);
  return { ...x, nama };
}

/** Pilih pilihan berteks `teks` lalu kirim (ketukan nyata; pilihan digulir ke tengah dulu: bilah kirim menempel di bawah layar HP). */
async function jawab(x, teks) {
  const pegangan = await sampai(x.p, (t) => {
    const kartu = [...document.querySelectorAll('[data-pilihan]')].find((k) => { const c = k.querySelector('.sr-opsi-teks')?.cloneNode(true); c?.querySelectorAll('.sr-opsi-bentuk, .sr-only').forEach((y) => y.remove()); return (c?.textContent ?? '').trim() === t; });
    if (!kartu || kartu.disabled) return null;
    kartu.scrollIntoView({ block: 'center' });
    return kartu.getAttribute('data-pilihan');
  }, teks, 15000, `${x.nama}: pilihan "${teks.slice(0, 40)}"`);
  await tunggu(120);
  await x.p.click(`[data-pilihan="${pegangan}"]`);
  await sampai(x.p, (g) => document.querySelector(`[data-pilihan="${g}"]`)?.getAttribute('aria-checked') === 'true', pegangan, 5000, `${x.nama}: pilihan terpilih`);
  await x.p.click('[data-kirim]');
  await sampai(x.p, () => !!document.querySelector('[data-terkirim]') || !!document.querySelector('[data-hasil]'), null, 10000, `${x.nama}: jawaban terkirim`);
}

// ------------------------------------------------------------------ jalan

const hasil = []; let gagal = 0;
function lapor(nama, lulus, data) { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); }
let b = null;
const batal = pasangPenjaga(16, () => { lapor('penjaga', false, { sebab: ['seluruh proses melewati batas waktu'] }); try { fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1)); } catch { /* abaikan */ } try { b?.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });

const { opsi, isi: konten } = await muatSkenario();
const tk = (kunci) => konten.text.id[kunci] ?? '';
/** Teks pilihan babak `r` (0..14) berklasifikasi `klas` (yang pertama), atau pilihan ber-id `idPilihan`. */
const teksPilihan = (r, klas, idPilihan = null) => {
  const babak = konten.rounds[r];
  const c = idPilihan ? babak.choices.find((x) => x.id === idPilihan) : babak.choices.find((x) => x.classification === klas);
  return { id: c.id, teks: tk(`round.${babak.id}.choice.${c.id}.text`), klas: c.classification };
};
/** Budi: babak 1 keliru, babak 2 tidak menjawab, babak 3-11 kurang tepat, babak 12 janji tanggal 20, babak 13-14 tepat, babak 15 kurang. */
const rencanaBudi = (r) => (r === 0 ? teksPilihan(r, 'keliru') : r === 1 ? null : r === 11 ? teksPilihan(r, null, 'alt-a') : r === 12 || r === 13 ? teksPilihan(r, 'tepat') : teksPilihan(r, 'kurang_tepat'));

async function babakPertama(j, h, ani, budi, s, alami) {
  const akhiran = `${j.bahasa}${j.mesin === 'webkit' ? '-webkit' : ''}`;
  const babak = konten.rounds[0];
  await hostLanjut(h, 'Mulai cerita');
  for (const x of [ani, budi]) await tungguFase(x.p, 'scene', 20000, x.nama);
  await tunggu(900);
  const adegan = await keadaan(ani.p);
  if (adegan.babak !== kamus(j.bahasa, 'babakDari').replace('{n}', '1').replace('{total}', '15')) s.push(`kepala babak "${adegan.babak}"`);
  if (adegan.judul !== tk(`round.${babak.id}.title`)) s.push(`judul babak "${adegan.judul}"`);
  if (adegan.tataLetak !== 'chat') s.push(`tata letak babak 1: ${adegan.tataLetak}`);
  if (adegan.opsi.length) s.push('pilihan sudah tampil saat adegan');
  if (alami) {
    // Pembuka Miss Raksa memuat nama peserta sendiri ({nama} diganti di klien).
    const pembuka = tk('intro.line.buka1').replace('{nama}', 'Ani');
    await sampai(ani.p, (t) => document.body.innerText.includes(t), pembuka, 20000, 'pembuka dengan nama peserta').catch(() => s.push(`pembuka "${pembuka}" tidak tampil untuk Ani`));
    await potret(ani.p, `babak1-adegan-${ani.vp.n}-${akhiran}`);
  } else {
    await tunggu(2500);
    await hostLanjut(h, 'Buka pilihan sekarang');
  }
  for (const x of [ani, budi]) await tungguFase(x.p, 'answering', 60000, x.nama);
  for (const x of [ani, budi]) {
    const k = await sampai(x.p, () => document.querySelectorAll('[data-pilihan]').length === 5, null, 10000, `${x.nama}: lima pilihan`).then(() => keadaan(x.p));
    // {nama} di teks pilihan diganti nama peserta sendiri (di klien).
    const harap = babak.choices.map((c) => tk(`round.${babak.id}.choice.${c.id}.text`).replace('{nama}', x.nama)).sort();
    if (JSON.stringify(k.opsi.map((o) => o.teks).sort()) !== JSON.stringify(harap)) s.push(`${x.nama}: lima pilihan bukan lima balasan naskah babak 1`);
    if (k.kirim !== kamus(j.bahasa, 'aksi.chat')) s.push(`${x.nama}: tombol kirim "${k.kirim}", seharusnya "${kamus(j.bahasa, 'aksi.chat')}"`);
    if (k.gulirMendatar) s.push(`${x.nama}: halaman menggulir mendatar saat menjawab`);
  }
  // Baki pilihan menggulir dirinya ke layar sesudah hitungan pertama "n pilihan lagi di bawah": potret sesudah itu tenang.
  await tunggu(1200);
  // Dicatat saja (UI room yang sudah ada, bukan bagian T-028): pilihan yang utuh di atas bilah kirim + isyarat bilah itu.
  const terlihat = await ani.p.evaluate(() => {
    const bilah = document.querySelector('.sr-baki-bar');
    const batas = bilah ? bilah.getBoundingClientRect().top : window.innerHeight;
    const utuh = [...document.querySelectorAll('[data-pilihan]')].filter((k) => { const r = k.getBoundingClientRect(); return r.top >= 0 && r.bottom <= batas + 1; }).length;
    return { utuhDiLayar: utuh, isyarat: document.querySelector('.sr-baki-isyarat')?.textContent?.trim() ?? '' };
  });
  await potret(ani.p, `babak1-pilihan-${ani.vp.n}-${akhiran}`);
  if (alami) await potret(budi.p, `babak1-pilihan-${budi.vp.n}-${akhiran}`);
  const pilihAni = teksPilihan(0, 'tepat');
  const pilihBudi = rencanaBudi(0);
  await tunggu(1500);
  await jawab(ani, pilihAni.teks.replace('{nama}', ani.nama));
  if ((await keadaan(ani.p)).fase !== 'answering') s.push('babak tertutup sebelum Budi menjawab');
  await tunggu(2500);
  await jawab(budi, pilihBudi.teks.replace('{nama}', budi.nama));
  for (const x of [ani, budi]) await tungguFase(x.p, 'consequence', 15000, x.nama);
  await sampai(ani.p, () => !!document.querySelector('[data-hasil]'), null, 10000, 'hasil Ani');
  await sampai(budi.p, () => !!document.querySelector('[data-hasil]'), null, 10000, 'hasil Budi');
  await tunggu(700);
  const ka = await keadaan(ani.p); const kb = await keadaan(budi.p);
  for (const [x, k, c] of [[ani, ka, pilihAni], [budi, kb, pilihBudi]]) {
    const balasan = tk(`round.${babak.id}.choice.${c.id}.reply`); const akibat = tk(`round.${babak.id}.choice.${c.id}.consequence`);
    if (balasan && !k.hasil?.includes(balasan)) s.push(`${x.nama}: balasan Pak Hendra tidak tampil`);
    if (!k.hasil?.includes(akibat)) s.push(`${x.nama}: konsekuensi naskah tidak tampil`);
    if (k.gulirMendatar) s.push(`${x.nama}: halaman menggulir mendatar saat konsekuensi`);
  }
  await potret(ani.p, `babak1-konsekuensi-${ani.vp.n}-${akhiran}`, true);
  if (alami) await potret(budi.p, `babak1-konsekuensi-${budi.vp.n}-${akhiran}`, true);
  // Konsekuensi 10 d lalu peringkat (host mengatur laju: peringkat menunggu host).
  for (const x of [ani, budi]) await tungguFase(x.p, 'leaderboard', 20000, x.nama);
  await sampai(ani.p, () => document.querySelectorAll('[data-peringkat] .sr-peringkat-baris').length === 2, null, 10000, 'kartu peringkat Ani');
  await sampai(budi.p, () => document.querySelectorAll('[data-peringkat] .sr-peringkat-baris').length === 2, null, 10000, 'kartu peringkat Budi');
  await tunggu(500);
  const pa = await keadaan(ani.p); const pb = await keadaan(budi.p);
  const poinAni = angka(pa.peringkat[0]?.[2]); const poinBudi = angka(pa.peringkat[1]?.[2]);
  if (JSON.stringify(pa.peringkat.map((x) => x.slice(0, 2))) !== JSON.stringify([['1', 'Ani'], ['2', 'Budi']])) s.push(`urutan peringkat ${JSON.stringify(pa.peringkat)}`);
  if (JSON.stringify(pa.peringkat) !== JSON.stringify(pb.peringkat)) s.push('peringkat berbeda di kedua HP');
  if (!(poinAni >= 700 && poinAni <= 1000)) s.push(`poin Ani ${poinAni} (jawaban tepat: 700 + kecepatan)`);
  if (poinBudi !== 0) s.push(`poin Budi ${poinBudi} (jawaban keliru: 0)`);
  if (!pa.teks.includes(kamus(j.bahasa, 'peringkatJudul')) || !pa.teks.includes(kamus(j.bahasa, 'menungguHost'))) s.push('kartu peringkat / "menunggu host" tidak tampil');
  if (!(await faseHost(h)).startsWith('Peringkat sementara')) s.push(`fase di konsol host: "${await faseHost(h)}"`);
  await potret(ani.p, `babak1-peringkat-${ani.vp.n}-${akhiran}`, true);
  if (alami) { await potret(budi.p, `babak1-peringkat-${budi.vp.n}-${akhiran}`, true); await potret(h.p, 'host-peringkat-babak1'); }
  return { poinAni, poinBudi, judul: adegan.judul, kepala: adegan.babak, peringkat: pa.peringkat, pilihanBabak1: terlihat };
}

async function sisaBabak(j, h, ani, budi, s) {
  const akhiran = j.bahasa;
  const protes = tk('round.k14.line.janji-20-1');
  const waktuHabis = tk('round.k02.timeout.consequence');
  for (let r = 1; r < 15; r++) {
    const babak = konten.rounds[r];
    await hostLanjut(h, 'Babak berikutnya');
    for (const x of [ani, budi]) await tungguFase(x.p, 'scene', 15000, `${x.nama} babak ${r + 1}`);
    await tunggu(500);
    const ad = await keadaan(ani.p);
    if (ad.babak !== `Babak ${r + 1}/15` || ad.judul !== tk(`round.${babak.id}.title`) || ad.tataLetak !== babak.layout) s.push(`babak ${r + 1}: kepala "${ad.babak}" / "${ad.judul}" / ${ad.tataLetak}`);
    if (r === 13) {
      // Janji tanggal 20 (babak 12): hanya Budi melihat protes Pak Hendra, dan statusnya turun 12 di awal babak ini.
      await sampai(budi.p, (t) => document.body.innerText.includes(t), protes, 10000, 'protes untuk Budi').catch(() => s.push('babak 14: protes Pak Hendra tidak tampil untuk Budi'));
      const kbudi = await keadaan(budi.p);
      if ((await keadaan(ani.p)).teks.includes(protes)) s.push('babak 14: protes tampil juga untuk Ani');
      if (!/12/.test(kbudi.suasana ?? '')) s.push(`babak 14: chip status Budi tanpa dampak tertunda: "${kbudi.suasana}"`);
      await potret(budi.p, `babak14-protes-${budi.vp.n}-${akhiran}`, true);
    }
    await hostLanjut(h, 'Buka pilihan sekarang');
    for (const x of [ani, budi]) await tungguFase(x.p, 'answering', 15000, `${x.nama} babak ${r + 1}`);
    await sampai(ani.p, () => document.querySelectorAll('[data-pilihan]').length === 5, null, 10000, `babak ${r + 1}: lima pilihan`);
    if (r === 1) {
      // Meja berkas: berkas bersama tampil dan bisa dibuka; membukanya tidak mengubah apa pun.
      const k = await keadaan(ani.p);
      if (!k.berkas.includes('daftar')) s.push(`babak 2: berkas "daftar" tidak tampil (${JSON.stringify(k.berkas)})`);
      await potret(ani.p, `babak2-meja-berkas-${ani.vp.n}-${akhiran}`, true);
      await ani.p.click('[data-berkas="daftar"]');
      await sampai(ani.p, () => !!document.querySelector('[data-lembar="daftar"]'), null, 8000, 'lembar berkas terbuka').catch(() => s.push('babak 2: lembar berkas tidak terbuka'));
      await tunggu(400);
      const lembar = await ani.p.evaluate(() => document.querySelector('[data-lembar="daftar"]')?.innerText ?? '');
      for (const idBaris of ['formulir', 'suratpolisi', 'kk']) if (!lembar.includes(tk(`round.k02.ev.daftar.row.${idBaris}`))) s.push(`babak 2: lembar berkas tanpa baris ${idBaris}`);
      await potret(ani.p, `babak2-berkas-terbuka-${ani.vp.n}-${akhiran}`);
      await ani.p.keyboard.press('Escape');
      await sampai(ani.p, () => !document.querySelector('[data-lembar]'), null, 8000, 'lembar berkas tertutup').catch(() => s.push('babak 2: lembar berkas tidak tertutup'));
    }
    await jawab(ani, teksPilihan(r, 'tepat').teks.replace('{nama}', ani.nama));
    const pb = rencanaBudi(r);
    if (pb) await jawab(budi, pb.teks.replace('{nama}', budi.nama));
    // Tanpa jawaban Budi babak baru tertutup saat 30 detik habis.
    for (const x of [ani, budi]) await tungguFase(x.p, 'consequence', pb ? 15000 : 45000, `${x.nama} babak ${r + 1}`);
    const t0 = Date.now();
    await sampai(budi.p, () => !!document.querySelector('[data-hasil]'), null, 10000, `babak ${r + 1}: hasil Budi`);
    if (r === 1) {
      const kb = await keadaan(budi.p);
      // Kartu hasil meja berkas: "Pilihanmu: Tidak menjawab" + kalimat waktu habis (di obrolan kalimatnya "Kamu tidak sempat membalas.").
      if (!kb.hasil?.includes(waktuHabis) || !kb.hasil?.includes(kamus('id', 'tanpaJawaban'))) s.push('babak 2: konsekuensi waktu habis tidak tampil untuk Budi');
      await potret(budi.p, `babak2-waktu-habis-${budi.vp.n}-${akhiran}`, true);
    }
    if (r === 13) await potret(budi.p, `babak14-konsekuensi-${budi.vp.n}-${akhiran}`, true);
    if (r === 10) {
      // Babak 11 (bundel): konsekuensi tersusun dari dua sisi naskah ("Berkas: …", "Kabar untuk Pak Hendra: …") dan kutipan di tengahnya.
      const ka = await sampai(ani.p, () => !!document.querySelector('[data-hasil]'), null, 10000, 'babak 11: hasil Ani').then(() => keadaan(ani.p));
      for (const [x, k, c] of [[ani, ka, teksPilihan(r, 'tepat')], [budi, await keadaan(budi.p), pb]]) {
        if (!k.hasil?.includes(tk(`round.${babak.id}.choice.${c.id}.consequence`))) s.push(`babak 11: konsekuensi tersusun tidak tampil utuh untuk ${x.nama}`);
        await potret(x.p, `babak11-konsekuensi-${x.vp.n}-${akhiran}`, true);
      }
    }
    // Host tidak bisa melewati konsekuensi sebelum 4 detik.
    await tunggu(Math.max(0, 4300 - (Date.now() - t0)));
    if (r < 14) {
      await hostLanjut(h, 'Lanjut ke peringkat', 15000, 'Babak berikutnya');
      for (const x of [ani, budi]) await tungguFase(x.p, 'leaderboard', 15000, `${x.nama} babak ${r + 1}`);
    } else {
      await hostLanjut(h, 'Tampilkan hasil akhir');
    }
  }
  for (const x of [ani, budi]) await tungguFase(x.p, 'finished', 20000, x.nama);
  await tunggu(900);
  const fa = await keadaan(ani.p); const fb = await keadaan(budi.p);
  if (fa.akhir?.judul !== tk('ending.puas.title')) s.push(`akhir Ani "${fa.akhir?.judul}"`);
  if (fb.akhir?.judul !== tk('ending.kurang.title')) s.push(`akhir Budi "${fb.akhir?.judul}"`);
  if (JSON.stringify(fa.akhir?.keputusan) !== JSON.stringify(Array(15).fill('tepat'))) s.push(`keputusan Ani ${JSON.stringify(fa.akhir?.keputusan)}`);
  const harapBudi = ['keliru', 'timeout', ...Array(9).fill('kurang_tepat'), 'keliru', 'tepat', 'tepat', 'kurang_tepat'];
  if (JSON.stringify(fb.akhir?.keputusan) !== JSON.stringify(harapBudi)) s.push(`keputusan Budi ${JSON.stringify(fb.akhir?.keputusan)}`);
  const total = (k, nama) => [angka(k.akhir?.total), angka(k.akhir?.peringkat.find((x) => x[1] === nama)?.[2])];
  const [ta, pa] = total(fa, 'Ani'); const [tb, pb2] = total(fb, 'Budi');
  if (!(ta === pa && ta >= 15 * 700 && ta <= 15000)) s.push(`total Ani ${ta}, baris peringkat ${pa}`);
  if (!(tb === pb2 && tb > 0 && tb < ta)) s.push(`total Budi ${tb}, baris peringkat ${pb2}`);
  if (JSON.stringify(fa.akhir?.peringkat.map((x) => x.slice(0, 2))) !== JSON.stringify([['1', 'Ani'], ['2', 'Budi']])) s.push(`peringkat akhir ${JSON.stringify(fa.akhir?.peringkat)}`);
  if (!fb.akhir?.jejak || fa.akhir?.jejak) s.push('catatan sebab-akibat janji: harus ada untuk Budi saja');
  if (!fa.teks.includes(tk('ending.puas.customer').replace('{nama}', 'Ani'))) s.push('ucapan penutup Pak Hendra (dengan nama Ani) tidak tampil');
  if (!(await faseHost(h)).startsWith('Selesai')) s.push(`fase di konsol host: "${await faseHost(h)}"`);
  await potret(ani.p, `hasil-akhir-${ani.vp.n}-${akhiran}`, true);
  await potret(budi.p, `hasil-akhir-${budi.vp.n}-${akhiran}`, true);
  await potret(h.p, 'host-selesai');
  return { totalAni: ta, totalBudi: tb, akhir: [fa.akhir?.judul, fb.akhir?.judul], peringkatAkhir: fa.akhir?.peringkat };
}

let mesinKini = null;
for (const j of JALAN) {
  if (mesinKini !== j.mesin) {
    if (b) { await denganBatas(b.close(), 15000, 'tutup browser').catch(() => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } }); await tunggu(300); }
    b = await denganBatas(luncur(j.mesin), 45000, `luncur ${j.mesin}`);
    mesinKini = j.mesin;
  }
  const halaman = [];
  const s = [];
  let data = {};
  try {
    await denganBatas((async () => {
      const h = await buka(j.mesin, b, HOST, 'id', '/host'); halaman.push(h);
      const kode = await hostBukaRoom(h, opsi, j.nama, j.penuh);
      const ani = await gabung(j.mesin, b, HP390, j.bahasa, kode, 'Ani'); halaman.push(ani);
      const budi = await gabung(j.mesin, b, HP360, j.bahasa, kode, 'Budi'); halaman.push(budi);
      const lobi = await keadaan(ani.p);
      if (!lobi.teks.includes(JUDUL)) s.push('lobi peserta tanpa judul skenario');
      await sampai(h.p, () => document.querySelectorAll('.stf-room-peserta tbody tr').length === 2, null, 10000, 'dua peserta di konsol host');
      if (j.penuh) { await potret(ani.p, `lobi-${ani.vp.n}-${j.bahasa}`); await potret(h.p, 'host-lobi'); }
      data = { kode, ...(await babakPertama(j, h, ani, budi, s, j.penuh)) };
      if (j.bahasa !== 'id') {
        // Antarmuka Inggris, ISI cerita Indonesia: runtime room membaca satu bahasa konten (dicatat di laporan).
        data.isiCerita = data.judul === tk('round.k01.title') ? 'id' : 'lain';
        if (data.kepala !== 'Round 1/15') s.push(`antarmuka bukan Inggris: "${data.kepala}"`);
      }
      if (j.penuh) data = { ...data, ...(await sisaBabak(j, h, ani, budi, s)) };
      const galat = halaman.flatMap((x) => x.galat);
      if (galat.length) s.push('galat halaman: ' + galat.join(' | '));
    })(), j.penuh ? 9 * 60000 : 3 * 60000, `jalan ${j.nama}`);
  } catch (e) { s.push('galat alat: ' + String(e?.message ?? e).slice(0, 240)); }
  lapor(`room-ep2-${j.nama}`, s.length === 0, { mesin: j.mesin, bahasa: j.bahasa, sebab: s, ...data });
  for (const x of halaman) await x.tutup();
}
if (b) await denganBatas(b.close(), 15000, 'tutup browser').catch(() => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
batal();
if (!hanya) fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
