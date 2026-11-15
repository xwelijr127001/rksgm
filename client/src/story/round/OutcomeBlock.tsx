/**
 * The world's reaction to the participant's OWN decision, shown only once the answers are closed, story first and
 * grading after: what was done, the respondent's reply and what happened, then one short lesson, then delayed effects
 * that hit this round as it began, the outcome badge with the customer's status since then (a change of band, or a
 * trend within it) and the recommended option when the own choice was not tepat. The round's points follow outside this
 * block, as the last and quietest line. In a chat the thread continues: a sent message as the own bubble, an action
 * without a message as a note ("Kamu: …", ✓ Ditetapkan), then the reply bubble and the outcome note; the other
 * activities show a result card.
 */
import { useId, type JSX } from 'react';
import type { MoodBand, RoundLayout } from '@shared/story/content';
import type { StoryConsequenceView } from '@shared/story/protocol';
import { t } from '../../i18n';
import { signedNumber } from '../view';
import { moodLabel, OutcomeBadge } from '../ui/badges';
import { delayedText } from './notes';
import { useDecisionShown } from './roundContext';
import { statusChangeOf } from './roundModel';

interface OutcomeProps {
  outcome: StoryConsequenceView;
  layout: RoundLayout;
  officerName: string | null;
  moodLabels: Record<MoodBand, string> | null;
}

export function OutcomeBlock(p: OutcomeProps): JSX.Element {
  useDecisionShown();
  return p.layout === 'chat' ? <ChatOutcome {...p} /> : <ResultCard {...p} />;
}

function ChatOutcome(p: OutcomeProps) {
  const o = p.outcome;
  return (
    <div className="sr-hasil-blok sr-hasil-blok-chat" data-hasil="">
      <ol className="sr-chat-isi sr-hasil-utas" aria-label={t('ruang.hasilJudul')}>
        <OwnTurn outcome={o} />
        {o.reply ? (
          <li className="sr-chat-baris sr-chat-masuk">
            <span className="sr-chat-gelembung">
              {o.respondentName ? <span className="sr-only">{o.respondentName}: </span> : null}
              <span className="sr-chat-teks">{o.reply}</span>
            </span>
          </li>
        ) : null}
        {o.consequence ? (
          <li className="sr-chat-catatan">
            <span>{o.consequence}</span>
          </li>
        ) : null}
      </ol>
      <Assessment {...p} />
    </div>
  );
}

/** The own turn in the thread: the sent message as a bubble, an action as a note, or the note that nothing was sent. */
function OwnTurn({ outcome: o }: { outcome: StoryConsequenceView }) {
  if (o.chosenText === null) {
    return (
      <li className="sr-chat-catatan">
        <span>{t('ruang.tidakSempat')}</span>
      </li>
    );
  }
  if (o.chosenForm === 'action') {
    return (
      <li className="sr-terkirim-catatan">
        <div className="sr-chat-catatan">
          <span>{t('ruang.terkirimTindakan', { teks: o.chosenText })}</span>
        </div>
        <span className="sr-chat-status">
          <span aria-hidden="true">✓</span> {t('ruang.ditetapkan')}
        </span>
      </li>
    );
  }
  return (
    <li className="sr-chat-baris sr-chat-keluar">
      <span className="sr-chat-gelembung">
        <span className="sr-chat-teks">{o.chosenText}</span>
        <span className="sr-chat-status">
          <span aria-hidden="true">✓✓</span> {t('ruang.terkirim')}
        </span>
      </span>
    </li>
  );
}

function ResultCard(p: OutcomeProps) {
  const o = p.outcome;
  const id = useId();
  return (
    <section className={`sr-hasil-blok sr-hasil-blok-kartu sr-hasil-blok-${o.outcome}`} data-hasil="" aria-labelledby={id}>
      <h2 id={id} className="sr-hasil-judul">
        {t('ruang.hasilJudul')}
      </h2>
      <p className="sr-hasil-pilihan">
        <span className="sr-hasil-label">{t('ruang.pilihanmu')}</span> {o.chosenText ?? <i>{t('ruang.tanpaJawaban')}</i>}
      </p>
      {o.reply ? (
        <figure className="sr-hasil-balasan">
          <blockquote>{o.reply}</blockquote>
          {o.respondentName ? <figcaption>— {o.respondentName}</figcaption> : null}
        </figure>
      ) : null}
      {o.consequence ? <p className="sr-hasil-akibat">{o.consequence}</p> : null}
      <Assessment {...p} />
    </section>
  );
}

/**
 * The lesson, then the grading: delayed effects that hit the round as it began, the badge with the status change
 * since then (so "−12 at the start" reads before "slightly better" after the own decision), and the recommendation.
 */
function Assessment({ outcome: o, officerName, moodLabels }: OutcomeProps) {
  const delayed = o.delayed.filter((e) => e.delta !== 0);
  // Without a lesson (older content) the choice's own reason explains the result.
  const explanation = o.lesson || o.reason;
  return (
    <div className="sr-hasil-nilai">
      {explanation ? (
        <div className="sr-pelajaran">
          <b>{o.lesson ? (officerName ? t('ruang.pelajaranDari', { nama: officerName }) : t('ruang.pelajaran')) : t('ruang.alasan')}</b>
          <p>{explanation}</p>
        </div>
      ) : null}
      {delayed.length
        ? delayed.map((e, i) => (
            <p key={i} className="sr-dampak">
              {delayedText(e)}
            </p>
          ))
        : o.delayedDelta
          ? <p className="sr-dampak">{t('ruang.dampakTertunda', { n: signedNumber(o.delayedDelta) })}</p>
          : null}
      <p className="sr-hasil-ringkas">
        <OutcomeBadge outcome={o.outcome} />
        <StatusLine outcome={o} moodLabels={moodLabels} />
      </p>
      {o.outcome !== 'tepat' && o.recommended.length ? (
        <div className="sr-dianjurkan">
          <b>{t('ruang.dianjurkan')}</b>
          <ul>
            {o.recommended.map((r) => (
              <li key={r.text}>{r.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** "Status: Cemas → Tenang", "Status: Cemas, sedikit membaik ↗" (arrows decorative, the words carry it), or "Status tetap: Cemas". */
function StatusLine({ outcome, moodLabels }: { outcome: StoryConsequenceView; moodLabels: Record<MoodBand, string> | null }) {
  const change = statusChangeOf(outcome);
  if (change.kind === 'band') return <span className="sr-hasil-status">{t('ruang.statusBerubah', { dari: moodLabel(change.from, moodLabels), ke: moodLabel(change.to, moodLabels) })}</span>;
  if (change.kind === 'same') return <span className="sr-hasil-status">{t('ruang.statusTetap', { kata: moodLabel(change.band, moodLabels) })}</span>;
  const up = change.direction === 'up';
  return (
    <span className="sr-hasil-status">
      {t(up ? 'ruang.statusMembaik' : 'ruang.statusMenurun', { kata: moodLabel(change.band, moodLabels) })}{' '}
      <span className={up ? 'sr-hasil-tren-naik' : 'sr-hasil-tren-turun'} aria-hidden="true">
        {up ? '↗' : '↘'}
      </span>
    </span>
  );
}
