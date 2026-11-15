import assert from 'node:assert/strict';
import test from 'node:test';
import { EVIDENCE_KINDS, EVIDENCE_MARKS, ROUND_LAYOUTS, type MoodBand } from '../../../../shared/story/content';
import type { StoryEvidence, StorySceneLine, StoryScenePublic } from '../../../../shared/story/protocol';
import ruang from '../../i18n/kamus/ruang';
import {
  ACTION_FORM_KEY,
  actionLabelOf,
  arrowTarget,
  bringIntoViewDelta,
  clearOfBarDelta,
  evidenceTurnMs,
  causalNotesOf,
  chatContactOf,
  confirmLabelOf,
  DEFAULT_ACTION_KEY,
  draftKey,
  fieldMarkersOf,
  isAfterClosePhase,
  markWordKey,
  privateOfRound,
  readDraft,
  revealedLineCount,
  revealsLines,
  roundMoodOf,
  roundViewOf,
  showsRows,
  statusChangeOf,
  trayDeadlineOf,
  trayStateOf,
  writeDraft,
  type DraftStorage,
} from './roundModel';

// Synthetic content (a delayed parcel); no settled-case text.
const line = (id: string, pos: number, speaker: StorySceneLine['speaker'], name: string | null): StorySceneLine => ({ id, pos, speaker, name, text: `Teks ${id}` });

function scene(over: Partial<StoryScenePublic> = {}): StoryScenePublic {
  return {
    roundId: 'r05',
    roundNumber: 5,
    title: 'Paket tertahan',
    meta: '',
    keyRound: false,
    layout: 'chat',
    prompt: 'Apa balasanmu?',
    backgroundAssetId: 'asset:latar',
    showOfficer: false,
    mediaAssetId: null,
    intro: [],
    lines: [line('l1', 0, 'narrator', null), line('l2', 1, 'customer', 'Pak Joko')],
    action: '',
    evidence: [],
    respondent: { speaker: 'customer', name: 'Pak Joko' },
    lesson: '',
    ...over,
  };
}

const evidence = (id: string, spot: StoryEvidence['spot']): StoryEvidence => ({ id, kind: 'document', kicker: '', title: `Berkas ${id}`, body: 'Isi', assetId: null, spot, rows: [] });

/** In-memory sessionStorage stand-in. */
function memoryStorage(): DraftStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
const broken: DraftStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('full');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

test('actionLabelOf: the round own label wins (trimmed), else the layout default word', () => {
  const words: Record<string, string> = { 'ruang.aksi.chat': 'Kirim balasan', 'ruang.aksi.field': 'Tetapkan tindakan' };
  const translate = (key: string) => words[key] ?? key;
  assert.equal(actionLabelOf({ action: '', layout: 'chat' }, translate), 'Kirim balasan');
  assert.equal(actionLabelOf({ action: '   ', layout: 'field' }, translate), 'Tetapkan tindakan');
  assert.equal(actionLabelOf({ action: ' Ajukan berkas ', layout: 'dossier' }, translate), 'Ajukan berkas');
});

test('confirmLabelOf: a chosen chat action is confirmed as an action; a message, no choice or another activity keeps the round label', () => {
  const translate = (key: string) => (key === ACTION_FORM_KEY ? 'Tetapkan tindakan' : key);
  assert.equal(confirmLabelOf({ layout: 'chat', actionLabel: 'Kirim balasan', selectedForm: 'action' }, translate), 'Tetapkan tindakan');
  assert.equal(confirmLabelOf({ layout: 'chat', actionLabel: 'Kirim balasan', selectedForm: 'message' }, translate), 'Kirim balasan');
  assert.equal(confirmLabelOf({ layout: 'chat', actionLabel: 'Kirim balasan', selectedForm: null }, translate), 'Kirim balasan');
  assert.equal(confirmLabelOf({ layout: 'dossier', actionLabel: 'Ajukan berkas', selectedForm: 'action' }, translate), 'Ajukan berkas');
  assert.equal(confirmLabelOf({ layout: 'stage', actionLabel: 'Tetapkan pilihan', selectedForm: 'action' }, translate), 'Tetapkan pilihan');
});

test('every kamus key the round model computes exists in Indonesian and English', () => {
  const keys = [...ROUND_LAYOUTS.map((l) => DEFAULT_ACTION_KEY[l]), ACTION_FORM_KEY, ...EVIDENCE_KINDS.map((k) => `ruang.jenis.${k}`)];
  for (const kind of EVIDENCE_KINDS) for (const mark of EVIDENCE_MARKS) keys.push(markWordKey(kind, mark) ?? '');
  for (const key of keys.filter(Boolean)) {
    const name = key.replace(/^ruang\./, '');
    assert.ok(ruang.id[name], `id: ${key}`);
    assert.ok(ruang.en[name], `en: ${key}`);
  }
});

test('selection draft: one key per room and round; only a current option is restored; storage failures never throw', () => {
  assert.equal(draftKey('K7M2QX', 'r05'), 'raksa:story:pilih:K7M2QX:r05');
  const s = memoryStorage();
  const key = draftKey('K7M2QX', 'r05');
  writeDraft(s, key, 'h3');
  assert.equal(readDraft(s, key, ['h1', 'h2', 'h3']), 'h3');
  assert.equal(readDraft(s, key, ['h7', 'h8']), null, 'a handle of other options (another participant, an older shuffle) is ignored');
  assert.equal(readDraft(s, draftKey('K7M2QX', 'r06'), ['h3']), null, 'another round starts empty');
  writeDraft(s, key, null);
  assert.equal(s.data.size, 0);
  assert.equal(readDraft(null, key, ['h3']), null);
  assert.equal(readDraft(broken, key, ['h3']), null);
  assert.doesNotThrow(() => writeDraft(broken, key, 'h3'));
  assert.doesNotThrow(() => writeDraft(broken, key, null));
});

test('revealedLineCount: lines arrive from the scene start; everything once reading is over, outside the scene, reduced motion or without a start', () => {
  const base = { phase: 'scene' as const, sceneStartedAt: 10_000, readingMs: 20_000, total: 5, reduced: false };
  // 20 s reading over 5 lines: one line every 1.2 s, the first at once.
  assert.equal(revealedLineCount({ ...base, now: 10_000 }), 1);
  assert.equal(revealedLineCount({ ...base, now: 11_199 }), 1);
  assert.equal(revealedLineCount({ ...base, now: 11_200 }), 2);
  assert.equal(revealedLineCount({ ...base, now: 14_800 }), 5);
  assert.equal(revealedLineCount({ ...base, now: 9_000 }), 1, 'device clock slightly ahead of the scene start');
  assert.equal(revealedLineCount({ ...base, now: 30_000 }), 5, 'reading time over');
  assert.equal(revealedLineCount({ ...base, phase: 'answering', now: 10_000 }), 5);
  assert.equal(revealedLineCount({ ...base, reduced: true, now: 10_000 }), 5);
  assert.equal(revealedLineCount({ ...base, sceneStartedAt: null, now: 10_000 }), 5);
  // Snapshots of servers that predate the field lack it entirely.
  const older = { ...base, sceneStartedAt: undefined as unknown as null, readingMs: undefined as unknown as null };
  assert.equal(revealedLineCount({ ...older, now: 10_000 }), 5);
  assert.equal(revealedLineCount({ ...base, total: 0, now: 10_000 }), 0);
});

test('revealedLineCount: the readiness grace never takes back a line already shown (the count only grows with time)', () => {
  // The server extends the scene (phaseEndsAt/phaseDurationMs move); the reveal ignores them and only reads the start.
  const base = { phase: 'scene' as const, sceneStartedAt: 0, readingMs: 8_000, total: 6, reduced: false };
  let last = 0;
  for (let now = 0; now <= 8_000 + 8_000; now += 250) {
    const n = revealedLineCount({ ...base, now });
    assert.ok(n >= last, `t=${now}: ${n} < ${last}`);
    last = n;
  }
  assert.equal(last, 6);
});

test('revealsLines: messages and dialogue arrive one by one; a desk or a field brief is shown whole', () => {
  assert.deepEqual(
    ROUND_LAYOUTS.map((l) => [l, revealsLines(l)]),
    [
      ['stage', true],
      ['chat', true],
      ['dossier', false],
      ['field', false],
    ],
  );
});

test('chatContactOf: the respondent, else the first named incoming sender, else the round title (no invented person)', () => {
  assert.deepEqual(chatContactOf(scene()), { name: 'Pak Joko', person: true });
  const castFirst = scene({ respondent: { speaker: 'cast', name: 'Kak Lia' } });
  assert.deepEqual(chatContactOf(castFirst), { name: 'Kak Lia', person: true }, 'the respondent wins over earlier senders');
  assert.deepEqual(chatContactOf(scene({ respondent: { speaker: 'officer', name: 'Mentor Uji' } })), { name: 'Pak Joko', person: true }, 'the officer is the player side');
  assert.deepEqual(chatContactOf(scene({ respondent: { speaker: 'cast', name: null } })), { name: 'Pak Joko', person: true });
  const narration = scene({ respondent: null, lines: [line('l1', 0, 'narrator', null)] });
  assert.deepEqual(chatContactOf(narration), { name: 'Paket tertahan', person: false });
  const officerOnly = scene({ respondent: null, lines: [line('l1', 0, 'officer', 'Mentor Uji')] });
  assert.deepEqual(chatContactOf(officerOnly), { name: 'Paket tertahan', person: false });
});

test('roundMoodOf: the status at the round start; a delayed effect shown with its change (and the band before it); nothing after close', () => {
  const word = (b: string) => `kata:${b}`;
  assert.deepEqual(roundMoodOf({ phase: 'scene', mood: 30, reminders: [], word }), { label: 'kata:kecewa', band: 'kecewa' });
  // Carried 65 (tenang), −12 at the start -> 53 (ragu): shown as tenang -> ragu · −12.
  const promise = [{ label: 'Janji', fromRound: 12, delta: -12 }];
  assert.deepEqual(roundMoodOf({ phase: 'answering', mood: 53, reminders: promise, word }), { label: 'kata:ragu', band: 'ragu', changedFrom: 'kata:tenang', delayedDelta: -12 });
  assert.deepEqual(roundMoodOf({ phase: 'scene', mood: 45, reminders: [{ label: '', fromRound: 3, delta: -5 }], word }), { label: 'kata:ragu', band: 'ragu', delayedDelta: -5 }, 'same band: the change is still shown');
  assert.deepEqual(roundMoodOf({ phase: 'scene', mood: 88, reminders: [{ label: 'Janji', fromRound: 12, delta: -12 }, { label: 'Lain', fromRound: 9, delta: 4 }], word }), { label: 'kata:senang', band: 'senang', delayedDelta: -8 }, 'several effects: their sum');
  assert.deepEqual(roundMoodOf({ phase: 'scene', mood: 45, reminders: [{ label: 'Janji', fromRound: 3, delta: 0 }], word }), { label: 'kata:ragu', band: 'ragu' }, 'an effect clamped to nothing shows no number');
  assert.equal(roundMoodOf({ phase: 'consequence', mood: 53, reminders: [], word }), null);
  assert.equal(roundMoodOf({ phase: 'leaderboard', mood: 53, reminders: [], word }), null);
});

test('statusChangeOf: the decision own change of the status: another band, a trend within the band, or none', () => {
  const o = (moodBefore: number, moodAfter: number, bandBefore: MoodBand, bandAfter: MoodBand) => statusChangeOf({ moodBefore, moodAfter, bandBefore, bandAfter });
  assert.deepEqual(o(45, 35, 'ragu', 'kecewa'), { kind: 'band', from: 'ragu', to: 'kecewa' });
  assert.deepEqual(o(41, 47, 'ragu', 'ragu'), { kind: 'trend', band: 'ragu', direction: 'up' }, 'calmer words never sit next to a bare "unchanged"');
  assert.deepEqual(o(88, 80, 'senang', 'senang'), { kind: 'trend', band: 'senang', direction: 'down' });
  assert.deepEqual(o(50, 50, 'ragu', 'ragu'), { kind: 'same', band: 'ragu' });
});

test('isAfterClosePhase and privateOfRound: the round stays through consequence and leaderboard; private data only of that round', () => {
  assert.deepEqual(
    (['lobby', 'scene', 'answering', 'consequence', 'leaderboard', 'finished', 'interrupted'] as const).filter(isAfterClosePhase),
    ['consequence', 'leaderboard'],
  );
  const me = { roundNumber: 4, mood: 60 };
  assert.equal(privateOfRound(me, 4), me);
  // Public "round 5 scene" arrives before the private snapshot of round 5: round 4's private data is not shown in it.
  assert.equal(privateOfRound(me, 5), null);
});

test('arrowTarget: arrows move and wrap, Home/End jump, a group without focus starts at the first or the last', () => {
  assert.equal(arrowTarget('ArrowDown', 0, 5), 1);
  assert.equal(arrowTarget('ArrowRight', 4, 5), 0);
  assert.equal(arrowTarget('ArrowUp', 0, 5), 4);
  assert.equal(arrowTarget('ArrowLeft', 3, 5), 2);
  assert.equal(arrowTarget('Home', 3, 5), 0);
  assert.equal(arrowTarget('End', 1, 5), 4);
  assert.equal(arrowTarget('ArrowDown', -1, 5), 0);
  assert.equal(arrowTarget('ArrowUp', -1, 5), 4);
  assert.equal(arrowTarget('Enter', 1, 5), null);
  assert.equal(arrowTarget('ArrowDown', 0, 0), null);
});

test('trayStateOf: waiting while reading, loading until the options arrive, choosing, time up, sent, nothing after close', () => {
  const s = (phase: Parameters<typeof trayStateOf>[0]['phase'], over: Partial<Parameters<typeof trayStateOf>[0]> = {}) => trayStateOf({ phase, hasOptions: true, sent: false, remainingMs: 12_000, ...over });
  assert.equal(s('scene', { hasOptions: false }), 'waiting');
  assert.equal(s('answering'), 'choosing');
  assert.equal(s('answering', { remainingMs: null }), 'choosing');
  assert.equal(s('answering', { remainingMs: 0 }), 'timeUp');
  assert.equal(s('answering', { sent: true, remainingMs: 0 }), 'sent', 'sent wins over time up');
  assert.equal(s('answering', { hasOptions: false }), 'loading', 'the private snapshot with the options follows the public one');
  assert.equal(s('answering', { hasOptions: false, sent: true }), 'sent', 'a reloaded tab that already answered');
  assert.equal(s('consequence'), 'closed');
  assert.equal(s('leaderboard'), 'closed');
});

test('bringIntoViewDelta: nothing when on screen; the smallest move when it fits above the bar; else its start, keeping a choice clear', () => {
  const view = { top: 8, bottom: 692 }; // between the top margin and the top of a sticky bar
  const d = (area: { top: number; bottom: number }, chosen: { top: number; bottom: number } | null = null) => bringIntoViewDelta({ area, chosen, ...view });
  assert.equal(d({ top: 100, bottom: 600 }), 0);
  // The last option's bottom is 24 px under the bar: only that much, so all five options are above the bar.
  assert.equal(d({ top: 300, bottom: 716 }), 24);
  assert.equal(d({ top: -40, bottom: 400 }), -48, 'above the screen: back down to the top margin');
  assert.equal(d({ top: 500, bottom: 1700 }), 492, 'taller than the room: its start at the top');
  assert.equal(d({ top: 500, bottom: 1700 }, { top: 1300, bottom: 1380 }), 688, 'a restored choice is kept clear of the bar');
  assert.equal(d({ top: 500, bottom: 1700 }, { top: 700, bottom: 780 }), 492, 'a choice already visible after the move changes nothing');
});

test('clearOfBarDelta: what was on screen of the outcome moves up from under a bar that docks; nothing elsewhere', () => {
  const d = (area: { top: number; bottom: number }) => clearOfBarDelta({ area, barTop: 680, viewBottom: 740 }); // 52 px bar + 8 px gap
  assert.equal(d({ top: 300, bottom: 732 }), 52, 'brought into view at the consequence (bottom 8 px above the screen edge): up by the bar');
  assert.equal(d({ top: 300, bottom: 700 }), 20, 'partly covered: only that part');
  assert.equal(d({ top: 300, bottom: 660 }), 0, 'clear of the bar already');
  assert.equal(d({ top: 8, bottom: 735 }), 55, 'nearly as tall as the screen: its end (status, delayed effects) stays readable, its start moves off the top');
  assert.equal(d({ top: 8, bottom: 1200 }), 60, 'taller than the screen: what was at the bottom of the screen stays visible');
  assert.equal(d({ top: 700, bottom: 1300 }), 0, 'the area starts under the bar: the player is reading above it');
  assert.equal(d({ top: -900, bottom: -10 }), 0, 'above the screen');
});

test('evidenceTurnMs: the reading time shared out among the projector evidence items, 6–10 s each', () => {
  assert.equal(evidenceTurnMs(3, 18_000), 6_000, 'three items in an 18 s reading: all shown while the room reads');
  assert.equal(evidenceTurnMs(2, 15_000), 7_500);
  assert.equal(evidenceTurnMs(3, 12_000), 6_000, 'never shorter than 6 s');
  assert.equal(evidenceTurnMs(2, 40_000), 10_000, 'never longer than 10 s');
  assert.equal(evidenceTurnMs(1, 18_000), 10_000, 'one item: nothing to share out');
  assert.equal(evidenceTurnMs(3, null), 10_000, 'older server without a reading time');
  assert.equal(evidenceTurnMs(3, 0), 10_000);
});

test('trayDeadlineOf: the reading countdown ends with the reading time, not with the readiness grace', () => {
  const room = { phase: 'scene' as const, phaseEndsAt: 30_000, phaseDurationMs: 8_000, sceneStartedAt: 2_000, readingMs: 20_000 };
  assert.deepEqual(trayDeadlineOf(room), { endsAt: 22_000, durationMs: 20_000 });
  assert.deepEqual(trayDeadlineOf({ ...room, sceneStartedAt: undefined as unknown as null }), { endsAt: 30_000, durationMs: 8_000 }, 'older server');
  assert.deepEqual(trayDeadlineOf({ ...room, phase: 'answering', phaseEndsAt: 60_000, phaseDurationMs: 30_000 }), { endsAt: 60_000, durationMs: 30_000 });
});

test('evidence: rows only for checklist/timeline/compare; mark words per kind; field markers keep the list numbers', () => {
  assert.deepEqual(
    EVIDENCE_KINDS.filter(showsRows),
    ['checklist', 'timeline', 'compare'],
  );
  assert.equal(markWordKey('checklist', 'none'), null);
  assert.equal(markWordKey('timeline', 'ok'), 'ruang.tanda.timeline.ok');
  assert.equal(markWordKey('document', 'check'), 'ruang.tanda.checklist.check', 'kinds without rows borrow the checklist words');
  const markers = fieldMarkersOf([evidence('v1', { x: 10, y: 20 }), evidence('v2', null), evidence('v3', { x: 90, y: 5 }), evidence('v4', { x: 99, y: 0 })]);
  assert.deepEqual(markers, [
    { id: 'v1', number: 1, x: 10, y: 20, title: 'Berkas v1' },
    // A stored spot near an edge is drawn within SPOT_SAFE_RANGE (6–94 %), like the CMS shows it.
    { id: 'v3', number: 3, x: 90, y: 6, title: 'Berkas v3' },
    { id: 'v4', number: 4, x: 94, y: 6, title: 'Berkas v4' },
  ]);
});

test('roundViewOf: public lines merged with the viewer own conditional lines; opening lines separate; neutral defaults', () => {
  const s = scene({ intro: [line('i1', 0, 'officer', 'Mentor Uji')] });
  const v = roundViewOf({ scene: s, flagLines: [line('lf', -0.5, 'customer', 'Pak Joko')], assets: null });
  assert.deepEqual(
    v.lines.map((l) => l.key),
    ['line:lf', 'line:l1', 'line:l2'],
  );
  assert.deepEqual(
    v.intro.map((l) => l.key),
    ['intro:i1'],
  );
  assert.equal(v.mood, null);
  assert.deepEqual(v.reminders, []);
  assert.equal(v.outcome, null);
  assert.equal('stage' in v, false);
  assert.deepEqual(roundViewOf({ scene: s, assets: null }).lines.map((l) => l.key), ['line:l1', 'line:l2'], 'shared screens: public lines only');
  const withMood = roundViewOf({ scene: s, moodLine: 'Pak Joko tampak gelisah.', assets: null });
  assert.deepEqual(withMood.lines[0], { key: 'suasana', speaker: 'narrator', name: null, text: 'Pak Joko tampak gelisah.' }, 'the private status line comes first, as narration');
  assert.equal(roundViewOf({ scene: s, moodLine: null, assets: null }).lines.length, 2);
});

test('causalNotesOf: every flag the own choices left, in round order', () => {
  const d = (roundNumber: number, flagSet: { label: string; effectRound: number | null; delta: number | null } | null) => ({ roundNumber, flagSet });
  assert.deepEqual(causalNotesOf([d(3, null), d(12, { label: 'Janji', effectRound: 14, delta: -12 }), d(13, { label: '', effectRound: null, delta: null })]), [
    { setRound: 12, label: 'Janji', effectRound: 14, delta: -12 },
    { setRound: 13, label: '', effectRound: null, delta: null },
  ]);
  assert.deepEqual(causalNotesOf([]), []);
});
