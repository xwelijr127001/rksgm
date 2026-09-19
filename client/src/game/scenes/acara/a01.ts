/**
 * Misi acara 01 - Setelah Api Padam (toko kain pasca kebakaran yang SUDAH aman).
 * Mekanik: KETUK DUA TINDAKAN. Lima benda-tindakan berukuran sama di meja panjang;
 * ketuk untuk memilih (maks 2), ketuk lagi untuk membatalkan. Tanpa dokumen, tanpa folder.
 *
 * Latar `m03-latar` dipakai utuh (pembuat `latar()` & `lampu()` diimpor dari ../m03-ruko;
 * kunci tekstur sama karena SVG-nya identik).
 *
 * Tata letak (dunia 640 x 480), slot meja m03 yang sudah teruji:
 * - Kolom x 186 / 364 / 542, baris y 136 / 276. Lima pilihan menempati tiga slot belakang
 *   dan slot depan kiri + kanan; posisinya diacak antar slot (`acakPosisi`).
 * - Slot depan-tengah tanpa pilihan: di situ tumpukan gulungan kain (prop pucat tanpa garis
 *   tepi, penanda "toko kain"). Akibatnya dua label baris depan tidak pernah bertetangga.
 * - Pemilik toko (prop, setengah badan) berdiri di balik meja, di depan pintu rolling,
 *   di sela kolom tengah & kanan.
 *
 * Lebar label (teks tebal 20 px + bantalan 44): jarak kolom 178 berarti jumlah lebar dua label
 * bertetangga di baris belakang <= 356, dan label kolom kanan <= 184 supaya tidak dijepit tepi.
 * "Foto kerusakan" ~188, "Buka toko saja" ~181, "Buang barang" ~176, "Perbaiki dulu" ~169,
 * "Lapor klaim" ~155. Label silabus "Buang yang hangus" (~229) terlalu lebar untuk slot ini.
 *
 * Susunan SETELAH acak slot (deterministik, benih = id misi + id langkah): belakang = Perbaiki dulu,
 * Lapor klaim, Buka toko saja (celah ~16 & ~10 px; adegan m03 yang teruji hanya ~2 px); depan =
 * Foto kerusakan, (kain), Buang barang. AWAS: "Foto kerusakan" + "Buka toko saja" (~369) TIDAK muat
 * bersebelahan di baris belakang. Bila id misi/langkah, jumlah opsi, atau label berubah, susunan
 * ikut berubah: ukur ulang (juga label en/zh di ./a01.label.ts).
 */

import type { ArtRef, SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rect, rrect, shadow, text } from '../../art/kit';
import { docSheet, phone } from '../../art/props';
import { personArt } from '../../art/characters';
import { lampu, latar } from '../m03-ruko';

/** Ukuran seragam semua benda-tindakan (sama menonjol; syarat `acakPosisi`). */
const OW = 96;
const OH = 88;
/** Warna bekas terbakar, sama dengan rak hangus di latar m03. */
const HANGUS = '#4a3b30';

// ------------------------------------------------------------------ benda-tindakan (96 x 88, setara)

/** Foto kerusakan: ponsel membidik barang hangus + selembar hasil foto. */
function fotoKerusakan(): string {
  return `${shadow(48, 83, 38, 5)}
    <g transform="rotate(8 66 42)">
      ${rrect(42, 10, 46, 58, 5, P.putih, INK)}
      ${rect(48, 16, 34, 34, '#efe0c4')}
      ${path('M48 50 L48 34 C52 28 57 31 60 24 C63 31 69 26 72 32 C75 28 80 30 82 34 L82 50 Z', '#5f5a55', 'opacity="0.5"')}
      ${rect(51, 40, 28, 4, '#5f4c3e')}
      ${rrect(54, 31, 10, 9, 1.5, '#8d7663')}${rrect(67, 29, 9, 11, 1.5, '#7e6c5d')}
      ${rrect(55, 57, 20, 4, 2, P.besiMuda)}
    </g>
    <g transform="translate(8 9) rotate(-7 20 35)">
      ${phone(P.biruPucat)}
      ${rrect(13, 30, 14, 14, 2, '#8d7663')}
      ${path('M13 36 L17 39 L20 34 L24 39 L27 35 L27 32 C27 31 26 30 25 30 L15 30 C14 30 13 31 13 32 Z', HANGUS)}
      ${line('M10 19 v-5 h5 M25 14 h5 v5 M10 47 v5 h5 M30 47 v5 h-5', P.tinta, 1.8)}
    </g>`;
}

/** Lapor klaim: lembar laporan + balon percakapan (kanal klaim). Bayangan dari docSheet(). */
function laporKlaim(): string {
  return `
    <g transform="translate(5 7) scale(0.84)">${docSheet(P.biru, { baris: 4, miring: -5 })}</g>
    ${path('M50 28 C50 22 54 18 60 18 L80 18 C86 18 90 22 90 28 L90 44 C90 50 86 54 80 54 L71 54 L60 65 L62 54 L60 54 C54 54 50 50 50 44 Z', P.kuning, INK)}
    ${circle(60, 36, 3.2, P.tinta)}${circle(70, 36, 3.2, P.tinta)}${circle(80, 36, 3.2, P.tinta)}`;
}

/** Buang barang: tong terbuka berisi gulungan kain & kotak yang hangus. */
function buangBarang(): string {
  return `${shadow(48, 83, 36, 5)}
    <g transform="rotate(-16 38 30)">
      ${rrect(29, 6, 18, 42, 8, '#8d7663', INK)}
      ${path('M29 20 L34 25 L38 17 L43 24 L47 19 L47 14 C47 9 43 6 38 6 C33 6 29 9 29 14 Z', HANGUS)}
    </g>
    <g transform="rotate(13 62 30)">
      ${rrect(52, 12, 22, 34, 3, '#7e6c5d', INK)}
      ${path('M52 23 L58 28 L63 20 L69 27 L74 22 L74 15 C74 13 73 12 71 12 L55 12 C53 12 52 13 52 15 Z', HANGUS)}
    </g>
    ${path('M22 42 L74 42 L69 82 L27 82 Z', P.besiMuda, INK)}
    ${rrect(17, 35, 62, 11, 5, P.besi, INK)}
    ${line('M38 54 L39 74 M48 54 V74 M58 54 L57 74', P.besi, 3)}
    ${path('M80 83 l4 -7 7 2 -1 5 Z', '#7e6c5d', INK_TIPIS)}`;
}

/**
 * Perbaiki dulu: kotak perkakas + kunci pas & obeng. Warna biru seperti perkakas misi 1
 * (bukan merah toolbox() bersama) supaya bobot warna kelima benda tetap netral.
 */
function perkakas(): string {
  return `${shadow(48, 83, 40, 5)}
    <g transform="rotate(-16 22 30)">
      ${rrect(17, 16, 9, 32, 4, P.besiMuda, INK_TIPIS)}
      ${path('M12 18 C10 7 18 2 21.5 2 C25 2 33 7 31 18 L26.5 16 L25 9 L18 9 L16.5 16 Z', P.besiMuda, INK_TIPIS)}
    </g>
    <g transform="rotate(8 66 34)">
      ${rrect(63, 24, 6, 22, 2, P.besiMuda, INK_TIPIS)}
      ${rrect(58, 5, 16, 22, 6, P.kuning, INK)}
    </g>
    ${line('M30 42 C30 18 56 18 56 42', P.tinta, 9)}
    ${line('M30 42 C30 18 56 18 56 42', P.besiTua, 4)}
    ${path('M9 46 L87 46 L82 82 L14 82 Z', P.biru, INK)}
    ${rrect(5, 38, 86, 12, 5, P.biru, INK)}
    ${rect(13, 59, 70, 5, '#000', 'opacity="0.16"')}
    ${rrect(40, 55, 16, 12, 3, P.besiMuda, INK_TIPIS)}`;
}

/**
 * Buka toko saja: papan gantung "BUKA" seperti di pintu toko.
 * Huruf 20 px: pada 23 px tulisan selebar ~66 px (Segoe UI Black / Arial tebal) dan nyaris
 * menyentuh tepi pelat krem (68 px); pada 20 px ~58 px, sisa ~5 px di tiap sisi.
 */
function papanBuka(): string {
  return `${shadow(48, 83, 34, 5)}
    ${line('M26 35 L48 10 L70 35', P.besiTua, 3)}
    ${circle(48, 10, 4.5, P.besiMuda, INK_TIPIS)}
    <g transform="rotate(-4 48 54)">
      ${rrect(8, 32, 80, 44, 9, P.ungu, INK)}
      ${rrect(14, 38, 68, 32, 5, P.krem, INK_TIPIS)}
      ${text(48, 61, 'BUKA', 20, P.ungu, 900)}
    </g>`;
}

// ------------------------------------------------------------------ prop (bukan pilihan)

/** Satu gulungan kain tampak samping (tanpa garis tepi: bagian suasana, bukan pilihan). */
function gulungan(x: number, y: number, panjang: number, warna: string, tua: string, gosong = false): string {
  const ujung = x + panjang - 10;
  const bekas = gosong
    ? path(`M${x + 9} ${y + 3} L${x + 28} ${y + 3} L${x + 21} ${y + 9} L${x + 31} ${y + 13} L${x + 22} ${y + 18} L${x + 28} ${y + 23} L${x + 9} ${y + 23} C${x + 3} ${y + 20} ${x + 3} ${y + 6} ${x + 9} ${y + 3} Z`, HANGUS, 'opacity="0.7"')
    : '';
  return `
    ${rrect(x, y, panjang, 26, 13, warna)}
    ${line(`M${x + 16} ${y + 8} H${ujung - 14}`, P.putih, 3, 'opacity="0.4"')}
    ${bekas}
    <ellipse cx="${ujung}" cy="${y + 13}" rx="10" ry="13" fill="${tua}"/>
    <ellipse cx="${ujung}" cy="${y + 13}" rx="4" ry="5.5" fill="${P.kremTua}"/>`;
}

/** Tumpukan tiga gulungan kain di meja, 132 x 84; yang paling atas gosong di ujungnya. */
function tumpukanKain(): string {
  return `${shadow(66, 79, 58, 5, 0.12)}
    ${gulungan(6, 52, 120, '#dcb0a6', '#c29188')}
    ${gulungan(12, 28, 108, '#aec8da', '#8fb0c6')}
    ${gulungan(20, 4, 94, '#e7d59a', '#cfba78', true)}`;
}

/**
 * Pemilik toko, setengah badan: gambar personArt diperkecil lalu dipotong di pinggang lewat
 * tinggi viewBox, sehingga tampak berdiri di BALIK meja (tepi belakang meja y 96).
 */
function pemilikToko(): ArtRef {
  const s = 0.7;
  // Pose 'bicara' (sedang bertanya). Alis 'cemas' terbaca marah pada ukuran sekecil ini, jadi tidak dipakai.
  const penuh = personArt({ key: 'a01-pemilik-penuh', shirt: P.teal, apron: P.kuningPucat, pose: 'bicara', mood: 'netral' });
  const isi = penuh.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return art('a01-pemilik', Math.round(penuh.w * s), 70, `<g transform="scale(${s})">${isi}</g>`);
}

// ------------------------------------------------------------------ adegan

function sceneApiPadam(): SceneSpec {
  // Slot meja m03: jarak kolom 178, jarak baris 140 (label baris belakang tidak menyentuh baris depan).
  const kol = [186, 364, 542];
  const baris = [136, 276];
  const benda = (key: string, body: string) => art(`a01-${key}`, OW, OH, body);
  const pemilik = pemilikToko();
  return {
    missionId: 'a01-api-padam',
    acakPosisi: ['tindakan'],
    background: art('m03-latar', 640, 480, latar()),
    props: [
      { id: 'lampu', x: 334, y: 34, art: art('m03-lampu', 40, 70, lampu()), motion: 'sway', depth: 5 },
      // Kaki gambar tepat di tepi belakang meja (y 96).
      { id: 'pemilik', x: 453, y: 96 - pemilik.h / 2, art: pemilik, depth: 6 },
      { id: 'kain', x: kol[1]!, y: 282, art: art('a01-kain', 132, 84, tumpukanKain()), depth: 6 },
    ],
    hero: { x: 60, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 458, maxY: 478 },
    objects: [
      // Baris belakang
      {
        id: 'perbaiki', role: 'option', stepId: 'tindakan', refId: 'perbaiki', fx: 'choose',
        x: kol[0]!, y: baris[0]!, art: benda('perkakas', perkakas()), label: 'Perbaiki dulu',
      },
      {
        id: 'buang', role: 'option', stepId: 'tindakan', refId: 'buang', fx: 'choose',
        x: kol[1]!, y: baris[0]!, art: benda('buang', buangBarang()), label: 'Buang barang',
      },
      {
        id: 'lapor', role: 'option', stepId: 'tindakan', refId: 'lapor', fx: 'choose',
        x: kol[2]!, y: baris[0]!, art: benda('lapor', laporKlaim()), label: 'Lapor klaim',
      },
      // Baris depan (slot tengah ditempati tumpukan kain)
      {
        id: 'foto', role: 'option', stepId: 'tindakan', refId: 'foto', fx: 'choose',
        x: kol[0]!, y: baris[1]!, art: benda('foto', fotoKerusakan()), label: 'Foto kerusakan',
      },
      {
        id: 'abaikan', role: 'option', stepId: 'tindakan', refId: 'abaikan', fx: 'choose',
        x: kol[2]!, y: baris[1]!, art: benda('buka', papanBuka()), label: 'Buka toko saja',
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a01-api-padam',
  buat: sceneApiPadam,
};
