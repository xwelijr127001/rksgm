import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 07 (sumber: ./a07.ts).
 * DRAF, belum ditinjau penutur asli. Istilah mengikuti shared/i18n/acara/a07.ts: label binder sama
 * dengan chip item ("File A" / "档案 A"), kartu = "Policy A" / "保单 A" seperti m07.
 *
 * Batas lebar lebih ketat daripada batas tes: jarak antar binder 150, stiker = teks tebal 18 px +
 * bantalan 24. Lebar teks diukur dengan Segoe UI Bold (GDI+, perkiraan):
 * - id: "Luar periode" ~107, "Tanpa banjir" ~106 (stiker ~131).
 * - en: "Out of period" ~115 (stiker ~139), "Other object" ~106, "No flood" ~75, "Matches" ~71.
 *   Ditolak karena lebih lebar: "Flood unlisted" (~120), "Wrong object" (~116).
 * - zh: paling panjang lima aksara (~90, stiker ~114).
 * Stiker sengaja netral: tidak ada kata seperti "Covered" / "可赔" yang terdengar seperti keputusan klaim.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'berkas-a': 'File A',
      'berkas-b': 'File B',
      'berkas-c': 'File C',
      'kartu-a': 'Policy A',
      'kartu-b': 'Policy B',
      'kartu-c': 'Policy C',
      laporan: 'Incident report',
      kardus: 'Wet boxes',
    },
    kategori: {
      'periksa:sesuai': 'Matches',
      'periksa:luar-periode': 'Out of period',
      'periksa:tanpa-banjir': 'No flood',
      'periksa:objek-beda': 'Other object',
    },
  },
  zh: {
    objek: {
      'berkas-a': '档案 A',
      'berkas-b': '档案 B',
      'berkas-c': '档案 C',
      'kartu-a': '保单 A',
      'kartu-b': '保单 B',
      'kartu-c': '保单 C',
      laporan: '事故报告',
      kardus: '湿纸箱',
    },
    kategori: {
      'periksa:sesuai': '相符',
      'periksa:luar-periode': '不在期间内',
      'periksa:tanpa-banjir': '洪水未列明',
      'periksa:objek-beda': '对象不同',
    },
  },
};
