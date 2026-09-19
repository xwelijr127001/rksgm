import type { MissionPublic } from '../types';

/**
 * MISI ACARA 10 - Grand Mission: Banjir Susulan (MIX, tingkat 3). DRAF, belum ditinjau PIC Claim.
 * Tempat yang sama dengan misi latihan 10, tetapi kasusnya lain: hafalan tidak menolong.
 * Semua baris kartu berbendera `info` (netral) dan semua kartu punya baris periode, jadi
 * peserta harus membandingkan sendiri. Tanggal kejadian ada di cerita dan di catatan SEMUA kartu.
 * Tanpa kunci jawaban (kunci: folder acara di sisi server).
 */
const CATATAN_KARTU = 'Tanggal kejadian: 14 Mar 2026. Kartu simulasi untuk latihan.';

export const misi: MissionPublic = {
  id: 'a10-banjir-susulan',
  number: 10,
  level: 3,
  title: 'Grand Mission: Banjir Susulan',
  product: 'MIX',
  productLabel: 'AUTO + HVC + PROPERTY + CARGO',
  location: 'Kompleks Usaha Kota',
  scene: 'kota-banjir',
  story:
    'Banjir susulan melanda Kompleks Usaha Kota pada 14 Mar 2026. Semua orang sudah aman. Empat laporan masuk sekaligus: mobil operasional, alat berat, gudang, dan kiriman barang. Hati-hati: tempatnya sama, kasusnya tidak.',
  instruction: 'Dua tahap: tentukan temuan utama tiap kasus, lalu pilih tindak lanjutnya.',
  interactionLabel: 'Dua tahap keputusan',
  durationSeconds: 90,
  briefingSeconds: 12,
  rakiBriefing: 'Misi puncak! Tempatnya sama, kasusnya beda. Buka tiap kartu, bandingkan sendiri, baru putuskan.',
  learning:
    'Tempat boleh sama, kasusnya tidak. Periksa objek, jaminan, periode, dan bukti tiap kasus sebelum menentukan langkah berikutnya.',
  policyCards: [
    {
      id: 'kasus-a',
      title: 'Kasus A - Mobil operasional',
      subtitle: 'Kartu polis simulasi',
      product: 'AUTO',
      rows: [
        { label: 'Jenis polis', value: 'TLO, ambang minimal 75% nilai kendaraan', flag: 'info' },
        { label: 'Banjir', value: 'Tercakup pada kartu', flag: 'info' },
        { label: 'Nilai kendaraan', value: 'Rp200.000.000', flag: 'info' },
        { label: 'Estimasi kerusakan', value: 'Rp30.000.000', flag: 'info' },
        { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'info' },
      ],
      note: CATATAN_KARTU,
    },
    {
      id: 'kasus-b',
      title: 'Kasus B - Alat berat',
      subtitle: 'Kartu polis simulasi',
      product: 'HVC',
      rows: [
        { label: 'Banjir', value: 'Tercakup pada kartu', flag: 'info' },
        { label: 'Nomor seri kartu polis', value: 'EX-4471', flag: 'info' },
        { label: 'Nomor seri pada laporan', value: 'EX-4471', flag: 'info' },
        { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'info' },
        { label: 'Bukti awal', value: 'Lengkap', flag: 'info' },
      ],
      note: CATATAN_KARTU,
    },
    {
      id: 'kasus-c',
      title: 'Kasus C - Gudang',
      subtitle: 'Kartu polis simulasi',
      product: 'FIRE',
      rows: [
        { label: 'Perluasan banjir', value: 'Tercantum', flag: 'info' },
        { label: 'Periode polis', value: '01 Mar 2025 - 28 Feb 2026', flag: 'info' },
        { label: 'Objek', value: 'Sesuai kartu polis', flag: 'info' },
        { label: 'Bukti awal', value: 'Lengkap', flag: 'info' },
      ],
      note: CATATAN_KARTU,
    },
    {
      id: 'kasus-d',
      title: 'Kasus D - Kiriman barang',
      subtitle: 'Kartu polis simulasi',
      product: 'CARGO',
      rows: [
        { label: 'Daftar pengiriman', value: '40 peti', flag: 'info' },
        { label: 'Bukti penerimaan', value: '38 peti, 5 kemasan basah', flag: 'info' },
        { label: 'Foto penerimaan', value: 'Belum dilampirkan', flag: 'info' },
        { label: 'Periode polis', value: '01 Jan 2026 - 31 Des 2026', flag: 'info' },
      ],
      note: CATATAN_KARTU,
    },
  ],
  steps: [
    {
      kind: 'assign',
      id: 'temuan',
      prompt: 'Tahap 1 - Apa temuan utama di tiap kasus?',
      presentation: 'stage',
      weight: 1,
      items: [
        { id: 'kasus-a', label: 'Kasus A - Mobil operasional', icon: 'mobil' },
        { id: 'kasus-b', label: 'Kasus B - Alat berat', icon: 'excavator' },
        { id: 'kasus-c', label: 'Kasus C - Gudang', icon: 'gudang' },
        { id: 'kasus-d', label: 'Kasus D - Kiriman barang', icon: 'peti' },
      ],
      // Urutan data sengaja begini: urutan TAMPIL (diacak deterministik, sama untuk semua pemain)
      // tidak boleh sejajar dengan urutan Kasus A - D, dan warna stiker hanya empat (kategori
      // ke-5 berwarna sama dengan ke-1). Periksa ulang urutan tampil bila daftar ini diubah.
      buckets: [
        { id: 'seri', label: 'Nomor seri unit berbeda', icon: 'plat' },
        { id: 'sesuai', label: 'Jaminan, periode, identitas, dan bukti sesuai', icon: 'cek' },
        { id: 'ambang', label: 'Nilai kerusakan di bawah ambang polis', icon: 'kalkulator' },
        { id: 'periode', label: 'Tanggal kejadian di luar periode polis', icon: 'jam' },
        { id: 'selisih', label: 'Jumlah / kondisi barang berbeda antar dokumen', icon: 'daftar' },
      ],
    },
    {
      kind: 'assign',
      id: 'tindak',
      prompt: 'Tahap 2 - Pilih tindak lanjut',
      presentation: 'stage',
      weight: 2,
      items: [
        { id: 'kasus-a', label: 'Kasus A - Mobil operasional', icon: 'mobil' },
        { id: 'kasus-b', label: 'Kasus B - Alat berat', icon: 'excavator' },
        { id: 'kasus-c', label: 'Kasus C - Gudang', icon: 'gudang' },
        { id: 'kasus-d', label: 'Kasus D - Kiriman barang', icon: 'peti' },
      ],
      buckets: [
        { id: 'survei', label: 'Lanjutkan ke survei / penilaian sesuai prosedur', icon: 'cek' },
        { id: 'klarifikasi', label: 'Klarifikasi identitas unit sebelum melanjutkan penilaian', icon: 'tanya' },
        { id: 'tidak-ambang', label: 'Kerusakan tidak memenuhi ambang TLO dalam simulasi', icon: 'silang' },
        {
          id: 'dokumentasi',
          label: 'Dokumentasikan ketidaksesuaian dan lengkapi dokumen pengangkutan',
          icon: 'dokumen',
        },
        { id: 'luar-periode', label: 'Di luar periode yang tercantum pada kartu simulasi', icon: 'jam' },
      ],
    },
  ],
};
