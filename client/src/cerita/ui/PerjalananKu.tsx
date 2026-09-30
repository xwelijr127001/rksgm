/**
 * "Lihat perjalananku" (v2, docs/rancangan-mode-cerita.md 11.1): tinjauan lengkap yang dibuka atas permintaan
 * pemain dari kartu akhir. Tiga kelompok (Yang membantu / Yang perlu diperhatikan / Kenapa berakhir begini);
 * di dua kelompok pertama sisi yang dipisah: perasaan nasabah (komunikasi, gaya NETRAL: tanpa hijau/merah dan
 * tanpa kata "Suasana membaik"), langkah klaim (proses: Tepat / Diperbaiki / Keliru / Belum dilakukan), dan
 * pemahaman nasabah. Lalu akhir yang ditemukan (yang belum: tersamar), paling banyak SATU saran latihan, dan
 * tombol ke pemilih bagian (akhir yang belum baik juga bisa mencoba bab lain).
 * Isi dari tinjauanPerjalanan (murni, tinjauan.ts); dialog ini tidak mengubah state cerita.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Bahasa } from '@shared/bahasa';
import { MISSIONS } from '@shared/missions';
import { Arrow } from '../../components/PlayerShell';
import { misiDalamBahasa, t } from '../../i18n';
import { Modal } from '../../ui/kit';
import type { Episode, IdAkhir, InfoAkhir, KunciTeks, StateCerita } from '../tipe';
import { TandaProses } from './bagian';
import { kartuAkhir, tinjauanPerjalanan } from './tinjauan';

export function PerjalananKu({ ep, state, bahasa, tx, ditemukan, onCobaBagian, onTutup }: {
  ep: Episode;
  state: StateCerita;
  bahasa: Bahasa;
  tx: (k: KunciTeks) => string;
  ditemukan: IdAkhir[];
  /** Tutup tinjauan lalu buka pemilih bagian. */
  onCobaBagian: () => void;
  onTutup: () => void;
}) {
  const tj = tinjauanPerjalanan(ep, state);
  const k = kartuAkhir(ep, state);
  const nasabah = ep.pemeran[ep.nasabah];
  const nama = nasabah ? tx(nasabah.nama) : '';
  const mentor = Object.values(ep.pemeran).find((p) => p.potret === 'missRaksa');
  const namaMentor = mentor ? tx(mentor.nama) : '';
  const semuaAkhir = Object.keys(ep.akhir);
  const temuan = new Set<string>([...ditemukan, ...(state.akhir ? [state.akhir] : [])]);
  const latihanAsal = k?.latihan != null ? MISSIONS.find((m) => m.number === k.latihan) : undefined;
  const latihan = latihanAsal ? misiDalamBahasa(latihanAsal, bahasa) : null;

  const m = tj.membantu;
  const p = tj.perhatian;
  const adaMembantu = m.komunikasi.length + m.proses.length + m.paham.length > 0;
  const adaPerhatian = p.komunikasi.length + p.proses.length + p.paham.length > 0;

  return (
    <Modal
      judul={t('ceritaAkhir.perjalananJudul')}
      onTutup={onTutup}
      lebar={600}
      aksi={<>
        <button type="button" className="btn btn-netral" onClick={onTutup}>{t('ceritaAkhir.tutup')}</button>
        <button type="button" className="btn" aria-haspopup="dialog" onClick={onCobaBagian}>{t('ceritaAkhir.cobaBagianLain')}</button>
      </>}
    >
      <div className="akh-tinjauan">
        <section className="akh-kelompok" data-kelompok="membantu" aria-labelledby="akh-tj-membantu">
          <h4 id="akh-tj-membantu">{t('ceritaAkhir.membantu')}</h4>
          {adaMembantu ? null : <p className="akh-kosong">{t('ceritaAkhir.kosongMembantu')}</p>}
          {m.komunikasi.length ? (
            <Sub id="akh-tj-m-rasa" judul={t('ceritaAkhir.subPerasaan', { nama })}>
              <ul className="akh-daftar akh-daftar-rasa" aria-labelledby="akh-tj-m-rasa">
                {m.komunikasi.map((x) => (
                  <li key={x.teks}>
                    <span className="akh-daftar-teks">{tx(x.teks)}</span>
                    {x.ralat ? <TagDiperbaiki /> : null}
                  </li>
                ))}
              </ul>
            </Sub>
          ) : null}
          {m.proses.length ? (
            <Sub id="akh-tj-m-langkah" judul={t('ceritaAkhir.subLangkah')}>
              <ul className="akh-daftar akh-daftar-langkah" aria-labelledby="akh-tj-m-langkah">
                {m.proses.map((x) => (
                  <li key={x.id} data-nilai={x.nilai}>
                    <span className="akh-daftar-teks">{tx(x.label)}</span>
                    <TandaProses nilai={x.nilai} />
                  </li>
                ))}
              </ul>
            </Sub>
          ) : null}
          {m.paham.length ? (
            <Sub id="akh-tj-m-paham" judul={t('ceritaAkhir.subPaham', { nama })}>
              <ul className="akh-daftar akh-daftar-rasa" aria-labelledby="akh-tj-m-paham">
                {m.paham.map((x) => <li key={x.id}><span className="akh-daftar-teks">{tx(x.label)}</span></li>)}
              </ul>
            </Sub>
          ) : null}
        </section>

        <section className="akh-kelompok" data-kelompok="perhatian" aria-labelledby="akh-tj-perhatian">
          <h4 id="akh-tj-perhatian">{t('ceritaAkhir.perhatian')}</h4>
          {adaPerhatian ? null : <p className="akh-kosong">{tj.perhatianKosong === 'diluruskan' ? t('ceritaAkhir.kosongPerhatianDiluruskan', { nama }) : t('ceritaAkhir.kosongPerhatian')}</p>}
          {p.komunikasi.length ? (
            <Sub id="akh-tj-p-rasa" judul={t('ceritaAkhir.subPerasaan', { nama })}>
              <ul className="akh-daftar akh-daftar-rasa" aria-labelledby="akh-tj-p-rasa">
                {p.komunikasi.map((x) => <li key={x.teks}><span className="akh-daftar-teks">{tx(x.teks)}</span></li>)}
              </ul>
            </Sub>
          ) : null}
          {p.proses.length ? (
            <Sub id="akh-tj-p-langkah" judul={t('ceritaAkhir.subLangkah')}>
              <ul className="akh-daftar akh-daftar-langkah" aria-labelledby="akh-tj-p-langkah">
                {p.proses.map((x) => (
                  <li key={x.id} data-nilai={x.nilai ?? 'kosong'}>
                    <span className="akh-daftar-teks">{tx(x.label)}</span>
                    <TandaProses nilai={x.nilai} kata={x.nilai === null ? t('ceritaAkhir.belumDilakukan') : undefined} />
                  </li>
                ))}
              </ul>
            </Sub>
          ) : null}
          {p.paham.length ? (
            <Sub id="akh-tj-p-paham" judul={t('ceritaAkhir.subBelumPaham', { nama })}>
              <ul className="akh-daftar akh-daftar-rasa" aria-labelledby="akh-tj-p-paham">
                {p.paham.map((x) => <li key={x.id}><span className="akh-daftar-teks">{tx(x.label)}</span></li>)}
              </ul>
            </Sub>
          ) : null}
        </section>

        <section className="akh-kelompok" data-kelompok="kenapa" aria-labelledby="akh-tj-kenapa">
          <h4 id="akh-tj-kenapa">{t('ceritaAkhir.kenapa')}</h4>
          {tj.kenapa.sebab ? <p className="akh-kenapa">{tx(tj.kenapa.sebab)}</p> : null}
          {tj.kenapa.pelajaran.length ? (
            <Sub id="akh-tj-pesan" judul={t('ceritaAkhir.pesanMentor', { nama: namaMentor })}>
              <ul className="akh-daftar akh-daftar-rasa" aria-labelledby="akh-tj-pesan">
                {tj.kenapa.pelajaran.map((x) => <li key={x}><span className="akh-daftar-teks">{tx(x)}</span></li>)}
              </ul>
            </Sub>
          ) : null}
        </section>

        <section className="akh-kelompok" data-kelompok="temuan" aria-labelledby="akh-tj-temuan">
          <h4 id="akh-tj-temuan">{t('ceritaAkhir.temuan', { n: semuaAkhir.filter((a) => temuan.has(a)).length, total: semuaAkhir.length })}</h4>
          <ol className="akh-temuan">
            {semuaAkhir.map((a) => {
              const ai = ep.akhir[a]!;
              const sudah = temuan.has(a);
              const ini = a === state.akhir;
              return (
                <li key={a} data-ada={sudah ? 'ya' : 'tidak'} aria-current={ini ? 'true' : undefined}>
                  {sudah ? <TandaNada nada={ai.nada} /> : <span className="akh-nada akh-nada-samar" aria-hidden="true">?</span>}
                  <span>
                    {sudah ? <b>{tx(ai.judul)}</b> : <span className="akh-samar">{t('cerita.akhirTersamar')}</span>}
                    {sudah ? <span className="sr-only"> ({t(`cerita.nada.${ai.nada}`)})</span> : null}
                    {ini ? <small> · {t('ceritaAkhir.akhirIni')}</small> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {latihan ? (
          <section className="akh-kelompok" data-kelompok="latihan" aria-labelledby="akh-tj-latihan">
            <h4 id="akh-tj-latihan">{t('ceritaAkhir.latihanJudul')}</h4>
            <Link className="akh-tautan" to={'/solo/main?misi=' + latihan.number}>
              <span>{t('cerita.misiN', { n: latihan.number, judul: latihan.title })}</span>
              <Arrow />
            </Link>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

/** Sub-daftar berlabel (h5) di dalam satu kelompok tinjauan. */
function Sub({ id, judul, children }: { id: string; judul: string; children: ReactNode }) {
  return (
    <div className="akh-sub">
      <h5 id={id}>{judul}</h5>
      {children}
    </div>
  );
}

/** Tanda "Diperbaiki" untuk alasan ralat (netral: ikon putar + kata, bukan warna benar/salah). */
function TagDiperbaiki() {
  return (
    <span className="akh-tag akh-tag-ralat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M7 9.5a6 6 0 1 1-.8 6M7 4.5v5h5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {t('ceritaAkhir.diperbaiki')}
    </span>
  );
}

/** Ikon nada akhir (baik ✓ / campuran ~ / kurang baik !): bentuk berbeda, selalu bersama kata atau judul. */
export function TandaNada({ nada }: { nada: InfoAkhir['nada'] }) {
  return (
    <span className={'akh-nada akh-nada-' + nada} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
        {nada === 'baik' ? <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          : nada === 'campuran' ? <path d="M4.5 13.5c2.2-3.2 4.4-3.2 6.6 0s4.4 3.2 6.6 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          : <path d="M12 6v7m0 4.5v.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />}
      </svg>
    </span>
  );
}
