import type { BerkasKunciAcara } from './tipe';

/**
 * KUNCI misi acara 07 - Tiga Polis, Satu Banjir (SERVER ONLY). DRAF, belum ditinjau PIC Claim.
 * Konten publik: shared/acara/a07.ts. Silabus: docs/silabus-paket-acara.md.
 *
 * Pemeriksaan tanggal (kejadian 14 Feb 2026):
 * - Polis A 01 Mar 2025 - 28 Feb 2026, banjir tercantum       -> dalam periode  -> sesuai
 * - Polis B 01 Mar 2026 - 28 Feb 2027, banjir tercantum       -> belum mulai    -> luar-periode
 * - Polis C 01 Jan 2026 - 31 Des 2026, banjir TIDAK tercantum -> dalam periode  -> tanpa-banjir
 * Objek ketiganya sama dengan laporan (Gudang Sentra Niaga), jadi `objek-beda` murni pengecoh.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a07-tiga-polis',
    roundIndex: 6,
    summary:
      'Berkas A sesuai. Berkas B di luar periode: polisnya baru mulai 01 Mar 2026, kejadiannya 14 Feb 2026. Berkas C tidak mencantumkan perluasan banjir.',
    steps: [
      {
        stepId: 'periksa',
        weight: 2,
        assign: { 'berkas-a': 'sesuai', 'berkas-b': 'luar-periode', 'berkas-c': 'tanpa-banjir' },
        explanation:
          'Laporan mencatat banjir pada 14 Feb 2026. Polis A mencantumkan perluasan banjir dan periodenya (01 Mar 2025 - 28 Feb 2026) mencakup tanggal itu. Polis B juga mencantumkan banjir, tetapi periodenya baru mulai 01 Mar 2026. Periode Polis C mencakup tanggal kejadian, tetapi perluasan banjirnya tidak tercantum. Objek ketiga polis sama dengan laporan, jadi bukan itu masalahnya.',
      },
      {
        stepId: 'alasan',
        weight: 1,
        single: 'risiko-periode',
        explanation:
          'Yang diperiksa adalah jenis risiko yang tercantum dan periode polis yang mencakup tanggal kejadian. Polis terbaru belum berlaku saat kejadian, nilai pertanggungan yang lebih besar bukan alasan, dan banjir tidak otomatis dijamin semua polis properti.',
      },
    ],
  },
  // Terjemahan ringkasan & penjelasan (DRAF, belum ditinjau penutur asli / PIC Claim). Istilah
  // mengikuti m07 di ../answerKeys.i18n.ts dan shared/i18n/acara/a07.ts; angka sama persis dengan sumber.
  pembahasan: {
    en: {
      summary:
        'File A matches. File B is outside the period: its policy only starts on 01 Mar 2026, while the incident was on 14 Feb 2026. File C does not list the flood extension.',
      steps: {
        periksa:
          "The report records a flood on 14 Feb 2026. Policy A lists the flood extension and its period (01 Mar 2025 - 28 Feb 2026) covers that date. Policy B also lists flood, but its period only starts on 01 Mar 2026. Policy C's period covers the date of the incident, but its flood extension is not listed. The insured object on all three policies is the same as in the report, so that is not the issue.",
        alasan:
          'What gets checked is the type of risk listed and a policy period that covers the date of the incident. The newest policy was not yet in force when the incident happened, a higher sum insured is not a reason, and flood is not automatically covered under every property policy.',
      },
    },
    zh: {
      summary:
        '档案 A 相符。档案 B 不在保险期间内：保单 2026年3月1日才开始，而事故发生在 2026年2月14日。档案 C 未列明洪水扩展保障。',
      steps: {
        periksa:
          '报告记录的是 2026年2月14日的洪水。保单 A 列明了洪水扩展保障，保险期间（2025年3月1日至2026年2月28日）也涵盖这一天。保单 B 同样列明了洪水，但保险期间 2026年3月1日才开始。保单 C 的保险期间涵盖事故日期，但洪水扩展保障未列明。三份保单的承保对象都与报告一致，所以问题不在这里。',
        alasan:
          '要核对的是列明的风险类型，以及涵盖事故日期的保险期间。最新的保单在事故发生时还没有生效，保险金额更高不是理由，洪水也不是所有财产保单都自动保障的。',
      },
    },
  },
};
