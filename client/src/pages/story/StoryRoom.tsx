/**
 * Participant view of a Story Room (/room/:code). Renders the server's public snapshot + this participant's private
 * state, phase by phase (ARCHITECTURE.md §3):
 *   lobby -> round (story/round/RoundScreen: shared reading, answering with 5 shuffled options and one confirmed
 *   decision, then the own outcome inside the same activity, which stays on screen through the leaderboard with a
 *   compact ranking card) -> ... -> finished/interrupted (personal summary of all decisions).
 * Nothing here decides timing, correctness or score. Leaving (header button) never resets the room; the stored
 * room-scoped credential brings the participant back to the CURRENT round.
 *
 * Scenario texts arrive as templates: both snapshots are personalized with the participant's own name where they enter
 * the page (story/view.ts), so `{nama}` in dialogue, options, consequences and endings reads as this participant.
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { StoryFinalSummary, StoryPrivateState, StoryPublicState } from '@shared/story/protocol';
import { CLOSED_PHASES } from '@shared/story/protocol';
import { checkName, NAME_MAX_CHARS } from '@shared/story/names';
import { Arrow, PlayerShell } from '../../components/PlayerShell';
import { TombolKeluar } from '../../components/TombolKeluar';
import { t, useBahasa } from '../../i18n';
import { Memuat } from '../../ui/kit';
import { storyErrorText } from '../../story/errors';
import { fetchResult, leaveRoom, normalizeCode, rename, resume, savedSession, useParticipant } from '../../story/participant';
import { useRoomAssetState } from '../../story/roomAssets';
import { RoundScreen } from '../../story/round/RoundScreen';
import { useStoryMusic } from '../../story/music';
import { FinalSummary } from '../../story/ui/FinalSummary';
import { personalizePrivateState, personalizePublicState, personalizeSummary } from '../../story/view';
import '../../story/story.css';

export default function StoryRoom() {
  useBahasa();
  const { code: rawCode } = useParams();
  const code = normalizeCode(rawCode ?? '');
  const nav = useNavigate();
  const st = useParticipant();
  const stored = useMemo(() => savedSession(code), [code]);

  useEffect(() => {
    if ((st.session?.code === code && st.room) || !stored) return;
    void resume(code);
    // resume once per room code; reconnects are handled by the store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const leave = useCallback(async () => {
    await leaveRoom();
    nav('/');
  }, [nav]);

  const rawRoom = st.session?.code === code ? st.room : null;
  const rawMe = st.session?.code === code ? st.me : null;
  // Every scenario text below reads with this participant's own name ({nama}); texts are shown only once `me` is known.
  const myName = rawMe?.name ?? null;
  const room = useMemo(() => (rawRoom && myName !== null ? personalizePublicState(rawRoom, myName) : rawRoom), [rawRoom, myName]);
  const me = useMemo(() => (rawMe ? personalizePrivateState(rawMe, rawMe.name) : null), [rawMe]);
  const active = !!room && !CLOSED_PHASES.includes(room.phase);
  const keluar = <TombolKeluar label={t('umum.keluarRoom')} perluKonfirmasi={active && room?.phase !== 'lobby'} judul={t('ruang.keluarJudul')} pesan={t('ruang.keluarIsi')} labelSetuju={t('ruang.keluarYa')} onKeluar={() => void leave()} />;

  if (!stored && !st.session) {
    return (
      <PlayerShell back="/" className="sr-halaman" judul={t('ruang.belumGabung')}>
        <main className="result-focus">
          <h1>{t('ruang.belumGabung')}</h1>
          <Link className="primary-action" to={`/join?room=${code}`}>
            {t('ruang.gabungSekarang')} <Arrow />
          </Link>
        </main>
      </PlayerShell>
    );
  }
  if (st.removed && st.session?.code === code) {
    return (
      <PlayerShell back="/" className="sr-halaman" judul={t('ruang.dikeluarkanJudul')}>
        <main className="result-focus">
          <h1>{t('ruang.dikeluarkanJudul')}</h1>
          <p>{t('ruang.dikeluarkanIsi')}</p>
          <Link className="primary-action" to="/">
            {t('ruang.keBeranda')} <Arrow />
          </Link>
        </main>
      </PlayerShell>
    );
  }
  if (st.lost && !room) return <LostRoom code={code} />;
  if (!room || !me) {
    return (
      <PlayerShell back="/" className="sr-halaman" judul={t('ruang.menyambung')}>
        <main className="result-focus">
          <Memuat teks={t('ruang.menyambung')} />
        </main>
      </PlayerShell>
    );
  }
  return (
    <PlayerShell keluar={keluar} label={room.phase === 'lobby' ? t('ruang.lobi') : undefined} className="sr-halaman sr-main" judul={room.scenario.title}>
      {st.connection === 'reconnecting' ? (
        <div className="koneksi-putus sr-putus" role="status">
          <i className="adegan-spinner" aria-hidden="true" />
          <span>{t('ruang.koneksiPutus')}</span>
        </div>
      ) : null}
      <RoomBody room={room} me={me} connected={st.connection === 'connected'} />
    </PlayerShell>
  );
}

function RoomBody({ room, me, connected }: { room: StoryPublicState; me: StoryPrivateState; connected: boolean }) {
  const { assets, current } = useRoomAssetState(room.code, room.roundNumber);
  useStoryMusic(room, assets);
  switch (room.phase) {
    case 'lobby':
      return <Lobby room={room} me={me} />;
    case 'scene':
    case 'answering':
    case 'consequence':
    case 'leaderboard':
      // Keyed by round: selection, reveal and the open evidence sheet start fresh in every round; the round (with its
      // outcome) stays on screen through the leaderboard.
      return room.scene ? <RoundScreen key={room.scene.roundId} room={room} me={me} scene={room.scene} assets={assets} assetsCurrent={current} connected={connected} /> : <Memuat />;
    default:
      return <FinalSummary room={room} summary={me.summary} participantId={me.participantId} expression={me.customerExpression} />;
  }
}

// ------------------------------------------------------------------ lobby

function Lobby({ room, me }: { room: StoryPublicState; me: StoryPrivateState }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const local = checkName(name);
    if (!local.ok) {
      setError(t(`ruang.nama.${local.reason}`));
      return;
    }
    setBusy(true);
    const res = await rename(name);
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      setError(null);
    } else setError(storyErrorText(res));
  };
  return (
    <main className="sr-lobi">
      <span className="eyebrow">{room.scenario.categoryName}</span>
      <h1>{t('ruang.lobiJudul')}</h1>
      <p className="sr-lembut">{t('ruang.lobiIsi')}</p>
      <p className="sr-kecil">
        <span aria-hidden="true">★</span> <b>{t('ruang.babakKunci')}:</b> {t('ruang.babakKunciArti')}
      </p>
      <section className="sr-kartu">
        <b className="sr-judul-skenario">{room.scenario.title}</b>
        {room.scenario.contentKind === 'demo' ? <span className="sr-tanda-demo">{t('ruang.layarDemo')}</span> : null}
        <p className="sr-lembut">{t('ruang.lobiJumlah', { n: room.participantCount })}</p>
      </section>
      <section className="sr-kartu">
        <span className="sr-label">{t('ruang.lobiSebagai')}</span>
        {editing ? (
          <form className="sr-ganti-nama" onSubmit={save} noValidate>
            <input className="kolom" value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX_CHARS + 10} aria-label={t('ruang.namaLabel')} aria-invalid={error ? true : undefined} autoFocus />
            <div className="sr-baris-tombol">
              <button className="btn" type="submit" disabled={busy}>
                {t('ruang.simpanNama')}
              </button>
              <button
                className="btn btn-netral"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(me.name);
                  setError(null);
                }}
              >
                {t('ruang.batal')}
              </button>
            </div>
          </form>
        ) : (
          <div className="sr-nama-saya">
            <b>{me.name}</b>
            <button type="button" className="text-button" onClick={() => setEditing(true)}>
              {t('ruang.gantiNama')}
            </button>
          </div>
        )}
        {error ? (
          <p className="sr-galat" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

// ------------------------------------------------------------------ results

/** The room is gone from the server's memory (finished long ago / restart): show the persisted personal result. */
function LostRoom({ code }: { code: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'ok'; summary: StoryFinalSummary } | { status: 'none'; error: string }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    void fetchResult(code).then((r) => {
      if (!alive) return;
      // The stored session keeps this device's (last saved) name for {nama}.
      setState(r.ok ? { status: 'ok', summary: personalizeSummary(r.summary, savedSession(code)?.name ?? t('ruang.namaUmum')) } : { status: 'none', error: r.error });
    });
    return () => {
      alive = false;
    };
  }, [code]);
  return (
    <PlayerShell back="/" className="sr-halaman" judul={t('ruang.roomTidakAktif')}>
      {state.status === 'ok' ? (
        <FinalSummary room={null} summary={state.summary} participantId={null} expression="netral" />
      ) : (
        <main className="result-focus">
          {state.status === 'loading' ? (
            <Memuat teks={t('ruang.hasilMemuat')} />
          ) : (
            <>
              <h1>{t('ruang.roomTidakAktif')}</h1>
              <p>{state.error}</p>
              <Link className="primary-action" to="/">
                {t('ruang.keBeranda')} <Arrow />
              </Link>
            </>
          )}
        </main>
      )}
    </PlayerShell>
  );
}
