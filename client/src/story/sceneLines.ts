/**
 * Pure helpers for the conversation of a Story Room scene (participant room, projector, CMS preview): display lines
 * from the server's scene lines, the progressive reveal over the shared reading time, and the chat avatar's initials.
 * No React and no i18n here (unit-tested in sceneLines.test.ts).
 */
import type { StorySceneLine, StoryScenePublic } from '@shared/story/protocol';
import { mergeSceneLines } from '@shared/story/scene';
import type { ConversationLine } from './ui/conversation';

function toConversationLine(l: StorySceneLine, keyPrefix: string): ConversationLine {
  return { key: keyPrefix + l.id, speaker: l.speaker, name: l.name, text: l.text };
}

/**
 * What one viewer reads in a scene: the opening lines (round 1) and the round's public lines merged with this viewer's
 * own conditional lines in authored order (shared screens pass no flag lines). Texts are used as given, so personalize
 * the scene and the flag lines first.
 */
export function sceneConversation(
  scene: Pick<StoryScenePublic, 'intro' | 'lines'>,
  flagLines: readonly StorySceneLine[] = [],
): { intro: ConversationLine[]; lines: ConversationLine[] } {
  return {
    intro: scene.intro.map((l) => toConversationLine(l, 'intro:')),
    lines: mergeSceneLines(scene.lines, flagLines).map((l) => toConversationLine(l, 'line:')),
  };
}

/**
 * Time between two revealed lines: messages arrive briskly (30% of the reading time spread over the lines, 0.6–1.5 s
 * each; 1.2 s without a duration), so the conversation is complete early in the reading time — no slow typing effect.
 */
export function revealStepMs(durationMs: number | null, total: number): number {
  return durationMs ? Math.min(1500, Math.max(600, (durationMs * 0.3) / Math.max(1, total))) : 1200;
}

/** Lines visible `elapsedMs` after the scene began: the first at once, then one per step, never more than `total`. */
export function revealedCount(total: number, elapsedMs: number, stepMs: number): number {
  return Math.min(total, 1 + Math.floor(Math.max(0, elapsedMs) / stepMs));
}

/** Spread a reveal count over the opening lines (they come first) and the round's lines. */
export function splitReveal<T>(intro: readonly T[], lines: readonly T[], count: number): { intro: T[]; lines: T[] } {
  const n = Math.max(0, count);
  return { intro: intro.slice(0, n), lines: lines.slice(0, Math.max(0, n - intro.length)) };
}

/** Up to two initials for the chat avatar ("Pak Joko" -> "PJ"). */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0]!.toUpperCase())
    .join('');
}
