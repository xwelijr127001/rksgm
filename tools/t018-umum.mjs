/**
 * Bagian bersama alat uji T-018 (cek-gulir-t018.mjs = keluarga obrolan; cek-layar-t018.mjs = adegan, aktivitas, akhir).
 *
 * KENAPA berkas ini ada (16 Nov 2026): cek-gulir memuat cek-layar dengan import() dinamis dari dalam blok utamanya (top-level
 * await), sedangkan cek-layar mengimpor cek-gulir secara statis untuk luncur/bukaGulir/siap. Itu SIKLUS: modul cek-gulir belum
 * selesai dievaluasi (masih menunggu import() itu), jadi import() tidak pernah selesai dan seluruh proses menggantung tanpa pesan
 * (browser yang terbuka menahan proses tetap hidup). Sekarang kedua alat mengimpor pembantu dari SINI dan tidak saling mengimpor
 * secara statis.
 *
 * Aturan yang dijaga di sini (PC dipakai owner):
 *  - SATU browser pada satu waktu, ditutup tiap ganti ukuran layar (PerambanPerUkuran);
 *  - setiap kasus punya batas waktu (denganBatas): yang macet dilaporkan dengan namanya, halamannya ditutup, lanjut ke kasus berikut;
 *  - penjaga seluruh proses (pasangPenjaga): sesudah N menit browser dimatikan dan proses keluar dengan kode 2.
 */
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
export const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

export async function luncur(mesin) {
  if (mesin === 'chromium') {
    const pp = (await import('puppeteer-core')).default;
    return pp.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 60000 });
  }
  const { webkit } = await import('playwright-core');
  return webkit.launch({ headless: true, timeout: 30000 });
}

/** Halaman baru (konteks sendiri) di `mesin` dengan profil, bahasa dan progres tersimpan. Navigasi & evaluasi berbatas waktu. */
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
    p.setDefaultTimeout(20000); p.setDefaultNavigationTimeout(30000);
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    await p.evaluateOnNewDocument(skrip, awal);
  } else {
    ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    ctx.setDefaultTimeout(20000); ctx.setDefaultNavigationTimeout(30000);
    p = await ctx.newPage();
    await p.addInitScript(skrip, awal);
  }
  const galat = [];
  p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 160)));
  await p.goto(base + url + (lang === 'id' ? '' : `?lang=${lang}`), { waitUntil: 'domcontentloaded' });
  return { p, galat, tutup: () => denganBatas(ctx.close(), 10000, 'tutup konteks').catch(() => {}) };
}

/** Tunggu layar cerita siap dan indikator "sedang mengetik" selesai (paling lama `ms`). */
export async function siap(p, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await p.evaluate(() => ({ ada: !!document.querySelector('.hp-obrolan, .hp-vn, .cer-layar main'), ketik: !!document.querySelector('.hp-mengetik') })).catch(() => null);
    if (s?.ada && !s.ketik) break;
    await tunggu(150);
  }
  await denganBatas(p.evaluate(() => document.fonts?.ready.then(() => true)), 5000, 'font').catch(() => null);
  await tunggu(450);
}

export class BatasWaktu extends Error {}
/** `janji` atau galat BatasWaktu sesudah `ms` (timer dibersihkan). */
export function denganBatas(janji, ms, nama) {
  let t;
  return Promise.race([
    Promise.resolve(janji).finally(() => clearTimeout(t)),
    new Promise((_, tolak) => { t = setTimeout(() => tolak(new BatasWaktu(`batas waktu ${Math.round(ms / 1000)} d: ${nama}`)), ms); }),
  ]);
}

/**
 * Satu browser pada satu waktu, ditutup dan diluncurkan ulang tiap kali ukuran layar (vp.n) berganti.
 * `untuk(vp)` -> browser; `tutup()` di akhir; `bunuh()` dipakai penjaga.
 */
export class PerambanPerUkuran {
  constructor(mesin) { this.mesin = mesin; this.b = null; this.vp = null; this.luncuran = 0; }
  async untuk(vp) {
    if (this.b && this.vp === vp.n) return this.b;
    await this.tutup();
    this.b = await denganBatas(luncur(this.mesin), 45000, `luncur ${this.mesin}`);
    this.vp = vp.n; this.luncuran++;
    return this.b;
  }
  async tutup() {
    const b = this.b; this.b = null; this.vp = null;
    if (!b) return;
    await denganBatas(b.close(), 15000, 'tutup browser').catch(() => this.constructor.matikan(b));
    await tunggu(300);
  }
  bunuh() { if (this.b) this.constructor.matikan(this.b); this.b = null; }
  static matikan(b) { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } try { void b.close?.().catch(() => {}); } catch { /* abaikan */ } }
}

/**
 * Penjaga seluruh proses: sesudah `menit`, panggil `saatHabis()` (tulis hasil, matikan browser) lalu keluar dengan kode 2.
 * Mengembalikan fungsi pembatal. Timer TIDAK di-unref: justru dialah yang menjamin proses berakhir.
 */
export function pasangPenjaga(menit, saatHabis) {
  const t = setTimeout(() => {
    console.log(`PENJAGA: alat belum selesai sesudah ${menit} menit; browser dimatikan, keluar dengan kode 2.`);
    try { saatHabis(); } catch { /* abaikan */ }
    setTimeout(() => process.exit(2), 1500);
  }, menit * 60000);
  return () => clearTimeout(t);
}

/** Nilai argumen `--nama nilai` (atau bawaan). */
export const argumen = (nama, bawaan = null) => { const i = process.argv.indexOf(nama); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : bawaan; };
