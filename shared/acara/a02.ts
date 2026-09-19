import type { MissionPublic } from '../types';

/**
 * Misi acara 02 - Jepret Dulu, Baru Angkut (CARGO, tingkat 1).
 * DRAF tim game, belum ditinjau PIC Claim. Rancangan: docs/silabus-paket-acara.md.
 * Prinsip bukti misi latihan 2 dipindahkan ke barang kiriman. Tanpa dokumen, tanpa kunci jawaban.
 * Urutan opsi di data sengaja bercampur; tampilan tetap diacak `urutanTampil`. Acakan itu deterministik
 * per id misi + langkah, jadi bila urutan data diubah periksa ulang urutan TAMPIL-nya: opsi sejenis
 * jangan sampai berkumpul berurutan di daftar (urutan lama menaruh ketiga pengecoh di atas).
 */
export const misi: MissionPublic = {
  id: 'a02-jepret-kiriman',
  number: 2,
  level: 1,
  title: 'Jepret Dulu, Baru Angkut',
  product: 'CARGO',
  productLabel: 'CARGO - Pengangkutan Barang',
  location: 'Parkiran Ruko Jalan Melati',
  scene: 'parkiran',
  story:
    'Truk kurir menurunkan kiriman suku cadang di parkiran depan toko nasabah. Peti nomor 5 terlihat penyok di satu sisi. Peti akan segera diangkut ke dalam, jadi kamu hanya sempat mengambil tiga foto.',
  instruction: 'Potret tiga hal yang paling berguna untuk pemeriksaan sebelum peti diangkut.',
  interactionLabel: 'Pilih 3 foto',
  durationSeconds: 45,
  briefingSeconds: 10,
  rakiBriefing: 'Petinya sebentar lagi diangkut ke dalam. Cuma sempat tiga jepretan, pilih yang paling berguna!',
  learning: 'Bukti foto harus membantu menghubungkan barang kiriman, titik kerusakan, dan identitasnya.',
  steps: [
    {
      kind: 'multi',
      id: 'bukti',
      prompt: 'Pilih 3 foto yang paling berguna untuk pemeriksaan',
      presentation: 'cards',
      requiredSelections: 3,
      weight: 1,
      hint: 'Memilih foto yang tidak relevan mengurangi ketepatan.',
      options: [
        { id: 'spanduk', label: 'Foto spanduk promo toko sebelah', icon: 'spanduk' },
        { id: 'penyok', label: 'Foto dekat sisi peti nomor 5 yang penyok', icon: 'rusak' },
        { id: 'selfie', label: 'Selfie bersama kurir', icon: 'selfie' },
        { id: 'gerobak', label: 'Foto gerobak es di trotoar', icon: 'warung' },
        { id: 'tumpukan', label: 'Foto seluruh tumpukan peti saat diterima', icon: 'peti' },
        { id: 'label', label: 'Foto label kiriman dan nomor peti', icon: 'struk' },
      ],
    },
  ],
};
