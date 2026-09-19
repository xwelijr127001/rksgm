/**
 * KUNCI JAWABAN PAKET ACARA - SERVER ONLY (aturan yang sama dengan ../answerKeys.ts).
 * Tidak pernah di-import client; isinya hanya keluar lewat REVEAL.
 *
 * Satu misi = satu berkas `aNN.ts` di folder ini, berpasangan dengan `shared/acara/aNN.ts`
 * (konten publik). Bentuk tiap berkas:
 *
 *   import type { BerkasKunciAcara } from './tipe';
 *   export const berkas: BerkasKunciAcara = {
 *     kunci: { missionId: 'a01-...', roundIndex: 0, summary: '...', steps: [...] },
 *     pembahasan: { en: { summary: '...', steps: { s1: '...' } }, zh: { ... } },
 *   };
 *
 * `roundIndex` di kunci hanya penanda urutan paket: room menimpanya dengan posisi soal di playlist.
 * assertKeysComplete() (../answerKeys.ts) memeriksa tiap misi acara punya kunci yang cocok.
 */

import type { BahasaLain } from '../../../shared/bahasa';
import type { MissionKey } from '../../../shared/scoring';
import type { TeksPembahasan } from '../answerKeys.i18n';
import type { BerkasKunciAcara } from './tipe';
import { berkas as a01 } from './a01';
import { berkas as a02 } from './a02';
import { berkas as a03 } from './a03';
import { berkas as a04 } from './a04';
import { berkas as a05 } from './a05';
import { berkas as a06 } from './a06';
import { berkas as a07 } from './a07';
import { berkas as a08 } from './a08';
import { berkas as a09 } from './a09';
import { berkas as a10 } from './a10';

export type { BerkasKunciAcara } from './tipe';

/** Urutan = urutan paket. Berkas yang masih rintisan (null) dilewati. */
const BERKAS: BerkasKunciAcara[] = [a01, a02, a03, a04, a05, a06, a07, a08, a09, a10].filter((b): b is BerkasKunciAcara => b !== null);

export const KUNCI_ACARA: MissionKey[] = BERKAS.map((b) => b.kunci);

export const PEMBAHASAN_ACARA_I18N: Record<BahasaLain, Record<string, TeksPembahasan>> = { en: {}, zh: {} };
for (const b of BERKAS) {
  for (const bahasa of ['en', 'zh'] as const) {
    const t = b.pembahasan?.[bahasa];
    if (t) PEMBAHASAN_ACARA_I18N[bahasa][b.kunci.missionId] = t;
  }
}
