import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 01 (sumber: ./a01.ts).
 * DRAF, belum ditinjau penutur asli. Istilah mengikuti opsi panjang di shared/i18n/acara/a01.ts.
 *
 * Batas lebar lebih ketat daripada batas tes karena baris belakang rapat (jarak kolom 178).
 * Posisi tampil setelah acak slot (sama di semua bahasa): belakang = perbaiki, lapor, abaikan;
 * depan = foto, (tumpukan kain), buang. Lebar pil diukur di Chrome (tebal 20 px + bantalan 44):
 * - en: "Repair first" ~148, "Report claim" ~164, "Just open up" ~165 (celah baris belakang 22 & 14 px;
 *   label Indonesia 17 & 10 px), "Take photos" ~157, "Throw it away" ~177. Semua <= 184, jadi label
 *   kolom kanan tidak dijepit tepi. "Photo the damage" (~218) dan "Report a claim" (~180) ditolak: terlalu lebar.
 * - zh: empat aksara ~124, tiga aksara ~104. Sengaja dibuat hampir sama panjang supaya tidak ada
 *   label yang lebih menonjol.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      perbaiki: 'Repair first',
      buang: 'Throw it away',
      lapor: 'Report claim',
      foto: 'Take photos',
      abaikan: 'Just open up',
    },
  },
  zh: {
    objek: {
      perbaiki: '先修理',
      buang: '扔掉物品',
      lapor: '理赔报案',
      foto: '拍下损坏',
      abaikan: '照常开店',
    },
  },
};
