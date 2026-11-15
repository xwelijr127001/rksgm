/**
 * T-010 fix round: failure / race matrix for the Episode 2 scene gate (R-11, R-12, R-14, D-55) on the PRODUCTION server.
 *   npm run build && npm start          (or RAKSA_LEGACY=on npm start)
 *   node tools/cek-gagal-t010.mjs        -> team/evidence/T-010/gagal/ (screenshots + hasil.json); exit 1 if a case fails
 *
 * Cases (360x740 DPR 2 unless noted; images delayed by request interception so "mid-load" is real):
 *  latar-404, depan-404, tokoh-rusak (corrupt webp bytes for the character), ekspresi-saat-muat (Lanjut pressed while the
 *  first scene is still loading: buka.1 tersenyum -> buka.2 netral), dpr-saat-muat (DPR 2 -> 3 while loading), putar-saat-hangat
 *  (list page rotated to landscape during the warm-up dwell, then Episode 2 opened in landscape), lokasi-kedua (D-55: saved
 *  progress from tools/cerita/state-lokasi-kedua.mts, one Lanjut moves kantor -> pool).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const OUT = path.resolve('team/evidence/T-010/gagal');
fs.mkdirSync(OUT, { recursive: true });
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = [];
let gagalTotal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagalTotal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };

/** Page probe: records the gate's state at the moment data-siap appears. */
function probe(pj, extra) {
  localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); localStorage.setItem('raksa:diag', '1');
  sessionStorage.setItem('raksa:loader:v1', '1');
  if (extra) localStorage.setItem(extra.k, extra.v);
  const R = (window.__g = { menungguPernah: false, saatSiap: null, frames: [] });
  const snap = () => {
    const w = document.querySelector('.cer-ilustrasi[data-gerbang]');
    if (!w) return null;
    return {
      t: Math.round(performance.now()), lokasi: w.closest('.cer-latar')?.getAttribute('data-lokasi'), siap: w.hasAttribute('data-siap'), gagalLatar: w.hasAttribute('data-gagal-latar'),
      menunggu: !!w.querySelector('[data-menunggu]'), kabur: (() => { const k = w.querySelector('.cer-ilustrasi-kabur'); return k ? { op: getComputedStyle(k).opacity, bg: k.style.backgroundImage.slice(0, 60) } : null; })(),
      imgs: [...w.querySelectorAll('img')].map((i) => ({ l: i.dataset.lapis || i.dataset.tokoh, src: i.currentSrc.split('/').pop(), ok: i.complete && i.naturalWidth > 0, ek: i.dataset.ekspresi, op: getComputedStyle(i).opacity, vis: getComputedStyle(i).visibility })),
      siluet: [...w.querySelectorAll('.cer-ilustrasi-siluet')].map((e) => e.dataset.tokoh), pil: !!document.querySelector('.cer-adegan-memuat:not([data-selesai])'),
    };
  };
  const loop = () => {
    const s = snap();
    if (s) {
      if (s.menunggu) R.menungguPernah = true;
      if (s.siap && !R.saatSiap) R.saatSiap = s;
      const l = R.frames[R.frames.length - 1];
      if (!l || l.lokasi !== s.lokasi || l.siap !== s.siap || !!l.kabur !== !!s.kabur) R.frames.push(s);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__snap = snap;
}

async function buka(nama, { w = 360, h = 740, dpr = 2, tunda = 0, ubah, extra, url = '/cerita/auto-2', net } = {}) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  if (net) { const c = await p.createCDPSession(); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', net); }
  await p.evaluateOnNewDocument(probe, PROFIL, extra ?? null);
  await p.setRequestInterception(true);
  p.on('request', async (r) => {
    const u = r.url();
    if (/\.webp/.test(u) && !u.startsWith('data:')) {
      const res = ubah ? ubah(u) : null;
      if (res?.delay) await tunggu(res.delay);
      if (res?.respond) { try { await r.respond(res.respond); } catch { /* */ } return; }
      if (!res && tunda) await tunggu(tunda);
    }
    try { await r.continue(); } catch { /* */ }
  });
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  return { ctx, p };
}
const tungguSiap = (p, ms = 15000) => p.waitForFunction(() => window.__g?.saatSiap, { timeout: ms }).catch(() => null);
const tekanLanjut = async (p) => { const t = await p.$('.hp-vn-aksi button, .hp-komposer button'); if (!t) return false; await t.click(); return true; };
const dialogMaju = async (p) => { const a = await p.evaluate(() => document.querySelector('.hp-vn-dialog')?.textContent); const ok = await tekanLanjut(p); await tunggu(500); return ok && (await p.evaluate(() => document.querySelector('.hp-vn-dialog')?.textContent)) !== a; };

// 1. background 404 -> blurred room stays (data-gagal-latar, failed bg hidden), pill gone, character visible, dialogue usable
{
  const { ctx, p } = await buka('latar-404', { ubah: (u) => (/-latar-\d+/.test(u) ? { respond: { status: 404, body: '' } } : null) });
  await tungguSiap(p); await tunggu(600);
  const s = await p.evaluate(() => window.__snap());
  await p.screenshot({ path: path.join(OUT, 'latar-404-360.png') });
  const maju = await dialogMaju(p);
  lapor('latar-404', s.gagalLatar && s.kabur?.op === '1' && !s.pil && s.imgs.some((i) => i.l === 'missRaksa' && i.ok) && maju, { s, dialogMaju: maju });
  await ctx.close();
}
// 2. foreground 404 -> foreground OMITTED, room + character revealed, placeholder gone
{
  const { ctx, p } = await buka('depan-404', { ubah: (u) => (/-depan-\d+/.test(u) ? { respond: { status: 404, body: '' } } : null) });
  await tungguSiap(p); await tunggu(600);
  const s = await p.evaluate(() => window.__snap());
  await p.screenshot({ path: path.join(OUT, 'depan-404-360.png') });
  lapor('depan-404', s.siap && !s.gagalLatar && !s.imgs.some((i) => i.l === 'depan') && s.imgs.some((i) => i.l === 'latar' && i.ok) && !s.kabur, { s });
  await ctx.close();
}
// 3. corrupt character bytes (decode failure) -> named silhouette, scene still revealed
{
  const { ctx, p } = await buka('tokoh-rusak', { ubah: (u) => (/miss-salam-/.test(u) ? { respond: { status: 200, contentType: 'image/webp', body: Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 rusak-bukan-gambar'.repeat(20)) } } : null) });
  await tungguSiap(p); await tunggu(600);
  const s = await p.evaluate(() => window.__snap());
  await p.screenshot({ path: path.join(OUT, 'tokoh-rusak-360.png') });
  lapor('tokoh-rusak', s.siap && s.siluet.includes('missRaksa') && !s.imgs.some((i) => i.l === 'missRaksa') && s.imgs.some((i) => i.l === 'latar' && i.ok), { s });
  await ctx.close();
}
// 4. expression change while the first scene is still loading: the gate must not reveal with the OLD character image
{
  const { ctx, p } = await buka('ekspresi-saat-muat', { tunda: 1800 });
  await p.waitForSelector('.cer-ilustrasi[data-gerbang]', { timeout: 20000 });
  await tunggu(200);
  await tekanLanjut(p); // buka.1 tersenyum (miss-salam) -> buka.2 netral (miss-senyum)
  await tungguSiap(p, 20000); await tunggu(400);
  const r = await p.evaluate(() => ({ g: { menungguPernah: window.__g.menungguPernah, saatSiap: window.__g.saatSiap }, kini: window.__snap() }));
  await p.screenshot({ path: path.join(OUT, 'ekspresi-saat-muat-360.png') });
  const tokohSaatSiap = r.g.saatSiap?.imgs.find((i) => i.l === 'missRaksa');
  lapor('ekspresi-saat-muat', !!r.g.saatSiap && !r.g.saatSiap.menunggu && /miss-senyum/.test(tokohSaatSiap?.src ?? '') && tokohSaatSiap.ok,
    { menungguPernahTerlihat: r.g.menungguPernah, tokohSaatSiap, menungguSaatSiap: r.g.saatSiap?.menunggu });
  await ctx.close();
}
// 5. DPR change while loading (2 -> 3): the gate restarts on the new descriptors; revealed layers are decoded
{
  const { ctx, p } = await buka('dpr-saat-muat', { tunda: 1500 });
  await p.waitForSelector('.cer-ilustrasi[data-gerbang]', { timeout: 20000 });
  const sebelum = await p.evaluate(() => window.__snap().imgs.map((i) => i.src));
  await p.setViewport({ width: 360, height: 740, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await tungguSiap(p, 20000); await tunggu(400);
  const r = await p.evaluate(() => ({ saatSiap: window.__g.saatSiap, dpr: devicePixelRatio, kini: window.__snap() }));
  await p.screenshot({ path: path.join(OUT, 'dpr-saat-muat-360.png') });
  lapor('dpr-saat-muat', !!r.saatSiap && r.saatSiap.imgs.every((i) => i.ok) && r.dpr === 3, { sebelum, saatSiap: r.saatSiap.imgs, dpr: r.dpr });
  await ctx.close();
}
// 6. rotation during the list-page warm-up (throttled): warm-up re-runs for the landscape stage; the scene's bg is not refetched
{
  const net = { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 94000 };
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const c = await p.createCDPSession(); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', net);
  const req = [];
  c.on('Network.requestWillBeSent', (e) => req.push({ id: e.requestId, url: e.request.url.split('/').pop(), t: Date.now() }));
  await p.evaluateOnNewDocument(probe, PROFIL, null);
  await p.goto(BASE + '/cerita', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('a[href$="/cerita/auto-2"]', { timeout: 60000 });
  await tunggu(700);
  const hSebelum = await p.evaluate(() => JSON.parse(JSON.stringify(window.__raksaHangat ?? null)));
  await p.setViewport({ width: 740, height: 360, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); // rotate mid warm-up
  await tunggu(6000);
  const hSesudah = await p.evaluate(() => JSON.parse(JSON.stringify(window.__raksaHangat ?? null)));
  const tKlik = Date.now();
  await p.click('a[href$="/cerita/auto-2"]');
  await tungguSiap(p, 30000); await tunggu(500);
  const s = await p.evaluate(() => window.__snap());
  await p.screenshot({ path: path.join(OUT, 'putar-saat-hangat-740x360.png') });
  const latar = s.imgs.find((i) => i.l === 'latar')?.src;
  const sesudahKlik = req.filter((r) => r.t >= tKlik && r.url === latar);
  const hangatGenBaru = (hSesudah?.selesai ?? []).filter((x) => x.gen === hSesudah.generasi);
  lapor('putar-saat-hangat', (hSesudah?.generasi ?? 0) > (hSebelum?.generasi ?? 0) && hangatGenBaru.length > 0 && sesudahKlik.length === 0,
    { generasiSebelum: hSebelum?.generasi, generasiSesudah: hSesudah?.generasi, hangatGenBaru: hangatGenBaru.map((x) => x.kunci), latarAdegan: latar, permintaanLatarSesudahKlik: sesudahKlik.length, cocok: await p.evaluate(() => window.__raksaHangat?.cocok) });
  await ctx.close();
}
// 7. D-55: location change kantor -> pool shows the NEW room's thumbnail at once (no stale room, no flat square)
{
  const st = JSON.parse(execFileSync('npx', ['tsx', '--tsconfig', 'client/tsconfig.json', 'tools/cerita/state-lokasi-kedua.mts'], { shell: true, encoding: 'utf8' }));
  const { ctx, p } = await buka('lokasi-kedua', { extra: { k: st.kunci, v: st.nilai }, ubah: (u) => (/pool-/.test(u) ? { delay: 1500, respond: null } : null) });
  await tungguSiap(p, 20000); await tunggu(600);
  // k03-b is the phone call with Pak Hendra (no gated stage, or the office): anything but the pool.
  const lok0 = (await p.evaluate(() => window.__snap()?.lokasi)) ?? 'tanpa panggung';
  await p.evaluate(() => { window.__g.frames = []; window.__g.saatSiap = null; });
  await tekanLanjut(p);
  await p.waitForFunction(() => window.__snap()?.lokasi === 'pool', { timeout: 10000 }).catch(() => {});
  await tunggu(150);
  await p.screenshot({ path: path.join(OUT, 'lokasi-kedua-placeholder-360.png') });
  await tungguSiap(p, 20000); await tunggu(600);
  await p.screenshot({ path: path.join(OUT, 'lokasi-kedua-siap-360.png') });
  const fr = await p.evaluate(() => window.__g.frames);
  const pertamaPool = fr.find((f) => f.lokasi === 'pool');
  lapor('lokasi-kedua (D-55)', lok0 !== 'pool' && !!pertamaPool && !!pertamaPool.kabur && pertamaPool.kabur.op === '1' && pertamaPool.imgs.every((i) => i.op === '0') && fr.some((f) => f.lokasi === 'pool' && f.siap),
    { lokasiAwal: lok0, framePertamaPool: pertamaPool, frames: fr.map((f) => ({ t: f.t, lokasi: f.lokasi, siap: f.siap, kabur: f.kabur?.op })) });
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagalTotal ? `FAILED ${gagalTotal}` : 'ALL PASS');
process.exit(gagalTotal ? 1 : 0);
