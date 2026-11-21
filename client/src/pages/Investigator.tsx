/**
 * T-094 HUB "RAKSA INVESTIGATOR" (/investigator). Tinjauan penempatan Codex (team/REVIEW.md "Investigator placement review
 * (2026-11-21)"): seri Investigator punya nama dan alamat QR sendiri; pemain cerita yang ada tetap di bawahnya
 * (`/investigator/1`, `/investigator/2` = pemain yang sama dengan `/cerita/auto-2-inv` / `/cerita/auto-2-inv-2`; id episode,
 * simpanan cerita dan rekaman `raksa:investigasi:v1` tidak berubah, tanpa migrasi). Tanpa layar nama: tamu langsung main.
 *
 * Dua bentuk, keduanya satu layar HP (kepala 56 px, ruang isi 544 px pada 360 x 640; hitungan di bawah):
 *  SAMPUL (perangkat kosong: tanpa stempel, tanpa skor, tanpa progres): Miss Raksa investigator + "Kasus 1 · Truk di Tol", seni
 *    judul kasus (bingkai dashcam diam; kasus ber-`bingkai: 'seni'` = gambar seniKasus), kalimat kait kasus, "±5 menit · Main
 *    sendiri", SATU tombol besar "Buka Kasus 1". Tautannya membawa niat 'lewati-judul': pemain tidak menampilkan kartu judul yang
 *    sama sekali lagi (cerita/hp/PemainHP.tsx), jadi satu ketukan = masuk ke kasus.
 *    68 + 154 + 60 + 22 + 60 + jarak 4 x 10 = 404 px.
 *  PULANG (ada sesuatu di perangkat): tindakan utama menurut `aksiUtamaHub` (cerita/investigasi/hub.ts): "Lanjutkan Kasus N" bila
 *    ada kasus yang sedang berjalan (niat 'lanjut': gerbang "Lanjutkan / Mulai baru" pemain tidak ditanyakan lagi), "Buka Kasus N"
 *    untuk kasus pertama yang belum berstempel, "Main lagi" bila semua sudah (kasus dengan skor terbaik terendah, dari awal; skor
 *    terbaik dan stempel tetap). Di bawahnya kartu petugas (stempel, pangkat), total "x / 200", daftar kasus (stempel + skor
 *    terbaik; tiap baris membuka kasusnya), "Kasus 3 · segera hadir" terkunci, dan "Tamu baru" (dengan konfirmasi).
 *    kepala 48 + tombol 56 + kartu 176 + total 24 + daftar 2 x 48 + 4 + terkunci 20 + tamu 44 + jarak 6 x 8 = 516 px
 *    (536 bila "1 kasus lagi menuju Senior" turun baris).
 * Teks antarmuka: kamus `hubInv`; judul dan kalimat kait kasus: teks episode (data kasus). Seni: hanya yang sudah ada.
 *
 * T-100 (Designer; pemilik: "add miss raksa as a detective ... so its looks legit game"): hub = LAYAR JUDUL game detektif piksel.
 *  PANGGUNG (kedua bentuk, selebar layar, 200 px; hiasan, aria-hidden): kantor detektif malam hari (seni/investigasi/hub-latar.png:
 *    jendela kota, papan gabus berbenang merah, lampu meja), logo piksel "RAKSA INVESTIGATOR", dan Miss Raksa DETEKTIF setengah
 *    badan (hub-miss.png: pose kaca pembesar T-084 + mantel di atas seragam kuning + map kasus), 128 x 168 px. Gerak diam halus:
 *    ia naik-turun 2 px dan kaca pembesarnya berkilau; gerak dikurangi = diam.
 *  SAMPUL: di meja kayu, BERKAS KASUS: tab map "KASUS #1 · Truk di Tol", bingkai dashcam sebagai FOTO berklip dengan cap merah
 *    "KASUS BARU", kalimat kait kasus dan tag "±5 menit · Main sendiri"; lalu tombol game "Buka Kasus 1".
 *    panggung 200 - 18 (berkas menumpang tepi meja) + berkas ~190 + 12 + tombol 64 = ~450 px dari 584 (360 x 640).
 *  PULANG: panggung yang sama, berkas ringkas kasus yang dituju + tombol utama (di atas lipatan: 200 - 18 + ~130 = ~312 px), lalu
 *    kartu petugas, total, dan daftar kasus sebagai MAP-MAP di meja (Kasus 2 = map kedua), terkunci, Tamu baru. Halaman digulir.
 *  Logika T-094 / T-099 dan semua kait data- tidak berubah; kunci baru hanya `hubInv.berkasTab` dan `hubInv.capBaru`.
 *
 * T-099 (Codex "Cerita x Investigator approach" butir 2): di daftar kasus, baris kasus yang punya cerita (`konfig.cerita`, kasus 1)
 * membawa satu baris kecil "Dari cerita Episode 1"; kasus tanpa cerita (kasus 2) diperkenalkan sebagai berkas tersendiri: selama
 * belum dibuka barisnya berbunyi "Berkas baru · belum dibuka", tanpa kata yang mengaitkannya ke cerita. Sampul perangkat kosong
 * TIDAK menyebut cerita (pintu masuk langsung, bukan lanjutan). Baris tiga-tulisan itu 56 px (48 + 8): PULANG 516 -> 524 px
 * (544 bila "1 kasus lagi menuju Senior" turun baris).
 */
import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { PilihBahasa } from '../components/PilihBahasa';
import { Arrow, SoundButton } from '../components/PlayerShell';
import { t, useBahasa } from '../i18n';
import { LOOK_BAWAAN, useProfil } from '../state/profil';
import { useHalaman } from '../ui/halaman';
import { Modal } from '../ui/kit';
import { BingkaiDashcam } from '../cerita/hp/arena/ArenaDashcam';
import { aksiUtamaHub, daftarKasusHub, tamuBaruSemuaKasus, type KasusHub } from '../cerita/investigasi/hub';
import { RUTE_HUB, ruteKasus, stateNiat } from '../cerita/investigasi/rute';
import { bacaRekaman, berlanggananInvestigasi, pangkat, STEMPEL_SENIOR, TOTAL_MAKS, totalSkor, versiInvestigasi } from '../cerita/investigasi/simpan';
import { SKOR_MAKS } from '../cerita/investigasi/skor';
import { IkonInv, stempelKasus } from '../cerita/investigasi/ui/dasar';
import { seniKasus } from '../cerita/investigasi/ui/seniKasus';
import { berlanggananCerita, mulaiBaru, versiPenyimpananCerita } from '../cerita/simpan';
import { teksCerita } from '../cerita/teks';
import { KartuPetugas } from '../cerita/ui/KartuPetugas';
import seniLatar from '../cerita/seni/investigasi/hub-latar.png';
import seniLogo from '../cerita/seni/investigasi/hub-logo.png';
import seniMiss from '../cerita/seni/investigasi/hub-miss.png';
import seniKlip from '../cerita/seni/investigasi/klip.png';
import '../cerita/ui/cerita.css';
import '../cerita/hp/hp.css';
import '../cerita/investigasi/ui/investigasi.css';
import '../cerita/investigasi/ui/alur.css';
import './investigator.css';

export default function Investigator() {
  const { bahasa } = useBahasa();
  const { profil } = useProfil();
  // Hub ikut perubahan rekaman Investigator dan progres cerita (tab ini dan tab lain).
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita, () => 0);
  useHalaman(t('hubInv.nama'));
  const nav = useNavigate();
  const [tanyaTamu, setTanyaTamu] = useState(false);

  const r = bacaRekaman();
  const daftar = daftarKasusHub(r);
  const aksi = aksiUtamaHub(daftar, r);
  // Build tanpa kasus Investigator (VITE_CERITA_TANPA): tidak ada yang bisa dibuka di sini.
  if (!aksi) return <Navigate to="/" replace />;

  const tx = (k: KasusHub, kunci: string) => teksCerita(k.ep, kunci, bahasa);
  const judul = (k: KasusHub) => t('hubInv.kasusJudul', { n: k.nomor, judul: tx(k, k.konfig.judul) });
  const k = aksi.kasus;
  const tab = (x: KasusHub) => t('hubInv.berkasTab', { n: x.nomor, judul: tx(x, x.konfig.judul) });
  // T-100: panggung layar judul (hiasan; nama seri sudah ada di h1 kepala halaman).
  const panggung = (
    <div className="inv-panggung" aria-hidden="true" style={{ '--inv-latar': `url(${seniLatar})` } as CSSProperties}>
      <div className="inv-panggung-isi">
        <img className="inv-logo" src={seniLogo} alt="" width={92} height={38} />
        <span className="inv-miss" data-miss-detektif=""><img src={seniMiss} alt="" width={64} height={88} /><i className="inv-kilau" /></span>
      </div>
    </div>
  );
  const kepala = (
    <header className="hp-kepala">
      <Link className="hp-kembali" to="/" aria-label={t('hubInv.kembali')}><Arrow back /></Link>
      <div className="hp-judul"><h1 className="hp-judul-teks inv-hub-nama" tabIndex={-1}><b>{t('hubInv.nama')}</b></h1></div>
      <div className="inv-hub-kanan"><PilihBahasa /><SoundButton /></div>
    </header>
  );

  if (aksi.jenis === 'sampul') {
    return (
      <div className="player-ui cer-layar hp-layar inv-hub" data-teks-besar="" data-hub="sampul">
        {kepala}
        <main className="hp-main">
          <section className="iv-layar inv-hub-sampul" aria-labelledby="inv-hub-kasus">
            {panggung}
            <div className="inv-berkas" data-berkas-kasus={k.konfig.kasus}>
              <h2 id="inv-hub-kasus" className="inv-berkas-tab">{tab(k)}</h2>
              <div className="inv-berkas-badan">
                <div className="inv-foto">
                  <img className="inv-klip" src={seniKlip} alt="" aria-hidden="true" width={10} height={22} />
                  {k.konfig.bingkai === 'dashcam' ? <BingkaiDashcam /> : <img className="iv-seni-kasus" src={seniKasus(k.konfig.kasus).judul} alt="" />}
                  <b className="inv-cap" aria-hidden="true">{t('hubInv.capBaru')}</b>
                </div>
                <div className="inv-berkas-teks">
                  <p className="inv-hub-kait">{tx(k, k.konfig.kait)}</p>
                  <p className="inv-hub-durasi">{t('hubInv.durasi', { n: k.ep.durasiMenit })}</p>
                </div>
              </div>
            </div>
            <Link className="primary-action iv-tombol inv-hub-utama" to={ruteKasus(k.nomor)} state={stateNiat('lewati-judul')} data-hub-utama="buka">{t('hubInv.buka', { n: k.nomor })}</Link>
          </section>
        </main>
      </div>
    );
  }

  const nama = profil?.nickname ?? tx(k, 'kenalan.namaBawaan');
  const look = profil?.look ?? LOOK_BAWAAN;
  const menuju = r.stempel.length === STEMPEL_SENIOR - 1;
  // "Main lagi" = kasus itu dari kartu judulnya (progres ceritanya diarsipkan seperti "Main lagi" di daftar episode); skor terbaik
  // dan stempel ada di rekaman Investigator, jadi tidak ikut terhapus.
  const mainLagi = () => { mulaiBaru(k.ep); nav(ruteKasus(k.nomor)); };
  const statusBaris = (x: KasusHub) => (x.terbaik !== null ? t('hubInv.terbaik', { skor: x.terbaik, maks: SKOR_MAKS })
    : x.status === 'baru' && !x.konfig.cerita ? t('hubInv.berkasBaru') : t(`hubInv.status.${x.status}`));
  return (
    <div className="player-ui cer-layar hp-layar inv-hub" data-teks-besar="" data-hub={aksi.jenis}>
      {kepala}
      <main className="hp-main">
        <section className="iv-layar inv-hub-pulang" aria-labelledby="inv-hub-kasus">
          {panggung}
          <div className="inv-berkas" data-ringkas="" data-berkas-kasus={k.konfig.kasus}>
            <h2 id="inv-hub-kasus" className="inv-berkas-tab">{tab(k)}</h2>
            <div className="inv-berkas-badan">
              <p className="inv-hub-sub">{aksi.jenis === 'lagi' ? t('hubInv.lagiKet', { n: k.nomor }) : aksi.jenis === 'lanjut' ? t('hubInv.status.jalan') : tx(k, k.konfig.kait)}</p>
          {aksi.jenis === 'lagi' ? (
            <button type="button" className="primary-action iv-tombol inv-hub-utama" data-hub-utama="lagi" onClick={mainLagi}>{t('hubInv.lagi')}</button>
          ) : aksi.jenis === 'lanjut' ? (
            <Link className="primary-action iv-tombol inv-hub-utama" to={ruteKasus(k.nomor)} state={stateNiat('lanjut')} data-hub-utama="lanjut">{t('hubInv.lanjut', { n: k.nomor })}</Link>
          ) : (
            <Link className="primary-action iv-tombol inv-hub-utama" to={ruteKasus(k.nomor)} data-hub-utama="buka">{t('hubInv.buka', { n: k.nomor })}</Link>
          )}
            </div>
          </div>
          <KartuPetugas nama={nama} look={look} investigasi={{ stempel: r.stempel, pangkat: pangkat(r.stempel.length), baru: false }} />
          <p className="iv-total" data-total-kasus="">
            <b>{t('hubInv.total')} <span data-total-skor="">{totalSkor(r)}</span> / {TOTAL_MAKS}</b>
            {menuju ? <em data-menuju-pangkat="">{t('hubInv.menuju')}</em> : null}
          </p>
          <ul className="inv-hub-daftar" aria-label={t('hubInv.daftar')}>
            {daftar.map((x) => (
              <li key={x.konfig.kasus}>
                <Link className="inv-hub-baris" to={ruteKasus(x.nomor)} data-kasus={x.konfig.kasus} data-status={x.status} data-stempel={x.stempel ? '' : undefined} data-asal={x.konfig.cerita ? '' : undefined}>
                  <IkonInv nama={x.stempel ? stempelKasus(x.konfig.kasus) : 'stempel-kosong'} />
                  <span className="inv-hub-baris-teks">
                    <b>{judul(x)}</b><small>{statusBaris(x)}</small>
                    {x.konfig.cerita ? <small className="inv-hub-asal" data-asal-cerita={x.konfig.cerita.episode}>{tx(x, x.konfig.cerita.asal)}</small> : null}
                  </span>
                  <span className="inv-hub-panah" aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
            <li className="inv-hub-terkunci" data-kasus-terkunci=""><IkonInv nama="kunci" kali={1} /><span>{t('hubInv.terkunci')}</span></li>
          </ul>
          <p className="iv-tamu inv-hub-tamu"><button type="button" className="hp-tautan" data-tamu-baru="" aria-haspopup="dialog" onClick={() => setTanyaTamu(true)}>{t('hubInv.tamuBaru')}</button></p>
        </section>
      </main>
      {tanyaTamu ? (
        <Modal judul={t('hubInv.tamuBaru')} onTutup={() => setTanyaTamu(false)} lebar={420}
          aksi={<>
            <button type="button" className="btn btn-netral" onClick={() => setTanyaTamu(false)}>{t('hubInv.batal')}</button>
            <button type="button" className="btn btn-utama" data-tamu-baru-ya="" onClick={() => { tamuBaruSemuaKasus(); setTanyaTamu(false); nav(RUTE_HUB, { replace: true }); }}>{t('hubInv.tamuYa')}</button>
          </>}>
          <p>{t('hubInv.tamuTanya')}</p>
        </Modal>
      ) : null}
    </div>
  );
}
