/**
 * Internal staff accounts, roles and sessions (PRD FR-E3; ARCHITECTURE.md §6).
 *
 * - Passwords: scrypt (N=16384, r=8, p=1, 64-byte key, 16-byte random salt). Minimum 10 characters.
 * - Sessions: random 32-byte bearer tokens; only their SHA-256 is stored. 12-hour lifetime.
 * - No default accounts and no bypass: the first system admin is provisioned with `npm run staff -- create ...`.
 *   This local mechanism is a stand-in until IT supplies the approved identity system for raksaonline.com.
 */
import { createHash, randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { getDb } from '../../db';
import { isStaffRole, type StaffIdentity, type StaffRole } from '../../../../shared/story/roles';
import { writeAudit, type AuditActor } from './audit';
import type { StaffUserView } from '../../../../shared/story/dto';
export type { StaffUserView };

export const PASSWORD_MIN_LENGTH = 10;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))));
}

/**
 * Asynchronous on purpose: scrypt runs in the libuv thread pool, so login attempts (even a flood of them) never block
 * the event loop that drives live rooms' timers and server-measured answer times.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Burns comparable CPU time for unknown usernames so login timing does not reveal which usernames exist. */
const DUMMY_HASH = hashPassword(randomBytes(12).toString('hex'));

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  if (password.length > 200) return 'Kata sandi terlalu panjang.';
  return null;
}

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  active: number;
  created_at: number;
  updated_at: number;
}

function rolesOf(userId: string): StaffRole[] {
  return (getDb().prepare('SELECT role FROM staff_roles WHERE user_id = ? ORDER BY role').all(userId) as { role: string }[])
    .map((r) => r.role)
    .filter(isStaffRole);
}

function identityOf(row: UserRow): StaffIdentity {
  return { id: row.id, username: row.username, displayName: row.display_name, roles: rolesOf(row.id) };
}

export function listStaff(): StaffUserView[] {
  const rows = getDb().prepare('SELECT * FROM staff_users ORDER BY username').all() as UserRow[];
  return rows.map((r) => ({ ...identityOf(r), active: r.active === 1, createdAt: r.created_at }));
}

export function staffCount(): number {
  return (getDb().prepare('SELECT COUNT(*) AS n FROM staff_users').get() as { n: number }).n;
}

export class StaffError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export function createStaff(
  input: { username: string; displayName: string; password: string; roles: StaffRole[] },
  actor: AuditActor,
): StaffUserView {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) throw new StaffError('Nama pengguna 3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.');
  const displayName = input.displayName.trim().slice(0, 60) || username;
  const problem = passwordProblem(input.password);
  if (problem) throw new StaffError(problem);
  const roles = [...new Set(input.roles)].filter(isStaffRole);
  if (roles.length === 0) throw new StaffError('Pilih minimal satu peran.');
  const db = getDb();
  if (db.prepare('SELECT 1 FROM staff_users WHERE username = ?').get(username)) throw new StaffError('Nama pengguna sudah dipakai.', 409);
  const now = Date.now();
  const id = randomUUID();
  db.transaction(() => {
    db.prepare('INSERT INTO staff_users (id, username, display_name, password_hash, active, created_at, created_by, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)').run(
      id,
      username,
      displayName,
      hashPassword(input.password),
      now,
      actor.id,
      now,
    );
    const ins = db.prepare('INSERT INTO staff_roles (user_id, role, granted_at, granted_by) VALUES (?, ?, ?, ?)');
    for (const r of roles) ins.run(id, r, now, actor.id);
    writeAudit(actor, 'staff.create', 'staff_user', id, { username, roles });
  })();
  return listStaff().find((u) => u.id === id)!;
}

export function setStaffRoles(userId: string, roles: StaffRole[], actor: AuditActor): StaffUserView {
  const db = getDb();
  const user = db.prepare('SELECT * FROM staff_users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) throw new StaffError('Pengguna tidak ditemukan.', 404);
  const next = [...new Set(roles)].filter(isStaffRole);
  if (next.length === 0) throw new StaffError('Pilih minimal satu peran.');
  const before = rolesOf(userId);
  if (actor.id === userId && before.includes('system_admin') && !next.includes('system_admin')) {
    throw new StaffError('Admin sistem tidak bisa mencabut peran admin dari dirinya sendiri.');
  }
  const now = Date.now();
  db.transaction(() => {
    db.prepare('DELETE FROM staff_roles WHERE user_id = ?').run(userId);
    const ins = db.prepare('INSERT INTO staff_roles (user_id, role, granted_at, granted_by) VALUES (?, ?, ?, ?)');
    for (const r of next) ins.run(userId, r, now, actor.id);
    db.prepare('UPDATE staff_users SET updated_at = ? WHERE id = ?').run(now, userId);
    writeAudit(actor, 'staff.roles', 'staff_user', userId, { username: user.username, before, after: next });
  })();
  return listStaff().find((u) => u.id === userId)!;
}

export function setStaffActive(userId: string, active: boolean, actor: AuditActor): StaffUserView {
  const db = getDb();
  const user = db.prepare('SELECT * FROM staff_users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) throw new StaffError('Pengguna tidak ditemukan.', 404);
  if (actor.id === userId && !active) throw new StaffError('Tidak bisa menonaktifkan akun sendiri.');
  db.transaction(() => {
    db.prepare('UPDATE staff_users SET active = ?, updated_at = ? WHERE id = ?').run(active ? 1 : 0, Date.now(), userId);
    if (!active) db.prepare('DELETE FROM staff_sessions WHERE user_id = ?').run(userId);
    writeAudit(actor, active ? 'staff.activate' : 'staff.deactivate', 'staff_user', userId, { username: user.username });
  })();
  return listStaff().find((u) => u.id === userId)!;
}

export function setStaffPassword(userId: string, password: string, actor: AuditActor): void {
  const problem = passwordProblem(password);
  if (problem) throw new StaffError(problem);
  const db = getDb();
  const user = db.prepare('SELECT username FROM staff_users WHERE id = ?').get(userId) as { username: string } | undefined;
  if (!user) throw new StaffError('Pengguna tidak ditemukan.', 404);
  db.transaction(() => {
    db.prepare('UPDATE staff_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hashPassword(password), Date.now(), userId);
    db.prepare('DELETE FROM staff_sessions WHERE user_id = ?').run(userId);
    writeAudit(actor, 'staff.password_reset', 'staff_user', userId, { username: user.username });
  })();
}

export function findStaffByUsername(username: string): StaffUserView | undefined {
  return listStaff().find((u) => u.username === username.trim().toLowerCase());
}

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Returns a session token for valid, active credentials; null otherwise (same timing for unknown users). */
export async function login(username: unknown, password: unknown): Promise<{ token: string; identity: StaffIdentity; expiresAt: number } | null> {
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200 || username.length > 100) return null;
  const row = getDb().prepare('SELECT * FROM staff_users WHERE username = ?').get(username.trim().toLowerCase()) as UserRow | undefined;
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok || row.active !== 1) return null;
  const identity = identityOf(row);
  if (identity.roles.length === 0) return null;
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  getDb().prepare('INSERT INTO staff_sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)').run(tokenHash(token), row.id, now, expiresAt, now);
  writeAudit({ id: row.id, name: row.username }, 'staff.login', 'staff_user', row.id, {});
  return { token, identity, expiresAt };
}

/** Identity behind a bearer token (active user, unexpired session), or null. */
export function authenticate(token: unknown): StaffIdentity | null {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const db = getDb();
  const now = Date.now();
  const row = db
    .prepare(
      `SELECT u.* , s.last_seen_at FROM staff_sessions s JOIN staff_users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(tokenHash(token), now) as (UserRow & { last_seen_at: number }) | undefined;
  if (!row) return null;
  if (now - row.last_seen_at > 60_000) db.prepare('UPDATE staff_sessions SET last_seen_at = ? WHERE token_hash = ?').run(now, tokenHash(token));
  return identityOf(row);
}

export function logout(token: unknown): void {
  if (typeof token !== 'string') return;
  getDb().prepare('DELETE FROM staff_sessions WHERE token_hash = ?').run(tokenHash(token));
}

export function purgeExpiredSessions(): number {
  return getDb().prepare('DELETE FROM staff_sessions WHERE expires_at <= ?').run(Date.now()).changes;
}
