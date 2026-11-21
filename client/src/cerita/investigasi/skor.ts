/**
 * T-076 EPISODE 1 INVESTIGATOR: SKOR satu kasus (fungsi murni, kontrak rencana "Interfaces"). 100 poin:
 *   Bukti (KEBERATAN) 40: percobaan pertama 40, kedua 25, dipandu 10
 *   Putusan           30: menurut TABEL PUTUSAN KASUS (`Episode.investigasi.putusan`, T-090): kasus 1 layak 30 / tambahan 15 /
 *                         polis 0; kasus 2 polis 30 / tambahan 15 / layak 0
 *   Penanganan        30: pesan jelas + hormat + langkah berikutnya 30, benar tetapi dingin 15, janji tanpa dasar 0
 * Nilai: S >= 90, A >= 75, B >= 50, selain itu C. Tanpa nyawa, tanpa waktu: kekeliruan hanya mengurangi poin.
 */
import type { HasilKeberatan, Pesan, Putusan } from './status';

export type NilaiKasus = 'S' | 'A' | 'B' | 'C';

export interface SkorKasus {
  bukti: 40 | 25 | 10;
  putusan: 30 | 15 | 0;
  penanganan: 30 | 15 | 0;
  total: number;
  nilai: NilaiKasus;
}

export const SKOR_MAKS = 100;
const POIN_BUKTI: Record<HasilKeberatan, SkorKasus['bukti']> = { tepat: 40, 'tepat-kedua': 25, dipandu: 10 };
/** T-090: tabel putusan sebuah kasus (`KonfigInvestigasi.putusan`). */
export type TabelPutusan = Readonly<Record<Putusan, SkorKasus['putusan']>>;
const POIN_PESAN: Record<Pesan, SkorKasus['penanganan']> = { baik: 30, datar: 15, janji: 0 };

export const poinKeberatan = (h: HasilKeberatan): SkorKasus['bukti'] => POIN_BUKTI[h];
export const poinPutusan = (tabel: TabelPutusan, p: Putusan): SkorKasus['putusan'] => tabel[p];
/** T-090: putusan yang bernilai penuh di kasus ini (reaksi Miss Raksa di layar hasil, cabang akhir). */
export const putusanTepat = (tabel: TabelPutusan, p: Putusan): boolean => tabel[p] === 30;
export const poinPesan = (p: Pesan): SkorKasus['penanganan'] => POIN_PESAN[p];

/** T-087: tiga langkah yang dinilai, urut alur kasus, dengan poin maksimumnya. */
export type LangkahNilai = 'keberatan' | 'putusan' | 'pesan';
export const MAKS_LANGKAH: Record<LangkahNilai, number> = { keberatan: 40, putusan: 30, pesan: 30 };
export function poinLangkah(s: SkorKasus, l: LangkahNilai): number {
  return l === 'keberatan' ? s.bukti : l === 'putusan' ? s.putusan : s.penanganan;
}
/**
 * T-087 ("Coba lagi pilihan terlemahmu"): langkah dengan poin HILANG terbanyak; seri = yang lebih awal di alur kasus.
 * null = skor sempurna (tidak ada yang perlu dilatih).
 */
export function langkahTerlemah(s: SkorKasus): LangkahNilai | null {
  let lemah: LangkahNilai | null = null;
  let hilang = 0;
  for (const l of ['keberatan', 'putusan', 'pesan'] as const) {
    const h = MAKS_LANGKAH[l] - poinLangkah(s, l);
    if (h > hilang) { hilang = h; lemah = l; }
  }
  return lemah;
}

export function nilaiDari(total: number): NilaiKasus {
  return total >= 90 ? 'S' : total >= 75 ? 'A' : total >= 50 ? 'B' : 'C';
}

export function skorKasus(h: { keberatan: HasilKeberatan; putusan: Putusan; pesan: Pesan }, tabel: TabelPutusan): SkorKasus {
  const bukti = POIN_BUKTI[h.keberatan];
  const putusan = tabel[h.putusan];
  const penanganan = POIN_PESAN[h.pesan];
  const total = bukti + putusan + penanganan;
  return { bukti, putusan, penanganan, total, nilai: nilaiDari(total) };
}
