import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TUTORIAL_MISSION } from '../../../shared/missions';
import type { MissionReveal, StepDef } from '../../../shared/types';
import {
  assignItem, chooseSingle, missingParts, missionStarted, objectStates, resolveTap, sanitizeDraft,
  stepComplete, stepStarted, toggleMulti, unassignItem, urutanTampil,
} from './draft';
import { sceneBengkel } from './scenes/m02-bengkel';
import type { StageView } from './types';

const m02 = MISSIONS[1]!;
const m05 = MISSIONS[4]!;
const multi = m02.steps[0] as Extract<StepDef, { kind: 'multi' }>;
const assign = m05.steps[0] as Extract<StepDef, { kind: 'assign' }>;

function view(over: Partial<StageView> = {}): StageView {
  return { mode: 'play', focusStepId: 'bukti', focusItemId: null, answer: {}, reveal: null, reducedMotion: false, ...over };
}

test('multi: ketuk = masuk, ketuk lagi = keluar, batas sesuai requiredSelections', () => {
  let v: unknown = undefined;
  for (const id of ['foto-full', 'foto-kucing', 'foto-identitas']) {
    const c = toggleMulti(multi, v as never, id);
    assert.equal(c.kind, 'added');
    v = (c as { value: unknown }).value;
  }
  assert.deepEqual(v, ['foto-full', 'foto-kucing', 'foto-identitas']);
  const penuh = toggleMulti(multi, v as never, 'foto-makanan');
  assert.equal(penuh.kind, 'full', 'pilihan ke-4 ditolak, tidak diam-diam menambah');
  const lepas = toggleMulti(multi, v as never, 'foto-kucing');
  assert.equal(lepas.kind, 'removed');
  assert.deepEqual((lepas as { value: unknown }).value, ['foto-full', 'foto-identitas']);
  assert.equal(toggleMulti(multi, v as never, 'tidak-ada').kind, 'unchanged');
});

test('single: memilih opsi lain mengganti pilihan; memilih yang sama tidak berubah', () => {
  const s = MISSIONS[0]!.steps[0] as Extract<StepDef, { kind: 'single' }>;
  const a = chooseSingle(s, undefined, 'perbaiki');
  assert.equal(a.kind, 'chosen');
  const b = chooseSingle(s, 'perbaiki', 'dokumentasi');
  assert.deepEqual((b as { value: unknown }).value, 'dokumentasi');
  assert.equal(chooseSingle(s, 'dokumentasi', 'dokumentasi').kind, 'unchanged');
});

test('assign: tempatkan, ganti, dan kosongkan item', () => {
  const a = assignItem(assign, undefined, 'kasus-a', 'lanjut');
  assert.equal(a.kind, 'assigned');
  const v1 = (a as { value: Record<string, string> }).value;
  const b = assignItem(assign, v1, 'kasus-a', 'perlu-data');
  assert.deepEqual((b as { value: unknown }).value, { 'kasus-a': 'perlu-data' });
  const c = unassignItem(assign, (b as unknown as { value: never }).value, 'kasus-a');
  assert.deepEqual((c as { value: unknown }).value, {});
  assert.equal(assignItem(assign, undefined, 'kasus-x', 'lanjut').kind, 'unchanged');
});

test('kelengkapan: sebagian boleh dikirim (dengan konfirmasi), bukan diblokir', () => {
  const partial = { cocok: { 'kasus-a': 'lanjut' } };
  assert.equal(stepStarted(assign, partial.cocok), true);
  assert.equal(stepComplete(assign, partial.cocok), false);
  assert.equal(missionStarted(m05, partial), true);
  assert.deepEqual(missingParts(m05, partial), ['1 bagian belum dipilih']);
  assert.deepEqual(missingParts(m05, { cocok: { 'kasus-a': 'lanjut', 'kasus-b': 'tidak-ambang' } }), []);
  assert.equal(missionStarted(TUTORIAL_MISSION, {}), false);
});

test('sanitizeDraft membuang id asing & memotong kelebihan pilihan dari draft lama', () => {
  const d = sanitizeDraft(m02, { bukti: ['foto-full', 'palsu', 'foto-full', 'foto-kucing', 'foto-selfie', 'foto-makanan'], asing: 'x' });
  assert.deepEqual(d, { bukti: ['foto-full', 'foto-kucing', 'foto-selfie'] });
  assert.deepEqual(sanitizeDraft(m02, 'bukan objek'), {});
});

test('ketukan adegan memakai aturan draft yang sama dengan kontrol HTML', () => {
  const spec = sceneBengkel();
  const r = resolveTap(m02, spec, view(), 'kucing');
  assert.equal(r.kind, 'change');
  assert.deepEqual(r.kind === 'change' && r.change.kind === 'added' ? r.change.value : null, ['foto-kucing']);
  const html = toggleMulti(multi, undefined, 'foto-kucing');
  assert.deepEqual(r.kind === 'change' ? r.change : null, html, 'hasil identik dengan jalur HTML');
});

test('ketukan di luar mode bermain (briefing/jeda/terkirim/pembahasan) diabaikan', () => {
  const spec = sceneBengkel();
  for (const mode of ['intro', 'paused', 'sent', 'locked', 'reveal'] as const) {
    assert.deepEqual(resolveTap(m02, spec, view({ mode }), 'mobil'), { kind: 'ignored', reason: 'mode' }, mode);
  }
  assert.equal(resolveTap(m02, spec, view(), 'tidak-ada').kind, 'ignored');
});

test('tampilan objek NETRAL sebelum pembahasan, walau data reveal sudah ada', () => {
  const spec = sceneBengkel();
  const reveal: MissionReveal = {
    missionId: m02.id, roundIndex: 1, summary: '', learning: '',
    steps: [{ stepId: 'bukti', prompt: '', weight: 1, correctText: [], explanation: '', correct: { optionIds: ['foto-full', 'foto-depan-kiri', 'foto-identitas'] } }],
  };
  const answer = { bukti: ['foto-full', 'foto-kucing'] };
  for (const mode of ['play', 'sent', 'locked', 'paused', 'intro'] as const) {
    const st = objectStates(m02, spec, view({ mode, answer, reveal }));
    assert.ok(Object.values(st).every((s) => s.verdict === null), `tanpa penilaian di mode ${mode}`);
  }
  const rv = objectStates(m02, spec, view({ mode: 'reveal', answer, reveal }));
  assert.equal(rv.mobil!.verdict, 'tepat');
  assert.equal(rv.kucing!.verdict, 'kurang');
  assert.equal(rv.plat!.verdict, 'terlewat');
  assert.equal(rv.selfie!.verdict, null);
});

test('status objek mengikuti draft: urutan pilihan & interaktif hanya saat bermain', () => {
  const spec = sceneBengkel();
  const st = objectStates(m02, spec, view({ answer: { bukti: ['foto-kucing', 'foto-full'] } }));
  assert.equal(st.kucing!.order, 1);
  assert.equal(st.mobil!.order, 2);
  assert.equal(st.plat!.selected, false);
  assert.ok(Object.values(st).every((s) => s.interactive));
  const kirim = objectStates(m02, spec, view({ mode: 'sent', answer: { bukti: ['foto-kucing'] } }));
  assert.ok(Object.values(kirim).every((s) => !s.interactive));
  assert.equal(kirim.kucing!.selected, true, 'pilihan tetap terlihat setelah terkirim');
});

test('urutan tampil diacak deterministik: sama untuk semua pemain, tanpa kehilangan opsi', () => {
  const opsi = MISSIONS[0]!.steps[0]!.kind === 'single' ? (MISSIONS[0]!.steps[0] as Extract<StepDef, { kind: 'single' }>).options : [];
  const a = urutanTampil(opsi, 'm01-parkir:s1');
  const b = urutanTampil(opsi, 'm01-parkir:s1');
  assert.deepEqual(a.map((o) => o.id), b.map((o) => o.id), 'seed sama = urutan sama');
  assert.deepEqual([...a.map((o) => o.id)].sort(), opsi.map((o) => o.id).sort(), 'semua opsi tetap ada');
  // Di seluruh misi, urutan tampil tidak selalu sama dengan urutan data.
  let beda = 0;
  for (const m of MISSIONS) for (const s of m.steps) {
    if (s.kind !== 'single' && s.kind !== 'multi') continue;
    if (urutanTampil(s.options, `${m.id}:${s.id}`).some((o, i) => o.id !== s.options[i]!.id)) beda++;
  }
  assert.ok(beda >= 5, `urutan tampil diacak di sebagian besar langkah (${beda})`);
});
