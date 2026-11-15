/**
 * Manifest RUANG PIKSEL Episode 2 (seni/piksel/ruang-ep2.json (PNG ep2-ruang-*.png: awalan berbeda supaya glob ruang-*.png Episode 1 tidak menyentuhnya), tools/piksel/bangun-ruang-ep2.mjs) + URL PNG-nya. Terpisah dari
 * ruang.json Episode 1 (panggung Episode 1 tidak pernah memuat berkas ini). Dibaca toleran: lapisan/prop cacat dilewati
 * dengan catatan; ruang tanpa latar sah = tidak tersedia (adegan tetap ilustrasi, lihat PanggungLatarPiksel).
 */
import json from '../../../seni/piksel/ruang-ep2.json';
import type { Kotak } from '../../panggung/dunia';

let pngVite: Record<string, string> = {};
try {
  pngVite = import.meta.glob('../../../seni/piksel/ep2-ruang-*.png', { eager: true, query: '?url', import: 'default' });
} catch {
  /* bukan Vite (tes node) */
}
const urlBerkas = (berkas: string): string =>
  pngVite[`../../../seni/piksel/${berkas}`] ?? new URL(`../../../seni/piksel/${berkas}`, import.meta.url).href;

/** Satuan dunia per piksel seni (sama dengan panggung Episode 1). */
export const SATUAN_RUANG = 4;

export interface LapisanRuangPiksel {
  id: string;
  url: string;
  /** Kotak dunia. */
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface RuangPiksel {
  id: string;
  warnaTepi: string;
  lapisan: LapisanRuangPiksel[];
  prop: Record<string, LapisanRuangPiksel>;
  /** Titik kaki tokoh per tempat (dunia). */
  tempat: Record<string, { x: number; y: number }>;
  /** Slot berdiri per jumlah tokoh: slot[n][i] = titik kaki tokoh ke-i dari n. */
  slot: Record<number, { x: number; y: number; hadap: 'kiri' | 'kanan'; /** x khusus per pemeran (mis. Hendra di sampul pool). */ xTokoh?: Record<string, number> }[]>;
  /** Kotak dunia yang wajib terlihat (titik cerita: pembatas retak, kabin trailer). */
  fokus: Kotak | null;
  papan: { kotak: Kotak; teksKunci: string; warna: string } | null;
  bingkai: { hp: Kotak; lebar: Kotak };
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const n = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const kotak = (v: unknown): Kotak | null => { const o = obj(v); return o && n(o.x) && n(o.y) && n(o.w) && n(o.h) ? { x: o.x, y: o.y, w: o.w, h: o.h } : null; };

/** Lapisan sah: berkas + kotak dunia = PNG x 4 (tanpa skala pecahan). */
function lapisan(id: string, v: unknown, catatan: string[]): LapisanRuangPiksel | null {
  const o = obj(v);
  const k = kotak(o);
  if (!o || !k || typeof o.berkas !== 'string' || !n(o.pw) || !n(o.ph) || o.pw * SATUAN_RUANG !== k.w || o.ph * SATUAN_RUANG !== k.h) {
    catatan.push(`lapisan ${id} tidak sah`);
    return null;
  }
  return { id, url: urlBerkas(o.berkas), ...k, z: n(o.z) ? o.z : 10 };
}

export function bacaRuangPiksel(m: unknown, catatan: string[] = []): Record<string, RuangPiksel> {
  const hasil: Record<string, RuangPiksel> = {};
  const root = obj(m);
  if (!root || root.piksel !== SATUAN_RUANG) { catatan.push('manifest ruang-ep2 tidak sah'); return hasil; }
  const tepiUmum = typeof root.warnaTepi === 'string' ? root.warnaTepi : '#c4915d';
  for (const [id, v] of Object.entries(obj(root.lokasi) ?? {})) {
    const o = obj(v)!;
    const lap = (Array.isArray(o.lapisan) ? o.lapisan : []).map((x) => lapisan(String(obj(x)?.id ?? '?'), x, catatan)).filter((x): x is LapisanRuangPiksel => !!x);
    if (!lap.some((x) => x.id === 'latar')) { catatan.push(`ruang ${id}: tanpa latar`); continue; }
    const prop: Record<string, LapisanRuangPiksel> = {};
    for (const [p, pv] of Object.entries(obj(o.prop) ?? {})) { const l = lapisan(p, pv, catatan); if (l) prop[p] = l; }
    const tempat: Record<string, { x: number; y: number }> = {};
    for (const [t, tv] of Object.entries(obj(o.tempat) ?? {})) { const q = obj(tv); if (q && n(q.x) && n(q.y)) tempat[t] = { x: q.x, y: q.y }; }
    const papanO = obj(o.papan);
    const papanK = kotak(papanO?.kotak);
    const b = obj(o.bingkai);
    const slot: RuangPiksel['slot'] = {};
    for (const [kk, v2] of Object.entries(obj(o.slot) ?? {})) if (Array.isArray(v2)) slot[Number(kk)] = v2.map(obj).filter((q): q is Obj => !!q && n(q.x) && n(q.y)).map((q) => ({ x: q.x as number, y: q.y as number, hadap: q.hadap === 'kiri' ? 'kiri' as const : 'kanan' as const, ...(obj(q.xTokoh) ? { xTokoh: obj(q.xTokoh) as Record<string, number> } : {}) }));
    hasil[id] = {
      id,
      warnaTepi: typeof o.warnaTepi === 'string' ? o.warnaTepi : tepiUmum,
      slot,
      fokus: kotak(o.fokus),
      lapisan: lap.sort((a, c) => a.z - c.z),
      prop,
      tempat,
      papan: papanK && typeof papanO?.teksKunci === 'string' ? { kotak: papanK, teksKunci: papanO.teksKunci, warna: typeof papanO.warna === 'string' ? papanO.warna : '#ffffff' } : null,
      bingkai: { hp: kotak(b?.hp) ?? { x: 300, y: 0, w: 1000, h: 900 }, lebar: kotak(b?.lebar) ?? { x: 0, y: 0, w: 1600, h: 900 } },
    };
  }
  return hasil;
}

export const CATATAN_RUANG: string[] = [];
export const RUANG_PIKSEL: Readonly<Record<string, RuangPiksel>> = bacaRuangPiksel(json, CATATAN_RUANG);
