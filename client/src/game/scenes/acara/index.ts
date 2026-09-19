/**
 * Adegan 2D PAKET ACARA. Satu misi = satu berkas `aNN.ts` (+ `aNN.label.ts` untuk en/zh).
 * Latar dipakai ulang dari adegan paket latihan (pembuat latarnya diekspor dari berkas mNN).
 */
import type { BahasaLain } from '@shared/bahasa';
import type { SceneSpec } from '../../types';
import type { KamusLabel, LabelAdegan } from '../label';
import { adegan as a01 } from './a01';
import { label as l01 } from './a01.label';
import { adegan as a02 } from './a02';
import { label as l02 } from './a02.label';
import { adegan as a03 } from './a03';
import { label as l03 } from './a03.label';
import { adegan as a04 } from './a04';
import { label as l04 } from './a04.label';
import { adegan as a05 } from './a05';
import { label as l05 } from './a05.label';
import { adegan as a06 } from './a06';
import { label as l06 } from './a06.label';
import { adegan as a07 } from './a07';
import { label as l07 } from './a07.label';
import { adegan as a08 } from './a08';
import { label as l08 } from './a08.label';
import { adegan as a09 } from './a09';
import { label as l09 } from './a09.label';
import { adegan as a10 } from './a10';
import { label as l10 } from './a10.label';

const PASANGAN: [{ missionId: string; buat: () => SceneSpec } | null, Partial<Record<BahasaLain, LabelAdegan>>][] = [
  [a01, l01],
  [a02, l02],
  [a03, l03],
  [a04, l04],
  [a05, l05],
  [a06, l06],
  [a07, l07],
  [a08, l08],
  [a09, l09],
  [a10, l10],
];

export const ADEGAN_ACARA: Record<string, () => SceneSpec | null> = {};
export const LABEL_ACARA: Record<BahasaLain, KamusLabel> = { en: {}, zh: {} };
for (const [a, l] of PASANGAN) {
  if (!a) continue;
  ADEGAN_ACARA[a.missionId] = a.buat;
  if (l.en) LABEL_ACARA.en[a.missionId] = l.en;
  if (l.zh) LABEL_ACARA.zh[a.missionId] = l.zh;
}
