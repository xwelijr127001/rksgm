/**
 * Admin (/admin): competition reports for the competition admin (PRD FR-D3–D6, FR-E1–E2), users/roles for the system
 * admin (FR-E3), and the audit log. Each tab is shown by role; every API call is authorized again by the server.
 */
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { can, type StaffIdentity } from '@shared/story/roles';
import { StaffShell } from '../../story/ui/StaffShell';
import { Audit } from './Audit';
import { Periods } from './Periods';
import { Reports } from './Reports';
import { Users } from './Users';
import './admin.css';

export default function AdminApp() {
  return <StaffShell title="Admin & laporan" need={['readReports', 'manageUsers', 'readAudit']}>{(identity) => <Admin identity={identity} />}</StaffShell>;
}

function Admin({ identity }: { identity: StaffIdentity }) {
  const r = identity.roles;
  const home = can(r, 'readReports') ? '/admin/dasbor' : can(r, 'manageUsers') ? '/admin/pengguna' : '/admin/audit';
  const tab = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'aktif' : '')}>
      {label}
    </NavLink>
  );
  return (
    <main className="stf-isi">
      <nav className="stf-tab" aria-label="Bagian admin">
        {can(r, 'readReports') ? (
          <>
            {tab('/admin/dasbor', 'Dasbor')}
            {tab('/admin/rekap', 'Rekap hasil')}
            {tab('/admin/analitik', 'Analisis babak')}
            {tab('/admin/room', 'Room')}
            {tab('/admin/periode', 'Periode kompetisi')}
          </>
        ) : null}
        {can(r, 'manageUsers') ? tab('/admin/pengguna', 'Pengguna & peran') : null}
        {can(r, 'readAudit') ? tab('/admin/audit', 'Log audit') : null}
      </nav>
      <Routes>
        <Route index element={<Navigate to={home} replace />} />
        {can(r, 'readReports') ? (
          <>
            <Route path="dasbor" element={<Reports view="dashboard" />} />
            <Route path="rekap" element={<Reports view="results" />} />
            <Route path="analitik" element={<Reports view="analytics" />} />
            <Route path="room" element={<Reports view="rooms" />} />
            <Route path="periode" element={<Periods canManage={can(r, 'managePeriods')} />} />
          </>
        ) : null}
        {can(r, 'manageUsers') ? <Route path="pengguna" element={<Users self={identity} />} /> : null}
        {can(r, 'readAudit') ? <Route path="audit" element={<Audit />} /> : null}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </main>
  );
}
