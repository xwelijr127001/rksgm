import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AcaraTerbuka } from '@shared/bankSoal';
import { TOKOH } from '@shared/brand';
import { Avatar } from '../art/Avatar';
import { Raki } from '../art/Raki';
import { POTRET_AWAL, WelcomeArt } from '../art/WelcomeArt';
import { JoinGame } from '../components/JoinGame';
import { PemuatAwal } from '../components/PemuatAwal';
import { Arrow, PlayerShell } from '../components/PlayerShell';
import { PotretTokoh } from '../game/KarakterTokoh';
import { t, useBahasa } from '../i18n';
import { terjemahkanBawaan } from '../i18n/galat';
import { useLegacyEnabled } from '../story/appConfig';
import { useProfil } from '../state/profil';

type Acara = NonNullable<AcaraTerbuka['acara']>;
/**
 * Mode lama: room kuis acara yang sedang dibuka (tepat satu room di lobby), ditanya sekali saat halaman dibuka.
 * Mode lama nonaktif, gagal, null, atau bentuk jawaban tak dikenal = null: spanduk tidak tampil sama sekali.
 */
function useAcaraTerbuka(aktif: boolean): Acara | null {
  const [acara, setAcara] = useState<Acara | null>(null);
  useEffect(() => {
    if (!aktif) return;
    const ctrl = new AbortController();
    fetch('/api/acara-terbuka', { signal: ctrl.signal, headers: { accept: 'application/json' } })
      .then(r => (r.ok ? r.json() as Promise<AcaraTerbuka> : null))
      .then(d => {
        const a = d?.acara;
        if (a && typeof a.code === 'string' && /^[A-Z0-9]{4}$/.test(a.code) && typeof a.eventName === 'string') setAcara(a);
      })
      .catch(() => { /* server lama / jaringan putus: tanpa spanduk */ });
    return () => ctrl.abort();
  }, [aktif]);
  return aktif ? acara : null;
}
/** Raki di bingkai potret bulat yang SAMA dengan PotretTokoh (kelas .tokoh-potret dari game/tokoh.css). */
function PotretRaki() {
  return <span className="tokoh-potret lp-potret-raki" style={{ width: POTRET_AWAL, height: POTRET_AWAL }}><Raki size={Math.round(POTRET_AWAL * 1.2)} mood="sapa" /></span>;
}

/**
 * Mode Cerita (review staf #2): satu pintu dengan tindakan "Mulai", di bawah Join Game. Latihan misi tidak ditawarkan
 * lagi di halaman awal (arahan pemilik; rute lama tetap ada bila mode lama aktif). Tanpa profil -> kenalan dulu.
 * Seluruh kartu = tautan (target sentuh besar); nama tautan = judul + label aksi "Mulai" yang terlihat (perintah suara
 * "klik Mulai" berfungsi), keterangannya = kalimat (aria-labelledby/-describedby).
 */
function ModeCerita() {
  const { profil } = useProfil();
  const id = useId();
  const ke = profil ? '/cerita' : '/kenalan?lanjut=/cerita';
  // T-010 G3: hanya saat kartu disentuh/difokus (bukan untuk pemain Join Game): adegan pertama Episode 2 dipanaskan; modul
  // diimpor dinamis supaya data episode tidak masuk bundel halaman awal.
  // R-14: halaman awal MEMILIKI pemanasannya: dibatalkan saat dilepas, dan impor dinamis yang selesai terlambat (sesudah
  // pindah halaman) tidak memulai apa pun.
  const batalHangat = useRef<(() => void) | null>(null);
  const terpasang = useRef(true);
  useEffect(() => { terpasang.current = true; return () => { terpasang.current = false; batalHangat.current?.(); batalHangat.current = null; }; }, []);
  const hangatkan = () => {
    if (!profil || batalHangat.current) return;
    batalHangat.current = () => {}; // sedang diimpor
    void import('../cerita/ui/latar/hangatkanDaftar').then((m) => {
      if (!terpasang.current) { batalHangat.current = null; return; }
      m.hangatkanEpisodeAwal();
    }, () => { batalHangat.current = null; });
  };
  return <section className="lp-sendiri" aria-labelledby={id + 's'}>
    <h2 className="lp-sendiri-judul" id={id + 's'}>{t('pemain.mainSendiri')}</h2>
    <Link className="lp-pintu lp-pintu-cerita-solo" to={ke} onPointerEnter={hangatkan} onFocus={hangatkan} aria-labelledby={`${id}j ${id}m`} aria-describedby={id + 'i'} data-pintu-cerita="">
      <span className="lp-pintu-potret" aria-hidden="true">
        {TOKOH.missRaksa.aktif ? <PotretTokoh tokoh="missRaksa" ukuran={POTRET_AWAL} hias /> : <PotretRaki />}
      </span>
      <span className="lp-pintu-teks"><b className="lp-pintu-judul" id={id + 'j'}>{t('pemain.pintuCeritaJudul')}</b><span className="lp-pintu-isi" id={id + 'i'}>{t('pemain.pintuCeritaIsi')}</span></span>
      <span className="lp-pintu-aksi" id={id + 'm'}>{t('pemain.pintuCeritaMulai')} <Arrow /></span>
    </Link>
    {profil ? <div className="alur-sebagai lp-sebagai"><span className="alur-sebagai-avatar" aria-hidden="true"><Avatar look={profil.look} size={30} mood="senang" /></span><span className="alur-sebagai-nama">{t('alur.mainSebagai', { nama: profil.nickname })}</span><span aria-hidden="true">·</span><Link className="alur-sebagai-ubah" to="/kenalan?ubah=1" aria-label={t('alur.ubahProfilAria')}>{t('alur.ubahKecil')}</Link></div> : null}
  </section>;
}

/**
 * Halaman awal: Join Game paling atas (room acara bersama, review staf #4/#6), lalu Mode Cerita (main sendiri) dan sapaan
 * Miss Raksa di ilustrasi (review staf #1). Spanduk acara kuis lama (hanya bila mode lama aktif) tidak menjadi ajakan
 * gabung kedua: tombolnya mengisi kode ke Join Game.
 */
export default function Landing() {
  useBahasa();
  const legacy = useLegacyEnabled();
  const acara = useAcaraTerbuka(legacy);
  const [kodeSaran, setKodeSaran] = useState<string | null>(null);
  // Spanduk melayang (fixed), jadi kemunculannya tidak menggeser kartu yang hendak diketuk.
  // T-003 D-01: ilustrasi + sapaan (.lp-seni) DULUAN di DOM supaya di HP tampil paling atas & urutan baca = urutan lihat;
  // di desktop (>900px) grid menaruhnya kembali di kolom kanan (player.css, D-09).
  return <><PemuatAwal /><PlayerShell className={'lp-halaman alur-landing' + (acara ? ' alur-ada-spanduk' : '')} footer judul={null}><main className="lp-utama"><div className="lp-seni"><WelcomeArt /></div><div className="lp-kiri">
    <div className="lp-sapa">
      <span className="eyebrow">{t('pemain.landingEyebrow')}</span>
      <h1 className="lp-judul">{t('pemain.landingJudul1')}<br />{' '}<span>{t('pemain.landingJudul2')}</span></h1>
      <p className="lp-isi">{t('pemain.landingPilih')}</p>
    </div>
    <JoinGame kodeSaran={kodeSaran} />
    <ModeCerita />
    <span className="lp-catatan">{t('pemain.landingCatatan')}</span>
  </div></main>
    {/* Wadah status selalu ada (kosong) supaya pembaca layar mengumumkan spanduk saat muncul. */}
    <div className="alur-spanduk-wadah" role="status">{acara ? <div className="alur-spanduk"><span className="alur-spanduk-titik" aria-hidden="true" /><p>{t('alur.acaraDibuka', { nama: terjemahkanBawaan(acara.eventName) })}</p><button type="button" className="alur-spanduk-gabung" onClick={() => setKodeSaran(acara.code)}>{t('alur.gabung')} <Arrow /></button></div> : null}</div>
  </PlayerShell></>;
}
