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
import { IkonMissPose } from '../art/IkonMissPose';
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
/** Raki di bingkai potret bulat (kelas .tokoh-potret dari game/tokoh.css); hanya bila Miss Raksa nonaktif. */
function PotretRaki() {
  return <span className="tokoh-potret lp-potret-raki" style={{ width: POTRET_AWAL, height: POTRET_AWAL }}><Raki size={Math.round(POTRET_AWAL * 1.2)} mood="sapa" /></span>;
}

/**
 * Mode Cerita (review staf #2; T-027: PINTU UTAMA, di atas baris kode room di semua lebar): satu pintu dengan tindakan
 * "Mulai". Latihan misi tidak ditawarkan lagi di halaman awal (arahan pemilik; rute lama tetap ada bila mode lama aktif).
 * Tanpa profil -> kenalan dulu. T-027 D-258: di HP kalimat kartu diganti satu baris pendek (`pintuCeritaIsiHp`, hiasan:
 * aria-hidden); kalimat panjangnya tetap di halaman sebagai keterangan tautan (disembunyikan secara visual saja).
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
        {TOKOH.missRaksa.aktif ? <IkonMissPose pose="kasus" /> : <PotretRaki />}
      </span>
      <span className="lp-pintu-teks"><b className="lp-pintu-judul" id={id + 'j'}>{t('pemain.pintuCeritaJudul')}</b><span className="lp-pintu-isi lp-pintu-isi-lebar" id={id + 'i'}>{t('pemain.pintuCeritaIsi')}</span><span className="lp-pintu-isi lp-pintu-isi-hp" aria-hidden="true">{t('pemain.pintuCeritaIsiHp')}</span></span>
      <span className="lp-pintu-aksi" id={id + 'm'}>{t('pemain.pintuCeritaMulai')} <Arrow /></span>
    </Link>
    {profil ? <div className="alur-sebagai lp-sebagai"><span className="alur-sebagai-avatar" aria-hidden="true"><Avatar look={profil.look} size={30} mood="senang" /></span><span className="alur-sebagai-nama">{t('alur.mainSebagai', { nama: profil.nickname })}</span><span aria-hidden="true">·</span><Link className="alur-sebagai-ubah" to="/kenalan?ubah=1" aria-label={t('alur.ubahProfilAria')}>{t('alur.ubahKecil')}</Link></div> : null}
  </section>;
}

/**
 * Halaman awal (T-027, varian A, disetujui pemilik 17 Nov 2026): ilustrasi + sapaan Miss Raksa (review staf #1), lalu Mode
 * Cerita sebagai pintu utama, lalu baris kode room (Join Game, room acara bersama; review staf #4/#6). Urutan di sumber =
 * urutan di layar = urutan Tab, di semua lebar (D-265 a). Di HP (<= 700 px) seluruh halaman muat satu layar: judul besar
 * hanya untuk pembaca layar, baris profil menggantikan catatan "Tanpa akun". Spanduk acara kuis lama (hanya bila mode
 * lama aktif) tidak menjadi ajakan gabung kedua: tombolnya mengisi kode ke Join Game.
 */
export default function Landing() {
  useBahasa();
  const legacy = useLegacyEnabled();
  const acara = useAcaraTerbuka(legacy);
  const { profil } = useProfil();
  const [kodeSaran, setKodeSaran] = useState<string | null>(null);
  // Spanduk melayang (fixed), jadi kemunculannya tidak menggeser kartu yang hendak diketuk.
  // T-003 D-01: ilustrasi + sapaan (.lp-seni) DULUAN di DOM supaya di HP tampil paling atas & urutan baca = urutan lihat;
  // di desktop (>900px) grid menaruhnya kembali di kolom kanan (player.css, D-09).
  return <><PemuatAwal /><PlayerShell className={'lp-halaman alur-landing' + (acara ? ' alur-ada-spanduk' : '') + (profil ? ' lp-ada-profil' : '')} footer judul={null}><main className="lp-utama"><div className="lp-seni"><WelcomeArt /></div><div className="lp-kiri">
    <div className="lp-sapa">
      <span className="eyebrow">{t('pemain.landingEyebrow')}</span>
      <h1 className="lp-judul">{t('pemain.landingJudul1')}<br />{' '}<span>{t('pemain.landingJudul2')}</span></h1>
      <p className="lp-isi">{t('pemain.landingPilih')}</p>
    </div>
    <ModeCerita />
    <JoinGame kodeSaran={kodeSaran} />
    <span className="lp-catatan">{t('pemain.landingCatatan')}</span>
  </div></main>
    {/* Wadah status selalu ada (kosong) supaya pembaca layar mengumumkan spanduk saat muncul. */}
    <div className="alur-spanduk-wadah" role="status">{acara ? <div className="alur-spanduk"><span className="alur-spanduk-titik" aria-hidden="true" /><p>{t('alur.acaraDibuka', { nama: terjemahkanBawaan(acara.eventName) })}</p><button type="button" className="alur-spanduk-gabung" onClick={() => setKodeSaran(acara.code)}>{t('alur.gabung')} <Arrow /></button></div> : null}</div>
  </PlayerShell></>;
}
