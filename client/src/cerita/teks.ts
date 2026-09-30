/**
 * Teks episode dalam bahasa aktif. Tabel teks ada di episode (`Episode.teks`), bukan di kamus UI:
 * konten cerita dimuat bersama halaman cerita saja (tidak membebani bundel utama).
 * Urutan cadangan: bahasa diminta -> Indonesia -> kunci itu sendiri (supaya kekosongan terlihat saat uji).
 *
 * Parameter: {nama} dari pemanggil; (v3) {lokasi} = `Episode.panggung.lokasi.nama` (papan nama & dialog memakai
 * satu nama yang sama, docs/cerita/ADEGAN-AUTO1.md bagian 1) dan diisi otomatis bila pemanggil tidak memberinya,
 * sehingga semua pemanggil lama (`tx(k)`) tetap benar.
 */
import type { Bahasa } from '@shared/bahasa';
import type { Episode, KunciTeks } from './tipe';

export function teksCerita(
  ep: Pick<Episode, 'teks'> & { panggung?: { lokasi?: { nama: string } } },
  kunci: KunciTeks,
  bahasa: Bahasa,
  param?: Record<string, string | number>,
): string {
  const mentah = ep.teks[bahasa]?.[kunci] ?? ep.teks.id?.[kunci] ?? kunci;
  const lokasi = ep.panggung?.lokasi?.nama;
  const semua = lokasi ? { lokasi, ...param } : param;
  if (!semua) return mentah;
  return mentah.replace(/\{(\w+)\}/g, (utuh, nama: string) => (Object.prototype.hasOwnProperty.call(semua, nama) ? String(semua[nama]) : utuh));
}
