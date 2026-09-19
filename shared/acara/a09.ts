import type { MissionPublic } from '../types';

/**
 * Misi acara 09 - Hitung Berlapis (HVC, tingkat 3). DRAF tim game, BELUM ditinjau PIC Claim.
 * Lanjutan kasus excavator EX-2085 (misi acara 08), tetapi berdiri sendiri: tiap baris estimasi
 * sudah diberi keterangan. Ketentuan risiko sendiri sama dengan m09-hitung-teliti; hanya angka
 * kasusnya yang baru. Tanpa kunci jawaban (kunci: server/src/acara/a09.ts).
 */
export const misi: MissionPublic = {
  id: 'a09-hitung-lapis',
  number: 9,
  title: 'Hitung Berlapis',
  product: 'HVC',
  productLabel: 'HVC - Alat Berat',
  location: 'Meja Hitung Kantor Raksa',
  scene: 'kantor-hitung',
  level: 3,
  story:
    'Lanjutan kasus excavator EX-2085. Pemeriksaan teknis selesai: mesin sulit hidup ternyata karena keausan, bukan benturan. Bengkel mengirim estimasi total Rp60.000.000. Anggap seluruh kerusakan akibat benturan disetujui sesuai estimasi, dan tidak ada batas atau pengurang lain dalam soal.',
  instruction: 'Buka estimasi bengkel dan kartu polis, lalu susun hitungan sampai hasil akhir.',
  interactionLabel: 'Susun perhitungan',
  durationSeconds: 85,
  briefingSeconds: 12,
  rakiBriefing:
    'Hitungannya berlapis: dasar hitung, risiko sendiri, lalu hasil akhir. Baca tiap baris estimasi dan kartu polis dengan teliti.',
  learning:
    'Tentukan dulu dasar hitungnya (hanya kerusakan terkait kejadian), lalu bandingkan persentase risiko sendiri dengan nilai minimumnya.',
  policyCards: [
    {
      id: 'kartu-hvc',
      title: 'Kartu Polis HVC - Alat Berat (simulasi)',
      subtitle: 'Objek: Excavator EX-2085',
      product: 'HVC',
      rows: [
        { label: 'Benturan', value: 'Termasuk jaminan sesuai syarat', flag: 'info' },
        { label: 'Keausan bertahap', value: 'Dikecualikan', flag: 'info' },
        { label: 'Risiko sendiri', value: '10% dari kerugian yang disetujui', flag: 'info' },
        { label: 'Minimum risiko sendiri', value: 'Rp5.000.000', flag: 'info' },
        { label: 'Batas / pengurang lain', value: 'Tidak ada', flag: 'info' },
      ],
      note: 'Kartu simulasi, bukan ketentuan polis sebenarnya.',
    },
  ],
  tables: [
    {
      id: 'estimasi',
      title: 'Estimasi Bengkel EX-2085 (simulasi)',
      icon: 'obeng',
      rows: [
        { label: 'Boom penyok (akibat benturan)', value: 'Rp28.000.000', flag: 'info' },
        { label: 'Kaca kabin pecah (akibat benturan)', value: 'Rp12.000.000', flag: 'info' },
        {
          label: 'Track shoe aus & selang hidrolik rembes (sudah tercatat di buku servis sebelum kejadian)',
          value: 'Rp15.000.000',
          flag: 'info',
        },
        { label: 'Mesin (hasil pemeriksaan teknis: keausan)', value: 'Rp5.000.000', flag: 'info' },
        { label: 'Total estimasi', value: 'Rp60.000.000', flag: 'info' },
      ],
    },
  ],
  steps: [
    {
      kind: 'number',
      id: 'dasar',
      prompt: 'Kerugian terkait kejadian yang masuk hitungan',
      weight: 2,
      format: 'rupiah',
      suggestions: [28_000_000, 40_000_000, 55_000_000, 60_000_000],
    },
    {
      kind: 'number',
      id: 'risiko',
      prompt: 'Risiko sendiri yang dipakai',
      weight: 1,
      format: 'rupiah',
      suggestions: [4_000_000, 5_000_000, 5_500_000, 6_000_000],
      hint: 'Bandingkan hasil persentase dengan nilai minimum.',
    },
    {
      kind: 'number',
      id: 'hasil',
      prompt: 'Hasil akhir simulasi',
      weight: 2,
      format: 'rupiah',
      suggestions: [35_000_000, 36_000_000, 49_500_000, 54_000_000, 55_000_000],
    },
  ],
};
