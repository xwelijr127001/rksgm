/**
 * Adegan 2D untuk aktivitas MODE CERITA (misi sintetis, mis. 'cerita-auto1-bukti').
 * Didaftarkan di ../index.ts (ADEGAN) dan ../label.ts (LABEL) seperti paket acara.
 * Rubrik aktivitas ada di episode (client/src/cerita/episode/...), tidak pernah di sini.
 *
 * Id misi & opsi TETAP (docs/rancangan-mode-cerita.md bagian 3.2); dijaga cerita.test.ts.
 * Seni bersama (Bu Rina, mobilnya, latar panggung) ada di client/src/cerita/seni/.
 */
import type { BahasaLain } from '@shared/bahasa';
import type { SceneSpec } from '../../types';
import type { KamusLabel } from '../label';
import { ID_MISI_BUKTI, sceneBuktiRina } from './auto1-bukti';
import { ID_MISI_POLIS, scenePolisRina } from './auto1-polis';
import { LABEL_AUTO1 } from './auto1.label';

export const ADEGAN_CERITA: Record<string, () => SceneSpec | null> = {
  [ID_MISI_BUKTI]: sceneBuktiRina,
  [ID_MISI_POLIS]: scenePolisRina,
};

export const LABEL_CERITA: Record<BahasaLain, KamusLabel> = {
  en: { ...LABEL_AUTO1.en },
  zh: { ...LABEL_AUTO1.zh },
};
