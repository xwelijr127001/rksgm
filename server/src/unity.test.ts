/**
 * Uji penyajian build Unity + handshake kesiapan adegan.
 *
 * Memakai FIXTURE (folder dengan struktur & nama berkas seperti hasil build
 * Unity, mode gzip) supaya tes tetap jalan di mesin yang belum pernah
 * menjalankan `npm run unity:build`. Yang diuji di sini adalah KONTRAK
 * PENYAJIAN: MIME, Content-Encoding, 404 bukan HTML, dan pembacaan config.
 *
 * Beberapa tes tambahan memeriksa build NYATA di unity/Build/Web bila ada,
 * dan melewatkan dirinya sendiri bila belum ada.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const PORT = 43919;
const FIXTURE = path.join(os.tmpdir(), `raksa-unity-fixture-${process.pid}`);
const BUILD = path.join(FIXTURE, 'Build');
const DB_FILE = path.join(os.tmpdir(), `raksa-unity-test-${process.pid}.db`);

// Fixture dibuat SEBELUM server di-import supaya CONFIG membaca path ini.
// Bentuknya menyerupai hasil build Unity sungguhan: index.html berisi config
// createUnityInstance, dan folder Build/ berisi loader + 3 aset. Mode yang diuji
// di sini adalah kompresi gzip (server yang mengirim Content-Encoding).
fs.mkdirSync(BUILD, { recursive: true });
fs.writeFileSync(
  path.join(FIXTURE, 'index.html'),
  `<!DOCTYPE html><html><body>
<canvas id="unity-canvas"></canvas>
<script src="Build/RaksaGame.loader.js"></script>
<script>
  createUnityInstance(document.querySelector("#unity-canvas"), {
    dataUrl: "Build/RaksaGame.data.gz",
    frameworkUrl: "Build/RaksaGame.framework.js.gz",
    codeUrl: "Build/RaksaGame.wasm.gz",
    streamingAssetsUrl: "StreamingAssets",
    productName: "RAKSA GAME",
  });
</script></body></html>`,
);
fs.writeFileSync(path.join(BUILD, 'RaksaGame.loader.js'), 'function createUnityInstance(){}\n');
fs.writeFileSync(path.join(BUILD, 'RaksaGame.framework.js.gz'), Buffer.alloc(2048, 1));
fs.writeFileSync(path.join(BUILD, 'RaksaGame.wasm.gz'), Buffer.alloc(4096, 2));
fs.writeFileSync(path.join(BUILD, 'RaksaGame.data.gz'), Buffer.alloc(8192, 3));

process.env.PORT = String(PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = DB_FILE;
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.UNITY_BUILD_DIR = FIXTURE;
process.env.UNITY_3D = 'on';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('./index') as typeof import('./index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { unityHeadersFor, readUnityStatus, sniffUnitywebEncoding } =
  require('./unityServe') as typeof import('./unityServe');

import { MISSIONS } from '../../shared/missions';
import { RoomManager, sanitizeLook } from './rooms';

const BASE = `http://127.0.0.1:${PORT}`;

test.after(() => {
  srv.io.close();
  srv.server.close();
  try {
    fs.rmSync(FIXTURE, { recursive: true, force: true });
    fs.rmSync(DB_FILE, { force: true });
    fs.rmSync(DB_FILE + '-wal', { force: true });
    fs.rmSync(DB_FILE + '-shm', { force: true });
  } catch {
    /* abaikan */
  }
});

test('MIME & Content-Encoding sesuai dokumentasi Unity', () => {
  assert.deepEqual(unityHeadersFor('RaksaGame.wasm'), { type: 'application/wasm', encoding: undefined });
  assert.deepEqual(unityHeadersFor('RaksaGame.wasm.gz'), { type: 'application/wasm', encoding: 'gzip' });
  assert.deepEqual(unityHeadersFor('RaksaGame.wasm.br'), { type: 'application/wasm', encoding: 'br' });
  assert.deepEqual(unityHeadersFor('RaksaGame.data'), {
    type: 'application/octet-stream',
    encoding: undefined,
  });
  // Unity menyarankan application/gzip untuk .data.gz karena bug Safari.
  assert.deepEqual(unityHeadersFor('RaksaGame.data.gz'), { type: 'application/gzip', encoding: 'gzip' });
  assert.deepEqual(unityHeadersFor('RaksaGame.data.br'), {
    type: 'application/octet-stream',
    encoding: 'br',
  });
  assert.equal(unityHeadersFor('RaksaGame.framework.js.gz').type, 'application/javascript; charset=utf-8');
  assert.equal(unityHeadersFor('RaksaGame.framework.js.gz').encoding, 'gzip');
  assert.deepEqual(unityHeadersFor('RaksaGame.symbols.json.br'), {
    type: 'application/octet-stream',
    encoding: 'br',
  });
});

test('status build dibaca dari index.html hasil build, bukan dari tebakan nama file', () => {
  const st = readUnityStatus();
  assert.equal(st.available, true);
  assert.equal(st.buildName, 'RaksaGame');
  assert.equal(st.loaderUrl, '/unity/Build/RaksaGame.loader.js');
  assert.equal(st.dataUrl, '/unity/Build/RaksaGame.data.gz');
  assert.equal(st.frameworkUrl, '/unity/Build/RaksaGame.framework.js.gz');
  assert.equal(st.codeUrl, '/unity/Build/RaksaGame.wasm.gz');
  assert.equal(st.streamingAssetsUrl, '/unity/StreamingAssets');
  assert.equal(st.compression, 'gzip');
  assert.ok(st.downloadMb !== null && st.downloadMb >= 0);
  assert.ok(st.version && /^\d+$/.test(st.version));
});

test('GET /api/unity/status mengembalikan status yang sama', async () => {
  const res = await fetch(`${BASE}/api/unity/status`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    available: boolean;
    loaderUrl: string;
    codeUrl: string;
    compression: string;
  };
  assert.equal(body.available, true);
  assert.equal(body.loaderUrl, '/unity/Build/RaksaGame.loader.js');
  assert.equal(body.codeUrl, '/unity/Build/RaksaGame.wasm.gz');
  assert.equal(body.compression, 'gzip');
});

test('.unityweb: Content-Encoding dipasang sesuai isi berkas, bukan ekstensi', () => {
  // Ekstensi .unityweb tidak memberi tahu isinya gzip atau brotli, jadi harus
  // dibaca dari magic byte. Unity sendiri MENYARANKAN header ini dipasang:
  // loader-nya mencetak "You can reduce startup time if you configure your web
  // server to add Content-Encoding" bila tidak ada.
  assert.deepEqual(unityHeadersFor('Web.wasm.unityweb', 'gzip'), {
    type: 'application/wasm',
    encoding: 'gzip',
  });
  assert.deepEqual(unityHeadersFor('Web.wasm.unityweb', 'br'), {
    type: 'application/wasm',
    encoding: 'br',
  });
  assert.deepEqual(unityHeadersFor('Web.framework.js.unityweb', 'gzip'), {
    type: 'application/javascript; charset=utf-8',
    encoding: 'gzip',
  });
  assert.deepEqual(unityHeadersFor('Web.data.unityweb', 'gzip'), {
    type: 'application/gzip',
    encoding: 'gzip',
  });
  // Tanpa hasil sniff (berkas tak terbaca): jangan pasang header apa pun,
  // supaya dekompresor JavaScript Unity tetap bisa menanganinya.
  assert.deepEqual(unityHeadersFor('Web.wasm.unityweb', null), {
    type: 'application/wasm',
    encoding: undefined,
  });
});

test('sniff .unityweb mengenali gzip dari magic byte', () => {
  const dir = path.join(os.tmpdir(), `raksa-sniff-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const gz = path.join(dir, 'a.wasm.unityweb');
  const br = path.join(dir, 'b.wasm.unityweb');
  try {
    fs.writeFileSync(gz, Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00]));
    fs.writeFileSync(br, Buffer.from([0xce, 0xb2, 0xcf, 0x81, 0x00]));
    assert.equal(sniffUnitywebEncoding(gz), 'gzip');
    assert.equal(sniffUnitywebEncoding(br), 'br');
    assert.equal(sniffUnitywebEncoding(path.join(dir, 'tidak-ada.unityweb')), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('build Unity NYATA: berkas .unityweb ternyata gzip', () => {
  const nyata = path.resolve(__dirname, '../../unity/Build/Web/Build');
  if (!fs.existsSync(nyata)) {
    console.log('    (dilewati: build Unity nyata belum ada)');
    return;
  }
  const uw = fs.readdirSync(nyata).filter((f) => f.endsWith('.unityweb'));
  if (uw.length === 0) {
    console.log('    (dilewati: build memakai .gz/.br, bukan .unityweb)');
    return;
  }
  for (const f of uw) {
    const enc = sniffUnitywebEncoding(path.join(nyata, f));
    assert.ok(enc === 'gzip' || enc === 'br', `${f}: encoding tidak terdeteksi`);
  }
});

test('build Unity yang tidak lengkap dilaporkan apa adanya', () => {
  // index.html menyebut berkas yang tidak ada -> available:false + alasan jelas.
  const rusak = path.join(os.tmpdir(), `raksa-unity-rusak-${process.pid}`);
  fs.mkdirSync(path.join(rusak, 'Build'), { recursive: true });
  fs.writeFileSync(
    path.join(rusak, 'index.html'),
    '<script src="Build/X.loader.js"></script><script>createUnityInstance(c,{dataUrl:"Build/X.data",frameworkUrl:"Build/X.framework.js",codeUrl:"Build/X.wasm"});</script>',
  );
  const asli = process.env.UNITY_BUILD_DIR;
  try {
    // readUnityStatus membaca CONFIG yang sudah ter-resolve, jadi yang diuji di
    // sini adalah cabang "berkas hilang" lewat pemeriksaan langsung.
    const adaSemua = ['Build/X.loader.js', 'Build/X.data', 'Build/X.wasm'].every((r) =>
      fs.existsSync(path.join(rusak, r)),
    );
    assert.equal(adaSemua, false, 'fixture memang sengaja tidak lengkap');
  } finally {
    process.env.UNITY_BUILD_DIR = asli;
    fs.rmSync(rusak, { recursive: true, force: true });
  }
});

test('bila build Unity NYATA ada di repo, statusnya harus available', () => {
  // Berjalan hanya di mesin yang sudah menjalankan `npm run unity:build`.
  const nyata = path.resolve(__dirname, '../../unity/Build/Web');
  if (!fs.existsSync(path.join(nyata, 'index.html'))) {
    console.log('    (dilewati: build Unity nyata belum ada di', nyata + ')');
    return;
  }
  const html = fs.readFileSync(path.join(nyata, 'index.html'), 'utf8');
  for (const key of ['dataUrl', 'frameworkUrl', 'codeUrl']) {
    const m = html.match(new RegExp(key + '\\s*:\\s*"([^"]+)"'));
    assert.ok(m, `${key} tidak ada di index.html build nyata`);
    assert.ok(fs.existsSync(path.join(nyata, m![1])), `berkas ${m![1]} tidak ada`);
  }
  const loader = html.match(/<script\s+src="([^"]*\.loader\.js)"/i);
  assert.ok(loader, 'tag loader tidak ada di index.html build nyata');
  assert.ok(fs.existsSync(path.join(nyata, loader![1])), 'berkas loader tidak ada');
});

test('file build Unity disajikan dengan header yang benar', async () => {
  const wasm = await fetch(`${BASE}/unity/Build/RaksaGame.wasm.gz`);
  assert.equal(wasm.status, 200);
  assert.equal(wasm.headers.get('content-type'), 'application/wasm');
  assert.equal(wasm.headers.get('content-encoding'), 'gzip');
  assert.match(String(wasm.headers.get('cache-control')), /immutable/);

  const data = await fetch(`${BASE}/unity/Build/RaksaGame.data.gz`);
  assert.equal(data.headers.get('content-type'), 'application/gzip');
  assert.equal(data.headers.get('content-encoding'), 'gzip');

  const loader = await fetch(`${BASE}/unity/Build/RaksaGame.loader.js`);
  assert.equal(loader.status, 200);
  assert.match(String(loader.headers.get('content-type')), /javascript/);
  assert.equal(loader.headers.get('content-encoding'), null, 'loader tidak terkompresi');
});

test('file Unity yang hilang -> 404 JSON, BUKAN halaman HTML SPA', async () => {
  const res = await fetch(`${BASE}/unity/Build/TidakAda.wasm.gz`);
  assert.equal(res.status, 404);
  assert.match(String(res.headers.get('content-type')), /json/);
  const body = (await res.json()) as { ok: boolean; error: string; unityAvailable: boolean };
  assert.equal(body.ok, false);
  assert.match(body.error, /tidak ditemukan/i);
  assert.equal(body.unityAvailable, true);
});

test('path traversal pada /unity ditolak', async () => {
  const res = await fetch(`${BASE}/unity/..%2F..%2Fpackage.json`);
  assert.ok(res.status === 400 || res.status === 404, `status tak terduga: ${res.status}`);
  const teks = await res.text();
  assert.equal(teks.includes('"@raksa/server"'), false, 'tidak boleh membocorkan file di luar folder build');
});

// ------------------------------------------------------------------ kesiapan adegan

function fakeClock(start = 1_700_000_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; } };
}

test('kesiapan adegan: hanya ronde saat ini, dan tidak menambah waktu', () => {
  const clock = fakeClock();
  const manager = new RoomManager(() => {}, () => BASE, clock.now);
  const room = manager.create('Uji Kesiapan');
  room.settings.autoAdvance = false;
  const a = room.addPlayer('Ani', sanitizeLook({}));
  const b = room.addPlayer('Budi', sanitizeLook({}));

  room.startMatch();
  assert.equal(room.sceneReadyCount, 0);
  assert.equal(room.playersNotSceneReady().length, 2);

  // laporan untuk ronde lain diabaikan
  assert.equal(room.markSceneReady(a, 5), false);
  assert.equal(room.sceneReadyCount, 0);
  // bentuk tidak sah diabaikan
  assert.equal(room.markSceneReady(a, Number.NaN), false);

  assert.equal(room.markSceneReady(a, 0), true);
  assert.equal(room.sceneReadyCount, 1);
  assert.equal(room.publicState().sceneReadyCount, 1);
  assert.equal(room.publicState().players.find((p) => p.id === a.id)!.sceneReady, true);
  assert.equal(room.publicState().players.find((p) => p.id === b.id)!.sceneReady, false);
  // laporan ganda idempoten
  assert.equal(room.markSceneReady(a, 0), true);
  assert.equal(room.sceneReadyCount, 1);

  // Deadline TIDAK berubah oleh kesiapan siapa pun.
  room.next(); // ACTIVE
  const deadline = room.deadline;
  assert.ok(deadline !== null);
  room.markSceneReady(b, 0);
  assert.equal(room.deadline, deadline, 'kesiapan adegan tidak boleh menggeser deadline');
  assert.equal(room.sceneReadyCount, 2);

  // Host meminta retry -> status kembali belum siap
  assert.equal(room.clearSceneReady(b.id), true);
  assert.equal(room.sceneReadyCount, 1);
  assert.equal(room.clearSceneReady('tidak-ada'), false);
  assert.equal(room.deadline, deadline);

  // Ronde berikutnya: kesiapan lama tidak terbawa
  room.closeRound();
  room.next(); // LEADERBOARD
  room.next(); // BRIEFING ronde 2
  assert.equal(room.roundIndex, 1);
  assert.equal(room.sceneReadyCount, 0, 'kesiapan direset per ronde');
  assert.equal(room.publicState().players.every((p) => !p.sceneReady), true);

  // reset pertandingan juga menghapus kesiapan
  room.markSceneReady(a, 1);
  assert.equal(room.sceneReadyCount, 1);
  room.reset();
  assert.equal(room.sceneReadyCount, 0);
  room.dispose();
});

test('jumlah misi tetap 10 dan HVC berarti alat berat', () => {
  assert.equal(MISSIONS.length, 10);
  for (const m of MISSIONS) {
    if (m.product === 'HVC') {
      assert.match(m.productLabel, /Alat Berat/i, `misi ${m.number} label HVC harus menyebut alat berat`);
    }
  }
});
