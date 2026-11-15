/**
 * Pure domain rules of the PRD v0.2 Story Room: 70:30 score policy, ranking, names, content validation, the hub
 * narrative engine with delayed consequences, scene payloads (evidence, respondents, lessons), summaries and the option
 * audit (shared/story/*). No I/O. All scenario text here is SYNTHETIC.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTHORING_HINTS, auditOptions, auditRound, charCount, wordCount } from '../../../shared/story/audit';
import {
  CONTENT_ID_PATTERN,
  CONTENT_SCHEMA_VERSION,
  MAX_CAST,
  MAX_EVIDENCE,
  MAX_EVIDENCE_ROWS,
  newContentId,
  personalize,
  PLAYER_NAME_TOKEN,
  TEXT_LIMITS,
  textKey,
  unknownPlaceholders,
  type ScenarioContent,
} from '../../../shared/story/content';
import {
  clampMood,
  delayedEffectsOf,
  flagSourceIndex,
  flagsOf,
  moodAtRoundStart,
  moodBandOf,
  playThrough,
  resolveDecision,
  selectEnding,
  visibleLines,
  type DecisionResult,
} from '../../../shared/story/engine';
import { checkName, nameKey } from '../../../shared/story/names';
import { ENDING_KIND_LABEL, LESSON_PHASES, type StoryFinalSummary, type StoryPhase, type StorySceneLine } from '../../../shared/story/protocol';
import { rankParticipants } from '../../../shared/story/ranking';
import { flagLinesOf, mergeSceneLines, participantSceneOf, scenarioLabelOf, scenarioMoodLabels, scenePublicOf, summaryLabelsOf } from '../../../shared/story/scene';
import { scoreDecision, STORY_SCORE_POLICY } from '../../../shared/story/scorePolicy';
import { buildSummary, consequenceViewOf, withSummaryDefaults, type SummaryInput } from '../../../shared/story/summary';
import { hasErrors, isMultilineKey, sanitizeScenarioContent, validateScenario, type ContentIssue, type ValidationContext } from '../../../shared/story/validate';
import { RateLimiter } from './auth/rateLimit';
import { demoBaretContent } from './seed/demoBaret';
import {
  addTestCast,
  addTestDelayedConsequence,
  addTestEvidence,
  addTestIntro,
  buildFeatureScenario,
  buildGameplayScenario,
  buildTestScenario,
  FEATURE,
  GAMEPLAY,
  legacyShapeOf,
  schemaV1ShapeOf,
  testValidationContext,
  useMoodOnlyEndings,
  withoutChoiceForms,
} from './testing/fixtures';

const errorsOf = (c: ScenarioContent, ctx: ValidationContext = testValidationContext()) => validateScenario(c, ctx).filter((i) => i.severity === 'error');
const codesOf = (c: ScenarioContent) => new Set(validateScenario(c, testValidationContext()).map((i) => i.code));

// ------------------------------------------------------------------ score policy (FR-D1, staff #16)

test('score policy story-70-30-v2: script fixtures (a=1 at 0/15/30 s = 1000/850/700; a=0.5 at 0/15 s = 650/500; a=0 -> 0)', () => {
  assert.equal(STORY_SCORE_POLICY.id, 'story-70-30-v2');
  assert.deepEqual(scoreDecision(1, 0), { accuracyPoints: 700, speedPoints: 300, roundScore: 1000, speedFactor: 1 });
  assert.equal(scoreDecision(1, 15_000).roundScore, 850);
  assert.equal(scoreDecision(1, 30_000).roundScore, 700);
  assert.deepEqual(scoreDecision(0.5, 0), { accuracyPoints: 350, speedPoints: 300, roundScore: 650, speedFactor: 1 });
  assert.equal(scoreDecision(0.5, 15_000).roundScore, 500);
  assert.equal(scoreDecision(0, 0).roundScore, 0);
  assert.equal(scoreDecision(0, 0).speedPoints, 0, 'speed points only when accuracy > 0: a fast wrong answer earns nothing');
});

test('score policy: partial credit, clamping, rounding and invalid input', () => {
  assert.equal(scoreDecision(0.25, 30_000).roundScore, 175, 'at the deadline only accuracy points remain');
  assert.equal(scoreDecision(0.25, 10_000).speedPoints, 200, 'v2: speed points are not scaled by accuracy');
  assert.equal(scoreDecision(0.5, 25_000).speedPoints, 50);
  assert.equal(scoreDecision(1, 29_000).speedPoints, 10, 'millisecond precision, rounded');
  assert.equal(scoreDecision(1, 45_000).roundScore, 700, 'elapsed beyond the window clamps to s = 0');
  assert.equal(scoreDecision(1, -5).roundScore, 1000, 'negative elapsed clamps to s = 1');
  assert.equal(scoreDecision(1, 7_000).roundScore, 700 + Math.round(300 * (1 - 7_000 / 30_000)));
  for (const bad of [-0.1, 1.01, NaN, Infinity]) assert.throws(() => scoreDecision(bad, 0), RangeError);
  assert.throws(() => scoreDecision(1, NaN), RangeError);
  assert.throws(() => scoreDecision(1, 0, 0), RangeError);
});

test('appendix A: equal accuracy, different answer times -> different scores; max component split is 70:30', () => {
  assert.ok(scoreDecision(1, 4_000).roundScore > scoreDecision(1, 9_000).roundScore);
  assert.ok(scoreDecision(0.5, 4_000).roundScore > scoreDecision(0.5, 9_000).roundScore);
  const best = scoreDecision(1, 0);
  assert.equal(best.accuracyPoints / best.roundScore, 0.7);
  assert.equal(best.speedPoints / best.roundScore, 0.3);
});

// ------------------------------------------------------------------ ranking (FR-D2)

test('ranking: equal totals share a rank (1224); display order uses accuracy points, then time, then name', () => {
  const rows = rankParticipants([
    { participantId: 'a', name: 'Budi', totalScore: 900, accuracyPoints: 700, totalElapsedMs: 9000 },
    { participantId: 'b', name: 'Ani', totalScore: 1000, accuracyPoints: 700, totalElapsedMs: 1000 },
    { participantId: 'c', name: 'Citra', totalScore: 900, accuracyPoints: 800, totalElapsedMs: 9000 },
    { participantId: 'd', name: 'Dewi', totalScore: 500, accuracyPoints: 500, totalElapsedMs: 1 },
  ]);
  assert.deepEqual(rows.map((r) => [r.participantId, r.rank, r.tied]), [
    ['b', 1, false],
    ['c', 2, true],
    ['a', 2, true],
    ['d', 4, false],
  ]);
});

// ------------------------------------------------------------------ names (FR-B4, staff #19)

test('names: empty/short/long/invalid/emoji/needs-letter rejected; Unicode names accepted', () => {
  const reason = (n: unknown) => {
    const r = checkName(n);
    return r.ok ? 'ok' : r.reason;
  };
  assert.equal(reason(''), 'empty');
  assert.equal(reason('   '), 'empty');
  assert.equal(reason(42), 'empty');
  assert.equal(reason('A'), 'too_short');
  assert.equal(reason('x'.repeat(21)), 'too_long');
  assert.equal(reason('<b>Ani</b>'), 'invalid_chars');
  assert.equal(reason('Ani 😀'), 'invalid_chars');
  assert.equal(reason('12345'), 'needs_letter');
  for (const ok of ['Weli', 'Nguyễn Thị', 'Ömer', '李明', "O'Brien", 'Dicky', 'Asumi', 'Colin', 'Mashita', 'Budi S.', 'Ni Luh Putu']) assert.equal(reason(ok), 'ok', ok);
  const zw = checkName('Ani​ta');
  assert.ok(zw.ok && zw.name === 'Anita', 'zero-width characters are stripped');
});

test('names: inappropriate words blocked, including leetspeak and spacing tricks', () => {
  for (const bad of ['anjing', 'Anj1ng', 'a n j i n g', 'si BANGSAT', 'Fuck you', 'asu', 'Tai lo']) {
    const r = checkName(bad);
    assert.ok(!r.ok && r.reason === 'inappropriate', bad);
  }
});

test('names: duplicates are case/accent/spacing-insensitive within a room', () => {
  const taken = new Set([nameKey('Budi Santoso')]);
  for (const dup of ['budi santoso', 'BUDI  SANTOSO', 'Budi-Santoso', 'Búdi Santoso']) {
    const r = checkName(dup, taken);
    assert.ok(!r.ok && r.reason === 'duplicate', dup);
  }
  assert.ok(checkName('Budi S', taken).ok);
});

// ------------------------------------------------------------------ player-name placeholder

test('personalize: every {nama} becomes the given name, inserted literally; nothing else changes', () => {
  assert.equal(PLAYER_NAME_TOKEN, '{nama}');
  assert.equal(personalize('Halo {nama}, ini catatan untuk {nama}.', 'Andi'), 'Halo Andi, ini catatan untuk Andi.');
  assert.equal(personalize('Tanpa penanda.', 'Andi'), 'Tanpa penanda.');
  assert.equal(personalize('Untuk {nama}', "$& $' $1"), "Untuk $& $' $1", 'replacement patterns are not interpreted');
  assert.equal(personalize('{Nama} { nama } {nama', 'Andi'), '{Nama} { nama } {nama', 'only the exact token');
  assert.equal(personalize('{nama}', 'Petugas'), 'Petugas', 'shared screens use a neutral word');
  assert.deepEqual(unknownPlaceholders('Halo {nama}, {Nama} di {kota}.'), ['{Nama}', '{kota}']);
});

// ------------------------------------------------------------------ validation (FR-A8, appendix A)

test('validation: the synthetic 15-round scenario is publishable', () => {
  const issues = validateScenario(buildTestScenario(), testValidationContext());
  assert.deepEqual(issues.filter((i) => i.severity === 'error'), []);
});

test('validation: wrong round count, missing choices/consequences name the round and field', () => {
  const ctx = testValidationContext();
  const fourteen = buildTestScenario({ rounds: 14 });
  assert.ok(validateScenario(fourteen, ctx).some((i) => i.code === 'round_count' && /15 \(sekarang 14\)/.test(i.message)));

  const c = buildTestScenario();
  c.rounds[2]!.choices.pop();
  c.rounds[5]!.choices = [];
  delete c.text.id![textKey.choiceConsequence('r08', 'c3')];
  const issues = validateScenario(c, ctx);
  const msg = (code: string) => issues.filter((i) => i.code === code).map((i) => i.message);
  assert.ok(msg('choice_count').some((m) => m.startsWith('Babak 3:')), JSON.stringify(msg('choice_count')));
  assert.ok(msg('choices_missing').some((m) => m.startsWith('Babak 6:')));
  assert.ok(msg('text_missing').some((m) => m.startsWith('Babak 8:') && /Konsekuensi pilihan 3/.test(m)));
  const r = issues.find((i) => i.code === 'text_missing' && i.round === 8);
  assert.equal(r?.field, 'rounds[7].choices[2].consequence');
});

test('validation: classification/weight consistency, endings, markup, assets, categories', () => {
  const ctx = testValidationContext();
  const c = buildTestScenario();
  c.rounds[0]!.choices[0]!.accuracy = 0.9; // tepat must be 1
  c.rounds[1]!.choices[2]!.accuracy = 0.2; // keliru must be 0
  c.rounds[2]!.choices[1]!.accuracy = 1; // kurang_tepat strictly between
  c.rounds[3]!.choices.forEach((x) => {
    if (x.classification === 'tepat') x.classification = 'kurang_tepat';
  });
  c.rounds[4]!.backgroundAssetId = 'asset:old-bg';
  c.rounds[6]!.choices[0]!.moodDelta = 99;
  c.text.id![textKey.line('r10', 'l1')] = 'Klik <a href="x">di sini</a>';
  c.text.id![textKey.line('r11', 'l1')] = 'Nomor polis 1234567890 milik customer';
  c.endings = [{ id: 'happy', kind: 'happy', minMood: 70, maxMood: null, minScore: null, maxScore: null }];
  c.categoryId = 'hvc';
  const issues = validateScenario(c, ctx);
  const codes = new Set(issues.map((i) => i.code));
  for (const code of ['accuracy_tepat', 'accuracy_keliru', 'accuracy_partial', 'no_recommended', 'background_archived', 'mood_delta_range', 'text_markup', 'ending_count', 'ending_notes_missing', 'ending_fallback', 'category_inactive']) {
    assert.ok(codes.has(code), `expected ${code}`);
  }
  const ident = issues.find((i) => i.code === 'possible_identifier');
  assert.equal(ident?.severity, 'warning', 'possible real identifiers are warnings for the reviewer (FR-E6)');
  assert.ok(hasErrors(issues));
});

test('validation: language completeness per declared locale; duplicate choice texts rejected', () => {
  const c = buildTestScenario();
  c.locales = ['id', 'en'];
  c.text.en = { [textKey.title()]: 'Test scenario' };
  c.text.id![textKey.choiceText('r01', 'c2')] = c.text.id![textKey.choiceText('r01', 'c1')]!;
  const issues = validateScenario(c, testValidationContext());
  assert.ok(issues.some((i) => i.code === 'text_missing' && i.message.endsWith('[en].')));
  assert.ok(issues.some((i) => i.code === 'choice_text_duplicate' && i.round === 1));
});

test('validation: {nama} is the only placeholder; any other {…} in any text is an error naming the round', () => {
  const c = buildTestScenario();
  c.text.id![textKey.title()] = 'Uji {judul}';
  c.text.id![textKey.line('r03', 'l1')] = 'Halo {nama}, ini {Nama} dan {Nama}.';
  c.text.id![textKey.choiceText('r05', 'c2')] = 'Kirim berkas ke { nama } sekarang';
  c.text.id![textKey.choiceConsequence('r06', 'c1')] = 'Customer membalas, "Siap, {nama}."';
  c.text.id![textKey.endingText('happy')] = 'Semua beres untuk {nama}.';
  const found = validateScenario(c, testValidationContext()).filter((i) => i.code === 'placeholder_unknown');
  assert.deepEqual(found.map((i) => [i.severity, i.round, i.field]), [
    ['error', null, 'text.title'],
    ['error', 3, 'rounds[2].lines[0]'],
    ['error', 5, 'rounds[4].choices[1].text'],
  ]);
  assert.match(found[1]!.message, /^Babak 3: Baris dialog 1 memuat penanda \{Nama\} yang tidak dikenal; hanya \{nama\}/);
  assert.match(found[2]!.message, /\{ nama \}/);
});

test('validation: long recommended answers up to 360 characters are accepted', () => {
  assert.equal(TEXT_LIMITS.choiceText, 360);
  const c = buildTestScenario();
  c.text.id![textKey.choiceText('r02', 'c1')] = `Jawaban panjang ${'a'.repeat(344)}`;
  assert.equal([...c.text.id![textKey.choiceText('r02', 'c1')]!].length, 360);
  assert.deepEqual(errorsOf(c), []);
  c.text.id![textKey.choiceText('r02', 'c1')] += 'b';
  assert.deepEqual(errorsOf(c).map((i) => [i.code, i.field]), [['text_too_long', 'rounds[1].choices[0].text']]);
});

test('validation: no customer character = name + status only (no expression checks); a chosen character keeps them', () => {
  const c = buildTestScenario();
  c.presentation.customerCharacterId = null;
  c.presentation.moodExpressions = { sangat_kecewa: '', kecewa: '', ragu: '', tenang: '', senang: '' };
  assert.deepEqual(errorsOf(c), []);
  c.presentation.customerCharacterId = 'builtin:char:bu-rina';
  assert.equal(errorsOf(c).filter((i) => i.code === 'expression_missing').length, 5);
  c.presentation.customerCharacterId = 'asset:old-char';
  assert.ok(errorsOf(c).some((i) => i.code === 'customer_archived'));
  const label = scenarioLabelOf({ ...c, presentation: { ...c.presentation, customerCharacterId: null } }, 'id', { scenarioId: 's', title: 'Uji', versionNo: 1, categoryName: 'Auto', contentKind: 'demo' });
  assert.equal(label.customerCharacterId, null);
  assert.equal(label.neutralExpression, '', 'no portrait: no expression on shared screens');
  assert.equal(label.customerName, 'Bu Rina', 'the name still labels the customer');
});

test('validation: cast members need valid unique ids, a name and a known portrait; cast lines need a listed member', () => {
  const ok = addTestCast(addTestCast(buildTestScenario(), 'surveyor', 'Mas Surveyor', { role: 'Petugas lapangan' }), 'saksi', 'Pak Saksi', { characterAssetId: 'builtin:char:miss-raksa' });
  ok.rounds[3]!.lines.push({ id: 'l3', speaker: 'cast', castId: 'surveyor', ifFlag: null });
  ok.text.id![textKey.line('r04', 'l3')] = 'Unitnya sudah saya foto dari empat sisi.';
  assert.deepEqual(errorsOf(ok), []);

  const c = structuredClone(ok);
  addTestCast(c, 'surveyor', 'Kembar');
  addTestCast(c, 'Bad.Id', 'Salah');
  addTestCast(c, 'lama', 'Tokoh Lama', { characterAssetId: 'asset:old-char' });
  addTestCast(c, 'latar', 'Bukan Tokoh', { characterAssetId: 'builtin:bg:meja' });
  delete c.text.id![textKey.castName('saksi')];
  c.text.id![textKey.castRole('surveyor')] = 'x'.repeat(TEXT_LIMITS.castRole + 1);
  c.rounds[5]!.lines[0] = { id: 'l1', speaker: 'cast', castId: 'tidak-ada', ifFlag: null };
  c.rounds[6]!.lines[0] = { id: 'l1', speaker: 'cast', castId: null, ifFlag: null };
  const got = errorsOf(c).map((i) => `${i.code}@${i.field}`);
  for (const want of [
    'cast_id_duplicate@cast[2].id',
    'cast_id_invalid@cast[3].id',
    'cast_character_unknown@cast[4].characterAssetId',
    'cast_character_unknown@cast[5].characterAssetId',
    'text_missing@cast[1].name',
    'text_too_long@cast[0].role',
    'line_cast_unknown@rounds[5].lines[0].castId',
    'line_cast_unknown@rounds[6].lines[0].castId',
  ]) {
    assert.ok(got.includes(want), `expected ${want} in ${JSON.stringify(got)}`);
  }
  const unknownLine = errorsOf(c).find((i) => i.field === 'rounds[5].lines[0].castId');
  assert.match(unknownLine!.message, /^Babak 6, baris 1: tokoh "tidak-ada"/);

  const crowded = buildTestScenario();
  for (let k = 0; k <= MAX_CAST; k++) addTestCast(crowded, `tokoh${k}`, `Tokoh ${k}`);
  assert.ok(codesOf(crowded).has('cast_count'));
});

test('validation: opening lines need text and no flag; the officer name is required whenever the officer speaks', () => {
  const c = addTestIntro(buildTestScenario(), [
    { speaker: 'officer', text: 'Selamat datang, {nama}. Kita mulai latihan.' },
    { speaker: 'narrator', text: 'Kantor klaim, pagi hari.' },
  ]);
  assert.deepEqual(errorsOf(c), []);

  // Without an officer character the officer may still speak (here only in the opening): the name is required.
  const noOfficer = structuredClone(c);
  noOfficer.presentation.officerCharacterId = null;
  for (const r of noOfficer.rounds) r.lines = r.lines.map((l) => (l.speaker === 'officer' ? { ...l, speaker: 'narrator' } : l));
  delete noOfficer.text.id![textKey.officerName()];
  assert.deepEqual(errorsOf(noOfficer).map((i) => [i.code, i.field]), [['text_missing', 'text.officerName']]);
  noOfficer.intro = noOfficer.intro.filter((l) => l.speaker !== 'officer');
  assert.deepEqual(errorsOf(noOfficer), [], 'nobody uses the officer: no name needed');

  const bad = addTestIntro(structuredClone(c), [
    { speaker: 'customer', text: 'Satu' },
    { speaker: 'customer', text: 'Dua' },
    { speaker: 'cast', castId: 'tidak-ada', text: 'Tiga' },
    { speaker: 'customer', text: 'Empat' },
    { speaker: 'customer', text: 'Lima' },
  ]);
  bad.intro[0]!.ifFlag = 'janji';
  delete bad.text.id![textKey.introLine('i2')];
  const got = errorsOf(bad).map((i) => `${i.code}@${i.field}`);
  for (const want of ['intro_count@intro', 'intro_flag@intro[0].ifFlag', 'text_missing@intro[1]', 'line_cast_unknown@intro[4].castId']) {
    assert.ok(got.includes(want), `expected ${want} in ${JSON.stringify(got)}`);
  }
});

test('validation: per-scenario status words are optional, but all five or none', () => {
  const c = buildTestScenario();
  assert.equal(scenarioMoodLabels(c, 'id'), null);
  c.text.id![textKey.moodLabel('kecewa')] = 'Waswas';
  const missing = errorsOf(c);
  assert.deepEqual(missing.map((i) => [i.code, i.field]), ['sangat_kecewa', 'ragu', 'tenang', 'senang'].map((b) => ['text_missing', `text.moodLabel.${b}`]));
  assert.match(missing[0]!.message, /^Kata status 0–19 /);
  assert.equal(scenarioMoodLabels(c, 'id'), null, 'an incomplete set falls back to the default words');
  Object.assign(c.text.id!, {
    [textKey.moodLabel('sangat_kecewa')]: 'Marah',
    [textKey.moodLabel('ragu')]: 'Bimbang',
    [textKey.moodLabel('tenang')]: 'Yakin',
    [textKey.moodLabel('senang')]: 'Lega sekali',
  });
  assert.deepEqual(errorsOf(c), []);
  assert.deepEqual(scenarioMoodLabels(c, 'id'), { sangat_kecewa: 'Marah', kecewa: 'Waswas', ragu: 'Bimbang', tenang: 'Yakin', senang: 'Lega sekali' });
  c.text.id![textKey.moodLabel('senang')] = 'x'.repeat(TEXT_LIMITS.moodLabel + 1);
  assert.deepEqual(errorsOf(c).map((i) => i.code), ['text_too_long']);
});

test('validation: choice reasons are optional only when the round has a mentor reason; round meta/reason are checked', () => {
  const c = buildTestScenario();
  for (const ch of c.rounds[0]!.choices) delete c.text.id![textKey.choiceReason('r01', ch.id)];
  assert.equal(errorsOf(c).filter((i) => i.code === 'text_missing' && i.round === 1).length, 5);
  c.text.id![textKey.roundReason('r01')] = 'Mentor: dengarkan dulu sebelum memberi prosedur.\nLalu jelaskan langkahnya.';
  c.text.id![textKey.roundMeta('r01')] = 'Tahap uji · hari pertama';
  assert.deepEqual(errorsOf(c), []);
  const longReason = `Mentor menjelaskan panjang. ${'kata '.repeat(112)}`.trim();
  assert.ok([...longReason].length > 560 && [...longReason].length <= TEXT_LIMITS.reason);
  c.text.id![textKey.roundReason('r01')] = longReason;
  assert.deepEqual(errorsOf(c), [], 'long mentor reasons (settled cases run to ~500 characters) fit');
  c.text.id![textKey.roundReason('r01')] = 'x'.repeat(TEXT_LIMITS.reason + 1);
  assert.deepEqual(errorsOf(c).map((i) => [i.code, i.field]), [['text_too_long', 'rounds[0].reason']]);
  c.text.id![textKey.roundReason('r01')] = 'Lihat <b>catatan</b>';
  c.text.id![textKey.roundMeta('r01')] = 'x'.repeat(TEXT_LIMITS.roundMeta + 1);
  assert.deepEqual(errorsOf(c).map((i) => [i.code, i.round, i.field]), [
    ['text_too_long', 1, 'rounds[0].meta'],
    ['text_markup', 1, 'rounds[0].reason'],
  ]);
  delete c.text.id![textKey.choiceReason('r02', 'c3')];
  assert.ok(errorsOf(c).some((i) => i.code === 'text_missing' && i.field === 'rounds[1].choices[2].reason'), 'other rounds still need choice reasons');
});

test('validation: endings need text or customer words; customer/mentor words are checked; "unhappy" is a valid kind', () => {
  const c = useMoodOnlyEndings(buildTestScenario());
  assert.deepEqual(errorsOf(c), []);
  delete c.text.id![textKey.endingCustomer('mood_high')];
  c.text.id![textKey.endingMentor('mood_mid')] = 'x'.repeat(TEXT_LIMITS.endingText + 1);
  assert.deepEqual(errorsOf(c).map((i) => [i.code, i.field]), [
    ['text_missing', 'endings[0].text'],
    ['text_too_long', 'endings[1].mentor'],
  ]);
  assert.match(errorsOf(c)[0]!.message, /^Teks akhir 1 \(atau kata-kata customer\) belum diisi\.$/);
  const noNotes = useMoodOnlyEndings(buildTestScenario());
  noNotes.endings = noNotes.endings.filter((e) => e.kind !== 'with_notes');
  assert.ok(codesOf(noNotes).has('ending_notes_missing'), 'a "with notes" ending is still required');
  assert.equal(ENDING_KIND_LABEL.unhappy, 'Kurang puas');
});

test('validation: delayed consequences may only react to flags left in EARLIER rounds', () => {
  const ok = addTestDelayedConsequence(buildTestScenario(), { flag: 'janji_palsu', setRound: 4, choiceId: 'c2', effectRound: 9, moodDelta: -10 });
  const okIssues = validateScenario(ok, testValidationContext());
  assert.deepEqual(okIssues.filter((i) => i.severity === 'error'), []);
  assert.ok(!okIssues.some((i) => i.code === 'flag_unused'));

  for (const [setRound, effectRound] of [[5, 5], [8, 3]] as const) {
    const c = addTestDelayedConsequence(buildTestScenario(), { flag: 'janji', setRound, choiceId: 'c1', effectRound, moodDelta: -4 });
    const issues = validateScenario(c, testValidationContext());
    const unknown = issues.filter((i) => i.code === 'flag_unknown');
    assert.deepEqual(unknown.map((i) => [i.round, i.field]), [
      [effectRound, `rounds[${effectRound - 1}].lines[0].ifFlag`],
      [effectRound, `rounds[${effectRound - 1}].flagEffects[0].flag`],
    ]);
    assert.match(unknown[0]!.message, new RegExp(`^Babak ${effectRound}, baris 1: tanda "janji" belum ditinggalkan`));
    assert.ok(issues.some((i) => i.code === 'flag_unused' && i.severity === 'warning' && i.round === setRound));
  }

  const c = buildTestScenario();
  c.rounds[1]!.choices[0]!.setsFlag = 'Bukan ID';
  c.rounds[2]!.choices[0]!.setsFlag = 'janji';
  c.rounds[2]!.choices[1]!.setsFlag = 'janji_lain';
  c.rounds[6]!.flagEffects = [
    { flag: 'janji', moodDelta: -41 },
    { flag: 'janji', moodDelta: -2 },
    { flag: 'janji_lain', moodDelta: 3 },
    { flag: '', moodDelta: 1 },
  ];
  c.rounds[9]!.lines = [{ id: 'l1', speaker: 'customer', castId: null, ifFlag: 'janji' }];
  const got = errorsOf(c).map((i) => `${i.code}@${i.field}`);
  for (const want of [
    'flag_id_invalid@rounds[1].choices[0].setsFlag',
    'flag_effect_count@rounds[6].flagEffects',
    'flag_delta_range@rounds[6].flagEffects[0].moodDelta',
    'flag_effect_duplicate@rounds[6].flagEffects[1].flag',
    'flag_id_invalid@rounds[6].flagEffects[3].flag',
    'lines_missing@rounds[9].lines',
  ]) {
    assert.ok(got.includes(want), `expected ${want} in ${JSON.stringify(got)}`);
  }
});

test('sanitize: untrusted JSON becomes typed content; control chars stripped; no throw on garbage', () => {
  assert.equal(sanitizeScenarioContent('nope'), null);
  const s = sanitizeScenarioContent({ rounds: [{ id: 'r1', choices: [{ id: 'c1', classification: 'hack', accuracy: 'x' }] }], text: { id: { 'scenario.title': 'A\u0000B‮C' }, xx: { a: 'b' } } });
  assert.ok(s);
  assert.equal(s.rounds[0]!.choices[0]!.classification, 'keliru');
  assert.equal(s.rounds[0]!.choices[0]!.accuracy, 0);
  assert.equal(s.text.id!['scenario.title'], 'ABC');
  assert.equal((s.text as Record<string, unknown>).xx, undefined);
  assert.deepEqual(s.locales, ['id']);
});

test('sanitize: defaults for the optional fields; castId kept only for cast speakers; flags and author notes cleaned and capped', () => {
  const s = sanitizeScenarioContent({
    presentation: { customerCharacterId: '' },
    cast: [{ id: ' surveyor ', characterAssetId: '' }, 'sampah'],
    intro: [{ id: 'i1', speaker: 'officer', castId: 'surveyor' }],
    rounds: [
      {
        id: 'r1',
        layout: 'hologram',
        keyRound: 'ya',
        lines: [
          { id: 'l1', speaker: 'cast', castId: 'surveyor', ifFlag: ' janji ' },
          { id: 'l2', speaker: 'customer', castId: 'surveyor', ifFlag: '' },
        ],
        choices: [{ id: 'c1', setsFlag: 'x'.repeat(40) }, { id: 'c2' }],
        flagEffects: [{ flag: 'janji', moodDelta: '-12' }, null],
        authorNote: `Catatan\u0000 satu\n\n\n\nbaris dua ${'y'.repeat(TEXT_LIMITS.authorNote + 100)}`,
      },
      { id: 'r2', layout: 'chat', keyRound: true },
    ],
    endings: [{ id: 'kurang', kind: 'unhappy' }],
    authorNotes: 'z'.repeat(TEXT_LIMITS.authorNotes + 1000),
  })!;
  assert.equal(s.presentation.customerCharacterId, null);
  assert.deepEqual(s.cast, [{ id: 'surveyor', characterAssetId: null }, { id: '', characterAssetId: null }]);
  assert.deepEqual(s.intro, [{ id: 'i1', speaker: 'officer', castId: null, ifFlag: null }]);
  const [r1, r2] = s.rounds;
  assert.deepEqual([r1!.layout, r1!.keyRound, r2!.layout, r2!.keyRound], ['stage', false, 'chat', true]);
  assert.deepEqual(r1!.lines, [
    { id: 'l1', speaker: 'cast', castId: 'surveyor', ifFlag: 'janji' },
    { id: 'l2', speaker: 'customer', castId: null, ifFlag: null },
  ]);
  assert.deepEqual(r1!.choices.map((c) => c.setsFlag), ['x'.repeat(32), null]);
  assert.deepEqual(r1!.flagEffects, [{ flag: 'janji', moodDelta: -12 }, { flag: '', moodDelta: 0 }]);
  assert.ok(r1!.authorNote.startsWith('Catatan satu\n\nbaris dua y'));
  assert.equal(r1!.authorNote.length, TEXT_LIMITS.authorNote);
  assert.deepEqual([r2!.flagEffects, r2!.authorNote], [[], '']);
  assert.equal(s.endings[0]!.kind, 'unhappy');
  assert.equal(s.authorNotes.length, TEXT_LIMITS.authorNotes);
  const crowded = sanitizeScenarioContent({ cast: Array.from({ length: 30 }, (_, k) => ({ id: `tokoh${k}` })) })!;
  assert.equal(crowded.cast.length, MAX_CAST + 4, 'a few over the limit are kept so validation can report them');
});

test('backward compatibility: content stored before cast/intro/layout/flags sanitizes, validates and plays exactly as before', () => {
  const ctx = testValidationContext();
  for (const original of [buildTestScenario(), demoBaretContent()]) {
    const legacy = legacyShapeOf(original);
    assert.ok(!('cast' in legacy) && !('intro' in legacy) && !('authorNotes' in legacy));
    assert.equal(legacy.schemaVersion, 1);
    const firstRound = (legacy.rounds as Record<string, unknown>[])[0]!;
    assert.ok(!('layout' in firstRound) && !('flagEffects' in firstRound) && !('evidence' in firstRound) && !('respondent' in firstRound));
    assert.deepEqual(Object.keys((firstRound.lines as object[])[0]!), ['id', 'speaker']);

    const loaded = sanitizeScenarioContent(JSON.parse(JSON.stringify(legacy)))!;
    assert.equal(loaded.schemaVersion, CONTENT_SCHEMA_VERSION);
    assert.deepEqual(loaded, original, 'old JSON gets exactly the defaults new content is built with');
    assert.deepEqual(errorsOf(loaded, ctx), []);
    for (const pickKind of ['tepat', 'kurang_tepat', 'keliru'] as const) {
      const pick = (r: ScenarioContent['rounds'][number]) => ({ choiceId: r.choices.find((x) => x.classification === pickKind)!.id, elapsedMs: 12_000 });
      const run = playThrough(loaded, pick);
      assert.deepEqual(run, playThrough(original, pick));
      // The old rules: no delayed effects, each round starts from the previous round's mood.
      run.decisions.forEach((d, i) => {
        assert.equal(d.delayedDelta, 0);
        assert.equal(d.moodBefore, i === 0 ? loaded.initialMood : run.decisions[i - 1]!.moodAfter);
        assert.equal(d.moodCarried, d.moodBefore);
      });
    }
    assert.deepEqual(scenePublicOf(loaded, 0, 'id')!.intro, []);
  }
});

// ------------------------------------------------------------------ engine (FR-C3–C5)

test('engine: mood bands and clamping', () => {
  assert.equal(moodBandOf(0), 'sangat_kecewa');
  assert.equal(moodBandOf(39), 'kecewa');
  assert.equal(moodBandOf(40), 'ragu');
  assert.equal(moodBandOf(79), 'tenang');
  assert.equal(moodBandOf(100), 'senang');
  assert.equal(clampMood(150), 100);
  assert.equal(clampMood(-3), 0);
});

test('engine: timeout applies the authored default consequence once with zero points', () => {
  const c = buildTestScenario();
  const d = resolveDecision(c.rounds[0]!, 25, null, null);
  assert.equal(d.outcome, 'timeout');
  assert.equal(d.score.roundScore, 0);
  assert.equal(d.moodAfter, 20);
  assert.deepEqual([d.moodCarried, d.delayedDelta, d.moodBefore], [25, 0, 25]);
  assert.throws(() => resolveDecision(c.rounds[0]!, 25, c.rounds[0]!.choices[0]!, null), /server-measured/);
});

test('engine: best path -> happy ending, poor path / timeouts -> resolution with notes; every path reaches round 15', () => {
  const c = buildTestScenario();
  const best = playThrough(c, () => ({ choiceId: 'c1', elapsedMs: 3000 }));
  assert.equal(best.decisions.length, 15);
  assert.equal(best.ending.kind, 'happy');
  assert.equal(best.totals.totalScore, 15 * scoreDecision(1, 3000).roundScore);
  const poor = playThrough(c, () => ({ choiceId: 'c4', elapsedMs: 1000 }));
  assert.equal(poor.ending.kind, 'with_notes');
  assert.equal(poor.totals.totalScore, 0);
  assert.equal(poor.finalMood, 0);
  const idle = playThrough(c, () => ({ choiceId: null, elapsedMs: 0 }));
  assert.equal(idle.decisions.length, 15, 'wrong answers and timeouts never end a session early (hub model)');
  assert.equal(idle.totals.timeoutCount, 15);
  assert.equal(idle.ending.id, 'notes');
  // Ending uses BOTH mood and score: high mood alone (partial answers) is not enough for the happy ending.
  const partial = playThrough(c, () => ({ choiceId: 'c2', elapsedMs: 20000 }));
  assert.ok(partial.finalMood >= 50 && partial.totals.totalScore < 9000);
  assert.equal(partial.ending.id, 'notes');
  assert.equal(selectEnding(c.endings, 100, 15000).id, 'happy');
});

test('engine: endings by status only (no score bounds), with "unhappy" as the fallback', () => {
  const c = useMoodOnlyEndings(buildTestScenario());
  assert.equal(selectEnding(c.endings, 70, 0).kind, 'happy', 'the score does not matter');
  assert.equal(selectEnding(c.endings, 69, 15_000).kind, 'with_notes');
  assert.equal(selectEnding(c.endings, 45, 0).kind, 'with_notes');
  assert.equal(selectEnding(c.endings, 44, 15_000).kind, 'unhappy');
  assert.equal(playThrough(c, () => ({ choiceId: 'c1', elapsedMs: 29_000 })).ending.id, 'mood_high');
  assert.equal(playThrough(c, () => ({ choiceId: 'c2', elapsedMs: 0 })).ending.id, 'mood_mid', '25 + 15 x 2 = 55');
  assert.equal(playThrough(c, () => ({ choiceId: null, elapsedMs: 0 })).ending.id, 'mood_low');
});

test('engine: a flag left in round k changes the mood when round k+n begins; clamped at 0/100; timeouts get it too', () => {
  const c = addTestDelayedConsequence(buildTestScenario(), { flag: 'janji', setRound: 3, choiceId: 'c2', effectRound: 6, moodDelta: -12 });
  const r6 = c.rounds[5]!;
  const held = new Set(['janji']);
  assert.deepEqual(moodAtRoundStart(r6, 50, held), { mood: 38, delayedDelta: -12 });
  assert.deepEqual(moodAtRoundStart(r6, 50, new Set()), { mood: 50, delayedDelta: 0 });
  assert.deepEqual(moodAtRoundStart(r6, 5, held), { mood: 0, delayedDelta: -5 }, 'clamped at 0: the delta is what was applied');
  assert.deepEqual(moodAtRoundStart({ ...r6, flagEffects: [{ flag: 'janji', moodDelta: 30 }] }, 90, held), { mood: 100, delayedDelta: 10 });
  assert.deepEqual(moodAtRoundStart(c.rounds[6]!, 50, held), { mood: 50, delayedDelta: 0 }, 'only rounds with a matching effect react');

  const answered = resolveDecision(r6, 50, r6.choices[0]!, 2_000, STORY_SCORE_POLICY.answerWindowMs, held);
  assert.deepEqual([answered.moodCarried, answered.delayedDelta, answered.moodBefore, answered.moodAfter, answered.moodDelta], [50, -12, 38, 46, 8]);
  const timeout = resolveDecision(r6, 50, null, null, STORY_SCORE_POLICY.answerWindowMs, held);
  assert.deepEqual([timeout.outcome, timeout.delayedDelta, timeout.moodBefore, timeout.moodAfter, timeout.moodDelta], ['timeout', -12, 38, 33, -5]);
  const floor = resolveDecision(r6, 4, null, null, STORY_SCORE_POLICY.answerWindowMs, held);
  assert.deepEqual([floor.moodCarried, floor.delayedDelta, floor.moodBefore, floor.moodAfter], [4, -4, 0, 0]);
  assert.equal(resolveDecision(r6, 50, null, null).delayedDelta, 0, 'no flags passed: no delayed effect');

  assert.deepEqual(visibleLines(r6.lines, new Set()).map((l) => l.id), ['l1', 'l2']);
  assert.deepEqual(visibleLines(r6.lines, held).map((l) => l.id), ['lf1', 'l1', 'l2']);
});

test('engine: playThrough tracks flags of earlier rounds; the delayed effect applies exactly once', () => {
  const c = addTestDelayedConsequence(buildTestScenario(), { flag: 'janji', setRound: 3, choiceId: 'c2', effectRound: 6, moodDelta: -12 });
  const steady = playThrough(c, () => ({ choiceId: 'c2', elapsedMs: 1_000 }));
  const d6 = steady.decisions[5]!;
  assert.deepEqual([d6.moodCarried, d6.delayedDelta, d6.moodBefore, d6.moodAfter], [35, -12, 23, 25], '25 + 5 x 2 = 35, then -12, then +2');
  assert.equal(steady.decisions.filter((d) => d.delayedDelta !== 0).length, 1);
  assert.equal(steady.finalMood, 25 + 15 * 2 - 12);

  const other = playThrough(c, (_r, i) => ({ choiceId: i === 2 ? 'c1' : 'c2', elapsedMs: 1_000 }));
  assert.ok(other.decisions.every((d) => d.delayedDelta === 0), 'no flag without that choice');
  const skipped = playThrough(c, (_r, i) => ({ choiceId: i === 2 ? null : 'c2', elapsedMs: 1_000 }));
  assert.ok(skipped.decisions.every((d) => d.delayedDelta === 0), 'timeouts leave no flag');
  const lateTimeout = playThrough(c, (_r, i) => ({ choiceId: i === 5 ? null : 'c2', elapsedMs: 1_000 }));
  assert.equal(lateTimeout.decisions[5]!.delayedDelta, -12, 'a timeout in the effect round still gets the delayed effect');

  assert.deepEqual([...flagsOf(c.rounds, steady.decisions.slice(0, 2))], []);
  assert.deepEqual([...flagsOf(c.rounds, steady.decisions.slice(0, 5))], ['janji']);
  const sparse: (DecisionResult | undefined)[] = [];
  sparse[2] = steady.decisions[2];
  assert.deepEqual([...flagsOf(c.rounds, sparse)], ['janji'], 'sparse decisions[roundIndex] arrays work');
  assert.deepEqual([...flagsOf(c.rounds, skipped.decisions)], []);
});

test('rate limiter: only recorded failures use the budget; the window resets', () => {
  let now = 0;
  const lim = new RateLimiter(3, 1000, () => now);
  // Successful lookups are never recorded: an office NAT can join/reconnect any number of times.
  for (let i = 0; i < 100; i++) assert.equal(lim.blocked('ip'), false);
  lim.record('ip');
  lim.record('ip');
  assert.equal(lim.blocked('ip'), false);
  lim.record('ip');
  assert.equal(lim.blocked('ip'), true, 'three failed guesses block the IP');
  assert.equal(lim.blocked('other'), false, 'other IPs are unaffected');
  now = 1001;
  assert.equal(lim.blocked('ip'), false, 'budget resets after the window');
  assert.equal(lim.take('ip'), true);
});

test('names: oversized raw input is rejected before any normalization work', () => {
  const r = checkName('a'.repeat(1_000_000));
  assert.deepEqual(r, { ok: false, reason: 'too_long' });
});

// ------------------------------------------------------------------ scene payloads (shared by room and preview)

/** Synthetic scenario using every optional feature (all text synthetic). */
function featureScenario(): ScenarioContent {
  const c = addTestDelayedConsequence(
    addTestIntro(addTestCast(buildTestScenario(), 'surveyor', 'Mas Surveyor', { role: 'Petugas lapangan' }), [
      { speaker: 'officer', text: 'Selamat datang, {nama}. Kita mulai latihan.' },
      { speaker: 'cast', castId: 'surveyor', text: 'Saya ikut membantu dari lapangan.' },
    ]),
    { flag: 'janji', setRound: 2, choiceId: 'c1', effectRound: 4, moodDelta: -6, lineText: 'Mana kabar yang dijanjikan, {nama}?' },
  );
  const r4 = c.rounds[3]!;
  r4.layout = 'chat';
  r4.keyRound = true;
  r4.lines.push({ id: 'l3', speaker: 'cast', castId: 'surveyor', ifFlag: null }, { id: 'l4', speaker: 'narrator', castId: null, ifFlag: null });
  Object.assign(c.text.id!, {
    [textKey.roundMeta('r04')]: 'Tahap uji · hari kedua',
    [textKey.line('r04', 'l3')]: 'Fotonya sudah lengkap.',
    [textKey.line('r04', 'l4')]: 'Pesan baru masuk.',
  });
  return c;
}

test('scene: public payload has names, positions, meta/badge/layout, the opening on round 1 only, never conditional lines', () => {
  const c = featureScenario();
  assert.deepEqual(errorsOf(c), []);
  const s1 = scenePublicOf(c, 0, 'id')!;
  assert.deepEqual(s1.intro.map((l) => [l.id, l.speaker, l.name, l.pos, l.text]), [
    ['i1', 'officer', 'Miss Raksa', 0, 'Selamat datang, {nama}. Kita mulai latihan.'],
    ['i2', 'cast', 'Mas Surveyor', 1, 'Saya ikut membantu dari lapangan.'],
  ]);
  assert.deepEqual([s1.meta, s1.keyRound, s1.layout], ['', false, 'stage']);
  const s4 = scenePublicOf(c, 3, 'id')!;
  assert.deepEqual(s4.intro, []);
  assert.deepEqual([s4.roundNumber, s4.meta, s4.keyRound, s4.layout], [4, 'Tahap uji · hari kedua', true, 'chat']);
  assert.deepEqual(s4.lines.map((l) => [l.id, l.speaker, l.name, l.pos]), [
    ['p0', 'customer', 'Bu Rina', 0],
    ['p1', 'officer', 'Miss Raksa', 1],
    ['p2', 'cast', 'Mas Surveyor', 2],
    ['p3', 'narrator', null, 3],
  ]);
  assert.ok(!JSON.stringify(s4).includes('dijanjikan'), 'conditional lines never reach the public scene');
  assert.equal(scenePublicOf(c, 15, 'id'), null);

  assert.deepEqual(flagLinesOf(c, 3, new Set(), 'id'), []);
  assert.deepEqual(flagLinesOf(c, 2, new Set(['janji']), 'id'), [], 'other rounds have no conditional lines');
  const own = flagLinesOf(c, 3, new Set(['janji']), 'id');
  assert.deepEqual(own, [{ id: 'f0', speaker: 'customer', name: 'Bu Rina', pos: -0.5, text: 'Mana kabar yang dijanjikan, {nama}?' }]);
  assert.deepEqual(mergeSceneLines(s4.lines, own).map((l) => l.id), ['f0', 'p0', 'p1', 'p2', 'p3']);
  assert.deepEqual(mergeSceneLines(s4.lines).map((l) => l.id), ['p0', 'p1', 'p2', 'p3']);
});

test('scene: public lines are p0..p(n−1) at positions 0..n−1 (no id, gap or sequence betrays a hidden line); a participant\'s own lines are f0, f1, … and merge back in authored order', () => {
  const c = buildTestScenario();
  // Round 3, authored: lfa (flag A) · l1 · lfb (flag B) · lfc (flag A) · l2 · l3 · lfd (flag B)
  const [flagA, flagB] = ['tanda_a', 'tanda_b'];
  c.rounds[0]!.choices[0]!.setsFlag = flagA;
  c.rounds[0]!.choices[1]!.setsFlag = flagB;
  const r3 = c.rounds[2]!;
  const conditional = (id: string, flag: string) => ({ id, speaker: 'customer' as const, castId: null, ifFlag: flag });
  r3.lines = [conditional('lfa', flagA), r3.lines[0]!, conditional('lfb', flagB), conditional('lfc', flagA), r3.lines[1]!, { id: 'l3', speaker: 'narrator', castId: null, ifFlag: null }, conditional('lfd', flagB)];
  for (const id of ['lfa', 'lfb', 'lfc', 'lfd', 'l3']) c.text.id![textKey.line('r03', id)] = `Baris ${id} uji.`;
  assert.deepEqual(errorsOf(c), []);
  /** The authored line behind each delivered line (ids are neutral, texts are unique in this round). */
  const authored = new Map(r3.lines.map((l) => [c.text.id![textKey.line('r03', l.id)]!, l.id]));
  const which = (lines: readonly StorySceneLine[]) => lines.map((l) => authored.get(l.text));

  const pub = scenePublicOf(c, 2, 'id')!;
  assert.deepEqual(pub.lines.map((l) => [l.id, l.pos]), [['p0', 0], ['p1', 1], ['p2', 2]]);
  assert.deepEqual(which(pub.lines), ['l1', 'l2', 'l3']);
  const both = flagLinesOf(c, 2, new Set([flagA, flagB]), 'id');
  assert.deepEqual(both.map((l) => [l.id, l.pos]), [['f0', -0.5], ['f1', 0.5], ['f2', 0.51], ['f3', 2.5]]);
  assert.deepEqual(which(mergeSceneLines(pub.lines, both)), ['lfa', 'l1', 'lfb', 'lfc', 'l2', 'l3', 'lfd'], 'the authored order');
  // A participant's own lines are numbered among themselves: nothing hints at the lines of a flag they do not hold.
  const onlyA = flagLinesOf(c, 2, new Set([flagA]), 'id');
  assert.deepEqual(onlyA.map((l) => [l.id, l.pos]), [['f0', -0.5], ['f1', 0.5]], 'lfc follows l1 directly for a holder of A only');
  assert.deepEqual(which(mergeSceneLines(pub.lines, onlyA)), ['lfa', 'l1', 'lfc', 'l2', 'l3']);
  const onlyB = flagLinesOf(c, 2, new Set([flagB]), 'id');
  assert.deepEqual(onlyB.map((l) => [l.id, l.pos]), [['f0', 0.5], ['f1', 2.5]]);
  assert.deepEqual(which(mergeSceneLines(pub.lines, onlyB)), ['l1', 'lfb', 'l2', 'l3', 'lfd']);
  // The public payload is identical whatever hidden lines exist.
  const plain = buildTestScenario();
  plain.rounds[2]!.lines.push({ id: 'l3', speaker: 'narrator', castId: null, ifFlag: null });
  plain.text.id![textKey.line('r03', 'l3')] = 'Baris l3 uji.';
  assert.deepEqual(scenePublicOf(plain, 2, 'id')!.lines, pub.lines);

  // Sequential authored ids with the conditional line FIRST (imported scripts number lines l1, l2, …): the public lines
  // are the same p0, p1 as in a round that never had a hidden line, so neither the ids nor their sequence reveal it.
  const hidden = buildTestScenario();
  hidden.rounds[0]!.choices[0]!.setsFlag = flagA;
  const h3 = hidden.rounds[2]!;
  h3.lines = [conditional('l1', flagA), { id: 'l2', speaker: 'customer', castId: null, ifFlag: null }, { id: 'l3', speaker: 'officer', castId: null, ifFlag: null }];
  Object.assign(hidden.text.id!, {
    [textKey.line('r03', 'l1')]: 'Baris tersembunyi uji.',
    [textKey.line('r03', 'l2')]: 'Customer menjelaskan keadaan tahap 3.',
    [textKey.line('r03', 'l3')]: 'Petugas mendengarkan pada tahap 3.',
  });
  assert.deepEqual(errorsOf(hidden), []);
  const shared = scenePublicOf(hidden, 2, 'id')!;
  assert.deepEqual(shared.lines, scenePublicOf(buildTestScenario(), 2, 'id')!.lines, 'the same shared lines as a round without the hidden one');
  assert.deepEqual(shared.lines.map((l) => [l.id, l.pos]), [['p0', 0], ['p1', 1]]);
  const holder = flagLinesOf(hidden, 2, new Set([flagA]), 'id');
  assert.deepEqual(holder.map((l) => [l.id, l.pos, l.text]), [['f0', -0.5, 'Baris tersembunyi uji.']]);
  assert.deepEqual(mergeSceneLines(shared.lines, holder).map((l) => l.text), ['Baris tersembunyi uji.', 'Customer menjelaskan keadaan tahap 3.', 'Petugas mendengarkan pada tahap 3.']);
});

test('scene: a participant sees the round start with delayed effects (mood, band, expression, variant line, own lines)', () => {
  const c = featureScenario();
  const held = new Set(['janji']);
  const p = participantSceneOf(c, 3, 50, held, 'id');
  assert.deepEqual([p.mood, p.delayedDelta, p.moodBand, p.customerExpression, p.flagLines.length], [44, -6, 'ragu', 'bingung', 1]);
  assert.deepEqual([participantSceneOf(c, 3, 50, new Set(), 'id').mood, participantSceneOf(c, 3, 50, new Set(), 'id').flagLines], [50, []]);
  // The mood variant line follows the band AFTER the delayed effect (the fixture only writes "sangat_kecewa" variants).
  assert.equal(participantSceneOf(c, 3, 24, held, 'id').moodVariantLine, 'Customer tampak sangat kecewa di tahap 4.');
  assert.equal(participantSceneOf(c, 3, 24, new Set(), 'id').moodVariantLine, null);
  c.presentation.customerCharacterId = null;
  assert.equal(participantSceneOf(c, 3, 50, held, 'id').customerExpression, '');

  const label = scenarioLabelOf(c, 'id', { scenarioId: 's1', title: 'Uji', versionNo: 2, categoryName: 'Auto', contentKind: 'demo' });
  assert.deepEqual(label, {
    scenarioId: 's1',
    title: 'Uji',
    versionNo: 2,
    categoryName: 'Auto',
    contentKind: 'demo',
    customerCharacterId: null,
    officerCharacterId: 'builtin:char:miss-raksa',
    customerName: 'Bu Rina',
    officerName: 'Miss Raksa',
    neutralExpression: '',
    moodLabels: null,
    bgmAssetId: null,
  });
});

// ------------------------------------------------------------------ summaries (FR-C4, FR-C6)

test('summary: the consequence view carries the delayed change and the mentor reason; the ending carries customer/mentor words', () => {
  const c = useMoodOnlyEndings(addTestDelayedConsequence(buildTestScenario(), { flag: 'janji', setRound: 3, choiceId: 'c2', effectRound: 6, moodDelta: -12 }));
  c.text.id![textKey.roundReason('r06')] = 'Mentor: janji tanpa dasar akan ditagih.';
  const run = playThrough(c, () => ({ choiceId: 'c2', elapsedMs: 1_000 }));
  const v6 = consequenceViewOf(c, 5, run.decisions[5]!);
  assert.deepEqual([v6.delayedDelta, v6.mentorReason, v6.moodBefore, v6.bandBefore, v6.moodAfter], [-12, 'Mentor: janji tanpa dasar akan ditagih.', 23, 'kecewa', 25]);
  assert.equal(v6.reason, 'Alasan pilihan 2 di tahap 6.', 'the own choice reason is unchanged');
  const v5 = consequenceViewOf(c, 4, run.decisions[4]!);
  assert.deepEqual([v5.delayedDelta, v5.mentorReason], [0, '']);
  // Decisions rebuilt from rows stored before delayed effects existed carry no delayedDelta.
  const { delayedDelta: _delayed, moodCarried: _carried, ...legacyDecision } = run.decisions[4]!;
  assert.equal(consequenceViewOf(c, 4, legacyDecision as DecisionResult).delayedDelta, 0);

  const summaryOf = (r: typeof run) =>
    buildSummary({
      content: c,
      decisions: r.decisions,
      endingId: r.ending.id,
      rank: null,
      complete: true,
      finalMood: r.finalMood,
      scorePolicyId: STORY_SCORE_POLICY.id,
      scenarioTitle: 'Uji',
      versionNo: 1,
      roomCode: 'ABCDEF',
      answerWindowMs: STORY_SCORE_POLICY.answerWindowMs,
    });
  const low = summaryOf(run);
  assert.equal(run.finalMood, 43);
  assert.deepEqual(low.ending, { id: 'mood_low', kind: 'unhappy', title: 'Customer kurang puas', text: '', customer: '"Klaimnya selesai, tetapi saya lelah menunggu."', mentor: '' });
  assert.deepEqual([low.decisions[5]!.delayedDelta, low.decisions[5]!.mentorReason], [-12, 'Mentor: janji tanpa dasar akan ditagih.']);
  const high = summaryOf(playThrough(c, () => ({ choiceId: 'c1', elapsedMs: 1_000 })));
  assert.deepEqual(high.ending, { id: 'mood_high', kind: 'happy', title: 'Customer puas', text: '', customer: '"Terima kasih, {nama}. Saya selalu tahu kabarnya."', mentor: '"Rapi sekali, {nama}."' });
  assert.ok(high.decisions.every((d) => d.delayedDelta === 0), 'choice c1 leaves no flag');
});

test('summary: a summary persisted before the new fields reads with neutral defaults', () => {
  const c = buildTestScenario();
  const run = playThrough(c, () => ({ choiceId: 'c1', elapsedMs: 1_000 }));
  const current = buildSummary({
    content: c,
    decisions: run.decisions,
    endingId: run.ending.id,
    rank: { rank: 1, tied: false, of: 3 },
    complete: true,
    finalMood: run.finalMood,
    scorePolicyId: 'story-70-30-v1',
    scenarioTitle: 'Uji',
    versionNo: 1,
    roomCode: 'ABCDEF',
    answerWindowMs: STORY_SCORE_POLICY.answerWindowMs,
  });
  // The JSON a room stored before these fields: no ending words, no delayed change, no mentor reason, no replies,
  // lessons, delayed notes, flag notes or choice forms, no labels.
  const stored = JSON.parse(JSON.stringify(current)) as { ending: Record<string, unknown>; labels?: unknown; decisions: Record<string, unknown>[] };
  delete stored.ending.customer;
  delete stored.ending.mentor;
  delete stored.labels;
  for (const d of stored.decisions) {
    for (const field of ['delayedDelta', 'mentorReason', 'reply', 'respondentName', 'lesson', 'delayed', 'flagSet', 'chosenForm']) delete d[field];
  }
  // Read back as the type it was written as (stored JSON is never rewritten, so it lacks the later fields).
  const old = stored as unknown as StoryFinalSummary;
  assert.deepEqual(withSummaryDefaults(old, summaryLabelsOf(c, 'id')), current, 'labels from the version content');
  assert.deepEqual(withSummaryDefaults(old).labels, { customerName: '', officerName: null, officerCharacterId: null, moodLabels: null }, 'unknown labels stay neutral');
  assert.deepEqual(withSummaryDefaults(current), current, 'current summaries are unchanged');
  assert.deepEqual(withSummaryDefaults(current, { customerName: 'Lain', officerName: null, officerCharacterId: null, moodLabels: null }).labels, current.labels, 'stored labels win');
  assert.equal(withSummaryDefaults({ ...current, ending: null }).ending, null, 'interrupted rooms have no ending');
  assert.equal(current.scorePolicyId, 'story-70-30-v1', 'a stored policy id is kept as stored, never recalculated');
});

test('content ids: new prefixes for cast members, flags, evidence items and rows match the content id pattern', () => {
  let n = 0;
  const random = () => ((n = (n * 7 + 3) % 32) / 32);
  for (const prefix of ['r', 'c', 'l', 'e', 'k', 'f', 'v', 'w'] as const) assert.match(newContentId(prefix, random), CONTENT_ID_PATTERN);
});

// ------------------------------------------------------------------ v2 content: text cleaning, schema upgrade

test('sanitize: in single-line texts every line break or tab becomes one space; multiline texts keep line breaks and turn tabs into spaces', () => {
  const s = sanitizeScenarioContent({
    intro: [{ id: 'i1', speaker: 'officer' }],
    rounds: [{ id: 'r01', lines: [{ id: 'l1', speaker: 'customer' }], choices: [{ id: 'c1' }] }],
    text: {
      id: {
        [textKey.introLine('i1')]: 'Halo Pak.\nSaya dari Raksa.',
        [textKey.line('r01', 'l1')]: 'Baris satu\r\nBaris dua\rBaris tiga',
        [textKey.choiceText('r01', 'c1')]: 'Pilihan\tA\n\nlanjut',
        [textKey.choiceReply('r01', 'c1')]: 'Balasan\nuji',
        [textKey.choiceConsequence('r01', 'c1')]: 'Akibat\tsatu\r\nAkibat dua\n\n\n\nAkibat tiga',
        [textKey.roundReason('r01')]: 'Alasan\v satu\fdua',
        [textKey.evidenceBody('r01', 'surat')]: 'Isi\tsurat\r\nbaris dua',
        [textKey.evidenceRow('r01', 'surat', 'reason')]: 'Baris\nberkas',
        [textKey.roundTitle('r01')]: ' Judul\u0000 uji​ ',
      },
    },
  })!;
  const t = s.text.id!;
  assert.equal(t[textKey.introLine('i1')], 'Halo Pak. Saya dari Raksa.');
  assert.equal(t[textKey.line('r01', 'l1')], 'Baris satu Baris dua Baris tiga');
  assert.equal(t[textKey.choiceText('r01', 'c1')], 'Pilihan A lanjut');
  assert.equal(t[textKey.choiceReply('r01', 'c1')], 'Balasan uji');
  assert.equal(t[textKey.choiceConsequence('r01', 'c1')], 'Akibat satu\nAkibat dua\n\nAkibat tiga');
  assert.equal(t[textKey.roundReason('r01')], 'Alasan satu dua');
  assert.equal(t[textKey.evidenceBody('r01', 'surat')], 'Isi surat\nbaris dua');
  assert.equal(t[textKey.evidenceRow('r01', 'surat', 'reason')], 'Baris berkas', 'a row id that looks like a multiline key suffix stays single-line');
  assert.equal(t[textKey.roundTitle('r01')], 'Judul uji', 'other control and format characters are still removed');
});

test('isMultilineKey: synopsis, ending texts, consequences, reasons and evidence bodies only, by key structure', () => {
  const multi = [
    textKey.synopsis(),
    textKey.endingText('e1'),
    textKey.endingCustomer('e1'),
    textKey.endingMentor('e1'),
    textKey.choiceConsequence('r1', 'c1'),
    textKey.timeoutConsequence('r1'),
    textKey.choiceReason('r1', 'c1'),
    textKey.timeoutReason('r1'),
    textKey.roundReason('r1'),
    textKey.evidenceBody('r1', 'v1'),
  ];
  const single = [
    textKey.title(),
    textKey.line('r1', 'l1'),
    textKey.line('r1', 'reason'),
    textKey.introLine('i1'),
    textKey.roundPrompt('r1'),
    textKey.choiceText('r1', 'c1'),
    textKey.choiceReply('r1', 'c1'),
    textKey.timeoutReply('r1'),
    textKey.roundLesson('r1'),
    textKey.roundAction('r1'),
    textKey.evidenceTitle('r1', 'v1'),
    textKey.evidenceKicker('r1', 'v1'),
    textKey.evidenceRow('r1', 'v1', 'consequence'),
    textKey.evidenceRowValue('r1', 'v1', 'w1'),
    textKey.flagLabel('janji'),
  ];
  for (const key of multi) assert.ok(isMultilineKey(key), key);
  for (const key of single) assert.ok(!isMultilineKey(key), key);
});

test('sanitize: evidence and respondent defaults; spots clamped to 0–100 (non-numbers → null); unknown kinds/marks fall back', () => {
  const s = sanitizeScenarioContent({
    rounds: [
      {
        id: 'r1',
        layout: 'dossier',
        evidence: [
          { id: 'a1', kind: 'hologram', assetId: '', spot: { x: 120, y: -5 }, rows: [{ id: 'w1', mark: 'aneh' }, 'sampah'] },
          { id: 'a2', kind: 'photo', assetId: 'asset:foto-uji', spot: { x: '12.5', y: 40 } },
          { id: 'a3', kind: 'timeline', spot: { x: 'kiri', y: 10 } },
          { id: 'a4', kind: 'compare', spot: [10, 20] },
          ...Array.from({ length: 10 }, (_, k) => ({ id: `ekstra${k}` })),
        ],
        respondent: { speaker: 'narrator', castId: 'x' },
      },
      { id: 'r2', layout: 'field', respondent: { speaker: 'cast', castId: ' saksi ' } },
      { id: 'r3', layout: 'hologram', respondent: { speaker: 'customer', castId: 'x' } },
      { id: 'r4', respondent: 'customer', evidence: 'bukan daftar' },
    ],
  })!;
  const [r1, r2, r3, r4] = s.rounds;
  assert.equal(s.schemaVersion, CONTENT_SCHEMA_VERSION);
  assert.deepEqual(r1!.evidence[0], { id: 'a1', kind: 'document', assetId: null, spot: { x: 100, y: 0 }, rows: [{ id: 'w1', mark: 'none' }, { id: '', mark: 'none' }] });
  assert.deepEqual(r1!.evidence[1], { id: 'a2', kind: 'photo', assetId: 'asset:foto-uji', spot: { x: 12.5, y: 40 }, rows: [] });
  assert.deepEqual([r1!.evidence[2]!.spot, r1!.evidence[3]!.spot], [null, null]);
  assert.equal(r1!.evidence.length, MAX_EVIDENCE + 3, 'a few over the limit are kept so validation can report them');
  assert.deepEqual([r1!.respondent, r2!.respondent, r3!.respondent, r4!.respondent], [null, { speaker: 'cast', castId: 'saksi' }, { speaker: 'customer', castId: null }, null]);
  assert.deepEqual([r1!.layout, r2!.layout, r3!.layout, r4!.evidence], ['dossier', 'field', 'stage', []]);
  const long = sanitizeScenarioContent({ rounds: [{ id: 'r1', evidence: [{ id: 'a1', kind: 'checklist', rows: Array.from({ length: 40 }, (_, k) => ({ id: `w${k}`, mark: 'ok' })) }] }] })!;
  assert.equal(long.rounds[0]!.evidence[0]!.rows.length, MAX_EVIDENCE_ROWS + 4);
});

test('schema v2: content stored by a v1 release (no evidence/respondent) upgrades on load and validates/plays exactly as before', () => {
  const ctx = testValidationContext();
  for (const original of [buildTestScenario(), buildFeatureScenario()]) {
    const v1 = schemaV1ShapeOf(original);
    assert.equal(v1.schemaVersion, 1);
    assert.ok((v1.rounds as Record<string, unknown>[]).every((r) => !('evidence' in r) && !('respondent' in r)));
    const loaded = sanitizeScenarioContent(JSON.parse(JSON.stringify(v1)))!;
    assert.equal(loaded.schemaVersion, 2);
    assert.deepEqual(loaded, original);
    assert.deepEqual(validateScenario(loaded, ctx), validateScenario(original, ctx), 'the same issues, warnings included');
    for (const kind of ['tepat', 'kurang_tepat', 'keliru'] as const) {
      const pick = (r: ScenarioContent['rounds'][number]) => ({ choiceId: r.choices.find((x) => x.classification === kind)!.id, elapsedMs: 9_000 });
      assert.deepEqual(playThrough(loaded, pick), playThrough(original, pick));
    }
    for (let i = 0; i < loaded.rounds.length; i++) {
      const scene = scenePublicOf(loaded, i, 'id', 'consequence')!;
      assert.deepEqual([scene.action, scene.evidence, scene.respondent, scene.lesson], ['', [], null, '']);
    }
  }
  const gameplay = buildGameplayScenario();
  assert.deepEqual(errorsOf(gameplay), [], 'the v2 gameplay fixture is publishable');
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(gameplay))), gameplay, 'v2 content round-trips through stored JSON');
});

test('choice form: message by default, unknown values fall back, action kept (schema stays 2); content stored before forms reads, validates and plays exactly as before', () => {
  const s = sanitizeScenarioContent({ rounds: [{ id: 'r1', choices: [{ id: 'c1' }, { id: 'c2', form: 'action' }, { id: 'c3', form: 'gesture' }, { id: 'c4', form: 'ACTION' }, { id: 'c5', form: 1 }] }] })!;
  assert.equal(s.schemaVersion, 2);
  assert.deepEqual(s.rounds[0]!.choices.map((c) => c.form), ['message', 'action', 'message', 'message', 'message']);

  const ctx = testValidationContext();
  const original = buildFeatureScenario();
  const stored = withoutChoiceForms(original);
  assert.ok((stored.rounds as { choices: object[] }[]).every((r) => r.choices.every((c) => !('form' in c))));
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(stored))), original, 'every choice becomes a message');

  // Display only: an action changes neither validation nor play.
  const acting = buildFeatureScenario();
  acting.rounds[1]!.choices[4]!.form = 'action';
  assert.deepEqual(validateScenario(acting, ctx), validateScenario(original, ctx));
  const pick = (r: ScenarioContent['rounds'][number]) => ({ choiceId: r.choices[4]!.id, elapsedMs: 7_000 });
  assert.deepEqual(playThrough(acting, pick), playThrough(original, pick));
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(acting))), acting, 'the form round-trips through stored JSON');
});

// ------------------------------------------------------------------ v2 validation: evidence, layouts, respondents, guidance

const issueKeys = (issues: readonly ContentIssue[]) => issues.map((i) => `${i.severity}:${i.code}@${i.field}`);

test('validation: evidence needs valid unique ids, a title, a body (document), 1–12 rows (lists) and an image (photo); images must be photos or backgrounds', () => {
  const c = buildGameplayScenario();
  addTestEvidence(c, 7, { id: 'Bad.Id', kind: 'document', title: 'Dokumen tanpa isi' });
  addTestEvidence(c, 7, { id: 'kosong', kind: 'checklist', title: 'Daftar kosong' });
  addTestEvidence(c, 7, { id: 'foto', kind: 'photo', title: 'Foto tanpa gambar' });
  addTestEvidence(c, 7, { id: 'foto', kind: 'compare', title: 'Kembar', rows: [['a1', 'none', 'Kiri', 'Kanan'], ['a1', 'none', 'Kiri lagi']] });
  addTestEvidence(c, 7, { id: 'video', kind: 'photo', title: 'Video', assetId: 'asset:video-uji' });
  addTestEvidence(c, 7, { id: 'keenam', kind: 'document', title: 'Berkas keenam', body: 'Isi.' });
  addTestEvidence(c, 8, { id: 'lama', kind: 'photo', title: 'Foto lama', assetId: 'asset:foto-lama' });
  addTestEvidence(c, 8, { id: 'hilang', kind: 'document', title: 'Dokumen', body: 'Isi.', assetId: 'asset:tidak-ada' });
  const tooMany = Array.from({ length: MAX_EVIDENCE_ROWS + 1 }, (_, k): [string, 'ok', string] => [`b${k + 1}`, 'ok', `Langkah ${k + 1}`]);
  addTestEvidence(c, 8, { id: 'panjang', kind: 'timeline', title: 'Linimasa panjang', rows: tooMany });
  addTestEvidence(c, 8, { id: 'berbaris', kind: 'document', title: 'Dokumen berbaris', body: 'Isi.', rows: [['x1', 'ok', 'Tidak tampil']] });
  addTestEvidence(c, 9, { id: 'foto', kind: 'photo', title: 'Foto uji', assetId: 'asset:foto-uji', body: 'Keterangan foto.' });
  delete c.text.id![textKey.evidenceTitle('r08', 'lama')];
  delete c.text.id![textKey.evidenceRow('r08', 'panjang', 'b1')];
  c.text.id![textKey.evidenceTitle('r09', 'foto')] = 'x'.repeat(TEXT_LIMITS.evidenceTitle + 1);
  c.text.id![textKey.evidenceRowValue('r08', 'panjang', 'b2')] = 'Lihat <b>ini</b>';

  const got = issueKeys(validateScenario(c, testValidationContext()));
  const want = [
    'error:evidence_count@rounds[6].evidence',
    'error:evidence_id_invalid@rounds[6].evidence[0].id',
    'error:text_missing@rounds[6].evidence[0].body',
    'error:evidence_rows@rounds[6].evidence[1].rows',
    'error:evidence_asset_missing@rounds[6].evidence[2].assetId',
    'error:evidence_id_duplicate@rounds[6].evidence[3].id',
    'error:evidence_row_id_duplicate@rounds[6].evidence[3].rows[1].id',
    'error:evidence_asset_unknown@rounds[6].evidence[4].assetId',
    'error:evidence_asset_unknown@rounds[7].evidence[0].assetId',
    'error:text_missing@rounds[7].evidence[0].title',
    'error:evidence_asset_unknown@rounds[7].evidence[1].assetId',
    'error:evidence_rows@rounds[7].evidence[2].rows',
    'error:text_missing@rounds[7].evidence[2].rows[0].label',
    'error:text_markup@rounds[7].evidence[2].rows[1].value',
    'warning:evidence_rows_unused@rounds[7].evidence[3].rows',
    'error:text_too_long@rounds[8].evidence[0].title',
  ];
  for (const w of want) assert.ok(got.includes(w), `expected ${w} in ${JSON.stringify(got)}`);
  const evidenceIssues = got.filter((k) => /evidence/.test(k));
  assert.deepEqual(evidenceIssues.sort(), [...want].sort(), 'nothing else about evidence');
  const msg = validateScenario(c, testValidationContext()).find((i) => i.field === 'rounds[6].evidence[1].rows')!.message;
  assert.equal(msg, `Babak 7, berkas 2: daftar periksa butuh 1–${MAX_EVIDENCE_ROWS} baris (sekarang 0).`);
});

test('validation: a dossier needs evidence, a field round a spotted item, a chat without a contact is flagged; respondents and replies', () => {
  const c = buildTestScenario();
  c.rounds[0]!.layout = 'dossier';
  c.rounds[1]!.layout = 'field';
  addTestEvidence(c, 2, { id: 'daftar', kind: 'checklist', title: 'Daftar uji', rows: [['a1', 'ok', 'Baris uji']] });
  c.rounds[2]!.layout = 'chat';
  c.rounds[2]!.lines = c.rounds[2]!.lines.map((l) => ({ ...l, speaker: 'narrator' }));
  c.rounds[3]!.respondent = { speaker: 'cast', castId: 'tidak-ada' };
  c.rounds[4]!.respondent = { speaker: 'cast', castId: null };
  c.text.id![textKey.choiceReply('r06', 'c1')] = 'Balasan tanpa tokoh.';
  c.text.id![textKey.timeoutReply('r07')] = 'Balasan waktu habis tanpa tokoh.';
  const got = issueKeys(validateScenario(c, testValidationContext()));
  for (const want of [
    'error:dossier_empty@rounds[0].evidence',
    'error:field_no_spot@rounds[1].evidence',
    'error:field_builtin_background@rounds[1].backgroundAssetId',
    'warning:chat_no_contact@rounds[2].lines',
    'error:respondent_cast_unknown@rounds[3].respondent.castId',
    'error:respondent_cast_unknown@rounds[4].respondent.castId',
    'warning:reply_without_respondent@rounds[5].respondent',
    'warning:reply_without_respondent@rounds[6].respondent',
  ]) {
    assert.ok(got.includes(want), `expected ${want} in ${JSON.stringify(got)}`);
  }

  // Fixed: a spot on the field item over an uploaded picture, evidence on the dossier, a contact in the chat, known respondents.
  c.rounds[1]!.evidence[0]!.spot = { x: 50, y: 50 };
  c.rounds[1]!.backgroundAssetId = GAMEPLAY.image;
  addTestEvidence(c, 1, { id: 'surat', kind: 'document', title: 'Surat uji', body: 'Isi surat uji.' });
  c.rounds[2]!.lines[0]!.speaker = 'customer';
  addTestCast(c, 'saksi', 'Pak Saksi');
  c.rounds[3]!.respondent = { speaker: 'cast', castId: 'saksi' };
  c.rounds[4]!.respondent = { speaker: 'customer', castId: null };
  c.rounds[5]!.respondent = { speaker: 'customer', castId: null };
  c.rounds[6]!.respondent = { speaker: 'cast', castId: 'saksi' };
  const fixed = validateScenario(c, testValidationContext());
  assert.deepEqual(fixed.filter((i) => i.severity === 'error'), []);
  assert.ok(!fixed.some((i) => ['chat_no_contact', 'reply_without_respondent'].includes(i.code)));

  // A customer/cast respondent is the chat contact even when every line of the chat is narration.
  const narrated = buildTestScenario();
  narrated.rounds[2]!.layout = 'chat';
  narrated.rounds[2]!.lines = narrated.rounds[2]!.lines.map((l) => ({ ...l, speaker: 'narrator' }));
  narrated.rounds[2]!.respondent = { speaker: 'customer', castId: null };
  assert.ok(!validateScenario(narrated, testValidationContext()).some((i) => i.code === 'chat_no_contact'));

  // An officer respondent needs the officer's name, like an officer line.
  const officer = buildTestScenario();
  officer.presentation.officerCharacterId = null;
  for (const r of officer.rounds) r.lines = r.lines.map((l) => (l.speaker === 'officer' ? { ...l, speaker: 'narrator' } : l));
  delete officer.text.id![textKey.officerName()];
  assert.deepEqual(errorsOf(officer), []);
  officer.rounds[0]!.respondent = { speaker: 'officer', castId: null };
  assert.deepEqual(errorsOf(officer).map((i) => [i.code, i.field]), [['text_missing', 'text.officerName']]);
});

test('validation: new texts are checked (limits, markup, placeholders); flag labels are optional and checked', () => {
  const c = buildGameplayScenario();
  const rid = c.rounds[GAMEPLAY.dossierRound - 1]!.id;
  c.text.id![textKey.roundAction(rid)] = 'x'.repeat(TEXT_LIMITS.action + 1);
  c.text.id![textKey.roundLesson(rid)] = 'Pelajaran {kota}';
  c.text.id![textKey.choiceReply(rid, 'c3')] = 'x'.repeat(TEXT_LIMITS.reply + 1);
  c.text.id![textKey.flagLabel(FEATURE.flag)] = '<i>Janji</i>';
  assert.deepEqual(errorsOf(c).map((i) => `${i.code}@${i.field}`), [
    `text_markup@text.flagLabel.${FEATURE.flag}`,
    'text_too_long@rounds[2].action',
    'placeholder_unknown@rounds[2].lesson',
    'text_too_long@rounds[2].choices[2].reply',
  ]);
  delete c.text.id![textKey.flagLabel(FEATURE.flag)];
  assert.ok(!errorsOf(c).some((i) => i.field.startsWith('text.flagLabel')), 'a flag label is optional');
});

test('evidence kicker: an authored label instead of the kind word travels with the shared evidence (else ""); optional, single-line and checked like the other texts', () => {
  const c = buildGameplayScenario();
  const dossier = GAMEPLAY.dossierRound - 1;
  const rid = c.rounds[dossier]!.id;
  assert.equal(textKey.evidenceKicker(rid, 'surat'), `round.${rid}.ev.surat.kicker`);
  assert.deepEqual(scenePublicOf(c, dossier, 'id')!.evidence.map((e) => [e.id, e.kicker]), [['surat', GAMEPLAY.documentKicker], ['daftar', '']]);
  assert.deepEqual(errorsOf(c), [], 'optional');

  assert.ok(!isMultilineKey(textKey.evidenceKicker(rid, 'surat')));
  const raw = JSON.parse(JSON.stringify(c)) as ScenarioContent;
  raw.text.id![textKey.evidenceKicker(rid, 'daftar')] = 'Daftar\nkontak\tuji';
  assert.equal(sanitizeScenarioContent(raw)!.text.id![textKey.evidenceKicker(rid, 'daftar')], 'Daftar kontak uji', 'line breaks and tabs become spaces');

  c.text.id![textKey.evidenceKicker(rid, 'surat')] = 'x'.repeat(TEXT_LIMITS.evidenceKicker + 1);
  c.text.id![textKey.evidenceKicker(rid, 'daftar')] = '<b>Daftar</b> {kota}';
  const errors = errorsOf(c);
  assert.deepEqual(errors.map((i) => `${i.code}@${i.field}`), [
    'text_too_long@rounds[2].evidence[0].kicker',
    'text_markup@rounds[2].evidence[1].kicker',
    'placeholder_unknown@rounds[2].evidence[1].kicker',
  ]);
  assert.match(errors[0]!.message, new RegExp(`^Babak 3: Label jenis berkas 1 terlalu panjang \\(maks ${TEXT_LIMITS.evidenceKicker} karakter\\)`));
});

test('validation: a field scene picture and evidence pictures must be UPLOADED images (built-in backgrounds have no file); officer_none only where the stage draws the officer', () => {
  const c = buildGameplayScenario();
  assert.deepEqual(errorsOf(c), [], 'uploaded pictures; built-in backgrounds stay fine for the other layouts');
  const field = c.rounds[GAMEPLAY.fieldRound - 1]!;
  field.backgroundAssetId = 'builtin:bg:parkiran';
  field.evidence[0]!.assetId = 'builtin:bg:parkiran';
  addTestEvidence(c, GAMEPLAY.dossierRound, { id: 'peta', kind: 'photo', title: 'Peta uji', assetId: 'builtin:bg:meja' });
  const errors = errorsOf(c);
  assert.deepEqual(errors.map((i) => `${i.code}@${i.field}`), [
    'evidence_asset_builtin@rounds[2].evidence[2].assetId',
    'field_builtin_background@rounds[4].backgroundAssetId',
    'evidence_asset_builtin@rounds[4].evidence[0].assetId',
  ]);
  assert.match(errors[1]!.message, /^Babak 5: adegan lapangan butuh gambar latar hasil unggahan/);
  assert.match(errors[0]!.message, /^Babak 3, berkas 3: latar bawaan tidak punya berkas gambar/);
  // The same built-in background is a valid scene for a stage round, and unknown/archived pictures keep their own errors.
  field.layout = 'stage';
  field.backgroundAssetId = 'builtin:bg:meja';
  assert.ok(!errorsOf(c).some((i) => i.code === 'field_builtin_background'));
  c.rounds[GAMEPLAY.dossierRound - 1]!.evidence[2]!.assetId = 'asset:foto-lama';
  assert.ok(errorsOf(c).some((i) => i.code === 'evidence_asset_unknown' && i.field === 'rounds[2].evidence[2].assetId'));

  const officerless = buildGameplayScenario();
  officerless.presentation.officerCharacterId = null;
  const showing = officerless.rounds.flatMap((r, i) => (r.showOfficer ? [`${i + 1}:${r.layout}`] : []));
  assert.ok(showing.includes(`${GAMEPLAY.dossierRound}:dossier`) && showing.includes(`${GAMEPLAY.fieldRound}:field`), 'non-stage rounds that tick showOfficer');
  const warned = validateScenario(officerless, testValidationContext()).filter((i) => i.code === 'officer_none').map((i) => i.round);
  assert.deepEqual(warned, officerless.rounds.flatMap((r, i) => (r.layout === 'stage' && r.showOfficer ? [i + 1] : [])), 'only stage rounds draw the officer');
  assert.ok(warned.length > 0);
});

test('validation: {nama} may not appear in the scenario title or a round title (they show raw on staff reports and in the CSV)', () => {
  const c = buildTestScenario();
  c.text.id![textKey.title()] = 'Kasus pertama {nama}';
  c.text.id![textKey.roundTitle('r02')] = 'Kabar untuk {nama}';
  c.text.id![textKey.roundMeta('r03')] = 'Hari pertama {nama}';
  c.text.id![textKey.endingTitle('happy')] = 'Selamat, {nama}';
  const errors = errorsOf(c);
  assert.deepEqual(errors.map((i) => [i.code, i.round, i.field]), [
    ['placeholder_in_title', null, 'text.title'],
    ['placeholder_in_title', 2, 'rounds[1].title'],
  ]);
  assert.match(errors[1]!.message, /^Babak 2: Judul babak tidak boleh memuat \{nama\}/);
});

test('validation: authoring guidance warns about long options, a recommended option that stands out by length, and long lessons (never errors)', () => {
  const c = buildTestScenario();
  const set = (rid: string, cid: string, text: string) => (c.text.id![textKey.choiceText(rid, cid)] = text);
  // Round 1: the recommended option (c1) is by far the longest.
  set('r01', 'c1', 'Periksa berkas lalu kabari customer tentang tahap berikutnya.');
  set('r01', 'c2', 'Ajukan berkas sekarang juga.');
  set('r01', 'c3', 'Tunggu kabar dari komite.');
  set('r01', 'c4', 'Janjikan klaim pasti cair.');
  set('r01', 'c5', 'Minta customer menunggu.');
  // Round 2: a wrong option of 22 words (the recommended one is not longest, so no length hint).
  set('r02', 'c3', 'Kirim pesan panjang yang menjelaskan semua hal satu per satu kepada customer tanpa jeda dan tanpa memeriksa apakah ia sudah paham isinya');
  // Round 3: a lesson of 31 words.
  c.text.id![textKey.roundLesson('r03')] = `Pelajaran ${'kata '.repeat(30)}`.trim();
  // Round 4: the recommended option is the longest, but less than 1.5x the median of the others.
  set('r04', 'c1', 'Kabari customer tentang tahap klaim hari ini.');
  set('r04', 'c2', 'Ajukan berkas lengkap kepada komite.');
  set('r04', 'c3', 'Tunggu kabar komite lalu telepon.');
  set('r04', 'c4', 'Janjikan klaim cair minggu depan.');
  set('r04', 'c5', 'Minta customer menunggu kabar.');
  const issues = validateScenario(c, testValidationContext());
  const of = (code: string) => issues.filter((i) => i.code === code).map((i) => [i.severity, i.round, i.field]);
  assert.deepEqual(of('choice_length_hint'), [['warning', 1, 'rounds[0].choices[0].text']]);
  assert.deepEqual(of('choice_long'), [['warning', 2, 'rounds[1].choices[2].text']]);
  assert.deepEqual(of('lesson_long'), [['warning', 3, 'rounds[2].lesson']]);
  assert.equal(issues.find((i) => i.code === 'choice_length_hint')!.message.startsWith('Babak 1: Pilihan 1 (tepat) paling panjang (61 karakter; median pilihan lain 26)'), true);
  assert.equal(issues.find((i) => i.code === 'choice_long')!.message, `Babak 2: Teks pilihan 3 panjang (22 kata); usahakan 8–16 kata, paling banyak ${AUTHORING_HINTS.choiceWordsMax}.`);
  assert.deepEqual(errorsOf(c), [], 'guidance never blocks publication');
});

test('validation: options marked as actions that are never tepat get a guidance warning (players would learn the mark as a sign of a wrong answer); a single one or a tepat action does not', () => {
  const c = buildGameplayScenario();
  const hints = () => validateScenario(c, testValidationContext()).filter((i) => i.code === 'choice_form_hint');
  assert.deepEqual(c.rounds.flatMap((r) => r.choices.filter((x) => x.form === 'action').map((x) => x.classification)), ['kurang_tepat']);
  assert.deepEqual(hints(), [], 'one action option teaches no pattern');
  c.rounds[6]!.choices[2]!.form = 'action'; // round 7, c3 keliru
  assert.equal(AUTHORING_HINTS.actionMarkMinOptions, 2);
  assert.deepEqual(hints().map((i) => [i.severity, i.round, i.field]), [
    ['warning', GAMEPLAY.chatRound, 'rounds[1].choices[4].form'],
    ['warning', 7, 'rounds[6].choices[2].form'],
  ]);
  assert.match(hints()[0]!.message, /^Babak 2, pilihan 5: tidak satu pun dari 2 pilihan berbentuk “Tindakan, bukan pesan” di skenario ini tepat/);
  assert.deepEqual(errorsOf(c), [], 'guidance never blocks publication');
  c.rounds[9]!.choices[0]!.form = 'action'; // round 10, c1 tepat
  assert.deepEqual(hints(), [], 'a tepat action breaks the pattern');
});

test('validation: a flag left in more than one round is a warning (reminders name the latest round that leaves it)', () => {
  const c = addTestDelayedConsequence(buildTestScenario(), { flag: 'janji', setRound: 3, choiceId: 'c2', effectRound: 9, moodDelta: -6 });
  c.rounds[2]!.choices[3]!.setsFlag = 'janji';
  assert.ok(!validateScenario(c, testValidationContext()).some((i) => i.code === 'flag_multi_round'), 'several choices of ONE round may leave the same flag');
  c.rounds[5]!.choices[1]!.setsFlag = 'janji';
  const multi = validateScenario(c, testValidationContext()).filter((i) => i.code === 'flag_multi_round');
  assert.deepEqual(multi.map((i) => [i.severity, i.round, i.field]), [['warning', 6, 'rounds[5].choices[1].setsFlag']]);
  assert.match(multi[0]!.message, /^Babak 6, pilihan 2: tanda "janji" juga ditinggalkan di Babak 3;/);
  assert.equal(flagSourceIndex(c.rounds, 'janji', 8), 5, 'latest round before round 9');
  assert.equal(flagSourceIndex(c.rounds, 'janji', 5), 2);
  assert.equal(flagSourceIndex(c.rounds, 'janji', 2), null, 'not left before round 3');
  assert.equal(flagSourceIndex(c.rounds, 'lain', 15), null);
});

// ------------------------------------------------------------------ v2 engine, scene and summary

test('engine: the delayed change splits per flag in authored order; what clamping cut is taken from the last effects pushing that way', () => {
  const base = buildTestScenario().rounds[0]!;
  const round = { ...base, flagEffects: [{ flag: 'fa', moodDelta: -12 }, { flag: 'fb', moodDelta: -3 }, { flag: 'fc', moodDelta: 5 }] };
  const all = new Set(['fa', 'fb', 'fc']);
  const split = (carried: number, flags: ReadonlySet<string>) => delayedEffectsOf(round, flags, moodAtRoundStart(round, carried, flags).delayedDelta);
  assert.deepEqual(split(50, all), [{ flag: 'fa', delta: -12 }, { flag: 'fb', delta: -3 }, { flag: 'fc', delta: 5 }], 'no clamping: the authored deltas');
  // 6 − 10 clamps at 0: −6 applied; the 4 points cut come from fb (−3 → 0), then fa (−12 → −11).
  assert.deepEqual(split(6, all), [{ flag: 'fa', delta: -11 }, { flag: 'fb', delta: 0 }, { flag: 'fc', delta: 5 }]);
  assert.deepEqual(split(98, new Set(['fc'])), [{ flag: 'fc', delta: 2 }]);
  assert.deepEqual(split(50, new Set(['fb', 'lain'])), [{ flag: 'fb', delta: -3 }], 'only the held flags');
  assert.deepEqual(split(50, new Set()), []);
  const mixed = { ...base, flagEffects: [{ flag: 'fa', moodDelta: 10 }, { flag: 'fb', moodDelta: -10 }] };
  assert.deepEqual(delayedEffectsOf(mixed, all, moodAtRoundStart(mixed, 95, all).delayedDelta), [{ flag: 'fa', delta: 10 }, { flag: 'fb', delta: -10 }], 'opposite effects cancel without clamping');
  for (const carried of [0, 3, 50, 97, 100]) {
    const applied = moodAtRoundStart(round, carried, all).delayedDelta;
    assert.equal(delayedEffectsOf(round, all, applied).reduce((n, e) => n + e.delta, 0), applied, `shares add up at ${carried}`);
  }
});

test('scene: evidence, respondent and action label are public in every phase; the lesson only once the answers are closed; no keys', () => {
  const c = buildGameplayScenario();
  const dossier = scenePublicOf(c, GAMEPLAY.dossierRound - 1, 'id', 'answering')!;
  assert.deepEqual([dossier.layout, dossier.action, dossier.respondent], ['dossier', GAMEPLAY.action, { speaker: 'customer', name: 'Bu Rina' }]);
  assert.deepEqual(dossier.evidence, [
    { id: 'surat', kind: 'document', kicker: GAMEPLAY.documentKicker, title: GAMEPLAY.documentTitle, body: GAMEPLAY.documentBody, assetId: null, spot: null, rows: [] },
    {
      id: 'daftar',
      kind: 'checklist',
      kicker: '',
      title: GAMEPLAY.checklistTitle,
      body: '',
      assetId: null,
      spot: null,
      rows: [
        { id: 'formulir', mark: 'ok', label: 'Formulir uji', value: '' },
        { id: 'foto', mark: 'missing', label: 'Foto uji', value: '' },
        { id: 'surat', mark: 'check', label: 'Surat keterangan uji', value: 'perlu dicek' },
      ],
    },
  ]);
  const field = scenePublicOf(c, GAMEPLAY.fieldRound - 1, 'id', 'scene')!;
  assert.deepEqual(field.evidence.map((e) => [e.id, e.kind, e.assetId, e.spot]), [
    ['foto', 'photo', GAMEPLAY.image, { x: 30, y: 60 }],
    ['urutan', 'timeline', null, { x: 70, y: 40 }],
  ]);
  assert.deepEqual([field.layout, field.action, field.respondent], ['field', '', { speaker: 'cast', name: FEATURE.castName }]);
  assert.equal(scenePublicOf(c, 0, 'id', 'consequence')!.respondent, null, 'no respondent = narration only');

  const lessonIn = (phase?: StoryPhase) => scenePublicOf(c, GAMEPLAY.dossierRound - 1, 'id', phase)!.lesson;
  assert.equal(lessonIn(), '', 'hidden by default');
  for (const phase of ['lobby', 'scene', 'answering'] as const) assert.equal(lessonIn(phase), '', phase);
  assert.deepEqual([...LESSON_PHASES], ['consequence', 'leaderboard', 'finished', 'interrupted']);
  for (const phase of LESSON_PHASES) assert.equal(lessonIn(phase), GAMEPLAY.lesson, phase);

  for (let i = 0; i < c.rounds.length; i++) {
    const json = JSON.stringify(scenePublicOf(c, i, 'id', 'leaderboard'));
    for (const secret of ['classification', 'accuracy', 'moodDelta', 'setsFlag', 'flagEffects', FEATURE.flag, FEATURE.flagLine, FEATURE.roundNote, GAMEPLAY.chatReplyC1, GAMEPLAY.timeoutReply, GAMEPLAY.castReply]) {
      assert.ok(!json.includes(secret), `round ${i + 1} public scene leaks ${secret}`);
    }
  }
});

/** Summary input for a participant's decisions (sparse by round index); ended only when an ending id is given. */
function summaryInputOf(c: ScenarioContent, decisions: readonly (DecisionResult | undefined)[], endingId: string | null = null): SummaryInput {
  const settled = decisions.filter((d): d is DecisionResult => Boolean(d));
  return {
    content: c,
    decisions,
    endingId,
    rank: null,
    complete: endingId !== null,
    finalMood: settled[settled.length - 1]?.moodAfter ?? c.initialMood,
    scorePolicyId: STORY_SCORE_POLICY.id,
    scenarioTitle: 'Uji',
    versionNo: 1,
    roomCode: 'ABCDEF',
    answerWindowMs: STORY_SCORE_POLICY.answerWindowMs,
  };
}

test('scene: a flag holder gets private reminders of the delayed effects of the round (label, round that left it, applied change)', () => {
  const c = buildGameplayScenario();
  const effect = FEATURE.effectRound - 1;
  const held = new Set([FEATURE.flag]);
  assert.deepEqual(participantSceneOf(c, effect, 31, held, 'id').flagReminders, [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }]);
  assert.deepEqual(participantSceneOf(c, effect, 5, held, 'id').flagReminders, [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: -5 }], 'the clamped change');
  assert.deepEqual(participantSceneOf(c, effect, 31, new Set(), 'id').flagReminders, [], 'nothing without the flag');
  assert.deepEqual(participantSceneOf(c, effect + 1, 31, held, 'id').flagReminders, [], 'only in the round that reacts');
  delete c.text.id![textKey.flagLabel(FEATURE.flag)];
  assert.equal(participantSceneOf(c, effect, 31, held, 'id').flagReminders[0]!.label, '', 'no label authored: the client words it');
});

test('summary: consequence views carry the reply, respondent, lesson and labelled delayed effects; the final summary notes where a flag took effect', () => {
  const c = buildGameplayScenario();
  const chat = GAMEPLAY.chatRound - 1;
  const effect = FEATURE.effectRound - 1;
  const run = playThrough(c, () => ({ choiceId: 'c2', elapsedMs: 1_000 }));
  const before = (i: number) => flagsOf(c.rounds, run.decisions.slice(0, i));

  const v2 = consequenceViewOf(c, chat, run.decisions[chat]!, 'id', before(chat));
  assert.deepEqual([v2.reply, v2.respondentName, v2.lesson, v2.delayed, v2.flagSet], [GAMEPLAY.chatReplyC2, 'Bu Rina', GAMEPLAY.lesson, [], null]);
  const v4 = consequenceViewOf(c, effect, run.decisions[effect]!, 'id', before(effect));
  assert.deepEqual([v4.reply, v4.respondentName, v4.lesson, v4.delayedDelta], ['', null, GAMEPLAY.effectLesson, FEATURE.delayedDelta]);
  assert.deepEqual(v4.delayed, [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }]);
  assert.deepEqual(consequenceViewOf(c, effect, run.decisions[effect]!).delayed, [], 'without the earlier flags: no labelled effects');
  const timeout = resolveDecision(c.rounds[chat]!, 25, null, null);
  assert.equal(consequenceViewOf(c, chat, timeout).reply, GAMEPLAY.timeoutReply);
  const field = GAMEPLAY.fieldRound - 1;
  const castPick = resolveDecision(c.rounds[field]!, 25, c.rounds[field]!.choices[0]!, 2_000);
  assert.deepEqual([consequenceViewOf(c, field, castPick).reply, consequenceViewOf(c, field, castPick).respondentName], [GAMEPLAY.castReply, FEATURE.castName]);

  const summary = buildSummary(summaryInputOf(c, run.decisions, run.ending.id));
  assert.deepEqual(summary.decisions[chat]!.flagSet, { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: FEATURE.delayedDelta }, 'the round that SET the flag');
  assert.deepEqual(summary.decisions[effect]!.delayed, [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }], 'the round where it took effect');
  assert.ok(summary.decisions.every((d, i) => (i === chat ? d.flagSet !== null : d.flagSet === null)));
  assert.ok(summary.decisions.every((d, i) => (i === effect ? d.delayed.length === 1 : d.delayed.length === 0)));

  // The room ended before the effect round: the flag is noted without an effect.
  const early = buildSummary(summaryInputOf(c, run.decisions.slice(0, effect)));
  assert.deepEqual(early.decisions[chat]!.flagSet, { label: GAMEPLAY.flagLabel, effectRound: null, delta: null });
  // A low mood clamps the effect: the summary shows the change actually applied.
  const low = playThrough(c, (_r, i) => ({ choiceId: i === chat ? 'c2' : 'c4', elapsedMs: 1_000 }));
  assert.equal(low.decisions[effect]!.delayedDelta, -3, '25 − 12 + 2 − 12 = 3 carried into round 4; −12 clamps at 0');
  assert.deepEqual(buildSummary(summaryInputOf(c, low.decisions, low.ending.id)).decisions[chat]!.flagSet, { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: -3 });
  // A round reacting with a conditional line only: the effect round is named, without a change.
  const lineOnly = buildGameplayScenario();
  lineOnly.rounds[effect]!.flagEffects = [];
  const lineRun = playThrough(lineOnly, () => ({ choiceId: 'c2', elapsedMs: 1_000 }));
  assert.deepEqual(buildSummary(summaryInputOf(lineOnly, lineRun.decisions, lineRun.ending.id)).decisions[chat]!.flagSet, { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: null });
});

test('summary: the consequence view carries the form of the own choice (an action stays an action after close); a timeout and a summary stored before the field read "message"', () => {
  const c = buildGameplayScenario();
  const chat = GAMEPLAY.chatRound - 1;
  const round = c.rounds[chat]!;
  const viewOf = (choiceId: string | null) => {
    const choice = choiceId === null ? null : round.choices.find((x) => x.id === choiceId)!;
    return consequenceViewOf(c, chat, resolveDecision(round, 25, choice, choice ? 4_000 : null));
  };
  assert.deepEqual([viewOf(GAMEPLAY.actionChoice).chosenText, viewOf(GAMEPLAY.actionChoice).chosenForm], [GAMEPLAY.actionText, 'action']);
  assert.deepEqual([viewOf('c1').chosenForm, viewOf(null).chosenForm, viewOf(null).chosenText], ['message', 'message', null]);

  // The final summary keeps the form per decision; one stored before the field existed reads every decision as a message.
  const run = playThrough(c, (_round, i) => ({ choiceId: i === chat ? GAMEPLAY.actionChoice : 'c1', elapsedMs: 3_000 }));
  const summary = buildSummary(summaryInputOf(c, run.decisions, run.ending.id));
  assert.deepEqual(summary.decisions.map((d) => d.chosenForm), summary.decisions.map((_, i) => (i === chat ? 'action' : 'message')));
  const stored = JSON.parse(JSON.stringify(summary)) as StoryFinalSummary;
  const legacy = { ...stored, decisions: stored.decisions.map(({ chosenForm: _form, ...d }) => d) };
  assert.ok(withSummaryDefaults(legacy as StoryFinalSummary).decisions.every((d) => d.chosenForm === 'message'));
});

test('summary: labels carry the scenario names and status words, exactly as the live label shows them', () => {
  const c = buildFeatureScenario();
  const run = playThrough(c, () => ({ choiceId: 'c1', elapsedMs: 1_000 }));
  const s = buildSummary(summaryInputOf(c, run.decisions, run.ending.id));
  assert.deepEqual(s.labels, { customerName: 'Bu Rina', officerName: 'Miss Raksa', officerCharacterId: 'builtin:char:miss-raksa', moodLabels: FEATURE.moodLabels });
  const live = scenarioLabelOf(c, 'id', { scenarioId: 's1', title: 'Uji', versionNo: 1, categoryName: 'Auto', contentKind: 'demo' });
  assert.deepEqual(s.labels, { customerName: live.customerName, officerName: live.officerName, officerCharacterId: live.officerCharacterId, moodLabels: live.moodLabels });
  c.presentation.officerCharacterId = null;
  assert.deepEqual([summaryLabelsOf(c, 'id').officerName, summaryLabelsOf(c, 'id').officerCharacterId], [null, null], 'no officer character: no officer name (as in the live label)');
  assert.equal(summaryLabelsOf(buildTestScenario(), 'id').moodLabels, null, 'default status words');
});

// ------------------------------------------------------------------ option audit (authoring guidance)

test('audit: words count whitespace tokens ({nama} is one word); characters are code points', () => {
  assert.equal(wordCount('Halo {nama}, apa kabar?'), 4);
  assert.equal(wordCount('  satu\tdua\ntiga  '), 3);
  assert.equal(wordCount('   '), 0);
  assert.equal(charCount('Café 😀'), 6);
  assert.equal(charCount('{nama}'), 6);
});

test('audit: length ranks with shared ties, the recommended option rank, and the longest/shortest strategies (worst/best/expected, points under policy v2)', () => {
  const c = buildTestScenario();
  const set = (rid: string, texts: string[]) => texts.forEach((text, k) => (c.text.id![textKey.choiceText(rid, `c${k + 1}`)] = text));
  // c1 is tepat, c2 kurang tepat 0.5, c3/c4 keliru, c5 kurang tepat 0.25 (fixture template).
  set('r01', ['Periksa berkas lalu kabari customer tentang tahap berikutnya.', 'Ajukan berkas sekarang juga.', 'Tunggu kabar dari komite.', 'Janjikan klaim pasti cair.', 'Minta customer menunggu.']);
  set('r02', ['Kabari customer tentang tahap klaim hari ini.', 'Ajukan berkas sekarang juga.', 'Tanyai customer tentang tahap klaim hari ini.', 'Janjikan klaim pasti cair.', 'Minta customer menunggu.']);
  set('r03', ['Kabari customer.', 'Ajukan berkas sekarang juga.', 'Tunggu kabar dari komite.', 'Janjikan klaim pasti cair.', 'Minta customer menunggu.']);
  // Rounds 4–15 keep the fixture's equal-length texts: a five-way tie at both ends.

  const audit = auditOptions(c, 'id');
  const [r1, r2, r3, r4] = audit.rounds;
  assert.deepEqual(r1!.options.map((o) => [o.choiceId, o.classification, o.accuracy, o.words, o.chars, o.rankLongest]), [
    ['c1', 'tepat', 1, 8, 61, 1],
    ['c2', 'kurang_tepat', 0.5, 4, 28, 2],
    ['c3', 'keliru', 0, 4, 25, 4],
    ['c4', 'keliru', 0, 4, 26, 3],
    ['c5', 'kurang_tepat', 0.25, 3, 24, 5],
  ]);
  assert.deepEqual([r1!.recommendedRank, r1!.recommendedIsLongest, r1!.recommendedIsShortest, r1!.tieAtTop], [1, true, false, false]);
  assert.deepEqual(r2!.options.map((o) => o.rankLongest), [1, 3, 1, 4, 5], 'ties share the best rank');
  assert.deepEqual([r2!.recommendedRank, r2!.recommendedIsLongest, r2!.tieAtTop], [1, true, true]);
  assert.deepEqual([r3!.recommendedRank, r3!.recommendedIsLongest, r3!.recommendedIsShortest], [5, false, true]);
  assert.deepEqual([r4!.options.map((o) => o.rankLongest), r4!.recommendedIsLongest, r4!.recommendedIsShortest, r4!.tieAtTop], [[1, 1, 1, 1, 1], true, true, true]);
  assert.deepEqual(auditRound(c, c.rounds[0]!, 'id'), r1, 'the per-round audit is the same');

  // Longest: r1 sure tepat (850 at 15 s); r2 tie of tepat+keliru (expected 0.5, (850 + 0) / 2); r3 picks kurang tepat 0.5 (500);
  // r4–r15 five-way ties (expected 0.2 each; (850 + 500 + 0 + 0 + 325) / 5 = 335 each).
  assert.deepEqual(audit.longest, { tepatWorst: 1, tepatBest: 14, tepatExpected: 3.9, expectedPoints: 850 + 425 + 500 + 12 * 335 });
  // Shortest: r1 and r2 pick kurang tepat 0.25 (325); r3 sure tepat (850).
  assert.deepEqual(audit.shortest, { tepatWorst: 1, tepatBest: 13, tepatExpected: 3.4, expectedPoints: 325 + 325 + 850 + 12 * 335 });
  // At 0 s under story-70-30-v2 (speed points not scaled by accuracy: kurang tepat 0.5 = 650).
  assert.equal(auditOptions(c, 'id', 0).longest.expectedPoints, 1000 + 500 + 650 + 12 * ((1000 + 650 + 0 + 0 + 475) / 5));

  const none = structuredClone(c);
  for (const ch of none.rounds[0]!.choices) ch.classification = 'keliru';
  assert.deepEqual([auditRound(none, none.rounds[0]!, 'id').recommendedRank, auditRound(none, none.rounds[0]!, 'id').recommendedIsLongest], [0, false], 'a draft round without a recommended option');
  const broken = structuredClone(c);
  broken.rounds[0]!.choices[0]!.accuracy = 7;
  assert.doesNotThrow(() => auditOptions(broken, 'id'), 'an invalid draft weight never throws (it counts 0 points)');
});
