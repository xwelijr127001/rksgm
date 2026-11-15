/** Audit log (read-only): who did which administrative/editorial action when (login, roles, publish, periods…). */
import { useCallback, useEffect, useState } from 'react';
import type { AuditRow } from '@shared/story/dto';
import { staffApi } from '../../story/staff';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';

export function Audit() {
  const [action, setAction] = useState('');
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const q = new URLSearchParams({ limit: '300' });
    if (action.trim()) q.set('action', action.trim());
    const r = await staffApi<{ audit: AuditRow[] }>('GET', `/api/admin/audit?${q.toString()}`);
    if (r.ok) setRows(r.data.audit);
    else setError(r.error);
  }, [action]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <div className="stf-judul-baris">
        <h1>Log audit</h1>
        <label className="cms-filter">
          <span>Tindakan</span>
          <input className="kolom" value={action} onChange={(e) => setAction(e.target.value)} placeholder="mis. scenario.publish" />
        </label>
      </div>
      <ActionMessage message={error ? { kind: 'error', text: error } : null} />
      {!rows ? (
        <p className="stf-lembut">Memuat…</p>
      ) : (
        <div className="stf-gulir">
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pelaku</th>
                <th>Tindakan</th>
                <th>Sasaran</th>
                <th>Rincian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{formatTime(a.at)}</td>
                  <td>{a.actorName}</td>
                  <td className="mono">{a.action}</td>
                  <td className="mono">
                    {a.targetType}:{a.targetId}
                  </td>
                  <td className="adm-rincian">{Object.keys(a.detail).length ? JSON.stringify(a.detail) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
