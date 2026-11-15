/**
 * PAPAN LOKASI (K04 penugasan, K05 penerusan foto) — adaptasi prototipe Claude Design (14 Nov 2026).
 * Papan ILUSTRATIF (bukan peta: tanpa jarak, waktu tempuh, atau posisi nyata) berisi semua tujuan sebagai tempat bergambar.
 *  - Ketuk tempat = MELIHAT keterangannya (belum memilih).
 *  - "Pilih tujuan ini" = MEMILIH: token (Mas Rudi / bundel foto) muncul di tempat itu; jawaban arena sama dengan pola tujuan
 *    lama (tetapkan(langkah, benda, tujuan)), jadi mesin, penilaian, draf, dan simpanan tidak berubah.
 *  - Kirim tetap lewat TombolKirim di ArenaTujuan.
 * Posisi tempat = tata letak tetap per indeks (bukan geografi).
 */
import { useId, useState, type ReactNode } from 'react';
import { playSfx } from '../../../audio/audio';
import { t } from '../../../i18n';
import type { Episode, KunciTeks, TujuanArena } from '../../tipe';
import { GambarSeni } from '../bagianHp';

/** Posisi tempat (persen lebar/tinggi papan) per jumlah tujuan; urutan = urutan naskah. */
const TATA: Record<number, Array<[number, number]>> = {
  5: [[22, 25], [22, 76], [50, 51], [78, 25], [78, 76]],
  4: [[25, 25], [25, 72], [75, 25], [75, 72]],
  3: [[22, 30], [50, 66], [78, 30]],
};

export function bisaPapan(jumlah: number): boolean {
  return !!TATA[jumlah];
}

export function PapanTujuan({ ep, tujuan, dipilih, token, tx, idTanya, onPilih }: {
  ep: Episode;
  tujuan: TujuanArena[];
  dipilih: string | null;
  token: ReactNode;
  tx: (k: KunciTeks) => string;
  idTanya: string;
  onPilih: (id: string) => void;
}) {
  const [lihat, setLihat] = useState<string | null>(dipilih);
  const idDetail = useId();
  const pos = TATA[tujuan.length]!;
  const dilihat = tujuan.find((x) => x.id === lihat) ?? null;
  return (
    <div className="hp-papan-lok-wadah">
      <div className="hp-papan-lok" role="group" aria-labelledby={idTanya}>
        <svg className="hp-papan-lok-jalan" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M22 25 C38 34 42 44 50 51 C58 56 62 34 78 25 M50 51 C46 62 34 68 22 76 M50 51 C58 64 66 68 78 76" />
        </svg>
        {tujuan.map((x, i) => {
          const [kiri, atas] = pos[i]!;
          const pilih = x.id === dipilih;
          const lht = x.id === lihat;
          return (
            <button
              key={x.id}
              type="button"
              className={'hp-tempat' + (pilih ? ' terpilih' : '') + (lht ? ' dilihat' : '')}
              style={{ left: `${kiri}%`, top: `${atas}%` }}
              aria-pressed={lht}
              aria-controls={idDetail}
              aria-label={`${tx(x.label)}${pilih ? `, ${t('ceritaHp.tujuanTerpilih')}` : ''}`}
              data-tujuan={x.id}
              onClick={() => setLihat(x.id)}
            >
              <span className="hp-tempat-gambar">
                <GambarSeni ep={ep} id={x.seni} className="hp-tempat-seni" />
                {pilih ? <span className="hp-tempat-centang" aria-hidden="true">✓</span> : null}
              </span>
              <span className="hp-tempat-nama">{tx(x.label)}</span>
              {pilih ? <span className="hp-tempat-token" aria-hidden="true">{token}</span> : null}
            </button>
          );
        })}
        <span className="hp-papan-lok-label">{t('ceritaHp.papanIlustrasi')}</span>
      </div>
      <div id={idDetail} className={'hp-tempat-detail' + (dilihat && dilihat.id === dipilih ? ' terpilih' : '')} aria-live="polite">
        {dilihat ? (
          <>
            <p className="hp-tempat-detail-kepala"><b>{tx(dilihat.label)}</b><span>{dilihat.id === dipilih ? t('ceritaHp.tujuanTerpilih') : t('ceritaHp.sedangDilihat')}</span></p>
            {dilihat.arti ? <p className="hp-tempat-detail-arti">{tx(dilihat.arti)}</p> : null}
            {dilihat.id === dipilih ? null : (
              <button type="button" className="hp-tempat-pilih" data-pilih-tujuan="" onClick={() => { playSfx('konfirmasi'); onPilih(dilihat.id); }}>
                {t('ceritaHp.pilihTujuanIni')}
              </button>
            )}
          </>
        ) : <p className="hp-tempat-detail-arti">{t('ceritaHp.lihatTempat')}</p>}
      </div>
    </div>
  );
}
