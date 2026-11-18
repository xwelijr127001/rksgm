/**
 * POLA PESAN (K15 komunikasi): menyusun pesan WhatsApp. DRAF (bukan gelembung terkirim) berisi kalimat bagian yang dimasukkan
 * (urutan tetap); di bawahnya bagian-bagian yang bisa dimasukkan (tombol tekan-tahan aria-pressed). Ketuk bagian =
 * masuk ke pesan; ketuk lagi = keluar. T-034: pratinjau di puncak (tombol buka / tutup), bagian = chip piksel 2 kolom. Yang tidak dimasukkan dikirim sebagai
 * "tidak dimasukkan" (logika.jawabanKirim). Pesan kosong tidak bisa dikirim.
 */
import { useState } from 'react';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { TombolKirim } from '../bagianHp';
import { alihBagian, bagianDiPesan, type ArenaPesan } from './logika';
import type { PropsPola } from './pola';
import './pesan.css';

export function ArenaPolaPesan({ konfig, jawaban, ubah, tx, labelKirim, onKirim }: PropsPola & { konfig: ArenaPesan }) {
  const di = bagianDiPesan(konfig, jawaban);
  const alih = (id: string) => ubah(alihBagian(konfig, jawaban, id));
  // T-034 (D-314): pratinjau di puncak sebagai gelembung yang terisi bagian terpilih (urutan tetap); 2-3 baris, ketuk = buka / tutup.
  const [buka, setBuka] = useState(false);
  return (
    <div className="hp-pesan-susun">
      <KeSlot ke={SlotKepalaArena}><h3 className="hp-tanya-arena">{tx(konfig.tanya)}</h3></KeSlot>
      <button type="button" id="hp-draf-pesan" className="hp-draf" data-buka={buka ? '' : undefined} aria-expanded={buka} onClick={() => setBuka((v) => !v)}>
        <span className="hp-draf-judul" style={{ display: 'block' }}>{t('ceritaHp.drafPesan')}</span>
        <span className="hp-draf-teks" aria-live="polite" style={{ display: 'block' }}>
          {di.length
            ? di.map((id) => <span key={id} className="hp-draf-kalimat" data-bagian={id}>{tx(konfig.benda.find((x) => x.id === id)!.keterangan!)}</span>)
            : <span className="hp-draf-kosong" style={{ display: 'block' }}>{t('ceritaHp.pesanKosong')}</span>}
        </span>
      </button>
      {/* D-313: enam bagian sebagai chip piksel 2 kolom (ikon + judul); tekan = masuk / keluar (aria-pressed). */}
      <ul className="hp-pesan-bagian-daftar">
        {konfig.benda.map((b) => {
          const masuk = di.includes(b.id);
          return (
            <li key={b.id}>
              <button type="button" className={'hp-pesan-bagian' + (masuk ? ' masuk' : '')} aria-pressed={masuk} data-bagian={b.id} onClick={() => alih(b.id)}>
                <span className="hp-pesan-bagian-teks"><b>{tx(b.nama!)}</b><span>{tx(b.keterangan!)}</span></span>
                <span className="hp-pesan-bagian-aksi" aria-hidden="true">{masuk ? '✓' : '+'}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <TombolKirim label={labelKirim} siap={di.length > 0} onKirim={onKirim} alasanBelum={di.length ? null : t('ceritaHp.belumBagianPesan')} />
    </div>
  );
}
