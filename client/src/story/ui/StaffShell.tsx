/**
 * Frame of the internal staff tools (/host, /cms, /admin): sign-in form, role gate, tool navigation by role, and
 * sign-out. Staff tools are Indonesian-only (DECISIONS.md D-13). The gate only decides what to SHOW; every request is
 * authorized again by the server. A `resumable` tool (the CMS, whose editor holds unsaved work) stays mounted when the
 * session ends under it: the sign-in appears over it, and signing in again as the same staff member continues where
 * it was; another account starts the tool afresh.
 */
import { Fragment, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { can, ROLE_LABEL, type Capability, type StaffIdentity } from '@shared/story/roles';
import { Merek } from '../../components/Merek';
import { useHalaman } from '../../ui/halaman';
import { Memuat, Modal } from '../../ui/kit';
import { checkStaffSession, staffLogin, staffLogout, useStaff } from '../staff';
import '../staff.css';

const TOOLS: { to: string; label: string; caps: Capability[] }[] = [
  { to: '/host', label: 'Host room', caps: ['hostRooms'] },
  { to: '/cms', label: 'Konten (CMS)', caps: ['readScenarios', 'readAssets', 'manageCategories'] },
  { to: '/admin', label: 'Admin & laporan', caps: ['readReports', 'manageUsers', 'readAudit'] },
];

export function StaffShell({
  title,
  need,
  children,
  resumable = false,
}: {
  title: string;
  need: Capability[];
  children: (identity: StaffIdentity) => ReactNode;
  /** Keep the tool on screen, under a sign-in dialog, when the session ends under it (expiry, revocation). */
  resumable?: boolean;
}) {
  useHalaman(title);
  const staff = useStaff();
  // The staff member whose tool is on screen: kept through a session that ended under it, dropped on signing out.
  const [shown, setShown] = useState<StaffIdentity | null>(null);
  if (staff.status === 'signed_in' && shown !== staff.identity) setShown(staff.identity);
  if (staff.status === 'signed_out' && !staff.ended && shown !== null) setShown(null);
  useEffect(() => {
    void checkStaffSession();
  }, []);
  if (staff.status === 'unknown') {
    return (
      <div className="stf">
        <Memuat />
      </div>
    );
  }
  const resuming = staff.status === 'signed_out' && resumable && staff.ended === true && shown !== null;
  if (staff.status === 'signed_out' && !resuming) return <LoginForm title={title} reason={staff.reason} />;
  const identity = staff.status === 'signed_in' ? staff.identity : shown;
  if (!identity) return null;
  const allowed = need.some((c) => can(identity.roles, c));
  return (
    <div className="stf">
      <header className="stf-kepala">
        <Merek tautan={false} />
        <nav className="stf-alat" aria-label="Alat staf">
          {TOOLS.filter((tool) => tool.caps.some((c) => can(identity.roles, c))).map((tool) => (
            <NavLink key={tool.to} to={tool.to} className={({ isActive }) => (isActive ? 'aktif' : '')}>
              {tool.label}
            </NavLink>
          ))}
        </nav>
        <div className="stf-saya">
          <span>
            <b>{identity.displayName}</b>
            <small>{identity.roles.map((r) => ROLE_LABEL[r]).join(', ')}</small>
          </span>
          <button type="button" className="btn btn-netral btn-kecil" onClick={() => void staffLogout()}>
            Keluar
          </button>
        </div>
      </header>
      {allowed ? (
        // Keyed by account: the same member signing in again keeps the tool's state, another account starts afresh.
        <Fragment key={identity.id}>{children(identity)}</Fragment>
      ) : (
        <main className="stf-isi">
          <h1>{title}</h1>
          <p className="stf-galat" role="alert">
            Peran Anda ({identity.roles.map((r) => ROLE_LABEL[r]).join(', ')}) tidak memiliki akses ke halaman ini. Minta admin sistem menambahkan peran yang sesuai.
          </p>
        </main>
      )}
      {resuming ? (
        // Not dismissable: the tool behind it can do nothing until the staff member is signed in again.
        <Modal judul="Sesi berakhir" onTutup={() => undefined} lebar={440} aksi={<></>}>
          <p>Sesi staf Anda sudah berakhir. Masuk lagi untuk melanjutkan; isi layar ini, termasuk perubahan yang belum disimpan, tetap ada.</p>
          <SignInForm username={identity.username} />
        </Modal>
      ) : null}
    </div>
  );
}

function LoginForm({ title, reason }: { title: string; reason?: string }) {
  return (
    <div className="stf stf-masuk">
      <main className="stf-masuk-kartu">
        <Merek tautan={false} />
        <h1>{title}</h1>
        <p className="stf-lembut">Masuk dengan akun staf internal. Akun dibuat oleh admin sistem; peserta tidak memerlukan akun.</p>
        <SignInForm reason={reason} autoFocus />
      </main>
    </div>
  );
}

/** Username + password; `username` prefills the account whose session ended (the sign-in dialog over a resumable tool). */
function SignInForm({ reason, username: initial = '', autoFocus = false }: { reason?: string; username?: string; autoFocus?: boolean }) {
  const id = useId();
  const [username, setUsername] = useState(initial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(reason ?? null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = await staffLogin(username.trim(), password);
    setBusy(false);
    if (err) setError(err);
  };
  return (
    <form className="stf-masuk-form" onSubmit={submit}>
      <label htmlFor={id + 'u'}>Nama pengguna</label>
      <input id={id + 'u'} className="kolom" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus={autoFocus} />
      <label htmlFor={id + 'p'}>Kata sandi</label>
      <input id={id + 'p'} className="kolom" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      {error ? (
        <p className="stf-galat" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-utama btn-blok" type="submit" disabled={busy || !username || !password}>
        {busy ? 'Masuk…' : 'Masuk'}
      </button>
    </form>
  );
}

/** Small status line for staff actions (success / error), announced to screen readers. */
export function ActionMessage({ message }: { message: { kind: 'ok' | 'error'; text: string } | null }) {
  if (!message) return null;
  return (
    <p className={message.kind === 'ok' ? 'stf-ok' : 'stf-galat'} role={message.kind === 'ok' ? 'status' : 'alert'}>
      {message.text}
    </p>
  );
}

export function formatTime(ms: number | null): string {
  if (ms === null) return '—';
  return new Date(ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
