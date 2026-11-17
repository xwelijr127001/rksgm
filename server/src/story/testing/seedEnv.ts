/**
 * TEST-ONLY environment for tests that use the scenario lifecycle (SQLite) without the HTTP server, e.g. seed.test.ts.
 * MUST be the first import of such a test: TypeScript import statements are hoisted, so assigning process.env in the
 * test body would run AFTER config.ts had already read the default (the real data/raksa-game.db). Importing this module
 * first guarantees an isolated temp database.
 */
import os from 'node:os';
import path from 'node:path';

export const SEED_TEST_DB = path.join(os.tmpdir(), `raksa-story-seed-${process.pid}-${Date.now()}.db`);

process.env.DB_FILE = SEED_TEST_DB;
process.env.NODE_ENV = 'test';
