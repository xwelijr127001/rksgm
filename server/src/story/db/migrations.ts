/**
 * Ordered, transactional schema migrations for the PRD v0.2 Story Room system.
 *
 * - Applied versions are recorded in `schema_migrations`; each migration runs once inside a transaction.
 * - Legacy tables (`matches`, `match_players`, `match_rounds`, `soal_kustom`) are created by ../../db.ts and are never
 *   altered here, so historical quiz results keep their original 1000+300 score interpretation.
 * - New tables are prefixed `story_`, `staff_` or `audit_`.
 */
import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  up(db: Database.Database, now: number): void;
}

/** Built-in assets: the project's pixel locations and characters, rendered by client code (no uploaded file). */
const BUILTIN_ASSETS: { id: string; kind: string; title: string; expressions: string[]; note: string }[] = [
  { id: 'builtin:bg:meja', kind: 'background', title: 'Ruang layanan Raksa — meja', expressions: [], note: 'Panggung piksel lokasi "meja".' },
  { id: 'builtin:bg:parkiran', kind: 'background', title: 'Parkiran — lokasi kejadian', expressions: [], note: 'Panggung piksel lokasi "parkiran".' },
  { id: 'builtin:bg:telepon', kind: 'background', title: 'Ruang layanan — panggilan telepon', expressions: [], note: 'Panggung piksel lokasi "telepon" (kursi tamu kosong).' },
  {
    id: 'builtin:char:bu-rina',
    kind: 'character',
    title: 'Bu Rina (customer, piksel)',
    expressions: ['netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum'],
    note: 'Tokoh fiktif; atlas piksel di client/src/cerita/seni/piksel/bu-rina.png.',
  },
  {
    id: 'builtin:char:miss-raksa',
    kind: 'character',
    title: 'Miss Raksa (petugas, piksel)',
    expressions: ['netral', 'tersenyum', 'serius', 'cemas'],
    note: 'Atlas piksel di client/src/cerita/seni/piksel/miss-raksa.png.',
  },
  { id: 'builtin:bgm:lobby', kind: 'bgm', title: 'Raksa Lobby (musik tunggu)', expressions: [], note: 'client/public/audio/lobby.mp3' },
  { id: 'builtin:bgm:gameplay', kind: 'bgm', title: 'Raksa Gameplay', expressions: [], note: 'client/public/audio/gameplay.mp3' },
];

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'story-room-mvp',
    up(db, now) {
      db.exec(`
        CREATE TABLE staff_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE COLLATE NOCASE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          created_by TEXT,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE staff_roles (
          user_id TEXT NOT NULL REFERENCES staff_users(id),
          role TEXT NOT NULL,
          granted_at INTEGER NOT NULL,
          granted_by TEXT,
          PRIMARY KEY (user_id, role)
        );
        CREATE TABLE staff_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES staff_users(id),
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          last_seen_at INTEGER NOT NULL
        );
        CREATE TABLE audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          at INTEGER NOT NULL,
          actor_id TEXT,
          actor_name TEXT NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT NOT NULL DEFAULT '',
          target_id TEXT NOT NULL DEFAULT '',
          detail_json TEXT NOT NULL DEFAULT '{}'
        );
        CREATE INDEX audit_log_at ON audit_log(at);

        CREATE TABLE story_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 0,
          sort INTEGER NOT NULL DEFAULT 0,
          note TEXT NOT NULL DEFAULT '',
          updated_at INTEGER NOT NULL,
          updated_by TEXT
        );

        CREATE TABLE story_assets (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          collection TEXT NOT NULL DEFAULT '',
          builtin INTEGER NOT NULL DEFAULT 0,
          file_name TEXT,
          mime TEXT,
          size_bytes INTEGER,
          expressions_json TEXT NOT NULL DEFAULT '[]',
          source TEXT NOT NULL DEFAULT '',
          license TEXT NOT NULL DEFAULT '',
          rights_holder TEXT NOT NULL DEFAULT '',
          usage_notes TEXT NOT NULL DEFAULT '',
          archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          created_by TEXT,
          updated_at INTEGER NOT NULL,
          updated_by TEXT
        );
        CREATE TABLE story_asset_variants (
          asset_id TEXT NOT NULL REFERENCES story_assets(id),
          variant TEXT NOT NULL,
          file_name TEXT NOT NULL,
          mime TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          PRIMARY KEY (asset_id, variant)
        );

        CREATE TABLE story_scenarios (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          status TEXT NOT NULL,
          title TEXT NOT NULL,
          content_source TEXT NOT NULL,
          current_version_id TEXT,
          anonymization_status TEXT NOT NULL DEFAULT 'pending',
          anonymization_by TEXT,
          anonymization_at INTEGER,
          anonymization_note TEXT NOT NULL DEFAULT '',
          submitted_by TEXT,
          submitted_at INTEGER,
          submitted_revision INTEGER,
          review_note TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          created_by TEXT,
          updated_at INTEGER NOT NULL,
          updated_by TEXT
        );
        CREATE TABLE story_scenario_drafts (
          scenario_id TEXT PRIMARY KEY REFERENCES story_scenarios(id),
          revision INTEGER NOT NULL,
          content_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          updated_by TEXT
        );
        CREATE TABLE story_scenario_revisions (
          scenario_id TEXT NOT NULL REFERENCES story_scenarios(id),
          revision INTEGER NOT NULL,
          content_json TEXT NOT NULL,
          saved_at INTEGER NOT NULL,
          saved_by TEXT,
          PRIMARY KEY (scenario_id, revision)
        );
        CREATE TABLE story_scenario_versions (
          id TEXT PRIMARY KEY,
          scenario_id TEXT NOT NULL REFERENCES story_scenarios(id),
          version_no INTEGER NOT NULL,
          content_json TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          content_kind TEXT NOT NULL,
          from_revision INTEGER NOT NULL,
          submitted_by TEXT,
          reviewed_by TEXT NOT NULL,
          published_at INTEGER NOT NULL,
          review_note TEXT NOT NULL DEFAULT '',
          anonymization_json TEXT NOT NULL DEFAULT '{}',
          status TEXT NOT NULL,
          withdrawn_at INTEGER,
          withdrawn_by TEXT,
          withdrawn_reason TEXT NOT NULL DEFAULT '',
          UNIQUE (scenario_id, version_no)
        );
        CREATE TABLE story_scenario_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scenario_id TEXT NOT NULL,
          at INTEGER NOT NULL,
          actor_id TEXT,
          actor_name TEXT NOT NULL,
          action TEXT NOT NULL,
          revision INTEGER,
          version_id TEXT,
          note TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX story_scenario_events_scenario ON story_scenario_events(scenario_id, at);

        CREATE TABLE story_periods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          starts_at INTEGER NOT NULL,
          ends_at INTEGER NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          created_by TEXT,
          updated_at INTEGER NOT NULL,
          updated_by TEXT
        );

        CREATE TABLE story_rooms (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          scenario_id TEXT NOT NULL,
          version_id TEXT NOT NULL,
          version_no INTEGER NOT NULL,
          content_hash TEXT NOT NULL,
          scenario_title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          content_kind TEXT NOT NULL,
          score_policy_id TEXT NOT NULL,
          answer_window_ms INTEGER NOT NULL,
          status TEXT NOT NULL,
          closed_reason TEXT,
          host_user_id TEXT NOT NULL,
          host_name TEXT NOT NULL,
          max_participants INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          started_at INTEGER,
          finished_at INTEGER
        );
        CREATE INDEX story_rooms_started ON story_rooms(started_at);
        CREATE TABLE story_participants (
          room_id TEXT NOT NULL REFERENCES story_rooms(id),
          participant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          credential_hash TEXT NOT NULL,
          joined_at INTEGER NOT NULL,
          removed_at INTEGER,
          completed INTEGER NOT NULL DEFAULT 0,
          final_rank INTEGER,
          rank_tied INTEGER,
          total_score INTEGER NOT NULL DEFAULT 0,
          accuracy_points INTEGER NOT NULL DEFAULT 0,
          speed_points INTEGER NOT NULL DEFAULT 0,
          answered_count INTEGER NOT NULL DEFAULT 0,
          timeout_count INTEGER NOT NULL DEFAULT 0,
          final_mood INTEGER,
          ending_id TEXT,
          ending_kind TEXT,
          summary_json TEXT,
          PRIMARY KEY (room_id, participant_id)
        );
        CREATE TABLE story_room_rounds (
          room_id TEXT NOT NULL REFERENCES story_rooms(id),
          round_index INTEGER NOT NULL,
          round_id TEXT NOT NULL,
          scene_started_at INTEGER NOT NULL,
          answering_started_at INTEGER NOT NULL,
          deadline_at INTEGER NOT NULL,
          closed_at INTEGER NOT NULL,
          close_reason TEXT NOT NULL,
          eligible_count INTEGER NOT NULL,
          answered_count INTEGER NOT NULL,
          PRIMARY KEY (room_id, round_index)
        );
        CREATE TABLE story_decisions (
          room_id TEXT NOT NULL REFERENCES story_rooms(id),
          participant_id TEXT NOT NULL,
          round_index INTEGER NOT NULL,
          round_id TEXT NOT NULL,
          choice_id TEXT,
          outcome TEXT NOT NULL,
          accuracy REAL NOT NULL,
          received_at INTEGER,
          elapsed_ms INTEGER,
          accuracy_points INTEGER NOT NULL,
          speed_points INTEGER NOT NULL,
          round_score INTEGER NOT NULL,
          mood_before INTEGER NOT NULL,
          mood_after INTEGER NOT NULL,
          score_policy_id TEXT NOT NULL,
          PRIMARY KEY (room_id, participant_id, round_index)
        );
      `);
      const cat = db.prepare('INSERT INTO story_categories (id, name, active, sort, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      cat.run('auto', 'Auto', 1, 1, 'Kategori MVP (PRD DL #8).', now);
      cat.run('hvc', 'HVC', 0, 2, 'Tahap 2 (PRD FR-F1). Belum ada konten.', now);
      cat.run('property', 'Properti', 0, 3, 'Tahap 2 (PRD FR-F1). Belum ada konten.', now);
      const asset = db.prepare(
        `INSERT INTO story_assets (id, kind, title, collection, builtin, expressions_json, source, license, rights_holder, usage_notes, created_at, updated_at)
         VALUES (?, ?, ?, 'Bawaan proyek', 1, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const a of BUILTIN_ASSETS) {
        asset.run(
          a.id,
          a.kind,
          a.title,
          JSON.stringify(a.expressions),
          'Dibuat untuk proyek RAKSA GAME (kode sumber repo).',
          'Milik proyek; status HKI menunggu kajian Legal (PRD butir 13).',
          'PT Asuransi Raksa Pratikara (perlu konfirmasi Legal)',
          a.note,
          now,
          now,
        );
      }
    },
  },
];

export function runStoryMigrations(db: Database.Database, now: number = Date.now()): number[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  const done = new Set((db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map((r) => r.version));
  const applied: number[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    db.transaction(() => {
      m.up(db, now);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(m.version, m.name, now);
    })();
    applied.push(m.version);
  }
  return applied;
}

export const LATEST_STORY_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.version;
