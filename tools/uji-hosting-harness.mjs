/**
 * UJI HARNESS HOSTING (docs/prd-v02/HOSTING.md): game di bawah prefiks /game/ lewat reverse proxy + iframe.
 * Prasyarat: build uji di folder sendiri, JANGAN client/dist (bisa sedang dilayani server lain, mis. server pemilik di
 * port 4100) dan jangan client/dist-game lama (bisa basi); server dari server/dist-uji; DB uji di folder sendiri berisi
 * identitas uji + demo terbit (story:dev-setup --publish-demo, lihat kepala tools/uji-room-cerita.mjs; DECISIONS D-35):
 *   (cd client && VITE_BASE_PATH=/game/ VITE_OUT_DIR=<uji>/dist-game npx vite build)
 *   npx tsc -p server/tsconfig.json --outDir server/dist-uji
 *   (cd server && PORT=4830 DB_FILE=<uji>/raksa-game.db CLIENT_DIST=<uji>/dist-game TRUST_PROXY_HOPS=1 \
 *     PUBLIC_BASE_URL=http://127.0.0.1:4890/game FRAME_ANCESTORS=http://127.0.0.1:4890 \
 *     node dist-uji/server/src/index.js)
 *   GAME_ORIGIN=http://127.0.0.1:4830 HARNESS_PORT=4890 node tools/harness-raksaonline/harness.mjs
 *   HARNESS=http://127.0.0.1:4890 RAKSA_KREDENSIAL=<uji>/dev-staff-credentials.json node tools/uji-hosting-harness.mjs
 *   <uji> = folder absolut di luar repo. GAME_ORIGIN harness = server uji itu, tidak pernah server pemilik (4100).
 * Env wajib : HARNESS (http://127.0.0.1:<port>; origin pembanding "localhost" dipakai untuk uji origin yang ditolak;
 *             port di RAKSA_PORT_TERLARANG, bawaan "4100", ditolak), RAKSA_KREDENSIAL (berisi "uji.host"; isinya tidak
 *             pernah dicetak).
 * Opsional  : RAKSA_SHOTS (bawaan docs/prd-v02/evidence/hosting), RAKSA_CHROME (selalu headless), RAKSA_PORT_TERLARANG.
 * Memeriksa: header framing, halaman induk memuat game di iframe, API + Socket.IO + aset lewat prefiks, satu babak
 * dimainkan di dalam iframe, dan origin yang tidak diizinkan tidak bisa membingkai game. Emulasi Chrome, bukan produksi.
 * Room dibuat (dari skenario DEMO pertama yang terbit) hanya bila server di balik harness memang server uji untuk
 * harness ini (PUBLIC_BASE_URL = HARNESS/game). Kode keluar: 1 bila ada pemeriksaan GAGAL (galat di tengah alur dicatat
 * GAGAL; room tetap ditutup dan hasil.json tetap ditulis), 2 bila env tidak valid atau harness tidak terjangkau.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Invalid environment or unreachable harness: explain and stop with exit code 2 before anything is created. */
function refuse(message) {
  console.error(message);
  process.exit(2);
}
function requiredEnv(name) {
  const value = (process.env[name] ?? '').trim();
  if (!value) refuse(`Env ${name} wajib diisi (lihat kepala tools/uji-hosting-harness.mjs).`);
  return value;
}
/**
 * The local stand-in parent site: http://127.0.0.1:<port> exactly, because the refused-origin check frames it from
 * "localhost"; never a forbidden port (the owner's live server).
 */
function harnessOrigin(raw) {
  let url = null;
  try {
    url = new URL(raw);
  } catch {
    refuse(`HARNESS bukan URL: ${raw}`);
  }
  const forbidden = (process.env.RAKSA_PORT_TERLARANG ?? '4100').split(',').map((x) => x.trim()).filter(Boolean);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port) refuse('HARNESS harus http://127.0.0.1:<port> (harness lokal tools/harness-raksaonline).');
  if (forbidden.includes(url.port)) refuse(`Port ${url.port} terlarang (RAKSA_PORT_TERLARANG).`);
  return url.origin;
}
/** The host test identity's password from the story:dev-setup credentials file; the file content is never echoed. */
function hostPassword(file) {
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    // A parser message would quote the file (passwords): only a read error code is shown.
    refuse(`RAKSA_KREDENSIAL tidak terbaca sebagai JSON (${file})${err.code ? `: ${err.code}` : ''}.`);
  }
  const password = parsed?.['uji.host'];
  if (typeof password !== 'string') refuse(`RAKSA_KREDENSIAL (${file}) tidak berisi akun "uji.host" dari story:dev-setup.`);
  return password;
}

const HARNESS = harnessOrigin(requiredEnv('HARNESS'));
const GAME = HARNESS + '/game';
const HOST_PASSWORD = hostPassword(requiredEnv('RAKSA_KREDENSIAL'));
const OUT = path.resolve(process.env.RAKSA_SHOTS || path.join(REPO, 'docs/prd-v02/evidence/hosting'));
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? '  — ' + String(detail).slice(0, 160) : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Emit with acknowledgement; none within `timeout` resolves `{ ok: false }` instead of waiting forever. */
const rpc = (socket, event, payload, timeout = 10000) => new Promise((resolve) => socket.timeout(timeout).emit(event, payload, (err, res) => resolve(err ? { ok: false, error: String(err) } : res)));
/** The host socket through the prefixed proxy path; resolves either way so the connection is a recorded check. */
const connectHost = (token) =>
  new Promise((resolve) => {
    const socket = ioClient(HARNESS + '/story', { path: '/game/socket.io', auth: { staffToken: token }, transports: ['websocket'], forceNew: true, reconnection: false });
    socket.once('connect', () => resolve({ socket, error: '' }));
    socket.once('connect_error', (err) => resolve({ socket, error: err.message }));
  });

let head = null;
try {
  head = await fetch(GAME + '/');
} catch (err) {
  refuse(`Harness ${HARNESS} tidak terjangkau: ${err.message}${err.cause?.code ? ` (${err.cause.code})` : ''}`);
}
let host = null;
let code = null;
let browser = null;
try {
  fs.mkdirSync(OUT, { recursive: true });
  const csp = head.headers.get('content-security-policy') ?? '';
  check('halaman game lewat proxy berprefiks: 200', head.status === 200, head.status);
  check('CSP frame-ancestors mengizinkan halaman induk', csp.includes(`frame-ancestors ${HARNESS}`), csp);
  const html = await head.text();
  check('index.html memakai aset berprefiks /game/', html.includes('/game/assets/'), '');
  const cfg = await (await fetch(GAME + '/api/config')).json();
  check('API lewat prefiks; tautan gabung memakai PUBLIC_BASE_URL berprefiks', cfg.joinBaseUrl === GAME, cfg.joinBaseUrl);
  // Rooms are only created on the test server this harness fronts (its join links carry the harness prefix).
  if (cfg.joinBaseUrl !== GAME) throw new Error(`server di balik harness tidak memakai PUBLIC_BASE_URL=${GAME}: room tidak dibuat di sana`);

  // Host opens a room through the proxy (REST + Socket.IO path /game/socket.io).
  const login = await (await fetch(GAME + '/api/staff/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'uji.host', password: HOST_PASSWORD }) })).json();
  if (!login.ok) throw new Error(`login uji.host: ${login.error}`);
  const scenarios = (await (await fetch(GAME + '/api/host/scenarios', { headers: { authorization: `Bearer ${login.token}` } })).json()).scenarios ?? [];
  const demo = scenarios.find((s) => s.contentKind === 'demo');
  if (!demo) throw new Error('tidak ada skenario DEMO yang terbit (story:dev-setup --publish-demo)');
  const link = await connectHost(login.token);
  host = link.socket;
  check('Socket.IO (WebSocket) tersambung lewat proxy berprefiks', host.connected, link.error);
  if (!host.connected) throw new Error('tanpa Socket.IO host tidak ada room untuk dimainkan');
  const created = await rpc(host, 'host:create', { scenarioId: demo.scenarioId, autoAdvance: true });
  if (!created.ok) throw new Error(`host:create ${created.code ?? ''} ${created.error ?? ''}`);
  code = created.data.code;

  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  const failed = [];
  page.on('response', (r) => {
    if (r.url().startsWith(GAME) && r.status() >= 400 && !/\/api\/story\/rooms\/[A-Z0-9]+\/info/.test(r.url())) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(HARNESS + '/', { waitUntil: 'networkidle0' });
  const frame = await (await page.waitForSelector('#bingkai-game')).contentFrame();
  await frame.waitForSelector('.lp-join', { timeout: 20000 });
  await page.screenshot({ path: path.join(OUT, 'harness-iframe-landing.png') });
  check('halaman induk memuat landing game di iframe', true);
  await frame.type('.lp-join-kode', code);
  await frame.click('.lp-join-mulai');
  await frame.waitForSelector('.sr-join-nama input.kolom', { timeout: 20000 });
  await frame.type('.sr-join-nama input.kolom', 'Peserta Harness');
  await frame.click('.sr-setuju input');
  await frame.click('.sr-join-nama button[type=submit]');
  await frame.waitForSelector('.sr-lobi', { timeout: 20000 });
  check('bergabung ke room dari dalam iframe (rute /game/room/…)', frame.url().startsWith(GAME + '/room/'), frame.url());
  const started = await rpc(host, 'host:start', { code });
  if (!started.ok) throw new Error(`host:start ${started.code ?? ''} ${started.error ?? ''}`);
  // Gameplay adaptation hooks (docs/prd-v02/ARCHITECTURE.md §10, intended UI change): option cards `data-pilihan` + one confirm button
  // `data-kirim` replace .sr-jawab/.sr-opsi/.sr-kunci; the consequence shows inside the activity (`data-hasil`) instead
  // of the separate .sr-konsekuensi page.
  await frame.waitForSelector('[data-pilihan]', { timeout: 60000 });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, 'harness-iframe-menjawab.png') });
  await frame.$$eval('[data-pilihan]', (els) => els[0].click());
  await frame.click('[data-kirim]');
  await frame.waitForSelector('.sr-ronde[data-fase="consequence"] [data-hasil]', { timeout: 20000 });
  await page.screenshot({ path: path.join(OUT, 'harness-iframe-konsekuensi.png') });
  check('satu babak dimainkan di dalam iframe (jawab -> konsekuensi pribadi)', true);
  check('tidak ada aset/API berprefiks yang gagal (404/5xx)', failed.length === 0, failed.join(' | '));
  // A parent page on an origin that is NOT allowed cannot frame the game (CSP frame-ancestors).
  const other = await browser.newPage();
  const blocked = [];
  other.on('console', (m) => {
    if (/frame-ancestors|Refused to frame/i.test(m.text())) blocked.push(m.text());
  });
  await other.goto(HARNESS.replace('127.0.0.1', 'localhost') + '/', { waitUntil: 'networkidle0' });
  await sleep(1500);
  const otherFrame = await (await other.$('#bingkai-game')).contentFrame();
  const rendered = otherFrame ? await otherFrame.$('.lp-join').catch(() => null) : null;
  check('origin lain (bukan FRAME_ANCESTORS) tidak bisa membingkai game', !rendered, blocked[0] ?? 'konten iframe kosong');
  await other.screenshot({ path: path.join(OUT, 'harness-origin-ditolak.png') });
} catch (err) {
  check('alur uji hosting selesai tanpa pengecualian', false, err.stack ?? err.message);
} finally {
  // Also after a failed step: the room is closed and nothing keeps the process alive.
  if (code) await rpc(host, 'host:close', { code });
  host?.close();
  await browser?.close();
}
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify({ harness: HARNESS, checks }, null, 2));
const bad = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - bad}/${checks.length} lulus`);
process.exitCode = bad ? 1 : 0;
