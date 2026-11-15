/**
 * Wording of delayed effects (a promise made earlier hitting a later round): the private reminder while the round is
 * played (a card, and one line under the round's question), the note in the outcome, and the causal notes of the final
 * summary. An unnamed flag reads as "keputusanmu di babak n"; an unknown source round as "sebelumnya".
 */
import type { StoryDelayedEffect } from '@shared/story/protocol';
import { t } from '../../i18n';
import { signedNumber } from '../view';
import type { CausalNote } from './roundModel';

/** What the delayed effect stands for: its label, else the decision that caused it. */
function causeOf(label: string, fromRound: number): string {
  if (label) return fromRound > 0 ? t('ruang.dampakSebab', { label, n: fromRound }) : t('ruang.dampakSebabTanpaBabak', { label });
  return fromRound > 0 ? t('ruang.dampakSebabBabak', { n: fromRound }) : t('ruang.dampakSebabUmum');
}

/** Reminder card while the round is played: "Pengingat: janji … (babak 12) · status −12". */
export function reminderText(r: StoryDelayedEffect): string {
  return r.delta ? t('ruang.pengingatIsi', { sebab: causeOf(r.label, r.fromRound), d: signedNumber(r.delta) }) : t('ruang.pengingatTanpaAngka', { sebab: causeOf(r.label, r.fromRound) });
}

/** The same reminder as one line under the round's question, the change first ("status −12 karena janji … (babak 12)"). */
export function reminderLine(r: StoryDelayedEffect): string {
  return r.delta ? t('ruang.pengingatRingkas', { sebab: causeOf(r.label, r.fromRound), d: signedNumber(r.delta) }) : t('ruang.pengingatTanpaAngka', { sebab: causeOf(r.label, r.fromRound) });
}

/** Note in the outcome: the round began with this effect. */
export function delayedText(e: StoryDelayedEffect): string {
  return e.delta ? t('ruang.dampakAwal', { sebab: causeOf(e.label, e.fromRound), d: signedNumber(e.delta) }) : t('ruang.dampakAwalNol', { sebab: causeOf(e.label, e.fromRound) });
}

/** Final summary: a flag left by a choice and where it showed (also when the ending is good). */
export function causalText(n: CausalNote): string {
  const sebab = causeOf(n.label, n.setRound);
  if (n.effectRound === null) return t('ruang.jejakBelum', { sebab });
  if (n.delta === null || n.delta === 0) return t('ruang.jejakBaris', { sebab, m: n.effectRound });
  return t('ruang.jejakDampak', { sebab, m: n.effectRound, d: signedNumber(n.delta) });
}
