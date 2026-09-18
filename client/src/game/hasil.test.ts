import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TIEBREAK_MISSION } from '../../../shared/missions';
import { gradeMission } from '../../../shared/scoring';
import type { MissionAnswer, StepAnswer, StepDef } from '../../../shared/types';
// Hanya di tes: kunci asli server untuk membuktikan penilaian tampilan = penilaian resmi.
import { buildReveal, keyForMissionId } from '../../../server/src/answerKeys';
import { JUDUL_HASIL, nilaiLangkah, nilaiMisi, statusMisi } from './hasil';

const semua = [...MISSIONS, TIEBREAK_MISSION];

/** Beberapa jawaban per langkah: benar, salah, sebagian, dan kosong. */
function variasi(step: StepDef, benar: StepAnswer | undefined): (StepAnswer | undefined)[] {
  if (step.kind === 'single') return [benar, step.options.find((o) => o.id !== benar)?.id, undefined];
  if (step.kind === 'multi') {
    const b = (benar as string[]) ?? [];
    const salah = step.options.filter((o) => !b.includes(o.id)).map((o) => o.id);
    return [b, b.slice(0, 1), [...b.slice(0, 1), ...salah.slice(0, 1)], salah.slice(0, step.requiredSelections), []];
  }
  if (step.kind === 'assign') {
    const b = (benar as Record<string, string>) ?? {};
    const lain = (id: string) => step.buckets.find((x) => x.id !== b[id])!.id;
    const ids = Object.keys(b);
    return [b, { [ids[0]!]: b[ids[0]!]! }, Object.fromEntries(ids.map((id) => [id, lain(id)])), {}];
  }
  if (step.kind === 'number') return [benar, (benar as number) + 1, undefined];
  return [undefined];
}

test('penilaian per langkah di pembahasan sama persis dengan penilaian server (semua misi)', () => {
  for (const m of semua) {
    const key = keyForMissionId(m.id);
    assert.ok(key, `kunci ${m.id}`);
    const reveal = buildReveal(m, key);
    for (const sk of key.steps) {
      const step = m.steps.find((s) => s.id === sk.stepId)!;
      const r = reveal.steps.find((x) => x.stepId === sk.stepId)!;
      const benar = sk.single ?? sk.multi ?? sk.assign ?? sk.number?.value;
      for (const v of variasi(step, benar as StepAnswer)) {
        const h = nilaiLangkah(step, r, v);
        const resmi: number = gradeMission({ ...key, steps: [sk] }, { [sk.stepId]: v } as MissionAnswer).accuracy;
        assert.equal(h.akurasi, resmi, `${m.id}/${sk.stepId} ${JSON.stringify(v)}`);
        const harap = v === undefined || (Array.isArray(v) && !v.length) || (typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length) ? 'kosong'
          : resmi >= 1 ? 'tepat' : resmi > 0 ? 'sebagian' : 'belum';
        assert.equal(h.status, harap, `${m.id}/${sk.stepId} status ${JSON.stringify(v)}`);
      }
    }
  }
});

test('jawaban salah menampilkan Pilihanmu (salah) dan Langkah yang tepat (terlewat)', () => {
  const m01 = MISSIONS[0]!;
  const reveal = buildReveal(m01, keyForMissionId(m01.id)!);
  const [h] = nilaiMisi(m01.steps, reveal, { s1: 'buang' });
  assert.equal(h!.status, 'belum');
  assert.deepEqual(h!.pilihan, [{ teks: 'Membuang bagian yang rusak', tanda: 'salah' }]);
  assert.equal(h!.tepat.length, 1);
  assert.equal(h!.tepat[0]!.tanda, 'terlewat');
  assert.match(h!.tepat[0]!.teks, /Dokumentasikan/);
});

test('multi: bukti yang tidak dipilih ditandai terlewat, pilihan pengecoh ditandai salah', () => {
  const m02 = MISSIONS[1]!;
  const key = keyForMissionId(m02.id)!;
  const reveal = buildReveal(m02, key);
  const benar = key.steps[0]!.multi!;
  const pengecoh = (m02.steps[0] as Extract<StepDef, { kind: 'multi' }>).options.find((o) => !benar.includes(o.id))!.id;
  const [h] = nilaiMisi(m02.steps, reveal, { [key.steps[0]!.stepId]: [benar[0]!, pengecoh] });
  assert.equal(h!.status, 'belum', '1 benar - 1 salah = 0 (sama dengan server)');
  assert.deepEqual(h!.pilihan.map((p) => p.tanda), ['tepat', 'salah']);
  assert.deepEqual(h!.tepat.map((p) => p.tanda), ['dipilih', ...benar.slice(1).map(() => 'terlewat')]);
});

test('status misi & kalimat utama: tidak ada lagi "Makin paham" untuk 0%', () => {
  assert.equal(statusMisi(1, true), 'tepat');
  assert.equal(statusMisi(0.5, true), 'sebagian');
  assert.equal(statusMisi(0, true), 'belum');
  assert.equal(statusMisi(0, false), 'terlewat');
  assert.match(JUDUL_HASIL.belum.judul + ' ' + JUDUL_HASIL.belum.sub, /Belum tepat\. Yuk, lihat langkah yang benar\./);
});
