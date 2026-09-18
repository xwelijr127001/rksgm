/**
 * Pemanasan - Latihan Mengetuk (meja kantor Raksa).
 * Mekanik: PILIH SATU. Tiga benda besar berjajar di meja konter. Ketuk satu benda
 * untuk memilihnya (lencana kuning); ketuk benda lain untuk mengganti pilihan.
 *
 * Kenetralan: ketiga benda memakai kotak gambar yang sama (124 x 124), garis tepi
 * tinta yang sama, berdiri di garis meja yang sama, dan berjarak sama. Urutan kiri
 * ke kanan mengikuti urutan kartu di kontrol HTML (helm, kopi, kucing), sehingga
 * tidak ada benda yang "ditaruh di tengah" secara khusus. Latar mint pucat dibuat
 * seragam di belakang ketiganya. Massa visual diukur (luas gambar & luas warna
 * jenuh) supaya helm (jawaban) tidak menjadi blok kuning paling "berteriak":
 * helm paling rendah, cangkir paling tinggi, kucing berwajah; kurang lebih setara.
 * Area sentuh ketiganya sama dan ikut menutup pil nama (ketuk tulisan = ketuk benda).
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, line, path, rect, rrect, shadow, text, tree } from '../art/kit';

/** Ukuran kotak gambar tiap benda pilihan (sama untuk semua). */
const BENDA = 124;
/**
 * Area sentuh (sama untuk semua): menutup gambar DAN pil nama di bawahnya
 * (pusat y 274 -> 178..370; pil nama 338..370), supaya pemain yang mengetuk
 * tulisan "Helm proyek"/"Kopi"/"Kucing" juga tercatat. Lebar 148 menutup pil
 * terlebar (~143) dan tetap menyisakan celah 22 antar benda (x 150/320/490).
 */
const SENTUH = { w: 148, h: 192 };

function elips(cx: number, cy: number, rx: number, ry: number, fill: string, extra = ''): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
}

/** Garis tebal bergaris tepi tinta (ekor, pegangan cangkir). */
function pita(d: string, warna: string, tebal: number): string {
  return path(d, 'none', `stroke="${P.tinta}" stroke-width="${tebal + 6}" stroke-linecap="round" stroke-linejoin="round"`) +
    path(d, 'none', `stroke="${warna}" stroke-width="${tebal}" stroke-linecap="round" stroke-linejoin="round"`);
}

// ------------------------------------------------------------------ latar

/** Pemandangan kota kecil di balik jendela (kaca x 44..474, y 56..186). */
function kotaDiJendela(): string {
  return `
    ${rect(44, 56, 430, 130, P.langit)}
    ${rect(44, 56, 430, 46, P.langitAtas, 'opacity="0.5"')}
    ${cloud(104, 84, 0.55)}${cloud(262, 76, 0.45)}${cloud(418, 90, 0.6)}
    ${path('M44 160 C110 138 170 146 230 154 C300 140 380 136 474 150 L474 186 L44 186 Z', '#bfdcc0')}
    ${building(52, 184, 50, 84, '#f0d8b2')}
    ${building(124, 184, 52, 56, '#cfe0d0')}
    ${building(198, 184, 52, 100, '#dde5ee')}
    ${path('M258 144 L288 120 L318 144 Z', '#d98b6a')}
    ${rect(262, 144, 52, 40, '#f5dcc0')}
    ${rrect(280, 160, 16, 24, 3, P.kayu, 'opacity="0.8"')}
    ${building(346, 184, 60, 72, '#ecdcbc')}
    ${building(424, 184, 46, 92, '#d5e3d9')}
    ${tree(113, 184, 0.55)}${tree(414, 184, 0.5)}
    ${rect(44, 180, 430, 6, '#c9d4c2')}`;
}

function jendela(): string {
  const bingkai = '#f8fbf6';
  return `
    ${rrect(34, 46, 450, 150, 8, bingkai)}
    ${kotaDiJendela()}
    ${rect(182, 56, 8, 130, bingkai)}${rect(328, 56, 8, 130, bingkai)}
    ${path('M56 60 L92 60 L60 110 L56 110 Z', P.putih, 'opacity="0.3"')}
    ${path('M346 60 L372 60 L350 96 L346 96 Z', P.putih, 'opacity="0.3"')}
    ${rrect(26, 190, 466, 12, 4, bingkai)}
    ${rect(30, 202, 458, 4, '#cbdccb')}`;
}

function tanaman(): string {
  return `
    ${elips(34, 446, 30, 6, P.tinta, 'opacity="0.1"')}
    ${path('M34 392 C20 360 4 330 2 292 C18 318 30 350 36 390 Z', '#6aae7c')}
    ${path('M36 392 C40 350 34 300 20 256 C44 290 54 340 44 392 Z', '#86c493')}
    ${path('M38 392 C50 356 62 320 78 300 C74 336 60 370 46 394 Z', '#5a9f6d')}
    ${path('M34 394 C24 372 10 360 0 356 C14 352 30 364 40 388 Z', '#86c493')}
    ${path('M40 392 C52 376 64 368 76 366 C66 376 54 386 46 396 Z', '#6aae7c')}
    ${path('M12 392 L58 392 L52 444 L18 444 Z', '#d9a67a')}
    ${rrect(8, 386, 54, 12, 5, '#c89468')}`;
}

function jamDinding(): string {
  return `
    ${circle(580, 152, 23, '#c3d5c2')}
    ${circle(580, 152, 18, '#fbfdf9')}
    ${line('M580 152 V140 M580 152 L589 157', P.tintaLembut, 3, 'opacity="0.55"')}
    ${circle(580, 152, 2.4, P.tintaLembut, 'opacity="0.6"')}`;
}

/** Meja konter kantor: permukaan y 318..340, panel depan 340..440 (tiga panel sama). */
function mejaKonter(): string {
  return `
    ${elips(320, 444, 268, 9, P.tinta, 'opacity="0.1"')}
    ${rect(72, 338, 496, 100, '#dcb88c')}
    ${[80, 246, 412].map((x) => rrect(x + 6, 350, 148, 76, 6, '#d2ad7f')).join('')}
    ${rect(72, 338, 496, 8, '#c99f6d', 'opacity="0.6"')}
    ${rect(78, 434, 484, 8, '#bf9565')}
    ${rrect(60, 316, 520, 24, 8, '#ecd0a2')}
    ${rect(60, 332, 520, 6, '#cfa773')}`;
}

function lantai(): string {
  let papan = '';
  [362, 404, 446].forEach((y, i) => {
    papan += line(`M0 ${y} H640`, '#d9cab0', 2);
    for (let x = i % 2 ? 40 : 110; x < 640; x += 150) papan += line(`M${x} ${y - 42 + 2} V${y - 2}`, '#d9cab0', 2, 'opacity="0.8"');
  });
  return `
    ${rect(0, 316, 640, 164, '#e9ddc6')}
    ${papan}
    ${rect(0, 310, 640, 8, '#cadbc9')}`;
}

function latar(): string {
  return `
    ${rect(0, 0, 640, 318, '#e5efe2')}
    ${rect(0, 0, 640, 12, '#d4e3d3')}
    ${rrect(212, 12, 216, 28, 9, P.hijau, 'opacity="0.92"')}
    ${text(320, 32, 'KANTOR RAKSA', 16, P.krem)}
    ${jendela()}
    ${jamDinding()}
    ${lantai()}
    ${tanaman()}
    ${mejaKonter()}`;
}

// ------------------------------------------------------------------ benda pilihan (124 x 124, alas y≈116)

/**
 * Helm proyek tampak depan: kubah lebih lebar daripada tinggi + tepi (brim) melingkar,
 * supaya terbaca "helm proyek", bukan lonceng. Kuning helm sengaja tidak dibuat
 * satu blok penuh (bagian bawah kubah diberi bayangan & ada sorotan) agar massanya
 * tidak lebih "berteriak" daripada cangkir dan kucing (diukur: luas warna kuat
 * ketiga benda dibuat setara).
 */
function helm(): string {
  return `
    ${shadow(62, 113, 52, 7)}
    ${elips(62, 100, 55, 12, P.kuningTua, INK)}
    ${path('M20 98 C18 62 38 34 62 34 C86 34 106 62 104 98 C90 105 34 105 20 98 Z', P.kuning, INK)}
    ${path('M21.5 84 C40 91 84 91 102.5 84 L104 98 C90 105 34 105 20 98 Z', P.kuningTua, 'opacity="0.5"')}
    ${path('M55 35 C53 56 53 78 55 102 L69 102 C71 78 71 56 69 35 Z', P.kuningTua, INK_TIPIS)}
    ${line('M38 52 C32 64 30 80 31 96 M86 52 C92 64 94 80 93 96', P.kuningTua, 3)}
    ${line('M31 78 C32 62 38 51 47 44', P.putih, 5, 'opacity="0.6"')}`;
}

/** Biru cangkir: sedikit lebih jenuh daripada biruMuda supaya setara dengan helm & kucing. */
const BIRU_CANGKIR = '#5a96d2';

function kopi(): string {
  return `
    ${shadow(62, 115, 52, 7)}
    ${elips(62, 106, 52, 11, P.putih, INK)}
    ${elips(62, 104, 32, 5, '#e3ebee')}
    ${pita('M92 56 C116 52 118 90 90 92', BIRU_CANGKIR, 9)}
    ${path('M24 44 L100 44 L96 94 C95 101 89 105 81 105 L43 105 C35 105 29 101 28 94 Z', BIRU_CANGKIR, INK)}
    ${path('M26 64 L98 64 L97.3 74 L26.7 74 Z', P.krem)}
    ${line('M26 64 L98 64 M26.7 74 L97.3 74', P.tinta, 2, 'opacity="0.35"')}
    ${line('M36 52 L38 94', P.putih, 5, 'opacity="0.4"')}
    ${elips(62, 44, 38, 9, BIRU_CANGKIR, INK)}
    ${elips(62, 45, 31, 5.5, P.cokelat)}
    ${elips(54, 44, 9, 1.8, P.cokelatMuda)}
    ${line('M44 32 C38 24 50 18 44 8 M62 32 C56 22 68 16 62 4 M80 32 C74 24 86 18 80 10', '#97a69d', 5)}`;
}

function kucing(): string {
  const loreng = '#c86a26';
  // Diperbesar 5% dari alas (62,114): kucing semula paling ramping (90 vs ~110 satuan).
  return `
    ${shadow(62, 114, 50, 7)}
    <g transform="translate(62 114) scale(1.05) translate(-62 -114)">
    ${pita('M86 108 C112 108 116 84 104 72', P.oranye, 8)}
    ${path('M32 112 C26 92 32 70 48 62 L76 62 C92 70 98 92 92 112 Z', P.oranye, INK)}
    ${path('M50 66 C56 76 68 76 74 66 C77 82 72 100 62 104 C52 100 47 82 50 66 Z', P.krem)}
    ${line('M36 86 q6 2 10 -3 M34 98 q7 1 12 -3 M88 86 q-6 2 -10 -3 M90 98 q-7 1 -12 -3', loreng, 3)}
    ${rrect(43, 101, 17, 13, 6, P.krem, INK_TIPIS)}${rrect(64, 101, 17, 13, 6, P.krem, INK_TIPIS)}
    ${path('M36 36 L33 8 L56 23 Z', P.oranye, INK)}${path('M88 36 L91 8 L68 23 Z', P.oranye, INK)}
    ${path('M40 29 L39 16 L50 23 Z', '#f2b8a0')}${path('M84 29 L85 16 L74 23 Z', '#f2b8a0')}
    ${elips(62, 44, 30, 26, P.oranye, INK)}
    ${line('M56 22 L57 30 M62 20 V30 M68 22 L67 30', loreng, 3)}
    ${elips(62, 55, 13, 9, P.krem)}
    ${elips(51, 42, 4, 5.2, P.tinta)}${elips(73, 42, 4, 5.2, P.tinta)}
    ${circle(52.4, 40.4, 1.4, P.putih)}${circle(74.4, 40.4, 1.4, P.putih)}
    ${path('M58 50 L66 50 L62 55 Z', '#d9705f')}
    ${line('M62 55 q-3 5 -7 2 M62 55 q3 5 7 2', P.tinta, 2)}
    ${line('M28 50 h14 M29 57 l13 -2 M82 50 h14 M82 55 l13 2', P.tinta, 1.6, 'opacity="0.6"')}
    ${circle(42, 52, 3, P.merah, 'opacity="0.18"')}${circle(82, 52, 3, P.merah, 'opacity="0.18"')}
    </g>`;
}

export function sceneTutorial(): SceneSpec {
  const bg = art('tut-latar', 640, 480, latar());
  // Ketiga benda berdiri di garis meja yang sama (alas gambar y≈328) dan berjarak sama.
  const y = 274;
  return {
    missionId: 'tutorial',
    acakPosisi: ['latihan'],
    background: bg,
    hero: { x: 590, y: 478 },
    walk: { minX: 70, maxX: 596, minY: 462, maxY: 478 },
    objects: [
      {
        id: 'helm', role: 'option', stepId: 'latihan', refId: 'helm', fx: 'choose',
        x: 150, y, art: art('tut-helm', BENDA, BENDA, helm()), label: 'Helm proyek', depth: 20, hit: SENTUH,
      },
      {
        id: 'kopi', role: 'option', stepId: 'latihan', refId: 'kopi', fx: 'choose',
        x: 320, y, art: art('tut-kopi', BENDA, BENDA, kopi()), label: 'Kopi', depth: 20, hit: SENTUH,
      },
      {
        id: 'kucing', role: 'option', stepId: 'latihan', refId: 'kucing', fx: 'choose',
        x: 490, y, art: art('tut-kucing', BENDA, BENDA, kucing()), label: 'Kucing', depth: 20, hit: SENTUH,
      },
    ],
  };
}
