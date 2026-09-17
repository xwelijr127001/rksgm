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

export type Track = 'lobby' | 'game' | 'podium' | null;
export type Sfx =
  | 'pilih'
  | 'bukti'
  | 'kirim'
  | 'naik'
  | 'salah'
  | 'tik'
  | 'papan'
  | 'confetti'
  | 'masuk';

export interface AudioPrefs {
  muted: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  /** true bila pengguna sudah memilih sendiri (jangan ditimpa default halaman). */
  chosen: boolean;
}

/** Ganti musik = timpa berkas ini, atau ubah satu baris di sini. */
const MUSIC_FILES: Record<Exclude<Track, null>, string> = {
  lobby: '/audio/lobby.mp3',
  game: '/audio/gameplay.mp3',
  podium: '/audio/podium.mp3',
};

/** Lobby & gameplay berulang; jingle podium hanya sekali. */
const MUSIC_LOOP: Record<Exclude<Track, null>, boolean> = {
  lobby: true,
  game: true,
  podium: false,
};

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

/** Interaksi pengguna sudah terjadi (syarat autoplay). */
let userGesture = false;
/** play() pernah ditolak browser -> perlu gesture lagi. */
let blocked = false;

function ready(): boolean {
  return ctx !== null && ctx.state === 'running';
}

/** Dipanggil pada interaksi pengguna pertama (AudioUnlocker). */
export function initAudio(): void {
  userGesture = true;
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    applyMusic();
    return;
  }
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = prefs.muted ? 0 : 1;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = prefs.sfxVolume;
    sfxBus.connect(master);
    if (ctx.state === 'suspended') void ctx.resume();
  } else {
    catatSekali('Web Audio tidak tersedia - efek suara dimatikan.');
  }
  applyMusic();
}

function applyPrefs() {
  if (master) master.gain.value = prefs.muted ? 0 : 1;
  if (sfxBus) sfxBus.gain.value = prefs.sfxVolume;
  savePrefs(prefs);
  notify();
  applyMusic();
}

// ------------------------------------------------------------------- musik

const els = new Map<string, HTMLAudioElement>();
const rusak = new Set<string>();
const fades = new Map<HTMLAudioElement, number>();

/** Trek yang diminta halaman, belum tentu yang berbunyi. */
let desired: Track = null;
/** Trek yang sedang berbunyi (tepat satu, atau tidak ada). */
let playing: Exclude<Track, null> | null = null;

function cancelFade(el: HTMLAudioElement) {
  const id = fades.get(el);
  if (id !== undefined) {
    window.clearInterval(id);
    fades.delete(el);
  }
}

function fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  cancelFade(el);
  const from = el.volume;
  const target = Math.min(1, Math.max(0, to));
  if (ms <= 0 || Math.abs(target - from) < 0.01) {
    el.volume = target;
    if (done) done();
    return;
  }
  const mulai = Date.now();
  const id = window.setInterval(() => {
    const k = Math.min(1, (Date.now() - mulai) / ms);
    el.volume = from + (target - from) * k;
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
  if (ada) return ada;
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
export function forceMusic(on: boolean): void {
  paksaMusik = on;
  applyMusic();
}

/** Trek yang benar-benar boleh berbunyi sekarang. */
function targetTrack(): Track {
  if (!desired) return null;
  if (prefs.muted || !(prefs.musicEnabled || paksaMusik)) return null;
  if (!userGesture) return null;
  if (typeof document !== 'undefined' && document.hidden) return null;
  if (rusak.has(MUSIC_FILES[desired])) return null;
  return desired;
}

function applyMusic() {
  if (typeof window === 'undefined') return;
  const want = targetTrack();

  // Matikan yang sedang berbunyi bila bukan yang diinginkan.
  if (playing !== null && playing !== want) {
    const lama = els.get(MUSIC_FILES[playing]);
    playing = null;
    if (lama) {
      fade(lama, 0, FADE_OUT_MS, () => {
        lama.pause();
      });
    }
  }
  if (!want) return;

  const el = element(want);
  if (!el) return;
  if (playing === want && !el.paused) {
    fade(el, musicVolume(), FADE_QUICK_MS); // hanya menyesuaikan volume
    return;
  }

  playing = want;
  if (!MUSIC_LOOP[want]) {
    try {
      el.currentTime = 0; // jingle selalu dari awal
    } catch {
      /* abaikan: belum siap */
    }
  }
  cancelFade(el);
  el.volume = 0;
  const p: Promise<void> | undefined = el.play();
  if (p && typeof p.then === 'function') {
    p.then(
      () => {
        blocked = false;
        if (playing === want) fade(el, musicVolume(), FADE_IN_MS);
      },
      () => {
        // Ditolak browser (autoplay) atau berkas bermasalah: jangan melempar.
        blocked = true;
        userGesture = false;
        if (playing === want) playing = null;
        el.pause();
        catatSekali('Musik menunggu interaksi pengguna (kebijakan autoplay browser).');
      },
    );
  } else {
    fade(el, musicVolume(), FADE_IN_MS);
  }
}

/**
 * Memilih musik latar. `owner` opsional: bila diisi dan bukan pemilik aktif,
 * permintaan diabaikan supaya tidak ada dua trek berbunyi bersamaan.
 */
export function setTrack(track: Track, owner?: string): void {
  if (owner !== undefined && owner !== activeOwner()) return;
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
  if (!ctx) return;
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

function noise(bus: GainNode, start: number, dur: number, gain: number, hp = 2400) {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = hp;
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(filt).connect(env).connect(bus);
  src.start(start);
}

export function playSfx(name: Sfx): void {
  if (!ctx || !sfxBus || prefs.muted) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime;
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
