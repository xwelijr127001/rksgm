import test from 'node:test';
import { csvCell } from './csvGuard';

// Snapshot of the exported cell (csv.ts uses csvGuard.csvCell for every cell).
test('csv cell guard', (t) => {
  const inputs: Record<string, string> = {
    formula: '=SUM(1)', plus: '+1', minus: '-1', at: '@x', tab: '\tx', digit: '7 Bintang', unicode: 'Dewi 李',
    quotedComma: 'Dewi, "Si" Kecil', empty: '',
  };
  t.assert.snapshot(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, csvCell(v)])));
});
