/**
 * Router RAKSA GAME (docs/prd-v02/ARCHITECTURE.md §2).
 *
 * Selalu ada:
 *   Join Game    : / -> /join?room=KODE (nama + pemberitahuan) -> /room/:kode (room cerita PRD: 15 babak, hasil pribadi)
 *   Layar acara  : /projector?room=KODE
 *   Staf         : /host (host room) · /cms (konten) · /admin (laporan, periode, pengguna)
 *   Mode Cerita  : /kenalan -> /cerita (daftar episode) -> /cerita/:episode (main sendiri, progres di perangkat)
 *                  Arahan pemilik 2 Nov 2026: pengalaman cerita solo kembali menjadi jalur utama di samping Join Game.
 * Mode lama — HANYA bila server RAKSA_LEGACY=on (rute tidak terdaftar bila nonaktif, server juga menolak API-nya):
 *   Kuis acara   : /acara/join -> /lobby -> /tutorial -> /main -> /hasil · host /acara/host · layar /acara/layar
 *   Latihan misi : /solo -> /solo/main?misi=N -> /solo/hasil (tidak ditautkan dari permukaan mana pun; tombol kembali ada)
 *   /latihan (alamat lama) dialihkan ke /solo. Kode room 4 karakter di /join & /projector diteruskan ke kuis acara.
 */

import { Component, Suspense, lazy, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Phase } from '@shared/types';
import { AudioUnlocker, Memuat } from './ui/kit';
import { useHalaman } from './ui/halaman';
import { t, useBahasa } from './i18n';
import { bootstrapHost, bootstrapPlayer, initConnection, useGame } from './state/store';
import { ROUTER_BASENAME } from './story/base';
import { useAppConfig } from './story/appConfig';
// Before the router mounts: its popstate listener comes first, so unsaved work can hold a back/forward move (LeaveGuard).
import './historyHold';

import { MEJA_KASUS } from './cerita/hp/meja/bendera';
import { KEJADIAN } from './cerita/kejadian/bendera';

const Landing = lazy(() => import('./pages/Landing'));
const StoryJoin = lazy(() => import('./pages/story/StoryJoin'));
const StoryRoom = lazy(() => import('./pages/story/StoryRoom'));
const StoryProjector = lazy(() => import('./pages/story/StoryProjector'));
const StoryHost = lazy(() => import('./pages/story/StoryHost'));
const CmsApp = lazy(() => import('./pages/cms/CmsApp'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
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
// PROTOTIPE meja kasus K11 (D-68): halaman lompat /meja hanya ada di build VITE_MEJA_KASUS=1.
const ProtoMeja = MEJA_KASUS ? lazy(() => import('./pages/ProtoMeja')) : null;
// PROTOTIPE "Kejadian" (irisan K10): halaman /kejadian hanya ada di build VITE_KEJADIAN=1.
const ProtoKejadian = KEJADIAN ? lazy(() => import('./pages/ProtoKejadian')) : null;
const ProtoLokasi = KEJADIAN ? lazy(() => import('./pages/ProtoLokasi')) : null;

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

/** Mode lama: sambungkan socket kuis acara & pulihkan identitas saat aplikasi dibuka (tidak dipasang di mode MVP). */
function LegacyBootstrap() {
  useEffect(() => {
    initConnection();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const rute = window.location.pathname.slice(ROUTER_BASENAME.length) || '/';
    if (rute.startsWith('/acara/host')) {
      void bootstrapHost(room);
    } else if (RUTE_PEMAIN.includes(rute)) {
      void bootstrapPlayer(room);
    }
    // sengaja hanya sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** Penanda rute di <body> (dipakai CSS & uji browser). */
function RouteMarker() {
  const loc = useLocation();
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

/** Rute mode lama, hanya didaftarkan bila server mengaktifkan RAKSA_LEGACY (alamat langsung pun tidak terbuka). */
function legacyRoutes() {
  return [
    <Route key="acara-join" path="/acara/join" element={<Join />} />,
    <Route key="acara-host" path="/acara/host" element={<Host />} />,
    <Route key="acara-layar" path="/acara/layar" element={<Projector />} />,
    <Route key="lobby" path="/lobby" element={<Lobby />} />,
    <Route key="tutorial" path="/tutorial" element={<Tutorial />} />,
    <Route key="main" path="/main" element={<Play />} />,
    <Route key="hasil" path="/hasil" element={<Result />} />,
    <Route key="solo" path="/solo" element={<Solo />} />,
    <Route key="solo-main" path="/solo/main" element={<SoloMain />} />,
    <Route key="solo-hasil" path="/solo/hasil" element={<SoloHasil />} />,
    <Route key="latihan" path="/latihan" element={<AlihkanLatihan />} />,
  ];
}

export default function App() {
  const config = useAppConfig();
  // Rute bergantung pada konfigurasi server (mode lama): tunggu jawabannya sekali. Server tak terjangkau = mode MVP.
  if (config.status === 'loading') return <Menyiapkan />;
  const legacy = config.config.legacy;
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <AudioUnlocker />
      <RouteMarker />
      {legacy ? <LegacyBootstrap /> : null}
      {legacy ? <PhaseRouter /> : null}
      <BatasRuteAlamat>
        <Suspense fallback={<Menyiapkan />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/join" element={<StoryJoin />} />
            <Route path="/room/:code" element={<StoryRoom />} />
            <Route path="/projector" element={<StoryProjector />} />
            <Route path="/host" element={<StoryHost />} />
            <Route path="/cms/*" element={<CmsApp />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/kenalan" element={<Kenalan />} />
            <Route path="/cerita" element={<Cerita />} />
            <Route path="/cerita/:episode" element={<CeritaMain />} />
            {ProtoMeja ? <Route path="/meja" element={<ProtoMeja />} /> : null}
            {ProtoKejadian ? <Route path="/kejadian" element={<ProtoKejadian />} /> : null}
            {ProtoLokasi ? <Route path="/lokasi" element={<ProtoLokasi />} /> : null}
            {legacy ? legacyRoutes() : null}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BatasRuteAlamat>
    </BrowserRouter>
  );
}
