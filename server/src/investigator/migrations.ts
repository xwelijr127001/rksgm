/**
 * T-107 (Investigator lengkap, card 4): SQLite schema of the Investigator event board ("Top Investigator hari ini").
 * Same convention as story/db/migrations.ts (numbered, named, each applied once inside a transaction, recorded with its
 * time), but with its OWN bookkeeping table and its own table prefix `inv_`, so the event board never shares a table with
 * the quiz rooms, the story rooms, answers, prizes or staff data. Runs only when RAKSA_INVESTIGATOR_ACARA=on.
 *
 * What is stored: an event (public code, owning staff user, Jakarta day), participants (random alias, HASH of the bearer
 * credential), runs (server-owned stage machine of one case), applied commands (for idempotent retries), one best per
 * participant and case, display credentials (hash) and one-use display pairing codes (hash). No real name, contact
 * detail, free text, IP address or device history is stored anywhere.
 */
import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  up(db: Database.Database): void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'investigator-event-board',
    up(db) {
      db.exec(`
        CREATE TABLE inv_events (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          host_id TEXT NOT NULL,
          day TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          closes_at INTEGER NOT NULL,
          closed_at INTEGER,
          purge_at INTEGER
        );
        CREATE UNIQUE INDEX inv_events_code_open ON inv_events(code) WHERE status = 'open';
        CREATE UNIQUE INDEX inv_events_host_open ON inv_events(host_id) WHERE status = 'open';

        CREATE TABLE inv_participants (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          alias TEXT NOT NULL,
          credential_hash TEXT NOT NULL UNIQUE,
          hidden INTEGER NOT NULL DEFAULT 0,
          started INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          UNIQUE (event_id, alias)
        );
        CREATE INDEX inv_participants_event ON inv_participants(event_id);

        CREATE TABLE inv_runs (
          id TEXT PRIMARY KEY,
          participant_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          case_id TEXT NOT NULL,
          rubric_version INTEGER NOT NULL,
          seq INTEGER NOT NULL DEFAULT 0,
          stage TEXT NOT NULL,
          outcomes_json TEXT NOT NULL DEFAULT '[]',
          verdict_id TEXT,
          message_id TEXT,
          status TEXT NOT NULL,
          score_json TEXT,
          total INTEGER,
          last_command_id TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE UNIQUE INDEX inv_runs_active ON inv_runs(participant_id, case_id) WHERE status = 'active';
        CREATE INDEX inv_runs_event ON inv_runs(event_id);

        CREATE TABLE inv_commands (
          run_id TEXT NOT NULL,
          command_id TEXT NOT NULL,
          digest TEXT NOT NULL,
          ack_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (run_id, command_id)
        );

        CREATE TABLE inv_best (
          participant_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          case_id TEXT NOT NULL,
          total INTEGER NOT NULL,
          run_id TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (participant_id, case_id)
        );
        CREATE INDEX inv_best_event ON inv_best(event_id);

        CREATE TABLE inv_displays (
          credential_hash TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          revoked INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX inv_displays_event ON inv_displays(event_id);

        CREATE TABLE inv_display_codes (
          code_hash TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
      `);
    },
  },
];

export function runInvestigatorMigrations(db: Database.Database, now: number = Date.now()): number[] {
  db.exec('CREATE TABLE IF NOT EXISTS inv_schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  const done = new Set((db.prepare('SELECT version FROM inv_schema_migrations').all() as { version: number }[]).map((r) => r.version));
  const applied: number[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    db.transaction(() => {
      m.up(db);
      db.prepare('INSERT INTO inv_schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(m.version, m.name, now);
    })();
    applied.push(m.version);
  }
  return applied;
}
