/**
 * PAPAN RENCANA WAWANCARA (K09, pola susun gaya 'papan', tampilan gambar) — komposisi prototipe Claude Design (14 Nov 2026):
 *  - papan hijau "Rencana wawancara" berisi orang yang dipilih (potret + nama + "Belum diwawancarai"): masuk rencana bukan
 *    berarti sudah diwawancarai;
 *  - kartu kontak (potret, nama, peran, status) — ketuk = membuka detail;
 *  - detail: keterangan + dua wadah naskah (mis. Wawancarai / Tidak perlu) dengan artinya; ketuk wadah yang sama = batal.
 * Jawaban arena sama dengan pola susun lama (tetapkan / lepaskan pada langkah yang sama); kirim setelah semua ditandai.
 */
import { useId, useState } from 'react';
import { t } from '../../../i18n';
import type { BendaArena } from '../../tipe';
import { GambarSeni, PotretHp, TombolKirim } from '../bagianHp';
import { lepaskan } from './dasar';
import { petaLangkah, sisaArena, tetapkan, type ArenaSusun } from './logika';
import type { PropsPola } from './pola';

export function PapanSaksi({ ep, konfig, jawaban, ubah, tx, labelKirim, onKirim }: Pick<PropsPola, 'ep' | 'jawaban' | 'ubah' | 'tx' | 'labelKirim' | 'onKirim'> & { konfig: ArenaSusun }) {
  const peta = petaLangkah(jawaban, konfig.langkah);
  const rencana = konfig.wadah[0]!;
  const [lihat, setLihat] = useState<string | null>(() => konfig.benda.find((b) => !peta[b.id])?.id ?? null);
  const idDetail = useId();
  const sisa = sisaArena(konfig, jawaban);
  const nama = (b: BendaArena) => tx(b.nama ?? b.id);
  const wadahNama = (id: string) => tx(konfig.wadah.find((w) => w.id === id)?.label ?? id);
  const gambar = (b: BendaArena, kali: 1 | 2 = 1) => (b.tokoh
    ? <PotretHp ep={ep} id={b.tokoh.id} ekspresi={b.tokoh.ekspresi} kali={kali} nama={nama(b)} />
    : <GambarSeni ep={ep} id={b.seni} className="hp-saksi-seni" />);
  const dipilih = konfig.benda.filter((b) => peta[b.id] === rencana.id);
  const b = lihat ? konfig.benda.find((x) => x.id === lihat) ?? null : null;
  const tandai = (id: string, wadah: string) => {
    const baru = peta[id] === wadah ? lepaskan(jawaban, konfig.langkah, id) : tetapkan(jawaban, konfig.langkah, id, wadah);
    ubah(baru);
  };

  return (
    <div className="hp-saksi">
      <section className="hp-saksi-papan" aria-label={t('ceritaHp.rencanaWawancara')}>
        <p className="hp-saksi-papan-kepala"><b>{t('ceritaHp.rencanaWawancara')}</b><span>{dipilih.length}</span></p>
        {dipilih.length ? (
          <ul className="hp-saksi-rencana">
            {dipilih.map((x) => (
              <li key={x.id}>
                <button type="button" className="hp-saksi-rencana-kartu" data-rencana={x.id} onClick={() => setLihat(x.id)}>
                  {gambar(x)}
                  <b>{nama(x)}</b>
                  <span><span aria-hidden="true">◷ </span>{t('ceritaHp.belumWawancara')}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="hp-saksi-kosong">{t('ceritaHp.rencanaKosong')}</p>}
        <p className="hp-saksi-arti">{t('ceritaHp.rencanaArti')}</p>
      </section>

      <h3 className="hp-tanya-arena">{t('ceritaHp.kontakLihat')}</h3>
      <ul className="hp-saksi-kontak">
        {konfig.benda.map((x) => {
          const w = peta[x.id];
          return (
            <li key={x.id}>
              <button
                type="button"
                className={'hp-saksi-kartu' + (x.id === lihat ? ' dilihat' : '') + (w ? ` ditandai-${w === rencana.id ? 'rencana' : 'lain'}` : '')}
                aria-pressed={x.id === lihat}
                aria-controls={idDetail}
                data-orang={x.id}
                data-benda={x.id}
                onClick={() => setLihat(x.id)}
              >
                {gambar(x)}
                <span className="hp-saksi-kartu-teks">
                  <b>{nama(x)}</b>
                  <span>{w ? (w === rencana.id ? t('ceritaHp.statusRencana') : wadahNama(w)) : t('ceritaHp.belumDitandai')}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div id={idDetail} className="hp-saksi-detail" aria-live="polite">
        {b ? (
          <>
            <p className="hp-tempat-detail-kepala"><b>{nama(b)}</b><span>{t('ceritaHp.sedangDilihat')}</span></p>
            {b.keterangan ? <p className="hp-tempat-detail-arti">{tx(b.keterangan)}</p> : null}
            <div className="hp-saksi-wadah" role="group" aria-label={tx(konfig.tanya)}>
              {konfig.wadah.map((w) => {
                const on = peta[b.id] === w.id;
                return (
                  <button key={w.id} type="button" className={'hp-saksi-wadah-item' + (on ? ' terpilih' : '')} aria-pressed={on} data-wadah={w.id} onClick={() => tandai(b.id, w.id)}>
                    <b>{on ? '✓ ' : ''}{tx(w.label)}</b>
                    {w.arti ? <span>{tx(w.arti)}</span> : null}
                  </button>
                );
              })}
            </div>
            {peta[b.id] ? <p className="hp-saksi-batal">{t('ceritaHp.ketukLagiBatal')}</p> : null}
          </>
        ) : null}
      </div>

      <TombolKirim
        label={labelKirim}
        siap={sisa === 0}
        onKirim={onKirim}
        alasanBelum={sisa ? t('ceritaHp.belumSemuaKontak', { daftar: konfig.benda.filter((x) => !peta[x.id]).map(nama).join(', ') }) : null}
        catatan={t('ceritaHp.pilihanBisaDiubah')}
      />
    </div>
  );
}
