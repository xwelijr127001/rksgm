/**
 * Per-participant option presentation (PRD FR-C8, appendix A "Urutan tampil kelima pilihan berbeda antar peserta").
 *
 * - Order: deterministic shuffle keyed by HMAC(roomSecret, participant|round|choice). Stable across refresh/reconnect
 *   for the same participant and round; independent between participants. Globally unique permutations are NOT
 *   promised (only 120 orders exist for five options).
 * - Handles: opaque per-participant tokens so the client never sees content choice IDs; grading maps the handle back
 *   to the choice ID on the server.
 */
import { createHmac } from 'node:crypto';
import type { ChoiceContent } from '../../../../shared/story/content';

function mac(secret: Buffer, ...parts: string[]): Buffer {
  return createHmac('sha256', secret).update(parts.join('|')).digest();
}

export interface PresentedOption {
  handle: string;
  choiceId: string;
}

export function presentOptions(secret: Buffer, participantId: string, roundId: string, choices: readonly ChoiceContent[]): PresentedOption[] {
  return choices
    .map((c) => ({
      choiceId: c.id,
      order: mac(secret, 'order', participantId, roundId, c.id),
      handle: mac(secret, 'handle', participantId, roundId, c.id).subarray(0, 9).toString('base64url'),
    }))
    .sort((a, b) => Buffer.compare(a.order, b.order))
    .map(({ handle, choiceId }) => ({ handle, choiceId }));
}

/** The option a participant's handle names (its handle and choice ID), or null for forged/stale handles. */
export function optionForHandle(secret: Buffer, participantId: string, roundId: string, choices: readonly ChoiceContent[], handle: unknown): PresentedOption | null {
  if (typeof handle !== 'string' || handle.length === 0 || handle.length > 32) return null;
  return presentOptions(secret, participantId, roundId, choices).find((o) => o.handle === handle) ?? null;
}

/** Choice ID behind a participant's handle, or null for forged/stale handles. */
export function choiceForHandle(secret: Buffer, participantId: string, roundId: string, choices: readonly ChoiceContent[], handle: unknown): string | null {
  return optionForHandle(secret, participantId, roundId, choices, handle)?.choiceId ?? null;
}
