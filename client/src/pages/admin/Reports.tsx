/**
 * Competition reports. One filter bar (period / scenario / version / demo / interrupted) drives the dashboard
 * (FR-E1), cross-room results + CSV export (FR-D3, D4), round analytics (FR-E2) and the room list. Definitions and
 * denominators come from the server so the numbers can be audited; unmeasurable PRD metrics are labeled, not faked.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dashboard, PeriodView, ReportScenario, ResultRow, RoomListRow, RoundAnalytics } from '@shared/story/dto';
import { ENDING_KINDS, type EndingKind } from '@shared/story/content';
import { CLOSED_REASON_LABEL, ENDING_KIND_LABEL, type StoryClosedReason } from '@shared/story/protocol';
import { staffApi, staffCan, staffDownload } from '../../story/staff';
import { Modal } from '../../ui/kit';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';

export type ReportView = 'dashboard' | 'results' | 'analytics' | 'rooms';

interface Filter {
  periodId: string;
  scenarioId: string;
  versionId: string;
  includeDemo: boolean;
  includeInterrupted: boolean;
}

const DEFAULT_FILTER: Filter = { periodId: '', scenarioId: '', versionId: '', includeDemo: false, includeInterrupted: true };

function query(f: Filter): string {
  const q = new URLSearchParams();
  if (f.periodId) q.set('periodId', f.periodId);
  if (f.scenarioId) q.set('scenarioId', f.scenarioId);
  if (f.versionId) q.set('versionId', f.versionId);
  if (f.includeDemo) q.set('includeDemo', '1');
  if (!f.includeInterrupted) q.set('includeInterrupted', '0');
  return q.toString();
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 1000) / 10}%`);
const num = (v: number | null) => (v === null ? '—' : v.toLocaleString('id-ID'));
/** The ending in the staff's words (the CSV export keeps the stored kind). */
const endingLabel = (kind: string | null) => (kind === null ? '—' : (ENDING_KINDS as readonly string[]).includes(kind) ? ENDING_KIND_LABEL[kind as EndingKind] : kind);
const duration = (ms: number | null) => (ms === null ? '—' : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}d`);

export function Reports({ view }: { view: ReportView }) {
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [periods, setPeriods] = useState<PeriodView[]>([]);
  const [scenarios, setScenarios] = useState<ReportScenario[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  useEffect(() => {
    void Promise.all([staffApi<{ periods: PeriodView[] }>('GET', '/api/admin/periods'), staffApi<{ scenarios: ReportScenario[] }>('GET', '/api/admin/scenarios')]).then(([p, s]) => {
      if (p.ok) setPeriods(p.data.periods);
      if (s.ok) setScenarios(s.data.scenarios);
    });
  }, []);
  const q = query(filter);
  return (
    <>
      <FilterBar filter={filter} setFilter={setFilter} periods={periods} scenarios={scenarios} showInterrupted={view !== 'dashboard'} />
      <ActionMessage message={msg} />
      {view === 'dashboard' ? <DashboardView q={q} onError={(text) => setMsg({ kind: 'error', text })} /> : null}
      {view === 'results' ? <ResultsView q={q} onMessage={setMsg} /> : null}
      {view === 'analytics' ? <AnalyticsView q={q} onError={(text) => setMsg({ kind: 'error', text })} /> : null}
      {view === 'rooms' ? <RoomsView /> : null}
    </>
  );
}

function FilterBar({ filter, setFilter, periods, scenarios, showInterrupted }: { filter: Filter; setFilter: (f: Filter) => void; periods: PeriodView[]; scenarios: ReportScenario[]; showInterrupted: boolean }) {
  const versions = scenarios.find((s) => s.id === filter.scenarioId)?.versions ?? [];
  return (
    <section className="stf-kartu adm-filter" aria-label="Filter laporan">
      <label className="stf-isian">
        <span>Periode</span>
        <select className="kolom" value={filter.periodId} onChange={(e) => setFilter({ ...filter, periodId: e.target.value })}>
          <option value="">Semua waktu</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="outside">Di luar periode kompetisi</option>
        </select>
      </label>
      <label className="stf-isian">
        <span>Skenario</span>
        <select className="kolom" value={filter.scenarioId} onChange={(e) => setFilter({ ...filter, scenarioId: e.target.value, versionId: '' })}>
          <option value="">Semua skenario</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      {versions.length ? (
        <label className="stf-isian">
          <span>Versi</span>
          <select className="kolom" value={filter.versionId} onChange={(e) => setFilter({ ...filter, versionId: e.target.value })}>
            <option value="">Semua versi</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Versi {v.versionNo}
                {v.status === 'withdrawn' ? ' (ditarik)' : v.status === 'superseded' ? ' (lama)' : ''}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="stf-centang">
        <input type="checkbox" checked={filter.includeDemo} onChange={(e) => setFilter({ ...filter, includeDemo: e.target.checked })} />
        <span>Sertakan konten DEMO</span>
      </label>
      {showInterrupted ? (
        <label className="stf-centang">
          <input type="checkbox" checked={filter.includeInterrupted} onChange={(e) => setFilter({ ...filter, includeInterrupted: e.target.checked })} />
          <span>Sertakan room terhenti</span>
        </label>
      ) : null}
    </section>
  );
}

function useReport<T>(path: string, onError: (text: string) => void): T | null {
  const [data, setData] = useState<T | null>(null);
  const load = useCallback(async () => {
    setData(null);
    const r = await staffApi<T>('GET', path);
    if (r.ok) setData(r.data);
    else onError(r.error);
    // onError only forwards to a stable state setter; refetching for every new arrow identity would loop renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  useEffect(() => {
    void load();
  }, [load]);
  return data;
}

function DashboardView({ q, onError }: { q: string; onError: (text: string) => void }) {
  const data = useReport<{ dashboard: Dashboard }>(`/api/admin/dashboard?${q}`, onError);
  if (!data) return <p className="stf-lembut">Memuat…</p>;
  const d = data.dashboard;
  const cards: { label: string; value: string; def?: string }[] = [
    { label: 'Room dimulai', value: num(d.roomsStarted), def: d.definitions.room },
    { label: 'Room selesai', value: num(d.roomsFinished) },
    { label: 'Room terhenti', value: num(d.roomsInterrupted) },
    { label: 'Room sedang berjalan', value: num(d.roomsRunning), def: d.definitions.running },
    { label: 'Peserta (entri nama)', value: num(d.participants), def: d.definitions.participants },
    { label: 'Menyelesaikan sesi', value: num(d.completedParticipants) },
    { label: 'Tingkat penyelesaian', value: pct(d.completionRate), def: d.definitions.completionRate },
    { label: 'Rata-rata nilai', value: num(d.averageScore), def: d.definitions.averageScore },
  ];
  return (
    <>
      <h1>Dasbor</h1>
      <div className="adm-kartu-angka">
        {cards.map((c) => (
          <div key={c.label} className="stf-kartu">
            <span className="stf-kecil">{c.label}</span>
            <b>{c.value}</b>
            {c.def ? <small className="stf-kecil">{c.def}</small> : null}
          </div>
        ))}
      </div>
      <section className="stf-kartu">
        <h2>Per skenario & versi</h2>
        <p className="stf-kecil">Skenario/versi berbeda tidak diperingkat sebagai satu kompetisi nasional: aturan pemenang nasional belum ditetapkan.</p>
        <div className="stf-gulir">
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Skenario</th>
                <th>Versi</th>
                <th>Jenis</th>
                <th className="angka">Room</th>
                <th className="angka">Peserta</th>
                <th className="angka">Rata-rata nilai</th>
              </tr>
            </thead>
            <tbody>
              {d.byScenario.map((s) => (
                <tr key={s.versionId}>
                  <td>{s.title}</td>
                  <td>{s.versionNo}</td>
                  <td>{s.contentKind === 'demo' ? 'DEMO' : 'resmi'}</td>
                  <td className="angka">{s.rooms}</td>
                  <td className="angka">{s.participants}</td>
                  <td className="angka">{num(s.averageScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="stf-kartu">
        <h2>Definisi</h2>
        <dl className="adm-definisi">
          {Object.entries(d.definitions).map(([k, v]) => (
            <div key={k}>
              <dt className="mono">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function ResultsView({ q, onMessage }: { q: string; onMessage: (m: { kind: 'ok' | 'error'; text: string }) => void }) {
  const data = useReport<{ results: ResultRow[]; total: number; truncated: boolean }>(`/api/admin/results?${q}`, (text) => onMessage({ kind: 'error', text }));
  const download = async () => {
    const err = await staffDownload(`/api/admin/results.csv?${q}`, 'rekap-raksa-game-917.csv');
    if (err) onMessage({ kind: 'error', text: err });
  };
  return (
    <>
      <div className="stf-judul-baris">
        <h1>Rekap hasil lintas room</h1>
        <button type="button" className="btn" onClick={() => void download()}>
          Unduh CSV
        </button>
      </div>
      <p className="stf-kecil">Peringkat adalah peringkat di dalam room masing-masing. Nama peserta adalah isian bebas (tanpa akun): satu nama bukan berarti satu orang unik. CSV aman dibuka di spreadsheet (sel diawali = + - @ dinetralkan).</p>
      {data?.truncated ? <p className="stf-peringatan">Menampilkan {data.results.length.toLocaleString('id-ID')} dari {data.total.toLocaleString('id-ID')} baris. Unduh CSV untuk rekap lengkap.</p> : null}
      {!data ? (
        <p className="stf-lembut">Memuat…</p>
      ) : data.results.length === 0 ? (
        <p className="stf-lembut">Tidak ada hasil untuk filter ini.</p>
      ) : (
        <div className="stf-gulir">
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Room</th>
                <th>Skenario</th>
                <th>Versi</th>
                <th>Periode</th>
                <th>Peserta</th>
                <th className="angka">Nilai</th>
                <th className="angka">Ketepatan</th>
                <th className="angka">Kecepatan</th>
                <th className="angka">Dijawab</th>
                <th className="angka">Waktu habis</th>
                <th className="angka">Peringkat room</th>
                <th>Status</th>
                <th>Akhir</th>
                <th>Mulai</th>
                <th>Durasi</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={`${r.roomCode}:${r.participantId}`}>
                  <td className="mono">{r.roomCode}</td>
                  <td>
                    {r.scenarioTitle}
                    {r.contentKind === 'demo' ? ' (DEMO)' : ''}
                  </td>
                  <td>{r.versionNo}</td>
                  <td>{r.periodName ?? 'di luar periode'}</td>
                  <td>{r.participantName}</td>
                  <td className="angka">{num(r.totalScore)}</td>
                  <td className="angka">{num(r.accuracyPoints)}</td>
                  <td className="angka">{num(r.speedPoints)}</td>
                  <td className="angka">{r.answeredCount}</td>
                  <td className="angka">{r.timeoutCount}</td>
                  <td className="angka">{r.roomRank === null ? '—' : `${r.roomRank}${r.rankTied ? ' (seri)' : ''}`}</td>
                  <td>{r.completed ? 'selesai' : r.roomStatus === 'interrupted' ? 'terhenti' : r.roomStatus}</td>
                  <td>{endingLabel(r.endingKind)}</td>
                  <td>{formatTime(r.startedAt)}</td>
                  <td>{duration(r.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AnalyticsView({ q, onError }: { q: string; onError: (text: string) => void }) {
  const data = useReport<{ analytics: RoundAnalytics[] }>(`/api/admin/analytics?${q}`, onError);
  const top = useMemo(() => {
    if (!data) return { wrong: [], timeout: [] };
    const all = data.analytics.flatMap((v) => v.rounds.map((r) => ({ ...r, scenario: v.scenarioTitle, versionNo: v.versionNo })));
    return {
      wrong: all.filter((r) => r.keliruRate !== null && r.keliru > 0).sort((a, b) => (b.keliruRate ?? 0) - (a.keliruRate ?? 0)).slice(0, 5),
      timeout: all.filter((r) => r.timeoutRate !== null && r.timeout > 0).sort((a, b) => (b.timeoutRate ?? 0) - (a.timeoutRate ?? 0)).slice(0, 5),
    };
  }, [data]);
  if (!data) return <p className="stf-lembut">Memuat…</p>;
  return (
    <>
      <h1>Analisis babak</h1>
      <p className="stf-kecil">Penyebut = keputusan tercatat (termasuk waktu habis). Pratinjau CMS dan konten DEMO tidak dihitung kecuali filter DEMO aktif. “Membingungkan” = lebih dari 75% keliru.</p>
      <div className="stf-dua-kolom">
        <TopList title="Paling sering keliru" rows={top.wrong.map((r) => ({ key: `${r.scenario}:${r.versionNo}:${r.roundIndex}`, label: `${r.scenario} v${r.versionNo} · babak ${r.roundIndex + 1}: ${r.title}`, value: pct(r.keliruRate) }))} />
        <TopList title="Paling sering waktu habis" rows={top.timeout.map((r) => ({ key: `${r.scenario}:${r.versionNo}:${r.roundIndex}`, label: `${r.scenario} v${r.versionNo} · babak ${r.roundIndex + 1}: ${r.title}`, value: pct(r.timeoutRate) }))} />
      </div>
      {data.analytics.map((v) => (
        <section key={v.versionId} className="stf-kartu">
          <h2>
            {v.scenarioTitle} · versi {v.versionNo}
          </h2>
          <div className="stf-gulir">
            <table className="stf-tabel">
              <thead>
                <tr>
                  <th>Babak</th>
                  <th className="angka">Keputusan</th>
                  <th className="angka">Tepat</th>
                  <th className="angka">Kurang tepat</th>
                  <th className="angka">Keliru</th>
                  <th className="angka">Waktu habis</th>
                  <th className="angka">% keliru</th>
                  <th className="angka">% waktu habis</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.rounds.map((r) => (
                  <tr key={r.roundId}>
                    <td>
                      {r.roundIndex + 1}. {r.title}
                    </td>
                    <td className="angka">{r.decisions}</td>
                    <td className="angka">{r.tepat}</td>
                    <td className="angka">{r.kurangTepat}</td>
                    <td className="angka">{r.keliru}</td>
                    <td className="angka">{r.timeout}</td>
                    <td className="angka">{pct(r.keliruRate)}</td>
                    <td className="angka">{pct(r.timeoutRate)}</td>
                    <td>{r.confusing ? <span className="stf-lencana stf-lencana-in_review">membingungkan</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

function TopList({ title, rows }: { title: string; rows: { key: string; label: string; value: string }[] }) {
  return (
    <section className="stf-kartu">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="stf-lembut">Belum ada data.</p>
      ) : (
        <ol className="adm-top">
          {rows.map((r) => (
            <li key={r.key}>
              <span>{r.label}</span> <b>{r.value}</b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RoomsView() {
  const [rooms, setRooms] = useState<RoomListRow[] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const load = useCallback(async () => {
    const r = await staffApi<{ rooms: RoomListRow[] }>('GET', '/api/admin/rooms');
    setRooms(r.ok ? r.data.rooms : []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const close = async (code: string) => {
    const r = await staffApi('POST', `/api/admin/rooms/${code}/close`, {});
    setMsg(r.ok ? { kind: 'ok', text: `Room ${code} ditutup.` } : { kind: 'error', text: r.error });
    void load();
  };
  const canClose = staffCan('closeRooms');
  return (
    <>
      <h1>Room</h1>
      <p className="stf-kecil">Room aktif yang ditinggal host (atau host-nya dinonaktifkan) dapat ditutup di sini; room yang menunggu host lebih dari 2 jam ditutup otomatis.</p>
      <ActionMessage message={msg} />
      {!rooms ? (
        <p className="stf-lembut">Memuat…</p>
      ) : (
        <div className="stf-gulir">
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Skenario</th>
                <th>Versi</th>
                <th>Jenis</th>
                <th>Status</th>
                <th className="angka">Peserta</th>
                <th>Dibuat</th>
                <th>Mulai</th>
                <th>Selesai</th>
                {canClose ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.code}>
                  <td className="mono">{r.code}</td>
                  <td>{r.scenarioTitle}</td>
                  <td>{r.versionNo}</td>
                  <td>{r.contentKind === 'demo' ? 'DEMO' : 'resmi'}</td>
                  <td>{r.status === 'interrupted' ? `terhenti — ${r.closedReason ? CLOSED_REASON_LABEL[r.closedReason as StoryClosedReason] ?? r.closedReason : '-'}` : r.status}</td>
                  <td className="angka">{r.participants}</td>
                  <td>{formatTime(r.createdAt)}</td>
                  <td>{formatTime(r.startedAt)}</td>
                  <td>{formatTime(r.finishedAt)}</td>
                  {canClose ? (
                    <td>
                      {r.status === 'lobby' || r.status === 'running' ? (
                        <button type="button" className="btn btn-netral btn-kecil" onClick={() => setConfirm(r.code)}>
                          Tutup
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirm ? (
        <Modal
          judul={`Tutup room ${confirm}?`}
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
                  const code = confirm;
                  setConfirm(null);
                  void close(code);
                }}
              >
                Ya, tutup room
              </button>
            </>
          }
        >
          <p>Sesi dihentikan untuk semua peserta dan tidak bisa dibuka lagi. Keputusan yang sudah tercatat tetap tersimpan.</p>
        </Modal>
      ) : null}
    </>
  );
}
