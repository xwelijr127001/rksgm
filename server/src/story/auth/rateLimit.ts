/**
 * Fixed-window in-memory rate limiter for unauthenticated or credential-guessing paths (room join/lookup, staff login).
 * Single-process by design (the app runs one Node process); a multi-instance deployment needs a shared store (handoff).
 *
 * Two ways to use it:
 *  - `take(key)`: count every attempt (staff login per IP+username).
 *  - `blocked(key)` + `record(key)`: count only FAILED attempts (wrong room code / unknown credential). Participants of
 *    one event often share one public IP (office Wi-Fi NAT), so successful joins and reconnects must not use up a
 *    per-IP budget; guessing does.
 */

export class RateLimiter {
  private hits = new Map<string, { n: number; resetAt: number }>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
    /** Hard cap on tracked keys (T-038): past it the oldest keys are dropped, so memory stays bounded under a flood. */
    private readonly maxKeys = 20_000,
  ) {}

  private current(key: string): { n: number; resetAt: number } | undefined {
    const t = this.now();
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (v.resetAt <= t) this.hits.delete(k);
    if (this.hits.size > this.maxKeys) {
      let drop = this.hits.size - this.maxKeys;
      for (const k of this.hits.keys()) {
        if (drop-- <= 0) break;
        this.hits.delete(k);
      }
    }
    const cur = this.hits.get(key);
    return cur && cur.resetAt > t ? cur : undefined;
  }

  /** true = allowed (and counted); false = over the limit for this key. */
  take(key: string): boolean {
    if (this.blocked(key)) return false;
    this.record(key);
    return true;
  }

  /** The key has used up its budget in the current window (nothing is counted). */
  blocked(key: string): boolean {
    return (this.current(key)?.n ?? 0) >= this.max;
  }

  /** Count one event for the key. */
  record(key: string): void {
    const cur = this.current(key);
    if (cur) cur.n++;
    else this.hits.set(key, { n: 1, resetAt: this.now() + this.windowMs });
  }

  reset(): void {
    this.hits.clear();
  }
}
