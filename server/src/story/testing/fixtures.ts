/**
 * TEST-ONLY fixtures for the Story Room suites: a synthetic, valid 15-round scenario with deterministic text, helpers
 * that add the optional features (cast, opening lines, delayed consequences, status-only endings, evidence) with
 * SYNTHETIC text, scenarios combining them, the stored shapes of older schema versions, a manual clock, and an
 * in-memory store. Never imported by production code.
 */
import {
  CONTENT_SCHEMA_VERSION,
  MOOD_BANDS,
  textKey,
  type ChoiceContent,
  type Classification,
  type EvidenceKind,
  type EvidenceMark,
  type RoundContent,
  type ScenarioContent,
  type Speaker,
} from '../../../../shared/story/content';
import type { ValidationContext } from '../../../../shared/story/validate';
import type { ParticipantFinal, RoundSettlement, StoryClock, StoryRoom, StoryRoomEvents, StoryRoomStore } from '../runtime/room';

/** Choice template per round: [classification, accuracy, moodDelta]. */
export const CHOICE_TEMPLATE: [Classification, number, number][] = [
  ['tepat', 1, 8],
  ['kurang_tepat', 0.5, 2],
  ['keliru', 0, -8],
  ['keliru', 0, -12],
  ['kurang_tepat', 0.25, 0],
];

export function buildTestScenario(opts: { categoryId?: string; rounds?: number } = {}): ScenarioContent {
  const text: Record<string, string> = {
    [textKey.title()]: 'Skenario Uji Otomatis',
    [textKey.synopsis()]: 'Skenario sintetis untuk pengujian mesin room.',
    [textKey.customerName()]: 'Bu Rina',
    [textKey.officerName()]: 'Miss Raksa',
  };
  const rounds: RoundContent[] = [];
  for (let i = 0; i < (opts.rounds ?? 15); i++) {
    const rid = `r${String(i + 1).padStart(2, '0')}`;
    const choices: ChoiceContent[] = CHOICE_TEMPLATE.map(([classification, accuracy, moodDelta], ci) => ({ id: `c${ci + 1}`, classification, accuracy, moodDelta, setsFlag: null, form: 'message' }));
    rounds.push({
      id: rid,
      backgroundAssetId: 'builtin:bg:meja',
      showOfficer: true,
      mediaAssetId: null,
      lines: [
        { id: 'l1', speaker: 'customer', castId: null, ifFlag: null },
        { id: 'l2', speaker: 'officer', castId: null, ifFlag: null },
      ],
      choices,
      timeout: { moodDelta: -5 },
      layout: 'stage',
      keyRound: false,
      flagEffects: [],
      authorNote: '',
      evidence: [],
      respondent: null,
    });
    text[textKey.roundTitle(rid)] = `Tahap ${i + 1}`;
    text[textKey.roundPrompt(rid)] = `Apa langkah terbaik pada tahap ${i + 1}?`;
    text[textKey.line(rid, 'l1')] = `Customer menjelaskan keadaan tahap ${i + 1}.`;
    text[textKey.line(rid, 'l2')] = `Petugas mendengarkan pada tahap ${i + 1}.`;
    text[textKey.moodVariant(rid, 'sangat_kecewa')] = `Customer tampak sangat kecewa di tahap ${i + 1}.`;
    text[textKey.timeoutConsequence(rid)] = `Waktu habis di tahap ${i + 1}; customer menunggu tanpa kepastian.`;
    text[textKey.timeoutReason(rid)] = 'Keputusan yang tertunda membuat customer makin cemas.';
    choices.forEach((c, ci) => {
      text[textKey.choiceText(rid, c.id)] = `Pilihan ${ci + 1} untuk tahap ${i + 1}`;
      text[textKey.choiceConsequence(rid, c.id)] = `Akibat pilihan ${ci + 1} di tahap ${i + 1}.`;
      text[textKey.choiceReason(rid, c.id)] = `Alasan pilihan ${ci + 1} di tahap ${i + 1}.`;
    });
  }
  text[textKey.endingTitle('happy')] = 'Klaim tuntas, customer senang';
  text[textKey.endingText('happy')] = 'Semua langkah berjalan baik.';
  text[textKey.endingTitle('notes')] = 'Klaim selesai dengan catatan';
  text[textKey.endingText('notes')] = 'Klaim selesai, tetapi ada catatan untuk perbaikan.';
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    categoryId: opts.categoryId ?? 'auto',
    difficulty: 1,
    locales: ['id'],
    initialMood: 25,
    contentSource: 'demo',
    presentation: {
      customerCharacterId: 'builtin:char:bu-rina',
      officerCharacterId: 'builtin:char:miss-raksa',
      moodExpressions: { sangat_kecewa: 'kesal', kecewa: 'cemas', ragu: 'bingung', tenang: 'lega', senang: 'senang' },
      bgmAssetId: null,
    },
    cast: [],
    intro: [],
    rounds,
    endings: [
      { id: 'happy', kind: 'happy', minMood: 70, maxMood: null, minScore: 9000, maxScore: null },
      { id: 'notes', kind: 'with_notes', minMood: null, maxMood: null, minScore: null, maxScore: null },
    ],
    authorNotes: '',
    text: { id: text },
  };
}

// ------------------------------------------------------------------ optional features (synthetic text, mutate + return)

/** Adds a supporting character with a display name (and optional staff-facing role / portrait asset). */
export function addTestCast(c: ScenarioContent, id: string, name: string, opts: { role?: string; characterAssetId?: string | null } = {}): ScenarioContent {
  c.cast.push({ id, characterAssetId: opts.characterAssetId ?? null });
  c.text.id![textKey.castName(id)] = name;
  if (opts.role) c.text.id![textKey.castRole(id)] = opts.role;
  return c;
}

/** Appends opening lines (ids i1, i2, …), shown with round 1. */
export function addTestIntro(c: ScenarioContent, lines: { speaker: Speaker; text: string; castId?: string }[]): ScenarioContent {
  for (const l of lines) {
    const id = `i${c.intro.length + 1}`;
    c.intro.push({ id, speaker: l.speaker, castId: l.speaker === 'cast' ? l.castId ?? null : null, ifFlag: null });
    c.text.id![textKey.introLine(id)] = l.text;
  }
  return c;
}

/**
 * Delayed consequence: choice `choiceId` of round `setRound` (1-based) leaves `flag`; round `effectRound` applies
 * `moodDelta` when it begins and OPENS with a conditional customer line (id `lf1`, `lf2`, …) only flag holders see.
 */
export function addTestDelayedConsequence(
  c: ScenarioContent,
  o: { flag: string; setRound: number; choiceId: string; effectRound: number; moodDelta: number; lineText?: string },
): ScenarioContent {
  const choice = c.rounds[o.setRound - 1]!.choices.find((x) => x.id === o.choiceId);
  if (!choice) throw new Error(`No choice ${o.choiceId} in round ${o.setRound}`);
  choice.setsFlag = o.flag;
  const round = c.rounds[o.effectRound - 1]!;
  round.flagEffects.push({ flag: o.flag, moodDelta: o.moodDelta });
  const lineId = `lf${round.lines.filter((l) => l.ifFlag).length + 1}`;
  round.lines.unshift({ id: lineId, speaker: 'customer', castId: null, ifFlag: o.flag });
  c.text.id![textKey.line(round.id, lineId)] = o.lineText ?? `Customer menagih janji dari tahap ${o.setRound}.`;
  return c;
}

/** Endings by status only (no score bounds): happy from 70, with notes from 45, unhappy as the fallback; with customer/mentor words. */
export function useMoodOnlyEndings(c: ScenarioContent): ScenarioContent {
  c.endings = [
    { id: 'mood_high', kind: 'happy', minMood: 70, maxMood: null, minScore: null, maxScore: null },
    { id: 'mood_mid', kind: 'with_notes', minMood: 45, maxMood: null, minScore: null, maxScore: null },
    { id: 'mood_low', kind: 'unhappy', minMood: null, maxMood: null, minScore: null, maxScore: null },
  ];
  const text = c.text.id!;
  for (const key of Object.keys(text)) if (key.startsWith('ending.')) delete text[key];
  Object.assign(text, {
    [textKey.endingTitle('mood_high')]: 'Customer puas',
    [textKey.endingCustomer('mood_high')]: '"Terima kasih, {nama}. Saya selalu tahu kabarnya."',
    [textKey.endingMentor('mood_high')]: '"Rapi sekali, {nama}."',
    [textKey.endingTitle('mood_mid')]: 'Selesai dengan catatan',
    [textKey.endingText('mood_mid')]: 'Klaim selesai, tetapi customer sempat menunggu tanpa kabar.',
    [textKey.endingMentor('mood_mid')]: '"Kabar rutin akan membantu, {nama}."',
    [textKey.endingTitle('mood_low')]: 'Customer kurang puas',
    [textKey.endingCustomer('mood_low')]: '"Klaimnya selesai, tetapi saya lelah menunggu."',
  });
  return c;
}

/** SYNTHETIC texts and ids of `buildFeatureScenario` that tests assert on. */
export const FEATURE = {
  flag: 'tanda_uji',
  /** Round (1-based) whose choice c2 leaves `flag`, and the round that reacts to it. */
  setRound: 2,
  effectRound: 4,
  delayedDelta: -12,
  flagLine: 'Bu Rina mengingatkan pesan yang dulu belum dibalas.',
  castId: 'kurir',
  castName: 'Mas Kurir',
  castRole: 'Pengantar barang (uji)',
  castPortrait: 'builtin:char:bu-rina',
  introOfficer: 'Selamat datang di sesi latihan, {nama}.',
  introCast: 'Saya kurir yang mengantar paket tadi pagi.',
  chatMeta: 'Tahap dua · sesi uji',
  mentorReason: 'Alasan mentor uji: catat setiap langkah dengan rapi.',
  nameChoice: 'Pilihan 1 untuk tahap 1, oleh {nama}',
  authorNotes: 'CATATAN-INTERNAL-UJI: hanya untuk penulis.',
  roundNote: 'CATATAN-BABAK-UJI: hanya untuk reviewer.',
  moodLabels: { sangat_kecewa: 'Murung', kecewa: 'Gundah', ragu: 'Bimbang', tenang: 'Reda', senang: 'Gembira' },
} as const;

/**
 * A publishable scenario using every optional feature, shaped like a settled-case script but with SYNTHETIC text: no
 * customer portrait, per-scenario status words, a cast member (with a portrait), two opening lines, a chat round with a
 * kicker, a key round with a mentor reason, a delayed consequence (round 2 choice c2 leaves FEATURE.flag; round 4 applies
 * −12 when it begins and opens with a line only flag holders see), status-only endings, author notes, and a choice text
 * with {nama}.
 */
export function buildFeatureScenario(): ScenarioContent {
  const c = buildTestScenario();
  addTestDelayedConsequence(c, { flag: FEATURE.flag, setRound: FEATURE.setRound, choiceId: 'c2', effectRound: FEATURE.effectRound, moodDelta: FEATURE.delayedDelta, lineText: FEATURE.flagLine });
  useMoodOnlyEndings(c);
  addTestCast(c, FEATURE.castId, FEATURE.castName, { role: FEATURE.castRole, characterAssetId: FEATURE.castPortrait });
  addTestIntro(c, [
    { speaker: 'officer', text: FEATURE.introOfficer },
    { speaker: 'cast', castId: FEATURE.castId, text: FEATURE.introCast },
  ]);
  c.presentation.customerCharacterId = null;
  c.presentation.moodExpressions = { sangat_kecewa: '', kecewa: '', ragu: '', tenang: '', senang: '' };
  const text = c.text.id!;
  for (const band of MOOD_BANDS) text[textKey.moodLabel(band)] = FEATURE.moodLabels[band];
  text[textKey.choiceText(c.rounds[0]!.id, 'c1')] = FEATURE.nameChoice;
  const chat = c.rounds[1]!;
  chat.layout = 'chat';
  chat.showOfficer = false;
  chat.lines.push({ id: 'l3', speaker: 'cast', castId: FEATURE.castId, ifFlag: null }, { id: 'l4', speaker: 'narrator', castId: null, ifFlag: null });
  text[textKey.roundMeta(chat.id)] = FEATURE.chatMeta;
  text[textKey.line(chat.id, 'l3')] = 'Mas Kurir mengirim pesan singkat.';
  text[textKey.line(chat.id, 'l4')] = 'Pesan masuk ke ponsel petugas.';
  const key = c.rounds[FEATURE.effectRound - 1]!;
  key.keyRound = true;
  key.authorNote = FEATURE.roundNote;
  text[textKey.roundReason(key.id)] = FEATURE.mentorReason;
  c.authorNotes = FEATURE.authorNotes;
  return c;
}

/** An evidence item with its texts, for addTestEvidence. */
export interface TestEvidence {
  id: string;
  kind: EvidenceKind;
  /** Label shown instead of the kind word (none = the kind word). */
  kicker?: string;
  title: string;
  body?: string;
  assetId?: string | null;
  spot?: { x: number; y: number } | null;
  /** [rowId, mark, label, value?] (no value = none). */
  rows?: [string, EvidenceMark, string, string?][];
}

/** Adds an evidence item with its texts to round `roundNumber` (1-based). Mutates and returns `c`. */
export function addTestEvidence(c: ScenarioContent, roundNumber: number, item: TestEvidence): ScenarioContent {
  const round = c.rounds[roundNumber - 1]!;
  const text = c.text.id!;
  round.evidence.push({ id: item.id, kind: item.kind, assetId: item.assetId ?? null, spot: item.spot ?? null, rows: (item.rows ?? []).map(([id, mark]) => ({ id, mark })) });
  text[textKey.evidenceTitle(round.id, item.id)] = item.title;
  if (item.kicker) text[textKey.evidenceKicker(round.id, item.id)] = item.kicker;
  if (item.body) text[textKey.evidenceBody(round.id, item.id)] = item.body;
  for (const [rowId, , label, value] of item.rows ?? []) {
    text[textKey.evidenceRow(round.id, item.id, rowId)] = label;
    if (value) text[textKey.evidenceRowValue(round.id, item.id, rowId)] = value;
  }
  return c;
}

/** SYNTHETIC texts and ids of `buildGameplayScenario` that tests assert on (rounds are 1-based). */
export const GAMEPLAY = {
  chatRound: 2,
  dossierRound: 3,
  fieldRound: 5,
  flagLabel: 'Janji kabar sebelum Jumat (uji)',
  action: 'Ajukan berkas uji',
  lesson: 'Pelajaran uji: kabari customer di setiap tahap.',
  effectLesson: 'Pelajaran uji: janji tanpa dasar akan ditagih.',
  chatReplyC1: 'Baik, saya tunggu kabarnya.',
  chatReplyC2: 'Jumat ya, saya pegang janjinya.',
  /** Choice of the chat round that is an action without a message (form 'action'), and its text. */
  actionChoice: 'c5',
  actionText: 'Tandai pesan uji sudah dibaca, tanpa membalas dulu.',
  timeoutReply: 'Halo? Masih ada yang membaca pesan saya?',
  castReply: 'Titiknya sudah saya tandai di foto.',
  documentTitle: 'Surat uji',
  /** The document's label instead of the kind word. */
  documentKicker: 'Lembar uji',
  documentBody: 'Isi surat uji.\nBaris kedua surat uji.',
  checklistTitle: 'Daftar berkas uji',
  photoTitle: 'Foto lokasi uji',
  timelineTitle: 'Urutan kejadian uji',
  /**
   * An UPLOADED background (testValidationContext knows it; built-ins have no image file, so they can be neither a field
   * scene picture nor an evidence picture): the field round's scene picture and its photo.
   */
  image: 'asset:latar-uji',
} as const;

/**
 * `buildFeatureScenario` plus the v2 gameplay features with SYNTHETIC text: a flag label for FEATURE.flag; the chat
 * round (2) with the customer as respondent, replies for c1/c2, a timeout reply and an action option without a message
 * (GAMEPLAY.actionChoice); a dossier round (3) with a document (with a kicker) and a checklist, an action label and the
 * customer as respondent; a field round (5) on `image` (default GAMEPLAY.image; a test against a real library passes an
 * uploaded one) with a spotted photo of the same picture and a timeline, the cast member as respondent; lessons in
 * rounds 2–5. Publishable.
 */
export function buildGameplayScenario(opts: { image?: string } = {}): ScenarioContent {
  const image = opts.image ?? GAMEPLAY.image;
  const c = buildFeatureScenario();
  const text = c.text.id!;
  const round = (n: number) => c.rounds[n - 1]!;
  text[textKey.flagLabel(FEATURE.flag)] = GAMEPLAY.flagLabel;

  const chat = round(GAMEPLAY.chatRound);
  chat.respondent = { speaker: 'customer', castId: null };
  text[textKey.choiceReply(chat.id, 'c1')] = GAMEPLAY.chatReplyC1;
  text[textKey.choiceReply(chat.id, 'c2')] = GAMEPLAY.chatReplyC2;
  text[textKey.timeoutReply(chat.id)] = GAMEPLAY.timeoutReply;
  text[textKey.roundLesson(chat.id)] = GAMEPLAY.lesson;
  chat.choices.find((ch) => ch.id === GAMEPLAY.actionChoice)!.form = 'action';
  text[textKey.choiceText(chat.id, GAMEPLAY.actionChoice)] = GAMEPLAY.actionText;

  const dossier = round(GAMEPLAY.dossierRound);
  dossier.layout = 'dossier';
  dossier.respondent = { speaker: 'customer', castId: null };
  addTestEvidence(c, GAMEPLAY.dossierRound, { id: 'surat', kind: 'document', kicker: GAMEPLAY.documentKicker, title: GAMEPLAY.documentTitle, body: GAMEPLAY.documentBody });
  addTestEvidence(c, GAMEPLAY.dossierRound, {
    id: 'daftar',
    kind: 'checklist',
    title: GAMEPLAY.checklistTitle,
    rows: [
      ['formulir', 'ok', 'Formulir uji'],
      ['foto', 'missing', 'Foto uji'],
      ['surat', 'check', 'Surat keterangan uji', 'perlu dicek'],
    ],
  });
  text[textKey.roundAction(dossier.id)] = GAMEPLAY.action;
  text[textKey.roundLesson(dossier.id)] = GAMEPLAY.lesson;

  text[textKey.roundLesson(round(FEATURE.effectRound).id)] = GAMEPLAY.effectLesson;

  const field = round(GAMEPLAY.fieldRound);
  field.layout = 'field';
  field.backgroundAssetId = image;
  field.respondent = { speaker: 'cast', castId: FEATURE.castId };
  addTestEvidence(c, GAMEPLAY.fieldRound, { id: 'foto', kind: 'photo', title: GAMEPLAY.photoTitle, assetId: image, spot: { x: 30, y: 60 } });
  addTestEvidence(c, GAMEPLAY.fieldRound, {
    id: 'urutan',
    kind: 'timeline',
    title: GAMEPLAY.timelineTitle,
    spot: { x: 70, y: 40 },
    rows: [
      ['t1', 'ok', 'Unit tiba di lokasi uji', '08.00'],
      ['t2', 'pending', 'Pemeriksaan uji', '09.30'],
    ],
  });
  text[textKey.choiceReply(field.id, 'c1')] = GAMEPLAY.castReply;
  text[textKey.roundLesson(field.id)] = GAMEPLAY.lesson;
  return c;
}

/**
 * The JSON shape stored BEFORE cast/intro/layout/keyRound/flags/author notes existed (and with the customer character
 * as a plain string), schema version 1: what the oldest drafts and published versions hold in the database.
 */
export function legacyShapeOf(c: ScenarioContent): Record<string, unknown> {
  const { cast: _cast, intro: _intro, authorNotes: _notes, ...rest } = structuredClone(c);
  return {
    ...rest,
    schemaVersion: 1,
    presentation: { ...rest.presentation, customerCharacterId: rest.presentation.customerCharacterId ?? '' },
    rounds: rest.rounds.map(({ layout: _l, keyRound: _k, flagEffects: _f, authorNote: _n, evidence: _e, respondent: _r, ...r }) => ({
      ...r,
      lines: r.lines.map(({ id, speaker }) => ({ id, speaker })),
      choices: r.choices.map(({ setsFlag: _s, form: _form, ...choice }) => choice),
    })),
  };
}

/** The JSON shape a schema-v1 release stored (all v1 fields, no evidence/respondent/choice form; layouts stage/chat only). */
export function schemaV1ShapeOf(c: ScenarioContent): Record<string, unknown> {
  const clone = structuredClone(c);
  return {
    ...clone,
    schemaVersion: 1,
    rounds: clone.rounds.map(({ evidence: _e, respondent: _r, ...r }) => ({ ...r, choices: r.choices.map(({ form: _form, ...choice }) => choice) })),
  };
}

/** The JSON shape v2 content had before choices carried a form (schema version 2 throughout). */
export function withoutChoiceForms(c: ScenarioContent): Record<string, unknown> {
  const clone = structuredClone(c);
  return { ...clone, rounds: clone.rounds.map((r) => ({ ...r, choices: r.choices.map(({ form: _form, ...choice }) => choice) })) };
}

/**
 * The asset library of the unit tests: built-in pixel art (`builtin:` ids, drawn by client code, no image file) and
 * uploaded assets (`asset:` ids), as the seeded database names them.
 */
export function testValidationContext(): ValidationContext {
  const library: [id: string, kind: string, opts?: { expressions?: string[]; archived?: boolean }][] = [
    ['builtin:bg:meja', 'background'],
    ['builtin:bg:parkiran', 'background'],
    ['builtin:bg:telepon', 'background'],
    ['builtin:char:bu-rina', 'character', { expressions: ['netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum'] }],
    ['builtin:char:miss-raksa', 'character', { expressions: ['netral', 'tersenyum'] }],
    [GAMEPLAY.image, 'background'],
    ['asset:old-bg', 'background', { archived: true }],
    ['asset:old-char', 'character', { expressions: ['netral'], archived: true }],
    ['asset:foto-uji', 'photo'],
    ['asset:foto-lama', 'photo', { archived: true }],
    ['asset:video-uji', 'video'],
  ];
  return {
    categories: new Map([
      ['auto', { active: true }],
      ['hvc', { active: false }],
    ]),
    assets: new Map(library.map(([id, kind, opts]) => [id, { kind, expressions: opts?.expressions ?? [], archived: opts?.archived ?? false, builtin: id.startsWith('builtin:') }])),
  };
}

export class ManualClock implements StoryClock {
  t = 1_000_000;
  private seq = 0;
  private timers = new Map<number, { at: number; fn: () => void }>();

  now(): number {
    return this.t;
  }

  setTimeout(fn: () => void, ms: number): unknown {
    const id = ++this.seq;
    this.timers.set(id, { at: this.t + ms, fn });
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.timers.delete(handle as number);
  }

  /** Move time forward, firing due timers in time order (timers scheduled while firing are honored). */
  advance(ms: number): void {
    const target = this.t + ms;
    for (;;) {
      let next: [number, { at: number; fn: () => void }] | null = null;
      for (const e of this.timers) if (e[1].at <= target && (!next || e[1].at < next[1].at || (e[1].at === next[1].at && e[0] < next[0]))) next = e;
      if (!next) break;
      this.timers.delete(next[0]);
      this.t = next[1].at;
      next[1].fn();
    }
    this.t = target;
  }

  /** Set the clock without firing timers (to test exact boundaries). */
  setTime(t: number): void {
    this.t = t;
  }

  pending(): number {
    return this.timers.size;
  }
}

export class MemoryStore implements StoryRoomStore {
  joined: string[] = [];
  removed: string[] = [];
  started = 0;
  settled: RoundSettlement[] = [];
  finished: ParticipantFinal[][] = [];
  closedEarly: string[] = [];
  participantJoined(_room: StoryRoom, p: { id: string }) {
    this.joined.push(p.id);
  }
  participantRenamed() {}
  participantRemoved(_room: StoryRoom, p: { id: string }) {
    this.removed.push(p.id);
  }
  roomStarted() {
    this.started++;
  }
  roundSettled(_room: StoryRoom, s: RoundSettlement) {
    this.settled.push(s);
  }
  roomFinished(_room: StoryRoom, finals: ParticipantFinal[]) {
    this.finished.push(finals);
  }
  roomClosedEarly(_room: StoryRoom, reason: string) {
    this.closedEarly.push(reason);
  }
}

export const silentEvents: StoryRoomEvents = { publicChanged() {}, privateChanged() {}, phaseChanged() {}, participantRemoved() {} };
