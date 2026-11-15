/**
 * CMS konten cerita (/cms) for Tim Story/Storyline (PRD FR-A1–A10, FR-E3–E6): scenario list, structured editor with
 * live validation and preview, review/publication workflow, asset library and categories. Every action is authorized
 * by the server; the role checks here only choose what to show. Guide: docs/prd-v02/CMS-GUIDE.md.
 */
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { can, type StaffIdentity } from '@shared/story/roles';
import { StaffShell } from '../../story/ui/StaffShell';
import { AssetLibrary } from './AssetLibrary';
import { Categories } from './Categories';
import { ScenarioEditor } from './ScenarioEditor';
import { ScenarioList } from './ScenarioList';
import './cms.css';

export default function CmsApp() {
  return <StaffShell title="CMS konten cerita" need={['readScenarios', 'readAssets', 'manageCategories']} resumable>{(identity) => <Cms identity={identity} />}</StaffShell>;
}

function Cms({ identity }: { identity: StaffIdentity }) {
  const roles = identity.roles;
  return (
    <main className="stf-isi">
      <nav className="stf-tab" aria-label="Bagian CMS">
        {can(roles, 'readScenarios') ? (
          <NavLink end to="/cms" className={({ isActive }) => (isActive ? 'aktif' : '')}>
            Skenario
          </NavLink>
        ) : null}
        {can(roles, 'readAssets') ? (
          <NavLink to="/cms/aset" className={({ isActive }) => (isActive ? 'aktif' : '')}>
            Pustaka aset
          </NavLink>
        ) : null}
        <NavLink to="/cms/kategori" className={({ isActive }) => (isActive ? 'aktif' : '')}>
          Kategori
        </NavLink>
      </nav>
      <Routes>
        <Route index element={can(roles, 'readScenarios') ? <ScenarioList identity={identity} /> : <Navigate to="/cms/kategori" replace />} />
        <Route path="skenario/:id" element={<ScenarioEditor identity={identity} />} />
        <Route path="aset" element={<AssetLibrary identity={identity} />} />
        <Route path="kategori" element={<Categories identity={identity} />} />
        <Route path="*" element={<Navigate to="/cms" replace />} />
      </Routes>
    </main>
  );
}
