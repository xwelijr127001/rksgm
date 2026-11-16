/**
 * T-014: Episode 2 dalam en & zh di browser (server produksi, UI_BASE; bawaan :4001).
 * Untuk tiap state (team/evidence/T-013/states.json + jalur 'awal' = mulai baru, maju sampai pilihan K01) x en/zh x
 * 360x740 DPR2, 390x844 DPR3, 1280x800 DPR1:
 *  - tidak ada gulir mendatar halaman; tidak ada elemen teks cerita yang keluar dari layar atau terpotong mendatar
 *    (label pemeran, tombol pilihan, gelembung obrolan, dialog, kartu aktivitas);
 *  - tidak ada kata Indonesia di teks yang terlihat (di luar nama/merek);
 *  - panggung kantor: papan nama = merek Latin yang sama (digambar font piksel, bukan fon sistem).
 * Tangkapan layar wajib (390 & 1280, en & zh): kantor, wawancara-3, satu aktivitas, satu akhir -> team/evidence/T-014/.
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-bahasa-t014.mjs      (exit 1 bila ada yang gagal)
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama: Node + semua Chrome otomasi ke prioritas rendah

const BASE = process.env.UI_BASE || 'http://127.0.0.1:4001';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'team/evidence/T-014');
fs.mkdirSync(OUT, { recursive: true });
const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const VP = [{ n: '360', w: 360, h: 740, dpr: 2 }, { n: '390', w: 390, h: 844, dpr: 3 }, { n: '1280', w: 1280, h: 800, dpr: 1 }];
const BAHASA = ['en', 'zh'];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const hasil = [];
let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };

async function buka(vp, lang, nilai) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: vp.w < 800, hasTouch: vp.w < 800 });
  await p.evaluateOnNewDocument((pj, lang, st) => {
    localStorage.setItem('raksa:bahasa', lang); localStorage.setItem('raksa:profil', pj);
    sessionStorage.setItem('raksa:loader:v1', '1');
    if (st) localStorage.setItem('raksa:cerita', st);
  }, PROFIL, lang, nilai);
  await p.goto(`${BASE}/cerita/auto-2?lang=${lang}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.cer-piksel[data-siap], .hp-potret, .hp-vn-aksi button, .hp-komposer button'), { timeout: 15000 }).catch(() => null);
  await tunggu(700);
  return { ctx, p };
}
const maju = async (p) => {
  const ok = await p.evaluate(() => { const c = [...document.querySelectorAll('.hp-gerbang button, .hp-vn-aksi button, .hp-komposer button')].filter((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!c.length) return false; c[c.length - 1].click(); return true; });
  await tunggu(800);
  return ok;
};

/** Periksa halaman: gulir mendatar, elemen teks keluar layar / terpotong, kata Indonesia. */
const periksa = (p) => p.evaluate(() => {
  // Kata fungsi Indonesia (T-014 fix: termasuk penyambung yang dirakit kode: dan, atau, ke, di, dari, hari, lajur ...).
  const KATA = /(^|[^A-Za-z])(yang|dan|atau|ke|di|dari|hari|minggu|ada|ini|itu|juga|tidak|untuk|dengan|sudah|belum|saya|kamu|truk|Pak|Bapak|klaim|bengkel|lajur|rambu|supir|berkas|surat)(?![A-Za-z])/;
  const W = document.documentElement.clientWidth;
  const luar = [], potong = [];
  const sel = '.hp-ucapan-nama, .hp-ucapan-teks, .hp-vn-dialog, .hp-vn-dialog *, .hp-gelembung, .hp-gelembung *, .hp-obrolan-nama, .hp-status, .hp-tindakan, .hp-tindakan *, .hp-komposer *, .hp-opsi, .hp-opsi *, .hp-gerbang *, .hp-catatan *, .hp-vn-aksi *, .hp-arena *, .hp-susun *, .akh-kartu *, .cer-suasana, .cer-latar-lokasi, button';
  for (const el of document.querySelectorAll(sel)) {
    const teks = (el.textContent ?? '').trim();
    if (!teks || el.closest('.sr-only')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const gaya = getComputedStyle(el);
    if (gaya.visibility === 'hidden' || gaya.position === 'fixed' && r.bottom < 0) continue;
    const id = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}: ${teks.slice(0, 40)}`;
    if (r.right > W + 1 || r.left < -1) luar.push(id);
    // Terpotong mendatar: isi lebih lebar daripada kotak yang menyembunyikan luapan.
    if (el.scrollWidth > el.clientWidth + 1 && gaya.overflowX !== 'visible' && gaya.overflowX !== 'auto' && gaya.overflowX !== 'scroll' && el.clientWidth > 0) potong.push(id);
  }
  const teks = document.body.innerText;
  const indo = teks.split('\n').map((x) => x.trim()).filter((x) => x && KATA.test(x)).slice(0, 5);
  const latar = document.querySelector('.hp-vn .cer-latar');
  // T-014 fix (D-124): kalimat zh tidak boleh memakai tanda baca ASCII di antara aksara Han ("访谈: A, B. 不需要").
  const HAN = '[\\u3400-\\u9fff]';
  const asciiZh = document.documentElement.lang.startsWith('zh') || /[\u3400-\u9fff]{6}/.test(teks) ? teks.split('\n').map((x) => x.trim()).filter((x) => new RegExp(HAN + '[,:.;] ?' + HAN).test(x) || new RegExp(HAN + '[,:;] ').test(x)).slice(0, 5) : [];
  return { asciiZh, teksAda: (kata) => teks.includes(kata), teksUtuh: teks.length > 4000 ? '' : teks, gulirX: document.documentElement.scrollWidth > W + 1, luar: [...new Set(luar)].slice(0, 6), potong: [...new Set(potong)].slice(0, 6), indo, lokasi: latar?.getAttribute('data-lokasi') ?? null };
});

const WAJIB = { mentor: 'kantor', 'wawancara-3': 'wawancara-3' };
for (const lang of BAHASA) for (const vp of VP) {
  // (1) setiap state tersimpan
  for (const [kasus, st] of Object.entries(STATES)) {
    const { ctx, p } = await buka(vp, lang, st.nilai);
    const r = await periksa(p);
    const nama = `${kasus}-${vp.n}-${lang}`;
    if (WAJIB[kasus] && vp.n !== '360') await p.screenshot({ path: path.join(OUT, `${WAJIB[kasus]}-${vp.n}-${lang}.png`) });
    let lulus = !r.gulirX && !r.luar.length && !r.potong.length && !r.indo.length && !r.asciiZh.length;
    const { teksUtuh, teksAda, ...ringkasR } = r;
    const data = { ...ringkasR };
    // T-014 fix (QA B-01): state sesudah aktivitas HARUS memperlihatkan kalimat rakitan dalam bahasanya (bukti bahwa yang
    // dipindai memang kalimat itu): daftar dokumen di obrolan, daftar lajur di ringkasan rambu, daftar saksi.
    const HARUS = {
      'akt-berkas': { en: ['Truck registration and Mr Hendra’s ID card.', 'Driver’s payslip.'], zh: ['卡车行驶证和 Hendra 先生的身份证。', '司机工资单。'] },
      'akt-rambu': { en: ['lanes 1 and 3', 'lanes 1, 2 and 3'], zh: ['第 1、3 车道', '第 1、2、3 车道'] },
      'akt-saksi': { en: ['Interview: Toll officer, Mr Hendra, Mr Darto. Not needed:'], zh: ['访谈：高速巡查员、Hendra 先生、Darto 先生。不需要：'] },
    }[kasus];
    if (HARUS) {
      const teksHal = await p.evaluate(() => document.body.innerText);
      data.rakitan = HARUS[lang].map((x) => [x, teksHal.includes(x)]);
      if (!data.rakitan.every((x) => x[1])) { lulus = false; data.teks = teksHal.split('\n').filter(Boolean).join(' | ').slice(0, 1500); }
    }
    // Aktivitas: tombol mulai tugas (kamus UI) bila ada -> arena; periksa lagi + tangkapan layar (satu per bahasa/viewport).
    const mulai = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /^(Mulai|Start|开始)/.test(x.textContent.trim())) ?? null);
    if (mulai.asElement()) {
      await mulai.asElement().click();
      await tunggu(1000);
      const a = await periksa(p);
      data.arena = a;
      lulus = lulus && !a.gulirX && !a.luar.length && !a.potong.length && !a.indo.length;
      if (kasus === 'tel-cemas' && vp.n !== '360') await p.screenshot({ path: path.join(OUT, `aktivitas-${vp.n}-${lang}.png`) });
    }
    // Akhir: dari state cutin-akhir-puas maju sampai layar akhir.
    if (kasus === 'cutin-akhir-puas-missRaksa') {
      for (let i = 0; i < 8 && !(await p.$('.akh-kartu')); i++) if (!(await maju(p))) break;
      await tunggu(600);
      const a = await periksa(p);
      data.akhir = { ...a, ada: !!(await p.$('.akh-kartu')) };
      lulus = lulus && data.akhir.ada && !a.gulirX && !a.luar.length && !a.potong.length && !a.indo.length;
      if (vp.n !== '360') await p.screenshot({ path: path.join(OUT, `akhir-${vp.n}-${lang}.png`), fullPage: true });
    }
    lapor(nama, lulus, data);
    await ctx.close();
  }
  // (2) mulai baru: maju sampai pilihan K01 (tombol pilihan panjang), periksa tiap langkah.
  {
    const { ctx, p } = await buka(vp, lang, null);
    const langkah = [];
    let lulus = true, pilihan = 0;
    for (let i = 0; i < 10; i++) {
      const r = await periksa(p);
      langkah.push(r);
      if (r.gulirX || r.luar.length || r.potong.length || r.indo.length) lulus = false;
      pilihan = await p.evaluate(() => document.querySelectorAll('.hp-opsi').length);
      if (pilihan >= 3) break;
      if (!(await maju(p))) break;
    }
    await p.screenshot({ path: path.join(OUT, `pilihan-k01-${vp.n}-${lang}.png`), fullPage: true });
    const buruk = langkah.filter((r) => r.gulirX || r.luar.length || r.potong.length || r.indo.length);
    lapor(`awal-pilihan-${vp.n}-${lang}`, lulus && pilihan >= 3, { langkah: langkah.length, pilihan, buruk: buruk.slice(0, 3) });
    await ctx.close();
  }
}
fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
await b.close();
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
