/**
 * T-102 (Investigator lengkap, card 1): FROZEN HTTP CONTRACT of the Investigator event board ("Top Investigator hari
 * ini"). Types and constants only; the service is card 4 (server/src/investigator/**), the phone / host / projector
 * clients are card 6 (client/src/investigator-event/**). Nothing here touches the quiz rooms.
 *
 * Rules the types encode
 *   - The server owns the run: stage, attempt count, score, best and stamps. A client sends IDS only (`Decision`); a
 *     total, grade, stamp or device history is never part of a request.
 *   - Credentials travel in the `Authorization: Bearer <credential>` header, never in a query string. Three kinds:
 *     staff session (existing staff auth, hostRooms), participant credential (join), display credential (projector,
 *     read-only, revocable).
 *   - Every reply is `{ ok: true, ...payload }` or `{ ok: false, error: <EventErrorCode> }` (ApiResult<T>). Error codes are
 *     machine codes; the client shows its own translated sentence.
 *   - No real names, contact details or free text: the only player-visible identity is the server-made alias.
 *
 * Sequence numbers. A run starts at seq 0. `Decision.seq` = the seq the phone believes the run is at; the server applies
 * the decision only when it equals the run's seq, then answers `Ack.seq` = that value + 1 (a miss counts: it is an applied
 * decision with status 'retry'). The same `commandId` with the same body returns the STORED Ack again, whatever the run's
 * seq is by then; the same `commandId` with a different body is 'command_conflict'. Practice never submits.
 */
import type { CaseScore, CaseVersion, StageId, StepStatus } from './rubric';

// ------------------------------------------------------------------ constants

export const EVENT_API = '/api/investigator/events';

/** Path templates under EVENT_API (":x" = path parameter). Auth: S = staff session, O = staff who owns the event,
 *  P = participant credential, D = display credential, - = public. */
export const EVENT_ROUTES = {
  /** POST S  CreateEventRequest -> CreateEventReply */
  create: '',
  /** GET  S  -> HostEventView | { event: null } (the open event of this host; restores the host panel after a restart) */
  mine: '/mine',
  /** GET  O  -> HostEventView */
  host: '/:eventId',
  /** POST O  -> HostEventView (board closed; purge within 24 h) */
  close: '/:eventId/close',
  /** POST O  -> HostEventView (all entries, runs and aliases of the board removed; the event stays open) */
  clear: '/:eventId/clear',
  /** POST O  HideEntryRequest -> HostEventView */
  hide: '/:eventId/entries/:participantId/hide',
  /** POST O  -> DisplayCodeReply (short-lived, one use) */
  displayCode: '/:eventId/display-code',
  /** POST O  -> HostEventView (every display credential of the event stops working) */
  displayRevoke: '/:eventId/display/revoke',
  /** POST -  DisplayExchangeRequest -> DisplayExchangeReply */
  displayExchange: '/display/exchange',
  /** GET  D  -> BoardSnapshot */
  board: '/board',
  /** POST -  JoinRequest -> JoinReply */
  join: '/join',
  /** POST P  -> AliasReply (new random alias; only before the participant's first run) */
  alias: '/alias',
  /** GET  P  -> Standing */
  me: '/me',
  /** POST P  StartRunRequest -> StartRunReply */
  runs: '/runs',
  /** GET  P  -> RunState (resume after a reload or reconnect) */
  run: '/runs/:runId',
  /** POST P  Decision -> Ack */
  decisions: '/runs/:runId/decisions',
} as const;

/** Query parameter of the join QR: /investigator?acara=CODE (the public code only, never a credential). */
export const EVENT_QUERY_PARAM = 'acara';
/** The board day and midnight closure are in this zone. */
export const EVENT_TIME_ZONE = 'Asia/Jakarta';

export const EVENT_LIMITS = {
  /** Requests per minute. */
  joinsPerMinutePerIp: 120,
  joinsPerMinutePerBoard: 300,
  decisionsPerMinutePerParticipant: 30,
  hostMutationsPerMinutePerHost: 20,
  /** Participants per board. */
  maxParticipants: 500,
  /** Rows of a public snapshot. */
  topRows: 10,
  /** Board, runs and aliases are purged at most this long after closure (also after downtime). */
  purgeHoursAfterClose: 24,
  /** Suggested polling interval of the projector and of a phone's own standing. */
  pollMs: 5000,
  /** Lifetime of a display pairing code (one use). */
  displayCodeSeconds: 120,
  /** Upper bound of a JSON request body. */
  maxBodyBytes: 2048,
  /** Length bounds of ids a client sends (commandId, stageId, choiceId, runId). */
  maxIdLength: 64,
} as const;

// ------------------------------------------------------------------ envelope and errors

export type EventErrorCode =
  | 'bad_request'          // 400 malformed body or id
  | 'unauthorized'         // 401 missing / unknown / expired credential
  | 'forbidden'            // 403 not the owner, or not a hostRooms staff
  | 'not_found'            // 404 unknown event code, event or run
  | 'closed'               // 409 the board is closed (host closure or local midnight)
  | 'full'                 // 409 the board has EVENT_LIMITS.maxParticipants participants
  | 'alias_locked'         // 409 alias reroll after the first run
  | 'unsupported_version'  // 409 case or rubric version unknown to the server
  | 'stage_mismatch'       // 409 Decision.stageId is not the run's current stage
  | 'seq_mismatch'         // 409 Decision.seq is not the run's seq (and commandId is new)
  | 'invalid_choice'       // 409 choiceId not allowed at this stage
  | 'command_conflict'     // 409 commandId reused with a different body
  | 'run_done'             // 409 the run is already complete
  | 'rate_limited'         // 429
  | 'unavailable';         // 503

export interface EventFail {
  ok: false;
  error: EventErrorCode;
  /** With 'rate_limited': seconds to wait. */
  retryAfter?: number;
  /** With 'stage_mismatch' / 'seq_mismatch' / 'run_done': where the run really is, so the phone can resume from it. */
  run?: RunState;
}
export type ApiResult<T> = ({ ok: true } & T) | EventFail;

// ------------------------------------------------------------------ host (staff session)

/** Nothing to send: no title, no free text. */
export type CreateEventRequest = Record<string, never>;

export interface EventInfo {
  eventId: string;
  /** Public join code shown on the projector and typed in the hub. Gives no host rights. */
  code: string;
  /** Calendar day of the board, YYYY-MM-DD in EVENT_TIME_ZONE. */
  day: string;
  status: 'open' | 'closed';
  /** Epoch ms. `closesAt` = next local midnight unless the host closes earlier. */
  createdAt: number;
  closesAt: number;
  /** Epoch ms after which the closed board is purged; null while open. */
  purgeAt: number | null;
}
export interface CreateEventReply { event: EventInfo; cases: CaseVersion[] }

/** One ranked entry as the PUBLIC sees it. Equal totals share a rank. */
export interface PublicRow {
  rank: number;
  alias: string;
  /** Sum of the participant's best of each case in this event. */
  total: number;
  /** Distinct cases completed in this event. */
  stamps: number;
}
export interface HostRow extends PublicRow {
  participantId: string;
  /** Hidden by the host: not in any public snapshot, not ranked publicly. */
  hidden: boolean;
}
export interface HostEventView {
  event: EventInfo;
  /** Participants who joined (including hidden ones and those without a finished case). */
  participants: number;
  /** Every entry with at least one finished case, ranked; hidden entries keep their place in this list only. */
  rows: HostRow[];
  /** True while at least one display credential of this event is valid. */
  displayPaired: boolean;
}
export interface HideEntryRequest { hidden: boolean }

// ------------------------------------------------------------------ projector (display credential, read-only)

export interface DisplayCodeReply { displayCode: string; expiresAt: number }
export interface DisplayExchangeRequest { displayCode: string }
export interface DisplayExchangeReply { credential: string; eventId: string; expiresAt: number }

export interface BoardSnapshot {
  event: Pick<EventInfo, 'eventId' | 'code' | 'day' | 'status' | 'closesAt'>;
  participants: number;
  /** Top EVENT_LIMITS.topRows visible entries. */
  rows: PublicRow[];
  generatedAt: number;
}

// ------------------------------------------------------------------ participant

export interface JoinRequest { code: string }
export interface JoinReply {
  event: Pick<EventInfo, 'eventId' | 'code' | 'day' | 'status' | 'closesAt'>;
  participantId: string;
  /** Event-local alias, e.g. "Lensa 042". */
  alias: string;
  /** Opaque bearer credential of this participant; the server stores only its hash. Shown to nobody. */
  credential: string;
  /** Epoch ms; never later than the purge of the board. */
  expiresAt: number;
  /** Cases the server can rank and their rubric versions. A case missing here (or with another version than the
   *  phone's own manifest) is played unranked: "Main sendiri" stays available. */
  cases: CaseVersion[];
}
export interface AliasReply { alias: string }

/** The participant's own standing (phone). */
export interface Standing {
  alias: string;
  /** null = no finished case yet, or the entry is hidden. */
  rank: number | null;
  total: number;
  stamps: number;
  /** Best total per finished case of this event. */
  best: Record<string, number>;
  participants: number;
  event: Pick<EventInfo, 'eventId' | 'status' | 'closesAt'>;
  /** The run still in progress, if any (resume binding). */
  openRun: RunState | null;
}

export interface StartRunRequest { caseId: string; rubricVersion: number }
/** Where a run is. `status` 'active' until the message is chosen. */
export interface RunState {
  runId: string;
  caseId: string;
  rubricVersion: number;
  /** Applied decisions so far (0 = fresh run). */
  seq: number;
  stage: StageId;
  status: 'active' | 'completed';
  /** Present once completed. */
  score?: CaseScore;
  /** The last applied command and its acknowledgement: a phone that reloaded while a command was pending compares its
   *  stored pending commandId with this one and applies the same Ack exactly once. */
  last?: { commandId: string; ack: Ack };
}
export type StartRunReply =
  /** A fresh run from the beginning (an unfinished run of the same participant and case is replaced). */
  | { status: 'started'; run: RunState }
  /** Ranked play is off for this case on this phone: offer the solo exit. */
  | { status: 'unsupported'; caseId: string; cases: CaseVersion[] };

/** One scored decision. FROZEN: exactly these five fields. */
export interface Decision {
  runId: string;
  seq: number;
  /** Made by the phone once per tap and reused on every retry of that tap (8..64 chars of [A-Za-z0-9_-]). */
  commandId: string;
  stageId: StageId;
  /** Card id in a round, verdict id at 'verdict', message id at 'message'. */
  choiceId: string;
}

/** Acknowledgement of an applied decision. FROZEN: exactly these fields. */
export interface Ack {
  /** The run's seq after this decision. */
  seq: number;
  nextStage: StageId;
  /** 'advanced' | 'retry' (miss: same round, next attempt) | 'completed'. */
  status: StepStatus;
  /** Only with 'completed': the server-computed score of the run. */
  score?: CaseScore;
}
