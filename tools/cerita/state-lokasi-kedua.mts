/**
 * T-010 (D-55 verification path): drive Episode 2 with the REAL story engine until the stage is one action away from the first
 * location change, then print the localStorage entry the app would save (key `raksa:cerita`), so a browser test can open
 * /cerita/auto-2 with that progress and press "Lanjut" once to see the new room's thumbnail.
 *
 *   npx tsx --tsconfig client/tsconfig.json tools/cerita/state-lokasi-kedua.mts > state.json
 *
 * Choices: first available option; activities: an empty answer (graded as whatever the engine decides) then "lanjut".
 */
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
} as Storage;

const { EPISODE_AUTO_2 } = await import('../../client/src/cerita/episode/auto-2/episode');
const { jalankan, stateAwal, nodeKini } = await import('../../client/src/cerita/mesin');
const { komposisiLatar } = await import('../../client/src/cerita/ui/latar/komposisi');
const { simpanProgres } = await import('../../client/src/cerita/simpan');
import type { AksiCerita, StateCerita } from '../../client/src/cerita/tipe';

const ep = EPISODE_AUTO_2!;
let s: StateCerita = stateAwal(ep);
const lokasiAwal = komposisiLatar(ep, s).lokasi;
let aksiTerakhir: AksiCerita | null = null;
for (let i = 0; i < 400; i++) {
  const n = nodeKini(ep, s);
  if (!n) break;
  const calon: AksiCerita[] = [{ jenis: 'lanjut' }];
  if (n.jenis === 'pilihan') calon.unshift(...n.pilihan.map((p) => ({ jenis: 'pilih', node: n.id, pilihan: p.id }) as AksiCerita));
  if (n.jenis === 'aktivitas') calon.unshift({ jenis: 'aktivitas', node: n.id, jawaban: {} as never });
  let maju: StateCerita | null = null;
  for (const a of calon) {
    const t = jalankan(ep, s, a);
    if (t !== s) { maju = t; aksiTerakhir = a; break; }
  }
  if (!maju) { console.error('stuck at', n.id, n.jenis); process.exit(1); }
  if (komposisiLatar(ep, maju).lokasi !== lokasiAwal) {
    simpanProgres(ep, s);
    console.log(JSON.stringify({ kunci: 'raksa:cerita', nilai: mem.get('raksa:cerita'), node: s.node, baris: s.baris, aksi: aksiTerakhir, lokasiBerikut: komposisiLatar(ep, maju).lokasi }));
    process.exit(0);
  }
  s = maju;
}
console.error('no location change found');
process.exit(1);
