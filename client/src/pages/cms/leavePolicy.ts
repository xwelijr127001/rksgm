/**
 * What counts as leaving the scenario editor, for the unsaved-changes guard (LeaveGuard.tsx). Pure; tested in
 * contentEdit.test.ts.
 */

/** The parts of an address that tell a page change from a jump within the page. */
export interface PageAddress {
  origin: string;
  pathname: string;
  search: string;
}

/**
 * Following a link from `from` to `to` replaces the editor: another path or query of this app. A #hash jump stays on the
 * page. A link to another site unloads the whole page, and the browser's own unsaved-changes warning (beforeunload)
 * covers that.
 */
export function replacesEditor(from: PageAddress, to: PageAddress): boolean {
  return to.origin === from.origin && (to.pathname !== from.pathname || to.search !== from.search);
}

/** A plain click: the primary button with no modifier key. Modified and middle clicks open a new tab and leave this one alone. */
export function isPlainClick(e: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
}

/**
 * react-router's number of a history entry (`history.state.idx`: BrowserRouter counts the entries it makes), or null for
 * an entry it did not make. The guard tells a back or forward move, and how far it went, from these numbers.
 */
export function historyIndex(state: unknown): number | null {
  const idx = typeof state === 'object' && state !== null ? (state as { idx?: unknown }).idx : undefined;
  return typeof idx === 'number' && Number.isInteger(idx) ? idx : null;
}
