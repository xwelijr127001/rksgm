/**
 * Pembantu MURNI ringkasan keputusan bernomor (`Episode.titik`): pilihan pemain per titik & deret status nasabah.
 * Dipakai RingkasanKeputusan (layar akhir) dan tes; tanpa React.
 */
import type { Episode, StateCerita } from '../tipe';

/** Alternatif yang dipilih di titik `id` (dari tanda `kep:<id>:<alt>`), atau null. */
export function pilihanTitik(s: Pick<StateCerita, 'tanda'>, id: string): string | null {
  const awalan = `kep:${id}:`;
  const t = s.tanda.find((x) => x.startsWith(awalan));
  return t ? t.slice(awalan.length) : null;
}

/** Deret status nasabah: nilai awal lalu nilai sesudah setiap efek beralasan (riwayat `alasan.nilai`). */
export function deretStatus(ep: Pick<Episode, 'kepercayaanAwal'>, s: Pick<StateCerita, 'riwayat'>): number[] {
  const deret = [ep.kepercayaanAwal];
  for (const e of s.riwayat) if (e.jenis === 'alasan' && typeof e.nilai === 'number') deret.push(e.nilai);
  return deret;
}
