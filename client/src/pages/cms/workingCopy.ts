/**
 * The scenario editor's working copy next to the copy the server last stored (pure; tested in contentEdit.test.ts).
 * Edits are immutable, so "unsaved" is identity: the working copy is not the stored one. A copy from the server replaces
 * the working copy only while that holds nothing newer than what the server answered for, so text typed while a save
 * is on its way, or unsaved edits during a reload, are never dropped.
 */
import type { ScenarioContent } from '@shared/story/content';

export interface WorkingCopy {
  /** The content as the server last stored it. */
  saved: ScenarioContent;
  /** What the editor shows and edits. */
  content: ScenarioContent;
}

export function hasUnsavedChanges(w: WorkingCopy): boolean {
  return w.content !== w.saved;
}

/** Apply one edit. An edit that changes nothing keeps the copy as it is, so it does not count as unsaved. */
export function editWorkingCopy(w: WorkingCopy, fn: (c: ScenarioContent) => ScenarioContent): WorkingCopy {
  const content = fn(w.content);
  return content === w.content ? w : { ...w, content };
}

/**
 * Take `server`, the copy the server stored or sent. `basis` is the content its answer is based on: what a save sent,
 * or by default the last stored copy (a reload, a workflow action). Edits newer than `basis` stay in the working copy,
 * which then stays unsaved.
 */
export function withServerCopy(w: WorkingCopy | null, server: ScenarioContent, basis: ScenarioContent | undefined = w?.saved): WorkingCopy {
  return { saved: server, content: w && w.content !== basis ? w.content : server };
}
