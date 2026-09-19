import type { MissionPublic } from '../types';

/**
 * Misi acara 01 - Setelah Api Padam (FIRE, tingkat 1). DRAF, belum ditinjau PIC Claim.
 * Prinsip misi latihan 1 (dokumentasi dulu, lalu lapor lewat kanal klaim) dipindahkan dari
 * kendaraan ke properti. Tanpa dokumen, tanpa angka. Kunci jawaban: server/src/acara/a01.ts.
 * Silabus: docs/silabus-paket-acara.md
 */
export const misi: MissionPublic = {
  id: 'a01-api-padam',
  number: 1,
  level: 1,
  title: 'Setelah Api Padam',
  product: 'FIRE',
  productLabel: 'FIRE / PROPERTY - Kebakaran & Harta Benda',
  location: 'Toko Kain Jalan Kenanga',
  scene: 'ruko',
  story:
    'Api di toko kain nasabah sudah padam dan petugas pemadam menyatakan lokasi aman. Pemilik ingin tokonya cepat buka lagi dan bertanya, "Sekarang saya harus apa dulu?"',
  instruction: 'Ketuk dua tindakan yang tepat dilakukan lebih dulu.',
  interactionLabel: 'Pilih 2 tindakan',
  durationSeconds: 45,
  briefingSeconds: 10,
  rakiBriefing: 'Api sudah padam dan lokasi aman. Bantu pemilik toko memilih dua langkah pertamanya.',
  learning: 'Dokumentasi dan laporan lebih dulu menjaga jejak kejadian, juga untuk kerusakan properti.',
  steps: [
    {
      kind: 'multi',
      id: 'tindakan',
      prompt: 'Pilih 2 tindakan yang tepat dilakukan lebih dulu',
      presentation: 'cards',
      requiredSelections: 2,
      weight: 1,
      hint: 'Memilih tindakan yang kurang tepat mengurangi ketepatan.',
      options: [
        { id: 'buang', label: 'Buang barang hangus supaya toko cepat rapi', icon: 'rusak' },
        { id: 'foto', label: 'Foto kerusakan dan barang terdampak sebelum dipindahkan', icon: 'kamera' },
        { id: 'perbaiki', label: 'Panggil tukang memperbaiki dulu, lapor setelah selesai', icon: 'obeng' },
        { id: 'lapor', label: 'Laporkan kejadian melalui kanal klaim', icon: 'dokumen' },
        { id: 'abaikan', label: 'Buka toko seperti biasa; api sudah padam, tidak perlu lapor', icon: 'warung' },
      ],
    },
  ],
};
