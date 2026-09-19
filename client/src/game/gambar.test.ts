/**
 * Penjaga jalur "adegan gambar": pemilih visual (gambar / adegan / bingkai netral), padanan status
 * yang dilaporkan ke host, dan pembaca angka ketikan untuk soal kustom.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../../shared/missions';
import type { MissionPublic } from '../../../shared/types';
import { STATUS_ADEGAN, bacaAngka, misiBergambar, visualMisi } from './gambar';

const kustom = (image: MissionPublic['image']): Pick<MissionPublic, 'scene' | 'image' | 'title'> => ({
  scene: 'gambar',
  title: 'Gudang Pak Darto',
  image,
});

test('misi bawaan (tutorial, m01-m10, penentuan) tetap memakai adegan 2D', () => {
  for (const m of [TUTORIAL_MISSION, ...MISSIONS, TIEBREAK_MISSION]) {
    assert.deepEqual(visualMisi(m), { jenis: 'adegan' }, m.id);
    assert.equal(misiBergambar(m), false, m.id);
  }
});

test('soal kustom dengan gambar: gambar + alt dari data', () => {
  const v = visualMisi(kustom({ src: '/gambar-soal/abc123.webp', alt: 'Denah gudang yang tergenang' }));
  assert.deepEqual(v, { jenis: 'gambar', src: '/gambar-soal/abc123.webp', alt: 'Denah gudang yang tergenang' });
  assert.equal(misiBergambar(kustom({ src: '/gambar-soal/abc123.webp', alt: 'x' })), true);
});

test('alt kosong jatuh ke judul misi (gambar tidak pernah bisu)', () => {
  const v = visualMisi(kustom({ src: '/gambar-soal/abc123.png', alt: '   ' }));
  assert.equal(v.jenis === 'gambar' && v.alt, 'Gudang Pak Darto');
});

test('gambar menang atas adegan: image terisi walau scene adegan vektor', () => {
  const m = { ...MISSIONS[0]!, image: { src: '/gambar-soal/x.jpg', alt: 'Parkiran' } };
  assert.equal(visualMisi(m).jenis, 'gambar');
});

test('tanpa gambar: scene "gambar" = bingkai netral (tanpa engine), scene vektor = adegan', () => {
  assert.deepEqual(visualMisi(kustom(null)), { jenis: 'netral' });
  assert.deepEqual(visualMisi(kustom(undefined)), { jenis: 'netral' });
  assert.deepEqual(visualMisi(kustom({ src: '  ', alt: 'kosong' })), { jenis: 'netral' });
  assert.equal(misiBergambar(kustom(null)), true);
  assert.deepEqual(visualMisi({ ...MISSIONS[0]!, image: null }), { jenis: 'adegan' });
});

test('data gambar yang rusak tidak melempar galat', () => {
  const rusak = { src: 42, alt: null } as unknown as MissionPublic['image'];
  assert.deepEqual(visualMisi(kustom(rusak)), { jenis: 'netral' });
});

test('status ke host: hanya "memuat" yang berarti belum siap (gagal muat tetap dilaporkan selesai)', () => {
  assert.equal(STATUS_ADEGAN.memuat, 'loading');
  for (const s of ['siap', 'gagal', 'netral'] as const) assert.notEqual(STATUS_ADEGAN[s], 'loading', s);
});

test('bacaAngka bawaan: hanya digit, persis perilaku lama', () => {
  assert.equal(bacaAngka('Rp 1.500.000'), 1_500_000);
  assert.equal(bacaAngka('2,5'), 25);
  assert.equal(bacaAngka('-3'), 3);
  assert.equal(bacaAngka('abc'), null);
  assert.equal(bacaAngka(''), null);
});

test('bacaAngka bebas (soal kustom): koma desimal, titik ribuan, negatif', () => {
  assert.equal(bacaAngka('12,5', true), 12.5);
  assert.equal(bacaAngka('2.5', true), 2.5);
  assert.equal(bacaAngka('1.500', true), 1500);
  assert.equal(bacaAngka('1.500.000', true), 1_500_000);
  assert.equal(bacaAngka('1.500,75', true), 1500.75);
  assert.equal(bacaAngka('-3', true), -3);
  assert.equal(bacaAngka('−0,5', true), -0.5);
  assert.equal(bacaAngka(' 40 cm ', true), 40);
  // Sedang mengetik: tanda baca di ujung belum mengubah nilai.
  assert.equal(bacaAngka('12,', true), 12);
  assert.equal(bacaAngka('12.', true), 12);
  assert.equal(bacaAngka(',5', true), 0.5);
  assert.equal(bacaAngka('-', true), null);
  assert.equal(bacaAngka(',', true), null);
  assert.equal(Object.is(bacaAngka('-0', true), 0), true);
  assert.equal(bacaAngka('9'.repeat(400), true), null);
});
