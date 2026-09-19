import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 07 - Tiga Polis, Satu Banjir (sumber: ../../acara/a07.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m07 & m10 di ../misi.en.ts dan ../misi.zh.ts: perluasan banjir = flood
 *   extension / 洪水扩展保障, tercantum / tidak tercantum = listed / not listed = 已列明 / 未列明,
 *   periode polis = policy period / 保险期间, tanggal kejadian = date of the incident / 事故日期,
 *   objek = insured object / 承保对象, nilai pertanggungan = sum insured / 保险金额.
 *   Kalimat kategori `luar-periode` sama dengan kategori sejenis di ./a10.ts.
 * - "Berkas" = file / 档案; "laporan kejadian" = incident report / 事故报告; "pemilik (gudang)" =
 *   (warehouse) owner / (仓库) 业主.
 * - Pemisah ' - ' pada label berkas DIPERTAHANKAN: chip item menampilkan bagian sebelum ' - '
 *   ("File A", "档案 A"), sama dengan label binder di adegan.
 * - Baris "Objek" di laporan dan di ketiga kartu diterjemahkan SAMA (seperti sumbernya), dan
 *   keempat dokumen memakai pola kalimat yang sama: tidak ada kata tambahan seperti "(belum mulai)"
 *   atau "(dalam periode)" yang menunjuk ke jawaban.
 * - Kategori `objek-beda`: subjek yang tersirat di sumber ("objek [di laporan]") ditulis terang
 *   ("The object in the report ..." / "报告中的对象..."), supaya kalimatnya tidak berputar
 *   ("the insured object differs from the one on the policy").
 * - Bilangan yang di sumber ditulis dengan kata ("tiga", "keempat") tetap ditulis dengan kata.
 *   Tanggal zh ditulis wajar ("2026年2月14日"); tes mengizinkan tambahan angka bulan 1-12.
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'Three Policies, One Flood',
    productLabel: 'FIRE / PROPERTY - Fire & Property',
    location: 'Sentra Niaga Warehouse',
    story:
      'Sentra Niaga Warehouse has been flooded. The owner hands over three simulation policies and says, "Just use Policy B - it\'s the newest one and has the highest sum insured."',
    instruction:
      'Open the incident report and all three policies. Decide the outcome of the check for each file, then respond to the warehouse owner.',
    interactionLabel: 'Sort three policy files',
    rakiBriefing: 'The date of the incident is in the report, not on the policy cards. Open all four documents first, okay?',
    learning: 'The type of risk must be listed on the policy, and the policy period must cover the date of the incident.',
    tables: {
      laporan: {
        title: 'Incident Report (simulation)',
        rows: [
          { label: 'Date of incident', value: '14 Feb 2026' },
          { label: 'Cause', value: 'Flood' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
        ],
      },
    },
    policyCards: {
      'polis-a': {
        title: 'Policy A',
        subtitle: 'Property All Risk (simulation)',
        rows: [
          { label: 'Flood extension', value: 'Listed' },
          { label: 'Policy period', value: '01 Mar 2025 - 28 Feb 2026' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
          { label: 'Sum insured', value: 'Rp2.000.000.000' },
        ],
      },
      'polis-b': {
        title: 'Policy B',
        subtitle: 'Property All Risk (simulation)',
        rows: [
          { label: 'Flood extension', value: 'Listed' },
          { label: 'Policy period', value: '01 Mar 2026 - 28 Feb 2027' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
          { label: 'Sum insured', value: 'Rp3.000.000.000' },
        ],
      },
      'polis-c': {
        title: 'Policy C',
        subtitle: 'Standard fire (simulation)',
        rows: [
          { label: 'Flood extension', value: 'Not listed' },
          { label: 'Policy period', value: '01 Jan 2026 - 31 Dec 2026' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
          { label: 'Sum insured', value: 'Rp2.000.000.000' },
        ],
      },
    },
    steps: {
      periksa: {
        prompt: 'Decide the outcome of the check for each policy in this incident',
        item: {
          'berkas-a': { label: 'File A - Policy A' },
          'berkas-b': { label: 'File B - Policy B' },
          'berkas-c': { label: 'File C - Policy C' },
        },
        kategori: {
          'luar-periode': { label: 'The date of the incident is outside the policy period' },
          'objek-beda': { label: 'The object in the report differs from the one written on the policy' },
          sesuai: { label: 'The flood extension is listed and the period covers the date of the incident' },
          'tanpa-banjir': { label: 'The flood extension is not listed' },
        },
      },
      alasan: {
        prompt: 'The owner wants to use Policy B because it is the newest and has the highest sum insured. Your response?',
        opsi: {
          terbaru: { label: 'Agreed, the newest policy applies to every incident' },
          'selalu-dijamin': { label: 'All three can be used because flood is always covered under a property policy' },
          'risiko-periode': {
            label: 'What decides it: the type of risk listed and a period that covers the date of the incident',
          },
          'nilai-besar': { label: 'Agreed, choose the policy with the highest sum insured' },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '三份保单，一场洪水',
    productLabel: 'FIRE / PROPERTY - 火灾与财产',
    location: 'Sentra Niaga 仓库',
    story: 'Sentra Niaga 仓库被洪水淹了。业主递来三份模拟保单，说：“就用保单 B 吧，它最新，保险金额也最高。”',
    instruction: '打开事故报告和三份保单。确定每份档案的核对结果，然后回应仓库业主。',
    interactionLabel: '三份保单档案分类',
    rakiBriefing: '事故日期写在报告里，不在保单卡上。先把四份文件都打开看看吧。',
    learning: '风险类型必须在保单上列明，保险期间也必须涵盖事故日期。',
    tables: {
      laporan: {
        title: '事故报告（模拟）',
        rows: [
          { label: '事故日期', value: '2026年2月14日' },
          { label: '事故原因', value: '洪水' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
        ],
      },
    },
    policyCards: {
      'polis-a': {
        title: '保单 A',
        subtitle: 'Property All Risk（模拟）',
        rows: [
          { label: '洪水扩展保障', value: '已列明' },
          { label: '保险期间', value: '2025年3月1日至2026年2月28日' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
          { label: '保险金额', value: 'Rp2.000.000.000' },
        ],
      },
      'polis-b': {
        title: '保单 B',
        subtitle: 'Property All Risk（模拟）',
        rows: [
          { label: '洪水扩展保障', value: '已列明' },
          { label: '保险期间', value: '2026年3月1日至2027年2月28日' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
          { label: '保险金额', value: 'Rp3.000.000.000' },
        ],
      },
      'polis-c': {
        title: '保单 C',
        subtitle: '标准火灾险（模拟）',
        rows: [
          { label: '洪水扩展保障', value: '未列明' },
          { label: '保险期间', value: '2026年1月1日至2026年12月31日' },
          { label: '承保对象', value: 'Sentra Niaga 仓库' },
          { label: '保险金额', value: 'Rp2.000.000.000' },
        ],
      },
    },
    steps: {
      periksa: {
        prompt: '针对这次事故，确定每份保单的核对结果',
        item: {
          'berkas-a': { label: '档案 A - 保单 A' },
          'berkas-b': { label: '档案 B - 保单 B' },
          'berkas-c': { label: '档案 C - 保单 C' },
        },
        kategori: {
          'luar-periode': { label: '事故日期不在保险期间内' },
          'objek-beda': { label: '报告中的对象与保单上写的不一致' },
          sesuai: { label: '洪水扩展保障已列明，且保险期间涵盖事故日期' },
          'tanpa-banjir': { label: '洪水扩展保障未列明' },
        },
      },
      alasan: {
        prompt: '业主想用保单 B，因为它最新、保险金额也最高。你怎么回应？',
        opsi: {
          terbaru: { label: '同意，最新的保单适用于所有事故' },
          'selalu-dijamin': { label: '三份都能用，因为财产保单一定保障洪水' },
          'risiko-periode': { label: '关键在于：列明的风险类型，以及涵盖事故日期的保险期间' },
          'nilai-besar': { label: '同意，选保险金额最高的那份保单' },
        },
      },
    },
  },
};
