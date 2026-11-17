/**
 * T-019 (D-105): tiga akhir Episode 2 TATAP MUKA di kantor: Miss Raksa di balik meja, Pak Hendra berjalan masuk dari tepi KANAN
 * (bingkai jalan dicerminkan) ke slot tamu x 980 lalu berdiri; tanpa sisipan telepon. State `akhir-puas|catatan|kurang` dari
 * team/evidence/T-013/states.json (tools/cerita/state-kantor-t013.mts). Per akhir x 360x740 DPR2, 390x844 DPR3, 1280x800 DPR1:
 *  1. jalan  : kedua bingkai terlihat, jumlah pose = POSE_HARAPAN_HENDRA, bingkai terakhir lintas, x kaki TURUN terus pada piksel
 *              seni bulat dari luar tepi kanan, berakhir berdiri di hendra:980 hadap kiri dengan ekspresi akhirnya;
 *              panggung: hadir missRaksa + hendra, tanpa telepon, tanpa sisipan;
 *  2. bingkai: sesudah tiba: kepala Hendra & Miss Raksa tidak terpotong tepi atas, papan nama utuh di pandangan dan tidak
 *              tertutup kepala; potongan kaki dicatat (kantor = bidikan meja, kamera tidak diubah);
 *  3. gerak dikurangi + ?gerak=ikut (puas, 360): tidak pernah berjalan; 4. Lanjut di tengah jalan (puas, 360): langsung berdiri;
 *  5. tangkapan layar: tiap akhir 390 pada 0,3 d / 0,9 d / akhir, 360 + 1280 akhir -> team/evidence/T-019/.
 *  6. (T-024) KARTU AKHIR SATU LAYAR sesudah adegan itu: tools/cek-kartu-t024.mjs (3 akhir x id / en / zh x 390x645 + 360x640, Chromium
 *     lalu WebKit: halaman & kartu tidak menggulir, bilah aksi terlihat, blok setinggi mock, lembar rincian buka / tutup dengan
 *     fokus kembali, teks zh melipat di lembar, baris Menu, aturan pas, desktop tidak berubah) -> team/evidence/T-024/fullstack/.
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-akhir-t019.mjs [--hanya-kartu | --tanpa-kartu] [--tanpa-webkit]     (exit 1 bila ada yang gagal)
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
import { bukaPool } from './cek-jalan-t017.mjs';
import { OUT_KARTU, jalankanKartu } from './cek-kartu-t024.mjs';
import { luncur } from './t018-umum.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.resolve(process.argv.slice(2).find((x) => !x.startsWith('--')) || path.join(ROOT, 'team/evidence/T-019/fix'));
fs.mkdirSync(OUT, { recursive: true });
const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const HENDRA = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/hendra.json'), 'utf8'));
const MISS = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/miss-raksa.json'), 'utf8'));
const RUANG = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/ruang-ep2.json'), 'utf8')).lokasi['kantor-ep2'];
/** Jumlah pose jalan Hendra per lebar layar (sama dengan POSE_HENDRA di adegan.test.ts). */
export const POSE_HARAPAN_HENDRA = { 360: 6, 390: 5, 1280: 7 }; // fix D-135/D-136: x 1040, 32 piksel seni per pose
/** Wajah seni sesudah tiba (ekspresi baris akhir.<x>.1 lewat manifest.ekspresiDari: senang, netral -> tenang, kesal -> kecewa). */
const WAJAH = { puas: 'senang', catatan: 'tenang', kurang: 'kecewa' };
const TUJUAN = RUANG.slot['1'][0].xTokoh?.hendra ?? RUANG.slot['1'][0].x; // D-135: 1040
const VP = [{ w: 360, h: 740, dpr: 2 }, { w: 390, h: 844, dpr: 3 }, { w: 1280, h: 800, dpr: 1 }];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const UKUR = process.argv.includes('--ukur');
// T-024: --hanya-kartu = hanya bagian 6 (kartu satu layar); --tanpa-kartu = hanya bagian 1-5 (T-019); --tanpa-webkit = kartu di Chromium saja.
const HANYA_KARTU = process.argv.includes('--hanya-kartu');
const TANPA_KARTU = process.argv.includes('--tanpa-kartu');

const baca = (p) => p.evaluate(() => {
  const el = document.querySelector('.hp-vn .cer-latar'); const c = el?.querySelector('.cer-piksel-kanvas');
  if (!el || !c) return null;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
  const tok = (s) => Object.fromEntries((s ?? '').split(' ').filter(Boolean).map((x) => { const [id, ...r] = x.split(':'); return [id, r]; }));
  return { h, jalan: tok(c.getAttribute('data-jalan')).hendra ?? null, kaki: tok(c.getAttribute('data-kaki')), pose: tok(c.getAttribute('data-pose')), lokasi: el.getAttribute('data-lokasi'), hadir: el.getAttribute('data-hadir'), telepon: el.getAttribute('data-telepon'), sisipan: el.getAttribute('data-sisipan'), kamera: el.getAttribute('data-kamera'), panggung: [el.clientWidth, el.clientHeight] };
});
async function sampel(p, detik = 3.4) {
  const t0 = Date.now(); const s = [];
  while (Date.now() - t0 < detik * 1000) { const x = await baca(p); if (x) s.push({ t: Date.now() - t0, ...x }); await tunggu(45); }
  const jalan = s.filter((x) => x.jalan);
  const xs = jalan.map((x) => Number(x.jalan[1]));
  const urut = jalan.map((x) => x.jalan[0]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
  const z = s.at(-1);
  return {
    sampel: s.length, sampelJalan: jalan.length, jumlahPose: urut.length, poseAwal: urut[0] ?? null, poseAkhir: urut.at(-1) ?? null, keduaBingkai: new Set(urut).size === 2,
    xAwal: xs[0] ?? null, xAkhirJalan: xs.at(-1) ?? null, turun: xs.every((x, i) => i === 0 || x <= xs[i - 1]), bulat: xs.every((x) => (x - TUJUAN) % 4 === 0),
    gambarBeda2d: new Set(s.filter((x) => x.t <= 2000).map((x) => x.h)).size, lamaJalanMd: jalan.length ? jalan.at(-1).t - jalan[0].t : 0,
    akhir: z ? { jalan: z.jalan, kakiHendra: Number(z.kaki.hendra?.[0]), poseHendra: z.pose.hendra?.join(':') ?? null, poseMiss: z.pose.missRaksa?.join(':') ?? null, lokasi: z.lokasi, hadir: z.hadir, telepon: z.telepon, sisipan: z.sisipan, kamera: z.kamera, panggung: z.panggung } : null,
  };
}
/** Bingkai sesudah tiba, dari kamera (dunia) + manifest: udara kepala, potongan kaki, papan. */
function bingkai(a) {
  const [kx, ky, uk] = a.kamera.split(','); const [vw, vh] = uk.split('x').map(Number);
  const X0 = Number(kx), Y0 = Number(ky), X1 = X0 + vw, Y1 = Y0 + vh;
  const fh = HENDRA.frame['berdiri-kanan'], fm = MISS.frame[MISS.pose.berdiri.kanan];
  const slot = RUANG.slot['1'][0], meja = RUANG.tempat.balikMeja;
  // Hendra dicerminkan terhadap kaki: pusat kepala = kaki + (jangkar.x - kepala.x) x 4.
  const kepalaH = { cx: TUJUAN + (fh.jangkar.x - fh.kepala.x) * 4, atas: slot.y - fh.jangkar.y * 4, l: 37 * 4 };
  const kepalaM = { cx: meja.x + (fm.kepala.x - fm.jangkar.x) * 4, atas: meja.y - fm.jangkar.y * 4, l: 40 * 4 };
  const pk = RUANG.papan.kotak;
  const kotakKepala = (k, t) => ({ x: k.cx - k.l / 2, y: k.atas, w: k.l, h: t * 4 });
  const potong = (p, q) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
  return {
    udaraKepalaHendra: +((kepalaH.atas - Y0) / 4).toFixed(2), udaraKepalaMiss: +((kepalaM.atas - Y0) / 4).toFixed(2),
    potongKakiHendra: +Math.max(0, (slot.y + 4 - Y1) / 4).toFixed(2),
    hendraDalamLebar: kepalaH.cx - kepalaH.l / 2 >= X0 && kepalaH.cx + kepalaH.l / 2 <= X1,
    papanUtuh: pk.x >= X0 && pk.y >= Y0 && pk.x + pk.w <= X1 && pk.y + pk.h <= Y1,
    papanTertutupKepala: potong(pk, kotakKepala(kepalaH, fh.kepalaTinggi)) || potong(pk, kotakKepala(kepalaM, fm.kepalaTinggi ?? 40)),
  };
}

const lanjut = (p) => p.evaluate(() => { const c = [...document.querySelectorAll('.hp-vn-aksi button, .hp-komposer button')].filter((x) => !x.disabled && x.getBoundingClientRect().width > 0); c.at(-1)?.click(); });
/** D-137: piksel gelap (sepatu hitam Miss Raksa) di kanvas pada kotak dunia x 740..860, y 684..764 (lantai depan meja, di bawahnya). */
const sepatu = (p) => p.evaluate(() => {
  const el = document.querySelector('.hp-vn .cer-latar'); const c = el?.querySelector('.cer-piksel-kanvas'); const kam = el?.getAttribute('data-kamera');
  if (!c || !kam) return null;
  const [kx, ky, uk] = kam.split(','); const vw = Number(uk.split('x')[0]); const s = c.width / vw;
  const x0 = Math.max(0, Math.round((740 - kx) * s)), y0 = Math.max(0, Math.round((684 - ky) * s)), x1 = Math.min(c.width, Math.round((860 - kx) * s)), y1 = Math.min(c.height, Math.round((764 - ky) * s));
  if (x1 <= x0 || y1 <= y0) return { gelap: 0, diperiksa: 0, catatan: 'kotak di luar pandangan' };
  const d = c.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data; let gelap = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 150) gelap++;
  return { gelap, diperiksa: d.length / 4 };
});
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = []; let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus && !UKUR) gagal++; console.log(lulus ? 'PASS' : UKUR ? 'UKUR' : 'FAIL', nama, JSON.stringify(data)); };
if (!HANYA_KARTU) {
for (const akhir of ['puas', 'catatan', 'kurang']) {
  const st = STATES[`akhir-${akhir}`];
  if (!st) { lapor(`akhir-${akhir}`, false, { sebab: 'state tidak ada di states.json' }); continue; }
  for (const vp of VP) {
    const { ctx, p } = await bukaPool(b, BASE, st.nilai, vp);
    const r = await sampel(p);
    const a = r.akhir;
    const f = a?.kamera ? bingkai(a) : null;
    const jalanOk = r.jumlahPose === POSE_HARAPAN_HENDRA[vp.w] && r.keduaBingkai && r.poseAkhir === 'jalan-b' && r.sampelJalan >= 3 && r.turun && r.bulat && r.xAwal > TUJUAN && r.lamaJalanMd <= 7 * 270 + 150 && r.gambarBeda2d >= 3;
    const tibaOk = !!a && a.jalan === null && a.kakiHendra === TUJUAN && a.poseHendra === `berdiri:kiri:${WAJAH[akhir]}` && !!a.poseMiss && a.lokasi === 'kantor' && a.hadir === 'missRaksa hendra' && a.telepon === null && a.sisipan === null;
    lapor(`jalan-${akhir}-${vp.w}`, jalanOk && tibaOk, { harapPose: POSE_HARAPAN_HENDRA[vp.w], ...r });
    lapor(`bingkai-${akhir}-${vp.w}`, !!f && f.udaraKepalaHendra >= 0 && f.udaraKepalaMiss >= 0 && f.hendraDalamLebar && f.papanUtuh && !f.papanTertutupKepala, { ...f, kamera: a?.kamera, panggung: a?.panggung });
    if (vp.w !== 390) await p.screenshot({ path: path.join(OUT, `akhir-${akhir}-${vp.w}-akhir.png`) });
    // D-138: pita status satu baris (360: dulu dua baris, 42 px, di atas tangan Hendra).
    const pita = await p.evaluate(() => { const r = document.querySelector('.hp-vn .cer-suasana')?.getBoundingClientRect(); return r ? [Math.round(r.width), Math.round(r.height)] : null; });
    lapor(`pita-${akhir}-${vp.w}`, !!pita && pita[1] <= 30, { pita });
    // Ketukan kedua (baris Miss Raksa) + D-137: tidak ada piksel gelap (sepatu Miss Raksa) di lantai depan meja di bawah kakinya.
    await lanjut(p); await tunggu(700);
    const s2 = await sepatu(p);
    await p.screenshot({ path: path.join(OUT, `akhir-${akhir}-${vp.w}-ketukan2.png`) });
    lapor(`sepatu-${akhir}-${vp.w}`, !!s2 && s2.gelap === 0, s2 ?? {});
    await ctx.close();
  }
  // Tangkapan 390 DPR3: 0,3 d / 0,9 d / akhir.
  {
    const { ctx, p } = await bukaPool(b, BASE, st.nilai, VP[1]);
    await p.waitForFunction(() => document.querySelector('.hp-vn .cer-piksel-kanvas[data-jalan]'), { timeout: 5000 }).catch(() => null);
    const t0 = Date.now(); const catat = {};
    for (const ms of [300, 900]) {
      await tunggu(Math.max(0, ms - (Date.now() - t0)));
      catat[ms] = (await baca(p))?.jalan?.join(':') ?? null;
      await p.screenshot({ path: path.join(OUT, `akhir-${akhir}-390-${String(ms / 1000).replace('.', '_')}d.png`) });
    }
    await tunggu(Math.max(0, 2900 - (Date.now() - t0)));
    const x = await baca(p);
    await p.screenshot({ path: path.join(OUT, `akhir-${akhir}-390-akhir.png`) });
    lapor(`tangkapan-${akhir}-390`, !!catat[300] && !x?.jalan && Number(x?.kaki.hendra?.[0]) === TUJUAN, { ...catat, akhir: x?.pose.hendra?.join(':') });
    await ctx.close();
  }
}
// D-137 di adegan pembuka (Miss Raksa sendiri) + D-135: Pak Bima K07 tetap di x 980.
for (const vp of VP) {
  const { ctx, p } = await bukaPool(b, BASE, STATES.mentor.nilai, vp);
  await tunggu(900);
  const s1 = await sepatu(p);
  lapor(`sepatu-mentor-${vp.w}`, !!s1 && s1.gelap === 0, s1 ?? {});
  if (vp.w === 1280) await p.screenshot({ path: path.join(OUT, 'mentor-1280.png') });
  await ctx.close();
}
{
  const { ctx, p } = await bukaPool(b, BASE, STATES.bima.nilai, VP[2]);
  await tunggu(900);
  const x = await baca(p);
  await p.screenshot({ path: path.join(OUT, 'k07-bima-1280.png') });
  lapor('bima-k07-1280', Number(x?.kaki.bima?.[0]) === 980, { kaki: x?.kaki, pose: x?.pose.bima?.join(':') });
  await ctx.close();
}
// 3. gerak dikurangi: tidak pernah berjalan.
if (STATES['akhir-puas']) {
  const { ctx, p } = await bukaPool(b, BASE, STATES['akhir-puas'].nilai, VP[0], { kurang: true });
  const r = await sampel(p, 2.5);
  lapor('jalan-dikurangi-360', r.sampelJalan === 0 && r.gambarBeda2d === 1 && r.akhir?.kakiHendra === TUJUAN, r);
  await ctx.close();
}
// 4. Lanjut di tengah jalan: langsung berdiri.
if (STATES['akhir-puas']) {
  const { ctx, p } = await bukaPool(b, BASE, STATES['akhir-puas'].nilai, VP[0]);
  await p.waitForFunction(() => document.querySelector('.hp-vn .cer-piksel-kanvas[data-jalan]'), { timeout: 5000 }).catch(() => null);
  await tunggu(350);
  const sebelum = await baca(p);
  await p.evaluate(() => { const c = [...document.querySelectorAll('.hp-vn-aksi button, .hp-komposer button')].filter((x) => !x.disabled && x.getBoundingClientRect().width > 0); c.at(-1)?.click(); });
  await tunggu(250);
  const sesudah = await baca(p);
  await tunggu(600);
  const nanti = await baca(p);
  lapor('lanjut-tengah-jalan-360', !!sebelum?.jalan && !!sesudah && !sesudah.jalan && !nanti?.jalan && Number(sesudah.kaki.hendra?.[0]) === TUJUAN, { sebelum: sebelum?.jalan?.join(':'), sesudah: sesudah ? { jalan: sesudah.jalan, kaki: sesudah.kaki.hendra, pose: sesudah.pose.hendra?.join(':') } : null, nanti: nanti?.jalan ?? null });
  await ctx.close();
}
} // !HANYA_KARTU
// 6. T-024: kartu akhir satu layar. Chromium memakai browser yang sama; WebKit diluncurkan sesudah Chromium ditutup (SATU browser).
if (!TANPA_KARTU) await jalankanKartu('chromium', b, BASE, lapor, { ukur: UKUR });
await b.close();
if (!TANPA_KARTU && !process.argv.includes('--tanpa-webkit')) {
  const wk = await luncur('webkit');
  try { await jalankanKartu('webkit', wk, BASE, lapor, { ukur: UKUR }); } finally { await wk.close().catch(() => {}); }
}
if (!HANYA_KARTU) fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
if (!TANPA_KARTU) { fs.mkdirSync(OUT_KARTU, { recursive: true }); fs.writeFileSync(path.join(OUT_KARTU, 'hasil.json'), JSON.stringify(hasil.filter((x) => /^(kartu|pas)-/.test(x.nama)), null, 1)); }
console.log(UKUR ? 'UKUR selesai' : gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(!UKUR && gagal ? 1 : 0);
