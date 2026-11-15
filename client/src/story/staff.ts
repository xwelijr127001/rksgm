/**
 * Internal staff session (host, author, reviewer, competition admin, system admin). The bearer token lives in
 * sessionStorage (closing the browser tab signs out; the server expires it after 12 hours). Role checks here only
 * decide what to SHOW; every action is authorized again by the server (shared/story/roles.ts).
 */
import { useSyncExternalStore } from 'react';
import { can, type Capability, type StaffIdentity } from '@shared/story/roles';
import { serverUrl } from './base';

const TOKEN_KEY = 'raksa:staf:token';

/** `ended`: the session ended under an open page (a request answered 401: expiry or revocation), not by signing out. */
export type StaffState = { status: 'unknown' } | { status: 'signed_out'; reason?: string; ended?: boolean } | { status: 'signed_in'; token: string; identity: StaffIdentity };

let state: StaffState = { status: 'unknown' };
let checking: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: StaffState): void {
  state = next;
  listeners.forEach((fn) => fn());
}

function storedToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the session lasts until reload */
  }
}

/** Validate a stored token once per page load (the server may have expired or revoked it). */
export function checkStaffSession(): Promise<void> {
  if (state.status !== 'unknown') return Promise.resolve();
  checking ??= (async () => {
    const token = storedToken();
    if (!token) return set({ status: 'signed_out' });
    try {
      const r = await fetch(serverUrl('/api/staff/me'), { headers: { authorization: `Bearer ${token}` } });
      const json = (await r.json()) as { ok?: boolean; identity?: StaffIdentity };
      if (r.ok && json.ok && json.identity) set({ status: 'signed_in', token, identity: json.identity });
      else {
        storeToken(null);
        set({ status: 'signed_out', reason: 'Sesi sudah berakhir. Silakan masuk lagi.' });
      }
    } catch {
      set({ status: 'signed_out', reason: 'Server tidak bisa dihubungi.' });
    }
  })();
  return checking;
}

export async function staffLogin(username: string, password: string): Promise<string | null> {
  try {
    const r = await fetch(serverUrl('/api/staff/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = (await r.json()) as { ok?: boolean; token?: string; identity?: StaffIdentity; error?: string };
    if (!r.ok || !json.ok || !json.token || !json.identity) return json.error ?? 'Gagal masuk.';
    storeToken(json.token);
    set({ status: 'signed_in', token: json.token, identity: json.identity });
    return null;
  } catch {
    return 'Server tidak bisa dihubungi.';
  }
}

export async function staffLogout(): Promise<void> {
  const s = state;
  storeToken(null);
  set({ status: 'signed_out' });
  if (s.status === 'signed_in') {
    await fetch(serverUrl('/api/staff/logout'), { method: 'POST', headers: { authorization: `Bearer ${s.token}` } }).catch(() => undefined);
  }
}

export function staffCan(cap: Capability): boolean {
  return state.status === 'signed_in' && can(state.identity.roles, cap);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function snapshot(): StaffState {
  return state;
}

export function useStaff(): StaffState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// ------------------------------------------------------------------ authenticated API

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; issues?: unknown[] };

/**
 * JSON request with the staff bearer token. A 401 signs the page out (expired/revoked session) so the login form
 * appears instead of a broken screen (over the tool, for a tool that keeps its work: StaffShell `resumable`).
 */
export async function staffApi<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const s = state;
  if (s.status !== 'signed_in') return { ok: false, status: 401, error: 'Silakan masuk sebagai staf.' };
  try {
    const r = await fetch(serverUrl(path), {
      method,
      headers: { authorization: `Bearer ${s.token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (r.status === 401) {
      storeToken(null);
      set({ status: 'signed_out', reason: 'Sesi sudah berakhir. Silakan masuk lagi.', ended: true });
    }
    if (!r.ok || json.ok !== true) {
      return { ok: false, status: r.status, error: typeof json.error === 'string' ? json.error : `Permintaan gagal (${r.status}).`, issues: Array.isArray(json.issues) ? json.issues : undefined };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: 'Server tidak bisa dihubungi.' };
  }
}

/** Upload raw bytes (asset library); metadata travels in the query string. */
export async function staffUpload<T>(path: string, file: Blob, query: Record<string, string>): Promise<ApiResult<T>> {
  const s = state;
  if (s.status !== 'signed_in') return { ok: false, status: 401, error: 'Silakan masuk sebagai staf.' };
  const qs = new URLSearchParams(query).toString();
  try {
    const r = await fetch(serverUrl(`${path}?${qs}`), { method: 'POST', headers: { authorization: `Bearer ${s.token}`, 'content-type': 'application/octet-stream' }, body: file });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok || json.ok !== true) return { ok: false, status: r.status, error: typeof json.error === 'string' ? json.error : `Unggahan gagal (${r.status}).` };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: 'Server tidak bisa dihubungi.' };
  }
}

/** Download a protected file (CSV export) with the bearer token. */
export async function staffDownload(path: string, fallbackName: string): Promise<string | null> {
  const s = state;
  if (s.status !== 'signed_in') return 'Silakan masuk sebagai staf.';
  try {
    const r = await fetch(serverUrl(path), { headers: { authorization: `Bearer ${s.token}` } });
    if (!r.ok) return `Unduhan gagal (${r.status}).`;
    const blob = await r.blob();
    const name = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return null;
  } catch {
    return 'Server tidak bisa dihubungi.';
  }
}
