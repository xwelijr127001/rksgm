/**
 * Pieces every activity uses: the props an activity receives, the decision area (the round's one question, a one-line
 * reminder for the holder of a delayed effect, and the page's decision slot), the round's public lesson on screens
 * without a private outcome, and the private reminders of delayed effects.
 */
import { useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { StoryPhase } from '@shared/story/protocol';
import { LESSON_PHASES } from '@shared/story/protocol';
import { gerakDikurangi } from '../../gerak';
import { t } from '../../i18n';
import { reminderLine, reminderText } from './notes';
import { DecisionShownContext, TrayDockContext } from './roundContext';
import { bringIntoViewDelta, clearOfBarDelta, isPlayPhase, type RoundView, type RoundViewMode } from './roundModel';

export interface ActivityProps {
  view: RoundView;
  mode: RoundViewMode;
  phase: StoryPhase;
  /** The page's decision slot (DecisionTray while playing, OutcomeBlock after close); ignored on the projector. */
  decision: ReactNode;
  /** Opens an evidence item in the sheet; null where nobody taps (projector). */
  onOpen: ((evidenceId: string) => void) | null;
  /** Opens the round's scene picture enlarged in the sheet (field); null where nobody taps (projector). */
  onZoom: (() => void) | null;
}

/** Live moves of a round after which the decision area holds what the participant must see next. */
function bringsIntoView(was: StoryPhase, phase: StoryPhase): boolean {
  return (was === 'scene' && phase === 'answering') || (was === 'answering' && phase === 'consequence');
}

/** Space kept between the decision area and the top of the screen or the sticky bar. */
const VIEW_GAP = 8;

/** Top of the page's sticky bar in viewport pixels, or the bottom of the screen when the dock holds none. */
function barTopOf(dock: HTMLElement | null): number {
  return dock?.firstElementChild ? Math.min(window.innerHeight, dock.getBoundingClientRect().top) : window.innerHeight;
}

function scrollByDelta(delta: number): void {
  if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: gerakDikurangi() ? 'auto' : 'smooth' });
}

/** Scrolls the decision area into view above the page's sticky bar, unless a sheet is open (the player is reading). */
function bringIntoView(area: HTMLElement, dock: HTMLElement | null): void {
  if (document.querySelector('dialog[open]')) return;
  const chosen = area.querySelector('[role="radio"][aria-checked="true"]')?.getBoundingClientRect() ?? null;
  scrollByDelta(bringIntoViewDelta({ area: area.getBoundingClientRect(), chosen, top: VIEW_GAP, bottom: barTopOf(dock) - VIEW_GAP }));
}

/** Moves what is on screen of the area up from under a bar that has just docked. */
function keepClearOfBar(area: HTMLElement, dock: HTMLElement | null): void {
  if (document.querySelector('dialog[open]')) return;
  scrollByDelta(clearOfBarDelta({ area: area.getBoundingClientRect(), barTop: barTopOf(dock) - VIEW_GAP, viewBottom: window.innerHeight }));
}

/**
 * The round's question and the decision slot under it. On a participant's device, when the options open or the own
 * outcome arrives, the area is brought into view once, measured when the slot shows that content (the options come
 * with the private snapshot, a moment after the public one) and clear of the sticky bar; the context stays just above.
 * When the leaderboard docks its line (own rank, next round) over the bottom of the screen, the outcome on screen moves
 * up by what the line covers, so its end stays readable. The holder of a delayed effect sees a one-line reminder under
 * the question, so it is on screen when the options open.
 */
export function DecisionArea({ view, mode, phase, decision }: ActivityProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dock = useContext(TrayDockContext);
  const previous = useRef(phase);
  const pending = useRef(false);
  // Layout effect: it runs before the slot's own effect that reports its content, also when both mount together; the
  // leaderboard's bar is rendered in the same commit as the phase, so it is measured here before it is painted.
  useLayoutEffect(() => {
    const was = previous.current;
    previous.current = phase;
    if (was === phase || mode !== 'participant') return;
    pending.current = bringsIntoView(was, phase);
    if (was === 'consequence' && phase === 'leaderboard' && ref.current) keepClearOfBar(ref.current, dock);
  }, [phase, mode, dock]);
  const shown = useCallback(() => {
    if (!pending.current || !ref.current) return;
    pending.current = false;
    bringIntoView(ref.current, dock);
  }, [dock]);
  const playing = isPlayPhase(phase);
  const slot = mode === 'projector' ? null : decision;
  const prompt = playing ? view.scene.prompt : '';
  const reminders = playing && mode !== 'projector' ? view.reminders : [];
  if (!prompt && !slot) return null;
  return (
    <div className="sr-area-keputusan" ref={ref}>
      {prompt ? <h2 className="sr-tugas">{prompt}</h2> : null}
      {reminders.map((r, i) => (
        <p key={i} className="sr-tugas-pengingat">
          <span className="sr-pengingat-ikon" aria-hidden="true">
            !
          </span>
          <span className="sr-tugas-pengingat-teks">
            <b>{t('ruang.pengingat')}</b> {reminderLine(r)}
          </span>
        </p>
      ))}
      <DecisionShownContext.Provider value={shown}>{slot}</DecisionShownContext.Provider>
    </div>
  );
}

/** The round's lesson once answers are closed, where no private outcome shows it (projector, a participant who sat out). */
export function PublicLesson({ view, phase }: Pick<ActivityProps, 'view' | 'phase'>) {
  if (view.outcome || !view.scene.lesson || !LESSON_PHASES.includes(phase)) return null;
  return (
    <div className="sr-pelajaran sr-pelajaran-umum">
      <b>{t('ruang.pelajaran')}</b>
      <p>{view.scene.lesson}</p>
    </div>
  );
}

/** Private reminders of a delayed effect hitting this round ("Pengingat: dampak … (babak 12): status −12"). */
export function Reminders({ reminders }: { reminders: RoundView['reminders'] }) {
  if (!reminders.length) return null;
  return (
    <div className="sr-pengingat-daftar">
      {reminders.map((r, i) => (
        <p key={i} className="sr-pengingat" data-pengingat="">
          <span className="sr-pengingat-ikon" aria-hidden="true">
            !
          </span>
          <span>
            <b>{t('ruang.pengingat')}</b> {reminderText(r)}
          </span>
        </p>
      ))}
    </div>
  );
}
