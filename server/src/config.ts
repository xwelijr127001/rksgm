import fs from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import type { IdPaket } from '../../shared/bankSoal';
import { MISSIONS_ACARA } from '../../shared/missions.acara';

/**
 * Cari root repo dengan menaiki folder sampai menemukan folder `client/` + `shared/`.
 * Diperlukan karena kedalaman __dirname berbeda antara mode dev (server/src) dan
 * hasil build (server/dist/server/src).
 */
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'client')) && fs.existsSync(path.join(dir, 'shared'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export const REPO_ROOT = findRepoRoot(__dirname);

/**
 * Muat .env di root repo bila ada (parser kecil, tanpa dependency).
 * Variabel yang sudah ada di environment tidak ditimpa.
 */
function loadDotEnv(): void {
  const candidates = [path.join(REPO_ROOT, '.env'), path.resolve(process.cwd(), '.env')];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined && value !== '') process.env[key] = value;
    }
    return;
  }
}

loadDotEnv();

/** Alamat IPv4 LAN pertama (untuk QR peserta). */
export function detectLanIp(): string | null {
  const ifaces = networkInterfaces();
  const candidates: string[] = [];
  for (const list of Object.values(ifaces)) {
    for (const ni of list ?? []) {
      if (ni.family !== 'IPv4' || ni.internal) continue;
      candidates.push(ni.address);
    }
  }
  const isPrivate = (ip: string) =>
    /^192\.168\./.test(ip) ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  return candidates.find(isPrivate) ?? candidates[0] ?? null;
}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Paket soal untuk room baru bila host tidak memilih. Bawaan `acara`; selama paket acara
 * belum berisi (shared/missions.acara.ts kosong) jatuh ke `latihan` supaya room tetap bisa main.
 */
function pilihPaket(v: string | undefined): IdPaket {
  const mau = (v || 'acara').toLowerCase().trim();
  if (mau === 'latihan') return 'latihan';
  return MISSIONS_ACARA.length > 0 ? 'acara' : 'latihan';
}

export const CONFIG = {
  port: num(process.env.PORT, 4000),
  host: process.env.HOST || '0.0.0.0',
  /**
   * Alamat yang dipakai QR peserta. Kosongkan untuk deteksi IP LAN otomatis.
   * JANGAN pakai localhost bila peserta memakai perangkat lain.
   */
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  /** Port dev Vite; dipakai untuk menyusun URL QR saat mode development. */
  clientDevPort: num(process.env.CLIENT_PORT, 5173),
  dbFile: process.env.DB_FILE
    ? path.resolve(REPO_ROOT, process.env.DB_FILE)
    : path.join(REPO_ROOT, 'data', 'raksa-game.db'),
  clientDist: process.env.CLIENT_DIST
    ? path.resolve(REPO_ROOT, process.env.CLIENT_DIST)
    : path.join(REPO_ROOT, 'client', 'dist'),
  /**
   * Folder hasil build Unity Web (isi: index.html + Build/*).
   * Dibuat oleh `npm run unity:build`. Bila belum ada, game memakai mode ringan
   * (adegan SVG) dan itu BUKAN error.
   */
  unityBuildDir: process.env.UNITY_BUILD_DIR
    ? path.resolve(REPO_ROOT, process.env.UNITY_BUILD_DIR)
    : path.join(REPO_ROOT, 'unity', 'Build', 'Web'),
  /**
   * Adegan 3D Unity. Default MATI: game memakai adegan SVG 2D yang sudah lengkap.
   * Nyalakan dengan UNITY_3D=on setelah komposisi diorama selesai disetel.
   */
  unity3d: (process.env.UNITY_3D || '').toLowerCase() === 'on',
  /** Batas peserta per room. */
  maxPlayersPerRoom: num(process.env.MAX_PLAYERS, 150),
  /** Paket soal room baru (RAKSA_PAKET=acara|latihan). Host bisa memilih lain saat membuat room. */
  paketBawaan: pilihPaket(process.env.RAKSA_PAKET),
  /**
   * PIN panitia (opsional). Bila diisi: membuat room dan API bank soal yang menulis / membuka
   * kunci mewajibkan PIN ini. Kosong = terbuka seperti halaman host (batasan yang disadari).
   */
  panitiaPin: (process.env.PANITIA_PIN || '').trim(),
  /** Halaman awal boleh mengiklankan room yang sedang di lobby (RAKSA_IKLAN_ROOM=off untuk mematikan). */
  iklanRoom: (process.env.RAKSA_IKLAN_ROOM || 'on').toLowerCase().trim() !== 'off',
  /**
   * Legacy experiences (solo story, Mini Games / practice missions, legacy quiz rooms, Mandarin UI) are outside the
   * PRD v0.2 MVP (PRD p.4 "Di Luar Lingkup"). They are preserved, but OFF unless RAKSA_LEGACY=on
   * (docs/prd-v02/DECISIONS.md D-03). Off = their API routes and the default Socket.IO namespace are refused.
   */
  legacy: (process.env.RAKSA_LEGACY || 'off').toLowerCase().trim() === 'on',
  /** T-037 (pemilik 18 Nov): kartu demo (auto-1) di pemilih /cerita hanya untuk uji internal. Bawaan off. */
  demoCerita: (process.env.RAKSA_DEMO_CERITA || 'off').toLowerCase().trim() === 'on',
  /**
   * Seeded scenarios (T-028, story/seed/publish.ts): at start the server publishes the scenarios that ship with the code
   * (Episode 2 "Truk Trailer di Jalan Tol" as a hosted room) if they are not there yet. Idempotent: a start that finds
   * the same content writes nothing. STORY_SEED=off skips it.
   */
  storySeed: (process.env.STORY_SEED || 'on').toLowerCase().trim() !== 'off',
  /**
   * Number of trusted reverse-proxy hops in front of Node (e.g. 1 behind Apache/nginx). 0 = X-Forwarded-For is ignored.
   * Needed so per-IP rate limits see the real client instead of the proxy (docs/prd-v02/HOSTING.md).
   */
  trustProxyHops: num(process.env.TRUST_PROXY_HOPS, 0),
  /**
   * Who may embed the app in a frame (CSP frame-ancestors), e.g. "'self' https://raksaonline.com". Default 'self'
   * (no third-party framing) until IT sets the embedding policy (docs/prd-v02/DECISIONS.md D-24, HOSTING.md).
   */
  frameAncestors: frameAncestorsFrom(process.env.FRAME_ANCESTORS),
};

/** Keep only valid frame-ancestors sources (no header injection); empty/invalid input falls back to 'self'. */
export function frameAncestorsFrom(raw: string | undefined): string {
  const ok = (raw ?? '')
    .split(/\s+/)
    .filter((t) => /^('self'|'none'|https?:\/\/(\*\.)?[a-z0-9.-]+(:\d{1,5})?)$/i.test(t));
  return ok.length ? ok.join(' ') : "'self'";
}

/** true bila hasil build client tersedia dan disajikan oleh server ini. */
export function servingBuiltClient(): boolean {
  return fs.existsSync(path.join(CONFIG.clientDist, 'index.html'));
}

/**
 * Alamat dasar untuk tautan/QR peserta.
 * - Produksi (client sudah di-build): port server.
 * - Development (client jalan di Vite): port dev Vite.
 * Selalu bisa ditimpa dengan PUBLIC_BASE_URL.
 */
export function publicBaseUrl(): string {
  if (CONFIG.publicBaseUrl) return CONFIG.publicBaseUrl;
  const ip = detectLanIp() ?? 'localhost';
  const port = servingBuiltClient() ? CONFIG.port : CONFIG.clientDevPort;
  return `http://${ip}:${port}`;
}
