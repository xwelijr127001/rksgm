/**
 * Tabel teks EPISODE 1 DEV (auto-2-dev) per bahasa = TEKS_AUTO_2 (semua baris cerita yang dipakai ulang, tidak diubah) +
 * kunci baru episode ini (./teks.<bahasa>.ts; menang bila kuncinya sama, mis. `judul` / `ringkas`).
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2 } from '../auto-2/teks';
import { TEKS_AUTO_2_DEV_EN } from './teks.en';
import { TEKS_AUTO_2_DEV_ID } from './teks.id';
import { TEKS_AUTO_2_DEV_ZH } from './teks.zh';

export const TEKS_AUTO_2_DEV: Record<Bahasa, Record<string, string>> = {
  id: { ...TEKS_AUTO_2.id, ...TEKS_AUTO_2_DEV_ID },
  en: { ...TEKS_AUTO_2.en, ...TEKS_AUTO_2_DEV_EN },
  zh: { ...TEKS_AUTO_2.zh, ...TEKS_AUTO_2_DEV_ZH },
};
