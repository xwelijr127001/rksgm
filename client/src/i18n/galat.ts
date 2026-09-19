/**
 * Teks kiriman server -> bahasa aktif. Server tetap mengirim teks Indonesia (kontrak tidak
 * berubah); di sini teks itu dicocokkan dengan kamus `server`. Teks yang tidak dikenal
 * ditampilkan apa adanya.
 */
import { bahasaKini, t } from '.';
import server from './kamus/server';

/** Pesan galat server (dan pesan cadangan lapisan jaringan) dalam bahasa aktif. */
export function terjemahkanGalat(pesan: string | null | undefined): string {
  if (!pesan) return '';
  if (bahasaKini() === 'id') return pesan;
  const kunci = Object.keys(server.id).find((k) => server.id[k] === pesan);
  return kunci ? t(`server.${kunci}`) : pesan;
}

/**
 * Data acara BAWAAN di dalam state (nama acara & label hadiah dari shared/brand.ts) dalam bahasa
 * aktif. Isian panitia tidak cocok dengan kamus, jadi tampil apa adanya. Hanya untuk TAMPILAN:
 * kolom isian panitia tetap memakai nilai aslinya.
 */
export function terjemahkanBawaan(teks: string | null | undefined): string {
  return terjemahkanGalat(teks);
}
