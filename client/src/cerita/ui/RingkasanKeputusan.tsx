/**
 * RINGKASAN KEPUTUSAN BERNOMOR (episode dengan `Episode.titik`, mis. 15 keputusan Episode 2), tampil di layar akhir
 * sesudah kartu akhir: grafik status nasabah dari awal sampai akhir (titik = setiap perubahan status, pita = suasana),
 * lalu tiap keputusan: pilihanmu + klasifikasi naskah (ikon + kata, bukan hanya warna), yang disarankan bila berbeda,
 * dan alasan mentor. Bukan skor kompetisi: status nasabah dan klasifikasi naskah, tanpa poin.
 * Pilihan dibaca dari tanda `kep:<titik>:<alternatif>`; titik yang tidak tercatat (simpanan rusak) tampil "-".
 */
import { useId } from 'react';
import { t } from '../../i18n';
import type { Episode, KunciTeks, NilaiAlternatif, StateCerita } from '../tipe';
import { selaPembicara } from './bagian';
import { deretStatus, pilihanTitik } from './titik';

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

/** Grafik garis status 0-100 dengan pita suasana; teks alternatif merangkum awal, akhir, terendah & tertinggi. */
function GrafikStatus({ ep, deret, tx, namaNasabah }: { ep: Episode; deret: number[]; tx: (k: KunciTeks) => string; namaNasabah: string }) {
  const W = 320, H = 120, kiri = 4, kanan = 4, atas = 6, bawah = 6;
  const batas = ep.kepercayaanBatas ?? { min: 0, maks: 100 };
  const y = (v: number) => atas + (1 - (v - batas.min) / (batas.maks - batas.min || 1)) * (H - atas - bawah);
  const x = (i: number) => kiri + (deret.length > 1 ? (i / (deret.length - 1)) * (W - kiri - kanan) : 0);
  const pita = [...ep.suasana].sort((a, b) => a.min - b.min);
  const id = useId();
  const akhir = deret[deret.length - 1]!;
  const ringkas = t('ceritaAkhir.statusAlt', {
    nama: namaNasabah, awal: deret[0]!, akhir, min: Math.min(...deret), maks: Math.max(...deret),
  });
  return (
    <figure className="akh-grafik">
      <figcaption id={id}>{t('ceritaAkhir.statusJudul', { nama: namaNasabah })}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} aria-describedby={id + 'd'} preserveAspectRatio="none">
        {pita.map((p, i) => {
          const atasPita = i + 1 < pita.length ? pita[i + 1]!.min : batas.maks;
          return <rect key={p.label} x={0} y={y(atasPita)} width={W} height={y(p.min) - y(atasPita)} className={'akh-grafik-pita akh-grafik-pita-' + (i % 2)} />;
        })}
        <polyline points={deret.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} className="akh-grafik-garis" />
        {/* Titik = garis nol-panjang berujung bulat dengan goresan tak-berskala: tetap bulat walau viewBox diregangkan. */}
        {deret.map((v, i) => (
          <g key={i} className={i === deret.length - 1 ? 'akh-grafik-titik akh-grafik-titik-akhir' : 'akh-grafik-titik'}>
            <path d={`M${x(i).toFixed(1)} ${y(v).toFixed(1)}h0`} className="akh-grafik-titik-luar" />
            <path d={`M${x(i).toFixed(1)} ${y(v).toFixed(1)}h0`} className="akh-grafik-titik-dalam" />
          </g>
        ))}
      </svg>
      <ul className="akh-grafik-legenda" aria-hidden="true">
        <li className="akh-grafik-legenda-judul">{t('ceritaAkhir.pitaJudul')}</li>
        {[...pita].reverse().map((p) => <li key={p.label}><b>{p.min}+</b> {tx(p.label)}</li>)}
      </ul>
      <p id={id + 'd'} className="sr-only">{ringkas}</p>
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
          const alt = pilihanTitik(state, k.id);
          const info = alt && Object.prototype.hasOwnProperty.call(k.alternatif, alt) ? k.alternatif[alt]! : null;
          const nilai = info?.nilai ?? null;
          const saran = k.alternatif[k.saran];
          return (
            <li key={k.id} className="akh-tk" data-titik={k.id} data-nilai={nilai ?? 'kosong'}>
              <details>
                <summary>
                  <span className="akh-tk-no">{k.nomor}</span>
                  <span className="akh-tk-judul">{tx(k.judul)}</span>
                  <span className={'akh-tk-chip akh-tk-' + (nilai ?? 'kosong')}>
                    <IkonNilai nilai={nilai} />
                    {nilai ? t(`ceritaAkhir.nilai.${nilai}`) : '–'}
                  </span>
                  {/* Tanda bisa dibuka (juga di layar sentuh): panah berputar saat terbuka. */}
                  <svg className="akh-tk-buka" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="akh-tk-isi">
                  <p><b>{t('ceritaAkhir.pilihanmu')}</b>{selaPembicara()}{info ? tx(info.label) : '–'}</p>
                  {alt !== k.saran && saran ? <p><b>{t('ceritaAkhir.disarankan')}</b>{selaPembicara()}{tx(saran.label)}</p> : null}
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
