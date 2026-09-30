/**
 * API SENI TOKOH v3 (docs/cerita/ADEGAN-AUTO1.md bagian 6-7): satu generator SVG per tokoh menjadi SUMBER/MASTER untuk
 * panggung, potret, dan sprite aktivitas (keluarga gambar yang sama). SVG mandiri; id gradien/filter diberi awalan
 * `opsi.id` supaya beberapa salinan di halaman yang sama tidak bentrok.
 *
 * Satuan = satuan DUNIA panggung (1600 x 900) pada skala 1: tokoh diletakkan dengan menaruh `jangkar` di titik dunia.
 */
import type { ArahPandang, Ekspresi, PoseMentor, PoseNasabah } from '../../tipe';

export interface Titik {
  x: number;
  y: number;
}

export interface GambarTokoh {
  /** Isi <svg> (tanpa elemen <svg> pembungkus) untuk viewBox `0 0 w h`. */
  svg: string;
  w: number;
  h: number;
  /** Titik yang ditaruh di posisi dunia: telapak kaki (berdiri/jalan) atau pinggul di kursi (duduk). */
  jangkar: Titik;
  /** Pusat kepala (untuk potret, arah pandang, dan jendela kamera HP). */
  kepala: Titik;
  /** Titik tangan untuk prop (kunci, kartu, gagang telepon). */
  tangan?: { kiri?: Titik; kanan?: Titik };
  /**
   * Lengan bawah & tangan yang bertumpu di meja (pose duduk di balik meja), SVG terpisah dengan id berawalan sendiri,
   * viewBox & jangkar SAMA dengan `svg`. Panggung menggambarnya sesudah puncak meja & prop, sebelum depan meja,
   * supaya tangan terlihat di atas meja walau badan di belakangnya.
   */
  diAtasMeja?: string;
}

interface OpsiDasar {
  ekspresi: Ekspresi;
  pandang?: ArahPandang;
  /** Mulut terbuka (bergantian selama teks mengetik). */
  bicara?: boolean;
  /** Mata tertutup (animasi kedip). */
  kedip?: boolean;
  /** Awalan id unik untuk gradien/filter di dalam SVG ini. */
  id?: string;
  /** Versi garis & fitur wajah lebih tebal untuk tampilan kecil (< 60 px kepala). */
  kecil?: boolean;
}

export interface OpsiMissRaksa extends OpsiDasar {
  pose: PoseMentor;
}

export interface OpsiBuRina extends OpsiDasar {
  pose: PoseNasabah;
  /** Arah hadap badan: bawaan kiri (ke meja); kanan = berjalan keluar ke pintu tanpa mencerminkan gambar. */
  hadap?: 'kiri' | 'kanan';
  /** Kunci mobil tampil di tangan (masuk / berdiri). */
  kunci?: boolean;
}

/** Jendela potret (viewBox persegi di sekitar kepala) per tokoh, dari pose duduk. */
export interface JendelaPotret {
  x: number;
  y: number;
  sisi: number;
}

export type GeneratorMissRaksa = (opsi: OpsiMissRaksa) => GambarTokoh;
export type GeneratorBuRina = (opsi: OpsiBuRina) => GambarTokoh;
