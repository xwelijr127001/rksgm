/**
 * T-018 Tahap 2 (D-132, D-133, D-134): adegan, aktivitas, dan layar akhir Episode 2 muat di layar HP (halaman tidak menggulir).
 * Dipanggil oleh tools/cek-gulir-t018.mjs (keluarga layar ke-2..4) dan bisa dijalankan sendiri:
 *   UI_BASE=http://127.0.0.1:4003 node tools/cek-layar-t018.mjs [--keluarga adegan,aktivitas,akhir] [--vp 360x740,390x844]
 *        [--kasus potongan-nama] [--tanpa-webkit | --hanya-webkit] [--batas-menit 30] [--ukur]
 *   Tiap kasus mencetak satu baris saat selesai dan berbatas waktu 150 d; satu browser, ditutup tiap ganti ukuran; penjaga proses.
 * State = team/evidence/T-013/states.json (mesin cerita asli). Per kasus x 360x640, 360x740, 390x844, 390x645 (WebKit: 360x640 +
 * 390x645), SETIAP ketukan node itu (Lanjut sampai node berganti / kartu tugas / ringkasan):
 *  adegan  : halaman tidak menggulir; tombol utama di dalam visualViewport; hanya .hp-vn-isi yang boleh meluap dan bisa digulir
 *            sampai ujung; panggung >= minimum (2:1 dari lebarnya: 168 px di 360, 183 di 390); bentuk panggung & baris tujuan dicatat.
 *  aktivitas (K02, K08): kepala cerita, kepala aktivitas dan pertanyaan/baris rambu tersemat; hanya .hp-arena-gulir yang meluap;
 *            K02: gambar + instruksi + baki terlihat sekaligus, tombol kirim (ringkasan) di bilah bawah; K08: kotak jalan >= 300 px.
 *            K04 peta lokasi (T-020): kelima tempat utuh tanpa menggulir + tombol kirim terlihat; detail terlihat sesudah ketuk.
 *  akhir   : bilah aksi satu baris di dalam visualViewport; judul + pelajaran terlihat tanpa menggulir; hanya .hp-main yang menggulir
 *            sampai ujung (ringkasan keputusan).
 *  + desktop 1280 (bukan cangkang) dan Episode 1 (pemain standar, bukan layar ini): dicatat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// PENTING: jangan impor ./cek-gulir-t018.mjs dari sini (siklus dengan import() dinamisnya = proses macet); pakai t018-umum.mjs.
import { BatasWaktu, PerambanPerUkuran, argumen, bukaGulir, denganBatas, pasangPenjaga, siap, tunggu } from './t018-umum.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
export const VP_LAYAR = [{ n: '360x640', w: 360, h: 640, dpr: 2 }, { n: '390x645', w: 390, h: 645, dpr: 3 }, { n: '360x740', w: 360, h: 740, dpr: 2 }, { n: '390x844', w: 390, h: 844, dpr: 3 }];
const klik = (p, sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; }, sel);

/** Ukuran layar terkunci saat ini (adegan / arena / akhir). */
export const ukurLayar = (p) => p.evaluate(() => {
  const vv = window.visualViewport; const se = document.scrollingElement;
  const layar = document.querySelector('.hp-layar'); if (!layar) return null;
  const k = (el) => el?.getBoundingClientRect() ?? null;
  const tampak = (el) => { const r = k(el); return !!r && r.width > 0 && r.height > 0; };
  const dalam = (r) => !!r && r.left >= -0.5 && r.top >= -0.5 && r.right <= vv.width + 0.5 && r.bottom <= vv.height + 0.5;
  const nama = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  window.scrollTo(0, 99999); const gulirHalaman = Math.round(window.scrollY); window.scrollTo(0, 0);
  const meluap = [...layar.querySelectorAll('*')].filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
  const ujung = meluap.map((el) => { const a = el.scrollTop; el.scrollTop = el.scrollHeight; const s = el.scrollHeight - el.scrollTop - el.clientHeight; el.scrollTop = a; return Math.round(s); });
  const utama = [...layar.querySelectorAll('.hp-main .primary-action, .hp-akhir-aksi .primary-action')].filter(tampak).at(-1) ?? null;
  const tampilan = layar.getAttribute('data-tampilan');
  const d = {
    tampilan, node: document.querySelector('.hp-main')?.getAttribute('data-node'), kunci: layar.hasAttribute('data-kunci'), cangkang: getComputedStyle(layar).overflowY === 'hidden',
    halaman: se.scrollHeight, lebarHalaman: se.scrollWidth, layar: window.innerHeight, lebar: window.innerWidth, gulirHalaman,
    meluap: meluap.map(nama), sisaUjung: ujung, tombol: utama ? utama.textContent.trim().slice(0, 36) : null, tombolDalam: utama ? dalam(k(utama)) : null,
    kepala: Math.round(k(document.querySelector('.hp-kepala')).top), petunjukSuara: !!document.querySelector('[data-petunjuk-suara]'),
  };
  if (tampilan === 'adegan') {
    const vn = document.querySelector('.hp-vn'); const pg = vn?.querySelector('.cer-panggung.cer-latar'); const isi = vn?.querySelector('.hp-vn-isi');
    const pr = k(pg);
    Object.assign(d, {
      lokasi: vn?.querySelector('.cer-latar')?.getAttribute('data-lokasi') ?? null, bentuk: vn?.getAttribute('data-panggung'), alami: vn?.getAttribute('data-panggung-alami'), susun: vn?.getAttribute('data-susun') ?? null,
      panggung: pr ? [Math.round(pr.width), Math.round(pr.height)] : null, panggungAtas: pr ? Math.round(pr.top) : null, tujuanTampil: tampak(document.querySelector('.hp-tujuan')), tanpaTujuan: layar.hasAttribute('data-tanpa-tujuan'),
      teksGulir: isi ? isi.scrollHeight > isi.clientHeight + 1 : false, isi: isi ? [isi.clientHeight, isi.scrollHeight] : null, dialog: Math.round(k(vn?.querySelector('.hp-vn-dialog'))?.height ?? 0),
      // D-181: petunjuk suara (bila tampil) tidak boleh menutupi panggung maupun kotak dialog, dan harus di dalam layar.
      suaraMenutup: (() => { const s = k(document.querySelector('[data-petunjuk-suara]')); if (!s) return null; const kena = (r) => !!r && s.top < r.bottom - 0.5 && r.top < s.bottom - 0.5; return kena(pr) || kena(k(vn?.querySelector('.hp-vn-dialog:not([data-bayangan])'))) || !dalam(s); })(),
      mulaiTugas: !!document.querySelector('[data-mulai-tugas]'), lanjut: !!document.querySelector('.hp-vn-aksi [data-lanjut]'), siapPiksel: !pg || !!pg.querySelector('.cer-piksel[data-siap]'),
    });
  }
  if (tampilan === 'arena') {
    const a = document.querySelector('.hp-arena'); const g = a?.querySelector('.hp-arena-gulir'); const gr = k(g);
    const diG = (sel) => { const el = a?.querySelector(sel); const r = k(el); return el && r && r.height > 0 ? r.top >= gr.top - 0.5 && r.bottom <= gr.bottom + 0.5 : null; };
    const jalan = a?.querySelector('.lk-jalan, .lk-adegan, .hp-rambu svg');
    Object.assign(d, {
      pola: a?.getAttribute('data-pola'), kepalaArena: Math.round(k(a?.querySelector('.hp-arena-kepala'))?.top ?? -1),
      tanyaTersemat: !!a?.querySelector('.hp-arena-sematan .hp-tanya-arena'), rambuTersemat: !!a?.querySelector('.hp-arena-sematan .lk-tag-baris'), sematan: Math.round(k(a?.querySelector('.hp-arena-sematan'))?.height ?? 0),
      penggulir: g ? [g.clientHeight, g.scrollHeight] : null, kirimDiBilah: !!a?.querySelector('.hp-arena-kirim [data-kirim]'), kirimDiIsi: !!a?.querySelector('.hp-arena-gulir [data-kirim]'),
      gambarTerlihat: diG('.hp-panggung-benda'), instruksiTerlihat: diG('.hp-instruksi-baki'), bakiTerlihat: diG('.hp-wadah-daftar'), gambar: Math.round(k(a?.querySelector('.hp-panggung-benda'))?.height ?? 0),
      jalan: jalan ? [Math.round(k(jalan).width), Math.round(k(jalan).height)] : null, ringkasan: !!a?.querySelector('#hp-ringkasan-judul'),
    });
  }
  if (tampilan === 'akhir') {
    const m = document.querySelector('.hp-main'); const mr = k(m); const aksi = document.querySelector('.akh-aksi'); const ar = k(aksi);
    const diM = (sel) => { const r = k(document.querySelector(sel)); return r ? r.top >= mr.top - 0.5 && r.bottom <= mr.bottom + 0.5 : null; };
    Object.assign(d, {
      aksiTersemat: !!document.querySelector('.hp-akhir-aksi .akh-aksi'), aksiDalam: dalam(ar), aksiTinggi: ar ? Math.round(ar.height) : null, aksi: [...(aksi?.children ?? [])].map((x) => x.textContent.trim()),
      judulTerlihat: diM('.akh-judul'), pelajaranTerlihat: diM('.akh-pelajaran'), penggulir: [m.clientHeight, m.scrollHeight], ringkasan: !!document.querySelector('.hp-main .akh-kartu ~ *'),
    });
  }
  return d;
});

/** Nilai satu ukuran layar HP. Mengembalikan daftar sebab gagal. */
export function nilaiLayar(d) {
  const s = [];
  if (!d) return ['tanpa .hp-layar'];
  if (!d.kunci || !d.cangkang) s.push('layar tidak terkunci');
  if (d.halaman > d.layar + 0.5 || d.gulirHalaman !== 0) s.push(`halaman ${d.halaman} > ${d.layar}`);
  if (d.lebarHalaman > d.lebar + 0.5) s.push('luapan mendatar');
  if (d.kepala !== 0) s.push('kepala cerita bergerak');
  if (d.sisaUjung.some((x) => x > 1)) s.push('penggulir tidak sampai ujung');
  if (d.tombol !== null && !d.tombolDalam) s.push('tombol utama di luar visualViewport: ' + d.tombol);
  const boleh = d.tampilan === 'adegan' ? ['div.hp-vn-isi'] : d.tampilan === 'arena' ? ['div.hp-arena-gulir'] : ['main.hp-main'];
  const lain = d.meluap.filter((x) => !boleh.includes(x));
  if (lain.length) s.push('wilayah meluap lain: ' + lain.join(' '));
  if (d.tampilan === 'adegan') {
    if (!d.tombol) s.push('tanpa tombol utama');
    if (d.panggung && d.panggung[1] < Math.round(d.panggung[0] / 2) - 1) s.push(`panggung ${d.panggung[1]} < minimum ${Math.round(d.panggung[0] / 2)}`);
    if (d.teksGulir && d.panggung && d.bentuk !== 'pendek' && d.lebar < 600) s.push('teks menggulir sebelum panggung turun ke 2:1');
    if (d.teksGulir && d.tujuanTampil) s.push('teks menggulir sebelum baris tujuan disembunyikan');
    if (d.suaraMenutup) s.push('petunjuk suara menutupi panggung / kotak dialog (D-181)');
  }
  if (d.tampilan === 'arena') {
    if (d.kepalaArena < 0 || d.kirimDiIsi) s.push('kepala aktivitas / tombol kirim tidak tersemat');
  }
  if (d.tampilan === 'akhir') {
    if (!d.aksiTersemat || !d.aksiDalam || d.aksiTinggi > 60) s.push(`bilah aksi (${d.aksiTinggi} px) tidak satu baris / di luar layar`);
    if (!d.judulTerlihat || d.pelajaranTerlihat === false) s.push('judul / pelajaran tidak terlihat tanpa menggulir');
    if (!d.ringkasan) s.push('ringkasan keputusan tidak ada di penggulir');
  }
  return s;
}

/** Kasus adegan: SETIAP ketukan node state itu. `sampai` = 'node' (berhenti saat node berganti) | 'akhir' (lanjut ke layar akhir). */
async function adegan(p, sampai = 'node') {
  await siap(p);
  await p.evaluate(() => new Promise((r) => { const t0 = Date.now(); const f = () => (document.querySelector('.hp-vn .cer-piksel[data-siap]') || !document.querySelector('.hp-vn .cer-panggung') || Date.now() - t0 > 6000 ? r(1) : setTimeout(f, 100)); f(); }));
  const ketukan = []; const sebab = [];
  let d = await ukurLayar(p); const node = d?.node;
  for (let i = 0; i < 8 && d && d.tampilan === 'adegan' && d.node === node; i++) {
    await tunggu(350); d = await ukurLayar(p);
    const s = nilaiLayar(d); sebab.push(...s.map((x) => `ketukan ${i + 1}: ${x}`));
    // Owner 16 Nov: di ruang yang sama, ketukan berurutan memakai tinggi panggung yang SAMA (dinilai di 360x740 dan 390x844).
    const sblm = ketukan.at(-1);
    if (sblm?.panggung && d.panggung && sblm.lokasi === d.lokasi && sblm.panggung[1] !== d.panggung[1]) sebab.push(`ketukan ${i + 1}: tinggi panggung berubah ${sblm.panggung[1]} -> ${d.panggung[1]} di ruang yang sama`);
    // D-175: panggung juga tidak boleh BERGESER (mis. saat petunjuk suara hilang sesudah ketukan pertama).
    if (sblm?.panggung && d.panggung && sblm.lokasi === d.lokasi && sblm.tujuan === d.tujuanTampil && sblm.atas !== d.panggungAtas) sebab.push(`ketukan ${i + 1}: panggung bergeser ${sblm.atas} -> ${d.panggungAtas} px`);
    ketukan.push({ lokasi: d.lokasi, atas: d.panggungAtas, suara: d.petunjukSuara || undefined, bentuk: d.bentuk, alami: d.alami, panggung: d.panggung, dialog: d.dialog, tujuan: d.tujuanTampil, teksGulir: d.teksGulir, isi: d.teksGulir ? d.isi : undefined, tombol: d.tombol });
    if (d.mulaiTugas || !d.lanjut) break;
    await klik(p, '.hp-vn-aksi [data-lanjut]'); await tunggu(700);
    d = await ukurLayar(p);
  }
  let akhir = null;
  if (sampai === 'akhir' && d?.tampilan === 'akhir') {
    await tunggu(500); akhir = await ukurLayar(p);
    sebab.push(...nilaiLayar(akhir).map((x) => 'layar akhir: ' + x));
  } else if (sampai === 'akhir') sebab.push('layar akhir tidak tercapai');
  if (!ketukan.length) sebab.push('bukan adegan');
  return { lulus: sebab.length === 0, data: { sebab, node, ketukan, ...(akhir ? { akhir: { aksi: akhir.aksi, aksiTinggi: akhir.aksiTinggi, penggulir: akhir.penggulir, judulTerlihat: akhir.judulTerlihat, pelajaranTerlihat: akhir.pelajaranTerlihat } } : {}) } };
}
/** Maju (Lanjut) sampai kartu tugas, buka aktivitas, ukur. `lanjutan(p, sebab, data)` = langkah khusus aktivitas. */
async function aktivitas(p, lanjutan) {
  await siap(p);
  for (let i = 0; i < 10 && !(await p.evaluate(() => !!document.querySelector('[data-mulai-tugas]'))); i++) { if (!await klik(p, '[data-lanjut], [data-mulai-percakapan]')) break; await tunggu(900); await siap(p, 4000); }
  if (!await klik(p, '[data-mulai-tugas]')) return { lulus: false, data: { sebab: ['kartu tugas tidak tercapai'] } };
  await tunggu(1100);
  const d = await ukurLayar(p); const sebab = nilaiLayar(d).map((x) => 'buka: ' + x);
  const data = { pola: d?.pola, sematan: d?.sematan, penggulir: d?.penggulir, tanyaTersemat: d?.tanyaTersemat, rambuTersemat: d?.rambuTersemat, gambar: d?.gambar, jalan: d?.jalan };
  if (d?.tampilan !== 'arena') sebab.push('aktivitas tidak terbuka');
  else await lanjutan(p, d, sebab, data);
  return { lulus: sebab.length === 0, data: { sebab, ...data } };
}
const K02 = async (p, d, sebab, data) => {
  if (!d.tanyaTersemat) sebab.push('pertanyaan tidak tersemat');
  if (!(d.gambarTerlihat && d.instruksiTerlihat && d.bakiTerlihat)) sebab.push(`gambar/instruksi/baki tidak terlihat sekaligus (${d.gambarTerlihat}/${d.instruksiTerlihat}/${d.bakiTerlihat})`);
  if (d.gambar < 160) sebab.push('gambar dokumen < 160 px');
  // taruh 8 dokumen (baki pertama) -> ringkasan + tombol kirim di bilah bawah
  for (let i = 0; i < 12 && !(await p.evaluate(() => !!document.querySelector('#hp-ringkasan-judul'))); i++) { await klik(p, '.hp-wadah-daftar .hp-wadah'); await tunggu(650); }
  await tunggu(400);
  const r = await ukurLayar(p);
  sebab.push(...nilaiLayar(r).map((x) => 'ringkasan: ' + x));
  if (!r?.ringkasan || !r.kirimDiBilah) sebab.push('ringkasan / tombol kirim di bilah bawah tidak ada');
  Object.assign(data, { ringkasan: { penggulir: r?.penggulir, tombol: r?.tombol, kirimDiBilah: r?.kirimDiBilah } });
};
/**
 * T-020 [D-143 / D-144] papan lokasi K04: instruksi hijau tersemat; kelima tempat utuh di papan DAN di jendela penggulir tanpa saling
 * menutup; papan 202..300 px; ketuk = pilih (tanpa "Pilih tujuan ini"): strip nama + arti dan tombol kirim aktif, semuanya terlihat.
 */
const K04 = async (p, d, sebab, data) => {
  const ukur = () => p.evaluate(() => {
    const g = document.querySelector('.hp-arena-gulir').getBoundingClientRect(); const peta = document.querySelector('.hp-papan-lok')?.getBoundingClientRect();
    const dalam = (r, k) => r.top >= k.top - 0.5 && r.bottom <= k.bottom + 0.5 && r.left >= k.left - 0.5 && r.right <= k.right + 0.5;
    const t = [...document.querySelectorAll('.hp-papan-lok .hp-tempat')].map((x) => x.getBoundingClientRect());
    const tumpang = t.some((a, i) => t.some((b, j) => j > i && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));
    const strip = [...document.querySelectorAll('.hp-pola-tujuan > .hp-tujuan-benda, .hp-tempat-detail')].map((e) => e.getBoundingClientRect()).find((r) => r.height > 0);
    const kirim = document.querySelector('.hp-arena-kirim [data-kirim]'); const kr = kirim?.getBoundingClientRect();
    return { tempat: t.length, peta: peta ? [Math.round(peta.width), Math.round(peta.height)] : null, tempatUtuh: !!peta && t.every((r) => dalam(r, peta) && dalam(r, g)), tumpang, lebarUbin: t[0] ? Math.round(t[0].width) : null,
      strip: strip ? Math.round(strip.height) : null, stripTerlihat: !!strip && strip.top >= g.top - 0.5 && strip.bottom <= g.bottom + 0.5, stripTeks: document.querySelector('.hp-tempat-detail[data-strip="pilihan"] b')?.textContent ?? null,
      bilah: Math.round(document.querySelector('.hp-arena-kirim')?.getBoundingClientRect().height ?? 0), pelat: (() => { const r = document.querySelector('.hp-papan-lok-label')?.getBoundingClientRect(); return r ? [Math.round(r.width), Math.round(r.height)] : null; })(),
      instruksi: document.querySelector('.hp-arena-sematan .hp-instruksi-arena')?.textContent ?? null, tombolPilih: !!document.querySelector('[data-pilih-tujuan]'),
      kirim: kirim?.textContent.trim() ?? null, kirimMati: !!kirim?.disabled, kirimDalam: !!kr && kr.bottom <= window.visualViewport.height + 0.5 && kr.top >= 0 };
  });
  const a = await ukur();
  if (!d.tanyaTersemat || !a.instruksi) sebab.push('pertanyaan / baris instruksi tidak tersemat');
  if (a.tempat !== 5 || !a.tempatUtuh || a.tumpang) sebab.push('kelima tempat tidak utuh / saling menutup: ' + JSON.stringify([a.tempatUtuh, a.tumpang]));
  if (!a.peta || a.peta[1] < 202 || a.peta[1] > 300) sebab.push('papan di luar 202..300 px: ' + JSON.stringify(a.peta));
  if (!a.stripTerlihat) sebab.push('strip (tokoh + pertanyaannya) tidak terlihat');
  if (!a.kirim || !a.kirimDalam || !a.kirimMati) sebab.push('tombol kirim (nonaktif) tidak terlihat di bilah bawah');
  // ketuk tempat ke-3 (pool) = LANGSUNG terpilih: strip nama + arti, tombol kirim aktif, tanpa tombol "Pilih tujuan ini".
  await p.evaluate(() => document.querySelectorAll('.hp-papan-lok .hp-tempat')[2].click()); await tunggu(500);
  const c = await ukur(); const z = await ukurLayar(p);
  sebab.push(...nilaiLayar(z).map((x) => 'terpilih: ' + x));
  if (c.tombolPilih || !c.stripTeks) sebab.push('ketuk tidak langsung memilih (strip / tombol "Pilih tujuan ini")');
  if (c.kirimMati || !c.kirimDalam) sebab.push('tombol kirim tidak aktif / tidak terlihat sesudah memilih');
  if (a.bilah !== c.bilah) sebab.push(`bilah kirim berubah tinggi ${a.bilah} -> ${c.bilah} (D-179)`);
  if (a.peta && a.peta[1] < 230 && a.pelat && a.pelat[0] > 2) sebab.push('pelat "Papan ilustrasi" masih tampil di papan pendek (D-178)');
  if (a.kirim !== 'Ketuk satu tujuan.') sebab.push('label nonaktif bukan versi pendek (D-180): ' + a.kirim);
  if (!c.tempatUtuh || !c.stripTerlihat) sebab.push('tempat (dengan token) atau strip terpotong sesudah memilih');
  // ketuk tempat lain = ganti
  await p.evaluate(() => document.querySelectorAll('.hp-papan-lok .hp-tempat')[0].click()); await tunggu(400);
  const e = await ukur();
  if (!e.stripTeks || e.stripTeks === c.stripTeks) sebab.push('ketuk tempat lain tidak mengganti pilihan');
  Object.assign(data, { bilah: [a.bilah, c.bilah], pelat: a.pelat, peta: a.peta, strip: [a.strip, c.strip], lebarUbin: a.lebarUbin, instruksi: a.instruksi, kirimAwal: a.kirim, kirimAkhir: c.kirim, pengguliran: z?.penggulir });
};
const K08 = async (p, d, sebab, data) => {
  if (!d.rambuTersemat) sebab.push('baris rambu tidak tersemat');
  if (!d.jalan || d.jalan[0] < 300) sebab.push('kotak jalan < 300 px: ' + JSON.stringify(d.jalan));
  // Owner 16 Nov: sesudah menandai lajur, langkah kesimpulan tidak boleh membuat layar melompat. Jalani: ketuk rambu -> tandai
  // lajur -> lanjut (tiap rambu) sampai kesimpulan; di tiap pergantian langkah gambar jalan harus tetap di tempatnya (<= 2 px).
  const jalanAtas = () => p.evaluate(() => { const j = document.querySelector('.hp-rambu .lk-adegan'); return j ? Math.round(j.getBoundingClientRect().top) : null; });
  const tahap = () => p.evaluate(() => document.querySelector('.hp-rambu')?.getAttribute('data-tahap'));
  const lompat = []; const kartu = [];
  for (let i = 0; i < 8 && (await tahap()) !== 'putus'; i++) {
    const t = await tahap();
    if (t === 'ketuk') {
      await klik(p, '.lk-tag'); await tunggu(500);
      // D-176: kartu bunyi rambu utuh di jendela penggulir (di bawah kepala tersemat). D-177: tombol langkah di bilah bawah.
      const k = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir').getBoundingClientRect(); const c = document.querySelector('.hp-rambu .lk-bukti-kartu')?.getBoundingClientRect(); const t = document.querySelector('.hp-arena-kirim [data-lanjut-rambu]'); const r = t?.getBoundingClientRect();
        return { kartu: c ? [Math.round(c.top - g.top), Math.round(g.bottom - c.bottom)] : null, tombol: t?.textContent.trim() ?? null, tombolDalam: !!r && r.top >= 0 && r.bottom <= window.visualViewport.height + 0.5, tombolDiIsi: !!document.querySelector('.hp-arena-gulir [data-lanjut-rambu]') }; });
      kartu.push(k);
      if (!k.kartu || k.kartu[0] < -0.5 || k.kartu[1] < -0.5) sebab.push('kartu bunyi rambu tidak utuh sesudah rambu diketuk: ' + JSON.stringify(k.kartu));
      if (!k.tombol || !k.tombolDalam || k.tombolDiIsi) sebab.push('tombol langkah tidak di bilah bawah');
      continue;
    }
    if (t === 'tandai') {
      await p.evaluate(() => { const b = [...document.querySelectorAll('.lk-adegan button[aria-pressed]')]; (b.find((x) => x.getAttribute('aria-pressed') === 'false') ?? b[0])?.click(); });
      await tunggu(350);
      // gulir sampai tombol lanjut terlihat (seperti pemain), catat posisi jalan, lalu lanjut
      const a = await jalanAtas();
      await klik(p, '[data-lanjut-rambu]'); await tunggu(600);
      const b = await jalanAtas();
      const gl = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir'); return [Math.round(g.scrollTop), Math.round(g.scrollHeight - g.clientHeight)]; });
      // Tidak bisa dikoreksi hanya bila penggulir sudah di batasnya (isi di atas jalan menyusut saat gulir 0, atau isi habis).
      lompat.push({ ke: await tahap(), dari: a, menjadi: b, gulir: gl, diBatas: (b < a && gl[0] <= 0) || (b > a && gl[0] >= gl[1] - 1) });
      continue;
    }
    await klik(p, '.lk-tag, [data-lanjut-rambu]'); await tunggu(450);
  }
  const z = await ukurLayar(p);
  if ((await tahap()) !== 'putus') sebab.push('langkah kesimpulan tidak tercapai');
  sebab.push(...nilaiLayar(z).map((x) => 'kesimpulan: ' + x));
  if (lompat.filter((x) => x.ke === 'putus').some((x) => x.dari === null || x.menjadi === null || (Math.abs(x.dari - x.menjadi) > 2 && !x.diBatas))) sebab.push('gambar jalan melompat saat langkah berganti: ' + JSON.stringify(lompat));
  if (!z?.kirimDiBilah || !z.tanyaTersemat) sebab.push('kesimpulan: pertanyaan / tombol kirim tidak tersemat');
  Object.assign(data, { kartu, lompat, kesimpulan: { penggulir: z?.penggulir, tombol: z?.tombol } });
};
/** K05 rencana pemeriksaan: kartu info terlipat secara bawaan. K09: papan rencana + 5 kartu terlihat sekaligus. K10: pola umum. */
const K05 = async (p, d, sebab, data) => {
  const x = await p.evaluate(() => ({ info: [...document.querySelectorAll('.hp-arena-konteks details')].map((e) => e.open) }));
  if (!d.tanyaTersemat) sebab.push('pertanyaan tidak tersemat');
  if (x.info.some(Boolean)) sebab.push('kartu info terbuka secara bawaan');
  if (!d.kirimDiBilah) sebab.push('tombol kirim tidak di bilah bawah');
  Object.assign(data, x);
};
const K09 = async (p, d, sebab, data) => {
  const x = await p.evaluate(() => {
    const g = document.querySelector('.hp-arena-gulir').getBoundingClientRect(); const di = (r) => r.top >= g.top - 0.5 && r.bottom <= g.bottom + 0.5;
    const kartu = [...document.querySelectorAll('.hp-saksi-kartu')].map((e) => e.getBoundingClientRect()); const papan = document.querySelector('.hp-saksi-papan')?.getBoundingClientRect();
    const lb = document.querySelector('.hp-arena-kirim .hp-kirim-label');
    return { label: lb?.textContent ?? null, labelBaris: lb ? Math.round(lb.getBoundingClientRect().height / parseFloat(getComputedStyle(lb).lineHeight)) : null, kartu: kartu.length, kartuTerlihat: kartu.every(di), papanTerlihat: !!papan && di(papan), duaKolom: kartu.length > 1 && Math.abs(kartu[0].top - kartu[1].top) < 2, papan: papan ? Math.round(papan.height) : null };
  });
  if (!d.tanyaTersemat || !d.kirimDiBilah) sebab.push('pertanyaan / tombol kirim tidak tersemat');
  if (x.label !== 'Tandai 5 kartu lagi.' || x.labelBaris !== 1) sebab.push('label nonaktif K09 bukan satu baris pendek (D-180): ' + x.label);
  if (x.kartu !== 5 || !x.kartuTerlihat || !x.papanTerlihat || !x.duaKolom) sebab.push('papan rencana + 5 kartu (2 kolom) tidak terlihat sekaligus: ' + JSON.stringify(x));
  Object.assign(data, x);
};
const K10 = async (p, d, sebab) => { if (!d.tanyaTersemat) sebab.push('pertanyaan tidak tersemat'); };

/** Keluarga kasus dari namanya: adegan-* = adegan, arena-* = aktivitas, akhir-* = akhir. */
const keluargaKasus = (nama) => (nama.startsWith('arena-') ? 'aktivitas' : nama.startsWith('akhir-') ? 'akhir' : 'adegan');
export const BATAS_KASUS_LAYAR = 150000;

/**
 * Semua kasus Tahap 2 untuk satu mesin. `peramban` = PerambanPerUkuran (satu browser, ditutup tiap ganti ukuran: ukuran di luar,
 * kasus di dalam). Opsi: `keluarga` (daftar: adegan, aktivitas, akhir), `vp` ("360x740,390x844"), `kasus` (potongan nama), `ukur`.
 * Tiap kasus berbatas waktu BATAS_KASUS_LAYAR: yang macet = FAIL "batas waktu ...", browsernya dimatikan, lanjut ke kasus berikut.
 */
export async function jalankanTahap2(mesin, peramban, BASE, lapor, OUT, { vp: hanyaVp = null, ukur = false, kasus: hanyaKasus = null, keluarga = ['adegan', 'aktivitas', 'akhir'] } = {}) {
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-013/states.json'), 'utf8'));
  const wk = mesin === 'webkit';
  const pilihVp = hanyaVp ? String(hanyaVp).split(',').map((x) => x.trim()) : null;
  const daftarVp = VP_LAYAR.filter((v) => (pilihVp ? pilihVp.includes(v.n) : !wk || v.n === '360x640' || v.n === '390x645'));
  const KASUS = [
    ['adegan-k08-hasil', 'akt-rambu', (p) => adegan(p)], ['adegan-k09e', 'wawancara-3', (p) => adegan(p)], ['adegan-k05-hasil', 'foto', (p) => adegan(p)],
    ['adegan-k11-tugas', 'berkas', (p) => adegan(p)], ['adegan-pembuka', 'mentor', (p) => adegan(p)], ['adegan-k04-pool', 'pool', (p) => adegan(p)],
    ['adegan-k07-bima', 'bima', (p) => adegan(p)], ['adegan-k10', 'wawancara-2', (p) => adegan(p)],
    ['adegan-k08-tol', 'tol', (p) => adegan(p)], ['adegan-k09', 'wawancara-1', (p) => adegan(p)], ['adegan-awal-baru', null, (p) => adegan(p)],
    ['akhir-puas', 'akhir-puas', (p) => adegan(p, 'akhir')], ['akhir-catatan', 'akhir-catatan', (p) => adegan(p, 'akhir')], ['akhir-kurang', 'akhir-kurang', (p) => adegan(p, 'akhir')],
    ['arena-k02', 'tel-cemas', (p) => aktivitas(p, K02)], ['arena-k04-peta', 'pool', (p) => aktivitas(p, K04)],
    ['arena-k05-rencana', 'bengkel', (p) => aktivitas(p, K05)], ['arena-k09-saksi', 'wawancara-1', (p) => aktivitas(p, K09)], ['arena-k10-banding', 'wawancara-2', (p) => aktivitas(p, K10)], ['arena-k08', 'tol', (p) => aktivitas(p, K08)],
  ];
  const FOTO = new Set(['360x640', '390x844']);
  const dipakai = KASUS.filter((x) => keluarga.includes(keluargaKasus(x[0])) && (!hanyaKasus || x[0].includes(hanyaKasus)));
  for (const vp of daftarVp) for (const [nama, state, fn] of dipakai) {
    const label = `${nama}-${vp.n}-${mesin}`;
    if (state !== null && !S[state]) { lapor(label, false, { sebab: ['state ' + state + ' tidak ada'] }); continue; }
    let h = null;
    try {
      await denganBatas((async () => {
        const b = await peramban.untuk(vp);
        h = await bukaGulir(mesin, b, BASE, vp, 'id', state === null ? null : S[state].nilai); // null = episode baru (petunjuk suara tampil)
        const r = await fn(h.p);
        if (FOTO.has(vp.n) || nama.startsWith('akhir')) await h.p.screenshot({ path: path.join(OUT, `${label}.png`) });
        lapor(label, (r.lulus || ukur) && h.galat.length === 0, { ...r.data, ...(h.galat.length ? { galat: h.galat } : {}) });
      })(), BATAS_KASUS_LAYAR, label);
    } catch (e) {
      lapor(label, false, { sebab: [(e instanceof BatasWaktu ? '' : 'galat alat: ') + String(e?.message ?? e).slice(0, 200)] });
      if (e instanceof BatasWaktu) { peramban.bunuh(); h = null; }
    }
    await h?.tutup();
  }
  if (!wk && !pilihVp && !hanyaKasus && keluarga.includes('adegan')) {
    const DESK = { n: '1280', w: 1280, h: 800, dpr: 1 };
    // Desktop 1280: bukan cangkang (halaman boleh menggulir). Episode 1: pemain cerita standar (bukan layar ini), dicatat.
    for (const [nama, state] of [['adegan-pembuka', 'mentor'], ['akhir-puas', 'akhir-puas']]) {
      const h = await bukaGulir(mesin, await peramban.untuk(DESK), BASE, DESK, 'id', S[state].nilai);
      await siap(h.p); await tunggu(600);
      const d = await ukurLayar(h.p);
      await h.p.screenshot({ path: path.join(OUT, `${nama}-1280-${mesin}.png`) });
      lapor(`${nama}-1280-${mesin}`, !!d && !d.cangkang, { cangkang: d?.cangkang, halaman: d?.halaman, layar: d?.layar, bentuk: d?.bentuk, alami: d?.alami });
      await h.tutup();
    }
    for (const vp of [VP_LAYAR[0], VP_LAYAR[3]]) {
      const h = await bukaGulir(mesin, await peramban.untuk(vp), BASE, vp, 'id', null, '/cerita/auto-1');
      await siap(h.p); await tunggu(600);
      const d = await h.p.evaluate(() => ({ hpLayar: !!document.querySelector('.hp-layar'), pemain: document.querySelector('.cer-layar')?.className ?? null, halaman: document.scrollingElement.scrollHeight, layar: window.innerHeight }));
      await h.p.screenshot({ path: path.join(OUT, `ep1-pembuka-${vp.n}-${mesin}.png`) });
      lapor(`ep1-pembuka-${vp.n}-${mesin}`, !d.hpLayar, { ...d, catatan: 'Episode 1 = pemain cerita standar (PemainCerita), bukan layar HP ini; tidak diubah Tahap 2' });
      await h.tutup();
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs');
  mulaiPrioritasRendah();
  const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
  const OUT = path.join(ROOT, 'team/evidence/T-018/stage2');
  fs.mkdirSync(OUT, { recursive: true });
  const ukur = process.argv.includes('--ukur');
  const keluarga = argumen('--keluarga', 'adegan,aktivitas,akhir').split(',').map((x) => x.trim()).filter(Boolean);
  const hasil = []; let gagal = 0;
  const lapor = (nama, lulus, data) => { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); };
  const tulisHasil = () => fs.writeFileSync(path.join(OUT, 'hasil.json'), JSON.stringify(hasil, null, 1));
  let peramban = null;
  const batalPenjaga = pasangPenjaga(Number(argumen('--batas-menit', '30')), () => { lapor('penjaga', false, { sebab: ['seluruh proses melewati batas waktu'], selesai: hasil.length }); tulisHasil(); peramban?.bunuh(); });
  for (const mesin of process.argv.includes('--tanpa-webkit') ? ['chromium'] : process.argv.includes('--hanya-webkit') ? ['webkit'] : ['chromium', 'webkit']) {
    peramban = new PerambanPerUkuran(mesin);
    await jalankanTahap2(mesin, peramban, BASE, lapor, OUT, { vp: argumen('--vp'), kasus: argumen('--kasus'), ukur, keluarga });
    await peramban.tutup();
    console.log(`# ${mesin}: ${peramban.luncuran} kali luncur browser`);
  }
  batalPenjaga();
  tulisHasil();
  console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
  process.exit(gagal ? 1 : 0);
}
