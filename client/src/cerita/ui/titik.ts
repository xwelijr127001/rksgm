/**
 * Pembantu MURNI ringkasan keputusan bernomor (`Episode.titik`): pilihan pemain per titik & deret status nasabah.
 * Dipakai RingkasanKeputusan (layar akhir: daftar desktop, strip token + lembar rincian di cangkang HP) dan tes; tanpa React.
 */
import type { Episode, KunciTeks, NilaiAlternatif, StateCerita, TitikKeputusan } from '../tipe';

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

/** Satu titik keputusan seperti yang ditampilkan ringkasan: pilihan pemain, klasifikasinya, dan saran naskah bila berbeda. */
export interface InfoTitik {
  /** Alternatif yang dipilih; null = tidak tercatat (simpanan rusak) atau bukan alternatif titik ini. */
  alt: string | null;
  /** Label alternatif yang dipilih. */
  label: KunciTeks | null;
  nilai: NilaiAlternatif | null;
  /** Label alternatif yang disarankan naskah, HANYA bila berbeda dari pilihan pemain. */
  saran: KunciTeks | null;
}

export function infoTitik(s: Pick<StateCerita, 'tanda'>, k: TitikKeputusan): InfoTitik {
  const alt = pilihanTitik(s, k.id);
  const pilihan = alt !== null && Object.prototype.hasOwnProperty.call(k.alternatif, alt) ? k.alternatif[alt]! : null;
  const saran = alt !== k.saran && Object.prototype.hasOwnProperty.call(k.alternatif, k.saran) ? k.alternatif[k.saran]! : null;
  return { alt: pilihan ? alt : null, label: pilihan?.label ?? null, nilai: pilihan?.nilai ?? null, saran: saran?.label ?? null };
}

/** Banyak keputusan per klasifikasi (legenda strip token layar akhir); titik yang tidak tercatat tidak dihitung. */
export function hitungNilai(ep: Pick<Episode, 'titik'>, s: Pick<StateCerita, 'tanda'>): Record<NilaiAlternatif, number> {
  const jumlah: Record<NilaiAlternatif, number> = { tepat: 0, kurang: 0, keliru: 0 };
  for (const k of ep.titik ?? []) {
    const n = infoTitik(s, k).nilai;
    if (n) jumlah[n]++;
  }
  return jumlah;
}
