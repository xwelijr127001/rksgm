/**
 * PAPAN RENCANA WAWANCARA (K09, pola susun gaya 'papan', tampilan gambar) — T-020 batch 2: papan gabus piksel (D-148, D-158).
 * Seni: seni/aktivitas/papan/ (gabus, bingkai, slot, pin, pelat) + saksi/ (bingkai kartu, lencana "–", tombol aksi, mobil kecil).
 *  - papan "Rencana wawancara" dengan lima slot; kartu yang diwawancarai ditempel (pin) di slot berikutnya;
 *  - lima kartu orang dalam satu baris (potret piksel 44 px + nama): biasa / dipilih (terangkat) / bayangan (sudah di papan) /
 *    "Tidak perlu" (abu-abu + lencana "–" = tombol batalkan tanda);
 *  - strip aksi: nama dan peran kartu yang dipilih + dua tombol wadah naskah dengan artinya; ketuk wadah yang sama = batal.
 *    Sesudah ditandai, kartu berikutnya yang belum ditandai langsung terpilih (strip tidak hilang, tata letak tidak melompat).
 * Jawaban arena sama dengan pola susun (tetapkan / lepaskan pada langkah yang sama); kirim setelah semua ditandai.
 */
import { useId, useState } from 'react';
import '../../seni/aktivitas/piksel.css';
import { t } from '../../../i18n';
import { KeSlot, SlotKepalaArena } from '../cangkang';
import type { BendaArena } from '../../tipe';
import { PotretHp, TombolKirim } from '../bagianHp';
import { lepaskan } from './dasar';
import { petaLangkah, sisaArena, tetapkan, type ArenaSusun } from './logika';
import type { PropsPola } from './pola';

export function PapanSaksi({ ep, konfig, jawaban, ubah, tx, labelKirim, onKirim, petunjuk }: Pick<PropsPola, 'ep' | 'jawaban' | 'ubah' | 'tx' | 'labelKirim' | 'onKirim'> & { konfig: ArenaSusun; /** Satu baris instruksi (petunjuk langkah misi). */ petunjuk?: string }) {
  const peta = petaLangkah(jawaban, konfig.langkah);
  const rencana = konfig.wadah[0]!;
  const [lihat, setLihat] = useState<string | null>(() => konfig.benda.find((b) => !peta[b.id])?.id ?? null);
  const idAksi = useId();
  const sisa = sisaArena(konfig, jawaban);
  const nama = (b: BendaArena) => tx(b.nama ?? b.id);
  const gambar = (b: BendaArena) => (b.tokoh
    ? <PotretHp ep={ep} id={b.tokoh.id} ekspresi={b.tokoh.ekspresi} nama={nama(b)} />
    : <span className="sk-mobil" aria-hidden="true"><span className={'px ' + (ep.seniArena?.[b.seni ?? '']?.piksel ?? '')} /><span className="px px-tanya" /></span>);
  const dipilih = konfig.benda.filter((b) => peta[b.id] === rencana.id);
  const b = lihat ? konfig.benda.find((x) => x.id === lihat) ?? null : null;
  const tandai = (id: string, wadah: string) => {
    const batal = peta[id] === wadah;
    ubah(batal ? lepaskan(jawaban, konfig.langkah, id) : tetapkan(jawaban, konfig.langkah, id, wadah));
    if (batal) return;
    const i = konfig.benda.findIndex((x) => x.id === id);
    const berikut = [...konfig.benda.slice(i + 1), ...konfig.benda.slice(0, i)].find((x) => !peta[x.id]);
    if (berikut) setLihat(berikut.id);
  };
  const lepas = (id: string) => { ubah(lepaskan(jawaban, konfig.langkah, id)); setLihat(id); };

  return (
    <div className="hp-saksi hp-saksi-px">
      <KeSlot ke={SlotKepalaArena}>
        <h3 className="hp-tanya-arena">{tx(konfig.tanya)}</h3>
        {petunjuk ? <p className="hp-instruksi-arena">{petunjuk}</p> : null}
      </KeSlot>

      <section className="hp-saksi-papan sk-papan px-gabus" aria-label={t('ceritaHp.rencanaWawancara')}>
        <p className="sk-kepala"><b className="px-plat">{t('ceritaHp.rencanaWawancara')}</b><span className="sk-hitung" data-jumlah-rencana="">{dipilih.length}</span></p>
        <ul className="sk-slot-baris">
          {konfig.benda.map((_, i) => {
            const x = dipilih[i];
            return (
              <li key={i} className="sk-slot" data-slot={i}>
                {x ? (
                  <button type="button" className="sk-tempel" data-rencana={x.id} aria-controls={idAksi} onClick={() => setLihat(x.id)}>
                    <span className="px px-pin sk-pin" aria-hidden="true" />
                    {gambar(x)}
                    <b>{nama(x)}</b>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="hp-saksi-kontak sk-baris">
        {konfig.benda.map((x) => {
          const w = peta[x.id];
          const lain = !!w && w !== rencana.id;
          return (
            <li key={x.id}>
              <button
                type="button"
                className={'hp-saksi-kartu' + (x.id === lihat ? ' dilihat' : '') + (w ? ` ditandai-${lain ? 'lain' : 'rencana'}` : '')}
                aria-pressed={x.id === lihat}
                aria-controls={idAksi}
                data-orang={x.id}
                data-benda={x.id}
                onClick={() => setLihat(x.id)}
              >
                {gambar(x)}
                <b>{nama(x)}</b>
                <span className="sk-status">{w ? (lain ? tx(konfig.wadah.find((y) => y.id === w)?.label ?? w) : t('ceritaHp.statusRencana')) : t('ceritaHp.belumDitandai')}</span>
              </button>
              {lain ? <button type="button" className="px sk-lepas" data-lepas={x.id} aria-label={`${t('ceritaHp.batalkan')}: ${nama(x)}`} onClick={() => lepas(x.id)} /> : null}
            </li>
          );
        })}
      </ul>

      <div id={idAksi} className="hp-saksi-detail sk-aksi" aria-live="polite">
        {b ? (
          <>
            <p className="sk-aksi-kepala"><b>{nama(b)}</b>{b.keterangan ? <span> · {tx(b.keterangan)}</span> : null}</p>
            <div className="hp-saksi-wadah" role="group" aria-label={tx(konfig.tanya)}>
              {konfig.wadah.map((w, i) => {
                const on = peta[b.id] === w.id;
                return (
                  <button key={w.id} type="button" className="hp-saksi-wadah-item sk-tombol" aria-pressed={on} data-wadah={w.id} onClick={() => tandai(b.id, w.id)}>
                    <span className={'px ' + (i === 0 ? 'px-ikon-pin' : 'px-ikon-strip')} aria-hidden="true" />
                    <b>{tx(w.label)}</b>
                    {w.arti ? <span>{tx(w.arti)}</span> : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : <p className="sk-aksi-kepala">{petunjuk ?? ''}</p>}
      </div>

      <TombolKirim
        label={labelKirim}
        siap={sisa === 0}
        onKirim={onKirim}
        alasanBelum={sisa ? t('ceritaHp.belumSemuaKontak', { daftar: konfig.benda.filter((x) => !peta[x.id]).map(nama).join(tx('daftar.pemisah')) }) : null}
        alasanRingkas={sisa ? t('ceritaHp.belumKontakRingkas', { n: sisa }) : null}
        catatan={t('ceritaHp.pilihanBisaDiubah')}
      />
    </div>
  );
}
