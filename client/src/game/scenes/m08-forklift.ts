/**
 * Misi 8 - Benturan atau Keausan? (gudang alat berat).
 * Mekanik: SORTIR BUKTI. Forklift GT-220 parkir di gudang. Tiga bukti sama
 * menonjol (ukuran ~100 x 90-128, garis tinta, kontras setara):
 *   - panel bodi depan yang penyok (di forklift),
 *   - kap mesin belakang yang terbuka dengan tanda tanya (di forklift),
 *   - papan klip catatan servis yang tergantung di dinding.
 * Ketuk bukti, lalu ketuk salah satu dari tiga nampan di meja sortir. Nampan
 * berbentuk & berukuran sama; warna bibirnya mengikuti warna stiker kategori
 * dari engine (biru / ungu / cokelat, sesuai urutan kategori) supaya pemain
 * melihat stiker di bukti "sewarna" dengan nampan yang dipilih. Ikon nampan =
 * ikon kategori di daftar HTML (cek / jam / obeng), digambar dengan warna netral.
 *
 * Urutan kiri-kanan bukti (panel, mesin, catatan) sengaja TIDAK sejajar dengan
 * urutan nampan yang benar (hanya satu yang kebetulan segaris = setara tebakan),
 * jadi posisi tidak memberi petunjuk.
 *
 * Bukti di forklift digambar dalam koordinat DUNIA lalu digeser ke kotak lokalnya
 * (fungsi `geser`), supaya tepat menempel pada gambar forklift.
 *
 * Petugas tetap di pojok kanan bawah (pita jalan sempit): lajur bawah penuh
 * nampan, jadi berjalan ke bukti akan menutupi / seolah menunjuk satu nampan.
 */

import type { SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, circle, cloud, floorLines, line, path, rect, rrect, shadow, text } from '../art/kit';
import { policyCard } from '../art/props';
import { wheel } from '../art/vehicles';

/** Kotak gambar dalam koordinat dunia: kiri-atas (x0, y0), ukuran w x h. */
interface Kotak {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

const FORKLIFT: Kotak = { x0: 8, y0: 86, w: 404, h: 262 };
const PANEL: Kotak = { x0: 100, y0: 188, w: 118, h: 96 };
const MESIN: Kotak = { x0: 302, y0: 132, w: 112, h: 128 };

function pusat(k: Kotak): { x: number; y: number } {
  return { x: k.x0 + k.w / 2, y: k.y0 + k.h / 2 };
}

/** Gambar yang ditulis dalam koordinat dunia -> koordinat lokal kotaknya. */
function geser(k: Kotak, isi: string): string {
  return `<g transform="translate(${-k.x0} ${-k.y0})">${isi}</g>`;
}

/**
 * Warna stiker kategori engine (MissionScene WARNA_TAG) menurut urutan kategori:
 * terkait = biru, sebelumnya = ungu, teknis = cokelat. Bukan hijau/merah.
 */
const AKSEN = {
  terkait: { tua: '#2f6fb0', pucat: '#dce7f3' },
  sebelumnya: { tua: '#7a5aa6', pucat: '#e7e0f0' },
  teknis: { tua: '#b26b1f', pucat: '#f1e3cf' },
} as const;

// ------------------------------------------------------------------ latar

function latar(): string {
  const sambungan = [212, 244, 276, 308, 340, 372, 404, 436, 468]
    .map((x) => line(`M${x} 60 V292`, '#e6dbc1', 3))
    .join('');
  let lubang = '';
  for (let r = 0; r < 7; r += 1) for (let c = 0; c < 6; c += 1) lubang += circle(488 + c * 25, 136 + r * 23, 2.2, '#c9b184');
  return `
    <!-- dinding gudang -->
    ${rect(0, 0, 640, 300, '#f1e8d4')}
    ${rect(0, 0, 640, 14, '#e2d4b4')}
    ${sambungan}
    ${rect(0, 284, 640, 16, '#e3d7bc')}
    <!-- papan gabus (kartu polis ditempel di sini) -->
    ${rrect(50, 2, 136, 98, 8, '#e3cda4')}
    ${rrect(56, 8, 124, 86, 5, '#d8b98a')}
    <!-- papan nama -->
    ${rrect(234, 20, 196, 34, 10, P.hijau)}
    ${text(332, 43, 'GUDANG ALAT BERAT', 15, P.krem)}
    <!-- pintu gulung terbuka ke halaman -->
    ${rect(10, 120, 170, 180, P.langit)}
    ${rect(10, 120, 170, 52, P.langitAtas, 'opacity="0.5"')}
    ${cloud(56, 150, 0.55)}${cloud(146, 140, 0.42)}
    ${rect(10, 250, 170, 50, '#dcc79f')}
    ${rect(10, 250, 170, 6, '#cbb489')}
    <!-- excavator jauh di halaman (siluet pucat) -->
    <g opacity="0.6">
      ${rrect(18, 238, 56, 14, 7, '#b9ab8e')}
      ${rrect(28, 214, 30, 26, 4, '#e2c77e')}
      ${rrect(34, 219, 14, 11, 2, '#eef3f6')}
      ${path('M56 226 L78 204 L84 210 L64 232 Z', '#e2c77e')}
      ${path('M78 204 L88 228 L82 230 L74 210 Z', '#e2c77e')}
    </g>
    ${rrect(0, 104, 190, 16, 4, P.besi)}
    ${line('M6 112 H184', P.besiMuda, 3, 'opacity="0.7"')}
    ${rect(0, 104, 10, 196, P.besi)}${rect(180, 104, 10, 196, P.besi)}
    <!-- papan perkakas di kanan (papan klip catatan servis digantung di sini) -->
    ${rrect(474, 122, 154, 172, 8, '#e6d3ae')}
    ${lubang}
    ${line('M487 144 v40', P.besi, 6)}${rrect(480, 136, 14, 12, 4, P.besiTua)}
    ${line('M615 146 v44', P.besiTua, 6)}${circle(615, 142, 7, 'none', `stroke="${P.besiTua}" stroke-width="5"`)}
    ${line('M488 222 l0 44', P.kayuTua, 6)}${rrect(480, 214, 16, 12, 3, P.besi)}
    ${line('M615 226 v40', P.besi, 5)}${rrect(609, 262, 12, 10, 3, P.biru, 'opacity="0.8"')}
    <!-- lantai beton -->
    ${rect(0, 300, 640, 180, P.beton)}
    ${rect(0, 300, 640, 8, P.betonTua)}
    ${floorLines(308, 480, 640, P.betonTua)}
    <!-- garis parkir forklift -->
    ${line('M0 356 H430 L424 308', P.kuning, 5, 'opacity="0.8"')}
    ${[40, 110, 180, 250, 320, 390].map((x) => line(`M${x} 356 l-14 12`, P.kuningTua, 4, 'opacity="0.45"')).join('')}
    <!-- palet kayu & kardus di lantai kanan (latar, pucat, tanpa garis tepi) -->
    <g opacity="0.8">
      ${shadow(506, 357, 54, 4, 0.1)}
      ${rect(458, 340, 96, 7, '#cfb088')}
      ${rect(462, 347, 12, 8, '#bb9a70')}${rect(500, 347, 12, 8, '#bb9a70')}${rect(538, 347, 12, 8, '#bb9a70')}
      ${rrect(466, 318, 40, 22, 3, '#dfc69c')}${rect(483, 318, 6, 22, '#cdb083')}
      ${rrect(510, 324, 36, 16, 3, '#e6d2ae')}
    </g>
    <!-- meja sortir -->
    ${rrect(20, 412, 560, 14, 5, P.kayu)}
    ${rect(24, 424, 552, 10, P.kayuTua)}
    ${rect(36, 432, 12, 42, P.kayuTua)}${rect(301, 432, 12, 42, P.kayuTua)}${rect(552, 432, 12, 42, P.kayuTua)}
    <!-- lajur jalan kaki -->
    ${rect(0, 460, 640, 20, '#d4cbb9')}
    ${rect(0, 460, 640, 3, P.betonTua)}`;
}

// ------------------------------------------------------------------ forklift (properti)

/** Forklift GT-220 menghadap KIRI (garpu di kiri, pemberat & mesin di kanan). Koordinat dunia. */
function forklift(): string {
  const isi = `
    ${shadow(212, 338, 204, 8)}
    <!-- badan -->
    ${path('M112 314 L112 220 C112 212 118 206 126 206 L386 206 C398 206 406 214 406 228 L406 296 C406 306 398 314 388 314 Z', P.kuning, INK)}
    ${path('M112 290 L406 290 L406 296 C406 306 398 314 388 314 L112 314 Z', P.kuningTua, INK_TIPIS)}
    ${line('M120 214 H396', P.putih, 3, 'opacity="0.35"')}
    ${path('M124 314 A36 36 0 0 1 196 314 Z', '#3c4a52')}
    ${path('M322 314 A32 32 0 0 1 386 314 Z', '#3c4a52')}
    ${rrect(238, 294, 64, 16, 5, P.krem, INK_TIPIS)}
    ${text(270, 306.5, 'GT-220', 12, P.tinta, 900)}
    <!-- rangka pelindung atap & kursi -->
    ${path('M178 206 L190 206 L212 110 L200 110 Z', P.besi, INK)}
    ${rrect(298, 110, 12, 98, 5, P.besi, INK)}
    ${rrect(190, 100, 130, 12, 6, P.besi, INK)}
    ${line('M212 106 H304', P.besiMuda, 2)}
    ${rrect(250, 90, 14, 10, 4, P.oranye, INK_TIPIS)}
    ${rrect(276, 146, 18, 62, 8, '#3c4a52', INK_TIPIS)}
    ${rrect(232, 188, 62, 18, 8, '#3c4a52', INK_TIPIS)}
    ${line('M200 206 L220 168', P.besiTua, 6)}
    <ellipse cx="222" cy="165" rx="15" ry="5" fill="${P.besiTua}" transform="rotate(-18 222 165)" ${INK_TIPIS}/>
    ${rrect(196, 124, 14, 10, 4, '#fff1b8', INK_TIPIS)}
    <!-- tiang angkat & garpu -->
    ${path('M112 244 L100 236', 'none', `stroke="${P.besiTua}" stroke-width="6" stroke-linecap="round"`)}
    ${rrect(84, 134, 14, 200, 5, P.besiTua, INK)}
    ${rrect(100, 134, 14, 200, 5, P.besiTua, INK)}
    ${rrect(80, 128, 38, 12, 5, P.besi, INK)}
    ${rrect(82, 212, 34, 9, 4, P.besi, INK_TIPIS)}
    ${rrect(64, 248, 22, 84, 5, P.besi, INK)}
    ${rrect(56, 258, 12, 78, 4, P.besiTua, INK)}
    ${path('M14 327 L66 327 L66 337 L22 337 C16 337 14 334 14 331 Z', P.besiTua, INK)}
    <!-- roda -->
    ${wheel(160, 310, 28)}
    ${wheel(354, 312, 26)}`;
  return geser(FORKLIFT, isi);
}

// ------------------------------------------------------------------ bukti (item)

/**
 * Panel bodi depan yang penyok baru, menempel di forklift. 118 x 96.
 * Sudut depan-atas panel remuk ke dalam (siluetnya tidak lagi kotak rapi), ada
 * lipatan, cat tergores, dan garis benturan oranye di luar sudut itu.
 */
function panelPenyok(): string {
  const isi = `
    ${path('M116 248 L125 238 L119 227 L131 219 L137 210 L197 210 C204 210 208 214 208 222 L208 267 C208 274 204 278 197 278 L127 278 C120 278 116 274 116 267 Z', P.tinta, 'opacity="0.14"')}
    ${path('M118 246 L127 236 L121 226 L133 219 L139 212 L196 212 C202 212 206 216 206 222 L206 266 C206 272 202 276 196 276 L128 276 C122 276 118 272 118 266 Z', P.kuning, INK)}
    ${rect(120, 262, 84, 11, P.kuningTua, 'opacity="0.5"')}
    ${circle(198, 221, 3, P.besiMuda, INK_TIPIS)}${circle(198, 267, 3, P.besiMuda, INK_TIPIS)}
    <!-- logam remuk: sisi-sisi lipatan terang/gelap -->
    ${path('M121 226 L133 219 L150 238 L127 236 Z', '#c28d17')}
    ${path('M133 219 L139 212 L160 212 L150 238 Z', '#e4e9e6')}
    ${path('M118 246 L127 236 L150 238 L141 258 L118 258 Z', P.kuningTua)}
    ${path('M150 238 L160 212 L174 224 L168 246 Z', '#f9d970')}
    <!-- cat terkelupas: logam polos terlihat di lipatan -->
    ${path('M150 238 L160 212 L165 216 L155 240 Z', P.besiMuda)}
    ${path('M127 236 L150 238 L146 245 L130 242 Z', P.besiMuda)}
    ${path('M141 258 L150 238 L168 246 L158 264 Z', '#c28d17')}
    ${line('M127 236 L150 238 L133 219 M160 212 L150 238 L141 258 M150 238 L168 246', P.tinta, 2)}
    ${line('M118 258 L141 258 L158 264 L168 246 L174 224 L160 212', P.tinta, 2, 'opacity="0.55"')}
    ${line('M118 246 L127 236 L121 226 L133 219 L139 212 L160 212', P.tinta, 3)}
    <!-- cat tergores -->
    ${line('M174 243 l22 -8 M178 253 l18 -6', P.putih, 3, 'opacity="0.9"')}
    ${line('M174 245 l22 -8 M178 255 l18 -6', P.tinta, 1.4, 'opacity="0.45"')}
    <!-- garis benturan -->
    ${line('M113 224 l-9 -6 M121 207 l-4 -10 M137 203 l2 -11', P.oranye, 4)}`;
  return geser(PANEL, isi);
}

/** Kap mesin belakang terbuka (sisi dalam kap menghadap kita) + mesin + tanda tanya. 112 x 128. */
function mesinTerbuka(): string {
  const isi = `
    <!-- kap terbuka, sedikit miring ke belakang -->
    ${line('M396 212 L404 160', P.besiMuda, 3.5)}
    ${path('M318 208 L398 208 L410 150 L336 142 Z', P.kuning, INK)}
    ${path('M326 203 L391 203 L401 156 L341 150 Z', '#e0b23a')}
    ${line('M339 168 L398 172 M333 186 L394 187', P.kuningTua, 2.5, 'opacity="0.7"')}
    <!-- rongga mesin -->
    ${path('M314 206 L400 206 L400 246 C400 252 396 256 390 256 L324 256 C318 256 314 252 314 246 Z', '#2c3833', INK)}
    ${rrect(322, 214, 44, 32, 5, P.besi, INK_TIPIS)}
    ${line('M331 220 V240 M339 220 V240 M347 220 V240 M355 220 V240', P.besiTua, 2.4)}
    ${circle(382, 230, 11, P.besiMuda, INK_TIPIS)}${circle(382, 230, 4, P.besiTua)}
    ${line('M366 222 C372 214 388 214 392 221', P.besiTua, 3)}
    <!-- tanda tanya menunjuk ke mesin -->
    ${path('M360 184 L350 202 L372 186 Z', P.krem, INK_TIPIS)}
    ${rrect(352, 154, 36, 34, 10, P.krem, INK_TIPIS)}
    ${rect(358, 182, 16, 5, P.krem)}
    ${text(370, 180, '?', 25, P.tinta, 900)}`;
  return geser(MESIN, isi);
}

/** Papan klip catatan servis tergantung di paku, 96 x 128. */
function catatanServis(): string {
  const gigi = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x = 64 + Math.cos(a) * 9.5;
    const y = 103 + Math.sin(a) * 9.5;
    return circle(Number(x.toFixed(1)), Number(y.toFixed(1)), 2.6, P.besi);
  }).join('');
  return `
    ${rrect(14, 28, 80, 100, 8, P.tinta, 'opacity="0.12"')}
    ${line('M48 7 L28 22 M48 7 L68 22', P.besiTua, 2)}
    ${circle(48, 7, 4, P.besiTua)}
    ${rrect(8, 20, 80, 104, 8, P.kayu, INK)}
    ${rrect(15, 32, 66, 86, 3, P.putih)}
    ${rrect(30, 14, 36, 16, 5, P.besi, INK_TIPIS)}
    ${rrect(22, 40, 36, 9, 3, P.besiTua)}
    ${line('M22 60 H74 M22 71 H66 M22 82 H74 M22 93 H46', P.tintaLembut, 3)}
    ${gigi}
    ${circle(64, 103, 8, P.besi)}${circle(64, 103, 3.4, P.putih)}`;
}

// ------------------------------------------------------------------ nampan (kategori) & dokumen

function ikonCek(w: string): string {
  return circle(62, 40, 8.5, P.putih, `stroke="${w}" stroke-width="2.6"`) + line('M57.5 40.5 l3.2 3.2 6 -6.6', w, 2.8);
}

function ikonJam(w: string): string {
  return circle(62, 40, 8.5, P.putih, `stroke="${w}" stroke-width="2.6"`) + line('M62 35 V40.5 l3.6 2.4', w, 2.6);
}

function ikonObeng(w: string): string {
  return `<g transform="rotate(-40 62 40)">
    ${rrect(46, 35, 16, 10, 4, w)}${rect(61, 37.5, 3, 5, P.besiTua)}
    ${line('M64 40 H75', P.besiTua, 2.8)}${line('M75 40 H78', P.besiTua, 1.6)}</g>`;
}

/** Nampan sortir 124 x 62: bentuk & ukuran sama; hanya warna bibir & ikon yang beda. */
function nampan(aksen: { tua: string; pucat: string }, ikon: string): string {
  return `
    ${shadow(62, 58, 54, 4)}
    ${path('M10 20 L114 20 L106 56 L18 56 Z', aksen.pucat, INK)}
    ${rrect(4, 12, 116, 12, 6, aksen.tua, INK)}
    ${rrect(42, 28, 40, 24, 6, P.krem, INK_TIPIS)}
    ${ikon}`;
}

/** Kartu polis ditempel paku payung di papan gabus, 112 x 84. */
function kartuDitempel(): string {
  return `<g transform="translate(1 6)">${policyCard('HVC', P.hijau)}</g>
    ${circle(56, 8, 5.5, P.biru, INK_TIPIS)}${circle(54.5, 6.5, 1.6, P.putih, 'opacity="0.8"')}`;
}

// ------------------------------------------------------------------ adegan

export function sceneForklift(): SceneSpec {
  const bg = art('m08-latar', 640, 480, latar());
  const fk = pusat(FORKLIFT);
  const pn = pusat(PANEL);
  const ms = pusat(MESIN);
  return {
    missionId: 'm08-benturan-keausan',
    background: bg,
    props: [
      { id: 'forklift', x: fk.x, y: fk.y, art: art('m08-forklift', FORKLIFT.w, FORKLIFT.h, forklift()), depth: 6 },
    ],
    hero: { x: 604, y: 478 },
    // Pita jalan sengaja sempit: seluruh lajur bawah dipakai meja sortir. Bila
    // petugas berjalan ke bukti (x bukti + 80), ia berdiri DI DEPAN salah satu
    // nampan (mis. di depan 'Cek teknis' saat 'Rusak internal' dipilih) tepat
    // ketika pemain harus memilih nampan = menutupi pilihan & terlihat menunjuk.
    // Di pojok kanan ia hanya berbalik & memakai stempel, sama untuk semua bukti.
    walk: { minX: 584, maxX: 604, minY: 464, maxY: 478 },
    bucketShort: {
      'klasifikasi:terkait': 'Terkait kejadian',
      'klasifikasi:sebelumnya': 'Kondisi lama',
      'klasifikasi:teknis': 'Cek teknis',
    },
    objects: [
      // Area sentuh diperpanjang ke bawah sampai menutup pil label (pola m10):
      // pemain awam sering mengetuk tulisan nama. Tidak ada area yang saling
      // menutup (kartu y<=126, bukti y 102-314, nampan y 339-441; kolom terpisah).
      // Dokumen: kartu polis di papan gabus.
      {
        id: 'kartu', role: 'doc', refId: 'kartu-hvc',
        x: 118, y: 54, art: art('m08-kartu', 112, 84, kartuDitempel()), label: 'Kartu polis', depth: 20,
        hit: { w: 130, h: 144 },
      },
      // Bukti (item): tiga benda setara, ruang kosong di atas masing-masing untuk stiker.
      {
        id: 'panel', role: 'item', stepId: 'klasifikasi', refId: 'panel', fx: 'tag',
        x: pn.x, y: pn.y, art: art('m08-panel', PANEL.w, PANEL.h, panelPenyok()), label: 'Panel rusak', depth: 22,
        hit: { w: 130, h: 156 },
      },
      {
        id: 'mesin', role: 'item', stepId: 'klasifikasi', refId: 'internal', fx: 'tag',
        x: ms.x, y: ms.y, art: art('m08-mesin', MESIN.w, MESIN.h, mesinTerbuka()), label: 'Rusak internal', depth: 22,
        labelDx: -8, hit: { w: 130, h: 188 },
      },
      {
        id: 'catatan', role: 'item', stepId: 'klasifikasi', refId: 'catatan-aus', fx: 'tag',
        x: 548, y: 212, art: art('m08-catatan', 96, 128, catatanServis()), label: 'Catatan servis', depth: 22,
        labelDx: -10, hit: { w: 120, h: 188 },
      },
      // Kategori (bucket): tiga nampan sama bentuk di meja sortir, jarak sama (183),
      // urutan = urutan di daftar HTML. Label sedikit naik (-6) supaya sebagian
      // besar pil masuk area sentuh; batas atas area (339) di bawah roda forklift.
      {
        id: 'baki-terkait', role: 'bucket', stepId: 'klasifikasi', refId: 'terkait',
        x: 124, y: 390, art: art('m08-baki-terkait', 124, 62, nampan(AKSEN.terkait, ikonCek(AKSEN.terkait.tua))), label: 'Terkait kejadian', depth: 20,
        labelDy: -6, hit: { w: 168, h: 102 },
      },
      {
        id: 'baki-sebelumnya', role: 'bucket', stepId: 'klasifikasi', refId: 'sebelumnya',
        x: 307, y: 390, art: art('m08-baki-sebelumnya', 124, 62, nampan(AKSEN.sebelumnya, ikonJam(AKSEN.sebelumnya.tua))), label: 'Kondisi lama', depth: 20,
        labelDy: -6, hit: { w: 168, h: 102 },
      },
      {
        id: 'baki-teknis', role: 'bucket', stepId: 'klasifikasi', refId: 'teknis',
        x: 490, y: 390, art: art('m08-baki-teknis', 124, 62, nampan(AKSEN.teknis, ikonObeng(AKSEN.teknis.tua))), label: 'Cek teknis', depth: 20,
        labelDy: -6, hit: { w: 168, h: 102 },
      },
    ],
  };
}
