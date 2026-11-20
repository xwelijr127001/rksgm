/**
 * T-079: KILAS BALIK keterangan saksi (Episode 1 Investigator). Panel film 336 x 236 (pita berlubang atas & bawah, isi 336 x 184)
 * yang MEMPERAGAKAN kalimat kunci saksi, dalam olahan sepia + butir film + label "KETERANGAN":
 *   darto  jalan tol tampak atas (seni dashcam T-069 / T-071, 1:1): truk melaju di lajur 2, mobil kecil memotong dari lajur 3,
 *          truk membanting setir ke kiri; nomor lajur 1-4 di bawah, nomor 2 dilingkari. Putaran 4,8 detik.
 *   tol    buku catatan petugas tol dari dekat (seni/investigasi/kilas-tol.png, 2x): tangan menulis angka "3" di kotak LAJUR.
 *          Putaran 3,6 detik.
 * Itu KETERANGAN saksi, bukan fakta: label dan olahan sepia yang membedakannya dari rekaman dashcam (bukti) nanti.
 * Gerak dikurangi: bingkai diam (keadaan akhir: mobil sudah di depan truk / angka 3 sudah tertulis).
 */
import type { CSSProperties } from 'react';
import { t } from '../../../i18n';
import ubin from '../../seni/aktivitas/dashcam/ubin.png';
import nomorLajur from '../../seni/aktivitas/dashcam/nomor-lajur.png';
import mobilAtas from '../../seni/aktivitas/dashcam/mobil-atas.png';
import trukAtas from '../../seni/aktivitas/jalan/truk-atas.png';
import butir from '../../seni/investigasi/butir.png';
import kilasTol from '../../seni/investigasi/kilas-tol.png';
import kilasTiga from '../../seni/investigasi/kilas-tiga.png';
import kilasTangan from '../../seni/investigasi/kilas-tangan.png';
import './keterangan.css';

export type Kilas = 'darto' | 'tol';

export function KilasBalik({ jenis, nama }: { jenis: Kilas; nama: string }) {
  return (
    <figure className="kb" data-kilas={jenis} aria-label={`${t('investigasi.kilas.label')}: ${t(`investigasi.kilas.${jenis}`)}`}
      style={{ '--kb-butir': `url(${butir})` } as CSSProperties}>
      <div className="kb-film" aria-hidden="true">
        {jenis === 'darto' ? (
          <>
            <span className="kb-jalan" style={{ backgroundImage: `url(${ubin})` }} />
            <img className="kb-truk" src={trukAtas} alt="" />
            <img className="kb-mobil" src={mobilAtas} alt="" />
            <img className="kb-nomor" src={nomorLajur} alt="" />
            <i className="kb-cincin" />
          </>
        ) : (
          <>
            <span className="kb-buku" style={{ backgroundImage: `url(${kilasTol})` }} />
            <i className="kb-tiga" style={{ backgroundImage: `url(${kilasTiga})` }} />
            <i className="kb-tangan" style={{ backgroundImage: `url(${kilasTangan})` }} />
          </>
        )}
        <span className="kb-butir" />
      </div>
      <figcaption className="kb-tag"><b>{t('investigasi.kilas.label')}</b><span>{nama}</span></figcaption>
    </figure>
  );
}
