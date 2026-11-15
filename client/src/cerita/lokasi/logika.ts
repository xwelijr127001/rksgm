/**
 * Logika murni prototipe "Lokasi" v2 (irisan K08 Episode 2, "Rambu di lokasi"). Tanpa React, tanpa penyimpanan.
 *
 * Satu adegan jalan, satu petunjuk pada satu waktu, urutan tetap:
 *   rambu 1 (ketuk) -> tandai lajur -> rambu 2 (ketuk) -> tandai lajur -> kesimpulan kepada Pak Bima -> akibat.
 * Penomoran lajur dan posisi truk (menurut supir) terlihat sejak awal: itu informasi untuk bernalar, bukan teka-teki.
 * Tanda lajur milik pemain, TIDAK dinilai saat menandai. Setelah pemain menyimpulkan, Pak Bima mencocokkan tanda itu dengan
 * (1) tulisan rambu 1 dan (2) kesimpulan pemain sendiri, supaya kegiatan di jalan tidak berdiri sendiri.
 * Isi kasus HANYA dari naskah (teks.id.ts, 'dok.rambu.*' dan 'k08*'). Kalimat tanggapan atas tanda pemain adalah teks
 * antarmuka (DRAF), bukan fakta kasus; ia hanya membandingkan tanda pemain dengan tulisan rambu dan dengan kesimpulannya.
 */
import { TEKS_AUTO_2_ID } from '../episode/auto-2/teks.id';

/** Teks naskah. Kunci yang tidak ada dikembalikan apa adanya supaya cacat langsung terlihat (dan tes gagal). */
export const t = (kunci: string): string => TEKS_AUTO_2_ID[kunci] ?? kunci;

import { JUMLAH_LAJUR, LAJUR_TRUK } from './seni/geometri';
/** Jumlah lajur dan lajur truk menurut keterangan supir (dok.rambu.4.isi): angkanya milik seni/geometri.ts, dicocokkan dengan aset SVG. */
export { JUMLAH_LAJUR, LAJUR_TRUK };

export type IdRambu = 'rambu1' | 'rambu2';

export const RAMBU: Record<IdRambu, { labelKunci: string; isiKunci: string; instruksi: string }> = {
  rambu1: { labelKunci: 'dok.rambu.1', isiKunci: 'dok.rambu.1.isi', instruksi: 'Ketuk lajur yang dilarang untuk truk.' },
  rambu2: { labelKunci: 'dok.rambu.2', isiKunci: 'dok.rambu.2.isi', instruksi: 'Ketuk lajur yang menurutmu dimaksud “lajur kiri”.' },
};

/** Lajur yang disebut tulisan rambu 1, dibaca dari teks naskah ("... lajur 3 dan 4."). */
export function lajurTertulisRambu1(): number[] {
  return [...t(RAMBU.rambu1.isiKunci).matchAll(/\d/g)].map((m) => Number(m[0]));
}

export interface Keadaan {
  /** 0 ketuk rambu 1, 1 tandai rambu 1, 2 ketuk rambu 2, 3 tandai rambu 2, 4 selesai memeriksa. */
  progres: number;
  /** Rambu yang dibuka ulang untuk dilihat/diubah (progres tidak mundur). */
  lihat: IdRambu | null;
  tanda1: number[];
  tanda2: number[];
}

export const KEADAAN_AWAL: Keadaan = { progres: 0, lihat: null, tanda1: [], tanda2: [] };

export function rambuAktif(k: Keadaan): IdRambu {
  return k.lihat ?? (k.progres <= 1 ? 'rambu1' : 'rambu2');
}

/** Tahap layar periksa: 'ketuk' = menunggu pemain mengetuk rambu; 'tandai' = jalan bisa ditandai. */
export function tahap(k: Keadaan): 'ketuk' | 'tandai' {
  if (k.lihat) return 'tandai';
  return k.progres % 2 === 0 && k.progres < 4 ? 'ketuk' : 'tandai';
}

export function selesaiPeriksa(k: Keadaan): boolean { return k.progres >= 4; }

export function tandaAktif(k: Keadaan): number[] {
  return rambuAktif(k) === 'rambu1' ? k.tanda1 : k.tanda2;
}

/** Pemain mengetuk rambu di adegan (hanya berarti saat tahap 'ketuk'). */
export function ketukRambu(k: Keadaan): Keadaan {
  return tahap(k) === 'ketuk' ? { ...k, progres: k.progres + 1 } : k;
}

/** Ketuk lajur: menyalakan atau mematikan tanda untuk rambu yang sedang aktif. Hanya saat tahap 'tandai'. */
export function tandai(k: Keadaan, lajur: number): Keadaan {
  if (tahap(k) !== 'tandai' || k.progres >= 4 && !k.lihat) return k;
  if (!Number.isInteger(lajur) || lajur < 1 || lajur > JUMLAH_LAJUR) return k;
  const kunci = rambuAktif(k) === 'rambu1' ? 'tanda1' : 'tanda2';
  const ada = k[kunci].includes(lajur);
  const baru = (ada ? k[kunci].filter((x) => x !== lajur) : [...k[kunci], lajur]).sort((a, b) => a - b);
  return { ...k, [kunci]: baru };
}

export function bolehLanjut(k: Keadaan): boolean {
  return tahap(k) === 'tandai' && tandaAktif(k).length > 0;
}

/** Lanjut dari tahap menandai: menutup tinjauan ulang, atau maju ke langkah berikutnya. */
export function lanjut(k: Keadaan): Keadaan {
  if (!bolehLanjut(k)) return k;
  return k.lihat ? { ...k, lihat: null } : { ...k, progres: k.progres + 1 };
}

/** Rambu yang sudah dibuka (boleh dibuka ulang kapan saja, tanpa mundur dari kemajuan). */
export function rambuTerbuka(k: Keadaan): IdRambu[] {
  const out: IdRambu[] = [];
  if (k.progres >= 1) out.push('rambu1');
  if (k.progres >= 3) out.push('rambu2');
  return out;
}

export function bukaUlang(k: Keadaan, id: IdRambu): Keadaan {
  return rambuTerbuka(k).includes(id) ? { ...k, lihat: id } : k;
}

export function teksLajur(daftar: ReadonlyArray<number>): string {
  const n = [...daftar].sort((x, y) => x - y);
  if (n.length === 0) return 'belum ada lajur';
  if (n.length === 1) return `lajur ${n[0]}`;
  if (n.length === 2) return `lajur ${n[0]} dan ${n[1]}`;
  return `lajur ${n.slice(0, -1).join(', ')}, dan ${n[n.length - 1]}`;
}

// ---------------------------------------------------------------------------------------------------------------- kesimpulan

export type IdPilihan = 'a' | 'b' | 'c' | 'd' | 'e';

export interface BarisAkibat { pembicara: 'narasi' | 'hendra'; kunci: string }

export interface Pilihan {
  id: IdPilihan;
  teksKunci: string;
  alasanKunci: string;
  akibat: readonly BarisAkibat[];
  /** Sikap pernyataan terhadap pertanyaan "truk di lajur 2 melanggar rambu?": a = melanggar, c = tidak melanggar, lainnya tidak bersikap. */
  sikap: 'melanggar' | 'tidak' | null;
}

const SEMUA: Record<IdPilihan, Pilihan> = {
  a: { id: 'a', teksKunci: 'k08.a', alasanKunci: 'k08.a.alasan', akibat: [{ pembicara: 'narasi', kunci: 'k08-a.1' }], sikap: 'melanggar' },
  b: { id: 'b', teksKunci: 'k08.b', alasanKunci: 'k08.b.alasan', akibat: [{ pembicara: 'narasi', kunci: 'k08-b.1' }], sikap: null },
  c: { id: 'c', teksKunci: 'k08.c', alasanKunci: 'k08.c.alasan', akibat: [{ pembicara: 'narasi', kunci: 'k08-c.1' }], sikap: 'tidak' },
  d: { id: 'd', teksKunci: 'k08.d', alasanKunci: 'k08.d.alasan', akibat: [{ pembicara: 'hendra', kunci: 'k08-d.1' }, { pembicara: 'narasi', kunci: 'k08-d.2' }], sikap: null },
  e: { id: 'e', teksKunci: 'k08.e', alasanKunci: 'k08.e.alasan', akibat: [{ pembicara: 'narasi', kunci: 'k08-e.1' }], sikap: null },
};
/** Urutan tampil dari naskah (episode.ts k08.urutan): c, e, a, d, b. Tidak ada nilai atau skor. */
export const URUTAN_PILIHAN: readonly IdPilihan[] = ['c', 'e', 'a', 'd', 'b'];
export const PILIHAN: readonly Pilihan[] = URUTAN_PILIHAN.map((id) => SEMUA[id]);

export function cariPilihan(id: IdPilihan): Pilihan { return SEMUA[id]; }

// ---------------------------------------------------------------------------------------------------------------- tanggapan atas tanda

export interface Tanggapan { kunci: 'tulisan' | 'sikap' | 'sama'; teks: string }

/**
 * Pak Bima mencocokkan tanda rambu 1 milik pemain dengan tulisan rambu dan dengan kesimpulan pemain. Hanya perbandingan:
 *  - 'tulisan': tanda berbeda dari lajur yang disebut tulisan rambu 1;
 *  - 'sikap': kesimpulan "melanggar" padahal lajur 2 tidak ditandai terlarang, atau "tidak melanggar" padahal lajur 2 ditandai;
 *  - 'sama': tanda sama dengan tulisan rambu dan tidak bertentangan dengan kesimpulan.
 * Tanda rambu 2 tidak dibandingkan: tafsir "lajur kiri" belum dikonfirmasi (naskah).
 */
export function tanggapanTanda(tanda1: ReadonlyArray<number>, pilihan: IdPilihan): Tanggapan[] {
  const tertulis = lajurTertulisRambu1();
  const sama = tanda1.length === tertulis.length && tertulis.every((x) => tanda1.includes(x));
  const out: Tanggapan[] = [];
  if (!sama) {
    out.push({ kunci: 'tulisan', teks: `Pak Bima melihat tandamu untuk rambu 1: ${teksLajur(tanda1)}. Tulisan rambunya menyebut lajur ${tertulis.join(' dan ')}.` });
  }
  const sikap = cariPilihan(pilihan).sikap;
  const trukDitandai = tanda1.includes(LAJUR_TRUK);
  if (sikap === 'melanggar' && !trukDitandai) {
    out.push({ kunci: 'sikap', teks: `Menurut tandamu, truk di lajur ${LAJUR_TRUK} tidak berada di lajur terlarang. Pak Bima bertanya: apa dasar “melanggar”?` });
  } else if (sikap === 'tidak' && trukDitandai) {
    out.push({ kunci: 'sikap', teks: `Tandamu menempatkan lajur ${LAJUR_TRUK} di lajur terlarang, tetapi kamu menyimpulkan tidak melanggar. Pak Bima bertanya: mana yang kamu maksud?` });
  }
  if (out.length === 0) out.push({ kunci: 'sama', teks: 'Tandamu untuk rambu 1 sama dengan tulisan rambu, dan tidak bertentangan dengan kesimpulanmu.' });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- catatan

export interface CatatanTemuan {
  berkas: Array<{ label: string; isi: string }>;
  tandamu: Array<{ label: string; isi: string }>;
  belumPasti: string[];
}

export function catatanTemuan(k: Keadaan): CatatanTemuan {
  return {
    berkas: [
      ...(['rambu1', 'rambu2'] as const).map((id) => ({ label: t(RAMBU[id].labelKunci), isi: t(RAMBU[id].isiKunci) })),
      { label: t('dok.rambu.3'), isi: t('dok.rambu.3.isi') },
      { label: t('dok.rambu.4'), isi: t('dok.rambu.4.isi') },
    ],
    tandamu: [
      { label: `${t('dok.rambu.1')}, kamu tandai`, isi: teksLajur(k.tanda1) },
      { label: `${t('dok.rambu.2')}, kamu tandai`, isi: teksLajur(k.tanda2) },
    ],
    belumPasti: [t('dok.rambu.catatan'), 'Posisi lajur 2 hanya berasal dari keterangan supir.'],
  };
}
