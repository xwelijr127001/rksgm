/**
 * T-027: halaman awal SATU LAYAR di HP (varian A, team/DESIGN-REVIEW.md "T-027 — mock" D-254..D-267).
 *
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-beranda-t027.mjs [--tanpa-webkit] [--kasus potongan-nama]
 *   Server uji: build client yang diperiksa + RAKSA_LEGACY=on (spanduk acara kuis lama hanya ada di mode lama; jawaban
 *   /api/acara-terbuka DIGANTI alat ini di browser, jadi tidak perlu room kuis sungguhan). Port 4000-4002 ditolak.
 *
 * HP sasaran 390x745 (DPR 3) dan 360x640 (DPR 2) x id / en / zh x tanpa / dengan profil tersimpan (12 kasus), tiap kasus:
 *  - 0 px gulir tegak dan mendatar; blok berurutan dari atas: header, hero, sapaan Miss Raksa, kartu Mode Cerita, [baris
 *    profil], baris kode, [catatan], footer; tidak ada yang bertumpuk dan footer habis di dalam layar;
 *  - h1 tetap ada di halaman tetapi tidak tampil; kartu tanpa potret; teks pendek HP dari kamus (pintuCeritaIsiHp, joinTanya),
 *    kalimat Join hanya untuk pembaca layar; dengan profil catatan "Tanpa akun" diganti baris "Main sebagai …";
 *  - sasaran ketuk: Mulai >= 54 px (50 di layar < 700 px tinggi), kolom kode dan Masuk >= 48 px, "ubah", "Untuk panitia",
 *    bahasa dan suara >= 44 x 44 px; hero 140..190 px (190 di 390x745); tidak ada teks terpotong; tanpa galat halaman.
 * Ukuran lain (id): 390x664, 390x844, 430x932, 360x700 dengan profil, 375x553, 320x568: 0 px gulir.
 * Keadaan (360x640, id, profil): kode salah (pesan menggantikan pertanyaan, baris tidak bertambah), "WWWWWW" muat di kolom,
 * gerak dikurangi (tombol animasi di baris footer), spanduk acara (kolom kode + Masuk tidak tertutup; tombol spanduk
 * mengisi kode dan memindahkan fokus ke Masuk). Papan ketik (390x745, id, profil): urutan Tab = urutan layar.
 * HP mendatar (844x390, 740x360): kedua pintu utuh di layar pertama; dengan spanduk acara, pil spanduk di header tidak menutupinya.
 * Lebar: 1280x800 kedua pintu di layar pertama, Mode Cerita di atas baris kode, teks panjang; 768x1024 urutan yang sama.
 * Lebar dan mendatar (D-290, T-029 Fix 1): Mulai tidak lebih pendek daripada Masuk.
 * WebKit: dua ukuran sasaran (id, tanpa / dengan profil) dan 390x664.
 * Tangkapan layar + hasil.json -> team/evidence/T-027/fullstack/. Kode keluar 0 lulus, 1 ada yang gagal, 2 penjaga / env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { denganBatas, luncur, pasangPenjaga, tunggu } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah();

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = (process.env.UI_BASE || '').replace(/\/+$/, '');
const OUT = path.join(ROOT, 'team/evidence/T-027/fullstack');
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(BASE) || /:(4000|4001|4002)$/.test(BASE)) { console.error('DITOLAK: UI_BASE harus server uji loopback (bukan 4000-4002), mis. http://127.0.0.1:4003'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const hanya = (() => { const i = process.argv.indexOf('--kasus'); return i >= 0 ? process.argv[i + 1] : null; })();
const MESIN = process.argv.includes('--tanpa-webkit') ? ['chromium'] : ['chromium', 'webkit'];
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const HP_A = { n: '390x745', w: 390, h: 745, dpr: 3 };
const HP_B = { n: '360x640', w: 360, h: 640, dpr: 2 };
const vp = (w, h, dpr = 2) => ({ n: `${w}x${h}`, w, h, dpr });

/** Teks kamus pemain `kunci` dalam `bahasa`, dibaca dari sumbernya. */
const KAMUS = fs.readFileSync(path.join(ROOT, 'client/src/i18n/kamus/pemain.ts'), 'utf8').replace(/\r\n/g, '\n');
function kamus(bahasa, kunci) {
  const i = KAMUS.indexOf(`\n  ${bahasa}: {`); const j = KAMUS.indexOf('\n  },', i);
  const m = new RegExp(`\\n\\s+${kunci}: '((?:[^'\\\\]|\\\\.)*)'`).exec(KAMUS.slice(i, j));
  if (i < 0 || j < 0 || !m) throw new Error(`kamus pemain ${bahasa}: ${kunci} tidak ada`);
  return m[1].replace(/\\'/g, "'");
}

async function buka(mesin, b, v, lang, { profil = false, gerakKurang = false, spanduk = false } = {}) {
  const hp = v.w < 800 || v.h < 500;
  const awal = { lang, profil: profil ? PROFIL : null };
  const skrip = (a) => { try { localStorage.setItem('raksa:bahasa', a.lang); if (a.profil) localStorage.setItem('raksa:profil', a.profil); sessionStorage.setItem('raksa:loader:v1', '1'); } catch { /* abaikan */ } };
  const acara = JSON.stringify({ acara: { code: 'AB12', eventName: 'Uji Acara' } });
  let ctx, p;
  if (mesin === 'chromium') {
    ctx = await b.createBrowserContext();
    p = await ctx.newPage();
    p.setDefaultTimeout(20000); p.setDefaultNavigationTimeout(30000);
    await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: hp, hasTouch: hp });
    // Selalu dinyatakan: Chrome headless di sesi tanpa animasi (mis. RDP) melaporkan 'reduce' dengan sendirinya.
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: gerakKurang ? 'reduce' : 'no-preference' }]);
    await p.evaluateOnNewDocument(skrip, awal);
    if (spanduk) {
      await p.setRequestInterception(true);
      p.on('request', (r) => (r.url().endsWith('/api/acara-terbuka') ? r.respond({ status: 200, contentType: 'application/json', body: acara }) : r.continue()));
    }
  } else {
    ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr, isMobile: hp, hasTouch: hp, reducedMotion: gerakKurang ? 'reduce' : 'no-preference' });
    ctx.setDefaultTimeout(20000); ctx.setDefaultNavigationTimeout(30000);
    p = await ctx.newPage();
    await p.addInitScript(skrip, awal);
    if (spanduk) await p.route('**/api/acara-terbuka', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: acara }));
  }
  const galat = [];
  p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 160)));
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  // Siap: pintu Mode Cerita ada, fon termuat, sprite hero terpasang; lalu tata letak tenang.
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    const s = await p.evaluate((sp) => !!document.querySelector('[data-pintu-cerita]') && !!document.querySelector('.lp-join-kode') && (!sp || !!document.querySelector('.alur-spanduk'))).catch(() => false);
    if (s) break;
    await tunggu(150);
  }
  await denganBatas(p.evaluate(() => document.fonts?.ready.then(() => true)), 5000, 'fon').catch(() => null);
  await tunggu(700);
  return { p, galat, tutup: () => denganBatas(ctx.close(), 10000, 'tutup konteks').catch(() => {}) };
}

const ukur = (p) => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const b1 = (v) => Math.round(v * 10) / 10;
  const kotak = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: b1(r.left), y: b1(r.top), w: b1(r.width), h: b1(r.height), b: b1(r.bottom), r: b1(r.right) }; };
  const tampil = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const g = getComputedStyle(el); return g.display !== 'none' && g.visibility !== 'hidden' && r.width > 2 && r.height > 2; };
  const jika = (el) => (tampil(el) ? kotak(el) : null);
  const se = document.scrollingElement;
  const kode = q('.lp-join-kode');
  return {
    vw: window.innerWidth, vh: window.innerHeight, sh: se.scrollHeight, sw: se.scrollWidth,
    header: kotak(q('.player-header')), hero: jika(q('.lp-kota-bingkai')), sapaan: jika(q('.lp-kota-sapa')),
    h1: { ada: !!q('h1.lp-judul'), tampil: tampil(q('.lp-sapa')) },
    kartu: kotak(q('[data-pintu-cerita]')), mulai: kotak(q('.lp-pintu-aksi')), potretKartu: tampil(q('.lp-pintu-potret')),
    judulKartu: q('.lp-pintu-judul')?.textContent ?? '', isiKartu: [...document.querySelectorAll('.lp-pintu-isi')].filter(tampil).map((e) => e.textContent),
    judulSendiri: tampil(q('.lp-sendiri-judul')),
    sebagai: jika(q('.lp-sebagai')), ubah: jika(q('.alur-sebagai-ubah')),
    join: kotak(q('.lp-join')), judulJoin: [...document.querySelectorAll('.lp-join-judul > span')].filter(tampil).map((e) => e.textContent), isiJoin: tampil(q('.lp-join-isi')),
    potretJoin: jika(q('.lp-join-kepala .potret-surveyor')), form: kotak(q('.lp-join-form')), kode: kotak(kode), masuk: kotak(q('.lp-join-mulai')),
    kodeMuat: kode ? kode.scrollWidth <= kode.clientWidth + 1 : null, kodeNilai: kode?.value ?? '',
    galat: jika(q('.lp-join-galat')), teksGalat: q('.lp-join-galat')?.textContent ?? null, kepalaJoin: tampil(q('.lp-join-kepala')),
    catatan: jika(q('.lp-catatan')), footer: kotak(q('.player-footer')), panitia: kotak(q('.host-links summary')), perusahaan: tampil(q('.player-footer > span')),
    gerak: jika(q('.player-footer .tombol-gerak')), bahasa: kotak(q('.pilih-bahasa')), suara: kotak(q('.sound-button')),
    terpotong: [...document.querySelectorAll('.lp-pintu-judul, .lp-pintu-isi, .lp-pintu-aksi, .lp-join-judul, .lp-join-mulai, .lp-catatan, .lp-kota-balon, .alur-sebagai-nama, .player-footer > span')].filter(tampil).filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className),
    spanduk: jika(q('.alur-spanduk')), fokus: document.activeElement?.className ?? '',
  };
});

/** Pemeriksaan satu layar HP (<= 700 px lebar). */
function periksaHp(d, lang, { profil, tinggiPendek, heroTetap = null, tanpaHero = false, gerak = false, spanduk = false }) {
  const s = [];
  if (d.sh - d.vh > 0.5 && !spanduk) s.push(`gulir tegak ${Math.round((d.sh - d.vh) * 10) / 10} px`);
  if (d.sw - d.vw > 0.5) s.push(`gulir mendatar ${d.sw - d.vw} px`);
  // urutan blok dari atas, tidak bertumpuk
  const blok = [['header', d.header], ['hero', d.hero], ['sapaan', d.sapaan], ['kartu', d.kartu], ['profil', d.sebagai], ['kode', d.join], ['catatan', d.catatan], ['footer', d.footer]].filter(([, k]) => k);
  for (let i = 1; i < blok.length; i++) if (blok[i][1].y < blok[i - 1][1].b - 0.6) s.push(`${blok[i][0]} (atas ${blok[i][1].y}) menumpang ${blok[i - 1][0]} (bawah ${blok[i - 1][1].b})`);
  if (!spanduk && d.footer.b > d.vh + 0.6) s.push(`footer habis di ${d.footer.b}, layar ${d.vh}`);
  if (tanpaHero ? d.hero : !d.hero) s.push(tanpaHero ? 'hero seharusnya disembunyikan di ukuran ini' : 'hero tidak tampil');
  if (d.hero && (d.hero.h < 139.5 || d.hero.h > 190.5)) s.push(`tinggi hero ${d.hero.h} (140..190)`);
  if (heroTetap !== null && d.hero && Math.abs(d.hero.h - heroTetap) > 0.6) s.push(`tinggi hero ${d.hero.h}, seharusnya ${heroTetap}`);
  if (!d.sapaan) s.push('sapaan Miss Raksa tidak tampil');
  if (!d.h1.ada || d.h1.tampil) s.push(`h1: ada ${d.h1.ada}, tampil ${d.h1.tampil} (harus ada tetapi tidak tampil)`);
  if (d.potretKartu) s.push('potret kedua di kartu Mode Cerita tampil');
  if (d.judulSendiri) s.push('judul "Main sendiri" tampil');
  if (d.judulKartu !== kamus(lang, 'pintuCeritaJudul')) s.push(`judul kartu "${d.judulKartu}"`);
  if (JSON.stringify(d.isiKartu) !== JSON.stringify([kamus(lang, 'pintuCeritaIsiHp')])) s.push(`baris kartu ${JSON.stringify(d.isiKartu)}`);
  if (d.kepalaJoin && JSON.stringify(d.judulJoin) !== JSON.stringify([kamus(lang, 'joinTanya')])) s.push(`pertanyaan baris kode ${JSON.stringify(d.judulJoin)}`);
  if (d.isiJoin) s.push('kalimat Join tampil');
  if (d.kepalaJoin && (!d.potretJoin || Math.abs(d.potretJoin.w - 30) > 0.6)) s.push(`potret baris kode ${d.potretJoin?.w ?? 'tidak ada'} px (30)`);
  if (profil ? !d.sebagai || d.catatan : d.sebagai || !d.catatan) s.push(`profil ${profil}: baris profil ${!!d.sebagai}, catatan ${!!d.catatan}`);
  // sasaran ketuk
  const minMulai = tinggiPendek ? 50 : 54;
  if (d.mulai.h < minMulai - 0.6) s.push(`Mulai ${d.mulai.h} px (>= ${minMulai})`);
  if (d.mulai.w < d.kartu.w - 40) s.push(`Mulai ${d.mulai.w} px, tidak selebar kartu ${d.kartu.w}`);
  if (d.kode.h < 47.4 || d.masuk.h < 47.4) s.push(`kolom kode ${d.kode.h} / Masuk ${d.masuk.h} px (>= 48)`);
  if (d.vw >= 360 && Math.abs(d.kode.y - d.masuk.y) > 1) s.push('kolom kode dan Masuk tidak sebaris');
  for (const [nama, k] of [['ubah', d.ubah], ['Untuk panitia', d.panitia], ['bahasa', d.bahasa], ['suara', d.suara], ['tombol animasi', d.gerak]]) if (k && (k.w < 43.4 || k.h < 43.4)) s.push(`sasaran ${nama} ${k.w} x ${k.h} px (< 44)`);
  if (gerak ? !d.gerak || d.perusahaan : d.gerak || !d.perusahaan) s.push(`gerak dikurangi ${gerak}: tombol animasi ${!!d.gerak}, nama perusahaan ${d.perusahaan}`);
  if (Math.abs(d.footer.h - 44) > 0.6) s.push(`footer ${d.footer.h} px (satu baris 44)`);
  if (d.terpotong.length) s.push('teks terpotong: ' + d.terpotong.join(', '));
  return s;
}

const hasil = []; let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
const ringkas = (d) => ({ gulir: Math.round((d.sh - d.vh) * 10) / 10, hero: d.hero?.h ?? null, kartu: d.kartu?.h, mulai: [d.mulai?.w, d.mulai?.h], kode: [d.kode?.w, d.kode?.h], masuk: [d.masuk?.w, d.masuk?.h], barisKode: d.join?.h, footer: d.footer?.h, sisaBawah: Math.round((d.vh - d.footer.b) * 10) / 10 });
let b = null;
const batal = pasangPenjaga(14, () => { lapor('penjaga', false, { sebab: ['seluruh proses melewati batas waktu'] }); try { fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1)); } catch { /* abaikan */ } try { b?.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });

/** Satu kasus: buka, jalankan `isi(h, s)` (mengisi daftar sebab `s`, mengembalikan data ringkas), potret, lapor. */
async function kasus(mesin, nama, v, lang, opsi, isi) {
  const penuh = `${nama}${mesin === 'webkit' ? '-webkit' : ''}`;
  if (hanya && !penuh.includes(hanya)) return;
  let h = null; const s = []; let data = {};
  try {
    await denganBatas((async () => {
      h = await buka(mesin, b, v, lang, opsi);
      data = (await isi(h, s)) ?? {};
      if (h.galat.length) s.push('galat halaman: ' + h.galat.join(' | '));
      await h.p.screenshot({ path: path.join(OUT, `${penuh}.png`) });
    })(), 60000, penuh);
  } catch (e) { s.push('galat alat: ' + String(e?.message ?? e).slice(0, 200)); }
  lapor(penuh, s.length === 0, { sebab: s, ...data });
  await h?.tutup();
}

for (const mesin of MESIN) {
  b = await denganBatas(luncur(mesin), 45000, `luncur ${mesin}`);
  const chromium = mesin === 'chromium';
  // --- 12 layar sasaran (WebKit: id saja)
  for (const v of [HP_A, HP_B]) for (const lang of chromium ? ['id', 'en', 'zh'] : ['id']) for (const profil of [false, true]) {
    await kasus(mesin, `beranda-${v.n}-${lang}${profil ? '-profil' : ''}`, v, lang, { profil }, async (h, s) => {
      const d = await ukur(h.p);
      s.push(...periksaHp(d, lang, { profil, tinggiPendek: v.h < 700, heroTetap: v === HP_A ? 190 : null }));
      return ringkas(d);
    });
  }
  // --- ukuran lain (id)
  const lain = chromium
    ? [[vp(390, 664, 3), false], [vp(390, 664, 3), true], [vp(390, 844, 3), false], [vp(430, 932, 3), false], [vp(360, 700), true], [vp(375, 553), true], [vp(320, 568), true]]
    : [[vp(390, 664, 3), true]];
  for (const [v, profil] of lain) {
    await kasus(mesin, `beranda-${v.n}-id${profil ? '-profil' : ''}`, v, 'id', { profil }, async (h, s) => {
      const d = await ukur(h.p);
      const kecil = v.h < 640 || v.w < 360;
      const sebab = periksaHp(d, 'id', { profil, tinggiPendek: v.h < 700, tanpaHero: kecil });
      // Di bawah 360 px kolom kode dan Masuk bertumpuk (seperti dulu): baris kode lebih tinggi, pemeriksaan sebaris tidak berlaku.
      s.push(...sebab);
      return ringkas(d);
    });
  }
  if (chromium) {
    // --- keadaan (360x640, id, profil)
    await kasus(mesin, 'keadaan-kode-salah-360x640', HP_B, 'id', { profil: true }, async (h, s) => {
      const awal = await ukur(h.p);
      await h.p.type('.lp-join-kode', 'AB');
      await h.p.click('.lp-join-mulai');
      await tunggu(400);
      const d = await ukur(h.p);
      if (!d.galat || d.teksGalat !== kamus('id', 'joinKodeKurang')) s.push(`pesan kode salah: ${JSON.stringify(d.teksGalat)}`);
      if (d.kepalaJoin) s.push('pertanyaan masih tampil di samping pesan');
      if (d.galat && d.galat.b > d.form.y + 0.6) s.push('pesan tidak berada di atas kolom kode');
      if (Math.abs(d.join.h - awal.join.h) > 0.6) s.push(`baris kode ${awal.join.h} -> ${d.join.h} px`);
      if (d.sh - d.vh > 0.5) s.push(`gulir ${d.sh - d.vh} px`);
      if (new URL(await h.p.url()).pathname !== '/') s.push('kode salah tetap pindah halaman');
      return { barisKode: [awal.join.h, d.join.h], pesan: d.galat };
    });
    await kasus(mesin, 'keadaan-kode-WWWWWW-360x640', HP_B, 'id', { profil: true }, async (h, s) => {
      await h.p.type('.lp-join-kode', 'WWWWWW');
      await tunggu(250);
      const d = await ukur(h.p);
      if (d.kodeNilai !== 'WWWWWW' || !d.kodeMuat) s.push(`"WWWWWW" tidak muat di kolom ${d.kode.w} px (nilai ${d.kodeNilai})`);
      return { kolom: d.kode.w };
    });
    await kasus(mesin, 'keadaan-gerak-dikurangi-360x640', HP_B, 'id', { profil: true, gerakKurang: true }, async (h, s) => {
      const d = await ukur(h.p);
      s.push(...periksaHp(d, 'id', { profil: true, tinggiPendek: true, gerak: true }));
      return ringkas(d);
    });
    // --- spanduk acara kuis lama (jawaban /api/acara-terbuka diganti): kolom kode + Masuk tetap terlihat dan terpakai
    for (const v of [HP_A, HP_B]) {
      await kasus(mesin, `keadaan-spanduk-${v.n}`, v, 'id', { profil: true, spanduk: true }, async (h, s) => {
        const d = await ukur(h.p);
        if (!d.spanduk) { s.push('spanduk tidak tampil (server uji tanpa RAKSA_LEGACY=on?)'); return {}; }
        if (d.form.b > d.spanduk.y + 0.6) s.push(`spanduk (atas ${d.spanduk.y}) menutupi kolom kode / Masuk (bawah ${d.form.b})`);
        if (d.kartu.b > d.spanduk.y + 0.6) s.push('spanduk menutupi kartu Mode Cerita');
        s.push(...periksaHp(d, 'id', { profil: true, tinggiPendek: v.h < 700, tanpaHero: d.hero === null, spanduk: true }).filter((x) => !x.startsWith('footer')));
        await h.p.click('.alur-spanduk-gabung');
        await tunggu(300);
        const e = await ukur(h.p);
        if (e.kodeNilai !== 'AB12' || !e.fokus.includes('lp-join-mulai')) s.push(`tombol spanduk: kode "${e.kodeNilai}", fokus "${e.fokus}"`);
        return { ...ringkas(d), spanduk: d.spanduk, gulir: d.sh - d.vh };
      });
    }
    // --- papan ketik: urutan Tab = urutan layar (390x745, id, profil)
    await kasus(mesin, 'papan-ketik-390x745', { ...HP_A, dpr: 1 }, 'id', { profil: true }, async (h, s) => {
      const urut = [];
      for (let i = 0; i < 14; i++) {
        await h.p.keyboard.press('Tab');
        const f = await h.p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); return { tanda: e.matches('[data-pintu-cerita]') ? 'kartu' : e.matches('.lp-join-kode') ? 'kode' : e.matches('.lp-join-mulai') ? 'masuk' : e.matches('.alur-sebagai-ubah') ? 'ubah' : e.matches('.host-links summary') ? 'panitia' : e.matches('.pilih-bahasa select') ? 'bahasa' : e.matches('.sound-button') ? 'suara' : (e.className || e.tagName).toString().slice(0, 30), y: Math.round(r.top), x: Math.round(r.left) }; });
        if (!f || urut.some((u) => u.tanda === f.tanda)) break;
        urut.push(f);
      }
      const nama = urut.map((u) => u.tanda);
      const wajib = ['kartu', 'ubah', 'kode', 'masuk', 'panitia'];
      const letak = wajib.map((w) => nama.indexOf(w));
      if (letak.some((i) => i < 0) || letak.some((i, k) => k > 0 && i < letak[k - 1])) s.push(`urutan Tab ${JSON.stringify(nama)}: harus kartu, ubah, kode, masuk, panitia`);
      for (let i = 1; i < urut.length; i++) if (urut[i].y < urut[i - 1].y - 2 || (Math.abs(urut[i].y - urut[i - 1].y) <= 2 && urut[i].x < urut[i - 1].x)) s.push(`Tab melompat mundur di layar: ${urut[i - 1].tanda} -> ${urut[i].tanda}`);
      return { urutanTab: nama };
    });
    // --- HP mendatar: kedua pintu utuh di layar pertama (dulu D-08: Join Game di layar pertama), Mode Cerita lebih dulu
    for (const [v, profil] of [[vp(844, 390), false], [vp(844, 390), true], [vp(740, 360), true]]) {
      await kasus(mesin, `mendatar-${v.n}${profil ? '-profil' : ''}`, v, 'id', { profil }, async (h, s) => {
        const d = await ukur(h.p);
        if (d.kartu.y > d.join.y + 0.6) s.push('Mode Cerita di bawah baris kode');
        if (d.kartu.b > d.vh + 0.6 || d.join.b > d.vh + 0.6) s.push(`pintu di luar layar pertama: kartu ${d.kartu.b}, baris kode ${d.join.b}, layar ${d.vh}`);
        if (d.sw - d.vw > 0.5) s.push(`gulir mendatar ${d.sw - d.vw} px`);
        if (Math.abs(d.kartu.y - d.join.y) > 1.5 || d.join.x < d.kartu.r) s.push(`pintu tidak berdampingan: kartu ${JSON.stringify([d.kartu.x, d.kartu.y])}, baris kode ${JSON.stringify([d.join.x, d.join.y])}`);
        if (d.h1.tampil || !d.h1.ada) s.push('h1 harus ada tetapi tidak tampil');
        // Sasaran ketuk kartu = seluruh kartu (label Mulai hanya tanda di dalamnya).
        for (const [nama, k] of [['kartu Mode Cerita', d.kartu], ['kolom kode', d.kode], ['Masuk', d.masuk]]) if (k.h < 43.4) s.push(`sasaran ${nama} ${k.h} px (< 44)`);
        if (d.terpotong.length) s.push('teks terpotong: ' + d.terpotong.join(', '));
        if (d.mulai.h < d.masuk.h - 0.6) s.push(`Mulai (${d.mulai.w} x ${d.mulai.h}) lebih pendek daripada Masuk (${d.masuk.w} x ${d.masuk.h})`); // D-290
        return { gulir: d.sh - d.vh, kartu: [d.kartu.x, d.kartu.y, d.kartu.b], kode: [d.join.x, d.join.y, d.join.b], mulai: [d.mulai.w, d.mulai.h], masuk: [d.masuk.w, d.masuk.h], h1: d.h1.tampil, hero: d.hero?.h ?? null };
      });
    }
    // --- HP mendatar + spanduk acara: spanduk = pil di pita header (T-006), tidak menutupi kedua pintu yang kini berdampingan
    await kasus(mesin, 'mendatar-spanduk-844x390', vp(844, 390), 'id', { profil: true, spanduk: true }, async (h, s) => {
      const d = await ukur(h.p);
      if (!d.spanduk) { s.push('spanduk tidak tampil (server uji tanpa RAKSA_LEGACY=on?)'); return {}; }
      const kena = (a, b) => a.x < b.r - 0.6 && b.x < a.r - 0.6 && a.y < b.b - 0.6 && b.y < a.b - 0.6;
      if (kena(d.spanduk, d.kartu)) s.push(`spanduk menutupi kartu Mode Cerita: ${JSON.stringify([d.spanduk, d.kartu])}`);
      if (kena(d.spanduk, d.join)) s.push(`spanduk menutupi baris kode: ${JSON.stringify([d.spanduk, d.join])}`);
      if (d.kartu.b > d.vh + 0.6 || d.join.b > d.vh + 0.6) s.push(`pintu di luar layar pertama: kartu ${d.kartu.b}, baris kode ${d.join.b}, layar ${d.vh}`);
      if (d.sw - d.vw > 0.5) s.push(`gulir mendatar ${d.sw - d.vw} px`);
      await h.p.click('.alur-spanduk-gabung');
      await tunggu(300);
      const e = await ukur(h.p);
      if (e.kodeNilai !== 'AB12' || !e.fokus.includes('lp-join-mulai')) s.push(`tombol spanduk: kode "${e.kodeNilai}", fokus "${e.fokus}"`);
      return { spanduk: [d.spanduk.x, d.spanduk.y, d.spanduk.b], kartu: [d.kartu.x, d.kartu.y, d.kartu.b], kode: [d.join.x, d.join.y, d.join.b] };
    });
    // --- lebar: dua pintu di layar pertama, Mode Cerita di atas baris kode, teks panjang
    for (const [v, profil] of [[vp(1280, 800, 1), false], [vp(1280, 800, 1), true], [vp(768, 1024, 1), false]]) {
      await kasus(mesin, `lebar-${v.n}${profil ? '-profil' : ''}`, v, 'id', { profil }, async (h, s) => {
        const d = await ukur(h.p);
        if (d.kartu.y > d.join.y) s.push('Mode Cerita di bawah baris kode');
        if (d.kartu.b > d.vh + 0.6 || d.join.b > d.vh + 0.6) s.push(`pintu di luar layar pertama: kartu ${d.kartu.b}, kode ${d.join.b}, layar ${d.vh}`);
        if (!d.h1.tampil) s.push('h1 tidak tampil');
        if (JSON.stringify(d.isiKartu) !== JSON.stringify([kamus('id', 'pintuCeritaIsi')])) s.push(`kalimat kartu ${JSON.stringify(d.isiKartu)}`);
        if (JSON.stringify(d.judulJoin) !== JSON.stringify([kamus('id', 'joinJudul')]) || !d.isiJoin) s.push(`judul Join ${JSON.stringify(d.judulJoin)}, kalimat tampil ${d.isiJoin}`);
        if (!d.potretKartu) s.push('potret kartu tidak tampil');
        if (d.sw - d.vw > 0.5) s.push(`gulir mendatar ${d.sw - d.vw} px`);
        // D-290 (T-029 Fix 1): di layar lebar Mulai (pintu utama) tidak boleh lebih kecil daripada Masuk.
        if (d.mulai.h < d.masuk.h - 0.6) s.push(`Mulai (${d.mulai.w} x ${d.mulai.h}) lebih pendek daripada Masuk (${d.masuk.w} x ${d.masuk.h})`);
        return { gulir: d.sh - d.vh, kartu: [d.kartu.y, d.kartu.b], kode: [d.join.y, d.join.b], mulai: [d.mulai.w, d.mulai.h], masuk: [d.masuk.w, d.masuk.h] };
      });
    }
  }
  await denganBatas(b.close(), 15000, 'tutup browser').catch(() => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
  b = null;
  await tunggu(300);
}
batal();
if (!hanya) fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
