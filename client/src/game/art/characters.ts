/**
 * Karakter adegan: petugas (pemain) dan warga/NPC. Pemandu (Raki, tokoh Raksa) tidak
 * digambar di adegan; tempatnya di panel HTML.
 * Proporsi "chibi" (kepala besar) supaya ekspresi terbaca di layar HP.
 */

import type { PlayerLook } from '@shared/types';
import { HAIR_COLORS, SKIN_TONES, UNIFORM_COLORS } from '@shared/brand';
import type { ArtRef } from '../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rrect, shadow } from './kit';

function pilih(daftar: readonly string[], i: number): string {
  const n = daftar.length;
  const b = Number.isFinite(i) ? Math.trunc(i) : 0;
  return daftar[((b % n) + n) % n] ?? daftar[0]!;
}

/** Benda yang dipegang petugas saat beraksi. */
export type HeroProp = 'none' | 'kamera' | 'papan' | 'stempel' | 'tunjuk' | 'kalkulator';

function rambut(body: number, warna: string): string {
  // Kepala: pusat (40, 38), r 22.
  const dasar = `M18 38 C18 20 28 14 40 14 C52 14 62 20 62 38 C58 30 50 27 40 27 C30 27 22 30 18 38 Z`;
  if (body === 1) return path(dasar, warna, INK_TIPIS) + path('M36 16 C46 10 58 14 60 24 C52 20 44 22 36 16 Z', warna, INK_TIPIS);
  if (body === 2) return circle(60, 26, 8, warna, INK_TIPIS) + path(dasar, warna, INK_TIPIS);
  if (body === 3) return circle(26, 20, 7, warna, INK_TIPIS) + circle(40, 14, 8, warna, INK_TIPIS) + circle(54, 20, 7, warna, INK_TIPIS) + path(dasar, warna, INK_TIPIS);
  return path(dasar, warna, INK_TIPIS);
}

function aksesori(jenis: PlayerLook['accessory']): string {
  if (jenis === 'helm') {
    return path('M16 34 C16 16 28 10 40 10 C52 10 64 16 64 34 Z', P.kuning, INK) + rrect(12, 31, 56, 7, 3.5, P.kuning, INK) + line('M40 11 V31', P.kuningTua, 3);
  }
  if (jenis === 'topi') {
    return path('M19 30 C19 16 29 12 40 12 C51 12 61 16 61 30 Z', P.hijau, INK) + rrect(14, 27, 44, 7, 3.5, P.kuning, INK) + circle(40, 13, 3, P.kuning);
  }
  if (jenis === 'headset') {
    return line('M17 40 C17 18 63 18 63 40', P.tinta, 4) + rrect(11, 36, 9, 14, 4, P.tinta) + rrect(60, 36, 9, 14, 4, P.tinta) + line('M16 50 C16 58 22 61 29 61', P.tinta, 3) + circle(30, 61, 3, P.kuning);
  }
  return '';
}

function benda(prop: HeroProp): string {
  // Tangan kanan terangkat di sekitar (70, 64).
  switch (prop) {
    case 'kamera':
      return `<g transform="translate(58 50)">${rrect(0, 0, 30, 21, 5, P.besiTua, INK)}${rrect(8, -5, 12, 7, 2, P.besiTua, INK_TIPIS)}${circle(15, 10.5, 7, P.kaca, INK_TIPIS)}${circle(15, 10.5, 3, P.biru)}${circle(25, 4, 2, P.kuning)}</g>`;
    case 'papan':
      return `<g transform="translate(60 46) rotate(8)">${rrect(0, 0, 24, 32, 3, P.putih, INK)}${rrect(7, -4, 10, 7, 2, P.besi, INK_TIPIS)}${line('M5 11 H19 M5 17 H19 M5 23 H14', P.tintaLembut, 2)}</g>`;
    case 'stempel':
      return `<g transform="translate(62 44)">${rrect(6, 0, 10, 16, 5, P.cokelat, INK_TIPIS)}${rrect(0, 14, 22, 9, 3, P.merah, INK)}</g>`;
    case 'kalkulator':
      return `<g transform="translate(60 48)">${rrect(0, 0, 24, 30, 4, P.besiTua, INK)}${rrect(4, 4, 16, 7, 2, P.kaca)}${circle(8, 17, 2.4, P.krem)}${circle(16, 17, 2.4, P.krem)}${circle(8, 24, 2.4, P.krem)}${circle(16, 24, 2.4, P.kuning)}</g>`;
    case 'tunjuk':
      return '';
    default:
      return '';
  }
}

/**
 * Petugas Raksa (pemain), 80 x 150 satuan. `aksi` = lengan kanan terangkat.
 * Tampilan mengikuti PlayerLook pilihan pemain.
 */
export function heroArt(look: PlayerLook, prop: HeroProp = 'none'): ArtRef {
  const kulit = pilih(SKIN_TONES, look.skin);
  const seragam = pilih(UNIFORM_COLORS, look.color);
  const warnaRambut = pilih(HAIR_COLORS, look.hair);
  const body = ((Math.trunc(Number.isFinite(look.body) ? look.body : 0) % 4) + 4) % 4;
  const aksi = prop !== 'none';
  const lebar = 22 + body * 2;
  const badan = `M${40 - lebar} 112 C${40 - lebar} 82 ${40 - lebar + 6} 68 40 68 C${40 + lebar - 6} 68 ${40 + lebar} 82 ${40 + lebar} 112 Z`;
  const jaket = look.accessory === 'jaket'
    ? path(badan, P.tintaLembut, INK) + line(`M${40 - lebar + 4} 92 H${40 + lebar - 4} M${40 - lebar + 3} 102 H${40 + lebar - 3}`, P.krem, 4, 'opacity="0.9"')
    : '';
  const lenganKiri = path(`M${40 - lebar + 2} 76 C${40 - lebar - 8} 86 ${40 - lebar - 8} 98 ${40 - lebar - 2} 106`, 'none', `stroke="${P.tinta}" stroke-width="13" stroke-linecap="round"`) +
    path(`M${40 - lebar + 2} 76 C${40 - lebar - 8} 86 ${40 - lebar - 8} 98 ${40 - lebar - 2} 106`, 'none', `stroke="${seragam}" stroke-width="8" stroke-linecap="round"`) +
    circle(40 - lebar - 2, 108, 5.5, kulit, INK_TIPIS);
  const lenganKanan = aksi
    ? path(`M${40 + lebar - 2} 78 C${40 + lebar + 10} 74 ${40 + lebar + 12} 66 70 58`, 'none', `stroke="${P.tinta}" stroke-width="13" stroke-linecap="round"`) +
      path(`M${40 + lebar - 2} 78 C${40 + lebar + 10} 74 ${40 + lebar + 12} 66 70 58`, 'none', `stroke="${seragam}" stroke-width="8" stroke-linecap="round"`) +
      circle(71, 56, 5.5, kulit, INK_TIPIS)
    : path(`M${40 + lebar - 2} 76 C${40 + lebar + 8} 86 ${40 + lebar + 8} 98 ${40 + lebar + 2} 106`, 'none', `stroke="${P.tinta}" stroke-width="13" stroke-linecap="round"`) +
      path(`M${40 + lebar - 2} 76 C${40 + lebar + 8} 86 ${40 + lebar + 8} 98 ${40 + lebar + 2} 106`, 'none', `stroke="${seragam}" stroke-width="8" stroke-linecap="round"`) +
      circle(40 + lebar + 2, 108, 5.5, kulit, INK_TIPIS);
  const tunjuk = prop === 'tunjuk' ? line('M71 56 L78 48', kulit, 4) : '';

  const body_ = `
    ${shadow(40, 146, 26, 6)}
    ${rrect(26, 108, 12, 34, 6, '#3c4a52', INK_TIPIS)}
    ${rrect(42, 108, 12, 34, 6, '#3c4a52', INK_TIPIS)}
    ${rrect(22, 136, 18, 9, 4.5, P.tinta)}
    ${rrect(40, 136, 18, 9, 4.5, P.tinta)}
    ${lenganKiri}
    ${path(badan, seragam, INK)}
    ${jaket}
    ${path('M32 69 L40 78 L48 69 Z', P.putih, INK_TIPIS)}
    ${rrect(27, 86, 14, 11, 3, P.kuning, INK_TIPIS)}
    ${line('M30 91.5 l3 3 5 -5', P.tinta, 2)}
    ${lenganKanan}${tunjuk}
    ${rrect(35, 58, 10, 12, 4, kulit)}
    ${circle(18, 42, 5, kulit, INK_TIPIS)}${circle(62, 42, 5, kulit, INK_TIPIS)}
    ${circle(40, 38, 22, kulit, INK)}
    ${rambut(body, warnaRambut)}
    ${circle(32, 41, 3, P.tinta)}${circle(48, 41, 3, P.tinta)}
    ${circle(33, 40, 1, P.putih)}${circle(49, 40, 1, P.putih)}
    ${circle(27, 48, 3.4, P.merah, 'opacity="0.2"')}${circle(53, 48, 3.4, P.merah, 'opacity="0.2"')}
    ${line(aksi ? 'M34 49 Q40 55 46 49' : 'M35 50 Q40 53 45 50', P.tinta, 2.4)}
    ${aksesori(look.accessory)}
    ${benda(prop)}`;
  const key = `hero-${body}-${look.skin}-${look.hair}-${look.color}-${look.accessory}-${prop}`;
  return art(key, 90, 152, body_);
}


export interface PersonOpts {
  key: string;
  skin?: string;
  hair?: string;
  shirt: string;
  pants?: string;
  helmet?: boolean;
  vest?: boolean;
  apron?: string;
  /** Tangan melambai / memegang papan. */
  pose?: 'diam' | 'lambai' | 'papan' | 'bicara';
  mood?: 'senyum' | 'cemas' | 'netral';
}

/** Warga/NPC generik, 80 x 150 (proporsi sama dengan petugas). */
export function personArt(o: PersonOpts): ArtRef {
  const kulit = o.skin ?? SKIN_TONES[1]!;
  const rambutW = o.hair ?? HAIR_COLORS[0]!;
  const celana = o.pants ?? '#4b5563';
  const lambai = o.pose === 'lambai';
  const badan = 'M16 112 C16 82 22 68 40 68 C58 68 64 82 64 112 Z';
  const lengan = (kanan: boolean, naik: boolean): string => {
    const d = kanan
      ? naik ? 'M60 78 C70 72 72 62 70 52' : 'M60 78 C68 88 68 98 64 106'
      : 'M20 78 C12 88 12 98 16 106';
    const ujung = kanan ? (naik ? [70, 50] : [64, 108]) : [16, 108];
    return path(d, 'none', `stroke="${P.tinta}" stroke-width="13" stroke-linecap="round"`) +
      path(d, 'none', `stroke="${o.shirt}" stroke-width="8" stroke-linecap="round"`) +
      circle(ujung[0]!, ujung[1]!, 5.5, kulit, INK_TIPIS);
  };
  const mulut = o.mood === 'cemas' ? 'M35 52 Q40 48 45 52' : o.pose === 'bicara' ? 'M36 49 Q40 55 44 49 Z' : 'M35 50 Q40 54 45 50';
  const body = `
    ${shadow(40, 146, 26, 6)}
    ${rrect(26, 108, 12, 34, 6, celana, INK_TIPIS)}${rrect(42, 108, 12, 34, 6, celana, INK_TIPIS)}
    ${rrect(22, 136, 18, 9, 4.5, P.tinta)}${rrect(40, 136, 18, 9, 4.5, P.tinta)}
    ${lengan(false, false)}
    ${path(badan, o.shirt, INK)}
    ${o.vest ? path('M22 76 L32 70 L34 112 L18 112 Z', P.oranye, INK_TIPIS) + path('M58 76 L48 70 L46 112 L62 112 Z', P.oranye, INK_TIPIS) + line('M19 96 H33 M47 96 H61', P.kuningPucat, 4) : ''}
    ${o.apron ? path('M26 80 H54 V114 H26 Z', o.apron, INK_TIPIS) : ''}
    ${lengan(true, lambai)}
    ${o.pose === 'papan' ? `<g transform="translate(46 80) rotate(-6)">${rrect(0, 0, 22, 28, 3, P.putih, INK)}${line('M5 9 H17 M5 15 H17 M5 21 H12', P.tintaLembut, 2)}</g>` : ''}
    ${rrect(35, 58, 10, 12, 4, kulit)}
    ${circle(18, 42, 5, kulit, INK_TIPIS)}${circle(62, 42, 5, kulit, INK_TIPIS)}
    ${circle(40, 38, 22, kulit, INK)}
    ${path('M18 38 C18 20 28 14 40 14 C52 14 62 20 62 38 C58 30 50 27 40 27 C30 27 22 30 18 38 Z', rambutW, INK_TIPIS)}
    ${circle(32, 41, 3, P.tinta)}${circle(48, 41, 3, P.tinta)}
    ${o.mood === 'cemas' ? line('M28 33 l7 2 M52 33 l-7 2', P.tinta, 2) : ''}
    ${line(mulut, P.tinta, 2.4)}
    ${o.helmet ? path('M16 34 C16 16 28 10 40 10 C52 10 64 16 64 34 Z', P.kuning, INK) + rrect(12, 31, 56, 7, 3.5, P.kuning, INK) : ''}`;
  return art(o.key, 80, 152, body);
}
