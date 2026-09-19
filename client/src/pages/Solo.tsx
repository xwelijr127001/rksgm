import { useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MISSIONS } from '@shared/missions';
import { Avatar } from '../art/Avatar';
import { Icon } from '../art/Icon';
import { forceMusic, setTrack } from '../audio/audio';
import { PlayerShell, Arrow } from '../components/PlayerShell';
import { prefetchAdegan } from '../game/prefetch';
import { misiDalamBahasa, t, useBahasa } from '../i18n';
import { totalPoin, useProfil } from '../state/profil';
import { BarisBintang, SatuBintang, TOTAL_BINTANG, TOTAL_MISI, TandaTingkat, angka, bintangMisi, ikonMisi, jumlahBintang, jumlahDicoba, misiSaran, tingkatMisi } from './soloBagian';
import './solo.css';

/**
 * PETA MISI mode solo: 10 misi paket latihan sebagai jalur berkelok (bukan tabel).
 * Semua titik boleh dibuka kapan saja dan diulang; satu tombol utama menunjuk misi berikutnya
 * yang disarankan, atau hasil akhir bila semua misi sudah dicoba.
 *
 * Peta kota lama (art/CityMap.tsx) tidak dipakai ulang: itu satu gambar SVG `role="img"` untuk
 * layar proyektor dengan simpul beradius 16px, jadi titiknya bukan tombol dan terlalu kecil untuk jari.
 */
export default function Solo() {
  const { bahasa } = useBahasa();
  const { profil, progres } = useProfil();
  // Musik & unduhan engine adegan mengikuti latihan lama: adegan misi pertama langsung tampil.
  useEffect(() => { forceMusic(true); setTrack('game'); prefetchAdegan(); return () => { setTrack(null); forceMusic(false); }; }, []);
  const daftar = useMemo(() => MISSIONS.map((m) => misiDalamBahasa(m, bahasa)), [bahasa]);

  if (!profil) return <Navigate to="/kenalan?lanjut=/solo" replace />;

  const saran = misiSaran(progres);
  const saranTampil = saran ? daftar.find((m) => m.id === saran.id) ?? saran : null;
  const dicoba = jumlahDicoba(progres);
  const bintang = jumlahBintang(progres);

  return <PlayerShell back="/" label={t('solo.labelPeta')} className="solo-layar">
    <main className="solo-peta">
      <div className="solo-sisi">
        <section className="solo-kepala" aria-label={t('solo.eyebrowSolo')}>
          <div className="solo-pemain">
            <span className="solo-avatar"><Avatar look={profil.look} size={60} mood="senang" /></span>
            <div>
              <span className="eyebrow">{t('solo.eyebrowSolo')}</span>
              <h1>{t('solo.hai', { nama: profil.nickname })}</h1>
              <p>{t('solo.ketPeta')}</p>
            </div>
          </div>
          <dl className="solo-angka">
            <div><dt>{t('solo.totalPoin')}</dt><dd>{angka(totalPoin(progres))}</dd></div>
            <div><dt>{t('solo.bintang')}</dt><dd><SatuBintang isi={bintang > 0} ukuran={18} />{bintang}<small>/{TOTAL_BINTANG}</small></dd></div>
            <div><dt>{t('solo.rekorPribadi')}</dt><dd>{angka(progres.rekor)}</dd></div>
          </dl>
        </section>

        <div className="solo-aksi">
          {saranTampil
            ? <Link className="primary-action" to={'/solo/main?misi=' + saranTampil.number}>{dicoba === 0 ? t('solo.mulaiMisi', { n: saranTampil.number }) : t('solo.lanjutMisi', { n: saranTampil.number })} <Arrow /></Link>
            : <Link className="primary-action" to="/solo/hasil">{t('solo.lihatHasilku')} <Arrow /></Link>}
          <p className="solo-aksi-ket">{saranTampil ? t('solo.berikutnyaJudul', { judul: saranTampil.title }) : t('solo.semuaDicoba')}</p>
        </div>

        <div className="solo-kaki">
          <Link className="quiet-link" to="/join">{t('solo.punyaKode')} <Arrow /></Link>
          <p>{t('solo.catatanPerangkat')}</p>
        </div>
      </div>

      <ol className="solo-jalur" aria-label={t('solo.jalurAria', { total: TOTAL_MISI })}>
        {daftar.map((m, i) => {
          const catatan = progres.misi[m.id];
          const b = bintangMisi(progres, m.id);
          const disarankan = m.id === saran?.id;
          const kelas = 'solo-titik' + (i % 2 ? ' solo-kanan' : '') + (catatan ? ' solo-dicoba' : '') + (disarankan ? ' solo-saran' : '');
          return <li key={m.id} className={kelas}>
            <Link className="solo-titik-tombol" to={'/solo/main?misi=' + m.number} aria-current={disarankan ? 'step' : undefined}>
              <span className="solo-no" aria-hidden="true">{m.number}{b === 3 ? <i className="solo-no-cek"><Icon name="cek" size={20} /></i> : null}</span>
              <span className="solo-kartu">
                <span className="solo-kartu-teks">
                  {disarankan ? <span className="solo-chip-saran">{t('solo.berikutnya')}</span> : null}
                  <b className="solo-judul"><span className="sr-only">{t('solo.misiKe', { n: m.number })} </span>{m.title}</b>
                  <span className="solo-meta"><span>{m.productLabel.split(' - ')[0]}</span><TandaTingkat tingkat={tingkatMisi(m)} /></span>
                  <span className="solo-capai">
                    <BarisBintang n={b} />
                    <small>{catatan ? t('pemain.nPoin', { n: angka(catatan.poin) }) : t('solo.belumDicoba')}</small>
                  </span>
                </span>
                <span className="solo-ikon" aria-hidden="true"><Icon name={ikonMisi(m)} size={26} /></span>
              </span>
            </Link>
          </li>;
        })}
      </ol>
    </main>
  </PlayerShell>;
}
