/**
 * T-033: langkah terpandu di tiap aktivitas Episode 2 (pita langkah, petunjuk, penunjuk piksel, kartu cara main).
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-langkah-t033.mjs [--kasus k08] [--tanpa-bahasa]
 * Per aktivitas (K02, K04, K05, K07, K08, K09, K10, K11, K-SIM; state team/evidence/T-013/states.json) x 390x745 (DPR 2) dan
 * 360x640 (DPR 2; layar pendek: pita dan petunjuk keluar dari alur, hanya dibacakan) x id / en / zh: buka kartu tugas -> Mulai -> ukur:
 *  - pita: 3 butir, tepat satu aria-current="step" (langkah 1 saat belum ada isian), teks = kamus langkah.<k>.<n> bahasa itu;
 *  - petunjuk: aria-live, teks = langkah.<k>.p<langkah kini>; satu baris (tidak terpotong);
 *  - penunjuk + cincin .lgk-sasaran pada tombol yang bisa difokus (bila langkah punya sasaran), penunjuk di dalam layar;
 *  - kartu cara main: hanya K05, K10, K-SIM; "Mengerti" menutupnya dan tidak muncul lagi sesudah muat ulang (localStorage);
 *  - halaman tidak menggulir (0 px), pita satu baris 28 px;
 *  - ketukan pada sasaran (390x745, id): langkah maju atau petunjuk berganti (K08: rambu 1 -> langkah 2 "Ketuk lajur").
 * Tangkapan per aktivitas per langkah -> team/evidence/T-033/fullstack/<k>-<langkah>-<ukuran>-<bahasa>.png; hasil.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bukaGulir, luncur, siap, tunggu, denganBatas, pasangPenjaga } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah();
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'team/evidence/T-033/fullstack'); fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
if (['4000', '4001', '4002'].includes(new URL(BASE).port)) { console.error('DITOLAK: port milik server lain'); process.exit(2); }
const argumen = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const AKT = [['k08', 'tol'], ['k02', 'tel-cemas'], ['k04', 'pool'], ['k05', 'bengkel'], ['k07', 'bima'], ['k09', 'wawancara-1'], ['k10', 'wawancara-2'], ['k11', 'berkas'], ['ksim', 'akt-saksi']].filter(([k]) => !argumen('--kasus') || k === argumen('--kasus'));
const PELATIH = new Set(['k05', 'k10', 'ksim']);
// T-033 Fix 1: sasaran penunjuk langkah 1 per aktivitas (D-322..D-326) dan aktivitas berpita ringkas di layar pendek (D-327).
const SASARAN1 = { k08: '.lk-tiang', k02: '.hp-panggung-benda', k04: '.hp-tempat', k05: '.hp-tempat', k07: '.rp-slot', k09: '.hp-saksi-kartu', k10: '.bd-baris', k11: '.hp-mapt-tab-item', ksim: '.sim-ketuk' };
const KOMPAK = new Set(['k05', 'k11']); // diukur: hanya ini yang muat (D-327)
const VP = [{ n: '390x745', w: 390, h: 745, dpr: 2 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
const BAHASA = process.argv.includes('--tanpa-bahasa') ? ['id'] : ['id', 'en', 'zh'];
// kamus langkah dibaca dari sumbernya
const KAMUS = fs.readFileSync(path.join(ROOT, 'client/src/i18n/kamus/langkah.ts'), 'utf8');
function kamus(b, k) {
  const i = KAMUS.indexOf(`\n  ${b}: {`); const j = KAMUS.indexOf('\n  },', i);
  const m = new RegExp(`'${k.replace(/\./g, '\\.')}': '((?:[^'\\\\]|\\\\.)*)'`).exec(KAMUS.slice(i, j)); if (!m) throw new Error(`kamus ${b} ${k}`); return m[1];
}
const hasil = []; let gagal = 0;
const lapor = (n, ok, d) => { hasil.push({ nama: n, lulus: ok, ...d }); if (!ok) gagal++; console.log(ok ? 'PASS' : 'FAIL', n, JSON.stringify(d)); };
const ukur = (p) => p.evaluate(() => {
  const ol = document.querySelector('.lgk-langkah'); const li = ol ? [...ol.querySelectorAll('li')] : [];
  const pet = document.querySelector('.lgk-petunjuk'); const pen = document.querySelector('.lgk-penunjuk'); const sas = document.querySelector('.lgk-sasaran'); const pel = document.querySelector('.lgk-pelatih');
  const r = (e) => e?.getBoundingClientRect();
  return {
    butir: li.map((x) => x.querySelector('span')?.textContent ?? ''), kini: li.findIndex((x) => x.getAttribute('aria-current') === 'step'),
    status: li.map((x) => x.getAttribute('data-status')), pitaTinggi: ol ? Math.round(r(ol).height) : null,
    petunjuk: pet?.textContent ?? null, petunjukLive: pet?.getAttribute('aria-live') ?? null, petunjukBaris: pet ? Math.round(r(pet).height / 20) : null, petunjukPotong: pet ? pet.scrollWidth > pet.clientWidth + 1 : null,
    penunjuk: pen ? [Math.round(r(pen).left), Math.round(r(pen).top)] : null, penunjukDiLayar: pen ? r(pen).top >= 0 && r(pen).bottom <= innerHeight && r(pen).left >= 0 && r(pen).right <= innerWidth : null,
    sasaran: sas ? (sas.tagName.toLowerCase() + '.' + [...sas.classList].slice(0, 2).join('.')) : null, sasaranRambu: sas?.getAttribute('data-rambu') ?? null,
    sasaranCocok: sas ? Object.fromEntries(['.lk-tiang', 'button.lk-lajur', '[data-lanjut-rambu]', '.hp-panggung-benda', '.hp-wadah', '[data-simpul]', '.hp-tempat', '.rp-slot', '.hp-saksi-kartu', '.bd-baris', '.bd-cap-tombol', '.hp-mapt-tab-item', '.hp-tahap-item', '.sim-ketuk'].map((x) => [x, sas.matches(x)])) : {},
    pitaTampil: ol ? getComputedStyle(ol).display !== 'none' && r(ol).height > 1 && r(ol.closest('.lgk')).height > 1 : false, sasaranFokus: sas ? sas.tabIndex >= 0 && !sas.disabled : null,
    pelatih: !!pel, gulir: document.scrollingElement.scrollHeight - innerHeight,
  };
});
async function bukaTugas(p) {
  await siap(p);
  for (let i = 0; i < 12 && !(await p.evaluate(() => !!document.querySelector('[data-mulai-tugas]'))); i++) { await p.evaluate(() => document.querySelector('[data-lanjut], [data-mulai-percakapan]')?.click()); await tunggu(900); await siap(p, 4000); }
  if (!(await p.evaluate(() => { const b = document.querySelector('[data-mulai-tugas]'); b?.click(); return !!b; }))) throw new Error('kartu tugas tidak tercapai');
  await tunggu(1300);
}
let b = await luncur('chromium');
const batal = pasangPenjaga(25, () => { fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1)); try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
for (const [kode, st] of AKT) for (const vp of VP) for (const lang of BAHASA) {
  const nama = `${kode}-${vp.n}-${lang}`; let h = null;
  try {
    await denganBatas((async () => {
      h = await bukaGulir('chromium', b, BASE, vp, lang, S[st].nilai);
      await h.p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
      await bukaTugas(h.p);
      const s = []; const d = await ukur(h.p); const pendek = vp.h < 700;
      const harap = [1, 2, 3].map((n) => kamus(lang, `${kode}.${n}`));
      if (JSON.stringify(d.butir) !== JSON.stringify(harap)) s.push(`pita ${JSON.stringify(d.butir)}`);
      if (d.kini < 0) s.push('tidak ada langkah kini');
      else if (d.petunjuk !== kamus(lang, `${kode}.p${d.kini + 1}`)) s.push(`petunjuk "${d.petunjuk}"`);
      if (d.petunjukLive !== 'polite') s.push('petunjuk tanpa aria-live');
      if (d.petunjukPotong && !pendek && kode !== 'ksim') s.push('petunjuk terpotong'); // layar pendek: satu baris berelipsis (D-327)
      // Layar pendek (< 700 px): pita keluar dari alur (dibacakan saja); K08 menampilkan petunjuknya di tempat kalimat konteks.
      if (kode === 'k11') { if (d.pitaTampil) s.push('K11: pita tampil (tab tahapnya sendiri = langkah, D-326)'); }
      else if (!pendek && d.pitaTinggi !== 28) s.push(`pita ${d.pitaTinggi} px`);
      else if (pendek && KOMPAK.has(kode) && d.pitaTinggi !== 24) s.push(`pita ringkas ${d.pitaTinggi} px (harus 24)`);
      else if (pendek && !KOMPAK.has(kode) && d.pitaTampil) s.push('pita tampil di layar pendek (aktivitas ini pas)');
      if (pendek && KOMPAK.has(kode) && kode !== 'ksim' && !(d.petunjukBaris >= 1)) s.push('layar pendek: petunjuk tidak tampil');
      // T-035 (pemilik): penunjuk + cincin HANYA di K08; di aktivitas lain tidak ada sama sekali (K04: menunjuk jawaban).
      if (kode === 'k08' && !d.sasaranCocok[SASARAN1[kode]]) s.push(`sasaran langkah 1 ${d.sasaran}, harus ${SASARAN1[kode]}`);
      if (kode !== 'k08' && (d.penunjuk || d.sasaran)) s.push(`penunjuk / cincin di luar K08: ${d.sasaran}`);
      if (kode === 'k08' && d.sasaranRambu !== '0') s.push('K08: penunjuk bukan di rambu 1');
      if (d.sasaran && !d.sasaranFokus && kode !== 'k02') s.push('sasaran tidak bisa difokus');
      if (d.penunjuk && !d.penunjukDiLayar) s.push('penunjuk di luar layar');
      if (d.pelatih !== PELATIH.has(kode)) s.push(`kartu cara main ${d.pelatih}`);
      if (d.gulir > 0.5) s.push(`halaman menggulir ${d.gulir} px`);
      await h.p.screenshot({ path: path.join(OUT, `${kode}-langkah${d.kini + 1}-${vp.n}-${lang}${d.pelatih ? '-pelatih' : ''}.png`) });
      const data = { ...d };
      if (d.pelatih) {
        await h.p.click('[data-pelatih-ok]'); await tunggu(300);
        if (await h.p.evaluate(() => !!document.querySelector('.lgk-pelatih'))) s.push('Mengerti tidak menutup');
        await h.p.reload({ waitUntil: 'domcontentloaded' }); await siap(h.p); await tunggu(1200);
        if (!(await h.p.evaluate(() => !!document.querySelector('.lgk-langkah')))) await bukaTugas(h.p);
        if (await h.p.evaluate(() => !!document.querySelector('.lgk-pelatih'))) s.push('kartu cara main muncul lagi sesudah muat ulang');
        if ((await ukur(h.p)).gulir > 0.5) s.push('menggulir sesudah muat ulang');
      }
      // ketukan pada sasaran (sekali, 390x745 id): langkah / petunjuk berubah
      if (vp.n === '390x745' && lang === 'id' && kode !== 'k08') await h.p.screenshot({ path: path.join(ROOT, 'team/evidence/T-035', `${kode}-tanpa-penunjuk-${vp.n}-${lang}.png`) });
      if (vp.n === '390x745' && lang === 'id' && d.sasaran) {
        const sebelum = await ukur(h.p);
        await h.p.evaluate(() => { const x = document.querySelector('.lgk-sasaran'); x?.setAttribute('data-uji-diketuk', ''); x?.click(); }); await tunggu(900);
        const sesudah = await ukur(h.p);
        if (kode !== 'k02' && (await h.p.evaluate(() => !!document.querySelector('.lgk-sasaran[data-uji-diketuk]')))) s.push('penunjuk tetap di tombol yang baru diketuk (D-325)');
        if (kode === 'k02' && !sesudah.sasaranCocok['.hp-wadah']) s.push(`K02: sesudah dokumen diketuk penunjuk di ${sesudah.sasaran}, harus baki (D-333)`);
        if (kode === 'k10' && !sesudah.sasaranCocok['.bd-cap-tombol']) s.push(`K10: sesudah baris diketuk penunjuk di ${sesudah.sasaran}, harus tombol cap`);
        if (kode === 'k08') {
          // D-322/D-323: rambu 1 dibaca -> masih langkah 1, penunjuk ke lajur; lajur ditandai -> tombol lanjut; lanjut -> rambu 2; rambu 2 dibaca -> langkah 2
          const urut = [];
          urut.push(['rambu 1 dibaca', sesudah.kini === 0 && sesudah.sasaranCocok['button.lk-lajur']]);
          urut.push(['petunjuk lajur saat penunjuk di lajur (D-332)', sesudah.petunjuk === kamus(lang, 'k08.p2')]);
          await h.p.evaluate(() => document.querySelector('.lgk-sasaran')?.click()); await tunggu(700); let u = await ukur(h.p);
          urut.push(['lajur ditandai -> tombol lanjut', u.kini === 0 && u.sasaranCocok['[data-lanjut-rambu]']]);
          await h.p.evaluate(() => document.querySelector('.lgk-sasaran')?.click()); await tunggu(900); u = await ukur(h.p);
          urut.push(['lanjut -> rambu 2', u.kini === 0 && u.sasaranRambu === '1']);
          await h.p.evaluate(() => document.querySelector('.lgk-sasaran')?.click()); await tunggu(900); u = await ukur(h.p);
          urut.push(['rambu 2 dibaca -> langkah 2', u.kini === 1]);
          await h.p.evaluate(() => document.querySelector('.lgk-sasaran')?.click()); await tunggu(700);
          await h.p.evaluate(() => document.querySelector('.lgk-sasaran')?.click()); await tunggu(1200); u = await ukur(h.p);
          urut.push(['kesimpulan: penunjuk di kesimpulan pertama + petunjuk 3 (D-332)', u.sasaranCocok['[data-simpul]'] && u.petunjuk === kamus(lang, 'k08.p3')]);
          await h.p.screenshot({ path: path.join(OUT, `k08-kesimpulan-${vp.n}-${lang}.png`) });
          await h.p.screenshot({ path: path.join(OUT, `k08-dua-rambu-${vp.n}-${lang}.png`) });
          data.duaRambu = urut; for (const [n, ok] of urut) if (!ok) s.push('K08 dua rambu: ' + n);
        }
        data.sesudahKetuk = { kini: sesudah.kini, petunjuk: sesudah.petunjuk, sasaran: sesudah.sasaran, gulir: sesudah.gulir };
        await h.p.screenshot({ path: path.join(OUT, `${kode}-langkah${sesudah.kini + 1}-sesudah-ketuk-${vp.n}-${lang}.png`) });
        if (sesudah.gulir > 0.5) s.push(`menggulir sesudah ketuk ${sesudah.gulir} px`);
        void sebelum;
      }
      lapor(nama, s.length === 0, { sebab: s, ...data });
    })(), 120000, nama);
  } catch (e) { lapor(nama, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 160)] }); }
  await h?.tutup();
}
batal(); await b.close().catch(() => {});
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
