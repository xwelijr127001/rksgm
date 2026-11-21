/**
 * T-107 (Investigator lengkap, card 4): DOMAIN + STORAGE of the Investigator event board. No Express here: every function
 * takes the database and the current time, so the rules can be read (and reviewed) without the HTTP layer.
 *
 * Rules
 *  - The SERVER owns a run: stage, attempts, outcomes, score, best and stamps. A decision carries ids only; the score comes
 *    from the shared rubric (shared/investigator/rubric.ts `applyChoice` / `score`), the same code the phone uses solo.
 *  - One open board per host (staff user) at a time; a board belongs to one Asia/Jakarta calendar day and closes at local
 *    midnight or when its owner closes it. A closed board, its runs and its aliases are purged at most 24 h later, also
 *    after downtime (`sweep` runs at start, on a timer and before requests).
 *  - Credentials are random, opaque, and stored only as SHA-256 hashes. A participant is identified by nothing else.
 *  - A decision is idempotent by (runId, commandId): the stored acknowledgement is returned again for the same body; the
 *    same commandId with another body is refused. Advancing the stage, storing the command and upserting the best happen
 *    in ONE transaction.
 *  - Nothing here reads or writes quiz rooms, story rooms, answers, prizes or staff tables.
 */
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  EVENT_LIMITS,
  type Ack,
  type BoardSnapshot,
  type Decision,
  type DisplayCodeReply,
  type DisplayExchangeReply,
  type EventErrorCode,
  type EventInfo,
  type HostEventView,
  type HostRow,
  type JoinReply,
  type PublicRow,
  type RunState,
  type Standing,
  type StartRunReply,
} from '../../../shared/investigator/event';
import { applyChoice, caseVersions, manifestOf, startProgress, STAGE_DONE, type CaseScore, type RoundOutcome, type RunProgress } from '../../../shared/investigator/rubric';

type Db = Database.Database;

/** A refusal with its machine code and HTTP status (the HTTP layer turns it into `{ ok: false, error }`). */
export class EventError extends Error {
  constructor(readonly code: EventErrorCode, readonly status: number, readonly run?: RunState) {
    super(code);
  }
}

// ------------------------------------------------------------------ small helpers

const WIB_MS = 7 * 60 * 60_000; // Asia/Jakarta = UTC+7, no daylight saving
const PURGE_MS = EVENT_LIMITS.purgeHoursAfterClose * 60 * 60_000;
/** Runs one participant may start in one event (bounds the table; replaying is still generous). */
export const MAX_RUNS_PER_PARTICIPANT = 60;
export const CREDENTIAL_PARTICIPANT = 'ivp_';
export const CREDENTIAL_DISPLAY = 'ivd_';

/** Calendar day in Asia/Jakarta and the next local midnight (epoch ms). */
export function jakartaDay(now: number): { day: string; closesAt: number } {
  const d = new Date(now + WIB_MS);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const t = d.getUTCDate();
  return { day: `${y}-${String(m + 1).padStart(2, '0')}-${String(t).padStart(2, '0')}`, closesAt: Date.UTC(y, m, t + 1) - WIB_MS };
}

export const hashOf = (secret: string): string => crypto.createHash('sha256').update(secret).digest('hex');
const randomId = (prefix: string, bytes = 16): string => prefix + crypto.randomBytes(bytes).toString('base64url');
/** Unambiguous alphabet for codes people read from a projector (no I, O, 0, 1). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (length: number): string => Array.from({ length }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
export const EVENT_CODE_LENGTH = 6;
export const DISPLAY_CODE_LENGTH = 8;
export const normalizeCode = (v: unknown, length: number): string | null => {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return s.length === length && [...s].every((c) => CODE_ALPHABET.includes(c)) ? s : null;
};

/** Event-local aliases: an invented detective word and three digits ("Lensa 042"). No names, no free text. */
const ALIAS_WORDS = ['Lensa', 'Jejak', 'Sidik', 'Berkas', 'Senter', 'Kompas', 'Arsip', 'Sandi', 'Kunci', 'Catatan', 'Peta', 'Teropong'];
const randomAlias = (): string => `${ALIAS_WORDS[crypto.randomInt(ALIAS_WORDS.length)]} ${String(crypto.randomInt(1000)).padStart(3, '0')}`;

// ------------------------------------------------------------------ rows

export interface EventRow { id: string; code: string; host_id: string; day: string; status: 'open' | 'closed'; created_at: number; closes_at: number; closed_at: number | null; purge_at: number | null }
export interface ParticipantRow { id: string; event_id: string; alias: string; hidden: number; started: number; created_at: number; expires_at: number }
interface RunRow {
  id: string; participant_id: string; event_id: string; case_id: string; rubric_version: number; seq: number; stage: string;
  outcomes_json: string; verdict_id: string | null; message_id: string | null; status: 'active' | 'completed' | 'replaced';
  score_json: string | null; total: number | null; last_command_id: string | null;
}

export const eventInfo = (e: EventRow): EventInfo => ({ eventId: e.id, code: e.code, day: e.day, status: e.status, createdAt: e.created_at, closesAt: e.closes_at, purgeAt: e.purge_at });
const eventBrief = (e: EventRow) => ({ eventId: e.id, code: e.code, day: e.day, status: e.status, closesAt: e.closes_at });

export const eventById = (db: Db, id: string): EventRow | undefined => db.prepare('SELECT * FROM inv_events WHERE id = ?').get(id) as EventRow | undefined;
export const openEventByCode = (db: Db, code: string): EventRow | undefined => db.prepare("SELECT * FROM inv_events WHERE code = ? AND status = 'open'").get(code) as EventRow | undefined;
export const openEventOfHost = (db: Db, hostId: string): EventRow | undefined => db.prepare("SELECT * FROM inv_events WHERE host_id = ? AND status = 'open'").get(hostId) as EventRow | undefined;

// ------------------------------------------------------------------ closing and purging

function deleteEventData(db: Db, eventId: string): void {
  db.prepare('DELETE FROM inv_commands WHERE run_id IN (SELECT id FROM inv_runs WHERE event_id = ?)').run(eventId);
  db.prepare('DELETE FROM inv_runs WHERE event_id = ?').run(eventId);
  db.prepare('DELETE FROM inv_best WHERE event_id = ?').run(eventId);
  db.prepare('DELETE FROM inv_participants WHERE event_id = ?').run(eventId);
}

/**
 * Housekeeping, safe to call any time: close open boards whose local midnight has passed, purge closed boards whose purge
 * time has passed (board, runs, commands, bests, aliases, display credentials), drop expired pairing codes.
 */
export function sweep(db: Db, now: number): { closed: number; purged: number } {
  return db.transaction(() => {
    const closed = db.prepare("UPDATE inv_events SET status = 'closed', closed_at = closes_at, purge_at = closes_at + ? WHERE status = 'open' AND closes_at <= ?").run(PURGE_MS, now).changes;
    // T-110: a pending pairing code never outlives its board (closed by its owner or at local midnight).
    db.prepare("DELETE FROM inv_display_codes WHERE event_id IN (SELECT id FROM inv_events WHERE status = 'closed')").run();
    const due = db.prepare("SELECT id FROM inv_events WHERE status = 'closed' AND purge_at IS NOT NULL AND purge_at <= ?").all(now) as { id: string }[];
    for (const e of due) {
      deleteEventData(db, e.id);
      db.prepare('DELETE FROM inv_displays WHERE event_id = ?').run(e.id);
      db.prepare('DELETE FROM inv_display_codes WHERE event_id = ?').run(e.id);
      db.prepare('DELETE FROM inv_events WHERE id = ?').run(e.id);
    }
    db.prepare('DELETE FROM inv_display_codes WHERE expires_at <= ?').run(now);
    db.prepare('DELETE FROM inv_displays WHERE expires_at <= ?').run(now);
    return { closed, purged: due.length };
  })();
}

// ------------------------------------------------------------------ host

/** The host's open board, or a new one for today (one open board per host; a new code every time). */
export function createEvent(db: Db, hostId: string, now: number): EventRow {
  return db.transaction(() => {
    const ada = openEventOfHost(db, hostId);
    if (ada) return ada;
    const { day, closesAt } = jakartaDay(now);
    for (let i = 0; i < 20; i++) {
      const code = randomCode(EVENT_CODE_LENGTH);
      if (openEventByCode(db, code)) continue;
      const id = randomId('ev_', 12);
      db.prepare("INSERT INTO inv_events (id, code, host_id, day, status, created_at, closes_at) VALUES (?, ?, ?, ?, 'open', ?, ?)").run(id, code, hostId, day, now, closesAt);
      return eventById(db, id)!;
    }
    throw new EventError('unavailable', 503);
  })();
}

export function closeEvent(db: Db, e: EventRow, now: number): EventRow {
  db.transaction(() => {
    db.prepare("UPDATE inv_events SET status = 'closed', closed_at = ?, purge_at = ? WHERE id = ? AND status = 'open'").run(now, now + PURGE_MS, e.id);
    // T-110 (Codex T-108 finding 3): a pairing code issued just before closure can no longer be exchanged.
    db.prepare('DELETE FROM inv_display_codes WHERE event_id = ?').run(e.id);
  })();
  return eventById(db, e.id)!;
}

/** Remove every entry, run and alias of the board; the board itself (code, display pairing) stays as it is. */
export function clearEvent(db: Db, e: EventRow): void {
  db.transaction(() => deleteEventData(db, e.id))();
}

export function hideEntry(db: Db, e: EventRow, participantId: string, hidden: boolean): void {
  const n = db.prepare('UPDATE inv_participants SET hidden = ? WHERE id = ? AND event_id = ?').run(hidden ? 1 : 0, participantId, e.id).changes;
  if (!n) throw new EventError('not_found', 404);
}

interface Ranked { participantId: string; alias: string; hidden: boolean; total: number; stamps: number }
/** Entries with at least one finished case, best first (ties: who got there first, then alias). */
function entries(db: Db, eventId: string): Ranked[] {
  const rows = db.prepare(`
    SELECT p.id AS id, p.alias AS alias, p.hidden AS hidden, SUM(b.total) AS total, COUNT(*) AS stamps, MAX(b.updated_at) AS at
    FROM inv_best b JOIN inv_participants p ON p.id = b.participant_id
    WHERE b.event_id = ? GROUP BY p.id ORDER BY total DESC, at ASC, alias ASC`).all(eventId) as { id: string; alias: string; hidden: number; total: number; stamps: number }[];
  return rows.map((r) => ({ participantId: r.id, alias: r.alias, hidden: r.hidden === 1, total: r.total, stamps: r.stamps }));
}
/** Equal totals share a rank (1, 1, 3). */
function withRank<T extends { total: number }>(list: T[]): (T & { rank: number })[] {
  let rank = 0;
  return list.map((x, i) => {
    if (i === 0 || x.total !== list[i - 1]!.total) rank = i + 1;
    return { ...x, rank };
  });
}
const participantCount = (db: Db, eventId: string): number => (db.prepare('SELECT COUNT(*) AS n FROM inv_participants WHERE event_id = ?').get(eventId) as { n: number }).n;

export function hostView(db: Db, e: EventRow, now: number): HostEventView {
  const rows: HostRow[] = withRank(entries(db, e.id)).map((x) => ({ rank: x.rank, alias: x.alias, total: x.total, stamps: x.stamps, participantId: x.participantId, hidden: x.hidden }));
  const paired = !!db.prepare('SELECT 1 FROM inv_displays WHERE event_id = ? AND revoked = 0 AND expires_at > ? LIMIT 1').get(e.id, now);
  return { event: eventInfo(e), participants: participantCount(db, e.id), rows, displayPaired: paired };
}

/** Public snapshot: hidden entries are left out BEFORE ranking; top rows only. */
export function boardSnapshot(db: Db, e: EventRow, now: number): BoardSnapshot {
  const rows: PublicRow[] = withRank(entries(db, e.id).filter((x) => !x.hidden)).slice(0, EVENT_LIMITS.topRows).map((x) => ({ rank: x.rank, alias: x.alias, total: x.total, stamps: x.stamps }));
  return { event: eventBrief(e), participants: participantCount(db, e.id), rows, generatedAt: now };
}

// ------------------------------------------------------------------ projector pairing (read-only display credential)

/** A short-lived, one-use pairing code for the projector. Only its hash is stored. */
export function issueDisplayCode(db: Db, e: EventRow, now: number): DisplayCodeReply {
  const displayCode = randomCode(DISPLAY_CODE_LENGTH);
  const expiresAt = now + EVENT_LIMITS.displayCodeSeconds * 1000;
  db.transaction(() => {
    db.prepare('DELETE FROM inv_display_codes WHERE event_id = ?').run(e.id); // one pending code per board
    db.prepare('INSERT INTO inv_display_codes (code_hash, event_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashOf(displayCode), e.id, now, expiresAt);
  })();
  return { displayCode, expiresAt };
}

/** Exchange a pairing code (once) for a read-only display credential; null = unknown, used or expired code. */
export function exchangeDisplayCode(db: Db, displayCode: string, now: number): DisplayExchangeReply | null {
  return db.transaction(() => {
    const kode = hashOf(displayCode);
    const row = db.prepare('SELECT event_id, expires_at FROM inv_display_codes WHERE code_hash = ?').get(kode) as { event_id: string; expires_at: number } | undefined;
    if (!row) return null;
    db.prepare('DELETE FROM inv_display_codes WHERE code_hash = ?').run(kode); // one use, whatever happens next
    const e = eventById(db, row.event_id);
    // T-110: only an OPEN board, before its local midnight, can be paired (already-paired displays keep the final board
    // until they are revoked or expire).
    if (row.expires_at <= now || !e || e.status !== 'open' || e.closes_at <= now) return null;
    const credential = randomId(CREDENTIAL_DISPLAY, 32);
    const expiresAt = (e.purge_at ?? e.closes_at + PURGE_MS);
    db.prepare('INSERT INTO inv_displays (credential_hash, event_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashOf(credential), e.id, now, expiresAt);
    return { credential, eventId: e.id, expiresAt };
  })();
}

export function revokeDisplays(db: Db, e: EventRow): void {
  db.transaction(() => {
    db.prepare('UPDATE inv_displays SET revoked = 1 WHERE event_id = ?').run(e.id);
    db.prepare('DELETE FROM inv_display_codes WHERE event_id = ?').run(e.id);
  })();
}

export function eventOfDisplay(db: Db, credential: string, now: number): EventRow | undefined {
  const row = db.prepare('SELECT event_id FROM inv_displays WHERE credential_hash = ? AND revoked = 0 AND expires_at > ?').get(hashOf(credential), now) as { event_id: string } | undefined;
  return row ? eventById(db, row.event_id) : undefined;
}

// ------------------------------------------------------------------ participants

/** Join an OPEN board by its public code: a random alias and a bearer credential (returned once, stored as a hash). */
export function joinEvent(db: Db, e: EventRow, now: number): JoinReply {
  return db.transaction(() => {
    if (e.status !== 'open' || e.closes_at <= now) throw new EventError('closed', 409);
    if (participantCount(db, e.id) >= EVENT_LIMITS.maxParticipants) throw new EventError('full', 409);
    const credential = randomId(CREDENTIAL_PARTICIPANT, 32);
    const id = randomId('pt_', 12);
    const expiresAt = e.closes_at + PURGE_MS;
    const alias = freeAlias(db, e.id);
    db.prepare('INSERT INTO inv_participants (id, event_id, alias, credential_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, e.id, alias, hashOf(credential), now, expiresAt);
    return { event: eventBrief(e), participantId: id, alias, credential, expiresAt, cases: caseVersions() };
  })();
}

function freeAlias(db: Db, eventId: string): string {
  const taken = db.prepare('SELECT 1 FROM inv_participants WHERE event_id = ? AND alias = ?');
  for (let i = 0; i < 40; i++) {
    const a = randomAlias();
    if (!taken.get(eventId, a)) return a;
  }
  throw new EventError('unavailable', 503);
}

export function participantOf(db: Db, credential: string, now: number): { p: ParticipantRow; e: EventRow } | undefined {
  const p = db.prepare('SELECT id, event_id, alias, hidden, started, created_at, expires_at FROM inv_participants WHERE credential_hash = ? AND expires_at > ?').get(hashOf(credential), now) as ParticipantRow | undefined;
  const e = p ? eventById(db, p.event_id) : undefined;
  return p && e ? { p, e } : undefined;
}

/** A new random alias, only before the participant's first run. */
export function rerollAlias(db: Db, p: ParticipantRow, e: EventRow): string {
  return db.transaction(() => {
    if (e.status !== 'open') throw new EventError('closed', 409);
    const kini = db.prepare('SELECT started FROM inv_participants WHERE id = ?').get(p.id) as { started: number } | undefined;
    if (!kini) throw new EventError('unauthorized', 401);
    if (kini.started) throw new EventError('alias_locked', 409);
    const alias = freeAlias(db, e.id);
    db.prepare('UPDATE inv_participants SET alias = ? WHERE id = ?').run(alias, p.id);
    return alias;
  })();
}

const parseJson = <T>(s: string | null, fallback: T): T => {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

function runState(db: Db, r: RunRow): RunState {
  const score = r.status === 'completed' ? parseJson<CaseScore | undefined>(r.score_json, undefined) : undefined;
  const cmd = r.last_command_id ? (db.prepare('SELECT ack_json FROM inv_commands WHERE run_id = ? AND command_id = ?').get(r.id, r.last_command_id) as { ack_json: string } | undefined) : undefined;
  const ack = cmd ? parseJson<Ack | undefined>(cmd.ack_json, undefined) : undefined;
  return {
    runId: r.id, caseId: r.case_id, rubricVersion: r.rubric_version, seq: r.seq, stage: r.stage,
    status: r.status === 'completed' ? 'completed' : 'active',
    ...(score ? { score } : {}),
    ...(ack && r.last_command_id ? { last: { commandId: r.last_command_id, ack } } : {}),
  };
}

/** A run of THIS participant that is still theirs to see (a run replaced by a newer start is gone). */
function runOf(db: Db, p: ParticipantRow, runId: string): RunRow | undefined {
  const r = db.prepare('SELECT * FROM inv_runs WHERE id = ? AND participant_id = ?').get(runId, p.id) as RunRow | undefined;
  return r && r.status !== 'replaced' ? r : undefined;
}

export function getRun(db: Db, p: ParticipantRow, runId: string): RunState {
  const r = runOf(db, p, runId);
  if (!r) throw new EventError('not_found', 404);
  return runState(db, r);
}

export function standing(db: Db, p: ParticipantRow, e: EventRow): Standing {
  const best = Object.fromEntries((db.prepare('SELECT case_id, total FROM inv_best WHERE participant_id = ?').all(p.id) as { case_id: string; total: number }[]).map((b) => [b.case_id, b.total]));
  const publik = withRank(entries(db, e.id).filter((x) => !x.hidden));
  const saya = publik.find((x) => x.participantId === p.id);
  const open = db.prepare("SELECT * FROM inv_runs WHERE participant_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1").get(p.id) as RunRow | undefined;
  return {
    alias: p.alias,
    rank: saya ? saya.rank : null,
    total: Object.values(best).reduce((a, b) => a + b, 0),
    stamps: Object.keys(best).length,
    best,
    participants: participantCount(db, e.id),
    event: { eventId: e.id, status: e.status, closesAt: e.closes_at },
    openRun: open ? runState(db, open) : null,
  };
}

/**
 * Start a ranked run from the beginning. Unknown case or rubric version = `unsupported` (the phone plays that case
 * unranked). An unfinished run of the same participant and case is replaced.
 */
export function startRun(db: Db, p: ParticipantRow, e: EventRow, caseId: unknown, rubricVersion: unknown, now: number): StartRunReply {
  if (typeof caseId !== 'string' || caseId.length > EVENT_LIMITS.maxIdLength || typeof rubricVersion !== 'number' || !Number.isInteger(rubricVersion)) throw new EventError('bad_request', 400);
  const m = manifestOf(caseId, rubricVersion);
  if (!m) return { status: 'unsupported', caseId, cases: caseVersions() };
  return db.transaction((): StartRunReply => {
    if (e.status !== 'open' || e.closes_at <= now) throw new EventError('closed', 409);
    const n = (db.prepare('SELECT COUNT(*) AS n FROM inv_runs WHERE participant_id = ?').get(p.id) as { n: number }).n;
    if (n >= MAX_RUNS_PER_PARTICIPANT) throw new EventError('rate_limited', 429);
    db.prepare("UPDATE inv_runs SET status = 'replaced', updated_at = ? WHERE participant_id = ? AND case_id = ? AND status = 'active'").run(now, p.id, m.caseId);
    const id = randomId('run_', 16);
    db.prepare("INSERT INTO inv_runs (id, participant_id, event_id, case_id, rubric_version, seq, stage, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, 'active', ?, ?)")
      .run(id, p.id, e.id, m.caseId, m.rubricVersion, startProgress(m).stage, now, now);
    db.prepare('UPDATE inv_participants SET started = 1 WHERE id = ?').run(p.id);
    return { status: 'started', run: runState(db, db.prepare('SELECT * FROM inv_runs WHERE id = ?').get(id) as RunRow) };
  })();
}

const COMMAND_ID = /^[A-Za-z0-9_-]{8,64}$/;
const shortId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= EVENT_LIMITS.maxIdLength;

/**
 * ONE scored decision. Order of checks: shape -> run is this participant's -> retry of a known command (same body = the
 * stored acknowledgement, other body = conflict) -> run still active -> board open -> seq -> server-owned stage and allowed
 * choice (shared rubric). On success the stage advance, the command record and the best upsert are one transaction.
 */
export function decide(db: Db, p: ParticipantRow, runIdPath: string, body: Record<string, unknown>, now: number): Ack {
  const d = body as Partial<Decision>;
  if (!shortId(d.runId) || d.runId !== runIdPath || typeof d.seq !== 'number' || !Number.isInteger(d.seq) || d.seq < 0 || typeof d.commandId !== 'string' || !COMMAND_ID.test(d.commandId) || !shortId(d.stageId) || !shortId(d.choiceId)) {
    throw new EventError('bad_request', 400);
  }
  const { runId, seq, commandId, stageId, choiceId } = d as Decision;
  const digest = hashOf(JSON.stringify([runId, seq, stageId, choiceId]));
  return db.transaction((): Ack => {
    const r = runOf(db, p, runId);
    if (!r) throw new EventError('not_found', 404);
    const lama = db.prepare('SELECT digest, ack_json FROM inv_commands WHERE run_id = ? AND command_id = ?').get(runId, commandId) as { digest: string; ack_json: string } | undefined;
    if (lama) {
      if (lama.digest !== digest) throw new EventError('command_conflict', 409);
      return JSON.parse(lama.ack_json) as Ack;
    }
    if (r.status !== 'active' || r.stage === STAGE_DONE) throw new EventError('run_done', 409, runState(db, r));
    const e = eventById(db, r.event_id);
    if (!e || e.status !== 'open' || e.closes_at <= now) throw new EventError('closed', 409);
    if (seq !== r.seq) throw new EventError('seq_mismatch', 409, runState(db, r));
    const m = manifestOf(r.case_id, r.rubric_version);
    if (!m) throw new EventError('unsupported_version', 409);
    const progress: RunProgress = { stage: r.stage, outcomes: parseJson<RoundOutcome[]>(r.outcomes_json, []), verdictId: r.verdict_id, messageId: r.message_id };
    const langkah = applyChoice(m, progress, stageId, choiceId);
    if (!langkah.ok) {
      if (langkah.reason === 'stage') throw new EventError('stage_mismatch', 409, runState(db, r));
      throw new EventError(langkah.reason === 'done' ? 'run_done' : 'invalid_choice', 409, langkah.reason === 'done' ? runState(db, r) : undefined);
    }
    const baru = langkah.progress;
    const selesai = langkah.status === 'completed' && !!langkah.score;
    const ack: Ack = { seq: r.seq + 1, nextStage: baru.stage, status: langkah.status, ...(selesai ? { score: langkah.score } : {}) };
    db.prepare('UPDATE inv_runs SET seq = ?, stage = ?, outcomes_json = ?, verdict_id = ?, message_id = ?, status = ?, score_json = ?, total = ?, last_command_id = ?, updated_at = ? WHERE id = ?')
      .run(ack.seq, baru.stage, JSON.stringify(baru.outcomes), baru.verdictId, baru.messageId, selesai ? 'completed' : 'active', selesai ? JSON.stringify(langkah.score) : null, selesai ? langkah.score!.total : null, commandId, now, r.id);
    db.prepare('INSERT INTO inv_commands (run_id, command_id, digest, ack_json, created_at) VALUES (?, ?, ?, ?, ?)').run(r.id, commandId, digest, JSON.stringify(ack), now);
    if (selesai) {
      // One best per participant and case: only a HIGHER total replaces it (and moves its time).
      db.prepare(`INSERT INTO inv_best (participant_id, event_id, case_id, total, run_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (participant_id, case_id) DO UPDATE SET total = excluded.total, run_id = excluded.run_id, updated_at = excluded.updated_at WHERE excluded.total > inv_best.total`)
        .run(p.id, r.event_id, r.case_id, langkah.score!.total, r.id, now);
    }
    return ack;
  })();
}
