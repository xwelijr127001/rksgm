/**
 * T-016: gerak diam (kedip + napas) di ruang Episode 2 di luar kantor. Untuk state pool, bengkel, tol, wawancara-1 (states.json):
 * hash kanvas tiap 100 md selama 10 d. Gerak normal: HARUS ada kedip (data-mata=tutup terlihat) DAN napas (data-napas berganti)
 * dan gambar berubah; gerak dikurangi + ?gerak=ikut: 0 perubahan. Dua tangkapan layar (bingkai berbeda) per ruang.
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-gerak-t016.mjs [folder-keluaran]
 * Dipakai juga oleh tools/cek-piksel-t013.mjs (fungsi sampelGerak).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama: Node + semua Chrome otomasi ke prioritas rendah

const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
export const RUANG_GERAK = ['pool', 'bengkel', 'tol', 'wawancara-1'];

/** Buka state di 360x740 DPR2 dan sampel kanvas `detik` detik. shot = [berkasA, berkasB] (bingkai awal + bingkai pertama yang berbeda). */
export async function sampelGerak(b, BASE, nilai, kurang, detik = 10, shot = null) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // Gerak normal = 'no-preference' secara eksplisit: bila Windows di PC ini sedang 'kurangi animasi', Chrome headless ikut melapor
  // reduce dan kasus normal gagal tanpa ada yang rusak (terjadi 16 Nov malam).
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: kurang ? 'reduce' : 'no-preference' }]);
  await p.evaluateOnNewDocument((pj, st) => { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', st); }, PROFIL, nilai);
  await p.goto(BASE + '/cerita/auto-2' + (kurang ? '?gerak=ikut' : ''), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap]'), { timeout: 15000 }).catch(() => null);
  await new Promise((r) => setTimeout(r, 500));
  const hash = () => p.evaluate(() => {
    const c = document.querySelector('.cer-piksel-kanvas');
    if (!c) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
    return { h, mata: c.getAttribute('data-mata'), napas: c.getAttribute('data-napas') };
  });
  const lihat = new Set(); let perubahan = 0, lalu = null, mataTutup = 0, napasGanti = 0, napasLalu = null, shot2 = false;
  if (shot) await p.screenshot({ path: shot[0] });
  const t0 = Date.now();
  while (Date.now() - t0 < detik * 1000) {
    const s = await hash();
    if (!s) break;
    if (lalu !== null && s.h !== lalu) { perubahan++; if (shot && !shot2 && s.mata !== 'tutup') { await p.screenshot({ path: shot[1] }); shot2 = true; } }
    lalu = s.h; lihat.add(s.h);
    if (s.mata === 'tutup') mataTutup++;
    if (napasLalu !== null && s.napas !== napasLalu) napasGanti++;
    napasLalu = s.napas;
    await new Promise((r) => setTimeout(r, 100));
  }
  const info = await p.evaluate(() => { const el = document.querySelector('.hp-vn .cer-latar'); return { lokasi: el?.getAttribute('data-lokasi'), hadir: el?.getAttribute('data-hadir'), pose: el?.querySelector('canvas')?.getAttribute('data-pose') }; });
  await ctx.close();
  return { ...info, bingkaiBeda: lihat.size, perubahan, mataTutup, napasGanti };
}
export const lulusGerak = (r, kurang) => (kurang ? r.perubahan === 0 : r.mataTutup >= 1 && r.napasGanti >= 2 && r.bingkaiBeda >= 3);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
  const ROOT = path.resolve(import.meta.dirname, '..');
  const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'team/evidence/T-016'));
  fs.mkdirSync(OUT, { recursive: true });
  const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
  const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const hasil = []; let gagal = 0;
  for (const ruang of RUANG_GERAK) for (const kurang of [false, true]) {
    const r = await sampelGerak(b, BASE, STATES[ruang].nilai, kurang, 10, kurang ? null : [path.join(OUT, `gerak-${ruang}-a.png`), path.join(OUT, `gerak-${ruang}-b.png`)]);
    const lulus = lulusGerak(r, kurang);
    if (!lulus) gagal++;
    hasil.push({ ruang, kurang, lulus, ...r });
    console.log(lulus ? 'PASS' : 'FAIL', ruang, kurang ? 'dikurangi' : 'normal', JSON.stringify(r));
  }
  fs.writeFileSync(path.join(OUT, 'gerak.json'), JSON.stringify(hasil, null, 1));
  await b.close();
  console.log(gagal ? `FAILED ${gagal}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
