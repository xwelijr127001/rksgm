import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTENT_SCHEMA_VERSION,
  MAX_CAST,
  MAX_EVIDENCE,
  MAX_EVIDENCE_ROWS,
  MAX_FLAG_EFFECTS,
  MAX_INTRO_LINES,
  STORY_CHOICE_COUNT,
  STORY_ROUND_COUNT,
  TEXT_LIMITS,
  textKey,
  type ScenarioContent,
} from '../../../../shared/story/content';
import type { AssetView } from '../../../../shared/story/dto';
import { playThrough, recommendedChoices } from '../../../../shared/story/engine';
import { participantSceneOf } from '../../../../shared/story/scene';
import { sanitizeScenarioContent, validateScenario, type ValidationContext } from '../../../../shared/story/validate';
import { assetChoices } from './editor/fields';
import { autoDecisions, carriedState, decideNext } from './editor/previewModel';
import { castUsesLabel, endingRuleLabel, flagSourceLabel, moodBandLabel, roundListLabel } from './labels';
import { historyIndex, isPlainClick, replacesEditor } from './leavePolicy';
import { editWorkingCopy, hasUnsavedChanges, withServerCopy } from './workingCopy';
import {
  SPOT_RANGE,
  addCastMember,
  addEnding,
  addEvidence,
  addEvidenceRow,
  addFlagEffect,
  addIntroLine,
  addLine,
  castUses,
  clearEndingBounds,
  clearFlag,
  clearIntroFlag,
  flagLeftElsewhere,
  flagReactions,
  flagUsesAfter,
  flagsOnlyIn,
  flagsSetBefore,
  getText,
  isUnconditional,
  moveEnding,
  moveEvidence,
  moveEvidenceRow,
  moveIntroLine,
  moveRound,
  newRound,
  normalizeFlagId,
  parseSpeakerValue,
  removeCastMember,
  removeEnding,
  removeEvidence,
  removeEvidenceRow,
  removeFlagEffect,
  removeIntroLine,
  removeLine,
  removeRound,
  renameFlag,
  respondentValue,
  scaffoldEndings,
  scaffoldRounds,
  setEvidenceSpot,
  setLocaleEnabled,
  setRespondent,
  setText,
  speakerValue,
  spotAt,
  updateChoice,
  updateEvidence,
  updateEvidenceRow,
  updateFlagEffect,
  updateIntroLine,
  updateLine,
  updateRound,
} from './contentEdit';

function seeded(seed = 7): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const blank = (): ScenarioContent => ({
  schemaVersion: CONTENT_SCHEMA_VERSION,
  categoryId: 'auto',
  difficulty: 1,
  locales: ['id'],
  initialMood: 25,
  contentSource: 'demo',
  presentation: { customerCharacterId: 'builtin:char:bu-rina', officerCharacterId: 'builtin:char:miss-raksa', moodExpressions: { sangat_kecewa: 'kesal', kecewa: 'cemas', ragu: 'bingung', tenang: 'lega', senang: 'senang' }, bgmAssetId: null },
  cast: [],
  intro: [],
  rounds: [],
  endings: [],
  authorNotes: '',
  text: { id: { [textKey.title()]: 'Uji' } },
});

/**
 * Validation context of the synthetic tests, as the editor builds it from the asset library: built-in pixel art (no
 * image file), an uploaded background, an uploaded photo and an archived photo.
 */
const CTX: ValidationContext = {
  categories: new Map([['auto', { active: true }]]),
  assets: new Map([
    ['builtin:bg:meja', { kind: 'background', expressions: [], archived: false, builtin: true }],
    ['builtin:char:bu-rina', { kind: 'character', expressions: ['kesal', 'cemas', 'bingung', 'lega', 'senang'], archived: false, builtin: true }],
    ['builtin:char:miss-raksa', { kind: 'character', expressions: [], archived: false, builtin: true }],
    ['latar:uji', { kind: 'background', expressions: [], archived: false, builtin: false }],
    ['foto:uji', { kind: 'photo', expressions: [], archived: false, builtin: false }],
    ['foto:lama', { kind: 'photo', expressions: [], archived: true, builtin: false }],
  ]),
};
const codesAt = (c: ScenarioContent, prefix: string) => validateScenario(c, CTX).filter((i) => i.field.startsWith(prefix)).map((i) => i.code);

test('scaffold creates exactly 15 rounds with 5 choices and unique stable IDs', () => {
  const c = scaffoldRounds(blank(), seeded());
  assert.equal(c.rounds.length, STORY_ROUND_COUNT);
  assert.ok(c.rounds.every((r) => r.choices.length === STORY_CHOICE_COUNT));
  assert.equal(new Set(c.rounds.map((r) => r.id)).size, STORY_ROUND_COUNT);
  assert.ok(c.rounds.every((r) => new Set(r.choices.map((ch) => ch.id)).size === STORY_CHOICE_COUNT));
  // Idempotent: scaffolding a complete scenario changes nothing.
  assert.equal(scaffoldRounds(c, seeded(9)).rounds.length, STORY_ROUND_COUNT);
});

test('a new round starts with the defaults of the optional features', () => {
  const r = newRound(blank(), seeded());
  assert.equal(r.layout, 'stage');
  assert.equal(r.keyRound, false);
  assert.deepEqual(r.flagEffects, []);
  assert.equal(r.authorNote, '');
  assert.deepEqual(r.evidence, []);
  assert.equal(r.respondent, null);
  assert.deepEqual(r.lines.map((l) => [l.speaker, l.castId, l.ifFlag]), [['customer', null, null]]);
  assert.ok(r.choices.every((ch) => ch.setsFlag === null && ch.form === 'message'), 'choices start as messages');
  // Exactly the shape sanitize produces for stored content (no field missing or extra).
  const c = scaffoldRounds(blank(), seeded());
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(c)))?.rounds, c.rounds);
});

test('editing is immutable and setText with an empty value removes the key', () => {
  const a = blank();
  const b = setText(a, 'id', textKey.synopsis(), 'Ringkas');
  assert.equal(getText(a, 'id', textKey.synopsis()), '');
  assert.equal(getText(b, 'id', textKey.synopsis()), 'Ringkas');
  const c = setText(b, 'id', textKey.synopsis(), '');
  assert.equal(textKey.synopsis() in (c.text.id ?? {}), false);
});

test('removing a round removes its texts in every locale; other rounds keep theirs', () => {
  let c = setLocaleEnabled(scaffoldRounds(blank(), seeded()), 'en', true);
  const [r0, r1] = c.rounds;
  c = setText(c, 'id', textKey.roundTitle(r0!.id), 'Satu');
  c = setText(c, 'en', textKey.roundTitle(r0!.id), 'One');
  c = setText(c, 'id', textKey.roundTitle(r1!.id), 'Dua');
  const d = removeRound(c, 0);
  assert.equal(d.rounds.length, STORY_ROUND_COUNT - 1);
  assert.equal(getText(d, 'id', textKey.roundTitle(r0!.id)), '');
  assert.equal(getText(d, 'en', textKey.roundTitle(r0!.id)), '');
  assert.equal(getText(d, 'id', textKey.roundTitle(r1!.id)), 'Dua');
});

test('lines and choices are edited by ID; order moves keep IDs', () => {
  let c = scaffoldRounds(blank(), seeded());
  c = addLine(c, 0, 'officer', null, seeded(3));
  const line = c.rounds[0]!.lines[1]!;
  c = setText(c, 'id', textKey.line(c.rounds[0]!.id, line.id), 'Halo');
  c = removeLine(c, 0, 1);
  assert.equal(c.rounds[0]!.lines.length, 1);
  assert.equal(getText(c, 'id', textKey.line(c.rounds[0]!.id, line.id)), '');
  c = updateChoice(c, 0, 2, { classification: 'keliru', accuracy: 0 });
  assert.equal(c.rounds[0]!.choices[2]!.classification, 'keliru');
  // "Tindakan, bukan pesan": the form changes alone (display only), and survives storage.
  const acting = updateChoice(c, 0, 2, { form: 'action' });
  assert.deepEqual([acting.rounds[0]!.choices[2]!.form, acting.rounds[0]!.choices[2]!.classification, c.rounds[0]!.choices[2]!.form], ['action', 'keliru', 'message']);
  assert.equal(sanitizeScenarioContent(JSON.parse(JSON.stringify(acting)))?.rounds[0]!.choices[2]!.form, 'action');
  const ids = c.rounds.map((r) => r.id);
  const moved = moveRound(c, 0, 1);
  assert.deepEqual(moved.rounds.map((r) => r.id).slice(0, 2), [ids[1], ids[0]]);
});

test('removing a line drops exactly its own text (l1 does not take l10 with it)', () => {
  let c = scaffoldRounds(blank(), seeded());
  const rid = c.rounds[0]!.id;
  c = updateRound(c, 0, (r) => ({
    ...r,
    lines: [
      { id: 'l1', speaker: 'customer', castId: null, ifFlag: null },
      { id: 'l10', speaker: 'narrator', castId: null, ifFlag: null },
    ],
  }));
  c = setText(c, 'id', textKey.line(rid, 'l1'), 'Baris satu');
  c = setText(c, 'id', textKey.line(rid, 'l10'), 'Baris sepuluh');
  c = removeLine(c, 0, 0);
  assert.deepEqual(c.rounds[0]!.lines.map((l) => l.id), ['l10']);
  assert.equal(getText(c, 'id', textKey.line(rid, 'l1')), '');
  assert.equal(getText(c, 'id', textKey.line(rid, 'l10')), 'Baris sepuluh');
});

test('cast speakers: castId is kept only for the cast speaker; the select value round-trips', () => {
  let c = addCastMember(scaffoldRounds(blank(), seeded()), seeded(4));
  const kid = c.cast[0]!.id;
  assert.match(kid, /^k_/);
  c = addLine(c, 0, 'cast', kid, seeded(5));
  c = addLine(c, 0, 'narrator', kid, seeded(6));
  const [, castLine, narration] = c.rounds[0]!.lines;
  assert.deepEqual([castLine!.speaker, castLine!.castId], ['cast', kid]);
  assert.deepEqual([narration!.speaker, narration!.castId], ['narrator', null]);
  // Switching a cast line to another speaker clears the castId; the flag condition is a separate field.
  c = updateLine(c, 0, 1, { ...parseSpeakerValue('officer'), ifFlag: null });
  assert.deepEqual([c.rounds[0]!.lines[1]!.speaker, c.rounds[0]!.lines[1]!.castId], ['officer', null]);
  for (const v of ['narrator', 'customer', 'officer', `cast:${kid}`]) assert.equal(speakerValue(parseSpeakerValue(v)), v);
  assert.deepEqual(parseSpeakerValue('cast:'), { speaker: 'cast', castId: null });
  assert.deepEqual(parseSpeakerValue('nonsense'), { speaker: 'narrator', castId: null });
});

test('cast members: unique IDs up to the limit; removing a referenced member turns its lines into narration and frees its replies', () => {
  let c = setLocaleEnabled(scaffoldRounds(blank(), seeded()), 'en', true);
  for (let i = 0; i < MAX_CAST + 2; i++) c = addCastMember(c, seeded(20 + i));
  assert.equal(c.cast.length, MAX_CAST, 'no more than MAX_CAST');
  assert.equal(new Set(c.cast.map((m) => m.id)).size, MAX_CAST);
  c = { ...c, cast: c.cast.slice(0, 2) };
  const [a, b] = c.cast.map((m) => m.id) as [string, string];
  c = setText(c, 'id', textKey.castName(a), 'Tokoh A');
  c = setText(c, 'en', textKey.castName(a), 'Character A');
  c = setText(c, 'id', textKey.castRole(a), 'Peran A');
  c = setText(c, 'id', textKey.castName(b), 'Tokoh B');
  c = addIntroLine(c, 'cast', a, seeded(30));
  c = addLine(c, 2, 'cast', a, seeded(31));
  c = addLine(c, 2, 'cast', b, seeded(32));
  const rid = c.rounds[2]!.id;
  const lineA = c.rounds[2]!.lines[1]!.id;
  c = setText(c, 'id', textKey.line(rid, lineA), 'Kalimat tokoh A');
  // A replies in rounds 6 and 9 (one of them without speaking anywhere in it), B in round 8.
  c = setRespondent(c, 5, 'cast', a);
  c = setRespondent(c, 8, 'cast', a);
  c = setRespondent(c, 7, 'cast', b);
  const reply = textKey.choiceReply(c.rounds[5]!.id, c.rounds[5]!.choices[0]!.id);
  c = setText(c, 'id', reply, 'Sudah saya catat.');
  assert.deepEqual(castUses(c, a), { lines: 2, replies: [5, 8] });
  assert.deepEqual(castUses(c, b), { lines: 1, replies: [7] });

  const d = removeCastMember(c, 0);
  assert.deepEqual(d.cast.map((m) => m.id), [b]);
  assert.deepEqual([d.intro[0]!.speaker, d.intro[0]!.castId], ['narrator', null]);
  assert.deepEqual([d.rounds[2]!.lines[1]!.speaker, d.rounds[2]!.lines[1]!.castId], ['narrator', null]);
  assert.equal(getText(d, 'id', textKey.line(rid, lineA)), 'Kalimat tokoh A', 'dialogue text is kept');
  assert.deepEqual([d.rounds[2]!.lines[2]!.speaker, d.rounds[2]!.lines[2]!.castId], ['cast', b], 'other members untouched');
  for (const key of [textKey.castName(a), textKey.castRole(a)]) {
    assert.equal(getText(d, 'id', key), '');
    assert.equal(getText(d, 'en', key), '');
  }
  assert.equal(getText(d, 'id', textKey.castName(b)), 'Tokoh B');
  assert.deepEqual(castUses(d, a), { lines: 0, replies: [] });
  // Its replies stay, with nobody chosen to say them: a warning to reassign, never a dangling (blocking) reference.
  assert.deepEqual([d.rounds[5]!.respondent, d.rounds[8]!.respondent, d.rounds[7]!.respondent], [null, null, { speaker: 'cast', castId: b }]);
  assert.equal(getText(d, 'id', reply), 'Sudah saya catat.', 'reply text is kept');
  assert.deepEqual(codesAt(d, 'rounds[5].respondent'), ['reply_without_respondent']);
  assert.deepEqual(validateScenario(d, CTX).filter((i) => i.code === 'respondent_cast_unknown'), []);
  assert.equal(d.rounds[0], c.rounds[0], 'rounds without the member keep their identity');
});

test('cast texts: where a member speaks and replies, with round numbers from 1', () => {
  assert.equal(roundListLabel([5]), '6');
  assert.equal(roundListLabel([5, 8]), '6 dan 9');
  assert.equal(roundListLabel([1, 5, 8]), '2, 6 dan 9');
  assert.equal(roundListLabel([]), '');
  assert.equal(castUsesLabel({ lines: 2, replies: [5] }), 'Berbicara di 2 baris (pembuka dan babak) dan membalas di babak 6.');
  assert.equal(castUsesLabel({ lines: 0, replies: [5, 8] }), 'Membalas di babak 6 dan 9.');
  assert.equal(castUsesLabel({ lines: 1, replies: [] }), 'Berbicara di 1 baris (pembuka dan babak).');
  assert.equal(castUsesLabel({ lines: 0, replies: [] }), 'Belum berbicara atau membalas di babak mana pun.');
});

test('opening lines: add up to the limit, move, change speaker, remove with their texts', () => {
  let c = setLocaleEnabled(blank(), 'en', true);
  c = addIntroLine(c, 'officer', null, seeded(1));
  c = addIntroLine(c, 'narrator', null, seeded(2));
  c = addIntroLine(c, 'customer', 'ignored', seeded(3));
  assert.deepEqual(c.intro.map((l) => [l.speaker, l.castId, l.ifFlag]), [['officer', null, null], ['narrator', null, null], ['customer', null, null]]);
  const [first, second, third] = c.intro.map((l) => l.id) as [string, string, string];
  assert.equal(new Set([first, second, third]).size, 3);
  c = setText(c, 'id', textKey.introLine(first), 'Selamat datang');
  c = setText(c, 'en', textKey.introLine(first), 'Welcome');
  c = setText(c, 'id', textKey.introLine(second), 'Kasus hari ini');

  c = moveIntroLine(c, 0, 1);
  assert.deepEqual(c.intro.map((l) => l.id), [second, first, third]);
  assert.deepEqual(moveIntroLine(c, 0, -1).intro.map((l) => l.id), [second, first, third], 'moving past the edge changes nothing');
  c = updateIntroLine(c, 2, 'narrator');
  assert.equal(c.intro[2]!.speaker, 'narrator');

  c = removeIntroLine(c, 1);
  assert.deepEqual(c.intro.map((l) => l.id), [second, third]);
  assert.equal(getText(c, 'id', textKey.introLine(first)), '');
  assert.equal(getText(c, 'en', textKey.introLine(first)), '');
  assert.equal(getText(c, 'id', textKey.introLine(second)), 'Kasus hari ini');

  for (let i = 0; i < MAX_INTRO_LINES + 2; i++) c = addIntroLine(c, 'narrator', null, seeded(40 + i));
  assert.equal(c.intro.length, MAX_INTRO_LINES);
});

test('flagsSetBefore lists only flags left in EARLIER rounds, grouped per flag', () => {
  let c = scaffoldRounds(blank(), seeded());
  c = updateChoice(c, 1, 0, { setsFlag: 'janji' });
  c = updateChoice(c, 3, 2, { setsFlag: 'janji' });
  c = updateChoice(c, 3, 4, { setsFlag: 'lupa_foto' });
  assert.deepEqual(flagsSetBefore(c, 0), []);
  assert.deepEqual(flagsSetBefore(c, 1), [], 'a round cannot react to its own choices');
  assert.deepEqual(flagsSetBefore(c, 2), [{ flag: 'janji', setBy: [{ roundIndex: 1, choiceIndex: 0, choiceId: c.rounds[1]!.choices[0]!.id }] }]);
  const later = flagsSetBefore(c, 10);
  assert.deepEqual(later.map((s) => [s.flag, s.setBy.map((x) => `${x.roundIndex}:${x.choiceIndex}`)]), [
    ['janji', ['1:0', '3:2']],
    ['lupa_foto', ['3:4']],
  ]);
});

test('delayed effects: add picks an unused earlier flag, respects the limit; update and remove', () => {
  let c = scaffoldRounds(blank(), seeded());
  assert.equal(addFlagEffect(c, 5), c, 'no flag set earlier: nothing to add');
  c = updateChoice(c, 1, 0, { setsFlag: 'a1' });
  c = updateChoice(c, 1, 1, { setsFlag: 'b2' });
  c = updateChoice(c, 2, 0, { setsFlag: 'c3' });
  c = updateChoice(c, 2, 1, { setsFlag: 'd4' });
  c = addFlagEffect(c, 5);
  c = addFlagEffect(c, 5);
  assert.deepEqual(c.rounds[5]!.flagEffects, [{ flag: 'a1', moodDelta: 0 }, { flag: 'b2', moodDelta: 0 }]);
  c = addFlagEffect(c, 5, 'd4', -12);
  assert.equal(c.rounds[5]!.flagEffects.length, MAX_FLAG_EFFECTS);
  assert.equal(addFlagEffect(c, 5), c, 'limit reached');
  c = updateFlagEffect(c, 5, 0, { moodDelta: -8 });
  c = updateFlagEffect(c, 5, 1, { flag: 'c3' });
  assert.deepEqual(c.rounds[5]!.flagEffects, [{ flag: 'a1', moodDelta: -8 }, { flag: 'c3', moodDelta: 0 }, { flag: 'd4', moodDelta: -12 }]);
  c = removeFlagEffect(c, 5, 1);
  assert.deepEqual(c.rounds[5]!.flagEffects.map((e) => e.flag), ['a1', 'd4']);
  assert.deepEqual(c.rounds[4]!.flagEffects, [], 'other rounds untouched');
  // Where a flag is used later (shown next to "Tinggalkan tanda").
  c = updateLine(c, 7, 0, { ifFlag: 'a1' });
  assert.deepEqual(flagUsesAfter(c, 1, 'a1'), [5, 7]);
  assert.deepEqual(flagUsesAfter(c, 6, 'a1'), [7]);
  assert.deepEqual(flagUsesAfter(c, 1, 'b2'), []);
});

test('typed flag IDs are normalized to the content ID alphabet', () => {
  assert.equal(normalizeFlagId('Janji Kirim 2'), 'janji_kirim_2');
  assert.equal(normalizeFlagId('  janji-kirim2!? '), 'janji-kirim2_');
  assert.equal(normalizeFlagId('Ünik.Tanda'), 'niktanda');
  assert.equal(normalizeFlagId('x'.repeat(40)).length, 32);
  assert.equal(normalizeFlagId(''), '');
});

test('content built with the editor helpers passes the shared cast/intro/flag checks', () => {
  let c = scaffoldRounds(blank(), seeded());
  c = addCastMember(c, seeded(11));
  const kid = c.cast[0]!.id;
  c = addIntroLine(c, 'cast', kid, seeded(12));
  c = updateChoice(c, 2, 0, { setsFlag: normalizeFlagId('Janji Kirim') });
  c = addFlagEffect(c, 4, undefined, -12);
  c = addLine(c, 4, 'customer', null, seeded(13));
  c = updateLine(c, 4, 1, { ifFlag: 'janji_kirim' });
  c = addLine(c, 6, 'cast', kid, seeded(14));
  const structural = new Set(['cast_id_invalid', 'cast_id_duplicate', 'line_cast_unknown', 'line_id_invalid', 'line_id_duplicate', 'flag_unknown', 'flag_id_invalid', 'flag_unused', 'intro_flag', 'lines_missing']);
  assert.deepEqual(validateScenario(c, CTX).filter((i) => structural.has(i.code)), []);
  // Moving the flagged choice's round after the effect makes the reference invalid (validation names it).
  const moved = moveRound(moveRound(c, 2, 1), 3, 1);
  assert.ok(validateScenario(moved, CTX).some((i) => i.code === 'flag_unknown'));
});

test('editor labels: flag origins, ending conditions, status words with ranges', () => {
  assert.equal(flagSourceLabel({ flag: 'janji', setBy: [{ roundIndex: 11, choiceIndex: 0, choiceId: 'c1' }, { roundIndex: 12, choiceIndex: 3, choiceId: 'c4' }] }), 'babak 12 pilihan 1 / babak 13 pilihan 4 (tanda janji)');
  assert.equal(endingRuleLabel({ minMood: 70, maxMood: null, minScore: null, maxScore: null }), 'status ≥ 70 (status saja)');
  assert.equal(endingRuleLabel({ minMood: 45, maxMood: 69, minScore: 9000, maxScore: null }), 'status 45–69 dan nilai ≥ 9.000');
  assert.equal(endingRuleLabel({ minMood: null, maxMood: null, minScore: null, maxScore: 5000 }), 'nilai ≤ 5.000 (nilai saja)');
  assert.equal(endingRuleLabel({ minMood: null, maxMood: null, minScore: null, maxScore: null }), 'tanpa syarat');
  assert.equal(moodBandLabel('kecewa', null), 'Kecewa (20–39)');
  assert.equal(moodBandLabel('kecewa', { sangat_kecewa: 'A', kecewa: 'B', ragu: 'C', tenang: 'D', senang: 'E' }), 'B (20–39)');
});

/** Scaffolded rounds (+10 / 0 / 0 / −10 / −10) where choice 2 of round 2 leaves a flag that round 4 answers with −12. */
function delayedScenario(): ScenarioContent {
  let c = scaffoldEndings(scaffoldRounds(blank(), seeded()), seeded(2));
  c = updateChoice(c, 1, 1, { setsFlag: 'janji' });
  c = addFlagEffect(c, 3, 'janji', -12);
  return c;
}

test('preview play state: decisions follow the room rules, flags and delayed effects included', () => {
  const c = delayedScenario();
  const best = (i: number) => recommendedChoices(c.rounds[i]!)[0]!.id;
  let ds = autoDecisions(c, 1);
  assert.deepEqual(ds.map((d) => d.choiceId), [best(0)]);
  ds = decideNext(c, ds, c.rounds[1]!.choices[1]!.id, 4_000);
  ds = decideNext(c, ds, best(2), 4_000);
  const before4 = carriedState(c, ds);
  assert.deepEqual([...before4.flags], ['janji']);
  // What the preview shows when round 4 begins equals the decision's starting point.
  const scene4 = participantSceneOf(c, 3, before4.mood, before4.flags, 'id');
  ds = decideNext(c, ds, best(3), 4_000);
  const d4 = ds[3]!;
  assert.equal(d4.delayedDelta, -12);
  assert.equal(d4.moodCarried, before4.mood);
  assert.equal(d4.moodBefore, before4.mood - 12);
  assert.equal(scene4.mood, d4.moodBefore);
  assert.equal(scene4.delayedDelta, -12);
  // Same picks through the shared engine's playThrough: identical decisions.
  const picks = [best(0), c.rounds[1]!.choices[1]!.id, best(2), best(3)];
  let all = ds;
  for (let i = 4; i < STORY_ROUND_COUNT; i++) all = decideNext(c, all, best(i), 4_000);
  // Round 1 came from autoDecisions (10 s), the others were answered at 4 s.
  const ref = playThrough(c, (r, i) => ({ choiceId: picks[i] ?? recommendedChoices(r)[0]!.id, elapsedMs: i === 0 ? 10_000 : 4_000 }));
  assert.deepEqual(all, ref.decisions);
});

test('preview play state: no flag, no delayed effect; timeouts and unknown choices; jump and back', () => {
  const c = delayedScenario();
  const ds = autoDecisions(c, 4);
  assert.equal(ds.length, 4);
  assert.ok(ds.every((d) => d.outcome === 'tepat' && d.elapsedMs === 10_000));
  assert.equal(ds[3]!.delayedDelta, 0, 'the recommended choice of round 2 leaves no flag');
  assert.equal(carriedState(c, ds).mood, ds[3]!.moodAfter);
  assert.equal(carriedState(c, []).mood, c.initialMood);
  const timeout = decideNext(c, ds, null, 3_000)[4]!;
  assert.deepEqual([timeout.outcome, timeout.elapsedMs, timeout.score.roundScore], ['timeout', null, 0]);
  assert.equal(decideNext(c, ds, 'tidak_ada', 3_000)[4]!.outcome, 'timeout');
  const full = autoDecisions(c, 99);
  assert.equal(full.length, STORY_ROUND_COUNT);
  assert.equal(decideNext(c, full, null, 0).length, STORY_ROUND_COUNT, 'nothing to decide after the last round');
  assert.deepEqual(autoDecisions(c, 0), []);
});

test('default endings keep the unconditional fallback last when endings are added/removed', () => {
  let c = scaffoldEndings(blank(), seeded());
  assert.equal(c.endings.length, 3);
  const fallback = c.endings[2]!;
  assert.deepEqual([fallback.minMood, fallback.maxMood, fallback.minScore, fallback.maxScore], [null, null, null, null]);
  c = addEnding(c, 'happy', seeded(5));
  assert.equal(c.endings.length, 4);
  assert.equal(c.endings[3]!.id, fallback.id, 'fallback stays last');
  c = addEnding(c, 'unhappy', seeded(6));
  assert.equal(c.endings.length, 5);
  assert.equal(c.endings[3]!.kind, 'unhappy');
  assert.deepEqual([c.endings[3]!.minMood, c.endings[3]!.maxScore], [null, null], 'new endings start without bounds');
  assert.equal(c.endings[4]!.id, fallback.id, 'fallback stays last');
  c = removeEnding(c, 0);
  assert.equal(c.endings.length, 4);
});

test('removing the fallback ending no longer dead-ends: new endings append, the last can be made unconditional, endings move', () => {
  let c = scaffoldEndings(blank(), seeded());
  const [happy, notes, fallback] = c.endings.map((e) => e.id) as [string, string, string];
  c = removeEnding(c, 2);
  assert.deepEqual(c.endings.map((e) => e.id), [happy, notes]);
  assert.ok(codesAt(c, 'endings[1]').includes('ending_fallback'), 'a bounded last ending is an error…');
  assert.equal(isUnconditional(c.endings[1]!), false, '…whose bounds the editor shows');
  // A bounded last ending is not a fallback to protect: a new ending goes after it.
  c = addEnding(c, 'unhappy', seeded(8));
  assert.equal(c.endings.length, 3);
  assert.equal(c.endings[2]!.kind, 'unhappy');
  assert.ok(isUnconditional(c.endings[2]!));
  assert.deepEqual(codesAt(c, 'endings[').filter((x) => x === 'ending_fallback'), []);
  // "Jadikan cadangan": the remaining bounded ending becomes unconditional; order is editable.
  c = removeEnding(c, 2);
  c = clearEndingBounds(c, 1);
  assert.ok(isUnconditional(c.endings[1]!));
  assert.deepEqual(codesAt(c, 'endings[').filter((x) => x === 'ending_fallback'), []);
  assert.deepEqual(moveEnding(c, 1, -1).endings.map((e) => e.id), [notes, happy]);
  assert.deepEqual(moveEnding(c, 1, 1).endings.map((e) => e.id), [happy, notes], 'moving past the end changes nothing');
  assert.notEqual(fallback, happy);
});

test('evidence items: add up to the limit, kinds, move, remove with every text of the item in every locale', () => {
  let c = setLocaleEnabled(scaffoldRounds(blank(), seeded()), 'en', true);
  c = addEvidence(c, 2, 'document', seeded(1));
  c = addEvidence(c, 2, 'checklist', seeded(2));
  const [doc, list] = c.rounds[2]!.evidence;
  assert.match(doc!.id, /^v_/);
  assert.deepEqual([doc!.kind, doc!.rows, doc!.assetId, doc!.spot], ['document', [], null, null]);
  assert.equal(list!.rows.length, 1, 'a row kind starts with one row');
  assert.equal(list!.rows[0]!.mark, 'none');
  for (let i = 0; i < MAX_EVIDENCE + 2; i++) c = addEvidence(c, 2, 'photo', seeded(10 + i));
  assert.equal(c.rounds[2]!.evidence.length, MAX_EVIDENCE);
  assert.equal(new Set(c.rounds[2]!.evidence.map((e) => e.id)).size, MAX_EVIDENCE);
  assert.equal(addEvidence(c, 2, 'document'), c, 'limit reached');
  assert.equal(addEvidence(c, 99, 'document'), c, 'no such round');
  c = { ...c, rounds: c.rounds.map((r, i) => (i === 2 ? { ...r, evidence: r.evidence.slice(0, 2) } : r)) };

  // Item ids that share a prefix: removing v_ab must not take v_abc's texts.
  c = updateRound(c, 2, (r) => ({ ...r, evidence: [{ ...r.evidence[0]!, id: 'v_ab' }, { ...r.evidence[1]!, id: 'v_abc' }] }));
  const rid = c.rounds[2]!.id;
  const row = c.rounds[2]!.evidence[1]!.rows[0]!.id;
  c = setText(c, 'id', textKey.evidenceTitle(rid, 'v_ab'), 'Surat');
  c = setText(c, 'en', textKey.evidenceTitle(rid, 'v_ab'), 'Letter');
  c = setText(c, 'id', textKey.evidenceBody(rid, 'v_ab'), 'Isi surat');
  c = setText(c, 'id', textKey.evidenceKicker(rid, 'v_ab'), 'Surat');
  c = setText(c, 'en', textKey.evidenceKicker(rid, 'v_ab'), 'Letter');
  c = setText(c, 'id', textKey.evidenceTitle(rid, 'v_abc'), 'Daftar');
  c = setText(c, 'id', textKey.evidenceRow(rid, 'v_abc', row), 'Fotokopi STNK');
  c = moveEvidence(c, 2, 0, 1);
  assert.deepEqual(c.rounds[2]!.evidence.map((e) => e.id), ['v_abc', 'v_ab']);
  c = updateEvidence(c, 2, 1, { kind: 'compare', assetId: 'foto:uji' });
  assert.deepEqual([c.rounds[2]!.evidence[1]!.kind, c.rounds[2]!.evidence[1]!.assetId], ['compare', 'foto:uji']);

  const d = removeEvidence(c, 2, 1);
  assert.deepEqual(d.rounds[2]!.evidence.map((e) => e.id), ['v_abc']);
  for (const key of [textKey.evidenceTitle(rid, 'v_ab'), textKey.evidenceBody(rid, 'v_ab'), textKey.evidenceKicker(rid, 'v_ab')]) {
    assert.equal(getText(d, 'id', key), '');
    assert.equal(getText(d, 'en', key), '');
  }
  assert.equal(getText(d, 'id', textKey.evidenceTitle(rid, 'v_abc')), 'Daftar');
  assert.equal(getText(d, 'id', textKey.evidenceRow(rid, 'v_abc', row)), 'Fotokopi STNK');
  assert.equal(d.rounds[1], c.rounds[1], 'other rounds keep their identity');
  // Removing the round removes its evidence texts too.
  assert.equal(getText(removeRound(c, 2), 'id', textKey.evidenceTitle(rid, 'v_abc')), '');
});

test('evidence rows: add up to the limit, mark, move, remove exactly their own label and value', () => {
  let c = addEvidence(scaffoldRounds(blank(), seeded()), 0, 'timeline', seeded(3));
  for (let i = 0; i < MAX_EVIDENCE_ROWS + 3; i++) c = addEvidenceRow(c, 0, 0, seeded(40 + i));
  const rows = c.rounds[0]!.evidence[0]!.rows;
  assert.equal(rows.length, MAX_EVIDENCE_ROWS);
  assert.equal(new Set(rows.map((r) => r.id)).size, MAX_EVIDENCE_ROWS);
  assert.ok(rows.every((r) => /^w_/.test(r.id) && r.mark === 'none'));
  c = updateRound(c, 0, (r) => ({ ...r, evidence: [{ ...r.evidence[0]!, rows: [{ id: 'w_a', mark: 'none' }, { id: 'w_ab', mark: 'none' }] }] }));
  const rid = c.rounds[0]!.id;
  const eid = c.rounds[0]!.evidence[0]!.id;
  c = setText(c, 'id', textKey.evidenceRow(rid, eid, 'w_a'), 'Laporan masuk');
  c = setText(c, 'id', textKey.evidenceRowValue(rid, eid, 'w_a'), 'Hari 1');
  c = setText(c, 'id', textKey.evidenceRow(rid, eid, 'w_ab'), 'Survei');
  c = setText(c, 'id', textKey.evidenceRowValue(rid, eid, 'w_ab'), 'Hari 2');
  c = updateEvidenceRow(c, 0, 0, 1, { mark: 'pending' });
  assert.deepEqual(c.rounds[0]!.evidence[0]!.rows.map((r) => r.mark), ['none', 'pending']);
  c = moveEvidenceRow(c, 0, 0, 0, 1);
  assert.deepEqual(c.rounds[0]!.evidence[0]!.rows.map((r) => r.id), ['w_ab', 'w_a']);
  c = removeEvidenceRow(c, 0, 0, 1);
  assert.deepEqual(c.rounds[0]!.evidence[0]!.rows.map((r) => r.id), ['w_ab']);
  assert.equal(getText(c, 'id', textKey.evidenceRow(rid, eid, 'w_a')), '');
  assert.equal(getText(c, 'id', textKey.evidenceRowValue(rid, eid, 'w_a')), '');
  assert.equal(getText(c, 'id', textKey.evidenceRow(rid, eid, 'w_ab')), 'Survei');
  assert.equal(getText(c, 'id', textKey.evidenceRowValue(rid, eid, 'w_ab')), 'Hari 2');
  assert.equal(removeEvidenceRow(c, 0, 0, 5), c, 'no such row');
});

test('field spots: kept in the room’s safe range (6–94 %) with one decimal; null removes the marker', () => {
  assert.deepEqual(SPOT_RANGE, { min: 6, max: 94 });
  assert.deepEqual(spotAt(12.345, 93.96), { x: 12.3, y: 94 });
  assert.deepEqual(spotAt(-5, 140), { x: 6, y: 94 }, 'a click outside the safe frame lands on its edge');
  assert.deepEqual(spotAt(0, 100), { x: 6, y: 94 }, 'a stored edge spot is drawn where the room draws it');
  assert.deepEqual(spotAt(6, 94), { x: 6, y: 94 });
  assert.deepEqual(spotAt(Number.NaN, 50), { x: 6, y: 50 });
  let c = addEvidence(scaffoldRounds(blank(), seeded()), 4, 'photo', seeded(5));
  c = setEvidenceSpot(c, 4, 0, { x: 33.333, y: -1 });
  assert.deepEqual(c.rounds[4]!.evidence[0]!.spot, { x: 33.3, y: 6 });
  // The stored shape survives sanitize unchanged.
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(c)))?.rounds[4]!.evidence, c.rounds[4]!.evidence);
  c = setEvidenceSpot(c, 4, 0, null);
  assert.equal(c.rounds[4]!.evidence[0]!.spot, null);
});

test('respondent: narration only is stored as null, castId only for cast; the select value round-trips', () => {
  let c = addCastMember(scaffoldRounds(blank(), seeded()), seeded(4));
  const kid = c.cast[0]!.id;
  c = setRespondent(c, 0, 'cast', kid);
  assert.deepEqual(c.rounds[0]!.respondent, { speaker: 'cast', castId: kid });
  assert.equal(respondentValue(c.rounds[0]!.respondent), `cast:${kid}`);
  c = setRespondent(c, 0, 'customer', kid);
  assert.deepEqual(c.rounds[0]!.respondent, { speaker: 'customer', castId: null });
  c = setRespondent(c, 0, 'narrator');
  assert.equal(c.rounds[0]!.respondent, null);
  assert.equal(respondentValue(null), 'narrator');
  for (const v of ['customer', 'officer', `cast:${kid}`]) {
    const p = parseSpeakerValue(v);
    assert.equal(respondentValue(setRespondent(c, 0, p.speaker, p.castId).rounds[0]!.respondent), v);
  }
  // A reply needs someone to say it (warning), and a cast respondent must exist (error).
  c = setText(c, 'id', textKey.choiceReply(c.rounds[0]!.id, c.rounds[0]!.choices[0]!.id), 'Baik, terima kasih.');
  assert.ok(codesAt(c, 'rounds[0].respondent').includes('reply_without_respondent'));
  c = setRespondent(c, 0, 'cast', 'k_tidakada');
  assert.ok(codesAt(c, 'rounds[0].respondent').includes('respondent_cast_unknown'));
  c = setRespondent(c, 0, 'cast', kid);
  assert.deepEqual(codesAt(c, 'rounds[0].respondent'), []);
});

/** Round 3 choice 1 leaves 'janji' (with a name in two locales); round 6 reacts with an effect and a private line. */
function flaggedScenario(): ScenarioContent {
  let c = setLocaleEnabled(scaffoldRounds(blank(), seeded()), 'en', true);
  c = updateChoice(c, 2, 0, { setsFlag: 'janji' });
  c = addFlagEffect(c, 5, 'janji', -12);
  c = addLine(c, 5, 'customer', null, seeded(9));
  c = updateLine(c, 5, 1, { ifFlag: 'janji' });
  c = setText(c, 'id', textKey.line(c.rounds[5]!.id, c.rounds[5]!.lines[1]!.id), 'Mana janjinya?');
  c = setText(c, 'id', textKey.flagLabel('janji'), 'janji kirim dokumen');
  return setText(c, 'en', textKey.flagLabel('janji'), 'promise to send the documents');
}

test('renaming a flag carries its delayed effects, conditional lines and name along in one edit', () => {
  const c = flaggedScenario();
  const flagCodes = (x: ScenarioContent) => validateScenario(x, CTX).filter((i) => i.code.startsWith('flag_')).map((i) => `${i.code}@${i.field}`);
  assert.deepEqual(flagCodes(c), []);
  const d = renameFlag(c, 2, 0, 'janji_kirim');
  assert.equal(d.rounds[2]!.choices[0]!.setsFlag, 'janji_kirim');
  assert.deepEqual(d.rounds[5]!.flagEffects, [{ flag: 'janji_kirim', moodDelta: -12 }]);
  assert.equal(d.rounds[5]!.lines[1]!.ifFlag, 'janji_kirim');
  assert.equal(getText(d, 'id', textKey.flagLabel('janji_kirim')), 'janji kirim dokumen');
  assert.equal(getText(d, 'en', textKey.flagLabel('janji_kirim')), 'promise to send the documents');
  assert.equal(getText(d, 'id', textKey.flagLabel('janji')), '');
  assert.deepEqual(flagCodes(d), [], 'nothing orphaned');
  assert.equal(d.rounds[4], c.rounds[4], 'rounds without a reaction keep their identity');
  assert.equal(renameFlag(c, 2, 0, ''), c, 'clearing is not a rename');
  assert.equal(renameFlag(c, 2, 0, 'janji'), c, 'same id');
  // A first flag on a choice is just set.
  assert.equal(renameFlag(c, 3, 1, 'baru').rounds[3]!.choices[1]!.setsFlag, 'baru');

  // While another choice still leaves the old flag, its reactions stay with it.
  const shared = updateChoice(c, 3, 2, { setsFlag: 'janji' });
  assert.ok(flagLeftElsewhere(shared, 2, 0, 'janji'));
  const e = renameFlag(shared, 2, 0, 'lain');
  assert.deepEqual(e.rounds[5]!.flagEffects, [{ flag: 'janji', moodDelta: -12 }]);
  assert.equal(e.rounds[5]!.lines[1]!.ifFlag, 'janji');
  assert.equal(getText(e, 'id', textKey.flagLabel('janji')), 'janji kirim dokumen');
});

test('clearing a flag lists and removes only what reacted to it alone', () => {
  const c = flaggedScenario();
  const lineId = c.rounds[5]!.lines[1]!.id;
  assert.deepEqual(flagReactions(c, 'janji'), { effects: [{ roundIndex: 5, effectIndex: 0, moodDelta: -12 }], lines: [{ roundIndex: 5, lineIndex: 1, lineId }] });
  assert.deepEqual(flagReactions(c, 'tidak_ada'), { effects: [], lines: [] });
  const d = clearFlag(c, 2, 0);
  assert.equal(d.rounds[2]!.choices[0]!.setsFlag, null);
  assert.deepEqual(d.rounds[5]!.flagEffects, []);
  assert.deepEqual(d.rounds[5]!.lines.map((l) => l.ifFlag), [null]);
  assert.equal(getText(d, 'id', textKey.line(c.rounds[5]!.id, lineId)), '');
  assert.equal(getText(d, 'id', textKey.flagLabel('janji')), '');
  assert.equal(getText(d, 'en', textKey.flagLabel('janji')), '');
  assert.deepEqual(validateScenario(d, CTX).filter((i) => i.code.startsWith('flag_')), []);
  assert.equal(clearFlag(d, 2, 0), d, 'nothing to clear');
  // Another choice still leaves it: only this choice's mark goes.
  const shared = updateChoice(c, 3, 2, { setsFlag: 'janji' });
  const e = clearFlag(shared, 2, 0);
  assert.equal(e.rounds[2]!.choices[0]!.setsFlag, null);
  assert.deepEqual(e.rounds[5]!.flagEffects, [{ flag: 'janji', moodDelta: -12 }]);
  assert.equal(e.rounds[5]!.lines.length, 2);
  assert.equal(getText(e, 'id', textKey.flagLabel('janji')), 'janji kirim dokumen');
});

test('an imported opening line with a flag condition can be fixed in the editor', () => {
  const imported = sanitizeScenarioContent({ ...blank(), intro: [{ id: 'l1', speaker: 'officer', ifFlag: 'janji' }], text: { id: { [textKey.introLine('l1')]: 'Halo' } } })!;
  assert.ok(codesAt(imported, 'intro[0]').includes('intro_flag'));
  assert.deepEqual(codesAt(clearIntroFlag(imported, 0), 'intro[0]'), []);
  const viaSpeaker = updateIntroLine(imported, 0, 'narrator');
  assert.deepEqual(viaSpeaker.intro[0], { id: 'l1', speaker: 'narrator', castId: null, ifFlag: null });
  assert.equal(getText(viaSpeaker, 'id', textKey.introLine('l1')), 'Halo', 'the text is kept');
});

test('content built with the evidence helpers passes the shared evidence, layout and respondent checks', () => {
  let c = scaffoldRounds(blank(), seeded());
  const rid = (i: number) => c.rounds[i]!.id;
  c = updateRound(c, 1, (r) => ({ ...r, layout: 'dossier' }));
  assert.ok(codesAt(c, 'rounds[1].evidence').includes('dossier_empty'));
  c = addEvidence(c, 1, 'checklist', seeded(21));
  const list = c.rounds[1]!.evidence[0]!;
  c = setText(c, 'id', textKey.evidenceTitle(rid(1), list.id), 'Kelengkapan berkas');
  assert.ok(codesAt(c, 'rounds[1].evidence[0].rows[0].label').includes('text_missing'), 'the starting row asks for its text');
  c = setText(c, 'id', textKey.evidenceRow(rid(1), list.id, list.rows[0]!.id), 'Surat polisi');
  c = updateEvidenceRow(c, 1, 0, 0, { mark: 'check' });
  assert.deepEqual(codesAt(c, 'rounds[1].evidence'), []);

  c = updateRound(c, 4, (r) => ({ ...r, layout: 'field', backgroundAssetId: 'latar:uji' }));
  c = addEvidence(c, 4, 'photo', seeded(22));
  const photo = c.rounds[4]!.evidence[0]!;
  c = setText(c, 'id', textKey.evidenceTitle(rid(4), photo.id), 'Gerbang samping');
  assert.deepEqual(codesAt(c, 'rounds[4].evidence').sort(), ['evidence_asset_missing', 'field_no_spot']);
  c = updateEvidence(c, 4, 0, { assetId: 'foto:lama' });
  assert.ok(codesAt(c, 'rounds[4].evidence[0].assetId').includes('evidence_asset_unknown'), 'archived picture');
  c = updateEvidence(c, 4, 0, { assetId: 'foto:uji' });
  c = setEvidenceSpot(c, 4, 0, { x: 40, y: 55 });
  assert.deepEqual([...codesAt(c, 'rounds[4].evidence'), ...codesAt(c, 'rounds[4].backgroundAssetId')], []);
  // The author's own label for the kind word: optional, single line, at most 24 characters.
  const kicker = textKey.evidenceKicker(rid(4), photo.id);
  c = setText(c, 'id', kicker, 'Lokasi');
  assert.deepEqual(codesAt(c, 'rounds[4].evidence'), []);
  assert.deepEqual(codesAt(setText(c, 'id', kicker, 'x'.repeat(TEXT_LIMITS.evidenceKicker + 1)), 'rounds[4].evidence[0].kicker'), ['text_too_long']);
  // Switching to a kind without rows keeps the rows but warns until they are removed.
  c = updateEvidence(c, 1, 0, { kind: 'document' });
  c = setText(c, 'id', textKey.evidenceBody(rid(1), list.id), 'Ringkasan berkas.');
  assert.deepEqual(codesAt(c, 'rounds[1].evidence'), ['evidence_rows_unused']);
  c = removeEvidenceRow(c, 1, 0, 0);
  assert.deepEqual(codesAt(c, 'rounds[1].evidence'), []);
});

/** A library entry as the asset API lists it: built-in pixel art has no file (url null), uploads have one. */
function libraryAsset(id: string, kind: AssetView['kind'], builtin: boolean, archived = false): AssetView {
  return {
    id,
    kind,
    title: id,
    builtin,
    url: builtin ? null : `/aset-cerita/${id}.png`,
    mime: builtin ? null : 'image/png',
    sizeBytes: null,
    expressions: [],
    variantUrls: {},
    archived,
    createdAt: 0,
    updatedAt: 0,
    collection: '',
    source: '',
    license: '',
    rightsHolder: '',
    usageNotes: '',
  };
}

test('built-in backgrounds have no image file: field scenes and evidence pictures need uploads (validation and pickers)', () => {
  let c = scaffoldRounds(blank(), seeded());
  c = updateRound(c, 4, (r) => ({ ...r, layout: 'field' }));
  c = addEvidence(c, 4, 'photo', seeded(22));
  c = setText(c, 'id', textKey.evidenceTitle(c.rounds[4]!.id, c.rounds[4]!.evidence[0]!.id), 'Gerbang samping');
  c = setEvidenceSpot(c, 4, 0, { x: 40, y: 55 });
  c = updateEvidence(c, 4, 0, { assetId: 'builtin:bg:meja' });
  assert.equal(c.rounds[4]!.backgroundAssetId, 'builtin:bg:meja', 'new rounds start on a built-in background');
  assert.deepEqual(codesAt(c, 'rounds[4].backgroundAssetId'), ['field_builtin_background']);
  assert.deepEqual(codesAt(c, 'rounds[4].evidence[0].assetId'), ['evidence_asset_builtin']);
  assert.deepEqual(codesAt(c, 'rounds[3].backgroundAssetId'), [], 'the other activities may keep a built-in background');
  c = updateRound(c, 4, (r) => ({ ...r, backgroundAssetId: 'latar:uji' }));
  c = updateEvidence(c, 4, 0, { assetId: 'latar:uji' });
  assert.deepEqual([...codesAt(c, 'rounds[4].evidence'), ...codesAt(c, 'rounds[4].backgroundAssetId')], [], 'an uploaded background serves as scene and as evidence picture');

  const library = [
    libraryAsset('builtin:bg:meja', 'background', true),
    libraryAsset('latar:uji', 'background', false),
    libraryAsset('latar:lama', 'background', false, true),
    libraryAsset('foto:uji', 'photo', false),
    libraryAsset('foto:lama', 'photo', false, true),
  ];
  const ids = (list: AssetView[]) => list.map((a) => a.id);
  assert.deepEqual(ids(assetChoices(library, ['background'], null, false)), ['builtin:bg:meja', 'latar:uji'], 'stage backgrounds: built-ins too');
  assert.deepEqual(ids(assetChoices(library, ['background'], null, true)), ['latar:uji'], 'field scene: uploads only');
  assert.deepEqual(ids(assetChoices(library, ['photo', 'background'], null, true)), ['latar:uji', 'foto:uji'], 'evidence picture: uploads only');
  assert.deepEqual(ids(assetChoices(library, ['photo', 'background'], 'builtin:bg:meja', true)), ['builtin:bg:meja', 'latar:uji', 'foto:uji'], 'a stored built-in stays visible until changed');
  assert.deepEqual(ids(assetChoices(library, ['photo'], 'foto:lama', true)), ['foto:uji', 'foto:lama'], 'so does an archived one');
});

test('stage-only settings and display cues: officer_none only on stage rounds; choice_form_hint sits on the form toggle', () => {
  let c = scaffoldRounds(blank(), seeded());
  c = { ...c, presentation: { ...c.presentation, officerCharacterId: null } };
  assert.ok(codesAt(c, 'rounds[0].showOfficer').includes('officer_none'), 'a stage round would draw a missing officer');
  c = updateRound(c, 0, (r) => ({ ...r, layout: 'chat' }));
  assert.deepEqual(codesAt(c, 'rounds[0].showOfficer'), [], 'chat, desk and field rounds never draw the officer');
  // Two "Tindakan" options and neither is tepat: the mark would point at wrong answers.
  const actionAt = (x: ScenarioContent, ri: number) => x.rounds[ri]!.choices.findIndex((ch) => ch.classification !== 'tepat');
  c = updateChoice(c, 2, actionAt(c, 2), { form: 'action' });
  c = updateChoice(c, 7, actionAt(c, 7), { form: 'action' });
  assert.deepEqual(codesAt(c, `rounds[2].choices[${actionAt(c, 2)}].form`), ['choice_form_hint']);
  assert.deepEqual(codesAt(c, `rounds[7].choices[${actionAt(c, 7)}].form`), ['choice_form_hint']);
  const tepat = c.rounds[9]!.choices.findIndex((ch) => ch.classification === 'tepat');
  c = updateChoice(c, 9, tepat, { form: 'action' });
  assert.deepEqual(validateScenario(c, CTX).filter((i) => i.code === 'choice_form_hint'), [], 'a tepat action breaks the pattern');
});

test('removing a round removes the flags only it leaves, with their reactions and names; shared flags stay', () => {
  let c = flaggedScenario();
  c = updateChoice(c, 2, 1, { setsFlag: 'lupa_foto' });
  c = updateChoice(c, 4, 0, { setsFlag: 'lupa_foto' });
  c = addFlagEffect(c, 6, 'lupa_foto', -5);
  c = setText(c, 'id', textKey.flagLabel('lupa_foto'), 'foto belum dikirim');
  assert.deepEqual(flagsOnlyIn(c, 2), ['janji'], 'lupa_foto is also left in round 5');
  assert.deepEqual(flagsOnlyIn(c, 4), []);
  const lineId = c.rounds[5]!.lines[1]!.id;
  const d = removeRound(c, 2);
  // Round 6 (now index 4) loses the delayed effect and the private line of 'janji', with the line's text.
  assert.deepEqual(d.rounds[4]!.flagEffects, []);
  assert.deepEqual(d.rounds[4]!.lines.map((l) => l.ifFlag), [null]);
  assert.equal(getText(d, 'id', textKey.line(c.rounds[5]!.id, lineId)), '');
  assert.equal(getText(d, 'id', textKey.flagLabel('janji')), '');
  assert.equal(getText(d, 'en', textKey.flagLabel('janji')), '');
  // The shared flag keeps its effect and name; nothing is left that validation would call unknown.
  assert.deepEqual(d.rounds[5]!.flagEffects, [{ flag: 'lupa_foto', moodDelta: -5 }]);
  assert.equal(getText(d, 'id', textKey.flagLabel('lupa_foto')), 'foto belum dikirim');
  assert.deepEqual(validateScenario(d, CTX).filter((i) => i.code.startsWith('flag_')), []);
  assert.equal(d.rounds[0], c.rounds[0], 'rounds that do not react keep their identity');
  // Without flags, a round goes alone.
  const plain = scaffoldRounds(blank(), seeded());
  assert.deepEqual(removeRound(plain, 3).rounds.map((r) => r.id), plain.rounds.filter((_, i) => i !== 3).map((r) => r.id));
});

test('working copy: unsaved means "not the stored copy"; a server answer never drops newer typing', () => {
  const stored = scaffoldRounds(blank(), seeded());
  let w = withServerCopy(null, stored);
  assert.equal(hasUnsavedChanges(w), false);
  assert.equal(editWorkingCopy(w, (c) => c), w, 'an edit that changes nothing is not a change');
  w = editWorkingCopy(w, (c) => setText(c, 'id', textKey.synopsis(), 'Ringkas'));
  assert.equal(hasUnsavedChanges(w), true);

  // Save without typing meanwhile: the server's copy (as stored, e.g. sanitized) replaces the working copy.
  const sent = w.content;
  const server1 = JSON.parse(JSON.stringify(sent)) as ScenarioContent;
  const saved = withServerCopy(w, server1, sent);
  assert.equal(saved.content, server1);
  assert.equal(hasUnsavedChanges(saved), false);

  // Typing while the save is on its way: kept, and still unsaved so the next save sends it.
  const typing = editWorkingCopy(w, (c) => setText(c, 'id', textKey.synopsis(), 'Ringkas, lalu diketik lagi'));
  const answered = withServerCopy(typing, server1, sent);
  assert.equal(getText(answered.content, 'id', textKey.synopsis()), 'Ringkas, lalu diketik lagi');
  assert.equal(answered.saved, server1);
  assert.equal(hasUnsavedChanges(answered), true);

  // A reload or workflow answer (no basis): replaces a clean copy, keeps unsaved edits.
  const server2 = JSON.parse(JSON.stringify(stored)) as ScenarioContent;
  assert.equal(withServerCopy(saved, server2).content, server2);
  const kept = withServerCopy(answered, server2);
  assert.equal(kept.content, answered.content);
  assert.equal(hasUnsavedChanges(kept), true);
});

test('leaving the editor: links to another page or query of the app ask first; jumps, other sites and new tabs do not', () => {
  const at = (href: string) => {
    const u = new URL(href, 'https://cms.uji');
    return { origin: u.origin, pathname: u.pathname, search: u.search };
  };
  const editor = at('/cms/skenario/s1');
  assert.equal(replacesEditor(editor, at('/cms')), true, 'Semua skenario / Skenario');
  assert.equal(replacesEditor(editor, at('/cms/aset')), true, 'Pustaka aset');
  assert.equal(replacesEditor(editor, at('/host')), true, 'another staff tool');
  assert.equal(replacesEditor(editor, at('/cms/skenario/s1?tab=babak')), true, 'another query');
  assert.equal(replacesEditor(editor, at('/cms/skenario/s1#catatan')), false, 'a jump within the page');
  assert.equal(replacesEditor(editor, at('https://lain.uji/cms')), false, 'another site: the browser warns (beforeunload)');
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  assert.equal(isPlainClick(click), true);
  for (const k of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) assert.equal(isPlainClick({ ...click, [k]: true }), false, `${k}: new tab or window`);
  assert.equal(isPlainClick({ ...click, button: 1 }), false, 'middle click: new tab');
});

test('leave guard: history entries are told apart by the numbers react-router gives them', () => {
  assert.equal(historyIndex({ usr: null, key: 'k1', idx: 4 }), 4);
  assert.equal(historyIndex({ idx: 0 }), 0);
  for (const state of [null, undefined, 'x', {}, { idx: '4' }, { idx: 1.5 }]) assert.equal(historyIndex(state), null, JSON.stringify(state) ?? 'undefined');
});
