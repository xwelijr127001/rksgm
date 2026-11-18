/**
 * Story Room wire contract (Socket.IO namespace `/story` + REST). Public payloads go to the room channel, projector and
 * host; private payloads go ONLY to one participant's sockets (ARCHITECTURE.md §4). Neither ever contains answer keys,
 * accuracy weights, other participants' choices/moods/flags, author notes, or credentials. Evidence is the same for
 * every participant; a round's lesson is public only once its answers are closed (LESSON_PHASES); replies, delayed
 * effects and flag reminders are private.
 *
 * Scenario texts are TEMPLATES: they may contain `{nama}` (content.PLAYER_NAME_TOKEN), which clients substitute at
 * render time (`personalize`): the participant's own name on their device, a neutral word on shared screens. Servers
 * never substitute, so persisted summaries stay neutral.
 */
import type { PlayerLook } from '../types';
import type { ChoiceForm, Classification, EndingKind, EvidenceKind, EvidenceMark, MoodBand, RoundLayout, Speaker } from './content';
import type { DecisionOutcome } from './engine';

export const STORY_NAMESPACE = '/story';

export type StoryPhase = 'lobby' | 'scene' | 'answering' | 'consequence' | 'leaderboard' | 'finished' | 'interrupted';
export const CLOSED_PHASES: readonly StoryPhase[] = ['finished', 'interrupted'];
/** Phases in which a round's lesson is public (StoryScenePublic.lesson): only after the round's answers are closed. */
export const LESSON_PHASES: readonly StoryPhase[] = ['consequence', 'leaderboard', ...CLOSED_PHASES];

/**
 * Why a room is closed. `server_restart` = the in-memory room could not survive a restart (honest interruption);
 * `expired` = closed automatically after being idle for hours; `admin_closed` = closed by an administrator.
 */
export type StoryClosedReason = 'finished' | 'host_closed' | 'server_restart' | 'expired' | 'admin_closed';

export interface StorySceneLine {
  /**
   * Neutral key of the line in its list (clients use it as a render key only): `p<pos>` for a round's public line,
   * `f<k>` for the k-th (0-based, authored order) conditional line THIS participant sees; opening lines keep their
   * authored id. Never the authored id of a round line, so no payload shows that lines it does not carry exist.
   */
  id: string;
  speaker: Speaker;
  /** Display name resolved by the server (customer/officer/cast name); null for narration (or a speaker without a name). */
  name: string | null;
  /**
   * Merge key within the round's lines (scene.mergeSceneLines sorts by it). Public lines are numbered 0..n−1 among
   * themselves, so a shared payload never shows that hidden lines exist; a participant's conditional line gets a
   * fractional key between its authored neighbours (public lines authored before it − 0.5, +0.01 per earlier
   * conditional line of the same run that this participant sees).
   */
  pos: number;
  /** Template: may contain {nama}. */
  text: string;
}

/** One row of a checklist/timeline/compare evidence item. */
export interface StoryEvidenceRow {
  id: string;
  mark: EvidenceMark;
  /** Template: may contain {nama}. */
  label: string;
  /** '' when none. Template. */
  value: string;
}

/** Shared information of a round, the same for every participant and option (never a key, weight or hint). */
export interface StoryEvidence {
  id: string;
  kind: EvidenceKind;
  /** Authored label shown instead of the kind word (e.g. "Daftar kontak", "Surat", "Lokasi"); '' = the kind word. Template. */
  kicker: string;
  /** Template. */
  title: string;
  /** '' when none. Template; may contain line breaks. */
  body: string;
  /** Image (asset kind photo or background); null = none. */
  assetId: string | null;
  /** `field` rounds: marker position in percent of the round background (0–100); null = list only. */
  spot: { x: number; y: number } | null;
  rows: StoryEvidenceRow[];
}

/** Who reacts after the decision: a speaker kind and its resolved display name (null when the name is missing). */
export interface StoryRespondent {
  speaker: Speaker;
  name: string | null;
}

export interface StoryScenePublic {
  roundId: string;
  roundNumber: number;
  title: string;
  /** Kicker above the title (e.g. phase and time of day); '' when none. */
  meta: string;
  /** "Babak kunci" badge (display only). */
  keyRound: boolean;
  layout: RoundLayout;
  prompt: string;
  backgroundAssetId: string;
  showOfficer: boolean;
  mediaAssetId: string | null;
  /** Opening lines (round 1 only; [] otherwise). */
  intro: StorySceneLine[];
  /** UNCONDITIONAL lines only (ifFlag === null); conditional lines go privately in StoryPrivateState.flagLines. */
  lines: StorySceneLine[];
  /** Confirm-button label; '' = the client's default for the layout. Template. */
  action: string;
  /** Shared information, public in every phase (no keys/weights ever). */
  evidence: StoryEvidence[];
  /** Who reacts after the decision; null = narration only. */
  respondent: StoryRespondent | null;
  /** Lesson of the round: present ONLY in consequence/leaderboard/closed phases (never while answering); '' otherwise or when none. Template. */
  lesson: string;
}

export interface StoryParticipantPublic {
  id: string;
  name: string;
  connected: boolean;
  /** Answered the current round (no choice/correctness information). */
  answered: boolean;
  /** Reported the current scene's assets ready. */
  ready: boolean;
  /** (T-052) The character the participant picked on their device (sanitised server-side); absent = none sent. */
  look?: PlayerLook;
}

export interface StoryRankRow {
  participantId: string;
  name: string;
  rank: number;
  tied: boolean;
  totalScore: number;
  /** (T-052) The participant's character, shown next to the name; absent = none sent. */
  look?: PlayerLook;
}

export interface StoryScenarioLabel {
  scenarioId: string;
  title: string;
  versionNo: number;
  categoryName: string;
  /** `demo` = synthetic demonstration content, excluded from competition reports by default. */
  contentKind: 'demo' | 'official';
  /** null = the customer has no portrait (name + status only). */
  customerCharacterId: string | null;
  officerCharacterId: string | null;
  /** Display names from the scenario text (speaker labels); officerName is null without an officer character. */
  customerName: string;
  officerName: string | null;
  /** Customer expression used on shared screens (projector), independent of any participant's private mood; '' without a customer character. */
  neutralExpression: string;
  /** Per-scenario status words, or null = default words (all five or none; see scene.scenarioMoodLabels). */
  moodLabels: Record<MoodBand, string> | null;
  bgmAssetId: string | null;
}

export interface StoryPublicState {
  code: string;
  scenario: StoryScenarioLabel;
  phase: StoryPhase;
  /** 1-based number of the current/last round; 0 in the lobby. */
  roundNumber: number;
  totalRounds: number;
  /** Server clock at snapshot time (epoch ms) so clients can display server deadlines. */
  serverNow: number;
  phaseEndsAt: number | null;
  phaseDurationMs: number | null;
  /**
   * Start (server clock) and shared reading time of the current round's scene. Unlike phaseEndsAt/phaseDurationMs they
   * do not move when the server extends the scene with the readiness grace, so a line-by-line reveal keeps a stable
   * origin. null when no round is in progress (lobby, closed rooms).
   */
  sceneStartedAt: number | null;
  readingMs: number | null;
  answerWindowMs: number;
  autoAdvance: boolean;
  scene: StoryScenePublic | null;
  participants: StoryParticipantPublic[];
  participantCount: number;
  connectedCount: number;
  /** Participants frozen as eligible for the current answer window (0 outside ANSWERING/CONSEQUENCE). */
  eligibleCount: number;
  answeredCount: number;
  readyCount: number;
  /** Cumulative rankings; present in LEADERBOARD and closed phases. */
  rankings: StoryRankRow[] | null;
  closedReason: StoryClosedReason | null;
  maxParticipants: number;
}

export interface StoryOption {
  /** Opaque per-participant handle; the participant never learns the content's choice ID. */
  handle: string;
  text: string;
  /** A message or an action without a message (content.ChoiceForm); display only, never a key or a hint. */
  form: ChoiceForm;
}

export interface StoryScoreView {
  accuracyPoints: number;
  speedPoints: number;
  roundScore: number;
  /** Server-measured answer time; null for timeouts. */
  elapsedMs: number | null;
}

/**
 * A delayed effect as its holder sees it: the flag's label ('' when the scenario names none), the round whose choice
 * left it (1-based; 0 when unknown) and the mood change it actually made (after clamping at 0/100; may be 0).
 */
export interface StoryDelayedEffect {
  label: string;
  fromRound: number;
  delta: number;
}

/**
 * Final summary: a choice that left a flag, and where its effect appeared for this participant (effectRound null when
 * it never did, e.g. the room ended first; delta null when that round reacted with a line only).
 */
export interface StoryFlagSet {
  label: string;
  effectRound: number | null;
  delta: number | null;
}

export interface StoryConsequenceView {
  roundId: string;
  roundNumber: number;
  outcome: DecisionOutcome;
  /** Text of the participant's own choice; null on timeout. */
  chosenText: string | null;
  /**
   * How the own choice reads (content.ChoiceForm): words sent to the contact, or an action taken without a message (a
   * chat shows it as a note, never as a sent bubble). 'message' on timeout and in summaries stored before this field.
   */
  chosenForm: ChoiceForm;
  consequence: string;
  /** Committee reason for the participant's own choice (or the timeout reason); '' when none (e.g. the round uses `mentorReason`). */
  reason: string;
  /** Recommended (tepat) choices; `reason` may be '' when the round uses `mentorReason`. */
  recommended: { text: string; reason: string }[];
  /** Round-level mentor reason ('' when none). The live consequence card does not show it; the final summary does. */
  mentorReason: string;
  /** Change applied at round start by an earlier decision (0 = none). bandBefore/moodBefore are AFTER it. */
  delayedDelta: number;
  moodBefore: number;
  moodAfter: number;
  bandBefore: MoodBand;
  bandAfter: MoodBand;
  score: StoryScoreView;
  /** The respondent's words after the own choice (or the timeout reply); '' when none. */
  reply: string;
  /** Display name of the round's respondent; null for narration only. */
  respondentName: string | null;
  /** The round's lesson ('' when none). */
  lesson: string;
  /** Delayed effects applied when this round began (split of `delayedDelta`, authored order), with their labels. */
  delayed: StoryDelayedEffect[];
  /** Final summary only (null in the live consequence): this choice left a flag whose effect appeared later. */
  flagSet: StoryFlagSet | null;
}

export interface StoryDecisionSummary extends StoryConsequenceView {
  title: string;
  prompt: string;
}

export interface StoryTotals {
  totalScore: number;
  accuracyPoints: number;
  speedPoints: number;
  answeredCount: number;
  timeoutCount: number;
}

/**
 * Names and status words of the summary's scenario, stored with it so a result reopened after the room left memory
 * reads like the live room. Summaries stored before this field get neutral values ('' / null; summary.withSummaryDefaults).
 */
export interface StorySummaryLabels {
  customerName: string;
  /** null without an officer character (as in StoryScenarioLabel). */
  officerName: string | null;
  officerCharacterId: string | null;
  /** Per-scenario status words, or null = default words. */
  moodLabels: Record<MoodBand, string> | null;
}

export interface StoryFinalSummary {
  /** false when the room was interrupted before round 15: decisions so far, no ending. */
  complete: boolean;
  /**
   * `customer` = the customer's closing words, `mentor` = the mentor's (officer's) closing words; '' when none.
   * Summaries persisted before these fields existed lack them: readers treat a missing value as ''.
   */
  ending: { id: string; kind: EndingKind; title: string; text: string; customer: string; mentor: string } | null;
  decisions: StoryDecisionSummary[];
  totals: StoryTotals;
  rank: { rank: number; tied: boolean; of: number } | null;
  finalMood: number;
  finalBand: MoodBand;
  scorePolicyId: string;
  scenarioTitle: string;
  versionNo: number;
  roomCode: string;
  labels: StorySummaryLabels;
}

export interface StoryPrivateState {
  participantId: string;
  name: string;
  /**
   * mood/moodBand/customerExpression: during SCENE/ANSWERING they reflect the mood at the start of the round
   * (engine.moodAtRoundStart: delayed effects included), otherwise the carried mood.
   */
  mood: number;
  moodBand: MoodBand;
  /** Customer expression for THIS participant's stage (from their own mood band); '' without a customer character. */
  customerExpression: string;
  roundNumber: number;
  /**
   * Customer-state-dependent line of the current round (FR-A3 "status customer pada awal babak"): the line of the band
   * the round STARTED in, while it is read and answered and during its consequence (so the thread stays whole, also on
   * a reloaded tab); null otherwise or when the round has none for that band.
   */
  moodVariantLine: string | null;
  /**
   * Conditional lines (ifFlag) this participant sees in the current round, with `pos`: while it is read and answered
   * and during its consequence, so they stay in the round's conversation (else []).
   */
  flagLines: StorySceneLine[];
  /** Scene/answering of a round reacting to flags this participant holds: private reminders of those delayed effects (else []). */
  flagReminders: StoryDelayedEffect[];
  /** Shuffled options for this participant; only during ANSWERING. */
  options: StoryOption[] | null;
  /**
   * Server acknowledgement of this participant's answer for the current round (answering only). `handle` = their own
   * opaque handle of the accepted option, so a reloaded tab or a second device shows which draft was sent.
   */
  answer: { roundId: string; handle: string; receivedAt: number; elapsedMs: number } | null;
  /** Own consequence of the current round once answering has closed. */
  consequence: StoryConsequenceView | null;
  totals: StoryTotals;
  rank: { rank: number; tied: boolean; of: number } | null;
  /** Personalized final summary (closed rooms). */
  summary: StoryFinalSummary | null;
}

/**
 * Machine-readable error codes (clients translate; `error` carries the Indonesian message). `answered` = another option
 * after this participant's answer for the round was accepted (the decision is final).
 */
export type StoryErrorCode =
  | 'not_found'
  | 'closed'
  | 'started'
  | 'full'
  | 'name'
  | 'rate_limited'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid'
  | 'late'
  | 'wrong_phase'
  | 'wrong_round'
  | 'not_eligible'
  | 'answered'
  | 'limit';

export type StoryAck<T> = { ok: true; data: T } | { ok: false; error: string; code: StoryErrorCode; detail?: string };

export interface StoryJoinResult {
  participantId: string;
  /** Room-scoped reconnect credential. Store it per room; never share it. */
  credential: string;
  state: StoryPublicState;
  me: StoryPrivateState;
}

export interface StoryRoomInfo {
  code: string;
  scenarioTitle: string;
  categoryName: string;
  phase: StoryPhase;
  participantCount: number;
  maxParticipants: number;
  canJoin: boolean;
  reason?: string;
  reasonCode?: StoryErrorCode;
}

/** Labels shown to people for classifications/outcomes (Indonesian source text). */
export const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  tepat: 'Tepat',
  kurang_tepat: 'Kurang tepat',
  keliru: 'Keliru',
  timeout: 'Waktu habis',
};

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  tepat: 'Tepat',
  kurang_tepat: 'Kurang tepat',
  keliru: 'Keliru',
};

export const MOOD_BAND_LABEL: Record<MoodBand, string> = {
  sangat_kecewa: 'Sangat kecewa',
  kecewa: 'Kecewa',
  ragu: 'Ragu-ragu',
  tenang: 'Mulai tenang',
  senang: 'Senang',
};

/** Why a room closed, for staff screens and reports (Indonesian source text). */
export const CLOSED_REASON_LABEL: Record<StoryClosedReason, string> = {
  finished: 'selesai',
  host_closed: 'ditutup host',
  server_restart: 'terhenti: server dimulai ulang',
  expired: 'ditutup otomatis (tidak aktif)',
  admin_closed: 'ditutup admin',
};

/** Staff wording of an ending kind: the room's own word, with the PRD term for the happy ending. */
export const ENDING_KIND_LABEL: Record<EndingKind, string> = {
  happy: 'Akhir bahagia (happy ending penuh)',
  with_notes: 'Selesai dengan catatan',
  unhappy: 'Kurang puas',
};
