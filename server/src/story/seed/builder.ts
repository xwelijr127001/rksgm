/**
 * Compact authoring helper for the SYNTHETIC demo scenarios (server-only; never bundled into the client). Produces the
 * same `ScenarioContent` the CMS edits, so demos go through the normal review/publication workflow. Demos use none of
 * the optional features (cast, opening lines, chat/dossier/field layouts, evidence, respondents, delayed
 * consequences): those get their empty defaults.
 */
import {
  CONTENT_SCHEMA_VERSION,
  textKey,
  type Classification,
  type MoodBand,
  type RoundContent,
  type ScenarioContent,
  type Speaker,
} from '../../../../shared/story/content';

export type DemoChoice = [classification: Classification, accuracy: number, moodDelta: number, text: string, consequence: string, reason: string];

export interface DemoRound {
  title: string;
  bg: 'meja' | 'parkiran' | 'telepon';
  officer?: boolean;
  /** Demo lines never use cast members (no cast list in demos). */
  lines: [Exclude<Speaker, 'cast'>, string][];
  variants?: Partial<Record<MoodBand, string>>;
  prompt: string;
  choices: DemoChoice[];
  timeout: [moodDelta: number, consequence: string, reason: string];
}

export interface DemoScenario {
  title: string;
  synopsis: string;
  difficulty: 1 | 2 | 3;
  initialMood: number;
  rounds: DemoRound[];
  endings: { id: string; kind: 'happy' | 'with_notes'; minMood: number | null; minScore: number | null; maxMood?: number | null; title: string; text: string }[];
}

export function buildDemo(d: DemoScenario): ScenarioContent {
  const text: Record<string, string> = {
    [textKey.title()]: d.title,
    [textKey.synopsis()]: d.synopsis,
    [textKey.customerName()]: 'Bu Rina',
    [textKey.officerName()]: 'Miss Raksa',
  };
  const rounds: RoundContent[] = d.rounds.map((r, i) => {
    const rid = `r${String(i + 1).padStart(2, '0')}`;
    text[textKey.roundTitle(rid)] = r.title;
    text[textKey.roundPrompt(rid)] = r.prompt;
    r.lines.forEach(([, line], li) => (text[textKey.line(rid, `l${li + 1}`)] = line));
    for (const [band, line] of Object.entries(r.variants ?? {})) if (line) text[textKey.moodVariant(rid, band as MoodBand)] = line;
    r.choices.forEach(([, , , t, consequence, reason], ci) => {
      const cid = `p${String.fromCharCode(97 + ci)}`;
      text[textKey.choiceText(rid, cid)] = t;
      text[textKey.choiceConsequence(rid, cid)] = consequence;
      text[textKey.choiceReason(rid, cid)] = reason;
    });
    text[textKey.timeoutConsequence(rid)] = r.timeout[1];
    text[textKey.timeoutReason(rid)] = r.timeout[2];
    return {
      id: rid,
      backgroundAssetId: `builtin:bg:${r.bg}`,
      showOfficer: r.officer !== false,
      mediaAssetId: null,
      lines: r.lines.map(([speaker], li) => ({ id: `l${li + 1}`, speaker, castId: null, ifFlag: null })),
      choices: r.choices.map(([classification, accuracy, moodDelta], ci) => ({ id: `p${String.fromCharCode(97 + ci)}`, classification, accuracy, moodDelta, setsFlag: null, form: 'message' })),
      timeout: { moodDelta: r.timeout[0] },
      layout: 'stage',
      keyRound: false,
      flagEffects: [],
      authorNote: '',
      evidence: [],
      respondent: null,
    };
  });
  for (const e of d.endings) {
    text[textKey.endingTitle(e.id)] = e.title;
    text[textKey.endingText(e.id)] = e.text;
  }
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    categoryId: 'auto',
    difficulty: d.difficulty,
    locales: ['id'],
    initialMood: d.initialMood,
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
    endings: d.endings.map((e) => ({ id: e.id, kind: e.kind, minMood: e.minMood, maxMood: e.maxMood ?? null, minScore: e.minScore, maxScore: null })),
    authorNotes: '',
    text: { id: text },
  };
}
