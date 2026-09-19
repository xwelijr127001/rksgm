import type { BerkasKunciAcara } from './tipe';

/**
 * KUNCI misi acara 10 - Grand Mission: Banjir Susulan (SERVER ONLY). DRAF, belum ditinjau PIC Claim.
 * Sengaja berbeda dari misi latihan 10 (di sana: A luar jaminan, B klarifikasi, C survei).
 * Hitungan Kasus A: Rp30.000.000 / Rp200.000.000 = 15%, di bawah ambang TLO 75%.
 * Kasus C: periode berakhir 28 Feb 2026, kejadian 14 Mar 2026 (lewat 14 hari).
 * Kasus D: 40 - 38 = selisih 2 peti, 5 kemasan basah, foto belum dilampirkan.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a10-banjir-susulan',
    roundIndex: 9,
    summary:
      'A: kerusakan 15%, di bawah ambang TLO 75%. B: semua sesuai, lanjut survei. C: kejadian 14 Mar 2026 di luar periode yang berakhir 28 Feb 2026. D: selisih 2 peti dan 5 kemasan basah, dokumentasikan lalu lengkapi dokumen pengangkutan.',
    steps: [
      {
        stepId: 'temuan',
        weight: 1,
        assign: { 'kasus-a': 'ambang', 'kasus-b': 'sesuai', 'kasus-c': 'periode', 'kasus-d': 'selisih' },
        explanation:
          'A: estimasi Rp30.000.000 dari nilai kendaraan Rp200.000.000 hanya 15%, di bawah ambang TLO 75%. B: banjir tercakup, nomor seri kartu dan laporan sama (EX-4471), periode dan bukti sesuai. C: perluasan banjir tercantum, tetapi periode berakhir 28 Feb 2026 dan kejadian 14 Mar 2026. D: daftar pengiriman mencatat 40 peti, bukti penerimaan 38 peti (selisih 2 peti) dengan 5 kemasan basah, dan foto penerimaan belum dilampirkan.',
      },
      {
        stepId: 'tindak',
        weight: 2,
        assign: {
          'kasus-a': 'tidak-ambang',
          'kasus-b': 'survei',
          'kasus-c': 'luar-periode',
          'kasus-d': 'dokumentasi',
        },
        explanation:
          'A: banjir tercakup, tetapi kerusakan 15% tidak memenuhi ambang TLO 75% pada simulasi. B: nomor seri sama, jadi tidak ada yang perlu diklarifikasi; lanjut ke survei / penilaian sesuai prosedur. C: tanggal kejadian di luar periode yang tercantum pada kartu. D: catat selisih 2 peti dan 5 kemasan basah, lalu lengkapi dokumen pengangkutan; jangan menyimpulkan seluruh kerugian otomatis dijamin.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli / PIC Claim) dari `summary` dan `explanation`;
  // kunci tidak ikut berubah. Istilah mengikuti pembahasan m05, m06, m07, m10 di ../answerKeys.i18n.ts.
  pembahasan: {
    en: {
      summary:
        'A: damage of 15%, below the TLO threshold of 75%. B: everything matches, proceed to survey. C: the incident on 14 Mar 2026 is outside the period that ended on 28 Feb 2026. D: a difference of 2 crates and 5 with wet packaging; document it, then complete the transport documents.',
      steps: {
        temuan:
          'A: the estimate of Rp30.000.000 against a vehicle value of Rp200.000.000 is only 15%, below the TLO threshold of 75%. B: flood is covered, the serial number on the card and on the report is the same (EX-4471), and the period and evidence match. C: the flood extension is listed, but the period ended on 28 Feb 2026 and the incident was on 14 Mar 2026. D: the shipping list records 40 crates, the proof of receipt 38 crates (a difference of 2 crates) with 5 with wet packaging, and the photos on receipt are not yet attached.',
        tindak:
          'A: flood is covered, but damage of 15% does not meet the TLO threshold of 75% in the simulation. B: the serial numbers are the same, so there is nothing to clarify; proceed to survey / assessment according to procedure. C: the date of the incident is outside the period listed on the card. D: record the difference of 2 crates and the 5 with wet packaging, then complete the transport documents; do not conclude that the whole loss is automatically covered.',
      },
    },
    zh: {
      summary:
        'A：损坏只占 15%，低于 TLO 门槛 75%。B：全部相符，进入查勘。C：事故发生在 2026年3月14日，不在已于 2026年2月28日到期的保险期间内。D：相差 2 箱，另有 5 箱包装受潮；先记录下来，再备齐运输文件。',
      steps: {
        temuan:
          'A：估价 Rp30.000.000 只占车辆价值 Rp200.000.000 的 15%，低于 TLO 门槛 75%。B：洪水在保障范围内，保单卡和报告上的序列号相同（EX-4471），保险期间和证据也都相符。C：洪水扩展保障已列明，但保险期间已于 2026年2月28日到期，而事故发生在 2026年3月14日。D：发货清单记录 40 箱，收货凭证记录 38 箱（相差 2 箱），其中 5 箱包装受潮，收货照片尚未附上。',
        tindak:
          'A：洪水在保障范围内，但 15% 的损坏在模拟中未达到 TLO 门槛 75%。B：序列号相同，没有需要核实的地方；按流程进入查勘／评估。C：事故日期不在卡片所列的保险期间内。D：记录相差的 2 箱和 5 箱包装受潮的情况，然后备齐运输文件；不要直接认定全部损失自动获得保障。',
      },
    },
  },
};
