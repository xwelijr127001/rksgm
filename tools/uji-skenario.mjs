/**
 * UJI PENERIMAAN SKENARIO TERBIT (pengalaman bermain per kegiatan) — satu room cerita penuh di browser untuk SATU
 * skenario yang sudah terbit. Generik: alat ini TIDAK memuat teks skenario apa pun.
 *
 * Yang diharapkan diturunkan saat berjalan dari:
 *  - isi versi terbit yang diambil lewat API CMS dengan token reviewer (GET /api/cms/scenarios, /api/cms/scenarios/:id,
 *    /api/cms/versions/:id);
 *  - aturan bersama shared/story/*.ts dimuat lewat tsx (adegan publik & baris pribadi, berkas bersama, tanda & efek
 *    tertunda, kebijakan nilai, akhir, ringkasan, peringkat), dan kata antarmuka client/src/i18n/kamus/ruang.ts.
 * Halaman ruang dibaca HANYA lewat kait uji stabil docs/prd-v02/ARCHITECTURE.md §10 — data-fase, data-aktivitas, data-pilihan
 * (+ aria-checked), data-kirim, data-terkirim, data-berkas, data-lembar (+ data-lembar-gambar), data-hasil,
 * data-pengingat, data-timer, data-suasana, data-peringkat (kartu peringkat di layar babak saat fase leaderboard),
 * data-langkah (bilah tertambat sesudah babak ditutup: peringkat sendiri & langkah berikutnya) —
 * ditambah kelas lobi/peringkat/ringkasan akhir dan konsol host yang sudah ada. Isi dicocokkan sebagai teks (teks yang
 * diharapkan ada, urut, atau tidak ada), bukan lewat struktur CSS. Layar acara: teks TERLIHAT (innerText) karena berkas
 * tampil bergiliran satu per satu.
 * Skenario nyata berasal dari kasus nyata: tangkapan layar dan hasil.json WAJIB di LUAR repo (RAKSA_SHOTS; alat
 * menolak folder di dalam repo) dan alat ini membuat room, jadi hanya untuk server uji lokal dengan DB SALINAN.
 *
 * PRASYARAT: server uji terpisah (loopback) dari BUILD UJI terbaru dengan DB SALINAN, skenario sudah terbit,
 * STORY_MAX_PARTICIPANTS >= 6 (5 peserta browser + minimal 1 bot; sisa kursi diisi bot socket); Chrome lokal, selalu
 * headless lewat puppeteer; puppeteer-core, socket.io-client dan tsx di node_modules repo (tidak ditambahkan ke
 * dependensi proyek). Build uji di folder sendiri: JANGAN `npm run build`/`npm start` (menimpa / melayani client/dist +
 * server/dist, yang bisa sedang dilayani server lain, mis. server pemilik di port 4100) dan JANGAN data/raksa-game.db
 * (DECISIONS D-35). <salinan> = folder absolut di luar repo berisi salinan DB (API backup better-sqlite3), folder
 * aset-cerita/ dan dev-staff-credentials.json yang ikut disalin:
 *   (cd client && VITE_OUT_DIR=dist-uji npx vite build)
 *   npx tsc -p server/tsconfig.json --outDir server/dist-uji
 *   (cd server && PORT=4210 DB_FILE=<salinan>/raksa-game.db CLIENT_DIST=client/dist-uji STORY_MAX_PARTICIPANTS=10 \
 *     PUBLIC_BASE_URL=http://127.0.0.1:4210 node dist-uji/server/src/index.js)
 *
 *   UI_BASE=http://127.0.0.1:4210 RAKSA_KREDENSIAL=<salinan>/dev-staff-credentials.json SKENARIO="<awal judul>" \
 *     RAKSA_SHOTS=<folder di luar repo> node tools/uji-skenario.mjs [room] [rencana]
 * PowerShell: `$env:NAMA='nilai'` per variabel sebelum perintahnya.
 *
 * Env wajib : UI_BASE, RAKSA_KREDENSIAL (akun uji story:dev-setup: uji.host, uji.reviewer), SKENARIO, RAKSA_SHOTS.
 * Opsional  : RAKSA_CHROME; RAKSA_PORT_TERLARANG (bawaan "4100": port server pemilik, ditolak);
 *             RAKSA_WAKTU_HABIS (babak yang dibiarkan habis waktu oleh HP mendatar, mis. "6,7"; bawaan: babak kunci
 *             pertama tanpa tanda/efek + babak berikutnya dengan kegiatan lain);
 *             RAKSA_BABAK_GAMBAR (babak bertangkapan layar, mis. "1,4,8,11,12,14,15"; bawaan: babak 1, babak pertama
 *             tiap kegiatan, babak kunci/bertanda/berefek, babak pilihan terpanjang, babak terakhir);
 *             RAKSA_GAMBAR_GAGAL (id peserta yang permintaan gambarnya diblokir; bawaan "mendatar");
 *             RAKSA_BUKA_OTOMATIS (babak tempat host TIDAK membuka pilihan lebih awal, waktu baca bersama habis dan room
 *             membukanya; bawaan: babak 1 dan setiap babak ke-3);
 *             RAKSA_BATAS_BABAK (hanya untuk men-debug alat: berhenti sesudah babak N, host menutup room).
 *
 * Fase (bawaan: room):
 *   room     SATU room, host manual lewat konsol host di browser, semua babak. Peserta browser:
 *              360x740  HP     setiap pilihan yang meninggalkan tanda (mis. janji), dianjurkan di babak lain
 *              390x844  HP     jalur dianjurkan
 *              844x390  HP mendatar  campuran + 2 babak waktu habis; semua gambar diblokir (gambar gagal)
 *              1440x900 desktop  hanya keyboard (Tab/panah/Enter/Escape), prefers-reduced-motion
 *              1920x1080 desktop selalu berbeda dari jalur dianjurkan
 *            + bot socket sampai room penuh (satu bot mengirim ulang jawaban tiap babak), layar acara 1920x1080, konsol
 *            host. Per babak dan fase diperiksa: kegiatan = tata letak isi; kepala babak; baris (dan baris pribadi hanya
 *            bagi pemegang tanda); chat tanpa ilustrasi kedua; berkas dibuka (ketuk, klik, keyboard, penanda adegan
 *            >= 44 px, daftar saat gambar gagal), isi lembar, Escape/Tutup/latar mengembalikan fokus; lembar tidak
 *            mereset pilihan & timer; lima pilihan terbaca, tidak tertutup bilah, pilihan terakhir terjangkau dengan
 *            gulir singkat + isyarat; tanpa huruf A–E; satu timer; zoom 200% (CSS zoom & teks saja); muat ulang di
 *            tengah menjawab & sesudah terkirim; sambung ulang; kirim ulang ditolak & nilai tidak ganda; dua peserta
 *            berbeda keputusan melihat hasil masing-masing di babak yang sama; layar acara netral; tanda babak X ->
 *            efek babak Y sekali (pengingat & baris pribadi hanya bagi pemegang, juga di utas konsekuensi) dan catatan
 *            sebab-akibat di ringkasan; nilai = kebijakan aktif (server = mesin bersama); akhir = mesin; peringkat;
 *            {nama}; galat JS; permintaan gagal; luapan horizontal; payload (kunci jawaban & baris pribadi tidak bocor).
 *            Juga: tombol konfirmasi mengikuti bentuk pilihan terpilih (pesan -> label babak, tindakan di chat ->
 *            "Tetapkan tindakan"; diuji dua arah di babak chat yang punya tindakan); tindakan di chat tampil sebagai
 *            catatan "Kamu: …" sebelum DAN sesudah ditutup; kartu tanpa tanda bentuk; status hasil dengan tren di
 *            dalam pita; leaderboard = layar babak tetap (hasil, nilai babak, baris pribadi pemegang) + kartu
 *            peringkat ringkas; status publik selalu sebelum status pribadi (urutan frame) dan tanpa kilasan keadaan
 *            campuran / "tidak terdaftar" (perekam DOM); penanda adegan kecil dengan area ketuk >= 44 px, disembunyikan
 *            saat menjawab di HP mendatar pendek (daftar tetap); "Perbesar gambar"; layar acara: baris terbaru, tugas
 *            di kolom kanan, satu berkas bergiliran, hitung mundur baca, ukuran teks.
 *   rencana  hanya mencetak rencana jalur peserta, babak khusus dan akhir yang diprediksi (membaca API CMS server uji;
 *            tanpa browser, tanpa room).
 * Semua viewport = emulasi Chrome, bukan perangkat fisik; bot/browser bukan uji pengguna manusia.
 * Kode keluar: 1 bila ada pemeriksaan GAGAL, 2 bila argumen/env tidak valid (sebelum modul, browser atau room dimuat).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// ------------------------------------------------------------------ arguments & environment (checked before loading)

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHASE_NAMES = ['room', 'rencana'];
const REVIEWER = 'uji.reviewer';
const HOST_USER = 'uji.host';

/** Invalid arguments or environment: explain and stop with exit code 2 before modules, browser or room are loaded. */
function refuse(message) {
  console.error(message);
  process.exit(2);
}
function required(name) {
  const v = (process.env[name] ?? '').trim();
  if (!v) refuse(`Env ${name} wajib diisi (lihat kepala tools/uji-skenario.mjs).`);
  return v;
}
/** Test identity passwords from story:dev-setup; the file is never echoed (a parser message would quote it). */
function readCredentials(file) {
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    refuse(`RAKSA_KREDENSIAL tidak terbaca sebagai JSON (${file})${err.code ? `: ${err.code}` : ''}.`);
  }
  const missing = [REVIEWER, HOST_USER].filter((name) => typeof parsed?.[name] !== 'string');
  if (missing.length) refuse(`RAKSA_KREDENSIAL (${file}) bukan berkas akun uji story:dev-setup: tidak ada ${missing.join(', ')}.`);
  return parsed;
}
const ARGS = process.argv.slice(2);
const unknownPhases = ARGS.filter((a) => !PHASE_NAMES.includes(a));
if (unknownPhases.length) refuse(`Fase tidak dikenal: ${unknownPhases.join(', ')}. Pilihan: ${PHASE_NAMES.join(' ')}.`);
const PHASES = ARGS.length ? ARGS : ['room'];
const BASE = required('UI_BASE').replace(/\/+$/, '');
{
  let u = null;
  try {
    u = new URL(BASE);
  } catch {
    refuse(`UI_BASE bukan URL: ${BASE}`);
  }
  const port = u.port || (u.protocol === 'https:' ? '443' : '80');
  const forbidden = (process.env.RAKSA_PORT_TERLARANG ?? '4100').split(',').map((x) => x.trim()).filter(Boolean);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) refuse('UI_BASE harus server uji lokal (127.0.0.1/localhost): alat ini membuat room.');
  if (forbidden.includes(port)) refuse(`Port ${port} terlarang (RAKSA_PORT_TERLARANG): alat ini membuat room di server yang diuji.`);
}
const CRED = readCredentials(required('RAKSA_KREDENSIAL'));
const SKENARIO = required('SKENARIO');
const OUT = path.resolve(required('RAKSA_SHOTS'));
const relToRepo = path.relative(REPO, OUT);
if (relToRepo === '' || (!relToRepo.startsWith('..') && !path.isAbsolute(relToRepo))) refuse(`RAKSA_SHOTS (${OUT}) ada di dalam repo. Tangkapan layar skenario nyata harus disimpan di luar repo.`);
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STOP_AFTER = Number(process.env.RAKSA_BATAS_BABAK ?? '') || null;

// ------------------------------------------------------------------ repo modules

const require = createRequire(path.join(REPO, 'package.json'));
const puppeteer = require('puppeteer-core');
const { io: ioClient } = require('socket.io-client');
// Shared story rules and UI wording straight from the TypeScript sources, so expectations never drift from the app.
const tsx = require('tsx/cjs/api');
const load = (rel) => tsx.require(path.join(REPO, rel), import.meta.url);
const C = load('shared/story/content.ts');
const E = load('shared/story/engine.ts');
const S = load('shared/story/scene.ts');
const SU = load('shared/story/summary.ts');
const R = load('shared/story/ranking.ts');
const { STORY_SCORE_POLICY } = load('shared/story/scorePolicy.ts');
const K = load('client/src/i18n/kamus/ruang.ts').default.id;
const { LAYOUT_LABEL } = load('client/src/pages/cms/labels.ts');
fs.mkdirSync(OUT, { recursive: true });

const VP = {
  '360x740': { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  '390x844': { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  '844x390': { width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: true },
  '1440x900': { width: 1440, height: 900, deviceScaleFactor: 1 },
  '1920x1080': { width: 1920, height: 1080, deviceScaleFactor: 1 },
};
/** input: how the participant operates the page (touch taps, mouse clicks, or the keyboard only). */
const PLAYERS = [
  { id: 'hp360', vp: '360x740', name: 'Bayu Penanda', strategy: 'penanda', input: 'tap', plan: 'setiap pilihan yang meninggalkan tanda, dianjurkan di babak lain' },
  { id: 'hp390', vp: '390x844', name: 'Ayu Anjuran', strategy: 'anjuran', input: 'tap', plan: 'jalur dianjurkan' },
  { id: 'mendatar', vp: '844x390', name: 'Citra Mendatar', strategy: 'campur', input: 'tap', plan: 'campuran + 2 babak waktu habis' },
  { id: 'd1440', vp: '1440x900', name: 'Dewi Keyboard', strategy: 'siklus', input: 'keyboard', reducedMotion: true, plan: 'keliru/kurang tepat/dianjurkan bergiliran; hanya keyboard; gerak dikurangi' },
  { id: 'd1920', vp: '1920x1080', name: 'Eko Desktop', strategy: 'lain', input: 'mouse', plan: 'selalu berbeda dari jalur dianjurkan' },
];
const BLOCKED_IMAGES = (process.env.RAKSA_GAMBAR_GAGAL ?? 'mendatar').trim();
const BOTS = [
  { name: 'Bot Keliru', strategy: 'botKeliru', delay: [500, 1500] },
  { name: 'Bot Sedang', strategy: 'botSedang', delay: [800, 2200] },
  { name: 'Bot Penanda', strategy: 'botPenanda', delay: [600, 1800] },
  { name: 'Bot Ulang', strategy: 'anjuran', delay: [700, 1900], resubmit: true },
  { name: 'Bot Campur', strategy: 'botCampur', delay: [900, 2600] },
];

// ------------------------------------------------------------------ small helpers & checks

const checks = [];
const observations = [];
function check(name, ok, detail = '') {
  const d = typeof detail === 'string' ? detail : JSON.stringify(detail);
  checks.push({ name, ok: !!ok, detail: (d ?? '').slice(0, 2000) });
  console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${name}${d ? '  — ' + d.slice(0, 240) : ''}`);
}
const note = (o) => observations.push(o);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout, every = 150, what = 'kondisi') {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error(`waktu tunggu habis: ${what}`);
    await sleep(every);
  }
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
/** UI template substitution exactly like client/src/i18n t(): every `{key}` -> value. */
const fmt = (s, vars) => Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), String(s));
const idNum = (n) => Number(n).toLocaleString('id-ID');
/** client/src/story/view.ts signedNumber: "+4", "−12" (U+2212), "0". */
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `\u2212${Math.abs(n)}` : '0');
const personal = (text, name) => C.personalize(String(text ?? ''), name);
/** The longest literal part of a template around {nama}: what must never leak to a screen, whatever the name. */
const coreOf = (template) => template.split(C.PLAYER_NAME_TOKEN).map((x) => norm(x)).sort((a, b) => b.length - a.length)[0] ?? '';
const short = (s, n = 90) => (String(s).length > n ? String(s).slice(0, n) + '…' : String(s));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Regex source of a kamus template whose `{n}`-like numbers vary. */
const patternOf = (template, numberKeys) => numberKeys.reduce((src, k) => src.split(escRe(`{${k}}`)).join('(\\d+)'), escRe(template));
const pad = (n) => String(n).padStart(2, '0');
/** Seconds in an aria-label like "Sisa waktu menjawab 23 detik". */
const secondsOf = (label) => {
  const m = /(\d+)/.exec(label ?? '');
  return m ? Number(m[1]) : null;
};
/** Ordered containment: every needle in `hay`, each after the previous one; returns the missing/out-of-order ones. */
function orderIssues(hay, needles) {
  const out = [];
  let at = 0;
  needles.forEach((w, i) => {
    if (!w) return;
    const k = hay.indexOf(w, at);
    if (k < 0) out.push(hay.includes(w) ? `baris ${i + 1} di luar urutan: "${short(w, 50)}"` : `baris ${i + 1} tidak ada: "${short(w, 50)}"`);
    else at = k + w.length;
  });
  return out;
}

async function apiLogin(username) {
  const r = await fetch(`${BASE}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: CRED[username] }) });
  const j = await r.json();
  if (!j.ok) throw new Error(`login ${username}: ${j.error}`);
  return j.token;
}
async function api(method, url, token, body) {
  const r = await fetch(BASE + url, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: r.status, json };
}

// ------------------------------------------------------------------ scenario model (derived at run time)

let M = null;

/** Published version of the scenario whose title starts with SKENARIO, read through the CMS API (reviewer). */
async function loadScenario() {
  const tok = await apiLogin(REVIEWER);
  const list = (await api('GET', '/api/cms/scenarios', tok)).json?.scenarios ?? [];
  const sc = list.find((s) => s.title.startsWith(SKENARIO) && s.currentVersionNo !== null);
  if (!sc) throw new Error(`Tidak ada skenario terbit yang judulnya diawali "${SKENARIO}".`);
  const det = (await api('GET', `/api/cms/scenarios/${sc.id}`, tok)).json?.scenario;
  const ver = det?.versions?.find((v) => v.versionNo === sc.currentVersionNo);
  if (!ver) throw new Error('Versi terbit tidak ditemukan di detail skenario.');
  const got = (await api('GET', `/api/cms/versions/${ver.id}`, tok)).json;
  if (!got?.content) throw new Error('Isi versi terbit tidak bisa dibaca.');
  return buildModel({ scenarioId: sc.id, versionId: ver.id, versionNo: ver.versionNo, title: ver.title }, got.content);
}

function buildModel(meta, content) {
  const t = (key) => C.contentText(content, 'id', key);
  const k = C.textKey;
  const m = {
    ...meta,
    content,
    t,
    labels: S.scenarioMoodLabels(content, 'id'),
    rounds: content.rounds,
    count: content.rounds.length,
    customerName: t(k.customerName()) || K.customer,
    officerName: content.presentation.officerCharacterId ? t(k.officerName()) || null : null,
  };
  m.choiceText = (round, ch) => t(k.choiceText(round.id, ch.id));
  m.flagRounds = content.rounds.map((r, i) => (r.choices.some((c) => c.setsFlag) ? i + 1 : 0)).filter(Boolean);
  m.effectRounds = content.rounds.map((r, i) => (r.flagEffects.length || r.lines.some((l) => l.ifFlag) ? i + 1 : 0)).filter(Boolean);
  m.flags = [...new Set(content.rounds.flatMap((r) => r.choices.map((c) => c.setsFlag).filter(Boolean)))];
  m.flagLabel = (flag) => S.flagLabelOf(content, 'id', flag);
  // Templates with {nama} whose literal part is long enough to identify them on a page.
  m.tokenTemplates = Object.values(content.text.id ?? {}).filter((v) => typeof v === 'string' && v.includes(C.PLAYER_NAME_TOKEN) && coreOf(v).length >= 12);
  m.conditional = content.rounds.flatMap((r, i) => r.lines.filter((l) => l.ifFlag).map((l) => ({ round: i + 1, flag: l.ifFlag, template: t(k.line(r.id, l.id)) })));
  for (const c of m.conditional) c.core = coreOf(c.template);
  const longest = content.rounds.map((r) => Math.max(...r.choices.map((c) => m.choiceText(r, c).length)));
  m.longestOptionRound = longest.indexOf(Math.max(...longest)) + 1;
  m.longestOption = Math.max(...longest);
  // Every public text of the scenario (to tell a leaked private text from one that is public anyway).
  const publicKeys = Object.keys(content.text.id ?? {}).filter((key) => !/\.(choice|timeout)\./.test(key) && !/^flag\./.test(key) && !/\.lesson$/.test(key));
  const conditionalKeys = new Set(content.rounds.flatMap((r) => r.lines.filter((l) => l.ifFlag).map((l) => k.line(r.id, l.id))));
  m.publicText = publicKeys.filter((key) => !conditionalKeys.has(key)).map((key) => content.text.id[key]).join('\n');
  return m;
}

/** One participant's journey predicted with the SHARED engine from the answers actually recorded. */
class Track {
  constructor() {
    this.decisions = [];
    this.mood = E.clampMood(M.content.initialMood);
  }
  flags() {
    return E.flagsOf(M.rounds, this.decisions);
  }
  /** The round's start for this participant (delayed effects of flags held from EARLIER rounds included). */
  start(idx) {
    const flags = this.flags();
    const scene = S.participantSceneOf(M.content, idx, this.mood, flags, 'id');
    return { carried: this.mood, mood: scene.mood, band: scene.moodBand, delayedDelta: scene.delayedDelta, reminders: scene.flagReminders, variant: scene.moodVariantLine, flags };
  }
  settle(idx, choice, elapsedMs, windowMs = STORY_SCORE_POLICY.answerWindowMs) {
    const d = E.resolveDecision(M.rounds[idx], this.mood, choice, choice ? elapsedMs : null, windowMs, this.flags());
    this.decisions[idx] = d;
    this.mood = d.moodAfter;
    return d;
  }
  totals() {
    return E.totalsOf(this.decisions.filter(Boolean));
  }
  ending() {
    return E.selectEnding(M.content.endings, this.mood, this.totals().totalScore);
  }
}

/** The active score policy written out independently of the engine (checks server AND engine against it). */
function policyScore(accuracy, elapsedMs, windowMs) {
  if (elapsedMs === null) return { accuracyPoints: 0, speedPoints: 0, roundScore: 0 };
  const s = Math.min(Math.max(1 - elapsedMs / windowMs, 0), 1);
  const accuracyPoints = Math.round(STORY_SCORE_POLICY.accuracyMaxPoints * accuracy);
  const speedPoints = accuracy > 0 ? Math.round(STORY_SCORE_POLICY.speedMaxPoints * s) : 0;
  return { accuracyPoints, speedPoints, roundScore: accuracyPoints + speedPoints };
}

// ------------------------------------------------------------------ answer strategies (by classification, generic)

const recommended = (r) => E.recommendedChoices(r)[0] ?? r.choices[0];
const plain = (r) => r.choices.filter((c) => !c.setsFlag);
const firstOf = (r, cls) => plain(r).find((c) => c.classification === cls) ?? null;
const lightestWrong = (r) => plain(r).filter((c) => c.classification === 'keliru').sort((a, b) => b.moodDelta - a.moodDelta)[0] ?? null;
const heaviestWrong = (r) => plain(r).filter((c) => c.classification === 'keliru').sort((a, b) => a.moodDelta - b.moodDelta)[0] ?? null;
const worst = (r) => [...plain(r)].sort((a, b) => a.accuracy - b.accuracy || a.moodDelta - b.moodDelta)[0] ?? recommended(r);
const flagChoice = (r) => r.choices.find((c) => c.setsFlag) ?? null;
let TIMEOUTS = new Set();
/** (round, roundNumber) -> ChoiceContent, or null = let the round time out. */
const STRATEGIES = {
  anjuran: (r) => recommended(r),
  penanda: (r) => flagChoice(r) ?? recommended(r),
  campur: (r, n) => (TIMEOUTS.has(n) ? null : n % 2 ? recommended(r) : firstOf(r, 'kurang_tepat') ?? recommended(r)),
  siklus: (r, n) => (n % 3 === 1 ? heaviestWrong(r) : n % 3 === 2 ? firstOf(r, 'kurang_tepat') : null) ?? recommended(r),
  lain: (r, n) => (n % 2 ? firstOf(r, 'kurang_tepat') ?? lightestWrong(r) : lightestWrong(r) ?? firstOf(r, 'kurang_tepat')) ?? recommended(r),
  botKeliru: (r) => worst(r),
  botSedang: (r) => firstOf(r, 'kurang_tepat') ?? recommended(r),
  botPenanda: (r, n) => flagChoice(r) ?? (n % 2 ? firstOf(r, 'kurang_tepat') ?? recommended(r) : recommended(r)),
  botCampur: (r, n) => (TIMEOUTS.has(n) ? null : n % 2 ? recommended(r) : lightestWrong(r) ?? recommended(r)),
};

/** Rounds the landscape player lets time out: RAKSA_WAKTU_HABIS, else the first key round + the next round of another activity. */
function timeoutRounds() {
  const env = (process.env.RAKSA_WAKTU_HABIS ?? '').split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= M.count);
  if (env.length) return new Set(env);
  const avoid = new Set([1, ...M.effectRounds, ...M.flagRounds]);
  const ok = (i) => !avoid.has(i + 1);
  const key = M.rounds.findIndex((r, i) => r.keyRound && ok(i));
  const other = M.rounds.findIndex((r, i) => i > key && ok(i) && r.layout !== M.rounds[key]?.layout);
  const picks = [key, other].filter((i) => i >= 0).map((i) => i + 1);
  for (let n = 2; picks.length < 2 && n <= M.count; n++) if (ok(n - 1) && !picks.includes(n)) picks.push(n);
  return new Set(picks);
}

/**
 * Rounds of the special device tests, chosen from the content (first round of an activity with shared evidence that
 * neither sets nor receives a flag nor is a planned timeout): who runs which test where.
 */
function specialsPlan() {
  const avoid = new Set([1, ...M.flagRounds, ...M.effectRounds, ...TIMEOUTS]);
  const firstWith = (layout) => {
    const i = M.rounds.findIndex((r, j) => r.layout === layout && r.evidence.length > 0 && !avoid.has(j + 1));
    return i >= 0 ? i + 1 : null;
  };
  const any = (skip = []) => {
    for (let n = 2; n <= M.count; n++) if (!avoid.has(n) && !skip.includes(n)) return n;
    return 2;
  };
  const sheetState = [...new Set(['chat', 'dossier', 'field'].map(firstWith).filter(Boolean))].sort((a, b) => a - b);
  const reconnect = firstWith('chat') ?? any();
  const reloadSent = firstWith('field') ?? any([reconnect]);
  const reloadSelect = firstWith('dossier') ?? any([reconnect, reloadSent]);
  const effect = M.effectRounds[M.effectRounds.length - 1] ?? null;
  return {
    sheetState: { rounds: sheetState, who: ['hp390', 'd1440'], what: 'pilihan & timer tetap saat lembar berkas dibuka/ditutup' },
    reloadSelect: { round: reloadSelect, who: 'hp390', what: 'muat ulang di tengah menjawab memulihkan pilihan (urutan tetap)' },
    reloadSent: { round: reloadSent, who: 'hp360', what: 'muat ulang sesudah terkirim menampilkan keadaan terkirim + kirim ulang lewat socket ditolak' },
    reconnect: { round: reconnect, who: 'd1920', what: 'koneksi putus & sambung ulang mempertahankan fase dan keputusan' },
    zoomPage: { round: M.longestOptionRound, who: 'd1440', what: 'zoom halaman 200% (CSS zoom)' },
    zoomText: { round: effect && effect !== M.longestOptionRound ? effect : M.longestOptionRound, who: 'hp390', what: 'teks 200% (ukuran huruf saja)' },
  };
}
let SPECIAL = null;
const special = (key, p, n) => {
  const s = SPECIAL?.[key];
  if (!s) return false;
  const who = Array.isArray(s.who) ? s.who.includes(p.id) : s.who === p.id;
  return who && (s.rounds ? s.rounds.includes(n) : s.round === n);
};

/**
 * Rounds in which the host does NOT open the options early: the shared reading time runs out and the room opens them
 * for everybody (RAKSA_BUKA_OTOMATIS, else round 1 and every third round).
 */
function autoOpenRounds() {
  const env = (process.env.RAKSA_BUKA_OTOMATIS ?? '').split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= M.count);
  if (env.length) return new Set(env);
  return new Set(M.rounds.map((_, i) => i + 1).filter((n) => n === 1 || n % 3 === 0));
}

/** Screenshot rounds: RAKSA_BABAK_GAMBAR, else round 1, the first of each activity, key/flag/effect rounds, longest options, last. */
function shotRounds() {
  const env = (process.env.RAKSA_BABAK_GAMBAR ?? '').split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= M.count);
  if (env.length) return new Set(env);
  const firstOfLayout = [...new Set(M.rounds.map((r) => r.layout))].map((l) => M.rounds.findIndex((r) => r.layout === l) + 1);
  const keys = M.rounds.map((r, i) => (r.keyRound ? i + 1 : 0)).filter(Boolean);
  return new Set([1, ...firstOfLayout, ...keys, ...M.flagRounds, ...M.effectRounds, M.longestOptionRound, M.count]);
}

function planSummary() {
  return [...PLAYERS, ...BOTS].map((p) => {
    const tr = new Track();
    const picks = [];
    M.rounds.forEach((r, i) => {
      const ch = STRATEGIES[p.strategy](r, i + 1);
      picks.push(ch ? `${ch.id}:${ch.classification}${ch.setsFlag ? '+' + ch.setsFlag : ''}` : 'waktu_habis');
      tr.settle(i, ch, 10_000);
    });
    const end = tr.ending();
    return { siapa: p.name, strategi: p.strategy, akhir: end.id, jenis: end.kind, statusAkhir: tr.mood, nilaiDetik10: tr.totals().totalScore, pilihan: picks.join(' ') };
  });
}

// ------------------------------------------------------------------ expectations (shared rules + UI wording)

/** Status word of a band: the scenario's own words, else the default words (like ui/badges moodLabel). */
const wordFor = (band, name) => personal(M.labels ? M.labels[band] : K[`mood.${band}`], name);
/** client/src/story/round/notes.ts wording. */
function causeOf(label, fromRound) {
  if (label) return fromRound > 0 ? fmt(K.dampakSebab, { label, n: fromRound }) : fmt(K.dampakSebabTanpaBabak, { label });
  return fromRound > 0 ? fmt(K.dampakSebabBabak, { n: fromRound }) : K.dampakSebabUmum;
}
const reminderText = (r) => (r.delta ? fmt(K.pengingatIsi, { sebab: causeOf(r.label, r.fromRound), d: signed(r.delta) }) : fmt(K.pengingatTanpaAngka, { sebab: causeOf(r.label, r.fromRound) }));
/** notes.ts reminderLine: the one-line reminder under the round's question. */
const reminderLineText = (r) => (r.delta ? fmt(K.pengingatRingkas, { sebab: causeOf(r.label, r.fromRound), d: signed(r.delta) }) : fmt(K.pengingatTanpaAngka, { sebab: causeOf(r.label, r.fromRound) }));
const delayedText = (e) => (e.delta ? fmt(K.dampakAwal, { sebab: causeOf(e.label, e.fromRound), d: signed(e.delta) }) : fmt(K.dampakAwalNol, { sebab: causeOf(e.label, e.fromRound) }));
function causalText(c) {
  const sebab = causeOf(c.label, c.setRound);
  if (c.effectRound === null) return fmt(K.jejakBelum, { sebab });
  if (c.delta === null || c.delta === 0) return fmt(K.jejakBaris, { sebab, m: c.effectRound });
  return fmt(K.jejakDampak, { sebab, m: c.effectRound, d: signed(c.delta) });
}
const markWord = (kind, mark) => (mark === 'none' ? null : K[`tanda.${C.EVIDENCE_ROW_KINDS.includes(kind) ? kind : 'checklist'}.${mark}`]);
/** The word above an evidence title (evidenceParts evidenceLabel): the author's kicker, else the kind's word. */
const evidenceWord = (ev) => norm(ev.kicker ?? '') || K[`jenis.${ev.kind}`];
/**
 * The confirm label for the selected option (docs/prd-v02/ARCHITECTURE.md §10, written out here independently of
 * roundModel.confirmLabelOf): in a chat an option that is an action without a message is confirmed as "Tetapkan
 * tindakan"; a message, no selection yet, or any other activity keeps the round's label.
 */
const confirmLabelFor = (layout, roundLabel, form) => (layout === 'chat' && form === 'action' ? K['aksi.tindakan'] : roundLabel);
/** OutcomeBlock StatusLine: another band ("Cemas → Tenang"), a trend within the band ("Cemas, sedikit membaik"), or unchanged. */
function statusLineOf(v, name) {
  if (v.bandBefore !== v.bandAfter) return norm(fmt(K.statusBerubah, { dari: wordFor(v.bandBefore, name), ke: wordFor(v.bandAfter, name) }));
  if (v.moodAfter !== v.moodBefore) return norm(fmt(v.moodAfter > v.moodBefore ? K.statusMembaik : K.statusMenurun, { kata: wordFor(v.bandAfter, name) }));
  return norm(fmt(K.statusTetap, { kata: wordFor(v.bandAfter, name) }));
}
/** The words every delayed-effect note of an outcome starts with ("Dampak tertunda —"). */
const DAMPAK_PREFIX = norm(K.dampakAwal.split('{')[0]);
/** The compact ranking card of a participant's leaderboard (RoundScreen RankingCard, RankList limit 3): the top three, then the own row when it is not among them. */
function compactRanking(expected, name) {
  const top = expected.slice(0, 3);
  const mine = expected.find((r) => r.name === name);
  return mine && !top.includes(mine) ? [...top, mine] : top;
}
/** StoryProjector.tsx: the big screen shows the round's newest lines (SHOWN_LINES) and one evidence item per turn. */
const PROJECTOR_LINES = 3;
/**
 * The projector's evidence turn (roundModel.evidenceTurnMs, written out here independently): the shared reading time
 * divided among the items, kept between 6 and 10 s; 10 s for one item or an unknown reading time.
 */
const projectorTurnMs = (count, readingMs) => (count < 2 || !(readingMs > 0) ? 10_000 : Math.min(10_000, Math.max(6_000, Math.floor(readingMs / count))));
/** Projector text smaller than this (px) counts as too small to read from the back of a room (earlier review measure). */
const PROJECTOR_MIN_FONT = 24;

/** client/src/story/view.ts personalizeScene. */
function personalScene(scene, name) {
  const p = (x) => personal(x, name);
  const line = (l) => ({ ...l, name: l.name === null ? null : p(l.name), text: p(l.text) });
  return {
    ...scene,
    title: p(scene.title),
    meta: p(scene.meta),
    prompt: p(scene.prompt),
    intro: scene.intro.map(line),
    lines: scene.lines.map(line),
    action: p(scene.action),
    evidence: scene.evidence.map((e) => ({ ...e, kicker: p(e.kicker ?? ''), title: p(e.title), body: p(e.body), rows: e.rows.map((r) => ({ ...r, label: p(r.label), value: p(r.value) })) })),
    respondent: scene.respondent ? { ...scene.respondent, name: scene.respondent.name === null ? null : p(scene.respondent.name) } : null,
    lesson: p(scene.lesson),
  };
}

/**
 * What one viewer should see in round `idx`: the public scene personalized with `name`, the viewer's private status
 * line of the round's start (`variant`, shown first) and own conditional lines merged in authored order (shared
 * screens: neither).
 */
function sceneExpect(idx, name, flags, phase = 'scene', variant = null) {
  const pub = personalScene(S.scenePublicOf(M.content, idx, 'id', phase), name);
  const own = flags && flags.size ? S.flagLinesOf(M.content, idx, flags, 'id').map((l) => ({ ...l, name: l.name === null ? null : personal(l.name, name), text: personal(l.text, name) })) : [];
  const merged = S.mergeSceneLines(pub.lines, own).map((l) => ({ ...l, conditional: own.includes(l) }));
  const lines = variant ? [{ id: 'suasana', speaker: 'narrator', name: null, text: personal(variant, name), conditional: false }, ...merged] : merged;
  return { ...pub, lines, all: [...pub.intro, ...lines], actionLabel: pub.action.trim() || K[`aksi.${pub.layout}`] };
}

/** The participant's outcome block of decision `d` (shared consequence builder + the OutcomeBlock wording). */
function outcomeExpect(idx, d, flagsBefore, name) {
  const v = SU.consequenceViewOf(M.content, idx, d, 'id', flagsBefore);
  const p = (x) => norm(personal(x, name));
  const layout = M.rounds[idx].layout;
  const delayed = v.delayed.filter((e) => e.delta !== 0).map((e) => norm(delayedText({ ...e, label: personal(e.label, name) })));
  // The own turn as the outcome shows it, from the content's form of the chosen option (not from the server's view):
  // in a chat a message is the own bubble ("… ✓✓ Terkirim"), an action a note ("Kamu: …"); elsewhere "Pilihanmu …".
  const chosenText = v.chosenText !== null ? p(v.chosenText) : null;
  const form = d.choiceId ? (M.rounds[idx].choices.find((c) => c.id === d.choiceId)?.form ?? 'message') : null;
  const ownTurn = chosenText === null ? null : layout === 'chat' ? (form === 'action' ? norm(fmt(K.terkirimTindakan, { teks: chosenText })) : norm(`${chosenText}✓✓ ${K.terkirim}`)) : norm(`${K.pilihanmu} ${chosenText}`);
  return {
    view: v,
    form,
    ownTurn,
    ownTurnNot: layout === 'chat' && form === 'action' && chosenText !== null ? norm(`${chosenText}✓✓`) : null,
    chosen: chosenText ?? (layout === 'chat' ? K.tidakSempat : K.tanpaJawaban),
    reply: v.reply ? p(v.reply) : null,
    consequence: v.consequence ? p(v.consequence) : null,
    badge: K[`hasil.${v.outcome}`],
    status: statusLineOf(v, name),
    delayed: delayed.length ? delayed : v.delayedDelta ? [norm(fmt(K.dampakTertunda, { n: signed(v.delayedDelta) }))] : [],
    explanationLabel: v.lesson ? (M.officerName ? fmt(K.pelajaranDari, { nama: personal(M.officerName, name) }) : K.pelajaran) : v.reason ? K.alasan : null,
    explanation: v.lesson ? p(v.lesson) : v.reason ? p(v.reason) : null,
    recommended: v.outcome !== 'tepat' ? v.recommended.map((r) => p(r.text)) : [],
    score: norm(fmt(K.nilaiRingkas, { total: idNum(v.score.roundScore), akurasi: idNum(v.score.accuracyPoints), kecepatan: idNum(v.score.speedPoints) })),
  };
}

function outcomeIssues(text, e) {
  const out = [];
  const need = (label, s) => {
    if (s && !text.includes(s)) out.push(`${label} "${short(s, 50)}" tidak ada`);
  };
  need('pilihan', e.chosen);
  need(e.form === 'action' ? 'catatan tindakan "Kamu: …"' : 'giliran sendiri', e.ownTurn);
  if (e.ownTurnNot && text.includes(e.ownTurnNot)) out.push('tindakan tampil sebagai gelembung terkirim (✓✓)');
  need('balasan', e.reply);
  need('akibat', e.consequence);
  need('hasil', e.badge);
  need('status', e.status);
  e.delayed.forEach((x) => need('dampak tertunda', x));
  need('label pelajaran', e.explanationLabel);
  need('pelajaran', e.explanation);
  e.recommended.forEach((x) => need('dianjurkan', x));
  if (e.view.outcome === 'tepat' && text.includes(K.dianjurkan)) out.push('daftar "dianjurkan" tampil untuk pilihan tepat');
  return out;
}

const moodNameFor = (name) => fmt(K.statusNama, { nama: personal(M.customerName, name) });
const chosenOf = (round, cv) => (cv?.chosenText ? round.choices.find((c) => M.choiceText(round, c) === cv.chosenText) ?? null : null);

/** Ranking rows every screen should show now, from the shared ranking rule over the predicted totals. */
function expectedRanking(everyone) {
  return R.rankParticipants(
    everyone.map((p) => {
      const t = p.track.totals();
      return { participantId: p.pid ?? p.name, name: p.name, totalScore: t.totalScore, accuracyPoints: t.accuracyPoints, totalElapsedMs: t.totalElapsedMs };
    }),
  );
}
function rankingIssues(rows, expected, limit = 10) {
  const want = expected.slice(0, limit).map((r) => `${r.rank}|${r.name}|${idNum(r.totalScore)}`);
  const got = rows.map((r) => `${r.no}|${r.name}|${r.pts}`);
  return JSON.stringify(want) === JSON.stringify(got) ? [] : [`tampil ${got.join(', ')} ≠ ${want.join(', ')}`];
}

// ------------------------------------------------------------------ page-side helpers (injected before any page script)

/**
 * Installed with evaluateOnNewDocument (survives reloads): readers that use ONLY the stable test hooks, geometry
 * (what covers what, what is on screen), and the WebSocket registry the reconnect test closes. Self-contained: it is
 * serialized into the page.
 */
function pageHelpers(cfg = {}) {
  try {
    const Native = window.WebSocket;
    const sockets = [];
    window.WebSocket = class extends Native {
      constructor(...args) {
        super(...args);
        sockets.push(this);
      }
    };
    Object.defineProperty(window, '__ujiSockets', { value: sockets });
  } catch {
    /* no WebSocket registry: the reconnect test reports it */
  }
  const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const shown = (el) => {
    if (!el || !el.isConnected) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  /** textContent without <script>/<style> and (unless asked) without <dialog> subtrees. */
  const text = (root, dialogs = false) => {
    if (!root) return '';
    let out = '';
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.data;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || (!dialogs && tag === 'DIALOG')) return;
      for (const c of node.childNodes) walk(c);
    };
    walk(root);
    return n(out);
  };
  const stickyAncestor = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === 'sticky' || p === 'fixed') return e;
    }
    return null;
  };
  /**
   * Timeline of what the round screen shows (phase, round, outcome, options, loading notes, status chip, forbidden
   * texts), reported to the tool on every change through the binding `__ujiCatat` (exposed by the tool, survives
   * reloads): a mixed state between two snapshots is caught even when it lasts a single render.
   */
  if (cfg.timeline) {
    const queue = [];
    let last = '';
    const forbidden = (cfg.forbidden ?? []).map((s) => s.toLowerCase());
    const babakRe = cfg.babakRe ? new RegExp(cfg.babakRe) : null;
    const record = () => {
      const root = document.querySelector('[data-fase]');
      const txt = root ? n(root.textContent) : '';
      const m = babakRe ? babakRe.exec(txt) : null;
      const all = document.body ? n(document.body.textContent).toLowerCase() : '';
      const sig = {
        fase: root ? root.dataset.fase : null,
        babak: m ? Number(m[1]) : null,
        hasil: !!root?.querySelector('[data-hasil]'),
        opsi: root ? root.querySelectorAll('[data-pilihan]').length : 0,
        kirim: !!root?.querySelector('[data-kirim]'),
        terkirim: !!root?.querySelector('[data-terkirim]'),
        suasana: root?.querySelector('[data-suasana]')?.dataset.suasana ?? null,
        peringkat: !!root?.querySelector('[data-peringkat]'),
        memuatPilihan: !!cfg.pilihanSegera && txt.includes(cfg.pilihanSegera),
        memuatHasil: !!cfg.hasilMemuat && txt.includes(cfg.hasilMemuat),
        ringkasan: !!document.querySelector('main.sr-hasil-akhir'),
        terlarang: forbidden.filter((f) => all.includes(f)),
      };
      const key = JSON.stringify(sig);
      if (key === last) return;
      last = key;
      queue.push({ t: Date.now(), ...sig });
      if (typeof window.__ujiCatat === 'function') while (queue.length) void window.__ujiCatat(JSON.stringify(queue.shift()));
    };
    new MutationObserver(record).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-fase'] });
  }
  /**
   * Things that stay on screen while the page scrolls: sticky/fixed elements (`sticky: true`, e.g. the decision bar)
   * and their absolutely placed parts that may stick out of them (`sticky: false`, e.g. a cue above the bar).
   */
  const occluders = (target) => {
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      const pos = getComputedStyle(el).position;
      if (pos !== 'sticky' && pos !== 'fixed') continue;
      if (!shown(el) || el.contains(target) || el.tagName === 'DIALOG') continue;
      out.push({ el, sticky: true });
      for (const d of el.querySelectorAll('*')) if (getComputedStyle(d).position === 'absolute' && shown(d) && !d.contains(target)) out.push({ el: d, sticky: false });
    }
    return out;
  };
  const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  /** Line boxes of the visible text inside `el`. */
  const textRects = (el) => {
    const out = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (!n(t.data)) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      for (const q of range.getClientRects()) if (q.width > 0 && q.height > 0) out.push(q);
    }
    return out;
  };
  /**
   * Is `el` entirely on screen; how much of it lies under a sticky/fixed bar (`barCovered`), how much of its TEXT lies
   * under anything that stays on screen (`textCovered`); does a tap on its centre reach it.
   */
  const coverage = (el) => {
    const r = el.getBoundingClientRect();
    const texts = textRects(el);
    let covered = 0;
    let barCovered = 0;
    let textCovered = 0;
    const by = [];
    for (const o of occluders(el)) {
      const q = o.el.getBoundingClientRect();
      const a = overlap(r, q);
      if (a <= 1) continue;
      const ta = texts.reduce((s, t) => s + overlap(t, q), 0);
      covered += a;
      if (o.sticky) barCovered += a;
      textCovered += ta;
      by.push(`${String(o.el.className || o.el.tagName).split(' ')[0]}${ta > 1 ? '(teks)' : ''}`);
    }
    const c = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      inView: r.top >= -0.5 && r.bottom <= window.innerHeight + 0.5 && r.left >= -0.5 && r.right <= window.innerWidth + 0.5,
      covered: Math.round(covered),
      barCovered: Math.round(barCovered),
      textCovered: Math.round(textCovered),
      by: [...new Set(by)].slice(0, 3),
      centerHit: !!c && (c === el || el.contains(c)),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      height: Math.round(r.height),
    };
  };
  const fontOf = (el) => {
    let best = null;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) if (n(t.data) && (!best || n(t.data).length > n(best.data).length)) best = t;
    return best?.parentElement ? parseFloat(getComputedStyle(best.parentElement).fontSize) : 0;
  };
  const options = (root) =>
    [...(root ?? document).querySelectorAll('[data-pilihan]')].map((o) => {
      const parts = [];
      const tw = document.createTreeWalker(o, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) if (n(t.data)) parts.push(n(t.data));
      return {
        handle: o.dataset.pilihan,
        role: o.getAttribute('role'),
        checked: o.getAttribute('aria-checked'),
        text: n(o.textContent),
        letters: parts.filter((x) => /^[A-E][.):]?$/.test(x)),
        disabled: !!o.disabled,
        fontSize: fontOf(o),
        height: Math.round(o.getBoundingClientRect().height),
        clipped: o.scrollWidth > o.clientWidth + 1 || o.scrollHeight > o.clientHeight + 1,
      };
    });
  /**
   * Large pictures (>= 120x80) outside sheets: img/canvas/video/svg/iframe and CSS background images. `evidenceAlts` =
   * titles of the round's evidence: their pictures shown open on a shared screen are evidence, not an illustration.
   */
  const largeMedia = (root, evidenceAlts = []) => {
    const out = [];
    for (const el of root.querySelectorAll('*')) {
      if (el.closest('dialog') || !shown(el)) continue;
      if (el.tagName === 'IMG' && evidenceAlts.includes(n(el.getAttribute('alt')))) continue;
      const tag = el.tagName.toLowerCase();
      const media = ['img', 'canvas', 'video', 'svg', 'iframe', 'object', 'picture'].includes(tag);
      const bg = getComputedStyle(el).backgroundImage;
      if (!media && !(bg && bg !== 'none' && bg.includes('url('))) continue;
      const r = el.getBoundingClientRect();
      if (r.width >= 120 && r.height >= 80) out.push(`${media ? tag : 'latar ' + tag} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  };
  /** The round screen (participant room or projector) as seen through the stable hooks. */
  const round = (evidenceAlts = []) => {
    const root = document.querySelector('[data-fase]');
    if (!root) return null;
    const act = root.querySelector('[data-aktivitas]');
    const timers = [...document.querySelectorAll('[data-timer]')];
    const hasil = root.querySelector('[data-hasil]');
    const suasana = root.querySelector('[data-suasana]');
    const kirim = root.querySelector('[data-kirim]');
    const terkirim = root.querySelector('[data-terkirim]');
    const sheet = document.querySelector('[data-lembar]');
    return {
      fase: root.dataset.fase,
      aktivitas: act ? act.dataset.aktivitas : null,
      rootText: text(root),
      actText: act ? text(act) : '',
      pageText: text(document.body),
      openers: [...root.querySelectorAll('[data-berkas]')].map((b) => {
        const r = b.getBoundingClientRect();
        const marker = b.getAttribute('aria-hidden') === 'true';
        // A scene marker's tap area: the pin plus an absolutely placed ::before around it (a small pin, a 44 px target).
        let hitW = r.width;
        let hitH = r.height;
        let edgeHit = null;
        if (marker) {
          const ps = getComputedStyle(b, '::before');
          if (ps.content !== 'none' && ps.position === 'absolute') {
            const px = (x) => parseFloat(x) || 0;
            hitW = r.width - px(ps.left) - px(ps.right);
            hitH = r.height - px(ps.top) - px(ps.bottom);
          }
          // A tap just inside the tap area but outside the pin must still reach the marker.
          const x = r.left + r.width / 2 + Math.max(0, hitW / 2 - 3);
          const y = r.top + r.height / 2;
          if (shown(b) && x >= 0 && x < window.innerWidth && y >= 0 && y < window.innerHeight) {
            const h = document.elementFromPoint(x, y);
            edgeHit = !!h && (h === b || b.contains(h));
          }
        }
        return { id: b.dataset.berkas, marker, w: Math.round(r.width), h: Math.round(r.height), hitW: Math.round(hitW), hitH: Math.round(hitH), edgeHit, shown: shown(b) };
      }),
      options: options(root),
      kirim: kirim ? { text: n(kirim.textContent), disabled: !!kirim.disabled, shown: shown(kirim) } : null,
      terkirim: terkirim ? text(terkirim) : null,
      hasil: hasil ? { text: text(hasil), inActivity: !!act && act.contains(hasil) } : null,
      pengingat: [...root.querySelectorAll('[data-pengingat]')].map((x) => text(x)),
      suasana: suasana ? { band: suasana.dataset.suasana, text: text(suasana) } : null,
      timers: timers.length,
      timersShown: timers.filter(shown).length,
      timerLabel: timers[0]?.getAttribute('aria-label') ?? null,
      timerText: timers[0] ? n(timers[0].textContent) : null,
      roleTimers: [...document.querySelectorAll('[role="timer"]')].filter((t) => shown(t) && !t.closest('dialog')).length,
      sheet: sheet ? sheet.dataset.lembar : null,
      media: largeMedia(root, evidenceAlts),
      scrollY: Math.round(window.scrollY),
    };
  };
  const sheet = (closeWord) => {
    const d = document.querySelector('dialog[data-lembar]');
    if (!d) return null;
    const imgs = [...d.querySelectorAll('img')];
    let modal = false;
    try {
      modal = d.matches(':modal');
    } catch {
      /* old browser */
    }
    return {
      id: d.dataset.lembar,
      open: d.open,
      modal,
      text: text(d, true),
      imgs: imgs.length,
      imgOk: imgs.some((i) => i.complete && i.naturalWidth > 0),
      focusInside: d.contains(document.activeElement),
      closeButton: [...d.querySelectorAll('button')].some((b) => n(b.textContent).includes(closeWord)),
      timers: d.querySelectorAll('[role="timer"]').length,
      dataTimers: d.querySelectorAll('[data-timer]').length,
    };
  };
  const active = () => {
    const a = document.activeElement;
    return { berkas: a?.dataset?.berkas ?? null, pilihan: a?.dataset?.pilihan ?? null, kirim: !!a?.matches?.('[data-kirim]'), inDialog: !!a?.closest?.('dialog'), tag: a ? a.tagName.toLowerCase() : null };
  };
  /** Wait until the page stops scrolling (the app scrolls the decision into view, smoothly unless motion is reduced). */
  const settle = async () => {
    let y = window.scrollY;
    let still = 0;
    for (let i = 0; i < 30 && still < 3; i++) {
      await wait(90);
      if (window.scrollY === y) still++;
      else {
        still = 0;
        y = window.scrollY;
      }
    }
    return Math.round(window.scrollY);
  };
  /**
   * The five options on the screen as the app left it, then each option brought into view like the focus handler does
   * (block 'nearest', scroll margins clear the sticky bar), then the last option in view (the page stays there).
   */
  const measureOptions = async (cueSrc, prompt = '') => {
    const root = document.querySelector('[data-fase]');
    const opts = root ? [...root.querySelectorAll('[data-pilihan]')] : [];
    const kirim = root?.querySelector('[data-kirim]');
    if (!opts.length || !kirim) return { missing: true, count: opts.length };
    const cueRe = new RegExp(cueSrc);
    const dock = stickyAncestor(kirim);
    const cue = () => {
      let best = null;
      for (const el of (dock ?? root).querySelectorAll('*')) if (cueRe.test(n(el.textContent))) best = el;
      if (!best || !shown(best)) return null;
      return { n: Number(cueRe.exec(n(best.textContent))[1]), box: box(best), inBar: !!dock && dock.contains(best) };
    };
    const vh = window.innerHeight;
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const dockHeight = dock ? Math.round(dock.getBoundingClientRect().height) : 0;
    const last = opts[opts.length - 1];
    // The decision area as the app brings it into view: the round's question (the last element reading exactly the
    // prompt before the first option) down to the last option; it "fits" when it fits between the top and the bar.
    let promptEl = null;
    if (prompt) for (const el of root.querySelectorAll('h1, h2, h3, p')) if (n(el.textContent) === prompt && el.compareDocumentPosition(opts[0]) & Node.DOCUMENT_POSITION_FOLLOWING) promptEl = el;
    const areaTop = (promptEl ?? opts[0]).getBoundingClientRect().top;
    const areaBottom = last.getBoundingClientRect().bottom;
    const usable = Math.min(vh, dockTop) - 16;
    const area = { top: Math.round(areaTop), bottom: Math.round(areaBottom), height: Math.round(areaBottom - areaTop), usable: Math.round(usable), fits: areaBottom - areaTop <= usable, prompt: !!promptEl };
    const start = { y: Math.round(window.scrollY), cue: cue(), kirim: coverage(kirim), options: opts.map(coverage), area };
    const scrollNeeded = Math.max(0, Math.round(last.getBoundingClientRect().bottom - dockTop + 1));
    const each = [];
    for (const o of opts) {
      o.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      await wait(70);
      each.push({ ...coverage(o), y: Math.round(window.scrollY) });
    }
    last.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    await wait(150);
    const atLast = { y: Math.round(window.scrollY), kirim: coverage(kirim), last: coverage(last), cue: cue() };
    return { count: opts.length, vh, dockHeight, sticky: !!dock, start, scrollNeeded, screen: vh - dockHeight, each, atLast };
  };
  /** At the very bottom of the page the last option must not lie under the sticky bar (padding = bar height). */
  const bottomCheck = async () => {
    const root = document.querySelector('[data-fase]');
    const opts = [...root.querySelectorAll('[data-pilihan]')];
    window.scrollTo(0, document.scrollingElement.scrollHeight);
    await wait(150);
    const kirim = root.querySelector('[data-kirim]');
    return { last: opts.length ? coverage(opts[opts.length - 1]) : null, kirim: kirim ? coverage(kirim) : null };
  };
  /** Under 200% zoom: every option readable (brought into view, not covered, not clipped), the send button reachable, no sideways scroll. */
  const zoomCheck = async () => {
    const root = document.querySelector('[data-fase]');
    const opts = [...root.querySelectorAll('[data-pilihan]')];
    const kirim = root.querySelector('[data-kirim]');
    const de = document.documentElement;
    const overflow = de.scrollWidth > de.clientWidth + 1 ? `${de.scrollWidth}>${de.clientWidth}` : null;
    const each = [];
    for (const o of opts) {
      o.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      await wait(70);
      each.push({ ...coverage(o), y: Math.round(window.scrollY), clipped: o.scrollWidth > o.clientWidth + 1 || o.scrollHeight > o.clientHeight + 1, fontSize: fontOf(o) });
    }
    return { overflow, each, kirim: kirim ? { ...coverage(kirim), text: n(kirim.textContent) } : null };
  };
  /** Text-only zoom (font sizes x factor, layout width unchanged), like a phone's text-size setting. */
  const textZoom = (factor) => {
    const els = [...document.body.querySelectorAll('*')];
    const sizes = els.map((e) => parseFloat(getComputedStyle(e).fontSize) || 0);
    els.forEach((e, i) => {
      if (sizes[i]) e.style.setProperty('font-size', `${sizes[i] * factor}px`, 'important');
    });
    window.__ujiTeks = els;
    return els.length;
  };
  const textZoomOff = () => {
    for (const e of window.__ujiTeks ?? []) e.style.removeProperty('font-size');
    window.__ujiTeks = null;
  };
  /** Running animations longer than 200 ms (reduced motion check). */
  const longAnimations = () => {
    try {
      return document
        .getAnimations()
        .filter((a) => a.playState === 'running')
        .map((a) => ({ name: a.animationName ?? a.transitionProperty ?? a.constructor.name, ms: Number(a.effect?.getTiming?.().duration) || 0, iter: a.effect?.getTiming?.().iterations }))
        .filter((a) => a.ms > 200 || a.iter === Infinity);
    } catch {
      return [];
    }
  };
  /**
   * The shared screen's round as a viewer sees it: the VISIBLE text (innerText: evidence items take turns, the others are
   * hidden), the visible headings, where the task sits, and the font size of every visible text on screen.
   */
  const projector = (prompt = '') => {
    const root = document.querySelector('[data-fase]');
    if (!root) return null;
    // Headings under the round title (h1, which may read like an evidence title): the task and the evidence titles.
    const headings = [...root.querySelectorAll('h2, h3')].filter(shown).map((h) => n(h.textContent));
    let promptBox = null;
    if (prompt) for (const el of root.querySelectorAll('h1, h2, h3, p')) if (shown(el) && n(el.textContent) === prompt) promptBox = box(el);
    const fonts = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const s = n(t.data);
      const el = t.parentElement;
      if (!s || !el || !shown(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      if (![...range.getClientRects()].some((q) => q.width > 1 && q.height > 1 && q.bottom > 0 && q.top < window.innerHeight)) continue;
      fonts.push({ px: Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10, words: s.split(' ').length, cls: String(el.className || el.tagName.toLowerCase()).split(' ')[0] });
    }
    const de = document.documentElement;
    return { visible: n(root.innerText), headings, prompt: promptBox, vw: window.innerWidth, vh: window.innerHeight, fonts, scrolls: de.scrollHeight > de.clientHeight + 1 };
  };
  /** The deepest element reading exactly `want`: is it shown, on screen above the decision bar, cut off (ellipsis)? */
  const lineOf = (want) => {
    let best = null;
    for (const el of document.body.querySelectorAll('*')) if (n(el.textContent) === want) best = el;
    if (!best) return null;
    const r = best.getBoundingClientRect();
    const kirim = document.querySelector('[data-kirim]');
    const dock = kirim ? stickyAncestor(kirim) : null;
    const barTop = dock ? dock.getBoundingClientRect().top : window.innerHeight;
    return { shown: shown(best), truncated: best.scrollWidth > best.clientWidth + 1, onScreen: r.top >= 0 && r.bottom <= barTop + 0.5, top: Math.round(r.top), bottom: Math.round(r.bottom), barTop: Math.round(barTop) };
  };
  window.__uji = { n, text, round, sheet, active, settle, measureOptions, bottomCheck, zoomCheck, textZoom, textZoomOff, coverage, longAnimations, projector, lineOf };
}

// ------------------------------------------------------------------ browser helpers

let browser;
const viewers = [];

async function openViewer(id, vpName, viewport, extra = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: extra.reducedMotion ? 'reduce' : 'no-preference' }]);
  await page.evaluateOnNewDocument(pageHelpers, extra.helpers ?? {});
  const v = { id, vpName, ctx, page, errors: [], netFails: [], blocked: 0, offline: [], reloads: [], frames: [], audits: [], timeline: [], shots: new Set(), ...extra };
  if (extra.helpers?.timeline) {
    await page.exposeFunction('__ujiCatat', (s) => {
      try {
        v.timeline.push(JSON.parse(s));
      } catch {
        /* malformed entry: ignored */
      }
    });
  }
  const offlineNow = () => v.offline.some(([a, b]) => Date.now() >= a && (b === null || Date.now() <= b + 4000));
  page.on('pageerror', (e) => v.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text()) && !(offlineNow() && /WebSocket|ERR_INTERNET_DISCONNECTED|socket/i.test(m.text()))) v.errors.push(`console: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (/ERR_ABORTED/.test(why)) return;
    if (extra.blockImages && /ERR_BLOCKED_BY_CLIENT/.test(why)) return;
    if (offlineNow() && /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/.test(why)) return;
    v.netFails.push(`${why} ${r.url()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) v.netFails.push(`HTTP ${r.status()} ${r.url()}`);
  });
  if (extra.blockImages) {
    // The picture fails for this participant: every uploaded image of the room (scene backgrounds, evidence photos).
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return;
      if (req.resourceType() === 'image' && /\/aset-cerita\//.test(req.url())) {
        v.blocked++;
        void req.abort('blockedbyclient');
      } else void req.continue();
    });
  }
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketFrameReceived', (e) => v.frames.push(e.response.payloadData));
  v.cdp = cdp;
  viewers.push(v);
  return v;
}

/**
 * What the DOM timeline recorder of a participant page watches for: texts that must never appear in a correct run
 * (not registered / joined late / wrong round — every participant may answer every round), unless the scenario itself
 * uses them, and the two loading notes that may show while the private snapshot follows the public one.
 */
function timelineConfig() {
  const scenarioText = Object.values(M.content.text.id ?? {}).join('\n').toLowerCase();
  const candidates = [K['galat.not_eligible'], K.belumGabung, K['galat.unauthorized'], K['galat.wrong_round'], K['galat.wrong_phase'], 'tidak terdaftar', 'masuk setelah', 'dilewati'];
  const forbidden = candidates.filter((s) => s && !scenarioText.includes(s.toLowerCase()));
  return { timeline: true, forbidden, babakRe: patternOf(K.babakDari, ['n', 'total']), pilihanSegera: K.pilihanSegera, hasilMemuat: K.hasilMemuat };
}

/** `${round}-${what}-${viewport}.png` (round "00" = before the story, "akhir" = final), like the baseline captures. */
async function shot(v, round, what, { fullPage = false } = {}) {
  const name = `${typeof round === 'number' ? pad(round) : round}-${what}-${v.vpName}`;
  if (v.shots.has(name)) return name;
  v.shots.add(name);
  try {
    await v.page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  } catch (err) {
    log('tangkapan layar gagal', name, err.message);
  }
  return `${name}.png`;
}

/**
 * Generic invariants of one snapshot: no literal {nama} (text, title, attributes), no other viewer's name inside a
 * {nama} template, no horizontal overflow.
 */
async function audit(v, where, forbidden = []) {
  try {
    const r = await v.page.evaluate(
      (TOKEN, forbidden) => {
        const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
        const attrs = [];
        for (const el of document.querySelectorAll('*')) for (const a of el.attributes) if (a.value.includes(TOKEN)) attrs.push(`${el.tagName.toLowerCase()}[${a.name}]`);
        const text = document.body.textContent ?? '';
        const at = text.indexOf(TOKEN);
        const all = n(text);
        const de = document.scrollingElement;
        return {
          token: at >= 0 || document.title.includes(TOKEN) || attrs.length > 0,
          tokenAt: at >= 0 ? n(text.slice(Math.max(0, at - 50), at + 50)) : document.title.includes(TOKEN) ? 'document.title' : attrs.slice(0, 3).join(','),
          wrongName: forbidden.filter((f) => all.includes(f)).map((f) => f.slice(0, 60)),
          overflow: de.scrollWidth > de.clientWidth + 1 ? `${de.scrollWidth}>${de.clientWidth}` : null,
        };
      },
      C.PLAYER_NAME_TOKEN,
      forbidden,
    );
    v.audits.push({ where, ...r });
  } catch (err) {
    v.audits.push({ where, error: err.message });
  }
}

async function findButton(page, selector, text, timeout = 8000) {
  const h = await page.waitForFunction((sel, t) => [...document.querySelectorAll(sel)].find((b) => b.textContent.replace(/\s+/g, ' ').trim() === t && !b.disabled) ?? null, { timeout }, selector, text);
  return h.asElement();
}

async function staffLoginUi(page, route, username) {
  await page.goto(BASE + route, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stf-masuk-kartu input', { timeout: 15000 });
  const inputs = await page.$$('.stf-masuk-kartu input');
  await inputs[0].type(username);
  await inputs[1].type(CRED[username]);
  await page.click('.stf-masuk-kartu button[type=submit]');
  await page.waitForSelector('.stf-kepala', { timeout: 15000 });
}

/** Socket.IO frames "42/story,[event,payload]" received by a page. */
function storyEvents(frames) {
  const out = [];
  for (const f of frames) {
    const m = /^42\/story,(.*)$/s.exec(f);
    if (!m) continue;
    try {
      const [event, payload] = JSON.parse(m[1]);
      out.push({ event, payload });
    } catch {
      /* partial frame */
    }
  }
  return out;
}
const privatesOf = (v) => storyEvents(v.frames).filter((e) => e.event === 'story:private').map((e) => e.payload);

/**
 * Public before private, on one connection: a private snapshot never describes a newer round or phase than the last
 * public snapshot received before it — options only while that round is publicly answering, an outcome only once that
 * round's answers are publicly closed, the summary only in a closed room. Returns the count and the violations.
 */
function orderViolations(events, code) {
  let pub = null;
  let privates = 0;
  const out = [];
  for (const { event, payload } of events) {
    if (event === 'story:public') {
      if (payload?.code === code) pub = payload;
      continue;
    }
    if (event !== 'story:private' || !payload) continue;
    privates++;
    const me = payload;
    const c = me.consequence?.roundNumber ?? null;
    if (!pub) {
      // In the lobby the joiner's private snapshot may come first; nothing of a round may.
      if (me.roundNumber > 0 || me.options || c !== null || me.summary) out.push(`status pribadi babak ${me.roundNumber} sebelum status publik mana pun`);
      continue;
    }
    const where = `${pub.phase}/babak ${pub.roundNumber}`;
    if (me.roundNumber > pub.roundNumber) out.push(`status pribadi babak ${me.roundNumber} saat publik ${where}`);
    if (me.options && !(pub.phase === 'answering' && pub.roundNumber === me.roundNumber)) out.push(`pilihan babak ${me.roundNumber} saat publik ${where}`);
    if (c !== null && (pub.roundNumber < c || (pub.roundNumber === c && !['consequence', 'leaderboard', 'finished', 'interrupted'].includes(pub.phase)))) out.push(`hasil babak ${c} saat publik ${where}`);
    if (me.summary && !['finished', 'interrupted'].includes(pub.phase)) out.push(`ringkasan saat publik ${where}`);
  }
  return { privates, violations: out };
}

const readRound = (page, evidenceAlts = []) => page.evaluate((alts) => window.__uji.round(alts), evidenceAlts);
const readSheet = (page) => page.evaluate((w) => window.__uji.sheet(w), K.tutup);

// ------------------------------------------------------------------ interactions (tap / mouse / keyboard)

/** Press Tab until the focused element matches `sel` (forward, then backward); returns the number of presses (0 = already there), -1 = never. */
async function tabUntil(page, sel, max = 70) {
  const at = () => page.evaluate((s) => !!document.activeElement?.matches?.(s), sel);
  if (await at()) return 0;
  for (let i = 1; i <= max; i++) {
    await page.keyboard.press('Tab');
    if (await at()) return i;
  }
  for (let i = 1; i <= max; i++) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    if (await at()) return max + i;
  }
  return -1;
}

/** Bring an element to the middle of the screen (clear of sticky bars), like a player scrolling to it, and name what a tap there hits. */
async function aim(el) {
  await el.evaluate((x) => x.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await sleep(120);
  return el.evaluate((x) => {
    const r = x.getBoundingClientRect();
    const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return h && (h === x || x.contains(h)) ? 'sasaran' : `${h?.tagName.toLowerCase()}.${String(h?.className ?? '').split(' ')[0]}`;
  });
}

async function press(p, el) {
  if (p.input === 'tap') await el.tap();
  else await el.click();
}

/** Select an option by its handle with the participant's own input; the keyboard uses Tab + arrows (radio group). */
async function selectOption(p, handle) {
  const page = p.page;
  if (p.input === 'keyboard') {
    const tabs = await tabUntil(page, '[data-pilihan]');
    if (tabs < 0) return { checked: false, how: 'Tab tidak pernah mencapai kelompok pilihan' };
    const st = await page.evaluate((h) => {
      const o = [...document.querySelectorAll('[data-pilihan]')];
      return { at: o.indexOf(document.activeElement), want: o.findIndex((x) => x.dataset.pilihan === h), count: o.length };
    }, handle);
    let keys;
    if (st.want === st.at) {
      await page.keyboard.press('Space');
      keys = 'Spasi';
    } else {
      const steps = (st.want - st.at + st.count) % st.count;
      for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowDown');
      keys = `↓×${steps}`;
    }
    await sleep(120);
    const checked = await page.evaluate((h) => {
      const o = document.querySelector(`[data-pilihan="${h}"]`);
      return o?.getAttribute('aria-checked') === 'true' && document.activeElement === o;
    }, handle);
    return { checked, how: `keyboard Tab×${tabs} ${keys}` };
  }
  const el = await page.$(`[data-pilihan="${handle}"]`);
  if (!el) return { checked: false, how: 'pilihan tidak ada' };
  const hit = await aim(el);
  await press(p, el);
  await sleep(100);
  const checked = await el.evaluate((x) => x.getAttribute('aria-checked') === 'true');
  return { checked, how: `${p.input} (titik: ${hit})` };
}

/**
 * One confirmation sends the decision. Resolves with the sent state as it first appears (watched on every DOM change:
 * when this was the last answer the room closes the round at once and the outcome replaces it within milliseconds),
 * or `closedFirst` when the outcome arrived before any sent state was drawn.
 */
async function sendDecision(p, waitingSrc) {
  const page = p.page;
  let how;
  if (p.input === 'keyboard') {
    const tabs = await tabUntil(page, '[data-kirim]');
    if (tabs < 0) return { sent: false, how: 'Tab tidak pernah mencapai tombol kirim' };
    await page.keyboard.press('Enter');
    how = `Tab×${tabs} Enter`;
  } else {
    const b = await page.$('[data-kirim]');
    if (!b) return { sent: false, how: 'tombol kirim tidak ada' };
    const hit = await b.evaluate((x) => {
      const r = x.getBoundingClientRect();
      const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return h && (h === x || x.contains(h)) ? 'sasaran' : `${h?.tagName.toLowerCase()}.${String(h?.className ?? '').split(' ')[0]}`;
    });
    await press(p, b);
    how = `${p.input} (titik: ${hit})`;
  }
  const snap = await page
    .waitForFunction(
      (src) => {
        const root = document.querySelector('[data-fase]');
        const t = root?.querySelector('[data-terkirim]');
        if (t) {
          return {
            state: 'terkirim',
            text: window.__uji.text(t),
            kirim: !!root.querySelector('[data-kirim]'),
            options: root.querySelectorAll('[data-pilihan]').length,
            timers: document.querySelectorAll('[data-timer]').length,
            waiting: new RegExp(src).test(window.__uji.text(root)),
          };
        }
        return root?.dataset.fase === 'consequence' ? { state: 'ditutup' } : null;
      },
      { timeout: 8000, polling: 'mutation' },
      waitingSrc,
    )
    .then(
      (h) => h.jsonValue(),
      () => null,
    );
  return { sent: !!snap, closedFirst: snap?.state === 'ditutup', snap, how };
}

/** Open evidence `id` in the sheet: list/card/chip opener or the scene marker, with tap, mouse or keyboard (Tab + Enter). */
async function openSheet(p, id, { marker = false } = {}) {
  const page = p.page;
  let how;
  if (p.input === 'keyboard') {
    const tabs = await tabUntil(page, `[data-berkas="${id}"]:not([aria-hidden="true"])`);
    if (tabs < 0) return { opened: false, how: 'Tab tidak pernah mencapai pembuka berkas' };
    await page.keyboard.press('Enter');
    how = `keyboard Tab×${tabs} Enter`;
  } else {
    const el = await page.$(`[data-berkas="${id}"]${marker ? '[aria-hidden="true"]' : ':not([aria-hidden="true"])'}`);
    if (!el) return { opened: false, how: marker ? 'penanda tidak ada' : 'pembuka tidak ada' };
    const hit = await aim(el);
    await press(p, el);
    how = `${p.input}${marker ? ' penanda' : ''} (titik: ${hit})`;
  }
  const opened = await page.waitForSelector(`dialog[data-lembar="${id}"]`, { timeout: 4000 }).then(
    () => true,
    () => false,
  );
  if (opened) await page.waitForFunction(() => [...document.querySelectorAll('dialog[data-lembar] img')].every((i) => i.complete), { timeout: 4000 }).catch(() => {});
  return { opened, how };
}

/**
 * "Perbesar gambar" of a field scene with the participant's own input: the picture sheet (dialog[data-lembar-gambar])
 * opens modal with the scene picture loaded, then closes (Escape on the keyboard, the close button otherwise) and focus
 * returns to the button. `ratio` = drawn width in the sheet / width in the scene. `button` false = no such button.
 */
async function pictureZoom(p, n) {
  const page = p.page;
  const found = await page.evaluate((w) => {
    const b = [...document.querySelectorAll('[data-fase] button')].find((x) => window.__uji.n(x.textContent) === w);
    if (!b) return null;
    b.setAttribute('data-uji-perbesar', '');
    const img = b.closest('figure')?.querySelector('img');
    const r = img ? img.getBoundingClientRect() : null;
    return { scene: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null };
  }, K.perbesarGambar);
  if (!found) return { button: false, ok: false };
  let how;
  if (p.input === 'keyboard') {
    const tabs = await tabUntil(page, '[data-uji-perbesar]');
    if (tabs < 0) return { button: true, ok: false, how: 'Tab tidak pernah mencapai tombol' };
    await page.keyboard.press('Enter');
    how = `keyboard Tab×${tabs} Enter`;
  } else {
    const el = await page.$('[data-uji-perbesar]');
    const hit = await aim(el);
    await press(p, el);
    how = `${p.input} (titik: ${hit})`;
  }
  const opened = await page.waitForSelector('dialog[data-lembar-gambar]', { timeout: 4000 }).then(
    () => true,
    () => false,
  );
  let sheet = null;
  if (opened) {
    await page.waitForFunction(() => [...document.querySelectorAll('dialog[data-lembar-gambar] img')].every((i) => i.complete), { timeout: 4000 }).catch(() => {});
    sheet = await page.evaluate(() => {
      const d = document.querySelector('dialog[data-lembar-gambar]');
      const img = d.querySelector('img');
      let modal = false;
      try {
        modal = d.matches(':modal');
      } catch {
        /* old browser */
      }
      const r = img?.getBoundingClientRect();
      // object-fit: contain — the picture as drawn inside the element's box.
      let drawn = null;
      if (img && img.naturalWidth > 0 && r) {
        const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
        drawn = { w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) };
      }
      return { open: d.open, modal, loaded: !!img && img.complete && img.naturalWidth > 0, drawn, focusInside: d.contains(document.activeElement) };
    });
    if (!p.zoomShot) {
      p.zoomShot = true;
      await shot(p, n, 'perbesar-gambar');
    }
  }
  const closeHow = p.input === 'keyboard' ? 'escape' : 'tombol';
  if (opened) {
    if (closeHow === 'escape') await page.keyboard.press('Escape');
    else {
      const b = (await page.evaluateHandle((w) => [...document.querySelectorAll('dialog[data-lembar-gambar] button')].find((x) => x.textContent.replace(/\s+/g, ' ').includes(w)) ?? null, K.tutup)).asElement();
      if (b) await press(p, b);
    }
  }
  const closed = opened && (await page.waitForFunction(() => !document.querySelector('dialog[data-lembar-gambar]'), { timeout: 4000 }).then(
    () => true,
    () => false,
  ));
  await sleep(80);
  const focusBack = await page.evaluate(() => !!document.activeElement?.matches?.('[data-uji-perbesar]'));
  await page.evaluate(() => document.querySelector('[data-uji-perbesar]')?.removeAttribute('data-uji-perbesar'));
  const ratio = sheet?.drawn && found.scene?.w ? Math.round((sheet.drawn.w / found.scene.w) * 100) / 100 : null;
  const ok = opened && !!sheet?.open && !!sheet.modal && !!sheet.loaded && !!sheet.focusInside && ratio !== null && ratio >= 1 && closed && focusBack;
  return { button: true, ok, how, closeHow, opened, sheet, scene: found.scene, ratio, closed, focusBack };
}

/** Close the open sheet with Escape, its close button, or a tap on the backdrop; reports whether focus went back to the opener. */
async function closeSheet(p, id, how) {
  const page = p.page;
  if (how === 'escape') await page.keyboard.press('Escape');
  else if (how === 'tombol') {
    const b = await page.evaluateHandle((w) => [...document.querySelectorAll('dialog[data-lembar] button')].find((x) => x.textContent.replace(/\s+/g, ' ').includes(w)) ?? null, K.tutup);
    const el = b.asElement();
    if (!el) return { closed: false, focusBack: false, how: 'tombol tutup tidak ada' };
    await press(p, el);
  } else {
    const pt = await page.evaluate(() => {
      const r = document.querySelector('dialog[data-lembar]').getBoundingClientRect();
      return { x: r.left > 12 ? 6 : window.innerWidth - 6, y: r.top > 12 ? 6 : window.innerHeight - 6 };
    });
    if (p.input === 'tap') await page.touchscreen.tap(pt.x, pt.y);
    else await page.mouse.click(pt.x, pt.y);
  }
  const closed = await page.waitForFunction(() => !document.querySelector('dialog[data-lembar]'), { timeout: 4000 }).then(
    () => true,
    () => false,
  );
  await sleep(80);
  const a = await page.evaluate(() => window.__uji.active());
  return { closed, focusBack: a.berkas === id, focus: a, how };
}

/** What an open sheet must show: the item's title, text, rows with their status words, its picture (or the failure note). */
function sheetIssues(sh, ev, imagesBlocked) {
  if (!sh) return ['lembar tidak terbuka'];
  const out = [];
  if (sh.id !== ev.id) out.push(`lembar ${sh.id} ≠ ${ev.id}`);
  if (!sh.open || !sh.modal) out.push(`lembar terbuka=${sh.open} modal=${sh.modal}`);
  if (!sh.text.includes(norm(ev.title))) out.push('judul berkas tidak ada');
  if (!sh.text.includes(evidenceWord(ev))) out.push(`kata di atas judul ("${evidenceWord(ev)}") tidak ada`);
  if (ev.body && !sh.text.includes(norm(ev.body))) out.push('isi berkas tidak ada');
  for (const r of ev.rows) {
    if (!sh.text.includes(norm(r.label))) out.push(`baris ${r.id} tidak ada`);
    if (r.value && !sh.text.includes(norm(r.value))) out.push(`nilai baris ${r.id} tidak ada`);
    const w = markWord(ev.kind, r.mark);
    if (w && !sh.text.includes(w)) out.push(`tanda baris ${r.id} ("${w}") tidak ada`);
  }
  if (ev.assetId) {
    if (imagesBlocked) {
      if (!sh.text.includes(K.gambarGagal)) out.push('catatan gambar gagal tidak ada');
    } else if (!sh.imgOk) out.push('gambar berkas tidak termuat');
  }
  if (!sh.focusInside) out.push('fokus tidak berada di dalam lembar');
  if (!sh.closeButton) out.push('tombol tutup tidak ada');
  return out;
}

// ------------------------------------------------------------------ sockets (bots, watcher, re-submission)

/** Every socket this run opens (closed at the end, also after a failure). */
const sockets = [];
function connect(auth = {}) {
  return new Promise((resolve, reject) => {
    const s = ioClient(`${BASE}/story`, { transports: ['websocket'], forceNew: true, reconnection: false, auth });
    sockets.push(s);
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}
const rpc = (s, ev, payload, timeout = 10000) => new Promise((resolve) => s.timeout(timeout).emit(ev, payload, (err, res) => resolve(err ? { ok: false, error: String(err) } : res)));

/** A socket participant: marks every scene ready, answers its strategy's choice after a short delay (and maybe re-sends). */
async function startBot(spec, code) {
  const bot = { ...spec, kind: 'bot', id: spec.name.toLowerCase().replace(/\s+/g, '-'), track: new Track(), privates: [], answers: new Map(), resubmits: [], errors: [], order: [] };
  bot.s = await connect();
  bot.s.on('story:public', (st) => {
    if (st.code !== code) return;
    bot.order.push({ event: 'story:public', payload: st });
    bot.pub = st;
    if (st.phase === 'scene' && st.scene && bot.readyFor !== st.scene.roundId) {
      bot.readyFor = st.scene.roundId;
      void rpc(bot.s, 'participant:ready', { roundId: st.scene.roundId });
    }
  });
  bot.s.on('story:private', (me) => {
    bot.order.push({ event: 'story:private', payload: me });
    bot.me = me;
    bot.privates.push(me);
    const n = me.roundNumber;
    if (!me.options || me.answer || bot.answers.has(n)) return;
    const round = M.rounds[n - 1];
    const choice = STRATEGIES[bot.strategy](round, n);
    bot.answers.set(n, { planned: choice?.id ?? null });
    if (!choice) return;
    const opt = me.options.find((o) => o.text === M.choiceText(round, choice));
    if (!opt) {
      bot.errors.push(`babak ${n}: opsi ${choice.id} tidak ada di daftar pilihan bot`);
      return;
    }
    const other = me.options.find((o) => o.handle !== opt.handle);
    const [lo, hi] = bot.delay;
    setTimeout(async () => {
      const res = await rpc(bot.s, 'participant:answer', { roundId: round.id, option: opt.handle });
      bot.answers.set(n, { planned: choice.id, ack: res });
      if (!res.ok) bot.errors.push(`babak ${n}: jawaban ditolak ${res.code ?? ''} ${res.error ?? ''}`);
      else if (bot.resubmit) {
        // The same option again (double tap / lost ack) and then another option: neither may change the decision.
        const again = await rpc(bot.s, 'participant:answer', { roundId: round.id, option: opt.handle });
        const changed = await rpc(bot.s, 'participant:answer', { roundId: round.id, option: other.handle });
        bot.resubmits.push({ n, sameOk: again.ok && again.data?.duplicate === true && again.data.elapsedMs === res.data.elapsedMs, otherRefused: !changed.ok && changed.code === 'answered', detail: `${again.ok ? 'dup=' + again.data?.duplicate : again.code} / ${changed.ok ? 'DITERIMA' : changed.code}` });
      }
    }, lo + ((n * 7919) % (hi - lo + 1)));
  });
  const res = await rpc(bot.s, 'participant:join', { code, name: spec.name, acceptNotice: true });
  if (!res.ok) throw new Error(`bot ${spec.name} gagal masuk: ${res.error}`);
  bot.pid = res.data.participantId;
  bot.name = res.data.me.name;
  bot.me = res.data.me;
  return bot;
}

// ------------------------------------------------------------------ phase: room

async function phaseRoom(state) {
  log('== room: satu room, host manual, semua babak');
  const cfg = (await api('GET', '/api/config')).json ?? {};
  const maxP = cfg.story?.maxParticipants ?? 0;
  const windowMs = cfg.story?.answerWindowMs ?? STORY_SCORE_POLICY.answerWindowMs;
  check('server memakai kebijakan nilai yang sama dengan aturan bersama', cfg.story?.scorePolicyId === STORY_SCORE_POLICY.id, String(cfg.story?.scorePolicyId));
  if (maxP < PLAYERS.length + 1) throw new Error(`STORY_MAX_PARTICIPANTS=${maxP}: perlu minimal ${PLAYERS.length + 1}`);
  const hostTok = await apiLogin(HOST_USER);
  const offer = ((await api('GET', '/api/host/scenarios', hostTok)).json?.scenarios ?? []).find((s) => s.scenarioId === M.scenarioId);
  check('host ditawari versi terbit yang sama dengan isi CMS yang diuji', offer?.versionId === M.versionId, `${offer?.versionId} / ${M.versionId}`);
  const SHOTS = shotRounds();
  state.shotRounds = [...SHOTS].sort((a, b) => a - b);
  const AUTO_OPEN = autoOpenRounds();
  state.autoOpenRounds = [...AUTO_OPEN];

  // ---- host console (UI) opens the room, auto-advance OFF (host-paced)
  const host = await openViewer('host', 'host', VP['1440x900'], { role: 'host' });
  await staffLoginUi(host.page, '/host', HOST_USER);
  await host.page.waitForSelector('.stf-pilih-skenario', { timeout: 15000 });
  const neutralTitle = norm(personal(M.title, K.namaUmum));
  const pickIdx = await host.page.evaluate((title) => [...document.querySelectorAll('.stf-pilih-skenario label.stf-opsi')].findIndex((l) => l.querySelector('b')?.textContent.replace(/\s+/g, ' ').trim() === title), neutralTitle);
  if (pickIdx < 0) throw new Error('skenario tidak ada di pilihan konsol host');
  await (await host.page.$$('.stf-pilih-skenario label.stf-opsi'))[pickIdx].click();
  const autoBox = await host.page.$('.stf-kartu .stf-centang input');
  if (await autoBox.evaluate((e) => e.checked)) await autoBox.click();
  await (await findButton(host.page, 'button.btn-utama', 'Buka room')).click();
  await host.page.waitForSelector('.stf-room-kode', { timeout: 15000 });
  const code = new URL(host.page.url()).searchParams.get('room');
  state.code = code;
  check('konsol host membuka room (kode 6 karakter, lanjut otomatis mati)', /^[A-Z2-9]{6}$/.test(code ?? ''), code);

  // ---- watcher (a second display socket): the public phase clock of the run
  const watch = { pub: null, publics: [], answeringAt: {} };
  watch.s = await connect();
  watch.s.on('story:public', (st) => {
    if (st.code !== code) return;
    watch.pub = st;
    watch.publics.push(st);
    if (st.phase === 'answering' && watch.answeringAt[st.roundNumber] === undefined) watch.answeringAt[st.roundNumber] = Date.now();
  });
  watch.pub = (await rpc(watch.s, 'display:watch', { code })).data?.state ?? null;
  const waitPhase = (phase, n, timeout) => waitFor(() => watch.pub?.phase === phase && (n === null || watch.pub.roundNumber === n), timeout, 100, `fase ${phase}${n ? ' babak ' + n : ''}`);
  check('room dibuat dengan lanjut otomatis mati (host manual)', watch.pub?.autoAdvance === false, String(watch.pub?.autoAdvance));

  // ---- projector
  const proj = await openViewer('proyektor', 'proyektor', VP['1920x1080'], { role: 'shared' });
  await proj.page.goto(`${BASE}/projector?room=${code}`, { waitUntil: 'networkidle0' });
  await proj.page.waitForSelector('.sr-layar-lobi', { timeout: 15000 });

  // ---- browser participants join through the UI, bots fill the room
  const players = [];
  const timelineCfg = timelineConfig();
  state.timelineForbidden = timelineCfg.forbidden;
  for (const spec of PLAYERS) {
    const v = await openViewer(spec.id, spec.vp, VP[spec.vp], { role: 'player', ...spec, blockImages: spec.id === BLOCKED_IMAGES, track: new Track(), steps: [], answerErrors: [], helpers: timelineCfg });
    players.push(v);
    await v.page.goto(`${BASE}/join?room=${code}`, { waitUntil: 'networkidle0' });
    await v.page.waitForSelector('.sr-join-nama input.kolom', { timeout: 15000 });
    await audit(v, 'gabung');
    await shot(v, '00', 'gabung');
    await v.page.type('.sr-join-nama input.kolom', spec.name);
    const box = await v.page.$('.sr-setuju input');
    if (!(await box.evaluate((e) => e.checked))) await box.click();
    await v.page.click('.sr-join-nama button[type=submit]');
    await v.page.waitForSelector('.sr-lobi', { timeout: 15000 });
  }
  const bots = [];
  for (let i = 0; i < maxP - players.length; i++) {
    const spec = BOTS[i % BOTS.length];
    bots.push(await startBot({ ...spec, name: i < BOTS.length ? spec.name : `${spec.name} ${Math.floor(i / BOTS.length) + 1}` }, code));
  }
  const extra = await connect();
  const full = await rpc(extra, 'participant:join', { code, name: 'Peserta Lebih', acceptNotice: true });
  extra.close();
  check(`room penuh (${maxP} peserta): peserta berikutnya ditolak`, !full.ok && full.code === 'full', `${full.code} ${full.error ?? ''}`);
  const everyone = [...players, ...bots];
  const names = everyone.map((p) => p.name);
  const forbiddenFor = (v) => {
    const others = v.role === 'player' ? [...names.filter((x) => x !== v.name), K.namaUmum] : names;
    return M.tokenTemplates.flatMap((t) => others.map((o) => norm(personal(t, o))));
  };

  // ---- lobby
  await waitFor(() => watch.pub?.participantCount === everyone.length, 15000, 150, 'semua peserta di lobi');
  for (const p of players) {
    await p.page.waitForSelector('.sr-lobi .sr-nama-saya b', { timeout: 10000 });
    const lob = await p.page.evaluate(() => ({ me: (document.querySelector('.sr-nama-saya b')?.textContent ?? '').trim(), title: (document.querySelector('.sr-judul-skenario')?.textContent ?? '').replace(/\s+/g, ' ').trim() }));
    check(`lobi · ${p.id}: nama sendiri dan judul skenario tampil`, lob.me === p.name && lob.title === norm(personal(M.title, p.name)), JSON.stringify(lob));
    await audit(p, 'lobi', forbiddenFor(p));
    await shot(p, '00', 'lobi');
  }
  await proj.page.waitForFunction((n) => document.querySelectorAll('.sr-layar-peserta li').length >= n, { timeout: 10000 }, everyone.length);
  const lobbyNames = await proj.page.evaluate(() => [...document.querySelectorAll('.sr-layar-peserta li')].map((l) => l.textContent.trim()));
  check('layar acara lobi menampilkan semua nama peserta', names.every((n) => lobbyNames.includes(n)), lobbyNames.join(', '));
  await audit(proj, 'lobi', forbiddenFor(proj));
  await shot(proj, '00', 'lobi');
  await host.page.waitForFunction((n) => document.querySelectorAll('.stf-room-peserta tbody tr').length === n, { timeout: 10000 }, everyone.length);
  await audit(host, 'lobi', forbiddenFor(host));
  await shot(host, '00', 'lobi');

  // ---- start (host UI)
  await (await findButton(host.page, '.stf-room-kendali .btn-utama', 'Mulai cerita')).click();
  state.startedAt = Date.now();

  /** Host console button press for the phase it shows (host-paced); a missing button is a finding, not a crash. */
  state.rounds = [];
  state.hostActions = {};
  const hostAct = async (label, phase, n) => {
    const tally = (state.hostActions[label] ??= { ditekan: 0, sudahBerpindah: 0 });
    if (watch.pub?.phase !== phase || watch.pub?.roundNumber !== n) {
      tally.sudahBerpindah++;
      return false;
    }
    try {
      await (await findButton(host.page, '.stf-room-kendali .btn-utama', label, 6000)).click();
      tally.ditekan++;
      return true;
    } catch {
      if (watch.pub?.phase === phase && watch.pub?.roundNumber === n) check(`host · babak ${n}: tombol "${label}" tersedia saat fase ${phase}`, false);
      return false;
    }
  };
  /** A participant/screen flow that fails becomes a finding with a screenshot; the run goes on. */
  const guard = async (v, label, fn) => {
    try {
      await fn();
    } catch (err) {
      check(`${label} · ${v.id}: alur selesai tanpa pengecualian`, false, err.stack ?? err.message);
      await shot(v, 'galat', `${label.replace(/[^a-z0-9]+/gi, '-')}`, { fullPage: true });
    }
  };
  const babak = (n) => fmt(K.babakDari, { n, total: M.count });
  const cueSrc = patternOf(K.pilihanLagi, ['n']);
  const waitingRe = new RegExp(`${patternOf(K.pilihanDibuka, ['n'])}|${escRe(K.pilihanSegera)}`);
  const answeredRe = new RegExp(patternOf(K.menungguLain, ['sudah', 'total']));
  state.metrics = [];
  state.special = [];
  const metric = (o) => state.metrics.push(o);

  // ================================================================ per-round flows

  /** SCENE: the round's activity, lines, header, status, reminders, evidence openers; one evidence item opened and closed. */
  async function sceneFlow(p, ctx) {
    const { n, idx, round } = ctx;
    const page = p.page;
    const e = sceneExpect(idx, p.name, p.start.flags, 'scene', p.start.variant);
    const want = e.all.map((l) => norm(l.text));
    await page.waitForFunction((label) => (document.querySelector('[data-fase]')?.textContent ?? '').includes(label), { timeout: 20000 }, babak(n));
    // A round starts at its top (RoundScreen), not where the previous round's outcome and ranking or the lobby left the page.
    const start = await page.evaluate(() => ({ y: Math.round(window.scrollY), kepala: Math.round(document.querySelector('.sr-ronde-kepala')?.getBoundingClientRect().top ?? -1) }));
    metric({ n, id: p.id, vp: p.vpName, fase: 'scene-awal', ...start });
    check(`babak ${n} · ${p.id}: babak dimulai dari atas (kepala babak & tugas terlihat)`, start.y === 0 && start.kepala >= 0, JSON.stringify(start));
    if (p.reducedMotion) p.anims = [...(p.anims ?? []), ...(await page.evaluate(() => window.__uji.longAnimations())).map((a) => ({ n, ...a }))];
    await page.evaluate(() => window.scrollTo(0, 0));
    // Lines arrive during the shared reading time (all at once with reduced motion); wait until all are shown.
    let first = null;
    const samples = [];
    const until = Date.now() + 30_000;
    for (;;) {
      const s = await page.evaluate(() => {
        const r = window.__uji.round();
        return r && { fase: r.fase, actText: r.actText };
      });
      if (s?.fase === 'scene') {
        const shown = want.filter((w) => s.actText.includes(w)).length;
        first ??= { shown, ms: Date.now() - ctx.sceneAt };
        samples.push(shown);
        if (shown === want.length) break;
      }
      if (watch.pub?.phase !== 'scene' || Date.now() > until) break;
      await sleep(150);
    }
    const revealMs = Date.now() - ctx.sceneAt;
    if (p.reducedMotion) ctx.reduced.push({ id: p.id, first: first?.shown ?? null, want: want.length });
    if (round.layout === 'chat' || round.layout === 'stage') ctx.reveal.push({ id: p.id, first: first?.shown ?? null, want: want.length, revealMs, samples: samples.slice(0, 12) });
    const spots = e.evidence.filter((x) => x.spot);
    // Field scene: markers appear once the round's picture has loaded; a blocked picture leaves the failure note once
    // the round's asset list is known and the request fails. Both are waited for (bounded) and timed from the scene start.
    if (round.layout === 'field' && spots.length && !p.blockImages) {
      const got = await page.waitForFunction((k) => document.querySelectorAll('[data-berkas][aria-hidden="true"]').length >= k, { timeout: 6000 }, spots.length).then(
        () => true,
        () => false,
      );
      metric({ n, id: p.id, vp: p.vpName, penandaMs: got ? Date.now() - ctx.sceneAt : null });
    }
    if (round.layout === 'field' && p.blockImages) {
      const got = await page.waitForFunction((w) => (document.querySelector('[data-fase]')?.textContent ?? '').includes(w), { timeout: 6000 }, K.adeganGagal).then(
        () => true,
        () => false,
      );
      metric({ n, id: p.id, vp: p.vpName, catatanGambarGagalMs: got ? Date.now() - ctx.sceneAt : null });
    }
    const st = await readRound(page);
    if (!st || st.fase !== 'scene') {
      check(`babak ${n} · ${p.id}: adegan tertangkap selama waktu baca`, false, `fase ${st?.fase ?? '-'} (waktu baca habis sebelum alat selesai menunggu)`);
      return;
    }
    const issues = [];
    if (st.aktivitas !== e.layout) issues.push(`kegiatan ${st.aktivitas} ≠ ${e.layout}`);
    if (!st.rootText.includes(babak(n))) issues.push(`"${babak(n)}" tidak ada`);
    if (!st.rootText.includes(norm(e.title))) issues.push('judul babak tidak ada');
    if (e.meta && !st.rootText.includes(norm(e.meta))) issues.push('meta babak tidak ada');
    if (st.rootText.includes(K.babakKunci) !== e.keyRound) issues.push(`tanda babak kunci tampil=${st.rootText.includes(K.babakKunci)}`);
    if (e.prompt && !st.rootText.includes(norm(e.prompt))) issues.push('tugas babak tidak ada');
    // The task in one line under the title ("Tugas: …"), so it is known before reading on.
    if (e.prompt && !st.rootText.includes(norm(`${K.tugas} ${e.prompt}`))) issues.push(`baris "${K.tugas} …" di bawah judul tidak ada`);
    check(`babak ${n} · ${p.id}: kegiatan "${e.layout}" (data-aktivitas) + kepala babak & tugas ("${K.tugas} …")`, issues.length === 0, issues.join(' | '));
    const lineIssues = orderIssues(st.actText, want);
    check(`babak ${n} · ${p.id}: ${want.length} baris (pembuka + babak${e.lines.some((l) => l.conditional) ? ' + baris pribadi' : ''}) tampil urut, {nama} = nama sendiri`, lineIssues.length === 0, lineIssues.join(' | '));
    if (p.reducedMotion && (round.layout === 'chat' || round.layout === 'stage')) check(`babak ${n} · ${p.id} (gerak dikurangi): semua baris langsung tampil`, first?.shown === want.length, `${first?.shown}/${want.length} pada cuplikan pertama`);
    // Waiting tray: no options, no timer yet, "Pilihan dibuka dalam N detik".
    const tray = [];
    if (st.options.length) tray.push(`${st.options.length} pilihan sudah tampil`);
    if (st.kirim) tray.push('tombol kirim sudah tampil');
    if (st.timers) tray.push(`${st.timers} timer jawaban`);
    if (!waitingRe.test(st.rootText)) tray.push('keterangan "Pilihan dibuka dalam …" tidak ada');
    if (!st.rootText.includes(K[e.layout === 'chat' ? 'pilihanNanti.chat' : 'pilihanNanti.umum'])) tray.push('keterangan lima pilihan tidak ada');
    check(`babak ${n} · ${p.id}: waktu baca tanpa pilihan & tanpa timer jawaban ("Pilihan dibuka dalam …")`, tray.length === 0, tray.join(' | '));
    // ONE status chip with the scenario's word (and the change once after a delayed effect).
    const beforeBand = E.moodBandOf(p.start.mood - p.start.delayedDelta);
    const chipText = [moodNameFor(p.name), wordFor(p.start.band, p.name), ...(beforeBand !== p.start.band ? [wordFor(beforeBand, p.name)] : []), ...(p.start.delayedDelta ? [signed(p.start.delayedDelta)] : [])].map(norm);
    const chipOk = !!st.suasana && st.suasana.band === p.start.band && chipText.every((w) => st.suasana.text.includes(w)) && (p.start.delayedDelta || !/[−+]\d/.test(st.suasana.text));
    check(`babak ${n} · ${p.id}: satu status (data-suasana) "${wordFor(p.start.band, p.name)}"${beforeBand !== p.start.band ? ` (berubah dari "${wordFor(beforeBand, p.name)}")` : ''}${p.start.delayedDelta ? ` · ${signed(p.start.delayedDelta)}` : ''}`, chipOk, JSON.stringify(st.suasana));
    // Private reminders only for the holder of a flag hitting this round.
    const rem = p.start.reminders.map((r) => norm(reminderText({ ...r, label: personal(r.label, p.name) })));
    const remOk = st.pengingat.length === rem.length && rem.every((r, i) => st.pengingat[i]?.includes(r) && st.pengingat[i].includes(K.pengingat));
    if (rem.length || st.pengingat.length) check(`babak ${n} · ${p.id}: pengingat pribadi (data-pengingat) ${rem.length ? 'tampil bagi pemegang tanda' : 'TIDAK tampil (bukan pemegang)'}`, remOk, JSON.stringify(st.pengingat));
    // Conditional lines of others never reach this page.
    for (const cnd of M.conditional.filter((x) => x.round === n && !p.start.flags.has(x.flag))) check(`babak ${n} · ${p.id}: baris pribadi tanda ${cnd.flag} TIDAK ada di halaman bukan pemegang`, !st.pageText.includes(cnd.core), short(cnd.core, 50));
    // Evidence openers: every shared item can be opened; field markers >= 44 px; failed picture -> list + note.
    const ids = e.evidence.map((x) => x.id);
    const listOpeners = st.openers.filter((o) => !o.marker).map((o) => o.id);
    check(`babak ${n} · ${p.id}: ${ids.length} berkas bersama punya pembuka (data-berkas)`, JSON.stringify([...listOpeners].sort()) === JSON.stringify([...ids].sort()), `${listOpeners.join(',')} / ${ids.join(',')}`);
    if (round.layout === 'field') {
      const markers = st.openers.filter((o) => o.marker);
      if (p.blockImages) {
        check(`babak ${n} · ${p.id} (gambar gagal): catatan adegan + semua titik tetap di daftar, tanpa penanda`, st.rootText.includes(K.adeganGagal) && markers.length === 0 && listOpeners.length === ids.length, `${markers.length} penanda; catatan=${st.rootText.includes(K.adeganGagal)}`);
      } else {
        // The pin may be small; its tap area (pin + ::before) must be >= 44 px and a tap at its edge must reach it.
        const small = markers.filter((m) => m.hitW < 44 || m.hitH < 44 || m.edgeHit === false);
        check(`babak ${n} · ${p.id}: ${spots.length} penanda adegan, area ketuk masing-masing >= 44 px (tepinya kena)`, markers.length === spots.length && small.length === 0, markers.map((m) => `${m.id}: pin ${m.w}x${m.h}, area ${m.hitW}x${m.hitH}, tepi ${m.edgeHit === null ? 'di luar layar' : m.edgeHit ? 'kena' : 'TIDAK kena'}`).join(' | '));
      }
      // "Perbesar gambar": the scene picture enlarged in a sheet (not offered when the picture failed).
      const zoomFlow = await pictureZoom(p, n);
      if (p.blockImages) check(`babak ${n} · ${p.id} (gambar gagal): tanpa tombol "${K.perbesarGambar}"`, !zoomFlow.button, JSON.stringify(zoomFlow));
      else check(`babak ${n} · ${p.id}: "${K.perbesarGambar}" (${zoomFlow.how ?? '-'}) membuka gambar adegan (tidak lebih kecil daripada di adegan) di lembar modal, ditutup (${zoomFlow.closeHow ?? '-'}) dan fokus kembali`, zoomFlow.ok, JSON.stringify(zoomFlow));
      if (zoomFlow.opened) metric({ n, id: p.id, vp: p.vpName, perbesar: zoomFlow.ratio, gambarAdegan: zoomFlow.scene, gambarLembar: zoomFlow.sheet?.drawn });
    }
    if (e.layout === 'chat') check(`babak ${n} · ${p.id}: chat tanpa ilustrasi kedua (gambar besar di layar babak)`, st.media.length === 0, st.media.join(', '));
    else if (st.media.length) metric({ n, id: p.id, fase: 'scene', gambarBesar: st.media });
    if (e.lesson === '' && M.t(C.textKey.roundLesson(round.id))) check(`babak ${n} · ${p.id}: pelajaran babak belum tampil sebelum jawaban ditutup`, !st.pageText.includes(norm(personal(M.t(C.textKey.roundLesson(round.id)), p.name))));
    await audit(p, `babak ${n} adegan`, forbiddenFor(p));
    if (ctx.shoot) await shot(p, n, 'adegan');
    // One evidence item opened and closed (rotating per participant and round), each input in its own way.
    if (!e.evidence.length) return;
    const k = PLAYERS.findIndex((x) => x.id === p.id);
    const ev = e.evidence[(k + n) % e.evidence.length];
    const viaMarker = round.layout === 'field' && !!ev.spot && !p.blockImages && p.input !== 'keyboard';
    const closeHow = p.input === 'keyboard' ? 'escape' : p.input === 'mouse' ? (n % 2 ? 'tombol' : 'escape') : p.id === 'hp390' ? 'latar' : 'tombol';
    const o = await openSheet(p, ev.id, { marker: viaMarker });
    const sh = o.opened ? await readSheet(page) : null;
    const shIssues = o.opened ? sheetIssues(sh, ev, p.blockImages) : [`tidak terbuka (${o.how})`];
    if (ctx.shoot && o.opened) await shot(p, n, 'lembar');
    if (p.blockImages && round.layout === 'field' && o.opened) await shot(p, n, 'gambar-gagal-lembar');
    const c = o.opened ? await closeSheet(p, ev.id, closeHow) : { closed: false, focusBack: false };
    check(`babak ${n} · ${p.id}: berkas "${short(ev.title, 30)}" dibuka (${o.how}) dan isinya tampil di lembar (data-lembar)`, shIssues.length === 0, shIssues.join(' | '));
    check(`babak ${n} · ${p.id}: lembar ditutup (${closeHow}) dan fokus kembali ke pembukanya`, c.closed && c.focusBack, JSON.stringify({ closed: c.closed, focus: c.focus }));
    p.sheets = (p.sheets ?? 0) + (o.opened ? 1 : 0);
  }

  /** ANSWERING: five options, one timer, the send button, the layout of the tray; specials; the decision through the UI. */
  async function answerFlow(p, ctx) {
    const { n, idx, round } = ctx;
    const page = p.page;
    await page.waitForFunction(() => document.querySelectorAll('[data-fase="answering"] [data-pilihan]').length > 0, { timeout: 15000 });
    // Park the pointer in a corner (no click): a hover tint left by an earlier tap/click must not look like a selection on screenshots.
    await page.mouse.move(1, 1);
    await page.evaluate(() => window.__uji.settle());
    const e = sceneExpect(idx, p.name, p.start.flags, 'answering', p.start.variant);
    const st = await readRound(page);
    if (p.reducedMotion) p.anims = [...(p.anims ?? []), ...(await page.evaluate(() => window.__uji.longAnimations())).map((a) => ({ n, ...a }))];
    const wantTexts = round.choices.map((c) => ({ c, text: norm(personal(M.choiceText(round, c), p.name)) }));
    // Five options with the round's texts (personalized), radio semantics, no A–E letters, and no form mark on any card
    // (an option's text says what it does; a pre-send form badge could single out the action options).
    const optIssues = [];
    const matched = st.options.map((o) => {
      const hit = wantTexts.find((w) => o.text === w.text) ?? null;
      if (!hit) {
        const near = wantTexts.find((w) => o.text.endsWith(w.text) || o.text.startsWith(w.text));
        optIssues.push(near ? `kartu ${near.c.id} memuat teks tambahan "${short(o.text.replace(near.text, '').trim(), 30)}" (tanda bentuk?)` : `pilihan "${short(o.text, 40)}" bukan teks babak ini`);
      }
      if (o.role !== 'radio' || !['true', 'false'].includes(o.checked)) optIssues.push(`role=${o.role} aria-checked=${o.checked}`);
      if (o.letters.length) optIssues.push(`huruf ${o.letters.join('')} pada pilihan`);
      return hit ? { handle: o.handle, choice: hit.c } : null;
    });
    if (new Set(matched.filter(Boolean).map((m) => m.choice.id)).size !== wantTexts.length || st.options.length !== wantTexts.length) optIssues.push(`${st.options.length} pilihan tampil, ${new Set(matched.filter(Boolean).map((m) => m.choice.id)).size} unik dari ${wantTexts.length}`);
    check(`babak ${n} · ${p.id} menjawab: ${wantTexts.length} pilihan babak ini (radio, tanpa huruf A–E, tanpa tanda bentuk pada kartu)`, optIssues.length === 0, optIssues.join(' | '));
    p.orders = { ...(p.orders ?? {}), [n]: matched.map((m) => m?.choice.id ?? '?') };
    const small = st.options.filter((o) => o.fontSize < 15 || o.height < 44 || o.clipped);
    check(`babak ${n} · ${p.id}: teks pilihan >= 15 px, kartu >= 44 px, tidak terpotong`, small.length === 0, st.options.map((o) => `${o.fontSize}px/${o.height}px${o.clipped ? '/TERPOTONG' : ''}`).join(' '));
    const oneTimer = st.timers === 1 && st.timersShown === 1 && st.roleTimers === 1 && /\d/.test(st.timerLabel ?? '');
    check(`babak ${n} · ${p.id}: tepat satu timer jawaban (data-timer) terlihat`, oneTimer, JSON.stringify({ dataTimer: st.timers, terlihat: st.timersShown, roleTimer: st.roleTimers, label: st.timerLabel }));
    check(`babak ${n} · ${p.id}: tombol konfirmasi (data-kirim) "${e.actionLabel}"`, st.kirim?.text === norm(e.actionLabel) && !st.kirim.disabled, JSON.stringify(st.kirim));
    // The context stays with the options (no "Baca lagi" hiding): every line still on the page.
    const ctxIssues = orderIssues(st.actText, e.all.map((l) => norm(l.text)));
    check(`babak ${n} · ${p.id} menjawab: konteks (semua baris${e.evidence.length ? ' + pembuka berkas' : ''}) tetap tampil bersama pilihan`, ctxIssues.length === 0 && st.openers.filter((o) => !o.marker).length === e.evidence.length, [...ctxIssues, `${st.openers.filter((o) => !o.marker).length} pembuka`].join(' | '));
    const rem = p.start.reminders.map((r) => norm(reminderText({ ...r, label: personal(r.label, p.name) })));
    if (rem.length || st.pengingat.length) check(`babak ${n} · ${p.id} menjawab: pengingat pribadi ${rem.length ? 'tetap tampil' : 'tidak tampil'}`, st.pengingat.length === rem.length && rem.every((r, i) => st.pengingat[i]?.includes(r)), JSON.stringify(st.pengingat));
    // The holder's one-line reminder under the question, on screen when the options open; nobody else gets one.
    const oneLines = p.start.reminders.map((r) => norm(`${K.pengingat} ${reminderLineText({ ...r, label: personal(r.label, p.name) })}`));
    if (oneLines.length) {
      const where = await page.evaluate((ls) => ls.map((l) => window.__uji.lineOf(l)), oneLines);
      check(`babak ${n} · ${p.id} (${p.vpName}) menjawab: pengingat satu baris di bawah pertanyaan tampil di layar saat pilihan dibuka (pemegang tanda)`, where.every((w) => w && w.shown && w.onScreen), JSON.stringify(where));
      if (where.some((w) => w?.truncated)) note({ babak: n, layar: p.id, catatan: 'pengingat satu baris terpotong elipsis (pengingat lengkap tetap di atas kegiatan)', rincian: where });
    } else if (M.rounds[idx].flagEffects.length) check(`babak ${n} · ${p.id} menjawab: tanpa pengingat satu baris (bukan pemegang tanda)`, !st.pageText.includes(K.pengingat));
    // Field scene while answering: on a short landscape phone the markers give way (the numbered list stays complete).
    if (round.layout === 'field' && !p.blockImages && e.evidence.some((x) => x.spot)) {
      const vpx = VP[p.vpName];
      const shortLandscape = !!vpx.isLandscape && vpx.height <= 500;
      const marks = st.openers.filter((o) => o.marker);
      const marksShown = marks.filter((o) => o.shown).length;
      const listShown = st.openers.filter((o) => !o.marker && o.shown).length;
      check(`babak ${n} · ${p.id} (${p.vpName}) menjawab: ${shortLandscape ? 'penanda adegan disembunyikan (HP mendatar pendek)' : 'penanda adegan tetap tampil'}, daftar titik tetap lengkap`, (shortLandscape ? marks.length > 0 && marksShown === 0 : marksShown === e.evidence.filter((x) => x.spot).length) && listShown === e.evidence.length, JSON.stringify({ penanda: marks.length, penandaTampil: marksShown, daftarTampil: listShown, daftar: e.evidence.length }));
    }
    if (e.layout === 'chat') check(`babak ${n} · ${p.id} menjawab: chat tanpa ilustrasi kedua`, st.media.length === 0, st.media.join(', '));
    // Replies and outcome notes never before close.
    const leaks = round.choices.flatMap((c) => [C.textKey.choiceReply(round.id, c.id), C.textKey.choiceConsequence(round.id, c.id)]).map((key) => norm(personal(M.t(key), p.name))).filter((x) => x.length >= 12 && st.pageText.includes(x) && !M.publicText.includes(x));
    check(`babak ${n} · ${p.id} menjawab: tanpa balasan/akibat sebelum jawaban ditutup`, leaks.length === 0, leaks.map((x) => short(x, 40)).join(' | '));
    await audit(p, `babak ${n} menjawab`, forbiddenFor(p));
    // Layout: what the screen shows as the app left it, each option brought into view, the last option.
    if (ctx.shoot) await shot(p, n, 'menjawab-awal');
    const lay = await page.evaluate((src, prompt) => window.__uji.measureOptions(src, prompt), cueSrc, norm(e.prompt));
    if (ctx.shoot) await shot(p, n, 'menjawab-opsi-terakhir');
    // Readable = on screen, a tap on it reaches it, no bar over it and nothing that stays on screen over its text.
    const readable = (c) => c.inView && c.centerHit && c.barCovered <= 1 && c.textCovered <= 1;
    const unreadable = lay.missing ? [] : lay.each.map((c, i) => ({ c, i })).filter(({ c }) => !readable(c));
    for (const { c, i } of unreadable.slice(0, 1)) {
      await page.evaluate((y) => window.scrollTo(0, y), c.y);
      await sleep(150);
      await shot(p, n, `opsi-${i + 1}-tertutup`);
    }
    // Document (once per participant) a cue that overlaps only the edge of a card, not its text.
    const edge = lay.missing ? -1 : lay.each.findIndex((c) => readable(c) && c.covered > 1);
    if (edge >= 0 && !p.edgeShot) {
      p.edgeShot = true;
      await page.evaluate((y) => window.scrollTo(0, y), lay.each[edge].y);
      await sleep(150);
      await shot(p, n, `opsi-${edge + 1}-isyarat-di-tepi`);
    }
    const bottom = lay.missing ? null : await page.evaluate(() => window.__uji.bottomCheck());
    await page.evaluate((y) => window.scrollTo(0, y), lay.start?.y ?? 0);
    if (lay.missing) check(`babak ${n} · ${p.id}: pilihan & tombol kirim terukur`, false, JSON.stringify(lay));
    else {
      const firstScreen = lay.start.options.filter(readable).length;
      const hiddenBelow = lay.start.options.filter((c) => !readable(c) && c.bottom > 0).length;
      metric({ n, id: p.id, vp: p.vpName, layar: firstScreen, bawah: hiddenBelow, gulirPerlu: lay.scrollNeeded, satuLayar: lay.screen, isyarat: lay.start.cue?.n ?? null, isyaratDiBilah: lay.start.cue?.inBar ?? null, bilah: lay.dockHeight, area: lay.start.area });
      // When the options open the app brings the question and the five options into view above the sticky bar: when
      // that area fits, every option is readable without scrolling. (Not judged when the participant was still busy
      // with an evidence sheet as the options opened: the app then leaves the page where the reader is.)
      // The host opens the options only after every screen's reading checks; only a room that opened them by itself
      // (reading time over) can catch a participant still in a sheet.
      const openedAt = watch.answeringAt[n] ?? null;
      const busy = !ctx.openedByHost && !!openedAt && !!p.sceneDoneAt && p.sceneDoneAt > openedAt;
      if (lay.start.area.fits && !busy) check(`babak ${n} · ${p.id} (${p.vpName}): pertanyaan + lima pilihan muat di atas bilah -> semua langsung terbaca saat pilihan dibuka (gulir otomatis memperhitungkan bilah)`, firstScreen === lay.count, JSON.stringify({ terlihatAwal: firstScreen, area: lay.start.area, y: lay.start.y, isyarat: lay.start.cue }));
      else if (busy) note({ babak: n, layar: p.id, catatan: 'pilihan dibuka saat alat masih memeriksa berkas di waktu baca; gulir otomatis tidak dinilai', area: lay.start.area });
      if (lay.start.cue && !lay.start.cue.inBar) check(`babak ${n} · ${p.id} (${p.vpName}): isyarat "pilihan lagi" berada di dalam bilah`, false, JSON.stringify(lay.start.cue));
      check(`babak ${n} · ${p.id} (${p.vpName}): setiap pilihan bisa dibawa ke layar utuh — tidak tertutup bilah, teks tidak tertutup apa pun`, unreadable.length === 0, lay.each.map((c, i) => `${i + 1}:${c.height}px/${readable(c) ? 'ok' : `TERTUTUP(bilah ${c.barCovered}px², teks ${c.textCovered}px² ${c.by.join(',')}${c.centerHit ? '' : ', tap tidak kena'})`}`).join(' '));
      const padOnly = lay.each.filter((c) => readable(c) && c.covered > 1);
      if (padOnly.length) note({ babak: n, layar: p.id, catatan: 'isyarat/bagian bilah menutupi tepi kartu pilihan (bukan teksnya) saat pilihan dibawa ke layar', rincian: padOnly.map((c) => `${c.covered}px² ${c.by.join(',')}`) });
      check(`babak ${n} · ${p.id} (${p.vpName}): tombol kirim terlihat & terjangkau (awal dan di pilihan terakhir)`, readable(lay.start.kirim) && readable(lay.atLast.kirim), JSON.stringify({ awal: lay.start.kirim, akhir: lay.atLast.kirim }));
      const lastFirst = readable(lay.start.options[lay.start.options.length - 1]);
      const cueOk = lastFirst || (!!lay.start.cue && lay.start.cue.n >= 1);
      check(`babak ${n} · ${p.id} (${p.vpName}): pilihan terakhir ${lastFirst ? 'langsung terlihat' : `perlu gulir ${lay.scrollNeeded}px (<= 1 layar ${lay.screen}px) dengan isyarat "${lay.start.cue ? fmt(K.pilihanLagi, { n: lay.start.cue.n }) : '-'}"`}`, cueOk && lay.scrollNeeded <= lay.screen, JSON.stringify({ terlihatAwal: firstScreen, diBawah: hiddenBelow, isyarat: lay.start.cue, gulir: lay.scrollNeeded, layar: lay.screen }));
      check(`babak ${n} · ${p.id} (${p.vpName}): di dasar halaman pilihan terakhir tidak tertutup bilah`, !!bottom?.last && bottom.last.barCovered <= 1 && bottom.last.textCovered <= 1, JSON.stringify(bottom?.last));
      if (lay.start.cue && lay.atLast.cue) note({ babak: n, layar: p.id, catatan: 'isyarat "pilihan lagi" masih tampil saat pilihan terakhir sudah terlihat', isyarat: lay.atLast.cue });
    }
    const choice = p.choice;
    const target = choice ? matched.find((m) => m?.choice.id === choice.id) : null;
    // Text zoom 200% (font sizes only) or page zoom 200% (CSS zoom): options and the send button stay usable.
    const zoom = special('zoomText', p, n) ? 'teks' : special('zoomPage', p, n) ? 'halaman' : null;
    if (zoom) {
      if (zoom === 'teks') await page.evaluate(() => window.__uji.textZoom(2));
      else await page.evaluate(() => (document.documentElement.style.zoom = '2'));
      await sleep(400);
      const z = await page.evaluate(() => window.__uji.zoomCheck());
      const ok = !z.overflow && z.each.every((c) => readable(c) && !c.clipped) && !!z.kirim && readable(z.kirim);
      const bad = z.each.findIndex((c) => !readable(c) || c.clipped);
      if (bad >= 0) {
        await page.evaluate((y) => window.scrollTo(0, y), z.each[bad].y);
        await sleep(150);
        await shot(p, n, `zoom-${zoom}-200-opsi-${bad + 1}-tertutup`);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(p, n, `zoom-${zoom}-200`);
      check(`babak ${n} · ${p.id}: ${zoom === 'teks' ? 'teks 200%' : 'zoom halaman 200%'} — ${st.options.length} pilihan terbaca & tombol kirim terjangkau, tanpa gulir samping`, ok, JSON.stringify({ luapan: z.overflow, pilihan: z.each.map((c, i) => `${i + 1}:${c.height}px/${c.fontSize}px${c.barCovered > 1 || c.textCovered > 1 ? `/TERTUTUP(bilah ${c.barCovered}px², teks ${c.textCovered}px² ${c.by.join(',')})` : ''}${c.clipped ? '/terpotong' : ''}${c.centerHit ? '' : '/tap-tidak-kena'}`), kirim: { terlihat: z.kirim?.inView, tinggi: z.kirim?.height, kena: z.kirim?.centerHit } }));
      state.special.push({ n, id: p.id, uji: `zoom ${zoom} 200%`, ok });
    }
    // The decision below is made at that zoom; the page returns to 100% once it is sent (or the round closes).
    const unzoom = async () => {
      if (zoom === 'teks') await page.evaluate(() => window.__uji.textZoomOff()).catch(() => {});
      else if (zoom === 'halaman') await page.evaluate(() => (document.documentElement.style.zoom = '')).catch(() => {});
    };
    if (!choice) {
      // Planned timeout: the urgent timer just before the deadline, nothing sent.
      await sleep(Math.max(0, ctx.deadline - 3500 - Date.now()));
      const late = await readRound(page);
      await shot(p, n, 'hampir-habis');
      check(`babak ${n} · ${p.id}: rencana waktu habis — belum terkirim, timer mendesak ("!") saat <= 5 detik`, !late.terkirim && late.options.length > 0 && /^!/.test(late.timerText ?? '') && (secondsOf(late.timerLabel) ?? 99) <= 5, JSON.stringify({ timer: late.timerText, label: late.timerLabel }));
      await unzoom();
      return;
    }
    if (!target) {
      p.answerErrors.push(`babak ${n}: pilihan rencana ${choice.id} tidak ditemukan`);
      await unzoom();
      return;
    }
    // The confirm label follows the selected option's form. In a chat round offering both forms the other form is
    // selected first (label checked), then the planned option (label checked again): both directions, one send.
    const kirimText = () => page.evaluate(() => window.__uji.n(document.querySelector('[data-fase] [data-kirim]')?.textContent ?? ''));
    const formOf = (c) => c.form ?? 'message';
    const labelFor = (c) => norm(confirmLabelFor(round.layout, e.actionLabel, formOf(c)));
    let probe = null;
    if (round.layout === 'chat' && new Set(round.choices.map(formOf)).size > 1) {
      const other = matched.find((m) => m && formOf(m.choice) !== formOf(target.choice));
      if (other) {
        const s0 = await selectOption(p, other.handle);
        probe = { id: other.choice.id, form: formOf(other.choice), checked: s0.checked, label: await kirimText(), want: labelFor(other.choice) };
      }
    }
    const sel = await selectOption(p, target.handle);
    check(`babak ${n} · ${p.id}: pilihan dipilih (${sel.how}) — aria-checked`, sel.checked, sel.how);
    const label = await kirimText();
    check(`babak ${n} · ${p.id}: tombol konfirmasi mengikuti bentuk pilihan terpilih (${probe ? `${probe.form} "${probe.want}", lalu ` : ''}${formOf(target.choice)} "${labelFor(target.choice)}")`, label === labelFor(target.choice) && (!probe || (probe.checked && probe.label === probe.want)), JSON.stringify({ coba: probe, label }));
    if (probe) state.special.push({ n, id: p.id, uji: `label tombol ${probe.form} -> ${formOf(target.choice)}`, ok: label === labelFor(target.choice) && probe.checked && probe.label === probe.want });
    // Opening a sheet keeps the selection and the timer (and adds no second primary timer).
    if (special('sheetState', p, n) && e.evidence.length) {
      const ev = e.evidence[(n + 1) % e.evidence.length];
      const before = await readRound(page);
      const endsAt = watch.pub?.phaseEndsAt;
      const o = await openSheet(p, ev.id);
      await sleep(1800);
      const sh = o.opened ? await readSheet(page) : null;
      const during = await readRound(page);
      const c = o.opened ? await closeSheet(p, ev.id, p.input === 'keyboard' ? 'escape' : 'tombol') : { closed: false };
      const after = await readRound(page);
      const t0 = secondsOf(before.timerLabel);
      const t1 = secondsOf(after.timerLabel);
      const serverLeft = Math.ceil(((watch.pub?.phaseEndsAt ?? 0) - Date.now()) / 1000);
      const keep = after.options.filter((x) => x.checked === 'true').map((x) => x.handle);
      const ok = o.opened && c.closed && JSON.stringify(keep) === JSON.stringify([target.handle]) && t0 !== null && t1 !== null && t1 < t0 && Math.abs(t1 - serverLeft) <= 2 && watch.pub?.phaseEndsAt === endsAt && (sh?.timers ?? 0) >= 1 && during.timers === 1;
      check(`babak ${n} · ${p.id}: lembar berkas dibuka & ditutup saat menjawab — pilihan tetap, timer berjalan (tidak direset), timer juga di lembar`, ok, JSON.stringify({ dibuka: o.how, terpilih: keep.length, timer: `${t0}->${t1} (server ${serverLeft})`, tenggat: watch.pub?.phaseEndsAt === endsAt, timerLembar: sh?.timers, dataTimer: during.timers, fokusKembali: c.focusBack }));
      state.special.push({ n, id: p.id, uji: 'lembar saat menjawab', ok });
    }
    // Reload in the middle of answering: the selection and the option order come back.
    if (special('reloadSelect', p, n)) {
      const orderBefore = (await readRound(page)).options.map((o) => o.handle);
      p.reloads.push(Date.now());
      await page.reload({ waitUntil: 'domcontentloaded' });
      const back = await page.waitForFunction((k) => document.querySelectorAll('[data-fase="answering"] [data-pilihan]').length === k, { timeout: 15000 }, orderBefore.length).then(
        () => true,
        () => false,
      );
      await sleep(400);
      const r = await readRound(page);
      const restored = r.options.filter((x) => x.checked === 'true').map((x) => x.handle);
      const ok = back && JSON.stringify(r.options.map((o) => o.handle)) === JSON.stringify(orderBefore) && JSON.stringify(restored) === JSON.stringify([target.handle]);
      await shot(p, n, 'muat-ulang-pilihan');
      check(`babak ${n} · ${p.id}: muat ulang di tengah menjawab — pilihan pulih, urutan pilihan sama, fase tetap`, ok && r.fase === 'answering', JSON.stringify({ fase: r.fase, urutanSama: JSON.stringify(r.options.map((o) => o.handle)) === JSON.stringify(orderBefore), terpilih: restored.length }));
      state.special.push({ n, id: p.id, uji: 'muat ulang saat memilih', ok });
    }
    // Other participants hold their decision while a special test needs the round open after its own send.
    if (!ctx.holders.includes(p.id) && ctx.gates.length) await Promise.race([Promise.all(ctx.gates.map((g) => g.promise)), sleep(Math.max(0, ctx.deadline - 7000 - Date.now()))]);
    const sendRes = await sendDecision(p, answeredRe.source);
    if (zoom) {
      await shot(p, n, `zoom-${zoom}-200-terkirim`);
      await unzoom();
    }
    const sentText = target.choice.form === 'action' && e.layout === 'chat' ? norm(fmt(K.terkirimTindakan, { teks: personal(M.choiceText(round, target.choice), p.name) })) : norm(personal(M.choiceText(round, target.choice), p.name));
    const sn = sendRes.snap;
    // Only a chat message is "Terkirim"; a chat action (its note) and every other decision (its card) are "Ditetapkan",
    // never "Terkirim" (DecisionTray SentContent).
    const sentWord = e.layout === 'chat' && target.choice.form !== 'action' ? K.terkirim : K.ditetapkan;
    const sentOk = sendRes.sent && (sendRes.closedFirst || (sn.text.includes(sentText) && sn.text.includes(sentWord) && !(sentWord === K.ditetapkan && sn.text.includes(K.terkirim)) && !sn.kirim && sn.options === 0 && sn.timers === 1 && sn.waiting));
    check(`babak ${n} · ${p.id}: keputusan dikirim (${sendRes.how}) — keadaan terkirim (data-terkirim) dengan teks sendiri + "${sentWord}", tombol hilang, satu timer, "menunggu peserta lain"`, sentOk, sendRes.closedFirst ? 'jawaban terakhir: room langsung menutup babak, hasil menggantikan keadaan terkirim' : JSON.stringify(sn ? { terkirim: short(sn.text, 80), kirim: sn.kirim, pilihan: sn.options, timer: sn.timers, menunggu: sn.waiting } : 'tidak ada keadaan terkirim'));
    if (sendRes.closedFirst) ctx.closedBy = p.id;
    if ((n === 1 || ctx.shoot) && !sendRes.closedFirst) await shot(p, n, 'terkirim');
    if (!sendRes.sent) p.answerErrors.push(`babak ${n}: tidak terkirim (${sendRes.how})`);
    try {
      // Reload after sending: the sent state, not the options; then a re-submission from another socket is refused.
      if (special('reloadSent', p, n) && sendRes.sent) {
        p.reloads.push(Date.now());
        await page.reload({ waitUntil: 'domcontentloaded' });
        const back = await page.waitForSelector('[data-fase="answering"] [data-terkirim]', { timeout: 15000 }).then(
          () => true,
          () => false,
        );
        await sleep(300);
        const r = await readRound(page);
        const ok = back && r.terkirim?.includes(sentText) && !r.kirim && r.options.length === 0;
        await shot(p, n, 'muat-ulang-terkirim');
        check(`babak ${n} · ${p.id}: muat ulang sesudah terkirim — keadaan terkirim dengan teks yang dikirim, tanpa pilihan/tombol`, ok, JSON.stringify({ fase: r.fase, terkirim: short(r.terkirim ?? '-', 60) }));
        state.special.push({ n, id: p.id, uji: 'muat ulang sesudah terkirim', ok });
        await resubmitFrom(p, ctx);
      }
      // Connection drop + reconnect after sending: same phase, decision kept.
      if (special('reconnect', p, n) && sendRes.sent) await reconnectFlow(p, ctx, sentText);
    } finally {
      for (const g of ctx.gatesOf[p.id] ?? []) g.resolve();
    }
  }

  /** A second connection of the same participant (its stored room credential, never printed) tries to answer again. */
  async function resubmitFrom(p, ctx) {
    const cred = await p.page.evaluate((c) => {
      try {
        return JSON.parse(window.localStorage.getItem(`raksa:story:sesi:${c}`) ?? 'null')?.credential ?? null;
      } catch {
        return null;
      }
    }, code);
    if (!cred) {
      check(`babak ${ctx.n} · ${p.id}: kredensial room tersimpan untuk uji kirim ulang`, false);
      return;
    }
    const s = await connect();
    try {
      const res = await rpc(s, 'participant:resume', { code, credential: cred });
      const me = res.data?.me;
      const sent = me?.answer?.handle ?? null;
      const other = me?.options?.find((o) => o.handle !== sent)?.handle ?? null;
      const changed = other ? await rpc(s, 'participant:answer', { roundId: ctx.round.id, option: other }) : null;
      const again = sent ? await rpc(s, 'participant:answer', { roundId: ctx.round.id, option: sent }) : null;
      const ok = res.ok && !!sent && changed && !changed.ok && changed.code === 'answered' && again?.ok && again.data.duplicate === true && again.data.elapsedMs === me.answer.elapsedMs;
      check(`babak ${ctx.n} · ${p.id}: kirim ulang dari koneksi kedua — pilihan lain ditolak ("answered"), pilihan sama = duplikat (waktu & nilai tetap)`, ok, JSON.stringify({ resume: res.ok ? 'ok' : res.code, lain: changed?.ok ? 'DITERIMA' : changed?.code, sama: again?.ok ? `dup=${again.data.duplicate}` : again?.code }));
      state.special.push({ n: ctx.n, id: p.id, uji: 'kirim ulang ditolak', ok });
      ctx.resubmitted.add(p.id);
    } finally {
      s.close();
    }
  }

  /** Close the page's sockets while the network is offline, then go back online: banner, then the same phase and decision. */
  async function reconnectFlow(p, ctx, sentText) {
    const page = p.page;
    const win = [Date.now(), null];
    p.offline.push(win);
    const open = await page.evaluate(() => (window.__ujiSockets ?? []).filter((s) => s.readyState === 1).length);
    await page.setOfflineMode(true);
    // Offline emulation may already end the WebSocket; whatever is still open is closed like a dropped link.
    const closedByTool = await page.evaluate(() => {
      let k = 0;
      for (const s of window.__ujiSockets ?? []) {
        if (s.readyState <= 1) {
          s.close();
          k++;
        }
      }
      return k;
    });
    const banner = await page.waitForFunction((w) => document.body.innerText.includes(w), { timeout: 5000, polling: 50 }, K.koneksiPutus.split('.')[0]).then(
      () => true,
      () => false,
    );
    await shot(p, ctx.n, 'koneksi-putus');
    await sleep(2500);
    await page.setOfflineMode(false);
    win[1] = Date.now();
    const back = await page.waitForFunction((w) => !document.body.innerText.includes(w), { timeout: 15000 }, K.koneksiPutus.split('.')[0]).then(
      () => true,
      () => false,
    );
    await sleep(600);
    const r = await readRound(page);
    const resumed = privatesOf(p).filter((x) => x.answer?.roundId === ctx.round.id).length;
    const ok = open > 0 && banner && back && r?.fase === watch.pub?.phase && r?.fase === 'answering' && !!r.terkirim?.includes(sentText) && !r.kirim;
    await shot(p, ctx.n, 'sambung-ulang');
    check(`babak ${ctx.n} · ${p.id}: koneksi putus (spanduk "${K.koneksiPutus.split('.')[0]}") lalu tersambung ulang — fase & keputusan terkirim tetap`, ok, JSON.stringify({ socketTerbuka: open, ditutupAlat: closedByTool, spanduk: banner, pulih: back, fase: r?.fase, server: watch.pub?.phase, terkirim: !!r?.terkirim, statusPribadiDenganJawaban: resumed }));
    state.special.push({ n: ctx.n, id: p.id, uji: 'sambung ulang', ok });
  }

  /** CONSEQUENCE: the own outcome inside the same activity, the round's score, nothing of the play phase left. */
  async function consequenceFlow(p, ctx) {
    const { n, idx, round } = ctx;
    const page = p.page;
    await page.waitForFunction(() => !!document.querySelector('[data-fase="consequence"] [data-hasil]'), { timeout: 15000 });
    await page.mouse.move(1, 1);
    await page.evaluate(() => window.__uji.settle());
    const st = await readRound(page);
    const e = outcomeExpect(idx, p.last, p.start.flags, p.name);
    const issues = outcomeIssues(st.hasil?.text ?? '', e);
    check(`babak ${n} · ${p.id} hasil (data-hasil, di dalam kegiatan): pilihan sendiri, balasan, akibat, ${e.badge}, status, pelajaran${e.recommended.length ? ', dianjurkan' : ''}${e.delayed.length ? ', dampak tertunda' : ''}`, !!st.hasil?.inActivity && st.aktivitas === round.layout && issues.length === 0, [!st.hasil?.inActivity ? 'hasil di luar kegiatan' : '', ...issues].filter(Boolean).join(' | '));
    check(`babak ${n} · ${p.id} hasil: nilai babak "${e.score}"`, st.rootText.includes(e.score), short(st.rootText.slice(st.rootText.indexOf('Nilai')), 80));
    const leftovers = [st.options.length ? 'pilihan' : '', st.kirim ? 'tombol kirim' : '', st.terkirim ? 'keadaan terkirim' : '', st.timers ? 'timer' : '', st.pengingat.length ? 'pengingat' : '', st.suasana ? 'chip status' : ''].filter(Boolean);
    check(`babak ${n} · ${p.id} hasil: tanpa sisa fase bermain (pilihan, tombol, timer, pengingat, chip status)`, leftovers.length === 0, leftovers.join(', '));
    // The thread keeps the participant's own private lines through the consequence.
    const sceneNow = sceneExpect(idx, p.name, p.start.flags, 'consequence');
    const own = sceneNow.lines.filter((l) => l.conditional).map((l) => norm(l.text));
    if (own.length) check(`babak ${n} · ${p.id} hasil: baris pribadi tetap di utas saat konsekuensi`, own.every((l) => st.actText.includes(l)), own.map((l) => short(l, 40)).join(' | '));
    for (const cnd of M.conditional.filter((x) => x.round === n && !p.start.flags.has(x.flag))) check(`babak ${n} · ${p.id} hasil: baris pribadi tanda ${cnd.flag} TIDAK ada (bukan pemegang)`, !st.pageText.includes(cnd.core));
    // The round's status line (mood variant of the band the round started in) stays in the thread after close.
    if (p.start.variant) check(`babak ${n} · ${p.id} hasil: baris status awal babak tetap di utas saat konsekuensi`, st.actText.includes(norm(personal(p.start.variant, p.name))));
    // A delayed effect's status line belongs to its holder's outcome only.
    if (M.rounds[idx].flagEffects.length && !e.delayed.length) check(`babak ${n} · ${p.id} hasil: tanpa baris dampak tertunda (bukan pemegang tanda)`, !st.pageText.includes(DAMPAK_PREFIX), short(st.pageText.slice(Math.max(0, st.pageText.indexOf(DAMPAK_PREFIX)), st.pageText.indexOf(DAMPAK_PREFIX) + 60), 60));
    p.kept = { hasil: st.hasil?.text ?? null, own, variant: p.start.variant ? norm(personal(p.start.variant, p.name)) : null, delayed: e.delayed, score: e.score };
    if (round.layout === 'chat') check(`babak ${n} · ${p.id} hasil: chat tanpa ilustrasi kedua`, st.media.length === 0, st.media.join(', '));
    const lesson = e.view.lesson ? norm(personal(e.view.lesson, p.name)) : null;
    if (lesson) check(`babak ${n} · ${p.id} hasil: satu pelajaran (tidak diulang)`, st.pageText.split(lesson).length - 1 === 1, `${st.pageText.split(lesson).length - 1}×`);
    await audit(p, `babak ${n} konsekuensi`, forbiddenFor(p));
    if (ctx.shoot) {
      await shot(p, n, 'konsekuensi');
      await shot(p, n, 'konsekuensi-penuh', { fullPage: true });
    }
    if (!p.last.choiceId) await shot(p, n, 'waktu-habis', { fullPage: true });
    if (p.last.delayedDelta) await shot(p, n, 'dampak-tertunda', { fullPage: true });
    p.outcomeText = st.hasil?.text ?? '';
    p.roundText = st.rootText;
  }

  /**
   * LEADERBOARD on a participant's device: the round stays on screen — its own outcome (unchanged since the consequence),
   * the round's score line, the own private lines and status line, delayed-effect notes for the holder only — with a
   * compact ranking card (data-peringkat: the top three and the own row) and what comes next.
   */
  async function leaderboardFlow(p, ctx, ranking) {
    const { n, idx, round } = ctx;
    const page = p.page;
    const scope = '[data-fase="leaderboard"] [data-peringkat]';
    await page.waitForSelector(scope, { timeout: 15000 });
    await page.mouse.move(1, 1);
    const rows = await readRows(page, scope);
    const mine = ranking.find((r) => r.name === p.name);
    // The own rank sits in the bar docked at the bottom of the screen ([data-langkah]), the card lists the top three.
    const own = await page.evaluate(() => (document.querySelector('[data-fase="leaderboard"] [data-langkah] .sr-peringkat-saya')?.textContent ?? '').trim());
    const want = compactRanking(ranking, p.name);
    const issues = rankingIssues(rows, want);
    check(`babak ${n} · ${p.id} peringkat (data-peringkat, kartu ringkas: 3 teratas${want.length > 3 ? ' + baris sendiri' : ''}; peringkat sendiri di bilah data-langkah): nilai kumulatif = mesin bersama`, issues.length === 0 && rows.find((r) => r.saya)?.name === p.name && own === fmt(K.peringkatmu, { rank: mine.rank, of: everyone.length }), [...issues, own].join(' | '));
    const st = await readRound(page);
    const k = p.kept;
    const stay = [];
    if (!k) stay.push('konsekuensi babak ini tidak terbaca (lihat galat di atas)');
    if (st.aktivitas !== round.layout) stay.push(`kegiatan ${st.aktivitas} ≠ ${round.layout}`);
    if (!st.rootText.includes(babak(n))) stay.push(`bukan babak ${n}`);
    if (!st.hasil) stay.push('hasil (data-hasil) hilang');
    else {
      if (!st.hasil.inActivity) stay.push('hasil di luar kegiatan');
      if (k?.hasil && st.hasil.text !== k.hasil) stay.push('teks hasil berubah sejak konsekuensi');
    }
    if (k?.score && !st.rootText.includes(k.score)) stay.push('nilai babak hilang');
    for (const l of k?.own ?? []) if (!st.actText.includes(l)) stay.push(`baris pribadi hilang "${short(l, 30)}"`);
    if (k?.variant && !st.actText.includes(k.variant)) stay.push('baris status awal babak hilang');
    for (const d of k?.delayed ?? []) if (!(st.hasil?.text ?? '').includes(d)) stay.push('baris dampak tertunda hilang');
    const leftovers = [st.options.length ? 'pilihan' : '', st.kirim ? 'tombol kirim' : '', st.terkirim ? 'keadaan terkirim' : '', st.timers ? 'timer' : '', st.pengingat.length ? 'pengingat' : '', st.suasana ? 'chip status' : ''].filter(Boolean);
    check(`babak ${n} · ${p.id} peringkat: layar babak tetap — hasil sendiri sama seperti saat konsekuensi, nilai babak${k?.own?.length ? ', baris pribadi' : ''}${k?.delayed?.length ? ', dampak tertunda' : ''}; tanpa sisa fase bermain`, stay.length === 0 && leftovers.length === 0, [...stay, ...leftovers].join(' | '));
    for (const cnd of M.conditional.filter((x) => x.round === n && !p.start.flags.has(x.flag))) check(`babak ${n} · ${p.id} peringkat: baris pribadi tanda ${cnd.flag} TIDAK ada (bukan pemegang)`, !st.pageText.includes(cnd.core));
    if (M.rounds[idx].flagEffects.length && !k?.delayed?.length) check(`babak ${n} · ${p.id} peringkat: tanpa baris dampak tertunda (bukan pemegang tanda)`, !st.pageText.includes(DAMPAK_PREFIX));
    // What comes next: the host paces this room (no countdown), or the next round's countdown.
    const next = st.rootText.includes(K.menungguHost) || new RegExp(patternOf(K.babakMulaiDalam, ['m', 'n'])).test(st.rootText);
    check(`babak ${n} · ${p.id} peringkat: keterangan langkah berikutnya`, next, short(st.rootText.slice(-140), 140));
    // Where the outcome and the card sit on the screen as the page is left (visible px of each).
    const geo = await page.evaluate(() => {
      const vis = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), terlihat: Math.round(Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0))) };
      };
      return { y: Math.round(window.scrollY), vh: window.innerHeight, hasil: vis(document.querySelector('[data-hasil]')), kartu: vis(document.querySelector('[data-peringkat]')), bilah: vis(document.querySelector('[data-fase="leaderboard"] [data-langkah]')) };
    });
    metric({ n, id: p.id, vp: p.vpName, fase: 'leaderboard', ...geo });
    // The own rank and what comes next are on screen without scrolling; an outcome that fits above the bar is not under it.
    const barOn = !!geo.bilah && geo.bilah.top >= 0 && geo.bilah.bottom <= geo.vh + 1;
    const fits = !!geo.hasil && !!geo.bilah && geo.hasil.bottom - geo.hasil.top <= geo.bilah.top - 16;
    check(`babak ${n} · ${p.id} peringkat: bilah peringkat & langkah berikutnya di layar tanpa menggulir`, barOn, JSON.stringify(geo.bilah));
    // Not after a full-page screenshot in the consequence (it can move the page; see shot()).
    const shotMoved = ctx.shoot || !p.last.choiceId || !!p.last.delayedDelta;
    if (!shotMoved && fits && geo.hasil.top >= 0) check(`babak ${n} · ${p.id} peringkat: hasil tidak tertutup bilah`, geo.hasil.bottom <= geo.bilah.top + 1, JSON.stringify({ hasil: geo.hasil, bilah: geo.bilah }));
    await audit(p, `babak ${n} peringkat`, forbiddenFor(p));
    if (n === 1 || ctx.shoot) {
      await shot(p, n, 'peringkat');
      await shot(p, n, 'peringkat-penuh', { fullPage: true });
    }
  }

  // ---- projector & host per phase
  async function projectorFlow(ctx, phase) {
    const { n, idx, round } = ctx;
    const page = proj.page;
    const e = sceneExpect(idx, K.namaUmum, null, phase);
    // Round 1 shows the opening alone for its share of the reading time; then the activity.
    await page.waitForFunction((ph) => !!document.querySelector(`[data-fase="${ph}"] [data-aktivitas]`), { timeout: phase === 'scene' ? 40000 : 15000 }, phase);
    const st = await readRound(page, e.evidence.map((x) => norm(x.title)));
    const prompt = norm(e.prompt);
    const pr = await page.evaluate((pt) => window.__uji.projector(pt), prompt);
    // innerText applies CSS text-transform (labels are upper-case on the big screen): compare without case.
    const seen = pr.visible.toLocaleLowerCase('id');
    const visible = (x) => seen.includes(String(x).toLocaleLowerCase('id'));
    const issues = [];
    if (st.aktivitas !== e.layout) issues.push(`kegiatan ${st.aktivitas} ≠ ${e.layout}`);
    if (!st.pageText.includes(babak(n))) issues.push(`"${babak(n)}" tidak ada`);
    if (!st.rootText.includes(norm(e.title))) issues.push('judul tidak ada');
    // Only the round's newest public lines (every phone holds the whole conversation), in order.
    const allLines = e.lines.map((l) => norm(l.text));
    const newest = allLines.slice(-PROJECTOR_LINES);
    issues.push(...orderIssues(st.actText, newest));
    const olderShown = allLines.slice(0, -PROJECTOR_LINES).filter((l) => l.length >= 12 && !newest.some((x) => x.includes(l)) && visible(l));
    if (olderShown.length) issues.push(`${olderShown.length} baris lama ikut tampil (harap ${PROJECTOR_LINES} baris terbaru)`);
    // The shared evidence in ONE focus panel while the round is played: one item at a time, taking turns (projectorTurnMs)
    // counted from the scene's start; after close the lesson takes the panel.
    const scenePub = watch.publics.filter((s) => s.roundNumber === n && s.sceneStartedAt != null).pop() ?? null;
    let turnInfo = null;
    if (e.evidence.length) {
      const titles = e.evidence.map((x) => norm(x.title));
      const shownIdx = titles.map((t, i) => (pr.headings.includes(t) ? i : -1)).filter((i) => i >= 0);
      if (phase === 'consequence') {
        if (shownIdx.length) issues.push(`${shownIdx.length} berkas masih tampil sesudah jawaban ditutup`);
      } else {
        const elapsed = scenePub ? Date.now() - scenePub.sceneStartedAt : null;
        const turnMs = projectorTurnMs(titles.length, scenePub?.readingMs ?? null);
        const turn = elapsed === null ? 0 : Math.floor(Math.max(0, elapsed) / turnMs) % titles.length;
        const edge = elapsed !== null && Math.min(elapsed % turnMs, turnMs - (elapsed % turnMs)) < 800;
        const okTurns = new Set([turn, ...(edge ? [(turn + 1) % titles.length, (turn + titles.length - 1) % titles.length] : [])]);
        turnInfo = { tampil: shownIdx.map((i) => i + 1), giliran: turn + 1, dariAwalAdegan: elapsed };
        if (shownIdx.length !== 1) issues.push(`${shownIdx.length} berkas tampil bersamaan (harap 1)`);
        else if (!okTurns.has(shownIdx[0])) issues.push(`berkas ${shownIdx[0] + 1} tampil, giliran ${turn + 1}`);
        else {
          const ev = e.evidence[shownIdx[0]];
          if (!visible(evidenceWord(ev))) issues.push(`kata di atas judul berkas ${ev.id} tidak tampil`);
          for (const r of ev.rows) if (!visible(norm(r.label))) issues.push(`baris berkas ${ev.id}.${r.id} tidak tampil`);
          if (ev.body && !visible(norm(ev.body))) issues.push(`isi berkas ${ev.id} tidak tampil`);
        }
      }
    }
    // The task under the title in the rail, fully on screen and not at the bottom edge.
    if (phase !== 'consequence' && prompt) {
      if (!pr.prompt) issues.push('tugas babak tidak tampil');
      else if (pr.prompt.top < 0 || pr.prompt.bottom > pr.vh || pr.prompt.top > pr.vh * 0.6) issues.push(`tugas di y ${pr.prompt.top}-${pr.prompt.bottom} dari ${pr.vh} (harap di kolom atas, utuh)`);
    }
    if (phase === 'consequence' && e.lesson && !visible(norm(e.lesson))) issues.push('pelajaran tidak tampil sesudah jawaban ditutup');
    if (phase !== 'consequence' && M.t(C.textKey.roundLesson(round.id)) && st.pageText.includes(norm(personal(M.t(C.textKey.roundLesson(round.id)), K.namaUmum)))) issues.push('pelajaran tampil sebelum jawaban ditutup');
    if (pr.scrolls) issues.push('halaman layar acara bisa digulir (harap tepat satu layar)');
    check(`babak ${n} · layar acara (${phase}): kegiatan "${e.layout}", ${PROJECTOR_LINES} baris publik terbaru, tugas di kolom kanan, ${phase === 'consequence' ? 'pelajaran di panel fokus' : 'satu berkas bergiliran di panel fokus'}`, issues.length === 0, [...issues, turnInfo ? JSON.stringify(turnInfo) : ''].filter(Boolean).join(' | '));
    // The reading countdown is the phones' one: to the end of the shared reading time (sceneStartedAt + readingMs).
    if (phase === 'scene' && scenePub?.readingMs != null) {
      const m = new RegExp(patternOf(K.pilihanDibuka, ['n']), 'i').exec(pr.visible);
      const want = Math.ceil(Math.max(0, scenePub.sceneStartedAt + scenePub.readingMs - Date.now()) / 1000);
      const ok = m ? Math.abs(Number(m[1]) - want) <= 1 : want <= 1 && visible(K.pilihanSegera);
      check(`babak ${n} · layar acara (adegan): hitung mundur "Pilihan dibuka dalam N detik" = sisa waktu baca bersama`, ok, `${m ? m[1] : 'tanpa angka'} / harap ${want}`);
    }
    // Text size on the big screen: every visible word of the round at >= PROJECTOR_MIN_FONT px.
    const words = pr.fonts.reduce((s, f) => s + f.words, 0);
    const smallFonts = pr.fonts.filter((f) => f.px < PROJECTOR_MIN_FONT);
    const minPx = pr.fonts.length ? Math.min(...pr.fonts.map((f) => f.px)) : null;
    metric({ n, id: 'proyektor', fase: phase, kata: words, kataKecil: smallFonts.reduce((s, f) => s + f.words, 0), pxMin: minPx, pxMedian: pr.fonts.length ? [...pr.fonts.map((f) => f.px)].sort((a, b) => a - b)[Math.floor(pr.fonts.length / 2)] : null });
    check(`babak ${n} · layar acara (${phase}): semua teks babak yang terlihat >= ${PROJECTOR_MIN_FONT} px`, smallFonts.length === 0, smallFonts.length ? smallFonts.slice(0, 6).map((f) => `${f.cls} ${f.px}px`).join(', ') : `terkecil ${minPx}px`);
    // Neutral: nothing private, no options, no outcome.
    const priv = [];
    if (st.options.length) priv.push(`${st.options.length} pilihan`);
    if (st.kirim) priv.push('tombol kirim');
    if (st.terkirim) priv.push('keadaan terkirim');
    if (st.hasil) priv.push('hasil pribadi');
    if (st.pengingat.length) priv.push('pengingat');
    if (st.suasana) priv.push('chip status');
    if (st.openers.length) priv.push(`${st.openers.length} tombol berkas (layar tidak disentuh)`);
    for (const c of round.choices) {
      const txt = norm(personal(M.choiceText(round, c), K.namaUmum));
      if (st.pageText.includes(txt)) priv.push(`teks pilihan ${c.id}`);
      for (const key of [C.textKey.choiceReply(round.id, c.id), C.textKey.choiceConsequence(round.id, c.id)]) {
        const x = norm(personal(M.t(key), K.namaUmum));
        if (x.length >= 12 && st.pageText.includes(x) && !M.publicText.includes(x)) priv.push(`balasan/akibat ${c.id}`);
      }
    }
    for (const cnd of M.conditional) if (st.pageText.includes(cnd.core)) priv.push(`baris pribadi ${cnd.flag}`);
    for (const f of M.flags) {
      const label = norm(M.flagLabel(f));
      if (label && st.pageText.includes(label) && !M.publicText.includes(label)) priv.push(`label tanda ${f}`);
    }
    check(`babak ${n} · layar acara (${phase}): netral — tanpa pilihan, hasil, pengingat, status, baris/label pribadi`, priv.length === 0, priv.join(', '));
    if (phase === 'answering') {
      const count = new RegExp(patternOf(K.layarSudahMenjawab, ['sudah', 'total'])).test(st.pageText);
      check(`babak ${n} · layar acara menjawab: satu timer besar + jumlah yang sudah menjawab`, st.roleTimers === 1 && count, JSON.stringify({ timer: st.roleTimers, jumlah: count }));
    }
    if (e.layout === 'chat') check(`babak ${n} · layar acara (${phase}): chat tanpa ilustrasi kedua`, st.media.length === 0, st.media.join(', '));
    await audit(proj, `babak ${n} ${phase}`, forbiddenFor(proj));
    if (ctx.shoot) await shot(proj, n, { scene: 'adegan', answering: 'menjawab', consequence: 'konsekuensi' }[phase]);
  }

  async function hostFlow(ctx, phase) {
    const { n, idx, round } = ctx;
    const e = sceneExpect(idx, K.namaUmum, null, phase);
    await host.page.waitForFunction((label) => (document.querySelector('.stf-fase')?.textContent ?? '').includes(label), { timeout: 15000 }, `babak ${n}/${M.count}`);
    const h = await host.page.evaluate(() => {
      const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
      const k = document.querySelector('[data-kegiatan]');
      return {
        line: [...(document.querySelector('.stf-babak-kini')?.children ?? [])].map((s) => n(s.textContent)),
        kegiatan: k?.dataset.kegiatan ?? null,
        angka: k ? [...k.querySelectorAll('dd')].map((d) => n(d.textContent)) : [],
        text: n(document.body.textContent),
      };
    });
    const want = [LAYOUT_LABEL[e.layout], String(e.evidence.length), norm(e.actionLabel)];
    const ok = h.line[0] === norm(e.title) && h.kegiatan === e.layout && JSON.stringify(h.angka) === JSON.stringify(want) && h.line.some((x) => x.includes(K.babakKunci)) === e.keyRound;
    check(`babak ${n} · konsol host (${phase}): judul, kegiatan "${LAYOUT_LABEL[e.layout]}", ${e.evidence.length} berkas, tombol peserta "${e.actionLabel}"`, ok, JSON.stringify(h.line.concat(h.kegiatan ?? '-', h.angka)));
    const priv = round.choices.filter((c) => h.text.includes(norm(personal(M.choiceText(round, c), K.namaUmum)))).map((c) => c.id);
    for (const cnd of M.conditional) if (h.text.includes(cnd.core)) priv.push(`baris pribadi ${cnd.flag}`);
    check(`babak ${n} · konsol host (${phase}): tanpa teks pilihan / baris pribadi`, priv.length === 0, priv.join(', '));
    await audit(host, `babak ${n} ${phase}`, forbiddenFor(host));
    if (ctx.shoot && phase === 'scene') await shot(host, n, 'konsol');
  }

  // ================================================================ rounds

  const reveal = [];
  const reducedLog = [];
  for (let n = 1; n <= M.count; n++) {
    const idx = n - 1;
    const round = M.rounds[idx];
    log(`-- babak ${n} (${round.layout}${round.keyRound ? ', kunci' : ''}${M.flagRounds.includes(n) ? ', bertanda' : ''}${M.effectRounds.includes(n) ? ', efek tertunda' : ''})`);
    // ================= SCENE
    await waitPhase('scene', n, 120_000);
    for (const p of everyone) {
      p.start = p.track.start(idx);
      p.choice = STRATEGIES[p.strategy](round, n);
    }
    const ctx = { n, idx, round, shoot: SHOTS.has(n), sceneAt: Date.now(), reveal, reduced: reducedLog, gates: [], gatesOf: {}, holders: [], resubmitted: new Set() };
    const roundInfo = { n, layout: round.layout, readingMs: watch.pub?.readingMs ?? watch.pub?.phaseDurationMs ?? null, openedBy: 'otomatis' };
    await Promise.all([
      ...players.map((p) =>
        guard(p, `babak ${n} adegan`, async () => {
          await sceneFlow(p, ctx);
          p.sceneDoneAt = Date.now();
        }),
      ),
      guard(proj, `babak ${n} adegan`, () => projectorFlow(ctx, 'scene')),
      guard(host, `babak ${n} adegan`, () => hostFlow(ctx, 'scene')),
    ]);
    // ================= ANSWERING (the host opens the options once every screen is checked, or the reading time runs out)
    if (AUTO_OPEN.has(n)) roundInfo.openedBy = 'otomatis';
    else if (await hostAct('Buka pilihan sekarang', 'scene', n)) roundInfo.openedBy = 'host';
    ctx.openedByHost = roundInfo.openedBy === 'host';
    state.rounds.push(roundInfo);
    await waitPhase('answering', n, 60_000);
    ctx.deadline = watch.pub?.phaseEndsAt ?? Date.now() + windowMs;
    if (AUTO_OPEN.has(n)) {
      // Opened by the room for everybody: not before the shared reading time, at most the bounded readiness grace after it.
      const scenePub = watch.publics.filter((s) => s.roundNumber === n && s.phase === 'scene' && s.sceneStartedAt != null).pop();
      const opened = (watch.pub?.phaseEndsAt ?? 0) - (watch.pub?.phaseDurationMs ?? windowMs);
      const due = scenePub ? scenePub.sceneStartedAt + scenePub.readingMs : null;
      check(`babak ${n}: pilihan dibuka otomatis untuk semua sesudah waktu baca bersama${due ? ` (${Math.round(scenePub.readingMs / 1000)} dtk)` : ''}`, due !== null && opened >= due - 5 && opened <= due + 9000 && watch.pub?.phaseDurationMs === windowMs, due ? `dibuka ${opened - due} ms sesudah waktu baca; jendela jawab ${watch.pub?.phaseDurationMs} ms` : 'status adegan tidak tercatat');
    }
    for (const p of players) {
      if (!p.choice) continue;
      if (special('reloadSent', p, n) || special('reconnect', p, n)) {
        const g = deferred();
        ctx.gates.push(g);
        (ctx.gatesOf[p.id] ??= []).push(g);
        ctx.holders.push(p.id);
      }
    }
    await Promise.all([...players.map((p) => guard(p, `babak ${n} menjawab`, () => answerFlow(p, ctx))), guard(proj, `babak ${n} menjawab`, () => projectorFlow(ctx, 'answering')), guard(host, `babak ${n} menjawab`, () => hostFlow(ctx, 'answering'))]);
    for (const g of ctx.gates) g.resolve();
    roundInfo.closedByLastAnswerOf = ctx.closedBy ?? null;
    // ================= CONSEQUENCE
    await waitPhase('consequence', n, windowMs + 20_000);
    const consAt = Date.now();
    // The own outcome follows the public snapshot (public first). The watcher's socket can see the public phase before
    // a page's private frame reaches this tool through the DevTools frame events: wait until every participant's own
    // consequence of this round has arrived before reading it.
    await waitFor(() => players.every((p) => privatesOf(p).some((x) => x.consequence?.roundNumber === n)) && bots.every((b) => b.privates.some((x) => x.consequence?.roundNumber === n)), 8000, 25, `konsekuensi pribadi babak ${n}`).then(
      () => metric({ n, konsekuensiPribadiDiterimaMs: Date.now() - consAt }),
      () => note({ babak: n, catatan: 'tidak semua konsekuensi pribadi diterima alat dalam 8 detik sesudah fase publik konsekuensi' }),
    );
    for (const p of players) {
      const views = privatesOf(p);
      p.pid ??= views.find((x) => x.participantId)?.participantId;
      p.cv = views.filter((x) => x.consequence?.roundNumber === n).pop()?.consequence ?? null;
      p.actual = chosenOf(round, p.cv);
      p.last = p.track.settle(idx, p.actual, p.cv?.score.elapsedMs ?? null, windowMs);
    }
    for (const p of players) {
      p.outcomeText = null;
      p.roundText = null;
      p.kept = null;
    }
    for (const b of bots) {
      b.cv = b.privates.filter((x) => x.consequence?.roundNumber === n).pop()?.consequence ?? null;
      b.actual = chosenOf(round, b.cv);
      b.last = b.track.settle(idx, b.actual, b.cv?.score.elapsedMs ?? null, windowMs);
    }
    await Promise.all([...players.map((p) => guard(p, `babak ${n} konsekuensi`, () => consequenceFlow(p, ctx))), guard(proj, `babak ${n} konsekuensi`, () => projectorFlow(ctx, 'consequence')), guard(host, `babak ${n} konsekuensi`, () => hostFlow(ctx, 'consequence'))]);
    for (const p of everyone) {
      const { cv, actual } = p;
      const who = p.kind === 'bot' ? `${p.name} (bot)` : p.id;
      const planned = p.choice;
      check(`babak ${n} · ${who}: jawaban tercatat sesuai rencana (${planned ? `${planned.id}/${planned.classification}` : 'waktu habis'})`, !!cv && (actual?.id ?? null) === (planned?.id ?? null), cv ? `${cv.outcome} ${actual?.id ?? '-'}` : 'konsekuensi pribadi tidak diterima');
      const d = p.last;
      const same = !!cv && cv.moodBefore === d.moodBefore && cv.moodAfter === d.moodAfter && cv.delayedDelta === d.delayedDelta && cv.outcome === d.outcome && cv.score.accuracyPoints === d.score.accuracyPoints && cv.score.speedPoints === d.score.speedPoints && cv.score.roundScore === d.score.roundScore;
      const pol = policyScore(actual?.accuracy ?? 0, actual ? cv?.score.elapsedMs ?? null : null, windowMs);
      const policyOk = !!cv && pol.accuracyPoints === cv.score.accuracyPoints && pol.speedPoints === cv.score.speedPoints && pol.roundScore === cv.score.roundScore;
      check(`babak ${n} · ${who}: status, efek tertunda & nilai server = mesin bersama = kebijakan ${STORY_SCORE_POLICY.id} (${d.outcome}${actual ? `, a=${actual.accuracy}` : ''})`, same && policyOk, cv ? `server ${cv.moodBefore}->${cv.moodAfter} (${cv.delayedDelta}) ${cv.score.accuracyPoints}+${cv.score.speedPoints}=${cv.score.roundScore} @${cv.score.elapsedMs}ms · mesin ${d.moodBefore}->${d.moodAfter} (${d.delayedDelta}) ${d.score.roundScore} · kebijakan ${pol.roundScore}` : '-');
      if (cv) {
        // The server's consequence view = the shared consequence builder over the engine's decision.
        const want = SU.consequenceViewOf(M.content, idx, d, 'id', p.start.flags);
        const diff = [...new Set([...Object.keys(want), ...Object.keys(cv)])].filter((key) => JSON.stringify(cv[key]) !== JSON.stringify(want[key]));
        check(`babak ${n} · ${who}: tampilan konsekuensi server = penyusun bersama (balasan, pelajaran, dampak, dianjurkan)`, diff.length === 0, diff.join(', '));
      }
    }
    // Two participants, different decisions, the same round: each sees only their own outcome.
    {
      const answered = players.filter((p) => p.actual && p.outcomeText);
      const groups = [...new Set(answered.map((p) => p.actual.id))];
      if (groups.length >= 2) {
        const bad = [];
        for (const p of answered) {
          const own = norm(personal(M.choiceText(round, p.actual), p.name));
          if (!p.outcomeText.includes(own)) bad.push(`${p.id}: pilihan sendiri tidak ada`);
          // A participant who was not tepat is shown the recommended option(s); any other option is someone else's.
          const shownToo = p.actual.classification === 'tepat' ? [] : E.recommendedChoices(round).map((c) => c.id);
          for (const q of answered) {
            if (q.actual.id === p.actual.id || shownToo.includes(q.actual.id)) continue;
            const other = norm(personal(M.choiceText(round, q.actual), p.name));
            if (p.outcomeText.includes(other)) bad.push(`${p.id}: memuat pilihan ${q.id}`);
          }
          if (!p.roundText?.includes(babak(n))) bad.push(`${p.id}: bukan babak ${n}`);
        }
        check(`babak ${n}: ${groups.length} keputusan berbeda di ${answered.length} HP/desktop — masing-masing melihat hasilnya sendiri di babak yang sama`, bad.length === 0, bad.join(' | ') || answered.map((p) => `${p.id}:${p.actual.id}/${p.actual.classification}`).join(' '));
      } else note({ babak: n, catatan: 'kurang dari dua keputusan berbeda di peserta browser', peserta: answered.map((p) => p.id) });
    }
    // Delayed effects apply once, only to holders, in the round that has them.
    for (const p of everyone) {
      const d = p.last;
      if (d.delayedDelta || p.cv?.delayedDelta) {
        const holder = M.rounds[idx].flagEffects.some((fx) => p.start.flags.has(fx.flag));
        check(`babak ${n} · ${p.kind === 'bot' ? p.name : p.id}: efek tertunda ${signed(d.delayedDelta)} hanya bagi pemegang tanda di babak efeknya`, holder && p.cv?.delayedDelta === d.delayedDelta, `server ${p.cv?.delayedDelta}, mesin ${d.delayedDelta}`);
      }
    }
    for (const b of bots.filter((x) => x.resubmit)) {
      const r = b.resubmits.find((x) => x.n === n);
      if (b.choice) check(`babak ${n} · ${b.name} (bot): kirim ulang pilihan sama = duplikat, pilihan lain ditolak; nilai tidak ganda`, !!r && r.sameOk && r.otherRefused && b.cv?.score.roundScore === b.last.score.roundScore, r?.detail ?? 'tidak ada catatan kirim ulang');
    }
    await sleep(Math.max(0, consAt + 4500 - Date.now()));
    if (STOP_AFTER && n >= STOP_AFTER && n < M.count) {
      log(`RAKSA_BATAS_BABAK=${STOP_AFTER}: host menutup room`);
      await (await findButton(host.page, '.stf-room-kendali .btn-bahaya', 'Tutup room')).click();
      await (await findButton(host.page, 'button.btn-bahaya', 'Ya, tutup room')).click();
      state.stoppedAfter = n;
      break;
    }
    // ================= LEADERBOARD / FINISH
    if (n < M.count) {
      await hostAct('Lanjut ke peringkat', 'consequence', n);
      await waitPhase('leaderboard', n, 20_000);
      const ranking = expectedRanking(everyone);
      await Promise.all(players.map((p) => guard(p, `babak ${n} peringkat`, () => leaderboardFlow(p, ctx, ranking))));
      const projRows = await readRows(proj.page, '.sr-layar-papan');
      check(`babak ${n} · layar acara peringkat sementara`, rankingIssues(projRows, ranking).length === 0, rankingIssues(projRows, ranking).join(' | '));
      await audit(proj, `babak ${n} peringkat`, forbiddenFor(proj));
      if (n === 1) await shot(proj, n, 'peringkat');
      await hostAct('Babak berikutnya', 'leaderboard', n);
    } else {
      await hostAct('Tampilkan hasil akhir', 'consequence', n);
    }
  }

  // ================= FINAL SUMMARY
  if (state.stoppedAfter) {
    await waitPhase('interrupted', null, 20_000);
  } else {
    await waitPhase('finished', null, 30_000);
    state.finishedAt = Date.now();
    await finalChecks({ players, bots, everyone, proj, host, forbiddenFor, code, windowMs, state });
  }

  // ================= run-wide checks
  check('gerak dikurangi: semua baris langsung tampil di setiap babak (peserta dengan prefers-reduced-motion)', reducedLog.length > 0 && reducedLog.every((x) => x.first === x.want), JSON.stringify(reducedLog.filter((x) => x.first !== x.want)));
  for (const p of players.filter((x) => x.reducedMotion)) check(`${p.id} (gerak dikurangi): tanpa animasi panjang/berulang yang berjalan saat adegan & menjawab`, (p.anims ?? []).length === 0, JSON.stringify((p.anims ?? []).slice(0, 5)));
  // Payload privacy: answer keys never sent; conditional lines and flag labels never on shared channels or to non-holders; lesson only after close.
  const keyRe = /"(classification|accuracy|moodDelta|setsFlag)":/;
  for (const v of [...players, proj, host]) check(`payload · ${v.id}: kunci jawaban (classification/accuracy/moodDelta/setsFlag) tidak pernah dikirim`, !v.frames.some((f) => keyRe.test(f)));
  check('payload · bot: kunci jawaban tidak pernah dikirim', !bots.some((b) => keyRe.test(JSON.stringify(b.privates))));
  const earlyLesson = watch.publics.filter((st) => (st.phase === 'scene' || st.phase === 'answering') && st.scene?.lesson);
  check('payload · kanal publik: pelajaran babak hanya sesudah jawaban ditutup', earlyLesson.length === 0, earlyLesson.map((st) => `${st.roundNumber}/${st.phase}`).join(','));
  const leak = (payloadText, core) => payloadText.includes(JSON.stringify(core).slice(1, -1));
  const shared = [...proj.frames, ...host.frames, ...watch.publics.map((x) => JSON.stringify(x))];
  for (const cnd of M.conditional) {
    check(`payload: baris pribadi (tanda ${cnd.flag}) tidak pernah dikirim ke layar acara/konsol host/kanal publik`, !shared.some((f) => leak(f, cnd.core)));
    for (const p of everyone) {
      const privs = p.kind === 'bot' ? p.privates : privatesOf(p);
      const got = privs.filter((x) => (x.flagLines ?? []).some((l) => l.text === cnd.template));
      const holder = p.track.decisions.slice(0, cnd.round - 1).some((d) => d?.choiceId && M.rounds.find((r) => r.id === d.roundId)?.choices.find((c) => c.id === d.choiceId)?.setsFlag === cnd.flag);
      const raw = p.kind === 'bot' ? JSON.stringify(p.privates) : p.frames.join('\n');
      const who = p.kind === 'bot' ? `${p.name} (bot)` : p.id;
      if (holder) check(`payload · ${who}: baris pribadi dikirim PRIBADI ke pemegang tanda hanya di babak ${cnd.round}`, got.length > 0 && got.every((x) => x.roundNumber === cnd.round), `${got.length} status pribadi`);
      else if (p.track.decisions.length >= cnd.round) check(`payload · ${who}: baris pribadi tidak pernah dikirim ke peserta tanpa tanda`, got.length === 0 && !leak(raw, cnd.core));
    }
  }
  for (const f of M.flags) {
    const label = M.flagLabel(f);
    if (!label || M.publicText.includes(label)) continue;
    check(`payload: label tanda ${f} tidak pernah dikirim ke layar acara/konsol host/kanal publik`, !shared.some((x) => leak(x, label)));
    for (const p of players) {
      const holder = p.track.decisions.some((d) => d?.choiceId && M.rounds.find((r) => r.id === d.roundId)?.choices.find((c) => c.id === d.choiceId)?.setsFlag === f);
      if (!holder) check(`payload · ${p.id}: label tanda ${f} tidak pernah dikirim ke bukan pemegang`, !p.frames.some((x) => leak(x, label)));
    }
  }
  for (const p of players) {
    const ids = new Set(privatesOf(p).map((x) => x.participantId));
    check(`payload · ${p.id}: hanya menerima status pribadinya sendiri`, ids.size === 1, [...ids].join(','));
  }
  // Public before private: per connection, from the snapshots in the order they arrived.
  for (const p of players) {
    const o = orderViolations(storyEvents(p.frames), code);
    check(`urutan · ${p.id}: status publik selalu tiba sebelum status pribadi babak/fase yang sama (${o.privates} status pribadi)`, o.privates > 0 && o.violations.length === 0, o.violations.slice(0, 5).join(' | '));
  }
  for (const b of bots) {
    const o = orderViolations(b.order, code);
    check(`urutan · ${b.name} (bot): status publik selalu tiba sebelum status pribadi (${o.privates} status pribadi)`, o.privates > 0 && o.violations.length === 0, o.violations.slice(0, 5).join(' | '));
  }
  // What each participant's screen showed between snapshots (DOM timeline of every change).
  for (const p of players) timelineChecks(p, state);
  // Options are shuffled per participant and stable per participant.
  {
    const rounds = Object.keys(players[0].orders ?? {}).map(Number);
    const differ = rounds.filter((n) => new Set(players.map((p) => (p.orders?.[n] ?? []).join(','))).size > 1);
    check('urutan pilihan diacak per peserta (berbeda antarpeserta di babak yang sama)', differ.length >= Math.ceil(rounds.length / 2), `${differ.length}/${rounds.length} babak berbeda urutan`);
  }
  for (const b of bots) check(`${b.name} (bot): tanpa galat jawaban`, b.errors.length === 0, b.errors.join(' | '));
  for (const p of players) check(`${p.id}: semua jawaban terkirim lewat UI`, p.answerErrors.length === 0, p.answerErrors.join(' | '));
  for (const p of players) check(`${p.id}: setiap babak berkas membuka minimal satu lembar`, (p.sheets ?? 0) >= M.rounds.slice(0, state.stoppedAfter ?? M.count).filter((r) => r.evidence.length).length, `${p.sheets ?? 0} lembar dibuka`);
  const blockedPlayer = players.find((p) => p.blockImages);
  if (blockedPlayer) check(`${blockedPlayer.id}: permintaan gambar benar-benar diblokir (uji gambar gagal bermakna)`, blockedPlayer.blocked > 0, `${blockedPlayer.blocked} permintaan diblokir`);
  if (!state.stoppedAfter) check(`host manual: konsol host memajukan room (${JSON.stringify(state.hostActions)})`, (state.hostActions['Babak berikutnya']?.ditekan ?? 0) === M.count - 1 && (state.hostActions['Tampilkan hasil akhir']?.ditekan ?? 0) + (state.hostActions['Tampilkan hasil akhir']?.sudahBerpindah ?? 0) === 1);
  state.reveal = reveal;
  state.reduced = reducedLog;
}

/**
 * The DOM timeline of one participant page (every change of what the round screen shows): texts that must never
 * appear (not registered / joined late / wrong round), mixed states between two snapshots (an outcome while answering,
 * options after close, an outcome that disappears within its round, a status chip that changes while the round is
 * played), and how long the loading notes ("Pilihan segera dibuka…", "Memuat hasilmu…") lasted. Moments around a
 * reload or an offline window are not judged for loading time or a missing outcome.
 */
function timelineChecks(v, state) {
  const tl = v.timeline;
  const quiet = (t) => v.offline.some(([a, b]) => t >= a - 500 && t <= (b ?? Infinity) + 4000) || v.reloads.some((r) => t >= r - 500 && t <= r + 6000);
  const forbidden = tl.filter((x) => x.terlarang.length);
  check(`layar · ${v.id}: tidak pernah tampil teks "tidak terdaftar / masuk terlambat / babak salah" (${tl.length} perubahan layar tercatat)`, tl.length > 0 && forbidden.length === 0, forbidden.slice(0, 3).map((x) => `${x.fase}/babak ${x.babak}: ${x.terlarang.join(', ')}`).join(' | '));
  const mixed = [];
  const seenOutcome = new Set();
  const chip = {};
  for (const x of tl) {
    if (x.fase === 'scene' && (x.opsi || x.kirim || x.hasil)) mixed.push(`babak ${x.babak} adegan: ${x.opsi ? 'pilihan' : x.kirim ? 'tombol kirim' : 'hasil'} sudah tampil`);
    if (x.fase === 'answering' && x.hasil) mixed.push(`babak ${x.babak} menjawab: hasil sudah tampil`);
    if ((x.fase === 'consequence' || x.fase === 'leaderboard') && (x.opsi || x.kirim || x.terkirim)) mixed.push(`babak ${x.babak} ${x.fase}: ${x.opsi ? 'pilihan' : x.kirim ? 'tombol kirim' : 'keadaan terkirim'} masih tampil`);
    if ((x.fase === 'consequence' || x.fase === 'leaderboard') && x.babak) {
      if (x.hasil) seenOutcome.add(x.babak);
      else if (seenOutcome.has(x.babak) && !quiet(x.t)) mixed.push(`babak ${x.babak} ${x.fase}: hasil hilang setelah tampil`);
    }
    if ((x.fase === 'scene' || x.fase === 'answering') && x.babak && x.suasana) {
      if (chip[x.babak] && chip[x.babak] !== x.suasana && !quiet(x.t)) mixed.push(`babak ${x.babak}: status ${chip[x.babak]} -> ${x.suasana} saat bermain`);
      chip[x.babak] = x.suasana;
    }
  }
  check(`layar · ${v.id}: tanpa keadaan campuran antar-status (hasil sebelum ditutup, pilihan sesudah ditutup, hasil yang hilang, status berubah saat bermain)`, mixed.length === 0, [...new Set(mixed)].slice(0, 6).join(' | '));
  const loads = [];
  for (let i = 0; i < tl.length; i++) {
    const x = tl[i];
    const kind = x.memuatPilihan && x.fase === 'answering' ? 'pilihan' : x.memuatHasil ? 'hasil' : null;
    if (!kind) continue;
    let j = i + 1;
    while (j < tl.length && (kind === 'pilihan' ? tl[j].memuatPilihan && tl[j].fase === 'answering' : tl[j].memuatHasil)) j++;
    loads.push({ kind, babak: x.babak, ms: (tl[j]?.t ?? x.t) - x.t, quiet: quiet(x.t) });
    i = j - 1;
  }
  const longest = loads.filter((l) => !l.quiet).reduce((m, l) => Math.max(m, l.ms), 0);
  const long = loads.filter((l) => !l.quiet && l.ms > 1500);
  state.loading = { ...(state.loading ?? {}), [v.id]: { kali: loads.length, terlamaMs: longest, rincian: loads } };
  check(`layar · ${v.id}: keadaan "memuat" di antara status publik dan pribadi singkat (${loads.length}×, terlama ${longest} ms)`, long.length === 0, JSON.stringify(long.slice(0, 5)));
}

async function readRows(page, scope) {
  return page.evaluate((scope) => {
    const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll(`${scope} .sr-peringkat-baris`)].map((li) => ({ no: n(li.querySelector('.sr-peringkat-no')?.textContent), name: n(li.querySelector('.sr-peringkat-nama')?.childNodes[0]?.textContent), pts: n(li.querySelector('.sr-peringkat-poin')?.textContent), saya: li.classList.contains('saya') }));
  }, scope);
}

/** Final summary of the room (main.sr-hasil-akhir): every decision opened. */
async function readFinal(page) {
  return page.evaluate(() => {
    const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const m = document.querySelector('main.sr-hasil-akhir');
    if (!m) return null;
    m.querySelectorAll('details.sr-keputusan').forEach((d) => (d.open = true));
    const quote = (sel) => {
      const f = m.querySelector(sel);
      return f ? { q: n(f.querySelector('blockquote')?.textContent), cap: n(f.querySelector('figcaption')?.textContent) } : null;
    };
    const totalCard = m.querySelector('.sr-total');
    return {
      title: n(m.querySelector(':scope > h1')?.textContent),
      kind: n(m.querySelector('.sr-tanda-akhir')?.textContent) || null,
      teks: n(m.querySelector('.sr-akhir-teks')?.textContent) || null,
      customer: quote('.sr-kutipan-customer'),
      mentor: quote('.sr-kutipan-mentor'),
      total: n(totalCard?.querySelector('.sr-total-angka b')?.textContent) || null,
      rincian: totalCard ? [...totalCard.querySelectorAll('.sr-nilai dd')].map((d) => n(d.textContent)) : [],
      rank: n(totalCard?.querySelector('.sr-peringkat-saya')?.textContent) || null,
      kebijakan: n(totalCard?.querySelector('.sr-penjelasan')?.textContent),
      moodBand: n(m.querySelector('.sr-mood-band')?.textContent) || null,
      jejak: m.querySelector('.sr-jejak') ? [...m.querySelectorAll('.sr-jejak li')].map((li) => n(li.textContent)) : null,
      rows: [...m.querySelectorAll('.sr-peringkat-baris')].map((li) => ({ no: n(li.querySelector('.sr-peringkat-no')?.textContent), name: n(li.querySelector('.sr-peringkat-nama')?.childNodes[0]?.textContent), pts: n(li.querySelector('.sr-peringkat-poin')?.textContent), saya: li.classList.contains('saya') })),
      decisions: [...m.querySelectorAll('details.sr-keputusan')].map((d) => ({
        cls: d.className,
        judul: n(d.querySelector('.sr-keputusan-judul')?.textContent),
        poin: n(d.querySelector('.sr-keputusan-poin')?.textContent),
        text: n(d.textContent),
        dampak: [...d.querySelectorAll('.sr-dampak')].map((x) => n(x.textContent)),
        nilai: [...d.querySelectorAll('.sr-nilai dd')].map((x) => n(x.textContent)),
      })),
    };
  });
}

/** Final summaries (participants), endings = engine, causal notes of flags, final rankings (projector, host). */
async function finalChecks({ players, bots, everyone, proj, host, forbiddenFor, code, windowMs, state }) {
  const ranking = expectedRanking(everyone);
  await Promise.all(players.map((p) => p.page.waitForSelector('main.sr-hasil-akhir .sr-keputusan', { timeout: 20000 })));
  await sleep(700);
  state.participants = [];
  const k = C.textKey;
  for (const p of players) {
    const ending = p.track.ending();
    const totals = p.track.totals();
    await shot(p, 'akhir', 'ringkasan');
    const f = await readFinal(p.page);
    const nm = (s) => norm(personal(s, p.name));
    const kindLabel = K[`akhir.${ending.kind}`];
    const title = nm(M.t(k.endingTitle(ending.id)));
    const wantKind = kindLabel.toLocaleLowerCase('id') === title.toLocaleLowerCase('id') ? null : kindLabel;
    const cust = nm(M.t(k.endingCustomer(ending.id)));
    const ment = nm(M.t(k.endingMentor(ending.id)));
    const teks = nm(M.t(k.endingText(ending.id)));
    check(`akhir · ${p.id}: akhir = prediksi mesin bersama (${ending.id}, ${ending.kind})`, f?.title === title && (f?.kind ?? null) === wantKind && (f?.teks ?? null) === (teks || null), `${f?.title} / ${title} · ${f?.kind}`);
    check(`akhir · ${p.id}: kata customer & mentor dengan nama`, (cust ? f?.customer?.q === cust && f.customer.cap === norm(`— ${personal(M.customerName, p.name)}`) : !f?.customer) && (ment ? f?.mentor?.q === ment && f.mentor.cap === norm(`— ${M.officerName ? personal(M.officerName, p.name) : K.mentor}`) : !f?.mentor), JSON.stringify({ c: f?.customer?.cap, m: f?.mentor?.cap }));
    check(`akhir · ${p.id}: total nilai & rincian = mesin bersama (kebijakan ${STORY_SCORE_POLICY.id})`, f?.total === idNum(totals.totalScore) && JSON.stringify(f?.rincian) === JSON.stringify([idNum(totals.accuracyPoints), idNum(totals.speedPoints)]) && (f?.kebijakan ?? '').includes(STORY_SCORE_POLICY.id), `${f?.total} ${JSON.stringify(f?.rincian)}`);
    check(`akhir · ${p.id}: status akhir memakai kata skenario`, f?.moodBand === norm(wordFor(E.moodBandOf(p.track.mood), p.name)), f?.moodBand);
    // Expected summary from the shared builder over the decisions the engine resolved from the recorded answers.
    const sum = SU.buildSummary({ content: M.content, decisions: p.track.decisions, endingId: ending.id, rank: null, complete: true, finalMood: p.track.mood, scorePolicyId: STORY_SCORE_POLICY.id, scenarioTitle: M.title, versionNo: M.versionNo, roomCode: code, answerWindowMs: windowMs });
    const decIssues = [];
    (f?.decisions ?? []).forEach((d, i) => {
      const x = sum.decisions[i];
      if (!x) return;
      const p2 = (s) => norm(personal(s, p.name));
      if (d.judul !== norm(fmt(K.keputusanBabak, { n: i + 1, judul: personal(x.title, p.name) }))) decIssues.push(`${i + 1}: judul`);
      if (!d.cls.split(/\s+/).includes(`sr-keputusan-${x.outcome}`)) decIssues.push(`${i + 1}: hasil ${d.cls}`);
      if (d.poin !== norm(fmt(K.poin, { n: idNum(x.score.roundScore) }))) decIssues.push(`${i + 1}: poin ${d.poin}`);
      const need = [p2(x.prompt), x.chosenText !== null ? p2(x.chosenText) : K.tanpaJawaban, x.reply ? p2(x.reply) : '', p2(x.consequence), x.reason ? p2(x.reason) : '', ...(x.outcome !== 'tepat' ? x.recommended.map((r) => p2(r.text)) : []), x.mentorReason ? p2(x.mentorReason) : ''];
      const miss = need.filter((s) => s && !d.text.includes(s));
      if (miss.length) decIssues.push(`${i + 1}: tidak ada "${short(miss[0], 40)}"${miss.length > 1 ? ` (+${miss.length - 1})` : ''}`);
      if (x.mentorReason && !d.text.includes(norm(M.officerName ? fmt(K.alasanMentor, { nama: personal(M.officerName, p.name) }) : K.alasanMentorUmum))) decIssues.push(`${i + 1}: label alasan mentor`);
      const delayed = x.delayed.filter((e) => e.delta !== 0);
      const wantDampak = [
        ...(x.flagSet ? [norm(causalText({ setRound: i + 1, label: personal(x.flagSet.label, p.name), effectRound: x.flagSet.effectRound, delta: x.flagSet.delta }))] : []),
        ...(delayed.length ? delayed.map((e) => norm(delayedText({ ...e, label: personal(e.label, p.name) }))) : x.delayedDelta ? [norm(fmt(K.dampakTertundaRingkas, { n: signed(x.delayedDelta) }))] : []),
      ];
      if (JSON.stringify(d.dampak) !== JSON.stringify(wantDampak)) decIssues.push(`${i + 1}: catatan dampak ${JSON.stringify(d.dampak)} ≠ ${JSON.stringify(wantDampak)}`);
      if (JSON.stringify(d.nilai) !== JSON.stringify([idNum(x.score.accuracyPoints), idNum(x.score.speedPoints), idNum(x.score.roundScore)])) decIssues.push(`${i + 1}: nilai ${d.nilai.join('/')}`);
    });
    check(`akhir · ${p.id}: ${M.count} keputusan (pilihan, balasan, akibat, alasan, dianjurkan, alasan mentor, catatan dampak, nilai)`, f?.decisions.length === M.count && decIssues.length === 0, decIssues.join(' | '));
    // Causal notes of a flag: at the round that set it and where it took effect, also when the ending is good.
    const notes = sum.decisions.filter((x) => x.flagSet).map((x) => norm(causalText({ setRound: x.roundNumber, label: personal(x.flagSet.label, p.name), effectRound: x.flagSet.effectRound, delta: x.flagSet.delta })));
    if (notes.length) {
      const effectRounds = sum.decisions.filter((x) => x.flagSet?.effectRound).map((x) => x.flagSet.effectRound);
      const atEffect = effectRounds.every((r) => (f?.decisions[r - 1]?.dampak ?? []).length > 0);
      check(`akhir · ${p.id}: catatan sebab-akibat tanda di babak ${sum.decisions.filter((x) => x.flagSet).map((x) => x.roundNumber).join(',')} & babak efek ${effectRounds.join(',')} + bagian "${K.jejakJudul}" (akhir: ${ending.kind})`, JSON.stringify(f?.jejak) === JSON.stringify(notes) && atEffect, JSON.stringify({ jejak: f?.jejak, harap: notes, akhir: ending.kind }));
      if (ending.kind !== 'happy') note({ catatan: `pemegang tanda ${p.id} tidak mencapai akhir terbaik; "catatan tetap tampil walau akhir baik" diuji pada akhir ${ending.kind}` });
    } else check(`akhir · ${p.id}: tanpa bagian "${K.jejakJudul}" (tidak memegang tanda)`, f?.jejak === null, JSON.stringify(f?.jejak));
    const server = privatesOf(p).filter((x) => x.summary).pop()?.summary;
    check(`akhir · ${p.id}: id akhir, total & catatan tanda di server = mesin/penyusun bersama`, server?.ending?.id === ending.id && server?.totals.totalScore === totals.totalScore && JSON.stringify(server?.decisions.map((x) => x.flagSet)) === JSON.stringify(sum.decisions.map((x) => x.flagSet)), `${server?.ending?.id} / ${ending.id}; ${server?.totals.totalScore} / ${totals.totalScore}`);
    const mine = ranking.find((r) => r.name === p.name);
    check(`akhir · ${p.id}: peringkat pribadi & peringkat akhir room`, f?.rank === fmt(K.peringkatmu, { rank: mine.rank, of: everyone.length }) && rankingIssues(f.rows, ranking).length === 0, `${f?.rank} · ${rankingIssues(f?.rows ?? [], ranking).join(' ')}`);
    await audit(p, 'akhir', forbiddenFor(p));
    await shot(p, 'akhir', 'ringkasan-penuh', { fullPage: true });
    state.participants.push({ id: p.id, nama: p.name, viewport: p.vpName, rencana: p.plan, akhir: ending.id, jenis: ending.kind, statusAkhir: p.track.mood, total: totals.totalScore, jawaban: p.track.decisions.map((d) => d.choiceId ?? 'waktu_habis').join(' ') });
  }
  for (const b of bots) {
    const ending = b.track.ending();
    const summary = b.me?.summary;
    check(`akhir · ${b.name} (bot): id akhir & total server = prediksi mesin bersama`, summary?.ending?.id === ending.id && summary?.totals.totalScore === b.track.totals().totalScore && summary?.decisions.length === M.count, `${summary?.ending?.id} / ${ending.id}; ${summary?.totals.totalScore} / ${b.track.totals().totalScore}`);
    state.participants.push({ id: b.id, nama: b.name, viewport: 'socket', rencana: b.strategy, akhir: ending.id, jenis: ending.kind, statusAkhir: b.track.mood, total: b.track.totals().totalScore });
  }
  const kinds = new Set(state.participants.map((x) => x.jenis));
  check('peserta mencapai beberapa jenis akhir (cakupan)', kinds.size >= Math.min(3, new Set(M.content.endings.map((e) => e.kind)).size), [...kinds].join(', '));
  await proj.page.waitForSelector('.sr-layar-papan .sr-peringkat-baris', { timeout: 15000 });
  const rows = await readRows(proj.page, '.sr-layar-papan');
  const pr = await proj.page.evaluate(() => ({ h1: (document.querySelector('.sr-layar-papan h1')?.textContent ?? '').trim(), done: (document.querySelector('.sr-layar-hitung')?.textContent ?? '').trim() }));
  check('layar acara: peringkat akhir semua peserta = mesin bersama', pr.h1 === K.peringkatAkhir && pr.done === K.layarSelesai && rankingIssues(rows, ranking).length === 0, [pr.h1, pr.done, ...rankingIssues(rows, ranking)].join(' | '));
  await audit(proj, 'akhir', forbiddenFor(proj));
  await shot(proj, 'akhir', 'papan');
  const hostRows = await readRows(host.page, '.stf-room');
  check('konsol host: peringkat akhir', rankingIssues(hostRows, ranking, 20).length === 0, rankingIssues(hostRows, ranking, 20).join(' | '));
  await audit(host, 'akhir', forbiddenFor(host));
  await shot(host, 'akhir', 'konsol', { fullPage: true });
}

// ------------------------------------------------------------------ run

const started = Date.now();
const state = {};
try {
  M = await loadScenario();
  TIMEOUTS = timeoutRounds();
  SPECIAL = specialsPlan();
  state.scenario = { id: M.scenarioId, versionId: M.versionId, versionNo: M.versionNo, title: M.title, rounds: M.count, layouts: M.rounds.map((r) => r.layout).join(','), flagRounds: M.flagRounds, effectRounds: M.effectRounds, longestOption: M.longestOption, longestOptionRound: M.longestOptionRound };
  state.timeoutRounds = [...TIMEOUTS];
  state.specials = SPECIAL;
  state.plan = planSummary();
  log(`skenario: ${M.title} v${M.versionNo} (${M.versionId}); kegiatan ${state.scenario.layouts}; bertanda ${M.flagRounds.join(',') || '-'}; efek ${M.effectRounds.join(',') || '-'}; waktu habis ${[...TIMEOUTS].join(',')}`);
  for (const [key, s] of Object.entries(SPECIAL)) log(`khusus ${key.padEnd(13)} babak ${s.rounds ? s.rounds.join(',') : s.round} · ${Array.isArray(s.who) ? s.who.join('+') : s.who} · ${s.what}`);
  for (const row of state.plan) log(`rencana ${row.siapa.padEnd(15)} ${row.akhir} (${row.jenis}) status ${row.statusAkhir} nilai@10s ${row.nilaiDetik10}`);
  check('skenario punya kata status sendiri (lima kata)', !!M.labels, JSON.stringify(M.labels));
} catch (err) {
  check('memuat skenario terbit lewat API CMS', false, err.stack ?? err.message);
}
if (M && PHASES.includes('room')) {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    try {
      await phaseRoom(state);
    } catch (err) {
      check('fase room selesai tanpa pengecualian', false, err.stack ?? err.message);
      for (const v of viewers) await shot(v, 'galat', 'room', { fullPage: true });
    }
    // Run-wide invariants per screen, from every snapshot taken.
    for (const v of viewers) {
      const a = v.audits;
      if (!a.length) continue;
      const tok = a.filter((x) => x.token);
      const wrong = a.filter((x) => x.wrongName?.length);
      const over = a.filter((x) => x.overflow);
      check(`${v.id}: tanpa {nama} literal di semua fase (${a.length} cuplikan)`, tok.length === 0, tok.map((x) => `${x.where}: ${x.tokenAt}`).join(' | '));
      check(`${v.id}: {nama} tidak pernah berisi nama orang lain / kata netral yang salah`, wrong.length === 0, wrong.map((x) => `${x.where}: ${x.wrongName[0]}`).join(' | '));
      check(`${v.id}: tanpa luapan horizontal di semua fase`, over.length === 0, over.map((x) => `${x.where}: ${x.overflow}`).join(' | '));
      check(`${v.id}: tanpa galat JS`, v.errors.length === 0, v.errors.slice(0, 5).join(' | '));
      check(`${v.id}: tanpa permintaan jaringan gagal`, v.netFails.length === 0, v.netFails.slice(0, 5).join(' | '));
    }
  } finally {
    for (const s of sockets) s.close();
    await browser.close();
  }
}
const failed = checks.filter((c) => !c.ok);
const audits = Object.fromEntries(viewers.map((v) => [v.id, v.audits]));
fs.writeFileSync(
  path.join(OUT, 'hasil.json'),
  JSON.stringify({ alat: 'tools/uji-skenario.mjs', base: BASE, phases: PHASES, startedAt: new Date(started).toISOString(), durationSec: Math.round((Date.now() - started) / 1000), state, observations, passed: checks.length - failed.length, failed: failed.length, checks, audits }, null, 2),
);
console.log(`\n${checks.length - failed.length}/${checks.length} lulus; ${failed.length} gagal. Bukti: ${OUT}`);
process.exit(failed.length ? 1 : 0);
