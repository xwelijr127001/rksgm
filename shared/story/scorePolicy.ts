/**
 * Story Room score policy (PRD v0.2 FR-D1, decision log #6: accuracy 70 / speed 30, computed on the server).
 *
 * The PRD fixes only the 70:30 allocation. Partial credit, speed eligibility, rounding, ties and late packets are NOT
 * specified there; the values below are a PROVISIONAL local policy (DECISIONS.md D-07, awaiting Komite/Product),
 * recorded with every stored decision as `policyId`. Stored results keep their own `policyId` and points: they are
 * never recalculated when the policy changes.
 *
 * v1 (`story-70-30-v1`) scaled the speed points by accuracy (speedPoints = round(300 * a * s)). It was replaced by v2,
 * following the "Aturan skor" of the first Auto scenario script (Oct 2026): speed points are a flat 300 * s, granted only when the
 * chosen option has accuracy > 0. Still PROVISIONAL.
 *
 *   a = reviewer-configured accuracy of the chosen option, in [0,1] (tepat 1 · kurang tepat e.g. 0.5 · keliru 0)
 *   s = clamp(1 - serverElapsedMs / answerWindowMs, 0, 1)   (millisecond precision, server-measured)
 *   accuracyPoints = round(700 * a)
 *   speedPoints    = a > 0 ? round(300 * s) : 0   (a fast guess at a wrong answer earns nothing)
 *   roundScore     = accuracyPoints + speedPoints   (max 1000)
 *   timeout / no answer = 0
 *
 * Fixtures: a = 1 at 0/15/30 s -> 1000/850/700; a = 0.5 at 0/15 s -> 650/500; a = 0 -> 0.
 *
 * "70:30" describes the MAXIMUM allocation of the two components, not a ratio every observed score must show
 * (e.g. a full-accuracy answer at the deadline scores 700 + 0).
 */

export const STORY_SCORE_POLICY = {
  id: 'story-70-30-v2',
  maxRoundPoints: 1000,
  accuracyMaxPoints: 700,
  speedMaxPoints: 300,
  /** PRD: 30-second decision window. Part of the policy because the speed factor depends on it. */
  answerWindowMs: 30_000,
  timeoutPoints: 0,
} as const;

export type ScorePolicyId = typeof STORY_SCORE_POLICY.id;

export interface DecisionScore {
  accuracyPoints: number;
  speedPoints: number;
  roundScore: number;
  /** Speed factor s in [0,1] actually applied (0 when accuracy is 0 or the answer arrived at the deadline). */
  speedFactor: number;
}

export const NO_ANSWER_SCORE: DecisionScore = Object.freeze({ accuracyPoints: 0, speedPoints: 0, roundScore: 0, speedFactor: 0 });

/**
 * Score one accepted answer. `elapsedMs` MUST be measured by the server (receipt time - answering start).
 * Throws RangeError on accuracy outside [0,1] or non-finite input: corrupt content must never become a silent score.
 */
export function scoreDecision(
  accuracy: number,
  elapsedMs: number,
  answerWindowMs: number = STORY_SCORE_POLICY.answerWindowMs,
): DecisionScore {
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) throw new RangeError(`accuracy must be within [0,1], got ${accuracy}`);
  if (!Number.isFinite(elapsedMs)) throw new RangeError(`elapsedMs must be finite, got ${elapsedMs}`);
  if (!Number.isFinite(answerWindowMs) || answerWindowMs <= 0) throw new RangeError(`answerWindowMs must be positive, got ${answerWindowMs}`);
  const elapsed = Math.min(Math.max(elapsedMs, 0), answerWindowMs);
  const speedFactor = accuracy === 0 ? 0 : 1 - elapsed / answerWindowMs;
  const accuracyPoints = Math.round(STORY_SCORE_POLICY.accuracyMaxPoints * accuracy);
  const speedPoints = Math.round(STORY_SCORE_POLICY.speedMaxPoints * speedFactor);
  return { accuracyPoints, speedPoints, roundScore: accuracyPoints + speedPoints, speedFactor };
}

/** Highest possible session score (15 rounds x 1000). Used to bound ending score ranges. */
export const STORY_MAX_SESSION_SCORE = 15 * STORY_SCORE_POLICY.maxRoundPoints;
