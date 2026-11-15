/**
 * Story Room scenario content schema (v2) — the single data contract shared by the CMS, the server room runtime and
 * the preview. Pure types/constants: no I/O, no secrets (scenario content lives in the database, never in source).
 *
 * Player-facing text is stored separately from game logic (PRD FR-A10): logic objects carry stable IDs only, and every
 * string lives in `text[locale][key]` under a key derived from those IDs (see `textKey`). Translating a scenario adds
 * a locale map; it never duplicates or alters the logic.
 *
 * Fields added after the first release (cast, intro, layout, keyRound, flags, author notes, nullable customer; in v2
 * the activity layouts, evidence, the respondent and the choice form) are OPTIONAL in stored JSON:
 * `sanitizeScenarioContent` (validate.ts) fills their defaults on every load and upgrades v1 content to v2, so content
 * saved before them validates and plays exactly as before.
 */

/** PRD v0.2 decision log #4: 15 decisions per session. */
export const STORY_ROUND_COUNT = 15;
/** PRD appendices A/B: five choices per decision (the body says "up to five"; DECISIONS.md D-04). */
export const STORY_CHOICE_COUNT = 5;

/** v2 added the activity layouts (dossier, field), evidence and the respondent. v1 content is upgraded by sanitize. */
export const CONTENT_SCHEMA_VERSION = 2 as const;

/** Content locales the schema can hold. Indonesian is the MVP language; others prove translation readiness. */
export const CONTENT_LOCALES = ['id', 'en'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];
export const DEFAULT_CONTENT_LOCALE: ContentLocale = 'id';

/** Customer state is a 0..100 mood scale carried across rounds (PRD "Perjalanan Customer"). */
export const MOOD_MIN = 0;
export const MOOD_MAX = 100;
export const MOOD_BANDS = ['sangat_kecewa', 'kecewa', 'ragu', 'tenang', 'senang'] as const;
export type MoodBand = (typeof MOOD_BANDS)[number];
/** Lower bound (inclusive) of each band; a band ends where the next begins. */
export const MOOD_BAND_FLOOR: Record<MoodBand, number> = {
  sangat_kecewa: 0,
  kecewa: 20,
  ragu: 40,
  tenang: 60,
  senang: 80,
};
/** Allowed authored mood change per choice/timeout/delayed effect (keeps one decision from deciding the whole journey). */
export const MOOD_DELTA_LIMIT = 40;

/** Committee classification of a choice (PRD FR-A5). Process correctness, NOT customer happiness. */
export const CLASSIFICATIONS = ['tepat', 'kurang_tepat', 'keliru'] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

/**
 * How a choice reads to the player: `message` = words sent to the contact (a reply draft in a chat); `action` = a step
 * taken without a message (e.g. not replying until a decision, closing the file), marked as such on the option and,
 * once sent in a chat, shown as a note instead of an outgoing bubble. Display only: never part of the answer key.
 */
export const CHOICE_FORMS = ['message', 'action'] as const;
export type ChoiceForm = (typeof CHOICE_FORMS)[number];

export const ENDING_KINDS = ['happy', 'with_notes', 'unhappy'] as const;
/**
 * `happy` = full happy ending; `with_notes` = claim resolved with caveats (PRD "Perjalanan Customer"); `unhappy` =
 * claim resolved but the customer is not satisfied ("Kurang puas").
 */
export type EndingKind = (typeof ENDING_KINDS)[number];

/** `cast` = a supporting character of the scenario, named by `DialogueLine.castId`. */
export const SPEAKERS = ['narrator', 'customer', 'officer', 'cast'] as const;
export type Speaker = (typeof SPEAKERS)[number];

export const ROUND_LAYOUTS = ['stage', 'chat', 'dossier', 'field'] as const;
/**
 * The round's activity: `stage` = scene with characters (legacy/demo); `chat` = one message thread (lines render as
 * bubbles, evidence as attachments); `dossier` = a desk of documents (evidence cards); `field` = one scene image with
 * numbered information points (evidence with a `spot`).
 */
export type RoundLayout = (typeof ROUND_LAYOUTS)[number];

/** What an evidence item is when opened: a text document, a status list, a sequence of steps, a comparison, a picture. */
export const EVIDENCE_KINDS = ['document', 'checklist', 'timeline', 'compare', 'photo'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
/** Status mark of a checklist/timeline row (shown as icon + word, never colour only); `check` = "perlu dicek". */
export const EVIDENCE_MARKS = ['none', 'ok', 'pending', 'missing', 'check'] as const;
export type EvidenceMark = (typeof EVIDENCE_MARKS)[number];
/** Evidence kinds whose content is a list of rows (the others show their body/picture). */
export const EVIDENCE_ROW_KINDS: readonly EvidenceKind[] = ['checklist', 'timeline', 'compare'];

export const CONTENT_SOURCES = ['demo', 'settled_case'] as const;
/** `demo` = synthetic local demonstration material (never an approved settled case). */
export type ContentSource = (typeof CONTENT_SOURCES)[number];

export type Difficulty = 1 | 2 | 3;

/** Supporting characters per scenario, opening lines, and delayed effects per round (enforced by validate.ts). */
export const MAX_CAST = 8;
export const MAX_INTRO_LINES = 6;
export const MAX_FLAG_EFFECTS = 3;
/** Evidence items per round and rows per checklist/timeline/compare item (enforced by validate.ts). */
export const MAX_EVIDENCE = 5;
export const MAX_EVIDENCE_ROWS = 12;
/**
 * A field marker is drawn within this range (percent of the picture's width/height) so it is never clipped by the
 * picture's edge. Stored spots may lie outside it (sanitize only clamps to 0–100); the room and the CMS draw them here.
 */
export const SPOT_SAFE_RANGE = { min: 6, max: 94 } as const;

/** A spot coordinate as it is drawn (within SPOT_SAFE_RANGE). */
export function drawnSpotCoordinate(v: number): number {
  return Math.min(SPOT_SAFE_RANGE.max, Math.max(SPOT_SAFE_RANGE.min, Number.isFinite(v) ? v : SPOT_SAFE_RANGE.min));
}

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  /** Cast member speaking when speaker === 'cast' (an id from ScenarioContent.cast); null otherwise. */
  castId: string | null;
  /** Delayed consequence: shown ONLY to participants holding this flag; never on shared screens. null = everyone. */
  ifFlag: string | null;
}

export interface ChoiceContent {
  /** Stable ID; grading always uses this ID, never the display position. */
  id: string;
  classification: Classification;
  /** Reviewer-configured accuracy in [0,1]: tepat = 1, keliru = 0, kurang_tepat strictly between (validate.ts). */
  accuracy: number;
  /** Customer mood change applied to the participant who picks this choice. */
  moodDelta: number;
  /** Marker this choice leaves for later rounds (delayed consequence, e.g. an unrealistic promise). null = none. */
  setsFlag: string | null;
  /** A message or an action without a message (see ChoiceForm). Default 'message'. */
  form: ChoiceForm;
}

/** Who speaks: a speaker kind plus the cast member when the speaker is `cast` (null otherwise). */
export interface SpeakerRef {
  speaker: Speaker;
  castId: string | null;
}

/** One row of a checklist/timeline/compare item; its label and value live in the text map (textKey.evidenceRow*). */
export interface EvidenceRow {
  /** CONTENT_ID_PATTERN, unique within the item. */
  id: string;
  mark: EvidenceMark;
}

/**
 * Shared information of a round (a document, checklist, timeline, comparison or picture), the same for ALL options and
 * every participant: opening it never scores or hints. Texts live in the text map (textKey.evidence*).
 */
export interface EvidenceItem {
  /** CONTENT_ID_PATTERN, unique within the round. */
  id: string;
  kind: EvidenceKind;
  /**
   * Image shown when opened: an UPLOADED asset of kind `photo` or `background` (built-in backgrounds are drawn by client
   * code and have no image file), e.g. a damage photo, a sign close-up, a lane diagram.
   */
  assetId: string | null;
  /** `field` rounds: marker position on the round background in percent of width/height (0–100). null = list only. */
  spot: { x: number; y: number } | null;
  /** Rows of a checklist/timeline/compare item (texts in the text map). */
  rows: EvidenceRow[];
}

/** Delayed consequence resolved when a round begins (engine.moodAtRoundStart). */
export interface FlagEffect {
  /** Flag left by a choice in an EARLIER round (CONTENT_ID_PATTERN). */
  flag: string;
  /** Mood change applied when this round BEGINS, for participants holding `flag` (set in an earlier round). */
  moodDelta: number;
}

export interface RoundContent {
  id: string;
  /** Asset ID of kind `background` (built-in pixel location or uploaded image; a `field` round needs an uploaded image). */
  backgroundAssetId: string;
  /** Show the officer character (Miss Raksa or the scenario's officer) beside the customer (`stage` layout only). */
  showOfficer: boolean;
  /** Optional evidence media shown with the scene: asset of kind `photo` or `video`. */
  mediaAssetId: string | null;
  lines: DialogueLine[];
  choices: ChoiceContent[];
  /** Author-defined default consequence when the participant does not answer in time (PRD FR-C3). */
  timeout: { moodDelta: number };
  /** The round's activity (see RoundLayout). Default 'stage'. */
  layout: RoundLayout;
  /** Display-only "Babak kunci" badge (the weight is in the authored mood deltas). Default false. */
  keyRound: boolean;
  /** Delayed consequences resolved at the start of this round. Default []. Max MAX_FLAG_EFFECTS. */
  flagEffects: FlagEffect[];
  /** Internal note for authors/reviewers (open questions). CMS only — never sent to rooms. Default ''. */
  authorNote: string;
  /** Shared information for ALL options (v2). Default []. Max MAX_EVIDENCE. */
  evidence: EvidenceItem[];
  /** Who reacts after the decision (reply bubble/quote; v2). null = narration only (a narrator is stored as null). Default null. */
  respondent: SpeakerRef | null;
}

export interface EndingContent {
  id: string;
  kind: EndingKind;
  /** Inclusive bounds; null = unbounded. Evaluated in list order, first match wins (engine.selectEnding). */
  minMood: number | null;
  maxMood: number | null;
  minScore: number | null;
  maxScore: number | null;
}

/** A supporting character who speaks (besides customer and officer); the name lives in `text` (textKey.castName). */
export interface CastMember {
  /** CONTENT_ID_PATTERN. */
  id: string;
  /** Optional portrait (asset kind `character`); null = name only. */
  characterAssetId: string | null;
}

export interface ScenarioPresentation {
  /** Customer character asset (kind `character`), or null = no portrait (name + status only). */
  customerCharacterId: string | null;
  /** Asset ID of the officer character, or null for scenes without an officer. */
  officerCharacterId: string | null;
  /**
   * Customer expression per mood band; values must exist in the customer character's expression list. Required (and
   * checked) only when customerCharacterId is set; otherwise may hold '' values.
   */
  moodExpressions: Record<MoodBand, string>;
  /** Optional background music (asset of kind `bgm`); players can always mute it. */
  bgmAssetId: string | null;
}

/** Asset kinds of the library (PRD FR-A9, FR-E4). */
export const ASSET_KINDS = ['background', 'character', 'photo', 'video', 'bgm'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export interface ScenarioContent {
  /** Always the current version: sanitizeScenarioContent upgrades older content (additive fields get their defaults). */
  schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  categoryId: string;
  difficulty: Difficulty;
  locales: ContentLocale[];
  /** Customer mood at the start of round 1. Later rounds continue from each participant's own carried mood. */
  initialMood: number;
  contentSource: ContentSource;
  presentation: ScenarioPresentation;
  /** Supporting characters who speak (besides customer and officer). Default []. Max MAX_CAST. */
  cast: CastMember[];
  /** Opening lines shown before round 1 (e.g. the mentor introducing the case). Default []. Max MAX_INTRO_LINES. No ifFlag. */
  intro: DialogueLine[];
  rounds: RoundContent[];
  endings: EndingContent[];
  /** Internal notes for authors/reviewers (e.g. items to confirm). CMS only — never sent to rooms. Default ''. */
  authorNotes: string;
  text: Partial<Record<ContentLocale, Record<string, string>>>;
}

// ------------------------------------------------------------------ text keys

export const textKey = {
  title: () => 'scenario.title',
  synopsis: () => 'scenario.synopsis',
  /** Display names of the scenario's characters (speaker labels, mood captions). */
  customerName: () => 'scenario.customerName',
  officerName: () => 'scenario.officerName',
  /** Optional per-scenario status word of a mood band (all five or none; see scene.scenarioMoodLabels). */
  moodLabel: (band: MoodBand) => `scenario.mood.${band}`,
  /** Required for every cast member. */
  castName: (castId: string) => `cast.${castId}.name`,
  /** Optional staff-facing description, e.g. "Petugas lapangan". */
  castRole: (castId: string) => `cast.${castId}.role`,
  /** Required for every opening line. */
  introLine: (lineId: string) => `intro.line.${lineId}`,
  roundTitle: (roundId: string) => `round.${roundId}.title`,
  /** Optional kicker above the round title, e.g. phase and time of day. */
  roundMeta: (roundId: string) => `round.${roundId}.meta`,
  roundPrompt: (roundId: string) => `round.${roundId}.prompt`,
  /** Optional mentor's reason for the whole round, shown in the final summary; makes choice reasons optional. */
  roundReason: (roundId: string) => `round.${roundId}.reason`,
  /** Optional confirm-button label (e.g. "Ajukan berkas"); empty = the client's default for the layout. */
  roundAction: (roundId: string) => `round.${roundId}.action`,
  /** Optional one short lesson shown once the answers are closed. */
  roundLesson: (roundId: string) => `round.${roundId}.lesson`,
  line: (roundId: string, lineId: string) => `round.${roundId}.line.${lineId}`,
  moodVariant: (roundId: string, band: MoodBand) => `round.${roundId}.mood.${band}`,
  choiceText: (roundId: string, choiceId: string) => `round.${roundId}.choice.${choiceId}.text`,
  choiceConsequence: (roundId: string, choiceId: string) => `round.${roundId}.choice.${choiceId}.consequence`,
  choiceReason: (roundId: string, choiceId: string) => `round.${roundId}.choice.${choiceId}.reason`,
  /** Optional words of the round's respondent after this choice. */
  choiceReply: (roundId: string, choiceId: string) => `round.${roundId}.choice.${choiceId}.reply`,
  timeoutConsequence: (roundId: string) => `round.${roundId}.timeout.consequence`,
  timeoutReason: (roundId: string) => `round.${roundId}.timeout.reason`,
  /** Optional words of the round's respondent when the participant did not answer in time. */
  timeoutReply: (roundId: string) => `round.${roundId}.timeout.reply`,
  /** Required for every evidence item. */
  evidenceTitle: (roundId: string, evidenceId: string) => `round.${roundId}.ev.${evidenceId}.title`,
  /** Optional short label shown instead of the kind word (e.g. "Daftar kontak", "Surat", "Lokasi"). */
  evidenceKicker: (roundId: string, evidenceId: string) => `round.${roundId}.ev.${evidenceId}.kicker`,
  /** Multiline; required for `document` items, optional otherwise. */
  evidenceBody: (roundId: string, evidenceId: string) => `round.${roundId}.ev.${evidenceId}.body`,
  /** Required for every row of a checklist/timeline/compare item. */
  evidenceRow: (roundId: string, evidenceId: string, rowId: string) => `round.${roundId}.ev.${evidenceId}.row.${rowId}`,
  /** Optional value beside a row (e.g. a time on a timeline, the other side of a comparison). */
  evidenceRowValue: (roundId: string, evidenceId: string, rowId: string) => `round.${roundId}.ev.${evidenceId}.row.${rowId}.value`,
  /** Optional name of a flag (e.g. the promise it stands for) in private reminders and the final summary. */
  flagLabel: (flag: string) => `flag.${flag}.label`,
  endingTitle: (endingId: string) => `ending.${endingId}.title`,
  /** Required only when the ending has no customer words. */
  endingText: (endingId: string) => `ending.${endingId}.text`,
  /** Optional closing words of the customer. */
  endingCustomer: (endingId: string) => `ending.${endingId}.customer`,
  /** Optional closing words of the mentor (officer). */
  endingMentor: (endingId: string) => `ending.${endingId}.mentor`,
} as const;

/** Text maximum lengths (characters) enforced by validation and the CMS inputs. */
export const TEXT_LIMITS = {
  title: 80,
  synopsis: 400,
  /** Customer, officer and cast names. */
  characterName: 40,
  castRole: 80,
  moodLabel: 24,
  roundTitle: 60,
  roundMeta: 80,
  prompt: 200,
  /** Round lines and opening lines. */
  line: 320,
  moodVariant: 240,
  choiceText: 360,
  consequence: 420,
  /** Choice/timeout reasons and the round's mentor reason (settled-case mentor reasons run up to ~500 characters). */
  reason: 600,
  /** Confirm-button label of a round. */
  action: 24,
  lesson: 220,
  /** Respondent's words after a choice or a timeout. */
  reply: 220,
  evidenceTitle: 40,
  /** Label of an evidence item shown instead of its kind word. */
  evidenceKicker: 24,
  evidenceBody: 500,
  /** Row label and row value of an evidence item. */
  evidenceRow: 120,
  flagLabel: 80,
  endingTitle: 80,
  /** Ending text, customer words and mentor words. */
  endingText: 600,
  /** Internal notes (never sent to rooms): sanitize caps them at these lengths, so they are generous. */
  authorNote: 1500,
  authorNotes: 12000,
} as const;

/** Text in `locale` (falls back to the default locale, then to ''). Never throws. */
export function contentText(content: Pick<ScenarioContent, 'text'>, locale: ContentLocale, key: string): string {
  return content.text[locale]?.[key] ?? content.text[DEFAULT_CONTENT_LOCALE]?.[key] ?? '';
}

// ------------------------------------------------------------------ player-name placeholder

/**
 * The only text placeholder: the participant's own name. Servers send and persist templates; clients substitute at
 * render time (participant views: their own name; projector/host: a neutral word).
 */
export const PLAYER_NAME_TOKEN = '{nama}';

/** Replace every {nama} with the given name (participant's own name, or a neutral word on shared screens). */
export function personalize(text: string, name: string): string {
  // split/join: the name is inserted literally (no `$&`-style replacement patterns).
  return text.split(PLAYER_NAME_TOKEN).join(name);
}

const PLACEHOLDER_PATTERN = /\{[^{}]*\}/g;

/** Every `{…}` token in `text`, in order. */
export function placeholdersIn(text: string): string[] {
  return text.match(PLACEHOLDER_PATTERN) ?? [];
}

/** `{…}` tokens other than PLAYER_NAME_TOKEN (shown literally to players, so validation rejects them). */
export function unknownPlaceholders(text: string): string[] {
  return placeholdersIn(text).filter((p) => p !== PLAYER_NAME_TOKEN);
}

// ------------------------------------------------------------------ ids

/**
 * Stable random-looking ID for new content objects (CMS). `prefix` keeps IDs readable in reports: r = round,
 * c = choice, l = line (round or opening), e = ending, k = cast member, f = flag, v = evidence item, w = evidence row.
 */
export function newContentId(prefix: 'r' | 'c' | 'l' | 'e' | 'k' | 'f' | 'v' | 'w', random: () => number = Math.random): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(random() * alphabet.length)];
  return `${prefix}_${out}`;
}

/** ID pattern accepted for rounds, choices, lines, endings, cast members, flags, evidence items and rows (no dots: dots separate text-key segments). */
export const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_-]{1,31}$/;
