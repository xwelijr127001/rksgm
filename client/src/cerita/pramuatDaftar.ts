/**
 * T-047: WHAT the story preloader fetches for the playable case (auto-2). Imported dynamically by PramuatCerita, so these
 * manifests do not enter the main bundle (they are already part of the story chunk).
 * - gambar: every PNG the episode shows: pixel rooms (layers, props, committee atlas + sign), character atlases + icons, phone
 *   hand / POV art, and the CSS-only pictures (WhatsApp truck photo, SIM card, office board, committee icon). Same hashed URLs
 *   as the CSS / modules (Vite dedupes the asset), small files inlined as data: are skipped.
 * - awal: the first composition of the story (resume state when there is saved progress) = the first-screen pictures.
 */
import { cariEpisode } from './episode';
import { stateAwal } from './mesin';
import { muatProgres } from './simpan';
import { URL_ATLAS_PIKSEL, URL_IKON_PIKSEL } from './seni/piksel';
import { RUANG_PIKSEL } from './ui/latar/piksel/ruang';
import { SENI_TELEPON } from './ui/latar/piksel/teleponTangan';
import { komposisiAwal, urlKomposisi } from './ui/latar/hangatkan';
import urlPov from './seni/piksel/telepon/pov-366x229.png';
import urlFotoTruk from './seni/aktivitas/obrolan/foto-truk.png';
import urlSimDepan from './seni/aktivitas/sim/sim-depan.png';
import urlPapanKantor from './seni/piksel/ep2-papan-kantor.png';
import urlKomiteIkon from './seni/piksel/komite-ikon.png';

export const EPISODE_PRAMUAT = 'auto-2';

const sah = (u: string | undefined): u is string => !!u && !u.startsWith('data:') && !u.startsWith('file:');

export function daftarPramuat(): { gambar: string[]; awal: string[] } {
  const ep = cariEpisode(EPISODE_PRAMUAT);
  if (!ep) return { gambar: [], awal: [] };
  const u = new Set<string>();
  for (const r of Object.values(RUANG_PIKSEL)) {
    for (const l of r.lapisan) u.add(l.url);
    for (const p of Object.values(r.prop)) if (p) u.add(p.url);
    if (r.komite) { u.add(r.komite.url); u.add(r.komite.tanda.url); }
  }
  for (const x of Object.values(URL_ATLAS_PIKSEL)) u.add(x);
  for (const x of Object.values(URL_IKON_PIKSEL)) u.add(x);
  u.add(SENI_TELEPON.lengan.url); u.add(SENI_TELEPON.punggung.url); u.add(SENI_TELEPON.gelembung.url);
  for (const x of [urlPov, urlFotoTruk, urlSimDepan, urlPapanKantor, urlKomiteIkon]) u.add(x);
  let awal: string[] = [];
  try {
    const m = muatProgres(ep);
    awal = urlKomposisi(ep, komposisiAwal(ep, m.status === 'lanjut' ? m.state : stateAwal(ep))).filter(sah);
  } catch { awal = []; }
  return { gambar: [...u].filter(sah), awal };
}

/** Same decode cache the pixel stage reads (a preloaded picture is not fetched or decoded twice). */
export { muatPng } from './ui/latar/piksel/muat';
