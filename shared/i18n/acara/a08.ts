import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 08 - Lini Masa Excavator (sumber: ../../acara/a08.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Kartu polis & tiga kategori disalin dari m08-benturan-keausan di ../misi.en.ts / ../misi.zh.ts:
 *   benturan = impact / 碰撞, keausan bertahap = gradual wear and tear / 逐渐磨损, jaminan = cover /
 *   保障, diperiksa = inspect / 查勘, pemeriksaan teknis = technical inspection / 技术检查.
 * - Bagian unit mengikuti a09 (lanjutan kasus EX-2085): dented boom / 动臂凹陷, broken cab glass /
 *   驾驶室玻璃破碎, worn track shoes / 履带板磨损, leaking hydraulic hose / 液压软管渗漏, engine hard
 *   to start / 发动机难以启动, bengkel = workshop / 修理厂.
 * - "Buku servis" = service log / 保养记录 (sama dengan label adegan "Service log"); tiap baris di
 *   dalamnya = entry / 记录. "Kondisi lama" = pre-existing condition / 原有状况. "Galian" = excavation /
 *   土坑 (m04). "Temuan" = finding / 发现.
 * - Tanggal: "09 Agu 2026" -> "09 Aug 2026" / "2026年8月9日" (tes mengizinkan tambahan angka bulan).
 *   Bilangan yang ditulis dengan kata di sumber ("lima", "tiga") tetap kata.
 * - Urutan item & opsi di bawah mengikuti urutan data sumber, BUKAN pengelompokan kunci.
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Excavator Timeline',
    productLabel: 'HVC - Heavy Equipment',
    location: 'New Road Project',
    story:
      'On 09 Aug 2026, excavator EX-2085 hit the excavation wall while turning. The operator is safe and the area has been secured. The workshop recorded five findings on the unit.',
    instruction: 'Compare the service log with the incident report, sort each finding, then choose the initial conclusion.',
    interactionLabel: 'Sort 5 findings, then conclude',
    rakiBriefing: 'Five findings, three documents. Match up the date of each entry before you sort.',
    learning:
      'The order of the dates across the documents helps you sort: which damage is related to the incident, which is a pre-existing condition, and which still needs a technical inspection.',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC Policy Card - Heavy Equipment (simulation)',
        rows: [
          { label: 'Impact', value: 'Covered, subject to the terms' },
          { label: 'Gradual wear and tear', value: 'Excluded' },
          { label: 'Insured object', value: 'Excavator EX-2085' },
        ],
      },
    },
    tables: {
      laporan: {
        title: 'Incident Report (simulation)',
        rows: [
          { label: 'Date of incident', value: '09 Aug 2026' },
          { label: 'Sequence of events', value: 'While turning, the boom and cab hit the excavation wall' },
          { label: 'Situation', value: 'Operator safe, area secured' },
        ],
      },
      servis: {
        title: 'Service Log EX-2085 (simulation)',
        rows: [
          { label: '21 Jul 2026', value: 'Track shoes worn, replacement advised' },
          { label: '21 Jul 2026', value: 'Hydraulic hose leaking slightly, being monitored' },
          { label: '21 Jul 2026', value: 'Boom, cab glass, engine: good condition' },
          {
            label: '11 Aug 2026',
            value: 'Inspection after the incident: boom dented and cab glass broken. Engine hard to start, cause not yet known.',
          },
        ],
      },
    },
    steps: {
      pilah: {
        prompt: "Sort each of the workshop's findings",
        hint: 'Match each finding against the entries in the service log and the incident report.',
        item: {
          selang: { label: 'Leaking hydraulic hose' },
          boom: { label: 'Dented boom' },
          mesin: { label: 'Engine hard to start' },
          track: { label: 'Worn track shoes' },
          kaca: { label: 'Broken cab glass' },
        },
        kategori: {
          terkait: { label: 'Inspect as damage related to the incident' },
          sebelumnya: { label: 'Set aside as a condition before the incident' },
          teknis: { label: 'Further technical inspection needed' },
        },
      },
      simpul: {
        prompt: 'Which initial conclusion is right?',
        opsi: {
          semua: {
            label:
              'All findings are automatically covered because the policy covers impact and the unit did suffer an impact, so there is no need to sort them',
          },
          tolak: { label: 'The whole report is outside the cover because the service log records wear on the unit' },
          pisah: {
            label:
              'Impact-related damage is inspected, pre-existing conditions are set aside, and anything unclear waits for a technical inspection',
          },
          tunda: { label: 'Repair all the damage first so the unit can get back to work quickly, and do the sorting later' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '挖掘机时间线',
    productLabel: 'HVC - 重型设备',
    location: '新道路工地',
    story:
      '2026年8月9日，挖掘机 EX-2085 在回转时撞上了土坑侧壁。操作员平安，现场已做好安全防护。修理厂检查设备后，记下了五项发现。',
    instruction: '对照保养记录和事故报告，把每项发现分类，然后选出初步结论。',
    interactionLabel: '将 5 项发现分类，再下结论',
    rakiBriefing: '五项发现，三份文件。分类之前，先核对每条记录的日期。',
    learning: '对照各份文件上日期的先后，有助于分类：哪些损坏与事故相关，哪些是原有的状况，哪些还需要技术检查。',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC 保单卡 - 重型设备（模拟）',
        rows: [
          { label: '碰撞', value: '按条款属于保障范围' },
          { label: '逐渐磨损', value: '除外，不予保障' },
          { label: '承保对象', value: '挖掘机 EX-2085' },
        ],
      },
    },
    tables: {
      laporan: {
        title: '事故报告（模拟）',
        rows: [
          { label: '事故日期', value: '2026年8月9日' },
          { label: '事故经过', value: '回转时，动臂和驾驶室撞上了土坑侧壁' },
          { label: '现场情况', value: '操作员平安，现场已做好安全防护' },
        ],
      },
      servis: {
        title: 'EX-2085 保养记录（模拟）',
        rows: [
          { label: '2026年7月21日', value: '履带板磨损，建议更换' },
          { label: '2026年7月21日', value: '液压软管轻微渗漏，持续观察' },
          { label: '2026年7月21日', value: '动臂、驾驶室玻璃、发动机：状况良好' },
          {
            label: '2026年8月11日',
            value: '事故后检查：动臂凹陷，驾驶室玻璃破碎。发动机难以启动，原因尚未查明。',
          },
        ],
      },
    },
    steps: {
      pilah: {
        prompt: '把修理厂的每项发现分类',
        hint: '把每项发现与保养记录和事故报告中的记载逐一对照。',
        item: {
          selang: { label: '液压软管渗漏' },
          boom: { label: '动臂凹陷' },
          mesin: { label: '发动机难以启动' },
          track: { label: '履带板磨损' },
          kaca: { label: '驾驶室玻璃破碎' },
        },
        kategori: {
          terkait: { label: '作为与事故相关的损坏进行查勘' },
          sebelumnya: { label: '单独列为事故前已有的状况' },
          teknis: { label: '需要进一步的技术检查' },
        },
      },
      simpul: {
        prompt: '哪项初步结论是恰当的？',
        opsi: {
          semua: { label: '保单保障碰撞，设备也确实发生了碰撞，所以所有发现都自动获得保障，不必再分类' },
          tolak: { label: '保养记录写有设备磨损，所以整份报案都不在保障范围内' },
          pisah: { label: '与碰撞相关的损坏进行查勘，原有状况单独列出，尚不明确的等待技术检查' },
          tunda: { label: '先把所有损坏修好，让设备尽快复工，分类以后再说' },
        },
      },
    },
  },
};
