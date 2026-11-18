#!/usr/bin/env node
/**
 * T-036: verifikasi tanpa mendengar. (1) Trek cerita: durasi, peak, RMS, sambungan loop (didekode Chrome).
 * (2) SFX cerita baru (kertas, taruh, pesanTerima, pesanKirim): dirender ke OfflineAudioContext lewat hook ?uji-audio,
 * pada volume SFX bawaan; durasi bunyi (di atas -60 dB), peak, RMS. Resep LAMA dihitung ulang di sini untuk angka "sebelum".
 * UI_BASE (bawaan http://127.0.0.1:4003).
 */
import puppeteer from 'puppeteer-core';
const BASE = process.env.UI_BASE || 'http://127.0.0.1:4003';
const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-proxy-server', '--no-first-run'] });
const p = await br.newPage();
await p.goto(BASE + '/?uji-audio', { waitUntil: 'networkidle2' });
await p.waitForFunction(() => typeof window.__rekamSfx === 'function', { timeout: 20000 });
const hasil = await p.evaluate(async () => {
  const db = (x) => Math.round(20 * Math.log10(x || 1e-9) * 10) / 10;
  const ukur = (ch, sr) => { let pk = 0, s = 0, akhir = 0; for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > pk) pk = a; s += ch[i] * ch[i]; if (a > 0.001) akhir = i; } const n = Math.max(1, akhir); let s2 = 0; for (let i = 0; i < n; i++) s2 += ch[i] * ch[i]; return { detik: Math.round((akhir / sr) * 100) / 100, peakDb: db(pk), rmsDb: db(Math.sqrt(s2 / n)) }; };
  // Resep LAMA (sebelum T-036), disalin dari audio.ts lama, untuk angka pembanding.
  async function lama(nama) {
    const off = new OfflineAudioContext(1, 44100 * 1.2, 44100); const bus = off.createGain(); bus.gain.value = 0.6; bus.connect(off.destination);
    const N = (s) => 440 * Math.pow(2, (s - 9) / 12);
    const tone = (f, st, d, g) => { const o = off.createOscillator(); const e = off.createGain(); o.type = 'sine'; o.frequency.value = f; e.gain.setValueAtTime(0.0001, st); e.gain.exponentialRampToValueAtTime(g, st + 0.012); e.gain.exponentialRampToValueAtTime(0.0001, st + d); o.connect(e).connect(bus); o.start(st); o.stop(st + d + 0.05); };
    let r = 1; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const noise = (st, d, g, hp) => { const len = Math.floor(44100 * d); const b = off.createBuffer(1, len, 44100); const c = b.getChannelData(0); for (let i = 0; i < len; i++) c[i] = (rnd() * 2 - 1) * (1 - i / len); const s = off.createBufferSource(); s.buffer = b; const f = off.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const e = off.createGain(); e.gain.value = g; s.connect(f).connect(e).connect(bus); s.start(st); };
    const t = 0.01;
    if (nama === 'taruh') { noise(t, 0.06, 0.07, 1500); tone(N(-5), t + 0.01, 0.07, 0.1); }
    if (nama === 'kertas') { noise(t, 0.08, 0.05, 2200); noise(t + 0.05, 0.05, 0.03, 3200); }
    if (nama === 'pesanKirim') { tone(N(19), t, 0.07, 0.11); tone(N(26), t + 0.05, 0.1, 0.09); }
    if (nama === 'pesanTerima') { tone(N(21), t, 0.13, 0.09); tone(N(14), t + 0.08, 0.18, 0.08); }
    return (await off.startRendering()).getChannelData(0);
  }
  const sfx = [];
  for (const n of ['kertas', 'taruh', 'pesanTerima', 'pesanKirim']) sfx.push({ nama: n, sebelum: ukur(await lama(n), 44100), sesudah: ukur(await window.__rekamSfx(n), 44100) });
  const ctx = new AudioContext(); const trek = [];
  for (const n of ['cerita-kantor', 'cerita-periksa', 'cerita-penutup']) {
    const b = await ctx.decodeAudioData(await (await fetch(`/audio/${n}.mp3`)).arrayBuffer()); const c = b.getChannelData(0);
    let pk = 0, s = 0; for (let i = 0; i < c.length; i++) { const a = Math.abs(c[i]); if (a > pk) pk = a; s += c[i] * c[i]; }
    const w = Math.floor(b.sampleRate * 0.05); let a0 = 0, a1 = 0; for (let i = 0; i < w; i++) { a0 += c[i + 2000] ** 2; a1 += c[c.length - 1 - i] ** 2; }
    trek.push({ nama: n, detik: Math.round(b.duration * 10) / 10, peakDb: db(pk), rmsDb: db(Math.sqrt(s / c.length)), loopAwalDb: db(Math.sqrt(a0 / w)), loopAkhirDb: db(Math.sqrt(a1 / w)) });
  }
  return { sfx, trek };
});
const masalah = [];
const TARGET = { kertas: [-14, 0.25, 0.5], taruh: [-14, 0.35, 0.6], pesanTerima: [-18, 0.45, 0.8], pesanKirim: [-18, 0.03, 0.25] };
for (const s of hasil.sfx) {
  const [pk, dmin, dmax] = TARGET[s.nama];
  console.log(`${s.nama.padEnd(12)} sebelum ${s.sebelum.detik}s peak ${s.sebelum.peakDb} rms ${s.sebelum.rmsDb} | sesudah ${s.sesudah.detik}s peak ${s.sesudah.peakDb} rms ${s.sesudah.rmsDb} (target peak <= ${pk} dB, ${dmin}-${dmax} s)`);
  if (s.sesudah.peakDb > pk + 0.5) masalah.push(`${s.nama}: peak ${s.sesudah.peakDb} > ${pk}`);
  if (s.sesudah.detik < dmin || s.sesudah.detik > dmax) masalah.push(`${s.nama}: durasi ${s.sesudah.detik}s`);
}
for (const t of hasil.trek) {
  console.log(`${t.nama.padEnd(15)} ${t.detik}s peak ${t.peakDb} rms ${t.rmsDb} loop ${t.loopAwalDb}/${t.loopAkhirDb}`);
  if (t.peakDb > -1) masalah.push(`${t.nama}: peak`);
}
await br.close();
console.log(masalah.length ? 'MASALAH: ' + masalah.join('; ') : 'ALL PASS');
process.exit(masalah.length ? 1 : 0);
