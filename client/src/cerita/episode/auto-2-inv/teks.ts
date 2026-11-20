/**
 * Tabel teks EPISODE 1 INVESTIGATOR (auto-2-inv) per bahasa = TEKS_AUTO_2 (pemeran, lokasi, suasana, SIM; tidak diubah)
 * + teks aktivitas dashcam Episode 1 Dev (kunci `akt.dashcam.*`, `arena.dashcam.*` dan `kdash.*` saja: aktivitasnya dipakai ulang)
 * + kunci baru episode ini (./teks.<bahasa>.ts; menang bila kuncinya sama, hanya `judul` / `ringkas`).
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2 } from '../auto-2/teks';
import { TEKS_AUTO_2_DEV_EN } from '../auto-2-dev/teks.en';
import { TEKS_AUTO_2_DEV_ID } from '../auto-2-dev/teks.id';
import { TEKS_AUTO_2_DEV_ZH } from '../auto-2-dev/teks.zh';
import { TEKS_AUTO_2_INV_EN } from './teks.en';
import { TEKS_AUTO_2_INV_ID } from './teks.id';
import { TEKS_AUTO_2_INV_ZH } from './teks.zh';

/** Teks aktivitas dashcam (misi sintetis, ringkasan tindakan, alasan) dari tabel Episode 1 Dev. */
const dashcam = (t: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('akt.dashcam.') || k.startsWith('arena.dashcam.') || k.startsWith('kdash.')));

export const TEKS_AUTO_2_INV: Record<Bahasa, Record<string, string>> = {
  id: { ...TEKS_AUTO_2.id, ...dashcam(TEKS_AUTO_2_DEV_ID), ...TEKS_AUTO_2_INV_ID },
  en: { ...TEKS_AUTO_2.en, ...dashcam(TEKS_AUTO_2_DEV_EN), ...TEKS_AUTO_2_INV_EN },
  zh: { ...TEKS_AUTO_2.zh, ...dashcam(TEKS_AUTO_2_DEV_ZH), ...TEKS_AUTO_2_INV_ZH },
};
