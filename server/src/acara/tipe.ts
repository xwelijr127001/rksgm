import type { BahasaLain } from '../../../shared/bahasa';
import type { MissionKey } from '../../../shared/scoring';
import type { TeksPembahasan } from '../answerKeys.i18n';

export interface BerkasKunciAcara {
  kunci: MissionKey;
  /** Terjemahan ringkasan & penjelasan; boleh kosong (client jatuh ke teks Indonesia). */
  pembahasan?: Partial<Record<BahasaLain, TeksPembahasan>>;
}
