/**
 * "Audit pilihan" (gameplay brief §6): can a player find the recommended option by its length alone? Per round: words
 * and characters of every option and the length rank of the recommended one; per scenario: how far the blind
 * strategies "always the longest" / "always the shortest" get (ties shown as worst–best and expected value) and their
 * expected points under the active score policy, with the authoring warnings of the shared validator (length, and the
 * action form "Tindakan, bukan pesan" being set only on non-tepat options — it changes the confirm label and the sent
 * note, so it can become a cue). A design check, not statistical proof that a round is free of bias. Numbers come from
 * shared/story/audit (the private audit script uses the same functions).
 */
import { useId, useMemo } from 'react';
import { AUTHORING_HINTS, auditOptions, auditRound, type RoundAudit, type StrategyResult } from '@shared/story/audit';
import { STORY_ROUND_COUNT, contentText, textKey, type ContentLocale, type ScenarioContent } from '@shared/story/content';
import type { ContentIssue } from '@shared/story/validate';
import { CLASSIFICATION_LABEL } from '../labels';
import type { EditorProps } from './fields';

/** Owner's acceptance bound: neither blind strategy reaches more than 5 of the 15 recommended options. */
const BLIND_STRATEGY_MAX = 5;
/** Answer time the expected points assume (auditOptions' default: half of the 30 s window). */
const AUDIT_ELAPSED_S = 15;
/** Validation warnings that belong to the option audit. */
const AUDIT_CODES: ReadonlySet<string> = new Set(['choice_long', 'choice_length_hint', 'lesson_long', 'choice_form_hint']);

const num = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });

/** The recommended option is the ONE longest option of its round (a tie at the top gives nothing away by itself). */
function longestTell(a: RoundAudit): boolean {
  return a.recommendedIsLongest && !a.tieAtTop;
}

/** One-line verdict on where the recommended option ranks by length. */
export function lengthVerdict(a: RoundAudit): string {
  const n = a.options.length;
  if (a.recommendedRank === 0) return 'belum ada pilihan tepat';
  if (a.recommendedIsLongest) return a.tieAtTop ? 'pilihan tepat seri terpanjang' : 'pilihan tepat paling panjang';
  if (a.recommendedIsShortest) return 'pilihan tepat paling pendek';
  return `pilihan tepat terpanjang ke-${a.recommendedRank} dari ${n}`;
}

/** "14/15 tepat" or, with ties, "12–14/15 tepat (harapan 13,3)". */
function tepatText(s: StrategyResult, rounds: number): string {
  if (s.tepatWorst === s.tepatBest) return `${s.tepatBest}/${rounds} tepat`;
  return `${s.tepatWorst}–${s.tepatBest}/${rounds} tepat (seri; harapan ${num(s.tepatExpected)})`;
}

/** The round editor's panel: the options of this round. */
export function RoundAuditPanel({ ed, index }: { ed: EditorProps; index: number }) {
  const r = ed.content.rounds[index];
  if (!r) return null;
  const audit = auditRound(ed.content, r, ed.locale);
  const warnings = ed.issues.filter((i) => i.round === index + 1 && AUDIT_CODES.has(i.code));
  const flagged = longestTell(audit) || warnings.length > 0;
  return (
    <details className="cms-audit" open={flagged}>
      <summary>
        Audit pilihan babak ini: {lengthVerdict(audit)}
        {warnings.length ? ` · ${warnings.length} saran` : ''}
      </summary>
      <div className="stf-gulir">
        <table className="stf-tabel">
          <thead>
            <tr>
              <th>Pilihan</th>
              <th>Kunci</th>
              <th className="angka">Kata</th>
              <th className="angka">Karakter</th>
              <th className="angka">Urutan panjang</th>
            </tr>
          </thead>
          <tbody>
            {audit.options.map((o, ci) => (
              <tr key={o.choiceId} className={o.classification === 'tepat' ? 'cms-audit-tepat' : undefined}>
                <td>{ci + 1}</td>
                <td>{CLASSIFICATION_LABEL[o.classification]}</td>
                <td className={`angka${o.words > AUTHORING_HINTS.choiceWordsMax ? ' cms-isu-peringatan' : ''}`}>{o.words}</td>
                <td className="angka">{o.chars}</td>
                <td className="angka">
                  {o.rankLongest}
                  {o.rankLongest === 1 ? ' (terpanjang)' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="stf-kecil">
        Target 8–16 kata per pilihan (paling banyak {AUTHORING_HINTS.choiceWordsMax}); panjang, bentuk, dan tingkat detail sebanding. Urutan panjang 1 = terpanjang (panjang sama berbagi urutan).
        {audit.tieAtTop ? ' Lebih dari satu pilihan sama-sama terpanjang.' : ''}
      </p>
      {warnings.length ? (
        <ul className="cms-isu-daftar">
          {warnings.map((w) => (
            <li key={`${w.code}-${w.field}`} className="cms-isu-peringatan">
              {w.message}
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

/** The whole scenario: the blind strategies and one row per round (click a row to open that round). */
export function ScenarioAuditPanel({ content, issues, locale, onOpenRound }: { content: ScenarioContent; issues: readonly ContentIssue[]; locale: ContentLocale; onOpenRound: (roundIndex: number) => void }) {
  const headingId = useId();
  const audit = useMemo(() => auditOptions(content, locale), [content, locale]);
  const rounds = content.rounds.length;
  if (rounds === 0) return null;
  const full = rounds === STORY_ROUND_COUNT;
  const verdict = (s: StrategyResult) => (s.tepatBest <= BLIND_STRATEGY_MAX ? `memenuhi target ≤ ${BLIND_STRATEGY_MAX}/${STORY_ROUND_COUNT}` : `di atas target ≤ ${BLIND_STRATEGY_MAX}/${STORY_ROUND_COUNT}`);
  const strategies: { label: string; s: StrategyResult }[] = [
    { label: 'Selalu pilih yang terpanjang', s: audit.longest },
    { label: 'Selalu pilih yang terpendek', s: audit.shortest },
  ];
  return (
    <section className="stf-kartu cms-audit-skenario" aria-labelledby={headingId}>
      <h2 id={headingId}>Audit pilihan</h2>
      <p className="stf-kecil">
        Seberapa jauh pemain bisa menebak pilihan tepat dari panjang teksnya saja. Target: kedua strategi buta paling banyak {BLIND_STRATEGY_MAX} dari {STORY_ROUND_COUNT} tepat. Bila beberapa pilihan sama panjang, hasilnya ditulis terburuk–terbaik dan nilai harapan. Ini pemeriksaan desain, bukan bukti statistik bahwa soal bebas bias.
      </p>
      <dl className="cms-strategi">
        {strategies.map(({ label, s }) => (
          <div key={label} className={full && s.tepatBest > BLIND_STRATEGY_MAX ? 'cms-strategi-lewat' : undefined}>
            <dt>{label}</dt>
            <dd>
              <b>{tepatText(s, rounds)}</b>
              <span>
                ≈ {num(s.expectedPoints)} poin harapan (jawab di detik ke-{AUDIT_ELAPSED_S}, bobot kurang tepat ikut dihitung)
              </span>
              <span>
                {full ? `${s.tepatBest <= BLIND_STRATEGY_MAX ? '✓' : '✕'} ${verdict(s)}${s.tepatWorst !== s.tepatBest ? ' (dinilai dari hasil terbaik saat seri)' : ''}` : `Target berlaku setelah ${STORY_ROUND_COUNT} babak lengkap.`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="stf-gulir">
        <table className="stf-tabel cms-audit-tabel">
          <thead>
            <tr>
              <th>Babak</th>
              <th>Pilihan tepat menurut panjang</th>
              <th className="angka">Kata (min–maks)</th>
              <th className="angka">Saran</th>
            </tr>
          </thead>
          <tbody>
            {audit.rounds.map((a, i) => {
              const words = a.options.map((o) => o.words);
              const hints = issues.filter((x) => x.round === i + 1 && AUDIT_CODES.has(x.code)).length;
              const title = contentText(content, locale, textKey.roundTitle(a.roundId)) || 'Tanpa judul';
              return (
                <tr key={a.roundId}>
                  <td>
                    <button type="button" className="cms-tautan" onClick={() => onOpenRound(i)}>
                      {i + 1}. {title}
                    </button>
                  </td>
                  <td className={longestTell(a) ? 'cms-isu-peringatan' : undefined}>{lengthVerdict(a)}</td>
                  <td className="angka">{words.length ? `${Math.min(...words)}–${Math.max(...words)}` : '—'}</td>
                  <td className="angka">{hints || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
