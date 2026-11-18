/**
 * Presentation pieces shared by the participant room, the projector and the host console. They render server data
 * only (no scoring or timing decisions); countdowns read the estimated SERVER clock passed in by the page.
 */
import type { ReactNode } from 'react';
import { MOOD_BANDS, type MoodBand } from '@shared/story/content';
import type { StoryConsequenceView, StoryDecisionSummary, StoryFinalSummary, StoryRankRow, StoryScoreView } from '@shared/story/protocol';
import { STORY_SCORE_POLICY } from '@shared/story/scorePolicy';
import { PotretNasabah } from '../../cerita/seni';
import { PotretMissRaksa } from '../../cerita/seni/tokoh/PotretMissRaksa';
import { t } from '../../i18n';
import { AvatarPiksel } from '../../art/AvatarPiksel';
import { causalText, delayedText } from '../round/notes';
import { pixelExpression } from '../stage/StoryStage';
import { signedNumber } from '../view';
import { KeyRoundBadge, moodLabel, OutcomeBadge } from './badges';
import { useServerCountdown } from './countdown';

/** Built-in pixel characters (asset ids seeded by the server). */
export const BUILTIN_CUSTOMER = 'builtin:char:bu-rina';
export const BUILTIN_MENTOR = 'builtin:char:miss-raksa';

/** Visible answer timer (staff review #11–#14): seconds + bar; urgent styling in the last 5 s (not color only). */
export function AnswerTimer({ endsAt, durationMs, now, size = 'normal' }: { endsAt: number | null; durationMs: number | null; now: () => number; size?: 'normal' | 'big' }) {
  const { seconds, ratio } = useServerCountdown(endsAt, durationMs, now);
  if (seconds === null) return null;
  const urgent = seconds <= 5;
  return (
    <div className={`sr-timer sr-timer-${size}${urgent ? ' sr-timer-urgent' : ''}`} role="timer" aria-label={t('ruang.layarTimerAria', { n: seconds })}>
      <span className="sr-timer-angka" aria-hidden="true">
        {urgent ? '! ' : ''}
        {seconds}
      </span>
      <span className="sr-timer-teks" aria-hidden="true">{t('ruang.sisaWaktu')}</span>
      {ratio !== null ? (
        <span className="sr-timer-bar" aria-hidden="true">
          <i style={{ width: `${ratio * 100}%` }} />
        </span>
      ) : null}
    </div>
  );
}

export function PhaseCountdown({ endsAt, durationMs, now, render }: { endsAt: number | null; durationMs: number | null; now: () => number; render: (seconds: number) => ReactNode }) {
  const { seconds } = useServerCountdown(endsAt, durationMs, now);
  return seconds === null ? null : <>{render(seconds)}</>;
}

/**
 * Kicker above a round title: an eyebrow (e.g. "BABAK 6 DARI 15"; the projector shows the round in its header), the
 * "Babak kunci" badge and the round's meta text (phase and time of day).
 */
export function SceneKicker({ eyebrow, meta, keyRound }: { eyebrow?: string; meta: string; keyRound: boolean }) {
  if (!eyebrow && !meta && !keyRound) return null;
  return (
    <div className="sr-kicker">
      {eyebrow || keyRound ? (
        <span className="sr-kicker-baris">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          {keyRound ? <KeyRoundBadge /> : null}
        </span>
      ) : null}
      {meta ? <span className="sr-meta">{meta}</span> : null}
    </div>
  );
}

/**
 * Customer mood: portrait (built-in customer only; none for a customer without a character) + band word + a compact
 * 5-step indicator (not a second score). With the scenario's own status words (`labels`) it is captioned "Status …".
 */
export function MoodView({
  band,
  expression,
  customerName,
  builtinCustomer,
  labels,
}: {
  band: MoodBand;
  expression: string;
  customerName: string;
  builtinCustomer: boolean;
  labels?: Record<MoodBand, string> | null;
}) {
  const index = MOOD_BANDS.indexOf(band);
  return (
    <div className="sr-mood">
      {builtinCustomer ? <PotretNasabah ekspresi={pixelExpression(expression)} ukuran={56} className="sr-mood-potret" /> : null}
      <div className="sr-mood-teks">
        <span className="sr-mood-nama">{labels ? t('ruang.statusNama', { nama: customerName }) : t('ruang.suasanaCustomer', { nama: customerName })}</span>
        <b className="sr-mood-band">{moodLabel(band, labels)}</b>
        <span className="sr-mood-skala" aria-hidden="true">
          {MOOD_BANDS.map((b, i) => (
            <i key={b} data-on={i <= index ? '' : undefined} />
          ))}
        </span>
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('id-ID');

/** 70:30 breakdown of one round (staff review #16). */
export function ScoreBreakdown({ score }: { score: StoryScoreView }) {
  return (
    <dl className="sr-nilai">
      <div>
        <dt>{t('ruang.nilaiAkurasi')}</dt>
        <dd>{fmt(score.accuracyPoints)}</dd>
      </div>
      <div>
        <dt>{t('ruang.nilaiKecepatan')}</dt>
        <dd>{fmt(score.speedPoints)}</dd>
      </div>
      <div className="sr-nilai-total">
        <dt>{t('ruang.nilaiTotal')}</dt>
        <dd>{fmt(score.roundScore)}</dd>
      </div>
    </dl>
  );
}

/** Id of the score policy before v2 (scorePolicy.ts header): stored results keep it and are explained with its rule. */
const PREVIOUS_POLICY_ID = 'story-70-30-v1';

/**
 * How a result's points were computed, for the policy the result was stored with (results are never recalculated):
 * the current policy's examples, the previous policy's rule, or only the policy id for any other.
 */
export function ScoreExplainer({ policyId }: { policyId: string }) {
  const text = policyId === STORY_SCORE_POLICY.id ? t('ruang.caraNilaiIsi') : policyId === PREVIOUS_POLICY_ID ? t('ruang.caraNilaiIsiLama') : '';
  return (
    <details className="sr-penjelasan">
      <summary>{t('ruang.caraNilaiJudul')}</summary>
      {text ? <p>{text}</p> : null}
      <p className="sr-kecil">{t('ruang.kebijakanNilai', { id: policyId })}</p>
    </details>
  );
}

/** A decision's consequence in the final list: own choice, the reply, what happened, why, the recommendation. */
function ConsequenceBody({ view }: { view: StoryConsequenceView }) {
  return (
    <div className="sr-konsekuensi-isi">
      <p className="sr-pilihanmu">
        <span>{t('ruang.pilihanmu')}:</span> {view.chosenText ?? <i>{t('ruang.tanpaJawaban')}</i>}
      </p>
      {view.reply ? (
        <figure className="sr-hasil-balasan">
          <blockquote>{view.reply}</blockquote>
          {view.respondentName ? <figcaption>— {view.respondentName}</figcaption> : null}
        </figure>
      ) : null}
      <p className="sr-akibat">{view.consequence}</p>
      {view.reason ? (
        <p className="sr-alasan">
          <b>{t('ruang.alasan')}:</b> {view.reason}
        </p>
      ) : null}
      {view.outcome !== 'tepat' && view.recommended.length ? (
        <div className="sr-dianjurkan">
          <b>{t('ruang.dianjurkan')}:</b>
          <ul>
            {view.recommended.map((r) => (
              <li key={r.text}>
                {r.text}
                {r.reason ? <span className="sr-kecil"> — {r.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function RankList({ rows, highlightId, limit = 10 }: { rows: StoryRankRow[]; highlightId?: string | null; limit?: number }) {
  const shown = rows.slice(0, limit);
  const mine = highlightId ? rows.find((r) => r.participantId === highlightId) : undefined;
  const mineHidden = mine && !shown.includes(mine);
  const row = (r: StoryRankRow) => (
    <li key={r.participantId} className={`sr-peringkat-baris${r.participantId === highlightId ? ' saya' : ''}${r.rank <= 3 ? ` r${r.rank}` : ''}`}>
      <span className="sr-peringkat-no">{r.rank}</span>
      {/* T-052: the participant's character (pixel portrait) next to the name when their device sent one. */}
      {r.look ? <AvatarPiksel look={r.look} ukuran={32} className="sr-peringkat-avatar" /> : null}
      <span className="sr-peringkat-nama">
        {r.name}
        {r.participantId === highlightId ? <span className="sr-kecil"> {t('ruang.kamu')}</span> : null}
        {r.tied ? <span className="sr-kecil"> · {t('ruang.seri')}</span> : null}
      </span>
      <span className="sr-peringkat-poin">{fmt(r.totalScore)}</span>
    </li>
  );
  return (
    <ol className="sr-peringkat">
      {shown.map(row)}
      {mineHidden && mine ? row(mine) : null}
      {rows.length > shown.length + (mineHidden ? 1 : 0) ? <li className="sr-peringkat-lain">{t('ruang.lainnya', { n: rows.length - shown.length - (mineHidden ? 1 : 0) })}</li> : null}
    </ol>
  );
}

/** The round's mentor reason in the final summary, labelled "Alasan dari <officer name>"; nothing when the round has none. */
function MentorReason({ text, mentorName }: { text: string; mentorName?: string | null }) {
  if (!text) return null;
  return (
    <div className="sr-alasan-mentor">
      <b>{mentorName ? t('ruang.alasanMentor', { nama: mentorName }) : t('ruang.alasanMentorUmum')}</b>
      <p>{text}</p>
    </div>
  );
}

/**
 * One of the 15 decisions in the final summary (progressive disclosure: collapsed by default). `mentorName` attributes
 * the round's mentor reason (the scenario's officer name); without it the reason is labelled generically. Causal notes
 * appear at the round whose choice left a flag and at the round where it took effect.
 */
export function DecisionItem({ d, mentorName }: { d: StoryDecisionSummary; mentorName?: string | null }) {
  const delayed = d.delayed.filter((e) => e.delta !== 0);
  return (
    <details className={`sr-keputusan sr-keputusan-${d.outcome}`}>
      <summary>
        <span className="sr-keputusan-judul">{t('ruang.keputusanBabak', { n: d.roundNumber, judul: d.title })}</span>
        <span className="sr-keputusan-ringkas">
          <OutcomeBadge outcome={d.outcome} /> <span className="sr-keputusan-poin">{t('ruang.poin', { n: fmt(d.score.roundScore) })}</span>
        </span>
      </summary>
      <p className="sr-kecil">{d.prompt}</p>
      <ConsequenceBody view={d} />
      <MentorReason text={d.mentorReason} mentorName={mentorName} />
      {d.flagSet ? <p className="sr-dampak">{causalText({ setRound: d.roundNumber, label: d.flagSet.label, effectRound: d.flagSet.effectRound, delta: d.flagSet.delta })}</p> : null}
      {delayed.length ? (
        delayed.map((e, i) => (
          <p key={i} className="sr-dampak">
            {delayedText(e)}
          </p>
        ))
      ) : d.delayedDelta ? (
        <p className="sr-dampak">{t('ruang.dampakTertundaRingkas', { n: signedNumber(d.delayedDelta) })}</p>
      ) : null}
      <ScoreBreakdown score={d.score} />
      {d.score.elapsedMs !== null ? <p className="sr-kecil">{t('ruang.detikKe', { n: (d.score.elapsedMs / 1000).toFixed(1) })}</p> : null}
    </details>
  );
}

/**
 * Ending of a final summary below its title: kind badge (left out when it would repeat the title word for word, e.g.
 * an ending titled "Kurang puas"), the ending text, then the customer's and the mentor's closing words, each
 * attributed by name (Miss Raksa's portrait beside the mentor's words when `mentorPortrait`).
 */
export function EndingView({
  ending,
  customerName,
  mentorName,
  mentorPortrait = false,
}: {
  ending: NonNullable<StoryFinalSummary['ending']>;
  customerName: string;
  mentorName: string;
  mentorPortrait?: boolean;
}) {
  const kind = t(`ruang.akhir.${ending.kind}`);
  const sameAsTitle = kind.toLocaleLowerCase('id') === ending.title.trim().toLocaleLowerCase('id');
  return (
    <div className="sr-akhir">
      {sameAsTitle ? null : <span className={`sr-tanda-akhir sr-tanda-akhir-${ending.kind}`}>{kind}</span>}
      {ending.text ? <p className="sr-akhir-teks">{ending.text}</p> : null}
      {ending.customer ? (
        <figure className="sr-kutipan sr-kutipan-customer">
          <blockquote>{ending.customer}</blockquote>
          <figcaption>— {customerName}</figcaption>
        </figure>
      ) : null}
      {ending.mentor ? (
        <figure className="sr-kutipan sr-kutipan-mentor">
          {mentorPortrait ? <PotretMissRaksa ukuran={48} className="sr-kutipan-potret" /> : null}
          <div className="sr-kutipan-isi">
            <blockquote>{ending.mentor}</blockquote>
            <figcaption>— {mentorName}</figcaption>
          </div>
        </figure>
      ) : null}
    </div>
  );
}
