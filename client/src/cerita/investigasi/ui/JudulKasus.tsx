/**
 * T-077: KARTU JUDUL KASUS ("KASUS #1 · Truk di Tol"). Map kasus + kaca pembesar piksel (seni/investigasi/judul.png, 2x), label
 * nomor kasus, judul besar, tombol "Mulai selidiki" -> onMulai. Masuk dengan lompatan kecil (gerak dikurangi: langsung tampil).
 * Props rencana: { nomor, judul, onMulai } (`judul` = teks jadi atau KunciTeks; + opsional tx). Tinggi +- 330 px.
 */
import { t } from '../../../i18n';
import judulUrl from '../../seni/investigasi/judul.png';
import { useTx, type Tx } from './dasar';
import './investigasi.css';

export function JudulKasus({ nomor, judul, onMulai, tx }: { nomor: number; judul: string; onMulai: () => void; tx?: Tx }) {
  const teks = useTx(tx);
  return (
    <section className="iv-layar iv-judul" data-judul-kasus="" aria-labelledby="iv-judul-kasus">
      <div className="iv-judul-kartu">
        <p className="iv-judul-nomor">{t('investigasi.kasus', { n: nomor })}</p>
        <span className="iv-judul-gambar" aria-hidden="true" style={{ backgroundImage: `url(${judulUrl})` }} />
        <h2 id="iv-judul-kasus" tabIndex={-1} data-cer-fokus="">{teks(judul)}</h2>
        <p className="iv-judul-sub">{t('investigasi.judulSub')}</p>
      </div>
      <button type="button" className="primary-action iv-tombol" data-mulai-kasus="" onClick={onMulai}>{t('investigasi.mulai')}</button>
    </section>
  );
}
