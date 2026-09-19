import type { MissionPublic } from '../types';

/**
 * Misi acara 04 - Peti yang Tak Sampai (CARGO, tingkat 2).
 * DRAF tim game, belum ditinjau PIC Claim. Rancangan: docs/silabus-paket-acara.md
 * Tanpa kunci jawaban (kunci: server/src/acara/a04.ts). Semua baris tabel berbendera `info`
 * supaya warna kartu tidak membocorkan jawaban; urutan opsi di sini bukan urutan tampil.
 * Urutan tampil kartu `tindak` dihitung urutanTampil dari urutan di sini (benih id misi + id langkah):
 * bila urutan opsi diubah, periksa ulang hasilnya (catatan peninjau ada di kepala berkas kunci).
 */
export const misi: MissionPublic = {
  id: 'a04-peti-kurang',
  number: 4,
  title: 'Peti yang Tak Sampai',
  product: 'CARGO',
  productLabel: 'CARGO - Pengangkutan Barang',
  location: 'Pelabuhan & Logistik',
  scene: 'pelabuhan',
  level: 2,
  story:
    'Kiriman suku cadang mesin tiba di pelabuhan. Sopir truk minta bukti terima segera ditandatangani supaya bisa berangkat lagi. Cocokkan dulu ketiga dokumennya.',
  instruction: 'Cocokkan tiga dokumen, isi dua angka, lalu pilih tindak lanjut.',
  interactionLabel: 'Cocokkan dokumen',
  durationSeconds: 60,
  briefingSeconds: 10,
  rakiBriefing: 'Sopirnya buru-buru, tapi kita tetap teliti. Buka ketiga dokumennya dulu, ya.',
  learning: 'Jumlah barang, kondisi kemasan, dan dokumen perlu dicocokkan satu per satu sebelum menentukan tindak lanjut.',
  tables: [
    {
      id: 'pengiriman',
      title: 'Daftar Pengiriman (simulasi)',
      icon: 'kapal',
      rows: [
        { label: 'Jumlah peti dikirim', value: '24 peti', flag: 'info' },
        { label: 'Jenis barang', value: 'Suku cadang mesin', flag: 'info' },
        { label: 'Tanggal muat', value: '02 Sep 2026', flag: 'info' },
      ],
    },
    {
      id: 'penerimaan',
      title: 'Bukti Penerimaan (simulasi)',
      icon: 'peti',
      rows: [
        { label: 'Jumlah peti diterima', value: '21 peti', flag: 'info' },
        { label: 'Catatan kondisi', value: 'Sebagian kemasan rusak, lihat foto', flag: 'info' },
        { label: 'Tanggal terima', value: '10 Sep 2026', flag: 'info' },
      ],
    },
    {
      id: 'foto',
      title: 'Foto Penerimaan (simulasi)',
      icon: 'foto',
      rows: [
        { label: 'Foto 1', value: 'Tumpukan peti di gudang penerima', flag: 'info' },
        { label: 'Foto 2', value: 'Peti #3 kemasan penyok', flag: 'info' },
        { label: 'Foto 3', value: 'Peti #9 kemasan basah', flag: 'info' },
        { label: 'Foto 4', value: 'Peti #15 kemasan terbuka', flag: 'info' },
        { label: 'Foto 5', value: 'Peti #20 sisi kiri penyok', flag: 'info' },
        { label: 'Foto 6', value: 'Peti #20 sisi bawah basah', flag: 'info' },
      ],
      note: 'Semua peti berkemasan rusak sudah difoto.',
    },
  ],
  steps: [
    {
      kind: 'number',
      id: 'selisih',
      prompt: 'Berapa peti yang belum diterima?',
      weight: 1,
      unit: 'peti',
      format: 'angka',
      suggestions: [1, 2, 3, 4, 5],
    },
    {
      kind: 'number',
      id: 'baik',
      prompt: 'Berapa peti diterima dengan kemasan baik?',
      weight: 1,
      unit: 'peti',
      format: 'angka',
      suggestions: [16, 17, 18, 20, 21],
    },
    {
      kind: 'single',
      id: 'tindak',
      prompt: 'Sopir menunggu. Apa tindak lanjutnya?',
      presentation: 'cards',
      weight: 2,
      options: [
        {
          id: 'ttd',
          label: 'Tanda tangani bukti terima tanpa catatan supaya truk bisa segera berangkat',
          icon: 'struk',
        },
        {
          id: 'semua',
          label: 'Simpulkan 24 peti otomatis dijamin dan ajukan penggantian penuh',
          icon: 'uang',
        },
        {
          id: 'separuh',
          label: 'Catat selisih jumlah saja; kemasan rusak tidak perlu dicatat',
          icon: 'daftar',
        },
        {
          id: 'catat',
          label: 'Dokumentasikan selisih jumlah dan kemasan rusak, lalu lengkapi dokumen pengangkutan untuk pemeriksaan',
          icon: 'dokumen',
        },
      ],
    },
  ],
};
