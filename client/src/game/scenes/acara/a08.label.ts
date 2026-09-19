import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 08 (DRAF, belum ditinjau penutur asli).
 *
 * Lebar dijaga (lihat catatan tata letak di ./a08.ts; diukur dengan Segoe UI tebal 20 px):
 * - `kaca` harus sependek "Kaca" (44 px): "Glass" 48 px, "玻璃" 40 px;
 * - `mesin` <= ~105 satuan termasuk penanda: "Engine" 64 + 44 = 108 (tepi kanan 261, isi gambar
 *   track mulai 265), "发动机" 60 + 44 = 104;
 * - `laporan` tetap satu kata: label yang lebih panjang dijepit ke kiri dan menutupi selang hidrolik;
 * - `track` tetap tunggal ("Track shoe") supaya tidak merapat ke label "Hydraulic hose".
 * - Stiker dibuat sependek versi Indonesia ("Kondisi lama" 109 px pada 18 px): bagian unit berdekatan,
 *   jadi 'Incident-related' / 'Technical check' milik m08 terlalu lebar di sini.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'buku-servis': 'Service log',
      laporan: 'Report',
      mesin: 'Engine',
      kaca: 'Glass',
      boom: 'Dented boom',
      track: 'Track shoe',
      selang: 'Hydraulic hose',
    },
    kategori: {
      'pilah:terkait': 'Related',
      'pilah:sebelumnya': 'Pre-existing',
      'pilah:teknis': 'Tech check',
    },
  },
  zh: {
    objek: {
      'buku-servis': '保养记录',
      laporan: '事故报告',
      mesin: '发动机',
      kaca: '玻璃',
      boom: '动臂凹陷',
      track: '履带板',
      selang: '液压软管',
    },
    kategori: {
      'pilah:terkait': '与事故相关',
      'pilah:sebelumnya': '事故前状况',
      'pilah:teknis': '技术检查',
    },
  },
};
