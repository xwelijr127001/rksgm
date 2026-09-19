import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 10 (sumber: ./a10.ts).
 * Empat kasus berjarak 154 dan stikernya menumpuk tepat di atas kasus, jadi batasnya lebih
 * ketat daripada batas tes: tidak boleh lebih lebar daripada stiker Indonesia terlebar
 * ("Bawah ambang", teks 130 px pada Segoe UI tebal 18 px). Terukur: Inggris maks 125 px
 * ("Complete docs"; "Serial differs" 14 huruf tetapi hanya 107 px), Mandarin maks 110 px
 * (5 aksara, atau 4 aksara + "TLO"). Istilah mengikuti kategori panjang di
 * shared/i18n/acara/a10.ts dan stiker misi 10 di ../label.en.ts / ../label.zh.ts.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      'kasus-a': 'Case A',
      'kasus-b': 'Case B',
      'kasus-c': 'Case C',
      'kasus-d': 'Case D',
      'polis-a': 'Policy A',
      'polis-b': 'Policy B',
      'polis-c': 'Policy C',
      'polis-d': 'Policy D',
    },
    kategori: {
      'temuan:ambang': 'Below thresh.',
      'temuan:periode': 'Out of period',
      'temuan:selisih': 'Docs differ',
      'temuan:sesuai': 'All match',
      'temuan:seri': 'Serial differs',
      'tindak:tidak-ambang': 'TLO not met',
      'tindak:luar-periode': 'Period ended',
      'tindak:dokumentasi': 'Complete docs',
      'tindak:survei': 'Go to survey',
      'tindak:klarifikasi': 'Clarify first',
    },
  },
  zh: {
    objek: {
      'kasus-a': '案件 A',
      'kasus-b': '案件 B',
      'kasus-c': '案件 C',
      'kasus-d': '案件 D',
      'polis-a': '保单 A',
      'polis-b': '保单 B',
      'polis-c': '保单 C',
      'polis-d': '保单 D',
    },
    kategori: {
      'temuan:ambang': '低于门槛',
      'temuan:periode': '不在期间内',
      'temuan:selisih': '文件不一致',
      'temuan:sesuai': '全部相符',
      'temuan:seri': '序列号不同',
      'tindak:tidak-ambang': '未达TLO门槛',
      'tindak:luar-periode': '期间已过',
      'tindak:dokumentasi': '备齐文件',
      'tindak:survei': '进入查勘',
      'tindak:klarifikasi': '先核实身份',
    },
  },
};
