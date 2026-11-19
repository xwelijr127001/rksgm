/**
 * Misi acara 5 - Kerusakan Sama, Nasib Beda (meja kerja di Kantor Raksa).
 * Mekanik: langkah `persen` dijawab lewat chip angka di panel (tanpa papan: dinding penuh rak
 * stempel); langkah `simpul` = MEJA STEMPEL misi 5 dengan TIGA map. Ketuk map kasus, lalu ketuk
 * salah satu dari tiga stempel di rak; stiker kesimpulan menempel di atas map.
 *
 * Dari m05-kantor.ts hanya posisi & warna tinta stempel (STEMPEL_X/Y, TINTA_STEMPEL); gambar = seni piksel (T-061b).
 *
 * Tata letak (dunia 640 x 480), tiga kolom berpusat di x 112 / 320 / 528 (jarak 208):
 * - Belakang meja : rak stempel misi 5 (urutan = urutan kategori misi).
 * - Tiap alas     : map kasus di tengah kolom (stiker terlebar "Di bawah ambang" sekitar 178 masih
 *                   muat di dalam kolom dan di dalam adegan), label map di bawahnya, lalu satu
 *                   baris kartu polis kecil + labelnya DI SAMPING kartu. Dua label berdampingan
 *                   (sekitar 117 + 108) tidak muat dalam satu kolom, jadi barisnya dipisah.
 * - Petugas berdiri di celah antara baris kartu A dan B, jadi kepalanya (atas y 374) tidak
 *   tertutup label.
 *
 * T-061b: gaya PIKSEL kasus 1 (k = 2). Latar, stempel, map, dan kartu = seni piksel (./a05.piksel.ts); tata letak, id, label
 * (id/en/zh), kategori, dan perilaku TIDAK berubah (map 120 x 88 dan kartu 64 x 48: selisih <= 1 dunia dari ukuran lama).
 */

import type { ArtRef, SceneObjectSpec, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { STEMPEL_X, STEMPEL_Y, TINTA_STEMPEL } from '../m05-kantor';
import { kartuA05, latarA05, mapA05, stempelA05, type AlasA05 } from './a05.piksel';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

const KOLOM_X = [112, 320, 528] as const;
const HURUF = ['A', 'B', 'C'] as const;

/** Alas kerja per kolom: lebar 200, dari bawah zona stiker sampai bawah baris kartu polis. */
const ALAS: readonly AlasA05[] = KOLOM_X.map((x): AlasA05 => [x - 100, 204, 200, 190]);

/** Map kasus (piksel 30 x 22 sel = 120 x 88; dulu 120 x 89). */
const MAP_W = 120; // tinggi 88
/**
 * Atas map 217: stiker (192 - 225; ujungnya naik sekitar 6 karena miring) tetap di bawah label
 * stempel (bawah 181,5).
 */
const MAP_Y = 261;
/** Label map naik 4 (hanya menutup bayangan map, pola m10) supaya baris kartu muat di bawahnya. */
const LABEL_MAP_DY = -4;

/** Kartu polis kecil (piksel 16 x 12 sel = 64 x 48); labelnya ditaruh di kanan kartu, bukan di bawah. */
const KARTU_H = 48;
/** Baris kartu (y 339 - 387) mulai 2,5 di bawah label map (bawah 336,5). */
const KARTU_Y = 363;
/**
 * Kartu di kiri kolom (x kolom - 96 s.d. - 32); label (lebar 108 - 118) mengisi sisa kolom di
 * kanannya dan berhenti sebelum x kolom + 87, jadi celah tempat petugas berdiri tetap kosong.
 */
const KARTU_DX = -64;
const LABEL_KARTU_DX = 92;
const MIRING_KARTU = [-4, 3, -3] as const;

function buat(): SceneSpec {
  const [xLanjut, xAmbang, xData] = STEMPEL_X;

  const map = HURUF.map((h, i): SceneObjectSpec => ({
    id: `map-${h.toLowerCase()}`, role: 'item', stepId: 'simpul', refId: `kasus-${h.toLowerCase()}`, fx: 'stamp',
    x: KOLOM_X[i]!, y: MAP_Y,
    art: gambar(`a05-map-${h.toLowerCase()}-piksel`, mapA05(h)),
    label: `Kasus ${h}`, labelDy: LABEL_MAP_DY, depth: 20,
    // Area sentuh (y 198 - 324) ikut mencakup stiker di atas map dan sebagian besar labelnya,
    // tetapi berhenti sebelum area sentuh kartu polis (mulai y 325).
    hit: { w: MAP_W + 8, h: 126 },
  }));

  const kartu = HURUF.map((h, i): SceneObjectSpec => ({
    id: `kartu-${h.toLowerCase()}`, role: 'doc', refId: `polis-${h.toLowerCase()}`,
    x: KOLOM_X[i]! + KARTU_DX, y: KARTU_Y,
    art: gambar(`a05-kartu-${h.toLowerCase()}-piksel`, kartuA05(h, MIRING_KARTU[i]!)),
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
    // T-061b: gaya piksel kasus 1 (k = 2): dinding kantor Episode 2 + meja kerja piksel (./a05.piksel.ts, ./a05.gen.ts).
    gaya: 'piksel',
    background: gambar('a05-latar-piksel', latarA05(ALAS)),
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
        x: xLanjut, y: STEMPEL_Y, art: gambar('a05-stempel-lanjut-piksel', stempelA05(TINTA_STEMPEL.lanjut, 'cek')),
        label: 'Lanjut dinilai', depth: 20,
        // T-061b: pil 'Lanjut dinilai' (~195) di x 104 berjarak 6,5 dari tepi kiri: geser 3 -> tepi 9,5.
        labelDx: 3,
      },
      {
        id: 'stempel-ambang', role: 'bucket', stepId: 'simpul', refId: 'tidak-ambang',
        x: xAmbang, y: STEMPEL_Y, art: gambar('a05-stempel-ambang-piksel', stempelA05(TINTA_STEMPEL['tidak-ambang'], 'silang')),
        label: 'Di bawah ambang', depth: 20,
      },
      {
        id: 'stempel-data', role: 'bucket', stepId: 'simpul', refId: 'perlu-data',
        x: xData, y: STEMPEL_Y, art: gambar('a05-stempel-data-piksel', stempelA05(TINTA_STEMPEL['perlu-data'], 'tanya')),
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
