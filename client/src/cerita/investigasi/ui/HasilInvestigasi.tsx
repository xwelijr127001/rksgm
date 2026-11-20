/**
 * T-077: HASIL INVESTIGASI. Lencana nilai S / A / B / C (seni/investigasi/nilai.png, 2x = 80 px) + total "85 / 100"; tiga baris poin
 * per bagian (Bukti 40, Putusan 30, Penanganan nasabah 30) dengan batang; kartu petugas (KartuPetugas T-072) dengan pangkat dan
 * baris stempel kasus; "Main lagi" dan "Kasus berikutnya" (untuk sekarang menampilkan "segera hadir").
 * Props rencana: { skor, nama, look, stempel, pangkat, onMainLagi, onKasusBerikutnya } (+ opsional berikutnyaSegera, bawaan true:
 * ketukan menampilkan catatan "segera hadir" lalu tetap memanggil onKasusBerikutnya).
 * T-078: potret reaksi Miss Raksa 64 px di kanan kepala (opsional `reaksi`); stempel kasus TERBARU dicap sesudah 0,6 s (membesar
 * lalu mendarat + satu bunyi; gerak dikurangi: langsung terpasang; T-085: bunyinya 'stempel', juga saat gerak dikurangi); catatan "segera hadir" tidak lagi
 * memesan tempat. Ukur 360 x 640 (hitung; ruang isi 544 = 640 - kepala cerita 56 - bantalan .hp-main 12 + 28):
 * kepala 80 + poin 3 x 24 + 2 x 4 = 80 + kartu 176 + tombol 52 + jarak 3 x 8 = 412 (+ 28 bila "segera hadir" tampil);
 * + jarak 12 + kaki HasilKasus (skor terbaik 20 + 4 + "Tamu baru" 44 = 68) = 492; konfirmasi "Tamu baru" terbuka (keterangan 40 +
 * tombol 44, baris skor terbaik disembunyikan) = 508, dan 536 bila "segera hadir" juga tampil: semuanya <= 544.
 */
import { useEffect, useState } from 'react';
import { playSfx } from '../../../audio/audio';
import { useReducedMotion } from '../../../hooks';
import type { PlayerLook } from '@shared/types';
import { t } from '../../../i18n';
import { KartuPetugas } from '../../ui/KartuPetugas';
import nilaiUrl from '../../seni/investigasi/nilai.png';
import { PotretReaksi, type Reaksi } from './BukuCatatan';
import type { Pangkat, SkorKasus } from './dasar';
import './investigasi.css';

const SEL_NILAI: Record<SkorKasus['nilai'], number> = { S: 0, A: 1, B: 2, C: 3 };

export function HasilInvestigasi({ skor, nama, look, stempel, pangkat, onMainLagi, onKasusBerikutnya, berikutnyaSegera = true, reaksi }: {
  skor: SkorKasus;
  nama: string;
  look: PlayerLook;
  stempel: string[];
  pangkat: Pangkat;
  onMainLagi: () => void;
  onKasusBerikutnya: () => void;
  berikutnyaSegera?: boolean;
  /** T-078: potret reaksi di kanan kepala (mis. Miss Raksa "bangga"). */
  reaksi?: Reaksi;
}) {
  const [segera, setSegera] = useState(false);
  const kurang = useReducedMotion();
  // Bunyi cap stempel tepat saat stempel mendarat (animasi CSS .kp-stempel i[data-baru]: mulai 0,6 s, mendarat 0,82 s).
  // T-085: bunyi 'stempel' (arpeggio cerah, khusus investigator). Gerak dikurangi: stempel langsung terpasang, bunyinya tetap
  // ada (arahan Lead: gerak dikurangi tidak mengubah audio), segera sesudah layar tampil.
  useEffect(() => {
    if (!stempel.length) return;
    const w = window.setTimeout(() => playSfx('stempel'), kurang ? 150 : 820);
    return () => window.clearTimeout(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        {reaksi ? <PotretReaksi reaksi={reaksi} ukuran={64} /> : null}
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
      <KartuPetugas nama={nama} look={look} investigasi={{ stempel, pangkat, baru: true }} />
      <div className="iv-hasil-aksi">
        <button type="button" className="akh-kedua iv-tombol" data-main-lagi="" onClick={onMainLagi}>{t('investigasi.hasil.mainLagi')}</button>
        <button type="button" className="primary-action iv-tombol" data-kasus-berikutnya="" onClick={() => { if (berikutnyaSegera) setSegera(true); onKasusBerikutnya(); }}>
          {t('investigasi.hasil.berikutnya')}
        </button>
      </div>
      <p className="iv-hasil-segera" role="status" data-tampil={segera ? '' : undefined}>{segera ? t('investigasi.hasil.segera') : ''}</p>
    </section>
  );
}
