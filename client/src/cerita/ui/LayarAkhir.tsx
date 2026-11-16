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
 */
import './akhir.css';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import { TOKOH } from '@shared/brand';
import { Arrow } from '../../components/PlayerShell';
import { t } from '../../i18n';
import { Modal } from '../../ui/kit';
import { PotretNasabah } from '../seni';
import { PotretMissRaksa } from '../seni/tokoh/PotretMissRaksa';
import type { Ekspresi, Episode, IdAkhir, IdBab, KunciTeks, StateCerita } from '../tipe';
import { labelPerasaan, selaPembicara } from './bagian';
import { PotretPikselHp } from './latar/piksel/PotretPikselHp';
import { tokohPotret } from './latar/piksel/potret';
import { RingkasanKeputusan } from './RingkasanKeputusan';
import { PemilihBagian } from './PemilihBagian';
import { PerjalananKu, TandaNada } from './PerjalananKu';
import { kartuAkhir } from './tinjauan';

export function LayarAkhir({ ep, state, bahasa, tx, ditemukan, onUlangBab, onUlangEpisode, slotAksi = null }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  /** Tidak dipakai kartu v2 (epilog tidak diulang); tetap di antarmuka karena CeritaMain mengirimnya. */
  namaPemain: string;
  tx: (k: KunciTeks) => string;
  /** Akhir yang pernah dicapai di perangkat ini (simpan.ts). */
  ditemukan: IdAkhir[];
  onUlangBab: (bab: IdBab) => void;
  onUlangEpisode: () => void;
  /** (cangkang HP, T-018 Tahap 2 D-134) bilah aksi dipindah ke elemen ini (tersemat di bawah) dan label ulang dipendekkan. */
  slotAksi?: HTMLElement | null;
}) {
  const [dialog, setDialog] = useState<'pemilih' | 'perjalanan' | null>(null);
  const [tanyaUlang, setTanyaUlang] = useState(false);
  const idKet = useId();
  const k = kartuAkhir(ep, state);
  const info = k ? ep.akhir[k.akhir] : undefined;
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

      {(() => { const aksi = (
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
      ); return slotAksi ? createPortal(aksi, slotAksi) : aksi; })()}
      {baik ? null : <p id={idKet} className="akh-ket">{ulang ? t('ceritaAkhir.ulangKet') : t('cerita.ulangIsi')}</p>}

      <div className="akh-kaki">
        {/* Episode dengan ringkasan keputusan bernomor: ringkasan di bawah kartu menggantikan tinjauan perjalanan. */}
        {adaRingkasan ? null : (
          <button type="button" className="text-button akh-lihat" aria-haspopup="dialog" onClick={() => setDialog('perjalanan')}>
            {t('ceritaAkhir.lihatPerjalanan')}
          </button>
        )}
        <p className="practice-note akh-simulasi">{t('misi.catatanSimulasiPeriksa')}</p>
      </div>

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
