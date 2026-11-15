/**
 * Socket.IO namespace `/story` (ARCHITECTURE.md §4). Every handler validates its untrusted payload, checks who is
 * asking (participant credential bound to the socket, or an authenticated staff session with the `host` role), and
 * replies with a `StoryAck`. Public snapshots go to `room:<code>`; private state only to `p:<roomId>:<participantId>`.
 * On a phase or round change the public snapshot is sent before the private ones.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Namespace, Server, Socket } from 'socket.io';
import { STORY_NAMESPACE, type StoryAck, type StoryErrorCode, type StoryJoinResult, type StoryPhase, type StoryPrivateState, type StoryPublicState } from '../../../shared/story/protocol';
import { can, type StaffIdentity } from '../../../shared/story/roles';
import { CONFIG } from '../config';
import { writeAudit } from './auth/audit';
import { clientIp } from './auth/clientIp';
import { RateLimiter } from './auth/rateLimit';
import { authenticate, purgeExpiredSessions } from './auth/staff';
import { ScenarioError } from './content/scenarios';
import { StoryRoomManager } from './runtime/manager';
import type { StoryRoom, StoryRoomEvents } from './runtime/room';
import { codeExists } from './runtime/sqliteStore';

interface StorySocketData {
  /** Staff bearer token from the handshake; re-validated on every host event (revocation takes effect at once). */
  staffToken?: string;
  participant?: { code: string; roomId: string; participantId: string };
}

type Reply<T> = (res: StoryAck<T>) => void;
const fail = <T>(code: StoryErrorCode, error: string): StoryAck<T> => ({ ok: false, code, error });

export const credentialHash = (credential: string) => createHash('sha256').update(credential).digest('hex');

/**
 * Rate limits for unauthenticated operations (PRD "Kode room tidak mudah ditebak"). `guess` counts only FAILED lookups
 * (a code that never existed, or an unknown credential) per client IP, so a whole event behind one office NAT can join
 * and reconnect; `flood` is a generous cap on all such requests per IP against scripted floods. `rename` throttles name
 * changes per participant.
 */
export const storyLimiters = {
  guess: new RateLimiter(30, 5 * 60_000),
  flood: new RateLimiter(1200, 60_000),
  rename: new RateLimiter(10, 60_000),
};
const RATE_LIMITED = 'Terlalu banyak percobaan dengan kode/identitas yang salah. Tunggu beberapa menit.';

/** Gate for unauthenticated lookups: false when the IP is over its failed-guess budget or flooding. */
export function lookupAllowed(ip: string): boolean {
  return !storyLimiters.guess.blocked(ip) && storyLimiters.flood.take(ip);
}

/**
 * A room code that is not live: a code that once existed (finished/interrupted room, e.g. after a server restart) is
 * answered as `closed` and is NOT counted as a guess — otherwise every phone of an event reconnecting after a restart
 * would exhaust the shared NAT budget. Only codes that never existed count as guesses.
 */
export function missingRoom(code: unknown, ip: string): Extract<StoryAck<never>, { ok: false }> {
  if (typeof code === 'string' && code.length <= 12 && codeExists(code.trim().toUpperCase())) {
    return { ok: false, code: 'closed', error: 'Room ini sudah selesai atau terhenti. Hasilmu tetap bisa dibuka dari perangkat yang sama.' };
  }
  storyLimiters.guess.record(ip);
  return { ok: false, code: 'not_found', error: 'Kode room tidak ditemukan. Periksa lagi kodenya.' };
}

export interface StoryService {
  nsp: Namespace;
  manager: StoryRoomManager;
}

export function createStoryService(io: Server): StoryService {
  const nsp = io.of(STORY_NAMESPACE);
  /** Rooms with a public change not broadcast yet (coalesced). */
  const pending = new Set<string>();
  let flushTimer: NodeJS.Timeout | null = null;

  const emitPublic = (room: StoryRoom) => {
    nsp.to(`room:${room.code}`).emit('story:public', room.publicState());
  };
  const emitPrivate = (room: StoryRoom, ids: readonly string[] | 'all') => {
    const list = ids === 'all' ? [...room.participants.keys()] : ids;
    for (const id of list) {
      const me = room.privateState(id);
      if (me) nsp.to(participantChannel(room, id)).emit('story:private', me);
    }
  };

  const flush = () => {
    flushTimer = null;
    const codes = [...pending];
    pending.clear();
    for (const code of codes) {
      const room = manager.get(code);
      if (room) emitPublic(room);
    }
  };

  const events: StoryRoomEvents = {
    publicChanged(room, urgent) {
      pending.add(room.code);
      if (urgent) {
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 0);
      } else if (!flushTimer) {
        // Coalesce bursts (e.g. 100 answers in a second) into one snapshot per 120 ms.
        flushTimer = setTimeout(flush, 120);
      }
    },
    privateChanged: emitPrivate,
    phaseChanged(room) {
      // Public first, at once (it also carries any change still pending for this room): every socket of a participant is
      // in the room channel, and one connection delivers in emit order, so no client ever holds a private state of a
      // newer phase or round than its public state.
      pending.delete(room.code);
      emitPublic(room);
      emitPrivate(room, 'all');
    },
    participantRemoved(room, participantId) {
      const channel = participantChannel(room, participantId);
      nsp.to(channel).emit('story:removed', { code: room.code });
      nsp.in(channel).socketsLeave([`room:${room.code}`, channel]);
    },
  };

  const manager = new StoryRoomManager(events);
  setInterval(() => manager.sweep(), 10 * 60_000).unref();
  setInterval(() => purgeExpiredSessions(), 60 * 60_000).unref();

  nsp.use((socket, next) => {
    const token = (socket.handshake.auth as Record<string, unknown> | undefined)?.staffToken;
    if (typeof token === 'string') (socket.data as StorySocketData).staffToken = token;
    next();
  });

  nsp.on('connection', (socket: Socket) => {
    const data = socket.data as StorySocketData;
    const ip = clientIp(socket.handshake.address, socket.handshake.headers['x-forwarded-for'], CONFIG.trustProxyHops);

    // One malformed packet must never crash the server or a room: every handler is guarded.
    const on = <P, T>(event: string, handler: (payload: P, reply: Reply<T>) => void) => {
      socket.on(event, (payload: P, cb: unknown) => {
        const reply: Reply<T> = typeof cb === 'function' ? (cb as Reply<T>) : () => {};
        try {
          handler((payload ?? {}) as P, reply);
        } catch (err) {
          console.warn(`[story] ${event} failed: ${(err as Error).message}`);
          reply(fail('invalid', 'Permintaan tidak dapat diproses.'));
        }
      });
    };

    /** Leave the bound participant's channels; it is marked disconnected unless another socket still holds it. */
    const unbind = () => {
      const bound = data.participant;
      if (!bound) return;
      data.participant = undefined;
      void socket.leave(`room:${bound.code}`);
      const room = manager.get(bound.code);
      if (room && room.id === bound.roomId) {
        void socket.leave(participantChannel(room, bound.participantId));
        if (!hasOtherSockets(nsp, room, bound.participantId)) room.setConnected(bound.participantId, false);
      }
    };

    const bindParticipant = (room: StoryRoom, participantId: string) => {
      // A socket represents one participant at a time; joining/resuming as someone else releases the previous one
      // (otherwise it would stay "connected" forever and hold up every scene's readiness).
      const prev = data.participant;
      if (prev && (prev.roomId !== room.id || prev.participantId !== participantId)) unbind();
      data.participant = { code: room.code, roomId: room.id, participantId };
      void socket.join([`room:${room.code}`, participantChannel(room, participantId)]);
    };

    // ---------------------------------------------------------------- participants

    on<{ code?: unknown; name?: unknown; acceptNotice?: unknown }, StoryJoinResult>('participant:join', (p, reply) => {
      if (!lookupAllowed(ip)) return reply(fail('rate_limited', RATE_LIMITED));
      if (p.acceptNotice !== true) {
        return reply(fail('invalid', 'Setujui dulu pemberitahuan bahwa namamu tampil di papan peringkat dan pengumuman pemenang.'));
      }
      const room = manager.get(p.code);
      if (!room) return reply(missingRoom(p.code, ip));
      const credential = randomBytes(24).toString('base64url');
      const added = room.addParticipant(randomUUID().slice(0, 12), p.name, credentialHash(credential));
      if (!added.ok) return reply(added);
      bindParticipant(room, added.data.id);
      reply({ ok: true, data: { participantId: added.data.id, credential, state: room.publicState(), me: room.privateState(added.data.id)! } });
    });

    on<{ code?: unknown; credential?: unknown }, { participantId: string; state: StoryPublicState; me: StoryPrivateState }>('participant:resume', (p, reply) => {
      if (!lookupAllowed(ip)) return reply(fail('rate_limited', RATE_LIMITED));
      const room = manager.get(p.code);
      if (!room) return reply(missingRoom(p.code, ip));
      const participant = typeof p.credential === 'string' && p.credential.length >= 20 && p.credential.length <= 64 ? room.participantByCredential(credentialHash(p.credential)) : undefined;
      if (!participant) {
        storyLimiters.guess.record(ip);
        return reply(fail('unauthorized', 'Identitas peserta tidak dikenal di room ini.'));
      }
      if (participant.removed) return reply(fail('forbidden', 'Host sudah mengeluarkanmu dari room ini.'));
      bindParticipant(room, participant.id);
      room.setConnected(participant.id, true);
      reply({ ok: true, data: { participantId: participant.id, state: room.publicState(), me: room.privateState(participant.id)! } });
    });

    const ownRoom = (): { room: StoryRoom; participantId: string } | null => {
      const bound = data.participant;
      if (!bound) return null;
      const room = manager.get(bound.code);
      return room && room.id === bound.roomId ? { room, participantId: bound.participantId } : null;
    };

    on<{ name?: unknown }, { name: string }>('participant:rename', (p, reply) => {
      const own = ownRoom();
      if (!own) return reply(fail('unauthorized', 'Masuk ke room dulu.'));
      if (!storyLimiters.rename.take(`${own.room.id}|${own.participantId}`)) return reply(fail('rate_limited', 'Terlalu sering mengganti nama. Tunggu sebentar.'));
      reply(own.room.rename(own.participantId, p.name));
    });

    on<{ roundId?: unknown }, { ready: boolean }>('participant:ready', (p, reply) => {
      const own = ownRoom();
      if (!own) return reply(fail('unauthorized', 'Masuk ke room dulu.'));
      reply(own.room.markReady(own.participantId, p.roundId));
    });

    on<{ roundId?: unknown; option?: unknown }, { roundId: string; receivedAt: number; elapsedMs: number; duplicate: boolean }>('participant:answer', (p, reply) => {
      const own = ownRoom();
      if (!own) return reply(fail('unauthorized', 'Masuk ke room dulu.'));
      reply(own.room.answer(own.participantId, p.roundId, p.option));
    });

    on<Record<string, never>, { left: true }>('participant:leave', (_p, reply) => {
      unbind();
      reply({ ok: true, data: { left: true } });
    });

    // ---------------------------------------------------------------- display (projector)

    on<{ code?: unknown }, { state: StoryPublicState }>('display:watch', (p, reply) => {
      if (!lookupAllowed(ip)) return reply(fail('rate_limited', RATE_LIMITED));
      const room = manager.get(p.code);
      if (!room) return reply(missingRoom(p.code, ip));
      void socket.join(`room:${room.code}`);
      reply({ ok: true, data: { state: room.publicState() } });
    });

    // ---------------------------------------------------------------- host (authenticated staff)

    /** The CURRENT staff identity behind this socket (deactivation, password change, logout and expiry apply at once). */
    const host = (): { staff: StaffIdentity } | StoryAck<never> => {
      const staff = data.staffToken ? authenticate(data.staffToken) : null;
      if (!staff) return fail('unauthorized', 'Sesi staf berakhir atau dicabut. Silakan masuk lagi.');
      if (!can(staff.roles, 'hostRooms')) return fail('forbidden', 'Hanya akun dengan peran host yang bisa mengendalikan room.');
      return { staff };
    };
    const hostedRoom = (code: unknown): { room: StoryRoom; staff: StaffIdentity } | StoryAck<never> => {
      const h = host();
      if (isAck(h)) return h;
      const room = manager.get(code);
      if (!room) return fail('not_found', 'Room tidak ditemukan.');
      if (room.hostUserId !== h.staff.id) return fail('forbidden', 'Room ini dibuka host lain.');
      return { room, staff: h.staff };
    };
    const isAck = (v: unknown): v is StoryAck<never> => typeof v === 'object' && v !== null && 'ok' in v;

    on<{ scenarioId?: unknown; autoAdvance?: unknown }, { code: string; state: StoryPublicState }>('host:create', (p, reply) => {
      const h = host();
      if (isAck(h)) return reply(h);
      if (typeof p.scenarioId !== 'string') return reply(fail('invalid', 'Pilih skenario.'));
      try {
        const room = manager.create(p.scenarioId, h.staff, { autoAdvance: p.autoAdvance !== false });
        void socket.join(`room:${room.code}`);
        writeAudit({ id: h.staff.id, name: h.staff.username }, 'room.create', 'story_room', room.code, { scenarioId: room.version.scenarioId, versionId: room.version.versionId, versionNo: room.version.versionNo });
        reply({ ok: true, data: { code: room.code, state: room.publicState() } });
      } catch (err) {
        if (err instanceof ScenarioError) return reply(fail(err.status === 429 ? 'limit' : 'invalid', err.message));
        throw err;
      }
    });

    on<{ code?: unknown }, { state: StoryPublicState }>('host:attach', (p, reply) => {
      const h = hostedRoom(p.code);
      if (isAck(h)) return reply(h);
      void socket.join(`room:${h.room.code}`);
      reply({ ok: true, data: { state: h.room.publicState() } });
    });

    const hostAction = (event: string, act: (room: StoryRoom, p: Record<string, unknown>) => StoryAck<unknown>) =>
      on<Record<string, unknown>, { state: StoryPublicState }>(event, (p, reply) => {
        const h = hostedRoom(p.code);
        if (isAck(h)) return reply(h);
        const res = act(h.room, p);
        if (!res.ok) return reply(res);
        reply({ ok: true, data: { state: h.room.publicState() } });
      });

    hostAction('host:start', (room) => room.start());
    // The console sends the phase/round it was showing; a click that arrives after an automatic transition is refused
    // instead of acting on the NEW phase (e.g. skipping the next round's shared reading time).
    hostAction('host:next', (room, p) =>
      room.next(typeof p.phase === 'string' && typeof p.roundNumber === 'number' ? { phase: p.phase as StoryPhase, roundNumber: p.roundNumber } : undefined),
    );
    hostAction('host:auto', (room, p) => {
      room.setAutoAdvance(p.on === true);
      return { ok: true, data: null };
    });
    hostAction('host:remove', (room, p) => (typeof p.participantId === 'string' ? room.removeParticipant(p.participantId) : fail('invalid', 'Peserta tidak dikenal.')));
    hostAction('host:close', (room) => room.close('host_closed'));

    socket.on('disconnect', () => {
      const bound = data.participant;
      if (!bound) return;
      const room = manager.get(bound.code);
      if (room && room.id === bound.roomId && !hasOtherSockets(nsp, room, bound.participantId)) room.setConnected(bound.participantId, false);
    });
  });

  return { nsp, manager };
}

function participantChannel(room: StoryRoom, participantId: string): string {
  return `p:${room.id}:${participantId}`;
}

function hasOtherSockets(nsp: Namespace, room: StoryRoom, participantId: string): boolean {
  return (nsp.adapter.rooms.get(participantChannel(room, participantId))?.size ?? 0) > 0;
}
