/**
 * SENI PIKSEL TOKOH (pintu masuk): manifest + atlas Miss Raksa & Bu Rina dipasang ke penyusun murni (susun.ts).
 *
 *   import { susunTokoh, potretTokoh, teleponSisipan, gambarTokohPiksel, keGambarTokoh, svgPotret } from '../seni/piksel';
 *
 * - Manifest: impor JSON biasa (Vite & tsx sama-sama menerimanya), dibaca toleran sekali saat modul dimuat.
 * - URL atlas: `import.meta.glob(..., { query: '?url' })` (Vite: dev = berkas sumber, build = aset ber-hash; pola yang
 *   sama dengan ui/panggung/sumberPiksel.ts). Di luar Vite (tes node lewat tsx) `import.meta.glob` tidak ada:
 *   URL berkas `new URL('./x.png', import.meta.url)` (file://), cukup untuk uji murni. Modul ini tidak menyentuh DOM
 *   dan tidak memuat/mendekode PNG; pemuatan tetap milik panggung (urlSusunan -> muatGambar).
 * - `tokohPikselTersedia(id)` false (manifest cacat / URL kosong) = pemakai tetap memakai seni SVG.
 * - `ikonTokoh(id, ekspresi, px)`: ikon kepala mini gambar tangan (ikon.ts, tools/piksel/bangun-ikon.mjs) untuk potret
 *   bulat < 44 px CSS; kepala utuh (sanggul/hijab) pada skala bulat.
 */
import jsonMiss from './miss-raksa.json';
import jsonRina from './bu-rina.json';
import jsonIkon from './ikon.json';
import { bacaManifestIkon, ikonDari } from './ikon';
import { buatPenyusun, type IdTokohPiksel, type PotretTokoh } from './susun';
import type { Ekspresi } from '../../tipe';

export * from './susun';
export { bacaManifestIkon, ikonDari, wajahIkon, type IkonTokoh, type ManifestIkon } from './ikon';

let pngVite: Record<string, string> = {};
try {
  pngVite = import.meta.glob(['./miss-raksa.png', './bu-rina.png', './ikon-miss-raksa.png', './ikon-bu-rina.png'], { eager: true, query: '?url', import: 'default' });
} catch {
  /* bukan Vite (tes node): URL berkas di bawah */
}

/** URL PNG atlas per tokoh (Vite: URL aset; node: file://). */
export const URL_ATLAS_PIKSEL: Readonly<Record<IdTokohPiksel, string>> = {
  missRaksa: pngVite['./miss-raksa.png'] ?? new URL('./miss-raksa.png', import.meta.url).href,
  buRina: pngVite['./bu-rina.png'] ?? new URL('./bu-rina.png', import.meta.url).href,
};

/** Penyusun dengan manifest & atlas nyata terpasang. */
export const penyusunPiksel = buatPenyusun({
  missRaksa: { json: jsonMiss, url: URL_ATLAS_PIKSEL.missRaksa },
  buRina: { json: jsonRina, url: URL_ATLAS_PIKSEL.buRina },
});

/** true bila manifest & atlas tokoh ini terpasang (selain itu pakai seni SVG). */
export const tokohPikselTersedia = penyusunPiksel.tersedia;
/** susunTokoh(id, { pose, hadap?, ekspresi, mata?, mulut? }) -> SusunanTokoh | null. */
export const susunTokoh = penyusunPiksel.susunTokoh;
/** potretTokoh(id, ekspresi, ukuranPx, { dekat?, mata?, mulut? }) -> PotretTokoh | null (skala bulat). */
export const potretTokoh = penyusunPiksel.potretTokoh;
/** teleponSisipan(ekspresi, ukuranPx, { mata?, mulut?, tokoh? }) -> PotretTokoh | null (bawaan Bu Rina). */
export const teleponSisipan = penyusunPiksel.teleponSisipan;
/** Opsi panggung (dunia.ts OpsiTokoh + bicara/kedip) -> GambarTokoh raster | null. */
export const gambarTokohPiksel = penyusunPiksel.gambarTokohPiksel;

/** Manifest ikon kepala mini (potret < 44 px CSS); null = tidak ada/cacat (potret kecil memakai jendela manifest). */
export const manifestIkon = bacaManifestIkon(jsonIkon);

/** URL PNG ikon kepala mini per tokoh (Vite: URL aset; node: file://); '' = tidak ada. */
export const URL_IKON_PIKSEL: Readonly<Record<IdTokohPiksel, string>> = {
  missRaksa: pngVite['./ikon-miss-raksa.png'] ?? new URL('./ikon-miss-raksa.png', import.meta.url).href,
  buRina: pngVite['./ikon-bu-rina.png'] ?? new URL('./ikon-bu-rina.png', import.meta.url).href,
};

/** Ikon kepala mini tokoh pada ukuranPx (skala bulat, kepala utuh), atau null (tanpa ikon: pakai potretTokoh). */
export function ikonTokoh(id: IdTokohPiksel, ekspresi: Ekspresi, ukuranPx: number): PotretTokoh | null {
  return manifestIkon && tokohPikselTersedia(id) ? ikonDari(manifestIkon, id, ekspresi, ukuranPx, URL_IKON_PIKSEL[id]) : null;
}
