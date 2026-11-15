/**
 * One round on a participant's device, through its phases (test hook `data-fase`): the shared reading (lines arrive,
 * evidence can be opened, "Pilihan dibuka dalam N detik"), answering (five options + one confirm, the single timer kept
 * visible), the consequence (the same activity stays and the own outcome appears inside it, story first, points last)
 * and the leaderboard (the round and its outcome stay readable; the own rank and when the next round begins dock at
 * the bottom of the screen like the decision bar, and a compact ranking card follows the outcome). Every round starts
 * at its top, wherever the previous one was scrolled. Everything comes from the server's snapshots; nothing here
 * decides timing, correctness or score.
 *
 * Only the private snapshot of the round on screen is used. On a phase change the server sends the public snapshot
 * first, so for a moment the private one still describes the previous phase or round: what has not caught up shows as
 * loading ("Pilihan segera dibuka…", "Memuat hasilmu…"), never as another state. The options opening, the own result
 * and the own rank are announced in one polite live region (repeated inside an open sheet, see announcer.tsx).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useState } from 'react';
import type { StoryConsequenceView, StoryPrivateState, StoryPublicState, StoryScenarioLabel, StoryScenePublic } from '@shared/story/protocol';
import { withBase } from '../base';
import { useReducedMotion } from '../../hooks';
import { t } from '../../i18n';
import { storyErrorText } from '../errors';
import { answer, markReady, participantServerNow } from '../participant';
import { splitReveal } from '../sceneLines';
import { stageImageUrls, type RoomAssetMap } from '../stage/StoryStage';
import { moodLabel, outcomeLabel } from '../ui/badges';
import { PhaseCountdown, RankList } from '../ui/parts';
import { AnnouncementContext, PageAnnouncer, useMomentAnnouncement } from './announcer';
import { AnswerClockContext, type AnswerClock } from './answerClock';
import { DecisionTray } from './DecisionTray';
import { fieldPictureUrl } from './FieldActivity';
import { OutcomeBlock } from './OutcomeBlock';
import { RoundActivity } from './RoundActivity';
import { RoundHeader } from './RoundHeader';
import { TrayDockContext } from './roundContext';
import { actionLabelOf, draftKey, isAfterClosePhase, isPlayPhase, privateOfRound, revealedLineCount, revealsLines, roundMoodOf, roundViewOf, trayDeadlineOf, type RoundView } from './roundModel';
import { useRoundReady } from './useRoundReady';

export function RoundScreen({
  room,
  me,
  scene,
  assets,
  assetsCurrent,
  connected,
}: {
  room: StoryPublicState;
  me: StoryPrivateState;
  scene: StoryScenePublic;
  assets: RoomAssetMap | null;
  /** The asset list was loaded for this round (roomAssets.useRoomAssetState). */
  assetsCurrent: boolean;
  connected: boolean;
}) {
  const reduced = useReducedMotion();
  const playing = isPlayPhase(room.phase);
  const closed = isAfterClosePhase(room.phase);
  const own = privateOfRound(me, room.roundNumber);
  // A round starts at its top (title, task, status): the page may still be scrolled down from the previous round's
  // outcome and ranking, or from the lobby. RoundScreen is keyed per round, so this runs once per round.
  useLayoutEffect(() => {
    if (window.scrollY > 0 && !document.querySelector('dialog[open]')) window.scrollTo(0, 0);
  }, []);
  const labels = room.scenario.moodLabels;
  const reminders = playing && own ? own.flagReminders : [];
  // The round's status line and the participant's own conditional lines come while the round is played and settled,
  // not on the leaderboard: what the round showed stays in its thread until the round ends.
  const moodLine = useLastPresent(own?.moodVariantLine ?? null);
  const flagLines = useLastPresent(own?.flagLines.length ? own.flagLines : null);
  const outcome = closed ? (own?.consequence ?? null) : null;
  const full = roundViewOf({
    scene,
    flagLines: flagLines ?? [],
    moodLine,
    mood: own ? roundMoodOf({ phase: room.phase, mood: own.mood, reminders, word: (b) => moodLabel(b, labels) }) : null,
    reminders,
    outcome,
    assets,
    stage: { scenario: room.scenario, customerExpression: own ? own.customerExpression : room.scenario.neutralExpression },
  });
  const revealed = useRevealedLines(room, full.intro.length + full.lines.length, reduced || !revealsLines(scene.layout));
  const view: RoundView = { ...full, ...splitReveal(full.intro, full.lines, revealed) };
  useParticipantReady(scene, room.scenario, own ? own.customerExpression : null, assetsCurrent ? assets : null);
  const clock = useMemo<AnswerClock | null>(
    () => (room.phase === 'answering' ? { endsAt: room.phaseEndsAt, durationMs: room.phaseDurationMs, now: participantServerNow } : null),
    [room.phase, room.phaseEndsAt, room.phaseDurationMs],
  );
  const action = actionLabelOf(scene, t);
  const rank = rankOf(room, me.participantId);
  const moment = room.phase === 'answering' ? 'open' : room.phase === 'consequence' && outcome ? 'result' : rank ? 'rank' : null;
  const announcement = useMomentAnnouncement(
    moment,
    moment === 'open' ? t('ruang.umumkanDibuka', { aksi: action }) : moment === 'result' && outcome ? t('ruang.umumkanHasil', { hasil: outcomeLabel(outcome.outcome) }) : rank ? t('ruang.peringkatmu', rank) : '',
  );
  const [dock, setDock] = useState<HTMLDivElement | null>(null);
  const decision = playing ? (
    <ParticipantDecision room={room} own={own} scene={scene} actionLabel={action} connected={connected} />
  ) : outcome ? (
    <OutcomeBlock outcome={outcome} layout={scene.layout} officerName={room.scenario.officerName} moodLabels={labels} />
  ) : closed ? (
    <p className="sr-lembut">{t('ruang.hasilMemuat')}</p>
  ) : null;
  return (
    <main className="sr-ronde" data-fase={room.phase}>
      {/* "Tugas: …" under the title only while reading (the context may push the question below the fold); once the
          options open, the question above them says it. */}
      <RoundHeader scene={scene} totalRounds={room.totalRounds} mood={view.mood} customerName={room.scenario.customerName || t('ruang.customer')} task={room.phase === 'scene' ? scene.prompt : ''} />
      <AnnouncementContext.Provider value={announcement}>
        <AnswerClockContext.Provider value={clock}>
          <TrayDockContext.Provider value={dock}>
            <RoundActivity view={view} mode="participant" phase={room.phase} decision={decision} />
          </TrayDockContext.Provider>
        </AnswerClockContext.Provider>
      </AnnouncementContext.Provider>
      {/* Sticky over the whole round, so it never scrolls away: the decision bar (timer + confirm) while answering,
          after close the own rank and what comes next. */}
      <div className="sr-baki-dok" ref={setDock}>
        {closed ? <CloseBar room={room} rank={rank} /> : null}
      </div>
      {closed ? <RoundClose room={room} outcome={outcome} participantId={me.participantId} /> : null}
      <PageAnnouncer announcement={announcement} />
    </main>
  );
}

/**
 * The latest non-null value this round has received. RoundScreen is keyed per round, so nothing carries over to the
 * next one (React's "adjust state while rendering" pattern).
 */
function useLastPresent<T>(value: T | null): T | null {
  const [kept, setKept] = useState<T | null>(value);
  if (value !== null && value !== kept) setKept(value);
  return value ?? kept;
}

/**
 * Lines revealed so far, anchored to the scene's start and reading time (they do not move when the server extends
 * the scene with its readiness grace), refreshed 4×/s until all are shown.
 */
function useRevealedLines(room: StoryPublicState, total: number, instant: boolean): number {
  const [now, setNow] = useState(participantServerNow);
  const count = revealedLineCount({ phase: room.phase, sceneStartedAt: room.sceneStartedAt, readingMs: room.readingMs, now, total, reduced: instant });
  const running = count < total;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(participantServerNow()), 250);
    return () => window.clearInterval(id);
  }, [running]);
  return count;
}

/**
 * Tells the server this device has the round's pictures (field/stage) once decoded; evidence pictures load ahead.
 * Waits until the round's own asset list is known (`assets` null before; an earlier round's list would name no new
 * picture and report ready too early) and, for the stage, this participant's expression (`expression` null before).
 */
function useParticipantReady(scene: StoryScenePublic, scenario: StoryScenarioLabel, expression: string | null, assets: RoomAssetMap | null) {
  const urls = useMemo(() => {
    if (!assets) return null;
    if (scene.layout === 'stage') return expression === null ? null : stageImageUrls(scene, scenario, expression, assets);
    if (scene.layout !== 'field') return [];
    const url = fieldPictureUrl({ scene, assets });
    return url ? [url] : [];
  }, [scene, scenario, expression, assets]);
  const prefetch = useMemo(() => {
    const out: string[] = [];
    for (const e of scene.evidence) {
      const url = e.assetId ? assets?.get(e.assetId)?.url : null;
      if (url) out.push(withBase(url));
    }
    return out;
  }, [scene.evidence, assets]);
  const report = useCallback((roundId: string) => void markReady(roundId), []);
  useRoundReady(scene.roundId, urls, prefetch, report);
}

/**
 * The participant's decision slot while the round is played: the tray, then (once sent) how many have answered. The
 * sent option is known from this send or from the server's acknowledgement, which names its handle, so a reloaded tab
 * or a second device shows it too. `own` null = this round's private snapshot has not arrived yet.
 */
function ParticipantDecision({ room, own, scene, actionLabel, connected }: { room: StoryPublicState; own: StoryPrivateState | null; scene: StoryScenePublic; actionLabel: string; connected: boolean }) {
  const [acked, setAcked] = useState<{ roundId: string; handle: string } | null>(null);
  const confirmed = own?.answer?.roundId === scene.roundId ? own.answer.handle : null;
  const sentHandle = room.phase !== 'answering' ? null : acked?.roundId === scene.roundId ? acked.handle : confirmed;
  const deadline = trayDeadlineOf(room);
  const submit = async (handle: string) => {
    const res = await answer(handle);
    if (res.ok) {
      setAcked({ roundId: scene.roundId, handle });
      return { ok: true };
    }
    return { ok: false, error: storyErrorText(res) };
  };
  return (
    <>
      <DecisionTray
        options={own?.options ?? null}
        layout={scene.layout}
        actionLabel={actionLabel}
        phase={room.phase}
        sentHandle={sentHandle}
        disabled={!connected}
        endsAt={deadline.endsAt}
        durationMs={deadline.durationMs}
        now={participantServerNow}
        onSubmit={submit}
        persistKey={draftKey(room.code, scene.roundId)}
      />
      {sentHandle !== null ? <p className="sr-tunggu">{t('ruang.menungguLain', { sudah: room.answeredCount, total: room.eligibleCount })}</p> : null}
    </>
  );
}

/** The participant's place in the leaderboard's ranking ("Peringkatmu: 3 dari 6"); null outside it or when not ranked. */
function rankOf(room: StoryPublicState, participantId: string): { rank: number; of: number } | null {
  if (room.phase !== 'leaderboard') return null;
  const rows = room.rankings ?? [];
  const mine = rows.find((r) => r.participantId === participantId);
  return mine ? { rank: mine.rank, of: rows.length } : null;
}

/**
 * After close, in the page's dock (sticky, so on screen also where the ranking card sits below the outcome): on the
 * leaderboard the own rank and when the next round begins; after the last round's outcome when the final result
 * shows. The consequence of the other rounds has none: the round stays on screen into the ranking.
 */
function CloseBar({ room, rank }: { room: StoryPublicState; rank: { rank: number; of: number } | null }) {
  const last = room.roundNumber >= room.totalRounds;
  if (room.phase === 'consequence' && !last) return null;
  const text = (n: number) => (room.phase === 'consequence' ? t('ruang.hasilAkhirDalam', { n }) : t('ruang.babakMulaiDalam', { m: room.roundNumber + 1, n }));
  return (
    <div className="sr-tutup-bar" data-langkah="">
      {rank ? <b className="sr-peringkat-saya">{t('ruang.peringkatmu', rank)}</b> : null}
      {room.phaseEndsAt === null ? (
        <span className="sr-tutup-langkah">{t('ruang.menungguHost')}</span>
      ) : (
        <PhaseCountdown endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={participantServerNow} render={(n) => <span className="sr-tutup-langkah">{text(n)}</span>} />
      )}
    </div>
  );
}

/** After close, under the round: its points (quiet, last of the outcome), then on the leaderboard the ranking card. */
function RoundClose({ room, outcome, participantId }: { room: StoryPublicState; outcome: StoryConsequenceView | null; participantId: string }) {
  const fmt = (n: number) => n.toLocaleString('id-ID');
  return (
    <div className="sr-ronde-tutup">
      {outcome ? (
        <p className="sr-ronde-nilai">
          {t('ruang.nilaiRingkas', { total: fmt(outcome.score.roundScore), akurasi: fmt(outcome.score.accuracyPoints), kecepatan: fmt(outcome.score.speedPoints) })}
        </p>
      ) : null}
      {room.phase === 'leaderboard' ? <RankingCard room={room} participantId={participantId} /> : null}
    </div>
  );
}

/** The ranking after this round, compact: the top three and the own row when it is not among them (the own rank is in the bar). */
function RankingCard({ room, participantId }: { room: StoryPublicState; participantId: string }) {
  const id = useId();
  const rows = room.rankings ?? [];
  if (!rows.length) return null;
  return (
    <section className="sr-kartu sr-peringkat-kartu" data-peringkat="" aria-labelledby={id}>
      <h2 id={id} className="sr-peringkat-kartu-judul">
        {t('ruang.peringkatJudul')}
      </h2>
      <RankList rows={rows} highlightId={participantId} limit={3} />
    </section>
  );
}
