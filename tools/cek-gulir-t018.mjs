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
 *  7. lembar    : (Tahap 1b, D-128) setiap keputusan obrolan x id/en/zh x 390x645, 360x640, 390x844: lembar balasan di dalam
 *                 visualViewport, semua pilihan terlihat tanpa menggulir (360x640: fallback daftar menggulir dicatat), label kirim
 *                 berubah, tab Catatan membalik lembar, Esc menutup + pilihan diingat, angka memilih, Enter mengirim
 *  8. desktop 1280: BUKAN cangkang (halaman menggulir seperti semula). Episode 1: tidak punya layar obrolan (pemain standar),
 *     dicatat + tangkapan layar saja.
 *
 *   UI_BASE=http://127.0.0.1:4001 node tools/cek-gulir-t018.mjs [--tanpa-webkit] [--ukur folder]   (exit 1 bila ada yang gagal)
 *   --tanpa-tahap2 = hanya keluarga obrolan (Tahap 1 / 1b). Keluarga adegan, aktivitas dan layar akhir (Tahap 2) ada di
 *   tools/cek-layar-t018.mjs dan ikut dijalankan dari sini.
 *   --keluarga obrolan,adegan,aktivitas,akhir   hanya keluarga itu (bawaan: semua). obrolan = alat ini; yang lain = cek-layar-t018.mjs.
 *   --vp 360x740,390x844                         (keluarga Tahap 2) hanya ukuran itu, untuk kedua mesin.
 *   --batas-menit N                              penjaga seluruh proses (bawaan 45): browser dimatikan, keluar kode 2.
 *   Tiap kasus berbatas waktu (obrolan 120 d, Tahap 2 150 d): yang macet dilaporkan FAIL "batas waktu ..." lalu lanjut.
 *   Satu browser pada satu waktu, ditutup tiap ganti ukuran layar. Pembantu bersama: tools/t018-umum.mjs (lihat catatan siklus di sana).
 *   --ukur = hanya mengukur + tangkapan layar (untuk "sebelum"), tanpa menilai.
 * Butuh: npm install --no-save puppeteer-core@24 playwright-core@1.65.1 (SATU perintah: npm membuang paket --no-save lain).
 * Dipakai juga oleh tools/cek-piksel-t013.mjs (cekGulirRingkas, Chromium).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BatasWaktu, PerambanPerUkuran, argumen, bukaGulir, denganBatas, luncur, pasangPenjaga, siap, tunggu } from './t018-umum.mjs';
// Diekspor ulang untuk pemakai lama (cek-piksel-t013.mjs).
export { bukaGulir, luncur, siap };

const ROOT = path.resolve(import.meta.dirname, '..');
export const VP_GULIR = [{ n: '360', w: 360, h: 740, dpr: 2 }, { n: '390', w: 390, h: 844, dpr: 3 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
const PIL = { id: 'Pesan baru ↓', en: 'New message ↓', zh: '新消息 ↓' };
export const stateGulir = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-018/states.json'), 'utf8'));

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
export const VP_LEMBAR = [{ n: '390x645', w: 390, h: 645, dpr: 3 }, { n: '360x640', w: 360, h: 640, dpr: 2 }, { n: '390x844', w: 390, h: 844, dpr: 3 }, { n: '360x740', w: 360, h: 740, dpr: 2 }];
const LABEL = {
  id: { pilih: 'Pilih 1 balasan', kirim: (n) => `Kirim balasan ${n}`, kembali: 'Kembali ke balasan' },
  en: { pilih: 'Choose 1 reply', kirim: (n) => `Send reply ${n}`, kembali: 'Back to replies' },
  zh: { pilih: '请选 1 条回复', kirim: (n) => `发送回复 ${n}`, kembali: '返回回复' },
};
/** Ukuran lembar balasan (T-018 Tahap 1b, D-128) saat ini; null = lembar tidak terbuka. */
export const ukurLembar = (p) => p.evaluate(() => {
  const vv = window.visualViewport; const se = document.scrollingElement;
  const L = document.querySelector('[data-lembar]'); if (!L) return null;
  const k = (el) => el?.getBoundingClientRect() ?? null;
  const dalam = (r) => !!r && r.left >= -0.5 && r.top >= -0.5 && r.right <= vv.width + 0.5 && r.bottom <= vv.height + 0.5;
  const r = k(L); const badan = L.querySelector('[data-gulir-lembar]'); const br = k(badan);
  const tab = L.querySelector('[data-catatan]'); const tombol = L.querySelector('[data-kirim], [data-kembali-balasan]'); const tr = k(tombol);
  const opsi = [...L.querySelectorAll('.hp-opsi')];
  const g = document.querySelector('.hp-gulir'); const gr = k(g);
  const akhir = [...g.querySelectorAll('[data-pesan]')].at(-1);
  window.scrollTo(0, 99999); const gulirHalaman = Math.round(window.scrollY); window.scrollTo(0, 0);
  return {
    tampil: L.getAttribute('data-tampil'), tinggi: Math.round(r.height), atas: Math.round(r.top), dalamVV: dalam(r) && (!tab || dalam(k(tab))),
    fallback: badan.scrollHeight > badan.clientHeight + 1, badan: [badan.clientHeight, badan.scrollHeight],
    opsi: opsi.length, opsiTerlihat: opsi.every((x) => { const o = k(x); return o.top >= br.top - 0.5 && o.bottom <= br.bottom + 0.5 && dalam(o); }),
    dipilih: opsi.findIndex((x) => x.getAttribute('aria-checked') === 'true') + 1,
    tanyaTerlihat: dalam(k(L.querySelector('.hp-tanya'))), tombol: tombol?.textContent.replace(/[→←]/g, '').trim() ?? null, tombolMati: !!tombol?.disabled, tombolDalam: dalam(tr), tombolAtas: tr ? Math.round(tr.top * 10) / 10 : null, tombolTinggi: tr ? Math.round(tr.height) : null,
    tabUtuh: tab ? k(tab).top >= k(document.querySelector('.hp-obrolan-kepala')).bottom - 0.5 && dalam(k(tab)) : null,
    // QA B-01: tab bisa diketuk = elemen di titik tengahnya adalah tab itu sendiri (tidak tertutup kepala obrolan / pesan).
    tabBisaDiketuk: tab ? (() => { const t = k(tab); const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return !!e && (e === tab || tab.contains(e)); })() : null, lebar: Math.round(r.width), lebarLayar: window.innerWidth,
    adaCatatan: !!tab, catatanDibaca: tab ? tab.hasAttribute('data-dibaca') : null, nota: !!L.querySelector('.hp-nota'),
    kepalaObrolan: Math.round(k(document.querySelector('.hp-obrolan-kepala')).height), potretKepala: !!document.querySelector('.hp-obrolan-kepala .hp-potret')?.getBoundingClientRect().width,
    sisaObrolan: Math.round(gr.height), ujungPesanTerlihat: akhir ? k(akhir).bottom <= gr.bottom + 1 : true,
    petunjukSuara: !!document.querySelector('[data-petunjuk-suara]'), halaman: se.scrollHeight, layar: window.innerHeight, gulirHalaman,
    fokusDiLembar: L.contains(document.activeElement),
  };
});
/**
 * 7 (Tahap 1b): (Mulai percakapan) -> Balas -> LEMBAR: di dalam visualViewport, pertanyaan + semua pilihan + tombol terlihat tanpa
 * menggulir (atau hanya daftar yang menggulir = fallback, dicatat), label "Pilih 1 balasan" -> "Kirim balasan N" tanpa tombol
 * melompat, tab Catatan membalik lembar & "Kembali ke balasan", Esc menutup dan pilihan diingat, halaman tidak menggulir.
 * `bolehFallback` = ukuran di luar sasaran. `kirim` = kirim lalu periksa penggulir mengikuti. `foto(tahap)` = jalur PNG atau null.
 */
export async function cekLembar(p, lang, { bolehFallback = false, kirim = false, foto = () => null, pilih = 3 } = {}) {
  await siap(p);
  const sebab = []; const T = LABEL[lang];
  const potret = async (tahap) => { const f = foto(tahap); if (f) { await tunggu(250); await p.screenshot({ path: f }); } };
  if (await p.evaluate(() => !!document.querySelector('[data-mulai-percakapan]'))) { await klik(p, '[data-mulai-percakapan]'); await tunggu(600); await siap(p); }
  if (!await klik(p, '[data-balas]')) return { lulus: false, data: { sebab: ['tanpa tombol Balas'] } };
  await tunggu(550);
  const a = await ukurLembar(p);
  if (!a) return { lulus: false, data: { sebab: ['lembar tidak terbuka'] } };
  await potret('buka');
  const umum = (d, nama) => {
    if (!d) { sebab.push(nama + ': lembar hilang'); return; }
    if (!d.dalamVV) sebab.push(nama + ': lembar di luar visualViewport');
    if (d.halaman > d.layar + 0.5 || d.gulirHalaman !== 0) sebab.push(nama + ': halaman menggulir');
    if (!d.tanyaTerlihat || !d.tombolDalam) sebab.push(nama + ': pertanyaan/tombol tidak terlihat');
    if (d.fallback && !bolehFallback) sebab.push(nama + ': daftar harus digulir');
    if (d.kepalaObrolan !== 44) sebab.push(nama + ': kepala obrolan ' + d.kepalaObrolan + ' (harus 44)');
    if (d.petunjukSuara) sebab.push(nama + ': petunjuk suara tampil');
    // D-139: tab Catatan utuh di bawah kepala obrolan (>= 28 px jendela pesan); D-140: lembar selebar layar.
    if (d.adaCatatan && (!d.tabUtuh || !d.tabBisaDiketuk || d.sisaObrolan < 28)) sebab.push(nama + ': tab Catatan tertutup kepala obrolan (jendela pesan ' + d.sisaObrolan + ' px)');
    if (d.lebar !== d.lebarLayar) sebab.push(nama + ': lembar ' + d.lebar + ' px, layar ' + d.lebarLayar);
  };
  umum(a, 'buka');
  if (a.opsi < 2 || (!a.fallback && !a.opsiTerlihat)) sebab.push('buka: pilihan tidak semuanya terlihat');
  if (a.tombol !== T.pilih || !a.tombolMati) sebab.push('buka: label "' + a.tombol + '"');
  if (a.tombolTinggi !== 48) sebab.push('tombol kirim ' + a.tombolTinggi + ' px');
  if (!a.fokusDiLembar) sebab.push('fokus tidak pindah ke lembar');
  if (a.fallback) {
    const ujung = await p.evaluate(() => { const b = document.querySelector('[data-gulir-lembar]'); b.scrollTop = b.scrollHeight; const o = [...b.querySelectorAll('.hp-opsi')].at(-1).getBoundingClientRect(); return o.bottom <= b.getBoundingClientRect().bottom + 1; });
    if (!ujung) sebab.push('fallback: pilihan terakhir tidak tercapai');
  }
  // pilih
  const n = Math.min(pilih, a.opsi);
  await p.evaluate((n) => document.querySelectorAll('[data-lembar] .hp-opsi')[n - 1].click(), n);
  await tunggu(300);
  const b = await ukurLembar(p);
  await potret('pilih');
  umum(b, 'pilih');
  if (b && (b.tombol !== T.kirim(n) || b.tombolMati || b.dipilih !== n)) sebab.push('pilih: label "' + b.tombol + '"');
  if (b && (Math.abs(b.tombolAtas - a.tombolAtas) > 0.5 || b.tinggi !== a.tinggi)) sebab.push('pilih: tombol/lembar melompat');
  // catatan
  let c = null;
  if (a.adaCatatan) {
    if (a.catatanDibaca) sebab.push('catatan: titik belum-dibaca hilang sebelum dibuka');
    await klik(p, '[data-catatan]'); await tunggu(350);
    c = await ukurLembar(p);
    await potret('nota');
    if (c) { const fb = c.fallback; c.fallback = false; umum(c, 'nota'); c.fallback = fb; }
    if (!c || c.tampil !== 'nota' || !c.nota || c.tombol !== T.kembali || !c.catatanDibaca) sebab.push('nota: tidak berbalik ke catatan');
    await klik(p, '[data-kembali-balasan]'); await tunggu(300);
    const d = await ukurLembar(p);
    if (!d || d.tampil !== 'balas' || d.dipilih !== n || d.tombol !== T.kirim(n)) sebab.push('nota: kembali ke balasan kehilangan pilihan');
  }
  // Esc menutup; buka lagi = pilihan diingat
  await p.evaluate(() => document.querySelector('[data-lembar] [data-hp-fokus]')?.focus());
  await p.keyboard.press('Escape'); await tunggu(350);
  const tutup = await p.evaluate(() => ({ lembar: !!document.querySelector('[data-lembar]'), balas: !!document.querySelector('[data-balas]'), fokus: document.activeElement?.hasAttribute('data-balas') ?? false, kepala: Math.round(document.querySelector('.hp-obrolan-kepala').getBoundingClientRect().height) }));
  if (tutup.lembar || !tutup.balas || !tutup.fokus) sebab.push('Esc tidak menutup lembar / fokus tidak kembali ke Balas');
  await klik(p, '[data-balas]'); await tunggu(450);
  const e = await ukurLembar(p);
  if (!e || e.dipilih !== n) sebab.push('pilihan tidak diingat sesudah lembar ditutup');
  // angka + Enter (papan ketik): angka 1 memilih baris 1
  await p.keyboard.press('1'); await tunggu(200);
  const f = await ukurLembar(p);
  if (!f || f.dipilih !== 1 || f.tombol !== T.kirim(1)) sebab.push('tombol angka 1 tidak memilih');
  let sesudah = null;
  if (kirim) {
    const lama = await daftarId(p);
    await p.keyboard.press('Enter');
    await tunggu(2200);
    sesudah = await posisiBaru(p, lama);
    if (!sesudah) sesudah = { pindahTampilan: true };
    else if (!mengikuti(sesudah)) sebab.push('Enter tidak mengirim / penggulir tidak mengikuti');
  }
  return { lulus: sebab.length === 0, data: { sebab, tinggi: a.tinggi, sisaObrolan: a.sisaObrolan, ujungPesanTerlihat: a.ujungPesanTerlihat, fallback: a.fallback, badan: a.badan, opsi: a.opsi, potretKepala: a.potretKepala, nota: c ? { tinggi: c.tinggi, fallback: c.fallback } : null, kepalaTutup: tutup.kepala, sesudah } };
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
  const OUT = path.resolve(UKUR ? process.argv[iUkur + 1] : path.join(ROOT, 'team/evidence/T-018/stage1b'));
  fs.mkdirSync(OUT, { recursive: true });
  const S = stateGulir();
  const hasil = []; let gagal = 0;
  const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus && !UKUR) gagal++; console.log(lulus ? 'PASS' : UKUR ? 'UKUR' : 'FAIL', nama, JSON.stringify(data)); };
  const DESKTOP = { n: '1280', w: 1280, h: 800, dpr: 1 };
  const mesinDaftar = process.argv.includes('--tanpa-webkit') || UKUR ? ['chromium'] : ['chromium', 'webkit'];
  const KELUARGA = new Set((argumen('--keluarga', 'obrolan,adegan,aktivitas,akhir')).split(',').map((x) => x.trim()).filter(Boolean));
  const BATAS_KASUS = 120000;
  let peramban = null;
  const tulisHasil = () => fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  const batalPenjaga = pasangPenjaga(Number(argumen('--batas-menit', '45')), () => { lapor('penjaga', false, { sebab: 'seluruh proses melewati batas waktu', selesai: hasil.length }); tulisHasil(); peramban?.bunuh(); });
  for (const mesin of mesinDaftar) {
    peramban = new PerambanPerUkuran(mesin);
    try { await peramban.untuk(VP_GULIR[0]); } catch (e) { lapor(`${mesin}-luncur`, false, { sebab: String(e?.message ?? e).slice(0, 200), petunjuk: 'npm install --no-save puppeteer-core@24 playwright-core@1.65.1' }); continue; }
    const wk = mesin === 'webkit';
    // Satu kasus: browser untuk ukuran itu (diluncurkan ulang bila ukuran berganti), batas waktu per kasus, halaman selalu ditutup.
    const jalan = async (nama, vp, lang, state, fn, foto, url) => {
      let h = null;
      try {
        await denganBatas((async () => {
          const b = await peramban.untuk(vp);
          h = await bukaGulir(mesin, b, BASE, vp, lang, state, url);
          const r = await fn(h.p);
          if (foto) await h.p.screenshot({ path: path.join(OUT, `${nama}.png`) });
          lapor(nama, r.lulus && h.galat.length === 0, { ...r.data, ...(h.galat.length ? { galat: h.galat } : {}) });
        })(), BATAS_KASUS, nama);
      } catch (e) {
        lapor(nama, false, { sebab: (e instanceof BatasWaktu ? '' : 'galat alat: ') + String(e?.message ?? e).slice(0, 200) });
        if (e instanceof BatasWaktu) { peramban.bunuh(); h = null; } // browser yang macet tidak dipakai lagi
      }
      await h?.tutup();
    };
    if (KELUARGA.has('obrolan')) {
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
      // 5-6: perilaku penggulir.
      for (const vp of wk ? [VP_GULIR[1]] : VP_GULIR) {
        await jalan(`ikut-${vp.n}-id-${mesin}`, vp, 'id', S['obrolan-lanjut'].nilai, cekIkut, false);
        for (const lang of vp.n === '390' ? ['id', 'en', 'zh'] : ['id']) await jalan(`pil-${vp.n}-${lang}-${mesin}`, vp, lang, S['obrolan-lanjut'].nilai, (p) => cekPil(p, lang), vp.n === '390' && lang === 'id');
      }
      // 7 (Tahap 1b): lembar balasan, SETIAP keputusan obrolan x id/en/zh. Chromium: 390x645 (HP owner dengan bilah browser),
      // 360x640, 390x844; WebKit: 390x645 + 360x640. Sasaran tanpa menggulir: 390x645 dan 390x844; 360x640 = fallback dicatat.
      const FOTO = { 'k14-390x645-id': ['buka', 'pilih'], 'k06-390x645-id': ['nota'], 'k03-390x645-en': ['buka'], 'k13-390x645-zh': ['buka'], 'k01-360x640-id': ['buka'], 'k01-360x640-en': ['buka'] };
      for (const kasus of Object.keys(S).filter((k) => k.startsWith('balas-')).sort()) for (const lang of ['id', 'en', 'zh']) for (const vp of wk ? VP_LEMBAR.slice(0, 2) : VP_LEMBAR) {
        const node = kasus.slice(6); const kunci = `${node}-${vp.n}-${lang}`;
        await jalan(`lembar-${kunci}-${mesin}`, vp, lang, S[kasus].nilai, (p) => cekLembar(p, lang, {
          bolehFallback: vp.n === '360x640', kirim: lang === 'id' && vp.n === '390x645', pilih: node === 'k14' ? 5 : 3,
          foto: (tahap) => (FOTO[kunci]?.includes(tahap) ? path.join(OUT, `lembar-${kunci}-${tahap}-${mesin}.png`) : null),
        }), false);
      }
      // Desktop 1280: keputusan tetap blok lama (bukan lembar).
      if (!wk) await jalan(`balas-k14-1280-id-${mesin}`, DESKTOP, 'id', S['balas-k14'].nilai, async (p) => {
        await siap(p); await klik(p, '[data-balas]'); await tunggu(500);
        const d = await p.evaluate(() => ({ lembar: !!document.querySelector('[data-lembar]'), blokLama: !!document.querySelector('.hp-komposer .hp-pilih .cer-dok'), kirim: document.querySelector('[data-kirim]')?.textContent.trim() }));
        return { lulus: !d.lembar && d.blokLama, data: d };
      }, true);
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
    if (!wk) await jalan(`ep1-390-id-${mesin}`, VP_GULIR[1], 'id', null, async (p) => {
      await siap(p);
      const d = await p.evaluate(() => ({ hpLayar: !!document.querySelector('.hp-layar'), obrolan: !!document.querySelector('.hp-obrolan'), pemain: document.querySelector('.cer-layar')?.className ?? null, tinggiHalaman: document.scrollingElement.scrollHeight, tinggiLayar: window.innerHeight }));
      return { lulus: !d.obrolan && !d.hpLayar, data: { ...d, catatan: 'Episode 1 memakai pemain cerita standar: tidak ada layar obrolan (Tahap 2)' } };
    }, true, '/cerita/auto-1');
    } // akhir keluarga obrolan
    // Tahap 2 (D-132..D-134): keluarga adegan, aktivitas, layar akhir (tools/cek-layar-t018.mjs) -> team/evidence/T-018/stage2/.
    // import() dinamis aman sekarang: cek-layar TIDAK lagi mengimpor berkas ini (siklus + top-level await = macet; t018-umum.mjs).
    const keluarga2 = ['adegan', 'aktivitas', 'akhir'].filter((x) => KELUARGA.has(x));
    if (!UKUR && !process.argv.includes('--tanpa-tahap2') && keluarga2.length) {
      const { jalankanTahap2 } = await import('./cek-layar-t018.mjs');
      const OUT2 = path.join(ROOT, 'team/evidence/T-018/stage2'); fs.mkdirSync(OUT2, { recursive: true });
      await jalankanTahap2(mesin, peramban, BASE, lapor, OUT2, { keluarga: keluarga2, vp: argumen('--vp') });
    }
    await peramban.tutup();
  }
  batalPenjaga();
  tulisHasil();
  console.log(UKUR ? 'UKUR selesai' : gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(!UKUR && gagal ? 1 : 0);
}
