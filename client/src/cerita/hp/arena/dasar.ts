/**
 * Primitif jawaban arena (MissionAnswer misi sintetis) yang dipakai semua pola: baca peta {item: wadah} sebuah langkah assign,
 * tetapkan/lepaskan item, dan pilih opsi langkah single. Dipisah dari logika.ts supaya pola berdiri sendiri (mis. rambu.ts)
 * dapat memakainya tanpa impor melingkar.
 */
import type { MissionAnswer } from '@shared/types';

/** Peta {item: wadah} sebuah langkah assign (jawaban tak sah = kosong). */
export function petaLangkah(j: MissionAnswer, langkah: string): Record<string, string> {
  const v = j[langkah];
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
}

/** Tetapkan item ke wadah (jawaban baru; yang lama tidak diubah). */
export function tetapkan(j: MissionAnswer, langkah: string, item: string, wadah: string): MissionAnswer {
  return { ...j, [langkah]: { ...petaLangkah(j, langkah), [item]: wadah } };
}

/** Lepaskan item dari wadahnya. */
export function lepaskan(j: MissionAnswer, langkah: string, item: string): MissionAnswer {
  const p = { ...petaLangkah(j, langkah) };
  delete p[item];
  return { ...j, [langkah]: p };
}

/** Pilih opsi langkah pilih-satu. */
export function pilihOpsi(j: MissionAnswer, langkah: string, opsi: string): MissionAnswer {
  return { ...j, [langkah]: opsi };
}
