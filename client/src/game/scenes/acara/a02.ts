/**
 * Misi acara 02 - Jepret Dulu, Baru Angkut (parkiran ruko, latar misi latihan 1 dipakai utuh).
 * Mekanik: KAMERA BUKTI. Ketuk benda untuk memotretnya; foto masuk album (maks 3),
 * ketuk lagi untuk membatalkan. Posisi objek terikat bendanya, jadi TANPA acakPosisi.
 * - Truk kurir & kurir hanya properti (tanpa titik ketuk).
 * - Tumpukan peti = objek besar; peti #5 berdiri di depannya dengan depth lebih tinggi
 *   (pola mobil/penyok misi latihan 2); label kiriman digambar sebagai sisipan yang diperbesar.
 * - Label tumpukan ditaruh DI ATAS tumpukan supaya tiga label di pojok kanan tidak bertumpuk.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rect, rrect, shadow, text } from '../../art/kit';
import { crate } from '../../art/props';
import { personArt } from '../../art/characters';
import { truck, wheel } from '../../art/vehicles';
import { latar as latarParkiran } from '../m01-parkiran';

const KULIT = '#e0ac7e';
const KULIT_KURIR = '#c98f62';
const MERAH_MUDA = '#f4b8c6';

/** Truk kurir: truck() asli 340 x 170, ditampilkan 0.7 = 238 x 119. */
const TRUK_S = 0.7;
/** Peti di tumpukan: crate() asli 80 x 70, diperkecil supaya lima peti muat di satu palet. */
const PETI_S = 0.62;

// ------------------------------------------------------------------ properti

/**
 * Truk kurir (menghadap kiri) dengan pita jingga & lambang paket di bak. Kabin memakai warna
 * bawaan truck() (biru): parameternya bertipe literal, jadi warna kurir dibawa pita & seragam.
 */
function trukKurir(): string {
  return `<g transform="scale(${TRUK_S})">
    ${truck()}
    ${rect(113, 116, 214, 8, P.oranye, 'opacity="0.9"')}
    ${rrect(198, 58, 46, 40, 5, P.kayu, INK_TIPIS)}
    ${line('M198 72 H244 M221 58 V72', P.kayuTua, 3)}
  </g>`;
}

// ------------------------------------------------------------------ objek foto

function petiTumpuk(x: number, y: number, nomor: string): string {
  return `<g transform="translate(${x} ${y}) scale(${PETI_S})">${crate({ nomor })}</g>`;
}

/** Palet berisi lima peti (bawah #1-#3, atas #4 & #6), 170 x 92. Peti #5 sudah diturunkan ke depan. */
function tumpukan(): string {
  return `
    ${shadow(85, 88, 80, 4)}
    ${rrect(12, 84, 18, 6, 2, P.kayuTua, INK_TIPIS)}${rrect(76, 84, 18, 6, 2, P.kayuTua, INK_TIPIS)}${rrect(140, 84, 18, 6, 2, P.kayuTua, INK_TIPIS)}
    ${rrect(4, 77, 162, 8, 2, P.kayu, INK_TIPIS)}
    ${petiTumpuk(8, 37, '1')}${petiTumpuk(60, 37, '2')}${petiTumpuk(112, 37, '3')}
    ${petiTumpuk(34, 1, '4')}${petiTumpuk(86, 1, '6')}`;
}

/**
 * Peti #5, 80 x 70, penyok di SATU sisi (kanan): pojok kanan atas remuk, cekungan gelap dengan
 * sorot di tepi bawah, retakan, dan garis benturan jingga (pola dentPatch; bukan warna penilaian).
 * Kerusakan digambar sendiri, bukan crate({ rusak }), supaya retakan tidak menimpa nomor peti.
 */
function petiPenyok(): string {
  return `
    ${crate({ nomor: '5' })}
    ${path('M77 7 L60 7 L66 13 L63 19 L77 23 Z', P.kremTua, INK_TIPIS)}
    ${path('M59 24 C65 18 76 22 76 32 C76 44 66 51 59 45 C53 39 53 30 59 24 Z', '#000', 'opacity="0.2"')}
    ${line('M62 27 l6 6 -6 5 5 6', P.tinta, 2.6)}
    ${line('M61 46 C66 50 72 46 75 39', P.putih, 2.4, 'opacity="0.8"')}
    ${line('M67 5 l3 -4 M75 4 l4 -3', P.oranye, 4)}`;
}

/** Batang-batang kode pada label kiriman (hiasan, bukan kode sungguhan). */
function kodeBatang(x: number, y: number, h: number): string {
  const pola = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 2];
  let s = '';
  let cx = x;
  pola.forEach((n, i) => {
    const w = n * 1.5;
    if (i % 2 === 0) s += rect(cx, y, w, h, P.tinta);
    cx += w;
  });
  return s;
}

/**
 * Label kiriman yang diperbesar, 104 x 72: strip kurir, nomor peti, baris alamat, kode batang.
 * Ekor di kiri atas menunjuk ke peti #5 (label itu menempel di peti tersebut).
 */
function labelKiriman(): string {
  return `
    ${shadow(58, 68, 40, 3)}
    ${path('M2 2 L32 14 L16 30 Z', P.krem, INK_TIPIS)}
    ${rrect(14, 10, 86, 56, 6, P.krem, INK)}
    ${path('M8 7 L29 15 L18 26 Z', P.krem)}
    ${rrect(21, 17, 42, 10, 3, P.oranye)}
    ${rrect(70, 15, 25, 19, 4, P.putih, INK_TIPIS)}
    ${text(82.5, 30, '5', 15, P.tinta, 900)}
    ${line('M22 35 H62 M22 42 H54', P.besiMuda, 3)}
    ${kodeBatang(21, 48, 12)}
    ${rrect(76, 44, 17, 15, 2, P.kayu, INK_TIPIS)}${line('M76 50 H93', P.kayuTua, 2)}`;
}

/** Ponsel di tongkat berkaki tiga, 76 x 110: layar memperlihatkan petugas & kurir berswafoto. */
function selfie(): string {
  return `
    ${shadow(38, 106, 22, 4)}
    ${line('M38 104 L38 46', P.tinta, 7)}${line('M38 104 L38 46', P.besi, 3)}
    ${line('M24 106 L38 88 L52 106', P.tinta, 5)}
    ${rrect(6, 2, 62, 48, 8, P.tinta, INK)}
    ${rrect(11, 7, 52, 38, 4, P.kuningPucat)}
    ${path('M13 45 C14 35 19 31 26 31 C33 31 38 35 39 45 Z', P.hijau)}
    ${circle(26, 23, 8, KULIT)}
    ${path('M18 21 C19 13 33 13 34 21 C30 17 22 17 18 21 Z', '#2b2118')}
    ${line('M22.5 26 q3.5 4 7 0', P.tinta, 1.6)}
    ${path('M36 45 C37 35 42 32 48 32 C54 32 60 35 61 45 Z', P.oranye)}
    ${circle(48, 24, 8, KULIT_KURIR)}
    ${path('M40 21 C40 13 56 13 56 21 Z', P.oranye)}${rrect(46, 19, 14, 3.5, 1.7, P.oranye)}
    ${line('M44.5 27 q3.5 4 7 0', P.tinta, 1.6)}
    ${line('M70 8 l4 -4 M71 18 h4 M70 28 l4 3', P.kuningTua, 3)}`;
}

/** Spanduk promo toko sebelah, 132 x 56, terikat tali di atas awning. */
function spanduk(): string {
  return `
    ${line('M2 4 L14 13 M130 4 L118 13 M3 52 L14 44 M129 52 L118 44', P.besiTua, 2.5)}
    ${rrect(12, 10, 108, 36, 4, P.ungu, INK)}
    ${rect(14, 39, 104, 5, '#000', 'opacity="0.14"')}
    ${circle(33, 28, 12, P.kuning, INK_TIPIS)}
    ${text(33, 33.5, '%', 15, P.tinta, 900)}
    ${text(83, 34.5, 'PROMO', 17, P.krem, 900)}`;
}

/** Gerobak es di trotoar, 100 x 92: payung bergaris, kotak pendingin, gelas es, lambang es krim. */
function gerobakEs(): string {
  return `
    ${shadow(50, 88, 42, 5)}
    ${line('M50 24 V52', P.tinta, 6)}${line('M50 24 V52', P.besiMuda, 2.5)}
    ${path('M6 27 C9 12 28 6 50 6 C72 6 91 12 94 27 Z', P.biruMuda, INK)}
    ${path('M34 27 C36 14 42 6 50 6 C58 6 64 14 66 27 Z', P.putih, INK_TIPIS)}
    ${rrect(17, 39, 10, 12, 2, MERAH_MUDA, INK_TIPIS)}${rrect(30, 41, 9, 10, 2, P.kuningPucat, INK_TIPIS)}
    ${rrect(60, 37, 24, 14, 3, P.biruPucat, INK_TIPIS)}
    ${line('M86 56 L97 47', P.tinta, 6)}${line('M86 56 L97 47', P.besi, 2.5)}
    ${rrect(12, 50, 76, 28, 5, P.putih, INK)}
    ${rect(14, 69, 72, 6, P.biruMuda)}
    ${path('M44.5 61 L55.5 61 L50 73 Z', P.kuningTua, INK_TIPIS)}
    ${circle(50, 58, 5.5, MERAH_MUDA, INK_TIPIS)}
    ${wheel(30, 80, 9)}${wheel(70, 80, 9)}`;
}

// ------------------------------------------------------------------ adegan

function sceneJepretKiriman(): SceneSpec {
  const bg = art('m01-latar', 640, 480, latarParkiran());
  // personArt 80 x 152 ditampilkan lebih kecil (viewBox tetap, ukuran tampil diperkecil) seperti nasabah misi latihan 1.
  const orang = personArt({ key: 'a02-kurir', skin: KULIT_KURIR, shirt: P.oranye, pants: '#3f4d46', pose: 'lambai' });
  const kurir: ArtRef = { ...orang, w: 58, h: 110 };
  return {
    missionId: 'a02-jepret-kiriman',
    background: bg,
    props: [
      { id: 'truk', x: 288, y: 264, art: art('a02-truk', 238, 119, trukKurir()), depth: 8 },
      { id: 'kurir', x: 150, y: 340, art: kurir, depth: 10 },
    ],
    hero: { x: 280, y: 478 },
    // Pita jalan sempit di tengah bawah: petugas tidak pernah menutupi swafoto (kiri) maupun peti #5 & label (kanan).
    walk: { minX: 230, maxX: 320, minY: 466, maxY: 478 },
    objects: [
      {
        id: 'spanduk', role: 'option', stepId: 'bukti', refId: 'spanduk', fx: 'photo',
        x: 280, y: 100, art: art('a02-spanduk', 132, 56, spanduk()), label: 'Spanduk promo', depth: 20,
      },
      {
        id: 'gerobak', role: 'option', stepId: 'bukti', refId: 'gerobak', fx: 'photo',
        x: 98, y: 152, art: art('a02-gerobak', 100, 92, gerobakEs()), label: 'Gerobak es', depth: 20,
      },
      {
        // Label di atas tumpukan (di tepi trotoar), bukan di bawah: di bawahnya ada peti #5 & label kiriman.
        id: 'tumpukan', role: 'option', stepId: 'bukti', refId: 'tumpukan', fx: 'photo',
        x: 535, y: 300, art: art('a02-tumpukan', 170, 92, tumpukan()), label: 'Tumpukan peti', depth: 20,
        labelDy: -133,
      },
      {
        // Di depan pojok kiri bawah tumpukan; depth lebih tinggi supaya ketukan di sini tidak jatuh ke tumpukan.
        id: 'penyok', role: 'option', stepId: 'bukti', refId: 'penyok', fx: 'photo',
        x: 432, y: 356, art: art('a02-peti5', 80, 70, petiPenyok()), label: 'Sisi penyok', depth: 24,
        hit: { w: 88, h: 78 },
      },
      {
        id: 'label', role: 'option', stepId: 'bukti', refId: 'label', fx: 'photo',
        x: 570, y: 396, art: art('a02-label', 104, 72, labelKiriman()), label: 'Label peti', depth: 24,
      },
      {
        id: 'selfie', role: 'option', stepId: 'bukti', refId: 'selfie', fx: 'photo',
        x: 66, y: 352, art: art('a02-selfie', 76, 110, selfie()), label: 'Selfie kurir', depth: 20,
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a02-jepret-kiriman',
  buat: sceneJepretKiriman,
};
