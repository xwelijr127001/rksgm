/**
 * Misi 2 - Detektif Penyok (bengkel mitra).
 * Mekanik: KAMERA BUKTI. Ketuk benda untuk memotretnya; foto masuk album (maks 3).
 * Ketuk lagi untuk membatalkan. Semua objek diberi tanda sentuh yang sama.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, line, path, rect, rrect, shadow, text } from '../art/kit';
import { carSide, dentPatch } from '../art/vehicles';

/** Latar bengkel mitra. Diekspor supaya misi acara a03 memakai latar yang SAMA (kunci tekstur `m02-latar`). */
export function latar(): string {
  return `
    ${rect(0, 0, 640, 300, '#f4ead3')}
    ${rect(0, 0, 640, 18, '#e3d5b4')}
    <!-- pintu garasi terbuka: parkiran di luar -->
    ${rrect(18, 58, 196, 244, 6, P.langit)}
    ${rect(18, 58, 196, 120, P.langitAtas, 'opacity="0.55"')}
    ${cloud(70, 96, 0.8)}${cloud(170, 82, 0.6)}
    ${building(26, 250, 70, 120, '#d9c6a3', { windows: true })}
    ${building(104, 250, 96, 86, '#c8d8c9', { windows: true })}
    ${rect(18, 250, 196, 52, P.aspal)}
    ${line('M30 276 H70 M100 276 H140 M170 276 H210', P.putih, 4, 'opacity="0.8"')}
    ${rect(12, 52, 208, 12, P.besi)}
    ${rect(12, 52, 10, 252, P.besi)}${rect(210, 52, 10, 252, P.besi)}
    ${line('M24 70 H208 M24 80 H208', P.besiMuda, 3, 'opacity="0.7"')}
    <!-- papan nama -->
    ${rrect(250, 22, 214, 40, 10, P.hijau)}
    ${text(357, 49, 'BENGKEL MITRA', 20, P.krem)}
    <!-- papan perkakas -->
    ${rrect(420, 78, 196, 110, 8, '#d8c39b')}
    ${[0, 1, 2, 3, 4, 5].map((i) => circle(440 + i * 32, 92, 3, '#b9a47c')).join('')}
    ${line('M446 104 v44 M444 104 h8', P.besi, 7)}
    ${line('M486 100 l18 44', P.besiTua, 7)}
    ${line('M530 104 v40', P.merah, 8)}${rrect(522, 140, 16, 12, 3, P.besiTua)}
    ${line('M568 100 c-10 16 10 28 0 44', P.besi, 6)}
    ${rrect(430, 160, 176, 18, 5, '#b99b6e')}
    <!-- lantai beton -->
    ${rect(0, 300, 640, 180, P.beton)}
    ${rect(0, 300, 640, 10, P.betonTua)}
    ${line('M0 380 H640', P.betonTua, 2, 'opacity="0.6"')}
    ${[80, 200, 320, 440, 560].map((x) => line(`M${x} 310 L${x + (x - 320) * 0.5} 480`, P.betonTua, 2, 'opacity="0.55"')).join('')}
    <!-- area kerja kuning -->
    ${path('M170 400 L500 400 L530 438 L140 438 Z', P.kuning, 'opacity="0.3"')}
    ${line('M170 400 L500 400 M140 438 L530 438', P.kuningTua, 4, 'opacity="0.6"')}`;
}

function mobil(): string {
  return carSide(P.biru);
}

function plat(): string {
  return `${shadow(40, 40, 30, 4)}
    ${rrect(4, 6, 72, 30, 6, P.tinta, INK)}
    ${rrect(8, 10, 64, 22, 4, '#f5f5f0')}
    ${text(40, 27, 'B 2026 RK', 14, P.tinta, 900)}`;
}

function kucing(): string {
  return `${shadow(36, 64, 26, 5)}
    ${path('M12 62 C8 44 14 30 30 28 C46 26 58 36 58 52 C58 60 54 64 48 64 L18 64 Z', P.oranye, INK)}
    ${path('M58 56 C68 54 72 44 66 36', 'none', `stroke="${P.tinta}" stroke-width="9" stroke-linecap="round"`)}
    ${path('M58 56 C68 54 72 44 66 36', 'none', `stroke="${P.oranye}" stroke-width="5" stroke-linecap="round"`)}
    ${circle(30, 22, 17, P.oranye, INK)}
    ${path('M16 12 L14 0 L26 8 Z', P.oranye, INK_TIPIS)}${path('M44 12 L46 0 L34 8 Z', P.oranye, INK_TIPIS)}
    ${circle(24, 22, 2.6, P.tinta)}${circle(36, 22, 2.6, P.tinta)}
    ${line('M27 29 q3 3 6 0', P.tinta, 2)}
    ${line('M8 26 h10 M8 31 h10 M42 26 h10 M42 31 h10', P.tinta, 1.4, 'opacity="0.6"')}
    ${line('M24 40 q6 4 12 0 M22 48 q8 4 16 0', '#c86a26', 3)}`;
}

function makanSiang(): string {
  return `${shadow(50, 88, 46, 6)}
    ${rrect(6, 44, 88, 10, 4, P.kayu, INK)}
    ${rect(14, 54, 8, 34, P.kayuTua)}${rect(78, 54, 8, 34, P.kayuTua)}
    ${path('M14 44 C14 30 30 22 44 22 C58 22 72 30 72 44 Z', P.putih, INK)}
    ${path('M22 40 C22 32 32 28 44 28 C56 28 64 32 64 40 Z', '#fff7e0')}
    ${circle(36, 34, 5, P.merah)}${circle(50, 32, 4, P.hijauDaun)}${circle(44, 38, 4, P.kuning)}
    ${rrect(74, 14, 16, 30, 4, P.biruMuda, INK_TIPIS)}
    ${line('M84 14 l4 -10', P.merah, 3)}
    ${line('M36 18 q-2 -6 2 -12 M46 16 q-2 -6 2 -12', P.besiMuda, 2.4)}`;
}

function selfie(): string {
  return `${shadow(36, 106, 22, 4)}
    ${line('M36 104 L36 40', P.tinta, 7)}${line('M36 104 L36 40', P.besi, 3)}
    ${line('M22 106 L36 86 L50 106', P.tinta, 5)}
    ${rrect(14, 2, 44, 60, 8, P.tinta, INK)}
    ${rrect(18, 8, 36, 48, 5, P.kuningPucat)}
    ${circle(36, 26, 8, '#e0ac7e')}${path('M22 54 C24 42 30 38 36 38 C42 38 48 42 50 54 Z', P.biru)}
    ${path('M27 22 C28 16 44 16 45 22 C41 19 31 19 27 22 Z', '#2b2118')}
    ${line('M30 29 q6 5 12 0', P.tinta, 1.6)}
    ${line('M62 12 l6 -4 M64 22 h7 M62 32 l6 4', P.kuningTua, 3)}`;
}

export function sceneBengkel(): SceneSpec {
  const bg = art('m02-latar', 640, 480, latar());
  return {
    missionId: 'm02-detektif-penyok',
    background: bg,
    hero: { x: 604, y: 478 },
    walk: { minX: 80, maxX: 604, minY: 462, maxY: 478 },
    objects: [
      {
        id: 'mobil', role: 'option', stepId: 'bukti', refId: 'foto-full', fx: 'photo',
        x: 330, y: 345, art: art('m02-mobil', 300, 130, mobil()), label: 'Mobil utuh', depth: 20,
        labelDx: 44, labelDy: -2,
      },
      {
        id: 'penyok', role: 'option', stepId: 'bukti', refId: 'foto-depan-kiri', fx: 'photo',
        x: 230, y: 366, art: art('m02-penyok', 70, 60, dentPatch()), label: 'Penyok', depth: 24,
        hit: { w: 80, h: 72 },
      },
      {
        id: 'plat', role: 'option', stepId: 'bukti', refId: 'foto-identitas', fx: 'photo',
        x: 122, y: 396, art: art('m02-plat', 80, 44, plat()), label: 'Plat nomor', depth: 24,
        hit: { w: 92, h: 70 }, labelDx: -26,
      },
      {
        id: 'kucing', role: 'option', stepId: 'bukti', refId: 'foto-kucing', fx: 'photo',
        x: 268, y: 318, art: art('m02-kucing', 74, 70, kucing()), label: 'Kucing', depth: 24,
        // Label di atas kepala kucing (di dinding), tidak menutupi jendela mobil.
        labelDy: -108,
      },
      {
        id: 'makan', role: 'option', stepId: 'bukti', refId: 'foto-makanan', fx: 'photo',
        x: 546, y: 352, art: art('m02-makan', 100, 92, makanSiang()), label: 'Makan siang', depth: 20,
      },
      {
        id: 'selfie', role: 'option', stepId: 'bukti', refId: 'foto-selfie', fx: 'photo',
        x: 112, y: 212, art: art('m02-selfie', 76, 110, selfie()), label: 'Selfie', depth: 20,
      },
    ],
  };
}

