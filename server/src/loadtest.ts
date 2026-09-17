/**
 * Uji beban sederhana: jalankan satu pertandingan penuh dengan N pemain sungguhan
 * (koneksi Socket.IO terpisah) pada satu proses.
 *
 *   npx tsx server/src/loadtest.ts --players 100
 *
 * Hasilnya dipakai untuk melaporkan jumlah koneksi yang BENAR-BENAR diuji.
 * Ini skrip, bukan bagian dari `npm test`.
 */

import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const argVal = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  const v = i >= 0 ? Number(args[i + 1]) : NaN;
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const PLAYERS = argVal('players', 100);
const PORT = argVal('port', 43918);

process.env.PORT = String(PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = path.join(os.tmpdir(), `raksa-loadtest-${process.pid}.db`);
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.MAX_PLAYERS = String(PLAYERS + 10);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('./index') as typeof import('./index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { io: ioClient } = require('socket.io-client') as typeof import('socket.io-client');
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Ack, RoomPublicState } from '../../shared/types';
import { TOTAL_ROUNDS } from '../../shared/types';
import { keyForRound } from './answerKeys';

const BASE = `http://127.0.0.1:${PORT}`;

function connect(): ClientSocket {
  return ioClient(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
}

function ready(sock: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('gagal connect')), 15000);
    sock.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    sock.once('connect_error', (e: Error) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function rpc<T = unknown>(sock: ClientSocket, event: string, payload: unknown, timeoutMs = 20000): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeoutMs);
    sock.emit(event, payload, (res: Ack<T>) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function waitState(sock: ClientSocket, pred: (s: RoomPublicState) => boolean, label: string, ms = 25000) {
  return new Promise<RoomPublicState>((resolve, reject) => {
    const t = setTimeout(() => {
      sock.off('state', on);
      reject(new Error(`timeout ${label}`));
    }, ms);
    const on = (s: RoomPublicState) => {
      if (!pred(s)) return;
      clearTimeout(t);
      sock.off('state', on);
      resolve(s);
    };
    sock.on('state', on);
  });
}

function answerFor(roundIndex: number, benar: boolean): Record<string, unknown> {
  const key = keyForRound(roundIndex);
  const out: Record<string, unknown> = {};
  if (!key) return out;
  for (const sk of key.steps) {
    if (!benar) continue;
    if (sk.single) out[sk.stepId] = sk.single;
    else if (sk.multi) out[sk.stepId] = [...sk.multi];
    else if (sk.assign) out[sk.stepId] = { ...sk.assign };
    else if (sk.number) out[sk.stepId] = sk.number.value;
    else if (sk.order) out[sk.stepId] = [...sk.order];
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  console.log(`\nUji beban RAKSA GAME: ${PLAYERS} pemain, port ${PORT}`);

  const host = connect();
  await ready(host);
  const created = await rpc<{ code: string; hostToken: string }>(host, 'host:create', {
    eventName: `Uji Beban ${PLAYERS} pemain`,
  });
  if (!created.ok || !created.data) throw new Error('gagal buat room: ' + created.error);
  const { code, hostToken } = created.data;
  await rpc(host, 'host:settings', { code, hostToken, autoAdvance: false });
  console.log(`room ${code} dibuat (${Date.now() - t0} ms)`);

  // ---------------------------------------------------------------- join
  const tJoin = Date.now();
  const players: { sock: ClientSocket; token: string }[] = [];
  let gagalJoin = 0;
  const BATCH = 20;
  for (let i = 0; i < PLAYERS; i += BATCH) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(BATCH, PLAYERS - i) }, async (_unused, k) => {
        const idx = i + k;
        try {
          const sock = connect();
          await ready(sock);
          const res = await rpc<{ playerToken: string }>(sock, 'player:join', {
            code,
            nickname: `Peserta ${idx + 1}`,
            look: { body: idx % 4, skin: idx % 5, hair: idx % 5, color: idx % 6, accessory: 'none' },
          });
          if (!res.ok || !res.data) throw new Error(res.error);
          return { sock, token: res.data.playerToken };
        } catch (err) {
          gagalJoin++;
          console.error(`  join #${idx + 1} gagal: ${(err as Error).message}`);
          return null;
        }
      }),
    );
    for (const p of batch) if (p) players.push(p);
  }
  console.log(`${players.length} pemain bergabung dalam ${Date.now() - tJoin} ms (gagal: ${gagalJoin})`);

  // ---------------------------------------------------------------- pertandingan
  const latensiFase: number[] = [];
  let diterima = 0;
  let ditolak = 0;
  const tMatch = Date.now();

  const briefing0 = waitState(host, (s) => s.phase === 'BRIEFING', 'briefing awal');
  await rpc(host, 'host:action', { code, hostToken, action: 'startMatch' });
  await briefing0;

  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    const tFase = Date.now();
    const active = waitState(host, (s) => s.phase === 'ACTIVE' && s.roundIndex === r, `active ${r}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'next' });
    await active;
    latensiFase.push(Date.now() - tFase);

    const hasil = await Promise.all(
      players.map(async (p, i) => {
        try {
          const res = await rpc<{ accepted: boolean }>(p.sock, 'player:submit', {
            code,
            playerToken: p.token,
            roundIndex: r,
            answer: answerFor(r, i % 3 !== 0),
          });
          return res.ok;
        } catch {
          return false;
        }
      }),
    );
    diterima += hasil.filter(Boolean).length;
    ditolak += hasil.filter((x) => !x).length;

    const reveal = waitState(host, (s) => s.phase === 'REVEAL' && s.roundIndex === r, `reveal ${r}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'closeRound' });
    await reveal;
    const lb = waitState(host, (s) => s.phase === 'LEADERBOARD', `leaderboard ${r}`);
    await rpc(host, 'host:action', { code, hostToken, action: 'next' });
    await lb;
    if (r < TOTAL_ROUNDS - 1) {
      const nextB = waitState(host, (s) => s.phase === 'BRIEFING' && s.roundIndex === r + 1, `briefing ${r + 1}`);
      await rpc(host, 'host:action', { code, hostToken, action: 'next' });
      await nextB;
    }
    process.stdout.write(`  misi ${r + 1}/${TOTAL_ROUNDS} selesai\r`);
  }

  const fin = waitState(host, (s) => s.phase === 'FINISHED', 'finished');
  await rpc(host, 'host:action', { code, hostToken, action: 'next' });
  const akhir = await fin;

  const csv = await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`);
  const csvText = await csv.text();
  const barisCsv = csvText.split('\r\n').filter((l) => l && !l.startsWith('#') && !l.startsWith('﻿#')).length;

  console.log('\n----------------------------------------------');
  console.log(`koneksi socket        : ${players.length + 1} (1 host + ${players.length} pemain)`);
  console.log(`jawaban diterima      : ${diterima}`);
  console.log(`jawaban gagal/ditolak : ${ditolak}`);
  console.log(`latensi transisi fase : maks ${Math.max(...latensiFase)} ms, rata-rata ${Math.round(latensiFase.reduce((a, b) => a + b, 0) / latensiFase.length)} ms`);
  console.log(`durasi pertandingan   : ${((Date.now() - tMatch) / 1000).toFixed(1)} s (tanpa menunggu timer asli)`);
  console.log(`podium                : ${akhir.podium?.slice(0, 3).map((p) => `${p.rank}. ${p.nickname} (${p.totalPoints})`).join(' | ')}`);
  console.log(`baris data CSV        : ${barisCsv} (1 header + ${barisCsv - 1} pemain)`);
  console.log(`total waktu skrip     : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log('----------------------------------------------\n');

  for (const p of players) p.sock.disconnect();
  host.disconnect();
  srv.io.close();
  srv.server.close();
  setTimeout(() => process.exit(0), 300);
}

main().catch((err) => {
  console.error('\nuji beban gagal:', err);
  process.exit(1);
});
