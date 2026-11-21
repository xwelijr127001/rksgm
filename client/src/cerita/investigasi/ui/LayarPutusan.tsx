/**
 * T-077: LAYAR PUTUSAN. Tiga kartu putusan (ikon piksel 32 px + nama putusan 18 px + alasan singkat 15 px), pilih satu lalu
 * "Tetapkan putusan" -> onPilih('layak' | 'tambahan' | 'polis'). Urutan kartu tetap dan tidak menaruh jawaban di tempat pertama.
 * Props rencana: { onPilih }. T-078: alasan mengikuti laporan yang SUDAH diperbaiki (truk di lajur 2). Ukur 360 x 640 (hitung; ruang
 * isi 544): tanya 26 + keterangan 20..40 + 3 kartu (alasan 15 px, sampai 3 baris: 107) + 2 x 8 + tombol 56 + jarak 3 x 8 = 463..483
 * px <= 544 (zh: kartu 87 -> 403).
 */
import { useState } from 'react';
import { t } from '../../../i18n';
import { IkonInv, type Putusan } from './dasar';
import './investigasi.css';

const URUTAN: readonly Putusan[] = ['tambahan', 'layak', 'polis'];

export function LayarPutusan({ onPilih, ket, sebab }: {
  onPilih: (p: Putusan) => void;
  /** T-090 (Fullstack, kasus berbasis data): keterangan di bawah pertanyaan (teks jadi); tanpa nilai = teks kasus 1 di kamus. */
  ket?: string;
  /** T-090: alasan singkat tiap kartu putusan untuk kasus ini (teks jadi); tanpa nilai = alasan kasus 1 di kamus. */
  sebab?: Partial<Record<Putusan, string>>;
}) {
  const [pilih, setPilih] = useState<Putusan | null>(null);
  return (
    <section className="iv-layar iv-putusan" data-layar-putusan="" aria-labelledby="iv-putusan-tanya">
      <h2 id="iv-putusan-tanya" className="iv-tanya" tabIndex={-1} data-cer-fokus="">{t('investigasi.putusan.tanya')}</h2>
      <p className="iv-label">{ket ?? t('investigasi.putusan.ket')}</p>
      <div className="iv-daftar" role="radiogroup" aria-labelledby="iv-putusan-tanya">
        {URUTAN.map((p) => (
          <button key={p} type="button" role="radio" aria-checked={pilih === p} className="iv-putusan-kartu" data-putusan={p} onClick={() => setPilih(p)}>
            <IkonInv nama={p} />
            <span className="iv-putusan-teks"><b>{t(`investigasi.putusan.${p}`)}</b><small>{sebab?.[p] ?? t(`investigasi.putusan.${p}.sebab`)}</small></span>
            <span className="iv-bukti-tanda" aria-hidden="true">{pilih === p ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      <button type="button" className="primary-action iv-tombol" data-tetapkan="" disabled={!pilih} onClick={() => { if (pilih) onPilih(pilih); }}>
        {pilih ? t('investigasi.putusan.tombol') : t('investigasi.putusan.belum')}
      </button>
    </section>
  );
}
