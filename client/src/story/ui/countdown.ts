/**
 * Countdown to a SERVER deadline (display only: the server decides timing and scores). Kept free of page and canvas
 * imports so components that use it can be rendered in node tests.
 */
import { useEffect, useState } from 'react';

/** Remaining time of a server deadline, refreshed 5×/s while running. */
export function useServerCountdown(endsAt: number | null, durationMs: number | null, now: () => number): { remainingMs: number | null; seconds: number | null; ratio: number | null } {
  const [tick, setTick] = useState(() => now());
  useEffect(() => {
    if (endsAt === null) return;
    setTick(now());
    const id = window.setInterval(() => setTick(now()), 200);
    return () => window.clearInterval(id);
  }, [endsAt, now]);
  if (endsAt === null) return { remainingMs: null, seconds: null, ratio: null };
  const remainingMs = Math.max(0, endsAt - tick);
  const ratio = durationMs && durationMs > 0 ? Math.min(1, remainingMs / durationMs) : null;
  return { remainingMs, seconds: Math.ceil(remainingMs / 1000), ratio };
}
