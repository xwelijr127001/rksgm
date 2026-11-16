/**
 * POLA PESAN (K15 komunikasi): menyusun pesan WhatsApp. DRAF (bukan gelembung terkirim) berisi kalimat bagian yang dimasukkan
 * (urutan tetap); di bawahnya bagian-bagian yang bisa dimasukkan (tombol tekan-tahan aria-pressed). Ketuk bagian =
 * masuk ke pesan; ketuk lagi (atau ketuk kalimatnya di gelembung) = keluar. Yang tidak dimasukkan dikirim sebagai
 * "tidak dimasukkan" (logika.jawabanKirim). Pesan kosong tidak bisa dikirim.
 */
import { useRef } from 'react';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import { TombolKirim } from '../bagianHp';
import { alihBagian, bagianDiPesan, type ArenaPesan } from './logika';
import type { PropsPola } from './pola';

export function ArenaPolaPesan({ konfig, jawaban, ubah, tx, labelKirim, onKirim }: PropsPola & { konfig: ArenaPesan }) {
  const di = bagianDiPesan(konfig, jawaban);
  const alih = (id: string) => ubah(alihBagian(konfig, jawaban, id));
  const drafRef = useRef<HTMLElement>(null);
  return (
    <div className="hp-pesan-susun">
      <KeSlot ke={SlotKepalaArena}><h3 className="hp-tanya-arena">{tx(konfig.tanya)}</h3></KeSlot>
      {/* Pratinjau ada tepat di atas Kirim (tidak lengket agar tidak menutupi isi); tautan ini membawa ke sana kapan saja. */}
      <p className="hp-ke-pratinjau"><button type="button" className="hp-tautan" data-ke-pratinjau="" onClick={() => { drafRef.current?.scrollIntoView({ block: 'center' }); drafRef.current?.focus({ preventScroll: true }); }}>{t('ceritaHp.drafPesan')} ({di.length}) ↓</button></p>
      <p className="hp-draf-judul">{t('ceritaHp.bagianPesan')}</p>
      <ul className="hp-pesan-bagian-daftar">
        {konfig.benda.map((b) => {
          const masuk = di.includes(b.id);
          return (
            <li key={b.id}>
              <button type="button" className={'hp-pesan-bagian' + (masuk ? ' masuk' : '')} aria-pressed={masuk} data-bagian={b.id} onClick={() => alih(b.id)}>
                <span className="hp-pesan-bagian-teks"><b>{tx(b.nama!)}</b><span>{tx(b.keterangan!)}</span></span>
                <span className="hp-pesan-bagian-aksi">{masuk ? `✓ ${t('ceritaHp.diPesan')}` : `+ ${t('ceritaHp.masukkan')}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <section ref={drafRef} id="hp-draf-pesan" tabIndex={-1} className="hp-draf" aria-label={t('ceritaHp.drafPesan')}>
        <p className="hp-draf-judul">{t('ceritaHp.drafPesan')}</p>
        {di.length ? (
          <div className="hp-gelembung hp-draf-gelembung" aria-live="polite">
            {di.map((id) => {
              const b = konfig.benda.find((x) => x.id === id)!;
              return (
                <button key={id} type="button" className="hp-draf-kalimat" data-bagian={id} onClick={() => alih(id)} aria-label={`${t('ceritaHp.keluarkan')}: ${tx(b.keterangan!)}`}>
                  {tx(b.keterangan!)}
                </button>
              );
            })}
          </div>
        ) : <p className="hp-draf-kosong" aria-live="polite">{t('ceritaHp.pesanKosong')}</p>}
      </section>
      <TombolKirim label={labelKirim} siap={di.length > 0} onKirim={onKirim} alasanBelum={di.length ? null : t('ceritaHp.belumBagianPesan')} catatan={t('ceritaHp.drafBelumTerkirim')} />
    </div>
  );
}
