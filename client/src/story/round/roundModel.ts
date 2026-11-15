/**
 * Pure model of one Story Room round as the participant room, the projector and the CMS preview render it (unit-tested
 * in roundModel.test.ts): the view an activity receives, default and per-selection confirm labels, the selection draft
 * kept per room and round, the line reveal anchored to the scene start, the chat contact, the status chip and the
 * status change of an outcome, keyboard moves in the option group, the tray state, field markers and where the
 * decision area is scrolled to. No React, no DOM, no i18n: texts come in already personalized, words via `translate`.
 */
import { EVIDENCE_ROW_KINDS, drawnSpotCoordinate, type ChoiceForm, type EvidenceKind, type EvidenceMark, type MoodBand, type RoundLayout } from '@shared/story/content';
import { moodBandOf } from '@shared/story/engine';
import type {
  StoryConsequenceView,
  StoryDecisionSummary,
  StoryDelayedEffect,
  StoryEvidence,
  StoryPhase,
  StoryPublicState,
  StoryScenarioLabel,
  StorySceneLine,
  StoryScenePublic,
} from '@shared/story/protocol';
import { revealedCount, revealStepMs, sceneConversation } from '../sceneLines';
import type { RoomAssetMap } from '../stage/StoryStage';
import type { ConversationLine } from '../ui/conversation';

/** Who looks at the round: a participant's own device, the shared event screen, or the CMS preview. */
export type RoundViewMode = 'participant' | 'projector' | 'preview';

/** The status chip of a round in play: the status word, its band and, in an effect round, the delayed change. */
export interface RoundMood {
  label: string;
  band: MoodBand;
  /** The word before the change when the round began with a delayed effect that changed the band; absent otherwise. */
  changedFrom?: string;
  /** The status change of the delayed effects that hit this round at its start ("Puas · −12"); absent without one. */
  delayedDelta?: number;
}

/** Legacy `stage` layout only: what the scene picture needs besides the scene (scenario characters, customer expression). */
export interface RoundStageInfo {
  scenario: StoryScenarioLabel;
  /** The participant's own expression, or the scenario's neutral expression on shared screens. */
  customerExpression: string;
}

/**
 * Everything an activity needs, already personalized ({nama} substituted) and, on a participant's device, already cut
 * to the lines revealed so far.
 */
export interface RoundView {
  /** Public scene, including evidence, respondent, action label and (after close only) the lesson. */
  scene: StoryScenePublic;
  /** Merged public + private lines in authored order (opening lines separate). */
  lines: ConversationLine[];
  intro: ConversationLine[];
  /** The status chip while the round is played; null on shared screens and once the outcome (which shows the change) is up. */
  mood: RoundMood | null;
  /** Private reminders of delayed effects that hit this round; participant/preview only. */
  reminders: { label: string; fromRound: number; delta: number }[];
  /** The viewer's own outcome after close (participant/preview); tells the activity a private outcome is shown. */
  outcome: StoryConsequenceView | null;
  assets: RoomAssetMap | null;
  /** Legacy `stage` layout: scenario characters for the scene picture. Without it the stage activity shows no picture. */
  stage?: RoundStageInfo;
}

/** Phases in which a round is being played (reading or answering). */
export function isPlayPhase(phase: StoryPhase): boolean {
  return phase === 'scene' || phase === 'answering';
}

/** Phases after a round's answers are closed in which the round stays on a participant's device (outcome, ranking). */
export function isAfterClosePhase(phase: StoryPhase): boolean {
  return phase === 'consequence' || phase === 'leaderboard';
}

/**
 * The participant's private snapshot when it describes the round the public snapshot shows, else null. On a phase
 * change the server sends the public snapshot first, so for a moment the private one may still be the previous
 * round's; nothing of it is shown in the new round.
 */
export function privateOfRound<T extends { roundNumber: number }>(me: T, roundNumber: number): T | null {
  return me.roundNumber === roundNumber ? me : null;
}

/**
 * The view of a round from a personalized scene, the viewer's own (personalized) conditional lines and the rest.
 * `moodLine` = the viewer's private line about the customer's state at the round's start (StoryPrivateState
 * .moodVariantLine), shown first as narration. Lines stay complete here; a participant page cuts them for the reveal.
 */
export function roundViewOf(p: {
  scene: StoryScenePublic;
  flagLines?: readonly StorySceneLine[];
  moodLine?: string | null;
  mood?: RoundView['mood'];
  reminders?: RoundView['reminders'];
  outcome?: StoryConsequenceView | null;
  assets: RoomAssetMap | null;
  stage?: RoundStageInfo;
}): RoundView {
  const { intro, lines } = sceneConversation(p.scene, p.flagLines);
  return {
    scene: p.scene,
    intro,
    lines: p.moodLine ? [{ key: 'suasana', speaker: 'narrator', name: null, text: p.moodLine }, ...lines] : lines,
    mood: p.mood ?? null,
    reminders: p.reminders ? [...p.reminders] : [],
    outcome: p.outcome ?? null,
    assets: p.assets,
    ...(p.stage ? { stage: p.stage } : {}),
  };
}

// ------------------------------------------------------------------ action labels

/** kamus key of the default confirm label of each layout ("Kirim balasan", "Tetapkan tindakan", …). */
export const DEFAULT_ACTION_KEY: Readonly<Record<RoundLayout, string>> = {
  chat: 'ruang.aksi.chat',
  dossier: 'ruang.aksi.dossier',
  field: 'ruang.aksi.field',
  stage: 'ruang.aksi.stage',
};

/** The round's own confirm label ("Ajukan berkas"), else the layout's default word. */
export function actionLabelOf(scene: Pick<StoryScenePublic, 'action' | 'layout'>, translate: (key: string) => string): string {
  return scene.action.trim() || translate(DEFAULT_ACTION_KEY[scene.layout]);
}

/** kamus key of the confirm label for a chosen action without a message in a chat ("Tetapkan tindakan"). */
export const ACTION_FORM_KEY = 'ruang.aksi.tindakan';

/**
 * The confirm label for the current selection. In a chat a chosen action without a message is confirmed as an action
 * ("Tetapkan tindakan"), never as a message; a message, or no selection yet, keeps the round's label. The other
 * activities offer actions only and keep the round's label.
 */
export function confirmLabelOf(p: { layout: RoundLayout; actionLabel: string; selectedForm: ChoiceForm | null }, translate: (key: string) => string): string {
  return p.layout === 'chat' && p.selectedForm === 'action' ? translate(ACTION_FORM_KEY) : p.actionLabel;
}

// ------------------------------------------------------------------ selection draft

/** The chosen option survives re-renders, reconnects and a reload of the same tab: one sessionStorage entry per room and round. */
const DRAFT_PREFIX = 'raksa:story:pilih:';

export function draftKey(code: string, roundId: string): string {
  return `${DRAFT_PREFIX}${code}:${roundId}`;
}

export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The stored choice when it is one of the current options (handles are per participant), else null. Never throws. */
export function readDraft(storage: DraftStorage | null, key: string, handles: readonly string[]): string | null {
  try {
    const value = storage?.getItem(key) ?? null;
    return value !== null && handles.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** Store (or with null forget) the choice. Storage that is blocked or full only loses the convenience. */
export function writeDraft(storage: DraftStorage | null, key: string, handle: string | null): void {
  try {
    if (handle === null) storage?.removeItem(key);
    else storage?.setItem(key, handle);
  } catch {
    /* blocked storage: the selection still lives in the component */
  }
}

// ------------------------------------------------------------------ line reveal

/**
 * Lines (opening + round) shown so far in a conversation-like round. The reveal is anchored to the scene's start and
 * reading time from the server, which do not move when the server extends the scene with its readiness grace, so lines
 * already shown never disappear. Everything is shown once the reading time is over, outside the scene phase, with
 * reduced motion, or when the server sends no start (older servers omit the fields).
 */
export function revealedLineCount(p: { phase: StoryPhase; sceneStartedAt: number | null; readingMs: number | null; now: number; total: number; reduced: boolean }): number {
  // `== null` on purpose: snapshots of older servers lack the fields entirely (undefined).
  if (p.phase !== 'scene' || p.reduced || p.sceneStartedAt == null || p.readingMs == null) return p.total;
  const elapsed = p.now - p.sceneStartedAt;
  if (elapsed >= p.readingMs) return p.total;
  return revealedCount(p.total, elapsed, revealStepMs(p.readingMs, p.total));
}

/** Layouts whose lines arrive one by one (messages, dialogue); briefs on a desk or at a field scene are shown whole. */
export function revealsLines(layout: RoundLayout): boolean {
  return layout === 'chat' || layout === 'stage';
}

// ------------------------------------------------------------------ chat contact

export interface ChatContact {
  name: string;
  /** false = no person to show (the round title stands in): the header shows no initials. */
  person: boolean;
}

/**
 * The contact a chat round is held with: the round's respondent (unless it is the officer, the player's own side),
 * else the first named customer/cast speaker of the PUBLIC lines (stable during the reveal), else the round title.
 * A narration-only chat never gets an invented person.
 */
export function chatContactOf(scene: Pick<StoryScenePublic, 'respondent' | 'title' | 'lines'>): ChatContact {
  const r = scene.respondent;
  if (r && (r.speaker === 'customer' || r.speaker === 'cast') && r.name) return { name: r.name, person: true };
  const incoming = scene.lines.find((l) => (l.speaker === 'customer' || l.speaker === 'cast') && l.name);
  if (incoming?.name) return { name: incoming.name, person: true };
  return { name: scene.title, person: false };
}

// ------------------------------------------------------------------ status chip

/**
 * The status chip while a round is played (scene/answering): the word of the band at the round's start (`mood`,
 * delayed effects included), the delayed change itself, and, when those effects changed the band, the word before
 * them, so the change is shown with the reminder that explains it even when the band stays. null in other phases: the
 * outcome block shows the decision's change.
 */
export function roundMoodOf(p: { phase: StoryPhase; mood: number; reminders: readonly StoryDelayedEffect[]; word: (band: MoodBand) => string }): RoundView['mood'] {
  if (!isPlayPhase(p.phase)) return null;
  const band = moodBandOf(p.mood);
  // The reminders carry the clamped shares actually applied, so mood − their sum is the mood carried into the round.
  const delayed = p.reminders.reduce((sum, r) => sum + r.delta, 0);
  const before = moodBandOf(p.mood - delayed);
  return { label: p.word(band), band, ...(before !== band ? { changedFrom: p.word(before) } : {}), ...(delayed ? { delayedDelta: delayed } : {}) };
}

/** How the own decision moved the customer's status: into another band, within its band (a trend), or not at all. */
export type StatusChange = { kind: 'band'; from: MoodBand; to: MoodBand } | { kind: 'trend'; band: MoodBand; direction: 'up' | 'down' } | { kind: 'same'; band: MoodBand };

/**
 * The status change an outcome shows. A move within a band is a trend ("Cemas, sedikit membaik"), so a reply that
 * sounds calmer never sits next to a bare "Status tetap". moodBefore already includes the round's delayed effects.
 */
export function statusChangeOf(o: Pick<StoryConsequenceView, 'moodBefore' | 'moodAfter' | 'bandBefore' | 'bandAfter'>): StatusChange {
  if (o.bandBefore !== o.bandAfter) return { kind: 'band', from: o.bandBefore, to: o.bandAfter };
  if (o.moodAfter !== o.moodBefore) return { kind: 'trend', band: o.bandAfter, direction: o.moodAfter > o.moodBefore ? 'up' : 'down' };
  return { kind: 'same', band: o.bandAfter };
}

// ------------------------------------------------------------------ option group keyboard

/**
 * Target of a key in a radio group of `count` options (WAI-ARIA radio group: arrows move and select, wrapping; Home/End
 * jump). `index` is the focused option, or -1 when none is focused yet. null for keys the group does not handle.
 */
export function arrowTarget(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return index < 0 ? 0 : (index + 1) % count;
    case 'ArrowUp':
    case 'ArrowLeft':
      return index < 0 ? count - 1 : (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** The longest and the shortest turn of one shared evidence item in the projector's focus panel. */
export const EVIDENCE_TURN_MAX_MS = 10_000;
export const EVIDENCE_TURN_MIN_MS = 6_000;

/**
 * How long each shared evidence item stays in the projector's focus panel: the shared reading time divided among the
 * items, so each has its turn while the room reads, kept between 6 and 10 s (10 s with one item or an unknown reading
 * time, as on older servers).
 */
export function evidenceTurnMs(count: number, readingMs: number | null): number {
  if (count < 2 || readingMs === null || !(readingMs > 0)) return EVIDENCE_TURN_MAX_MS;
  return Math.min(EVIDENCE_TURN_MAX_MS, Math.max(EVIDENCE_TURN_MIN_MS, Math.floor(readingMs / count)));
}

/**
 * The tray's countdown: in the scene, to the end of the shared reading time (the readiness grace does not move it, so
 * "Pilihan dibuka dalam N detik" never jumps back); otherwise the current phase's deadline.
 */
export function trayDeadlineOf(room: Pick<StoryPublicState, 'phase' | 'phaseEndsAt' | 'phaseDurationMs' | 'sceneStartedAt' | 'readingMs'>): { endsAt: number | null; durationMs: number | null } {
  // `!= null`: snapshots of older servers lack the scene fields entirely (undefined).
  if (room.phase === 'scene' && room.sceneStartedAt != null && room.readingMs != null) return { endsAt: room.sceneStartedAt + room.readingMs, durationMs: room.readingMs };
  return { endsAt: room.phaseEndsAt, durationMs: room.phaseDurationMs };
}

/** What the decision tray shows. */
export type TrayState = 'waiting' | 'loading' | 'choosing' | 'timeUp' | 'sent' | 'closed';

/**
 * Every participant of a room may answer (joins close with the lobby), so answers that are open without options mean
 * the private snapshot with them is still on its way (it follows the public one): 'loading', never "not registered".
 */
export function trayStateOf(p: { phase: StoryPhase; hasOptions: boolean; sent: boolean; remainingMs: number | null }): TrayState {
  if (p.phase === 'scene') return 'waiting';
  if (p.phase !== 'answering') return 'closed';
  if (p.sent) return 'sent';
  if (!p.hasOptions) return 'loading';
  return p.remainingMs !== null && p.remainingMs <= 0 ? 'timeUp' : 'choosing';
}

/** Vertical extent of a box in viewport pixels. */
export interface Span {
  top: number;
  bottom: number;
}

/**
 * How far to scroll (viewport pixels, positive = down) to bring the decision area into view between `top` and the top
 * of the sticky bar (`bottom`): nothing when it is fully there; when it fits, the smallest move that shows all of it
 * (so the last option is never left under the bar); when it is taller, its start (the question and the first options)
 * at the top, moved further only as far as needed to keep a chosen option (a restored draft) clear of the bar.
 */
export function bringIntoViewDelta(p: { area: Span; chosen: Span | null; top: number; bottom: number }): number {
  const { area, chosen } = p;
  if (area.top >= p.top && area.bottom <= p.bottom) return 0;
  if (area.bottom - area.top <= p.bottom - p.top) return area.top < p.top ? area.top - p.top : area.bottom - p.bottom;
  const start = area.top - p.top;
  return chosen && chosen.bottom - start > p.bottom ? chosen.bottom - p.bottom : start;
}

/**
 * How far to scroll (viewport pixels, positive = down) when a sticky bar has just docked over the bottom of the screen
 * (`barTop`, gap included) above an area that was on screen down to `viewBottom` (the leaderboard's line under the own
 * outcome): up by the part of it the bar now covers, so what was read last (the end of the outcome: status, delayed
 * effects) stays visible; when the area is taller than the room left, its start is what moves off the top. Nothing
 * when the bar covers none of it, or when the area is not on screen (the player is reading elsewhere).
 */
export function clearOfBarDelta(p: { area: Span; barTop: number; viewBottom: number }): number {
  const covered = Math.min(p.area.bottom, p.viewBottom) - p.barTop;
  if (covered <= 0 || p.area.top >= p.barTop || p.area.bottom <= 0) return 0;
  return covered;
}

// ------------------------------------------------------------------ evidence

/** Evidence kinds whose content is a list of rows (checklist, timeline, compare); the others show a body or a picture. */
export function showsRows(kind: EvidenceKind): boolean {
  return EVIDENCE_ROW_KINDS.includes(kind);
}

/** kamus key of a row mark's word in its kind ("Ada", "Selesai", "Cocok", "Perlu dicek"…); null for `none`. */
export function markWordKey(kind: EvidenceKind, mark: EvidenceMark): string | null {
  if (mark === 'none') return null;
  return `ruang.tanda.${showsRows(kind) ? kind : 'checklist'}.${mark}`;
}

export interface FieldMarker {
  id: string;
  /** 1-based, the same number the evidence list shows. */
  number: number;
  x: number;
  y: number;
  title: string;
}

/**
 * Markers of a field scene: evidence items with a spot, numbered by their place in the round's evidence list, drawn
 * within SPOT_SAFE_RANGE (the same range the CMS shows) so a marker near an edge is never clipped.
 */
export function fieldMarkersOf(evidence: readonly StoryEvidence[]): FieldMarker[] {
  const out: FieldMarker[] = [];
  evidence.forEach((e, i) => {
    if (e.spot) out.push({ id: e.id, number: i + 1, x: drawnSpotCoordinate(e.spot.x), y: drawnSpotCoordinate(e.spot.y), title: e.title });
  });
  return out;
}

// ------------------------------------------------------------------ final summary

/** A promise-like flag in the summary: the round that left it and where (and how strongly) it showed. */
export interface CausalNote {
  setRound: number;
  label: string;
  effectRound: number | null;
  delta: number | null;
}

/** Flags the participant's own choices left, in round order (shown even when the ending is good). */
export function causalNotesOf(decisions: readonly Pick<StoryDecisionSummary, 'roundNumber' | 'flagSet'>[]): CausalNote[] {
  return decisions.flatMap((d) => (d.flagSet ? [{ setRound: d.roundNumber, label: d.flagSet.label, effectRound: d.flagSet.effectRound, delta: d.flagSet.delta }] : []));
}
