/**
 * Misi 5 - Polisnya yang Mana? (meja kerja di Kantor Raksa).
 * Mekanik: MEJA STEMPEL. Ketuk map kasus (A/B), lalu ketuk salah satu dari tiga
 * stempel di rak untuk memberi kesimpulan; stiker kesimpulan menempel di atas map.
 * Kartu polis di samping tiap map membuka kartu polis di panel.
 *
 * Tata letak (dunia 640 x 480):
 * - Belakang meja : rak stempel, tiga stempel sama besar (urutan = urutan kategori misi).
 * - Depan meja    : dua alas; tiap alas berisi satu pasangan kartu polis + map kasus,
 *                   dicerminkan (Polis A | Kasus A  ...  Kasus B | Polis B).
 * - Petugas berdiri di celah tengah depan meja; Raki di pojok kanan atas.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, circle, cloud, line, path, rect, rrect, shadow, text } from '../art/kit';
import { stamp } from '../art/props';
import { carSide } from '../art/vehicles';

/** Warna tinta stempel: sengaja netral (bukan hijau/merah) dan sama dengan warna stiker kategori. */
const TINTA_STEMPEL = { lanjut: '#2f6fb0', 'tidak-ambang': '#7a5aa6', 'perlu-data': '#b26b1f' } as const;
/** Skala stempel dari props.stamp() (56 x 70) supaya titik sentuh cukup besar di HP. */
const SKALA_STEMPEL = 1.5;

// ---- tata letak (dunia 640 x 480)
/**
 * Tiga stempel berjarak SAMA (188), titik tengah rak = stempel tengah.
 * y 94: label stempel (bawah 180) tetap di atas keterangan aksi yang muncul di atas map.
 */
// Jarak stempel memberi ruang untuk tiga label kategori berdampingan tanpa bersinggungan.
const STEMPEL_X = [104, 308, 512] as const;
const STEMPEL_Y = 94;
const MAP_W = 160;
const MAP_H = 118;
/**
 * Map simetris terhadap petugas (x 320). y 298 supaya cincin fokus (map + 12 + tebal 3)
 * berakhir di atas kepala petugas yang berdiri di y 478.
 */
const MAP_X = { A: 222, B: 418 } as const;
const MAP_Y = 298;
const KARTU_W = 104;
const KARTU_H = 80;
/** Kartu di sisi luar map; titik ketuknya (pojok kanan atas) tidak menyentuh cincin fokus map A. */
const KARTU_X = { A: 64, B: 576 } as const;
const KARTU_Y = 302;

const DINDING = '#f4ead6';
const MEJA = '#e0bd92';
const ALAS = '#efdcba';
const ALAS_BIBIR = '#dcc193';

/** Alas kerja (latar, tanpa garis tepi): bibir bawah sedikit lebih gelap memberi kesan tebal. */
function alas(x: number, y: number, w: number, h: number): string {
  return rrect(x, y + 5, w, h, 16, ALAS_BIBIR) + rrect(x, y, w, h, 16, ALAS);
}

function latar(): string {
  let garisDinding = '';
  for (let x = 24; x < 640; x += 52) garisDinding += rect(x, 10, 18, 140, '#f0e4cc');
  let ubin = '';
  for (let x = 0; x <= 640; x += 64) ubin += line(`M${x} 452 L${x + (x - 320) * 0.25} 480`, '#d9ccb2', 2);
  // Rak & tepi belakang meja mengikuti tinggi stempel (dasar stempel = STEMPEL_Y + 49,5).
  const rakX = STEMPEL_X[1] - 260;
  const rakY = STEMPEL_Y + 30;
  const mejaY = STEMPEL_Y + 54;
  return `
    <!-- dinding kantor -->
    ${rect(0, 0, 640, mejaY + 10, DINDING)}
    ${garisDinding}
    ${rect(0, 0, 640, 10, '#e6d7b7')}
    <!-- papan nama (di antara stempel kiri & tengah, di atas jam) -->
    ${rrect(160, 12, 128, 28, 8, P.hijau, 'opacity="0.85"')}
    ${text(224, 31, 'KANTOR RAKSA', 13, P.krem)}
    <!-- jam dinding -->
    ${circle(224, 88, 21, '#e3d3b2')}${circle(224, 88, 16, P.krem)}
    ${line('M224 88 V77 M224 88 L232 93', P.tintaLembut, 3, 'opacity="0.7"')}${circle(224, 88, 2.4, P.tintaLembut, 'opacity="0.7"')}
    <!-- jendela kecil: kota di luar -->
    ${rrect(362, 22, 70, 104, 6, '#e0cfac')}
    ${rect(368, 28, 58, 92, P.langit)}
    ${rect(368, 28, 58, 34, P.langitAtas, 'opacity="0.55"')}
    ${cloud(390, 48, 0.42)}
    ${rrect(372, 84, 22, 36, 2, '#dcc9a6')}${rrect(398, 74, 24, 46, 2, '#c8d8c9')}
    ${rect(376, 92, 6, 7, P.kaca)}${rect(384, 92, 6, 7, P.kaca)}${rect(403, 82, 6, 7, P.kaca)}${rect(411, 82, 6, 7, P.kaca)}${rect(403, 96, 6, 7, P.kaca)}${rect(411, 96, 6, 7, P.kaca)}
    ${rect(368, 112, 58, 8, '#b9cfa8')}
    ${line('M397 28 V120 M368 72 H426', '#e0cfac', 4)}
    <!-- tanaman di pojok kiri belakang -->
    ${circle(22, 92, 16, P.hijauMuda, 'opacity="0.75"')}${circle(40, 80, 14, P.hijauDaun, 'opacity="0.75"')}${circle(30, 68, 13, P.hijauDaun, 'opacity="0.6"')}
    ${path(`M12 ${mejaY - 32} L50 ${mejaY - 32} L46 ${mejaY + 4} L16 ${mejaY + 4} Z`, '#c9876a', 'opacity="0.85"')}
    <!-- permukaan meja -->
    ${rect(0, mejaY, 640, 430 - mejaY, MEJA)}
    ${rect(0, mejaY, 640, 10, '#c99f70', 'opacity="0.55"')}
    ${line('M0 198 C140 192 250 204 380 196 S560 202 640 196', '#d5ae80', 2)}
    ${line('M0 422 C160 416 300 424 460 418 S600 422 640 418', '#d5ae80', 2)}
    <!-- rak stempel (belakang meja), berpusat pada stempel tengah -->
    ${rrect(rakX, rakY, 520, 14, 6, '#b8895a')}
    ${rrect(rakX, rakY + 12, 520, 18, 5, P.kayuTua)}
    ${rect(rakX, rakY + 12, 520, 3, '#000', 'opacity="0.1"')}
    ${STEMPEL_X.map((x) => rrect(x - 34, rakY + 4, 68, 8, 4, '#a37748')).join('')}
    <!-- tempat pena & tumpukan kertas (kanan belakang, di bawah Raki) -->
    ${rrect(566, mejaY - 30, 52, 30, 4, P.putih, 'opacity="0.8"')}${rrect(570, mejaY - 36, 52, 30, 4, '#f7f3ea', 'opacity="0.9"')}
    ${line(`M578 ${mejaY - 26} H610 M578 ${mejaY - 18} H604`, P.besiMuda, 2.4, 'opacity="0.8"')}
    <!-- alas kerja kiri & kanan (pengelompok pasangan kasus) -->
    ${alas(8, 216, 304, 186)}
    ${alas(328, 216, 304, 186)}
    <!-- sisi depan meja -->
    ${rect(0, 430, 640, 22, '#b98a58')}
    ${rect(0, 430, 640, 4, '#c99c68')}
    <!-- lantai -->
    ${rect(0, 452, 640, 28, '#e8ddc8')}
    ${ubin}`;
}

/**
 * Stempel besar: bentuk dari props.stamp() yang diperbesar. Tebal garis tepi
 * dikembalikan ke 3/2 satuan supaya sama dengan objek lain di adegan.
 */
function stempel(warna: string, simbol: 'cek' | 'silang' | 'tanya'): string {
  const s = SKALA_STEMPEL;
  const tepi = stamp(warna, simbol)
    .split(`stroke="${P.tinta}" stroke-width="3"`).join(`stroke="${P.tinta}" stroke-width="${(3 / s).toFixed(2)}"`)
    .split(`stroke="${P.tinta}" stroke-width="2"`).join(`stroke="${P.tinta}" stroke-width="${(2 / s).toFixed(2)}"`);
  // Sorotan (putih 25%, sesuai kit) supaya gagang terbaca sebagai kayu mengilap, bukan siluet.
  const sorot = `<ellipse cx="23.5" cy="9.5" rx="3" ry="5" fill="${P.putih}" opacity="0.25"/>` +
    line('M11 41 H26', P.putih, 3, 'opacity="0.25"');
  return `<g transform="scale(${s})">${tepi}${sorot}</g>`;
}

/** Map kasus 160 x 118: sampul map, foto mobil (dijepit), kartu polis kecil, huruf kasus. */
function mapKasus(huruf: 'A' | 'B'): string {
  return `
    ${shadow(80, 112, 70, 6)}
    ${path('M14 18 L18 7 C19 4 21 3 24 3 L58 3 C61 3 63 4 64 7 L68 18 Z', '#e2ad3e', INK)}
    ${rrect(4, 14, 152, 96, 8, '#f3cb63', INK)}
    ${line('M12 24 H148', '#e2ad3e', 2)}
    <g transform="rotate(-5 48 62)">
      ${rrect(12, 30, 72, 60, 4, P.putih, INK_TIPIS)}
      ${rect(18, 36, 60, 40, P.langit)}
      ${rect(18, 64, 60, 12, '#b8c4bb')}
      <g transform="translate(18 45) scale(0.2)">${carSide(P.teal)}</g>
      ${line('M24 58 l-3 -5 M28 56 l0 -6 M32 58 l3 -5', P.oranye, 2.2)}
    </g>
    ${line('M36 24 v14 c0 5 7 5 7 0 v-11', P.besi, 2.4)}
    <g transform="rotate(6 120 50)">
      ${rrect(96, 30, 50, 38, 5, P.krem, INK_TIPIS)}
      ${rrect(96, 30, 50, 12, 5, P.hijau)}${rect(96, 37, 50, 5, P.hijau)}
      ${rrect(96, 30, 50, 38, 5, 'none', INK_TIPIS)}
      ${line('M102 52 H132 M102 60 H124', P.besiMuda, 2.4)}
    </g>
    ${rrect(104, 76, 42, 28, 7, P.putih, INK_TIPIS)}
    ${text(125, 97, huruf, 21, P.tinta, 900)}`;
}

/** Kartu polis 104 x 80 (dokumen yang bisa dibuka), sedikit miring. */
function kartuPolis(huruf: 'A' | 'B', miring: number): string {
  return `
    ${shadow(52, 76, 44, 4)}
    <g transform="rotate(${miring} 52 40)">
      ${rrect(4, 8, 96, 64, 8, P.krem, INK)}
      ${rrect(4, 8, 96, 20, 8, P.hijau)}${rect(4, 20, 96, 8, P.hijau)}
      ${rrect(4, 8, 96, 64, 8, 'none', INK)}
      ${text(38, 23, 'POLIS', 12, P.krem)}
      ${line('M14 40 H56 M14 50 H62 M14 60 H46', P.besiMuda, 3)}
      ${circle(80, 52, 14, P.kuningPucat, INK_TIPIS)}
      ${text(80, 58.5, huruf, 17, P.tinta, 900)}
    </g>`;
}

export function scenePolisMana(): SceneSpec {
  const bg = art('m05-latar', 640, 480, latar());
  const sw = Math.round(56 * SKALA_STEMPEL);
  const sh = Math.round(70 * SKALA_STEMPEL);
  // Label kartu polis disejajarkan dengan label map (engine menaruh label di bawah gambar).
  const labelKartu = MAP_Y + MAP_H / 2 - (KARTU_Y + KARTU_H / 2);
  const [xLanjut, xAmbang, xData] = STEMPEL_X;
  return {
    missionId: 'm05-polis-mana',
    background: bg,
    hero: { x: 320, y: 478 },
    walk: { minX: 60, maxX: 580, minY: 462, maxY: 478 },
    bucketShort: {
      'cocok:lanjut': 'Lanjut dinilai',
      'cocok:tidak-ambang': 'Di bawah ambang',
      'cocok:perlu-data': 'Perlu info',
    },
    objects: [
      // ---- kesimpulan: tiga stempel di rak (urutan sama dengan urutan kategori misi)
      {
        id: 'stempel-lanjut', role: 'bucket', stepId: 'cocok', refId: 'lanjut',
        x: xLanjut, y: STEMPEL_Y, art: art('m05-stempel-lanjut', sw, sh, stempel(TINTA_STEMPEL.lanjut, 'cek')),
        label: 'Lanjut dinilai', depth: 20,
      },
      {
        id: 'stempel-ambang', role: 'bucket', stepId: 'cocok', refId: 'tidak-ambang',
        x: xAmbang, y: STEMPEL_Y, art: art('m05-stempel-ambang', sw, sh, stempel(TINTA_STEMPEL['tidak-ambang'], 'silang')),
        label: 'Di bawah ambang', depth: 20,
      },
      {
        id: 'stempel-data', role: 'bucket', stepId: 'cocok', refId: 'perlu-data',
        x: xData, y: STEMPEL_Y, art: art('m05-stempel-data', sw, sh, stempel(TINTA_STEMPEL['perlu-data'], 'tanya')),
        label: 'Perlu info', depth: 20,
      },
      // ---- kasus: dua map sama besar
      {
        id: 'map-a', role: 'item', stepId: 'cocok', refId: 'kasus-a', fx: 'stamp',
        x: MAP_X.A, y: MAP_Y, art: art('m05-map-a', MAP_W, MAP_H, mapKasus('A')), label: 'Kasus A', depth: 20,
      },
      {
        id: 'map-b', role: 'item', stepId: 'cocok', refId: 'kasus-b', fx: 'stamp',
        x: MAP_X.B, y: MAP_Y, art: art('m05-map-b', MAP_W, MAP_H, mapKasus('B')), label: 'Kasus B', depth: 20,
      },
      // ---- dokumen: kartu polis di sisi luar map masing-masing
      {
        id: 'kartu-a', role: 'doc', refId: 'polis-a',
        x: KARTU_X.A, y: KARTU_Y, art: art('m05-kartu-a', KARTU_W, KARTU_H, kartuPolis('A', -4)), label: 'Polis A', depth: 22,
        labelDy: labelKartu,
      },
      {
        id: 'kartu-b', role: 'doc', refId: 'polis-b',
        x: KARTU_X.B, y: KARTU_Y, art: art('m05-kartu-b', KARTU_W, KARTU_H, kartuPolis('B', 4)), label: 'Polis B', depth: 22,
        labelDy: labelKartu,
      },
    ],
  };
}
