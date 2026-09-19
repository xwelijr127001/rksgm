import type { MissionPublic } from '../types';

/**
 * Misi acara 07 - Tiga Polis, Satu Banjir (FIRE, tingkat 2). DRAF, belum ditinjau PIC Claim.
 * Silabus: docs/silabus-paket-acara.md. Tanpa kunci jawaban (kunci: server/src/acara/a07.ts).
 *
 * Tanggal kejadian HANYA ada di tabel `laporan`, tidak di kartu polis: pemain harus membaca silang.
 * Semua baris dokumen berbendera `info` (netral). Ketiga polis atas gudang yang sama hanyalah alat
 * banding seperti dua polis di Misi 7, bukan materi polis ganda.
 */
export const misi: MissionPublic = {
  id: 'a07-tiga-polis',
  number: 7,
  title: 'Tiga Polis, Satu Banjir',
  product: 'FIRE',
  productLabel: 'FIRE / PROPERTY - Kebakaran & Harta Benda',
  location: 'Gudang Sentra Niaga',
  scene: 'gudang',
  level: 2,
  story:
    'Gudang Sentra Niaga terendam banjir. Pemilik menyodorkan tiga polis simulasi dan berkata, "Pakai Polis B saja, itu yang paling baru dan nilainya paling besar."',
  instruction: 'Buka laporan kejadian dan ketiga polis. Tentukan hasil pemeriksaan tiap berkas, lalu tanggapi pemilik gudang.',
  interactionLabel: 'Pilah tiga berkas polis',
  durationSeconds: 70,
  briefingSeconds: 10,
  rakiBriefing: 'Tanggal kejadian ada di laporan, bukan di kartu polis. Buka keempat dokumennya dulu, ya.',
  learning: 'Jenis risiko harus tercantum di polis, dan periode polis harus mencakup tanggal kejadian.',
  tables: [
    {
      id: 'laporan',
      title: 'Laporan Kejadian (simulasi)',
      icon: 'dokumen',
      rows: [
        { label: 'Tanggal kejadian', value: '14 Feb 2026', flag: 'info' },
        { label: 'Penyebab', value: 'Banjir', flag: 'info' },
        { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
      ],
    },
  ],
  policyCards: [
    {
      id: 'polis-a',
      title: 'Polis A',
      subtitle: 'Property All Risk (simulasi)',
      product: 'FIRE',
      rows: [
        { label: 'Perluasan banjir', value: 'Tercantum', flag: 'info' },
        { label: 'Periode polis', value: '01 Mar 2025 - 28 Feb 2026', flag: 'info' },
        { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
        { label: 'Nilai pertanggungan', value: 'Rp2.000.000.000', flag: 'info' },
      ],
    },
    {
      id: 'polis-b',
      title: 'Polis B',
      subtitle: 'Property All Risk (simulasi)',
      product: 'FIRE',
      rows: [
        { label: 'Perluasan banjir', value: 'Tercantum', flag: 'info' },
        { label: 'Periode polis', value: '01 Mar 2026 - 28 Feb 2027', flag: 'info' },
        { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
        { label: 'Nilai pertanggungan', value: 'Rp3.000.000.000', flag: 'info' },
      ],
    },
    {
      id: 'polis-c',
      title: 'Polis C',
      subtitle: 'Kebakaran standar (simulasi)',
      product: 'FIRE',
      rows: [
        { label: 'Perluasan banjir', value: 'Tidak tercantum', flag: 'info' },
        { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'info' },
        { label: 'Objek', value: 'Gudang Sentra Niaga', flag: 'info' },
        { label: 'Nilai pertanggungan', value: 'Rp2.000.000.000', flag: 'info' },
      ],
    },
  ],
  steps: [
    {
      kind: 'assign',
      id: 'periksa',
      prompt: 'Tentukan hasil pemeriksaan tiap polis untuk kejadian ini',
      presentation: 'match',
      weight: 2,
      // Chip item memakai teks sebelum " - " ("Berkas A"); ketiga berkas berikon sama.
      items: [
        { id: 'berkas-a', label: 'Berkas A - Polis A', icon: 'polis' },
        { id: 'berkas-b', label: 'Berkas B - Polis B', icon: 'polis' },
        { id: 'berkas-c', label: 'Berkas C - Polis C', icon: 'polis' },
      ],
      // Urutan kategori di data bebas (daftar HTML diacak); warna stiker di adegan mengikuti urutan ini.
      buckets: [
        { id: 'luar-periode', label: 'Tanggal kejadian di luar periode polis', icon: 'jam' },
        { id: 'objek-beda', label: 'Objek berbeda dari yang tertulis di polis', icon: 'gudang' },
        { id: 'sesuai', label: 'Perluasan banjir tercantum dan periode mencakup tanggal kejadian', icon: 'cek' },
        { id: 'tanpa-banjir', label: 'Perluasan banjir tidak tercantum', icon: 'banjir' },
      ],
    },
    {
      kind: 'single',
      id: 'alasan',
      prompt: 'Pemilik ingin memakai Polis B karena paling baru dan nilainya terbesar. Tanggapanmu?',
      presentation: 'list',
      weight: 1,
      options: [
        { id: 'terbaru', label: 'Setuju, polis terbaru berlaku untuk semua kejadian', icon: 'jam' },
        { id: 'selalu-dijamin', label: 'Ketiganya bisa dipakai karena banjir selalu dijamin polis properti', icon: 'banjir' },
        {
          id: 'risiko-periode',
          label: 'Yang menentukan: jenis risiko yang tercantum dan periode yang mencakup tanggal kejadian',
          icon: 'polis',
        },
        { id: 'nilai-besar', label: 'Setuju, pilih polis dengan nilai pertanggungan terbesar', icon: 'uang' },
      ],
    },
  ],
};
