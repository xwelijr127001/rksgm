/**
 * T-026: tag jenis episode di kartu daftar /cerita (Episode 1 = DEMO, Episode 2 = KASUS NYATA), lencana di pojok kanan-atas gambar
 * kartu di semua ukuran (keputusan Lead: lencana di pojok gambar, letak sama di kedua kartu; di baris meta chip tidak muat pada HP
 * dalam id / en). Pojok kanan, bukan kiri: di sampul Episode 2 kepala Pak Hendra ada di pojok kiri-atas.
 *
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-tag-t026.mjs [--tanpa-webkit] [--kasus potongan-nama]
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-tag-t026.mjs --ukur-dasar     (build SEBELUM tag: hanya mengukur)
 *
 * Chromium: 390x645 (DPR 3), 360x640 (DPR 2), 320x568 (DPR 2), 1280x800 x id / en / zh. WebKit: dua ukuran HP x id / en / zh.
 * Tiap kasus:
 *  - dua kartu, masing-masing SATU lencana: Episode 1 `demo`, Episode 2 `nyata`; teks = kamus cerita `jenis.<..>` bahasa itu;
 *    tooltip (title) dan deskripsi aksesibel (aria-description) = `jenisKet.<..>`; lencana di luar kotak gambar yang aria-hidden
 *    dan anak pertama kartu (dibaca lebih dulu);
 *  - letak: 10 px dari tepi kanan dan atas KOTAK GAMBAR (juga di tata letak dua kolom, tempat gambar = kolom kiri), seluruhnya
 *    di dalam kotak gambar, sama di kedua kartu, tidak menyentuh teks kartu, tidak terpotong, dan benar-benar paling atas di
 *    titik tengahnya (di atas lapisan panggung). Wajah tokoh sampul tidak diperiksa alat ini (dilihat di tangkapan layar);
 *  - warna (T-029, palet Raksa v1): DEMO panel blush #F9EEEA berhuruf abu #5F5F5F, KASUS NYATA jingga merek #FF9000 berhuruf
 *    tinta #212121 (dulu abu netral / hijau merek berhuruf putih); kontras huruf >= 4,5 : 1;
 *  - TIDAK ADA yang bergeser: tinggi tiap kartu, kotak baris meta (lima butir seperti dulu), kotak gambar, dan tinggi / lebar gulir
 *    halaman sama dengan ukuran dasar tanpa tag (team/evidence/T-026/dasar-tanpa-tag.json, diukur alat ini dengan --ukur-dasar
 *    pada build sebelum perubahan), toleransi 0,5 px; halaman tidak menggulir mendatar;
 *  - tanpa galat halaman.
 * Tangkapan layar halaman penuh -> team/evidence/T-026/picker-<ukuran>-<bahasa>[-webkit].png; hasil -> hasil.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bukaGulir, denganBatas, luncur, pasangPenjaga, tunggu } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama: Node + browser otomasi ke prioritas rendah

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
const OUT = path.join(ROOT, 'team/evidence/T-026');
const BERKAS_DASAR = path.join(OUT, 'dasar-tanpa-tag.json');
fs.mkdirSync(OUT, { recursive: true });
const ukurDasar = process.argv.includes('--ukur-dasar');
const hanya = (() => { const i = process.argv.indexOf('--kasus'); return i >= 0 ? process.argv[i + 1] : null; })();
const VP = [{ n: '390x645', w: 390, h: 645, dpr: 3 }, { n: '360x640', w: 360, h: 640, dpr: 2 }, { n: '320x568', w: 320, h: 568, dpr: 2 }, { n: '1280x800', w: 1280, h: 800, dpr: 1 }];
const BAHASA = ['id', 'en', 'zh'];
const JENIS = ['nyata']; // T-037: hanya kasus nyata (Episode 1) di pemilih
const MESIN = process.argv.includes('--tanpa-webkit') ? ['chromium'] : ['chromium', 'webkit'];

/** Teks harapan dibaca dari kamus (bukan salinan di alat): blok bahasa `  id: {` .. `  },` di client/src/i18n/kamus/cerita.ts. */
const SUMBER = fs.readFileSync(path.join(ROOT, 'client/src/i18n/kamus/cerita.ts'), 'utf8').replace(/\r\n/g, '\n');
function kamus(bahasa, kunci) {
  const i = SUMBER.indexOf(`\n  ${bahasa}: {`); const j = SUMBER.indexOf('\n  },', i);
  if (i < 0 || j < 0) throw new Error(`kamus cerita: blok ${bahasa} tidak ditemukan`);
  const m = new RegExp(`'${kunci.replace(/\./g, '\\.')}': '((?:[^'\\\\]|\\\\.)*)'`).exec(SUMBER.slice(i, j));
  if (!m) throw new Error(`kamus cerita ${bahasa}: ${kunci} tidak ada`);
  return m[1].replace(/\\'/g, "'");
}

/** Kontras WCAG dua warna `rgb(r, g, b)`. */
function kontras(a, b) {
  const L = (s) => { const [r, g, bl] = (s.match(/[\d.]+/g) ?? []).slice(0, 3).map((x) => { const v = Number(x) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

const ukur = (p) => p.evaluate(async () => {
  const b1 = (v) => Math.round(v * 10) / 10;
  const kotak = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [b1(r.left), b1(r.top + window.scrollY), b1(r.width), b1(r.height)]; };
  const se = document.scrollingElement;
  const kartu = [];
  for (const li of document.querySelectorAll('.cer-ep')) {
    const lencana = [...li.querySelectorAll('.cer-ep-jenis')]; const t = lencana[0] ?? null;
    const meta = li.querySelector('.cer-ep-meta'); const seni = li.querySelector('.cer-ep-seni');
    let atas = null;
    if (t) {
      // Elemen paling atas di titik tengah lencana (digulir ke tengah layar dulu): harus lencana itu sendiri.
      t.scrollIntoView({ block: 'center' });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const r = t.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      atas = el === t || (!!el && t.contains(el));
    }
    const g = t ? getComputedStyle(t) : null;
    // Jarak tegak terdekat antara lencana dan teks / tombol isi kartu (negatif = bertumpang) pada kartu berkolom tunggal.
    const isi = li.querySelector('.cer-ep-isi');
    kartu.push({
      status: li.getAttribute('data-status'), judul: li.querySelector('h2')?.textContent ?? '',
      tinggi: b1(li.getBoundingClientRect().height), kartu: kotak(li), seni: getComputedStyle(seni ?? li).display === 'none' ? null : kotak(seni), wajah: (() => { const w = li.querySelector('.cer-ep-wajah'); return w && getComputedStyle(w).display !== 'none' ? kotak(w) : null; })(), isi: kotak(isi), meta: kotak(meta), metaAnak: meta ? meta.children.length : 0, metaTeks: meta ? [...meta.children].map((x) => x.textContent).join(' ') : '',
      jumlahLencana: lencana.length,
      lencana: t ? {
        kotak: kotak(t), teks: t.textContent, jenis: t.getAttribute('data-jenis'), judul: t.getAttribute('title'), deskripsi: t.getAttribute('aria-description'),
        anakPertama: li.firstElementChild === t, diMetaAwal: !!meta && meta.previousElementSibling === t, diSeni: !!seni && seni.contains(t), tersembunyi: !!t.closest('[aria-hidden="true"]'),
        latar: g.backgroundColor, warna: g.color, huruf: [g.fontSize, g.fontWeight], terpotong: t.scrollWidth > t.clientWidth + 1, atas,
      } : null,
    });
  }
  window.scrollTo(0, 0);
  return { halaman: [se.scrollHeight, se.scrollWidth, window.innerHeight, window.innerWidth], kartu };
});

/** Tunggu daftar siap: dua kartu, fon, sampul piksel Episode 2 (paling lama `ms`). */
async function siapDaftar(p, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await p.evaluate(() => ({ kartu: document.querySelectorAll('.cer-ep .cer-ep-meta').length, piksel: !!document.querySelector('.cer-ep .cer-piksel[data-siap], .cer-ep-wajah svg') })).catch(() => null);
    if (s && s.kartu >= 1 && s.piksel) break;
    await tunggu(150);
  }
  await denganBatas(p.evaluate(() => document.fonts?.ready.then(() => true)), 5000, 'font').catch(() => null);
  await tunggu(700);
}

const hasil = []; let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
const dasar = !ukurDasar && fs.existsSync(BERKAS_DASAR) ? JSON.parse(fs.readFileSync(BERKAS_DASAR, 'utf8')) : null;
const dasarBaru = {};
let b = null;
const batal = pasangPenjaga(12, () => { lapor('penjaga', false, { sebab: ['seluruh proses melewati batas waktu'] }); try { b?.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });

for (const mesin of MESIN) {
  b = await denganBatas(luncur(mesin), 45000, `luncur ${mesin}`);
  for (const vp of mesin === 'webkit' ? VP.filter((v) => v.w === 390 || v.w === 360) : VP) for (const lang of BAHASA) {
    const kunci = `${mesin}-${vp.n}-${lang}`; const nama = `tag-${vp.n}-${lang}${mesin === 'webkit' ? '-webkit' : ''}`;
    if (hanya && !nama.includes(hanya)) continue;
    let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir(mesin, b, BASE, vp, lang, null, '/cerita');
        await siapDaftar(h.p);
        const d = await ukur(h.p);
        const ringkas = { halaman: d.halaman, kartu: d.kartu.map((k) => ({ tinggi: k.tinggi, meta: k.meta, metaAnak: k.metaAnak, seni: k.seni })) };
        if (ukurDasar) { dasarBaru[kunci] = ringkas; lapor(nama + '-dasar', d.kartu.length === 2 && d.kartu.every((k) => k.jumlahLencana === 0), { ...ringkas, lencana: d.kartu.map((k) => k.jumlahLencana) }); return; }
        const s = [];
        // T-037 (pemilik 18 Nov 07:05-07:12): pemilih = SATU kartu kasus nyata (demo hanya dengan RAKSA_DEMO_CERITA=on); tag jenis =
        // chip kecil di AWAL baris meta (20 px, huruf 11 px), tidak di atas gambar / potret; kontrak lama (lencana di pojok
        // gambar, ukuran dasar tanpa tag) diganti. Kepadatan & 0 px gulir: tools/cek-pemilih-t037.mjs.
        if (d.kartu.length !== JENIS.length) s.push(`jumlah kartu ${d.kartu.length}`);
        d.kartu.forEach((k, i) => {
          const j = JENIS[i]; const t = k.lencana; const no = `kartu ${i + 1}`;
          if (k.jumlahLencana !== 1 || !t) { s.push(`${no}: jumlah chip ${k.jumlahLencana}`); return; }
          if (t.jenis !== j || t.teks !== kamus(lang, `jenis.${j}`)) s.push(`${no}: chip "${t.teks}" (${t.jenis}), seharusnya "${kamus(lang, `jenis.${j}`)}" (${j})`);
          const ket = kamus(lang, `jenisKet.${j}`);
          if (t.judul !== ket || t.deskripsi !== ket) s.push(`${no}: keterangan ${JSON.stringify([t.judul, t.deskripsi])}, seharusnya "${ket}"`);
          if (t.diSeni || t.tersembunyi) s.push(`${no}: chip di dalam kotak gambar / aria-hidden`);
          if (!t.diMetaAwal) s.push(`${no}: chip bukan baris sendiri tepat di atas baris meta (T-037 Fix 1)`);
          const [tx, ty, tw, th] = t.kotak;
          if (Math.abs(th - 20) > 0.6 || t.huruf[0] !== '11px') s.push(`${no}: chip ${tw} x ${th}, huruf ${t.huruf[0]}`);
          if (t.terpotong) s.push(`${no}: teks chip terpotong`);
          for (const g of [k.seni, k.wajah].filter(Boolean)) {
            const [gx, gy, gw, gh] = g;
            if (gw > 0 && gh > 0 && !(tx >= gx + gw || tx + tw <= gx || ty >= gy + gh || ty + th <= gy)) s.push(`${no}: chip menumpang gambar / potret`);
          }
          const harapLatar = j === 'nyata' ? 'rgb(255, 144, 0)' : 'rgba(0, 0, 0, 0)'; const harapWarna = j === 'nyata' ? 'rgb(33, 33, 33)' : 'rgb(95, 95, 95)';
          if (t.latar !== harapLatar || t.warna !== harapWarna) s.push(`${no}: warna ${t.latar} / ${t.warna}, seharusnya ${harapLatar} / ${harapWarna}`);
          if (j === 'nyata' && kontras(t.latar, t.warna) < 4.5) s.push(`${no}: kontras ${kontras(t.latar, t.warna)} < 4,5`);
        });
        if (d.halaman[1] > d.halaman[3] + 0.5) s.push(`halaman menggulir mendatar ${d.halaman[1]} > ${d.halaman[3]}`);
        const dd = null;
        if (h.galat.length) s.push('galat halaman: ' + h.galat.join(' | '));
        await h.p.screenshot({ path: path.join(OUT, `picker-${vp.n}-${lang}${mesin === 'webkit' ? '-webkit' : ''}.png`), fullPage: true });
        lapor(nama, s.length === 0, { sebab: s, halaman: d.halaman.slice(0, 2), dasarHalaman: dd?.halaman.slice(0, 2) ?? null, tinggiKartu: d.kartu.map((k) => k.tinggi), dasarTinggi: dd?.kartu.map((k) => k.tinggi) ?? null,
          lencana: d.kartu.map((k) => (k.lencana ? { teks: k.lencana.teks, ukuran: k.lencana.kotak.slice(2), kontras: kontras(k.lencana.latar, k.lencana.warna), ket: k.lencana.deskripsi } : null)), meta: d.kartu.map((k) => k.metaTeks) });
      })(), 60000, nama);
    } catch (e) { lapor(nama, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 200)] }); }
    await h?.tutup();
  }
  await denganBatas(b.close(), 15000, 'tutup browser').catch(() => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
  b = null;
  await tunggu(300);
}
batal();
if (ukurDasar) { fs.writeFileSync(BERKAS_DASAR, JSON.stringify(dasarBaru, null, 1)); console.log(`ukuran dasar -> ${path.relative(ROOT, BERKAS_DASAR)} (${Object.keys(dasarBaru).length} kasus)`); }
else if (!hanya) fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
