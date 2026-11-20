/**
 * T-077 (Designer): dasar bersama komponen Investigator (Episode 1 Investigator, pilot).
 *
 * TIPE: milik Task 1 (Fullstack, T-076), diimpor sebagai tipe saja dari cerita/investigasi/{status,skor,simpan}.ts (blok Interfaces
 * rencana docs/superpowers/plans/2026-11-20-episode-1-investigator.md) dan diekspor ulang di sini untuk komponen.
 *
 * TEKS: `judul` / `sumber` / `teks` adalah KunciTeks naskah episode. Props rencana tidak membawa `tx`, jadi penerjemah datang dari
 * (urutan): prop opsional `tx` komponen -> <PenyediaTeksInvestigasi value={tx}> di atasnya -> `t()` kamus aplikasi (kunci yang tidak
 * dikenal tampil apa adanya, jadi teks jadi pun aman dikirim). Teks antarmuka sendiri ada di kamus `investigasi` (i18n/kamus).
 */
import { createContext, useContext, type CSSProperties } from 'react';
import { t } from '../../../i18n';
import type { KunciTeks } from '../../tipe';
import ikonUrl from '../../seni/investigasi/ikon.png';

export type { Bukti, Pernyataan, HasilKeberatan, Putusan } from '../status';
export type { SkorKasus } from '../skor';
export type { Pangkat } from '../simpan';
import type { Pangkat } from '../simpan';
export const DAFTAR_PANGKAT: readonly Pangkat[] = ['muda', 'investigator', 'senior', 'kepala'];
/** Jumlah kasus (= slot stempel di kartu petugas): pangkat tertinggi pada 4 stempel. */
export const JUMLAH_KASUS = 4;

export type Tx = (k: KunciTeks) => string;
const KonteksTeks = createContext<Tx | null>(null);
/** Pasang sekali di atas komponen Investigator: <PenyediaTeksInvestigasi value={tx}>. */
export const PenyediaTeksInvestigasi = KonteksTeks.Provider;
export function useTx(tx?: Tx): Tx {
  const dariKonteks = useContext(KonteksTeks);
  return tx ?? dariKonteks ?? ((k) => t(k));
}

/** Sel atlas ikon 16 x 16 (seni/investigasi/ikon.png, character/investigator-t077/bangun.mts). */
const SEL_IKON = { rekaman: 0, foto: 1, kartu: 2, pin: 3, layak: 4, tambahan: 5, polis: 6, stempel: 7, 'stempel-kosong': 8, buku: 9, kunci: 10 } as const;
export type NamaIkon = keyof typeof SEL_IKON;
/** Ikon piksel pada kelipatan bulat (bawaan 2x = 32 px). Hiasan: selalu aria-hidden. */
export function IkonInv({ nama, kali = 2, className = '' }: { nama: NamaIkon; kali?: 1 | 2 | 3; className?: string }) {
  const gaya: CSSProperties = {
    width: 16 * kali, height: 16 * kali, backgroundImage: `url(${ikonUrl})`, backgroundSize: `${176 * kali}px ${16 * kali}px`,
    backgroundPosition: `${-SEL_IKON[nama] * 16 * kali}px 0`,
  };
  return <i className={'iv-ikon ' + className} aria-hidden="true" style={gaya} />;
}
