/**
 * Category master (PRD FR-A1): name + active status. MVP decision: only Auto is active; HVC and Property exist as
 * inactive future categories, Cargo is a recorded future request (DECISIONS.md D-02). Only the system admin changes
 * activation; everyone with CMS access can see the list.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CategoryView } from '@shared/story/dto';
import { can, type StaffIdentity } from '@shared/story/roles';
import { staffApi } from '../../story/staff';
import { ActionMessage } from '../../story/ui/StaffShell';

export function Categories({ identity }: { identity: StaffIdentity }) {
  const manage = can(identity.roles, 'manageCategories');
  const [rows, setRows] = useState<CategoryView[] | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const load = useCallback(async () => {
    const r = await staffApi<{ categories: CategoryView[] }>('GET', '/api/cms/categories');
    if (r.ok) setRows(r.data.categories);
    else setMsg({ kind: 'error', text: r.error });
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const toggle = async (c: CategoryView) => {
    const r = await staffApi<{ category: CategoryView }>('POST', `/api/cms/categories/${c.id}`, { active: !c.active });
    if (r.ok) {
      setMsg({ kind: 'ok', text: `${c.name} ${c.active ? 'dinonaktifkan' : 'diaktifkan'}.` });
      void load();
    } else setMsg({ kind: 'error', text: r.error });
  };
  return (
    <>
      <h1>Kategori cerita</h1>
      <p className="stf-kecil">
        Keputusan MVP: hanya kategori Auto yang aktif. HVC dan Property disiapkan nonaktif; Cargo tercatat sebagai permintaan masa depan. Mengaktifkan kategori baru memerlukan konten yang disetujui komite, bukan hanya tombol ini.
      </p>
      <ActionMessage message={msg} />
      <section className="stf-kartu">
        {rows === null ? (
          <p className="stf-lembut">Memuat…</p>
        ) : (
          <table className="stf-tabel">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Status</th>
                <th>Catatan</th>
                {manage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b> <span className="mono stf-kecil">{c.id}</span>
                  </td>
                  <td>{c.active ? 'Aktif' : 'Belum aktif'}</td>
                  <td>{c.note}</td>
                  {manage ? (
                    <td>
                      <button type="button" className="btn btn-netral btn-kecil" onClick={() => void toggle(c)}>
                        {c.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
