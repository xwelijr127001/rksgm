/**
 * LOCAL DEVELOPMENT / TEST setup. Refuses to run with NODE_ENV=production.
 *
 *   npm run story:dev-setup                 test identities + the two SYNTHETIC demo scenarios as drafts
 *   npm run story:dev-setup -- --publish-demo   also run submit (uji.penulis) + publish (uji.reviewer): a SIMULATED
 *                                               approval with clearly labeled test identities, NOT committee approval
 *   npm run story:dev-setup -- --period         also create a clearly labeled local test competition period
 *
 * Every run also publishes the seeded scenarios (seed/publish.ts: Episode 2 "Truk Trailer di Jalan Tol"), exactly as a
 * server start does, so a test database has them before its server runs. Idempotent.
 *
 * Test identity passwords are random and written to `<data dir>/dev-staff-credentials.json` (data/ is git-ignored).
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../../config';
import { closeDb } from '../../db';
import type { StaffRole } from '../../../../shared/story/roles';
import type { AuditActor } from '../auth/audit';
import { createStaff, findStaffByUsername } from '../auth/staff';
import { createScenario, getScenario, listScenarios, publish, submitForReview } from '../content/scenarios';
import { createPeriod, listPeriods } from '../reports';
import { demoBanjirContent } from '../seed/demoBanjir';
import { demoBaretContent } from '../seed/demoBaret';
import { ensureSeedScenarios, seedLogLine } from '../seed/publish';

if (process.env.NODE_ENV === 'production') {
  console.error('story:dev-setup tidak boleh dijalankan di production.');
  process.exit(1);
}

export const TEST_IDENTITIES: { username: string; name: string; roles: StaffRole[] }[] = [
  { username: 'uji.admin', name: 'UJI Admin Sistem', roles: ['system_admin'] },
  { username: 'uji.penulis', name: 'UJI Penulis Konten', roles: ['author'] },
  { username: 'uji.reviewer', name: 'UJI Reviewer (bukan komite)', roles: ['reviewer'] },
  { username: 'uji.host', name: 'UJI Host Room', roles: ['host'] },
  { username: 'uji.panitia', name: 'UJI Panitia Kompetisi', roles: ['competition_admin'] },
];

const SETUP: AuditActor = { id: null, name: 'dev-setup' };

function credentialFile(): string {
  return path.join(path.dirname(CONFIG.dbFile), 'dev-staff-credentials.json');
}

function ensureIdentities(): Record<string, string> {
  const file = credentialFile();
  const saved: Record<string, string> = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>) : {};
  for (const t of TEST_IDENTITIES) {
    if (findStaffByUsername(t.username)) continue;
    const password = randomBytes(12).toString('base64url');
    createStaff({ username: t.username, displayName: t.name, password, roles: t.roles }, SETUP);
    saved[t.username] = password;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(saved, null, 2));
  return saved;
}

function actor(username: string): AuditActor {
  const u = findStaffByUsername(username);
  if (!u) throw new Error(`missing ${username}`);
  return { id: u.id, name: u.username };
}

function main(): void {
  ensureIdentities();
  const author = actor('uji.penulis');
  const existing = new Set(listScenarios().map((s) => s.title));
  const ids: string[] = [];
  for (const content of [demoBaretContent(), demoBanjirContent()]) {
    const title = content.text.id!['scenario.title']!;
    if (existing.has(title)) continue;
    ids.push(createScenario({ categoryId: 'auto', title, contentSource: 'demo', content }, author).id);
  }
  console.log(`Identitas uji siap (kata sandi: ${credentialFile()}). Draf demo baru: ${ids.length}.`);
  for (const result of ensureSeedScenarios()) console.log(seedLogLine(result));
  if (process.argv.includes('--publish-demo')) {
    const reviewer = actor('uji.reviewer');
    for (const s of listScenarios()) {
      if (!s.title.startsWith('[DEMO]') || s.currentVersionNo !== null) continue;
      if (s.status === 'draft') submitForReview(s.id, 'Diajukan oleh identitas uji (dev-setup).', author);
      publish(s.id, 'SIMULASI dev-setup oleh identitas uji — BUKAN persetujuan komite gabungan.', reviewer);
      console.log(`Terbit (simulasi): ${getScenario(s.id).title}`);
    }
  }
  if (process.argv.includes('--period') && !listPeriods().some((p) => p.name.startsWith('Periode uji lokal'))) {
    const now = Date.now();
    createPeriod({ name: 'Periode uji lokal (bukan periode resmi)', startsAt: now - 7 * 864e5, endsAt: now + 30 * 864e5, note: 'Dibuat dev-setup.' }, actor('uji.panitia'));
    console.log('Periode uji lokal dibuat.');
  }
}

try {
  main();
} finally {
  closeDb();
}
