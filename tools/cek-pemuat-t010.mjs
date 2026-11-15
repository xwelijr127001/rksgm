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

// 7. Part A: reduced motion (instant swap) and ?gerak=penuh, plus the 404 background state, on /cerita/auto-2 at 360x740.
for (const [nama, reduce, q, gagal] of [['gerak-ikut-dikurangi', true, '?gerak=ikut', false], ['gerak-penuh', true, '?gerak=penuh', false], ['latar-404', false, '', true]]) {
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, { reduce });
  if (gagal) { await p.setRequestInterception(true); p.on('request', (r) => (/-latar-\d+.*\.webp/.test(r.url()) ? r.respond({ status: 404, body: '' }) : r.continue())); }
  await p.goto(BASE + '/cerita/auto-2' + q);
  await p.waitForSelector('.cer-ilustrasi[data-siap]', { timeout: 20000 }).catch(() => {});
  await tunggu(600);
  const r = await p.evaluate(() => {
    const w = document.querySelector('.cer-ilustrasi');
    const k = w?.querySelector('.cer-ilustrasi-kabur');
    return { siap: w?.hasAttribute('data-siap'), gagalLatar: w?.hasAttribute('data-gagal-latar'), kaburAda: !!k, kaburOpacity: k && getComputedStyle(k).opacity, pil: !!document.querySelector('.cer-adegan-memuat'),
      transisiLapis: w && getComputedStyle(w.querySelector('img')).transitionDuration, tokoh: !!w?.querySelector('.cer-ilustrasi-tokoh'), lanjut: !!document.querySelector('button.primary-action, .hp-vn-aksi button') };
  });
  // dialogue still usable: press the first action button
  const tombol = await p.$('.hp-vn-aksi button, .hp-komposer button');
  let maju = null;
  if (tombol) { const sebelum = await p.evaluate(() => document.querySelector('.hp-vn-dialog')?.textContent); await tombol.click(); await tunggu(500); maju = (await p.evaluate(() => document.querySelector('.hp-vn-dialog')?.textContent)) !== sebelum; }
  await p.screenshot({ path: path.join(OUT, `adegan-${nama}-360.png`) });
  lapor(`adegan-${nama}`, { ...r, dialogMaju: maju });
  await ctx.close();
}

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
// 10. (D-61 / D-64) Scene pill: ~30 px tall, fits the stage, id/en/zh at 320/360/390 (webp delayed so the pill is visible).
for (const lang of ['id', 'en', 'zh']) for (const w of [320, 360, 390]) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: w === 390 ? 844 : 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((l, pj) => { localStorage.setItem('raksa:bahasa', l); localStorage.setItem('raksa:profil', pj); }, lang, PROFIL);
  await p.setRequestInterception(true);
  p.on('request', async (r) => { if (/\.webp/.test(r.url()) && !r.url().startsWith('data:')) await tunggu(4000); try { await r.continue(); } catch { /* */ } });
  await p.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.cer-adegan-memuat', { timeout: 15000 }).catch(() => {});
  await tunggu(300);
  const r = await p.evaluate(() => {
    const e = document.querySelector('.cer-adegan-memuat'); const st = document.querySelector('.cer-panggung.cer-latar');
    if (!e) return null;
    const a = e.getBoundingClientRect(), s = st.getBoundingClientRect();
    return { h: Math.round(a.height * 10) / 10, w: Math.round(a.width), kiri: Math.round(a.left - s.left), kanan: Math.round(s.right - a.right), teks: e.textContent, pas: a.left >= s.left && a.right <= s.right };
  });
  if (r) await p.screenshot({ path: path.join(OUT, `pil-${w}-${lang}.png`), clip: { x: 0, y: 0, width: w, height: 420 } });
  lapor(`pil-${w}-${lang}`, r ?? { pil: 'tidak ada' });
  await ctx.close();
}
// 11. (D-61) The activity-loading fallback `.cer-memuat` (cerita.css) carries no pill rules: no stylesheet rule for `.cer-memuat`
// sets position/top/border-radius (the scene pill is `.cer-adegan-memuat`).
{
  const ctx = await b.createBrowserContext();
  const p = await halaman(ctx, {});
  await p.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.cer-ilustrasi', { timeout: 20000 }).catch(() => {});
  const r = await p.evaluate(() => {
    const out = [];
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; }
      const jalan = (rs) => { for (const x of rs) { if (x.cssRules && !x.selectorText) jalan(x.cssRules); else if (x.selectorText && /(^|[\s,])\.cer-memuat(?![-\w])/.test(x.selectorText)) out.push(x.cssText.slice(0, 160)); } };
      jalan(rules); }
    return out;
  });
  lapor('cer-memuat-aturan', { aturan: r, tanpaPil: r.every((x) => !/position|border-radius|top:/.test(x)) });
  await ctx.close();
}

await b.close();
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
