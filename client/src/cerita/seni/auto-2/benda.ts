/**
 * Gambar ARENA EPISODE AUTO-2 untuk antarmuka HP (cerita/hp): dokumen kasus, baki, kartu saksi tak dikenal, truk,
 * tempat di peta penugasan, tujuan foto kerusakan, kartu & pilihan rencana kerja, stempel, bundel pengajuan.
 * Sistem visual yang sama (game/art/kit.ts): datar, garis tinta untuk benda yang bisa disentuh. Warna baki/pin/stempel
 * dari AKSEN menurut urutan wadah, selalu bersama label teks (bukan warna saja). Tidak ada penilaian di sini.
 *
 * Semua fungsi mengembalikan potongan SVG dalam koordinat lokal (0,0 = kiri atas) seukuran yang disebut di komentarnya.
 * Hanya diimpor episode/auto-2/arena.ts, jadi ikut dikeluarkan dari build bersama episodenya (VITE_CERITA_TANPA=auto-2).
 */

import { INK, INK_TIPIS, P, circle, line, path, rect, rrect, shadow, text } from '../../../game/art/kit';
import { wheel } from '../../../game/art/vehicles';

/** Warna wadah menurut urutannya di langkah (biru, ungu, cokelat, teal, plum): tua = bibir/pin, pucat = isi. */
export const AKSEN = [
  { tua: '#2f6fb0', pucat: '#dce7f3' },
  { tua: '#7a5aa6', pucat: '#e7e0f0' },
  { tua: '#b26b1f', pucat: '#f1e3cf' },
  { tua: '#2e7d7a', pucat: '#d9eceb' },
  { tua: '#9c4a7a', pucat: '#f1dfe9' },
] as const;
export type Aksen = { readonly tua: string; readonly pucat: string };

const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = ''): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;

// ------------------------------------------------------------------ ikon kecil (pusat cx, cy; ± 10 satuan)

export function ikonKilat(cx: number, cy: number, w: string): string {
  return path(`M${cx + 3} ${cy - 11} L${cx - 7} ${cy + 2} H${cx} L${cx - 3} ${cy + 11} L${cx + 7} ${cy - 2} H${cx} Z`, w);
}
export function ikonJam(cx: number, cy: number, w: string): string {
  return circle(cx, cy, 8.5, 'none', `stroke="${w}" stroke-width="2.6"`) + line(`M${cx} ${cy - 5} V${cy} H${cx + 4}`, w, 2.4);
}
export function ikonCek(cx: number, cy: number, w: string): string {
  return line(`M${cx - 8} ${cy} l5 6 11 -12`, w, 3.4);
}
function ikonTelepon(cx: number, cy: number, w: string): string {
  return path(`M${cx - 8} ${cy - 9} C${cx - 11} ${cy - 3} ${cx - 4} ${cy + 9} ${cx + 7} ${cy + 9} L${cx + 9} ${cy + 4} L${cx + 4} ${cy + 1} L${cx + 1} ${cy + 4} C${cx - 2} ${cy + 2} ${cx - 4} ${cy} ${cx - 5} ${cy - 3} L${cx - 2} ${cy - 6} L${cx - 5} ${cy - 11} Z`, w);
}

/** Pin peta 26 x 34 (ujung di cx, cy). */
export function pin(cx: number, cy: number, warna: string): string {
  return `${ellipse(cx, cy, 6, 2, P.tinta, 'opacity="0.2"')}
    ${path(`M${cx} ${cy} C${cx - 4} ${cy - 10} ${cx - 12} ${cy - 15} ${cx - 12} ${cy - 23} C${cx - 12} ${cy - 30} ${cx - 7} ${cy - 35} ${cx} ${cy - 35} C${cx + 7} ${cy - 35} ${cx + 12} ${cy - 30} ${cx + 12} ${cy - 23} C${cx + 12} ${cy - 15} ${cx + 4} ${cy - 10} ${cx} ${cy} Z`, warna, INK_TIPIS)}
    ${circle(cx, cy - 23, 4.5, P.putih)}`;
}

// ------------------------------------------------------------------ dokumen kasus (104 x 80)

function kartuDasar(isi: string, warna: string, kepala: string, judul: string, ukuranJudul = 10): string {
  return `
    ${shadow(52, 75, 46, 4)}
    ${rrect(6, 10, 92, 62, 8, warna, INK)}
    ${path(`M14 10 H90 C94.4 10 98 13.6 98 18 V27 H6 V18 C6 13.6 9.6 10 14 10 Z`, kepala)}
    ${text(52, 23, judul, ukuranJudul, P.putih)}
    ${rrect(6, 10, 92, 62, 8, 'none', INK)}
    ${isi}`;
}

// ------------------------------------------------------------------ wadah

/** Baki sortir 150 x 72: bibir & isi sewarna stiker kategori, ikon kategori di plakat krem. */
export function baki(a: Aksen, ikon: (cx: number, cy: number, w: string) => string): string {
  return `
    ${shadow(75, 68, 66, 5)}
    ${path('M8 24 L142 24 L132 66 L18 66 Z', a.pucat, INK)}
    ${rrect(3, 16, 144, 12, 6, a.tua, INK)}
    ${rrect(55, 35, 40, 26, 7, P.krem, INK_TIPIS)}
    ${ikon(75, 48, a.tua)}`;
}

// ------------------------------------------------------------------ tokoh (kartu & dada)

// ------------------------------------------------------------------ truk trailer (dipakai peta & pool)

// ------------------------------------------------------------------ peta (K04)

/** Tempat di peta 132 x 100: `gambar` digambar di kotak 0..132 x 8..100, pin sewarna kategori di pojok kanan atas. */
function tempat(a: Aksen, gambar: string): string {
  return `${ellipse(66, 94, 60, 6, P.tinta, 'opacity="0.13"')}${gambar}${pin(116, 36, a.tua)}`;
}

// (T-020 batch 1: lokKantor / lokMejaFoto / lokPool / lokBengkel dihapus; kelima tempat K04 kini ubin piksel, seni/aktivitas/peta.)

// ------------------------------------------------------------------ bengkel mitra (K05)

// ------------------------------------------------------------------ papan rencana (K07)

/** Kartu "Pemeriksaan kejadian" 120 x 80: pin lokasi + dua orang (saksi). */
export function kartuPemeriksaan(): string {
  return `
    ${shadow(60, 76, 52, 4)}
    ${rrect(6, 6, 108, 66, 8, '#fff6dc', INK)}
    ${rrect(6, 6, 108, 18, 8, P.kuningTua)}${rect(6, 16, 108, 8, P.kuningTua)}
    ${text(60, 19.5, 'PEMERIKSAAN', 9, P.putih)}
    ${pin(32, 62, P.merah)}
    ${circle(66, 40, 6, '#d9a77e', INK_TIPIS)}${path('M56 62 C56 50 76 50 76 62 Z', '#8fb3d9', INK_TIPIS)}
    ${circle(90, 40, 6, '#c98f62', INK_TIPIS)}${path('M80 62 C80 50 100 50 100 62 Z', '#f08a2c', INK_TIPIS)}`;
}

// ------------------------------------------------------------------ bundel pengajuan (K11)

/**
 * Map pengajuan terbuka, 232 x 128: satu slot per kelompok berkas (urut daftar isi). Slot terisi = lembar bergaris; slot
 * kosong = bingkai putus-putus abu (netral: menunjukkan fakta "belum tersedia", bukan peringatan atau jawaban).
 */
export function mapPengajuan(isi: readonly boolean[]): string {
  const lebar = 24;
  const sela = 5;
  const x0 = (232 - (isi.length * lebar + (isi.length - 1) * sela)) / 2;
  const slot = isi.map((ada, i) => {
    const x = x0 + i * (lebar + sela);
    return ada
      ? rrect(x, 26, lebar, 64, 3, P.putih, INK_TIPIS) + line(`M${x + 5} 38 H${x + lebar - 5} M${x + 5} 47 H${x + lebar - 7} M${x + 5} 56 H${x + lebar - 5}`, P.besiMuda, 2.2)
      : rrect(x + 1, 27, lebar - 2, 62, 3, '#f7f3e8', 'stroke="#6f7d73" stroke-width="2" stroke-dasharray="5 4"');
  }).join('');
  return `
    ${shadow(116, 122, 106, 5)}
    ${rrect(14, 6, 64, 22, 6, '#e3c995', INK_TIPIS)}
    ${rrect(8, 16, 216, 100, 8, '#e7d2b4', INK_TIPIS)}
    ${slot}
    ${path('M4 66 L228 66 L221 118 L11 118 Z', P.kuning, INK)}`;
}

// ------------------------------------------------------------------ meja kasus (PROTOTIPE K11, D-68)

/**
 * Permukaan meja kerja tampak atas, 360 x 400: papan kayu hangat + alas hijau Raksa di bawah map. Hanya latar: tidak ada
 * benda yang terlihat bisa disentuh selain objek adegan (map, baki, kontak, papan) yang digambar di atasnya.
 */
export function mejaKayu(): string {
  let papan = '';
  for (let y = 0; y < 400; y += 80) {
    papan += rect(0, y, 360, 80, y % 160 === 0 ? '#cf9f68' : '#c99862');
    papan += line(`M0 ${y + 0.5} H360`, '#a9773f', 1.5, 'opacity="0.55"');
    for (let i = 0; i < 3; i += 1) {
      const yy = y + 18 + i * 22;
      papan += line(`M${-10 + i * 37} ${yy} C80 ${yy - 6} 160 ${yy + 7} 240 ${yy - 2} S340 ${yy + 5} 380 ${yy}`, '#b17f4a', 1.4, 'opacity="0.35"');
    }
  }
  return `${papan}
    ${rrect(8, 60, 214, 226, 16, '#2f6b52')}
    ${rrect(15, 67, 200, 212, 12, 'none', 'stroke="#f6c445" stroke-width="1.6" stroke-dasharray="6 5" opacity="0.55"')}`;
}

/** Map pengajuan tertutup tampak atas, 190 x 140: map kuning bertab, ujung lembar berkas menyembul, penjepit. */
export function mapTertutup(): string {
  return `
    ${shadow(97, 132, 86, 7, 0.22)}
    ${rrect(18, 4, 62, 24, 6, '#e3c995', INK_TIPIS)}
    ${rrect(10, 14, 172, 116, 8, '#e7d2b4', INK_TIPIS)}
    ${rrect(22, 10, 150, 30, 3, P.putih, INK_TIPIS)}${rrect(30, 6, 140, 30, 3, '#fbfaf5', INK_TIPIS)}
    ${line('M42 18 H120 M42 26 H104', P.besiMuda, 2.4)}
    ${path('M6 30 L184 30 C186 30 187 31 187 33 L181 128 C181 130 179 132 177 132 L13 132 C11 132 9 130 9 128 L3 33 C3 31 4 30 6 30 Z', P.kuning, INK)}
    ${rrect(52, 64, 86, 34, 6, '#fff9e9', INK_TIPIS)}
    ${line('M62 76 H128 M62 86 H112', P.besiMuda, 3)}
    ${rrect(150, 2, 14, 40, 6, P.besi, INK_TIPIS)}${rrect(153, 6, 8, 30, 4, '#c7d0cb')}`;
}

/** Map terbuka tampak atas (bidikan dekat), 344 x 372: dua sisi map dengan lipatan di tengah; kartu berkas digambar di atasnya. */
export function mapTerbuka(): string {
  return `
    ${shadow(172, 364, 160, 8, 0.25)}
    ${rrect(4, 8, 336, 356, 14, P.kuningTua, INK)}
    ${rrect(12, 16, 158, 340, 10, P.kuning)}${rrect(174, 16, 158, 340, 10, P.kuning)}
    ${line('M172 18 V354', '#b98c1a', 3)}
    ${rrect(18, 22, 146, 328, 8, '#fbe7a6', 'opacity="0.6"')}${rrect(180, 22, 146, 328, 8, '#fbe7a6', 'opacity="0.6"')}`;
}

/**
 * Kartu kontak kasus, 120 x 132: kop hijau berikon telepon, lingkaran potret (potret tokoh digambar engine di atasnya);
 * bagian bawah kosong untuk lencana kabar (draf / terkirim / tidak mengabari) yang digambar engine.
 */
export function kartuKontak(): string {
  return `
    ${shadow(60, 126, 52, 5, 0.2)}
    ${rrect(6, 6, 108, 118, 12, P.putih, INK)}
    ${path('M18 6 H102 C108.6 6 114 11.4 114 18 V30 H6 V18 C6 11.4 11.4 6 18 6 Z', P.hijau)}
    ${ikonTelepon(28, 18, P.putih)}${text(66, 23, 'KONTAK', 11, P.putih)}
    ${rrect(6, 6, 108, 118, 12, 'none', INK)}
    ${circle(60, 58, 28, P.hijauPucat, INK_TIPIS)}`;
}

