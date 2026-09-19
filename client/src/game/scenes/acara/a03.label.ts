import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 03 (sumber: ./a03.ts).
 * Stiker kategori menempel di atas foto yang berjarak 152, jadi batasnya lebih ketat daripada
 * batas tes: Inggris maks 13 huruf (selebar "Kondisi mobil"), Mandarin maks 5 aksara.
 * Istilah mengikuti kategori panjang di shared/i18n/acara/a03.ts.
 * Urutan entri kategori = urutan kategori di data misi (bebas), BUKAN urutan foto A - D.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'foto-a': 'Photo A',
      'foto-b': 'Photo B',
      'foto-c': 'Photo C',
      'foto-d': 'Photo D',
    },
    kategori: {
      'fungsi:identitas': 'Identity',
      'fungsi:tidak': 'Not helpful',
      'fungsi:kondisi': 'Car condition',
      'fungsi:titik': 'Impact point',
    },
  },
  zh: {
    objek: {
      'foto-a': '照片 A',
      'foto-b': '照片 B',
      'foto-c': '照片 C',
      'foto-d': '照片 D',
    },
    kategori: {
      'fungsi:identitas': '车辆身份',
      'fungsi:tidak': '没有帮助',
      'fungsi:kondisi': '整车状况',
      'fungsi:titik': '碰撞部位',
    },
  },
};
