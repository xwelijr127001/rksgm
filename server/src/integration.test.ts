/**
 * Smoke test multiplayer sesungguhnya lewat Socket.IO:
 * 1 host + 2 pemain independen + 1 penonton, satu pertandingan penuh 10 misi.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const PORT = 43917;
const DB_FILE = path.join(os.tmpdir(), `raksa-game-test-${process.pid}.db`);
process.env.PORT = String(PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = DB_FILE;
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('./index') as typeof import('./index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { io: ioClient } = require('socket.io-client') as typeof import('socket.io-client');
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Ack, MePrivate, RoomPublicState } from '../../shared/types';
import { MISSIONS } from '../../shared/missions';
import { TOTAL_ROUNDS } from '../../shared/types';
import { keyForRound } from './answerKeys';

const BASE = `http://127.0.0.1:${PORT}`;

function connect(): ClientSocket {
  return ioClient(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
}

function ready(sock: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (sock.connected) return resolve();
    sock.once('connect', () => resolve());
    sock.once('connect_error', reject);
  });
}

function rpc<T = unknown>(sock: ClientSocket, event: string, payload: unknown): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), 8000);
    sock.emit(event, payload, (res: Ack<T>) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

/** Tunggu sampai snapshot state memenuhi kondisi. */
function waitState(sock: ClientSocket, pred: (s: RoomPublicState) => boolean, label = 'state'): Promise<RoomPublicState> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      sock.off('state', on);
      reject(new Error(`timeout menunggu ${label}`));
    }, 8000);
    const on = (s: RoomPublicState) => {
      if (pred(s)) {
        clearTimeout(t);
        sock.off('state', on);
        resolve(s);
      }
    };
    sock.on('state', on);
  });
}

function waitMe(sock: ClientSocket, pred: (m: MePrivate) => boolean, label = 'me'): Promise<MePrivate> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      sock.off('me', on);
      reject(new Error(`timeout menunggu ${label}`));
    }, 8000);
    const on = (m: MePrivate) => {
      if (pred(m)) {
        clearTimeout(t);
        sock.off('me', on);
        resolve(m);
      }
    };
    sock.on('me', on);
  });
}

function perfectAnswer(roundIndex: number): Record<string, unknown> {
  const key = keyForRound(roundIndex)!;
  const answer: Record<string, unknown> = {};
  for (const sk of key.steps) {
    if (sk.single) answer[sk.stepId] = sk.single;
    else if (sk.multi) answer[sk.stepId] = [...sk.multi];
    else if (sk.assign) answer[sk.stepId] = { ...sk.assign };
    else if (sk.number) answer[sk.stepId] = sk.number.value;
    else if (sk.order) answer[sk.stepId] = [...sk.order];
  }
  return answer;
}

function wrongAnswer(roundIndex: number): Record<string, unknown> {
  const mission = MISSIONS[roundIndex];
  const answer: Record<string, unknown> = {};
  for (const step of mission.steps) {
    if (step.kind === 'single') {
      const key = keyForRound(roundIndex)!.steps.find((s) => s.stepId === step.id);
      const wrong = step.options.find((o) => o.id !== key?.single);
      if (wrong) answer[step.id] = wrong.id;
    } else if (step.kind === 'multi') {
      // Pilih SEMUA opsi: harus tetap tidak menghasilkan skor penuh.
      answer[step.id] = step.options.map((o) => o.id);
    } else if (step.kind === 'assign') {
      answer[step.id] = Object.fromEntries(step.items.map((it) => [it.id, step.buckets[step.buckets.length - 1].id]));
    } else if (step.kind === 'number') {
      answer[step.id] = 1;
    }
  }
  return answer;
}

test('pertandingan penuh: host + 2 pemain + penonton', async (t) => {
  const host = connect();
  const p1 = connect();
  const p2 = connect();
  const spec = connect();
  const sockets = [host, p1, p2, spec];
  await Promise.all(sockets.map(ready));
  /** Socket Ani; diganti saat menguji reconnect. */
  let pa: ClientSocket = p1;

  t.after(() => {
    for (const s of sockets) s.disconnect();
    srv.io.close();
    srv.server.close();
    try {
      fs.rmSync(DB_FILE, { force: true });
      fs.rmSync(DB_FILE + '-wal', { force: true });
      fs.rmSync(DB_FILE + '-shm', { force: true });
    } catch {
      /* abaikan */
    }
  });

  // ---------------------------------------------------------------- host buat room
  const created = await rpc<{ code: string; hostToken: string; state: RoomPublicState }>(host, 'host:create', {
    eventName: 'Smoke Test Gathering',
  });
  assert.equal(created.ok, true);
  const code = created.data!.code;
  const hostToken = created.data!.hostToken;
  assert.match(code, /^[A-Z0-9]{4}$/);
  assert.notEqual(hostToken, code, 'token host terpisah dari kode room');
  assert.equal(created.data!.state.phase, 'LOBBY');
  assert.match(created.data!.state.joinUrl, new RegExp(`/join\\?room=${code}$`));

  await rpc(host, 'host:settings', { code, hostToken, autoAdvance: false, prizes: { first: 'Voucher A' } });

  // ---------------------------------------------------------------- pemain gabung
  const j1 = await rpc<{ playerId: string; playerToken: string; me: MePrivate }>(p1, 'player:join', {
    code,
    nickname: 'Ani',
    look: { body: 1, skin: 2, hair: 1, color: 3, accessory: 'helm' },
  });
  assert.equal(j1.ok, true, j1.error);
  const t1 = j1.data!.playerToken;

  const j2 = await rpc<{ playerId: string; playerToken: string }>(p2, 'player:join', {
    code,
    nickname: 'Budi',
    look: { accessory: 'headset' },
  });
  assert.equal(j2.ok, true, j2.error);
  const t2 = j2.data!.playerToken;

  const badCode = await rpc(p2, 'player:join', { code: 'ZZZZ', nickname: 'Nyasar' });
  assert.equal(badCode.ok, false);
  assert.match(badCode.error!, /tidak ditemukan/);

  const shortNick = await rpc(spec, 'player:join', { code, nickname: 'A' });
  assert.equal(shortNick.ok, false);
  assert.match(shortNick.error!, /minimal 2/);

  // ---------------------------------------------------------------- penonton
  const sp = await rpc<{ state: RoomPublicState }>(spec, 'spectator:join', { code });
  assert.equal(sp.ok, true);
  assert.equal(sp.data!.state.playerCount, 2);

  const lobby = await rpc<{ state: RoomPublicState }>(host, 'state:request', { code });
  assert.equal(lobby.data!.state.spectatorCount, 1);
  assert.equal(lobby.data!.state.playerCount, 2);
  assert.deepEqual(
    lobby.data!.state.players.map((p) => p.nickname).sort(),
    ['Ani', 'Budi'],
  );
  assert.equal(lobby.data!.state.players.find((p) => p.nickname === 'Ani')!.look.accessory, 'helm');
  assert.equal(lobby.data!.state.prizes.first, 'Voucher A');

  // ---------------------------------------------------------------- izin host
  const hijack = await rpc(pa, 'host:action', { code, hostToken: 'token-palsu', action: 'startMatch' });
  assert.equal(hijack.ok, false);
  assert.match(hijack.error!, /Token host/);
  const hijack2 = await rpc(pa, 'host:action', { code, action: 'end' });
  assert.equal(hijack2.ok, false);
  const hijackSettings = await rpc(pa, 'host:settings', { code, autoAdvance: true });
  assert.equal(hijackSettings.ok, false);
  const stillLobby = await rpc<{ state: RoomPublicState }>(host, 'state:request', { code });
  assert.equal(stillLobby.data!.state.phase, 'LOBBY', 'pemain biasa tidak bisa mengubah fase');

  // ---------------------------------------------------------------- tutorial
  await rpc(host, 'host:action', { code, hostToken, action: 'startTutorial' });
  const tut = await rpc<{ state: RoomPublicState }>(pa, 'state:request', { code });
  assert.equal(tut.data!.state.phase, 'TUTORIAL');
  assert.equal(tut.data!.state.mission, null, 'tutorial tidak memakai misi kompetisi');
  const tooEarly = await rpc(pa, 'player:submit', { code, playerToken: t1, roundIndex: 0, answer: perfectAnswer(0) });
  assert.equal(tooEarly.ok, false, 'jawaban kompetisi belum diterima saat tutorial');

  // ---------------------------------------------------------------- mulai pertandingan
  const briefing = waitState(pa, (s) => s.phase === 'BRIEFING' && s.roundIndex === 0, 'BRIEFING 1');
  await rpc(host, 'host:action', { code, hostToken, action: 'startMatch' });
  const b0 = await briefing;
  assert.equal(b0.mission?.id, MISSIONS[0].id);
  assert.equal(b0.reveal, null, 'kunci jawaban tidak dikirim sebelum REVEAL');
  assert.ok(b0.phaseEndsAt && b0.phaseEndsAt > b0.serverNow);

  const lateJoin = await rpc(connect(), 'player:join', { code, nickname: 'Telat' });
  assert.equal(lateJoin.ok, false);
  assert.match(lateJoin.error!, /sudah dimulai/);

  // ---------------------------------------------------------------- 10 ronde
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const active = waitState(pa, (s) => s.phase === 'ACTIVE' && s.roundIndex === i, `ACTIVE ${i + 1}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'next' });
    const st = await active;
    assert.equal(st.mission?.number, i + 1);
    assert.equal(st.reveal, null);
    assert.equal(st.submittedCount, 0);

    const s1 = await rpc<{ accepted: boolean; duplicate: boolean }>(pa, 'player:submit', {
      code,
      playerToken: t1,
      roundIndex: i,
      answer: perfectAnswer(i),
    });
    assert.equal(s1.ok, true, s1.error);
    assert.equal(s1.data!.accepted, true);
    assert.equal(s1.data!.duplicate, false);

    // Pengiriman ulang (mis. jaringan) tidak boleh menggandakan skor.
    const dup = await rpc<{ duplicate: boolean }>(pa, 'player:submit', {
      code,
      playerToken: t1,
      roundIndex: i,
      answer: wrongAnswer(i),
    });
    assert.equal(dup.ok, true);
    assert.equal(dup.data!.duplicate, true, 'pengiriman kedua ditandai duplikat');

    // Ronde yang salah ditolak.
    const wrongRound = await rpc(p2, 'player:submit', { code, playerToken: t2, roundIndex: i + 5, answer: {} });
    assert.equal(wrongRound.ok, false);

    if (i < TOTAL_ROUNDS - 1) {
      const s2 = await rpc(p2, 'player:submit', { code, playerToken: t2, roundIndex: i, answer: wrongAnswer(i) });
      assert.equal(s2.ok, true, s2.error);
    }
    // Ronde terakhir: Budi tidak mengirim jawaban -> 0 poin.

    const reveal = waitState(host, (s) => s.phase === 'REVEAL' && s.roundIndex === i, `REVEAL ${i + 1}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'closeRound' });
    const rv = await reveal;
    assert.ok(rv.reveal, 'pembahasan tersedia setelah ronde ditutup');
    assert.equal(rv.reveal!.roundIndex, i);
    assert.ok(rv.reveal!.steps.every((s) => s.correctText.length > 0));
    assert.ok(rv.leaderboard && rv.leaderboard.length === 2);
    assert.equal(rv.leaderboard![0].nickname, 'Ani');

    const lb = waitState(host, (s) => s.phase === 'LEADERBOARD', `LEADERBOARD ${i + 1}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'next' });
    await lb;

    if (i === 2) {
      // Reconnect di tengah pertandingan: identitas & skor harus bertahan.
      const before = await rpc<{ state: RoomPublicState }>(host, 'state:request', { code });
      const poinSebelum = before.data!.state.players.find((p) => p.nickname === 'Ani')!.totalPoints;
      pa.disconnect();
      await new Promise((r) => setTimeout(r, 120));
      const p1b = connect();
      await ready(p1b);
      const rj = await rpc<{ playerId: string; me: MePrivate; state: RoomPublicState }>(p1b, 'player:rejoin', {
        code,
        playerToken: t1,
      });
      assert.equal(rj.ok, true, rj.error);
      assert.equal(rj.data!.me.nickname, 'Ani');
      assert.equal(rj.data!.me.totalPoints, poinSebelum, 'skor tidak hilang saat reconnect');
      assert.ok(rj.data!.me.rounds.length === 3);
      sockets.push(p1b);
      pa = p1b; // sisa pertandingan memakai socket baru

      const rejoinBad = await rpc(p1b, 'player:rejoin', { code, playerToken: 'token-palsu' });
      assert.equal(rejoinBad.ok, false);
    }

    if (i < TOTAL_ROUNDS - 1) {
      const nextBriefing = waitState(host, (s) => s.phase === 'BRIEFING' && s.roundIndex === i + 1, `BRIEFING ${i + 2}`);
      await rpc(host, 'host:action', { code, hostToken, action: 'next' });
      await nextBriefing;
    }
  }

  // ---------------------------------------------------------------- selesai
  const finished = waitState(host, (s) => s.phase === 'FINISHED', 'FINISHED');
  await rpc(host, 'host:action', { code, hostToken, action: 'next' });
  const fin = await finished;
  assert.ok(fin.podium);
  assert.equal(fin.podium!.length, 2);
  assert.equal(fin.podium![0].nickname, 'Ani');
  assert.equal(fin.podium![0].rank, 1);
  assert.equal(fin.podium![0].answeredCount, TOTAL_ROUNDS);
  assert.ok(fin.podium![0].totalPoints > fin.podium![1].totalPoints);
  assert.equal(fin.podium![1].answeredCount, TOTAL_ROUNDS - 1);
  assert.equal(fin.tie, false);

  const me1 = await rpc<{ state: RoomPublicState }>(pa, 'state:request', { code });
  assert.equal(me1.data!.state.phase, 'FINISHED');
  const mePrivate = await waitMe(pa, (m) => m.badges.length >= 0, 'me final').catch(() => null);
  if (mePrivate) assert.equal(mePrivate.nickname, 'Ani');

  // Memilih semua opsi (Budi) tidak menghasilkan skor penuh.
  const budi = fin.podium!.find((p) => p.nickname === 'Budi')!;
  const ani = fin.podium!.find((p) => p.nickname === 'Ani')!;
  assert.ok(budi.totalAccuracy < ani.totalAccuracy * 0.8, 'jawaban "pilih semua" jauh di bawah jawaban tepat');

  // ---------------------------------------------------------------- ekspor CSV
  const csvRes = await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`);
  assert.equal(csvRes.status, 200);
  const csv = await csvRes.text();
  assert.match(csv, /kode_room,nama_acara,peringkat/);
  assert.match(csv, /Ani/);
  assert.match(csv, /Budi/);
  assert.match(csv, /misi10_poin/);
  assert.match(csv, /Smoke Test Gathering/);
  const dataLines = csv.split('\r\n').filter((l) => l && !l.startsWith('﻿#') && !l.startsWith('#'));
  assert.ok(dataLines.length >= 3, 'header + 2 pemain');

  const csvDenied = await fetch(`${BASE}/api/room/${code}/results.csv`);
  assert.equal(csvDenied.status, 403);

  const jsonRes = await fetch(`${BASE}/api/room/${code}/results.json?hostToken=${hostToken}`);
  const json = (await jsonRes.json()) as { ok: boolean; players: { rounds: unknown[] }[] };
  assert.equal(json.ok, true);
  assert.equal(json.players.length, 2);
  assert.equal(json.players[0].rounds.length, TOTAL_ROUNDS);

  // ---------------------------------------------------------------- database
  const matches = (await (await fetch(`${BASE}/api/matches`)).json()) as {
    ok: boolean;
    matches: { code: string; player_count: number }[];
  };
  assert.equal(matches.ok, true);
  assert.ok(matches.matches.some((m) => m.code === code && m.player_count === 2), 'hasil tersimpan di SQLite');

  // ---------------------------------------------------------------- endpoint publik
  const missionsRes = (await (await fetch(`${BASE}/api/missions`)).json()) as { missions: unknown[] };
  assert.equal(missionsRes.missions.length, TOTAL_ROUNDS);
  assert.equal(JSON.stringify(missionsRes).includes('explanation'), false, 'kunci jawaban tidak ada di /api/missions');

  const practice = (await (
    await fetch(`${BASE}/api/practice/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ missionId: MISSIONS[8].id, answer: perfectAnswer(8), elapsedSeconds: 10 }),
    })
  ).json()) as { ok: boolean; mode: string; accuracy: number; reveal: { steps: unknown[] } };
  assert.equal(practice.ok, true);
  assert.equal(practice.mode, 'latihan');
  assert.equal(practice.accuracy, 1);
  assert.equal(practice.reveal.steps.length, 3);
});
