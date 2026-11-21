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
import { PanelIcon } from './panel/seni';

export type { Bukti, Pernyataan, HasilKeberatan, Putusan } from '../status';
export type { SkorKasus } from '../skor';
export type { Pangkat } from '../simpan';
import type { Pangkat } from '../simpan';
export const DAFTAR_PANGKAT: readonly Pangkat[] = ['muda', 'investigator', 'senior', 'kepala'];
/** Jumlah kasus seri (= slot stempel di kartu petugas). T-106: tiga kasus; Kepala = tiga stempel dan total >= 255. */
export const JUMLAH_KASUS = 3;

export type Tx = (k: KunciTeks) => string;
const KonteksTeks = createContext<Tx | null>(null);
/** Pasang sekali di atas komponen Investigator: <PenyediaTeksInvestigasi value={tx}>. */
export const PenyediaTeksInvestigasi = KonteksTeks.Provider;
export function useTx(tx?: Tx): Tx {
  const dariKonteks = useContext(KonteksTeks);
  return tx ?? dariKonteks ?? ((k) => t(k));
}

/**
 * Sel atlas ikon 16 x 16 (seni/investigasi/ikon.png, character/investigator-t077/bangun.mts). T-091 (kasus 2, sel 11-15,
 * character/investigator-t091/adegan.mts): struk perjalanan, foto interior, halaman polis, stempel kasus 2, aplikasi fiktif.
 */
const SEL_IKON = {
  rekaman: 0, foto: 1, kartu: 2, pin: 3, layak: 4, tambahan: 5, polis: 6, stempel: 7, 'stempel-kosong': 8, buku: 9, kunci: 10,
  struk: 11, 'foto-interior': 12, 'polis-dok': 13, 'stempel-2': 14, aplikasi: 15,
  // T-092 (sel 16-22, character/investigator-t092/bangun.mts): percikan benturan, penumpang, bendera selesai, MPV, lencana X, lencana centang, maskot
  benturan: 16, naik: 17, tutup: 18, mpv: 19, silang: 20, centang: 21, maskot: 22,
} as const;
const LEBAR_ATLAS_IKON = 368;
export type NamaIkon = keyof typeof SEL_IKON;
/** T-091: ikon sebuah kartu bukti. Kartu kasus 2 punya ikon sendiri per id (foto interior, halaman polis); lainnya = `bukti.ikon`. */
const IKON_PER_BUKTI: Readonly<Record<string, NamaIkon>> = { 'foto-interior': 'foto-interior', struk: 'struk', 'polis-kasus2': 'polis-dok' };
export const ikonBukti = (b: { id: string; ikon: NamaIkon }): NamaIkon => IKON_PER_BUKTI[b.id] ?? b.ikon;
/** T-091: sel stempel per id kasus (kartu petugas, layar hasil); kasus tak dikenal = stempel kasus 1. */
export const stempelKasus = (kasus: string): NamaIkon => (kasus === 'kasus-2' ? 'stempel-2' : 'stempel');
/** Ikon piksel pada kelipatan bulat (bawaan 2x = 32 px). Hiasan: selalu aria-hidden. */
export function IkonInv({ nama, kali = 2, className = '' }: { nama: NamaIkon; kali?: 1 | 2 | 3; className?: string }) {
  const gaya: CSSProperties = {
    width: 16 * kali, height: 16 * kali, backgroundImage: `url(${ikonUrl})`, backgroundSize: `${LEBAR_ATLAS_IKON * kali}px ${16 * kali}px`,
    backgroundPosition: `${-SEL_IKON[nama] * 16 * kali}px 0`,
  };
  return <i className={'iv-ikon ' + className} aria-hidden="true" style={gaya} />;
}

/**
 * T-106: ikon stempel sebuah kasus (hub, daftar kasus). Kasus 1-2 dari atlas ikon lama; kasus 3 dari atlas ikon panel Designer
 * (T-103, 'stempel-3'); `terisi` false = slot kosong.
 */
export function IkonStempel({ kasus, terisi = true, kali = 2 }: { kasus: string; terisi?: boolean; kali?: 1 | 2 | 3 }) {
  if (terisi && kasus === 'kasus-3') return <PanelIcon nama="stempel-3" kali={kali} className="iv-ikon" />;
  return <IkonInv nama={terisi ? stempelKasus(kasus) : 'stempel-kosong'} kali={kali} />;
}
