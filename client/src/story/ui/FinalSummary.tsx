/**
 * Personal final summary of a Story Room (live room or a result reopened after the room left memory): ending with the
 * customer's and the mentor's words, total score with the explainer of the policy the result was stored with, final
 * status, the delayed effects of the participant's own choices (also when the ending is good), the final ranking and
 * all decisions. Names and status words come from the summary's stored labels (see view.summaryNamesOf).
 */
import { Link } from 'react-router-dom';
import type { StoryFinalSummary, StoryPublicState } from '@shared/story/protocol';
import { STORY_MAX_SESSION_SCORE } from '@shared/story/scorePolicy';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import { Memuat } from '../../ui/kit';
import { causalText } from '../round/notes';
import { causalNotesOf } from '../round/roundModel';
import { summaryNamesOf } from '../view';
import { BUILTIN_CUSTOMER, BUILTIN_MENTOR, DecisionItem, EndingView, MoodView, RankList, ScoreExplainer } from './parts';

const fmt = (n: number) => n.toLocaleString('id-ID');

function closedText(room: StoryPublicState | null): string {
  switch (room?.closedReason) {
    case 'server_restart':
      return t('ruang.dihentikanServer');
    case 'expired':
      return t('ruang.dihentikanOtomatis');
    case 'admin_closed':
      return t('ruang.dihentikanAdmin');
    default:
      return t('ruang.dihentikanHost');
  }
}

export function FinalSummary({ room, summary, participantId, expression }: { room: StoryPublicState | null; summary: StoryFinalSummary | null; participantId: string | null; expression: string }) {
  if (!summary) {
    return (
      <main className="result-focus">
        <Memuat teks={t('ruang.hasilMemuat')} />
      </main>
    );
  }
  const totals = summary.totals;
  const names = summaryNamesOf(summary.labels, room?.scenario ?? null);
  const customerName = names.customerName || t('ruang.customer');
  const notes = causalNotesOf(summary.decisions);
  return (
    <main className="sr-hasil-akhir">
      <span className="eyebrow">{summary.complete ? t('ruang.selesaiEyebrow') : t('ruang.dihentikanJudul').toUpperCase()}</span>
      {summary.ending ? (
        <>
          <h1>{summary.ending.title}</h1>
          <EndingView ending={summary.ending} customerName={customerName} mentorName={names.officerName || t('ruang.mentor')} mentorPortrait={names.officerCharacterId === BUILTIN_MENTOR} />
        </>
      ) : (
        <>
          <h1>{t('ruang.dihentikanJudul')}</h1>
          <p className="sr-lembut">{closedText(room)}</p>
        </>
      )}
      <section className="sr-kartu sr-total">
        <div className="sr-total-angka">
          <span className="sr-label">{t('ruang.totalNilai')}</span>
          <b>{fmt(totals.totalScore)}</b>
          <span className="sr-kecil">{t('ruang.dariMaks', { n: fmt(STORY_MAX_SESSION_SCORE) })}</span>
        </div>
        <dl className="sr-nilai">
          <div>
            <dt>{t('ruang.rincianAkurasi')}</dt>
            <dd>{fmt(totals.accuracyPoints)}</dd>
          </div>
          <div>
            <dt>{t('ruang.rincianKecepatan')}</dt>
            <dd>{fmt(totals.speedPoints)}</dd>
          </div>
        </dl>
        <p className="sr-kecil">
          {t('ruang.terjawab', { n: totals.answeredCount })} · {t('ruang.habisWaktu', { n: totals.timeoutCount })}
        </p>
        {summary.rank ? <p className="sr-peringkat-saya">{t('ruang.peringkatmu', { rank: summary.rank.rank, of: summary.rank.of })}</p> : null}
        <ScoreExplainer policyId={summary.scorePolicyId} />
      </section>
      {/* No status word when this result's scenario words are unknown: a default word could name a different band. */}
      {names.bandWordsKnown ? (
        <section className="sr-kartu">
          <MoodView band={summary.finalBand} expression={expression} customerName={customerName} builtinCustomer={room?.scenario.customerCharacterId === BUILTIN_CUSTOMER} labels={names.moodLabels} />
          <p className="sr-kecil">{t('ruang.suasanaCatatan')}</p>
        </section>
      ) : null}
      {notes.length ? (
        <section className="sr-kartu sr-jejak">
          <h2>{t('ruang.jejakJudul')}</h2>
          <ul>
            {notes.map((n) => (
              <li key={n.setRound}>{causalText(n)}</li>
            ))}
          </ul>
          <p className="sr-kecil">{t('ruang.jejakCatatan')}</p>
        </section>
      ) : null}
      {room?.rankings?.length ? (
        <section className="sr-kartu">
          <h2>{t('ruang.peringkatAkhir')}</h2>
          <RankList rows={room.rankings} highlightId={participantId} />
        </section>
      ) : null}
      <section className="sr-keputusan-daftar">
        <h2>{summary.complete ? t('ruang.keputusanJudul') : t('ruang.keputusanSebagian', { n: summary.decisions.length })}</h2>
        {summary.decisions.map((d) => (
          <DecisionItem key={d.roundId} d={d} mentorName={names.officerName} />
        ))}
      </section>
      <p className="sr-kecil">
        {summary.scenarioTitle} · {t('ruang.layarVersi', { n: summary.versionNo })} · {summary.roomCode}
      </p>
      <Link className="primary-action" to="/">
        {t('ruang.keBeranda')} <Arrow />
      </Link>
    </main>
  );
}
