/**
 * T-024 (rev 1.1): LEMBAR BAWAH layar akhir satu layar. SATU pemilik untuk semua rincian layar akhir (LayarAkhir memegang
 * satu state lembar): rincian keputusan dari strip token, kalimat sebab utuh, dan teks Pelajaran utuh.
 *
 * Rupa = cangkang lembar balasan T-018 (keluarga kelas `.hp-lembar` di hp/desain.css: tepi emas, pegangan, HANYA badan yang
 * menggulir) dengan kepala mock Designer (D-226..D-235): tanda di kiri, baris kecil + judul, tombol tutup 44 x 44; kaki (tombol
 * Sebelumnya / Berikutnya) tersemat di bawah badan. Perilaku = dialog modal lewat tumpukan bersama ui/modal.ts (BUKAN state
 * PilihBalasan): satu perangkap fokus, latar `inert`, satu kunci gulir halaman untuk seluruh tumpukan, Escape dan ketuk latar
 * menutup, fokus kembali ke `kembaliKe` (token / kartu yang diketuk). Dipasang lewat portal ke <body>, jadi menutupi juga
 * bilah aksi tersemat.
 */
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../i18n';
import { kelasKonteks, useBisaGulir, useLapisanDialog, type KembaliKe } from '../../ui/modal';

export function LembarAkhir({ jenis, judul, nama, kecil, tanda, atasBadan, kaki, kunciIsi = '', kembaliKe, onTutup, onPanah, children }: {
  /** Isi lembar (atribut data untuk gaya & uji). */
  jenis: 'titik' | 'sebab' | 'pelajaran';
  judul: ReactNode;
  /** Judul sebagai teks polos (nama wilayah isi bila badan lembar perlu digulir). */
  nama: string;
  /** Baris kecil di atas judul ("Keputusan 3 dari 15", nama akhir). */
  kecil?: ReactNode;
  /** Hiasan di kiri judul (token keputusan / potret Miss Raksa). */
  tanda?: ReactNode;
  /** Di antara kepala dan badan (peta keputusan). */
  atasBadan?: ReactNode;
  /** Baris tombol tersemat di bawah badan (Sebelumnya / Berikutnya). */
  kaki?: ReactNode;
  /** Berganti = isi lain di lembar yang sama (keputusan berikutnya): badan kembali ke atas. */
  kunciIsi?: string;
  kembaliKe: KembaliKe;
  onTutup: () => void;
  /** Panah kiri / kanan di dalam lembar (keputusan sebelumnya / berikutnya). */
  onPanah?: (arah: -1 | 1) => void;
  children: ReactNode;
}) {
  const idJudul = useId();
  const latarRef = useRef<HTMLDivElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const badanRef = useRef<HTMLDivElement>(null);
  // Badan yang meluap bisa difokus & digulir dengan keyboard (sama seperti isi Modal).
  const bisaGulir = useBisaGulir(badanRef);
  // Tekan dimulai di latar? (seret dari dalam lembar yang berakhir di latar tidak menutup)
  const tekanDiLatar = useRef(false);
  const geser = useRef<number | null>(null);
  const [konteks] = useState(() => kelasKonteks(typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null)));
  useLapisanDialog(latarRef, { onEscape: onTutup, kembaliKe, fokusAwal: () => judulRef.current });
  useLayoutEffect(() => { if (badanRef.current) badanRef.current.scrollTop = 0; }, [kunciIsi]);

  if (typeof document === 'undefined') return null;
  // Pegangan seperti lembar balasan: ketuk = tutup; geser turun >= 20 px = tutup.
  const turun = (e: PointerEvent<HTMLButtonElement>) => { geser.current = e.clientY; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* abaikan */ } };
  const lepas = (e: PointerEvent<HTMLButtonElement>) => { const y0 = geser.current; geser.current = null; if (y0 !== null && e.clientY - y0 >= 20) onTutup(); };
  const tombol = (e: KeyboardEvent<HTMLElement>) => {
    if (!onPanah || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    onPanah(e.key === 'ArrowLeft' ? -1 : 1);
  };
  return createPortal(
    <div
      ref={latarRef}
      className={'akh-lembar-latar hp-tema' + (konteks ? ` ${konteks}` : '')}
      data-latar-lembar=""
      onPointerDown={(e) => { tekanDiLatar.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        const dariLatar = tekanDiLatar.current;
        tekanDiLatar.current = false;
        if (e.target === e.currentTarget && dariLatar) onTutup();
      }}
    >
      <section className="hp-lembar akh-lembar" role="dialog" aria-modal="true" aria-labelledby={idJudul} tabIndex={-1} data-lembar-akhir={jenis} onKeyDown={tombol}>
        {/* Pegangan = isyarat penunjuk saja (ketuk / geser turun); kontrol tutup yang bernama adalah tombol silang di kepala. */}
        <div className="hp-lembar-pegangan" aria-hidden="true">
          <button type="button" tabIndex={-1} data-pegangan-lembar="" onClick={onTutup} onPointerDown={turun} onPointerUp={lepas}><i /></button>
        </div>
        {/* Judul berganti saat Sebelumnya / Berikutnya ditekan (fokus tetap di tombolnya): diumumkan pembaca layar. */}
        <div className="hp-lembar-kepala akh-lembar-kepala">
          {tanda}
          <div className="akh-lembar-judul" aria-live="polite" aria-atomic="true">
            {kecil ? <small>{kecil}</small> : null}
            <h2 id={idJudul} ref={judulRef} tabIndex={-1}>{judul}</h2>
          </div>
        </div>
        <button type="button" className="akh-lembar-tutup" data-tutup-lembar="" aria-label={t('ceritaAkhir.tutup')} onClick={onTutup}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </button>
        {atasBadan}
        <div ref={badanRef} className="hp-lembar-badan akh-lembar-badan" data-gulir-lembar="" {...(bisaGulir ? { tabIndex: 0, role: 'region', 'aria-label': t('umum.dialogIsi', { judul: nama }) } : {})}>{children}</div>
        {kaki ? <div className="akh-navigasi">{kaki}</div> : null}
      </section>
    </div>,
    document.body,
  );
}
