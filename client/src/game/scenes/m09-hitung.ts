/**
 * Misi 9 - Hitung dengan Teliti (meja hitung Kantor Raksa).
 * Mekanik: PAPAN LEMBAR HITUNG. Semua langkah berupa angka dan dijawab lewat
 * kontrol HTML; papan di dinding menggemakan angka pilihan pemain (netral,
 * tanpa penilaian). Satu-satunya benda yang bisa diketuk: lembar Data Simulasi
 * di meja (membuka tabel data). Kalkulator, lampu, dan tumpukan berkas hanya
 * hiasan latar (tanpa garis tepi, tanpa titik ketuk).
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, line, path, rect, rrect, shadow, text } from '../art/kit';

/** Papan lembar hitung (digambar engine): posisi & lebar dipakai juga untuk rak kapur di latar. */
const PAPAN = { x: 250, y: 24, w: 410, baris: 3 };
const PAPAN_BAWAH = PAPAN.y + 44 + PAPAN.baris * 40;

// ------------------------------------------------------------------ latar

function jendela(): string {
  // Jendela kecil ke arah kota (kanan), di bawah area Raki.
  return `
    ${rrect(478, 126, 142, 124, 10, '#e2d2ae')}
    ${rrect(488, 136, 122, 104, 6, P.langit)}
    ${rect(488, 136, 122, 44, P.langitAtas, 'opacity="0.5"')}
    ${cloud(530, 162, 0.55)}${cloud(588, 150, 0.4)}
    ${building(494, 240, 38, 58, '#e3cfa6', { windows: true })}
    ${building(536, 240, 32, 78, '#c8d8c9', { windows: true })}
    ${building(572, 240, 34, 50, '#e8c9b0', { windows: true })}
    ${rect(488, 226, 122, 14, '#b9c9a8')}
    ${rect(546, 136, 6, 104, '#e2d2ae')}
    ${rect(488, 186, 122, 6, '#e2d2ae')}
    ${rrect(470, 246, 158, 10, 4, '#d6c39c')}`;
}

function jamDinding(): string {
  return `
    ${circle(506, 78, 25, '#dccaa4')}
    ${circle(506, 78, 20, P.krem)}
    ${[0, 90, 180, 270].map((a) => `<rect x="505" y="61" width="2" height="5" fill="${P.tintaLembut}" transform="rotate(${a} 506 78)"/>`).join('')}
    ${line('M506 78 V66 M506 78 L514 82', P.tintaLembut, 2.6)}
    ${circle(506, 78, 2.4, P.tintaLembut)}`;
}

function lampu(): string {
  // Lampu meja kiri; cahayanya jatuh ke permukaan meja (bukan ke objek tertentu).
  return `
    ${path('M108 252 L154 252 L230 300 L74 300 Z', P.kuningPucat, 'opacity="0.32"')}
    ${shadow(66, 312, 28, 5, 0.12)}
    ${rrect(42, 302, 48, 11, 5, '#2a7a55')}
    ${line('M66 304 L78 264 L112 234', '#51645a', 6)}
    ${circle(78, 264, 5, '#3f4d46')}
    ${path('M98 224 C108 214 128 216 140 228 L156 250 C142 258 118 258 104 250 Z', '#2a7a55')}
    ${path('M104 250 C118 258 142 258 156 250 C146 244 116 244 104 250 Z', P.kuningPucat)}
    ${circle(110, 232, 5, '#3f4d46')}
    ${path('M112 226 C118 222 126 222 132 226', 'none', `stroke="${P.putih}" stroke-width="3" stroke-linecap="round" opacity="0.35"`)}`;
}

function kalkulator(): string {
  // Kalkulator besar berdiri di meja. Layar hanya "0" (netral).
  // Warna sengaja setara latar (abu-hijau sedang, tanpa garis tepi, tanpa tombol
  // kuning terang) supaya tidak bersaing dengan lembar data, satu-satunya benda
  // yang bisa diketuk.
  let tombol = '';
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const warna = c === 3 ? (r === 2 ? '#efd9a0' : '#e6dcc4') : '#f4eedf';
      tombol += rrect(150 + c * 22, 262 + r * 16, 17, 12, 3, warna);
    }
  }
  return `
    ${shadow(194, 314, 58, 5, 0.12)}
    ${rrect(138, 214, 112, 100, 12, '#7d8c84')}
    ${rrect(138, 294, 112, 20, 10, '#6c7b73')}
    ${rrect(148, 224, 92, 30, 6, '#dde9d6')}
    ${rect(150, 226, 88, 8, P.putih, 'opacity="0.25"')}
    ${text(232, 248, '0', 20, '#56705f', 800, 'end')}
    ${tombol}
    ${circle(152, 218, 2, '#a3b0a9')}`;
}

function tumpukanBerkas(): string {
  // Map-map bertumpuk di kanan meja (hiasan, tanpa tulisan).
  const lapis = [
    { y: 298, w: 104, x: 376, warna: '#e2b54a' },
    { y: 286, w: 100, x: 380, warna: '#86b6de' },
    { y: 274, w: 104, x: 374, warna: '#efe6cf' },
    { y: 262, w: 98, x: 382, warna: '#9fcfae' },
    { y: 250, w: 102, x: 378, warna: '#f0c860' },
  ];
  let s = shadow(430, 314, 58, 5, 0.14);
  for (const l of lapis) {
    s += rrect(l.x, l.y, l.w, 13, 3, l.warna);
    s += rect(l.x, l.y + 9, l.w, 4, '#000', 'opacity="0.08"');
    s += rect(l.x + 8, l.y - 2, 60, 3, P.putih, 'opacity="0.9"');
  }
  s += rrect(452, 244, 22, 8, 2, '#f0c860');
  s += rrect(398, 280, 20, 8, 2, '#86b6de');
  return s;
}

function tempatPensil(): string {
  return `
    ${line('M504 290 L498 256', P.kuning, 5)}${line('M498 256 l-1 -6', P.cokelat, 3)}
    ${line('M512 290 L516 252', P.biru, 4)}
    ${line('M520 290 L528 262', P.merah, 4)}
    ${shadow(512, 314, 20, 4, 0.14)}
    ${rrect(496, 280, 32, 34, 6, P.teal)}
    ${rect(496, 290, 32, 5, P.putih, 'opacity="0.25"')}`;
}

function meja(): string {
  return `
    ${shadow(290, 436, 270, 10, 0.12)}
    <!-- permukaan & tepi -->
    ${path('M34 298 L546 298 L560 318 L20 318 Z', '#dcb27c')}
    ${rect(20, 318, 540, 14, '#c8955f')}
    ${rect(20, 328, 540, 4, '#000', 'opacity="0.08"')}
    <!-- panel tengah (ruang kaki) -->
    ${rect(196, 332, 188, 66, '#a97a4b')}
    ${rect(196, 332, 188, 8, '#000', 'opacity="0.1"')}
    <!-- laci kiri & kanan -->
    ${rrect(36, 332, 160, 102, 4, '#c08d59')}
    ${rrect(384, 332, 160, 102, 4, '#c08d59')}
    ${line('M42 366 H190 M42 400 H190 M390 366 H538 M390 400 H538', '#a97a4b', 3)}
    ${[349, 383, 417].map((y) => rrect(100, y - 3, 32, 6, 3, '#8a6a4f') + rrect(448, y - 3, 32, 6, 3, '#8a6a4f')).join('')}
    ${rect(36, 428, 160, 6, '#000', 'opacity="0.08"')}${rect(384, 428, 160, 6, '#000', 'opacity="0.08"')}`;
}

function latar(): string {
  const kiri = PAPAN.x - PAPAN.w / 2;
  return `
    <!-- dinding -->
    ${rect(0, 0, 640, 364, '#f4ecd9')}
    ${rect(0, 0, 640, 12, '#e3d5b4')}
    ${rect(0, 262, 640, 102, '#ecdfc4')}
    ${rect(0, 258, 640, 6, '#ddcba6')}
    <!-- rak kapur di bawah papan lembar hitung -->
    ${rrect(kiri + 24, PAPAN_BAWAH + 8, PAPAN.w - 48, 8, 3, '#b08556')}
    ${rrect(kiri + 64, PAPAN_BAWAH + 3, 22, 6, 3, P.putih)}${rrect(kiri + 94, PAPAN_BAWAH + 3, 16, 6, 3, P.kuningPucat)}
    ${rrect(kiri + PAPAN.w - 96, PAPAN_BAWAH + 1, 30, 8, 3, '#8aa296')}
    ${jamDinding()}
    ${jendela()}
    <!-- lantai kayu -->
    ${rect(0, 364, 640, 116, '#e4d4b3')}
    ${rect(0, 360, 640, 6, '#d3bf98')}
    ${line('M0 396 H640 M0 440 H640', '#d5c29e', 2)}
    ${[70, 190, 330, 470, 600].map((x, i) => line(`M${x + (i % 2) * 30} 366 V396 M${x - 40} 396 V440 M${x + 20} 440 V480`, '#d5c29e', 2)).join('')}
    ${meja()}
    <g transform="translate(-8 0)">${lampu()}</g>
    <g transform="translate(12 0)">${kalkulator()}</g>
    ${tumpukanBerkas()}
    ${tempatPensil()}`;
}

// ------------------------------------------------------------------ objek

/** Lembar Data Simulasi di papan klip, 92 x 108 (membuka tabel data). */
function lembarData(): string {
  let baris = '';
  for (let i = 0; i < 4; i += 1) {
    const y = 50 + i * 12;
    baris += line(`M22 ${y} H${i % 2 ? 40 : 46}`, P.besiMuda, 3);
    baris += line(`M54 ${y} H${i === 3 ? 64 : 70}`, P.tintaLembut, 3);
  }
  return `
    ${shadow(46, 104, 38, 4)}
    ${rrect(6, 8, 80, 94, 8, P.kayu, INK)}
    ${rrect(13, 17, 66, 78, 3, P.putih, INK_TIPIS)}
    ${rrect(20, 25, 52, 14, 3, P.hijau)}
    ${rrect(26, 28, 8, 8, 1.5, P.krem)}${line('M40 32 H64', P.krem, 3)}
    ${line('M20 44 H72', P.besiMuda, 1.5)}
    ${line('M49 44 V90', P.besiMuda, 1.5)}
    ${baris}
    ${rrect(32, 2, 28, 14, 4, P.besi, INK_TIPIS)}
    ${circle(46, 8, 2.5, P.besiTua)}`;
}

export function sceneHitung(): SceneSpec {
  const bg = art('m09-latar', 640, 480, latar());
  return {
    missionId: 'm09-hitung-teliti',
    background: bg,
    hero: { x: 590, y: 478 },
    walk: { minX: 80, maxX: 596, minY: 462, maxY: 478 },
    objects: [
      {
        id: 'data', role: 'doc', refId: 'data',
        x: 312, y: 264, art: art('m09-data', 92, 108, lembarData()), label: 'Data simulasi', depth: 20,
      },
    ],
    boards: [
      {
        id: 'lembar', x: PAPAN.x, y: PAPAN.y, w: PAPAN.w, title: 'Lembar hitung',
        lines: [
          { stepId: 'persen', label: '10% x Rp100.000.000' },
          { stepId: 'risiko', label: 'Risiko sendiri' },
          { stepId: 'hasil', label: 'Hasil akhir' },
        ],
      },
    ],
  };
}
