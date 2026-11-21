import test from 'node:test';
import { awardsOf, CASE_MANIFESTS, rankOf, ROUND_OUTCOMES, score, type RoundOutcome } from '../../../shared/investigator/rubric';

// Investigator rubric snapshot. Update: tsx --test --test-update-snapshots server/src/investigator/rubric.expect.test.ts
function kombinasi<T>(daftar: readonly T[], n: number): T[][] {
  return n === 0 ? [[]] : daftar.flatMap((x) => kombinasi(daftar, n - 1).map((r) => [x, ...r]));
}

test('investigator score table per case', (t) => {
  const tabel: Record<string, Record<string, string>> = {};
  for (const m of CASE_MANIFESTS) {
    const baris: Record<string, string> = {};
    for (const o of kombinasi<RoundOutcome>(ROUND_OUTCOMES, m.rounds.length))
      for (const v of Object.keys(m.verdicts)) for (const p of Object.keys(m.messages)) {
        const s = score(m.caseId, m.rubricVersion, o, v, p);
        baris[`${o.join('+')} | ${v} | ${p}`] = s ? `${s.total} ${s.nilai}` : 'null';
      }
    tabel[m.caseId] = baris;
  }
  t.assert.snapshot(tabel);
});

test('investigator rank and awards around thresholds', (t) => {
  const hasil: Record<string, unknown> = {};
  for (const [stamps, best] of [[0, 0], [1, 100], [2, 200], [3, 254], [3, 255], [3, 300]] as const) hasil[`stamps=${stamps} best=${best}`] = { rank: rankOf(stamps, best), awards: awardsOf(stamps, best) };
  t.assert.snapshot(hasil);
});
