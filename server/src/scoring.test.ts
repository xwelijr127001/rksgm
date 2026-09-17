import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeBadges,
  gradeMission,
  gradeStep,
  hasPodiumTie,
  rankPlayers,
  scoreRound,
  type StepKey,
} from '../../shared/scoring';
import { MISSIONS } from '../../shared/missions';
import { MISSION_KEYS, assertKeysComplete, buildReveal, keyForRound } from './answerKeys';
import type { MissionAnswer, PlayerLook, RoundResult } from '../../shared/types';

const look: PlayerLook = { body: 0, skin: 0, hair: 0, accessory: 'none', color: 0 };

test('kunci jawaban konsisten dengan definisi misi', () => {
  assert.doesNotThrow(() => assertKeysComplete());
  assert.equal(MISSION_KEYS.length, MISSIONS.length);
  MISSIONS.forEach((m, i) => assert.equal(MISSION_KEYS[i].missionId, m.id));
});

test('scoreRound: jawaban benar instan vs mepet vs salah', () => {
  assert.deepEqual(scoreRound(1, 0, 20), { basePoints: 1000, speedBonus: 300, roundScore: 1300 });
  assert.deepEqual(scoreRound(1, 20, 20), { basePoints: 1000, speedBonus: 0, roundScore: 1000 });
  assert.deepEqual(scoreRound(1, 10, 20), { basePoints: 1000, speedBonus: 150, roundScore: 1150 });
  assert.deepEqual(scoreRound(0, 1, 20), { basePoints: 0, speedBonus: 0, roundScore: 0 });
  // Jawaban sebagian benar: bonus kecepatan ikut mengecil.
  assert.deepEqual(scoreRound(0.5, 10, 20), { basePoints: 500, speedBonus: 75, roundScore: 575 });
  // Lewat batas waktu tidak pernah memberi bonus negatif.
  assert.equal(scoreRound(1, 99, 20).speedBonus, 0);
});

test('multi-select: memilih semua opsi tidak menghasilkan skor penuh', () => {
  const key: StepKey = {
    stepId: 'bukti',
    weight: 1,
    multi: ['a', 'b', 'c'],
    requiredSelections: 3,
    explanation: '-',
  };
  assert.equal(gradeStep(key, ['a', 'b', 'c']), 1);
  // 3 benar + 3 distraktor -> (3-3)/3 = 0
  assert.equal(gradeStep(key, ['a', 'b', 'c', 'x', 'y', 'z']), 0);
  // 2 benar, 0 salah -> 2/3
  assert.equal(Math.round(gradeStep(key, ['a', 'b']) * 100), 67);
  // 2 benar, 1 salah -> 1/3
  assert.equal(Math.round(gradeStep(key, ['a', 'b', 'x']) * 100), 33);
  assert.equal(gradeStep(key, []), 0);
  assert.equal(gradeStep(key, undefined), 0);
  assert.equal(gradeStep(key, 'a'), 0, 'bentuk jawaban salah = 0');
});

test('misi 2: memilih 6 kartu tidak lebih untung daripada memilih 3 yang benar', () => {
  const key = keyForRound(1)!;
  const semua = gradeMission(key, { bukti: MISSIONS[1].steps[0].kind === 'multi' ? (MISSIONS[1].steps[0] as { options: { id: string }[] }).options.map((o) => o.id) : [] });
  const tepat = gradeMission(key, { bukti: ['foto-full', 'foto-depan-kiri', 'foto-identitas'] });
  assert.equal(tepat.accuracy, 1);
  assert.equal(semua.accuracy, 0);
});

test('assign: sebagian benar dinilai proporsional', () => {
  const key: StepKey = {
    stepId: 'k',
    weight: 1,
    assign: { p: 'terkait', q: 'sebelumnya', r: 'teknis' },
    explanation: '-',
  };
  assert.equal(gradeStep(key, { p: 'terkait', q: 'sebelumnya', r: 'teknis' }), 1);
  assert.equal(Math.round(gradeStep(key, { p: 'terkait', q: 'sebelumnya', r: 'terkait' }) * 100), 67);
  assert.equal(gradeStep(key, { p: 'teknis', q: 'terkait', r: 'sebelumnya' }), 0);
  assert.equal(gradeStep(key, {}), 0, 'langkah kosong tidak dapat nilai');
});

test('number: toleransi & jawaban kosong', () => {
  const key: StepKey = { stepId: 'n', weight: 1, number: { value: 10_000_000 }, explanation: '-' };
  assert.equal(gradeStep(key, 10_000_000), 1);
  assert.equal(gradeStep(key, 9_999_999), 0);
  assert.equal(gradeStep(key, null), 0);
});

test('rubric berbobot: misi 9 (bobot 1,1,2)', () => {
  const key = keyForRound(8)!;
  assert.equal(gradeMission(key, { persen: 10_000_000, risiko: 10_000_000, hasil: 90_000_000 }).accuracy, 1);
  // Hanya hasil akhir benar -> 2/4
  assert.equal(gradeMission(key, { hasil: 90_000_000 }).accuracy, 0.5);
  // Dua langkah awal benar, hasil salah -> 2/4
  assert.equal(gradeMission(key, { persen: 10_000_000, risiko: 10_000_000, hasil: 95_000_000 }).accuracy, 0.5);
  // Timeout / tidak menjawab
  assert.equal(gradeMission(key, null).accuracy, 0);
  assert.equal(gradeMission(key, {}).accuracy, 0);
});

test('setiap misi punya jawaban sempurna yang menghasilkan ketepatan 1', () => {
  for (let i = 0; i < MISSIONS.length; i++) {
    const key = keyForRound(i)!;
    const answer: MissionAnswer = {};
    for (const sk of key.steps) {
      if (sk.single) answer[sk.stepId] = sk.single;
      else if (sk.multi) answer[sk.stepId] = [...sk.multi];
      else if (sk.assign) answer[sk.stepId] = { ...sk.assign };
      else if (sk.number) answer[sk.stepId] = sk.number.value;
      else if (sk.order) answer[sk.stepId] = [...sk.order];
    }
    assert.equal(gradeMission(key, answer).accuracy, 1, `misi ${i + 1} (${MISSIONS[i].title})`);
  }
});

test('urutan peringkat: poin -> ketepatan -> waktu, seri ditandai', () => {
  const rows = [
    { playerId: 'a', nickname: 'Ani', look, totalPoints: 1000, totalAccuracy: 5, totalTimeMs: 9000, answeredCount: 5 },
    { playerId: 'b', nickname: 'Budi', look, totalPoints: 1000, totalAccuracy: 6, totalTimeMs: 12000, answeredCount: 5 },
    { playerId: 'c', nickname: 'Cici', look, totalPoints: 1000, totalAccuracy: 5, totalTimeMs: 8000, answeredCount: 5 },
    { playerId: 'd', nickname: 'Dedi', look, totalPoints: 900, totalAccuracy: 9, totalTimeMs: 100, answeredCount: 5 },
  ];
  const board = rankPlayers(rows);
  assert.deepEqual(board.map((r) => r.playerId), ['b', 'c', 'a', 'd']);
  assert.deepEqual(board.map((r) => r.rank), [1, 2, 3, 4]);
  assert.equal(board.every((r) => !r.tied), true);

  const seri = rankPlayers([
    { playerId: 'x', nickname: 'X', look, totalPoints: 500, totalAccuracy: 2, totalTimeMs: 1000, answeredCount: 2 },
    { playerId: 'y', nickname: 'Y', look, totalPoints: 500, totalAccuracy: 2, totalTimeMs: 1000, answeredCount: 2 },
  ]);
  assert.deepEqual(seri.map((r) => r.rank), [1, 1]);
  assert.equal(seri.every((r) => r.tied), true);
  assert.equal(hasPodiumTie(seri), true);
});

test('delta peringkat dihitung dari ronde sebelumnya', () => {
  const prev = new Map([['a', 2], ['b', 1]]);
  const board = rankPlayers(
    [
      { playerId: 'a', nickname: 'A', look, totalPoints: 900, totalAccuracy: 1, totalTimeMs: 1, answeredCount: 1 },
      { playerId: 'b', nickname: 'B', look, totalPoints: 100, totalAccuracy: 1, totalTimeMs: 1, answeredCount: 1 },
    ],
    prev,
  );
  assert.equal(board.find((r) => r.playerId === 'a')!.delta, 1);
  assert.equal(board.find((r) => r.playerId === 'b')!.delta, -1);
});

test('lencana: tuntas, tepat sasaran, juara', () => {
  const rounds: RoundResult[] = MISSIONS.map((m, i) => ({
    roundIndex: i,
    answered: true,
    accuracy: 1,
    basePoints: 1000,
    speedBonus: 300,
    roundScore: 1300,
    elapsedMs: m.durationSeconds * 100, // 10% durasi
  }));
  const ids = computeBadges(rounds, 1, MISSIONS).map((b) => b.id);
  assert.ok(ids.includes('juara'));
  assert.ok(ids.includes('lengkap'));
  assert.ok(ids.includes('tepat-sasaran'));
  assert.ok(ids.includes('kilat'));
  assert.ok(ids.includes('teliti'));

  const kosong = computeBadges(
    rounds.map((r) => ({ ...r, answered: false, accuracy: 0, roundScore: 0 })),
    7,
    MISSIONS,
  );
  assert.deepEqual(kosong, []);
});

test('buildReveal menghasilkan teks jawaban, bukan id', () => {
  const reveal = buildReveal(MISSIONS[4], keyForRound(4)!);
  assert.equal(reveal.steps.length, 1);
  const text = reveal.steps[0].correctText.join(' | ');
  assert.match(text, /Kasus A/);
  assert.match(text, /penilaian kerusakan benturan/);
  assert.ok(reveal.summary.length > 10);
  assert.ok(reveal.learning.length > 10);
});
