/**
 * T-088: PENGGODA KASUS 2 (review pilot butir 3: "Kasus berikutnya" punya tujuan yang jujur).
 *
 * TeaserKasus { onBuka }: kartu yang bisa diketuk, 96 px: siluet piksel MOBIL KELUARGA (MPV) di jalan malam dengan HP menyala di
 * dasbor dan keping "ONLINE" berdenyut (seni/investigasi/kasus2.png, 2x, dipotong 136 x 88), judul "Kasus 2 · segera hadir", kalimat
 * "Mobil keluarga... atau taksi online diam-diam?", dan "Lihat pratinjau". Ketukan = onBuka (pemanggil yang mencatat minat dan
 * membuka PratinjauKasus2).
 * PratinjauKasus2 { onTutup }: lembar pratinjau (Modal aplikasi): gambar utuh 240 x 112, tiga kalimat, slot stempel kasus 2 yang
 * masih TERKUNCI, tombol tutup. Semuanya fiktif: tanpa nama merek atau logo; bentuk mobilnya generik.
 * Gerak dikurangi: keping "ONLINE" diam.
 */
import type { CSSProperties } from 'react';
import { t } from '../../../i18n';
import { Modal } from '../../../ui/kit';
import kasus2 from '../../seni/investigasi/kasus2.png';
import { IkonInv } from './dasar';
import './investigasi.css';
import './tambahan.css';

export function TeaserKasus({ onBuka }: { onBuka: () => void }) {
  return (
    <button type="button" className="iv-teaser" data-teaser-kasus="2" aria-haspopup="dialog" onClick={onBuka}>
      <span className="iv-teaser-gambar" aria-hidden="true" style={{ backgroundImage: `url(${kasus2})` } as CSSProperties}><i>ONLINE</i></span>
      <span className="iv-teaser-teks">
        <b>{t('investigasi.kasus2.judul')}</b>
        <span>{t('investigasi.kasus2.tanya')}</span>
        <em>{t('investigasi.kasus2.buka')} ›</em>
      </span>
    </button>
  );
}

export function PratinjauKasus2({ onTutup }: { onTutup: () => void }) {
  return (
    <Modal judul={t('investigasi.kasus2.judul')} onTutup={onTutup} lebar={420}>
      <div className="iv-pratinjau">
      <span className="iv-pratinjau-gambar" aria-hidden="true" style={{ backgroundImage: `url(${kasus2})` }}><i>ONLINE</i></span>
      <p className="iv-pratinjau-tanya">{t('investigasi.kasus2.tanya')}</p>
      <p>{t('investigasi.kasus2.p1')}</p>
      <p>{t('investigasi.kasus2.p2')}</p>
      <p>{t('investigasi.kasus2.p3')}</p>
      <p className="iv-pratinjau-stempel"><IkonInv nama="stempel-kosong" /><IkonInv nama="kunci" kali={1} /><span>{t('investigasi.kasus2.stempel')}</span></p>
      <button type="button" className="akh-kedua iv-tombol" data-tutup-pratinjau="" onClick={onTutup}>{t('investigasi.kasus2.tutup')}</button>
      </div>
    </Modal>
  );
}
