/**
 * Narrative rules of the hub story (PRD "Model hub", FR-C3–C5). Pure functions used by BOTH the server room runtime
 * and the CMS preview, so gameplay and preview can never diverge.
 *
 * Hub model: every choice of a round leads to the SAME next round for everybody; what differs per participant is the
 * carried customer mood, the consequences seen and the score. A wrong choice never ends a session early.
 *
 * Delayed consequences: a choice may leave a flag (`setsFlag`); a LATER round reacts to it with a mood change applied
 * when that round begins (`flagEffects`) and with lines only flag holders see (`DialogueLine.ifFlag`). Flags come from
 * the participant's own settled decisions in earlier rounds (validation guarantees effects reference earlier rounds).
 */
import {
  MOOD_BANDS,
  MOOD_BAND_FLOOR,
  MOOD_MAX,
  MOOD_MIN,
  STORY_ROUND_COUNT,
  type ChoiceContent,
  type Classification,
  type DialogueLine,
  type EndingContent,
  type MoodBand,
  type RoundContent,
  type ScenarioContent,
} from './content';
import { NO_ANSWER_SCORE, scoreDecision, STORY_SCORE_POLICY, type DecisionScore } from './scorePolicy';

export function clampMood(mood: number): number {
  return Math.min(MOOD_MAX, Math.max(MOOD_MIN, Math.round(mood)));
}

export function moodBandOf(mood: number): MoodBand {
  const m = clampMood(mood);
  let band: MoodBand = MOOD_BANDS[0];
  for (const b of MOOD_BANDS) if (m >= MOOD_BAND_FLOOR[b]) band = b;
  return band;
}

/** Outcome category of one decision, including the timeout case. */
export type DecisionOutcome = Classification | 'timeout';

export interface DecisionResult {
  roundId: string;
  /** null = no answer before the deadline (timeout). */
  choiceId: string | null;
  outcome: DecisionOutcome;
  accuracy: number;
  /** Server-measured elapsed time; null for timeouts. */
  elapsedMs: number | null;
  score: DecisionScore;
  /** Mood carried into the round from the previous decision (before delayed effects). */
  moodCarried: number;
  /** Clamped change applied when the round began, from flags set earlier (0 = none). */
  delayedDelta: number;
  /** Mood at decision time = clamp(moodCarried + matching flag effects). */
  moodBefore: number;
  /** clamp(moodBefore + the chosen choice's or the timeout's moodDelta). */
  moodAfter: number;
  /** moodAfter − moodBefore (the decision's own effect; the delayed effect is in `delayedDelta`). */
  moodDelta: number;
}

const NO_FLAGS: ReadonlySet<string> = new Set();

/**
 * Flags set by the participant's settled decisions (chosen choices' `setsFlag`; timeouts set none). Decisions are
 * matched to rounds by `roundId`, so both sparse (`decisions[roundIndex]`) and compact arrays work. Pass only the
 * decisions of rounds BEFORE the one being resolved.
 */
export function flagsOf(rounds: readonly RoundContent[], decisions: readonly (DecisionResult | undefined)[]): Set<string> {
  const flags = new Set<string>();
  for (const d of decisions) {
    if (!d || d.choiceId === null) continue;
    const choice = rounds.find((r) => r.id === d.roundId)?.choices.find((c) => c.id === d.choiceId);
    if (choice?.setsFlag) flags.add(choice.setsFlag);
  }
  return flags;
}

/** Mood when a round begins for a participant holding `flags`: the carried mood plus the matching delayed effects. */
export function moodAtRoundStart(round: RoundContent, carried: number, flags: ReadonlySet<string>): { mood: number; delayedDelta: number } {
  const start = clampMood(carried);
  let delta = 0;
  if (flags.size > 0) for (const e of round.flagEffects) if (flags.has(e.flag)) delta += e.moodDelta;
  const mood = clampMood(start + delta);
  return { mood, delayedDelta: mood - start };
}

/**
 * The delayed effects behind a round's start for a participant holding `flags`: one entry per matching effect, in
 * authored order, with the share of `applied` (the clamped total, `moodAtRoundStart(...).delayedDelta`) it made. Without
 * clamping each share is the authored delta; what clamping at 0/100 cut is taken from the effects pushing that way,
 * the last authored first, so the shares always add up to `applied` (a share may be 0).
 */
export function delayedEffectsOf(round: RoundContent, flags: ReadonlySet<string>, applied: number): { flag: string; delta: number }[] {
  const shares = round.flagEffects.filter((e) => flags.has(e.flag)).map((e) => ({ flag: e.flag, delta: e.moodDelta }));
  let cut = shares.reduce((n, s) => n + s.delta, 0) - applied;
  for (let i = shares.length - 1; i >= 0 && cut !== 0; i--) {
    const share = shares[i]!;
    if (Math.sign(share.delta) !== Math.sign(cut)) continue;
    const taken = Math.sign(cut) * Math.min(Math.abs(share.delta), Math.abs(cut));
    share.delta -= taken;
    cut -= taken;
  }
  return shares;
}

/**
 * 0-based index of the latest round before `beforeIndex` with a choice that leaves `flag` (the round a reminder of that
 * flag names), or null. Exact whenever a flag is left in one round only; validation warns otherwise (flag_multi_round).
 */
export function flagSourceIndex(rounds: readonly RoundContent[], flag: string, beforeIndex: number): number | null {
  for (let i = Math.min(beforeIndex, rounds.length) - 1; i >= 0; i--) {
    if (rounds[i]!.choices.some((c) => c.setsFlag === flag)) return i;
  }
  return null;
}

/** Lines a participant sees: unconditional + those whose ifFlag they hold. */
export function visibleLines(lines: readonly DialogueLine[], flags: ReadonlySet<string>): DialogueLine[] {
  return lines.filter((l) => !l.ifFlag || flags.has(l.ifFlag));
}

/**
 * Apply one decision to a participant's carried mood. Exactly one of `choice` / timeout applies; the round's authored
 * timeout consequence is used when `choice` is null. The round's delayed effects for `flags` (set in EARLIER rounds)
 * apply first — answered or not. Mood changes are applied once per round by construction: the caller stores the
 * returned result, carries `moodAfter` into the next round, and never re-applies it.
 */
export function resolveDecision(
  round: RoundContent,
  moodCarried: number,
  choice: ChoiceContent | null,
  elapsedMs: number | null,
  answerWindowMs: number = STORY_SCORE_POLICY.answerWindowMs,
  flags: ReadonlySet<string> = NO_FLAGS,
): DecisionResult {
  const carried = clampMood(moodCarried);
  const { mood: before, delayedDelta } = moodAtRoundStart(round, carried, flags);
  if (choice === null) {
    const after = clampMood(before + round.timeout.moodDelta);
    return {
      roundId: round.id,
      choiceId: null,
      outcome: 'timeout',
      accuracy: 0,
      elapsedMs: null,
      score: NO_ANSWER_SCORE,
      moodCarried: carried,
      delayedDelta,
      moodBefore: before,
      moodAfter: after,
      moodDelta: after - before,
    };
  }
  if (elapsedMs === null) throw new Error('An answered decision needs a server-measured elapsed time');
  const after = clampMood(before + choice.moodDelta);
  return {
    roundId: round.id,
    choiceId: choice.id,
    outcome: choice.classification,
    accuracy: choice.accuracy,
    elapsedMs,
    score: scoreDecision(choice.accuracy, elapsedMs, answerWindowMs),
    moodCarried: carried,
    delayedDelta,
    moodBefore: before,
    moodAfter: after,
    moodDelta: after - before,
  };
}

/** Choices the committee classified as `tepat` (the recommended decision shown after the round closes). */
export function recommendedChoices(round: RoundContent): ChoiceContent[] {
  return round.choices.filter((c) => c.classification === 'tepat');
}

export function endingMatches(ending: EndingContent, mood: number, totalScore: number): boolean {
  const inRange = (v: number, min: number | null, max: number | null) => (min === null || v >= min) && (max === null || v <= max);
  return inRange(mood, ending.minMood, ending.maxMood) && inRange(totalScore, ending.minScore, ending.maxScore);
}

/**
 * Ending selection (PRD FR-C5): first ending, in authored order, whose mood AND score ranges contain the participant's
 * final values (null bounds = unbounded, so endings without score bounds are chosen by mood only). Validation requires
 * the last ending to be unconditional, so a valid scenario always yields an ending; the defensive fallback to the last
 * ending covers content that bypassed validation.
 */
export function selectEnding(endings: readonly EndingContent[], finalMood: number, totalScore: number): EndingContent {
  const hit = endings.find((e) => endingMatches(e, clampMood(finalMood), totalScore));
  const ending = hit ?? endings[endings.length - 1];
  if (!ending) throw new Error('Scenario has no endings');
  return ending;
}

/** Totals of a participant's decisions. */
export interface DecisionTotals {
  totalScore: number;
  accuracyPoints: number;
  speedPoints: number;
  answeredCount: number;
  timeoutCount: number;
  /** Sum of server-measured answer times; a timeout counts as the full window (used only for display ordering). */
  totalElapsedMs: number;
}

export function totalsOf(decisions: readonly DecisionResult[], answerWindowMs: number = STORY_SCORE_POLICY.answerWindowMs): DecisionTotals {
  const t: DecisionTotals = { totalScore: 0, accuracyPoints: 0, speedPoints: 0, answeredCount: 0, timeoutCount: 0, totalElapsedMs: 0 };
  for (const d of decisions) {
    t.totalScore += d.score.roundScore;
    t.accuracyPoints += d.score.accuracyPoints;
    t.speedPoints += d.score.speedPoints;
    if (d.outcome === 'timeout') t.timeoutCount++;
    else t.answeredCount++;
    t.totalElapsedMs += d.elapsedMs ?? answerWindowMs;
  }
  return t;
}

/**
 * Deterministically plays a whole scenario for one participant with a picker (used by the CMS preview "auto-play"
 * paths and by tests). `pick(round, index)` returns the chosen choice ID or null (timeout) plus elapsed ms. Flags left
 * by earlier choices drive later rounds' delayed effects exactly as in the room.
 */
export function playThrough(
  content: Pick<ScenarioContent, 'rounds' | 'endings' | 'initialMood'>,
  pick: (round: RoundContent, index: number) => { choiceId: string | null; elapsedMs: number },
): { decisions: DecisionResult[]; ending: EndingContent; totals: DecisionTotals; finalMood: number } {
  if (content.rounds.length !== STORY_ROUND_COUNT) throw new Error(`Scenario must have ${STORY_ROUND_COUNT} rounds`);
  let mood = clampMood(content.initialMood);
  const decisions: DecisionResult[] = [];
  // Flags of EARLIER rounds only: a choice's flag is added after its own round is resolved.
  const flags = new Set<string>();
  content.rounds.forEach((round, index) => {
    const p = pick(round, index);
    const choice = p.choiceId === null ? null : round.choices.find((c) => c.id === p.choiceId);
    if (choice === undefined) throw new Error(`Unknown choice ${p.choiceId} in round ${round.id}`);
    const d = resolveDecision(round, mood, choice, choice ? p.elapsedMs : null, STORY_SCORE_POLICY.answerWindowMs, flags);
    decisions.push(d);
    mood = d.moodAfter;
    if (choice?.setsFlag) flags.add(choice.setsFlag);
  });
  const totals = totalsOf(decisions);
  return { decisions, ending: selectEnding(content.endings, mood, totals.totalScore), totals, finalMood: mood };
}
