/**
 * Misi 1 - Parkir Kurang Mulus (parkiran kota).
 * Mekanik: PILIH SATU TINDAKAN. Mobil nasabah yang tersenggol sudah terparkir aman
 * (segitiga pengaman, lampu hazard), nasabah menunggu di trotoar. Empat alat/aksi
 * diletakkan simetris di empat sudut sekitar mobil dengan ukuran & bobot warna sama;
 * ketuk satu untuk memilih, ketuk yang lain untuk mengganti.
 */

import type { ArtRef, SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, line, path, rect, rrect, shadow, text, tree } from '../art/kit';
import { warningTriangle } from '../art/props';
import { personArt } from '../art/characters';
import { carSide } from '../art/vehicles';

/** Ukuran seragam semua objek pilihan (supaya sama menonjol). */
const OW = 110;
const OH = 96;

/** Mobil: skala & posisi (pusat) di dunia. carSide asli 300 x 130. */
const MOBIL_S = 0.8;
const MOBIL_X = 312;
const MOBIL_Y = 292;
const MOBIL_W = 240;
const MOBIL_H = 108;

// ------------------------------------------------------------------ latar

function awning(x: number, y: number, w: number, warna: string): string {
  const n = Math.max(3, Math.round(w / 16));
  const lebar = w / n;
  let s = rect(x, y, w, 12, P.krem);
  for (let i = 0; i < n; i += 2) s += rect(x + i * lebar, y, lebar, 12, warna);
  for (let i = 0; i < n; i += 1) s += path(`M${x + i * lebar} ${y + 12} q${lebar / 2} 8 ${lebar} 0 Z`, i % 2 === 0 ? warna : P.krem);
  return s;
}

function toko(x: number, baseY: number, w: number, kaca: string): string {
  // Etalase & pintu di lantai dasar.
  return `${rrect(x + 10, baseY - 28, w * 0.46, 26, 3, kaca, 'opacity="0.9"')}
    ${rrect(x + w * 0.62, baseY - 30, w * 0.26, 30, 3, '#b7a58a')}`;
}

function latar(): string {
  return `
    ${rect(0, 0, 640, 170, P.langit)}
    ${rect(0, 0, 640, 64, P.langitAtas, 'opacity="0.45"')}
    ${cloud(92, 40, 0.75)}${cloud(262, 26, 0.55)}${cloud(430, 50, 0.7)}
    <!-- deretan ruko -->
    ${building(-6, 158, 116, 96, '#eadcc0', { windows: true })}
    ${awning(-6, 118, 116, P.kuning)}
    ${toko(-6, 158, 116, P.kaca)}
    ${building(114, 158, 100, 120, '#cfe0d2', { windows: true })}
    ${toko(114, 158, 100, P.kaca)}
    ${building(218, 158, 124, 88, '#f1dac6', { windows: true })}
    ${awning(218, 124, 124, P.biruMuda)}
    ${toko(218, 158, 124, P.kaca)}
    ${building(346, 158, 104, 110, '#dfe3ee', { windows: true })}
    ${toko(346, 158, 104, P.kaca)}
    ${building(454, 158, 92, 92, '#ecdfc6', { windows: true })}
    ${awning(454, 124, 92, P.oranye)}
    ${toko(454, 158, 92, P.kaca)}
    ${building(550, 158, 96, 124, '#d6e4d8', { windows: true })}
    ${toko(550, 158, 96, P.kaca)}
    <!-- trotoar belakang -->
    ${rect(0, 156, 640, 36, P.beton)}
    ${[40, 100, 160, 220, 280, 340, 400, 460, 520, 580].map((x) => line(`M${x} 158 V190`, P.betonTua, 2, 'opacity="0.6"')).join('')}
    ${rect(0, 190, 640, 8, P.betonTua)}
    ${tree(26, 188, 0.72)}${tree(614, 188, 0.66)}
    <!-- lampu jalan & rambu parkir -->
    ${line('M184 188 V96 q0 -10 -12 -10 h-10', P.besi, 5)}
    ${rrect(144, 80, 20, 9, 4, P.besiTua)}${rect(148, 89, 12, 4, P.kuningPucat)}
    ${line('M474 188 V120', P.besi, 5)}
    ${rrect(460, 92, 28, 28, 5, P.biru)}
    ${text(474, 114, 'P', 20, P.putih, 900)}
    <!-- aspal parkiran -->
    ${rect(0, 198, 640, 254, '#c4c3b7')}
    ${rect(0, 198, 640, 10, '#b3b2a6')}
    ${path('M0 300 C120 290 220 306 330 298 C440 290 540 304 640 296 L640 312 C540 318 440 306 330 314 C220 322 120 306 0 316 Z', '#bbbaae', 'opacity="0.6"')}
    <!-- petak parkir mobil nasabah -->
    ${line('M178 228 H458', P.putih, 4, 'opacity="0.85"')}
    ${line('M178 228 L166 364 M458 228 L470 364', P.putih, 4, 'opacity="0.85"')}
    ${line('M166 364 H470', P.putih, 4, 'opacity="0.85"')}
    <!-- trotoar depan (pita jalan petugas) -->
    ${rect(0, 446, 640, 34, P.beton)}
    ${rect(0, 446, 640, 6, P.betonTua)}
    ${[60, 140, 220, 300, 380, 460, 540, 620].map((x) => line(`M${x} 452 V480`, P.betonTua, 2, 'opacity="0.5"')).join('')}`;
}

// ------------------------------------------------------------------ mobil & properti

/** Warna garis benturan di atas bodi kuning (oranye tua supaya kontras). */
const BENTUR = '#c9621f';

/**
 * Goresan & penyok kecil di pintu belakang (koordinat lokal carSide 300 x 130).
 * Cat terkelupas = bidang pucat bertepi sobek dengan goresan tinta tipis; penyok =
 * cekungan gelap dengan sorot putih di tepi bawah; garis benturan di pilar belakang
 * (di bodi, bukan di kaca, tidak menimpa roda). Tanpa garis sejajar yang terbaca kilap.
 */
function goresan(): string {
  return `
    ${path('M150 88 L158 82 L166 85 L176 79 L186 82 L196 77 L208 80 L214 86 L208 92 L212 98 L198 100 L188 97 L176 102 L166 98 L154 99 L156 93 Z', P.kuningPucat)}
    ${line('M156 92 L172 88 L176 90 L196 84 M160 97 L178 93 L182 95 L204 90', P.tinta, 1.8, 'opacity="0.75"')}
    ${path('M180 86 C188 78 206 78 214 86 C218 92 212 100 200 101 C188 101 178 95 180 86 Z', '#000', 'opacity="0.2"')}
    ${line('M184 96 C192 101 204 101 211 95', P.putih, 2.4, 'opacity="0.85"')}
    ${line('M239 72 l6 -9 M246 80 l10 -4 M249 88 l10 0', BENTUR, 4)}`;
}

function mobil(): string {
  return `<g transform="scale(${MOBIL_S})">${carSide(P.kuning)}${goresan()}</g>`;
}

/** Cahaya lampu hazard (berkedip lembut). Inti jingga supaya terbaca lampu sein, bukan lampu depan. */
function hazard(): string {
  return `${circle(15, 15, 14, P.kuning, 'opacity="0.35"')}${circle(15, 15, 9, P.kuning, 'opacity="0.6"')}${circle(15, 15, 5, P.oranye)}${circle(14, 14, 2, P.kuningPucat)}`;
}

/** Segitiga pengaman (sedikit diperkecil), 44 x 42. */
function segitiga(): string {
  return `${shadow(22, 38, 19, 3)}<g transform="scale(0.86)">${warningTriangle()}</g>`;
}

// ------------------------------------------------------------------ objek pilihan (110 x 96)

/**
 * Buang bagian: tempat sampah berisi potongan bemper (dengan lampu) & panel pintu
 * tergores, kuning seperti mobil nasabah. Pojok kanan atas sengaja kosong: di situ titik ketuk.
 */
function buang(): string {
  return `
    ${shadow(60, 90, 40, 5)}
    <g transform="rotate(24 70 46)">
      ${path('M76 32 L20 32 C12 32 8 37 8 44 L8 48 C8 52 11 54 16 54 L76 54 L70 48 L78 43 L70 38 Z', P.kuning, INK)}
      ${line('M16 49 H70', P.kuningTua, 3)}
      ${rrect(12, 36, 13, 9, 3, '#fff1b8', INK_TIPIS)}
      ${line('M44 32 l-3 8 4 6', P.tinta, 2)}
    </g>
    <g transform="rotate(-8 66 42)">
      ${path('M50 12 C50 8 53 6 57 6 L78 6 C82 6 84 9 84 13 L84 44 L50 44 Z', P.kuning, INK)}
      ${rrect(56, 16, 14, 5, 2.5, P.besiTua)}
      ${line('M54 28 l26 -4 M56 36 l22 -3', P.putih, 3, 'opacity="0.9"')}
      ${line('M54 30 l26 -4 M56 38 l22 -3', P.tinta, 1.4, 'opacity="0.55"')}
    </g>
    ${path('M36 46 L94 46 L88 90 L42 90 Z', P.besi, INK)}
    ${rrect(30, 38, 70, 12, 5, P.besiTua, INK)}
    ${line('M53 58 L54 82 M65 58 V82 M77 58 L76 82', P.besiMuda, 3, 'opacity="0.8"')}
    ${path('M9 89 l5 -8 8 2 -1 6 Z', P.kuning, INK_TIPIS)}
    ${path('M24 91 l3 -6 6 1 1 5 Z', '#fff1b8', INK_TIPIS)}`;
}

/** Abaikan saja: kunci mobil + panah jalan terus (ke depan mobil = kiri). */
function abaikan(): string {
  return `
    ${shadow(55, 90, 42, 5)}
    ${path('M10 32 L38 8 L38 21 L98 21 L98 43 L38 43 L38 56 Z', P.ungu, INK)}
    ${line('M48 32 H88', P.putih, 3, 'opacity="0.35"')}
    ${rrect(14, 68, 36, 12, 3, P.besiMuda, INK_TIPIS)}
    ${line('M21 80 v4 M29 80 v5 M37 80 v4', P.besi, 3)}
    ${rrect(46, 58, 44, 32, 12, P.tinta, INK)}
    ${circle(60, 74, 5, P.besiMuda)}${circle(76, 74, 5, P.kuning)}
    ${circle(98, 74, 8, 'none', `stroke="${P.besi}" stroke-width="4"`)}`;
}

/** Foto & lapor: ponsel berkamera + lembar laporan. */
function fotoLapor(): string {
  return `
    ${shadow(56, 90, 44, 5)}
    <g transform="rotate(8 74 46)">
      ${rrect(48, 8, 54, 72, 6, P.putih, INK)}
      ${rrect(56, 16, 30, 10, 3, P.biru)}
      ${line('M56 36 H92 M56 46 H92 M56 56 H92 M56 66 H78', P.besiMuda, 3)}
    </g>
    ${rrect(10, 16, 46, 74, 9, P.tinta, INK)}
    ${rrect(15, 24, 36, 52, 4, P.biruPucat)}
    ${path('M19 58 C19 52 22 50 26 49 L30 44 C31 43 33 42 35 42 L42 42 C44 42 45 43 46 44 L48 49 C50 50 51 52 51 58 Z', P.kuning)}
    ${circle(25, 58, 3.4, P.besiTua)}${circle(44, 58, 3.4, P.besiTua)}
    ${line('M19 32 v-4 h5 M47 28 h4 v4 M19 68 v4 h5 M51 68 v4 h-4', P.tinta, 2)}
    ${circle(33, 83, 3.6, P.putih)}`;
}

/**
 * Perbaiki langsung: kotak perkakas (pegangan lengkung seperti toolbox() bersama)
 * + kunci pas & obeng. Obeng di luar pojok kanan atas supaya titik ketuk/lencana
 * tidak menutupinya.
 */
function perkakas(): string {
  return `
    ${shadow(55, 90, 44, 5)}
    <g transform="rotate(-16 24 34)">
      ${rrect(19, 18, 10, 36, 4, P.besiMuda, INK_TIPIS)}
      ${path('M14 20 C12 8 20 2 24 2 C28 2 36 8 34 20 L29 18 L27 10 L21 10 L19 18 Z', P.besiMuda, INK_TIPIS)}
    </g>
    <g transform="rotate(7 73 40)">
      ${rrect(70, 26, 6, 26, 2, P.besiMuda, INK_TIPIS)}
      ${rrect(65, 6, 16, 24, 6, P.kuning, INK)}
    </g>
    ${line('M34 46 C34 20 62 20 62 46', P.tinta, 9)}
    ${line('M34 46 C34 20 62 20 62 46', P.besiTua, 4)}
    ${path('M10 50 L100 50 L94 90 L16 90 Z', P.biru, INK)}
    ${rrect(6, 42, 98, 12, 5, P.biru, INK)}
    ${rect(14, 64, 82, 5, '#000', 'opacity="0.16"')}
    ${rrect(47, 60, 16, 12, 3, P.besiMuda, INK_TIPIS)}`;
}

// ------------------------------------------------------------------ adegan

export function sceneParkiran(): SceneSpec {
  const bg = art('m01-latar', 640, 480, latar());
  // personArt 80 x 152 ditampilkan lebih kecil (jauh di trotoar belakang): viewBox tetap, ukuran tampil diperkecil.
  const orang = personArt({ key: 'm01-nasabah', shirt: P.oranye, pants: '#56606b', pose: 'diam' });
  const nasabah: ArtRef = { ...orang, w: 58, h: 110 };
  const kiri = MOBIL_X - MOBIL_W / 2;
  const atas = MOBIL_Y - MOBIL_H / 2;
  return {
    missionId: 'm01-parkir',
    acakPosisi: ['s1'],
    background: bg,
    props: [
      { id: 'nasabah', x: 236, y: 140, art: nasabah, depth: 6 },
      { id: 'segitiga', x: 452, y: 334, art: art('m01-segitiga', 44, 42, segitiga()), depth: 6 },
      { id: 'mobil', x: MOBIL_X, y: MOBIL_Y, art: art('m01-mobil', MOBIL_W, MOBIL_H, mobil()), depth: 8 },
      { id: 'hazard-depan', x: kiri + 25 * MOBIL_S, y: atas + 83 * MOBIL_S, art: art('m01-hazard', 30, 30, hazard()), motion: 'blink', depth: 9 },
      { id: 'hazard-belakang', x: kiri + 286 * MOBIL_S, y: atas + 85 * MOBIL_S, art: art('m01-hazard', 30, 30, hazard()), motion: 'blink', depth: 9 },
    ],
    hero: { x: 320, y: 478 },
    // Pita jalan dibatasi (simetris terhadap hero x 320) supaya petugas berhenti DI SAMPING
    // objek & label bawah, tidak di bawahnya (label 'Perbaiki langsung' mulai x ~425).
    walk: { minX: 240, maxX: 400, minY: 466, maxY: 478 },
    // Empat pilihan di empat sudut sekitar mobil, simetris terhadap tengah (x 112 / 528).
    objects: [
      {
        id: 'buang', role: 'option', stepId: 's1', refId: 'buang', fx: 'choose',
        x: 112, y: 222, art: art('m01-buang', OW, OH, buang()), label: 'Buang bagian', depth: 20,
      },
      {
        id: 'abaikan', role: 'option', stepId: 's1', refId: 'abaikan', fx: 'choose',
        x: 528, y: 222, art: art('m01-abaikan', OW, OH, abaikan()), label: 'Abaikan saja', depth: 20,
      },
      {
        id: 'dokumentasi', role: 'option', stepId: 's1', refId: 'dokumentasi', fx: 'choose',
        x: 112, y: 392, art: art('m01-foto', OW, OH, fotoLapor()), label: 'Foto & lapor', depth: 20,
      },
      {
        // Label terpanjang: digeser sedikit ke kiri supaya tanda pembahasan (lebih lebar) tidak keluar tepi.
        id: 'perbaiki', role: 'option', stepId: 's1', refId: 'perbaiki', fx: 'choose',
        x: 528, y: 392, art: art('m01-perkakas', OW, OH, perkakas()), label: 'Perbaiki langsung', depth: 20,
        labelDx: -8,
      },
    ],
  };
}
