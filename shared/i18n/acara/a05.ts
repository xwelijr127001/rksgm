import type { BahasaLain } from '../../bahasa';
import type { TeksDokumen, TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 05 - Kerusakan Sama, Nasib Beda (sumber: ../../acara/a05.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m05-polis-mana di ../misi.en.ts dan ../misi.zh.ts: kartu polis = Policy Card /
 *   保单卡, nilai kendaraan = vehicle value / 车辆价值, ambang kerusakan total = total loss threshold /
 *   全损门槛, ambang TLO = TLO threshold / TLO 门槛, kasus = Case / 案件. "Estimasi kerusakan" mengikuti
 *   a10 (Damage estimate / 损坏估价).
 * - Pemisah ' - ' pada productLabel dan label kasus DIPERTAHANKAN: chip item menampilkan bagian
 *   sebelum ' - ' ("Case A", "案件 A").
 * - Bilangan yang di sumber ditulis dengan kata ("tiga", "dua") tetap ditulis dengan kata.
 *   "Rp160 juta" di zh diberi keterangan "一亿六千万印尼盾" (pola m05: "Rp200 juta（两亿印尼盾）").
 * - Ketiga kartu diterjemahkan dengan pola yang sama dan TANPA persen kerusakan, persis seperti
 *   sumbernya: tidak ada kata tambahan yang menunjuk ke jawaban.
 */

// ------------------------------------------------------------------ ENGLISH
const CATATAN_EN = 'Simulation card for decision-making practice.';

function kartuTloEn(huruf: string, nilai: string): TeksDokumen {
  return {
    title: `Policy Card ${huruf}`,
    subtitle: 'TLO - Total Loss Only (simulation)',
    rows: [
      { label: 'Vehicle value', value: nilai },
      { label: 'Total loss threshold', value: 'At least 75% of the vehicle value' },
      { label: 'Damage estimate', value: 'Rp160.000.000' },
      { label: 'Policy status', value: 'Active' },
    ],
    note: CATATAN_EN,
  };
}

// ------------------------------------------------------------------ 简体中文
const CATATAN_ZH = '用于决策练习的模拟卡片。';

function kartuTloZh(huruf: string, nilai: string): TeksDokumen {
  return {
    title: `保单卡 ${huruf}`,
    subtitle: 'TLO - Total Loss Only（模拟）',
    rows: [
      { label: '车辆价值', value: nilai },
      { label: '全损门槛', value: '至少为车辆价值的 75%' },
      { label: '损坏估价', value: 'Rp160.000.000' },
      { label: '保单状态', value: '有效' },
    ],
    note: CATATAN_ZH,
  };
}

export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Same Damage, Different Fates',
    productLabel: 'AUTO - Motor Vehicle',
    location: 'Raksa Office',
    story:
      'Three cars with impact damage have landed on the claims desk today. Two of them are badly damaged, with the same estimate: Rp160 million. Assume all the policies are active and the other conditions in the simulation are met.',
    instruction: 'First work out the damage percentage for Case B, then stamp a conclusion on each case folder.',
    interactionLabel: 'Work out the percentage, then stamp the folders',
    rakiBriefing:
      'The rupiah amount is the same, but the car values may not be. Open the cards and work out the percentage yourself, okay?',
    learning:
      "The same damage can be handled differently: look at the policy cover, then work out the damage as a percentage of each vehicle's own value and compare it with the threshold.",
    policyCards: {
      'polis-a': {
        title: 'Policy Card A',
        subtitle: 'Comprehensive (simulation)',
        rows: [
          { label: 'Vehicle value', value: 'Rp250.000.000' },
          { label: 'Impact damage', value: 'Covered, subject to the card terms' },
          { label: 'Damage estimate', value: 'Rp10.000.000' },
          { label: 'Policy status', value: 'Active' },
        ],
        note: CATATAN_EN,
      },
      'polis-b': kartuTloEn('B', 'Rp200.000.000'),
      'polis-c': kartuTloEn('C', 'Rp400.000.000'),
    },
    steps: {
      persen: {
        prompt: 'The damage estimate for Case B = what percentage of its vehicle value?',
        unit: '%',
      },
      simpul: {
        prompt: 'Stamp a conclusion on each case folder',
        item: {
          'kasus-a': { label: 'Case A - Policy Card A (Comprehensive)' },
          'kasus-b': { label: 'Case B - Policy Card B (TLO)' },
          'kasus-c': { label: 'Case C - Policy Card C (TLO)' },
        },
        kategori: {
          lanjut: { label: 'Can proceed to assessment' },
          'tidak-ambang': { label: 'The damage does not meet the TLO threshold in the simulation' },
          'perlu-data': { label: 'More information is needed before concluding' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '同样的损坏，不同的结局',
    productLabel: 'AUTO - 机动车辆',
    location: 'Raksa 办公室',
    story:
      '今天有三辆碰撞受损的车送到了理赔桌上。其中两辆损坏严重，损坏估价相同，都是 Rp160 juta（一亿六千万印尼盾）。假设所有保单均有效，且模拟中的其他条件均已满足。',
    instruction: '先算出案件 B 的损坏百分比，再为每个案件文件夹盖上结论印章。',
    interactionLabel: '先算百分比，再给文件夹盖章',
    rakiBriefing: '金额一样，车的价值可不一定一样。打开保单卡，自己算算百分比吧。',
    learning: '同样的损坏，处理方式可能不同：先看保单的保障，再算出损坏占各自车辆价值的百分比，并与门槛比较。',
    policyCards: {
      'polis-a': {
        title: '保单卡 A',
        subtitle: 'Comprehensive（模拟）',
        rows: [
          { label: '车辆价值', value: 'Rp250.000.000' },
          { label: '碰撞损坏', value: '按卡片条款属于保障范围' },
          { label: '损坏估价', value: 'Rp10.000.000' },
          { label: '保单状态', value: '有效' },
        ],
        note: CATATAN_ZH,
      },
      'polis-b': kartuTloZh('B', 'Rp200.000.000'),
      'polis-c': kartuTloZh('C', 'Rp400.000.000'),
    },
    steps: {
      persen: {
        prompt: '案件 B 的损坏估价 = 其车辆价值的百分之几？',
        unit: '%',
      },
      simpul: {
        prompt: '为每个案件文件夹盖上结论印章',
        item: {
          'kasus-a': { label: '案件 A - 保单卡 A（Comprehensive）' },
          'kasus-b': { label: '案件 B - 保单卡 B（TLO）' },
          'kasus-c': { label: '案件 C - 保单卡 C（TLO）' },
        },
        kategori: {
          lanjut: { label: '可以继续进行评估' },
          'tidak-ambang': { label: '损坏未达到模拟中的 TLO 门槛' },
          'perlu-data': { label: '需要补充信息后才能下结论' },
        },
      },
    },
  },
};
