import type { MissionPublic } from '../types';

/**
 * PAKET ACARA misi 5 - Kerusakan Sama, Nasib Beda (AUTO, tingkat 2).
 * DRAF tim game, BELUM ditinjau PIC Claim. Silabus: docs/silabus-paket-acara.md (a05).
 *
 * Tanpa kunci jawaban. Kartu sengaja TIDAK menulis persentase dan semua barisnya berbendera
 * `info`: pemain membandingkan sendiri estimasi kerusakan dengan nilai kendaraan tiap kartu.
 * Urutan kategori sama dengan misi 5 (warna stiker di adegan mengikuti urutan ini).
 */
export const misi: MissionPublic = {
  id: 'a05-nasib-beda',
  number: 5,
  level: 2,
  title: 'Kerusakan Sama, Nasib Beda',
  product: 'AUTO',
  productLabel: 'AUTO - Kendaraan Bermotor',
  location: 'Kantor Raksa',
  scene: 'kantor',
  story:
    'Tiga mobil rusak karena benturan masuk meja klaim hari ini. Dua di antaranya rusak berat dengan estimasi yang sama, Rp160 juta. Asumsikan semua polis aktif dan kondisi lain dalam simulasi terpenuhi.',
  instruction: 'Hitung dulu persen kerusakan Kasus B, lalu stempel kesimpulan untuk tiap map kasus.',
  interactionLabel: 'Hitung persen, lalu stempel map',
  durationSeconds: 60,
  briefingSeconds: 10,
  rakiBriefing: 'Rupiahnya sama, nilai mobilnya belum tentu. Buka kartunya, hitung sendiri persennya, ya.',
  learning:
    'Kerusakan yang sama bisa ditangani berbeda: lihat jaminan polisnya, lalu hitung persen kerusakan terhadap nilai kendaraan masing-masing dan bandingkan dengan ambangnya.',
  policyCards: [
    {
      id: 'polis-a',
      title: 'Kartu Polis A',
      subtitle: 'Comprehensive (simulasi)',
      product: 'AUTO',
      rows: [
        { label: 'Nilai kendaraan', value: 'Rp250.000.000', flag: 'info' },
        { label: 'Kerusakan benturan', value: 'Tercakup sesuai syarat kartu', flag: 'info' },
        { label: 'Estimasi kerusakan', value: 'Rp10.000.000', flag: 'info' },
        { label: 'Status polis', value: 'Aktif', flag: 'info' },
      ],
      note: 'Kartu simulasi untuk latihan pengambilan keputusan.',
    },
    {
      id: 'polis-b',
      title: 'Kartu Polis B',
      subtitle: 'TLO - Total Loss Only (simulasi)',
      product: 'AUTO',
      rows: [
        { label: 'Nilai kendaraan', value: 'Rp200.000.000', flag: 'info' },
        { label: 'Ambang kerusakan total', value: 'Minimal 75% nilai kendaraan', flag: 'info' },
        { label: 'Estimasi kerusakan', value: 'Rp160.000.000', flag: 'info' },
        { label: 'Status polis', value: 'Aktif', flag: 'info' },
      ],
      note: 'Kartu simulasi untuk latihan pengambilan keputusan.',
    },
    {
      id: 'polis-c',
      title: 'Kartu Polis C',
      subtitle: 'TLO - Total Loss Only (simulasi)',
      product: 'AUTO',
      rows: [
        { label: 'Nilai kendaraan', value: 'Rp400.000.000', flag: 'info' },
        { label: 'Ambang kerusakan total', value: 'Minimal 75% nilai kendaraan', flag: 'info' },
        { label: 'Estimasi kerusakan', value: 'Rp160.000.000', flag: 'info' },
        { label: 'Status polis', value: 'Aktif', flag: 'info' },
      ],
      note: 'Kartu simulasi untuk latihan pengambilan keputusan.',
    },
  ],
  steps: [
    {
      kind: 'number',
      id: 'persen',
      prompt: 'Estimasi kerusakan Kasus B = berapa persen dari nilai kendaraannya?',
      weight: 1,
      unit: '%',
      format: 'angka',
      suggestions: [40, 64, 75, 80],
    },
    {
      kind: 'assign',
      id: 'simpul',
      prompt: 'Stempel kesimpulan untuk tiap map kasus',
      presentation: 'match',
      weight: 2,
      items: [
        { id: 'kasus-a', label: 'Kasus A - Kartu Polis A (Comprehensive)', icon: 'mobil' },
        { id: 'kasus-b', label: 'Kasus B - Kartu Polis B (TLO)', icon: 'mobil' },
        { id: 'kasus-c', label: 'Kasus C - Kartu Polis C (TLO)', icon: 'mobil' },
      ],
      buckets: [
        { id: 'lanjut', label: 'Dapat dilanjutkan untuk penilaian', icon: 'cek' },
        { id: 'tidak-ambang', label: 'Kerusakan tidak memenuhi ambang TLO dalam simulasi', icon: 'silang' },
        { id: 'perlu-data', label: 'Perlu informasi tambahan sebelum disimpulkan', icon: 'tanya' },
      ],
    },
  ],
};
