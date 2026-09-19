import type { BahasaLain } from '../../bahasa';
import type { TeksMisi, TeksOpsi } from '../misi';

/**
 * Terjemahan konten misi acara 10 - Grand Mission: Banjir Susulan (sumber: ../../acara/a10.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti ../misi.en.ts dan ../misi.zh.ts: m10 (kasus, nomor seri, bukti awal,
 *   klarifikasi, survei / 查勘), m05 (ambang TLO = TLO threshold / TLO 门槛), m07 (perluasan banjir =
 *   flood extension / 洪水扩展保障, periode polis = policy period / 保险期间, tercantum = listed /
 *   已列明), m06 (peti = crates / 箱, daftar pengiriman, bukti penerimaan, dokumen pengangkutan).
 * - Pemisah ' - ' pada label kasus DIPERTAHANKAN: chip item menampilkan bagian sebelum ' - '
 *   ("Case A", "案件 A").
 * - Bilangan yang di sumber ditulis dengan kata ("dua", "empat") tetap ditulis dengan kata.
 * - Semua kartu diterjemahkan dengan pola yang sama (nada netral): nilai baris diterjemahkan apa
 *   adanya, tanpa keterangan tambahan dalam kurung atau kata penilai di kartu mana pun.
 */

// ------------------------------------------------------------------ ENGLISH
const KASUS_EN: Record<string, TeksOpsi> = {
  'kasus-a': { label: 'Case A - Company car' },
  'kasus-b': { label: 'Case B - Heavy equipment' },
  'kasus-c': { label: 'Case C - Warehouse' },
  'kasus-d': { label: 'Case D - Goods shipment' },
};
const KARTU_EN = {
  subtitle: 'Simulation policy card',
  note: 'Date of incident: 14 Mar 2026. Simulation card for practice.',
};
const PERIODE_2026_EN = { label: 'Policy period', value: '01 Jan 2026 - 31 Dec 2026' };

// ------------------------------------------------------------------ 简体中文
const KASUS_ZH: Record<string, TeksOpsi> = {
  'kasus-a': { label: '案件 A - 公司用车' },
  'kasus-b': { label: '案件 B - 重型设备' },
  'kasus-c': { label: '案件 C - 仓库' },
  'kasus-d': { label: '案件 D - 运输货物' },
};
const KARTU_ZH = {
  subtitle: '模拟保单卡',
  note: '事故日期：2026年3月14日。用于练习的模拟卡片。',
};
const PERIODE_2026_ZH = { label: '保险期间', value: '2026年1月1日至2026年12月31日' };

export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Grand Mission: The Flood Returns',
    productLabel: 'AUTO + HVC + PROPERTY + CARGO',
    location: 'City Business Complex',
    story:
      'A second flood hit the City Business Complex on 14 Mar 2026. Everyone is safe. Four reports have come in at once: a company car, heavy equipment, a warehouse, and a goods shipment. Careful: the place is the same, the cases are not.',
    instruction: 'Two stages: decide the main finding for each case, then choose the follow-up action.',
    interactionLabel: 'Two decision stages',
    rakiBriefing: 'The grand finale! Same place, different cases. Open each card, compare for yourself, then decide.',
    learning:
      'The place may be the same, but the cases are not. Check the insured object, cover, period, and evidence of each case before deciding the next step.',
    policyCards: {
      'kasus-a': {
        title: 'Case A - Company car',
        ...KARTU_EN,
        rows: [
          { label: 'Policy type', value: 'TLO, threshold of at least 75% of the vehicle value' },
          { label: 'Flood', value: 'Covered on the card' },
          { label: 'Vehicle value', value: 'Rp200.000.000' },
          { label: 'Damage estimate', value: 'Rp30.000.000' },
          PERIODE_2026_EN,
        ],
      },
      'kasus-b': {
        title: 'Case B - Heavy equipment',
        ...KARTU_EN,
        rows: [
          { label: 'Flood', value: 'Covered on the card' },
          { label: 'Serial number on the policy card', value: 'EX-4471' },
          { label: 'Serial number on the report', value: 'EX-4471' },
          PERIODE_2026_EN,
          { label: 'Initial evidence', value: 'Complete' },
        ],
      },
      'kasus-c': {
        title: 'Case C - Warehouse',
        ...KARTU_EN,
        rows: [
          { label: 'Flood extension', value: 'Listed' },
          { label: 'Policy period', value: '01 Mar 2025 - 28 Feb 2026' },
          { label: 'Insured object', value: 'Matches the policy card' },
          { label: 'Initial evidence', value: 'Complete' },
        ],
      },
      'kasus-d': {
        title: 'Case D - Goods shipment',
        ...KARTU_EN,
        rows: [
          { label: 'Shipping list', value: '40 crates' },
          { label: 'Proof of receipt', value: '38 crates, 5 with wet packaging' },
          { label: 'Photos on receipt', value: 'Not yet attached' },
          PERIODE_2026_EN,
        ],
      },
    },
    steps: {
      temuan: {
        prompt: 'Stage 1 - What is the main finding in each case?',
        item: KASUS_EN,
        kategori: {
          periode: { label: 'The date of the incident is outside the policy period' },
          seri: { label: 'The unit serial number differs' },
          selisih: { label: 'The quantity / condition of the goods differs between documents' },
          ambang: { label: 'The damage value is below the policy threshold' },
          sesuai: { label: 'Cover, period, identity, and evidence all match' },
        },
      },
      tindak: {
        prompt: 'Stage 2 - Choose the follow-up action',
        item: KASUS_EN,
        kategori: {
          survei: { label: 'Proceed to survey / assessment according to procedure' },
          klarifikasi: { label: 'Clarify the unit identity before continuing the assessment' },
          'tidak-ambang': { label: 'The damage does not meet the TLO threshold in the simulation' },
          dokumentasi: { label: 'Document the discrepancy and complete the transport documents' },
          'luar-periode': { label: 'Outside the period listed on the simulation card' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '终极任务：洪水再袭',
    productLabel: 'AUTO + HVC + PROPERTY + CARGO',
    location: '城市商业园区',
    story:
      '2026年3月14日，城市商业园区再次遭遇洪水。所有人都平安。四份报告同时送到：公司用车、重型设备、仓库和一批运输货物。注意：地点一样，案件可不一样。',
    instruction: '分两步：先确定每个案件的主要发现，再选择后续处理。',
    interactionLabel: '两步决策',
    rakiBriefing: '压轴任务！地点一样，案件不同。打开每张卡片，自己比一比，再做决定。',
    learning: '地点可以一样，案件却不一样。在决定下一步之前，先核对每个案件的承保对象、保障、保险期间和证据。',
    policyCards: {
      'kasus-a': {
        title: '案件 A - 公司用车',
        ...KARTU_ZH,
        rows: [
          { label: '保单类型', value: 'TLO，门槛为至少车辆价值的 75%' },
          { label: '洪水', value: '在卡片的保障范围内' },
          { label: '车辆价值', value: 'Rp200.000.000' },
          { label: '损坏估价', value: 'Rp30.000.000' },
          PERIODE_2026_ZH,
        ],
      },
      'kasus-b': {
        title: '案件 B - 重型设备',
        ...KARTU_ZH,
        rows: [
          { label: '洪水', value: '在卡片的保障范围内' },
          { label: '保单卡上的序列号', value: 'EX-4471' },
          { label: '报告上的序列号', value: 'EX-4471' },
          PERIODE_2026_ZH,
          { label: '初步证据', value: '齐全' },
        ],
      },
      'kasus-c': {
        title: '案件 C - 仓库',
        ...KARTU_ZH,
        rows: [
          { label: '洪水扩展保障', value: '已列明' },
          { label: '保险期间', value: '2025年3月1日至2026年2月28日' },
          { label: '承保对象', value: '与保单卡相符' },
          { label: '初步证据', value: '齐全' },
        ],
      },
      'kasus-d': {
        title: '案件 D - 运输货物',
        ...KARTU_ZH,
        rows: [
          { label: '发货清单', value: '40 箱' },
          { label: '收货凭证', value: '38 箱，5 箱包装受潮' },
          { label: '收货照片', value: '尚未附上' },
          PERIODE_2026_ZH,
        ],
      },
    },
    steps: {
      temuan: {
        prompt: '第 1 步 - 每个案件的主要发现是什么？',
        item: KASUS_ZH,
        kategori: {
          periode: { label: '事故日期不在保险期间内' },
          seri: { label: '设备序列号不一致' },
          selisih: { label: '各文件上的货物数量／状况不一致' },
          ambang: { label: '损坏金额低于保单门槛' },
          sesuai: { label: '保障、保险期间、身份和证据都相符' },
        },
      },
      tindak: {
        prompt: '第 2 步 - 选择后续处理',
        item: KASUS_ZH,
        kategori: {
          survei: { label: '按流程进入查勘／评估' },
          klarifikasi: { label: '先核实设备身份，再继续评估' },
          'tidak-ambang': { label: '损坏未达到模拟中的 TLO 门槛' },
          dokumentasi: { label: '记录不符之处，并备齐运输文件' },
          'luar-periode': { label: '不在模拟卡片所列的保险期间内' },
        },
      },
    },
  },
};
