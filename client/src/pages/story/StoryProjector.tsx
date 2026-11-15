/**
 * Event screen of a Story Room (/projector?room=KODE), shown to a room or hall and read from the back of it. Shows only
 * PUBLIC state: the lobby with QR/code and names; during a round a rail with the round's title, its task (the question
 * everyone answers on their phone) and its status — the countdown to the options (the same reading time as the
 * phones), ONE big answer timer and the answered COUNT (never who chose what) — beside the round's activity
 * (RoundActivity mode 'projector': its newest lines, the field scene's numbered markers or the legacy stage; no
 * options, moods, reminders or own outcomes) and ONE focus panel: the shared evidence one item at a time while the
 * round is played, the round's lesson once the answers are closed; then cumulative rankings. Conditional
 * (delayed-consequence) lines stay on the phones of the participants who hold the flag. `{nama}` in scenario texts
 * reads as the neutral word (`ruang.namaUmum`) on this screen.
 */
import { useCallback, useEffect, useMemo, useReducer, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import type { StoryPhase, StoryPublicState, StoryScenePublic } from '@shared/story/protocol';
import { Merek } from '../../components/Merek';
import { useHalaman } from '../../ui/halaman';
import { t, useBahasa } from '../../i18n';
import { KodeRoom, Memuat, QrCode } from '../../ui/kit';
import { joinLink, useAppConfig, useLegacyEnabled } from '../../story/appConfig';
import { ServerClock } from '../../story/clock';
import { storyErrorText } from '../../story/errors';
import { storyRpc, storySocket } from '../../story/net';
import { normalizeCode } from '../../story/participant';
import { useRoomAssets } from '../../story/roomAssets';
import { EvidenceContent, evidenceLabel, KindIcon } from '../../story/round/evidenceParts';
import { RoundActivity } from '../../story/round/RoundActivity';
import { evidenceTurnMs, isPlayPhase, roundViewOf, trayDeadlineOf, type RoundView } from '../../story/round/roundModel';
import type { RoomAssetMap } from '../../story/stage/StoryStage';
import { useStoryMusic } from '../../story/music';
import { OpeningLines } from '../../story/ui/conversation';
import { AnswerTimer, PhaseCountdown, RankList, SceneKicker } from '../../story/ui/parts';
import { personalizePublicState } from '../../story/view';
import '../../story/story.css';
import '../../story/projector.css';

/** Phases that show the current round's activity. */
const ROUND_PHASES: readonly StoryPhase[] = ['scene', 'answering', 'consequence'];

/** How many of the round's newest lines the big screen shows (every phone holds the whole conversation). */
const SHOWN_LINES = 3;

/** A round title or task longer than this (characters) reads one step smaller on the rail, so the timer always fits. */
const LONG_TITLE = 34;
const LONG_TASK = 100;

export default function StoryProjector() {
  useBahasa();
  const [params] = useSearchParams();
  const legacy = useLegacyEnabled();
  const code = normalizeCode(params.get('room') ?? '');
  if (legacy && code.length === 4) return <Navigate to={'/acara/layar?room=' + code} replace />;
  if (code.length !== 6) return <CodeForm legacy={legacy} />;
  return <ProjectorRoom key={code} code={code} />;
}

function CodeForm({ legacy }: { legacy: boolean }) {
  useHalaman(t('ruang.layarJudul'));
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (c.length === 6 || (legacy && c.length === 4)) nav('/projector?room=' + c);
  };
  return (
    <div className="sr-layar sr-layar-kode">
      <header className="sr-layar-kepala">
        <Merek />
      </header>
      <main className="sr-layar-tengah">
        <h1>{t('ruang.layarJudul')}</h1>
        <p>{t('ruang.layarKodeIsi')}</p>
        <form onSubmit={submit} className="sr-layar-form">
          <input className="kolom sr-input-kode" value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} placeholder="KODE" maxLength={6} aria-label={t('ruang.kodeLabel')} autoFocus />
          <button className="btn btn-utama" type="submit">
            {t('ruang.layarTampilkan')}
          </button>
        </form>
      </main>
    </div>
  );
}

function useWatchedRoom(code: string): { room: StoryPublicState | null; error: string | null; now: () => number } {
  const clock = useMemo(() => new ServerClock(), []);
  const [room, setRoom] = useState<StoryPublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const socket = storySocket();
    const watch = async () => {
      const res = await storyRpc<{ state: StoryPublicState }>(socket, 'display:watch', { code });
      if (res.ok) {
        clock.sample(res.data.state.serverNow);
        setRoom(res.data.state);
        setError(null);
      } else setError(storyErrorText(res));
    };
    const onPublic = (s: StoryPublicState) => {
      if (s.code !== code) return;
      clock.sample(s.serverNow);
      setRoom(s);
    };
    socket.on('story:public', onPublic);
    socket.on('connect', watch);
    if (socket.connected) void watch();
    return () => {
      socket.off('story:public', onPublic);
      socket.off('connect', watch);
    };
  }, [code, clock]);
  const now = useCallback(() => clock.now(), [clock]);
  return { room, error, now };
}

function ProjectorRoom({ code }: { code: string }) {
  const watched = useWatchedRoom(code);
  const { error, now } = watched;
  const neutral = t('ruang.namaUmum');
  const room = useMemo(() => (watched.room ? personalizePublicState(watched.room, neutral) : null), [watched.room, neutral]);
  const config = useAppConfig();
  const assets = useRoomAssets(code, room?.roundNumber ?? 0);
  useHalaman(room ? `${t('ruang.layarJudul')} · ${room.scenario.title}` : t('ruang.layarJudul'));
  if (!room) {
    return (
      <div className="sr-layar">
        <header className="sr-layar-kepala">
          <Merek />
        </header>
        <main className="sr-layar-tengah">{error ? <p className="sr-galat">{error}</p> : <Memuat />}</main>
      </div>
    );
  }
  const link = joinLink(code, config.status === 'ready' ? config.config : null);
  return (
    <div className={`sr-layar sr-layar-${room.phase}`}>
      <header className="sr-layar-kepala">
        <Merek />
        <div className="sr-layar-info">
          <b>{room.scenario.title}</b>
          <span>
            {room.scenario.categoryName} · {t('ruang.layarVersi', { n: room.scenario.versionNo })}
            {room.scenario.contentKind === 'demo' ? ` · ${t('ruang.layarDemo')}` : ''}
          </span>
        </div>
        <div className="sr-layar-kanan">
          {room.phase !== 'lobby' ? <span className="sr-layar-babak">{t('ruang.babakDari', { n: room.roundNumber, total: room.totalRounds })}</span> : null}
          <KodeRoom code={code} size="kecil" />
        </div>
      </header>
      <ProjectorBody room={room} link={link} now={now} assets={assets} />
    </div>
  );
}

function ProjectorBody({ room, link, now, assets }: { room: StoryPublicState; link: string; now: () => number; assets: RoomAssetMap | null }) {
  useStoryMusic(room, assets);
  if (room.phase === 'lobby') return <ProjectorLobby room={room} link={link} />;
  if (ROUND_PHASES.includes(room.phase)) return room.scene ? <ProjectorRound room={room} scene={room.scene} now={now} assets={assets} /> : <Memuat />;
  return <ProjectorRanking room={room} now={now} />;
}

function ProjectorLobby({ room, link }: { room: StoryPublicState; link: string }) {
  return (
    <main className="sr-layar-lobi">
      <section className="sr-layar-gabung">
        <h1>{t('ruang.joinJudul')}</h1>
        <QrCode value={link} size={260} />
        <KodeRoom code={room.code} />
        <p>{t('ruang.layarGabungLewat', { alamat: link.replace(/\/join\?room=.*$/, '/join') })}</p>
      </section>
      <section className="sr-layar-peserta" aria-live="polite">
        <h2>{t('ruang.lobiJumlah', { n: room.participantCount })}</h2>
        {room.participants.length ? (
          <ul>
            {room.participants.map((p) => (
              <li key={p.id} className={p.connected ? '' : 'putus'}>
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sr-lembut">{t('ruang.layarPesertaKosong')}</p>
        )}
        <p className="sr-lembut">{t('ruang.layarMenungguHost')}</p>
      </section>
    </main>
  );
}

/**
 * What the round's activity shows on the big screen: only its newest lines, without the opening (shown on its own
 * first), the task and the lesson (the rail and the focus panel show them) or the evidence (the focus panel shows it
 * one item at a time) — except at a field scene, whose numbered markers come from the evidence (projector.css hides
 * the scene's own list there).
 */
function surfaceOf(view: RoundView): RoundView {
  const { scene } = view;
  return {
    ...view,
    intro: [],
    lines: view.lines.slice(-SHOWN_LINES),
    scene: { ...scene, prompt: '', lesson: '', evidence: scene.layout === 'field' ? scene.evidence : [] },
  };
}

/**
 * One round on the shared screen: the rail (title, task, status) on the right; on the left the round's activity beside
 * the focus panel. The page is exactly one screen (projector.css): a long conversation is cut at its oldest line and a
 * long item at its end, the rail and the focus panel's heading never are.
 */
function ProjectorRound({ room, scene, now, assets }: { room: StoryPublicState; scene: StoryScenePublic; now: () => number; assets: RoomAssetMap | null }) {
  const scenario = room.scenario;
  // Public lines only (no flag lines), no mood, reminders or outcome; the legacy stage shows the neutral expression.
  const view = useMemo(
    () => roundViewOf({ scene, assets, stage: { scenario, customerExpression: scenario.neutralExpression } }),
    [scene, assets, scenario],
  );
  const surface = useMemo(() => surfaceOf(view), [view]);
  const opening = useOpeningShown(room, view, now);
  const playing = isPlayPhase(room.phase);
  return (
    <main className="sr-proyektor-babak" data-fase={room.phase}>
      <div className="sr-proyektor-sisi">
        <div className="sr-proyektor-tajuk">
          <SceneKicker meta={scene.meta} keyRound={scene.keyRound} />
          <h1 className={scene.title.length > LONG_TITLE ? 'sr-panjang' : undefined}>{scene.title}</h1>
          {/* The task sits under the title (never at the screen's bottom edge, where heads in the room cover it). */}
          {playing && !opening && scene.prompt ? <h2 className={`sr-tugas${scene.prompt.length > LONG_TASK ? ' sr-panjang' : ''}`}>{scene.prompt}</h2> : null}
        </div>
        <RoundStatus room={room} now={now} />
      </div>
      <div className="sr-proyektor-panggung">
        {opening ? (
          <OpeningLines lines={view.intro} />
        ) : (
          <>
            <RoundActivity view={surface} mode="projector" phase={room.phase} />
            {playing ? <EvidenceFocus scene={scene} assets={assets} startedAt={room.sceneStartedAt} turnMs={evidenceTurnMs(scene.evidence.length, room.readingMs)} now={now} /> : <LessonFocus lesson={scene.lesson} />}
          </>
        )}
      </div>
    </main>
  );
}

/** true until the server-clock time `deadline` passes (one re-render at that moment); false without a deadline. */
function useBefore(deadline: number | null, now: () => number): boolean {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (deadline === null) return;
    const wait = deadline - now();
    if (wait <= 0) return;
    const id = window.setTimeout(rerender, wait + 1);
    return () => window.clearTimeout(id);
  }, [deadline, now]);
  return deadline !== null && now() < deadline;
}

const textLength = (lines: readonly { text: string }[]): number => lines.reduce((n, l) => n + l.text.length, 0);

/**
 * Round 1 begins with the scenario's opening lines. The shared screen shows them on their own for their share of the
 * shared reading time (by text length, against the round's lines and question: the texts the reading time is made
 * of), counted from the scene's start, which the readiness grace never moves; then the round's activity takes their
 * place. So the opening never pushes the round's first message or the countdown off the screen, and it does not come
 * back when the server extends the scene. A switch of content, not an animation, so it applies with reduced motion too.
 */
function useOpeningShown(room: StoryPublicState, view: Pick<RoundView, 'scene' | 'intro' | 'lines'>, now: () => number): boolean {
  const { sceneStartedAt: start, readingMs } = room;
  const opening = textLength(view.intro);
  const share = opening / (opening + textLength(view.lines) + view.scene.prompt.length);
  // `!= null` on purpose: snapshots of older servers lack the fields entirely; the round's activity then shows at once.
  return useBefore(room.phase === 'scene' && opening > 0 && start != null && readingMs != null ? start + readingMs * share : null, now);
}

/**
 * Index of the item whose turn it is when `count` items take turns of `turnMs` from `startedAt` (server clock),
 * re-rendering at every change of turn; the first item when there is nothing to rotate or no start (older servers).
 */
function useEvidenceTurn(count: number, startedAt: number | null, turnMs: number, now: () => number): number {
  const [tick, rerender] = useReducer((n: number) => n + 1, 0);
  const turn = count > 1 && startedAt != null ? Math.floor(Math.max(0, now() - startedAt) / turnMs) : null;
  useEffect(() => {
    if (turn === null || startedAt == null) return;
    // Re-armed after every tick, so a server clock that moved back a little only delays the change of turn.
    const id = window.setTimeout(rerender, Math.max(0, startedAt + (turn + 1) * turnMs - now()) + 1);
    return () => window.clearTimeout(id);
  }, [turn, startedAt, turnMs, now, tick]);
  return turn === null ? 0 : turn % count;
}

/**
 * The round's shared evidence in the focus panel, ONE item at a time with its picture large. The items take turns
 * (roundModel.evidenceTurnMs: the reading time shared out, 6–10 s each) counted from the scene's start (which the
 * readiness grace never moves), so every item shows while the room reads, every screen in the room
 * shows the same item and a reload continues the turn. All items stay mounted with only the current one visible, so
 * the next picture is already loaded when its turn comes. A field item carries its number, the one its marker on the
 * scene picture shows; the label above a title is the author's word for the item, else its kind.
 */
function EvidenceFocus({ scene, assets, startedAt, turnMs, now }: { scene: StoryScenePublic; assets: RoomAssetMap | null; startedAt: number | null; turnMs: number; now: () => number }) {
  const items = scene.evidence;
  const turn = useEvidenceTurn(items.length, startedAt, turnMs, now);
  if (!items.length) return null;
  const numbered = scene.layout === 'field';
  return (
    <section className="sr-proyektor-fokus">
      {items.map((item, i) => (
        <article key={item.id} className="sr-proyektor-berkas" hidden={i !== turn}>
          <header className="sr-proyektor-berkas-kepala">
            {numbered ? (
              <span className="sr-proyektor-berkas-no" aria-hidden="true">
                {i + 1}
              </span>
            ) : (
              <KindIcon kind={item.kind} />
            )}
            <span className="sr-proyektor-berkas-jenis">{evidenceLabel(item)}</span>
            <h2>{item.title}</h2>
          </header>
          <EvidenceContent item={item} assets={assets} />
        </article>
      ))}
      {items.length > 1 ? (
        <ol className="sr-proyektor-urutan" aria-hidden="true">
          {items.map((item, i) => (
            <li key={item.id} data-kini={i === turn ? '' : undefined} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** The round's lesson in the focus panel once the answers are closed (public from then on); nothing without one. */
function LessonFocus({ lesson }: { lesson: string }) {
  if (!lesson) return null;
  return (
    <section className="sr-proyektor-fokus">
      <div className="sr-pelajaran sr-proyektor-pelajaran">
        <b>{t('ruang.pelajaran')}</b>
        <p>{lesson}</p>
      </div>
    </section>
  );
}

/** The rail's status by phase: the countdown to the options; ONE big answer timer and the answered count; the wait for the next phase. */
function RoundStatus({ room, now }: { room: StoryPublicState; now: () => number }) {
  const answered = <p className="sr-layar-jawab">{t('ruang.layarSudahMenjawab', { sudah: room.answeredCount, total: room.eligibleCount })}</p>;
  if (room.phase === 'scene') {
    // The phones' countdown: to the end of the shared reading time, which the readiness grace never moves or restarts.
    const reading = trayDeadlineOf(room);
    return <PhaseCountdown endsAt={reading.endsAt} durationMs={reading.durationMs} now={now} render={(n) => <p className="sr-layar-hitung">{n > 0 ? t('ruang.pilihanDibuka', { n }) : t('ruang.pilihanSegera')}</p>} />;
  }
  if (room.phase === 'answering') {
    return (
      <>
        <AnswerTimer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={now} size="big" />
        {answered}
        <p className="sr-proyektor-catatan">{t('ruang.layarPilihanDiHp')}</p>
      </>
    );
  }
  return (
    <>
      {answered}
      <p className="sr-proyektor-catatan">{t('ruang.layarKonsekuensi')}</p>
      <PhaseCountdown endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={now} render={(n) => <p className="sr-proyektor-catatan">{t('ruang.lanjutDalam', { n })}</p>} />
    </>
  );
}

function ProjectorRanking({ room, now }: { room: StoryPublicState; now: () => number }) {
  const closed = room.phase === 'finished' || room.phase === 'interrupted';
  return (
    <main className="sr-layar-papan">
      <h1>{closed ? t('ruang.peringkatAkhir') : t('ruang.peringkatJudul')}</h1>
      <RankList rows={room.rankings ?? []} limit={10} />
      {closed ? (
        <p className="sr-layar-hitung">{room.phase === 'finished' ? t('ruang.layarSelesai') : t('ruang.layarDihentikan')}</p>
      ) : room.phaseEndsAt === null ? (
        <p className="sr-lembut">{t('ruang.menungguHost')}</p>
      ) : (
        <PhaseCountdown endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={now} render={(n) => <p className="sr-lembut">{t('ruang.lanjutDalam', { n })}</p>} />
      )}
    </main>
  );
}
