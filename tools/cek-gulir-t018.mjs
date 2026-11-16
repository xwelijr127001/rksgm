/**
 * T-018 Tahap 1: layar OBROLAN di HP tidak menggulir halaman. State = team/evidence/T-018/states.json
 * (npx tsx --tsconfig client/tsconfig.json tools/cerita/state-obrolan-t018.mts > team/evidence/T-018/states.json).
 *
 * Per state x 360x740 DPR2, 390x844 DPR3, 360x640 DPR2 (id; en + zh untuk state terpanjang), Chromium (puppeteer-core) lalu
 * WebKit (playwright-core 1.65.1 = WebKit build 2388 yang terpasang), SATU browser pada satu waktu:
 *  1. halaman   : document.scrollingElement.scrollHeight <= innerHeight, tidak ada luapan mendatar, window.scrollTo tidak bergerak
 *  2. tombol    : tombol utama (.primary-action terakhir di obrolan) utuh di dalam visualViewport
 *  3. penggulir : tepat SATU wilayah meluap (.hp-gulir), bisa digulir sampai ujung, kepala cerita & kepala obrolan tidak bergerak
 *  4. riwayat   : "Lihat pesan sebelumnya" -> pesan pertama bisa dicapai dengan menggulir; halaman tetap tidak menggulir
 *  5. ikut      : Lanjut menambah pesan -> penggulir di ujung (atau pesan baru pertama di puncak bila kelompoknya lebih tinggi)
 *  6. pil       : digulir ke atas > 80 px lalu Lanjut -> posisi tetap + pil "Pesan baru" (id/en/zh) di layar; ketuk -> ke ujung
 *  7. balas     : Mulai percakapan -> Balas -> daftar pilihan di dalam penggulir, Kirim tersemat -> kirim -> mengikuti
 *  8. desktop 1280: BUKAN cangkang (halaman menggulir seperti semula). Episode 1: tidak punya layar obrolan (pemain standar),
 *     dicatat + tangkapan layar saja.
 *
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-gulir-t018.mjs [--tanpa-webkit] [--ukur folder]   (exit 1 bila ada yang gagal)
 *   --ukur = hanya mengukur + tangkapan layar (untuk "sebelum"), tanpa menilai.
 * Butuh: npm install --no-save puppeteer-core@24 playwright-core@1.65.1 (SATU perintah: npm membuang paket --no-save lain).
 * Dipakai juga oleh tools/cek-piksel-t013.mjs (cekGulirRingkas, Chromium).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
export const VP_GULIR = [{ n: '360', w: 360, h: 740, dpr: 2 }, { n: '390', w: 390, h: 844, dpr: 3 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
const PIL = { id: 'Pesan baru ↓', en: 'New message ↓', zh: '新消息 ↓' };
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
export const stateGulir = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-018/states.json'), 'utf8'));

export async function luncur(mesin) {
  if (mesin === 'chromium') {
    const pp = (await import('puppeteer-core')).default;
    return pp.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  }
  const { webkit } = await import('playwright-core');
  return webkit.launch({ headless: true });
}

/** Halaman baru (konteks sendiri) di `mesin` dengan profil, bahasa dan progres tersimpan. */
export async function bukaGulir(mesin, b, base, vp, lang, state, url = '/cerita/auto-2') {
  const awal = { pj: PROFIL, lang, st: state ?? null };
  const skrip = (a) => {
    localStorage.setItem('raksa:bahasa', a.lang); localStorage.setItem('raksa:profil', a.pj);
    sessionStorage.setItem('raksa:loader:v1', '1');
    if (a.st) localStorage.setItem('raksa:cerita', a.st);
  };
  const hp = vp.w < 800;
  let ctx, p;
  if (mesin === 'chromium') {
    ctx = await b.createBrowserContext();
    p = await ctx.newPage();
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    await p.evaluateOnNewDocument(skrip, awal);
  } else {
    ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    p = await ctx.newPage();
    await p.addInitScript(skrip, awal);
  }
  const galat = [];
  p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 160)));
  await p.goto(base + url + (lang === 'id' ? '' : `?lang=${lang}`), { waitUntil: 'domcontentloaded' });
  return { p, galat, tutup: () => ctx.close() };
}

/** Tunggu layar cerita siap dan indikator "sedang mengetik" selesai. */
export async function siap(p, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await p.evaluate(() => ({ ada: !!document.querySelector('.hp-obrolan, .hp-vn, .cer-layar main'), ketik: !!document.querySelector('.hp-mengetik') })).catch(() => null);
    if (s?.ada && !s.ketik) break;
    await tunggu(150);
  }
  await p.evaluate(() => document.fonts?.ready.then(() => true)).catch(() => null);
  await tunggu(450);
}
const klik = (p, sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; }, sel);

/** Ukuran layar obrolan saat ini. Menggulir penggulir ke puncak lalu ke ujung (posisi akhir = ujung). */
export function ukur(p) {
  return p.evaluate(() => {
    const vv = window.visualViewport; const se = document.scrollingElement;
    const tampak = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const layar = document.querySelector('.hp-layar'); const ob = document.querySelector('.hp-obrolan'); const g = document.querySelector('.hp-gulir');
    if (!layar || !ob || !g) return { obrolan: false, hpLayar: !!layar, tinggiHalaman: se.scrollHeight, tinggiLayar: window.innerHeight };
    window.scrollTo(0, 99999); const gulirHalaman = Math.round(window.scrollY); window.scrollTo(0, 0);
    const utama = [...ob.querySelectorAll('.primary-action')].filter(tampak).at(-1) ?? null;
    const r = utama?.getBoundingClientRect();
    const dalam = (k) => !!k && k.left >= vv.offsetLeft - 0.5 && k.top >= vv.offsetTop - 0.5 && k.right <= vv.offsetLeft + vv.width + 0.5 && k.bottom <= vv.offsetTop + vv.height + 0.5;
    const nama = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const meluap = [...layar.querySelectorAll('*')].filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(nama);
    const kepala = () => [document.querySelector('.hp-kepala'), document.querySelector('.hp-obrolan-kepala')].map((el) => Math.round(el.getBoundingClientRect().top * 10) / 10);
    const awal = g.scrollTop;
    g.scrollTop = 0; const kepalaAtas = kepala();
    g.scrollTop = g.scrollHeight; const kepalaBawah = kepala();
    const sisa = g.scrollHeight - g.scrollTop - g.clientHeight;
    const gr = g.getBoundingClientRect();
    const isiAkhir = [...g.querySelectorAll('[data-pesan], .hp-ekor > *')].filter(tampak).at(-1)?.getBoundingClientRect();
    const kr = ob.querySelector('.hp-komposer, .hp-gerbang')?.getBoundingClientRect();
    return {
      obrolan: true, cangkang: ob.hasAttribute('data-cangkang'),
      tinggiHalaman: se.scrollHeight, lebarHalaman: se.scrollWidth, tinggiLayar: window.innerHeight, lebarLayar: window.innerWidth, vv: [Math.round(vv.width), Math.round(vv.height)], gulirHalaman,
      tombol: utama ? utama.textContent.trim().slice(0, 40) : null, tombolKotak: r ? [r.left, r.top, r.right, r.bottom].map((x) => Math.round(x)) : null, tombolDalam: dalam(r),
      meluap, penggulir: { tinggi: g.clientHeight, isi: g.scrollHeight, awal: Math.round(awal), sisaDiUjung: Math.round(sisa * 10) / 10, isiAkhirTerlihat: isiAkhir ? isiAkhir.bottom <= gr.bottom + 1 : true },
      kepalaAtas, kepalaBawah, komposerDalam: kr ? kr.bottom <= vv.height + 0.5 : true,
      pesan: g.querySelectorAll('[data-pesan]').length, posisiKepalaObrolan: getComputedStyle(document.querySelector('.hp-obrolan-kepala')).position,
    };
  });
}
/** Nilai ukuran `d` untuk layar HP (cangkang). `harusMeluap` = state terpanjang: penggulir harus benar-benar meluap. */
export function nilaiHp(d, harusMeluap = false) {
  const s = [];
  if (!d.obrolan) return ['bukan layar obrolan'];
  if (!d.cangkang) s.push('bukan cangkang');
  if (d.tinggiHalaman > d.tinggiLayar + 0.5) s.push(`halaman ${d.tinggiHalaman} > ${d.tinggiLayar}`);
  if (d.lebarHalaman > d.lebarLayar + 0.5) s.push('luapan mendatar');
  if (d.gulirHalaman !== 0) s.push(`halaman bisa digulir ${d.gulirHalaman}`);
  if (!d.tombol || !d.tombolDalam) s.push('tombol utama di luar visualViewport');
  if (!d.komposerDalam) s.push('komposer terpotong');
  if (d.meluap.some((x) => !x.includes('hp-gulir')) || d.meluap.length > 1) s.push('wilayah meluap lain: ' + d.meluap.join(' '));
  if (harusMeluap && d.meluap.length !== 1) s.push('penggulir tidak meluap');
  if (d.penggulir.sisaDiUjung > 1 || !d.penggulir.isiAkhirTerlihat) s.push('tidak sampai ujung');
  if (d.kepalaAtas[0] !== 0 || d.kepalaAtas.join() !== d.kepalaBawah.join()) s.push('kepala bergerak');
  return s;
}

/** 1-3 (+ 4 bila ada riwayat lama). */
export async function cekStatis(p, harusMeluap) {
  await siap(p);
  const d = await ukur(p);
  const sebab = nilaiHp(d, harusMeluap);
  let riwayat = null;
  if (d.obrolan && await klik(p, '.hp-lama')) {
    await tunggu(350);
    riwayat = await p.evaluate(() => {
      const g = document.querySelector('.hp-gulir'); const tengah = Math.round(g.scrollTop);
      g.scrollTop = 0;
      const a = g.querySelector('[data-pesan]')?.getBoundingClientRect(); const gr = g.getBoundingClientRect();
      const tutup = document.querySelector('.hp-lama')?.getBoundingClientRect();
      return { pesan: g.querySelectorAll('[data-pesan]').length, posisiSaatDibuka: tengah, pertamaTerlihat: !!a && a.top >= gr.top - 1 && a.top < gr.bottom, tombolTutupTerlihat: !!tutup && tutup.top >= gr.top - 1, halaman: document.scrollingElement.scrollHeight, layar: window.innerHeight };
    });
    if (!(riwayat.pesan > d.pesan)) sebab.push('riwayat tidak bertambah');
    if (!riwayat.pertamaTerlihat || !riwayat.tombolTutupTerlihat) sebab.push('pesan pertama tidak tercapai');
    if (riwayat.halaman > riwayat.layar + 0.5) sebab.push('halaman menggulir sesudah riwayat dibuka');
    if (riwayat.posisiSaatDibuka <= 0 && d.penggulir.isi > d.penggulir.tinggi) sebab.push('riwayat dibuka tetapi pandangan di puncak');
  }
  return { lulus: sebab.length === 0, data: { sebab, ...d, riwayat } };
}

const daftarId = (p) => p.evaluate(() => [...document.querySelectorAll('.hp-gulir [data-pesan]')].map((x) => x.getAttribute('data-pesan')));
/** Posisi sesudah pesan bertambah: di ujung, atau pesan baru pertama di puncak penggulir. */
const posisiBaru = (p, lama) => p.evaluate((lama) => {
  const g = document.querySelector('.hp-gulir'); if (!g) return null;
  const semua = [...g.querySelectorAll('[data-pesan]')]; const baru = semua.filter((x) => !lama.includes(x.getAttribute('data-pesan')));
  const gr = g.getBoundingClientRect(); const vv = window.visualViewport;
  const pil = document.querySelector('[data-pesan-baru]'); const pr = pil?.getBoundingClientRect();
  return {
    baru: baru.length, gulir: Math.round(g.scrollTop), sisa: Math.round(g.scrollHeight - g.scrollTop - g.clientHeight), atasBaru: baru[0] ? Math.round(baru[0].getBoundingClientRect().top - gr.top) : null,
    halaman: document.scrollingElement.scrollHeight, layar: window.innerHeight,
    pil: pil ? pil.textContent.trim() : null, pilDalam: pr ? pr.top >= gr.top && pr.bottom <= vv.height && pr.left >= 0 && pr.right <= vv.width : false,
  };
}, lama);
const mengikuti = (d) => !!d && d.baru > 0 && (d.sisa <= 2 || (d.atasBaru !== null && Math.abs(d.atasBaru - 8) <= 10)) && d.halaman <= d.layar + 0.5;

/** 5: Lanjut menambah pesan -> penggulir mengikuti. */
export async function cekIkut(p) {
  await siap(p);
  const lama = await daftarId(p);
  if (!await klik(p, '[data-lanjut]')) return { lulus: false, data: { sebab: 'tanpa tombol Lanjut' } };
  await tunggu(1800);
  const d = await posisiBaru(p, lama);
  return { lulus: mengikuti(d) && !d.pil, data: d };
}
/** 6: digulir ke atas lalu Lanjut -> posisi tetap + pil; ketuk pil -> ujung. */
export async function cekPil(p, lang) {
  await siap(p);
  const lama = await daftarId(p);
  await p.evaluate(() => { document.querySelector('.hp-gulir').scrollTop = 0; });
  await tunggu(250);
  if (!await klik(p, '[data-lanjut]')) return { lulus: false, data: { sebab: 'tanpa tombol Lanjut' } };
  await tunggu(1800);
  const a = await posisiBaru(p, lama);
  await klik(p, '[data-pesan-baru]');
  await tunggu(400);
  const z = await posisiBaru(p, lama);
  const lulus = !!a && a.baru > 0 && a.gulir <= 2 && a.pil === PIL[lang] && a.pilDalam && a.halaman <= a.layar + 0.5 && z.sisa <= 2 && z.pil === null;
  return { lulus, data: { sesudahLanjut: a, sesudahPil: z } };
}
/** 7: (Mulai percakapan) -> Balas -> pilihan di penggulir + Kirim tersemat -> pilih -> kirim -> mengikuti. */
export async function cekBalas(p, kirim = true) {
  await siap(p);
  const sebab = [];
  let gerbang = null;
  if (await p.evaluate(() => !!document.querySelector('[data-mulai-percakapan]'))) {
    gerbang = await ukur(p);
    sebab.push(...nilaiHp(gerbang).map((x) => 'gerbang: ' + x));
    await klik(p, '[data-mulai-percakapan]');
    await tunggu(600);
    await siap(p);
  }
  if (!await klik(p, '[data-balas]')) return { lulus: false, data: { sebab: ['tanpa tombol Balas'], gerbang } };
  await tunggu(600);
  const buka = await p.evaluate(() => {
    const g = document.querySelector('.hp-gulir'); const gr = g.getBoundingClientRect();
    const tanya = document.querySelector('.hp-ekor > .hp-pilih .hp-tanya')?.getBoundingClientRect();
    return { pilihDiPenggulir: !!document.querySelector('.hp-gulir .hp-ekor > .hp-pilih .hp-opsi'), kirimDiKomposer: !!document.querySelector('.hp-komposer [data-kirim]'), tanyaTerlihat: !!tanya && tanya.top >= gr.top - 1 && tanya.bottom <= gr.bottom + 1 };
  });
  const terbuka = await ukur(p);
  sebab.push(...nilaiHp(terbuka).map((x) => 'pilihan terbuka: ' + x));
  if (!buka.pilihDiPenggulir || !buka.kirimDiKomposer) sebab.push('pilihan/kirim tidak di tempatnya');
  if (!buka.tanyaTerlihat) sebab.push('pertanyaan tidak terlihat sesudah Balas');
  let sesudah = null;
  if (kirim) {
    const lama = await daftarId(p);
    await klik(p, '.hp-opsi');
    await tunggu(350);
    await klik(p, '[data-kirim]');
    await tunggu(2000);
    sesudah = await posisiBaru(p, lama);
    if (sesudah && !mengikuti(sesudah)) sebab.push('tidak mengikuti balasan');
    if (!sesudah) sesudah = { pindahTampilan: true };
  }
  return { lulus: sebab.length === 0, data: { sebab, buka, tombol: terbuka.tombol, tombolKotak: terbuka.tombolKotak, penggulir: terbuka.penggulir, sesudah } };
}

/** Ringkas untuk cek-piksel-t013.mjs (Chromium, browser puppeteer `b` milik pemanggil). */
export async function cekGulirRingkas(b, base, cepat = false) {
  const S = stateGulir(); const out = [];
  for (const vp of cepat ? VP_GULIR.slice(0, 1) : VP_GULIR) {
    const h = await bukaGulir('chromium', b, base, vp, 'id', S['obrolan-b4'].nilai);
    const r = await cekStatis(h.p, true);
    out.push({ nama: `t018-obrolan-b4-${vp.n}`, lulus: r.lulus && h.galat.length === 0, data: { sebab: r.data.sebab, halaman: r.data.tinggiHalaman, layar: r.data.tinggiLayar, tombolKotak: r.data.tombolKotak, meluap: r.data.meluap } });
    await h.tutup();
  }
  const h = await bukaGulir('chromium', b, base, VP_GULIR[0], 'id', S['obrolan-lanjut'].nilai);
  const r = await cekIkut(h.p);
  out.push({ nama: 't018-obrolan-ikut-360', lulus: r.lulus, data: r.data });
  await h.tutup();
  return out;
}

// ------------------------------------------------------------------ dijalankan langsung
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs');
  mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
  const iUkur = process.argv.indexOf('--ukur');
  const UKUR = iUkur >= 0;
  const OUT = path.resolve(UKUR ? process.argv[iUkur + 1] : path.join(ROOT, 'team/evidence/T-018/stage1'));
  fs.mkdirSync(OUT, { recursive: true });
  const S = stateGulir();
  const hasil = []; let gagal = 0;
  const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus && !UKUR) gagal++; console.log(lulus ? 'PASS' : UKUR ? 'UKUR' : 'FAIL', nama, JSON.stringify(data)); };
  const DESKTOP = { n: '1280', w: 1280, h: 800, dpr: 1 };
  const mesinDaftar = process.argv.includes('--tanpa-webkit') || UKUR ? ['chromium'] : ['chromium', 'webkit'];
  for (const mesin of mesinDaftar) {
    let b;
    try { b = await luncur(mesin); } catch (e) { lapor(`${mesin}-luncur`, false, { sebab: String(e?.message ?? e).slice(0, 200), petunjuk: 'npm install --no-save puppeteer-core@24 playwright-core@1.65.1' }); continue; }
    const wk = mesin === 'webkit';
    const jalan = async (nama, vp, lang, state, fn, foto, url) => {
      const h = await bukaGulir(mesin, b, BASE, vp, lang, state, url);
      try {
        const r = await fn(h.p);
        if (foto) await h.p.screenshot({ path: path.join(OUT, `${nama}.png`) });
        lapor(nama, r.lulus && h.galat.length === 0, { ...r.data, ...(h.galat.length ? { galat: h.galat } : {}) });
      } catch (e) { lapor(nama, false, { sebab: 'galat alat: ' + String(e?.message ?? e).slice(0, 200) }); }
      await h.tutup();
    };
    // 1-4: statis. Chromium: semua state x 3 ukuran (id) + b4 en/zh x 3 ukuran. WebKit: b4 + b1 x 3 ukuran (id) + b4 390 en/zh.
    for (const [kasus, bahasa] of [['obrolan-b4', ['id', 'en', 'zh']], ['obrolan-b1', ['id']], ['obrolan-tugas', ['id']], ['obrolan-pilihan', ['id']]]) {
      if (wk && (kasus === 'obrolan-tugas' || kasus === 'obrolan-pilihan')) continue;
      for (const lang of bahasa) for (const vp of VP_GULIR) {
        if (wk && lang !== 'id' && vp.n !== '390') continue;
        const nama = `${kasus}-${vp.n}-${lang}-${mesin}`;
        if (UKUR) await jalan(nama, vp, lang, S[kasus].nilai, async (p) => { await siap(p); const d = await ukur(p); await p.evaluate(() => { const g = document.querySelector('.hp-gulir'); if (g) g.scrollTop = g.scrollHeight; window.scrollTo(0, 99999); }); await tunggu(200); return { lulus: true, data: d }; }, true);
        else await jalan(nama, vp, lang, S[kasus].nilai, async (p) => { await siap(p); await p.screenshot({ path: path.join(OUT, `${nama}.png`) }); return cekStatis(p, kasus === 'obrolan-b4'); }, false);
      }
    }
    if (!UKUR) {
      // 5-7: perilaku.
      for (const vp of wk ? [VP_GULIR[1]] : VP_GULIR) {
        await jalan(`ikut-${vp.n}-id-${mesin}`, vp, 'id', S['obrolan-lanjut'].nilai, cekIkut, false);
        for (const lang of vp.n === '390' ? ['id', 'en', 'zh'] : ['id']) await jalan(`pil-${vp.n}-${lang}-${mesin}`, vp, lang, S['obrolan-lanjut'].nilai, (p) => cekPil(p, lang), vp.n === '390' && lang === 'id');
        await jalan(`balas-${vp.n}-id-${mesin}`, vp, 'id', S['obrolan-pilihan'].nilai, (p) => cekBalas(p, true), false);
        await jalan(`balas-b1-${vp.n}-id-${mesin}`, vp, 'id', S['obrolan-b1'].nilai, (p) => cekBalas(p, false), true);
      }
    }
    // 8: desktop 1280 = bukan cangkang, halaman menggulir seperti semula (Chromium saja); Episode 1 = tanpa layar obrolan.
    if (!wk) for (const kasus of ['obrolan-b4', 'obrolan-b1']) {
      await jalan(`${kasus}-1280-id-${mesin}`, DESKTOP, 'id', S[kasus].nilai, async (p) => {
        await siap(p);
        await p.evaluate(() => window.scrollTo(0, 0)); await tunggu(200);
        const d = await ukur(p);
        return { lulus: d.obrolan && !d.cangkang && d.posisiKepalaObrolan === 'sticky' && d.meluap.length === 0, data: { cangkang: d.cangkang, tinggiHalaman: d.tinggiHalaman, tinggiLayar: d.tinggiLayar, posisiKepalaObrolan: d.posisiKepalaObrolan, meluap: d.meluap } };
      }, true);
    }
    await jalan(`ep1-390-id-${mesin}`, VP_GULIR[1], 'id', null, async (p) => {
      await siap(p);
      const d = await p.evaluate(() => ({ hpLayar: !!document.querySelector('.hp-layar'), obrolan: !!document.querySelector('.hp-obrolan'), pemain: document.querySelector('.cer-layar')?.className ?? null, tinggiHalaman: document.scrollingElement.scrollHeight, tinggiLayar: window.innerHeight }));
      return { lulus: !d.obrolan && !d.hpLayar, data: { ...d, catatan: 'Episode 1 memakai pemain cerita standar: tidak ada layar obrolan (Tahap 2)' } };
    }, true, '/cerita/auto-1');
    await b.close();
    await tunggu(500);
  }
  fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  console.log(UKUR ? 'UKUR selesai' : gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(!UKUR && gagal ? 1 : 0);
}
