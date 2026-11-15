import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  StoryConsequenceView,
  StoryDecisionSummary,
  StoryFinalSummary,
  StoryPrivateState,
  StoryPublicState,
  StorySceneLine,
  StorySummaryLabels,
} from '../../../shared/story/protocol';
import { personalizePrivateState, personalizePublicState, personalizeSummary, signedNumber, summaryNamesOf } from './view';

// Synthetic texts (a delayed parcel). Every scenario text carries {nama}; ids, asset ids and names of people do not.
const N = '{nama}';
const NAME = 'Dewi.Q';
const tokens = (v: unknown) => JSON.stringify(v).split(N).length - 1;
const count = (v: unknown, s: string) => JSON.stringify(v).split(s).length - 1;

const sceneLine = (id: string, pos: number, speaker: StorySceneLine['speaker'], name: string | null): StorySceneLine => ({
  id,
  speaker,
  name,
  pos,
  text: `Baris ${id} untuk ${N}.`,
});

function publicState(): StoryPublicState {
  return {
    code: 'K7M2QX',
    scenario: {
      scenarioId: 'sc_paket',
      title: `Paket ${N}`,
      versionNo: 2,
      categoryName: 'Kargo',
      contentKind: 'demo',
      customerCharacterId: null,
      officerCharacterId: 'builtin:char:miss-raksa',
      customerName: 'Pak Joko',
      officerName: `Mentor ${N}`,
      neutralExpression: '',
      moodLabels: { sangat_kecewa: 'Marah', kecewa: 'Kesal', ragu: 'Biasa', tenang: `Lega ${N}`, senang: 'Senang' },
      bgmAssetId: null,
    },
    phase: 'scene',
    roundNumber: 1,
    totalRounds: 15,
    serverNow: 1_000,
    phaseEndsAt: 21_000,
    phaseDurationMs: 20_000,
    sceneStartedAt: 1_000,
    readingMs: 20_000,
    answerWindowMs: 30_000,
    autoAdvance: true,
    scene: {
      roundId: 'r01',
      roundNumber: 1,
      title: `Kiriman ${N} tersangkut`,
      meta: `Gudang · ${N}`,
      keyRound: true,
      layout: 'chat',
      prompt: `Apa balasan ${N}?`,
      backgroundAssetId: 'asset:latar-gudang',
      showOfficer: false,
      mediaAssetId: null,
      intro: [sceneLine('i1', 0, 'officer', `Mentor ${N}`)],
      lines: [sceneLine('l1', 0, 'narrator', null), sceneLine('l2', 1, 'customer', 'Pak Joko'), sceneLine('l3', 2, 'cast', 'Kak Lia')],
      action: `Kirim ke ${N}`,
      evidence: [
        {
          id: 'v_resi',
          kind: 'checklist',
          kicker: `Daftar ${N}`,
          title: `Resi ${N}`,
          body: `Catatan ${N}`,
          assetId: 'asset:foto-resi',
          spot: { x: 30, y: 60 },
          rows: [{ id: 'w_label', mark: 'check', label: `Label ${N}`, value: `Gudang ${N}` }],
        },
      ],
      respondent: { speaker: 'cast', name: `Kak ${N}` },
      lesson: `Kabari ${N} lebih dulu.`,
    },
    participants: [{ id: 'p1', name: 'Dewi', connected: true, answered: false, ready: true }],
    participantCount: 1,
    connectedCount: 1,
    eligibleCount: 0,
    answeredCount: 0,
    readyCount: 1,
    rankings: [{ participantId: 'p1', name: 'Dewi', rank: 1, tied: false, totalScore: 900 }],
    closedReason: null,
    maxParticipants: 100,
  };
}

const score = { accuracyPoints: 700, speedPoints: 150, roundScore: 850, elapsedMs: 15_000 };

function consequence(): StoryConsequenceView {
  return {
    roundId: 'r14',
    roundNumber: 14,
    outcome: 'kurang_tepat',
    chosenText: `Kirim ulang atas nama ${N}.`,
    chosenForm: 'action',
    consequence: `Pak Joko membalas ${N}.`,
    reason: `Alasan pilihan ${N}.`,
    recommended: [{ text: `Telepon dulu, ${N}.`, reason: '' }],
    mentorReason: `Catatan mentor untuk ${N}.`,
    delayedDelta: -12,
    moodBefore: 53,
    moodAfter: 58,
    bandBefore: 'ragu',
    bandAfter: 'ragu',
    score,
    reply: `Baik, ${N}, saya tunggu.`,
    respondentName: `Kak ${N}`,
    lesson: `Janji ${N} harus realistis.`,
    delayed: [{ label: `Janji ${N}`, fromRound: 12, delta: -12 }],
    flagSet: { label: `Janji ${N}`, effectRound: 14, delta: -12 },
  };
}

const LABELS: StorySummaryLabels = {
  customerName: 'Pak Joko',
  officerName: `Mentor ${N}`,
  officerCharacterId: 'builtin:char:miss-raksa',
  moodLabels: { sangat_kecewa: 'Marah', kecewa: 'Kesal', ragu: 'Biasa', tenang: `Lega ${N}`, senang: 'Senang' },
};

function summary(): StoryFinalSummary {
  const decision: StoryDecisionSummary = { ...consequence(), title: `Babak ${N}`, prompt: `Tindakan ${N}?` };
  return {
    complete: true,
    ending: { id: 'e_lega', kind: 'unhappy', title: `Akhir ${N}`, text: '', customer: `"Terima kasih, ${N}."`, mentor: `"Bagus, ${N}."` },
    decisions: [decision],
    totals: { totalScore: 850, accuracyPoints: 700, speedPoints: 150, answeredCount: 1, timeoutCount: 0 },
    rank: { rank: 1, tied: false, of: 1 },
    finalMood: 58,
    finalBand: 'ragu',
    scorePolicyId: 'story-70-30-v2',
    scenarioTitle: `Paket ${N}`,
    versionNo: 2,
    roomCode: 'K7M2QX',
    labels: LABELS,
  };
}

function privateState(): StoryPrivateState {
  return {
    participantId: 'p1',
    name: 'Dewi',
    mood: 53,
    moodBand: 'ragu',
    customerExpression: '',
    roundNumber: 14,
    moodVariantLine: `Pak Joko melirik jam, ${N}.`,
    flagLines: [sceneLine('lf1', -0.5, 'customer', 'Pak Joko')],
    flagReminders: [{ label: `Janji ${N}`, fromRound: 12, delta: -12 }],
    options: [
      { handle: 'h1', text: `Pilihan satu ${N}`, form: 'message' },
      { handle: 'h2', text: 'Pilihan dua', form: 'action' },
    ],
    answer: { roundId: 'r14', handle: 'h2', receivedAt: 1_000_000, elapsedMs: 4_000 },
    consequence: consequence(),
    totals: { totalScore: 850, accuracyPoints: 700, speedPoints: 150, answeredCount: 1, timeoutCount: 0 },
    rank: { rank: 1, tied: false, of: 1 },
    summary: summary(),
  };
}

test('personalizePublicState: every scenario text reads with the given name; nothing else changes', () => {
  const input = publicState();
  const before = structuredClone(input);
  const out = personalizePublicState(input, NAME);
  assert.equal(tokens(input), 19, 'fixture carries the token in every text');
  assert.equal(tokens(out), 0, 'no literal {nama} left');
  assert.equal(count(out, NAME), tokens(input));
  assert.deepEqual(input, before, 'input not mutated');
  assert.equal(out.scenario.title, `Paket ${NAME}`);
  assert.equal(out.scenario.moodLabels?.tenang, `Lega ${NAME}`);
  assert.equal(out.scene?.meta, `Gudang · ${NAME}`);
  assert.equal(out.scene?.intro[0]!.name, `Mentor ${NAME}`);
  assert.equal(out.scene?.lines[0]!.name, null);
  // Not scenario texts: ids, asset ids, layout, participant names, rankings, numbers.
  const strip = (s: StoryPublicState) => ({ ...s, scenario: { ...s.scenario, title: '', officerName: '', moodLabels: null }, scene: null });
  assert.deepEqual(strip(out), strip(input));
  assert.deepEqual(
    out.scene?.lines.map((l) => [l.id, l.pos, l.speaker, l.name]),
    input.scene?.lines.map((l) => [l.id, l.pos, l.speaker, l.name]),
  );
  assert.equal(out.scene?.backgroundAssetId, 'asset:latar-gudang');
});

test('personalizePublicState: action, lesson, respondent and every evidence text (label too); ids, marks, spots and assets untouched', () => {
  const out = personalizePublicState(publicState(), NAME).scene!;
  assert.equal(out.action, `Kirim ke ${NAME}`);
  assert.equal(out.lesson, `Kabari ${NAME} lebih dulu.`);
  assert.deepEqual(out.respondent, { speaker: 'cast', name: `Kak ${NAME}` });
  assert.deepEqual(out.evidence, [
    {
      id: 'v_resi',
      kind: 'checklist',
      kicker: `Daftar ${NAME}`,
      title: `Resi ${NAME}`,
      body: `Catatan ${NAME}`,
      assetId: 'asset:foto-resi',
      spot: { x: 30, y: 60 },
      rows: [{ id: 'w_label', mark: 'check', label: `Label ${NAME}`, value: `Gudang ${NAME}` }],
    },
  ]);
  const narration = personalizePublicState({ ...publicState(), scene: { ...publicState().scene!, respondent: null } }, NAME);
  assert.equal(narration.scene?.respondent, null);
});

test('personalizePublicState: shared screens use the neutral word; lobby (no scene) and default status words stay null', () => {
  const input = { ...publicState(), phase: 'lobby' as const, scene: null, scenario: { ...publicState().scenario, moodLabels: null, officerName: null } };
  const out = personalizePublicState(input, 'Petugas');
  assert.equal(out.scene, null);
  assert.equal(out.scenario.moodLabels, null);
  assert.equal(out.scenario.officerName, null);
  assert.equal(out.scenario.title, 'Paket Petugas');
});

test('personalizePrivateState: own lines, reminders, options, consequence (reply, lesson, delayed, flag) and summary are personalized', () => {
  const input = privateState();
  const before = structuredClone(input);
  const out = personalizePrivateState(input, NAME);
  assert.equal(tokens(input), 32);
  assert.equal(tokens(out), 0);
  assert.equal(count(out, NAME), tokens(input));
  assert.deepEqual(input, before, 'input not mutated');
  assert.equal(out.consequence?.mentorReason, `Catatan mentor untuk ${NAME}.`);
  assert.equal(out.consequence?.recommended[0]!.reason, '');
  assert.equal(out.consequence?.reply, `Baik, ${NAME}, saya tunggu.`);
  assert.deepEqual(out.consequence?.delayed, [{ label: `Janji ${NAME}`, fromRound: 12, delta: -12 }]);
  assert.deepEqual(out.consequence?.flagSet, { label: `Janji ${NAME}`, effectRound: 14, delta: -12 });
  assert.deepEqual(out.flagReminders, [{ label: `Janji ${NAME}`, fromRound: 12, delta: -12 }]);
  assert.deepEqual(
    out.options?.map((o) => [o.handle, o.form]),
    [
      ['h1', 'message'],
      ['h2', 'action'],
    ],
    'handles and forms pass through',
  );
  assert.deepEqual(out.answer, input.answer, 'the acknowledgement (own handle) is not scenario text');
  assert.equal(out.consequence?.chosenForm, 'action', 'the form of the own choice passes through');
  assert.equal(out.summary?.decisions[0]!.chosenForm, 'action');
  assert.equal(out.summary?.ending?.customer, `"Terima kasih, ${NAME}."`);
  assert.equal(out.summary?.decisions[0]!.title, `Babak ${NAME}`);
  assert.equal(out.summary?.decisions[0]!.delayedDelta, -12);
  assert.equal(out.summary?.labels.officerName, `Mentor ${NAME}`);
  assert.equal(out.summary?.labels.moodLabels?.tenang, `Lega ${NAME}`);
});

test('personalizePrivateState: empty parts stay empty', () => {
  const out = personalizePrivateState({ ...privateState(), moodVariantLine: null, flagLines: [], flagReminders: [], options: null, consequence: null, summary: null }, NAME);
  assert.equal(out.moodVariantLine, null);
  assert.deepEqual(out.flagLines, []);
  assert.deepEqual(out.flagReminders, []);
  assert.equal(out.options, null);
  assert.equal(out.consequence, null);
  assert.equal(out.summary, null);
});

test('personalizeSummary: a summary stored before ending words, replies, delayed notes and labels existed reads with neutral defaults', () => {
  const legacy = JSON.parse(JSON.stringify(summary())) as Record<string, unknown> & { ending: Record<string, unknown>; decisions: Record<string, unknown>[] };
  delete legacy.ending.customer;
  delete legacy.ending.mentor;
  for (const k of ['mentorReason', 'delayedDelta', 'reply', 'respondentName', 'lesson', 'delayed', 'flagSet', 'chosenForm']) delete legacy.decisions[0]![k];
  delete legacy.labels;
  const out = personalizeSummary(legacy as unknown as StoryFinalSummary, NAME);
  assert.equal(out.ending?.customer, '');
  assert.equal(out.ending?.mentor, '');
  assert.equal(out.decisions[0]!.mentorReason, '');
  assert.equal(out.decisions[0]!.delayedDelta, 0);
  assert.equal(out.decisions[0]!.reply, '');
  assert.equal(out.decisions[0]!.respondentName, null);
  assert.deepEqual(out.decisions[0]!.delayed, []);
  assert.equal(out.decisions[0]!.flagSet, null);
  assert.equal(out.decisions[0]!.chosenForm, 'message');
  assert.deepEqual(out.labels, { customerName: '', officerName: null, officerCharacterId: null, moodLabels: null });
  assert.equal(tokens(out), 0);
});

test('summaryNamesOf: stored labels win, an older summary borrows the live room, else no status words', () => {
  const live = { customerName: 'Pak Live', officerName: 'Mentor Live', officerCharacterId: null, moodLabels: null };
  assert.deepEqual(summaryNamesOf(LABELS, live), { ...LABELS, bandWordsKnown: true }, 'a reopened result reads like the live room');
  const none: StorySummaryLabels = { customerName: '', officerName: null, officerCharacterId: null, moodLabels: null };
  assert.deepEqual(summaryNamesOf(none, live), { ...live, bandWordsKnown: true });
  assert.deepEqual(summaryNamesOf(none, { ...live, customerName: '' }).customerName, null);
  assert.deepEqual(summaryNamesOf(none, null), { customerName: null, officerName: null, officerCharacterId: null, moodLabels: null, bandWordsKnown: false }, 'unknown words: show none rather than a default word of a different band');
});

test('personalize: the name is inserted literally (no replacement patterns)', () => {
  const tricky = "$& $' $1";
  const out = personalizePublicState(publicState(), tricky);
  assert.equal(out.scene?.prompt, `Apa balasan ${tricky}?`);
});

test('signedNumber: status changes with an explicit sign (U+2212 minus)', () => {
  assert.equal(signedNumber(4), '+4');
  assert.equal(signedNumber(-12), '−12');
  assert.equal(signedNumber(0), '0');
});
