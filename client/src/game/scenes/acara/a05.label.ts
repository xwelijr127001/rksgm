import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 05 (sumber: ./a05.ts).
 * Istilah sama dengan m05-polis-mana di ../label.en.ts dan ../label.zh.ts (stempel & stiker identik).
 *
 * Lebar (diukur dengan font adegan, tebal 20 px untuk label dan 18 px untuk stiker):
 * - Label kartu berada DI SAMPING kartu, jatahnya sekitar 118 (lihat LABEL_KARTU_DX di ./a05.ts):
 *   "Policy A" + penanda dokumen sekitar 119, "保单 A" sekitar 104. Jangan diperpanjang
 *   (mis. "Policy Card A" / "保单卡 A" tidak muat).
 * - Stiker terlebar "Below threshold" sekitar 161, lebih sempit dari "Di bawah ambang" (sekitar 177),
 *   jadi tetap di dalam kolom selebar 208.
 * Adegan ini tanpa papan.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'stempel-lanjut': 'Can proceed',
      'stempel-ambang': 'Below threshold',
      'stempel-data': 'Need more info',
      'map-a': 'Case A',
      'map-b': 'Case B',
      'map-c': 'Case C',
      'kartu-a': 'Policy A',
      'kartu-b': 'Policy B',
      'kartu-c': 'Policy C',
    },
    kategori: {
      'simpul:lanjut': 'Can proceed',
      'simpul:tidak-ambang': 'Below threshold',
      'simpul:perlu-data': 'Need more info',
    },
  },
  zh: {
    objek: {
      'stempel-lanjut': '可继续评估',
      'stempel-ambang': '未达门槛',
      'stempel-data': '需补充信息',
      'map-a': '案件 A',
      'map-b': '案件 B',
      'map-c': '案件 C',
      'kartu-a': '保单 A',
      'kartu-b': '保单 B',
      'kartu-c': '保单 C',
    },
    kategori: {
      'simpul:lanjut': '可继续评估',
      'simpul:tidak-ambang': '未达门槛',
      'simpul:perlu-data': '需补充信息',
    },
  },
};
