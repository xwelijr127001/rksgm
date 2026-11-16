/**
 * Tes aset adegan "Periksa rambu". T-020 batch 1: jalan, truk, arsiran, tuts dan rambu = PNG piksel di seni/aktivitas/jalan/;
 * angka geometri.ts harus cocok dengan UKURAN berkas PNG itu (1 piksel seni = 1 px CSS). SVG yang tersisa (ikon periksa) tetap
 * diperiksa: tanpa templating atau skrip, dan unikkan() membuat id unik tanpa merusak rujukannya.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BAHU, BARIS_TUTS, CINCIN, JUMLAH_LAJUR, LAJUR_TRUK, LEBAR_JALAN, LEBAR_LAJUR, PANAH, TINGGI_ADEGAN, TRUK, TUTS, geserLajur, kiriLajur, kiriTruk, selTuts, tengahLajur, x0Jalan } from './geometri';
import { idDalamSvg, unikkan } from './svg';

const DIR = path.join(import.meta.dirname, 'svg');
const baca = (n: string) => fs.readFileSync(path.join(DIR, n), 'utf8');
const SEMUA = ['ikon-periksa.svg'];
const PIKSEL = path.join(import.meta.dirname, '..', '..', 'seni', 'aktivitas');
const ukuran = (rel: string) => { const b = fs.readFileSync(path.join(PIKSEL, rel)); assert.equal(b.toString('latin1', 1, 4), 'PNG', rel); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), byte: b.length }; };

test('SVG yang tersisa: satu elemen svg, tanpa templating, skrip, atau tautan luar; SVG jalan/truk/arsir lama sudah dihapus', () => {
  for (const n of SEMUA) {
    const s = baca(n);
    assert.ok(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), n);
    assert.equal((s.match(/<svg/g) ?? []).length, 1, n);
    assert.ok(!s.includes('{{') && !/<script|onload=|javascript:|href="http/i.test(s), n);
  }
  for (const n of ['jalan-empat-lajur.svg', 'truk-biru.svg', 'arsir-lajur.svg', 'arsir-lajur-biru.svg']) assert.ok(!fs.existsSync(path.join(DIR, n)), `${n} diganti PNG piksel`);
});

test('jalan piksel: blok 278 px = bahu 7 + empat lajur 66 + bahu 7; strip 278 x 26 berulang ke bawah (sesuai geometri.ts)', () => {
  assert.deepEqual([LEBAR_JALAN, BAHU, LEBAR_LAJUR, JUMLAH_LAJUR, TINGGI_ADEGAN], [278, 7, 66, 4, 236]);
  assert.equal(BAHU * 2 + JUMLAH_LAJUR * LEBAR_LAJUR, LEBAR_JALAN);
  const strip = ukuran('jalan/jalan-strip.png');
  assert.deepEqual([strip.w, strip.h], [LEBAR_JALAN, 26]);
});

test('lajur dalam piksel: kiri = (W - 278) / 2 + 7 + (n - 1) x 66 pada W 336 dan 366; bilangan bulat', () => {
  assert.deepEqual([336, 366].map(x0Jalan), [29, 44]);
  assert.deepEqual([1, 2, 3, 4].map((n) => kiriLajur(n, 336)), [36, 102, 168, 234]);
  assert.deepEqual([1, 2, 3, 4].map((n) => kiriLajur(n, 366)), [51, 117, 183, 249]);
  assert.deepEqual([1, 2, 3, 4].map(geserLajur), [7, 73, 139, 205]);
  assert.equal(tengahLajur(2, 336), 135);
});

test('truk piksel 40 x 124 di lajur 2 (keterangan supir): kiri lajur + 13 = di tengah lajur, atas 80 dari adegan 236', () => {
  const t = ukuran('jalan/truk-atas.png'); const b = ukuran('jalan/truk-bayangan.png');
  assert.deepEqual([t.w, t.h], [TRUK.w, TRUK.h]);
  assert.deepEqual([b.w, b.h], [TRUK.w, TRUK.h]);
  assert.equal(LAJUR_TRUK, 2);
  assert.equal(kiriTruk(LAJUR_TRUK, 336), 115);
  assert.equal(kiriTruk(LAJUR_TRUK, 336) + TRUK.w / 2, tengahLajur(LAJUR_TRUK, 336), 'truk tepat di tengah lajurnya');
  assert.ok(TRUK.atas === 80 && TRUK.atas + TRUK.h < TINGGI_ADEGAN);
  assert.deepEqual([CINCIN.w, CINCIN.h, CINCIN.geser, CINCIN.atas], [54, 136, 6, 74]);
});

test('tuts lajur: atlas 160 x 120, sel 40 x 30 (kolom = lajur, baris = biasa / terpilih / dilarang / lajur kiri); panah 18 x 27', () => {
  const a = ukuran('jalan/tuts-lajur.png');
  assert.deepEqual([a.w, a.h], [JUMLAH_LAJUR * TUTS.w, Object.keys(BARIS_TUTS).length * TUTS.h]);
  assert.deepEqual(selTuts(1, 'biasa'), { x: -0, y: -0 });
  assert.deepEqual(selTuts(3, 'dilarang'), { x: -80, y: -60 });
  assert.deepEqual(selTuts(4, 'lajurKiri'), { x: -120, y: -90 });
  assert.ok(TUTS.atas + TUTS.h <= TINGGI_ADEGAN);
  const p = ukuran('jalan/panah-marka.png');
  assert.deepEqual([p.w, p.h], [PANAH.w, PANAH.h]);
});

test('seni piksel batch 1 + 2 + 3 lengkap (dokumen 15, terusan 5, bundel 5, obrolan 1): peta 16, jalan 13, papan 18, saksi 12 (atlas sembilan-iris dipotong per sel), banding 12; ukuran sesuai README', () => {
  const HARAP: Record<string, [number, number]> = {
    'peta/ubin-kantor.png': [80, 60], 'peta/ubin-meja-kantor.png': [80, 60], 'peta/ubin-pool.png': [80, 60], 'peta/ubin-bengkel-rekanan.png': [80, 60], 'peta/ubin-bengkel-langganan.png': [80, 60],
    'peta/bingkai.png': [84, 64], 'peta/bingkai-pilih.png': [88, 68], 'peta/bingkai-fokus.png': [88, 68], 'peta/pin-cincin.png': [40, 42], 'peta/rumput.png': [48, 48],
    'peta/jalan-tanah-h.png': [16, 12], 'peta/jalan-tanah-v.png': [12, 16], 'peta/jalan-tanah-simpang.png': [12, 12], 'peta/pohon-1.png': [28, 32], 'peta/pohon-2.png': [22, 28], 'peta/semak.png': [24, 13],
    'jalan/jalan-strip.png': [278, 26], 'jalan/panah-marka.png': [18, 27], 'jalan/truk-atas.png': [40, 124], 'jalan/truk-bayangan.png': [40, 124], 'jalan/muka-rambu-1.png': [22, 22], 'jalan/muka-rambu-2.png': [22, 22],
    'jalan/tiang-rambu-1.png': [24, 44], 'jalan/tiang-rambu-2.png': [24, 44], 'jalan/tuts-lajur.png': [160, 120], 'jalan/arsir-merah.png': [12, 12], 'jalan/arsir-biru.png': [12, 12],
    'jalan/contoh-arsir-merah.png': [14, 14], 'jalan/contoh-arsir-biru.png': [14, 14],
  };
  // Batch 2 (README papan/, saksi/, banding/). kartu-9i (72 x 18) dan tombol-9i (36 x 22) = atlas; di klien dipakai potongannya
  // per sel (tools/piksel/potong-atlas-t020.mjs), karena border-image tidak bisa menunjuk satu sel.
  const HARAP2: Record<string, [number, number]> = {
    'papan/gabus.png': [32, 32], 'papan/bingkai-kayu-9i.png': [24, 24], 'papan/plat-kolom-9i.png': [12, 18], 'papan/kartu-kerja-9i.png': [18, 20], 'papan/ikon-jam.png': [12, 11], 'papan/nota-9i.png': [18, 18],
    'papan/slot-9i.png': [24, 24], 'papan/slot-isi-9i.png': [18, 18], 'papan/plus.png': [20, 20], 'papan/kartu-periksa-9i.png': [18, 20], 'papan/ikon-kaca.png': [30, 30], 'papan/ikon-kaca-kecil.png': [15, 15], 'papan/pin.png': [8, 10],
    'papan/chip-9i.png': [18, 20], 'papan/chip-pilih-9i.png': [18, 20], 'papan/ikon-telepon.png': [24, 24], 'papan/ikon-lembar-cek.png': [24, 24], 'papan/ikon-lencana.png': [24, 24],
    'saksi/kartu-biasa-9i.png': [18, 18], 'saksi/kartu-tempel-9i.png': [18, 18], 'saksi/kartu-bayangan-9i.png': [18, 18], 'saksi/kartu-pilih-9i.png': [18, 18], 'saksi/kartu-tidak-9i.png': [18, 18], 'saksi/lencana-strip.png': [18, 18],
    'saksi/tombol-biasa-9i.png': [18, 22], 'saksi/tombol-tekan-9i.png': [18, 22], 'saksi/ikon-pin.png': [12, 15], 'saksi/ikon-strip.png': [12, 12], 'saksi/mobil-kecil.png': [48, 22], 'saksi/ikon-tanya.png': [12, 11],
    'banding/kertas-9i.png': [18, 18], 'banding/kepala-polisi.png': [6, 18], 'banding/kepala-tol.png': [6, 18], 'banding/ikon-jam.png': [12, 11], 'banding/ikon-wajah.png': [12, 11], 'banding/ikon-pensil.png': [12, 11],
    'banding/sorot-9i.png': [12, 22], 'banding/beda.png': [22, 22], 'banding/kotak-kemajuan.png': [30, 10], 'banding/cap.png': [220, 96], 'banding/cap-kecil.png': [110, 48], 'banding/jejak-cap.png': [220, 20],
  };
  let total = 0;
  for (const [rel, [w, h]] of Object.entries(HARAP)) { const u = ukuran(rel); assert.deepEqual([u.w, u.h], [w, h], rel); total += u.byte; }
  assert.equal(total, 13581);
  // Batch 3 (README dokumen/, terusan/, bundel/, obrolan/). Latar konter K02 = seni/piksel/*.png yang sudah ada, bukan berkas baru.
  const HARAP3: Record<string, [number, number]> = {
    'dokumen/dok-formulir.png': [64, 80], 'dokumen/dok-stnk.png': [64, 44], 'dokumen/dok-ktp.png': [64, 44], 'dokumen/dok-sim.png': [64, 44], 'dokumen/dok-suratpolisi.png': [64, 80], 'dokumen/dok-suratpolisi-ada.png': [64, 80],
    'dokumen/dok-kk.png': [64, 48], 'dokumen/dok-slip.png': [48, 80], 'dokumen/dok-rekening.png': [64, 80], 'dokumen/dok-hitungan.png': [64, 80], 'dokumen/dok-tender.png': [64, 80], 'dokumen/dok-laporan.png': [64, 80],
    'dokumen/dok-foto-bundel.png': [60, 48], 'dokumen/dok-kecil.png': [286, 28], 'dokumen/baki.png': [204, 120],
    'terusan/ubin-mitra.png': [80, 60], 'terusan/ubin-hendra.png': [80, 60], 'terusan/ubin-lain.png': [80, 60], 'terusan/ubin-tunggu.png': [80, 60], 'terusan/ubin-diam.png': [80, 60],
    'bundel/aksi-lengkapi.png': [48, 40], 'bundel/aksi-komite.png': [48, 40], 'bundel/aksi-hendra.png': [48, 40], 'bundel/bundel-berkas.png': [48, 40], 'bundel/map-pengajuan.png': [120, 64],
    'obrolan/foto-truk.png': [240, 150],
  };
  let total3 = 0;
  for (const [rel, [w, h]] of Object.entries(HARAP3)) { const u = ukuran(rel); assert.deepEqual([u.w, u.h], [w, h], rel); total3 += u.byte; }
  assert.equal(total3, 16452);
  for (const d of ['dokumen', 'terusan', 'bundel', 'obrolan']) for (const n of fs.readdirSync(path.join(PIKSEL, d))) assert.ok(HARAP3[d + '/' + n], 'berkas tak dikenal: ' + d + '/' + n);
  let total2 = 0;
  for (const [rel, [w, h]] of Object.entries(HARAP2)) { const u = ukuran(rel); assert.deepEqual([u.w, u.h], [w, h], rel); total2 += u.byte; }
  // 6.440 B dari Designer - dua atlas (196 + 149) + enam potongannya (805) = 6.900 B.
  assert.equal(total2, 6900);
  for (const d of ['papan', 'saksi', 'banding']) for (const n of fs.readdirSync(path.join(PIKSEL, d))) assert.ok(HARAP2[d + '/' + n], 'berkas tak dikenal: ' + d + '/' + n);
  // Setiap PNG dipakai piksel.css, dan piksel.css tidak merujuk berkas yang tidak ada.
  const css = fs.readFileSync(path.join(PIKSEL, 'piksel.css'), 'utf8');
  const dirujuk = new Set([...css.matchAll(/url\('\.\/([^']+\.png)'\)/g)].map((m) => m[1]!));
  assert.deepEqual([...dirujuk].sort(), [...Object.keys(HARAP), ...Object.keys(HARAP2), ...Object.keys(HARAP3)].sort());
});

test('unikkan: id dan rujukan url(#) diberi sufiks yang sama; dua salinan tidak berbagi id', () => {
  const s = '<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="rk-a"><rect fill="url(#rk-b)"/></pattern><linearGradient id="rk-b"/></defs><rect fill="url(#rk-a)"/></svg>';
  const a = unikkan(s, 'a1'); const b = unikkan(s, 'b2');
  assert.ok(a.includes('id="rk-a-a1"') && a.includes('url(#rk-a-a1)') && a.includes('url(#rk-b-a1)'));
  assert.ok(!a.includes('url(#rk-a)'));
  assert.notDeepEqual(idDalamSvg(a), idDalamSvg(b));
  for (const id of idDalamSvg(a)) assert.ok(id.endsWith('-a1'), id);
});

test('lisensi font ikut disimpan (SIL OFL + hak cipta) dan berkas font ada', () => {
  const lis = fs.readFileSync(path.join(import.meta.dirname, 'LISENSI-PlusJakartaSans.txt'), 'utf8');
  assert.match(lis, /SIL OPEN FONT LICENSE Version 1\.1/); assert.match(lis, /Plus Jakarta Sans Project Authors/);
  assert.ok(fs.statSync(path.join(import.meta.dirname, 'PlusJakartaSans-latin.woff2')).size > 10_000);
});

test('T-022 seni periksa SIM: 37 berkas dikirim (22813 byte), sim.css merujuk persis berkas itu; dua berkas cadangan tidak dikirim', () => {
  const dir = path.join(PIKSEL, 'sim');
  const berkas = fs.readdirSync(dir).filter((n) => n.endsWith('.png')).sort();
  assert.equal(berkas.length, 37);
  assert.equal(berkas.reduce((n, x) => n + fs.statSync(path.join(dir, x)).size, 0), 22813); // empat cap digambar ulang Designer (D-224, 17 Nov)
  assert.ok(!berkas.includes('sim-palsu-kecil.png') && !berkas.includes('potret-petugas.png'));
  const css = fs.readFileSync(path.join(PIKSEL, 'sim.css'), 'utf8');
  const dirujuk = [...new Set([...css.matchAll(/url\('\.\/sim\/([^']+\.png)'\)/g)].map((m) => m[1]!))].sort();
  assert.deepEqual(dirujuk, berkas);
  for (const [n, w, h] of [['sim-depan.png', 240, 152], ['sim-belakang.png', 240, 152], ['ktp.png', 190, 120], ['cetakan.png', 300, 112], ['loket-dinding.png', 366, 104], ['lensa-asli.png', 124, 124]] as const) { const u = ukuran('sim/' + n); assert.deepEqual([u.w, u.h], [w, h], n); }
});
