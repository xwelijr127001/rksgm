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
 *  akhir   : (T-024) kartu SATU LAYAR: tidak ada yang menggulir (halaman, .hp-main, kartu), aturan pas tidak terpakai (grafik 72 px;
 *            layar >= 700 px melonggar, D-245: Pelajaran utuh dan grafik sampai 96 px), bilah aksi
 *            satu baris di dalam visualViewport; judul, grafik, 15 token keputusan dan Pelajaran utuh terlihat. Rincian per bahasa,
 *            lembar dan aturan pas: tools/cek-kartu-t024.mjs (dipanggil cek-akhir-t019).
 *  + (T-025) adegan-k11-istilah: lembar istilah "Apa itu Komite Klaim?" di ketukan pengantar K11 (ruang Komite), dibuka dengan
 *            ketukan sungguhan: halaman tetap tidak menggulir, arti + deret empat anggota (ikon 32 px sebaris + peran) terlihat utuh di
 *            kotak dialog, tombol tugas tetap di dalam layar, panggung tetap >= minimum; ditutup lagi = layar kembali sah.
 *  + desktop 1280 (bukan cangkang) dan Episode 1 (pemain standar, bukan layar ini): dicatat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// PENTING: jangan impor ./cek-gulir-t018.mjs dari sini (siklus dengan import() dinamisnya = proses macet); pakai t018-umum.mjs.
import { BatasWaktu, PerambanPerUkuran, argumen, bukaGulir, denganBatas, pasangPenjaga, siap, tunggu } from './t018-umum.mjs';
import { bukaK15, nilaiK15, stateK15, ukurK15 } from './cek-k15-t034.mjs';

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
    // T-024: kartu satu layar. `luang` = sisa px di bawah blok terakhir kartu (negatif = isi meluap; kartu memotong luapannya).
    const kartu = document.querySelector('.akh-kartu'); const kr = k(kartu);
    const bawahKartu = kr ? kr.bottom - parseFloat(getComputedStyle(kartu).paddingBottom) : 0;
    const isiKartu = kartu ? [...kartu.children].filter((c) => !c.classList.contains('sr-only')).map((c) => k(c)).filter((r) => r.height > 0) : [];
    const tokenUtuh = [...document.querySelectorAll('.hp-main .akh-token-tombol')].filter((el) => { const r = k(el); return r.height >= 44 && r.width >= 44 && r.top >= mr.top - 0.5 && r.bottom <= bawahKartu + 0.5; }).length;
    Object.assign(d, {
      aksiTersemat: !!document.querySelector('.hp-akhir-aksi .akh-aksi'), aksiDalam: dalam(ar), aksiTinggi: ar ? Math.round(ar.height) : null, aksi: [...(aksi?.children ?? [])].map((x) => x.textContent.trim()),
      judulTerlihat: diM('.akh-judul'), pelajaranTerlihat: diM('[data-ukur="akhir-pelajaran"]'), grafikTerlihat: diM('.akh-grafik-ringkas'), penggulir: [m.clientHeight, m.scrollHeight],
      satuLayar: !!kartu?.hasAttribute('data-satu-layar') && layar.hasAttribute('data-akhir-satu'), pas: kartu?.getAttribute('data-pas') ?? null, kartu: kartu ? [kartu.clientHeight, kartu.scrollHeight] : null,
      luang: isiKartu.length ? Math.round((bawahKartu - Math.max(...isiKartu.map((r) => r.bottom))) * 10) / 10 : null, token: tokenUtuh, grafik: Math.round(k(document.querySelector('.akh-grafik-ringkas'))?.height ?? 0), lega: document.querySelector('.akh-kartu')?.getAttribute('data-lega') ?? null,
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
  // (T-024) layar akhir satu layar: TIDAK ADA wilayah yang boleh meluap.
  const boleh = d.tampilan === 'adegan' ? ['div.hp-vn-isi'] : d.tampilan === 'arena' ? ['div.hp-arena-gulir', 'div.hp-opsi-daftar', 'div.hp-lembar-badan'] : [];
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
    // (lembar kesimpulan K08: daftar pilihannya boleh menggulir di dalam lembar bila tidak muat)
    if (d.kepalaArena < 0 || d.kirimDiIsi) s.push('kepala aktivitas / tombol kirim tidak tersemat');
  }
  if (d.tampilan === 'akhir') {
    if (!d.aksiTersemat || !d.aksiDalam || d.aksiTinggi > 60) s.push(`bilah aksi (${d.aksiTinggi} px) tidak satu baris / di luar layar`);
    if (!d.satuLayar) s.push('layar akhir bukan bentuk satu layar (T-024)');
    if (d.penggulir[1] > d.penggulir[0]) s.push(`isi layar akhir menggulir ${d.penggulir[1] - d.penggulir[0]} px (T-024: seharusnya muat)`);
    if (d.kartu && (d.kartu[1] > d.kartu[0] || d.luang < -0.5)) s.push(`kartu akhir meluap: ${d.kartu[1]} > ${d.kartu[0]}, luang ${d.luang}`);
    // D-245 (polish T-024): layar tinggi (>= 700 px) melonggar: grafik 72..96 px; di bawahnya angka mock (72 px, tidak melonggar).
    const tinggi = d.layar >= 700;
    if (d.pas !== 'utuh' || (tinggi ? d.grafik < 72 || d.grafik > 96 : d.grafik !== 72)) s.push(`aturan pas terpakai di layar akhir: ${d.pas}, grafik ${d.grafik} px`);
    if (!tinggi && d.lega) s.push(`kartu akhir melonggar (${d.lega}) di layar ${d.layar} px (< 700)`);
    if (tinggi && !(d.lega ?? '').includes('pelajaran')) s.push(`kartu akhir tidak melonggar di layar tinggi ${d.layar} px (data-lega ${d.lega})`);
    if (!d.judulTerlihat || !d.pelajaranTerlihat || !d.grafikTerlihat) s.push('judul / grafik / pelajaran tidak utuh terlihat');
    if (d.token !== 15) s.push(`token keputusan utuh ${d.token}, seharusnya 15`);
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
    // T-021: selama 800 md pertama adegan telepon, panggung lama masih tampil (ditahan); bila sesudah jeda ini tampilannya sudah
    // berganti (obrolan) atau nodenya lain, ketukan node ini selesai dan tidak dinilai sebagai adegan.
    if (!d || d.tampilan !== 'adegan' || d.node !== node) break;
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
  return { lulus: sebab.length === 0, data: { sebab, node, ketukan, ...(akhir ? { akhir: { aksi: akhir.aksi, aksiTinggi: akhir.aksiTinggi, penggulir: akhir.penggulir, satuLayar: akhir.satuLayar, pas: akhir.pas, grafik: akhir.grafik, token: akhir.token, luang: akhir.luang, judulTerlihat: akhir.judulTerlihat, pelajaranTerlihat: akhir.pelajaranTerlihat } } : {}) } };
}
/**
 * T-025: lembar istilah Komite Klaim di ketukan pengantar K11. Peran yang diharapkan = teks tabel (states-komite.json `harap`).
 * Membuka istilah TIDAK menggeser atau mengubah panggung: isinya memanjang di dalam kotak dialog, yang menggulir sendiri dan
 * menggulirkan arti ke dalam pandangan. Yang dijaga selama terbuka: halaman tidak menggulir, hanya kotak dialog yang meluap dan
 * bisa digulir sampai ujung, arti + deret anggota terlihat utuh, tombol utama di dalam layar. Sebelum dibuka dan sesudah
 * ditutup: aturan adegan biasa (nilaiLayar).
 */
async function istilahKomite(p) {
  await siap(p);
  await p.evaluate(() => new Promise((r) => { const t0 = Date.now(); const f = () => (document.querySelector('.hp-vn .cer-piksel[data-siap]') || Date.now() - t0 > 6000 ? r(1) : setTimeout(f, 100)); f(); }));
  const sebab = [];
  const harap = JSON.parse(fs.readFileSync(path.join(ROOT, 'team/evidence/T-025/states-komite.json'), 'utf8')).harap.id.istilah;
  const d0 = await ukurLayar(p);
  sebab.push(...nilaiLayar(d0).map((x) => 'sebelum dibuka: ' + x));
  if (d0?.lokasi !== 'komite' || !d0?.mulaiTugas) sebab.push('ketukan pengantar K11 bukan ruang Komite berkartu tugas: ' + JSON.stringify([d0?.lokasi, d0?.mulaiTugas]));
  const ukur = () => p.evaluate(() => {
    const kotak = document.querySelector('.hp-vn-isi[data-gulir-dialog]'); const kr = kotak?.getBoundingClientRect();
    const arti = document.querySelector('[data-istilah-arti="komite"]'); const ar = arti?.getBoundingClientRect(); const tombol = document.querySelector('[data-istilah="komite"]');
    const butir = [...(arti?.querySelectorAll('.cer-istilah-anggota li') ?? [])].map((li) => { const ik = li.querySelector('.cer-istilah-ikon')?.getBoundingClientRect(); const tk = li.querySelector('span:not(.cer-istilah-ikon)'); const tr = tk?.getBoundingClientRect();
      return { teks: tk?.textContent.trim() ?? '', ikon: ik ? [Math.round(ik.width), Math.round(ik.height), Math.round(ik.top)] : null, baris: tk ? Math.round(tr.height / parseFloat(getComputedStyle(tk).lineHeight)) : 0, luap: tk ? tk.scrollWidth > tk.clientWidth + 1 : true, dalam: !!ar && !!tr && tr.left >= ar.left - 0.5 && tr.right <= ar.right + 0.5 }; });
    return { terbuka: tombol?.getAttribute('aria-expanded') ?? null, tinggiTombol: tombol ? Math.round(tombol.getBoundingClientRect().height) : 0, arti: arti && !arti.hidden ? arti.querySelector(':scope > p')?.textContent.trim() ?? null : null, butir,
      artiDiKotak: !!ar && !!kr && ar.height > 0 && ar.top >= kr.top - 0.5 && ar.bottom <= kr.bottom + 0.5, kotak: kotak ? [kotak.clientHeight, kotak.scrollHeight, Math.round(kotak.scrollTop)] : null };
  });
  const tutup = await ukur();
  if (tutup.terbuka !== 'false' || tutup.tinggiTombol < 44) sebab.push('tombol istilah Komite: ' + JSON.stringify([tutup.terbuka, tutup.tinggiTombol]));
  const titik = await p.evaluate(() => { const el = document.querySelector('[data-istilah="komite"]'); if (!el) return null; el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  if (!titik) return { lulus: false, data: { sebab: [...sebab, 'tombol istilah Komite tidak ada'] } };
  await p.mouse.click(titik[0], titik[1]); await tunggu(900);
  const d1 = await ukurLayar(p); const buka = await ukur();
  if (!d1) sebab.push('istilah terbuka: tanpa layar');
  else {
    if (!d1.kunci || !d1.cangkang || d1.halaman > d1.layar + 0.5 || d1.gulirHalaman !== 0 || d1.lebarHalaman > d1.lebar + 0.5) sebab.push(`istilah terbuka: halaman menggulir / layar tidak terkunci (${d1.halaman} > ${d1.layar})`);
    if (d1.meluap.some((x) => x !== 'div.hp-vn-isi') || d1.sisaUjung.some((x) => x > 1)) sebab.push('istilah terbuka: wilayah meluap lain / kotak dialog tidak sampai ujung: ' + JSON.stringify([d1.meluap, d1.sisaUjung]));
    if (d1.tombol === null || !d1.tombolDalam || d1.kepala !== 0) sebab.push('istilah terbuka: tombol utama di luar layar / kepala cerita bergerak');
    if (JSON.stringify([d1.panggung, d1.panggungAtas, d1.bentuk]) !== JSON.stringify([d0?.panggung, d0?.panggungAtas, d0?.bentuk])) sebab.push(`istilah terbuka: panggung berubah ${JSON.stringify([d0?.panggung, d0?.panggungAtas, d0?.bentuk])} -> ${JSON.stringify([d1.panggung, d1.panggungAtas, d1.bentuk])}`);
  }
  if (buka.terbuka !== 'true' || buka.arti !== harap.arti) sebab.push('arti tidak terbuka / bukan teks tabel: ' + JSON.stringify([buka.terbuka, buka.arti]));
  if (JSON.stringify(buka.butir.map((x) => x.teks)) !== JSON.stringify(harap.anggota.map((x) => x.teks))) sebab.push('peran anggota: ' + JSON.stringify(buka.butir.map((x) => x.teks)));
  if (buka.butir.some((x) => !x.ikon || x.ikon[0] !== 32 || x.ikon[1] !== 32) || new Set(buka.butir.map((x) => x.ikon?.[2])).size !== 1) sebab.push('ikon bukan 32 x 32 sebaris: ' + JSON.stringify(buka.butir.map((x) => x.ikon)));
  if (buka.butir.some((x) => x.luap || !x.dalam || x.baris < 1 || x.baris > 2)) sebab.push('peran terpotong / keluar kotak: ' + JSON.stringify(buka.butir.map((x) => [x.teks, x.baris, x.luap, x.dalam])));
  if (!buka.artiDiKotak) sebab.push('arti + deret anggota tidak terlihat utuh di kotak dialog: ' + JSON.stringify(buka.kotak));
  // Tutup lagi: layar kembali sah (bentuk panggung boleh tetap yang lebih rendah, aturan ruang yang sama).
  const titik2 = await p.evaluate(() => { const el = document.querySelector('[data-istilah="komite"]'); el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  { const info = await p.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, wk: !/Chrome\//.test(navigator.userAgent) })); const dirT025 = path.join(ROOT, 'team/evidence/T-025/fullstack'); fs.mkdirSync(dirT025, { recursive: true }); await p.screenshot({ path: path.join(dirT025, `layar-istilah-${info.w}x${info.h}-${info.wk ? 'webkit' : 'chromium'}.png`) }); }
  await p.mouse.click(titik2[0], titik2[1]); await tunggu(500);
  const d2 = await ukurLayar(p); const akhir = await ukur();
  sebab.push(...nilaiLayar(d2).map((x) => 'sesudah ditutup: ' + x));
  if (akhir.terbuka !== 'false' || akhir.arti !== null) sebab.push('istilah tidak tertutup lagi');
  return { lulus: sebab.length === 0, data: { sebab, node: d0?.node, panggung: [d0?.panggung, d1?.panggung, d2?.panggung], bentuk: [d0?.bentuk, d1?.bentuk, d2?.bentuk], tujuan: [d0?.tujuanTampil, d1?.tujuanTampil], kotak: buka.kotak, baris: buka.butir.map((x) => x.baris), teksGulir: d1?.teksGulir } };
}
/** Tangkapan layar per tahap aktivitas (T-020 batch 1): diisi jalankanTahap2; bawaan = tidak memotret. */
const KINI = { foto: async () => {} };

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
  await KINI.foto('awal');
  const k2 = () => p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const s = document.querySelector('.hp-benda .hp-seni-piksel'); const sr = s?.getBoundingClientRect(); const pg = document.querySelector('.hp-panggung-benda').getBoundingClientRect(); const bk = [...document.querySelectorAll('.hp-wadah .px-baki')].map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(e).imageRendering]; });
    const w = [...document.querySelectorAll('.hp-wadah-daftar .hp-wadah')].map((e) => e.getBoundingClientRect()); const isi = [...document.querySelectorAll('[data-isi-baki]')].map((e) => e.getBoundingClientRect());
    return { dok: sr ? [sr.width, sr.height, Math.round(sr.left - pg.left), Math.round(pg.bottom - sr.bottom), getComputedStyle(s).imageRendering] : null, baki: bk, bakiAtas: Math.round(w[0]?.top ?? 0), bakiUtuh: w.every((r) => r.bottom <= gr.bottom + 0.5), lencana: isi.map((r, i) => w[i] ? [Math.round(w[i].right - r.right), Math.round(r.top - w[i].top), r.width >= 22, r.height] : null), baris: Math.round(document.querySelector('.hp-baris-baki')?.getBoundingClientRect().height ?? 0), isiBaki: [...document.querySelectorAll('.hp-wadah')].map((e) => e.getAttribute('data-isi')).join(''), meluap: g.scrollHeight - g.clientHeight }; });
  const k0 = await k2();
  // dokumen 1 : 1 di konter (kiri 30 + tepi 2, 10 px di atas tepi bawah), baki atlas 68 x 40, lencana jumlah di kanan atas kartu.
  if (!k0.dok || k0.dok[4] !== 'pixelated' || ![64, 48].includes(k0.dok[0]) || k0.dok[2] !== 30 || k0.dok[3] !== 10) sebab.push('dokumen di konter bukan PNG 1 : 1 di (30, bawah 10): ' + JSON.stringify(k0.dok));
  if (k0.baki.length !== 3 || k0.baki.some((x) => x[0] !== 68 || x[1] !== 40 || x[2] !== 'pixelated')) sebab.push('baki bukan sel atlas 68 x 40: ' + JSON.stringify(k0.baki));
  if (!k0.bakiUtuh) sebab.push('tiga baki tidak utuh di jendela');
  if (k0.lencana.length !== 3 || k0.lencana.some((x) => !x || x[0] !== -5 || x[1] !== -7 || x[3] !== 22)) sebab.push('lencana jumlah bukan 22 x 22 di kanan atas tiap baki: ' + JSON.stringify(k0.lencana));
  await klik(p, '.hp-wadah-daftar .hp-wadah'); await tunggu(700);
  const k1 = await k2();
  await KINI.foto('taruh');
  if (k1.bakiAtas !== k0.bakiAtas) sebab.push('baki bergeser sesudah menaruh dokumen: ' + k0.bakiAtas + ' -> ' + k1.bakiAtas);
  if (k1.isiBaki[0] !== '1' || !k1.bakiUtuh) sebab.push('baki pertama tidak berisi / baki terpotong: ' + JSON.stringify([k1.isiBaki, k1.bakiUtuh]));
  // D-204: panel "Isi baki" terbuka di tempat gambar konter, utuh di jendela; D-209: tanpa lapisan papan nama.
  await klik(p, '[data-isi-baki]'); await tunggu(300);
  const pn = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir').getBoundingClientRect(); const r = document.querySelector('.hp-baki-panel')?.getBoundingClientRect(); const pg = document.querySelector('.hp-panggung-benda').getBoundingClientRect(); return { panel: r ? [Math.round(r.top - pg.top), Math.round(r.height)] : null, utuh: !!r && r.top >= g.top - 0.5 && r.bottom <= g.bottom + 0.5, isi: document.querySelectorAll('.hp-baki-panel li').length, papan: getComputedStyle(document.querySelector('.hp-panggung-benda')).backgroundImage.includes('papan-kantor') }; });
  await KINI.foto('isi');
  if (!pn.panel || !pn.utuh || pn.panel[0] !== 0 || pn.isi !== 1) sebab.push('panel Isi baki tidak di tempat gambar konter / tidak utuh (D-204): ' + JSON.stringify(pn));
  if (pn.papan) sebab.push('lapisan papan nama masih dipakai di konter (D-209)');
  await klik(p, '[data-isi-baki]'); await tunggu(250);
  Object.assign(data, { dok: k0.dok, baris: [k0.baris, k1.baris], lencana: k1.lencana, meluap: [k0.meluap, k1.meluap], panel: pn.panel });
  // taruh 8 dokumen (baki pertama) -> ringkasan + tombol kirim di bilah bawah
  for (let i = 0; i < 12 && !(await p.evaluate(() => !!document.querySelector('#hp-ringkasan-judul'))); i++) { await klik(p, '.hp-wadah-daftar .hp-wadah'); await tunggu(650); }
  await tunggu(400);
  const r = await ukurLayar(p);
  sebab.push(...nilaiLayar(r).map((x) => 'ringkasan: ' + x));
  if (!r?.ringkasan || !r.kirimDiBilah) sebab.push('ringkasan / tombol kirim di bilah bawah tidak ada');
  const rk = await p.evaluate(() => [...document.querySelectorAll('.hp-ringkasan-wadah')].map((e) => [e.querySelector('[data-jumlah]')?.getAttribute('data-jumlah'), e.getAttribute('data-isi'), getComputedStyle(e.querySelector('.px-baki') ?? e).backgroundPositionY]));
  if (rk.some((x) => (Number(x[0]) >= 3 ? '2' : Number(x[0]) >= 1 ? '1' : '0') !== x[1] || (x[1] !== '0') !== (x[2] !== '0px'))) sebab.push('ringkasan: gambar baki tidak mengikuti jumlah (D-208): ' + JSON.stringify(rk));
  // B-02 (QA T-021): ringkasan akhir (tiga kelompok tertutup) muat di jendela penggulir TANPA menggulir, di keempat ukuran (dulu
  // 17 px di Chromium / 21 px di WebKit pada 360 x 640). `luang` = sisa px antara akhir isi (+ bantalan bawah) dan tepi bawah jendela.
  const luang = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const bawah = Math.max(...[...g.children].map((c) => c.getBoundingClientRect()).filter((x) => x.height > 0).map((x) => x.bottom)); return Math.round((gr.bottom - bawah - parseFloat(getComputedStyle(g).paddingBottom)) * 10) / 10; });
  if (r?.penggulir && r.penggulir[1] > r.penggulir[0]) sebab.push(`ringkasan menggulir ${r.penggulir[1] - r.penggulir[0]} px, seharusnya muat (B-02)`);
  // Lencana jumlah per baris: [lebar, tinggi, jarak tepi kanan lencana ke tepi kanan baris].
  const ukurLencana = () => p.evaluate(() => [...document.querySelectorAll('.hp-ringkasan-jumlah')].map((e) => { const x = e.getBoundingClientRect(); return [Math.round(x.width * 10) / 10, Math.round(x.height * 10) / 10, Math.round(e.closest('.hp-ringkasan-kelompok').getBoundingClientRect().right - x.right)]; }));
  const lencanaGambar = await ukurLencana();
  await KINI.foto('ringkas');
  // Satu kelompok dibuka (8 dokumen di baki pertama = daftar terpanjang): isinya menggulir di SATU penggulir aktivitas, sampai ujung;
  // halaman diam, kepala dan bilah kirim tetap tersemat, tombol kirim utuh di layar (aturan D-133).
  await klik(p, '.hp-ringkasan-kelompok'); await tunggu(350);
  const rb = await ukurLayar(p);
  sebab.push(...nilaiLayar(rb).map((x) => 'ringkasan, kelompok dibuka: ' + x));
  const butir = await p.evaluate(() => document.querySelector('.hp-ringkasan-wadah[data-terbuka]')?.querySelectorAll('li').length ?? null);
  if (butir !== 8 || !rb?.kirimDiBilah) sebab.push('ringkasan, kelompok dibuka: daftar 8 dokumen / tombol kirim di bilah tidak ada: ' + JSON.stringify([butir, rb?.kirimDiBilah]));
  // Perbaikan kecil 2 (17 Nov): ringkasan yang sama di TAMPILAN DAFTAR (alternatif tanpa gambar; tautannya di ujung penggulir).
  // Muat tanpa menggulir di keempat ukuran (dulu 56 px Chromium / 60 px WebKit di 360 x 640); lencana jumlah 30 x 30 di tempat yang
  // sama dengan tampilan gambar (dulu melar selebar baris); tombol kirim tetap di bilah.
  await klik(p, '.hp-arena-alih button'); await tunggu(700);
  if (await klik(p, '.hp-ringkasan-kelompok[aria-expanded="true"]')) await tunggu(350); // ganti tampilan menutup kelompok; jaga-jaga
  const rd = await ukurLayar(p);
  const dft = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const bawah = Math.max(...[...g.children].map((c) => c.getBoundingClientRect()).filter((x) => x.height > 0).map((x) => x.bottom)); return { tampilan: document.querySelector('.hp-arena')?.getAttribute('data-tampilan'), luang: Math.round((gr.bottom - bawah - parseFloat(getComputedStyle(g).paddingBottom)) * 10) / 10, total: document.querySelector('.hp-ringkasan-total')?.textContent ?? null }; });
  const lencanaDaftar = await ukurLencana();
  sebab.push(...nilaiLayar(rd).map((x) => 'ringkasan daftar: ' + x));
  if (dft.tampilan !== 'daftar' || !rd?.ringkasan || !rd.kirimDiBilah) sebab.push('ringkasan daftar: tampilan daftar / ringkasan / tombol kirim di bilah tidak ada: ' + JSON.stringify([dft.tampilan, rd?.ringkasan, rd?.kirimDiBilah]));
  if (rd?.penggulir && rd.penggulir[1] > rd.penggulir[0]) sebab.push(`ringkasan daftar menggulir ${rd.penggulir[1] - rd.penggulir[0]} px, seharusnya muat`);
  if (lencanaDaftar.length !== 3 || lencanaDaftar.some((x) => x[0] !== 30 || x[1] !== 30) || JSON.stringify(lencanaDaftar) !== JSON.stringify(lencanaGambar)) sebab.push('ringkasan daftar: lencana jumlah bukan 30 x 30 di tempat yang sama dengan tampilan gambar: ' + JSON.stringify({ daftar: lencanaDaftar, gambar: lencanaGambar }));
  await KINI.foto('daftar');
  Object.assign(data, { ringkasan: { penggulir: r?.penggulir, luang, tombol: r?.tombol, kirimDiBilah: r?.kirimDiBilah, dibuka: { penggulir: rb?.penggulir, butir }, daftar: { penggulir: rd?.penggulir, luang: dft.luang, lencana: lencanaDaftar[0], total: dft.total } } });
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
  await KINI.foto('awal');
  const px = await p.evaluate(() => { const b = document.querySelector('.hp-papan-lok'); const g = [...document.querySelectorAll('.hp-papan-lok .hp-tempat .hp-seni-piksel')].map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(e).imageRendering, getComputedStyle(e).backgroundImage !== 'none']; }); return { papanPiksel: b?.classList.contains('hp-papan-px') ?? false, gambar: g }; });
  if (!px.papanPiksel || px.gambar.length !== 5 || px.gambar.some((g) => g[0] !== 80 || g[1] !== 60 || g[2] !== 'pixelated' || !g[3])) sebab.push('ubin tempat bukan PNG piksel 80 x 60: ' + JSON.stringify(px));
  if (!d.tanyaTersemat || !a.instruksi) sebab.push('pertanyaan / baris instruksi tidak tersemat');
  if (a.tempat !== 5 || !a.tempatUtuh || a.tumpang) sebab.push('kelima tempat tidak utuh / saling menutup: ' + JSON.stringify([a.tempatUtuh, a.tumpang]));
  const bulat = await p.evaluate(() => { const b = document.querySelector('.hp-papan-lok'); const br = b.getBoundingClientRect(); const t = b.querySelectorAll('.hp-tempat')[2]?.getBoundingClientRect(); return [br.height, t ? t.top - br.top : 0]; });
  // D-205: tinggi papan dan atas ubin tengah = px CSS utuh (di DPR 3 pecahan membuat baris piksel tidak rata).
  if (bulat.some((v) => Math.abs(v - Math.round(v)) > 0.01)) sebab.push('tinggi papan / atas ubin tengah bukan px utuh (D-205): ' + JSON.stringify(bulat));
  data.bulat = bulat;
  const jk = await p.evaluate(() => { const b = document.querySelector('.hp-papan-lok').getBoundingClientRect(); const g = [...document.querySelectorAll('.hp-papan-lok .hp-tempat .hp-seni-piksel')].map((e) => e.getBoundingClientRect()); const n = [...document.querySelectorAll('.hp-papan-lok .hp-tempat-nama')].map((e) => Math.round(e.getBoundingClientRect().height));
    return { g: g.map((r) => [Math.round(r.left - b.left), Math.round(r.top - b.top), Math.round(b.right - r.right), Math.round(b.bottom - r.bottom)]), nama: n }; });
  // README peta: kolom kiri x 14, kolom kanan 14 dari tepi kanan, baris atas y 10; label satu baris (17 px).
  if (jk.g[0]?.[0] !== 14 || jk.g[0]?.[1] !== 10 || jk.g[3]?.[2] !== 14 || jk.g[3]?.[1] !== 10 || jk.g[1]?.[0] !== 14 || jk.g[4]?.[2] !== 14) sebab.push('jangkar ubin bukan posisi README (D-186): ' + JSON.stringify(jk.g));
  if (jk.nama.slice(0, 2).some((h) => h > 19)) sebab.push('label tempat lebih dari satu baris (D-187): ' + JSON.stringify(jk.nama));
  data.jangkar = jk.g; data.bawah = [jk.g[1]?.[3], jk.g[4]?.[3]];
  if (!a.peta || a.peta[1] < 202 || a.peta[1] > 300) sebab.push('papan di luar 202..300 px: ' + JSON.stringify(a.peta));
  if (!a.stripTerlihat) sebab.push('strip (tokoh + pertanyaannya) tidak terlihat');
  if (!a.kirim || !a.kirimDalam || !a.kirimMati) sebab.push('tombol kirim (nonaktif) tidak terlihat di bilah bawah');
  // ketuk tempat ke-3 (pool) = LANGSUNG terpilih: strip nama + arti, tombol kirim aktif, tanpa tombol "Pilih tujuan ini".
  await p.evaluate(() => document.querySelectorAll('.hp-papan-lok .hp-tempat')[2].click()); await tunggu(500);
  const c = await ukur(); const z = await ukurLayar(p);
  await KINI.foto('pilih');
  const pin = await p.evaluate(() => { const t = document.querySelector('.hp-papan-lok .hp-tempat.terpilih'); const k = t?.querySelector('.hp-tempat-token')?.getBoundingClientRect(); const g = t?.querySelector('.hp-seni-piksel')?.getBoundingClientRect(); const b = document.querySelector('.hp-papan-lok').getBoundingClientRect(); return k && g ? { geser: [Math.round(k.left - g.left), Math.round(k.top - g.top)], ukuran: [k.width, k.height], dalamPapan: k.top >= b.top && k.right <= b.right } : null; });
  if (!pin || pin.geser[0] !== 52 || pin.geser[1] !== -8 || pin.ukuran[0] !== 40 || pin.ukuran[1] !== 42 || !pin.dalamPapan) sebab.push('cincin potret bukan di gambar (+52, -8) / di luar papan: ' + JSON.stringify(pin));
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
  // T-020 batch 1: adegan jalan piksel (W x 236), tiang rambu = tombol, tombol langkah di bilah bawah, kesimpulan = lembar di atas jalan.
  const adegan = () => p.evaluate(() => {
    const k = document.querySelector('.hp-rambu .lk-kotak'); if (!k) return null; const kr = k.getBoundingClientRect();
    const u = (sel) => { const e = k.querySelector(sel); const r = e?.getBoundingClientRect(); return r ? [Math.round(r.left - kr.left - 2), Math.round(r.top - kr.top - 2), r.width, r.height] : null; };
    return { piksel: k.classList.contains('lk-px'), kotak: [Math.round(kr.width), Math.round(kr.height)], jalan: u('.px-jalan'), lajur2: u('.lk-lajur:nth-of-type(2), .lk-lajur ~ .lk-lajur'), truk: u('.px-truk'), tuts1: u('.px-tuts[data-tuts="1"]'),
      tiang: [...k.querySelectorAll('.lk-tiang')].map((e) => e.getAttribute('data-keadaan')), tahap: document.querySelector('.hp-rambu')?.getAttribute('data-tahap') };
  });
  const a = await adegan();
  await KINI.foto('ketuk');
  const W = a ? a.kotak[0] - 4 : 0; const x0 = (W - 278) / 2;
  // D-182: di layar di bawah 700 px adegan dipotong 32 px dari atas (204); truk dan tuts ikut naik.
  const pt = (await p.evaluate(() => window.innerHeight)) < 700 ? 32 : 0;
  if (!a?.piksel || a.kotak[1] !== 236 - pt) sebab.push('adegan bukan piksel setinggi ' + (236 - pt) + ': ' + JSON.stringify(a?.kotak));
  if (!a?.jalan || a.jalan[0] !== x0 || a.jalan[2] !== 278) sebab.push('blok jalan bukan 278 px di tengah: ' + JSON.stringify(a?.jalan));
  if (!a?.truk || a.truk[0] !== x0 + 7 + 66 + 13 || a.truk[1] !== 80 - pt || a.truk[2] !== 40 || a.truk[3] !== 124) sebab.push('truk bukan di lajur 2 + 13, atas 80, 40 x 124: ' + JSON.stringify(a?.truk));
  if (!a?.tuts1 || a.tuts1[0] !== x0 + 7 + 13 || a.tuts1[1] !== 200 - pt) sebab.push('tuts lajur 1 bukan di kiri lajur + 13, atas 200: ' + JSON.stringify(a?.tuts1));
  if (a?.tiang.join() !== 'aktif,terkunci') sebab.push('tiang rambu awal bukan aktif + terkunci: ' + a?.tiang);
  if (!(await p.evaluate(() => !!document.querySelector('.hp-arena-sematan .hp-instruksi-arena')))) sebab.push('instruksi "ketuk rambu" tidak tersemat');
  const tahap = () => p.evaluate(() => document.querySelector('.hp-rambu')?.getAttribute('data-tahap'));
  const kartu = []; let difoto = false;
  for (let i = 0; i < 8 && (await tahap()) !== 'putus'; i++) {
    const t = await tahap();
    if (t === 'ketuk') {
      await klik(p, '.lk-tiang[data-keadaan="aktif"]'); await tunggu(500);
      // D-176: kartu bunyi rambu utuh di jendela penggulir. D-177: tombol langkah di bilah bawah.
      const k = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir').getBoundingClientRect(); const c = document.querySelector('.hp-rambu .lk-bukti-kartu')?.getBoundingClientRect(); const t = document.querySelector('.hp-arena-kirim [data-lanjut-rambu]'); const r = t?.getBoundingClientRect(); const j = document.querySelector('.hp-rambu .lk-kotak')?.getBoundingClientRect();
        return { kartu: c ? [Math.round(c.top - g.top), Math.round(g.bottom - c.bottom)] : null, adeganUtuh: j ? j.top >= g.top - 0.5 && j.bottom <= g.bottom + 0.5 : false, tombol: t?.textContent.trim() ?? null, tombolDalam: !!r && r.top >= 0 && r.bottom <= window.visualViewport.height + 0.5, tombolDiIsi: !!document.querySelector('.hp-arena-gulir [data-lanjut-rambu]') }; });
      kartu.push(k);
      if (!k.kartu || k.kartu[0] < -0.5 || k.kartu[1] < -0.5) sebab.push('kartu bunyi rambu tidak utuh sesudah rambu diketuk: ' + JSON.stringify(k.kartu));
      if (!k.tombol || !k.tombolDalam || k.tombolDiIsi) sebab.push('tombol langkah tidak di bilah bawah');
      continue;
    }
    if (t === 'tandai') {
      await p.evaluate(() => { const b = [...document.querySelectorAll('.lk-adegan button.lk-lajur[aria-pressed]')]; (b.find((x) => x.getAttribute('aria-pressed') === 'false') ?? b[0])?.click(); });
      await tunggu(350);
      const m = await p.evaluate(() => ({ tanda: document.querySelectorAll('.lk-kotak .lk-tanda').length, tuts: [...document.querySelectorAll('.px-tuts')].map((e) => e.getAttribute('data-keadaan')), legenda: document.querySelector('.lk-legenda')?.textContent ?? null }));
      if (!m.tanda || !m.tuts.some((x) => x !== 'biasa') || !/Tandamu/.test(m.legenda ?? '')) sebab.push('tanda lajur / tuts berarsir / legenda tidak muncul: ' + JSON.stringify(m));
      // D-182: legenda (sampai kalimat terakhirnya) utuh di jendela, juga saat rambu 2 sudah bertanda (tiga baris).
      const lg = await p.evaluate(() => { const g = document.querySelector('.hp-arena-gulir'); const r = document.querySelector('.lk-legenda')?.getBoundingClientRect(); return r ? [Math.round(g.getBoundingClientRect().bottom - r.bottom), g.scrollHeight - g.clientHeight, Math.round(r.height)] : null; });
      (data.legenda ??= []).push(lg);
      if (!lg || lg[0] < 0 || lg[1] > 1) sebab.push('legenda terpotong / langkah menandai meluap: ' + JSON.stringify(lg));
      if (!difoto) { difoto = true; await p.evaluate(() => { document.querySelector('.hp-arena-gulir').scrollTop = 0; }); await KINI.foto('tandai'); }
      await klik(p, '[data-lanjut-rambu]'); await tunggu(600);
      continue;
    }
    await klik(p, '.lk-tiang[data-keadaan="aktif"], [data-lanjut-rambu]'); await tunggu(450);
  }
  if ((await tahap()) !== 'putus') sebab.push('langkah kesimpulan tidak tercapai');
  await tunggu(300);
  const ukurLembar = () => p.evaluate(() => {
    const vv = window.visualViewport; const L = document.querySelector('[data-lembar-simpul]'); if (!L) return null; const r = L.getBoundingClientRect();
    const j = document.querySelector('.hp-rambu .lk-kotak')?.getBoundingClientRect(); const badan = L.querySelector('[data-gulir-lembar]'); const br = badan?.getBoundingClientRect();
    const o = [...L.querySelectorAll('.hp-opsi')].map((e) => e.getBoundingClientRect()); const t = L.querySelector('[data-kirim]'); const tr = t?.getBoundingClientRect(); const g = document.querySelector('.hp-arena-gulir');
    const tab = L.querySelector('[data-tandamu]'); const tb = tab?.getBoundingClientRect(); const tq = L.querySelector('.hp-tanya')?.getBoundingClientRect(); const tk = document.querySelector('.hp-rambu [data-truk]')?.getBoundingClientRect();
    return { tinggi: Math.round(r.height), lebar: Math.round(r.width), dalamVV: r.top >= -0.5 && r.bottom <= vv.height + 0.5 && r.left >= -0.5 && r.right <= vv.width + 0.5, jalanTerlihat: j ? Math.round(r.top - j.top) : null,
      opsi: o.length, opsiTerlihat: !!br && o.every((x) => x.top >= br.top - 0.5 && x.bottom <= br.bottom + 0.5), fallback: badan ? badan.scrollHeight > badan.clientHeight + 1 : false,
      tombol: t?.textContent.replace(/[→←]/g, '').trim() ?? null, tombolMati: !!t?.disabled, tombolAtas: tr ? Math.round(tr.top) : null, tombolDalam: !!tr && tr.bottom <= vv.height + 0.5,
      tabMenutupTanya: !!tb && !!tq && tb.bottom > tq.top + 0.5 && tb.left < tq.right, kabinTerlihat: tk ? Math.round(r.top - tk.top) : null,
      tabBisaDiketuk: tb ? (() => { const e = document.elementFromPoint(tb.left + tb.width / 2, tb.top + tb.height / 2); return !!e && (e === tab || tab.contains(e)); })() : false,
      gulirIsi: g ? getComputedStyle(g).overflowY : null, kepalaAktivitas: Math.round(document.querySelector('.hp-arena-kepala').getBoundingClientRect().height), tampil: L.getAttribute('data-tampil'), wajah: !!L.querySelector('.hp-lembar-wajah .cer-potret') };
  });
  const z = await ukurLayar(p); const l1 = await ukurLembar();
  await KINI.foto('simpul');
  sebab.push(...nilaiLayar(z).map((x) => 'kesimpulan: ' + x));
  if (!l1) sebab.push('lembar kesimpulan tidak ada');
  else {
    if (!l1.dalamVV || l1.lebar !== z.lebar) sebab.push('lembar kesimpulan di luar layar / tidak selebar layar: ' + JSON.stringify([l1.dalamVV, l1.lebar]));
    if (l1.opsi !== 5 || (!l1.opsiTerlihat && !l1.fallback)) sebab.push('lima pilihan kesimpulan tidak terlihat');
    if (l1.jalanTerlihat === null || l1.jalanTerlihat < 40) sebab.push('jalan di atas lembar < 40 px: ' + l1.jalanTerlihat);
    if (l1.tombol !== 'Pilih 1 kesimpulan' || !l1.tombolMati || !l1.tombolDalam) sebab.push('tombol awal bukan "Pilih 1 kesimpulan" nonaktif: ' + l1.tombol);
    if (l1.gulirIsi !== 'hidden') sebab.push('isi di belakang lembar masih bisa menggulir (bisa melompat)');
    if (l1.kepalaAktivitas > 46) sebab.push('kepala aktivitas bukan satu baris: ' + l1.kepalaAktivitas);
    if (!l1.tabBisaDiketuk) sebab.push('tab Tandamu tidak bisa diketuk');
    if (l1.tabMenutupTanya) sebab.push('tab Tandamu menutupi baris pertama pertanyaan (D-183)');
    if (l1.kabinTerlihat === null || l1.kabinTerlihat < 20) sebab.push('kabin truk di atas lembar < 20 px (D-185): ' + l1.kabinTerlihat);
    await p.evaluate(() => document.querySelector('[data-lembar-simpul] .hp-opsi')?.click()); await tunggu(350);
    const l2 = await ukurLembar();
    await KINI.foto('simpul-pilih');
    if (!l2 || l2.tombolMati || l2.tombol === 'Pilih 1 kesimpulan' || l2.tombolAtas !== l1.tombolAtas || l2.tinggi !== l1.tinggi) sebab.push('memilih kesimpulan: label tidak berubah / lembar melompat: ' + JSON.stringify([l2?.tombol, l1.tombolAtas, l2?.tombolAtas]));
    await klik(p, '[data-tandamu]'); await tunggu(300);
    const l3 = await ukurLembar();
    const sw = await p.evaluate(() => [...document.querySelectorAll('[data-lembar-simpul] .lk-pilihanmu .px-contoh')].map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(e).backgroundImage.includes('url(')]; }));
    if (!sw.length || sw.some((x) => x[0] !== 14 || x[1] !== 14 || !x[2])) sebab.push('contoh arsiran di sisi Tandamu bukan PNG 14 x 14 (D-184): ' + JSON.stringify(sw));
    if (!l3 || l3.tampil !== 'tanda' || !l3.dalamVV) sebab.push('tab Tandamu tidak membalik lembar');
    await klik(p, '[data-kembali-pilihan]'); await tunggu(250);
    const l4 = await ukurLembar();
    if (!l4 || l4.tampil !== 'pilihan' || l4.tombolMati) sebab.push('kembali ke pilihan kehilangan pilihan');
    Object.assign(data, { kesimpulan: { tinggi: l1.tinggi, jalanTerlihat: l1.jalanTerlihat, fallback: l1.fallback, tombol: [l1.tombol, l2?.tombol], kepalaAktivitas: l1.kepalaAktivitas, kabin: l1.kabinTerlihat } });
  }
  Object.assign(data, { adegan: a?.kotak, kartu });
};
/** K05 terusan foto (T-020 batch 3, D-167): papan K04 dengan lima ubin piksel; token = bundel foto (strip 60 x 48, di ubin 22 x 28). */
const K05 = async (p, d, sebab, data) => {
  const ukur = () => p.evaluate(() => {
    const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const b = document.querySelector('.hp-papan-lok'); const br = b?.getBoundingClientRect();
    const t = [...document.querySelectorAll('.hp-papan-lok .hp-tempat')].map((e) => e.getBoundingClientRect()); const sn = [...document.querySelectorAll('.hp-papan-lok .hp-tempat .hp-seni-piksel:not(.px-dokk)')].map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return [r.width, r.height, c.imageRendering, c.backgroundImage.includes('url(')]; });
    const tumpang = t.some((a, i) => t.some((c, j) => j > i && a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5));
    const tk = document.querySelector('.hp-papan-lok .hp-tempat.terpilih .hp-tempat-token .hp-seni-piksel')?.getBoundingClientRect(); const gb = document.querySelector('.hp-papan-lok .hp-tempat.terpilih .hp-tempat-gambar .hp-seni-piksel')?.getBoundingClientRect();
    const st = document.querySelector('.hp-tujuan-benda .hp-seni-piksel')?.getBoundingClientRect(); const lb = document.querySelector('.hp-arena-kirim .hp-kirim-label'); const k = document.querySelector('.hp-arena-kirim [data-kirim]');
    return { papanPiksel: !!b?.classList.contains('hp-papan-px'), papan: br ? [Math.round(br.width), Math.round(br.height)] : null, tempat: t.length, utuh: !!br && t.every((r) => r.top >= gr.top - 0.5 && r.bottom <= gr.bottom + 0.5 && r.top >= br.top - 0.5 && r.bottom <= br.bottom + 0.5), tumpang, seni: sn,
      meluap: g.scrollHeight - g.clientHeight, token: tk && gb ? [Math.round(tk.left - gb.left), Math.round(tk.top - gb.top), tk.width, tk.height] : null, strip: st ? [st.width, st.height] : null,
      label: (lb ?? k)?.textContent.replace(/[→←]/g, '').trim() ?? null, labelBaris: lb ? Math.round(lb.getBoundingClientRect().height / parseFloat(getComputedStyle(lb).lineHeight)) : null, kirimMati: !!k?.disabled,
      info: !!document.querySelector('.hp-arena-kepala [data-info-tugas]'), infoTerbuka: [...document.querySelectorAll('.hp-arena-konteks details')].some((e) => e.open), instruksi: !!document.querySelector('.hp-arena-sematan .hp-instruksi-arena') };
  });
  const a = await ukur();
  await KINI.foto('awal');
  if (!d.tanyaTersemat || !a.instruksi || !d.kirimDiBilah) sebab.push('pertanyaan / instruksi / tombol kirim tidak tersemat');
  if (!a.info || a.infoTerbuka) sebab.push('tab Info tugas tidak ada / info terbuka secara bawaan');
  const bulat = await p.evaluate(() => { const b = document.querySelector('.hp-papan-lok'); const br = b.getBoundingClientRect(); const t = b.querySelectorAll('.hp-tempat')[2]?.getBoundingClientRect(); return [br.height, t ? t.top - br.top : 0]; });
  // D-205: tinggi papan dan atas ubin tengah = px CSS utuh (di DPR 3 pecahan membuat baris piksel tidak rata).
  if (bulat.some((v) => Math.abs(v - Math.round(v)) > 0.01)) sebab.push('tinggi papan / atas ubin tengah bukan px utuh (D-205): ' + JSON.stringify(bulat));
  data.bulat = bulat;
  if (!a.papanPiksel || a.tempat !== 5 || !a.utuh || a.tumpang) sebab.push('papan piksel: lima ubin tidak utuh / saling menutup: ' + JSON.stringify([a.papanPiksel, a.tempat, a.utuh, a.tumpang]));
  if (a.seni.length !== 5 || a.seni.some((x) => x[0] !== 80 || x[1] !== 60 || x[2] !== 'pixelated' || !x[3])) sebab.push('gambar ubin bukan PNG piksel 80 x 60: ' + JSON.stringify(a.seni));
  if (!a.papan || a.papan[1] < 202 || a.papan[1] > 300) sebab.push('papan di luar 202..300 px: ' + JSON.stringify(a.papan));
  if (a.meluap > 1) sebab.push('isi aktivitas meluap ' + a.meluap + ' px');
  if (!a.strip || a.strip[0] !== 60 || a.strip[1] !== 48) sebab.push('bundel foto di strip bukan 60 x 48: ' + JSON.stringify(a.strip));
  if (a.label !== 'Ketuk satu tujuan.' || a.labelBaris !== 1 || !a.kirimMati) sebab.push('label nonaktif bukan satu baris pendek: ' + a.label);
  await p.evaluate(() => document.querySelectorAll('.hp-papan-lok .hp-tempat')[3].click()); await tunggu(450);
  const c = await ukur();
  await KINI.foto('pilih');
  if (!c.token || c.token[0] !== 62 || c.token[1] !== -10 || c.token[2] !== 22 || c.token[3] !== 28) sebab.push('token foto di ubin bukan 22 x 28 di gambar (+62, -10): ' + JSON.stringify(c.token));
  if (c.kirimMati || c.meluap > 1 || !c.utuh) sebab.push('sesudah memilih: tombol belum aktif / meluap / ubin terpotong: ' + JSON.stringify([c.kirimMati, c.meluap, c.utuh]));
  if (c.papan?.[1] !== a.papan?.[1]) sebab.push('tinggi papan berubah saat memilih: ' + a.papan?.[1] + ' -> ' + c.papan?.[1]);
  Object.assign(data, { papan: a.papan, meluap: [a.meluap, c.meluap], label: [a.label, c.label] });
};
/** K11 bundel pengajuan (T-020 batch 3, D-166): tiga langkah, tidak ada yang menggulir; tombol tiap langkah di bilah bawah. */
const K11 = async (p, d, sebab, data) => {
  const ukur = () => p.evaluate(() => {
    const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const di = (e) => { const r = e.getBoundingClientRect(); return r.top >= gr.top - 0.5 && r.bottom <= gr.bottom + 0.5; };
    const k = document.querySelector('.hp-arena-kirim [data-kirim]'); const lb = document.querySelector('.hp-arena-kirim .hp-kirim-label');
    const px = [...document.querySelectorAll('.hp-bundel .hp-seni-piksel')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return [Math.round(r.width) + 'x' + Math.round(r.height), c.imageRendering === 'pixelated' && c.backgroundImage.includes('url(') && c.backgroundSize === 'auto']; });
    return { langkah: document.querySelector('.hp-bundel')?.getAttribute('data-langkah'), meluap: g.scrollHeight - g.clientHeight, sisa: Math.round(gr.bottom - Math.max(...[...document.querySelectorAll('.hp-bundel-langkah > *, .hp-tahap')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 1 && r.width > 1).map((r) => r.bottom))),
      tab: [...document.querySelectorAll('.hp-tahap-item')].map((e) => Math.round(e.getBoundingClientRect().height)), kantong: document.querySelectorAll('.hp-mapt-tab-item').length, kantongUtuh: [...document.querySelectorAll('.hp-mapt-tab-item')].every(di), opsi: document.querySelectorAll('.hp-bundel .hp-opsi').length, opsiUtuh: [...document.querySelectorAll('.hp-bundel .hp-opsi')].every(di),
      seni: px.map((x) => x[0]), seniSah: px.every((x) => x[1]), label: (lb ?? k)?.textContent.replace(/[→←]/g, '').trim() ?? null, labelBaris: lb ? Math.round(lb.getBoundingClientRect().height / parseFloat(getComputedStyle(lb).lineHeight)) : 1, kirimMati: !!k?.disabled, kirimDiIsi: !!document.querySelector('.hp-arena-gulir [data-kirim]'), instruksi: document.querySelector('.hp-arena-sematan .hp-instruksi-arena')?.textContent ?? null, lembar: Math.round(document.querySelector('.hp-mapt-lembar')?.getBoundingClientRect().height ?? 0) };
  });
  const nilai = (x, tahap) => { if (x.meluap > 1) sebab.push(tahap + ': isi meluap ' + x.meluap + ' px'); if (!x.seniSah || !x.seni.length) sebab.push(tahap + ': seni piksel tidak ada / diskalakan: ' + x.seni.join(' ')); if (x.kirimDiIsi) sebab.push(tahap + ': tombol tidak di bilah bawah'); };
  const a = await ukur();
  await KINI.foto('periksa');
  if (!d.tanyaTersemat) sebab.push('pertanyaan tidak tersemat');
  nilai(a, 'langkah 1');
  if (a.langkah !== 'periksa' || a.kantong !== 7 || !a.kantongUtuh || a.label !== 'Tentukan langkah' || a.kirimMati) sebab.push('langkah 1: tujuh kantong + tombol "Tentukan langkah": ' + JSON.stringify([a.langkah, a.kantong, a.kantongUtuh, a.label]));
  if (!a.seni.includes('120x64') || a.seni.filter((x) => x === '22x28').length !== 7) sebab.push('langkah 1: map 120 x 64 + tujuh gambar kecil 22 x 28: ' + a.seni.join(' '));
  const lembar = [a.lembar];
  for (const n of [4, 7]) { await klik(p, '.hp-mapt-tab-item[data-lembar="' + n + '"]'); await tunggu(250); const x = await ukur(); lembar.push(x.lembar); nilai(x, 'langkah 1, lembar ' + n); if (n === 7) await KINI.foto('periksa-7'); }
  await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(500);
  const b = await ukur();
  await KINI.foto('tindakan');
  nilai(b, 'langkah 2');
  if (b.langkah !== 'tindakan' || b.opsi !== 3 || !b.opsiUtuh || !b.kirimMati || b.label !== 'Pilih tindakan untuk berkas ini.' || b.instruksi !== 'Pilih tindakan untuk berkas ini.') sebab.push('langkah 2: tiga kartu tindakan + label: ' + JSON.stringify([b.langkah, b.opsi, b.opsiUtuh, b.label]));
  if (b.seni.filter((x) => x === '48x40').length !== 4) sebab.push('langkah 2: bundel + tiga gambar tindakan 48 x 40: ' + b.seni.join(' '));
  await klik(p, '.hp-bundel .hp-opsi[data-opsi="lengkapi"]'); await tunggu(300);
  const b2 = await ukur();
  await KINI.foto('tindakan-pilih');
  nilai(b2, 'langkah 2 dipilih');
  if (b2.kirimMati || b2.label !== 'Lanjut: kabari Pak Hendra') sebab.push('langkah 2: tombol lanjut tidak aktif: ' + b2.label);
  await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(500);
  const c = await ukur();
  await KINI.foto('kabar');
  nilai(c, 'langkah 3');
  if (c.langkah !== 'kabar' || c.opsi !== 3 || !c.opsiUtuh || !c.kirimMati || c.label !== 'Pilih satu kabar.') sebab.push('langkah 3: tiga kabar + label: ' + JSON.stringify([c.langkah, c.opsi, c.opsiUtuh, c.label]));
  await klik(p, '.hp-bundel .hp-opsi[data-opsi="persetujuan"]'); await tunggu(300);
  const c2 = await ukur();
  await KINI.foto('kabar-pilih');
  nilai(c2, 'langkah 3 dipilih');
  if (c2.kirimMati || c2.label !== 'Konfirmasi & kirim kabar' || c2.labelBaris !== 1) sebab.push('langkah 3: tombol konfirmasi tidak aktif: ' + c2.label);
  await klik(p, '.hp-tahap-item[data-tahap="periksa"]'); await tunggu(400);
  const e = await ukur();
  if (e.langkah !== 'periksa') sebab.push('tab langkah 1 tidak kembali ke periksa berkas');
  Object.assign(data, { tab: a.tab, lembar, sisa: [a.sisa, b.sisa, b2.sisa, c.sisa, c2.sisa] });
};
/** T-020 batch 2. Ukuran bersama: semua sasaran utuh di jendela penggulir, penggulir tidak meluap, seni piksel tidak diskalakan. */
const ukurB2 = (p, sel) => p.evaluate((sel) => {
  const g = document.querySelector('.hp-arena-gulir'); const gr = g.getBoundingClientRect(); const di = (r) => r.top >= gr.top - 0.5 && r.bottom <= gr.bottom + 0.5 && r.left >= -0.5 && r.right <= window.innerWidth + 0.5;
  const el = [...document.querySelectorAll(sel)]; const r = el.map((e) => e.getBoundingClientRect());
  const lb = document.querySelector('.hp-arena-kirim .hp-kirim-label'); const t = document.querySelector('.hp-arena-kirim [data-kirim]');
  // Sprite .px: kotaknya harus persis seukuran CSS (bilangan bulat), image-rendering pixelated, tanpa background-size.
  const px = [...document.querySelectorAll('.hp-arena-gulir .px')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const c = getComputedStyle(e); return c.imageRendering === 'pixelated' && c.backgroundSize === 'auto' && c.backgroundImage.includes('url('); });
  const info = document.querySelector('.hp-arena-kepala [data-info-tugas]'); const ir = info?.getBoundingClientRect(); const jr = document.querySelector('.hp-arena-judul').getBoundingClientRect();
  return { jumlah: el.length, utuh: r.every(di), atas: r.map((x) => Math.round(x.top)), meluap: g.scrollHeight - g.clientHeight, sisa: Math.round(gr.bottom - Math.max(...r.map((x) => x.bottom), gr.top)), piksel: px.length, pikselSah: px.every(Boolean),
    label: (lb ?? t)?.textContent.replace(/[→←]/g, '').trim() ?? null, labelBaris: lb ? Math.round(lb.getBoundingClientRect().height / parseFloat(getComputedStyle(lb).lineHeight)) : null, kirimMati: !!t?.disabled,
    info: !!info, infoSebaris: !!ir && ir.top < jr.bottom && ir.bottom > jr.top, infoTerbuka: [...document.querySelectorAll('.hp-arena-konteks details')].some((e) => e.open), instruksi: document.querySelector('.hp-arena-sematan .hp-instruksi-arena')?.textContent ?? null };
}, sel);
const nilaiB2 = (x, n, sebab, tahap) => {
  if (x.jumlah !== n || !x.utuh) sebab.push(tahap + ': ' + n + ' sasaran tidak utuh di jendela (' + x.jumlah + ')');
  if (x.meluap > 1) sebab.push(tahap + ': isi aktivitas meluap ' + x.meluap + ' px (harus muat tanpa menggulir)');
  if (!x.piksel || !x.pikselSah) sebab.push(tahap + ': seni piksel tidak ada / diskalakan');
};
/** K07 rencana pemeriksaan: papan gabus, dua slot + tiga chip terlihat sekaligus, tab Info tugas, ketuk slot = kartu ditempel. */
const K07 = async (p, d, sebab, data) => {
  const SASARAN = '.rp-papan .rp-slot, .rp-chip';
  const x = await ukurB2(p, SASARAN);
  const papan = () => p.evaluate(() => { const e = document.querySelector('[data-papan-rencana]'); if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const st = document.querySelector('.rp-strip');
    return { bingkai: c.borderImageSource.includes('url('), gabus: c.backgroundImage.includes('url('), piksel: c.imageRendering === 'pixelated', atas: Math.round(r.top), tinggi: Math.round(r.height), lebar: Math.round(r.width), strip: st?.getAttribute('data-strip'), stripTinggi: Math.round(st?.getBoundingClientRect().height ?? 0), kaca: !!st?.querySelector('.px-kaca'),
      kolom: [...e.querySelectorAll('.px-plat')].map((k) => k.textContent), nota: !!e.querySelector('.rp-nota'), kerja: !!e.querySelector('.rp-kerja .px-jam'), pin: !!e.querySelector('.rp-slot[aria-checked="true"] .px-pin'), terpilih: document.querySelector('.hp-rpk-px [aria-checked="true"]')?.getAttribute('data-tujuan') ?? null }; });
  const a = await papan();
  await KINI.foto('awal');
  if (!d.tanyaTersemat || !d.kirimDiBilah) sebab.push('pertanyaan / tombol kirim tidak tersemat');
  nilaiB2(x, 5, sebab, 'awal');
  if (!x.info || !x.infoSebaris || x.infoTerbuka) sebab.push('tab Info tugas tidak di baris judul / info terbuka secara bawaan');
  if (!a?.bingkai || !a.gabus || !a.piksel) sebab.push('papan bukan gabus piksel berbingkai');
  if (a?.strip !== 'instruksi' || !a.kaca) sebab.push('strip awal bukan instruksi + kaca pembesar');
  if (a?.kolom.join('|') !== 'Sekarang|Sesudah hitungan' || !a.nota || !a.kerja || a.terpilih) sebab.push('isi papan awal salah: ' + JSON.stringify(a));
  if (!x.kirimMati) sebab.push('tombol kirim aktif sebelum memilih');
  await klik(p, '.rp-slot[data-tujuan="paralel"]'); await tunggu(350);
  const b = await papan(); const y = await ukurB2(p, SASARAN);
  await KINI.foto('pilih');
  nilaiB2(y, 5, sebab, 'slot dipilih');
  if (b?.terpilih !== 'paralel' || !b.pin || b.strip !== 'pilihan' || y.kirimMati) sebab.push('ketuk slot: kartu tidak ditempel / tombol tidak aktif: ' + JSON.stringify(b));
  if (b && a && b.atas !== a.atas) sebab.push('papan bergeser saat memilih: ' + a.atas + ' -> ' + b.atas);
  await klik(p, '.rp-chip[data-tujuan="jelas"]'); await tunggu(350);
  const c = await papan(); const z = await ukurB2(p, SASARAN);
  await KINI.foto('chip');
  nilaiB2(z, 5, sebab, 'chip dipilih');
  if (c?.terpilih !== 'jelas' || c.pin || z.kirimMati) sebab.push('ketuk chip: pilihan tidak pindah ke chip');
  if (c && a && c.atas !== a.atas) sebab.push('papan bergeser saat memilih chip: ' + a.atas + ' -> ' + c.atas);
  await klik(p, '[data-info-tugas]'); await tunggu(300);
  const i1 = await ukurB2(p, SASARAN);
  if (!i1.infoTerbuka) sebab.push('tab Info tugas tidak membuka info');
  await klik(p, '[data-info-tugas]'); await tunggu(250);
  Object.assign(data, { papan: a ? [a.lebar, a.tinggi] : null, strip: [a?.stripTinggi, b?.stripTinggi, c?.stripTinggi], sisa: [x.sisa, y.sisa, z.sisa], label: [x.label, y.label] });
};
/** K09 kartu saksi: papan gabus 5 slot, 5 kartu satu baris, strip aksi; kartu -> tombol -> kartu menempel di papan. */
const K09 = async (p, d, sebab, data) => {
  const SASARAN = '.sk-papan, .hp-saksi-kartu, .sk-tombol';
  const keadaan = () => p.evaluate(() => { const k = [...document.querySelectorAll('.hp-saksi-px .hp-saksi-kartu')]; const pp = document.querySelector('.sk-papan'); const c = pp ? getComputedStyle(pp) : null;
    return { slot: document.querySelectorAll('.sk-slot').length, tempel: [...document.querySelectorAll('[data-rencana]')].map((e) => e.getAttribute('data-rencana')), hitung: document.querySelector('[data-jumlah-rencana]')?.textContent, lepas: document.querySelectorAll('.sk-lepas').length,
      dilihat: k.find((e) => e.classList.contains('dilihat'))?.getAttribute('data-orang') ?? null, sebaris: k.length === 5 && k.every((e) => Math.abs(e.getBoundingClientRect().bottom - k[0].getBoundingClientRect().bottom) < 6), barisAtas: Math.round(document.querySelector('.sk-baris')?.getBoundingClientRect().top ?? 0), aksiAtas: Math.round(document.querySelector('.sk-aksi')?.getBoundingClientRect().top ?? 0),
      bingkai: !!c && c.borderImageSource.includes('url(') && c.imageRendering === 'pixelated', papan: Math.round(pp?.getBoundingClientRect().height ?? 0), baris: Math.round(document.querySelector('.sk-baris')?.getBoundingClientRect().height ?? 0), aksi: Math.round(document.querySelector('.sk-aksi')?.getBoundingClientRect().height ?? 0), potret: document.querySelectorAll('.sk-baris .cer-potret').length, mobil: !!document.querySelector('.sk-baris .px-mobil-kecil') }; });
  const x = await ukurB2(p, SASARAN); const a = await keadaan();
  await KINI.foto('awal');
  if (!d.tanyaTersemat || !d.kirimDiBilah) sebab.push('pertanyaan / tombol kirim tidak tersemat');
  nilaiB2(x, 8, sebab, 'awal');
  if (!x.info || !x.infoSebaris || x.infoTerbuka) sebab.push('tab Info tugas tidak di baris judul / info terbuka secara bawaan');
  if (x.instruksi !== 'Pilih kartu, lalu wawancarai atau tidak perlu.') sebab.push('baris instruksi salah: ' + x.instruksi);
  if (x.label !== 'Tandai 5 kartu lagi.' || x.labelBaris !== 1) sebab.push('label nonaktif K09 bukan satu baris pendek (D-180): ' + x.label);
  if (a.slot !== 5 || !a.sebaris || !a.bingkai || a.potret !== 4 || !a.mobil || a.tempel.length || !a.dilihat) sebab.push('papan 5 slot + 5 kartu sebaris (4 potret + mobil) + kartu terpilih: ' + JSON.stringify(a));
  await klik(p, '.sk-tombol[data-wadah="ya"]'); await tunggu(350);
  const b = await keadaan(); const y = await ukurB2(p, SASARAN);
  if (b.tempel.length !== 1 || b.tempel[0] !== a.dilihat || b.hitung !== '1' || y.label !== 'Tandai 4 kartu lagi.' || !b.dilihat || b.dilihat === a.dilihat) sebab.push('Wawancarai: kartu tidak menempel di papan / kartu berikut tidak terpilih: ' + JSON.stringify([b.tempel, b.hitung, y.label, b.dilihat]));
  await klik(p, '.sk-tombol[data-wadah="tidak"]'); await tunggu(350);
  const c = await keadaan(); const z = await ukurB2(p, SASARAN);
  await KINI.foto('tandai');
  nilaiB2(z, 8, sebab, 'dua ditandai');
  if (c.lepas !== 1 || z.label !== 'Tandai 3 kartu lagi.') sebab.push('Tidak perlu: lencana "-" tidak muncul: ' + JSON.stringify([c.lepas, z.label]));
  if (c.barisAtas !== a.barisAtas || c.aksiAtas !== a.aksiAtas) sebab.push('baris kartu / strip aksi bergeser saat menandai: ' + JSON.stringify([a.barisAtas, c.barisAtas, a.aksiAtas, c.aksiAtas]));
  await klik(p, '.sk-lepas'); await tunggu(300);
  const c2 = await keadaan();
  if (c2.lepas !== 0) sebab.push('lencana "-" tidak membatalkan tanda');
  for (let i = 0; i < 6; i++) { const m = await p.evaluate(() => document.querySelector('.hp-arena-kirim [data-kirim]')?.disabled); if (!m) break; await klik(p, i % 2 ? '.sk-tombol[data-wadah="tidak"]' : '.sk-tombol[data-wadah="ya"]'); await tunggu(300); }
  const e = await keadaan(); const w = await ukurB2(p, SASARAN);
  await KINI.foto('siap');
  nilaiB2(w, 8, sebab, 'semua ditandai');
  if (w.kirimMati || w.label !== 'Kirim daftar ke Pak Bima') sebab.push('semua ditandai tetapi tombol kirim belum aktif: ' + w.label);
  if (e.barisAtas !== a.barisAtas) sebab.push('baris kartu bergeser di akhir');
  Object.assign(data, { papan: a.papan, baris: [a.baris, e.baris], aksi: [a.aksi, e.aksi], sisa: [x.sisa, z.sisa, w.sisa], tempelAkhir: e.tempel.length });
};
/** K10 bandingkan: dua kertas, baris aktif disorot + penanda di tengah, lima cap; cap = jejak menempel lalu perbedaan berikut. */
const K10 = async (p, d, sebab, data) => {
  const SASARAN = '.bd-kertas, .bd-isu:not([data-bayangan]), .bd-cap-tombol';
  const keadaan = () => p.evaluate(() => { const akt = document.querySelector('.bd-baris[data-isu][data-aktif]'); const ar = akt?.getBoundingClientRect(); const bd = document.querySelector('.bd-beda')?.getBoundingClientRect(); const cap = [...document.querySelectorAll('.bd-cap')].map((e) => e.getBoundingClientRect());
    const k = [...document.querySelectorAll('.bd-kertas')]; const kc = k[0] ? getComputedStyle(k[0]) : null; const sel = [...document.querySelectorAll('.bd-sel')];
    return { kertas: k.length, baris: document.querySelectorAll('.bd-baris').length, aktif: akt?.getAttribute('data-isu') ?? null, bedaSejajar: !!ar && !!bd && Math.abs((ar.top + ar.height / 2) - (bd.top + bd.height / 2)) <= 1, jejak: [...document.querySelectorAll('[data-jejak]')].map((e) => e.getAttribute('data-jejak')),
      sel: sel.map((e) => e.textContent), selTerpotong: sel.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent), cap: cap.length ? [Math.round(cap[0].width), Math.round(cap[0].height)] : null, capSebaris: cap.every((r) => Math.abs(r.top - cap[0].top) < 1),
      kertasPiksel: !!kc && kc.borderImageSource.includes('url(') && kc.imageRendering === 'pixelated', kertasTinggi: Math.round(k[0]?.getBoundingClientRect().height ?? 0), kotak: Math.round(document.querySelector('.bd-isu:not([data-bayangan])')?.getBoundingClientRect().height ?? 0), capAtas: Math.round(document.querySelector('.bd-cap-baris')?.getBoundingClientRect().top ?? 0), capBaris: Math.round(document.querySelector('.bd-cap-baris')?.getBoundingClientRect().height ?? 0),
      maju: document.querySelector('.bd-isu:not([data-bayangan]) .bd-maju b')?.textContent ?? null, artiAda: !!document.querySelector('.bd-instruksi[data-arti]') }; });
  const x = await ukurB2(p, SASARAN); const a = await keadaan();
  await KINI.foto('awal');
  if (!d.tanyaTersemat || !d.kirimDiBilah) sebab.push('pertanyaan / tombol kirim tidak tersemat');
  nilaiB2(x, 8, sebab, 'awal');
  if (!x.info || !x.infoSebaris || x.infoTerbuka) sebab.push('tab Info tugas tidak di baris judul / info terbuka secara bawaan');
  if (x.instruksi !== 'Pilih perbedaan, lalu cara mencatatnya.') sebab.push('baris instruksi salah: ' + x.instruksi);
  if (x.label !== 'Cap 3 perbedaan dulu.' || x.labelBaris !== 1) sebab.push('label nonaktif K10 salah: ' + x.label);
  if (a.kertas !== 2 || a.baris !== 6 || !a.kertasPiksel || a.aktif !== 'jam' || !a.bedaSejajar || a.maju !== '1/3') sebab.push('dua kertas piksel 3 baris + baris aktif + penanda: ' + JSON.stringify(a));
  if (a.sel.join('|') !== '20.10|Wahyudi|?|20.15|Wahyudin|"kurang antisipasi"') sebab.push('isi kertas bukan teks tabel cerita: ' + a.sel.join('|'));
  if (a.selTerpotong.length) sebab.push('isi baris terpotong: ' + a.selTerpotong.join(' | '));
  const kecil = (await p.evaluate(() => window.innerHeight)) < 700;
  if (!a.cap || a.cap.join('x') !== (kecil ? '22x24' : '44x48') || !a.capSebaris) sebab.push('lima cap bukan ' + (kecil ? '22 x 24' : '44 x 48') + ' sebaris: ' + JSON.stringify(a.cap));
  await klik(p, '.bd-cap-tombol[data-perlakuan="catat"]'); await tunggu(250);
  const b0 = await keadaan();
  if (b0.jejak.join() !== 'catat' || !b0.artiAda) sebab.push('cap: jejak tidak menempel / arti cap tidak tampil: ' + JSON.stringify([b0.jejak, b0.artiAda]));
  await tunggu(800);
  const b = await keadaan(); const y = await ukurB2(p, SASARAN);
  await KINI.foto('cap1');
  nilaiB2(y, 8, sebab, 'satu dicap');
  if (b.aktif !== 'nama' || !b.bedaSejajar || b.maju !== '2/3' || y.label !== 'Cap 2 perbedaan dulu.') sebab.push('sorotan tidak pindah ke perbedaan berikut: ' + JSON.stringify([b.aktif, b.bedaSejajar, b.maju, y.label]));
  if (b.capAtas !== a.capAtas || b.kotak !== a.kotak) sebab.push('kotak kalimat / baris cap melompat saat pindah perbedaan: ' + JSON.stringify([a.kotak, b.kotak, a.capAtas, b.capAtas]));
  await klik(p, '.bd-cap-tombol[data-perlakuan="samakan"]'); await tunggu(1050);
  const c = await keadaan();
  await KINI.foto('cap2');
  if (c.aktif !== 'antisipasi' || c.capAtas !== a.capAtas) sebab.push('perbedaan ketiga tidak disorot / baris cap melompat: ' + JSON.stringify([c.aktif, c.capAtas]));
  await klik(p, '.bd-cap-tombol[data-perlakuan="catat"]'); await tunggu(1050);
  const e = await keadaan(); const w = await ukurB2(p, SASARAN);
  await KINI.foto('siap');
  nilaiB2(w, 8, sebab, 'tiga dicap');
  if (e.jejak.length !== 3 || w.kirimMati || w.label !== 'Kirim ke laporan Pak Bima' || e.capAtas !== a.capAtas) sebab.push('tiga cap: tombol kirim belum aktif / tata letak melompat: ' + JSON.stringify([e.jejak, w.label, e.capAtas]));
  // Baris kertas = sasaran ketuk: kembali ke perbedaan 1 dan ganti capnya.
  await klik(p, '.bd-baris[data-isu-kanan="jam"]'); await tunggu(250);
  const g = await keadaan();
  if (g.aktif !== 'jam' || !g.bedaSejajar) sebab.push('ketuk baris kertas kanan tidak memilih perbedaan itu');
  Object.assign(data, { kertas: a.kertasTinggi, kotak: a.kotak, capBaris: a.capBaris, cap: a.cap, sisa: [x.sisa, w.sisa] });
};

/**
 * T-022 "Periksa SIM Pak Darto": empat langkah / lima layar + akhir, 18 keadaan (16 keadaan mock + dua "Kenapa?"). Di SETIAP keadaan:
 * isi aktivitas tidak meluap (tidak ada yang menggulir), adegan 236 px, papan jalan 48 px (62 di akhir), instruksi satu baris 20 px,
 * label bilah satu baris, semua sprite piksel tidak diskalakan. Alur: ketukan keliru = bingkai kuning + kalimat Pak Bima (tanpa
 * kehilangan apa pun), ketukan benar = cap; langkah 4 lewat ketuk (padanan seret) dan sekali lewat seret penunjuk.
 * Meja, kartu dan loket dimainkan lewat KEYBOARD (fokus + Enter): sesudah tiap aktivasi fokus tidak jatuh ke <body> (tetap di sasaran,
 * atau pindah ke tombol bilah / baris instruksi / Tutup / "Kenapa?"); papan tempat lewat klik skrip + klik tetikus (fokus tidak dipindah).
 */
/** T-034: K15 penyusun pesan: 0 px gulir halaman dan isi, chip, pratinjau (tools/cek-k15-t034.mjs), dengan 0 lalu 4 bagian. */
async function k15(p) {
  await bukaK15(p); const d0 = await ukurK15(p); const sebab = nilaiK15(d0, 0).map((x) => '0 bagian: ' + x);
  const id = await p.evaluate(() => [...document.querySelectorAll('.hp-pesan-bagian')].map((c) => c.dataset.bagian));
  for (const x of id.slice(0, 4)) { await p.click('.hp-pesan-bagian[data-bagian="' + x + '"]'); await tunggu(150); }
  const d4 = await ukurK15(p); sebab.push(...nilaiK15(d4, 4).map((x) => '4 bagian: ' + x));
  return { lulus: sebab.length === 0, data: { sebab, gulir: [d0.gulirHalaman, d0.gulirIsi, d4.gulirHalaman, d4.gulirIsi], chipMin: d4.tinggiMin, pratinjau: [d0.tinggiPratinjau, d4.tinggiPratinjau] } };
}
const SIM = async (p, d, sebab, data) => {
  const ukur = () => p.evaluate(() => {
    const g = document.querySelector('.hp-arena-gulir'); const q = (x) => document.querySelector(x); const h = (x) => Math.round(q(x)?.getBoundingClientRect().height ?? 0);
    const lb = q('.hp-arena-kirim .hp-kirim-label'); const k = q('.hp-arena-kirim [data-kirim]'); const ins = q('.hp-arena-sematan .sim-instruksi');
    const px = [...document.querySelectorAll('.hp-sim .px')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const c = getComputedStyle(e); return c.imageRendering === 'pixelated' && c.backgroundSize === 'auto' && c.backgroundImage.includes('url('); });
    const isi = q('.sim-isi')?.getBoundingClientRect(); const luar = isi ? [...document.querySelectorAll('.sim-isi .sim-ketuk, .sim-isi .sim-ubin, .sim-isi .sim-label-truk, .sim-isi .sim-balik, .sim-isi .sim-kenapa, .sim-isi .sim-catatan')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < isi.left - 0.5 || r.right > isi.right + 0.5 || r.top < isi.top - 0.5 || r.bottom > isi.bottom + 0.5; }).map((e) => e.getAttribute('data-ketuk') ?? e.className) : [];
    return { langkah: q('.hp-sim')?.getAttribute('data-langkah'), beres: q('.hp-sim')?.hasAttribute('data-beres'), salah: Number(q('.hp-sim')?.getAttribute('data-salah')), meluap: g.scrollHeight - g.clientHeight, sisa: Math.round(g.getBoundingClientRect().bottom - (q('.hp-sim')?.getBoundingClientRect().bottom ?? 0)),
      adegan: h('.sim-adegan'), papan: h('.sim-papan'), instruksi: ins?.textContent ?? null, instruksiTinggi: Math.round(ins?.getBoundingClientRect().height ?? 0), instruksiPotong: ins ? ins.scrollWidth > ins.clientWidth + 1 : false,
      label: (lb ?? k)?.textContent.replace(/[→←]/g, '').trim() ?? null, labelBaris: lb ? Math.round(lb.getBoundingClientRect().height / parseFloat(getComputedStyle(lb).lineHeight)) : 1, kirimMati: !!k?.disabled,
      ragu: [...document.querySelectorAll('.hp-sim [data-keadaan="ragu"]')].map((e) => e.getAttribute('data-ketuk')), ucapRagu: !!q('.sim-ucap[data-ragu]'), ucap: q('.sim-ucap p')?.textContent.replace(/^[^:]*: /, '') ?? null,
      cap: [...document.querySelectorAll('.sim-papan li')].map((e) => e.getAttribute('data-keadaan')[0]).join(''), piksel: px.length, pikselSah: px.every(Boolean), luar, lebar: document.scrollingElement.scrollWidth - window.innerWidth };
  });
  let ke = 0; const catat = [];
  const periksa = async (nama, harap = {}) => {
    await tunggu(260);
    const x = await ukur(); ke++;
    await KINI.foto(String(ke).padStart(2, '0') + '-' + nama);
    const s2 = [];
    if (x.meluap > 1) s2.push('isi meluap ' + x.meluap + ' px');
    if (x.lebar > 0) s2.push('halaman melebar ' + x.lebar + ' px');
    if (x.langkah !== 'akhir' && x.adegan !== 236) s2.push('adegan bukan 236 px: ' + x.adegan);
    if (x.papan !== (x.langkah === 'akhir' ? 62 : 48)) s2.push('papan jalan bukan ' + (x.langkah === 'akhir' ? 62 : 48) + ' px: ' + x.papan);
    if (x.instruksiTinggi !== 20 || x.instruksiPotong) s2.push('instruksi bukan satu baris 20 px utuh: ' + x.instruksiTinggi + (x.instruksiPotong ? ' (terpotong)' : ''));
    if (x.labelBaris !== 1) s2.push('label bilah ' + x.labelBaris + ' baris: ' + x.label);
    if (!x.piksel || !x.pikselSah) s2.push('seni piksel tidak ada / diskalakan');
    if (x.luar.length) s2.push('sasaran keluar dari adegan: ' + x.luar.join(' '));
    for (const [k, v] of Object.entries(harap)) if (JSON.stringify(x[k]) !== JSON.stringify(v)) s2.push(k + ' = ' + JSON.stringify(x[k]) + ', seharusnya ' + JSON.stringify(v));
    sebab.push(...s2.map((y) => nama + ': ' + y));
    catat.push([nama, x.sisa]);
    return x;
  };
  const ketuk = (id) => klik(p, '.hp-sim [data-ketuk="' + id + '"]');
  const lanjut = async () => { await klik(p, '.hp-arena-kirim [data-kirim]'); await tunggu(350); };
  if (!d.kirimDiBilah) sebab.push('tombol tidak di bilah bawah');
  // 1 meja
  const petunjuk = () => p.evaluate(() => [...document.querySelectorAll('.sim-ketuk[data-petunjuk]')].map((e) => e.getAttribute('data-ketuk')).join());
  if ((await petunjuk()) !== 'fotokopi,dompet') sebab.push('D-217: garis petunjuk di meja bukan fotokopi + dompet: ' + (await petunjuk()));
  // D-225: garis petunjuk = 1 px putus-putus; krem di meja, biru tua kartu #2f4a6b HANYA di loket (krem di atas kertas KTP biru muda
  // cuma 1,20 : 1). Sasaran berpetunjuk yang difokus lewat keyboard tetap menampilkan cincin fokus (3 px utuh; di cangkang HP = aturan
  // .hp-layar :focus-visible, hijau #215c40): aturan petunjuk lebih berat daripada aturan fokus itu, jadi harus mengecualikan
  // :focus-visible (sebelum 17 Nov sasaran yang difokus hanya bergaris petunjuk 1 px, sama dengan yang tidak difokus). Tab WAJIB sampai
  // di Chromium (Puppeteer); di WebKit Tab belum tentu berhenti di tombol, jadi di sana hanya dinilai bila sasarannya memang terfokus.
  const KREM = '1px dashed rgb(255, 243, 217)', BIRU_KARTU = '1px dashed rgb(47, 74, 107)', CINCIN_FOKUS = /: 3px solid rgb\(/;
  const tabPasti = typeof p.touchscreen?.touchStart === 'function';
  const garisPetunjuk = () => p.evaluate(() => [...new Set([...document.querySelectorAll('.sim-ketuk[data-petunjuk]')].map((e) => { const c = getComputedStyle(e); return `${c.outlineWidth} ${c.outlineStyle} ${c.outlineColor}`; }))]);
  const fokusPetunjuk = async () => {
    let x = null;
    for (let i = 0; i < 12 && !x; i++) {
      await p.keyboard.press('Tab');
      x = await p.evaluate(() => { const e = document.activeElement; if (!e?.matches?.('.sim-ketuk[data-petunjuk]:focus-visible')) return null; const c = getComputedStyle(e); return `${e.getAttribute('data-ketuk')}: ${c.outlineWidth} ${c.outlineStyle} ${c.outlineColor}`; });
    }
    await p.evaluate(() => { document.activeElement?.blur?.(); const g = document.querySelector('.hp-arena-gulir'); if (g) g.scrollTop = 0; });
    return x;
  };
  const nilaiPetunjuk = async (langkah, harap) => {
    const g = await garisPetunjuk();
    if (g.join(' | ') !== harap) sebab.push(`D-225: garis petunjuk di ${langkah} bukan "${harap}": ${g.join(' | ')}`);
    const f = await fokusPetunjuk();
    if (f === null ? tabPasti : !CINCIN_FOKUS.test(f)) sebab.push(`D-225: sasaran berpetunjuk di ${langkah} yang difokus keyboard tidak bercincin fokus 3 px utuh: ${f}`);
    (data.petunjuk ??= {})[langkah] = { garis: g, fokusKeyboard: f };
  };
  // FOKUS KEYBOARD (17 Nov): sesudah AKTIVASI KEYBOARD (sasaran difokus, lalu Enter = click tepercaya dengan detail 0) fokus tidak boleh
  // jatuh ke <body>, di meja, kartu dan loket. Ketukan keliru / benar-tapi-belum-beres = TETAP di sasaran itu, simpul DOM yang sama
  // (dulu <Ketuk> didefinisikan di dalam render: tombolnya dibuat ulang tiap render dan fokusnya hilang); langkah beres = pindah ke
  // tombol bilah; tombol bilah = baris instruksi langkah baru; "Kenapa?" = tombol Tutup, Tutup = tab "Kenapa?". Sesudah tiap penilaian
  // fokus dilepas lagi, supaya tangkapan layarnya sama dengan alur ketuk (tanpa cincin fokus).
  const BILAH = '.hp-arena-kirim [data-kirim]';
  let nomorTekan = 0;
  /** `tahan` = Enter ditahan: keydown, lalu keydown ULANGAN (repeat) sebelum keyup. Ulangan tidak boleh menekan tombol yang baru terfokus. */
  const tekan = async (sel, tahan = false) => {
    const token = ++nomorTekan;
    const bisa = await p.evaluate(([s, t]) => { const e = document.querySelector(s); if (!e || e.disabled) return false; e.__tekan = t; e.focus({ preventScroll: true }); return document.activeElement === e; }, [sel, token]);
    if (!bisa) return { gagal: 'sasaran tidak ada / tidak bisa difokus' };
    if (tahan) { await p.keyboard.down('Enter'); await tunggu(80); await p.keyboard.down('Enter'); await tunggu(80); await p.keyboard.up('Enter'); } else await p.keyboard.press('Enter');
    await tunggu(220);
    return p.evaluate((t) => { const a = document.activeElement; return { tag: a?.tagName ?? null, samaSimpul: a?.__tekan === t,
      di: a?.getAttribute?.('data-ketuk') ?? (a?.hasAttribute?.('data-kirim') ? 'bilah' : a?.classList?.contains('sim-instruksi') ? 'instruksi' : a?.hasAttribute?.('data-kenapa-tutup') ? 'tutup' : a?.hasAttribute?.('data-kenapa') ? 'kenapa' : a?.hasAttribute?.('data-balik') ? 'balik' : null) }; }, token);
  };
  data.fokusKeyboard = [];
  const nilaiTekan = async (nama, sel, harap, { samaSimpul = false, tahan = false } = {}) => {
    const x = await tekan(sel, tahan);
    data.fokusKeyboard.push(`${nama} -> ${x.gagal ?? x.di ?? x.tag}`);
    if (x.gagal) sebab.push(`fokus keyboard, ${nama}: ${x.gagal} (${sel})`);
    else if (x.tag === 'BODY' || x.di !== harap || (samaSimpul && !x.samaSimpul)) sebab.push(`fokus keyboard, ${nama}: sesudah Enter fokus di ${x.di ?? x.tag}${x.di === harap && samaSimpul && !x.samaSimpul ? ' tetapi simpul DOM-nya baru' : ''}, seharusnya ${harap}`);
    await p.evaluate(() => { document.activeElement?.blur?.(); });
  };
  await nilaiPetunjuk('meja', KREM);
  await periksa('1-minta-asli', { langkah: 'meja', beres: false, cap: 'kttt', kirimMati: true, label: 'Ketuk satu benda di meja.', instruksi: 'Ketuk SIM yang perlu kita periksa.', salah: 0 });
  await nilaiTekan('meja, keliru (fotokopi)', '.hp-sim [data-ketuk="fotokopi"]', 'fotokopi', { samaSimpul: true });
  await periksa('1-minta-asli-ragu', { ragu: ['fotokopi'], ucapRagu: true, salah: 1, kirimMati: true, cap: 'kttt' });
  // Enter DITAHAN di dompet: fokus pindah ke tombol bilah, tetapi ulangan tombolnya tidak boleh langsung menekan "Lanjut" (masih di meja).
  await nilaiTekan('meja, benar (dompet, Enter ditahan)', '.hp-sim [data-ketuk="dompet"]', 'bilah', { tahan: true });
  await periksa('1-minta-asli-dapat', { langkah: 'meja', beres: true, cap: 'cktt', kirimMati: false, label: 'Lanjut: baca kartunya', ucapRagu: false, ucap: 'Ini SIM saya. Silakan diperiksa.' });
  await nilaiTekan('meja, tombol bilah', BILAH, 'instruksi'); await tunggu(150);
  // 2 kartu
  await periksa('2-golongan', { langkah: 'kartu', beres: false, kirimMati: true, label: 'Ketuk kartu, lalu label truk.', instruksi: 'Ketuk golongan SIM di kartu ini.' });
  await nilaiTekan('kartu, Kenapa?', '.hp-sim [data-kenapa]', 'tutup'); await periksa('2-golongan-kenapa'); await nilaiTekan('kartu, Tutup', '.hp-sim [data-kenapa-tutup]', 'kenapa');
  await nilaiTekan('kartu, keliru (foto)', '.hp-sim [data-ketuk="foto"]', 'foto', { samaSimpul: true });
  await periksa('2-golongan-ragu', { ragu: ['foto'], ucapRagu: true, salah: 2 });
  await nilaiTekan('kartu, Balik', '.hp-sim [data-balik]', 'balik', { samaSimpul: true });
  const blk = await periksa('2-golongan-balik'); if (!(await p.evaluate(() => !!document.querySelector('.sm-sim-belakang')))) sebab.push('Balik tidak membalik kartu');
  await nilaiTekan('kartu, Depan', '.hp-sim [data-balik]', 'balik', { samaSimpul: true });
  await nilaiTekan('kartu, kotak golongan (belum beres)', '.hp-sim [data-ketuk="golongan"]', 'golongan', { samaSimpul: true });
  await periksa('2-golongan-lensa', { beres: false, instruksi: 'Cocokkan: ketuk label di truk.', ucapRagu: false });
  if (!(await p.evaluate(() => !!document.querySelector('.sm-lensa-asli')))) sebab.push('kaca pembesar tidak muncul');
  await nilaiTekan('kartu, benar (label truk)', '.hp-sim [data-ketuk="label"]', 'bilah');
  await periksa('2-golongan-cocok', { beres: true, cap: 'cckt', kirimMati: false, label: 'Lanjut: cek datanya' });
  await nilaiTekan('kartu, tombol bilah', BILAH, 'instruksi'); await tunggu(150);
  // 3a tempat: TANPA keyboard. Klik skrip (tidak tepercaya) di bengkel dan klik tetikus sungguhan (tepercaya, detail 1) di Satpas:
  // fokus tidak dipindah ke tombol bilah, jadi alur ketuk / tetikus tetap seperti sebelumnya.
  await periksa('3a-tempat', { langkah: 'tempat', kirimMati: true, label: 'Ketuk satu tempat.', instruksi: 'Ke mana kita cek data SIM ini?' });
  await ketuk('bengkel'); await periksa('3a-tempat-ragu', { ragu: ['bengkel'], ucapRagu: true, salah: 3 });
  const ps = await p.evaluate(() => { const r = document.querySelector('.hp-sim [data-ketuk="satpas"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.click(ps[0], ps[1]); await tunggu(250);
  const f3 = await p.evaluate(() => { const a = document.activeElement; return a?.hasAttribute?.('data-kirim') ? 'bilah' : a?.classList?.contains('sim-instruksi') ? 'instruksi' : a?.tagName ?? null; });
  data.fokusKeyboard.push('tempat, klik tetikus di Satpas (bukan keyboard) -> ' + f3);
  if (f3 === 'bilah' || f3 === 'instruksi') sebab.push('klik tetikus (bukan keyboard) memindahkan fokus ke ' + f3);
  await p.mouse.move(1, 1); await p.evaluate(() => { document.activeElement?.blur?.(); });
  await periksa('3a-tempat-satpas', { beres: true, kirimMati: false, label: 'Ke loket Satpas', cap: 'cckt' });
  await lanjut();
  // 3b loket
  if ((await petunjuk()) !== 'nik,ktpNama,ktpAlamat') sebab.push('D-217: garis petunjuk di KTP bukan tiga barisnya: ' + (await petunjuk()));
  await nilaiPetunjuk('loket', BIRU_KARTU);
  await periksa('3b-loket', { langkah: 'loket', kirimMati: true, label: 'Ketuk satu baris di KTP.', instruksi: 'Ketuk nomor yang dicari Satpas di KTP.' });
  await klik(p, '[data-kenapa]'); await periksa('3b-loket-kenapa'); await klik(p, '[data-kenapa-tutup]');
  await nilaiTekan('loket, keliru (baris nama)', '.hp-sim [data-ketuk="ktpNama"]', 'ktpNama', { samaSimpul: true });
  await periksa('3b-loket-ragu', { ragu: ['ktpNama'], ucapRagu: true, salah: 4 });
  await nilaiTekan('loket, benar (baris NIK)', '.hp-sim [data-ketuk="nik"]', 'bilah'); await tunggu(450);
  await periksa('3b-loket-ketemu', { beres: true, cap: 'ccck', kirimMati: false, label: 'Lanjut: cocokkan cetakan' });
  if ((await p.evaluate(() => document.querySelector('[data-monitor]')?.getAttribute('data-monitor'))) !== 'isi') sebab.push('terminal tidak sampai "data ditemukan"');
  await nilaiTekan('loket, tombol bilah', BILAH, 'instruksi'); await tunggu(150);
  // 4 cetakan: seret dengan penunjuk (naik 60 px)
  await periksa('4-cetakan', { langkah: 'cetakan', kirimMati: true, label: 'Seret kartu ke cetakan.', instruksi: 'Cocokkan kartu dengan cetakan Satpas.' });
  // D-215: seretan JARI. touch-action terhitung di kartu dan isinya harus 'none' (kalau 'manipulation', browser membatalkan seretan
  // sesudah 8-20 px). Chromium: seretan sentuh sungguhan lewat layar sentuh CDP (browser menerapkan touch-action), 60 px ke atas dalam
  // enam langkah, sambil mencatat pointercancel dan sejauh apa kartu mengikuti. WebKit (Playwright tanpa API gerak sentuh): peristiwa
  // penunjuk bertipe 'touch' buatan + aturan touch-action yang sama.
  const kr = await p.evaluate(() => { const el = document.querySelector('[data-ketuk="kartu"]'); const r = el.getBoundingClientRect(); window.__seret = { batal: 0, tipe: new Set(), ikut: 0, atas0: r.top };
    for (const n of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) el.addEventListener(n, (e) => { if (n === 'pointercancel') window.__seret.batal++; window.__seret.tipe.add(e.pointerType); window.__seret.ikut = Math.max(window.__seret.ikut, Math.round(window.__seret.atas0 - el.getBoundingClientRect().top)); }, true);
    return { x: r.left + r.width / 2, y: r.top + 30, ta: getComputedStyle(el).touchAction, taAnak: getComputedStyle(el.firstElementChild).touchAction }; });
  if (kr.ta !== 'none' || kr.taAnak !== 'none') sebab.push('touch-action kartu bukan none (D-215): ' + kr.ta + ' / ' + kr.taAnak);
  const sentuhAsli = typeof p.touchscreen?.touchStart === 'function';
  if (sentuhAsli) {
    const jari = await p.touchscreen.touchStart(kr.x, kr.y);
    for (let i = 1; i <= 6; i++) { await jari.move(kr.x, kr.y - i * 10); await tunggu(30); }
    const tengah = await p.evaluate(() => ({ hantu: !!document.querySelector('.sm-sim-hantu'), ikut: Math.round(window.__seret.atas0 - document.querySelector('[data-ketuk="kartu"]').getBoundingClientRect().top) }));
    await KINI.foto('4-cetakan-seret-jari');
    if (!tengah.hantu || tengah.ikut < 40) sebab.push('seret jari: kartu tidak mengikuti jari / bayangan tidak tampil: ' + JSON.stringify(tengah));
    await jari.end();
  } else {
    await p.evaluate(({ x, y }) => { const el = document.querySelector('[data-ketuk="kartu"]'); const ev = (t, yy) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: yy, isPrimary: true })); ev('pointerdown', y); ev('pointermove', y - 30); ev('pointermove', y - 60); ev('pointerup', y - 60); }, kr);
  }
  await tunggu(900);
  const sr = await p.evaluate(() => ({ batal: window.__seret.batal, tipe: [...window.__seret.tipe], ikut: window.__seret.ikut }));
  if (sr.batal > 0 || !sr.tipe.includes('touch')) sebab.push('seret jari dibatalkan browser / bukan peristiwa sentuh (D-215): ' + JSON.stringify(sr));
  data.seretJari = { ...sr, sungguhan: sentuhAsli, touchAction: kr.ta };
  const c4 = await periksa('4-cetakan-sama', { beres: true, cap: 'cccc', kirimMati: false, label: 'Selesai periksa', ucap: 'Tiga-tiganya sama dengan data Satpas.' });
  if ((await p.evaluate(() => document.querySelectorAll('.sm-centang[data-centang]').length)) !== 3) sebab.push('tiga baris cetakan tidak dicentang');
  // D-221: ketiga kotak hijau utuh di dalam adegan; D-222: adegan tidak menggulir sendiri saat kartu difokus.
  const g4 = await p.evaluate(() => { const isi = document.querySelector('.sim-isi'); const ir = isi.getBoundingClientRect(); document.querySelector('[data-ketuk="kartu"]')?.focus(); return { garis: [...document.querySelectorAll('.sim-kartu-seret .sim-garis')].map((e) => { const r = e.getBoundingClientRect(); return r.bottom <= ir.bottom + 0.5 && r.top >= ir.top - 0.5; }), gulirDalam: isi.scrollTop, overflow: getComputedStyle(isi).overflowY }; });
  if (g4.garis.length !== 3 || g4.garis.some((x) => !x)) sebab.push('D-221: kotak hijau di kartu tidak utuh di dalam adegan: ' + JSON.stringify(g4.garis));
  if (g4.gulirDalam !== 0 || g4.overflow !== 'clip') sebab.push('D-222: adegan menggulir sendiri / overflow bukan clip: ' + JSON.stringify([g4.gulirDalam, g4.overflow]));
  await lanjut();
  // akhir
  const ak = await periksa('5-akhir', { langkah: 'akhir', cap: 'cccc', kirimMati: false, label: 'Kembali ke cerita' });
  if (!(await p.evaluate(() => !!document.querySelector('.sim-kasus .sm-lensa-palsu') && document.querySelectorAll('.sim-kasus li').length === 3))) sebab.push('kartu kasus lain tidak lengkap');
  if (await p.evaluate(() => { const k = document.querySelector('.sim-papan .sm-klip'); return !!k && getComputedStyle(k).display !== 'none'; })) sebab.push('D-220: klip masih tampil di layar akhir');
  await lanjut(); await tunggu(700);
  const kembali = await p.evaluate(() => ({ tampilan: document.querySelector('.hp-layar')?.getAttribute('data-tampilan'), node: document.querySelector('.hp-main')?.getAttribute('data-node'), teks: document.querySelector('.hp-main')?.innerText.slice(0, 400) ?? '' }));
  if (kembali.tampilan === 'arena' || !/^ksim-b/.test(kembali.node ?? '')) sebab.push('sesudah selesai tidak kembali ke cerita di ksim-b (ada ketukan keliru): ' + JSON.stringify([kembali.tampilan, kembali.node]));
  Object.assign(data, { keadaan: ke, sisa: catat.map((x) => x[1]), sisaTerkecil: Math.min(...catat.map((x) => x[1])), salah: ak.salah, kembali: kembali.node, balik: blk.langkah });
};

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
  S.k15 = { nilai: stateK15() }; // T-034: belum ada state K15 tersimpan; dibuat dari state 'surat'
  const wk = mesin === 'webkit';
  const pilihVp = hanyaVp ? String(hanyaVp).split(',').map((x) => x.trim()) : null;
  const daftarVp = VP_LAYAR.filter((v) => (pilihVp ? pilihVp.includes(v.n) : !wk || v.n === '360x640' || v.n === '390x645'));
  const KASUS = [
    ['adegan-k08-hasil', 'akt-rambu', (p) => adegan(p)], ['adegan-k09e', 'wawancara-3', (p) => adegan(p)], ['adegan-k05-hasil', 'foto', (p) => adegan(p)],
    ['adegan-k11-tugas', 'berkas', (p) => adegan(p)], ['adegan-k11-istilah', 'berkas', (p) => istilahKomite(p)], ['adegan-pembuka', 'mentor', (p) => adegan(p)], ['adegan-k04-pool', 'pool', (p) => adegan(p)],
    ['adegan-k07-bima', 'bima', (p) => adegan(p)], ['adegan-k10', 'wawancara-2', (p) => adegan(p)],
    ['adegan-k08-tol', 'tol', (p) => adegan(p)], ['adegan-k09', 'wawancara-1', (p) => adegan(p)], ['adegan-awal-baru', null, (p) => adegan(p)],
    ['akhir-puas', 'akhir-puas', (p) => adegan(p, 'akhir')], ['akhir-catatan', 'akhir-catatan', (p) => adegan(p, 'akhir')], ['akhir-kurang', 'akhir-kurang', (p) => adegan(p, 'akhir')],
    ['arena-k02', 'tel-cemas', (p) => aktivitas(p, K02)], ['arena-k04-peta', 'pool', (p) => aktivitas(p, K04)],
    ['arena-k05-rencana', 'bengkel', (p) => aktivitas(p, K05)], ['arena-k07-rencana', 'bima', (p) => aktivitas(p, K07)], ['arena-k09-saksi', 'wawancara-1', (p) => aktivitas(p, K09)], ['arena-k10-banding', 'wawancara-2', (p) => aktivitas(p, K10)], ['arena-k08', 'tol', (p) => aktivitas(p, K08)], ['arena-k11-bundel', 'berkas', (p) => aktivitas(p, K11)], ['arena-ksim', 'akt-saksi', (p) => aktivitas(p, SIM)], ['arena-k15', 'k15', (p) => k15(p)],
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
        // T-020 batch 1: tangkapan per tahap K04 / K08 di 390x645 dan 360x640 (Chromium) -> team/evidence/T-020/fullstack/.
        const b2 = /^arena-k(07|09|10)/.test(nama); const b3 = /^arena-k(02|05|11)/.test(nama); const dirT020 = nama === 'arena-ksim' ? path.join(ROOT, 'team/evidence/T-022/fix') : path.join(ROOT, 'team/evidence/T-020/fullstack', b2 ? 'batch2' : b3 ? 'batch3' : '');
        KINI.foto = !wk && /^arena-k(02|04|05|07|08|09|10|11|sim)/.test(nama) && (vp.n === '390x645' || vp.n === '360x640') ? async (tahap) => { fs.mkdirSync(dirT020, { recursive: true }); await tunggu(250); await h.p.screenshot({ path: path.join(dirT020, `${nama.replace('arena-', '')}-${tahap}-${vp.n}.png`) }); } : async () => {};
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
