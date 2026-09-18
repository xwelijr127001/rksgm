/**
 * Properti umum yang dipakai lintas adegan: dokumen, map, kartu polis, peti,
 * meja, stempel, papan klip, rak. Bentuk & warna seragam = sistem visual yang
 * konsisten untuk DOKUMEN dan BENDA kerja di seluruh kota.
 *
 * Semua fungsi mengembalikan potongan SVG dalam koordinat lokal (0,0 = kiri atas)
 * dan ukuran yang disebut di komentarnya. Bungkus dengan art(key, w, h, body).
 */

import { INK, INK_TIPIS, P, circle, line, path, rect, rrect, shadow, text } from './kit';

/** Lembar dokumen 70 x 90. `aksen` = warna strip judul; `ikon` opsional di tengah. */
export function docSheet(aksen: string = P.biru, opts: { judul?: string; baris?: number; miring?: number; ikon?: string } = {}): string {
  const baris = opts.baris ?? 4;
  let garis = '';
  for (let i = 0; i < baris; i += 1) garis += line(`M14 ${42 + i * 10} H${i === baris - 1 ? 42 : 56}`, P.besiMuda, 3);
  const isi = `
    ${shadow(35, 88, 30, 4)}
    ${rrect(4, 4, 62, 80, 6, P.putih, INK)}
    ${path('M50 4 L66 20 L50 20 Z', P.kremTua, INK_TIPIS)}
    ${rrect(12, 14, 34, 12, 3, aksen)}
    ${opts.judul ? text(29, 24, opts.judul, 9, P.putih) : ''}
    ${garis}
    ${opts.ikon ?? ''}`;
  return opts.miring ? `<g transform="rotate(${opts.miring} 35 45)">${isi}</g>` : isi;
}

/** Map/berkas terbuka 150 x 110 (tujuan "masuk folder"). */
export function folderOpen(warna: string = P.kuning, label = ''): string {
  return `
    ${shadow(75, 106, 66, 6)}
    ${path('M8 26 L8 14 C8 10 11 8 15 8 L52 8 L60 18 L138 18 C142 18 145 21 145 25 L145 100 L8 100 Z', P.kuningTua, INK)}
    ${rrect(22, 22, 104, 70, 4, P.putih, INK_TIPIS)}
    ${line('M34 38 H112 M34 50 H112 M34 62 H90', P.besiMuda, 3)}
    ${path('M4 44 L141 44 L148 102 L10 102 Z', warna, INK)}
    ${label ? text(76, 80, label, 14, P.tinta) : ''}`;
}

/** Kartu polis 110 x 76 dengan strip produk. */
export function policyCard(judul: string, strip: string = P.hijau): string {
  return `
    ${shadow(55, 74, 48, 4)}
    ${rrect(3, 3, 104, 68, 8, P.krem, INK)}
    ${rrect(3, 3, 104, 20, 8, strip)}
    ${rect(3, 15, 104, 8, strip)}
    ${text(55, 18, judul, 12, P.putih)}
    ${line('M14 36 H70 M14 46 H88 M14 56 H60', P.besiMuda, 3)}
    ${circle(88, 54, 9, P.kuning, INK_TIPIS)}
    ${line('M84 54 l3 3 6 -6', P.tinta, 2.4)}`;
}

/** Binder/map polis berdiri 80 x 100. */
export function binder(warna: string, huruf: string): string {
  return `
    ${shadow(40, 98, 34, 4)}
    ${rrect(6, 4, 68, 90, 6, warna, INK)}
    ${rect(6, 4, 12, 90, '#000', 'opacity="0.18"')}
    ${rrect(26, 22, 38, 44, 4, P.krem, INK_TIPIS)}
    ${text(45, 54, huruf, 26, P.tinta, 900)}
    ${circle(12, 26, 3, P.besiMuda)}${circle(12, 70, 3, P.besiMuda)}`;
}

/** Papan klip 64 x 86. */
export function clipboard(isi = 4): string {
  let g = '';
  for (let i = 0; i < isi; i += 1) g += line(`M14 ${30 + i * 11} H${i % 2 ? 42 : 50}`, P.tintaLembut, 3);
  return `
    ${shadow(32, 84, 26, 4)}
    ${rrect(4, 6, 56, 76, 6, P.kayu, INK)}
    ${rrect(9, 14, 46, 62, 3, P.putih)}
    ${rrect(20, 2, 24, 12, 3, P.besi, INK_TIPIS)}
    ${g}`;
}

/** Peti kayu 80 x 70. `rusak` menambah lekukan & robekan. `nomor` dicat di sisi. */
export function crate(opts: { rusak?: boolean; basah?: boolean; nomor?: string } = {}): string {
  return `
    ${shadow(40, 68, 36, 5)}
    ${rrect(4, 8, 72, 58, 4, P.kayu, INK)}
    ${line('M4 22 H76 M4 52 H76', P.kayuTua, 4)}
    ${line('M10 10 L70 64 M70 10 L10 64', P.kayuTua, 3, 'opacity="0.55"')}
    ${opts.nomor ? rrect(26, 26, 28, 20, 4, P.krem, INK_TIPIS) + text(40, 41, opts.nomor, 14, P.tinta) : ''}
    ${opts.rusak ? path('M4 8 L22 16 L30 8 Z', P.kremTua, INK_TIPIS) + line('M56 12 l-8 12 6 6 -8 10', P.tinta, 3) : ''}
    ${opts.basah ? path('M8 54 C18 48 28 58 38 52 C48 46 58 56 72 50 L72 64 L8 64 Z', P.air, 'opacity="0.55"') : ''}`;
}

/** Meja kerja 220 x 90 (permukaan di y=18). */
export function desk(warna: string = P.kayu): string {
  return `
    ${shadow(110, 88, 100, 5)}
    ${rrect(4, 10, 212, 18, 6, warna, INK)}
    ${rect(16, 28, 12, 58, P.kayuTua)}${rect(192, 28, 12, 58, P.kayuTua)}
    ${rrect(120, 28, 70, 36, 4, P.kayuTua, 'opacity="0.8"')}
    ${circle(155, 46, 3, P.kuning)}`;
}

/** Stempel 56 x 70 dengan warna tinta dan simbol (✓ ✕ ? atau huruf). */
export function stamp(warna: string, simbol: 'cek' | 'silang' | 'tanya' | string): string {
  const s = simbol === 'cek'
    ? line('M18 56 l7 7 13 -14', P.putih, 5)
    : simbol === 'silang'
      ? line('M19 48 l18 16 M37 48 l-18 16', P.putih, 5)
      : simbol === 'tanya'
        ? text(28, 64, '?', 22, P.putih, 900)
        : text(28, 63, simbol, 16, P.putih, 900);
  return `
    ${shadow(28, 68, 24, 3)}
    ${rrect(18, 2, 20, 26, 9, P.cokelat, INK)}
    ${rrect(10, 26, 36, 10, 4, P.besiTua, INK_TIPIS)}
    ${rrect(4, 36, 48, 32, 8, warna, INK)}
    ${s}`;
}

/** Nampan/wadah sortir 150 x 70 dengan label teks pendek. */
export function tray(warna: string, label: string): string {
  return `
    ${shadow(75, 68, 66, 5)}
    ${path('M6 22 L144 22 L134 66 L16 66 Z', warna, INK)}
    ${rrect(2, 14, 146, 12, 5, warna, INK)}
    ${rrect(24, 34, 102, 22, 6, P.krem, INK_TIPIS)}
    ${text(75, 50, label, 13, P.tinta)}`;
}

/** Rak gudang latar (tanpa garis tepi) w x h. */
export function shelf(w: number, h: number, warna: string = P.besiMuda): string {
  let s = rect(0, 0, 8, h, P.besi) + rect(w - 8, 0, 8, h, P.besi);
  for (let y = 20; y < h; y += 56) s += rect(0, y, w, 7, warna);
  return s;
}

/** Ponsel 40 x 70. */
export function phone(layar: string = P.biruPucat): string {
  return `${rrect(3, 3, 34, 64, 7, P.tinta, INK)}${rrect(7, 10, 26, 46, 3, layar)}${circle(20, 61, 2.5, P.besiMuda)}`;
}

/** Kalkulator besar 70 x 90. */
export function calculator(tampil = ''): string {
  let tombol = '';
  for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) tombol += rrect(10 + c * 18, 40 + r * 14, 14, 10, 3, r === 2 && c === 2 ? P.kuning : P.krem);
  return `
    ${shadow(35, 88, 30, 4)}
    ${rrect(4, 4, 62, 82, 8, P.besiTua, INK)}
    ${rrect(10, 12, 50, 20, 4, '#cfe3c6')}
    ${tampil ? text(56, 27, tampil, 11, P.tinta, 800, 'end') : ''}
    ${tombol}`;
}

/** Tas uang 70 x 70 (simbol pembayaran). */
export function moneyBag(): string {
  return `
    ${shadow(35, 68, 28, 4)}
    ${path('M24 16 L46 16 L42 26 C58 32 64 44 62 56 C60 66 50 68 35 68 C20 68 10 66 8 56 C6 44 12 32 28 26 Z', P.kuningPucat, INK)}
    ${line('M26 24 H44', P.cokelat, 4)}
    ${text(35, 56, 'Rp', 16, P.cokelat, 900)}`;
}

/** Tempat sampah 60 x 76. */
export function trashBin(): string {
  return `
    ${shadow(30, 74, 24, 4)}
    ${path('M10 18 L50 18 L46 72 L14 72 Z', P.besiMuda, INK)}
    ${rrect(6, 10, 48, 10, 4, P.besi, INK_TIPIS)}
    ${rrect(22, 4, 16, 8, 3, P.besi, INK_TIPIS)}
    ${line('M22 30 L24 62 M30 30 V62 M38 30 L36 62', P.besi, 3)}`;
}

/** Kotak perkakas 90 x 60. */
export function toolbox(): string {
  return `
    ${shadow(45, 58, 40, 4)}
    ${rrect(6, 18, 78, 38, 6, P.merah, INK)}
    ${path('M30 18 C30 6 60 6 60 18', 'none', `stroke="${P.tinta}" stroke-width="5" stroke-linecap="round"`)}
    ${rect(6, 32, 78, 6, '#000', 'opacity="0.2"')}
    ${rrect(38, 30, 14, 10, 3, P.besiMuda, INK_TIPIS)}`;
}

/** Segitiga pengaman 50 x 46. */
export function warningTriangle(): string {
  return `${path('M25 4 L46 42 L4 42 Z', P.merah, INK)}${path('M25 16 L36 36 L14 36 Z', P.putih)}`;
}

/** Kerucut lalu lintas 40 x 56. */
export function cone(): string {
  return `${shadow(20, 54, 18, 3)}${path('M16 6 L24 6 L34 50 L6 50 Z', P.oranye, INK)}${rect(10, 22, 20, 7, P.putih)}${rrect(2, 48, 36, 7, 3, P.oranye, INK_TIPIS)}`;
}

/** Genangan/banjir: lapisan air semi-transparan selebar w, tinggi h. */
export function floodWater(w: number, h: number): string {
  let d = `M0 12`;
  for (let x = 0; x < w; x += 40) d += ` q20 -10 40 0`;
  return `${path(`${d} L${w} ${h} L0 ${h} Z`, P.air, 'opacity="0.5"')}${line(d, P.putih, 3, 'opacity="0.7"')}`;
}
