/**
 * Story Room registry: room codes, configured limits (PRD FR-B9; open question #1 — values are LOCAL DEFAULTS, not
 * approved capacity), creation from the current published scenario version, and housekeeping.
 */
import { randomInt, randomUUID } from 'node:crypto';
import type { StaffIdentity } from '../../../../shared/story/roles';
import { playableVersionForScenario, ScenarioError } from '../content/scenarios';
import { DEFAULT_TIMING, StoryRoom, systemClock, type RoomTiming, type StoryClock, type StoryRoomEvents } from './room';
import { codeExists, sqliteRoomStore } from './sqliteStore';

/** 32 unambiguous characters (no 0/O, 1/I). 6 characters = 32^6 ≈ 1.07e9 codes; guessing is also rate limited. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

const intEnv = (name: string, fallback: number, min: number, max: number) => {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

export interface StoryLimits {
  maxParticipantsPerRoom: number;
  maxActiveRooms: number;
}

export function limitsFromEnv(): StoryLimits {
  return {
    maxParticipantsPerRoom: intEnv('STORY_MAX_PARTICIPANTS', 100, 1, 1000),
    maxActiveRooms: intEnv('STORY_MAX_ACTIVE_ROOMS', 20, 1, 500),
  };
}

/**
 * Production timing is fixed by the score policy (30 s answers). Shorter phases exist ONLY for automated tests
 * (`NODE_ENV=test` + `STORY_TEST_TIMING=fast`) so a 15-round session can be exercised quickly; never in production.
 */
export function timingFromEnv(): RoomTiming {
  if (process.env.NODE_ENV === 'test' && process.env.STORY_TEST_TIMING === 'fast') {
    return {
      answerWindowMs: intEnv('STORY_TEST_ANSWER_MS', 1500, 200, 30_000),
      preloadGraceMs: 300,
      consequenceMs: 250,
      consequenceMinMs: 100,
      leaderboardMs: 200,
      readingMs: () => intEnv('STORY_TEST_READING_MS', 150, 0, 25_000),
    };
  }
  return DEFAULT_TIMING;
}

export class StoryRoomManager {
  private rooms = new Map<string, StoryRoom>();

  constructor(
    private readonly events: StoryRoomEvents,
    readonly limits: StoryLimits = limitsFromEnv(),
    private readonly timing: RoomTiming = timingFromEnv(),
    private readonly clock: StoryClock = systemClock,
  ) {}

  private newCode(): string {
    for (let attempt = 0; attempt < 200; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
      if (!this.rooms.has(code) && !codeExists(code)) return code;
    }
    throw new Error('Could not allocate a room code');
  }

  activeCount(): number {
    return [...this.rooms.values()].filter((r) => !r.closed).length;
  }

  create(scenarioId: string, host: StaffIdentity, opts: { autoAdvance?: boolean } = {}): StoryRoom {
    if (this.activeCount() >= this.limits.maxActiveRooms) {
      throw new ScenarioError(`Batas room aktif tercapai (${this.limits.maxActiveRooms} room). Tutup room yang sudah selesai atau hubungi admin.`, 429);
    }
    const playable = playableVersionForScenario(scenarioId);
    const room = new StoryRoom(
      {
        id: randomUUID(),
        code: this.newCode(),
        version: {
          scenarioId,
          versionId: playable.version.id,
          versionNo: playable.version.versionNo,
          contentHash: playable.version.contentHash,
          title: playable.version.title,
          categoryName: playable.categoryName,
          contentKind: playable.version.contentKind,
        },
        content: playable.content,
        hostUserId: host.id,
        hostName: host.displayName,
        maxParticipants: this.limits.maxParticipantsPerRoom,
        autoAdvance: opts.autoAdvance ?? true,
        timing: this.timing,
      },
      this.clock,
      sqliteRoomStore,
      this.events,
    );
    sqliteRoomStore.roomCreated(room);
    this.rooms.set(room.code, room);
    return room;
  }

  get(code: unknown): StoryRoom | undefined {
    if (typeof code !== 'string') return undefined;
    return this.rooms.get(code.trim().toUpperCase());
  }

  all(): StoryRoom[] {
    return [...this.rooms.values()];
  }

  /**
   * Drop closed rooms from memory after `keepClosedMs` (results stay in the DB). Abandoned rooms are closed as
   * `expired` (a system action, not the host's): lobbies never started, and rooms waiting on the host (paused on a
   * leaderboard with auto-advance off) for longer than `idlePausedMs`, so they release their active-room slot.
   */
  sweep(keepClosedMs = 2 * 60 * 60 * 1000, idleLobbyMs = 6 * 60 * 60 * 1000, idlePausedMs = 2 * 60 * 60 * 1000): string[] {
    const now = this.clock.now();
    const removed: string[] = [];
    for (const room of this.rooms.values()) {
      if (room.closed && room.finishedAt !== null && now - room.finishedAt > keepClosedMs) {
        room.dispose();
        this.rooms.delete(room.code);
        removed.push(room.code);
      } else if (room.phase === 'lobby' && now - room.createdAt > idleLobbyMs) {
        room.close('expired');
      } else if (!room.closed && room.phase !== 'lobby' && room.phaseEndsAt === null && now - room.phaseSince > idlePausedMs) {
        room.close('expired');
      }
    }
    return removed;
  }

  disposeAll(): void {
    for (const r of this.rooms.values()) r.dispose();
    this.rooms.clear();
  }
}
