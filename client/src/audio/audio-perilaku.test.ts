/**
 * TES PERILAKU pengelola audio bersama (audio.ts) dengan elemen musik tiruan (tanpa browser, tanpa bunyi).
 * "Terdengar" = elemen tidak di-pause dan volume > 0,005. Menguji prioritas preferensi, mute/stop selama crossfade,
 * play() yang selesai terlambat, dan bahwa mode lain (paksa musik, pemilik musik) tidak berubah.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------- lingkungan tiruan (sebelum audio.ts dimuat)
const simpan = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = { getItem: (k: string) => simpan.get(k) ?? null, setItem: (k: string, v: string) => void simpan.set(k, v), removeItem: (k: string) => void simpan.delete(k) };
const doc = { hidden: false, l: [] as (() => void)[], addEventListener(_: string, f: () => void) { this.l.push(f); } };
g.document = doc;
g.window = { setInterval, clearInterval, setTimeout, clearTimeout };
const semua: FakeAudio[] = [];
let tundaPlay = 0;
class FakeAudio {
  src: string; loop = false; preload = ''; volume = 1; paused = true; currentTime = 0;
  constructor(src: string) { this.src = src; semua.push(this); }
  play(): Promise<void> { const d = tundaPlay; return new Promise((r) => setTimeout(() => { this.paused = false; r(); }, d)); }
  pause() { this.paused = true; }
  addEventListener() { /* tidak dipakai */ }
}
g.Audio = FakeAudio;

const A = await import('./audio');
const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nama = (e: FakeAudio) => e.src.split('/').pop()!.replace('.mp3', '');
const terdengar = () => semua.filter((e) => !e.paused && e.volume > 0.005).map(nama).sort();
async function bersih() {
  A.setTrack(null); A.forceMusic(false); A.setModeCerita(false);
  await tidur(450);
  for (const e of semua) { e.pause(); e.volume = 0; }
}

A.initAudio(); // interaksi pengguna (AudioContext tidak ada di Node: SFX senyap, musik tetap diuji)

test('prioritas: musikCerita=false menang walau musicEnabled=true (preferensi mode lain tidak menyalakan musik cerita)', async () => {
  A.setMuted(false); A.setMusicEnabled(true); A.setMusikCerita(false);
  A.setModeCerita(true); A.setTrack('cerita-kantor');
  await tidur(200);
  assert.deepEqual(terdengar(), []);
  A.setMusikCerita(true);
  await tidur(250);
  assert.deepEqual(terdengar(), ['cerita-kantor']);
  await bersih();
});

test('prioritas: pengaturan cerita tidak mengubah preferensi musik mode lain', async () => {
  A.setMusicEnabled(false);
  A.setMusikCerita(false);
  assert.equal(A.getAudioPrefs().musicEnabled, false);
  A.setMusikCerita(true);
  assert.equal(A.getAudioPrefs().musicEnabled, false);
  A.setModeCerita(false); A.setTrack('cerita-kantor');
  await tidur(200);
  assert.deepEqual(terdengar(), [], 'trek cerita tidak berbunyi di luar halaman cerita');
  await bersih();
});

test('master mute menang atas segalanya, dan membisukan SEGERA (termasuk trek yang sedang memudar)', async () => {
  A.setMuted(false); A.setMusikCerita(true); A.setModeCerita(true);
  A.setTrack('cerita-kantor'); await tidur(1900);
  A.setTrack('cerita-periksa'); await tidur(300); // tengah crossfade: dua trek
  assert.ok(terdengar().length >= 1);
  A.setMuted(true);
  await tidur(30);
  assert.deepEqual(terdengar(), [], 'tidak ada trek yang masih terdengar sesudah mute');
  A.setMuted(false);
  await tidur(1900);
  assert.deepEqual(terdengar(), ['cerita-periksa'], 'unmute: hanya trek tujuan');
  await bersih();
});

test('A -> B -> C cepat: paling banyak dua trek selama transisi, lalu hanya C', async () => {
  A.setMuted(false); A.setModeCerita(true);
  A.setTrack('cerita-kantor'); await tidur(1800);
  A.setTrack('cerita-periksa'); await tidur(150);
  A.setTrack('cerita-penutup');
  let maks = 0;
  for (let i = 0; i < 25; i++) { await tidur(80); maks = Math.max(maks, terdengar().length); }
  assert.ok(maks <= 2, `trek bersamaan maks ${maks}`);
  await tidur(300);
  assert.deepEqual(terdengar(), ['cerita-penutup']);
  await bersih();
});

test('mute -> unmute cepat berulang: berakhir satu trek, tidak menumpuk', async () => {
  A.setModeCerita(true); A.setTrack('cerita-kantor'); await tidur(300);
  for (let i = 0; i < 6; i++) { A.setMuted(true); await tidur(15); A.setMuted(false); await tidur(15); }
  await tidur(1900);
  assert.deepEqual(terdengar(), ['cerita-kantor']);
  await bersih();
});

test('pindah tema lalu keluar halaman / tab tersembunyi: semua berhenti, tidak ada sisa crossfade', async () => {
  A.setModeCerita(true); A.setTrack('cerita-kantor'); await tidur(1800);
  A.setTrack('cerita-periksa'); await tidur(200);
  A.setTrack(null); A.setModeCerita(false);
  await tidur(400);
  assert.deepEqual(terdengar(), [], 'keluar halaman');
  A.setModeCerita(true); A.setTrack('cerita-kantor'); await tidur(1800);
  A.setTrack('cerita-periksa'); await tidur(200);
  doc.hidden = true; doc.l.forEach((f) => f());
  await tidur(30);
  assert.deepEqual(terdengar(), [], 'tab tersembunyi');
  doc.hidden = false; doc.l.forEach((f) => f());
  await tidur(1900);
  assert.deepEqual(terdengar(), ['cerita-periksa']);
  await bersih();
});

test('play() yang selesai TERLAMBAT sesudah keluar/mute tidak menghidupkan trek lama', async () => {
  tundaPlay = 300;
  A.setModeCerita(true); A.setTrack('cerita-penutup');
  await tidur(50);
  A.setTrack(null); A.setModeCerita(false);
  await tidur(700);
  assert.deepEqual(terdengar(), [], 'keluar sebelum play() selesai');
  A.setModeCerita(true); A.setTrack('cerita-penutup');
  await tidur(50);
  A.setMuted(true);
  await tidur(700);
  assert.deepEqual(terdengar(), [], 'mute sebelum play() selesai');
  tundaPlay = 0;
  A.setMuted(false);
  await bersih();
});

test('mode lain tidak berubah: paksa musik (solo) & preferensi musik acara tetap berbunyi; pemilik musik tetap berlaku', async () => {
  A.setMusikCerita(false); // dimatikan di Episode 2 tidak boleh membisukan mode lain
  A.forceMusic(true); A.setTrack('game');
  await tidur(700);
  assert.deepEqual(terdengar(), ['gameplay']);
  await bersih();
  A.claimMusicOwner('host');
  A.setMusicEnabled(true);
  A.setTrack('lobby', 'host'); await tidur(700);
  A.setTrack('podium', 'pemain'); // bukan pemilik: diabaikan
  await tidur(300);
  assert.deepEqual(terdengar(), ['lobby']);
  A.releaseMusicOwner('host');
  A.setMusikCerita(true);
  await bersih();
});
