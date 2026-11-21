/**
 * T-107 (Investigator lengkap, card 4): HTTP layer of the Investigator event board, mounted at /api/investigator/events
 * (frozen contract: shared/investigator/event.ts). OFF unless RAKSA_INVESTIGATOR_ACARA=on: with the flag off no table is
 * created, no timer runs, and every path under the mount answers 404 `{ ok: false, error: 'not_found' }`.
 *
 * Who may call what
 *   staff session (existing /api/staff/login bearer) with capability hostRooms : create, mine
 *   the same, AND owner of that event (the staff user who created it)          : view, close, clear, hide, display code, revoke
 *   participant credential (`ivp_...`, from join)                              : alias, me, runs, run, decisions
 *   display credential (`ivd_...`, from the pairing-code exchange), read-only   : board
 *   nobody (public)                                                            : join (needs the public code), display exchange (needs a pairing code)
 * Every credential travels in `Authorization: Bearer`, never in the URL. The public join code gives no host rights.
 *
 * Protections: approved browser origins only (the same policy as the rest of the API), request bodies capped at
 * EVENT_LIMITS.maxBodyBytes, `Cache-Control: no-store`, rate limits per trusted client IP / board / participant / host
 * with bounded limiter state, and logs that never contain a credential, a code or an alias. `req.ip` honours TRUST_PROXY_HOPS exactly like the story API (index.ts `trust proxy`).
 */
import express from 'express';
import { EVENT_API, EVENT_LIMITS, EVENT_ROUTES, type EventErrorCode } from '../../../shared/investigator/event';
import { caseVersions } from '../../../shared/investigator/rubric';
import { can, type StaffIdentity } from '../../../shared/story/roles';
import { getDb } from '../db';
import { asalDiizinkan } from '../keamanan';
import { RateLimiter } from '../story/auth/rateLimit';
import { authenticate } from '../story/auth/staff';
import { runInvestigatorMigrations } from './migrations';
import {
  boardSnapshot,
  clearEvent,
  closeEvent,
  createEvent,
  CREDENTIAL_DISPLAY,
  CREDENTIAL_PARTICIPANT,
  decide,
  DISPLAY_CODE_LENGTH,
  EVENT_CODE_LENGTH,
  EventError,
  eventById,
  eventInfo,
  eventOfDisplay,
  exchangeDisplayCode,
  getRun,
  hideEntry,
  hostView,
  issueDisplayCode,
  joinEvent,
  normalizeCode,
  openEventByCode,
  openEventOfHost,
  participantOf,
  rerollAlias,
  revokeDisplays,
  standing,
  startRun,
  sweep,
  type EventRow,
  type ParticipantRow,
} from './store';

/** RAKSA_INVESTIGATOR_ACARA=on switches the event board on (default off). */
export const investigatorEventsEnabled = (): boolean => (process.env.RAKSA_INVESTIGATOR_ACARA || 'off').toLowerCase().trim() === 'on';

const MINUTE = 60_000;
/** Bounded limiter state: at most this many keys per limiter (the oldest are dropped past it). */
const MAX_KEYS = 20_000;
const limiters = () => ({
  joinIp: new RateLimiter(EVENT_LIMITS.joinsPerMinutePerIp, MINUTE, undefined, MAX_KEYS),
  joinBoard: new RateLimiter(EVENT_LIMITS.joinsPerMinutePerBoard, MINUTE, undefined, 2_000),
  decisions: new RateLimiter(EVENT_LIMITS.decisionsPerMinutePerParticipant, MINUTE, undefined, MAX_KEYS),
  hostMutations: new RateLimiter(EVENT_LIMITS.hostMutationsPerMinutePerHost, MINUTE, undefined, 2_000),
  /** Reads of one credential (own standing, run state, projector snapshot): generous for polling, bounded for abuse. */
  reads: new RateLimiter(120, MINUTE, undefined, MAX_KEYS),
  /** Every pairing-code exchange attempt per trusted client IP (a projector pairs once; a guesser gets 20 tries a minute). */
  pairing: new RateLimiter(20, MINUTE, undefined, MAX_KEYS),
  /**
   * UNKNOWN credentials per trusted client IP. It only turns further unknown-credential answers from 401 into 429; a VALID
   * credential is never refused because of it. Reason: everyone at a venue shares one public IP, and after a host "clear"
   * every phone still polls with a credential that no longer exists; a failure counter that blocked the IP would lock out
   * the whole venue. Credentials are 256 random bits, so guessing is not a practical attack.
   */
  wrongCredential: new RateLimiter(60, 5 * MINUTE, undefined, MAX_KEYS),
});

const fail = (res: express.Response, status: number, error: EventErrorCode, extra: Record<string, unknown> = {}): void => {
  if (status === 429) res.setHeader('Retry-After', '60');
  res.status(status).json({ ok: false, error, ...(status === 429 ? { retryAfter: 60 } : {}), ...extra });
};
const bearer = (req: express.Request): string | null => {
  const h = req.header('authorization') ?? '';
  const v = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  return v && v.length <= 256 ? v : null;
};
const bodyOf = (req: express.Request): Record<string, unknown> => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Record<string, unknown>) : {});
const param = (req: express.Request, name: string): string => String(req.params[name] ?? '').slice(0, EVENT_LIMITS.maxIdLength + 1);
const ipOf = (req: express.Request): string => String(req.ip);

export function mountInvestigatorEvents(app: express.Express): boolean {
  if (!investigatorEventsEnabled()) {
    app.use(EVENT_API, (_req, res) => { res.status(404).json({ ok: false, error: 'not_found' }); });
    return false;
  }
  const db = getDb();
  runInvestigatorMigrations(db);
  const lim = limiters();

  // Housekeeping: at start (also covers downtime), every minute, and before a request when the last run is 15 s old.
  let lastSweep = 0;
  const tidy = (now: number): void => {
    if (now - lastSweep < 15_000) return;
    lastSweep = now;
    const { closed, purged } = sweep(db, now);
    if (closed || purged) console.log(`[investigator] board ditutup: ${closed}, dibersihkan: ${purged}`);
  };
  tidy(Date.now());
  setInterval(() => { try { tidy(Date.now()); } catch (err) { console.error('[investigator] sweep:', (err as Error)?.message); } }, MINUTE).unref();

  const r = express.Router();
  r.use(express.json({ limit: EVENT_LIMITS.maxBodyBytes }));
  r.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    // Approved origins only. A request without an Origin header is not a cross-site browser request (same policy as sockets).
    const origin = req.header('origin');
    if (origin && !asalDiizinkan(origin, req.headers)) { fail(res, 403, 'forbidden'); return; }
    tidy(Date.now());
    next();
  });

  /** Runs a handler; an EventError becomes its `{ ok: false, error }` reply, anything else goes to the error handler below. */
  const handle = (fn: (req: express.Request, res: express.Response) => void): express.RequestHandler => (req, res, next) => {
    try { fn(req, res); } catch (err) {
      if (err instanceof EventError) { fail(res, err.status, err.code, err.run ? { run: err.run } : {}); return; }
      next(err);
    }
  };

  // ---- who is calling
  const host = (req: express.Request, res: express.Response): StaffIdentity | null => {
    const staff = authenticate(bearer(req));
    if (!staff) { fail(res, 401, 'unauthorized'); return null; }
    if (!can(staff.roles, 'hostRooms')) { fail(res, 403, 'forbidden'); return null; }
    return staff;
  };
  /** Host AND owner of the event in the path. `mutation` also spends the host's mutation budget. */
  const owner = (req: express.Request, res: express.Response, mutation: boolean): { staff: StaffIdentity; e: EventRow } | null => {
    const staff = host(req, res);
    if (!staff) return null;
    if (mutation && !lim.hostMutations.take(staff.id)) { fail(res, 429, 'rate_limited'); return null; }
    const e = eventById(db, param(req, 'eventId'));
    if (!e) { fail(res, 404, 'not_found'); return null; }
    if (e.host_id !== staff.id) { fail(res, 403, 'forbidden'); return null; }
    return { staff, e };
  };
  const unknownCredential = (req: express.Request, res: express.Response): null => {
    const ip = ipOf(req);
    if (lim.wrongCredential.blocked(ip)) { fail(res, 429, 'rate_limited'); return null; }
    lim.wrongCredential.record(ip);
    fail(res, 401, 'unauthorized');
    return null;
  };
  const participant = (req: express.Request, res: express.Response): { p: ParticipantRow; e: EventRow } | null => {
    const token = bearer(req);
    const siapa = token && token.startsWith(CREDENTIAL_PARTICIPANT) ? participantOf(db, token, Date.now()) : undefined;
    return siapa ?? unknownCredential(req, res);
  };

  // ---- host (staff session + hostRooms)
  r.post(EVENT_ROUTES.create || '/', handle((req, res) => {
    const staff = host(req, res);
    if (!staff) return;
    if (!lim.hostMutations.take(staff.id)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, event: eventInfo(createEvent(db, staff.id, Date.now())), cases: caseVersions() });
  }));
  r.get(EVENT_ROUTES.mine, handle((req, res) => {
    const staff = host(req, res);
    if (!staff) return;
    const e = openEventOfHost(db, staff.id);
    res.json(e ? { ok: true, ...hostView(db, e, Date.now()) } : { ok: true, event: null });
  }));

  // ---- projector: pairing-code exchange (public, guess-limited) and the read-only snapshot
  r.post(EVENT_ROUTES.displayExchange, handle((req, res) => {
    if (!lim.pairing.take(ipOf(req))) { fail(res, 429, 'rate_limited'); return; }
    const code = normalizeCode(bodyOf(req).displayCode, DISPLAY_CODE_LENGTH);
    const hasil = code ? exchangeDisplayCode(db, code, Date.now()) : null;
    if (!hasil) { fail(res, 404, 'not_found'); return; }
    res.json({ ok: true, ...hasil });
  }));
  r.get(EVENT_ROUTES.board, handle((req, res) => {
    const token = bearer(req);
    const e = token && token.startsWith(CREDENTIAL_DISPLAY) ? eventOfDisplay(db, token, Date.now()) : undefined;
    if (!e) { unknownCredential(req, res); return; }
    if (!lim.reads.take(`d:${e.id}:${ipOf(req)}`)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, ...boardSnapshot(db, e, Date.now()) });
  }));

  // ---- participants
  r.post(EVENT_ROUTES.join, handle((req, res) => {
    // EVERY join attempt (right or wrong code) spends the per-IP budget: that is the bound on code guessing (see handoff).
    if (!lim.joinIp.take(ipOf(req))) { fail(res, 429, 'rate_limited'); return; }
    const code = normalizeCode(bodyOf(req).code, EVENT_CODE_LENGTH);
    const e = code ? openEventByCode(db, code) : undefined;
    if (!e) { fail(res, 404, 'not_found'); return; }
    if (!lim.joinBoard.take(e.id)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, ...joinEvent(db, e, Date.now()) });
  }));
  r.post(EVENT_ROUTES.alias, handle((req, res) => {
    const s = participant(req, res);
    if (!s) return;
    if (!lim.decisions.take(s.p.id)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, alias: rerollAlias(db, s.p, s.e) });
  }));
  r.get(EVENT_ROUTES.me, handle((req, res) => {
    const s = participant(req, res);
    if (!s) return;
    if (!lim.reads.take(`p:${s.p.id}`)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, ...standing(db, s.p, s.e) });
  }));
  r.post(EVENT_ROUTES.runs, handle((req, res) => {
    const s = participant(req, res);
    if (!s) return;
    if (!lim.decisions.take(s.p.id)) { fail(res, 429, 'rate_limited'); return; }
    const b = bodyOf(req);
    res.json({ ok: true, ...startRun(db, s.p, s.e, b.caseId, b.rubricVersion, Date.now()) });
  }));
  r.get(EVENT_ROUTES.run, handle((req, res) => {
    const s = participant(req, res);
    if (!s) return;
    if (!lim.reads.take(`p:${s.p.id}`)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, ...getRun(db, s.p, param(req, 'runId')) });
  }));
  r.post(EVENT_ROUTES.decisions, handle((req, res) => {
    const s = participant(req, res);
    if (!s) return;
    if (!lim.decisions.take(s.p.id)) { fail(res, 429, 'rate_limited'); return; }
    res.json({ ok: true, ...decide(db, s.p, param(req, 'runId'), bodyOf(req), Date.now()) });
  }));

  // ---- owner of the event (registered AFTER the fixed paths above, so "/mine", "/board", "/me" never match ":eventId")
  r.get(EVENT_ROUTES.host, handle((req, res) => {
    const o = owner(req, res, false);
    if (o) res.json({ ok: true, ...hostView(db, o.e, Date.now()) });
  }));
  r.post(EVENT_ROUTES.close, handle((req, res) => {
    const o = owner(req, res, true);
    if (o) res.json({ ok: true, ...hostView(db, closeEvent(db, o.e, Date.now()), Date.now()) });
  }));
  r.post(EVENT_ROUTES.clear, handle((req, res) => {
    const o = owner(req, res, true);
    if (!o) return;
    clearEvent(db, o.e);
    res.json({ ok: true, ...hostView(db, o.e, Date.now()) });
  }));
  r.post(EVENT_ROUTES.hide, handle((req, res) => {
    const o = owner(req, res, true);
    if (!o) return;
    const hidden = bodyOf(req).hidden;
    if (typeof hidden !== 'boolean') { fail(res, 400, 'bad_request'); return; }
    hideEntry(db, o.e, param(req, 'participantId'), hidden);
    res.json({ ok: true, ...hostView(db, o.e, Date.now()) });
  }));
  r.post(EVENT_ROUTES.displayCode, handle((req, res) => {
    const o = owner(req, res, true);
    if (!o) return;
    if (o.e.status !== 'open') { fail(res, 409, 'closed'); return; }
    res.json({ ok: true, ...issueDisplayCode(db, o.e, Date.now()) });
  }));
  r.post(EVENT_ROUTES.displayRevoke, handle((req, res) => {
    const o = owner(req, res, true);
    if (!o) return;
    revokeDisplays(db, o.e);
    res.json({ ok: true, ...hostView(db, o.e, Date.now()) });
  }));

  // Unknown path under the mount, and errors: machine codes only, nothing about the request is echoed or logged in full.
  r.use((_req, res) => fail(res, 404, 'not_found'));
  r.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) { next(err); return; }
    const type = (err as { type?: string } | null)?.type;
    if (type === 'entity.too.large' || type === 'entity.parse.failed') { fail(res, 400, 'bad_request'); return; }
    console.error(`[investigator] ${req.method} ${req.route?.path ?? '(path)'}:`, (err as Error)?.message ?? 'error');
    fail(res, 503, 'unavailable');
  });
  app.use(EVENT_API, r);
  return true;
}
