/**
 * Holding a move through the browser history (back and forward buttons, mouse buttons, Alt+←/→, swipe gestures) before
 * the router follows it. BrowserRouter has no navigation blocker and follows popstate itself, so this module listens
 * first: App.tsx imports it, so its listener is added before the router mounts (at the window, listeners run in the
 * order they were added, and this one also listens in the capture phase). A page with unsaved work (the CMS editor's
 * LeaveGuard) sets the holder; a move the holder takes never reaches the router.
 */

/** Returns true for a move it holds (the router must not see it). */
type Holder = (e: PopStateEvent) => boolean;

let holder: Holder | null = null;

/** Set the one holder of history moves, or clear it with null. */
export function holdHistoryMoves(next: Holder | null): void {
  holder = next;
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'popstate',
    (e) => {
      if (holder?.(e)) e.stopImmediatePropagation();
    },
    true,
  );
}
