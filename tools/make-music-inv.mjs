#!/usr/bin/env node
/**
 * T-085: musik EPISODE 1 INVESTIGATOR (auto-2-inv) - chiptune 8-bit bergaya detektif. 100% disintesis di sini: tanpa sampel,
 * loop, atau rekaman pihak ketiga, dan TANPA kutipan melodi karya mana pun (nada-nadanya ditulis tangan di berkas ini).
 *
 * Jalankan:  node tools/make-music-inv.mjs
 * Keluaran:  client/public/audio/inv-{investigasi,keterangan,keberatan,terungkap,tenang}.mp3
 *            (musik Episode 1 `cerita-*`, kuis acara `lobby/gameplay/podium` TIDAK disentuh)
 *
 * Saluran ala konsol lama: dua pulsa (duty 12,5 / 25 / 50 %, PolyBLEP), segitiga 4-bit bertangga + sedikit pulsa untuk bass
 * (supaya terdengar di speaker HP), noise LFSR untuk hat / sikat / snare / kick / detak jam.
 *
 * Satu MOTIF pengikat (kepala "D . F D . Ab A") dipakai di semua trek: mengendap-endap di Investigasi, diluruskan dan
 * dipercepat di Keberatan, dan menjadi MAYOR ("D . F# D . A B") di Terungkap / Tenang. Semua trek berpusat di D: D minor
 * selama kasus, D mayor saat kebenaran terungkap.
 *
 *  inv-investigasi  "Investigasi"  D minor, 86 BPM, ayun ringan, 16 bar: bass berjalan, hat ride + sikat, lead staccato.
 *  inv-keterangan   "Keterangan"   D minor, 76 BPM, 12 bar: jarang, detak jam tik-tok tiap ketuk, nada panjang bergema.
 *  inv-keberatan    "Keberatan"    D minor, 132 BPM, 24 bar: arpeggio 1/16 yang mendorong, bass oktaf, kick + snare.
 *  inv-terungkap    "Terungkap"    D mayor, 120 BPM, jingle resolusi 5,6 detik (SEKALI, bukan loop).
 *  inv-tenang       "Tenang"       D mayor, 80 BPM, 16 bar: loop tenang di bawah putusan dan kartu hasil.
 *
 * Loop mulus: panjang = kelipatan bar tepat, ekor di-"wrap" ke kepala, ketuk terakhir tiap loop sengaja hening (jeda napas),
 * jadi sambungan jatuh di hening. MP3 mono 64 kbps lewat ffmpeg (libmp3lame, dengan tag Info/LAME: delay + padding encoder
 * dipotong pemutar = tanpa hening di kepala). Tanpa ffmpeg: cadangan lamejs (tanpa tag gapless; skrip memberi peringatan).
 * Batas ukuran 400 KB per berkas diperiksa di sini.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '..', 'client', 'public', 'audio');
const SR = 44100;
const KBPS = 64;
const BATAS_BYTE = 400 * 1000;

function fail(msg) { throw new Error(`make-music-inv: ${msg}`); }
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const peakOf = (b) => { let p = 0; for (let i = 0; i < b.length; i++) p = Math.max(p, Math.abs(b[i])); return p; };
const rmsOf = (b) => { let s = 0; for (let i = 0; i < b.length; i++) s += b[i] * b[i]; return Math.sqrt(s / Math.max(1, b.length)); };
const db = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

// ------------------------------------------------------------------ suara

const blep = (p, dt) => { if (p < dt) { p /= dt; return p + p - p * p - 1; } if (p > 1 - dt) { p = (p - 1) / dt; return p * p + p + p + 1; } return 0; };

/**
 * Pulsa band-limited (PolyBLEP). Amplop gaya chip: serangan instan (30 sampel), luruh eksponensial `k` ke `sus`, lepas 25 ms.
 * `sus` kecil + `k` besar = petikan staccato; `vib` = vibrato 6 Hz yang masuk pelan (nada panjang).
 */
function pulsa(buf, t, midi, dur, amp, o = {}) {
  const duty = o.duty ?? 0.25; const k = o.k ?? 9; const sus = o.sus ?? 0.62;
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const lepas = Math.round(dur * SR);
  const n = Math.min(lepas + Math.round(0.025 * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const ff = f * (1 + (o.vib ? 0.007 * Math.sin(2 * Math.PI * 6 * s) * Math.min(1, s / 0.2) : 0));
    const dt = ff / SR;
    ph += dt; if (ph >= 1) ph -= 1;
    let v = (ph < duty ? 1 : -1) + blep(ph, dt) - blep((ph - duty + 1) % 1, dt);
    v -= 2 * duty - 1; // tanpa DC
    let env = sus + (1 - sus) * Math.exp(-k * s);
    if (i < 30) env *= i / 30;
    if (i > lepas) env *= Math.max(0, 1 - (i - lepas) / (0.025 * SR));
    buf[i0 + i] += v * amp * env;
  }
}

/** Bass: segitiga 4-bit bertangga (saluran segitiga konsol) + pulsa 25 % tipis di nada yang sama (harmonik untuk speaker HP). */
function bass(buf, t, midi, dur, amp, o = {}) {
  const f = mtof(midi);
  const i0 = Math.round(t * SR);
  const lepas = Math.round(dur * SR);
  const n = Math.min(lepas + Math.round(0.02 * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  let ph = 0.25; // nilai segitiga 0 di awal: tanpa klik
  for (let i = 0; i < n; i++) {
    ph += f / SR; if (ph >= 1) ph -= 1;
    const tri = ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph;
    const v = Math.round(tri * 7.5) / 7.5;
    let env = i < 40 ? i / 40 : 1;
    env *= 0.8 + 0.2 * Math.exp(-6 * (i / SR));
    if (i > lepas) env *= Math.max(0, 1 - (i - lepas) / (0.02 * SR));
    buf[i0 + i] += v * amp * env;
  }
  pulsa(buf, t, midi, dur, amp * (o.pulsa ?? 0.28), { duty: 0.25, k: 7, sus: 0.45 });
}

/** Noise LFSR 15-bit ala chip. */
let lfsr = 1;
function noiseBit() { const b = (lfsr ^ (lfsr >> 1)) & 1; lfsr = (lfsr >> 1) | (b << 14); return (lfsr & 1) ? 1 : -1; }
/**
 * Perkusi: hat (desis pendek), sikat (desis lembut lebih panjang), snare, kick (segitiga menyapu turun), simbal (ekor panjang),
 * tik / tok (detak jam: letupan persegi sangat pendek, tik lebih tinggi dari tok).
 */
function perkusi(buf, t, jenis, amp) {
  const i0 = Math.round(t * SR);
  const dur = { hat: 0.04, sikat: 0.1, snare: 0.12, kick: 0.13, simbal: 0.9, tik: 0.02, tok: 0.024 }[jenis] ?? fail(`perkusi ${jenis}`);
  const n = Math.min(Math.round(dur * SR), buf.length - i0);
  if (i0 < 0 || n <= 0) return;
  const tahan = { hat: 3, sikat: 4, snare: 6, kick: 12, simbal: 2, tik: 2, tok: 2 }[jenis];
  let nv = noiseBit(); let ph = 0.25;
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    if (i % tahan === 0) nv = noiseBit();
    let v;
    if (jenis === 'kick') {
      const f = 150 * Math.exp(-s * 22) + 45; ph += f / SR; if (ph >= 1) ph -= 1;
      v = (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph) * Math.exp(-s * 18) + 0.15 * nv * Math.exp(-s * 60);
    } else if (jenis === 'tik' || jenis === 'tok') {
      const f = jenis === 'tik' ? 2350 : 1650;
      v = (Math.sin(2 * Math.PI * f * s) >= 0 ? 1 : -1) * Math.exp(-s * 380) + 0.35 * nv * Math.exp(-s * 1400);
    } else if (jenis === 'snare') {
      v = nv * Math.exp(-s * 26) + 0.5 * Math.sin(2 * Math.PI * 190 * s) * Math.exp(-s * 40);
    } else v = nv * Math.exp(-s * (jenis === 'hat' ? 90 : jenis === 'sikat' ? 34 : 5.5));
    buf[i0 + i] += v * amp * (i < 24 ? i / 24 : 1);
  }
}

// ------------------------------------------------------------------ notasi

const NADA = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
/** 'd5' 'f#4' 'bb3' -> MIDI (c4 = 60). */
function nn(s) {
  const m = /^([a-g])([#b]?)(\d)$/.exec(s);
  if (!m) fail(`nada "${s}"`);
  return 12 * (Number(m[3]) + 1) + NADA[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/** Lama dalam ketuk: s 1/16, e 1/8, de 1/8 bertitik, q 1/4, dq 1/4 bertitik, h 1/2, dh 1/2 bertitik, w utuh. */
const LAMA = { s: 0.25, e: 0.5, de: 0.75, q: 1, dq: 1.5, h: 2, dh: 3, w: 4 };
const TOKEN = /^([a-g][#b]?\d|r)(dq|dh|de|s|e|q|h|w)([.~]*)$/;

/**
 * Lagu: `ayun` = letak 1/8 kedua dalam satu ketuk (0,5 = lurus; 0,6 = ayun ringan). `w(ketuk)` = detik.
 * `ekor` detik ruang di belakang badan untuk lepas nada / gema; loop: ekor itu di-wrap ke kepala.
 */
function lagu({ bpm, bar, ayun = 0.5, ekor = 1.2 }) {
  const beat = 60 / bpm;
  const bodyLen = Math.round(bar * 4 * beat * SR);
  const buf = new Float32Array(bodyLen + Math.round(ekor * SR));
  const w = (b) => { const k = Math.floor(b + 1e-9); const f = b - k; return (k + (f < 0.5 ? (f * ayun) / 0.5 : ayun + ((f - 0.5) * (1 - ayun)) / 0.5)) * beat; };
  return { buf, beat, bodyLen, w, bar };
}

/**
 * Satu bar satu suara. Token "<nada><lama>[.][~]": `r` = diam, `.` = staccato pendek, `~` = vibrato. Jumlah lama harus tepat
 * 4 ketuk (salah hitung = galat, bukan lagu yang bergeser diam-diam). `main(t, midi, detik, {stak, vib})` membunyikannya.
 */
function garis(L, barKe, teks, gate, main) {
  let b = (barKe - 1) * 4;
  const awal = b;
  for (const tok of teks.trim().split(/\s+/)) {
    const m = TOKEN.exec(tok);
    if (!m) fail(`token "${tok}" (bar ${barKe})`);
    const len = LAMA[m[2]];
    if (m[1] !== 'r') {
      const stak = m[3].includes('.'); const vib = m[3].includes('~');
      const t = L.w(b);
      main(t, nn(m[1]), (L.w(b + len) - t) * (stak ? Math.min(gate, 0.32) : gate), { stak, vib });
    }
    b += len;
  }
  if (Math.abs(b - awal - 4) > 1e-6) fail(`bar ${barKe}: ${b - awal} ketuk, harus 4 ("${teks}")`);
}

// ------------------------------------------------------------------ 1. Investigasi

function investigasi() {
  const L = lagu({ bpm: 86, bar: 16, ayun: 0.6 });
  // Lead: motif mengendap-endap (kepala D . F D . Ab A), dijawab turun; bar 3-4 = motif yang sama di akor iv; 7-8 = dua arpeggio
  // akor tujuh yang menuruni tangga; bagian B (9-16) nada panjang yang curiga lalu naik ke puncak (A7b9) dan pulang.
  const LEAD = [
    'd5e re f5e d5e re ab4e a4e re',
    'c5e re a4e re f4e g4e a4q.',
    'g4e re bb4e g4e re db5e d5e re',
    'f5e re d5e re bb4e c5e d5q.',
    'd5e re f5e d5e re ab4e a4e re',
    'c5e re a4e re d5e f5e a5q.',
    'ab5e re f5e re d5e re bb4e re',
    'g5e re e5e re c#5e re a4q~',
    'g4h~ bb4e a4e g4q.',
    'd5dh~ rq',
    'f5e re e5e re d5e re a4q.',
    'rq d5e e5e f5q. rq',
    'g5e re e5e re bb4e re g4e re',
    'a4e c#5e e5e g5e bb5q. rq',
    'a5e re f5e d5e re a4e d5q.',
    'rq e5e re c#5e re rq',
  ];
  LEAD.forEach((s, i) => garis(L, i + 1, s, 0.5, (t, m, d, o) => pulsa(L.buf, t, m, o.vib ? d * 1.8 : d, 0.118, { duty: 0.25, k: o.vib ? 6 : 16, sus: o.vib ? 0.6 : 0.22, vib: o.vib })));
  // Bass berjalan: akar di ketuk 1, nada akor, nada pendekat kromatis di ketuk 4. Bar 16 = jeda (ketuk 4 diam) sebelum kepala.
  const BASS = [
    'd2q f2q a2q c3q', 'd3q c3q a2q f#2q', 'g2q bb2q d3q e3q', 'g2q a2q bb2q c#3q',
    'd3q a2q f2q e2q', 'd2q e2q f2q a2q', 'bb2q d3q f2q g#2q', 'a2q g2q e2q f#2q',
    'g2q bb2q d3q c3q', 'bb2q g2q a2q c#3q', 'd3q c3q a2q f2q', 'd2q f2q g2q f2q',
    'e2q g2q bb2q d3q', 'a2q g2q e2q c#2q', 'd2q f2q a2q d3q', 'a2q c#3q e3q rq',
  ];
  BASS.forEach((s, i) => garis(L, i + 1, s, 0.93, (t, m, d) => bass(L.buf, t, m, d, 0.145)));
  // Iringan: dua nada akor staccato (pulsa 12,5 %) di "dan" ketuk 2 dan 4 (bagian A), di ketuk 2 dan 4 (bar 9-12).
  const DUA = { Dm: ['f4', 'a4'], Gm: ['g4', 'bb4'], Bb7: ['d4', 'ab4'], A7: ['c#4', 'g4'], Em: ['e4', 'bb4'] };
  const AKOR = ['Dm', 'Dm', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb7', 'A7', 'Gm', 'Gm', 'Dm', 'Dm', 'Em', 'A7', 'Dm', 'A7'];
  AKOR.forEach((a, i) => {
    const pos = i >= 8 && i < 12 ? [1, 3] : i === 15 ? [1.5] : [1.5, 3.5];
    for (const p of pos) for (const x of DUA[a]) pulsa(L.buf, L.w(i * 4 + p), nn(x), 0.07, 0.048, { duty: 0.125, k: 22, sus: 0.15 });
  });
  // Hat ride berayun (1, 2, 2&, 3, 4, 4&) + sikat lembut di 2 dan 4. Bar 16: berhenti sesudah ketuk 3 (satu hat di ketuk 4).
  for (let i = 0; i < 16; i++) {
    const akhir = i === 15;
    for (const [p, a] of [[0, 0.03], [1, 0.036], [1.5, 0.02], [2, 0.03], [3, 0.036], [3.5, 0.02]]) {
      if (akhir && p > 3) continue;
      perkusi(L.buf, L.w(i * 4 + p), 'hat', akhir && p === 3 ? 0.022 : a);
    }
    perkusi(L.buf, L.w(i * 4 + 1), 'sikat', 0.03);
    if (!akhir) perkusi(L.buf, L.w(i * 4 + 3), 'sikat', 0.03);
  }
  return { L, rms: -21.5, loop: true };
}

// ------------------------------------------------------------------ 2. Keterangan

function keterangan() {
  const L = lagu({ bpm: 76, bar: 12, ekor: 2.2 });
  // Nada panjang yang bertanya, dengan gema tiruan (ulang 3/4 ketuk kemudian, lalu 1,5 ketuk, makin pelan).
  const MELODI = [
    'a4h d5q rq', 'f5dh~ rq', 'd5h f5q rq', 'e5dh~ rq',
    'd5q bb4q g4h', 'rh a4e bb4e d5q', 'd5w~', 'c#5dh~ rq',
    'a4h d5q rq', 'f5q e5q d5h', 'bb4h d5q f5q', 'e5h rh',
  ];
  MELODI.forEach((s, i) => garis(L, i + 1, s, 0.9, (t, m, d, o) => {
    for (const [geser, kali] of [[0, 1], [0.75, 0.3], [1.5, 0.1]]) pulsa(L.buf, t + geser * L.beat, m, d, 0.085 * kali, { duty: 0.25, k: 5, sus: 0.42, vib: o.vib });
  }));
  const BASS = ['d3w', 'd3w', 'bb2w', 'bb2w', 'g2w', 'g2w', 'a2w', 'a2w', 'd3w', 'c3w', 'bb2w', 'a2dh rq'];
  BASS.forEach((s, i) => garis(L, i + 1, s, 0.96, (t, m, d) => bass(L.buf, t, m, d, 0.1, { pulsa: 0.22 })));
  // Arpeggio pecah sangat pelan hanya di bar 5-8 dan 11-12 (sedikit dorongan, tetap jarang).
  const ARP = {
    5: 'g3e bb3e d4e bb3e g3e bb3e d4e bb3e', 6: 'g3e bb3e d4e bb3e g3e bb3e d4e bb3e',
    7: 'a3e d4e e4e d4e a3e d4e e4e d4e', 8: 'a3e c#4e e4e c#4e a3e c#4e g4e e4e',
    11: 'bb3e d4e f4e d4e bb3e d4e f4e d4e', 12: 'a3e c#4e e4e g4e e4q. rq',
  };
  for (const [barKe, s] of Object.entries(ARP)) garis(L, Number(barKe), s, 0.55, (t, m, d) => pulsa(L.buf, t, m, d, 0.034, { duty: 0.125, k: 14, sus: 0.2 }));
  // Detak jam: tik (ketuk 1, 3) dan tok (ketuk 2, 4) sepanjang loop.
  for (let b = 0; b < 48; b++) perkusi(L.buf, L.w(b), b % 2 === 0 ? 'tik' : 'tok', b % 4 === 0 ? 0.05 : 0.04);
  return { L, rms: -24, loop: true };
}

// ------------------------------------------------------------------ 3. Keberatan

function keberatan() {
  const L = lagu({ bpm: 132, bar: 24 });
  const NADA_AKOR = {
    Dm: ['d4', 'f4', 'a4', 'd5'], Bb: ['d4', 'f4', 'bb4', 'd5'], C: ['e4', 'g4', 'c5', 'e5'], A: ['c#4', 'e4', 'a4', 'c#5'],
    Gm: ['d4', 'g4', 'bb4', 'd5'], F: ['f4', 'a4', 'c5', 'f5'],
  };
  const AKAR = { Dm: 'd3', Bb: 'bb2', C: 'c3', A: 'a2', Gm: 'g2', F: 'f2' };
  const AKOR = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'Bb', 'A', 'A', 'Dm', 'Dm', 'Bb', 'C', 'Dm', 'F', 'Gm', 'A'];
  const POLA = [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2];
  AKOR.forEach((a, i) => {
    for (let k = 0; k < 16; k++) {
      if (i === 23 && k >= 12) break; // bar 24: ketuk 4 diam (jeda sebelum kepala)
      const akor = i === 22 && k >= 8 ? 'A' : a; // bar 23: Gm lalu A
      pulsa(L.buf, L.w(i * 4 + k * 0.25), nn(NADA_AKOR[akor][POLA[k]]), L.beat * 0.25 * 0.62, 0.05, { duty: 0.125, k: 20, sus: 0.3 });
    }
    // Bass 1/8: akar, akar, oktaf, akar (dua kali per bar).
    const lo = nn(AKAR[a]);
    for (let k = 0; k < 8; k++) {
      if (i === 15 || i === 23) break;
      const akar = i === 22 && k >= 4 ? nn(AKAR.A) : lo;
      bass(L.buf, L.w(i * 4 + k * 0.5), akar + (k % 4 === 2 ? 12 : 0), L.beat * 0.5 * 0.8, 0.13);
    }
  });
  garis(L, 16, 'a2e a2e a3e a2e c#3e e3e g3e a3e', 0.8, (t, m, d) => bass(L.buf, t, m, d, 0.13));
  garis(L, 24, 'a2e a2e a3e a2e a2q. rq', 0.8, (t, m, d) => bass(L.buf, t, m, d, 0.13));
  // Lead (pulsa 50 %): motif diluruskan dan tegas; masuk di bar 5 (bar 1-4 = arpeggio + bass saja).
  const LEAD = {
    5: 'd5dq f5e d5q a4q', 6: 'a4h c5q d5q', 7: 'f5dh~ d5q', 8: 'e5h~ c#5q e5q',
    9: 'g5dq bb5e g5q d5q', 10: 'd5h f5q g5q', 11: 'a5dh~ f5q', 12: 'd5h~ rh',
    13: 'bb4e d5e f5e bb5e a5h~', 14: 'g5q f5q d5h', 15: 'e5q e5e e5e e5q g5q', 16: 'a5dh~ rq',
    17: 'd5dq f5e d5q a5q', 18: 'a5h g5q f5q', 19: 'f5dq d5e bb4h', 20: 'e5q g5q c6h~',
    21: 'a5h f5q d5q', 22: 'c5q f5q a5h~', 23: 'g5q bb5q a5q g5q', 24: 'a5e re e5e re c#5q. rq',
  };
  for (const [barKe, s] of Object.entries(LEAD)) garis(L, Number(barKe), s, 0.92, (t, m, d, o) => pulsa(L.buf, t, m, d, 0.09, { duty: 0.5, k: 8, sus: 0.6, vib: o.vib }));
  // Drum: bar 1-4 kick tiap ketuk + hat 1/8; sesudah itu kick 1 & 3 (+ "dan" ketuk 3), snare 2 & 4. Isian snare di bar 16; bar 24
  // berhenti sesudah ketuk 3.
  for (let i = 0; i < 24; i++) {
    const b0 = i * 4;
    const akhir = i === 23;
    for (let k = 0; k < 8; k++) { if (akhir && k >= 6) break; perkusi(L.buf, L.w(b0 + k * 0.5), 'hat', k % 2 ? 0.022 : 0.03); }
    if (i < 4) { for (let k = 0; k < 4; k++) perkusi(L.buf, L.w(b0 + k), 'kick', 0.16); continue; }
    perkusi(L.buf, L.w(b0), 'kick', 0.18);
    perkusi(L.buf, L.w(b0 + 1), 'snare', 0.085);
    perkusi(L.buf, L.w(b0 + 2), 'kick', 0.18);
    if (akhir) { perkusi(L.buf, L.w(b0 + 2.5), 'snare', 0.085); continue; }
    perkusi(L.buf, L.w(b0 + 2.5), 'kick', 0.12);
    if (i === 15) for (let k = 0; k < 4; k++) perkusi(L.buf, L.w(b0 + 3 + k * 0.25), 'snare', 0.05 + k * 0.014);
    else perkusi(L.buf, L.w(b0 + 3), 'snare', 0.085);
  }
  return { L, rms: -21, loop: true };
}

// ------------------------------------------------------------------ 4a. Terungkap (jingle, sekali)

function terungkap() {
  // 2 bar (4 detik) + akor akhir D mayor ditahan; panjang berkas 5,6 detik.
  const L = lagu({ bpm: 120, bar: 3, ekor: 0.1 });
  garis(L, 1, 'd5e re f#5e d5e re a4e b4e re', 0.5, (t, m, d) => pulsa(L.buf, t, m, d, 0.11, { duty: 0.25, k: 14, sus: 0.3 }));
  garis(L, 2, 'g4e b4e d5e g5e a4e c#5e e5e a5e', 0.7, (t, m, d) => pulsa(L.buf, t, m, d, 0.11, { duty: 0.25, k: 12, sus: 0.35 }));
  // Akor akhir: D6 ditahan (vibrato), F#5 + A5 di bawahnya, kilau arpeggio 1/16 di awal akor.
  const tA = L.w(8);
  pulsa(L.buf, tA, nn('d6'), 1.25, 0.1, { duty: 0.25, k: 3, sus: 0.5, vib: true });
  pulsa(L.buf, tA, nn('a5'), 1.25, 0.05, { duty: 0.125, k: 3, sus: 0.5 });
  pulsa(L.buf, tA, nn('f#5'), 1.25, 0.05, { duty: 0.125, k: 3, sus: 0.5 });
  ['d5', 'f#5', 'a5', 'd6'].forEach((x, k) => pulsa(L.buf, tA + k * 0.0625, nn(x) + 12, 0.06, 0.04, { duty: 0.125, k: 25, sus: 0.1 }));
  // Suara kedua: terts di bawah lead bar 1 (pelan).
  garis(L, 1, 'f#4e re a4e f#4e re f#4e g4e re', 0.5, (t, m, d) => pulsa(L.buf, t, m, d, 0.05, { duty: 0.125, k: 14, sus: 0.3 }));
  garis(L, 1, 'd3q d3q d3q a2q', 0.8, (t, m, d) => bass(L.buf, t, m, d, 0.16));
  garis(L, 2, 'g2q g2q a2q a2q', 0.8, (t, m, d) => bass(L.buf, t, m, d, 0.16));
  bass(L.buf, tA, nn('d3'), 1.25, 0.17);
  for (let k = 0; k < 8; k++) perkusi(L.buf, L.w(k * 0.5), 'hat', k % 2 ? 0.02 : 0.028);
  perkusi(L.buf, L.w(0), 'kick', 0.16);
  perkusi(L.buf, L.w(2), 'kick', 0.14);
  for (let k = 0; k < 3; k++) perkusi(L.buf, L.w(4 + k), 'kick', 0.15);
  for (let k = 0; k < 4; k++) perkusi(L.buf, L.w(7 + k * 0.25), 'snare', 0.045 + k * 0.016); // gulungan menuju akor akhir
  perkusi(L.buf, tA, 'kick', 0.18);
  perkusi(L.buf, tA, 'simbal', 0.05);
  // Berkas berakhir 1,6 detik sesudah akor akhir, dengan pudar 0,35 detik (bukan loop: tanpa wrap).
  const panjang = Math.round((tA + 1.6) * SR);
  const out = L.buf.slice(0, panjang);
  const pudar = Math.round(0.35 * SR);
  for (let i = 0; i < pudar; i++) out[panjang - 1 - i] *= i / pudar;
  return { L, out, rms: -19.5, loop: false };
}

// ------------------------------------------------------------------ 4b. Tenang (loop di bawah putusan & kartu hasil)

function tenang() {
  const L = lagu({ bpm: 80, bar: 16, ekor: 2 });
  const NADA_AKOR = {
    D: ['d4', 'f#4', 'a4', 'd5'], Bm: ['b3', 'd4', 'f#4', 'b4'], G: ['b3', 'd4', 'g4', 'b4'], A: ['c#4', 'e4', 'a4', 'c#5'],
    Em: ['b3', 'e4', 'g4', 'b4'], 'F#m': ['c#4', 'f#4', 'a4', 'c#5'],
  };
  const AKOR = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em', 'A', 'G', 'A', 'F#m', 'Bm', 'G', 'Em', 'A', 'D'];
  const POLA = [0, 1, 2, 3, 2, 1, 2, 1];
  AKOR.forEach((a, i) => {
    for (let k = 0; k < 8; k++) {
      if (i === 15 && k >= 6) break; // ketuk 4 bar terakhir diam
      pulsa(L.buf, L.w(i * 4 + k * 0.5), nn(NADA_AKOR[a][POLA[k]]), L.beat * 0.5 * 0.7, 0.045, { duty: 0.125, k: 9, sus: 0.3 });
    }
  });
  const BASS = [
    'd3h a2h', 'b2h f#2h', 'g2h d3h', 'a2h e3h', 'd3h a2h', 'b2h f#2h', 'e3h b2h', 'a2h c#3h',
    'g2h d3h', 'a2h e3h', 'f#2h c#3h', 'b2h f#2h', 'g2h d3h', 'e3h b2h', 'a2h e3h', 'd3h a2q rq',
  ];
  BASS.forEach((s, i) => garis(L, i + 1, s, 0.94, (t, m, d) => bass(L.buf, t, m, d, 0.1, { pulsa: 0.22 })));
  // Melodi jarang; bar 5-6 = motif pengikat dalam mayor, pelan.
  const MELODI = [
    'f#5h a5q f#5q', 'd5dh~ rq', 'b4q d5q g5h~', 'e5dh~ rq',
    'd5q re f#5e d5q rq', 'rq a4q b4h~', 'g5h e5h', 'c#5dh~ rq',
    'b5h g5h', 'a5h e5h', 'f#5dh~ a5q', 'd5h b4h',
    'b4q d5q g5q b5q', 'g5h e5h', 'e5h c#5h', 'd5dh~ rq',
  ];
  MELODI.forEach((s, i) => garis(L, i + 1, s, 0.9, (t, m, d, o) => {
    for (const [geser, kali] of [[0, 1], [0.75, 0.22]]) pulsa(L.buf, t + geser * L.beat, m, d, 0.075 * kali, { duty: 0.25, k: 5, sus: 0.45, vib: o.vib });
  }));
  return { L, rms: -23, loop: true };
}

// ------------------------------------------------------------------ olah & tulis

/** Loop: ekor di-wrap ke kepala, panjang tepat kelipatan bar. Lalu lowpass satu pole (~7 kHz) dan RMS sasaran. */
function selesaikan(x) {
  let out = x.out;
  if (!out) {
    const { buf, bodyLen } = x.L;
    for (let i = bodyLen; i < buf.length; i++) buf[i - bodyLen] += buf[i];
    out = buf.slice(0, bodyLen);
  }
  // Lowpass dua putaran untuk loop: putaran pertama hanya mengisi keadaan filter, supaya awal dan akhir loop bersambung.
  let lp = 0;
  const kali = x.loop ? 2 : 1;
  const hasil = new Float32Array(out.length);
  for (let r = 0; r < kali; r++) for (let i = 0; i < out.length; i++) { lp += 0.62 * (out[i] - lp); hasil[i] = lp; }
  const g = Math.pow(10, x.rms / 20) / rmsOf(hasil);
  for (let i = 0; i < hasil.length; i++) hasil[i] *= g;
  const p = peakOf(hasil);
  if (p > 0.89) { const k = 0.89 / p; for (let i = 0; i < hasil.length; i++) hasil[i] *= k; }
  return hasil;
}

function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + samples.length * 2, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36);
  data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) { const v = Math.max(-1, Math.min(1, samples[i])); data.writeInt16LE(Math.round(v < 0 ? v * 0x8000 : v * 0x7fff), 44 + i * 2); }
  return data;
}

function tulisMp3(samples, tujuan) {
  try {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'wav', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', `${KBPS}k`,
      '-ac', '1', '-ar', String(SR), '-map_metadata', '-1', '-id3v2_version', '0', '-write_xing', '1', tujuan], { input: wav(samples), stdio: ['pipe', 'ignore', 'inherit'] });
    return 'ffmpeg libmp3lame (tag Info/LAME, gapless)';
  } catch (e) {
    if (e?.code !== 'ENOENT') throw e;
  }
  console.warn('PERINGATAN: ffmpeg tidak ada, memakai lamejs (tanpa tag gapless: ada hening encoder di kepala berkas).');
  const require = createRequire(import.meta.url);
  const dir = path.dirname(require.resolve('lamejs/package.json'));
  const lame = new Function(`${fs.readFileSync(path.join(dir, 'lame.min.js'), 'utf8')}\nreturn lamejs;`)();
  const enc = new lame.Mp3Encoder(1, SR, KBPS);
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) { const v = Math.max(-1, Math.min(1, samples[i])); pcm[i] = Math.round(v < 0 ? v * 0x8000 : v * 0x7fff); }
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) { const c = enc.encodeBuffer(pcm.subarray(i, Math.min(i + 1152, pcm.length))); if (c.length) parts.push(Buffer.from(c)); }
  const last = enc.flush(); if (last.length) parts.push(Buffer.from(last));
  fs.writeFileSync(tujuan, Buffer.concat(parts));
  return 'lamejs';
}

const LAGU = [
  ['inv-investigasi.mp3', 'Investigasi', investigasi],
  ['inv-keterangan.mp3', 'Keterangan', keterangan],
  ['inv-keberatan.mp3', 'Keberatan', keberatan],
  ['inv-terungkap.mp3', 'Terungkap (jingle)', terungkap],
  ['inv-tenang.mp3', 'Tenang', tenang],
];
/** WAV mentah (sebelum MP3) ke folder ini bila RAKSA_MUSIK_WAV diisi: untuk mengukur, tidak dipakai game. */
const WAV_DIR = process.env.RAKSA_MUSIK_WAV;
for (const [berkas, judul, buat] of LAGU) {
  lfsr = 1;
  const x = buat();
  const out = selesaikan(x);
  const dur = out.length / SR;
  const sambung = Math.abs(out[0] - out[out.length - 1]);
  if (x.loop && sambung > 0.05) fail(`${berkas}: sambungan loop kasar (${sambung.toFixed(4)})`);
  if (x.loop && out.length !== x.L.bodyLen) fail(`${berkas}: bukan kelipatan bar`);
  const tujuan = path.join(OUT_DIR, berkas);
  const cara = tulisMp3(out, tujuan);
  if (WAV_DIR) fs.writeFileSync(path.join(WAV_DIR, berkas.replace('.mp3', '.wav')), wav(out));
  const ukuran = fs.statSync(tujuan).size;
  if (ukuran > BATAS_BYTE) fail(`${berkas}: ${ukuran} byte > ${BATAS_BYTE}`);
  // Ekor loop (0,25 detik terakhir) harus jauh lebih pelan dari seluruh trek: sambungan jatuh di hening.
  const ekor = rmsOf(out.subarray(out.length - Math.round(0.25 * SR)));
  console.log(`${berkas} "${judul}" ${dur.toFixed(2)} s | ${x.loop ? `${x.L.bar} bar loop` : 'sekali'} | ${(ukuran / 1000).toFixed(0)} KB | peak ${db(peakOf(out)).toFixed(1)} dBFS | RMS ${db(rmsOf(out)).toFixed(1)} dBFS | ekor 0,25 s ${db(ekor).toFixed(1)} dBFS | sambungan ${sambung.toFixed(4)} | ${cara}`);
}
console.log('Selesai.');
