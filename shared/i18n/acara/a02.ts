import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 02 - Jepret Dulu, Baru Angkut (sumber: ../../acara/a02.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m02 & m06 di ../misi.en.ts dan ../misi.zh.ts: pemeriksaan = inspection / 查勘,
 *   peti = crate / 箱 ("5 号箱" seperti "4 号箱" di m06), saat diterima = on receipt / 收货时,
 *   CARGO = Goods in Transit / 货物运输, Ruko Jalan Melati = Jalan Melati Shophouse / Jalan Melati 商铺 (m03).
 * - Istilah baru di misi ini: label kiriman = shipping label / 货运标签, kurir = courier / 快递员,
 *   gerobak es = ice cart / 冷饮推车, spanduk promo = promo banner / 促销横幅.
 * - Bilangan yang di sumber ditulis dengan kata ("tiga") tetap ditulis dengan kata (three / 三);
 *   angka "3" dan "5" ditulis persis seperti sumbernya (dijaga tes).
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Snap First, Carry Later',
    productLabel: 'CARGO - Goods in Transit',
    location: 'Jalan Melati Shophouse Car Park',
    story:
      "A courier truck is unloading a shipment of spare parts in the car park in front of the customer's shop. Crate number 5 looks dented on one side. The crates are about to be carried inside, so you only have time for three photos.",
    instruction: 'Photograph the three things most useful for the inspection before the crates are carried inside.',
    interactionLabel: 'Choose 3 photos',
    rakiBriefing: 'The crates are going inside any minute now. You only get three shots, so pick the most useful ones!',
    learning: 'Photo evidence should help link the shipment, the point of damage, and its identity.',
    steps: {
      bukti: {
        prompt: 'Choose the 3 photos most useful for the inspection',
        hint: 'Choosing an irrelevant photo lowers your accuracy.',
        opsi: {
          spanduk: { label: 'Photo of the promo banner at the shop next door' },
          penyok: { label: 'Close-up photo of the dented side of crate number 5' },
          selfie: { label: 'Selfie with the courier' },
          tumpukan: { label: 'Photo of the whole stack of crates on receipt' },
          gerobak: { label: 'Photo of the ice cart on the pavement' },
          label: { label: 'Photo of the shipping label and crate number' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '先拍照，再搬货',
    productLabel: 'CARGO - 货物运输',
    location: 'Jalan Melati 商铺停车场',
    story:
      '一辆快递货车正在客户店铺门前的停车场卸货，货物是一批零配件。5 号箱的一侧看起来凹进去了。箱子马上就要搬进店里，所以你只来得及拍三张照片。',
    instruction: '趁箱子还没搬进去，拍下对查勘最有用的三样东西。',
    interactionLabel: '选择 3 张照片',
    rakiBriefing: '箱子马上就要搬进去了。只来得及拍三张，挑最有用的拍！',
    learning: '照片证据应当能把货物、损坏部位和货物的身份标识联系起来。',
    steps: {
      bukti: {
        prompt: '选择 3 张对查勘最有用的照片',
        hint: '选了不相关的照片会降低正确率。',
        opsi: {
          spanduk: { label: '隔壁店铺促销横幅的照片' },
          penyok: { label: '5 号箱凹陷一侧的近距离照片' },
          selfie: { label: '和快递员的自拍' },
          tumpukan: { label: '收货时整堆箱子的照片' },
          gerobak: { label: '人行道上冷饮推车的照片' },
          label: { label: '货运标签和箱号的照片' },
        },
      },
    },
  },
};
