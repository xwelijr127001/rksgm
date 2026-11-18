#!/usr/bin/env node
/**
 * T-037: pemilih episode /cerita di satu layar HP (Designer D-335..D-340 + addendum pemilik 07:00-07:12).
 *
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-pemilih-t037.mjs [--kasus potongan-nama]
 *
 * Chromium 390x745 dan 360x640 (DPR 2) x id / en / zh x pemain baru / kembali (progres auto-2 tersimpan), plus 1280x800 id.
 * Tiap kasus HP:
 *  - halaman tidak menggulir (0 px tegak dan mendatar);
 *  - TEPAT satu kartu yang bisa dimainkan (auto-2, kasus nyata): urutan kartu nyata -> baris terkunci; tanpa kartu demo
 *    (RAKSA_DEMO_CERITA mati) dan tanpa kartu Join Game; tautan "Punya kode room?" ke "/";
 *  - (Fix 1, D-341) chip jenis di baris sendiri di atas meta; meta SATU baris, utuh (scrollWidth <= clientWidth, tanpa elipsis);
 *    sebelumnya: baris meta dimulai chip jenis (20 px, 11 px, jingga + teks tinta untuk KASUS NYATA), lalu "Episode 1";
 *    chip tidak bertumpang dengan potret;
 *  - thumbnail = potret wajah (svg piksel) di kotak 96 x 96, utuh terlihat; ringkasan maks 2 baris (1 baris di layar <= 700 px);
 *    status SATU baris dengan ikon sebaris; tombol selebar kartu, tinggi >= 48 px, "Mulai" (baru) / "Lanjutkan" (kembali);
 *  - baris terkunci: tinggi <= 64 px, aria-disabled, tanpa tautan / rute; ketukan menampilkan catatan "Segera hadir" dan
 *    TIDAK berpindah halaman; catatan hilang sesudah 2 s;
 *  - judul kepala halaman (eyebrow / judul / pengantar) tidak tampil; kepala pemain memuat potret kecil Miss Raksa.
 * Tangkapan layar: team/evidence/T-037/fullstack/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bukaGulir, denganBatas, luncur, pasangPenjaga, siap, tunggu } from './t018-umum.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
const OUT = path.join(ROOT, 'team/evidence/T-037/fullstack');
fs.mkdirSync(OUT, { recursive: true });
const hanya = process.argv.includes('--kasus') ? process.argv[process.argv.indexOf('--kasus') + 1] : null;
const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const KEMBALI = STATES.foto?.nilai ?? Object.values(STATES)[0].nilai;

const SUMBER = fs.readFileSync(path.join(ROOT, 'client/src/i18n/kamus/cerita.ts'), 'utf8').replace(/\r\n/g, '\n');
function kamus(lang, kunci) {
  const a = SUMBER.indexOf(`\n  ${lang}: {`); const z = SUMBER.indexOf('\n  },', a);
  const blok = SUMBER.slice(a, z);
  const k = kunci.includes('.') || kunci.includes('-') ? `'${kunci}'` : kunci;
  const m = blok.match(new RegExp(`\\n\\s+${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: (['"])(.*?)\\1,`));
  if (!m) throw new Error(`kunci ${kunci} (${lang}) tidak ditemukan`);
  return m[2];
}

const ukur = (p) => p.evaluate(() => {
  const gs = (e) => getComputedStyle(e);
  const r = (e) => { const x = e.getBoundingClientRect(); return { x: x.left, y: x.top, w: x.width, h: x.height, b: x.bottom, r: x.right }; };
  const se = document.scrollingElement;
  const kartu = [...document.querySelectorAll('.cer-hub-daftar > li')].map((li) => {
    if (li.classList.contains('cer-segera')) {
      const b = li.querySelector('.cer-segera-baris');
      return { jenis: 'segera', kotak: r(b), disabled: b.getAttribute('aria-disabled'), tab: b.tabIndex, tautan: li.querySelectorAll('a').length, teks: b.textContent };
    }
    const meta = li.querySelector('.cer-ep-meta'); const chip = li.querySelector('.cer-ep-jenis'); const wajah = li.querySelector('.cer-ep-wajah');
    const ringkas = li.querySelector('.cer-ep-ringkas'); const status = li.querySelector('.cer-ep-status'); const tombol = li.querySelector('.cer-ep-aksi .primary-action');
    const baris = (e) => Math.round(e.getBoundingClientRect().height / parseFloat(gs(e).lineHeight));
    const ringkasBaris = ringkas ? Math.round(Math.min(ringkas.scrollHeight, ringkas.clientHeight) / parseFloat(gs(ringkas).lineHeight)) : 0;
    return {
      jenis: 'kartu', id: tombol?.getAttribute('href') ?? '', kotak: r(li),
      meta: meta ? { kotak: r(meta), baris: baris(meta), chipDiAtas: !!chip && meta.previousElementSibling === chip && r(chip).b <= r(meta).y + 0.5, teks: [...meta.children].map((x) => x.textContent), terpotong: [meta, ...meta.children].some((e) => e.scrollWidth > e.clientWidth + 0.5 || gs(e).textOverflow === 'ellipsis'), lebar: [meta.scrollWidth, meta.clientWidth] } : null,
      chip: chip ? { kotak: r(chip), teks: chip.textContent, jenis: chip.dataset.jenis, latar: gs(chip).backgroundColor, warna: gs(chip).color, huruf: gs(chip).fontSize, terpotong: chip.scrollWidth > chip.clientWidth + 1 } : null,
      wajah: wajah ? { kotak: r(wajah), svg: !!wajah.querySelector('svg'), tampil: gs(wajah).display !== 'none' } : null,
      ringkasBaris, statusBaris: status ? baris(status) : 0, ikonSebaris: status ? Math.abs(r(status.querySelector('.cer-ep-status-ikon')).y + r(status.querySelector('.cer-ep-status-ikon')).h / 2 - (r(status).y + r(status).h / 2)) < 3 : false,
      tombol: tombol ? { kotak: r(tombol), teks: tombol.textContent.trim() } : null,
    };
  });
  const kepala = document.querySelector('.cer-hub-kepala');
  return {
    gulir: [se.scrollHeight - window.innerHeight, se.scrollWidth - window.innerWidth],
    kartu, join: document.querySelectorAll('.cer-hub .join-game, .cer-hub-join').length,
    kode: [...document.querySelectorAll('.cer-hub-kode a')].map((a) => a.getAttribute('href')),
    kepalaTampil: kepala ? getComputedStyle(kepala).display !== 'none' : false,
    potretKepala: !!document.querySelector('.player-header .cer-hub-potret-kecil'),
    lebar: window.innerWidth, tinggi: window.innerHeight, lebarHalaman: se.scrollWidth,
  };
});

const hasil = []; let gagal = 0;
const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
const batal = pasangPenjaga(12, () => { lapor('penjaga', false, { sebab: ['batas waktu'] }); });
const b = await denganBatas(luncur('chromium'), 45000, 'luncur');
const VP = [{ n: '390x745', w: 390, h: 745, dpr: 2 }, { n: '360x640', w: 360, h: 640, dpr: 2 }];
for (const vp of VP) for (const lang of ['id', 'en', 'zh']) for (const pemain of ['baru', 'kembali']) {
  const nama = `pemilih-${vp.n}-${lang}-${pemain}`;
  if (hanya && !nama.includes(hanya)) continue;
  let h = null;
  try {
    await denganBatas((async () => {
      h = await bukaGulir('chromium', b, BASE, vp, lang, pemain === 'kembali' ? KEMBALI : null, '/cerita');
      await siap(h.p);
      await h.p.waitForFunction(() => document.querySelector('.cer-ep-wajah svg') && document.querySelector('.cer-segera-baris'), { timeout: 15000 });
      await h.p.evaluate(() => document.fonts?.ready); await tunggu(600);
      const d = await ukur(h.p);
      const s = []; const data = {};
      if (d.gulir[0] > 0.5 || d.gulir[1] > 0.5) s.push(`halaman menggulir ${d.gulir.join(' / ')} px`);
      const main = d.kartu.filter((k) => k.jenis === 'kartu');
      if (main.length !== 1) s.push(`kartu yang bisa dimainkan: ${main.length} (harus 1)`);
      if (d.kartu.map((k) => k.jenis).join(',') !== 'kartu,segera') s.push(`urutan ${d.kartu.map((k) => k.jenis).join(',')}`);
      if (d.join) s.push('kartu Join Game masih ada');
      if (d.kode.join() !== '/') s.push(`tautan kode room ${JSON.stringify(d.kode)}`);
      if (d.kepalaTampil) s.push('kepala hub (eyebrow / judul / pengantar) masih tampil di HP');
      if (!d.potretKepala) s.push('potret kecil Miss Raksa tidak ada di kepala pemain');
      const k = main[0];
      if (k) {
        if (!/\/cerita\/auto-2$/.test(k.id)) s.push(`kartu bukan auto-2: ${k.id}`);
        // Fix 1: meta boleh pindah baris ANTAR butir bila tidak muat (en 360 px), maks 2 baris; tiap butir utuh (cek terpotong di bawah).
        if (!k.meta || k.meta.baris > 2) s.push(`baris meta ${k.meta?.baris} baris`);
        data.metaBaris = k.meta?.baris;
        // T-037 Fix 1 (D-341): chip di baris sendiri DI ATAS meta; meta utuh (tanpa elipsis / terpotong).
        if (!k.meta?.chipDiAtas) s.push('chip jenis bukan baris sendiri tepat di atas baris meta');
        if (k.meta?.terpotong) s.push(`baris meta terpotong / berelipsis ${JSON.stringify(k.meta.lebar)}`);
        if (k.meta && k.meta.teks.length !== 5) s.push(`baris meta ${k.meta.teks.length} butir (harus 5)`);
        if (d.lebarHalaman > d.lebar + 0.5) s.push('halaman lebih lebar dari layar');
        const ep1 = kamus(lang, 'episodeKe').replace('{n}', '1');
        if (k.meta && k.meta.teks[0] !== ep1) s.push(`meta "${k.meta.teks[0]}", harus "${ep1}"`);
        const c = k.chip;
        if (!c) s.push('chip jenis tidak ada');
        else {
          if (c.teks !== kamus(lang, 'jenis.nyata') || c.jenis !== 'nyata') s.push(`chip "${c.teks}"`);
          if (Math.abs(c.kotak.h - 20) > 0.6 || c.huruf !== '11px') s.push(`chip ${c.kotak.h} px tinggi, huruf ${c.huruf}`);
          if (c.latar !== 'rgb(255, 144, 0)' || c.warna !== 'rgb(33, 33, 33)') s.push(`warna chip ${c.latar} / ${c.warna}`);
          if (c.terpotong) s.push('chip terpotong');
          const w = k.wajah?.kotak;
          if (w && !(c.kotak.x >= w.r || c.kotak.r <= w.x || c.kotak.y >= w.b || c.kotak.b <= w.y)) s.push('chip menumpang potret');
        }
        if (!k.wajah?.tampil || !k.wajah.svg || Math.abs(k.wajah.kotak.w - 96) > 0.5 || Math.abs(k.wajah.kotak.h - 96) > 0.5) s.push(`potret ${JSON.stringify(k.wajah)}`);
        const maksRingkas = vp.h <= 700 ? 1 : 2;
        if (k.ringkasBaris > maksRingkas || k.ringkasBaris < 1) s.push(`ringkasan ${k.ringkasBaris} baris (maks ${maksRingkas})`);
        if (k.statusBaris !== 1 || !k.ikonSebaris) s.push(`status ${k.statusBaris} baris, ikon sebaris ${k.ikonSebaris}`);
        const harapTombol = kamus(lang, pemain === 'baru' ? 'tombolMulai' : 'tombolLanjutkan');
        if (!k.tombol || k.tombol.teks !== harapTombol || k.tombol.kotak.h < 47.5 || k.tombol.kotak.w < k.kotak.w - 40) s.push(`tombol ${JSON.stringify(k.tombol)} (harus "${harapTombol}", >= 48 px, selebar kartu)`);
      }
      const z = d.kartu.find((x) => x.jenis === 'segera');
      if (z) {
        if (z.kotak.h > 64.5) s.push(`baris terkunci ${z.kotak.h} px (maks 64)`);
        if (z.disabled !== 'true' || z.tab !== 0 || z.tautan) s.push(`baris terkunci: aria-disabled ${z.disabled}, tabIndex ${z.tab}, tautan ${z.tautan}`);
        const url0 = h.p.url();
        await h.p.click('.cer-segera-baris'); await tunggu(300);
        const catat = await h.p.evaluate(() => document.querySelector('.cer-segera-catatan')?.textContent ?? '');
        const tinggi = await h.p.evaluate(() => document.querySelector('.cer-segera-baris').getBoundingClientRect().height);
        if (h.p.url() !== url0) s.push(`ketukan baris terkunci pindah ke ${h.p.url()}`);
        if (catat !== kamus(lang, 'pemilih.segeraCatatan')) s.push(`catatan "${catat}"`);
        if (tinggi > 64.5) s.push(`baris terkunci saat catatan ${tinggi} px`);
        if (vp.n === '390x745' && pemain === 'baru') await h.p.screenshot({ path: path.join(OUT, `pemilih-${vp.n}-${lang}-catatan.png`) });
        await tunggu(2200);
        if (await h.p.evaluate(() => document.querySelector('.cer-segera-catatan')?.textContent)) s.push('catatan tidak hilang sesudah 2 s');
      }
      await h.p.screenshot({ path: path.join(OUT, `${nama}.png`) });
      lapor(nama, s.length === 0, { sebab: s, metaBaris: data.metaBaris, gulir: d.gulir, tinggiKartu: k ? Math.round(k.kotak.h) : null, tinggiTerkunci: z ? Math.round(z.kotak.h) : null, bawah: Math.round(Math.max(...d.kartu.map((x) => x.kotak.b))) });
    })(), 60000, nama);
  } catch (e) { lapor(nama, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 160)] }); }
  await h?.tutup();
}
// Lebar (>= 600 px): satu kartu nyata + baris terkunci, tanpa demo; tangkapan layar saja + jumlah.
if (!hanya || 'pemilih-1280x800-id'.includes(hanya)) {
  let h = null;
  try {
    h = await bukaGulir('chromium', b, BASE, { n: '1280x800', w: 1280, h: 800, dpr: 1 }, 'id', null, '/cerita'); await siap(h.p); await tunggu(1200);
    const d = await ukur(h.p);
    await h.p.screenshot({ path: path.join(OUT, 'pemilih-1280x800-id.png') });
    const s = [];
    if (d.kartu.map((k) => k.jenis).join(',') !== 'kartu,segera') s.push(`urutan ${d.kartu.map((k) => k.jenis).join(',')}`);
    if (d.kartu[0]?.chip?.teks !== kamus('id', 'jenis.nyata')) s.push('chip');
    lapor('pemilih-1280x800-id', s.length === 0, { sebab: s });
  } catch (e) { lapor('pemilih-1280x800-id', false, { sebab: [String(e?.message ?? e).slice(0, 160)] }); }
  await h?.tutup();
}
batal(); await b.close().catch(() => {});
fs.writeFileSync(path.join(OUT, 'cek-pemilih.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
