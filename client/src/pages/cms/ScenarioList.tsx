import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CategoryView, ScenarioDetail, ScenarioStatus, ScenarioSummary } from '@shared/story/dto';
import { can, type StaffIdentity } from '@shared/story/roles';
import { staffApi } from '../../story/staff';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';
import { STATUS_LABEL } from './labels';

/** Scenario list with status filter; authors create new scenarios here (blank skeleton, then the editor). */
export function ScenarioList({ identity }: { identity: StaffIdentity }) {
  const [status, setStatus] = useState<ScenarioStatus | ''>('');
  const [rows, setRows] = useState<ScenarioSummary[] | null>(null);
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const load = useCallback(async () => {
    const [s, c] = await Promise.all([staffApi<{ scenarios: ScenarioSummary[] }>('GET', `/api/cms/scenarios${status ? `?status=${status}` : ''}`), staffApi<{ categories: CategoryView[] }>('GET', '/api/cms/categories')]);
    if (s.ok) setRows(s.data.scenarios);
    else setMsg({ kind: 'error', text: s.error });
    if (c.ok) setCategories(c.data.categories);
  }, [status]);
  useEffect(() => {
    void load();
  }, [load]);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  return (
    <>
      <div className="stf-judul-baris">
        <h1>Skenario cerita</h1>
        <label className="cms-filter">
          <span>Status</span>
          <select className="kolom" value={status} onChange={(e) => setStatus(e.target.value as ScenarioStatus | '')}>
            <option value="">Semua</option>
            {(Object.keys(STATUS_LABEL) as ScenarioStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ActionMessage message={msg} />
      {can(identity.roles, 'editScenarios') ? <CreateScenario categories={categories} onError={(text) => setMsg({ kind: 'error', text })} /> : null}
      <section className="stf-kartu">
        {rows === null ? (
          <p className="stf-lembut">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="stf-lembut">Belum ada skenario{status ? ` berstatus ${STATUS_LABEL[status]}` : ''}.</p>
        ) : (
          <div className="stf-gulir">
            <table className="stf-tabel">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Sumber</th>
                  <th>Versi terbit</th>
                  <th>Revisi draf</th>
                  <th>Diubah</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/cms/skenario/${r.id}`}>{r.title}</Link>
                    </td>
                    <td>{catName(r.categoryId)}</td>
                    <td>
                      <span className={`stf-lencana stf-lencana-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td>{r.contentSource === 'demo' ? <span className="stf-lencana stf-lencana-demo">DEMO</span> : 'Kasus settled'}</td>
                    <td>{r.currentVersionNo ?? '—'}</td>
                    <td>{r.draftRevision}</td>
                    <td>{formatTime(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function CreateScenario({ categories, onError }: { categories: CategoryView[]; onError: (text: string) => void }) {
  const nav = useNavigate();
  const id = useId();
  const active = categories.filter((c) => c.active);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState<'settled_case' | 'demo'>('settled_case');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await staffApi<{ scenario: ScenarioDetail }>('POST', '/api/cms/scenarios', { title, categoryId: categoryId || active[0]?.id, contentSource: source });
    setBusy(false);
    if (res.ok) nav(`/cms/skenario/${res.data.scenario.id}`);
    else onError(res.error);
  };
  return (
    <details className="stf-kartu cms-buat">
      <summary>
        <b>+ Skenario baru</b>
      </summary>
      <form onSubmit={submit} className="stf-grid">
        <div className="stf-isian">
          <label htmlFor={id + 't'}>Judul</label>
          <input id={id + 't'} className="kolom" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required />
        </div>
        <div className="stf-isian">
          <label htmlFor={id + 'k'}>Kategori</label>
          <select id={id + 'k'} className="kolom" value={categoryId || active[0]?.id || ''} onChange={(e) => setCategoryId(e.target.value)}>
            {active.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <small>Hanya kategori aktif (MVP: Auto). HVC/Property belum aktif.</small>
        </div>
        <div className="stf-isian">
          <label htmlFor={id + 's'}>Sumber cerita</label>
          <select id={id + 's'} className="kolom" value={source} onChange={(e) => setSource(e.target.value === 'demo' ? 'demo' : 'settled_case')}>
            <option value="settled_case">Kasus klaim settled (wajib anonimisasi sebelum terbit)</option>
            <option value="demo">DEMO sintetis (tidak masuk rekap kompetisi)</option>
          </select>
          <small>Tidak bisa diubah setelah dibuat.</small>
        </div>
        <div className="stf-isian cms-buat-tombol">
          <button className="btn" type="submit" disabled={busy || !title.trim() || active.length === 0}>
            Buat draf
          </button>
        </div>
      </form>
    </details>
  );
}
