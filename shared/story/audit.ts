/**
 * Option audit (authoring guidance): words and characters of every option, the length rank of the recommended one,
 * and how far the blind strategies "always pick the longest" / "always pick the shortest" would get. Pure; shared by
 * the CMS audit panel, the validation warnings (choice_long, choice_length_hint, lesson_long; AUTHORING_HINTS also sets
 * the bound of choice_form_hint) and the private audit script. A design check, not statistical proof that a round is
 * free of bias.
 */
import { contentText, textKey, type Classification, type ContentLocale, type RoundContent, type ScenarioContent } from './content';
import { scoreDecision, STORY_SCORE_POLICY } from './scorePolicy';

/** Editorial targets behind the authoring warnings (never blocking publication). */
export const AUTHORING_HINTS = {
  /** choice_long above this many words (target 8–16). */
  choiceWordsMax: 20,
  /** lesson_long above this many words (target 15–25). */
  lessonWordsMax: 30,
  /** choice_length_hint: a recommended option that is the longest AND at least this times the median of the others. */
  lengthTellRatio: 1.5,
  /** choice_form_hint: at least this many options marked as actions, none of them tepat (a pattern players can learn). */
  actionMarkMinOptions: 2,
} as const;

/** Elapsed time the strategy points assume by default (half of the answer window). */
const DEFAULT_AUDIT_ELAPSED_MS = 15_000;

/** Whitespace-separated tokens; the {nama} placeholder counts as one word. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

/** Unicode code points (what an author counts as characters). */
export function charCount(text: string): number {
  return [...text].length;
}

export interface OptionAuditRow {
  choiceId: string;
  classification: Classification;
  accuracy: number;
  words: number;
  chars: number;
  /** 1 = longest (by characters); options of equal length share the best rank. */
  rankLongest: number;
}

export interface RoundAudit {
  roundId: string;
  /** In authored order (the same order as RoundContent.choices). */
  options: OptionAuditRow[];
  /** Best length rank among the recommended (tepat) options; 0 when the round has none. */
  recommendedRank: number;
  /** A recommended option is (one of) the longest. */
  recommendedIsLongest: boolean;
  /** A recommended option is (one of) the shortest. */
  recommendedIsShortest: boolean;
  /** More than one option shares the longest length. */
  tieAtTop: boolean;
}

/**
 * Result of a blind strategy over the scenario. With ties the pick is random among the tied options: `tepatWorst` /
 * `tepatBest` count the rounds where every / at least one tied pick is tepat, `tepatExpected` the expected number of
 * tepat picks, `expectedPoints` the expected session points under the active score policy (kurang tepat weights
 * included). Expected values are rounded to 2 decimals.
 */
export interface StrategyResult {
  tepatWorst: number;
  tepatBest: number;
  tepatExpected: number;
  expectedPoints: number;
}

export interface ScenarioAudit {
  rounds: RoundAudit[];
  longest: StrategyResult;
  shortest: StrategyResult;
}

/** Audit of one round's options in `locale` (texts are templates; missing texts fall back to the default locale). */
export function auditRound(content: Pick<ScenarioContent, 'text'>, round: RoundContent, locale: ContentLocale): RoundAudit {
  const measured = round.choices.map((c) => {
    const text = contentText(content, locale, textKey.choiceText(round.id, c.id));
    return { choiceId: c.id, classification: c.classification, accuracy: c.accuracy, words: wordCount(text), chars: charCount(text) };
  });
  const options: OptionAuditRow[] = measured.map((o) => ({ ...o, rankLongest: 1 + measured.filter((x) => x.chars > o.chars).length }));
  const recommended = options.filter((o) => o.classification === 'tepat');
  const shortest = Math.min(...options.map((o) => o.chars));
  return {
    roundId: round.id,
    options,
    recommendedRank: recommended.length ? Math.min(...recommended.map((o) => o.rankLongest)) : 0,
    recommendedIsLongest: recommended.some((o) => o.rankLongest === 1),
    recommendedIsShortest: recommended.some((o) => o.chars === shortest),
    tieAtTop: options.filter((o) => o.rankLongest === 1).length > 1,
  };
}

/** Points of one pick under the active policy; an out-of-range accuracy (an unfinished draft) counts as 0. */
function pointsOf(accuracy: number, elapsedMs: number): number {
  const valid = Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 1;
  return valid ? scoreDecision(accuracy, elapsedMs, STORY_SCORE_POLICY.answerWindowMs).roundScore : 0;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** A blind strategy that always picks the options of the extreme length (`pickOf` returns that length). */
function strategyOf(rounds: readonly RoundAudit[], pickOf: (chars: number[]) => number, elapsedMs: number): StrategyResult {
  let tepatWorst = 0;
  let tepatBest = 0;
  let tepatExpected = 0;
  let expectedPoints = 0;
  for (const r of rounds) {
    if (r.options.length === 0) continue;
    const target = pickOf(r.options.map((o) => o.chars));
    const picks = r.options.filter((o) => o.chars === target);
    const tepat = picks.filter((o) => o.classification === 'tepat').length;
    if (tepat === picks.length) tepatWorst++;
    if (tepat > 0) tepatBest++;
    tepatExpected += tepat / picks.length;
    expectedPoints += picks.reduce((n, o) => n + pointsOf(o.accuracy, elapsedMs), 0) / picks.length;
  }
  return { tepatWorst, tepatBest, tepatExpected: round2(tepatExpected), expectedPoints: round2(expectedPoints) };
}

/**
 * Audit of every round plus the "longest" and "shortest" blind strategies; `elapsedMs` = answer time the strategy
 * points assume (default 15 s, under the active score policy).
 */
export function auditOptions(content: ScenarioContent, locale: ContentLocale, elapsedMs: number = DEFAULT_AUDIT_ELAPSED_MS): ScenarioAudit {
  const rounds = content.rounds.map((r) => auditRound(content, r, locale));
  return {
    rounds,
    longest: strategyOf(rounds, (chars) => Math.max(...chars), elapsedMs),
    shortest: strategyOf(rounds, (chars) => Math.min(...chars), elapsedMs),
  };
}
