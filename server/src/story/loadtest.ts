/**
 * Bounded load test of Story Rooms against a RUNNING, ISOLATED server (a DB copy — never production):
 *
 *   LOAD_BASE=http://127.0.0.1:4840 LOAD_HOST_USER=uji.host LOAD_HOST_PASSWORD=… \
 *   LOAD_ROOMS=5 LOAD_PER_ROOM=40 LOAD_ROUNDS=3 npm -w @raksa/server run story:loadtest
 *
 * Simulated participants are Socket.IO clients in this process (one connection each). Per room the host opens choices
 * after 2 s of reading and continues after the consequence minimum, so rounds are short; answer windows, deadlines and
 * scoring are the server's real ones. Measured: join latency, answer acknowledgement latency, skew of the moment the
 * answering phase reaches each participant, delay from the last answer to the consequence phase (all-answered close),
 * and errors. Output: one JSON document (stdout) for docs/prd-v02/evidence/load/.
 */
import os from 'node:os';
import { io, type Socket } from 'socket.io-client';
import type { StoryAck, StoryPrivateState, StoryPublicState } from '../../../shared/story/protocol';

const BASE = (process.env.LOAD_BASE ?? 'http://127.0.0.1:4840').replace(/\/+$/, '');
const ROOMS = Number(process.env.LOAD_ROOMS ?? 5);
const PER_ROOM = Number(process.env.LOAD_PER_ROOM ?? 40);
const ROUNDS = Number(process.env.LOAD_ROUNDS ?? 3);
const USER = process.env.LOAD_HOST_USER ?? 'uji.host';
const PASSWORD = process.env.LOAD_HOST_PASSWORD ?? '';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errors: string[] = [];
const joinMs: number[] = [];
const ackMs: number[] = [];
const skewMs: number[] = [];
const closeMs: number[] = [];

function connect(auth?: Record<string, string>): Promise<Socket> {
  const s = io(`${BASE}/story`, { transports: ['websocket'], forceNew: true, auth, reconnection: false, timeout: 20000 });
  return new Promise((resolve, reject) => {
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}

function rpc<T>(s: Socket, event: string, payload: unknown): Promise<StoryAck<T>> {
  return new Promise((resolve) => s.timeout(20000).emit(event, payload, (err: unknown, res: StoryAck<T>) => resolve(err ? { ok: false, code: 'invalid', error: String(err) } : res)));
}

function pct(list: number[], p: number): number | null {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]!);
}

async function runRoom(roomIndex: number, token: string, scenarioId: string): Promise<{ code: string; rounds: number; participants: number }> {
  const host = await connect({ staffToken: token });
  const created = await rpc<{ code: string }>(host, 'host:create', { scenarioId, autoAdvance: true });
  if (!created.ok) throw new Error(`room ${roomIndex}: ${created.error}`);
  const code = created.data.code;
  let hostState: StoryPublicState | null = null;
  host.on('story:public', (s: StoryPublicState) => {
    if (s.code === code) hostState = s;
  });

  const answeringSeen = new Map<number, number[]>();
  const lastAckAt = new Map<number, number>();
  const consequenceSeenAt = new Map<number, number>();
  const players: Socket[] = [];
  for (let i = 0; i < PER_ROOM; i++) {
    const s = await connect();
    const t0 = performance.now();
    const joined = await rpc<{ participantId: string }>(s, 'participant:join', { code, name: `Beban ${roomIndex + 1}-${i + 1}`, acceptNotice: true });
    if (!joined.ok) {
      errors.push(`join r${roomIndex} p${i}: ${joined.error}`);
      s.close();
      continue;
    }
    joinMs.push(performance.now() - t0);
    let answeredRound = 0;
    let mine: StoryPublicState | null = null;
    const answeringRounds = new Set<number>();
    s.on('story:public', (st: StoryPublicState) => {
      mine = st;
      // Skew = spread of the moment each participant FIRST sees the answering phase of a round (later snapshots in the
      // same phase only carry answer counts).
      if (st.phase === 'answering' && !answeringRounds.has(st.roundNumber)) {
        answeringRounds.add(st.roundNumber);
        const list = answeringSeen.get(st.roundNumber) ?? [];
        list.push(performance.now());
        answeringSeen.set(st.roundNumber, list);
      }
      if (st.phase === 'consequence' && !consequenceSeenAt.has(st.roundNumber)) consequenceSeenAt.set(st.roundNumber, performance.now());
    });
    s.on('story:private', (me: StoryPrivateState) => {
      if (!me.options || me.answer || answeredRound === me.roundNumber) return;
      answeredRound = me.roundNumber;
      const round = me.roundNumber;
      const option = me.options[Math.floor(Math.random() * me.options.length)]!.handle;
      setTimeout(async () => {
        const t = performance.now();
        const res = await rpc(s, 'participant:answer', { roundId: (mine as StoryPublicState | null)?.scene?.roundId, option });
        if (res.ok) {
          ackMs.push(performance.now() - t);
          lastAckAt.set(round, Math.max(lastAckAt.get(round) ?? 0, performance.now()));
        } else if (res.code !== 'late') errors.push(`answer r${roomIndex} round ${round}: ${res.error}`);
      }, 500 + Math.random() * 7500);
    });
    players.push(s);
  }

  const started = await rpc(host, 'host:start', { code });
  if (!started.ok) throw new Error(`start ${code}: ${started.error}`);
  let rounds = 0;
  const deadline = Date.now() + ROUNDS * 90_000;
  while (Date.now() < deadline) {
    await sleep(250);
    const st = hostState as StoryPublicState | null;
    if (!st) continue;
    if (st.phase === 'scene' && st.phaseEndsAt && st.phaseDurationMs && Date.now() - (st.phaseEndsAt - st.phaseDurationMs) > 2000) await rpc(host, 'host:next', { code });
    if (st.phase === 'consequence' && st.phaseEndsAt && st.phaseDurationMs && Date.now() - (st.phaseEndsAt - st.phaseDurationMs) > 4500) await rpc(host, 'host:next', { code });
    if (st.phase === 'leaderboard') {
      rounds = st.roundNumber;
      if (rounds >= ROUNDS) break;
    }
    if (st.phase === 'finished') {
      rounds = st.roundNumber;
      break;
    }
  }
  for (const seen of answeringSeen.values()) if (seen.length > 1) skewMs.push(Math.max(...seen) - Math.min(...seen));
  for (const [round, last] of lastAckAt) {
    const c = consequenceSeenAt.get(round);
    if (c !== undefined && c >= last) closeMs.push(c - last);
  }
  await rpc(host, 'host:close', { code });
  host.close();
  for (const p of players) p.close();
  return { code, rounds, participants: players.length };
}

async function main(): Promise<void> {
  if (!PASSWORD) throw new Error('Set LOAD_HOST_PASSWORD (test identity from story:dev-setup).');
  const login = (await (await fetch(`${BASE}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: USER, password: PASSWORD }) })).json()) as { ok: boolean; token: string; error?: string };
  if (!login.ok) throw new Error(`login: ${login.error}`);
  const list = (await (await fetch(`${BASE}/api/host/scenarios`, { headers: { authorization: `Bearer ${login.token}` } })).json()) as { scenarios: { scenarioId: string; title: string }[] };
  const scenario = list.scenarios[0];
  if (!scenario) throw new Error('no published scenario');
  const t0 = Date.now();
  const rooms = await Promise.all(Array.from({ length: ROOMS }, (_, i) => runRoom(i, login.token, scenario.scenarioId).catch((e: Error) => (errors.push(e.message), null))));
  const result = {
    at: new Date().toISOString(),
    machine: { cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, memGb: Math.round(os.totalmem() / 1e9), platform: `${os.platform()} ${os.release()}`, node: process.version },
    note: 'Server and simulated clients on the SAME machine (loopback). Not a production capacity statement.',
    config: { rooms: ROOMS, participantsPerRoom: PER_ROOM, roundsPerRoom: ROUNDS, scenario: scenario.title },
    durationSec: Math.round((Date.now() - t0) / 1000),
    rooms: rooms.filter(Boolean),
    joinMs: { n: joinMs.length, p50: pct(joinMs, 50), p95: pct(joinMs, 95), max: pct(joinMs, 100) },
    answerAckMs: { n: ackMs.length, p50: pct(ackMs, 50), p95: pct(ackMs, 95), max: pct(ackMs, 100) },
    answeringPhaseSkewMs: { n: skewMs.length, p50: pct(skewMs, 50), p95: pct(skewMs, 95), max: pct(skewMs, 100) },
    lastAnswerToConsequenceMs: { n: closeMs.length, p50: pct(closeMs, 50), p95: pct(closeMs, 95), max: pct(closeMs, 100) },
    errors: errors.slice(0, 50),
    errorCount: errors.length,
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
