import test from 'node:test';
import assert from 'node:assert/strict';
import { BATAS_KUSTOM, type SoalKustom } from '../../../../shared/bankSoal';
import { bacaAngka, drafDari, drafKosong, idBaru, langkahKosong, periksaDraf, soalDariDraf } from './drafSoal';

const SOAL: SoalKustom = {
  id: 'k-abcdefgh',
  title: 'Banjir di gudang',
  product: 'FIRE',
  tingkat: 2,
  story: 'Hujan semalaman membuat gudang tergenang.',
  instruction: 'Pilih tindakan pertama yang tepat.',
  learning: 'Amankan barang dulu, lalu dokumentasikan.',
  durationSeconds: 75,
  image: { src: '/gambar-soal/abc.png', alt: 'Gudang tergenang air setinggi lutut' },
  steps: [
    { id: 's1', kind: 'single', prompt: 'Apa yang pertama?', options: [{ id: 'o1', label: 'Foto' }, { id: 'o2', label: 'Pulang' }], benar: ['o1'], penjelasan: 'Dokumentasi dulu.' },
    { id: 's2', kind: 'multi', prompt: 'Dokumen apa saja?', options: [{ id: 'o1', label: 'Polis' }, { id: 'o2', label: 'Foto' }, { id: 'o3', label: 'Struk makan' }], benar: ['o1', 'o2'], penjelasan: 'Polis dan foto.' },
    { id: 's3', kind: 'number', prompt: 'Berapa peti yang rusak?', nilai: 12, toleransi: 1, unit: 'peti', format: 'angka', penjelasan: 'Dua belas peti.' },
  ],
};

test('bacaAngka: cara tulis Indonesia dan desimal', () => {
  assert.equal(bacaAngka('1.500.000'), 1500000);
  assert.equal(bacaAngka('1.500'), 1500);
  assert.equal(bacaAngka('1,5'), 1.5);
  assert.equal(bacaAngka('12.5'), 12.5);
  assert.equal(bacaAngka(' 75 '), 75);
  assert.equal(bacaAngka('-3'), -3);
  assert.ok(Number.isNaN(bacaAngka('')));
  assert.ok(Number.isNaN(bacaAngka('dua belas')));
  assert.ok(Number.isNaN(bacaAngka('1.2.3')));
});

test('idBaru: id pertama yang belum dipakai', () => {
  assert.equal(idBaru('o', []), 'o1');
  assert.equal(idBaru('o', ['o1', 'o3']), 'o2');
  assert.equal(langkahKosong(['s1']).id, 's2');
});

test('soal sah: bolak-balik draf tidak mengubah isi, dan lolos validasi', () => {
  const draf = drafDari(SOAL);
  assert.deepEqual(periksaDraf(draf), {});
  assert.deepEqual(soalDariDraf(draf), SOAL);
});

test('draf kosong: isian wajib, tanda benar, dan penjelasan ditandai', () => {
  const g = periksaDraf(drafKosong());
  for (const alamat of ['title', 'story', 'instruction', 'learning', 'steps.0.prompt', 'steps.0.options.0', 'steps.0.options.1', 'steps.0.benar', 'steps.0.penjelasan']) {
    assert.ok(g[alamat], `galat untuk ${alamat}`);
  }
  assert.equal(g.durasi, undefined, 'durasi bawaan sah');
});

test('aturan kunci: single tepat 1, multi tidak boleh semua, angka harus terhingga, alt wajib', () => {
  const d = drafDari(SOAL);
  d.steps[0]!.benar = [];
  d.steps[1]!.benar = ['o1', 'o2', 'o3'];
  d.steps[2]!.nilai = 'banyak';
  d.steps[2]!.toleransi = '-1';
  d.image = { src: '/gambar-soal/abc.png', alt: '  ' };
  d.durasi = String(BATAS_KUSTOM.durasiMaks + 1);
  const g = periksaDraf(d);
  assert.equal(g['steps.0.benar']?.kunci, 'bank.vSatuBenar');
  assert.equal(g['steps.1.benar']?.kunci, 'bank.vMultiBenar');
  assert.equal(g['steps.2.nilai']?.kunci, 'bank.vAngka');
  assert.equal(g['steps.2.toleransi']?.kunci, 'bank.vToleransi');
  assert.equal(g['image.alt']?.kunci, 'bank.vAlt');
  assert.equal(g.durasi?.kunci, 'bank.vDurasi');
});

test('panjang teks & pilihan kembar', () => {
  const d = drafDari(SOAL);
  d.title = 'x'.repeat(BATAS_KUSTOM.judul + 1);
  d.steps[0]!.options[1]!.label = ' foto ';
  const g = periksaDraf(d);
  assert.equal(g.title?.kunci, 'bank.vTerlaluPanjang');
  assert.equal(g['steps.0.options.1']?.kunci, 'bank.vOpsiKembar');
});

test('langkah angka tidak mengirim opsi; langkah pilihan tidak mengirim nilai', () => {
  const soal = soalDariDraf(drafDari(SOAL));
  assert.equal(soal.steps[2]!.options, undefined);
  assert.equal(soal.steps[0]!.nilai, undefined);
  // Tanda benar mengikuti urutan opsi, dan id yang sudah tidak ada dibuang.
  const d = drafDari(SOAL);
  d.steps[1]!.benar = ['o2', 'hantu', 'o1'];
  assert.deepEqual(soalDariDraf(d).steps[1]!.benar, ['o1', 'o2']);
});
