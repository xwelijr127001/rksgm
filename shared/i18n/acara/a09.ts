import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 09 - Hitung Berlapis (en, zh). DRAF, belum ditinjau penutur asli.
 * Istilah mengikuti m09-hitung-teliti & m08-benturan-keausan di ../misi.en.ts / ../misi.zh.ts:
 * risiko sendiri = deductible / 免赔额, kerugian yang disetujui = approved loss / 核定损失,
 * keausan bertahap = gradual wear and tear / 逐渐磨损, bengkel = workshop / 修理厂.
 * Nominal rupiah, persen, dan nomor unit ditulis persis seperti sumbernya. Tanpa kunci jawaban.
 */
export const teks: Partial<Record<BahasaLain, TeksMisi>> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Calculate in Layers',
    productLabel: 'HVC - Heavy Equipment',
    location: 'Calculation Desk, Raksa Office',
    story:
      'The excavator EX-2085 case continues. The technical inspection is done: the engine was hard to start because of wear and tear, not the impact. The workshop has sent a repair estimate totalling Rp60.000.000. Assume all the damage caused by the impact is approved as estimated, and there are no other limits or deductions in this question.',
    instruction: 'Open the repair estimate and the policy card, then build the calculation through to the final result.',
    interactionLabel: 'Build the calculation',
    rakiBriefing:
      'This calculation comes in layers: the calculation base, the deductible, then the final result. Read every line of the estimate and the policy card with care.',
    learning:
      'First settle the calculation base (only damage related to the incident), then compare the deductible percentage with its minimum amount.',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC Policy Card - Heavy Equipment (simulation)',
        subtitle: 'Insured object: Excavator EX-2085',
        rows: [
          { label: 'Impact', value: 'Covered, subject to the terms' },
          { label: 'Gradual wear and tear', value: 'Excluded' },
          { label: 'Deductible', value: '10% of the approved loss' },
          { label: 'Minimum deductible', value: 'Rp5.000.000' },
          { label: 'Other limits / deductions', value: 'None' },
        ],
        note: 'Simulation card, not actual policy terms.',
      },
    },
    tables: {
      estimasi: {
        title: 'Workshop Repair Estimate EX-2085 (simulation)',
        rows: [
          { label: 'Dented boom (caused by the impact)', value: 'Rp28.000.000' },
          { label: 'Broken cab glass (caused by the impact)', value: 'Rp12.000.000' },
          {
            label: 'Worn track shoes & leaking hydraulic hose (already noted in the service record before the incident)',
            value: 'Rp15.000.000',
          },
          { label: 'Engine (technical inspection finding: wear and tear)', value: 'Rp5.000.000' },
          { label: 'Estimate total', value: 'Rp60.000.000' },
        ],
      },
    },
    steps: {
      dasar: {
        prompt: 'Incident-related loss that goes into the calculation',
      },
      risiko: {
        prompt: 'The deductible that applies',
        hint: 'Compare the percentage result with the minimum amount.',
      },
      hasil: {
        prompt: 'Final result of the simulation',
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '一层一层算',
    productLabel: 'HVC - 重型设备',
    location: 'Raksa 办公室计算台',
    story:
      '挖掘机 EX-2085 案件的后续。技术检查已经完成：发动机难以启动，原因是磨损，而不是碰撞。修理厂发来的估价单合计 Rp60.000.000。假设碰撞造成的损坏全部按估价核定，本题没有其他限额或扣减项。',
    instruction: '打开修理厂估价单和保单卡，然后一步步算到最终结果。',
    interactionLabel: '列出计算',
    rakiBriefing: '这次的计算是一层一层来的：先定计算基数，再算免赔额，最后得出最终结果。仔细看估价单的每一行和保单卡。',
    learning: '先确定计算基数（只算与事故相关的损坏），再把按百分比算出的免赔额与最低金额比较。',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC 保单卡 - 重型设备（模拟）',
        subtitle: '承保对象：挖掘机 EX-2085',
        rows: [
          { label: '碰撞', value: '按条款属于保障范围' },
          { label: '逐渐磨损', value: '除外，不予保障' },
          { label: '免赔额', value: '核定损失的 10%' },
          { label: '最低免赔额', value: 'Rp5.000.000' },
          { label: '其他限额／扣减项', value: '无' },
        ],
        note: '模拟卡片，并非真实的保单条款。',
      },
    },
    tables: {
      estimasi: {
        title: '修理厂估价单 EX-2085（模拟）',
        rows: [
          { label: '动臂凹陷（碰撞造成）', value: 'Rp28.000.000' },
          { label: '驾驶室玻璃破碎（碰撞造成）', value: 'Rp12.000.000' },
          { label: '履带板磨损、液压软管渗漏（事故前的保养记录已有记载）', value: 'Rp15.000.000' },
          { label: '发动机（技术检查结果：磨损）', value: 'Rp5.000.000' },
          { label: '估价合计', value: 'Rp60.000.000' },
        ],
      },
    },
    steps: {
      dasar: { prompt: '与事故相关、应计入计算的损失' },
      risiko: { prompt: '实际采用的免赔额', hint: '把按百分比算出的结果与最低金额比较一下。' },
      hasil: { prompt: '模拟的最终结果' },
    },
  },
};
