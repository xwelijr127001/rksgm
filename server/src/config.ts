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
};

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
