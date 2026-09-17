/**
 * Router RAKSA GAME.
 *
 * Alur pemain  : / -> /join -> /lobby -> /tutorial -> /main -> /hasil
 * Alur host    : /host
 * Layar besar  : /projector
 * Mode latihan : /latihan  (terpisah dari kompetisi)
 */

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Phase } from '@shared/types';
import { AudioUnlocker, Memuat } from './ui/kit';
import { bootstrapHost, bootstrapPlayer, initConnection, useGame } from './state/store';

const Landing = lazy(() => import('./pages/Landing'));
const Join = lazy(() => import('./pages/Join'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Tutorial = lazy(() => import('./pages/Tutorial'));
const Play = lazy(() => import('./pages/Play'));
const Result = lazy(() => import('./pages/Result'));
const Practice = lazy(() => import('./pages/Practice'));
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

export default function App() {
  return (
    <BrowserRouter>
      <AudioUnlocker />
      <Bootstrap />
      <PhaseRouter />
      <Suspense
        fallback={
          <div className="wrap" style={{ paddingTop: 48 }}>
            <Memuat teks="Menyiapkan game..." />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<Join />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/main" element={<Play />} />
          <Route path="/hasil" element={<Result />} />
          <Route path="/latihan" element={<Practice />} />
          <Route path="/host" element={<Host />} />
          <Route path="/projector" element={<Projector />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
