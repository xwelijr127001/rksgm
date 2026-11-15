/**
 * The one compact answer timer of a round. The decision tray shows it next to the confirm button; while an evidence
 * sheet covers the screen during answering, the sheet shows the same countdown (read from AnswerClockContext, which
 * only the participant page provides) so reading a document never hides the time left.
 */
import { createContext, useContext } from 'react';
import { t } from '../../i18n';
import { useServerCountdown } from '../ui/countdown';

export interface AnswerClock {
  endsAt: number | null;
  durationMs: number | null;
  now: () => number;
}

/** The open answer window (participant page, answering phase only); null everywhere else. */
export const AnswerClockContext = createContext<AnswerClock | null>(null);

/**
 * Seconds left as a small pill with a bar; urgent in the last 5 s (marked "!" too, not colour only). `primary` marks the
 * round's single answer timer (`data-timer` test hook); the copy inside an open sheet is not primary.
 */
export function TimerPill({ seconds, ratio, primary }: { seconds: number | null; ratio: number | null; primary: boolean }) {
  if (seconds === null) return null;
  const urgent = seconds <= 5;
  return (
    <span className={`sr-waktu${urgent ? ' sr-waktu-urgent' : ''}`} role="timer" aria-label={t('ruang.layarTimerAria', { n: seconds })} data-timer={primary ? '' : undefined}>
      <span className="sr-waktu-angka" aria-hidden="true">
        {urgent ? '!' : ''}
        {seconds}
      </span>
      <span className="sr-waktu-satuan" aria-hidden="true">
        {t('ruang.dtk')}
      </span>
      {ratio !== null ? (
        <span className="sr-waktu-bar" aria-hidden="true">
          <i style={{ width: `${ratio * 100}%` }} />
        </span>
      ) : null}
    </span>
  );
}

/** The answer countdown inside an open sheet, when the page provides the clock. */
export function SheetClock() {
  const clock = useContext(AnswerClockContext);
  return clock ? <ClockPill clock={clock} /> : null;
}

function ClockPill({ clock }: { clock: AnswerClock }) {
  const { seconds, ratio } = useServerCountdown(clock.endsAt, clock.durationMs, clock.now);
  return <TimerPill seconds={seconds} ratio={ratio} primary={false} />;
}
