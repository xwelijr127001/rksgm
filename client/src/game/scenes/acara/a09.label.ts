import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 09 (en, zh). DRAF, belum ditinjau penutur asli.
 * Dua pil label sebaris (pusat x 280 dan 472, lihat a09.ts), jadi label estimasi harus pendek:
 * "Repair estimate" 147 px -> pil 185-375, "Policy card" 103 px -> pil 399-545, sela sekitar 23
 * (Segoe UI tebal 20 px). "Workshop estimate" (183 px) hanya menyisakan sela 5, maka tidak dipakai.
 * Papan mengikuti m09: "Deductible" / "Final result", "免赔额" / "最终结果".
 */
export const label: Partial<Record<BahasaLain, LabelAdegan>> = {
  en: {
    objek: {
      estimasi: 'Repair estimate',
      kartu: 'Policy card',
    },
    papan: {
      lembar: { title: 'Calculation sheet', lines: ['Loss counted', 'Deductible', 'Final result'] },
    },
  },
  zh: {
    objek: {
      estimasi: '修理厂估价单',
      kartu: '保单卡',
    },
    papan: {
      lembar: { title: '计算表', lines: ['计入损失', '免赔额', '最终结果'] },
    },
  },
};
