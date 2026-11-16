/**
 * T-021: adegan telepon di serah-terima panggung kantor <-> obrolan WhatsApp (hp/transisiTelepon.tsx).
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-telepon-t021.mjs [--tanpa-foto]
 * Per ukuran 390x844 dan 360x740 (Chromium, gerak normal dipaksa 'no-preference'):
 *  MAJU  (state 'mentor' = pembuka di kantor, Lanjut sampai obrolan K01): perekam di dalam halaman mencatat SETIAP bingkai
 *        (rAF) sejak <html data-telepon> muncul. Syarat: sel lengan tergambar di panggung sebelum 350 md dan sel "membaca" paling
 *        lambat 350 md; gambar POV muncul sesudah 350 md dan layarnya MENUTUPI kotak panggung paling lambat 800 md; obrolan
 *        terpasang paling lambat 1.000 md (+ satu bingkai) dan lapisan hilang; halaman tidak pernah menggulir / memanjang;
 *        tinggi kotak panggung tetap selama panggung tampil.
 *  BALIK (state 'akhir-puas' dimundurkan satu langkah ke baris terakhir akibat K15 di obrolan, lalu Lanjut): POV penuh di bingkai
 *        pertama, mengecil sampai 300 md, sel lengan 1 lalu 0, selesai paling lambat 700 md (+ satu bingkai); panggung sudah terpasang
 *        sejak awal; syarat halaman sama.
 *  GERAK DIKURANGI (prefers-reduced-motion: reduce): potong langsung, lapisan tidak pernah ada, untuk kedua arah.
 *  KETUK: ketuk saat adegan maju berjalan = langsung obrolan.
 *  + 6 tangkapan layar per arah per ukuran (tiap tangkapan = muat ulang + tunggu T md; waktu sebenarnya dicatat di nama berkas).
 * Satu browser; prioritas rendah. Keluar 1 bila ada yang gagal.
 */
import fs from 'node:fs';
import path from 'node:path';
import { luncur, tunggu } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah();

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
const OUT = path.join(ROOT, 'team/evidence/T-021/fullstack');
fs.mkdirSync(OUT, { recursive: true });
const FOTO = !process.argv.includes('--tanpa-foto');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const VP = [{ n: '390x844', w: 390, h: 844, dpr: 3 }, { n: '360x740', w: 360, h: 740, dpr: 2 }];
const hasil = []; let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };

/** State obrolan tepat sebelum akhir: 'akhir-puas' dimundurkan satu baris (node akibat K15, semua barisnya sudah tampil). */
function sebelumAkhir(nama = 'akhir-puas') {
  const v = JSON.parse(S[nama].nilai); const st = v.episode['auto-2'].state;
  const r = st.riwayat; if (r.at(-1).jenis !== 'baris' || r.at(-1).node !== nama) throw new Error('bentuk state ' + nama + ' berubah');
  const lalu = r.at(-2).node; r.pop();
  st.node = lalu; st.baris = r.filter((e) => e.jenis === 'baris' && e.node === lalu).length; st.langkah -= 1; st.akhir = null;
  return { nilai: JSON.stringify(v), node: lalu };
}

/** Perekam dalam halaman: mulai saat <html data-telepon> muncul, satu catatan per bingkai selama `lama` md. */
const PEREKAM = () => {
  window.__tlp = { mulai: null, log: [], selesai: false };
  const ambil = (t) => {
    const pg = document.querySelector('.hp-vn .cer-panggung.cer-latar'); const lp = document.querySelector('[data-telepon-lapis]'); const kt = lp?.querySelector('.tlp-kotak')?.getBoundingClientRect(); const im = lp?.querySelector('.tlp-pov')?.getBoundingClientRect();
    const se = document.scrollingElement; const kv = pg?.querySelector('.cer-piksel-kanvas');
    // persegi layar telepon di gambar POV (366 x 229: x 144, y 32, 78 x 154) sesudah transformasi
    const k = im ? im.width / 366 : 0; const ly = im ? { l: im.left + 144 * k, t: im.top + 32 * k, r: im.left + 222 * k, b: im.top + 186 * k } : null;
    return { t: Math.round(t), tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan') ?? null, lapis: !!lp, pada: lp ? Number(lp.getAttribute('data-pada')) : null, sel: pg?.getAttribute('data-telepon-sel') ?? null,
      pov: lp?.getAttribute('data-pov') ? Number(lp.getAttribute('data-pov')) : null, menutup: !!(ly && kt) && ly.l <= kt.left + 0.5 && ly.t <= kt.top + 0.5 && ly.r >= kt.right - 0.5 && ly.b >= kt.bottom - 0.5,
      povMenutup: !!(im && kt) && im.left <= kt.left + 0.5 && im.top <= kt.top + 0.5 && im.right >= kt.right - 0.5 && im.bottom >= kt.bottom - 0.5,
      tutupPenuh: !!kt && window.__tlp.kotakPenuh !== undefined ? Math.abs(kt.height - window.__tlp.kotakPenuh) < 1 : null, tutup: !!lp?.hasAttribute('data-tutup'),
      kotak: pg ? Math.round(pg.getBoundingClientRect().height * 10) / 10 : null, kamera: kv ? getComputedStyle(kv).transform !== 'none' : false, zoomKamera: kv ? (() => { const m = getComputedStyle(kv).transform.match(/matrix\(([^,]+)/); return m ? Math.round(Number(m[1]) * 100) / 100 : 1; })() : null, gulir: Math.round(window.scrollY), tinggi: se.scrollHeight - window.innerHeight, lebar: se.scrollWidth - window.innerWidth, akar: document.documentElement.getAttribute('data-telepon') };
  };
  const jalan = () => { const t = performance.now() - window.__tlp.mulai; window.__tlp.log.push(ambil(t)); if (t < 1500) requestAnimationFrame(jalan); else window.__tlp.selesai = true; };
  const pasang = () => { if (!document.documentElement) { setTimeout(pasang, 0); return; } new MutationObserver(() => { if (window.__tlp.mulai === null && document.documentElement.hasAttribute('data-telepon')) { window.__tlp.mulai = performance.now(); window.__tlp.kotakPenuh = document.querySelector('.hp-vn .cer-panggung.cer-latar')?.getBoundingClientRect().height; window.__tlp.log.push(ambil(0)); requestAnimationFrame(jalan); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-telepon'] }); };
  pasang();
};

async function buka(b, vp, nilai, kurang) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage();
  await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: kurang ? 'reduce' : 'no-preference' }]);
  await p.evaluateOnNewDocument((pj, st) => { localStorage.setItem('raksa:bahasa', 'id'); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', st); }, PROFIL, nilai);
  await p.evaluateOnNewDocument(PEREKAM);
  const galat = []; p.on('pageerror', (e) => galat.push(String(e.message).slice(0, 160)));
  await p.goto(BASE + '/cerita/auto-2' + (kurang ? '?gerak=ikut' : ''), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.hp-layar'), { timeout: 20000 });
  await tunggu(900);
  return { p, galat, tutup: () => ctx.close().catch(() => {}) };
}
const klikLanjut = (p) => p.evaluate(() => { const el = [...document.querySelectorAll('[data-lanjut], .hp-vn-aksi .primary-action, [data-lanjut-obrolan]')].find((x) => !x.disabled && x.getBoundingClientRect().width > 0) ?? [...document.querySelectorAll('button')].find((x) => /^Lanjut/.test(x.textContent.trim()) && !x.disabled); if (!el) return false; el.click(); return true; });
const tampilan = (p) => p.evaluate(() => document.querySelector('.hp-layar')?.getAttribute('data-tampilan'));

/** Lanjut sampai tampilan berganti dari `dari`. Mengembalikan jumlah ketukan; adegan (bila ada) sudah mulai saat kembali. */
async function sampaiSerah(p, dari, maks = 14) {
  for (let i = 1; i <= maks; i++) {
    if (!await klikLanjut(p)) return -i;
    await tunggu(30);
    const x = await p.evaluate((d) => ({ mulai: window.__tlp.mulai !== null, tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), tahan: !!document.querySelector('[data-telepon-lapis]') }), dari);
    if (x.mulai || x.tahan || x.tampilan !== dari) return i;
    await tunggu(650);
  }
  return 0;
}

const b = await luncur('chromium');
const batas = setTimeout(() => { console.log('FAIL penjaga: melewati 12 menit'); process.exit(1); }, 12 * 60000);
try {
  const AKHIR = sebelumAkhir();
  for (const vp of VP) {
    // ---------------------------------------------------------------- MAJU
    // Balik: sekali per akhir (D-210 dkk.); akhir-catatan dan akhir-kurang di 390x844 saja.
    const KASUS = [['maju', S.mentor.nilai, 'adegan', 'obrolan', 'maju'], ['balik', AKHIR.nilai, 'obrolan', 'adegan', 'balik'], ...(vp.n === '390x844' ? ['akhir-catatan', 'akhir-kurang'].map((n) => ['balik', sebelumAkhir(n).nilai, 'obrolan', 'adegan', 'balik-' + n.slice(6)]) : [])];
    for (const [arah, nilai, dari, ke, nama] of KASUS) {
      const h = await buka(b, vp, nilai, false);
      const awal = await tampilan(h.p);
      const ketuk = await sampaiSerah(h.p, dari);
      await h.p.waitForFunction(() => window.__tlp.selesai || window.__tlp.mulai === null && false, { timeout: 4000 }).catch(() => null);
      await tunggu(200);
      const log = await h.p.evaluate(() => window.__tlp.log);
      const sebab = [];
      if (awal !== dari) sebab.push(`state awal bukan ${dari}: ${awal}`);
      if (ketuk <= 0) sebab.push('serah-terima tidak tercapai (' + ketuk + ')');
      if (!log.length) sebab.push('adegan telepon tidak berjalan');
      const bingkai = log.length > 1 ? Math.round((log.at(-1).t - log[0].t) / (log.length - 1)) : 0; const tol = Math.max(34, bingkai * 2);
      const pertama = (f) => log.find(f)?.t ?? null; const terakhir = (f) => log.filter(f).at(-1)?.t ?? null;
      const data = { ketuk, bingkai: log.length, selaBingkai: bingkai };
      if (log.length) {
        const gulir = Math.max(...log.map((x) => Math.abs(x.gulir))), tinggi = Math.max(...log.map((x) => x.tinggi)), lebar = Math.max(...log.map((x) => x.lebar));
        if (gulir > 0 || tinggi > 0 || lebar > 0) sebab.push(`halaman menggulir / memanjang selama adegan: gulir ${gulir}, tinggi +${tinggi}, lebar +${lebar}`);
        const kotak = [...new Set(log.filter((x) => x.tampilan === 'adegan' && x.kotak !== null).map((x) => x.kotak))];
        if (kotak.length > 1) sebab.push('tinggi kotak panggung berubah selama gerak: ' + kotak.join(' / '));
        const sel0 = pertama((x) => x.sel === '0'), sel1 = pertama((x) => x.sel === '1'), pov = pertama((x) => x.pov !== null), penuh = pertama((x) => x.menutup), obrolan = pertama((x) => x.tampilan === 'obrolan'), hilang = pertama((x) => !x.lapis && x.akar === null);
        // D-210 / D-211: kamera hanya 1x atau 2x, dan berganti nilai paling banyak dua kali (masuk, lalu keluar): tidak berdenyut.
        const zk = log.filter((x) => x.zoomKamera !== null).map((x) => x.zoomKamera); const ganti = zk.filter((v, i) => i > 0 && v !== zk[i - 1]).length;
        Object.assign(data, { sel0, sel1, pov, penuh, obrolan, hilang, kotak, skala: [...new Set(log.filter((x) => x.pov !== null).map((x) => x.pov))], kamera: log.some((x) => x.kamera), zoomKamera: [...new Set(zk)], gantiKamera: ganti });
        if (zk.some((v) => v !== 1 && v !== 2)) sebab.push('kamera bukan langkah keras 1x / 2x (D-211): ' + data.zoomKamera.join(' '));
        if (ganti > 2) sebab.push('kamera berdenyut: berganti ' + ganti + ' kali (D-210)');
        // D-213: skala POV bilangan bulat saja. D-212: bingkai POV pertama sudah menutupi kotak (tanpa pita).
        if (data.skala.some((v) => v !== Math.round(v))) sebab.push('skala POV bukan bilangan bulat (D-213): ' + data.skala.join(' '));
        if (log.some((x) => x.pov !== null && !x.povMenutup)) sebab.push('gambar POV tidak menutupi kotak di salah satu bingkai (D-212)');
        if (arah === 'maju' && log.some((x) => x.tutup && !x.tutupPenuh)) sebab.push('penutup hijau bukan seukuran kotak panggung penuh (D-214)');
        if (arah === 'maju') {
          if (sel0 === null || sel0 > 60) sebab.push('sel lengan "mengangkat" tidak tergambar di awal: ' + sel0);
          if (sel1 === null || sel1 > 350) sebab.push('sel lengan "membaca" belum tergambar pada 350 md: ' + sel1);
          if (!data.kamera) sebab.push('kamera tidak mendekat');
          if (pov === null || pov < 350 - tol || pov > 350 + tol) sebab.push('gambar POV tidak mulai di sekitar 350 md: ' + pov);
          if (penuh === null || penuh > 800) sebab.push('layar telepon belum menutupi kotak panggung pada 800 md: ' + penuh);
          if (obrolan === null || obrolan < 800 - tol || obrolan > 800 + tol) sebab.push('obrolan tidak terpasang di sekitar 800 md: ' + obrolan);
          if (hilang === null || hilang > 1000 + tol) sebab.push('adegan belum selesai pada 1.000 md: ' + hilang);
          if (log.some((x) => x.t < (obrolan ?? 0) - 1 && x.tampilan !== 'adegan')) sebab.push('tampilan bukan panggung sebelum 800 md');
        } else {
          const povAkhir = terakhir((x) => x.pov !== null), sel0b = pertama((x) => x.sel === '0');
          Object.assign(data, { povAkhir, sel0b });
          if (!log[0].menutup && !(log[1]?.menutup)) sebab.push('balik: layar telepon tidak menutupi kotak panggung di bingkai pertama');
          if (log.some((x) => x.tampilan !== 'adegan')) sebab.push('balik: panggung tidak terpasang sejak awal');
          if (povAkhir === null || povAkhir > 300 + tol) sebab.push('balik: layar belum selesai mengecil pada 300 md: ' + povAkhir);
          if (sel1 === null || sel0b === null || sel0b < sel1) sebab.push('balik: urutan sel lengan bukan membaca -> mengangkat: ' + JSON.stringify([sel1, sel0b]));
          if (hilang === null || hilang > 700 + tol) sebab.push('balik: adegan belum selesai pada 700 md: ' + hilang);
          const skl = data.skala; if (skl.some((s, i) => i > 0 && s > skl[i - 1])) sebab.push('balik: skala POV tidak menurun: ' + skl.join(' '));
        }
      }
      const akhir = await tampilan(h.p);
      if (akhir !== ke) sebab.push(`tampilan akhir bukan ${ke}: ${akhir}`);
      if (h.galat.length) sebab.push('galat halaman: ' + h.galat.join(' | '));
      lapor(`${nama}-${vp.n}`, sebab.length === 0, { sebab, ...data });
      await h.tutup();

      // gerak dikurangi = potong langsung
      const k = await buka(b, vp, nilai, true);
      const ketukK = await sampaiSerah(k.p, dari);
      await tunggu(400);
      const kk = await k.p.evaluate(() => ({ mulai: window.__tlp.mulai, lapis: !!document.querySelector('[data-telepon-lapis]'), tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), sel: document.querySelector('.cer-panggung')?.getAttribute('data-telepon-sel') ?? null }));
      lapor(`${nama}-${vp.n}-gerak-dikurangi`, ketukK > 0 && kk.mulai === null && !kk.lapis && kk.tampilan === ke && !kk.sel, { ketuk: ketukK, ...kk });
      await k.tutup();

      // 6 tangkapan layar di sepanjang gerak (muat ulang per tangkapan)
      if (FOTO) {
        const T = arah === 'maju' ? [90, 260, 420, 620, 860, 1150] : [40, 160, 340, 470, 600, 800];
        for (const [i, t] of T.entries()) {
          const f = await buka(b, vp, nilai, false);
          if (await sampaiSerah(f.p, dari) > 0) {
            await f.p.waitForFunction((x) => window.__tlp.mulai !== null && performance.now() - window.__tlp.mulai >= x, { timeout: 4000, polling: 'raf' }, t).catch(() => null);
            const buf = await f.p.screenshot();
            const nyata = await f.p.evaluate(() => Math.round(performance.now() - window.__tlp.mulai));
            fs.writeFileSync(path.join(OUT, `${nama}-${vp.n}-${i + 1}-t${t}.png`), buf);
            console.log(`foto ${nama}-${vp.n}-${i + 1}: diminta ${t} md, selesai ditangkap ${nyata} md`);
          }
          await f.tutup();
        }
      }
    }
    // ---------------------------------------------------------------- ketuk = lewati (maju)
    const s = await buka(b, vp, S.mentor.nilai, false);
    await sampaiSerah(s.p, 'adegan');
    await tunggu(150);
    const kena = await s.p.evaluate(() => { const l = document.querySelector('[data-telepon-lapis]'); if (!l) return false; l.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return true; });
    await tunggu(120);
    const ss = await s.p.evaluate(() => ({ lapis: !!document.querySelector('[data-telepon-lapis]'), tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), akar: document.documentElement.getAttribute('data-telepon') }));
    lapor(`ketuk-lewati-${vp.n}`, kena && !ss.lapis && ss.tampilan === 'obrolan' && ss.akar === null, { kena, ...ss });
    await s.tutup();
  }
} finally { clearTimeout(batas); await b.close().catch(() => {}); }
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
