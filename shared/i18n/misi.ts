/**
 * Terjemahan KONTEN misi (yang memang boleh dilihat client) sebagai lapisan di atas
 * shared/missions.ts. Sumber kebenaran tetap teks Indonesia; lapisan ini hanya mengganti
 * TEKS berdasarkan id. Bagian yang belum diterjemahkan jatuh kembali ke teks Indonesia.
 *
 * Penjelasan jawaban & ringkasan pembahasan TIDAK ada di sini (itu membocorkan kunci):
 * terjemahannya ada di server (server/src/answerKeys.i18n.ts) dan baru dikirim saat REVEAL
 * lewat `MissionReveal.terjemahan`.
 */

import type { Bahasa, BahasaLain } from '../bahasa';
import { formatRupiah } from '../scoring';
import type { DocTable, MissionPublic, MissionReveal, OptionDef, PolicyCard, StepDef, StepReveal } from '../types';
import { MISI_EN } from './misi.en';
import { MISI_ZH } from './misi.zh';
import { MISI_ACARA_EN, MISI_ACARA_ZH } from './acara';

export interface TeksOpsi { label: string; desc?: string }

export interface TeksLangkah {
  prompt: string;
  hint?: string;
  /** Satuan langkah angka (mis. "peti"). */
  unit?: string;
  /** single/multi: teks per optionId. */
  opsi?: Record<string, TeksOpsi>;
  /** assign/order: teks per itemId. */
  item?: Record<string, TeksOpsi>;
  /** assign: teks per bucketId. */
  kategori?: Record<string, TeksOpsi>;
}

/** Kartu polis / tabel dokumen. `rows` berurutan sama dengan sumbernya (flag & jumlah baris tidak berubah). */
export interface TeksDokumen {
  title: string;
  subtitle?: string;
  note?: string;
  rows: { label: string; value: string }[];
}

export interface TeksMisi {
  title: string;
  productLabel: string;
  location: string;
  story: string;
  instruction: string;
  interactionLabel: string;
  learning: string;
  rakiBriefing: string;
  /** Per stepId. */
  steps: Record<string, TeksLangkah>;
  /** Per id kartu polis. */
  policyCards?: Record<string, TeksDokumen>;
  /** Per id tabel. */
  tables?: Record<string, TeksDokumen>;
  checklist?: string[];
}

/** Per missionId. */
export type KamusMisi = Record<string, TeksMisi>;

/** Paket latihan + paket acara. Diekspor untuk tes penjaga terjemahan. */
export const KAMUS_MISI: Record<BahasaLain, KamusMisi> = {
  en: { ...MISI_EN, ...MISI_ACARA_EN },
  zh: { ...MISI_ZH, ...MISI_ACARA_ZH },
};
const KAMUS = KAMUS_MISI;

function opsi(daftar: OptionDef[], teks: Record<string, TeksOpsi> | undefined): OptionDef[] {
  if (!teks) return daftar;
  return daftar.map((o) => {
    const t = teks[o.id];
    return t ? { ...o, label: t.label, desc: o.desc !== undefined ? (t.desc ?? o.desc) : o.desc } : o;
  });
}

function langkah(s: StepDef, t: TeksLangkah | undefined): StepDef {
  if (!t) return s;
  const dasar = { prompt: t.prompt, hint: s.hint !== undefined ? (t.hint ?? s.hint) : s.hint };
  if (s.kind === 'single' || s.kind === 'multi') return { ...s, ...dasar, options: opsi(s.options, t.opsi) };
  if (s.kind === 'assign') return { ...s, ...dasar, items: opsi(s.items, t.item), buckets: opsi(s.buckets, t.kategori) };
  if (s.kind === 'order') return { ...s, ...dasar, items: opsi(s.items, t.item) };
  return { ...s, ...dasar, unit: s.unit !== undefined ? (t.unit ?? s.unit) : s.unit };
}

function dokumen<T extends PolicyCard | DocTable>(d: T, t: TeksDokumen | undefined): T {
  if (!t) return d;
  return {
    ...d,
    title: t.title,
    ...('subtitle' in d && d.subtitle !== undefined ? { subtitle: t.subtitle ?? d.subtitle } : {}),
    note: d.note !== undefined ? (t.note ?? d.note) : d.note,
    rows: d.rows.map((r, i) => (t.rows[i] ? { ...r, label: t.rows[i]!.label, value: t.rows[i]!.value } : r)),
  };
}

const cache = new Map<string, { sidik: string; hasil: MissionPublic }>();

/**
 * Bagian misi yang TIDAK berasal dari lapisan terjemahan tetapi ikut disalin ke hasil. Bila salah
 * satunya berubah (misi yang sama dipasang di posisi playlist lain, durasi/tingkat/gambar
 * diganti), hasil lama tidak boleh dipakai lagi.
 */
function sidikMisi(m: MissionPublic): string {
  return [
    m.number,
    m.durationSeconds,
    m.briefingSeconds,
    m.level ?? '',
    m.image?.src ?? '',
    m.steps.map((s) => s.id).join(','),
  ].join('|');
}

/**
 * Misi dengan teks bahasa `bahasa`. Id, urutan, durasi, ikon, dan flag tidak berubah.
 * Misi tanpa lapisan terjemahan (soal kustom panitia) dikembalikan apa adanya dan tidak di-cache,
 * jadi suntingan panitia langsung tampil.
 */
export function terjemahkanMisi(m: MissionPublic, bahasa: Bahasa): MissionPublic {
  if (bahasa === 'id') return m;
  const t = KAMUS[bahasa][m.id];
  if (!t) return m;
  // Kunci menyertakan `number`: room ber-playlist mengirim misi yang sama dengan nomor = posisinya,
  // jadi satu misi bisa hidup dengan beberapa nomor sekaligus (mis. solo = 5, acara = 2).
  const kunci = `${bahasa}:${m.id}:${m.number}`;
  const sidik = sidikMisi(m);
  const ada = cache.get(kunci);
  // Objek yang sama dipakai ulang selama isinya sama, supaya adegan client tidak dibangun ulang tiap siaran state.
  if (ada && ada.sidik === sidik) return ada.hasil;
  const hasil: MissionPublic = {
    ...m,
    title: t.title,
    productLabel: t.productLabel,
    location: t.location,
    story: t.story,
    instruction: t.instruction,
    interactionLabel: t.interactionLabel,
    learning: t.learning,
    rakiBriefing: t.rakiBriefing,
    steps: m.steps.map((s) => langkah(s, t.steps[s.id])),
    policyCards: m.policyCards?.map((c) => dokumen(c, t.policyCards?.[c.id])),
    tables: m.tables?.map((d) => dokumen(d, t.tables?.[d.id])),
    checklist: m.checklist && t.checklist && t.checklist.length === m.checklist.length ? t.checklist : m.checklist,
  };
  cache.set(kunci, { sidik, hasil });
  return hasil;
}

function labelDari(step: StepDef | undefined, id: string): string {
  if (!step) return id;
  const semua: OptionDef[] = step.kind === 'single' || step.kind === 'multi' ? step.options
    : step.kind === 'assign' ? [...step.items, ...step.buckets]
    : step.kind === 'order' ? step.items : [];
  return semua.find((o) => o.id === id)?.label ?? id;
}

/** Teks jawaban benar dari bentuk mesinnya (id), memakai label misi yang SUDAH diterjemahkan. */
function teksBenar(step: StepDef | undefined, r: StepReveal): string[] {
  const c = r.correct;
  if (!c || !step) return r.correctText;
  if (step.kind === 'assign' && c.assign) return Object.entries(c.assign).map(([i, b]) => `${labelDari(step, i)} -> ${labelDari(step, b)}`);
  if (step.kind === 'order' && c.optionIds) return [c.optionIds.map((id) => labelDari(step, id)).join(' -> ')];
  if ((step.kind === 'single' || step.kind === 'multi') && c.optionIds) return c.optionIds.map((id) => labelDari(step, id));
  if (step.kind === 'number' && typeof c.value === 'number') {
    return [step.format === 'rupiah' ? formatRupiah(c.value) : `${c.value}${step.unit ? ' ' + step.unit : ''}`];
  }
  return r.correctText;
}

/**
 * Pembahasan dalam bahasa `bahasa`. `misi` = misi yang sudah diterjemahkan (terjemahkanMisi).
 * Ringkasan & penjelasan diambil dari `reveal.terjemahan` kiriman server; bila tidak ada,
 * teks Indonesia dipakai.
 */
export function terjemahkanReveal(reveal: MissionReveal, misi: MissionPublic | null, bahasa: Bahasa): MissionReveal {
  if (bahasa === 'id') return reveal;
  const t = reveal.terjemahan?.[bahasa];
  return {
    ...reveal,
    summary: t?.summary ?? reveal.summary,
    learning: misi?.learning ?? reveal.learning,
    steps: reveal.steps.map((s) => {
      const step = misi?.steps.find((x) => x.id === s.stepId);
      return { ...s, prompt: step?.prompt ?? s.prompt, correctText: teksBenar(step, s), explanation: t?.steps[s.stepId] ?? s.explanation };
    }),
  };
}
