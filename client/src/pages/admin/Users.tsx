/**
 * Staff users & roles (PRD FR-E3, system admin only). Roles are explicit and combinable; every change is audited and
 * revokes the user's sessions where relevant (server). There are no default accounts: the first system admin is
 * created with the provisioning CLI (docs/prd-v02/ROLES-AND-PROVISIONING.md).
 */
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import type { StaffUserView } from '@shared/story/dto';
import { ROLE_LABEL, STAFF_ROLES, type StaffIdentity, type StaffRole } from '@shared/story/roles';
import { staffApi } from '../../story/staff';
import { ActionMessage, formatTime } from '../../story/ui/StaffShell';

type Msg = { kind: 'ok' | 'error'; text: string } | null;

function RoleChecks({ value, onChange, idPrefix }: { value: StaffRole[]; onChange: (r: StaffRole[]) => void; idPrefix: string }) {
  return (
    <fieldset className="adm-peran">
      <legend>Peran</legend>
      {STAFF_ROLES.map((r) => (
        <label key={r} className="stf-centang" htmlFor={idPrefix + r}>
          <input id={idPrefix + r} type="checkbox" checked={value.includes(r)} onChange={(e) => onChange(e.target.checked ? [...value, r] : value.filter((x) => x !== r))} />
          <span>{ROLE_LABEL[r]}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Users({ self }: { self: StaffIdentity }) {
  const [rows, setRows] = useState<StaffUserView[] | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const load = useCallback(async () => {
    const r = await staffApi<{ users: StaffUserView[] }>('GET', '/api/admin/users');
    if (r.ok) setRows(r.data.users);
    else setMsg({ kind: 'error', text: r.error });
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const done = (text: string) => {
    setMsg({ kind: 'ok', text });
    void load();
  };
  return (
    <>
      <h1>Pengguna & peran</h1>
      <p className="stf-kecil">
        Host tidak bisa mengubah konten; penulis tidak bisa membuka room; reviewer menerbitkan (tidak boleh karya sendiri); panitia kompetisi melihat laporan; admin sistem mengelola pengguna, aset, dan kategori. Gabungan peran harus disengaja.
      </p>
      <ActionMessage message={msg} />
      <CreateUser onDone={done} onError={(text) => setMsg({ kind: 'error', text })} />
      {!rows ? (
        <p className="stf-lembut">Memuat…</p>
      ) : (
        <div className="adm-pengguna">
          {rows.map((u) => (
            <UserCard key={u.id} user={u} isSelf={u.id === self.id} onDone={done} onError={(text) => setMsg({ kind: 'error', text })} />
          ))}
        </div>
      )}
    </>
  );
}

function CreateUser({ onDone, onError }: { onDone: (t: string) => void; onError: (t: string) => void }) {
  const id = useId();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await staffApi<{ user: StaffUserView }>('POST', '/api/admin/users', { username, displayName, password, roles });
    if (r.ok) {
      setUsername('');
      setDisplayName('');
      setPassword('');
      setRoles([]);
      onDone(`Akun ${r.data.user.username} dibuat.`);
    } else onError(r.error);
  };
  return (
    <details className="stf-kartu">
      <summary>
        <b>+ Akun staf baru</b>
      </summary>
      <form onSubmit={submit}>
        <div className="stf-grid">
          <div className="stf-isian">
            <label htmlFor={id + 'u'}>Nama pengguna</label>
            <input id={id + 'u'} className="kolom" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" required />
          </div>
          <div className="stf-isian">
            <label htmlFor={id + 'd'}>Nama tampilan</label>
            <input id={id + 'd'} className="kolom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="stf-isian">
            <label htmlFor={id + 'p'}>Kata sandi awal</label>
            <input id={id + 'p'} className="kolom" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <small>Minimal 10 karakter. Sampaikan lewat jalur aman; minta pengguna menggantinya.</small>
          </div>
        </div>
        <RoleChecks value={roles} onChange={setRoles} idPrefix={id + 'r'} />
        <button className="btn" type="submit" disabled={!username || !displayName || !password || roles.length === 0}>
          Buat akun
        </button>
      </form>
    </details>
  );
}

function UserCard({ user, isSelf, onDone, onError }: { user: StaffUserView; isSelf: boolean; onDone: (t: string) => void; onError: (t: string) => void }) {
  const id = useId();
  const [roles, setRoles] = useState<StaffRole[]>(user.roles);
  const [password, setPassword] = useState('');
  const changed = roles.length !== user.roles.length || roles.some((r) => !user.roles.includes(r));
  const call = async (method: string, path: string, body: unknown, ok: string) => {
    const r = await staffApi(method, path, body);
    if (r.ok) onDone(ok);
    else onError(r.error);
  };
  return (
    <article className={`stf-kartu${user.active ? '' : ' adm-nonaktif'}`}>
      <h3>
        {user.displayName} <span className="mono stf-kecil">{user.username}</span>
      </h3>
      <p className="stf-kecil">
        {user.active ? 'Aktif' : 'Nonaktif'} · dibuat {formatTime(user.createdAt)}
        {isSelf ? ' · akun Anda' : ''}
      </p>
      <RoleChecks value={roles} onChange={setRoles} idPrefix={id} />
      <div className="stf-tombol">
        <button type="button" className="btn btn-kecil" disabled={!changed || roles.length === 0} onClick={() => void call('PUT', `/api/admin/users/${user.id}/roles`, { roles }, `Peran ${user.username} diperbarui.`)}>
          Simpan peran
        </button>
        {!isSelf ? (
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => void call('POST', `/api/admin/users/${user.id}/active`, { active: !user.active }, user.active ? `${user.username} dinonaktifkan (sesi dicabut).` : `${user.username} diaktifkan.`)}>
            {user.active ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        ) : null}
      </div>
      <details className="cms-varian">
        <summary>Atur ulang kata sandi</summary>
        <div className="stf-isian">
          <label htmlFor={id + 'pw'}>Kata sandi baru</label>
          <input id={id + 'pw'} className="kolom" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <button
          type="button"
          className="btn btn-kecil"
          disabled={!password}
          onClick={() => {
            void call('POST', `/api/admin/users/${user.id}/password`, { password }, `Kata sandi ${user.username} diganti; sesi lamanya dicabut.`);
            setPassword('');
          }}
        >
          Ganti kata sandi
        </button>
      </details>
    </article>
  );
}
