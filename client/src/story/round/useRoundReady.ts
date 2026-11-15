/**
 * Reports "assets ready" for a round once its pictures are decoded (or failed), or after READY_TIMEOUT_MS: the
 * server's bounded readiness policy opens the answers for everybody at once, it never waits on this alone. A hidden
 * tab reports without waiting for an animation frame (which hidden tabs never run), so a phone with its screen off
 * does not send every round into the server's readiness grace. Evidence pictures are fetched ahead, without gating.
 */
import { useCallback, useEffect, useRef } from 'react';

const READY_TIMEOUT_MS = 6000;

function decoded(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      img.decode().catch(() => undefined).finally(() => resolve());
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * `urls` = pictures the round shows at once; null while the room's asset list is still unknown (then only the timeout
 * reports). `prefetch` = pictures opened on demand (evidence).
 */
export function useRoundReady(roundId: string, urls: readonly string[] | null, prefetch: readonly string[], report: (roundId: string) => void): void {
  const reported = useRef<string | null>(null);
  const reportOnce = useCallback(() => {
    if (reported.current === roundId) return;
    reported.current = roundId;
    report(roundId);
  }, [roundId, report]);

  useEffect(() => {
    if (reported.current === roundId) return;
    const id = window.setTimeout(reportOnce, READY_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [roundId, reportOnce]);

  const key = urls ? urls.join('|') : null;
  useEffect(() => {
    if (key === null || reported.current === roundId) return;
    let alive = true;
    let frame = 0;
    void Promise.all(key ? key.split('|').map(decoded) : []).then(() => {
      if (!alive) return;
      // One frame after decoding so the picture is laid out; at once when the tab is hidden (no frames run there).
      if (document.visibilityState === 'hidden') reportOnce();
      else frame = window.requestAnimationFrame(reportOnce);
    });
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
    };
  }, [roundId, key, reportOnce]);

  const prefetchKey = prefetch.join('|');
  useEffect(() => {
    if (!prefetchKey) return;
    for (const url of prefetchKey.split('|')) new Image().src = url;
  }, [prefetchKey]);
}
