/**
 * Estimate of the server clock for DISPLAY only (countdowns). Every snapshot carries `serverNow`; network latency can
 * only make a sample look older, so the largest recent offset is the closest to the truth. Scoring never uses this:
 * the server measures answer time on receipt.
 */
const WINDOW = 8;

export class ServerClock {
  private samples: number[] = [];

  sample(serverNow: number, localNow: number = Date.now()): void {
    if (!Number.isFinite(serverNow)) return;
    const offset = serverNow - localNow;
    // A large jump (device clock changed, laptop resumed) invalidates older samples.
    const best = this.offset();
    if (this.samples.length && Math.abs(offset - best) > 5_000) this.samples = [];
    this.samples.push(offset);
    if (this.samples.length > WINDOW) this.samples.shift();
  }

  offset(): number {
    return this.samples.length ? Math.max(...this.samples) : 0;
  }

  now(localNow: number = Date.now()): number {
    return localNow + this.offset();
  }

  reset(): void {
    this.samples = [];
  }
}
