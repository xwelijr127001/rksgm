/**
 * Competition administration and reporting (PRD FR-D3–D6, FR-E1–E2). Definitions (also shown in the admin UI):
 *
 *  - Competition room: started (has `started_at`) and `content_kind = 'official'`; demo rooms only with `includeDemo`.
 *  - Period membership: `starts_at <= room.started_at < ends_at`. Rooms outside every period are "archive / outside
 *    period" results. Periods may not overlap.
 *  - Participants: entries (names) in started rooms, excluding participants removed by the host. A name is NOT a
 *    person: unique players, repeat players and learning improvement cannot be measured without accounts.
 *  - Completion rate = participants who reached the final summary (room finished, not removed) / participants.
 *    Interrupted rooms count in the denominator but never as completed.
 *  - Average score = mean total score of completed participants.
 *  - Round analytics denominators = recorded decisions of non-removed participants in settled rounds; previews are
 *    never stored, so they can never enter these numbers.
 */
import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { contentText, textKey } from '../../../shared/story/content';
import { writeAudit, type AuditActor } from './auth/audit';
import { getVersionContent } from './content/scenarios';
import type { Dashboard, PeriodView, ResultFilter, ResultRow, RoomListRow, RoundAnalytics } from '../../../shared/story/dto';
export type { Dashboard, PeriodView, ResultFilter, ResultRow, RoomListRow, RoundAnalytics };

export class ReportError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

// ------------------------------------------------------------------ periods (FR-D4)

export function listPeriods(): PeriodView[] {
  return (getDb().prepare('SELECT * FROM story_periods ORDER BY starts_at DESC').all() as {
    id: string;
    name: string;
    starts_at: number;
    ends_at: number;
    note: string;
    created_at: number;
    updated_at: number;
  }[]).map((p) => ({ id: p.id, name: p.name, startsAt: p.starts_at, endsAt: p.ends_at, note: p.note, createdAt: p.created_at, updatedAt: p.updated_at }));
}

function cleanPeriod(raw: unknown): { name: string; startsAt: number; endsAt: number; note: string } {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : '';
  // Only real timestamps: Number(null/''/[]) would silently become 1970-01-01.
  const startsAt = typeof o.startsAt === 'number' ? o.startsAt : NaN;
  const endsAt = typeof o.endsAt === 'number' ? o.endsAt : NaN;
  const note = typeof o.note === 'string' ? o.note.trim().slice(0, 400) : '';
  if (!name) throw new ReportError('Nama periode wajib diisi.');
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt <= 0) throw new ReportError('Tanggal mulai dan selesai wajib diisi.');
  if (endsAt <= startsAt) throw new ReportError('Tanggal selesai harus setelah tanggal mulai.');
  return { name, startsAt, endsAt, note };
}

function assertNoOverlap(startsAt: number, endsAt: number, exceptId: string | null): void {
  const clash = listPeriods().find((p) => p.id !== exceptId && startsAt < p.endsAt && p.startsAt < endsAt);
  if (clash) throw new ReportError(`Periode bertabrakan dengan "${clash.name}". Satu waktu hanya boleh masuk satu periode kompetisi.`, 409);
}

export function createPeriod(raw: unknown, actor: AuditActor): PeriodView {
  const p = cleanPeriod(raw);
  assertNoOverlap(p.startsAt, p.endsAt, null);
  const id = `pd_${randomUUID().slice(0, 10)}`;
  const now = Date.now();
  getDb()
    .prepare('INSERT INTO story_periods (id, name, starts_at, ends_at, note, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, p.name, p.startsAt, p.endsAt, p.note, now, actor.id, now, actor.id);
  writeAudit(actor, 'period.create', 'period', id, p);
  return listPeriods().find((x) => x.id === id)!;
}

export function updatePeriod(id: string, raw: unknown, actor: AuditActor): PeriodView {
  const before = listPeriods().find((x) => x.id === id);
  if (!before) throw new ReportError('Periode tidak ditemukan.', 404);
  const p = cleanPeriod(raw);
  assertNoOverlap(p.startsAt, p.endsAt, id);
  getDb().prepare('UPDATE story_periods SET name = ?, starts_at = ?, ends_at = ?, note = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(p.name, p.startsAt, p.endsAt, p.note, Date.now(), actor.id, id);
  // Changing boundaries can move rooms in/out of a competition: always audited with before/after.
  writeAudit(actor, 'period.update', 'period', id, { before: { name: before.name, startsAt: before.startsAt, endsAt: before.endsAt }, after: p });
  return listPeriods().find((x) => x.id === id)!;
}

// ------------------------------------------------------------------ filters

export function parseFilter(q: Record<string, unknown>): ResultFilter {
  const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 64) : undefined);
  return {
    periodId: s(q.periodId),
    scenarioId: s(q.scenarioId),
    versionId: s(q.versionId),
    includeDemo: q.includeDemo === '1' || q.includeDemo === 'true',
    includeInterrupted: !(q.includeInterrupted === '0' || q.includeInterrupted === 'false'),
  };
}

/** SQL WHERE for story_rooms aliased `r`. */
function roomWhere(f: ResultFilter): { sql: string; args: unknown[] } {
  const where = ['r.started_at IS NOT NULL'];
  const args: unknown[] = [];
  if (!f.includeDemo) where.push(`r.content_kind = 'official'`);
  if (!f.includeInterrupted) where.push(`r.status = 'finished'`);
  if (f.scenarioId) {
    where.push('r.scenario_id = ?');
    args.push(f.scenarioId);
  }
  if (f.versionId) {
    where.push('r.version_id = ?');
    args.push(f.versionId);
  }
  if (f.periodId === 'outside') {
    where.push('NOT EXISTS (SELECT 1 FROM story_periods p WHERE r.started_at >= p.starts_at AND r.started_at < p.ends_at)');
  } else if (f.periodId) {
    const p = listPeriods().find((x) => x.id === f.periodId);
    if (!p) throw new ReportError('Periode tidak ditemukan.', 404);
    where.push('r.started_at >= ? AND r.started_at < ?');
    args.push(p.startsAt, p.endsAt);
  }
  return { sql: where.join(' AND '), args };
}

function periodNameAt(t: number | null, periods: PeriodView[]): string | null {
  if (t === null) return null;
  return periods.find((p) => t >= p.startsAt && t < p.endsAt)?.name ?? null;
}

// ------------------------------------------------------------------ dashboard (FR-E1)

export const REPORT_DEFINITIONS: Record<string, string> = {
  room: 'Room yang sudah dimulai host. Room demo hanya dihitung bila filter "sertakan demo" aktif.',
  participants: 'Entri nama peserta di room yang sudah selesai atau terhenti, tanpa peserta yang dikeluarkan host. Satu nama bukan berarti satu orang unik.',
  running: 'Room yang masih berjalan dihitung terpisah dan baru masuk peserta, tingkat penyelesaian, dan rata-rata setelah selesai atau terhenti.',
  completionRate: 'Peserta yang menerima ringkasan akhir (room selesai, tidak dikeluarkan) dibagi seluruh peserta. Room terputus/ditutup lebih awal masuk penyebut tetapi tidak pernah dihitung selesai.',
  averageScore: 'Rata-rata nilai total peserta yang menyelesaikan sesi.',
  period: 'Room masuk periode bila waktu mulainya berada di antara mulai (termasuk) dan selesai (tidak termasuk) periode.',
  notMeasured: 'Peserta unik, peserta bermain ulang, jangkauan segmen, dan peningkatan pemahaman tidak dapat diukur tanpa akun pemain (PRD menetapkan tanpa akun).',
};

export function dashboard(f: ResultFilter): Dashboard {
  const db = getDb();
  const w = roomWhere(f);
  const rooms = db.prepare(`SELECT r.status, COUNT(*) AS n FROM story_rooms r WHERE ${w.sql} GROUP BY r.status`).all(...w.args) as { status: string; n: number }[];
  const part = db
    .prepare(
      `SELECT COUNT(*) AS n, SUM(CASE WHEN r.status = 'finished' AND sp.completed = 1 THEN 1 ELSE 0 END) AS done,
              AVG(CASE WHEN r.status = 'finished' AND sp.completed = 1 THEN sp.total_score END) AS avg
       FROM story_participants sp JOIN story_rooms r ON r.id = sp.room_id
       WHERE ${w.sql} AND r.status IN ('finished', 'interrupted') AND sp.removed_at IS NULL`,
    )
    .get(...w.args) as { n: number; done: number | null; avg: number | null };
  const byScenario = db
    .prepare(
      `SELECT r.scenario_id AS scenarioId, r.version_id AS versionId, r.version_no AS versionNo, r.scenario_title AS title, r.content_kind AS contentKind,
              COUNT(DISTINCT r.id) AS rooms, COUNT(sp.participant_id) AS participants,
              AVG(CASE WHEN r.status = 'finished' AND sp.completed = 1 THEN sp.total_score END) AS averageScore
       FROM story_rooms r LEFT JOIN story_participants sp ON sp.room_id = r.id AND sp.removed_at IS NULL AND r.status IN ('finished', 'interrupted')
       WHERE ${w.sql} GROUP BY r.version_id ORDER BY r.scenario_title, r.version_no`,
    )
    .all(...w.args) as Dashboard['byScenario'];
  const count = (s: string) => rooms.find((r) => r.status === s)?.n ?? 0;
  const done = part.done ?? 0;
  return {
    filter: f,
    roomsStarted: rooms.reduce((a, r) => a + r.n, 0),
    roomsFinished: count('finished'),
    roomsInterrupted: count('interrupted'),
    roomsRunning: count('running'),
    participants: part.n,
    completedParticipants: done,
    completionRate: part.n > 0 ? done / part.n : null,
    averageScore: part.avg === null ? null : Math.round(part.avg),
    byScenario: byScenario.map((s) => ({ ...s, averageScore: s.averageScore === null ? null : Math.round(s.averageScore) })),
    definitions: REPORT_DEFINITIONS,
  };
}

// ------------------------------------------------------------------ cross-room results (FR-D3, FR-D5, FR-D6)

/** Every matching row (no silent cap: the CSV is the official recap). The JSON view slices for display. */
export function results(f: ResultFilter): ResultRow[] {
  const w = roomWhere(f);
  const periods = listPeriods();
  const rows = getDb()
    .prepare(
      `SELECT r.code, r.scenario_id, r.scenario_title, r.version_no, r.version_id, r.content_kind, r.status, r.started_at, r.finished_at,
              sp.participant_id, sp.name, sp.total_score, sp.accuracy_points, sp.speed_points, sp.answered_count, sp.timeout_count,
              sp.final_rank, sp.rank_tied, sp.completed, sp.ending_kind
       FROM story_participants sp JOIN story_rooms r ON r.id = sp.room_id
       WHERE ${w.sql} AND sp.removed_at IS NULL
       ORDER BY r.started_at DESC, r.code, sp.final_rank IS NULL, sp.final_rank, sp.total_score DESC, sp.name`,
    )
    .all(...w.args) as {
    code: string;
    scenario_id: string;
    scenario_title: string;
    version_no: number;
    version_id: string;
    content_kind: string;
    status: string;
    started_at: number;
    finished_at: number | null;
    participant_id: string;
    name: string;
    total_score: number;
    accuracy_points: number;
    speed_points: number;
    answered_count: number;
    timeout_count: number;
    final_rank: number | null;
    rank_tied: number | null;
    completed: number;
    ending_kind: string | null;
  }[];
  return rows.map((r) => ({
    roomCode: r.code,
    scenarioId: r.scenario_id,
    scenarioTitle: r.scenario_title,
    versionNo: r.version_no,
    versionId: r.version_id,
    contentKind: r.content_kind,
    roomStatus: r.status,
    periodName: periodNameAt(r.started_at, periods),
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    durationMs: r.finished_at !== null ? r.finished_at - r.started_at : null,
    participantId: r.participant_id,
    participantName: r.name,
    totalScore: r.total_score,
    accuracyPoints: r.accuracy_points,
    speedPoints: r.speed_points,
    answeredCount: r.answered_count,
    timeoutCount: r.timeout_count,
    roomRank: r.final_rank,
    rankTied: r.rank_tied === 1,
    completed: r.completed === 1,
    endingKind: r.ending_kind,
  }));
}

/** Spreadsheet formula injection guard: cells starting with = + - @ TAB CR are prefixed with an apostrophe. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const fmtTime = (t: number | null) => (t === null ? '' : new Date(t).toISOString().replace('T', ' ').slice(0, 19) + 'Z');

export function resultsCsv(rows: ResultRow[]): string {
  const header = [
    'Kode room', 'Skenario', 'Versi', 'Jenis konten', 'Status room', 'Periode', 'Mulai (UTC)', 'Selesai (UTC)', 'Durasi (detik)',
    'Nama peserta', 'Peringkat di room', 'Seri', 'Nilai total', 'Poin ketepatan', 'Poin kecepatan', 'Dijawab', 'Waktu habis', 'Selesai', 'Akhir cerita',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.roomCode, r.scenarioTitle, r.versionNo, r.contentKind === 'demo' ? 'DEMO' : 'resmi', r.roomStatus, r.periodName ?? 'Di luar periode (arsip)',
        fmtTime(r.startedAt), fmtTime(r.finishedAt), r.durationMs === null ? '' : Math.round(r.durationMs / 1000),
        r.participantName, r.roomRank ?? '', r.rankTied ? 'ya' : '', r.totalScore, r.accuracyPoints, r.speedPoints, r.answeredCount, r.timeoutCount,
        r.completed ? 'ya' : 'tidak', r.endingKind ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  // BOM so spreadsheet apps read UTF-8 names correctly.
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// ------------------------------------------------------------------ round analytics (FR-E2)

export function roundAnalytics(f: ResultFilter): RoundAnalytics[] {
  const w = roomWhere(f);
  const rows = getDb()
    .prepare(
      `SELECT r.version_id, r.version_no, r.scenario_title, d.round_index, d.round_id,
              COUNT(*) AS n,
              SUM(d.outcome = 'tepat') AS tepat, SUM(d.outcome = 'kurang_tepat') AS kurang, SUM(d.outcome = 'keliru') AS keliru, SUM(d.outcome = 'timeout') AS timeout
       FROM story_decisions d JOIN story_rooms r ON r.id = d.room_id
       JOIN story_participants sp ON sp.room_id = d.room_id AND sp.participant_id = d.participant_id
       WHERE ${w.sql} AND sp.removed_at IS NULL
       GROUP BY r.version_id, d.round_index ORDER BY r.scenario_title, r.version_no, d.round_index`,
    )
    .all(...w.args) as { version_id: string; version_no: number; scenario_title: string; round_index: number; round_id: string; n: number; tepat: number; kurang: number; keliru: number; timeout: number }[];
  const byVersion = new Map<string, RoundAnalytics>();
  const titles = new Map<string, (roundId: string) => string>();
  for (const r of rows) {
    let entry = byVersion.get(r.version_id);
    if (!entry) {
      entry = { versionId: r.version_id, scenarioTitle: r.scenario_title, versionNo: r.version_no, rounds: [] };
      byVersion.set(r.version_id, entry);
      try {
        const { content } = getVersionContent(r.version_id);
        titles.set(r.version_id, (roundId) => contentText(content, 'id', textKey.roundTitle(roundId)));
      } catch {
        titles.set(r.version_id, () => '');
      }
    }
    entry.rounds.push({
      roundIndex: r.round_index,
      roundId: r.round_id,
      title: titles.get(r.version_id)!(r.round_id),
      decisions: r.n,
      tepat: r.tepat,
      kurangTepat: r.kurang,
      keliru: r.keliru,
      timeout: r.timeout,
      keliruRate: r.n ? r.keliru / r.n : null,
      timeoutRate: r.n ? r.timeout / r.n : null,
      confusing: r.n > 0 && r.keliru / r.n > 0.75,
    });
  }
  return [...byVersion.values()];
}

// ------------------------------------------------------------------ host's own rooms

export function listRooms(opts: { hostUserId?: string; limit?: number } = {}): RoomListRow[] {
  const where = opts.hostUserId ? 'WHERE r.host_user_id = ?' : '';
  const args: unknown[] = opts.hostUserId ? [opts.hostUserId] : [];
  return (getDb()
    .prepare(
      `SELECT r.code, r.scenario_title, r.version_no, r.content_kind, r.status, r.closed_reason, r.created_at, r.started_at, r.finished_at,
              (SELECT COUNT(*) FROM story_participants sp WHERE sp.room_id = r.id AND sp.removed_at IS NULL) AS participants
       FROM story_rooms r ${where} ORDER BY r.created_at DESC LIMIT ?`,
    )
    .all(...args, Math.min(opts.limit ?? 50, 500)) as {
    code: string;
    scenario_title: string;
    version_no: number;
    content_kind: string;
    status: string;
    closed_reason: string | null;
    created_at: number;
    started_at: number | null;
    finished_at: number | null;
    participants: number;
  }[]).map((r) => ({
    code: r.code,
    scenarioTitle: r.scenario_title,
    versionNo: r.version_no,
    contentKind: r.content_kind,
    status: r.status,
    closedReason: r.closed_reason,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    participants: r.participants,
  }));
}
