#!/usr/bin/env node
/**
 * Pemeriksaan MP3 HASIL ENCODE musik cerita (bukan buffer sebelum encode): dekode penuh dengan ffmpeg, lalu ukur durasi, peak,
 * clipping, level awal/akhir, keheningan di kepala/ekor (penyebab jeda saat <audio loop>), dan loncatan di titik sambungan.
 *   node tools/cek-mp3-ep2.mjs        (butuh ffmpeg di PATH; tanpa ffmpeg: keluar dengan pesan jelas)
 * Catatan: ini membuktikan berkas bisa didekode & ukuran sinyalnya, BUKAN bahwa musiknya enak atau loop-nya terdengar mulus.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'public', 'audio');
const SR = 44100;
const BERKAS = ['cerita-kantor.mp3', 'cerita-periksa.mp3', 'cerita-penutup.mp3'];
const ver = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ver.status !== 0) { console.error('ffmpeg tidak tersedia: pemeriksaan dekode tidak bisa dijalankan.'); process.exit(2); }

const db = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));
const rms = (a, i, j) => { let s = 0; for (let k = i; k < j; k++) s += a[k] * a[k]; return Math.sqrt(s / Math.max(1, j - i)); };
let gagal = 0;
for (const f of BERKAS) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', path.join(DIR, f), '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0 || !r.stdout?.length) { console.log(`GAGAL ${f}: tidak bisa didekode (${String(r.stderr).trim()})`); gagal++; continue; }
  if (String(r.stderr).trim()) console.log(`  peringatan dekoder ${f}: ${String(r.stderr).trim().slice(0, 200)}`);
  const a = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 4));
  let peak = 0; let clip = 0;
  for (const v of a) { const x = Math.abs(v); if (x > peak) peak = x; if (x >= 0.999) clip++; }
  const ambang = 1e-3;
  let kepala = 0; while (kepala < a.length && Math.abs(a[kepala]) < ambang) kepala++;
  let ekor = 0; while (ekor < a.length && Math.abs(a[a.length - 1 - ekor]) < ambang) ekor++;
  const detik = SR;
  const awal = db(rms(a, kepala, kepala + detik));
  const akhir = db(rms(a, a.length - ekor - detik, a.length - ekor));
  const loncat = Math.abs(a[a.length - 1 - ekor] - a[kepala]);
  const jedaMs = ((kepala + ekor) / SR) * 1000;
  const ok = clip === 0 && peak < 0.99 && Math.abs(awal - akhir) < 6 && jedaMs < 120;
  if (!ok) gagal++;
  console.log(`${ok ? 'OK   ' : 'GAGAL'} ${f}: didekode ${(a.length / SR).toFixed(2)} s | peak ${db(peak).toFixed(1)} dBFS | clipping ${clip} sampel | RMS 1 s awal ${awal.toFixed(1)} / akhir ${akhir.toFixed(1)} dBFS | hening kepala ${(kepala / SR * 1000).toFixed(0)} ms + ekor ${(ekor / SR * 1000).toFixed(0)} ms = calon jeda loop ${jedaMs.toFixed(0)} ms | loncatan sambungan ${loncat.toFixed(4)}`);
}
process.exit(gagal ? 1 : 0);
