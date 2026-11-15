/**
 * LAYAR PEMUAT halaman awal (T-010 G2, DESIGN-REVIEW D-57..D-62). Hanya dipasang oleh Landing (rute "/"), tidak di main.tsx,
 * jadi host, proyektor, join, cerita, dan acara tidak pernah melihatnya.
 *
 * - Keputusan tampil dibuat SEKALI di efek tata letak (render bebas efek samping: tanpa sessionStorage, tanpa jaringan), sebelum
 *   cat pertama, jadi tidak ada kedip halaman-lalu-pemuat. Dilewati bila: sudah dilepas di sesi ini (sessionStorage
 *   `raksa:loader:v1`, BUKAN "aset siap"), pengguna meminta hemat data (upaya terbaik), atau bekal sudah SIAP: lembar Miss Raksa
 *   sudah berhasil di-DECODE (janji bersama di bawah, dimulai saat modul dimuat; preload index.html membuatnya cepat) dan font siap.
 * - Bekal = lembar sprite (naturalWidth > 0 + decode berhasil; dilewati bila tokoh nonaktif) + document.fonts.ready. Batas 2000 ms
 *   dari pemasangan pemuat; gagal = lepas juga (slot sprite berukuran tetap, tanpa lompatan tata letak).
 * - D-62: bila tampil, minimal 600 ms di layar sejak cat pertama overlay (bukan kedip), tetap dibatasi 2000 ms dari pemasangan.
 * - Selama tampil: #root `inert` + `aria-busy`; teks status (role=status) di LUAR #root (portal ke body). Fokus judul
 *   (ui/halaman.ts) ditahan sampai pemuat dilepas. Lepas: inert dibuang di AWAL pudar 200 ms, lalu dilepas sesudah 260 ms.
 * - StrictMode: satu tenggat (dari ref waktu pasang pertama), semua timer/pendengar dibersihkan, hasil sesudah lepas diabaikan.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOKOH } from '@shared/brand';
import { Raki } from '../art/Raki';
import { t, useBahasa } from '../i18n';
import { tahanFokusJudul } from '../ui/halaman';

const KUNCI = 'raksa:loader:v1';
const BATAS_MS = 2000;
const MIN_TAMPIL_MS = 600;
const LEPAS_MS = 260;
const LEMBAR = `${import.meta.env.BASE_URL}karakter/miss-raksa-besar.webp`;

function sudahDilepas(): boolean {
  try { return sessionStorage.getItem(KUNCI) === '1'; } catch { return true; } // penyimpanan diblokir: jangan tampil
}
function tandaiDilepas() {
  try { sessionStorage.setItem(KUNCI, '1'); } catch { /* abaikan */ }
}
function hematData(): boolean {
  try {
    if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return true;
  } catch { /* tidak didukung */ }
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

/**
 * Janji bersama "lembar sprite ter-decode" (satu per dokumen; gagal = ditolak dan bisa diulang). `lembarSiap` true hanya
 * sesudah decode BERHASIL dengan naturalWidth > 0. Dimulai saat modul dimuat (bukan saat render) di halaman awal saja.
 */
let janjiLembar: Promise<void> | null = null;
let lembarSiap = false;
function decodeLembar(): Promise<void> {
  if (janjiLembar) return janjiLembar;
  const img = new Image();
  img.decoding = 'async';
  img.src = LEMBAR;
  janjiLembar = new Promise<void>((ok, gagal) => {
    const cek = () => {
      if (!(img.naturalWidth > 0)) { gagal(new Error('lembar kosong')); return; }
      img.decode().then(ok, gagal);
    };
    if (img.complete) cek();
    else {
      img.addEventListener('load', cek, { once: true });
      img.addEventListener('error', () => gagal(new Error('lembar gagal')), { once: true });
    }
  }).then(() => { lembarSiap = true; }, (e) => { janjiLembar = null; throw e; });
  return janjiLembar;
}
if (typeof window !== 'undefined' && TOKOH.missRaksa.aktif && !sudahDilepas()) {
  // Halaman awal (modul ini hanya diimpor Landing): mulai sedini mungkin; preload index.html biasanya sudah memuatnya.
  decodeLembar().catch(() => { /* ditangani saat pemuat memutuskan */ });
}

export function PemuatAwal() {
  useBahasa();
  const [fase, setFase] = useState<'belum' | 'tampil' | 'pudar' | 'hilang'>('belum');
  const dipasang = useRef<number | null>(null);
  const keputusan = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    // Satu keputusan per pemasangan pertama (StrictMode memasang ulang: keputusan yang sama dipakai lagi).
    if (keputusan.current === null) {
      const fontSiap = !document.fonts || document.fonts.status === 'loaded';
      const bekalSiap = (!TOKOH.missRaksa.aktif || lembarSiap) && fontSiap;
      keputusan.current = !(sudahDilepas() || hematData() || bekalSiap);
      if (!keputusan.current && bekalSiap) tandaiDilepas();
    }
    if (!keputusan.current) { setFase('hilang'); return; }
    setFase((f) => (f === 'belum' ? 'tampil' : f));
    dipasang.current ??= performance.now(); // tenggat tetap dari pemasangan PERTAMA
    const root = document.getElementById('root');
    const lepasFokus = tahanFokusJudul();
    let selesai = false;
    let tLepas = 0;
    let tMin = 0;
    let tampilPada: number | null = null;
    // Cat pertama overlay: frame berikutnya sesudah komit.
    const raf = requestAnimationFrame(() => { tampilPada = performance.now(); });
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-busy', 'true');
    const lepas = () => {
      if (selesai) return;
      selesai = true;
      window.clearTimeout(tBatas);
      window.clearTimeout(tMin);
      root?.removeAttribute('inert'); // di AWAL pudar: isi halaman bisa difokus lagi
      root?.removeAttribute('aria-busy');
      tandaiDilepas();
      setFase('pudar');
      tLepas = window.setTimeout(() => { setFase('hilang'); lepasFokus(); }, LEPAS_MS);
    };
    /** Bekal siap atau batas: lepas sesudah minimal 600 ms sejak cat pertama (tetap tidak melewati batas 2000 ms). */
    const siapLepas = () => {
      if (selesai) return;
      const kini = performance.now();
      const sudahTampil = tampilPada === null ? 0 : kini - tampilPada;
      const sisaMin = Math.max(0, MIN_TAMPIL_MS - sudahTampil);
      const sisaBatas = Math.max(0, BATAS_MS - (kini - dipasang.current!));
      const tunggu = Math.min(sisaMin, sisaBatas);
      if (tunggu <= 0) lepas(); else { window.clearTimeout(tMin); tMin = window.setTimeout(lepas, tunggu); }
    };
    const tBatas = window.setTimeout(lepas, Math.max(0, BATAS_MS - (performance.now() - dipasang.current)));
    const bekal: Promise<unknown>[] = [document.fonts ? document.fonts.ready : Promise.resolve()];
    if (TOKOH.missRaksa.aktif) bekal.push(decodeLembar());
    Promise.all(bekal).then(siapLepas, siapLepas);
    return () => {
      // Dilepas (StrictMode / pindah halaman): kembalikan semuanya, hasil janji yang terlambat diabaikan.
      selesai = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(tBatas);
      window.clearTimeout(tMin);
      window.clearTimeout(tLepas);
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-busy');
      lepasFokus();
    };
  }, []);

  if (fase === 'hilang' || fase === 'belum') return null;
  return createPortal(
    <div className="lp-pemuat" data-selesai={fase === 'pudar' ? '' : undefined}>
      <div className="lp-pemuat-isi">
        <div className="mrk" aria-hidden="true"><span className="mrk-raksa">RAKSA</span><span className="mrk-game">GAME</span></div>
        <span className="lp-pemuat-raki" aria-hidden="true"><Raki size={80} mood="sapa" /></span>
        <div className="lp-pemuat-bar" aria-hidden="true"><i /><i /><i /><i /></div>
        <p className="lp-pemuat-teks" role="status">{t('umum.menyiapkan')}</p>
      </div>
    </div>,
    document.body,
  );
}
