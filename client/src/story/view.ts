/**
 * Pure view helpers of the Story Room pages (unit-tested in view.test.ts).
 *
 * `{nama}` personalization: servers send scenario texts as TEMPLATES (shared/story/protocol.ts). Pages personalize
 * whole snapshots where they enter: the participant's device with the participant's own name, the projector and the
 * host console with a neutral word (`ruang.namaUmum`), so no rendered scenario text can show a literal `{nama}`.
 * Only scenario texts change; ids, asset ids, participant names and numbers stay as they are.
 */
import { MOOD_BANDS, personalize, type MoodBand } from '@shared/story/content';
import type {
  StoryConsequenceView,
  StoryDecisionSummary,
  StoryDelayedEffect,
  StoryEvidence,
  StoryFinalSummary,
  StoryPrivateState,
  StoryPublicState,
  StoryScenarioLabel,
  StorySceneLine,
  StoryScenePublic,
  StorySummaryLabels,
} from '@shared/story/protocol';
import { withSummaryDefaults } from '@shared/story/summary';

export function personalizeLine(l: StorySceneLine, name: string): StorySceneLine {
  return { ...l, name: l.name === null ? null : personalize(l.name, name), text: personalize(l.text, name) };
}

function personalizeEvidence(e: StoryEvidence, name: string): StoryEvidence {
  const p = (x: string) => personalize(x, name);
  return { ...e, kicker: p(e.kicker), title: p(e.title), body: p(e.body), rows: e.rows.map((r) => ({ ...r, label: p(r.label), value: p(r.value) })) };
}

export function personalizeScene(s: StoryScenePublic, name: string): StoryScenePublic {
  const p = (x: string) => personalize(x, name);
  return {
    ...s,
    title: p(s.title),
    meta: p(s.meta),
    prompt: p(s.prompt),
    intro: s.intro.map((l) => personalizeLine(l, name)),
    lines: s.lines.map((l) => personalizeLine(l, name)),
    action: p(s.action),
    evidence: s.evidence.map((e) => personalizeEvidence(e, name)),
    respondent: s.respondent ? { ...s.respondent, name: s.respondent.name === null ? null : p(s.respondent.name) } : null,
    lesson: p(s.lesson),
  };
}

function personalizeMoodLabels(labels: Record<MoodBand, string> | null, name: string): Record<MoodBand, string> | null {
  return labels ? (Object.fromEntries(MOOD_BANDS.map((b) => [b, personalize(labels[b], name)])) as Record<MoodBand, string>) : null;
}

export function personalizeLabel(l: StoryScenarioLabel, name: string): StoryScenarioLabel {
  const p = (x: string) => personalize(x, name);
  return {
    ...l,
    title: p(l.title),
    customerName: p(l.customerName),
    officerName: l.officerName === null ? null : p(l.officerName),
    moodLabels: personalizeMoodLabels(l.moodLabels, name),
  };
}

/** Delayed effects and reminders: only the flag's label is scenario text. */
function personalizeDelayed(e: StoryDelayedEffect, name: string): StoryDelayedEffect {
  return { ...e, label: personalize(e.label, name) };
}

/** Room snapshot (room channel, projector, host): scenario label and current scene. */
export function personalizePublicState(s: StoryPublicState, name: string): StoryPublicState {
  return { ...s, scenario: personalizeLabel(s.scenario, name), scene: s.scene ? personalizeScene(s.scene, name) : null };
}

export function personalizeConsequence<T extends StoryConsequenceView>(v: T, name: string): T {
  const p = (x: string) => personalize(x, name);
  return {
    ...v,
    chosenText: v.chosenText === null ? null : p(v.chosenText),
    consequence: p(v.consequence),
    reason: p(v.reason),
    recommended: v.recommended.map((r) => ({ text: p(r.text), reason: p(r.reason) })),
    mentorReason: p(v.mentorReason),
    reply: p(v.reply),
    respondentName: v.respondentName === null ? null : p(v.respondentName),
    lesson: p(v.lesson),
    delayed: v.delayed.map((e) => personalizeDelayed(e, name)),
    flagSet: v.flagSet ? { ...v.flagSet, label: p(v.flagSet.label) } : null,
  };
}

function personalizeDecision(d: StoryDecisionSummary, name: string): StoryDecisionSummary {
  return { ...personalizeConsequence(d, name), title: personalize(d.title, name), prompt: personalize(d.prompt, name) };
}

/**
 * Final summary, live or persisted (summaries stored before ending words, mentor reasons, replies or labels existed
 * get their neutral defaults).
 */
export function personalizeSummary(s: StoryFinalSummary, name: string): StoryFinalSummary {
  const full = withSummaryDefaults(s);
  const p = (x: string) => personalize(x, name);
  const l = full.labels;
  return {
    ...full,
    ending: full.ending ? { ...full.ending, title: p(full.ending.title), text: p(full.ending.text), customer: p(full.ending.customer), mentor: p(full.ending.mentor) } : null,
    decisions: full.decisions.map((d) => personalizeDecision(d, name)),
    scenarioTitle: p(full.scenarioTitle),
    labels: { ...l, customerName: p(l.customerName), officerName: l.officerName === null ? null : p(l.officerName), moodLabels: personalizeMoodLabels(l.moodLabels, name) },
  };
}

/** One participant's private state (their own device only). */
export function personalizePrivateState(me: StoryPrivateState, name: string): StoryPrivateState {
  const p = (x: string) => personalize(x, name);
  return {
    ...me,
    moodVariantLine: me.moodVariantLine === null ? null : p(me.moodVariantLine),
    flagLines: me.flagLines.map((l) => personalizeLine(l, name)),
    flagReminders: me.flagReminders.map((r) => personalizeDelayed(r, name)),
    options: me.options ? me.options.map((o) => ({ ...o, text: p(o.text) })) : null,
    consequence: me.consequence ? personalizeConsequence(me.consequence, name) : null,
    summary: me.summary ? personalizeSummary(me.summary, name) : null,
  };
}

/**
 * Names and status words a final summary is shown with. The summary's stored labels win (a result reopened after
 * the room left memory reads like the live room); a summary stored before labels existed borrows them from the live
 * room when there is one. Without either, `bandWordsKnown` is false: the page then shows no status word at all rather
 * than a default word that may name a different band of this scenario.
 */
export function summaryNamesOf(
  labels: StorySummaryLabels,
  live: Pick<StoryScenarioLabel, 'customerName' | 'officerName' | 'officerCharacterId' | 'moodLabels'> | null,
): { customerName: string | null; officerName: string | null; officerCharacterId: string | null; moodLabels: Record<MoodBand, string> | null; bandWordsKnown: boolean } {
  // buildSummary always stores the customer's name, so an empty one marks a summary stored before labels existed.
  if (labels.customerName) return { ...labels, bandWordsKnown: true };
  if (live) return { customerName: live.customerName || null, officerName: live.officerName, officerCharacterId: live.officerCharacterId, moodLabels: live.moodLabels, bandWordsKnown: true };
  return { customerName: null, officerName: null, officerCharacterId: null, moodLabels: null, bandWordsKnown: false };
}

/** Signed status change for notes: "+4", "−12" (U+2212 minus sign), "0". */
export function signedNumber(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}
