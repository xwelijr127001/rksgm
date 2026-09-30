/**
 * Bu Rina, nasabah episode AUTO-1 — pintu masuk LAMA (nama ekspor tetap).
 *
 * SENI PIKSEL v4 (dipakai halaman): `setengahBadanPiksel` = frame piksel `berdiri` (kunci di tangan) + wajah ekspresi,
 * dipotong kepala sampai pinggang (TokohNasabah). Potret bulat memakai PotretPiksel (seni/tokoh/PotretMissRaksa.tsx),
 * aktivitas Phaser memakai frame aktivitas manifest langsung (game/scenes/cerita/auto1-bukti.ts).
 *
 * Fungsi SVG di bawah (seni v3 `seni/tokoh/buRina.ts`) tetap ada sebagai CADANGAN bila seni piksel tidak tersedia
 * (manifest tidak ada / atlas gagal di Phaser) dan untuk uji lama.
 *
 * Identitas tetap: ibu pemilik usaha katering rumahan 40-an, kerudung (khimar) bata dengan bros kecil kuning, tunik
 * biru selutut berlis jingga di atas celana panjang gelap, celemek pinggang krem bertepi jingga (kain tipis di semua
 * pose; duduk = rebah di paha, bukan bantal), kunci mobil. Gaya lama (setengah badan datar & badan penuh chibi
 * bertinta hijau) DIHAPUS; semua fungsi di sini memotong gambar v3.
 *
 * - `nasabahSetengahBadan` / `svgNasabah`: potongan kepala-sampai-pinggang pose berdiri (kunci di tangan), versi
 *   POLOS: tanpa id/gradien/clipPath, jadi aman disisipkan inline berkali-kali di satu halaman (kontrak lama).
 * - `nasabahBadanPenuh`: badan penuh berdiri (versi `kecil`: garis & fitur wajah tebal) untuk properti adegan 2D.
 *
 * Semua gambar lewat generator BERPENGAMAN seni/tokoh/index.ts (`gambarBuRina`): galat seni jatuh ke siluet pengganti
 * (sementara.ts), tidak menjatuhkan kartu episode atau sprite aktivitas Phaser.
 */

import type { Ekspresi } from '../tipe';
import { ikonTokoh, isiSvg, potretTokoh, susunTokoh, svgPotret, tokohPikselTersedia, type IdTokohPiksel } from './piksel';
import { gambarBuRina, type OpsiBuRina } from './tokoh';
import { WARNA_RINA as WARNA_V3 } from './tokoh/buRina';
import type { JendelaPotret } from './tokoh/tipe';
import { JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, POTRET_KECIL_MAKS_PX } from './tokoh/ukuran';

/**
 * Jendela potongan setengah badan di kanvas berdiri v3 (rasio 120:140 seperti ukuran lama): puncak kerudung sampai
 * sedikit di bawah pinggang, tangan bertaut (cemas/senang) dan tali pinggang jingga + pangkal celemek krem masih di
 * dalam potongan (identitas katering terbaca di kartu episode). Dipakai juga oleh TokohNasabah.
 */
export const SETENGAH_BADAN = { x: 38, y: 50, w: 360, h: 420 } as const;
const SETENGAH = SETENGAH_BADAN;

/** Ukuran gambar setengah badan (satuan viewBox) — sama dengan jendela potongan v3. */
export const NASABAH_W = SETENGAH.w;
export const NASABAH_H = SETENGAH.h;

/**
 * Jendela potret (persegi di sekitar kepala pose duduk) — aturan ukuran SAMA dengan potret Miss Raksa v3
 * (missRaksa.ts `aturanPotret`), jadi kedua tokoh tampil seukuran di kotak dialog, hub, dan kartu akhir:
 * - <= POTRET_KECIL_MAKS px (dialog 52, aktivitas 44, riwayat 32): `JENDELA_POTRET_NASABAH_KECIL` (= kontrak
 *   JENDELA_POTRET_KECIL) + versi `kecil`;
 * - 53–POTRET_SEDANG_MAKS px (hub 56, kartu akhir 64): `JENDELA_POTRET_NASABAH_SEDANG` (= Miss Raksa
 *   JENDELA_POTRET_SEDANG; kepala ± 65 % lingkaran) + versi `kecil`;
 * - lebih besar (sisipan telepon 96, galeri): `JENDELA_POTRET_NASABAH` (= JENDELA_POTRET_V3) versi normal.
 */
export const JENDELA_POTRET_NASABAH = JENDELA_POTRET_V3;
export const JENDELA_POTRET_NASABAH_KECIL = JENDELA_POTRET_KECIL;
export const JENDELA_POTRET_NASABAH_SEDANG: JendelaPotret = { x: 138, y: 58, sisi: 188 };

/** Potret setinggi ini (px CSS) atau lebih kecil memakai jendela kecil + versi `kecil` (garis & fitur wajah tebal). */
export const POTRET_KECIL_MAKS = POTRET_KECIL_MAKS_PX;
/** Potret 53 px sampai setinggi ini memakai jendela sedang + versi `kecil` (sama dengan Miss Raksa). */
export const POTRET_SEDANG_MAKS = 75;

/** Jendela & versi potret Bu Rina menurut ukuran tampil (px CSS). */
export function aturanPotretNasabah(ukuran: number): { jendela: JendelaPotret; kecil: boolean } {
  if (ukuran <= POTRET_KECIL_MAKS) return { jendela: JENDELA_POTRET_NASABAH_KECIL, kecil: true };
  if (ukuran <= POTRET_SEDANG_MAKS) return { jendela: JENDELA_POTRET_NASABAH_SEDANG, kecil: true };
  return { jendela: JENDELA_POTRET_NASABAH, kecil: false };
}

/** Warna identitas Bu Rina (sumber: seni v3). */
export const WARNA_RINA = {
  kulit: WARNA_V3.kulit,
  kulitBayang: WARNA_V3.kulitBawah,
  kerudung: WARNA_V3.kerudung,
  kerudungTua: WARNA_V3.kerudungTua,
  blus: WARNA_V3.blus,
  blusTua: WARNA_V3.blusTua,
  celemek: WARNA_V3.celemek,
  celemekTepi: WARNA_V3.lis,
  lis: WARNA_V3.lis,
  bros: WARNA_V3.bros,
  rok: WARNA_V3.celana,
} as const;

const cache = new Map<string, string>();

/**
 * Bu Rina setengah badan (viewBox 0 0 NASABAH_W NASABAH_H), satu ekspresi, pandang ke pemain. `kecil` = versi
 * potret kecil (garis & fitur wajah lebih tebal). String tanpa id (aman diulang); di-cache per masukan.
 */
export function nasabahSetengahBadan(ekspresi: Ekspresi, kecil = false): string {
  const kunci = `${ekspresi}|${kecil ? 'k' : 'n'}`;
  const ada = cache.get(kunci);
  if (ada) return ada;
  // `polos` (opsi internal buRina.ts = gambarBuRinaPolos): tanpa id/gradien. Lewat pembungkus berpengaman; siluet
  // pengganti juga tanpa id.
  const g = gambarBuRina({ pose: 'berdiri', ekspresi, pandang: 'pemain', kunci: true, kecil, polos: true } as OpsiBuRina);
  const svg = `<g transform="translate(${-SETENGAH.x} ${-SETENGAH.y})">${g.svg}</g>`;
  cache.set(kunci, svg);
  return svg;
}

/** Dokumen SVG lengkap (untuk tangkapan/uji); tampilan React memakai isi dari nasabahSetengahBadan. */
export function svgNasabah(ekspresi: Ekspresi): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NASABAH_W} ${NASABAH_H}">${nasabahSetengahBadan(ekspresi)}</svg>`;
}

// ------------------------------------------------------------------ seni piksel (halaman)

/** Isi SVG potret (untuk <svg viewBox> milik komponen potret). */
export interface IsiPotret {
  svg: string;
  viewBox: string;
}

/**
 * Potret bulat di bawah ukuran ini (px CSS TAMPIL) memakai IKON KEPALA MINI gambar tangan (seni/piksel/ikon.ts), bukan
 * jendela 1:1 manifest: jendela 28/32 piksel seni hanya memuat wajah (sanggul Miss Raksa & hijab Bu Rina hilang).
 */
export const BATAS_IKON_PX = 44;

/**
 * Potret bulat PIKSEL bersama (Miss Raksa & Bu Rina; PotretPiksel di seni/tokoh/PotretMissRaksa.tsx): jendela potret
 * manifest keluarga BIASA untuk `ukuranPx` (game/tokoh.ts ukuranPermintaanPotret: px CSS pada dpr bulat, px perangkat
 * pada dpr pecahan), skala bulat, isi SVG tanpa id + viewBox. `ikon` (pemanggil: ukuran TAMPIL < BATAS_IKON_PX) = ikon
 * kepala mini pada skala bulat (kepala utuh); tanpa ikon untuk tokoh itu = jendela manifest. null = tokoh tanpa
 * manifest piksel / penyusun gagal.
 */
export function potretPiksel(tokoh: IdTokohPiksel, ekspresi: Ekspresi, ukuranPx: number, opsi: { ikon?: boolean } = {}): (IsiPotret & { skala: number; asal: string; url: string }) | null {
  if (!tokohPikselTersedia(tokoh)) return null;
  try {
    const u = Math.max(1, Math.round(ukuranPx));
    const p = (opsi.ikon ? ikonTokoh(tokoh, ekspresi, u) : null) ?? potretTokoh(tokoh, ekspresi, u);
    if (!p || !p.lapisan.length) return null;
    const s = svgPotret(p);
    return { svg: s.isi, viewBox: s.viewBox, skala: p.skala, asal: p.asal, url: p.url };
  } catch {
    return null;
  }
}

/**
 * Potongan kepala-sampai-pinggang frame piksel `berdiri` Bu Rina (piksel seni, relatif frame 79 x 191): puncak
 * kerudung sampai sedikit di bawah kunci mobil & pangkal celemek (identitas katering tetap terbaca).
 */
export const POTONG_SETENGAH_PIKSEL = { x: 0, y: 0, w: 79, h: 108 } as const;

/**
 * Bu Rina setengah badan PIKSEL: isi SVG (<svg> bersarang + <image> atlas pixelated, tanpa id) dan kotak potongan
 * (piksel seni, untuk viewBox). null = seni piksel tidak tersedia (pakai nasabahSetengahBadan).
 */
export function setengahBadanPiksel(ekspresi: Ekspresi): { svg: string; x: number; y: number; w: number; h: number; url: string } | null {
  if (!tokohPikselTersedia('buRina')) return null;
  try {
    const s = susunTokoh('buRina', { pose: 'berdiri', ekspresi });
    if (!s || !s.lapisan.length) return null;
    const P = POTONG_SETENGAH_PIKSEL;
    return { svg: isiSvg(s.lapisan, s.url, s.atlas), x: P.x, y: P.y, w: Math.min(P.w, s.ukuran.w), h: Math.min(P.h, s.ukuran.h), url: s.url };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ badan penuh (adegan Phaser, cadangan)

/** Potongan badan penuh berdiri di kanvas v3 (kepala sampai telapak + bayangan kontak). */
const PENUH = { x: 90, y: 50, w: 250, h: 950 } as const;

/** Ukuran viewBox `nasabahBadanPenuh` (telapak di y = RINA_PENUH.telapakY). */
export const RINA_PENUH = { w: PENUH.w, h: PENUH.h, telapakY: 985 - PENUH.y } as const;

/**
 * CADANGAN Phaser (atlas piksel gagal dimuat): Bu Rina badan penuh v3 untuk properti adegan 2D (aktivitas bukti di
 * parkiran): berdiri, cemas ringan, kunci mobil
 * di tangan, versi `kecil` (garis & wajah tebal supaya terbaca pada ± 120 px). Dokumen terpisah (tekstur), jadi id
 * gradien berawalan tetap aman.
 */
export function nasabahBadanPenuh(): string {
  const g = gambarBuRina({ pose: 'berdiri', ekspresi: 'cemas', pandang: 'depan', kunci: true, kecil: true, id: 'akt-rina' });
  return `<g transform="translate(${-PENUH.x} ${-PENUH.y})">${g.svg}</g>`;
}
