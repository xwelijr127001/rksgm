/**
 * Layar AKHIR episode (v2, docs/rancangan-mode-cerita.md 11.1): SATU kartu, bukan laporan.
 *   potret nasabah dengan wajah AKHIR + label perasaan singkat ("Sesudahnya: Kesal" bila epilog berpindah adegan)
 *   -> nama akhir kecil (ikon nada + kata) -> judul hasil (h2, penerima fokus) -> satu kalimat sebab-akibat
 *   -> satu pelajaran -> dua aksi -> "Lihat perjalananku" + catatan simulasi.
 * Isi kartu dari kartuAkhir (tinjauan.ts: aturan eksplisit episode, bukan urutan alasan / angka kepercayaan).
 * Aksi: akhir baik = Selesai (utama) + Coba jalur lain (pemilih bagian); akhir lain = Coba lagi dari bagian
 * <titik ulang> (utama, langsung ulangBab) + Selesai, dengan satu kalimat akibatnya. Tanpa titik ulang: ulang dari
 * awal lewat konfirmasi yang ada (arsip). Epilog TIDAK diulang (sudah dibaca di dialog; tetap ada di Riwayat).
 * Tinjauan lengkap & pemilih bagian ada di dialog terpisah (PerjalananKu, PemilihBagian); membuka/menutupnya dan
 * ganti bahasa tidak mengubah state cerita. Tanpa skor, poin, waktu, atau "Episode berikutnya".
 *
 * T-024 (`satuLayar`, cangkang HP dengan ringkasan keputusan bernomor; angka = mock Designer D-226..D-235): SEMUA isi muat di
 * satu layar HP, tidak ada yang menggulir. Urutan: kepala (potret 56 px, perasaan, nama akhir) -> judul (maks. 2 baris) +
 * kalimat sebab (2 baris) -> grafik status ringkas -> legenda + strip 15 token keputusan -> Pelajaran (2 baris, gelembung Miss
 * Raksa); aksi tetap di bilah tersemat. Yang dipotong tetap utuh di SATU lembar bawah milik layar ini (LembarAkhir): ketuk token
 * = rincian keputusan itu (Sebelumnya / Berikutnya di dalamnya), ketuk kalimat sebab = kalimat utuh + "Lihat perjalananku",
 * ketuk Pelajaran = teks utuhnya. Bila layar terlalu pendek, pasAkhir.ts memilih yang mengalah. Legenda suasana, catatan
 * simulasi, status naskah: pindah ke Menu (PemainHP). Keterangan tombol ulang: hanya untuk pembaca layar (D-233).
 * Desktop / layar yang halamannya menggulir memakai bentuk lama di bawah, tidak berubah.
 *
 * T-099 (Codex "Cerita x Investigator approach" butir 2): episode ber-'kasusTerkait' (hanya auto-2) mendapat SATU tautan sekunder
 * "Selidiki lajur truk di Kasus 1" -> /investigator/1, hanya bila RAKSA_INVESTIGATOR menyala. Tombol yang ada, urutan dan
 * tekanannya tidak berubah; tautannya teks bergaris bawah di BAWAH kedua tombol. Di bilah tersemat cangkang HP barisnya 28 px
 * (bilah 69 -> 97 px), jadi kartu satu layar mendapat 28 px lebih sedikit: di 18 layar mock T-024 sisa ruang terkecil 17 px dan
 * grafik bisa menyusut 16 px (72 -> 56), jumlahnya 33 >= 28, jadi kalimat sebab tetap tampil; bila kelak tidak muat, aturan
 * pasAkhir yang ada yang bekerja (tidak ada yang meluap). Tanpa bendera, atau episode lain: tidak ada yang berubah.
 */
import './akhir.css';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import { TOKOH } from '@shared/brand';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import { useAppConfig } from '../../story/appConfig';
import { Modal } from '../../ui/kit';
import { ruteKasusTerkait } from '../investigasi/hub';
import { PotretNasabah } from '../seni';
import { PotretMissRaksa } from '../seni/tokoh/PotretMissRaksa';
import type { Ekspresi, Episode, IdAkhir, IdBab, KunciTeks, StateCerita } from '../tipe';
import { labelPerasaan, selaPembicara } from './bagian';
import { PotretPikselHp } from './latar/piksel/PotretPikselHp';
import { tokohPotret } from './latar/piksel/potret';
import { LembarAkhir } from './LembarAkhir';
import { usePasAkhir } from './pasAkhir';
import { GambarToken, IsiLembarTitik, PetaTitik, RingkasanKeputusan, RingkasanSatuLayar } from './RingkasanKeputusan';
import { PemilihBagian } from './PemilihBagian';
import { PerjalananKu, TandaNada } from './PerjalananKu';
import { kartuAkhir } from './tinjauan';
import { KartuPetugas } from './KartuPetugas';
import { infoTitik } from './titik';

/** Isi lembar bawah layar akhir satu layar: rincian satu keputusan, kalimat sebab utuh, atau teks Pelajaran utuh. */
type IsiLembar = { jenis: 'titik'; indeks: number } | { jenis: 'sebab' } | { jenis: 'pelajaran'; denganSebab: boolean } | { jenis: 'kartu' };

export function LayarAkhir({ ep, state, bahasa, namaPemain, tx, ditemukan, onUlangBab, onUlangEpisode, slotAksi = null, satuLayar = false }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  /** Nama pemain: kartu petugas di kepala (T-052; epilog tidak mengulangnya). */
  namaPemain: string;
  tx: (k: KunciTeks) => string;
  /** Akhir yang pernah dicapai di perangkat ini (simpan.ts). */
  ditemukan: IdAkhir[];
  onUlangBab: (bab: IdBab) => void;
  onUlangEpisode: () => void;
  /** (cangkang HP, T-018 Tahap 2 D-134) bilah aksi dipindah ke elemen ini (tersemat di bawah) dan label ulang dipendekkan. */
  slotAksi?: HTMLElement | null;
  /** (cangkang HP, T-024) layar terkunci: kartu satu layar tanpa gulir (hanya episode dengan ringkasan keputusan bernomor). */
  satuLayar?: boolean;
}) {
  const cfg = useAppConfig();
  const [dialog, setDialog] = useState<'pemilih' | 'perjalanan' | null>(null);
  const [tanyaUlang, setTanyaUlang] = useState(false);
  const idKet = useId();
  const k = kartuAkhir(ep, state);
  const info = k ? ep.akhir[k.akhir] : undefined;
  // T-024: bentuk satu layar + SATU lembar (state di sini; token, kalimat sebab, gelembung Pelajaran hanya memintanya dibuka).
  const satu = satuLayar && !!ep.titik?.length && !!k && !!info;
  const [lembar, setLembar] = useState<IsiLembar | null>(null);
  const kartuRef = useRef<HTMLElement>(null);
  /** Kontrol yang membuka lembar teks utuh (fokus kembali ke sana; tombol tidak selalu menerima fokus saat diketuk di iOS). */
  const pemicuRef = useRef<HTMLElement | null>(null);
  usePasAkhir(kartuRef, satu, `${bahasa}|${k?.akhir ?? ''}|${k?.aturan ?? ''}|${slotAksi ? 1 : 0}`);
  // Keluar dari cangkang (layar diputar / dilebarkan) = lembar ditutup bersama bentuk satu layarnya.
  useEffect(() => { if (!satu) setLembar(null); }, [satu]);
  // T-064: Episode 1 Dev = short walk-up ending (opt-in; every other episode keeps the card below).
  if (ep.tampilan?.akhirKenalan) return <AkhirKenalan ep={ep} state={state} tx={tx} slotAksi={slotAksi} />;
  if (!k || !info) return null;

  const nasabah = ep.pemeran[ep.nasabah];
  const namaNasabah = nasabah ? tx(nasabah.nama) : '';
  const suasana = labelPerasaan(ep, k.ekspresi, tx);
  const adaMentor = TOKOH.missRaksa.aktif && Object.values(ep.pemeran).some((p) => p.potret === 'missRaksa');
  const wajahMentor = ekspresiMentorTerakhir(ep, state) ?? (k.nada === 'baik' ? 'tersenyum' : 'netral');
  const baik = k.nada === 'baik';
  const ulang = k.ulang;
  const babUlang = ulang ? ep.bab.find((b) => b.id === ulang) : undefined;

  // Episode berpanggung latar: potret piksel episode (atlas yang sama dengan panggung & dialognya).
  const avatarNasabah = tokohPotret(ep, ep.nasabah);
  const idMentor = Object.keys(ep.pemeran).find((id) => ep.pemeran[id]!.potret === 'missRaksa') ?? 'missRaksa';
  const avatarMentor = tokohPotret(ep, idMentor);
  const namaMentor = ep.pemeran[idMentor] ? tx(ep.pemeran[idMentor]!.nama) : '';
  const adaRingkasan = !!ep.titik?.length;

  const pilihBab = (bab: IdBab) => { setDialog(null); onUlangBab(bab); };
  const ulangDariAwal = () => { setTanyaUlang(false); setDialog(null); onUlangEpisode(); };
  // T-099: satu tautan sekunder ke kasus Investigator episode ini (hanya episode ber-kasusTerkait, hanya dengan benderanya).
  const ruteKasusIni = cfg.status === 'ready' && cfg.config.investigator ? ruteKasusTerkait(ep) : null;
  const tautKasus = ruteKasusIni && ep.kasusTerkait ? (
    <p className="akh-kasus" data-ukur="aksi-kasus">
      <Link className="akh-kasus-tautan" to={ruteKasusIni} data-kasus-terkait={ep.kasusTerkait.episode}>{tx(ep.kasusTerkait.ajakan)} <Arrow /></Link>
    </p>
  ) : null;

  // Bilah aksi (dipindah ke slot cangkang HP bila ada) + dialog bersama: dipakai kedua bentuk kartu.
  const blokAksi = (
      <div className="akh-aksi" data-tersemat={slotAksi ? '' : undefined}>
        {baik ? (
          <>
            <Link className="primary-action akh-utama" to="/cerita" data-ukur="aksi-utama">
              <span>{t('ceritaAkhir.selesai')}</span>
              <Arrow />
            </Link>
            <button type="button" className="akh-kedua" data-ukur="aksi-kedua" aria-haspopup="dialog" onClick={() => setDialog('pemilih')}>
              {t('ceritaAkhir.cobaJalurLain')}
            </button>
          </>
        ) : (
          <>
            {ulang ? (
              <button type="button" className="primary-action akh-utama" data-ukur="aksi-utama" data-bab={ulang} aria-label={slotAksi ? t('ceritaAkhir.cobaLagiDari', { judul: babUlang ? tx(babUlang.judul) : ulang }) : undefined} aria-describedby={idKet} onClick={() => onUlangBab(ulang)}>
                <span>{slotAksi ? t('ceritaAkhir.ulangiBagian', { n: ep.bab.findIndex((b) => b.id === ulang) + 1 }) : t('ceritaAkhir.cobaLagiDari', { judul: babUlang ? tx(babUlang.judul) : ulang })}</span>
                <IkonUlang />
              </button>
            ) : (
              <button type="button" className="primary-action akh-utama" data-ukur="aksi-utama" aria-haspopup="dialog" aria-describedby={idKet} onClick={() => setTanyaUlang(true)}>
                <span>{t('ceritaAkhir.ulangAwal')}</span>
                <IkonUlang />
              </button>
            )}
            <Link className="akh-kedua" to="/cerita" data-ukur="aksi-kedua">{t('ceritaAkhir.selesai')}</Link>
          </>
        )}
      </div>
  );
  // Bentuk satu layar: aksi HANYA di slot tersemat (sebelum slot terpasang tidak digambar, supaya tidak ikut diukur).
  const aksi = slotAksi ? createPortal(<>{blokAksi}{tautKasus}</>, slotAksi) : satu ? null : blokAksi;
  const dialogBersama = (
    <>
      {dialog === 'pemilih' ? (
        <PemilihBagian
          ep={ep}
          state={state}
          tx={tx}
          disarankan={ulang}
          onPilih={pilihBab}
          onUlangBaru={() => setTanyaUlang(true)}
          onTutup={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'perjalanan' ? (
        <PerjalananKu
          ep={ep}
          state={state}
          bahasa={bahasa}
          tx={tx}
          ditemukan={ditemukan}
          onCobaBagian={() => setDialog('pemilih')}
          onTutup={() => setDialog(null)}
        />
      ) : null}
      {/* Konfirmasi ulang episode (perilaku lama: arsip + akhir yang ditemukan tetap tercatat); bisa ditumpuk di atas pemilih. */}
      {tanyaUlang ? (
        <Modal
          judul={t('cerita.ulangJudul')}
          onTutup={() => setTanyaUlang(false)}
          aksi={<>
            <button type="button" className="btn btn-netral" onClick={() => setTanyaUlang(false)}>{t('cerita.batal')}</button>
            <button type="button" className="btn btn-utama" onClick={ulangDariAwal}>{t('cerita.ulangYa')}</button>
          </>}
        >
          <p>{t('cerita.ulangIsi')}</p>
        </Modal>
      ) : null}
    </>
  );

  if (satu) {
    const titik = ep.titik ?? [];
    const dibuka = lembar?.jenis === 'titik' ? titik[lembar.indeks] ?? null : null;
    const tutupLembar = () => setLembar(null);
    const bukaTeks = (jenis: 'sebab' | 'pelajaran', el: HTMLElement) => {
      pemicuRef.current = el;
      // Kalimat sebab disembunyikan aturan pas (layar sangat pendek): lembar Pelajaran membawanya, supaya tidak ada teks yang hilang.
      const tanpaSebab = (kartuRef.current?.getAttribute('data-pas') ?? 'utuh') !== 'utuh';
      setLembar(jenis === 'sebab' ? { jenis } : { jenis, denganSebab: tanpaSebab });
    };
    const pindah = (ke: number) => { if (ke >= 0 && ke < titik.length) setLembar({ jenis: 'titik', indeks: ke }); };
    const wajahMentorKecil = adaMentor ? (avatarMentor ? <PotretPikselHp tokoh={avatarMentor} ekspresi={wajahMentor} ukuran={32} label="" /> : <PotretMissRaksa ekspresi={wajahMentor} ukuran={32} />) : null;
    const namaAkhir = <>{t(`cerita.nada.${k.nada}`)}{selaPembicara()}<b>{tx(info.judul)}</b></>;
    // Isi lembar "kalimat sebab utuh" (D-228): kalimatnya + pintu ke tinjauan perjalanan (dialog yang sudah ada).
    const isiSebab = (
      <>
        <p className="akh-lembar-teks" data-baris="sebab">{tx(k.sebab)}</p>
        <button type="button" className="akh-lembar-tautan" data-lihat-perjalanan="" aria-haspopup="dialog" onClick={() => { setLembar(null); setDialog('perjalanan'); }}>
          {t('ceritaAkhir.lihatPerjalanan')}
        </button>
      </>
    );
    return (
      <section ref={kartuRef} className="akh-kartu akh-satu" data-satu-layar="" aria-labelledby="akh-judul" data-nada={k.nada} data-akhir={k.akhir} data-aturan={k.aturan || undefined}>
        <div className="akh-kepala" data-pas-pantau="">
          {avatarNasabah ? <PotretPikselHp tokoh={avatarNasabah} ekspresi={k.ekspresi} ukuran={56} label={namaNasabah} className="akh-potret" />
            : <PotretNasabah ekspresi={k.ekspresi} ukuran={56} label={namaNasabah} className="akh-potret" />}
          <div className="akh-kepala-teks">
            <p className="akh-perasaan">
              {k.sesudahnya ? t('ceritaAkhir.perasaanSesudah', { suasana }) : t('ceritaAkhir.perasaanAkhir', { nama: namaNasabah, suasana })}
            </p>
            <p className="akh-nama-akhir">
              <TandaNada nada={k.nada} />
              <span>{namaAkhir}</span>
            </p>
          </div>
          {/* T-072: kartu mini (84 x 56, tinggi kepala T-024 tetap) membuka kartu petugas utuh di lembar bawah */}
          <KartuPetugas nama={namaPemain} varian="mini" onBuka={(el) => { pemicuRef.current = el; setLembar({ jenis: 'kartu' }); }} />
        </div>

        <div className="akh-hasil">
          <h2 id="akh-judul" className="akh-judul" tabIndex={-1} data-cer-fokus="" data-ukur="akhir-judul" data-pas-pantau="">{tx(k.judul)}</h2>
          {/* D-228: kalimat sebab selalu terpotong 2 baris, jadi kalimat itu sendiri tombol yang membuka lembar berisi kalimat utuhnya. */}
          <button type="button" className="akh-sebab-tombol" data-ukur="akhir-sebab" aria-haspopup="dialog" onClick={(e) => bukaTeks('sebab', e.currentTarget)}>
            <span className="akh-sebab">{tx(k.sebab)}</span>
            <span className="akh-lagi" aria-hidden="true">›</span>
          </button>
        </div>

        <RingkasanSatuLayar ep={ep} state={state} tx={tx} namaNasabah={namaNasabah} aktif={lembar?.jenis === 'titik' ? lembar.indeks : null}
          onBuka={(indeks) => setLembar({ jenis: 'titik', indeks })} />

        {k.pelajaran ? (
          <button type="button" className="akh-pelajaran-tombol" data-ukur="akhir-pelajaran" data-tanpa-wajah={wajahMentorKecil ? undefined : ''} aria-haspopup="dialog" onClick={(e) => bukaTeks('pelajaran', e.currentTarget)}>
            {wajahMentorKecil ? <span className="akh-wajah">{wajahMentorKecil}</span> : null}
            <span className="akh-gelembung">
              <small>{t('ceritaAkhir.pelajaranLabel')}</small>
              <span className="akh-gelembung-teks">{tx(k.pelajaran)}</span>
              <span className="akh-lagi" aria-hidden="true">›</span>
            </span>
          </button>
        ) : null}

        {aksi}
        {/* D-233: keterangan tombol ulang tetap terbaca pembaca layar (aria-describedby), tidak memakan baris di satu layar. */}
        {baik ? null : <p id={idKet} className="sr-only">{ulang ? t('ceritaAkhir.ulangKet') : t('cerita.ulangIsi')}</p>}
        {dialogBersama}

        {dibuka && lembar?.jenis === 'titik' ? (
          <LembarAkhir
            jenis="titik"
            nama={tx(dibuka.judul)}
            kecil={t('ceritaAkhir.lembar.nomor', { n: dibuka.nomor, total: titik.length })}
            judul={tx(dibuka.judul)}
            tanda={<GambarToken nomor={dibuka.nomor} nilai={infoTitik(state, dibuka).nilai} />}
            atasBadan={<PetaTitik ep={ep} state={state} kini={lembar.indeks} />}
            kunciIsi={dibuka.id}
            kembaliKe={() => kartuRef.current?.querySelector<HTMLElement>(`[data-token="${dibuka.id}"]`) ?? null}
            onTutup={tutupLembar}
            onPanah={(arah) => pindah(lembar.indeks + arah)}
            kaki={<>
              <button type="button" data-lembar-nav="sebelum" aria-disabled={lembar.indeks <= 0 || undefined} onClick={() => pindah(lembar.indeks - 1)}>
                <span aria-hidden="true">←</span> {t('ceritaAkhir.lembar.sebelum')}
              </button>
              <button type="button" data-lembar-nav="berikut" aria-disabled={lembar.indeks >= titik.length - 1 || undefined} onClick={() => pindah(lembar.indeks + 1)}>
                {t('ceritaAkhir.lembar.berikut')} <span aria-hidden="true">→</span>
              </button>
            </>}
          >
            <IsiLembarTitik state={state} titik={dibuka} tx={tx} namaMentor={namaMentor} wajah={wajahMentorKecil} />
          </LembarAkhir>
        ) : null}
        {lembar?.jenis === 'kartu' ? (
          <LembarAkhir jenis="kartu" nama={t('ceritaAkhir.petugasKlaim')} kecil={namaAkhir} judul={t('ceritaAkhir.petugasKlaim')} kembaliKe={() => pemicuRef.current} onTutup={tutupLembar}>
            <KartuPetugas nama={namaPemain} cap={{ teks: tx(info.judul), nada: k.nada }} />
          </LembarAkhir>
        ) : null}
        {lembar?.jenis === 'sebab' ? (
          <LembarAkhir jenis="sebab" nama={tx(k.judul)} kecil={namaAkhir} judul={tx(k.judul)} kembaliKe={() => pemicuRef.current} onTutup={tutupLembar}>
            {isiSebab}
          </LembarAkhir>
        ) : null}
        {lembar?.jenis === 'pelajaran' && k.pelajaran ? (
          <LembarAkhir
            jenis="pelajaran"
            nama={t('ceritaAkhir.pelajaranLabel')}
            judul={t('ceritaAkhir.pelajaranLabel')}
            tanda={wajahMentorKecil ? <span className="akh-wajah">{wajahMentorKecil}</span> : undefined}
            kembaliKe={() => pemicuRef.current}
            onTutup={tutupLembar}
          >
            <p className="akh-lembar-teks" data-baris="pelajaran">{tx(k.pelajaran)}</p>
            {lembar.denganSebab ? <>
              <h3 className="akh-lembar-sub">{t('ceritaAkhir.kenapa')}</h3>
              {isiSebab}
            </> : null}
          </LembarAkhir>
        ) : null}
      </section>
    );
  }

  return (
    <>
    <section className="akh-kartu" aria-labelledby="akh-judul" data-nada={k.nada} data-akhir={k.akhir} data-aturan={k.aturan || undefined}>
      <div className="akh-kepala">
        {/* Potret piksel: ukuran tampil diukur dari kotaknya (akhir.css menimpa 64 -> 56/80/88 px), jadi jendela & skala
            bulatnya selalu untuk ukuran yang benar-benar tampil. */}
        {avatarNasabah ? <PotretPikselHp tokoh={avatarNasabah} ekspresi={k.ekspresi} ukuran={64} label={namaNasabah} className="akh-potret" />
          : <PotretNasabah ekspresi={k.ekspresi} ukuran={64} label={namaNasabah} className="akh-potret" />}
        <div className="akh-kepala-teks">
          <p className="akh-perasaan">
            {k.sesudahnya ? t('ceritaAkhir.perasaanSesudah', { suasana }) : t('ceritaAkhir.perasaanAkhir', { nama: namaNasabah, suasana })}
          </p>
          {/* "Akhir campuran: Lega Sesaat" mengalir sebagai satu teks (pindah baris tanpa pemisah menggantung). */}
          <p className="akh-nama-akhir">
            <TandaNada nada={k.nada} />
            <span>{t(`cerita.nada.${k.nada}`)}{selaPembicara()}<b>{tx(info.judul)}</b></span>
          </p>
        </div>
      </div>
      {/* T-072: kartu petugas utuh di bawah kepala (bentuk bergulir) */}
      <KartuPetugas nama={namaPemain} cap={{ teks: tx(info.judul), nada: k.nada }} />

      <h2 id="akh-judul" className="akh-judul" tabIndex={-1} data-cer-fokus="" data-ukur="akhir-judul">{tx(k.judul)}</h2>
      <p className="akh-sebab">{tx(k.sebab)}</p>

      {k.pelajaran ? (
        <div className="akh-pelajaran" data-ukur="akhir-pelajaran">
          <p className="akh-pelajaran-label">
            {/* 32 = slot ikon kepala mini (seni/piksel/ikon.ts: sanggul & kerah utuh di lingkaran isi 28 px). */}
            {adaMentor ? (avatarMentor ? <PotretPikselHp tokoh={avatarMentor} ekspresi={wajahMentor} ukuran={32} label={namaMentor} /> : <PotretMissRaksa ekspresi={wajahMentor} ukuran={32} />) : null}
            <b>{t('ceritaAkhir.pelajaranLabel')}</b>
          </p>
          <p className="akh-pelajaran-teks">{tx(k.pelajaran)}</p>
        </div>
      ) : null}

      {aksi}
      {baik ? null : <p id={idKet} className="akh-ket">{ulang ? t('ceritaAkhir.ulangKet') : t('cerita.ulangIsi')}</p>}
      {/* T-099: bentuk bergulir tanpa bilah tersemat: tautan kasus di bawah aksi dan keterangannya */}
      {slotAksi ? null : tautKasus}

      <div className="akh-kaki">
        {/* Episode dengan ringkasan keputusan bernomor: ringkasan di bawah kartu menggantikan tinjauan perjalanan. */}
        {adaRingkasan ? null : (
          <button type="button" className="text-button akh-lihat" aria-haspopup="dialog" onClick={() => setDialog('perjalanan')}>
            {t('ceritaAkhir.lihatPerjalanan')}
          </button>
        )}
        <p className="practice-note akh-simulasi">{t('misi.catatanSimulasiPeriksa')}</p>
      </div>

      {dialogBersama}
    </section>
    {adaRingkasan ? <RingkasanKeputusan ep={ep} state={state} tx={tx} namaNasabah={namaNasabah} namaMentor={namaMentor} /> : null}
    </>
  );
}

/**
 * Wajah Miss Raksa untuk potret pelajaran: ekspresi baris Miss Raksa TERAKHIR yang dibaca di perjalanan ini (epilog),
 * supaya potret piksel cocok dengan kalimat penutupnya; null bila tidak ada.
 */
function ekspresiMentorTerakhir(ep: Episode, state: StateCerita): Ekspresi | null {
  const mentor = new Set(Object.entries(ep.pemeran).filter(([, p]) => p.potret === 'missRaksa').map(([id]) => id));
  for (let i = state.riwayat.length - 1; i >= 0; i--) {
    const e = state.riwayat[i]!;
    if (e.jenis === 'baris' && mentor.has(e.siapa)) return e.ekspresi ?? null;
  }
  return null;
}

/** Ikon "ulang" (panah melingkar) di tombol coba lagi; hiasan, kata selalu ada. */
function IkonUlang() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M7 9.5a6 6 0 1 1-.8 6M7 4.5v5h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * T-064 Episode 1 Dev (`Episode.tampilan.akhirKenalan`): akhir SINGKAT untuk tamu acara (~30 detik). Suasana akhir Pak Hendra +
 * kalimat terakhirnya, "Ini kasus nyata yang pernah Raksa tangani.", nama OPSIONAL (maks. 24 huruf, kosong = "Tamu") yang langsung
 * mengisi kartu petugas (T-052) untuk ditangkap layar, lalu dua tombol: versi lengkap (/cerita/auto-2) dan raksaonline.com (tab
 * baru). Tanpa ringkasan keputusan, tanpa "coba lagi dari bagian". Aksi di bilah tersemat cangkang HP bila ada (slotAksi).
 */
function AkhirKenalan({ ep, state, tx, slotAksi }: { ep: Episode; state: StateCerita; tx: (k: KunciTeks) => string; slotAksi: HTMLElement | null }) {
  const [nama, setNama] = useState('');
  const idJudul = useId();
  const idNama = useId();
  const akhir = state.akhir;
  const info = akhir ? ep.akhir[akhir] : undefined;
  if (!akhir || !info) return null;
  const suasana = [...ep.suasana].sort((a, b) => b.min - a.min).find((s) => state.kepercayaan >= s.min) ?? ep.suasana[ep.suasana.length - 1];
  const nasabah = ep.pemeran[ep.nasabah];
  const tampilNama = nama.trim().slice(0, 24) || tx('kenalan.namaBawaan');
  const aksi = (
    <div className="akh-aksi akh-kenalan-aksi" data-tersemat={slotAksi ? '' : undefined}>
      <Link className="primary-action akh-utama" to="/cerita/auto-2" data-ukur="aksi-utama"><span>{tx('kenalan.lengkap')}</span><Arrow /></Link>
      <a className="akh-kedua" href="https://www.raksaonline.com/" target="_blank" rel="noopener noreferrer" data-ukur="aksi-kedua">
        {tx('kenalan.raksa')}<span className="sr-only"> {tx('kenalan.tabBaru')}</span>
      </a>
    </div>
  );
  return (
    <section className="akh-kenalan" data-akhir={akhir} aria-labelledby={idJudul}>
      <div className="akh-kenalan-kepala">
        <PotretPikselHp tokoh="hendra" ekspresi={suasana?.ekspresi ?? 'netral'} ukuran={56} label="" />
        <div>
          {suasana ? <p className="akh-kenalan-suasana">{tx('kenalan.suasana').replace('{suasana}', tx(suasana.label))}</p> : null}
          <h2 id={idJudul} tabIndex={-1}>{tx(info.judul)}</h2>
        </div>
      </div>
      <p className="akh-kenalan-kutip"><b>{nasabah ? tx(nasabah.nama) : ''}</b>{selaPembicara()}{tx(`akhir.${akhir}.1`)}</p>
      <p className="akh-kenalan-nyata">
        {TOKOH.missRaksa.aktif ? <span aria-hidden="true"><PotretMissRaksa ekspresi="tersenyum" ukuran={32} /></span> : null}
        <b>{tx('kenalan.nyata')}</b>
      </p>
      <div className="akh-kenalan-kartu">
        {/* T-072: nama diketik langsung di kartu (kolom isian = baris nama kartu); kosong = Tamu */}
        <KartuPetugas nama={tampilNama} cap={{ teks: tx(info.judul), nada: info.nada }}
          ubahNama={{ id: idNama, nilai: nama, label: tx('kenalan.namaLabel'), placeholder: tx('kenalan.namaBawaan'), onUbah: setNama }} />
        <small>{tx('kenalan.kartu')}</small>
      </div>
      {slotAksi ? createPortal(aksi, slotAksi) : aksi}
    </section>
  );
}
