import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';
import { t, useBahasa } from '../i18n';

/**
 * Wordmark bersama "RAKSA | GAME" untuk header pemain (PlayerShell), host, dan proyektor, supaya
 * semua layar memakai merek yang sama (review 26 Sep, temuan F). Gaya: `.mrk*` di theme.css.
 *
 * - `tautan` (bawaan true): tautan ke halaman awal. Host & proyektor memakai false supaya panitia
 *   tidak keluar dari layar kendali karena salah ketuk.
 * - `nada="gelap"`: warna terang untuk latar gelap (proyektor).
 * - Logo resmi (BRAND.logoPath) dipakai bila sudah diisi.
 * Pembaca layar mendengar "RAKSA GAME" (bukan "RAKSAGAME"): teks tampilan disembunyikan.
 */
export function Merek({
  ukuran = 'sedang',
  nada = 'terang',
  tautan = true,
  className = '',
}: {
  ukuran?: 'sedang' | 'besar';
  nada?: 'terang' | 'gelap';
  tautan?: boolean;
  className?: string;
}) {
  useBahasa();
  const kelas = ['mrk', ukuran === 'besar' ? 'mrk-besar' : '', nada === 'gelap' ? 'mrk-gelap' : '', className].filter(Boolean).join(' ');
  // T-138: logo burung hantu 118 x 40 (+ @2x); latar gelap memakai berkas gelap. Ukuran kotak: .mrk img di theme.css.
  const logo = nada === 'gelap' ? BRAND.logoPathGelap ?? BRAND.logoPath : BRAND.logoPath;
  const isi = logo ? (
    <img src={logo} srcSet={`${logo} 1x, ${logo.replace(/.png$/, '@2x.png')} 2x`} width={118} height={40} alt={tautan ? '' : BRAND.gameName} />
  ) : (
    <>
      <span className="mrk-raksa" aria-hidden="true">RAKSA</span>
      <span className="mrk-game" aria-hidden="true">GAME</span>
      {tautan ? null : <span className="sr-only">{BRAND.gameName}</span>}
    </>
  );
  if (tautan) {
    return (
      <Link className={kelas} to="/" aria-label={t('umum.berandaAria')}>
        {isi}
      </Link>
    );
  }
  return <span className={kelas}>{isi}</span>;
}
