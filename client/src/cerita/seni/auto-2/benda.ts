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
export function ikonSilang(cx: number, cy: number, w: string): string {
  return line(`M${cx - 7} ${cy - 7} L${cx + 7} ${cy + 7} M${cx + 7} ${cy - 7} L${cx - 7} ${cy + 7}`, w, 3.4);
}
/** Gelembung bicara (wawancarai): arti tindakan, bukan tanda "benar". */
export function ikonBicara(cx: number, cy: number, w: string): string {
  return path(`M${cx - 11} ${cy - 8} h22 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-12 l-6 5 v-5 h-4 a3 3 0 0 1 -3 -3 v-9 a3 3 0 0 1 3 -3 z`, 'none', `stroke="${w}" stroke-width="2.6" stroke-linejoin="round"`);
}
/** Garis datar (tidak diminta / tidak perlu): arti tindakan, bukan tanda "salah". */
export function ikonStrip(cx: number, cy: number, w: string): string {
  return line(`M${cx - 8} ${cy} H${cx + 8}`, w, 3.4);
}
export function ikonCek(cx: number, cy: number, w: string): string {
  return line(`M${cx - 8} ${cy} l5 6 11 -12`, w, 3.4);
}
function ikonTelepon(cx: number, cy: number, w: string): string {
  return path(`M${cx - 8} ${cy - 9} C${cx - 11} ${cy - 3} ${cx - 4} ${cy + 9} ${cx + 7} ${cy + 9} L${cx + 9} ${cy + 4} L${cx + 4} ${cy + 1} L${cx + 1} ${cy + 4} C${cx - 2} ${cy + 2} ${cx - 4} ${cy} ${cx - 5} ${cy - 3} L${cx - 2} ${cy - 6} L${cx - 5} ${cy - 11} Z`, w);
}
function ikonBintang(cx: number, cy: number, r: number, w: string, extra = ''): string {
  let d = '';
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return path(`${d}Z`, w, extra);
}
function ikonKunci(cx: number, cy: number, w: string): string {
  // Kunci pas (bengkel).
  return line(`M${cx - 7} ${cy + 7} L${cx + 3} ${cy - 3}`, w, 4) + circle(cx + 6, cy - 6, 5.5, 'none', `stroke="${w}" stroke-width="3"`);
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

function lembarDasar(isi: string, warna: string = P.putih): string {
  return `
    ${shadow(52, 76, 44, 4)}
    ${rrect(12, 3, 80, 72, 5, warna, INK)}
    ${isi}`;
}

/** Formulir klaim: kop hijau + tiga baris isian dengan kotak centang. */
export function dokFormulir(): string {
  let baris = '';
  for (let i = 0; i < 3; i += 1) baris += rrect(20, 28 + i * 14, 9, 9, 2, P.putih, INK_TIPIS) + line(`M35 ${32.5 + i * 14} H${i === 2 ? 70 : 82}`, P.besiMuda, 3);
  return lembarDasar(`
    ${path('M17 3 H87 C89.8 3 92 5.2 92 8 V19 H12 V8 C12 5.2 14.2 3 17 3 Z', P.hijau)}
    ${text(52, 15, 'FORMULIR', 9, P.putih)}
    ${rrect(12, 3, 80, 72, 5, 'none', INK)}
    ${baris}
    ${line('M21.5 32 l2.5 3 4.5 -6', P.hijau, 2.2)}`);
}

/** STNK truk: kartu cokelat, gambar truk kecil. */
export function dokStnk(): string {
  return kartuDasar(`
    ${line('M16 40 H46 M16 50 H42 M16 60 H48', '#b08a64', 3)}
    ${rrect(58, 38, 24, 16, 2, '#7d9fbe', INK_TIPIS)}
    ${path('M82 54 V44 C82 42 83 41 85 41 L89 41 L93 47 V54 Z', '#e7d2b4', INK_TIPIS)}
    ${circle(64, 57, 3.6, '#2f3a34')}${circle(88, 57, 3.6, '#2f3a34')}`, '#f0dab9', '#9c6b3f', 'STNK', 11);
}

/** KTP: kartu biru, foto di kanan. */
export function dokKtp(): string {
  return kartuDasar(`
    ${line('M16 37 H54 M16 47 H50 M16 57 H56', '#8fb3d4', 3)}
    ${rrect(64, 32, 26, 32, 3, '#a9c9e8', INK_TIPIS)}
    ${circle(77, 43, 5.5, '#e2b48c')}
    ${path('M69 63 C69 54 85 54 85 63 Z', '#34506e')}`, '#d4e6f6', '#2f6fb0', 'KTP', 11);
}

/** SIM: kartu kuning pucat, foto di kiri. */
export function dokSim(): string {
  return kartuDasar(`
    ${rrect(14, 32, 26, 32, 3, '#f4d77b', INK_TIPIS)}
    ${circle(27, 43, 5.5, '#c98f62')}
    ${path('M19 63 C19 54 35 54 35 63 Z', '#5f88b6')}
    ${line('M48 37 H88 M48 47 H82 M48 57 H86', '#cfae55', 3)}`, '#fbeab0', '#c99a1c', 'SIM', 11);
}

/** Surat keterangan polisi: kop lencana + pita "DIPROSES" (masih diurus). */
export function dokSuratPolisi(): string {
  return lembarDasar(`
    ${circle(28, 17, 8, '#2b3f6b', INK_TIPIS)}
    ${ikonBintang(28, 17, 5.2, '#f6c445')}
    ${text(62, 21, 'POLISI', 10, '#2b3f6b')}
    ${line('M20 33 H84 M20 42 H80 M20 51 H66', P.besiMuda, 3)}
    <g transform="rotate(-6 70 64)">${rrect(42, 56, 54, 16, 4, P.oranye, INK_TIPIS)}${text(69, 68, 'DIPROSES', 8.5, P.putih)}</g>`);
}

/** Fotokopi Kartu Keluarga: kertas hijau kebiruan bertabel. */
export function dokKk(): string {
  return lembarDasar(`
    ${text(52, 17, 'KARTU KELUARGA', 7.5, '#2e7d7a')}
    ${rrect(19, 24, 66, 42, 2, '#f3faf9', 'stroke="#7fb5b0" stroke-width="2"')}
    ${line('M19 34.5 H85 M19 45 H85 M19 55.5 H85 M37 24 V66 M61 24 V66', '#9cc8c3', 1.6)}`, '#e1f0ee');
}

/** Slip gaji: struk bergerigi. */
export function dokSlip(): string {
  return `
    ${shadow(52, 77, 30, 4)}
    ${path('M28 4 H76 V70 L71 75 L66 70 L61 75 L56 70 L51 75 L46 70 L41 75 L36 70 L31 75 L28 72 Z', P.putih, INK)}
    ${text(52, 17, 'SLIP GAJI', 8.5, P.tinta)}
    ${line('M34 24 H70', P.besiMuda, 2)}
    ${text(35, 39, 'Rp', 9, P.cokelat, 800, 'start')}${line('M49 35.5 H70', P.besiMuda, 3)}
    ${text(35, 53, 'Rp', 9, P.cokelat, 800, 'start')}${line('M49 49.5 H66', P.besiMuda, 3)}
    ${line('M34 61 H70', P.tinta, 2)}`;
}

/** Rekening koran usaha: kop ungu + tabel angka. */
export function dokRekening(): string {
  let baris = '';
  for (let i = 0; i < 4; i += 1) baris += line(`M20 ${30 + i * 11} H54`, '#cfc4e2', 3) + line(`M62 ${30 + i * 11} H84`, i === 3 ? P.tintaLembut : '#b6a6d4', 3);
  return lembarDasar(`
    ${path('M17 3 H87 C89.8 3 92 5.2 92 8 V18 H12 V8 C12 5.2 14.2 3 17 3 Z', '#7a5aa6')}
    ${text(52, 14.5, 'REK. KORAN', 8.5, P.putih)}
    ${rrect(12, 3, 80, 72, 5, 'none', INK)}
    ${baris}`);
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

/** Isi kartu "pengemudi mobil kecil yang memotong": mobil kecil tampak samping + tanda tanya (tidak dikenali). */
export function isiMobilKecil(): string {
  return `
    ${path('M20 80 C20 74 24 71 30 70 L40 69 L50 58 C52 56 55 55 58 55 L70 55 C74 55 77 57 79 60 L84 69 C88 70 90 73 90 78 L90 82 L20 82 Z', '#c4452f', INK_TIPIS)}
    ${path('M52 60 L60 60 L60 68 L45 68 Z M64 60 L72 60 C74 60 75 61 76 63 L79 68 L64 68 Z', P.kaca)}
    ${circle(36, 83, 6.5, '#2f3a34', INK_TIPIS)}${circle(76, 83, 6.5, '#2f3a34', INK_TIPIS)}
    ${circle(50, 40, 12, P.kuning, INK_TIPIS)}
    ${text(50, 46, '?', 17, P.tinta, 900)}`;
}

// ------------------------------------------------------------------ truk trailer (dipakai peta & pool)

/** Truk trailer tampak samping menghadap kiri, 200 x 70, dasar roda y 64. `penyok` = sisi kepala rusak. Warna bawaan = truk
 * kasus di ilustrasi panggung (kepala biru, bak putih), supaya ikon arena dan adegan menunjukkan kendaraan yang sama. */
export function trukTrailer(opts: { kepala?: string; bak?: string; penyok?: boolean } = {}): string {
  const kepala = opts.kepala ?? '#2f6fb0';
  const bak = opts.bak ?? '#e9eef0';
  return `
    ${shadow(102, 64, 96, 5)}
    ${rrect(54, 6, 142, 46, 3, bak, INK_TIPIS)}
    ${line('M78 8 V50 M102 8 V50 M126 8 V50 M150 8 V50 M174 8 V50', P.besiMuda, 2)}
    ${rect(54, 52, 142, 5, P.besiTua)}
    ${path('M8 56 L8 30 C8 22 13 18 20 18 L38 18 L50 34 L50 56 Z', kepala, INK_TIPIS)}
    ${path('M15 24 L35 24 L44 35 L15 35 Z', P.kaca)}
    ${rrect(4, 46, 8, 7, 2, '#fff1b8', INK_TIPIS)}
    ${opts.penyok ? path('M8 38 L16 42 L12 48 L8 47 Z', P.besiMuda, INK_TIPIS) + line('M17 40 l5 -4 M18 46 l6 1', P.oranye, 2.4) : ''}
    ${wheel(26, 60, 8)}${wheel(118, 60, 8)}${wheel(138, 60, 8)}${wheel(176, 60, 8)}`;
}

// ------------------------------------------------------------------ peta (K04)

/** Tempat di peta 132 x 100: `gambar` digambar di kotak 0..132 x 8..100, pin sewarna kategori di pojok kanan atas. */
function tempat(a: Aksen, gambar: string): string {
  return `${ellipse(66, 94, 60, 6, P.tinta, 'opacity="0.13"')}${gambar}${pin(116, 36, a.tua)}`;
}

/** Kantor Raksa: gedung hijau berpapan kuning + lahan parkir. */
export function lokKantor(a: Aksen): string {
  return tempat(a, `
    ${rrect(14, 22, 78, 70, 5, '#2e8a5f', INK)}
    ${rrect(22, 10, 62, 18, 5, P.kuning, INK_TIPIS)}${text(53, 24, 'RAKSA', 12, P.hijau, 900)}
    ${rrect(24, 36, 14, 14, 2, P.kaca)}${rrect(46, 36, 14, 14, 2, P.kaca)}${rrect(68, 36, 14, 14, 2, P.kaca)}
    ${rrect(24, 58, 14, 14, 2, P.kaca)}${rrect(68, 58, 14, 14, 2, P.kaca)}
    ${rrect(45, 62, 16, 30, 2, '#1f5e41')}
    ${rrect(94, 66, 36, 26, 4, '#c9c3b2', INK_TIPIS)}${text(112, 85, 'P', 15, P.biru, 900)}`);
}

/** Meja Mas Rudi di kantor: laptop berisi foto truk + kamera (menilai dari foto saja). */
export function lokMejaFoto(a: Aksen): string {
  return tempat(a, `
    ${rrect(8, 60, 116, 12, 5, P.kayu, INK)}${rect(18, 72, 10, 22, P.kayuTua)}${rect(104, 72, 10, 22, P.kayuTua)}
    ${path('M30 60 L36 24 L92 24 L98 60 Z', P.besiTua, INK_TIPIS)}
    ${rrect(41, 29, 46, 26, 2, '#dfeef8')}
    ${rrect(44, 32, 19, 9, 1, '#9cc3e6')}${rrect(65, 32, 19, 9, 1, '#e8c79a')}${rrect(44, 43, 19, 9, 1, '#e8c79a')}${rrect(65, 43, 19, 9, 1, '#9cc3e6')}
    ${rrect(98, 46, 22, 14, 3, '#3f4d46', INK_TIPIS)}${circle(109, 53, 4.2, P.kaca, INK_TIPIS)}`);
}

/** Pool truk Pak Hendra: pagar + truk trailer rusak di halaman. */
export function lokPool(a: Aksen): string {
  let pagar = '';
  for (let x = 8; x <= 124; x += 12) pagar += line(`M${x} 52 V92`, '#a7b3ac', 3);
  return tempat(a, `
    ${rrect(4, 50, 124, 44, 6, '#d9d2bf')}
    ${pagar}${line('M6 60 H126 M6 82 H126', '#a7b3ac', 3)}
    <g transform="translate(14 32) scale(0.5)">${trukTrailer({ penyok: true })}</g>
    ${rrect(8, 14, 42, 18, 4, P.krem, INK_TIPIS)}${text(29, 27, 'POOL', 11, P.cokelat)}`);
}

/** Bengkel: gedung beratap seng, pintu besar, papan bertulisan `papan` + kunci pas. */
export function lokBengkel(a: Aksen, papan: string, dinding: string): string {
  return tempat(a, `
    ${path('M8 36 L64 14 L120 36 Z', '#8a9790', INK)}
    ${rrect(14, 34, 100, 58, 4, dinding, INK)}
    ${rrect(30, 50, 58, 42, 3, '#6f7c75', INK_TIPIS)}
    ${line('M30 58 H88 M30 66 H88 M30 74 H88 M30 82 H88', '#56625c', 2)}
    ${rrect(20, 22, 88, 18, 5, P.krem, INK_TIPIS)}${text(64, 35.5, papan, papan.length > 8 ? 10 : 11.5, P.cokelat)}
    ${circle(102, 60, 9, P.putih, INK_TIPIS)}${ikonKunci(102, 60, P.besiTua)}`);
}

// ------------------------------------------------------------------ bengkel mitra (K05)

/** Bundel foto kerusakan 110 x 84: tiga foto dijepit, foto teratas truk dengan sisi penyok. */
export function bundelFoto(): string {
  return `
    ${shadow(55, 80, 48, 4)}
    <g transform="rotate(-8 55 44)">${rrect(14, 12, 80, 62, 4, P.putih, INK_TIPIS)}${rrect(20, 18, 68, 44, 2, '#c9d6de')}</g>
    <g transform="rotate(5 55 44)">${rrect(16, 10, 80, 62, 4, P.putih, INK_TIPIS)}${rrect(22, 16, 68, 44, 2, '#d7cdb8')}</g>
    ${rrect(15, 12, 80, 62, 4, P.putih, INK)}
    ${rrect(21, 18, 68, 44, 2, '#cfe3f0')}
    <g transform="translate(23 32) scale(0.32)">${trukTrailer({ penyok: true })}</g>
    ${rrect(48, 4, 14, 18, 3, P.besi, INK_TIPIS)}`;
}

/** Meja estimator Bengkel Mitra 130 x 96: meja, plakat ESTIMASI, kalkulator, berkas. */
export function mejaEstimator(a: Aksen): string {
  return `
    ${shadow(65, 92, 58, 5)}
    ${rrect(6, 44, 118, 14, 6, P.kayu, INK)}${rect(14, 58, 102, 34, P.kayuTua)}
    ${rrect(14, 6, 70, 22, 6, P.hijau, INK_TIPIS)}${text(49, 21, 'ESTIMASI', 10, P.krem)}
    ${rrect(86, 18, 26, 26, 4, P.besiTua, INK_TIPIS)}${rrect(90, 22, 18, 7, 1, '#cfe3c6')}
    ${rrect(18, 30, 52, 14, 2, P.putih, INK_TIPIS)}
    ${pin(118, 40, a.tua)}`;
}

/** Ponsel berisi obrolan WhatsApp dengan Pak Hendra, 110 x 100. */
export function ponselChat(a: Aksen, inisial: string): string {
  return `
    ${shadow(55, 96, 34, 4)}
    ${rrect(30, 4, 50, 90, 9, P.tinta, INK)}
    ${rrect(35, 13, 40, 70, 3, '#ece5dd')}
    ${rect(35, 13, 40, 14, '#1f7a5c')}${circle(43, 20, 4.5, '#e8d3a8')}${text(43, 23, inisial, 6, P.cokelat, 900)}
    ${rrect(39, 32, 26, 10, 3, P.putih)}${rrect(46, 46, 26, 10, 3, '#d9f7c9')}${rrect(39, 60, 22, 10, 3, P.putih)}
    ${pin(96, 40, a.tua)}`;
}

/** Tiang petunjuk arah ke bengkel lain, 110 x 104. */
export function tiangPetunjuk(a: Aksen): string {
  return `
    ${shadow(52, 100, 34, 4)}
    ${rect(48, 18, 8, 82, P.besi)}
    ${path('M18 22 H80 L92 32 L80 42 H18 Z', '#e7d2b4', INK_TIPIS)}${text(52, 37, 'BENGKEL', 9.5, P.cokelat)}
    ${path('M88 50 H28 L16 60 L28 70 H88 Z', '#e7d2b4', INK_TIPIS)}${text(56, 65, 'LAIN', 10, P.cokelat)}
    ${pin(98, 44, a.tua)}`;
}

/** Laci arsip berjam (simpan dulu), 110 x 100. */
export function laciArsip(a: Aksen): string {
  return `
    ${shadow(55, 96, 44, 4)}
    ${rrect(16, 16, 78, 78, 5, '#9aa7a0', INK)}
    ${rrect(22, 22, 66, 32, 3, '#b8c3bd', INK_TIPIS)}${rrect(46, 34, 18, 6, 3, P.besiTua)}
    ${rrect(22, 58, 66, 32, 3, '#b8c3bd', INK_TIPIS)}${rrect(46, 70, 18, 6, 3, P.besiTua)}
    ${circle(86, 18, 13, P.putih, INK_TIPIS)}${ikonJam(86, 18, P.tinta)}
    ${pin(13, 44, a.tua)}`;
}

/** Tas petugas (bundel belum dikirim ke mana pun), 110 x 90. */
export function tasPetugas(a: Aksen): string {
  return `
    ${shadow(55, 86, 44, 4)}
    ${path('M38 30 C38 14 72 14 72 30', 'none', `stroke="${P.cokelat}" stroke-width="5" stroke-linecap="round"`)}
    ${rrect(14, 28, 82, 56, 10, '#8a6a4f', INK)}
    ${rrect(14, 28, 82, 20, 10, '#a07c5c', INK_TIPIS)}
    ${rrect(48, 42, 14, 12, 3, '#d8a41f', INK_TIPIS)}
    ${pin(96, 40, a.tua)}`;
}

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

/** Ponsel di meja (cukup telepon supir), 100 x 76. */
export function ponselMeja(a: Aksen): string {
  return `
    ${shadow(50, 72, 34, 4)}
    <g transform="rotate(-10 50 40)">${rrect(30, 6, 40, 64, 8, P.tinta, INK)}${rrect(34, 14, 32, 46, 3, '#dfeef8')}${circle(50, 37, 11, '#2e9a66')}${ikonTelepon(50, 37, P.putih)}</g>
    ${pin(88, 37, a.tua)}`;
}

/** Map "sudah jelas": map kuning bertempel cap SURAT POLISI ADA, 100 x 76. */
export function mapJelas(a: Aksen): string {
  return `
    ${shadow(50, 72, 42, 4)}
    ${path('M10 18 L10 12 C10 9 12 8 15 8 L36 8 L42 14 L88 14 C91 14 92 16 92 19 L92 68 L10 68 Z', P.kuningTua, INK)}
    ${path('M6 28 L90 28 L94 70 L10 70 Z', P.kuning, INK)}
    <g transform="rotate(-8 52 50)">${rrect(22, 40, 60, 20, 4, 'none', `stroke="${P.hijau}" stroke-width="2.5"`)}${text(52, 54.5, 'JELAS', 11, P.hijau)}</g>
    ${pin(88, 37, a.tua)}`;
}

/** Lencana "nasabah lama" (percaya saja), 100 x 76: pita jabat tangan. */
export function lencanaPercaya(a: Aksen): string {
  return `
    ${shadow(50, 72, 30, 4)}
    ${path('M36 50 L30 72 L42 66 L48 74 L52 52 Z M64 50 L70 72 L58 66 L52 74 L48 52 Z', '#c4452f', INK_TIPIS)}
    ${circle(50, 34, 24, P.kuning, INK)}
    ${circle(50, 34, 17, P.kuningPucat)}
    ${path('M36 36 L44 30 L52 34 L60 30 L66 36 L58 42 L50 40 L44 42 Z', '#d9a77e', INK_TIPIS)}
    ${pin(88, 37, a.tua)}`;
}

// ------------------------------------------------------------------ dua catatan (K10)

/** Stempel aksi 84 x 96: gagang, bantalan sewarna kategori, simbol di cap. */
export function stempelAksi(a: Aksen, simbol: (cx: number, cy: number, w: string) => string): string {
  return `
    ${shadow(42, 92, 34, 4)}
    ${rect(37, 16, 10, 18, P.kayuTua)}
    ${circle(42, 14, 11, P.kayu, INK_TIPIS)}${circle(38.5, 10.5, 3.2, P.putih, 'opacity="0.45"')}
    ${rrect(20, 32, 44, 12, 5, P.besiTua, INK_TIPIS)}
    ${rrect(8, 44, 68, 40, 9, a.tua, INK)}
    ${rrect(16, 52, 52, 24, 6, P.krem)}
    ${simbol(42, 64, a.tua)}`;
}

/** Simbol stempel tambahan: tanda sama dengan, panah putar, garis datar. */
export function simbolSama(cx: number, cy: number, w: string): string {
  return line(`M${cx - 9} ${cy - 4} H${cx + 9} M${cx - 9} ${cy + 4} H${cx + 9}`, w, 3.2);
}
export function simbolUlang(cx: number, cy: number, w: string): string {
  return path(`M${cx + 7} ${cy - 3} A8 8 0 1 0 ${cx + 6} ${cy + 5}`, 'none', `stroke="${w}" stroke-width="3" stroke-linecap="round"`)
    + path(`M${cx + 2} ${cy - 6} L${cx + 9} ${cy - 7} L${cx + 8} ${cy}`, 'none', `stroke="${w}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`);
}
export function simbolCatat(cx: number, cy: number, w: string): string {
  return line(`M${cx - 9} ${cy + 7} L${cx + 6} ${cy - 8}`, w, 4) + path(`M${cx - 11} ${cy + 10} L${cx - 9} ${cy + 4} L${cx - 6} ${cy + 7} Z`, w);
}
export function simbolAbaikan(cx: number, cy: number, w: string): string {
  return line(`M${cx - 10} ${cy} H${cx + 10}`, w, 3.4) + circle(cx, cy, 10, 'none', `stroke="${w}" stroke-width="2"`);
}

// ------------------------------------------------------------------ bundel pengajuan (K11)

/** Berkas bundel pengajuan (dokumen "Isi bundel"), 120 x 96: tumpukan map berpenjepit + label 6/7. */
export function bundelBerkas(): string {
  return `
    ${shadow(60, 92, 52, 5)}
    ${rrect(14, 30, 92, 58, 6, '#e7d2b4', INK_TIPIS)}
    ${rrect(10, 22, 92, 58, 6, '#f1e3c4', INK_TIPIS)}
    ${rrect(6, 14, 96, 66, 6, P.kuning, INK)}
    ${rrect(16, 26, 76, 40, 3, P.putih)}
    ${line('M24 38 H82 M24 48 H76 M24 58 H70', P.besiMuda, 3)}
    ${rrect(70, 4, 30, 18, 4, P.besi, INK_TIPIS)}
`;
}

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

/** Baki keluar "KOMITE" (ajukan sekarang), 120 x 90. */
export function bakiKomite(): string {
  return `
    ${shadow(60, 86, 52, 4)}
    ${path('M10 40 L110 40 L102 82 L18 82 Z', '#dce7f3', INK)}
    ${rrect(6, 32, 108, 12, 6, '#2f6fb0', INK)}
    ${rrect(26, 4, 68, 22, 6, '#2f6fb0', INK_TIPIS)}${text(60, 19.5, 'KOMITE', 11, P.putih)}
    ${line('M60 26 V32', '#2f6fb0', 3)}
    ${rrect(40, 52, 40, 20, 5, P.krem, INK_TIPIS)}${ikonKilat(60, 62, '#2f6fb0')}`;
}

/** Papan klip daftar periksa dengan satu butir kosong (lengkapi dulu), 120 x 90. */
export function papanLengkapi(): string {
  return `
    ${shadow(60, 86, 40, 4)}
    ${rrect(26, 8, 68, 78, 7, P.kayu, INK)}
    ${rrect(32, 18, 56, 62, 3, P.putih)}
    ${rrect(46, 2, 28, 13, 4, P.besi, INK_TIPIS)}
    ${rrect(36, 24, 12, 12, 2, P.besiMuda)}${line('M54 30 H82', P.besiMuda, 3)}
    ${rrect(36, 40, 12, 12, 2, P.besiMuda)}${line('M54 46 H80', P.besiMuda, 3)}
    ${rrect(36, 57, 12, 12, 2, P.putih, 'stroke="#6f7d73" stroke-width="2" stroke-dasharray="3 2"')}${line('M54 63 H78', P.besiMuda, 3)}`;
}

/** Amplop untuk Pak Hendra (minta ia menyetujui laporan dulu), 120 x 90. */
export function amplopHendra(): string {
  return `
    ${shadow(60, 84, 48, 4)}
    ${rrect(14, 20, 92, 60, 6, '#f6ead0', INK)}
    ${path('M14 26 L60 56 L106 26', 'none', `stroke="${P.tinta}" stroke-width="2.5" stroke-linejoin="round"`)}
    ${circle(86, 64, 11, '#e8d3a8', INK_TIPIS)}${text(86, 69, 'H', 12, P.cokelat, 900)}`;
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

/** Hitungan biaya bengkel: lembar dengan baris Rp dan garis jumlah. */
export function dokHitungan(): string {
  let baris = '';
  for (let i = 0; i < 3; i += 1) baris += text(22, 31 + i * 11, 'Rp', 7.5, P.cokelat, 800, 'start') + line(`M36 ${28 + i * 11} H${i === 1 ? 74 : 82}`, P.besiMuda, 2.6);
  return lembarDasar(`
    ${text(52, 17, 'BIAYA BENGKEL', 8, P.tinta)}
    ${baris}
    ${line('M22 64 H82', P.tinta, 2)}${line('M50 70 H82', P.cokelatMuda, 3)}`);
}

/** Hasil penawaran (tender): lembar dengan tiga baris penawaran berkotak (tanpa tanda pilihan). */
export function dokTender(): string {
  let baris = '';
  for (let i = 0; i < 3; i += 1) baris += rrect(20, 26 + i * 15, 14, 10, 2, '#e2edf8', INK_TIPIS) + line(`M40 ${31 + i * 15} H${78 - i * 6}`, P.besiMuda, 3);
  return lembarDasar(`${text(52, 17, 'TENDER', 9, '#2f6fb0')}${baris}`);
}

/** Laporan pemeriksaan: kop hijau tua, paragraf, sketsa lajur kecil. */
export function lembarLaporan(): string {
  return lembarDasar(`
    ${path('M17 3 H87 C89.8 3 92 5.2 92 8 V18 H12 V8 C12 5.2 14.2 3 17 3 Z', P.tintaLembut)}
    ${text(52, 14.5, 'LAPORAN', 8.5, P.putih)}
    ${rrect(12, 3, 80, 72, 5, 'none', INK)}
    ${line('M20 27 H84 M20 35 H78 M20 43 H82', P.besiMuda, 2.6)}
    ${rrect(20, 50, 64, 18, 2, '#eef2ef', INK_TIPIS)}
    ${line('M20 59 H84', '#f4f1e6', 1.6, 'stroke-dasharray="5 4"')}${rrect(54, 54, 14, 7, 1.5, P.oranye)}`);
}

/** Surat keterangan polisi yang sudah ada (tanpa pita "DIPROSES"): dipakai saat berkas dilengkapi. */
export function dokSuratPolisiAda(): string {
  return lembarDasar(`
    ${circle(28, 17, 8, '#2b3f6b', INK_TIPIS)}
    ${ikonBintang(28, 17, 5.2, '#f6c445')}
    ${text(62, 21, 'POLISI', 10, '#2b3f6b')}
    ${line('M20 33 H84 M20 42 H80 M20 51 H66 M20 60 H76', P.besiMuda, 3)}`);
}
