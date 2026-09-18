/**
 * Logika draft jawaban - MURNI (tanpa React/Phaser) dan teruji.
 *
 * Ketukan di adegan dan kontrol HTML memanggil fungsi yang SAMA, jadi keduanya
 * selalu mengubah draft yang sama dengan aturan yang sama (batas pilihan, dll).
 * Tidak ada satu pun fungsi di sini yang tahu kunci jawaban.
 */

import type { MissionAnswer, MissionPublic, StepAnswer, StepDef } from '@shared/types';
import type { ObjectState, SceneObjectSpec, SceneSpec, StageView } from './types';

// ------------------------------------------------------------------ pembaca nilai

export function asList(v: StepAnswer | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function asRecord(v: StepAnswer | undefined): Record<string, string> {
  if (v === null || v === undefined || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) if (typeof val === 'string' && val) out[k] = val;
  return out;
}

export function asNumber(v: StepAnswer | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function asText(v: StepAnswer | undefined): string {
  return typeof v === 'string' ? v : '';
}

// ------------------------------------------------------------------ urutan tampil

/**
 * Urutan TAMPIL yang diacak secara deterministik (sama untuk semua pemain & setiap
 * refresh), supaya pola "jawaban benar selalu pilihan pertama" dari urutan data
 * tidak bisa ditebak. Hanya tampilan: id & materi tidak berubah.
 */
export function urutanTampil<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const acak = (): number => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(acak() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// ------------------------------------------------------------------ perubahan

export type Change =
  | { kind: 'added'; stepId: string; value: StepAnswer; refId: string; count: number; max: number }
  | { kind: 'removed'; stepId: string; value: StepAnswer; refId: string; count: number; max: number }
  | { kind: 'full'; stepId: string; max: number }
  | { kind: 'chosen'; stepId: string; value: StepAnswer; refId: string }
  | { kind: 'assigned'; stepId: string; value: StepAnswer; itemId: string; bucketId: string }
  | { kind: 'unassigned'; stepId: string; value: StepAnswer; itemId: string }
  | { kind: 'unchanged' };

/** Multi-select: ketuk sekali = masuk, ketuk lagi = keluar. Batas = requiredSelections. */
export function toggleMulti(step: Extract<StepDef, { kind: 'multi' }>, current: StepAnswer | undefined, optionId: string): Change {
  if (!step.options.some((o) => o.id === optionId)) return { kind: 'unchanged' };
  const list = asList(current).filter((id) => step.options.some((o) => o.id === id));
  const max = Math.max(1, step.requiredSelections);
  if (list.includes(optionId)) {
    const value = list.filter((id) => id !== optionId);
    return { kind: 'removed', stepId: step.id, value, refId: optionId, count: value.length, max };
  }
  if (list.length >= max) return { kind: 'full', stepId: step.id, max };
  const value = [...list, optionId];
  return { kind: 'added', stepId: step.id, value, refId: optionId, count: value.length, max };
}

/** Single: memilih opsi lain langsung mengganti pilihan (bisa diubah sampai kirim). */
export function chooseSingle(step: Extract<StepDef, { kind: 'single' }>, current: StepAnswer | undefined, optionId: string): Change {
  if (!step.options.some((o) => o.id === optionId)) return { kind: 'unchanged' };
  if (asText(current) === optionId) return { kind: 'unchanged' };
  return { kind: 'chosen', stepId: step.id, value: optionId, refId: optionId };
}

export function assignItem(
  step: Extract<StepDef, { kind: 'assign' }>,
  current: StepAnswer | undefined,
  itemId: string,
  bucketId: string,
): Change {
  if (!step.items.some((i) => i.id === itemId) || !step.buckets.some((b) => b.id === bucketId)) return { kind: 'unchanged' };
  const peta = asRecord(current);
  if (peta[itemId] === bucketId) return { kind: 'unchanged' };
  const value = { ...peta, [itemId]: bucketId };
  return { kind: 'assigned', stepId: step.id, value, itemId, bucketId };
}

export function unassignItem(step: Extract<StepDef, { kind: 'assign' }>, current: StepAnswer | undefined, itemId: string): Change {
  const peta = asRecord(current);
  if (!(itemId in peta)) return { kind: 'unchanged' };
  const value = { ...peta };
  delete value[itemId];
  return { kind: 'unassigned', stepId: step.id, value, itemId };
}

// ------------------------------------------------------------------ kelengkapan

/** Ada isi (boleh sebagian) - cukup untuk dikirim. */
export function stepStarted(step: StepDef, v: StepAnswer | undefined): boolean {
  if (step.kind === 'single') return asText(v).length > 0;
  if (step.kind === 'multi' || step.kind === 'order') return asList(v).length > 0;
  if (step.kind === 'assign') return Object.keys(asRecord(v)).length > 0;
  return asNumber(v) !== null;
}

/** Semua bagian langkah sudah terisi. */
export function stepComplete(step: StepDef, v: StepAnswer | undefined): boolean {
  if (step.kind === 'single') return asText(v).length > 0;
  if (step.kind === 'multi') return asList(v).length >= Math.max(1, step.requiredSelections);
  if (step.kind === 'assign') {
    const peta = asRecord(v);
    return step.items.every((i) => typeof peta[i.id] === 'string');
  }
  if (step.kind === 'order') return asList(v).length === step.items.length;
  return asNumber(v) !== null;
}

export function missionStarted(mission: MissionPublic, answer: MissionAnswer): boolean {
  return mission.steps.some((s) => stepStarted(s, answer[s.id]));
}

/** Daftar bagian yang belum lengkap, dalam bahasa sehari-hari (untuk konfirmasi kirim). */
export function missingParts(mission: MissionPublic, answer: MissionAnswer): string[] {
  const out: string[] = [];
  mission.steps.forEach((s, i) => {
    const v = answer[s.id];
    if (stepComplete(s, v)) return;
    const nomor = mission.steps.length > 1 ? `Pertanyaan ${i + 1}: ` : '';
    if (s.kind === 'multi') {
      const n = asList(v).length;
      out.push(`${nomor}baru ${n} dari ${s.requiredSelections} pilihan`);
    } else if (s.kind === 'assign') {
      const peta = asRecord(v);
      const belum = s.items.filter((it) => !peta[it.id]).length;
      out.push(`${nomor}${belum} ${belum === 1 ? 'bagian' : 'bagian'} belum dipilih`);
    } else {
      out.push(`${nomor}belum diisi`);
    }
  });
  return out;
}

/** Hapus id yang tidak dikenal misi (mis. draft lama dari sessionStorage). */
export function sanitizeDraft(mission: MissionPublic, raw: unknown): MissionAnswer {
  const out: MissionAnswer = {};
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Record<string, unknown>;
  for (const step of mission.steps) {
    const v = src[step.id];
    if (step.kind === 'single' && typeof v === 'string' && step.options.some((o) => o.id === v)) out[step.id] = v;
    if (step.kind === 'multi' && Array.isArray(v)) {
      const list = [...new Set(v.filter((x): x is string => typeof x === 'string' && step.options.some((o) => o.id === x)))];
      out[step.id] = list.slice(0, Math.max(1, step.requiredSelections));
    }
    if (step.kind === 'assign' && v && typeof v === 'object' && !Array.isArray(v)) {
      const peta: Record<string, string> = {};
      for (const [k, b] of Object.entries(v as Record<string, unknown>)) {
        if (typeof b === 'string' && step.items.some((i) => i.id === k) && step.buckets.some((x) => x.id === b)) peta[k] = b;
      }
      out[step.id] = peta;
    }
    if (step.kind === 'number' && typeof v === 'number' && Number.isFinite(v)) out[step.id] = v;
    if (step.kind === 'order' && Array.isArray(v)) out[step.id] = v.filter((x): x is string => typeof x === 'string' && step.items.some((i) => i.id === x));
  }
  return out;
}

// ------------------------------------------------------------------ ketukan adegan

export type TapResult =
  | { kind: 'change'; change: Change }
  | { kind: 'focusItem'; stepId: string; itemId: string }
  | { kind: 'needItem'; stepId: string }
  | { kind: 'openDoc'; docId: string }
  | { kind: 'info'; objectId: string; text: string }
  | { kind: 'ignored'; reason: 'mode' | 'unknown' | 'other-step' };

/**
 * Terjemahkan ketukan objek menjadi perubahan draft. Dipakai untuk ketukan
 * adegan; kontrol HTML memanggil toggleMulti/chooseSingle/assignItem langsung.
 */
export function resolveTap(mission: MissionPublic, spec: SceneSpec, view: StageView, objectId: string): TapResult {
  const obj = spec.objects.find((o) => o.id === objectId);
  if (!obj) return { kind: 'ignored', reason: 'unknown' };
  // Dokumen & keterangan boleh dibuka kapan saja (juga saat briefing/pembahasan).
  if (obj.role === 'doc') return { kind: 'openDoc', docId: obj.refId };
  if (obj.role === 'info') return { kind: 'info', objectId: obj.id, text: obj.info ?? obj.label };
  if (view.mode !== 'play') return { kind: 'ignored', reason: 'mode' };
  const step = stepFor(mission, obj, view.focusStepId);
  if (!step) return { kind: 'ignored', reason: 'unknown' };
  if (view.focusStepId && view.focusStepId !== step.id) return { kind: 'ignored', reason: 'other-step' };
  const current = view.answer[step.id];

  if (obj.role === 'option') {
    if (step.kind === 'multi') return { kind: 'change', change: toggleMulti(step, current, obj.refId) };
    if (step.kind === 'single') return { kind: 'change', change: chooseSingle(step, current, obj.refId) };
    return { kind: 'ignored', reason: 'unknown' };
  }
  if (step.kind !== 'assign') return { kind: 'ignored', reason: 'unknown' };
  if (obj.role === 'item') return { kind: 'focusItem', stepId: step.id, itemId: obj.refId };
  if (obj.role === 'bucket') {
    const itemId = view.focusItemId;
    if (!itemId || !step.items.some((i) => i.id === itemId)) return { kind: 'needItem', stepId: step.id };
    return { kind: 'change', change: assignItem(step, current, itemId, obj.refId) };
  }
  return { kind: 'ignored', reason: 'unknown' };
}

// ------------------------------------------------------------------ status objek

/** Id langkah yang diikuti objek (satu atau beberapa). */
export function stepIdsOf(obj: SceneObjectSpec): string[] {
  if (obj.stepIds?.length) return obj.stepIds;
  return obj.stepId ? [obj.stepId] : [];
}

/** Langkah yang sedang "diwakili" objek: langkah fokus bila termasuk, selain itu langkah pertamanya. */
export function stepFor(mission: MissionPublic, obj: SceneObjectSpec, focusStepId: string | null): StepDef | undefined {
  const ids = stepIdsOf(obj);
  const id = focusStepId && ids.includes(focusStepId) ? focusStepId : ids[0];
  return id ? mission.steps.find((s) => s.id === id) : undefined;
}

/** Status tampilan tiap objek, sepenuhnya dari StageView (engine tinggal menggambar). */
export function objectStates(mission: MissionPublic, spec: SceneSpec, view: StageView): Record<string, ObjectState> {
  const out: Record<string, ObjectState> = {};
  for (const obj of spec.objects) {
    const ids = stepIdsOf(obj);
    const step = stepFor(mission, obj, view.focusStepId);
    const langkahIni = !view.focusStepId || ids.length === 0 || ids.includes(view.focusStepId);
    const st: ObjectState = {
      interactive: false,
      selected: false,
      order: null,
      tags: [],
      focus: false,
      dim: !langkahIni && view.mode === 'play',
      verdict: null,
    };
    if (obj.role === 'doc' || obj.role === 'info') {
      st.interactive = view.mode !== 'paused';
      st.dim = false;
      out[obj.id] = st;
      continue;
    }
    if (!step) {
      out[obj.id] = st;
      continue;
    }
    const v = view.answer[step.id];
    st.interactive = view.mode === 'play' && langkahIni;

    if (obj.role === 'option' && step.kind === 'multi') {
      const list = asList(v);
      const i = list.indexOf(obj.refId);
      st.selected = i >= 0;
      st.order = i >= 0 ? i + 1 : null;
    } else if (obj.role === 'option' && step.kind === 'single') {
      st.selected = asText(v) === obj.refId;
    } else if (obj.role === 'item' && step.kind === 'assign') {
      // Stiker dari setiap langkah yang diikuti objek, urut sesuai langkah misi.
      for (const s of mission.steps) {
        if (s.kind !== 'assign' || !ids.includes(s.id)) continue;
        const bucketId = asRecord(view.answer[s.id])[obj.refId];
        const bucket = bucketId ? s.buckets.find((b) => b.id === bucketId) : undefined;
        if (bucket) st.tags.push({ stepId: s.id, refId: bucket.id, label: bucket.label, icon: bucket.icon });
      }
      st.selected = Boolean(asRecord(v)[obj.refId]);
      st.focus = view.mode === 'play' && langkahIni && view.focusItemId === obj.refId;
    } else if (obj.role === 'bucket' && step.kind === 'assign') {
      st.selected = view.focusItemId !== null && asRecord(v)[view.focusItemId] === obj.refId;
    }

    // Penilaian HANYA saat REVEAL dan hanya dari data reveal server.
    if (view.mode === 'reveal' && view.reveal) {
      if (obj.role === 'option') {
        const rv = view.reveal.steps.find((s) => s.stepId === step.id)?.correct;
        if (rv?.optionIds) {
          const benar = rv.optionIds.includes(obj.refId);
          st.verdict = st.selected ? (benar ? 'tepat' : 'kurang') : benar ? 'terlewat' : null;
        }
      } else if (obj.role === 'item') {
        // Item di beberapa langkah: kurang bila ada yang keliru, terlewat bila ada yang kosong.
        let ada = false;
        let salah = false;
        let kosong = false;
        for (const id of ids) {
          const benar = view.reveal.steps.find((s) => s.stepId === id)?.correct?.assign?.[obj.refId];
          if (!benar) continue;
          ada = true;
          const pilihan = asRecord(view.answer[id])[obj.refId];
          if (!pilihan) kosong = true;
          else if (pilihan !== benar) salah = true;
        }
        if (ada) st.verdict = salah ? 'kurang' : kosong ? 'terlewat' : 'tepat';
      }
    }
    out[obj.id] = st;
  }
  return out;
}

/** Objek adegan yang mewakili opsi/item tertentu (untuk menyorot dari kontrol HTML). */
export function objectFor(spec: SceneSpec, stepId: string, refId: string): SceneObjectSpec | undefined {
  return spec.objects.find((o) => stepIdsOf(o).includes(stepId) && o.refId === refId && (o.role === 'option' || o.role === 'item'));
}
