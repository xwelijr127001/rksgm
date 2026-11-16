/**
 * T-017 (D-104): jalan masuk Mas Rudi di K04 pool (server produksi, UI_BASE; bawaan :4001).
 *  1. gerak normal, 360x740 DPR2: sampel kanvas tiap ± 50 md selama 3 d: gambar BERUBAH dalam 2 d pertama, kedua bingkai jalan
 *     terlihat (data-jalan), x kaki naik terus pada piksel seni bulat, berakhir BERDIRI di x 420 (data-kaki), tanpa data-jalan;
 *  2. gerak dikurangi + ?gerak=ikut: tidak pernah berjalan, langsung berdiri di x 420, gambar tidak berubah;
 *  3. "Lanjut" di tengah jalan: langsung berdiri (atau panggung berganti), tidak ada data-jalan sesudahnya;
 *  4. tangkapan layar 360, 390, 1280 pada 0,3 d / 0,9 d / akhir -> team/evidence/T-017/fullstack-fix/ (atau argumen ke-1).
 * Fix D-125: jumlah pose harus 4 / 3 / 4 di 360 / 390 / 1280 dan pose terakhir lintas.
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-jalan-t017.mjs     (exit 1 bila ada yang gagal)
 * Berdiri sendiri (tidak dipanggil cek-piksel-t013.mjs); sampelJalan / lulusJalan diekspor bila ingin digabung.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// Prioritas proses rendah (owner 16 Nov): Chrome yang diluncurkan ikut rendah, PC tetap bisa dipakai.
try { os.setPriority(os.constants.priority.PRIORITY_LOW); } catch { /* abaikan */ }

const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

export async function bukaPool(b, BASE, nilai, vp, { kurang = false, lang = 'id' } = {}) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: vp.w < 800, hasTouch: vp.w < 800 });
  // Gerak normal dipaksa 'no-preference': bila Windows di PC ini 'Show animations' mati, Chrome melapor reduce dan game (dengan
  // benar) tidak menganimasikan apa pun, sehingga sampel jalan gagal tanpa ada yang rusak. Dipakai juga oleh cek-akhir-t019 (bukaPool).
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: kurang ? 'reduce' : 'no-preference' }]);
  await p.evaluateOnNewDocument((pj, st, lang) => { localStorage.setItem('raksa:bahasa', lang); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', st); }, PROFIL, nilai, lang);
  await p.goto(BASE + '/cerita/auto-2' + (kurang ? '?gerak=ikut' : ''), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap]'), { timeout: 15000 }).catch(() => null);
  return { ctx, p };
}
const baca = (p) => p.evaluate(() => {
  const c = document.querySelector('.hp-vn .cer-piksel-kanvas');
  if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
  return { h, jalan: c.getAttribute('data-jalan'), kaki: c.getAttribute('data-kaki'), lokasi: c.closest('.cer-latar')?.getAttribute('data-lokasi') };
});

/** Sampel jalan masuk di halaman yang baru dibuka (state pool). */
export async function sampelJalan(p, detik = 3) {
  const t0 = Date.now();
  const s = [];
  while (Date.now() - t0 < detik * 1000) { const x = await baca(p); if (x) s.push({ t: Date.now() - t0, ...x }); await tunggu(45); }
  const jalan = s.filter((x) => x.jalan);
  const xs = jalan.map((x) => Number(x.jalan.split(':')[2]));
  // Jumlah pose = jumlah pergantian bingkai + 1 (kontak/lintas bergantian tiap pose).
  const urutPose = jalan.map((x) => x.jalan.split(':')[1]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
  const awal2 = s.filter((x) => x.t <= 2000);
  const akhir = s.at(-1);
  return {
    sampel: s.length, sampelJalan: jalan.length, jumlahPose: urutPose.length, poseAwal: urutPose[0] ?? null, poseAkhir: urutPose.at(-1) ?? null, pose: [...new Set(jalan.map((x) => x.jalan.split(':')[1]))].sort(),
    xAwal: xs[0] ?? null, xAkhirJalan: xs.at(-1) ?? null, naik: xs.every((x, i) => i === 0 || x >= xs[i - 1]), bulat: xs.every((x) => (x - 420) % 4 === 0),
    gambarBeda2d: new Set(awal2.map((x) => x.h)).size, lamaJalanMd: jalan.length ? jalan.at(-1).t - jalan[0].t : 0,
    akhir: { jalan: akhir?.jalan ?? null, kaki: akhir?.kaki ?? null, lokasi: akhir?.lokasi ?? null },
  };
}
/** D-125: jumlah pose yang diharapkan per lebar layar (41 piksel seni per pose): 360 -> 4, 390 -> 3, 1280 -> 4; selalu berakhir lintas. */
export const POSE_HARAPAN = { 360: 4, 390: 3, 1280: 4 };
export const lulusJalan = (r, lebar) => (lebar === undefined || r.jumlahPose === POSE_HARAPAN[lebar]) && r.poseAkhir === 'jalan-b' && r.lamaJalanMd <= 6 * 270 + 150 && r.sampelJalan >= 3 && r.pose.join() === 'jalan-a,jalan-b' && r.naik && r.bulat && r.xAwal < 420 && r.gambarBeda2d >= 3 && r.akhir.jalan === null && r.akhir.kaki === 'rudi:420' && r.akhir.lokasi === 'pool';

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
  const ROOT = path.resolve(import.meta.dirname, '..');
  const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'team/evidence/T-017/fullstack-fix'));
  fs.mkdirSync(OUT, { recursive: true });
  const POOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8')).pool.nilai;
  const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const hasil = []; let gagal = 0;
  const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
  const HP = { w: 360, h: 740, dpr: 2 };
  // 1. normal
  for (const vp of [HP, { w: 390, h: 844, dpr: 3 }, { w: 1280, h: 800, dpr: 1 }]) {
    const { ctx, p } = await bukaPool(b, BASE, POOL, vp);
    const r = await sampelJalan(p);
    lapor(`jalan-normal-${vp.w}`, lulusJalan(r, vp.w), { harapPose: POSE_HARAPAN[vp.w], ...r });
    await ctx.close();
  }
  // 2. gerak dikurangi
  {
    const { ctx, p } = await bukaPool(b, BASE, POOL, HP, { kurang: true });
    const r = await sampelJalan(p, 2.5);
    lapor('jalan-dikurangi-360', r.sampelJalan === 0 && r.gambarBeda2d === 1 && r.akhir.kaki === 'rudi:420', r);
    await ctx.close();
  }
  // 3. Lanjut di tengah jalan
  {
    const { ctx, p } = await bukaPool(b, BASE, POOL, HP);
    await p.waitForFunction(() => document.querySelector('.hp-vn .cer-piksel-kanvas[data-jalan]'), { timeout: 5000 }).catch(() => null);
    await tunggu(350);
    const sebelum = await baca(p);
    await p.evaluate(() => { const c = [...document.querySelectorAll('.hp-vn-aksi button, .hp-komposer button')].filter((x) => !x.disabled && x.getBoundingClientRect().width > 0); c.at(-1)?.click(); });
    await tunggu(250);
    const sesudah = await baca(p);
    await tunggu(600);
    const nanti = await baca(p);
    lapor('lanjut-tengah-jalan-360', !!sebelum?.jalan && !sesudah?.jalan && !nanti?.jalan && (!sesudah || sesudah.lokasi !== 'pool' || sesudah.kaki === 'rudi:420'), { sebelum: sebelum?.jalan, sesudah: sesudah ? { jalan: sesudah.jalan, kaki: sesudah.kaki, lokasi: sesudah.lokasi } : 'panggung berganti', nanti: nanti?.jalan ?? null });
    await ctx.close();
  }
  // 4. tangkapan layar
  // Fix D-125: jalan kini 0,81-1,08 d, jadi 0,9 d = pose terakhir (360, 1280) atau sudah berdiri (390).
  for (const [vp, titik] of [[HP, [300, 900]], [{ w: 390, h: 844, dpr: 3 }, [300, 900]], [{ w: 1280, h: 800, dpr: 1 }, [300, 900]]]) {
    const { ctx, p } = await bukaPool(b, BASE, POOL, vp);
    await p.waitForFunction(() => document.querySelector('.hp-vn .cer-piksel-kanvas[data-jalan]'), { timeout: 5000 }).catch(() => null);
    const t0 = Date.now();
    const catat = {};
    for (const ms of titik) {
      await tunggu(Math.max(0, ms - (Date.now() - t0)));
      const x = await baca(p);
      await p.screenshot({ path: path.join(OUT, `pool-${vp.w}-${String(ms / 1000).replace('.', '_')}d.png`) });
      catat[ms] = x?.jalan ?? null;
    }
    await tunggu(Math.max(0, 2600 - (Date.now() - t0)));
    const x = await baca(p);
    await p.screenshot({ path: path.join(OUT, `pool-${vp.w}-akhir.png`) });
    lapor(`tangkapan-${vp.w}`, !!catat[300] && !x?.jalan && x?.kaki === 'rudi:420', { ...catat, akhir: x?.kaki });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  await b.close();
  console.log(gagal ? `FAILED ${gagal}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
