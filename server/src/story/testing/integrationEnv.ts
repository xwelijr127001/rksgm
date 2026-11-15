/**
 * TEST-ONLY environment for the Story Room integration test. MUST be the first import of that test: TypeScript import
 * statements are hoisted, so assigning process.env in the test body would run AFTER config.ts had already read the
 * defaults (real port, real data/raksa-game.db). Importing this module first guarantees the isolated temp database.
 */
import os from 'node:os';
import path from 'node:path';

export const STORY_TEST_PORT = 43931;
export const STORY_TEST_DB = path.join(os.tmpdir(), `raksa-story-int-${process.pid}-${Date.now()}.db`);

process.env.PORT = String(STORY_TEST_PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = STORY_TEST_DB;
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${STORY_TEST_PORT}`;
process.env.NODE_ENV = 'test';
process.env.STORY_TEST_TIMING = 'fast';
process.env.STORY_TEST_ANSWER_MS = '1500';
process.env.STORY_MAX_PARTICIPANTS = '4';
process.env.RAKSA_LEGACY = 'off';
process.env.PANITIA_PIN = '';
