/**
 * Seeded scenarios (T-028): scenario content that ships with the code and that the server publishes itself. Publication
 * goes through the same lifecycle as a CMS scenario (createScenario -> submitForReview -> publish in ../content/scenarios),
 * so a seeded scenario has a normal draft, an immutable version with its SHA-256 content hash, events and audit rows.
 *
 * Idempotent by stable scenario id + content hash (`ensureSeedScenario`):
 *  - no scenario with the id                -> create, submit, publish version 1 in ONE transaction (events and audit
 *                                              rows are written once, here);
 *  - current version has the seed's hash    -> nothing is written: no event, no audit row, no new version;
 *  - current version was published by the seed and the seed content has changed since (a new build)
 *                                           -> the next version, again in one transaction;
 *  - anything a person did to the scenario (a draft being edited, a review in progress, their own published version,
 *    a withdrawn version, an archived scenario) -> left exactly as it is and reported as `skipped`.
 * A failure (e.g. the category was deactivated) is reported as `failed`; it never throws, so a server start is never
 * blocked by a seed.
 *
 * The seed actor has no staff id, so the four-eyes rule (which compares staff ids) does not apply to it. The review
 * note therefore says in plain words that this is an automatic publication and NOT a committee approval. Seeded
 * content keeps `contentSource: 'demo'` (version kind `demo`): hosts see it marked DEMO and competition recaps leave
 * its rooms out by default.
 */
import { createHash } from 'node:crypto';
import { contentText, textKey, type ScenarioContent } from '../../../../shared/story/content';
import { sanitizeScenarioContent } from '../../../../shared/story/validate';
import { getDb } from '../../db';
import type { AuditActor } from '../auth/audit';
import { canonicalJson, createScenario, publish, saveDraft, ScenarioError, scenarioExists, submitForReview } from '../content/scenarios';
import { ep2TrailerContent } from './ep2Trailer';

/** Who seeded content is attributed to in events, audit rows and a version's `reviewed_by` (no staff id). */
export const SEED_ACTOR: AuditActor = { id: null, name: 'seed' };

export interface SeedScenario {
  /** Stable scenario id: never reused for other content, never derived from the title. */
  id: string;
  categoryId: string;
  content: () => ScenarioContent;
  submitNote: string;
  publishNote: string;
}

/** Episode 2 solo "Truk Trailer di Jalan Tol" as a hosted story room scenario (generated: ./ep2Trailer.ts). */
export const EP2_TRAILER_SCENARIO_ID = 'sc_ep2_trailer';

export const SEED_SCENARIOS: readonly SeedScenario[] = [
  {
    id: EP2_TRAILER_SCENARIO_ID,
    categoryId: 'auto',
    content: ep2TrailerContent,
    submitNote: 'Seed server (T-028): konversi otomatis Episode 2 solo "Truk Trailer di Jalan Tol".',
    publishNote: 'Terbit otomatis oleh seed server untuk uji acara. BUKAN persetujuan komite; naskah sumbernya masih draf.',
  },
];

export type SeedOutcome = 'published' | 'updated' | 'unchanged' | 'skipped' | 'failed';

export interface SeedResult {
  id: string;
  outcome: SeedOutcome;
  /** The scenario's current version after the call (null when it has none). */
  versionNo: number | null;
  /** Hash a version of the seed content has (what `unchanged` compares against). */
  contentHash: string;
  /** Why it was skipped or failed; '' otherwise. */
  detail: string;
}

/** The seed content exactly as the lifecycle stores it (sanitized, category and source as createScenario sets them). */
function storedForm(seed: SeedScenario): ScenarioContent {
  const clean = sanitizeScenarioContent(seed.content());
  if (!clean) throw new Error(`Seed ${seed.id}: isi tidak terbaca.`);
  const stored = sanitizeScenarioContent(JSON.parse(JSON.stringify({ ...clean, categoryId: seed.categoryId, contentSource: 'demo' })));
  if (!stored) throw new Error(`Seed ${seed.id}: isi tidak terbaca.`);
  return stored;
}

/** SHA-256 of the canonical JSON of the stored form: the `content_hash` a published version of this seed gets. */
export function seedContentHash(seed: SeedScenario): string {
  return createHash('sha256').update(canonicalJson(storedForm(seed))).digest('hex');
}

interface CurrentRow {
  status: string;
  version_no: number | null;
  content_hash: string | null;
  reviewed_by: string | null;
  version_status: string | null;
  draft_revision: number | null;
  draft_by: string | null;
}

function currentOf(id: string): CurrentRow {
  return getDb()
    .prepare(
      `SELECT s.status, v.version_no, v.content_hash, v.reviewed_by, v.status AS version_status, d.revision AS draft_revision, d.updated_by AS draft_by
       FROM story_scenarios s
       LEFT JOIN story_scenario_versions v ON v.id = s.current_version_id
       LEFT JOIN story_scenario_drafts d ON d.scenario_id = s.id
       WHERE s.id = ?`,
    )
    .get(id) as CurrentRow;
}

const messageOf = (err: unknown): string => {
  const text = err instanceof Error ? err.message : String(err);
  const issues = err instanceof ScenarioError ? err.issues.filter((i) => i.severity === 'error').slice(0, 3).map((i) => i.message) : [];
  return issues.length ? `${text} ${issues.join(' ')}` : text;
};

export function ensureSeedScenario(seed: SeedScenario): SeedResult {
  let hash = '';
  try {
    hash = seedContentHash(seed);
    const db = getDb();
    const done = (outcome: SeedOutcome, detail = ''): SeedResult => ({ id: seed.id, outcome, versionNo: currentOf(seed.id)?.version_no ?? null, contentHash: hash, detail });
    /** Submit and publish the draft that was just written; the version must carry the seed's hash, or nothing is kept. */
    const submitAndPublish = () => {
      submitForReview(seed.id, seed.submitNote, SEED_ACTOR);
      publish(seed.id, seed.publishNote, SEED_ACTOR);
      const published = currentOf(seed.id).content_hash;
      if (published !== hash) throw new Error(`Hash versi terbit (${published}) tidak sama dengan hash seed (${hash}).`);
    };

    if (!scenarioExists(seed.id)) {
      const content = storedForm(seed);
      db.transaction(() => {
        createScenario({ categoryId: seed.categoryId, title: contentText(content, 'id', textKey.title()), contentSource: 'demo', content }, SEED_ACTOR, { id: seed.id });
        submitAndPublish();
      })();
      return done('published');
    }

    const now = currentOf(seed.id);
    if (now.status === 'archived') return done('skipped', 'skenario diarsipkan staf');
    if (now.version_no === null || now.version_status !== 'published') return done('skipped', `tidak punya versi terbit (status ${now.status})`);
    if (now.content_hash === hash) return done('unchanged');
    if (now.reviewed_by !== SEED_ACTOR.name) return done('skipped', 'versi terbit sekarang bukan dari seed (diubah lewat CMS)');
    if (now.status !== 'published' || now.draft_by !== null) return done('skipped', `sedang disunting lewat CMS (status ${now.status})`);
    db.transaction(() => {
      saveDraft(seed.id, storedForm(seed), now.draft_revision, SEED_ACTOR);
      submitAndPublish();
    })();
    return done('updated');
  } catch (err) {
    let versionNo: number | null = null;
    try {
      versionNo = currentOf(seed.id)?.version_no ?? null;
    } catch {
      /* the database itself is unusable: report the first failure */
    }
    return { id: seed.id, outcome: 'failed', versionNo, contentHash: hash, detail: messageOf(err) };
  }
}

/** Publish every seeded scenario that is not there yet (see the header). Never throws. */
export function ensureSeedScenarios(seeds: readonly SeedScenario[] = SEED_SCENARIOS): SeedResult[] {
  return seeds.map(ensureSeedScenario);
}

/** One log line per seed result, for the server start and the dev-setup CLI. */
export function seedLogLine(r: SeedResult): string {
  const what: Record<SeedOutcome, string> = {
    published: `terbit sebagai versi ${r.versionNo}`,
    updated: `isi seed berubah, terbit versi ${r.versionNo}`,
    unchanged: `sudah terbit (versi ${r.versionNo}), tidak ada yang ditulis`,
    skipped: `DILEWATI: ${r.detail}`,
    failed: `GAGAL: ${r.detail}`,
  };
  return `[story] seed ${r.id}: ${what[r.outcome]}`;
}
