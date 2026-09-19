/**
 * Misi acara 09 - Hitung Berlapis (meja hitung Kantor Raksa, lanjutan kasus excavator EX-2085).
 * Mekanik: PAPAN LEMBAR HITUNG seperti m09, tetapi tanpa perancah: tiga langkah angka dijawab
 * lewat kontrol HTML dan papan di dinding hanya menggemakan angka pilihan pemain (netral).
 *
 * Latar `m09-latar` dipakai TANPA perubahan (papan tetap 3 baris). Yang bisa diketuk hanya dua
 * dokumen SETARA di meja: lembar estimasi bengkel dan kartu polis. Tidak ada objek pilihan,
 * jadi adegan tidak bisa membocorkan jawaban. Miniatur excavator di bawah lampu meja hanya
 * pemanis (penanda kasus yang sama dengan misi 8): kecil, tanpa label, tanpa titik ketuk.
 *
 * Tata letak label (pil = lebar teks 20 px tebal + 44): "Estimasi bengkel" sekitar 202,
 * "Kartu polis" sekitar 146, versi Inggris setara. Kedua pil sebaris (y 336), maka digeser saling
 * menjauh (labelDx -20 / +20): pil kiri 179-381, pil kanan 399-545, sela 18.
 */

import type { SceneSpec } from '../../types';
import { INK_TIPIS, P, art, circle, line, rect, rrect } from '../../art/kit';
import { policyCard } from '../../art/props';
import { excavator } from '../../art/vehicles';
import { PAPAN, latar, lembarData } from '../m09-hitung';

// ------------------------------------------------------------------ objek

/** Kunci pas kecil (tinta) di dalam lencana bulat; `celah` = warna lencana untuk rahang terbuka. */
function kunciPas(cx: number, cy: number, celah: string): string {
  return `<g transform="rotate(-40 ${cx} ${cy})">
    ${rrect(cx - 2, cy - 4, 4, 13, 2, P.tinta)}
    ${circle(cx, cy - 6, 5, P.tinta)}
    ${rect(cx - 1.8, cy - 11, 3.6, 5.5, celah)}
    ${circle(cx, cy + 7, 1.1, celah)}</g>`;
}

/**
 * Lembar Estimasi Bengkel di papan klip, 92 x 108 (membuka tabel estimasi).
 * Dasarnya lembar data m09; pembeda: strip judul oranye + lencana kunci pas.
 */
function lembarEstimasi(): string {
  return `
    ${lembarData()}
    ${rrect(20, 25, 52, 14, 3, P.oranye)}
    ${rrect(26, 28, 8, 8, 1.5, P.krem)}${line('M40 32 H64', P.krem, 3)}
    ${circle(68, 82, 12, P.kuning, INK_TIPIS)}
    ${kunciPas(68, 82, P.kuning)}`;
}

/** Miniatur excavator kuning di atas alas kayu, 78 x 50 (pemanis meja; bukan objek ketuk). */
function miniExcavator(): string {
  return `
    ${rrect(4, 39, 52, 8, 3, P.kayuTua)}
    ${rect(6, 39, 48, 2.5, P.putih, 'opacity="0.25"')}
    <g transform="translate(2 2) scale(0.24)">${excavator()}</g>`;
}

// ------------------------------------------------------------------ adegan

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a09-hitung-lapis',
  buat: () => ({
    missionId: 'a09-hitung-lapis',
    // Kunci & isi sama persis dengan m09 (tekstur dipakai ulang, tidak dirasterisasi dua kali).
    background: art('m09-latar', 640, 480, latar()),
    props: [
      // Di bawah sorot lampu meja, di antara kaki lampu dan kalkulator (x 85-153, alas di y 312).
      { id: 'mini-excavator', x: 117, y: 290, art: art('a09-excavator', 78, 50, miniExcavator()), motion: 'bob', depth: 6 },
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
        x: 300, y: 264, art: art('a09-estimasi', 92, 108, lembarEstimasi()), label: 'Estimasi bengkel', depth: 20,
        labelDx: -20, hit: { w: 160, h: 160 },
      },
      {
        id: 'kartu', role: 'doc', refId: 'kartu-hvc',
        x: 452, y: 280, art: art('a09-kartu', 110, 76, policyCard('HVC', P.hijau)), label: 'Kartu polis', depth: 20,
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
