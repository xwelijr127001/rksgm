import type { BerkasKunciAcara } from './tipe';

/**
 * KUNCI misi acara 05 - Kerusakan Sama, Nasib Beda (SERVER ONLY).
 * DRAF tim game, BELUM ditinjau PIC Claim. Pasangan konten: shared/acara/a05.ts.
 *
 * Hitungan (diperiksa ulang):
 * - Kasus B: Rp160.000.000 / Rp200.000.000 = 0,80 = 80% -> memenuhi ambang minimal 75%.
 * - Kasus C: Rp160.000.000 / Rp400.000.000 = 0,40 = 40% -> di bawah ambang 75%.
 * - Chip pengecoh langkah `persen`: 64 = Rp160 juta / Rp250 juta (nilai Polis A), 40 = dibagi
 *   nilai Polis C, 75 = angka ambang.
 * Kategori `perlu-data` sengaja tidak terpakai, dan dua map mendapat stempel yang sama.
 *
 * `pembahasan` (en/zh) = terjemahan `summary` dan `explanation`; kunci tidak ikut berubah.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a05-nasib-beda',
    roundIndex: 4,
    summary:
      'Kasus A (Comprehensive) dan Kasus B (TLO, kerusakan 80% dari nilai kendaraan) dapat dilanjutkan untuk penilaian; Kasus C (TLO, 40%) tidak memenuhi ambang 75% pada simulasi.',
    steps: [
      {
        stepId: 'persen',
        weight: 1,
        number: { value: 80 },
        explanation:
          'Rp160 juta : Rp200 juta = 80%. Pembaginya nilai kendaraan Kasus B sendiri, bukan nilai mobil lain (dibagi Rp250 juta jadi 64%, dibagi Rp400 juta jadi 40%). Angka 75% adalah ambangnya, bukan hasil hitungnya.',
      },
      {
        stepId: 'simpul',
        weight: 2,
        assign: { 'kasus-a': 'lanjut', 'kasus-b': 'lanjut', 'kasus-c': 'tidak-ambang' },
        explanation:
          'Kartu A menyatakan kerusakan benturan tercakup, jadi penilaian dapat dilanjutkan. Kartu B adalah TLO, tetapi kerusakannya 80% dari nilai kendaraan sehingga memenuhi ambang minimal 75%: TLO tidak selalu berarti "tidak". Kartu C juga TLO dengan estimasi rupiah yang sama, namun Rp160 juta dari Rp400 juta hanya 40%, jadi tidak memenuhi ambang pada simulasi ini. Semua data sudah ada di kartu, jadi tidak perlu informasi tambahan.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli / PIC Claim); istilah mengikuti pembahasan m05 di
  // ../answerKeys.i18n.ts. Deret angka tiap teks sama dengan sumber Indonesianya (dijaga tes).
  pembahasan: {
    en: {
      summary:
        'Case A (Comprehensive) and Case B (TLO, damage at 80% of the vehicle value) can proceed to assessment; Case C (TLO, 40%) does not meet the 75% threshold in this simulation.',
      steps: {
        persen:
          "Rp160 million ÷ Rp200 million = 80%. Divide by Case B's own vehicle value, not the value of another car (dividing by Rp250 million gives 64%, dividing by Rp400 million gives 40%). The 75% figure is the threshold, not the result of the calculation.",
        simpul:
          'Card A states that impact damage is covered, so the assessment can proceed. Card B is TLO, but its damage is 80% of the vehicle value, so it meets the threshold of at least 75%: TLO does not always mean "no". Card C is also TLO with the same rupiah estimate, yet Rp160 million out of Rp400 million is only 40%, so it does not meet the threshold in this simulation. All the data is already on the cards, so no more information is needed.',
      },
    },
    zh: {
      summary:
        '案件 A（Comprehensive）和案件 B（TLO，损坏为车辆价值的 80%）可以继续进行评估；案件 C（TLO，40%）在模拟中未达到 75% 的门槛。',
      steps: {
        persen:
          'Rp160 juta（一亿六千万印尼盾）÷ Rp200 juta（两亿印尼盾）= 80%。除数是案件 B 自己的车辆价值，而不是别的车的价值（除以 Rp250 juta 得 64%，除以 Rp400 juta 得 40%）。75% 是门槛，不是计算结果。',
        simpul:
          '保单卡 A 写明碰撞损坏属于保障范围，因此可以继续评估。保单卡 B 是 TLO，但损坏达到车辆价值的 80%，满足至少 75% 的门槛：TLO 并不总是意味着“不行”。保单卡 C 同样是 TLO，损坏估价的金额也一样，但 Rp160 juta 只占 Rp400 juta 的 40%，因此在本次模拟中未达到门槛。所有数据都已写在卡片上，不需要补充信息。',
      },
    },
  },
};
