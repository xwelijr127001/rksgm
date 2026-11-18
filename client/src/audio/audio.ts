/**
 * Satu pengelola audio untuk seluruh aplikasi RAKSA GAME.
 *
 * - MUSIK: berkas asli di `client/public/audio/*.mp3` (dihasilkan oleh
 *   `npm run gen:music`, lihat `client/public/audio/CREDITS.md`) diputar lewat
 *   HTMLAudioElement. Perpindahan lagu memakai fade, bukan potong mendadak.
 * - EFEK: tetap disintesis Web Audio API - ringan, tanpa unduhan, tanpa lisensi.
 * - Hanya SATU trek boleh berbunyi. Bila Unity atau layar lain ikut minta musik,
 *   pemilik musik (claimMusicOwner) yang menentukan siapa yang berhak memutar.
 *   Halaman host/proyektor jadi pemilik utama (lewat preferMusicOn()).
 * - Aturan autoplay dipatuhi: musik baru jalan setelah interaksi pengguna.
 * - Di HP musik NONAKTIF secara default; backsound diputar dari host/proyektor.
 * - Berkas musik gagal dimuat (404/offline) -> mode senyap, dicatat sekali saja.
 */

import { UJI_AUDIO } from './bendera';

export type Track = 'lobby' | 'game' | 'podium' | 'cerita-kantor' | 'cerita-periksa' | 'cerita-penutup' | null;
export type Sfx =
  | 'pilih'
  | 'bukti'
  | 'kirim'
  | 'naik'
  | 'salah'
  | 'tik'
  | 'papan'
  | 'confetti'
  | 'masuk'
  | 'taruh'
  // Mode cerita (Episode 2): konfirmasi tindakan yang lembut, tidak membedakan benar/salah.
  | 'kertas'
  | 'pesanKirim'
  | 'pesanTerima'
  | 'ketuk'
  | 'konfirmasi'
  | 'batal';

export interface AudioPrefs {
  muted: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  /** true bila pengguna sudah memilih sendiri (jangan ditimpa default halaman). */
  chosen: boolean;
  /** Efek suara aktif (master mute tetap di atasnya). Bawaan: aktif. */
  sfxEnabled: boolean;
  /** Musik & suasana MODE CERITA. undefined = bawaan (aktif bila tidak dibisukan). Tidak memengaruhi mode lain. */
  musikCerita?: boolean;
}

/** Ganti musik = timpa berkas ini, atau ubah satu baris di sini. */
// Berawal BASE_URL (bukan '/'): ikut prefiks hosting saat dibangun dengan VITE_BASE_PATH (story/base.ts).
const MUSIC_FILES: Record<Exclude<Track, null>, string> = {
  lobby: (import.meta.env?.BASE_URL ?? '/') + 'audio/lobby.mp3',
  game: (import.meta.env?.BASE_URL ?? '/') + 'audio/gameplay.mp3',
  podium: (import.meta.env?.BASE_URL ?? '/') + 'audio/podium.mp3',
  // Mode cerita Episode 2 (tools/make-music-ep2.mjs): tenang, untuk dibaca berulang.
  'cerita-kantor': (import.meta.env?.BASE_URL ?? '/') + 'audio/cerita-kantor.mp3?v=t036b', // ?v: kunci cache, naikkan saat trek diganti
  'cerita-periksa': (import.meta.env?.BASE_URL ?? '/') + 'audio/cerita-periksa.mp3?v=t036b', // ?v: kunci cache, naikkan saat trek diganti
  'cerita-penutup': (import.meta.env?.BASE_URL ?? '/') + 'audio/cerita-penutup.mp3?v=t036b', // ?v: kunci cache, naikkan saat trek diganti
};

/** Lobby & gameplay berulang; jingle podium hanya sekali. */
const MUSIC_LOOP: Record<Exclude<Track, null>, boolean> = {
  lobby: true,
  game: true,
  podium: false,
  'cerita-kantor': true,
  'cerita-periksa': true,
  'cerita-penutup': true,
};

/** Trek cerita: lebih pelan dari musik acara (di belakang teks & SFX) dan crossfade lebih panjang. */
const TREK_CERITA = new Set<string>(['cerita-kantor', 'cerita-periksa', 'cerita-penutup']);
// T-036 (pemilik 18 Nov: musik terlalu keras): 0.55 -> 0.28 (-5,9 dB) DAN berkasnya kini RMS -21/-22 dBFS (dulu -17..-19):
// total sekitar 9 dB lebih pelan dibanding SFX. Bawaan HP tetap musik mati.
const GAIN_CERITA = 0.28;
const FADE_CERITA_MS = 1600;
function volTrek(track: Exclude<Track, null>): number {
  return musicVolume() * (TREK_CERITA.has(track) ? GAIN_CERITA : 1);
}

const FADE_IN_MS = 450;
const FADE_OUT_MS = 280;
const FADE_QUICK_MS = 200;

const PREF_KEY = 'raksa:audio';

const DEFAULT_PREFS: AudioPrefs = {
  muted: false,
  musicEnabled: false, // default HP: musik mati
  musicVolume: 0.45,
  sfxVolume: 0.6,
  chosen: false,
  sfxEnabled: true,
};

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AudioPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(p: AudioPrefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}

let prefs = loadPrefs();
const listeners = new Set<(p: AudioPrefs) => void>();

function notify() {
  for (const l of listeners) l(prefs);
}

const sudahDicatat = new Set<string>();
function catatSekali(pesan: string) {
  if (sudahDicatat.has(pesan)) return;
  sudahDicatat.add(pesan);
  console.warn(`[audio] ${pesan}`);
}

// ------------------------------------------------------------- pemilik musik

/** Host/proyektor = pemilik utama; Unity paling rendah; lainnya di tengah. */
const OWNER_RANK: Record<string, number> = { host: 3, projector: 3, unity: 1 };
const owners: string[] = [];

function rank(id: string): number {
  return OWNER_RANK[id] ?? 2;
}

function activeOwner(): string | null {
  let best: string | null = null;
  for (const id of owners) if (best === null || rank(id) >= rank(best)) best = id;
  return best;
}

/**
 * Mendaftar sebagai pemilik musik. Pemanggil `setTrack(track, id)` yang BUKAN
 * pemilik aktif akan diabaikan, sehingga musik tidak pernah bertumpuk.
 */
export function claimMusicOwner(id: string): void {
  if (!id || owners.includes(id)) return;
  owners.push(id);
}

export function releaseMusicOwner(id: string): void {
  const i = owners.indexOf(id);
  if (i >= 0) owners.splice(i, 1);
}

// -------------------------------------------------------------- mesin efek

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let ambBus: GainNode | null = null;
/** T-040: music elements routed through Web Audio (iOS Safari ignores HTMLAudioElement.volume). */
let musicBus: GainNode | null = null;

/** Interaksi pengguna sudah terjadi (syarat autoplay). */
let userGesture = false;
/** play() pernah ditolak browser -> perlu gesture lagi. */
let blocked = false;

function ready(): boolean {
  return ctx !== null && ctx.state === 'running';
}

// ---- T-042 temporary A/B, remove after owner picks ------------------------------------------------------------------
// SFX became late on iPhone after T-040. Two suspects cannot be settled without the phone, so the owner flips them by URL:
//   ?suara=a  T-040 as shipped: audioSession 'playback' + music routed through Web Audio
//   ?suara=b  no audioSession 'playback'; music still routed (in-app music volume keeps working on iOS)   <- DEFAULT
//   ?suara=c  audioSession 'playback'; music NOT routed (el.volume as before T-040)
//   ?suara=d  neither (pre-T-040 behaviour)
// Read once at initAudio, kept in sessionStorage so navigation inside the game keeps it.
type ModeSuara = 'a' | 'b' | 'c' | 'd';
const MODE_SUARA_BAWAAN: ModeSuara = 'b';
const KUNCI_MODE_SUARA = 'raksa:suara-ab';
let modeSuara: ModeSuara | null = null;
function bacaModeSuara(): ModeSuara {
  const sah = (v: string | null): v is ModeSuara => v === 'a' || v === 'b' || v === 'c' || v === 'd';
  try {
    const q = new URLSearchParams(window.location.search).get('suara');
    if (sah(q)) { try { sessionStorage.setItem(KUNCI_MODE_SUARA, q); } catch { /* this page only */ } return q; }
    const tersimpan = sessionStorage.getItem(KUNCI_MODE_SUARA);
    if (sah(tersimpan)) return tersimpan;
  } catch { /* no storage */ }
  return MODE_SUARA_BAWAAN;
}
const sesiPlayback = () => modeSuara === 'a' || modeSuara === 'c';
const musikLewatWebAudio = () => modeSuara === 'a' || modeSuara === 'b';
// ---- end T-042 A/B ----------------------------------------------------------------------------------------------------

/** Dipanggil pada interaksi pengguna pertama (AudioUnlocker). */
export function initAudio(): void {
  userGesture = true;
  modeSuara ??= bacaModeSuara();
  // T-040 (owner on iPhone): declare media playback so the hardware volume buttons and the silent switch behave like normal
  // media (iOS 16.4+ / Safari 17). Unsupported browsers: no-op. T-042: only in A/B modes a and c.
  if (sesiPlayback()) {
    try {
      const sesi = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (sesi && sesi.type !== 'playback') sesi.type = 'playback';
    } catch { /* not supported */ }
  }
  if (ctx) {
    if (ctx.state !== 'running') ctx.resume().catch(() => { /* ditolak browser: dicoba lagi pada interaksi berikutnya */ });
    applyMusic();
    return;
  }
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor) {
    // T-042: ask for the smallest output buffer (tap -> sound latency); old WebKit without the options argument: plain call.
    try { ctx = new Ctor({ latencyHint: 'interactive' }); } catch { ctx = new Ctor(); }
    master = ctx.createGain();
    master.gain.value = prefs.muted ? 0 : 1;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = prefs.sfxEnabled ? prefs.sfxVolume : 0;
    sfxBus.connect(master);
    ambBus = ctx.createGain();
    ambBus.gain.value = 1;
    ambBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 1;
    musicBus.connect(master);
    if (ctx.state !== 'running') ctx.resume().catch(() => { /* ditolak browser: dicoba lagi pada interaksi berikutnya */ });
  } else {
    catatSekali('Web Audio tidak tersedia - efek suara dimatikan.');
  }
  applyMusic();
  applyAmbience();
}

function applyPrefs() {
  if (master) master.gain.value = prefs.muted ? 0 : 1;
  if (sfxBus) sfxBus.gain.value = prefs.sfxEnabled ? prefs.sfxVolume : 0;
  applyAmbience();
  savePrefs(prefs);
  notify();
  applyMusic();
}

// ------------------------------------------------------------------- musik

const els = new Map<string, HTMLAudioElement>();
const rusak = new Set<string>();
const fades = new Map<HTMLAudioElement, number>();
/** Target of the fade in progress per element: the same target again = no new fade (T-040, idempotent). */
const fadeTujuan = new Map<HTMLAudioElement, number>();
/** play() still pending: do not call play() again or reset the volume (rapid screen updates used to restart the track). */
const memulai = new Set<HTMLAudioElement>();
/** T-040: per-element gain (element -> MediaElementSource -> gain -> musicBus -> master). Missing = fallback el.volume. */
const gainEl = new Map<HTMLAudioElement, GainNode>();

function sambungkan(el: HTMLAudioElement): void {
  if (!ctx || !musicBus || gainEl.has(el)) return;
  if (!musikLewatWebAudio()) return; // T-042 A/B modes c and d: el.volume as before T-040
  try {
    const g = ctx.createGain();
    g.gain.value = el.volume;
    ctx.createMediaElementSource(el).connect(g).connect(musicBus);
    el.volume = 1; // loudness is now the gain only
    gainEl.set(el, g);
  } catch {
    catatSekali('Musik tidak bisa diarahkan lewat Web Audio - volume memakai elemen audio.');
  }
}

function bacaVol(el: HTMLAudioElement): number {
  const g = gainEl.get(el);
  return g ? g.gain.value : el.volume;
}

function aturVol(el: HTMLAudioElement, v: number): void {
  const g = gainEl.get(el);
  if (g && ctx) {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.value = v;
  } else el.volume = v;
}

/** Trek yang diminta halaman, belum tentu yang berbunyi. */
let desired: Track = null;
/** Trek yang sedang berbunyi (tepat satu, atau tidak ada). */
let playing: Exclude<Track, null> | null = null;

function cancelFade(el: HTMLAudioElement) {
  const id = fades.get(el);
  fadeTujuan.delete(el);
  if (id !== undefined) {
    window.clearInterval(id);
    fades.delete(el);
  }
}

function fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  const target = Math.min(1, Math.max(0, to));
  // T-040: the same fade already running (or already there) = no-op, so repeated applyMusic calls never re-fade.
  if (!done && fades.has(el) && Math.abs((fadeTujuan.get(el) ?? -1) - target) < 0.001) return;
  if (!done && !fades.has(el) && Math.abs(bacaVol(el) - target) < 0.001) return;
  cancelFade(el);
  const from = bacaVol(el);
  if (ms <= 0 || Math.abs(target - from) < 0.01) {
    aturVol(el, target);
    if (done) done();
    return;
  }
  const mulai = Date.now();
  fadeTujuan.set(el, target);
  const id = window.setInterval(() => {
    const k = Math.min(1, (Date.now() - mulai) / ms);
    aturVol(el, from + (target - from) * k);
    if (k >= 1) {
      cancelFade(el);
      if (done) done();
    }
  }, 40);
  fades.set(el, id);
}

function element(track: Exclude<Track, null>): HTMLAudioElement | null {
  const src = MUSIC_FILES[track];
  if (rusak.has(src) || typeof Audio === 'undefined') return null;
  const ada = els.get(src);
  if (ada) { sambungkan(ada); return ada; }
  const el = new Audio(src);
  el.loop = MUSIC_LOOP[track];
  el.preload = 'auto';
  el.volume = 0;
  el.addEventListener('error', () => {
    rusak.add(src);
    cancelFade(el);
    if (playing === track) playing = null;
    catatSekali(`Berkas musik ${src} tidak bisa dimuat - musik dilewati (mode senyap).`);
  });
  el.addEventListener('ended', () => {
    if (playing === track) playing = null; // jingle selesai, boleh diputar lagi
  });
  els.set(src, el);
  sambungkan(el);
  return el;
}

function musicVolume(): number {
  return Math.min(1, Math.max(0, prefs.musicVolume));
}

/**
 * Musik khusus satu halaman (mis. /latihan yang dimainkan sendirian). Menyala
 * tanpa menyentuh preferensi tersimpan, supaya HP peserta tidak ikut berbunyi
 * saat pertandingan sungguhan.
 */
let paksaMusik = false;
/** Halaman cerita aktif (Episode 2): trek cerita boleh berbunyi tanpa menyalakan musik mode lain. */
let modeCerita = false;
export function forceMusic(on: boolean): void {
  paksaMusik = on;
  applyMusic();
}

/**
 * Trek yang benar-benar boleh berbunyi sekarang.
 * Urutan prioritas: master mute > (trek cerita: halaman cerita aktif & sakelar musik cerita) / (trek lain: musicEnabled atau
 * paksa musik) > interaksi pengguna > tab terlihat > berkas tidak rusak. Preferensi mode lain tidak bisa menyalakan trek cerita
 * yang dimatikan, dan sakelar cerita tidak memengaruhi trek mode lain.
 */
function targetTrack(): Track {
  if (!desired) return null;
  if (prefs.muted) return null;
  if (TREK_CERITA.has(desired)) {
    if (!modeCerita || prefs.musikCerita === false) return null;
  } else if (!(prefs.musicEnabled || paksaMusik)) return null;
  if (!userGesture) return null;
  if (typeof document !== 'undefined' && document.hidden) return null;
  if (rusak.has(MUSIC_FILES[desired])) return null;
  return desired;
}

/** Elemen yang sedang dituju (satu-satunya yang boleh naik volumenya). */
let targetEl: HTMLAudioElement | null = null;
/** Elemen tujuan sebelumnya: satu-satunya yang boleh memudar bersama tujuan (crossfade = paling banyak dua trek). */
let sebelumEl: HTMLAudioElement | null = null;

function hentikan(el: HTMLAudioElement) {
  cancelFade(el);
  memulai.delete(el);
  aturVol(el, 0);
  el.pause();
}

function applyMusic() {
  if (typeof window === 'undefined') return;
  const want = targetTrack();
  const hidden = typeof document !== 'undefined' && document.hidden;

  // Bisu / tab tersembunyi: SEMUA elemen musik berhenti seketika (musik memakai <audio>, tidak ikut gain master Web Audio).
  if (prefs.muted || hidden) {
    for (const el of els.values()) hentikan(el);
    targetEl = null;
    sebelumEl = null;
    playing = null;
    return;
  }

  const el = want ? element(want) : null;
  if (el !== targetEl) {
    // Trek tujuan berganti: tujuan lama memudar (crossfade); trek lain yang masih memudar dihentikan agar paling banyak dua.
    for (const lain of els.values()) if (lain !== el && lain !== targetEl) hentikan(lain);
    const lama = targetEl;
    sebelumEl = lama;
    targetEl = el;
    if (lama && lama !== el) {
      const pindahCerita = !!want && TREK_CERITA.has(want) && [...TREK_CERITA].some((t) => els.get(MUSIC_FILES[t as Exclude<Track, null>]) === lama);
      fade(lama, 0, pindahCerita ? FADE_CERITA_MS : FADE_OUT_MS, () => { if (targetEl !== lama) lama.pause(); });
    }
  }
  playing = want && el ? want : null;
  if (!want || !el) return;

  // T-040: play() still pending for this target = nothing to do (no second play(), no volume reset, no restart).
  if (memulai.has(el)) return;
  if (!el.paused) {
    // Sudah berbunyi (termasuk yang sempat memudar keluar lalu dipilih lagi): cukup arahkan volumenya.
    fade(el, volTrek(want), TREK_CERITA.has(want) ? FADE_CERITA_MS : FADE_QUICK_MS);
    return;
  }
  if (!MUSIC_LOOP[want]) {
    try {
      el.currentTime = 0; // jingle selalu dari awal
    } catch {
      /* abaikan: belum siap */
    }
  }
  cancelFade(el);
  aturVol(el, 0);
  let p: Promise<void> | undefined;
  try { p = el.play(); } catch { p = undefined; }
  const masihRelevan = () => targetEl === el && targetTrack() === want;
  if (p && typeof p.then === 'function') {
    memulai.add(el);
    p.then(
      () => {
        memulai.delete(el);
        blocked = false;
        // play() bisa selesai sesudah pemain keluar, membisukan, atau berganti tema: jangan hidupkan trek yang tidak relevan.
        if (!masihRelevan()) { if (targetEl !== el) hentikan(el); return; }
        fade(el, volTrek(want), TREK_CERITA.has(want) ? FADE_CERITA_MS : FADE_IN_MS);
      },
      () => {
        memulai.delete(el);
        // Ditolak browser (autoplay) atau berkas bermasalah: jangan melempar.
        blocked = true;
        userGesture = false;
        if (targetEl === el) { targetEl = null; playing = null; }
        el.pause();
        catatSekali('Musik menunggu interaksi pengguna (kebijakan autoplay browser).');
      },
    );
  } else if (masihRelevan()) {
    fade(el, volTrek(want), TREK_CERITA.has(want) ? FADE_CERITA_MS : FADE_IN_MS);
  }
}

/**
 * Memilih musik latar. `owner` opsional: bila diisi dan bukan pemilik aktif,
 * permintaan diabaikan supaya tidak ada dua trek berbunyi bersamaan.
 */
export function setTrack(track: Track, owner?: string): void {
  if (owner !== undefined && owner !== activeOwner()) return;
  if (desired === track) return; // T-040: unchanged track = no-op (screen updates call this on every render)
  desired = track;
  applyMusic();
}

/** true bila musik masih menunggu interaksi pengguna. */
export function needsUserGesture(): boolean {
  return !userGesture || blocked;
}

if (typeof document !== 'undefined') {
  // Tab di latar belakang: musik dihentikan, dilanjutkan saat kembali.
  // Elemen audio-nya dipakai ulang, jadi tidak ada instance yang menumpuk.
  document.addEventListener('visibilitychange', () => {
    applyMusic();
    applyAmbience();
  });
}

// -------------------------------------------------------------------- efek

const N = (semitone: number) => 440 * Math.pow(2, (semitone - 9) / 12); // 0 = C4

function tone(
  bus: GainNode,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  wave: OscillatorType,
  detune = 0,
) {
  const ctx = bus.context;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(env).connect(bus);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noise(bus: GainNode, start: number, dur: number, gain: number, hp = 2400, bp?: [number, number]) {
  const ctx = bus.context;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = bp ? 'bandpass' : 'highpass';
  filt.frequency.value = hp;
  // bp = [frekuensi akhir, Q]: sapuan pita (kertas bergeser).
  if (bp) { filt.Q.value = bp[1]; filt.frequency.setValueAtTime(hp, start); filt.frequency.exponentialRampToValueAtTime(bp[0], start + dur); }
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(filt).connect(env).connect(bus);
  src.start(start);
}

const sfxTerakhir = new Map<Sfx, number>();
const SFX_REDAM = new Set<Sfx>(['taruh', 'kertas', 'pesanKirim', 'pesanTerima', 'ketuk', 'konfirmasi', 'batal']);
/** T-040: every sound has a minimum gap (fast answers cannot stack the same sound) and at most SFX_SUARA_MAKS voices sound at once. */
const SFX_JEDA_MS = 70;
const SFX_SUARA_MAKS = 6;
const SFX_UMUR_S = 0.9; // longest effect (pesanTerima ~0.8 s) + tail
const suaraSfx: { g: GainNode; akhir: number }[] = [];

function lepasSuara(v: { g: GainNode }, cepat: boolean): void {
  if (!ctx) return;
  if (cepat) {
    try { v.g.gain.cancelScheduledValues(ctx.currentTime); v.g.gain.setTargetAtTime(0, ctx.currentTime, 0.01); } catch { /* ignore */ }
  }
  window.setTimeout(() => { try { v.g.disconnect(); } catch { /* already */ } }, cepat ? 80 : 50);
}
export function playSfx(name: Sfx): void {
  // T-036 Fix 2 / T-038 Fix 1: log for the test tool, compiled in only for dev or a VITE_UJI_AUDIO=on build.
  if (UJI_AUDIO) (globalThis as { __sfxLog?: string[] }).__sfxLog?.push(name);
  if (!ctx || !sfxBus || prefs.muted || !prefs.sfxEnabled) return;
  const kini = typeof performance !== 'undefined' ? performance.now() : Date.now();
  // Peredam ketukan beruntun: efek mode cerita 80 ms (lama), semua efek lain paling sedikit 70 ms (T-040).
  if (kini - (sfxTerakhir.get(name) ?? -1e9) < (SFX_REDAM.has(name) ? 80 : SFX_JEDA_MS)) return;
  sfxTerakhir.set(name, kini);
  if (ctx.state !== 'running') ctx.resume().catch(() => { /* ditolak browser: dicoba lagi pada interaksi berikutnya */ });
  const t = ctx.currentTime;
  // Voices that already ended leave the list; when the cap is reached the OLDEST is faded out in ~10 ms (no clipping pile-up).
  for (let i = suaraSfx.length - 1; i >= 0; i--) if (suaraSfx[i].akhir <= t) suaraSfx.splice(i, 1);
  while (suaraSfx.length >= SFX_SUARA_MAKS) lepasSuara(suaraSfx.shift()!, true);
  const g = ctx.createGain();
  g.gain.value = 1;
  g.connect(sfxBus);
  const v = { g, akhir: t + SFX_UMUR_S };
  suaraSfx.push(v);
  bunyikan(name, g, t);
  window.setTimeout(() => {
    const i = suaraSfx.indexOf(v);
    if (i >= 0) { suaraSfx.splice(i, 1); lepasSuara(v, false); }
  }, SFX_UMUR_S * 1000 + 100);
}

/** Nada mirip marimba/bel: dasar + parsial 4x yang cepat hilang (notifikasi pesan, denting konfirmasi). */
function bel(bus: GainNode, freq: number, start: number, dur: number, gain: number) {
  tone(bus, freq, start, dur, gain, 'sine');
  tone(bus, freq * 4, start, dur * 0.25, gain * 0.22, 'sine');
}

/** Pop lembut: sinus yang nadanya turun cepat. */
function pop(bus: GainNode, start: number, f0: number, f1: number, dur: number, gain: number) {
  const ctx = bus.context;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, start);
  osc.frequency.exponentialRampToValueAtTime(f1, start + dur);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(env).connect(bus);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Rekam satu efek ke OfflineAudioContext (bus = volume SFX bawaan) untuk pengukuran peak/RMS tanpa mendengar (T-036). */
export async function rekamSfx(name: Sfx, detik = 1.2): Promise<Float32Array> {
  const off = new OfflineAudioContext(1, Math.round(44100 * detik), 44100);
  const bus = off.createGain();
  bus.gain.value = DEFAULT_PREFS.sfxVolume;
  bus.connect(off.destination);
  bunyikan(name, bus, 0.01);
  return (await off.startRendering()).getChannelData(0);
}

function bunyikan(name: Sfx, sfxBus: GainNode, t: number): void {
  switch (name) {
    case 'pilih':
      tone(sfxBus, N(16), t, 0.09, 0.3, 'triangle');
      tone(sfxBus, N(23), t + 0.045, 0.1, 0.22, 'triangle');
      break;
    case 'bukti':
      tone(sfxBus, N(12), t, 0.07, 0.26, 'square');
      noise(sfxBus, t + 0.02, 0.07, 0.1, 3200);
      break;
    case 'kirim':
      tone(sfxBus, N(12), t, 0.12, 0.3, 'triangle');
      tone(sfxBus, N(19), t + 0.09, 0.14, 0.28, 'triangle');
      tone(sfxBus, N(24), t + 0.18, 0.2, 0.24, 'sine');
      break;
    case 'naik':
      [12, 16, 19, 24].forEach((s, i) => tone(sfxBus!, N(s), t + i * 0.075, 0.18, 0.26, 'square'));
      break;
    case 'salah':
      tone(sfxBus, N(3), t, 0.16, 0.26, 'sawtooth');
      tone(sfxBus, N(-2), t + 0.1, 0.24, 0.2, 'sawtooth');
      break;
    case 'tik':
      tone(sfxBus, N(28), t, 0.035, 0.12, 'square');
      break;
    case 'papan':
      [7, 12, 16].forEach((s, i) => tone(sfxBus!, N(s), t + i * 0.055, 0.14, 0.2, 'triangle'));
      break;
    case 'confetti':
      for (let i = 0; i < 9; i++) {
        tone(sfxBus, N(19 + (i % 4) * 5), t + i * 0.05, 0.14, 0.14, 'sine', i * 8);
        noise(sfxBus, t + i * 0.05, 0.05, 0.04, 5000);
      }
      break;
    case 'taruh':
      // T-036 dokumen ke baki (~0,45 s): kibasan kertas (tiga desis pendek) + ketuk kayu lembut + denting konfirmasi kecil.
      // Netral: sama untuk semua baki (bukan penilaian).
      noise(sfxBus, t, 0.05, 0.085, 2600, [1400, 1.2]);
      noise(sfxBus, t + 0.045, 0.05, 0.077, 2200, [1200, 1.2]);
      noise(sfxBus, t + 0.09, 0.06, 0.06, 1800, [900, 1.2]);
      pop(sfxBus, t + 0.15, 620, 380, 0.06, 0.272);
      noise(sfxBus, t + 0.15, 0.012, 0.1, 3000);
      bel(sfxBus, N(24), t + 0.21, 0.2, 0.085);
      bel(sfxBus, N(31), t + 0.27, 0.2, 0.068);
      break;
    case 'kertas':
      // T-036 berkas dibuka (~0,35 s): kertas bergeser (desis pita yang menyapu turun) + pop lembut + ekor terang kecil.
      noise(sfxBus, t, 0.16, 0.207, 4200, [1600, 0.9]);
      pop(sfxBus, t + 0.13, 900, 420, 0.07, 0.322);
      bel(sfxBus, N(28), t + 0.16, 0.18, 0.081);
      bel(sfxBus, N(35), t + 0.2, 0.15, 0.057);
      break;
    case 'pesanKirim':
      // T-036 pesan terkirim: satu tik bel pendek & tinggi.
      bel(sfxBus, N(31), t, 0.08, 0.144);
      break;
    case 'pesanTerima':
      // T-036 pesan masuk (~0,6 s): tiga nada naik ala notifikasi ponsel, bunyi mirip marimba/bel (sintesis asli).
      bel(sfxBus, N(24), t, 0.22, 0.168);
      bel(sfxBus, N(28), t + 0.12, 0.22, 0.168);
      bel(sfxBus, N(31), t + 0.24, 0.5, 0.18);
      break;
    case 'ketuk':
      // Tanda lajur / buka pilihan: tick lembut.
      tone(sfxBus, N(31), t, 0.03, 0.06, 'sine');
      noise(sfxBus, t, 0.015, 0.02, 4200);
      break;
    case 'konfirmasi':
      // Tindakan dijalankan (bukan hadiah, bukan penilaian).
      tone(sfxBus, N(16), t, 0.1, 0.09, 'triangle');
      tone(sfxBus, N(23), t + 0.06, 0.14, 0.07, 'sine');
      break;
    case 'batal':
      // Pembatalan: dua nada turun pelan, netral.
      tone(sfxBus, N(14), t, 0.07, 0.07, 'sine');
      tone(sfxBus, N(9), t + 0.05, 0.09, 0.06, 'sine');
      break;
    case 'masuk':
      tone(sfxBus, N(9), t, 0.1, 0.22, 'sine');
      tone(sfxBus, N(16), t + 0.06, 0.14, 0.18, 'sine');
      break;
  }
}

/** Nama efek dari Unity -> Sfx yang sah. Nama asing diabaikan. */
const UNITY_SFX: Record<string, Sfx> = {
  pilih: 'pilih',
  select: 'pilih',
  tap: 'pilih',
  hotspot: 'pilih',
  bukti: 'bukti',
  evidence: 'bukti',
  ambil: 'bukti',
  kirim: 'kirim',
  submit: 'kirim',
  naik: 'naik',
  benar: 'naik',
  correct: 'naik',
  selesai: 'naik',
  salah: 'salah',
  wrong: 'salah',
  tik: 'tik',
  tick: 'tik',
  papan: 'papan',
  board: 'papan',
  confetti: 'confetti',
  menang: 'confetti',
  masuk: 'masuk',
  enter: 'masuk',
  join: 'masuk',
};

/** Efek yang diminta Unity. Data dari Unity tidak pernah dipercaya buta. */
export function playSfxFromUnity(name: string): void {
  if (typeof name !== 'string' || name.length > 40) return;
  const sfx = UNITY_SFX[name.trim().toLowerCase()];
  if (sfx) playSfx(sfx);
}

// --------------------------------------------------------------- prefs API

export function getAudioPrefs(): AudioPrefs {
  return prefs;
}

export function subscribeAudio(cb: (p: AudioPrefs) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMuted(muted: boolean): void {
  prefs = { ...prefs, muted, chosen: true };
  applyPrefs();
}

export function setMusicEnabled(musicEnabled: boolean): void {
  prefs = { ...prefs, musicEnabled, chosen: true };
  applyPrefs();
}

export function setMusicVolume(v: number): void {
  prefs = { ...prefs, musicVolume: Math.min(1, Math.max(0, v)), chosen: true };
  applyPrefs();
}

export function setSfxEnabled(on: boolean): void {
  prefs = { ...prefs, sfxEnabled: on, chosen: true };
  applyPrefs();
}

/** Musik & suasana mode cerita (pilihan pemain; tersimpan). */
export function setMusikCerita(on: boolean): void {
  prefs = { ...prefs, musikCerita: on, chosen: true };
  applyPrefs();
}

/** Halaman cerita aktif/tidak (runtime, tidak disimpan). Keluar dari cerita = trek & suasana cerita berhenti. */
export function setModeCerita(on: boolean): void {
  modeCerita = on;
  if (!on) suasanaDiminta = null;
  applyMusic();
  applyAmbience();
}

/** Musik & suasana cerita akan berbunyi bila diizinkan sekarang (untuk tampilan menu). */
export function musikCeritaAktif(): boolean {
  return !prefs.muted && prefs.musikCerita !== false;
}

// ------------------------------------------------------------ suasana (ambience) cerita

/**
 * SUASANA tempat, disintesis (noise ter-filter, tanpa berkas): dekorasi suasana yang sangat tipis, BUKAN bukti kasus.
 * 'bengkel' = aktivitas jauh teredam; 'jalan' = desir lalu lintas jauh yang naik-turun pelan (tanpa klakson/benturan).
 * Kantor & obrolan: tanpa suasana (musik saja). Mengikuti sakelar musik cerita & master mute; berhenti saat tab tersembunyi.
 */
export type Suasana = 'bengkel' | 'jalan' | null;
let suasanaDiminta: Suasana = null;
let suasanaAktif: { jenis: Exclude<Suasana, null>; out: GainNode; src: AudioBufferSourceNode; lfo?: OscillatorNode; simpul: AudioNode[]; vol: number } | null = null;

/** Hentikan satu lapis suasana: `segera` = bisu/tab tersembunyi/keluar halaman (tanpa sisa); selain itu memudar ~1 s. Simpul dilepas. */
function lepasSuasana(s: NonNullable<typeof suasanaAktif>, segera: boolean): void {
  if (!ctx) return;
  const lepas = () => { for (const n of s.simpul) { try { n.disconnect(); } catch { /* sudah lepas */ } } };
  try {
    s.out.gain.cancelScheduledValues(ctx.currentTime);
    if (segera) {
      s.out.gain.setValueAtTime(0, ctx.currentTime);
      s.src.stop(); s.lfo?.stop();
      lepas();
    } else {
      s.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      const t = ctx.currentTime + 1.2;
      s.src.onended = lepas;
      s.src.stop(t); s.lfo?.stop(t);
    }
  } catch { lepas(); }
}
// T-036: suasana 8 dB lebih pelan (x0,4).
const GAIN_SUASANA: Record<Exclude<Suasana, null>, number> = { bengkel: 0.02, jalan: 0.028 };

export function setSuasana(jenis: Suasana): void {
  suasanaDiminta = jenis;
  applyAmbience();
}

function bufferCoklat(detik: number): AudioBuffer | null {
  if (!ctx) return null;
  const n = Math.floor(ctx.sampleRate * detik);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = last * 3.5; }
  // Sambungan loop halus: ujung disilangkan ke awal.
  const x = Math.floor(ctx.sampleRate * 0.3);
  for (let i = 0; i < x; i++) { const k = i / x; ch[i] = ch[i] * k + ch[n - x + i] * (1 - k); }
  return buf;
}

function applyAmbience(): void {
  if (!ctx || !ambBus) return;
  const hidden = typeof document !== 'undefined' && document.hidden;
  const want: Suasana = !modeCerita || prefs.muted || prefs.musikCerita === false || hidden || !userGesture ? null : suasanaDiminta;
  const vol = (j: Exclude<Suasana, null>) => GAIN_SUASANA[j] * Math.min(1, Math.max(0, prefs.musicVolume)) * 2;
  if (suasanaAktif && suasanaAktif.jenis === want) {
    // T-040: same place + same volume = no-op (no new ramp on every answer).
    const v = vol(want);
    if (Math.abs(v - suasanaAktif.vol) > 0.0001) {
      suasanaAktif.out.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
      suasanaAktif.vol = v;
    }
    return;
  }
  if (suasanaAktif) {
    const lama = suasanaAktif;
    suasanaAktif = null;
    // Berganti tempat = memudar; bisu, tab tersembunyi, atau keluar halaman = berhenti seketika tanpa sisa.
    lepasSuasana(lama, want === null);
  }
  if (!want) return;
  const buf = bufferCoklat(8);
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = want === 'jalan' ? 650 : 900;
  const out = ctx.createGain();
  out.gain.value = 0;
  const swell = ctx.createGain();
  swell.gain.value = 0.75;
  src.connect(lp).connect(swell).connect(out).connect(ambBus);
  const simpul: AudioNode[] = [src, lp, swell, out];
  let lfo: OscillatorNode | undefined;
  if (want === 'jalan') {
    // Kendaraan jauh lewat: amplitudo naik-turun sangat pelan (sekitar 11 detik), bukan suara tunggal yang menonjol.
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const dalam = ctx.createGain();
    dalam.gain.value = 0.25;
    lfo.connect(dalam).connect(swell.gain);
    simpul.push(lfo, dalam);
    lfo.start();
  } else {
    // Bengkel jauh: lapisan tengah tipis supaya terdengar 'ruang kerja', tanpa dentang.
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const tipis = ctx.createGain();
    tipis.gain.value = 0.25;
    lp.connect(bp).connect(tipis).connect(out);
    simpul.push(bp, tipis);
  }
  src.start();
  out.gain.setTargetAtTime(vol(want), ctx.currentTime, 0.8);
  suasanaAktif = { jenis: want, out, src, lfo, simpul, vol: vol(want) };
}

export function setSfxVolume(v: number): void {
  prefs = { ...prefs, sfxVolume: Math.min(1, Math.max(0, v)), chosen: true };
  applyPrefs();
}

/**
 * Halaman host/proyektor memanggil ini supaya backsound utama aktif dan
 * halaman itu menjadi pemilik musik, tanpa menimpa pilihan pengguna.
 */
export function preferMusicOn(): void {
  claimMusicOwner('host');
  if (prefs.chosen) {
    applyMusic();
    return;
  }
  prefs = { ...prefs, musicEnabled: true, musicVolume: 0.5 };
  applyPrefs();
}

export function audioReady(): boolean {
  return ready();
}
