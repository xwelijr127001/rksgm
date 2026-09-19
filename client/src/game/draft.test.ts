import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../../shared/missions';
import type { MissionAnswer, MissionPublic, MissionReveal, StepDef } from '../../../shared/types';
import {
  assignItem, chooseSingle, missingParts, missionStarted, objectStates, resolveTap, sanitizeDraft,
  stepComplete, stepStarted, toggleMulti, unassignItem, urutanTampil,
} from './draft';
import { sceneFor } from './scenes';
import { sceneBengkel } from './scenes/m02-bengkel';
import type { StageView } from './types';
// Hanya di tes: kamus UI, untuk membuktikan teks bawaan draft.ts = kamus `id` dan penerjemah dipakai.
import { aturBahasa, t } from '../i18n';
import kamusMisi from '../i18n/kamus/misi';

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

test('missingParts: teks bawaan = kamus Indonesia; dengan penerjemah mengikuti bahasa aktif', () => {
  const m10 = MISSIONS[9]!;
  // Bertipe eksplisit: tanpa ini TypeScript menggabungkan bentuk tiap `a` (cocok?: undefined, ...) yang bukan MissionAnswer.
  const kasus: { m: MissionPublic; a: MissionAnswer }[] = [
    { m: m05, a: { cocok: { 'kasus-a': 'lanjut' } } },
    { m: m05, a: { cocok: {} } },
    { m: m02, a: { bukti: ['foto-full'] } },
    { m: m10, a: {} },
    { m: TUTORIAL_MISSION, a: {} },
  ];
  assert.ok(m10.steps.length > 1, 'misi berlangkah banyak memakai awalan "Pertanyaan n:"');
  assert.match(missingParts(m10, {})[0]!, /^Pertanyaan 1: /);
  assert.deepEqual(missingParts(m02, { bukti: ['foto-full'] }), [`baru 1 dari ${multi.requiredSelections} pilihan`]);
  for (const { m, a } of kasus) assert.deepEqual(missingParts(m, a, t), missingParts(m, a), `${m.id}: bawaan sama dengan kamus id`);
  try {
    aturBahasa('en');
    assert.deepEqual(missingParts(m05, { cocok: { 'kasus-a': 'lanjut' } }, t), ['1 part not chosen yet']);
    assert.match(missingParts(m10, {}, t)[0]!, /^Question 1: /);
    aturBahasa('zh');
    assert.match(missingParts(m10, {}, t)[0]!, /^第 1 题：/);
  } finally {
    aturBahasa('id');
  }
});

test('keterangan objek info di adegan: kamus misi.info.<misi>.<objek> lengkap, teks id = teks adegan', () => {
  const kunciAdegan: string[] = [];
  for (const m of [TUTORIAL_MISSION, ...MISSIONS, TIEBREAK_MISSION]) {
    const spec = sceneFor(m, 'id');
    for (const o of spec?.objects ?? []) {
      if (o.role !== 'info') continue;
      const asli = o.info ?? o.label;
      const kunci = `info.${m.id}.${o.id}`;
      kunciAdegan.push(kunci);
      // Ketukan objek info mengembalikan teks adegan (Indonesia); MissionPlay menggantinya lewat kamus.
      assert.deepEqual(resolveTap(m, spec!, view({ focusStepId: null }), o.id), { kind: 'info', objectId: o.id, text: asli });
      assert.equal(kamusMisi.id[kunci], asli, `misi.${kunci}: teks id berbeda dari berkas adegan`);
      for (const b of ['en', 'zh'] as const) {
        assert.ok(kamusMisi[b][kunci]?.trim(), `misi.${kunci} (${b}) belum diterjemahkan`);
        assert.notEqual(kamusMisi[b][kunci], asli, `misi.${kunci} (${b}) masih teks Indonesia`);
      }
    }
  }
  assert.ok(kunciAdegan.length > 0, 'ada adegan yang punya objek info');
  // Tidak ada kunci info yatim (objeknya sudah dihapus dari adegan).
  assert.deepEqual(Object.keys(kamusMisi.id).filter((k) => k.startsWith('info.')).sort(), [...kunciAdegan].sort());
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
