/**
 * T-034: K15 "Pesan penutupan" sebagai penyusun pesan piksel. Dipakai sendiri dan dari tools/cek-layar-t018.mjs (kasus arena-k15).
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-k15-t034.mjs
 * State K15 = state "surat" (team/evidence/T-013/states.json) dengan node dipindah ke k15 (belum ada state K15 tersimpan).
 * Per 390x745 dan 360x640 (DPR 2) x id / en / zh x 0 dan 4 bagian dipilih:
 *  - halaman 0 px gulir DAN penggulir aktivitas (.hp-arena-gulir) 0 px gulir;
 *  - enam chip piksel 2 kolom, ikon tampil (gambar latar), sasaran >= 44 px, aria-pressed sesuai pilihan; tidak ada teks terpotong;
 *  - pratinjau di puncak: kosong = kalimat pesan kosong; 4 dipilih = 4 kalimat urut bagian; aria-expanded false, ketuk = true dan
 *    penuh, ketuk lagi = tertutup; sesudah itu (dan saat terbuka) KETUKAN SENTUH page.tap pada bagian terpilih mengeluarkannya (D-331);
 *  - tiga baris bantu hilang (lompat ke pratinjau, judul bagian, catatan draf), tautan tampilan daftar tidak di bawah aktivitas
 *    tetapi ada di Menu; tombol kirim nonaktif saat kosong, aktif saat ada bagian.
 * Tangkapan -> team/evidence/T-034/fullstack/k15-<ukuran>-<bahasa>-<n>.png; hasil.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { bukaGulir, luncur, siap, tunggu, denganBatas, pasangPenjaga } from './t018-umum.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
export function stateK15() {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
  const v = JSON.parse(S.surat.nilai); const e = v.episode['auto-2'].state; e.node = 'k15'; e.baris = 0;
  return JSON.stringify(v);
}
export async function bukaK15(p) {
  await siap(p);
  for (let i = 0; i < 14 && !(await p.evaluate(() => !!document.querySelector('[data-mulai-tugas]') || !!document.querySelector('.hp-arena[data-pola="pesan"]'))); i++) {
    await p.evaluate(() => document.querySelector('[data-lanjut], [data-mulai-percakapan]')?.click()); await tunggu(900); await siap(p, 4000);
  }
  await p.evaluate(() => document.querySelector('[data-mulai-tugas]')?.click()); await tunggu(1200);
  if (!(await p.evaluate(() => !!document.querySelector('.hp-arena[data-pola="pesan"]')))) throw new Error('K15 tidak terbuka');
}
export const ukurK15 = (p) => p.evaluate(() => {
  const a = document.querySelector('.hp-arena[data-pola="pesan"]'); const g = a.querySelector('.hp-arena-gulir'); const r = (e) => e.getBoundingClientRect();
  const chip = [...a.querySelectorAll('.hp-pesan-bagian')]; const d = a.querySelector('.hp-draf');
  const tampak = (s) => [...a.querySelectorAll(s)].some((e) => r(e).height > 0 && getComputedStyle(e).display !== 'none');
  const potong = [...a.querySelectorAll('.hp-pesan-bagian-teks b, .hp-arena-judul, .hp-tanya-arena')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim().slice(0, 20));
  const kirim = [...document.querySelectorAll('[data-kirim]')].at(-1);
  return {
    gulirHalaman: document.scrollingElement.scrollHeight - innerHeight, gulirIsi: g ? g.scrollHeight - g.clientHeight : null,
    chip: chip.length, kolom: new Set(chip.map((c) => Math.round(r(c).left))).size, tinggiMin: Math.min(...chip.map((c) => Math.round(r(c).height))),
    ikon: chip.filter((c) => /url\(/.test(getComputedStyle(c).backgroundImage)).length, ditekan: chip.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.bagian),
    pratinjauAtas: d ? Math.round(r(d).top) <= Math.round(r(chip[0]).top) : false, pratinjau: d ? [...d.querySelectorAll('.hp-draf-kalimat')].map((k) => k.dataset.bagian) : null,
    kosong: !!d?.querySelector('.hp-draf-kosong'), terbuka: d?.getAttribute('aria-expanded'), tinggiPratinjau: d ? Math.round(r(d).height) : null,
    bantuTampil: ['.hp-ke-pratinjau', '.hp-pesan-susun > .hp-draf-judul', '.hp-kirim-catatan', '.hp-arena-alih'].filter(tampak),
    potong, kirimAktif: kirim ? !kirim.disabled : null, akhirLayar: kirim ? Math.round(r(kirim).bottom) <= innerHeight : null,
  };
});
/** Nilai satu ukuran; `n` = jumlah bagian yang harus dipilih (0 / 4). */
export function nilaiK15(d, n) {
  const s = [];
  if (d.gulirHalaman > 0.5) s.push(`halaman menggulir ${d.gulirHalaman} px`);
  if (d.gulirIsi > 0.5) s.push(`isi aktivitas menggulir ${d.gulirIsi} px`);
  if (d.chip !== 6 || d.kolom !== 2) s.push(`chip ${d.chip} dalam ${d.kolom} kolom`);
  if (d.tinggiMin < 44) s.push(`chip ${d.tinggiMin} px < 44`);
  if (d.ikon !== 6) s.push(`ikon ${d.ikon}/6`);
  if (!d.pratinjauAtas) s.push('pratinjau tidak di atas chip');
  if (d.ditekan.length !== n) s.push(`dipilih ${d.ditekan.length}, harus ${n}`);
  if (n === 0 && !d.kosong) s.push('pratinjau kosong tidak tampil');
  if (n > 0 && JSON.stringify(d.pratinjau) !== JSON.stringify(d.ditekan)) s.push(`pratinjau ${JSON.stringify(d.pratinjau)} != pilihan ${JSON.stringify(d.ditekan)}`);
  if (d.bantuTampil.length) s.push('baris bantu masih tampil: ' + d.bantuTampil.join(', '));
  if (d.potong.length) s.push('terpotong: ' + d.potong.join(', '));
  if (d.kirimAktif !== (n > 0)) s.push(`tombol kirim aktif ${d.kirimAktif}`);
  if (!d.akhirLayar) s.push('tombol kirim di luar layar');
  return s;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs'); mulaiPrioritasRendah();
  const OUT = path.join(ROOT, 'team/evidence/T-034/fullstack'); fs.mkdirSync(OUT, { recursive: true });
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
  if (['4000', '4001', '4002'].includes(new URL(BASE).port)) { console.error('DITOLAK: port milik server lain'); process.exit(2); }
  const st = stateK15(); const hasil = []; let gagal = 0;
  const lapor = (nm, ok, d) => { hasil.push({ nama: nm, lulus: ok, ...d }); if (!ok) gagal++; console.log(ok ? 'PASS' : 'FAIL', nm, JSON.stringify(d)); };
  const b = await luncur('chromium'); const batal = pasangPenjaga(15, () => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
  for (const vp of [{ n: '390x745', w: 390, h: 745, dpr: 2 }, { n: '360x640', w: 360, h: 640, dpr: 2 }]) for (const lang of ['id', 'en', 'zh']) {
    let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir('chromium', b, BASE, vp, lang, st);
        await h.p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
        await bukaK15(h.p);
        const d0 = await ukurK15(h.p); await h.p.screenshot({ path: path.join(OUT, `k15-${vp.n}-${lang}-0.png`) });
        lapor(`k15-${vp.n}-${lang}-0`, nilaiK15(d0, 0).length === 0, { sebab: nilaiK15(d0, 0), ...d0 });
        // 4 bagian dipilih dengan ketukan dan keyboard (Enter pada chip yang terfokus)
        const id = await h.p.evaluate(() => [...document.querySelectorAll('.hp-pesan-bagian')].map((c) => c.dataset.bagian));
        for (const [i, x] of [id[4], id[0], id[2]].entries()) { await h.p.click(`.hp-pesan-bagian[data-bagian="${x}"]`); await tunggu(150 + i); }
        await h.p.focus(`.hp-pesan-bagian[data-bagian="${id[5]}"]`); await h.p.keyboard.press('Enter'); await tunggu(400);
        const d4 = await ukurK15(h.p); const s4 = nilaiK15(d4, 4); const data4 = {};
        const urut = id.filter((x) => [id[4], id[0], id[2], id[5]].includes(x)); if (JSON.stringify(d4.pratinjau) !== JSON.stringify(urut)) s4.push(`urutan pratinjau ${JSON.stringify(d4.pratinjau)}, harus urutan bagian ${JSON.stringify(urut)}`);
        await h.p.screenshot({ path: path.join(OUT, `k15-${vp.n}-${lang}-4.png`) });
        await h.p.click('.hp-draf'); await tunggu(300);
        const buka = await h.p.evaluate(() => { const d = document.querySelector('.hp-draf'); return { aria: d.getAttribute('aria-expanded'), utuh: d.scrollHeight <= d.clientHeight + 1 }; });
        if (buka.aria !== 'true' || !buka.utuh) s4.push('pratinjau tidak terbuka penuh: ' + JSON.stringify(buka));
        if (vp.n === '390x745') await h.p.screenshot({ path: path.join(OUT, `k15-${vp.n}-${lang}-4-terbuka.png`) });
        await h.p.click('.hp-draf'); await tunggu(300);
        if ((await h.p.evaluate(() => document.querySelector('.hp-draf').getAttribute('aria-expanded'))) !== 'false') s4.push('pratinjau tidak tertutup lagi');
        // D-331: sesudah pratinjau dibuka dan ditutup, KETUKAN SENTUH sungguhan (page.tap) pada bagian terpilih mengeluarkannya.
        await h.p.tap(`.hp-pesan-bagian[data-bagian="${id[0]}"]`); await tunggu(400);
        const lepas = await h.p.evaluate((x) => ({ tekan: document.querySelector(`.hp-pesan-bagian[data-bagian="${x}"]`).getAttribute('aria-pressed'), di: [...document.querySelectorAll('.hp-draf-kalimat')].map((k) => k.dataset.bagian) }), id[0]);
        if (lepas.tekan !== 'false' || lepas.di.includes(id[0])) s4.push('ketukan sentuh sesudah pratinjau dibuka tidak mengeluarkan bagian: ' + JSON.stringify(lepas));
        // dan sesudah pratinjau DIBIARKAN terbuka
        await h.p.tap('.hp-draf'); await tunggu(300); await h.p.tap(`.hp-pesan-bagian[data-bagian="${id[2]}"]`); await tunggu(400);
        const lepas2 = await h.p.evaluate((x) => document.querySelector(`.hp-pesan-bagian[data-bagian="${x}"]`).getAttribute('aria-pressed'), id[2]);
        if (lepas2 !== 'false') s4.push('ketukan sentuh saat pratinjau terbuka tidak mengeluarkan bagian');
        data4.lepas = { sesudahTutup: lepas.tekan, saatTerbuka: lepas2 };
        await h.p.tap('.hp-draf'); await tunggu(300);
        // Menu: pengalih tampilan daftar
        await h.p.evaluate(() => document.querySelector('.hp-menu, [data-menu]')?.click()); await tunggu(500);
        if (!(await h.p.evaluate(() => !!document.querySelector('[data-menu-tampilan]')))) s4.push('pengalih tampilan daftar tidak ada di Menu');
        lapor(`k15-${vp.n}-${lang}-4`, s4.length === 0, { sebab: s4, ...d4, ...data4 });
      })(), 120000, vp.n + lang);
    } catch (e) { lapor(`k15-${vp.n}-${lang}`, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 160)] }); }
    await h?.tutup();
  }
  batal(); await b.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
