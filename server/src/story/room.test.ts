/**
 * StoryRoom state machine with a manual clock (deterministic): synchronization, all-answered close, deadline boundary,
 * races, one final answer (retries, refused re-submissions), forged/stale answers, reconnect, removal, 15-round
 * completion, closing and privacy of payloads; delayed consequences (private lines and reminders, start-of-round mood,
 * applied once), opening lines, cast names, status-only endings and score policy v2 inside a live room; the gameplay
 * payloads (shared evidence, action and respondent, lesson only after close, replies and labelled delayed effects,
 * summary labels and flag notes, scene clock, reached assets, the form of the own choice, the round's thread kept
 * through its consequence) and the transport events of phase changes. All content is SYNTHETIC (testing/fixtures.ts).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { textKey, type ScenarioContent } from '../../../shared/story/content';
import { playThrough, type DecisionResult } from '../../../shared/story/engine';
import { scoreDecision } from '../../../shared/story/scorePolicy';
import type { StoryPrivateState } from '../../../shared/story/protocol';
import { mergeSceneLines } from '../../../shared/story/scene';
import { validateScenario } from '../../../shared/story/validate';
import { DEFAULT_TIMING, defaultReadingMs, INTRO_READING_MAX_MS, StoryRoom, type RoomTiming, type StoryRoomEvents } from './runtime/room';
import {
  addTestDelayedConsequence,
  addTestEvidence,
  addTestIntro,
  buildFeatureScenario,
  buildGameplayScenario,
  buildTestScenario,
  FEATURE,
  GAMEPLAY,
  ManualClock,
  MemoryStore,
  silentEvents,
  testValidationContext,
  useMoodOnlyEndings,
} from './testing/fixtures';

const TIMING: RoomTiming = { ...DEFAULT_TIMING, readingMs: () => 10_000 };

function makeRoom(opts: { max?: number; auto?: boolean; content?: ScenarioContent; events?: StoryRoomEvents } = {}) {
  const clock = new ManualClock();
  const store = new MemoryStore();
  const content = opts.content ?? buildTestScenario();
  const room = new StoryRoom(
    {
      id: 'room-1',
      code: 'ABCDEF',
      version: { scenarioId: 'sc_1', versionId: 'sv_1', versionNo: 1, contentHash: 'h', title: 'Uji', categoryName: 'Auto', contentKind: 'demo' },
      content,
      hostUserId: 'host-1',
      hostName: 'Host Uji',
      maxParticipants: opts.max ?? 50,
      autoAdvance: opts.auto ?? true,
      timing: TIMING,
    },
    clock,
    store,
    opts.events ?? silentEvents,
  );
  return { clock, store, room, content };
}

function join(room: StoryRoom, id: string, name = id) {
  const r = room.addParticipant(id, name, `hash-${id}`);
  assert.ok(r.ok, `join ${id}: ${r.ok ? '' : r.error}`);
  return r.data;
}

/** Start and move into the answer window of round 1 (everyone ready, reading elapsed). */
function openAnswering(room: StoryRoom, clock: ManualClock) {
  assert.ok(room.start().ok);
  for (const p of room.participants.values()) room.markReady(p.id, room.publicState().scene!.roundId);
  clock.advance(10_000);
  assert.equal(room.phase, 'answering');
}

const me = (room: StoryRoom, id: string) => room.privateState(id) as StoryPrivateState;
/** Option handle of the content choice with id `choiceId`, as presented to participant `pid`. */
function handleFor(room: StoryRoom, pid: string, choiceId: string): string {
  const roundIndex = room.publicState().roundNumber - 1;
  const round = room.content.rounds[roundIndex]!;
  const text = room.content.text.id![`round.${round.id}.choice.${choiceId}.text`]!;
  const opt = me(room, pid).options!.find((o) => o.text === text);
  assert.ok(opt, 'option present');
  return opt.handle;
}

test('lobby: duplicate / inappropriate names rejected, capacity enforced with a clear message, no join after start', () => {
  const { room, clock } = makeRoom({ max: 2 });
  join(room, 'p1', 'Budi');
  const dup = room.addParticipant('p2', 'budi', 'h2');
  assert.ok(!dup.ok && dup.code === 'name' && dup.detail === 'duplicate');
  const rude = room.addParticipant('p2', 'anjing', 'h2');
  assert.ok(!rude.ok && rude.detail === 'inappropriate');
  join(room, 'p2', 'Ani');
  const full = room.addParticipant('p3', 'Citra', 'h3');
  assert.ok(!full.ok && full.code === 'full' && /penuh \(2 peserta\)/.test(full.error));
  assert.ok(room.rename('p2', 'Budi').ok === false, 'rename uses the same duplicate rule');
  assert.ok(room.rename('p2', 'Ani Lestari').ok);
  openAnswering(room, clock);
  const late = room.addParticipant('p4', 'Dodi', 'h4');
  assert.ok(!late.ok && late.code === 'started');
  assert.ok(!room.rename('p1', 'Budi X').ok, 'no rename after start');
});

test('one participant: answering closes immediately when the only eligible participant answers (staff #17)', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  openAnswering(room, clock);
  clock.advance(4_000);
  const ack = room.answer('p1', room.publicState().scene!.roundId, handleFor(room, 'p1', 'c1'));
  assert.ok(ack.ok && !ack.data.duplicate && ack.data.elapsedMs === 4_000);
  assert.equal(room.phase, 'consequence', 'no waiting for the remaining 26 s');
  assert.equal(store.settled[0]!.closeReason, 'all_answered');
  const c = me(room, 'p1').consequence!;
  assert.equal(c.outcome, 'tepat');
  assert.equal(c.score.roundScore, scoreDecision(1, 4_000).roundScore);
});

test('multiple participants: answering stays open until the LAST eligible participant answers', () => {
  const { room, clock, store } = makeRoom();
  for (const id of ['p1', 'p2', 'p3']) join(room, id);
  openAnswering(room, clock);
  const rid = room.publicState().scene!.roundId;
  room.answer('p1', rid, handleFor(room, 'p1', 'c1'));
  room.answer('p2', rid, handleFor(room, 'p2', 'c3'));
  assert.equal(room.phase, 'answering');
  assert.equal(room.publicState().answeredCount, 2);
  room.answer('p3', rid, handleFor(room, 'p3', 'c2'));
  assert.equal(room.phase, 'consequence');
  assert.equal(store.settled.length, 1);
  assert.deepEqual(store.settled[0]!.decisions.map((d) => d.result.outcome), ['tepat', 'keliru', 'kurang_tepat']);
});

test('deadline boundary is inclusive; one ms later is rejected; the deadline settles the round exactly once', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const rid = room.publicState().scene!.roundId;
  const deadline = room.currentDeadline!;
  clock.setTime(deadline);
  const onTime = room.answer('p1', rid, handleFor(room, 'p1', 'c1'));
  assert.ok(onTime.ok && onTime.data.elapsedMs === 30_000);
  clock.setTime(deadline + 1);
  const late = room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.ok(!late.ok && late.code === 'late');
  clock.advance(0); // fire the deadline timer
  assert.equal(room.phase, 'consequence');
  assert.equal(store.settled.length, 1);
  const s = store.settled[0]!;
  assert.equal(s.closeReason, 'deadline');
  assert.equal(s.decisions.find((d) => d.participantId === 'p1')!.result.score.roundScore, 700, 'full accuracy at the deadline = 700');
  const p2 = s.decisions.find((d) => d.participantId === 'p2')!.result;
  assert.equal(p2.outcome, 'timeout');
  assert.equal(p2.score.roundScore, 0);
  assert.equal(p2.moodAfter, 20, 'authored timeout mood change (-5) applied once');
});

test('race: last answer and deadline timer at the same instant settle once', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  openAnswering(room, clock);
  clock.setTime(room.currentDeadline!);
  room.answer('p1', room.publicState().scene!.roundId, handleFor(room, 'p1', 'c2'));
  clock.advance(0);
  clock.advance(1_000);
  assert.equal(store.settled.length, 1);
  assert.equal(store.settled[0]!.decisions.length, 1);
});

test('one final answer: a retry of the same option returns the original acknowledgement, another option is refused, neither changes the score; forged and stale answers rejected', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const rid = room.publicState().scene!.roundId;
  // Handles as p1's device holds them (options are only sent while the window is open).
  const sent = handleFor(room, 'p1', 'c2');
  const other = handleFor(room, 'p1', 'c1');
  clock.advance(2_000);
  const first = room.answer('p1', rid, sent);
  clock.advance(1_000);
  const retry = room.answer('p1', rid, sent);
  assert.ok(first.ok && !first.data.duplicate && retry.ok && retry.data.duplicate);
  assert.deepEqual([retry.data.receivedAt, retry.data.elapsedMs], [first.data.receivedAt, 2_000], 'a retry gets the original acknowledgement');
  const changed = room.answer('p1', rid, other);
  assert.deepEqual(changed, { ok: false, code: 'answered', error: 'Jawabanmu untuk babak ini sudah terkirim.' }, 're-submitting another option after an accepted answer is refused as answered');
  const changedForged = room.answer('p1', rid, 'AAAAAAAAAAAA');
  assert.ok(!changedForged.ok && changedForged.code === 'answered', 'anything but the sent option is refused once answered');
  for (const forged of ['c1', 'AAAAAAAAAAAA', '', 42, null, { $gt: '' }]) {
    const r = room.answer('p2', rid, forged);
    assert.ok(!r.ok && r.code === 'invalid', `forged ${JSON.stringify(forged)}`);
  }
  // Another participant's handle is not valid for p2 (handles are per participant).
  const stolen = room.answer('p2', rid, handleFor(room, 'p1', 'c1'));
  assert.ok(!stolen.ok && stolen.code === 'invalid');
  assert.ok(!room.answer('p2', 'r99', handleFor(room, 'p2', 'c1')).ok, 'stale/unknown round');
  assert.ok(!room.answer('ghost', rid, 'x').ok, 'unknown participant');
  room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.equal(room.phase, 'consequence');
  const once = scoreDecision(0.5, 2_000).roundScore;
  const final = store.settled[0]!.decisions.find((d) => d.participantId === 'p1')!.result;
  assert.deepEqual([final.choiceId, final.elapsedMs, final.score.roundScore], ['c2', 2_000, once], 'the first answer is final');
  // After the round closed: the same option still gets the original acknowledgement, another one is still refused.
  const retryAfterClose = room.answer('p1', rid, sent);
  assert.ok(retryAfterClose.ok && retryAfterClose.data.duplicate && retryAfterClose.data.receivedAt === first.data.receivedAt);
  const changedAfterClose = room.answer('p1', rid, other);
  assert.ok(!changedAfterClose.ok && changedAfterClose.code === 'answered');
  assert.equal(store.settled.length, 1, 'the round settled once');
  assert.equal(me(room, 'p1').totals.totalScore, once, 'counted once: never doubled or replaced');
  assert.equal(me(room, 'p1').consequence!.chosenText, room.content.text.id![textKey.choiceText(rid, 'c2')]);
});

test('the accepted answer carries the own handle: a reloaded tab or a second device shows which option was sent; no other participant sees it', () => {
  const { room, clock } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const rid = room.publicState().scene!.roundId;
  assert.equal(me(room, 'p1').answer, null, 'nothing accepted yet');
  const sent = handleFor(room, 'p1', 'c3');
  clock.advance(3_000);
  assert.ok(room.answer('p1', rid, sent).ok);
  // A reload or a second device of the same participant reads the private state afresh.
  const reloaded = me(room, 'p1');
  assert.deepEqual(reloaded.answer, { roundId: rid, handle: sent, receivedAt: clock.now(), elapsedMs: 3_000 });
  assert.equal(reloaded.options!.find((o) => o.handle === reloaded.answer!.handle)!.text, room.content.text.id![textKey.choiceText(rid, 'c3')], 'the handle names one of the own options');
  assert.equal(me(room, 'p2').answer, null);
  for (const payload of [me(room, 'p2'), room.publicState()]) assert.ok(!JSON.stringify(payload).includes(sent), 'the handle stays with its participant');
  room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.equal(room.phase, 'consequence');
  assert.equal(me(room, 'p1').answer, null, 'the acknowledgement belongs to the answer window; the consequence names the choice');
});

test('options carry each choice form (a message or an action without one) for every participant, and nothing of the key', () => {
  const content = buildTestScenario();
  content.rounds[0]!.choices[4]!.form = 'action';
  const { room, clock } = makeRoom({ content });
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const actionText = content.text.id![textKey.choiceText(content.rounds[0]!.id, 'c5')];
  for (const id of ['p1', 'p2']) {
    const options = me(room, id).options!;
    assert.ok(options.every((o) => Object.keys(o).sort().join() === 'form,handle,text'), `${id}: handle, text and form only`);
    assert.deepEqual(options.filter((o) => o.form === 'action').map((o) => o.text), [actionText], `${id}: the action option is marked`);
    assert.equal(options.filter((o) => o.form === 'message').length, 4);
  }
  assert.ok(!JSON.stringify(room.publicState()).includes('"form"'), 'options are private; the public scene has no form');
});

test('host cannot shorten an answer window or skip feedback before the minimum; host-paced mode waits on the leaderboard', () => {
  const { room, clock } = makeRoom({ auto: false });
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const early = room.next();
  assert.ok(!early.ok && early.code === 'wrong_phase', 'early host-next rejected while answering');
  const rid = room.publicState().scene!.roundId;
  room.answer('p1', rid, handleFor(room, 'p1', 'c1'));
  room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.equal(room.phase, 'consequence');
  assert.ok(!room.next().ok, 'consequence shown at least consequenceMinMs');
  clock.advance(TIMING.consequenceMinMs);
  assert.ok(room.next().ok);
  assert.equal(room.phase, 'leaderboard');
  clock.advance(60_000);
  assert.equal(room.phase, 'leaderboard', 'auto-advance off: waits for the host');
  assert.ok(room.next().ok);
  assert.equal(room.phase, 'scene');
  assert.equal(room.publicState().roundNumber, 2, 'every choice leads to the same next round');
});

test('readiness: slow devices delay answering at most by the grace; disconnected devices never block', () => {
  const { room, clock } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  join(room, 'p3');
  room.start();
  const rid = room.publicState().scene!.roundId;
  room.markReady('p1', rid);
  room.setConnected('p3', false);
  clock.advance(10_000);
  assert.equal(room.phase, 'scene', 'waits for connected p2');
  clock.advance(TIMING.preloadGraceMs);
  assert.equal(room.phase, 'answering', 'grace elapsed: everyone starts with the same deadline');
  assert.ok(room.isEligible('p3'), 'a disconnected participant stays eligible until the deadline');
});

test('reconnect: a disconnected participant resumes the CURRENT round with remaining time; missed rounds score 0', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  room.setConnected('p2', false);
  let rid = room.publicState().scene!.roundId;
  room.answer('p1', rid, handleFor(room, 'p1', 'c1'));
  assert.equal(room.phase, 'answering', 'still waiting for eligible (disconnected) p2');
  clock.advance(30_001); // the inclusive deadline has passed
  assert.equal(store.settled[0]!.decisions.find((d) => d.participantId === 'p2')!.result.outcome, 'timeout');
  clock.advance(TIMING.consequenceMs + TIMING.leaderboardMs);
  assert.equal(room.phase, 'scene');
  clock.advance(10_000 + TIMING.preloadGraceMs);
  assert.equal(room.phase, 'answering');
  clock.advance(12_000);
  room.setConnected('p2', true);
  const st = room.publicState();
  assert.equal(st.phaseEndsAt! - st.serverNow, 18_000, 'no new timer: remaining time is preserved');
  rid = st.scene!.roundId;
  const ack = room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.ok(ack.ok && ack.data.elapsedMs === 12_000);
  assert.equal(me(room, 'p2').totals.totalScore, 0, 'round 1 (missed) stays 0');
});

test('host removal: removed participants leave eligibility and rankings; the round closes if everyone else answered', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  join(room, 'p2', 'Nama Aneh');
  openAnswering(room, clock);
  room.answer('p1', room.publicState().scene!.roundId, handleFor(room, 'p1', 'c1'));
  assert.ok(room.removeParticipant('p2').ok);
  assert.equal(room.phase, 'consequence');
  assert.deepEqual(store.removed, ['p2']);
  assert.ok(!room.publicState().participants.some((p) => p.id === 'p2'));
  assert.ok(!room.answer('p2', 'r01', 'x').ok);
});

interface PlayOptions {
  /** Rounds to play (default all 15); a shorter run stops on the last played round's leaderboard. */
  rounds?: number;
  /** Inspects each round's SCENE phase (0-based round index), before answering opens. */
  onScene?: (r: number) => void;
  /** Inspects each round once answering is open, before anybody answers. */
  onAnswering?: (r: number) => void;
  /** Inspects each round after its answers closed: in the CONSEQUENCE phase and (rounds 1–14) on the LEADERBOARD. */
  afterClose?: (r: number) => void;
}

/** Every participant answers `pick(pid, r)` (a content choice id, or null = timeout) 2 s into each answer window. */
function playAll(room: StoryRoom, clock: ManualClock, pick: (pid: string, round: number) => string | null, opts: PlayOptions = {}) {
  const rounds = opts.rounds ?? 15;
  room.start();
  for (let r = 0; r < rounds; r++) {
    assert.equal(room.phase, 'scene', `round ${r + 1} scene`);
    opts.onScene?.(r);
    const rid = room.publicState().scene!.roundId;
    for (const p of room.participants.values()) room.markReady(p.id, rid);
    clock.advance(10_000);
    assert.equal(room.phase, 'answering', `round ${r + 1}`);
    opts.onAnswering?.(r);
    clock.advance(2_000);
    for (const p of room.participants.values()) {
      const choice = pick(p.id, r);
      if (choice) room.answer(p.id, rid, handleFor(room, p.id, choice));
    }
    /** Advance just past the end of the current timed phase (answer deadlines are inclusive). */
    const toPhaseEnd = () => clock.advance(room.phaseEndsAt! - clock.now() + 1);
    if (room.phase === 'answering') toPhaseEnd();
    assert.equal(room.phase, 'consequence');
    opts.afterClose?.(r);
    toPhaseEnd();
    if (r < 14) {
      assert.equal(room.phase, 'leaderboard');
      assert.ok(room.publicState().rankings);
      opts.afterClose?.(r);
      if (r < rounds - 1) toPhaseEnd();
    }
  }
}

test('full session: 15 shared rounds, private endings, final summary with all 15 decisions; the room closes for good (FR-B10)', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'best', 'Ani');
  join(room, 'poor', 'Budi');
  join(room, 'idle', 'Citra');
  playAll(room, clock, (pid) => (pid === 'best' ? 'c1' : pid === 'poor' ? 'c4' : null));
  assert.equal(room.phase, 'finished');
  assert.equal(store.settled.length, 15);
  const best = me(room, 'best').summary!;
  const poor = me(room, 'poor').summary!;
  const idle = me(room, 'idle').summary!;
  assert.equal(best.complete, true);
  assert.equal(best.decisions.length, 15);
  assert.equal(best.ending!.kind, 'happy');
  assert.equal(poor.ending!.kind, 'with_notes');
  assert.equal(idle.decisions.filter((d) => d.outcome === 'timeout').length, 15, 'timeouts are listed in the summary');
  assert.equal(best.rank!.rank, 1);
  assert.ok(best.decisions.every((d) => d.recommended.length > 0 && d.reason));
  // Closed: no reset, replay, reopening or 16th round.
  for (const act of [() => room.start(), () => room.next(), () => room.close()]) assert.ok(!act().ok);
  assert.ok(!room.addParticipant('x', 'Dodi', 'hx').ok);
  assert.equal(store.finished.length, 1);
});

test('host close mid-session -> interrupted; partial summary, no ending, cannot reopen', () => {
  const { room, clock, store } = makeRoom();
  join(room, 'p1');
  openAnswering(room, clock);
  room.answer('p1', room.publicState().scene!.roundId, handleFor(room, 'p1', 'c1'));
  assert.ok(room.close().ok);
  assert.equal(room.phase, 'interrupted');
  assert.deepEqual(store.closedEarly, ['host_closed']);
  const s = me(room, 'p1').summary!;
  assert.equal(s.complete, false);
  assert.equal(s.ending, null);
  assert.equal(s.decisions.length, 1);
  assert.ok(!room.start().ok);
});

test('privacy: public state never carries keys, weights, classifications or other participants\' choices; options differ per participant', () => {
  const { room, clock, content } = makeRoom();
  for (const id of ['p1', 'p2', 'p3', 'p4']) join(room, id);
  openAnswering(room, clock);
  const pub = JSON.stringify(room.publicState());
  for (const forbidden of ['accuracy', 'classification', 'tepat', 'keliru', 'moodDelta', '"c1"', 'credential', 'hash-p1']) assert.ok(!pub.includes(forbidden), forbidden);
  const p1 = me(room, 'p1');
  assert.ok(!JSON.stringify(p1).includes('"c1"'), 'participants never see content choice IDs');
  assert.equal(p1.options!.length, 5);
  // Orders are per participant: across the four participants at least two orders differ in round 1..15.
  const orders = new Set<string>();
  for (let r = 0; r < 15 && orders.size < 2; r++) {
    for (const id of ['p1', 'p2', 'p3', 'p4']) orders.add(me(room, id).options!.map((o) => o.text).join('|'));
    if (orders.size >= 2) break;
    for (const id of ['p1', 'p2', 'p3', 'p4']) room.answer(id, room.publicState().scene!.roundId, me(room, id).options![0]!.handle);
    clock.advance(TIMING.consequenceMs + TIMING.leaderboardMs + 10_000 + TIMING.preloadGraceMs);
  }
  assert.ok(orders.size >= 2, 'independent shuffles');
  // Stable across "refresh": asking again yields the same order and handles.
  const a = JSON.stringify(me(room, 'p2').options);
  assert.equal(JSON.stringify(me(room, 'p2').options), a);
  // Frozen content: later edits of the source object cannot reach the room.
  try {
    (room.content.rounds[0]!.choices[0] as { accuracy: number }).accuracy = 0;
  } catch {
    /* strict mode throws; sloppy mode ignores — either way the value must not change */
  }
  assert.equal(room.content.rounds[0]!.choices[0]!.accuracy, 1);
  content.rounds[0]!.choices[0]!.accuracy = 0.3;
  assert.equal(room.content.rounds[0]!.choices[0]!.accuracy, 1, 'room holds its own copy');
});

test('a persistence failure never freezes a live room: the round still settles and the session continues', () => {
  const { clock, store, room } = makeRoom();
  // The store throws exactly where the original stall happened (round settlement).
  store.roundSettled = () => {
    throw new Error('disk full (simulated)');
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    join(room, 'p1');
    openAnswering(room, clock);
    assert.ok(room.answer('p1', room.publicState().scene!.roundId, me(room, 'p1').options![0]!.handle).ok);
    assert.equal(room.phase, 'consequence', 'all answered -> consequence even though persisting the round failed');
    assert.equal(room.persistFailures, 1);
    clock.advance(DEFAULT_TIMING.consequenceMs);
    assert.equal(room.phase, 'leaderboard', 'timers keep running after the failure');
  } finally {
    console.error = originalError;
  }
});

test('host clicks are checked against the phase they were made in; auto-advance off clears the countdown', () => {
  const { clock, room } = makeRoom({ auto: true });
  join(room, 'p1');
  openAnswering(room, clock);
  assert.ok(room.answer('p1', room.publicState().scene!.roundId, me(room, 'p1').options![0]!.handle).ok);
  clock.advance(DEFAULT_TIMING.consequenceMs);
  assert.equal(room.phase, 'leaderboard');
  // The leaderboard timer fires before the host's "next" arrives: the click (made on the leaderboard) is refused
  // instead of opening round 2's answers without its reading time.
  clock.advance(DEFAULT_TIMING.leaderboardMs);
  assert.equal(room.phase, 'scene');
  const stale = room.next({ phase: 'leaderboard', roundNumber: 1 });
  assert.ok(!stale.ok && stale.code === 'wrong_phase');
  assert.equal(room.phase, 'scene');
  // Back on a leaderboard, switching auto-advance off leaves no countdown on any screen.
  for (const p of room.participants.values()) room.markReady(p.id, room.publicState().scene!.roundId);
  clock.advance(10_000);
  assert.ok(room.answer('p1', room.publicState().scene!.roundId, me(room, 'p1').options![0]!.handle).ok);
  clock.advance(DEFAULT_TIMING.consequenceMs);
  assert.equal(room.phase, 'leaderboard');
  room.setAutoAdvance(false);
  assert.equal(room.publicState().phaseEndsAt, null);
  assert.equal(room.publicState().phaseDurationMs, null);
});

test('deadline timer firing early (real timers) never closes the window before the inclusive deadline', () => {
  const { room, clock } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  openAnswering(room, clock);
  const rid = room.publicState().scene!.roundId;
  const deadline = room.currentDeadline!;
  clock.advance(deadline - clock.now()); // the timer fires exactly at the deadline instant
  assert.equal(room.phase, 'answering', 'still open at the deadline instant');
  assert.ok(room.answer('p1', rid, handleFor(room, 'p1', 'c1')).ok, 'an answer received AT the deadline counts');
  clock.advance(1);
  assert.equal(room.phase, 'consequence', 'closes one millisecond after the deadline');
});

// ------------------------------------------------------------------ settled-case script features (synthetic content)

const moodFields = ({ moodCarried, delayedDelta, moodBefore, moodAfter, moodDelta }: DecisionResult) => ({ moodCarried, delayedDelta, moodBefore, moodAfter, moodDelta });

test('delayed consequence: only the flag holder sees the conditional line (while the round is played and through its consequence) and the start-of-round change; it applies exactly once', () => {
  const content = addTestDelayedConsequence(buildTestScenario(), { flag: FEATURE.flag, setRound: 2, choiceId: 'c2', effectRound: 4, moodDelta: -12, lineText: FEATURE.flagLine });
  const { room, clock, store } = makeRoom({ content });
  join(room, 'pemicu', 'Ani');
  join(room, 'lain', 'Budi');
  // 'pemicu' takes c2 (+2) in round 2 and so leaves the flag; every other answer is c5 (mood +0): only the flag moves moods.
  const pick = (pid: string, r: number) => (pid === 'pemicu' && r === 1 ? 'c2' : 'c5');
  const leaked = (payload: unknown) => [FEATURE.flagLine, FEATURE.flag].filter((s) => JSON.stringify(payload).includes(s));
  const inspect = (r: number) => {
    assert.deepEqual(leaked(room.publicState()), [], `public state (room channel, projector, host), round ${r + 1}`);
    const other = me(room, 'lain');
    assert.deepEqual(leaked(other), [], `the other participant, round ${r + 1}`);
    assert.deepEqual([other.flagLines, other.flagReminders], [[], []]);
    assert.equal(other.mood, 25);
    const mine = me(room, 'pemicu');
    assert.ok(!JSON.stringify(mine).includes(FEATURE.flag), 'the flag id itself never leaves the server');
    if (r === 3) {
      const shared = room.publicState().scene!.lines;
      assert.deepEqual(mine.flagLines, [{ id: 'f0', speaker: 'customer', name: 'Bu Rina', pos: -0.5, text: FEATURE.flagLine }]);
      assert.deepEqual(shared.map((l) => [l.id, l.pos]), [['p0', 0], ['p1', 1]], 'shared lines are named and numbered among themselves: no id or gap hints at a private line');
      assert.deepEqual(mergeSceneLines(shared, mine.flagLines).map((l) => l.id), ['f0', 'p0', 'p1'], 'the holder sees the authored order');
      assert.deepEqual(mine.flagReminders, [{ label: '', fromRound: 2, delta: -12 }], 'a reminder for the holder (no label authored: clients word it generically)');
      assert.deepEqual([mine.mood, mine.moodBand, mine.customerExpression, mine.moodVariantLine], [15, 'sangat_kecewa', 'kesal', 'Customer tampak sangat kecewa di tahap 4.'], 'round 4 begins 12 lower');
      assert.deepEqual([other.moodBand, other.customerExpression, other.moodVariantLine], ['kecewa', 'cemas', null]);
    } else {
      assert.deepEqual([mine.flagLines, mine.flagReminders], [[], []], `no conditional line or reminder in round ${r + 1}`);
      assert.equal(mine.mood, r <= 1 ? 25 : r === 2 ? 27 : 15, `carried mood at the start of round ${r + 1}`);
    }
  };
  /** After close the holder keeps the round's conditional line in its conversation through the consequence and the
   * leaderboard after it (the round stays on screen), privately. */
  const inspectClosed = (r: number) => {
    const at = `round ${r + 1} (${room.phase})`;
    assert.deepEqual(leaked(room.publicState()), [], `public state, ${at}`);
    const other = me(room, 'lain');
    assert.deepEqual(leaked(other), [], `the other participant, ${at}`);
    assert.deepEqual(other.flagLines, []);
    const mine = me(room, 'pemicu');
    assert.ok(!JSON.stringify(mine).includes(FEATURE.flag), 'the flag id itself never leaves the server');
    const roundOnScreen = room.phase === 'consequence' || room.phase === 'leaderboard';
    const kept = r === 3 && roundOnScreen ? [{ id: 'f0', speaker: 'customer', name: 'Bu Rina', pos: -0.5, text: FEATURE.flagLine }] : [];
    assert.deepEqual(mine.flagLines, kept, `the holder, ${at}`);
    assert.deepEqual(mine.flagReminders, [], `reminders only while the round is played, ${at}`);
  };
  playAll(room, clock, pick, { onScene: inspect, onAnswering: inspect, afterClose: inspectClosed });
  assert.equal(room.phase, 'finished');

  const decision = (r: number, pid: string) => store.settled[r]!.decisions.find((d) => d.participantId === pid)!.result;
  assert.deepEqual(moodFields(decision(3, 'pemicu')), { moodCarried: 27, delayedDelta: -12, moodBefore: 15, moodAfter: 15, moodDelta: 0 });
  assert.deepEqual(moodFields(decision(4, 'pemicu')), { moodCarried: 15, delayedDelta: 0, moodBefore: 15, moodAfter: 15, moodDelta: 0 }, 'never applied again');
  assert.deepEqual(moodFields(decision(3, 'lain')), { moodCarried: 25, delayedDelta: 0, moodBefore: 25, moodAfter: 25, moodDelta: 0 });
  const delayedRounds = (pid: string) => store.settled.flatMap((_, i) => (decision(i, pid).delayedDelta ? [[i + 1, decision(i, pid).delayedDelta]] : []));
  assert.deepEqual(delayedRounds('pemicu'), [[4, -12]], 'exactly once, in the reacting round');
  assert.deepEqual(delayedRounds('lain'), []);

  // The live room equals the shared engine (the CMS preview) for the same picks and server-measured answer times.
  const live = room.participants.get('pemicu')!.decisions;
  const engine = playThrough(content, (_round, i) => ({ choiceId: pick('pemicu', i), elapsedMs: live[i]!.elapsedMs! }));
  assert.deepEqual(live, engine.decisions);
  const summary = me(room, 'pemicu').summary!;
  assert.equal(summary.finalMood, 15, '25 + 2 (own choice) − 12 (delayed) = 15');
  assert.equal(engine.finalMood, 15);
  assert.deepEqual([summary.decisions[3]!.delayedDelta, summary.decisions[3]!.moodBefore, summary.decisions[3]!.bandBefore], [-12, 15, 'sangat_kecewa']);
  assert.equal(store.finished[0]!.find((f) => f.participantId === 'pemicu')!.finalMood, 15);
  assert.equal(me(room, 'lain').summary!.finalMood, 25);
});

test('endings by status only: happy / with notes / unhappy follow the final mood; ending words stay templates; policy v2 totals', () => {
  const { room, clock, store } = makeRoom({ content: useMoodOnlyEndings(buildTestScenario()) });
  join(room, 'puas', 'Ani');
  join(room, 'catatan', 'Budi');
  join(room, 'kurang', 'Citra');
  // From 25: c1 +8 per round -> 100, c2 +2 -> 55, c3 -8 -> 0.
  playAll(room, clock, (pid) => (pid === 'puas' ? 'c1' : pid === 'catatan' ? 'c2' : 'c3'));
  assert.equal(room.phase, 'finished');
  const finals = new Map(store.finished[0]!.map((f) => [f.participantId, f]));
  assert.deepEqual(
    ['puas', 'catatan', 'kurang'].map((id) => [finals.get(id)!.finalMood, finals.get(id)!.endingId, finals.get(id)!.endingKind]),
    [
      [100, 'mood_high', 'happy'],
      [55, 'mood_mid', 'with_notes'],
      [0, 'mood_low', 'unhappy'],
    ],
  );
  assert.deepEqual(me(room, 'kurang').summary!.ending, { id: 'mood_low', kind: 'unhappy', title: 'Customer kurang puas', text: '', customer: '"Klaimnya selesai, tetapi saya lelah menunggu."', mentor: '' });
  const happy = me(room, 'puas').summary!.ending!;
  assert.deepEqual([happy.customer, happy.mentor], ['"Terima kasih, {nama}. Saya selalu tahu kabarnya."', '"Rapi sekali, {nama}."'], 'clients substitute {nama}, the server never does');
  // Policy v2: kurang tepat (0.5) answered at 2 s earns the FULL speed points (350 + 280); keliru earns nothing.
  assert.deepEqual(me(room, 'catatan').totals, { totalScore: 15 * 630, accuracyPoints: 15 * 350, speedPoints: 15 * 280, answeredCount: 15, timeoutCount: 0 });
  assert.equal(me(room, 'kurang').totals.totalScore, 0);
  assert.equal(me(room, 'puas').summary!.scorePolicyId, 'story-70-30-v2');
});

test('score policy v2 at known answer times: kurang tepat 650 at 0 s and 500 at 15 s, tepat 850 at 15 s, a fast keliru 0', () => {
  const { room, clock, store } = makeRoom();
  for (const id of ['p1', 'p2', 'p3', 'p4']) join(room, id);
  openAnswering(room, clock);
  assert.equal(room.scorePolicyId, 'story-70-30-v2');
  const rid = room.publicState().scene!.roundId;
  assert.ok(room.answer('p1', rid, handleFor(room, 'p1', 'c2')).ok);
  assert.ok(room.answer('p2', rid, handleFor(room, 'p2', 'c3')).ok);
  clock.advance(15_000);
  assert.ok(room.answer('p3', rid, handleFor(room, 'p3', 'c2')).ok);
  assert.ok(room.answer('p4', rid, handleFor(room, 'p4', 'c1')).ok);
  assert.equal(room.phase, 'consequence');
  const score = (pid: string) => {
    const s = store.settled[0]!.decisions.find((d) => d.participantId === pid)!.result.score;
    return [s.accuracyPoints, s.speedPoints, s.roundScore];
  };
  assert.deepEqual(score('p1'), [350, 300, 650]);
  assert.deepEqual(score('p2'), [0, 0, 0]);
  assert.deepEqual(score('p3'), [350, 150, 500]);
  assert.deepEqual(score('p4'), [700, 150, 850]);
});

test('scene: names for customer/officer/cast, opening lines on round 1 only, kicker/badge/chat layout; {nama} untouched; notes, roles and flags never sent', () => {
  const content = buildFeatureScenario();
  assert.deepEqual(validateScenario(content, testValidationContext()).filter((i) => i.severity === 'error'), [], 'the synthetic feature scenario is publishable');
  const { room, clock } = makeRoom({ content });
  join(room, 'p1', 'Ani');
  assert.equal(room.publicState().scene, null, 'no story content in the lobby');
  const label = room.publicState().scenario;
  assert.deepEqual([label.customerCharacterId, label.neutralExpression, label.customerName, label.officerName], [null, '', 'Bu Rina', 'Miss Raksa']);
  assert.deepEqual(label.moodLabels, FEATURE.moodLabels);
  const payloads: string[] = [];
  const record = () => {
    payloads.push(JSON.stringify(room.publicState()), JSON.stringify(me(room, 'p1')));
    assert.equal(me(room, 'p1').customerExpression, '', 'no portrait, no expression');
  };
  record();
  playAll(room, clock, () => 'c1', {
    rounds: 4,
    onScene: (r) => {
      record();
      const scene = room.publicState().scene!;
      if (r === 0) {
        assert.deepEqual(scene.intro, [
          { id: 'i1', speaker: 'officer', name: 'Miss Raksa', pos: 0, text: FEATURE.introOfficer },
          { id: 'i2', speaker: 'cast', name: FEATURE.castName, pos: 1, text: FEATURE.introCast },
        ]);
        assert.deepEqual(scene.lines.map((l) => [l.speaker, l.name, l.pos]), [['customer', 'Bu Rina', 0], ['officer', 'Miss Raksa', 1]]);
        assert.deepEqual([scene.meta, scene.keyRound, scene.layout], ['', false, 'stage']);
      } else {
        assert.deepEqual(scene.intro, [], `the opening belongs to round 1 only (round ${r + 1})`);
      }
      if (r === 1) {
        assert.deepEqual(scene.lines.map((l) => [l.speaker, l.name]), [['customer', 'Bu Rina'], ['officer', 'Miss Raksa'], ['cast', FEATURE.castName], ['narrator', null]]);
        assert.deepEqual([scene.meta, scene.keyRound, scene.layout, scene.showOfficer], [FEATURE.chatMeta, false, 'chat', false]);
      }
      if (r === 3) assert.deepEqual([scene.keyRound, scene.lines.length], [true, 2], 'key round; its conditional line stays private');
    },
    onAnswering: (r) => {
      record();
      if (r === 0) assert.ok(me(room, 'p1').options!.some((o) => o.text === FEATURE.nameChoice), 'options carry {nama} as authored');
    },
  });
  const consequence = me(room, 'p1').consequence!;
  assert.deepEqual([consequence.roundNumber, consequence.mentorReason, consequence.delayedDelta], [4, FEATURE.mentorReason, 0]);
  record();
  for (const secret of [FEATURE.authorNotes, FEATURE.roundNote, FEATURE.castRole, FEATURE.flag, FEATURE.flagLine]) {
    assert.ok(!payloads.some((p) => p.includes(secret)), `never sent to rooms: ${secret}`);
  }
});

test('label: per-scenario status words travel only as a complete set; a customer portrait keeps its neutral expression', () => {
  const partial = buildFeatureScenario();
  delete partial.text.id![textKey.moodLabel('senang')];
  assert.equal(makeRoom({ content: partial }).room.label().moodLabels, null, 'an incomplete set falls back to the default words');
  const plain = makeRoom().room.label();
  assert.deepEqual([plain.customerCharacterId, plain.neutralExpression, plain.moodLabels], ['builtin:char:bu-rina', 'bingung', null]);
});

test('reading time: round 1 adds the opening lines (at most 12 s more); conditional lines and evidence are not counted', () => {
  const base = buildTestScenario();
  const withIntro = addTestIntro(buildTestScenario(), [{ speaker: 'narrator', text: 'a'.repeat(100) }]);
  assert.equal(defaultReadingMs(withIntro, 0), defaultReadingMs(base, 0) + 100 * 35);
  assert.equal(defaultReadingMs(withIntro, 1), defaultReadingMs(base, 1), 'the opening is read with round 1 only');
  const longIntro = addTestIntro(buildTestScenario(), Array.from({ length: 6 }, () => ({ speaker: 'narrator' as const, text: 'b'.repeat(300) })));
  assert.equal(defaultReadingMs(longIntro, 0), defaultReadingMs(base, 0) + INTRO_READING_MAX_MS);
  const flagged = addTestDelayedConsequence(buildTestScenario(), { flag: 'tanda_baca', setRound: 1, choiceId: 'c1', effectRound: 3, moodDelta: -5, lineText: 'c'.repeat(300) });
  assert.equal(defaultReadingMs(flagged, 2), defaultReadingMs(base, 2), 'a line only some participants see does not change the shared time');
  const withEvidence = addTestEvidence(buildTestScenario(), 3, { id: 'berkas', kind: 'document', title: 'Berkas panjang uji', body: 'd'.repeat(500) });
  assert.equal(defaultReadingMs(withEvidence, 2), defaultReadingMs(base, 2), 'evidence stays open while answering: no hidden extra time');
});

// ------------------------------------------------------------------ gameplay payloads (synthetic content)

/** Answer keys and author-only material: never in any participant, projector or host payload. */
const NEVER_SENT = ['"classification"', '"accuracy"', '"moodDelta"', '"setsFlag"', '"ifFlag"', '"flagEffects"', '"authorNote', FEATURE.flag, FEATURE.authorNotes, FEATURE.roundNote];
/** Which of `texts` a payload carries. */
const carried = (payload: unknown, texts: readonly string[]) => texts.filter((s) => JSON.stringify(payload).includes(s));

test('gameplay scene: evidence, action and respondent are shared (one public payload for participants, projector and host); the lesson only once the answers closed', () => {
  const content = buildGameplayScenario();
  const { room, clock } = makeRoom({ content });
  join(room, 'p1', 'Ani');
  join(room, 'p2', 'Budi');
  const lessonOf = (r: number) => content.text.id![textKey.roundLesson(content.rounds[r]!.id)] ?? '';
  const evidenceAtScene = new Map<number, string>();
  const scene = () => room.publicState().scene!;
  /** Scene and answering: no lesson anywhere; evidence only in the shared payload and unchanged since the scene began. */
  const open = (r: number) => {
    assert.equal(scene().lesson, '', `no lesson while round ${r + 1} is in ${room.phase}`);
    for (const id of ['p1', 'p2']) {
      assert.deepEqual(carried(me(room, id), [GAMEPLAY.lesson, GAMEPLAY.effectLesson]), [], `${id}: no lesson in ${room.phase}`);
      assert.deepEqual(carried(me(room, id), [GAMEPLAY.documentTitle, GAMEPLAY.photoTitle]), [], `${id}: evidence is never sent per participant`);
    }
    assert.deepEqual(carried(room.publicState(), NEVER_SENT), []);
    if (room.phase === 'scene') evidenceAtScene.set(r, JSON.stringify(scene().evidence));
    else assert.equal(JSON.stringify(scene().evidence), evidenceAtScene.get(r), 'the same evidence while answering');
  };
  const closed = (r: number) => {
    assert.equal(scene().lesson, lessonOf(r), `the lesson of round ${r + 1} in ${room.phase}`);
    assert.equal(JSON.stringify(scene().evidence), evidenceAtScene.get(r), 'the same evidence after close');
    assert.deepEqual(carried(room.publicState(), [...NEVER_SENT, GAMEPLAY.chatReplyC1, GAMEPLAY.timeoutReply, GAMEPLAY.castReply]), [], 'replies stay private');
  };
  playAll(room, clock, () => 'c1', {
    rounds: GAMEPLAY.fieldRound,
    onScene: (r) => {
      open(r);
      const s = scene();
      if (r === GAMEPLAY.dossierRound - 1) {
        assert.deepEqual([s.layout, s.action, s.respondent], ['dossier', GAMEPLAY.action, { speaker: 'customer', name: 'Bu Rina' }]);
        assert.deepEqual(
          s.evidence.map((e) => [e.id, e.kind, e.title, e.body, e.rows.map((row) => [row.mark, row.label, row.value])]),
          [
            ['surat', 'document', GAMEPLAY.documentTitle, GAMEPLAY.documentBody, []],
            ['daftar', 'checklist', GAMEPLAY.checklistTitle, '', [['ok', 'Formulir uji', ''], ['missing', 'Foto uji', ''], ['check', 'Surat keterangan uji', 'perlu dicek']]],
          ],
        );
      } else if (r === GAMEPLAY.fieldRound - 1) {
        assert.deepEqual([s.layout, s.backgroundAssetId, s.action, s.respondent], ['field', GAMEPLAY.image, '', { speaker: 'cast', name: FEATURE.castName }]);
        assert.deepEqual(s.evidence.map((e) => [e.id, e.kind, e.assetId, e.spot]), [['foto', 'photo', GAMEPLAY.image, { x: 30, y: 60 }], ['urutan', 'timeline', null, { x: 70, y: 40 }]]);
      } else if (r === GAMEPLAY.chatRound - 1) {
        assert.deepEqual([s.layout, s.evidence, s.respondent], ['chat', [], { speaker: 'customer', name: 'Bu Rina' }]);
      } else {
        assert.deepEqual([s.evidence, s.action, s.respondent], [[], '', null]);
      }
    },
    onAnswering: open,
    afterClose: closed,
  });
  assert.ok(room.close().ok);
  assert.equal(scene().lesson, GAMEPLAY.lesson, 'a closed room shows the lesson of the round it stopped in');
});

test('scene clock: sceneStartedAt and readingMs stay put when the readiness grace re-arms the phase timer; each round has its own; null in the lobby and once closed', () => {
  const { room, clock } = makeRoom();
  join(room, 'p1');
  join(room, 'p2');
  const sceneClock = () => [room.publicState().sceneStartedAt, room.publicState().readingMs];
  assert.deepEqual(sceneClock(), [null, null], 'lobby');
  room.start();
  const start = clock.now();
  assert.deepEqual(sceneClock(), [start, 10_000]);
  // p2 stays connected but never reports ready (e.g. a hidden tab), so the reading time runs into the grace.
  room.markReady('p1', room.publicState().scene!.roundId);
  clock.advance(10_000);
  const grace = room.publicState();
  assert.equal(grace.phase, 'scene');
  assert.deepEqual([grace.phaseEndsAt, grace.phaseDurationMs], [clock.now() + TIMING.preloadGraceMs, TIMING.preloadGraceMs], 'the grace re-arms the phase timer');
  assert.deepEqual([grace.sceneStartedAt, grace.readingMs], [start, 10_000], 'the scene clock does not move');
  clock.advance(TIMING.preloadGraceMs);
  assert.equal(room.phase, 'answering');
  assert.deepEqual(sceneClock(), [start, 10_000], 'the round keeps its scene clock while answering');
  const rid = room.publicState().scene!.roundId;
  room.answer('p1', rid, handleFor(room, 'p1', 'c1'));
  room.answer('p2', rid, handleFor(room, 'p2', 'c1'));
  assert.deepEqual(sceneClock(), [start, 10_000], 'and after its answers closed');
  clock.advance(TIMING.consequenceMs + TIMING.leaderboardMs);
  assert.equal(room.phase, 'scene');
  assert.deepEqual(sceneClock(), [clock.now(), 10_000], 'round 2 has its own scene clock');
  assert.ok(room.close().ok);
  assert.deepEqual(sceneClock(), [null, null], 'closed');
});

test('gameplay consequences: reply and respondent of the own choice, labelled delayed effects (clamped share) and reminders only for flag holders; summaries with flag notes and labels', () => {
  const { room, clock } = makeRoom({ content: buildGameplayScenario() });
  const ids = ['ani', 'budi', 'citra', 'dodi'];
  for (const id of ids) join(room, id);
  const chat = GAMEPLAY.chatRound - 1;
  const effect = FEATURE.effectRound - 1;
  const field = GAMEPLAY.fieldRound - 1;
  // From 25. ani: always c1 (+8), never holds the flag. budi: c2 in the chat round (leaves the flag), otherwise c1: the
  // effect round begins at 43 - 12 = 31. citra: c2 in the chat round, otherwise c4 (-12): it begins at 3 - 12, clamped
  // to 0, so only -3 applies. dodi: times out in the chat round (no flag), otherwise c1.
  const pick = (pid: string, r: number): string | null => {
    if (r === chat) return pid === 'dodi' ? null : pid === 'ani' ? 'c1' : 'c2';
    return pid === 'citra' ? 'c4' : 'c1';
  };
  const applied: Record<string, number> = { budi: FEATURE.delayedDelta, citra: -3 };
  const noted = (delta: number) => [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta }];
  const open = (r: number) => {
    assert.deepEqual(carried(room.publicState(), [GAMEPLAY.flagLabel, ...NEVER_SENT]), [], `shared payload, round ${r + 1}`);
    for (const id of ids) {
      const mine = me(room, id);
      assert.deepEqual(mine.flagReminders, r === effect && id in applied ? noted(applied[id]!) : [], `${id}: reminders in round ${r + 1} (${room.phase})`);
      assert.deepEqual(carried(mine, NEVER_SENT), [], `${id}: no keys, flag ids or notes`);
      if (!(id in applied)) assert.deepEqual(carried(mine, [GAMEPLAY.flagLabel]), [], `${id} never holds the flag`);
    }
  };
  const closed = (r: number) => {
    const view = (id: string) => me(room, id).consequence!;
    for (const id of ids) {
      assert.deepEqual(me(room, id).flagReminders, [], 'reminders only while the round is read and answered');
      assert.deepEqual(carried(me(room, id), NEVER_SENT), []);
      assert.equal(view(id).flagSet, null, 'the live consequence never announces a later effect');
    }
    if (r === chat) {
      assert.deepEqual(ids.map((id) => [view(id).outcome, view(id).reply, view(id).respondentName, view(id).lesson]), [
        ['tepat', GAMEPLAY.chatReplyC1, 'Bu Rina', GAMEPLAY.lesson],
        ['kurang_tepat', GAMEPLAY.chatReplyC2, 'Bu Rina', GAMEPLAY.lesson],
        ['kurang_tepat', GAMEPLAY.chatReplyC2, 'Bu Rina', GAMEPLAY.lesson],
        ['timeout', GAMEPLAY.timeoutReply, 'Bu Rina', GAMEPLAY.lesson],
      ]);
    }
    if (r === effect) {
      assert.deepEqual(ids.map((id) => [view(id).delayedDelta, view(id).delayed]), [[0, []], [FEATURE.delayedDelta, noted(FEATURE.delayedDelta)], [-3, noted(-3)], [0, []]]);
      assert.deepEqual([view('budi').reply, view('budi').respondentName, view('budi').lesson], ['', null, GAMEPLAY.effectLesson], 'a round without respondent');
    }
    if (r === field) assert.deepEqual([view('ani').reply, view('ani').respondentName, view('citra').reply], [GAMEPLAY.castReply, FEATURE.castName, '']);
  };
  playAll(room, clock, pick, { rounds: GAMEPLAY.fieldRound, onScene: open, onAnswering: open, afterClose: closed });

  assert.ok(room.close().ok);
  const summary = (id: string) => me(room, id).summary!;
  const flagNotes = (id: string) => summary(id).decisions.map((d) => d.flagSet);
  assert.deepEqual(flagNotes('budi'), [null, { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: FEATURE.delayedDelta }, null, null, null], 'noted at the round that left the flag');
  assert.deepEqual(flagNotes('citra')[chat], { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: -3 });
  assert.ok([...flagNotes('ani'), ...flagNotes('dodi')].every((f) => f === null));
  assert.deepEqual(summary('budi').decisions[effect]!.delayed, noted(FEATURE.delayedDelta), 'and at the round where it took effect');
  for (const id of ids) {
    assert.deepEqual(summary(id).labels, { customerName: 'Bu Rina', officerName: 'Miss Raksa', officerCharacterId: 'builtin:char:miss-raksa', moodLabels: FEATURE.moodLabels });
    assert.deepEqual(carried(summary(id), NEVER_SENT), []);
  }
});

test('room assets: scenario-wide ones, then the background, media and evidence pictures of every round reached; never a later round', () => {
  const content = buildGameplayScenario();
  // An evidence-only picture on the dossier round and media on the chat round (the runtime does not resolve asset ids).
  addTestEvidence(content, GAMEPLAY.dossierRound, { id: 'foto-berkas', kind: 'photo', title: 'Foto berkas uji', assetId: 'asset:foto-uji' });
  content.rounds[GAMEPLAY.chatRound - 1]!.mediaAssetId = 'asset:video-uji';
  const { room, clock } = makeRoom({ content });
  join(room, 'p1');
  // No customer portrait; the officer and the cast member have one. Then what each round adds (rounds 1-5).
  const scenarioWide = ['builtin:char:miss-raksa', FEATURE.castPortrait];
  const addedBy = [['builtin:bg:meja'], ['asset:video-uji'], ['asset:foto-uji'], [], [GAMEPLAY.image]];
  const expected = (r: number) => [...scenarioWide, ...addedBy.slice(0, r + 1).flat()].sort();
  assert.deepEqual(room.reachedAssetIds().sort(), expected(0), 'the lobby preloads round 1 only');
  playAll(room, clock, () => 'c1', {
    rounds: GAMEPLAY.fieldRound,
    onScene: (r) => assert.deepEqual(room.reachedAssetIds().sort(), expected(r), `round ${r + 1}`),
    afterClose: (r) => assert.deepEqual(room.reachedAssetIds().sort(), expected(r), `round ${r + 1} after close: nothing of round ${r + 2} yet`),
  });
});

test('the consequence carries the form of the own choice: a chat action stays an action after close (also on a reload), a message and a timeout read "message"', () => {
  const content = buildGameplayScenario();
  const { room, clock } = makeRoom({ content });
  const ids = ['tindakan', 'pesan', 'diam'];
  for (const id of ids) join(room, id);
  const chat = GAMEPLAY.chatRound - 1;
  const chatText = (choiceId: string) => content.text.id![textKey.choiceText(content.rounds[chat]!.id, choiceId)];
  const pick = (pid: string, r: number) => (r !== chat ? 'c1' : pid === 'tindakan' ? GAMEPLAY.actionChoice : pid === 'pesan' ? 'c1' : null);
  playAll(room, clock, pick, {
    rounds: GAMEPLAY.chatRound,
    afterClose: (r) => {
      if (r !== chat) return;
      // privateState is computed afresh: what a reloaded tab or a second device receives in this phase.
      const views = ids.map((id) => me(room, id).consequence!);
      assert.deepEqual(views.map((v) => [v.chosenText, v.chosenForm]), [[GAMEPLAY.actionText, 'action'], [chatText('c1'), 'message'], [null, 'message']], room.phase);
    },
  });
  assert.ok(room.close().ok);
  assert.deepEqual(ids.map((id) => me(room, id).summary!.decisions[chat]!.chosenForm), ['action', 'message', 'message'], 'and in the final summary');
});

test('a reload during the consequence or the leaderboard after it keeps the round\'s status line (of the band the round BEGAN in, not the band after the decision) next to the kept conditional line', () => {
  // Round 1: c1 (+8) leaves the flag; round 2 begins 12 lower for its holder and opens with a line only they see.
  const content = addTestDelayedConsequence(buildTestScenario(), { flag: FEATURE.flag, setRound: 1, choiceId: 'c1', effectRound: 2, moodDelta: -12, lineText: FEATURE.flagLine });
  content.initialMood = 23;
  const { room, clock } = makeRoom({ content });
  join(room, 'pemegang', 'Ani');
  join(room, 'lain', 'Budi');
  // The fixture writes status lines for "sangat kecewa" (0–19) only. Ani: 23 + 8 = 31, so round 2 begins at 19 and her
  // c1 (+8) ends it at 27 ("kecewa"). Budi answers c5 (+0) throughout and stays at 23 ("kecewa").
  const statusLine = 'Customer tampak sangat kecewa di tahap 2.';
  const flagLine = { id: 'f0', speaker: 'customer', name: 'Bu Rina', pos: -0.5, text: FEATURE.flagLine };
  const thread = (id: string) => [me(room, id).moodVariantLine, me(room, id).flagLines];
  playAll(room, clock, (pid) => (pid === 'pemegang' ? 'c1' : 'c5'), {
    rounds: 2,
    onAnswering: (r) => {
      if (r === 1) assert.deepEqual([thread('pemegang'), thread('lain')], [[statusLine, [flagLine]], [null, []]], 'while round 2 is answered');
    },
    afterClose: (r) => {
      if (r !== 1) return;
      // privateState is computed afresh: what a reloaded tab or a second device receives in this phase.
      if (room.phase === 'consequence' || room.phase === 'leaderboard') {
        const ani = me(room, 'pemegang');
        assert.deepEqual([ani.moodBand, ani.consequence!.bandBefore, ani.consequence!.bandAfter], ['kecewa', 'sangat_kecewa', 'kecewa']);
        // The round stays on screen through its leaderboard, so its thread stays whole there too.
        assert.deepEqual([thread('pemegang'), thread('lain')], [[statusLine, [flagLine]], [null, []]], `the round's thread stays whole on the ${room.phase}`);
      } else {
        assert.deepEqual([thread('pemegang'), thread('lain')], [[null, []], [null, []]], `nothing kept on the ${room.phase}`);
      }
    },
  });
});

test('every phase change reaches the transport as ONE phaseChanged event (it delivers public before private); no other event ever carries a new phase or round', () => {
  const calls: string[] = [];
  const stampOf = (room: StoryRoom) => `${room.phase}#${room.publicState().roundNumber}`;
  const events: StoryRoomEvents = {
    publicChanged: (room) => calls.push(`public ${stampOf(room)}`),
    privateChanged: (room, ids) => calls.push(`private ${stampOf(room)} ${ids === 'all' ? 'all' : ids.join(',')}`),
    phaseChanged: (room) => calls.push(`phase ${stampOf(room)}`),
    participantRemoved: () => {},
  };
  /** Every event carries the phase and round of the latest phaseChanged; private changes of everybody only come with one. */
  const checkSequence = (label: string) => {
    let current = 'lobby#0';
    for (const call of calls) {
      const [kind, stamp, ids] = call.split(' ');
      if (kind === 'phase') current = stamp!;
      else assert.equal(stamp, current, `${label}: "${call}" announces a phase the transport was not told about`);
      if (kind === 'private') assert.notEqual(ids, 'all', `${label}: "${call}" sends every private state outside a phase change`);
    }
  };
  const phases = () => calls.filter((c) => c.startsWith('phase ')).map((c) => c.slice('phase '.length));

  // A full session: answers close a round (all answered) or the deadline does (a participant times out every 3rd round).
  const full = makeRoom({ events });
  join(full.room, 'p1');
  join(full.room, 'p2');
  playAll(full.room, full.clock, (pid, r) => (pid === 'p2' && r % 3 === 2 ? null : 'c1'));
  const rounds = Array.from({ length: 15 }, (_, i) => i + 1);
  assert.deepEqual(phases(), [...rounds.flatMap((n) => [`scene#${n}`, `answering#${n}`, `consequence#${n}`, ...(n < 15 ? [`leaderboard#${n}`] : [])]), 'finished#15']);
  checkSequence('full session');

  // Host-paced: the host continues; a removal closes the round; the host closes the room.
  calls.length = 0;
  const paced = makeRoom({ events, auto: false });
  join(paced.room, 'p1');
  join(paced.room, 'p2');
  openAnswering(paced.room, paced.clock);
  paced.room.answer('p1', paced.room.publicState().scene!.roundId, handleFor(paced.room, 'p1', 'c1'));
  assert.ok(paced.room.removeParticipant('p2').ok);
  paced.clock.advance(TIMING.consequenceMinMs);
  assert.ok(paced.room.next().ok);
  assert.ok(paced.room.next().ok);
  assert.ok(paced.room.close().ok);
  assert.deepEqual(phases(), ['scene#1', 'answering#1', 'consequence#1', 'leaderboard#1', 'scene#2', 'interrupted#2']);
  checkSequence('host-paced session');
});
