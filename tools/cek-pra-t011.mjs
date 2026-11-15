/**
 * T-011 checks: pre-JS loading screen (client/index.html #pra-pemuat) on the PRODUCTION build.
 *   npm run build && npm start   (RAKSA_LEGACY=on for zh and /acara/*)
 *   node tools/cek-pra-t011.mjs   -> team/evidence/T-011/ (hasil.json, frames-*, screenshots); exit 1 on a failed check
 * Slow = whole-page Network.emulateNetworkConditions 200,000 B/s down / 94,000 up / 150 ms, cache disabled, 360x740 DPR 2.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const OUT = path.resolve('team/evidence/T-011');
fs.mkdirSync(OUT, { recursive: true });
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const LAMBAT = { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 94000 };
const SEDANG = { offline: false, latency: 40, downloadThroughput: 1500000, uploadThroughput: 750000 };
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = [];
let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data).slice(0, 600)); };

/** rAF recorder: pre-JS node, React overlay, homepage, aria-busy; FCP; rect of .lp-pemuat-isi over time. */
function rekam(lang, pj) {
  try { if (lang) localStorage.setItem('raksa:bahasa', lang); localStorage.setItem('raksa:profil', pj); } catch { /* */ }
  const R = (window.__r = { frames: [], praMasuk: null, praHilang: null, praSelesai: null, reactOverlay: null, home: null, rect0: null, rect1: null, fcp: null });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') R.fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch { /* */ }
  const loop = () => {
    const t = Math.round(performance.now());
    const pra = document.getElementById('pra-pemuat');
    const react = [...document.querySelectorAll('.lp-pemuat')].find((e) => e.id !== 'pra-pemuat');
    const home = !!document.querySelector('.lp-judul');
    if (pra && R.praMasuk == null) { R.praMasuk = t; R.rect0 = pra.querySelector('.lp-pemuat-isi').getBoundingClientRect().toJSON(); R.teks = pra.querySelector('p').textContent; R.lang = pra.querySelector('p').lang; }
    if (pra && pra.hasAttribute('data-selesai') && R.praSelesai == null) { R.praSelesai = t; R.rect1 = pra.querySelector('.lp-pemuat-isi').getBoundingClientRect().toJSON(); }
    if (!pra && R.praMasuk != null && R.praHilang == null) R.praHilang = t;
    if (react && R.reactOverlay == null) R.reactOverlay = t;
    if (home && R.home == null) R.home = t;
    const s = { t, pra: pra ? (pra.hasAttribute('data-selesai') ? 'pudar' : 'ya') : '-', react: react ? 'ya' : '-', home, busy: document.getElementById('root')?.getAttribute('aria-busy') ?? '-' };
    const l = R.frames[R.frames.length - 1];
    if (!l || l.pra !== s.pra || l.react !== s.react || l.home !== s.home || l.busy !== s.busy) R.frames.push(s);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

async function buka({ url = '/', lang = 'id', net = null, w = 360, h = 740, reduce = false, cache = true, rekamFrame = null, intercept = null }) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }]);
  const c = await p.createCDPSession();
  await c.send('Network.enable');
  if (!cache) await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (net) await c.send('Network.emulateNetworkConditions', net);
  if (intercept) { await p.setRequestInterception(true); p.on('request', (r) => intercept(r)); }
  await p.evaluateOnNewDocument(rekam, lang, PROFIL);
  const frames = [];
  if (rekamFrame) {
    c.on('Page.screencastFrame', async (f) => { frames.push(f); try { await c.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* */ } });
    await c.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1 });
  }
  const t0 = Date.now();
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  return { ctx, p, c, frames, t0 };
}
function simpanFrame(frames, nama) {
  if (!frames.length) return 0;
  const dir = path.join(OUT, nama); fs.mkdirSync(dir, { recursive: true });
  // 100 ms series: keep the first screencast frame of each 100 ms bucket (screencast timestamps in seconds).
  const t0 = frames[0].metadata.timestamp; const dipakai = new Set(); let n = 0;
  for (const f of frames) { const ms = Math.round((f.metadata.timestamp - t0) * 1000); const k = Math.floor(ms / 100); if (dipakai.has(k)) continue; dipakai.add(k); fs.writeFileSync(path.join(dir, `${String(ms).padStart(5, '0')}ms.jpg`), Buffer.from(f.data, 'base64')); n++; }
  return n;
}

// 1. Slow cold "/" id/en/zh: FCP = the loader; held until React; fade; homepage; 0 frames with neither overlay nor homepage after FCP.
for (const lang of ['id', 'en', 'zh']) {
  const { ctx, p, c, frames } = await buka({ lang, net: LAMBAT, cache: false, rekamFrame: true });
  await p.waitForFunction(() => window.__r?.praHilang != null || window.__r?.home != null && !document.getElementById('pra-pemuat') && performance.now() > 9000, { timeout: 60000 }).catch(() => {});
  await tunggu(800);
  await c.send('Page.stopScreencast').catch(() => {});
  const R = await p.evaluate(() => window.__r);
  await p.screenshot({ path: path.join(OUT, `akhir-lambat-${lang}.png`) });
  const n = simpanFrame(frames, `frames-lambat-${lang}`);
  // gap = a frame after the node appeared where neither the pre-JS node, the React overlay nor the homepage is present
  const sesudah = R.frames.filter((f) => R.praMasuk != null && f.t >= R.praMasuk);
  const celah = sesudah.filter((f) => f.pra === '-' && f.react === '-' && !f.home);
  const rectSama = R.rect0 && R.rect1 && ['x', 'y', 'width', 'height'].every((k) => Math.abs(R.rect0[k] - R.rect1[k]) < 0.5);
  const teksOk = { id: 'Menyiapkan…', en: 'Preparing…', zh: '正在准备……' }[lang] === R.teks;
  lapor(`lambat-dingin-${lang}`, R.praMasuk != null && celah.length === 0 && rectSama && teksOk && R.home != null && !R.reactOverlay,
    { fcp: R.fcp, praMasuk: R.praMasuk, home: R.home, praSelesai: R.praSelesai, praHilang: R.praHilang, reactOverlayKedua: R.reactOverlay, celahTanpaOverlay: celah.length, rect0: R.rect0, rect1: R.rect1, teks: R.teks, lang: R.lang, frame100ms: n, frames: R.frames });
  await ctx.close();
}
// 2. Fast cold "/": node never inserted, homepage complete, no flash.
{
  const { ctx, p } = await buka({});
  await tunggu(2500);
  const R = await p.evaluate(() => ({ ...window.__r, ada: !!document.getElementById('pra-pemuat'), busy: document.getElementById('root').getAttribute('aria-busy') }));
  lapor('cepat-dingin', R.praMasuk == null && R.home != null && !R.ada && !R.busy, { praMasuk: R.praMasuk, home: R.home, reactOverlay: R.reactOverlay, fcp: R.fcp });
  await ctx.close();
}
// 3. Medium (1.5 MB/s, sheet held 1 s): node shown >= 600 ms then released once.
{
  const { ctx, p } = await buka({ net: SEDANG, cache: false, intercept: async (r) => { if (/miss-raksa-besar\.webp/.test(r.url())) await tunggu(1000); try { await r.continue(); } catch { /* */ } } });
  await tunggu(5000);
  const R = await p.evaluate(() => ({ ...window.__r, praT: window.__praT }));
  const tampil = R.praSelesai != null && R.praT != null ? R.praSelesai - R.praT : null;
  lapor('sedang-lembar-1s', (R.praMasuk == null && R.reactOverlay != null) || (tampil != null && tampil >= 590 && !R.reactOverlay),
    { praMasuk: R.praMasuk, praT: R.praT && Math.round(R.praT), praSelesai: R.praSelesai, praHilang: R.praHilang, dilayarMs: tampil && Math.round(tampil), reactOverlayKedua: R.reactOverlay, home: R.home });
  await ctx.close();
}
// 4. Not rendered on other routes (slow link, 2.5 s after load).
for (const rute of ['/host', '/projector', '/join', '/cerita', '/cerita/auto-2', '/acara/join', '/kenalan', '/cms', '/room/ABC123']) {
  const { ctx, p } = await buka({ url: rute, net: LAMBAT });
  await tunggu(2500);
  const r = await p.evaluate(() => ({ ada: !!document.getElementById('pra-pemuat'), fn: typeof window.__lepasPra, busy: document.getElementById('root')?.getAttribute('aria-busy') ?? null }));
  lapor(`rute ${rute}`, !r.ada && r.fn === 'undefined' && !r.busy, r);
  await ctx.close();
}
// 5. Main JS blocked: after 15 s the "too long" message, bar hidden, not stuck in aria-busy.
for (const lang of ['id', 'en', 'zh']) {
  const { ctx, p } = await buka({ lang, intercept: (r) => (/\/assets\/index-[^/]*\.js/.test(r.url()) ? r.abort() : r.continue()) });
  await tunggu(16500);
  const r = await p.evaluate(() => { const n = document.getElementById('pra-pemuat'); return { ada: !!n, teks: n?.querySelector('p').textContent, bar: n && getComputedStyle(n.querySelector('.lp-pemuat-bar')).display, busy: document.getElementById('root').getAttribute('aria-busy') }; });
  await p.screenshot({ path: path.join(OUT, `js-diblokir-${lang}.png`) });
  lapor(`js-diblokir-${lang}`, r.ada && /terlalu lama|Taking too long|加载时间过长/.test(r.teks ?? '') && r.bar === 'none' && !r.busy, r);
  await ctx.close();
}
// 6. Reduced motion before JS (slow link): bar static, Raki still; after JS with ?gerak=penuh animations resume (React side).
{
  const { ctx, p } = await buka({ net: LAMBAT, cache: false, reduce: true });
  await p.waitForSelector('#pra-pemuat', { timeout: 20000 });
  await tunggu(300);
  const r = await p.evaluate(() => { const n = document.getElementById('pra-pemuat'); return { bar: getComputedStyle(n.querySelector('.lp-pemuat-bar i')).animationName, raki: (() => { const c = getComputedStyle(n.querySelector('svg')); return c.animationDuration + ' x' + c.animationIterationCount; })(), gerak: document.documentElement.dataset.gerak ?? null }; });
  await p.screenshot({ path: path.join(OUT, 'gerak-dikurangi-prajs.png') });
  // theme.css global reduced-motion rule: every animation 0.001 ms x 1 (Raki effectively still); the bar has its own animation:none.
  lapor('gerak-dikurangi-prajs', r.bar === 'none' && /^1e-06s x1$/.test(r.raki), r);
  await ctx.close();
}
// 7. Skip-ready (sheet already decoded when React mounts, slow link) and late-sprite adoption on the slow link are both covered by 1;
//    adoption with the sprite late: slow link + sheet held 6 s -> node adopted, released at the 2000 ms cap, never a second overlay.
{
  const { ctx, p } = await buka({ net: LAMBAT, cache: false, intercept: async (r) => { if (/miss-raksa-besar\.webp/.test(r.url())) await tunggu(15000); try { await r.continue(); } catch { /* */ } } });
  await p.waitForFunction(() => window.__r?.praHilang != null, { timeout: 60000 }).catch(() => {});
  const R = await p.evaluate(() => window.__r);
  lapor('adopsi-lembar-terlambat', R.praMasuk != null && !R.reactOverlay && R.praHilang != null && R.praSelesai - R.home >= 1900 && R.praSelesai - R.home <= 2400,
    { praMasuk: R.praMasuk, home: R.home, praSelesai: R.praSelesai, praHilang: R.praHilang, selesaiSesudahHomeMs: R.praSelesai - R.home, reactOverlayKedua: R.reactOverlay });
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal}` : 'ALL PASS');
process.exit(gagal ? 1 : 0);
