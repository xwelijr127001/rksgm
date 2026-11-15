/**
 * Whole-scenario preview (PRD FR-A8) with the SAME rules and the SAME round components as the live room: the shared
 * engine (decision, mood, flags and delayed effects, score, ending), the shared scene/summary builders, and the room's
 * RoundHeader / RoundActivity / DecisionTray / OutcomeBlock in mode 'preview' — chat thread, desk of documents, field
 * scene or classic stage, evidence sheets, private reminders, the outcome with reply and lesson. Personalized like a
 * participant's device: `{nama}` = the preview player name. Author-only facts (status numbers, flags held, the answer
 * key, points) sit outside the round. Runs entirely in this browser tab: no room is created and nothing is written to
 * the database or reports.
 */
import { useId, useMemo, useState } from 'react';
import { STORY_ROUND_COUNT, contentText, personalize, textKey, type MoodBand, type ScenarioContent } from '@shared/story/content';
import { moodBandOf, playThrough, recommendedChoices, selectEnding, totalsOf, type DecisionResult } from '@shared/story/engine';
import { NAME_MAX_CHARS } from '@shared/story/names';
import { ENDING_KIND_LABEL, type StoryPhase, type StoryScenarioLabel, type StoryScoreView } from '@shared/story/protocol';
import { participantSceneOf, scenarioLabelOf, scenePublicOf } from '@shared/story/scene';
import { STORY_SCORE_POLICY } from '@shared/story/scorePolicy';
import { buildSummary, consequenceViewOf } from '@shared/story/summary';
import { t } from '../../../i18n';
import { DecisionTray } from '../../../story/round/DecisionTray';
import { OutcomeBlock } from '../../../story/round/OutcomeBlock';
import { RoundActivity } from '../../../story/round/RoundActivity';
import { RoundHeader } from '../../../story/round/RoundHeader';
import { actionLabelOf, isPlayPhase, roundMoodOf, roundViewOf } from '../../../story/round/roundModel';
import type { RoomAssetMap } from '../../../story/stage/StoryStage';
import { moodLabel } from '../../../story/ui/badges';
import { BUILTIN_CUSTOMER, BUILTIN_MENTOR, DecisionItem, EndingView, MoodView, ScoreBreakdown } from '../../../story/ui/parts';
import { personalizeConsequence, personalizeLabel, personalizeLine, personalizeScene, personalizeSummary, signedNumber } from '../../../story/view';
import '../../../story/story.css';
import { CLASSIFICATION_LABEL, endingRuleLabel } from '../labels';
import type { EditorProps } from './fields';
import { autoDecisions, carriedState, decideNext } from './previewModel';

const DEFAULT_PLAYER = 'Andi';
/** Answer time used for the rounds answered automatically by "Lompat ke babak". */
const AUTO_ELAPSED_MS = 10_000;

/** Customer expression of a band; '' without a customer character (no portrait), as in the room. */
function expressionOf(c: ScenarioContent, band: MoodBand): string {
  return c.presentation.customerCharacterId ? c.presentation.moodExpressions[band] : '';
}

export function PreviewTab({ ed }: { ed: EditorProps }) {
  const id = useId();
  const c = ed.content;
  const assets: RoomAssetMap = useMemo(() => new Map(ed.assets.map((a) => [a.id, a])), [ed.assets]);
  const [playerName, setPlayerName] = useState(DEFAULT_PLAYER);
  // An empty name shows the neutral word of the shared screens (projector/host).
  const name = playerName.trim() || t('ruang.namaUmum');
  const label = useMemo(() => {
    const raw = scenarioLabelOf(c, 'id', {
      scenarioId: 'pratinjau',
      title: contentText(c, 'id', textKey.title()),
      versionNo: 0,
      categoryName: c.categoryId,
      contentKind: c.contentSource === 'demo' ? 'demo' : 'official',
    });
    return personalizeLabel({ ...raw, customerName: raw.customerName || t('ruang.customer') }, name);
  }, [c, name]);
  const [decisions, setDecisions] = useState<DecisionResult[]>([]);
  const [showing, setShowing] = useState<'scene' | 'consequence'>('scene');
  const [elapsedSec, setElapsedSec] = useState(10);
  const [showKey, setShowKey] = useState(false);
  const [jumpTarget, setJumpTarget] = useState(1);
  const index = showing === 'consequence' ? decisions.length - 1 : decisions.length;
  const round = c.rounds[index];
  const done = decisions.length >= c.rounds.length && showing === 'scene';
  const complete = c.rounds.length === STORY_ROUND_COUNT && c.endings.length > 0;

  const choose = (choiceId: string | null) => {
    if (!round) return;
    setDecisions(decideNext(c, decisions, choiceId, elapsedSec * 1000));
    setShowing('consequence');
  };
  const restart = () => {
    setDecisions([]);
    setShowing('scene');
  };
  /** In a consequence: choose this round again; in a scene: go back to the previous round's choice. */
  const back = () => {
    setDecisions(decisions.slice(0, -1));
    setShowing('scene');
  };
  const jump = () => {
    setDecisions(autoDecisions(c, Math.min(jumpTarget, c.rounds.length) - 1, AUTO_ELAPSED_MS));
    setShowing('scene');
  };

  if (c.rounds.length === 0) return <p className="stf-lembut">Belum ada babak untuk dipratinjau.</p>;

  return (
    <div className="cms-pratinjau">
      <div className="cms-pratinjau-kendali">
        <p className="stf-kecil">
          Pratinjau lokal dengan aturan dan tampilan yang sama dengan room (kegiatan chat/berkas/lapangan, berkas, status, tanda & efek tertunda, baris khusus, balasan, pelajaran, nilai 70:30, akhir). Anda bermain sebagai satu peserta; jawaban langsung ditutup setelah dikirim. Tidak membuat room dan tidak tercatat di laporan.
        </p>
        <div className="stf-isian cms-pratinjau-nama">
          <label htmlFor={id + 'nama'}>Nama pemain (pratinjau)</label>
          <input id={id + 'nama'} className="kolom" value={playerName} maxLength={NAME_MAX_CHARS} autoComplete="off" aria-describedby={id + 'nama-petunjuk'} onChange={(e) => setPlayerName(e.target.value)} />
          <small id={id + 'nama-petunjuk'}>
            Mengganti {'{nama}'} di semua teks. Kosongkan untuk melihat kata netral layar acara (“{t('ruang.namaUmum')}”).
          </small>
        </div>
        <label className="stf-centang">
          <input type="checkbox" checked={showKey} onChange={(e) => setShowKey(e.target.checked)} />
          <span>Tampilkan kunci pilihan (hanya di pratinjau)</span>
        </label>
        <label className="cms-slider">
          <span>Simulasi waktu jawab: {elapsedSec} detik</span>
          <input type="range" min={0} max={30} value={elapsedSec} onChange={(e) => setElapsedSec(Number(e.target.value))} />
        </label>
        <div className="cms-pratinjau-lompat">
          <label htmlFor={id + 'lompat'}>Lompat ke babak</label>
          <select id={id + 'lompat'} className="kolom" value={Math.min(jumpTarget, c.rounds.length)} aria-describedby={id + 'lompat-petunjuk'} onChange={(e) => setJumpTarget(Number(e.target.value))}>
            {c.rounds.map((r, i) => (
              <option key={r.id} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-netral btn-kecil" onClick={jump}>
            Lompat
          </button>
          <small id={id + 'lompat-petunjuk'}>Babak sebelumnya dijawab otomatis dengan pilihan dianjurkan (detik ke-10).</small>
        </div>
        <div className="stf-tombol">
          <button type="button" className="btn btn-netral btn-kecil" disabled={decisions.length === 0} onClick={back}>
            {showing === 'consequence' ? '↶ Pilih ulang babak ini' : '↶ Kembali ke babak sebelumnya'}
          </button>
          <button type="button" className="btn btn-netral btn-kecil" onClick={restart}>
            Ulangi dari babak 1
          </button>
        </div>
      </div>
      {done ? (
        complete ? (
          <PreviewSummary content={c} decisions={decisions} label={label} name={name} />
        ) : (
          <p className="stf-peringatan">Semua babak yang ada sudah dimainkan. Lengkapi {STORY_ROUND_COUNT} babak dan akhir cerita untuk melihat akhir.</p>
        )
      ) : round ? (
        <PreviewRound
          key={round.id}
          content={c}
          index={index}
          decisions={decisions}
          showing={showing}
          label={label}
          name={name}
          assets={assets}
          showKey={showKey}
          onChoose={choose}
          onNext={() => setShowing('scene')}
        />
      ) : null}
      {complete ? <PathCheck content={c} /> : null}
    </div>
  );
}

/**
 * One round as the participant's device shows it (the room's components, mode 'preview'): while choosing, the five
 * options in authored order with the round's confirm label; after "sending", the answers close at once and the outcome
 * takes the tray's place. Author-only facts sit around the round, never inside it.
 */
function PreviewRound({
  content,
  index,
  decisions,
  showing,
  label,
  name,
  assets,
  showKey,
  onChoose,
  onNext,
}: {
  content: ScenarioContent;
  index: number;
  decisions: readonly DecisionResult[];
  showing: 'scene' | 'consequence';
  label: StoryScenarioLabel;
  name: string;
  assets: RoomAssetMap;
  showKey: boolean;
  onChoose: (choiceId: string | null) => void;
  onNext: () => void;
}) {
  const round = content.rounds[index];
  const publicScene = scenePublicOf(content, index, 'id', showing === 'consequence' ? 'consequence' : 'answering');
  if (!round || !publicScene) return null;
  const phase: StoryPhase = showing === 'consequence' ? 'consequence' : 'answering';
  // The participant's state when the round begins: mood carried from the earlier rounds plus this round's delayed
  // effects, their own conditional lines and reminders (flags of the EARLIER decisions only).
  const carried = carriedState(content, decisions.slice(0, index));
  const own = participantSceneOf(content, index, carried.mood, carried.flags, 'id');
  const decision = phase === 'consequence' ? decisions[index] : undefined;
  const scene = personalizeScene(publicScene, name);
  const outcome = decision ? personalizeConsequence(consequenceViewOf(content, index, decision, 'id', carried.flags), name) : null;
  // As in the room (RoundScreen): reminders only while the round is played (the outcome then names the delayed effect),
  // and the status line of the round's start stays at the top of the thread through the consequence.
  const reminders = isPlayPhase(phase) ? own.flagReminders.map((r) => ({ ...r, label: personalize(r.label, name) })) : [];
  const view = roundViewOf({
    scene,
    flagLines: own.flagLines.map((l) => personalizeLine(l, name)),
    moodLine: own.moodVariantLine ? personalize(own.moodVariantLine, name) : null,
    mood: roundMoodOf({ phase, mood: own.mood, reminders, word: (b) => moodLabel(b, label.moodLabels) }),
    reminders,
    outcome,
    assets,
    stage: { scenario: label, customerExpression: expressionOf(content, decision ? moodBandOf(decision.moodAfter) : own.moodBand) },
  });
  const options = round.choices.map((ch) => ({ handle: ch.id, text: personalize(contentText(content, 'id', textKey.choiceText(round.id, ch.id)), name) || '(teks kosong)', form: ch.form }));
  const slot = outcome ? (
    <OutcomeBlock outcome={outcome} layout={scene.layout} officerName={label.officerName} moodLabels={label.moodLabels} />
  ) : (
    <DecisionTray
      options={options}
      layout={scene.layout}
      actionLabel={actionLabelOf(scene, t)}
      phase={phase}
      sentHandle={null}
      disabled={false}
      endsAt={null}
      durationMs={null}
      now={Date.now}
      onSubmit={(handle) => {
        onChoose(handle);
        return Promise.resolve({ ok: true });
      }}
    />
  );
  return (
    <div className="cms-pratinjau-babak">
      <p className="cms-pratinjau-info">
        Hanya di pratinjau: status {label.customerName} di awal babak {own.mood} ({moodLabel(own.moodBand, label.moodLabels)})
        {own.delayedDelta ? `, termasuk efek tertunda ${signedNumber(own.delayedDelta)}` : ''}
        {carried.flags.size ? ` · tanda yang dipegang: ${[...carried.flags].join(', ')}` : ''}
        {own.flagLines.length ? ` · ${own.flagLines.length} baris khusus pemegang tanda (tidak tampil di layar acara)` : ''}
        {own.moodVariantLine ? ` · baris pertama dialog = variasi kalimat untuk status “${moodLabel(own.moodBand, label.moodLabels)}” (hanya di HP peserta)` : ''}.
      </p>
      <div className="cms-pratinjau-panel">
        {/* No "Tugas" line, as in the room once the options are open: the preview starts there, the question heads them. */}
        <RoundHeader scene={scene} totalRounds={content.rounds.length} mood={view.mood} customerName={label.customerName} level={3} />
        <RoundActivity view={view} mode="preview" phase={phase} decision={slot} />
        {decision && outcome ? (
          <AuthorOutcome decision={decision} score={outcome.score} isLast={index + 1 >= content.rounds.length} onNext={onNext} />
        ) : (
          <div className="stf-tombol">
            <button type="button" className="btn btn-netral btn-kecil" onClick={() => onChoose(null)}>
              Simulasikan waktu habis
            </button>
          </div>
        )}
      </div>
      {showKey ? <AnswerKey content={content} index={index} name={name} /> : null}
    </div>
  );
}

/** Author-only numbers of a settled round (status change, points) and the way on. */
function AuthorOutcome({ decision, score, isLast, onNext }: { decision: DecisionResult; score: StoryScoreView; isLast: boolean; onNext: () => void }) {
  return (
    <div className="cms-pratinjau-konsekuensi">
      <p className="cms-pratinjau-info">
        Hanya di pratinjau: status {decision.moodBefore} → {decision.moodAfter} ({signedNumber(decision.moodDelta)})
        {decision.delayedDelta ? `; babak dimulai dengan efek tertunda ${signedNumber(decision.delayedDelta)}` : ''}.
      </p>
      <ScoreBreakdown score={score} />
      <button type="button" className="btn" onClick={onNext}>
        {isLast ? 'Lihat akhir cerita' : 'Babak berikutnya'}
      </button>
    </div>
  );
}

/** The round's answer key for the author (never part of the participant's screen): classification, weight, change, flag. */
function AnswerKey({ content, index, name }: { content: ScenarioContent; index: number; name: string }) {
  const round = content.rounds[index];
  if (!round) return null;
  return (
    <section className="cms-pratinjau-kunci" aria-label="Kunci pilihan (hanya pratinjau)">
      <h4>Kunci pilihan (hanya pratinjau)</h4>
      <div className="stf-gulir">
        <table className="stf-tabel">
          <thead>
            <tr>
              <th>Pilihan</th>
              <th>Klasifikasi</th>
              <th className="angka">Bobot</th>
              <th className="angka">Status</th>
              <th>Tanda</th>
            </tr>
          </thead>
          <tbody>
            {round.choices.map((ch, ci) => (
              <tr key={ch.id}>
                <td className="cms-pratinjau-kunci-teks">
                  {ci + 1}. {personalize(contentText(content, 'id', textKey.choiceText(round.id, ch.id)), name)}
                </td>
                <td>{CLASSIFICATION_LABEL[ch.classification]}</td>
                <td className="angka">{ch.accuracy}</td>
                <td className="angka">{signedNumber(ch.moodDelta)}</td>
                <td>{ch.setsFlag ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviewSummary({ content, decisions, label, name }: { content: ScenarioContent; decisions: DecisionResult[]; label: StoryScenarioLabel; name: string }) {
  const finalMood = decisions[decisions.length - 1]?.moodAfter ?? content.initialMood;
  const total = totalsOf(decisions).totalScore;
  const ending = selectEnding(content.endings, finalMood, total);
  const summary = personalizeSummary(
    buildSummary({
      content,
      decisions,
      endingId: ending.id,
      rank: null,
      complete: true,
      finalMood,
      scorePolicyId: STORY_SCORE_POLICY.id,
      scenarioTitle: label.title,
      versionNo: 0,
      roomCode: 'PRATINJAU',
      answerWindowMs: STORY_SCORE_POLICY.answerWindowMs,
    }),
    name,
  );
  const mentorName = label.officerName;
  return (
    <div className="cms-pratinjau-akhir">
      <span className="eyebrow">{t('ruang.selesaiEyebrow')}</span>
      <h3>{summary.ending?.title || '(akhir tanpa judul)'}</h3>
      {summary.ending ? <EndingView ending={summary.ending} customerName={label.customerName} mentorName={mentorName || t('ruang.mentor')} mentorPortrait={label.officerCharacterId === BUILTIN_MENTOR} /> : null}
      <p className="stf-kecil">
        <b>{ENDING_KIND_LABEL[ending.kind]}</b> (syarat: {endingRuleLabel(ending)}) · total {summary.totals.totalScore.toLocaleString('id-ID')} (ketepatan {summary.totals.accuracyPoints.toLocaleString('id-ID')}, kecepatan{' '}
        {summary.totals.speedPoints.toLocaleString('id-ID')}) · status akhir {finalMood}
      </p>
      <div className="sr-kartu">
        <MoodView band={summary.finalBand} expression={expressionOf(content, summary.finalBand)} customerName={label.customerName} builtinCustomer={label.customerCharacterId === BUILTIN_CUSTOMER} labels={label.moodLabels} />
      </div>
      <section className="sr-keputusan-daftar">
        <h4>{t('ruang.keputusanJudul')}</h4>
        {summary.decisions.map((d) => (
          <DecisionItem key={d.roundId} d={d} mentorName={mentorName} />
        ))}
      </section>
    </div>
  );
}

/** Representative full paths: every path must reach an ending after round 15 (no early end for wrong answers). */
function PathCheck({ content }: { content: ScenarioContent }) {
  const rows = useMemo(() => {
    const best = (r: ScenarioContent['rounds'][number]) => recommendedChoices(r)[0]?.id ?? r.choices[0]?.id ?? null;
    const worst = (r: ScenarioContent['rounds'][number]) => [...r.choices].sort((a, b) => a.accuracy - b.accuracy || a.moodDelta - b.moodDelta)[0]?.id ?? null;
    const paths: { name: string; pick: (r: ScenarioContent['rounds'][number], i: number) => { choiceId: string | null; elapsedMs: number } }[] = [
      { name: 'Semua dianjurkan, langsung', pick: (r) => ({ choiceId: best(r), elapsedMs: 0 }) },
      { name: 'Semua dianjurkan, detik ke-15', pick: (r) => ({ choiceId: best(r), elapsedMs: 15_000 }) },
      { name: 'Selang-seling dianjurkan/terlemah', pick: (r, i) => ({ choiceId: i % 2 ? worst(r) : best(r), elapsedMs: 10_000 }) },
      { name: 'Semua terlemah', pick: (r) => ({ choiceId: worst(r), elapsedMs: 5_000 }) },
      { name: 'Semua waktu habis', pick: () => ({ choiceId: null, elapsedMs: 0 }) },
    ];
    // Delayed consequences: take every choice that leaves a flag (the recommended one elsewhere), so the later effects show.
    if (content.rounds.some((r) => r.choices.some((ch) => ch.setsFlag))) {
      paths.push({ name: 'Pilihan bertanda (efek tertunda), sisanya dianjurkan', pick: (r) => ({ choiceId: r.choices.find((ch) => ch.setsFlag)?.id ?? best(r), elapsedMs: 10_000 }) });
    }
    return paths.map((p) => {
      try {
        const r = playThrough(content, p.pick);
        const endingTitle = contentText(content, 'id', textKey.endingTitle(r.ending.id));
        return { name: p.name, ok: true as const, score: r.totals.totalScore, mood: r.finalMood, ending: `${ENDING_KIND_LABEL[r.ending.kind]}: ${endingTitle || r.ending.id}` };
      } catch (err) {
        return { name: p.name, ok: false as const, error: (err as Error).message };
      }
    });
  }, [content]);
  return (
    <section className="stf-kartu">
      <h3>Uji jalur cepat</h3>
      <p className="stf-kecil">Semua jalur harus mencapai akhir cerita setelah babak 15. Pastikan jalur terbaik mendapat happy ending dan jalur lemah tidak.</p>
      <div className="stf-gulir">
        <table className="stf-tabel">
          <thead>
            <tr>
              <th>Jalur</th>
              <th className="angka">Nilai</th>
              <th className="angka">Status akhir</th>
              <th>Akhir cerita</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                {r.ok ? (
                  <>
                    <td className="angka">{r.score.toLocaleString('id-ID')}</td>
                    <td className="angka">{r.mood}</td>
                    <td>{r.ending}</td>
                  </>
                ) : (
                  <td colSpan={3} className="cms-isu-galat">
                    {r.error}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
