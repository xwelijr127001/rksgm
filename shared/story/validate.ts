/**
 * Scenario content validation (PRD FR-A8 and appendix A: "Sistem menolak penerbitan ... dengan pesan yang menyebut babak
 * mana yang bermasalah").
 *
 * Two stages:
 *  1. `sanitizeScenarioContent(raw)` — untrusted JSON from the CMS -> well-typed `ScenarioContent` (structure only;
 *     incomplete drafts are allowed). Strips control characters and caps text sizes so stored drafts stay safe. Fields
 *     added after the first release get their defaults here, so older stored content loads unchanged.
 *  2. `validateScenario(content, ctx)` — completeness/consistency issues. Every `error` blocks submission for review
 *     and publication; `warning`s are shown to authors/reviewers (e.g. possible real identifiers, FR-E6).
 */
import { AUTHORING_HINTS, auditRound, wordCount } from './audit';
import {
  CHOICE_FORMS,
  CLASSIFICATIONS,
  CONTENT_ID_PATTERN,
  CONTENT_LOCALES,
  CONTENT_SCHEMA_VERSION,
  CONTENT_SOURCES,
  DEFAULT_CONTENT_LOCALE,
  ENDING_KINDS,
  EVIDENCE_KINDS,
  EVIDENCE_MARKS,
  EVIDENCE_ROW_KINDS,
  MAX_CAST,
  MAX_EVIDENCE,
  MAX_EVIDENCE_ROWS,
  MAX_FLAG_EFFECTS,
  MAX_INTRO_LINES,
  MOOD_BANDS,
  MOOD_BAND_FLOOR,
  MOOD_DELTA_LIMIT,
  MOOD_MAX,
  MOOD_MIN,
  PLAYER_NAME_TOKEN,
  ROUND_LAYOUTS,
  SPEAKERS,
  STORY_CHOICE_COUNT,
  STORY_ROUND_COUNT,
  TEXT_LIMITS,
  textKey,
  unknownPlaceholders,
  type CastMember,
  type ChoiceContent,
  type Difficulty,
  type DialogueLine,
  type EndingContent,
  type EvidenceItem,
  type EvidenceKind,
  type FlagEffect,
  type MoodBand,
  type RoundContent,
  type ScenarioContent,
  type SpeakerRef,
} from './content';
import { STORY_MAX_SESSION_SCORE } from './scorePolicy';

export interface ContentIssue {
  severity: 'error' | 'warning';
  code: string;
  /** 1-based round number, or null for scenario-level issues. */
  round: number | null;
  /** Machine path, e.g. `rounds[2].choices[4].consequence`, for CMS field highlighting. */
  field: string;
  /** Indonesian message that names the affected round/field. */
  message: string;
}

/**
 * What the validator needs to know about one library asset. `builtin` = the project's pixel art, drawn by client code:
 * it has no image file, so it can be a stage background but never a field scene picture or an evidence picture.
 */
export interface ValidationAsset {
  kind: string;
  expressions: readonly string[];
  archived: boolean;
  builtin: boolean;
}

/** What the validator needs to know about the outside world (categories and the asset library). */
export interface ValidationContext {
  categories: ReadonlyMap<string, { active: boolean }>;
  assets: ReadonlyMap<string, ValidationAsset>;
}

// ------------------------------------------------------------------ stage 1: structure

const MAX_TEXT_CHARS = 2000;
const MAX_LINES_PER_ROUND = 10;
const MAX_ROUNDS_STORED = 30;
const MAX_ENDINGS = 8;
// Lists are stored a little beyond their publication limits, so validation names the excess instead of dropping it.
const MAX_CAST_STORED = MAX_CAST + 4;
const MAX_INTRO_STORED = MAX_INTRO_LINES + 4;
const MAX_FLAG_EFFECTS_STORED = MAX_FLAG_EFFECTS + 3;
const MAX_EVIDENCE_STORED = MAX_EVIDENCE + 3;
const MAX_EVIDENCE_ROWS_STORED = MAX_EVIDENCE_ROWS + 4;

/** Whitespace control characters: they separate words, so they become a space (or stay a line break), never vanish. */
const WHITESPACE_CONTROLS = new Set(['\t', '\n', '\v', '\f']);

/**
 * Plain, bounded text. Line breaks (\n, \r\n, \r) stay in multiline texts; in single-line texts every line break or
 * tab becomes one space (words never glue together). Other control and format characters are removed.
 */
function cleanContentText(raw: unknown, multiline: boolean, max: number = MAX_TEXT_CHARS): string {
  if (typeof raw !== 'string') return '';
  let out = '';
  for (const ch of raw.normalize('NFC').replace(/\r\n?/g, '\n')) {
    if (WHITESPACE_CONTROLS.has(ch)) {
      out += multiline && ch === '\n' ? '\n' : ' ';
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f || /\p{Cf}/u.test(ch)) continue;
    out += ch;
  }
  out = multiline ? out.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n') : out.replace(/\s+/g, ' ');
  return out.trim().slice(0, max);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 64): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const int = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n) : fallback;
};
const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const nullableInt = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : int(v, NaN));
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

/**
 * Text keys that may hold line breaks: the synopsis, ending texts, consequences, reasons (round, choice, timeout) and
 * evidence bodies. Every other text is single-line (sanitize turns its line breaks into spaces), so editors should
 * offer a single-line input for it. Matched by key structure (ids never contain dots).
 */
const MULTILINE_KEY = /^(?:scenario\.synopsis|ending\..+|round\.[^.]+\.(?:reason|(?:choice\.[^.]+|timeout)\.(?:consequence|reason)|ev\.[^.]+\.body))$/;

export function isMultilineKey(key: string): boolean {
  return MULTILINE_KEY.test(key);
}

/** A dialogue line (round or opening). `castId` is kept only for cast speakers; flags are ids or null. */
function sanitizeLine(raw: unknown): DialogueLine {
  const o = isObj(raw) ? raw : {};
  const speaker = oneOf(o.speaker, SPEAKERS, 'narrator');
  return { id: str(o.id, 32), speaker, castId: speaker === 'cast' ? str(o.castId, 32) || null : null, ifFlag: str(o.ifFlag, 32) || null };
}

/** A round's respondent: null for narration (a narrator is stored as null) or anything that is not an object. */
function sanitizeSpeakerRef(raw: unknown): SpeakerRef | null {
  if (!isObj(raw)) return null;
  const speaker = oneOf(raw.speaker, SPEAKERS, 'narrator');
  if (speaker === 'narrator') return null;
  return { speaker, castId: speaker === 'cast' ? str(raw.castId, 32) || null : null };
}

/** A marker position in percent: both coordinates numeric (else null), clamped to 0–100. */
function sanitizeSpot(raw: unknown): { x: number; y: number } | null {
  if (!isObj(raw)) return null;
  const x = num(raw.x, NaN);
  const y = num(raw.y, NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const percent = (v: number) => Math.min(100, Math.max(0, v));
  return { x: percent(x), y: percent(y) };
}

/** An evidence item: unknown kinds/marks fall back to `document`/`none`; rows are kept whatever the kind (validation judges). */
function sanitizeEvidence(raw: unknown): EvidenceItem {
  const o = isObj(raw) ? raw : {};
  return {
    id: str(o.id, 32),
    kind: oneOf(o.kind, EVIDENCE_KINDS, 'document'),
    assetId: str(o.assetId, 64) || null,
    spot: sanitizeSpot(o.spot),
    rows: list(o.rows, MAX_EVIDENCE_ROWS_STORED).map((row) => {
      const ro = isObj(row) ? row : {};
      return { id: str(ro.id, 32), mark: oneOf(ro.mark, EVIDENCE_MARKS, 'none') };
    }),
  };
}

/**
 * Untrusted JSON -> `ScenarioContent`. Never throws; unknown fields are dropped, wrong types fall back to empty values
 * that `validateScenario` then reports. Older content (schema v1) is upgraded: fields it lacks get their defaults and
 * `schemaVersion` becomes the current one. Returns null only when `raw` is not an object at all.
 */
export function sanitizeScenarioContent(raw: unknown): ScenarioContent | null {
  if (!isObj(raw)) return null;
  const pres = isObj(raw.presentation) ? raw.presentation : {};
  const moodExpressionsRaw = isObj(pres.moodExpressions) ? pres.moodExpressions : {};
  const moodExpressions = Object.fromEntries(MOOD_BANDS.map((b) => [b, str(moodExpressionsRaw[b], 32)])) as Record<MoodBand, string>;

  const cast: CastMember[] = list(raw.cast, MAX_CAST_STORED).map((m) => {
    const o = isObj(m) ? m : {};
    return { id: str(o.id, 32), characterAssetId: str(o.characterAssetId, 64) || null };
  });
  const intro: DialogueLine[] = list(raw.intro, MAX_INTRO_STORED).map(sanitizeLine);

  const rounds: RoundContent[] = list(raw.rounds, MAX_ROUNDS_STORED).map((r): RoundContent => {
    const o = isObj(r) ? r : {};
    const lines: DialogueLine[] = list(o.lines, MAX_LINES_PER_ROUND).map(sanitizeLine);
    const choices: ChoiceContent[] = list(o.choices, STORY_CHOICE_COUNT + 3).map((c) => {
      const co = isObj(c) ? c : {};
      return {
        id: str(co.id, 32),
        classification: oneOf(co.classification, CLASSIFICATIONS, 'keliru'),
        accuracy: num(co.accuracy, 0),
        moodDelta: int(co.moodDelta, 0),
        setsFlag: str(co.setsFlag, 32) || null,
        form: oneOf(co.form, CHOICE_FORMS, 'message'),
      };
    });
    const flagEffects: FlagEffect[] = list(o.flagEffects, MAX_FLAG_EFFECTS_STORED).map((e) => {
      const eo = isObj(e) ? e : {};
      return { flag: str(eo.flag, 32), moodDelta: int(eo.moodDelta, 0) };
    });
    const timeout = isObj(o.timeout) ? o.timeout : {};
    return {
      id: str(o.id, 32),
      backgroundAssetId: str(o.backgroundAssetId, 64),
      showOfficer: o.showOfficer !== false,
      mediaAssetId: str(o.mediaAssetId, 64) || null,
      lines,
      choices,
      timeout: { moodDelta: int(timeout.moodDelta, 0) },
      layout: oneOf(o.layout, ROUND_LAYOUTS, 'stage'),
      keyRound: o.keyRound === true,
      flagEffects,
      authorNote: cleanContentText(o.authorNote, true, TEXT_LIMITS.authorNote),
      evidence: list(o.evidence, MAX_EVIDENCE_STORED).map(sanitizeEvidence),
      respondent: sanitizeSpeakerRef(o.respondent),
    };
  });

  const endings: EndingContent[] = list(raw.endings, MAX_ENDINGS).map((e) => {
    const eo = isObj(e) ? e : {};
    return {
      id: str(eo.id, 32),
      kind: oneOf(eo.kind, ENDING_KINDS, 'with_notes'),
      minMood: nullableInt(eo.minMood),
      maxMood: nullableInt(eo.maxMood),
      minScore: nullableInt(eo.minScore),
      maxScore: nullableInt(eo.maxScore),
    };
  });

  const localesRaw = Array.isArray(raw.locales) ? raw.locales : [];
  const locales = CONTENT_LOCALES.filter((l) => l === DEFAULT_CONTENT_LOCALE || localesRaw.includes(l));
  const textRaw = isObj(raw.text) ? raw.text : {};
  const text: ScenarioContent['text'] = {};
  for (const locale of CONTENT_LOCALES) {
    const map = isObj(textRaw[locale]) ? textRaw[locale] : null;
    if (!map) continue;
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(map).slice(0, 4000)) {
      if (!/^[a-z0-9_.-]{3,120}$/i.test(key)) continue;
      const t = cleanContentText(value, isMultilineKey(key));
      if (t) clean[key] = t;
    }
    text[locale] = clean;
  }

  const difficulty = int(raw.difficulty, 1);
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    categoryId: str(raw.categoryId, 32),
    difficulty: (difficulty === 2 || difficulty === 3 ? difficulty : 1) as Difficulty,
    locales,
    initialMood: int(raw.initialMood, 30),
    contentSource: oneOf(raw.contentSource, CONTENT_SOURCES, 'settled_case'),
    presentation: {
      customerCharacterId: str(pres.customerCharacterId, 64) || null,
      officerCharacterId: pres.officerCharacterId === null ? null : str(pres.officerCharacterId, 64) || null,
      moodExpressions,
      bgmAssetId: str(pres.bgmAssetId, 64) || null,
    },
    cast,
    intro,
    rounds,
    endings,
    authorNotes: cleanContentText(raw.authorNotes, true, TEXT_LIMITS.authorNotes),
    text,
  };
}

// ------------------------------------------------------------------ stage 2: completeness & consistency

/** "Babak N" label for 0-based round index `i`. */
function roundLabel(i: number): string {
  return `Babak ${i + 1}`;
}

/** "0–19" style range of a mood band (for status-word messages). */
function bandRange(band: MoodBand): string {
  const next = MOOD_BANDS[MOOD_BANDS.indexOf(band) + 1];
  return `${MOOD_BAND_FLOOR[band]}–${next ? MOOD_BAND_FLOOR[next] - 1 : MOOD_MAX}`;
}

/** Heuristic markers of real personal/claim identifiers (FR-E6). Warnings only: a reviewer must judge. */
const IDENTIFIER_PATTERNS: { re: RegExp; what: string }[] = [
  { re: /\b\d{8,}\b/, what: 'deretan angka panjang (nomor polis/klaim/rekening?)' },
  { re: /\b[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}\b/, what: 'pola nomor polisi kendaraan' },
  { re: /\b(polis|klaim)\s*(no\.?|nomor)\s*[:#]?\s*[A-Z0-9-]{4,}/i, what: 'nomor polis/klaim' },
  { re: /\b(?:\+62|62|0)8\d{7,11}\b/, what: 'nomor telepon' },
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/, what: 'alamat email' },
  { re: /\b\d{16}\b/, what: 'NIK (16 digit)' },
];

/** Plain text only: anything that looks like an HTML tag is rejected (React escapes it anyway; authors must not rely on markup). */
const TAG_PATTERN = /<\s*\/?\s*[a-z!?]/i;

/** Placeholder token as shown in a message (an unclosed-looking long token is shortened). */
const shownToken = (token: string): string => ([...token].length > 40 ? `${[...token].slice(0, 38).join('')}…}` : token);

/** Evidence kinds as named in messages. */
const EVIDENCE_KIND_NAME: Record<EvidenceKind, string> = {
  document: 'dokumen',
  checklist: 'daftar periksa',
  timeline: 'linimasa',
  compare: 'perbandingan',
  photo: 'foto',
};

/** Median of a non-empty list. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Records one issue (round 1-based or null, field path, code, Indonesian message). */
type IssueSink = (round: number | null, field: string, code: string, message: string) => void;

/** Structure of one round's evidence: ids, row lists by kind, images (texts are checked per locale). */
function checkEvidenceStructure(r: RoundContent, i: number, ctx: ValidationContext, err: IssueSink, warn: IssueSink): void {
  const label = roundLabel(i);
  const f = (s: string) => `rounds[${i}].${s}`;
  if (r.evidence.length > MAX_EVIDENCE) err(i + 1, f('evidence'), 'evidence_count', `${label}: berkas paling banyak ${MAX_EVIDENCE} (sekarang ${r.evidence.length}).`);
  const ids = new Set<string>();
  r.evidence.forEach((e, ei) => {
    const where = `${label}, berkas ${ei + 1}`;
    const ef = (s: string) => f(`evidence[${ei}].${s}`);
    if (!CONTENT_ID_PATTERN.test(e.id)) err(i + 1, ef('id'), 'evidence_id_invalid', `${where}: ID berkas tidak valid.`);
    else if (ids.has(e.id)) err(i + 1, ef('id'), 'evidence_id_duplicate', `${where}: ID berkas "${e.id}" dipakai dua kali.`);
    ids.add(e.id);
    const kind = EVIDENCE_KIND_NAME[e.kind];
    if (EVIDENCE_ROW_KINDS.includes(e.kind)) {
      if (e.rows.length === 0 || e.rows.length > MAX_EVIDENCE_ROWS) {
        err(i + 1, ef('rows'), 'evidence_rows', `${where}: ${kind} butuh 1–${MAX_EVIDENCE_ROWS} baris (sekarang ${e.rows.length}).`);
      }
    } else if (e.rows.length > 0) {
      warn(i + 1, ef('rows'), 'evidence_rows_unused', `${where}: berkas jenis ${kind} tidak menampilkan baris; hapus barisnya atau ganti jenisnya.`);
    }
    const rowIds = new Set<string>();
    e.rows.forEach((row, ri) => {
      const rf = ef(`rows[${ri}].id`);
      if (!CONTENT_ID_PATTERN.test(row.id)) err(i + 1, rf, 'evidence_row_id_invalid', `${where}, baris ${ri + 1}: ID baris tidak valid.`);
      else if (rowIds.has(row.id)) err(i + 1, rf, 'evidence_row_id_duplicate', `${where}, baris ${ri + 1}: ID baris "${row.id}" dipakai dua kali.`);
      rowIds.add(row.id);
    });
    if (e.assetId) {
      const image = ctx.assets.get(e.assetId);
      if (!image || (image.kind !== 'photo' && image.kind !== 'background')) {
        err(i + 1, ef('assetId'), 'evidence_asset_unknown', `${where}: gambar tidak ada di pustaka aset (pilih foto atau latar).`);
      } else if (image.archived) err(i + 1, ef('assetId'), 'evidence_asset_unknown', `${where}: gambar sudah diarsipkan di pustaka aset.`);
      else if (image.builtin) {
        err(i + 1, ef('assetId'), 'evidence_asset_builtin', `${where}: latar bawaan tidak punya berkas gambar untuk dibuka; pilih foto atau latar hasil unggahan.`);
      }
    } else if (e.kind === 'photo') err(i + 1, ef('assetId'), 'evidence_asset_missing', `${where}: foto belum dipilih.`);
  });
}

export function validateScenario(content: ScenarioContent, ctx: ValidationContext): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const err: IssueSink = (round, field, code, message) => issues.push({ severity: 'error', round, field, code, message });
  const warn: IssueSink = (round, field, code, message) => issues.push({ severity: 'warning', round, field, code, message });

  // ---- scenario level
  const cat = ctx.categories.get(content.categoryId);
  if (!content.categoryId) err(null, 'categoryId', 'category_missing', 'Kategori skenario belum dipilih.');
  else if (!cat) err(null, 'categoryId', 'category_unknown', `Kategori "${content.categoryId}" tidak dikenal.`);
  else if (!cat.active) err(null, 'categoryId', 'category_inactive', `Kategori "${content.categoryId}" belum aktif; skenario di kategori nonaktif tidak bisa terbit.`);
  if (![1, 2, 3].includes(content.difficulty)) err(null, 'difficulty', 'difficulty_invalid', 'Tingkat kesulitan harus 1, 2, atau 3.');
  if (!Number.isInteger(content.initialMood) || content.initialMood < MOOD_MIN || content.initialMood > MOOD_MAX) {
    err(null, 'initialMood', 'mood_invalid', `Status awal customer harus bilangan bulat ${MOOD_MIN}–${MOOD_MAX}.`);
  }
  if (!content.locales.includes(DEFAULT_CONTENT_LOCALE)) err(null, 'locales', 'locale_default_missing', 'Bahasa Indonesia wajib ada.');

  // ---- presentation (no customer character = name + status only: no portrait, no expressions to check)
  const customerId = content.presentation.customerCharacterId;
  if (customerId) {
    const customer = ctx.assets.get(customerId);
    if (!customer || customer.kind !== 'character') err(null, 'presentation.customerCharacterId', 'customer_unknown', 'Karakter customer tidak ada di pustaka aset.');
    else if (customer.archived) err(null, 'presentation.customerCharacterId', 'customer_archived', 'Karakter customer sudah diarsipkan di pustaka aset.');
    for (const band of MOOD_BANDS) {
      const expr = content.presentation.moodExpressions[band];
      if (!expr) err(null, `presentation.moodExpressions.${band}`, 'expression_missing', `Ekspresi customer untuk status "${band}" belum dipilih.`);
      else if (customer && customer.kind === 'character' && !customer.expressions.includes(expr)) {
        err(null, `presentation.moodExpressions.${band}`, 'expression_unknown', `Ekspresi "${expr}" tidak dimiliki karakter customer (status "${band}").`);
      }
    }
  }
  const officerId = content.presentation.officerCharacterId;
  if (officerId) {
    const officer = ctx.assets.get(officerId);
    if (!officer || officer.kind !== 'character') err(null, 'presentation.officerCharacterId', 'officer_unknown', 'Karakter petugas tidak ada di pustaka aset.');
    else if (officer.archived) err(null, 'presentation.officerCharacterId', 'officer_archived', 'Karakter petugas sudah diarsipkan di pustaka aset.');
  }
  const bgmId = content.presentation.bgmAssetId;
  if (bgmId) {
    const bgm = ctx.assets.get(bgmId);
    if (!bgm || bgm.kind !== 'bgm') err(null, 'presentation.bgmAssetId', 'bgm_unknown', 'Musik latar tidak ada di pustaka aset.');
    else if (bgm.archived) err(null, 'presentation.bgmAssetId', 'bgm_archived', 'Musik latar sudah diarsipkan di pustaka aset.');
  }

  // ---- cast (supporting characters)
  if (content.cast.length > MAX_CAST) err(null, 'cast', 'cast_count', `Tokoh pendukung paling banyak ${MAX_CAST} (sekarang ${content.cast.length}).`);
  const castIds = new Set<string>();
  content.cast.forEach((m, mi) => {
    const ml = `Tokoh pendukung ${mi + 1}`;
    const mf = (s: string) => `cast[${mi}].${s}`;
    if (!CONTENT_ID_PATTERN.test(m.id)) err(null, mf('id'), 'cast_id_invalid', `${ml}: ID tokoh tidak valid.`);
    else if (castIds.has(m.id)) err(null, mf('id'), 'cast_id_duplicate', `${ml}: ID tokoh "${m.id}" dipakai dua kali.`);
    castIds.add(m.id);
    if (m.characterAssetId) {
      const portrait = ctx.assets.get(m.characterAssetId);
      if (!portrait || portrait.kind !== 'character') err(null, mf('characterAssetId'), 'cast_character_unknown', `${ml}: gambar tokoh tidak ada di pustaka aset.`);
      else if (portrait.archived) err(null, mf('characterAssetId'), 'cast_character_unknown', `${ml}: gambar tokoh sudah diarsipkan di pustaka aset.`);
    }
  });

  /** A cast speaker must name a member of the cast list. */
  const checkSpeaker = (l: DialogueLine, round: number | null, field: string, where: string) => {
    if (l.speaker !== 'cast') return;
    if (!l.castId) err(round, `${field}.castId`, 'line_cast_unknown', `${where}: tokoh pendukung yang berbicara belum dipilih.`);
    else if (!castIds.has(l.castId)) err(round, `${field}.castId`, 'line_cast_unknown', `${where}: tokoh "${l.castId}" tidak ada di daftar tokoh pendukung.`);
  };

  // ---- opening lines (shown to everybody before round 1)
  if (content.intro.length > MAX_INTRO_LINES) err(null, 'intro', 'intro_count', `Pembuka paling banyak ${MAX_INTRO_LINES} baris (sekarang ${content.intro.length}).`);
  const introIds = new Set<string>();
  content.intro.forEach((l, li) => {
    const where = `Pembuka, baris ${li + 1}`;
    const lf = `intro[${li}]`;
    if (!CONTENT_ID_PATTERN.test(l.id)) err(null, `${lf}.id`, 'line_id_invalid', `${where}: ID baris tidak valid.`);
    else if (introIds.has(l.id)) err(null, `${lf}.id`, 'line_id_duplicate', `${where}: ID baris dipakai dua kali.`);
    introIds.add(l.id);
    checkSpeaker(l, null, lf, where);
    if (l.ifFlag) err(null, `${lf}.ifFlag`, 'intro_flag', `${where}: baris pembuka tampil untuk semua peserta, jadi tidak boleh bersyarat tanda.`);
  });

  // ---- rounds
  if (content.rounds.length !== STORY_ROUND_COUNT) {
    err(null, 'rounds', 'round_count', `Jumlah babak harus ${STORY_ROUND_COUNT} (sekarang ${content.rounds.length}).`);
  }
  // Delayed consequences: which rounds react to each flag (for unused-flag warnings), and the flags left by choices
  // of the rounds already checked (a round may only react to flags set BEFORE it).
  const flagReactions = new Map<string, number[]>();
  content.rounds.forEach((r, i) => {
    for (const flag of [...r.lines.map((l) => l.ifFlag), ...r.flagEffects.map((e) => e.flag)]) {
      if (flag) flagReactions.set(flag, [...(flagReactions.get(flag) ?? []), i]);
    }
  });
  const flagsSetBefore = new Set<string>();
  /** First round (0-based) whose choices leave each flag: reminders name one round per flag (engine.flagSourceIndex). */
  const flagFirstRound = new Map<string, number>();
  const checkFlagRef = (flag: string, i: number, field: string, where: string) => {
    if (!CONTENT_ID_PATTERN.test(flag)) err(i + 1, field, 'flag_id_invalid', `${where}: ID tanda ${flag ? `"${flag}" ` : ''}tidak valid.`);
    else if (!flagsSetBefore.has(flag)) err(i + 1, field, 'flag_unknown', `${where}: tanda "${flag}" belum ditinggalkan oleh pilihan di babak sebelumnya.`);
  };

  const roundIds = new Set<string>();
  content.rounds.forEach((r, i) => {
    const label = roundLabel(i);
    const f = (s: string) => `rounds[${i}].${s}`;
    if (!CONTENT_ID_PATTERN.test(r.id)) err(i + 1, f('id'), 'round_id_invalid', `${label}: ID babak tidak valid.`);
    else if (roundIds.has(r.id)) err(i + 1, f('id'), 'round_id_duplicate', `${label}: ID babak "${r.id}" dipakai dua kali.`);
    roundIds.add(r.id);
    const bg = ctx.assets.get(r.backgroundAssetId);
    if (!r.backgroundAssetId) err(i + 1, f('backgroundAssetId'), 'background_missing', `${label}: latar belum dipilih.`);
    else if (!bg || bg.kind !== 'background') err(i + 1, f('backgroundAssetId'), 'background_unknown', `${label}: latar tidak ada di pustaka aset.`);
    else if (bg.archived) err(i + 1, f('backgroundAssetId'), 'background_archived', `${label}: latar sudah diarsipkan di pustaka aset.`);
    else if (r.layout === 'field' && bg.builtin) {
      err(i + 1, f('backgroundAssetId'), 'field_builtin_background', `${label}: adegan lapangan butuh gambar latar hasil unggahan; latar bawaan tidak punya berkas gambar, jadi adegan dan titik-titiknya tidak tampil.`);
    }
    // Only the stage layout draws the officer; the other layouts ignore showOfficer.
    if (r.layout === 'stage' && r.showOfficer && !officerId) {
      warn(i + 1, f('showOfficer'), 'officer_none', `${label}: menampilkan petugas, tetapi skenario belum memilih karakter petugas.`);
    }
    if (r.mediaAssetId) {
      const media = ctx.assets.get(r.mediaAssetId);
      if (!media || (media.kind !== 'photo' && media.kind !== 'video')) err(i + 1, f('mediaAssetId'), 'media_unknown', `${label}: foto/video tidak ada di pustaka aset.`);
      else if (media.archived) err(i + 1, f('mediaAssetId'), 'media_archived', `${label}: foto/video sudah diarsipkan di pustaka aset.`);
    }

    if (r.lines.length === 0) err(i + 1, f('lines'), 'lines_missing', `${label}: adegan belum punya dialog/narasi.`);
    else if (r.lines.every((l) => l.ifFlag)) err(i + 1, f('lines'), 'lines_missing', `${label}: adegan butuh minimal satu baris tanpa syarat tanda (tampil untuk semua peserta).`);
    const lineIds = new Set<string>();
    r.lines.forEach((l, li) => {
      const where = `${label}, baris ${li + 1}`;
      if (!CONTENT_ID_PATTERN.test(l.id)) err(i + 1, f(`lines[${li}].id`), 'line_id_invalid', `${where}: ID baris tidak valid.`);
      else if (lineIds.has(l.id)) err(i + 1, f(`lines[${li}].id`), 'line_id_duplicate', `${where}: ID baris dipakai dua kali.`);
      lineIds.add(l.id);
      checkSpeaker(l, i + 1, f(`lines[${li}]`), where);
      if (l.ifFlag) checkFlagRef(l.ifFlag, i, f(`lines[${li}].ifFlag`), where);
    });

    if (r.flagEffects.length > MAX_FLAG_EFFECTS) {
      err(i + 1, f('flagEffects'), 'flag_effect_count', `${label}: efek tertunda paling banyak ${MAX_FLAG_EFFECTS} (sekarang ${r.flagEffects.length}).`);
    }
    const effectFlags = new Set<string>();
    r.flagEffects.forEach((e, ei) => {
      const where = `${label}, efek tertunda ${ei + 1}`;
      const ef = (s: string) => f(`flagEffects[${ei}].${s}`);
      checkFlagRef(e.flag, i, ef('flag'), where);
      if (e.flag && effectFlags.has(e.flag)) err(i + 1, ef('flag'), 'flag_effect_duplicate', `${where}: tanda "${e.flag}" sudah dipakai efek lain di babak ini.`);
      effectFlags.add(e.flag);
      if (!Number.isInteger(e.moodDelta) || Math.abs(e.moodDelta) > MOOD_DELTA_LIMIT) {
        err(i + 1, ef('moodDelta'), 'flag_delta_range', `${where}: perubahan status customer harus bilangan bulat −${MOOD_DELTA_LIMIT} sampai +${MOOD_DELTA_LIMIT}.`);
      }
    });

    if (r.choices.length === 0) err(i + 1, f('choices'), 'choices_missing', `${label}: belum ada pilihan.`);
    else if (r.choices.length !== STORY_CHOICE_COUNT) err(i + 1, f('choices'), 'choice_count', `${label}: harus ada tepat ${STORY_CHOICE_COUNT} pilihan (sekarang ${r.choices.length}).`);
    const choiceIds = new Set<string>();
    r.choices.forEach((c, ci) => {
      const cl = `${label}, pilihan ${ci + 1}`;
      const cf = (s: string) => f(`choices[${ci}].${s}`);
      if (!CONTENT_ID_PATTERN.test(c.id)) err(i + 1, cf('id'), 'choice_id_invalid', `${cl}: ID pilihan tidak valid.`);
      else if (choiceIds.has(c.id)) err(i + 1, cf('id'), 'choice_id_duplicate', `${cl}: ID pilihan dipakai dua kali.`);
      choiceIds.add(c.id);
      if (!Number.isFinite(c.accuracy) || c.accuracy < 0 || c.accuracy > 1) err(i + 1, cf('accuracy'), 'accuracy_range', `${cl}: bobot ketepatan harus 0–1.`);
      else if (c.classification === 'tepat' && c.accuracy !== 1) err(i + 1, cf('accuracy'), 'accuracy_tepat', `${cl}: pilihan "tepat" harus berbobot 1.`);
      else if (c.classification === 'keliru' && c.accuracy !== 0) err(i + 1, cf('accuracy'), 'accuracy_keliru', `${cl}: pilihan "keliru" harus berbobot 0.`);
      else if (c.classification === 'kurang_tepat' && (c.accuracy <= 0 || c.accuracy >= 1)) {
        err(i + 1, cf('accuracy'), 'accuracy_partial', `${cl}: pilihan "kurang tepat" harus berbobot di antara 0 dan 1 (mis. 0,5).`);
      }
      if (!Number.isInteger(c.moodDelta) || Math.abs(c.moodDelta) > MOOD_DELTA_LIMIT) {
        err(i + 1, cf('moodDelta'), 'mood_delta_range', `${cl}: perubahan status customer harus bilangan bulat −${MOOD_DELTA_LIMIT} sampai +${MOOD_DELTA_LIMIT}.`);
      }
      if (c.setsFlag) {
        if (!CONTENT_ID_PATTERN.test(c.setsFlag)) {
          err(i + 1, cf('setsFlag'), 'flag_id_invalid', `${cl}: ID tanda "${c.setsFlag}" tidak valid (huruf kecil di awal, lalu huruf kecil, angka, - atau _).`);
        } else {
          if (!(flagReactions.get(c.setsFlag) ?? []).some((j) => j > i)) {
            warn(i + 1, cf('setsFlag'), 'flag_unused', `${cl}: tanda "${c.setsFlag}" belum dipakai babak sesudahnya (efek tertunda atau baris bersyarat).`);
          }
          const first = flagFirstRound.get(c.setsFlag);
          if (first !== undefined && first < i) {
            warn(i + 1, cf('setsFlag'), 'flag_multi_round', `${cl}: tanda "${c.setsFlag}" juga ditinggalkan di ${roundLabel(first)}; pengingat dan ringkasan selalu menyebut babak terakhir yang meninggalkannya.`);
          }
        }
      }
    });
    if (r.choices.length > 0 && !r.choices.some((c) => c.classification === 'tepat')) {
      err(i + 1, f('choices'), 'no_recommended', `${label}: belum ada pilihan berstatus "tepat" (keputusan yang disarankan).`);
    }
    if (!Number.isInteger(r.timeout.moodDelta) || Math.abs(r.timeout.moodDelta) > MOOD_DELTA_LIMIT) {
      err(i + 1, f('timeout.moodDelta'), 'timeout_delta_range', `${label}: perubahan status saat waktu habis harus −${MOOD_DELTA_LIMIT} sampai +${MOOD_DELTA_LIMIT}.`);
    }
    // Flags left in this round count from the NEXT round on.
    for (const c of r.choices) {
      if (!c.setsFlag) continue;
      flagsSetBefore.add(c.setsFlag);
      if (!flagFirstRound.has(c.setsFlag)) flagFirstRound.set(c.setsFlag, i);
    }

    // ---- activity: shared evidence, what each layout needs, who reacts after the decision
    checkEvidenceStructure(r, i, ctx, err, warn);
    if (r.layout === 'dossier' && r.evidence.length === 0) err(i + 1, f('evidence'), 'dossier_empty', `${label}: meja berkas butuh minimal satu berkas untuk diperiksa.`);
    if (r.layout === 'field' && !r.evidence.some((e) => e.spot)) {
      err(i + 1, f('evidence'), 'field_no_spot', `${label}: adegan lapangan butuh minimal satu berkas dengan titik pada gambar latar.`);
    }
    // The chat contact is the respondent (customer or cast) when set, else the first customer/cast sender.
    const respondentIsContact = r.respondent !== null && (r.respondent.speaker === 'customer' || r.respondent.speaker === 'cast');
    if (r.layout === 'chat' && !respondentIsContact && !r.lines.some((l) => !l.ifFlag && (l.speaker === 'customer' || l.speaker === 'cast'))) {
      warn(i + 1, f('lines'), 'chat_no_contact', `${label}: chat tanpa pesan dari customer atau tokoh lain dan tanpa responden, jadi percakapan tampil tanpa kontak.`);
    }
    if (r.respondent?.speaker === 'cast') {
      const castId = r.respondent.castId;
      if (!castId) err(i + 1, f('respondent.castId'), 'respondent_cast_unknown', `${label}: tokoh pendukung yang membalas belum dipilih.`);
      else if (!castIds.has(castId)) err(i + 1, f('respondent.castId'), 'respondent_cast_unknown', `${label}: tokoh "${castId}" yang membalas tidak ada di daftar tokoh pendukung.`);
    }
    const replyKeys = [...r.choices.map((c) => textKey.choiceReply(r.id, c.id)), textKey.timeoutReply(r.id)];
    if (!r.respondent && content.locales.some((l) => replyKeys.some((k) => content.text[l]?.[k]?.trim()))) {
      warn(i + 1, f('respondent'), 'reply_without_respondent', `${label}: ada balasan sesudah keputusan, tetapi belum dipilih siapa yang membalas.`);
    }
  });

  // ---- display cues (guidance, never blocking): players see which options are actions, so a mark that never sits on
  // a tepat option becomes a sign of a wrong answer once they have met it a second time.
  const actionOptions = content.rounds.flatMap((r, i) => r.choices.flatMap((c, ci) => (c.form === 'action' ? [{ i, ci, tepat: c.classification === 'tepat' }] : [])));
  if (actionOptions.length >= AUTHORING_HINTS.actionMarkMinOptions && !actionOptions.some((o) => o.tepat)) {
    for (const { i, ci } of actionOptions) {
      warn(
        i + 1,
        `rounds[${i}].choices[${ci}].form`,
        'choice_form_hint',
        `${roundLabel(i)}, pilihan ${ci + 1}: tidak satu pun dari ${actionOptions.length} pilihan berbentuk “Tindakan, bukan pesan” di skenario ini tepat. Bentuk itu mengubah label tombol dan catatan terkirim, jadi bisa terbaca sebagai petunjuk jawaban salah. Sertakan pilihan tepat yang juga berupa tindakan, atau tinjau bentuk pilihan ini.`,
      );
    }
  }

  // ---- endings
  if (content.endings.length < 2) err(null, 'endings', 'ending_count', 'Minimal dua akhir cerita (akhir bahagia/happy ending penuh dan selesai dengan catatan).');
  if (!content.endings.some((e) => e.kind === 'happy')) err(null, 'endings', 'ending_happy_missing', 'Belum ada akhir bahagia ("happy ending penuh").');
  if (!content.endings.some((e) => e.kind === 'with_notes')) err(null, 'endings', 'ending_notes_missing', 'Belum ada akhir "selesai dengan catatan".');
  const endingIds = new Set<string>();
  content.endings.forEach((e, ei) => {
    const el = `Akhir ${ei + 1}`;
    const ef = (s: string) => `endings[${ei}].${s}`;
    if (!CONTENT_ID_PATTERN.test(e.id)) err(null, ef('id'), 'ending_id_invalid', `${el}: ID akhir tidak valid.`);
    else if (endingIds.has(e.id)) err(null, ef('id'), 'ending_id_duplicate', `${el}: ID akhir dipakai dua kali.`);
    endingIds.add(e.id);
    const range = (min: number | null, max: number | null, lo: number, hi: number, name: string, field: string) => {
      for (const [v, which] of [[min, 'min'], [max, 'max']] as const) {
        if (v !== null && (!Number.isInteger(v) || v < lo || v > hi)) err(null, ef(field + (which === 'min' ? 'Min' : 'Max')), 'ending_range', `${el}: batas ${name} harus ${lo}–${hi}.`);
      }
      if (min !== null && max !== null && min > max) err(null, ef(field), 'ending_range_order', `${el}: batas bawah ${name} lebih besar dari batas atas.`);
    };
    range(e.minMood, e.maxMood, MOOD_MIN, MOOD_MAX, 'status customer', 'mood');
    range(e.minScore, e.maxScore, 0, STORY_MAX_SESSION_SCORE, 'nilai', 'score');
  });
  const last = content.endings[content.endings.length - 1];
  if (last && (last.minMood !== null || last.maxMood !== null || last.minScore !== null || last.maxScore !== null)) {
    err(null, `endings[${content.endings.length - 1}]`, 'ending_fallback', 'Akhir terakhir harus tanpa syarat (cadangan), supaya setiap peserta pasti mendapat akhir cerita.');
  }

  // ---- texts per locale (FR-A10 language completeness)
  const officerSpeaks = [...content.intro, ...content.rounds.flatMap((r) => [...r.lines, ...(r.respondent ? [r.respondent] : [])])].some((l) => l.speaker === 'officer');
  // Every flag a choice leaves (valid ids only), for the optional flag labels.
  const flagsLeft = [...new Set(content.rounds.flatMap((r) => r.choices.map((c) => c.setsFlag)))].filter((flag): flag is string => Boolean(flag && CONTENT_ID_PATTERN.test(flag)));
  for (const locale of content.locales) {
    const t = content.text[locale] ?? {};
    const lang = locale === DEFAULT_CONTENT_LOCALE ? '' : ` [${locale}]`;
    const at = (round: number | null) => (round ? `${roundLabel(round - 1)}: ` : '');
    const filled = (key: string) => Boolean(t[key]?.trim());
    const checkText = (v: string, round: number | null, field: string, what: string, limit: number) => {
      if ([...v].length > limit) err(round, field, 'text_too_long', `${at(round)}${what} terlalu panjang (maks ${limit} karakter)${lang}.`);
      if (TAG_PATTERN.test(v)) err(round, field, 'text_markup', `${at(round)}${what} tidak boleh berisi tag HTML${lang}.`);
      const unknown = [...new Set(unknownPlaceholders(v))];
      if (unknown.length) {
        err(round, field, 'placeholder_unknown', `${at(round)}${what} memuat penanda ${unknown.map(shownToken).join(', ')} yang tidak dikenal; hanya ${PLAYER_NAME_TOKEN} (nama pemain) yang didukung${lang}.`);
      }
      for (const p of IDENTIFIER_PATTERNS) {
        if (p.re.test(v)) warn(round, field, 'possible_identifier', `${at(round)}${what} memuat ${p.what}. Pastikan sudah dianonimkan${lang}.`);
      }
    };
    const need = (key: string, round: number | null, field: string, what: string, limit: number) => {
      const v = t[key] ?? '';
      if (!v.trim()) err(round, field, 'text_missing', `${at(round)}${what} belum diisi${lang}.`);
      else checkText(v, round, field, what, limit);
    };
    const optional = (key: string, round: number | null, field: string, what: string, limit: number) => {
      const v = t[key];
      if (v) checkText(v, round, field, what, limit);
    };
    // Titles appear unsubstituted on staff reports and in the CSV export, so they may not use the player's name.
    const titleWithoutName = (key: string, round: number | null, field: string, what: string) => {
      if (t[key]?.includes(PLAYER_NAME_TOKEN)) {
        err(round, field, 'placeholder_in_title', `${at(round)}${what} tidak boleh memuat ${PLAYER_NAME_TOKEN}: judul tampil apa adanya di laporan dan CSV staf${lang}.`);
      }
    };

    need(textKey.title(), null, 'text.title', 'Judul skenario', TEXT_LIMITS.title);
    titleWithoutName(textKey.title(), null, 'text.title', 'Judul skenario');
    need(textKey.synopsis(), null, 'text.synopsis', 'Sinopsis', TEXT_LIMITS.synopsis);
    need(textKey.customerName(), null, 'text.customerName', 'Nama tokoh customer', TEXT_LIMITS.characterName);
    if (officerId || officerSpeaks) need(textKey.officerName(), null, 'text.officerName', 'Nama tokoh petugas', TEXT_LIMITS.characterName);
    // Per-scenario status words are optional, but all five or none (an incomplete set falls back to the default words).
    if (MOOD_BANDS.some((b) => filled(textKey.moodLabel(b)))) {
      for (const band of MOOD_BANDS) {
        need(textKey.moodLabel(band), null, `text.moodLabel.${band}`, `Kata status ${bandRange(band)} (isi kelimanya atau kosongkan semuanya)`, TEXT_LIMITS.moodLabel);
      }
    }
    content.cast.forEach((m, mi) => {
      need(textKey.castName(m.id), null, `cast[${mi}].name`, `Nama tokoh pendukung ${mi + 1}`, TEXT_LIMITS.characterName);
      optional(textKey.castRole(m.id), null, `cast[${mi}].role`, `Peran tokoh pendukung ${mi + 1}`, TEXT_LIMITS.castRole);
    });
    content.intro.forEach((l, li) => need(textKey.introLine(l.id), null, `intro[${li}]`, `Baris pembuka ${li + 1}`, TEXT_LIMITS.line));
    for (const flag of flagsLeft) optional(textKey.flagLabel(flag), null, `text.flagLabel.${flag}`, `Nama tanda "${flag}"`, TEXT_LIMITS.flagLabel);

    content.rounds.forEach((r, i) => {
      const n = i + 1;
      need(textKey.roundTitle(r.id), n, `rounds[${i}].title`, 'Judul babak', TEXT_LIMITS.roundTitle);
      titleWithoutName(textKey.roundTitle(r.id), n, `rounds[${i}].title`, 'Judul babak');
      optional(textKey.roundMeta(r.id), n, `rounds[${i}].meta`, 'Keterangan babak', TEXT_LIMITS.roundMeta);
      optional(textKey.roundAction(r.id), n, `rounds[${i}].action`, 'Label tombol keputusan', TEXT_LIMITS.action);
      optional(textKey.roundLesson(r.id), n, `rounds[${i}].lesson`, 'Pelajaran babak', TEXT_LIMITS.lesson);
      const lessonWords = wordCount(t[textKey.roundLesson(r.id)] ?? '');
      if (lessonWords > AUTHORING_HINTS.lessonWordsMax) {
        warn(n, `rounds[${i}].lesson`, 'lesson_long', `${at(n)}Pelajaran babak panjang (${lessonWords} kata); usahakan 15–25 kata, paling banyak ${AUTHORING_HINTS.lessonWordsMax}${lang}.`);
      }
      need(textKey.roundPrompt(r.id), n, `rounds[${i}].prompt`, 'Pertanyaan keputusan', TEXT_LIMITS.prompt);
      r.lines.forEach((l, li) => need(textKey.line(r.id, l.id), n, `rounds[${i}].lines[${li}]`, `Baris dialog ${li + 1}`, TEXT_LIMITS.line));
      for (const band of MOOD_BANDS) {
        const v = t[textKey.moodVariant(r.id, band)];
        if (v) checkText(v, n, `rounds[${i}].mood.${band}`, `Variasi status "${band}"`, TEXT_LIMITS.moodVariant);
      }
      // A round-level mentor reason replaces the per-choice reasons (they become optional).
      const roundReason = filled(textKey.roundReason(r.id));
      optional(textKey.roundReason(r.id), n, `rounds[${i}].reason`, 'Alasan dari mentor', TEXT_LIMITS.reason);
      const seen = new Map<string, number>();
      r.choices.forEach((c, ci) => {
        const label = `pilihan ${ci + 1}`;
        need(textKey.choiceText(r.id, c.id), n, `rounds[${i}].choices[${ci}].text`, `Teks ${label}`, TEXT_LIMITS.choiceText);
        need(textKey.choiceConsequence(r.id, c.id), n, `rounds[${i}].choices[${ci}].consequence`, `Konsekuensi ${label}`, TEXT_LIMITS.consequence);
        (roundReason ? optional : need)(textKey.choiceReason(r.id, c.id), n, `rounds[${i}].choices[${ci}].reason`, `Alasan ${label}`, TEXT_LIMITS.reason);
        optional(textKey.choiceReply(r.id, c.id), n, `rounds[${i}].choices[${ci}].reply`, `Balasan sesudah ${label}`, TEXT_LIMITS.reply);
        const norm = (t[textKey.choiceText(r.id, c.id)] ?? '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]/gu, '');
        if (norm) {
          const dup = seen.get(norm);
          if (dup !== undefined) err(n, `rounds[${i}].choices[${ci}].text`, 'choice_text_duplicate', `${roundLabel(i)}: teks ${label} sama dengan pilihan ${dup + 1}${lang}.`);
          else seen.set(norm, ci);
        }
      });
      need(textKey.timeoutConsequence(r.id), n, `rounds[${i}].timeout.consequence`, 'Konsekuensi saat waktu habis', TEXT_LIMITS.consequence);
      optional(textKey.timeoutReason(r.id), n, `rounds[${i}].timeout.reason`, 'Alasan saat waktu habis', TEXT_LIMITS.reason);
      optional(textKey.timeoutReply(r.id), n, `rounds[${i}].timeout.reply`, 'Balasan saat waktu habis', TEXT_LIMITS.reply);

      r.evidence.forEach((e, ei) => {
        const ef = `rounds[${i}].evidence[${ei}]`;
        const rowKind = EVIDENCE_ROW_KINDS.includes(e.kind);
        need(textKey.evidenceTitle(r.id, e.id), n, `${ef}.title`, `Judul berkas ${ei + 1}`, TEXT_LIMITS.evidenceTitle);
        optional(textKey.evidenceKicker(r.id, e.id), n, `${ef}.kicker`, `Label jenis berkas ${ei + 1}`, TEXT_LIMITS.evidenceKicker);
        (e.kind === 'document' ? need : optional)(textKey.evidenceBody(r.id, e.id), n, `${ef}.body`, `Isi berkas ${ei + 1}`, TEXT_LIMITS.evidenceBody);
        e.rows.forEach((row, ri) => {
          (rowKind ? need : optional)(textKey.evidenceRow(r.id, e.id, row.id), n, `${ef}.rows[${ri}].label`, `Berkas ${ei + 1}, baris ${ri + 1}`, TEXT_LIMITS.evidenceRow);
          optional(textKey.evidenceRowValue(r.id, e.id, row.id), n, `${ef}.rows[${ri}].value`, `Berkas ${ei + 1}, nilai baris ${ri + 1}`, TEXT_LIMITS.evidenceRow);
        });
      });

      // Authoring guidance (warnings only): concise options whose length does not give the recommended one away.
      const audit = auditRound(content, r, locale);
      audit.options.forEach((o, ci) => {
        if (!filled(textKey.choiceText(r.id, o.choiceId))) return;
        const field = `rounds[${i}].choices[${ci}].text`;
        if (o.words > AUTHORING_HINTS.choiceWordsMax) {
          warn(n, field, 'choice_long', `${at(n)}Teks pilihan ${ci + 1} panjang (${o.words} kata); usahakan 8–16 kata, paling banyak ${AUTHORING_HINTS.choiceWordsMax}${lang}.`);
        }
        if (o.classification !== 'tepat' || o.rankLongest !== 1) return;
        const others = audit.options.filter((x) => x !== o).map((x) => x.chars);
        const typical = others.length ? median(others) : 0;
        if (typical > 0 && o.chars >= AUTHORING_HINTS.lengthTellRatio * typical) {
          warn(n, field, 'choice_length_hint', `${at(n)}Pilihan ${ci + 1} (tepat) paling panjang (${o.chars} karakter; median pilihan lain ${Math.round(typical)}), jadi mudah ditebak dari panjangnya. Samakan panjang, bentuk, dan tingkat detail kelima pilihan${lang}.`);
        }
      });
    });

    content.endings.forEach((e, ei) => {
      need(textKey.endingTitle(e.id), null, `endings[${ei}].title`, `Judul akhir ${ei + 1}`, TEXT_LIMITS.endingTitle);
      // An ending needs its text, or the customer's closing words instead.
      if (filled(textKey.endingCustomer(e.id))) optional(textKey.endingText(e.id), null, `endings[${ei}].text`, `Teks akhir ${ei + 1}`, TEXT_LIMITS.endingText);
      else need(textKey.endingText(e.id), null, `endings[${ei}].text`, `Teks akhir ${ei + 1} (atau kata-kata customer)`, TEXT_LIMITS.endingText);
      optional(textKey.endingCustomer(e.id), null, `endings[${ei}].customer`, `Kata-kata customer di akhir ${ei + 1}`, TEXT_LIMITS.endingText);
      optional(textKey.endingMentor(e.id), null, `endings[${ei}].mentor`, `Kata-kata mentor di akhir ${ei + 1}`, TEXT_LIMITS.endingText);
    });
  }
  return issues;
}

export const hasErrors = (issues: readonly ContentIssue[]): boolean => issues.some((i) => i.severity === 'error');
