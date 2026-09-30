/**
 * Mobil Bu Rina (episode AUTO-1): MPV keluarga hijau-toska, tampak 3/4 BELAKANG (sisi kiri
 * menjauh ke kiri atas, muka belakang menghadap pemain) supaya bemper, lampu belakang, dan
 * plat nomor terlihat sekaligus.
 *
 * Mobil dasar TIDAK memuat kerusakan, plat, dan brosur: ketiganya digambar sebagai sisipan
 * terpisah (objek bersarang di adegan, pola mobil/penyok misi 2) dengan titik tengah lokal
 * `SISIPAN`. Dua sisipan lain menimpa bagian mobil yang TIDAK rusak (pengecoh aktivitas bukti):
 * ban depan (roda yang sama letaknya, lebih rinci) dan dasbor yang terlihat dari jendela depan.
 * Roda depan & kaca tetap ada di mobil dasar (dipakai juga gambar kecil kartu polis), jadi
 * sisipan itu hanya menambah rincian. `mobilRinaUtuh()` menyusun semuanya untuk latar panggung.
 *
 * Koordinat lokal 0..MOBIL_W x 0..MOBIL_H. Semua fungsi mengembalikan STRING SVG.
 */

import { INK, INK_TIPIS, P, circle, line, path, rect, rrect, shadow, text } from '../../game/art/kit';

export const MOBIL_W = 460;
export const MOBIL_H = 230;

const BADAN = '#2e8a86';
const BADAN_SISI = '#277a76';
const BADAN_GELAP = '#1f625f';
const BAN = '#2f3a34';
const LAMPU = '#d9553d';
const LAMPU_TUA = '#a93a27';

/**
 * Posisi & ukuran sisipan (titik tengah lokal, ukuran gambar). Adegan memakai angka ini
 * supaya objek bersarang tepat menempel di mobil.
 */
export const SISIPAN = {
  penyok: { x: 439, y: 141, w: 72, h: 96 },
  plat: { x: 351, y: 134, w: 100, h: 36 },
  brosur: { x: 226, y: 62, w: 46, h: 54 },
  /** Roda depan (dasar: roda(70, 154, 18, 22)). Tinggi 46: tepi bawah tepat di atas pita jalan petugas. */
  ban: { x: 70, y: 154, w: 44, h: 46 },
  /** Kaca pintu depan (dari tepi kaca sampai pilar B, lokal x 168): lokal x 96..168, y 26..82. */
  dasbor: { x: 132, y: 54, w: 72, h: 56 },
} as const;

/** Roda tampak miring (elips). */
function roda(cx: number, cy: number, rx: number, ry: number): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${BAN}" ${INK}/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.46}" ry="${ry * 0.46}" fill="${P.besiMuda}" ${INK_TIPIS}/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.16}" ry="${ry * 0.16}" fill="${P.besiTua}"/>`;
}

/** Lampu belakang utuh (dipakai sisi kiri; sisi kanan tertutup sisipan penyok). */
function lampuBelakang(x: number): string {
  return rrect(x, 100, 22, 34, 6, LAMPU, INK_TIPIS) + rrect(x + 4, 104, 6, 12, 3, P.putih, 'opacity="0.35"') +
    line(`M${x + 2} 122 H${x + 20}`, LAMPU_TUA, 2);
}

/** MPV dasar (tanpa kerusakan, plat, dan brosur), MOBIL_W x MOBIL_H. */
export function mobilRinaDasar(): string {
  return `
    ${shadow(234, 196, 222, 18, 0.16)}
    <!-- roda kanan belakang (mengintip di bawah bemper) -->
    ${rrect(418, 170, 32, 30, 8, BAN, INK)}
    <!-- sisi kiri (menjauh ke kiri atas) -->
    ${path('M262 28 L128 19 C118 18 112 21 107 27 L72 72 L34 82 C23 85 18 92 18 103 L18 140 C18 150 24 155 34 156 L252 184 L252 34 Z', BADAN_SISI, INK)}
    <!-- kaca samping & depan -->
    ${path('M127 27 L248 34 L250 90 L96 76 Z', P.kaca, INK_TIPIS)}
    ${path('M111 30 L120 28 L91 74 L80 73 Z', P.kaca, INK_TIPIS)}
    ${path('M132 30 L150 31 L118 72 L104 71 Z', P.putih, 'opacity="0.45"')}
    <!-- pilar B & C -->
    ${path('M168 29 L178 30 L180 83 L168 82 Z', BADAN_SISI, INK_TIPIS)}
    ${path('M204 31 L214 32 L214 87 L203 86 Z', BADAN_SISI, INK_TIPIS)}
    <!-- garis pintu, pegangan, spion -->
    ${line('M166 86 L164 164 M206 90 L205 168', BADAN_GELAP, 2.4)}
    ${rrect(144, 104, 16, 5, 2.5, BADAN_GELAP)}${rrect(184, 108, 16, 5, 2.5, BADAN_GELAP)}
    ${line('M24 118 L250 146', '#000', 3, 'opacity="0.12"')}
    ${path('M86 70 C80 62 70 62 68 70 C67 76 74 80 84 78 Z', BADAN_SISI, INK_TIPIS)}
    <!-- lampu depan (jauh) -->
    ${rrect(20, 94, 12, 12, 4, '#fff1b8', INK_TIPIS)}
    <!-- lengkung & roda sisi -->
    ${path('M44 150 C44 124 96 124 96 156 Z', BADAN_GELAP)}
    ${path('M186 172 C186 142 244 142 244 178 Z', BADAN_GELAP)}
    ${roda(70, 154, 18, 22)}
    ${roda(215, 176, 21, 25)}
    <!-- muka belakang (menghadap pemain) -->
    ${path('M258 34 Q260 26 270 26 L432 26 Q442 26 444 34 L452 152 Q452 162 442 162 L260 162 Q250 162 250 152 Z', BADAN, INK)}
    ${path('M268 36 L434 36 L440 94 L262 94 Z', P.kaca, INK_TIPIS)}
    ${path('M276 40 L300 40 L284 90 L268 90 Z', P.putih, 'opacity="0.45"')}
    ${rrect(338, 30, 26, 5, 2.5, LAMPU)}
    ${line('M262 104 H440', BADAN_GELAP, 3)}
    ${lampuBelakang(254)}
    ${rrect(426, 100, 22, 34, 6, LAMPU, INK_TIPIS)}
    ${rrect(306, 114, 90, 40, 6, BADAN_GELAP, 'opacity="0.55"')}
    ${circle(351, 108, 4, P.besiMuda, INK_TIPIS)}
    <!-- bemper -->
    ${rrect(244, 156, 214, 28, 11, BADAN_GELAP, INK)}
    ${rrect(252, 176, 198, 6, 3, '#000', 'opacity="0.2"')}
    ${rrect(266, 162, 22, 6, 3, LAMPU_TUA, 'opacity="0.8"')}
    ${rrect(414, 162, 22, 6, 3, LAMPU_TUA, 'opacity="0.8"')}
    <!-- roda kiri belakang (di bawah pojok kiri muka belakang) -->
    ${rrect(252, 180, 30, 18, 7, BAN, INK)}`;
}

/**
 * Sisipan KERUSAKAN (72 x 96): lampu belakang kanan retak (serpihan hilang, garis retak) dan pojok
 * bemper penyok (cekungan gelap, sorot di tepi bawah, goresan), garis benturan jingga. Sisi kanan
 * 8 satuan sengaja kosong supaya titik tengah (= pusat area ketuk) bergeser menjauhi plat.
 * Warna jingga = warna benturan kit, bukan warna penilaian.
 */
export function penyokBelakang(): string {
  return `
    <!-- lampu kanan retak: letak sama dengan lampu dasar (lokal mobil 426..448 x 100..134) -->
    ${rrect(23, 7, 22, 34, 6, LAMPU, INK_TIPIS)}
    ${path('M33 25 L45 22 L45 37 C45 39 44 41 41 41 L35 41 Z', '#f3b3a5', INK_TIPIS)}
    ${line('M36 30 L27 13 M36 30 L25 27 M36 30 L29 39 M36 30 L42 16', P.tinta, 1.8)}
    <!-- pojok bemper penyok (lokal mobil 411..458 x 156..184): tepi atas melesak, lipatan, goresan -->
    ${path('M8 63 H26 L34 70 L42 65 Q55 63 55 74 V80 Q55 91 44 91 H8 Z', BADAN_GELAP)}
    ${line('M8 63 H26 L34 70 L42 65 Q55 63 55 74 V80 Q55 91 44 91 H8', P.tinta, 3)}
    ${path('M10 66 L25 66 L31 72 L24 80 L12 83 Z', '#a9d6cf')}
    ${line('M12 70 L24 68 M12 76 L22 74 M14 81 L21 79', P.putih, 1.8, 'opacity="0.9"')}
    ${path('M24 66 L34 72 L44 68 C51 72 51 83 44 87 C36 91 25 87 22 78 Z', '#000', 'opacity="0.36"')}
    ${line('M28 69 L32 77 L28 84 M40 70 L43 78', P.tinta, 2.2)}
    ${line('M25 88 C33 91 43 90 49 85', P.putih, 2.4, 'opacity="0.8"')}
    <!-- garis benturan (jingga kit, bukan warna penilaian) -->
    ${line('M55 52 l7 -6 M57 61 l7 0 M51 43 l3 -7', P.oranye, 3.6)}`;
}

/** Sisipan PLAT NOMOR (100 x 36): pelat terang bertepi gelap, nomor tebal; tanpa teks bila `teks` false. */
export function platRina(teks = true): string {
  return `
    ${rrect(2, 2, 96, 32, 6, P.tinta, INK)}
    ${rrect(6, 6, 88, 24, 4, '#f5f5f0')}
    ${teks ? text(50, 24.5, 'B 1726 RN', 15, P.tinta, 900) : line('M18 18 H82', P.tinta, 5, 'opacity="0.8"')}`;
}

/** Sisipan BROSUR MENU KATERING (46 x 54) ditempel di kaca samping: kotak nasi, sendok-garpu, baris menu. */
export function brosurMenu(): string {
  return `
    <g transform="rotate(-4 23 27)">
      ${rrect(4, 3, 38, 48, 4, P.kuningPucat, INK_TIPIS)}
      ${rect(17, 0, 12, 7, P.putih, 'opacity="0.85"')}
      ${path('M11 21 L35 21 L32 31 L14 31 Z', P.putih, INK_TIPIS)}
      ${path('M13 21 C14 15 32 15 33 21 Z', P.oranye, INK_TIPIS)}
      ${circle(20, 18, 2, P.hijauDaun)}${circle(27, 17.5, 2, P.merah)}
      ${line('M10 37 H36 M10 43 H30', P.cokelatMuda, 2.4)}
      ${line('M38 9 V17 M36 9 V13 M40 9 V13', P.besiTua, 1.4)}
    </g>`;
}

type Kotak = { x: number; y: number; w: number; h: number };

/** Geser gambar yang ditulis dalam koordinat lokal MOBIL ke koordinat lokal sisipan `s` (pojok kiri atas = 0,0). */
function keSisipan(s: Kotak, isi: string): string {
  return `<g transform="translate(${-(s.x - s.w / 2)} ${-(s.y - s.h / 2)})">${isi}</g>`;
}

/**
 * Sisipan BAN DEPAN (44 x 46): roda depan yang sama letak & ukurannya dengan roda dasar, dengan kembang
 * ban, dinding ban, dan velg berjari lima. Utuh, tanpa goresan: bagian yang TIDAK rusak (pengecoh).
 */
export function banDepan(): string {
  const { x: cx, y: cy } = SISIPAN.ban;
  const rx = 18;
  const ry = 22;
  const titik = (a: number, f: number): string => `${(cx + Math.cos(a) * rx * f).toFixed(1)} ${(cy + Math.sin(a) * ry * f).toFixed(1)}`;
  let kembang = '';
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    kembang += `M${titik(a, 0.78)} L${titik(a, 0.95)} `;
  }
  let jari = '';
  for (let i = 0; i < 5; i += 1) jari += `M${cx} ${cy} L${titik((i / 5) * Math.PI * 2 - Math.PI / 2, 0.4)} `;
  return keSisipan(SISIPAN.ban, `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${BAN}" ${INK}/>
    ${line(kembang.trim(), '#5a685f', 2.2)}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.66}" ry="${ry * 0.66}" fill="none" stroke="#48554d" stroke-width="1.6"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.46}" ry="${ry * 0.46}" fill="${P.besiMuda}" ${INK_TIPIS}/>
    ${line(jari.trim(), P.besiTua, 1.8)}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.16}" ry="${ry * 0.16}" fill="${P.besiTua}"/>
    ${line(`M${cx - 12} ${cy - 11} Q${cx - 8} ${cy - 18} ${cx - 1} ${cy - 19}`, P.putih, 2, 'opacity="0.3"')}`);
}

/**
 * Sisipan DASBOR DARI JENDELA (72 x 56): isi kabin di balik kaca pintu depan (lokal mobil x 96..168):
 * kaca sedikit gelap, papan dasbor, kisi AC, dan setir. Semua bentuk di dalam bingkai kaca (tanpa clipPath:
 * gambar ini ikut latar panggung yang tidak boleh memuat id). Utuh: bagian yang TIDAK rusak (pengecoh).
 */
export function dasborJendela(): string {
  const GELAP = '#34403f';
  const SETIR = '#222b2b';
  return keSisipan(SISIPAN.dasbor, `
    ${path('M126 30 L168 32.2 L168 82 L98 75.5 Z', '#2f4a52', 'opacity="0.18"')}
    ${path('M107.5 59 Q137 52 168 54 L168 82.5 L97 76 Z', GELAP)}
    ${line('M108.5 59.5 Q137 52.5 167.5 54.6', '#6b7c7e', 2)}
    ${rrect(144, 62, 16, 5, 2.5, SETIR)}
    ${line('M120 70 H138', '#4d5b5b', 1.6)}
    <ellipse cx="128" cy="50" rx="10" ry="12" fill="none" stroke="${SETIR}" stroke-width="3.6"/>
    ${line('M128 50 L128 62 M119 52 L137 52', SETIR, 2.4)}
    ${circle(128, 51, 3, SETIR)}
    ${path('M150 31 L158 31.5 L146 48 L139 47.5 Z', P.putih, 'opacity="0.4"')}`);
}

/** Mobil utuh (dasar + ban depan + dasbor + kerusakan + plat + brosur) untuk latar panggung. */
export function mobilRinaUtuh(opts: { teksPlat?: boolean } = {}): string {
  const taruh = (s: Kotak, isi: string): string =>
    `<g transform="translate(${s.x - s.w / 2} ${s.y - s.h / 2})">${isi}</g>`;
  return mobilRinaDasar() +
    taruh(SISIPAN.ban, banDepan()) +
    taruh(SISIPAN.dasbor, dasborJendela()) +
    taruh(SISIPAN.brosur, brosurMenu()) +
    taruh(SISIPAN.plat, platRina(opts.teksPlat ?? true)) +
    taruh(SISIPAN.penyok, penyokBelakang());
}
