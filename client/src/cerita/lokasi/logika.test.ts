/**
 * Tes prototipe "Lokasi" v2 (irisan K08): kunci naskah ada, urutan langkah tetap, tanda lajur milik pemain,
 * tanggapan Pak Bima mencocokkan tanda dengan tulisan rambu dan kesimpulan, urutan pilihan sesuai naskah, tanpa nilai/skor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEKS_AUTO_2_ID } from '../episode/auto-2/teks.id';
import {
  KEADAAN_AWAL, PILIHAN, RAMBU, URUTAN_PILIHAN, bolehLanjut, bukaUlang, cariPilihan, catatanTemuan, ketukRambu, lajurTertulisRambu1, lanjut, rambuAktif,
  rambuTerbuka, selesaiPeriksa, t, tahap, tandai, tanggapanTanda, teksLajur, type IdPilihan, type Keadaan,
} from './logika';

/** Jalankan urutan penuh: ketuk rambu 1, tandai, lanjut, ketuk rambu 2, tandai, lanjut. */
function selesai(m1: number[], m2: number[]): Keadaan {
  let k = ketukRambu(KEADAAN_AWAL);
  for (const n of m1) k = tandai(k, n);
  k = lanjut(k);
  k = ketukRambu(k);
  for (const n of m2) k = tandai(k, n);
  return lanjut(k);
}

test('semua kunci naskah yang dipakai ada (tanpa teks karangan)', () => {
  const kunci = [
    'dok.rambu.1', 'dok.rambu.1.isi', 'dok.rambu.2', 'dok.rambu.2.isi', 'dok.rambu.3', 'dok.rambu.3.isi', 'dok.rambu.4', 'dok.rambu.4.isi', 'dok.rambu.catatan',
    'k08.1', 'k08.2', 'k08.tanya', ...PILIHAN.flatMap((p) => [p.teksKunci, p.alasanKunci, ...p.akibat.map((a) => a.kunci)]),
  ];
  for (const k of kunci) assert.ok(TEKS_AUTO_2_ID[k], `kunci hilang: ${k}`);
});

test('tulisan rambu 1 dibaca dari naskah: lajur 3 dan 4', () => {
  assert.deepEqual(lajurTertulisRambu1(), [3, 4]);
  assert.match(t(RAMBU.rambu1.isiKunci), /dilarang/);
  assert.match(t('dok.rambu.4.isi'), /Lajur 2.*keterangan supir/);
});

test('urutan langkah tetap: ketuk -> tandai -> ketuk -> tandai -> selesai', () => {
  let k = KEADAAN_AWAL;
  assert.equal(tahap(k), 'ketuk'); assert.equal(rambuAktif(k), 'rambu1');
  assert.deepEqual(tandai(k, 3), k, 'jalan belum bisa ditandai sebelum rambu diketuk');
  k = ketukRambu(k);
  assert.equal(tahap(k), 'tandai'); assert.equal(bolehLanjut(k), false);
  assert.deepEqual(lanjut(k), k, 'tidak bisa lanjut tanpa tanda');
  k = tandai(k, 3);
  assert.equal(bolehLanjut(k), true);
  k = lanjut(k);
  assert.equal(tahap(k), 'ketuk'); assert.equal(rambuAktif(k), 'rambu2');
  assert.deepEqual(ketukRambu(ketukRambu(k)).progres, 3, 'ketuk ganda tidak melompat dua langkah');
  k = tandai(ketukRambu(k), 1);
  k = lanjut(k);
  assert.equal(selesaiPeriksa(k), true);
});

test('menandai lajur: menyalakan, mematikan, terurut, batas diabaikan', () => {
  let k = ketukRambu(KEADAAN_AWAL);
  k = tandai(tandai(k, 4), 3);
  assert.deepEqual(k.tanda1, [3, 4]);
  assert.deepEqual(tandai(k, 4).tanda1, [3]);
  assert.deepEqual(tandai(k, 0), k); assert.deepEqual(tandai(k, 5), k); assert.deepEqual(tandai(k, 1.5), k);
  assert.deepEqual(k.tanda2, []);
});

test('rambu yang sudah dibuka bisa dibuka ulang tanpa mundur dan tanpa kehilangan kemajuan', () => {
  let k = selesai([3, 4], [1]);
  assert.deepEqual(rambuTerbuka(k), ['rambu1', 'rambu2']);
  k = bukaUlang(k, 'rambu1');
  assert.equal(tahap(k), 'tandai'); assert.equal(rambuAktif(k), 'rambu1');
  k = tandai(k, 2); // ubah tanda rambu 1 saat meninjau ulang
  assert.deepEqual(k.tanda1, [2, 3, 4]);
  k = lanjut(k);
  assert.equal(k.lihat, null); assert.equal(selesaiPeriksa(k), true);
  assert.deepEqual(bukaUlang(KEADAAN_AWAL, 'rambu2'), KEADAAN_AWAL, 'rambu 2 belum dibuka tidak bisa dibuka ulang');
});

test('tanggapan: tanda sama dengan tulisan rambu dan sejalan dengan kesimpulan -> satu kalimat netral', () => {
  const r = tanggapanTanda([3, 4], 'c');
  assert.deepEqual(r.map((x) => x.kunci), ['sama']);
  assert.deepEqual(tanggapanTanda([3, 4], 'b').map((x) => x.kunci), ['sama']);
});

test('tanggapan: tanda berbeda dari tulisan rambu disebut apa adanya (tanpa kata salah)', () => {
  const r = tanggapanTanda([1, 2], 'e');
  assert.deepEqual(r.map((x) => x.kunci), ['tulisan']);
  assert.match(r[0].teks, /lajur 1 dan 2/); assert.match(r[0].teks, /lajur 3 dan 4/);
  assert.doesNotMatch(r[0].teks, /salah|benar/i);
});

test('tanggapan: kesimpulan "melanggar" padahal lajur 2 tidak ditandai -> dipertanyakan', () => {
  const r = tanggapanTanda([3, 4], 'a');
  assert.deepEqual(r.map((x) => x.kunci), ['sikap']);
  assert.match(r[0].teks, /apa dasar/);
});

test('tanggapan: kesimpulan "tidak melanggar" padahal lajur 2 ditandai terlarang -> dipertanyakan (bersama tulisan)', () => {
  const r = tanggapanTanda([2, 3, 4], 'c');
  assert.deepEqual(r.map((x) => x.kunci), ['tulisan', 'sikap']);
  assert.match(r[1].teks, /mana yang kamu maksud/);
});

test('tanggapan: jalan tanda pemain menentukan; pilihan tanpa sikap tidak memicu pertanyaan sikap', () => {
  for (const id of ['b', 'd', 'e'] as IdPilihan[]) {
    assert.equal(cariPilihan(id).sikap, null);
    assert.ok(!tanggapanTanda([1, 2], id).some((x) => x.kunci === 'sikap'));
  }
  assert.equal(cariPilihan('a').sikap, 'melanggar'); assert.equal(cariPilihan('c').sikap, 'tidak');
});

test('urutan pilihan dari naskah (c, e, a, d, b) dan akibat Pak Hendra pada d', () => {
  assert.deepEqual([...URUTAN_PILIHAN], ['c', 'e', 'a', 'd', 'b']);
  assert.equal(PILIHAN.length, 5);
  assert.equal(cariPilihan('d').akibat[0].pembicara, 'hendra');
});

test('catatan temuan: berkas dari naskah, tanda pemain apa adanya, yang belum pasti dari naskah', () => {
  const c = catatanTemuan(selesai([1, 2], [1]));
  assert.equal(c.berkas.length, 4);
  assert.equal(c.tandamu[0].isi, 'lajur 1 dan 2'); assert.equal(c.tandamu[1].isi, 'lajur 1');
  assert.ok(c.belumPasti.some((x) => /menunggu konfirmasi/.test(x)));
});

test('teksLajur: satu, dua, tiga lajur, dan kosong', () => {
  assert.equal(teksLajur([]), 'belum ada lajur'); assert.equal(teksLajur([2]), 'lajur 2');
  assert.equal(teksLajur([4, 3]), 'lajur 3 dan 4'); assert.equal(teksLajur([2, 3, 4]), 'lajur 2, 3, dan 4');
});

test('tidak ada nilai atau skor pada pilihan', () => {
  for (const p of PILIHAN) assert.deepEqual(Object.keys(p).sort(), ['akibat', 'alasanKunci', 'id', 'sikap', 'teksKunci']);
});
