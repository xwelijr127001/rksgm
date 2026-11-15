/**
 * Hosting under a path prefix (docs/prd-v02/HOSTING.md). Build with `VITE_BASE_PATH=/game/` and every URL the MVP
 * client creates (pages, API, Socket.IO, uploaded story assets, public audio) carries the prefix; the reverse proxy
 * strips it before the request reaches the Node server. Root hosting (`/`) is the default.
 */

/** Always starts and ends with '/' (Vite normalizes `base`). */
export const BASE_PATH: string = import.meta.env?.BASE_URL || '/';

/** Router basename: '' for root hosting, otherwise the prefix without the trailing slash. */
export const ROUTER_BASENAME = BASE_PATH.replace(/\/$/, '');

/** Prefix an absolute app path ('/api/x') with the base path. Full URLs and data/blob URLs are returned unchanged. */
export function withBase(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return BASE_PATH + path.replace(/^\/+/, '');
}

/** Socket.IO endpoint path under the base path (the proxy must forward WebSocket upgrades for it). */
export const SOCKET_PATH = withBase('/socket.io');

/** Optional separate API/socket origin (development proxy-less setups); empty = same origin. */
export const SERVER_ORIGIN = ((import.meta.env?.VITE_SERVER_URL as string | undefined) ?? '').replace(/\/+$/, '');

/** Absolute URL of an app path on the server origin (same origin unless VITE_SERVER_URL is set). */
export function serverUrl(path: string): string {
  return SERVER_ORIGIN + withBase(path);
}
