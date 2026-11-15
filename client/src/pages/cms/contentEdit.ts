/**
 * Pure, immutable edits of a scenario draft for the CMS editor (no I/O, unit-tested in contentEdit.test.ts). Logic
 * objects keep stable IDs; every player-facing string lives in `text[locale][key]` (shared/story/content.ts), so
 * removing an object also removes its texts in every locale and translations never drift from the logic.
 */
import {
  EVIDENCE_ROW_KINDS,
  MAX_CAST,
  MAX_EVIDENCE,
  MAX_EVIDENCE_ROWS,
  MAX_FLAG_EFFECTS,
  MAX_INTRO_LINES,
  SPEAKERS,
  SPOT_SAFE_RANGE,
  STORY_CHOICE_COUNT,
  STORY_ROUND_COUNT,
  drawnSpotCoordinate,
  newContentId,
  textKey,
  type CastMember,
  type ChoiceContent,
  type ContentLocale,
  type DialogueLine,
  type EndingContent,
  type EndingKind,
  type EvidenceItem,
  type EvidenceKind,
  type EvidenceRow,
  type FlagEffect,
  type RoundContent,
  type ScenarioContent,
  type Speaker,
  type SpeakerRef,
} from '@shared/story/content';

export function getText(c: ScenarioContent, locale: ContentLocale, key: string): string {
  return c.text[locale]?.[key] ?? '';
}

/** Set (or, with an empty value, remove) one text in one locale. */
export function setText(c: ScenarioContent, locale: ContentLocale, key: string, value: string): ScenarioContent {
  const current = { ...(c.text[locale] ?? {}) };
  if (value === '') delete current[key];
  else current[key] = value;
  return { ...c, text: { ...c.text, [locale]: current } };
}

/** Remove, in every locale, the texts of one object: `prefix` ends with '.' (e.g. `round.r_abc.`). */
function dropTexts(c: ScenarioContent, prefix: string): ScenarioContent {
  const text: ScenarioContent['text'] = {};
  for (const [locale, map] of Object.entries(c.text) as [ContentLocale, Record<string, string>][]) {
    text[locale] = Object.fromEntries(Object.entries(map).filter(([k]) => !k.startsWith(prefix)));
  }
  return { ...c, text };
}

/** Remove exactly these keys in every locale (a single text such as one dialogue line: `…line.l1` must not drop `…line.l10`). */
function dropKeys(c: ScenarioContent, keys: readonly string[]): ScenarioContent {
  const drop = new Set(keys);
  const text: ScenarioContent['text'] = {};
  for (const [locale, map] of Object.entries(c.text) as [ContentLocale, Record<string, string>][]) {
    text[locale] = Object.fromEntries(Object.entries(map).filter(([k]) => !drop.has(k)));
  }
  return { ...c, text };
}

function uniqueId(prefix: Parameters<typeof newContentId>[0], taken: ReadonlySet<string>, random: () => number): string {
  for (;;) {
    const id = newContentId(prefix, random);
    if (!taken.has(id)) return id;
  }
}

/** A cast member is named only for cast speakers (as sanitize does), so changing the speaker never leaves a stale castId. */
function withSpeaker<T extends DialogueLine>(line: T, speaker: Speaker, castId: string | null): T {
  return { ...line, speaker, castId: speaker === 'cast' ? castId : null };
}

function newLine(existing: readonly DialogueLine[], speaker: Speaker, castId: string | null, random: () => number): DialogueLine {
  return withSpeaker({ id: uniqueId('l', new Set(existing.map((l) => l.id)), random), speaker, castId: null, ifFlag: null }, speaker, castId);
}

/**
 * Starting point of a new round: five DIFFERENT classifications/weights the author must review (a template, not
 * an answer key). Texts start empty so validation lists exactly what is missing.
 */
const CHOICE_TEMPLATE: Pick<ChoiceContent, 'classification' | 'accuracy' | 'moodDelta'>[] = [
  { classification: 'tepat', accuracy: 1, moodDelta: 10 },
  { classification: 'kurang_tepat', accuracy: 0.5, moodDelta: 0 },
  { classification: 'kurang_tepat', accuracy: 0.5, moodDelta: 0 },
  { classification: 'keliru', accuracy: 0, moodDelta: -10 },
  { classification: 'keliru', accuracy: 0, moodDelta: -10 },
];

export function newRound(c: ScenarioContent, random: () => number = Math.random): RoundContent {
  const taken = new Set(c.rounds.map((r) => r.id));
  const choiceIds = new Set<string>();
  const choices: ChoiceContent[] = CHOICE_TEMPLATE.slice(0, STORY_CHOICE_COUNT).map((t) => {
    const id = uniqueId('c', choiceIds, random);
    choiceIds.add(id);
    return { id, ...t, setsFlag: null, form: 'message' };
  });
  return {
    id: uniqueId('r', taken, random),
    backgroundAssetId: c.rounds[c.rounds.length - 1]?.backgroundAssetId ?? 'builtin:bg:meja',
    showOfficer: true,
    mediaAssetId: null,
    lines: [newLine([], 'customer', null, random)],
    choices,
    timeout: { moodDelta: -10 },
    layout: 'stage',
    keyRound: false,
    flagEffects: [],
    authorNote: '',
    evidence: [],
    respondent: null,
  };
}

export function addRound(c: ScenarioContent, random: () => number = Math.random): ScenarioContent {
  if (c.rounds.length >= STORY_ROUND_COUNT) return c;
  return { ...c, rounds: [...c.rounds, newRound(c, random)] };
}

/** Add empty rounds until the scenario has exactly 15 (existing rounds are kept). */
export function scaffoldRounds(c: ScenarioContent, random: () => number = Math.random): ScenarioContent {
  let next = c;
  while (next.rounds.length < STORY_ROUND_COUNT) next = addRound(next, random);
  return next;
}

/**
 * Flags that only round `index` leaves (no choice of another round leaves them). Removing that round would orphan what
 * reacts to them, so removeRound removes it as well, and the CMS lists it first (flagReactions).
 */
export function flagsOnlyIn(c: ScenarioContent, index: number): string[] {
  const r = c.rounds[index];
  if (!r) return [];
  const own = new Set(r.choices.flatMap((ch) => (ch.setsFlag ? [ch.setsFlag] : [])));
  return [...own].filter((flag) => !c.rounds.some((x, i) => i !== index && x.choices.some((ch) => ch.setsFlag === flag)));
}

/**
 * Remove a round and its texts in every locale. A flag that only this round leaves goes with it, as clearFlag does:
 * its delayed effects, its conditional lines (with their texts) and its name. Nothing is left reacting to a flag that
 * no participant can hold any more.
 */
export function removeRound(c: ScenarioContent, index: number): ScenarioContent {
  const r = c.rounds[index];
  if (!r) return c;
  const orphaned = flagsOnlyIn(c, index);
  const without = dropTexts(c, `round.${r.id}.`);
  const rest: ScenarioContent = { ...without, rounds: c.rounds.filter((_, i) => i !== index) };
  return orphaned.reduce((x, flag) => dropFlagReactions(x, flag), rest);
}

export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return [...list];
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

export function moveRound(c: ScenarioContent, index: number, delta: -1 | 1): ScenarioContent {
  return { ...c, rounds: moveItem(c.rounds, index, delta) };
}

export function updateRound(c: ScenarioContent, index: number, fn: (r: RoundContent) => RoundContent): ScenarioContent {
  return { ...c, rounds: c.rounds.map((r, i) => (i === index ? fn(r) : r)) };
}

export function updateChoice(c: ScenarioContent, roundIndex: number, choiceIndex: number, patch: Partial<Omit<ChoiceContent, 'id'>>): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, choices: r.choices.map((ch, i) => (i === choiceIndex ? { ...ch, ...patch } : ch)) }));
}

// ------------------------------------------------------------------ dialogue lines

/** Append a line to a round; `castId` names the speaking cast member when speaker is 'cast' (ignored otherwise). */
export function addLine(c: ScenarioContent, roundIndex: number, speaker: Speaker, castId: string | null = null, random: () => number = Math.random): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, lines: [...r.lines, newLine(r.lines, speaker, castId, random)] }));
}

/** Change a round line's speaker (castId kept only for cast speakers) and/or its flag condition (null = everyone). */
export function updateLine(c: ScenarioContent, roundIndex: number, lineIndex: number, patch: Partial<Omit<DialogueLine, 'id'>>): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({
    ...r,
    lines: r.lines.map((l, i) => {
      if (i !== lineIndex) return l;
      const next = { ...l, ...patch };
      return withSpeaker(next, next.speaker, next.castId);
    }),
  }));
}

export function moveLine(c: ScenarioContent, roundIndex: number, lineIndex: number, delta: -1 | 1): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, lines: moveItem(r.lines, lineIndex, delta) }));
}

export function removeLine(c: ScenarioContent, roundIndex: number, lineIndex: number): ScenarioContent {
  const r = c.rounds[roundIndex];
  const line = r?.lines[lineIndex];
  if (!r || !line) return c;
  const without = dropKeys(c, [textKey.line(r.id, line.id)]);
  return updateRound(without, roundIndex, (x) => ({ ...x, lines: x.lines.filter((_, i) => i !== lineIndex) }));
}

/** `<select>` value of a line's speaker: 'narrator' | 'customer' | 'officer' | 'cast:<castId>'. */
export function speakerValue(line: Pick<DialogueLine, 'speaker' | 'castId'>): string {
  return line.speaker === 'cast' ? `cast:${line.castId ?? ''}` : line.speaker;
}

/** Inverse of `speakerValue` (an unknown value reads as narration). */
export function parseSpeakerValue(value: string): { speaker: Speaker; castId: string | null } {
  if (value.startsWith('cast:')) return { speaker: 'cast', castId: value.slice('cast:'.length) || null };
  const speaker = SPEAKERS.find((s) => s === value && s !== 'cast');
  return { speaker: speaker ?? 'narrator', castId: null };
}

// ------------------------------------------------------------------ evidence (shared information of a round)

function updateEvidenceItem(c: ScenarioContent, roundIndex: number, evidenceIndex: number, fn: (e: EvidenceItem) => EvidenceItem): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, evidence: r.evidence.map((e, i) => (i === evidenceIndex ? fn(e) : e)) }));
}

function newEvidenceRow(existing: readonly EvidenceRow[], random: () => number): EvidenceRow {
  return { id: uniqueId('w', new Set(existing.map((row) => row.id)), random), mark: 'none' };
}

/**
 * Add an evidence item (shared information for every option) to a round. Row kinds (checklist, timeline, compare)
 * start with one empty row, so validation names the text still missing. No-op at MAX_EVIDENCE.
 */
export function addEvidence(c: ScenarioContent, roundIndex: number, kind: EvidenceKind = 'document', random: () => number = Math.random): ScenarioContent {
  const r = c.rounds[roundIndex];
  if (!r || r.evidence.length >= MAX_EVIDENCE) return c;
  const item: EvidenceItem = {
    id: uniqueId('v', new Set(r.evidence.map((e) => e.id)), random),
    kind,
    assetId: null,
    spot: null,
    rows: EVIDENCE_ROW_KINDS.includes(kind) ? [newEvidenceRow([], random)] : [],
  };
  return updateRound(c, roundIndex, (x) => ({ ...x, evidence: [...x.evidence, item] }));
}

/** Change an item's kind or image. Rows are kept when the kind changes (validation warns while a kind does not show them). */
export function updateEvidence(c: ScenarioContent, roundIndex: number, evidenceIndex: number, patch: Partial<Pick<EvidenceItem, 'kind' | 'assetId'>>): ScenarioContent {
  return updateEvidenceItem(c, roundIndex, evidenceIndex, (e) => ({ ...e, ...patch }));
}

export function moveEvidence(c: ScenarioContent, roundIndex: number, evidenceIndex: number, delta: -1 | 1): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, evidence: moveItem(r.evidence, evidenceIndex, delta) }));
}

/** Remove an evidence item with all its texts (title, body, row labels and values) in every locale. */
export function removeEvidence(c: ScenarioContent, roundIndex: number, evidenceIndex: number): ScenarioContent {
  const r = c.rounds[roundIndex];
  const item = r?.evidence[evidenceIndex];
  if (!r || !item) return c;
  const without = dropTexts(c, `round.${r.id}.ev.${item.id}.`);
  return updateRound(without, roundIndex, (x) => ({ ...x, evidence: x.evidence.filter((_, i) => i !== evidenceIndex) }));
}

/**
 * Where a field marker may sit, in percent of the picture's width and height: the room draws markers within the shared
 * SPOT_SAFE_RANGE (6–94 %) so they are never clipped, and the CMS stores and draws spots in the same range.
 */
export const SPOT_RANGE = SPOT_SAFE_RANGE;

/** Marker position in percent of the round background, kept within SPOT_RANGE, one decimal (also how a stored spot is drawn). */
export function spotAt(x: number, y: number): { x: number; y: number } {
  const percent = (v: number) => Math.round(drawnSpotCoordinate(v) * 10) / 10;
  return { x: percent(x), y: percent(y) };
}

/** Place (or, with null, remove) an item's marker on the round background (`field` rounds). */
export function setEvidenceSpot(c: ScenarioContent, roundIndex: number, evidenceIndex: number, spot: { x: number; y: number } | null): ScenarioContent {
  return updateEvidenceItem(c, roundIndex, evidenceIndex, (e) => ({ ...e, spot: spot ? spotAt(spot.x, spot.y) : null }));
}

/** Append a row (label/value texts start empty) to a checklist/timeline/compare item. No-op at MAX_EVIDENCE_ROWS. */
export function addEvidenceRow(c: ScenarioContent, roundIndex: number, evidenceIndex: number, random: () => number = Math.random): ScenarioContent {
  const item = c.rounds[roundIndex]?.evidence[evidenceIndex];
  if (!item || item.rows.length >= MAX_EVIDENCE_ROWS) return c;
  return updateEvidenceItem(c, roundIndex, evidenceIndex, (e) => ({ ...e, rows: [...e.rows, newEvidenceRow(e.rows, random)] }));
}

export function updateEvidenceRow(c: ScenarioContent, roundIndex: number, evidenceIndex: number, rowIndex: number, patch: Partial<Pick<EvidenceRow, 'mark'>>): ScenarioContent {
  return updateEvidenceItem(c, roundIndex, evidenceIndex, (e) => ({ ...e, rows: e.rows.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)) }));
}

export function moveEvidenceRow(c: ScenarioContent, roundIndex: number, evidenceIndex: number, rowIndex: number, delta: -1 | 1): ScenarioContent {
  return updateEvidenceItem(c, roundIndex, evidenceIndex, (e) => ({ ...e, rows: moveItem(e.rows, rowIndex, delta) }));
}

/** Remove a row with exactly its own label and value texts (row `w_ab` never takes `w_abc` with it). */
export function removeEvidenceRow(c: ScenarioContent, roundIndex: number, evidenceIndex: number, rowIndex: number): ScenarioContent {
  const r = c.rounds[roundIndex];
  const item = r?.evidence[evidenceIndex];
  const row = item?.rows[rowIndex];
  if (!r || !item || !row) return c;
  const without = dropKeys(c, [textKey.evidenceRow(r.id, item.id, row.id), textKey.evidenceRowValue(r.id, item.id, row.id)]);
  return updateEvidenceItem(without, roundIndex, evidenceIndex, (e) => ({ ...e, rows: e.rows.filter((_, i) => i !== rowIndex) }));
}

// ------------------------------------------------------------------ respondent (who reacts after the decision)

/** Set who replies after the decision; narration only (speaker 'narrator') is stored as null, castId only for cast. */
export function setRespondent(c: ScenarioContent, roundIndex: number, speaker: Speaker, castId: string | null = null): ScenarioContent {
  const respondent: SpeakerRef | null = speaker === 'narrator' ? null : { speaker, castId: speaker === 'cast' ? castId : null };
  return updateRound(c, roundIndex, (r) => ({ ...r, respondent }));
}

/** `<select>` value of a round's respondent (speakerValue; 'narrator' = nobody replies). */
export function respondentValue(ref: SpeakerRef | null): string {
  return ref ? speakerValue(ref) : 'narrator';
}

// ------------------------------------------------------------------ opening lines (shown with round 1)

export function addIntroLine(c: ScenarioContent, speaker: Speaker, castId: string | null = null, random: () => number = Math.random): ScenarioContent {
  if (c.intro.length >= MAX_INTRO_LINES) return c;
  return { ...c, intro: [...c.intro, newLine(c.intro, speaker, castId, random)] };
}

/**
 * Opening lines are shown to everybody, so only the speaker can change; any flag condition (only possible through an
 * import) is dropped on the way, since validation never accepts one there.
 */
export function updateIntroLine(c: ScenarioContent, index: number, speaker: Speaker, castId: string | null = null): ScenarioContent {
  return { ...c, intro: c.intro.map((l, i) => (i === index ? { ...withSpeaker(l, speaker, castId), ifFlag: null } : l)) };
}

/** Show an opening line to everybody: removes a flag condition that came in through an import (validation: intro_flag). */
export function clearIntroFlag(c: ScenarioContent, index: number): ScenarioContent {
  return { ...c, intro: c.intro.map((l, i) => (i === index ? { ...l, ifFlag: null } : l)) };
}

export function moveIntroLine(c: ScenarioContent, index: number, delta: -1 | 1): ScenarioContent {
  return { ...c, intro: moveItem(c.intro, index, delta) };
}

/** Remove an opening line and its text in every locale. */
export function removeIntroLine(c: ScenarioContent, index: number): ScenarioContent {
  const line = c.intro[index];
  if (!line) return c;
  const without = dropKeys(c, [textKey.introLine(line.id)]);
  return { ...without, intro: c.intro.filter((_, i) => i !== index) };
}

// ------------------------------------------------------------------ cast (supporting characters)

/** Add a supporting character (name/role are texts: textKey.castName/castRole). No-op at MAX_CAST. */
export function addCastMember(c: ScenarioContent, random: () => number = Math.random): ScenarioContent {
  if (c.cast.length >= MAX_CAST) return c;
  const id = uniqueId('k', new Set(c.cast.map((m) => m.id)), random);
  return { ...c, cast: [...c.cast, { id, characterAssetId: null }] };
}

export function updateCastMember(c: ScenarioContent, index: number, patch: Partial<Omit<CastMember, 'id'>>): ScenarioContent {
  return { ...c, cast: c.cast.map((m, i) => (i === index ? { ...m, ...patch } : m)) };
}

/** Where a cast member appears: the lines it speaks (opening and rounds) and the rounds (0-based) in which it replies. */
export interface CastUses {
  lines: number;
  replies: number[];
}

export function castUses(c: ScenarioContent, castId: string): CastUses {
  return {
    lines: [...c.intro, ...c.rounds.flatMap((r) => r.lines)].filter((l) => l.speaker === 'cast' && l.castId === castId).length,
    replies: c.rounds.flatMap((r, i) => (repliesAs(r, castId) ? [i] : [])),
  };
}

/** The round's respondent is cast member `castId`. */
function repliesAs(r: RoundContent, castId: string): boolean {
  return r.respondent?.speaker === 'cast' && r.respondent.castId === castId;
}

/**
 * Remove a cast member and its texts (name, role) in every locale. Lines it speaks are KEPT with their texts and become
 * narration, and rounds where it replies keep their reply texts with nobody chosen to say them yet. So no dialogue is
 * lost: the author reassigns it, and validation names the rounds whose replies need a respondent again. The CMS asks
 * first with `castUses`.
 */
export function removeCastMember(c: ScenarioContent, index: number): ScenarioContent {
  const member = c.cast[index];
  if (!member) return c;
  const toNarration = (l: DialogueLine): DialogueLine => (l.speaker === 'cast' && l.castId === member.id ? withSpeaker(l, 'narrator', null) : l);
  const without = dropTexts(c, `cast.${member.id}.`);
  return {
    ...without,
    cast: c.cast.filter((_, i) => i !== index),
    intro: c.intro.map(toNarration),
    rounds: c.rounds.map((r) => {
      const speaks = r.lines.some((l) => l.castId === member.id);
      const replies = repliesAs(r, member.id);
      if (!speaks && !replies) return r;
      return { ...r, lines: speaks ? r.lines.map(toNarration) : r.lines, respondent: replies ? null : r.respondent };
    }),
  };
}

// ------------------------------------------------------------------ delayed consequences (flags)

/**
 * Flag ID as typed by an author -> the CONTENT_ID_PATTERN alphabet: lower case, inner spaces as '_' (a trailing one too,
 * so typing "janji kirim" works key by key), other characters dropped, ≤ 32.
 */
export function normalizeFlagId(raw: string): string {
  return raw
    .trimStart()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
}

/** A flag and the choices that leave it. */
export interface FlagSource {
  flag: string;
  /** Every choice leaving the flag, in content order (0-based indexes). */
  setBy: { roundIndex: number; choiceIndex: number; choiceId: string }[];
}

/** Flags left by choices in the rounds BEFORE `roundIndex` (what that round may react to), in order of first appearance. */
export function flagsSetBefore(c: ScenarioContent, roundIndex: number): FlagSource[] {
  const out = new Map<string, FlagSource>();
  c.rounds.slice(0, Math.max(0, roundIndex)).forEach((r, ri) => {
    r.choices.forEach((ch, ci) => {
      if (!ch.setsFlag) return;
      const source = out.get(ch.setsFlag) ?? { flag: ch.setsFlag, setBy: [] };
      source.setBy.push({ roundIndex: ri, choiceIndex: ci, choiceId: ch.id });
      out.set(ch.setsFlag, source);
    });
  });
  return [...out.values()];
}

/** Rounds (0-based) after `roundIndex` that react to `flag`: a delayed effect or a conditional line. */
export function flagUsesAfter(c: ScenarioContent, roundIndex: number, flag: string): number[] {
  const out: number[] = [];
  c.rounds.forEach((r, i) => {
    if (i > roundIndex && (r.flagEffects.some((e) => e.flag === flag) || r.lines.some((l) => l.ifFlag === flag))) out.push(i);
  });
  return out;
}

/** What reacts to a flag anywhere in the scenario: delayed effects and conditional lines (0-based indexes). */
export interface FlagReactions {
  effects: { roundIndex: number; effectIndex: number; moodDelta: number }[];
  lines: { roundIndex: number; lineIndex: number; lineId: string }[];
}

export function flagReactions(c: ScenarioContent, flag: string): FlagReactions {
  const out: FlagReactions = { effects: [], lines: [] };
  c.rounds.forEach((r, roundIndex) => {
    r.flagEffects.forEach((e, effectIndex) => {
      if (e.flag === flag) out.effects.push({ roundIndex, effectIndex, moodDelta: e.moodDelta });
    });
    r.lines.forEach((l, lineIndex) => {
      if (l.ifFlag === flag) out.lines.push({ roundIndex, lineIndex, lineId: l.id });
    });
  });
  return out;
}

/** Whether a choice other than (roundIndex, choiceIndex) leaves `flag` (its reactions then still have a source). */
export function flagLeftElsewhere(c: ScenarioContent, roundIndex: number, choiceIndex: number, flag: string): boolean {
  return c.rounds.some((r, ri) => r.choices.some((ch, ci) => ch.setsFlag === flag && (ri !== roundIndex || ci !== choiceIndex)));
}

/** Move (or drop, when `to` is null) the name text of a flag in every locale; a name `to` already has is kept. */
function moveFlagLabel(c: ScenarioContent, from: string, to: string | null): ScenarioContent {
  const fromKey = textKey.flagLabel(from);
  const text: ScenarioContent['text'] = {};
  for (const [locale, map] of Object.entries(c.text) as [ContentLocale, Record<string, string>][]) {
    const { [fromKey]: label, ...rest } = map;
    const toKey = to === null ? null : textKey.flagLabel(to);
    text[locale] = toKey && label !== undefined && rest[toKey] === undefined ? { ...rest, [toKey]: label } : rest;
  }
  return { ...c, text };
}

/**
 * Give the choice's flag a new ID (or a first one). When no other choice leaves the old flag, everything reacting to
 * it follows in the same edit (delayed effects, conditional lines, the flag's name in every locale), so a rename never
 * orphans them. Renaming onto a flag another choice already leaves merges the two; validation then names any effect
 * that became a duplicate. An empty `next` changes nothing (clearing is clearFlag, which the CMS confirms first).
 */
export function renameFlag(c: ScenarioContent, roundIndex: number, choiceIndex: number, next: string): ScenarioContent {
  const prev = c.rounds[roundIndex]?.choices[choiceIndex]?.setsFlag ?? null;
  if (!c.rounds[roundIndex]?.choices[choiceIndex] || !next || next === prev) return c;
  const renamed = updateChoice(c, roundIndex, choiceIndex, { setsFlag: next });
  if (prev === null || flagLeftElsewhere(c, roundIndex, choiceIndex, prev)) return renamed;
  const rounds = renamed.rounds.map((r) =>
    reactsTo(r, prev)
      ? {
          ...r,
          flagEffects: r.flagEffects.map((e) => (e.flag === prev ? { ...e, flag: next } : e)),
          lines: r.lines.map((l) => (l.ifFlag === prev ? { ...l, ifFlag: next } : l)),
        }
      : r,
  );
  return moveFlagLabel({ ...renamed, rounds }, prev, next);
}

/** The round has a delayed effect or a conditional line for `flag`. */
function reactsTo(r: RoundContent, flag: string): boolean {
  return r.flagEffects.some((e) => e.flag === flag) || r.lines.some((l) => l.ifFlag === flag);
}

/**
 * Remove the choice's flag. When no other choice leaves it, what only reacted to it goes too: its delayed effects, its
 * conditional lines (with their texts) and its name, in every locale (flagReactions lists them for the confirmation).
 */
export function clearFlag(c: ScenarioContent, roundIndex: number, choiceIndex: number): ScenarioContent {
  const prev = c.rounds[roundIndex]?.choices[choiceIndex]?.setsFlag ?? null;
  if (prev === null) return c;
  const cleared = updateChoice(c, roundIndex, choiceIndex, { setsFlag: null });
  return flagLeftElsewhere(c, roundIndex, choiceIndex, prev) ? cleared : dropFlagReactions(cleared, prev);
}

/** Remove everything that reacts to `flag`: delayed effects, conditional lines with their texts, and its name, in every locale. */
function dropFlagReactions(c: ScenarioContent, flag: string): ScenarioContent {
  const lineKeys = c.rounds.flatMap((r) => r.lines.filter((l) => l.ifFlag === flag).map((l) => textKey.line(r.id, l.id)));
  const without = moveFlagLabel(dropKeys(c, lineKeys), flag, null);
  const rounds = without.rounds.map((r) =>
    reactsTo(r, flag) ? { ...r, flagEffects: r.flagEffects.filter((e) => e.flag !== flag), lines: r.lines.filter((l) => l.ifFlag !== flag) } : r,
  );
  return { ...without, rounds };
}

/**
 * Add a delayed effect to a round: `flag` (default: the first flag set earlier that this round does not use yet) with
 * `moodDelta`. No-op at MAX_FLAG_EFFECTS or when no flag is available.
 */
export function addFlagEffect(c: ScenarioContent, roundIndex: number, flag?: string, moodDelta = 0): ScenarioContent {
  const r = c.rounds[roundIndex];
  if (!r || r.flagEffects.length >= MAX_FLAG_EFFECTS) return c;
  const used = new Set(r.flagEffects.map((e) => e.flag));
  const chosen = flag ?? flagsSetBefore(c, roundIndex).find((s) => !used.has(s.flag))?.flag;
  if (!chosen) return c;
  return updateRound(c, roundIndex, (x) => ({ ...x, flagEffects: [...x.flagEffects, { flag: chosen, moodDelta }] }));
}

export function updateFlagEffect(c: ScenarioContent, roundIndex: number, effectIndex: number, patch: Partial<FlagEffect>): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, flagEffects: r.flagEffects.map((e, i) => (i === effectIndex ? { ...e, ...patch } : e)) }));
}

export function removeFlagEffect(c: ScenarioContent, roundIndex: number, effectIndex: number): ScenarioContent {
  return updateRound(c, roundIndex, (r) => ({ ...r, flagEffects: r.flagEffects.filter((_, i) => i !== effectIndex) }));
}

// ------------------------------------------------------------------ endings

export function newEnding(c: ScenarioContent, kind: EndingKind, random: () => number = Math.random): EndingContent {
  return { id: uniqueId('e', new Set(c.endings.map((e) => e.id)), random), kind, minMood: null, maxMood: null, minScore: null, maxScore: null };
}

/**
 * Default ending set for a new scenario: a full happy ending (high mood AND high score), a resolution with caveats
 * (moderate mood), and the unconditional fallback that guarantees every participant an ending. Thresholds are
 * suggestions the author/reviewer must confirm.
 */
export function scaffoldEndings(c: ScenarioContent, random: () => number = Math.random): ScenarioContent {
  if (c.endings.length) return c;
  const happy = { ...newEnding(c, 'happy', random), minMood: 75, minScore: 9000 };
  const notes = { ...newEnding({ ...c, endings: [happy] }, 'with_notes', random), minMood: 40 };
  const fallback = newEnding({ ...c, endings: [happy, notes] }, 'with_notes', random);
  return { ...c, endings: [happy, notes, fallback] };
}

/** An ending without any bound applies to everybody it is reached for (the fallback that must come last). */
export function isUnconditional(e: Pick<EndingContent, 'minMood' | 'maxMood' | 'minScore' | 'maxScore'>): boolean {
  return e.minMood === null && e.maxMood === null && e.minScore === null && e.maxScore === null;
}

/** Add an ending: before the last one when that is the unconditional fallback (it stays last), else at the end. */
export function addEnding(c: ScenarioContent, kind: EndingKind, random: () => number = Math.random): ScenarioContent {
  const e = newEnding(c, kind, random);
  const last = c.endings[c.endings.length - 1];
  const endings = last && isUnconditional(last) ? [...c.endings.slice(0, -1), e, last] : [...c.endings, e];
  return { ...c, endings };
}

/** Endings are evaluated in list order (first match wins), so their order is editable. */
export function moveEnding(c: ScenarioContent, index: number, delta: -1 | 1): ScenarioContent {
  return { ...c, endings: moveItem(c.endings, index, delta) };
}

/** Turn an ending into an unconditional one (e.g. the last ending, which validation requires to be the fallback). */
export function clearEndingBounds(c: ScenarioContent, index: number): ScenarioContent {
  return updateEnding(c, index, { minMood: null, maxMood: null, minScore: null, maxScore: null });
}

export function removeEnding(c: ScenarioContent, index: number): ScenarioContent {
  const e = c.endings[index];
  if (!e) return c;
  const without = dropTexts(c, `ending.${e.id}.`);
  return { ...without, endings: c.endings.filter((_, i) => i !== index) };
}

export function updateEnding(c: ScenarioContent, index: number, patch: Partial<Omit<EndingContent, 'id'>>): ScenarioContent {
  return { ...c, endings: c.endings.map((e, i) => (i === index ? { ...e, ...patch } : e)) };
}

/** Enable/disable an additional content locale (Indonesian is always on). Disabling keeps texts (re-enable restores). */
export function setLocaleEnabled(c: ScenarioContent, locale: ContentLocale, on: boolean): ScenarioContent {
  if (locale === 'id') return c;
  const locales = on ? (c.locales.includes(locale) ? c.locales : [...c.locales, locale]) : c.locales.filter((l) => l !== locale);
  return { ...c, locales };
}

/** Rounds that have at least one issue, for the round list badges. */
export function roundsWithIssues(issues: readonly { round: number | null; severity: string }[]): Map<number, { errors: number; warnings: number }> {
  const out = new Map<number, { errors: number; warnings: number }>();
  for (const i of issues) {
    if (i.round === null) continue;
    const v = out.get(i.round) ?? { errors: 0, warnings: 0 };
    if (i.severity === 'error') v.errors++;
    else v.warnings++;
    out.set(i.round, v);
  }
  return out;
}
