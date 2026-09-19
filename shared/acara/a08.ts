import type { MissionPublic } from '../types';

/**
 * Misi acara 08 - Lini Masa Excavator (HVC, tingkat 3). DRAF, belum ditinjau PIC Claim.
 * Silabus: docs/silabus-paket-acara.md (a08-linimasa-ex). TANPA kunci jawaban (kunci: server/src/acara/a08.ts).
 *
 * Netral: semua baris dokumen berbendera `info`, item tanpa ikon, label item tidak menyebut kapan
 * kerusakan muncul. Urutan item & opsi di data sengaja tidak mengelompok menurut kategori.
 * Item tanpa " - " supaya chip di layar main memuat nama lengkapnya.
 */
export const misi: MissionPublic = {
  id: 'a08-linimasa-ex',
  number: 8,
  level: 3,
  title: 'Lini Masa Excavator',
  product: 'HVC',
  productLabel: 'HVC - Alat Berat',
  location: 'Proyek Jalan Baru',
  scene: 'proyek',
  story:
    'Pada 09 Agu 2026 excavator EX-2085 membentur dinding galian saat berputar. Operator selamat dan area sudah diamankan. Bengkel mencatat lima temuan pada unit.',
  instruction: 'Bandingkan buku servis dengan laporan kejadian, pilah tiap temuan, lalu pilih kesimpulan awalnya.',
  interactionLabel: 'Pilah 5 temuan, lalu simpulkan',
  durationSeconds: 80,
  briefingSeconds: 12,
  rakiBriefing: 'Lima temuan, tiga dokumen. Cocokkan tanggal tiap catatan sebelum memilah.',
  learning:
    'Urutan tanggal antar dokumen membantu memilah: mana kerusakan terkait kejadian, mana kondisi lama, dan mana yang masih perlu pemeriksaan teknis.',
  policyCards: [
    {
      id: 'kartu-hvc',
      title: 'Kartu Polis HVC - Alat Berat (simulasi)',
      product: 'HVC',
      rows: [
        { label: 'Benturan', value: 'Termasuk jaminan sesuai syarat', flag: 'info' },
        { label: 'Keausan bertahap', value: 'Dikecualikan', flag: 'info' },
        { label: 'Objek', value: 'Excavator EX-2085', flag: 'info' },
      ],
    },
  ],
  tables: [
    {
      id: 'laporan',
      title: 'Laporan Kejadian (simulasi)',
      icon: 'dokumen',
      rows: [
        { label: 'Tanggal kejadian', value: '09 Agu 2026', flag: 'info' },
        { label: 'Kronologi', value: 'Saat berputar, boom dan kabin membentur dinding galian', flag: 'info' },
        { label: 'Kondisi', value: 'Operator selamat, area diamankan', flag: 'info' },
      ],
    },
    {
      id: 'servis',
      title: 'Buku Servis EX-2085 (simulasi)',
      icon: 'obeng',
      rows: [
        { label: '21 Jul 2026', value: 'Track shoe aus, disarankan ganti', flag: 'info' },
        { label: '21 Jul 2026', value: 'Selang hidrolik rembes ringan, dipantau', flag: 'info' },
        { label: '21 Jul 2026', value: 'Boom, kaca kabin, mesin: kondisi baik', flag: 'info' },
        {
          label: '11 Agu 2026',
          // Dua kalimat (bukan satu daftar + tanda kurung) supaya keterangan penyebab tidak terbaca ganda.
          value: 'Pemeriksaan setelah kejadian: boom penyok dan kaca kabin pecah. Mesin sulit hidup, penyebab belum diketahui.',
          flag: 'info',
        },
      ],
    },
  ],
  steps: [
    {
      kind: 'assign',
      id: 'pilah',
      prompt: 'Pilah tiap temuan bengkel',
      presentation: 'sort',
      weight: 2,
      hint: 'Cocokkan tiap temuan dengan catatan di buku servis dan laporan kejadian.',
      items: [
        { id: 'selang', label: 'Selang hidrolik rembes' },
        { id: 'boom', label: 'Boom penyok' },
        { id: 'mesin', label: 'Mesin sulit hidup' },
        { id: 'track', label: 'Track shoe aus' },
        { id: 'kaca', label: 'Kaca kabin pecah' },
      ],
      buckets: [
        { id: 'terkait', label: 'Periksa sebagai kerusakan terkait kejadian', icon: 'cek' },
        { id: 'sebelumnya', label: 'Pisahkan sebagai kondisi sebelum kejadian', icon: 'jam' },
        { id: 'teknis', label: 'Perlu pemeriksaan teknis tambahan', icon: 'obeng' },
      ],
    },
    {
      kind: 'single',
      id: 'simpul',
      prompt: 'Kesimpulan awal yang tepat?',
      presentation: 'list',
      weight: 1,
      options: [
        {
          id: 'semua',
          label: 'Semua temuan otomatis dijamin karena polis menjamin benturan dan unit memang terbentur, jadi tidak perlu dipilah',
        },
        { id: 'tolak', label: 'Seluruh laporan di luar jaminan karena buku servis mencatat keausan pada unit' },
        {
          id: 'pisah',
          label: 'Kerusakan terkait benturan diperiksa, kondisi lama dipisahkan, yang belum jelas menunggu pemeriksaan teknis',
        },
        { id: 'tunda', label: 'Perbaiki semua kerusakan dulu supaya unit cepat bekerja, pemilahan dilakukan belakangan' },
      ],
    },
  ],
};
