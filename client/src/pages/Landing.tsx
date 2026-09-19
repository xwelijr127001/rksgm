import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AcaraTerbuka } from '@shared/bankSoal';
import { Avatar } from '../art/Avatar';
import { WelcomeArt } from '../art/WelcomeArt';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { t, useBahasa } from '../i18n';
import { terjemahkanBawaan } from '../i18n/galat';
import { useProfil } from '../state/profil';
type Acara = NonNullable<AcaraTerbuka['acara']>;
/**
 * Acara yang sedang dibuka (tepat satu room di lobby), ditanya sekali saat halaman dibuka.
 * Gagal, null, atau bentuk jawaban tak dikenal = null: spanduk tidak tampil sama sekali.
 */
function useAcaraTerbuka(): Acara | null {
  const [acara, setAcara] = useState<Acara | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/acara-terbuka', { signal: ctrl.signal, headers: { accept: 'application/json' } })
      .then(r => (r.ok ? r.json() as Promise<AcaraTerbuka> : null))
      .then(d => {
        const a = d?.acara;
        if (a && typeof a.code === 'string' && /^[A-Z0-9]{4}$/.test(a.code) && typeof a.eventName === 'string') setAcara(a);
      })
      .catch(() => { /* server lama / jaringan putus: tanpa spanduk */ });
    return () => ctrl.abort();
  }, []);
  return acara;
}
export default function Landing() {
  useBahasa();
  const { profil } = useProfil();
  const acara = useAcaraTerbuka();
  // Spanduk melayang (fixed), jadi kemunculannya tidak menggeser tombol yang hendak diketuk.
  return <PlayerShell className={'welcome-page alur-landing' + (acara ? ' alur-ada-spanduk' : '')} footer><main className="welcome-main"><div className="welcome-copy">
    <span className="eyebrow">{t('pemain.landingEyebrow')}</span>
    <h1>{t('pemain.landingJudul1')}<br /><span>{t('pemain.landingJudul2')}</span></h1>
    {/* landingIsi2 membawa spasi awalnya sendiri (di HP <br> ini disembunyikan). */}
    <p>{t('pemain.landingIsi1')}<br className="desktop-break" />{t('pemain.landingIsi2')}</p>
    <div className="welcome-actions"><Link className="primary-action" to={profil ? '/solo' : '/kenalan'}>{t('pemain.ayoMain')} <Arrow /></Link><Link className="quiet-link" to="/join">{t('alur.punyaKode')} <Arrow /></Link></div>
    {/* div, bukan p: aturan ".welcome-copy p" (paragraf sambutan) tidak boleh ikut berlaku di baris ini. */}
    {profil ? <div className="alur-sebagai"><span className="alur-sebagai-avatar" aria-hidden="true"><Avatar look={profil.look} size={30} mood="senang" /></span><span className="alur-sebagai-nama">{t('alur.mainSebagai', { nama: profil.nickname })}</span><span aria-hidden="true">·</span><Link className="alur-sebagai-ubah" to="/kenalan?ubah=1" aria-label={t('alur.ubahProfilAria')}>{t('alur.ubahKecil')}</Link></div> : null}
    <span className="welcome-note">{t('pemain.landingCatatan')}</span>
  </div><WelcomeArt /></main>
    {/* Wadah status selalu ada (kosong) supaya pembaca layar mengumumkan spanduk saat muncul. */}
    <div className="alur-spanduk-wadah" role="status">{acara ? <div className="alur-spanduk"><span className="alur-spanduk-titik" aria-hidden="true" /><p>{t('alur.acaraDibuka', { nama: terjemahkanBawaan(acara.eventName) })}</p><Link className="alur-spanduk-gabung" to={'/join?room=' + acara.code}>{t('alur.gabung')} <Arrow /></Link></div> : null}</div>
  </PlayerShell>;
}
