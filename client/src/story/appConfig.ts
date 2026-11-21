/**
 * Server feature configuration (`GET /api/config`), read once per page load. The legacy flag decides which routes
 * exist in the client (the server enforces the same flag on its own APIs and sockets); until the answer arrives the
 * app shows a loading screen, and an unreachable server is treated as the MVP configuration (legacy off).
 */
import { useSyncExternalStore } from 'react';
import { STORY_SCORE_POLICY } from '@shared/story/scorePolicy';
import { ROUTER_BASENAME, serverUrl } from './base';

export interface AppConfig {
  legacy: boolean;
  /** T-037: kartu demo (auto-1) tampil di pemilih /cerita (RAKSA_DEMO_CERITA=on, uji internal). */
  demoCerita: boolean;
  /** T-074: "Episode 1 Dev" card in the /cerita picker (RAKSA_EP1_DEV=on). Direct links work regardless. */
  ep1Dev: boolean;
  /** T-076: "Episode 1 · Investigator" card in the /cerita picker (RAKSA_INVESTIGATOR=on). Direct links work regardless. */
  investigator: boolean;
  /** T-109: Investigator event board ("Top Investigator hari ini") is switched on (server RAKSA_INVESTIGATOR_ACARA=on). */
  investigatorAcara: boolean;
  story: { maxParticipants: number; answerWindowMs: number; scorePolicyId: string };
  /** Absolute base URL for join links/QR codes (server PUBLIC_BASE_URL or LAN address). */
  joinBaseUrl: string;
}

export type AppConfigState = { status: 'loading' } | { status: 'ready'; config: AppConfig; offline: boolean };

const FALLBACK: AppConfig = { legacy: false, demoCerita: false, ep1Dev: false, investigator: false, investigatorAcara: false, story: { maxParticipants: 100, answerWindowMs: 30_000, scorePolicyId: STORY_SCORE_POLICY.id }, joinBaseUrl: '' };

let state: AppConfigState = { status: 'loading' };
let loading: Promise<AppConfigState> | null = null;
const listeners = new Set<() => void>();

function parse(raw: unknown): AppConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const features = r.features as Record<string, unknown> | undefined;
  const story = r.story as Record<string, unknown> | undefined;
  if (!features || typeof features.legacy !== 'boolean' || !story) return null;
  return {
    legacy: features.legacy,
    demoCerita: features.demoCerita === true,
    ep1Dev: features.ep1Dev === true,
    investigator: features.investigator === true,
    investigatorAcara: features.investigatorAcara === true,
    story: {
      maxParticipants: typeof story.maxParticipants === 'number' ? story.maxParticipants : FALLBACK.story.maxParticipants,
      answerWindowMs: typeof story.answerWindowMs === 'number' ? story.answerWindowMs : FALLBACK.story.answerWindowMs,
      scorePolicyId: typeof story.scorePolicyId === 'string' ? story.scorePolicyId : FALLBACK.story.scorePolicyId,
    },
    joinBaseUrl: typeof r.joinBaseUrl === 'string' ? r.joinBaseUrl : '',
  };
}

function set(next: AppConfigState): void {
  state = next;
  listeners.forEach((fn) => fn());
}

/** Fetch the configuration once (main.tsx, before the first render). */
export function loadAppConfig(): Promise<AppConfigState> {
  loading ??= fetch(serverUrl('/api/config'), { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => parse(json))
    .catch(() => null)
    .then((config) => {
      set(config ? { status: 'ready', config, offline: false } : { status: 'ready', config: FALLBACK, offline: true });
      return state;
    });
  return loading;
}

export function appConfigState(): AppConfigState {
  return state;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useAppConfig(): AppConfigState {
  return useSyncExternalStore(subscribe, appConfigState, appConfigState);
}

/** Legacy features enabled? false while loading or offline (the safe MVP default). */
export function useLegacyEnabled(): boolean {
  const s = useAppConfig();
  return s.status === 'ready' && s.config.legacy;
}

/** Absolute join link for a story room code (QR codes, host console). */
export function joinLink(code: string, config: AppConfig | null): string {
  const origin = config?.joinBaseUrl || window.location.origin + ROUTER_BASENAME;
  return `${origin.replace(/\/+$/, '')}/join?room=${encodeURIComponent(code)}`;
}
