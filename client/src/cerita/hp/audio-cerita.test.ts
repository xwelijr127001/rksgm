/**
 * Audio mode cerita Episode 2: pemetaan tema musik per bagian & suasana per lokasi (murni), berkas musik ada & sah, dan setiap
 * node episode mendapat tema (tidak ada node tanpa keputusan musik). Pemutaran sebenarnya diuji di peramban (alat uji-audio).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EPISODE_AUTO_2 as EP } from '../episode/auto-2/episode';
import { suasanaUntuk, temaUntuk } from './audioTema';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public/audio');

test('tema musik: kantor (b1, b4), pemeriksaan (b2, b3), penutup (K15 & akhir)', () => {
  assert.equal(temaUntuk('b1', 'k01', false), 'cerita-kantor');
  assert.equal(temaUntuk('b2', 'k04', false), 'cerita-periksa');
  assert.equal(temaUntuk('b3', 'k08', false), 'cerita-periksa');
  assert.equal(temaUntuk('b4', 'k12', false), 'cerita-kantor');
  assert.equal(temaUntuk('b4', 'k15', false), 'cerita-penutup');
  assert.equal(temaUntuk('b4', 'k15-a', false), 'cerita-penutup');
  assert.equal(temaUntuk('b4', 'k14', true), 'cerita-penutup');
});

test('tema tidak berganti di dalam satu bagian (tidak diulang dari awal tiap pesan)', () => {
  const nodeB3 = Object.values(EP.node).filter((n) => n.bab === 'b3').map((n) => n.id);
  assert.ok(nodeB3.length > 5);
  assert.equal(new Set(nodeB3.map((id) => temaUntuk('b3', id, false))).size, 1);
});

test('suasana: tol = jalan, pool/bengkel = bengkel, kantor & obrolan tanpa suasana', () => {
  assert.equal(suasanaUntuk('tol', false), 'jalan');
  assert.equal(suasanaUntuk('pool', false), 'bengkel');
  assert.equal(suasanaUntuk('bengkel', false), 'bengkel');
  assert.equal(suasanaUntuk('kantor', false), null);
  assert.equal(suasanaUntuk('wawancara', false), null);
  assert.equal(suasanaUntuk('tol', true), null);
});

test('berkas musik cerita ada, MP3 sah, dan ukurannya wajar untuk HP (< 1,6 MB per trek)', () => {
  for (const f of ['cerita-kantor.mp3', 'cerita-periksa.mp3', 'cerita-penutup.mp3']) {
    const p = path.join(AKAR, f);
    assert.ok(fs.existsSync(p), f);
    const b = fs.readFileSync(p);
    assert.equal(b[0], 0xff, `${f} bukan bitstream MP3`);
    assert.ok(b.length > 200_000 && b.length < 1_600_000, `${f} ${b.length} byte`);
  }
});
