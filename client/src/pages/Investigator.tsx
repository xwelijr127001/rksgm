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
 * T-118 (Designer; pemilik, iPhone: "Right is too compact on the top"): tinggi panggung tidak lagi dari tinggi LAYAR (aturan < 820 px
 *  memendekkan panggung di HP biasa dan menyisakan seperempat layar kosong di bawah kartu kasus). Sekarang halaman = kolom setinggi
 *  layar dan panggung mengambil SISA tinggi: paling pendek 112 px, paling tinggi 320 px (hub pulang) / 360 px (sampul); sisa
 *  sesudah itu dibagi rata ke jarak antarblok, blok terakhir menempel di bawah. Logo dipilih dari tinggi panggung yang sebenarnya
 *  (container query): lencana perisai mulai 176 px, pelat di bawahnya. Miss Raksa berdiri di belakang pita tanah (digambar ulang
 *  di depannya), jadi tab berkas tidak menutupinya; ia utuh mulai panggung 204 px.
 *  Isi selain panggung (id): pulang 312 px (+56 tautan kode acara, +20 keterangan dua baris, +114 ketik kode + galat, +112 ikut
 *  papan); sampul 236 px (+58 tautan, +116 ketik kode + galat). Ruang = tinggi layar - 59 - 12.
 *    360 x 640 (569): pulang panggung 257 (terburuk: isi 446, panggung 123) · sampul 333 (terburuk: isi 352, panggung 217)
 *    390 x 700 (629): pulang 317 (terburuk 183) · sampul 360 + sisa 33 (terburuk 277)
 *    390 x 760 (689): pulang 320 + sisa 57 (terburuk 243) · sampul 360 + sisa 93 (terburuk 337)
 *    430 x 932 (861): pulang 320 + sisa 229 · sampul 360 + sisa 265
 *
 * T-117 (Designer; pemilik memilih T-116 opsi 4 "Raksa Cerah"): RUPA hub diganti, tata letak / logika / kait data- T-114 tetap.
 *  PANGGUNG: langit siang kuning-krem dengan awan, gedung jingga lembut dan pita tanah (seni/investigasi/cerah-latar.png, menempel
 *    bawah), sinar matahari CSS yang berputar pelan di belakang logo, logo LENCANA PERISAI "RAKSA INVESTIGATOR" (cerah-logo.png;
 *    hub pulang di layar di bawah 820 px: pelat cerah-logo-kecil.png), Miss Raksa detektif sebagai STIKER bertepi putih
 *    (cerah-miss.png) di depan cakram matahari, dua set kilau yang berkelip bergantian. Gerak dikurangi = semua diam.
 *  Halaman krem, berkas putih bertab jingga, tombol jingga dengan dua kilau, strip petugas dan kartu kasus putih / kuning.
 *  Tinggi panggung: 104 baris seni (208 px); hub pulang 80 (160 px) di bawah 820 px dan 56 (112 px) di bawah 700 px; sampul 90
 *    (180 px) di bawah 700 px. Hitungan satu layar T-114 tetap berlaku: 360 x 640 (ruang 569): pulang 480 .. 558, sampul 474 .. 554;
 *    390 x 700 (ruang 629): pulang 528 .. 606, sampul 502 .. 582 (panggung 208).
 *
 * T-114 (Designer; pemilik: "we need to make all of it no need scrolling"): KEDUA bentuk hub muat satu layar HP tanpa gulir.
 * Ruang: 640 - kepala 59 (56 + garis jingga 3) - bantalan bawah 12 = 569 px; 700 -> 629 px. Hitungan (investigator.css):
 *  PULANG  panggung ringkas 112 (700: 160; Miss Raksa setengah dada di belakang tepi meja) - 26 + berkas tindakan utama 128
 *    (148 bila keterangan dua baris) + strip petugas 48 (stempel, pangkat, total; ketuk = lembar KARTU PETUGAS berisi kartu,
 *    total, tujuan pangkat dan hadiah; "Tamu baru" di samping strip) + tiga KARTU KASUS sejajar 140 + 6 (foto T-113, nomor, stempel,
 *    judul, satu kata keadaan / skor) + entri acara 48 (ikut papan: 104; ketik kode + galat: 106) + jarak 4 x 8
 *    = 480 .. 558 px dari 569 (700: 528 .. 606 dari 629).
 *  SAMPUL  panggung 180 (700 ke atas: 200) - 26 + berkas 184 + 10 + tombol 68 + 10 + entri 48 .. 106 = 474 .. 532 px dari 569.
 * Kalimat kait per kasus (T-113) pindah ke berkas tindakan utama; "Dari cerita Episode 1" ikut di baris keterangannya.
 *
 * T-113 (Designer; pemilik: "it would be nice if we had a preview or something a picture"): tiap baris daftar kasus = BERKAS KASUS
 * kecil berfoto. Kiri: foto piksel 96 x 68 berklip dan sedikit miring (kasus 1 bingkai dashcam truk + lajur, kasus 2 MPV malam di
 * Jl. Melati, kasus 3 bumper + spion retak); di atas foto: stempel kasus miring + skor terbaik "90/100" bila sudah berstempel,
 * tag "Sedang berjalan" atau "Baru" bila belum. Kanan: judul (paling banyak 2 baris), kalimat kait (`hubInv.kaitDaftar.<kasus>`),
 * baris status dan "Dari cerita Episode 1" seperti semula; panah tetap. Seluruh baris tetap SATU tautan (tinggi sekitar 100 px).
 * Lebar 360: 336 isi - tepi 4 - bantalan 18 - foto 106 - panah 12 - jarak 16 = 180 px teks. Kait data- tidak berubah.
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
import { EVENT_QUERY_PARAM } from '@shared/investigator/event';
import { entriAcara } from '../cerita/investigasi/acara';
import { aksiUtamaHub, daftarKasusHub, tamuBaruSemuaKasus, tujuanPangkat, type KasusHub } from '../cerita/investigasi/hub';
import { RUTE_HUB, ruteKasus, stateNiat } from '../cerita/investigasi/rute';
import { bacaRekaman, berlanggananInvestigasi, hadiahRekaman, pangkatRekaman, stempelSeri, TOTAL_MAKS, totalSkor, versiInvestigasi } from '../cerita/investigasi/simpan';
import { SKOR_MAKS } from '../cerita/investigasi/skor';
import { IkonStempel } from '../cerita/investigasi/ui/dasar';
import { PanelAward } from '../cerita/investigasi/ui/panel';
import { seniKasus } from '../cerita/investigasi/ui/seniKasus';
import { berlanggananCerita, mulaiBaru, versiPenyimpananCerita } from '../cerita/simpan';
import { teksCerita } from '../cerita/teks';
import { KartuPetugas } from '../cerita/ui/KartuPetugas';
import seniLatar from '../cerita/seni/investigasi/cerah-latar.png';
import seniLogo from '../cerita/seni/investigasi/cerah-logo.png';
import seniLogoKecil from '../cerita/seni/investigasi/cerah-logo-kecil.png';
import seniMiss from '../cerita/seni/investigasi/cerah-miss.png';
import seniCakram from '../cerita/seni/investigasi/cerah-cakram.png';
import seniKilauA from '../cerita/seni/investigasi/cerah-kilau-a.png';
import seniKilauB from '../cerita/seni/investigasi/cerah-kilau-b.png';
import seniKlip from '../cerita/seni/investigasi/klip.png';
import fotoKasus1 from '../cerita/seni/investigasi/hub-kasus-1.png';
import fotoKasus2 from '../cerita/seni/investigasi/hub-kasus-2.png';
import fotoKasus3 from '../cerita/seni/investigasi/hub-kasus-3.png';
import '../cerita/ui/cerita.css';
import '../cerita/hp/hp.css';
import '../cerita/investigasi/ui/investigasi.css';
import '../cerita/investigasi/ui/alur.css';
import './investigator.css';

/** T-113: foto kecil 96 x 68 per kasus di daftar kasus (character/investigator-t113/bangun.mts); kasus lain = tanpa foto. */
const FOTO_KASUS: Readonly<Record<string, string>> = { 'kasus-1': fotoKasus1, 'kasus-2': fotoKasus2, 'kasus-3': fotoKasus3 };

export default function Investigator() {
  const { bahasa } = useBahasa();
  const { profil } = useProfil();
  // Hub ikut perubahan rekaman Investigator dan progres cerita (tab ini dan tab lain).
  useSyncExternalStore(berlanggananInvestigasi, versiInvestigasi, () => 0);
  useSyncExternalStore(berlanggananCerita, versiPenyimpananCerita, () => 0);
  useHalaman(t('hubInv.nama'));
  const nav = useNavigate();
  const [tanyaTamu, setTanyaTamu] = useState(false);
  const [kartu, setKartu] = useState(false);

  const r = bacaRekaman();
  const daftar = daftarKasusHub(r);
  const aksi = aksiUtamaHub(daftar, r);
  // Build tanpa kasus Investigator (VITE_CERITA_TANPA): tidak ada yang bisa dibuka di sini.
  if (!aksi) return <Navigate to="/" replace />;

  const tx = (k: KasusHub, kunci: string) => teksCerita(k.ep, kunci, bahasa);
  const judul = (k: KasusHub) => t('hubInv.kasusJudul', { n: k.nomor, judul: tx(k, k.konfig.judul) });
  const k = aksi.kasus;
  // T-106: titik pasang papan acara (kartu 6 mendaftarkan komponennya; tanpa pendaftar tidak ada yang tampil).
  const Entri = entriAcara();
  const entri = Entri ? <Entri kode={typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(EVENT_QUERY_PARAM)} /> : null;
  const tab = (x: KasusHub) => t('hubInv.berkasTab', { n: x.nomor, judul: tx(x, x.konfig.judul) });
  // T-100 / T-117: panggung layar judul "Raksa Cerah" (hiasan; nama seri sudah ada di h1 kepala halaman).
  const panggung = (
    <div className="inv-panggung" aria-hidden="true" style={{ '--inv-latar': `url(${seniLatar})` } as CSSProperties}>
      <div className="inv-panggung-isi">
        <i className="inv-sinar" />
        <img className="inv-logo inv-logo-besar" src={seniLogo} alt="" width={96} height={72} />
        <img className="inv-logo inv-logo-kecil" src={seniLogoKecil} alt="" width={100} height={38} />
        <span className="inv-miss" data-miss-detektif="">
          <img className="inv-cakram" src={seniCakram} alt="" width={80} height={80} />
          <img className="inv-miss-gambar" src={seniMiss} alt="" width={68} height={88} />
          <img className="inv-kilau-set" data-set="a" src={seniKilauA} alt="" width={100} height={92} />
          <img className="inv-kilau-set" data-set="b" src={seniKilauB} alt="" width={100} height={92} />
          <i className="inv-kilau" />
        </span>
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
            {entri}
          </section>
        </main>
      </div>
    );
  }

  const nama = profil?.nickname ?? tx(k, 'kenalan.namaBawaan');
  const look = profil?.look ?? LOOK_BAWAAN;
  // T-106: tujuan pangkat berikutnya (N kasus lagi menuju Senior; sesudah tiga stempel: N poin lagi menuju Kepala) dan hadiah seri.
  const tujuan = tujuanPangkat(r);
  const hadiah = hadiahRekaman(r);
  // "Main lagi" = kasus itu dari kartu judulnya (progres ceritanya diarsipkan seperti "Main lagi" di daftar episode); skor terbaik
  // dan stempel ada di rekaman Investigator, jadi tidak ikut terhapus.
  const mainLagi = () => { mulaiBaru(k.ep); nav(ruteKasus(k.nomor)); };
  const statusBaris = (x: KasusHub) => (x.terbaik !== null ? t('hubInv.terbaik', { skor: x.terbaik, maks: SKOR_MAKS })
    : x.status === 'baru' && !x.konfig.cerita ? t('hubInv.berkasBaru') : t(`hubInv.status.${x.status}`));
  const namaPangkat = t(`investigasi.pangkat.${pangkatRekaman(r)}`);
  const kaitBaris = (x: KasusHub) => (FOTO_KASUS[x.konfig.kasus] ? t(`hubInv.kaitDaftar.${x.konfig.kasus}`) : tx(x, x.konfig.kait));
  return (
    <div className="player-ui cer-layar hp-layar inv-hub" data-teks-besar="" data-hub={aksi.jenis}>
      {kepala}
      <main className="hp-main">
        <section className="iv-layar inv-hub-pulang" aria-labelledby="inv-hub-kasus">
          {panggung}
          <div className="inv-berkas" data-ringkas="" data-berkas-kasus={k.konfig.kasus}>
            <h2 id="inv-hub-kasus" className="inv-berkas-tab">{tab(k)}</h2>
            <div className="inv-berkas-badan">
              <p className="inv-hub-sub">
                {aksi.jenis === 'lagi' ? t('hubInv.lagiKet', { n: k.nomor }) : aksi.jenis === 'lanjut' ? t('hubInv.status.jalan') : kaitBaris(k)}
                {aksi.jenis !== 'lagi' && k.konfig.cerita ? <small className="inv-hub-asal" data-asal-cerita={k.konfig.cerita.episode}> · {tx(k, k.konfig.cerita.asal)}</small> : null}
              </p>
          {aksi.jenis === 'lagi' ? (
            <button type="button" className="primary-action iv-tombol inv-hub-utama" data-hub-utama="lagi" onClick={mainLagi}>{t('hubInv.lagi')}</button>
          ) : aksi.jenis === 'lanjut' ? (
            <Link className="primary-action iv-tombol inv-hub-utama" to={ruteKasus(k.nomor)} state={stateNiat('lanjut')} data-hub-utama="lanjut">{t('hubInv.lanjut', { n: k.nomor })}</Link>
          ) : (
            <Link className="primary-action iv-tombol inv-hub-utama" to={ruteKasus(k.nomor)} data-hub-utama="buka">{t('hubInv.buka', { n: k.nomor })}</Link>
          )}
            </div>
          </div>
          <div className="inv-hub-petugas">
            <button type="button" className="inv-hub-strip" data-kartu-buka="" aria-haspopup="dialog" aria-label={t('hubInv.stripBuka', { pangkat: namaPangkat, skor: totalSkor(r), maks: TOTAL_MAKS })} onClick={() => setKartu(true)}>
              <span className="inv-hub-strip-stempel" aria-hidden="true">{daftar.map((x) => <IkonStempel key={x.konfig.kasus} kasus={x.konfig.kasus} terisi={x.stempel} kali={1} />)}</span>
              <span className="inv-hub-strip-teks" aria-hidden="true">
                <b>{namaPangkat}</b>
                <small data-total-kasus="">{t('hubInv.total')} <span data-total-skor="">{totalSkor(r)}</span> / {TOTAL_MAKS}</small>
              </span>
              <span className="inv-hub-panah" aria-hidden="true">›</span>
            </button>
            <button type="button" className="inv-hub-tamu-tombol" data-tamu-baru="" aria-haspopup="dialog" onClick={() => setTanyaTamu(true)}>{t('hubInv.tamuBaru')}</button>
          </div>
          <ul className="inv-hub-daftar" aria-label={t('hubInv.daftar')}>
            {daftar.map((x) => (
              <li key={x.konfig.kasus}>
                <Link className="inv-hub-baris" to={ruteKasus(x.nomor)} aria-label={`${judul(x)}. ${statusBaris(x)}`} data-kasus={x.konfig.kasus} data-status={x.status} data-stempel={x.stempel ? '' : undefined} data-asal={x.konfig.cerita ? '' : undefined}>
                  <span className="inv-hub-foto" aria-hidden="true" data-foto-kasus={x.konfig.kasus}>
                    {FOTO_KASUS[x.konfig.kasus] ? <img className="inv-hub-foto-gambar" src={FOTO_KASUS[x.konfig.kasus]} alt="" width={96} height={68} /> : <i className="inv-hub-foto-gambar" />}
                    <b className="inv-hub-foto-no">{x.nomor}</b>
                    {x.stempel ? <span className="inv-hub-foto-cap"><IkonStempel kasus={x.konfig.kasus} /></span> : null}
                  </span>
                  <b className="inv-hub-baris-judul" aria-hidden="true">{tx(x, x.konfig.judul)}</b>
                  <small className="inv-hub-baris-status" aria-hidden="true" data-tag={x.terbaik !== null ? 'skor' : x.status}>
                    {x.terbaik !== null ? t('hubInv.skorFoto', { skor: x.terbaik, maks: SKOR_MAKS }) : x.status === 'jalan' ? t('hubInv.stripJalan') : x.status === 'baru' ? t('hubInv.tagBaru') : t('hubInv.status.selesai')}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
          {entri}
        </section>
      </main>
      {/* T-114: kartu petugas lengkap, total, tujuan pangkat dan hadiah seri di balik strip petugas */}
      {kartu ? (
        <Modal judul={t('hubInv.kartuJudul')} onTutup={() => setKartu(false)} lebar={420} kelas="inv-cerah" aksi={<button type="button" className="btn btn-utama" onClick={() => setKartu(false)}>{t('hubInv.batal')}</button>}>
          <div className="inv-hub-lembar" data-kartu-lembar="">
            <KartuPetugas nama={nama} look={look} investigasi={{ stempel: stempelSeri(r), pangkat: pangkatRekaman(r), baru: false }} />
            <p className="iv-total">
              <b>{t('hubInv.total')} {totalSkor(r)} / {TOTAL_MAKS}</b>
              {tujuan ? <em data-menuju-pangkat={tujuan.jenis}>{t(tujuan.jenis === 'senior' ? 'hubInv.menujuSenior' : 'hubInv.menujuKepala', { n: tujuan.kurang })}</em> : null}
            </p>
            {hadiah.length ? (
              <p className="inv-hub-hadiah" data-hadiah={hadiah.join(' ')}>
                {hadiah.map((a) => <span key={a}>{a === 'bingkai-kepala' ? null : <PanelAward id={a} kali={1} />}{t(`investigasi.hadiah.${a}`)}</span>)}
              </p>
            ) : null}
          </div>
        </Modal>
      ) : null}
      {tanyaTamu ? (
        <Modal judul={t('hubInv.tamuBaru')} onTutup={() => setTanyaTamu(false)} lebar={420} kelas="inv-cerah"
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
