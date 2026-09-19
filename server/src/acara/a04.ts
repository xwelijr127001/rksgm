import type { BerkasKunciAcara } from './tipe';

/**
 * KUNCI misi acara 04 - Peti yang Tak Sampai (SERVER ONLY). DRAF, belum ditinjau PIC Claim.
 * Konten publik: shared/acara/a04.ts. Hitungan:
 * - selisih = 24 dikirim - 21 diterima = 3 peti
 * - baik    = 21 diterima - 4 peti berkemasan rusak (#3, #9, #15, #20) = 17 peti
 *   (5 foto kerusakan, tetapi peti #20 difoto dua kali -> tetap 1 peti)
 * `pembahasan` (en/zh) = terjemahan ringkasan & penjelasan; baru dikirim saat REVEAL.
 *
 * Catatan peninjau (anti-hafalan, mekanik serupa misi 6): di misi 6 jawaban benar tampil sebagai
 * kartu PERTAMA dan papan adegan KEDUA dari kiri (ikon papan klip + kamera). Urutan opsi di
 * shared/acara/a04.ts dan urutan papan di adegan a04 sengaja disusun supaya `catat` TIDAK jatuh di
 * posisi yang sama (sekarang kartu ke-3; papan ke-3 dari kiri). Keduanya hasil acak deterministik
 * (urutanTampil / acakSlot): bila urutan opsi atau papan diubah, hitung ulang posisinya.
 */
export const berkas: BerkasKunciAcara = {
  kunci: {
    missionId: 'a04-peti-kurang',
    roundIndex: 3,
    summary:
      '3 peti belum diterima, 17 peti diterima dengan kemasan baik, lalu dokumentasikan selisih jumlah dan kemasan rusak serta lengkapi dokumen pengangkutan.',
    steps: [
      {
        stepId: 'selisih',
        weight: 1,
        number: { value: 3 },
        explanation: '24 peti dikirim - 21 peti diterima = 3 peti belum diterima.',
      },
      {
        stepId: 'baik',
        weight: 1,
        number: { value: 17 },
        explanation:
          'Yang dihitung peti, bukan foto: kemasan rusak ada pada 4 peti (#3, #9, #15, #20) karena peti #20 difoto dua kali. Jadi 21 peti diterima - 4 peti = 17 peti berkemasan baik.',
      },
      {
        stepId: 'tindak',
        weight: 2,
        single: 'catat',
        explanation:
          'Selisih jumlah dan kemasan rusak sama-sama perlu dicatat, lalu dokumen pengangkutan dilengkapi untuk pemeriksaan. Tanda tangan tanpa catatan membuat ketidaksesuaian tidak tercatat, dan jangan menyimpulkan semua peti otomatis dijamin.',
      },
    ],
  },
  // Terjemahan DRAF (belum ditinjau penutur asli / PIC Claim); istilah mengikuti pembahasan m06 di
  // ../answerKeys.i18n.ts. "dua kali" tetap ditulis dengan kata (twice / 两次) supaya deret angka sama.
  pembahasan: {
    en: {
      summary:
        '3 crates not yet received, 17 crates received with their packaging intact, then document the difference in quantity and the damaged packaging and complete the transport documents.',
      steps: {
        selisih: '24 crates shipped - 21 crates received = 3 crates not yet received.',
        baik:
          'Count crates, not photos: the damaged packaging is on 4 crates (#3, #9, #15, #20) because crate #20 was photographed twice. So 21 crates received - 4 crates = 17 crates with their packaging intact.',
        tindak:
          'The difference in quantity and the damaged packaging both need to be recorded, then the transport documents completed for inspection. Signing without remarks leaves the discrepancies unrecorded, and do not conclude that all the crates are automatically covered.',
      },
    },
    zh: {
      summary: '还有 3 箱没有收到，收到的箱子中有 17 箱包装完好，然后记录数量差异和包装破损情况，并备齐运输文件。',
      steps: {
        selisih: '发货 24 箱 - 收货 21 箱 = 还有 3 箱没有收到。',
        baik:
          '要数的是箱子，不是照片：包装破损的共有 4 箱（3 号、9 号、15 号、20 号），因为 20 号箱拍了两次。所以收货 21 箱 - 4 箱 = 17 箱包装完好。',
        tindak:
          '数量差异和包装破损都需要记录下来，然后备齐运输文件以供查勘。不加备注就签字，会让不符之处没有记录；也不要直接认定所有箱子自动获得保障。',
      },
    },
  },
};
