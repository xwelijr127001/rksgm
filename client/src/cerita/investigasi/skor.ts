/**
 * T-076 EPISODE 1 INVESTIGATOR: SKOR satu kasus (fungsi murni, kontrak rencana "Interfaces"). 100 poin:
 *   Bukti (KEBERATAN) 40: percobaan pertama 40, kedua 25, dipandu 10
 *   Putusan           30: layak dijamin 30, butuh bukti tambahan 15, masalah pertanggungan 0
 *   Penanganan        30: pesan jelas + hormat + langkah berikutnya 30, benar tetapi dingin 15, menjanjikan tanggal 0
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
const POIN_PUTUSAN: Record<Putusan, SkorKasus['putusan']> = { layak: 30, tambahan: 15, polis: 0 };
const POIN_PESAN: Record<Pesan, SkorKasus['penanganan']> = { baik: 30, datar: 15, janji: 0 };

export const poinKeberatan = (h: HasilKeberatan): SkorKasus['bukti'] => POIN_BUKTI[h];
export const poinPutusan = (p: Putusan): SkorKasus['putusan'] => POIN_PUTUSAN[p];
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

export function skorKasus(h: { keberatan: HasilKeberatan; putusan: Putusan; pesan: Pesan }): SkorKasus {
  const bukti = POIN_BUKTI[h.keberatan];
  const putusan = POIN_PUTUSAN[h.putusan];
  const penanganan = POIN_PESAN[h.pesan];
  const total = bukti + putusan + penanganan;
  return { bukti, putusan, penanganan, total, nilai: nilaiDari(total) };
}
