import type { BahasaLain } from '@shared/bahasa';
import type { LabelAdegan } from '../label';

/**
 * Terjemahan teks yang digambar di adegan misi acara 02 (sumber: ./a02.ts).
 * DRAF, belum ditinjau penutur asli. Adegan ini tanpa stiker kategori dan tanpa papan angka.
 * Tata letak disetel untuk lebar label Indonesia, jadi tiap label dijaga kira-kira selebar itu:
 * tiga label di pojok kanan ("Tumpukan peti", "Sisi penyok", "Label peti") dan swafoto di tepi kiri
 * tidak boleh melebar sampai menimpa benda di sebelahnya. Istilah mengikuti opsi panjang di
 * shared/i18n/acara/a02.ts.
 */
export const label: Record<BahasaLain, LabelAdegan> = {
  en: {
    objek: {
      spanduk: 'Promo banner',
      gerobak: 'Ice cart',
      tumpukan: 'Stack of crates',
      penyok: 'Dented side',
      label: 'Crate label',
      selfie: 'Courier selfie',
    },
  },
  zh: {
    objek: {
      spanduk: '促销横幅',
      gerobak: '冷饮推车',
      tumpukan: '整堆箱子',
      penyok: '凹陷的一侧',
      label: '箱子标签',
      selfie: '快递员自拍',
    },
  },
};
