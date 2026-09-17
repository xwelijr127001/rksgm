/** Server RAKSA GAME: Express + Socket.IO. Sumber kebenaran pertandingan. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { Server as SocketServer, type Socket } from 'socket.io';

import { BRAND, DISCLAIMER, PHASE_DURATIONS } from '../../shared/brand';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../shared/missions';
import { gradeMission, scoreRound } from '../../shared/scoring';
import type { Ack, HostAction, Prizes } from '../../shared/types';
import { assertKeysComplete, buildReveal, keyForMissionId } from './answerKeys';
import { CONFIG, detectLanIp, publicBaseUrl } from './config';
import { buildResultsCsv } from './csv';
import { listMatches, saveMatch } from './db';
import { mountUnity } from './unityServe';
import {
  RoomManager,
  sanitizeAnswer,
  sanitizeEventName,
  sanitizeLook,
  sanitizeNickname,
  type Room,
  type RoomEvent,
} from './rooms';

assertKeysComplete();

const app = express();
app.use(cors());
app.use(express.json({ limit: '128kb' }));

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: true, credentials: false },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ------------------------------------------------------------------ broadcast

const pendingBroadcast = new Set<string>();
let broadcastTimer: NodeJS.Timeout | null = null;

function flushBroadcasts() {
  broadcastTimer = null;
  for (const code of pendingBroadcast) {
    const room = manager.get(code);
    if (!room) continue;
    io.to(code).emit('state', room.publicState());
  }
  pendingBroadcast.clear();
}

/** Kirim snapshot state; digabung (coalesce) 120 ms agar hemat bandwidth. */
function scheduleBroadcast(room: Room) {
  pendingBroadcast.add(room.code);
  if (!broadcastTimer) broadcastTimer = setTimeout(flushBroadcasts, 120);
}

function sendMe(room: Room, playerId: string) {
  const player = room.players.get(playerId);
  if (!player) return;
  io.to(`p:${room.code}:${playerId}`).emit('me', room.privateState(player));
}

function sendMeAll(room: Room) {
  for (const id of room.players.keys()) sendMe(room, id);
}

function onRoomEvent(room: Room, ev: RoomEvent) {
  scheduleBroadcast(room);
  if (ev.type === 'phase' || ev.type === 'finished') {
    // Kirim segera saat fase berubah agar timer client sinkron.
    pendingBroadcast.add(room.code);
    if (broadcastTimer) clearTimeout(broadcastTimer);
    broadcastTimer = setTimeout(flushBroadcasts, 0);
    sendMeAll(room);
  }
  if (ev.type === 'finished' || (ev.type === 'phase' && ev.phase === 'LEADERBOARD')) {
    try {
      saveMatch(room);
    } catch (err) {
      console.error('[db] gagal menyimpan hasil:', (err as Error).message);
    }
  }
}

const manager = new RoomManager(onRoomEvent, publicBaseUrl);

setInterval(() => {
  const removed = manager.sweep();
  if (removed.length) console.log('[room] dibersihkan:', removed.join(', '));
}, 30 * 60 * 1000).unref();

// ------------------------------------------------------------------ REST

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: manager.all().length, now: Date.now() });
});

app.get('/api/config', (_req, res) => {
  res.json({
    brand: BRAND,
    disclaimer: DISCLAIMER,
    phaseDurations: PHASE_DURATIONS,
    joinBaseUrl: publicBaseUrl(),
    lanIp: detectLanIp(),
    totalRounds: MISSIONS.length,
  });
});

/** Konten publik misi (tanpa kunci jawaban) untuk mode latihan & pratinjau. */
app.get('/api/missions', (_req, res) => {
  res.json({ missions: MISSIONS, tutorial: TUTORIAL_MISSION, tiebreak: TIEBREAK_MISSION });
});

/**
 * Penilaian mode LATIHAN. Terpisah dari kompetisi, tidak masuk leaderboard acara.
 * Kunci jawaban tetap di server; client hanya menerima hasil + pembahasan.
 */
app.post('/api/practice/grade', (req, res) => {
  const { missionId, answer, elapsedSeconds } = (req.body ?? {}) as {
    missionId?: string;
    answer?: unknown;
    elapsedSeconds?: number;
  };
  const mission =
    MISSIONS.find((m) => m.id === missionId) ??
    (missionId === TUTORIAL_MISSION.id ? TUTORIAL_MISSION : undefined) ??
    (missionId === TIEBREAK_MISSION.id ? TIEBREAK_MISSION : undefined);
  const key = missionId ? keyForMissionId(missionId) : undefined;
  if (!mission || !key) {
    res.status(404).json({ ok: false, error: 'Misi tidak ditemukan' });
    return;
  }
  const clean = sanitizeAnswer(mission, answer);
  const grade = gradeMission(key, clean);
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, Number(elapsedSeconds)) : mission.durationSeconds;
  const score = scoreRound(grade.accuracy, elapsed, mission.durationSeconds);
  res.json({
    ok: true,
    mode: 'latihan',
    accuracy: grade.accuracy,
    steps: grade.steps,
    score,
    reveal: buildReveal(mission, key),
  });
});

function requireHost(req: express.Request): Room | null {
  const room = manager.get(String(req.params.code ?? ''));
  const token = String(req.query.hostToken ?? req.header('x-host-token') ?? '');
  if (!room || token !== room.hostToken) return null;
  return room;
}

app.get('/api/room/:code/results.csv', (req, res) => {
  const room = requireHost(req);
  if (!room) {
    res.status(403).type('text/plain').send('Token host tidak valid');
    return;
  }
  const filename = `raksa-game-${room.code}-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buildResultsCsv(room));
});

app.get('/api/room/:code/results.json', (req, res) => {
  const room = requireHost(req);
  if (!room) {
    res.status(403).json({ ok: false, error: 'Token host tidak valid' });
    return;
  }
  res.json({
    ok: true,
    code: room.code,
    eventName: room.settings.eventName,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    prizes: room.settings.prizes,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      totalPoints: p.totalPoints,
      totalAccuracy: p.totalAccuracy,
      totalTimeMs: p.totalTimeMs,
      rounds: p.rounds,
    })),
    leaderboard: room.podium ?? room.leaderboard,
  });
});

app.get('/api/matches', (_req, res) => {
  try {
    res.json({ ok: true, matches: listMatches() });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Build Unity disajikan di /unity/* dengan MIME & Content-Encoding yang benar.
// WAJIB dipasang sebelum fallback SPA supaya file Unity yang hilang jadi 404,
// bukan halaman HTML.
mountUnity(app);

// ------------------------------------------------------------------ Socket.IO

interface SocketData {
  code?: string;
  role?: 'host' | 'player' | 'spectator';
  playerId?: string;
}

const ok = <T>(data?: T): Ack<T> => ({ ok: true, data });
const fail = (error: string): Ack<never> => ({ ok: false, error });

type AckFn = (res: Ack<unknown>) => void;
const reply = (cb: unknown, res: Ack<unknown>) => {
  if (typeof cb === 'function') (cb as AckFn)(res);
};

io.on('connection', (socket: Socket) => {
  const data = socket.data as SocketData;

  socket.on('host:create', (payload: { eventName?: string }, cb) => {
    const room = manager.create(sanitizeEventName(payload?.eventName) || undefined);
    data.code = room.code;
    data.role = 'host';
    socket.join(room.code);
    console.log(`[room] dibuat ${room.code} - ${room.settings.eventName}`);
    reply(cb, ok({ code: room.code, hostToken: room.hostToken, state: room.publicState() }));
  });

  socket.on('host:attach', (payload: { code?: string; hostToken?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    if (payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
    data.code = room.code;
    data.role = 'host';
    socket.join(room.code);
    reply(cb, ok({ code: room.code, state: room.publicState() }));
  });

  socket.on(
    'host:settings',
    (
      payload: { code?: string; hostToken?: string; eventName?: string; autoAdvance?: boolean; prizes?: Partial<Prizes> },
      cb,
    ) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room || payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
      const newName = sanitizeEventName(payload?.eventName);
      if (newName) room.settings.eventName = newName;
      if (typeof payload.autoAdvance === 'boolean') room.settings.autoAdvance = payload.autoAdvance;
      if (payload.prizes) {
        for (const k of ['first', 'second', 'third'] as const) {
          const v = payload.prizes[k];
          if (typeof v === 'string') room.settings.prizes[k] = v.slice(0, 60);
        }
      }
      scheduleBroadcast(room);
      reply(cb, ok({ state: room.publicState() }));
    },
  );

  socket.on(
    'host:action',
    (payload: { code?: string; hostToken?: string; action?: HostAction; playerId?: string }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      // Validasi izin host pada SETIAP tindakan.
      if (!room || payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
      try {
        switch (payload.action) {
          case 'startTutorial':
            room.startTutorial();
            break;
          case 'startMatch':
            room.startMatch();
            break;
          case 'pause':
            room.pause();
            break;
          case 'resume':
            room.resume();
            break;
          case 'next':
            room.next();
            break;
          case 'closeRound':
            room.closeRound();
            break;
          case 'end':
            room.finish();
            break;
          case 'reset':
            room.reset();
            break;
          case 'tiebreak':
            room.startTiebreak();
            break;
          case 'retryScene': {
            const pid = String(payload.playerId ?? '');
            if (!room.clearSceneReady(pid)) return reply(cb, fail('Peserta tidak ditemukan'));
            io.to(`p:${room.code}:${pid}`).emit('scene:retry', { roundIndex: room.roundIndex });
            break;
          }
          case 'kick': {
            const pid = String(payload.playerId ?? '');
            io.to(`p:${room.code}:${pid}`).emit('kicked');
            room.removePlayer(pid);
            break;
          }
          default:
            return reply(cb, fail('Tindakan tidak dikenal'));
        }
      } catch (err) {
        return reply(cb, fail((err as Error).message));
      }
      reply(cb, ok({ state: room.publicState() }));
    },
  );

  socket.on('player:join', (payload: { code?: string; nickname?: string; look?: unknown }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan. Periksa kembali kodenya.'));
    if (room.matchStarted) {
      return reply(cb, fail('Pertandingan sudah dimulai. Kamu bisa masuk sebagai penonton.'));
    }
    if (room.players.size >= CONFIG.maxPlayersPerRoom) {
      return reply(cb, fail('Room sudah penuh.'));
    }
    const nickname = sanitizeNickname(payload?.nickname);
    if (nickname.length < 2) return reply(cb, fail('Nama panggilan minimal 2 karakter.'));

    const player = room.addPlayer(nickname, sanitizeLook(payload?.look));
    data.code = room.code;
    data.role = 'player';
    data.playerId = player.id;
    socket.join(room.code);
    socket.join(`p:${room.code}:${player.id}`);
    sendMe(room, player.id);
    reply(
      cb,
      ok({
        playerId: player.id,
        playerToken: player.token,
        code: room.code,
        state: room.publicState(),
        me: room.privateState(player),
      }),
    );
  });

  socket.on('player:rejoin', (payload: { code?: string; playerToken?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal di room ini'));
    room.setConnected(player.id, true);
    data.code = room.code;
    data.role = 'player';
    data.playerId = player.id;
    socket.join(room.code);
    socket.join(`p:${room.code}:${player.id}`);
    sendMe(room, player.id);
    reply(
      cb,
      ok({
        playerId: player.id,
        playerToken: player.token,
        code: room.code,
        state: room.publicState(),
        me: room.privateState(player),
      }),
    );
  });

  socket.on('player:look', (payload: { code?: string; playerToken?: string; nickname?: string; look?: unknown }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
    if (room.matchStarted) return reply(cb, fail('Pertandingan sudah dimulai'));
    const nick = sanitizeNickname(payload?.nickname);
    if (nick.length >= 2) player.nickname = nick;
    if (payload?.look) player.look = sanitizeLook(payload.look);
    scheduleBroadcast(room);
    sendMe(room, player.id);
    reply(cb, ok({ me: room.privateState(player) }));
  });

  socket.on('player:ready', (payload: { code?: string; playerToken?: string; ready?: boolean }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
    player.ready = Boolean(payload?.ready);
    scheduleBroadcast(room);
    reply(cb, ok({}));
  });

  socket.on(
    'player:submit',
    (payload: { code?: string; playerToken?: string; roundIndex?: number; answer?: unknown }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room) return reply(cb, fail('Room tidak ditemukan'));
      const player = room.playerByToken(String(payload?.playerToken ?? ''));
      if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
      const roundIndex = Number(payload?.roundIndex);
      if (!Number.isInteger(roundIndex)) return reply(cb, fail('Nomor ronde tidak valid'));

      const result = room.submit(player, roundIndex, payload?.answer);
      if (!result.accepted) return reply(cb, fail(result.reason ?? 'Jawaban tidak diterima'));
      sendMe(room, player.id);
      // Acknowledgement: client menandai jawaban sudah diterima server.
      reply(
        cb,
        ok({
          accepted: true,
          duplicate: result.reason === 'sudah-terkirim',
          roundIndex,
          elapsedMs: result.elapsedMs ?? 0,
        }),
      );
    },
  );

  /**
   * Client melaporkan adegan 3D ronde ini sudah siap.
   * Hanya informasi untuk host: TIDAK menambah waktu menjawab siapa pun.
   */
  socket.on(
    'player:sceneReady',
    (payload: { code?: string; playerToken?: string; roundIndex?: number }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room) return reply(cb, fail('Room tidak ditemukan'));
      const player = room.playerByToken(String(payload?.playerToken ?? ''));
      if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
      const ok2 = room.markSceneReady(player, Number(payload?.roundIndex));
      reply(cb, ok({ accepted: ok2, roundIndex: room.roundIndex }));
    },
  );

  socket.on('spectator:join', (payload: { code?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    data.code = room.code;
    data.role = 'spectator';
    room.spectators.add(socket.id);
    socket.join(room.code);
    scheduleBroadcast(room);
    reply(cb, ok({ code: room.code, state: room.publicState() }));
  });

  socket.on('state:request', (payload: { code?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    if (data.playerId) {
      const p = room.players.get(data.playerId);
      if (p) sendMe(room, p.id);
    }
    reply(cb, ok({ state: room.publicState() }));
  });

  socket.on('disconnect', () => {
    if (!data.code) return;
    const room = manager.get(data.code);
    if (!room) return;
    room.spectators.delete(socket.id);
    if (data.role === 'player' && data.playerId) {
      // Pemain mungkin hanya refresh; tandai disconnected tapi skor tetap.
      const stillHere = io.sockets.adapter.rooms.get(`p:${room.code}:${data.playerId}`);
      if (!stillHere || stillHere.size === 0) room.setConnected(data.playerId, false);
    }
    scheduleBroadcast(room);
  });
});

// ------------------------------------------------------------------ static

if (fs.existsSync(CONFIG.clientDist)) {
  app.use(express.static(CONFIG.clientDist));
  app.get(/^(?!\/api\/|\/socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(CONFIG.clientDist, 'index.html'));
  });
  console.log('[static] menyajikan', CONFIG.clientDist);
} else {
  app.get('/', (_req, res) => {
    res
      .type('text/plain')
      .send(
        'Server RAKSA GAME aktif.\nMode development: buka client Vite di port ' +
          CONFIG.clientDevPort +
          '.\nUntuk produksi jalankan: npm run build lalu npm start.',
      );
  });
}

server.listen(CONFIG.port, CONFIG.host, () => {
  const base = publicBaseUrl();
  console.log('');
  console.log(`  ${BRAND.gameName} - server aktif`);
  console.log(`  Lokal    : http://localhost:${CONFIG.port}`);
  console.log(`  Jaringan : ${base}`);
  console.log(`  Host     : ${base}/host`);
  console.log(`  Proyektor: ${base}/projector`);
  console.log('');
});

export { app, server, io, manager };
