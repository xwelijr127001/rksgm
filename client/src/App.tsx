/**
 * Router RAKSA GAME.
 *
 * Alur acara   : / -> /join -> /lobby -> /tutorial -> /main -> /hasil
 * Alur solo    : / -> /kenalan -> /solo -> /solo/main?misi=N -> /solo/hasil
 * Alur host    : /host
 * Layar besar  : /projector
 * /latihan (alamat lama) dialihkan ke mode solo. Rancangan: docs/rancangan-bank-soal.md
 */

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Phase } from '@shared/types';
import { AudioUnlocker, Memuat } from './ui/kit';
import { t, useBahasa } from './i18n';
import { bootstrapHost, bootstrapPlayer, initConnection, useGame } from './state/store';

const Landing = lazy(() => import('./pages/Landing'));
const Join = lazy(() => import('./pages/Join'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Tutorial = lazy(() => import('./pages/Tutorial'));
const Play = lazy(() => import('./pages/Play'));
const Result = lazy(() => import('./pages/Result'));
const Kenalan = lazy(() => import('./pages/Kenalan'));
const Solo = lazy(() => import('./pages/Solo'));
const SoloMain = lazy(() => import('./pages/SoloMain'));
const SoloHasil = lazy(() => import('./pages/SoloHasil'));
const Host = lazy(() => import('./pages/Host'));
const Projector = lazy(() => import('./pages/Projector'));

/** Halaman pemain yang boleh dipindah otomatis mengikuti fase pertandingan. */
const RUTE_PEMAIN = ['/lobby', '/tutorial', '/main', '/hasil'];

export function routeForPhase(phase: Phase): string {
  switch (phase) {
    case 'LOBBY':
      return '/lobby';
    case 'TUTORIAL':
      return '/tutorial';
    case 'FINISHED':
      return '/hasil';
    default:
      return '/main';
  }
}

/** Pindahkan pemain ke halaman yang sesuai fase (host yang mengendalikan ronde). */
function PhaseRouter() {
  const { room, role } = useGame();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!room || role !== 'player') return;
    if (!RUTE_PEMAIN.includes(loc.pathname)) return;
    const target = routeForPhase(room.phase);
    if (target !== loc.pathname) nav(target, { replace: true });
  }, [room?.phase, role, loc.pathname, nav, room]);

  return null;
}

/** Sambungkan socket & pulihkan identitas saat aplikasi dibuka. */
function Bootstrap() {
  const loc = useLocation();

  useEffect(() => {
    initConnection();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (window.location.pathname.startsWith('/host')) {
      void bootstrapHost(room);
    } else if (RUTE_PEMAIN.includes(window.location.pathname)) {
      void bootstrapPlayer(room);
    }
    // sengaja hanya sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.dataset.rute = loc.pathname;
  }, [loc.pathname]);

  return null;
}

/** Alamat lama mode latihan: /latihan -> /solo, /latihan?misi=N -> /solo/main?misi=N. */
function AlihkanLatihan() {
  const [params] = useSearchParams();
  const misi = params.get('misi');
  return <Navigate to={misi ? '/solo/main?misi=' + encodeURIComponent(misi) : '/solo'} replace />;
}

/** Tampilan selagi halaman diunduh (teks ikut bahasa aktif). */
function Menyiapkan() {
  useBahasa();
  return (
    <div className="wrap" style={{ paddingTop: 48 }}>
      <Memuat teks={t('umum.menyiapkanGame')} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AudioUnlocker />
      <Bootstrap />
      <PhaseRouter />
      <Suspense fallback={<Menyiapkan />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<Join />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/main" element={<Play />} />
          <Route path="/hasil" element={<Result />} />
          <Route path="/kenalan" element={<Kenalan />} />
          <Route path="/solo" element={<Solo />} />
          <Route path="/solo/main" element={<SoloMain />} />
          <Route path="/solo/hasil" element={<SoloHasil />} />
          <Route path="/latihan" element={<AlihkanLatihan />} />
          <Route path="/host" element={<Host />} />
          <Route path="/projector" element={<Projector />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
