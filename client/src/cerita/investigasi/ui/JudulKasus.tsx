/**
 * T-077: KARTU JUDUL KASUS ("KASUS #1 · Truk di Tol"). Map kasus + kaca pembesar piksel (seni/investigasi/judul.png, 2x), label
 * nomor kasus, judul besar, tombol "Mulai selidiki" -> onMulai. Masuk dengan lompatan kecil (gerak dikurangi: langsung tampil).
 * Props rencana: { nomor, judul, onMulai } (`judul` = teks jadi atau KunciTeks; + opsional tx, gambar).
 * T-078: `gambar` mengganti ilustrasi map (Investigator: bingkai dashcam diam 292 x 150 + tepi). Ukur 360 x 640 (hitung, ruang
 * isi 544 = 640 - kepala 56 - bantalan .hp-main 12 + 28): bantalan 12 + kartu (pita 38 + gambar 154 + judul 31 + sub 20 + jarak
 * 3 x 8 + bawah 16 + tepi 6 = 289) + 14 + tombol 56 = 371, + tautan "Tamu baru" 12 + 48 = 431 px.
 * T-084: `tokoh` = potret di kiri judul (Miss Raksa investigator dengan kaca pembesar, 128 px): baris judul menjadi 132 px,
 * kartu 362, layar 444, dengan tautan "Tamu baru" 504 px <= 544.
 */
import type { ReactNode } from 'react';
import { t } from '../../../i18n';
import judulUrl from '../../seni/investigasi/judul.png';
import { useTx, type Tx } from './dasar';
import './investigasi.css';

export function JudulKasus({ nomor, judul, onMulai, tx, gambar, tokoh }: { nomor: number; judul: string; onMulai: () => void; tx?: Tx; gambar?: ReactNode; /** T-084: potret tokoh di kiri judul (Miss Raksa investigator 128 px). */ tokoh?: ReactNode }) {
  const teks = useTx(tx);
  return (
    <section className="iv-layar iv-judul" data-judul-kasus="" aria-labelledby="iv-judul-kasus">
      <div className="iv-judul-kartu">
        <p className="iv-judul-nomor">{t('investigasi.kasus', { n: nomor })}</p>
        {gambar ?? <span className="iv-judul-gambar" aria-hidden="true" style={{ backgroundImage: `url(${judulUrl})` }} />}
        <div className="iv-judul-baris" data-tokoh={tokoh ? '' : undefined}>
          {tokoh ? <span className="iv-judul-tokoh" aria-hidden="true">{tokoh}</span> : null}
          <div>
            <h2 id="iv-judul-kasus" tabIndex={-1} data-cer-fokus="">{teks(judul)}</h2>
            <p className="iv-judul-sub">{t('investigasi.judulSub')}</p>
          </div>
        </div>
      </div>
      <button type="button" className="primary-action iv-tombol" data-mulai-kasus="" onClick={onMulai}>{t('investigasi.mulai')}</button>
    </section>
  );
}
