/**
 * Tabel teks INVESTIGATOR KASUS 3 (auto-2-inv-3) per bahasa, susunan yang sama dengan kasus 2 =
 *   TEKS_AUTO_2 (pemeran Miss Raksa, lokasi, suasana; tidak diubah)
 * + teks antarmuka pembungkus Investigator dari tabel kasus 1 (kunci `inv.ui.*` termasuk `inv.ui.tekan.*`, `inv.hasil.*`,
 *   `inv.lagi.*`, `inv.latihan.*`, `inv.gerbang.*` dan `kenalan.namaBawaan`): satu terjemahan untuk semua kasus
 * + kunci kasus ini (./teks.<bahasa>.ts; menang bila kuncinya sama: `judul`, `ringkas`, `inv.label`, `inv.lagi.langkah.pesan`,
 *   `inv.lagi.sempurna`).
 * Naskah kasus 1 dan 2 TIDAK ikut. Tanpa jatuh ke bahasa lain: tiap bahasa punya semua kunci.
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2 } from '../auto-2/teks';
import { TEKS_AUTO_2_INV_EN } from '../auto-2-inv/teks.en';
import { TEKS_AUTO_2_INV_ID } from '../auto-2-inv/teks.id';
import { TEKS_AUTO_2_INV_ZH } from '../auto-2-inv/teks.zh';
import { TEKS_AUTO_2_INV_3_EN } from './teks.en';
import { TEKS_AUTO_2_INV_3_ID } from './teks.id';
import { TEKS_AUTO_2_INV_3_ZH } from './teks.zh';

const AWALAN_ANTARMUKA = ['inv.ui.', 'inv.hasil.', 'inv.lagi.', 'inv.latihan.', 'inv.gerbang.'];
const antarmuka = (t: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(t).filter(([k]) => k === 'kenalan.namaBawaan' || AWALAN_ANTARMUKA.some((a) => k.startsWith(a))));

export const TEKS_AUTO_2_INV_3: Record<Bahasa, Record<string, string>> = {
  id: { ...TEKS_AUTO_2.id, ...antarmuka(TEKS_AUTO_2_INV_ID), ...TEKS_AUTO_2_INV_3_ID },
  en: { ...TEKS_AUTO_2.en, ...antarmuka(TEKS_AUTO_2_INV_EN), ...TEKS_AUTO_2_INV_3_EN },
  zh: { ...TEKS_AUTO_2.zh, ...antarmuka(TEKS_AUTO_2_INV_ZH), ...TEKS_AUTO_2_INV_3_ZH },
};
