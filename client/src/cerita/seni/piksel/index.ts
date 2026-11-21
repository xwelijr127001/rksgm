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
import jsonHendra from './hendra.json';
import jsonSamping from './samping.json';
import jsonKasus2 from './kasus2.json';
import jsonIkon from './ikon.json';
import { bacaManifestIkon, ikonDari } from './ikon';
import { buatPenyusun, DAFTAR_TOKOH_KASUS2, DAFTAR_TOKOH_SAMPING, type IdTokohPiksel, type IdTokohPikselEp1, type PotretTokoh } from './susun';
import type { Ekspresi } from '../../tipe';

export * from './susun';
export { bacaManifestIkon, ikonDari, wajahIkon, type IkonTokoh, type ManifestIkon } from './ikon';

let pngVite: Record<string, string> = {};
try {
  pngVite = import.meta.glob(['./miss-raksa.png', './bu-rina.png', './hendra.png', './samping.png', './kasus2.png', './ikon-miss-raksa.png', './ikon-bu-rina.png'], { eager: true, query: '?url', import: 'default' });
} catch {
  /* bukan Vite (tes node): URL berkas di bawah */
}

/** URL PNG atlas per tokoh (Vite: URL aset; node: file://). */
export const URL_ATLAS_PIKSEL: Readonly<Record<IdTokohPiksel, string>> = {
  missRaksa: pngVite['./miss-raksa.png'] ?? new URL('./miss-raksa.png', import.meta.url).href,
  buRina: pngVite['./bu-rina.png'] ?? new URL('./bu-rina.png', import.meta.url).href,
  hendra: pngVite['./hendra.png'] ?? new URL('./hendra.png', import.meta.url).href,
  ...Object.fromEntries(DAFTAR_TOKOH_SAMPING.map((id) => [id, pngVite['./samping.png'] ?? new URL('./samping.png', import.meta.url).href])),
  ...Object.fromEntries(DAFTAR_TOKOH_KASUS2.map((id) => [id, pngVite['./kasus2.png'] ?? new URL('./kasus2.png', import.meta.url).href])),
} as Record<IdTokohPiksel, string>;

/** Penyusun dengan manifest & atlas nyata terpasang. */
export const penyusunPiksel = buatPenyusun({
  missRaksa: { json: jsonMiss, url: URL_ATLAS_PIKSEL.missRaksa },
  buRina: { json: jsonRina, url: URL_ATLAS_PIKSEL.buRina },
  hendra: { json: jsonHendra, url: URL_ATLAS_PIKSEL.hendra },
  // Tokoh samping Episode 2: satu atlas bersama, manifest per tokoh.
  ...Object.fromEntries(DAFTAR_TOKOH_SAMPING.map((id) => [id, { json: (jsonSamping as { tokoh: Record<string, unknown> }).tokoh[id], url: URL_ATLAS_PIKSEL[id] }])),
  // T-091: pemeran Investigator kasus 2 (Pak Yusuf, Mas Agus): atlas sendiri, skema manifest yang sama.
  ...Object.fromEntries(DAFTAR_TOKOH_KASUS2.map((id) => [id, { json: (jsonKasus2 as { tokoh: Record<string, unknown> }).tokoh[id], url: URL_ATLAS_PIKSEL[id] }])),
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
export const URL_IKON_PIKSEL: Readonly<Record<IdTokohPikselEp1, string>> = {
  missRaksa: pngVite['./ikon-miss-raksa.png'] ?? new URL('./ikon-miss-raksa.png', import.meta.url).href,
  buRina: pngVite['./ikon-bu-rina.png'] ?? new URL('./ikon-bu-rina.png', import.meta.url).href,
};

/** Ikon kepala mini tokoh pada ukuranPx (skala bulat, kepala utuh), atau null (tanpa ikon: pakai potretTokoh). */
export function ikonTokoh(id: IdTokohPiksel, ekspresi: Ekspresi, ukuranPx: number): PotretTokoh | null {
  return manifestIkon && tokohPikselTersedia(id) ? ikonDari(manifestIkon, id, ekspresi, ukuranPx, (URL_IKON_PIKSEL as Partial<Record<IdTokohPiksel, string>>)[id] ?? '') : null;
}
