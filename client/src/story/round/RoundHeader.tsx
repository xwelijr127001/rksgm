/**
 * Head of a round: "Babak n/15 · meta · ★ Babak kunci", the title, during the reading the task in one line ("Tugas: …",
 * so the player knows what is asked before reading on; once the options open the question heads them instead), and
 * the ONE status chip of the customer (`data-suasana`). In a round hit by a delayed effect the chip shows that change
 * ("Puas · −12", and "Percaya → Tenang" when it changed the band). The answer timer is not here: it sits with the
 * confirm button in the decision tray, so there is only one.
 */
import type { StoryScenePublic } from '@shared/story/protocol';
import { t } from '../../i18n';
import { KeyRoundBadge } from '../ui/badges';
import { signedNumber } from '../view';
import type { RoundMood } from './roundModel';

export function RoundHeader({
  scene,
  totalRounds,
  mood,
  customerName,
  task = '',
  level = 1,
}: {
  scene: Pick<StoryScenePublic, 'roundNumber' | 'title' | 'meta' | 'keyRound'>;
  totalRounds: number;
  mood: RoundMood | null;
  /** Whose status the chip shows (the scenario's customer name). */
  customerName: string;
  /** The round's question during the reading ('' = no task line: answering, where it heads the options, or after close). */
  task?: string;
  /** Heading level of the title (1 on the room page; lower when embedded, e.g. the CMS preview). */
  level?: 1 | 2 | 3;
}) {
  const Title = `h${level}` as const;
  return (
    <header className="sr-ronde-kepala">
      <p className="sr-ronde-kicker">
        <span className="sr-ronde-babak">{t('ruang.babakDari', { n: scene.roundNumber, total: totalRounds })}</span>
        {scene.meta ? <span className="sr-ronde-meta">{scene.meta}</span> : null}
        {scene.keyRound ? <KeyRoundBadge /> : null}
      </p>
      <Title className="sr-ronde-judul">{scene.title}</Title>
      {task ? (
        <p className="sr-ronde-tugas">
          <b>{t('ruang.tugas')}</b> {task}
        </p>
      ) : null}
      {mood ? <MoodChip mood={mood} customerName={customerName} /> : null}
    </header>
  );
}

/**
 * "Status Pak Joko: Cemas", "Status Pak Joko: Puas · −12" in a round hit by a delayed effect, or "Status Pak Joko:
 * Percaya → Tenang · −12" when the effect changed the band (words and signs, not colour only).
 */
function MoodChip({ mood, customerName }: { mood: RoundMood; customerName: string }) {
  return (
    <p className={`sr-suasana sr-suasana-${mood.band}`} data-suasana={mood.band}>
      <span className="sr-suasana-titik" aria-hidden="true" />
      <span className="sr-suasana-nama">{t('ruang.statusNama', { nama: customerName })}:</span>
      <b className="sr-suasana-kata">
        {mood.changedFrom ? (
          <>
            {mood.changedFrom} <span aria-hidden="true">→</span>
            <span className="sr-only"> {t('ruang.menjadi')}</span> {mood.label}
          </>
        ) : (
          mood.label
        )}
      </b>
      {mood.delayedDelta ? (
        <span className="sr-suasana-dampak">
          <span aria-hidden="true">· </span>
          <span className="sr-only">{t('ruang.dampakSingkat')} </span>
          {signedNumber(mood.delayedDelta)}
        </span>
      ) : null}
    </p>
  );
}
