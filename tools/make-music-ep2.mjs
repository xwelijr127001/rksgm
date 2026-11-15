#!/usr/bin/env node
/**
 * Musik latar MODE CERITA Episode 2 RAKSA GAME - 100% disintesis di sini (tanpa sampel, loop, atau rekaman pihak ketiga).
 *
 * Jalankan:  node tools/make-music-ep2.mjs
 * Keluaran:  client/public/audio/cerita-{kantor,periksa,penutup}.mp3  (lagu lama lobby/gameplay/podium TIDAK disentuh)
 *
 * Arah: hangat, tenang, penasaran secara halus, profesional tetapi tidak kaku; tanpa vokal, tanpa perkusi tajam, tanpa
 * melodi pendek yang menonjol, nyaman diulang saat membaca. Instrumen: piano elektrik FM lembut, pad sinus berlapis
 * (serangan lambat), bass sinus, petikan Karplus-Strong redup (hanya tema pemeriksaan). Reverb ringan, lowpass hangat.
 * Loop mulus: panjang = kelipatan bar, ekor reverb di-"wrap" ke kepala. Deterministik (PRNG ber-seed).
 * Pemeriksaan otomatis: durasi, peak, kelipatan bar, sambungan loop, dan tidak ada lonjakan level antar-bagian.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '..', 'client', 'public', 'audio');
const SR = 44100;
const KBPS = 96;

let seed = 20261115;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const hum = () => (rnd() - 0.5) * 0.012;
const jit = (a) => a * (0.92 + rnd() * 0.16);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function fail(msg) { throw new Error(`make-music-ep2: ${msg}`); }

// ------------------------------------------------------------------ instrumen

/** Piano elektrik lembut: FM 1:1, indeks modulasi meluruh (serangan hangat, bukan bel tajam). */
function epiano(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round((dur + 0.6) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = Math.round(0.006 * SR);
  const relMulai = Math.round(dur * SR);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const idx = 0.25 + 0.95 * Math.exp(-3.2 * s);
    const mod = Math.sin(2 * Math.PI * f * s) * idx;
    let v = Math.sin(2 * Math.PI * f * s + mod) + 0.12 * Math.sin(4 * Math.PI * f * s);
    let env = i < atk ? i / atk : 1;
    env *= Math.exp(-1.15 * s);
    if (i > relMulai) env *= Math.max(0, 1 - (i - relMulai) / (0.6 * SR));
    buf[i0 + i] += v * amp * env;
  }
}

/** Pad: tiga sinus sedikit di-detune + oktaf bawah halus, serangan & lepas lambat. */
function pad(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round((dur + 1.2) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = 0.9 * SR;
  const relMulai = dur * SR;
  const ph = [rnd(), rnd(), rnd()].map((x) => x * Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const v = Math.sin(2 * Math.PI * f * 0.9965 * s + ph[0]) + Math.sin(2 * Math.PI * f * 1.0035 * s + ph[1]) + 0.8 * Math.sin(2 * Math.PI * f * s + ph[2]) + 0.25 * Math.sin(Math.PI * f * s);
    let env = Math.min(1, i / atk);
    if (i > relMulai) env *= Math.max(0, 1 - (i - relMulai) / (1.2 * SR));
    buf[i0 + i] += (v / 3) * amp * env;
  }
}

/** Bass sinus bulat. */
function bass(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = Math.round(0.03 * SR);
  const rel = Math.min(n, Math.round(0.25 * SR));
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const v = Math.sin(2 * Math.PI * f * s) + 0.08 * Math.sin(4 * Math.PI * f * s);
    let env = i < atk ? i / atk : 1;
    if (n - i < rel) env *= (n - i) / rel;
    env *= 0.55 + 0.45 * Math.exp(-0.8 * s);
    buf[i0 + i] += v * amp * env;
  }
}

/** Petikan redup (Karplus-Strong, terang rendah) untuk denyut "penasaran" yang lembut. */
function pluck(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const N = Math.max(2, Math.round(SR / f));
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const d = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) { lp += 0.3 * (rnd() * 2 - 1 - lp); d[i] = lp; }
  let mean = 0; for (let i = 0; i < N; i++) mean += d[i]; mean /= N;
  let norm = 0; for (let i = 0; i < N; i++) { d[i] -= mean; norm = Math.max(norm, Math.abs(d[i])); }
  if (norm > 0) for (let i = 0; i < N; i++) d[i] /= norm;
  const damp = Math.min(0.99995, Math.exp(Math.log(0.002) / (dur * SR)));
  const rel = Math.min(n, 900);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const cur = d[idx];
    d[idx] = 0.5 * (cur + d[(idx + 1) % N]) * damp;
    idx = (idx + 1) % N;
    let env = i < 80 ? i / 80 : 1;
    if (n - i < rel) env *= (n - i) / rel;
    buf[i0 + i] += cur * amp * env;
  }
}

// -------------------------------------------------------------------- olahan

function reverb(buf, wet = 0.24, room = 0.86, damp = 0.4) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491];
  const aps = [556, 441, 341, 225];
  const wetBuf = new Float32Array(buf.length);
  for (const N of combs) {
    const d = new Float32Array(N); let filt = 0; let idx = 0;
    for (let i = 0; i < buf.length; i++) {
      const y = d[idx]; wetBuf[i] += y; filt = y * (1 - damp) + filt * damp; d[idx] = buf[i] + filt * room; idx = idx + 1 === N ? 0 : idx + 1;
    }
  }
  for (let i = 0; i < wetBuf.length; i++) wetBuf[i] /= combs.length;
  for (const N of aps) {
    const d = new Float32Array(N); let idx = 0;
    for (let i = 0; i < wetBuf.length; i++) { const y = d[idx]; const x = wetBuf[i]; d[idx] = x + y * 0.5; wetBuf[i] = y - x; idx = idx + 1 === N ? 0 : idx + 1; }
  }
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - wet) + wetBuf[i] * wet;
}
/** Lowpass satu pole ~5 kHz: hangat, tidak menusuk di speaker HP. */
function warm(buf, k = 0.5) { let lp = 0; for (let i = 0; i < buf.length; i++) { lp += k * (buf[i] - lp); buf[i] = lp; } }
const peakOf = (b) => { let p = 0; for (let i = 0; i < b.length; i++) p = Math.max(p, Math.abs(b[i])); return p; };
const rmsOf = (b, a = 0, z = b.length) => { let s = 0; for (let i = a; i < z; i++) s += b[i] * b[i]; return Math.sqrt(s / Math.max(1, z - a)); };
const db = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));
function normalize(buf, target) { const p = peakOf(buf); if (p <= 0) fail('senyap'); const g = target / p; for (let i = 0; i < buf.length; i++) buf[i] *= g; }

// ------------------------------------------------------------------- akor (MIDI, tanpa kluster semiton)

const C = {
  F: { v: [53, 57, 60, 67], b: 41 }, Dm: { v: [50, 53, 57, 64], b: 38 }, Bb: { v: [50, 53, 58, 65], b: 46 }, Cc: { v: [52, 55, 60, 67], b: 36 },
  Am: { v: [52, 57, 60, 64], b: 45 }, Gm: { v: [50, 55, 58, 65], b: 43 },
  Dm9: { v: [50, 53, 57, 64], b: 38 }, Em7: { v: [52, 55, 59, 62], b: 40 }, Fmaj7: { v: [53, 57, 60, 64], b: 41 }, G6: { v: [50, 55, 59, 64], b: 43 },
  Am7: { v: [52, 55, 57, 60], b: 45 }, Em: { v: [52, 55, 59, 64], b: 40 }, G: { v: [50, 55, 59, 62], b: 43 },
};

/**
 * Melodi jarang & tenang: paling banyak dua nada per bar dari nada akor satu oktaf di atas, langkah kecil (tidak melompat),
 * sering diam. Bukan "hook" yang menonjol.
 */
function motif(list, t0, beat, ch, layer, lalu) {
  if (layer === 0) return lalu;
  const nada = ch.v.map((m) => m + 12).filter((m) => m >= 64 && m <= 79);
  const dekat = (x) => nada.reduce((a, m) => (Math.abs(m - x) < Math.abs(a - x) ? m : a), nada[0]);
  let m = dekat(lalu + (rnd() < 0.5 ? 2 : -2));
  list.push(['ep', t0 + beat * 1 + hum(), m, beat * 2.4, jit(0.11)]);
  if (layer >= 2 && rnd() < 0.55) {
    m = dekat(m + (rnd() < 0.5 ? 3 : -3));
    list.push(['ep', t0 + beat * 3 + hum(), m, beat * 1.6, jit(0.085)]);
  }
  return m;
}

function barKantor(list, x) {
  const { t0, beat, ch, layer } = x;
  list.push(['bs', t0, ch.b, beat * 3.6, 0.2]);
  ch.v.forEach((m, k) => list.push(['ep', t0 + k * 0.012 + hum(), m, beat * 2.6, jit(0.085)]));
  list.push(['ep', t0 + beat * 2.5 + hum(), ch.v[2], beat * 1.3, jit(0.05)]);
  list.push(['ep', t0 + beat * 2.5 + 0.015, ch.v[3], beat * 1.3, jit(0.045)]);
  if (layer >= 1) ch.v.slice(1).forEach((m) => list.push(['pd', t0, m, beat * 4, 0.05]));
  x.lalu = motif(list, t0, beat, ch, layer, x.lalu);
}

function barPeriksa(list, x) {
  const { t0, beat, ch, layer } = x;
  list.push(['bs', t0, ch.b, beat * 1.8, 0.19]);
  list.push(['bs', t0 + beat * 2, ch.b + (layer >= 2 ? 7 : 0), beat * 1.7, 0.14]);
  // Denyut 1/8 redup dari nada akor: rasa ingin tahu yang ringan, bukan ketegangan.
  const ARP = [1, 2, 3, 2, 1, 2, 3, 2];
  for (let i = 0; i < 8; i++) {
    if (layer === 0 && i % 2 === 1) continue;
    list.push(['pk', t0 + (i * beat) / 2 + hum(), ch.v[ARP[i]], beat * 0.9, jit(i % 4 === 0 ? 0.075 : 0.05)]);
  }
  ch.v.forEach((m) => list.push(['pd', t0, m, beat * 4, layer >= 1 ? 0.045 : 0.03]));
  if (layer >= 1) x.lalu = motif(list, t0, beat, ch, layer, x.lalu);
}

function barPenutup(list, x) {
  const { t0, beat, ch, layer } = x;
  list.push(['bs', t0, ch.b, beat * 3.9, 0.17]);
  ch.v.forEach((m) => list.push(['pd', t0, m, beat * 4, 0.055]));
  // Arpeggio pelan seperempat, makin jarang di akhir: rasa "selesai" yang tenang.
  const urut = [0, 1, 2, 3];
  for (let k = 0; k < 4; k++) {
    if (layer === 0 && k % 2 === 1) continue;
    list.push(['ep', t0 + k * beat + hum(), ch.v[urut[k]] + 12, beat * 1.8, jit(k === 0 ? 0.08 : 0.06)]);
  }
  if (layer >= 2) x.lalu = motif(list, t0, beat, ch, 1, x.lalu);
}

const SONGS = [
  {
    file: 'cerita-kantor.mp3', judul: 'Meja Layanan (kantor & percakapan)', bpm: 80, puncak: 0.62, tail: 4.5, durasi: [80, 110], bar: barKantor,
    order: [['A', 0], ['A', 1], ['B', 2], ['A', 1]],
    prog: { A: ['F', 'Am', 'Bb', 'F', 'Dm', 'Gm', 'Bb', 'Cc'], B: ['Bb', 'Cc', 'Am', 'Dm', 'Gm', 'Cc', 'F', 'Cc'] },
  },
  {
    file: 'cerita-periksa.mp3', judul: 'Catatan Lapangan (pemeriksaan)', bpm: 84, puncak: 0.6, tail: 4.5, durasi: [80, 110], bar: barPeriksa,
    order: [['A', 0], ['A', 1], ['B', 2], ['A', 1]],
    prog: { A: ['Dm9', 'Em7', 'Fmaj7', 'Em7', 'Dm9', 'G6', 'Am7', 'G6'], B: ['Fmaj7', 'G6', 'Em7', 'Am7', 'Fmaj7', 'G6', 'Am7', 'G6'] },
  },
  {
    file: 'cerita-penutup.mp3', judul: 'Berkas Ditutup (penutup)', bpm: 70, puncak: 0.58, tail: 5.0, durasi: [70, 120], bar: barPenutup,
    order: [['A', 0], ['A', 1], ['B', 2], ['A', 1]],
    prog: { A: ['Cc', 'Am', 'F', 'Cc', 'F', 'G', 'Cc', 'Cc'], B: ['Am', 'Em', 'F', 'Cc', 'Dm', 'G', 'Cc', 'Cc'] },
  },
];

function render(song) {
  seed = 20261115;
  const barSamples = Math.round((4 * 60 * SR) / song.bpm);
  const barDur = barSamples / SR;
  const beat = barDur / 4;
  const total = song.order.reduce((n, [p]) => n + song.prog[p].length, 0);
  const bodyLen = total * barSamples;
  const tailLen = Math.round(song.tail * SR);
  const buf = new Float32Array(bodyLen + tailLen);
  const list = [];
  const x = { lalu: 72 };
  let bar = 0;
  for (const [p, layer] of song.order) {
    for (const nama of song.prog[p]) {
      const ch = C[nama];
      if (!ch) fail(`akor ${nama}`);
      Object.assign(x, { t0: bar * barDur, beat, ch, layer, bar });
      song.bar(list, x);
      bar++;
    }
  }
  for (const [v, t, m, d, a] of list) {
    if (t < -0.001 || t >= bodyLen / SR) continue;
    if (v === 'ep') epiano(buf, Math.max(0, t), m, d, a);
    else if (v === 'pd') pad(buf, t, m, d, a);
    else if (v === 'bs') bass(buf, t, m, d, a);
    else if (v === 'pk') pluck(buf, Math.max(0, t), m, d, a);
  }
  warm(buf);
  reverb(buf);
  for (let i = 0; i < tailLen; i++) buf[i] += buf[bodyLen + i];
  const out = buf.slice(0, bodyLen);
  normalize(out, song.puncak);
  return { out, total, barDur, barSamples };
}

function loadLame() {
  const require = createRequire(import.meta.url);
  const dir = path.dirname(require.resolve('lamejs/package.json'));
  const src = fs.readFileSync(path.join(dir, 'lame.min.js'), 'utf8');
  const lib = new Function(`${src}\nreturn lamejs;`)();
  if (typeof lib?.Mp3Encoder !== 'function') fail('lamejs Mp3Encoder tidak ada');
  return lib;
}
function encodeMp3(lame, samples) {
  const enc = new lame.Mp3Encoder(1, SR, KBPS);
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) { const v = Math.max(-1, Math.min(1, samples[i])); pcm[i] = Math.round(v < 0 ? v * 0x8000 : v * 0x7fff); }
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) { const c = enc.encodeBuffer(pcm.subarray(i, Math.min(i + 1152, pcm.length))); if (c.length) parts.push(Buffer.from(c)); }
  const last = enc.flush(); if (last.length) parts.push(Buffer.from(last));
  return Buffer.concat(parts);
}

const lame = loadLame();
for (const song of SONGS) {
  const { out, total, barDur, barSamples } = render(song);
  const dur = out.length / SR;
  const peak = peakOf(out);
  const rms = rmsOf(out);
  if (dur < song.durasi[0] || dur > song.durasi[1]) fail(`${song.file} durasi ${dur.toFixed(1)} s`);
  if (peak > 0.99) fail(`${song.file} peak ${peak}`);
  if (out.length !== total * barSamples) fail(`${song.file} bukan kelipatan bar`);
  const seam = Math.abs(out[0] - out[out.length - 1]);
  if (seam > 0.06) fail(`${song.file} sambungan loop kasar (${seam.toFixed(4)})`);
  // Tidak ada perubahan volume mendadak: RMS tiap 4 bar tidak berbeda > 6 dB dari median.
  const blok = [];
  for (let b = 0; b < total; b += 4) blok.push(rmsOf(out, b * barSamples, Math.min(out.length, (b + 4) * barSamples)));
  const med = [...blok].sort((a, c) => a - c)[Math.floor(blok.length / 2)];
  const lonjak = Math.max(...blok.map((r) => Math.abs(db(r) - db(med))));
  if (lonjak > 6) fail(`${song.file} lonjakan level ${lonjak.toFixed(1)} dB antar-bagian`);
  const data = encodeMp3(lame, out);
  if (data[0] !== 0xff) fail(`${song.file} bukan MP3 sah`);
  fs.writeFileSync(path.join(OUT_DIR, song.file), data);
  console.log(`${song.file} "${song.judul}" ${dur.toFixed(1)} s | ${song.bpm} BPM | ${total} bar | ${(data.length / 1024).toFixed(0)} KB | peak ${db(peak).toFixed(1)} dBFS | RMS ${db(rms).toFixed(1)} dBFS | sambungan ${seam.toFixed(4)} | lonjakan maks ${lonjak.toFixed(1)} dB`);
}
console.log('Selesai: semua pemeriksaan lolos.');
