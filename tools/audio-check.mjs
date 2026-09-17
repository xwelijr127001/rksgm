/**
 * Verifikasi isi musik dengan mendekode MP3 di Chrome (Web Audio API).
 *
 * PRASYARAT: npm install -D puppeteer-core, lalu server jalan di port 4000.
 *   npm run check:audio
 * Memeriksa: durasi, peak, RMS, silence, variasi antar bagian, dan kemulusan loop.
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:4000';
const br = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-proxy-server', '--no-first-run', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: null,
  protocolTimeout: 120000,
});
const p = await br.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));
await p.goto(BASE + '/', { waitUntil: 'networkidle2' });

const hasil = await p.evaluate(async () => {
  const out = [];
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  for (const nama of ['lobby', 'gameplay', 'podium']) {
    try {
      const res = await fetch(`/audio/${nama}.mp3`);
      if (!res.ok) {
        out.push({ nama, error: `HTTP ${res.status}` });
        continue;
      }
      const bytes = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(bytes.slice(0));
      const ch = buf.getChannelData(0);
      const n = ch.length;

      let peak = 0;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const a = Math.abs(ch[i]);
        if (a > peak) peak = a;
        sum += ch[i] * ch[i];
      }
      const rms = Math.sqrt(sum / n);

      // RMS per 1 detik -> untuk melihat VARIASI (bukan satu pola datar)
      const perSec = [];
      const step = buf.sampleRate;
      for (let s = 0; s + step <= n; s += step) {
        let acc = 0;
        for (let i = s; i < s + step; i++) acc += ch[i] * ch[i];
        perSec.push(Math.sqrt(acc / step));
      }
      const mean = perSec.reduce((a, b) => a + b, 0) / Math.max(1, perSec.length);
      const varians = perSec.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, perSec.length);
      const cv = mean > 0 ? Math.sqrt(varians) / mean : 0;
      const detikSenyap = perSec.filter((v) => v < 0.002).length;

      // Kemulusan loop: bandingkan 50 ms awal vs 50 ms akhir
      const w = Math.floor(buf.sampleRate * 0.05);
      let awal = 0;
      let akhir = 0;
      for (let i = 0; i < w; i++) {
        awal += ch[i] * ch[i];
        akhir += ch[n - w + i] * ch[n - w + i];
      }
      const rmsAwal = Math.sqrt(awal / w);
      const rmsAkhir = Math.sqrt(akhir / w);

      // Deteksi nada: hitung zero-crossing rate (musik bernada != noise putih)
      let zc = 0;
      const lim = Math.min(n, buf.sampleRate * 5);
      for (let i = 1; i < lim; i++) if ((ch[i - 1] < 0) !== (ch[i] < 0)) zc++;

      out.push({
        nama,
        detik: Math.round(buf.duration * 10) / 10,
        sampleRate: buf.sampleRate,
        kanal: buf.numberOfChannels,
        peakDb: Math.round(20 * Math.log10(peak || 1e-9) * 10) / 10,
        rmsDb: Math.round(20 * Math.log10(rms || 1e-9) * 10) / 10,
        variasiCv: Math.round(cv * 100) / 100,
        detikSenyap,
        totalDetikDiukur: perSec.length,
        loopAwalDb: Math.round(20 * Math.log10(rmsAwal || 1e-9) * 10) / 10,
        loopAkhirDb: Math.round(20 * Math.log10(rmsAkhir || 1e-9) * 10) / 10,
        zcrPerDetik: Math.round(zc / 5),
      });
    } catch (e) {
      out.push({ nama, error: String(e).slice(0, 120) });
    }
  }
  await ctx.close();
  return out;
});

console.log('\n=== VERIFIKASI ISI AUDIO (didekode Chrome) ===');
for (const h of hasil) {
  if (h.error) {
    console.log(`  ${h.nama.padEnd(9)} GAGAL: ${h.error}`);
    continue;
  }
  console.log(
    `  ${h.nama.padEnd(9)} ${String(h.detik).padStart(5)}s ${h.sampleRate}Hz ${h.kanal}ch | ` +
      `peak ${String(h.peakDb).padStart(6)}dB rms ${String(h.rmsDb).padStart(6)}dB | ` +
      `variasi(cv) ${h.variasiCv} | senyap ${h.detikSenyap}/${h.totalDetikDiukur}s | ` +
      `loop awal/akhir ${h.loopAwalDb}/${h.loopAkhirDb}dB | zcr ${h.zcrPerDetik}/s`,
  );
}

// Penilaian otomatis
const masalah = [];
for (const h of hasil) {
  if (h.error) { masalah.push(`${h.nama}: ${h.error}`); continue; }
  if (h.nama !== 'podium' && (h.detik < 45 || h.detik > 90)) masalah.push(`${h.nama}: durasi ${h.detik}s di luar 45-90s`);
  if (h.nama === 'podium' && (h.detik < 8 || h.detik > 16)) masalah.push(`podium: durasi ${h.detik}s di luar 8-16s`);
  if (h.peakDb > -0.5) masalah.push(`${h.nama}: peak ${h.peakDb}dB terlalu dekat clipping`);
  if (h.rmsDb > -10) masalah.push(`${h.nama}: rms ${h.rmsDb}dB terlalu keras (bisa menutupi MC)`);
  if (h.rmsDb < -30) masalah.push(`${h.nama}: rms ${h.rmsDb}dB terlalu pelan`);
  if (h.variasiCv < 0.08) masalah.push(`${h.nama}: variasi terlalu rendah (cv ${h.variasiCv}) - terdengar seperti pola diulang`);
  if (h.detikSenyap > 3) masalah.push(`${h.nama}: ada ${h.detikSenyap} detik hampir senyap`);
  if (h.zcrPerDetik > 8000) masalah.push(`${h.nama}: zcr ${h.zcrPerDetik}/s terlalu tinggi - kemungkinan noise, bukan nada`);
}
console.log('');
if (masalah.length === 0) console.log('  Semua trek lolos pemeriksaan isi.');
else for (const m of masalah) console.log('  MASALAH: ' + m);
console.log('');
await br.close();
process.exit(masalah.length ? 1 : 0);
