/**
 * Sumber kebenaran pertandingan RAKSA GAME.
 * Semua fase, deadline, jawaban, skor, dan peringkat dihitung di sini.
 */

import { randomUUID } from 'node:crypto';
import {
  ACCESSORIES,
  DEFAULT_EVENT_NAME,
  DEFAULT_PRIZES,
  PHASE_DURATIONS,
  HAIR_COLORS,
  SKIN_TONES,
  UNIFORM_COLORS,
} from '../../shared/brand';
import { MISSIONS, TIEBREAK_MISSION } from '../../shared/missions';
import {
  computeBadges,
  gradeMission,
  hasPodiumTie,
  rankPlayers,
  scoreRound,
  type RankInput,
} from '../../shared/scoring';
import {
  TOTAL_ROUNDS,
  type LeaderRow,
  type MePrivate,
  type MissionAnswer,
  type MissionPublic,
  type Phase,
  type PlayerLook,
  type PlayerPublic,
  type Prizes,
  type RoomPublicState,
  type RoundResult,
  type StepAnswer,
} from '../../shared/types';
import { buildReveal, keyForRound } from './answerKeys';

const CODE_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679';
const NICK_MAX = 16;

/** Indeks ronde khusus untuk ronde penentuan (tiebreak). */
export const TIEBREAK_ROUND = TOTAL_ROUNDS;

export function missionForRound(roundIndex: number): MissionPublic | null {
  if (roundIndex === TIEBREAK_ROUND) return TIEBREAK_MISSION;
  return MISSIONS[roundIndex] ?? null;
}

export interface Submission {
  playerId: string;
  roundIndex: number;
  answer: MissionAnswer;
  /** Waktu menjawab (ms) sejak ronde aktif, sudah dikurangi durasi jeda. */
  elapsedMs: number;
  accuracy: number;
  basePoints: number;
  speedBonus: number;
  roundScore: number;
  receivedAt: number;
}

export interface PlayerRecord {
  id: string;
  token: string;
  nickname: string;
  look: PlayerLook;
  connected: boolean;
  ready: boolean;
  joinedAt: number;
  lastSeenAt: number;
  /**
   * Indeks ronde yang adegan 3D-nya sudah dilaporkan siap oleh client.
   * null = belum ada laporan. Hanya informasi untuk host; deadline tetap milik server.
   */
  sceneReadyRound: number | null;
  /** Hasil per ronde yang sudah ditutup. */
  rounds: RoundResult[];
  totalPoints: number;
  totalAccuracy: number;
  totalTimeMs: number;
}

export interface RoomSettings {
  eventName: string;
  autoAdvance: boolean;
  prizes: Prizes;
}

/** Karakter kontrol dibuang, spasi dirapikan, lalu dipotong sesuai batas. */
function cleanText(raw: unknown, max: number): string {
  let out = '';
  for (const ch of String(raw ?? '')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue;
    out += ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function sanitizeNickname(raw: unknown): string {
  return cleanText(raw, NICK_MAX);
}

/** Nama acara: sampai 80 karakter. */
export function sanitizeEventName(raw: unknown): string {
  return cleanText(raw, 80);
}

export function sanitizeLook(raw: unknown): PlayerLook {
  const o = (raw ?? {}) as Partial<PlayerLook>;
  const clampIdx = (v: unknown, len: number) => {
    const n = Math.trunc(Number(v));
    return Number.isFinite(n) && n >= 0 && n < len ? n : 0;
  };
  const acc = ACCESSORIES.some((a) => a.id === o.accessory) ? (o.accessory as PlayerLook['accessory']) : 'none';
  return {
    body: clampIdx(o.body, 4),
    skin: clampIdx(o.skin, SKIN_TONES.length),
    hair: clampIdx(o.hair, HAIR_COLORS.length),
    color: clampIdx(o.color, UNIFORM_COLORS.length),
    accessory: acc,
  };
}

/** Buang jawaban yang bentuknya tidak sesuai definisi langkah misi. */
export function sanitizeAnswer(mission: MissionPublic, raw: unknown): MissionAnswer {
  const out: MissionAnswer = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;

  for (const step of mission.steps) {
    const v = src[step.id];
    if (v === undefined || v === null) continue;

    if (step.kind === 'single') {
      if (typeof v === 'string' && step.options.some((o) => o.id === v)) out[step.id] = v;
    } else if (step.kind === 'multi') {
      if (Array.isArray(v)) {
        const ids = Array.from(
          new Set(v.filter((x): x is string => typeof x === 'string' && step.options.some((o) => o.id === x))),
        ).slice(0, step.options.length);
        out[step.id] = ids;
      }
    } else if (step.kind === 'assign') {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const map: Record<string, string> = {};
        for (const [itemId, bucketId] of Object.entries(v as Record<string, unknown>)) {
          if (!step.items.some((i) => i.id === itemId)) continue;
          if (typeof bucketId !== 'string' || !step.buckets.some((b) => b.id === bucketId)) continue;
          map[itemId] = bucketId;
        }
        out[step.id] = map;
      }
    } else if (step.kind === 'number') {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n)) out[step.id] = n;
    } else if (step.kind === 'order') {
      if (Array.isArray(v)) {
        const ids = v.filter(
          (x): x is string => typeof x === 'string' && step.items.some((i) => i.id === x),
        );
        out[step.id] = Array.from(new Set(ids)).slice(0, step.items.length);
      }
    }
  }
  return out;
}

export function isAnswerEmpty(answer: MissionAnswer): boolean {
  return Object.values(answer).every((v: StepAnswer) => {
    if (v === null || v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    if (typeof v === 'string') return v === '';
    return false;
  });
}

export type RoomEvent =
  | { type: 'state' }
  | { type: 'finished' }
  | { type: 'phase'; phase: Phase; roundIndex: number };

export class Room {
  readonly code: string;
  readonly hostToken: string;
  readonly createdAt: number;
  settings: RoomSettings;

  phase: Phase = 'LOBBY';
  prevPhase: Phase | null = null;
  pausedRemainingMs: number | null = null;
  roundIndex = 0;
  phaseEndsAt: number | null = null;
  phaseDurationMs: number | null = null;

  startedAt: number | null = null;
  finishedAt: number | null = null;

  /** Waktu ACTIVE dimulai untuk ronde saat ini. */
  roundStartedAt: number | null = null;
  /** Total durasi jeda selama ronde aktif (ms). */
  roundPausedMs = 0;

  players = new Map<string, PlayerRecord>();
  /** playerToken -> playerId */
  tokenIndex = new Map<string, string>();
  /** `${roundIndex}:${playerId}` -> Submission */
  submissions = new Map<string, Submission>();
  spectators = new Set<string>();

  leaderboard: LeaderRow[] | null = null;
  podium: LeaderRow[] | null = null;
  prevRanks = new Map<string, number>();
  /** Ronde terakhir yang sudah dibukukan ke total skor. */
  private settledRounds = new Set<number>();
  tiebreakUsed = false;

  private timer: NodeJS.Timeout | null = null;
  /** Waktu mulai jeda saat ini (untuk mengeluarkan durasi jeda dari waktu menjawab). */
  private pausedAt: number | null = null;
  private now: () => number;
  private emit: (room: Room, ev: RoomEvent) => void;
  private baseUrl: () => string;

  constructor(opts: {
    code: string;
    eventName?: string;
    now?: () => number;
    emit?: (room: Room, ev: RoomEvent) => void;
    baseUrl?: () => string;
  }) {
    this.code = opts.code;
    this.hostToken = randomUUID();
    this.now = opts.now ?? (() => Date.now());
    this.createdAt = this.now();
    this.emit = opts.emit ?? (() => {});
    this.baseUrl = opts.baseUrl ?? (() => 'http://localhost:4000');
    this.settings = {
      eventName: (opts.eventName || DEFAULT_EVENT_NAME).slice(0, 80),
      autoAdvance: true,
      prizes: { ...DEFAULT_PRIZES },
    };
  }

  // ------------------------------------------------------------ peserta

  get mission(): MissionPublic | null {
    if (this.phase === 'LOBBY') return null;
    if (this.phase === 'TUTORIAL') return null;
    return missionForRound(this.roundIndex);
  }

  get matchStarted(): boolean {
    return this.phase !== 'LOBBY' && this.phase !== 'TUTORIAL';
  }

  addPlayer(nickname: string, look: PlayerLook): PlayerRecord {
    const id = randomUUID().slice(0, 8);
    const rec: PlayerRecord = {
      id,
      token: randomUUID(),
      nickname,
      look,
      connected: true,
      ready: false,
      joinedAt: this.now(),
      lastSeenAt: this.now(),
      sceneReadyRound: null,
      rounds: [],
      totalPoints: 0,
      totalAccuracy: 0,
      totalTimeMs: 0,
    };
    this.players.set(id, rec);
    this.tokenIndex.set(rec.token, id);
    this.touch();
    return rec;
  }

  playerByToken(token: string): PlayerRecord | undefined {
    const id = this.tokenIndex.get(token);
    return id ? this.players.get(id) : undefined;
  }

  removePlayer(playerId: string): void {
    const p = this.players.get(playerId);
    if (!p) return;
    this.tokenIndex.delete(p.token);
    this.players.delete(playerId);
    for (const k of [...this.submissions.keys()]) {
      if (k.endsWith(':' + playerId)) this.submissions.delete(k);
    }
    this.touch();
  }

  setConnected(playerId: string, connected: boolean): void {
    const p = this.players.get(playerId);
    if (!p) return;
    p.connected = connected;
    p.lastSeenAt = this.now();
    this.touch();
  }

  // ------------------------------------------------------------ fase

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private armTimer(durationMs: number, fn: () => void) {
    this.clearTimer();
    this.phaseDurationMs = durationMs;
    this.phaseEndsAt = this.now() + durationMs;
    this.timer = setTimeout(fn, durationMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
  }

  private setUntimed(phase: Phase) {
    this.clearTimer();
    this.phase = phase;
    this.phaseEndsAt = null;
    this.phaseDurationMs = null;
  }

  startTutorial(): void {
    if (this.matchStarted) throw new Error('Pertandingan sudah dimulai');
    this.setUntimed('TUTORIAL');
    this.touch({ type: 'phase', phase: 'TUTORIAL', roundIndex: -1 });
  }

  backToLobby(): void {
    if (this.matchStarted) throw new Error('Pertandingan sudah dimulai');
    this.setUntimed('LOBBY');
    this.touch();
  }

  startMatch(): void {
    if (this.matchStarted) throw new Error('Pertandingan sudah dimulai');
    if (this.players.size === 0) throw new Error('Belum ada peserta');
    this.startedAt = this.now();
    this.roundIndex = 0;
    this.beginBriefing();
  }

  private beginBriefing(): void {
    const mission = missionForRound(this.roundIndex);
    if (!mission) {
      this.finish();
      return;
    }
    this.phase = 'BRIEFING';
    this.leaderboard = null;
    this.roundStartedAt = null;
    this.roundPausedMs = 0;
    const ms = Math.max(0, mission.briefingSeconds * 1000) || PHASE_DURATIONS.briefingMs;
    this.armTimer(ms, () => this.beginActive());
    this.touch({ type: 'phase', phase: 'BRIEFING', roundIndex: this.roundIndex });
  }

  private beginActive(): void {
    const mission = missionForRound(this.roundIndex);
    if (!mission) {
      this.finish();
      return;
    }
    this.phase = 'ACTIVE';
    this.roundStartedAt = this.now();
    this.roundPausedMs = 0;
    this.armTimer(mission.durationSeconds * 1000, () => this.closeRound());
    this.touch({ type: 'phase', phase: 'ACTIVE', roundIndex: this.roundIndex });
  }

  /** Tutup ronde: bukukan skor, hitung peringkat, masuk REVEAL. */
  closeRound(): void {
    if (this.phase !== 'ACTIVE' && !(this.phase === 'PAUSED' && this.prevPhase === 'ACTIVE')) return;
    const mission = missionForRound(this.roundIndex);
    if (!mission) return;

    this.settleRound(this.roundIndex, mission);
    this.phase = 'REVEAL';
    this.prevPhase = null;
    this.pausedRemainingMs = null;
    this.armTimer(PHASE_DURATIONS.revealMs, () => this.showLeaderboard());
    this.touch({ type: 'phase', phase: 'REVEAL', roundIndex: this.roundIndex });
  }

  private settleRound(roundIndex: number, mission: MissionPublic): void {
    if (this.settledRounds.has(roundIndex)) return;
    this.settledRounds.add(roundIndex);

    const fullMs = mission.durationSeconds * 1000;
    for (const p of this.players.values()) {
      const sub = this.submissions.get(`${roundIndex}:${p.id}`);
      const result: RoundResult = sub
        ? {
            roundIndex,
            answered: true,
            accuracy: sub.accuracy,
            basePoints: sub.basePoints,
            speedBonus: sub.speedBonus,
            roundScore: sub.roundScore,
            elapsedMs: sub.elapsedMs,
          }
        : {
            roundIndex,
            answered: false,
            accuracy: 0,
            basePoints: 0,
            speedBonus: 0,
            roundScore: 0,
            // Ronde tanpa jawaban dihitung memakai durasi penuh.
            elapsedMs: fullMs,
          };
      p.rounds = [...p.rounds.filter((r) => r.roundIndex !== roundIndex), result].sort(
        (a, b) => a.roundIndex - b.roundIndex,
      );
      p.totalPoints = p.rounds.reduce((a, r) => a + r.roundScore, 0);
      p.totalAccuracy = p.rounds.reduce((a, r) => a + r.accuracy, 0);
      p.totalTimeMs = p.rounds.reduce((a, r) => a + r.elapsedMs, 0);
    }

    const rows = this.rankInputs();
    this.leaderboard = rankPlayers(rows, this.prevRanks);
    this.prevRanks = new Map(this.leaderboard.map((r) => [r.playerId, r.rank]));
  }

  private rankInputs(): RankInput[] {
    return [...this.players.values()].map((p) => ({
      playerId: p.id,
      nickname: p.nickname,
      look: p.look,
      totalPoints: p.totalPoints,
      totalAccuracy: p.totalAccuracy,
      totalTimeMs: p.totalTimeMs,
      answeredCount: p.rounds.filter((r) => r.answered).length,
    }));
  }

  private showLeaderboard(): void {
    this.phase = 'LEADERBOARD';
    if (this.settings.autoAdvance) {
      this.armTimer(PHASE_DURATIONS.leaderboardMs, () => this.next());
    } else {
      this.clearTimer();
      this.phaseEndsAt = null;
      this.phaseDurationMs = null;
    }
    this.touch({ type: 'phase', phase: 'LEADERBOARD', roundIndex: this.roundIndex });
  }

  /** Lanjut manual/otomatis dari fase saat ini. */
  next(): void {
    if (this.phase === 'BRIEFING') {
      this.beginActive();
      return;
    }
    if (this.phase === 'ACTIVE') {
      this.closeRound();
      return;
    }
    if (this.phase === 'REVEAL') {
      this.showLeaderboard();
      return;
    }
    if (this.phase === 'LEADERBOARD') {
      if (this.roundIndex === TIEBREAK_ROUND || this.roundIndex >= TOTAL_ROUNDS - 1) {
        this.finish();
      } else {
        this.roundIndex += 1;
        this.beginBriefing();
      }
      return;
    }
    if (this.phase === 'TUTORIAL' || this.phase === 'LOBBY') {
      this.startMatch();
    }
  }

  pause(): void {
    if (this.phase === 'PAUSED') return;
    if (!['BRIEFING', 'ACTIVE', 'REVEAL', 'LEADERBOARD'].includes(this.phase)) return;
    const remaining = this.phaseEndsAt ? Math.max(0, this.phaseEndsAt - this.now()) : null;
    this.prevPhase = this.phase;
    this.pausedRemainingMs = remaining;
    this.clearTimer();
    this.phase = 'PAUSED';
    this.phaseEndsAt = null;
    this.pausedAt = this.now();
    this.touch({ type: 'phase', phase: 'PAUSED', roundIndex: this.roundIndex });
  }

  resume(): void {
    if (this.phase !== 'PAUSED' || !this.prevPhase) return;
    const pauseDuration = Math.max(0, this.now() - (this.pausedAt ?? this.now()));
    this.pausedAt = null;
    const back = this.prevPhase;
    const remaining = this.pausedRemainingMs;
    this.prevPhase = null;
    this.pausedRemainingMs = null;
    this.phase = back;

    if (back === 'ACTIVE') {
      // Jeda tidak menambah waktu menjawab pemain.
      this.roundPausedMs += pauseDuration;
    }

    if (remaining === null) {
      this.phaseEndsAt = null;
      this.phaseDurationMs = null;
    } else {
      const fn =
        back === 'BRIEFING'
          ? () => this.beginActive()
          : back === 'ACTIVE'
            ? () => this.closeRound()
            : back === 'REVEAL'
              ? () => this.showLeaderboard()
              : () => this.next();
      this.armTimer(remaining, fn);
    }
    this.touch({ type: 'phase', phase: back, roundIndex: this.roundIndex });
  }

  /** Ronde penentuan bila podium seri. */
  startTiebreak(): void {
    if (this.phase !== 'FINISHED') throw new Error('Ronde penentuan hanya setelah pertandingan selesai');
    if (this.tiebreakUsed) throw new Error('Ronde penentuan sudah dipakai');
    this.tiebreakUsed = true;
    this.finishedAt = null;
    this.podium = null;
    this.roundIndex = TIEBREAK_ROUND;
    this.beginBriefing();
  }

  finish(): void {
    const mission = missionForRound(this.roundIndex);
    // Sama seperti closeRound(): ronde ACTIVE yang sedang DIJEDA juga dibukukan,
    // supaya jawaban yang sudah masuk tidak hilang bila host mengakhiri saat jeda.
    const aktif = this.phase === 'ACTIVE' || (this.phase === 'PAUSED' && this.prevPhase === 'ACTIVE');
    if (mission && aktif) this.settleRound(this.roundIndex, mission);
    this.clearTimer();
    this.phase = 'FINISHED';
    this.prevPhase = null;
    this.pausedRemainingMs = null;
    this.phaseEndsAt = null;
    this.phaseDurationMs = null;
    this.finishedAt = this.now();
    const rows = this.rankInputs();
    this.podium = rankPlayers(rows, this.prevRanks);
    this.leaderboard = this.podium;
    this.touch({ type: 'finished' });
  }

  reset(): void {
    this.clearTimer();
    this.phase = 'LOBBY';
    this.prevPhase = null;
    this.pausedRemainingMs = null;
    this.roundIndex = 0;
    this.phaseEndsAt = null;
    this.phaseDurationMs = null;
    this.startedAt = null;
    this.finishedAt = null;
    this.roundStartedAt = null;
    this.roundPausedMs = 0;
    this.pausedAt = null;
    this.submissions.clear();
    this.settledRounds.clear();
    this.leaderboard = null;
    this.podium = null;
    this.prevRanks.clear();
    this.tiebreakUsed = false;
    for (const p of this.players.values()) {
      p.rounds = [];
      p.totalPoints = 0;
      p.totalAccuracy = 0;
      p.totalTimeMs = 0;
      p.ready = false;
      p.sceneReadyRound = null;
    }
    this.touch();
  }

  // ------------------------------------------------------------ jawaban

  get deadline(): number | null {
    if (this.phase !== 'ACTIVE' || this.roundStartedAt === null) return null;
    const mission = missionForRound(this.roundIndex);
    if (!mission) return null;
    return this.roundStartedAt + mission.durationSeconds * 1000 + this.roundPausedMs;
  }

  submit(
    player: PlayerRecord,
    roundIndex: number,
    rawAnswer: unknown,
  ): { accepted: boolean; reason?: string; elapsedMs?: number } {
    if (this.phase !== 'ACTIVE') return { accepted: false, reason: 'Ronde belum/sudah tidak menerima jawaban' };
    if (roundIndex !== this.roundIndex) return { accepted: false, reason: 'Nomor ronde tidak sesuai' };
    const mission = missionForRound(this.roundIndex);
    if (!mission || this.roundStartedAt === null) return { accepted: false, reason: 'Ronde tidak aktif' };

    const key = `${roundIndex}:${player.id}`;
    // Satu jawaban final per pemain per ronde; pengiriman ulang tidak menggandakan skor.
    if (this.submissions.has(key)) return { accepted: true, reason: 'sudah-terkirim', elapsedMs: this.submissions.get(key)!.elapsedMs };

    const now = this.now();
    const deadline = this.deadline;
    if (deadline !== null && now > deadline + 400) {
      return { accepted: false, reason: 'Waktu sudah habis' };
    }

    const elapsedMs = Math.max(0, now - this.roundStartedAt - this.roundPausedMs);
    const answer = sanitizeAnswer(mission, rawAnswer);
    const missionKey = keyForRound(roundIndex);
    const grade = missionKey ? gradeMission(missionKey, answer) : { accuracy: 0, steps: [] };
    const score = scoreRound(grade.accuracy, elapsedMs / 1000, mission.durationSeconds);

    this.submissions.set(key, {
      playerId: player.id,
      roundIndex,
      answer,
      elapsedMs,
      accuracy: grade.accuracy,
      basePoints: score.basePoints,
      speedBonus: score.speedBonus,
      roundScore: score.roundScore,
      receivedAt: now,
    });
    this.touch();
    return { accepted: true, elapsedMs };
  }

  submissionOf(playerId: string, roundIndex: number): Submission | undefined {
    return this.submissions.get(`${roundIndex}:${playerId}`);
  }

  get submittedCount(): number {
    let n = 0;
    for (const p of this.players.keys()) {
      if (this.submissions.has(`${this.roundIndex}:${p}`)) n++;
    }
    return n;
  }

  // ------------------------------------------------------------ kesiapan adegan

  /**
   * Client melaporkan adegan 3D ronde ini sudah siap dipakai.
   * Ini HANYA informasi untuk host. Deadline, pause, dan waktu menjawab tetap
   * mengikuti server, jadi pemain yang lambat memuat TIDAK mendapat tambahan
   * waktu individual.
   */
  markSceneReady(player: PlayerRecord, roundIndex: number): boolean {
    if (!Number.isInteger(roundIndex)) return false;
    if (roundIndex !== this.roundIndex) return false;
    if (player.sceneReadyRound === roundIndex) return true;
    player.sceneReadyRound = roundIndex;
    player.lastSeenAt = this.now();
    this.touch();
    return true;
  }

  /** Paksa satu pemain memuat ulang adegannya (host meminta retry). */
  clearSceneReady(playerId: string): boolean {
    const p = this.players.get(playerId);
    if (!p) return false;
    p.sceneReadyRound = null;
    this.touch();
    return true;
  }

  get sceneReadyCount(): number {
    let n = 0;
    for (const p of this.players.values()) {
      if (p.sceneReadyRound === this.roundIndex) n++;
    }
    return n;
  }

  /** Pemain yang belum melaporkan adegan siap untuk ronde saat ini. */
  playersNotSceneReady(): PlayerRecord[] {
    return [...this.players.values()].filter((p) => p.sceneReadyRound !== this.roundIndex);
  }

  // ------------------------------------------------------------ snapshot

  publicState(): RoomPublicState {
    const now = this.now();
    const revealPhases: Phase[] = ['REVEAL', 'LEADERBOARD', 'FINISHED'];
    const showReveal =
      revealPhases.includes(this.phase) ||
      (this.phase === 'PAUSED' && this.prevPhase !== null && revealPhases.includes(this.prevPhase));
    const mission = missionForRound(this.roundIndex);
    const revealMissionKey = showReveal ? keyForRound(this.roundIndex) : undefined;

    const players: PlayerPublic[] = [...this.players.values()].map((p) => {
      const sub = this.submissions.get(`${this.roundIndex}:${p.id}`);
      const rank = this.leaderboard?.find((r) => r.playerId === p.id)?.rank ?? 0;
      return {
        id: p.id,
        nickname: p.nickname,
        look: p.look,
        connected: p.connected,
        ready: p.ready,
        totalPoints: p.totalPoints,
        rank,
        submittedThisRound: Boolean(sub),
        submitElapsedSeconds: sub ? Math.round(sub.elapsedMs / 100) / 10 : null,
        sceneReady: p.sceneReadyRound === this.roundIndex,
      };
    });
    players.sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname, 'id'));

    const showMission = this.phase !== 'LOBBY' && this.phase !== 'TUTORIAL' && mission !== null;

    return {
      code: this.code,
      eventName: this.settings.eventName,
      phase: this.phase,
      prevPhase: this.prevPhase,
      pausedRemainingMs: this.pausedRemainingMs,
      roundIndex: this.roundIndex,
      totalRounds: TOTAL_ROUNDS,
      serverNow: now,
      phaseEndsAt: this.phaseEndsAt,
      phaseDurationMs: this.phaseDurationMs,
      autoAdvance: this.settings.autoAdvance,
      prizes: this.settings.prizes,
      players,
      playerCount: this.players.size,
      connectedCount: players.filter((p) => p.connected).length,
      spectatorCount: this.spectators.size,
      submittedCount: this.submittedCount,
      sceneReadyCount: this.sceneReadyCount,
      mission: showMission ? mission : null,
      reveal: showReveal && mission && revealMissionKey ? buildReveal(mission, revealMissionKey) : null,
      leaderboard: this.leaderboard,
      podium: this.phase === 'FINISHED' ? this.podium : null,
      joinUrl: `${this.baseUrl()}/join?room=${this.code}`,
      tie: this.phase === 'FINISHED' && this.podium ? hasPodiumTie(this.podium) : false,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }

  privateState(player: PlayerRecord): MePrivate {
    const board = this.leaderboard ?? this.podium;
    const row = board?.find((r) => r.playerId === player.id);
    const sub = this.submissions.get(`${this.roundIndex}:${player.id}`);
    return {
      playerId: player.id,
      nickname: player.nickname,
      look: player.look,
      rank: row?.rank ?? 0,
      totalPoints: player.totalPoints,
      totalAccuracy: Math.round(player.totalAccuracy * 1000) / 1000,
      totalTimeMs: player.totalTimeMs,
      answeredCount: player.rounds.filter((r) => r.answered).length,
      rounds: player.rounds,
      badges:
        this.phase === 'FINISHED'
          ? computeBadges(player.rounds, row?.rank ?? 0, MISSIONS)
          : [],
      submittedRound: sub ? this.roundIndex : null,
      submittedAnswer: sub ? sub.answer : null,
    };
  }

  dispose(): void {
    this.clearTimer();
  }

  private touch(ev: RoomEvent = { type: 'state' }) {
    this.emit(this, ev);
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  constructor(
    private emit: (room: Room, ev: RoomEvent) => void,
    private baseUrl: () => string,
    private now: () => number = () => Date.now(),
  ) {}

  private newCode(): string {
    for (let attempt = 0; attempt < 500; attempt++) {
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Gagal membuat kode room');
  }

  create(eventName?: string): Room {
    const room = new Room({
      code: this.newCode(),
      eventName,
      emit: this.emit,
      baseUrl: this.baseUrl,
      now: this.now,
    });
    this.rooms.set(room.code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(String(code ?? '').toUpperCase().trim());
  }

  all(): Room[] {
    return [...this.rooms.values()];
  }

  close(code: string): void {
    const r = this.rooms.get(code);
    if (r) {
      r.dispose();
      this.rooms.delete(code);
    }
  }

  /** Bersihkan room lama yang sudah tidak dipakai (dipanggil berkala). */
  sweep(maxIdleMs = 6 * 60 * 60 * 1000): string[] {
    const removed: string[] = [];
    const now = this.now();
    for (const room of this.rooms.values()) {
      const lastSeen = Math.max(
        room.createdAt,
        room.finishedAt ?? 0,
        ...[...room.players.values()].map((p) => p.lastSeenAt),
      );
      if (now - lastSeen > maxIdleMs) {
        room.dispose();
        this.rooms.delete(room.code);
        removed.push(room.code);
      }
    }
    return removed;
  }
}
