/**
 * T-024: KARTU AKHIR SATU LAYAR Episode 2 di cangkang HP (spec team/specs/2026-11-17-T-024-T-025.md + rev 1.1; angka = mock
 * Designer, team/DESIGN-REVIEW.md "T-024 - mock", D-226..D-235). Dipanggil oleh tools/cek-akhir-t019.mjs (bagian kartu) dan bisa
 * dijalankan sendiri:
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-kartu-t024.mjs [--tanpa-webkit | --hanya-webkit] [--bahasa=id,en,zh]
 *        [--akhir=puas,catatan,kurang] [--vp=390x645,360x640] [--ukur]            (exit 1 bila ada yang gagal)
 * State = team/evidence/T-013/states.json (mesin cerita asli); dari adegan akhir, Lanjut sampai kartu tampil.
 *
 * Per akhir (3) x bahasa (id, en, zh) x 390x645 dan 360x640, di Chromium dan WebKit:
 *  satu-layar : halaman TIDAK menggulir (tinggi & lebar halaman = layar), .hp-main dan kartu tidak menggulir (wilayah gulir DIUKUR,
 *               kepala Inggris 66 px: D-234), aturan pas tidak terpakai (data-pas "utuh", grafik 72 px), bilah aksi satu baris di dalam
 *               layar; tiap blok utuh di dalam kartu dengan tinggi mock (kepala 56 / 57, judul 25 / 50, sebab 40, grafik 72, legenda
 *               18, token 3 x 44, Pelajaran 63); 15 token = tombol >= 44 x 44 dengan nama "Keputusan n: judul, nilai" dalam
 *               bahasanya; label pita & nama grafik dalam bahasanya dan tidak tertimpa garis; tanpa kata Indonesia di en / zh.
 *  lembar     : ketuk token -> dialog modal (latar inert, satu kunci gulir, fokus di dalam, bilah aksi tertutup), isi rincian
 *               dalam bahasanya, teks melipat di dalam lembar (zh / en), hanya badan yang boleh menggulir; Berikutnya / Sebelumnya /
 *               panah keyboard; Escape, ketuk latar, tombol tutup: fokus kembali ke token; Pelajaran dan kalimat sebab membuka
 *               lembar yang sama dengan teks utuh; "Lihat perjalananku" tanpa kelompok kosong; baris Menu "Rentang suasana" dan
 *               "Catatan simulasi".
 *  + aturan pas (Chromium & WebKit, id, 360 lebar): layar dipendekkan 640 -> 560: tidak pernah menggulir, grafik menyusut dulu
 *    (72 -> 56), baru kalimat sebab hilang, baru legenda; token dan Pelajaran tidak pernah terpotong.
 *  + desktop 1280 x 800 (Chromium): bentuk lama tidak berubah (kartu + daftar 15 keputusan, tanpa strip token, tanpa baris Menu).
 *  + polish review Designer (D-245..D-247):
 *    D-245 layar tinggi 390x844 dan 360x740 (3 akhir x id / en / zh; WebKit: 390x844, akhir catatan): kartu melonggar selama
 *          muat, berurutan Pelajaran utuh -> kalimat sebab utuh -> grafik sampai 96 px; tidak ada yang menggulir; di 390x645 /
 *          360x640 TIDAK pernah melonggar (angka mock tetap); batasnya tinggi layar 700 px (699 tidak, 700 ya).
 *    D-246 dua baris Menu terlihat TANPA menggulir Menu, di atas pengaturan bahasa & suara.
 *    D-247 gambar token dan chip panah turun 2 px selama ditekan (gerak tidak dikurangi); tidak bergerak bila gerak dikurangi.
 * Tangkapan layar -> team/evidence/T-024/fullstack/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BatasWaktu, bukaGulir, denganBatas, luncur, pasangPenjaga, siap, tunggu } from './t018-umum.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
export const OUT_KARTU = path.join(ROOT, 'team/evidence/T-024/fullstack');
export const VP_KARTU = [{ n: '390x645', w: 390, h: 645, dpr: 2 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
/** D-245: layar tinggi tempat kartu melonggar (ukuran yang diukur Designer di review T-024). */
export const VP_LEGA = [{ n: '390x844', w: 390, h: 844, dpr: 2 }, { n: '360x740', w: 360, h: 740, dpr: 2 }];
const BATAS_KASUS = 120000;
/** Teks antarmuka yang diharapkan per bahasa (kamus ceritaAkhir / teks episode). */
const TEKS = {
  id: { aria: /^Keputusan (\d+): .+, (Tepat|Kurang tepat|Keliru)$/, nomor: (n) => `Keputusan ${n} dari 15`, sebelum: 'Sebelumnya', berikut: 'Berikutnya', lihat: 'Lihat perjalananku', pelajaran: 'Pelajaran', tutup: 'Tutup', menu: ['Rentang suasana', 'Catatan simulasi'], pita: ['Puas', 'Kecewa'], grafik: 'Status Pak Hendra', nilai: ['Tepat', 'Kurang tepat', 'Keliru'], rentang: '80+ Puas · 60+ Percaya · 40+ Tenang · 20+ Cemas · 0+ Kecewa' },
  en: { aria: /^Decision (\d+): .+, (Right call|Not quite|Mistake)$/, nomor: (n) => `Decision ${n} of 15`, sebelum: 'Previous', berikut: 'Next', lihat: 'See my journey', pelajaran: 'Takeaway', tutup: 'Close', menu: ['Mood ranges', 'Simulation note'], pita: ['Satisfied', 'Let down'], grafik: 'Status of Mr Hendra', nilai: ['Right call', 'Not quite', 'Mistake'], rentang: '80+ Satisfied · 60+ Trusting · 40+ Calm · 20+ Worried · 0+ Let down' },
  zh: { aria: /^决定 (\d+)：.+，(恰当|不够恰当|错误)$/, nomor: (n) => `第 ${n} 个决定，共 15 个`, sebelum: '上一个', berikut: '下一个', lihat: '查看我的历程', pelajaran: '要点', tutup: '关闭', menu: ['心情区间', '模拟说明'], pita: ['满意', '失望'], grafik: 'Hendra 先生 的状态', nilai: ['恰当', '不够恰当', '错误'], rentang: '80+ 满意 · 60+ 信任 · 40+ 平静 · 20+ 担心 · 0+ 失望' },
};
/** Kata fungsi Indonesia (sama dengan tools/cek-bahasa-t014.mjs): tidak boleh ada di teks en / zh. */
const KATA_ID = /(^|[^A-Za-z])(yang|dan|atau|ke|di|dari|hari|minggu|ada|ini|itu|juga|tidak|untuk|dengan|sudah|belum|saya|kamu|truk|Pak|Bapak|klaim|bengkel|lajur|rambu|supir|berkas|surat)(?![A-Za-z])/;

const klik = (p, sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; }, sel);
/** Ketuk sungguhan (uji-kena penunjuk) di tengah elemen `sel`; false bila elemen tidak ada. */
async function ketuk(p, sel) {
  const k = await p.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; }, sel);
  if (!k) return false;
  await p.mouse.click(k[0], k[1]);
  return true;
}
const aturUkuran = (mesin, p, vp) => (mesin === 'chromium' ? p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true }) : p.setViewportSize({ width: vp.w, height: vp.h }));

/** Setelan gerak sistem yang dilaporkan browser ('reduce' / 'no-preference'); eksplisit, supaya tidak ikut setelan Windows PC ini. */
/** Sesudah diganti, tunggu animasi yang ikut menyala (animasi masuk kartu) selesai: posisi blok baru diam sesudah itu. */
async function aturGerak(mesin, p, nilai) {
  await (mesin === 'chromium' ? p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: nilai }]) : p.emulateMedia({ reducedMotion: nilai }));
  await tunggu(200);
  await Promise.race([p.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))).then(() => true)), tunggu(3000)]).catch(() => null);
  await tunggu(150);
}

/** Dari adegan akhir (state tersimpan), Lanjut sampai kartu akhir tampil. */
async function keKartu(p) {
  await siap(p);
  for (let i = 0; i < 12; i++) {
    const t = await p.evaluate(() => document.querySelector('.hp-layar')?.getAttribute('data-tampilan') ?? (document.querySelector('.akh-kartu') ? 'akhir' : null));
    if (t === 'akhir') break;
    await klik(p, '.hp-vn-aksi [data-lanjut], .hp-komposer [data-lanjut]'); await tunggu(700);
  }
  await p.evaluate(() => document.fonts?.ready.then(() => true)).catch(() => null);
  await tunggu(500);
  return p.evaluate(() => !!document.querySelector('.akh-kartu'));
}

/** Ukuran kartu akhir satu layar (semua angka px CSS). */
export const ukurKartu = (p) => p.evaluate(() => {
  const vv = window.visualViewport; const se = document.scrollingElement;
  const layar = document.querySelector('.hp-layar'); const m = document.querySelector('.hp-main'); const kartu = document.querySelector('.akh-kartu');
  if (!layar || !m || !kartu) return null;
  const k = (el) => el?.getBoundingClientRect() ?? null;
  const b1 = (x) => Math.round(x * 10) / 10;
  const kr = k(kartu); const gaya = getComputedStyle(kartu);
  const batasBawah = kr.bottom - parseFloat(gaya.paddingBottom); const batasAtas = kr.top;
  const blok = (sel) => { const el = kartu.querySelector(sel); const r = k(el); if (!el || !r || r.height === 0) return null; return { t: b1(r.height), atas: b1(r.top - batasAtas), dalam: r.top >= batasAtas - 0.5 && r.bottom <= batasBawah + 0.5 && r.left >= -0.5 && r.right <= vv.width + 0.5 }; };
  window.scrollTo(0, 99999); const gulirHalaman = Math.round(window.scrollY); window.scrollTo(0, 0);
  const anak = [...kartu.children].filter((c) => !c.classList.contains('sr-only')).map((c) => k(c)).filter((r) => r.height > 0);
  const bawahIsi = Math.max(...anak.map((r) => r.bottom));
  const token = [...kartu.querySelectorAll('.akh-token-tombol')].map((el) => { const r = k(el); return { id: el.getAttribute('data-token'), nilai: el.getAttribute('data-nilai'), w: b1(r.width), h: b1(r.height), dalam: r.top >= batasAtas - 0.5 && r.bottom <= batasBawah + 0.5 && r.left >= -0.5 && r.right <= vv.width + 0.5, aria: el.getAttribute('aria-label') ?? '', teks: el.textContent.trim() }; });
  const aksi = document.querySelector('.hp-akhir-aksi .akh-aksi'); const ar = k(aksi);
  const judul = kartu.querySelector('.akh-judul'); const sebab = kartu.querySelector('.akh-sebab');
  const jalur = k(kartu.querySelector('.akh-grafik-jalur')); const talang = k(kartu.querySelector('.akh-grafik-talang')); const grafik = k(kartu.querySelector('.akh-grafik-ringkas'));
  const titikAkhir = k(kartu.querySelector('.akh-grafik-titik-akhir .akh-grafik-titik-luar')); const nama = k(kartu.querySelector('.akh-grafik-nama'));
  const kepala = k(document.querySelector('.hp-kepala')); const bilah = k(document.querySelector('.hp-akhir-aksi'));
  return {
    satuLayar: kartu.hasAttribute('data-satu-layar'), tanda: layar.hasAttribute('data-akhir-satu'), kunci: layar.hasAttribute('data-kunci'), pas: kartu.getAttribute('data-pas'),
    lega: kartu.getAttribute('data-lega'), pelajaranTerpotong: (() => { const el = kartu.querySelector('.akh-gelembung-teks'); return el ? el.scrollHeight > el.clientHeight + 1 : null; })(),
    halaman: [se.scrollHeight, window.innerHeight], lebarHalaman: [se.scrollWidth, window.innerWidth], gulirHalaman,
    main: [m.clientHeight, m.scrollHeight], kartu: [kartu.clientHeight, kartu.scrollHeight], luang: b1(batasBawah - bawahIsi),
    kepalaCerita: kepala ? b1(kepala.height) : null, bilah: bilah ? b1(bilah.height) : null, wilayah: b1(k(m).height),
    aksi: ar ? { t: b1(ar.height), dalam: ar.top >= -0.5 && ar.bottom <= vv.height + 0.5 && ar.left >= -0.5 && ar.right <= vv.width + 0.5, isi: [...aksi.children].map((x) => x.textContent.trim()) } : null,
    blok: { kepala: blok('.akh-kepala'), judul: blok('.akh-judul'), sebab: blok('.akh-sebab-tombol'), grafik: blok('.akh-grafik-ringkas'), legenda: blok('.akh-token-legenda'), token: blok('.akh-token-daftar'), pelajaran: blok('[data-ukur="akhir-pelajaran"]') },
    judulTerpotong: judul ? judul.scrollHeight > judul.clientHeight + 1 : null, sebabTerpotong: sebab ? sebab.scrollHeight > sebab.clientHeight + 1 : null,
    perasaanTerpotong: (() => { const el = kartu.querySelector('.akh-perasaan'); return el ? el.scrollWidth > el.clientWidth + 1 : null; })(),
    token, legenda: [...kartu.querySelectorAll('.akh-token-legenda li')].map((x) => x.textContent.trim()), legendaLebar: b1([...kartu.querySelectorAll('.akh-token-legenda li')].reduce((n, x) => n + k(x).width, 0)),
    pita: [...kartu.querySelectorAll('.akh-grafik-talang > span')].map((x) => x.textContent.trim()), namaGrafik: kartu.querySelector('.akh-grafik-nama')?.textContent.trim() ?? null,
    grafik: grafik && jalur && talang ? { talang: b1(talang.width), jalurKanan: b1(jalur.right - grafik.left), talangKiri: b1(talang.left - grafik.left), titikAkhirKanan: titikAkhir ? b1(titikAkhir.right - grafik.left) : null, titik: kartu.querySelectorAll('.akh-grafik-titik').length, namaLebar: nama ? b1(nama.width) : null } : null,
    teks: kartu.innerText, namaGrafikAria: kartu.querySelector('.akh-grafik-ringkas figcaption')?.textContent ?? null,
    fokus: document.activeElement?.id || document.activeElement?.tagName || null,
  };
});

/** Nilai kartu satu layar; mengembalikan daftar sebab gagal. `harap` = { bahasa } (teks), `longgar` = aturan pas boleh terpakai. */
export function nilaiKartu(d, bahasa, { longgar = false, tinggi = false } = {}) {
  const s = []; const T = TEKS[bahasa];
  if (!d) return ['kartu akhir tidak ada'];
  if (!d.satuLayar || !d.tanda || !d.kunci) return ['bukan bentuk satu layar (data-satu-layar / data-akhir-satu / data-kunci): ' + JSON.stringify([d.satuLayar, d.tanda, d.kunci])];
  if (d.halaman[0] > d.halaman[1] + 0.5 || d.gulirHalaman !== 0) s.push(`halaman menggulir: ${d.halaman[0]} > ${d.halaman[1]}`);
  if (d.lebarHalaman[0] > d.lebarHalaman[1] + 0.5) s.push('luapan mendatar');
  if (d.main[1] > d.main[0]) s.push(`.hp-main menggulir ${d.main[1] - d.main[0]} px (wilayah ${d.main[0]})`);
  if (d.kartu[1] > d.kartu[0] || d.luang < -0.5) s.push(`isi kartu meluap: ${d.kartu[1]} > ${d.kartu[0]}, luang ${d.luang}`);
  if (!d.aksi || !d.aksi.dalam || d.aksi.t > 60 || d.aksi.isi.length !== 2) s.push('bilah aksi tidak satu baris / di luar layar: ' + JSON.stringify(d.aksi));
  if (Math.abs(d.bilah - 69) > 1) s.push(`bilah aksi ${d.bilah} px, seharusnya 69`);
  const B = d.blok;
  if (tinggi) {
    // D-245: layar tinggi. Selama muat: Pelajaran utuh, kalimat sebab utuh, grafik sampai 96 px (urutan itu; awalan saja).
    if (d.pas !== 'utuh') s.push(`aturan pas terpakai di layar tinggi (${d.pas})`);
    const lega = (d.lega ?? '').split(' ').filter(Boolean);
    const URUT = ['pelajaran', 'sebab', 'grafik'];
    if (lega.join(' ') !== URUT.slice(0, lega.length).join(' ')) s.push('data-lega bukan awalan urutan melonggar: ' + JSON.stringify(d.lega));
    if (!lega.includes('pelajaran')) s.push('Pelajaran tidak melonggar di layar tinggi (data-lega ' + JSON.stringify(d.lega) + ', luang ' + d.luang + ')');
    if (lega.includes('pelajaran') && d.pelajaranTerpotong) s.push('Pelajaran masih terpotong');
    if (lega.includes('sebab') && d.sebabTerpotong) s.push('kalimat sebab masih terpotong');
    if (!lega.includes('sebab') && !d.sebabTerpotong && lega.includes('pelajaran')) { /* kalimat pendek: utuh tanpa melonggar */ }
    for (const nama of ['kepala', 'judul', 'sebab', 'grafik', 'legenda', 'token', 'pelajaran']) if (!B[nama] || !B[nama].dalam) s.push(`${nama} tidak utuh di dalam kartu`);
    if (B.grafik && (B.grafik.t < 71.5 || B.grafik.t > 96.5)) s.push(`grafik ${B.grafik.t} px di luar 72..96`);
    // Grafik mengambil sisa ruang: 96 px, atau tidak ada ruang tersisa.
    if (lega.includes('grafik') && B.grafik && B.grafik.t < 95.5 && d.luang > 1) s.push(`grafik ${B.grafik.t} px padahal masih ${d.luang} px kosong`);
    if (!lega.includes('grafik') && B.grafik && Math.abs(B.grafik.t - 72) > 1) s.push(`grafik ${B.grafik.t} px tanpa langkah grafik`);
    if (B.token && Math.abs(B.token.t - 132) > 1) s.push(`token ${B.token.t} px, seharusnya 132`);
    if (B.legenda && Math.abs(B.legenda.t - 18) > 1) s.push(`legenda ${B.legenda.t} px, seharusnya 18`);
  } else if (!longgar) {
    if (d.pas !== 'utuh') s.push(`aturan pas terpakai (${d.pas}); mock: tidak pernah di ukuran ini`);
    if (d.lega) s.push(`kartu melonggar (${d.lega}) di ukuran mock; D-245: potongan dua baris tetap di 645 / 640`);
    const sama = (nama, boleh) => { const b = B[nama]; if (!b || !boleh.some((x) => Math.abs(b.t - x) <= 1)) s.push(`${nama} ${b ? b.t : 'tidak ada'} px, mock ${boleh.join(' / ')}`); else if (!b.dalam) s.push(`${nama} tidak utuh di dalam kartu`); };
    sama('kepala', [56, 57]); sama('judul', [25, 50]); sama('sebab', [40]); sama('grafik', [72]); sama('legenda', [18]); sama('token', [132]); sama('pelajaran', [63]);
  } else {
    for (const nama of ['kepala', 'judul', 'grafik', 'token', 'pelajaran']) if (!B[nama] || !B[nama].dalam) s.push(`${nama} tidak utuh di dalam kartu`);
    if (B.grafik && (B.grafik.t < 55.5 || B.grafik.t > 72.5)) s.push(`grafik ${B.grafik.t} px di luar 56..72`);
    if (B.token && Math.abs(B.token.t - 132) > 1) s.push(`token ${B.token.t} px, seharusnya 132`);
  }
  if (d.judulTerpotong) s.push('judul terpotong (lebih dari 2 baris)');
  if (d.perasaanTerpotong) s.push('label perasaan terpotong');
  if (d.token.length !== 15) s.push(`token ${d.token.length}, seharusnya 15`);
  const kecil = d.token.filter((x) => x.w < 44 || x.h < 44 || !x.dalam);
  if (kecil.length) s.push('token < 44 px / di luar kartu: ' + kecil.map((x) => `${x.id} ${x.w}x${x.h}`).join(' '));
  const ariaSalah = d.token.filter((x, i) => { const m = T.aria.exec(x.aria); return !m || Number(m[1]) !== i + 1 || x.teks !== String(i + 1); });
  if (ariaSalah.length) s.push('nama token salah: ' + ariaSalah.slice(0, 3).map((x) => `${x.id} "${x.aria}"`).join(' | '));
  if (d.token.some((x) => !['tepat', 'kurang', 'keliru'].includes(x.nilai))) s.push('token tanpa klasifikasi: ' + d.token.filter((x) => !['tepat', 'kurang', 'keliru'].includes(x.nilai)).map((x) => x.id).join(' '));
  if (!longgar || B.legenda) {
    const hit = { tepat: 0, kurang: 0, keliru: 0 }; for (const x of d.token) if (x.nilai in hit) hit[x.nilai]++;
    const harap = [`${hit.tepat}${T.nilai[0]}`, `${hit.kurang}${T.nilai[1]}`, `${hit.keliru}${T.nilai[2]}`];
    if (JSON.stringify(d.legenda.map((x) => x.replace(/\s+/g, ''))) !== JSON.stringify(harap.map((x) => x.replace(/\s+/g, '')))) s.push('legenda ' + JSON.stringify(d.legenda) + ', seharusnya ' + JSON.stringify(harap));
  }
  if (JSON.stringify(d.pita) !== JSON.stringify(T.pita)) s.push('label pita ' + JSON.stringify(d.pita) + ', seharusnya ' + JSON.stringify(T.pita));
  if (d.namaGrafik !== T.grafik) s.push(`nama grafik "${d.namaGrafik}", seharusnya "${T.grafik}"`);
  if (!d.grafik || d.grafik.jalurKanan > d.grafik.talangKiri + 0.5) s.push('garis grafik masuk ke talang label: ' + JSON.stringify(d.grafik));
  else if (d.grafik.titik < 16) s.push('titik grafik ' + d.grafik.titik + ' < 16');
  if (bahasa !== 'id') {
    const indo = [...d.teks.split('\n'), ...d.token.map((x) => x.aria), d.namaGrafikAria ?? ''].map((x) => x.trim()).filter((x) => x && KATA_ID.test(x));
    if (indo.length) s.push('kata Indonesia di ' + bahasa + ': ' + indo.slice(0, 3).join(' | '));
  }
  return s;
}

/** Keadaan lembar yang sedang terbuka (null bila tidak ada). */
const ukurLembar = (p) => p.evaluate(() => {
  const l = document.querySelector('.akh-lembar'); if (!l) return null;
  const vv = window.visualViewport; const r = l.getBoundingClientRect(); const bd = l.querySelector('.hp-lembar-badan');
  const b1 = (x) => Math.round(x * 10) / 10;
  const akt = document.activeElement;
  // (potret piksel = SVG beratlas yang dipotong bingkainya, .sr-only = kotak 1 px: bukan teks yang keluar lembar)
  const teksHtml = (el) => el instanceof HTMLElement && !el.closest('.cer-potret, .sr-only');
  const lebar = [...l.querySelectorAll('*')].filter((el) => { if (!teksHtml(el)) return false; const q = el.getBoundingClientRect(); return q.width > 0 && (q.right > r.right + 0.5 || q.left < r.left - 0.5); }).map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
  const luapX = [l, bd, ...l.querySelectorAll('p, h2, h3, small, button, span')].filter((el) => teksHtml(el) && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline').map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
  const bilah = document.querySelector('.hp-akhir-aksi [data-ukur="aksi-utama"]')?.getBoundingClientRect();
  const diAtasBilah = bilah ? document.elementFromPoint(bilah.left + bilah.width / 2, bilah.top + bilah.height / 2) : null;
  const meluapLain = [...l.querySelectorAll('*')].filter((el) => el !== bd && /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).length;
  const a0 = bd.scrollTop; bd.scrollTop = bd.scrollHeight; const sisa = Math.round(bd.scrollHeight - bd.scrollTop - bd.clientHeight); bd.scrollTop = a0;
  const baris = (sel) => { const el = l.querySelector(sel); if (!el) return null; const tb = parseFloat(getComputedStyle(el).lineHeight) || 20; return { teks: el.textContent.trim(), baris: Math.round(el.getBoundingClientRect().height / tb) }; };
  return {
    jenis: l.getAttribute('data-lembar-akhir'), peran: l.getAttribute('role'), modal: l.getAttribute('aria-modal'), bernama: !!document.getElementById(l.getAttribute('aria-labelledby') ?? '')?.textContent.trim(),
    atas: b1(r.top), tinggi: b1(r.height), bawah: b1(vv.height - r.bottom), lebar: b1(r.width), layar: [vv.width, vv.height],
    badan: [bd.clientHeight, bd.scrollHeight], sisaGulir: sisa, meluapLain, keluarLebar: [...new Set(lebar)].slice(0, 4), luapX: [...new Set(luapX)].slice(0, 4),
    fokusDiDalam: !!akt && l.contains(akt), fokus: akt ? akt.tagName.toLowerCase() + (akt.getAttribute('data-lembar-nav') ? '[' + akt.getAttribute('data-lembar-nav') + ']' : '') : null,
    inert: document.getElementById('root')?.hasAttribute('inert') ?? null, kunciGulir: document.body.style.overflow, bilahTertutup: !!diAtasBilah && !!diAtasBilah.closest('.akh-lembar-latar'),
    kecil: l.querySelector('.akh-lembar-judul small')?.textContent.trim() ?? null, judul: l.querySelector('h2')?.textContent.trim() ?? '', judulBaris: baris('h2')?.baris ?? null,
    cap: l.querySelector('.akh-cap')?.textContent.trim() ?? null, capNilai: l.querySelector('.akh-cap')?.getAttribute('data-nilai') ?? null, tokenKepala: l.querySelector('.akh-lembar-kepala .akh-token-gambar')?.textContent.trim() ?? null,
    pilihan: baris('[data-baris="pilihan"]'), saran: baris('[data-baris="saran"]'), alasan: baris('[data-baris="alasan"] p'), teksUtuh: baris('.akh-lembar-teks'),
    peta: [...l.querySelectorAll('.akh-peta i')].map((x) => (x.hasAttribute('data-kini') ? 'K' : '.')).join(''),
    nav: [...l.querySelectorAll('[data-lembar-nav]')].map((x) => ({ arah: x.getAttribute('data-lembar-nav'), teks: x.textContent.replace(/[←→]/g, '').trim(), mati: x.getAttribute('aria-disabled') === 'true', t: Math.round(x.getBoundingClientRect().height) })),
    tutup: l.querySelector('[data-tutup-lembar]')?.getAttribute('aria-label') ?? null, tautan: l.querySelector('[data-lihat-perjalanan]')?.textContent.trim() ?? null, teks: l.innerText,
  };
});
const fokusKini = (p) => p.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? (a.getAttribute('data-token') ?? a.getAttribute('data-ukur') ?? a.className ?? a.tagName) : null; });
const sesudahTutup = (p) => p.evaluate(() => ({ lembar: !!document.querySelector('.akh-lembar'), inert: document.getElementById('root')?.hasAttribute('inert') ?? null, kunciGulir: document.body.style.overflow, terbuka: [...document.querySelectorAll('.akh-token-tombol[aria-expanded="true"]')].length }));

/** Syarat umum lembar terbuka. */
function nilaiLembar(l, bahasa, label) {
  const s = []; const g = (x) => s.push(`${label}: ${x}`);
  if (!l) return [`${label}: lembar tidak terbuka`];
  if (l.peran !== 'dialog' || l.modal !== 'true' || !l.bernama) g('bukan dialog modal bernama');
  if (!l.fokusDiDalam) g('fokus tidak di dalam lembar (' + l.fokus + ')');
  if (l.inert !== true) g('latar tidak inert');
  if (l.kunciGulir !== 'hidden') g('gulir halaman tidak dikunci');
  if (!l.bilahTertutup) g('bilah aksi tidak tertutup lembar');
  if (Math.abs(l.bawah) > 0.5) g(`lembar tidak menempel di tepi bawah (${l.bawah})`);
  if (l.atas < 64.5) g(`lembar lebih tinggi dari layar - 65 px (atas ${l.atas})`);
  if (Math.abs(l.lebar - Math.min(640, l.layar[0])) > 0.5) g(`lebar lembar ${l.lebar}`);
  if (l.keluarLebar.length || l.luapX.length) g('teks tidak melipat di dalam lembar: ' + JSON.stringify([l.keluarLebar, l.luapX]));
  if (l.meluapLain) g('ada wilayah gulir lain di lembar');
  if (l.badan[1] > l.badan[0] && l.sisaGulir > 1) g('badan lembar tidak bisa digulir sampai ujung');
  if (l.tutup !== TEKS[bahasa].tutup) g(`tombol tutup "${l.tutup}"`);
  if (bahasa !== 'id') { const indo = l.teks.split('\n').map((x) => x.trim()).filter((x) => x && KATA_ID.test(x)); if (indo.length) g('kata Indonesia: ' + indo.slice(0, 2).join(' | ')); }
  return s;
}

/** Uji lembar lengkap pada kartu yang sedang tampil. Mengembalikan { sebab, data }. */
async function periksaLembar(p, bahasa, foto) {
  const T = TEKS[bahasa]; const sebab = []; const data = {};
  const tutupHarus = async (cara, harapFokus, label) => {
    await tunggu(280);
    const z = await sesudahTutup(p); const f = await fokusKini(p);
    if (z.lembar || z.inert || z.kunciGulir === 'hidden' || z.terbuka) sebab.push(`${label}: ${cara} tidak menutup bersih ${JSON.stringify(z)}`);
    if (f !== harapFokus) sebab.push(`${label}: sesudah ${cara} fokus di "${f}", seharusnya "${harapFokus}"`);
  };
  // 1. token 3 (ketuk sungguhan) -> rincian
  if (!(await ketuk(p, '[data-token="k03"]'))) return { sebab: ['token k03 tidak ada'], data };
  await tunggu(420);
  let l = await ukurLembar(p);
  sebab.push(...nilaiLembar(l, bahasa, 'k03'));
  if (l) {
    if (l.jenis !== 'titik' || l.kecil !== T.nomor(3) || l.tokenKepala !== '3' || !l.judul) sebab.push('k03: kepala lembar ' + JSON.stringify([l.jenis, l.kecil, l.tokenKepala, l.judul]));
    if (!T.nilai.includes(l.cap) || !l.pilihan?.teks || !l.alasan?.teks) sebab.push('k03: isi rincian ' + JSON.stringify([l.cap, l.pilihan, l.alasan]));
    if (l.peta !== '..K............') sebab.push('k03: peta ' + l.peta);
    if (l.nav.length !== 2 || l.nav[0].teks !== T.sebelum || l.nav[1].teks !== T.berikut || l.nav.some((x) => x.t !== 48 || x.mati)) sebab.push('k03: tombol navigasi ' + JSON.stringify(l.nav));
    // zh / en: alasan panjang melipat menjadi beberapa baris di dalam gelembung
    if (l.alasan && l.alasan.baris < 2) sebab.push('k03: alasan tidak melipat (' + l.alasan.baris + ' baris)');
    data.k03 = { atas: l.atas, tinggi: l.tinggi, badan: l.badan, alasanBaris: l.alasan?.baris, judulBaris: l.judulBaris };
    const terbuka = await p.evaluate(() => [...document.querySelectorAll('.akh-token-tombol[aria-expanded="true"]')].map((x) => x.getAttribute('data-token')));
    if (JSON.stringify(terbuka) !== '["k03"]') sebab.push('k03: token terbuka ' + JSON.stringify(terbuka));
  }
  if (foto) await foto('lembar-k03');
  // 2. Berikutnya -> k04, fokus tetap di tombol; panah kanan -> k05; panah kiri dua kali -> k03
  await klik(p, '[data-lembar-nav="berikut"]'); await tunggu(220);
  l = await ukurLembar(p);
  if (!l || l.kecil !== T.nomor(4) || l.peta !== '...K...........' || !l.fokusDiDalam) sebab.push('Berikutnya: ' + JSON.stringify(l && [l.kecil, l.peta, l.fokus]));
  await p.keyboard.press('ArrowRight'); await tunggu(200);
  l = await ukurLembar(p); if (!l || l.kecil !== T.nomor(5)) sebab.push('panah kanan: ' + (l && l.kecil));
  await p.keyboard.press('ArrowLeft'); await tunggu(160); await p.keyboard.press('ArrowLeft'); await tunggu(200);
  l = await ukurLembar(p); if (!l || l.kecil !== T.nomor(3)) sebab.push('panah kiri: ' + (l && l.kecil));
  // 3. Sebelumnya sampai keputusan 1: tombolnya mati tetapi fokus tidak hilang; ketuk lagi tidak mengubah apa pun
  await klik(p, '[data-lembar-nav="sebelum"]'); await tunggu(160); await klik(p, '[data-lembar-nav="sebelum"]'); await tunggu(200);
  l = await ukurLembar(p);
  if (!l || l.kecil !== T.nomor(1) || !l.nav[0].mati || l.nav[1].mati || !l.fokusDiDalam) sebab.push('ujung awal: ' + JSON.stringify(l && [l.kecil, l.nav, l.fokus]));
  await klik(p, '[data-lembar-nav="sebelum"]'); await tunggu(160);
  l = await ukurLembar(p); if (!l || l.kecil !== T.nomor(1)) sebab.push('Sebelumnya di keputusan 1 mengubah isi: ' + (l && l.kecil));
  // 4. Escape -> fokus ke token keputusan yang sedang tampil (k01)
  await p.keyboard.press('Escape'); await tutupHarus('Escape', 'k01', 'k01');
  // 5. token 15: ujung akhir, lalu ketuk latar -> fokus kembali ke token 15
  await ketuk(p, '[data-token="k15"]'); await tunggu(420);
  l = await ukurLembar(p);
  sebab.push(...nilaiLembar(l, bahasa, 'k15'));
  if (l && (l.kecil !== T.nomor(15) || l.nav[0].mati || !l.nav[1].mati || l.peta !== '..............K')) sebab.push('k15: ' + JSON.stringify([l.kecil, l.nav, l.peta]));
  if (l) data.k15 = { atas: l.atas, tinggi: l.tinggi, badan: l.badan };
  if (foto) await foto('lembar-k15');
  await p.mouse.click(20, 30); await tutupHarus('ketuk latar', 'k15', 'k15');
  // 6. tinggi lembar ke-15 keputusan (catatan) + tidak ada yang lebih tinggi dari layar - 65
  await ketuk(p, '[data-token="k01"]'); await tunggu(380);
  const tinggi = [];
  for (let i = 1; i <= 15; i++) {
    const x = await ukurLembar(p);
    if (!x || x.kecil !== T.nomor(i)) { sebab.push(`keputusan ${i}: lembar ${x && x.kecil}`); break; }
    tinggi.push(x.tinggi);
    if (x.atas < 64.5 || x.keluarLebar.length || x.luapX.length || (x.badan[1] > x.badan[0] && x.sisaGulir > 1)) sebab.push(`keputusan ${i}: ` + JSON.stringify([x.atas, x.keluarLebar, x.luapX, x.badan]));
    if (i < 15) { await klik(p, '[data-lembar-nav="berikut"]'); await tunggu(140); }
  }
  data.tinggiLembar = tinggi;
  await klik(p, '[data-tutup-lembar]'); await tutupHarus('tombol tutup', 'k15', 'tutup');
  // 7. Pelajaran -> teks utuh; Escape -> fokus ke kartunya
  const kartu = await p.evaluate(() => ({ pelajaran: document.querySelector('.akh-gelembung-teks')?.textContent.trim() ?? '', sebab: document.querySelector('.akh-kartu .akh-sebab')?.textContent.trim() ?? '', judul: document.querySelector('.akh-judul')?.textContent.trim() ?? '' }));
  await ketuk(p, '[data-ukur="akhir-pelajaran"]'); await tunggu(420);
  l = await ukurLembar(p);
  sebab.push(...nilaiLembar(l, bahasa, 'pelajaran'));
  if (l && (l.jenis !== 'pelajaran' || l.judul !== T.pelajaran || l.teksUtuh?.teks !== kartu.pelajaran || l.teksUtuh.baris < 2)) sebab.push('pelajaran: ' + JSON.stringify([l.jenis, l.judul, l.teksUtuh]));
  if (l) data.lembarPelajaran = { tinggi: l.tinggi, baris: l.teksUtuh?.baris };
  if (foto) await foto('lembar-pelajaran');
  await p.keyboard.press('Escape'); await tutupHarus('Escape', 'akhir-pelajaran', 'pelajaran');
  // 8. kalimat sebab -> kalimat utuh + "Lihat perjalananku" -> dialog tanpa kelompok kosong -> Escape -> fokus ke kalimat sebab
  await ketuk(p, '[data-ukur="akhir-sebab"]'); await tunggu(420);
  l = await ukurLembar(p);
  sebab.push(...nilaiLembar(l, bahasa, 'sebab'));
  if (l && (l.jenis !== 'sebab' || l.judul !== kartu.judul || l.teksUtuh?.teks !== kartu.sebab || l.teksUtuh.baris < 3 || l.tautan !== T.lihat)) sebab.push('sebab: ' + JSON.stringify([l.jenis, l.judul, l.teksUtuh, l.tautan]));
  if (l) data.lembarSebab = { tinggi: l.tinggi, baris: l.teksUtuh?.baris };
  if (foto) await foto('lembar-sebab');
  await klik(p, '[data-lihat-perjalanan]'); await tunggu(450);
  const pj = await p.evaluate(() => { const d = document.querySelector('.mdl-panel'); return { ada: !!d, lembar: !!document.querySelector('.akh-lembar'), kelompok: d ? [...d.querySelectorAll('.akh-kelompok')].map((x) => x.getAttribute('data-kelompok')) : [], kosong: d ? d.querySelectorAll('.akh-kosong').length : -1, teks: d ? d.innerText : '' }; });
  if (!pj.ada || pj.lembar || JSON.stringify(pj.kelompok) !== '["kenapa","temuan"]' || pj.kosong !== 0 || !pj.teks.includes(kartu.sebab)) sebab.push('Lihat perjalananku: ' + JSON.stringify({ ...pj, teks: pj.teks.slice(0, 80) }));
  if (bahasa !== 'id') { const indo = pj.teks.split('\n').map((x) => x.trim()).filter((x) => x && KATA_ID.test(x)); if (indo.length) sebab.push('Lihat perjalananku, kata Indonesia: ' + indo.slice(0, 2).join(' | ')); }
  if (foto) await foto('perjalanan');
  await p.keyboard.press('Escape'); await tunggu(320);
  const f = await fokusKini(p); const z = await sesudahTutup(p);
  if (f !== 'akhir-sebab' || z.inert || z.kunciGulir === 'hidden' || (await p.evaluate(() => !!document.querySelector('.mdl-panel')))) sebab.push('tutup perjalanan: fokus "' + f + '" ' + JSON.stringify(z));
  // 9. Menu: dua baris keterangan
  await klik(p, '.hp-menu'); await tunggu(420);
  // D-246: diukur TANPA menggulir Menu lebih dulu (posisi saat Menu baru terbuka).
  const menu = await p.evaluate(() => { const b = (n) => { const el = document.querySelector(`.mdl-panel [data-menu-info="${n}"]`); if (!el) return null; const r = el.getBoundingClientRect(); const isi = el.closest('.mdl-isi').getBoundingClientRect(); return { judul: el.querySelector('b')?.textContent.trim(), isi: [...el.querySelectorAll(':scope > span')].map((x) => x.textContent.trim()), terlihat: r.top >= isi.top - 1 && r.bottom <= isi.bottom + 1 && r.bottom <= window.innerHeight + 0.5, dalamLebar: r.left >= 0 && r.right <= window.innerWidth + 0.5, bawah: Math.round(r.bottom),
      awalTerlihat: (() => { const a = el.querySelector(':scope > span')?.getBoundingClientRect(); return !!a && r.top >= isi.top - 1 && a.bottom <= isi.bottom + 1 && a.bottom <= window.innerHeight + 0.5; })(), terpotong: Math.max(0, Math.round(r.bottom - Math.min(isi.bottom, window.innerHeight))) }; };
    const isiMenu = document.querySelector('.mdl-panel .mdl-isi'); const suara = document.querySelector('.mdl-panel .hp-menu-suara')?.getBoundingClientRect(); const bahasaBaris = document.querySelector('.mdl-panel .hp-menu-baris')?.getBoundingClientRect();
    return { suasana: b('suasana'), catatan: b('catatan'), gulirMenu: isiMenu ? Math.round(isiMenu.scrollTop) : null, atasSuara: suara ? Math.round(suara.top) : null, atasBahasa: bahasaBaris ? Math.round(bahasaBaris.top) : null }; });
  if (!menu.suasana || menu.suasana.judul !== T.menu[0] || menu.suasana.isi[0] !== T.rentang || !menu.suasana.dalamLebar || !menu.suasana.terlihat) sebab.push('Menu, rentang suasana: ' + JSON.stringify(menu.suasana));
  if (menu.gulirMenu !== 0 || menu.atasSuara === null || menu.atasBahasa === null || !menu.catatan || menu.catatan.bawah > menu.atasBahasa + 1 || menu.catatan.bawah > menu.atasSuara + 1) sebab.push('Menu (D-246): baris keterangan tidak di atas bahasa & suara / Menu sudah tergulir: ' + JSON.stringify({ gulir: menu.gulirMenu, catatanBawah: menu.catatan?.bawah, bahasa: menu.atasBahasa, suara: menu.atasSuara }));
  // (baris kedua bisa lebih panjang dari jendela Menu di 640 / 645, teks Inggris: judul + kalimat catatan simulasinya wajib terlihat)
  if (!menu.catatan || menu.catatan.judul !== T.menu[1] || menu.catatan.isi.length !== 2 || menu.catatan.isi.some((x) => x.length < 20) || !menu.catatan.awalTerlihat || !menu.catatan.dalamLebar) sebab.push('Menu, catatan simulasi: ' + JSON.stringify(menu.catatan));
  if (bahasa !== 'id' && menu.catatan) { const indo = [...menu.catatan.isi, ...(menu.suasana?.isi ?? [])].filter((x) => KATA_ID.test(x)); if (indo.length) sebab.push('Menu, kata Indonesia: ' + indo.join(' | ').slice(0, 120)); }
  if (foto) await foto('menu');
  await p.keyboard.press('Escape'); await tunggu(300);
  data.menu = menu.catatan ? menu.catatan.isi.map((x) => x.length) : null;
  data.menuTerpotong = menu.catatan ? menu.catatan.terpotong : null;
  return { sebab, data };
}

/**
 * D-247: selama ditekan (penunjuk turun, belum dilepas) gambar token dan chip panah turun 2 px. Mengembalikan geseran (px) tiap
 * sasaran; penunjuk dilepas di luar sasaran supaya tidak ada lembar yang terbuka.
 */
async function ukurTekan(p) {
  const hasil = {};
  for (const [nama, tombol, gambar] of [['token', '[data-token="k02"]', '[data-token="k02"] .akh-token-gambar'], ['sebab', '[data-ukur="akhir-sebab"]', '[data-ukur="akhir-sebab"] .akh-lagi'], ['pelajaran', '[data-ukur="akhir-pelajaran"]', '[data-ukur="akhir-pelajaran"] .akh-lagi']]) {
    const k = await p.evaluate(({ st, sg }) => { const el = document.querySelector(st); const g = document.querySelector(sg); if (!el || !g) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, y0: g.getBoundingClientRect().top }; }, { st: tombol, sg: gambar });
    if (!k) { hasil[nama] = null; continue; }
    await p.mouse.move(k.x, k.y); await p.mouse.down(); await tunggu(120);
    const y1 = await p.evaluate((sg) => document.querySelector(sg).getBoundingClientRect().top, gambar);
    await p.mouse.move(2, 2); await p.mouse.up(); await tunggu(120);
    hasil[nama] = Math.round((y1 - k.y0) * 10) / 10;
  }
  hasil.lembar = await p.evaluate(() => !!document.querySelector('.akh-lembar'));
  return hasil;
}

/**
 * Aturan pas: layar 360 lebar dipendekkan bertahap. Di tiap tinggi: tidak ada yang menggulir, token & Pelajaran utuh; urutan
 * mengalah = grafik 72 -> 56 dulu, lalu kalimat sebab, lalu legenda.
 */
async function periksaPas(mesin, p, bahasa) {
  const sebab = []; const jejak = [];
  for (let h = 640; h >= 560; h -= 8) {
    await aturUkuran(mesin, p, { w: 360, h, dpr: 2 }); await tunggu(260);
    const d = await ukurKartu(p);
    const s = nilaiKartu(d, bahasa, { longgar: true });
    sebab.push(...s.map((x) => `tinggi ${h}: ${x}`));
    if (!d) break;
    jejak.push({ h, pas: d.pas, grafik: d.blok.grafik?.t ?? null, sebab: !!d.blok.sebab, legenda: !!d.blok.legenda, luang: d.luang });
    if (d.pas === 'gulir') sebab.push(`tinggi ${h}: jaring pengaman gulir terpakai`);
    if (d.pas === 'utuh' && (!d.blok.sebab || !d.blok.legenda)) sebab.push(`tinggi ${h}: utuh tetapi sebab / legenda hilang`);
    if (d.pas !== 'utuh' && d.blok.sebab) sebab.push(`tinggi ${h}: ${d.pas} tetapi kalimat sebab masih tampil`);
    if (d.pas === 'tanpa-sebab' && !d.blok.legenda) sebab.push(`tinggi ${h}: tanpa-sebab tetapi legenda hilang`);
    if (d.pas === 'tanpa-legenda' && d.blok.legenda) sebab.push(`tinggi ${h}: tanpa-legenda tetapi legenda tampil`);
  }
  // Urutan: selama grafik masih > 56 (+0,5), kalimat sebab harus tampil pada tinggi itu ATAU susunannya sudah memberi ruang lagi.
  const urut = jejak.map((x) => x.pas);
  const tingkat = { utuh: 0, 'tanpa-sebab': 1, 'tanpa-legenda': 2, gulir: 3 };
  for (let i = 1; i < urut.length; i++) if (tingkat[urut[i]] < tingkat[urut[i - 1]]) sebab.push(`susunan membaik saat layar memendek: ${jejak[i - 1].h} ${urut[i - 1]} -> ${jejak[i].h} ${urut[i]}`);
  const pertamaTanpa = jejak.find((x) => x.pas !== 'utuh');
  if (pertamaTanpa) {
    const sebelum = jejak[jejak.indexOf(pertamaTanpa) - 1];
    // Tepat sebelum kalimat sebab hilang, grafik sudah (hampir) di batas bawahnya: selisih tinggi layar 8 px per langkah.
    if (sebelum && sebelum.grafik > 56 + 8.5) sebab.push(`kalimat sebab hilang di ${pertamaTanpa.h} padahal grafik masih ${sebelum.grafik} px di ${sebelum.h}`);
    // Lembar Pelajaran membawa kalimat sebab selama kalimat itu tersembunyi.
    await aturUkuran(mesin, p, { w: 360, h: pertamaTanpa.h, dpr: 2 }); await tunggu(260);
    await ketuk(p, '[data-ukur="akhir-pelajaran"]'); await tunggu(420);
    const l = await p.evaluate(() => { const x = document.querySelector('.akh-lembar'); return x ? { jenis: x.getAttribute('data-lembar-akhir'), sebab: x.querySelector('[data-baris="sebab"]')?.textContent.trim() ?? null, pelajaran: x.querySelector('[data-baris="pelajaran"]')?.textContent.trim() ?? null, tautan: !!x.querySelector('[data-lihat-perjalanan]'), atas: Math.round(x.getBoundingClientRect().top) } : null; });
    if (!l || l.jenis !== 'pelajaran' || !l.sebab || !l.pelajaran || !l.tautan || l.atas < 64) sebab.push('lembar Pelajaran tanpa kalimat sebab saat sebab tersembunyi: ' + JSON.stringify(l));
    await p.keyboard.press('Escape'); await tunggu(260);
  } else sebab.push('aturan pas tidak pernah terpakai sampai 560 px (uji tidak membuktikan apa pun)');
  if (!jejak.some((x) => x.pas === 'utuh' && x.grafik !== null && x.grafik < 71.5)) sebab.push('grafik tidak pernah menyusut sebelum kalimat sebab hilang: ' + JSON.stringify(jejak.map((x) => [x.h, x.pas, x.grafik])));
  return { sebab, data: { jejak: jejak.map((x) => `${x.h}:${x.pas}:${x.grafik}`) } };
}

/**
 * Semua kasus kartu untuk satu mesin (`b` = browser yang sudah diluncurkan). Opsi: bahasa, akhir, vp (daftar nama), ukur,
 * foto (boolean), lembarPenuh (uji lembar lengkap; bawaan: Chromium semua kasus, WebKit hanya akhir "catatan").
 */
export async function jalankanKartu(mesin, b, BASE, lapor, { bahasa = ['id', 'en', 'zh'], akhir = ['puas', 'catatan', 'kurang'], vp = null, ukur = false, out = OUT_KARTU } = {}) {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
  fs.mkdirSync(out, { recursive: true });
  const daftarVp = VP_KARTU.filter((v) => !vp || vp.includes(v.n));
  const wk = mesin === 'webkit';
  for (const v of daftarVp) for (const lang of bahasa) for (const a of akhir) {
    const label = `kartu-${a}-${v.n}-${lang}-${mesin}`;
    const st = S[`akhir-${a}`];
    if (!st) { lapor(label, false, { sebab: [`state akhir-${a} tidak ada`] }); continue; }
    let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir(mesin, b, BASE, v, lang, st.nilai);
        const p = h.p;
        if (!(await keKartu(p))) { lapor(label, false, { sebab: ['kartu akhir tidak tercapai'] }); return; }
        const d = await ukurKartu(p);
        const sebab = nilaiKartu(d, lang);
        const foto = async (nama) => { await tunggu(200); await p.screenshot({ path: path.join(out, `${nama}-${a}-${v.n}-${lang}${wk ? '-webkit' : ''}.png`) }); };
        await foto('satu-layar');
        const data = d ? { pas: d.pas, wilayah: d.wilayah, kepalaCerita: d.kepalaCerita, luang: d.luang, blok: Object.fromEntries(Object.entries(d.blok).map(([k, x]) => [k, x ? x.t : null])), talang: d.grafik?.talang, legendaLebar: d.legendaLebar, token: d.token[0] ? `${d.token[0].w}x${d.token[0].h}` : null } : {};
        // Lembar: lengkap di Chromium; di WebKit untuk akhir "catatan" (teks & keputusan sama di semua akhir, hanya pilihannya beda).
        if (d && d.satuLayar && (!wk || a === 'catatan')) {
          const r = await periksaLembar(p, lang, (a === 'catatan' && (!wk || v.n === '360x640')) ? foto : null);
          sebab.push(...r.sebab); Object.assign(data, r.data);
        }
        lapor(label, (sebab.length === 0 || ukur) && h.galat.length === 0, { sebab, ...data, ...(h.galat.length ? { galat: h.galat } : {}) });
      })(), BATAS_KASUS, label);
    } catch (e) {
      lapor(label, false, { sebab: [(e instanceof BatasWaktu ? '' : 'galat alat: ') + String(e?.message ?? e).slice(0, 200)] });
    }
    await h?.tutup();
  }
  // D-245: layar tinggi. Chromium: 2 ukuran x bahasa x akhir; WebKit: 390x844, akhir "catatan". Hanya bila tanpa penyaring --vp.
  if (!vp) for (const v of VP_LEGA) for (const lang of bahasa) for (const a of akhir) {
    if (wk && (v.n !== '390x844' || a !== 'catatan')) continue;
    const label = `lega-${a}-${v.n}-${lang}-${mesin}`;
    const st = S[`akhir-${a}`];
    if (!st) { lapor(label, false, { sebab: [`state akhir-${a} tidak ada`] }); continue; }
    let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir(mesin, b, BASE, v, lang, st.nilai);
        const p = h.p;
        if (!(await keKartu(p))) { lapor(label, false, { sebab: ['kartu akhir tidak tercapai'] }); return; }
        const d = await ukurKartu(p);
        const sebab = nilaiKartu(d, lang, { tinggi: true });
        await tunggu(200); await p.screenshot({ path: path.join(out, `lega-${a}-${v.n}-${lang}${wk ? '-webkit' : ''}.png`) });
        const data = d ? { lega: d.lega, luang: d.luang, blok: Object.fromEntries(Object.entries(d.blok).map(([k, x]) => [k, x ? x.t : null])) } : {};
        // Sekali per mesin (id, akhir catatan, 390x844): batas tinggi 700 px, lembar tetap utuh, dan tekanan (D-247).
        if (d && lang === 'id' && a === 'catatan' && v.n === '390x844') {
          await aturGerak(mesin, p, 'no-preference'); await tunggu(150);
          const tekan = await ukurTekan(p);
          if (tekan.lembar) sebab.push('uji tekan membuka lembar');
          for (const nama of ['token', 'sebab', 'pelajaran']) if (tekan[nama] !== 2) sebab.push(`D-247: ${nama} turun ${tekan[nama]} px saat ditekan, seharusnya 2`);
          data.tekan = tekan;
          await aturGerak(mesin, p, 'reduce'); await tunggu(150);
          const diam = await ukurTekan(p);
          for (const nama of ['token', 'sebab', 'pelajaran']) if (diam[nama] !== 0) sebab.push(`D-247: gerak dikurangi, ${nama} tetap bergeser ${diam[nama]} px`);
          data.tekanGerakDikurangi = diam;
          await aturGerak(mesin, p, 'no-preference'); await tunggu(150);
          const jejak = [];
          for (const t of [699, 700]) {
            await aturUkuran(mesin, p, { w: v.w, h: t, dpr: v.dpr }); await tunggu(300);
            const x = await ukurKartu(p);
            jejak.push(`${t}:${x?.lega ?? '-'}`);
            if (t === 699 && x?.lega) sebab.push(`tinggi 699: sudah melonggar (${x.lega}); batasnya 700`);
            if (t === 700 && !(x?.lega ?? '').includes('pelajaran')) sebab.push(`tinggi 700: belum melonggar (${x?.lega}), luang ${x?.luang}`);
            if (x) sebab.push(...nilaiKartu(x, lang, t === 700 ? { tinggi: true } : { longgar: true }).map((y) => `tinggi ${t}: ${y}`));
          }
          data.batas = jejak;
          await aturUkuran(mesin, p, v); await tunggu(260);
          // Lembar Pelajaran dan kalimat sebab tidak berubah: tetap membuka teks utuh.
          await ketuk(p, '[data-ukur="akhir-pelajaran"]'); await tunggu(420);
          const l = await ukurLembar(p);
          sebab.push(...nilaiLembar(l, lang, 'pelajaran (layar tinggi)'));
          await p.keyboard.press('Escape'); await tunggu(280);
        }
        lapor(label, (sebab.length === 0 || ukur) && h.galat.length === 0, { sebab, ...data, ...(h.galat.length ? { galat: h.galat } : {}) });
      })(), BATAS_KASUS, label);
    } catch (e) {
      lapor(label, false, { sebab: [(e instanceof BatasWaktu ? '' : 'galat alat: ') + String(e?.message ?? e).slice(0, 200)] });
    }
    await h?.tutup();
  }
  // Aturan pas (layar dipendekkan), sekali per mesin, bahasa Indonesia, akhir "catatan" (kepala 57 px = isi terpanjang id).
  if (bahasa.includes('id') && akhir.includes('catatan') && S['akhir-catatan']) {
    const label = `pas-catatan-360-id-${mesin}`; let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir(mesin, b, BASE, VP_KARTU[1], 'id', S['akhir-catatan'].nilai);
        if (!(await keKartu(h.p))) { lapor(label, false, { sebab: ['kartu akhir tidak tercapai'] }); return; }
        const r = await periksaPas(mesin, h.p, 'id');
        await h.p.screenshot({ path: path.join(out, `pas-360x560-id${wk ? '-webkit' : ''}.png`) });
        lapor(label, (r.sebab.length === 0 || ukur) && h.galat.length === 0, { sebab: r.sebab, ...r.data, ...(h.galat.length ? { galat: h.galat } : {}) });
      })(), BATAS_KASUS, label);
    } catch (e) { lapor(label, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 200)] }); }
    await h?.tutup();
  }
  // Desktop 1280 x 800: bentuk lama tidak berubah (hanya Chromium; bukan cangkang HP).
  if (!wk && S['akhir-puas']) {
    const label = 'kartu-desktop-1280-id-chromium'; let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir(mesin, b, BASE, { n: '1280x800', w: 1280, h: 800, dpr: 1 }, 'id', S['akhir-puas'].nilai);
        if (!(await keKartu(h.p))) { lapor(label, false, { sebab: ['kartu akhir tidak tercapai'] }); return; }
        const d = await h.p.evaluate(() => ({ satu: !!document.querySelector('[data-satu-layar], [data-akhir-satu]'), token: document.querySelectorAll('.akh-token-tombol').length, daftar: document.querySelectorAll('.akh-ringkasan .akh-titik > li details').length, legenda: !!document.querySelector('.akh-ringkasan .akh-grafik-legenda'), simulasi: !!document.querySelector('.akh-kaki .akh-simulasi'), sebabTag: document.querySelector('.akh-kartu > p.akh-sebab')?.tagName ?? null, pelajaranTag: document.querySelector('.akh-kartu > div.akh-pelajaran .akh-pelajaran-teks')?.tagName ?? null, catatan: !!document.querySelector('.akh-ringkasan-catatan'), grafik: Math.round(document.querySelector('.akh-ringkasan .akh-grafik svg')?.getBoundingClientRect().height ?? 0), aksiDiKartu: !!document.querySelector('.akh-kartu .akh-aksi') }));
        await klik(h.p, '.hp-menu'); await tunggu(380);
        const menuInfo = await h.p.evaluate(() => document.querySelectorAll('.mdl-panel [data-menu-info]').length);
        await h.p.keyboard.press('Escape');
        const sebab = [];
        if (d.satu || d.token || d.daftar !== 15 || !d.legenda || !d.simulasi || d.sebabTag !== 'P' || d.pelajaranTag !== 'P' || !d.catatan || d.grafik !== 120 || menuInfo !== 0) sebab.push('desktop berubah: ' + JSON.stringify({ ...d, menuInfo }));
        lapor(label, (sebab.length === 0 || ukur) && h.galat.length === 0, { sebab, ...d, menuInfo });
      })(), BATAS_KASUS, label);
    } catch (e) { lapor(label, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 200)] }); }
    await h?.tutup();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs');
  mulaiPrioritasRendah();
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
  const opsi = (nama) => { const x = process.argv.find((a) => a.startsWith(`--${nama}=`)); return x ? x.slice(nama.length + 3).split(',').map((s) => s.trim()).filter(Boolean) : undefined; };
  const ukur = process.argv.includes('--ukur');
  const hasil = []; let gagal = 0;
  const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
  const tulis = () => { fs.mkdirSync(OUT_KARTU, { recursive: true }); fs.writeFileSync(path.join(OUT_KARTU, 'hasil.json'), JSON.stringify(hasil, null, 1)); };
  let b = null;
  const batal = pasangPenjaga(25, () => { lapor('penjaga', false, { sebab: ['seluruh proses melewati batas waktu'], selesai: hasil.length }); tulis(); try { b?.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
  for (const mesin of process.argv.includes('--tanpa-webkit') ? ['chromium'] : process.argv.includes('--hanya-webkit') ? ['webkit'] : ['chromium', 'webkit']) {
    b = await luncur(mesin); // SATU browser pada satu waktu
    await jalankanKartu(mesin, b, BASE, lapor, { bahasa: opsi('bahasa'), akhir: opsi('akhir'), vp: opsi('vp'), ukur });
    await denganBatas(b.close(), 15000, 'tutup browser').catch(() => {}); b = null;
    await tunggu(300);
  }
  batal(); tulis();
  console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
