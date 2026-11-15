/**
 * End-to-end Story Room test over the REAL server (Express + Socket.IO `/story` + SQLite), with fast test timing
 * (NODE_ENV=test + STORY_TEST_TIMING=fast; production timing is fixed at 30 s answers).
 *
 * Covers: role separation on REST and sockets, CMS create -> validate -> submit -> four-eyes publish, draft not
 * selectable, room creation pinned to a version, join with name notice + validation, capacity, 15 synchronized rounds
 * with best/poor/partial/timeout participants, reconnect with missed rounds, private payload isolation, closed-room
 * replay attempts, persisted personal results, reports/exports/analytics, revision + archive while a room is pinned,
 * and the restart (interrupted) policy. Settled-case script features on real sockets (SYNTHETIC content): conditional
 * delayed-consequence lines reach only the flag holder (never the projector, host or other participants), opening
 * lines, cast names and {nama} arrive as authored, the delayed change is stored once, status-only endings including
 * "unhappy" reach reports, and the summary of a room interrupted by a restart derives the delayed change. Gameplay
 * payloads on real sockets: the same evidence for every device incl. projector and host, the lesson only after close,
 * reminders only for the flag holder, one final answer (a retry is acknowledged, another option refused), a chat action
 * that stays an action (live, stored and rebuilt summaries), the room asset list by reached round, and summary
 * labels/flag notes in a result reopened after the room left memory. CMS validation tells uploaded pictures from
 * built-in ones; on every phase change each device receives the public snapshot before its private one.
 */
// MUST stay the first import (see testing/integrationEnv.ts): isolates port and database from the real data/.
import { STORY_TEST_DB as DB_FILE, STORY_TEST_PORT as PORT } from './testing/integrationEnv';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('../index') as typeof import('../index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { io: ioClient } = require('socket.io-client') as typeof import('socket.io-client');
import type { Socket as ClientSocket } from 'socket.io-client';
import { textKey, type Classification, type ScenarioContent } from '../../../shared/story/content';
import type { AssetView } from '../../../shared/story/dto';
import type { StoryAck, StoryFinalSummary, StoryJoinResult, StoryOption, StoryPhase, StoryPrivateState, StoryPublicState } from '../../../shared/story/protocol';
import type { StaffRole } from '../../../shared/story/roles';
import type { ContentIssue } from '../../../shared/story/validate';
import { createStaff } from './auth/staff';
import { ASSET_URL_PREFIX, assetFolder } from './content/assets';
import { closeDb, getDb } from '../db';
import { demoBaretContent } from './seed/demoBaret';
import { decisionsFromRows, persistedRoomByCode, persistedSummary, recoverInterruptedRooms, type DecisionRow } from './runtime/sqliteStore';
import { storyLimiters } from './socket';
import { addTestEvidence, buildFeatureScenario, buildGameplayScenario, buildTestScenario, FEATURE, GAMEPLAY } from './testing/fixtures';

const BASE = `http://127.0.0.1:${PORT}`;
if (!getDb().name.includes('raksa-story-int-')) throw new Error(`Refusing to run: test would use ${getDb().name}`);
const SETUP = { id: null, name: 'test-setup' };
const PASSWORD = 'kata-sandi-uji-panjang';

async function api<T = Record<string, unknown>>(method: string, url: string, token: string | null, body?: unknown): Promise<{ status: number; json: T; text: string }> {
  const res = await fetch(BASE + url, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = Buffer.from(await res.arrayBuffer()).toString('utf8'); // keeps a leading BOM (res.text() strips it)
  let json = {} as T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    /* CSV etc. */
  }
  return { status: res.status, json, text };
}

const tokens: Record<string, string> = {};
async function staff(username: string, roles: StaffRole[]) {
  createStaff({ username, displayName: username.toUpperCase(), password: PASSWORD, roles }, SETUP);
  const r = await api<{ token: string }>('POST', '/api/staff/login', null, { username, password: PASSWORD });
  assert.equal(r.status, 200, `login ${username}`);
  tokens[username] = r.json.token;
}

function connect(staffToken?: string): Promise<ClientSocket> {
  const s = ioClient(`${BASE}/story`, { transports: ['websocket'], forceNew: true, reconnection: false, auth: staffToken ? { staffToken } : {} });
  return new Promise((resolve, reject) => {
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}

function rpc<T>(s: ClientSocket, ev: string, payload: unknown): Promise<StoryAck<T>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${ev}`)), 8000);
    s.emit(ev, payload, (res: StoryAck<T>) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function waitFor<T>(s: ClientSocket, ev: string, pred: (v: T) => boolean, label: string, ms = 60_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      s.off(ev, h);
      reject(new Error(`timeout waiting for ${label}`));
    }, ms);
    const h = (v: T) => {
      if (pred(v)) {
        clearTimeout(t);
        s.off(ev, h);
        resolve(v);
      }
    };
    s.on(ev, h);
  });
}

/** What a bot answers in a round: the first choice of a classification, one specific choice, or nothing (timeout). */
type Strategy = (round: number) => Classification | { choiceId: string } | null;

/** A participant bot: reports scene readiness, answers by classification or choice (test knows the content), records payloads. */
class Bot {
  sock!: ClientSocket;
  credential = '';
  me: StoryPrivateState | null = null;
  pub: StoryPublicState | null = null;
  publicPayloads: string[] = [];
  privatePayloads: string[] = [];
  /** Per round number: the options this bot was shown (kept after the window closed) and the handle it sent. */
  shown = new Map<number, StoryOption[]>();
  sent = new Map<number, string>();
  private answered = new Set<number>();
  private ready = new Set<string>();
  constructor(readonly name: string, private strategy: Strategy, private content: ScenarioContent) {}

  private wire() {
    this.sock.on('story:public', (s: StoryPublicState) => {
      this.pub = s;
      this.publicPayloads.push(JSON.stringify(s));
      if (s.phase === 'scene' && s.scene && !this.ready.has(s.scene.roundId)) {
        this.ready.add(s.scene.roundId);
        this.sock.emit('participant:ready', { roundId: s.scene.roundId }, () => {});
      }
    });
    this.sock.on('story:private', (me: StoryPrivateState) => {
      this.me = me;
      this.privatePayloads.push(JSON.stringify(me));
      if (me.options) this.shown.set(me.roundNumber, me.options);
      if (me.options && !this.answered.has(me.roundNumber) && this.pub?.scene) {
        const want = this.strategy(me.roundNumber);
        if (!want) return;
        const round = this.content.rounds[me.roundNumber - 1]!;
        const choice = round.choices.find((c) => (typeof want === 'string' ? c.classification === want : c.id === want.choiceId))!;
        const text = this.content.text.id![textKey.choiceText(round.id, choice.id)];
        const opt = me.options.find((o) => o.text === text)!;
        this.answered.add(me.roundNumber);
        this.sent.set(me.roundNumber, opt.handle);
        this.sock.emit('participant:answer', { roundId: this.pub.scene.roundId, option: opt.handle }, () => {});
      }
    });
  }

  async join(code: string): Promise<StoryAck<StoryJoinResult>> {
    this.sock = await connect();
    this.wire();
    const r = await rpc<StoryJoinResult>(this.sock, 'participant:join', { code, name: this.name, acceptNotice: true });
    if (r.ok) {
      this.credential = r.data.credential;
      this.me = r.data.me;
      this.pub = r.data.state;
    }
    return r;
  }

  async resume(code: string) {
    this.sock = await connect();
    this.wire();
    return rpc<{ state: StoryPublicState; me: StoryPrivateState }>(this.sock, 'participant:resume', { code, credential: this.credential });
  }
}

test.before(async () => {
  if (!srv.server.listening) await new Promise<void>((resolve) => srv.server.once('listening', () => resolve()));
});

let scenarioId = '';
let roomCode = '';
const content = demoBaretContent();
/** Picture files the tests uploaded (into the asset folder next to the temporary database), removed after the run. */
const uploadedFiles = new Set<string>();

test.after(() => {
  srv.io.close();
  srv.server.close();
  // An open connection keeps the file locked on Windows, and the removal below would silently leave it behind.
  closeDb();
  try {
    fs.rmSync(DB_FILE, { force: true });
    fs.rmSync(DB_FILE + '-wal', { force: true });
    fs.rmSync(DB_FILE + '-shm', { force: true });
    for (const file of uploadedFiles) fs.rmSync(file, { force: true });
    // The folder is shared with other runs in the same temp directory: removed only once empty.
    if (uploadedFiles.size && fs.readdirSync(assetFolder()).length === 0) fs.rmdirSync(assetFolder());
  } catch {
    /* ignore */
  }
});

/** A 1×1 PNG: the smallest real image the asset library accepts (it detects the type from the bytes). */
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/**
 * Uploads TINY_PNG as a `kind` asset through the CMS (system admin) and returns its id: field scenes and evidence
 * pictures need UPLOADED images (the seeded built-in backgrounds have no file).
 */
async function uploadPicture(kind: 'background' | 'photo', title: string): Promise<string> {
  const query = new URLSearchParams({ kind, title, source: 'Gambar uji sintetis', license: 'Khusus pengujian otomatis' });
  const res = await fetch(`${BASE}/api/cms/assets?${query}`, { method: 'POST', headers: { authorization: `Bearer ${tokens.admin}`, 'content-type': 'application/octet-stream' }, body: TINY_PNG });
  const json = (await res.json()) as { asset?: AssetView; error?: string };
  assert.equal(res.status, 200, json.error);
  const asset = json.asset!;
  assert.equal(asset.builtin, false);
  uploadedFiles.add(path.join(assetFolder(), asset.url!.slice(ASSET_URL_PREFIX.length)));
  return asset.id;
}

test('setup: staff identities and login; legacy APIs are refused in the MVP configuration', async () => {
  await staff('admin', ['system_admin']);
  await staff('penulis', ['author']);
  await staff('reviewer', ['reviewer']);
  await staff('penulisreviewer', ['author', 'reviewer']);
  await staff('host', ['host']);
  await staff('host2', ['host']);
  await staff('panitia', ['competition_admin']);
  const bad = await api('POST', '/api/staff/login', null, { username: 'host', password: 'salah-kata-sandi' });
  assert.equal(bad.status, 401);
  const legacy = await api('GET', '/api/missions', null);
  assert.equal(legacy.status, 404, 'legacy solo/mission API is off by default');
  const cfg = await api<{ features: { legacy: boolean }; story: { answerWindowMs: number } }>('GET', '/api/config', null);
  assert.equal(cfg.json.features.legacy, false);
  assert.equal(cfg.json.story.answerWindowMs, 30_000, 'the advertised policy window is the PRD 30 s');
});

test('role separation is enforced on the server (REST), not just hidden in the UI', async () => {
  const deny = async (method: string, url: string, who: string | null, expected: number, body?: unknown) => {
    const r = await api(method, url, who ? tokens[who]! : null, body);
    assert.equal(r.status, expected, `${who ?? 'anon'} ${method} ${url} -> ${r.status}`);
  };
  await deny('GET', '/api/cms/scenarios', null, 401);
  await deny('GET', '/api/cms/scenarios', 'host', 403);
  await deny('POST', '/api/cms/scenarios', 'reviewer', 403, { categoryId: 'auto', title: 'x', contentSource: 'demo' });
  await deny('GET', '/api/host/scenarios', 'penulis', 403);
  await deny('GET', '/api/admin/dashboard', 'host', 403);
  await deny('POST', '/api/admin/periods', 'penulis', 403, {});
  await deny('GET', '/api/admin/users', 'panitia', 403);
  await deny('POST', '/api/cms/categories/hvc', 'penulis', 403, { active: true });
  await deny('POST', '/api/cms/assets?kind=photo&title=x&source=x&license=x', 'penulis', 403);
  await deny('GET', '/api/admin/audit', 'host', 403);
});

test('CMS: blank scenario fails validation with round-specific messages; complete scenario goes draft -> review -> four-eyes publish', async () => {
  const blank = await api<{ scenario: { id: string } }>('POST', '/api/cms/scenarios', tokens.penulis!, { categoryId: 'auto', title: 'Skenario kosong', contentSource: 'settled_case' });
  assert.equal(blank.status, 200);
  const sub = await api<{ issues: { message: string }[] }>('POST', `/api/cms/scenarios/${blank.json.scenario.id}/submit`, tokens.penulis!, {});
  assert.equal(sub.status, 422);
  assert.ok(sub.json.issues.some((i) => /Jumlah babak harus 15/.test(i.message)));

  const created = await api<{ scenario: { id: string; draftRevision: number } }>('POST', '/api/cms/scenarios', tokens.penulis!, {
    categoryId: 'auto',
    title: content.text.id!['scenario.title'],
    contentSource: 'demo',
    content,
  });
  scenarioId = created.json.scenario.id;
  // Draft is not selectable by hosts (appendix A).
  const hostList = await api<{ scenarios: { scenarioId: string }[] }>('GET', '/api/host/scenarios', tokens.host!);
  assert.ok(!hostList.json.scenarios.some((s) => s.scenarioId === scenarioId));
  const hs = await connect(tokens.host);
  const draftRoom = await rpc(hs, 'host:create', { scenarioId });
  assert.ok(!draftRoom.ok);
  hs.close();

  assert.equal((await api('POST', `/api/cms/scenarios/${scenarioId}/submit`, tokens.penulis!, { note: 'siap' })).status, 200);
  const locked = await api('PUT', `/api/cms/scenarios/${scenarioId}/draft`, tokens.penulis!, { content, revision: 1 });
  assert.equal(locked.status, 409, 'drafts are locked while in review');
  // Four-eyes: a reviewer who also edited/submitted cannot publish their own work.
  const own = await api<{ scenario: { id: string } }>('POST', '/api/cms/scenarios', tokens.penulisreviewer!, { categoryId: 'auto', title: 'Milik sendiri', contentSource: 'demo', content });
  await api('POST', `/api/cms/scenarios/${own.json.scenario.id}/submit`, tokens.penulisreviewer!, {});
  assert.equal((await api('POST', `/api/cms/scenarios/${own.json.scenario.id}/publish`, tokens.penulisreviewer!, {})).status, 403);

  const pub = await api<{ scenario: { status: string; currentVersionNo: number; versions: { contentKind: string; reviewedBy: string }[] } }>(
    'POST',
    `/api/cms/scenarios/${scenarioId}/publish`,
    tokens.reviewer!,
    { note: 'uji integrasi' },
  );
  assert.equal(pub.status, 200);
  assert.equal(pub.json.scenario.status, 'published');
  assert.equal(pub.json.scenario.currentVersionNo, 1);
  assert.equal(pub.json.scenario.versions[0]!.contentKind, 'demo');
  const list = await api<{ scenarios: { scenarioId: string; contentKind: string }[] }>('GET', '/api/host/scenarios', tokens.host!);
  assert.ok(list.json.scenarios.some((s) => s.scenarioId === scenarioId && s.contentKind === 'demo'));
});

test('room: only hosts open rooms; join requires the name notice; names validated; capacity enforced', async () => {
  const authorSock = await connect(tokens.penulis);
  const denied = await rpc(authorSock, 'host:create', { scenarioId });
  assert.ok(!denied.ok && denied.code === 'forbidden', 'an author-only identity cannot open competition rooms');
  authorSock.close();

  const host = await connect(tokens.host);
  const created = await rpc<{ code: string; state: StoryPublicState }>(host, 'host:create', { scenarioId });
  assert.ok(created.ok);
  roomCode = created.data.code;
  assert.match(roomCode, /^[A-Z2-9]{6}$/);
  const other = await connect(tokens.host2);
  const hijack = await rpc(other, 'host:start', { code: roomCode });
  assert.ok(!hijack.ok && hijack.code === 'forbidden', 'another host cannot drive this room');
  other.close();

  const probe = await connect();
  const noNotice = await rpc(probe, 'participant:join', { code: roomCode, name: 'Tanpa Setuju' });
  assert.ok(!noNotice.ok && /papan peringkat/.test(noNotice.error));
  for (const [name, why] of [['', 'empty'], ['a', 'too_short'], ['anjing', 'inappropriate']] as const) {
    const r = await rpc(probe, 'participant:join', { code: roomCode, name, acceptNotice: true });
    assert.ok(!r.ok && r.code === 'name' && r.detail === why, `${name}: ${JSON.stringify(r)}`);
  }
  probe.close();
  storyLimiters.guess.reset();
  (globalThis as Record<string, unknown>).storyHost = host;
});

let bots: Bot[] = [];

test('15 synchronized rounds: best/poor/partial/timeout participants, reconnect with missed rounds, private isolation, closed forever', async () => {
  const host = (globalThis as Record<string, unknown>).storyHost as ClientSocket;
  const best = new Bot('Ani Best', () => 'tepat', content);
  const poor = new Bot('Budi Poor', () => 'keliru', content);
  const mixed = new Bot('Citra Mix', (r) => (r % 3 === 0 ? null : r % 2 === 0 ? 'kurang_tepat' : 'tepat'), content);
  const late = new Bot('Dodi Putus', () => 'tepat', content);
  bots = [best, poor, mixed, late];
  for (const b of bots) assert.ok((await b.join(roomCode)).ok, b.name);
  const dup = await new Bot('ani best', () => null, content).join(roomCode);
  assert.ok(!dup.ok && (dup.code === 'full' || dup.detail === 'duplicate'));
  const full = await new Bot('Eko Kelima', () => null, content).join(roomCode);
  assert.ok(!full.ok && full.code === 'full' && /penuh/.test(full.error), 'capacity (4) enforced with a clear message');

  const watch = await connect();
  const w = await rpc<{ state: StoryPublicState }>(watch, 'display:watch', { code: roomCode });
  assert.ok(w.ok);
  const publicSeen: string[] = [];
  watch.on('story:public', (s: StoryPublicState) => publicSeen.push(JSON.stringify(s)));

  assert.ok((await rpc(host, 'host:start', { code: roomCode })).ok);
  // Dodi disconnects during round 2 and comes back in round 5.
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.roundNumber === 2 && s.phase === 'scene', 'round 2');
  late.sock.close();
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.roundNumber === 5 && s.phase === 'scene', 'round 5', 90_000);
  const resumed = await late.resume(roomCode);
  assert.ok(resumed.ok);
  assert.equal(resumed.data.state.roundNumber, 5, 'resumes the CURRENT round');

  const final = await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.phase === 'finished', 'finished', 180_000);
  assert.equal(final.roundNumber, 15);
  await new Promise((r) => setTimeout(r, 300));
  const s = (b: Bot) => b.me!.summary!;
  assert.equal(s(best).decisions.length, 15);
  assert.equal(s(best).ending!.kind, 'happy');
  assert.equal(s(poor).ending!.id, 'kecewa');
  assert.equal(s(mixed).decisions.filter((d) => d.outcome === 'timeout').length, 5);
  const missed = s(late).decisions.filter((d) => d.roundNumber >= 2 && d.roundNumber <= 4);
  assert.ok(missed.every((d) => d.outcome === 'timeout' && d.score.roundScore === 0), 'missed rounds score 0');
  assert.equal(s(best).rank!.rank, 1);
  assert.ok(final.rankings!.length === 4);

  // Private isolation: no participant ever received another participant's private payload; public payloads carry no keys.
  for (const b of bots) for (const p of b.privatePayloads) for (const other of bots) if (other !== b) assert.ok(!p.includes(other.name), `${b.name} saw ${other.name}`);
  for (const p of publicSeen) for (const forbidden of ['accuracy', 'classification', '"tepat"', 'moodDelta', 'credential', '"pa"']) assert.ok(!p.includes(forbidden), forbidden);

  // Closed: no restart/replay/next via sockets; no new participants.
  for (const ev of ['host:start', 'host:next']) {
    const r = await rpc(host, ev, { code: roomCode });
    assert.ok(!r.ok && r.code === 'closed', ev);
  }
  const lateJoin = await new Bot('Fani Telat', () => null, content).join(roomCode);
  assert.ok(!lateJoin.ok && lateJoin.code === 'closed');
  watch.close();
});

test('personal results are readable with the room-scoped credential only (and from the database)', async () => {
  const best = bots[0]!;
  const r = await fetch(`${BASE}/api/story/rooms/${roomCode}/result`, { headers: { 'x-story-credential': best.credential } });
  const j = (await r.json()) as { summary: { decisions: unknown[]; ending: { kind: string } } };
  assert.equal(r.status, 200);
  assert.equal(j.summary.decisions.length, 15);
  const wrong = await fetch(`${BASE}/api/story/rooms/${roomCode}/result`, { headers: { 'x-story-credential': 'x'.repeat(32) } });
  assert.equal(wrong.status, 401);
  const row = getDb().prepare('SELECT summary_json FROM story_participants WHERE name = ?').get('Ani Best') as { summary_json: string };
  assert.equal(JSON.parse(row.summary_json).decisions.length, 15, 'summary persisted for after-restart reads');
});

test('reports: dashboard, cross-room results/export, round analytics reconcile with the played room; demo excluded by default', async () => {
  const t = tokens.panitia!;
  const off = await api<{ dashboard: { roomsStarted: number } }>('GET', '/api/admin/dashboard', t);
  assert.equal(off.json.dashboard.roomsStarted, 0, 'demo rooms are excluded from competition numbers by default');
  const dash = await api<{ dashboard: { roomsStarted: number; roomsFinished: number; participants: number; completedParticipants: number; completionRate: number; averageScore: number } }>(
    'GET',
    '/api/admin/dashboard?includeDemo=1',
    t,
  );
  const d = dash.json.dashboard;
  assert.equal(d.roomsFinished, 1);
  assert.equal(d.participants, 4);
  assert.equal(d.completedParticipants, 4);
  assert.equal(d.completionRate, 1);
  const totals = bots.map((b) => b.me!.summary!.totals.totalScore);
  assert.equal(d.averageScore, Math.round(totals.reduce((a, x) => a + x, 0) / totals.length));
  const csv = await api('GET', '/api/admin/results.csv?includeDemo=1', t);
  assert.equal(csv.status, 200);
  assert.ok(csv.text.startsWith('﻿'));
  for (const b of bots) assert.ok(csv.text.includes(b.name));
  const an = await api<{ analytics: { rounds: { decisions: number; timeout: number; keliru: number }[] }[] }>('GET', '/api/admin/analytics?includeDemo=1', t);
  const rounds = an.json.analytics[0]!.rounds;
  assert.equal(rounds.length, 15);
  assert.ok(rounds.every((r) => r.decisions === 4));
  assert.equal(rounds.reduce((a, r) => a + r.timeout, 0), 5 + 3, 'Citra 5 timeouts + Dodi 3 missed rounds');
  // Periods: overlapping periods are rejected; a period containing the room makes it an in-period result.
  const now = Date.now();
  const p1 = await api<{ period: { id: string } }>('POST', '/api/admin/periods', t, { name: 'Periode A', startsAt: now - 3_600_000, endsAt: now + 3_600_000 });
  assert.equal(p1.status, 200);
  assert.equal((await api('POST', '/api/admin/periods', t, { name: 'Bentrok', startsAt: now, endsAt: now + 10 })).status, 409);
  const inPeriod = await api<{ results: { periodName: string }[] }>('GET', `/api/admin/results?includeDemo=1&periodId=${p1.json.period.id}`, t);
  assert.equal(inPeriod.json.results.length, 4);
  assert.equal(inPeriod.json.results[0]!.periodName, 'Periode A');
  const outside = await api<{ results: unknown[] }>('GET', '/api/admin/results?includeDemo=1&periodId=outside', t);
  assert.equal(outside.json.results.length, 0);
});

test('versions: a running room stays pinned while the scenario is revised, republished and archived', async () => {
  const host = (globalThis as Record<string, unknown>).storyHost as ClientSocket;
  const pinned = await rpc<{ code: string; state: StoryPublicState }>(host, 'host:create', { scenarioId });
  assert.ok(pinned.ok);
  const detail = await api<{ scenario: { draftRevision: number; content: ScenarioContent } }>('GET', `/api/cms/scenarios/${scenarioId}`, tokens.penulis!);
  const edited = structuredClone(detail.json.scenario.content);
  edited.text.id![textKey.title()] = '[DEMO] Baret di Parkiran Pasar (revisi 2)';
  const saved = await api('PUT', `/api/cms/scenarios/${scenarioId}/draft`, tokens.penulis!, { content: edited, revision: detail.json.scenario.draftRevision });
  assert.equal(saved.status, 200);
  // The live v1 stays playable while the working copy is a draft again.
  assert.ok((await api<{ scenarios: { scenarioId: string; versionNo: number }[] }>('GET', '/api/host/scenarios', tokens.host!)).json.scenarios.some((s) => s.scenarioId === scenarioId && s.versionNo === 1));
  await api('POST', `/api/cms/scenarios/${scenarioId}/submit`, tokens.penulis!, {});
  const v2 = await api<{ scenario: { currentVersionNo: number } }>('POST', `/api/cms/scenarios/${scenarioId}/publish`, tokens.reviewer!, {});
  assert.equal(v2.json.scenario.currentVersionNo, 2);
  const watch = await connect();
  const st = await rpc<{ state: StoryPublicState }>(watch, 'display:watch', { code: pinned.data.code });
  assert.ok(st.ok && st.data.state.scenario.versionNo === 1 && !st.data.state.scenario.title.includes('revisi 2'), 'room keeps version 1');
  const archived = await api('POST', `/api/cms/scenarios/${scenarioId}/archive`, tokens.reviewer!, { reason: 'uji arsip' });
  assert.equal(archived.status, 200);
  const blocked = await rpc(host, 'host:create', { scenarioId });
  assert.ok(!blocked.ok, 'archived/withdrawn versions cannot start new rooms');
  assert.ok((await rpc(host, 'host:close', { code: pinned.data.code })).ok);
  watch.close();
  const row = getDb().prepare('SELECT version_no, status, closed_reason FROM story_rooms WHERE code = ?').get(pinned.data.code) as { version_no: number; status: string; closed_reason: string };
  assert.deepEqual(row, { version_no: 1, status: 'interrupted', closed_reason: 'host_closed' });
});

test('restart policy: unfinished rooms are marked interrupted, never silently reset', () => {
  getDb()
    .prepare(
      `INSERT INTO story_rooms (id, code, scenario_id, version_id, version_no, content_hash, scenario_title, category_id, content_kind, score_policy_id, answer_window_ms, status, host_user_id, host_name, max_participants, created_at, started_at)
       VALUES ('r-crash', 'ZZZZZZ', 's', 'v', 1, 'h', 't', 'auto', 'demo', 'story-70-30-v1', 30000, 'running', 'u', 'h', 4, 1, 2)`,
    )
    .run();
  const codes = recoverInterruptedRooms();
  assert.ok(codes.includes('ZZZZZZ'));
  const row = getDb().prepare(`SELECT status, closed_reason FROM story_rooms WHERE code = 'ZZZZZZ'`).get() as { status: string; closed_reason: string };
  assert.deepEqual(row, { status: 'interrupted', closed_reason: 'server_restart' });
});

test('review fixes: legacy gate case, closed codes, asset limiter, session revocation, stale host clicks, admin close, expiry, reports', async () => {
  // Legacy gate is case-insensitive like Express routing.
  for (const url of ['/api/Missions', '/api/MATCHES', '/Unity/index.html']) assert.equal((await api('GET', url, null)).status, 404, url);

  // A code that once existed is "closed" (not a guess); a never-existing code is "not_found" and counts as a guess.
  storyLimiters.guess.reset();
  const watcher = await connect();
  const closed = await rpc(watcher, 'participant:resume', { code: 'ZZZZZZ', credential: 'x'.repeat(32) });
  assert.ok(!closed.ok && closed.code === 'closed', JSON.stringify(closed));
  assert.equal((await api('GET', '/api/story/rooms/ZZZZZZ/info', null)).status, 410);
  assert.equal((await api('GET', '/api/story/rooms/ZZZZZZ/assets', null)).status, 410);
  for (let i = 0; i < 30; i++) await api('GET', `/api/story/rooms/QQ${String(i).padStart(4, '2')}/assets`, null);
  assert.equal((await api('GET', '/api/story/rooms/ZZZZZZ/info', null)).status, 429, 'failed guesses on /assets now count');
  storyLimiters.guess.reset();

  // A fresh room: assets of later rounds are withheld; the host's stale "next" is refused; revoked sessions stop at once.
  // (The earlier versions test archived its scenario, so publish a fresh one.)
  const fresh = await api<{ scenario: { id: string } }>('POST', '/api/cms/scenarios', tokens.penulis!, { categoryId: 'auto', title: 'Uji perbaikan review', contentSource: 'demo', content: demoBaretContent() });
  const scenarioId = fresh.json.scenario.id;
  await api('POST', `/api/cms/scenarios/${scenarioId}/submit`, tokens.penulis!, {});
  assert.equal((await api('POST', `/api/cms/scenarios/${scenarioId}/publish`, tokens.reviewer!, {})).status, 200);
  const host2 = await connect(tokens.host2!);
  const created = await rpc<{ code: string }>(host2, 'host:create', { scenarioId, autoAdvance: false });
  assert.ok(created.ok);
  const code = created.data.code;
  const assets = await api<{ assets: { id: string }[] }>('GET', `/api/story/rooms/${code}/assets`, null);
  const content = (await api<{ scenario: { content: ScenarioContent } }>('GET', `/api/cms/scenarios/${scenarioId}`, tokens.reviewer!)).json.scenario.content;
  const later = content.rounds.slice(1).map((r) => r.mediaAssetId).filter((x): x is string => !!x && x !== content.rounds[0]!.mediaAssetId);
  assert.ok(later.every((id) => !assets.json.assets.some((a) => a.id === id)), 'no evidence media of later rounds in the lobby');
  const p = await connect();
  assert.ok((await rpc(p, 'participant:join', { code, name: 'Uji Basi', acceptNotice: true })).ok);
  assert.ok((await rpc(host2, 'host:start', { code })).ok);
  const stale = await rpc(host2, 'host:next', { code, phase: 'leaderboard', roundNumber: 1 });
  assert.ok(!stale.ok && stale.code === 'wrong_phase', 'a click for a phase the room already left is refused');
  // Turning auto-advance off/on works; deactivating the host revokes the open socket immediately.
  const host2Id = (getDb().prepare('SELECT id FROM staff_users WHERE username = ?').get('host2') as { id: string }).id;
  assert.equal((await api('POST', `/api/admin/users/${host2Id}/active`, tokens.admin!, { active: false })).status, 200);
  const revoked = await rpc(host2, 'host:close', { code });
  assert.ok(!revoked.ok && revoked.code === 'unauthorized', JSON.stringify(revoked));
  await api('POST', `/api/admin/users/${host2Id}/active`, tokens.admin!, { active: true });

  // The competition admin can close a room whose host is gone; the audit names the admin, the room says admin_closed.
  assert.equal((await api('POST', `/api/admin/rooms/${code}/close`, tokens.host!, {})).status, 403, 'hosts cannot close other hosts rooms via admin route');
  assert.equal((await api('POST', `/api/admin/rooms/${code}/close`, tokens.panitia!, {})).status, 200);
  const row = getDb().prepare('SELECT status, closed_reason FROM story_rooms WHERE code = ?').get(code) as { status: string; closed_reason: string };
  assert.deepEqual(row, { status: 'interrupted', closed_reason: 'admin_closed' });
  p.close();

  // Idle lobbies expire as a SYSTEM action ("expired"), not as the host's close.
  const host = (globalThis as Record<string, unknown>).storyHost as ClientSocket;
  const idle = await rpc<{ code: string }>(host, 'host:create', { scenarioId });
  assert.ok(idle.ok);
  srv.story.manager.sweep(2 * 60 * 60 * 1000, -1, -1);
  const expired = getDb().prepare('SELECT closed_reason FROM story_rooms WHERE code = ?').get(idle.data.code) as { closed_reason: string };
  assert.equal(expired.closed_reason, 'expired');
  const audit = getDb().prepare(`SELECT actor_name FROM audit_log WHERE action = 'room.close_early' AND target_id = ? ORDER BY id DESC`).get(idle.data.code) as { actor_name: string };
  assert.notEqual(audit.actor_name, 'host');

  // Periods need real timestamps (no silent 1970); reports separate running rooms and never truncate the CSV.
  assert.equal((await api('POST', '/api/admin/periods', tokens.panitia!, { name: 'Kosong', startsAt: null, endsAt: Date.now() })).status, 400);
  const dash = await api<{ dashboard: { roomsRunning: number } }>('GET', '/api/admin/dashboard?includeDemo=1', tokens.panitia!);
  assert.equal(typeof dash.json.dashboard.roomsRunning, 'number');
  const res = await api<{ total: number; truncated: boolean; results: unknown[] }>('GET', '/api/admin/results?includeDemo=1', tokens.panitia!);
  assert.equal(res.json.total, res.json.results.length);
  assert.equal(res.json.truncated, false);

  // Successful logins are never rate limited (each new tab signs in again); failures are.
  for (let i = 0; i < 12; i++) assert.equal((await api('POST', '/api/staff/login', null, { username: 'panitia', password: PASSWORD })).status, 200);
  for (let i = 0; i < 10; i++) await api('POST', '/api/staff/login', null, { username: 'panitia', password: 'salah-salah-salah' });
  assert.equal((await api('POST', '/api/staff/login', null, { username: 'panitia', password: PASSWORD })).status, 429);
  watcher.close();
  host2.close();
});

// ------------------------------------------------------------------ settled-case script features (SYNTHETIC content)

/** Author creates (demo content: no anonymization check), submits; a different reviewer publishes. Returns the id. */
async function publishScenario(c: ScenarioContent): Promise<string> {
  const created = await api<{ scenario: { id: string } }>('POST', '/api/cms/scenarios', tokens.penulis!, { categoryId: 'auto', title: 'Uji fitur kasus', contentSource: 'demo', content: c });
  assert.equal(created.status, 200, created.text);
  const id = created.json.scenario.id;
  const submitted = await api('POST', `/api/cms/scenarios/${id}/submit`, tokens.penulis!, {});
  assert.equal(submitted.status, 200, submitted.text);
  const published = await api('POST', `/api/cms/scenarios/${id}/publish`, tokens.reviewer!, {});
  assert.equal(published.status, 200, published.text);
  return id;
}

/**
 * Host console stand-in for a host-paced room: continues from each leaderboard up to round `lastRound` (the room then
 * waits on that round's leaderboard, or finishes after round 15) and records every public payload the host receives.
 */
function driveLeaderboards(host: ClientSocket, code: string, lastRound: number) {
  const payloads: string[] = [];
  const failures: string[] = [];
  const continued = new Set<number>();
  const onPublic = (s: StoryPublicState) => {
    if (s.code !== code) return;
    payloads.push(JSON.stringify(s));
    if (s.phase !== 'leaderboard' || s.roundNumber >= lastRound || continued.has(s.roundNumber)) return;
    continued.add(s.roundNumber);
    host.emit('host:next', { code, phase: 'leaderboard', roundNumber: s.roundNumber }, (res: StoryAck<unknown>) => {
      if (!res.ok) failures.push(`round ${s.roundNumber}: ${res.error}`);
    });
  };
  host.on('story:public', onPublic);
  return { payloads, failures, stop: () => host.off('story:public', onPublic) };
}

const privatesOf = (b: Bot) => b.privatePayloads.map((p) => JSON.parse(p) as StoryPrivateState);
const featureContent = buildFeatureScenario();
/** Names and status words of the feature scenario (and of the gameplay scenario built on it), as summaries carry them. */
const featureLabels = { customerName: 'Bu Rina', officerName: 'Miss Raksa', officerCharacterId: 'builtin:char:miss-raksa', moodLabels: FEATURE.moodLabels };
let featureScenarioId = '';

test('settled-case features over sockets: the conditional line reaches only the flag holder; opening, cast names and {nama} as authored; delayed change stored once; status-only endings incl. "unhappy" in reports', async () => {
  featureScenarioId = await publishScenario(featureContent);
  const host = await connect(tokens.host);
  const created = await rpc<{ code: string }>(host, 'host:create', { scenarioId: featureScenarioId, autoAdvance: false });
  assert.ok(created.ok, JSON.stringify(created));
  const code = created.data.code;
  const watch = await connect();
  assert.ok((await rpc(watch, 'display:watch', { code })).ok);
  const projector: StoryPublicState[] = [];
  watch.on('story:public', (s: StoryPublicState) => projector.push(s));
  // Ani leaves the flag (round 2 "kurang tepat" = c2) and otherwise answers "tepat"; Budi always answers "keliru";
  // Citra answers "tepat" in round 2 (no flag) and otherwise "kurang tepat".
  const holder = new Bot('Ani Pemicu', (r) => (r === FEATURE.setRound ? 'kurang_tepat' : 'tepat'), featureContent);
  const keliru = new Bot('Budi Keliru', () => 'keliru', featureContent);
  const catatan = new Bot('Citra Catatan', (r) => (r === FEATURE.setRound ? 'tepat' : 'kurang_tepat'), featureContent);
  const players = [holder, keliru, catatan];
  for (const b of players) assert.ok((await b.join(code)).ok, b.name);

  // Room assets: no portrait for the customer (null is skipped), the cast member's portrait is included.
  const assets = await api<{ assets: { id: string }[] }>('GET', `/api/story/rooms/${code}/assets`, null);
  assert.deepEqual(assets.json.assets.map((a) => a.id).sort(), ['builtin:bg:meja', FEATURE.castPortrait, 'builtin:char:miss-raksa'].sort());

  const hostConsole = driveLeaderboards(host, code, 15);
  assert.ok((await rpc(host, 'host:start', { code })).ok);
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.phase === 'finished', 'feature room finished', 90_000);
  hostConsole.stop();
  await new Promise((r) => setTimeout(r, 300));
  assert.deepEqual(hostConsole.failures, []);

  // Shared screens (projector, host console) and the other participants never receive the conditional line; nobody
  // ever receives the flag id, the author notes or the staff-facing cast role.
  const shared = [...projector.map((s) => JSON.stringify(s)), ...hostConsole.payloads];
  for (const secret of [FEATURE.flagLine, FEATURE.flag, FEATURE.authorNotes, FEATURE.roundNote, FEATURE.castRole]) {
    assert.ok(!shared.some((p) => p.includes(secret)), `shared screens never receive: ${secret}`);
    for (const b of [keliru, catatan]) assert.ok(!b.privatePayloads.some((p) => p.includes(secret)), `${b.name} never receives: ${secret}`);
    if (secret !== FEATURE.flagLine) assert.ok(!holder.privatePayloads.some((p) => p.includes(secret)), `the flag holder never receives: ${secret}`);
  }
  for (const b of players) for (const p of b.privatePayloads) for (const other of players) if (other !== b) assert.ok(!p.includes(other.name), `${b.name} saw ${other.name}`);
  const withLine = privatesOf(holder).filter((m) => m.flagLines.length > 0);
  assert.ok(withLine.length > 0, 'the flag holder received the conditional line');
  assert.ok(withLine.every((m) => m.roundNumber === FEATURE.effectRound), 'only in the reacting round');
  assert.ok(withLine.some((m) => m.consequence?.roundNumber === FEATURE.effectRound), 'kept in the conversation through the consequence');
  assert.deepEqual(withLine[0]!.flagLines, [{ id: 'f0', speaker: 'customer', name: 'Bu Rina', pos: -0.5, text: FEATURE.flagLine }]);
  assert.equal(withLine[0]!.mood, 31, 'round 4 begins 12 lower for the flag holder (43 - 12)');
  const round4 = projector.find((s) => s.scene?.roundNumber === FEATURE.effectRound)!.scene!;
  assert.deepEqual([round4.keyRound, round4.lines.map((l) => [l.id, l.pos])], [true, [['p0', 0], ['p1', 1]]], 'public lines only, named and numbered among themselves (no id or gap hints at the private line)');

  // Opening lines (round 1 only), names, chat layout, status words and {nama} arrive exactly as authored.
  const round1 = projector.find((s) => s.scene?.roundNumber === 1)!.scene!;
  assert.deepEqual(round1.intro.map((l) => [l.speaker, l.name, l.text]), [['officer', 'Miss Raksa', FEATURE.introOfficer], ['cast', FEATURE.castName, FEATURE.introCast]]);
  assert.ok(projector.every((s) => !s.scene || s.scene.roundNumber === 1 || s.scene.intro.length === 0), 'the opening belongs to round 1');
  const round2 = projector.find((s) => s.scene?.roundNumber === 2)!.scene!;
  assert.deepEqual([round2.layout, round2.meta, round2.lines.find((l) => l.speaker === 'cast')?.name], ['chat', FEATURE.chatMeta, FEATURE.castName]);
  assert.deepEqual([projector[0]!.scenario.customerCharacterId, projector[0]!.scenario.neutralExpression, projector[0]!.scenario.moodLabels], [null, '', FEATURE.moodLabels]);
  assert.ok(privatesOf(holder).some((m) => m.roundNumber === 1 && m.options?.some((o) => o.text === FEATURE.nameChoice)), '{nama} reaches the device untouched');

  // Stored decisions: the delayed change appears once, in the reacting round (mood_before != previous mood_after).
  const roomId = (getDb().prepare('SELECT id FROM story_rooms WHERE code = ?').get(code) as { id: string }).id;
  const jumps = (b: Bot) => {
    const rows = getDb().prepare('SELECT round_index, mood_before, mood_after FROM story_decisions WHERE room_id = ? AND participant_id = ? ORDER BY round_index').all(roomId, b.me!.participantId) as { round_index: number; mood_before: number; mood_after: number }[];
    assert.equal(rows.length, 15);
    return rows.flatMap((row, i) => (i > 0 && row.mood_before !== rows[i - 1]!.mood_after ? [[row.round_index + 1, row.mood_before - rows[i - 1]!.mood_after]] : []));
  };
  assert.deepEqual(jumps(holder), [[FEATURE.effectRound, FEATURE.delayedDelta]]);
  assert.deepEqual([jumps(keliru), jumps(catatan)], [[], []]);

  // Status-only endings: three kinds, stored and reported (Ani 100, Budi 0, Citra 25 + 8 + 13 x 2 = 61).
  const finals = getDb().prepare('SELECT name, final_mood, ending_id, ending_kind FROM story_participants WHERE room_id = ? ORDER BY name').all(roomId);
  assert.deepEqual(finals, [
    { name: 'Ani Pemicu', final_mood: 100, ending_id: 'mood_high', ending_kind: 'happy' },
    { name: 'Budi Keliru', final_mood: 0, ending_id: 'mood_low', ending_kind: 'unhappy' },
    { name: 'Citra Catatan', final_mood: 61, ending_id: 'mood_mid', ending_kind: 'with_notes' },
  ]);
  const report = await api<{ results: { roomCode: string; participantName: string; endingKind: string | null }[] }>('GET', '/api/admin/results?includeDemo=1', tokens.panitia!);
  assert.deepEqual(report.json.results.filter((r) => r.roomCode === code).map((r) => [r.participantName, r.endingKind]).sort(), [['Ani Pemicu', 'happy'], ['Budi Keliru', 'unhappy'], ['Citra Catatan', 'with_notes']]);
  const csv = await api('GET', '/api/admin/results.csv?includeDemo=1', tokens.panitia!);
  assert.ok(csv.text.split('\r\n').some((line) => line.startsWith(code) && line.includes('Budi Keliru') && line.endsWith(',unhappy')), 'CSV recap carries the unhappy ending');

  // Personal results: live (credential) and persisted carry the ending words as templates and the delayed change.
  const live = await fetch(`${BASE}/api/story/rooms/${code}/result`, { headers: { 'x-story-credential': keliru.credential } });
  const liveSummary = ((await live.json()) as { summary: StoryFinalSummary }).summary;
  assert.deepEqual([liveSummary.ending!.kind, liveSummary.ending!.customer], ['unhappy', '"Klaimnya selesai, tetapi saya lelah menunggu."']);
  const persisted = persistedRoomByCode(code)!;
  const stored = persistedSummary(persisted, holder.me!.participantId)!;
  assert.deepEqual([stored.ending!.kind, stored.ending!.customer, stored.ending!.mentor], ['happy', '"Terima kasih, {nama}. Saya selalu tahu kabarnya."', '"Rapi sekali, {nama}."']);
  assert.deepEqual(stored.decisions.map((d) => d.delayedDelta).filter((d) => d !== 0), [FEATURE.delayedDelta]);
  assert.equal(stored.decisions[FEATURE.effectRound - 1]!.mentorReason, FEATURE.mentorReason);
  // A summary stored before ending words / mentor reasons / delayed changes existed reads with neutral defaults.
  const legacy = JSON.parse((getDb().prepare('SELECT summary_json FROM story_participants WHERE room_id = ? AND participant_id = ?').get(roomId, catatan.me!.participantId) as { summary_json: string }).summary_json);
  delete legacy.ending.customer;
  delete legacy.ending.mentor;
  for (const d of legacy.decisions) {
    delete d.mentorReason;
    delete d.delayedDelta;
  }
  getDb().prepare('UPDATE story_participants SET summary_json = ? WHERE room_id = ? AND participant_id = ?').run(JSON.stringify(legacy), roomId, catatan.me!.participantId);
  const old = persistedSummary(persisted, catatan.me!.participantId)!;
  assert.deepEqual([old.ending!.kind, old.ending!.customer, old.ending!.mentor], ['with_notes', '', '']);
  assert.ok(old.decisions.every((d) => d.mentorReason === '' && d.delayedDelta === 0));

  for (const b of players) b.sock.close();
  watch.close();
  host.close();
});

test('restart mid-session: the summary rebuilt from stored decisions of the interrupted room derives the delayed change', async () => {
  assert.ok(featureScenarioId, 'needs the scenario published by the previous test');
  const host = await connect(tokens.host);
  const created = await rpc<{ code: string }>(host, 'host:create', { scenarioId: featureScenarioId, autoAdvance: false });
  assert.ok(created.ok, JSON.stringify(created));
  const code = created.data.code;
  const watch = await connect();
  assert.ok((await rpc(watch, 'display:watch', { code })).ok);
  const holder = new Bot('Dewi Pemicu', (r) => (r === FEATURE.setRound ? 'kurang_tepat' : 'tepat'), featureContent);
  const tepat = new Bot('Eko Tepat', () => 'tepat', featureContent);
  for (const b of [holder, tepat]) assert.ok((await b.join(code)).ok, b.name);
  const hostConsole = driveLeaderboards(host, code, 5);
  assert.ok((await rpc(host, 'host:start', { code })).ok);
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.phase === 'leaderboard' && s.roundNumber === 5, 'round 5 settled', 60_000);
  hostConsole.stop();
  assert.deepEqual(hostConsole.failures, []);

  // "Crash": the in-memory room dies with the process (no more timers or writes); on boot the room is marked interrupted.
  const room = srv.story.manager.get(code)!;
  room.dispose();
  assert.ok(recoverInterruptedRooms().includes(code));
  const persisted = persistedRoomByCode(code)!;
  assert.deepEqual([persisted.status, persisted.closedReason], ['interrupted', 'server_restart']);
  const own = room.participants.get(holder.me!.participantId)!.decisions;
  const rebuilt = persistedSummary(persisted, holder.me!.participantId)!;
  assert.deepEqual([rebuilt.complete, rebuilt.ending, rebuilt.decisions.length], [false, null, 5]);
  assert.deepEqual(rebuilt.decisions.map((d) => d.delayedDelta), [0, 0, 0, FEATURE.delayedDelta, 0]);
  assert.deepEqual(
    rebuilt.decisions.map((d) => [d.moodBefore, d.moodAfter, d.delayedDelta]),
    own.map((d) => [d.moodBefore, d.moodAfter, d.delayedDelta]),
    'the rebuilt summary equals what the live room had',
  );
  assert.deepEqual([rebuilt.decisions[3]!.moodBefore, rebuilt.decisions[3]!.bandBefore, rebuilt.decisions[3]!.mentorReason], [31, 'kecewa', FEATURE.mentorReason]);
  assert.deepEqual(
    [rebuilt.decisions[FEATURE.setRound - 1]!.flagSet, rebuilt.decisions[FEATURE.effectRound - 1]!.delayed],
    [{ label: '', effectRound: FEATURE.effectRound, delta: FEATURE.delayedDelta }, [{ label: '', fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }]],
    'flag notes rebuilt from the stored decisions (no label authored: clients word them generically)',
  );
  assert.deepEqual(rebuilt.labels, featureLabels, 'names and status words of the version');
  const rows = getDb().prepare('SELECT * FROM story_decisions WHERE room_id = ? AND participant_id = ? ORDER BY round_index').all(persisted.id, holder.me!.participantId) as DecisionRow[];
  assert.deepEqual(
    decisionsFromRows(rows, featureContent.initialMood).map((d) => [d!.moodCarried, d!.delayedDelta]),
    own.map((d) => [d.moodCarried, d.delayedDelta]),
  );
  assert.ok(persistedSummary(persisted, tepat.me!.participantId)!.decisions.every((d) => d.delayedDelta === 0));
  for (const b of [holder, tepat]) b.sock.close();
  watch.close();
  host.close();
});

test('decisionsFromRows: the carried mood comes from the previous stored round; a gap reports no delayed change rather than a wrong one', () => {
  const row = (i: number, before: number, after: number): DecisionRow => ({
    round_index: i,
    round_id: `r${String(i + 1).padStart(2, '0')}`,
    choice_id: 'c1',
    outcome: 'tepat',
    accuracy: 1,
    elapsed_ms: 2_000,
    accuracy_points: 700,
    speed_points: 280,
    round_score: 980,
    mood_before: before,
    mood_after: after,
  });
  const all = decisionsFromRows([row(0, 25, 33), row(1, 33, 35), row(2, 35, 43), row(3, 31, 39), row(5, 47, 55)], 25);
  assert.deepEqual(
    Array.from(all, (d) => d && [d.moodCarried, d.delayedDelta, d.moodDelta]),
    [[25, 0, 8], [33, 0, 2], [35, 0, 8], [43, -12, 8], undefined, [47, 0, 8]],
  );
  const lostFirst = decisionsFromRows([row(1, 20, 28)], 25);
  assert.deepEqual([lostFirst[1]!.moodCarried, lostFirst[1]!.delayedDelta], [20, 0], 'round 1 not stored: the carried mood is unknown');
});

// ------------------------------------------------------------------ gameplay payloads over sockets (SYNTHETIC content)

/** Answer keys and author-only material: never in any participant, projector or host payload. */
const NEVER_SENT = ['"classification"', '"accuracy"', '"moodDelta"', '"setsFlag"', '"ifFlag"', '"flagEffects"', '"authorNote', FEATURE.flag, FEATURE.authorNotes, FEATURE.roundNote];
/** Which of `texts` a serialized payload carries. */
const carried = (payload: string, texts: readonly string[]) => texts.filter((s) => payload.includes(s));
const parsePublic = (payloads: readonly string[]) => payloads.map((p) => JSON.parse(p) as StoryPublicState);
/** The room played by the gameplay test, read again by the reopened-result test after it. */
let gameplayRoom: { code: string; holder: Bot; other: Bot } | null = null;

test('gameplay over sockets: the same evidence on every device incl. projector and host; lesson only after close; reminders only for the flag holder; one final answer; a chat action stays an action; assets of reached rounds only', async () => {
  storyLimiters.guess.reset();
  // The field round's scene and the dossier's photo are uploaded pictures (built-in backgrounds have no image file).
  const scenePicture = await uploadPicture('background', 'Latar lapangan uji');
  const evidencePicture = await uploadPicture('photo', 'Foto berkas uji');
  const gameplayContent = addTestEvidence(buildGameplayScenario({ image: scenePicture }), GAMEPLAY.dossierRound, { id: 'foto-berkas', kind: 'photo', title: 'Foto berkas uji', assetId: evidencePicture });
  const scenarioId = await publishScenario(gameplayContent);
  const host = await connect(tokens.host);
  const created = await rpc<{ code: string }>(host, 'host:create', { scenarioId, autoAdvance: false });
  assert.ok(created.ok, JSON.stringify(created));
  const code = created.data.code;
  const watch = await connect();
  assert.ok((await rpc(watch, 'display:watch', { code })).ok);
  const projector: string[] = [];
  watch.on('story:public', (s: StoryPublicState) => projector.push(JSON.stringify(s)));
  // Ani leaves the flag in the chat round ("kurang tepat" = c2) and otherwise answers "tepat"; Budi always answers "tepat";
  // Citra takes the chat round's action (no message) and otherwise answers "tepat".
  const holder = new Bot('Ani Penjanji', (r) => (r === GAMEPLAY.chatRound ? 'kurang_tepat' : 'tepat'), gameplayContent);
  const other = new Bot('Budi Netral', () => 'tepat', gameplayContent);
  const actor = new Bot('Citra Bertindak', (r) => (r === GAMEPLAY.chatRound ? { choiceId: GAMEPLAY.actionChoice } : 'tepat'), gameplayContent);
  const players = [holder, other, actor];
  for (const b of players) assert.ok((await b.join(code)).ok, b.name);

  const assetIds = async () => (await api<{ assets: { id: string }[] }>('GET', `/api/story/rooms/${code}/assets`, null)).json.assets.map((a) => a.id).sort();
  const lobbyAssets = ['builtin:bg:meja', FEATURE.castPortrait, 'builtin:char:miss-raksa'].sort();
  assert.deepEqual(await assetIds(), lobbyAssets, 'lobby: round 1 only, no picture of a later round');

  const hostConsole = driveLeaderboards(host, code, GAMEPLAY.fieldRound);
  assert.ok((await rpc(host, 'host:start', { code })).ok);
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.phase === 'leaderboard' && s.roundNumber === GAMEPLAY.fieldRound, 'field round settled', 60_000);
  hostConsole.stop();
  assert.deepEqual(hostConsole.failures, []);
  assert.deepEqual(await assetIds(), [...lobbyAssets, evidencePicture, scenePicture].sort(), 'the dossier picture and the field image once their rounds are reached');

  // The chat round's action option (no message) arrives marked as such on every device; the others are messages.
  for (const b of players) {
    const chatOptions = b.shown.get(GAMEPLAY.chatRound)!;
    assert.deepEqual(chatOptions.filter((o) => o.form === 'action').map((o) => o.text), [GAMEPLAY.actionText], `${b.name}: the action option`);
    assert.equal(chatOptions.filter((o) => o.form === 'message').length, 4);
  }

  // One final answer: on the leaderboard the holder retries the option it sent, then tries another one.
  const fieldRoundId = gameplayContent.rounds[GAMEPLAY.fieldRound - 1]!.id;
  const sent = holder.sent.get(GAMEPLAY.fieldRound)!;
  const another = holder.shown.get(GAMEPLAY.fieldRound)!.find((o) => o.handle !== sent)!.handle;
  const retry = await rpc<{ duplicate: boolean }>(holder.sock, 'participant:answer', { roundId: fieldRoundId, option: sent });
  assert.ok(retry.ok && retry.data.duplicate, 'a retry of the sent option gets the original acknowledgement');
  const changed = await rpc(holder.sock, 'participant:answer', { roundId: fieldRoundId, option: another });
  assert.ok(!changed.ok && changed.code === 'answered' && changed.error === 'Jawabanmu untuk babak ini sudah terkirim.', 'another option after the accepted one is refused');
  assert.ok(privatesOf(holder).some((m) => m.roundNumber === GAMEPLAY.fieldRound && m.answer?.handle === sent), 'the private acknowledgement names the sent option (a reloaded tab shows it)');
  assert.ok(!other.privatePayloads.some((p) => p.includes(sent)), 'and only to its participant');
  const roomId = persistedRoomByCode(code)!.id;
  const storedChoices = getDb().prepare('SELECT choice_id FROM story_decisions WHERE room_id = ? AND participant_id = ? AND round_index = ?').all(roomId, holder.me!.participantId, GAMEPLAY.fieldRound - 1) as { choice_id: string }[];
  assert.deepEqual(storedChoices, [{ choice_id: 'c1' }], 'one stored decision: the first answer');

  const closedSummary = waitFor<StoryPrivateState>(holder.sock, 'story:private', (m) => m.summary !== null, 'holder summary');
  const actorClosed = waitFor<StoryPrivateState>(actor.sock, 'story:private', (m) => m.summary !== null, 'actor summary');
  assert.ok((await rpc(host, 'host:close', { code })).ok);
  const summary = (await closedSummary).summary!;
  const storedTotal = getDb().prepare('SELECT total_score FROM story_participants WHERE room_id = ? AND participant_id = ?').get(roomId, holder.me!.participantId) as { total_score: number };
  assert.equal(summary.decisions[GAMEPLAY.fieldRound - 1]!.chosenText, gameplayContent.text.id![textKey.choiceText(fieldRoundId, 'c1')], 'the first answer stands');
  assert.equal(summary.totals.totalScore, storedTotal.total_score, 'scored once');

  // A chat action stays an action after close (shown as a note, never as a sent message): live, stored and rebuilt.
  const chatIndex = GAMEPLAY.chatRound - 1;
  const formsOf = (s: StoryFinalSummary) => s.decisions.map((d) => d.chosenForm);
  const actionAtChat = gameplayContent.rounds.slice(0, GAMEPLAY.fieldRound).map((_, i) => (i === chatIndex ? 'action' : 'message'));
  assert.deepEqual(formsOf((await actorClosed).summary!), actionAtChat, 'the final summary');
  const persisted = persistedRoomByCode(code)!;
  const actorId = actor.me!.participantId;
  assert.deepEqual(formsOf(persistedSummary(persisted, actorId)!), actionAtChat, 'the stored summary');
  // Without a stored summary (a room interrupted by a restart), the summary is rebuilt from the stored choices.
  getDb().prepare('UPDATE story_participants SET summary_json = NULL WHERE room_id = ? AND participant_id = ?').run(roomId, actorId);
  assert.deepEqual(formsOf(persistedSummary(persisted, actorId)!), actionAtChat, 'the summary rebuilt from stored decisions');

  const shared = [...projector, ...hostConsole.payloads];
  const everyPublic = [...shared, ...players.flatMap((b) => b.publicPayloads)];
  // Evidence: one version per round for every receiver and phase, and it is the authored one.
  for (const round of [GAMEPLAY.dossierRound, GAMEPLAY.fieldRound]) {
    for (const [who, payloads] of [['projector', projector], ['host', hostConsole.payloads], ...players.map((b) => [b.name, b.publicPayloads] as const)] as const) {
      assert.ok(parsePublic(payloads).some((s) => s.scene?.roundNumber === round), `${who} received round ${round}`);
    }
    const versions = new Set(parsePublic(everyPublic).filter((s) => s.scene?.roundNumber === round).map((s) => JSON.stringify(s.scene!.evidence)));
    assert.equal(versions.size, 1, `round ${round}: the same evidence everywhere`);
  }
  const dossier = parsePublic(projector).find((s) => s.scene?.roundNumber === GAMEPLAY.dossierRound)!.scene!;
  assert.deepEqual([dossier.layout, dossier.action, dossier.respondent], ['dossier', GAMEPLAY.action, { speaker: 'customer', name: 'Bu Rina' }]);
  assert.deepEqual(dossier.evidence.map((e) => [e.id, e.kind, e.kicker, e.title, e.assetId]), [
    ['surat', 'document', GAMEPLAY.documentKicker, GAMEPLAY.documentTitle, null],
    ['daftar', 'checklist', '', GAMEPLAY.checklistTitle, null],
    ['foto-berkas', 'photo', '', 'Foto berkas uji', evidencePicture],
  ]);

  // Lesson: never while a round is read or answered, on any screen; then public.
  const lessonOf = (roundNumber: number) => gameplayContent.text.id![textKey.roundLesson(gameplayContent.rounds[roundNumber - 1]!.id)] ?? '';
  for (const s of parsePublic(everyPublic)) {
    if (s.scene) assert.equal(s.scene.lesson, s.phase === 'scene' || s.phase === 'answering' ? '' : lessonOf(s.scene.roundNumber), `round ${s.scene.roundNumber}, ${s.phase}`);
  }
  for (const b of players) {
    for (const m of privatesOf(b)) if (!m.consequence && !m.summary) assert.deepEqual(carried(JSON.stringify(m), [GAMEPLAY.lesson, GAMEPLAY.effectLesson]), [], `${b.name}: no lesson before close`);
  }

  // The scene clock travels with every payload of a round and never moves within it.
  for (let round = 1; round <= GAMEPLAY.fieldRound; round++) {
    const clocks = new Set(parsePublic(projector).filter((s) => s.roundNumber === round && s.phase !== 'interrupted').map((s) => `${s.sceneStartedAt}|${s.readingMs}`));
    assert.equal(clocks.size, 1, `round ${round}: one scene clock`);
    assert.ok(!clocks.has('null|null'), `round ${round}: a scene clock is sent`);
  }

  // Reminders and labelled delayed effects reach only the holder, privately.
  const noted = [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }];
  const reminded = privatesOf(holder).filter((m) => m.flagReminders.length > 0);
  assert.ok(reminded.length > 0, 'the holder was reminded');
  for (const m of reminded) assert.deepEqual([m.roundNumber, m.consequence, m.flagReminders], [FEATURE.effectRound, null, noted], 'while the reacting round is read and answered');
  for (const payload of [...everyPublic, ...other.privatePayloads, ...actor.privatePayloads]) assert.deepEqual(carried(payload, [GAMEPLAY.flagLabel]), [], 'the flag label never reaches shared screens or another participant');
  const consequenceOf = (b: Bot, round: number) => privatesOf(b).find((m) => m.consequence?.roundNumber === round)!.consequence!;
  const chat = consequenceOf(holder, GAMEPLAY.chatRound);
  assert.deepEqual([chat.reply, chat.respondentName, chat.lesson, chat.flagSet, chat.chosenForm], [GAMEPLAY.chatReplyC2, 'Bu Rina', GAMEPLAY.lesson, null, 'message']);
  assert.equal(consequenceOf(other, GAMEPLAY.chatRound).reply, GAMEPLAY.chatReplyC1);
  const acted = consequenceOf(actor, GAMEPLAY.chatRound);
  assert.deepEqual([acted.chosenText, acted.chosenForm, acted.reply], [GAMEPLAY.actionText, 'action', ''], 'the live consequence of the action (no reply authored for it)');
  assert.deepEqual([consequenceOf(holder, FEATURE.effectRound).delayed, consequenceOf(other, FEATURE.effectRound).delayed], [noted, []]);

  // No answer keys, flag ids or author notes anywhere; nobody receives another participant's private payload.
  for (const payload of [...everyPublic, ...players.flatMap((b) => b.privatePayloads)]) assert.deepEqual(carried(payload, NEVER_SENT), []);
  for (const b of players) for (const payload of b.privatePayloads) for (const p of players) if (p !== b) assert.ok(!payload.includes(p.name), `${b.name} saw ${p.name}`);

  gameplayRoom = { code, holder, other };
  for (const b of players) b.sock.close();
  watch.close();
  host.close();
});

test('a result reopened after the room left memory still carries the names, status words and flag notes; a summary stored before labels existed gets them from its version', async () => {
  assert.ok(gameplayRoom, 'needs the room of the previous test');
  const { code, holder, other } = gameplayRoom;
  const result = async (b: Bot) => {
    const r = await fetch(`${BASE}/api/story/rooms/${code}/result`, { headers: { 'x-story-credential': b.credential } });
    assert.equal(r.status, 200);
    return ((await r.json()) as { summary: StoryFinalSummary }).summary;
  };
  const live = await result(holder);
  assert.deepEqual(live.labels, featureLabels, 'from the live (closed) room');
  srv.story.manager.sweep(-1, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  assert.equal(srv.story.manager.get(code), undefined, 'the closed room left memory');
  const reopened = await result(holder);
  assert.deepEqual(reopened, live, 'the stored summary reads exactly like the live one');
  assert.deepEqual(reopened.decisions[GAMEPLAY.chatRound - 1]!.flagSet, { label: GAMEPLAY.flagLabel, effectRound: FEATURE.effectRound, delta: FEATURE.delayedDelta }, 'noted where the flag was left');
  assert.deepEqual(reopened.decisions[FEATURE.effectRound - 1]!.delayed, [{ label: GAMEPLAY.flagLabel, fromRound: FEATURE.setRound, delta: FEATURE.delayedDelta }], 'and where it took effect');
  const neutral = await result(other);
  assert.deepEqual(neutral.labels, featureLabels);
  assert.ok(neutral.decisions.every((d) => d.flagSet === null && d.delayed.length === 0), 'no flag notes for a participant who never left the flag');

  // A summary stored before labels and the gameplay fields existed (stored JSON is never rewritten by the server).
  const roomId = persistedRoomByCode(code)!.id;
  const participantId = holder.me!.participantId;
  const row = getDb().prepare('SELECT summary_json FROM story_participants WHERE room_id = ? AND participant_id = ?').get(roomId, participantId) as { summary_json: string };
  const older = JSON.parse(row.summary_json) as { labels?: unknown; decisions: Record<string, unknown>[] };
  delete older.labels;
  for (const d of older.decisions) for (const field of ['reply', 'respondentName', 'lesson', 'delayed', 'flagSet', 'chosenForm']) delete d[field];
  getDb().prepare('UPDATE story_participants SET summary_json = ? WHERE room_id = ? AND participant_id = ?').run(JSON.stringify(older), roomId, participantId);
  const old = await result(holder);
  assert.deepEqual(old.labels, featureLabels, 'names and status words from the version content');
  assert.ok(
    old.decisions.every((d) => d.reply === '' && d.respondentName === null && d.lesson === '' && d.delayed.length === 0 && d.flagSet === null && d.chosenForm === 'message'),
    'the other new fields read as neutral defaults',
  );
  assert.deepEqual(old.decisions.map((d) => d.score), live.decisions.map((d) => d.score), 'stored points are never recalculated');
});

test('CMS validation (instant feedback, stored drafts, submission) knows built-in from uploaded pictures: a field scene and its evidence pictures need uploaded images', async () => {
  const uploaded = await uploadPicture('background', 'Latar validasi uji');
  const errorKeys = (issues: readonly ContentIssue[]) => issues.filter((i) => i.severity === 'error').map((i) => `${i.code}@${i.field}`);
  const validate = async (c: ScenarioContent) => {
    const r = await api<{ issues: ContentIssue[] }>('POST', '/api/cms/validate', tokens.penulis!, { content: c });
    assert.equal(r.status, 200, r.text);
    return errorKeys(r.json.issues);
  };
  assert.deepEqual(await validate(buildGameplayScenario({ image: uploaded })), [], 'an uploaded scene picture, also as the photo evidence');
  const builtin = buildGameplayScenario({ image: 'builtin:bg:parkiran' });
  const expected = ['field_builtin_background@rounds[4].backgroundAssetId', 'evidence_asset_builtin@rounds[4].evidence[0].assetId'];
  assert.deepEqual(await validate(builtin), expected, 'a seeded built-in background has no image file');
  const created = await api<{ scenario: { id: string; issues: ContentIssue[] } }>('POST', '/api/cms/scenarios', tokens.penulis!, { categoryId: 'auto', title: 'Uji latar bawaan', contentSource: 'demo', content: builtin });
  assert.equal(created.status, 200, created.text);
  assert.deepEqual(errorKeys(created.json.scenario.issues), expected, 'the stored draft shows the same issues');
  assert.equal((await api('POST', `/api/cms/scenarios/${created.json.scenario.id}/submit`, tokens.penulis!, {})).status, 422, 'and cannot be submitted for review');
});

// ------------------------------------------------------------------ snapshot order on real sockets

/** Order of the phases within a round; the closed phases come last. */
const PHASE_RANK: Record<StoryPhase, number> = { lobby: 0, scene: 1, answering: 2, consequence: 3, leaderboard: 4, finished: 5, interrupted: 5 };

/**
 * The earliest phase a private snapshot can belong to (it names no phase itself): options or an accepted answer mean
 * answering, an own consequence means closed answers, a summary a closed room; otherwise the scene (or the lobby).
 */
function privatePhaseRank(me: StoryPrivateState): number {
  if (me.summary) return PHASE_RANK.finished;
  if (me.consequence) return PHASE_RANK.consequence;
  if (me.options || me.answer) return PHASE_RANK.answering;
  return me.roundNumber > 0 ? PHASE_RANK.scene : PHASE_RANK.lobby;
}

test('phase changes reach every device public first: no client ever holds a private snapshot of a newer round or phase than the last public one it received', async () => {
  storyLimiters.guess.reset();
  const scenario = buildTestScenario();
  const scenarioId = await publishScenario(scenario);
  const host = await connect(tokens.host);
  const created = await rpc<{ code: string }>(host, 'host:create', { scenarioId, autoAdvance: false });
  assert.ok(created.ok, JSON.stringify(created));
  const code = created.data.code;
  // Ani answers every round at once; Budi lets round 2 run into its deadline: both ways a round closes are covered, and
  // the host continues every leaderboard (the other transitions run on the server's timers).
  const ani = new Bot('Ani Urutan', () => 'tepat', scenario);
  const budi = new Bot('Budi Urutan', (r) => (r === 2 ? null : 'kurang_tepat'), scenario);
  type Received = { kind: 'public' | 'private'; round: number; rank: number };
  const received = new Map<Bot, Received[]>();
  for (const b of [ani, budi]) {
    assert.ok((await b.join(code)).ok, b.name);
    const log: Received[] = [];
    received.set(b, log);
    b.sock.on('story:public', (s: StoryPublicState) => log.push({ kind: 'public', round: s.roundNumber, rank: PHASE_RANK[s.phase] }));
    b.sock.on('story:private', (m: StoryPrivateState) => log.push({ kind: 'private', round: m.roundNumber, rank: privatePhaseRank(m) }));
  }
  const watch = await connect();
  assert.ok((await rpc(watch, 'display:watch', { code })).ok);
  const hostConsole = driveLeaderboards(host, code, 15);
  assert.ok((await rpc(host, 'host:start', { code })).ok);
  await waitFor<StoryPublicState>(watch, 'story:public', (s) => s.phase === 'finished', 'ordered room finished', 90_000);
  hostConsole.stop();
  await new Promise((r) => setTimeout(r, 300));
  assert.deepEqual(hostConsole.failures, []);

  for (const [b, log] of received) {
    let last = { round: 0, rank: PHASE_RANK.lobby };
    let checked = 0;
    for (const e of log) {
      if (e.kind === 'public') {
        last = e;
        continue;
      }
      checked++;
      assert.ok(e.round < last.round || (e.round === last.round && e.rank <= last.rank), `${b.name}: a private snapshot of round ${e.round} (phase rank ${e.rank}) arrived while the last public one was round ${last.round} (phase rank ${last.rank})`);
    }
    // 15 scenes, answer windows and consequences, 14 leaderboards and the end: each phase change sent a private snapshot.
    assert.ok(checked >= 15 * 3 + 14 + 1, `${b.name}: ${checked} private snapshots checked`);
    const seen = new Set(log.filter((e) => e.kind === 'public').map((e) => `${e.round}:${e.rank}`));
    for (let round = 1; round <= 15; round++) {
      for (const rank of [PHASE_RANK.scene, PHASE_RANK.answering, PHASE_RANK.consequence, round < 15 ? PHASE_RANK.leaderboard : PHASE_RANK.finished]) {
        assert.ok(seen.has(`${round}:${rank}`), `${b.name}: the public snapshot of round ${round}, phase rank ${rank}`);
      }
    }
  }
  for (const b of [ani, budi]) b.sock.close();
  watch.close();
  host.close();
});
