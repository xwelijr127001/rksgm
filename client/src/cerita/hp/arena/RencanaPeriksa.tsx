/**
 * K07 RENCANA PEMERIKSAAN (pola tujuan gaya 'rencana', tampilan gambar) — T-020 batch 2: papan gabus piksel (D-147, D-157).
 * Seni: seni/aktivitas/papan/ (bingkai, gabus, pelat kolom, kartu kerja, nota, slot, kartu periksa, pin, chip, ikon), semuanya
 * bingkai sembilan-iris lewat CSS border-image (piksel.css); tidak ada kata di dalam gambar.
 * Susunan: (1) strip: kaca pembesar + instruksi, atau pilihan aktif + artinya; (2) papan: kolom Sekarang / Sesudah hitungan,
 * kartu kerja bengkel yang sedang berjalan + nota catatan kasus, dua slot putus-putus (ketuk = kartu pemeriksaan ditempel);
 * (3) tiga jawaban di luar papan sebagai chip berikon. Kelima jawaban naskah terlihat sekaligus; tidak ada yang dipilih lebih
 * dulu. Jawaban = tetapkan(langkah, benda, tujuan) seperti sebelumnya (satu radiogroup, panah = pindah fokus).
 */
import type { KeyboardEvent } from 'react';
import '../../seni/aktivitas/piksel.css';
import { t } from '../../../i18n';
import type { Episode, KunciTeks, TujuanArena } from '../../tipe';
import type { ArenaTujuan } from './logika';
import { panahUbin } from './pola';

/** Slot papan menurut kolomnya: kolom 1 = mulai sekarang (bersamaan dengan bengkel), kolom 2 = sesudah hitungan selesai. */
const PAPAN = ['paralel', 'setelah'];

export function RencanaPeriksa({ ep, konfig, dipilih, tx, idTanya, instruksi, onPilih }: {
  ep: Episode;
  konfig: ArenaTujuan;
  dipilih: string | null;
  tx: (k: KunciTeks) => string;
  idTanya: string;
  /** Kalimat perintah tugas (misi.instruction), tampil di strip sebelum ada pilihan. */
  instruksi?: string;
  onPilih: (id: string) => void;
}) {
  const slot = PAPAN.map((id) => konfig.tujuan.find((x) => x.id === id)).filter((x): x is TujuanArena => !!x);
  const luar = konfig.tujuan.filter((x) => !PAPAN.includes(x.id));
  const pil = konfig.tujuan.find((x) => x.id === dipilih) ?? null;
  const benda = tx(konfig.benda.nama ?? konfig.benda.id);
  const urut = [...slot, ...luar];
  const tab = (x: TujuanArena) => (x.id === dipilih || (!dipilih && urut[0]?.id === x.id) ? 0 : -1);
  return (
    <div className="hp-rpk hp-rpk-px" data-dipilih={dipilih ?? undefined}>
      <div className="rp-strip" role="status" data-strip={pil ? 'pilihan' : 'instruksi'}>
        {pil ? (
          <>
            <b className="rp-strip-nama">{tx(pil.label)}</b>
            <span className="rp-strip-benda">{benda}</span>
            {pil.arti ? <span className="rp-strip-arti">{tx(pil.arti)}</span> : null}
          </>
        ) : (
          <>
            <span className="rp-token" aria-hidden="true"><span className="px px-kaca" /></span>
            <p className="rp-strip-instruksi">{instruksi ?? benda}</p>
          </>
        )}
      </div>

      <div className="rp-grup" role="radiogroup" aria-labelledby={idTanya} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => panahUbin(e)}>
        <div className="rp-papan px-gabus" data-papan-rencana="">
          <span className="px-plat" data-kolom="1">{t('ceritaHp.kolomSekarang')}</span>
          <span className="px-plat" data-kolom="2">{t('ceritaHp.kolomSesudah')}</span>
          <div className="rp-kerja">
            <span className="rp-kerja-kicker">{tx('arena.jalur.barisBengkel')}</span>
            <b>{tx('arena.jalur.hitung')}</b>
            <span className="rp-kerja-status"><span className="px px-jam" aria-hidden="true" />{t('ceritaHp.sedangBerjalan')}</span>
          </div>
          {konfig.catatan ? <p className="rp-nota">{tx(konfig.catatan)}</p> : <span />}
          {slot.map((x) => {
            const on = x.id === dipilih;
            return (
              <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={tab(x)} className="rp-slot" data-tujuan={x.id} onClick={() => onPilih(x.id)}>
                {on ? (
                  <>
                    <span className="px px-pin rp-pin" aria-hidden="true" />
                    <span className="px px-kaca-kecil" aria-hidden="true" />
                    <span className="rp-slot-teks"><b>{benda}</b><span>{tx(x.label)}</span></span>
                  </>
                ) : (
                  <>
                    <span className="px px-plus" aria-hidden="true" />
                    <span className="rp-slot-teks"><b>{tx(x.label)}</b></span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {luar.length ? (
          <>
            <p className="rp-lain">{tx('arena.jalur.lainnya')}</p>
            <div className="rp-chip-baris">
              {luar.map((x) => {
                const on = x.id === dipilih;
                const kelas = x.seni ? ep.seniArena?.[x.seni]?.piksel : undefined;
                return (
                  <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={tab(x)} className="rp-chip" data-tujuan={x.id} onClick={() => onPilih(x.id)}>
                    {kelas ? <span className={'px ' + kelas} aria-hidden="true" /> : null}
                    <span>{tx(x.label)}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
