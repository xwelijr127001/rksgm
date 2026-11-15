/**
 * Scene payloads built from scenario content: speaker names, public lines, evidence, a participant's conditional
 * (delayed-consequence) lines and reminders, status words, and the scenario label. Pure functions shared by the server
 * room runtime and the CMS preview, so both show the same lines, names and moods. Texts stay templates (`{nama}` is
 * substituted by clients).
 */
import {
  contentText,
  MOOD_BANDS,
  textKey,
  type ContentLocale,
  type DialogueLine,
  type EvidenceItem,
  type MoodBand,
  type ScenarioContent,
  type SpeakerRef,
} from './content';
import { delayedEffectsOf, flagSourceIndex, moodAtRoundStart, moodBandOf } from './engine';
import {
  LESSON_PHASES,
  type StoryDelayedEffect,
  type StoryEvidence,
  type StoryPhase,
  type StoryRespondent,
  type StoryScenarioLabel,
  type StorySceneLine,
  type StoryScenePublic,
  type StorySummaryLabels,
} from './protocol';

/** Display name of a line's speaker (customer/officer/cast name from the scenario text); null for narration or a missing name. */
export function speakerNameOf(content: Pick<ScenarioContent, 'text'>, locale: ContentLocale, line: SpeakerRef): string | null {
  const name = (key: string) => contentText(content, locale, key) || null;
  if (line.speaker === 'customer') return name(textKey.customerName());
  if (line.speaker === 'officer') return name(textKey.officerName());
  if (line.speaker === 'cast') return line.castId ? name(textKey.castName(line.castId)) : null;
  return null;
}

/** A scene line with its speaker's display name and its text (key from the authored line id). */
function sceneLine(
  content: Pick<ScenarioContent, 'text'>,
  locale: ContentLocale,
  line: DialogueLine,
  keyOf: (lineId: string) => string,
  id: string,
  pos: number,
): StorySceneLine {
  return { id, speaker: line.speaker, name: speakerNameOf(content, locale, line), pos, text: contentText(content, locale, keyOf(line.id)) };
}

/**
 * The unconditional lines of `lines` (shown to everybody), numbered 0..n−1 among themselves (`pos`), so a shared payload
 * never shows that hidden lines exist; `idOf` names each one.
 */
function publicSceneLines(
  content: Pick<ScenarioContent, 'text'>,
  locale: ContentLocale,
  lines: readonly DialogueLine[],
  keyOf: (lineId: string) => string,
  idOf: (line: DialogueLine, pos: number) => string,
): StorySceneLine[] {
  return lines.filter((l) => !l.ifFlag).map((l, pos) => sceneLine(content, locale, l, keyOf, idOf(l, pos), pos));
}

/**
 * The conditional lines of `lines` seen by a participant holding `flags`, in authored order with ids f0, f1, … Each sits
 * after the public lines authored before it (their count − 0.5, +0.01 per earlier line of the same run that this
 * participant sees), so mergeSceneLines restores the authored order and nothing hints at lines of flags they do not
 * hold. Rounds hold at most 10 lines, so the 0.01 steps never reach the next public line.
 */
function conditionalSceneLines(
  content: Pick<ScenarioContent, 'text'>,
  locale: ContentLocale,
  lines: readonly DialogueLine[],
  keyOf: (lineId: string) => string,
  flags: ReadonlySet<string>,
): StorySceneLine[] {
  const out: StorySceneLine[] = [];
  let publicBefore = 0;
  let run = 0;
  for (const l of lines) {
    if (!l.ifFlag) {
      publicBefore++;
      run = 0;
    } else if (flags.has(l.ifFlag)) {
      out.push(sceneLine(content, locale, l, keyOf, `f${out.length}`, publicBefore - 0.5 + run / 100));
      run++;
    }
  }
  return out;
}

/** An evidence item with its texts (the same for everybody). */
function evidenceOf(content: Pick<ScenarioContent, 'text'>, locale: ContentLocale, roundId: string, item: EvidenceItem): StoryEvidence {
  const t = (key: string) => contentText(content, locale, key);
  return {
    id: item.id,
    kind: item.kind,
    kicker: t(textKey.evidenceKicker(roundId, item.id)),
    title: t(textKey.evidenceTitle(roundId, item.id)),
    body: t(textKey.evidenceBody(roundId, item.id)),
    assetId: item.assetId,
    spot: item.spot ? { x: item.spot.x, y: item.spot.y } : null,
    rows: item.rows.map((r) => ({
      id: r.id,
      mark: r.mark,
      label: t(textKey.evidenceRow(roundId, item.id, r.id)),
      value: t(textKey.evidenceRowValue(roundId, item.id, r.id)),
    })),
  };
}

/** The round's respondent with its display name; null for narration only. */
export function respondentOf(content: ScenarioContent, roundIndex: number, locale: ContentLocale): StoryRespondent | null {
  const ref = content.rounds[roundIndex]?.respondent;
  return ref ? { speaker: ref.speaker, name: speakerNameOf(content, locale, ref) } : null;
}

/**
 * Public scene of round `roundIndex` (room channel, projector, host, every participant): unconditional lines only (ids
 * p0, p1, …), the opening lines on round 1 (authored ids), the shared evidence, and the lesson only when `phase` is one
 * of LESSON_PHASES (the default 'scene' keeps it hidden). null when the round does not exist.
 */
export function scenePublicOf(content: ScenarioContent, roundIndex: number, locale: ContentLocale, phase: StoryPhase = 'scene'): StoryScenePublic | null {
  const round = content.rounds[roundIndex];
  if (!round) return null;
  const t = (key: string) => contentText(content, locale, key);
  return {
    roundId: round.id,
    roundNumber: roundIndex + 1,
    title: t(textKey.roundTitle(round.id)),
    meta: t(textKey.roundMeta(round.id)),
    keyRound: round.keyRound,
    layout: round.layout,
    prompt: t(textKey.roundPrompt(round.id)),
    backgroundAssetId: round.backgroundAssetId,
    showOfficer: round.showOfficer,
    mediaAssetId: round.mediaAssetId,
    intro: roundIndex === 0 ? publicSceneLines(content, locale, content.intro, (id) => textKey.introLine(id), (l) => l.id) : [],
    lines: publicSceneLines(content, locale, round.lines, (id) => textKey.line(round.id, id), (_line, pos) => `p${pos}`),
    action: t(textKey.roundAction(round.id)),
    evidence: round.evidence.map((item) => evidenceOf(content, locale, round.id, item)),
    respondent: respondentOf(content, roundIndex, locale),
    lesson: LESSON_PHASES.includes(phase) ? t(textKey.roundLesson(round.id)) : '',
  };
}

/** Conditional lines of round `roundIndex` seen by a participant holding `flags` (PRIVATE: never on shared screens). */
export function flagLinesOf(content: ScenarioContent, roundIndex: number, flags: ReadonlySet<string>, locale: ContentLocale): StorySceneLine[] {
  const round = content.rounds[roundIndex];
  if (!round || flags.size === 0) return [];
  return conditionalSceneLines(content, locale, round.lines, (id) => textKey.line(round.id, id), flags);
}

/** The line about the customer's state of a round that began at `mood` (the variant of that band), or null when it has none. */
export function moodVariantLineOf(content: Pick<ScenarioContent, 'rounds' | 'text'>, roundIndex: number, mood: number, locale: ContentLocale): string | null {
  const round = content.rounds[roundIndex];
  return round ? contentText(content, locale, textKey.moodVariant(round.id, moodBandOf(mood))) || null : null;
}

/** Public lines merged with a participant's conditional lines, in authored order (by `pos`). */
export function mergeSceneLines(lines: readonly StorySceneLine[], flagLines: readonly StorySceneLine[] = []): StorySceneLine[] {
  return [...lines, ...flagLines].sort((a, b) => a.pos - b.pos);
}

/** How a flag is named to its holder ('' when the scenario gives it no label). */
export function flagLabelOf(content: Pick<ScenarioContent, 'text'>, locale: ContentLocale, flag: string): string {
  return contentText(content, locale, textKey.flagLabel(flag));
}

/**
 * The delayed effects round `roundIndex` applied when it began for a participant holding `flags` (PRIVATE), with labels,
 * the round that left each flag (engine.flagSourceIndex) and the share of `applied` (the clamped total) each made.
 */
export function delayedNotesOf(content: ScenarioContent, roundIndex: number, flags: ReadonlySet<string>, applied: number, locale: ContentLocale): StoryDelayedEffect[] {
  const round = content.rounds[roundIndex];
  if (!round || flags.size === 0) return [];
  return delayedEffectsOf(round, flags, applied).map((e) => ({
    label: flagLabelOf(content, locale, e.flag),
    fromRound: (flagSourceIndex(content.rounds, e.flag, roundIndex) ?? -1) + 1,
    delta: e.delta,
  }));
}

/** What one participant sees when round `roundIndex` begins (scene/answering): mood after delayed effects and their own lines. */
export interface ParticipantScene {
  mood: number;
  moodBand: MoodBand;
  /** Clamped change applied at round start by flags set earlier (0 = none). */
  delayedDelta: number;
  /** '' without a customer character. */
  customerExpression: string;
  moodVariantLine: string | null;
  flagLines: StorySceneLine[];
  /** Private reminders of the delayed effects applied at this round's start ([] when none). */
  flagReminders: StoryDelayedEffect[];
}

/**
 * Participant view of a round's start: `carriedMood` is the mood carried from the previous decision (or the initial
 * mood), `flags` the flags of the participant's decisions in EARLIER rounds (engine.flagsOf).
 */
export function participantSceneOf(content: ScenarioContent, roundIndex: number, carriedMood: number, flags: ReadonlySet<string>, locale: ContentLocale): ParticipantScene {
  const round = content.rounds[roundIndex];
  if (!round) throw new Error(`No round ${roundIndex}`);
  const { mood, delayedDelta } = moodAtRoundStart(round, carriedMood, flags);
  const moodBand = moodBandOf(mood);
  return {
    mood,
    moodBand,
    delayedDelta,
    customerExpression: content.presentation.customerCharacterId ? content.presentation.moodExpressions[moodBand] : '',
    moodVariantLine: moodVariantLineOf(content, roundIndex, mood, locale),
    flagLines: flagLinesOf(content, roundIndex, flags, locale),
    flagReminders: delayedNotesOf(content, roundIndex, flags, delayedDelta, locale),
  };
}

/** Per-scenario status words when all five are set (in `locale`, with the default-locale fallback), else null = default words. */
export function scenarioMoodLabels(content: Pick<ScenarioContent, 'text'>, locale: ContentLocale): Record<MoodBand, string> | null {
  const labels = {} as Record<MoodBand, string>;
  for (const band of MOOD_BANDS) {
    const word = contentText(content, locale, textKey.moodLabel(band)).trim();
    if (!word) return null;
    labels[band] = word;
  }
  return labels;
}

/** The scenario's names and status words, as the live label shows them (stored with every final summary). */
export function summaryLabelsOf(content: ScenarioContent, locale: ContentLocale): StorySummaryLabels {
  const pres = content.presentation;
  return {
    customerName: contentText(content, locale, textKey.customerName()),
    officerName: pres.officerCharacterId ? contentText(content, locale, textKey.officerName()) || null : null,
    officerCharacterId: pres.officerCharacterId,
    moodLabels: scenarioMoodLabels(content, locale),
  };
}

/** Scenario label for room payloads and the preview: content-derived fields + version metadata from the caller. */
export function scenarioLabelOf(
  content: ScenarioContent,
  locale: ContentLocale,
  version: Pick<StoryScenarioLabel, 'scenarioId' | 'title' | 'versionNo' | 'categoryName' | 'contentKind'>,
): StoryScenarioLabel {
  const pres = content.presentation;
  const names = summaryLabelsOf(content, locale);
  return {
    scenarioId: version.scenarioId,
    title: version.title,
    versionNo: version.versionNo,
    categoryName: version.categoryName,
    contentKind: version.contentKind,
    customerCharacterId: pres.customerCharacterId,
    officerCharacterId: names.officerCharacterId,
    customerName: names.customerName,
    officerName: names.officerName,
    neutralExpression: pres.customerCharacterId ? pres.moodExpressions.ragu : '',
    moodLabels: names.moodLabels,
    bgmAssetId: pres.bgmAssetId,
  };
}
