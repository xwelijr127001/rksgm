/**
 * T-017 fix (D-126): di ruang lapangan (pool, bengkel, tol, wawancara) tokoh berdiri harus UTUH di bingkai: telapak tidak
 * terpotong tepi bawah pandangan dan kepala tidak menyentuh tepi atas. Untuk tiap state x 360x740 DPR2, 390x844 DPR3,
 * 1280x800 DPR1: baca kamera (data-kamera = x, y, lebar x tinggi dunia), kaki (data-kaki) dan kotak kepala (dari pose), lalu
 * hitung potongan dalam piksel seni. Menunggu jalan masuk selesai. Tangkapan layar 1280 -> folder keluaran.
 *   UI_BASE=http://127.0.0.1:4011 node tools/cek-kaki-t017.mjs [folder-keluaran] [--ukur]   (--ukur = hanya melaporkan)
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// Prioritas proses rendah (owner 16 Nov): Chrome yang diluncurkan ikut rendah, PC tetap bisa dipakai.
try { os.setPriority(os.constants.priority.PRIORITY_LOW); } catch { /* abaikan */ }

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4011';
const ROOT = path.resolve(import.meta.dirname, '..');
const arg = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const OUT = path.resolve(arg[0] || path.join(ROOT, 'team/evidence/T-017/fullstack-fix'));
const UKUR = process.argv.includes('--ukur');
fs.mkdirSync(OUT, { recursive: true });
const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const SAMPING = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/samping.json'), 'utf8')).tokoh;
const RUANG = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/ruang-ep2.json'), 'utf8')).lokasi;
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const VP = [{ w: 360, h: 740, dpr: 2 }, { w: 390, h: 844, dpr: 3 }, { w: 1280, h: 800, dpr: 1 }];
const KASUS = ['pool', 'bengkel', 'tol', 'wawancara-1', 'wawancara-2', 'wawancara-3'];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = []; let gagal = 0;
for (const kasus of KASUS) for (const vp of VP) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: vp.w < 800, hasTouch: vp.w < 800 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]); // tidak bergantung pada setelan animasi Windows
  await p.evaluateOnNewDocument((pj, st) => { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', st); }, PROFIL, STATES[kasus].nilai);
  await p.goto(BASE + '/cerita/auto-2', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap]'), { timeout: 15000 }).catch(() => null);
  await tunggu(2600); // jalan masuk (maks 6 x 270 md) selesai
  const d = await p.evaluate(() => {
    const el = document.querySelector('.hp-vn .cer-latar'); const c = el?.querySelector('canvas');
    return el ? { kamera: el.getAttribute('data-kamera'), ruang: el.getAttribute('data-ruang'), kaki: c?.getAttribute('data-kaki'), jalan: c?.getAttribute('data-jalan'), bawah: Number(el.getAttribute('data-bawah') || 0), w: el.clientWidth, h: el.clientHeight } : null;
  });
  if (!d?.kamera) { hasil.push({ kasus, vp: vp.w, lulus: false, sebab: 'tanpa panggung' }); gagal++; await ctx.close(); continue; }
  const [kx, ky, ukuran] = d.kamera.split(','); const [vw, vh] = ukuran.split('x').map(Number);
  const atasPandang = Number(ky), bawahPandang = Number(ky) + vh;
  // Telapak = y slot ruang; puncak kepala = y slot - tinggi frame berdiri (jangkar.y + 1) x 4.
  const slotY = RUANG[d.ruang].slot['1'][0].y;
  const tokoh = (d.kaki ?? '').split(' ').filter(Boolean).map((x) => x.split(':')[0]);
  const puncak = Math.min(...tokoh.map((id) => slotY - (SAMPING[id].frame['berdiri-kanan'].jangkar.y + 1) * 4 + 4));
  const potongKaki = Math.max(0, (slotY + 4 - bawahPandang) / 4);
  const udaraKepala = (puncak - atasPandang) / 4;
  // Bidikan DEKAT HP (tokoh berbicara, setengah badan: kaki terpotong puluhan piksel seni) memang disengaja dan tidak diubah;
  // yang diperiksa: potongan kecil (sepatu) tidak boleh ada lagi, dan kepala tidak menyentuh tepi atas.
  const dekat = potongKaki > 20;
  const lulus = !d.jalan && (dekat || potongKaki <= 0.01) && udaraKepala >= 1;
  if (!lulus && !UKUR) gagal++;
  const baris = { kasus, vp: vp.w, lulus, kamera: d.kamera, panggung: `${d.w}x${d.h}`, potongKakiSeni: +potongKaki.toFixed(2), udaraKepalaSeni: +udaraKepala.toFixed(2), bidikan: dekat ? "dekat" : "penuh", tokoh: tokoh.join('+') };
  hasil.push(baris);
  console.log(lulus ? 'PASS' : UKUR ? 'UKUR' : 'FAIL', JSON.stringify(baris));
  if (vp.w === 1280 && ['pool', 'bengkel', 'tol'].includes(kasus)) await p.screenshot({ path: path.join(OUT, `${kasus}-1280-kamera.png`) });
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, UKUR ? 'kaki-sebelum.json' : 'kaki.json'), JSON.stringify(hasil, null, 1));
await b.close();
console.log(UKUR ? 'UKUR selesai' : gagal ? `FAILED ${gagal}` : `ALL PASS (${hasil.length})`);
process.exit(!UKUR && gagal ? 1 : 0);
