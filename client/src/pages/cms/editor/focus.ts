/**
 * Keyboard focus after a list edit (move or remove a line, an evidence item or one of its rows). The edit re-renders
 * the list: the pressed button may move with its row, turn disabled at the end of the list, or disappear with its row,
 * and the browser would then drop focus to <body>, the top of a long page. Callers name the candidates in order (the
 * same arrow, the opposite arrow, the neighbouring row, the add button, the section heading) by DOM id.
 */

/** The first of `ids` that is on the page and not disabled. */
export function firstFocusable(ids: readonly string[]): HTMLElement | null {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && !el.matches(':disabled')) return el;
  }
  return null;
}

/** Focus the first usable of `ids` once the edit has rendered (as the host question editor does). */
export function focusAfterEdit(ids: readonly string[]): void {
  requestAnimationFrame(() => firstFocusable(ids)?.focus());
}

/** Candidates after a move: the pressed arrow where its row went, else the row's other arrow (the list's end). */
export function arrowTargets(rowKey: string, delta: -1 | 1): string[] {
  const up = `${rowKey}-naik`;
  const down = `${rowKey}-turun`;
  return delta < 0 ? [up, down] : [down, up];
}
