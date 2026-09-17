import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';
import { initAudio, setMuted } from '../audio/audio';
import { useAudioPrefs } from '../hooks';

export function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function SoundButton() {
  const prefs = useAudioPrefs();
  return <button className="sound-button" type="button" aria-label={prefs.muted ? 'Nyalakan suara' : 'Matikan suara'} aria-pressed={!prefs.muted} onClick={() => { initAudio(); setMuted(!prefs.muted); }}>
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />{prefs.muted ? <path d="m16 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}</svg>
  </button>;
}
export function PlayerShell({ children, back, label, className = '', footer = false }: { children: ReactNode; back?: string; label?: ReactNode; className?: string; footer?: boolean }) {
  return <div className={'player-ui ' + className}>
    <header className="player-header">
      {back ? <Link className="back-link" to={back}><Arrow back /><span>Kembali</span></Link> : <Link className="player-wordmark" to="/" aria-label="RAKSA GAME, halaman awal">{BRAND.logoPath ? <img src={BRAND.logoPath} alt="RAKSA GAME" /> : <>RAKSA<span>GAME</span></>}</Link>}
      <div className="player-header-right">{label ? <span className="header-label">{label}</span> : null}<SoundButton /></div>
    </header>
    {children}
    {footer ? <footer className="player-footer"><span>PT Asuransi Raksa Pratikara</span><details className="host-links"><summary>Untuk panitia</summary><nav aria-label="Panitia"><Link to="/host">Kelola permainan <Arrow /></Link><Link to="/projector">Buka layar acara <Arrow /></Link></nav></details></footer> : null}
  </div>;
}


