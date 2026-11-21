import test from 'node:test';
import { EPISODE_AUTO_2_INV } from './episode/auto-2-inv/episode';
import { EPISODE_AUTO_2_INV_2 } from './episode/auto-2-inv-2/episode';
import { EPISODE_AUTO_2_INV_3 } from './episode/auto-2-inv-3/episode';
import { jelajahiSemuaJalur, validasiEpisode } from './validasi';

// Investigator episodes: project validator result + a walk of every path of case 3. Update:
// tsx --tsconfig client/tsconfig.json --test --test-update-snapshots client/src/cerita/investigator.expect.test.ts
test('investigator episodes: validator and path walk', (t) => {
  const eps = { 'auto-2-inv': EPISODE_AUTO_2_INV, 'auto-2-inv-2': EPISODE_AUTO_2_INV_2, 'auto-2-inv-3': EPISODE_AUTO_2_INV_3 };
  const hasil: Record<string, unknown> = {};
  for (const [id, ep] of Object.entries(eps)) hasil[id] = { id: ep!.id, validasi: validasiEpisode(ep!) };
  const j = jelajahiSemuaJalur(EPISODE_AUTO_2_INV_3!);
  hasil['auto-2-inv-3 walk'] = { jalur: j.jalur, akhir: j.akhir, masalah: j.masalah, keadaan: j.keadaan };
  t.assert.snapshot(hasil);
});
