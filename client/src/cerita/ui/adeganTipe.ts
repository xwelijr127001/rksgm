/**
 * Tipe KOMPOSISI adegan (v3, docs/cerita/ADEGAN-AUTO1.md bagian 4): hasil murni `adeganKini(ep, state)` yang dibaca
 * panggung. Tidak disimpan di state cerita; dihitung ulang dari state + metadata episode setiap render.
 */
import type { AksiAdegan, ArahPandang, Ekspresi, IdLokasiAdegan, IdPropAdegan, PoseMentor, PoseNasabah, TempatProp } from '../tipe';

export type PembicaraAdegan = 'mentor' | 'nasabah' | 'pemain' | 'narasi';

export interface MentorDiAdegan {
  pose: PoseMentor;
  ekspresi: Ekspresi;
  pandang: ArahPandang;
}

export interface NasabahDiAdegan {
  pose: PoseNasabah;
  ekspresi: Ekspresi;
  pandang: ArahPandang;
  /** Hadir hanya lewat sisipan panggilan telepon (bukan di kursi kantor). */
  lewatTelepon: boolean;
}

export interface KomposisiAdegan {
  lokasi: IdLokasiAdegan;
  /** null = tidak hadir di bingkai. */
  mentor: MentorDiAdegan | null;
  nasabah: NasabahDiAdegan | null;
  /** Pembicara baris kini (null bila tidak ada baris, mis. layar akhir). */
  pembicara: PembicaraAdegan | null;
  prop: Record<IdPropAdegan, TempatProp>;
  /**
   * Aksi sekali jalan milik baris kini. `kunci` stabil per episode + putaran + node + baris, sehingga panggung
   * memutarnya sekali saat baris itu BARU dicapai dan tidak memutarnya lagi saat render ulang / ganti bahasa.
   */
  aksi: { jenis: AksiAdegan; kunci: string } | null;
  /** Awal episode baru (belum ada aksi pemain): pembuka lokasi pantas diputar. */
  pembuka: boolean;
}
