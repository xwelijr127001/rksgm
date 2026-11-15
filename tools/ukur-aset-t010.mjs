/**
 * T-010 measurement harness (team/specs/2026-11-15-aset-episode2.md, Work 0 / 4). Production build only.
 *
 *   npm run build && npm start            # server on http://127.0.0.1:4000 (UI_BASE to change)
 *   node tools/ukur-aset-t010.mjs <label> [--runs 5] [--journeys a,b,c] [--vp 360,390] [--frames]
 *        [--fail-latar]   (404 every *-latar-* background: failure-path check)
 *
 * Chrome (puppeteer-core, RAKSA_CHROME or the standard path), fresh incognito context per cold run, cache ENABLED inside
 * the context (transferSize per request recorded). Before navigation: CPU 4x, Network.emulateNetworkConditions
 * 200,000 B/s down / 94,000 B/s up / 150 ms latency. Viewports: 360x740 DPR 2 and 390x844 DPR 3 (mobile, touch).
 * Journeys: (a) cold "/"; (b) "/" -> Mode Cerita card -> /cerita (fixed 3 s dwell after the list renders) -> Episode 2
 * "Mulai"; (c) direct /cerita/auto-2 cold. Readiness from in-page timestamps (performance.now, rAF + 50 ms sampler,
 * img decode), never networkidle. Output: team/evidence/T-010/<label>/hasil.json + ringkas.md (median / p95 of 5).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const LABEL = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'tmp';
const RUNS = Number(arg('--runs', 5));
const JOURNEYS = arg('--journeys', 'a,b,c').split(',');
const VPS = arg('--vp', '360,390').split(',');
const FRAMES = process.argv.includes('--frames');
const FAIL_LATAR = process.argv.includes('--fail-latar');
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve('team/evidence/T-010', LABEL);
fs.mkdirSync(OUT, { recursive: true });
const VIEW = {
  360: { width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  390: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const NET = { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 94000 };
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const DWELL_MS = 3000;

/** In-page probe: timestamps (ms since navigation start) for the homepage and the Episode 2 stage. */
function probe(profil) {
  try { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', profil); localStorage.setItem('raksa:diag', '1'); } catch { /* */ }
  const R = (window.__t010 = { lcp: null, lcpEl: null, loader: {}, ep: null, sampel: [], decode: {} });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { R.lcp = Math.round(e.startTime); R.lcpEl = e.element ? (e.element.className || e.element.tagName) + '' : e.url; } })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* */ }
  const now = () => Math.round(performance.now());
  const cek = () => {
    const ld = document.querySelector('.lp-pemuat');
    if (ld && R.loader.tampil == null) R.loader.tampil = now();
    if (ld && ld.hasAttribute('data-selesai') && R.loader.selesai == null) R.loader.selesai = now();
    if (R.loader.tampil != null && !ld && R.loader.hilang == null) R.loader.hilang = now();
    if (/\/cerita\/auto-2/.test(location.pathname)) {
      const e = (R.ep ??= { mulai: now(), panggung: null, ruang: null, ruangJenis: null, dialog: null, siap: null, final: null, gagal: false });
      const w = document.querySelector('.cer-main .cer-latar .cer-ilustrasi, .hp-main .cer-latar .cer-ilustrasi');
      if (w && e.panggung == null) e.panggung = now();
      const dlg = document.querySelector('.hp-vn-dialog .hp-ucapan-teks, .hp-vn-dialog .hp-narasi');
      if (dlg && e.dialog == null) e.dialog = now();
      if (w) {
        const imgs = [...w.querySelectorAll('img')];
        const lat = w.querySelector('img[data-lapis="latar"]');
        const kabur = w.querySelector('.cer-ilustrasi-kabur');
        const latOk = lat && lat.complete && lat.naturalWidth > 0 && getComputedStyle(lat).opacity !== '0';
        if (e.ruang == null && (latOk || (kabur && getComputedStyle(kabur).opacity !== '0'))) { e.ruang = now(); e.ruangJenis = latOk ? 'latar' : 'kabur'; }
        if (w.hasAttribute('data-siap') && e.siap == null) { e.siap = now(); e.gagal = w.hasAttribute('data-gagal-latar'); }
        // R-13: per required image (every <img> in the world): decode() success + naturalWidth > 0 for its CURRENT file = ok;
        // complete with naturalWidth 0 or decode rejected = failed. Failed required images are never counted as ready.
        const st = (R._st ??= new WeakMap());
        for (const i of imgs) {
          const s0 = st.get(i);
          if (s0 && s0.src === i.currentSrc) continue;
          if (!i.complete || !i.getAttribute('src')) continue;
          const k = i.dataset.lapis || i.dataset.tokoh || '?';
          if (i.naturalWidth > 0) {
            const s1 = { src: i.currentSrc, ok: null };
            st.set(i, s1);
            i.decode().then(() => { s1.ok = i.naturalWidth > 0; if (s1.ok && R.decode[k] == null) R.decode[k] = now(); }, () => { s1.ok = false; R.decode[k] = 'gagal'; });
          } else { st.set(i, { src: i.currentSrc, ok: false }); R.decode[k] = 'gagal'; }
        }
        const status = imgs.map((i) => { const x = st.get(i); return x && x.src === i.currentSrc ? x.ok : null; });
        e.gagalWajib = Math.max(e.gagalWajib ?? 0, status.filter((x) => x === false).length);
        const decoded = imgs.length > 0 && status.every((x) => x === true);
        if (decoded && e.decodeSiap == null) e.decodeSiap = now();
        // Visibly revealed: decoded + (gated world: data-siap) + every required layer at full opacity.
        const gerbang = w.hasAttribute('data-gerbang');
        const terlihat = decoded && (!gerbang || w.hasAttribute('data-siap')) && imgs.every((i) => Number(getComputedStyle(i).opacity) >= 0.99);
        if (terlihat && e.final == null) { e.final = now(); e.finalSrc = imgs.map((i) => (i.dataset.lapis || i.dataset.tokoh || '?') + ':' + i.currentSrc.split('/').pop()); }
        if (e.finalSrc == null && imgs.length) e.srcKini = imgs.map((i) => (i.dataset.lapis || i.dataset.tokoh || '?') + ':' + i.currentSrc.split('/').pop());
      }
    }
  };
  const loop = () => { cek(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  setInterval(() => {
    cek();
    if (!R.ep) return;
    const w = document.querySelector('.cer-latar .cer-ilustrasi');
    const op = (s) => { const e = w?.querySelector(s); return e ? Number(getComputedStyle(e).opacity).toFixed(2) : null; };
    const lat = w?.querySelector('img[data-lapis="latar"]');
    R.sampel.push({
      t: now(),
      panggung: !!w,
      kabur: op('.cer-ilustrasi-kabur'),
      latar: lat ? (lat.complete && lat.naturalWidth ? op('img[data-lapis="latar"]') : 'memuat') : null,
      tokoh: op('.cer-ilustrasi-tokoh'),
      depan: op('img[data-lapis="depan"]'),
      pil: !!document.querySelector('.cer-adegan-memuat:not([data-selesai])'),
      siap: !!w?.hasAttribute('data-siap'),
      dialog: !!document.querySelector('.hp-vn-dialog .hp-ucapan-teks, .hp-vn-dialog .hp-narasi'),
    });
  }, 50);
}

const med = (a) => { const v = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2); };
const p95 = (a) => { const v = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); return v.length ? v[Math.min(v.length - 1, Math.ceil(v.length * 0.95) - 1)] : null; };
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function satuRun(browser, jurney, vp, run) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEW[vp]);
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const req = new Map();
  cdp.on('Network.requestWillBeSent', (e) => req.set(e.requestId, { url: e.request.url.replace(BASE, ''), t0: e.timestamp, type: e.type }));
  cdp.on('Network.requestServedFromCache', (e) => { const r = req.get(e.requestId); if (r) r.memori = true; });
  cdp.on('Network.responseReceived', (e) => { const r = req.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.disk = !!e.response.fromDiskCache; r.type = e.type; } });
  cdp.on('Network.loadingFinished', (e) => { const r = req.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.t1 = e.timestamp; } });
  cdp.on('Network.loadingFailed', (e) => { const r = req.get(e.requestId); if (r) r.gagal = e.errorText; });
  if (FAIL_LATAR) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (/-latar-\d+.*\.webp/.test(r.url()) ? r.respond({ status: 404, body: '' }) : r.continue()));
  }
  await page.evaluateOnNewDocument(probe, PROFIL);
  const frames = [];
  if (FRAMES && run === 0 && jurney !== 'a') {
    cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* */ } });
  }
  const hasil = { jurney, vp, run };
  const t0 = Date.now();
  if (jurney === 'c') {
    if (FRAMES && run === 0) await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, everyNthFrame: 1 }).catch(() => {});
    await page.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded', timeout: 90000 });
  } else {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('.lp-judul', { timeout: 60000 });
    if (jurney === 'b') {
      // Homepage settled (fixed wait after h1 + loader gone), then Mode Cerita -> list -> dwell -> Episode 2.
      await page.waitForFunction(() => !document.querySelector('.lp-pemuat'), { timeout: 30000 });
      await tunggu(1500);
      await page.click('a.lp-pintu-cerita-solo');
      await page.waitForSelector('a[href$="/cerita/auto-2"]', { timeout: 60000 });
      await tunggu(DWELL_MS);
      hasil.warmUp = await page.evaluate(() => window.__raksaHangat ? { ...window.__raksaHangat } : null);
      if (FRAMES && run === 0) await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, everyNthFrame: 1 }).catch(() => {});
      hasil.selesaiSebelumKlik = [...req.values()].filter((r) => r.t1 && !r.gagal).map((r) => r.url);
      hasil.dimintaSebelumKlik = new Set(req.keys());
      hasil.klikEpisode = await page.evaluate(() => Math.round(performance.now()));
      await page.click('a[href$="/cerita/auto-2"]');
    } else {
      await tunggu(6000);
    }
  }
  if (jurney !== 'a') {
    // Failure runs never reach "final" (a required image failed): stop once the gate settled with a failure.
    await page.waitForFunction(() => window.__t010?.ep?.final != null || (window.__t010?.ep?.siap != null && window.__t010?.ep?.gagalWajib > 0), { timeout: 30000 }).catch(() => { hasil.timeout = true; });
    await tunggu(800);
  }
  const R = await page.evaluate(() => window.__t010);
  if (FRAMES && frames.length) {
    await cdp.send('Page.stopScreencast').catch(() => {});
    const dir = path.join(OUT, `frames-${jurney}-${vp}`);
    fs.mkdirSync(dir, { recursive: true });
    const base = frames[0].ts;
    frames.forEach((f, i) => fs.writeFileSync(path.join(dir, `${String(i).padStart(3, '0')}-${Math.round((f.ts - base) * 1000)}ms.jpg`), Buffer.from(f.data, 'base64')));
  }
  if (jurney !== 'a' && run === 0) await page.screenshot({ path: path.join(OUT, `akhir-${jurney}-${vp}.png`) });
  const daftar = [...req.values()].filter((r) => !r.url.startsWith('data:'));
  const perJenis = {};
  for (const r of daftar) { const k = r.type || 'Other'; perJenis[k] = (perJenis[k] || 0) + (r.bytes || 0); }
  Object.assign(hasil, {
    durasiMs: Date.now() - t0,
    lcp: R.lcp, lcpEl: R.lcpEl, loader: R.loader,
    ep: R.ep, decode: R.decode,
    // Episode times relative to the episode route start (b: click, c: navigation).
    relatif: R.ep ? Object.fromEntries(['panggung', 'ruang', 'dialog', 'decodeSiap', 'siap', 'final'].map((k) => [k, R.ep[k] == null ? null : R.ep[k] - (jurney === 'b' ? hasil.klikEpisode : 0)])) : null,
    ruangJenis: R.ep?.ruangJenis ?? null,
    bytes: daftar.reduce((n, r) => n + (r.bytes || 0), 0), perJenis, permintaan: daftar.length,
    gambar: daftar.filter((r) => /\.(webp|png|jpe?g|svg)(\?|$)/.test(r.url)).map((r) => ({ url: r.url, status: r.status, bytes: r.bytes, disk: r.disk, memori: !!r.memori, gagal: r.gagal })),
    sampel: run === 0 ? R.sampel : undefined,
  });
  // Warm-up cache hit: the scene's background file was fully downloaded BEFORE the click and not fetched again over the network.
  const latarAdegan = (R.ep?.finalSrc ?? R.ep?.srcKini)?.find((x) => x.startsWith('latar:'))?.slice(6);
  if (jurney === 'b' && latarAdegan) {
    const rs = daftar.filter((r) => r.url.endsWith(latarAdegan));
    const ulang = rs.filter((r) => !hasil.selesaiSebelumKlik.includes(r.url) || rs.indexOf(r) > 0).filter((r) => !(r.disk || r.memori || r.status === 304 || r.bytes === 0));
    // Strict: finished before the click. Acceptance: no network request for the scene background was started after the click
    // (the warm-up's own request may still be completing; the scene then reuses it / the cache, transfer 0 B at mount).
    // R-13: COMPLETED cache hit = the warm-up download had FINISHED before the click and nothing was fetched again; IN-FLIGHT reuse
    // = the warm-up request started before the click, finished after it, and the scene made no new network request. Runs where a
    // required scene image failed count as neither.
    const sesudahKlik = [...req.entries()].filter(([id, r]) => !hasil.dimintaSebelumKlik.has(id) && r.url.endsWith(latarAdegan) && !(r.disk || r.memori || r.status === 304 || r.bytes === 0));
    const dimulaiSebelum = [...req.entries()].some(([id, r]) => hasil.dimintaSebelumKlik.has(id) && r.url.endsWith(latarAdegan));
    const ok = !(R.ep?.gagalWajib > 0);
    hasil.hangatSelesai = ok && hasil.selesaiSebelumKlik.some((u) => u.endsWith(latarAdegan)) && ulang.length === 0 && sesudahKlik.length === 0;
    hasil.hangatDipakaiUlang = ok && !hasil.hangatSelesai && dimulaiSebelum && sesudahKlik.length === 0;
    hasil.varianLatar = [...new Set(daftar.filter((r) => /-latar-[0-9]+/.test(r.url)).map((r) => r.url.split('/').pop()))];
  }
  delete hasil.selesaiSebelumKlik; delete hasil.dimintaSebelumKlik;
  await ctx.close();
  return hasil;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run'] });
const ver = await browser.version();
const semua = [];
for (const j of JOURNEYS) for (const vp of VPS) for (let i = 0; i < RUNS; i++) {
  const h = await satuRun(browser, j, vp, i);
  semua.push(h);
  console.log(`${j} ${vp} #${i}: lcp=${h.lcp} loader=${JSON.stringify(h.loader)} ruang=${h.relatif?.ruang} (${h.ruangJenis}) dialog=${h.relatif?.dialog} siap=${h.relatif?.siap} final=${h.relatif?.final} bytes=${h.bytes} req=${h.permintaan}${h.timeout ? ' TIMEOUT' : ''}`);
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify({ label: LABEL, chrome: ver, base: BASE, net: NET, cpu: 4, dwellMs: DWELL_MS, failLatar: FAIL_LATAR, runs: semua }, null, 1));

const baris = ['| journey | vp | metric | median | p95 (descriptive, n=' + RUNS + ') |', '|---|---|---|---|---|'];
for (const j of JOURNEYS) for (const vp of VPS) {
  const rs = semua.filter((r) => r.jurney === j && r.vp === vp);
  const m = (lab, f) => baris.push(`| ${j} | ${vp} | ${lab} | ${med(rs.map(f))} | ${p95(rs.map(f))} |`);
  if (j === 'a') { m('LCP ms', (r) => r.lcp); m('loader shown ms', (r) => r.loader?.tampil); m('loader dismissed ms', (r) => r.loader?.selesai); }
  else {
    m('stage mounted ms', (r) => r.relatif?.panggung); m('first room treatment ms', (r) => r.relatif?.ruang); m('dialogue visible ms', (r) => r.relatif?.dialog);
    m('all required layers decoded ms', (r) => r.relatif?.decodeSiap); m('group reveal flag (data-siap) ms', (r) => r.relatif?.siap); m('visibly revealed (decoded + flag + opacity 1) ms', (r) => r.relatif?.final);
    baris.push(`| ${j} | ${vp} | runs with a failed required image | ${rs.filter((r) => r.ep?.gagalWajib > 0).length}/${rs.length} | |`);
  }
  if (j === 'b') {
    baris.push(`| b | ${vp} | warm-up COMPLETED cache hit (finished before click, not refetched) | ${rs.filter((r) => r.hangatSelesai).length}/${rs.length} | |`);
    baris.push(`| b | ${vp} | warm-up in-flight reuse (started before click, finished after, not refetched) | ${rs.filter((r) => r.hangatDipakaiUlang).length}/${rs.length} | |`);
  }
  m('bytes total', (r) => r.bytes); m('image bytes', (r) => r.perJenis.Image ?? 0); m('script bytes', (r) => r.perJenis.Script ?? 0); m('requests', (r) => r.permintaan);
}
fs.writeFileSync(path.join(OUT, 'ringkas.md'), `# T-010 ${LABEL}\n\nChrome ${ver} · ${BASE} · CPU 4x · ${NET.downloadThroughput} B/s down / ${NET.uploadThroughput} B/s up / ${NET.latency} ms · fresh incognito context per run · cache enabled · dwell ${DWELL_MS} ms${FAIL_LATAR ? ' · 404 on backgrounds' : ''}\n\n${baris.join('\n')}\n`);
console.log(baris.join('\n'));
