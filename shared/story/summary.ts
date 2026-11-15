/**
 * Builders for the participant-facing consequence and final-summary views (PRD FR-C4, FR-C6). Shared so the live room,
 * the persisted-results reader (after a server restart) and the CMS preview render identical summaries. Texts stay
 * templates (`{nama}` is substituted by clients), so persisted summaries are neutral.
 */
import { contentText, textKey, type ContentLocale, type ScenarioContent } from './content';
import { delayedEffectsOf, flagsOf, moodBandOf, recommendedChoices, totalsOf, type DecisionResult } from './engine';
import type { StoryConsequenceView, StoryDecisionSummary, StoryFinalSummary, StoryFlagSet, StorySummaryLabels } from './protocol';
import { delayedNotesOf, flagLabelOf, respondentOf, summaryLabelsOf } from './scene';

const NO_FLAGS: ReadonlySet<string> = new Set();

/**
 * One participant's consequence of round `roundIndex`. `flagsBefore` = the flags of their decisions in EARLIER rounds
 * (engine.flagsOf), so the delayed effects applied when the round began carry their labels; without it `delayed` is [].
 * `flagSet` is filled by buildSummary only (null here: the live consequence never announces a later effect).
 */
export function consequenceViewOf(
  content: ScenarioContent,
  roundIndex: number,
  d: DecisionResult,
  locale: ContentLocale = 'id',
  flagsBefore: ReadonlySet<string> = NO_FLAGS,
): StoryConsequenceView {
  const round = content.rounds[roundIndex];
  if (!round) throw new Error(`No round ${roundIndex}`);
  const t = (key: string) => contentText(content, locale, key);
  const own = d.choiceId;
  const chosen = own ? round.choices.find((c) => c.id === own) : undefined;
  // Decisions rebuilt from rows stored before delayed effects existed carry no delayedDelta: none was applied.
  const delayedDelta = d.delayedDelta ?? 0;
  return {
    roundId: round.id,
    roundNumber: roundIndex + 1,
    outcome: d.outcome,
    chosenText: own ? t(textKey.choiceText(round.id, own)) : null,
    // A timeout has no choice: the neutral 'message' (clients show "no answer" for a null chosenText anyway).
    chosenForm: chosen?.form ?? 'message',
    consequence: own ? t(textKey.choiceConsequence(round.id, own)) : t(textKey.timeoutConsequence(round.id)),
    reason: own ? t(textKey.choiceReason(round.id, own)) : t(textKey.timeoutReason(round.id)),
    recommended: recommendedChoices(round).map((c) => ({ text: t(textKey.choiceText(round.id, c.id)), reason: t(textKey.choiceReason(round.id, c.id)) })),
    mentorReason: t(textKey.roundReason(round.id)),
    delayedDelta,
    moodBefore: d.moodBefore,
    moodAfter: d.moodAfter,
    bandBefore: moodBandOf(d.moodBefore),
    bandAfter: moodBandOf(d.moodAfter),
    score: { accuracyPoints: d.score.accuracyPoints, speedPoints: d.score.speedPoints, roundScore: d.score.roundScore, elapsedMs: d.elapsedMs },
    reply: own ? t(textKey.choiceReply(round.id, own)) : t(textKey.timeoutReply(round.id)),
    respondentName: respondentOf(content, roundIndex, locale)?.name ?? null,
    lesson: t(textKey.roundLesson(round.id)),
    delayed: delayedNotesOf(content, roundIndex, flagsBefore, delayedDelta, locale),
    flagSet: null,
  };
}

const NO_LABELS: StorySummaryLabels = { customerName: '', officerName: null, officerCharacterId: null, moodLabels: null };

/**
 * A summary persisted before later fields existed (stored JSON is never rewritten): fills the missing fields with their
 * neutral defaults ('', 0, [], null; chosenForm 'message') so readers can rely on the current shape. `labels` = the scenario's names and
 * status words for a summary stored before they were (e.g. summaryLabelsOf(version content)); neutral values otherwise.
 */
export function withSummaryDefaults(s: StoryFinalSummary, labels?: StorySummaryLabels): StoryFinalSummary {
  return {
    ...s,
    ending: s.ending ? { ...s.ending, customer: s.ending.customer ?? '', mentor: s.ending.mentor ?? '' } : null,
    decisions: s.decisions.map((d) => ({
      ...d,
      chosenForm: d.chosenForm ?? 'message',
      mentorReason: d.mentorReason ?? '',
      delayedDelta: d.delayedDelta ?? 0,
      reply: d.reply ?? '',
      respondentName: d.respondentName ?? null,
      lesson: d.lesson ?? '',
      delayed: d.delayed ?? [],
      flagSet: d.flagSet ?? null,
    })),
    // Stored labels win; a summary stored before them gets `labels`, else neutral values.
    labels: { ...NO_LABELS, ...(s.labels ?? labels) },
  };
}

export interface SummaryInput {
  content: ScenarioContent;
  /** decisions[roundIndex]; holes for rounds a participant never reached (room interrupted). */
  decisions: readonly (DecisionResult | undefined)[];
  endingId: string | null;
  rank: { rank: number; tied: boolean; of: number } | null;
  complete: boolean;
  finalMood: number;
  scorePolicyId: string;
  scenarioTitle: string;
  versionNo: number;
  roomCode: string;
  answerWindowMs: number;
  locale?: ContentLocale;
}

/**
 * Where the flag left by decision `index` showed its effect for this participant: the first later round they reached
 * whose delayed effects include it (with the share it made there), else the first later round with a line only flag
 * holders see (delta null), else null/null. null when the decision left no flag.
 */
function flagSetOf(input: SummaryInput, index: number, locale: ContentLocale): StoryFlagSet | null {
  const { content, decisions } = input;
  const own = decisions[index]?.choiceId;
  const flag = own ? content.rounds[index]?.choices.find((c) => c.id === own)?.setsFlag : null;
  if (!flag) return null;
  const label = flagLabelOf(content, locale, flag);
  for (let j = index + 1; j < content.rounds.length; j++) {
    const later = decisions[j];
    const round = content.rounds[j]!;
    if (!later || !round.flagEffects.some((e) => e.flag === flag)) continue;
    const share = delayedEffectsOf(round, flagsOf(content.rounds, decisions.slice(0, j)), later.delayedDelta ?? 0).find((e) => e.flag === flag);
    return { label, effectRound: j + 1, delta: share?.delta ?? 0 };
  }
  for (let j = index + 1; j < content.rounds.length; j++) {
    if (decisions[j] && content.rounds[j]!.lines.some((l) => l.ifFlag === flag)) return { label, effectRound: j + 1, delta: null };
  }
  return { label, effectRound: null, delta: null };
}

export function buildSummary(input: SummaryInput): StoryFinalSummary {
  const locale = input.locale ?? 'id';
  const t = (key: string) => contentText(input.content, locale, key);
  const decisions: StoryDecisionSummary[] = [];
  const settled: DecisionResult[] = [];
  input.decisions.forEach((d, i) => {
    if (!d) return;
    settled.push(d);
    const round = input.content.rounds[i]!;
    const flagsBefore = flagsOf(input.content.rounds, input.decisions.slice(0, i));
    decisions.push({
      ...consequenceViewOf(input.content, i, d, locale, flagsBefore),
      flagSet: flagSetOf(input, i, locale),
      title: t(textKey.roundTitle(round.id)),
      prompt: t(textKey.roundPrompt(round.id)),
    });
  });
  const ending = input.endingId ? input.content.endings.find((e) => e.id === input.endingId) ?? null : null;
  const totals = totalsOf(settled, input.answerWindowMs);
  return {
    complete: input.complete,
    ending: ending
      ? {
          id: ending.id,
          kind: ending.kind,
          title: t(textKey.endingTitle(ending.id)),
          text: t(textKey.endingText(ending.id)),
          customer: t(textKey.endingCustomer(ending.id)),
          mentor: t(textKey.endingMentor(ending.id)),
        }
      : null,
    decisions,
    totals: {
      totalScore: totals.totalScore,
      accuracyPoints: totals.accuracyPoints,
      speedPoints: totals.speedPoints,
      answeredCount: totals.answeredCount,
      timeoutCount: totals.timeoutCount,
    },
    rank: input.rank,
    finalMood: input.finalMood,
    finalBand: moodBandOf(input.finalMood),
    scorePolicyId: input.scorePolicyId,
    scenarioTitle: input.scenarioTitle,
    versionNo: input.versionNo,
    roomCode: input.roomCode,
    labels: summaryLabelsOf(input.content, locale),
  };
}
