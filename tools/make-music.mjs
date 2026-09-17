#!/usr/bin/env node
/**
 * Pembuat musik latar RAKSA GAME - 100% disintesis di sini, bukan hasil unduhan.
 *
 * Jalankan:  npm run gen:music
 * Keluaran:  client/public/audio/{lobby,gameplay,podium}.mp3
 *
 * Instrumen disintesis: marimba/kalimba (sine + harmonik inharmonis, envelope
 * perkusif), petikan ukulele (Karplus-Strong), bass sine dengan saturasi lembut,
 * shaker (noise ter-filter). Reverb = comb + allpass sederhana (Freeverb ringan).
 *
 * Loop mulus: panjang trek tepat kelipatan bar, lalu ekor reverb/dengung
 * di-"wrap-add" ke kepala sehingga sinyal benar-benar periodik.
 *
 * Script ini juga memeriksa hasilnya sendiri (lihat CHECKS di bawah) dan gagal
 * dengan pesan jelas bila ada yang melanggar (durasi, peak, sambungan loop).
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '..', 'client', 'public', 'audio');
const SR = 44100;

// ------------------------------------------------------------------ utilitas

/** PRNG deterministik supaya hasil selalu sama (bisa diverifikasi ulang). */
let seed = 20240917;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
/** Humanisasi kecil: geser waktu +-4 ms. */
function hum() {
  return (rnd() - 0.5) * 0.008;
}
/** Jitter amplitudo +-7 %. */
function jit(a) {
  return a * (0.93 + rnd() * 0.14);
}
function mtof(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}
function fail(msg) {
  throw new Error(`make-music: ${msg}`);
}

// --------------------------------------------------------------- nada & akor

/** Tangga nada mayor; deg(0) = C4, deg(7) = C5, deg(-1) = B3. */
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
function deg(d) {
  const o = Math.floor(d / 7);
  return 60 + MAJOR[d - o * 7] + 12 * o;
}

/** Voicing dipilih agar tidak ada kluster semiton (biar hangat, tidak keruh). */
const CHORDS = {
  Cmaj7: { bass: 48, notes: [60, 64, 67, 71] }, // C E G B
  Am7: { bass: 45, notes: [57, 60, 64, 67] }, // A C E G
  F: { bass: 41, notes: [60, 65, 69, 72] }, // C F A C
  G: { bass: 43, notes: [59, 62, 67, 71] }, // B D G B
  Dm7: { bass: 50, notes: [57, 62, 65, 69] }, // A D F A
  Em7: { bass: 52, notes: [59, 64, 67, 71] }, // B E G B
};

/** Nada akor terdekat DI BAWAH nada melodi -> harmoni selalu konsonan. */
function chordToneBelow(ch, m) {
  let best = null;
  for (const n of ch.notes) {
    for (let o = -24; o <= 24; o += 12) {
      const x = n + o;
      if (x <= m - 3 && x >= m - 9 && (best === null || x > best)) best = x;
    }
  }
  return best;
}

/** "7 . 9 11 | 12 . 11 ." -> [midi|null] per 1/8. */
function grid(s) {
  return s
    .replace(/\|/g, ' ')
    .trim()
    .split(/\s+/)
    .map((t) => (t === '.' ? null : deg(Number(t))));
}

// ------------------------------------------------------------------ instrumen

/** Marimba/kalimba: harmonik inharmonis + decay per-partial. */
const BARS_PARTIALS = [
  [1, 1.0, 2.6],
  [4.01, 0.3, 5.2],
  [9.85, 0.07, 9.0],
  [2.0, 0.05, 3.6],
];
function marimba(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = Math.max(1, Math.round(0.0035 * SR));
  const rel = Math.min(n, 400);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    let v = 0;
    for (const [r, a, d] of BARS_PARTIALS) v += a * Math.sin(2 * Math.PI * f * r * s) * Math.exp(-d * s);
    let env = i < atk ? i / atk : 1;
    if (n - i < rel) env *= (n - i) / rel;
    buf[i0 + i] += v * amp * env;
  }
}

/** Petikan ukulele/gitar nilon: Karplus-Strong. */
function pluck(buf, t, midi, dur, amp, bright = 0.55) {
  const f = mtof(midi);
  const N = Math.max(2, Math.round(SR / f));
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const d = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    lp += bright * (rnd() * 2 - 1 - lp);
    d[i] = lp;
  }
  let mean = 0;
  for (let i = 0; i < N; i++) mean += d[i];
  mean /= N;
  let norm = 0;
  for (let i = 0; i < N; i++) {
    d[i] -= mean;
    norm = Math.max(norm, Math.abs(d[i]));
  }
  if (norm > 0) for (let i = 0; i < N; i++) d[i] /= norm;
  const damp = Math.min(0.99995, Math.exp(Math.log(0.002) / (dur * SR)));
  const rel = Math.min(n, 700);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const cur = d[idx];
    const nxt = d[(idx + 1) % N];
    d[idx] = 0.5 * (cur + nxt) * damp;
    idx = (idx + 1) % N;
    let env = 1;
    if (i < 48) env = i / 48;
    if (n - i < rel) env *= (n - i) / rel;
    buf[i0 + i] += cur * amp * env;
  }
}

/** Bass sine lembut dengan sedikit saturasi. */
function bass(buf, t, midi, dur, amp) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const atk = Math.round(0.014 * SR);
  const rel = Math.min(n, Math.round(0.09 * SR));
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const raw = Math.sin(2 * Math.PI * f * s) + 0.16 * Math.sin(4 * Math.PI * f * s);
    const v = Math.tanh(raw * 1.5) / 1.5;
    let env = i < atk ? i / atk : 1;
    if (n - i < rel) env *= (n - i) / rel;
    env *= 0.4 + 0.6 * Math.exp(-1.2 * s);
    buf[i0 + i] += v * amp * env;
  }
}

/** Shaker: noise ter-filter, envelope pendek. `tone` 0.2..0.6 = makin terang. */
function shaker(buf, t, dur, amp, tone = 0.4) {
  const i0 = Math.round(t * SR);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    lp += tone * (w - lp);
    const v = w - lp; // highpass -> "tss", bukan "dum"
    const env = Math.exp((-6 * i) / n) * Math.min(1, i / 40);
    buf[i0 + i] += v * amp * env;
  }
}

// -------------------------------------------------------------------- olahan

/** Reverb ringan: 6 comb + 4 allpass, mono. */
function reverb(buf, wet = 0.2, room = 0.82, damp = 0.3) {
  const scale = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491].map((n) => Math.round(n * scale));
  const aps = [556, 441, 341, 225].map((n) => Math.round(n * scale));
  const wetBuf = new Float32Array(buf.length);
  for (const N of combs) {
    const d = new Float32Array(N);
    let filt = 0;
    let idx = 0;
    for (let i = 0; i < buf.length; i++) {
      const y = d[idx];
      wetBuf[i] += y;
      filt = y * (1 - damp) + filt * damp;
      d[idx] = buf[i] + filt * room;
      idx = idx + 1 === N ? 0 : idx + 1;
    }
  }
  for (let i = 0; i < wetBuf.length; i++) wetBuf[i] /= combs.length;
  for (const N of aps) {
    const d = new Float32Array(N);
    let idx = 0;
    for (let i = 0; i < wetBuf.length; i++) {
      const y = d[idx];
      const x = wetBuf[i];
      d[idx] = x + y * 0.5;
      wetBuf[i] = y - x;
      idx = idx + 1 === N ? 0 : idx + 1;
    }
  }
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - wet) + wetBuf[i] * wet;
}

/** Lowpass satu pole ~9 kHz supaya hangat, tidak menusuk di speaker aula. */
function warm(buf, k = 0.72) {
  let lp = 0;
  for (let i = 0; i < buf.length; i++) {
    lp += k * (buf[i] - lp);
    buf[i] = lp;
  }
}

function peakOf(buf) {
  let p = 0;
  for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i]));
  return p;
}
function rmsOf(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / Math.max(1, buf.length));
}
function db(x) {
  return x <= 0 ? -Infinity : 20 * Math.log10(x);
}

function normalize(buf, targetPeak) {
  const p = peakOf(buf);
  if (p <= 0) fail('hasil render senyap');
  const g = targetPeak / p;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
}

// ------------------------------------------------------------------- aransemen

function ev(list, v, t, m, d, a) {
  list.push({ v, t, m, d, a });
}

/** Melodi marimba dari grid 1/8 + harmoni opsional. */
function melodyBar(list, ctx, voice, amp, harmony) {
  const { t0, beat, mel, ch } = ctx;
  const e = beat / 2;
  for (let i = 0; i < 8; i++) {
    const m = mel[i];
    if (m === null) continue;
    let len = 1;
    while (i + len < 8 && mel[i + len] === null) len++;
    const dur = Math.min(1.5, Math.max(0.32, len * e + 0.3));
    const t = t0 + i * e + hum();
    ev(list, voice, t, m, dur, jit(amp));
    if (harmony && i % 4 === 0) {
      const h = chordToneBelow(ch, m);
      if (h !== null) ev(list, voice, t + 0.014, h, dur * 0.8, jit(amp * 0.42));
    }
  }
}

/** LOBBY: santai, arpeggio ukulele 1/8, shaker lembut. */
function lobbyBar(list, ctx) {
  const { t0, beat, ch, layer, akhirBagian } = ctx;
  const e = beat / 2;
  ev(list, 'bas', t0, ch.bass, beat * 1.7, 0.3);
  ev(list, 'bas', t0 + beat * 2.5, ch.bass + 7, beat * 1.2, 0.22);
  if (layer >= 2) ev(list, 'bas', t0 + beat * 1.5, ch.bass + 12, beat * 0.7, 0.13);

  const ARP = [0, 2, 1, 3, 2, 0, 1, 2];
  for (let i = 0; i < 8; i++) {
    if (layer === 0 && (i === 1 || i === 5)) continue;
    const n = ch.notes[ARP[i]] + (layer >= 3 && i % 4 === 2 ? 12 : 0);
    ev(list, 'plk', t0 + i * e + hum(), n, beat * 1.1, jit(i % 2 === 0 ? 0.17 : 0.11));
  }

  melodyBar(list, ctx, 'mar', 0.32, layer >= 1);

  const pos = layer === 0 ? [1, 3, 5, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
  for (const i of pos) ev(list, 'shk', t0 + i * e + hum(), 0.4, 0.07, jit(i % 2 === 0 ? 0.045 : 0.03));

  if (akhirBagian) {
    for (let k = 0; k < 3; k++) {
      ev(list, 'mar', t0 + beat * 3 + k * (beat / 4), ch.notes[k + 1] ?? ch.notes[0], 0.4, 0.16);
    }
  }
}

/** GAMEPLAY: lebih aktif - bass tiap ketukan, petikan 1/16, shaker 1/16. */
function gameBar(list, ctx) {
  const { t0, beat, ch, layer, akhirBagian } = ctx;
  const e = beat / 2;
  const s = beat / 4;
  for (let b = 0; b < 4; b++) {
    ev(list, 'bas', t0 + b * beat, b % 2 === 0 ? ch.bass : ch.bass + 7, beat * 0.55, 0.27);
    if (layer >= 1 && (b === 1 || b === 3)) ev(list, 'bas', t0 + b * beat + e, ch.bass + 12, e * 0.8, 0.14);
  }
  for (let i = 0; i < 16; i++) {
    if (layer < 2 && i % 4 === 1) continue;
    const n = ch.notes[(i * 3) % ch.notes.length] + (i % 8 === 0 ? 12 : 0);
    ev(list, 'plk', t0 + i * s + hum(), n, beat * 0.55, jit(i % 4 === 0 ? 0.13 : 0.07));
  }
  // Bagian B: melodi pindah ke petikan (kontras); petikan lebih pelan dari
  // marimba pada amp sama, jadi amp-nya dinaikkan supaya level tetap rata.
  melodyBar(list, ctx, layer === 2 ? 'plk' : 'mar', layer === 2 ? 0.45 : 0.27, layer >= 1);
  for (let i = 0; i < 16; i++) {
    ev(list, 'shk', t0 + i * s + hum(), i % 4 === 0 ? 0.45 : 0.35, 0.055, jit(i % 4 === 0 ? 0.05 : 0.028));
  }
  if (akhirBagian) {
    for (let k = 0; k < 4; k++) ev(list, 'shk', t0 + beat * 3.5 + k * (beat / 8), 0.5, 0.05, 0.04);
  }
}

/** PODIUM: jingle kemenangan, bar terakhir = akor panjang. */
function podiumBar(list, ctx) {
  const { t0, beat, ch, bar, totalBars } = ctx;
  const terakhir = bar === totalBars - 1;
  ev(list, 'bas', t0, ch.bass, terakhir ? beat * 3.6 : beat * 1.8, 0.32);
  if (!terakhir) ev(list, 'bas', t0 + beat * 2, ch.bass + 7, beat * 1.6, 0.22);

  for (const on of terakhir ? [0] : [0, 2]) {
    ch.notes.forEach((n, k) => {
      ev(list, 'plk', t0 + on * beat + k * 0.018, n, terakhir ? 3.2 : beat * 1.4, jit(0.15));
    });
  }
  if (terakhir) {
    ch.notes.forEach((n, k) => ev(list, 'mar', t0 + k * 0.02, n, 2.8, jit(0.26)));
    ev(list, 'mar', t0 + 0.02, ch.notes[0] + 12, 2.8, 0.2);
    for (let k = 0; k < 6; k++) ev(list, 'shk', t0 + k * 0.05, 0.5, 0.12, 0.05 - k * 0.006);
  } else {
    melodyBar(list, ctx, 'mar', 0.34, true);
    for (let i = 0; i < 8; i++) ev(list, 'shk', t0 + i * (beat / 2), 0.45, 0.07, jit(i % 2 === 0 ? 0.05 : 0.032));
    if (bar === totalBars - 2) {
      for (let k = 0; k < 4; k++) ev(list, 'shk', t0 + beat * 3 + k * (beat / 4), 0.5, 0.06, 0.045);
    }
  }
}

// ----------------------------------------------------------------- daftar lagu

const SONGS = [
  {
    file: 'lobby.mp3',
    judul: 'Raksa Lobby (Pagi di Kantor)',
    bpm: 104,
    loop: true,
    puncak: 0.72,
    tail: 3.0,
    durasi: [45, 90],
    bar: lobbyBar,
    // A - A' - B - A''  (8 bar per bagian, total 32 bar)
    order: [
      { prog: 'A', mel: 'A', layer: 0 },
      { prog: 'A', mel: 'A2', layer: 1 },
      { prog: 'B', mel: 'B', layer: 2 },
      { prog: 'A', mel: 'A3', layer: 3 },
    ],
    prog: {
      A: ['Cmaj7', 'Am7', 'F', 'G', 'Cmaj7', 'Am7', 'Dm7', 'G'],
      B: ['F', 'G', 'Em7', 'Am7', 'Dm7', 'G', 'Cmaj7', 'G'],
    },
    mel: {
      A:
        '4 . 7 . 9 . 7 . | 5 . 7 . 9 7 5 . | 3 . 5 . 7 . 8 . | 7 . 6 . 4 . . . |' +
        '4 . 7 . 9 . 11 . | 9 . 7 . 5 . 4 . | 1 . 5 . 8 . 7 . | 6 . 4 . 2 . . .',
      A2:
        '7 9 11 . 9 . 7 . | 9 . 11 9 7 . 5 . | 8 . 7 . 5 7 8 . | 6 . 8 . 11 . 9 . |' +
        '7 . 9 11 12 . 11 . | 11 . 9 . 7 . 5 . | 8 . 7 . 5 . 4 . | 6 . 7 . 4 . . .',
      B:
        '5 . 7 8 9 . 8 . | 6 . 8 . 9 . 11 . | 9 . 8 . 6 . 4 . | 7 . 5 . 4 . 2 . |' +
        '1 3 5 . 8 . 7 . | 6 . 4 . 6 . 8 . | 7 . 9 . 11 . 9 . | 8 . 6 . 4 . . .',
      A3:
        '11 . 9 . 7 . 9 . | 9 . 7 . 5 . 7 . | 8 . 7 . 5 . 3 . | 4 . 6 . 8 . 6 . |' +
        '7 . 11 . 9 . 7 . | 9 . 7 . 5 . 4 . | 5 . 7 . 8 . 9 . | 7 . . . 4 . . .',
    },
  },
  {
    file: 'gameplay.mp3',
    judul: 'Raksa Misi (Ayo Lindungi Kota)',
    bpm: 112,
    loop: true,
    puncak: 0.78,
    tail: 3.0,
    durasi: [45, 90],
    bar: gameBar,
    order: [
      { prog: 'A', mel: 'A', layer: 0 },
      { prog: 'A', mel: 'A2', layer: 1 },
      { prog: 'B', mel: 'B', layer: 2 },
      { prog: 'A', mel: 'A3', layer: 3 },
    ],
    prog: {
      A: ['Cmaj7', 'G', 'Am7', 'F', 'Cmaj7', 'G', 'Dm7', 'G'],
      B: ['Am7', 'F', 'Cmaj7', 'G', 'Dm7', 'Em7', 'F', 'G'],
    },
    mel: {
      A:
        '7 . 9 7 11 . 9 7 | 6 . 8 6 11 . 9 . | 5 7 9 . 7 . 5 . | 3 5 8 . 7 . 5 . |' +
        '7 . 9 7 11 9 7 . | 6 8 11 . 9 . 6 . | 8 . 7 5 8 . 9 . | 6 . 4 . 7 . . .',
      A2:
        '11 . 12 11 9 . 7 . | 11 9 8 . 6 . 8 . | 9 . 11 9 7 . 9 . | 8 . 7 5 3 . 5 . |' +
        '7 9 11 12 14 . 11 . | 13 . 11 . 9 . 6 . | 8 . 9 8 7 . 5 . | 6 . 8 . 7 . . .',
      B:
        '7 . . 9 . 7 5 . | 9 . . 8 . 5 3 . | 7 . . 9 11 . 9 . | 8 . 6 . 4 . 6 . |' +
        '5 . 7 . 8 . 7 . | 9 . 8 . 6 . 8 . | 9 . 8 . 7 5 3 . | 6 . 8 . 11 . . .',
      A3:
        '14 . 11 . 9 . 11 . | 13 . 11 . 8 . 6 . | 12 . 9 . 7 . 9 . | 10 . 8 . 5 . 7 . |' +
        '11 . 9 11 14 . 11 . | 13 11 8 . 6 . 8 . | 9 . 8 . 7 . 5 . | 7 . . . 4 . . .',
    },
  },
  {
    file: 'podium.mp3',
    judul: 'Raksa Podium (Selamat, Pahlawan!)',
    bpm: 112,
    loop: false,
    puncak: 0.9,
    tail: 2.6,
    durasi: [8, 14],
    bar: podiumBar,
    order: [{ prog: 'A', mel: 'A', layer: 3 }],
    prog: { A: ['Cmaj7', 'F', 'G', 'Cmaj7'] },
    mel: {
      A: '4 7 9 11 . 11 . . | 9 . 8 9 11 . 9 . | 8 . 6 8 11 . 13 . | 14 . . . . . . .',
    },
  },
];

// -------------------------------------------------------------------- render

function renderSong(song) {
  seed = 20240917; // deterministik per lagu
  const barSamples = Math.round((4 * 60 * SR) / song.bpm); // bar = 4 ketukan, bulat
  const barDur = barSamples / SR;
  const beat = barDur / 4;

  const totalBars = song.order.reduce((n, sec) => n + song.prog[sec.prog].length, 0);
  const bodyLen = totalBars * barSamples; // tepat kelipatan bar
  const tailLen = Math.round(song.tail * SR);
  const buf = new Float32Array(bodyLen + tailLen);

  const list = [];
  let bar = 0;
  for (const sec of song.order) {
    const prog = song.prog[sec.prog];
    const mel = grid(song.mel[sec.mel]);
    if (mel.length !== prog.length * 8) {
      fail(`grid melodi ${song.file}/${sec.mel} = ${mel.length} nada, harus ${prog.length * 8}`);
    }
    for (let b = 0; b < prog.length; b++) {
      const ch = CHORDS[prog[b]];
      if (!ch) fail(`akor tidak dikenal: ${prog[b]}`);
      song.bar(list, {
        t0: bar * barDur,
        beat,
        ch,
        mel: mel.slice(b * 8, b * 8 + 8),
        layer: sec.layer,
        bar,
        totalBars,
        akhirBagian: b === prog.length - 1,
      });
      bar++;
    }
  }
  if (list.length === 0) fail(`${song.file} tidak menghasilkan satu not pun`);

  list.sort((a, b2) => a.t - b2.t);
  for (const n of list) {
    if (n.t < -0.001 || n.t >= bodyLen / SR) continue; // semua event harus di dalam body
    if (n.v === 'mar') marimba(buf, n.t, n.m, n.d, n.a);
    else if (n.v === 'plk') pluck(buf, n.t, n.m, n.d, n.a);
    else if (n.v === 'bas') bass(buf, n.t, n.m, n.d, n.a);
    else if (n.v === 'shk') shaker(buf, n.t, n.d, n.a, n.m);
    else fail(`instrumen tidak dikenal: ${n.v}`);
  }

  warm(buf);
  reverb(buf, song.loop ? 0.2 : 0.26);

  let out;
  if (song.loop) {
    // Sambungan mulus: ekor (dengung + reverb) ditambahkan ke kepala,
    // sehingga sinyal periodik tepat sepanjang bodyLen.
    for (let i = 0; i < tailLen; i++) buf[i] += buf[bodyLen + i];
    out = buf.slice(0, bodyLen);
  } else {
    out = buf;
    const fade = Math.round(0.35 * SR); // podium tidak loop: fade halus di akhir
    for (let i = 0; i < fade; i++) out[out.length - 1 - i] *= i / fade;
  }

  normalize(out, song.puncak);
  return { samples: out, bpm: song.bpm, bars: totalBars, barDur };
}

// -------------------------------------------------------------------- encoder

function loadLame() {
  try {
    const require = createRequire(import.meta.url);
    const dir = path.dirname(require.resolve('lamejs/package.json'));
    const src = fs.readFileSync(path.join(dir, 'lame.min.js'), 'utf8');
    // lame.min.js membungkus semuanya dalam function lamejs(); ambil hasilnya.
    // (require('lamejs') gagal di Node karena modul src/js memakai variabel global.)
    const lib = new Function(`${src}\nreturn lamejs;`)();
    if (typeof lib?.Mp3Encoder !== 'function') throw new Error('Mp3Encoder tidak ditemukan');
    return lib;
  } catch (e) {
    return { gagal: e instanceof Error ? e.message : String(e) };
  }
}

function toPcm16(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = Math.round(v < 0 ? v * 0x8000 : v * 0x7fff);
  }
  return pcm;
}

function encodeMp3(lame, samples, kbps = 128) {
  const enc = new lame.Mp3Encoder(1, SR, kbps);
  const pcm = toPcm16(samples);
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const chunk = enc.encodeBuffer(pcm.subarray(i, Math.min(i + 1152, pcm.length)));
    if (chunk.length > 0) parts.push(Buffer.from(chunk));
  }
  const last = enc.flush();
  if (last.length > 0) parts.push(Buffer.from(last));
  return Buffer.concat(parts);
}

/** Cadangan bila lamejs tidak bisa dipakai: WAV mono 32 kHz. */
function encodeWav(samples, srOut = 32000) {
  const src = Float32Array.from(samples);
  let lp = 0;
  const k = 1 - Math.exp((-2 * Math.PI * 13000) / SR); // anti-alias sebelum turun rate
  for (let i = 0; i < src.length; i++) {
    lp += k * (src[i] - lp);
    src[i] = lp;
  }
  const n = Math.round((src.length * srOut) / SR);
  const res = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = (i * SR) / srOut;
    const i0 = Math.floor(s);
    const f = s - i0;
    res[i] = (src[i0] ?? 0) * (1 - f) + (src[i0 + 1] ?? 0) * f;
  }
  const pcm = toPcm16(res);
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + pcm.length * 2, 4);
  head.write('WAVE', 8);
  head.write('fmt ', 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(srOut, 24);
  head.writeUInt32LE(srOut * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(pcm.length * 2, 40);
  return Buffer.concat([head, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.length * 2)]);
}

// ----------------------------------------------------------------------- main

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lame = loadLame();
  const mp3 = typeof lame.Mp3Encoder === 'function';
  if (!mp3) {
    console.warn(`! lamejs tidak bisa dipakai (${lame.gagal}) -> keluaran WAV mono 32 kHz.`);
    console.warn('! Catat alasannya di client/public/audio/CREDITS.md dan sesuaikan MUSIC_FILES di client/src/audio/audio.ts.');
  }

  console.log(`RAKSA GAME - pembuat musik (${mp3 ? 'MP3 mono 128 kbps' : 'WAV mono 32 kHz'} @ sintesis ${SR} Hz)`);
  console.log(`Keluaran: ${OUT_DIR}\n`);

  for (const song of SONGS) {
    const { samples, bars, barDur } = renderSong(song);
    const dur = samples.length / SR;
    const peak = peakOf(samples);
    const rms = rmsOf(samples);

    // ---- CHECKS: gagal keras kalau ada yang salah (ini pemeriksa script) ----
    const [minD, maxD] = song.durasi;
    if (dur < minD || dur > maxD) fail(`${song.file} durasi ${dur.toFixed(2)}s di luar ${minD}-${maxD}s`);
    if (peak > 0.99) fail(`${song.file} peak ${peak.toFixed(3)} terlalu dekat clipping`);
    if (Math.abs(peak - song.puncak) > 0.01) fail(`${song.file} normalisasi gagal (${peak.toFixed(3)})`);
    let seam = 0;
    if (song.loop) {
      if (samples.length !== bars * Math.round(barDur * SR)) fail(`${song.file} panjang bukan kelipatan bar`);
      seam = Math.abs(samples[0] - samples[samples.length - 1]);
      if (seam > 0.08) fail(`${song.file} sambungan loop kasar (delta ${seam.toFixed(4)})`);
    }

    const name = mp3 ? song.file : song.file.replace(/\.mp3$/, '.wav');
    const data = mp3 ? encodeMp3(lame, samples) : encodeWav(samples);
    if (data.length < 1000) fail(`${name} hasil encode terlalu kecil (${data.length} byte)`);
    if (mp3 && data[0] !== 0xff) fail(`${name} bukan bitstream MP3 yang sah`);
    fs.writeFileSync(path.join(OUT_DIR, name), data);

    console.log(`${name}  "${song.judul}"`);
    console.log(
      `  ${dur.toFixed(2)} s | ${song.bpm} BPM | ${bars} bar | ${song.loop ? 'loop mulus' : 'sekali putar'}`,
    );
    console.log(
      `  ${(data.length / 1024).toFixed(1)} KB | peak ${peak.toFixed(3)} (${db(peak).toFixed(1)} dBFS)` +
        ` | RMS ${rms.toFixed(4)} (${db(rms).toFixed(1)} dBFS)` +
        (song.loop ? ` | delta sambungan ${seam.toFixed(5)}` : ''),
    );
    console.log('');
  }
  console.log('Selesai. Semua pemeriksaan lolos (durasi, peak, kelipatan bar, sambungan loop).');
}

main();
