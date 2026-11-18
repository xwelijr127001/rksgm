import test from 'node:test';
import { PembatasPin } from './keamanan';

// Snapshot of PIN limiter decisions for one trusted IP, fake clock. The staff-host bypass lives in index.ts (cekPin), not here.
test('PIN limiter decision sequence', (t) => {
  let now = 1_000_000;
  const p = new PembatasPin(() => now);
  const warn = console.warn; console.warn = () => {};
  try {
    const log: string[] = [];
    const step = (label: string, pin: string, ip = '10.0.0.1') => log.push(`${label}: ${p.cek(pin, ip, '1234')}`);
    for (let i = 1; i <= 9; i++) step(`wrong #${i}`, 'x' + i);
    step('correct while IP locked', '1234');
    step('correct from another IP', '1234', '10.0.0.2');
    p.jenuhkan(); step('correct while global lock', '1234', '10.0.0.3'); step('wrong while global lock', 'no', '10.0.0.3');
    now += 10 * 60_000 + 1; step('correct after global lock', '1234', '10.0.0.3');
    t.assert.snapshot(log);
  } finally { console.warn = warn; }
});
