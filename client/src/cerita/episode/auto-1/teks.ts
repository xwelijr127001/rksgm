/**
 * Tabel teks episode AUTO-1 per bahasa (dipakai `Episode.teks` dan misi sintetis di aktivitas.ts).
 * Sumber: teks.id.ts. en & zh diterjemahkan dengan kunci dan parameter ({nama}) yang sama.
 */
import type { Bahasa } from '@shared/bahasa';
import type { KunciTeks } from '../../tipe';
import { TEKS_EN } from './teks.en';
import { TEKS_ID } from './teks.id';
import { TEKS_ZH } from './teks.zh';

export const TEKS_AUTO_1: Record<Bahasa, Record<KunciTeks, string>> = { id: TEKS_ID, en: TEKS_EN, zh: TEKS_ZH };

/**
 * Nama & tema ruang layanan episode ini: SATU sumber untuk papan nama (`Episode.panggung.lokasi`), parameter teks
 * `{lokasi}` di dialog, dan label lokasi aktivitas polis (aktivitas.ts). Ganti di sini saja.
 */
export const LOKASI_AUTO_1 = { nama: 'Raksa Silver Club', tema: 'silver' } as const;
