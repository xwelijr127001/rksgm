/**
 * Prop bergerak panggung v3 (kunci mobil di meja, kartu polis, pesawat telepon). Sumber utama = prop seni ruang
 * (seni/ruang/prop.ts, satuan dunia pada skala meja, jangkar = titik sentuh meja); di sini hanya penempatan dan
 * gambar CADANGAN sederhana (garis cokelat tua hangat #3a2620, 2 nada) bila prop ruang tidak tersedia.
 * Kunci di TANGAN Bu Rina digambar oleh gambar tokohnya. Tanpa teks/huruf di prop.
 */
import type { IdPropAdegan, TempatProp } from '../../tipe';
import type { Titik } from '../../seni/tokoh';
import { propKartuPolis, propKunci, propTelepon } from '../../seni/ruang';
import { awalanId } from './dunia';
import type { IdPropPiksel, PotonganPiksel } from './piksel';
import { propPikselUntuk } from './sumberPiksel';

export interface GambarProp {
  svg: string;
  w: number;
  h: number;
  jangkar: Titik;
  /** Versi raster (ruang piksel): PNG utuh di kotak w x h, jangkar sama. */
  piksel?: PotonganPiksel;
}

/** Id prop piksel (manifest ruang) untuk prop panggung di tempatnya. Telepon dipakai Miss Raksa = tanpa gagang. */
function idPropPiksel(prop: IdPropAdegan, tempat: TempatProp): IdPropPiksel[] {
  if (prop === 'kunci') return ['kunci'];
  if (prop === 'kartu') return tempat === 'tangan' ? ['kartuTangan', 'kartu'] : ['kartu'];
  return tempat === 'tangan' ? ['teleponTanpaGagang'] : ['telepon'];
}

/**
 * Prop RASTER dari manifest ruang piksel (sumberPiksel.ts), atau null (tanpa manifest / tidak dibangun / PNG gagal).
 * Kartu di tangan = `kartuTangan` bila ada, selain itu kartu meja.
 */
export function gambarPropPiksel(prop: IdPropAdegan, tempat: TempatProp): GambarProp | null {
  for (const id of idPropPiksel(prop, tempat)) {
    const p = propPikselUntuk(id);
    if (p) return { svg: '', w: p.w, h: p.h, jangkar: { ...p.jangkar }, piksel: p.piksel };
  }
  return null;
}

const GARIS = '#3a2620';

function kunci(id: string): GambarProp {
  // Remote kunci mobil + gelang logam + satu anak kunci, tergeletak di meja (sedikit miring).
  const svg = [
    `<defs><linearGradient id="${id}-rem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a52"/><stop offset="1" stop-color="#26262c"/></linearGradient>`,
    `<linearGradient id="${id}-lgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1efe6"/><stop offset="1" stop-color="#a9a698"/></linearGradient></defs>`,
    `<ellipse cx="46" cy="37" rx="40" ry="5" fill="#000" opacity=".16"/>`,
    `<g transform="rotate(-8 46 22)">`,
    `<path d="M8 14 Q8 8 14 8 L34 8 Q40 8 40 14 L40 28 Q40 34 34 34 L14 34 Q8 34 8 28 Z" fill="url(#${id}-rem)" stroke="${GARIS}" stroke-width="2"/>`,
    `<circle cx="18" cy="17" r="3.2" fill="#c9463a"/><circle cx="29" cy="17" r="3.2" fill="#8e8c86"/><rect x="15" y="25" width="17" height="3" rx="1.5" fill="#8e8c86"/>`,
    `<circle cx="47" cy="21" r="7" fill="none" stroke="url(#${id}-lgm)" stroke-width="3"/><circle cx="47" cy="21" r="7" fill="none" stroke="${GARIS}" stroke-width=".8" opacity=".6"/>`,
    `<path d="M53 18 L80 18 L80 21 L76 21 L76 24 L72 24 L72 21 L66 21 L66 24.5 L53 24.5 Z" fill="url(#${id}-lgm)" stroke="${GARIS}" stroke-width="1.6" stroke-linejoin="round"/>`,
    `</g>`,
  ].join('');
  return { svg, w: 90, h: 44, jangkar: { x: 45, y: 40 } };
}

function kartu(id: string, diTangan: boolean): GambarProp {
  // Kartu polis: di meja tergeletak dalam perspektif 3/4 (jajaran genjang); di tangan tegak sedikit miring.
  const muka = diTangan
    ? 'M10 8 L112 2 L118 72 L16 78 Z'
    : 'M4 58 L112 64 L136 18 L30 12 Z';
  const pita = diTangan ? 'M10 8 L112 2 L113.6 20 L11.6 26 Z' : 'M30 12 L136 18 L129 31.8 L23.4 25.6 Z';
  const garis = diTangan
    ? '<path d="M22 38 L98 33 M23 50 L86 46 M24 62 L70 59" stroke="#9aa597" stroke-width="3" stroke-linecap="round"/>'
    : '<path d="M24 38 L100 42 M18 46 L78 50 M13 53 L52 55.5" stroke="#9aa597" stroke-width="3" stroke-linecap="round"/>';
  const svg = [
    `<defs><linearGradient id="${id}-kt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#ebe6d6"/></linearGradient></defs>`,
    diTangan ? '' : '<ellipse cx="70" cy="64" rx="66" ry="7" fill="#000" opacity=".14"/>',
    `<path d="${muka}" fill="url(#${id}-kt)" stroke="${GARIS}" stroke-width="2" stroke-linejoin="round"/>`,
    `<path d="${pita}" fill="#2f7a4f"/>`,
    garis,
    `<path d="${muka}" fill="none" stroke="${GARIS}" stroke-width="2" stroke-linejoin="round"/>`,
  ].join('');
  return diTangan ? { svg, w: 128, h: 82, jangkar: { x: 64, y: 80 } } : { svg, w: 140, h: 72, jangkar: { x: 70, y: 66 } };
}

function telepon(id: string, gagang: boolean): GambarProp {
  // Pesawat telepon meja; gagang di tempatnya bila tidak sedang dipakai Miss Raksa.
  const svg = [
    `<defs><linearGradient id="${id}-tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5c62"/><stop offset="1" stop-color="#2c2d33"/></linearGradient></defs>`,
    `<ellipse cx="62" cy="80" rx="58" ry="7" fill="#000" opacity=".16"/>`,
    `<path d="M12 78 L22 40 Q24 34 30 34 L94 34 Q100 34 102 40 L112 78 Z" fill="url(#${id}-tl)" stroke="${GARIS}" stroke-width="2" stroke-linejoin="round"/>`,
    `<path d="M38 50 L86 50 L90 70 L34 70 Z" fill="#7b7e86" stroke="${GARIS}" stroke-width="1.2"/>`,
    `<g fill="#d9dbe0"><rect x="42" y="54" width="9" height="4" rx="1"/><rect x="57" y="54" width="9" height="4" rx="1"/><rect x="72" y="54" width="9" height="4" rx="1"/>`,
    `<rect x="41" y="62" width="9" height="4" rx="1"/><rect x="57" y="62" width="9" height="4" rx="1"/><rect x="73" y="62" width="9" height="4" rx="1"/></g>`,
    gagang
      ? `<path d="M10 30 Q8 16 22 16 L102 16 Q116 16 114 30 L106 34 Q104 26 96 26 L28 26 Q20 26 18 34 Z" fill="url(#${id}-tl)" stroke="${GARIS}" stroke-width="2" stroke-linejoin="round"/>`
      : `<path d="M18 34 L30 30 L94 30 L106 34" fill="none" stroke="${GARIS}" stroke-width="2"/>`,
  ].join('');
  return { svg, w: 124, h: 88, jangkar: { x: 62, y: 80 } };
}

/** Gambar prop cadangan panggung (bila prop seni ruang tidak tersedia / gagal). */
export function gambarPropCadangan(prop: IdPropAdegan, tempat: TempatProp, id: string): GambarProp {
  if (prop === 'kunci') return kunci(id);
  if (prop === 'kartu') return kartu(id, tempat === 'tangan');
  return telepon(id, tempat !== 'tangan');
}

/**
 * Gambar prop untuk tempatnya; id = awalan unik untuk gradien. Memakai prop seni ruang (seni/ruang: satu keluarga
 * gambar dengan meja), jatuh ke gambar cadangan di atas bila tidak ada / gagal. Gagang telepon yang DIPEGANG Miss
 * Raksa digambar oleh pose `telepon` tokohnya; di meja hanya pesawatnya (tanpa gagang). `piksel` (ruang raster) =
 * prop piksel ruang bila ada (gambarPropPiksel), selain itu SVG yang sama.
 */
export function gambarProp(prop: IdPropAdegan, tempat: TempatProp, id: string, piksel = false): GambarProp {
  if (piksel) {
    const g = gambarPropPiksel(prop, tempat);
    if (g) return g;
  }
  try {
    const p = prop === 'kunci' ? propKunci()
      : prop === 'kartu' ? propKartuPolis(`${id}-kartu`)
        : propTelepon({ gagang: tempat !== 'tangan', id: `${id}-telp` });
    if (p && p.svg && p.w > 0 && p.h > 0) return { svg: awalanId(p.svg, id), w: p.w, h: p.h, jangkar: p.jangkar };
  } catch {
    /* jatuh ke cadangan */
  }
  return gambarPropCadangan(prop, tempat, id);
}

/** Ikon telepon untuk sisipan panggilan (HTML, 24 x 24). */
export const IKON_TELEPON =
  '<path d="M6.6 3.5 9 3a1.2 1.2 0 0 1 1.3.7l1.1 2.7a1.2 1.2 0 0 1-.3 1.3L9.6 9.1a11 11 0 0 0 5.3 5.3l1.4-1.5a1.2 1.2 0 0 1 1.3-.3l2.7 1.1a1.2 1.2 0 0 1 .7 1.3l-.5 2.4a1.3 1.3 0 0 1-1.3 1c-8 0-14.4-6.4-14.4-14.4a1.3 1.3 0 0 1 1.1-1.5Z" fill="currentColor"/>';
