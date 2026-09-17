/**
 * Tes bridge Unity tanpa browser & tanpa Unity.
 *
 * Jalankan dari root repo:
 *   npx tsx --test client/src/unity/bridge.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { unityBridge, type UnityEventHandler } from './bridge';
import type { FromUnityMessage } from '../../../shared/unityBridge';

interface Rekam {
  objek: string;
  metode: string;
  json: string;
}

interface GlobalTiruan {
  RaksaUnityReceive?: (json: string) => void;
  __raksaUnityQueue?: unknown[];
}

/** Instance Unity tiruan + jalur pesan dari Unity. */
function buatMock(antreanAwal?: string[]) {
  unityBridge.dispose();
  const terkirim: Rekam[] = [];
  const instance = {
    SendMessage(objek: string, metode: string, json: string): void {
      terkirim.push({ objek, metode, json });
    },
  };
  const global: GlobalTiruan = {};
  if (antreanAwal) global.__raksaUnityQueue = [...antreanAwal];
  unityBridge.__setInstanceForTest(instance, global);

  const dariUnity = (payload: unknown): void => {
    const fn = global.RaksaUnityReceive;
    assert.ok(fn, 'window.RaksaUnityReceive belum dipasang');
    fn(typeof payload === 'string' ? payload : JSON.stringify(payload));
  };
  const tipeTerkirim = (): string[] =>
    terkirim.map((r) => (JSON.parse(r.json) as { type: string }).type);

  return { terkirim, tipeTerkirim, global, dariUnity };
}

function tampung(): { pesan: FromUnityMessage[]; handler: UnityEventHandler } {
  const pesan: FromUnityMessage[] = [];
  const handler: UnityEventHandler = (m) => {
    pesan.push(m);
  };
  unityBridge.on(handler);
  return { pesan, handler };
}

/** Bungkam console.warn supaya keluaran tes bersih, tetapi hitung jumlahnya. */
function hitungWarn<T>(fn: () => T): { hasil: T; warn: number } {
  const asli = console.warn;
  let warn = 0;
  console.warn = () => {
    warn += 1;
  };
  try {
    return { hasil: fn(), warn };
  } finally {
    console.warn = asli;
  }
}

test('pesan sebelum unityReady diantrekan lalu terkirim berurutan', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm1', roundIndex: 0 });

  unityBridge.send({
    type: 'loadMission',
    missionId: 'm1',
    roundIndex: 0,
    scene: 'parkiran',
    title: 'Misi 1',
    objects: [{ stepId: 's1', optionId: 'o1', label: 'Foto', kind: 'bukti', multi: true }],
  });
  unityBridge.send({ type: 'setPhase', missionId: 'm1', roundIndex: 0, phase: 'ACTIVE' });
  unityBridge.send({
    type: 'setInteractionEnabled',
    missionId: 'm1',
    roundIndex: 0,
    enabled: true,
  });
  assert.equal(m.terkirim.length, 0, 'belum boleh terkirim sebelum unityReady');

  m.dariUnity({ type: 'unityReady', version: 1 });
  assert.deepEqual(m.tipeTerkirim(), ['loadMission', 'setPhase', 'setInteractionEnabled']);
  assert.equal(m.terkirim[0]?.objek, 'RaksaBridge');
  assert.equal(m.terkirim[0]?.metode, 'Receive');

  // Setelah siap, pesan berikutnya langsung dikirim.
  unityBridge.send({ type: 'ping', nonce: 7 });
  assert.equal(m.terkirim.length, 4);
});

test('initialize adalah jabat tangan: dikirim tanpa menunggu unityReady', () => {
  const m = buatMock();
  unityBridge.send({
    type: 'initialize',
    version: 1,
    reducedMotion: false,
    quality: 'auto',
    maxDpr: 2,
  });
  assert.deepEqual(m.tipeTerkirim(), ['initialize']);
});

test('antrean window.__raksaUnityQueue dikuras saat handler dipasang', () => {
  const awal = JSON.stringify({ type: 'unityReady', version: 1 });
  const m = buatMock([awal]);
  // unityReady sudah terbaca dari antrean, jadi pesan baru langsung terkirim.
  unityBridge.send({ type: 'setReducedMotion', reducedMotion: true });
  assert.deepEqual(m.tipeTerkirim(), ['setReducedMotion']);
});

test('pesan dari misi/ronde lama diabaikan', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  m.dariUnity({ type: 'unityReady', version: 1 });
  const t = tampung();

  m.dariUnity({ type: 'objectSelected', missionId: 'm1', roundIndex: 3, stepId: 's1', optionId: 'o1' });
  m.dariUnity({ type: 'objectSelected', missionId: 'm2', roundIndex: 2, stepId: 's1', optionId: 'o1' });
  m.dariUnity({ type: 'missionReady', missionId: 'm9', roundIndex: 3 });
  assert.equal(t.pesan.length, 0, 'pesan kedaluwarsa tidak boleh diteruskan');

  m.dariUnity({ type: 'missionReady', missionId: 'm2', roundIndex: 3 });
  assert.equal(t.pesan.length, 1);
});

test('pesan berbentuk salah diabaikan dan dicatat', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  const t = tampung();

  const { warn } = hitungWarn(() => {
    m.dariUnity('{bukan json');
    m.dariUnity({ type: 'hapusSemuaSkor', missionId: 'm2', roundIndex: 3 });
    m.dariUnity({ type: 'objectSelected', missionId: 'm2', roundIndex: 3, stepId: '', optionId: 'o1' });
    m.dariUnity({ type: 'objectSelected', missionId: 'm2', roundIndex: 3, stepId: 's1' });
    m.dariUnity({ type: 'evidenceToggled', missionId: 'm2', roundIndex: 3, stepId: 's1', optionId: 'o1' });
    m.dariUnity({ type: 'objectSelected', missionId: 'm2', roundIndex: '3', stepId: 's1', optionId: 'o1' });
  });

  assert.equal(t.pesan.length, 0);
  assert.equal(warn, 6, 'setiap pesan tidak sah dicatat sekali');
});

test('objectSelected & evidenceToggled yang sah diteruskan ke handler', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  const t = tampung();

  m.dariUnity({
    type: 'objectSelected',
    missionId: 'm2',
    roundIndex: 3,
    stepId: 's1',
    optionId: 'o1',
    bucketId: 'b1',
  });
  m.dariUnity({
    type: 'evidenceToggled',
    missionId: 'm2',
    roundIndex: 3,
    stepId: 's2',
    optionId: 'o9',
    added: true,
  });

  assert.equal(t.pesan.length, 2);
  assert.deepEqual(t.pesan[0], {
    type: 'objectSelected',
    missionId: 'm2',
    roundIndex: 3,
    stepId: 's1',
    optionId: 'o1',
    bucketId: 'b1',
  });
  assert.deepEqual(t.pesan[1], {
    type: 'evidenceToggled',
    missionId: 'm2',
    roundIndex: 3,
    stepId: 's2',
    optionId: 'o9',
    added: true,
  });

  // off() melepas handler.
  unityBridge.off(t.handler);
  m.dariUnity({ type: 'objectSelected', missionId: 'm2', roundIndex: 3, stepId: 's3', optionId: 'o3' });
  assert.equal(t.pesan.length, 2);
});

test('ping/pong, sfx, dan interactionError tidak membuat crash', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  m.dariUnity({ type: 'unityReady', version: 1 });
  const t = tampung();

  unityBridge.send({ type: 'ping', nonce: 42 });
  m.dariUnity({ type: 'pong', nonce: 42 });
  m.dariUnity({ type: 'sfx', name: 'pilih' });
  m.dariUnity({ type: 'interactionError', code: 'scene-gagal', message: 'model tidak ada' });
  m.dariUnity({
    type: 'interactionError',
    code: 'lain',
    message: 'ronde lama',
    missionId: 'm1',
    roundIndex: 1,
  });

  assert.deepEqual(m.tipeTerkirim(), ['ping']);
  assert.deepEqual(
    t.pesan.map((p) => p.type),
    ['pong', 'sfx', 'interactionError'],
  );
});

test('handler yang melempar tidak menghentikan handler lain', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  let kena = 0;
  unityBridge.on(() => {
    throw new Error('sengaja');
  });
  unityBridge.on(() => {
    kena += 1;
  });
  const { warn } = hitungWarn(() => {
    m.dariUnity({ type: 'missionReady', missionId: 'm2', roundIndex: 3 });
  });
  assert.equal(kena, 1);
  assert.equal(warn, 1);
});

test('dispose() melepas handler & window.RaksaUnityReceive', () => {
  const m = buatMock();
  unityBridge.setContext({ missionId: 'm2', roundIndex: 3 });
  const t = tampung();
  const terima = m.global.RaksaUnityReceive;
  assert.ok(terima, 'handler terpasang sebelum dispose');

  unityBridge.dispose();
  assert.equal(m.global.RaksaUnityReceive, undefined);
  assert.equal('RaksaUnityReceive' in m.global, false);

  // Handler lama tidak lagi menerima apa pun.
  hitungWarn(() => {
    terima(JSON.stringify({ type: 'missionReady', missionId: 'm2', roundIndex: 3 }));
  });
  assert.equal(t.pesan.length, 0);
});
