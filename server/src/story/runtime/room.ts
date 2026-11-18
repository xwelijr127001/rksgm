/**
 * StoryRoom — server-authoritative runtime of one synchronized multiplayer visual-novel session (PRD FR-B1–B10,
 * FR-C1–C8, FR-D1–D2). The class owns phase, round, clock, accepted answers, consequences, customer moods, scores and
 * final results. Clients only send intent; nothing they send can change timing or scoring.
 *
 * State machine (ARCHITECTURE.md §3):
 *   lobby -> scene -> answering -> consequence -> leaderboard -> scene ... ; consequence(15) -> finished
 *   any non-closed -> interrupted (host close / server restart)
 *
 * Delayed consequences: the flags a participant's choices leave are derived here from their own decisions and never sent
 * anywhere; their effects reach only that participant (start-of-round mood, conditional lines and reminders in the
 * PRIVATE state, labelled delayed notes in their own consequence and summary).
 *
 * Shared information (the scene's evidence, action label and respondent) is public and the same for everybody; a round's
 * lesson becomes public only once its answers are closed (protocol LESSON_PHASES).
 *
 * Transport (sockets) and persistence (SQLite) are injected ports so the rules are testable with a manual clock.
 */
import { randomBytes } from 'node:crypto';
import type { PlayerLook } from '../../../../shared/types';
import {
  STORY_ROUND_COUNT,
  contentText,
  textKey,
  type ContentLocale,
  type RoundContent,
  type ScenarioContent,
} from '../../../../shared/story/content';
import { clampMood, flagsOf, moodBandOf, resolveDecision, selectEnding, totalsOf, type DecisionResult } from '../../../../shared/story/engine';
import { checkName, NAME_REJECTION_MESSAGE } from '../../../../shared/story/names';
import type {
  StoryAck,
  StoryClosedReason,
  StoryErrorCode,
  StoryFinalSummary,
  StoryOption,
  StoryPhase,
  StoryPrivateState,
  StoryPublicState,
  StoryRankRow,
  StoryScenarioLabel,
  StoryScenePublic,
  StoryTotals,
} from '../../../../shared/story/protocol';
import { rankParticipants, type RankedRow } from '../../../../shared/story/ranking';
import { flagLinesOf, moodVariantLineOf, participantSceneOf, scenarioLabelOf, scenePublicOf } from '../../../../shared/story/scene';
import { STORY_SCORE_POLICY } from '../../../../shared/story/scorePolicy';
import { buildSummary, consequenceViewOf } from '../../../../shared/story/summary';
import { choiceForHandle, optionForHandle, presentOptions } from './options';

// ------------------------------------------------------------------ ports

export interface StoryClock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const systemClock: StoryClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => {
    const t = setTimeout(fn, ms);
    t.unref?.();
    return t;
  },
  clearTimeout: (h) => clearTimeout(h as NodeJS.Timeout),
};

export interface RoundSettlement {
  roundIndex: number;
  roundId: string;
  sceneStartedAt: number;
  answeringStartedAt: number;
  deadlineAt: number;
  closedAt: number;
  closeReason: 'all_answered' | 'deadline';
  eligibleCount: number;
  answeredCount: number;
  decisions: { participantId: string; receivedAt: number | null; result: DecisionResult }[];
}

export interface ParticipantFinal {
  participantId: string;
  rank: number;
  tied: boolean;
  totals: StoryTotals;
  finalMood: number;
  endingId: string;
  endingKind: string;
}

/** Persistence port. Implementations must not throw for transient issues they can log; the runtime keeps playing. */
export interface StoryRoomStore {
  participantJoined(room: StoryRoom, p: ParticipantRuntime): void;
  participantRenamed(room: StoryRoom, p: ParticipantRuntime): void;
  participantRemoved(room: StoryRoom, p: ParticipantRuntime): void;
  roomStarted(room: StoryRoom): void;
  roundSettled(room: StoryRoom, settlement: RoundSettlement): void;
  roomFinished(room: StoryRoom, finals: ParticipantFinal[]): void;
  roomClosedEarly(room: StoryRoom, reason: StoryClosedReason): void;
}

/** Transport port: what changed, so the socket layer can broadcast. */
export interface StoryRoomEvents {
  /** Shared state changed within the current phase (participants, readiness, answers, timers); `urgent` = no coalescing. */
  publicChanged(room: StoryRoom, urgent: boolean): void;
  /** These participants' private states changed within the current phase (an accepted answer, a new name). */
  privateChanged(room: StoryRoom, participantIds: readonly string[] | 'all'): void;
  /**
   * The room entered a new phase or round, which changes the public state and every private state. The transport must
   * deliver the public snapshot BEFORE the private ones, so no client ever holds a private state ahead of the public one.
   */
  phaseChanged(room: StoryRoom): void;
  participantRemoved(room: StoryRoom, participantId: string): void;
}

export interface RoomTiming {
  answerWindowMs: number;
  /** Extra time a scene may wait for slow/loading devices after the reading time. */
  preloadGraceMs: number;
  consequenceMs: number;
  /** The host cannot skip a consequence before this much display time (feedback must be seen). */
  consequenceMinMs: number;
  leaderboardMs: number;
  /** Shared reading time per scene, before the answer window opens. */
  readingMs(content: ScenarioContent, roundIndex: number): number;
}

/** Reading pace behind the shared reading time (ms per character). */
const READING_MS_PER_CHAR = 35;
/** Round 1 shows the opening lines first: they add reading time, at most this much. */
export const INTRO_READING_MAX_MS = 12_000;

/**
 * Reading time grows with the scene's text (PRD estimate: about 25 s per round), bounded 8–25 s; round 1 adds the
 * opening lines (bounded by INTRO_READING_MAX_MS). Only the lines and the prompt count:
 * - conditional (delayed-consequence) lines are not counted: only some participants see them, and the reading time is
 *   one shared time for everybody;
 * - evidence (documents, checklists, timelines, comparisons, pictures) is not counted either: it is optional inspection
 *   that stays open next to the options while answering. Counting it would quietly lengthen rounds to absorb a heavy
 *   reading load, and there is no hidden extra time (the answer window is fixed by the score policy): a long text is an
 *   authoring issue, not a timing one.
 */
export function defaultReadingMs(content: ScenarioContent, roundIndex: number): number {
  const round = content.rounds[roundIndex];
  if (!round) return 8000;
  const len = (key: string) => contentText(content, 'id', key).length;
  const chars = round.lines.reduce((n, l) => (l.ifFlag ? n : n + len(textKey.line(round.id, l.id))), 0) + len(textKey.roundPrompt(round.id));
  const sceneMs = Math.min(25_000, Math.max(8_000, 4_000 + chars * READING_MS_PER_CHAR));
  const introChars = roundIndex === 0 ? content.intro.reduce((n, l) => n + len(textKey.introLine(l.id)), 0) : 0;
  return sceneMs + Math.min(INTRO_READING_MAX_MS, introChars * READING_MS_PER_CHAR);
}

export const DEFAULT_TIMING: RoomTiming = {
  answerWindowMs: STORY_SCORE_POLICY.answerWindowMs,
  preloadGraceMs: 8_000,
  consequenceMs: 10_000,
  consequenceMinMs: 4_000,
  leaderboardMs: 7_000,
  readingMs: defaultReadingMs,
};

// ------------------------------------------------------------------ state

export interface ScenarioVersionRef {
  scenarioId: string;
  versionId: string;
  versionNo: number;
  contentHash: string;
  title: string;
  categoryName: string;
  contentKind: 'demo' | 'official';
}

export interface ParticipantRuntime {
  id: string;
  name: string;
  nameKey: string;
  credentialHash: string;
  joinedAt: number;
  connected: boolean;
  removed: boolean;
  mood: number;
  /** decisions[roundIndex] once that round has settled. */
  decisions: DecisionResult[];
  lastSeenAt: number;
  /** (T-052) Character picked on the participant's device, already sanitised (sanitizeLook); not persisted. */
  look?: PlayerLook;
}

interface AcceptedAnswer {
  choiceId: string;
  /** The participant's own opaque handle of that choice (sent back in their private state). */
  handle: string;
  receivedAt: number;
  elapsedMs: number;
}

type Fail = { ok: false; error: string; code: StoryErrorCode };
const fail = (code: StoryErrorCode, error: string): Fail => ({ ok: false, code, error });

const LOCALE: ContentLocale = 'id';

export class StoryRoom {
  readonly id: string;
  readonly code: string;
  readonly version: ScenarioVersionRef;
  readonly content: ScenarioContent;
  readonly hostUserId: string;
  readonly hostName: string;
  readonly createdAt: number;
  readonly maxParticipants: number;
  readonly timing: RoomTiming;
  readonly scorePolicyId = STORY_SCORE_POLICY.id;
  /** Per-room secret for option order/handles; never leaves the server. */
  private readonly secret = randomBytes(32);

  phase: StoryPhase = 'lobby';
  autoAdvance: boolean;
  /** -1 in the lobby, then 0..14. */
  roundIndex = -1;
  startedAt: number | null = null;
  finishedAt: number | null = null;
  closedReason: StoryClosedReason | null = null;

  phaseEndsAt: number | null = null;
  phaseDurationMs: number | null = null;
  private phaseStartedAt = 0;
  /** When the current phase began (server clock); used to expire rooms paused for hours. */
  get phaseSince(): number {
    return this.phaseStartedAt;
  }
  private sceneStartedAt = 0;
  private readingMs = 0;
  private answeringStartedAt = 0;
  private deadlineAt = 0;

  readonly participants = new Map<string, ParticipantRuntime>();
  /** Participants allowed to answer the current round, frozen when ANSWERING starts. */
  private eligible = new Set<string>();
  private answers = new Map<string, AcceptedAnswer>();
  private readyThisRound = new Set<string>();
  private rankings: RankedRow[] | null = null;
  private endings = new Map<string, string>();
  private timer: unknown = null;

  constructor(
    opts: {
      id: string;
      code: string;
      version: ScenarioVersionRef;
      content: ScenarioContent;
      hostUserId: string;
      hostName: string;
      maxParticipants: number;
      autoAdvance?: boolean;
      timing?: RoomTiming;
    },
    private readonly clock: StoryClock,
    private readonly store: StoryRoomStore,
    private readonly events: StoryRoomEvents,
  ) {
    if (opts.content.rounds.length !== STORY_ROUND_COUNT) throw new Error('A room needs a 15-round published scenario');
    this.id = opts.id;
    this.code = opts.code;
    this.version = opts.version;
    // Frozen copy: later CMS edits/publications can never reach a running room.
    this.content = deepFreeze(structuredClone(opts.content));
    this.hostUserId = opts.hostUserId;
    this.hostName = opts.hostName;
    this.maxParticipants = opts.maxParticipants;
    this.autoAdvance = opts.autoAdvance ?? true;
    this.timing = opts.timing ?? DEFAULT_TIMING;
    this.createdAt = clock.now();
  }

  get closed(): boolean {
    return this.phase === 'finished' || this.phase === 'interrupted';
  }

  private get round() {
    return this.content.rounds[this.roundIndex] ?? null;
  }

  private activeParticipants(): ParticipantRuntime[] {
    return [...this.participants.values()].filter((p) => !p.removed);
  }

  // ------------------------------------------------------------ participants

  /** Name check against the other active participants (the same rule on join and rename, FR-B4). */
  checkNameFor(raw: unknown, exceptId: string | null = null) {
    const taken = new Set(this.activeParticipants().filter((p) => p.id !== exceptId).map((p) => p.nameKey));
    return checkName(raw, taken);
  }

  /** Why a new participant cannot join now (null = can join). */
  joinBlocker(): Fail | null {
    if (this.closed) return fail('closed', 'Room ini sudah selesai. Minta host membuka room baru.');
    if (this.phase !== 'lobby') return fail('started', 'Sesi room ini sudah dimulai. Peserta baru tidak bisa masuk lagi.');
    if (this.activeParticipants().length >= this.maxParticipants) {
      return fail('full', `Room sudah penuh (${this.maxParticipants} peserta). Minta host membuka room lain.`);
    }
    return null;
  }

  addParticipant(id: string, rawName: unknown, credentialHash: string, look?: PlayerLook): StoryAck<ParticipantRuntime> {
    const blocked = this.joinBlocker();
    if (blocked) return blocked;
    const check = this.checkNameFor(rawName);
    if (!check.ok) return { ok: false, code: 'name', error: NAME_REJECTION_MESSAGE[check.reason], detail: check.reason };
    const now = this.clock.now();
    const p: ParticipantRuntime = {
      id,
      name: check.name,
      nameKey: check.key,
      credentialHash,
      joinedAt: now,
      connected: true,
      removed: false,
      mood: clampMood(this.content.initialMood),
      decisions: [],
      lastSeenAt: now,
      ...(look ? { look } : {}),
    };
    this.participants.set(id, p);
    this.persist('participantJoined', () => this.store.participantJoined(this, p));
    this.events.publicChanged(this, false);
    return { ok: true, data: p };
  }

  rename(participantId: string, rawName: unknown): StoryAck<{ name: string }> {
    const p = this.participants.get(participantId);
    if (!p || p.removed) return fail('not_found', 'Peserta tidak ditemukan.');
    if (this.phase !== 'lobby') return fail('started', 'Nama hanya bisa diganti sebelum sesi dimulai.');
    const check = this.checkNameFor(rawName, participantId);
    if (!check.ok) return { ok: false, code: 'name', error: NAME_REJECTION_MESSAGE[check.reason], detail: check.reason };
    p.name = check.name;
    p.nameKey = check.key;
    this.persist('participantRenamed', () => this.store.participantRenamed(this, p));
    this.events.publicChanged(this, false);
    this.events.privateChanged(this, [p.id]);
    return { ok: true, data: { name: p.name } };
  }

  setConnected(participantId: string, connected: boolean): void {
    const p = this.participants.get(participantId);
    if (!p || p.connected === connected) return;
    p.connected = connected;
    p.lastSeenAt = this.clock.now();
    this.events.publicChanged(this, false);
    // A disconnect may complete the readiness gate of the current scene (disconnected devices never block it).
    if (!connected && this.phase === 'scene') this.maybeOpenAnswering();
  }

  /** Host removal (inappropriate name, FR-B4 / PRD risk table). Removed participants leave rankings and eligibility. */
  removeParticipant(participantId: string): StoryAck<{ removed: true }> {
    const p = this.participants.get(participantId);
    if (!p || p.removed) return fail('not_found', 'Peserta tidak ditemukan.');
    if (this.closed) return fail('closed', 'Room sudah ditutup.');
    p.removed = true;
    p.connected = false;
    this.eligible.delete(p.id);
    this.answers.delete(p.id);
    this.readyThisRound.delete(p.id);
    if (this.rankings) this.rankings = this.computeRankings();
    this.persist('participantRemoved', () => this.store.participantRemoved(this, p));
    this.events.participantRemoved(this, p.id);
    this.events.publicChanged(this, true);
    if (this.phase === 'answering') this.maybeCloseAnswering();
    if (this.phase === 'scene') this.maybeOpenAnswering();
    return { ok: true, data: { removed: true } };
  }

  // ------------------------------------------------------------ host controls

  start(): StoryAck<{ phase: StoryPhase }> {
    if (this.closed) return fail('closed', 'Room sudah ditutup. Satu room hanya memainkan satu sesi; buka room baru.');
    if (this.phase !== 'lobby') return fail('wrong_phase', 'Sesi sudah berjalan.');
    if (this.activeParticipants().length === 0) return fail('invalid', 'Belum ada peserta di ruang tunggu.');
    this.startedAt = this.clock.now();
    this.persist('roomStarted', () => this.store.roomStarted(this));
    this.beginScene(0);
    return { ok: true, data: { phase: this.phase } };
  }

  /**
   * Host "continue" (FR-B5). Never shortens an answer window (answering closes only on all-answered or deadline) and
   * never skips a consequence before `consequenceMinMs`.
   */
  next(expected?: { phase: StoryPhase; roundNumber: number }): StoryAck<{ phase: StoryPhase }> {
    if (this.closed) return fail('closed', 'Room sudah ditutup.');
    // A click that arrives after an automatic transition must not act on the NEW phase (e.g. open answering of the
    // next round without its reading time); the console sends what it was showing.
    if (expected && (expected.phase !== this.phase || expected.roundNumber !== this.roundIndex + 1)) {
      return fail('wrong_phase', 'Room sudah berpindah fase sebelum tombol ditekan. Periksa layar lalu tekan lagi bila perlu.');
    }
    switch (this.phase) {
      case 'lobby':
        return this.start();
      case 'scene':
        this.beginAnswering();
        break;
      case 'answering':
        return fail('wrong_phase', 'Babak masih menerima jawaban. Babak ditutup otomatis saat semua peserta menjawab atau waktu habis.');
      case 'consequence':
        if (this.clock.now() - this.phaseStartedAt < this.timing.consequenceMinMs) {
          return fail('wrong_phase', 'Beri peserta waktu membaca konsekuensinya dulu.');
        }
        this.afterConsequence();
        break;
      case 'leaderboard':
        this.beginScene(this.roundIndex + 1);
        break;
    }
    return { ok: true, data: { phase: this.phase } };
  }

  setAutoAdvance(on: boolean): void {
    if (this.autoAdvance === on) return;
    this.autoAdvance = on;
    if (this.phase === 'leaderboard') {
      if (on) this.arm(this.timing.leaderboardMs, () => this.beginScene(this.roundIndex + 1));
      else {
        // Host-paced from now on: no countdown may keep showing on any screen.
        this.disarm();
        this.phaseEndsAt = null;
        this.phaseDurationMs = null;
      }
    }
    this.events.publicChanged(this, true);
  }

  /** Close the room early (host). Rounds already settled stay stored; the room can never be reopened. */
  close(reason: StoryClosedReason = 'host_closed'): StoryAck<{ phase: StoryPhase }> {
    if (this.closed) return fail('closed', 'Room sudah ditutup.');
    this.disarm();
    this.phase = 'interrupted';
    this.closedReason = reason;
    this.finishedAt = this.clock.now();
    this.phaseEndsAt = null;
    this.phaseDurationMs = null;
    this.rankings = this.computeRankings();
    this.persist('roomClosedEarly', () => this.store.roomClosedEarly(this, reason));
    this.events.phaseChanged(this);
    return { ok: true, data: { phase: this.phase } };
  }

  // ------------------------------------------------------------ participant intents

  /** Client finished loading the current scene's assets (bounded readiness, never extends answer windows). */
  markReady(participantId: string, roundId: unknown): StoryAck<{ ready: boolean }> {
    const p = this.participants.get(participantId);
    if (!p || p.removed) return fail('not_found', 'Peserta tidak ditemukan.');
    const round = this.round;
    if (!round || roundId !== round.id) return { ok: true, data: { ready: false } };
    if (this.readyThisRound.has(p.id)) return { ok: true, data: { ready: true } };
    this.readyThisRound.add(p.id);
    this.events.publicChanged(this, false);
    if (this.phase === 'scene') this.maybeOpenAnswering();
    return { ok: true, data: { ready: true } };
  }

  /**
   * One final answer per participant and round (FR-C7). Validation order matters: authenticity first, then round, an
   * already accepted answer, phase, eligibility, deadline (inclusive), and finally the opaque option handle.
   */
  answer(participantId: string, roundId: unknown, handle: unknown): StoryAck<{ roundId: string; receivedAt: number; elapsedMs: number; duplicate: boolean }> {
    const p = this.participants.get(participantId);
    if (!p || p.removed) return fail('not_found', 'Peserta tidak ditemukan di room ini.');
    const round = this.round;
    if (typeof roundId !== 'string' || !round) return fail('wrong_round', 'Babak tidak dikenal.');
    if (roundId !== round.id) return fail('wrong_round', 'Jawaban untuk babak yang sudah lewat tidak diterima.');
    // After an accepted answer: a retry of the SAME option (double tap, reconnect, ack lost) returns the ORIGINAL
    // acknowledgement, also after the round closed; anything else is refused as `answered` (the decision is final).
    // Neither changes the answer or the score. `answers` lives until the next round starts.
    const prior = this.answers.get(p.id);
    if (prior) {
      if (choiceForHandle(this.secret, p.id, round.id, round.choices, handle) !== prior.choiceId) {
        return fail('answered', 'Jawabanmu untuk babak ini sudah terkirim.');
      }
      return { ok: true, data: { roundId, receivedAt: prior.receivedAt, elapsedMs: prior.elapsedMs, duplicate: true } };
    }
    if (this.phase !== 'answering') {
      return this.phase === 'scene' ? fail('wrong_phase', 'Pilihan belum dibuka.') : fail('late', 'Waktu menjawab babak ini sudah habis.');
    }
    if (!this.eligible.has(p.id)) return fail('not_eligible', 'Kamu tidak terdaftar untuk babak ini.');
    const now = this.clock.now();
    if (now > this.deadlineAt) return fail('late', 'Waktu menjawab babak ini sudah habis.');
    const option = optionForHandle(this.secret, p.id, round.id, round.choices, handle);
    if (!option) return fail('invalid', 'Pilihan tidak dikenal.');
    const accepted: AcceptedAnswer = { choiceId: option.choiceId, handle: option.handle, receivedAt: now, elapsedMs: now - this.answeringStartedAt };
    this.answers.set(p.id, accepted);
    p.lastSeenAt = now;
    this.events.privateChanged(this, [p.id]);
    this.events.publicChanged(this, false);
    this.maybeCloseAnswering();
    return { ok: true, data: { roundId, receivedAt: accepted.receivedAt, elapsedMs: accepted.elapsedMs, duplicate: false } };
  }

  /** Persistence errors are logged loudly for operators but never wedge a live session (the room keeps playing). */
  persistFailures = 0;
  private persist(what: string, fn: () => void): void {
    try {
      fn();
    } catch (err) {
      this.persistFailures++;
      console.error(`[story] PERSISTENCE FAILED (${what}) room ${this.code}: ${(err as Error).message}`);
    }
  }

  // ------------------------------------------------------------ phase machine

  private arm(ms: number, fn: () => void): void {
    this.disarm();
    this.phaseDurationMs = ms;
    this.phaseEndsAt = this.clock.now() + ms;
    this.timer = this.clock.setTimeout(fn, ms);
  }

  private disarm(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    this.timer = null;
  }

  private enter(phase: StoryPhase): void {
    this.phase = phase;
    this.phaseStartedAt = this.clock.now();
  }

  private beginScene(roundIndex: number): void {
    if (roundIndex >= this.content.rounds.length) {
      this.finish();
      return;
    }
    this.roundIndex = roundIndex;
    this.enter('scene');
    this.eligible = new Set();
    this.answers = new Map();
    this.readyThisRound = new Set();
    this.sceneStartedAt = this.phaseStartedAt;
    this.readingMs = this.timing.readingMs(this.content, roundIndex);
    this.arm(this.readingMs, () => this.onReadingElapsed());
    this.events.phaseChanged(this);
  }

  private onReadingElapsed(): void {
    if (this.phase !== 'scene') return;
    if (this.allConnectedReady()) {
      this.beginAnswering();
      return;
    }
    // Bounded wait for slow devices; after the grace everybody starts with the same deadline (no individual extension).
    this.arm(this.timing.preloadGraceMs, () => {
      if (this.phase === 'scene') this.beginAnswering();
    });
    this.events.publicChanged(this, true);
  }

  private allConnectedReady(): boolean {
    return this.activeParticipants().every((p) => !p.connected || this.readyThisRound.has(p.id));
  }

  private maybeOpenAnswering(): void {
    if (this.phase !== 'scene') return;
    const readingDone = this.clock.now() - this.sceneStartedAt >= this.readingMs;
    if (readingDone && this.allConnectedReady()) this.beginAnswering();
  }

  private beginAnswering(): void {
    if (this.phase !== 'scene') return;
    this.enter('answering');
    // Eligibility is frozen now: registered, non-removed participants (connected or not). Reconnecting later never adds
    // anyone; a disconnected participant stays eligible until the deadline (FR-B8 counts their missed round as 0).
    this.eligible = new Set(this.activeParticipants().map((p) => p.id));
    this.answers = new Map();
    this.answeringStartedAt = this.phaseStartedAt;
    this.deadlineAt = this.answeringStartedAt + this.timing.answerWindowMs;
    this.arm(this.timing.answerWindowMs, () => this.onDeadlineTimer());
    this.events.phaseChanged(this);
  }

  /**
   * The deadline is inclusive (an answer received AT deadlineAt counts), so the round closes only once the clock is past
   * it. Real timers can fire a millisecond early relative to the wall clock (observed: 29 999 ms); then wait the rest.
   */
  private onDeadlineTimer(): void {
    if (this.phase !== 'answering') return;
    const remaining = this.deadlineAt - this.clock.now();
    if (remaining >= 0) {
      this.timer = this.clock.setTimeout(() => this.onDeadlineTimer(), remaining + 1);
      return;
    }
    this.closeAnswering('deadline');
  }

  private maybeCloseAnswering(): void {
    if (this.phase !== 'answering') return;
    for (const id of this.eligible) if (!this.answers.has(id)) return;
    this.closeAnswering('all_answered');
  }

  /**
   * Settle the round exactly once: guarded by the phase, so a deadline timer racing the last answer is a no-op for
   * whichever arrives second. Timeouts get the authored default consequence and 0 points (FR-C3). Delayed effects of
   * flags left in EARLIER rounds apply first (answered or not), from the flags read before this decision is stored.
   */
  private closeAnswering(reason: 'all_answered' | 'deadline'): void {
    if (this.phase !== 'answering') return;
    const round = this.round;
    if (!round) return;
    this.disarm();
    const closedAt = this.clock.now();
    const decisions: RoundSettlement['decisions'] = [];
    for (const p of this.activeParticipants()) {
      if (!this.eligible.has(p.id)) continue;
      const a = this.answers.get(p.id);
      const choice = a ? round.choices.find((c) => c.id === a.choiceId) ?? null : null;
      const result = resolveDecision(round, p.mood, choice, choice && a ? a.elapsedMs : null, this.timing.answerWindowMs, this.flagsBefore(p));
      p.decisions[this.roundIndex] = result;
      p.mood = result.moodAfter;
      decisions.push({ participantId: p.id, receivedAt: a?.receivedAt ?? null, result });
    }
    this.rankings = this.computeRankings();
    this.persist('roundSettled', () => this.store.roundSettled(this, {
      roundIndex: this.roundIndex,
      roundId: round.id,
      sceneStartedAt: this.sceneStartedAt,
      answeringStartedAt: this.answeringStartedAt,
      deadlineAt: this.deadlineAt,
      closedAt,
      closeReason: reason,
      eligibleCount: this.eligible.size,
      answeredCount: this.answers.size,
      decisions,
    }));
    this.enter('consequence');
    this.arm(this.timing.consequenceMs, () => this.afterConsequence());
    this.events.phaseChanged(this);
  }

  private afterConsequence(): void {
    if (this.phase !== 'consequence') return;
    if (this.roundIndex >= this.content.rounds.length - 1) {
      this.finish();
      return;
    }
    this.enter('leaderboard');
    if (this.autoAdvance) this.arm(this.timing.leaderboardMs, () => this.beginScene(this.roundIndex + 1));
    else {
      this.disarm();
      this.phaseEndsAt = null;
      this.phaseDurationMs = null;
    }
    this.events.phaseChanged(this);
  }

  /** Round 15 settled: endings, final ranks, persistence; the room closes for good (FR-B10). */
  private finish(): void {
    if (this.closed) return;
    this.disarm();
    this.enter('finished');
    this.closedReason = 'finished';
    this.finishedAt = this.phaseStartedAt;
    this.phaseEndsAt = null;
    this.phaseDurationMs = null;
    this.rankings = this.computeRankings();
    const finals: ParticipantFinal[] = [];
    for (const row of this.rankings) {
      const p = this.participants.get(row.participantId);
      if (!p) continue;
      const totals = totalsOf(p.decisions, this.timing.answerWindowMs);
      const ending = selectEnding(this.content.endings, p.mood, totals.totalScore);
      this.endings.set(p.id, ending.id);
      finals.push({
        participantId: p.id,
        rank: row.rank,
        tied: row.tied,
        totals: pickTotals(totals),
        finalMood: p.mood,
        endingId: ending.id,
        endingKind: ending.kind,
      });
    }
    this.persist('roomFinished', () => this.store.roomFinished(this, finals));
    this.events.phaseChanged(this);
  }

  /** Flags (delayed consequences) left by the participant's decisions in rounds BEFORE the current one. Server-only. */
  private flagsBefore(p: ParticipantRuntime): Set<string> {
    return flagsOf(this.content.rounds, p.decisions.slice(0, Math.max(0, this.roundIndex)));
  }

  private computeRankings(): RankedRow[] {
    return rankParticipants(
      this.activeParticipants().map((p) => {
        const t = totalsOf(p.decisions, this.timing.answerWindowMs);
        return { participantId: p.id, name: p.name, totalScore: t.totalScore, accuracyPoints: t.accuracyPoints, totalElapsedMs: t.totalElapsedMs };
      }),
    );
  }

  dispose(): void {
    this.disarm();
  }

  // ------------------------------------------------------------ snapshots

  /**
   * Scenario label of every payload. Without a customer portrait: customerCharacterId null and neutralExpression ''.
   * Per-scenario status words travel only as a complete set of five; otherwise moodLabels is null (default words).
   */
  label(): StoryScenarioLabel {
    const v = this.version;
    return scenarioLabelOf(this.content, LOCALE, { scenarioId: v.scenarioId, title: v.title, versionNo: v.versionNo, categoryName: v.categoryName, contentKind: v.contentKind });
  }

  /**
   * Shared scene (room channel, projector, host): speaker names resolved, UNCONDITIONAL lines only (conditional ones go
   * privately to flag holders, see privateState), the opening lines on round 1, the evidence, action label and
   * respondent; the lesson only in LESSON_PHASES (never while the round is read or answered). null in the lobby.
   */
  private scenePublic(): StoryScenePublic | null {
    return this.phase === 'lobby' ? null : scenePublicOf(this.content, this.roundIndex, LOCALE, this.phase);
  }

  /**
   * Assets the room's payloads may reference so far (the public asset list): scenario-wide ones (characters, cast
   * portraits, music) and, for every round already reached (round 1 from the lobby on, for preloading), its background,
   * media and evidence pictures. Later rounds stay out, so their pictures and titles never show ahead of time.
   */
  reachedAssetIds(): string[] {
    const c = this.content;
    const pres = c.presentation;
    const ids = new Set<string>();
    for (const id of [pres.customerCharacterId, pres.officerCharacterId, pres.bgmAssetId, ...c.cast.map((m) => m.characterAssetId)]) if (id) ids.add(id);
    for (const round of c.rounds.slice(0, Math.max(1, this.roundIndex + 1))) {
      ids.add(round.backgroundAssetId);
      if (round.mediaAssetId) ids.add(round.mediaAssetId);
      for (const item of round.evidence) if (item.assetId) ids.add(item.assetId);
    }
    return [...ids];
  }

  private rankRows(): StoryRankRow[] | null {
    if (!this.rankings || !['leaderboard', 'finished', 'interrupted', 'consequence'].includes(this.phase)) return null;
    return this.rankings.map((r) => { const look = this.participants.get(r.participantId)?.look; return { participantId: r.participantId, name: r.name, rank: r.rank, tied: r.tied, totalScore: r.totalScore, ...(look ? { look } : {}) }; });
  }

  publicState(): StoryPublicState {
    const active = this.activeParticipants();
    const answering = this.phase === 'answering';
    // The scene clock of the round in progress: unlike phaseEndsAt/phaseDurationMs it never moves within the round (the
    // readiness grace re-arms only the phase timer), so a line-by-line reveal keeps its origin.
    const inRound = this.phase !== 'lobby' && !this.closed;
    return {
      code: this.code,
      scenario: this.label(),
      phase: this.phase,
      roundNumber: this.roundIndex + 1,
      totalRounds: this.content.rounds.length,
      serverNow: this.clock.now(),
      phaseEndsAt: this.phaseEndsAt,
      phaseDurationMs: this.phaseDurationMs,
      sceneStartedAt: inRound ? this.sceneStartedAt : null,
      readingMs: inRound ? this.readingMs : null,
      answerWindowMs: this.timing.answerWindowMs,
      autoAdvance: this.autoAdvance,
      scene: this.scenePublic(),
      participants: active.map((p) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
        answered: answering ? this.answers.has(p.id) : this.phase === 'consequence' || this.phase === 'leaderboard' ? Boolean(p.decisions[this.roundIndex]?.choiceId) : false,
        ready: this.readyThisRound.has(p.id),
        ...(p.look ? { look: p.look } : {}),
      })),
      participantCount: active.length,
      connectedCount: active.filter((p) => p.connected).length,
      eligibleCount: answering || this.phase === 'consequence' ? this.eligible.size : 0,
      answeredCount: answering ? this.answers.size : this.phase === 'consequence' ? active.filter((p) => p.decisions[this.roundIndex]?.choiceId).length : 0,
      readyCount: active.filter((p) => this.readyThisRound.has(p.id)).length,
      rankings: this.rankRows(),
      closedReason: this.closedReason,
      maxParticipants: this.maxParticipants,
    };
  }

  private ownRank(p: ParticipantRuntime): { rank: number; tied: boolean; of: number } | null {
    const row = this.rankings?.find((r) => r.participantId === p.id);
    return row ? { rank: row.rank, tied: row.tied, of: this.rankings!.length } : null;
  }

  summaryFor(p: ParticipantRuntime): StoryFinalSummary {
    return buildSummary({
      content: this.content,
      decisions: p.decisions,
      endingId: this.endings.get(p.id) ?? null,
      rank: this.ownRank(p),
      complete: this.phase === 'finished',
      finalMood: p.mood,
      scorePolicyId: this.scorePolicyId,
      scenarioTitle: this.version.title,
      versionNo: this.version.versionNo,
      roomCode: this.code,
      answerWindowMs: this.timing.answerWindowMs,
      locale: LOCALE,
    });
  }

  privateState(participantId: string): StoryPrivateState | null {
    const p = this.participants.get(participantId);
    if (!p) return null;
    const round = this.round;
    const flags = this.flagsBefore(p);
    // While a round is read and answered, the participant sees its START: the carried mood plus the delayed effects of
    // flags they left earlier (the same mood the decision is later resolved from), the status line of that mood's band,
    // the conditional lines those flags unlock and reminders of those effects. Otherwise the carried mood and no
    // reminders. While its consequence and the leaderboard after it are shown (the round stays on screen) the round's
    // conversation stays whole (also on a reloaded tab or a second device): the conditional lines and the status line of
    // the band the round began in (the decision's moodBefore).
    const start = round && (this.phase === 'scene' || this.phase === 'answering') ? participantSceneOf(this.content, this.roundIndex, p.mood, flags, LOCALE) : null;
    const band = start ? start.moodBand : moodBandOf(p.mood);
    const settled = round ? p.decisions[this.roundIndex] : undefined;
    const showConsequence = (this.phase === 'consequence' || this.phase === 'leaderboard') && settled;
    const keepThread = round !== null && (this.phase === 'consequence' || this.phase === 'leaderboard');
    const flagLines = start ? start.flagLines : keepThread ? flagLinesOf(this.content, this.roundIndex, flags, LOCALE) : [];
    const moodVariantLine = start ? start.moodVariantLine : keepThread && settled ? moodVariantLineOf(this.content, this.roundIndex, settled.moodBefore, LOCALE) : null;
    const ack = this.phase === 'answering' ? this.answers.get(p.id) : undefined;
    const pres = this.content.presentation;
    return {
      participantId: p.id,
      name: p.name,
      mood: start ? start.mood : p.mood,
      moodBand: band,
      customerExpression: start ? start.customerExpression : pres.customerCharacterId ? pres.moodExpressions[band] : '',
      roundNumber: this.roundIndex + 1,
      moodVariantLine,
      flagLines,
      flagReminders: start ? start.flagReminders : [],
      options: this.phase === 'answering' && round && this.eligible.has(p.id) ? this.optionsFor(p, round) : null,
      answer: ack && round ? { roundId: round.id, handle: ack.handle, receivedAt: ack.receivedAt, elapsedMs: ack.elapsedMs } : null,
      // Own reaction (reply, lesson) and the labelled delayed effects of flags left in EARLIER rounds.
      consequence: showConsequence && settled ? consequenceViewOf(this.content, this.roundIndex, settled, LOCALE, flags) : null,
      totals: pickTotals(totalsOf(p.decisions, this.timing.answerWindowMs)),
      rank: this.ownRank(p),
      summary: this.closed && this.startedAt !== null ? this.summaryFor(p) : null,
    };
  }

  /** A participant's shuffled options of `round`: their own handles, the texts (templates) and the forms; never a key. */
  private optionsFor(p: ParticipantRuntime, round: RoundContent): StoryOption[] {
    const forms = new Map(round.choices.map((c) => [c.id, c.form]));
    return presentOptions(this.secret, p.id, round.id, round.choices).map((o) => ({
      handle: o.handle,
      text: contentText(this.content, LOCALE, textKey.choiceText(round.id, o.choiceId)),
      form: forms.get(o.choiceId) ?? 'message',
    }));
  }

  /** The participant holding this room-scoped credential (reconnect/result lookups never go by name). */
  participantByCredential(hash: string): ParticipantRuntime | undefined {
    for (const p of this.participants.values()) if (p.credentialHash === hash) return p;
    return undefined;
  }

  /** Exposed for the transport's "who is in this round" checks and tests. */
  isEligible(participantId: string): boolean {
    return this.eligible.has(participantId);
  }

  get currentDeadline(): number | null {
    return this.phase === 'answering' ? this.deadlineAt : null;
  }
}

function pickTotals(t: ReturnType<typeof totalsOf>): StoryTotals {
  return { totalScore: t.totalScore, accuracyPoints: t.accuracyPoints, speedPoints: t.speedPoints, answeredCount: t.answeredCount, timeoutCount: t.timeoutCount };
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
  }
  return o;
}
