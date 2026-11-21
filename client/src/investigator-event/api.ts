/**
 * T-109 (Investigator lengkap, card 6): CLIENT of the event board API (/api/investigator/events, contract
 * shared/investigator/event.ts, service T-107). Every credential goes in the `Authorization` header, never in the URL.
 * A network failure, a timeout or an unreadable reply is reported as `{ ok: false, error: 'unavailable' }`, so callers
 * handle ONE shape. Nothing here stores anything.
 */
import { EVENT_API, type ApiResult, type EventErrorCode } from '@shared/investigator/event';
import { t } from '../i18n';
import { serverUrl } from '../story/base';

const BATAS_WAKTU_MS = 8000;

export async function panggil<T>(metode: 'GET' | 'POST', rute: string, opsi: { bearer?: string | null; body?: unknown; param?: Record<string, string> } = {}): Promise<ApiResult<T>> {
  const jalur = rute.replace(/:([a-zA-Z]+)/g, (_s, n: string) => encodeURIComponent(opsi.param?.[n] ?? ''));
  const pemutus = new AbortController();
  const jam = window.setTimeout(() => pemutus.abort(), BATAS_WAKTU_MS);
  try {
    const r = await fetch(serverUrl(EVENT_API + jalur), {
      method: metode,
      cache: 'no-store',
      signal: pemutus.signal,
      headers: { ...(opsi.bearer ? { authorization: `Bearer ${opsi.bearer}` } : {}), ...(metode === 'POST' ? { 'content-type': 'application/json' } : {}) },
      ...(metode === 'POST' ? { body: JSON.stringify(opsi.body ?? {}) } : {}),
    });
    const json = (await r.json()) as ApiResult<T> | null;
    if (json && typeof json === 'object' && typeof (json as { ok?: unknown }).ok === 'boolean') return json;
    return { ok: false, error: 'unavailable' };
  } catch {
    return { ok: false, error: 'unavailable' };
  } finally {
    window.clearTimeout(jam);
  }
}

/** One translated sentence per error code (the server sends machine codes only). */
export function teksGalat(kode: EventErrorCode): string {
  switch (kode) {
    case 'not_found': return t('acaraInv.galatKode');
    case 'closed': return t('acaraInv.galatTutup');
    case 'full': return t('acaraInv.galatPenuh');
    case 'rate_limited': return t('acaraInv.galatBatas');
    case 'unavailable': return t('acaraInv.galatJaringan');
    case 'unauthorized': return t('acaraInv.galatSesi');
    case 'forbidden': return t('acaraInv.galatAkses');
    default: return t('acaraInv.galatUmum');
  }
}

/** Join link in the QR: the public hub with the PUBLIC code only (never a credential). */
export function tautanGabung(basis: string, kode: string): string {
  const asal = (basis || (typeof window === 'undefined' ? '' : window.location.origin)).replace(/\/+$/, '');
  return `${asal}/investigator?acara=${encodeURIComponent(kode)}`;
}
