import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 06 - Satu per Satu, Pak Kepala Gudang (sumber: ../../acara/a06.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m01, m04, m08 & m10 di ../misi.en.ts dan ../misi.zh.ts: kanal klaim = claims
 *   channel / 理赔渠道, lapor = report / 报案, dokumentasikan = document / 记录, koordinasi =
 *   coordination / 沟通, unit = unit / 设备, nomor seri = serial number / 序列号, survei / penilaian
 *   sesuai prosedur = survey / assessment according to procedure / 按流程…查勘／评估, area sudah
 *   diamankan = the area has been secured / 现场已做好安全防护, tindakan = action / 行动.
 * - "Kepala gudang" = warehouse manager / 仓库主管; sapaan di judul dibuat akrab ("Chief").
 * - "Komponen yang patah / patahannya" = broken component, broken piece / 断掉的部件.
 * - Angka pada "Langkah 1 - 4" tetap angka (dijaga tes); label item tetap tanpa " - " supaya chip
 *   memuat nama tindakan selengkapnya (lihat catatan data di sumber).
 * - Urutan item di bawah mengikuti urutan data sumber, BUKAN urutan yang benar.
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'One Step at a Time, Chief',
    productLabel: 'HVC - Heavy Equipment',
    location: 'Heavy Equipment Warehouse',
    story:
      'A forklift has bumped into a steel rack in the heavy equipment warehouse. Everyone is safe and the area has been secured. The warehouse manager wants everything sorted today: "Just weld it now and throw the broken piece away!"',
    instruction: 'Put the handling steps in order. Careful: there is one action that should not be done yet.',
    interactionLabel: 'Number the 5 actions in order',
    rakiBriefing:
      'The warehouse manager is in a hurry, but claims handling has its order. Line the steps up one at a time, okay?',
    learning: 'Claims handling goes step by step. Rushing can actually make evidence disappear and slow the process down.',
    steps: {
      urutan: {
        prompt: 'Give each action its step number (one should not be done yet)',
        item: {
          lapor: { label: 'Report the incident through the claims channel' },
          perbaiki: { label: 'Repair the unit after coordination' },
          buang: { label: 'Throw away the broken component to keep the warehouse tidy' },
          dok: { label: "Document the damage, the unit's position, and the serial number" },
          survei: { label: 'Survey / assessment of the damage according to procedure' },
        },
        kategori: {
          l1: { label: 'Step 1' },
          l2: { label: 'Step 2' },
          l3: { label: 'Step 3' },
          l4: { label: 'Step 4' },
          jangan: { label: "Don't do this yet" },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '一步一步来，仓库主管',
    productLabel: 'HVC - 重型设备',
    location: '重型设备仓库',
    story:
      '叉车在重型设备仓库里碰到了铁货架。所有人都平安，现场已做好安全防护。仓库主管想今天就把一切处理完：“现在就焊上，断掉的部件扔了！”',
    instruction: '排出处理的先后顺序。注意，有一项行动先不要做。',
    interactionLabel: '给 5 项行动排上序号',
    rakiBriefing: '仓库主管很着急，但理赔处理是有先后顺序的。一步一步排好吧。',
    learning: '理赔处理要按顺序进行。太着急反而可能让证据消失，还会拖慢流程。',
    steps: {
      urutan: {
        prompt: '给每项行动排上序号（有一项先不要做）',
        item: {
          lapor: { label: '通过理赔渠道报案' },
          perbaiki: { label: '沟通之后修理设备' },
          buang: { label: '把断掉的部件扔掉，让仓库保持整洁' },
          dok: { label: '记录损坏情况、设备位置和序列号' },
          survei: { label: '按流程对损坏进行查勘／评估' },
        },
        kategori: {
          l1: { label: '第 1 步' },
          l2: { label: '第 2 步' },
          l3: { label: '第 3 步' },
          l4: { label: '第 4 步' },
          jangan: { label: '先不要做' },
        },
      },
    },
  },
};
