/**
 * Pemilih bagian (v2, docs/rancangan-mode-cerita.md 11.1): dialog "Coba jalur lain" dari kartu akhir atau dari
 * "Lihat perjalananku". Satu tombol per bab yang bisa diulang di perjalanan ini (babBisaDiulang: titik bab yang
 * tersimpan), kalimat akibat yang jujur, dan di kaki "Ulang dari awal sebagai perjalanan baru" (membuka
 * konfirmasi ulang episode yang ada: arsip + akhir yang ditemukan tetap tercatat).
 * Membuka/menutup dialog ini tidak mengubah state cerita; hanya tombol bab (ulangBab) yang mengubahnya.
 */
import { useId, useRef, type MouseEvent } from 'react';
import { t } from '../../i18n';
import { Modal } from '../../ui/kit';
import { babBisaDiulang } from '../mesin';
import type { Episode, IdBab, KunciTeks, StateCerita } from '../tipe';
import { nomorBab } from './tampilan';

/** Jeda setelah dialog terbuka sebelum ketukan pada tombol bab diterima (sama dengan penjaga dialog dokumen MissionPlay). */
const JEDA_BUKA_MS = 500;

export function PemilihBagian({ ep, state, tx, disarankan, onPilih, onUlangBaru, onTutup }: {
  ep: Episode;
  state: StateCerita;
  tx: (k: KunciTeks) => string;
  /** Bab titik ulang kartu akhir (akhir yang belum baik) untuk ditandai "Disarankan"; null = tanpa tanda. */
  disarankan: IdBab | null;
  onPilih: (bab: IdBab) => void;
  /** Buka konfirmasi "Ulang episode dari awal?" (ditumpuk di atas dialog ini). */
  onUlangBaru: () => void;
  onTutup: () => void;
}) {
  const idKet = useId();
  const daftar = babBisaDiulang(ep, state);
  // Klik ganda pada "Coba jalur lain" membuka dialog ini di bawah jari yang sama: klik kedua jangan langsung mengulang
  // bab. Aktivasi pointer (detail > 0) dalam JEDA_BUKA_MS sejak dibuka diabaikan; keyboard (detail 0) selalu diterima.
  const dibuka = useRef(performance.now());
  const pilih = (e: MouseEvent, bab: IdBab) => {
    if (e.detail > 0 && performance.now() - dibuka.current < JEDA_BUKA_MS) return;
    onPilih(bab);
  };
  return (
    <Modal
      judul={t('ceritaAkhir.pemilihJudul')}
      onTutup={onTutup}
      lebar={480}
      aksi={<button type="button" className="btn btn-netral" onClick={onTutup}>{t('ceritaAkhir.tutup')}</button>}
    >
      <p id={idKet} className="akh-pemilih-ket">{t('ceritaAkhir.pemilihKet')}</p>
      {daftar.length ? (
        <ul className="akh-pemilih-daftar">
          {daftar.map((bab) => {
            const b = ep.bab.find((x) => x.id === bab);
            return (
              <li key={bab}>
                <button type="button" className="akh-pemilih-bab" data-bab={bab} aria-describedby={idKet} onClick={(e) => pilih(e, bab)}>
                  {bab === disarankan ? <span className="akh-tag">{t('ceritaAkhir.disarankan')}</span> : null}
                  <b>{t('ceritaAkhir.bagianN', { n: nomorBab(ep, bab), judul: b ? tx(b.judul) : bab })}</b>
                  {b ? <small>{tx(b.tujuan)}</small> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {/* Kaki pemilih: jalan keluar yang lebih besar (perjalanan baru), dipisah dari daftar bab. */}
      <div className="akh-pemilih-kaki">
        <button type="button" className="akh-ulang-baru" aria-haspopup="dialog" onClick={onUlangBaru}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M7 9.5a6 6 0 1 1-.8 6M7 4.5v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{t('ceritaAkhir.ulangBaru')}</span>
        </button>
      </div>
    </Modal>
  );
}
