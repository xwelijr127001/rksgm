/**
 * T-015: sisipan telepon (cut-in) tidak boleh menutupi kepala tokoh. Untuk SETIAP adegan kantor AUTO-2 yang punya sisipan +
 * tokoh di panggung (states.json kunci `cutin-*`, dari tools/cerita/state-kantor-t013.mts) x 360x740 DPR2, 390x844 DPR3,
 * 1280x800 DPR1: baca kotak sisipan & kotak kepala dari panggung (data-sisipan / data-kepala, px CSS), pastikan tidak
 * berpotongan dan sisipan utuh di panggung, lalu simpan tangkapan layar di team/evidence/T-015/.
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-sisipan-t015.mjs        (exit 1 bila ada yang gagal)
 * Dipakai juga oleh tools/cek-piksel-t013.mjs (fungsi cekSisipan).
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// Prioritas proses rendah (owner 16 Nov): Chrome yang diluncurkan ikut rendah, PC tetap bisa dipakai.
try { os.setPriority(os.constants.priority.PRIORITY_LOW); } catch { /* abaikan */ }

const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
export const VP_SISIPAN = [{ n: '360', w: 360, h: 740, dpr: 2 }, { n: '390', w: 390, h: 844, dpr: 3 }, { n: '1280', w: 1280, h: 800, dpr: 1 }];
const potong = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const kotak = (s) => { const [x, y, w, h] = s.split(',').map(Number); return { x, y, w, h }; };

/** Baca panggung halaman `p` dan nilai: { lulus, data }. */
export async function cekSisipan(p) {
  const d = await p.evaluate(() => {
    const el = document.querySelector('.hp-vn .cer-latar');
    if (!el) return null;
    return { lokasi: el.getAttribute('data-lokasi'), telepon: el.getAttribute('data-telepon'), hadir: el.getAttribute('data-hadir'), sisipan: el.getAttribute('data-sisipan'), letak: el.getAttribute('data-sisipan-letak'), kepala: el.getAttribute('data-kepala'), bawah: Number(el.getAttribute('data-bawah') || 0), w: el.clientWidth, h: el.clientHeight, siap: !!el.querySelector('.cer-piksel[data-siap]') };
  });
  if (!d || !d.telepon || !d.sisipan) return { lulus: false, data: { ...d, sebab: 'panggung tanpa sisipan telepon' } };
  const s = kotak(d.sisipan), kepala = (d.kepala ?? '').split(';').filter(Boolean).map(kotak);
  const tabrak = kepala.filter((k) => potong(s, k)).length;
  const utuh = s.x >= 0 && s.y >= 0 && s.x + s.w <= d.w + 0.5 && s.y + s.h <= d.h - d.bawah + 0.5;
  return { lulus: d.siap && kepala.length > 0 && tabrak === 0 && utuh, data: { ...d, tabrak, utuh } };
}

/** State `cutin-*` = satu langkah SEBELUM adegan: tekan Lanjut (maks 4x) sampai panggung dengan sisipan telepon tampil. */
export async function majuKeSisipan(p) {
  const ada = () => p.evaluate(() => !!document.querySelector('.hp-vn .cer-latar[data-telepon] .cer-piksel[data-siap]'));
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap], .hp-potret'), { timeout: 15000 }).catch(() => null);
  for (let i = 0; i < 4 && !(await ada()); i++) {
    await new Promise((r) => setTimeout(r, 700));
    if (await ada()) break;
    const t = await p.$('.hp-vn-aksi button, .hp-komposer button');
    await t?.click();
    await new Promise((r) => setTimeout(r, 900));
  }
  await new Promise((r) => setTimeout(r, 900));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
  const ROOT = path.resolve(import.meta.dirname, '..');
  const OUT = path.join(ROOT, 'team/evidence/T-015');
  fs.mkdirSync(OUT, { recursive: true });
  const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
  const kasus = Object.entries(STATES).filter(([k]) => k.startsWith('cutin-'));
  const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const hasil = []; let gagal = 0;
  for (const [nama, st] of kasus) for (const vp of VP_SISIPAN) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: vp.w < 800, hasTouch: vp.w < 800 });
    await p.evaluateOnNewDocument((pj, v) => { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', v); }, PROFIL, st.nilai);
    await p.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded' });
    await majuKeSisipan(p);
    const r = await cekSisipan(p);
    const berkas = `${nama}-${vp.n}-id.png`;
    await p.screenshot({ path: path.join(OUT, berkas) });
    if (!r.lulus) gagal++;
    hasil.push({ nama: `${nama}-${vp.n}`, berkas, ...r });
    console.log(r.lulus ? 'PASS' : 'FAIL', `${nama}-${vp.n}`, JSON.stringify(r.data));
    await ctx.close();
  }
  // T-019: tiga akhir kini tatap muka, jadi naskah tidak lagi punya adegan bersisipan + tokoh di panggung (aturan T-015 tetap
  // dijaga uji unit adegan.test.ts dengan susunan buatan). Tanpa state = tidak ada yang diperiksa, bukan kegagalan.
  if (!kasus.length) console.log('CATATAN tidak ada state cutin-* di states.json (T-019: akhir tatap muka)');
  fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  await b.close();
  console.log(gagal ? `FAILED ${gagal}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
