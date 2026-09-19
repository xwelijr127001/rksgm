import type { BerkasKunciAcara } from './tipe';

/**
 * Kunci misi acara 01 - Setelah Api Padam (SERVER ONLY). DRAF, belum ditinjau PIC Claim.
 * Sumber: kunci misi latihan 1 (dokumentasi + laporan menjaga jejak kejadian) dan misi latihan 3
 * (foto kerusakan & barang terdampak), dipindahkan ke properti pasca kebakaran.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a01-api-padam',
    roundIndex: 0,
    summary:
      'Setelah lokasi aman: foto kerusakan dan barang terdampak sebelum dipindahkan, lalu laporkan melalui kanal klaim.',
    steps: [
      {
        stepId: 'tindakan',
        weight: 1,
        multi: ['foto', 'lapor'],
        requiredSelections: 2,
        explanation:
          'Foto sebelum barang dipindahkan dan laporan lewat kanal klaim menjaga jejak kejadian. Membuang barang hangus, memperbaiki dulu, atau membuka toko seperti biasa tanpa lapor membuat bukti hilang.',
      },
    ],
  },
  // Terjemahan pembahasan. DRAF, belum ditinjau penutur asli / PIC Claim. Istilah mengikuti m01 & m03 di
  // ../answerKeys.i18n.ts (jejak kejadian = a clear trail of what happened / 事故的痕迹) dan label opsi
  // di shared/i18n/acara/a01.ts.
  pembahasan: {
    en: {
      summary:
        'Once the site is safe: photograph the damage and the affected items before they are moved, then report the incident through the claims channel.',
      steps: {
        tindakan:
          'Photos taken before the items are moved, plus a report through the claims channel, keep a clear trail of what happened. Throwing away the burnt items, repairing first, or opening the shop as usual without reporting means the evidence is lost.',
      },
    },
    zh: {
      summary: '现场安全之后：先在搬动之前拍下损坏情况和受损物品，再通过理赔渠道报案。',
      steps: {
        tindakan:
          '在搬动物品之前拍照，再通过理赔渠道报案，才能留住事故的痕迹。扔掉烧焦的物品、先修理，或者不报案就照常开店，都会让证据消失。',
      },
    },
  },
};
