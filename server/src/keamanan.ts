/**
 * T-038 app-level hardening (team/REVIEW.md "Security review (2026-11-18)"): allowed browser origins for HTTP CORS and
 * the Engine.IO handshake, app-wide response headers, the legacy PIN brute-force brake, and the production PIN rule.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type http from 'node:http';
import type express from 'express';
import { CONFIG, publicBaseUrl } from './config';
import { RateLimiter } from './story/auth/rateLimit';

// ------------------------------------------------------------------ origins

const PRIVAT = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

const asalDari = (url: string): string | null => {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return null;
  }
};

/** RAKSA_ORIGINS (comma/space separated). Empty = the configured public URL only (same-origin is always allowed). */
export function daftarAsal(): string[] {
  const dariEnv = CONFIG.origins.map(asalDari).filter((o): o is string => Boolean(o));
  if (dariEnv.length) return dariEnv;
  const pub = asalDari(CONFIG.publicBaseUrl || publicBaseUrl());
  return pub ? [pub] : [];
}

const pertama = (v: string | string[] | undefined): string | undefined =>
  (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim() || undefined;

/**
 * The request's own origin (scheme + authority). Behind trusted proxy hops the scheme and host come from
 * X-Forwarded-Proto / X-Forwarded-Host (nginx must overwrite them at the edge); otherwise http + Host (Node never
 * terminates TLS itself).
 */
export const asalPermintaan = (headers: http.IncomingHttpHeaders): string => {
  const percaya = CONFIG.trustProxyHops > 0;
  const proto = ((percaya && pertama(headers['x-forwarded-proto'])) || 'http').toLowerCase();
  const host = ((percaya && pertama(headers['x-forwarded-host'])) || headers.host || '').toLowerCase();
  return asalDari(`${proto}://${host}`) ?? '';
};

/**
 * May a browser on `origin` talk to this server? No Origin header (non-browser clients, same-origin navigations) is
 * allowed; same-origin (scheme + host + port equal to the request's own origin) is allowed; otherwise the origin must be listed. Outside
 * production, loopback/LAN origins are allowed too (Vite dev server on another port, phones on the LAN).
 */
export function asalDiizinkan(origin: string | undefined, headers: http.IncomingHttpHeaders): boolean {
  if (!origin) return true;
  const o = asalDari(origin);
  if (!o) return false;
  const url = new URL(o);
  if (o === asalPermintaan(headers)) return true;
  if (daftarAsal().includes(o)) return true;
  return process.env.NODE_ENV !== 'production' && PRIVAT.test(url.hostname);
}

/** cors() options delegate: reflect only allowed origins (no CORS headers otherwise, so the browser blocks reads). */
export const opsiCors = (req: express.Request, cb: (err: Error | null, opts: { origin: boolean }) => void): void => {
  cb(null, { origin: asalDiizinkan(req.header('origin'), req.headers) });
};

/** Engine.IO allowRequest: refuse cross-origin handshakes (covers direct WebSocket upgrades, which CORS does not). */
export const izinkanHandshake = (req: http.IncomingMessage, cb: (err: string | null | undefined, ok: boolean) => void): void => {
  const ok = asalDiizinkan(req.headers.origin, req.headers);
  if (!ok) console.warn(`[keamanan] handshake ditolak dari origin ${String(req.headers.origin).slice(0, 120)}`);
  cb(ok ? null : 'origin tidak diizinkan', ok);
};

// ------------------------------------------------------------------ headers

/** Resource CSP staged in REPORT-ONLY mode (RAKSA_CSP_REPORT=on): violations show in the browser console, nothing is blocked. */
export const CSP_LAPORAN = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** App-wide headers. frame-ancestors / X-Frame-Options stay where they were (index.ts, pages only). */
export const headerKeamanan: express.RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (CONFIG.cspReport && !req.path.startsWith('/api/')) res.setHeader('Content-Security-Policy-Report-Only', CSP_LAPORAN);
  next();
};

// ------------------------------------------------------------------ PIN panitia

/** Compare without leaking the position of a difference through timing. */
export function samaAman(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const PIN_MAKS_GAGAL = 8;
export const PIN_JENDELA_MS = 5 * 60_000;
export const PIN_GLOBAL_MAKS = 60;
export const PIN_GLOBAL_JENDELA_MS = 10 * 60_000;
export const PIN_GLOBAL_KUNCI_MS = 10 * 60_000;

/**
 * PIN brake: 8 wrong PINs per trusted client IP in 5 minutes, AND a global budget of 60 wrong PINs in 10 minutes across
 * all IPs, which locks PIN checks for everyone for 10 minutes (a distributed guess cannot get around the per-IP bucket).
 * Every lockout is logged.
 */
export class PembatasPin {
  private perIp = new RateLimiter(PIN_MAKS_GAGAL, PIN_JENDELA_MS);
  private global = new RateLimiter(PIN_GLOBAL_MAKS, PIN_GLOBAL_JENDELA_MS);
  private globalSampai = 0;

  constructor(private readonly now: () => number = () => Date.now()) {}

  /**
   * Order (T-038 Fix 2, Lead decision): global lock -> per-IP lock -> timing-safe compare. While the global budget is
   * saturated NO unauthenticated PIN is verified (no compare at all, generic "terkunci"), for the whole lock; the lock
   * start is logged once. Staff hosts keep working: they skip the PIN entirely (index.ts, x-staff-token / staffToken).
   */
  cek(pin: unknown, ip: string, benar: string): 'ok' | 'salah' | 'terkunci' {
    if (!benar) return 'ok';
    if (this.now() < this.globalSampai) return 'terkunci';
    if (this.perIp.blocked(ip)) return 'terkunci';
    if (typeof pin === 'string' && samaAman(pin, benar)) return 'ok';
    this.perIp.record(ip);
    if (this.perIp.blocked(ip)) console.warn(`[keamanan] PIN panitia dikunci 5 menit untuk ${ip} (${PIN_MAKS_GAGAL} salah)`);
    this.global.record('*');
    if (this.global.blocked('*')) {
      this.globalSampai = this.now() + PIN_GLOBAL_KUNCI_MS;
      this.global.reset();
      console.warn(`[keamanan] PIN panitia dikunci 10 menit untuk SEMUA alamat (${PIN_GLOBAL_MAKS} salah dalam 10 menit); PIN tidak diperiksa sampai kunci lepas, staf host tetap bisa masuk`);
    }
    return 'salah';
  }

  /** For tests: start a global lock as if the budget had just been used up. */
  jenuhkan(): void {
    this.globalSampai = this.now() + PIN_GLOBAL_KUNCI_MS;
  }

  reset(): void {
    this.perIp.reset();
    this.global.reset();
    this.globalSampai = 0;
  }
}

/** Legacy rooms in production need PANITIA_PIN; without it the legacy routes and namespace are refused. */
export const legacyTanpaPin = (): boolean =>
  CONFIG.legacy && process.env.NODE_ENV === 'production' && !CONFIG.panitiaPin;
export const PESAN_LEGACY_TANPA_PIN = 'Fitur lama butuh PANITIA_PIN pada server production. Hubungi admin server.';

// ------------------------------------------------------------------ legacy socket budgets

/** New legacy Socket.IO connections per client IP per minute (an event behind one NAT stays far below it). */
export const koneksiLegacy = new RateLimiter(600, 60_000);
export const EVENT_SOCKET_MAKS = 100;
export const EVENT_SOCKET_JENDELA_MS = 10_000;
/** Past this many events in one window the socket is disconnected. */
export const EVENT_SOCKET_PUTUS = 300;
