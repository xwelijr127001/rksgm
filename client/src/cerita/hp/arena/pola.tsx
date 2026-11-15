/**
 * Kontrak & potongan bersama pola arena: props yang sama untuk semua pola, ubin tujuan yang bisa disentuh (gambar +
 * nama + arti; ditandai dengan bingkai DAN kata "Dipilih", bukan warna saja), dan pengumuman untuk pembaca layar.
 */
import type { KeyboardEvent, ReactNode } from 'react';
import type { MissionAnswer, MissionPublic } from '@shared/types';
import { t } from '../../../i18n';
import type { Baris, Episode, KunciTeks, TujuanArena } from '../../tipe';
import { GambarSeni } from '../bagianHp';

export interface PropsPola {
  ep: Episode;
  misi: MissionPublic;
  jawaban: MissionAnswer;
  ubah: (j: MissionAnswer) => void;
  /** Tampilan daftar (teks sederhana) alih-alih gambar. */
  daftar: boolean;
  tx: (k: KunciTeks, param?: Record<string, string | number>) => string;
  labelKirim: string;
  onKirim: () => void;
  namaPemain: string;
  /** Kalimat pemberi tugas yang ditampilkan pola sendiri (tokoh yang sama dengan benda), bukan di konteks arena. */
  kutipan?: Baris | null;
  /** (pola susun) Benda yang sedang aktif berganti: id benda, atau null (jeda / ringkasan). */
  onAktif?: (id: string | null) => void;
  /** Kunci kunjungan aktivitas (simpan.kunjunganAktivitas): pola bertahap menyimpan langkah yang sedang dibuka per kunjungan. */
  kunjungan?: string;
}

/**
 * Ubin pilihan (role radio di dalam radiogroup pemanggil): gambar (tampilan gambar saja), nama, arti. Terpilih = bingkai
 * tebal + kata "Dipilih". `gaya` = tata letak ubin ('baris' memanjang, 'kotak' di kisi).
 */
export function Ubin({ ep, tujuan, tx, terpilih, daftar, gaya = 'baris', onPilih, tambahan, data }: {
  ep: Episode;
  tujuan: TujuanArena;
  tx: (k: KunciTeks) => string;
  terpilih: boolean;
  daftar: boolean;
  gaya?: 'baris' | 'kotak';
  onPilih: () => void;
  tambahan?: ReactNode;
  data?: Record<string, string>;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={terpilih}
      className={`hp-ubin hp-ubin-${gaya}` + (terpilih ? ' terpilih' : '')}
      onClick={onPilih}
      {...Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v]))}
    >
      {!daftar && tujuan.seni ? <GambarSeni ep={ep} id={tujuan.seni} className="hp-ubin-seni" /> : null}
      <span className="hp-ubin-teks">
        <b>{tx(tujuan.label)}</b>
        {tujuan.arti ? <span>{tx(tujuan.arti)}</span> : null}
      </span>
      {terpilih ? <span className="hp-ubin-tanda">{t('ceritaHp.dipilih')}</span> : null}
      {tambahan}
    </button>
  );
}

/** Panah di radiogroup ubin: pindah fokus antar-ubin (pilihan baru terjadi saat ditekan, bukan saat fokus). */
export function panahUbin(e: KeyboardEvent<HTMLElement>): void {
  const maju = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
  if (!maju) return;
  const semua = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const i = semua.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  semua[(i + maju + semua.length) % semua.length]?.focus();
}
