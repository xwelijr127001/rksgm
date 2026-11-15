/**
 * SQLite persistence of Story Room sessions (PRD FR-D3/D5 audit trail, FR-B10 closed rooms, restart policy).
 * Every settled round is written immediately, so a crash loses at most the round in progress. Rooms themselves are
 * in-memory; on boot every unfinished room is marked `interrupted` (`recoverInterruptedRooms`).
 */
import { getDb } from '../../db';
import { DEFAULT_CONTENT_LOCALE } from '../../../../shared/story/content';
import { clampMood, type DecisionResult } from '../../../../shared/story/engine';
import type { StoryClosedReason, StoryFinalSummary, StorySummaryLabels } from '../../../../shared/story/protocol';
import { summaryLabelsOf } from '../../../../shared/story/scene';
import { STORY_SCORE_POLICY } from '../../../../shared/story/scorePolicy';
import { buildSummary, withSummaryDefaults } from '../../../../shared/story/summary';
import { writeAudit, SYSTEM_ACTOR } from '../auth/audit';
import { getVersionContent, ScenarioError } from '../content/scenarios';
import type { ParticipantFinal, RoundSettlement, StoryRoom, StoryRoomStore } from './room';

export type StoryRoomStatus = 'lobby' | 'running' | 'finished' | 'interrupted';

export const sqliteRoomStore: StoryRoomStore & { roomCreated(room: StoryRoom): void } = {
  roomCreated(room) {
    getDb()
      .prepare(
        `INSERT INTO story_rooms (id, code, scenario_id, version_id, version_no, content_hash, scenario_title, category_id, content_kind, score_policy_id, answer_window_ms, status, host_user_id, host_name, max_participants, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lobby', ?, ?, ?, ?)`,
      )
      .run(
        room.id,
        room.code,
        room.version.scenarioId,
        room.version.versionId,
        room.version.versionNo,
        room.version.contentHash,
        room.version.title,
        room.content.categoryId,
        room.version.contentKind,
        room.scorePolicyId,
        room.timing.answerWindowMs,
        room.hostUserId,
        room.hostName,
        room.maxParticipants,
        room.createdAt,
      );
  },
  participantJoined(room, p) {
    getDb()
      .prepare('INSERT INTO story_participants (room_id, participant_id, name, credential_hash, joined_at) VALUES (?, ?, ?, ?, ?)')
      .run(room.id, p.id, p.name, p.credentialHash, p.joinedAt);
  },
  participantRenamed(room, p) {
    getDb().prepare('UPDATE story_participants SET name = ? WHERE room_id = ? AND participant_id = ?').run(p.name, room.id, p.id);
  },
  participantRemoved(room, p) {
    getDb().prepare('UPDATE story_participants SET removed_at = ? WHERE room_id = ? AND participant_id = ?').run(Date.now(), room.id, p.id);
    writeAudit({ id: room.hostUserId, name: room.hostName }, 'room.remove_participant', 'story_room', room.code, { participantId: p.id, name: p.name });
  },
  roomStarted(room) {
    getDb().prepare(`UPDATE story_rooms SET status = 'running', started_at = ? WHERE id = ?`).run(room.startedAt, room.id);
  },
  roundSettled(room, s: RoundSettlement) {
    const db = getDb();
    db.transaction(() => {
      db.prepare(
        `INSERT INTO story_room_rounds (room_id, round_index, round_id, scene_started_at, answering_started_at, deadline_at, closed_at, close_reason, eligible_count, answered_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(room.id, s.roundIndex, s.roundId, s.sceneStartedAt, s.answeringStartedAt, s.deadlineAt, s.closedAt, s.closeReason, s.eligibleCount, s.answeredCount);
      const ins = db.prepare(
        `INSERT INTO story_decisions (room_id, participant_id, round_index, round_id, choice_id, outcome, accuracy, received_at, elapsed_ms, accuracy_points, speed_points, round_score, mood_before, mood_after, score_policy_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const d of s.decisions) {
        const r = d.result;
        ins.run(room.id, d.participantId, s.roundIndex, s.roundId, r.choiceId, r.outcome, r.accuracy, d.receivedAt, r.elapsedMs, r.score.accuracyPoints, r.score.speedPoints, r.score.roundScore, r.moodBefore, r.moodAfter, room.scorePolicyId);
      }
      // Running totals keep cross-room reports correct even if the room never finishes.
      const tot = db.prepare(
        `UPDATE story_participants SET
           total_score = (SELECT COALESCE(SUM(round_score),0) FROM story_decisions d WHERE d.room_id = @room AND d.participant_id = story_participants.participant_id),
           accuracy_points = (SELECT COALESCE(SUM(accuracy_points),0) FROM story_decisions d WHERE d.room_id = @room AND d.participant_id = story_participants.participant_id),
           speed_points = (SELECT COALESCE(SUM(speed_points),0) FROM story_decisions d WHERE d.room_id = @room AND d.participant_id = story_participants.participant_id),
           answered_count = (SELECT COUNT(*) FROM story_decisions d WHERE d.room_id = @room AND d.participant_id = story_participants.participant_id AND d.outcome != 'timeout'),
           timeout_count = (SELECT COUNT(*) FROM story_decisions d WHERE d.room_id = @room AND d.participant_id = story_participants.participant_id AND d.outcome = 'timeout')
         WHERE room_id = @room`,
      );
      tot.run({ room: room.id });
    })();
  },
  roomFinished(room, finals: ParticipantFinal[]) {
    const db = getDb();
    db.transaction(() => {
      const upd = db.prepare(
        `UPDATE story_participants SET completed = 1, final_rank = ?, rank_tied = ?, total_score = ?, accuracy_points = ?, speed_points = ?, answered_count = ?, timeout_count = ?,
           final_mood = ?, ending_id = ?, ending_kind = ?, summary_json = ? WHERE room_id = ? AND participant_id = ?`,
      );
      for (const f of finals) {
        const p = room.participants.get(f.participantId);
        const summary = p ? room.summaryFor(p) : null;
        upd.run(f.rank, f.tied ? 1 : 0, f.totals.totalScore, f.totals.accuracyPoints, f.totals.speedPoints, f.totals.answeredCount, f.totals.timeoutCount, f.finalMood, f.endingId, f.endingKind, summary ? JSON.stringify(summary) : null, room.id, f.participantId);
      }
      db.prepare(`UPDATE story_rooms SET status = 'finished', closed_reason = 'finished', finished_at = ? WHERE id = ?`).run(room.finishedAt, room.id);
    })();
  },
  roomClosedEarly(room, reason: StoryClosedReason) {
    const db = getDb();
    db.transaction(() => {
      const upd = db.prepare('UPDATE story_participants SET final_mood = ?, summary_json = ? WHERE room_id = ? AND participant_id = ?');
      if (room.startedAt !== null) for (const p of room.participants.values()) upd.run(p.mood, JSON.stringify(room.summaryFor(p)), room.id, p.id);
      db.prepare(`UPDATE story_rooms SET status = 'interrupted', closed_reason = ?, finished_at = ? WHERE id = ?`).run(reason, room.finishedAt, room.id);
    })();
    // Only a host close is the host's action; expiry and administrator closes are recorded as system/administrator actions.
    const actor = reason === 'host_closed' ? { id: room.hostUserId, name: room.hostName } : SYSTEM_ACTOR;
    writeAudit(actor, 'room.close_early', 'story_room', room.code, { reason, started: room.startedAt !== null });
  },
};

/**
 * Restart policy (ARCHITECTURE.md §3): rooms are not resumed after a restart. Every room still `lobby`/`running` is
 * marked `interrupted` with reason `server_restart`; its settled rounds stay in the database and in reports.
 */
export function recoverInterruptedRooms(now: number = Date.now()): string[] {
  const db = getDb();
  const rows = db.prepare(`SELECT id, code FROM story_rooms WHERE status IN ('lobby', 'running')`).all() as { id: string; code: string }[];
  if (rows.length === 0) return [];
  db.transaction(() => {
    // The session really ended at its last settled round (or its start), not at boot time: durations in reports must
    // not include the downtime.
    const upd = db.prepare(
      `UPDATE story_rooms SET status = 'interrupted', closed_reason = 'server_restart',
         finished_at = COALESCE((SELECT MAX(closed_at) FROM story_room_rounds rr WHERE rr.room_id = story_rooms.id), started_at, ?)
       WHERE id = ?`,
    );
    for (const r of rows) upd.run(now, r.id);
  })();
  writeAudit(SYSTEM_ACTOR, 'room.interrupted_on_boot', 'story_room', rows.map((r) => r.code).join(','), { count: rows.length });
  return rows.map((r) => r.code);
}

export interface PersistedRoom {
  id: string;
  code: string;
  scenarioId: string;
  versionId: string;
  versionNo: number;
  scenarioTitle: string;
  contentKind: 'demo' | 'official';
  status: StoryRoomStatus;
  closedReason: StoryClosedReason | null;
  hostUserId: string;
  hostName: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  scorePolicyId: string;
  answerWindowMs: number;
}

export function persistedRoomByCode(code: string): PersistedRoom | undefined {
  const r = getDb().prepare('SELECT * FROM story_rooms WHERE code = ?').get(code) as
    | {
        id: string;
        code: string;
        scenario_id: string;
        version_id: string;
        version_no: number;
        scenario_title: string;
        content_kind: 'demo' | 'official';
        status: StoryRoomStatus;
        closed_reason: StoryClosedReason | null;
        host_user_id: string;
        host_name: string;
        created_at: number;
        started_at: number | null;
        finished_at: number | null;
        score_policy_id: string;
        answer_window_ms: number;
      }
    | undefined;
  if (!r) return undefined;
  return {
    id: r.id,
    code: r.code,
    scenarioId: r.scenario_id,
    versionId: r.version_id,
    versionNo: r.version_no,
    scenarioTitle: r.scenario_title,
    contentKind: r.content_kind,
    status: r.status,
    closedReason: r.closed_reason,
    hostUserId: r.host_user_id,
    hostName: r.host_name,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    scorePolicyId: r.score_policy_id,
    answerWindowMs: r.answer_window_ms,
  };
}

export function codeExists(code: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM story_rooms WHERE code = ?').get(code));
}

/** One stored `story_decisions` row (the columns the summary needs). */
export interface DecisionRow {
  round_index: number;
  choice_id: string | null;
  outcome: DecisionResult['outcome'];
  accuracy: number;
  elapsed_ms: number | null;
  accuracy_points: number;
  speed_points: number;
  round_score: number;
  /** Mood at decision time, i.e. AFTER the delayed effects applied when the round began. */
  mood_before: number;
  mood_after: number;
  round_id: string;
}

/**
 * Decisions rebuilt from one participant's stored rows, ordered by round (sparse: decisions[roundIndex]). Delayed
 * effects need no extra column: the change applied when a round began is `mood_before` minus the mood carried in, i.e.
 * the previous round's `mood_after` (the clamped initial mood before round 1). A gap in the rows (a round whose
 * settlement failed to persist) leaves the carried mood unknown: that round then reports no delayed change rather than
 * a wrong one.
 */
export function decisionsFromRows(rows: readonly DecisionRow[], initialMood: number): (DecisionResult | undefined)[] {
  const decisions: (DecisionResult | undefined)[] = [];
  let prev: DecisionRow | undefined;
  for (const r of rows) {
    const carried = r.round_index === 0 ? clampMood(initialMood) : prev && prev.round_index === r.round_index - 1 ? prev.mood_after : r.mood_before;
    decisions[r.round_index] = {
      roundId: r.round_id,
      choiceId: r.choice_id,
      outcome: r.outcome,
      accuracy: r.accuracy,
      elapsedMs: r.elapsed_ms,
      score: { accuracyPoints: r.accuracy_points, speedPoints: r.speed_points, roundScore: r.round_score, speedFactor: 0 },
      moodCarried: carried,
      delayedDelta: r.mood_before - carried,
      moodBefore: r.mood_before,
      moodAfter: r.mood_after,
      moodDelta: r.mood_after - r.mood_before,
    };
    prev = r;
  }
  return decisions;
}

/**
 * Names and status words of a stored version's content (versions are immutable, so they equal what the live room
 * showed); undefined when the version cannot be read, so a stored summary stays readable with neutral labels.
 */
function versionLabels(versionId: string): StorySummaryLabels | undefined {
  try {
    return summaryLabelsOf(getVersionContent(versionId).content, DEFAULT_CONTENT_LOCALE);
  } catch (err) {
    if (err instanceof ScenarioError) return undefined;
    throw err;
  }
}

/**
 * Personalized summary of a closed room from the database (survives restarts). Uses the stored summary when the room
 * closed normally (filling fields added after it was stored: a summary stored before labels existed gets its version's
 * names and status words, so a result reopened after the room left memory reads like the live room); rebuilds a partial
 * one from stored decisions for rooms interrupted by a restart.
 */
export function persistedSummary(room: PersistedRoom, participantId: string): StoryFinalSummary | null {
  const db = getDb();
  const p = db.prepare('SELECT * FROM story_participants WHERE room_id = ? AND participant_id = ?').get(room.id, participantId) as
    | { summary_json: string | null; final_mood: number | null; ending_id: string | null; final_rank: number | null; rank_tied: number | null }
    | undefined;
  if (!p) return null;
  if (p.summary_json) {
    try {
      const stored = JSON.parse(p.summary_json) as StoryFinalSummary;
      return withSummaryDefaults(stored, stored.labels ? undefined : versionLabels(room.versionId));
    } catch {
      /* fall through to rebuild */
    }
  }
  const rows = db.prepare('SELECT * FROM story_decisions WHERE room_id = ? AND participant_id = ? ORDER BY round_index').all(room.id, participantId) as DecisionRow[];
  const { content } = getVersionContent(room.versionId);
  const decisions = decisionsFromRows(rows, content.initialMood);
  const last = rows[rows.length - 1];
  return buildSummary({
    content,
    decisions,
    endingId: p.ending_id,
    rank: null,
    complete: room.status === 'finished',
    finalMood: p.final_mood ?? last?.mood_after ?? content.initialMood,
    scorePolicyId: room.scorePolicyId || STORY_SCORE_POLICY.id,
    scenarioTitle: room.scenarioTitle,
    versionNo: room.versionNo,
    roomCode: room.code,
    answerWindowMs: room.answerWindowMs,
  });
}

export function participantByCredential(roomId: string, credentialHash: string): { participantId: string; name: string; removed: boolean } | undefined {
  const r = getDb().prepare('SELECT participant_id, name, removed_at FROM story_participants WHERE room_id = ? AND credential_hash = ?').get(roomId, credentialHash) as
    | { participant_id: string; name: string; removed_at: number | null }
    | undefined;
  return r ? { participantId: r.participant_id, name: r.name, removed: r.removed_at !== null } : undefined;
}

