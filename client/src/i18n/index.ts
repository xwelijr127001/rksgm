/**
 * Bahasa antarmuka. Bawaan Indonesia; pemain memilih di header (tersimpan di perangkat itu),
 * atau lewat alamat: ?lang=en | ?lang=zh | ?lang=id.
 *
 * Cara pakai di komponen:
 *   const { bahasa } = useBahasa();      // berlangganan: komponen digambar ulang saat bahasa berganti
 *   <h1>{t('pemain.judulKode')}</h1>     // kunci = "<ruang>.<nama>", parameter: t('x.y', { n: 3 }) -> "{n}"
 * Fungsi bantu di luar komponen boleh memanggil t() langsung (dibaca saat render).
 *
 * Kamus per ruang ada di ./kamus/<ruang>.ts dengan bentuk { id, en, zh } dan himpunan kunci
 * yang SAMA di ketiganya (dijaga terjemahan.test.ts). Teks `id` adalah sumber kebenaran.
 */

import { useSyncExternalStore } from 'react';
import { BAHASA_BAWAAN, DAFTAR_BAHASA, bahasaSah, type Bahasa } from '@shared/bahasa';
import { terjemahkanMisi, terjemahkanReveal } from '@shared/i18n/misi';
import type { MissionPublic, MissionReveal } from '@shared/types';
import { KAMUS } from './kamus';

const KUNCI = 'raksa:bahasa';
const pendengar = new Set<() => void>();

function awal(): Bahasa {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (bahasaSah(q)) { localStorage.setItem(KUNCI, q); return q; }
    const s = localStorage.getItem(KUNCI);
    if (bahasaSah(s)) return s;
  } catch { /* penyimpanan diblokir: pakai bawaan */ }
  return BAHASA_BAWAAN;
}

let kini: Bahasa = typeof window === 'undefined' ? BAHASA_BAWAAN : awal();

function tandaiHtml(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = DAFTAR_BAHASA.find((b) => b.kode === kini)?.htmlLang ?? 'id';
}
tandaiHtml();

export function bahasaKini(): Bahasa {
  return kini;
}

export function aturBahasa(b: Bahasa): void {
  if (b === kini) return;
  kini = b;
  try { localStorage.setItem(KUNCI, b); } catch { /* abaikan */ }
  tandaiHtml();
  pendengar.forEach((fn) => fn());
}

function langganan(fn: () => void): () => void {
  pendengar.add(fn);
  return () => { pendengar.delete(fn); };
}

/** Berlangganan bahasa aktif. Panggil di komponen yang menampilkan teks terjemahan. */
export function useBahasa(): { bahasa: Bahasa; aturBahasa: (b: Bahasa) => void } {
  const bahasa = useSyncExternalStore(langganan, bahasaKini, () => BAHASA_BAWAAN);
  return { bahasa, aturBahasa };
}

/** Teks untuk kunci "<ruang>.<nama>". Jatuh ke Indonesia, lalu ke kunci itu sendiri. `{nama}` diganti parameter. */
export function t(kunci: string, param?: Record<string, string | number>): string {
  const titik = kunci.indexOf('.');
  const ruang = KAMUS[kunci.slice(0, titik)];
  const nama = kunci.slice(titik + 1);
  let teks = ruang?.[kini]?.[nama] ?? ruang?.id?.[nama] ?? kunci;
  if (param) for (const [k, v] of Object.entries(param)) teks = teks.split(`{${k}}`).join(String(v));
  return teks;
}

/** Misi & pembahasan dalam bahasa aktif (id tidak berubah, jadi draft/kunci/skor tidak terpengaruh). */
export function misiDalamBahasa(m: MissionPublic, bahasa: Bahasa): MissionPublic {
  return terjemahkanMisi(m, bahasa);
}
export function revealDalamBahasa(r: MissionReveal, misi: MissionPublic | null, bahasa: Bahasa): MissionReveal {
  return terjemahkanReveal(r, misi, bahasa);
}
