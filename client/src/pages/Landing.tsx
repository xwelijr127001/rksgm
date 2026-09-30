import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AcaraTerbuka } from '@shared/bankSoal';
import { TOKOH, type IdTokoh } from '@shared/brand';
import { Avatar } from '../art/Avatar';
import { Raki } from '../art/Raki';
import { POTRET_AWAL, WelcomeArt } from '../art/WelcomeArt';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { PotretTokoh } from '../game/KarakterTokoh';
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
/** Raki di bingkai potret bulat yang SAMA dengan PotretTokoh (kelas .tokoh-potret dari game/tokoh.css). */
function PotretRaki() {
  return <span className="tokoh-potret lp-potret-raki" style={{ width: POTRET_AWAL, height: POTRET_AWAL }}><Raki size={Math.round(POTRET_AWAL * 1.2)} mood="sapa" /></span>;
}
/** Potret pintu. Tokoh yang dinonaktifkan (TOKOH.x.aktif = false) diganti Raki di bingkai yang sama. */
function PotretPintu({ tokoh }: { tokoh: IdTokoh | 'raki' }) {
  return <span className="lp-pintu-potret" aria-hidden="true">{tokoh !== 'raki' && TOKOH[tokoh].aktif ? <PotretTokoh tokoh={tokoh} ukuran={POTRET_AWAL} hias /> : <PotretRaki />}</span>;
}
/**
 * Satu pintu: potret bulat + judul + satu kalimat + panah. Seluruh kartu adalah tautan (target sentuh besar).
 * Nama tautan = judul pintu, keterangannya = tanda + kalimat, lewat id (aria-labelledby/-describedby).
 * Tanpa itu Chrome menghitung nama dari seluruh isi, TERMASUK label potret role="img" meski
 * pembungkusnya aria-hidden: "Bu Isti, Direktur IT Gabung acara…" (review aksesibilitas 26 Sep).
 */
function Pintu({ ke, kelas, tokoh, judul, isi, tanda }: { ke: string; kelas: string; tokoh: IdTokoh | 'raki'; judul: string; isi: string; tanda?: string }) {
  const id = useId();
  return <Link className={'lp-pintu ' + kelas} to={ke} aria-labelledby={id + 'j'} aria-describedby={(tanda ? id + 't ' : '') + id + 'i'}>
    <PotretPintu tokoh={tokoh} />
    <span className="lp-pintu-teks">{tanda ? <span className="lp-pintu-tanda" id={id + 't'}>{tanda}</span> : null}<b className="lp-pintu-judul" id={id + 'j'}>{judul}</b><span className="lp-pintu-isi" id={id + 'i'}>{isi}</span></span>
    <span className="lp-pintu-panah"><Arrow /></span>
  </Link>;
}
/**
 * Halaman awal: tiga pintu dengan bahasa pengguna (docs/rancangan-mode-cerita.md bagian 1, temuan F):
 * Main cerita (utama) · Latihan misi · Gabung acara. Tanpa profil, cerita & latihan lewat /kenalan dulu.
 * Di HP judul + pintu cerita terlihat di layar pertama; ilustrasi kota turun ke bawah pintu.
 */
export default function Landing() {
  useBahasa();
  const { profil } = useProfil();
  const acara = useAcaraTerbuka();
  const lewatKenalan = (tujuan: string) => (profil ? tujuan : '/kenalan?lanjut=' + tujuan);
  // Spanduk melayang (fixed), jadi kemunculannya tidak menggeser pintu yang hendak diketuk.
  return <PlayerShell className={'lp-halaman alur-landing' + (acara ? ' alur-ada-spanduk' : '')} footer judul={null}><main className="lp-utama"><div className="lp-kiri">
    <div className="lp-sapa">
      <span className="eyebrow">{t('pemain.landingEyebrow')}</span>
      <h1 className="lp-judul">{t('pemain.landingJudul1')}<br /><span>{t('pemain.landingJudul2')}</span></h1>
      <p className="lp-isi">{t('pemain.landingPilih')}</p>
    </div>
    <nav className="lp-pintu-daftar" aria-label={t('pemain.pilihCaraMain')}>
      <Pintu ke={lewatKenalan('/cerita')} kelas="lp-pintu-cerita" tokoh="missRaksa" judul={t('pemain.pintuCeritaJudul')} isi={t('pemain.pintuCeritaIsi')} tanda={t('pemain.pintuMulai')} />
      <div className="lp-pintu-lain">
        <Pintu ke={lewatKenalan('/solo')} kelas="lp-pintu-latihan" tokoh="raki" judul={t('pemain.pintuLatihanJudul')} isi={t('pemain.pintuLatihanIsi')} />
        <Pintu ke="/join" kelas="lp-pintu-acara" tokoh="isti" judul={t('pemain.pintuAcaraJudul')} isi={t('pemain.pintuAcaraIsi')} />
      </div>
    </nav>
    {/* div, bukan p: baris ini bukan paragraf sambutan. */}
    {profil ? <div className="alur-sebagai lp-sebagai"><span className="alur-sebagai-avatar" aria-hidden="true"><Avatar look={profil.look} size={30} mood="senang" /></span><span className="alur-sebagai-nama">{t('alur.mainSebagai', { nama: profil.nickname })}</span><span aria-hidden="true">·</span><Link className="alur-sebagai-ubah" to="/kenalan?ubah=1" aria-label={t('alur.ubahProfilAria')}>{t('alur.ubahKecil')}</Link></div> : null}
    <span className="lp-catatan">{t('pemain.landingCatatan')}</span>
  </div><div className="lp-seni"><WelcomeArt /></div></main>
    {/* Wadah status selalu ada (kosong) supaya pembaca layar mengumumkan spanduk saat muncul. */}
    <div className="alur-spanduk-wadah" role="status">{acara ? <div className="alur-spanduk"><span className="alur-spanduk-titik" aria-hidden="true" /><p>{t('alur.acaraDibuka', { nama: terjemahkanBawaan(acara.eventName) })}</p><Link className="alur-spanduk-gabung" to={'/join?room=' + acara.code}>{t('alur.gabung')} <Arrow /></Link></div> : null}</div>
  </PlayerShell>;
}
