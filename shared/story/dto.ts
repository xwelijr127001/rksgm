/**
 * REST response contracts of the internal staff APIs (CMS, host, admin). Shared so the server functions and the staff
 * UI use one definition. Pure types: no answer keys leave the server through PUBLIC routes (protocol.ts covers those);
 * these payloads are only served to authenticated staff with the matching capability (roles.ts).
 */
import type { AssetKind, ContentSource, ScenarioContent } from './content';
import type { StaffIdentity } from './roles';
import type { ContentIssue } from './validate';

// ------------------------------------------------------------------ content (CMS)

export type ScenarioStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type VersionStatus = 'published' | 'superseded' | 'withdrawn';
export type AnonymizationStatus = 'pending' | 'checked' | 'not_required_demo';

export interface CategoryView {
  id: string;
  name: string;
  active: boolean;
  sort: number;
  note: string;
}

/** Attribution fields (`…By`) carry the staff USERNAME for display; the database stores the staff id. */
export interface VersionView {
  id: string;
  scenarioId: string;
  versionNo: number;
  title: string;
  categoryId: string;
  contentKind: 'demo' | 'official';
  contentHash: string;
  fromRevision: number;
  submittedBy: string | null;
  reviewedBy: string;
  publishedAt: number;
  reviewNote: string;
  anonymization: Record<string, unknown>;
  status: VersionStatus;
  withdrawnAt: number | null;
  withdrawnBy: string | null;
  withdrawnReason: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  categoryId: string;
  status: ScenarioStatus;
  contentSource: ContentSource;
  currentVersionNo: number | null;
  draftRevision: number;
  updatedAt: number;
  updatedBy: string | null;
}

export interface ScenarioEvent {
  at: number;
  actorName: string;
  action: string;
  revision: number | null;
  versionId: string | null;
  note: string;
}

export interface ScenarioDetail extends ScenarioSummary {
  content: ScenarioContent;
  issues: ContentIssue[];
  anonymization: { status: AnonymizationStatus; by: string | null; at: number | null; note: string };
  submittedBy: string | null;
  submittedAt: number | null;
  submittedRevision: number | null;
  reviewNote: string;
  createdAt: number;
  createdBy: string | null;
  versions: VersionView[];
  events: ScenarioEvent[];
}

export interface RevisionRow {
  revision: number;
  savedAt: number;
  savedBy: string | null;
}

/** Scenario with its published versions, for report filters (competition admin). */
export interface ReportScenario extends ScenarioSummary {
  versions: { id: string; versionNo: number; status: VersionStatus }[];
}

/** Metadata only (no rounds/keys) for the host's scenario picker. */
export interface HostScenarioOption {
  scenarioId: string;
  versionId: string;
  versionNo: number;
  title: string;
  categoryName: string;
  contentKind: 'demo' | 'official';
  synopsis: string;
  difficulty: number;
  publishedAt: number;
}

export interface AssetMeta {
  title: string;
  collection: string;
  source: string;
  license: string;
  rightsHolder: string;
  usageNotes: string;
}

export interface AssetView extends AssetMeta {
  id: string;
  kind: AssetKind;
  builtin: boolean;
  url: string | null;
  mime: string | null;
  sizeBytes: number | null;
  /** Expression names (characters). */
  expressions: string[];
  /** Expression -> URL for uploaded characters (built-in characters are drawn by client code). */
  variantUrls: Record<string, string>;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

// ------------------------------------------------------------------ reports (competition admin)

export interface PeriodView {
  id: string;
  name: string;
  startsAt: number;
  endsAt: number;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface ResultFilter {
  /** Period ID, 'outside' (no period), or undefined (all). */
  periodId?: string;
  scenarioId?: string;
  versionId?: string;
  includeDemo?: boolean;
  includeInterrupted?: boolean;
}

export interface Dashboard {
  filter: ResultFilter;
  roomsStarted: number;
  roomsFinished: number;
  roomsInterrupted: number;
  /** Started rooms still in progress; not part of participant/completion/average figures until they close. */
  roomsRunning: number;
  participants: number;
  completedParticipants: number;
  completionRate: number | null;
  averageScore: number | null;
  byScenario: { scenarioId: string; versionNo: number; versionId: string; title: string; contentKind: string; rooms: number; participants: number; averageScore: number | null }[];
  definitions: Record<string, string>;
}

export interface ResultRow {
  roomCode: string;
  scenarioId: string;
  scenarioTitle: string;
  versionNo: number;
  versionId: string;
  contentKind: string;
  roomStatus: string;
  periodName: string | null;
  startedAt: number;
  finishedAt: number | null;
  durationMs: number | null;
  participantId: string;
  participantName: string;
  totalScore: number;
  accuracyPoints: number;
  speedPoints: number;
  answeredCount: number;
  timeoutCount: number;
  roomRank: number | null;
  rankTied: boolean;
  completed: boolean;
  endingKind: string | null;
}

export interface RoundAnalytics {
  versionId: string;
  scenarioTitle: string;
  versionNo: number;
  rounds: {
    roundIndex: number;
    roundId: string;
    title: string;
    decisions: number;
    tepat: number;
    kurangTepat: number;
    keliru: number;
    timeout: number;
    keliruRate: number | null;
    timeoutRate: number | null;
    /** PRD metric "Kualitas konten": more than three quarters answered wrong. */
    confusing: boolean;
  }[];
}

export interface RoomListRow {
  code: string;
  scenarioTitle: string;
  versionNo: number;
  contentKind: string;
  status: string;
  closedReason: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  participants: number;
}

// ------------------------------------------------------------------ staff & audit (system admin)

export interface StaffUserView extends StaffIdentity {
  active: boolean;
  createdAt: number;
}

export interface AuditRow {
  id: number;
  at: number;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: Record<string, unknown>;
}
