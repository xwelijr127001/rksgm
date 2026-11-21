/**
 * Tabel teks INVESTIGATOR KASUS 2 (auto-2-inv-2) per bahasa =
 *   TEKS_AUTO_2 (pemeran Miss Raksa, lokasi, suasana; tidak diubah)
 * + teks antarmuka pembungkus Investigator dari tabel kasus 1 (kunci `inv.ui.*`, `inv.hasil.*`, `inv.lagi.*`, `inv.latihan.*`,
 *   `inv.gerbang.*` dan `kenalan.namaBawaan`): satu terjemahan untuk semua kasus
 * + kunci kasus ini (./teks.<bahasa>.ts; menang bila kuncinya sama: `judul`, `ringkas`, `inv.label`, dan dua kalimat pembungkus
 *   yang menyebut isi kasus, `inv.lagi.langkah.pesan` / `inv.lagi.sempurna`).
 * Naskah kasus 1 (`inv.buka.*`, `inv.darto.*`, ...) TIDAK ikut.
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2 } from '../auto-2/teks';
import { TEKS_AUTO_2_INV_EN } from '../auto-2-inv/teks.en';
import { TEKS_AUTO_2_INV_ID } from '../auto-2-inv/teks.id';
import { TEKS_AUTO_2_INV_ZH } from '../auto-2-inv/teks.zh';
import { TEKS_AUTO_2_INV_2_EN } from './teks.en';
import { TEKS_AUTO_2_INV_2_ID } from './teks.id';
import { TEKS_AUTO_2_INV_2_ZH } from './teks.zh';

const AWALAN_ANTARMUKA = ['inv.ui.', 'inv.hasil.', 'inv.lagi.', 'inv.latihan.', 'inv.gerbang.'];
/** Teks antarmuka pembungkus Investigator (sama di semua kasus) dari tabel kasus 1. */
const antarmuka = (t: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(t).filter(([k]) => k === 'kenalan.namaBawaan' || AWALAN_ANTARMUKA.some((a) => k.startsWith(a))));

export const TEKS_AUTO_2_INV_2: Record<Bahasa, Record<string, string>> = {
  id: { ...TEKS_AUTO_2.id, ...antarmuka(TEKS_AUTO_2_INV_ID), ...TEKS_AUTO_2_INV_2_ID },
  en: { ...TEKS_AUTO_2.en, ...antarmuka(TEKS_AUTO_2_INV_EN), ...TEKS_AUTO_2_INV_2_EN },
  zh: { ...TEKS_AUTO_2.zh, ...antarmuka(TEKS_AUTO_2_INV_ZH), ...TEKS_AUTO_2_INV_2_ZH },
};
