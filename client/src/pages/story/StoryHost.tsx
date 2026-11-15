/**
 * Host console (/host, staff role `host`). Opens a room from a PUBLISHED scenario version, shows the code/QR, and
 * controls start / continue / auto-advance / remove participant / close (PRD FR-B1, FR-B5, FR-B6). Answer collection
 * closes automatically (all answered or deadline); "Lanjut" never shortens an answer window (server rule).
 * The host never sees participants' choices or private moods, only counts and rankings. `{nama}` in scenario texts
 * reads as the neutral word (`ruang.namaUmum`), as on the projector.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { personalize } from '@shared/story/content';
import type { HostScenarioOption, RoomListRow } from '@shared/story/dto';
import type { StoryAck, StoryPublicState, StoryScenePublic } from '@shared/story/protocol';
import { CLOSED_PHASES, CLOSED_REASON_LABEL, type StoryClosedReason } from '@shared/story/protocol';
import type { StaffIdentity } from '@shared/story/roles';
import { t } from '../../i18n';
import { KodeRoom, Modal, QrCode } from '../../ui/kit';
import { LAYOUT_LABEL } from '../cms/labels';
import { joinLink, useAppConfig } from '../../story/appConfig';
import { withBase } from '../../story/base';
import { ServerClock } from '../../story/clock';
import { staffSocket, storyRpc } from '../../story/net';
import { normalizeCode } from '../../story/participant';
import { evidenceLabel } from '../../story/round/evidenceParts';
import { actionLabelOf } from '../../story/round/roundModel';
import { staffApi, useStaff } from '../../story/staff';
import { ActionMessage, StaffShell, formatTime } from '../../story/ui/StaffShell';
import { AnswerTimer, PhaseCountdown, RankList } from '../../story/ui/parts';
import { personalizePublicState } from '../../story/view';
import '../../story/story.css';

/** Scenario text as shown on staff screens: `{nama}` reads as the neutral word. */
const neutralText = (text: string): string => personalize(text, t('ruang.namaUmum'));

const PHASE_LABEL: Record<StoryPublicState['phase'], string> = {
  lobby: 'Lobi — menunggu peserta',
  scene: 'Adegan — waktu baca bersama',
  answering: 'Menjawab — 30 detik',
  consequence: 'Konsekuensi pribadi',
  leaderboard: 'Peringkat sementara',
  finished: 'Selesai',
  interrupted: 'Dihentikan',
};

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export default function StoryHost() {
  return <StaffShell title="Host room cerita" need={['hostRooms']}>{(identity) => <HostConsole identity={identity} />}</StaffShell>;
}

/** Authenticated `/story` socket for this console; re-attaches the controlled room after reconnects. */
function useHostSocket(token: string | null, code: string | null, onState: (s: StoryPublicState) => void, clock: ServerClock): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  useEffect(() => {
    if (!token) return;
    const s = staffSocket(token);
    const attach = async () => {
      const c = codeRef.current;
      if (!c) return;
      const res = await storyRpc<{ state: StoryPublicState }>(s, 'host:attach', { code: c });
      if (res.ok) {
        clock.sample(res.data.state.serverNow);
        onStateRef.current(res.data.state);
      }
    };
    s.on('connect', attach);
    s.on('story:public', (state: StoryPublicState) => {
      if (state.code !== codeRef.current) return;
      clock.sample(state.serverNow);
      onStateRef.current(state);
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token, clock]);
  return socket;
}

function HostConsole({ identity }: { identity: StaffIdentity }) {
  const staff = useStaff();
  const token = staff.status === 'signed_in' ? staff.token : null;
  const [params, setParams] = useSearchParams();
  const code = normalizeCode(params.get('room') ?? '') || null;
  const clock = useMemo(() => new ServerClock(), []);
  const [room, setRoom] = useState<StoryPublicState | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [scenarios, setScenarios] = useState<HostScenarioOption[] | null>(null);
  const [rooms, setRooms] = useState<RoomListRow[]>([]);
  const [limits, setLimits] = useState<{ maxParticipantsPerRoom: number; maxActiveRooms: number } | null>(null);
  const socket = useHostSocket(token, code, setRoom, clock);
  const now = useCallback(() => clock.now(), [clock]);

  const refreshLists = useCallback(async () => {
    const [s, r] = await Promise.all([
      staffApi<{ scenarios: HostScenarioOption[]; limits: { maxParticipantsPerRoom: number; maxActiveRooms: number } }>('GET', '/api/host/scenarios'),
      staffApi<{ rooms: RoomListRow[] }>('GET', '/api/host/rooms'),
    ]);
    if (s.ok) {
      setScenarios(s.data.scenarios);
      setLimits(s.data.limits);
    } else setMsg({ kind: 'error', text: s.error });
    if (r.ok) setRooms(r.data.rooms);
  }, []);
  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  // Attach when the URL names a room (refresh / "Kendalikan") and the socket is ready.
  useEffect(() => {
    if (!socket || !code) {
      setRoom(null);
      return;
    }
    if (socket.connected) {
      void storyRpc<{ state: StoryPublicState }>(socket, 'host:attach', { code }).then((res) => {
        if (res.ok) {
          clock.sample(res.data.state.serverNow);
          setRoom(res.data.state);
        } else setMsg({ kind: 'error', text: res.error });
      });
    }
  }, [socket, code, clock]);

  const act = async (event: string, payload: Record<string, unknown> = {}) => {
    if (!socket || !code) return;
    setMsg(null);
    const res = await storyRpc<{ state: StoryPublicState }>(socket, event, { code, ...payload });
    if (res.ok) setRoom(res.data.state);
    else setMsg({ kind: 'error', text: res.error });
    if (event === 'host:close') void refreshLists();
  };

  const create = async (scenarioId: string, autoAdvance: boolean) => {
    if (!socket) return;
    setMsg(null);
    const res: StoryAck<{ code: string; state: StoryPublicState }> = await storyRpc(socket, 'host:create', { scenarioId, autoAdvance });
    if (!res.ok) {
      setMsg({ kind: 'error', text: res.error });
      return;
    }
    clock.sample(res.data.state.serverNow);
    setRoom(res.data.state);
    setParams({ room: res.data.code });
    void refreshLists();
  };

  return (
    <main className="stf-isi stf-host">
      <div className="stf-judul-baris">
        <h1>Host room cerita</h1>
        <span className="stf-lembut">Masuk sebagai {identity.displayName}</span>
      </div>
      <ActionMessage message={msg} />
      {code && room ? (
        <RoomControl room={room} now={now} act={act} onLeave={() => setParams({})} />
      ) : code && !room ? (
        <p className="stf-lembut">Menyambung ke room {code}…</p>
      ) : (
        <div className="stf-dua-kolom">
          <ScenarioPicker scenarios={scenarios} limits={limits} onCreate={create} disabled={!socket} />
          <MyRooms rooms={rooms} onControl={(c) => setParams({ room: c })} onRefresh={() => void refreshLists()} />
        </div>
      )}
    </main>
  );
}

function ScenarioPicker({ scenarios, limits, onCreate, disabled }: { scenarios: HostScenarioOption[] | null; limits: { maxParticipantsPerRoom: number; maxActiveRooms: number } | null; onCreate: (id: string, auto: boolean) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  return (
    <section className="stf-kartu">
      <h2>Buka room baru</h2>
      <p className="stf-lembut">
        Satu room = satu sesi 15 babak dari satu versi skenario terbit. Room tidak bisa diulang; untuk bermain lagi buka room baru.
        {limits ? ` Batas lokal: ${limits.maxParticipantsPerRoom} peserta per room, ${limits.maxActiveRooms} room aktif (bawaan lokal, bukan kapasitas teruji).` : ''}
      </p>
      {scenarios === null ? (
        <p className="stf-lembut">Memuat skenario…</p>
      ) : scenarios.length === 0 ? (
        <p className="stf-galat">Belum ada skenario terbit. Penulis & reviewer menerbitkannya lewat CMS (/cms).</p>
      ) : (
        <fieldset className="stf-pilih-skenario">
          <legend className="sr-only">Pilih skenario</legend>
          {scenarios.map((s) => (
            <label key={s.versionId} className={`stf-opsi${selected === s.scenarioId ? ' terpilih' : ''}`}>
              <input type="radio" name="skenario" checked={selected === s.scenarioId} onChange={() => setSelected(s.scenarioId)} />
              <span>
                <b>{neutralText(s.title)}</b>
                <small>
                  {s.categoryName} · versi {s.versionNo} · tingkat {s.difficulty}
                  {s.contentKind === 'demo' ? ' · DEMO (tidak masuk rekap kompetisi)' : ''}
                </small>
                <small>{neutralText(s.synopsis)}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="stf-centang">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        <span>Lanjut otomatis setelah peringkat (7 detik). Bila mati, host menekan “Babak berikutnya”.</span>
      </label>
      <button className="btn btn-utama" type="button" disabled={!selected || disabled} onClick={() => selected && onCreate(selected, auto)}>
        Buka room
      </button>
    </section>
  );
}

function MyRooms({ rooms, onControl, onRefresh }: { rooms: RoomListRow[]; onControl: (code: string) => void; onRefresh: () => void }) {
  return (
    <section className="stf-kartu">
      <div className="stf-judul-baris">
        <h2>Room saya</h2>
        <button type="button" className="btn btn-netral btn-kecil" onClick={onRefresh}>
          Muat ulang
        </button>
      </div>
      {rooms.length === 0 ? (
        <p className="stf-lembut">Belum ada room.</p>
      ) : (
        <table className="stf-tabel">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Skenario</th>
              <th>Status</th>
              <th>Peserta</th>
              <th>Dibuat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.code}>
                <td className="mono">{r.code}</td>
                <td>
                  {neutralText(r.scenarioTitle)} <small>v{r.versionNo}</small>
                </td>
                <td>{r.status === 'interrupted' ? `dihentikan — ${r.closedReason ? CLOSED_REASON_LABEL[r.closedReason as StoryClosedReason] ?? r.closedReason : '-'}` : r.status}</td>
                <td>{r.participants}</td>
                <td>{formatTime(r.createdAt)}</td>
                <td>
                  {r.status === 'lobby' || r.status === 'running' ? (
                    <button type="button" className="btn btn-kecil" onClick={() => onControl(r.code)}>
                      Kendalikan
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RoomControl({ room: raw, now, act, onLeave }: { room: StoryPublicState; now: () => number; act: (event: string, payload?: Record<string, unknown>) => Promise<void>; onLeave: () => void }) {
  const neutral = t('ruang.namaUmum');
  const room = useMemo(() => personalizePublicState(raw, neutral), [raw, neutral]);
  const config = useAppConfig();
  const link = joinLink(room.code, config.status === 'ready' ? config.config : null);
  const closed = CLOSED_PHASES.includes(room.phase);
  const [confirm, setConfirm] = useState<{ kind: 'close' } | { kind: 'remove'; id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (event: string, payload?: Record<string, unknown>) => {
    setBusy(true);
    await act(event, payload);
    setBusy(false);
  };
  const next = nextAction(room);
  return (
    <div className="stf-room">
      <section className="stf-kartu stf-room-kode">
        <KodeRoom code={room.code} />
        <QrCode value={link} size={180} />
        <p className="mono stf-kecil">{link}</p>
        <a className="btn btn-garis btn-kecil" href={withBase(`/projector?room=${room.code}`)} target="_blank" rel="noopener">
          Buka layar acara
        </a>
        <button type="button" className="btn btn-netral btn-kecil" onClick={onLeave}>
          Kembali ke daftar room
        </button>
      </section>
      <section className="stf-kartu stf-room-kendali">
        <h2>{room.scenario.title}</h2>
        <p className="stf-lembut">
          {room.scenario.categoryName} · versi {room.scenario.versionNo}
          {room.scenario.contentKind === 'demo' ? ' · DEMO' : ''}
        </p>
        <p className="stf-fase">
          <b>{PHASE_LABEL[room.phase]}</b>
          {room.phase !== 'lobby' ? ` · babak ${room.roundNumber}/${room.totalRounds}` : ''}
        </p>
        {room.scene && !closed ? <CurrentRound scene={room.scene} /> : null}
        {room.phase === 'answering' ? <AnswerTimer endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={now} /> : null}
        {!closed && room.phase !== 'answering' && room.phaseEndsAt !== null ? (
          <PhaseCountdown endsAt={room.phaseEndsAt} durationMs={room.phaseDurationMs} now={now} render={(n) => <p className="stf-lembut">Fase berikutnya otomatis dalam {n} detik.</p>} />
        ) : null}
        <dl className="stf-angka">
          <div>
            <dt>Peserta</dt>
            <dd>
              {room.participantCount}/{room.maxParticipants}
            </dd>
          </div>
          <div>
            <dt>Tersambung</dt>
            <dd>{room.connectedCount}</dd>
          </div>
          {room.phase === 'scene' ? (
            <div>
              <dt>Siap</dt>
              <dd>{room.readyCount}</dd>
            </div>
          ) : null}
          {room.phase === 'answering' || room.phase === 'consequence' ? (
            <div>
              <dt>Menjawab</dt>
              <dd>
                {room.answeredCount}/{room.eligibleCount}
              </dd>
            </div>
          ) : null}
        </dl>
        {room.phase === 'answering' ? <p className="stf-lembut">Babak ditutup otomatis begitu semua peserta terdaftar menjawab, atau saat 30 detik habis.</p> : null}
        <div className="stf-tombol">
          {next ? (
            <button type="button" className="btn btn-utama" disabled={busy || next.disabled} onClick={() => void run(next.event, { phase: room.phase, roundNumber: room.roundNumber })}>
              {next.label}
            </button>
          ) : null}
          {!closed ? (
            <label className="stf-centang">
              <input type="checkbox" checked={room.autoAdvance} onChange={(e) => void run('host:auto', { on: e.target.checked })} />
              <span>Lanjut otomatis setelah peringkat</span>
            </label>
          ) : null}
          {!closed ? (
            <button type="button" className="btn btn-bahaya" disabled={busy} onClick={() => setConfirm({ kind: 'close' })}>
              Tutup room
            </button>
          ) : null}
        </div>
      </section>
      <section className="stf-kartu stf-room-peserta">
        <h2>Peserta ({room.participantCount})</h2>
        {room.participants.length === 0 ? (
          <p className="stf-lembut">Belum ada peserta.</p>
        ) : (
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Koneksi</th>
                {room.phase === 'scene' ? <th>Siap</th> : null}
                {room.phase === 'answering' ? <th>Sudah menjawab</th> : null}
                <th />
              </tr>
            </thead>
            <tbody>
              {room.participants.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.connected ? 'tersambung' : 'terputus'}</td>
                  {room.phase === 'scene' ? <td>{p.ready ? 'ya' : '—'}</td> : null}
                  {room.phase === 'answering' ? <td>{p.answered ? 'ya' : '—'}</td> : null}
                  <td>
                    {!closed ? (
                      <button type="button" className="btn btn-netral btn-kecil" onClick={() => setConfirm({ kind: 'remove', id: p.id, name: p.name })}>
                        Keluarkan
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {room.rankings?.length ? (
        <section className="stf-kartu">
          <h2>{closed ? 'Peringkat akhir' : 'Peringkat sementara'}</h2>
          <RankList rows={room.rankings} limit={20} />
        </section>
      ) : null}
      {confirm ? (
        <Modal
          judul={confirm.kind === 'close' ? 'Tutup room ini?' : `Keluarkan ${confirm.name}?`}
          onTutup={() => setConfirm(null)}
          aksi={
            <>
              <button type="button" className="btn btn-netral" onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-bahaya"
                onClick={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c.kind === 'close') void run('host:close');
                  else void run('host:remove', { participantId: c.id });
                }}
              >
                {confirm.kind === 'close' ? 'Ya, tutup room' : 'Ya, keluarkan'}
              </button>
            </>
          }
        >
          <p>
            {confirm.kind === 'close'
              ? 'Sesi dihentikan untuk semua peserta dan tidak bisa dibuka lagi. Keputusan yang sudah tercatat tetap tersimpan sebagai sesi terhenti.'
              : 'Peserta ini keluar dari room dan tidak bisa masuk lagi dengan identitas yang sama (mis. nama tidak pantas). Babak yang sudah dinilai tetap tercatat.'}
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

/**
 * The round in progress: title, meta and key badge, then what participants do in it — the activity (the CMS layout
 * name), how many shared evidence items they can open, and the label of their confirm button — and the items
 * themselves, each with its label and title, numbered as on the field scene and the event screen, so the host can brief
 * the room ("buka Surat nomor 2, lalu tekan Ajukan berkas").
 */
function CurrentRound({ scene }: { scene: StoryScenePublic }) {
  return (
    <>
      <p className="stf-babak-kini">
        <span>{scene.title}</span>
        {scene.meta ? <span className="stf-kecil">{scene.meta}</span> : null}
        {scene.keyRound ? (
          <span className="sr-tanda-kunci">
            <span aria-hidden="true">★</span> Babak kunci
          </span>
        ) : null}
      </p>
      <dl className="stf-angka" data-kegiatan={scene.layout}>
        <div>
          <dt>Kegiatan peserta</dt>
          <dd>{LAYOUT_LABEL[scene.layout]}</dd>
        </div>
        <div>
          <dt>Berkas bersama</dt>
          <dd>{scene.evidence.length}</dd>
        </div>
        <div>
          <dt>Tombol peserta</dt>
          <dd>{actionLabelOf(scene, t)}</dd>
        </div>
      </dl>
      {scene.evidence.length ? (
        <ol aria-label="Berkas bersama">
          {scene.evidence.map((e) => (
            <li key={e.id}>
              <span className="stf-lencana">{evidenceLabel(e)}</span> {e.title}
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}

function nextAction(room: StoryPublicState): { event: string; label: string; disabled: boolean } | null {
  switch (room.phase) {
    case 'lobby':
      return { event: 'host:start', label: 'Mulai cerita', disabled: room.participantCount === 0 };
    case 'scene':
      return { event: 'host:next', label: 'Buka pilihan sekarang', disabled: false };
    case 'answering':
      return { event: 'host:next', label: 'Menunggu jawaban…', disabled: true };
    case 'consequence':
      return { event: 'host:next', label: room.roundNumber >= room.totalRounds ? 'Tampilkan hasil akhir' : 'Lanjut ke peringkat', disabled: false };
    case 'leaderboard':
      return { event: 'host:next', label: 'Babak berikutnya', disabled: false };
    default:
      return null;
  }
}
