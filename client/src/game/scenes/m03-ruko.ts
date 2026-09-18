/**
 * Misi 3 - Berkas Ruko (ruko pasca kebakaran yang SUDAH aman).
 * Mekanik: FOLDER LAPORAN. Enam kartu dokumen berjajar di meja panjang; ketuk
 * dokumen untuk memasukkannya ke folder (maks 4), ketuk lagi untuk membatalkan.
 * Folder laporan (depan meja) membuka checklist. Checklist di gambar sengaja
 * KOSONG: tidak pernah dicentang otomatis.
 *
 * Tata letak (dunia 640 x 480):
 * - Dinding (y 0-96): APAR, bingkai, lidah jelaga + rak hangus, lampu, pintu
 *   rolling terangkat (jalan cerah). Pojok kanan-atas untuk Raki.
 * - Meja : 3 kolom (x 186 / 364 / 542) x 2 baris (y 136 / 276); ukuran, garis
 *   tepi, dan kerapatan detail keenam dokumen dibuat setara.
 * - Folder di DEPAN meja (453, 406), di antara kolom tengah & kanan (tidak
 *   "menempel" ke satu dokumen). Posisi rendah ini disengaja: di HP, panel
 *   dokumen (modal di tengah layar) menutupi titik ketuk folder, sehingga
 *   klik susulan dari sentuhan tidak jatuh ke latar modal dan menutupnya lagi.
 * - Petugas di kiri bawah (depan lemari), pita jalan y 458-478.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, floorLines, line, path, rect, rrect, shadow, text } from '../art/kit';

/** Ukuran seragam semua kartu dokumen (sama menonjol). */
const DW = 96;
const DH = 88;
/** Tepi belakang meja (batas dinding). */
const MEJA_Y = 96;

// ------------------------------------------------------------------ latar

function latar(): string {
  const dinding = '#f3e6cc';
  const jelaga = P.tinta;
  const hangus = '#4a3b30';
  return `
    <!-- dinding & plafon -->
    ${rect(0, 0, 640, MEJA_Y + 6, dinding)}
    ${rect(0, 0, 640, 12, '#e2d1ae')}
    ${rect(160, 0, 186, 12, jelaga, 'opacity="0.16"')}
    <!-- lantai keramik -->
    ${rect(0, MEJA_Y, 640, 480 - MEJA_Y, '#e9dfcb')}
    ${floorLines(MEJA_Y + 6, 480, 640, '#c9b894', 80)}
    ${rect(0, MEJA_Y - 4, 640, 8, '#dccaa6')}

    <!-- lidah jelaga (api sudah padam, tinggal bekasnya di dinding) -->
    <g transform="translate(0 ${MEJA_Y}) scale(1 0.6) translate(0 -166)">
      ${path('M170 166 C160 132 172 104 186 82 C194 68 190 44 198 22 C208 42 218 56 222 76 C228 56 234 30 248 10 C254 34 264 52 266 74 C274 56 286 40 302 28 C300 50 308 72 316 96 C324 122 322 146 318 166 Z', jelaga, 'opacity="0.12"')}
      ${path('M186 164 C180 138 190 116 202 98 C208 88 208 72 212 58 C220 72 226 86 228 100 C234 84 240 66 250 50 C254 70 262 86 264 102 C272 88 282 78 292 70 C292 88 298 104 302 120 C306 138 304 152 302 164 Z', jelaga, 'opacity="0.12"')}
    </g>

    <!-- rak hangus -->
    ${rect(188, 20, 8, MEJA_Y - 20, '#6f5a49')}${rect(298, 20, 8, MEJA_Y - 20, '#6f5a49')}
    ${rrect(182, 48, 130, 7, 3, '#5f4c3e')}${rrect(182, 86, 130, 7, 3, '#5f4c3e')}
    <g transform="translate(0 -46)">
      ${rrect(200, 68, 30, 26, 3, '#8d7663')}${path('M200 76 L207 82 L214 74 L222 82 L230 76 L230 68 L200 68 Z', hangus)}
      ${rrect(236, 76, 24, 18, 3, '#7e6c5d')}${path('M236 80 L242 84 L248 79 L254 84 L260 80 L260 76 L236 76 Z', hangus)}
      ${rrect(266, 64, 28, 30, 3, '#978269')}${path('M266 74 L272 79 L279 72 L287 79 L294 74 L294 64 L266 64 Z', hangus)}
    </g>
    <g transform="translate(0 -54)">
      ${rrect(200, 122, 18, 18, 4, '#908a82')}${rect(200, 122, 18, 5, '#5a4838', 'opacity="0.6"')}
      ${rrect(224, 124, 36, 16, 4, '#806a58')}
      ${circle(280, 131, 9, '#8c7b6b')}${circle(280, 131, 3.5, '#6b5a4c')}
    </g>
    ${path('M182 55 L190 61 L198 55 L206 60 L214 55 Z', '#4b3d32', 'opacity="0.8"')}

    <!-- APAR di dinding -->
    ${rrect(20, 34, 40, 7, 3, P.besi)}
    ${rrect(28, 24, 24, 56, 10, P.merah)}
    ${rect(28, 46, 24, 14, P.krem, 'opacity="0.85"')}
    ${rrect(34, 14, 12, 12, 3, P.besiTua)}
    ${line('M44 16 H56 L60 22', P.besiTua, 3)}
    ${line('M36 18 C24 22 20 42 24 62', P.tinta, 3, 'opacity="0.7"')}
    ${rect(32, 28, 4, 48, P.putih, 'opacity="0.25"')}

    <!-- bingkai foto dinding -->
    ${rrect(92, 22, 56, 42, 5, P.kayuTua)}
    ${rect(98, 28, 44, 30, P.langit)}
    ${path('M98 58 L112 42 L124 51 L131 44 L142 55 L142 58 Z', P.hijauDaun, 'opacity="0.8"')}
    ${circle(133, 35, 4, P.kuning)}

    <!-- pintu depan (rolling door terangkat): jalan di luar yang cerah -->
    ${rect(356, 30, 166, MEJA_Y - 30, P.langit)}
    ${rect(356, 30, 166, 20, P.langitAtas, 'opacity="0.5"')}
    ${cloud(400, 48, 0.45)}${cloud(482, 42, 0.34)}
    ${building(366, 86, 62, 48, '#e2cba7', { windows: true })}
    ${building(436, 86, 78, 36, '#cddfd3', { windows: true })}
    ${rect(356, 82, 166, 4, P.betonTua)}
    ${rect(356, 86, 166, MEJA_Y - 86, P.aspal)}
    ${rect(348, 30, 8, MEJA_Y - 28, P.besi)}${rect(522, 30, 8, MEJA_Y - 28, P.besi)}
    ${rrect(344, 14, 190, 20, 9, P.besiMuda)}
    ${line('M350 21 H528 M350 27 H528', P.besi, 2, 'opacity="0.5"')}

    <!-- lemari laci di kiri (latar) dengan kotak gosong di atasnya -->
    ${path('M8 336 L136 336 L142 348 L2 348 Z', jelaga, 'opacity="0.1"')}
    ${rrect(14, 226, 112, 106, 6, '#d2ab7c')}
    ${rrect(8, 218, 124, 12, 5, '#b98f60')}
    ${rrect(22, 242, 96, 38, 5, '#c69d6e')}${rrect(22, 286, 96, 38, 5, '#c69d6e')}
    ${rrect(58, 257, 24, 8, 4, P.cokelatMuda)}${rrect(58, 301, 24, 8, 4, P.cokelatMuda)}
    ${rect(22, 332, 10, 8, '#9c6b3f')}${rect(108, 332, 10, 8, '#9c6b3f')}
    ${rrect(26, 186, 46, 32, 3, '#8d7663')}${path('M26 196 L33 202 L41 193 L50 201 L58 193 L66 200 L72 195 L72 186 L26 186 Z', hangus)}
    ${rrect(78, 198, 34, 20, 3, '#7e6c5d')}${path('M78 203 L85 207 L92 201 L100 207 L112 202 L112 198 L78 198 Z', hangus)}
    ${path('M18 218 C30 210 40 214 52 208 C64 214 80 208 96 214 C108 210 120 214 128 218 Z', jelaga, 'opacity="0.12"')}

    <!-- meja panjang (tampak atas-depan) -->
    ${path('M136 452 L640 452 L640 476 L126 476 Z', jelaga, 'opacity="0.1"')}
    ${rect(150, 450, 14, 26, '#9c6b3f')}${rect(606, 450, 14, 26, '#9c6b3f')}
    ${path(`M154 ${MEJA_Y} L640 ${MEJA_Y} L640 440 L130 440 Z`, '#e3c49b')}
    ${path(`M154 ${MEJA_Y} L640 ${MEJA_Y} L640 ${MEJA_Y + 8} L153 ${MEJA_Y + 8} Z`, '#d3b083')}
    ${line('M149 224 H640 M143 362 H640', '#d4b286', 2)}
    ${path(`M154 ${MEJA_Y} L130 440 L138 440 L161 ${MEJA_Y} Z`, P.putih, 'opacity="0.18"')}
    ${rect(130, 440, 510, 12, '#c3976a')}
    ${line('M130 440 H640', '#a97b50', 2)}`;
}

/** Lampu gantung (prop berayun pelan). 40 x 70. */
function lampu(): string {
  return `
    ${line('M20 0 V30', P.besiTua, 2)}
    ${circle(20, 50, 16, P.kuningPucat, 'opacity="0.55"')}
    ${path('M8 44 C8 34 14 28 20 28 C26 28 32 34 32 44 Z', P.hijau)}
    ${circle(20, 46, 5, P.krem)}`;
}

// ------------------------------------------------------------------ dokumen (96 x 88, setara)

function kronologi(): string {
  return `${shadow(48, 83, 38, 5)}
    <g transform="rotate(-5 44 44)">
      ${rrect(16, 6, 58, 76, 6, P.putih, INK)}
      ${path('M58 6 L74 22 L58 22 Z', P.kremTua, INK_TIPIS)}
      ${rrect(24, 14, 28, 10, 3, P.biru)}
      ${line('M30 36 V70', P.biruMuda, 3)}
      ${circle(30, 36, 4.5, P.biru, INK_TIPIS)}${circle(30, 53, 4.5, P.biru, INK_TIPIS)}${circle(30, 70, 4.5, P.biru, INK_TIPIS)}
      ${line('M40 36 H64 M40 53 H60 M40 70 H62', P.besiMuda, 3)}
      ${line('M40 43 H54 M40 60 H56', P.besiMuda, 2.4, 'opacity="0.7"')}
    </g>
    <g transform="rotate(28 80 52)">
      ${rrect(76, 22, 9, 44, 3, P.oranye, INK_TIPIS)}
      ${path('M76 66 L85 66 L80.5 76 Z', P.krem, INK_TIPIS)}
      ${rect(77, 27, 7, 5, P.tinta, 'opacity="0.3"')}
    </g>`;
}

function fotoKerusakan(): string {
  return `${shadow(48, 83, 38, 5)}
    <g transform="rotate(-9 34 46)">
      ${rrect(8, 14, 52, 62, 5, P.putih, INK)}
      ${rect(14, 20, 40, 40, P.langit)}
      ${path('M14 60 L14 40 L26 30 L38 40 L38 60 Z', '#e2cba7')}
      ${rect(22, 44, 8, 16, '#8d7663')}
      ${path('M16 40 C18 32 26 28 34 34 C28 32 22 36 20 42 Z', P.tinta, 'opacity="0.35"')}
      ${rect(40, 46, 14, 14, '#cddfd3')}
    </g>
    <g transform="rotate(7 62 42)">
      ${rrect(34, 6, 56, 68, 5, P.putih, INK)}
      ${rect(40, 12, 44, 44, '#efe0c4')}
      ${path('M40 56 L40 34 C46 26 52 30 56 22 C60 30 68 24 72 32 C76 26 82 30 84 34 L84 56 Z', '#5f5a55', 'opacity="0.5"')}
      ${rect(44, 42, 36, 4, '#5f4c3e')}
      ${rrect(48, 32, 11, 10, 1.5, '#8d7663')}${rrect(64, 30, 11, 12, 1.5, '#7e6c5d')}
      ${rect(40, 12, 44, 44, 'none', `stroke="${P.tinta}" stroke-width="1.6" opacity="0.5"`)}
      ${rrect(52, 62, 20, 4, 2, P.besiMuda)}
    </g>`;
}

function daftarBarang(): string {
  const baris = [27, 39, 51, 63]
    .map((y, i) => circle(26, y, 3.2, P.tintaLembut) + line(`M33 ${y} H${[56, 50, 54, 46][i]}`, P.tintaLembut, 3))
    .join('');
  return `${shadow(48, 83, 38, 5)}
    ${rrect(12, 8, 54, 74, 6, P.kayu, INK)}
    ${rrect(17, 16, 44, 60, 3, P.putih)}
    ${rrect(27, 3, 24, 11, 3, P.besi, INK_TIPIS)}
    ${baris}
    ${rrect(56, 48, 34, 32, 3, '#dcae72', INK)}
    ${line('M56 58 H90', P.kayuTua, 2.4)}
    ${rect(70, 49, 6, 30, P.kremTua, 'opacity="0.85"')}
    ${line('M62 68 H68 M62 73 H66', P.kayuTua, 2)}`;
}

function estimasi(): string {
  let tombol = '';
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) tombol += rrect(58 + c * 9, 54 + r * 9, 7, 6, 2, r === 2 && c === 2 ? P.kuning : P.krem);
  }
  return `${shadow(48, 83, 38, 5)}
    <g transform="rotate(-6 36 44)">
      ${rrect(8, 6, 56, 74, 6, P.putih, INK)}
      ${path('M48 6 L64 22 L48 22 Z', P.kremTua, INK_TIPIS)}
      ${rrect(16, 14, 26, 10, 3, P.kuningTua)}
      ${line('M16 36 H38 M46 36 H56 M16 46 H34 M46 46 H56 M16 56 H36 M46 56 H56', P.besiMuda, 3)}
      ${line('M34 66 H56', P.tinta, 3)}${line('M34 71 H56', P.tinta, 1.6, 'opacity="0.6"')}
    </g>
    ${rrect(52, 32, 38, 50, 7, P.besiTua, INK)}
    ${rrect(57, 38, 28, 11, 3, P.kaca)}
    ${line('M66 44 H81', P.tinta, 2, 'opacity="0.55"')}
    ${tombol}`;
}

function brosur(): string {
  const bintang = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .map((i) => {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 15 : 10.5;
      return `${(50 + Math.cos(a) * r).toFixed(1)} ${(40 + Math.sin(a) * r).toFixed(1)}`;
    })
    .join(' L');
  return `${shadow(50, 84, 42, 5)}
    ${path('M8 10 L36 18 L36 80 L8 72 Z', '#4f9a96', INK)}
    ${path('M36 18 L64 10 L64 72 L36 80 Z', P.kuningPucat, INK)}
    ${path('M64 10 L92 18 L92 80 L64 72 Z', '#8f74b8', INK)}
    ${circle(18, 30, 5, P.putih, 'opacity="0.9"')}${circle(27, 42, 3.5, P.kuning)}${circle(17, 50, 4, P.putih, 'opacity="0.7"')}
    ${line('M14 60 L30 64 M14 66 L26 69', P.putih, 2.4, 'opacity="0.8"')}
    ${path(`M${bintang} Z`, P.oranye, INK_TIPIS)}
    ${text(50, 46, '%', 15, P.putih, 900)}
    ${line('M42 64 L58 60 M42 70 L54 67', P.tintaLembut, 2.4, 'opacity="0.6"')}
    ${path('M70 36 L86 38 L85 58 L71 56 Z', P.putih, 'opacity="0.9"')}
    ${line('M74 37 C74 30 82 31 82 38', P.putih, 2.4)}
    ${line('M70 64 L86 68', P.putih, 2.4, 'opacity="0.8"')}`;
}

function strukKopi(): string {
  return `${shadow(48, 83, 38, 5)}
    <g transform="rotate(-5 32 44)">
      ${path('M12 6 H52 V72 l-5 6 -5 -6 -5 6 -5 -6 -5 6 -5 -6 -5 6 -5 -6 Z', P.putih, INK)}
      ${line('M20 16 H44', P.tintaLembut, 3)}
      ${line('M18 28 H32 M40 28 H46 M18 38 H30 M40 38 H46 M18 48 H34 M40 48 H46', P.besiMuda, 3)}
      ${line('M18 57 H46', P.besiMuda, 2, 'stroke-dasharray="3 4"')}
      ${line('M18 65 H28 M38 65 H46', P.tinta, 3)}
    </g>
    ${path('M56 34 L88 34 L84 82 L60 82 Z', '#e2c49c', INK)}
    ${path('M58 50 L86 50 L85 64 L59 64 Z', P.oranye, INK_TIPIS)}
    ${rrect(52, 26, 40, 10, 4, P.krem, INK)}
    ${rrect(62, 20, 20, 8, 3, P.krem, INK_TIPIS)}
    ${line('M66 15 q-3 -5 1 -10 M77 15 q-3 -5 1 -10', P.besiMuda, 2.4)}`;
}

// ------------------------------------------------------------------ folder laporan + checklist

/**
 * Folder laporan terbuka di atas meja, 136 x 74, dengan kartu checklist KOSONG
 * (4 kotak tanpa centang) di sampul depan.
 */
function folderLaporan(): string {
  const kotak = [[36, 47], [36, 60], [74, 47], [74, 60]]
    .map(([x, y], i) => rrect(x!, y! - 4.5, 9, 9, 2, P.putih, INK_TIPIS) + line(`M${x! + 14} ${y} H${x! + [30, 26, 28, 24][i]!}`, P.tintaLembut, 2.6))
    .join('');
  return `${shadow(68, 70, 62, 5)}
    ${path('M8 20 L8 10 C8 6 11 4 15 4 L46 4 L54 11 L121 11 C125 11 128 14 128 18 L128 62 L8 62 Z', P.kuningTua, INK)}
    ${rrect(18, 10, 98, 28, 3, P.putih, INK_TIPIS)}
    ${line('M28 19 H104 M28 28 H88', P.besiMuda, 3)}
    ${path('M4 32 L132 32 L127 68 L9 68 Z', P.kuning, INK)}
    ${rrect(28, 36, 80, 30, 4, P.krem, INK_TIPIS)}
    ${rrect(58, 31, 20, 8, 3, P.besi, INK_TIPIS)}
    ${kotak}`;
}

// ------------------------------------------------------------------ adegan

export function sceneRuko(): SceneSpec {
  // Jarak kolom 178: cukup untuk tanda pembahasan terlebar (+ ikon) tanpa bertumpuk.
  const kol = [186, 364, 542];
  // Jarak baris 140: lencana nomor (r 19) baris depan tidak menyentuh label baris belakang.
  const baris = [136, 276];
  const folder = { x: 453, y: 406 };
  const dok = (key: string, body: string) => art(`m03-${key}`, DW, DH, body);
  return {
    missionId: 'm03-berkas-ruko',
    acakPosisi: ['berkas'],
    background: art('m03-latar', 640, 480, latar()),
    props: [{ id: 'lampu', x: 334, y: 34, art: art('m03-lampu', 40, 70, lampu()), motion: 'sway', depth: 5 }],
    hero: { x: 60, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 458, maxY: 478 },
    collectTarget: { x: folder.x, y: folder.y - 4 },
    objects: [
      // Baris belakang
      {
        id: 'foto-kerusakan', role: 'option', stepId: 'berkas', refId: 'foto-kerusakan', fx: 'file',
        x: kol[0]!, y: baris[0]!, art: dok('foto-kerusakan', fotoKerusakan()), label: 'Foto kerusakan',
      },
      {
        id: 'struk-kopi', role: 'option', stepId: 'berkas', refId: 'struk-kopi', fx: 'file',
        x: kol[1]!, y: baris[0]!, art: dok('struk-kopi', strukKopi()), label: 'Struk kopi',
      },
      {
        id: 'daftar-barang', role: 'option', stepId: 'berkas', refId: 'daftar-barang', fx: 'file',
        x: kol[2]!, y: baris[0]!, art: dok('daftar-barang', daftarBarang()), label: 'Daftar barang',
      },
      // Baris depan
      {
        id: 'estimasi', role: 'option', stepId: 'berkas', refId: 'estimasi', fx: 'file',
        x: kol[0]!, y: baris[1]!, art: dok('estimasi', estimasi()), label: 'Estimasi rugi',
      },
      {
        id: 'kronologi', role: 'option', stepId: 'berkas', refId: 'kronologi', fx: 'file',
        x: kol[1]!, y: baris[1]!, art: dok('kronologi', kronologi()), label: 'Kronologi',
      },
      {
        id: 'brosur', role: 'option', stepId: 'berkas', refId: 'brosur', fx: 'file',
        x: kol[2]!, y: baris[1]!, art: dok('brosur', brosur()), label: 'Brosur promo',
      },
      // Folder laporan: membuka checklist. Label di bawah folder (dalam tepi bawah adegan).
      {
        id: 'folder', role: 'doc', refId: 'checklist',
        x: folder.x, y: folder.y, art: art('m03-folder', 136, 74, folderLaporan()), label: 'Folder laporan',
        depth: 18,
      },
    ],
  };
}
