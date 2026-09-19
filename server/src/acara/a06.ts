import type { BerkasKunciAcara } from './tipe';

/**
 * Kunci misi acara 06 - Satu per Satu, Pak Kepala Gudang (SERVER ONLY).
 * DRAF tim game, BELUM ditinjau PIC Claim. Urutan diturunkan dari materi paket latihan
 * (../answerKeys.ts), bukan dari SOP tertulis: m01 (dokumentasikan lebih dulu, lalu laporkan melalui
 * kanal klaim; memperbaiki tanpa dokumentasi/koordinasi dan membuang bagian rusak membuat bukti
 * hilang), m04 (nomor seri memastikan unit, posisi unit & bagian rusak menjelaskan kejadian),
 * m10 (lanjut ke survei / penilaian sesuai prosedur).
 * Nilai parsial otomatis per kartu (rumus assign): tiap kartu yang tepat = 1/5.
 * `pembahasan` (en/zh) = terjemahan `summary` & `explanation`; kunci tidak ikut diterjemahkan.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a06-urutan-gudang',
    roundIndex: 5,
    summary:
      'Urutannya: dokumentasi, lapor melalui kanal klaim, survei / penilaian, lalu perbaikan setelah koordinasi. Komponen yang patah jangan dibuang dulu.',
    steps: [
      {
        stepId: 'urutan',
        weight: 1,
        assign: {
          dok: 'l1',
          lapor: 'l2',
          survei: 'l3',
          perbaiki: 'l4',
          buang: 'jangan',
        },
        explanation:
          'Dokumentasikan dulu kerusakan, posisi unit, dan nomor seri, lalu laporkan melalui kanal klaim supaya kejadian tercatat. Setelah itu survei / penilaian berjalan sesuai prosedur, dan perbaikan baru dimulai setelah ada koordinasi. Mengelas sekarang atau membuang komponen yang patah membuat bukti hilang, jadi patahannya jangan dibuang dulu.',
      },
    ],
  },
  // DRAF terjemahan, belum ditinjau penutur asli. Istilah mengikuti m01, m04 & m10 di ../answerKeys.i18n.ts
  // (claims channel / 理赔渠道, survey / assessment according to procedure / 按流程…查勘／评估,
  // the evidence is lost / 让证据消失). Sumber tidak memuat angka, jadi terjemahan juga tanpa angka.
  pembahasan: {
    en: {
      summary:
        'The order: documentation, report through the claims channel, survey / assessment, then repair after coordination. Do not throw away the broken component yet.',
      steps: {
        urutan:
          "First document the damage, the unit's position, and the serial number, then report through the claims channel so the incident is recorded. After that, the survey / assessment goes ahead according to procedure, and repairs only start once there has been coordination. Welding now or throwing away the broken component means the evidence is lost, so do not throw the broken piece away yet.",
      },
    },
    zh: {
      summary: '顺序是：记录、通过理赔渠道报案、查勘／评估，然后在沟通之后修理。断掉的部件先不要扔。',
      steps: {
        urutan:
          '先记录损坏情况、设备位置和序列号，再通过理赔渠道报案，让事故留下记录。之后按流程进行查勘／评估，沟通之后才开始修理。现在就焊接，或者把断掉的部件扔掉，都会让证据消失，所以断掉的部件先不要扔。',
      },
    },
  },
};
