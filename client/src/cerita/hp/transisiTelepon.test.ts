/** T-021: daftar titik serah Episode 2 (hanya dua, keputusan Lead D-169 / D-170), durasi dan ukuran seni adegan telepon. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EPISODE_AUTO_2 as EP } from '../episode/auto-2/episode';

// transisiTelepon.tsx mengimpor PNG dan CSS (hanya lewat bundler), jadi angka yang diuji di sini dibaca dari sumbernya.
const SUMBER = fs.readFileSync(path.join(import.meta.dirname, 'transisiTelepon.tsx'), 'utf8');
const SENI = path.join(import.meta.dirname, '..', 'seni', 'piksel', 'telepon');
const ukuran = (n: string) => { const b = fs.readFileSync(path.join(SENI, n)); return [b.readUInt32BE(16), b.readUInt32BE(20), b.length]; };

test('titik serah Episode 2: maju hanya buka -> k01; balik hanya dari K15 ke tiga akhir; tokohnya Miss Raksa', () => {
  const s = EP.serahTelepon!;
  assert.equal(s.tokoh, 'missRaksa');
  assert.deepEqual(s.maju, [['buka', 'k01']]);
  assert.deepEqual(s.balik.ke, ['akhir-puas', 'akhir-catatan', 'akhir-kurang']);
  for (const n of [...s.maju.flat(), ...s.balik.dari, ...s.balik.ke]) assert.ok(EP.node[n], 'node ada: ' + n);
  for (const n of s.balik.dari) assert.match(n, /^k15/);
});

test('durasi sesuai brief (maju 1.000, balik 700, pendek 300 md) dan sasaran zoom = layar POV 78 x 154 di (144, 32)', () => {
  assert.ok(SUMBER.includes('DURASI = { maju: 1000, balik: 700, pendek: 300 }'));
  assert.ok(SUMBER.includes('layar: { x: 144, y: 32, w: 78, h: 154 }'));
});

test('seni telepon (telepon-v2): POV 366 x 229, dua sel lengan 56 x 39, punggung 9 x 15, gelembung 18 x 16; total 4.317 byte', () => {
  const pov = ukuran('pov-366x229.png'), lengan = ukuran('lengan-dua.png'), punggung = ukuran('punggung-telepon.png'), gelembung = ukuran('gelembung-notif.png');
  assert.deepEqual(pov.slice(0, 2), [366, 229]);
  assert.deepEqual(lengan.slice(0, 2), [112, 39]);
  assert.deepEqual(punggung.slice(0, 2), [9, 15]);
  assert.deepEqual(gelembung.slice(0, 2), [18, 16]);
  assert.equal(pov[2]! + lengan[2]! + punggung[2]! + gelembung[2]!, 4317);
  assert.deepEqual(fs.readdirSync(SENI).sort(), ['gelembung-notif.png', 'lengan-dua.png', 'pov-366x229.png', 'punggung-telepon.png']);
});
