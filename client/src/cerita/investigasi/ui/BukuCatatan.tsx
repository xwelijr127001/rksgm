/**
 * T-077: BUKU CATATAN detektif + KARTU PERNYATAAN (pernyataan saksi yang bisa disematkan).
 *
 * BukuCatatan { pernyataan, bukti }: kertas bergaris dengan spiral di atas; dua bagian, "Pernyataan" (kartu pernyataan tersemat) dan
 * "Bukti" (kartu bukti, tampilan saja). Bagian kosong = satu kalimat petunjuk. Isinya menggulir di dalam bukunya sendiri bila tinggi
 * tempatnya kurang (halaman tidak pernah ikut menggulir).
 *
 * KartuPernyataan { pernyataan, tersemat?, onSemat?, reaksi?, sorot? } (tambahan untuk node `catat` Task 1 dan LayarKeberatan):
 * potret piksel pembicara 48 px (atau potret reaksi), nama, kalimat 18 px. `onSemat` = tombol "Sematkan" (pin) 48 px; sesudah
 * tersemat: pin merah di sudut + pinggiran berpendar jingga (gerak dikurangi: pendar diam).
 */
import { t } from '../../../i18n';
import { PotretPikselHp } from '../../ui/latar/piksel/PotretPikselHp';
import reaksiUrl from '../../seni/investigasi/reaksi.png';
import { IkonInv, useTx, type Bukti, type Pernyataan, type Tx } from './dasar';
import { KartuBukti } from './KartuBukti';
import './investigasi.css';

/** Potret reaksi 64 x 64 (seni/investigasi/reaksi.png): tokoh + tanda emosi. */
const SEL_REAKSI = { 'tol-kaget': 0, 'tol-mengaku': 1, 'darto-lega': 2, 'miss-berpikir': 3, 'miss-bangga': 4 } as const;
export type Reaksi = keyof typeof SEL_REAKSI;
export function PotretReaksi({ reaksi, ukuran = 64, label = '' }: { reaksi: Reaksi; ukuran?: 48 | 64 | 128; label?: string }) {
  return (
    <span className="iv-reaksi" data-reaksi={reaksi} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{ width: ukuran, height: ukuran, backgroundImage: `url(${reaksiUrl})`, backgroundSize: `${320 * ukuran / 64}px ${ukuran}px`, backgroundPosition: `${-SEL_REAKSI[reaksi] * ukuran}px 0` }} />
  );
}

const TOKOH_PIKSEL = { darto: 'darto', petugasTol: 'tol' } as const;

export function KartuPernyataan({ pernyataan, tersemat = false, onSemat, reaksi, sorot = false, tx }: {
  pernyataan: Pernyataan;
  tersemat?: boolean;
  /** Ada = tombol "Sematkan" (node `catat`); sesudah tersemat tombolnya menjadi tanda "Tersemat". */
  onSemat?: (id: string) => void;
  /** Ganti potret biasa dengan potret reaksi (mis. petugas tol "kaget" sesudah KEBERATAN). */
  reaksi?: Reaksi;
  /** Pendar jingga (pernyataan yang sedang dibantah di LayarKeberatan). */
  sorot?: boolean;
  tx?: Tx;
}) {
  const teks = useTx(tx);
  const nama = t(`investigasi.siapa.${pernyataan.siapa}`);
  return (
    <figure className="iv-pernyataan" data-pernyataan={pernyataan.id} data-tersemat={tersemat ? '' : undefined} data-sorot={sorot || tersemat ? '' : undefined}>
      {tersemat ? <IkonInv nama="pin" className="iv-pernyataan-pin" /> : null}
      <span className="iv-pernyataan-potret" aria-hidden="true">
        {reaksi ? <PotretReaksi reaksi={reaksi} ukuran={48} /> : <PotretPikselHp tokoh={TOKOH_PIKSEL[pernyataan.siapa]} ekspresi="netral" ukuran={48} label="" />}
      </span>
      <figcaption className="iv-pernyataan-teks">
        <b>{nama}</b>
        <q>{teks(pernyataan.teks)}</q>
      </figcaption>
      {onSemat ? (
        tersemat
          ? <span className="iv-semat-sudah" role="status">{t('investigasi.tersemat')}</span>
          : <button type="button" className="iv-semat" data-semat="" onClick={() => onSemat(pernyataan.id)}><IkonInv nama="pin" kali={1} />{t('investigasi.semat')}</button>
      ) : null}
    </figure>
  );
}

export function BukuCatatan({ pernyataan, bukti, tx }: { pernyataan: Pernyataan[]; bukti: Bukti[]; tx?: Tx }) {
  return (
    <section className="iv-buku" aria-label={t('investigasi.buku')} data-buku-catatan="">
      <span className="iv-buku-spiral" aria-hidden="true" />
      <div className="iv-buku-isi">
        <h3 className="iv-buku-judul"><IkonInv nama="buku" kali={1} />{t('investigasi.buku')}</h3>
        <h4>{t('investigasi.pernyataan')} <span className="iv-hitung">{pernyataan.length}</span></h4>
        {pernyataan.length
          ? <ul className="iv-daftar">{pernyataan.map((p) => <li key={p.id}><KartuPernyataan pernyataan={p} tersemat tx={tx} /></li>)}</ul>
          : <p className="iv-kosong">{t('investigasi.kosongPernyataan')}</p>}
        <h4>{t('investigasi.bukti')} <span className="iv-hitung">{bukti.length}</span></h4>
        {bukti.length
          ? <ul className="iv-daftar">{bukti.map((b) => <li key={b.id}><KartuBukti bukti={b} tx={tx} /></li>)}</ul>
          : <p className="iv-kosong">{t('investigasi.kosongBukti')}</p>}
      </div>
    </section>
  );
}
