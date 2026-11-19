import test from 'node:test';
import { misi } from '../../../shared/acara/a01';
import { terjemahkanMisi } from '../../../shared/i18n/misi';
import { gradeMission, scoreRound } from '../../../shared/scoring';
import { berkas } from './a01';

// Event case 1 "Setelah Api Padam": public mission shape + server verdict/score. Record: tsx --test --test-update-snapshots <file>
test('a01 public mission shape (id/en/zh)', (t) => {
  const bentuk = (bahasa: 'id' | 'en' | 'zh') => {
    const m = terjemahkanMisi(misi, bahasa);
    return {
      id: m.id, title: m.title, instruction: m.instruction, durationSeconds: m.durationSeconds,
      steps: m.steps.map((s) => ({ kind: s.kind, requiredSelections: 'requiredSelections' in s ? s.requiredSelections : undefined, options: 'options' in s ? s.options.map((o) => [o.id, o.label]) : undefined })),
    };
  };
  t.assert.snapshot({ id: bentuk('id'), en: bentuk('en'), zh: bentuk('zh') });
});

test('a01 verdict and score', (t) => {
  const jawaban: Record<string, string[] | null> = {
    'benar (foto+lapor)': ['foto', 'lapor'], '1 benar + 1 salah': ['foto', 'buang'], '2 salah': ['buang', 'abaikan'],
    'hanya 1 opsi': ['foto'], '3 opsi': ['foto', 'lapor', 'buang'], 'tanpa jawaban': null,
  };
  const hasil: Record<string, unknown> = {};
  for (const [nama, pilih] of Object.entries(jawaban)) {
    for (const detik of nama === 'tanpa jawaban' ? [misi.durationSeconds] : [5, 40]) {
      const g = gradeMission(berkas.kunci, pilih ? { tindakan: pilih } : null);
      hasil[`${nama} @${detik}s`] = { ketepatan: g.accuracy, ...scoreRound(g.accuracy, detik, misi.durationSeconds) };
    }
  }
  t.assert.snapshot(hasil);
});
