/**
 * T-035 item 4 (pemilik 18 Nov 07:05): Mandarin hilang di game.araksa.com karena server jalan dengan RAKSA_LEGACY mati.
 * Mode cerita wajib tetap id / en / zh walau /api/config features.legacy=false.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const PORT = 43931;
process.env.PORT = String(PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = path.join(os.tmpdir(), `raksa-game-bahasa-${process.pid}.db`);
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.NODE_ENV = 'test';
process.env.RAKSA_LEGACY = 'off';
process.env.PANITIA_PIN = '';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('./index') as typeof import('./index');
import { DAFTAR_BAHASA } from '../../shared/bahasa';

test('legacy mati: /api/config features.legacy=false, mode cerita tetap tiga bahasa', async (t) => {
  t.after(() => { srv.io.close(); srv.server.close(); try { fs.rmSync(process.env.DB_FILE!, { force: true }); } catch { /* */ } });
  let cfg: { features: { legacy: boolean } } | null = null;
  for (let i = 0; i < 50 && !cfg; i++) {
    try { cfg = (await (await fetch(`http://127.0.0.1:${PORT}/api/config`)).json()) as typeof cfg; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  assert.ok(cfg, '/api/config tidak menjawab');
  assert.equal(cfg!.features.legacy, false);
  assert.deepEqual(DAFTAR_BAHASA.map((b) => b.kode).sort(), ['en', 'id', 'zh']);
  // Pemilih bahasa klien tidak lagi bergantung pada mode lama.
  const root = path.resolve(__dirname, '../../client/src');
  const pilih = fs.readFileSync(path.join(root, 'components/PilihBahasa.tsx'), 'utf8');
  assert.equal(/useLegacyEnabled/.test(pilih), false, 'PilihBahasa masih memakai useLegacyEnabled');
  const main = fs.readFileSync(path.join(root, 'main.tsx'), 'utf8');
  assert.equal(/config\.legacy[^\n]*'zh'/.test(main), false, 'main.tsx masih mengembalikan zh ke id saat legacy mati');
});
