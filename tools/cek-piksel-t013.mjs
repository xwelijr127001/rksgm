/**
 * T-013 Stage 1 evidence + checks on the PRODUCTION server (npm run build && RAKSA_LEGACY=on npm start, :4000).
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/state-kantor-t013.mts > team/evidence/T-013/states.json
 *   node tools/cek-piksel-t013.mjs [--cepat]    -> team/evidence/T-013/ (screenshots, hasil.json); exit 1 on a failed check
 *
 * Per case (saved progress from states.json) x viewport (360x740 DPR 2, 390x844 DPR 3, 1280x800 DPR 1) x language
 * (id/en/zh): open /cerita/auto-2, wait for the pixel stage (.cer-piksel[data-siap]) or the illustrated stage, screenshot, and
 * record every image request. Checks: kantor cases = pixel stage, ZERO illustration (.webp under ilustrasi) requests, the
 * requested poses from the canvas data-pose; bima + pool = illustrated stage (explicit fallback / Stage 2).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama: Node + semua Chrome otomasi ke prioritas rendah
import { cekSisipan, majuKeSisipan } from './cek-sisipan-t015.mjs';
import { sampelGerak, lulusGerak } from './cek-gerak-t016.mjs';

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4000';
const OUT = path.resolve(import.meta.dirname, '..', 'team/evidence/T-013');
const OUT2 = path.join(OUT, 'final');
fs.mkdirSync(OUT2, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const STATES = JSON.parse(fs.readFileSync(path.join(OUT, 'states.json'), 'utf8'));
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const cepat = process.argv.includes('--cepat');
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = [];
let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };

const VP = cepat ? [{ n: '360', w: 360, h: 740, dpr: 2 }] : [{ n: '360', w: 360, h: 740, dpr: 2 }, { n: '390', w: 390, h: 844, dpr: 3 }, { n: '1280', w: 1280, h: 800, dpr: 1 }];
const BAHASA = cepat ? ['id'] : ['id', 'en', 'zh'];

export async function buka({ w, h, dpr }, lang, state, url = '/cerita/auto-2') {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 800, hasTouch: w < 800 });
  await p.evaluateOnNewDocument((pj, lang, st) => {
    localStorage.setItem('raksa:bahasa', lang); localStorage.setItem('raksa:profil', pj);
    sessionStorage.setItem('raksa:loader:v1', '1');
    if (st) localStorage.setItem('raksa:cerita', st);
  }, PROFIL, lang, state);
  const req = [];
  p.on('request', (r) => { const u = r.url(); if (/\.(png|webp|jpg|svg)(\?|$)/.test(u)) req.push(u.replace(BASE, '')); });
  await p.goto(BASE + url + (lang === 'id' ? '' : `?lang=${lang}`), { waitUntil: 'domcontentloaded' });
  return { ctx, p, req };
}
const stage = (p) => p.evaluate(() => {
  const el = document.querySelector('.hp-vn .cer-latar');
  const potretHp = [...document.querySelectorAll('.hp-potret')].map((x) => ({ seni: x.getAttribute('data-seni') ?? 'ilustrasi', tokoh: x.querySelector('[data-tokoh]')?.getAttribute('data-tokoh') ?? null, ekspresi: x.querySelector('[data-ekspresi]')?.getAttribute('data-ekspresi') ?? null }));
  if (!el) return { obrolan: !!document.querySelector('.hp-obrolan, [class*=obrolan]'), potretHp };
  return { gaya: el.getAttribute('data-gaya'), lokasi: el.getAttribute('data-lokasi'), hadir: el.getAttribute('data-hadir'), telepon: el.getAttribute('data-telepon'), objek: el.getAttribute('data-objek'), k: el.getAttribute('data-k'), pose: el.querySelector('canvas')?.getAttribute('data-pose') ?? null, siap: !!el.querySelector('.cer-piksel[data-siap], .cer-ilustrasi[data-siap]'), potret: [...document.querySelectorAll('.hp-vn-dialog .hp-potret')].map((x) => x.getAttribute('data-seni') ?? 'ilustrasi') };
});

// Stage 2: SEMUA adegan AUTO-2 di panggung piksel; 0 permintaan .webp (ilustrasi) dan 0 PNG ruang/atlas Bu Rina Episode 1
// (D-91: sumberPiksel malas). Bahasa: id untuk semua; en + zh untuk satu adegan per lokasi utama (mentor, pool, wawancara-3).
const TIGA_BAHASA = new Set(['mentor', 'pool', 'wawancara-3']);
for (const [kasus, st] of Object.entries(STATES)) {
  for (const vp of VP) for (const lang of BAHASA) {
    if (lang !== 'id' && !TIGA_BAHASA.has(kasus)) continue;
    if (cepat && kasus.startsWith('tel-') && kasus !== 'tel-cemas') continue;
    const { ctx, p, req } = await buka(vp, lang, st.nilai);
    // T-015: adegan kantor bersisipan telepon: sisipan tidak boleh menutupi kepala tokoh.
    if (kasus.startsWith('cutin-')) {
      await majuKeSisipan(p);
      const r = await cekSisipan(p);
      await p.screenshot({ path: path.join(OUT2, `${kasus}-${vp.n}-${lang}.png`) });
      lapor(`sisipan-${kasus}-${vp.n}-${lang}`, r.lulus && req.every((u) => !/.webp/.test(u)), r.data);
      await ctx.close();
      continue;
    }
    await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap], .cer-ilustrasi[data-siap], .hp-potret'), { timeout: 15000 }).catch(() => null);
    await tunggu(600);
    const s = await stage(p);
    const ilu = req.filter((u) => /\.webp/.test(u));
    const ep1 = req.filter((u) => /\/assets\/(ruang-[^/]*|bu-rina-[^/]*)\.png/.test(u));
    const nama = `${kasus}-${vp.n}-${lang}`;
    await p.screenshot({ path: path.join(OUT2, `${nama}.png`) });
    const obrolan = kasus.startsWith('tel-');
    const hendraPiksel = (s?.potretHp ?? []).some((x) => x.seni === 'piksel' && x.tokoh === 'hendra');
    // Kasus objek yang jatuh di layar obrolan (state naskah, mis. surat K13 = pesan ke Pak Hendra): cukup avatar piksel.
    // State akt-* (T-014 fix): layar sesudah aktivitas. Akibat K08 tampil TANPA panggung (diagram jalan + potret piksel Pak Bima).
    const tanpaPanggung = kasus.startsWith('akt-') && s?.gaya === undefined && (s?.potretHp ?? []).some((x) => x.seni === 'piksel');
    const lulus = !!s && ilu.length === 0 && ep1.length === 0 && (tanpaPanggung || (obrolan || s.obrolan ? hendraPiksel : s.siap && s.gaya === 'piksel'));
    lapor(nama, lulus, { stage: s, webp: ilu.length, webpContoh: ilu.slice(0, 3), ep1: ep1.length, png: req.filter((u) => u.endsWith('.png')).map((u) => u.split('/').pop()) });
    await ctx.close();
  }
}
// Kartu episode di /cerita (sampul pool + Hendra) juga piksel.
// D-101: juga tata letak LEBAR kartu (768, 1024): kolom gambar hampir persegi, minimal 125 piksel seni lebar terlihat.
for (const vp of [...VP, ...(cepat ? [] : [{ n: '768', w: 768, h: 900, dpr: 1 }, { n: '1024', w: 1024, h: 800, dpr: 1 }])]) {
  const { ctx, p, req } = await buka(vp, 'id', null, '/cerita');
  await p.waitForFunction(() => document.querySelector('.cer-latar .cer-piksel[data-siap]'), { timeout: 15000 }).catch(() => null);
  await tunggu(600);
  const kartu = await p.evaluate(() => [...document.querySelectorAll('.cer-latar')].map((el) => ({ gaya: el.getAttribute('data-gaya'), lokasi: el.getAttribute('data-lokasi'), hadir: el.getAttribute('data-hadir'), pose: el.querySelector('canvas')?.getAttribute('data-pose') ?? null, k: Number(el.getAttribute('data-k')), w: el.clientWidth, h: el.clientHeight, seniLebar: Math.round(el.clientWidth * (window.devicePixelRatio || 1) / Number(el.getAttribute('data-k'))) })));
  await p.screenshot({ path: path.join(OUT2, `kartu-cerita-${vp.n}.png`), fullPage: true });
  const ilu = req.filter((u) => /\.webp/.test(u) && /auto-2|pool|hendra|trailer/.test(u));
  lapor(`kartu-cerita-${vp.n}`, kartu.some((k) => k.gaya === 'piksel' && k.lokasi === 'pool' && k.seniLebar >= 125) && ilu.length === 0, { kartu, webp: ilu });
  await ctx.close();
}
// Deret bingkai transisi antar-ruang piksel: kantor -> pool (state-lokasi-kedua.json, satu Lanjut), 100 ms x 20.
{
  const st = JSON.parse(fs.readFileSync(path.join(OUT, 'state-lokasi-kedua.json'), 'utf8'));
  const { ctx, p, req } = await buka(VP[0], 'id', st.nilai);
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap]'), { timeout: 15000 }).catch(() => null);
  await tunggu(500);
  const dir = path.join(OUT2, 'transisi-kantor-pool');
  fs.mkdirSync(dir, { recursive: true });
  await p.screenshot({ path: path.join(dir, '00.png') });
  const awal = await stage(p);
  const t = await p.$('.hp-vn-aksi button, .hp-komposer button');
  await t?.click();
  const bingkai = [];
  for (let i = 1; i <= 20; i++) {
    await tunggu(100);
    await p.screenshot({ path: path.join(dir, String(i).padStart(2, '0') + '.png') });
    const s = await stage(p);
    bingkai.push(`${s?.lokasi ?? '-'}:${s?.gaya ?? '-'}:${s?.siap ? 'siap' : 'muat'}`);
  }
  const ilu = req.filter((u) => /\.webp/.test(u));
  lapor('transisi-kantor-pool-360', (awal?.lokasi === 'kantor' || awal?.obrolan !== undefined) && bingkai.at(-1)?.startsWith('pool:piksel:siap') && bingkai.every((x) => !x.includes('ilustrasi')) && ilu.length === 0, { awal, bingkai, webp: ilu.length });
  await ctx.close();
}
// B-01 (QA Stage 2): layar NON-panggung juga tanpa ilustrasi. (a) gerbang panggilan / cut-in potret di obrolan, (b) pembuka
// aktivitas (arena baki K02, latar kantor), (c) avatar. Dari tiap state obrolan: catat cut-in, tekan "Mulai" tugas bila ada,
// dan jumlahkan SEMUA gambar unik yang diminta (ukuran dari respons) = transfer gambar Episode 2 yang terukur.
{
  const unik = new Map();
  let cutIn = 0, arena = 0, webp = 0;
  for (const [kasus, st] of Object.entries(STATES)) {
    const ctx = await b.createBrowserContext();
    const pg = await ctx.newPage();
    await pg.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.evaluateOnNewDocument((pj, v) => { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', v); }, PROFIL, st.nilai);
    pg.on('requestfinished', async (r) => {
      const u = r.url();
      if (!/\.(png|webp|jpg|jpeg|gif|svg)(\?|$)/.test(u)) return;
      if (/\.webp/.test(u) && !/\/karakter\//.test(u)) webp++;
      let n = 0; try { n = (await r.response().buffer()).length; } catch { /* */ }
      unik.set(u.replace(BASE, ''), n);
    });
    await pg.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => document.querySelector('.cer-piksel[data-siap], .hp-potret'), { timeout: 15000 }).catch(() => null);
    await tunggu(500);
    if (await pg.$('.hp-cutin')) { cutIn++; await pg.screenshot({ path: path.join(OUT2, `cutin-${kasus}-360.png`) }); }
    const mulai = await pg.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /^Mulai/.test(x.textContent.trim())) ?? null);
    if (mulai.asElement()) {
      await mulai.asElement().click();
      await tunggu(900);
      if (await pg.$('.hp-susun, .hp-arena, [class*="arena"]')) { arena++; await pg.screenshot({ path: path.join(OUT2, `arena-${kasus}-360.png`) }); }
    }
    await ctx.close();
  }
  const daftar = [...unik].sort();
  const total = daftar.reduce((n, [, v]) => n + v, 0);
  fs.writeFileSync(path.join(OUT2, 'transfer-gambar.json'), JSON.stringify({ total, daftar }, null, 1));
  lapor('b01-non-panggung', webp === 0 && arena > 0, { webpEpisode: webp, cutInTerlihat: cutIn, arenaDibuka: arena, gambarUnik: daftar.length, totalByte: total, terbesar: daftar.sort((x, y) => y[1] - x[1]).slice(0, 4) });
}
// D-96: hidup di luar kantor. Pool (Rudi, tanpa Miss Raksa): hash kanvas tiap 100 md selama 9 d harus BERUBAH (kedip) pada
// gerak normal dan TIDAK berubah saat sistem meminta gerak dikurangi (?gerak=ikut).
// T-016: sampel hash kanvas 10 d untuk pool DAN bengkel (tools/cek-gerak-t016.mjs): normal = kedip + napas terlihat; dikurangi = 0.
for (const ruang of ['pool', 'bengkel']) for (const [nama, kurang] of [['normal', false], ['dikurangi', true]]) {
  const r = await sampelGerak(b, BASE, STATES[ruang].nilai, kurang, 10);
  lapor(`gerak-${ruang}-${nama}`, lulusGerak(r, kurang), r);
}
fs.writeFileSync(path.join(OUT, cepat ? 'hasil-cepat.json' : 'hasil-final.json'), JSON.stringify(hasil, null, 1));
await b.close();
console.log(gagal ? `FAILED ${gagal}` : 'ALL PASS');
process.exit(gagal ? 1 : 0);
