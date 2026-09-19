import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 04 (sumber: ./a04.ts).
 * DRAF, belum ditinjau penutur asli. Label dokumen & judul papan mengikuti m06 di ../label.en.ts
 * dan ../label.zh.ts.
 * - Papan aksi berjarak 130 dan pil label = teks + 44 (20 px tebal), dan slotnya diacak, jadi DUA
 *   label terlebar dijumlah harus <= 172 px. Terukur: "Complete" 91 + "Count" 57 = 148;
 *   "备齐文件" 80 + "数量差异" 80 = 160. ("Shortage" 86 atau "Document" 98 bersama "Complete"
 *   sudah bertumpuk, jadi tidak dipakai.)
 * - Baris papan "Catatan petugas" (lebar isi 204 px) berbagi tempat dengan nilai + satuan
 *   ("21 crates" 97 px): label baris maks +-100 px. "Not arrived" 100, "Intact" 50.
 * - Seperti label Indonesia, label papan aksi hanya menamai tindakannya dengan satu kata netral,
 *   tanpa kata penilai, supaya keempat papan tampil setara.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'dok-kiriman': 'Shipping list',
      'dok-foto': 'Crate photos',
      'dok-terima': 'Receipt',
      'aksi-ttd': 'Sign',
      'aksi-semua': 'Claim',
      'aksi-catat': 'Complete',
      'aksi-separuh': 'Count',
    },
    papan: {
      catatan: { title: "Officer's notes", lines: ['Not arrived', 'Intact'] },
    },
  },
  zh: {
    objek: {
      'dok-kiriman': '发货清单',
      'dok-foto': '收货照片',
      'dok-terima': '收货凭证',
      'aksi-ttd': '签字',
      'aksi-semua': '索赔',
      'aksi-catat': '备齐文件',
      'aksi-separuh': '数量差异',
    },
    papan: {
      catatan: { title: '现场记录', lines: ['尚未收到', '包装完好'] },
    },
  },
};
