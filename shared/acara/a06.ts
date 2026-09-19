import type { MissionPublic } from '../types';

/**
 * Misi acara 06 - Satu per Satu, Pak Kepala Gudang (HVC, tingkat 2).
 * DRAF tim game, BELUM ditinjau PIC Claim. Kasus simulasi edukasi, tanpa kunci jawaban
 * (kunci: server/src/acara/a06.ts). Tanpa dokumen: yang diuji adalah ALUR penanganan; kalimat
 * tiap tindakan memakai istilah materi paket latihan (m01 kanal klaim & koordinasi, m04 posisi
 * unit & nomor seri, m10 survei / penilaian sesuai prosedur).
 *
 * Catatan data:
 * - Urutan proses dibuat sebagai `assign` ke slot "Langkah 1 - 4" + satu slot "jangan dulu",
 *   karena jenis langkah `order` belum didukung layar main.
 * - Chip item di layar tampil MENURUT URUTAN DATA (tidak diacak), jadi urutan item di bawah
 *   sengaja BUKAN urutan yang benar; urutannya disamakan dengan posisi kiri-kanan di adegan.
 * - Daftar kategori di panel SELALU diacak `urutanTampil` (benih `a06-urutan-gudang:urutan:kategori`).
 *   Kategori misi ini bernomor, dan daftar "Langkah 3, Jangan, Langkah 4, Langkah 2, Langkah 1"
 *   membuat pemain mencari-cari di HP. Karena itu URUTAN DATA `buckets` di bawah sengaja dibuat
 *   kebalikan acakan tersebut, supaya yang TAMPIL adalah Langkah 1, 2, 3, 4, lalu "Jangan dilakukan
 *   dulu". Urutan alami slot bernomor tidak membocorkan apa pun. Bila id misi, id langkah, atau
 *   rumus `urutanTampil` berubah, hitung ulang urutan data ini.
 * - Label item sengaja tanpa " - " supaya chip memuat nama tindakan selengkapnya.
 */
export const misi: MissionPublic = {
  id: 'a06-urutan-gudang',
  number: 6,
  level: 2,
  title: 'Satu per Satu, Pak Kepala Gudang',
  product: 'HVC',
  productLabel: 'HVC - Alat Berat',
  location: 'Gudang Alat Berat',
  scene: 'gudang-forklift',
  story:
    'Forklift menyenggol rak besi di gudang alat berat. Semua orang aman dan area sudah diamankan. Kepala gudang ingin semuanya beres hari ini juga: "Las saja sekarang, patahannya buang!"',
  instruction: 'Susun urutan penanganannya. Hati-hati, ada satu tindakan yang jangan dilakukan dulu.',
  interactionLabel: 'Beri nomor urut 5 tindakan',
  durationSeconds: 65,
  briefingSeconds: 10,
  rakiBriefing: 'Pak Kepala Gudang buru-buru, tapi penanganan klaim ada urutannya. Susun satu per satu, ya.',
  learning: 'Penanganan klaim berjalan berurutan. Terburu-buru justru bisa menghilangkan bukti dan memperlambat proses.',
  steps: [
    {
      kind: 'assign',
      id: 'urutan',
      prompt: 'Beri nomor urut tiap tindakan (satu jangan dilakukan dulu)',
      presentation: 'stage',
      weight: 1,
      items: [
        { id: 'lapor', label: 'Laporkan kejadian melalui kanal klaim', icon: 'dokumen' },
        { id: 'perbaiki', label: 'Perbaikan unit setelah ada koordinasi', icon: 'obeng' },
        { id: 'buang', label: 'Buang komponen yang patah supaya gudang rapi', icon: 'rusak' },
        { id: 'dok', label: 'Dokumentasikan kerusakan, posisi unit, dan nomor seri', icon: 'kamera' },
        { id: 'survei', label: 'Survei / penilaian kerusakan sesuai prosedur', icon: 'daftar' },
      ],
      // Urutan data = kebalikan acakan `urutanTampil`; di layar tampil Langkah 1 - 4 lalu "Jangan".
      buckets: [
        { id: 'jangan', label: 'Jangan dilakukan dulu', icon: 'jam' },
        { id: 'l4', label: 'Langkah 4', icon: 'daftar' },
        { id: 'l1', label: 'Langkah 1', icon: 'daftar' },
        { id: 'l3', label: 'Langkah 3', icon: 'daftar' },
        { id: 'l2', label: 'Langkah 2', icon: 'daftar' },
      ],
    },
  ],
};
