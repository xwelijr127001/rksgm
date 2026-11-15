import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { initAudio, setMuted } from '../audio/audio';
import { useAudioPrefs } from '../hooks';
import { t, useBahasa } from '../i18n';
import { useLegacyEnabled } from '../story/appConfig';
import { useHalaman } from '../ui/halaman';
import { Merek } from './Merek';
import { PilihBahasa } from './PilihBahasa';
import { TombolGerak } from './TombolGerak';

export function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function SoundButton() {
  const prefs = useAudioPrefs();
  useBahasa();
  return <button className="sound-button" type="button" aria-label={prefs.muted ? t('umum.nyalakanSuara') : t('umum.matikanSuara')} aria-pressed={!prefs.muted} onClick={() => { initAudio(); setMuted(!prefs.muted); }}>
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />{prefs.muted ? <path d="m16 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}</svg>
  </button>;
}
/**
 * Kerangka halaman pemain: header (wordmark bersama / tombol kembali, label konteks, bahasa, suara),
 * isi, dan footer opsional. Dengan `back`, layar lebar tetap menampilkan wordmark di depan tombol
 * kembali; di HP hanya tombol kembali (header tidak boleh luber).
 *
 * Judul tab & fokus saat pindah halaman diurus di sini untuk semua halaman pemain (ui/halaman.ts):
 * `judul` bawaan = teks <h1> halaman; string = judul khusus; null = judul dasar (halaman awal).
 */
export function PlayerShell({ children, back, keluar, label, className = '', footer = false, judul }: {
  children: ReactNode;
  back?: string;
  /** Tombol kembali/keluar khusus (mis. dengan konfirmasi saat ronde berjalan); menggantikan tautan `back`. */
  keluar?: ReactNode;
  label?: ReactNode;
  className?: string;
  footer?: boolean;
  judul?: string | null;
}) {
  useBahasa();
  useHalaman(judul);
  const legacy = useLegacyEnabled();
  const kiri = keluar ?? (back ? <Link className="back-link" to={back}><Arrow back /><span>{t('umum.kembali')}</span></Link> : null);
  return <div className={'player-ui ' + className}>
    <header className="player-header">
      {kiri ? <div className="player-header-kiri"><Merek className="mrk-lebar-saja" />{kiri}</div> : <Merek />}
      <div className="player-header-right">{label ? <span className="header-label">{label}</span> : null}<PilihBahasa /><SoundButton /></div>
    </header>
    {children}
    {footer ? <footer className="player-footer"><span>{t('umum.perusahaan')}</span><TombolGerak className="text-button tombol-gerak" /><details className="host-links"><summary>{t('umum.untukPanitia')}</summary><nav aria-label={t('umum.panitiaAria')}>
      <Link to="/host">{t('umum.kelolaPermainan')} <Arrow /></Link>
      <Link to="/projector">{t('umum.bukaLayarAcara')} <Arrow /></Link>
      <Link to="/cms">{t('umum.kelolaKonten')} <Arrow /></Link>
      <Link to="/admin">{t('umum.adminLaporan')} <Arrow /></Link>
      {legacy ? <Link to="/acara/host">{t('umum.kuisAcaraLama')} <Arrow /></Link> : null}
    </nav></details></footer> : null}
  </div>;
}


