/**
 * E2E RAKSA GAME - layar misi 2D (Phaser) + kontrol HTML.
 *
 * PRASYARAT (tidak dimasukkan ke dependensi proyek supaya bundel acara tetap kecil):
 *   npm install --no-save puppeteer-core     (socket.io-client sudah ada di workspace)
 *   npm run build && npm start               # server di http://127.0.0.1:4000 (ubah lewat UI_BASE)
 *   npm run test:e2e
 * Chrome: RAKSA_CHROME=<path chrome.exe> bila bukan lokasi standar.
 * Animasi: bawaan MENYALA; RAKSA_GERAK=kurang untuk menguji "kurangi gerak".
 *
 * Pemeran (satu pertandingan penuh 10 misi + tutorial):
 *   Ani   HP 390x844, sentuh  - menjawab benar lewat KETUKAN ADEGAN (kontrol HTML hanya
 *                               untuk kategori/angka yang memang di HTML)
 *   Budi  HP 360x740, sentuh  - MODE RINGAN (?adegan=ringan): engine tidak dimuat, semua
 *                               lewat kontrol HTML -> membuktikan jalur cadangan tuntas
 *   Dedi  HP mendatar 844x390 - menjawab lewat HTML, cek tata letak landscape
 *   Citra desktop 1280x800    - menjawab lewat adegan (klik mouse), screenshot desktop
 *   proyektor 1366x768
 * Pemeriksaan: kunci saat briefing, jeda mengunci ketukan, refresh memulihkan draft,
 * kirim ganda tetap satu, kanvas tidak tertinggal, console/HTTP bersih, tanpa scroll
 * horizontal, CSV, reconnect, mode latihan. Keluar dengan kode 1 bila ada kegagalan.
 */

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { io as ioClient } from 'socket.io-client';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const CHROME = process.env.RAKSA_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.resolve(process.env.RAKSA_SHOTS || 'shots-e2e');
fs.mkdirSync(OUT, { recursive: true });

// Chrome headless MEWARISI setelan "kurangi gerak" dari OS (mis. Animation effects Windows mati),
// dan game lalu mematikan semua animasi. Bawaan uji = animasi MENYALA seperti di kebanyakan HP
// pemain; RAKSA_GERAK=kurang menguji jalur gerak dikurangi.
const GERAK = process.env.RAKSA_GERAK === 'kurang' ? 'reduce' : 'no-preference';
const aturGerak = (page) => page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: GERAK }]);

const konsol = [];
const gagal = [];
const ukur = [];
const layout = [];
const ringkas = [];
const catat = (t, ...a) => console.log(`[${t}]`, ...a);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const periksa = (ok, pesan) => { if (!ok) { gagal.push(pesan); catat('GAGAL', pesan); } return ok; };

// Jawaban benar per nomor misi (sama dengan server/src/answerKeys.ts; hanya untuk uji).
const BENAR = {
  1: { s1: 'dokumentasi' },
  2: { bukti: ['foto-full', 'foto-depan-kiri', 'foto-identitas'] },
  3: { berkas: ['kronologi', 'foto-kerusakan', 'daftar-barang', 'estimasi'] },
  4: { temuan: ['seri', 'posisi', 'rusak', 'operator'] },
  5: { cocok: { 'kasus-a': 'lanjut', 'kasus-b': 'tidak-ambang' } },
  6: { selisih: 2, rusak: 2, tindak: 'dokumentasi' },
  7: { polis: 'polis-a', alasan: 'perluasan-periode' },
  8: { klasifikasi: { panel: 'terkait', 'catatan-aus': 'sebelumnya', internal: 'teknis' } },
  9: { persen: 10_000_000, risiko: 10_000_000, hasil: 90_000_000 },
  10: {
    produk: { 'kasus-a': 'AUTO', 'kasus-b': 'HVC', 'kasus-c': 'PROPERTY' },
    periksa: { 'kasus-a': 'jaminan', 'kasus-b': 'identitas', 'kasus-c': 'bukti' },
    tindak: { 'kasus-a': 'luar-jaminan', 'kasus-b': 'klarifikasi', 'kasus-c': 'survei' },
  },
};

function pantau(page, nama) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') konsol.push({ nama, tipe: m.type(), teks: m.text().slice(0, 240) });
  });
  page.on('pageerror', (e) => konsol.push({ nama, tipe: 'pageerror', teks: String(e).slice(0, 240) }));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) konsol.push({ nama, tipe: 'http' + r.status(), teks: r.url() });
  });
}

const rpc = (sock, ev, payload) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('timeout ' + ev)), 12000);
  sock.emit(ev, payload, (r) => { clearTimeout(t); res(r); });
});

async function tunggu(page, fn, label, ms = 20000, arg) {
  const batas = Date.now() + ms;
  while (Date.now() < batas) {
    try { if (await page.evaluate(fn, arg)) return true; } catch { /* render ulang */ }
    await tidur(150);
  }
  gagal.push(`timeout: ${label}`);
  catat('GAGAL', 'timeout', label);
  return false;
}

const modeIs = (m) => document.querySelector('.misi')?.getAttribute('data-mode') === m;
const stageSiap = () => { const s = document.querySelector('.adegan')?.getAttribute('data-status'); return s && s !== 'loading'; };

async function tangkap(page, file) {
  try { await page.evaluate(() => window.scrollTo(0, 0)); await tidur(250); await page.screenshot({ path: path.join(OUT, file), timeout: 15000 }); }
  catch (e) { catat('SHOT-GAGAL', file, String(e.message || e).slice(0, 80)); }
}

async function periksaLayout(page, nama) {
  const r = await page.evaluate((n) => {
    const doc = document.documentElement;
    const kecil = [...document.querySelectorAll('button, a[href], input, select, summary, [role="tab"]')]
      .filter((el) => { const q = el.getBoundingClientRect(); return q.width > 0 && q.height > 0 && q.height < 44; })
      .map((el) => `${((el.textContent || el.getAttribute('aria-label') || '') + '').trim().slice(0, 22)}(${Math.round(el.getBoundingClientRect().height)}px)`);
    return { nama: n, luberX: doc.scrollWidth - doc.clientWidth, kecil: [...new Set(kecil)].slice(0, 8), jml: new Set(kecil).size };
  }, nama);
  layout.push(r);
  periksa(r.luberX <= 0, `scroll horizontal ${r.luberX}px di ${nama}`);
  return r;
}

// ---------------------------------------------------------------- aksi pemain

/** Ketuk objek adegan berdasarkan koordinat dunia (640x480). */
async function ketukDunia(page, x, y, sentuh) {
  const r = await page.evaluate(() => {
    const el = document.querySelector('.adegan');
    el?.scrollIntoView({ block: 'center' });
    const q = el?.getBoundingClientRect();
    return q ? { x: q.x, y: q.y, w: q.width, h: q.height } : null;
  });
  if (!r) return false;
  await tidur(120);
  const px = r.x + (x / 640) * r.w;
  const py = r.y + (y / 480) * r.h;
  if (sentuh) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
  return true;
}

async function objekAdegan(page) {
  return page.evaluate(() => window.__raksaStage?.scene?.objects ?? []);
}

/** Klik tombol HTML berdasarkan teks (label opsi/kategori/angka). */
async function klikTeks(page, selektor, teks) {
  return page.evaluate((sel, t) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const cari = norm(t);
    document.querySelectorAll('details.daftar-alternatif:not([open])').forEach((d) => { d.open = true; });
    const b = [...document.querySelectorAll(sel)].find((x) => !x.disabled && x.getBoundingClientRect().height > 0 && norm(x.textContent).startsWith(cari));
    if (!b) return false;
    b.click();
    return true;
  }, selektor, teks);
}

async function klikUtama(page) {
  return page.evaluate(() => {
    const b = document.querySelector('.misi-aksi .primary-action');
    if (!b || b.disabled) return false;
    b.click();
    return true;
  });
}

const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');

function teksAngka(step, n) { return step.format === 'rupiah' ? rupiah(n) : `${n}${step.unit ? ' ' + step.unit : ''}`; }
const label = (daftar, id) => daftar.find((o) => o.id === id)?.label ?? id;

/** Isi satu langkah. viaAdegan = ketuk objek adegan bila ada objeknya. */
async function isiLangkah(page, step, jawaban, viaAdegan, sentuh) {
  const obj = viaAdegan ? await objekAdegan(page) : [];
  const cariObj = (refId, role) => obj.find((o) => o.stepIds.includes(step.id) && o.refId === refId && o.role === role);
  let lewatAdegan = 0;
  let lewatHtml = 0;
  if (step.kind === 'multi') {
    for (const id of jawaban) {
      const o = cariObj(id, 'option');
      if (o) { await ketukDunia(page, o.x, o.y, sentuh); lewatAdegan++; await tidur(320); }
      else if (await klikTeks(page, 'button.opsi', label(step.options, id))) { lewatHtml++; await tidur(150); }
    }
    const isi = await page.evaluate(() => [...document.querySelectorAll('.slot-isi .slot-teks')].map((e) => (e.textContent || '').trim()));
    const kurang = jawaban.filter((id) => !isi.includes(label(step.options, id)));
    periksa(kurang.length === 0, `langkah ${step.id}: ${kurang.join(', ')} tidak masuk baki HTML (draft adegan & HTML tidak sinkron)`);
  } else if (step.kind === 'single') {
    const o = cariObj(jawaban, 'option');
    if (o) { await ketukDunia(page, o.x, o.y, sentuh); lewatAdegan++; await tidur(320); }
    else if (await klikTeks(page, 'button.opsi', label(step.options, jawaban))) { lewatHtml++; await tidur(150); }
    const dipilih = await page.evaluate(() => document.querySelector('button.opsi.dipilih')?.textContent ?? '');
    periksa(dipilih.startsWith(label(step.options, jawaban).slice(0, 20)), `langkah ${step.id}: pilihan HTML '${dipilih.slice(0, 30)}' tidak sama dengan yang diketuk`);
  } else if (step.kind === 'assign') {
    for (const [itemId, bucketId] of Object.entries(jawaban)) {
      const oi = cariObj(itemId, 'item');
      if (oi) { await ketukDunia(page, oi.x, oi.y, sentuh); lewatAdegan++; await tidur(380); }
      else await klikTeks(page, 'button.item-chip', label(step.items, itemId).split(' - ')[0]);
      await tidur(120);
      const ob = cariObj(bucketId, 'bucket');
      if (ob) { await ketukDunia(page, ob.x, ob.y, sentuh); lewatAdegan++; await tidur(320); }
      else if (await klikTeks(page, 'button.opsi', label(step.buckets, bucketId))) { lewatHtml++; await tidur(150); }
    }
    const n = await page.evaluate(() => document.querySelectorAll('.item-chip.sudah').length);
    periksa(n === Object.keys(jawaban).length, `langkah ${step.id}: ${n} bagian terisi, harusnya ${Object.keys(jawaban).length}`);
  } else if (step.kind === 'number') {
    if (await klikTeks(page, 'button.angka', teksAngka(step, jawaban))) lewatHtml++;
    await tidur(150);
  }
  return { lewatAdegan, lewatHtml };
}

/** Jawab satu misi (semua langkah) lalu kirim. Mengembalikan statistik. */
async function jawabMisi(page, misi, jawaban, viaAdegan, sentuh, sebelumKirim) {
  await tunggu(page, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', 'mode bermain sebelum menjawab', 15000);
  if (viaAdegan) await tunggu(page, () => { const s = document.querySelector('.adegan')?.getAttribute('data-status'); return s && s !== 'loading'; }, 'adegan siap sebelum menjawab', 20000);
  let adegan = 0;
  let html = 0;
  for (let i = 0; i < misi.steps.length; i++) {
    const step = misi.steps[i];
    const r = await isiLangkah(page, step, jawaban[step.id], viaAdegan, sentuh);
    adegan += r.lewatAdegan;
    html += r.lewatHtml;
    // Setelah "Lanjut", layar menggulir halus ke pertanyaan baru (±400 ms): tunggu seperti pemain sungguhan.
    if (i < misi.steps.length - 1) { await klikUtama(page); await tidur(700); }
  }
  if (sebelumKirim) await sebelumKirim();
  // Kirim dua kali cepat: harus tetap satu kiriman.
  await page.evaluate(() => { const b = document.querySelector('.misi-aksi .primary-action'); b?.click(); b?.click(); });
  await tidur(300);
  await page.evaluate(() => document.querySelector('.btn-utama')?.click());
  return { adegan, html };
}

/** Jawaban asal-asalan (opsi pertama) untuk pemain pembanding. */
function jawabanAsal(misi) {
  const j = {};
  for (const s of misi.steps) {
    if (s.kind === 'single') j[s.id] = s.options[0].id;
    if (s.kind === 'multi') j[s.id] = s.options.slice(0, s.requiredSelections).map((o) => o.id);
    if (s.kind === 'assign') j[s.id] = Object.fromEntries(s.items.map((it) => [it.id, s.buckets[0].id]));
    if (s.kind === 'number') j[s.id] = s.suggestions[0];
  }
  return j;
}

// ---------------------------------------------------------------- main

const data = await (await fetch(`${BASE}/api/missions`)).json();
const MISI = data.missions;
const TUTORIAL = data.tutorial;

const host = ioClient(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
await new Promise((r) => host.once('connect', r));
const dibuat = await rpc(host, 'host:create', { eventName: 'Uji E2E Adegan 2D' });
const { code, hostToken } = dibuat.data;
await rpc(host, 'host:settings', { code, hostToken, autoAdvance: false });
const aksi = async (action, extra = {}) => { const r = await rpc(host, 'host:action', { code, hostToken, action, ...extra }); periksa(r.ok, `host ${action}: ${r.error}`); if (r.data?.state) S = r.data.state; await tidur(250); };
let S = dibuat.data.state;
host.on('state', (st) => { S = st; });
/** Maju sampai server berada di fase & ronde target (server bisa berpindah sendiri karena timer). */
async function menuju(fase, ronde) {
  for (let i = 0; i < 12; i++) {
    if (S.roundIndex === ronde && S.phase === fase) return true;
    if (S.roundIndex > ronde) return false;
    if (S.phase === 'PAUSED') { await aksi('resume'); continue; }
    await aksi(S.phase === 'ACTIVE' ? 'closeRound' : 'next');
    await tidur(250);
  }
  return S.roundIndex === ronde && S.phase === fase;
}
catat('HOST', 'room', code);

const LUNCUR = {
  executablePath: CHROME,
  headless: true,
  args: ['--no-proxy-server', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  defaultViewport: null,
  protocolTimeout: 180000,
};
const semuaBrowser = [];
async function browserBaru() { const b = await puppeteer.launch(LUNCUR); semuaBrowser.push(b); return b; }
const br = await browserBaru();

try {
  const hostPage = await br.newPage();
  await aturGerak(hostPage);
  pantau(hostPage, 'host');
  await hostPage.setViewport({ width: 1366, height: 900 });
  await hostPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await hostPage.evaluate((k, t) => { localStorage.setItem(`raksa:host:${k}`, JSON.stringify(t)); localStorage.setItem('raksa:host:last', JSON.stringify(k)); }, code, hostToken);
  await hostPage.goto(`${BASE}/host?room=${code}`, { waitUntil: 'networkidle2' });
  await tidur(1200);
  await periksaLayout(hostPage, 'host 1366');

  const proj = await (await browserBaru()).newPage();
  await aturGerak(proj);
  pantau(proj, 'proyektor');
  await proj.setViewport({ width: 1366, height: 768 });
  await proj.goto(`${BASE}/projector?room=${code}`, { waitUntil: 'networkidle2' });
  await tunggu(proj, () => document.body.innerText.length > 40, 'proyektor tampil');

  const pemain = {};
  const buat = async (nama, vp, ringan) => {
    // Konteks terpisah = HP berbeda: localStorage/sessionStorage tidak saling bercampur.
    const p = await (await browserBaru()).newPage();
    await aturGerak(p);
    pantau(p, nama);
    await p.setViewport(vp);
    await p.goto(`${BASE}/join?room=${code}`, { waitUntil: 'networkidle2' });
    if (ringan) await p.evaluate(() => localStorage.setItem('raksa:adegan', 'ringan'));
    await tunggu(p, () => /Mau dipanggil siapa|Pilih teman mainmu/i.test(document.body.innerText), `form join ${nama}`);
    await p.evaluate(() => { const el = [...document.querySelectorAll('input')].find((i) => i.maxLength === 16); if (el) { el.focus(); el.value = ''; } });
    await p.keyboard.type(nama);
    await tidur(200);
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Ikut bermain/i.test(x.textContent || '')); b?.click(); });
    periksa(await tunggu(p, () => /Saya siap|Ganti karakter|segera bergabung/i.test(document.body.innerText), `lobby ${nama}`), `${nama} masuk lobby`);
    pemain[nama] = p;
    return p;
  };
  const ani = await buat('Ani', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const budi = await buat('Budi', { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, true);
  const dedi = await buat('Dedi', { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 });
  const citra = await buat('Citra', { width: 1280, height: 800, deviceScaleFactor: 1 });
  await tangkap(ani, '00-hp-lobby.png');
  await periksaLayout(ani, 'lobby 390');
  periksa(!(await ani.evaluate(() => /Tutup Ronde|Mulai Pertandingan|Akhiri Pertandingan/i.test(document.body.innerText))), 'kendali host bocor ke halaman pemain');

  // ------------------------------------------------------------ tutorial
  await aksi('startTutorial');
  await tunggu(ani, stageSiap, 'adegan tutorial siap', 25000);
  await tangkap(ani, '01-hp-tutorial.png');
  periksa(await ani.evaluate(() => /simulasi edukasi/i.test(document.body.innerText)), 'tutorial menampilkan pemberitahuan simulasi');
  const helm = (await objekAdegan(ani)).find((o) => o.refId === 'helm');
  if (helm) {
    await ketukDunia(ani, helm.x, helm.y, true);
    await tidur(500);
    periksa((await ani.evaluate(() => document.querySelector('button.opsi.dipilih')?.textContent ?? '')).startsWith('Helm'), 'tutorial: ketuk helm di adegan memilih "Helm proyek"');
  } else {
    periksa(await klikTeks(ani, 'button.opsi', TUTORIAL.steps[0].options[0].label), 'tutorial: pilih helm lewat daftar');
  }
  await tangkap(ani, '02-hp-tutorial-dipilih.png');
  await klikUtama(ani);
  periksa(await tunggu(ani, () => /Kamu siap bermain/i.test(document.body.innerText), 'tutorial selesai'), 'tutorial selesai dengan umpan balik');
  await tangkap(ani, '03-hp-tutorial-selesai.png');

  // ------------------------------------------------------------ pertandingan
  await aksi('startMatch');
  for (let r = 0; r < 10; r++) {
    const no = r + 1;
    const misi = MISI[r];
    const nn = String(no).padStart(2, '0');
    // BRIEFING
    periksa(await menuju('BRIEFING', r), `server di BRIEFING misi ${no}`);
    await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'intro', `briefing misi ${no}`);
    await tunggu(ani, stageSiap, `adegan misi ${no} siap`, 25000);
    const st = await ani.evaluate(() => ({ ...window.__raksaStage?.last, status: document.querySelector('.adegan')?.getAttribute('data-status'), kanvas: document.querySelectorAll('canvas').length }));
    periksa(st.status === 'ready', `misi ${no}: adegan 2D tampil (status ${st.status})`);
    periksa(st.kanvas <= 1, `misi ${no}: hanya satu kanvas (${st.kanvas})`);
    if (r === 0) {
      // Ketukan saat briefing tidak boleh mengubah apa pun.
      const o = (await objekAdegan(ani)).find((x) => x.role === 'option');
      if (o) await ketukDunia(ani, o.x, o.y, true);
      await tidur(300);
      periksa(await ani.evaluate(() => !document.querySelector('button.opsi')), 'briefing: kontrol jawaban belum tampil');
      await tangkap(ani, `m${nn}-hp-briefing.png`);
    }
    periksa(await menuju('ACTIVE', r), `server di ACTIVE misi ${no}`);
    await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `aktif misi ${no}`);
    if (r === 0) {
      periksa(await ani.evaluate(() => !document.querySelector('button.opsi.dipilih')), 'ketukan saat briefing tidak memilih apa pun');
      // Geser jari yang dimulai DI ATAS kanvas harus tetap menggulung halaman dan tidak memilih objek.
      await ani.evaluate(() => window.scrollTo(0, 0));
      const q = await ani.evaluate(() => { const b = document.querySelector('.adegan').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height * 0.8 }; });
      // Event sentuh sungguhan (touchstart/move/end). Catatan: Input.synthesizeScrollGesture
      // tidak menggulung di Chrome headless bahkan untuk HTML biasa, jadi tidak dipakai.
      await ani.touchscreen.touchStart(q.x, q.y);
      for (let i = 1; i <= 10; i++) { await ani.touchscreen.touchMove(q.x, q.y - i * 20); await tidur(16); }
      await ani.touchscreen.touchEnd();
      await tidur(500);
      const gulir = await ani.evaluate(() => window.scrollY);
      periksa(gulir > 40, `geser di atas kanvas menggulung halaman (scrollY=${gulir})`);
      periksa(await ani.evaluate(() => !document.querySelector('button.opsi.dipilih')), 'geser di kanvas tidak memilih objek');
      await ani.evaluate(() => window.scrollTo(0, 0));
    }
    await tidur(700);
    const fps = await ani.evaluate(() => window.__raksaStage?.fps?.() ?? null);
    ukur.push({ misi: no, loadMs: st.loadMs, rasterMs: st.rasterMs, renderer: st.renderer, fps: fps ? Math.round(fps) : null });

    // Ani: benar lewat adegan. Uji khusus di misi 2 (jeda) & 3 (refresh) lebih dulu.
    let sisaAni = BENAR[no];
    const sebelumKirim = async () => {
      await tangkap(ani, `m${nn}-hp-aktif.png`);
      await periksaLayout(ani, `misi ${no} 390`);
    };
    if (no === 2) {
      const obj = await objekAdegan(ani);
      const o1 = obj.find((o) => o.refId === 'foto-full');
      if (o1) await ketukDunia(ani, o1.x, o1.y, true); else await klikTeks(ani, 'button.opsi', label(misi.steps[0].options, 'foto-full'));
      await tidur(450);
      await aksi('pause');
      await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'paused', 'mode jeda');
      const o2 = obj.find((o) => o.refId === 'foto-kucing');
      if (o2) await ketukDunia(ani, o2.x, o2.y, true);
      await tidur(400);
      await tangkap(ani, 'm02-hp-jeda.png');
      await aksi('resume');
      await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', 'lanjut setelah jeda');
      periksa((await ani.evaluate(() => document.querySelectorAll('.slot-isi').length)) === 1, 'jeda mengunci ketukan adegan');
      sisaAni = { bukti: ['foto-depan-kiri', 'foto-identitas'] };
    } else if (no === 3) {
      const obj = await objekAdegan(ani);
      for (const id of ['kronologi', 'foto-kerusakan']) {
        const o = obj.find((x) => x.refId === id && x.role === 'option');
        if (o) await ketukDunia(ani, o.x, o.y, true); else await klikTeks(ani, 'button.opsi', label(misi.steps[0].options, id));
        await tidur(420);
      }
      await ani.reload({ waitUntil: 'networkidle2' });
      await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', 'kembali setelah refresh');
      await tunggu(ani, stageSiap, 'adegan setelah refresh', 25000);
      periksa((await ani.evaluate(() => document.querySelectorAll('.slot-isi').length)) === 2, 'refresh memulihkan draft (2 dokumen)');
      periksa((await ani.evaluate(() => document.querySelectorAll('canvas').length)) <= 1, 'refresh tidak meninggalkan kanvas lama');
      sisaAni = { berkas: ['daftar-barang', 'estimasi'] };
    }

    // Semua pemain menjawab paralel (seperti di acara), supaya muat dalam waktu misi.
    const asal = jawabanAsal(misi);
    const [hitungAni] = await Promise.all([
      jawabMisi(ani, misi, sisaAni, true, true, async () => {
        if (no === 2) periksa((await ani.evaluate(() => document.querySelectorAll('.slot-isi').length)) === 3, 'misi 2: tiga foto tercatat');
        await sebelumKirim();
      }),
      jawabMisi(budi, misi, asal, false, true, async () => { if (no === 2 || no === 5 || no === 9) await tangkap(budi, `m${nn}-hp360-ringan.png`); await periksaLayout(budi, `misi ${no} 360 ringan`); }),
      jawabMisi(dedi, misi, asal, false, true, async () => { if (no === 4 || no === 10 || no === 6) await tangkap(dedi, `m${nn}-hp-mendatar.png`); await periksaLayout(dedi, `misi ${no} mendatar`); }),
      jawabMisi(citra, misi, asal, true, false, async () => { await tangkap(citra, `m${nn}-desktop-aktif.png`); await periksaLayout(citra, `misi ${no} desktop`); }),
    ]);

    const ack = await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'sent', `ack misi ${no}`, 12000);
    for (const [nama, p] of [['Budi', budi], ['Dedi', dedi], ['Citra', citra]]) {
      periksa(await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'sent', `ack ${nama} misi ${no}`, 12000), `${nama} misi ${no}: laporan terkirim`);
    }
    if (no === 1) await tangkap(ani, 'm01-hp-terkirim.png');

    periksa(await menuju('REVEAL', r), `server di REVEAL misi ${no}`);
    const reveal = await tunggu(ani, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'reveal', `pembahasan misi ${no}`);
    await tidur(900);
    const poin = await ani.evaluate(() => { const m = document.body.innerText.match(/\+([\d.]+)\s*poin/); return m ? m[1] : null; });
    periksa(poin !== null && Number(poin.replace(/\./g, '')) >= 1000, `misi ${no}: jawaban benar Ani mendapat poin penuh (+${poin})`);
    await tangkap(ani, `m${nn}-hp-pembahasan.png`);
    await tangkap(citra, `m${nn}-desktop-pembahasan.png`);
    if (no === 1) await tangkap(proj, 'proyektor-pembahasan.png');

    periksa(await menuju('LEADERBOARD', r), `server di LEADERBOARD misi ${no}`);
    await tunggu(ani, () => /Siapa yang terdepan/i.test(document.body.innerText), `papan misi ${no}`);
    await tidur(400);
    const sisa = await ani.evaluate(() => ({ kanvas: document.querySelectorAll('canvas').length, live: window.__raksaStage?.live ?? 0, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }));
    const u = ukur.find((x) => x.misi === no); if (u) u.heapSetelahRondeMB = sisa.heapMB;
    periksa(sisa.kanvas === 0 && sisa.live === 0, `misi ${no}: kanvas & instance engine dibersihkan (${JSON.stringify({ kanvas: sisa.kanvas, live: sisa.live })})`);
    if (no === 1) await tangkap(proj, 'proyektor-papan.png');

    ringkas.push({ no, adegan: hitungAni.adegan, html: hitungAni.html, ack, reveal, poin });
    catat('MISI', nn, `ketuk adegan ${hitungAni.adegan}, HTML ${hitungAni.html} | ack ${ack} | pembahasan ${reveal} | +${poin} | muat ${st.loadMs}ms`);
  }

  periksa(await menuju('FINISHED', 9), 'server di FINISHED');
  await tunggu(ani, () => /Podium|poin|Lencana|Peringkat/i.test(document.body.innerText), 'halaman hasil');
  await tidur(1200);
  await tangkap(ani, '90-hp-hasil.png');
  await tangkap(proj, '91-proyektor-podium.png');
  await tangkap(hostPage, '92-host-selesai.png');
  await periksaLayout(ani, 'hasil 390');

  await ani.reload({ waitUntil: 'networkidle2' });
  periksa(await tunggu(ani, () => /Ani/.test(document.body.innerText), 'identitas pulih setelah refresh'), 'reconnect setelah refresh');

  const csv = await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`);
  const csvTeks = await csv.text();
  periksa(csv.status === 200 && /Ani/.test(csvTeks) && /Budi/.test(csvTeks), 'ekspor CSV berisi pemain');

  // ------------------------------------------------------------ latihan di HP kecil
  const kecil = await (await browserBaru()).newPage();
  await aturGerak(kecil);
  pantau(kecil, 'latihan360');
  await kecil.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  for (const [rute, nama] of [['/', 'landing'], ['/join', 'join'], ['/kenalan', 'kenalan'], ['/latihan', 'latihan-daftar']]) {
    await kecil.goto(`${BASE}${rute}`, { waitUntil: 'networkidle2' });
    await tidur(700);
    await periksaLayout(kecil, `${nama} 360`);
  }
  await kecil.goto(`${BASE}/latihan?misi=4`, { waitUntil: 'networkidle2' });
  await tunggu(kecil, stageSiap, 'adegan latihan', 25000);
  await jawabMisi(kecil, MISI[3], BENAR[4], true, true, async () => { await tangkap(kecil, 'latihan-m04-360.png'); });
  periksa(await tunggu(kecil, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'reveal', 'hasil latihan'), 'latihan: pembahasan tampil');
  periksa(await kecil.evaluate(() => /Jawabanmu tepat/.test(document.body.innerText)), 'latihan: jawaban benar = "Jawabanmu tepat"');
  periksa(await kecil.evaluate(() => !/Makin paham/.test(document.body.innerText)), 'latihan: tanpa kalimat lama "Makin paham"');
  await tangkap(kecil, 'latihan-m04-360-hasil.png');

  // Rotasi/resize: pilihan tetap & adegan tidak dimuat ulang. Pilihan terakhir terjangkau di atas bar aksi.
  await kecil.goto(`${BASE}/latihan?misi=1`, { waitUntil: 'networkidle2' });
  await tunggu(kecil, stageSiap, 'adegan latihan m01', 25000);
  periksa(await klikTeks(kecil, 'button.opsi', 'Dokumentasikan'), 'rotasi: pilih lewat daftar');
  await tidur(300);
  const dibuat = await kecil.evaluate(() => window.__raksaStage?.created ?? 0);
  await kecil.setViewport({ width: 740, height: 360, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await tidur(700);
  await kecil.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await tidur(700);
  periksa(await kecil.evaluate(() => /^Dokumentasikan/.test(document.querySelector('button.opsi.dipilih')?.textContent ?? '')), 'rotasi: pilihan tetap setelah HP diputar');
  periksa((await kecil.evaluate(() => window.__raksaStage?.created ?? 0)) === dibuat, 'rotasi: adegan tidak dimuat ulang');
  await kecil.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await tidur(300);
  periksa(await kecil.evaluate(() => {
    const o = [...document.querySelectorAll('.misi-panel button.opsi')].pop()?.getBoundingClientRect();
    const a = document.querySelector('.misi-aksi')?.getBoundingClientRect();
    return Boolean(o && a && o.bottom <= a.top + 1);
  }), 'pilihan terakhir terlihat di atas bar aksi');
} finally {
  console.log('\n================ RINGKASAN E2E ADEGAN 2D ================');
  for (const r of ringkas) console.log(`  misi ${String(r.no).padStart(2)} | ketuk adegan ${String(r.adegan).padStart(2)} | HTML ${String(r.html).padStart(2)} | ack ${r.ack} | pembahasan ${r.reveal} | +${r.poin}`);
  console.log('\npengukuran (Ani, HP 390, Chrome headless + WebGL perangkat lunak):');
  for (const u of ukur) console.log(`  misi ${String(u.misi).padStart(2)} | muat ${u.loadMs}ms | rasterisasi ${u.rasterMs}ms | ${u.renderer} | fps ${u.fps} | heap setelah ronde ${u.heapSetelahRondeMB}MB`);
  console.log('\nlayout:');
  for (const l of layout) console.log(`  ${l.nama.padEnd(26)} luberX=${String(l.luberX).padStart(3)}px  tombol<44px=${l.jml} ${l.kecil.length ? JSON.stringify(l.kecil) : ''}`);
  console.log('\nconsole/http bermasalah:', konsol.length);
  for (const c of konsol.slice(0, 25)) console.log(`  [${c.nama}/${c.tipe}] ${c.teks}`);
  console.log('\nkegagalan:', gagal.length);
  for (const g of gagal) console.log('  - ' + g);
  console.log('\nscreenshot:', OUT);
  console.log('=========================================================\n');
  host.disconnect();
  for (const b of semuaBrowser) await b.close().catch(() => {});
}
process.exit(gagal.length ? 1 : 0);
