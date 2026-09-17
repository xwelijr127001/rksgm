/**
 * Menjaga agar objek yang diturunkan client SAMA dengan data yang dipakai
 * generator scene Unity. Kalau tes ini merah, ketukan di canvas tidak akan
 * mengisi draft jawaban.
 *
 * Jalankan dari root repo:
 *   npx tsx --test client/src/unity/missionObjects.test.ts
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { MISSIONS } from '../../../shared/missions';
import type { MissionAnswer } from '../../../shared/types';
import { objectsForMission, selectionsFromAnswer } from './missionObjects';

interface GenObject {
  anchor: string;
  kind: string;
  multi: boolean;
}

interface GenMission {
  id: string;
  steps: { objects: GenObject[] }[];
}

const BERKAS = new URL('../../../unity/Assets/Editor/Generated/raksa-missions.json', import.meta.url);
const data = JSON.parse(readFileSync(BERKAS, 'utf8')) as { missions: GenMission[] };

test('anchor 10 misi identik dengan raksa-missions.json', () => {
  assert.equal(MISSIONS.length, 10, 'jumlah misi berubah; jalankan npm run gen:unity');
  let total = 0;

  for (const mission of MISSIONS) {
    const gen = data.missions.find((m) => m.id === mission.id);
    assert.ok(gen, `misi ${mission.id} tidak ada di raksa-missions.json`);

    const cap = (o: GenObject): string => `${o.anchor}|${o.kind}|${o.multi}`;
    const harapan = gen.steps.flatMap((s) => s.objects.map(cap));
    const nyata = objectsForMission(mission).map((o) =>
      cap({ anchor: o.anchor ?? '', kind: o.kind, multi: o.multi }),
    );

    // m09 memang tanpa objek (semua langkahnya angka), jadi yang dijaga total.
    assert.deepEqual(nyata, harapan, `objek misi ${mission.id} menyimpang dari data Unity`);
    total += nyata.length;
  }

  assert.equal(total, 48, 'jumlah objek dapat diketuk berubah; jalankan npm run gen:unity');
});

test('selectionsFromAnswer mengikuti bentuk jawaban tiap langkah', () => {
  for (const mission of MISSIONS) {
    const answer: MissionAnswer = {};
    for (const step of mission.steps) {
      if (step.kind === 'single') answer[step.id] = step.options[0].id;
      else if (step.kind === 'multi') answer[step.id] = [step.options[0].id];
      else if (step.kind === 'assign') answer[step.id] = { [step.items[0].id]: step.buckets[0].id };
      else if (step.kind === 'number') answer[step.id] = 1500;
      else answer[step.id] = step.items.map((i) => i.id);
    }

    const selections = selectionsFromAnswer(mission, answer);
    assert.equal(selections.length, mission.steps.length, `jumlah selection misi ${mission.id}`);

    mission.steps.forEach((step, i) => {
      const sel = selections[i];
      assert.equal(sel.stepId, step.id);
      if (step.kind === 'number') {
        assert.equal(sel.angka, 1500);
        assert.deepEqual(sel.optionIds, []);
      } else if (step.kind === 'assign') {
        assert.deepEqual(sel.optionIds, [step.items[0].id]);
        assert.equal(sel.assign?.[step.items[0].id], step.buckets[0].id);
      } else {
        assert.ok(sel.optionIds.length > 0, `${mission.id}/${step.id} kehilangan pilihan`);
      }
    });
  }
});

test('langkah kosong tetap dikirim supaya penanda lama terhapus', () => {
  const mission = MISSIONS[0];
  const selections = selectionsFromAnswer(mission, {});
  assert.equal(selections.length, mission.steps.length);
  for (const sel of selections) assert.deepEqual(sel.optionIds, []);
});
