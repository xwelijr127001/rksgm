/**
 * Misi acara 09 - Hitung Berlapis (meja hitung Kantor Raksa, lanjutan kasus excavator EX-2085).
 * Mekanik: PAPAN LEMBAR HITUNG seperti m09, tetapi tanpa perancah: tiga langkah angka dijawab
 * lewat kontrol HTML dan papan di dinding hanya menggemakan angka pilihan pemain (netral).
 *
 * Latar = geometri m09 (T-061c: digambar ulang sebagai piksel; papan tetap 3 baris). Yang bisa diketuk hanya dua
 * dokumen SETARA di meja: lembar estimasi bengkel dan kartu polis. Tidak ada objek pilihan,
 * jadi adegan tidak bisa membocorkan jawaban. Miniatur excavator di bawah lampu meja hanya
 * pemanis (penanda kasus yang sama dengan misi 8): kecil, tanpa label, tanpa titik ketuk.
 *
 * Tata letak label (pil = lebar teks 20 px tebal + 44): "Estimasi bengkel" sekitar 202,
 * "Kartu polis" sekitar 146, versi Inggris setara. Kedua pil sebaris (y 336), maka digeser saling
 * menjauh (labelDx -20 / +20): pil kiri 179-381, pil kanan 399-545, sela 18.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { PAPAN } from '../m09-hitung';
import { estimasiA09, kartuA09, latarA09, miniExcavatorA09 } from './a09.piksel';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

// ------------------------------------------------------------------ adegan

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a09-hitung-lapis',
  buat: () => ({
    missionId: 'a09-hitung-lapis',
    // T-061c: gaya piksel kasus 1 (k = 2): latar meja hitung (geometri m09), dokumen & miniatur = seni piksel (./a09.piksel.ts).
    gaya: 'piksel',
    background: gambar('a09-latar-piksel', latarA09()),
    props: [
      // Di bawah sorot lampu meja, di antara kaki lampu dan kalkulator (x 85-153, alas di y 312).
      { id: 'mini-excavator', x: 117, y: 290, art: gambar('a09-excavator-piksel', miniExcavatorA09()), motion: 'bob', depth: 6 },
    ],
    hero: { x: 590, y: 478 },
    walk: { minX: 80, maxX: 596, minY: 462, maxY: 478 },
    objects: [
      // Dua dokumen setara, sama-sama berdiri di permukaan meja (tepi bawah y 312-313).
      // Estimasi di celah kalkulator - tumpukan berkas (slot lembar data m09, digeser 12 ke kiri);
      // kartu polis bersandar di depan tumpukan berkas. Area sentuh ikut menutup sebagian besar pil
      // label (pola m08/m10; pil di y 319-353) tanpa saling menutup dan tanpa menyentuh pil
      // tetangganya (x 220-380 vs 390-514; pil kartu mulai x 399, pil estimasi berakhir x 381).
      // Area estimasi y 184-344: batas atas hanya menyentuh tepi bawah baris terakhir papan
      // (papan tidak interaktif), batas bawah menutup pil sampai y 344 supaya ketukan di tengah pil
      // tetap membuka dokumen.
      {
        id: 'estimasi', role: 'doc', refId: 'estimasi',
        x: 300, y: 264, art: gambar('a09-estimasi-piksel', estimasiA09()), label: 'Estimasi bengkel', depth: 20,
        labelDx: -20, hit: { w: 160, h: 160 },
      },
      {
        id: 'kartu', role: 'doc', refId: 'kartu-hvc',
        x: 452, y: 280, art: gambar('a09-kartu-piksel', kartuA09()), label: 'Kartu polis', depth: 20,
        labelDx: 20, hit: { w: 124, h: 146 },
      },
    ],
    boards: [
      {
        id: 'lembar', x: PAPAN.x, y: PAPAN.y, w: PAPAN.w, title: 'Lembar hitung',
        lines: [
          { stepId: 'dasar', label: 'Masuk hitungan' },
          { stepId: 'risiko', label: 'Risiko sendiri' },
          { stepId: 'hasil', label: 'Hasil akhir' },
        ],
      },
    ],
  }),
};
