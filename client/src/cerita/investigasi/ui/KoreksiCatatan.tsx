/**
 * T-088: KOREKSI CATATAN (sesudah cap KEBERATAN berhasil). Buku catatan petugas tol dari dekat (seni kilas balik yang sama,
 * seni/investigasi/kilas-tol.png, tanpa olahan sepia: ini terjadi sekarang): penanya MENCORET angka "3" di kotak LAJUR dan menulis
 * "2" di sebelahnya (tinta bergerak 2,6 detik, sekali; bunyi gores 'kertas' lalu 'konfirmasi'). Di bawahnya halaman "Keterangan"
 * buku catatan pemain: kalimat petugas dicoret dan baris "Laporan dikoreksi: lajur 2" tertulis. "Lanjut" -> onSelesai.
 * Gerak dikurangi: bingkai akhir (3 tercoret, 2 tertulis, baris koreksi ada), satu bunyi 'konfirmasi'.
 *
 * Props: { onSelesai, pernyataan?, tx? }. Tanpa \`pernyataan\` hanya buku petugas yang tampil.
 * Ukur 360 x 640 (hitung; ruang isi 544): judul 26 + buku petugas 188 + keterangan 20..40 + halaman keterangan (sampul 18 +
 * halaman 40 + baris +- 96) 154 + tombol 56 + jarak 4 x 8 = 496..516 px.
 */
import { useEffect } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import { t } from '../../../i18n';
import kilasTol from '../../seni/investigasi/kilas-tol.png';
import kilasTiga from '../../seni/investigasi/kilas-tiga.png';
import kilasDua from '../../seni/investigasi/kilas-dua.png';
import kilasTangan from '../../seni/investigasi/kilas-tangan.png';
import { BukuCatatan } from './BukuCatatan';
import type { Pernyataan, Tx } from './dasar';
import './investigasi.css';
import './tambahan.css';

export function KoreksiCatatan({ onSelesai, pernyataan, tx }: { onSelesai: () => void; pernyataan?: Pernyataan; tx?: Tx }) {
  const kurang = useReducedMotion();
  useEffect(() => {
    if (kurang) { playSfx('konfirmasi'); return; }
    const a = window.setTimeout(() => playSfx('kertas'), 400);   // coretan
    const b = window.setTimeout(() => playSfx('konfirmasi'), 2100); // angka 2 selesai
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [kurang]);
  return (
    <section className="iv-layar iv-koreksi" data-koreksi-catatan="" aria-labelledby="iv-koreksi-judul">
      <h2 id="iv-koreksi-judul" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{t('investigasi.koreksi.judul')}</h2>
      <figure className="kr" aria-label={t('investigasi.koreksi.ket')}>
        <div className="kr-isi" aria-hidden="true">
          <span className="kr-buku" style={{ backgroundImage: `url(${kilasTol})` }} />
          <i className="kr-tiga" style={{ backgroundImage: `url(${kilasTiga})` }} />
          <i className="kr-coret" />
          <i className="kr-dua" style={{ backgroundImage: `url(${kilasDua})` }} />
          <i className="kr-tangan" style={{ backgroundImage: `url(${kilasTangan})` }} />
        </div>
      </figure>
      <p className="iv-label">{t('investigasi.koreksi.ket')}</p>
      {pernyataan ? (
        <BukuCatatan pernyataan={[pernyataan]} bukti={[]} tx={tx} halaman="keterangan" tanpaPensil
          koreksi={{ id: pernyataan.id, teks: t('investigasi.koreksi.baris'), baru: true }} />
      ) : null}
      <button type="button" className="primary-action iv-tombol" data-koreksi-lanjut="" onClick={onSelesai}>{t('investigasi.sim.lanjut')}</button>
    </section>
  );
}
