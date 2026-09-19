/**
 * Penilaian tampilan pembahasan per langkah: "Pilihanmu" dan "Langkah yang tepat".
 *
 * Murni & teruji (hasil.test.ts). Memakai gradeStep yang SAMA dengan server, dengan kunci
 * yang disusun dari `StepReveal.correct` (baru dikirim saat REVEAL). Skor resmi tetap dari
 * server; fungsi ini hanya menjelaskan hasil itu per langkah dengan kata-kata.
 * Penilaian tidak bergantung pada bahasa; hanya judulHasil() yang membaca kamus (t()).
 */

import { formatRupiah, gradeStep, type StepKey } from '@shared/scoring';
import type { MissionReveal, OptionDef, StepAnswer, StepDef, StepReveal } from '@shared/types';
import { t } from '../i18n';
import { asList, asNumber, asRecord, asText } from './draft';

export type StatusLangkah = 'tepat' | 'sebagian' | 'belum' | 'kosong';

export interface BarisHasil {
  teks: string;
  /** Untuk "Pilihanmu": tepat / salah. Untuk "Langkah yang tepat": dipilih / terlewat. */
  tanda: 'tepat' | 'salah' | 'terlewat' | 'dipilih';
}

export interface HasilLangkah {
  stepId: string;
  prompt: string;
  status: StatusLangkah;
  /** 0..1, sama dengan perhitungan server; null bila kunci tidak tersedia. */
  akurasi: number | null;
  pilihan: BarisHasil[];
  tepat: BarisHasil[];
  alasan: string;
}

function label(daftar: OptionDef[], id: string): string {
  return daftar.find((o) => o.id === id)?.label ?? id;
}

function angka(step: Extract<StepDef, { kind: 'number' }>, n: number): string {
  return step.format === 'rupiah' ? formatRupiah(n) : `${n}${step.unit ? ' ' + step.unit : ''}`;
}

/** Kunci penilaian dari data REVEAL (null bila server tidak menyertakan bentuk mesinnya). */
export function kunciDariReveal(step: StepDef, r: StepReveal): StepKey | null {
  const c = r.correct;
  if (!c) return null;
  const dasar = { stepId: step.id, weight: r.weight, explanation: r.explanation };
  if (step.kind === 'single' && c.optionIds?.[0]) return { ...dasar, single: c.optionIds[0] };
  if (step.kind === 'multi' && c.optionIds) return { ...dasar, multi: c.optionIds, requiredSelections: step.requiredSelections };
  if (step.kind === 'assign' && c.assign) return { ...dasar, assign: c.assign };
  if (step.kind === 'number' && typeof c.value === 'number') return { ...dasar, number: { value: c.value } };
  return null;
}

function kosong(step: StepDef, v: StepAnswer | undefined): boolean {
  if (step.kind === 'single') return !asText(v);
  if (step.kind === 'multi' || step.kind === 'order') return asList(v).length === 0;
  if (step.kind === 'assign') return Object.keys(asRecord(v)).length === 0;
  if (step.kind === 'number') return asNumber(v) === null;
  return true;
}

export function nilaiLangkah(step: StepDef, r: StepReveal, v: StepAnswer | undefined): HasilLangkah {
  const kunci = kunciDariReveal(step, r);
  const akurasi = kunci ? gradeStep(kunci, v) : null;
  const status: StatusLangkah = kosong(step, v) ? 'kosong' : akurasi === null ? 'belum' : akurasi >= 1 ? 'tepat' : akurasi > 0 ? 'sebagian' : 'belum';
  const pilihan: BarisHasil[] = [];
  const tepat: BarisHasil[] = [];
  const c = r.correct;

  if (step.kind === 'single') {
    const id = asText(v);
    const benar = c?.optionIds?.[0];
    if (id) pilihan.push({ teks: label(step.options, id), tanda: id === benar ? 'tepat' : 'salah' });
    if (benar) tepat.push({ teks: label(step.options, benar), tanda: id === benar ? 'dipilih' : 'terlewat' });
  } else if (step.kind === 'multi') {
    const dipilih = asList(v);
    const benar = new Set(c?.optionIds ?? []);
    for (const id of dipilih) pilihan.push({ teks: label(step.options, id), tanda: benar.has(id) ? 'tepat' : 'salah' });
    for (const id of c?.optionIds ?? []) tepat.push({ teks: label(step.options, id), tanda: dipilih.includes(id) ? 'dipilih' : 'terlewat' });
  } else if (step.kind === 'assign') {
    const peta = asRecord(v);
    const benar = c?.assign ?? {};
    for (const it of step.items) {
      const b = peta[it.id];
      if (b) pilihan.push({ teks: `${label(step.items, it.id)}: ${label(step.buckets, b)}`, tanda: benar[it.id] === b ? 'tepat' : 'salah' });
      const kb = benar[it.id];
      if (kb) tepat.push({ teks: `${label(step.items, it.id)}: ${label(step.buckets, kb)}`, tanda: b === kb ? 'dipilih' : 'terlewat' });
    }
  } else if (step.kind === 'number') {
    const n = asNumber(v);
    if (n !== null) pilihan.push({ teks: angka(step, n), tanda: typeof c?.value === 'number' && n === c.value ? 'tepat' : 'salah' });
    if (typeof c?.value === 'number') tepat.push({ teks: angka(step, c.value), tanda: n === c.value ? 'dipilih' : 'terlewat' });
  }
  // Tanpa bentuk mesin (atau jenis langkah lain): pakai teks jawaban dari server apa adanya.
  if (!tepat.length) for (const teks of r.correctText) tepat.push({ teks, tanda: 'terlewat' });

  return { stepId: step.id, prompt: r.prompt, status, akurasi, pilihan, tepat, alasan: r.explanation };
}

export function nilaiMisi(steps: StepDef[], reveal: MissionReveal, answer: Record<string, StepAnswer> | null): HasilLangkah[] {
  return reveal.steps.flatMap((r) => {
    const step = steps.find((s) => s.id === r.stepId);
    return step ? [nilaiLangkah(step, r, answer?.[step.id])] : [];
  });
}

export type StatusMisi = 'tepat' | 'sebagian' | 'belum' | 'terlewat';

/** Status keseluruhan dari akurasi resmi server (0..1) dan apakah pemain mengirim jawaban. */
export function statusMisi(akurasi: number, dijawab: boolean): StatusMisi {
  if (!dijawab) return 'terlewat';
  if (akurasi >= 1) return 'tepat';
  if (akurasi > 0) return 'sebagian';
  return 'belum';
}

/**
 * Kalimat utama hasil dalam bahasa aktif: manusiawi, bukan persentase besar.
 * Teksnya ada di kamus `misi` (hasil.<status>.judul / .sub); dibaca saat render.
 */
export function judulHasil(st: StatusMisi): { judul: string; sub: string } {
  return { judul: t(`misi.hasil.${st}.judul`), sub: t(`misi.hasil.${st}.sub`) };
}
