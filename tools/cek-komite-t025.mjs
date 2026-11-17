/**
 * T-025: RUANG RAPAT KOMITE KLAIM di panggung piksel Episode 2 (anggota = sprite MILIK RUANG, digerakkan isyarat tata `komite`).
 * Dipanggil oleh tools/cek-piksel-t013.mjs (blok "komite") dan bisa dijalankan sendiri:
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-komite-t025.mjs [--bahasa=id,en,zh] [--vp=390x645,360x640] [--kasus=potongan]
 * State + teks harapan: team/evidence/T-025/states-komite.json (tools/cerita/state-komite-t025.mts, mesin cerita asli). Sel atlas,
 * letak dan peta keadaan: client/src/cerita/seni/piksel/ruang-ep2.json (blok `komite` ruang komite-ep2).
 *
 * Fix 1 (keputusan Lead): SETUJU hanya di ketukan pembuka K13. Berkas lengkap di K11 = ruang tetap menunggu (tanpa tanda).
 *   tunggu = pengantar K11, setuju = pembuka K13, catatan / kosong = akibat K11 (ajukan tanpa surat polisi / laporan ke Pak Hendra).
 * Fix 2 (review Designer): D-248 kotak fokus baru (252, 0, 1096 x 472) = SATU skala piksel per HP (tabel SKALA_HARAP: 390 px DPR 3
 *   = 4 piksel perangkat per piksel seni, kepala 48 px CSS; 360 px DPR 2 tetap 2); D-249 catatan status kartu akibat terlihat
 *   tanpa menggulir; D-253 ruang yang menunggu ditahan ~320 md sebelum tanda / anggukan pertama.
 * ruang-<keadaan>  4 keadaan (tunggu, setuju, catatan, kosong) x id / en / zh x 390x645 (DPR 3) dan 360x640 (DPR 2):
 *   - panggung piksel ruang komite-ep2, tanpa pemeran / panggilan / chip lokasi; halaman tidak menggulir;
 *   - pose tiap anggota dan tanda di atasnya = peta keadaan; GAMBARNYA dicocokkan piksel demi piksel dengan atlas pada skala
 *     piksel bulat: kepala tiap anggota yang duduk, lengan yang terangkat (di atas tepi meja), tanda SETUJU / CATATAN; dan yang
 *     TIDAK boleh ada memang tidak ada (tanda di keadaan tunggu, lengan di setuju, kepala di kursi kosong);
 *   - gerak masuk keadaan (perekam atribut): bingkai pertama = ruang yang MENUNGGU (pose diam, tanpa tanda) selama ~320 md,
 *     lalu tanda muncul SATU per SATU berjarak ~180 md dan kepala mengangguk dua kali (bingkai -1 0 1 0 1 -1), lalu diam;
 *   - kalimat ruang untuk pembaca layar = teks tabel bahasanya; teks ketukan dalam bahasanya (tanpa kata Indonesia di en / zh);
 *   - kamera: skala = SKALA_HARAP (tidak pernah di bawah 1 px CSS per piksel seni), kotak fokus (papan, tanda, kepala) utuh, dan
 *     SAMA untuk keempat keadaan pada kotak panggung yang sama (keadaan tidak pernah menghitung ulang kamera);
 *   - kartu akibat (catatan, kosong): akibat berkas + akibat kabar = teks tabel, baris "Kenapa" = alasannya, dan catatan status
 *     terlihat tanpa menggulir kotak dialog (D-249: kabar K11-E tidak lagi mengulang kalimat alasan).
 * gerak-dikurangi  setuju + catatan: sejak bingkai pertama semua tanda ada, tidak ada bingkai angguk, gambar akhirnya identik
 *                  dengan gambar akhir gerak normal.  kedip: di keadaan tunggu ada anggota yang berkedip (gerak normal), dan
 *                  tidak ada satu pun saat gerak dikurangi.
 * hasil-lengkapi   akibat K11 berkas lengkap (tanpa kabar) x id / en / zh x 2 ukuran: ruang MENUNGGU, tidak ada tanda yang pernah
 *                  muncul (perekam + piksel), dua akibat berlabel + catatan status di kartu itu.
 * skala            D-248, HP lain (390x844, 393x852, 430x932 DPR 3; 320x568 DPR 2), id: lima layar ruang ini (pengantar K11,
 *                  tiga akibat tanpa kabar, pembuka K13) memakai dua bentuk panggung (16 : 10 dan 2 : 1) dan harus berskala SAMA
 *                  = SKALA_HARAP; kepala + tanda cocok dengan atlas pada skala itu; 320 px bukan setengah ukuran.
 * istilah          "Apa itu Komite Klaim?": arti + deret empat ikon 32 px (sel berbeda, satu baris) + peran dalam bahasanya
 *                  (Fix 2, D-251: kursi pertama "Ketua" / "Chair" / "主席"; label bersebelahan berjarak >= 8 px),
 *                  digulir ke dalam kotak dialog; panggung tidak bergeser; halaman tidak menggulir.
 * alur             tugas K11: ruang -> aktivitas -> kembali (ruang sama) -> selesai: berkas lengkap = ruang tetap menunggu tanpa
 *                  tanda; tanpa surat polisi = dua CATATAN muncul satu per satu saat tiba. K11 dengan kabar terkirim: ketukan ruang
 *                  (tanpa catatan status) -> Lanjut -> obrolan: pesan terkirim terlihat, balasan, akibat kabar, catatan status.
 *                  K13: ketukan ruang (setuju) -> Lanjut -> obrolan langsung (tanpa gerbang) dengan pesan Pak Hendra dan tombol balas.
 * Tangkapan layar -> team/evidence/T-025/fullstack/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
export const OUT_KOMITE = path.join(ROOT, 'team/evidence/T-025/fullstack');
export const VP_KOMITE = [{ n: '390x645', w: 390, h: 645, dpr: 3 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
/** Fix 2 (D-248): HP lain tempat skala ruang diukur (iPhone 12-14, 15 / 16, Pro Max; 320 px = HP paling sempit). */
export const VP_SKALA = [{ n: '390x844', w: 390, h: 844, dpr: 3 }, { n: '393x852', w: 393, h: 852, dpr: 3 }, { n: '430x932', w: 430, h: 932, dpr: 3 }, { n: '320x568', w: 320, h: 568, dpr: 2 }];
/**
 * Fix 2 (D-248): piksel perangkat per piksel seni yang diharapkan per HP (`lebar layar@DPR`). SATU skala per HP: sama untuk bentuk
 * panggung sedang (16 : 10) dan pendek (2 : 1). 390 / 393 / 430 px DPR 3 = 4 (1,33 px CSS: kepala 36 piksel seni = 48 px CSS, sama
 * dengan pool dan tol); 360 px DPR 2 dan 320 px DPR 2 = 2 (1 px CSS). Angka = fungsi kamera client (adegan.test.ts, uji kamera).
 */
export const SKALA_HARAP = { '390@3': 4, '393@3': 4, '430@3': 4, '360@2': 2, '320@2': 2 };
const KEADAAN = ['tunggu', 'setuju', 'catatan', 'kosong'];
/**
 * Keadaan ruang -> ketukan tempat ia tampil (state tersimpan bernama sama): teks ketukan dari tabel bahasanya, dan apakah itu
 * ketukan akibat K11 tanpa kabar (dua akibat berlabel + catatan status di kartu ruang).
 */
const KASUS_RUANG = {
  tunggu: { teks: (H) => H.k11, akibat: false },
  setuju: { teks: (H) => H.k13, akibat: false },
  catatan: { teks: (H) => H.berkas.sekarang, akibat: true, alt: 'b' },
  kosong: { teks: (H) => H.berkas.hendra, akibat: true, alt: 'e' },
};
/**
 * Fix 2 (D-249): kartu akibat K11 tanpa kabar (alt b / c / e). Akibat berkas + akibat kabar = teks tabel PERSIS (kabar K11-E tidak
 * lagi diakhiri kalimat alasannya), baris "Kenapa" memuat alasan alt itu, dan catatan status terlihat tanpa menggulir kotak dialog.
 */
function nilaiKartuAkibat(d, H, tindakan, alt) {
  const s = [];
  if (JSON.stringify(d.akibat) !== JSON.stringify([[H.topik.berkas, H.berkas[tindakan]], [H.topik.kabar, H.kabar[alt]]])) s.push('akibat di kartu bukan teks tabel: ' + JSON.stringify(d.akibat).slice(0, 200));
  if (!d.kenapa || !d.kenapa.includes(H.alasan[alt])) s.push('baris alasan bukan alasan tabel: ' + JSON.stringify(d.kenapa));
  if (!d.status || !d.statusTerlihat || d.lebihDialog > 1) s.push(`catatan status di bawah lipatan: kotak dialog menggulir ${d.lebihDialog} px`);
  return s;
}
const PROFIL = JSON.stringify({ nickname: 'Weli', look: { body: 0, skin: 0, hair: 0, color: 0, accessory: 'none' } });
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
/** Kata fungsi Indonesia (sama dengan tools/cek-bahasa-t014.mjs): tidak boleh ada di teks en / zh. */
const KATA_ID = /(^|[^A-Za-z])(yang|dan|atau|ke|di|dari|hari|minggu|ada|ini|itu|juga|tidak|untuk|dengan|sudah|belum|saya|kamu|truk|Pak|Bapak|klaim|bengkel|lajur|rambu|supir|berkas|surat)(?![A-Za-z])/;
const BATAS = 60000;
const denganBatas = (janji, ms, nama) => { let t; return Promise.race([Promise.resolve(janji).finally(() => clearTimeout(t)), new Promise((_, tolak) => { t = setTimeout(() => tolak(new Error(`batas waktu ${Math.round(ms / 1000)} d: ${nama}`)), ms); })]); };

/** Halaman baru di state `nilai`. Gerak sistem dinyatakan eksplisit (tidak ikut setelan Windows PC ini); perekam atribut dipasang. */
async function buka(b, BASE, vp, lang, nilai, { kurang = false } = {}) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  p.setDefaultTimeout(20000); p.setDefaultNavigationTimeout(30000);
  await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: kurang ? 'reduce' : 'no-preference' }]);
  await p.evaluateOnNewDocument((pj, bahasa, st) => {
    localStorage.setItem('raksa:bahasa', bahasa); localStorage.setItem('raksa:profil', pj); sessionStorage.setItem('raksa:loader:v1', '1'); localStorage.setItem('raksa:cerita', st);
    // Perekam: tiap perubahan atribut sprite ruang di kanvas panggung, dengan waktunya (md).
    window.__komite = [];
    const catat = () => {
      const c = document.querySelector('.hp-vn .cer-piksel-kanvas'); if (!c) return;
      const siap = c.closest('.cer-piksel')?.hasAttribute('data-siap') ? 1 : 0;
      const v = [c.getAttribute('data-komite-anggota') ?? '', c.getAttribute('data-komite-tanda') ?? '', c.getAttribute('data-komite-gerak') ?? '', siap].join('|');
      const a = window.__komite; if (!a.length || a[a.length - 1].v !== v) a.push({ t: Math.round(performance.now()), v });
    };
    new MutationObserver(catat).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-komite-anggota', 'data-komite-tanda', 'data-komite-gerak', 'data-siap'] });
  }, PROFIL, lang, nilai);
  const galat = [];
  p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 160)));
  const q = [lang === 'id' ? '' : `lang=${lang}`, kurang ? 'gerak=ikut' : ''].filter(Boolean).join('&');
  await p.goto(BASE + '/cerita/auto-2' + (q ? '?' + q : ''), { waitUntil: 'domcontentloaded' });
  return { p, galat, tutup: () => denganBatas(ctx.close(), 10000, 'tutup konteks').catch(() => {}) };
}
/** Tunggu panggung piksel siap dan gerak masuk keadaan selesai. */
async function ruangDiam(p, ms = 12000) {
  await p.waitForFunction(() => { const c = document.querySelector('.hp-vn .cer-piksel-kanvas'); return !!c && !!c.closest('.cer-piksel')?.hasAttribute('data-siap') && (c.getAttribute('data-komite-gerak') ?? 'diam') === 'diam'; }, { timeout: ms }).catch(() => null);
  await p.evaluate(() => document.fonts?.ready.then(() => true)).catch(() => null);
  await tunggu(450);
}
const klik = (p, sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; }, sel);
async function ketuk(p, sel) {
  const k = await p.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; }, sel);
  if (!k) return false;
  await p.mouse.click(k[0], k[1]);
  return true;
}

/** Keadaan panggung + pencocokan piksel dengan atlas. `km` = blok komite manifest ruang. */
const ukurRuang = (p, km) => p.evaluate(async (km) => {
  const el = document.querySelector('.hp-vn .cer-latar'); const c = el?.querySelector('.cer-piksel-kanvas');
  if (!el || !c) return null;
  const vv = window.visualViewport; const se = document.scrollingElement; const r = el.getBoundingClientRect();
  const k = Number(el.getAttribute('data-k'));
  const [kx, ky, luas] = (el.getAttribute('data-kamera') ?? '').split(',');
  const [vw, vh] = (luas ?? '').split('x').map(Number);
  const sumber = performance.getEntriesByType('resource').map((x) => x.name);
  const urlAtlas = sumber.find((u) => /\/komite-(?!ikon)[^/]*\.png$/.test(u)); const urlTanda = sumber.find((u) => /\/ep2-komite-tanda-[^/]*\.png$/.test(u));
  const muat = (url) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('gambar ' + url)); i.src = url; });
  const data = (img) => { const x = document.createElement('canvas'); x.width = img.naturalWidth; x.height = img.naturalHeight; const g = x.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, x.width, x.height); };
  const atlas = urlAtlas ? data(await muat(urlAtlas)) : null; const tanda = urlTanda ? data(await muat(urlTanda)) : null;
  const pg = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  let hash = 0; for (let i = 0; i < pg.data.length; i += 7) hash = (hash * 31 + pg.data[i]) | 0;
  // Sel atlas [sx, sy, sw, sh] di piksel seni (ax, ay): bagian piksel TAK TEMBUS yang warnanya berbeda dari kanvas, pada geseran
  // terbaik dalam +- k piksel perangkat (data-kamera dibulatkan). yMaks = baris seni pertama yang tidak dihitung (tertutup meja).
  const cocok = (img, sel, ax, ay, yMaks = Infinity) => {
    if (!img) return { beda: 1, piksel: 0 };
    const [sx, sy, sw, sh] = sel; let terbaik = 1, jumlah = 0;
    for (let oy = -k; oy <= k; oy++) for (let ox = -k; ox <= k; ox++) {
      let beda = 0, n = 0;
      for (let j = 0; j < sh && ay + j < yMaks; j++) for (let i = 0; i < sw; i++) {
        const a = ((sy + j) * img.width + sx + i) * 4; if (img.data[a + 3] < 255) continue;
        const X = Math.round((ax + i) * k - (Number(kx) * k) / 4) + ox + (k >> 1), Y = Math.round((ay + j) * k - (Number(ky) * k) / 4) + oy + (k >> 1);
        n++;
        if (X < 0 || Y < 0 || X >= pg.width || Y >= pg.height) { beda++; continue; }
        const q = (Y * pg.width + X) * 4;
        if (img.data[a] !== pg.data[q] || img.data[a + 1] !== pg.data[q + 1] || img.data[a + 2] !== pg.data[q + 2]) beda++;
      }
      const bagian = n ? beda / n : 1; if (bagian < terbaik) { terbaik = bagian; jumlah = n; }
    }
    return { beda: Math.round(terbaik * 1000) / 1000, piksel: jumlah };
  };
  const mejaAtas = 112; // tepi atas lapisan meja (piksel seni): di bawahnya tubuh tertutup meja
  const anggota = {};
  for (const a of km.anggota) {
    const bx = a.bingkai.x / 4, by = a.bingkai.y / 4; const tl = km.tanda.letak[a.id];
    anggota[a.id] = {
      kepala: cocok(atlas, a.sel.kepala, bx + a.letak.kepala[0], by + a.letak.kepala[1]),
      tangan: cocok(atlas, a.sel.tangan, bx + a.letak.tangan[0], by + a.letak.tangan[1], mejaAtas),
      setuju: cocok(tanda, km.tanda.sel.setuju, tl.x / 4, tl.y / 4), catatan: cocok(tanda, km.tanda.sel.catatan, tl.x / 4, tl.y / 4),
    };
  }
  window.scrollTo(0, 99999); const gulirHalaman = Math.round(window.scrollY); window.scrollTo(0, 0);
  const dialog = document.querySelector('.hp-vn-dialog:not([data-bayangan])');
  // Fix 2 (D-249): kotak gulir dialog + catatan status (harus terlihat tanpa menggulir), akibat berlabel, baris "Kenapa".
  const isiDialog = dialog?.querySelector('.hp-vn-isi'); const ird = isiDialog?.getBoundingClientRect(); const srd = dialog?.querySelector('.hp-status-catatan')?.getBoundingClientRect();
  const akibat = [...(dialog?.querySelectorAll('.hp-narasi[data-topik]') ?? [])].map((x) => { const label = x.querySelector('.hp-topik')?.textContent ?? ''; return [label.trim(), x.textContent.slice(label.length).trim()]; });
  return {
    tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), node: document.querySelector('.hp-main')?.getAttribute('data-node'),
    gaya: el.getAttribute('data-gaya'), lokasi: el.getAttribute('data-lokasi'), ruang: el.getAttribute('data-ruang'), hadir: el.getAttribute('data-hadir'), telepon: el.getAttribute('data-telepon'), objek: el.getAttribute('data-objek'),
    komite: el.getAttribute('data-komite'), k, dpr: window.devicePixelRatio, lebar: window.innerWidth, kamera: el.getAttribute('data-kamera'), pandang: [Number(kx), Number(ky), vw, vh],
    poseAnggota: c.getAttribute('data-komite-anggota') ?? '', tanda: c.getAttribute('data-komite-tanda') ?? '', gerak: c.getAttribute('data-komite-gerak'), siap: !!el.querySelector('.cer-piksel[data-siap]'),
    aria: el.querySelector('[data-komite-aria]')?.textContent ?? null, ariaHidup: el.querySelector('[data-komite-aria]')?.getAttribute('aria-live') ?? null, chip: !!el.querySelector('.cer-latar-lokasi'), kanvasTersembunyi: el.querySelector('.cer-piksel')?.getAttribute('aria-hidden'),
    kotak: [Math.round(r.width), Math.round(r.height)], kotakDalam: r.left >= -0.5 && r.top >= -0.5 && r.right <= vv.width + 0.5 && r.bottom <= vv.height + 0.5, bentuk: document.querySelector('.hp-vn')?.getAttribute('data-panggung'),
    halaman: [se.scrollHeight, window.innerHeight], gulirHalaman, atlas: !!atlas, gambarTanda: !!tanda, anggota, hash,
    teks: dialog?.innerText ?? '', topik: [...(dialog?.querySelectorAll('.hp-topik') ?? [])].map((x) => x.textContent.trim()), status: !!dialog?.querySelector('.hp-status-catatan'),
    statusTerlihat: !!srd && !!ird && srd.height > 0 && srd.top >= ird.top - 0.5 && srd.bottom <= ird.bottom + 0.5, lebihDialog: isiDialog ? Math.max(0, isiDialog.scrollHeight - isiDialog.clientHeight) : null,
    akibat, kenapa: dialog?.querySelector('.hp-status-catatan .hp-kenapa')?.textContent.trim() ?? null,
    rekam: window.__komite.filter((x) => x.v.endsWith('|1')).map((x) => ({ t: x.t, v: x.v })),
  };
}, km);

/** Nilai satu keadaan ruang. `harap` = teks tabel bahasanya; `km` = blok manifest. Mengembalikan daftar sebab gagal. */
function nilaiRuang(d, keadaan, lang, harap, km, { kurang = false, hanyaPanggung = false } = {}) {
  const s = [];
  if (!d) return ['panggung tidak ada'];
  if (d.tampilan !== 'adegan' || d.gaya !== 'piksel' || d.lokasi !== 'komite' || d.ruang !== 'komite-ep2' || !d.siap) s.push('bukan panggung piksel ruang komite: ' + JSON.stringify([d.tampilan, d.gaya, d.lokasi, d.ruang, d.siap]));
  if (d.komite !== keadaan) s.push(`data-komite ${d.komite}, seharusnya ${keadaan}`);
  if (d.hadir || d.telepon || d.objek) s.push('ruang komite berpemeran / bertelepon / berobjek: ' + JSON.stringify([d.hadir, d.telepon, d.objek]));
  if (d.chip) s.push('chip lokasi tampil (menutupi tanda)');
  if (d.kanvasTersembunyi !== 'true') s.push('kanvas tidak aria-hidden');
  // (hanyaPanggung: HP di bawah 360 px, di luar ukuran yang dijamin tata letak cangkang; di sana hanya panggungnya yang dinilai)
  if (!hanyaPanggung && (d.halaman[0] > d.halaman[1] + 0.5 || d.gulirHalaman !== 0)) s.push(`halaman menggulir ${d.halaman[0]} > ${d.halaman[1]}`);
  if (!hanyaPanggung && !d.kotakDalam) s.push('kotak panggung di luar layar');
  if (d.gerak !== 'diam') s.push('gerak ruang belum selesai: ' + d.gerak);
  // Peta keadaan -> pose + tanda (bingkai akhir).
  const K = km.keadaan[keadaan];
  const poseHarap = km.anggota.filter((a) => K.pose[a.id]).map((a) => `${a.id}:${K.pose[a.id]}:-1`).join(' ');
  // (keadaan menunggu: anggota boleh sedang berkedip saat diukur; tambalan matanya menutupi sebagian kepala selama 120 md)
  const kedipKini = new Set(d.poseAnggota.split(' ').filter((x) => /:kedip$/.test(x)).map((x) => x.split(':')[0]));
  if (d.poseAnggota.replace(/:kedip/g, '') !== poseHarap) s.push(`pose "${d.poseAnggota}", seharusnya "${poseHarap}"`);
  if (kedipKini.size && !K.kedip) s.push('anggota berkedip di keadaan tanpa kedip: ' + [...kedipKini].join(' '));
  const tandaHarap = (K.urutan ?? []).map((id) => `${id}:${K.tanda[id]}`).join(' ');
  if (d.tanda !== tandaHarap) s.push(`tanda "${d.tanda}", seharusnya "${tandaHarap}"`);
  // Gambar: yang harus ada cocok dengan atlas; yang tidak boleh ada memang tidak ada.
  if (!d.atlas || !d.gambarTanda) s.push('atlas / gambar tanda tidak diminta halaman');
  for (const a of km.anggota) {
    const x = d.anggota[a.id]; const pose = K.pose[a.id]; const jenis = K.tanda[a.id];
    // (lengan sendiri boleh menutupi 1-2 kolom kepala: batas 3 %)
    if (pose && x.kepala.beda > (kedipKini.has(a.id) ? 0.2 : 0.03)) s.push(`kepala ${a.id} tidak cocok dengan atlas (${x.kepala.beda})`);
    if (!pose && x.kepala.beda < 0.3) s.push(`kepala ${a.id} tergambar di kursi kosong (${x.kepala.beda})`);
    if (pose === 'angkat' && x.tangan.beda > 0.01) s.push(`lengan ${a.id} tidak cocok dengan atlas (${x.tangan.beda})`);
    if (pose !== 'angkat' && x.tangan.beda < 0.3) s.push(`lengan ${a.id} terangkat di keadaan ${keadaan} (${x.tangan.beda})`);
    for (const t of ['setuju', 'catatan']) {
      if (jenis === t && x[t].beda > 0) s.push(`tanda ${t} ${a.id} tidak cocok dengan seni (${x[t].beda})`);
      if (jenis !== t && x[t].beda < 0.3) s.push(`tanda ${t} tergambar di atas ${a.id} (${x[t].beda})`);
    }
  }
  // Kamera (Fix 2, D-248): piksel bulat, SATU skala per HP (SKALA_HARAP), tidak pernah di bawah 1 px CSS per piksel seni; kotak
  // fokus ruang (papan, tanda, kepala) di dalam pandangan.
  const kHarap = SKALA_HARAP[`${d.lebar}@${d.dpr}`];
  if (d.k !== kHarap) s.push(`skala ${d.k} px perangkat per piksel seni di layar ${d.lebar} px DPR ${d.dpr} (seharusnya ${kHarap})`);
  if (d.k < d.dpr) s.push(`ruang lebih kecil dari 1 px CSS per piksel seni (${d.k} px perangkat pada DPR ${d.dpr})`);
  const [kx, ky, vw, vh] = d.pandang; const f = km.__fokus;
  if (!(kx <= f.x + 1 && kx + vw >= f.x + f.w - 1 && ky <= f.y + 1 && ky + vh >= f.y + f.h - 1)) s.push(`kotak fokus tidak utuh di pandangan ${d.kamera}`);
  // Kalimat ruang (pembaca layar) + teks ketukan dalam bahasanya.
  if (d.aria !== harap.kalimat[keadaan]) s.push(`kalimat ruang "${d.aria}", seharusnya "${harap.kalimat[keadaan]}"`);
  if (d.ariaHidup !== 'polite') s.push('kalimat ruang bukan wilayah hidup');
  if (lang !== 'id') { const indo = d.teks.split('\n').map((x) => x.trim()).filter((x) => x && KATA_ID.test(x)); if (indo.length) s.push(`kata Indonesia di ${lang}: ${indo.slice(0, 2).join(' | ')}`); }
  // Gerak masuk keadaan (perekam, hanya sejak PNG siap).
  const rekam = d.rekam.map((x) => { const [ang, tnd, gerak] = x.v.split('|'); return { t: x.t, tanda: tnd ? tnd.split(' ').length : 0, bingkai: (/^[a-z]+:[a-z]+:(-?\d+)/.exec(ang) ?? [])[1] ?? null, kedip: /:kedip/.test(ang), gerak }; });
  const jumlahTanda = (K.urutan ?? []).length;
  if (kurang || jumlahTanda === 0) {
    if (rekam.some((x) => x.tanda !== jumlahTanda || (x.bingkai !== null && x.bingkai !== '-1') || x.gerak !== 'diam')) s.push('ada gerak masuk padahal ' + (kurang ? 'gerak dikurangi' : 'keadaan diam') + ': ' + JSON.stringify(rekam.slice(0, 6)));
  } else {
    // Fix 2 (D-253): bingkai pertama = ruang yang MENUNGGU (0 tanda, semua anggota berpose keadaan tunggu) selama ~320 md; baru
    // kemudian tanda muncul satu per satu.
    const muncul = []; for (const x of rekam) if (!muncul.length || x.tanda > muncul[muncul.length - 1].n) muncul.push({ n: x.tanda, t: x.t });
    const urut = muncul.map((x) => x.n).join(' ');
    if (urut !== Array.from({ length: jumlahTanda + 1 }, (_, i) => i).join(' ')) s.push(`tanda tidak muncul satu per satu sesudah ruang menunggu: ${urut}`);
    else {
      const tahan = muncul[1].t - muncul[0].t;
      if (tahan < 240 || tahan > 520) s.push(`ruang menunggu ditahan ${tahan} md sebelum tanda pertama (seharusnya ~320)`);
      const jeda = muncul.slice(2).map((x, i) => x.t - muncul[i + 1].t);
      if (jeda.some((x) => x < 110 || x > 360)) s.push(`jeda antartanda ${jeda.join(' / ')} md (naskah seni: 180)`);
    }
    const awal = d.rekam[0]?.v.split('|')[0] ?? '';
    const awalHarap = km.anggota.filter((a) => K.pose[a.id]).map((a) => `${a.id}:${km.keadaan.tunggu.pose[a.id]}:-1`).join(' ');
    if (awal !== awalHarap) s.push(`bingkai pertama bukan ruang menunggu: "${awal}"`);
    if (K.pose[km.anggota[0].id] === 'angguk') {
      const bingkai = []; for (const x of rekam) if (x.bingkai !== null && bingkai[bingkai.length - 1] !== x.bingkai) bingkai.push(x.bingkai);
      if (bingkai.join(' ') !== '-1 0 1 0 1 -1') s.push(`bingkai angguk ${bingkai.join(' ')} (seharusnya -1 0 1 0 1 -1: menunggu, dua anggukan, diam)`);
    }
  }
  return s;
}
const ringkasRekam = (d) => { const a = d.rekam; if (!a.length) return []; const t0 = a[0].t; return a.map((x) => { const [ang, tnd] = x.v.split('|'); return `${x.t - t0}:${(/:(-?\d+)/.exec(ang) ?? [])[1] ?? '-'}:${tnd ? tnd.split(' ').length : 0}`; }); };

/** Lembar istilah "Apa itu Komite Klaim?" di ketukan pengantar K11. */
async function periksaIstilah(p, lang, harap) {
  const s = [];
  const ukur = () => p.evaluate(() => {
    const el = document.querySelector('.hp-vn .cer-latar'); const r = el?.getBoundingClientRect(); const se = document.scrollingElement;
    const kotak = document.querySelector('.hp-vn-isi[data-gulir-dialog]'); const kr = kotak?.getBoundingClientRect();
    const arti = document.querySelector('[data-istilah-arti="komite"]'); const ar = arti?.getBoundingClientRect();
    const tombol = document.querySelector('[data-istilah="komite"]');
    const butir = [...(arti?.querySelectorAll('.cer-istilah-anggota li') ?? [])].map((li) => {
      const ik = li.querySelector('.cer-istilah-ikon'); const ir = ik?.getBoundingClientRect(); const g = ik ? getComputedStyle(ik) : null; const tk = li.querySelector('span:not(.cer-istilah-ikon)'); const tr = tk?.getBoundingClientRect();
      // Fix 2 (D-251): tepi kiri / kanan TINTA label (bukan kotak kolomnya), untuk jarak antarlabel yang bersebelahan.
      const rg = document.createRange(); if (tk) rg.selectNodeContents(tk); const tinta = tk ? [...rg.getClientRects()] : [];
      return { kiri: tinta.length ? Math.min(...tinta.map((x) => x.left)) : null, kanan: tinta.length ? Math.max(...tinta.map((x) => x.right)) : null, kolom: Math.round(li.getBoundingClientRect().width * 10) / 10,
        teks: tk?.textContent.trim() ?? '', ikon: ik?.getAttribute('data-ikon') ?? null, ukuran: ir ? [Math.round(ir.width * 10) / 10, Math.round(ir.height * 10) / 10] : null, atas: ir ? Math.round(ir.top) : null, letak: g?.backgroundPosition ?? null, luas: g?.backgroundSize ?? null, gambar: g?.backgroundImage ?? '', render: g?.imageRendering ?? null, tersembunyi: ik?.getAttribute('aria-hidden'),
        baris: tk ? Math.round(tr.height / parseFloat(getComputedStyle(tk).lineHeight)) : 0, luap: tk ? tk.scrollWidth > tk.clientWidth + 1 || li.scrollWidth > li.clientWidth + 1 : false, dalam: !!ar && !!tr && tr.left >= ar.left - 0.5 && tr.right <= ar.right + 0.5 };
    });
    return {
      panggung: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, kamera: el?.getAttribute('data-kamera') ?? null, halaman: [se.scrollHeight, window.innerHeight], gulirY: Math.round(window.scrollY),
      terbuka: tombol?.getAttribute('aria-expanded') ?? null, tombol: tombol?.textContent.trim() ?? null, tombolTinggi: tombol ? Math.round(tombol.getBoundingClientRect().height) : 0,
      arti: arti && !arti.hidden ? (arti.querySelector(':scope > p')?.textContent.trim() ?? arti.textContent.trim()) : null, artiTag: arti?.tagName ?? null, daftar: arti?.querySelector('.cer-istilah-anggota')?.tagName ?? null, butir,
      artiDiKotak: !!ar && !!kr && ar.height > 0 && ar.top >= kr.top - 0.5 && ar.bottom <= kr.bottom + 0.5, tombolDiKotak: !!tombol && !!kr && tombol.getBoundingClientRect().top >= kr.top - 0.5,
      kotak: kotak ? [kotak.clientHeight, kotak.scrollHeight, Math.round(kotak.scrollTop)] : null, aksi: (() => { const a = document.querySelector('.hp-vn-aksi .primary-action')?.getBoundingClientRect(); return !!a && a.bottom <= window.visualViewport.height + 0.5 && a.top >= 0; })(),
    };
  });
  const sebelum = await ukur();
  if (!sebelum.tombol || !sebelum.tombol.includes(harap.istilah.label) || sebelum.terbuka !== 'false') return { sebab: ['tombol istilah Komite tidak ada / sudah terbuka: ' + JSON.stringify([sebelum.tombol, sebelum.terbuka])], data: {} };
  if (sebelum.tombolTinggi < 44) s.push(`tombol istilah ${sebelum.tombolTinggi} px < 44`);
  if (!(await ketuk(p, '[data-istilah="komite"]'))) return { sebab: ['tombol istilah tidak bisa diketuk'], data: {} };
  await tunggu(900); // gulir halus kotak dialog
  const d = await ukur();
  if (d.terbuka !== 'true' || d.arti !== harap.istilah.arti) s.push('arti: ' + JSON.stringify([d.terbuka, d.arti]));
  if (d.daftar !== 'UL' || d.butir.length !== 4) s.push('deret anggota: ' + JSON.stringify([d.daftar, d.butir.length]));
  else {
    if (JSON.stringify(d.butir.map((x) => x.teks)) !== JSON.stringify(harap.istilah.anggota.map((x) => x.teks))) s.push('peran: ' + JSON.stringify(d.butir.map((x) => x.teks)));
    if (JSON.stringify(d.butir.map((x) => x.ikon)) !== JSON.stringify(harap.istilah.anggota.map((x) => x.ikon))) s.push('ikon: ' + JSON.stringify(d.butir.map((x) => x.ikon)));
    if (d.butir.some((x) => !x.ukuran || x.ukuran[0] !== 32 || x.ukuran[1] !== 32 || x.luas !== '128px 32px' || x.render !== 'pixelated' || !/komite-ikon/.test(x.gambar) || x.tersembunyi !== 'true')) s.push('ikon bukan sel 32 x 32 piksel: ' + JSON.stringify(d.butir.map((x) => [x.ukuran, x.luas, x.render])));
    if (JSON.stringify(d.butir.map((x) => x.letak)) !== JSON.stringify(['0px 0px', '-32px 0px', '-64px 0px', '-96px 0px'])) s.push('sel ikon: ' + JSON.stringify(d.butir.map((x) => x.letak)));
    if (new Set(d.butir.map((x) => x.atas)).size !== 1) s.push('ikon tidak sebaris: ' + JSON.stringify(d.butir.map((x) => x.atas)));
    if (d.butir.some((x) => x.luap || !x.dalam || x.baris < 1 || x.baris > 2)) s.push('peran terpotong / keluar kotak / lebih dari 2 baris: ' + JSON.stringify(d.butir.map((x) => [x.teks, x.baris, x.luap, x.dalam])));
    // Fix 2 (D-251): label yang bersebelahan berjarak >= 8 px (dulu "Committee" dan "Underwriter" 4 px: terbaca satu frasa).
    const celah = d.butir.slice(1).map((x, i) => Math.round((x.kiri - d.butir[i].kanan) * 10) / 10);
    if (celah.some((x) => !(x >= 8))) s.push('label peran bersebelahan kurang dari 8 px: ' + JSON.stringify(celah));
    // Gambar ikon benar-benar termuat (128 x 32).
    const img = await p.evaluate(async () => { const u = /url\("?([^")]+)"?\)/.exec(getComputedStyle(document.querySelector('.cer-istilah-ikon')).backgroundImage)?.[1]; if (!u) return null; return new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok(null); i.src = u; }); });
    if (JSON.stringify(img) !== '[128,32]') s.push('gambar ikon tidak termuat / bukan 128 x 32: ' + JSON.stringify(img));
  }
  if (!d.artiDiKotak) s.push('arti yang dibuka tidak terlihat utuh di kotak dialog: ' + JSON.stringify(d.kotak));
  if (!d.aksi) s.push('tombol utama keluar layar');
  if (d.halaman[0] > d.halaman[1] + 0.5 || d.gulirY !== 0) s.push('halaman menggulir saat istilah dibuka');
  if (JSON.stringify(d.panggung) !== JSON.stringify(sebelum.panggung) || d.kamera !== sebelum.kamera) s.push(`panggung bergeser saat istilah dibuka: ${JSON.stringify(sebelum.panggung)} -> ${JSON.stringify(d.panggung)}`);
  if (lang !== 'id' && d.butir.some((x) => KATA_ID.test(x.teks))) s.push('kata Indonesia di peran');
  return { sebab: s, data: { panggung: d.panggung, kotak: d.kotak, peran: d.butir.map((x) => x.teks), baris: d.butir.map((x) => x.baris), kolom: d.butir.map((x) => x.kolom), celahLabel: d.butir.slice(1).map((x, i) => Math.round((x.kiri - d.butir[i].kanan) * 10) / 10), tombolDiKotak: d.tombolDiKotak } };
}

/** Obrolan sesudah ketukan ruang (K11 berkabar / K13). */
const ukurObrolan = (p) => p.evaluate(() => {
  const o = document.querySelector('.hp-obrolan'); if (!o) return null;
  const g = o.querySelector('.hp-gulir')?.getBoundingClientRect() ?? o.getBoundingClientRect();
  const terlihat = (el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= g.top - 1 && r.bottom <= g.bottom + 1; };
  const butir = [...o.querySelectorAll('.hp-utas > li')].map((li) => ({ jenis: li.classList.contains('hp-keluar') ? 'keluar' : li.classList.contains('hp-masuk') ? 'masuk' : li.classList.contains('hp-status-catatan') ? 'status' : li.classList.contains('hp-catatan') ? 'catatan' : 'lain', teks: (li.querySelector('.hp-gelembung') ?? li).innerText.replace(/\s+/g, ' ').trim(), terlihat: terlihat(li) }));
  const se = document.scrollingElement;
  return { tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), node: document.querySelector('.hp-main')?.getAttribute('data-node'), gerbang: !!o.querySelector('[data-gerbang-sesi]'), mengetik: !!o.querySelector('.hp-mengetik'), lama: !!o.querySelector('.hp-lama'), butir,
    balas: !!document.querySelector('[data-balas]'), lanjut: !!document.querySelector('.hp-komposer [data-lanjut]'), halaman: [se.scrollHeight, window.innerHeight], teks: o.innerText };
});

/**
 * Semua kasus ruang Komite dengan browser `b` (Chromium, puppeteer). Mengembalikan [{ nama, lulus, data }].
 * Opsi: bahasa, vp (nama), kasus (potongan nama), cepat (360x640 + id saja), out.
 */
export async function cekKomite(b, BASE, { bahasa = ['id', 'en', 'zh'], vp = null, kasus = null, cepat = false, out = OUT_KOMITE, catat = () => {} } = {}) {
  const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-025/states-komite.json'), 'utf8'));
  const ruang = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/src/cerita/seni/piksel/ruang-ep2.json'), 'utf8')).lokasi['komite-ep2'];
  const km = { ...ruang.komite, __fokus: ruang.fokus };
  fs.mkdirSync(out, { recursive: true });
  const hasil = [];
  const lapor = (nama, lulus, data) => { const r = { nama, lulus, data }; hasil.push(r); catat(r); };
  const daftarVp = VP_KOMITE.filter((v) => (vp ? vp.includes(v.n) : !cepat || v.n === '360x640'));
  const daftarBahasa = cepat ? ['id'] : bahasa;
  const mau = (nama) => !kasus || nama.includes(kasus);
  const jalan = async (nama, fn) => {
    if (!mau(nama)) return;
    let h = null;
    try { await denganBatas(fn((x) => { h = x; return x; }), BATAS, nama); } catch (e) { lapor(nama, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 200)] }); }
    await h?.tutup();
  };

  // ---- 4 keadaan x bahasa x ukuran
  const akhir = {}; // `${vp}-${lang}-${keadaan}` -> { kamera, k, kotak, hash }
  for (const v of daftarVp) for (const lang of daftarBahasa) for (const keadaan of KEADAAN) {
    const nama = `komite-ruang-${keadaan}-${v.n}-${lang}`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, v, lang, J.states[keadaan].nilai));
      await ruangDiam(h.p);
      const d = await ukurRuang(h.p, km);
      const sebab = nilaiRuang(d, keadaan, lang, J.harap[lang], km);
      // Teks ketukan = tabel bahasanya (pengantar K11, pembuka K13, atau akibat berkas sesuai tindakan).
      if (d) {
        const kasusRuang = KASUS_RUANG[keadaan];
        if (J.states[keadaan].komite !== keadaan) sebab.push(`state ${keadaan} ber-keadaan ${J.states[keadaan].komite}`);
        if (!d.teks.includes(kasusRuang.teks(J.harap[lang]))) sebab.push('teks ketukan bukan teks tabel: ' + d.teks.slice(0, 80));
        if (kasusRuang.akibat && (JSON.stringify(d.topik) !== JSON.stringify([J.harap[lang].topik.berkas, J.harap[lang].topik.kabar]) || !d.status)) sebab.push('akibat tanpa kabar: dua topik + catatan status di kartu ruang: ' + JSON.stringify([d.topik, d.status]));
        if (kasusRuang.akibat) sebab.push(...nilaiKartuAkibat(d, J.harap[lang], keadaan === 'catatan' ? 'sekarang' : 'hendra', kasusRuang.alt));
        if (!kasusRuang.akibat && (d.topik.length || d.status)) sebab.push('ketukan pengantar / pembuka berlabel akibat atau bercatatan status: ' + JSON.stringify([d.topik, d.status]));
        // Fix 1: SETUJU hanya di K13.
        if ((keadaan === 'setuju') !== (d.node === 'k13')) sebab.push(`keadaan ${keadaan} tampil di node ${d.node}`);
        akhir[`${v.n}-${lang}-${keadaan}`] = { kamera: d.kamera, k: d.k, kotak: d.kotak, hash: d.hash };
      }
      await h.p.screenshot({ path: path.join(out, `ruang-${keadaan}-${v.n}-${lang}.png`) });
      lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, ...(d ? { k: d.k, kamera: d.kamera, kotak: d.kotak, bentuk: d.bentuk, pose: d.poseAnggota, tanda: d.tanda, aria: d.aria, gerakMasuk: ringkasRekam(d), ...(KASUS_RUANG[keadaan].akibat ? { lebihDialog: d.lebihDialog, statusTerlihat: d.statusTerlihat } : {}), cocok: Object.fromEntries(Object.entries(d.anggota).map(([id, x]) => [id, [x.kepala.beda, x.tangan.beda, x.setuju.beda, x.catatan.beda]])) } : {}), ...(h.galat.length ? { galat: h.galat } : {}) });
    });
  }
  // Fix 1: akibat K11 berkas LENGKAP (tanpa kabar): ruang tetap menunggu. Tidak ada tanda yang pernah muncul (perekam: sejak PNG
  // siap; piksel: tidak ada SETUJU / CATATAN), keempat anggota duduk, dua akibat berlabel + catatan status di kartu ruang.
  for (const v of daftarVp) for (const lang of daftarBahasa) {
    const nama = `komite-hasil-lengkapi-${v.n}-${lang}`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, v, lang, J.states['hasil-lengkapi'].nilai));
      await ruangDiam(h.p);
      await tunggu(1100); // lewat seluruh lama gerak setuju (jeda awal 320 + 640 md): bila ada tanda yang menyusul, perekam menangkapnya
      const d = await ukurRuang(h.p, km);
      const sebab = nilaiRuang(d, 'tunggu', lang, J.harap[lang], km);
      if (d) {
        if (d.node !== 'k11-c' || !d.teks.includes(J.harap[lang].berkas.lengkapi)) sebab.push('bukan ketukan akibat berkas lengkap: ' + JSON.stringify([d.node, d.teks.slice(0, 60)]));
        if (JSON.stringify(d.topik) !== JSON.stringify([J.harap[lang].topik.berkas, J.harap[lang].topik.kabar]) || !d.status) sebab.push('dua topik + catatan status di kartu ruang: ' + JSON.stringify([d.topik, d.status]));
        if (d.rekam.some((x) => x.v.split('|')[1] !== '')) sebab.push('ada tanda yang muncul di akibat berkas lengkap: ' + JSON.stringify(d.rekam.slice(0, 4)));
        sebab.push(...nilaiKartuAkibat(d, J.harap[lang], 'lengkapi', 'c'));
      }
      await h.p.screenshot({ path: path.join(out, `hasil-lengkapi-${v.n}-${lang}.png`) });
      lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, ...(d ? { node: d.node, komite: d.komite, pose: d.poseAnggota, tanda: d.tanda, k: d.k, kamera: d.kamera, kotak: d.kotak, lebihDialog: d.lebihDialog, statusTerlihat: d.statusTerlihat, cocok: Object.fromEntries(Object.entries(d.anggota).map(([id, x]) => [id, [x.kepala.beda, x.tangan.beda, x.setuju.beda, x.catatan.beda]])) } : {}), ...(h.galat.length ? { galat: h.galat } : {}) });
    });
  }
  // Kamera sama untuk keempat keadaan (skala selalu; seluruh pandangan bila kotak panggungnya sama).
  for (const v of daftarVp) for (const lang of daftarBahasa) {
    const nama = `komite-kamera-${v.n}-${lang}`;
    if (!mau(nama) && !mau('komite-ruang')) continue;
    const x = KEADAAN.map((k) => akhir[`${v.n}-${lang}-${k}`]).filter(Boolean);
    if (x.length !== 4) { if (!kasus) lapor(nama, false, { sebab: ['keadaan yang terukur hanya ' + x.length] }); continue; }
    const sebab = [];
    if (new Set(x.map((y) => y.k)).size !== 1) sebab.push('skala berbeda antarkeadaan: ' + x.map((y) => y.k).join(' '));
    const perKotak = new Map(); for (const y of x) { const kk = y.kotak.join('x'); perKotak.set(kk, new Set([...(perKotak.get(kk) ?? []), y.kamera])); }
    for (const [kk, set] of perKotak) if (set.size !== 1) sebab.push(`kamera berbeda pada kotak ${kk}: ${[...set].join(' | ')}`);
    if (new Set(x.map((y) => y.kamera.split(',')[0])).size !== 1) sebab.push('geseran mendatar kamera berbeda antarkeadaan');
    lapor(nama, sebab.length === 0, { sebab, kotak: [...perKotak.keys()], kamera: [...new Set(x.map((y) => y.kamera))] });
  }

  // ---- Fix 2 (D-248): SATU skala per HP, juga di luar dua ukuran utama. Lima layar ruang ini (pengantar K11, tiga akibat tanpa
  //      kabar, pembuka K13) memakai dua bentuk panggung (sedang 16 : 10, pendek 2 : 1): skalanya harus sama di kelimanya dan
  //      = SKALA_HARAP (dulu: 393 / 430 px DPR 3 = 4 dan 3 bergantian; 320 px DPR 2 = setengah ukuran). Tiap layar dinilai penuh
  //      (pose, tanda, piksel kepala + tanda terhadap atlas pada skala itu, fokus utuh, gerak masuk). Hanya id: skala tidak
  //      bergantung bahasa, dan dua ukuran utama sudah diukur dalam tiga bahasa di atas.
  const LAYAR_SKALA = [['tunggu', 'tunggu'], ['hasil-lengkapi', 'tunggu'], ['catatan', 'catatan'], ['kosong', 'kosong'], ['setuju', 'setuju']];
  for (const v of VP_SKALA) {
    if (cepat || (vp && !vp.includes(v.n))) continue;
    const terukur = [];
    for (const [st, keadaan] of LAYAR_SKALA) {
      const nama = `komite-skala-${v.n}-${st}-id`;
      await jalan(nama, async (pegang) => {
        const h = pegang(await buka(b, BASE, v, 'id', J.states[st].nilai));
        await ruangDiam(h.p);
        const d = await ukurRuang(h.p, km);
        const sebab = nilaiRuang(d, keadaan, 'id', J.harap.id, km, { hanyaPanggung: v.w < 360 });
        if (d) terukur.push({ st, k: d.k, bentuk: d.bentuk, kotak: d.kotak });
        await h.p.screenshot({ path: path.join(out, `skala-${v.n}-${st}-id.png`) });
        lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, ...(d ? { k: d.k, cssPerPikselSeni: Math.round((d.k / d.dpr) * 100) / 100, kepala36: Math.round(((36 * d.k) / d.dpr) * 10) / 10, kamera: d.kamera, kotak: d.kotak, bentuk: d.bentuk, halaman: d.halaman, lebihDialog: d.lebihDialog } : {}), ...(h.galat.length ? { galat: h.galat } : {}) });
      });
    }
    const nama = `komite-skala-${v.n}-id`;
    if (!mau(nama)) continue;
    const sebab = [];
    if (terukur.length !== LAYAR_SKALA.length) sebab.push('layar yang terukur hanya ' + terukur.length);
    if (new Set(terukur.map((x) => x.k)).size > 1) sebab.push('skala berbeda antarlayar: ' + terukur.map((x) => `${x.st} ${x.k} (${x.bentuk})`).join(', '));
    lapor(nama, sebab.length === 0, { sebab, k: [...new Set(terukur.map((x) => x.k))], bentuk: Object.fromEntries(terukur.map((x) => [x.st, x.bentuk])), kotak: [...new Set(terukur.map((x) => x.kotak.join('x')))] });
  }

  // ---- gerak dikurangi: bingkai diam + semua tanda sejak awal; gambar akhir = gambar akhir gerak normal
  const vK = daftarVp[daftarVp.length - 1];
  for (const keadaan of ['setuju', 'catatan']) {
    const nama = `komite-gerak-dikurangi-${keadaan}-${vK.n}-id`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, vK, 'id', J.states[keadaan].nilai, { kurang: true }));
      await ruangDiam(h.p);
      const d = await ukurRuang(h.p, km);
      const sebab = nilaiRuang(d, keadaan, 'id', J.harap.id, km, { kurang: true });
      const normal = akhir[`${vK.n}-id-${keadaan}`];
      if (d && normal && d.hash !== normal.hash) sebab.push('gambar akhir gerak dikurangi berbeda dari gambar akhir gerak normal');
      if (d && !normal && !kasus) sebab.push('tidak ada gambar normal untuk dibandingkan');
      await h.p.screenshot({ path: path.join(out, `ruang-${keadaan}-${vK.n}-id-gerak-dikurangi.png`) });
      lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, rekam: d ? ringkasRekam(d) : null, samaDenganNormal: !!(d && normal && d.hash === normal.hash) });
    });
  }
  // ---- kedip (tunggu): 7 d gerak normal = ada kedip; 7 d gerak dikurangi = tidak ada
  for (const kurang of [false, true]) {
    const nama = `komite-kedip-${kurang ? 'dikurangi' : 'normal'}-${vK.n}-id`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, vK, 'id', J.states.tunggu.nilai, { kurang }));
      await ruangDiam(h.p);
      await tunggu(7000);
      const r = await h.p.evaluate(() => window.__komite.filter((x) => x.v.endsWith('|1')).map((x) => x.v.split('|')[0]));
      const kedip = r.filter((x) => /:kedip/.test(x)); const siapa = [...new Set(kedip.flatMap((x) => x.split(' ').filter((y) => /:kedip/.test(y)).map((y) => y.split(':')[0])))];
      const sebab = [];
      if (!kurang && !kedip.length) sebab.push('tidak ada anggota yang berkedip dalam 7 d');
      if (kurang && kedip.length) sebab.push('ada kedip saat gerak dikurangi');
      lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, perubahan: r.length, berkedip: siapa });
    });
  }

  // ---- lembar istilah
  for (const v of daftarVp) for (const lang of daftarBahasa) {
    const nama = `komite-istilah-${v.n}-${lang}`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, v, lang, J.states.tunggu.nilai));
      await ruangDiam(h.p);
      const r = await periksaIstilah(h.p, lang, J.harap[lang]);
      await h.p.screenshot({ path: path.join(out, `istilah-${v.n}-${lang}.png`) });
      lapor(nama, r.sebab.length === 0 && h.galat.length === 0, { sebab: r.sebab, ...r.data, ...(h.galat.length ? { galat: h.galat } : {}) });
    });
  }

  // ---- alur tugas K11: ruang (menunggu) -> aktivitas bundel -> kembali = ruang yang SAMA tanpa pindah ruang / kamera; lalu
  //      aktivitas diselesaikan tanpa kabar. Fix 1: berkas LENGKAP -> ruang tetap menunggu, gambar yang sama, tidak ada tanda;
  //      ajukan SEKARANG (tanpa surat polisi) -> dua anggota mengangkat tangan, tanda CATATAN muncul satu per satu saat tiba.
  for (const [tindakan, keadaanAkibat, nodeAkibat] of [['lengkapi', 'tunggu', 'k11-c'], ['sekarang', 'catatan', 'k11-b']]) await jalan(`komite-alur-tugas-${tindakan}-${vK.n}-id`, async (pegang) => {
    const h = pegang(await buka(b, BASE, vK, 'id', J.states.tunggu.nilai));
    const p = h.p;
    await ruangDiam(p);
    const a = await ukurRuang(p, km);
    const sebab = nilaiRuang(a, 'tunggu', 'id', J.harap.id, km);
    const tampilan = () => p.evaluate(() => document.querySelector('.hp-layar')?.getAttribute('data-tampilan') ?? null);
    await klik(p, '[data-mulai-tugas]'); await tunggu(900);
    if ((await tampilan()) !== 'arena') sebab.push('aktivitas bundel tidak terbuka dari kartu tugas');
    await klik(p, '.hp-arena-kembali'); await tunggu(700);
    // Bingkai pertama sesudah kembali: tidak ada lapisan pudar ganti-ruang (ruangnya sama).
    const pudar = await p.evaluate(() => !!document.querySelector('.hp-vn .cer-piksel-lama[data-aktif]'));
    await ruangDiam(p);
    const k2 = await ukurRuang(p, km);
    sebab.push(...nilaiRuang(k2, 'tunggu', 'id', J.harap.id, km).map((x) => 'sesudah kembali: ' + x));
    if (pudar) sebab.push('pudar ganti-ruang berjalan saat kembali dari aktivitas');
    if (a && k2 && (k2.kamera !== a.kamera || k2.k !== a.k || k2.kotak.join() !== a.kotak.join() || k2.hash !== a.hash)) sebab.push(`ruang berubah sesudah kembali dari aktivitas: ${a.kamera} ${a.kotak} -> ${k2.kamera} ${k2.kotak}${k2.hash !== a.hash ? ' (gambar berbeda)' : ''}`);
    // Selesaikan: langkah 1 (periksa) -> tindakan atas berkas -> kabar "nanti" -> kirim.
    await klik(p, '[data-mulai-tugas]'); await tunggu(800);
    await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(500);
    await klik(p, `.hp-bundel .hp-opsi[data-opsi="${tindakan}"]`); await tunggu(300);
    await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(500);
    await klik(p, '.hp-bundel .hp-opsi[data-opsi="nanti"]'); await tunggu(300);
    await p.evaluate(() => { window.__komite.length = 0; });
    await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(700);
    await ruangDiam(p);
    await tunggu(1100); // lewat seluruh lama gerak (jeda awal 320 + 640 md): tanda yang menyusul (bila ada) terekam
    const c = await ukurRuang(p, km);
    sebab.push(...nilaiRuang(c, keadaanAkibat, 'id', J.harap.id, km).map((x) => 'sesudah tugas: ' + x));
    if (c && (c.node !== nodeAkibat || !c.teks.includes(J.harap.id.berkas[tindakan]) || !c.status)) sebab.push('ketukan akibat sesudah tugas: ' + JSON.stringify([c.node, c.status, c.teks.slice(0, 50)]));
    if (a && c && (c.k !== a.k || c.kamera.split(',')[0] !== a.kamera.split(',')[0])) sebab.push(`skala / geseran kamera berubah antara pengantar dan akibat: ${a.kamera} -> ${c.kamera}`);
    // Fix 1: berkas lengkap -> tidak ada tanda yang pernah muncul, dan pada kotak yang sama gambarnya sama dengan pengantar.
    if (c && tindakan === 'lengkapi') {
      if (c.rekam.some((x) => x.v.split('|')[1] !== '')) sebab.push('tanda muncul sesudah berkas lengkap: ' + JSON.stringify(c.rekam.slice(0, 4)));
      if (a && c.kotak.join() === a.kotak.join() && c.hash !== a.hash) sebab.push('gambar ruang berubah antara pengantar dan akibat berkas lengkap (kotak sama)');
    }
    await p.screenshot({ path: path.join(out, `alur-tugas-${tindakan}-akibat-id.png`) });
    lapor(`komite-alur-tugas-${tindakan}-${vK.n}-id`, sebab.length === 0 && h.galat.length === 0, { sebab, kembali: k2 ? [k2.kamera, k2.kotak] : null, akibat: c ? [c.node, c.komite, c.kamera, c.kotak, c.bentuk] : null, gerakMasuk: c ? ringkasRekam(c) : null, ...(h.galat.length ? { galat: h.galat } : {}) });
  });

  // ---- alur: K11 berkabar (sela-a, sela-b2) dan K13
  for (const lang of daftarBahasa) {
    const H = J.harap[lang];
    for (const [st, keadaan, tindakan] of [['sela-a', 'tunggu', 'lengkapi'], ['sela-b2', 'catatan', 'sekarang']]) {
      const nama = `komite-alur-${st}-${vK.n}-${lang}`;
      await jalan(nama, async (pegang) => {
        const h = pegang(await buka(b, BASE, vK, lang, J.states[st].nilai));
        await ruangDiam(h.p);
        const d = await ukurRuang(h.p, km);
        const sebab = nilaiRuang(d, keadaan, lang, H, km);
        if (d) {
          if (!d.teks.includes(H.berkas[tindakan]) || JSON.stringify(d.topik) !== JSON.stringify([H.topik.berkas])) sebab.push('ketukan sela: hanya akibat berkas: ' + JSON.stringify(d.topik));
          if (d.status) sebab.push('catatan status tampil di kartu sela (seharusnya menutup akibat di obrolan)');
        }
        await h.p.screenshot({ path: path.join(out, `alur-${st}-1-ruang-${lang}.png`) });
        await klik(h.p, '.hp-vn-aksi [data-lanjut]'); await tunggu(1500);
        const o = await ukurObrolan(h.p);
        if (!o || o.tampilan !== 'obrolan') sebab.push('sesudah Lanjut bukan obrolan: ' + JSON.stringify(o && [o.tampilan, o.node]));
        else {
          const urut = o.butir.map((x) => x.jenis).join(' ');
          const harapUrut = st === 'sela-a' ? 'keluar masuk catatan status' : 'keluar catatan status';
          if (urut !== harapUrut) sebab.push(`utas sesi "${urut}", seharusnya "${harapUrut}"`);
          const keluar = o.butir.find((x) => x.jenis === 'keluar');
          if (!keluar || !keluar.teks.includes(H.pesanPersetujuan) || !keluar.terlihat) sebab.push('pesan terkirim pemain tidak terlihat: ' + JSON.stringify(keluar));
          if (st === 'sela-a' && !o.butir.some((x) => x.jenis === 'masuk' && x.teks.includes(H.balasA))) sebab.push('balasan Pak Hendra tidak ada');
          if (!o.butir.some((x) => x.jenis === 'catatan' && x.teks.includes(H.kabar[st === 'sela-a' ? 'a' : 'b2']) && x.teks.toLowerCase().includes(H.topik.kabar.toLowerCase()))) sebab.push('akibat kabar berlabel tidak ada');
          if (o.butir.some((x) => x.teks.includes(H.berkas[tindakan]))) sebab.push('akibat berkas tampil dua kali (ruang dan obrolan)');
          if (o.gerbang || o.mengetik) sebab.push('gerbang / mengetik menahan akibat');
          if (o.halaman[0] > o.halaman[1] + 0.5) sebab.push('halaman obrolan menggulir');
          if (lang !== 'id') { const indo = o.butir.map((x) => x.teks).filter((x) => KATA_ID.test(x)); if (indo.length) sebab.push('kata Indonesia: ' + indo[0].slice(0, 60)); }
        }
        await h.p.screenshot({ path: path.join(out, `alur-${st}-2-obrolan-${lang}.png`) });
        lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, utas: o?.butir.map((x) => x.jenis), ...(h.galat.length ? { galat: h.galat } : {}) });
      });
    }
    const nama = `komite-alur-k13-${vK.n}-${lang}`;
    await jalan(nama, async (pegang) => {
      const h = pegang(await buka(b, BASE, vK, lang, J.states.k13.nilai));
      await ruangDiam(h.p);
      const d = await ukurRuang(h.p, km);
      const sebab = nilaiRuang(d, 'setuju', lang, H, km);
      if (d && (!d.teks.includes(H.k13) || d.node !== 'k13' || d.status)) sebab.push('ketukan pembuka K13: ' + JSON.stringify([d.node, d.status, d.teks.slice(0, 60)]));
      const istilah = await h.p.evaluate(() => [...document.querySelectorAll('.hp-vn-dialog:not([data-bayangan]) [data-istilah]')].map((x) => x.getAttribute('data-istilah')));
      if (JSON.stringify(istilah) !== '["penawaran","leasing"]') sebab.push('istilah K13 tidak ikut ke ketukan ruang: ' + JSON.stringify(istilah));
      await h.p.screenshot({ path: path.join(out, `alur-k13-1-ruang-${lang}.png`) });
      await klik(h.p, '.hp-vn-aksi [data-lanjut]'); await tunggu(1500);
      const o = await ukurObrolan(h.p);
      if (!o || o.tampilan !== 'obrolan' || o.node !== 'k13') sebab.push('sesudah Lanjut bukan obrolan K13: ' + JSON.stringify(o && [o.tampilan, o.node]));
      else {
        if (o.gerbang) sebab.push('gerbang "Mulai percakapan" tampil sesudah ketukan ruang');
        const masuk = o.butir.filter((x) => x.jenis === 'masuk');
        if (masuk.length !== 1 || !masuk[0].teks.includes(H.k13Balas) || !masuk[0].terlihat) sebab.push('pesan Pak Hendra K13 tidak terlihat: ' + JSON.stringify(o.butir));
        if (!o.balas) sebab.push('tombol balas tidak ada');
        if (o.halaman[0] > o.halaman[1] + 0.5) sebab.push('halaman obrolan menggulir');
      }
      await h.p.screenshot({ path: path.join(out, `alur-k13-2-obrolan-${lang}.png`) });
      lapor(nama, sebab.length === 0 && h.galat.length === 0, { sebab, utas: o?.butir.map((x) => x.jenis), gerbang: o?.gerbang, ...(h.galat.length ? { galat: h.galat } : {}) });
    });
  }
  return hasil;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs');
  mulaiPrioritasRendah();
  const puppeteer = (await import('puppeteer-core')).default;
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
  const opsi = (nama) => { const x = process.argv.find((a) => a.startsWith(`--${nama}=`)); return x ? x.slice(nama.length + 3).split(',').map((s) => s.trim()).filter(Boolean) : undefined; };
  const b = await puppeteer.launch({ executablePath: process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 60000 });
  const penjaga = setTimeout(() => { console.log('PENJAGA: alat belum selesai sesudah 20 menit'); try { b.process()?.kill('SIGKILL'); } catch { /* abaikan */ } process.exit(2); }, 20 * 60000);
  const hasil = await cekKomite(b, BASE, { bahasa: opsi('bahasa'), vp: opsi('vp'), kasus: opsi('kasus')?.[0] ?? null, cepat: process.argv.includes('--cepat'), catat: (r) => console.log(r.lulus ? 'PASS' : 'FAIL', r.nama, JSON.stringify(r.data)) });
  clearTimeout(penjaga);
  await b.close();
  if (!opsi('kasus')) fs.writeFileSync(path.join(OUT_KOMITE, 'hasil-komite.json'), JSON.stringify(hasil, null, 1));
  const gagal = hasil.filter((x) => !x.lulus).length;
  console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
