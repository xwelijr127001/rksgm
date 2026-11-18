import test from 'node:test';
import { scoreDecision } from '../../../shared/story/scorePolicy';

// Snapshot of story-70-30-v2: accuracy x answer time. Update with: tsx --test --test-update-snapshots <file>
test('story-70-30-v2 score grid', (t) => {
  const grid: Record<string, unknown> = {};
  for (const a of [0, 0.5, 1]) for (const s of [0, 15, 30, 45]) grid[`a=${a} t=${s}s`] = scoreDecision(a, s * 1000);
  t.assert.snapshot(grid);
});
