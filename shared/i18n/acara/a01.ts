import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 01 - Setelah Api Padam (sumber: ../../acara/a01.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m01 & m03 di ../misi.en.ts dan ../misi.zh.ts: tindakan = action / 行动,
 *   kanal klaim = claims channel / 理赔渠道, lapor = report / 报案, lokasi aman = site safe / 现场安全,
 *   barang terdampak = affected items / 受损物品, ketepatan = accuracy / 正确率.
 * - "Barang hangus" = burnt items / 烧焦的物品 (sejalan dengan "affected items / 受损物品").
 * - "Tukang" = builder (ejaan & kosakata Inggris Britania, seperti berkas misi.en.ts) / 工人.
 * - Bilangan yang di sumber ditulis dengan kata ("dua") tetap ditulis dengan kata (two / 两);
 *   yang ditulis angka ("2") tetap angka.
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'After the Fire Is Out',
    productLabel: 'FIRE / PROPERTY - Fire & Property',
    location: 'Fabric Shop on Jalan Kenanga',
    story:
      'The fire at a customer\'s fabric shop is out, and the firefighters have declared the site safe. The owner wants to reopen quickly and asks, "So, what should I do first?"',
    instruction: 'Tap the two actions that should be done first.',
    interactionLabel: 'Choose 2 actions',
    rakiBriefing: 'The fire is out and the site is safe. Help the shop owner choose the first two steps.',
    learning: 'Documenting and reporting first keeps a clear trail of what happened - for property damage too.',
    steps: {
      tindakan: {
        prompt: 'Choose the 2 actions that should be done first',
        hint: 'Choosing an unsuitable action lowers your accuracy.',
        opsi: {
          buang: { label: 'Throw away the burnt items to get the shop tidy quickly' },
          foto: { label: 'Photograph the damage and the affected items before they are moved' },
          perbaiki: { label: 'Call a builder to repair things first, and report once it is done' },
          lapor: { label: 'Report the incident through the claims channel' },
          abaikan: { label: 'Open the shop as usual; the fire is out, so no need to report' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '火灭之后',
    productLabel: 'FIRE / PROPERTY - 火灾与财产',
    location: 'Jalan Kenanga 布店',
    story: '客户布店里的火已经扑灭，消防员确认现场安全。店主想尽快重新开门营业，问道：“我现在该先做什么？”',
    instruction: '点击应当先做的两项行动。',
    interactionLabel: '选择 2 项行动',
    rakiBriefing: '火已扑灭，现场也安全了。帮店主选出最先要做的两步吧。',
    learning: '先记录、先报案，才能留住事故的痕迹，财产受损时也一样。',
    steps: {
      tindakan: {
        prompt: '选择 2 项应当先做的行动',
        hint: '选了不恰当的行动会降低正确率。',
        opsi: {
          buang: { label: '把烧焦的物品扔掉，让店里尽快整洁' },
          foto: { label: '在搬动之前，拍下损坏情况和受损物品' },
          perbaiki: { label: '先请工人来修理，修完再报案' },
          lapor: { label: '通过理赔渠道报案' },
          abaikan: { label: '照常开店；火已经灭了，不用报案' },
        },
      },
    },
  },
};
