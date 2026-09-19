/**
 * Misi acara 5 - Kerusakan Sama, Nasib Beda (meja kerja di Kantor Raksa).
 * Mekanik: langkah `persen` dijawab lewat chip angka di panel (tanpa papan: dinding penuh rak
 * stempel); langkah `simpul` = MEJA STEMPEL misi 5 dengan TIGA map. Ketuk map kasus, lalu ketuk
 * salah satu dari tiga stempel di rak; stiker kesimpulan menempel di atas map.
 *
 * Dipakai ulang dari m05-kantor.ts: latar (diparametrikan menjadi tiga alas -> kunci `a05-latar`),
 * tiga stempel (gambar & kunci tekstur m05 apa adanya karena SVG identik), map kasus, kartu polis.
 *
 * Tata letak (dunia 640 x 480), tiga kolom berpusat di x 112 / 320 / 528 (jarak 208):
 * - Belakang meja : rak stempel misi 5 (urutan = urutan kategori misi).
 * - Tiap alas     : map kasus di tengah kolom (stiker terlebar "Di bawah ambang" sekitar 178 masih
 *                   muat di dalam kolom dan di dalam adegan), label map di bawahnya, lalu satu
 *                   baris kartu polis kecil + labelnya DI SAMPING kartu. Dua label berdampingan
 *                   (sekitar 117 + 108) tidak muat dalam satu kolom, jadi barisnya dipisah.
 * - Petugas berdiri di celah antara baris kartu A dan B, jadi kepalanya (atas y 374) tidak
 *   tertutup label.
 */

import type { SceneObjectSpec, SceneSpec } from '../../types';
import { P, art } from '../../art/kit';
import {
  SKALA_STEMPEL, STEMPEL_X, STEMPEL_Y, TINTA_STEMPEL,
  kartuPolis, latar, mapKasus, stempel,
  type AlasKerja,
} from '../m05-kantor';

const KOLOM_X = [112, 320, 528] as const;
const HURUF = ['A', 'B', 'C'] as const;

/** Alas kerja per kolom: lebar 200, dari bawah zona stiker sampai bawah baris kartu polis. */
const ALAS: readonly AlasKerja[] = KOLOM_X.map((x): AlasKerja => [x - 100, 204, 200, 190]);

/** Map kasus misi 5 (160 x 118) diperkecil supaya tiga kolom muat. */
const SKALA_MAP = 0.75;
const MAP_W = 120;
const MAP_H = 89;
/**
 * Atas map 216,5: stiker (192 - 225; ujungnya naik sekitar 6 karena miring) tetap di bawah label
 * stempel (bawah 181,5).
 */
const MAP_Y = 261;
/** Label map naik 4 (hanya menutup bayangan map, pola m10) supaya baris kartu muat di bawahnya. */
const LABEL_MAP_DY = -4;

/** Kartu polis misi 5 (104 x 80) diperkecil; labelnya ditaruh di kanan kartu, bukan di bawah. */
const SKALA_KARTU = 0.6;
const KARTU_W = 63;
const KARTU_H = 48;
/** Baris kartu (y 339 - 387) mulai 2,5 di bawah label map (bawah 336,5). */
const KARTU_Y = 363;
/**
 * Kartu di kiri kolom (x kolom - 95,5 s.d. - 32,5); label (lebar 108 - 118) mengisi sisa kolom di
 * kanannya dan berhenti sebelum x kolom + 87, jadi celah tempat petugas berdiri tetap kosong.
 */
const KARTU_DX = -64;
const LABEL_KARTU_DX = 92;
const MIRING_KARTU = [-4, 3, -3] as const;

/**
 * Perkecil gambar misi 5 tanpa ikut menipiskan garis tepinya: tebal tinta dikembalikan ke
 * 3/2 satuan dunia (kebalikan dari trik stempel() di m05-kantor.ts).
 */
function perkecil(isi: string, s: number): string {
  const tebal = (n: number): string => `stroke="${P.tinta}" stroke-width="${(n / s).toFixed(2)}"`;
  const tepi = isi
    .split(`stroke="${P.tinta}" stroke-width="3"`).join(tebal(3))
    .split(`stroke="${P.tinta}" stroke-width="2"`).join(tebal(2));
  return `<g transform="scale(${s})">${tepi}</g>`;
}

function buat(): SceneSpec {
  const sw = Math.round(56 * SKALA_STEMPEL);
  const sh = Math.round(70 * SKALA_STEMPEL);
  const [xLanjut, xAmbang, xData] = STEMPEL_X;

  const map = HURUF.map((h, i): SceneObjectSpec => ({
    id: `map-${h.toLowerCase()}`, role: 'item', stepId: 'simpul', refId: `kasus-${h.toLowerCase()}`, fx: 'stamp',
    x: KOLOM_X[i]!, y: MAP_Y,
    art: art(`a05-map-${h.toLowerCase()}`, MAP_W, MAP_H, perkecil(mapKasus(h), SKALA_MAP)),
    label: `Kasus ${h}`, labelDy: LABEL_MAP_DY, depth: 20,
    // Area sentuh (y 198 - 324) ikut mencakup stiker di atas map dan sebagian besar labelnya,
    // tetapi berhenti sebelum area sentuh kartu polis (mulai y 325).
    hit: { w: MAP_W + 8, h: 126 },
  }));

  const kartu = HURUF.map((h, i): SceneObjectSpec => ({
    id: `kartu-${h.toLowerCase()}`, role: 'doc', refId: `polis-${h.toLowerCase()}`,
    x: KOLOM_X[i]! + KARTU_DX, y: KARTU_Y,
    art: art(`a05-kartu-${h.toLowerCase()}`, KARTU_W, KARTU_H, perkecil(kartuPolis(h, MIRING_KARTU[i]!), SKALA_KARTU)),
    label: `Polis ${h}`, depth: 22,
    // Engine menaruh label di bawah gambar; geser ke kanan kartu, sejajar tengahnya.
    labelDx: LABEL_KARTU_DX, labelDy: -(KARTU_H / 2 + 18),
    // Area sentuh selalu berpusat di kartu (x kolom - 120 s.d. - 8, y 325 - 401): dilebarkan supaya
    // penanda dokumen di ujung kiri label ikut bisa diketuk. Tidak lebih lebar dari ini, karena sisi
    // kirinya akan menimpa label kartu kolom sebelah (ujung kanannya sekitar x kolom - 120).
    hit: { w: 112, h: 76 },
  }));

  return {
    missionId: 'a05-nasib-beda',
    background: art('a05-latar', 640, 480, latar(ALAS)),
    // Celah antara baris kartu A (label berakhir sekitar x 199, y 380) dan kartu B (mulai x 224,5):
    // kepala petugas (atas y 374) tidak tertutup label dan tidak menutupi kartu.
    hero: { x: 211, y: 478 },
    walk: { minX: 60, maxX: 580, minY: 462, maxY: 478 },
    bucketShort: {
      'simpul:lanjut': 'Lanjut dinilai',
      'simpul:tidak-ambang': 'Di bawah ambang',
      'simpul:perlu-data': 'Perlu info',
    },
    objects: [
      // ---- kesimpulan: tiga stempel misi 5 di rak (urutan sama dengan urutan kategori misi)
      {
        id: 'stempel-lanjut', role: 'bucket', stepId: 'simpul', refId: 'lanjut',
        x: xLanjut, y: STEMPEL_Y, art: art('m05-stempel-lanjut', sw, sh, stempel(TINTA_STEMPEL.lanjut, 'cek')),
        label: 'Lanjut dinilai', depth: 20,
      },
      {
        id: 'stempel-ambang', role: 'bucket', stepId: 'simpul', refId: 'tidak-ambang',
        x: xAmbang, y: STEMPEL_Y, art: art('m05-stempel-ambang', sw, sh, stempel(TINTA_STEMPEL['tidak-ambang'], 'silang')),
        label: 'Di bawah ambang', depth: 20,
      },
      {
        id: 'stempel-data', role: 'bucket', stepId: 'simpul', refId: 'perlu-data',
        x: xData, y: STEMPEL_Y, art: art('m05-stempel-data', sw, sh, stempel(TINTA_STEMPEL['perlu-data'], 'tanya')),
        label: 'Perlu info', depth: 20,
      },
      // ---- kasus: tiga map sama besar, satu per alas
      ...map,
      // ---- dokumen: kartu polis kecil di bawah map masing-masing
      ...kartu,
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a05-nasib-beda', buat };
