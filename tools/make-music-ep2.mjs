#!/usr/bin/env node
/**
 * Musik latar MODE CERITA Episode 2 RAKSA GAME - 100% disintesis di sini (tanpa sampel, loop, atau rekaman pihak ketiga).
 *
 * Jalankan:  node tools/make-music-ep2.mjs
 * Keluaran:  client/public/audio/cerita-{kantor,periksa,penutup}.mp3  (lagu lama lobby/gameplay/podium TIDAK disentuh)
 *
 * T-036 Fix 1 (18 Nov 2026): diganti gaya chiptune 8-bit ceria (lihat SONGS); teks di bawah = arah lama, tetap berlaku untuk suasana.
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
const KBPS = 80; // T-036: trek 130-146 s; 80 kbps mono menjaga < 1,6 MB per trek untuk HP

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

// T-036 Fix 1 (pemilik 18 Nov, sesudah mendengar di :4000): GAYA chiptune 8-bit ceria (bukan pastoral). Saluran ala konsol lama:
// dua pulsa (duty 12,5 / 25 / 50 %), segitiga untuk bass, noise untuk hat & kick. Motif 4 bar ASLI (dibangkitkan dari nada akor
// oleh PRNG ber-seed), bagian A / B; bukan kutipan lagu mana pun, tanpa sampel.

/** Pulsa band-limited (PolyBLEP) dengan duty; amplop ADSR sederhana bergaya chip (serangan instan, luruh ke sustain). */
function pulsa(buf, t, midi, dur, amp, duty = 0.5, vib = 0) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round((dur + 0.03) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const blep = (p, dt) => { if (p < dt) { p /= dt; return p + p - p * p - 1; } if (p > 1 - dt) { p = (p - 1) / dt; return p * p + p + p + 1; } return 0; };
  let ph = 0;
  const lepas = Math.round(dur * SR);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const ff = f * (1 + (vib ? 0.006 * Math.sin(2 * Math.PI * 6 * s) * Math.min(1, s / 0.15) : 0));
    const dt = ff / SR;
    ph += dt; if (ph >= 1) ph -= 1;
    let v = (ph < duty ? 1 : -1) + blep(ph, dt) - blep((ph - duty + 1) % 1, dt);
    v -= 2 * duty - 1; // tanpa DC
    let env = 0.62 + 0.38 * Math.exp(-9 * s);
    if (i < 30) env *= i / 30;
    if (i > lepas) env *= Math.max(0, 1 - (i - lepas) / (0.03 * SR));
    buf[i0 + i] += v * amp * env;
  }
}

/** Segitiga 4-bit bertangga (seperti saluran segitiga konsol), untuk bass. */
function segitiga(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round((dur + 0.02) * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  let ph = 0.25;
  const lepas = Math.round(dur * SR);
  for (let i = 0; i < n; i++) {
    ph += f / SR; if (ph >= 1) ph -= 1;
    const tri = ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph;
    const v = Math.round(tri * 7.5) / 7.5;
    let env = i < 40 ? i / 40 : 1;
    if (i > lepas) env *= Math.max(0, 1 - (i - lepas) / (0.02 * SR));
    buf[i0 + i] += v * amp * env;
  }
}

/** Noise LFSR ala chip: 'hat' pendek bernada tinggi, 'kick' = sapuan segitiga turun + sedikit noise, 'snare' noise menengah. */
let lfsr = 1;
function noiseBit() { const b = (lfsr ^ (lfsr >> 1)) & 1; lfsr = (lfsr >> 1) | (b << 14); return (lfsr & 1) ? 1 : -1; }
function perkusi(buf, t, jenis, amp) {
  const i0 = Math.round(t * SR);
  const dur = jenis === 'hat' ? 0.04 : jenis === 'kick' ? 0.13 : 0.11;
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const tahan = jenis === 'hat' ? 3 : jenis === 'snare' ? 6 : 12; // sampel per langkah noise (nada noise)
  let nv = noiseBit(); let ph = 0.25; // fase 0,25 = nilai segitiga 0: tanpa klik di awal (sambungan loop)
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    if (i % tahan === 0) nv = noiseBit();
    let v;
    if (jenis === 'kick') {
      const f = 150 * Math.exp(-s * 22) + 45; ph += f / SR; if (ph >= 1) ph -= 1;
      v = (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph) * Math.exp(-s * 18) + 0.15 * nv * Math.exp(-s * 60);
    } else v = nv * Math.exp(-s * (jenis === 'hat' ? 90 : 28));
    buf[i0 + i] += v * amp * (i < 24 ? i / 24 : 1);
  }
}

const K = {
  C: { v: [60, 64, 67], b: 36 }, F: { v: [60, 65, 69], b: 41 }, G: { v: [59, 62, 67], b: 43 }, Am: { v: [60, 64, 69], b: 45 },
  Dm: { v: [62, 65, 69], b: 38 }, Em: { v: [59, 64, 67], b: 40 }, E: { v: [59, 64, 68], b: 40 }, Bb: { v: [62, 65, 70], b: 46 },
};
const SKALA = [0, 2, 4, 5, 7, 9, 11];
function dekatSkala(m) { const pc = ((m % 12) + 12) % 12; let best = m; let d = 99; for (const s of SKALA) for (const o of [-12, 0, 12]) { const c = m - pc + s + o; if (Math.abs(c - m) < d) { d = Math.abs(c - m); best = c; } } return best; }

/** Motif 4 bar sekali dibangkitkan per bagian, lalu DIULANG (catchy) dengan akhir yang berbeda pada pengulangan kedua. */
const POLA = [[1, 0.5, 0.5, 1, 1], [0.5, 0.5, 0.5, 0.5, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 0.5, 0.5, 1], [1, 1, 0.5, 0.5, 1]];
function buatMotif(chords, padat) {
  const bars = [];
  let m = 72;
  for (let b = 0; b < 4; b++) {
    const ch = chords[b];
    const pola = b === 3 ? [1, 1, 2] : POLA[Math.floor(rnd() * (padat ? POLA.length : 3))];
    const notes = [];
    let pos = 0;
    pola.forEach((d, k) => {
      const nada = ch.v.map((v) => v + 12);
      if (k === 0 || (b === 3 && k === pola.length - 1)) m = nada.reduce((a, v) => (Math.abs(v - m) < Math.abs(a - m) ? v : a), nada[0]);
      else m = dekatSkala(m + (rnd() < 0.6 ? 2 : -2) * (rnd() < 0.25 ? 2 : 1));
      m = Math.max(67, Math.min(86, m));
      notes.push([pos, m, d]);
      pos += d;
    });
    bars.push(notes);
  }
  return bars;
}

const TRANSPOS = (prog, n) => prog.map((c) => ({ v: K[c].v.map((v) => v + n), b: K[c].b + n }));

const SONGS = [
  {
    file: 'cerita-kantor.mp3', judul: 'Loket Pagi (kantor & percakapan)', bpm: 104, rms: -21, tail: 0.6, durasi: [100, 190], transpos: 0, // C mayor, ringan & ceria
    duty: [0.25, 0.125], drum: 'ringan',
    order: [['A', 0], ['A', 1], ['B', 1], ['A', 1], ['B', 2], ['A', 2]],
    prog: { A: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'], B: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'] },
  },
  {
    file: 'cerita-periksa.mp3', judul: 'Lapangan Berangkat (pemeriksaan)', bpm: 112, rms: -21, tail: 0.6, durasi: [100, 190], transpos: 2, // D mayor, lebih bertenaga
    duty: [0.5, 0.25], drum: 'dorong', padat: true,
    order: [['A', 0], ['A', 1], ['B', 1], ['A', 2], ['B', 2], ['A', 2], ['C', 1]],
    prog: { A: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], B: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'G'], C: ['F', 'G', 'Em', 'Am', 'Dm', 'E', 'F', 'G'] },
  },
  {
    file: 'cerita-penutup.mp3', judul: 'Berkas Beres (penutup)', bpm: 100, rms: -22, tail: 0.6, durasi: [100, 190], transpos: 5, // F mayor, hangat
    duty: [0.5, 0.125], drum: 'ringan', kemenangan: true,
    order: [['A', 0], ['A', 1], ['B', 1], ['A', 2], ['B', 2], ['A', 1]],
    prog: { A: ['C', 'F', 'C', 'G', 'Am', 'F', 'G', 'C'], B: ['F', 'Em', 'Am', 'Bb', 'F', 'G', 'C', 'C'] },
  },
];

function render(song) {
  seed = 20261118 + song.transpos; lfsr = 1;
  const barSamples = Math.round((4 * 60 * SR) / song.bpm);
  const barDur = barSamples / SR;
  const beat = barDur / 4;
  const total = song.order.reduce((n, [p]) => n + song.prog[p].length, 0);
  const bodyLen = total * barSamples;
  const tailLen = Math.round(song.tail * SR);
  const buf = new Float32Array(bodyLen + tailLen);
  const motif = {};
  for (const p of Object.keys(song.prog)) {
    const ch = TRANSPOS(song.prog[p], song.transpos);
    motif[p] = [buatMotif(ch.slice(0, 4), song.padat), buatMotif(ch.slice(4, 8), song.padat)];
    // Frase kedua mengulang irama frase pertama (catchy), nadanya mengikuti akornya sendiri.
    motif[p][1] = motif[p][0].map((notes, b) => notes.map(([pos, m, d], k) => {
      const akor = ch[4 + b].v.map((v) => v + 12);
      return [pos, k === 0 ? akor.reduce((a, v) => (Math.abs(v - m) < Math.abs(a - m) ? v : a), akor[0]) : dekatSkala(m), d];
    }));
  }
  let bar = 0;
  for (const [p, layer] of song.order) {
    const chords = TRANSPOS(song.prog[p], song.transpos);
    chords.forEach((ch, i) => {
      const t0 = bar * barDur;
      // Bass segitiga: akar - kelima - oktaf - kelima per seperdelapan (layer 0: per seperempat).
      const pola = layer === 0 ? [0, 7, 0, 7] : [0, 0, 7, 12, 0, 0, 7, 12];
      const lang = 4 / pola.length;
      pola.forEach((d, k) => segitiga(buf, t0 + k * lang * beat, ch.b + d, lang * beat * 0.97, layer === 0 ? 0.17 : 0.24)); // legato: tanpa celah di titik loop
      // Arpeggio pulsa 12,5 % lembut (pengisi harmoni).
      if (layer >= 1) for (let k = 0; k < 8; k++) pulsa(buf, t0 + k * beat / 2, ch.v[[0, 1, 2, 1, 0, 1, 2, 1][k]] + 12, beat * 0.4, 0.05, song.duty[1]);
      // Melodi pulsa (layer >= 1), motif bagian ini.
      if (layer >= 1) for (const [pos, m, d] of motif[p][Math.floor(i / 4)][i % 4]) {
        pulsa(buf, t0 + pos * beat, m, d * beat * 0.85, 0.13, song.duty[0], d >= 1 ? 1 : 0);
        // Lapis 2 (puncak): melodi digandakan satu oktaf di bawah, pulsa 12,5 %: bagian ramai terdengar lebih penuh (variasi dinamika).
        if (layer >= 2) pulsa(buf, t0 + pos * beat, m - 12, d * beat * 0.85, 0.07, 0.125);
      }
      // Perkusi saluran noise.
      for (let k = 0; k < 8; k++) {
        const tt = t0 + k * beat / 2;
        if (layer === 0 ? k === 3 || k === 7 : k % 2 === 1 || song.drum === 'dorong') perkusi(buf, tt, 'hat', layer === 0 ? 0.015 : 0.04);
        if (k === 0 || (song.drum === 'dorong' && k === 5) || (layer >= 2 && k === 4 && song.drum !== 'dorong')) perkusi(buf, tt, 'kick', 0.32);
        if (layer >= 1 && (k === 2 || k === 6)) perkusi(buf, tt, 'snare', 0.07);
      }
      // Penutup: lick kemenangan singkat di bar terakhir tiap bagian B.
      if (song.kemenangan && p === 'B' && i === chords.length - 1) {
        const c = chords[i].v.map((v) => v + 12);
        [[0, c[0]], [0.5, c[1]], [1, c[2]], [1.5, c[0] + 12], [2, c[2]], [3, c[0] + 12]].forEach(([pos, m]) => pulsa(buf, t0 + pos * beat, m, beat * 0.42, 0.1, 0.25));
      }
      bar++;
    });
  }
  for (let i = 0; i < tailLen; i++) buf[i] += buf[bodyLen + i];
  const out = buf.slice(0, bodyLen);
  // Sedikit hangat (lowpass ~7 kHz) supaya pulsa tidak menusuk di speaker HP; tanpa reverb (khas chip), sambungan mulus.
  warm(out, 0.62);
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
