/**
 * Terjemahan konten PAKET ACARA (en, zh). Satu misi = satu berkas `aNN.ts`:
 *   export const teks = { en: { title: ..., steps: {...} }, zh: {...} };
 * Bentuknya sama dengan ../misi.en.ts (TeksMisi), dijaga client/src/i18n/terjemahan.test.ts.
 */
import type { BahasaLain } from '../../bahasa';
import type { KamusMisi, TeksMisi } from '../misi';
import { MISSIONS_ACARA } from '../../missions.acara';
import { teks as a01 } from './a01';
import { teks as a02 } from './a02';
import { teks as a03 } from './a03';
import { teks as a04 } from './a04';
import { teks as a05 } from './a05';
import { teks as a06 } from './a06';
import { teks as a07 } from './a07';
import { teks as a08 } from './a08';
import { teks as a09 } from './a09';
import { teks as a10 } from './a10';

const BERKAS: Partial<Record<BahasaLain, TeksMisi>>[] = [a01, a02, a03, a04, a05, a06, a07, a08, a09, a10];

function kamus(bahasa: BahasaLain): KamusMisi {
  const hasil: KamusMisi = {};
  // Berkas ke-i berpasangan dengan shared/acara/a(i+1).ts; id misinya diambil dari paket.
  for (const m of MISSIONS_ACARA) {
    const t = BERKAS[m.number - 1]?.[bahasa];
    if (t) hasil[m.id] = t;
  }
  return hasil;
}

export const MISI_ACARA_EN: KamusMisi = kamus('en');
export const MISI_ACARA_ZH: KamusMisi = kamus('zh');
