import type { BahasaLain } from '../../bahasa';
import type { TeksMisi } from '../misi';

/**
 * Terjemahan konten misi acara 04 - Peti yang Tak Sampai (sumber: ../../acara/a04.ts).
 * DRAF, belum ditinjau penutur asli / PIC Claim. Tanpa kunci jawaban.
 *
 * Catatan penerjemahan:
 * - Istilah mengikuti m06 di ../misi.en.ts dan ../misi.zh.ts: daftar pengiriman = shipping list /
 *   发货清单, bukti penerimaan = proof of receipt / 收货凭证, dokumen pengangkutan = transport
 *   documents / 运输文件, pemeriksaan = inspection / 查勘, dijamin = covered / 获得保障,
 *   kemasan rusak = damaged packaging / 包装破损, penyok = dented / 凹陷, basah = wet / 受潮.
 * - "Selisih jumlah" = difference in quantity / 数量差异 (m06 memakai "difference" / 相差).
 * - Bilangan yang di sumber ditulis dengan kata ("tiga", "dua") tetap ditulis dengan kata
 *   (three / 三), bukan angka; semua angka lain sama persis dengan sumber.
 * - Urutan opsi mengikuti sumber; panjang kalimat opsi dijaga sebanding dengan teks Indonesia.
 */
export const teks: Record<BahasaLain, TeksMisi> = {
  // ------------------------------------------------------------------ ENGLISH
  en: {
    title: 'The Crates That Never Arrived',
    productLabel: 'CARGO - Goods in Transit',
    location: 'Port & Logistics',
    story:
      'A shipment of machine spare parts has arrived at the port. The truck driver wants the proof of receipt signed right away to get back on the road. Cross-check the three documents first.',
    instruction: 'Cross-check the three documents, fill in two numbers, then choose the follow-up action.',
    interactionLabel: 'Cross-check the documents',
    rakiBriefing: "The driver's in a hurry, but we stay careful. Open all three documents first, okay?",
    learning:
      'The number of items, the condition of the packaging, and the documents need to be cross-checked one by one before deciding on the follow-up action.',
    tables: {
      pengiriman: {
        title: 'Shipping List (simulation)',
        rows: [
          { label: 'Crates shipped', value: '24 crates' },
          { label: 'Type of goods', value: 'Machine spare parts' },
          { label: 'Loading date', value: '02 Sep 2026' },
        ],
      },
      penerimaan: {
        title: 'Proof of Receipt (simulation)',
        rows: [
          { label: 'Crates received', value: '21 crates' },
          { label: 'Condition notes', value: 'Some packaging damaged, see photos' },
          { label: 'Date received', value: '10 Sep 2026' },
        ],
      },
      foto: {
        title: 'Photos on Receipt (simulation)',
        note: 'Every crate with damaged packaging has been photographed.',
        rows: [
          { label: 'Photo 1', value: "Stack of crates in the receiver's warehouse" },
          { label: 'Photo 2', value: 'Crate #3 packaging dented' },
          { label: 'Photo 3', value: 'Crate #9 packaging wet' },
          { label: 'Photo 4', value: 'Crate #15 packaging open' },
          { label: 'Photo 5', value: 'Crate #20 left side dented' },
          { label: 'Photo 6', value: 'Crate #20 underside wet' },
        ],
      },
    },
    steps: {
      selisih: {
        prompt: 'How many crates have not been received yet?',
        unit: 'crates',
      },
      baik: {
        prompt: 'How many crates were received with their packaging intact?',
        unit: 'crates',
      },
      tindak: {
        prompt: "The driver is waiting. What's the follow-up action?",
        opsi: {
          ttd: {
            label: 'Sign the proof of receipt without any remarks so the truck can leave right away',
          },
          semua: {
            label: 'Conclude that all 24 crates are automatically covered and request full compensation',
          },
          separuh: {
            label: 'Record only the difference in quantity; the damaged packaging does not need to be recorded',
          },
          catat: {
            label:
              'Document the difference in quantity and the damaged packaging, then complete the transport documents for inspection',
          },
        },
      },
    },
  },

  // ------------------------------------------------------------------ 简体中文
  zh: {
    title: '没送到的箱子',
    productLabel: 'CARGO - 货物运输',
    location: '港口与物流',
    story: '一批机器备件运到了港口。卡车司机催着马上在收货凭证上签字，好继续赶路。先把三份文件核对一遍吧。',
    instruction: '核对三份文件，填写两个数字，然后选择后续处理。',
    interactionLabel: '核对文件',
    rakiBriefing: '司机很着急，但我们还是要仔细。先把三份文件都打开看看吧。',
    learning: '货物数量、包装状况和文件要逐项核对，然后再决定后续处理。',
    tables: {
      pengiriman: {
        title: '发货清单（模拟）',
        rows: [
          { label: '发货箱数', value: '24 箱' },
          { label: '货物种类', value: '机器备件' },
          { label: '装货日期', value: '2026年9月2日' },
        ],
      },
      penerimaan: {
        title: '收货凭证（模拟）',
        rows: [
          { label: '收货箱数', value: '21 箱' },
          { label: '状况备注', value: '部分包装破损，见照片' },
          { label: '收货日期', value: '2026年9月10日' },
        ],
      },
      foto: {
        title: '收货照片（模拟）',
        note: '所有包装破损的箱子都已拍照。',
        rows: [
          { label: '照片 1', value: '收货方仓库里堆放的箱子' },
          { label: '照片 2', value: '3 号箱：包装凹陷' },
          { label: '照片 3', value: '9 号箱：包装受潮' },
          { label: '照片 4', value: '15 号箱：包装破开' },
          { label: '照片 5', value: '20 号箱：左侧凹陷' },
          { label: '照片 6', value: '20 号箱：底部受潮' },
        ],
      },
    },
    steps: {
      selisih: { prompt: '还有多少箱没有收到？', unit: '箱' },
      baik: { prompt: '收到的箱子中有多少箱包装完好？', unit: '箱' },
      tindak: {
        prompt: '司机还在等。后续该怎么处理？',
        opsi: {
          ttd: { label: '不加任何备注就在收货凭证上签字，让卡车尽快出发' },
          semua: { label: '认定 24 箱全部自动获得保障，并申请全额赔偿' },
          separuh: { label: '只记录数量差异；包装破损不用记录' },
          catat: { label: '记录数量差异和包装破损情况，并备齐运输文件以供查勘' },
        },
      },
    },
  },
};
