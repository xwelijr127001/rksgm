/**
 * API LAPISAN RUANG v3 (docs/cerita/ADEGAN-AUTO1.md bagian 2): tiap lokasi adegan = beberapa lapisan SVG dalam
 * koordinat DUNIA 1600 x 900 + titik-titik tempat tokoh & prop. Panggung menyusun lapisan dengan urutan tetap:
 *   latar → koridor → daun pintu → tokoh di belakang meja → belakangMeja (puncak meja, monitor, prop tetap)
 *   → depanMeja → kursi.belakang → tokoh di kursi pengunjung → kursi.depan
 * Teks papan nama TIDAK digambar di lapisan: panggung menulisnya dari konfigurasi (`Episode.panggung.lokasi.nama`)
 * di kotak `papanNama`, supaya ejaan terkontrol dan bisa diganti.
 */
import type { IdLokasiAdegan } from '../../tipe';
import type { Titik } from '../tokoh/tipe';

/**
 * Satu lapisan: isi SVG untuk viewBox `0 0 w h`, ditaruh di dunia pada (x, y). Versi PIKSEL lapisan yang sama (PNG
 * native, kotak dunia sama) ada di manifest seni/piksel/ruang.json; panggung membacanya sendiri (ui/panggung/piksel.ts
 * `bacaManifestRuang`, bentuk `svg: '' + piksel`).
 */
export interface LapisanSvg {
  svg: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TempatAdegan {
  /** Jangkar Miss Raksa (pinggul saat duduk / telapak saat berdiri) + skala. */
  mentor: Titik;
  mentorBerdiri: Titik;
  skalaMentor: number;
  /** Jangkar Bu Rina duduk di kursi pengunjung + skala. */
  nasabahDuduk: Titik;
  skalaNasabah: number;
  /** Bu Rina berdiri (parkiran / sebelum duduk). */
  nasabahBerdiri: Titik;
  /** Jalur masuk dari ambang pintu ke samping kursi (titik & skala per titik). Kosong = lokasi tanpa pintu. */
  jalurMasuk: { titik: Titik; skala: number }[];
  /** Prop: kartu polis (titik awal di tepi dekat meja sisi pemain → di meja), kunci mobil di meja, telepon. */
  kartuSimpan?: Titik;
  kartuMeja?: Titik;
  kunciMeja?: Titik;
  telepon?: Titik;
  /**
   * y dunia tepi JAUH meja di badan Miss Raksa (lokasi bermeja). Bingkai piksel Miss Raksa duduk menaruh garis
   * mejanya (manifest) di sini; setara dengan menaruh jangkar di `mentor` bila jangkar bingkai 34 piksel (136 satuan)
   * di bawah garis meja. Lihat docs/cerita/aset/RUANG.md.
   */
  garisMejaMentor?: number;
}

export interface RuangAdegan {
  lokasi: IdLokasiAdegan;
  latar: LapisanSvg;
  koridor?: LapisanSvg;
  /** Daun pintu: berputar di `engsel` (tepi vertikal), membuka ke dalam ruangan. */
  pintu?: { daun: LapisanSvg; engsel: Titik; bukaan: { x: number; y: number; w: number; h: number } };
  belakangMeja?: LapisanSvg;
  depanMeja?: LapisanSvg;
  kursi?: { belakang: LapisanSvg; depan?: LapisanSvg };
  tempat: TempatAdegan;
  /**
   * Kotak papan nama (dunia) untuk teks lokasi dari konfigurasi (lapisan SVG). Latar PIKSEL sudah memuat teksnya
   * (manifest `papan.teks`/`papan.kotak`), jadi panggung piksel tidak menulis teks lagi.
   */
  papanNama?: { x: number; y: number; w: number; h: number; ukuranHuruf: number; warna: string };
}

export type GeneratorRuang = (lokasi: IdLokasiAdegan) => RuangAdegan;
