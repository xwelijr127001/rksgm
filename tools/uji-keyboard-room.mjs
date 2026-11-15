/**
 * UJI KEYBOARD — room cerita tanpa mouse/sentuh (brief §8: keyboard): kode di halaman awal, nama + centang pemberitahuan,
 * lalu menjawab dengan tombol panah + Enter. Room dibuka host lewat socket (bukan UI) dari skenario DEMO pertama yang
 * terbit, jadi tangkapan layarnya hanya berisi konten sintetis.
 * Server uji = build uji (client/dist-uji + server/dist-uji) dengan DB uji berisi identitas uji + demo terbit,
 * disiapkan seperti di kepala tools/uji-room-cerita.mjs. Bukan `npm run build`/`npm start` (client/dist bisa sedang
 * dilayani server lain, mis. server pemilik di port 4100) dan bukan data/raksa-game.db (DECISIONS D-35).
 *   UI_BASE=http://127.0.0.1:4820 RAKSA_KREDENSIAL=<uji>/dev-staff-credentials.json node tools/uji-keyboard-room.mjs
 * Env wajib : UI_BASE (server uji loopback; port di RAKSA_PORT_TERLARANG, bawaan "4100", ditolak: alat ini membuat
 *             room), RAKSA_KREDENSIAL (berisi "uji.host"; isinya tidak pernah dicetak).
 * Opsional  : RAKSA_SHOTS (bawaan docs/prd-v02/evidence/keyboard), RAKSA_CHROME (selalu headless), RAKSA_PORT_TERLARANG.
 * Kode keluar: 1 bila ada pemeriksaan GAGAL (galat di tengah alur dicatat GAGAL; room tetap ditutup dan hasil.json tetap
 * ditulis), 2 bila env tidak valid atau server uji tidak bisa dipakai (sebelum browser dibuka, tanpa menulis apa pun).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Invalid environment or unusable server: explain and stop with exit code 2 before the browser opens. */
function refuse(message) {
  console.error(message);
  process.exit(2);
}
function requiredEnv(name) {
  const value = (process.env[name] ?? '').trim();
  if (!value) refuse(`Env ${name} wajib diisi (lihat kepala tools/uji-keyboard-room.mjs).`);
  return value;
}
/** The server under test: loopback only, never a forbidden port (the owner's live server); this tool creates a room. */
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

const BASE = testServerBase(requiredEnv('UI_BASE'));
const HOST_PASSWORD = hostPassword(requiredEnv('RAKSA_KREDENSIAL'));
const OUT = path.resolve(process.env.RAKSA_SHOTS || path.join(REPO, 'docs/prd-v02/evidence/keyboard'));
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 200) });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${detail ? '  — ' + String(detail).slice(0, 120) : ''}`);
};
/** Emit with acknowledgement; none within `timeout` resolves `{ ok: false }` instead of waiting forever. */
const rpc = (socket, event, payload, timeout = 10000) => new Promise((resolve) => socket.timeout(timeout).emit(event, payload, (err, res) => resolve(err ? { ok: false, error: String(err) } : res)));

/** The host opens an auto-advancing room of the first published DEMO scenario over the socket, or the run is refused. */
async function openRoom() {
  try {
    const login = await (await fetch(`${BASE}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'uji.host', password: HOST_PASSWORD }) })).json();
    if (!login.ok) throw new Error(`login uji.host: ${login.error}`);
    const scenarios = (await (await fetch(`${BASE}/api/host/scenarios`, { headers: { authorization: `Bearer ${login.token}` } })).json()).scenarios ?? [];
    const demo = scenarios.find((s) => s.contentKind === 'demo');
    if (!demo) throw new Error('tidak ada skenario DEMO yang terbit (story:dev-setup --publish-demo)');
    const host = await new Promise((resolve, reject) => {
      const socket = ioClient(`${BASE}/story`, { auth: { staffToken: login.token }, transports: ['websocket'], forceNew: true, reconnection: false });
      socket.once('connect', () => resolve(socket));
      socket.once('connect_error', (err) => {
        socket.close();
        reject(err);
      });
    });
    const created = await rpc(host, 'host:create', { scenarioId: demo.scenarioId, autoAdvance: true });
    if (!created.ok) {
      host.close();
      throw new Error(`host:create ${created.code ?? ''} ${created.error ?? ''}`);
    }
    return { host, code: created.data.code };
  } catch (err) {
    refuse(`Server uji ${BASE} tidak bisa dipakai: ${err.message}${err.cause?.code ? ` (${err.cause.code})` : ''}`);
  }
}

const { host, code } = await openRoom();
let browser = null;
try {
  fs.mkdirSync(OUT, { recursive: true });
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: false, deviceScaleFactor: 1 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  // Tab from the top of the page until the room-code field has focus (no clicks anywhere).
  let reached = false;
  for (let i = 0; i < 12 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.classList.contains('lp-join-kode') ?? false);
  }
  check('Tab mencapai kolom kode Join Game', reached);
  await page.keyboard.type(code);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.sr-join-nama input.kolom', { timeout: 15000 });
  await page.focus('.sr-join-nama input.kolom');
  await page.keyboard.type('Pengguna Keyboard');
  await page.keyboard.press('Tab'); // -> consent checkbox
  await page.keyboard.press('Space');
  const consent = await page.evaluate(() => document.querySelector('.sr-setuju input')?.checked ?? false);
  check('pemberitahuan dicentang dengan Spasi', consent);
  await page.keyboard.press('Tab'); // -> "Masuk ke room"
  const onSubmit = await page.evaluate(() => document.activeElement?.getAttribute('type') === 'submit');
  check('Tab berikutnya ke tombol "Masuk ke room"', onSubmit);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.sr-lobi', { timeout: 15000 });
  check('masuk lobi tanpa mouse', true);
  const started = await rpc(host, 'host:start', { code });
  if (!started.ok) throw new Error(`host:start ${started.code ?? ''} ${started.error ?? ''}`);
  // Gameplay adaptation (docs/prd-v02/ARCHITECTURE.md §10, intended UI change): the options are cards with radio semantics
  // (`data-pilihan`, role=radio + aria-checked; no A–E letters, no native radio inputs) and one confirm button
  // (`data-kirim`, labelled by the activity, "Tetapkan pilihan" on the demo stage) instead of "Kunci jawaban". The
  // consequence appears inside the activity (`data-hasil`), not on a separate .sr-konsekuensi page.
  await page.waitForSelector('[data-pilihan]', { timeout: 60000 });
  await page.focus('[data-pilihan]'); // the group's single tab stop (first card while nothing is selected)
  await page.keyboard.press('ArrowDown'); // radio group: arrows move and select
  const selected = await page.evaluate(() => [...document.querySelectorAll('[data-pilihan]')].findIndex((c) => c.getAttribute('aria-checked') === 'true'));
  check('panah memilih opsi dalam grup radio', selected >= 0, `opsi ${selected}`);
  const focusVisible = await page.evaluate(() => {
    const el = document.activeElement;
    return !!el && el.hasAttribute('data-pilihan') && getComputedStyle(el).outlineStyle !== 'none';
  });
  check('fokus keyboard terlihat pada opsi', focusVisible);
  await page.screenshot({ path: path.join(OUT, 'keyboard-pilih-hp390.png') });
  await page.keyboard.press('Tab'); // single tab stop for the group -> confirm button
  const confirm = await page.evaluate(() => ({ on: document.activeElement?.hasAttribute('data-kirim') ?? false, label: document.activeElement?.textContent?.trim() ?? '' }));
  check('Tab berikutnya ke tombol konfirmasi jawaban', confirm.on, confirm.label);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.sr-ronde[data-fase="consequence"] [data-hasil]', { timeout: 20000 });
  check('jawaban terkirim dengan Enter dan konsekuensi tampil', true);
  await page.screenshot({ path: path.join(OUT, 'keyboard-konsekuensi-hp390.png') });
} catch (err) {
  check('alur keyboard selesai tanpa pengecualian', false, err.stack ?? err.message);
} finally {
  // Also after a failed step: the room is closed and nothing keeps the process alive.
  await rpc(host, 'host:close', { code });
  host.close();
  await browser?.close();
}
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify({ base: BASE, checks }, null, 2));
const bad = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - bad}/${checks.length} lulus`);
process.exitCode = bad ? 1 : 0;
