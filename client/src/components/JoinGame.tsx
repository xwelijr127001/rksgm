/**
 * Join Game (review staf #4, #6): SATU-SATUNYA ajakan bergabung ke room acara, dipakai di halaman awal (T-027: baris kode
 * di bawah pintu Mode Cerita; di HP judulnya pertanyaan pendek `joinTanya` dan kalimat penjelasnya hanya untuk pembaca
 * layar, lewat aria-describedby kolom kode) dan di Mode Cerita (di atas daftar episode). Ikon surveyor; kode diisi di sini lalu "Masuk" membuka halaman gabung (nama +
 * pemberitahuan data, tanpa akun). Kode 6 karakter = room cerita; 4 karakter = room kuis lama (diteruskan halaman gabung
 * bila mode lama aktif). `kodeSaran` (mis. spanduk acara yang sedang dibuka) hanya MENGISI kotak ini, bukan tombol gabung
 * kedua.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKOH } from '@shared/brand';
import { IkonMissPose } from '../art/IkonMissPose';
import { PotretSurveyor } from '../art/Surveyor';
import { POTRET_AWAL } from '../art/WelcomeArt';
import { t, useBahasa } from '../i18n';
import { normalizeCode } from '../story/participant';
import { Arrow } from './PlayerShell';

export function JoinGame({ kodeSaran = null, className = '' }: { kodeSaran?: string | null; className?: string }) {
  useBahasa();
  const nav = useNavigate();
  const id = useId();
  const [kode, setKode] = useState('');
  const [galat, setGalat] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!kodeSaran) return;
    setKode(normalizeCode(kodeSaran));
    setGalat(false);
    tombol.current?.focus();
  }, [kodeSaran]);
  const kirim = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeCode(kode);
    if (c.length !== 6 && c.length !== 4) {
      setGalat(true);
      return;
    }
    nav('/join?room=' + c);
  };
  return (
    <section className={'lp-join ' + className + (galat ? ' lp-join-ada-galat' : '')} aria-labelledby={id + 'j'} data-join-game="">
      <div className="lp-join-kepala">
        {/* T-058: Miss Raksa dengan telepon (piksel), beda dari kartu Mode Cerita; 30 px di HP (player.css). */}
        {TOKOH.missRaksa.aktif ? <span className="lp-join-ikon"><IkonMissPose pose="telepon" className="lp-join-ikon-besar" /><IkonMissPose pose="telepon30" className="lp-join-ikon-kecil" /></span> : <PotretSurveyor ukuran={POTRET_AWAL} />}
        <div className="lp-join-teks"><h2 className="lp-join-judul" id={id + 'j'}><span className="lp-join-judul-lebar">{t('pemain.joinJudul')}</span><span className="lp-join-judul-hp">{t('pemain.joinTanya')}</span></h2><p className="lp-join-isi" id={id + 'i'}>{t('pemain.joinIsi')}</p></div>
      </div>
      <form className="lp-join-form" onSubmit={kirim} noValidate>
        <label className="sr-only" htmlFor={id + 'k'}>{t('pemain.joinKodeLabel')}</label>
        <input
          id={id + 'k'}
          className="kolom lp-join-kode"
          value={kode}
          onChange={(e) => { setKode(normalizeCode(e.target.value)); setGalat(false); }}
          placeholder="KODE"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          aria-describedby={id + 'i' + (galat ? ' ' + id + 'g' : '')}
          aria-invalid={galat || undefined}
        />
        <button ref={tombol} className="primary-action lp-join-mulai" type="submit">{t('pemain.joinMasuk')} <Arrow /></button>
      </form>
      {galat ? <p className="lp-join-galat" id={id + 'g'} role="alert">{t('pemain.joinKodeKurang')}</p> : null}
    </section>
  );
}
