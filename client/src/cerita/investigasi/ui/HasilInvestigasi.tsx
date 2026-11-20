/**
 * T-077: HASIL INVESTIGASI. Lencana nilai S / A / B / C (seni/investigasi/nilai.png, 2x = 80 px) + total "85 / 100"; tiga baris poin
 * per bagian (Bukti 40, Putusan 30, Penanganan nasabah 30) dengan batang; kartu petugas (KartuPetugas T-072) dengan pangkat dan
 * baris stempel kasus; "Main lagi" dan "Kasus berikutnya" (untuk sekarang menampilkan "segera hadir").
 * Props rencana: { skor, nama, look, stempel, pangkat, onMainLagi, onKasusBerikutnya } (+ opsional berikutnyaSegera, bawaan true:
 * ketukan menampilkan catatan "segera hadir" lalu tetap memanggil onKasusBerikutnya).
 * Ukur 360 x 640 (hitung): kepala 80 + poin 3 x 26 + 2 x 4 = 86 + kartu 176 + tombol 52 + catatan 20 + jarak 4 x 10 = 454 px <= 568.
 */
import { useState } from 'react';
import type { PlayerLook } from '@shared/types';
import { t } from '../../../i18n';
import { KartuPetugas } from '../../ui/KartuPetugas';
import nilaiUrl from '../../seni/investigasi/nilai.png';
import type { Pangkat, SkorKasus } from './dasar';
import './investigasi.css';

const SEL_NILAI: Record<SkorKasus['nilai'], number> = { S: 0, A: 1, B: 2, C: 3 };

export function HasilInvestigasi({ skor, nama, look, stempel, pangkat, onMainLagi, onKasusBerikutnya, berikutnyaSegera = true }: {
  skor: SkorKasus;
  nama: string;
  look: PlayerLook;
  stempel: string[];
  pangkat: Pangkat;
  onMainLagi: () => void;
  onKasusBerikutnya: () => void;
  berikutnyaSegera?: boolean;
}) {
  const [segera, setSegera] = useState(false);
  const bagian: [string, number, number][] = [['bukti', skor.bukti, 40], ['putusan', skor.putusan, 30], ['penanganan', skor.penanganan, 30]];
  return (
    <section className="iv-layar iv-hasil" data-hasil-investigasi="" data-nilai={skor.nilai} aria-labelledby="iv-hasil-judul">
      <div className="iv-hasil-kepala">
        <span className="iv-nilai" role="img" aria-label={t('investigasi.hasil.nilai', { nilai: skor.nilai })}
          style={{ backgroundImage: `url(${nilaiUrl})`, backgroundPosition: `${-SEL_NILAI[skor.nilai] * 80}px 0` }} />
        <div className="iv-hasil-total">
          <h2 id="iv-hasil-judul" tabIndex={-1} data-cer-fokus="">{t('investigasi.hasil.judul')}</h2>
          <p className="iv-hasil-angka"><b>{skor.total}</b><span> / 100</span></p>
          <p className="iv-hasil-pangkat">{t(`investigasi.pangkat.${pangkat}`)}</p>
        </div>
      </div>
      <ul className="iv-poin">
        {bagian.map(([kunci, n, maks]) => (
          <li key={kunci}>
            <span className="iv-poin-nama">{t(`investigasi.hasil.${kunci}`)}</span>
            <span className="iv-poin-batang" aria-hidden="true"><i style={{ width: `${(n / maks) * 100}%` }} /></span>
            <span className="iv-poin-angka"><b>{n}</b> / {maks}</span>
          </li>
        ))}
      </ul>
      <KartuPetugas nama={nama} look={look} investigasi={{ stempel, pangkat }} />
      <div className="iv-hasil-aksi">
        <button type="button" className="akh-kedua iv-tombol" data-main-lagi="" onClick={onMainLagi}>{t('investigasi.hasil.mainLagi')}</button>
        <button type="button" className="primary-action iv-tombol" data-kasus-berikutnya="" onClick={() => { if (berikutnyaSegera) setSegera(true); onKasusBerikutnya(); }}>
          {t('investigasi.hasil.berikutnya')}
        </button>
      </div>
      <p className="iv-hasil-segera" role="status">{segera ? t('investigasi.hasil.segera') : ''}</p>
    </section>
  );
}
