/**
 * Tabel teks EPISODE AUTO-2. Naskah draf baru tersedia dalam Bahasa Indonesia (Episode.bahasa = ['id']): tabel en/zh
 * sengaja kosong, teksCerita jatuh ke Indonesia dan halaman cerita memberi catatan bahasa. Terjemahan menunggu naskah
 * disahkan (17 butir konfirmasi), supaya isi kasus yang belum final tidak diterjemahkan diam-diam.
 */
import type { Bahasa } from '@shared/bahasa';
import { TEKS_AUTO_2_ID } from './teks.id';

export const TEKS_AUTO_2: Record<Bahasa, Record<string, string>> = { id: TEKS_AUTO_2_ID, en: {}, zh: {} };
