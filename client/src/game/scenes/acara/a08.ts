/**
 * Misi acara 08 - Lini Masa Excavator (proyek jalan baru; latar & unit milik m04).
 * Mekanik: PILAH TEMUAN. Lima bagian unit EX-2085 menempel di badan excavator
 * (teknik `potong()` m04): ketuk bagian, lalu pilih kategorinya di bawah adegan.
 * Stiker kategori muncul DI ATAS bagian itu. Langkah `simpul` dijawab lewat HTML.
 *
 * Netral: kelima bagian sama-sama memperlihatkan kondisinya (penyok, retak, aus,
 * tetes oli, kap terbuka) dengan kontras setara, tanpa tanda tanya / tanggal /
 * warna penilaian. KAPAN kerusakan muncul hanya bisa dibaca dari dua dokumen:
 * buku servis (dipegang operator) dan laporan kejadian (papan klip di barikade).
 * Kartu polis dibuka lewat tombol Dokumen.
 *
 * Tata letak (bagian unit berdekatan, jadi label & stiker dihitung; diperiksa dengan
 * pratinjau: stiker terpanjang "Kondisi lama" di KELIMA bagian sekaligus tidak bertumpuk):
 * - stiker = tepat di atas kotak gambar; jangkar stiker bertetangga berjarak >= 60 satuan
 *   vertikal (y: boom 117, kaca 177, mesin 238, track 328; selang 239 tetapi jauh di kanan);
 * - label "Boom penyok" di ATAS tempat stikernya (di bawah boom ada kabin & roda rantai),
 *   empat lainnya di bawah bagiannya. "Kaca" sengaja satu kata: ruang di antara kap mesin
 *   dan pangkal boom hanya ~90 satuan, jadi terjemahan label `kaca` harus sependek itu
 *   (dan `mesin` <= ~105 satuan supaya tidak menyentuh label "Buku servis" / track);
 * - roda rantai utuh = properti (potongan m04); item "Track shoe" hanya separuh DEPAN-nya
 *   (tanda aus), supaya stikernya tidak menutupi ruang mesin. Label "Mesin" menutupi ujung
 *   BELAKANG roda rantai yang bukan item.
 */

import { SKIN_TONES } from '@shared/brand';
import type { ArtRef, SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rrect } from '../../art/kit';
import { personArt } from '../../art/characters';
import {
  PX, PY, RANTAI, ROOT, SIKU,
  badanDunia, boomLokal, dunia, kotakLokal, labelKe, latar, miring, potong, rodaRantaiLokal,
} from '../m04-proyek';

/** Oli hidrolik (cokelat tua netral, bukan merah/hijau). */
const OLI = '#4a3524';

// ------------------------------------------------------------------ bagian unit (baru)

/**
 * Kaca kabin: panel kaca PERSIS seperti di `badanDunia()` m04 (menutup kaca utuh di
 * bawahnya) + retakan menjalar dari satu titik dan satu lubang pecahan. Rangka kabin
 * tidak digambar ulang: semua yang baru ada di dalam potongan, jadi tidak ada sambungan.
 * Koordinat lokal unit.
 */
function kacaPecahLokal(): string {
  return `
    ${rrect(-84, -194, 52, 44, 7, P.kaca, INK_TIPIS)}
    ${path('M-80 -190 L-66 -190 L-78 -164 L-80 -164 Z', P.putih, 'opacity="0.6"')}
    <!-- lubang pecahan + retakan -->
    ${path('M-52 -183 L-44 -187 L-38 -178 L-42 -169 L-51 -171 L-56 -177 Z', '#5d7482', INK_TIPIS)}
    ${line('M-52 -183 L-62 -193 M-44 -187 L-41 -194 M-38 -178 L-32 -176 M-42 -169 L-36 -156 M-51 -171 L-58 -152 M-56 -177 L-72 -174 L-84 -180', P.tinta, 1.8)}
    ${line('M-66 -188 L-64 -176 L-60 -166 M-47 -162 L-40 -163', P.tinta, 1.4, 'opacity="0.8"')}
    ${line('M-62 -191 L-53 -182 M-57 -153 L-51 -170', P.putih, 1.2, 'opacity="0.9"')}`;
}

/**
 * Ruang mesin di bagian belakang rumah mesin: pintu samping terangkat, blok mesin
 * & puli terlihat. TANPA tanda tanya (beda dengan m08): gambar tidak memberi petunjuk kategori.
 */
function mesinTerbukaLokal(): string {
  return `
    <!-- pintu samping terangkat (engsel di tepi atas ruang mesin) -->
    ${line('M-130 -90 L-124 -138', P.besiMuda, 3.2)}
    ${path('M-180 -120 L-124 -120 L-120 -150 L-172 -156 Z', P.kuning, INK)}
    ${path('M-174 -125 L-129 -125 L-126 -146 L-168 -151 Z', '#e0b23a')}
    ${line('M-167 -142 L-129 -138 M-170 -133 L-130 -131', P.kuningTua, 2.4, 'opacity="0.7"')}
    <!-- ruang mesin -->
    ${rrect(-178, -118, 52, 38, 5, '#2c3833', INK)}
    ${rrect(-173, -112, 24, 27, 4, P.besi, INK_TIPIS)}
    ${line('M-167 -108 v19 M-161 -108 v19 M-155 -108 v19', P.besiTua, 2.2)}
    ${circle(-138, -96, 8.5, P.besiMuda, INK_TIPIS)}${circle(-138, -96, 3, P.besiTua)}
    ${line('M-149 -104 C-146 -111 -134 -111 -130 -103', P.besiTua, 2.6)}`;
}

/**
 * Keausan di separuh depan roda rantai: tapak menipis & mengilap. HANYA tanda ausnya
 * (roda rantai utuh sudah digambar sebagai properti di bawahnya), jadi tidak ada
 * bagian semi-transparan yang tergambar dua kali di tepi potongan.
 */
function tapakAusLokal(): string {
  let aus = '';
  for (let x = -106; x <= -31; x += 15) aus += rrect(x - 5, -48.5, 10, 5, 2, P.besiMuda) + rrect(x - 5, -6.5, 10, 5, 2, P.besiMuda);
  return `
    ${aus}
    ${line('M-25 -45 C-11 -45 -5 -37 -5 -25 C-5 -13 -11 -5 -25 -5', P.besiMuda, 3)}`;
}

/**
 * Selang hidrolik di lengan bawah (koordinat DUNIA: lengan m04 tidak ikut miring):
 * selang melendut, bagian bawahnya basah, tiga tetes jatuh ke genangan kecil.
 */
function selangDunia(): string {
  const alur = 'M435 258 C455 262 473 284 465 306 C461 318 454 322 450 329';
  const tetes = (x: number, y: number, s: number): string =>
    `<g transform="translate(${x} ${y}) scale(${s})">${path('M0 -9 C6 -1 6 6 0 6 C-6 6 -6 -1 0 -9 Z', OLI)}${circle(-1.6, 1.4, 1.4, P.putih, 'opacity="0.55"')}</g>`;
  return `
    <ellipse cx="475" cy="377" rx="17" ry="4.5" fill="${OLI}" opacity="0.85"/>
    ${line(alur, P.tinta, 9.5)}
    ${line(alur, '#4a5750', 5)}
    ${line('M443 263 C457 269 467 285 463 300', P.besiMuda, 1.6, 'opacity="0.6"')}
    ${rrect(429, 252, 13, 11, 3, P.besiMuda, INK_TIPIS)}
    ${rrect(443, 324, 13, 11, 3, P.besiMuda, INK_TIPIS)}
    ${line('M468 290 C470 297 468 304 464 310', OLI, 5.5, 'opacity="0.92"')}
    ${tetes(468, 325, 1)}${tetes(471, 346, 0.85)}${tetes(473, 363, 0.7)}`;
}

// ------------------------------------------------------------------ dokumen

/** Operator proyek memegang buku servis unit (sampul teal, ikon roda gigi). Bukan tokoh pemandu. */
function operatorBuku(): ArtRef {
  const orang = personArt({ key: 'a08-operator-dasar', shirt: P.biru, pants: '#4b5563', helmet: true, vest: true, pose: 'diam', mood: 'netral' });
  const isi = orang.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const buku = `<g transform="translate(42 76) rotate(-7)">
    ${rrect(3, 2, 28, 37, 3, P.putih, INK_TIPIS)}
    ${rrect(0, 0, 28, 37, 3, P.teal, INK)}
    <rect x="0" y="0" width="6" height="37" rx="3" fill="#000" opacity="0.18"/>
    ${rrect(9, 5, 15, 8, 2, P.krem)}
    ${circle(16.5, 25, 6, P.krem)}${circle(16.5, 25, 2.4, P.teal)}
    ${line('M16.5 17 v2.4 M16.5 30.6 v2.4 M8.5 25 h2.4 M22.1 25 h2.4', P.krem, 2.6)}</g>
    ${circle(66, 108, 5.5, SKIN_TONES[1]!, INK_TIPIS)}`;
  const a = art('a08-operator', 80, 152, isi + buku);
  return { ...a, w: 68, h: 130 };
}

/** Papan klip laporan kejadian, digantung dengan tali di rel barikade. 64 x 98. */
function laporanGantung(): string {
  return `
    ${line('M18 3 L32 18 L46 3', P.besiTua, 2)}
    <g transform="translate(0 12)">
      ${rrect(4, 6, 56, 76, 6, P.kayu, INK)}
      ${rrect(9, 14, 46, 62, 3, P.putih)}
      ${rrect(20, 2, 24, 12, 3, P.besi, INK_TIPIS)}
      ${rrect(14, 21, 30, 8, 2.5, P.oranye)}
      ${line('M14 38 H50 M14 48 H44 M14 58 H50 M14 68 H36', P.tintaLembut, 3)}
    </g>`;
}

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  // Latar, badan, roda rantai, dan boom = gambar m04 apa adanya (kunci tekstur sama, SVG identik).
  const bg = art('m04-latar', 640, 480, latar());
  const siku = dunia(SIKU[0], SIKU[1]);
  const badan = potong(
    'm04-excavator',
    [dunia(-214, -210), dunia(10, -210), dunia(-214, 0), dunia(10, 0), [siku[0] - 16, siku[1] - 16], [siku[0] + 90, 380], [PX - 210, PY + 16]],
    8,
    badanDunia(),
  );
  const rantai = potong('m04-rantai', kotakLokal(RANTAI.x, RANTAI.y, RANTAI.w, RANTAI.h), 6, miring(rodaRantaiLokal()));
  const boom = potong(
    'm04-boom',
    [dunia(ROOT[0] - 18, ROOT[1] + 12), dunia(ROOT[0] + 20, ROOT[1] + 12), dunia(SIKU[0] + 14, SIKU[1] - 20), dunia(SIKU[0] + 16, SIKU[1] + 16), dunia(SIKU[0] - 40, SIKU[1] - 20)],
    6,
    miring(boomLokal()),
  );

  // Potongan baru.
  const kaca = potong('a08-kaca', kotakLokal(-96, -208, 78, 64), 4, miring(kacaPecahLokal()));
  const mesin = potong('a08-mesin', kotakLokal(-196, -160, 80, 84), 6, miring(mesinTerbukaLokal()));
  const track = potong('a08-track', kotakLokal(-112, RANTAI.y, 112, RANTAI.h), 6, miring(tapakAusLokal()));
  const selang = potong('a08-selang', [[430, 252], [492, 380]], 5, selangDunia());

  const operator = operatorBuku();

  return {
    missionId: 'a08-linimasa-ex',
    background: bg,
    props: [
      { id: 'excavator', x: badan.x, y: badan.y, art: badan.art, depth: 10 },
      { id: 'roda-rantai', x: rantai.x, y: rantai.y, art: rantai.art, depth: 11 },
    ],
    hero: { x: 40, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 462, maxY: 478 },
    bucketShort: {
      'pilah:terkait': 'Terkait',
      'pilah:sebelumnya': 'Kondisi lama',
      'pilah:teknis': 'Cek teknis',
    },
    objects: [
      // Dokumen: dua sumber tanggal, sama-sama di tepi adegan (kiri & kanan unit).
      {
        id: 'buku-servis', role: 'doc', refId: 'servis',
        x: 40, y: 250, art: operator, label: 'Buku servis', depth: 20,
        hit: { w: 80, h: 150 },
      },
      {
        id: 'laporan', role: 'doc', refId: 'laporan',
        x: 591, y: 270, art: art('a08-laporan', 64, 98, laporanGantung()), label: 'Laporan', depth: 20,
        hit: { w: 90, h: 130 },
      },
      // Bagian unit (item). Kedalaman bagian kecil lebih tinggi supaya ketukannya menang
      // di tepi kotak boom yang diagonal.
      {
        id: 'mesin', role: 'item', stepId: 'pilah', refId: 'mesin', fx: 'tag',
        x: mesin.x, y: mesin.y, art: mesin.art, label: 'Mesin', depth: 22,
        // Label di bawah ruang mesin, sedikit ke kiri: menutupi ujung BELAKANG roda rantai
        // (properti, bukan item), tidak menyentuh separuh depan yang bisa diketuk.
        labelDx: -4,
      },
      {
        id: 'kaca', role: 'item', stepId: 'pilah', refId: 'kaca', fx: 'tag',
        x: kaca.x, y: kaca.y, art: kaca.art, label: 'Kaca', depth: 24,
        // Celah antara ruang mesin (kiri) dan pangkal boom (kanan) lebih sempit daripada labelnya:
        // geser 5 satuan ke kiri supaya bebas dari poros boom; yang tertimpa hanya bantalan kosong kotak mesin.
        labelDx: -5, labelDy: -4, hit: { w: 84, h: 84 },
      },
      {
        id: 'boom', role: 'item', stepId: 'pilah', refId: 'boom', fx: 'tag',
        x: boom.x, y: boom.y, art: boom.art, label: 'Boom penyok', depth: 21,
        // Label di atas TEMPAT STIKER (stiker = 32 satuan tepat di atas ujung boom).
        hit: { w: 92, h: 188 }, ...labelKe(boom, 376, 76),
      },
      {
        id: 'track', role: 'item', stepId: 'pilah', refId: 'track', fx: 'tag',
        x: track.x, y: track.y, art: track.art, label: 'Track shoe', depth: 20,
      },
      {
        id: 'selang', role: 'item', stepId: 'pilah', refId: 'selang', fx: 'tag',
        x: selang.x, y: selang.y, art: selang.art, label: 'Selang hidrolik', depth: 24,
        // Label digeser ke kanan supaya tidak menyentuh ujung depan roda rantai.
        hit: { w: 80, h: 138 }, labelDx: 36,
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a08-linimasa-ex', buat };
