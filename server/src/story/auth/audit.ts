/**
 * Append-only audit trail of administrative actions (PRD non-functional "Keamanan": pencatatan aktivitas pada perubahan
 * konten dan hasil kompetisi). Rows are never updated or deleted by the application.
 */
import { getDb } from '../../db';
import type { AuditRow } from '../../../../shared/story/dto';
export type { AuditRow };

export interface AuditActor {
  /** Staff user ID; null for system actions (startup recovery, CLI bootstrap). */
  id: string | null;
  name: string;
}

export const SYSTEM_ACTOR: AuditActor = { id: null, name: 'system' };

export function writeAudit(actor: AuditActor, action: string, targetType: string, targetId: string, detail: Record<string, unknown>): void {
  getDb()
    .prepare('INSERT INTO audit_log (at, actor_id, actor_name, action, target_type, target_id, detail_json) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(Date.now(), actor.id, actor.name, action, targetType, targetId, JSON.stringify(detail));
}

export function listAudit(opts: { limit?: number; action?: string; before?: number } = {}): AuditRow[] {
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? 200), 1), 1000);
  const where: string[] = [];
  const args: unknown[] = [];
  if (opts.action) {
    where.push('action LIKE ?');
    args.push(opts.action.replace(/[%_]/g, '') + '%');
  }
  if (opts.before) {
    where.push('id < ?');
    args.push(opts.before);
  }
  const rows = getDb()
    .prepare(`SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ?`)
    .all(...args, limit) as { id: number; at: number; actor_name: string; action: string; target_type: string; target_id: string; detail_json: string }[];
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    actorName: r.actor_name,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    detail: safeJson(r.detail_json),
  }));
}

function safeJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
