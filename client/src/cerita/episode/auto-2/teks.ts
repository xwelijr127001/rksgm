/**
 * Tabel teks EPISODE AUTO-2 per bahasa (dipakai `Episode.teks` dan misi sintetis di aktivitas.ts), pola sama dengan
 * auto-1/teks.ts. Sumber: teks.id.ts. en & zh (T-014) diterjemahkan dengan kunci dan parameter yang sama; keduanya masih
 * DRAF sampai ditinjau Designer/owner (naskah sumber pun masih draf, 17 butir konfirmasi).
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2_EN } from './teks.en';
import { TEKS_AUTO_2_ID } from './teks.id';
import { TEKS_AUTO_2_ZH } from './teks.zh';

export const TEKS_AUTO_2: Record<Bahasa, Record<string, string>> = { id: TEKS_AUTO_2_ID, en: TEKS_AUTO_2_EN, zh: TEKS_AUTO_2_ZH };
