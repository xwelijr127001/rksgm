/**
 * Scenario lifecycle (PRD FR-A1–A8, FR-E6; ARCHITECTURE.md §5).
 *
 *   draft --submit(author)--> in_review --publish(reviewer)--> published
 *     ^                          |  return(reviewer)              | edit(author) -> draft (published version stays live)
 *     +--------------------------+                                +-> archive(reviewer/admin) -> archived (no new rooms)
 *
 * - Drafts are mutable (optimistic `revision` check); every save is kept in `story_scenario_revisions`.
 * - Publishing snapshots the submitted revision into an IMMUTABLE `story_scenario_versions` row (content + SHA-256).
 *   Only the scenario's current version can start new rooms; rooms pin `version_id` + `content_hash`.
 * - Four-eyes rule: the reviewer who publishes cannot be the submitter or the last editor of that revision.
 * - Settled-case content requires a reviewer's anonymization check of the exact revision before publication (FR-E6).
 *   Demo content is labeled `demo` and excluded from competition reports by default (DECISIONS.md D-10).
 */
import { createHash, randomUUID } from 'node:crypto';
import { getDb } from '../../db';
import {
  CONTENT_SCHEMA_VERSION,
  contentText,
  textKey,
  type ContentSource,
  type ScenarioContent,
} from '../../../../shared/story/content';
import { hasErrors, sanitizeScenarioContent, validateScenario, type ContentIssue, type ValidationContext } from '../../../../shared/story/validate';
import { writeAudit, type AuditActor } from '../auth/audit';
import { assetValidationMap } from './assets';
import type { AnonymizationStatus, CategoryView, HostScenarioOption, RevisionRow, ScenarioDetail, ScenarioEvent, ScenarioStatus, ScenarioSummary, VersionStatus, VersionView } from '../../../../shared/story/dto';
export type { AnonymizationStatus, CategoryView, HostScenarioOption, ScenarioDetail, ScenarioEvent, ScenarioStatus, ScenarioSummary, VersionStatus, VersionView };


export class ScenarioError extends Error {
  constructor(message: string, readonly status = 400, readonly issues: ContentIssue[] = []) {
    super(message);
  }
}

// ------------------------------------------------------------------ categories (FR-A1)

export function listCategories(): CategoryView[] {
  return (getDb().prepare('SELECT id, name, active, sort, note FROM story_categories ORDER BY sort, name').all() as { id: string; name: string; active: number; sort: number; note: string }[]).map(
    (c) => ({ ...c, active: c.active === 1 }),
  );
}

export function setCategoryActive(id: string, active: boolean, actor: AuditActor): CategoryView {
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM story_categories WHERE id = ?').get(id)) throw new ScenarioError('Kategori tidak ditemukan.', 404);
  db.prepare('UPDATE story_categories SET active = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(active ? 1 : 0, Date.now(), actor.id, id);
  writeAudit(actor, active ? 'category.activate' : 'category.deactivate', 'category', id, {});
  return listCategories().find((c) => c.id === id)!;
}

export function validationContext(): ValidationContext {
  return {
    categories: new Map(listCategories().map((c) => [c.id, { active: c.active }])),
    assets: assetValidationMap(),
  };
}

// ------------------------------------------------------------------ rows & views

interface ScenarioRow {
  id: string;
  category_id: string;
  status: ScenarioStatus;
  title: string;
  content_source: ContentSource;
  current_version_id: string | null;
  anonymization_status: AnonymizationStatus;
  anonymization_by: string | null;
  anonymization_at: number | null;
  anonymization_note: string;
  submitted_by: string | null;
  submitted_at: number | null;
  submitted_revision: number | null;
  review_note: string;
  created_at: number;
  created_by: string | null;
  updated_at: number;
  updated_by: string | null;
}

interface VersionRow {
  id: string;
  scenario_id: string;
  version_no: number;
  content_json: string;
  content_hash: string;
  title: string;
  category_id: string;
  content_kind: 'demo' | 'official';
  from_revision: number;
  submitted_by: string | null;
  reviewed_by: string;
  published_at: number;
  review_note: string;
  anonymization_json: string;
  status: VersionStatus;
  withdrawn_at: number | null;
  withdrawn_by: string | null;
  withdrawn_reason: string;
}

/** Username of a staff id for attribution fields shown to staff (the database keeps the id). */
function staffName(id: string | null): string | null {
  if (!id) return null;
  const r = getDb().prepare('SELECT username FROM staff_users WHERE id = ?').get(id) as { username: string } | undefined;
  return r?.username ?? id;
}

function versionView(v: VersionRow): VersionView {
  let anonymization: Record<string, unknown> = {};
  try {
    anonymization = JSON.parse(v.anonymization_json) as Record<string, unknown>;
  } catch {
    anonymization = {};
  }
  return {
    id: v.id,
    scenarioId: v.scenario_id,
    versionNo: v.version_no,
    title: v.title,
    categoryId: v.category_id,
    contentKind: v.content_kind,
    contentHash: v.content_hash,
    fromRevision: v.from_revision,
    submittedBy: staffName(v.submitted_by),
    reviewedBy: staffName(v.reviewed_by) ?? v.reviewed_by,
    publishedAt: v.published_at,
    reviewNote: v.review_note,
    anonymization,
    status: v.status,
    withdrawnAt: v.withdrawn_at,
    withdrawnBy: staffName(v.withdrawn_by),
    withdrawnReason: v.withdrawn_reason,
  };
}

function row(id: string): ScenarioRow {
  const r = getDb().prepare('SELECT * FROM story_scenarios WHERE id = ?').get(id) as ScenarioRow | undefined;
  if (!r) throw new ScenarioError('Skenario tidak ditemukan.', 404);
  return r;
}

function draftOf(id: string): { revision: number; content: ScenarioContent; updatedBy: string | null } {
  const d = getDb().prepare('SELECT revision, content_json, updated_by FROM story_scenario_drafts WHERE scenario_id = ?').get(id) as
    | { revision: number; content_json: string; updated_by: string | null }
    | undefined;
  if (!d) throw new ScenarioError('Draf skenario tidak ditemukan.', 404);
  const content = sanitizeScenarioContent(JSON.parse(d.content_json));
  if (!content) throw new ScenarioError('Draf skenario rusak.', 500);
  return { revision: d.revision, content, updatedBy: d.updated_by };
}

export function versionsOf(id: string): VersionView[] {
  return (getDb().prepare('SELECT * FROM story_scenario_versions WHERE scenario_id = ? ORDER BY version_no DESC').all(id) as VersionRow[]).map(versionView);
}

function eventsOf(id: string): ScenarioEvent[] {
  return (
    getDb().prepare('SELECT at, actor_name, action, revision, version_id, note FROM story_scenario_events WHERE scenario_id = ? ORDER BY id DESC LIMIT 200').all(id) as {
      at: number;
      actor_name: string;
      action: string;
      revision: number | null;
      version_id: string | null;
      note: string;
    }[]
  ).map((e) => ({ at: e.at, actorName: e.actor_name, action: e.action, revision: e.revision, versionId: e.version_id, note: e.note }));
}

function event(id: string, actor: AuditActor, action: string, extra: { revision?: number | null; versionId?: string | null; note?: string } = {}): void {
  getDb()
    .prepare('INSERT INTO story_scenario_events (scenario_id, at, actor_id, actor_name, action, revision, version_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, Date.now(), actor.id, actor.name, action, extra.revision ?? null, extra.versionId ?? null, (extra.note ?? '').slice(0, 1000));
  writeAudit(actor, `scenario.${action}`, 'scenario', id, { revision: extra.revision ?? null, versionId: extra.versionId ?? null, note: extra.note ?? '' });
}

function summaryOf(r: ScenarioRow): ScenarioSummary {
  const rev = (getDb().prepare('SELECT revision, updated_at, updated_by FROM story_scenario_drafts WHERE scenario_id = ?').get(r.id) as
    | { revision: number; updated_at: number; updated_by: string | null }
    | undefined) ?? { revision: 0, updated_at: r.updated_at, updated_by: r.updated_by };
  const cur = r.current_version_id
    ? (getDb().prepare('SELECT version_no FROM story_scenario_versions WHERE id = ?').get(r.current_version_id) as { version_no: number } | undefined)
    : undefined;
  return {
    id: r.id,
    title: r.title,
    categoryId: r.category_id,
    status: r.status,
    contentSource: r.content_source,
    currentVersionNo: cur?.version_no ?? null,
    draftRevision: rev.revision,
    updatedAt: rev.updated_at,
    updatedBy: staffName(rev.updated_by),
  };
}

export function listScenarios(opts: { status?: ScenarioStatus; categoryId?: string } = {}): ScenarioSummary[] {
  const where: string[] = [];
  const args: unknown[] = [];
  if (opts.status) {
    where.push('status = ?');
    args.push(opts.status);
  }
  if (opts.categoryId) {
    where.push('category_id = ?');
    args.push(opts.categoryId);
  }
  const rows = getDb().prepare(`SELECT * FROM story_scenarios ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC`).all(...args) as ScenarioRow[];
  return rows.map(summaryOf);
}

export function getScenario(id: string): ScenarioDetail {
  const r = row(id);
  const d = draftOf(id);
  return {
    ...summaryOf(r),
    content: d.content,
    issues: validateScenario(d.content, validationContext()),
    anonymization: { status: r.anonymization_status, by: staffName(r.anonymization_by), at: r.anonymization_at, note: r.anonymization_note },
    submittedBy: staffName(r.submitted_by),
    submittedAt: r.submitted_at,
    submittedRevision: r.submitted_revision,
    reviewNote: r.review_note,
    createdAt: r.created_at,
    createdBy: staffName(r.created_by),
    versions: versionsOf(id),
    events: eventsOf(id),
  };
}

// ------------------------------------------------------------------ authoring

export function blankContent(categoryId: string, title: string, contentSource: ContentSource): ScenarioContent {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    categoryId,
    difficulty: 1,
    locales: ['id'],
    initialMood: 25,
    contentSource,
    presentation: {
      customerCharacterId: 'builtin:char:bu-rina',
      officerCharacterId: 'builtin:char:miss-raksa',
      moodExpressions: { sangat_kecewa: 'kesal', kecewa: 'cemas', ragu: 'bingung', tenang: 'lega', senang: 'senang' },
      bgmAssetId: null,
    },
    cast: [],
    intro: [],
    rounds: [],
    endings: [],
    authorNotes: '',
    text: { id: { [textKey.title()]: title } },
  };
}

const titleOf = (c: ScenarioContent) => contentText(c, 'id', textKey.title()).slice(0, 120) || 'Tanpa judul';

/** Ids a server-side caller may fix for a seeded scenario (createScenario `opts.id`); generated ids are `sc_` + 12 uuid characters. */
const FIXED_SCENARIO_ID = /^sc_[a-z0-9][a-z0-9_-]{2,39}$/;

export function scenarioExists(id: string): boolean {
  return !!getDb().prepare('SELECT 1 FROM story_scenarios WHERE id = ?').get(id);
}

/**
 * `opts.id` fixes the scenario id (seeded scenarios: a stable id makes publication idempotent). It is a separate
 * argument on purpose: `input` comes from request bodies, and a request must never choose an id.
 */
export function createScenario(
  input: { categoryId: unknown; title: unknown; contentSource: unknown; content?: unknown },
  actor: AuditActor,
  opts: { id?: string } = {},
): ScenarioDetail {
  if (opts.id !== undefined) {
    if (!FIXED_SCENARIO_ID.test(opts.id)) throw new ScenarioError('ID skenario tidak valid.');
    if (scenarioExists(opts.id)) throw new ScenarioError('Skenario dengan ID itu sudah ada.', 409);
  }
  const cats = listCategories();
  const categoryId = typeof input.categoryId === 'string' ? input.categoryId : '';
  if (!cats.some((c) => c.id === categoryId)) throw new ScenarioError('Kategori tidak dikenal.');
  const contentSource: ContentSource = input.contentSource === 'demo' ? 'demo' : 'settled_case';
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 80) : '';
  if (!title) throw new ScenarioError('Judul skenario wajib diisi.');
  const fromRaw = input.content === undefined ? null : sanitizeScenarioContent(input.content);
  if (input.content !== undefined && !fromRaw) throw new ScenarioError('Isi skenario tidak dapat dibaca.');
  const content = fromRaw ? { ...fromRaw, categoryId, contentSource } : blankContent(categoryId, title, contentSource);
  const id = opts.id ?? `sc_${randomUUID().slice(0, 12)}`;
  const now = Date.now();
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO story_scenarios (id, category_id, status, title, content_source, anonymization_status, created_at, created_by, updated_at, updated_by)
       VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, categoryId, titleOf(content), contentSource, contentSource === 'demo' ? 'not_required_demo' : 'pending', now, actor.id, now, actor.id);
    const json = JSON.stringify(content);
    db.prepare('INSERT INTO story_scenario_drafts (scenario_id, revision, content_json, updated_at, updated_by) VALUES (?, 1, ?, ?, ?)').run(id, json, now, actor.id);
    db.prepare('INSERT INTO story_scenario_revisions (scenario_id, revision, content_json, saved_at, saved_by) VALUES (?, 1, ?, ?, ?)').run(id, json, now, actor.id);
    event(id, actor, 'create', { revision: 1, note: contentSource === 'demo' ? 'Konten DEMO (sintetis)' : '' });
  })();
  return getScenario(id);
}

/**
 * Save a new draft revision. Allowed in `draft` and `published` (editing a published scenario returns it to draft;
 * the published version stays live until a newer one is published). Locked while `in_review` and when `archived`.
 */
export function saveDraft(id: string, raw: unknown, expectedRevision: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status === 'in_review') throw new ScenarioError('Skenario sedang direview dan terkunci. Minta reviewer mengembalikannya ke draf untuk mengubah.', 409);
  if (r.status === 'archived') throw new ScenarioError('Skenario sudah diarsipkan.', 409);
  const content = sanitizeScenarioContent(raw);
  if (!content) throw new ScenarioError('Isi skenario tidak dapat dibaca.');
  if (content.categoryId !== r.category_id && !listCategories().some((c) => c.id === content.categoryId)) throw new ScenarioError('Kategori tidak dikenal.');
  // The content source is fixed at creation: demo material can never be relabeled as a settled case by editing.
  content.contentSource = r.content_source;
  const d = draftOf(id);
  if (expectedRevision !== d.revision) throw new ScenarioError(`Draf sudah berubah (revisi ${d.revision}). Muat ulang sebelum menyimpan.`, 409);
  const next = d.revision + 1;
  const now = Date.now();
  const json = JSON.stringify(content);
  const db = getDb();
  db.transaction(() => {
    db.prepare('UPDATE story_scenario_drafts SET revision = ?, content_json = ?, updated_at = ?, updated_by = ? WHERE scenario_id = ?').run(next, json, now, actor.id, id);
    db.prepare('INSERT INTO story_scenario_revisions (scenario_id, revision, content_json, saved_at, saved_by) VALUES (?, ?, ?, ?, ?)').run(id, next, json, now, actor.id);
    // Any content change invalidates an earlier anonymization check of a settled case.
    const anon = r.content_source === 'demo' ? 'not_required_demo' : 'pending';
    db.prepare(
      `UPDATE story_scenarios SET status = 'draft', title = ?, category_id = ?, anonymization_status = ?, anonymization_by = NULL, anonymization_at = NULL,
       updated_at = ?, updated_by = ? WHERE id = ?`,
    ).run(titleOf(content), content.categoryId, anon, now, actor.id, id);
    event(id, actor, 'save', { revision: next });
  })();
  return getScenario(id);
}

export function listRevisions(id: string): RevisionRow[] {
  row(id);
  return (getDb().prepare('SELECT revision, saved_at, saved_by FROM story_scenario_revisions WHERE scenario_id = ? ORDER BY revision DESC').all(id) as {
    revision: number;
    saved_at: number;
    saved_by: string | null;
  }[]).map((r) => ({ revision: r.revision, savedAt: r.saved_at, savedBy: staffName(r.saved_by) }));
}

export function getRevision(id: string, revision: number): ScenarioContent {
  const r = getDb().prepare('SELECT content_json FROM story_scenario_revisions WHERE scenario_id = ? AND revision = ?').get(id, revision) as { content_json: string } | undefined;
  if (!r) throw new ScenarioError('Revisi tidak ditemukan.', 404);
  const c = sanitizeScenarioContent(JSON.parse(r.content_json));
  if (!c) throw new ScenarioError('Revisi rusak.', 500);
  return c;
}

export function submitForReview(id: string, note: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status !== 'draft') throw new ScenarioError('Hanya draf yang bisa diajukan untuk direview.', 409);
  const d = draftOf(id);
  const issues = validateScenario(d.content, validationContext());
  if (hasErrors(issues)) throw new ScenarioError('Skenario belum lengkap. Perbaiki kesalahan di bawah sebelum mengajukan review.', 422, issues);
  const now = Date.now();
  getDb()
    .prepare(`UPDATE story_scenarios SET status = 'in_review', submitted_by = ?, submitted_at = ?, submitted_revision = ?, review_note = '', updated_at = ?, updated_by = ? WHERE id = ?`)
    .run(actor.id, now, d.revision, now, actor.id, id);
  event(id, actor, 'submit', { revision: d.revision, note: typeof note === 'string' ? note : '' });
  return getScenario(id);
}

export function returnToDraft(id: string, note: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status !== 'in_review') throw new ScenarioError('Hanya skenario yang sedang direview yang bisa dikembalikan.', 409);
  const text = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  if (!text) throw new ScenarioError('Tulis catatan untuk penulis: apa yang perlu diperbaiki.');
  getDb().prepare(`UPDATE story_scenarios SET status = 'draft', review_note = ?, updated_at = ?, updated_by = ? WHERE id = ?`).run(text, Date.now(), actor.id, id);
  event(id, actor, 'return', { revision: r.submitted_revision, note: text });
  return getScenario(id);
}

/** Reviewer records that the submitted revision of a settled case was checked for anonymization (FR-E6). */
export function recordAnonymizationCheck(id: string, note: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.content_source === 'demo') throw new ScenarioError('Konten demo tidak memerlukan pemeriksaan anonimisasi kasus.');
  if (r.status !== 'in_review') throw new ScenarioError('Pemeriksaan anonimisasi dilakukan saat skenario direview.', 409);
  // Four-eyes like publication: whoever submitted or last edited the draft cannot attest its anonymization.
  if (actor.id && (actor.id === r.submitted_by || actor.id === draftOf(id).updatedBy)) {
    throw new ScenarioError('Pemeriksa anonimisasi harus orang lain, bukan yang mengajukan atau menyunting skenario (prinsip empat mata).', 403);
  }
  const text = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  if (!text) throw new ScenarioError('Tulis bukti pemeriksaan: apa yang disamarkan dan siapa sumber persetujuannya.');
  const now = Date.now();
  getDb()
    .prepare(`UPDATE story_scenarios SET anonymization_status = 'checked', anonymization_by = ?, anonymization_at = ?, anonymization_note = ?, updated_at = ? WHERE id = ?`)
    .run(actor.id, now, text, now, id);
  event(id, actor, 'anonymization_checked', { revision: r.submitted_revision, note: text });
  return getScenario(id);
}

export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v as Record<string, unknown>).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson((v as Record<string, unknown>)[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

export function publish(id: string, note: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status !== 'in_review' || r.submitted_revision === null) throw new ScenarioError('Hanya skenario yang sedang direview yang bisa diterbitkan.', 409);
  const d = draftOf(id);
  if (d.revision !== r.submitted_revision) throw new ScenarioError('Draf berubah sejak diajukan. Kembalikan ke draf lalu ajukan ulang.', 409);
  if (actor.id && (actor.id === r.submitted_by || actor.id === d.updatedBy)) {
    throw new ScenarioError('Reviewer tidak boleh menerbitkan skenario yang ia ajukan atau sunting sendiri (prinsip empat mata).', 403);
  }
  if (r.content_source === 'settled_case' && r.anonymization_status !== 'checked') {
    throw new ScenarioError('Kasus nyata wajib diperiksa anonimisasinya oleh reviewer sebelum terbit (FR-E6).', 422);
  }
  const issues = validateScenario(d.content, validationContext());
  if (hasErrors(issues)) throw new ScenarioError('Skenario tidak lolos validasi terbit.', 422, issues);
  const db = getDb();
  const prev = db.prepare('SELECT MAX(version_no) AS n FROM story_scenario_versions WHERE scenario_id = ?').get(id) as { n: number | null };
  const versionNo = (prev.n ?? 0) + 1;
  const versionId = `sv_${randomUUID().slice(0, 12)}`;
  const json = canonicalJson(d.content);
  const hash = createHash('sha256').update(json).digest('hex');
  const now = Date.now();
  const anonymization = {
    contentSource: r.content_source,
    status: r.anonymization_status,
    checkedBy: r.anonymization_by,
    checkedAt: r.anonymization_at,
    note: r.anonymization_note,
  };
  const reviewNote = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  db.transaction(() => {
    if (r.current_version_id) db.prepare(`UPDATE story_scenario_versions SET status = 'superseded' WHERE id = ? AND status = 'published'`).run(r.current_version_id);
    db.prepare(
      `INSERT INTO story_scenario_versions (id, scenario_id, version_no, content_json, content_hash, title, category_id, content_kind, from_revision, submitted_by, reviewed_by, published_at, review_note, anonymization_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
    ).run(
      versionId,
      id,
      versionNo,
      json,
      hash,
      titleOf(d.content),
      d.content.categoryId,
      r.content_source === 'demo' ? 'demo' : 'official',
      d.revision,
      r.submitted_by,
      actor.id ?? actor.name,
      now,
      reviewNote,
      JSON.stringify(anonymization),
    );
    db.prepare(`UPDATE story_scenarios SET status = 'published', current_version_id = ?, review_note = ?, updated_at = ?, updated_by = ? WHERE id = ?`).run(versionId, reviewNote, now, actor.id, id);
    event(id, actor, 'publish', { revision: d.revision, versionId, note: reviewNote });
  })();
  return getScenario(id);
}

/** Archive: no new rooms; running rooms and historical results are unaffected (they hold their own frozen copy). */
export function archive(id: string, reason: unknown, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status === 'archived') throw new ScenarioError('Skenario sudah diarsipkan.', 409);
  const text = typeof reason === 'string' ? reason.trim().slice(0, 1000) : '';
  const now = Date.now();
  const db = getDb();
  db.transaction(() => {
    if (r.current_version_id) {
      db.prepare(`UPDATE story_scenario_versions SET status = 'withdrawn', withdrawn_at = ?, withdrawn_by = ?, withdrawn_reason = ? WHERE id = ? AND status = 'published'`).run(
        now,
        actor.id ?? actor.name,
        text || 'Skenario diarsipkan',
        r.current_version_id,
      );
    }
    db.prepare(`UPDATE story_scenarios SET status = 'archived', current_version_id = NULL, updated_at = ?, updated_by = ? WHERE id = ?`).run(now, actor.id, id);
    event(id, actor, 'archive', { versionId: r.current_version_id, note: text });
  })();
  return getScenario(id);
}

export function unarchive(id: string, actor: AuditActor): ScenarioDetail {
  const r = row(id);
  if (r.status !== 'archived') throw new ScenarioError('Skenario tidak sedang diarsipkan.', 409);
  getDb().prepare(`UPDATE story_scenarios SET status = 'draft', updated_at = ?, updated_by = ? WHERE id = ?`).run(Date.now(), actor.id, id);
  event(id, actor, 'unarchive');
  return getScenario(id);
}

/** Withdraw one published version (e.g. a content error was found). It can no longer start rooms. */
export function withdrawVersion(versionId: string, reason: unknown, actor: AuditActor): VersionView {
  const db = getDb();
  const v = db.prepare('SELECT * FROM story_scenario_versions WHERE id = ?').get(versionId) as VersionRow | undefined;
  if (!v) throw new ScenarioError('Versi tidak ditemukan.', 404);
  if (v.status === 'withdrawn') throw new ScenarioError('Versi sudah ditarik.', 409);
  const text = typeof reason === 'string' ? reason.trim().slice(0, 1000) : '';
  if (!text) throw new ScenarioError('Tulis alasan penarikan versi.');
  const now = Date.now();
  db.transaction(() => {
    db.prepare(`UPDATE story_scenario_versions SET status = 'withdrawn', withdrawn_at = ?, withdrawn_by = ?, withdrawn_reason = ? WHERE id = ?`).run(now, actor.id ?? actor.name, text, versionId);
    db.prepare(`UPDATE story_scenarios SET current_version_id = NULL, status = CASE WHEN status = 'published' THEN 'draft' ELSE status END, updated_at = ? WHERE id = ? AND current_version_id = ?`).run(
      now,
      v.scenario_id,
      versionId,
    );
    event(v.scenario_id, actor, 'withdraw', { versionId, note: text });
  })();
  return versionView(db.prepare('SELECT * FROM story_scenario_versions WHERE id = ?').get(versionId) as VersionRow);
}

export interface PlayableVersion {
  version: VersionView;
  content: ScenarioContent;
  categoryName: string;
}

/**
 * The version a host may start a NEW room with: the scenario's current version, still `published`, in an ACTIVE
 * category (FR-A1, appendix A "Skenario yang berstatus draft tidak dapat dipilih saat host membuat room").
 */
export function playableVersionForScenario(scenarioId: string): PlayableVersion {
  const db = getDb();
  const r = row(scenarioId);
  if (r.status === 'archived' || !r.current_version_id) throw new ScenarioError('Skenario ini belum punya versi terbit yang aktif.', 409);
  const v = db.prepare('SELECT * FROM story_scenario_versions WHERE id = ?').get(r.current_version_id) as VersionRow | undefined;
  if (!v || v.status !== 'published') throw new ScenarioError('Versi skenario ini sudah ditarik.', 409);
  const cat = listCategories().find((c) => c.id === v.category_id);
  if (!cat || !cat.active) throw new ScenarioError('Kategori skenario ini tidak aktif.', 409);
  const content = sanitizeScenarioContent(JSON.parse(v.content_json));
  if (!content) throw new ScenarioError('Isi versi rusak.', 500);
  return { version: versionView(v), content, categoryName: cat.name };
}

/** Metadata only (no rounds/keys) for the host's scenario picker. */
export function listPlayableForHost(): HostScenarioOption[] {
  const out: HostScenarioOption[] = [];
  // A scenario being edited again (working copy back in `draft`/`in_review`) keeps its live version playable.
  const ids = getDb().prepare(`SELECT id FROM story_scenarios WHERE current_version_id IS NOT NULL AND status != 'archived' ORDER BY title`).all() as { id: string }[];
  for (const s of ids) {
    try {
      const p = playableVersionForScenario(s.id);
      out.push({
        scenarioId: s.id,
        versionId: p.version.id,
        versionNo: p.version.versionNo,
        title: p.version.title,
        categoryName: p.categoryName,
        contentKind: p.version.contentKind,
        synopsis: contentText(p.content, 'id', textKey.synopsis()),
        difficulty: p.content.difficulty,
        publishedAt: p.version.publishedAt,
      });
    } catch {
      // Not playable (e.g. inactive category): simply not offered to hosts.
    }
  }
  return out;
}

export function getVersionContent(versionId: string): { version: VersionView; content: ScenarioContent } {
  const v = getDb().prepare('SELECT * FROM story_scenario_versions WHERE id = ?').get(versionId) as VersionRow | undefined;
  if (!v) throw new ScenarioError('Versi tidak ditemukan.', 404);
  const content = sanitizeScenarioContent(JSON.parse(v.content_json));
  if (!content) throw new ScenarioError('Isi versi rusak.', 500);
  return { version: versionView(v), content };
}
