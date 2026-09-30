/**
 * IKON KEPALA MINI (murni, tanpa DOM): potret bulat di bawah 44 px CSS (Riwayat 32, label "Pelajaran" kartu akhir 32)
 * memakai ikon yang digambar tangan (tools/piksel/bangun-ikon.mjs -> ikon.json + ikon-<tokoh>.png), BUKAN jendela 1:1
 * atlas tokoh: jendela 28/32 piksel seni hanya memuat wajah (kepala ± 54 piksel seni), sanggul Miss Raksa & hijab
 * Bu Rina hilang dan di ukuran nyata terbaca sebagai cakram kulit.
 *
 * Manifest ikon.json: { versi, sisi (32), isi (28 = diameter lingkaran isi yang dirancang), tokoh: { <IdTokohPiksel>:
 * { gambar, ukuranAtlas: [w, h], wajah: [x, y, w, h] (kotak tempelan ekspresi), ekspresi: { <wajah>: [x, y] },
 * ekspresiDari?: { <ekspresi cerita>: <wajah> } } } }. Satu piksel ikon = 1 px CSS pada slot 32 (x dpr bulat).
 *
 * Skala SELALU bulat: s = max(1, floor(ukuranPx / sisi)) sehingga seluruh ikon (kepala utuh) muat di lingkaran;
 * kotak tampil pas `ukuranPx` (viewBox u/s piksel ikon) dengan pinggir transparan bila ukuranPx > sisi x s (dpr
 * pecahan), dipusatkan ke tengah ikon pada kelipatan 1/s (tepi piksel tetap di piksel tampil bulat).
 */
import type { Ekspresi } from '../../tipe';
import type { IdTokohPiksel, KotakSeni, PotretTokoh } from './susun';

export interface IkonTokoh {
  gambar: string;
  atlas: { w: number; h: number };
  wajah: KotakSeni;
  /** Sel atlas (pojok kiri-atas, piksel ikon) per wajah ikon. */
  sel: Record<string, { x: number; y: number }>;
  ekspresiDari: Record<string, string>;
}

export interface ManifestIkon {
  sisi: number;
  isi: number;
  tokoh: Partial<Record<IdTokohPiksel, IkonTokoh>>;
}

const angka = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const pasangan = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length >= 2 && angka(v[0]) && angka(v[1]) ? [v[0], v[1]] : null);

/** Baca manifest ikon dengan toleran; null = tidak ada / cacat (potret kecil kembali ke jendela manifest tokoh). */
export function bacaManifestIkon(json: unknown): ManifestIkon | null {
  const m = obj(json);
  if (!m || !angka(m.sisi) || m.sisi < 8 || !angka(m.isi)) return null;
  const sisi = Math.round(m.sisi);
  const tokoh: ManifestIkon['tokoh'] = {};
  for (const id of ['missRaksa', 'buRina'] as const) {
    const t = obj(obj(m.tokoh)?.[id]);
    if (!t || typeof t.gambar !== 'string') continue;
    const ua = pasangan(t.ukuranAtlas);
    const w = Array.isArray(t.wajah) && t.wajah.length === 4 && t.wajah.every(angka) ? (t.wajah as number[]) : null;
    if (!ua || !w) continue;
    const sel: IkonTokoh['sel'] = {};
    for (const [e, v] of Object.entries(obj(t.ekspresi) ?? {})) {
      const p = pasangan(v);
      if (p && p[0] >= 0 && p[1] >= 0 && p[0] + sisi <= ua[0] && p[1] + sisi <= ua[1]) sel[e] = { x: p[0], y: p[1] };
    }
    if (!Object.keys(sel).length) continue;
    const ekspresiDari: Record<string, string> = {};
    for (const [e, v] of Object.entries(obj(t.ekspresiDari) ?? {})) if (typeof v === 'string' && sel[v]) ekspresiDari[e] = v;
    tokoh[id] = { gambar: t.gambar, atlas: { w: ua[0], h: ua[1] }, wajah: { x: w[0]!, y: w[1]!, w: w[2]!, h: w[3]! }, sel, ekspresiDari };
  }
  return Object.keys(tokoh).length ? { sisi, isi: m.isi, tokoh } : null;
}

/** Wajah ikon untuk ekspresi cerita: peta ekspresiDari, nama sama, lalu 'netral', lalu wajah pertama. */
export function wajahIkon(t: IkonTokoh, ekspresi: Ekspresi | string): string {
  const e = String(ekspresi);
  return t.ekspresiDari[e] ?? (t.sel[e] ? e : t.sel.netral ? 'netral' : Object.keys(t.sel)[0]!);
}

/**
 * Potret ikon `ukuranPx` px (px tampil: px CSS pada dpr bulat, px perangkat pada dpr pecahan) dalam bentuk PotretTokoh
 * (satu lapisan = sel ikon), jadi svgPotret / PotretPiksel memakainya tanpa jalur kedua. null = tokoh tanpa ikon.
 */
export function ikonDari(m: ManifestIkon, id: IdTokohPiksel, ekspresi: Ekspresi, ukuranPx: number, url: string): PotretTokoh | null {
  const t = m.tokoh[id];
  if (!t || !url) return null;
  const S = m.sisi;
  const u = Number.isFinite(ukuranPx) && ukuranPx >= 1 ? Math.round(ukuranPx) : 1;
  const wajah = wajahIkon(t, ekspresi);
  const c = t.sel[wajah]!;
  const skala = Math.max(1, Math.floor(u / S));
  // Kotak tampil u/skala piksel ikon, dipusatkan pada tengah ikon; pojoknya dibulatkan ke kelipatan 1/skala (= piksel
  // tampil bulat) supaya tepi piksel ikon tetap di piksel perangkat bulat.
  const w = u / skala;
  const x0 = Math.floor(((S - w) / 2) * skala) / skala;
  const sisi = Math.ceil(w);
  const tampil = sisi * skala;
  const potong = tampil - u;
  return {
    tokoh: id,
    url,
    atlas: { ...t.atlas },
    frame: 'ikon',
    ekspresi: wajah,
    mata: 'buka',
    mulut: 'tutup',
    hadap: 'kiri',
    lapisan: [{ jenis: 'tubuh', sumber: { x: c.x, y: c.y, w: S, h: S }, x: 0, y: 0 }],
    jendela: { x: Math.floor(x0), y: Math.floor(x0), sisi },
    skala,
    tampil,
    ukuranPx: u,
    potong,
    viewBox: { x: x0, y: x0, w, h: w },
    asal: `ikon.${S}`,
    cadangan: [],
  };
}
