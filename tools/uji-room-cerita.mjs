/**
 * UJI PENERIMAAN BROWSER — ROOM CERITA PRD v0.2 + REVIEW STAF (docs/prd-v02/REVIEW-HANDOFF.md §8, §11.4).
 *
 * PRASYARAT (tidak dimasukkan ke dependensi proyek, sama dengan tools/e2e-browser.mjs): puppeteer-core dan
 * socket.io-client di node_modules repo; Chrome lokal, selalu dijalankan headless oleh puppeteer.
 * Server uji = BUILD UJI + DB UJI, masing-masing di folder sendiri (DECISIONS D-35). JANGAN `npm run build` atau
 * `npm start`: keduanya menimpa / melayani client/dist + server/dist, yang bisa sedang dilayani server lain (server
 * pemilik di port 4100). JANGAN data/raksa-game.db: pakai salinan (API backup better-sqlite3, REVIEW-HANDOFF §3,
 * folder aset-cerita/ ikut) atau DB baru di folder uji; story:dev-setup mengisi identitas uji + demo terbit (simulasi):
 *   (cd client && VITE_OUT_DIR=dist-uji npx vite build)
 *   npx tsc -p server/tsconfig.json --outDir server/dist-uji
 *   DB_FILE=<uji>/raksa-game.db npm run story:dev-setup -- --publish-demo --period
 *   (cd server && PORT=4820 DB_FILE=<uji>/raksa-game.db CLIENT_DIST=client/dist-uji STORY_MAX_PARTICIPANTS=4 \
 *     PUBLIC_BASE_URL=http://127.0.0.1:4820 node dist-uji/server/src/index.js)
 *   UI_BASE=http://127.0.0.1:4820 RAKSA_KREDENSIAL=<uji>/dev-staff-credentials.json RAKSA_DB=<uji>/raksa-game.db \
 *     node tools/uji-room-cerita.mjs [landing] [main] [cms] [admin] [peran] [aset]
 *   <uji> = folder absolut di luar repo. PowerShell: `$env:NAMA='nilai'` per variabel sebelum perintahnya.
 * Env wajib : UI_BASE (server uji loopback; port di RAKSA_PORT_TERLARANG, bawaan "4100", ditolak: alat ini membuat
 *             room), RAKSA_KREDENSIAL (kata sandi akun uji dari dev-setup DB uji; isinya tidak pernah dicetak).
 * Opsional  : RAKSA_DB (pemeriksaan waktu langsung dari DB uji, hanya baca; data/raksa-game.db ditolak tanpa dibuka),
 *             RAKSA_SHOTS (bawaan docs/prd-v02/evidence/e2e; di dalam repo hanya bila DB uji tidak memuat skenario
 *             kasus nyata, karena teks kasus nyata tidak boleh masuk repo), RAKSA_CHROME, RAKSA_PORT_TERLARANG.
 *
 * Fase (bawaan: semua, berurutan):
 *   landing  review staf #1–#6 + arahan pemilik 2 Nov 2026 (Join Game di layar pertama HP dan DI ATAS pintu Mode Cerita
 *            "Mulai", Miss Raksa + slogan, tanpa "Cara main lain"/Latihan misi), Mode Cerita terbuka, rute mode lama
 *            (latihan, kuis acara) tertutup di MVP, empat viewport tanpa luapan horizontal.
 *   main     DUA skenario demo di DUA room terpisah yang berjalan BERSAMAAN, 15 babak penuh: room A (Baret, 4 peserta,
 *            waktu asli & lanjut otomatis) dan room B (Banjir, 3 peserta, host mengendalikan & sempat terputus).
 *            Peserta = tab browser terpisah dengan kebijakan terbaik/terburuk/sebagian/waktu habis; satu peserta putus di
 *            babak 2 lalu kembali di babak 5; room penuh; nama kosong/kembar/tidak pantas; pemberitahuan wajib;
 *            payload socket diperiksa (tanpa kunci, tanpa status pribadi orang lain); room selesai tidak bisa dimasuki lagi.
 *   cms      penulis membuat skenario dari NOL lewat UI, admin mengunggah aset, validasi gagal->lulus, pratinjau (tanpa
 *            room/hasil), ajukan, reviewer terbitkan, host memainkan, revisi+terbit v2 & arsip saat room v1 berjalan.
 *   admin    dasbor, rekap + CSV, analisis babak cocok dengan room yang dimainkan; periode bentrok ditolak.
 *   peran    penolakan per peran di UI dan API/socket (bukan hanya tombol tersembunyi).
 *   aset     gambar gagal dimuat -> panggung teks, room tetap bisa dimainkan.
 * Semua viewport = emulasi Chrome, bukan HP fisik. Kode keluar: 1 bila ada pemeriksaan GAGAL (fase yang melempar galat
 * dicatat GAGAL; soket, konteks browser dan bot fase itu tetap ditutup dan fase berikutnya tetap berjalan; kait halaman
 * yang tidak lagi cocok membuat pemeriksaan GAGAL, bukan terlewati), 2 bila argumen/env tidak valid atau server uji
 * tidak bisa dipakai (sebelum browser atau room apa pun dibuat).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';

// ------------------------------------------------------------------ arguments & environment (checked first)

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REAL_DB = path.join(REPO, 'data', 'raksa-game.db');
/** The identities story:dev-setup creates (server/src/story/cli/devSetup.ts TEST_IDENTITIES). */
const TEST_ACCOUNTS = ['uji.admin', 'uji.penulis', 'uji.reviewer', 'uji.host', 'uji.panitia'];
const PHASE_RUNNERS = { landing: phaseLanding, main: phaseMain, cms: phaseCms, admin: phaseAdmin, peran: phasePeran, aset: phaseAset };

/** Invalid arguments or environment: explain and stop with exit code 2 before any browser, socket or room exists. */
function refuse(message) {
  console.error(message);
  process.exit(2);
}
function requiredEnv(name) {
  const value = (process.env[name] ?? '').trim();
  if (!value) refuse(`Env ${name} wajib diisi (lihat kepala tools/uji-room-cerita.mjs).`);
  return value;
}
const insideRepo = (target) => {
  const rel = path.relative(REPO, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
/** The server under test: loopback only, never a forbidden port (the owner's live server); this tool creates rooms. */
function testServerBase(raw) {
  let url = null;
  try {
    url = new URL(raw);
  } catch {
    refuse(`UI_BASE bukan URL: ${raw}`);
  }
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const forbidden = (process.env.RAKSA_PORT_TERLARANG ?? '4100').split(',').map((x) => x.trim()).filter(Boolean);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) refuse('UI_BASE harus server uji lokal (127.0.0.1/localhost): alat ini membuat room.');
  if (forbidden.includes(port)) refuse(`Port ${port} terlarang (RAKSA_PORT_TERLARANG): alat ini membuat room di server yang diuji.`);
  return raw.replace(/\/+$/, '');
}
/** Test identity passwords written by story:dev-setup next to the test DB. The file content is never echoed. */
function readCredentials(file) {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    refuse(`RAKSA_KREDENSIAL tidak bisa dibaca (${file}): ${err.code ?? err.message}`);
  }
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Reported below without the parser message, which would quote the file (passwords).
  }
  const missing = TEST_ACCOUNTS.filter((name) => typeof parsed?.[name] !== 'string');
  if (missing.length) refuse(`RAKSA_KREDENSIAL (${file}) bukan berkas akun uji story:dev-setup: tidak ada ${missing.join(', ')}.`);
  return parsed;
}
/** RAKSA_DB is opened read-only for timing checks; the real data/raksa-game.db is refused without being opened. */
function testDbPath(raw) {
  if (!raw) return null;
  const file = path.resolve(raw);
  if (path.relative(REAL_DB, file) === '') refuse('RAKSA_DB menunjuk data/raksa-game.db (DB asli). Pakai salinan di folder uji.');
  if (!fs.existsSync(file)) refuse(`RAKSA_DB tidak ditemukan: ${file}`);
  return file;
}

const ARGS = process.argv.slice(2);
const unknownPhases = ARGS.filter((a) => !Object.hasOwn(PHASE_RUNNERS, a));
if (unknownPhases.length) refuse(`Fase tidak dikenal: ${unknownPhases.join(', ')}. Pilihan: ${Object.keys(PHASE_RUNNERS).join(' ')}.`);
const PHASES = ARGS.length ? ARGS : Object.keys(PHASE_RUNNERS);
const BASE = testServerBase(requiredEnv('UI_BASE'));
const CRED = readCredentials(requiredEnv('RAKSA_KREDENSIAL'));
const DB_PATH = testDbPath((process.env.RAKSA_DB ?? '').trim());
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve(process.env.RAKSA_SHOTS || path.join(REPO, 'docs/prd-v02/evidence/e2e'));

const HP390 = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const HP360 = { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const HP_MENDATAR = { width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2, isLandscape: true };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const VIEWPORTS = { 'hp390': HP390, 'hp360': HP360, 'mendatar': HP_MENDATAR, 'desktop': DESKTOP };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 400) });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? '  — ' + String(detail).slice(0, 200) : ''}`);
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ------------------------------------------------------------------ what the running phase opened

/**
 * Browser contexts, Socket.IO clients and participant bots opened by the running phase. The run releases them after
 * every phase, also when the phase throws: a failed phase used to leave a socket open and bots polling closed pages,
 * so the process never exited after printing the summary.
 */
const opened = { contexts: new Set(), sockets: new Set(), bots: new Set() };
async function releasePhase() {
  for (const bot of opened.bots) bot.stop = true;
  for (const socket of opened.sockets) socket.close();
  // Contexts the phase already closed reject here; that is expected.
  await Promise.allSettled([...opened.contexts].map((ctx) => ctx.close()));
  await Promise.allSettled([...opened.bots].map((bot) => bot.loop));
  for (const set of Object.values(opened)) set.clear();
}

// ------------------------------------------------------------------ API helpers (Node side)

async function apiLogin(username) {
  const r = await fetch(`${BASE}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: CRED[username] }) });
  const j = await r.json();
  if (!j.ok) throw new Error(`login ${username}: ${j.error}`);
  return j.token;
}
async function api(method, url, token, body) {
  const r = await fetch(BASE + url, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const buf = Buffer.from(await r.arrayBuffer());
  let json = null;
  try {
    json = JSON.parse(buf.toString('utf8'));
  } catch {
    /* csv */
  }
  return { status: r.status, json, text: buf.toString('utf8') };
}

/** text of each choice -> classification, per published version (bots read option texts from the DOM). */
async function answerKey(token, versionId) {
  const r = await api('GET', `/api/cms/versions/${versionId}`, token);
  const content = r.json.content;
  const key = new Map();
  content.rounds.forEach((round, i) => {
    const m = new Map();
    for (const ch of round.choices) m.set(content.text.id[`round.${round.id}.choice.${ch.id}.text`], ch.classification);
    key.set(i + 1, m);
  });
  return { key, content };
}

/**
 * Before any browser or room: the test server answers with the test identities, and screenshots may go inside the repo
 * only while the test DB holds no real case scenario (real case text never goes into the repo).
 */
async function preflight() {
  let scenarios = null;
  try {
    scenarios = (await api('GET', '/api/cms/scenarios', await apiLogin('uji.reviewer'))).json?.scenarios ?? null;
  } catch (err) {
    refuse(`Server uji ${BASE} tidak bisa dipakai: ${err.message}${err.cause?.code ? ` (${err.cause.code})` : ''}`);
  }
  if (!Array.isArray(scenarios)) refuse(`Server uji ${BASE}: daftar skenario CMS tidak terbaca.`);
  const realCases = scenarios.filter((s) => s.contentSource !== 'demo').length;
  if (realCases && insideRepo(OUT)) refuse(`DB uji memuat ${realCases} skenario kasus nyata, tetapi RAKSA_SHOTS (${OUT}) ada di dalam repo. Simpan bukti di luar repo.`);
}

// ------------------------------------------------------------------ Socket.IO helpers (Node side)

/** A /story client that the phase release closes; it rejects instead of retrying when it cannot connect. */
function connectStory(auth) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`${BASE}/story`, { auth, transports: ['websocket'], forceNew: true, reconnection: false });
    opened.sockets.add(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}
/** Emit with acknowledgement; none within `timeout` resolves `{ ok: false }` instead of waiting forever. */
const rpc = (socket, event, payload, timeout = 10000) => new Promise((resolve) => socket.timeout(timeout).emit(event, payload, (err, res) => resolve(err ? { ok: false, error: String(err) } : res)));

// ------------------------------------------------------------------ browser helpers

let browser;
async function newPage(viewport, opts = {}) {
  const ctx = opts.context ?? (await browser.createBrowserContext());
  opened.contexts.add(ctx);
  const page = await ctx.newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: opts.reducedMotion ? 'reduce' : 'no-preference' }]);
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errors.push(m.text());
  });
  return { ctx, page };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

/** No horizontal page overflow (staff/players must not scroll sideways). */
async function noOverflow(page) {
  return page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);
}

/** The element's center is visible and not covered by another element (after scrolling it into view). */
async function reachable(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  }, selector);
}

/** Set a React-controlled input/textarea value through the native setter so React sees the change. */
async function fill(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.evaluate(
    (sel, v) => {
      const el = document.querySelector(sel);
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    },
    selector,
    value,
  );
}

async function clickText(page, selector, text) {
  const ok = await page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(t) && !e.disabled);
      if (!el) return false;
      el.click();
      return true;
    },
    selector,
    text,
  );
  if (!ok) throw new Error(`clickText: "${text}" (${selector}) tidak ditemukan`);
}

async function waitText(page, text, timeout = 20000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
}

async function staffLoginUi(page, route, username) {
  await page.goto(BASE + route, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stf-masuk-kartu input');
  const inputs = await page.$$('.stf-masuk-kartu input');
  await inputs[0].type(username);
  await inputs[1].type(CRED[username]);
  await page.click('.stf-masuk-kartu button[type=submit]');
  await page.waitForSelector('.stf-kepala', { timeout: 15000 });
}

/** Capture Socket.IO frames received by a page (payload inspection). */
async function captureFrames(page) {
  const frames = [];
  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketFrameReceived', (e) => frames.push(e.response.payloadData));
  return frames;
}

/** Parse "42/story,[event,payload]" frames into { event, payload }. Acks (43…) are ignored. */
function storyEvents(frames) {
  const out = [];
  for (const f of frames) {
    const m = /^42\/story,(.*)$/s.exec(f);
    if (!m) continue;
    try {
      const [event, payload] = JSON.parse(m[1]);
      out.push({ event, payload });
    } catch {
      /* ignore */
    }
  }
  return out;
}
function deepKeys(v, acc = new Set()) {
  if (Array.isArray(v)) v.forEach((x) => deepKeys(x, acc));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    acc.add(k);
    deepKeys(x, acc);
  }
  return acc;
}

// ------------------------------------------------------------------ phase: landing (staff review #1–#6)

async function phaseLanding() {
  log('== landing');
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const { page, ctx } = await newPage(vp);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await shot(page, `landing-${name}`);
    const info = await page.evaluate(() => {
      const join = document.querySelector('.lp-join');
      const r = join?.getBoundingClientRect();
      return {
        joinTitle: document.querySelector('.lp-join-judul')?.textContent,
        mulai: document.querySelector('.lp-join-mulai')?.textContent.trim(),
        joinBottom: r ? r.bottom : null,
        vh: window.innerHeight,
        slogan: document.querySelector('.lp-kota-balon')?.textContent,
        caraLain: document.body.innerText.includes('Cara main lain'),
        latihan: /Latihan misi|Mini Games/i.test(document.body.innerText) || !!document.querySelector('a[href^="/solo"], a[href^="/latihan"]'),
        cerita: document.querySelector('[data-pintu-cerita]')?.textContent ?? null,
        ceritaTop: document.querySelector('[data-pintu-cerita]')?.getBoundingClientRect().top ?? null,
        joinTop: r ? r.top : null,
        surveyor: !!document.querySelector('.lp-join .potret-surveyor'),
        isti: !!document.querySelector('.lp-join .tokoh-isti'),
      };
    });
    check(`landing ${name}: Join Game + tombol Masuk (review #4)`, info.joinTitle === 'Join Game' && /^Masuk/.test(info.mulai ?? ''), JSON.stringify(info));
    check(`landing ${name}: pintu Mode Cerita "Mulai" di BAWAH Join Game (review #2, #4; arahan pemilik)`, /Mulai/.test(info.cerita ?? '') && info.ceritaTop !== null && info.joinTop !== null && info.ceritaTop > info.joinTop, `${info.joinTop} -> ${info.ceritaTop}`);
    if (name !== 'desktop') check(`landing ${name}: Join Game utuh di layar pertama HP (review #4)`, info.joinBottom !== null && info.joinBottom <= info.vh, `bawah=${info.joinBottom} tinggi=${info.vh}`);
    check(`landing ${name}: ikon surveyor, bukan Bu Isti (review #6)`, info.surveyor && !info.isti);
    check(`landing ${name}: sapaan Miss Raksa "anytime anywhere with our smile" (review #1)`, /Miss Raksa/.test(info.slogan ?? '') && /anytime anywhere with our smile/.test(info.slogan ?? ''), info.slogan);
    check(`landing ${name}: tanpa "Cara main lain" dan tanpa Latihan misi/Mini Games (review #3, #5; arahan pemilik)`, !info.caraLain && !info.latihan);
    check(`landing ${name}: tanpa luapan horizontal`, await noOverflow(page));
    check(`landing ${name}: tanpa galat JS`, page.errors.length === 0, page.errors.join(' | '));
    await ctx.close();
  }
  // Legacy routes are not registered in the MVP configuration (direct URL does not open them). Mode Cerita is.
  const { page, ctx } = await newPage(HP390);
  await page.goto(BASE + '/cerita', { waitUntil: 'networkidle0' });
  check('Mode Cerita terbuka di MVP (/cerita -> kenalan bila belum ada profil)', ['/cerita', '/kenalan'].includes(new URL(page.url()).pathname), page.url());
  for (const route of ['/solo', '/latihan', '/acara/join', '/acara/host', '/lobby', '/main']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle0' });
    check(`rute mode lama ${route} tertutup (kembali ke /)`, new URL(page.url()).pathname === '/', page.url());
  }
  const legacyApi = await api('GET', '/api/missions');
  check('API mode lama /api/missions ditolak server (404) saat RAKSA_LEGACY=off', legacyApi.status === 404, legacyApi.status);
  // Landing code field -> join page with the code.
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.type('.lp-join-kode', 'ab12');
  await page.click('.lp-join-mulai');
  await sleep(500);
  check('kode 4 karakter di MVP: tidak diteruskan ke kuis lama', !page.url().includes('/acara/'), page.url());
  await ctx.close();
}

// ------------------------------------------------------------------ phase: main (two rooms, 15 rounds)

/**
 * A participant bot: answers through the real UI according to `policy(roundNumber)` ->
 * 'tepat' | 'kurang_tepat' | 'keliru' | 'timeout'. Option texts are mapped to classifications with the answer key
 * (bots only; players never receive it).
 */
function startBot(p, key, policy, delays) {
  opened.bots.add(p);
  p.done = false;
  p.answered = new Set();
  p.rounds = new Map();
  p.stop = false;
  const loop = async () => {
    while (!p.stop) {
      let st;
      try {
        // Gameplay adaptation (docs/prd-v02/ARCHITECTURE.md §10, intended UI change): the separate scene/answer/consequence pages
        // (.sr-adegan/.sr-jawab/.sr-terkunci/.sr-opsi radio labels) became ONE round screen with stable test hooks:
        // `data-fase` on the round screen, `data-pilihan` on the five option cards (no A–E letters), `data-terkirim` on
        // the sent state. The round number has no hook; it is read from the round header kicker "Babak n/15".
        st = await p.page.evaluate(() => {
          const ronde = document.querySelector('.sr-ronde[data-fase]');
          return {
            babak: ronde?.querySelector('.sr-ronde-babak')?.textContent ?? '',
            form: ronde?.getAttribute('data-fase') === 'answering' && !!ronde.querySelector('[data-pilihan]'),
            locked: !!document.querySelector('[data-terkirim]'),
            // The option's own text: an action option also carries a "Tindakan" mark (icon + word + screen-reader
            // sentence) inside .sr-opsi-teks, which is not part of the authored text the answer key maps.
            opts: [...document.querySelectorAll('[data-pilihan]')].map((card) => {
              const teks = card.querySelector('.sr-opsi-teks')?.cloneNode(true);
              teks?.querySelectorAll('.sr-opsi-bentuk, .sr-only').forEach((x) => x.remove());
              return teks?.textContent ?? '';
            }),
            done: !!document.querySelector('.sr-hasil-akhir'),
          };
        });
      } catch {
        await sleep(400);
        continue;
      }
      if (st.done) {
        p.done = true;
        return;
      }
      const n = Number(/(\d+)\s*\/\s*\d+/.exec(st.babak)?.[1] ?? 0);
      if (st.form && !st.locked && n && !p.answered.has(n)) {
        p.answered.add(n);
        const want = policy(n);
        p.rounds.set(n, want);
        if (want !== 'timeout') {
          await sleep(delays(n));
          const map = key.get(n);
          let idx = st.opts.findIndex((t) => map.get(t) === want);
          if (idx < 0) idx = 0;
          try {
            // Option cards (`data-pilihan`) + ONE confirm button (`data-kirim`, labelled by the activity, e.g. "Tetapkan
            // pilihan") replace the radio labels + "Kunci jawaban" button (docs/prd-v02/ARCHITECTURE.md §10, intended UI change).
            const cards = await p.page.$$('[data-pilihan]');
            // The answer action bar is sticky at the bottom of small screens (real-scenario release): an option can sit fully
            // in the viewport yet under the bar, where puppeteer's click (it scrolls only elements NOT fully in view)
            // lands on the bar / confirm button and nothing is selected. Centre the option first, as a person scrolls.
            await cards[idx].evaluate((el) => el.scrollIntoView({ block: 'center' }));
            await cards[idx].click();
            await p.page.click('[data-kirim]');
          } catch (e) {
            p.errors = [...(p.errors ?? []), `round ${n}: ${e.message}`];
          }
        }
      }
      await sleep(250);
    }
  };
  p.loop = loop();
}

async function joinUi(page, code, name, { expectError } = {}) {
  await page.goto(`${BASE}/join?room=${code}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.sr-join-nama input.kolom', { timeout: 15000 });
  await fill(page, '.sr-join-nama input.kolom', name);
  const box = await page.$('.sr-setuju input');
  if (!(await box.evaluate((e) => e.checked))) await box.click();
  await page.click('.sr-join-nama button[type=submit]');
  if (expectError) {
    await page.waitForFunction(() => document.querySelector('.sr-join-nama .sr-galat[role=alert], .sr-join-nama .sr-galat:not(:empty)'), { timeout: 10000 });
    return page.evaluate(() => [...document.querySelectorAll('.sr-join-nama .sr-galat')].map((e) => e.textContent).join(' '));
  }
  await page.waitForFunction(() => location.pathname.startsWith('/room/'), { timeout: 15000 });
  await page.waitForSelector('.sr-lobi', { timeout: 15000 });
  return null;
}

async function hostCreateUi(page, title, auto) {
  await page.waitForSelector('.stf-pilih-skenario', { timeout: 15000 });
  await page.evaluate((t) => {
    const label = [...document.querySelectorAll('.stf-opsi')].find((l) => l.textContent.includes(t));
    label.querySelector('input').click();
  }, title);
  const autoBox = await page.$('.stf-kartu .stf-centang input');
  if ((await autoBox.evaluate((e) => e.checked)) !== auto) await autoBox.click();
  await clickText(page, 'button', 'Buka room');
  await page.waitForSelector('.stf-room-kode', { timeout: 15000 });
  return page.evaluate(() => new URL(location.href).searchParams.get('room'));
}

async function phaseMain(state) {
  log('== main: dua room bersamaan');
  const reviewer = await apiLogin('uji.reviewer');
  const hostToken = await apiLogin('uji.host');
  const hostScenarios = (await api('GET', '/api/host/scenarios', hostToken)).json.scenarios;
  const scA = hostScenarios.find((s) => s.title.startsWith('[DEMO] Baret'));
  const scB = hostScenarios.find((s) => s.title.startsWith('[DEMO] Mobil Terendam'));
  check('dua skenario demo terbit tersedia untuk host', scA && scB, hostScenarios.map((s) => s.title).join(', '));
  const keyA = await answerKey(reviewer, scA.versionId);
  const keyB = await answerKey(reviewer, scB.versionId);
  check('skenario A: 15 babak × 5 pilihan', keyA.content.rounds.length === 15 && keyA.content.rounds.every((r) => r.choices.length === 5));
  check('skenario B: 15 babak × 5 pilihan', keyB.content.rounds.length === 15 && keyB.content.rounds.every((r) => r.choices.length === 5));

  // Hosts (separate staff browser contexts) open the rooms.
  const hostA = await newPage(DESKTOP);
  await staffLoginUi(hostA.page, '/host', 'uji.host');
  const codeA = await hostCreateUi(hostA.page, '[DEMO] Baret', true);
  const hostB = await newPage(DESKTOP);
  await staffLoginUi(hostB.page, '/host', 'uji.host');
  const codeB = await hostCreateUi(hostB.page, '[DEMO] Mobil Terendam', false);
  check('dua room terpisah dengan kode 6 karakter', /^[A-Z2-9]{6}$/.test(codeA) && /^[A-Z2-9]{6}$/.test(codeB) && codeA !== codeB, `${codeA} ${codeB}`);
  state.codeA = codeA;
  state.codeB = codeB;
  await shot(hostA.page, 'host-lobi-desktop');

  // Projectors.
  const projA = await newPage(DESKTOP);
  await projA.page.goto(`${BASE}/projector?room=${codeA}`, { waitUntil: 'networkidle0' });
  const projB = await newPage(DESKTOP);
  await projB.page.goto(`${BASE}/projector?room=${codeB}`, { waitUntil: 'networkidle0' });

  // ---- room A participants (max 4 per room in this server configuration)
  const ani = { name: 'Ani Best', ...(await newPage(HP390)) };
  const budi = { name: 'Budi Poor', ...(await newPage(HP360, { reducedMotion: true })) };
  const citra = { name: 'Citra Mix', ...(await newPage(HP_MENDATAR)) };
  const dodi = { name: 'Dodi Putus', ...(await newPage(DESKTOP)) };
  for (const p of [ani, budi, citra, dodi]) p.frames = await captureFrames(p.page);

  // Notice is explicit and required (FR-E7, review #19).
  await ani.page.goto(`${BASE}/join?room=${codeA}`, { waitUntil: 'networkidle0' });
  await ani.page.waitForSelector('.sr-pemberitahuan');
  const notice = await ani.page.evaluate(() => document.querySelector('.sr-pemberitahuan')?.textContent ?? '');
  check('pemberitahuan nama tampil di papan peringkat & pengumuman pemenang sebelum masuk (FR-E7, #19)', /papan peringkat/.test(notice) && /pengumuman pemenang/.test(notice), notice.slice(0, 120));
  await shot(ani.page, 'join-nama-hp390');
  await fill(ani.page, '.sr-join-nama input.kolom', 'Ani Best');
  await ani.page.click('.sr-join-nama button[type=submit]');
  await sleep(400);
  const noAccept = await ani.page.evaluate(() => document.body.innerText.includes('Centang persetujuan'));
  check('tanpa centang persetujuan: tidak bisa masuk', noAccept && !ani.page.url().includes('/room/'));
  await joinUi(ani.page, codeA, 'Ani Best');
  await shot(ani.page, 'lobi-peserta-hp390');
  // Names: empty / inappropriate (client + server rules) / duplicate (server).
  check('nama kosong ditolak', /Isi nama dulu/.test(await joinUi(budi.page, codeA, '   ', { expectError: true })));
  check('nama tidak pantas ditolak', /tidak bisa dipakai/.test(await joinUi(budi.page, codeA, 'anjing', { expectError: true })));
  check('nama kembar (beda huruf besar/spasi) ditolak', /sudah dipakai/.test(await joinUi(budi.page, codeA, '  ani   BEST ', { expectError: true })));
  await joinUi(budi.page, codeA, 'Budi Poor');
  await joinUi(citra.page, codeA, 'Citra Mix');
  await joinUi(dodi.page, codeA, 'Dodi Putus');
  // Room full (STORY_MAX_PARTICIPANTS=4 on this test server).
  const extra = await newPage(HP390);
  await extra.page.goto(`${BASE}/join?room=${codeA}`, { waitUntil: 'networkidle0' });
  await sleep(800);
  const fullText = await extra.page.evaluate(() => document.body.innerText);
  check('room penuh: peserta ke-5 ditolak dengan pesan jelas', /penuh/i.test(fullText), fullText.slice(0, 160));
  await extra.ctx.close();

  // ---- room B participants
  const eko = { name: 'Eko Terbaik', ...(await newPage(HP390)) };
  const fani = { name: 'Fani Campur', ...(await newPage(DESKTOP)) };
  const gilang = { name: 'Gilang Lambat', ...(await newPage(HP360)) };
  for (const p of [eko, fani, gilang]) p.frames = await captureFrames(p.page);
  for (const p of [eko, fani, gilang]) await joinUi(p.page, codeB, p.name);
  await sleep(500);
  await shot(projA.page, 'proyektor-lobi-desktop');
  const lobbyNames = await projA.page.evaluate(() => [...document.querySelectorAll('.sr-layar-peserta li')].map((l) => l.textContent));
  check('layar acara lobi menampilkan nama peserta', ['Ani Best', 'Budi Poor', 'Citra Mix', 'Dodi Putus'].every((n) => lobbyNames.includes(n)), lobbyNames.join(','));

  // Start both rooms.
  await clickText(hostA.page, 'button', 'Mulai cerita');
  await clickText(hostB.page, 'button', 'Mulai cerita');
  state.startedAt = Date.now();

  const delay = (min, max) => (n) => min + ((n * 7919) % (max - min + 1));
  startBot(ani, keyA.key, () => 'tepat', delay(1000, 4000));
  startBot(budi, keyA.key, () => 'keliru', delay(2000, 6000));
  startBot(citra, keyA.key, (n) => (n % 3 === 0 ? 'timeout' : n % 2 === 0 ? 'kurang_tepat' : 'tepat'), delay(3000, 9000));
  startBot(dodi, keyA.key, () => 'tepat', delay(1500, 5000));
  startBot(eko, keyB.key, () => 'tepat', delay(800, 3000));
  startBot(fani, keyB.key, (n) => (n % 2 ? 'kurang_tepat' : 'keliru'), delay(1500, 4000));
  startBot(gilang, keyB.key, (n) => (n % 4 === 0 ? 'timeout' : 'tepat'), delay(4000, 12000));

  // Screenshots + checks the first time each phase is seen on each room A viewport (usually round 1).
  // Round phases come from the round screen's `data-fase` (scene/answering/consequence): the consequence now appears
  // inside the activity instead of a separate .sr-konsekuensi page (docs/prd-v02/ARCHITECTURE.md §10, intended UI change), and
  // the round stays on screen through the leaderboard (data-fase="leaderboard"); the final summary keeps its own page. Every phase × viewport must be seen once (checked after
  // the rooms finish), so a hook that no longer matches fails instead of silently skipping these checks.
  const SNAP_PHASES = ['scene', 'answering', 'consequence', 'leaderboard'];
  const snapped = [[ani, 'hp390'], [budi, 'hp360'], [citra, 'mendatar'], [dodi, 'desktop']];
  const phaseOf = (page) => page.evaluate(() => document.querySelector('.sr-ronde[data-fase]')?.getAttribute('data-fase') ?? (document.querySelector('.sr-hasil-akhir') ? 'finished' : 'other'));
  const shotsTaken = new Set();
  const snapAll = async (phase) => {
    for (const [p, vp] of snapped) {
      // A page may be closed (reconnect test) or navigating; skip it this tick.
      const current = await phaseOf(p.page).catch(() => 'closed');
      if (current !== phase) continue;
      const tag = `${phase}-${vp}`;
      if (shotsTaken.has(tag)) continue;
      shotsTaken.add(tag);
      await shot(p.page, `room-${tag}`);
      check(`room ${tag}: tanpa luapan horizontal`, await noOverflow(p.page));
      if (phase === 'answering') {
        // Five option cards (`data-pilihan`) or, once sent, the collapsed sent state (`data-terkirim`) — was
        // .sr-opsi/.sr-terkunci before the gameplay adaptation (docs/prd-v02/ARCHITECTURE.md §10).
        const tray = await p.page.evaluate(() => ({
          options: document.querySelectorAll('[data-pilihan]').length,
          sent: document.querySelector('[data-terkirim]') !== null,
          confirm: document.querySelector('[data-kirim]')?.textContent.trim() ?? null,
        }));
        check(`room ${tag}: 5 pilihan terlihat`, tray.options === 5 || tray.sent, `${tray.options} pilihan${tray.sent ? ', terkirim' : ''}`);
        // The confirm button (`data-kirim`) is labelled by the activity ("Tetapkan pilihan" on the demo stage) instead
        // of "Kunci jawaban" (docs/prd-v02/ARCHITECTURE.md §10, intended UI change); it must still not be covered. Until the answer
        // is sent the button must exist: a missing hook fails here instead of skipping the check.
        if (!tray.sent) check(`room ${tag}: tombol konfirmasi jawaban tidak tertutup`, tray.confirm !== null && (await reachable(p.page, '[data-kirim]')), tray.confirm ?? 'tanpa [data-kirim]');
        // ONE answer timer per round (`data-timer`, next to the confirm button) replaces .sr-timer (docs/prd-v02/ARCHITECTURE.md §10).
        const timers = await p.page.evaluate(() => [...document.querySelectorAll('[data-timer]')].map((el) => el.getAttribute('aria-label') ?? ''));
        check(`room ${tag}: timer 30 detik terlihat (#11–#14)`, timers.length === 1 && /detik/.test(timers[0]), `${timers.length} timer: ${timers.join(' | ')}`);
      }
    }
  };

  // Reconnect plan: Dodi drops in round 2 (scene) and returns in round 5.
  let dodiDropped = false;
  let dodiBack = false;
  // Room B host controls: skip reading in scene, continue after consequence min time, next at leaderboard; host
  // console closed during round 3 leaderboard and reopened (host disconnect: room waits, nothing resets).
  let hostBClosedAt = null;
  let hostBPage = hostB.page;
  const roundOf = async (page) => Number(/(\d+)\/15/.exec(await page.evaluate(() => document.querySelector('.sr-layar-babak')?.textContent ?? ''))?.[1] ?? 0);

  const deadline = Date.now() + 40 * 60_000;
  let lastProjA = '';
  while (Date.now() < deadline) {
    for (const phase of SNAP_PHASES) await snapAll(phase);
    const rA = await roundOf(projA.page);
    const rB = await roundOf(projB.page);
    const phaseA = await projA.page.evaluate(() => document.querySelector('.sr-layar')?.className ?? '');
    if (phaseA !== lastProjA && /sr-layar-(answering|leaderboard)/.test(phaseA) && rA === 1) await shot(projA.page, `proyektor-${phaseA.includes('answering') ? 'menjawab' : 'peringkat'}-desktop`);
    lastProjA = phaseA;
    // Dodi drop/return.
    if (!dodiDropped && rA === 2) {
      dodiDropped = true;
      dodi.stop = true;
      await dodi.page.close();
      log('Dodi terputus di babak 2');
    }
    if (dodiDropped && !dodiBack && rA >= 5) {
      dodiBack = true;
      dodi.page = await dodi.ctx.newPage();
      await dodi.page.setViewport(DESKTOP);
      dodi.frames = await captureFrames(dodi.page);
      await dodi.page.goto(`${BASE}/room/${codeA}`, { waitUntil: 'networkidle0' });
      await sleep(1500);
      const resumed = await dodi.page.evaluate(() => document.querySelector('.sr-main') !== null && !document.body.innerText.includes('Belum bergabung'));
      check('peserta yang putus kembali ke babak BERJALAN dengan kredensial room (bukan nama)', resumed, `babak ${rA}`);
      startBot(dodi, keyA.key, () => 'tepat', delay(1500, 5000));
      dodi.answered = new Set([...Array(rA).keys()].map((i) => i + 1).filter((i) => i < rA));
      log('Dodi kembali di babak', rA);
    }
    // Room B host actions.
    try {
      const hb = await hostBPage.evaluate(() => [...document.querySelectorAll('.stf-room-kendali .btn-utama')].map((b) => ({ t: b.textContent.trim(), d: b.disabled })));
      const phaseB = await projB.page.evaluate(() => document.querySelector('.sr-layar')?.className ?? '');
      if (rB === 3 && /leaderboard/.test(phaseB) && hostBClosedAt === null) {
        hostBClosedAt = Date.now();
        await hostBPage.close();
        log('Host B menutup konsol (terputus) di peringkat babak 3');
        await sleep(6000);
        const waiting = await projB.page.evaluate(() => document.body.innerText.includes('Menunggu host melanjutkan'));
        check('host terputus: room tetap hidup dan menunggu (tidak direset)', waiting && (await roundOf(projB.page)) === 3);
        // A new tab has no staff session (the token lives in sessionStorage: closing the tab signs out), so the host
        // signs in again and the console re-attaches to the room named in the URL.
        const reopened = await newPage(DESKTOP, { context: hostB.ctx });
        hostBPage = reopened.page;
        await staffLoginUi(hostBPage, `/host?room=${codeB}`, 'uji.host');
        await hostBPage.waitForSelector('.stf-room-kendali', { timeout: 15000 });
        check('host masuk lagi di tab baru dan mengambil alih room yang sama', (await roundOf(projB.page)) === 3);
      } else if (hb.length && !hb[0].d) {
        if (/Buka pilihan sekarang/.test(hb[0].t)) {
          await sleep(2500);
          await clickText(hostBPage, '.stf-room-kendali .btn-utama', 'Buka pilihan sekarang');
        } else if (/Lanjut ke peringkat|Tampilkan hasil akhir/.test(hb[0].t)) {
          await sleep(4500);
          await clickText(hostBPage, '.stf-room-kendali .btn-utama', hb[0].t);
        } else if (/Babak berikutnya/.test(hb[0].t)) {
          await sleep(2000);
          await clickText(hostBPage, '.stf-room-kendali .btn-utama', 'Babak berikutnya');
        }
      }
    } catch (err) {
      // Usually a page mid-navigation; logged so a stuck host loop is visible instead of silent.
      log('host B loop:', err.message.slice(0, 120));
    }
    if ([ani, budi, citra, dodi, eko, fani, gilang].every((p) => p.done)) break;
    await sleep(600);
  }
  state.durationA = Date.now() - state.startedAt;
  log('kedua room selesai dalam', Math.round(state.durationA / 1000), 'detik');
  const all = [ani, budi, citra, dodi, eko, fani, gilang];
  check('semua peserta mencapai ringkasan akhir di kedua room', all.every((p) => p.done), all.map((p) => `${p.name}:${p.done}`).join(' '));
  // The scripted steps hang on page hooks too (projector round number, host console phase): each must have happened.
  const unseen = SNAP_PHASES.flatMap((phase) => snapped.map(([, vp]) => `${phase}-${vp}`)).filter((tag) => !shotsTaken.has(tag));
  check('setiap fase babak teramati di setiap viewport room A (kait data-fase / papan peringkat cocok)', unseen.length === 0, unseen.join(', '));
  check('skenario putus-sambung berjalan: Dodi putus di babak 2 dan kembali di babak 5', dodiDropped && dodiBack, `putus=${dodiDropped} kembali=${dodiBack}`);
  check('skenario host terputus berjalan: konsol host room B ditutup di peringkat babak 3', hostBClosedAt !== null);

  // Final summaries.
  for (const [p, vp] of snapped) {
    await shot(p.page, `hasil-akhir-${vp}`);
    const s = await p.page.evaluate(() => ({
      decisions: document.querySelectorAll('.sr-keputusan').length,
      ending: document.querySelector('.sr-tanda-akhir')?.textContent ?? null,
      // The ending kind from the badge's modifier class (sr-tanda-akhir-<kind>), whatever the label's wording.
      endingKind: /\bsr-tanda-akhir-(\w+)/.exec(document.querySelector('.sr-tanda-akhir')?.className ?? '')?.[1] ?? null,
      total: document.querySelector('.sr-total-angka b')?.textContent ?? null,
      explain: !!document.querySelector('.sr-penjelasan'),
      rank: document.querySelector('.sr-peringkat-saya')?.textContent ?? null,
      timeouts: document.body.innerText.match(/(\d+) babak waktu habis/)?.[1] ?? null,
    }));
    p.summary = s;
    check(`${p.name}: ringkasan berisi 15 keputusan + akhir + rincian 70:30 + peringkat`, s.decisions === 15 && s.ending && s.explain && s.rank, JSON.stringify(s));
    check(`${p.name}: ringkasan tanpa luapan horizontal (${vp})`, await noOverflow(p.page));
  }
  // A badge that cannot be read fails both checks (a renamed label must not turn the second one into a pass).
  check('jalur terbaik (Ani) mendapat happy ending penuh', ani.summary.endingKind === 'happy', `${ani.summary.endingKind}: ${ani.summary.ending}`);
  check('jalur terburuk (Budi) tidak mendapat happy ending', budi.summary.endingKind !== null && budi.summary.endingKind !== 'happy', `${budi.summary.endingKind}: ${budi.summary.ending}`);
  check('Citra: 5 babak waktu habis tercatat 0 poin', citra.summary.timeouts === '5', citra.summary.timeouts);
  check('Dodi: babak yang terlewat saat putus tercatat waktu habis', Number(dodi.summary.timeouts) >= 2, dodi.summary.timeouts);
  await shot(projA.page, 'proyektor-akhir-desktop');
  const projFinal = await projA.page.evaluate(() => ({ rows: document.querySelectorAll('.sr-peringkat-baris').length, text: document.body.innerText }));
  check('layar acara menampilkan peringkat akhir room A', projFinal.rows === 4 && /Sesi selesai/.test(projFinal.text));

  // Payload inspection (participants only ever receive public snapshots + their OWN private state; no keys).
  for (const p of all) {
    const ev = storyEvents(p.frames);
    const pubKeys = new Set();
    ev.filter((e) => e.event === 'story:public').forEach((e) => deepKeys(e.payload, pubKeys));
    const forbiddenPublic = ['options', 'consequence', 'summary', 'mood', 'moodBand', 'credential', 'credentialHash', 'classification', 'accuracy', 'moodDelta', 'choiceId'].filter((k) => pubKeys.has(k));
    const privates = ev.filter((e) => e.event === 'story:private').map((e) => e.payload);
    const allKeys = new Set();
    ev.forEach((e) => deepKeys(e.payload, allKeys));
    const forbiddenAny = ['classification', 'accuracy', 'moodDelta', 'choiceId', 'credential', 'credentialHash', 'secret'].filter((k) => allKeys.has(k));
    const ownIds = new Set(privates.map((x) => x.participantId));
    check(`${p.name}: payload publik tanpa kunci/status pribadi`, forbiddenPublic.length === 0, forbiddenPublic.join(','));
    check(`${p.name}: tidak ada kunci jawaban/bobot di payload mana pun`, forbiddenAny.length === 0, forbiddenAny.join(','));
    check(`${p.name}: hanya menerima status pribadinya sendiri`, privates.length > 0 && ownIds.size === 1, [...ownIds].join(','));
    check(`${p.name}: tanpa galat JS`, (p.page.errors ?? []).length === 0 && !(p.errors ?? []).length, [...(p.page.errors ?? []), ...(p.errors ?? [])].join(' | '));
  }
  const optionsBeforeClose = storyEvents(ani.frames).filter((e) => e.event === 'story:private' && e.payload.options && e.payload.consequence);
  check('pilihan dan konsekuensi tidak pernah dikirim bersamaan (benar/salah tidak bocor saat menjawab)', optionsBeforeClose.length === 0);

  // Closed room: cannot be joined/replayed; personal result stays readable.
  const late = await newPage(HP390);
  await late.page.goto(`${BASE}/join?room=${codeA}`, { waitUntil: 'networkidle0' });
  await sleep(1000);
  const lateText = await late.page.evaluate(() => document.body.innerText);
  check('room selesai tidak bisa dimasuki lagi (tanpa reset/ulang)', /sudah selesai|ditutup/i.test(lateText), lateText.slice(0, 160));
  await late.ctx.close();
  const hostSock = await connectStory({ staffToken: hostToken });
  const replay = await rpc(hostSock, 'host:start', { code: codeA });
  // A refusal from the server carries its code; no acknowledgement at all is not a refusal.
  check('host tidak bisa memulai ulang room yang selesai (socket)', replay.ok === false && Boolean(replay.code), JSON.stringify(replay));
  hostSock.close();
  await ani.page.reload({ waitUntil: 'networkidle0' });
  await sleep(1000);
  check('hasil pribadi tetap terbuka setelah muat ulang', (await ani.page.$$('.sr-keputusan')).length === 15);

  // Optional DB-level timing checks on the isolated test DB copy.
  if (DB_PATH) {
    const require = createRequire(path.join(REPO, 'server', 'package.json'));
    const Database = require('better-sqlite3');
    const db = new Database(DB_PATH, { readonly: true });
    const roomA = db.prepare('SELECT id, started_at, finished_at FROM story_rooms WHERE code = ?').get(codeA);
    const rounds = db.prepare('SELECT round_index, answering_started_at, deadline_at, closed_at, close_reason, eligible_count, answered_count FROM story_room_rounds WHERE room_id = ? ORDER BY round_index').all(roomA.id);
    const lastAnswer = db.prepare('SELECT round_index, MAX(received_at) AS last FROM story_decisions WHERE room_id = ? AND received_at IS NOT NULL GROUP BY round_index').all(roomA.id);
    const lastBy = new Map(lastAnswer.map((x) => [x.round_index, x.last]));
    const allAnswered = rounds.filter((r) => r.close_reason === 'all_answered');
    const gaps = allAnswered.map((r) => r.closed_at - (lastBy.get(r.round_index) ?? r.closed_at));
    check('room A: 15 babak tercatat', rounds.length === 15, rounds.length);
    check('babak tertutup otomatis begitu semua menjawab (FR-B6, review #17), tanpa menunggu timer', allAnswered.length > 0 && gaps.every((g) => g >= 0 && g < 1500), `babak all_answered=${allAnswered.length} jeda maks=${Math.max(...gaps)}ms`);
    const deadlines = rounds.filter((r) => r.close_reason === 'deadline');
    check('babak dengan waktu habis ditutup tepat di batas 30 detik', deadlines.every((r) => r.closed_at - r.answering_started_at >= 30000 && r.closed_at - r.answering_started_at < 32000), deadlines.map((r) => r.closed_at - r.answering_started_at).join(','));
    state.sessionMinutesA = (roomA.finished_at - roomA.started_at) / 60000;
    check('durasi sesi room A diukur (target ±14 menit, bukan jaminan)', state.sessionMinutesA > 0, `${state.sessionMinutesA.toFixed(1)} menit`);
    db.close();
  }
  for (const p of [...all, hostA, projA, projB]) await p.ctx.close().catch(() => undefined);
  await hostB.ctx.close().catch(() => undefined);
}

// ------------------------------------------------------------------ phase: cms (blank -> publish -> play -> revise/archive)

async function phaseCms(state) {
  log('== cms');
  const title = `Skenario UI Uji Terima ${Date.now().toString(36).slice(-5)}`;
  state.cmsTitle = title;
  // System admin uploads a background via the UI asset library.
  const adm = await newPage(DESKTOP);
  await staffLoginUi(adm.page, '/cms/aset', 'uji.admin');
  await adm.page.waitForSelector('.cms-aset-daftar');
  await adm.page.evaluate(() => document.querySelector('details.stf-kartu summary')?.click());
  const png = path.join(REPO, 'client/src/cerita/seni/piksel/ruang-parkiran-latar.png');
  await fill(adm.page, 'details.stf-kartu select.kolom', 'background');
  const fileInput = await adm.page.$('details.stf-kartu input[type=file]');
  await fileInput.uploadFile(png);
  const metaInputs = await adm.page.$$('details.stf-kartu .stf-grid input.kolom:not([type=file])');
  const meta = ['Parkiran pasar (uji)', 'Uji e2e', 'Aset piksel milik game (uji)', 'Milik Raksa (uji internal)', 'Raksa', 'Hanya untuk uji lokal'];
  for (let i = 0; i < metaInputs.length && i < meta.length; i++) {
    await metaInputs[i].evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, meta[i]);
  }
  await clickText(adm.page, 'details.stf-kartu button[type=submit]', 'Unggah');
  await waitText(adm.page, 'diunggah', 20000);
  await shot(adm.page, 'cms-aset-desktop');
  check('admin sistem mengunggah aset latar dengan metadata sumber/lisensi lewat UI', true);
  const svg = await api('POST', '/api/cms/assets?kind=background&title=x&source=x&license=x', await apiLogin('uji.admin'), undefined);
  check('unggahan tanpa berkas gambar valid ditolak', svg.status >= 400, svg.status);
  await adm.ctx.close();

  // Author creates a scenario from BLANK via the UI.
  const au = await newPage(DESKTOP);
  await staffLoginUi(au.page, '/cms', 'uji.penulis');
  await au.page.evaluate(() => document.querySelector('details.cms-buat summary')?.click());
  await fill(au.page, 'details.cms-buat input.kolom', title);
  await fill(au.page, 'details.cms-buat select.kolom:nth-of-type(1)', 'auto');
  const selects = await au.page.$$('details.cms-buat select.kolom');
  await selects[1].evaluate((el) => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, 'demo');
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await clickText(au.page, 'details.cms-buat button', 'Buat draf');
  await au.page.waitForSelector('.cms-editor', { timeout: 15000 });
  const scenarioId = au.page.url().split('/').pop();
  state.cmsScenarioId = scenarioId;
  // Blank scenario fails validation with round/field-specific messages.
  await clickText(au.page, '[role=tab]', 'Validasi');
  await sleep(300);
  const blankIssues = await au.page.evaluate(() => [...document.querySelectorAll('.cms-isu-semua button')].map((b) => b.textContent));
  check('skenario kosong gagal validasi dengan pesan spesifik', blankIssues.length > 0 && blankIssues.some((t) => /babak harus 15/.test(t)), blankIssues.slice(0, 3).join(' | '));
  await shot(au.page, 'cms-validasi-kosong-desktop');

  // Info tab.
  await clickText(au.page, '[role=tab]', 'Info & tokoh');
  const setByLabel = async (label, value) => {
    await au.page.evaluate(
      (l, v) => {
        const lab = [...document.querySelectorAll('label')].find((x) => x.textContent.trim().startsWith(l));
        const el = lab && document.getElementById(lab.htmlFor);
        if (!el) throw new Error('label ' + l);
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
        el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
      },
      label,
      value,
    );
  };
  await setByLabel('Sinopsis', 'Skenario uji terima yang dibuat lengkap lewat antarmuka CMS (sintetis).');
  await setByLabel('Nama customer', 'Pak Darto');
  await setByLabel('Nama petugas', 'Miss Raksa');

  // Rounds: scaffold 15 then fill every field through the form.
  await clickText(au.page, '[role=tab]', 'Babak');
  await clickText(au.page, 'button', 'Buat kerangka 15 babak');
  for (let i = 0; i < 15; i++) {
    await au.page.evaluate((n) => [...document.querySelectorAll('.cms-babak-daftar button')][n].click(), i);
    await sleep(60);
    const n = i + 1;
    await setByLabel('Judul babak', `Tahap ${n} pemeriksaan`);
    await setByLabel('Pertanyaan keputusan', `Apa tindakan paling tepat di tahap ${n}?`);
    await setByLabel('Baris 1', `Pak Darto bertanya tentang langkah ${n} klaimnya.`);
    if (i === 0) {
      // Gameplay adaptation editor (docs/prd-v02/CMS-GUIDE.md), exercised minimally on round 1 with SYNTHETIC text: the activity
      // picker ("Meja berkas" = dossier), one shared evidence item (a document), who replies after the decision, and the
      // round lesson. A dossier round needs at least one evidence item (validation `dossier_empty`).
      await au.page.evaluate(() => document.querySelector('fieldset.cms-kegiatan input[type=radio][value="dossier"]')?.click());
      await clickText(au.page, '.cms-babak-editor button', '+ Dokumen');
      await au.page.waitForSelector('.cms-berkas', { timeout: 5000 });
      await setByLabel('Judul singkat', 'Catatan survei (uji)');
      await setByLabel('Isi dokumen', 'Catatan sintetis: kendaraan diperiksa di parkiran, foto kerusakan dan formulir klaim sudah diterima.');
      await setByLabel('Yang membalas sesudah keputusan', 'customer');
      await setByLabel('Pelajaran singkat', 'Cocokkan berkas bersama lebih dulu sebelum memutuskan langkah klaim berikutnya.');
    }
    if (i === 2) await setByLabel('Latar', (await au.page.evaluate(() => [...document.querySelectorAll('option')].find((o) => o.textContent.includes('Parkiran pasar (uji)'))?.value)) ?? 'builtin:bg:parkiran');
    for (let c = 1; c <= 5; c++) {
      await au.page.evaluate(
        (ci, nn) => {
          const item = document.querySelectorAll('.cms-pilihan-item')[ci - 1];
          const set = (sel, v) => {
            const el = item.querySelectorAll(sel);
            return el;
          };
          const fields = item.querySelectorAll('input.kolom:not([type=number]), textarea.kolom');
          const vals = [`Tindakan ${ci} untuk tahap ${nn}`, `Akibat tindakan ${ci} pada tahap ${nn}.`, `Penjelasan komite untuk tindakan ${ci} tahap ${nn}.`];
          fields.forEach((el, k) => {
            // Text, consequence, reason only. The optional fields after them stay empty: the respondent's reply (gameplay
            // adaptation) and "Tinggalkan tanda" (flag id, real-scenario release) — filling the flag with vals[3] (undefined)
            // saved the flag "undefined" on all 75 choices -> 75 unused-flag warnings and an extra 6th preview path.
            if (k >= vals.length) return;
            const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, vals[k]);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          });
          void set;
        },
        c,
        n,
      );
    }
    await setByLabel('Konsekuensi waktu habis', `Pak Darto menunggu tanpa kepastian di tahap ${n}.`);
  }
  await clickText(au.page, '[role=tab]', 'Akhir cerita');
  await clickText(au.page, 'button', 'Buat 3 akhir awal');
  const endingTitles = await au.page.$$('.cms-tab-isi .stf-kartu');
  for (let e = 0; e < endingTitles.length; e++) {
    await au.page.evaluate((k) => {
      const card = document.querySelectorAll('.cms-tab-isi section.stf-kartu')[k];
      const fields = card.querySelectorAll('input.kolom:not([type=number]), textarea.kolom');
      const vals = [`Akhir ${k + 1}`, `Klaim Pak Darto selesai (akhir ${k + 1}).`];
      fields.forEach((el, j) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, vals[j] ?? vals[0]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }, e);
  }
  await clickText(au.page, '[role=tab]', 'Validasi');
  await sleep(300);
  const errorsLeft = await au.page.evaluate(() => document.querySelector('.cms-tab-isi .stf-galat, .stf-ok')?.textContent ?? '');
  check('skenario lengkap dari UI lolos validasi', /Tidak ada masalah|^0 galat/.test(errorsLeft), errorsLeft);
  await clickText(au.page, 'button', 'Simpan draf');
  await waitText(au.page, 'Draf tersimpan', 15000);
  // The new editor fields reach the saved draft (round 1): dossier activity, one document, respondent, lesson.
  const draft = (await api('GET', `/api/cms/scenarios/${scenarioId}`, await apiLogin('uji.penulis'))).json.scenario.content;
  const r1 = draft.rounds[0];
  const ev1 = r1.evidence?.[0];
  check(
    'editor babak 1: kegiatan, berkas, penanggap & pelajaran tersimpan di draf',
    r1.layout === 'dossier' && r1.evidence.length === 1 && ev1?.kind === 'document' && draft.text.id[`round.${r1.id}.ev.${ev1?.id}.title`] === 'Catatan survei (uji)' && r1.respondent?.speaker === 'customer' && /^Cocokkan berkas/.test(draft.text.id[`round.${r1.id}.lesson`] ?? ''),
    JSON.stringify({ layout: r1.layout, evidence: r1.evidence, respondent: r1.respondent }),
  );
  // Preview: same rules, no room, no results.
  const reviewerTok = await apiLogin('uji.reviewer');
  const panitiaTok = await apiLogin('uji.panitia');
  const roomsBefore = (await api('GET', '/api/admin/rooms', panitiaTok)).json.rooms.length;
  await clickText(au.page, '[role=tab]', 'Pratinjau');
  await au.page.waitForSelector('.cms-pratinjau');
  // The preview renders round 1 with the room's own activity component (mode 'preview'): the desk and its document.
  const previewDesk = await au.page.evaluate(() => ({ aktivitas: document.querySelector('.cms-pratinjau-panel [data-aktivitas]')?.getAttribute('data-aktivitas') ?? null, berkas: document.querySelectorAll('.cms-pratinjau-panel [data-berkas]').length }));
  check('pratinjau babak 1 memakai kegiatan meja berkas dengan berkasnya (komponen room)', previewDesk.aktivitas === 'dossier' && previewDesk.berkas === 1, JSON.stringify(previewDesk));
  for (let i = 0; i < 15; i++) {
    // The preview uses the room's decision tray (docs/prd-v02/CMS-GUIDE.md): select an option card (`data-pilihan`), confirm it
    // (`data-kirim`), then the outcome (`data-hasil`) takes the tray's place. The old .sr-opsi radio answered on click.
    await au.page.evaluate(() => document.querySelector('.cms-pratinjau-panel [data-pilihan]')?.click());
    await sleep(80);
    await au.page.evaluate(() => document.querySelector('.cms-pratinjau-panel [data-kirim]')?.click());
    await au.page.waitForSelector('.cms-pratinjau-panel [data-hasil]', { timeout: 5000 }).catch(() => undefined);
    await au.page.evaluate(() => [...document.querySelectorAll('.cms-pratinjau-panel button.btn')].find((b) => /Babak berikutnya|Lihat akhir/.test(b.textContent))?.click());
    await sleep(80);
  }
  await shot(au.page, 'cms-pratinjau-akhir-desktop');
  const previewEnd = await au.page.evaluate(() => !!document.querySelector('.cms-pratinjau-akhir'));
  const paths = await au.page.evaluate(() => [...document.querySelectorAll('.cms-pratinjau table tbody tr')].map((r) => r.textContent));
  check('pratinjau memainkan 15 babak sampai akhir dengan aturan yang sama', previewEnd && paths.length === 5 && paths.every((p) => /Akhir|Happy|catatan/i.test(p)), paths.join(' | ').slice(0, 300));
  const roomsAfter = (await api('GET', '/api/admin/rooms', panitiaTok)).json.rooms.length;
  check('pratinjau tidak membuat room/hasil kompetisi', roomsAfter === roomsBefore, `${roomsBefore} -> ${roomsAfter}`);
  // Submit for review.
  await clickText(au.page, '[role=tab]', 'Review, terbit');
  await clickText(au.page, 'button', 'Ajukan ke review');
  await waitText(au.page, 'Diajukan ke review', 15000);
  await shot(au.page, 'cms-alur-diajukan-desktop');
  const lockedSave = await api('PUT', `/api/cms/scenarios/${scenarioId}/draft`, await apiLogin('uji.penulis'), { content: {}, revision: 1 });
  check('draf terkunci saat review (409)', lockedSave.status === 409 || lockedSave.status === 400, lockedSave.status);
  await au.ctx.close();

  // Reviewer publishes through the UI (four-eyes: not the author).
  const rv = await newPage(DESKTOP);
  await staffLoginUi(rv.page, `/cms/skenario/${scenarioId}`, 'uji.reviewer');
  await rv.page.waitForSelector('.cms-editor');
  await clickText(rv.page, '[role=tab]', 'Review, terbit');
  await fill(rv.page, '.cms-tab-isi textarea.kolom', 'SIMULASI uji terima oleh identitas uji — bukan persetujuan komite.');
  await clickText(rv.page, 'button', 'Terbitkan');
  await waitText(rv.page, 'Diterbitkan sebagai versi baru', 15000);
  await shot(rv.page, 'cms-alur-terbit-desktop');
  check('reviewer menerbitkan versi 1 lewat UI', true);
  await rv.ctx.close();

  // Host sees it immediately (no build/restart) and runs a room pinned to v1.
  const hostTok = await apiLogin('uji.host');
  const opts = (await api('GET', '/api/host/scenarios', hostTok)).json.scenarios;
  const mine = opts.find((s) => s.scenarioId === scenarioId);
  check('skenario terbit langsung tersedia di host tanpa build/restart', mine && mine.versionNo === 1);
  const host = await newPage(DESKTOP);
  await staffLoginUi(host.page, '/host', 'uji.host');
  const code = await hostCreateUi(host.page, title, true);
  const pl = await newPage(HP390);
  await joinUi(pl.page, code, 'Pemain Uji CMS');
  await host.page.waitForFunction(() => [...document.querySelectorAll('.stf-room-peserta td')].some((td) => td.textContent === 'Pemain Uji CMS'), { timeout: 15000 });
  await clickText(host.page, 'button', 'Mulai cerita');
  // The round screen (`data-fase`) replaces the separate .sr-adegan scene page (docs/prd-v02/ARCHITECTURE.md §10).
  await pl.page.waitForSelector('.sr-ronde[data-fase]', { timeout: 30000 });
  await shot(pl.page, 'cms-room-babak1-hp390');
  // Round 1 was authored as a desk of documents: the participant's room shows that activity, and its shared document
  // opens in the evidence sheet (`data-berkas` -> `data-lembar`).
  const desk = await pl.page.evaluate(() => ({ aktivitas: document.querySelector('[data-aktivitas]')?.getAttribute('data-aktivitas') ?? null, berkas: document.querySelectorAll('[data-berkas]').length }));
  let sheetText = '';
  if (desk.berkas) {
    await pl.page.click('[data-berkas]');
    sheetText = await pl.page
      .waitForSelector('[data-lembar]', { timeout: 5000 })
      .then((el) => el.evaluate((d) => d.textContent))
      .catch(() => '');
    await shot(pl.page, 'cms-room-berkas-hp390');
    await pl.page.keyboard.press('Escape');
  }
  check('room memainkan babak 1 dari CMS sebagai meja berkas; berkasnya terbuka di lembar', desk.aktivitas === 'dossier' && desk.berkas === 1 && sheetText.includes('Catatan sintetis'), JSON.stringify(desk));
  // Author revises + reviewer publishes v2 + archive while the room runs.
  const penulisTok = await apiLogin('uji.penulis');
  const det = (await api('GET', `/api/cms/scenarios/${scenarioId}`, penulisTok)).json.scenario;
  const edited = structuredClone(det.content);
  edited.text.id['scenario.title'] = `${title} (revisi 2)`;
  check('revisi draf', (await api('PUT', `/api/cms/scenarios/${scenarioId}/draft`, penulisTok, { content: edited, revision: det.draftRevision })).status === 200);
  await api('POST', `/api/cms/scenarios/${scenarioId}/submit`, penulisTok, {});
  const v2 = await api('POST', `/api/cms/scenarios/${scenarioId}/publish`, reviewerTok, { note: 'SIMULASI v2' });
  check('versi 2 terbit', v2.json?.scenario?.currentVersionNo === 2, v2.status);
  await api('POST', `/api/cms/scenarios/${scenarioId}/archive`, reviewerTok, { reason: 'uji arsip' });
  const label = await pl.page.evaluate(() => document.title);
  check('room yang berjalan tetap memakai versi 1 setelah revisi/terbit/arsip', !/revisi 2/.test(label), label);
  const optsAfter = (await api('GET', '/api/host/scenarios', hostTok)).json.scenarios;
  check('skenario diarsipkan tidak bisa membuka room baru', !optsAfter.some((s) => s.scenarioId === scenarioId));
  await clickText(host.page, 'button', 'Tutup room');
  await clickText(host.page, '.btn-bahaya', 'Ya, tutup room');
  await sleep(1500);
  await shot(pl.page, 'cms-room-ditutup-hp390');
  check('host menutup room: peserta melihat sesi dihentikan', await pl.page.evaluate(() => document.body.innerText.includes('Sesi dihentikan')));
  await host.ctx.close();
  await pl.ctx.close();
}

// ------------------------------------------------------------------ phase: admin (reports reconcile)

async function phaseAdmin(state) {
  log('== admin');
  const tok = await apiLogin('uji.panitia');
  const dash = (await api('GET', '/api/admin/dashboard?includeDemo=1', tok)).json.dashboard;
  const res = (await api('GET', '/api/admin/results?includeDemo=1', tok)).json.results;
  const fromRooms = state.codeA ? res.filter((r) => r.roomCode === state.codeA || r.roomCode === state.codeB) : [];
  if (state.codeA) check('rekap lintas room memuat 7 peserta dari dua room uji', fromRooms.length === 7, fromRooms.length);
  const completed = res.filter((r) => r.completed);
  const avg = completed.length ? Math.round(completed.reduce((a, r) => a + r.totalScore, 0) / completed.length) : null;
  check('dasbor: rata-rata nilai = rata-rata hasil selesai di rekap', dash.averageScore === avg, `${dash.averageScore} vs ${avg}`);
  // Running rooms are reported separately and enter participant/completion figures only once closed.
  const closedRows = res.filter((r) => r.roomStatus === 'finished' || r.roomStatus === 'interrupted');
  check('dasbor: peserta = baris rekap dari room yang sudah selesai/terhenti', dash.participants === closedRows.length, `${dash.participants} vs ${closedRows.length}`);
  const off = (await api('GET', '/api/admin/dashboard', tok)).json.dashboard;
  check('konten DEMO dikecualikan dari angka kompetisi secara bawaan', off.roomsStarted === 0, off.roomsStarted);
  const csv = await api('GET', '/api/admin/results.csv?includeDemo=1', tok);
  check('ekspor CSV ber-BOM UTF-8 berisi nama peserta', csv.text.startsWith('\uFEFF') && (!state.codeA || csv.text.includes('Ani Best')));
  const an = (await api('GET', '/api/admin/analytics?includeDemo=1', tok)).json.analytics;
  check('analisis babak tersedia per skenario/versi (15 babak)', an.length >= 1 && an.every((v) => v.rounds.length === 15));
  const now = Date.now();
  const p1 = await api('POST', '/api/admin/periods', tok, { name: 'Periode uji terima', startsAt: now + 864e5 * 400, endsAt: now + 864e5 * 401 });
  const clash = await api('POST', '/api/admin/periods', tok, { name: 'Bentrok', startsAt: now + 864e5 * 400 + 1000, endsAt: now + 864e5 * 400 + 2000 });
  check('periode baru dibuat; periode bentrok ditolak', p1.status === 200 && clash.status === 409, `${p1.status} ${clash.status}`);
  const ui = await newPage(DESKTOP);
  await staffLoginUi(ui.page, '/admin/dasbor', 'uji.panitia');
  // Each report is photographed with "Sertakan konten DEMO" (the filter's first checkbox) switched on; a page where that
  // checkbox is not found fails below instead of being photographed unfiltered.
  const includeDemo = () => ui.page.evaluate(() => {
    const box = document.querySelector('.adm-filter input[type=checkbox]');
    box?.click();
    return box !== null;
  });
  const demoFilter = { dasbor: await includeDemo() };
  await sleep(1200);
  await shot(ui.page, 'admin-dasbor-desktop');
  await ui.page.goto(`${BASE}/admin/rekap`, { waitUntil: 'networkidle0' });
  demoFilter.rekap = await includeDemo();
  await sleep(1200);
  await shot(ui.page, 'admin-rekap-desktop');
  await ui.page.goto(`${BASE}/admin/analitik`, { waitUntil: 'networkidle0' });
  demoFilter.analitik = await includeDemo();
  await sleep(1200);
  await shot(ui.page, 'admin-analitik-desktop');
  check('halaman admin: filter "Sertakan konten DEMO" ada di dasbor, rekap dan analitik', Object.values(demoFilter).every(Boolean), JSON.stringify(demoFilter));
  check('halaman admin tanpa galat JS', ui.page.errors.length === 0, ui.page.errors.join(' | '));
  await ui.ctx.close();
}

// ------------------------------------------------------------------ phase: peran (role denial, UI + API + socket)

async function phasePeran() {
  log('== peran');
  const matrix = [
    ['uji.host', 'GET', '/api/cms/scenarios', 403],
    ['uji.host', 'GET', '/api/admin/dashboard', 403],
    ['uji.penulis', 'GET', '/api/host/scenarios', 403],
    ['uji.penulis', 'GET', '/api/admin/results', 403],
    ['uji.penulis', 'POST', '/api/admin/periods', 403],
    ['uji.reviewer', 'POST', '/api/cms/scenarios', 403],
    ['uji.reviewer', 'GET', '/api/admin/users', 403],
    ['uji.panitia', 'GET', '/api/cms/scenarios', 403],
    ['uji.panitia', 'GET', '/api/admin/users', 403],
    ['uji.admin', 'GET', '/api/admin/results', 403],
    ['uji.admin', 'GET', '/api/host/scenarios', 403],
  ];
  for (const [user, method, url, want] of matrix) {
    const tok = await apiLogin(user);
    const r = await api(method, url, tok, method === 'POST' ? {} : undefined);
    check(`${user} ${method} ${url} -> ${want}`, r.status === want, r.status);
  }
  check('tanpa sesi -> 401', (await api('GET', '/api/cms/scenarios', null)).status === 401);
  const authorTok = await apiLogin('uji.penulis');
  const sock = await connectStory({ staffToken: authorTok });
  const scenarioId = (await api('GET', '/api/cms/scenarios', authorTok)).json.scenarios[0]?.id;
  const res = await rpc(sock, 'host:create', { scenarioId });
  check('penulis tidak bisa membuka room lewat socket', !res.ok && res.code === 'forbidden', JSON.stringify(res));
  sock.close();
  for (const [user, route] of [['uji.host', '/cms'], ['uji.penulis', '/host'], ['uji.penulis', '/admin']]) {
    const p = await newPage(DESKTOP);
    await staffLoginUi(p.page, route, user);
    const denied = await p.page.evaluate(() => document.body.innerText.includes('tidak memiliki akses'));
    check(`UI ${route} untuk ${user}: akses ditolak dengan pesan`, denied);
    await p.ctx.close();
  }
}

// ------------------------------------------------------------------ phase: aset (failed assets -> text stage)

async function phaseAset() {
  log('== aset gagal');
  const hostTok = await apiLogin('uji.host');
  const sc = (await api('GET', '/api/host/scenarios', hostTok)).json.scenarios.find((s) => s.title.startsWith('[DEMO] Baret'));
  const sock = await connectStory({ staffToken: hostTok });
  const created = await rpc(sock, 'host:create', { scenarioId: sc.scenarioId, autoAdvance: true });
  if (!created.ok) throw new Error(`host:create gagal: ${JSON.stringify(created)}`);
  const { code } = created.data;
  try {
    const p = await newPage(HP390);
    await p.page.setRequestInterception(true);
    p.page.on('request', (req) => (/\.(png|webp|jpg)(\?|$)/i.test(req.url()) ? req.abort() : req.continue()));
    await joinUi(p.page, code, 'Uji Aset Gagal');
    const startedRoom = await rpc(sock, 'host:start', { code });
    if (!startedRoom.ok) throw new Error(`host:start gagal: ${JSON.stringify(startedRoom)}`);
    // Round screen / option cards / confirm button / outcome inside the activity replace .sr-adegan, .sr-jawab +
    // .sr-opsi, .sr-kunci and the separate .sr-konsekuensi page (docs/prd-v02/ARCHITECTURE.md §10 hooks, intended UI change).
    await p.page.waitForSelector('.sr-ronde[data-fase]', { timeout: 30000 });
    await sleep(2500);
    await shot(p.page, 'aset-gagal-adegan-hp390');
    const ok = await p.page.evaluate(() => !!document.querySelector('.sr-dialog') && !!document.querySelector('.ss-panggung, .ss-teks'));
    check('gambar gagal dimuat: panggung jatuh ke gambar SVG/teks, dialog tetap terbaca', ok);
    await p.page.waitForSelector('[data-pilihan]', { timeout: 60000 });
    await p.page.$$eval('[data-pilihan]', (els) => els[0].click());
    await p.page.click('[data-kirim]');
    await p.page.waitForSelector('.sr-ronde[data-fase="consequence"] [data-hasil]', { timeout: 15000 });
    check('tetap bisa menjawab dan menerima konsekuensi tanpa gambar', true);
  } finally {
    // Also after a failed step, so no auto-advancing room is left running on the test server.
    await rpc(sock, 'host:close', { code });
  }
}

// ------------------------------------------------------------------ run

await preflight();
fs.mkdirSync(OUT, { recursive: true });
browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const state = {};
const started = Date.now();
try {
  for (const phase of PHASES) {
    try {
      await PHASE_RUNNERS[phase](state);
    } catch (err) {
      check(`fase ${phase} selesai tanpa pengecualian`, false, err.stack ?? err.message);
    } finally {
      await releasePhase();
    }
  }
} finally {
  await browser.close();
}
const failed = checks.filter((c) => !c.ok);
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify({ base: BASE, phases: PHASES, startedAt: new Date(started).toISOString(), durationSec: Math.round((Date.now() - started) / 1000), state, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
console.log(`\n${checks.length - failed.length}/${checks.length} lulus; ${failed.length} gagal. Bukti: ${OUT}`);
process.exitCode = failed.length ? 1 : 0;
// Every phase released what it opened, so the process ends by itself here. Should anything still hold the event loop
// (a defect of this tool), say so and stop instead of hanging after the summary.
setTimeout(() => {
  console.error('Masih ada sumber daya terbuka sesudah semua fase; proses dihentikan.');
  process.exit(process.exitCode);
}, 5000).unref();
