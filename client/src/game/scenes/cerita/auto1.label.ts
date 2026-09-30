import type { BahasaLain } from '@shared/bahasa';
import type { KamusLabel } from '../label';
import { ID_MISI_BUKTI } from './auto1-bukti';
import { ID_MISI_POLIS } from './auto1-polis';

/**
 * Terjemahan label adegan mode cerita AUTO-1 (sumber teks Indonesia: auto1-bukti.ts & auto1-polis.ts).
 * DRAF, belum ditinjau penutur asli. Batas: Inggris <= 18 huruf (usahakan tidak lebih lebar dari label
 * Indonesia di posisi yang sama), Mandarin <= 9 aksara. Istilah mengikuti label misi 2 & 5.
 */
export const LABEL_AUTO1: Record<BahasaLain, KamusLabel> = {
  en: {
    [ID_MISI_BUKTI]: {
      objek: {
        mobil: 'Whole car',
        penyok: 'Bumper & lamp',
        plat: 'Number plate',
        brosur: 'Menu flyer',
        dasbor: 'Dashboard',
        ban: 'Front tyre',
      },
    },
    [ID_MISI_POLIS]: {
      objek: {
        'kartu-polis': 'Policy card',
      },
    },
  },
  zh: {
    [ID_MISI_BUKTI]: {
      objek: {
        mobil: '车辆全景',
        penyok: '保险杠和尾灯',
        plat: '车牌',
        brosur: '菜单传单',
        dasbor: '仪表盘',
        ban: '前轮',
      },
    },
    [ID_MISI_POLIS]: {
      objek: {
        'kartu-polis': '保单卡',
      },
    },
  },
};
