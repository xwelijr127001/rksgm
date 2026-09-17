import { Link } from 'react-router-dom';
import { WelcomeArt } from '../art/WelcomeArt';
import { Arrow, PlayerShell } from '../components/PlayerShell';
export default function Landing() {
  return <PlayerShell className="welcome-page" footer><main className="welcome-main"><div className="welcome-copy">
    <span className="eyebrow">MAIN BARENG RAKSA</span>
    <h1>Siap jadi<br /><span>andalan?</span></h1>
    <p>Jelajahi kota, bantu nasabah,<br className="desktop-break" /> dan rebut posisi pertama.</p>
    <div className="welcome-actions"><Link className="primary-action" to="/join">Ayo, main! <Arrow /></Link><Link className="quiet-link" to="/latihan?misi=1">Coba dulu <Arrow /></Link></div>
    <span className="welcome-note">10 misi seru · Main dari HP kamu</span>
  </div><WelcomeArt /></main></PlayerShell>;
}

