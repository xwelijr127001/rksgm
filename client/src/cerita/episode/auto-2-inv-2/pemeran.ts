/**
 * T-091 (Designer): PEMERAN Investigator kasus 2 "Malam di Jalan Melati" yang seninya baru.
 *
 *   yusuf  Pak Yusuf, nasabah (40-an, sopan, lelah, kepala keluarga). Kemeja biru lengan pendek, celana abu-abu.
 *   agus   Mas Agus, pengendara motor (saksi), jaket marun, helm di tangan.
 *
 * Keduanya memakai sprite SENDIRI (tanpa `piksel` pinjaman): id pemeran = id tokoh piksel ('yusuf' / 'agus' di
 * seni/piksel/kasus2.{png,json}, terdaftar di PERAN_PIKSEL ui/latar/piksel/adegan.ts). Skala, palet dan garis tepi sama dengan
 * Pak Darto dan petugas tol (suntingan sprite tokoh samping Episode 2; character/investigator-t091/tokoh.mts). Potret obrolan
 * (avatar pesan Pak Yusuf) datang dari sprite yang sama lewat tokohPotret().
 *
 * KUNCI TEKS: `nama` dan `peran` adalah kunci naskah episode (teks.{id,en,zh}.ts milik Fullstack) dengan pola Episode 2
 * ('pemeran.<id>.nama' / 'pemeran.<id>.peran').
 *
 * WAJAH. `Ekspresi` cerita -> wajah seni:
 *   Pak Yusuf  netral -> netral · cemas, bingung -> cemas · serius, kesal -> serius · lega, senang -> lega ·
 *              tersenyum -> TERBUKA: wajah menjelaskan dengan tenang DAN badan dengan kedua telapak tangan terbuka
 *              (frame 'terbuka-kanan'; bukan pose malu). Pakai `EKSPRESI_YUSUF.terbuka` untuk baris pengakuannya.
 *   Mas Agus   netral, tersenyum, senang, lega -> netral · cemas, serius, bingung, kesal -> serius
 */
import type { Ekspresi, Pemeran } from '../../tipe';

export const PEMERAN_KASUS_2 = {
  yusuf: { nama: 'pemeran.yusuf.nama', peran: 'pemeran.yusuf.peran', potret: 'tokoh' },
  agus: { nama: 'pemeran.agus.nama', peran: 'pemeran.agus.peran', potret: 'tokoh' },
} as const satisfies Record<'yusuf' | 'agus', Pemeran>;

/** Lima wajah Pak Yusuf sebagai `Ekspresi` cerita (untuk `b(kunci, 'yusuf', EKSPRESI_YUSUF.terbuka)`). */
export const EKSPRESI_YUSUF = { netral: 'netral', cemas: 'cemas', serius: 'serius', terbuka: 'tersenyum', lega: 'lega' } as const satisfies Record<string, Ekspresi>;
/** Dua wajah Mas Agus. */
export const EKSPRESI_AGUS = { netral: 'netral', serius: 'serius' } as const satisfies Record<string, Ekspresi>;
