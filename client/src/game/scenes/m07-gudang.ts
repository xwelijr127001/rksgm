/**
 * Misi 7 - Banjir di Gudang (Gudang Sentra Niaga).
 * Mekanik: BANDINGKAN DOKUMEN. Adegan memperlihatkan KEJADIAN banjir (genangan,
 * kardus basah, bekas air di dinding) dan dua binder polis di meja tinggi yang
 * kering. Ketuk binder untuk membuka kartu polisnya; kalender & kardus hanya
 * memberi keterangan dari cerita/kartu polis.
 *
 * Kedua langkah (pilih polis & pilih alasan) berisi keputusan kalimat, jadi
 * dijawab lewat kontrol HTML saja - tidak ada objek 'option' di adegan.
 * Binder A & B sengaja dibuat setara: ukuran, bentuk, kontras, tinggi sama, dan
 * diletakkan simetris terhadap poros tengah adegan (x=320) bersama mejanya.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, floorLines, line, path, rect, rrect, shadow, text } from '../art/kit';
import { binder, shelf } from '../art/props';

/** Garis bergelombang mendatar dari x0 ke x1 di ketinggian y (untuk garis air). */
function gelombang(x0: number, x1: number, y: number, amp = 4, step = 36): string {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += step) d += ` q${step / 4} ${-amp} ${step / 2} 0 t${step / 2} 0`;
  return d;
}

/** Kardus latar (tanpa garis tepi). `basah` = noda air gelap di bagian bawah. */
function kardusLatar(x: number, y: number, w: number, h: number, basah = false): string {
  return `${rrect(x, y, w, h, 3, basah ? '#c7a77a' : P.tanah)}
    ${rect(x + w / 2 - 4, y, 8, h, basah ? '#d8c29c' : P.kremTua, 'opacity="0.8"')}
    ${basah ? rrect(x, y + h * 0.45, w, h * 0.55, 3, P.tanahTua, 'opacity="0.55"') : ''}`;
}

/**
 * Pengaturan latar gudang. Tanpa argumen = latar Misi 7 persis seperti semula (kunci `m07-latar`).
 * Adegan lain yang mengubah salah satu nilai WAJIB memakai kunci tekstur sendiri (mis. `a07-latar`).
 */
export interface OpsiLatarGudang {
  /** Tepi kiri & kanan daun meja kering. Bawaan 210 - 430 (poros x=320). */
  meja?: { x0: number; x1: number };
  /** Ketinggian palang bawah meja. Bawaan 388; diturunkan bila palang dipakai sebagai rak kartu. */
  palangY?: number;
  /** Geseran ember (beserta riaknya) dari posisinya di Misi 7. */
  ember?: { dx: number; dy: number };
  /** Geseran pel dari posisinya di Misi 7. */
  pel?: { dx: number; dy: number };
  /** Pusat riak air di kaki tumpukan kardus basah. Bawaan (120, 436). */
  riakKardus?: { x: number; y: number };
}

export function latar(opsi: OpsiLatarGudang = {}): string {
  const { x0, x1 } = opsi.meja ?? { x0: 210, x1: 430 };
  const palangY = opsi.palangY ?? 388;
  const riakKardus = opsi.riakKardus ?? { x: 120, y: 436 };
  // Tanpa geseran, isi dikembalikan apa adanya supaya latar Misi 7 tidak berubah satu huruf pun.
  const geser = (isi: string, g?: { dx: number; dy: number }): string =>
    g && (g.dx !== 0 || g.dy !== 0) ? `<g transform="translate(${g.dx} ${g.dy})">${isi}</g>` : isi;
  const pel = `${line('M528 318 L514 398', P.kayuTua, 5)}
    ${path('M504 396 L526 396 L522 406 L508 406 Z', P.besiMuda)}`;
  const ember = `${path('M458 376 L494 376 L490 408 L462 408 Z', P.biruMuda)}
    ${line('M460 376 Q476 360 492 376', P.besi, 2.5)}
    <ellipse cx="478" cy="410" rx="24" ry="5" fill="none" stroke="${P.putih}" stroke-width="2" opacity="0.7"/>`;
  const panel = Array.from({ length: 16 }, (_, i) => 196 + i * 28)
    .map((x) => line(`M${x} 16 V${x > 516 ? 112 : 298}`, '#e5d9bf', 3))
    .join('');
  const garisAir = gelombang(176, 640, 262, 3, 40);
  const karung = [0, 1, 2, 3, 4].map((i) => rrect(20 + i * 31, 282, 32, 18, 9, '#cdb88e')).join('') +
    [0, 1, 2, 3].map((i) => rrect(36 + i * 31, 268, 32, 17, 8.5, '#d9c7a0')).join('');
  return `
    <!-- dinding gudang -->
    ${rect(0, 0, 640, 300, '#f1e8d4')}
    ${rect(0, 0, 640, 16, '#e2d4b4')}
    ${panel}
    <!-- bekas air di dinding (air sudah surut) -->
    ${path(`${garisAir} L640 300 L176 300 Z`, '#e4d3ae')}
    ${line(garisAir, '#bba378', 3.5)}
    ${line(gelombang(176, 640, 270, 2, 40), '#d6c39c', 2, 'opacity="0.8"')}
    ${rect(0, 262, 12, 38, '#e4d3ae')}
    <!-- papan nama -->
    ${rrect(196, 24, 248, 38, 10, P.hijau)}
    ${text(320, 49, 'GUDANG SENTRA NIAGA', 17, P.krem)}
    <!-- pintu gulung terbuka: jalan di luar masih tergenang -->
    ${rect(18, 78, 156, 222, P.langit)}
    ${rect(18, 78, 156, 64, P.langitAtas, 'opacity="0.5"')}
    ${cloud(62, 110, 0.7)}${cloud(142, 98, 0.5)}
    ${building(24, 256, 62, 104, '#d9c6a3', { windows: true })}
    ${building(94, 256, 74, 74, '#c8d8c9', { windows: true })}
    ${rect(18, 250, 156, 50, P.aspal)}
    ${path(`${gelombang(18, 174, 258, 3, 39)} L174 300 L18 300 Z`, P.air, 'opacity="0.6"')}
    ${line(gelombang(18, 174, 258, 3, 39), P.putih, 2.5, 'opacity="0.7"')}
    ${karung}
    ${line('M22 291 H172 M40 276 H158', '#b39c70', 2, 'opacity="0.5"')}
    ${rrect(8, 58, 176, 24, 6, P.besi)}
    ${line('M14 66 H178 M14 74 H178', P.besiMuda, 3, 'opacity="0.7"')}
    ${rect(8, 58, 12, 244, P.besi)}${rect(172, 58, 12, 244, P.besi)}
    ${line('M8 262 H20 M172 262 H184', '#4f5c55', 3)}
    <!-- rak barang di kanan -->
    <g transform="translate(520 112)">
      ${shelf(112, 188)}
      ${kardusLatar(14, -18, 40, 38)}${kardusLatar(60, -12, 36, 32)}
      ${kardusLatar(12, 42, 46, 34)}${kardusLatar(62, 48, 36, 28)}
      ${kardusLatar(14, 98, 38, 34)}${kardusLatar(56, 104, 42, 28)}
      ${kardusLatar(12, 154, 44, 34, true)}${kardusLatar(60, 158, 40, 30, true)}
    </g>
    <!-- lantai beton -->
    ${rect(0, 300, 640, 180, P.beton)}
    ${rect(0, 300, 640, 8, P.betonTua)}
    ${floorLines(308, 480, 640, P.betonTua)}
    <!-- genangan air di lantai (dangkal) -->
    ${path('M0 350 C70 336 150 348 230 340 C320 331 410 346 500 337 C560 331 606 340 640 334 L640 480 L0 480 Z', P.air, 'opacity="0.42"')}
    ${line('M0 350 C70 336 150 348 230 340 C320 331 410 346 500 337 C560 331 606 340 640 334', P.putih, 3, 'opacity="0.65"')}
    ${line('M24 378 h36 M258 412 h48 M300 464 h40 M448 448 h44 M612 420 h18', P.putih, 3, 'opacity="0.45"')}
    <!-- ember & pel (sedang bersih-bersih), di kanan meja -->
    ${geser(pel, opsi.pel)}
    ${geser(ember, opsi.ember)}
    <!-- meja tinggi (kering), simetris di tengah adegan (x ${x0}-${x1}, poros x=${(x0 + x1) / 2}) -->
    ${rect(x0 + 12, 326, 12, 106, P.besi)}${rect(x1 - 24, 326, 12, 106, P.besi)}
    ${rect(x0 + 12, palangY, x1 - x0 - 24, 9, P.besiMuda)}
    ${rrect(x0 + 6, 428, 24, 6, 3, P.besiTua)}${rrect(x1 - 30, 428, 24, 6, 3, P.besiTua)}
    <ellipse cx="${x0 + 18}" cy="432" rx="22" ry="5" fill="none" stroke="${P.putih}" stroke-width="2" opacity="0.75"/>
    <ellipse cx="${x1 - 18}" cy="432" rx="22" ry="5" fill="none" stroke="${P.putih}" stroke-width="2" opacity="0.75"/>
    ${rrect(x0, 304, x1 - x0, 12, 4, '#ddb27d')}
    ${rrect(x0, 314, x1 - x0, 14, 4, P.kayuTua)}
    <!-- riak di kaki petugas & kardus -->
    <ellipse cx="590" cy="474" rx="34" ry="6" fill="none" stroke="${P.putih}" stroke-width="2.5" opacity="0.7"/>
    <ellipse cx="${riakKardus.x}" cy="${riakKardus.y}" rx="70" ry="9" fill="none" stroke="${P.putih}" stroke-width="2.5" opacity="0.6"/>`;
}

/** Tumpukan kardus basah di genangan, 128 x 100. */
export function kardusBasah(): string {
  const noda = (x: number, y: number, w: number): string =>
    path(`M${x} ${y} ${Array.from({ length: Math.ceil(w / 16) }, () => 'q4 -5 8 0 t8 0').join(' ')} L${x + w} ${y + 26} L${x} ${y + 26} Z`, P.tanahTua, 'opacity="0.6"');
  return `
    ${shadow(64, 94, 60, 6)}
    <!-- kardus bawah kiri -->
    ${rrect(6, 50, 64, 42, 4, P.tanah)}
    ${noda(6, 68, 64)}
    ${rect(34, 50, 8, 42, P.kremTua, 'opacity="0.75"')}
    ${rrect(6, 50, 64, 42, 4, 'none', INK)}
    <!-- kardus bawah kanan -->
    ${rrect(68, 56, 54, 36, 4, P.tanah)}
    ${noda(68, 72, 54)}
    ${rect(91, 56, 8, 36, P.kremTua, 'opacity="0.75"')}
    ${rrect(68, 56, 54, 36, 4, 'none', INK)}
    <!-- kardus atas (sedikit miring) -->
    <g transform="rotate(-4 50 32)">
      ${rrect(22, 14, 60, 38, 4, '#dcc198')}
      ${rect(48, 14, 8, 38, P.kremTua, 'opacity="0.8"')}
      ${path('M27 30 C27 21 43 21 43 30 Q39 27.5 35 30 Q31 27.5 27 30 Z', P.tintaLembut)}
      ${line('M35 29 V38 q0 3 -3 3 q-2 0 -2 -2', P.tintaLembut, 2)}
      ${rrect(22, 14, 60, 38, 4, 'none', INK)}
    </g>
    <!-- tetesan & genangan kecil -->
    ${path('M18 88 q2 -6 4 0 a2 2 0 0 1 -4 0 Z', P.air, INK_TIPIS)}
    ${path('M112 84 q2 -6 4 0 a2 2 0 0 1 -4 0 Z', P.air, INK_TIPIS)}
    ${path(`${gelombang(2, 126, 90, 2.5, 31)} L126 98 L2 98 Z`, P.air, 'opacity="0.6"')}`;
}

/**
 * Kalender dinding, 76 x 90. Hanya tanggal kejadian dari kartu polis.
 * Warna kepala sengaja BUKAN biru/ungu (warna binder A/B) supaya tanggal tidak
 * terkesan "milik" salah satu polis.
 */
function kalender(): string {
  return `
    ${rrect(10, 18, 64, 70, 6, P.tinta, 'opacity="0.12"')}
    ${line('M38 6 L20 16 M38 6 L56 16', P.besiTua, 2)}
    ${circle(38, 6, 3.5, P.besiTua)}
    ${rrect(6, 14, 64, 70, 6, P.putih, INK)}
    ${rrect(6, 14, 64, 22, 6, P.cokelatMuda)}
    ${rect(6, 28, 64, 8, P.cokelatMuda)}
    ${rrect(6, 14, 64, 70, 6, 'none', INK)}
    ${rrect(19, 9, 6, 12, 3, P.besiTua)}${rrect(51, 9, 6, 12, 3, P.besiTua)}
    ${text(38, 32, 'SEP', 13, P.putih, 900)}
    ${circle(38, 56, 17, 'none', `stroke="${P.kuningTua}" stroke-width="3"`)}
    ${text(38, 65, '05', 24, P.tinta, 900)}
    ${text(38, 80, '2026', 10, P.tintaLembut, 700)}`;
}

export function sceneGudangBanjir(): SceneSpec {
  const bg = art('m07-latar', 640, 480, latar());
  return {
    missionId: 'm07-banjir-gudang',
    background: bg,
    hero: { x: 590, y: 478 },
    walk: { minX: 80, maxX: 600, minY: 462, maxY: 478 },
    objects: [
      // Binder A & B simetris terhadap poros tengah adegan (x=320): tidak ada yang lebih "di tengah".
      {
        id: 'binder-a', role: 'doc', refId: 'polis-a',
        x: 262, y: 262, art: art('m07-binder-a', 80, 100, binder(P.biru, 'A')), label: 'Polis A', depth: 20,
        // Label sedikit menjauh satu sama lain: versi Inggris ("Policy A") lebih lebar dari jarak kedua binder.
        labelDx: -10,
        hit: { w: 96, h: 112 },
      },
      {
        id: 'binder-b', role: 'doc', refId: 'polis-b',
        x: 378, y: 262, art: art('m07-binder-b', 80, 100, binder(P.ungu, 'B')), label: 'Polis B', depth: 20,
        labelDx: 10,
        hit: { w: 96, h: 112 },
      },
      // Kalender di poros tengah, di atas kedua binder (tidak berdekatan dengan salah satunya).
      {
        id: 'kalender', role: 'info', refId: 'tanggal-kejadian',
        x: 320, y: 120, art: art('m07-kalender', 76, 90, kalender()), label: 'Kalender', depth: 20,
        info: 'Tanggal kejadian:\n05 Sep 2026',
      },
      {
        id: 'kardus', role: 'info', refId: 'kardus-basah',
        x: 118, y: 390, art: art('m07-kardus', 128, 100, kardusBasah()), label: 'Kardus basah', depth: 20,
        info: 'Kerusakan terjadi\nakibat banjir.',
      },
    ],
  };
}
