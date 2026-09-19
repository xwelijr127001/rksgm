import type { MissionPublic } from '../types';

/**
 * Misi acara 03 - Empat Foto, Apa Tugasnya? (AUTO, tingkat 1, penutup tingkat mudah).
 * DRAF tim game, BELUM ditinjau PIC Claim. Kasus simulasi edukasi, tanpa kunci jawaban
 * (kunci: server/src/acara/a03.ts). Rumusan kegunaan foto memakai kalimat materi paket latihan (m02).
 *
 * Catatan data: label item memakai pola "Foto A - ..." karena chip item menampilkan bagian sebelum " - ".
 * Urutan kategori di data bebas; daftar kategori di layar diacak `urutanTampil`.
 */
export const misi: MissionPublic = {
  id: 'a03-tugas-foto',
  number: 3,
  level: 1,
  title: 'Empat Foto, Apa Tugasnya?',
  product: 'AUTO',
  productLabel: 'AUTO - Kendaraan Bermotor',
  location: 'Bengkel Mitra',
  scene: 'bengkel',
  story:
    'Mobil nasabah ditabrak dari belakang; bemper belakang kanan penyok. Empat foto sudah dicetak dan digantung di bengkel. Kepala bengkel bertanya, "Masing-masing foto ini sebenarnya membuktikan apa?"',
  instruction: 'Ketuk tiap foto, lalu pilih kegunaannya untuk pemeriksaan.',
  interactionLabel: 'Cocokkan 4 foto dengan kegunaannya',
  durationSeconds: 50,
  briefingSeconds: 10,
  rakiBriefing: 'Foto bukti itu ada tugasnya. Lihat isi tiap foto, lalu tentukan kegunaannya, ya.',
  learning: 'Bukti yang baik punya tugas yang jelas dalam pemeriksaan; banyak foto belum tentu banyak bukti.',
  steps: [
    {
      kind: 'assign',
      id: 'fungsi',
      prompt: 'Cocokkan tiap foto dengan kegunaannya',
      presentation: 'match',
      weight: 1,
      items: [
        { id: 'foto-a', label: 'Foto A - seluruh mobil dari samping', icon: 'mobil' },
        { id: 'foto-b', label: 'Foto B - bemper belakang kanan dari dekat', icon: 'rusak' },
        { id: 'foto-c', label: 'Foto C - plat nomor dan nomor rangka', icon: 'plat' },
        { id: 'foto-d', label: 'Foto D - selfie nasabah di depan bengkel', icon: 'selfie' },
      ],
      buckets: [
        { id: 'identitas', label: 'Memastikan kendaraan yang diperiksa benar', icon: 'dokumen' },
        { id: 'tidak', label: 'Tidak membantu pemeriksaan', icon: 'silang' },
        { id: 'kondisi', label: 'Menunjukkan kondisi kendaraan secara keseluruhan', icon: 'daftar' },
        { id: 'titik', label: 'Menunjukkan titik benturan', icon: 'lokasi' },
      ],
    },
  ],
};
