import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 03 - Empat Foto, Apa Tugasnya? (sumber: ../../acara/a03.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m02 di ../misi.en.ts dan ../misi.zh.ts: pemeriksaan = inspection / 查勘,
 *   titik benturan = point of impact / 碰撞部位, nomor rangka = chassis number / 车架号,
 *   Bengkel Mitra = Partner Workshop / 合作修理厂.
 * - Pemisah ' - ' pada label foto DIPERTAHANKAN: chip item menampilkan bagian sebelum ' - '
 *   ("Photo A", "照片 A").
 * - "Tugas" foto diterjemahkan "job" / "用处", bukan "任务": di UI Mandarin "任务" berarti misi.
 * - Bilangan yang di sumber ditulis dengan kata ("empat") tetap ditulis dengan kata (four / 四).
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: "Four Photos, What's Their Job?",
    productLabel: 'AUTO - Motor Vehicle',
    location: 'Partner Workshop',
    story:
      'A customer\'s car was hit from behind; the rear-right bumper is dented. Four photos have been printed and hung up in the workshop. The workshop manager asks, "What does each of these photos actually prove?"',
    instruction: 'Tap each photo, then choose what it is used for in the inspection.',
    interactionLabel: 'Match 4 photos to their uses',
    rakiBriefing: 'Every evidence photo has a job. Look at what each photo shows, then decide what it is for.',
    learning: 'Good evidence has a clear job in the inspection; more photos does not always mean more evidence.',
    steps: {
      fungsi: {
        prompt: 'Match each photo to its use',
        item: {
          'foto-a': { label: 'Photo A - the whole car from the side' },
          'foto-b': { label: 'Photo B - close-up of the rear-right bumper' },
          'foto-c': { label: 'Photo C - number plate and chassis number' },
          'foto-d': { label: "Photo D - the customer's selfie in front of the workshop" },
        },
        kategori: {
          identitas: { label: 'Confirms that the right vehicle is being inspected' },
          tidak: { label: 'Does not help the inspection' },
          kondisi: { label: "Shows the vehicle's overall condition" },
          titik: { label: 'Shows the point of impact' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '四张照片，各有什么用？',
    productLabel: 'AUTO - 机动车辆',
    location: '合作修理厂',
    story:
      '客户的车被人从后面撞了，后保险杠右侧凹了进去。四张照片已经打印出来，挂在修理厂里。修理厂负责人问：“这几张照片，到底各自能证明什么？”',
    instruction: '点击每张照片，然后选出它在查勘中的用途。',
    interactionLabel: '将 4 张照片与用途配对',
    rakiBriefing: '每张证据照片都有自己的用处。先看清照片里拍了什么，再判断它的用途吧。',
    learning: '好的证据在查勘中有明确的用处；照片多，不等于证据多。',
    steps: {
      fungsi: {
        prompt: '将每张照片与它的用途配对',
        item: {
          'foto-a': { label: '照片 A - 从侧面拍的整车' },
          'foto-b': { label: '照片 B - 后保险杠右侧近照' },
          'foto-c': { label: '照片 C - 车牌和车架号' },
          'foto-d': { label: '照片 D - 客户在修理厂门前的自拍' },
        },
        kategori: {
          identitas: { label: '确认查勘的车辆没有弄错' },
          tidak: { label: '对查勘没有帮助' },
          kondisi: { label: '显示车辆的整体状况' },
          titik: { label: '显示碰撞部位' },
        },
      },
    },
  },
};
