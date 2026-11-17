/**
 * T-030/T-031 (catatan pemilik 18 Nov 2026): kartu TUGAS (K4) tiap aktivitas Episode 2 di 390x745 (DPR 2), bahasa Indonesia.
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-tugas-t030.mjs
 * Per aktivitas (K02, K04, K05, K07, K08, K09, K10, K11, K-SIM; state team/evidence/T-013/states.json): ketuk Lanjut sampai
 * kartu tugas tampil, lalu ukur: bagian dalam kiri/kanan/atas/bawah >= 14 px (judul, kalimat dan tombol Mulai tidak menempel
 * bingkai), tab TUGAS duduk di garis atas (pusat tegaknya di dalam bingkai 3 px +- 2 px), jarak 10 px dari isi di atasnya,
 * tombol Mulai terinset 14 px, halaman tidak menggulir. Tangkapan -> team/evidence/T-030/fullstack/tugas-<kode>.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bukaGulir, luncur, siap, tunggu, denganBatas, pasangPenjaga } from './t018-umum.mjs';
import { mulaiPrioritasRendah } from './prioritas-rendah.mjs';
mulaiPrioritasRendah();
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'team/evidence/T-030/fullstack'); fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
if (['4000', '4001', '4002'].includes(new URL(BASE).port)) { console.error('DITOLAK: port milik server lain'); process.exit(2); }
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
const AKT = [['k02', 'tel-cemas'], ['k04', 'pool'], ['k05', 'bengkel'], ['k07', 'bima'], ['k08', 'tol'], ['k09', 'wawancara-1'], ['k10', 'wawancara-2'], ['k11', 'berkas'], ['ksim', 'akt-saksi']];
const VP = { n: '390x745', w: 390, h: 745, dpr: 2 };
const hasil = []; let gagal = 0;
const lapor = (n, ok, d) => { hasil.push({ nama: n, lulus: ok, ...d }); if (!ok) gagal++; console.log(ok ? 'PASS' : 'FAIL', n, JSON.stringify(d)); };
let b = await luncur('chromium');
const batal = pasangPenjaga(10, () => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
for (const [kode, st] of AKT) {
  let h = null;
  try {
    await denganBatas((async () => {
      h = await bukaGulir('chromium', b, BASE, VP, 'id', S[st].nilai);
      await h.p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
      await siap(h.p);
      for (let i = 0; i < 12 && !(await h.p.evaluate(() => !!document.querySelector('[data-mulai-tugas]'))); i++) {
        await h.p.evaluate(() => document.querySelector('[data-lanjut], [data-mulai-percakapan]')?.click()); await tunggu(900); await siap(h.p, 4000);
      }
      await tunggu(900);
      const d = await h.p.evaluate(() => {
        const t = document.querySelector('[data-mulai-tugas]'); if (!t) return null;
        const k = t.closest('.hp-aksi'); if (!k) return { tanpaKartu: true };
        const r = (e) => e.getBoundingClientRect(); const kr = r(k); const lab = k.querySelector('.hp-aksi-label'); const lr = lab ? r(lab) : null;
        const isi = [...k.children].filter((e) => e !== lab && r(e).height > 0).map(r);
        const kiri = Math.min(...isi.map((x) => x.left - kr.left)), kanan = Math.min(...isi.map((x) => kr.right - x.right));
        const atas = Math.min(...isi.map((x) => x.top - kr.top)), bawah = Math.min(...isi.map((x) => kr.bottom - x.bottom));
        let naik = k; while (naik && !naik.previousElementSibling && naik.parentElement) naik = naik.parentElement;
        const sebelum = naik?.previousElementSibling ?? null; const celah = sebelum && lr ? Math.round((lr.top - r(sebelum).bottom) * 10) / 10 : null;
        const tr = r(t);
        return { kiri: Math.round(kiri * 10) / 10, kanan: Math.round(kanan * 10) / 10, atas: Math.round(atas * 10) / 10, bawah: Math.round(bawah * 10) / 10,
          tabPusat: lr ? Math.round((lr.top + lr.height / 2 - kr.top) * 10) / 10 : null, celahAtas: celah,
          mulai: [Math.round((tr.left - kr.left) * 10) / 10, Math.round((kr.right - tr.right) * 10) / 10],
          gulir: document.scrollingElement.scrollHeight - window.innerHeight, kartuDiLayar: kr.bottom <= window.innerHeight + 0.5 };
      });
      await h.p.evaluate(() => document.querySelector('[data-mulai-tugas]')?.closest('.hp-aksi')?.scrollIntoView({ block: 'center' }));
      await tunggu(300);
      await h.p.screenshot({ path: path.join(OUT, `tugas-${kode}.png`) });
      if (!d || d.tanpaKartu) { lapor('tugas-' + kode, false, { sebab: ['kartu tugas tidak tercapai'] }); return; }
      const s = [];
      for (const sisi of ['kiri', 'kanan', 'atas', 'bawah']) if (d[sisi] < 13.5) s.push(`dalam ${sisi} ${d[sisi]} < 14`);
      if (d.tabPusat === null || Math.abs(d.tabPusat - 1.5) > 2) s.push(`tab tidak di garis atas (pusat ${d.tabPusat} px dari tepi)`);
      if (d.celahAtas === null || d.celahAtas < 9.5) s.push(`celah ke isi di atas ${d.celahAtas} < 10`);
      if (d.mulai.some((x) => x < 13.5)) s.push(`Mulai tidak terinset 14 px: ${d.mulai}`);
      if (d.gulir > 0.5) s.push(`halaman menggulir ${d.gulir} px`);
      lapor('tugas-' + kode, s.length === 0, { sebab: s, ...d });
    })(), 90000, kode);
  } catch (e) { lapor('tugas-' + kode, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 160)] }); }
  await h?.tutup();
}
batal(); await b.close().catch(() => {});
fs.writeFileSync(path.join(OUT, 'tugas-hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
