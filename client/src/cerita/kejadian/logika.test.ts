/**
 * Tes prototipe "Kejadian" v2 (irisan K10): susunan kartu, adegan dari susunan pemain, perbandingan catatan, dan
 * catatan kasus yang diperbarui pertanyaan klarifikasi (tanpa jawaban karangan, tanpa menilai perbedaan kecil/wajar).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BARIS, BARIS_BEDA, CATATAN_NAMA, HAL, KARTU, SUSUNAN_KOSONG, URUTAN_SAKSI, kartuTersisa, keadaanAdegan, lepas, pasti, penuh, penutupHendra,
  periksa, pertanyaanUntuk, pihakBoleh, ringkasCatatan, sesuaiSaksi, susunPertanyaan, tambahPertanyaan, taruh, type Pertanyaan, type Susunan,
} from './logika';

test('menaruh kartu, memindahkan, dan melepas', () => {
  let s: Susunan = taruh(SUSUNAN_KOSONG, 'pindah', 0);
  s = taruh(s, 'banting', 1);
  assert.deepEqual(s, ['pindah', 'banting', null]);
  s = taruh(s, 'pindah', 2); // dipindah dari slot 0
  assert.deepEqual(s, [null, 'banting', 'pindah']);
  s = lepas(s, 1);
  assert.deepEqual(s, [null, null, 'pindah']);
  assert.equal(penuh(s), false);
  assert.equal(penuh(['pindah', 'banting', 'tabrak']), true);
  assert.deepEqual(taruh(SUSUNAN_KOSONG, 'pindah', 3), SUSUNAN_KOSONG);
});

test('daftar kartu hanya menampilkan yang belum ditaruh (tanpa duplikat)', () => {
  assert.equal(kartuTersisa(SUSUNAN_KOSONG).length, 3);
  assert.deepEqual(kartuTersisa(['pindah', null, 'tabrak']).map((k) => k.id), ['banting']);
  assert.equal(kartuTersisa(['pindah', 'banting', 'tabrak']).length, 0);
});

test('urutan tampil kartu bukan urutan kejadian', () => {
  assert.notDeepEqual(KARTU.map((k) => k.id), ['pindah', 'banting', 'tabrak']);
  assert.equal(new Set(KARTU.map((k) => k.id)).size, 3);
});

test('adegan mengikuti urutan saksi: mobil pindah, truk ke kiri, truk menabrak', () => {
  const s: Susunan = ['pindah', 'banting', 'tabrak'];
  assert.deepEqual(keadaanAdegan(s, 0), { mobil: 'asal', truk: 'lurus', terakhir: null });
  assert.deepEqual(keadaanAdegan(s, 1), { mobil: 'pindah', truk: 'lurus', terakhir: 'pindah' });
  assert.equal(keadaanAdegan(s, 2).truk, 'kiri');
  assert.deepEqual(keadaanAdegan(s, 3), { mobil: 'pindah', truk: 'tabrak', terakhir: 'tabrak' });
});

test('urutan terbalik tetap diputar apa adanya (ganjil terlihat, tidak ditolak)', () => {
  const s: Susunan = ['tabrak', 'banting', 'pindah'];
  assert.equal(keadaanAdegan(s, 1).truk, 'tabrak');
  assert.equal(keadaanAdegan(s, 2).truk, 'kiri');
  assert.equal(keadaanAdegan(s, 3).mobil, 'pindah');
});

test('sesuaiSaksi hanya membandingkan dengan urutan saksi', () => {
  assert.equal(sesuaiSaksi([...URUTAN_SAKSI]), true);
  assert.equal(sesuaiSaksi(['banting', 'pindah', 'tabrak']), false);
  assert.equal(sesuaiSaksi(SUSUNAN_KOSONG), false);
});

test('perbandingan: dua baris berbeda, satu sama, tanpa teka-teki nama', () => {
  assert.deepEqual([...BARIS_BEDA], ['jam', 'catatan']);
  assert.equal(BARIS.filter((b) => b.jenis === 'sama').length, 1);
  assert.ok(!BARIS.some((b) => /nama/i.test(b.label)), 'nama tidak boleh jadi baris teka-teki');
  const jam = BARIS.find((b) => b.id === 'jam')!;
  assert.deepEqual([jam.polisi, jam.tol], ['20.10', '20.15']);
  assert.match(CATATAN_NAMA, /disamarkan/);
});

test('periksa memisahkan ditandai, terlewat, berlebih', () => {
  assert.deepEqual(periksa(['jam', 'pokok']), { ditandaiBeda: ['jam'], terlewat: ['catatan'], berlebih: ['pokok'] });
  assert.deepEqual(periksa([]).terlewat, [...BARIS_BEDA]);
});

test('pertanyaan: dirakit dari fakta naskah, hanya bertanya, tanpa jawaban', () => {
  const jam = susunPertanyaan('jam', 'tol');
  assert.match(jam, /20\.10/); assert.match(jam, /20\.15/); assert.match(jam, /\?$/);
  assert.match(susunPertanyaan('nama', 'polisi'), /\?$/);
  assert.match(susunPertanyaan('catatan', 'tol'), /kurang antisipasi/);
  for (const h of HAL) for (const p of h.pihak) assert.match(susunPertanyaan(h.id, p), /\?$/);
});

test('catatan "kurang antisipasi" bisa ditanyakan ke kedua pihak (ketiadaan di catatan polisi belum terkonfirmasi)', () => {
  assert.equal(pihakBoleh('catatan', 'tol'), true);
  assert.equal(pihakBoleh('catatan', 'polisi'), true);
  assert.equal(tambahPertanyaan([], 'catatan', 'polisi').length, 1);
  assert.match(susunPertanyaan('catatan', 'polisi'), /memuat penilaian serupa\?$/);
  assert.match(BARIS.find((b) => b.id === 'catatan')!.polisi, /kutipan ini/);
});

test('menempel pertanyaan memperbarui catatan kasus; satu per hal, yang baru menggantikan', () => {
  let d: Pertanyaan[] = [];
  const awal = ringkasCatatan(d);
  assert.deepEqual(awal.beda.map((b) => b.status), ['belum', 'belum', 'belum']);
  assert.equal(awal.klarifikasi.length, 0);
  d = tambahPertanyaan(d, 'jam', 'tol');
  const a = ringkasCatatan(d);
  assert.equal(a.beda[0].status, 'ditanyakan');
  assert.equal(a.beda[0].pihak, 'tol');
  assert.equal(a.klarifikasi.length, 1);
  d = tambahPertanyaan(d, 'jam', 'polisi');
  assert.equal(d.length, 1);
  assert.equal(pertanyaanUntuk(d, 'jam')?.pihak, 'polisi');
  d = tambahPertanyaan(d, 'nama', 'tol');
  assert.equal(ringkasCatatan(d).klarifikasi.length, 2);
});

test('yang sudah pasti memakai urutan saksi, bukan urutan pemain, dan menyebut tidak ada korban', () => {
  const p = pasti();
  assert.equal(p.length, 4);
  assert.match(p[0], /pindah/); assert.match(p[1], /banting/); assert.match(p[2], /menabrak/); assert.match(p[3], /korban/);
});

test('teks pemain: tanpa hasil klaim, tuduhan, atau penilaian perbedaan kecil/wajar', () => {
  const larangan = /\b(benar|salah(?! satu)|tepat|bagus|penipuan|bohong|dibayar|ditolak|disetujui|layak|wajar|sepele)\b|perbedaan kecil/i;
  const semua = [
    ...BARIS.flatMap((b) => [b.label, b.polisi, b.tol, b.penjelasan]),
    ...HAL.flatMap((h) => [h.judul, h.ringkas]),
    ...HAL.flatMap((h) => h.pihak.map((p) => susunPertanyaan(h.id, p))),
    CATATAN_NAMA, penutupHendra(1), penutupHendra(3), ...pasti(),
  ];
  for (const t of semua) assert.doesNotMatch(t, larangan, t);
});
