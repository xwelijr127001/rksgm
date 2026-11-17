/**
 * RINGKASAN KEPUTUSAN BERNOMOR (episode dengan `Episode.titik`, mis. 15 keputusan Episode 2), tampil di layar akhir
 * sesudah kartu akhir: grafik status nasabah dari awal sampai akhir (titik = setiap perubahan status, pita = suasana),
 * lalu tiap keputusan: pilihanmu + klasifikasi naskah (ikon + kata, bukan hanya warna), yang disarankan bila berbeda,
 * dan alasan mentor. Bukan skor kompetisi: status nasabah dan klasifikasi naskah, tanpa poin.
 * Pilihan dibaca dari tanda `kep:<titik>:<alternatif>`; titik yang tidak tercatat (simpanan rusak) tampil "-".
 *
 * Dua bentuk dari data yang sama (titik.ts):
 *  - RingkasanKeputusan: daftar yang bisa dibuka di bawah kartu (desktop & layar yang halamannya menggulir);
 *  - RingkasanSatuLayar (T-024, cangkang HP; angka = mock Designer D-226..D-235): grafik ringkas 72 px berbingkai (nama grafik
 *    di sudut, dua label pita di talang kanan, tanpa baris legenda) + baris legenda hitungan 18 px + strip token 5 x 3 (sasaran
 *    sentuh = sel kisi x 44 px, gambar token 32 x 32 dari seni/akhir/token-keputusan.png: badan berwarna + lencana tanda, jadi
 *    klasifikasi tidak hanya lewat warna). Ketuk token = lembar rincian (IsiLembarTitik + PetaTitik di dalam LembarAkhir milik
 *    LayarAkhir).
 */
import { useId, type ReactNode } from 'react';
import { t } from '../../i18n';
import type { Episode, KunciTeks, NilaiAlternatif, StateCerita, TitikKeputusan } from '../tipe';
import { selaPembicara } from './bagian';
import { deretStatus, hitungNilai, infoTitik } from './titik';

function IkonNilai({ nilai }: { nilai: NilaiAlternatif | null }) {
  return (
    <span className={'akh-tk-ikon akh-tk-' + (nilai ?? 'kosong')} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" focusable="false">
        {nilai === 'tepat' ? <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          : nilai === 'kurang' ? <path d="M12 6v7m0 4.5v.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          : nilai === 'keliru' ? <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          : <path d="M7 12h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

/** Kata klasifikasi (kamus antarmuka); titik yang tidak tercatat punya katanya sendiri. */
const kataNilai = (nilai: NilaiAlternatif | null): string => t(`ceritaAkhir.nilai.${nilai ?? 'kosong'}`);

/**
 * Grafik garis status 0-100 dengan pita suasana; teks alternatif merangkum awal, akhir, terendah & tertinggi.
 * `ringkas` (T-024): kotak berbingkai setinggi bloknya (72 px, menyusut sampai 56), judul panjang hanya untuk pembaca layar,
 * tanpa baris legenda. Pita selebar kotak; garis + titik persegi hanya di kiri talang, jadi titik terakhir tidak pernah menimpa
 * label pita teratas / terbawah di talang kanan (selebar label + 12 px); nama grafik pendek di sudut kiri atas.
 */
function GrafikStatus({ ep, deret, tx, namaNasabah, ringkas = false }: { ep: Episode; deret: number[]; tx: (k: KunciTeks) => string; namaNasabah: string; ringkas?: boolean }) {
  // Ringkas: 7 satuan di kiri-kanan = ruang titik persegi 6 px (titik akhir 10 px boleh menonjol ke talang).
  const W = 320, H = 120, kiri = ringkas ? 7 : 4, kanan = ringkas ? 7 : 4, atas = 6, bawah = 6;
  const batas = ep.kepercayaanBatas ?? { min: 0, maks: 100 };
  const y = (v: number) => atas + (1 - (v - batas.min) / (batas.maks - batas.min || 1)) * (H - atas - bawah);
  const x = (i: number) => kiri + (deret.length > 1 ? (i / (deret.length - 1)) * (W - kiri - kanan) : 0);
  const pita = [...ep.suasana].sort((a, b) => a.min - b.min);
  const id = useId();
  const akhir = deret[deret.length - 1]!;
  const ringkasan = t('ceritaAkhir.statusAlt', {
    nama: namaNasabah, awal: deret[0]!, akhir, min: Math.min(...deret), maks: Math.max(...deret),
  });
  const gambarPita = pita.map((p, i) => {
    const atasPita = i + 1 < pita.length ? pita[i + 1]!.min : batas.maks;
    return <rect key={p.label} x={0} y={y(atasPita)} width={W} height={y(p.min) - y(atasPita)} className={'akh-grafik-pita akh-grafik-pita-' + (i % 2)} />;
  });
  const gambarGaris = (
    <>
      <polyline points={deret.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} className="akh-grafik-garis" />
      {/* Titik = garis nol-panjang berujung bulat dengan goresan tak-berskala: tetap bulat walau viewBox diregangkan. */}
      {deret.map((v, i) => (
        <g key={i} className={i === deret.length - 1 ? 'akh-grafik-titik akh-grafik-titik-akhir' : 'akh-grafik-titik'}>
          <path d={`M${x(i).toFixed(1)} ${y(v).toFixed(1)}h0`} className="akh-grafik-titik-luar" />
          <path d={`M${x(i).toFixed(1)} ${y(v).toFixed(1)}h0`} className="akh-grafik-titik-dalam" />
        </g>
      ))}
    </>
  );
  if (ringkas) {
    return (
      <figure className="akh-grafik akh-grafik-ringkas" data-ukur="akhir-grafik">
        <figcaption id={id} className="sr-only">{t('ceritaAkhir.statusJudul', { nama: namaNasabah })}</figcaption>
        <div className="akh-grafik-kotak">
          <svg className="akh-grafik-latar" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">{gambarPita}</svg>
          <svg className="akh-grafik-jalur" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} aria-describedby={id + 'd'} preserveAspectRatio="none">{gambarGaris}</svg>
          <span className="akh-grafik-talang" aria-hidden="true">
            <span>{pita.length ? tx(pita[pita.length - 1]!.label) : ''}</span>
            <span>{pita.length > 1 ? tx(pita[0]!.label) : ''}</span>
          </span>
          <span className="akh-grafik-nama" aria-hidden="true">{t('ceritaAkhir.statusSingkat', { nama: namaNasabah })}</span>
        </div>
        <p id={id + 'd'} className="sr-only">{ringkasan}</p>
      </figure>
    );
  }
  return (
    <figure className="akh-grafik">
      <figcaption id={id}>{t('ceritaAkhir.statusJudul', { nama: namaNasabah })}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} aria-describedby={id + 'd'} preserveAspectRatio="none">
        {gambarPita}
        {gambarGaris}
      </svg>
      <ul className="akh-grafik-legenda" aria-hidden="true">
        <li className="akh-grafik-legenda-judul">{t('ceritaAkhir.pitaJudul')}</li>
        {[...pita].reverse().map((p) => <li key={p.label}><b>{p.min}+</b> {tx(p.label)}</li>)}
      </ul>
      <p id={id + 'd'} className="sr-only">{ringkasan}</p>
    </figure>
  );
}

export function RingkasanKeputusan({ ep, state, tx, namaNasabah, namaMentor }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  namaNasabah: string;
  namaMentor: string;
}) {
  const titik = ep.titik ?? [];
  if (!titik.length) return null;
  const deret = deretStatus(ep, state);
  return (
    <section className="akh-ringkasan" aria-labelledby="akh-ringkasan-judul">
      <h3 id="akh-ringkasan-judul">{t('ceritaAkhir.ringkasanJudul', { n: titik.length })}</h3>
      <GrafikStatus ep={ep} deret={deret} tx={tx} namaNasabah={namaNasabah} />
      <ol className="akh-titik">
        {titik.map((k) => {
          const it = infoTitik(state, k);
          return (
            <li key={k.id} className="akh-tk" data-titik={k.id} data-nilai={it.nilai ?? 'kosong'}>
              <details>
                <summary>
                  <span className="akh-tk-no">{k.nomor}</span>
                  <span className="akh-tk-judul">{tx(k.judul)}</span>
                  <span className={'akh-tk-chip akh-tk-' + (it.nilai ?? 'kosong')}>
                    <IkonNilai nilai={it.nilai} />
                    {it.nilai ? t(`ceritaAkhir.nilai.${it.nilai}`) : '–'}
                  </span>
                  {/* Tanda bisa dibuka (juga di layar sentuh): panah berputar saat terbuka. */}
                  <svg className="akh-tk-buka" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="akh-tk-isi">
                  <p><b>{t('ceritaAkhir.pilihanmu')}</b>{selaPembicara()}{it.label ? tx(it.label) : '–'}</p>
                  {it.saran ? <p><b>{t('ceritaAkhir.disarankan')}</b>{selaPembicara()}{tx(it.saran)}</p> : null}
                  <p className="akh-tk-alasan"><b>{t('ceritaAkhir.alasanMentor', { nama: namaMentor })}</b>{selaPembicara()}{tx(k.alasan)}</p>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      {ep.statusNaskah ? <p className="akh-ringkasan-catatan">{tx(ep.statusNaskah)}</p> : null}
    </section>
  );
}

// ------------------------------------------------------------------ T-024: bentuk satu layar (cangkang HP)

/**
 * Gambar token keputusan: sel 32 x 32 atlas (badan 28 x 28 hijau = tepat, kuning = kurang tepat, merah bata = keliru, abu = tidak
 * tercatat; lencana centang / seru / silang / strip di sudut kanan atas) dengan nomor keputusan di atas badannya. Hiasan: nama
 * untuk pembaca layar ada di tombol / judul pemakainya.
 */
export function GambarToken({ nomor, nilai }: { nomor: number; nilai: NilaiAlternatif | null }) {
  return <i className="akh-token-gambar" data-nilai={nilai ?? 'kosong'} aria-hidden="true"><b>{nomor}</b></i>;
}

/** Lencana tanda 12 x 12 saja (legenda, cap hasil di lembar): selalu di samping katanya. */
function TandaNilai({ nilai }: { nilai: NilaiAlternatif | null }) {
  return <i className="akh-tanda" data-nilai={nilai ?? 'kosong'} aria-hidden="true" />;
}

const URUTAN_NILAI: readonly NilaiAlternatif[] = ['tepat', 'kurang', 'keliru'];

/**
 * Grafik ringkas + legenda hitungan + strip token (lima per baris) untuk layar akhir satu layar. `aktif` = indeks titik yang
 * lembarnya sedang terbuka (token itu berbingkai emas); `onBuka(indeks)` dipanggil saat token diketuk.
 */
export function RingkasanSatuLayar({ ep, state, tx, namaNasabah, aktif, onBuka }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  namaNasabah: string;
  aktif: number | null;
  onBuka: (indeks: number) => void;
}) {
  const idJudul = useId();
  const titik = ep.titik ?? [];
  if (!titik.length) return null;
  const jumlah = hitungNilai(ep, state);
  return (
    <>
      <GrafikStatus ep={ep} deret={deretStatus(ep, state)} tx={tx} namaNasabah={namaNasabah} ringkas />
      <section className="akh-token" aria-labelledby={idJudul} data-ukur="akhir-token">
        <h3 id={idJudul} className="sr-only">{t('ceritaAkhir.ringkasanJudul', { n: titik.length })}</h3>
        {/* D-231: legenda = tanda + hitungan + kata; satu-satunya tempat di layar yang menyebut arti ketiga warna. */}
        <ul className="akh-token-legenda">
          {URUTAN_NILAI.map((n) => <li key={n} data-nilai={n}><TandaNilai nilai={n} /><b>{jumlah[n]}</b>{kataNilai(n)}</li>)}
        </ul>
        <ol className="akh-token-daftar">
          {titik.map((k, i) => {
            const it = infoTitik(state, k);
            return (
              <li key={k.id}>
                <button type="button" className="akh-token-tombol" data-token={k.id} data-nilai={it.nilai ?? 'kosong'}
                  aria-haspopup="dialog" aria-expanded={aktif === i} aria-label={t('ceritaAkhir.token.aria', { n: k.nomor, judul: tx(k.judul), nilai: kataNilai(it.nilai) })}
                  onClick={() => onBuka(i)}>
                  <GambarToken nomor={k.nomor} nilai={it.nilai} />
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

/** Peta 15 balok kecil di kepala lembar rincian: warna = klasifikasi tiap keputusan, balok keputusan ini lebih tinggi. Hiasan. */
export function PetaTitik({ ep, state, kini }: { ep: Episode; state: StateCerita; kini: number }) {
  const titik = ep.titik ?? [];
  return (
    <div className="akh-peta" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${titik.length || 1}, minmax(0, 1fr))` }}>
      {titik.map((k, i) => <i key={k.id} data-nilai={infoTitik(state, k).nilai ?? 'kosong'} data-kini={i === kini ? '' : undefined} />)}
    </div>
  );
}

/**
 * Isi lembar rincian satu keputusan: pilihanmu + cap hasil (tanda + kata), yang disarankan bila berbeda, alasan mentor di
 * gelembung ucapannya (`wajah` = potret mentor 32 px).
 */
export function IsiLembarTitik({ state, titik, tx, namaMentor, wajah }: {
  state: StateCerita;
  titik: TitikKeputusan;
  tx: (k: KunciTeks) => string;
  namaMentor: string;
  wajah: ReactNode;
}) {
  const it = infoTitik(state, titik);
  // Label = baris sendiri di atas teksnya; pemisah hanya untuk pembaca layar.
  const sela = <span className="sr-only">{selaPembicara()}</span>;
  return (
    <>
      <div className="akh-baris-hasil" data-titik={titik.id}>
        <p className="akh-baris" data-baris="pilihan"><b>{t('ceritaAkhir.pilihanmu')}</b>{sela}{it.label ? tx(it.label) : '–'}</p>
        <span className="akh-cap" data-nilai={it.nilai ?? 'kosong'}><TandaNilai nilai={it.nilai} />{kataNilai(it.nilai)}</span>
      </div>
      {it.saran ? <p className="akh-baris" data-baris="saran"><b>{t('ceritaAkhir.disarankan')}</b>{sela}{tx(it.saran)}</p> : null}
      <div className="akh-alasan" data-baris="alasan" data-tanpa-wajah={wajah ? undefined : ''}>
        {wajah ? <span className="akh-wajah">{wajah}</span> : null}
        <div className="akh-gelembung">
          <small>{t('ceritaAkhir.alasanMentor', { nama: namaMentor })}</small>{sela}
          <p>{tx(titik.alasan)}</p>
        </div>
      </div>
    </>
  );
}
