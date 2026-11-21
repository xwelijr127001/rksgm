/**
 * T-102 (Investigator lengkap, card 1): SHARED RUBRIC of the Raksa Investigator series. Pure data + pure functions, no
 * imports, no DOM, no Node API: the phone (solo play) and the server (event board, card 4) run the SAME code, so a total
 * can never differ between them.
 *
 * What lives here
 *   - CASE MANIFESTS: per case the allowed card / decision ids, the accepted cards of every round and the weights.
 *   - score(caseId, rubricVersion, roundOutcomes[], verdictId, messageId) -> {bukti, putusan, penanganan, total, nilai}
 *   - the STAGE MACHINE of one scored run (round attempts -> verdict -> message -> done) used by the event service to
 *     validate "the server-owned current stage" and by the phone to know what the next stage will be.
 *   - rank and award rules of the series (three cases, 300 points).
 *
 * Stable ids (never translated, never renamed once shipped; a change of ids or weights = bump `rubricVersion`):
 *   case     'kasus-1' | 'kasus-2' | 'kasus-3'          (= KonfigInvestigasi.kasus, the device record id)
 *   round    cases 1-2: 'keberatan' (the single confrontation); case 3: 'kronologi', 'pengajuan'
 *   card     = evidence id (BuktiInvestigasi.id)
 *   verdict  'layak' | 'tambahan' | 'polis'             (internal ids; the visible label is case text)
 *   message  'baik' | 'datar' | 'janji'
 *   outcome  'first' | 'second' | 'guided'              (legacy flags keb:tepat | keb:tepat-kedua | keb:dipandu)
 *
 * Weights. Evidence 40 in total: one round = 40 / 25 / 10 (cases 1-2, unchanged); two rounds = 20 / 12 / 5 each (case 3).
 * Verdict up to 30, handling (message) up to 30. Grade S >= 90, A >= 75, B >= 50, else C (unchanged).
 */

// ------------------------------------------------------------------ types

export type RoundOutcome = 'first' | 'second' | 'guided';
export const ROUND_OUTCOMES: readonly RoundOutcome[] = ['first', 'second', 'guided'];

export type Grade = 'S' | 'A' | 'B' | 'C';

/** Result of one finished case. Field names are the frozen contract (same as the local SkorKasus). */
export interface CaseScore {
  /** Evidence subtotal: the sum of the rounds (0..40). */
  bukti: number;
  putusan: number;
  penanganan: number;
  total: number;
  nilai: Grade;
}

export interface RoundRule {
  /** Stable round id; flag `panel:<id>:<outcome>` (case 3). Cases 1-2 keep their `keb:*` flags. */
  id: string;
  /** Cards that may be presented in this round, in no particular order (screen order is case data). */
  cards: readonly string[];
  /** Cards that settle the round. Every other card of `cards` is a miss. */
  accepted: readonly string[];
  /** Points by outcome. */
  points: Readonly<Record<RoundOutcome, number>>;
}

export interface CaseManifest {
  caseId: string;
  /** Route number (/investigator/<number>). */
  number: number;
  /** Version of THIS case's ids and weights. An unknown version is never scored (ranked play is switched off). */
  rubricVersion: number;
  rounds: readonly RoundRule[];
  /** Allowed verdict ids and their points. */
  verdicts: Readonly<Record<string, number>>;
  /** Allowed message ids and their points. */
  messages: Readonly<Record<string, number>>;
}

// ------------------------------------------------------------------ manifests

export const CASE_MAX = 100;
const SINGLE_ROUND: RoundRule['points'] = { first: 40, second: 25, guided: 10 };
const PANEL_ROUND: RoundRule['points'] = { first: 20, second: 12, guided: 5 };
const MESSAGES: CaseManifest['messages'] = { baik: 30, datar: 15, janji: 0 };

/** Round id of the single confrontation of cases 1 and 2 (their saves use the legacy `keb:*` flags). */
export const LEGACY_ROUND_ID = 'keberatan';

export const CASE_MANIFESTS: readonly CaseManifest[] = [
  {
    caseId: 'kasus-1',
    number: 1,
    rubricVersion: 1,
    rounds: [{ id: LEGACY_ROUND_ID, cards: ['rambu', 'dashcam', 'sim'], accepted: ['dashcam'], points: SINGLE_ROUND }],
    verdicts: { layak: 30, tambahan: 15, polis: 0 },
    messages: MESSAGES,
  },
  {
    caseId: 'kasus-2',
    number: 2,
    rubricVersion: 1,
    rounds: [{ id: LEGACY_ROUND_ID, cards: ['foto-interior', 'struk', 'polis-kasus2'], accepted: ['struk'], points: SINGLE_ROUND }],
    // [konfirmasi PIC] (carried over from T-090, unchanged): full credit for "coverage problem" in case 2.
    verdicts: { polis: 30, tambahan: 15, layak: 0 },
    messages: MESSAGES,
  },
  {
    // Case 3 "Satu Baris Terlalu Banyak" (invented composite). Round 1 'kronologi' answers "the mirror cracked that
    // evening" with the dated pre-incident inspection photo. Round 2 'pengajuan' answers "I thought both repairs had to
    // appear as new damage" with the acknowledged request in the message extract. The message is NOT offered in round 1
    // (it would answer that statement too); the photo IS offered in round 2 as a miss (it shows when, not what was asked).
    caseId: 'kasus-3',
    number: 3,
    rubricVersion: 1,
    rounds: [
      { id: 'kronologi', cards: ['kartu-kejadian', 'foto-inspeksi', 'penawaran'], accepted: ['foto-inspeksi'], points: PANEL_ROUND },
      { id: 'pengajuan', cards: ['penawaran', 'pesan-pengajuan', 'foto-inspeksi'], accepted: ['pesan-pengajuan'], points: PANEL_ROUND },
    ],
    // [konfirmasi PIC] 'tambahan' = the referral action (visible label "Teruskan untuk pemeriksaan"): the mirror item goes
    // to the authorised team, the bumper is recorded separately. 'layak' slot = ask for clarification only, without
    // recording or routing the discrepancy. 'polis' slot = pronounce the whole claim fraudulent.
    verdicts: { tambahan: 30, layak: 15, polis: 0 },
    messages: MESSAGES,
  },
];

/** Case ids of the series in play order (rank, awards and the board total count exactly these). */
export const SERIES_CASE_IDS: readonly string[] = CASE_MANIFESTS.map((m) => m.caseId);
export const SERIES_MAX = CASE_MAX * CASE_MANIFESTS.length;

const own = (o: object, k: unknown): k is string => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * Manifest of a case. With `rubricVersion` the version must match exactly (null = unknown case OR unknown version: do not
 * score, do not rank). Without it: the current manifest of that case.
 */
export function manifestOf(caseId: string, rubricVersion?: number): CaseManifest | null {
  const m = CASE_MANIFESTS.find((x) => x.caseId === caseId) ?? null;
  if (!m) return null;
  return rubricVersion === undefined || rubricVersion === m.rubricVersion ? m : null;
}

/** Current version of every case, for replies of the event service ({caseId, rubricVersion}). */
export interface CaseVersion { caseId: string; rubricVersion: number }
export const caseVersions = (): CaseVersion[] => CASE_MANIFESTS.map((m) => ({ caseId: m.caseId, rubricVersion: m.rubricVersion }));

// ------------------------------------------------------------------ scoring

export function gradeOf(total: number): Grade {
  return total >= 90 ? 'S' : total >= 75 ? 'A' : total >= 50 ? 'B' : 'C';
}

/** Points of one round outcome (null = unknown case / version / round / outcome). */
export function roundPoints(m: CaseManifest, roundId: string, outcome: RoundOutcome): number | null {
  const r = m.rounds.find((x) => x.id === roundId);
  return r && own(r.points, outcome) ? r.points[outcome] : null;
}

/**
 * THE rubric. `roundOutcomes` = one outcome per round, in authored round order (manifest order). Returns null when the
 * case or version is unknown, when the number of outcomes is not the number of rounds, or when an id is not allowed in
 * this case. Never trusts a total: the caller sends ids only.
 */
export function score(caseId: string, rubricVersion: number, roundOutcomes: readonly RoundOutcome[], verdictId: string, messageId: string): CaseScore | null {
  const m = manifestOf(caseId, rubricVersion);
  if (!m || !Array.isArray(roundOutcomes) || roundOutcomes.length !== m.rounds.length) return null;
  let bukti = 0;
  for (let i = 0; i < m.rounds.length; i++) {
    const o = roundOutcomes[i];
    const r = m.rounds[i]!;
    if (!own(r.points, o)) return null;
    bukti += r.points[o as RoundOutcome];
  }
  if (!own(m.verdicts, verdictId) || !own(m.messages, messageId)) return null;
  const putusan = m.verdicts[verdictId]!;
  const penanganan = m.messages[messageId]!;
  const total = bukti + putusan + penanganan;
  return { bukti, putusan, penanganan, total, nilai: gradeOf(total) };
}

/** Per-round breakdown of the evidence subtotal (practice of the weakest round, result screen). */
export interface RoundResult { id: string; outcome: RoundOutcome; points: number; max: number }
export function roundResults(m: CaseManifest, roundOutcomes: readonly RoundOutcome[]): RoundResult[] | null {
  if (roundOutcomes.length !== m.rounds.length) return null;
  const out: RoundResult[] = [];
  for (let i = 0; i < m.rounds.length; i++) {
    const r = m.rounds[i]!;
    const o = roundOutcomes[i]!;
    if (!own(r.points, o)) return null;
    out.push({ id: r.id, outcome: o, points: r.points[o], max: r.points.first });
  }
  return out;
}

export const verdictMax = (m: CaseManifest): number => Math.max(...Object.values(m.verdicts));
export const messageMax = (m: CaseManifest): number => Math.max(...Object.values(m.messages));

// ------------------------------------------------------------------ stage machine of one scored run

/**
 * Stage ids (strings on the wire, `Decision.stageId` / `Ack.nextStage`):
 *   'round:<roundId>:<attempt>'   attempt 0 = first try, 1 = second try, 2 = guided (only an accepted card is valid)
 *   'verdict'                     choiceId = verdict id
 *   'message'                     choiceId = message id
 *   'done'                        the run is complete; no further decision is accepted
 */
export type StageId = string;
export const STAGE_VERDICT: StageId = 'verdict';
export const STAGE_MESSAGE: StageId = 'message';
export const STAGE_DONE: StageId = 'done';
export type Attempt = 0 | 1 | 2;
export const roundStage = (roundId: string, attempt: Attempt): StageId => `round:${roundId}:${attempt}`;

export type ParsedStage =
  | { kind: 'round'; roundId: string; attempt: Attempt }
  | { kind: 'verdict' }
  | { kind: 'message' }
  | { kind: 'done' };

export function parseStage(stageId: unknown): ParsedStage | null {
  if (stageId === STAGE_VERDICT) return { kind: 'verdict' };
  if (stageId === STAGE_MESSAGE) return { kind: 'message' };
  if (stageId === STAGE_DONE) return { kind: 'done' };
  if (typeof stageId !== 'string') return null;
  const m = /^round:([a-z0-9-]{1,40}):([012])$/.exec(stageId);
  return m ? { kind: 'round', roundId: m[1]!, attempt: Number(m[2]) as Attempt } : null;
}

/** Everything a run has decided so far. The event service stores exactly this per run (plus seq). */
export interface RunProgress {
  stage: StageId;
  /** Outcomes of the rounds already settled, in round order. */
  outcomes: RoundOutcome[];
  verdictId: string | null;
  messageId: string | null;
}

export const startProgress = (m: CaseManifest): RunProgress => ({ stage: roundStage(m.rounds[0]!.id, 0), outcomes: [], verdictId: null, messageId: null });

/**
 * 'advanced'  = the choice was accepted and the run moved to the next stage
 * 'retry'     = a miss in a round (attempt 0 or 1): same round, next attempt; nothing is lost but the points of that try
 * 'completed' = the message was chosen: the run is done and `score` is final
 */
export type StepStatus = 'advanced' | 'retry' | 'completed';

export type StepResult =
  | { ok: true; progress: RunProgress; status: StepStatus; score?: CaseScore }
  /** 'stage' = stageId is not the current stage; 'choice' = id not allowed at this stage; 'done' = run already complete. */
  | { ok: false; reason: 'stage' | 'choice' | 'done' };

const OUTCOME_OF_ATTEMPT: readonly RoundOutcome[] = ['first', 'second', 'guided'];

/**
 * One decision. Pure: returns the new progress, never mutates. `stageId` must be the current stage (the caller's view of
 * it), `choiceId` a card of that round / a verdict id / a message id.
 */
export function applyChoice(m: CaseManifest, p: RunProgress, stageId: StageId, choiceId: string): StepResult {
  const kini = parseStage(p.stage);
  if (!kini || kini.kind === 'done') return { ok: false, reason: 'done' };
  if (stageId !== p.stage) return { ok: false, reason: 'stage' };
  if (typeof choiceId !== 'string') return { ok: false, reason: 'choice' };
  if (kini.kind === 'round') {
    const i = p.outcomes.length;
    const r = m.rounds[i];
    if (!r || r.id !== kini.roundId) return { ok: false, reason: 'stage' };
    const tepat = r.accepted.includes(choiceId);
    // Guided attempt: the other cards are shown dimmed and cannot be presented.
    if (!r.cards.includes(choiceId) || (kini.attempt === 2 && !tepat)) return { ok: false, reason: 'choice' };
    if (!tepat) return { ok: true, status: 'retry', progress: { ...p, outcomes: [...p.outcomes], stage: roundStage(r.id, (kini.attempt + 1) as Attempt) } };
    const outcomes = [...p.outcomes, OUTCOME_OF_ATTEMPT[kini.attempt]!];
    const berikut = m.rounds[i + 1];
    return { ok: true, status: 'advanced', progress: { ...p, outcomes, stage: berikut ? roundStage(berikut.id, 0) : STAGE_VERDICT } };
  }
  if (kini.kind === 'verdict') {
    if (!own(m.verdicts, choiceId)) return { ok: false, reason: 'choice' };
    return { ok: true, status: 'advanced', progress: { ...p, outcomes: [...p.outcomes], verdictId: choiceId, stage: STAGE_MESSAGE } };
  }
  if (!own(m.messages, choiceId) || p.verdictId === null) return { ok: false, reason: 'choice' };
  const hasil = score(m.caseId, m.rubricVersion, p.outcomes, p.verdictId, choiceId);
  if (!hasil) return { ok: false, reason: 'choice' };
  return { ok: true, status: 'completed', score: hasil, progress: { ...p, outcomes: [...p.outcomes], messageId: choiceId, stage: STAGE_DONE } };
}

// ------------------------------------------------------------------ rank and awards of the series

export type RankId = 'muda' | 'investigator' | 'senior' | 'kepala';
/** Stamps (distinct finished cases) needed for Senior = every case of the series. */
export const SENIOR_STAMPS = CASE_MANIFESTS.length;
/** Kepala = all stamps AND a combined personal best of at least this many points (of SERIES_MAX = 300). */
export const KEPALA_MIN_TOTAL = 255;

/**
 * Rank from DISTINCT stamps and the sum of the personal bests of the series cases:
 * 0 stamps = muda; 1 or 2 = investigator; 3 = senior; 3 and best total >= 255 = kepala. No decay.
 */
export function rankOf(stamps: number, bestTotal: number): RankId {
  if (stamps >= SENIOR_STAMPS) return bestTotal >= KEPALA_MIN_TOTAL ? 'kepala' : 'senior';
  return stamps >= 1 ? 'investigator' : 'muda';
}

/**
 * Awards of the series (art ids of card 3): second stamp = two-case badge, third stamp = panel seal, Kepala = officer-card
 * frame. A guest who reaches Senior and Kepala in the same result gets the seal and the frame together.
 */
export type AwardId = 'lencana-dua-kasus' | 'segel-panel' | 'bingkai-kepala';
export const AWARD_IDS: readonly AwardId[] = ['lencana-dua-kasus', 'segel-panel', 'bingkai-kepala'];
export function awardsOf(stamps: number, bestTotal: number): AwardId[] {
  const a: AwardId[] = [];
  if (stamps >= 2) a.push('lencana-dua-kasus');
  if (stamps >= SENIOR_STAMPS) a.push('segel-panel');
  if (rankOf(stamps, bestTotal) === 'kepala') a.push('bingkai-kepala');
  return a;
}
