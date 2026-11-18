#!/usr/bin/env node
/**
 * Musik latar MODE CERITA Episode 2 RAKSA GAME - 100% disintesis di sini (tanpa sampel, loop, atau rekaman pihak ketiga).
 *
 * Jalankan:  node tools/make-music-ep2.mjs
 * Keluaran:  client/public/audio/cerita-{kantor,periksa,penutup}.mp3  (lagu lama lobby/gameplay/podium TIDAK disentuh)
 *
 * T-036 (18 Nov 2026): diganti tema kota pedesaan yang hangat (lihat SONGS); teks di bawah = arah lama, tetap berlaku untuk suasana.
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

// T-036 (pemilik 18 Nov 06:40): tema kota pedesaan yang hangat & pelan. GAYA saja (mayor, 84-92 BPM, lead kotak/segitiga lembut,
// petikan mirip marimba, bass lembut, hat tipis); melodi ASLI, dibangkitkan di sini dari nada akor (bukan lagu mana pun).

/** Lead kotak lembut: harmonik ganjil terbatas (1,3,5,7) dengan vibrato tunda; serangan halus. */
function leadKotak(buf, t, midi, dur, amp, segitiga = false) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round((dur + 0.18) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = Math.round(0.018 * SR);
  const relMulai = Math.round(dur * SR);
  const H = segitiga ? [[1, 1], [3, -1 / 9], [5, 1 / 25], [7, -1 / 49]] : [[1, 1], [3, 0.26], [5, 0.11], [7, 0.05]];
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const vib = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.2 * s) * Math.min(1, Math.max(0, (s - 0.25) / 0.3));
    ph += (2 * Math.PI * f * vib) / SR;
    let v = 0;
    for (const [k, a] of H) v += a * Math.sin(k * ph);
    let env = i < atk ? i / atk : 1;
    env *= 0.7 + 0.3 * Math.exp(-2.5 * s);
    if (i > relMulai) env *= Math.max(0, 1 - (i - relMulai) / (0.18 * SR));
    buf[i0 + i] += v * amp * env;
  }
}

/** Petikan mirip marimba: sinus dasar + parsial 4x dan 10x yang cepat hilang. */
function marimba(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(Math.min(dur + 0.4, 1.4) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const v = Math.sin(2 * Math.PI * f * s) * Math.exp(-4.2 * s) + 0.35 * Math.sin(2 * Math.PI * f * 4 * s) * Math.exp(-14 * s) + 0.08 * Math.sin(2 * Math.PI * f * 9.8 * s) * Math.exp(-30 * s);
    const env = i < 40 ? i / 40 : 1;
    buf[i0 + i] += v * amp * env;
  }
}

/** Hat sangat tipis: noise berpita tinggi, 35 ms. */
function hat(buf, t, amp) {
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(0.035 * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  let lp = 0;
  for (let i = 0; i < n; i++) { const x = rnd() * 2 - 1; lp += 0.6 * (x - lp); buf[i0 + i] += (x - lp) * amp * Math.exp(-i / (0.009 * SR)); }
}

const K = {
  C: { v: [60, 64, 67], b: 36 }, F: { v: [60, 65, 69], b: 41 }, G: { v: [59, 62, 67], b: 43 }, Am: { v: [60, 64, 69], b: 45 },
  Dm: { v: [62, 65, 69], b: 38 }, Em: { v: [59, 64, 67], b: 40 }, G7: { v: [59, 62, 65], b: 43 }, Fm6: { v: [60, 65, 69], b: 41 },
  Bb: { v: [62, 65, 70], b: 46 }, Csus: { v: [60, 65, 67], b: 36 },
};
// Skala mayor (C) untuk langkah melodi; transposisi per lagu.
const SKALA = [0, 2, 4, 5, 7, 9, 11];
function dekatSkala(m) { const pc = ((m % 12) + 12) % 12; let best = m; let d = 99; for (const s of SKALA) for (const o of [-12, 0, 12]) { const c = m - pc + s + o; if (Math.abs(c - m) < d) { d = Math.abs(c - m); best = c; } } return best; }

/**
 * Melodi frase 4 bar: ritme dari pola (nilai ketukan), nada mengikuti akor pada ketukan kuat, langkah skala di antaranya;
 * akhir frase turun ke nada akor (rasa "pulang"). Pola dan arah dibangkitkan oleh PRNG ber-seed: asli, bukan kutipan.
 */
const RITME = [
  [1, 0.5, 0.5, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 0.5, 0.5, 1], [2, 1, 1], [1, 1, 2], [0.5, 0.5, 0.5, 0.5, 2],
];
function frase(list, x, chords, t0, beat, padat, oktaf, suara) {
  let m = x.lalu;
  for (let b = 0; b < chords.length; b++) {
    const ch = chords[b];
    const akhir = b === chords.length - 1;
    const pola = akhir ? [2, 2] : RITME[Math.floor(rnd() * (padat ? RITME.length : 3))];
    let t = t0 + b * 4 * beat;
    pola.forEach((d, k) => {
      if (akhir && k === 1) return; // istirahat di akhir frase
      const nadaAkor = ch.v.map((v) => v + oktaf);
      if (k === 0) m = nadaAkor.reduce((a, v) => (Math.abs(v - m) < Math.abs(a - m) ? v : a), nadaAkor[0]);
      else m = dekatSkala(m + (rnd() < 0.55 ? 2 : -2) * (rnd() < 0.2 ? 2 : 1));
      m = Math.max(67 + oktaf - 12, Math.min(84 + oktaf - 12, m));
      list.push([suara, t + hum(), m, d * beat * 0.92, jit(k === 0 ? 0.13 : 0.11)]);
      t += d * beat;
    });
  }
  x.lalu = m;
}

function iringan(list, x, opsi) {
  const { t0, beat, ch, layer } = x;
  // Bass lembut: akar di ketuk 1, kelima di ketuk 3 (bagian ramai).
  list.push(['bs', t0, ch.b, beat * 1.7, 0.2]);
  list.push(['bs', t0 + beat * 2, layer >= 1 ? ch.b + 7 : ch.b, beat * 1.7, 0.16]);
  // Marimba: arpeggio 1/8 (atau 1/4 di bagian tenang).
  const pola = opsi.arp;
  for (let i = 0; i < 8; i++) {
    if (pola[i] < 0 || (layer === 0 && i % 2 === 1)) continue;
    list.push(['mr', t0 + (i * beat) / 2 + hum(), ch.v[pola[i]] + (opsi.naik ?? 0), beat * 0.6, jit(i % 2 === 0 ? 0.11 : 0.08)]);
  }
  if (opsi.hat && layer >= 1) for (let i = 0; i < 4; i++) list.push(['ht', t0 + beat * (i + 0.5) + hum(), 0, 0, jit(opsi.hat)]);
}

const TRANSPOS = (prog, n) => prog.map((c) => ({ v: K[c].v.map((v) => v + n), b: K[c].b + n }));

const SONGS = [
  {
    file: 'cerita-kantor.mp3', judul: 'Pagi di Loket (kantor & percakapan)', bpm: 88, rms: -21, tail: 3.5, durasi: [120, 190], transpos: 5, // F mayor: paling terang
    arp: [0, 2, 1, 2, 0, 2, 1, 2], hat: 0.035, lead: 'sq',
    order: [['A', 0], ['A', 1], ['B', 1], ['A', 2], ['C', 1], ['A', 2]],
    prog: { A: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'], B: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'], C: ['Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'G7'] },
  },
  {
    file: 'cerita-periksa.mp3', judul: 'Jalan Desa (pemeriksaan lapangan)', bpm: 92, rms: -21, tail: 3.5, durasi: [120, 190], transpos: 0, // C mayor, gerak lebih banyak
    arp: [0, 1, 2, 1, 2, 1, 0, 2], hat: 0.045, lead: 'tr', padat: true,
    order: [['A', 0], ['A', 1], ['B', 2], ['A', 2], ['B', 1], ['C', 1], ['A', 2]],
    prog: { A: ['C', 'G', 'Am', 'F', 'C', 'F', 'G', 'C'], B: ['F', 'C', 'Dm', 'G', 'Em', 'Am', 'Dm', 'G'], C: ['F', 'Em', 'Dm', 'C', 'F', 'G', 'Csus', 'G'] },
  },
  {
    file: 'cerita-penutup.mp3', judul: 'Senja di Kantor (penutup)', bpm: 84, rms: -22, tail: 4.5, durasi: [120, 190], transpos: 7, // G mayor, hangat & pulang
    arp: [0, -1, 2, -1, 1, -1, 2, -1], hat: 0, lead: 'tr',
    order: [['A', 0], ['A', 1], ['B', 1], ['A', 2], ['B', 2], ['A', 1]],
    prog: { A: ['C', 'F', 'C', 'G', 'Am', 'F', 'G', 'C'], B: ['F', 'Em', 'Am', 'F', 'Dm', 'G', 'C', 'C'] },
  },
];

function render(song) {
  seed = 20261118;
  const barSamples = Math.round((4 * 60 * SR) / song.bpm);
  const barDur = barSamples / SR;
  const beat = barDur / 4;
  const total = song.order.reduce((n, [p]) => n + song.prog[p].length, 0);
  const bodyLen = total * barSamples;
  const tailLen = Math.round(song.tail * SR);
  const buf = new Float32Array(bodyLen + tailLen);
  const list = [];
  const x = { lalu: 72 + song.transpos };
  let bar = 0;
  for (const [p, layer] of song.order) {
    const chords = TRANSPOS(song.prog[p], song.transpos);
    // Melodi: layer 0 = tanpa lead (marimba & bass saja), layer >= 1 = lead per frase 4 bar.
    if (layer >= 1) for (let f = 0; f < chords.length; f += 4) frase(list, x, chords.slice(f, f + 4), (bar + f) * barDur, beat, song.padat || layer >= 2, 12, song.lead);
    for (const ch of chords) {
      Object.assign(x, { t0: bar * barDur, beat, ch, layer, bar });
      iringan(list, x, song);
      bar++;
    }
  }
  for (const [v, t, m, d, a] of list) {
    if (t < -0.001 || t >= bodyLen / SR) continue;
    const tt = Math.max(0, t);
    if (v === 'sq') leadKotak(buf, tt, m, d, a * 0.55);
    else if (v === 'tr') leadKotak(buf, tt, m, d, a * 0.7, true);
    else if (v === 'mr') marimba(buf, tt, m, d, a);
    else if (v === 'bs') bass(buf, tt, m, d, a);
    else if (v === 'ht') hat(buf, tt, a);
  }
  warm(buf, 0.55);
  reverb(buf, 0.2, 0.84, 0.4);
  for (let i = 0; i < tailLen; i++) buf[i] += buf[bodyLen + i];
  const out = buf.slice(0, bodyLen);
  // Normalisasi RMS (bukan peak): semua trek sama "keras"-nya, jauh di bawah SFX (T-036).
  const g = Math.pow(10, song.rms / 20) / rmsOf(out);
  for (let i = 0; i < out.length; i++) out[i] *= g;
  if (peakOf(out) > 0.89) normalize(out, 0.89);
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
