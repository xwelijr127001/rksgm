import type { BerkasKunciAcara } from './tipe';

/**
 * KUNCI misi acara 09 - Hitung Berlapis (SERVER ONLY). DRAF tim game, BELUM ditinjau PIC Claim.
 *
 * Hitungan (pola m09-hitung-teliti, ketentuan sama: 10%, minimum Rp5.000.000):
 *   dasar  = boom Rp28.000.000 + kaca kabin Rp12.000.000            = Rp40.000.000
 *            (track shoe & selang Rp15.000.000 = kondisi sebelum kejadian; mesin Rp5.000.000 = keausan)
 *   risiko = yang lebih besar dari 10% x Rp40.000.000 (Rp4.000.000) dan minimum Rp5.000.000 = Rp5.000.000
 *   hasil  = Rp40.000.000 - Rp5.000.000                             = Rp35.000.000
 *
 * Chip pengecoh di shared/acara/a09.ts = hasil SATU kekeliruan yang masuk akal:
 *   dasar  : 28 juta = boom saja; 55 juta = hanya mesin yang dikeluarkan; 60 juta = total estimasi
 *   risiko : 4 juta = lupa minimum; 5,5 juta = 10% x 55 juta; 6 juta = 10% x total estimasi
 *   hasil  : 36 juta = lupa minimum (40 - 4); 49,5 juta = dasar 55 juta (55 - 5,5);
 *            54 juta = dasar total estimasi (60 - 6); 55 juta = total estimasi - minimum (60 - 5)
 * Posisi kunci di deretan chip (urut naik): dasar ke-2, risiko ke-2, hasil ke-1. SENGAJA tidak
 * ditambah chip Rp23.000.000 (28 - 5): kunci `hasil` akan menjadi chip ke-2 juga, sehingga pola
 * "selalu chip kedua" sama persis dengan m09-hitung-teliti (kunci ke-2 di ketiga langkahnya) dan
 * bisa dihafal dari paket latihan.
 * Tanpa toleransi: semua nilai bulat dan tersedia sebagai chip.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a09-hitung-lapis',
    roundIndex: 8,
    summary:
      'Masuk hitungan Rp40.000.000 (boom + kaca kabin); risiko sendiri Rp5.000.000 karena 10% hanya Rp4.000.000, di bawah minimum; hasil akhir Rp35.000.000.',
    steps: [
      {
        stepId: 'dasar',
        weight: 2,
        number: { value: 40_000_000 },
        explanation:
          'Hanya kerusakan akibat benturan yang masuk hitungan: boom Rp28.000.000 + kaca kabin Rp12.000.000 = Rp40.000.000. Track shoe aus & selang hidrolik rembes sudah tercatat di buku servis sebelum kejadian, dan mesin rusak karena keausan yang dikecualikan kartu polis, jadi keduanya dikeluarkan.',
      },
      {
        stepId: 'risiko',
        weight: 1,
        number: { value: 5_000_000 },
        explanation:
          '10% x Rp40.000.000 = Rp4.000.000. Hasil itu lebih kecil dari minimum Rp5.000.000, jadi risiko sendiri yang dipakai adalah minimumnya: Rp5.000.000.',
      },
      {
        stepId: 'hasil',
        weight: 2,
        number: { value: 35_000_000 },
        explanation:
          'Rp40.000.000 - Rp5.000.000 = Rp35.000.000 pada simulasi ini. Dasarnya kerugian terkait kejadian, bukan total estimasi Rp60.000.000.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli); istilah mengikuti pembahasan m08 & m09 di ../answerKeys.i18n.ts.
  pembahasan: {
    en: {
      summary:
        'Loss counted Rp40.000.000 (boom + cab glass); deductible Rp5.000.000 because 10% is only Rp4.000.000, below the minimum; final result Rp35.000.000.',
      steps: {
        dasar:
          'Only the damage caused by the impact goes into the calculation: boom Rp28.000.000 + cab glass Rp12.000.000 = Rp40.000.000. The worn track shoes & leaking hydraulic hose were already noted in the service record before the incident, and the engine failed because of wear and tear, which the policy card excludes, so both are left out.',
        risiko:
          '10% x Rp40.000.000 = Rp4.000.000. That result is lower than the minimum of Rp5.000.000, so the deductible that applies is the minimum: Rp5.000.000.',
        hasil:
          'Rp40.000.000 - Rp5.000.000 = Rp35.000.000 in this simulation. The base is the incident-related loss, not the estimate total of Rp60.000.000.',
      },
    },
    zh: {
      summary:
        '计入损失 Rp40.000.000（动臂 + 驾驶室玻璃）；免赔额 Rp5.000.000，因为 10% 只有 Rp4.000.000，低于最低金额；最终结果 Rp35.000.000。',
      steps: {
        dasar:
          '只有碰撞造成的损坏才计入计算：动臂 Rp28.000.000 + 驾驶室玻璃 Rp12.000.000 = Rp40.000.000。履带板磨损和液压软管渗漏在事故前的保养记录里已有记载，发动机的损坏则源于磨损，而保单卡把磨损列为除外，所以这两项都不计入。',
        risiko:
          '10% × Rp40.000.000 = Rp4.000.000。这个结果低于最低金额 Rp5.000.000，因此实际采用的免赔额就是最低金额：Rp5.000.000。',
        hasil:
          '在本次模拟中，Rp40.000.000 - Rp5.000.000 = Rp35.000.000。计算基数是与事故相关的损失，而不是估价合计 Rp60.000.000。',
      },
    },
  },
};
