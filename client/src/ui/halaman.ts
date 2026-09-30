/**
 * Judul dokumen & fokus saat berpindah halaman (SPA). Review aksesibilitas 26 Sep: dulu judul tab
 * sama di semua layar ("RAKSA GAME - Raksa Claim") dan fokus jatuh ke <body> setelah pintu/tautan
 * diketuk, jadi pembaca layar tidak tahu halaman sudah berganti (WCAG 2.4.2; praktik 4.1.3 SPA).
 *
 * `useHalaman(judul)` dipanggil SEKALI per halaman: otomatis oleh PlayerShell
 * (components/PlayerShell.tsx, prop `judul`). Halaman tanpa PlayerShell (Host, Projector, pemutar
 * cerita di CeritaMain) memanggilnya sendiri.
 *  - judul string    : "<judul> – RAKSA GAME"
 *  - judul undefined : diambil dari <h1> halaman (teks bahasa aktif)
 *  - judul null      : judul dasar dari index.html (halaman awal)
 *
 * Fokus: setelah PENGGUNA berpindah halaman (bukan muat awal, bukan pengalihan otomatis sebelum
 * pengguna menyentuh apa pun, bukan PhaseRouter yang memindah pemain mengikuti fase host), fokus
 * dipindah ke <h1> (tabindex -1, tanpa cincin: theme.css `h1[data-fokus-halaman]`), sehingga
 * pembaca layar membacakan judul halaman baru. Bila halaman sudah memegang fokus sendiri
 * (autofocus, gerbang misi, dialog), fokus itu dibiarkan.
 */
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { BRAND } from '@shared/brand';

/** Halaman pertandingan yang dipindah PhaseRouter (App.tsx `RUTE_PEMAIN`) dengan navigate replace. */
const RUTE_FASE: ReadonlySet<string> = new Set(['/lobby', '/tutorial', '/main', '/hasil']);

const JUDUL_DASAR = typeof document !== 'undefined' && document.title.trim() ? document.title : BRAND.gameName;

/** Rapikan teks judul: spasi tunggal, tanpa titik penutup kalimat ("Kenalan dulu, yuk." -> "Kenalan dulu, yuk"). */
export function rapikanJudul(teks: string): string {
  return teks.replace(/\s+/g, ' ').trim().replace(/[.。]+$/u, '').trim();
}

/** Judul dokumen lengkap. Kosong/null = judul dasar. */
export function judulDokumen(judul: string | null | undefined, dasar: string = JUDUL_DASAR): string {
  const j = judul ? rapikanJudul(judul) : '';
  return j ? `${j} – ${BRAND.gameName}` : dasar;
}

export interface Kunjungan {
  /** `location.key` react-router: berbeda untuk tiap entri riwayat. */
  kunci: string;
  pathname: string;
  /** Jenis navigasi react-router (`useNavigationType`): 'POP' | 'PUSH' | 'REPLACE'. */
  jenis: `${ReturnType<typeof useNavigationType>}`;
}

/**
 * Perlukah fokus dipindah ke judul halaman yang baru dibuka?
 * @param kunciLalu kunci entri riwayat terakhir yang tercatat; sebelum ada, kunci entri saat dokumen dimuat
 * @param interaksi pengguna sudah pernah menekan/mengetuk sesuatu di dokumen ini
 */
export function perluFokusJudul(kunciLalu: string, kini: Kunjungan, interaksi: boolean): boolean {
  if (kunciLalu === kini.kunci) return false; // muat awal / entri riwayat yang sama: urutan baca normal

  if (!interaksi) return false; // pengalihan otomatis (profil belum ada, alamat lama), bukan tindakan pengguna
  if (kini.jenis === 'REPLACE' && RUTE_FASE.has(kini.pathname)) return false; // PhaseRouter: host yang mengganti fase
  return true;
}

// ------------------------------------------------------------------ keadaan dokumen (bukan React)

/**
 * Keputusan fokus untuk entri riwayat terakhir. Diputuskan SEKALI per `location.key`; `selesai`
 * menandai upaya fokus sudah tuntas, sehingga pemasangan ulang (ganti cabang tampilan, atau efek
 * ganda StrictMode saat pengembangan) tidak mengulangnya dan tidak pula membatalkannya.
 */
let catatan: { kunci: string; fokus: boolean; selesai: boolean } | null = null;
let pernahBerinteraksi = false;
/**
 * Kunci entri riwayat saat dokumen dimuat (react-router menyimpannya di history.state; entri baru
 * tanpa state = "default"). Berkas ini dimuat bersama halaman pertama, sebelum pengalihan apa pun.
 */
const KUNCI_AWAL: string = (() => {
  try {
    const k = (window.history.state as { key?: unknown } | null)?.key;
    return typeof k === 'string' && k ? k : 'default';
  } catch {
    return 'default';
  }
})();

if (typeof window !== 'undefined') {
  const tandai = () => {
    pernahBerinteraksi = true;
    window.removeEventListener('pointerdown', tandai, true);
    window.removeEventListener('keydown', tandai, true);
  };
  window.addEventListener('pointerdown', tandai, true);
  window.addEventListener('keydown', tandai, true);
}

function teksH1(): string {
  return document.querySelector('h1')?.textContent ?? '';
}

function fokusDipegang(): boolean {
  const a = document.activeElement;
  return Boolean(a && a !== document.body && a.isConnected);
}

/**
 * Fokuskan <h1> halaman begitu tersedia (halaman bisa masih memuat). `selesai` dipanggil setelah
 * upaya itu tuntas (fokus dipindah, fokus sudah dipegang halaman, atau batas waktu habis).
 * Mengembalikan fungsi pembatal.
 */
function fokusJudulNanti(selesai: () => void): () => void {
  let obs: MutationObserver | null = null;
  let batasWaktu = 0;
  const berhenti = () => {
    obs?.disconnect();
    obs = null;
    window.clearTimeout(batasWaktu);
  };
  const tuntas = () => {
    berhenti();
    selesai();
  };
  const coba = (): boolean => {
    if (fokusDipegang()) return true; // halaman/pengguna sudah menaruh fokus: jangan direbut
    const h1 = document.querySelector<HTMLElement>('h1');
    if (!h1) return false;
    if (!h1.hasAttribute('tabindex')) h1.tabIndex = -1;
    h1.setAttribute('data-fokus-halaman', '');
    h1.focus({ preventScroll: true });
    return true;
  };
  // Tunggu satu frame: efek halaman (autofocus, gerbang "Siap mulai") menaruh fokusnya dulu.
  const frame = requestAnimationFrame(() => {
    if (coba()) return selesai();
    obs = new MutationObserver(() => {
      if (coba()) tuntas();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    batasWaktu = window.setTimeout(tuntas, 4000);
  });
  return () => {
    cancelAnimationFrame(frame);
    berhenti();
  };
}

/** Judul dokumen + fokus judul saat halaman ini dibuka lewat navigasi pengguna. Lihat komentar berkas. */
export function useHalaman(judul?: string | null): void {
  const loc = useLocation();
  const jenis = useNavigationType();

  // Tiap render: bahasa, nama acara, atau isi <h1> bisa berubah.
  useEffect(() => {
    const baru = judulDokumen(judul === undefined ? teksH1() : judul);
    if (document.title !== baru) document.title = baru;
  });
  // Halaman berikutnya yang tidak mengatur judul tidak boleh mewarisi judul halaman ini.
  useEffect(() => () => {
    document.title = JUDUL_DASAR;
  }, []);

  useEffect(() => {
    if (catatan?.kunci !== loc.key) {
      const kini = { kunci: loc.key, pathname: loc.pathname, jenis };
      catatan = { kunci: loc.key, fokus: perluFokusJudul(catatan?.kunci ?? KUNCI_AWAL, kini, pernahBerinteraksi), selesai: false };
    }
    const c = catatan;
    if (!c.fokus || c.selesai) return;
    return fokusJudulNanti(() => {
      c.selesai = true;
    });
    // Hanya saat halaman dipasang atau pathname berubah (bukan saat ?query berganti di halaman yang sama).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);
}
