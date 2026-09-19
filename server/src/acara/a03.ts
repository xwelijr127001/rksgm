import type { BerkasKunciAcara } from './tipe';

/**
 * Kunci misi acara 03 - Empat Foto, Apa Tugasnya? (SERVER ONLY).
 * DRAF tim game, BELUM ditinjau PIC Claim. Empat kegunaan disalin dari penjelasan kunci m02
 * (../answerKeys.ts): keseluruhan = kondisi kendaraan, detail = titik benturan, identitas =
 * memastikan kendaraan yang diperiksa benar, foto lain = tidak membantu pemeriksaan.
 * `pembahasan` (en/zh) = terjemahan `summary` dan `explanation`; kunci tidak ikut berubah.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a03-tugas-foto',
    roundIndex: 2,
    summary:
      'Foto seluruh mobil = kondisi kendaraan, foto bemper dari dekat = titik benturan, foto plat & nomor rangka = identitas kendaraan; selfie tidak membantu pemeriksaan.',
    steps: [
      {
        stepId: 'fungsi',
        weight: 1,
        assign: {
          'foto-a': 'kondisi',
          'foto-b': 'titik',
          'foto-c': 'identitas',
          'foto-d': 'tidak',
        },
        explanation:
          'Foto seluruh mobil menunjukkan kondisi kendaraan secara keseluruhan. Foto bemper belakang kanan dari dekat menunjukkan titik benturan. Foto plat nomor dan nomor rangka memastikan kendaraan yang diperiksa benar. Selfie tidak memperlihatkan kendaraan maupun kerusakannya, jadi tidak membantu pemeriksaan.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli); istilah mengikuti pembahasan m02 di ../answerKeys.i18n.ts.
  pembahasan: {
    en: {
      summary:
        'Whole-car photo = vehicle condition, close-up bumper photo = point of impact, number plate & chassis number photo = vehicle identity; the selfie does not help the inspection.',
      steps: {
        fungsi:
          "The photo of the whole car shows the vehicle's overall condition. The close-up photo of the rear-right bumper shows the point of impact. The photo of the number plate and chassis number confirms that the right vehicle is being inspected. The selfie shows neither the vehicle nor its damage, so it does not help the inspection.",
      },
    },
    zh: {
      summary: '整车照片 = 车辆状况，保险杠近照 = 碰撞部位，车牌和车架号照片 = 车辆身份；自拍对查勘没有帮助。',
      steps: {
        fungsi:
          '整车照片显示车辆的整体状况。后保险杠右侧的近照显示碰撞部位。车牌和车架号的照片用来确认查勘的车辆没有弄错。自拍既拍不到车辆，也拍不到损坏情况，所以对查勘没有帮助。',
      },
    },
  },
};
