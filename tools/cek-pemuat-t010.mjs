/**
 * T-010 loader + Part A state checks (production server :4000, no throttle unless noted). Output: team/evidence/T-010/pemuat/.
 *   node tools/cek-pemuat-t010.mjs
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const OUT = path.resolve('team/evidence/T-010/pemuat');
fs.mkdirSync(OUT, { recursive: true });
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = [];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function halaman(ctx, { w = 360, h = 740, lang = 'id', tahanLembar = 0, reduce = false, kirimLembar = true } = {}) {
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 900, hasTouch: w < 900 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }]);
  await p.evaluateOnNewDocument((l, pj) => {
    localStorage.setItem('raksa:bahasa', l); localStorage.setItem('raksa:profil', pj);
    const R = (window.__p = { tampil: null, selesai: null, hilang: null, inertSaatTampil: null, statusTeks: null, fokus: [] });
    const cek = () => {
      const o = document.querySelector('.lp-pemuat');
      const t = Math.round(performance.now());
      if (o && R.tampil == null) { R.tampil = t; R.inertSaatTampil = document.getElementById('root')?.hasAttribute('inert'); R.statusTeks = o.querySelector('[role=status]')?.textContent; R.statusDiLuarRoot = !document.getElementById('root')?.contains(o); }
      if (o?.hasAttribute('data-selesai') && R.selesai == null) { R.selesai = t; R.inertSaatSelesai = document.getElementById('root')?.hasAttribute('inert'); }
      if (R.tampil != null && !o && R.hilang == null) R.hilang = t;
      requestAnimationFrame(cek);
    };
    requestAnimationFrame(cek);
    document.addEventListener('focusin', (e) => R.fokus.push({ t: Math.round(performance.now()), el: e.target.tagName + (e.target.className ? '.' + String(e.target.className).split(' ')[0] : ''), pemuat: !!document.querySelector('.lp-pemuat') }), true);
  }, lang, PROFIL);
  if (tahanLembar || !kirimLembar) {
    await p.setRequestInterception(true);
    p.on('request', async (r) => {
      if (/miss-raksa-besar\.webp/.test(r.url())) { if (!kirimLembar) return; await tunggu(tahanLembar); try { await r.continue(); } catch { /* */ } return; }
      r.continue();
    });
  }
  return p;
}
const lapor = (nama, x) => { hasil.push({ nama, ...x }); console.log(nama, JSON.stringify(x)); };

// 1. Cold "/" with the sheet held 1.5 s: 360 / 390 / 1280, id/en/zh. Dismiss when the sheet decodes (not the cap).
for (const [w, h, lang] of [[360, 740, 'id'], [390, 844, 'en'], [1280, 800, 'zh']]) {
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { w, h, lang, tahanLembar: 1500 });
  await p.goto(BASE + '/');
  await p.waitForSelector('.lp-pemuat', { timeout: 15000 }).catch(() => {});
  await tunggu(300);
  await p.screenshot({ path: path.join(OUT, `pemuat-${w}x${h}-${lang}.png`) });
  await p.waitForFunction(() => window.__p.hilang != null, { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate(() => ({ ...window.__p, scroll: document.documentElement.scrollHeight, rootInert: document.getElementById('root').hasAttribute('inert'), kunci: sessionStorage.getItem('raksa:loader:v1') }));
  lapor(`dingin-tahan1500-${w}-${lang}`, { tampil: r.tampil, selesai: r.selesai, hilang: r.hilang, durasi: r.selesai - r.tampil, inertSaatTampil: r.inertSaatTampil, inertSaatSelesai: r.inertSaatSelesai, statusTeks: r.statusTeks, statusDiLuarRoot: r.statusDiLuarRoot, rootInertAkhir: r.rootInert, kunci: r.kunci });
  // 2. Second visit in the same session: no loader.
  await p.goto(BASE + '/'); await tunggu(1500);
  lapor(`kunjungan-kedua-${w}`, { tampil: await p.evaluate(() => window.__p.tampil) });
  await ctx.close();
}

// 3. Cap: sheet never arrives -> dismissal at ~2000 ms after mount; layout positions equal the final ones.
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { kirimLembar: false });
  await p.goto(BASE + '/');
  await p.waitForFunction(() => window.__p.hilang != null, { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate(() => ({ ...window.__p, frame: (() => { const e = document.querySelector('.lp-kota-bingkai'); const b = e?.getBoundingClientRect(); return b && [b.left, b.top, b.width, b.height]; })(), masuk: document.querySelector('.lp-join-mulai')?.getBoundingClientRect().bottom }));
  lapor('batas-lembar-macet', { tampil: r.tampil, selesai: r.selesai, durasiSampaiLepas: r.selesai - r.tampil, frame: r.frame, masukBottom: r.masuk });
  await p.screenshot({ path: path.join(OUT, 'batas-lembar-macet-360.png') });
  await ctx.close();
}

// 4. Reduced motion: bar static (no animation), instant dismissal (no transition).
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { reduce: true, tahanLembar: 1000 });
  await p.goto(BASE + '/');
  await p.waitForSelector('.lp-pemuat', { timeout: 15000 });
  const r = await p.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.lp-pemuat-bar i')).animationName, trans: getComputedStyle(document.querySelector('.lp-pemuat')).transitionDuration }));
  await p.screenshot({ path: path.join(OUT, 'pemuat-gerak-dikurangi-360.png') });
  lapor('gerak-dikurangi', r);
  await ctx.close();
}

// 5. Not mounted on other routes (cold, sheet held so it would show if mounted).
for (const rute of ['/host', '/projector', '/join', '/cerita', '/acara/join', '/cerita/auto-2', '/kenalan']) {
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { tahanLembar: 1500 });
  await p.goto(BASE + rute); await tunggu(2500);
  lapor(`rute ${rute}`, { tampil: await p.evaluate(() => window.__p.tampil), url: p.url().replace(BASE, '') });
  await ctx.close();
}

// 6. Focus: user navigates /cerita -> "/" (back link) while the loader is shown -> focus on h1 only after the overlay is gone.
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { tahanLembar: 1500 });
  await p.goto(BASE + '/cerita'); await p.waitForSelector('a.back-link'); await tunggu(500);
  await p.click('a.back-link');
  await p.waitForFunction(() => window.__p.hilang != null, { timeout: 15000 }).catch(() => {});
  await tunggu(600);
  const r = await p.evaluate(() => ({ p: window.__p, aktif: document.activeElement?.tagName + '.' + document.activeElement?.className }));
  const fokusH1 = r.p.fokus.filter((f) => f.el.startsWith('H1'));
  lapor('fokus-sesudah-lepas', { tampil: r.p.tampil, hilang: r.p.hilang, fokusH1: fokusH1.map((f) => ({ t: f.t, pemuatMasihAda: f.pemuat })), aktifAkhir: r.aktif });
  await ctx.close();
}
// 6b. Cold "/" (document load, not a user navigation): existing policy = no focus move.
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { tahanLembar: 1500 });
  await p.goto(BASE + '/');
  await p.waitForFunction(() => window.__p.hilang != null, { timeout: 15000 }).catch(() => {});
  await tunggu(600);
  lapor('fokus-muat-awal', { fokus: await p.evaluate(() => window.__p.fokus), aktif: await p.evaluate(() => document.activeElement?.tagName) });
  await ctx.close();
}

// 7. RETIRED in T-013 Stage 3: the AUTO-2 illustrated placeholder (blurred thumbnail, 404 background, reduced-motion swap) no
// longer exists; Episode 2 scenes are checked by tools/cek-piksel-t013.mjs (pixel stage, incl. the reduced-motion probe).

// 8. (fix round, D-62 / D-59) Cold "/" with NO hold (fast link, preload restored): skipped, or on screen >= 600 ms.
for (const lang of ['id', 'en']) {
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { lang });
  await p.goto(BASE + '/');
  await tunggu(2500);
  const r = await p.evaluate(() => window.__p);
  lapor(`dingin-cepat-${lang}`, { tampil: r.tampil, selesai: r.selesai, durasi: r.tampil == null ? null : r.selesai - r.tampil, lulus: r.tampil == null || r.selesai - r.tampil >= 600 - 20 });
  await ctx.close();
}
// 9. (D-62) Sheet held only 200 ms: essentials arrive early, the loader still stays >= 600 ms from first paint.
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { tahanLembar: Number(process.env.TAHAN_MIN || 700) });
  await p.goto(BASE + '/');
  await p.waitForFunction(() => window.__p.hilang != null || (performance.now() > 4000), { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate(() => window.__p);
  lapor('tahan-singkat-minimal600', { tampil: r.tampil, selesai: r.selesai, durasi: r.tampil == null ? null : r.selesai - r.tampil });
  await ctx.close();
}
// 10 + 11. RETIRED in T-013 Stage 3: the scene pill `.cer-adegan-memuat` was removed with the illustrated stage.

await b.close();
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
