/**
 * Competition periods (PRD FR-D5): name + start/end. A room belongs to a period when it STARTED inside it (start
 * inclusive, end exclusive); periods may not overlap. Changes are audited.
 */
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import type { PeriodView } from '@shared/story/dto';
import { staffApi } from '../../story/staff';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';

/** <input type="datetime-local"> value (local time) <-> epoch ms. */
const toLocalInput = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : NaN);

interface Draft {
  name: string;
  startsAt: string;
  endsAt: string;
  note: string;
}

export function Periods({ canManage }: { canManage: boolean }) {
  const [rows, setRows] = useState<PeriodView[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const load = useCallback(async () => {
    const r = await staffApi<{ periods: PeriodView[] }>('GET', '/api/admin/periods');
    if (r.ok) setRows(r.data.periods);
    else setMsg({ kind: 'error', text: r.error });
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async (d: Draft, id: string | null) => {
    const body = { name: d.name, startsAt: fromLocalInput(d.startsAt), endsAt: fromLocalInput(d.endsAt), note: d.note };
    const r = await staffApi<{ period: PeriodView }>(id ? 'PUT' : 'POST', id ? `/api/admin/periods/${id}` : '/api/admin/periods', body);
    if (r.ok) {
      setEditing(null);
      setMsg({ kind: 'ok', text: id ? 'Periode diperbarui.' : 'Periode dibuat.' });
      void load();
      return true;
    }
    setMsg({ kind: 'error', text: r.error });
    return false;
  };
  return (
    <>
      <h1>Periode kompetisi</h1>
      <p className="stf-kecil">Room masuk periode bila waktu mulainya ada di antara mulai (termasuk) dan selesai (tidak termasuk). Hasil di luar periode tetap tersimpan sebagai arsip. Aturan pemenang nasional & verifikasi identitas hadiah belum ditetapkan pemilik produk.</p>
      <ActionMessage message={msg} />
      {canManage ? <PeriodForm title="Periode baru" onSave={(d) => save(d, null)} /> : null}
      <section className="stf-kartu">
        {!rows ? (
          <p className="stf-lembut">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="stf-lembut">Belum ada periode.</p>
        ) : (
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Catatan</th>
                {canManage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) =>
                editing === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={canManage ? 5 : 4}>
                      <PeriodForm title={`Ubah ${p.name}`} initial={p} onSave={(d) => save(d, p.id)} onCancel={() => setEditing(null)} />
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{formatTime(p.startsAt)}</td>
                    <td>{formatTime(p.endsAt)}</td>
                    <td>{p.note}</td>
                    {canManage ? (
                      <td>
                        <button type="button" className="btn btn-netral btn-kecil" onClick={() => setEditing(p.id)}>
                          Ubah
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function PeriodForm({ title, initial, onSave, onCancel }: { title: string; initial?: PeriodView; onSave: (d: Draft) => Promise<boolean>; onCancel?: () => void }) {
  const id = useId();
  const [d, setD] = useState<Draft>(() => ({
    name: initial?.name ?? '',
    startsAt: initial ? toLocalInput(initial.startsAt) : '',
    endsAt: initial ? toLocalInput(initial.endsAt) : '',
    note: initial?.note ?? '',
  }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await onSave(d)) if (!initial) setD({ name: '', startsAt: '', endsAt: '', note: '' });
  };
  const body = (
    <form onSubmit={submit} className="stf-grid">
      <div className="stf-isian">
        <label htmlFor={id + 'n'}>Nama</label>
        <input id={id + 'n'} className="kolom" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required maxLength={80} />
      </div>
      <div className="stf-isian">
        <label htmlFor={id + 's'}>Mulai</label>
        <input id={id + 's'} className="kolom" type="datetime-local" value={d.startsAt} onChange={(e) => setD({ ...d, startsAt: e.target.value })} required />
      </div>
      <div className="stf-isian">
        <label htmlFor={id + 'e'}>Selesai</label>
        <input id={id + 'e'} className="kolom" type="datetime-local" value={d.endsAt} onChange={(e) => setD({ ...d, endsAt: e.target.value })} required />
      </div>
      <div className="stf-isian">
        <label htmlFor={id + 'c'}>Catatan</label>
        <input id={id + 'c'} className="kolom" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} maxLength={400} />
      </div>
      <div className="stf-tombol">
        <button className="btn" type="submit">
          Simpan
        </button>
        {onCancel ? (
          <button className="btn btn-netral" type="button" onClick={onCancel}>
            Batal
          </button>
        ) : null}
      </div>
    </form>
  );
  return initial ? (
    body
  ) : (
    <details className="stf-kartu">
      <summary>
        <b>+ {title}</b>
      </summary>
      {body}
    </details>
  );
}
