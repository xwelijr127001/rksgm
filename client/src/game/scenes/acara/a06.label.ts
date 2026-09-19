import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 06 (sumber: ./a06.ts).
 * DRAF, belum ditinjau penutur asli. Istilah mengikuti label panjang di shared/i18n/acara/a06.ts.
 *
 * Batas lebar lebih ketat daripada batas tes karena lima tindakan hanya berjarak 110 dan labelnya
 * dua baris (lihat catatan "Label dua baris" di ./a06.ts). Urutan kunci = urutan kiri-kanan di adegan.
 * Lebar dihitung dengan Segoe UI tebal (en) / Microsoft YaHei UI tebal (zh); pil label = teks 20 px + 44:
 * - Baris ATAS (lapor, buang, survei) harus pendek: en "Report" ~108, "Discard" ~114, "Survey" ~108
 *   (label Indonesia 98 - 104; "Throw out" ~141 ditolak); zh dua aksara ~84.
 * - Baris BAWAH (perbaiki, dok) boleh lebih panjang, tetangga sebaris berjarak 220: en "Repair" ~104,
 *   "Photo & serial" ~178; zh "修理" ~84, "拍照和序列号" ~164.
 * - Stiker (teks 18 px + 24) digambar di atas tiap tindakan, jadi harus < 110: en "Step 1" ~77,
 *   "Not yet" ~87 (Indonesia "Langkah 1" ~111, "Jangan dulu" ~127); zh "第 1 步" ~82, "先不要做" ~96.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      lapor: 'Report',
      perbaiki: 'Repair',
      buang: 'Discard',
      dok: 'Photo & serial',
      survei: 'Survey',
    },
    kategori: {
      'urutan:l1': 'Step 1',
      'urutan:l2': 'Step 2',
      'urutan:l3': 'Step 3',
      'urutan:l4': 'Step 4',
      'urutan:jangan': 'Not yet',
    },
  },
  zh: {
    objek: {
      lapor: '报案',
      perbaiki: '修理',
      buang: '扔掉',
      dok: '拍照和序列号',
      survei: '查勘',
    },
    kategori: {
      'urutan:l1': '第 1 步',
      'urutan:l2': '第 2 步',
      'urutan:l3': '第 3 步',
      'urutan:l4': '第 4 步',
      'urutan:jangan': '先不要做',
    },
  },
};
