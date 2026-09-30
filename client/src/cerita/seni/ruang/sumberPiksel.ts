/**
 * SUMBER LAPISAN PIKSEL (dipakai alat tools/piksel/bangun-ruang.mjs saja, bukan panggung): lapisan SVG gaya piksel
 * per lokasi (kotak dunia kelipatan 4, urutan z panggung), prop mandiri, kotak teks plakat, tempat. Alat merendernya
 * dengan supersampel di Chrome lalu mengkuantisasi per sel 4 × 4 satuan ke palet ruang bersama.
 */
import { DAFTAR_LOKASI_ADEGAN, type IdLokasiAdegan } from '../../tipe';
import { denganGaya } from './alat';
import { PIKSEL } from './geometri';
import { ruangGayaPiksel } from './index';
import { propCangkir, propGagang, propKartuPolis, propKartuTangan, propKunci, propMap, propTelepon, type PropRuang } from './prop';
import type { RuangAdegan, TempatAdegan } from './tipe';
import type { Titik } from '../tokoh/tipe';

export type IdLapisanPiksel = 'latar' | 'koridor' | 'daun' | 'belakangMeja' | 'depanMeja' | 'kursiBelakang';
/** z panggung (ui/panggung/dunia.ts `Z`), disalin ke manifest supaya urutan lapisan piksel eksplisit. */
export const Z_LAPISAN: Record<IdLapisanPiksel, number> = { latar: 10, koridor: 20, daun: 30, belakangMeja: 50, depanMeja: 60, kursiBelakang: 70 };

export interface LapisanSumber {
  id: IdLapisanPiksel;
  svg: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  /** Buram penuh (latar, koridor, daun): tanpa alpha. Lainnya alpha biner. */
  buram: boolean;
  /** Garis luar 1 piksel di tepi siluet (di dalam kotak lapisan). */
  garisLuar: boolean;
  engsel?: Titik;
}

export type IdPropPiksel = 'kartu' | 'kartuTangan' | 'kunci' | 'telepon' | 'teleponTanpaGagang' | 'gagang' | 'map' | 'cangkir';
export interface PropSumber extends PropRuang {
  id: IdPropPiksel;
  /** Prop yang SUDAH tergambar di lapisan (map di belakangMeja; cangkir di belakangMeja lokasi telepon). */
  diLapisan?: { lapisan: IdLapisanPiksel; lokasi: IdLokasiAdegan[] };
}

export interface LokasiSumber {
  lokasi: IdLokasiAdegan;
  lapisan: LapisanSumber[];
  papan?: RuangAdegan['papanNama'];
  tempat: TempatAdegan;
  bukaan?: { x: number; y: number; w: number; h: number };
}

const kelipatan = (v: number) => Math.abs(v / PIKSEL - Math.round(v / PIKSEL)) < 1e-9;

function lapisanDari(r: RuangAdegan): LapisanSumber[] {
  const daftar: [IdLapisanPiksel, RuangAdegan['latar'] | undefined][] = [
    ['latar', r.latar],
    ['koridor', r.koridor],
    ['daun', r.pintu?.daun],
    ['belakangMeja', r.belakangMeja],
    ['depanMeja', r.depanMeja],
    ['kursiBelakang', r.kursi?.belakang],
  ];
  const hasil: LapisanSumber[] = [];
  for (const [id, l] of daftar) {
    if (!l) continue;
    for (const v of [l.x, l.y, l.w, l.h]) if (!kelipatan(v)) throw new Error(`${r.lokasi}.${id}: kotak ${[l.x, l.y, l.w, l.h]} bukan kelipatan ${PIKSEL}`);
    const buram = id === 'latar' || id === 'koridor' || id === 'daun';
    hasil.push({
      id, svg: l.svg, x: l.x, y: l.y, w: l.w, h: l.h, z: Z_LAPISAN[id], buram,
      garisLuar: !buram,
      engsel: id === 'daun' ? r.pintu!.engsel : undefined,
    });
  }
  return hasil;
}

export function sumberPiksel(): { lokasi: LokasiSumber[]; prop: PropSumber[] } {
  const lokasi = DAFTAR_LOKASI_ADEGAN.map((lok): LokasiSumber => {
    const r = ruangGayaPiksel(lok);
    return { lokasi: lok, lapisan: lapisanDari(r), papan: r.papanNama, tempat: r.tempat, bukaan: r.pintu?.bukaan };
  });
  const prop = denganGaya('piksel', (): PropSumber[] => [
    { id: 'kartu', ...propKartuPolis('rg-kartu') },
    { id: 'kartuTangan', ...propKartuTangan('rg-kartu-tangan') },
    { id: 'kunci', ...propKunci() },
    { id: 'telepon', ...propTelepon({ gagang: true, id: 'rg-telp' }) },
    { id: 'teleponTanpaGagang', ...propTelepon({ gagang: false, id: 'rg-telp0' }) },
    { id: 'gagang', ...propGagang() },
    { id: 'map', ...propMap('rg-map') },
    { id: 'cangkir', ...propCangkir(), diLapisan: { lapisan: 'belakangMeja', lokasi: ['telepon'] } },
  ]);
  return { lokasi, prop };
}
