/**
 * Ronde Penentuan (telepon nasabah) - di dalam kantor Raksa.
 * Mekanik: PILIH SATU CATATAN, cepat. Telepon di meja berdering dan nasabah
 * bicara di gelembung; di papan gabus ada empat catatan tempel yang SAMA
 * bentuk, ukuran, warna kertas, dan kerumitannya. Ketuk satu catatan untuk
 * memilih; ketuk catatan lain untuk mengganti pilihan.
 *
 * Netral: urutan di papan diacak (tidak mengikuti urutan daftar), catatan yang
 * tepat tidak di pojok baca pertama dan tidak di sebelah telepon. Tiap catatan
 * = satu gambar utama + satu gambar kecil dengan satu warna aksen
 * (biru / ungu / oranye / campuran) supaya sama menariknya.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, circle, floorLines, line, path, rect, rrect, shadow, text } from '../art/kit';

/** Warna kertas catatan tempel (sama untuk keempat pilihan). */
const KERTAS = '#fff3c4';
const KERTAS_LIPAT = '#f0dc98';
const KULIT = '#e0ac7e';

// ------------------------------------------------------------------ latar

function latar(): string {
  // Bintik gabus (deterministik, tanpa acak).
  let bintik = '';
  for (let i = 0; i < 46; i += 1) {
    const x = 34 + ((i * 97) % 394);
    const y = 38 + ((i * 59) % 312);
    bintik += circle(x, y, 1.6 + (i % 3) * 0.7, '#c7a472', 'opacity="0.65"');
  }
  return `
    <!-- dinding kantor -->
    ${rect(0, 0, 640, 386, '#f2ebd9')}
    ${rect(0, 0, 640, 12, '#e4d8bb')}
    ${rect(0, 250, 640, 136, '#ece2cb')}
    ${line('M0 250 H640', '#e0d3b4', 4)}
    <!-- lantai -->
    ${rect(0, 384, 640, 96, '#e6dcc6')}
    ${rect(0, 378, 640, 9, '#d6c6a3')}
    ${floorLines(387, 480, 640, '#c7b894', 80)}
    <!-- papan gabus -->
    ${rrect(20, 25, 432, 350, 12, P.tinta, 'opacity="0.08"')}
    ${rrect(14, 18, 432, 350, 12, P.kayu)}
    ${rrect(24, 28, 412, 330, 7, '#dcc08f')}
    ${rect(24, 28, 412, 8, '#000', 'opacity="0.05"')}
    ${bintik}
    ${circle(24, 28, 3, P.kayuTua)}${circle(436, 28, 3, P.kayuTua)}${circle(24, 358, 3, P.kayuTua)}${circle(436, 358, 3, P.kayuTua)}
    <!-- meja depan (resepsionis) -->
    ${shadow(548, 434, 96, 7)}
    ${rrect(460, 340, 180, 94, 6, P.hijau)}
    ${rect(460, 352, 180, 6, '#000', 'opacity="0.12"')}
    ${rrect(478, 372, 84, 30, 8, P.krem, 'opacity="0.95"')}
    ${text(520, 393, 'RAKSA', 17, P.hijau, 900)}
    ${rrect(452, 326, 190, 18, 7, '#c99a64')}
    ${rect(452, 338, 190, 6, P.kayuTua, 'opacity="0.55"')}
    <!-- barang meja (bukan pilihan) -->
    ${rrect(588, 304, 22, 24, 4, P.biruMuda)}${line('M596 304 l-3 -12 M602 304 l4 -11', P.besiTua, 2.4)}
    ${rrect(614, 318, 22, 10, 2, P.putih)}${rrect(616, 312, 20, 7, 2, '#f3efe6')}
    <!-- tanaman pot di pojok kiri bawah -->
    ${shadow(40, 470, 26, 5)}
    ${path('M22 436 L58 436 L54 470 L26 470 Z', P.kayuTua)}
    ${rect(20, 432, 40, 8, P.cokelatMuda)}
    ${path('M40 432 C30 414 16 410 10 396 C24 398 34 410 40 426 Z', P.hijauMuda)}
    ${path('M40 432 C48 412 62 404 70 392 C66 410 54 422 42 430 Z', P.hijauDaun)}
    ${path('M40 432 C38 414 40 398 46 386 C50 402 46 418 42 430 Z', P.hijau)}`;
}

/** Telepon meja berdering, 96 x 64 (properti latar, tanpa garis tepi). */
function telepon(): string {
  return `
    ${shadow(48, 60, 36, 4)}
    ${path('M18 58 L26 30 L70 30 L78 58 Z', P.besiTua)}
    ${rrect(34, 36, 28, 16, 3, P.besiMuda)}
    ${[0, 1, 2].map((c) => circle(40 + c * 8, 41, 2, P.besiTua)).join('')}
    ${[0, 1, 2].map((c) => circle(40 + c * 8, 47, 2, P.besiTua)).join('')}
    ${path('M12 27 C8 16 14 8 24 9 L72 9 C82 8 88 16 84 27 L72 29 C70 23 66 20 60 20 L36 20 C30 20 26 23 24 29 Z', P.besi)}
    ${line('M26 13 H70', P.putih, 3, 'opacity="0.3"')}
    ${line('M8 20 C2 14 2 6 8 2 M88 20 C94 14 94 6 88 2', P.kuningTua, 3)}
    ${line('M14 24 C8 18 8 10 12 6 M82 24 C88 18 88 10 84 6', P.kuningTua, 3, 'opacity="0.6"')}`;
}

/** Gelembung suara nasabah di telepon, 172 x 126 (karakter bergaris tipis). */
function gelembung(): string {
  return `
    ${path('M24 6 L148 6 C160 6 168 14 168 26 L168 84 C168 96 160 104 148 104 L78 104 L50 124 L54 104 L24 104 C12 104 4 96 4 84 L4 26 C4 14 12 6 24 6 Z', P.putih, 'stroke="#d6c9ab" stroke-width="2"')}
    <!-- nasabah: kepala & bahu, ponsel di telinga, tersenyum -->
    ${path('M24 104 C24 82 36 74 54 74 C72 74 84 82 84 104 Z', P.teal, INK_TIPIS)}
    ${path('M46 75 L54 84 L62 75 Z', P.putih, INK_TIPIS)}
    ${rrect(49, 62, 10, 12, 4, KULIT)}
    ${circle(54, 48, 20, KULIT, INK_TIPIS)}
    ${path('M34 48 C34 32 42 26 54 26 C66 26 74 32 74 48 C70 40 62 37 54 37 C46 37 38 40 34 48 Z', '#3a2a1e', INK_TIPIS)}
    ${circle(47, 50, 2.4, P.tinta)}${circle(61, 50, 2.4, P.tinta)}
    ${line('M48 57 Q54 62 60 57', P.tinta, 2)}
    ${circle(42, 56, 3, P.merah, 'opacity="0.18"')}${circle(66, 56, 3, P.merah, 'opacity="0.18"')}
    ${rrect(70, 38, 10, 24, 4, P.tinta, INK_TIPIS)}
    ${circle(76, 64, 5, KULIT, INK_TIPIS)}
    <!-- sedang bicara -->
    ${line('M88 40 q6 8 0 16 M96 34 q10 14 0 28', P.besiMuda, 3)}
    ${circle(118, 55, 6, P.besiMuda)}${circle(136, 55, 6, P.besiMuda)}${circle(154, 55, 6, P.besiMuda)}`;
}

// ------------------------------------------------------------------ catatan tempel (pilihan)

/**
 * Kerangka catatan tempel 150 x 104 (di bagian atas gambar 150 x 138; sisa bawah
 * transparan untuk area sentuh label): bayangan, kertas, lipatan, selotip.
 */
function catatan(miring: number, isi: string): string {
  return `<g transform="rotate(${miring} 75 55)">
    ${rrect(16, 17, 126, 86, 6, P.tinta, 'opacity="0.15"')}
    ${path('M12 17 C12 14 14 12 17 12 L133 12 C136 12 138 14 138 17 L138 84 C134 92 128 96 120 98 L17 98 C14 98 12 96 12 93 Z', KERTAS, INK)}
    ${path('M120 98 C122 91 128 86 138 84 C132 90 128 94 120 98 Z', KERTAS_LIPAT, INK_TIPIS)}
    ${isi}
    ${rrect(57, 3, 36, 15, 2, P.putih, 'opacity="0.7" transform="rotate(-5 75 10)"')}
  </g>`;
}

/** Plat nomor + mobil kecil tersenggol (identitas kendaraan & kronologi). */
function isiPlat(): string {
  return `
    ${rrect(28, 22, 94, 32, 5, P.putih, INK_TIPIS)}
    ${rrect(32, 26, 86, 24, 3, 'none', `stroke="${P.tinta}" stroke-width="1.3"`)}
    ${text(75, 44, 'B 1234 RK', 16, P.tinta, 900)}
    ${path('M50 88 L50 80 C50 77 52 75 55 75 L62 74 L69 66 C70 65 72 64 74 64 L94 64 C96 64 98 65 99 67 L104 74 L108 75 C111 76 112 78 112 81 L112 88 Z', P.biru, INK_TIPIS)}
    ${path('M72 68 L82 68 L82 74 L66 74 Z', P.kaca)}${path('M86 68 L95 68 L100 74 L86 74 Z', P.kaca)}
    ${circle(62, 88, 6, '#2f3a34', INK_TIPIS)}${circle(100, 88, 6, '#2f3a34', INK_TIPIS)}
    ${line('M42 72 l-8 -5 M40 81 h-10 M45 64 l-4 -7', P.oranye, 3)}`;
}

/** Palet cat + kuas (warna favorit). */
function isiWarna(): string {
  return `
    ${path('M26 58 C24 38 42 24 68 24 C96 24 116 36 116 54 C116 66 106 70 96 68 C86 66 82 72 86 80 C90 90 76 94 62 92 C42 90 28 78 26 58 Z', '#e7c592', INK_TIPIS)}
    ${circle(46, 70, 6.5, KERTAS, INK_TIPIS)}
    ${circle(46, 46, 8, P.biru, INK_TIPIS)}
    ${circle(68, 37, 8, P.kuning, INK_TIPIS)}
    ${circle(92, 43, 8, P.ungu, INK_TIPIS)}
    ${circle(68, 60, 8, P.teal, INK_TIPIS)}
    ${line('M100 94 L122 62', P.tinta, 8)}${line('M100 94 L122 62', P.kayuTua, 4.5)}
    ${path('M119 60 L127 52 L131 56 L125 66 Z', P.besiMuda, INK_TIPIS)}
    ${path('M127 52 C128 44 134 40 138 38 C137 44 136 50 131 56 Z', P.oranye, INK_TIPIS)}`;
}

/** Label harga + kunci pas (daftar harga bengkel). */
function isiHarga(): string {
  return `
    <g transform="rotate(-8 70 48)">
      ${path('M44 26 L110 26 C113 26 115 28 115 31 L115 65 C115 68 113 70 110 70 L44 70 L26 48 Z', P.oranye, INK_TIPIS)}
      ${circle(40, 48, 4.5, KERTAS, INK_TIPIS)}
      ${text(80, 57, 'Rp', 26, P.putih, 900)}
    </g>
    <g transform="translate(86 82) rotate(-20)">
      ${rrect(-36, -5, 58, 10, 5, P.besiMuda, INK_TIPIS)}
      ${circle(26, 0, 11, P.besiMuda, INK_TIPIS)}
      ${rect(27, -4.5, 12, 9, KERTAS)}
      ${line('M27 -4.5 H33 M27 4.5 H33', P.tinta, 2)}
      ${circle(-30, 0, 2.6, P.besi)}
    </g>`;
}

/** Kalender + jam kecil (jadwal servis). */
function isiJadwal(): string {
  let kotak = '';
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 4; c += 1) kotak += rrect(36 + c * 16, 50 + r * 12, 11, 8, 2, P.besiMuda);
  }
  return `
    ${rrect(28, 26, 78, 66, 6, P.putih, INK_TIPIS)}
    ${path('M28 32 C28 28 31 26 34 26 L100 26 C103 26 106 28 106 32 L106 43 L28 43 Z', P.ungu)}
    ${rrect(28, 26, 78, 66, 6, 'none', INK_TIPIS)}
    ${rrect(42, 20, 6, 14, 3, P.besiTua)}${rrect(86, 20, 6, 14, 3, P.besiTua)}
    ${kotak}
    ${circle(73.5, 66, 8.5, 'none', `stroke="${P.ungu}" stroke-width="2.6"`)}
    ${rrect(111, 53, 10, 6, 2, P.besiTua)}
    ${circle(116, 76, 16, P.putih, INK_TIPIS)}
    ${circle(116, 76, 11.5, 'none', `stroke="${P.besiMuda}" stroke-width="1.5"`)}
    ${line('M116 76 V67 M116 76 L123 80', P.tinta, 2.6)}
    ${circle(116, 76, 2, P.tinta)}`;
}

// ------------------------------------------------------------------ adegan

export function scenePenentuan(): SceneSpec {
  const bg = art('m11-latar', 640, 480, latar());
  const W = 150;
  // Catatan terlihat 150 x 104; gambar diberi ruang transparan 34 di bawah supaya
  // pusat objek (= pusat area sentuh) turun ke tengah "catatan + label". Dengan begitu
  // mengetuk label pil juga memilih catatannya, tanpa area sentuh antar-baris bertumpuk.
  const H = 138;
  // Label tetap tepat di bawah kertas catatan (naik 34 = tinggi ruang transparan).
  const labelDy = -34;
  // Baris 1: y 55-207, baris 2: y 209-361 (label bawah y=354). Kolom: x 32-228 & 238-434.
  const hit = { w: 196, h: 152 };
  // Atas kertas baris 1 di y=62 supaya keterangan "Dipilih" di atasnya tidak terpotong tepi;
  // lencana baris 2 (atas y=201) tidak menutupi label baris 1 (bawah y=200).
  const Y1 = 131;
  const Y2 = 285;
  return {
    missionId: 'm11-penentuan',
    acakPosisi: ['penentuan'],
    background: bg,
    props: [
      { id: 'gelembung', x: 552, y: 186, art: art('m11-gelembung', 172, 126, gelembung()), motion: 'bob', depth: 6 },
      { id: 'telepon', x: 522, y: 300, art: art('m11-telepon', 96, 64, telepon()), motion: 'sway', depth: 7 },
    ],
    hero: { x: 592, y: 478 },
    walk: { minX: 90, maxX: 600, minY: 458, maxY: 478 },
    // Urutan = urutan baca (kiri-atas, kanan-atas, kiri-bawah, kanan-bawah) untuk animasi sapa.
    objects: [
      {
        id: 'warna', role: 'option', stepId: 'penentuan', refId: 'warna-favorit', fx: 'choose',
        x: 130, y: Y1, art: art('m11-warna', W, H, catatan(-2, isiWarna())), label: 'Warna favorit', depth: 20, hit, labelDy,
      },
      {
        id: 'harga', role: 'option', stepId: 'penentuan', refId: 'harga-bengkel', fx: 'choose',
        x: 336, y: Y1, art: art('m11-harga', W, H, catatan(1.5, isiHarga())), label: 'Harga bengkel', depth: 20, hit, labelDy,
      },
      {
        id: 'plat', role: 'option', stepId: 'penentuan', refId: 'identitas-kronologi', fx: 'choose',
        x: 130, y: Y2, art: art('m11-plat', W, H, catatan(1.5, isiPlat())), label: 'Plat & kronologi', depth: 21, hit, labelDy,
      },
      {
        id: 'jadwal', role: 'option', stepId: 'penentuan', refId: 'jadwal-servis', fx: 'choose',
        x: 336, y: Y2, art: art('m11-jadwal', W, H, catatan(-1.5, isiJadwal())), label: 'Jadwal servis', depth: 21, hit, labelDy,
      },
    ],
  };
}
