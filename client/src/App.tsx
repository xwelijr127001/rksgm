/**
 * Router RAKSA GAME.
 *
 * Alur acara   : / -> /join -> /lobby -> /tutorial -> /main -> /hasil
 * Alur solo    : / -> /kenalan -> /solo -> /solo/main?misi=N -> /solo/hasil
 * Mode cerita  : / -> /cerita -> /cerita/:episode (visual novel; docs/rancangan-mode-cerita.md)
 * Alur host    : /host
 * Layar besar  : /projector
 * /latihan (alamat lama) dialihkan ke mode solo. Rancangan: docs/rancangan-bank-soal.md
 */

import { Component, Suspense, lazy, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Phase } from '@shared/types';
import { AudioUnlocker, Memuat } from './ui/kit';
import { useHalaman } from './ui/halaman';
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
const Cerita = lazy(() => import('./pages/Cerita'));
const CeritaMain = lazy(() => import('./pages/CeritaMain'));
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

/**
 * Pesan ramah saat halaman gagal dimuat/dirender: judul (menerima fokus bila fokus hilang, juga lewat
 * useHalaman setelah navigasi), satu kalimat penyebab umum, tombol muat ulang, tautan halaman awal.
 * Sengaja TANPA PlayerShell: galatnya bisa berasal dari bagian bersama itu sendiri.
 */
function PesanGagalHalaman() {
  useBahasa();
  useHalaman(t('umum.gagalHalamanJudul'));
  const judul = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // Tombol/tautan yang tadi ditekan sudah hilang bersama halamannya: fokus ke judul pesan, bukan <body>.
    const aktif = document.activeElement;
    if (!aktif || aktif === document.body || !aktif.isConnected) judul.current?.focus({ preventScroll: true });
  }, []);
  return (
    <main className="wrap" style={{ paddingTop: 48, paddingBottom: 48, display: 'grid', gap: 16, justifyItems: 'start' }}>
      <h1 ref={judul} tabIndex={-1} data-fokus-halaman="" style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)', lineHeight: 1.2 }}>{t('umum.gagalHalamanJudul')}</h1>
      <p style={{ margin: 0, maxWidth: '40rem' }}>{t('umum.gagalHalamanIsi')}</p>
      <button type="button" className="primary-action" onClick={() => window.location.reload()}>{t('umum.muatUlangHalaman')}</button>
      {/* Tautan biasa (bukan <Link>): memuat aplikasi dari awal, jadi berkas versi terbaru ikut terambil. */}
      <a className="text-button" href="/">{t('umum.keHalamanAwal')}</a>
    </main>
  );
}

/**
 * Penangkap galat tingkat rute. Tanpa ini, potongan kode halaman (chunk lazy) yang gagal diunduh - jaringan
 * putus sesaat, atau deploy baru mengganti nama berkas - atau galat saat merender membuat seluruh layar putih.
 * React.lazy menyimpan kegagalan import(), jadi mencoba ulang di tempat tidak menolong: pesannya menawarkan
 * muat ulang halaman. Keadaan galat direset begitu alamat berganti (tombol kembali, tautan), supaya rute lain
 * tetap bisa dibuka.
 */
class BatasRute extends Component<{ alamat: string; children: ReactNode }, { galat: boolean; alamat: string }> {
  state = { galat: false, alamat: this.props.alamat };

  static getDerivedStateFromError(): Partial<{ galat: boolean }> {
    return { galat: true };
  }

  static getDerivedStateFromProps(p: { alamat: string }, s: { galat: boolean; alamat: string }): { galat: boolean; alamat: string } | null {
    return p.alamat !== s.alamat ? { galat: false, alamat: p.alamat } : null;
  }

  componentDidCatch(e: unknown, info: ErrorInfo): void {
    // Tetap tercatat di konsol untuk diagnosa (tanpa layanan eksternal).
    console.error('[rute] halaman gagal dimuat/dirender', e, info.componentStack);
  }

  render(): ReactNode {
    return this.state.galat ? <PesanGagalHalaman /> : this.props.children;
  }
}

/** Alamat (path + query) yang mereset BatasRute. */
function BatasRuteAlamat({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return <BatasRute alamat={loc.pathname + loc.search}>{children}</BatasRute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AudioUnlocker />
      <Bootstrap />
      <PhaseRouter />
      <BatasRuteAlamat>
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
            <Route path="/cerita" element={<Cerita />} />
            <Route path="/cerita/:episode" element={<CeritaMain />} />
            <Route path="/latihan" element={<AlihkanLatihan />} />
            <Route path="/host" element={<Host />} />
            <Route path="/projector" element={<Projector />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BatasRuteAlamat>
    </BrowserRouter>
  );
}
