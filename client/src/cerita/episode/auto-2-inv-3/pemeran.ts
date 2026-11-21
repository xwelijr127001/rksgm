/**
 * T-104 PEMERAN Investigator kasus 3 "Satu Baris Terlalu Banyak". Id pemeran = id PERAN yang dibekukan T-102 (cerita/tipe.ts
 * SaksiPanel + ketua panel) = id tokoh piksel seni Designer T-103 (seni/investigasi/panel/kasus3.{png,json}, terdaftar di
 * seni/piksel). Nama orangnya fiktif dan hanya ada di teks episode ('pemeran.<id>.nama' / '.peran').
 *
 *   pemohon   Pak Gilang, pemohon klaim, pemilik mobil
 *   penaksir  Pak Seno, penaksir biaya di bengkel
 *   ketua     Pak Arya, penelaah klaim yang memimpin panel telaah  // [konfirmasi PIC] nama jabatan dan nama panel
 */
import type { Pemeran } from '../../tipe';

export const PEMERAN_KASUS_3 = {
  pemohon: { nama: 'pemeran.pemohon.nama', peran: 'pemeran.pemohon.peran', potret: 'tokoh' },
  penaksir: { nama: 'pemeran.penaksir.nama', peran: 'pemeran.penaksir.peran', potret: 'tokoh' },
  ketua: { nama: 'pemeran.ketua.nama', peran: 'pemeran.ketua.peran', potret: 'tokoh' },
} as const satisfies Record<'pemohon' | 'penaksir' | 'ketua', Pemeran>;
