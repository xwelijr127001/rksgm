import type { BerkasKunciAcara } from './tipe';

/**
 * Kunci misi acara 08 - Lini Masa Excavator (SERVER ONLY). DRAF, belum ditinjau PIC Claim.
 * Pasangan konten: shared/acara/a08.ts. Dasar kunci = urutan tanggal antar dokumen:
 * servis 21 Jul 2026 -> kejadian 09 Agu 2026 -> pemeriksaan 11 Agu 2026.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a08-linimasa-ex',
    roundIndex: 7,
    summary:
      'Boom dan kaca kabin = terkait kejadian; track shoe dan selang hidrolik = kondisi sebelum kejadian; mesin = perlu pemeriksaan teknis. Kesimpulan awal: pilah menurut bukti, jangan pukul rata.',
    steps: [
      {
        stepId: 'pilah',
        weight: 2,
        assign: { boom: 'terkait', kaca: 'terkait', track: 'sebelumnya', selang: 'sebelumnya', mesin: 'teknis' },
        explanation:
          'Kartu polis simulasi menjamin benturan dan mengecualikan keausan bertahap. Boom dan kaca kabin tercatat baik pada servis 21 Jul 2026 dan baru rusak pada pemeriksaan 11 Agu 2026, cocok dengan kronologi kejadian 09 Agu 2026 (boom dan kabin membentur dinding galian), jadi diperiksa sebagai kerusakan terkait kejadian. Track shoe aus dan selang hidrolik rembes sudah tercatat 21 Jul 2026, sebelum kejadian, jadi dipisahkan sebagai kondisi sebelumnya. Mesin sulit hidup muncul setelah kejadian tetapi penyebabnya belum diketahui, jadi perlu pemeriksaan teknis tambahan.',
      },
      {
        stepId: 'simpul',
        weight: 1,
        single: 'pisah',
        explanation:
          'Keputusan mengikuti bukti tiap temuan. Benturan tidak membuat semua temuan otomatis dijamin, dan catatan keausan tidak membuat seluruh laporan di luar jaminan. Memperbaiki dulu tanpa koordinasi membuat bukti hilang, sehingga temuan tidak bisa lagi dipilah.',
      },
    ],
  },
  // Terjemahan pembahasan (DRAF, belum ditinjau penutur asli). Istilah mengikuti m08 di
  // ../answerKeys.i18n.ts dan konten shared/i18n/acara/a08.ts; tanggal ditulis lengkap seperti sumbernya.
  pembahasan: {
    en: {
      summary:
        'Boom and cab glass = related to the incident; track shoes and hydraulic hose = condition before the incident; engine = needs a technical inspection. Initial conclusion: sort according to the evidence, do not lump everything together.',
      steps: {
        pilah:
          'The simulation policy card covers impact and excludes gradual wear and tear. The boom and the cab glass were recorded as good at the service on 21 Jul 2026 and were only found damaged at the inspection on 11 Aug 2026, which fits the sequence of events on 09 Aug 2026 (the boom and cab hit the excavation wall), so they are inspected as damage related to the incident. The worn track shoes and the leaking hydraulic hose were already recorded on 21 Jul 2026, before the incident, so they are set aside as a condition before the incident. The engine became hard to start after the incident but the cause is not yet known, so it needs a further technical inspection.',
        simpul:
          'The decision follows the evidence for each finding. An impact does not make every finding automatically covered, and a record of wear does not put the whole report outside the cover. Repairing first without coordination means the evidence is lost, so the findings can no longer be sorted.',
      },
    },
    zh: {
      summary:
        '动臂和驾驶室玻璃 = 与事故相关；履带板和液压软管 = 事故前已有的状况；发动机 = 需要技术检查。初步结论：按证据逐项分类，不要一概而论。',
      steps: {
        pilah:
          '模拟保单卡保障碰撞，但逐渐磨损被列为除外，不予保障。动臂和驾驶室玻璃在 2026年7月21日 的保养中记录为状况良好，到 2026年8月11日 的检查才发现损坏，与 2026年8月9日 的事故经过（动臂和驾驶室撞上土坑侧壁）相符，因此作为与事故相关的损坏进行查勘。履带板磨损和液压软管渗漏早在 2026年7月21日 就已记录在案，也就是在事故之前，因此单独列为事故前已有的状况。发动机难以启动出现在事故之后，但原因尚未查明，因此需要进一步的技术检查。',
        simpul:
          '决定要以每项发现的证据为依据。发生了碰撞，并不代表所有发现都自动获得保障；有磨损记录，也不代表整份报案都不在保障范围内。不经沟通就先修理，会让证据消失，之后就无法再对各项发现进行分类了。',
      },
    },
  },
};
