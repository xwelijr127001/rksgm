/**
 * Kanvas & jangkar bersama tokoh v3 (satuan dunia pada skala 1; docs/cerita/ADEGAN-AUTO1.md bagian 2 & 6).
 * Semua generator tokoh (Miss Raksa, Bu Rina) WAJIB memakai ukuran ini supaya panggung, potret, dan aktivitas
 * bisa menukar tokoh/pose tanpa menyetel ulang posisi. Tinggi kepala (puncak rambut/hijab → dagu) ± 130 satuan;
 * tokoh berdiri ± 7 kepala.
 */
import type { Titik } from './tipe';

export const KEPALA_TINGGI = 130;

/** Pose berdiri / jalan / pergi: telapak kaki di jangkar. */
export const KANVAS_BERDIRI = { w: 420, h: 1000, jangkar: { x: 210, y: 985 } as Titik, kepala: { x: 210, y: 120 } as Titik };

/** Pose duduk: pinggul di dudukan kursi = jangkar; kaki sampai ± y 880 (tertutup meja untuk Miss Raksa). */
export const KANVAS_DUDUK = { w: 460, h: 900, jangkar: { x: 230, y: 560 } as Titik, kepala: { x: 230, y: 150 } as Titik };

/** Jendela potret persegi di sekitar kepala pose duduk (viewBox) — dipakai PotretNasabah & potret Miss Raksa. */
export const JENDELA_POTRET_V3 = { x: 120, y: 40, sisi: 220 } as const;

/**
 * Jendela potret KECIL (tampil <= POTRET_KECIL_MAKS_PX px): lebih rapat ke wajah supaya ekspresi tetap terbaca di
 * 32-52 px. Sama untuk kedua tokoh (skala wajah seragam); dipakai bersama opsi `kecil`.
 */
export const JENDELA_POTRET_KECIL = { x: 150, y: 76, sisi: 160 } as const;
export const POTRET_KECIL_MAKS_PX = 52;
