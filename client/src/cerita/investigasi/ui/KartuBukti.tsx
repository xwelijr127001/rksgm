/**
 * T-077: KARTU BUKTI. Baris: gambar bukti piksel 96 x 68 (seni/investigasi/bukti.png) + ikon jenis, judul (16 px tebal, maks. 2 baris),
 * sumber (14 px). Tinggi 76 px. Dengan `onPilih` kartu = tombol pilihan tunggal (aria-pressed); tanpa itu hanya tampilan (buku catatan).
 * `sorot` = bingkai berkedip pada bagian gambar yang perlu dilihat (dashcam: baris nomor lajur; lainnya seluruh gambar); gerak
 * dikurangi = bingkai diam. Props rencana: { bukti, terpilih?, sorot?, onPilih? } (+ opsional tx, redup).
 */
import buktiUrl from '../../seni/investigasi/bukti.png';
import { t } from '../../../i18n';
import { IkonInv, useTx, type Bukti, type Tx } from './dasar';
import './investigasi.css';

const SEL: Record<Bukti['id'], number> = { dashcam: 0, rambu: 1, sim: 2 };

export function KartuBukti({ bukti, terpilih = false, sorot = false, onPilih, tx, redup = false }: {
  bukti: Bukti;
  terpilih?: boolean;
  sorot?: boolean;
  onPilih?: (id: Bukti['id']) => void;
  tx?: Tx;
  /** Tampil pudar dan tidak bisa dipilih (langkah dipandu: hanya bukti yang tepat yang aktif). */
  redup?: boolean;
}) {
  const teks = useTx(tx);
  const isi = (
    <>
      <span className="iv-bukti-gambar" aria-hidden="true" style={{ backgroundImage: `url(${buktiUrl})`, backgroundPosition: `${-SEL[bukti.id] * 96}px 0` }}>
        {sorot ? <i className="iv-bukti-sorot" data-bukti={bukti.id} /> : null}
      </span>
      <span className="iv-bukti-teks">
        <b>{teks(bukti.judul)}</b>
        <small><IkonInv nama={bukti.ikon} kali={1} />{teks(bukti.sumber)}</small>
      </span>
      {onPilih ? <span className="iv-bukti-tanda" aria-hidden="true">{terpilih ? '✓' : ''}</span> : null}
    </>
  );
  if (!onPilih) return <div className="iv-bukti" data-bukti={bukti.id} data-sorot={sorot ? '' : undefined}>{isi}</div>;
  return (
    <button type="button" className="iv-bukti" data-bukti={bukti.id} data-sorot={sorot ? '' : undefined} data-redup={redup ? '' : undefined}
      aria-pressed={terpilih} disabled={redup} aria-label={`${t('investigasi.bukti')}: ${teks(bukti.judul)}`} onClick={() => onPilih(bukti.id)}>
      {isi}
    </button>
  );
}
