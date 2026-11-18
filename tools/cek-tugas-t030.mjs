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
const batal = pasangPenjaga(40, () => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
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
// ---- T-035: kartu HASIL / TUGAS / PELAJARAN dan panel dalamnya, di setiap state tersimpan (maju dengan Lanjut sampai 10 ketukan),
// 390x745 dan 360x640 x id / en / zh: tidak ada kotak teks yang beririsan dengan kotak tab; tab berpusat di garis atas kartu;
// teks panel dalam (Kenapa / status, kutipan tindakan) >= 14 px dari garis kirinya.
if (!process.argv.includes('--tanpa-hasil')) {
  const ukurKartu = (p) => p.evaluate(() => {
    const out = [];
    const r = (e) => e.getBoundingClientRect();
    const tampak = (e) => { const x = r(e); return x.width > 0 && x.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    for (const tab of document.querySelectorAll('.hp-tindakan > b, .hp-aksi-label, .akh-pelajaran-label')) {
      if (!tampak(tab) || tab.closest('.hp-vn-dialog[data-tab]')) continue;
      const kartu = tab.closest('.hp-vn-dialog, section.hp-aksi, .hp-aksi, .akh-pelajaran'); if (!kartu) continue;
      const tr = r(tab); const kr = r(kartu);
      const teks = [...kartu.querySelectorAll('*')].filter((e) => e !== tab && !tab.contains(e) && !e.contains(tab) && tampak(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const tabrak = teks.filter((e) => { const x = r(e); return x.left < tr.right - 0.5 && tr.left < x.right - 0.5 && x.top < tr.bottom - 0.5 && tr.top < x.bottom - 0.5; }).map((e) => e.textContent.trim().slice(0, 24));
      out.push({ jenis: 'tab', tab: tab.textContent.trim(), pusat: Math.round((tr.top + tr.height / 2 - kr.top) * 10) / 10, tabrak });
    }
    // Tab kartu HASIL digambar sebagai ::before dari data-tab: kotaknya dihitung dari gayanya (pusat di garis atas, kiri 12 px).
    for (const kartu of document.querySelectorAll('.hp-vn-dialog[data-tab]')) {
      if (!tampak(kartu)) continue; const kr = r(kartu); const cs = getComputedStyle(kartu, '::before'); if (cs.content === 'none') continue;
      const uk = document.createElement('span'); uk.textContent = kartu.getAttribute('data-tab'); Object.assign(uk.style, { position: 'absolute', visibility: 'hidden', font: cs.font, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, whiteSpace: 'nowrap' }); document.body.append(uk);
      const w = uk.getBoundingClientRect().width + 16; uk.remove(); const h = 22; const tr = { left: kr.left + 12, right: kr.left + 12 + w, top: kr.top + 1.5 - h / 2, bottom: kr.top + 1.5 + h / 2 };
      const teks = [...kartu.querySelectorAll('*')].filter((e) => tampak(e) && r(e).width > 1 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const tabrak = teks.filter((e) => { const x = r(e); return x.left < tr.right - 0.5 && tr.left < x.right - 0.5 && x.top < tr.bottom - 0.5 && tr.top < x.bottom - 0.5; }).map((e) => e.textContent.trim().slice(0, 24));
      out.push({ jenis: 'tab', tab: kartu.getAttribute('data-tab'), pusat: 1.5, tabrak });
    }
    for (const panel of document.querySelectorAll('.hp-status-catatan, .hp-vn-dialog .hp-tindakan')) {
      if (!tampak(panel)) continue; const pr = r(panel);
      const teks = [...panel.querySelectorAll('*')].concat([panel]).filter((e) => tampak(e) && r(e).width > 1 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      // jarak teks dari garis kiri panel (rentang teks, bukan kotak elemen)
      let kiri = Infinity; for (const e of teks) for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) kiri = Math.min(kiri, q.left - pr.left); }
      out.push({ jenis: 'panel', kelas: panel.className.split(' ')[0], kiri: Math.round(kiri * 10) / 10 });
    }
    return out;
  });
  let tab = 0, panel = 0; const bertemu = new Set();
  for (const vp of [{ n: '390x745', w: 390, h: 745, dpr: 2 }, { n: '360x640', w: 360, h: 640, dpr: 2 }]) for (const lang of ['id', 'en', 'zh']) for (const st of Object.keys(S)) {
    let h = null;
    try {
      await denganBatas((async () => {
        h = await bukaGulir('chromium', b, BASE, vp, lang, S[st].nilai); await siap(h.p);
        const sebab = [];
        for (let i = 0; i < 10; i++) {
          const d = await ukurKartu(h.p);
          for (const x of d) {
            if (x.jenis === 'tab') { tab++; bertemu.add(x.tab); if (x.tabrak.length) sebab.push(`tab "${x.tab}" menutupi: ${x.tabrak.join(' | ')}`); if (Math.abs(x.pusat - 1.5) > 2) sebab.push(`tab "${x.tab}" pusat ${x.pusat} px dari garis atas`); }
            else { panel++; if (x.kiri < 13.5) sebab.push(`panel ${x.kelas}: teks ${x.kiri} px dari garis kiri`); }
          }
          if (d.some((x) => x.jenis === 'tab' && x.tab.length) && !fs.existsSync(path.join(OUT, '..', '..', 'T-035', `hasil-${st}-${vp.n}-${lang}.png`)) && vp.n === '390x745' && lang === 'id') {
            fs.mkdirSync(path.join(ROOT, 'team/evidence/T-035'), { recursive: true });
            await h.p.screenshot({ path: path.join(ROOT, 'team/evidence/T-035', `hasil-${st}-${vp.n}-${lang}.png`) });
          }
          if (!(await h.p.evaluate(() => { const x = document.querySelector('.hp-vn-aksi [data-lanjut], [data-lanjut]'); if (!x) return false; x.click(); return true; }))) break;
          await tunggu(700);
        }
        lapor(`kartu-${st}-${vp.n}-${lang}`, sebab.length === 0, { sebab: [...new Set(sebab)].slice(0, 6) });
      })(), 120000, st);
    } catch (e) { lapor(`kartu-${st}-${vp.n}-${lang}`, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 140)] }); }
    await h?.tutup();
  }
  console.log(`# kartu: ${tab} tab diukur (${[...bertemu].join(', ')}), ${panel} panel dalam diukur`);
}
batal(); await b.close().catch(() => {});
fs.writeFileSync(path.join(OUT, 'tugas-hasil.json'), JSON.stringify(hasil, null, 1));
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
