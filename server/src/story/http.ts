/**
 * REST API of the Story Room system. Every staff route declares the capability it needs (shared/story/roles.ts) and is
 * checked server-side; hiding buttons in the UI is never the protection. Public routes expose only what a participant
 * or projector needs (room info, the room's own assets, a participant's own result via their credential).
 */
import express from 'express';
import { ASSET_KINDS } from '../../../shared/story/content';
import type { ReportScenario } from '../../../shared/story/dto';
import type { StoryRoomInfo } from '../../../shared/story/protocol';
import { can, isStaffRole, type Capability, type StaffIdentity, type StaffRole } from '../../../shared/story/roles';
import { sanitizeScenarioContent, validateScenario } from '../../../shared/story/validate';
import { listAudit, writeAudit, type AuditActor } from './auth/audit';
import { RateLimiter } from './auth/rateLimit';
import {
  authenticate,
  createStaff,
  listStaff,
  login,
  logout,
  setStaffActive,
  setStaffPassword,
  setStaffRoles,
  StaffError,
} from './auth/staff';
import {
  ASSET_FILE_PATTERN,
  ASSET_SIZE_LIMIT,
  AssetError,
  assetFolder,
  cleanAssetMeta,
  createUploadedAsset,
  getAsset,
  isAssetKind,
  listAssets,
  putCharacterVariant,
  setAssetArchived,
  updateAssetMeta,
} from './content/assets';
import {
  archive,
  createScenario,
  getRevision,
  getScenario,
  getVersionContent,
  listCategories,
  listPlayableForHost,
  listRevisions,
  listScenarios,
  publish,
  recordAnonymizationCheck,
  returnToDraft,
  saveDraft,
  ScenarioError,
  setCategoryActive,
  submitForReview,
  unarchive,
  validationContext,
  versionsOf,
  withdrawVersion,
  type ScenarioStatus,
} from './content/scenarios';
import { createPeriod, dashboard, listPeriods, listRooms, parseFilter, ReportError, results, resultsCsv, roundAnalytics, updatePeriod } from './reports';
import { participantByCredential, persistedRoomByCode, persistedSummary } from './runtime/sqliteStore';
import { credentialHash, lookupAllowed, missingRoom, storyLimiters, type StoryService } from './socket';

interface StaffRequest extends express.Request {
  staff?: StaffIdentity;
}

/**
 * Failed staff logins only (successful logins are never limited: every new tab signs in again because the token lives
 * in sessionStorage). Per IP+username against guessing one account, per IP against spraying many accounts.
 */
const loginLimiter = new RateLimiter(10, 10 * 60_000);
const loginSprayLimiter = new RateLimiter(50, 10 * 60_000);
/** Password hashing runs off the event loop; this caps how many run at once so live rooms keep their timing. */
const MAX_CONCURRENT_LOGINS = 8;
let loginsInFlight = 0;
/** Rows shown in the results table (the CSV export always contains every row). */
const RESULTS_VIEW_LIMIT = 2000;

const actorOf = (s: StaffIdentity): AuditActor => ({ id: s.id, name: s.username });

function bearer(req: express.Request): string | null {
  const h = req.header('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/** 401 without a valid session, 403 without the capability. */
function requireCap(cap: Capability): express.RequestHandler {
  return (req, res, next) => {
    const staff = authenticate(bearer(req));
    if (!staff) {
      res.status(401).json({ ok: false, error: 'Silakan masuk sebagai staf.' });
      return;
    }
    if (!can(staff.roles, cap)) {
      res.status(403).json({ ok: false, error: 'Peran Anda tidak diizinkan untuk tindakan ini.' });
      return;
    }
    (req as StaffRequest).staff = staff;
    next();
  };
}

const requireAnyStaff: express.RequestHandler = (req, res, next) => {
  const staff = authenticate(bearer(req));
  if (!staff) {
    res.status(401).json({ ok: false, error: 'Silakan masuk sebagai staf.' });
    return;
  }
  (req as StaffRequest).staff = staff;
  next();
};

const staffOf = (req: express.Request): StaffIdentity => {
  const s = (req as StaffRequest).staff;
  if (!s) throw new Error('requireCap middleware missing');
  return s;
};

/** Map domain errors to HTTP; anything else becomes a generic 500 via the app error handler. */
function handle(fn: (req: express.Request, res: express.Response) => void): express.RequestHandler {
  return (req, res, next) => {
    try {
      fn(req, res);
    } catch (err) {
      if (err instanceof ScenarioError) {
        res.status(err.status).json({ ok: false, error: err.message, issues: err.issues });
        return;
      }
      if (err instanceof AssetError || err instanceof StaffError || err instanceof ReportError) {
        res.status(err.status).json({ ok: false, error: err.message });
        return;
      }
      next(err);
    }
  };
}

const param = (req: express.Request, name: string) => String(req.params[name] ?? '');
const body = (req: express.Request): Record<string, unknown> => (req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {});

export function mountStoryHttp(app: express.Express, service: StoryService): void {
  const r = express.Router();
  r.use(express.json({ limit: '1mb' }));

  // ------------------------------------------------------------ staff session
  r.post('/staff/login', async (req, res, next) => {
    const b = body(req);
    const ip = String(req.ip);
    const key = `${ip}|${String(b.username ?? '').toLowerCase()}`;
    if (loginLimiter.blocked(key) || loginSprayLimiter.blocked(ip)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan masuk yang salah. Coba lagi beberapa menit lagi.' });
      return;
    }
    if (loginsInFlight >= MAX_CONCURRENT_LOGINS) {
      res.status(503).json({ ok: false, error: 'Server sedang sibuk. Coba masuk lagi beberapa detik lagi.' });
      return;
    }
    loginsInFlight++;
    try {
      const result = await login(b.username, b.password);
      if (!result) {
        loginLimiter.record(key);
        loginSprayLimiter.record(ip);
        res.status(401).json({ ok: false, error: 'Nama pengguna atau kata sandi salah, atau akun tidak aktif.' });
        return;
      }
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    } finally {
      loginsInFlight--;
    }
  });
  r.post('/staff/logout', (req, res) => {
    logout(bearer(req));
    res.json({ ok: true });
  });
  r.get('/staff/me', requireAnyStaff, (req, res) => res.json({ ok: true, identity: staffOf(req) }));

  // ------------------------------------------------------------ categories (FR-A1)
  r.get('/cms/categories', requireAnyStaff, (_req, res) => res.json({ ok: true, categories: listCategories() }));
  r.post(
    '/cms/categories/:id',
    requireCap('manageCategories'),
    handle((req, res) => res.json({ ok: true, category: setCategoryActive(param(req, 'id'), body(req).active === true, actorOf(staffOf(req))) })),
  );

  // ------------------------------------------------------------ assets (FR-A9, FR-E4)
  r.get('/cms/assets', requireCap('readAssets'), (req, res) => {
    const kind = isAssetKind(req.query.kind) ? req.query.kind : undefined;
    res.json({ ok: true, assets: listAssets({ kind, includeArchived: req.query.archived === '1' }), kinds: ASSET_KINDS });
  });
  const raw = express.raw({ type: () => true, limit: ASSET_SIZE_LIMIT.video });
  r.post(
    '/cms/assets',
    requireCap('manageAssets'),
    raw,
    handle((req, res) => {
      const kind = req.query.kind;
      if (!isAssetKind(kind)) throw new AssetError('Jenis aset tidak dikenal.');
      const meta = cleanAssetMeta(req.query);
      res.json({ ok: true, asset: createUploadedAsset(kind, req.body as Buffer, meta, actorOf(staffOf(req)), typeof req.query.expression === 'string' ? req.query.expression : undefined) });
    }),
  );
  r.post(
    '/cms/assets/:id/variants',
    requireCap('manageAssets'),
    raw,
    handle((req, res) => res.json({ ok: true, asset: putCharacterVariant(param(req, 'id'), req.query.expression, req.body as Buffer, actorOf(staffOf(req))) })),
  );
  r.put('/cms/assets/:id', requireCap('manageAssets'), handle((req, res) => res.json({ ok: true, asset: updateAssetMeta(param(req, 'id'), cleanAssetMeta(body(req)), actorOf(staffOf(req))) })));
  r.post(
    '/cms/assets/:id/archive',
    requireCap('manageAssets'),
    handle((req, res) => res.json({ ok: true, asset: setAssetArchived(param(req, 'id'), body(req).archived === true, actorOf(staffOf(req))) })),
  );

  // ------------------------------------------------------------ scenarios (FR-A2–A8)
  r.get('/cms/scenarios', requireCap('readScenarios'), (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as ScenarioStatus) : undefined;
    res.json({ ok: true, scenarios: listScenarios({ status }) });
  });
  r.post(
    '/cms/scenarios',
    requireCap('editScenarios'),
    handle((req, res) => {
      const b = body(req);
      res.json({ ok: true, scenario: createScenario({ categoryId: b.categoryId, title: b.title, contentSource: b.contentSource, content: b.content }, actorOf(staffOf(req))) });
    }),
  );
  r.get('/cms/scenarios/:id', requireCap('readScenarios'), handle((req, res) => res.json({ ok: true, scenario: getScenario(param(req, 'id')) })));
  r.put(
    '/cms/scenarios/:id/draft',
    requireCap('editScenarios'),
    handle((req, res) => res.json({ ok: true, scenario: saveDraft(param(req, 'id'), body(req).content, body(req).revision, actorOf(staffOf(req))) })),
  );
  /** Validate unsaved content (instant CMS feedback). Same validator as publication. */
  r.post(
    '/cms/validate',
    requireCap('readScenarios'),
    handle((req, res) => {
      const content = sanitizeScenarioContent(body(req).content);
      if (!content) throw new ScenarioError('Isi skenario tidak dapat dibaca.');
      res.json({ ok: true, issues: validateScenario(content, validationContext()) });
    }),
  );
  r.get('/cms/scenarios/:id/revisions', requireCap('readScenarios'), handle((req, res) => res.json({ ok: true, revisions: listRevisions(param(req, 'id')) })));
  r.get(
    '/cms/scenarios/:id/revisions/:rev',
    requireCap('readScenarios'),
    handle((req, res) => res.json({ ok: true, content: getRevision(param(req, 'id'), Number(param(req, 'rev'))) })),
  );
  r.post('/cms/scenarios/:id/submit', requireCap('editScenarios'), handle((req, res) => res.json({ ok: true, scenario: submitForReview(param(req, 'id'), body(req).note, actorOf(staffOf(req))) })));
  r.post('/cms/scenarios/:id/return', requireCap('reviewScenarios'), handle((req, res) => res.json({ ok: true, scenario: returnToDraft(param(req, 'id'), body(req).note, actorOf(staffOf(req))) })));
  r.post(
    '/cms/scenarios/:id/anonymization',
    requireCap('reviewScenarios'),
    handle((req, res) => res.json({ ok: true, scenario: recordAnonymizationCheck(param(req, 'id'), body(req).note, actorOf(staffOf(req))) })),
  );
  r.post('/cms/scenarios/:id/publish', requireCap('reviewScenarios'), handle((req, res) => res.json({ ok: true, scenario: publish(param(req, 'id'), body(req).note, actorOf(staffOf(req))) })));
  r.post('/cms/scenarios/:id/archive', requireCap('archiveScenarios'), handle((req, res) => res.json({ ok: true, scenario: archive(param(req, 'id'), body(req).reason, actorOf(staffOf(req))) })));
  r.post('/cms/scenarios/:id/unarchive', requireCap('archiveScenarios'), handle((req, res) => res.json({ ok: true, scenario: unarchive(param(req, 'id'), actorOf(staffOf(req))) })));
  r.get('/cms/versions/:id', requireCap('readScenarios'), handle((req, res) => res.json({ ok: true, ...getVersionContent(param(req, 'id')) })));
  r.post(
    '/cms/versions/:id/withdraw',
    requireCap('archiveScenarios'),
    handle((req, res) => res.json({ ok: true, version: withdrawVersion(param(req, 'id'), body(req).reason, actorOf(staffOf(req))) })),
  );

  // ------------------------------------------------------------ host (metadata only; rooms are driven over sockets)
  r.get('/host/scenarios', requireCap('hostRooms'), (_req, res) => res.json({ ok: true, scenarios: listPlayableForHost(), limits: service.manager.limits }));
  r.get('/host/rooms', requireCap('hostRooms'), (req, res) => res.json({ ok: true, rooms: listRooms({ hostUserId: staffOf(req).id }) }));

  // ------------------------------------------------------------ competition admin (FR-D3–D6, FR-E1–E2)
  r.get('/admin/periods', requireCap('readReports'), (_req, res) => res.json({ ok: true, periods: listPeriods() }));
  r.post('/admin/periods', requireCap('managePeriods'), handle((req, res) => res.json({ ok: true, period: createPeriod(body(req), actorOf(staffOf(req))) })));
  r.put('/admin/periods/:id', requireCap('managePeriods'), handle((req, res) => res.json({ ok: true, period: updatePeriod(param(req, 'id'), body(req), actorOf(staffOf(req))) })));
  r.get('/admin/dashboard', requireCap('readReports'), handle((req, res) => res.json({ ok: true, dashboard: dashboard(parseFilter(req.query as Record<string, unknown>)) })));
  r.get(
    '/admin/results',
    requireCap('readReports'),
    handle((req, res) => {
      const rows = results(parseFilter(req.query as Record<string, unknown>));
      res.json({ ok: true, results: rows.slice(0, RESULTS_VIEW_LIMIT), total: rows.length, truncated: rows.length > RESULTS_VIEW_LIMIT });
    }),
  );
  r.get(
    '/admin/results.csv',
    requireCap('readReports'),
    handle((req, res) => {
      const rows = results(parseFilter(req.query as Record<string, unknown>));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rekap-raksa-game-917-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(resultsCsv(rows));
    }),
  );
  r.get('/admin/analytics', requireCap('readReports'), handle((req, res) => res.json({ ok: true, analytics: roundAnalytics(parseFilter(req.query as Record<string, unknown>)) })));
  r.get('/admin/rooms', requireCap('readReports'), (_req, res) => res.json({ ok: true, rooms: listRooms({ limit: 500 }) }));
  r.post(
    '/admin/rooms/:code/close',
    requireCap('closeRooms'),
    handle((req, res) => {
      const room = service.manager.get(param(req, 'code'));
      if (!room) throw new ReportError('Room tidak aktif (sudah selesai atau tidak ditemukan).', 404);
      const closed = room.close('admin_closed');
      if (!closed.ok) throw new ReportError(closed.error, 409);
      writeAudit(actorOf(staffOf(req)), 'room.admin_close', 'story_room', room.code, { hostUserId: room.hostUserId });
      res.json({ ok: true });
    }),
  );
  r.get('/admin/scenarios', requireCap('readReports'), (_req, res) => {
    const scenarios: ReportScenario[] = listScenarios().map((s) => ({ ...s, versions: versionsOf(s.id).map((v) => ({ id: v.id, versionNo: v.versionNo, status: v.status })) }));
    res.json({ ok: true, scenarios });
  });
  r.get('/admin/audit', requireCap('readAudit'), (req, res) =>
    res.json({ ok: true, audit: listAudit({ limit: Number(req.query.limit) || 200, action: typeof req.query.action === 'string' ? req.query.action : undefined }) }),
  );

  // ------------------------------------------------------------ users & roles (system admin)
  r.get('/admin/users', requireCap('manageUsers'), (_req, res) => res.json({ ok: true, users: listStaff() }));
  const rolesFrom = (v: unknown): StaffRole[] => (Array.isArray(v) ? v.filter(isStaffRole) : []);
  r.post(
    '/admin/users',
    requireCap('manageUsers'),
    handle((req, res) => {
      const b = body(req);
      const user = createStaff(
        { username: String(b.username ?? ''), displayName: String(b.displayName ?? ''), password: String(b.password ?? ''), roles: rolesFrom(b.roles) },
        actorOf(staffOf(req)),
      );
      res.json({ ok: true, user });
    }),
  );
  r.put('/admin/users/:id/roles', requireCap('manageUsers'), handle((req, res) => res.json({ ok: true, user: setStaffRoles(param(req, 'id'), rolesFrom(body(req).roles), actorOf(staffOf(req))) })));
  r.post('/admin/users/:id/active', requireCap('manageUsers'), handle((req, res) => res.json({ ok: true, user: setStaffActive(param(req, 'id'), body(req).active === true, actorOf(staffOf(req))) })));
  r.post(
    '/admin/users/:id/password',
    requireCap('manageUsers'),
    handle((req, res) => {
      setStaffPassword(param(req, 'id'), String(body(req).password ?? ''), actorOf(staffOf(req)));
      res.json({ ok: true });
    }),
  );

  // ------------------------------------------------------------ public (participants / projector)
  r.get('/story/rooms/:code/info', (req, res) => {
    const ip = String(req.ip);
    if (!lookupAllowed(ip)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan dengan kode yang salah. Tunggu beberapa menit.', code: 'rate_limited' });
      return;
    }
    const room = service.manager.get(param(req, 'code'));
    if (!room) {
      const miss = missingRoom(param(req, 'code'), ip);
      res.status(miss.code === 'closed' ? 410 : 404).json(miss);
      return;
    }
    const blocker = room.joinBlocker();
    const info: StoryRoomInfo = {
      code: room.code,
      scenarioTitle: room.version.title,
      categoryName: room.version.categoryName,
      phase: room.phase,
      participantCount: room.publicState().participantCount,
      maxParticipants: room.maxParticipants,
      canJoin: blocker === null,
      ...(blocker ? { reason: blocker.error, reasonCode: blocker.code } : {}),
    };
    res.json({ ok: true, info });
  });

  /**
   * Assets referenced by this room's frozen content only (no library enumeration), and only for rounds the room has
   * reached (StoryRoom.reachedAssetIds: round 1 already in the lobby, for preloading; backgrounds, media and evidence
   * pictures): titles/images of later rounds never leak ahead of time. Lookups go through the same failed-guess limiter
   * as /info.
   */
  r.get('/story/rooms/:code/assets', (req, res) => {
    const ip = String(req.ip);
    if (!lookupAllowed(ip)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan dengan kode yang salah. Tunggu beberapa menit.', code: 'rate_limited' });
      return;
    }
    const room = service.manager.get(param(req, 'code'));
    if (!room) {
      const miss = missingRoom(param(req, 'code'), ip);
      res.status(miss.code === 'closed' ? 410 : 404).json(miss);
      return;
    }
    const assets = room
      .reachedAssetIds()
      .map((id) => getAsset(id))
      .filter((a) => a !== undefined)
      .map((a) => ({ id: a.id, kind: a.kind, builtin: a.builtin, url: a.url, mime: a.mime, title: a.title, variantUrls: a.variantUrls }));
    res.json({ ok: true, assets });
  });

  /** A participant's own result (live or after restart), authorized by their room-scoped credential. */
  r.get('/story/rooms/:code/result', (req, res) => {
    const credential = req.header('x-story-credential') ?? '';
    const ip = String(req.ip);
    if (!lookupAllowed(ip)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan dengan identitas yang salah. Tunggu beberapa menit.' });
      return;
    }
    const unknown = () => {
      storyLimiters.guess.record(ip);
      res.status(401).json({ ok: false, error: 'Identitas peserta tidak dikenal.' });
    };
    if (credential.length < 20 || credential.length > 64) return unknown();
    const hash = credentialHash(credential);
    const live = service.manager.get(param(req, 'code'));
    if (live) {
      const p = live.participantByCredential(hash);
      if (!p) return unknown();
      if (!live.closed) {
        res.status(409).json({ ok: false, error: 'Sesi belum selesai.', phase: live.phase });
        return;
      }
      res.json({ ok: true, summary: live.summaryFor(p), removed: p.removed });
      return;
    }
    const room = persistedRoomByCode(param(req, 'code').toUpperCase());
    if (!room) {
      storyLimiters.guess.record(ip);
      res.status(404).json({ ok: false, error: 'Room tidak ditemukan.' });
      return;
    }
    const pid = participantByCredential(room.id, hash)?.participantId;
    if (!pid) return unknown();
    if (room.status !== 'finished' && room.status !== 'interrupted') {
      res.status(409).json({ ok: false, error: 'Sesi belum selesai.' });
      return;
    }
    res.json({ ok: true, summary: persistedSummary(room, pid) });
  });

  app.use('/api', r);

  // Uploaded asset files: strict names, no traversal, nosniff, long cache (content-addressed names).
  app.get('/aset-cerita/:file', (req, res) => {
    const file = param(req, 'file');
    const missing = () => {
      if (!res.headersSent) res.status(404).type('text/plain').send('Aset tidak ditemukan');
    };
    if (!ASSET_FILE_PATTERN.test(file)) return missing();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.sendFile(file, { root: assetFolder(), maxAge: 7 * 24 * 60 * 60 * 1000, immutable: true, dotfiles: 'deny' }, (err) => {
      if (err) missing();
    });
  });
  app.use('/aset-cerita', (_req, res) => {
    res.status(404).type('text/plain').send('Aset tidak ditemukan');
  });
}
