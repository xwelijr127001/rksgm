/**
 * T-028: the seeded scenario "Truk Trailer di Jalan Tol" (Episode 2 solo converted by tools/cerita/ep2-ke-skenario.mts
 * into seed/ep2Trailer.ts) and its publication (seed/publish.ts), on an isolated temp database.
 *
 * Covers: the converter's output as the server sees it (15 rounds x 5 options, the script's key and status changes,
 * accuracy 1 / 0.5 / 0, stable ids, id + en complete, publishable with the real categories and asset library, fresh
 * against the current solo episode), the engine paths (endings by status, the delayed promise flag, timeouts), and the
 * seeding rules: version 1 through the normal lifecycle, reseed = same hash and nothing written (no duplicate audit
 * row), the existing DEMO set untouched, people's work never overridden, a failing seed never throws, and room creation
 * from the seeded scenario next to a DEMO scenario.
 */
// MUST stay the first import (see testing/seedEnv.ts): isolates the database from the real data/.
import { SEED_TEST_DB } from './testing/seedEnv';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { CONTENT_ID_PATTERN, STORY_CHOICE_COUNT, STORY_ROUND_COUNT, textKey, unknownPlaceholders, type ScenarioContent } from '../../../shared/story/content';
import { playThrough } from '../../../shared/story/engine';
import type { StaffIdentity } from '../../../shared/story/roles';
import { scoreDecision, STORY_SCORE_POLICY } from '../../../shared/story/scorePolicy';
import { sanitizeScenarioContent, validateScenario } from '../../../shared/story/validate';
import { REPO_ROOT } from '../config';
import { closeDb, getDb } from '../db';
import type { AuditActor } from './auth/audit';
import {
  archive,
  canonicalJson,
  createScenario,
  getScenario,
  listPlayableForHost,
  listScenarios,
  playableVersionForScenario,
  publish,
  saveDraft,
  ScenarioError,
  scenarioExists,
  submitForReview,
  validationContext,
  withdrawVersion,
} from './content/scenarios';
import { StoryRoomManager } from './runtime/manager';
import { demoBanjirContent } from './seed/demoBanjir';
import { demoBaretContent } from './seed/demoBaret';
import { EP2_TRAILER_CONTENT, ep2TrailerContent } from './seed/ep2Trailer';
import { EP2_TRAILER_SCENARIO_ID, ensureSeedScenario, ensureSeedScenarios, SEED_ACTOR, SEED_SCENARIOS, seedContentHash, seedLogLine, type SeedScenario } from './seed/publish';
import { silentEvents } from './testing/fixtures';

if (!getDb().name.includes('raksa-story-seed-')) throw new Error(`Refusing to run: test would use ${getDb().name}`);
test.after(() => {
  closeDb();
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(SEED_TEST_DB + suffix, { force: true });
});

const AUTHOR: AuditActor = { id: 'st_uji_penulis', name: 'uji.penulis' };
const REVIEWER: AuditActor = { id: 'st_uji_reviewer', name: 'uji.reviewer' };
const EP2 = SEED_SCENARIOS.find((s) => s.id === EP2_TRAILER_SCENARIO_ID)!;
const TITLE = 'Truk Trailer di Jalan Tol';
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const count = (sql: string, ...args: unknown[]) => (getDb().prepare(sql).get(...args) as { n: number }).n;
const auditOf = (id: string) =>
  (getDb().prepare(`SELECT action, actor_id, actor_name FROM audit_log WHERE target_type = 'scenario' AND target_id = ? ORDER BY id`).all(id) as { action: string; actor_id: string | null; actor_name: string }[]).map(
    (a) => `${a.action} by ${a.actor_id ?? '-'}/${a.actor_name}`,
  );
const eventsOf = (id: string) => (getDb().prepare('SELECT action FROM story_scenario_events WHERE scenario_id = ? ORDER BY id').all(id) as { action: string }[]).map((e) => e.action);
/** Everything a (re)seed could write, as one comparable snapshot of the whole database. */
const writes = () => ({
  scenarios: count('SELECT COUNT(*) AS n FROM story_scenarios'),
  revisions: count('SELECT COUNT(*) AS n FROM story_scenario_revisions'),
  versions: count('SELECT COUNT(*) AS n FROM story_scenario_versions'),
  events: count('SELECT COUNT(*) AS n FROM story_scenario_events'),
  audit: count('SELECT COUNT(*) AS n FROM audit_log'),
  lastUpdate: count('SELECT IFNULL(MAX(updated_at), 0) AS n FROM story_scenarios'),
});
/** The two SYNTHETIC demos, published the way `story:dev-setup -- --publish-demo` does (author submits, reviewer publishes). */
function publishDemo(content: ScenarioContent): string {
  const id = createScenario({ categoryId: 'auto', title: content.text.id![textKey.title()]!, contentSource: 'demo', content }, AUTHOR).id;
  submitForReview(id, 'Diajukan oleh identitas uji.', AUTHOR);
  publish(id, 'SIMULASI uji.', REVIEWER);
  return id;
}
/** A seed of its own (other id) carrying the Episode 2 content, optionally changed. */
const seedCopy = (id: string, change?: (c: ScenarioContent) => void): SeedScenario => ({
  ...EP2,
  id,
  content: () => {
    const c = ep2TrailerContent();
    change?.(c);
    return c;
  },
});
const changed = (c: ScenarioContent) => {
  c.text.id![textKey.synopsis()] += ' (isi seed berubah)';
};

// ------------------------------------------------------------------ the converter's output

test('Episode 2 seed: 15 rounds x 5 options, the script key and status changes, accuracy 1 / 0.5 / 0, stable ids, publishable with the real library', () => {
  const c = ep2TrailerContent();
  assert.deepEqual([c.schemaVersion, c.categoryId, c.contentSource, c.difficulty, c.initialMood, c.locales], [2, 'auto', 'demo', 2, 30, ['id', 'en']]);
  assert.deepEqual(Object.keys(c.text), ['id', 'en'], 'id + en only: zh is not converted');
  assert.equal(c.text.id![textKey.title()], TITLE);
  assert.match(c.text.id![textKey.synopsis()]!, /Kasus dari modul klaim; untuk uji acara\.$/);
  assert.equal(c.rounds.length, STORY_ROUND_COUNT);
  assert.deepEqual(c.rounds.map((r) => r.id), Array.from({ length: 15 }, (_, i) => `k${String(i + 1).padStart(2, '0')}`), 'round ids = the 15 numbered decisions; ksim is not a round');
  for (const r of c.rounds) {
    assert.equal(r.choices.length, STORY_CHOICE_COUNT);
    assert.deepEqual(r.choices.map((x) => x.id), ['alt-a', 'alt-b', 'alt-c', 'alt-d', 'alt-e'], `${r.id}: one option per base alternative, no variants`);
    assert.equal(r.choices.filter((x) => x.classification === 'tepat').length, 1, `${r.id}: exactly one recommended option`);
    for (const x of r.choices) {
      assert.equal(x.accuracy, { tepat: 1, kurang_tepat: 0.5, keliru: 0 }[x.classification], `${r.id} ${x.id}`);
      assert.ok(Number.isInteger(x.moodDelta) && Math.abs(x.moodDelta) <= 12, `${r.id} ${x.id}: authored status change`);
    }
    assert.equal(r.timeout.moodDelta, Math.min(...r.choices.map((x) => x.moodDelta)), `${r.id}: timeout = the worst option's status change`);
    assert.ok(r.layout === 'chat' || r.layout === 'dossier', `${r.id}: no stage round`);
    assert.ok(r.layout !== 'dossier' || r.evidence.length >= 1, `${r.id}: a dossier has something to read`);
  }
  // The script's key (one letter per round) and the weight of each recommended option: pinned, a change is a content decision.
  assert.equal(c.rounds.map((r) => r.choices.find((x) => x.classification === 'tepat')!.id.slice(-1)).join(''), 'abcdebdcedabecc');
  assert.deepEqual(c.rounds.map((r) => r.choices.find((x) => x.classification === 'tepat')!.moodDelta), [6, 6, 6, 6, 6, 12, 6, 6, 6, 6, 6, 12, 6, 12, 6]);
  assert.deepEqual(c.rounds.filter((r) => r.keyRound).map((r) => r.id), ['k06', 'k12', 'k14'], 'key rounds = the double-weight decisions');
  assert.deepEqual(c.rounds.filter((r) => r.layout === 'chat').map((r) => r.id), ['k01', 'k03', 'k06', 'k12', 'k13', 'k14', 'k15']);
  // The only flag: the promise of the 20th (K12 A, +4 now), read by K14 (a line only its holder sees, and 12 lower).
  assert.deepEqual(c.rounds.flatMap((r) => r.choices.filter((x) => x.setsFlag).map((x) => [r.id, x.id, x.setsFlag, x.classification, x.moodDelta])), [['k12', 'alt-a', 'janji-20', 'keliru', 4]]);
  assert.deepEqual(c.rounds.flatMap((r) => r.flagEffects.map((e) => [r.id, e.flag, e.moodDelta])), [['k14', 'janji-20', -12]]);
  assert.deepEqual(c.rounds.flatMap((r) => r.lines.filter((l) => l.ifFlag).map((l) => [r.id, l.id, l.speaker, l.ifFlag])), [['k14', 'janji-20-1', 'customer', 'janji-20']]);
  assert.equal(c.rounds[13]!.lines[0]!.ifFlag, 'janji-20', 'the protest comes first, as in the script');
  assert.deepEqual(c.endings, [
    { id: 'puas', kind: 'happy', minMood: 70, maxMood: null, minScore: null, maxScore: null },
    { id: 'catatan', kind: 'with_notes', minMood: 45, maxMood: null, minScore: null, maxScore: null },
    { id: 'kurang', kind: 'unhappy', minMood: null, maxMood: null, minScore: null, maxScore: null },
  ]);
  assert.deepEqual([c.presentation.customerCharacterId, c.presentation.officerCharacterId], [null, 'builtin:char:miss-raksa'], 'no portrait for Pak Hendra (never Bu Rina\'s face)');
  assert.deepEqual(c.cast.map((m) => [m.id, c.text.id![textKey.castName(m.id)]]), [['rudi', 'Mas Rudi'], ['bima', 'Pak Bima'], ['admin', 'Admin Bengkel Mitra']]);
  assert.deepEqual([c.text.id![textKey.customerName()], c.text.id![textKey.officerName()]], ['Pak Hendra', 'Miss Raksa']);
  for (const id of [...c.rounds.flatMap((r) => [r.id, ...r.lines.map((l) => l.id), ...r.evidence.flatMap((e) => [e.id, ...e.rows.map((w) => w.id)])]), ...c.intro.map((l) => l.id)]) {
    assert.match(id, CONTENT_ID_PATTERN);
  }

  // Texts: the same keys in both languages, only the {nama} placeholder, and what a published version stores is this data.
  assert.deepEqual(Object.keys(c.text.en!).sort(), Object.keys(c.text.id!).sort());
  for (const locale of ['id', 'en'] as const) for (const [key, value] of Object.entries(c.text[locale]!)) assert.deepEqual(unknownPlaceholders(value), [], `${locale} ${key}`);
  assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(c))), c, 'stored JSON reloads identically');
  assert.notEqual(ep2TrailerContent(), ep2TrailerContent(), 'callers get their own copy');
  assert.deepEqual(c, EP2_TRAILER_CONTENT);

  // Publication validation with the REAL categories and asset library of a migrated database: no error.
  const issues = validateScenario(c, validationContext());
  assert.deepEqual(issues.filter((i) => i.severity === 'error'), []);
  assert.deepEqual([...new Set(issues.map((i) => i.code))].sort(), ['choice_length_hint', 'choice_long'], 'warnings are authoring hints about option length only');
});

test('Episode 2 seed: best / poor / partial / idle paths reach the script endings; the promise of the 20th costs 12 once, at round 14', () => {
  const c = ep2TrailerContent();
  const first = (kind: string) => (round: ScenarioContent['rounds'][number]) => ({ choiceId: round.choices.find((x) => x.classification === kind)!.id, elapsedMs: 6000 });
  const best = playThrough(c, first('tepat'));
  const poor = playThrough(c, first('keliru'));
  const partial = playThrough(c, first('kurang_tepat'));
  const idle = playThrough(c, () => ({ choiceId: null, elapsedMs: 0 }));
  assert.deepEqual([best.ending.id, best.finalMood, best.totals.totalScore], ['puas', 100, 15 * scoreDecision(1, 6000).roundScore]);
  assert.equal(scoreDecision(1, 6000).roundScore, 940, 'story-70-30-v2: 700 + 300 x (1 - 6/30)');
  assert.deepEqual([poor.ending.id, poor.totals.totalScore, poor.totals.answeredCount], ['kurang', 0, 15]);
  assert.deepEqual([partial.ending.id, partial.finalMood, partial.totals.totalScore], ['kurang', 32, 15 * scoreDecision(0.5, 6000).roundScore], 'kurang options keep the status near its start (30): the script scale');
  assert.deepEqual([idle.ending.id, idle.finalMood, idle.totals.totalScore, idle.totals.timeoutCount], ['kurang', 0, 0, 15]);
  assert.equal(STORY_SCORE_POLICY.id, 'story-70-30-v2');

  // The promise (K12 A): +4 at once; round 14 then begins 12 lower, once. Rounds 1-11 take a kurang option (status stays 30,
  // so nothing is clamped at 100), rounds 13-15 the recommended one.
  const path = (k12: string) => playThrough(c, (round, i) => ({ choiceId: round.id === 'k12' ? k12 : first(i < 11 ? 'kurang_tepat' : 'tepat')(round).choiceId, elapsedMs: 6000 }));
  const promise = path('alt-a');
  const honest = path('alt-b');
  assert.deepEqual(promise.decisions.map((d) => d.delayedDelta), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -12, 0]);
  assert.deepEqual([promise.decisions[11]!.outcome, promise.decisions[11]!.moodDelta, promise.decisions[11]!.score.roundScore], ['keliru', 4, 0]);
  const k14 = promise.decisions[13]!;
  assert.deepEqual([k14.moodCarried, k14.delayedDelta, k14.moodBefore, k14.moodAfter], [40, -12, 28, 40], '30 + 4 + 6, then 12 lower as round 14 begins, then +12 for the recommended reply');
  assert.deepEqual([promise.finalMood, promise.ending.id], [46, 'catatan']);
  assert.deepEqual([honest.finalMood, honest.ending.id, honest.decisions.map((d) => d.delayedDelta).filter(Boolean)], [66, 'catatan', []], 'the honest reply (+12) and no delayed change');
  assert.deepEqual(best.decisions.map((d) => d.delayedDelta).filter(Boolean), [], 'no flag, no delayed change');
  // A middle path lands on "selesai dengan catatan" (45..69): recommended on rounds 1-4 (30 + 24), then kurang (+2 in round 15).
  const middle = playThrough(c, (round, i) => first(i < 4 ? 'tepat' : 'kurang_tepat')(round));
  assert.deepEqual([middle.ending.id, middle.ending.kind, middle.finalMood], ['catatan', 'with_notes', 56]);
});

test('the checked-in seed is what the converter makes from the current solo Episode 2 (tools/cerita/ep2-ke-skenario.mts --cek)', () => {
  // The converter imports client code, so it runs as its own process with the client tsconfig (the server never imports it).
  const run = spawnSync(process.execPath, [require.resolve('tsx/cli'), '--tsconfig', 'client/tsconfig.json', 'tools/cerita/ep2-ke-skenario.mts', '--cek'], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000 });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /Validasi: 0 galat/);
  // The hash printed in the seed file's header is the hash of its data, and the hash a published version gets.
  const header = fs.readFileSync(path.join(REPO_ROOT, 'server', 'src', 'story', 'seed', 'ep2Trailer.ts'), 'utf8');
  const hash = sha256(canonicalJson(EP2_TRAILER_CONTENT));
  assert.ok(header.includes(` *   ${hash}\n`) || header.includes(` *   ${hash}\r\n`), 'header hash');
  assert.equal(seedContentHash(EP2), hash);
});

// ------------------------------------------------------------------ publication

let demoIds: string[] = [];
let demoVersions: unknown[] = [];
const demoState = () => demoIds.map((id) => getScenario(id)).map((s) => [s.title, s.status, s.contentSource, s.currentVersionNo, s.versions.map((v) => [v.versionNo, v.status, v.contentHash, v.contentKind])]);

test('first seed: version 1 through the normal lifecycle with the seed hash; the DEMO set and its versions are untouched', () => {
  demoIds = [publishDemo(demoBaretContent()), publishDemo(demoBanjirContent())];
  demoVersions = demoState();
  assert.equal(listScenarios().length, 2);
  assert.ok(!scenarioExists(EP2_TRAILER_SCENARIO_ID));

  const results = ensureSeedScenarios();
  assert.deepEqual(results, [{ id: EP2_TRAILER_SCENARIO_ID, outcome: 'published', versionNo: 1, contentHash: seedContentHash(EP2), detail: '' }]);
  assert.equal(seedLogLine(results[0]!), '[story] seed sc_ep2_trailer: terbit sebagai versi 1');

  const s = getScenario(EP2_TRAILER_SCENARIO_ID);
  assert.deepEqual([s.title, s.status, s.contentSource, s.categoryId, s.currentVersionNo, s.draftRevision], [TITLE, 'published', 'demo', 'auto', 1, 1]);
  assert.deepEqual(s.content, EP2_TRAILER_CONTENT);
  assert.equal(s.versions.length, 1);
  const v = s.versions[0]!;
  assert.deepEqual([v.versionNo, v.status, v.contentKind, v.contentHash, v.reviewedBy, v.submittedBy, v.fromRevision], [1, 'published', 'demo', sha256(canonicalJson(EP2_TRAILER_CONTENT)), 'seed', null, 1]);
  assert.match(v.reviewNote, /BUKAN persetujuan komite/, 'the review note says what this publication is');
  assert.deepEqual(v.anonymization, { contentSource: 'demo', status: 'not_required_demo', checkedBy: null, checkedAt: null, note: '' });
  // Audit: one row per lifecycle step, attributed to the seed (no staff id), written once.
  assert.deepEqual(auditOf(EP2_TRAILER_SCENARIO_ID), ['scenario.create by -/seed', 'scenario.submit by -/seed', 'scenario.publish by -/seed']);
  assert.deepEqual(eventsOf(EP2_TRAILER_SCENARIO_ID), ['create', 'submit', 'publish']);

  // Existing DEMO set: still two scenarios, same versions and hashes; the host picker now lists three.
  assert.deepEqual(demoState(), demoVersions);
  assert.equal(listScenarios().filter((x) => x.title.startsWith('[DEMO]')).length, 2);
  assert.equal(listScenarios().length, 3);
  const host = listPlayableForHost();
  const demoTitles = [demoBaretContent(), demoBanjirContent()].map((d) => d.text.id![textKey.title()]!);
  assert.deepEqual(host.map((h) => h.title), [TITLE, ...demoTitles], 'ordered by title: the seeded scenario is listed first');
  const option = host.find((h) => h.scenarioId === EP2_TRAILER_SCENARIO_ID)!;
  assert.deepEqual([option.versionNo, option.contentKind, option.categoryName, option.difficulty], [1, 'demo', 'Auto', 2]);
  assert.match(option.synopsis, /untuk uji acara/);
  assert.deepEqual(playableVersionForScenario(EP2_TRAILER_SCENARIO_ID).content, EP2_TRAILER_CONTENT);
});

test('reseed with the same content: same version, same hash, and nothing at all is written (no event, no audit row)', () => {
  const before = writes();
  const auditBefore = auditOf(EP2_TRAILER_SCENARIO_ID);
  for (let i = 0; i < 3; i++) {
    const [r] = ensureSeedScenarios();
    assert.deepEqual(r, { id: EP2_TRAILER_SCENARIO_ID, outcome: 'unchanged', versionNo: 1, contentHash: seedContentHash(EP2), detail: '' });
  }
  assert.deepEqual(writes(), before);
  assert.deepEqual(auditOf(EP2_TRAILER_SCENARIO_ID), auditBefore, 'no duplicate audit row');
  assert.deepEqual(getScenario(EP2_TRAILER_SCENARIO_ID).versions.map((v) => [v.versionNo, v.status, v.contentHash]), [[1, 'published', seedContentHash(EP2)]]);
  assert.deepEqual(demoState(), demoVersions, 'DEMO set as before');
});

test('rooms: a host opens a room from the seeded scenario and from a DEMO scenario; the room pins the seed version and its hash', () => {
  const host: StaffIdentity = { id: 'st_uji_host', username: 'uji.host', displayName: 'UJI Host Room', roles: ['host'] };
  const manager = new StoryRoomManager(silentEvents);
  try {
    const room = manager.create(EP2_TRAILER_SCENARIO_ID, host);
    assert.deepEqual([room.phase, room.version.scenarioId, room.version.versionNo, room.version.contentHash, room.version.contentKind, room.version.title], ['lobby', EP2_TRAILER_SCENARIO_ID, 1, seedContentHash(EP2), 'demo', TITLE]);
    assert.deepEqual(room.content, EP2_TRAILER_CONTENT);
    const label = room.publicState().scenario;
    assert.deepEqual([label.title, label.customerName, label.officerName, label.customerCharacterId, label.contentKind], [TITLE, 'Pak Hendra', 'Miss Raksa', null, 'demo']);
    assert.deepEqual(label.moodLabels, { sangat_kecewa: 'Kecewa', kecewa: 'Cemas', ragu: 'Tenang', tenang: 'Percaya', senang: 'Puas' }, 'the script status words');
    const demoRoom = manager.create(demoIds[0]!, host);
    assert.deepEqual([demoRoom.phase, demoRoom.version.title.startsWith('[DEMO] Baret'), demoRoom.version.contentKind], ['lobby', true, 'demo'], 'demo rooms still open');
    assert.notEqual(room.code, demoRoom.code);
  } finally {
    manager.disposeAll();
  }
});

test('a changed seed publishes the next version only on an untouched scenario; what people did is never overridden', () => {
  // (a) untouched: the next version, the earlier one superseded, the lifecycle rows of one more publication.
  const a = seedCopy('sc_seed_uji_a');
  assert.equal(ensureSeedScenario(a).outcome, 'published');
  const a2 = seedCopy('sc_seed_uji_a', changed);
  assert.notEqual(seedContentHash(a2), seedContentHash(a));
  assert.deepEqual(ensureSeedScenario(a2), { id: 'sc_seed_uji_a', outcome: 'updated', versionNo: 2, contentHash: seedContentHash(a2), detail: '' });
  assert.deepEqual(getScenario('sc_seed_uji_a').versions.map((v) => [v.versionNo, v.status, v.contentHash, v.reviewedBy]), [
    [2, 'published', seedContentHash(a2), 'seed'],
    [1, 'superseded', seedContentHash(a), 'seed'],
  ]);
  assert.deepEqual(eventsOf('sc_seed_uji_a'), ['create', 'submit', 'publish', 'save', 'submit', 'publish']);
  const settled = writes();
  assert.equal(ensureSeedScenario(a2).outcome, 'unchanged');
  assert.deepEqual(writes(), settled);

  // (b) an author is editing the scenario in the CMS: the live seed version is left alone, and a changed seed is not applied.
  const b = seedCopy('sc_seed_uji_b');
  assert.equal(ensureSeedScenario(b).outcome, 'published');
  const edited = ep2TrailerContent();
  edited.text.id![textKey.roundTitle('k01')] = 'Kabar pertama (disunting)';
  saveDraft('sc_seed_uji_b', edited, 1, AUTHOR);
  assert.equal(getScenario('sc_seed_uji_b').status, 'draft');
  let before = writes();
  assert.equal(ensureSeedScenario(b).outcome, 'unchanged', 'the published version still is the seed');
  const skippedEdit = ensureSeedScenario(seedCopy('sc_seed_uji_b', changed));
  assert.deepEqual([skippedEdit.outcome, skippedEdit.versionNo, skippedEdit.detail], ['skipped', 1, 'sedang disunting lewat CMS (status draft)']);
  assert.deepEqual(writes(), before);
  assert.equal(getScenario('sc_seed_uji_b').content.text.id![textKey.roundTitle('k01')], 'Kabar pertama (disunting)', 'the author\'s draft is intact');

  // (c) a reviewer published the edited version: it is theirs now.
  submitForReview('sc_seed_uji_b', 'Diajukan penulis.', AUTHOR);
  publish('sc_seed_uji_b', 'Terbit oleh reviewer.', REVIEWER);
  before = writes();
  for (const seed of [b, seedCopy('sc_seed_uji_b', changed)]) {
    const r = ensureSeedScenario(seed);
    assert.deepEqual([r.outcome, r.versionNo, r.detail], ['skipped', 2, 'versi terbit sekarang bukan dari seed (diubah lewat CMS)']);
  }
  assert.deepEqual(writes(), before);

  // (d) a withdrawn version and (e) an archived scenario stay withdrawn / archived.
  const d = seedCopy('sc_seed_uji_d');
  assert.equal(ensureSeedScenario(d).outcome, 'published');
  withdrawVersion(getScenario('sc_seed_uji_d').versions[0]!.id, 'Ditarik saat uji.', REVIEWER);
  const e = seedCopy('sc_seed_uji_e');
  assert.equal(ensureSeedScenario(e).outcome, 'published');
  archive('sc_seed_uji_e', 'Diarsipkan saat uji.', REVIEWER);
  before = writes();
  assert.deepEqual([ensureSeedScenario(d).outcome, ensureSeedScenario(d).detail], ['skipped', 'tidak punya versi terbit (status draft)']);
  assert.deepEqual([ensureSeedScenario(e).outcome, ensureSeedScenario(e).detail], ['skipped', 'skenario diarsipkan staf']);
  assert.deepEqual(writes(), before);
  assert.throws(() => playableVersionForScenario('sc_seed_uji_d'), ScenarioError);
  assert.match(seedLogLine(ensureSeedScenario(e)), /^\[story\] seed sc_seed_uji_e: DILEWATI: skenario diarsipkan staf$/);
});

test('a seed that cannot be published never throws and leaves nothing behind', () => {
  const before = writes();
  const broken = ensureSeedScenario(seedCopy('sc_seed_uji_rusak', (c) => { c.rounds.pop(); }));
  assert.equal(broken.outcome, 'failed');
  assert.match(broken.detail, /Jumlah babak harus 15/);
  const noCategory = ensureSeedScenario({ ...seedCopy('sc_seed_uji_kategori'), categoryId: 'tidak-ada' });
  assert.deepEqual([noCategory.outcome, noCategory.versionNo, noCategory.detail], ['failed', null, 'Kategori tidak dikenal.']);
  assert.deepEqual(writes(), before, 'the whole first publication is one transaction');
  assert.ok(!scenarioExists('sc_seed_uji_rusak') && !scenarioExists('sc_seed_uji_kategori'));
  assert.match(seedLogLine(noCategory), /GAGAL: Kategori tidak dikenal\./);
});

test('createScenario: only a server-side caller fixes an id; a request body never does', () => {
  const fromRequest = createScenario({ categoryId: 'auto', title: 'Uji id dari permintaan', contentSource: 'demo', id: 'sc_pilihan_klien' } as Parameters<typeof createScenario>[0], AUTHOR);
  assert.match(fromRequest.id, /^sc_[0-9a-f-]{12}$/);
  assert.ok(!scenarioExists('sc_pilihan_klien'));
  assert.throws(() => createScenario({ categoryId: 'auto', title: 'Uji', contentSource: 'demo' }, SEED_ACTOR, { id: 'bukan-id' }), /ID skenario tidak valid/);
  assert.throws(() => createScenario({ categoryId: 'auto', title: 'Uji', contentSource: 'demo' }, SEED_ACTOR, { id: EP2_TRAILER_SCENARIO_ID }), /sudah ada/);
  assert.equal(SEED_ACTOR.id, null);
});
