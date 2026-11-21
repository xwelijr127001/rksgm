/**
 * T-109: the PHONE's event-board session. One small record in localStorage (`raksa:investigator:acara:v1`), separate from
 * the story saves and from the solo record: the participant credential from the server, the alias, and per case the run
 * id, the last acknowledged seq and the command that is still waiting for its acknowledgement. It lets a reload or a
 * reconnect resume the same run. It is cleared when it expires, when the server no longer knows the credential, when the
 * guest leaves the board, and on "Tamu baru". It never holds a name, a score history or anything of the device.
 * Storage blocked = the session lives in memory until the tab closes.
 */
import type { CaseVersion } from '@shared/investigator/rubric';

export interface RunAcara {
  runId: string;
  /** Seq after the last acknowledged decision. */
  seq: number;
  selesai?: boolean;
  /** The guest chose "continue unranked" for this run: nothing more is submitted. */
  lepas?: boolean;
  /** Stored BEFORE a decision is sent; the same commandId is reused on every retry of that decision. */
  pending?: { commandId: string; stageId: string; choiceId: string };
}
export interface SesiAcara {
  code: string;
  eventId: string;
  participantId: string;
  alias: string;
  credential: string;
  expiresAt: number;
  cases: CaseVersion[];
  /** A first run was started: the alias can no longer be changed. */
  mulai: boolean;
  runs: Record<string, RunAcara>;
}

const KUNCI = 'raksa:investigator:acara:v1';
const KUNCI_SENDIRI = 'raksa:investigator:acara:sendiri';
let memori: string | null | undefined;
let versi = 0;
const pendengar = new Set<() => void>();
const kabari = (): void => { versi += 1; pendengar.forEach((f) => f()); };

function mentah(): string | null {
  if (memori !== undefined) return memori;
  try { return window.localStorage.getItem(KUNCI); } catch { return null; }
}
function tulis(nilai: string | null): void {
  try {
    if (nilai === null) window.localStorage.removeItem(KUNCI); else window.localStorage.setItem(KUNCI, nilai);
    memori = undefined;
  } catch { memori = nilai; }
  kabari();
}

const teks = (v: unknown, maks = 200): v is string => typeof v === 'string' && v.length > 0 && v.length <= maks;

export function bacaSesi(kini: number = Date.now()): SesiAcara | null {
  const m = mentah();
  if (!m) return null;
  try {
    const s = JSON.parse(m) as Partial<SesiAcara> | null;
    if (!s || !teks(s.code, 16) || !teks(s.eventId) || !teks(s.participantId) || !teks(s.alias, 40) || !teks(s.credential, 256) || typeof s.expiresAt !== 'number') return null;
    if (s.expiresAt <= kini) { tulis(null); return null; }
    return { code: s.code, eventId: s.eventId, participantId: s.participantId, alias: s.alias, credential: s.credential, expiresAt: s.expiresAt,
      cases: Array.isArray(s.cases) ? s.cases.filter((c) => c && teks(c.caseId, 64) && typeof c.rubricVersion === 'number') : [],
      mulai: s.mulai === true, runs: s.runs && typeof s.runs === 'object' ? (s.runs as Record<string, RunAcara>) : {} };
  } catch { return null; }
}
export function simpanSesi(s: SesiAcara | null): void { tulis(s ? JSON.stringify(s) : null); }
/** Change the stored session (no-op when there is none). */
export function ubahSesi(f: (s: SesiAcara) => SesiAcara): SesiAcara | null {
  const s = bacaSesi();
  if (!s) return null;
  const baru = f(s);
  simpanSesi(baru);
  return baru;
}
export function ubahRun(caseId: string, f: (r: RunAcara | undefined) => RunAcara | undefined): void {
  ubahSesi((s) => {
    const runs = { ...s.runs };
    const r = f(runs[caseId]);
    if (r) runs[caseId] = r; else delete runs[caseId];
    return { ...s, runs };
  });
}
export function berlanggananSesi(f: () => void): () => void { pendengar.add(f); return () => { pendengar.delete(f); }; }
export const versiSesi = (): number => versi;

/** The guest chose "Main sendiri" for this code in this tab: the choice sheet does not open again by itself. */
export function sudahPilihSendiri(kode: string): boolean {
  try { return window.sessionStorage.getItem(KUNCI_SENDIRI) === kode; } catch { return false; }
}
export function catatPilihSendiri(kode: string | null): void {
  try { if (kode) window.sessionStorage.setItem(KUNCI_SENDIRI, kode); else window.sessionStorage.removeItem(KUNCI_SENDIRI); } catch { /* blocked: asked again after a reload */ }
  kabari();
}

/** Random command id (16 random bytes; allowed alphabet of the contract). */
export function idPerintah(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return 'c_' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
