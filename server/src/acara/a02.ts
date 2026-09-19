import type { BerkasKunciAcara } from './tipe';

/**
 * Kunci misi acara 02 - Jepret Dulu, Baru Angkut (SERVER ONLY).
 * DRAF tim game, belum ditinjau PIC Claim. Sumber konsep: kunci misi latihan 2 (foto keseluruhan,
 * detail titik kerusakan, identitas) + foto penerimaan misi latihan 6 (tumpukan peti, peti bernomor).
 * `pembahasan` (en/zh) = terjemahan `summary` dan `explanation`; kunci tidak ikut berubah.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a02-jepret-kiriman',
    roundIndex: 1,
    summary: 'Tiga foto yang menghubungkan kiriman saat diterima, titik kerusakan, dan identitas petinya.',
    steps: [
      {
        stepId: 'bukti',
        weight: 1,
        multi: ['tumpukan', 'penyok', 'label'],
        requiredSelections: 3,
        explanation:
          'Foto seluruh tumpukan menunjukkan kondisi kiriman saat diterima, foto dekat sisi penyok menunjukkan titik kerusakan, foto label kiriman dan nomor peti memastikan peti yang diperiksa benar. Selfie, spanduk promo, dan gerobak es tidak membantu pemeriksaan.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli); istilah mengikuti pembahasan m02 & m06 di ../answerKeys.i18n.ts.
  pembahasan: {
    en: {
      summary: 'Three photos that link the shipment on receipt, the point of damage, and the identity of the crate.',
      steps: {
        bukti:
          'The photo of the whole stack shows the condition of the shipment on receipt, the close-up photo of the dented side shows the point of damage, and the photo of the shipping label and crate number confirms that the right crate is being inspected. The selfie, the promo banner, and the ice cart do not help the inspection.',
      },
    },
    zh: {
      summary: '三张照片，把收货时的货物、损坏部位和箱子的身份标识联系起来。',
      steps: {
        bukti:
          '整堆箱子的照片显示货物收货时的状况，凹陷一侧的近距离照片显示损坏部位，货运标签和箱号的照片用来确认查勘的箱子没有弄错。自拍、促销横幅和冷饮推车对查勘没有帮助。',
      },
    },
  },
};
