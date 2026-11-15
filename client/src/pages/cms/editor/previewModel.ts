/**
 * Play state of the CMS preview: one participant playing the draft in this browser with the room's rules
 * (shared/story/engine) — carried mood, flags left by earlier choices, delayed effects when a round begins. Pure;
 * unit-tested in ../contentEdit.test.ts.
 */
import type { ScenarioContent } from '@shared/story/content';
import { clampMood, flagsOf, recommendedChoices, resolveDecision, type DecisionResult } from '@shared/story/engine';
import { STORY_SCORE_POLICY } from '@shared/story/scorePolicy';

/** Mood carried into the next round and the flags held after `decisions` (the rounds played so far, in order). */
export function carriedState(c: ScenarioContent, decisions: readonly DecisionResult[]): { mood: number; flags: Set<string> } {
  const last = decisions[decisions.length - 1];
  return { mood: last ? last.moodAfter : clampMood(c.initialMood), flags: flagsOf(c.rounds, decisions) };
}

/**
 * Decide round `decisions.length` exactly as the room does (flags of the earlier rounds apply their delayed effects
 * first). `choiceId` null, or an unknown ID, = timeout.
 */
export function decideNext(c: ScenarioContent, decisions: readonly DecisionResult[], choiceId: string | null, elapsedMs: number): DecisionResult[] {
  const round = c.rounds[decisions.length];
  if (!round) return [...decisions];
  const choice = choiceId === null ? null : round.choices.find((x) => x.id === choiceId) ?? null;
  const { mood, flags } = carriedState(c, decisions);
  return [...decisions, resolveDecision(round, mood, choice, choice ? elapsedMs : null, STORY_SCORE_POLICY.answerWindowMs, flags)];
}

/** The first `count` rounds answered with the recommended (tepat) choice at `elapsedMs` (a round without one times out). */
export function autoDecisions(c: ScenarioContent, count: number, elapsedMs = 10_000): DecisionResult[] {
  let out: DecisionResult[] = [];
  for (const round of c.rounds.slice(0, Math.max(0, count))) out = decideNext(c, out, recommendedChoices(round)[0]?.id ?? null, elapsedMs);
  return out;
}
