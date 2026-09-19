/**
 * Misi 10 - Grand Mission (kompleks usaha kebanjiran).
 * Mekanik: TIGA KASUS, TIGA TAHAP. Ketuk kasus (mobil / alat berat / gudang),
 * lalu pilih kategorinya di bawah adegan. Stiker tiap tahap menumpuk di atas
 * kasusnya (maks 3). Kartu polis tiap kasus berdiri di tanggul kering dan bisa
 * dibuka kapan saja.
 *
 * Netral: ketiga kasus digambar setara (ukuran, kontras, sama-sama tergenang,
 * sama-sama punya pelat identitas IDENTIK tanpa tulisan: ukuran, warna, detail
 * sama persis lewat `pelatId`). Tidak ada tanda benar/salah.
 *
 * Area sentuh kasus mencakup label "Kasus X" di bawahnya (pemain awam sering
 * mengetuk pil label); area kartu polis mencakup label "Polis X". Keduanya
 * tidak saling tumpang tindih.
 */

import type { ArtRef, SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, building, circle, cloud, line, path, rect, rrect, shadow, text, tree } from '../art/kit';
import { personArt, type PersonOpts } from '../art/characters';
import { wheel } from '../art/vehicles';

/** NPC dengan skala sama seperti petugas di adegan (0,8). */
export function wargaKecil(key: string, o: Omit<PersonOpts, 'key'>, s = 0.8): ArtRef {
  const penuh = personArt({ ...o, key });
  const isi = penuh.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const w = Math.round(penuh.w * s);
  const h = Math.round(penuh.h * s);
  return art(key, w, h, `<g transform="scale(${s})">${isi}</g>`);
}

/** Air pucat di latar (halaman kompleks yang tergenang). */
const AIR_LATAR = '#b7dbef';
const AIR_MUDA = '#cbe6f4';

// ------------------------------------------------------------------ latar

function karungPasir(): string {
  // Dua baris karung pasir di tepi tanggul (tanpa garis tepi: bagian latar).
  let s = '';
  for (let x = -6; x < 650; x += 30) s += `<ellipse cx="${x}" cy="344" rx="17" ry="8" fill="#d6c298"/>`;
  for (let x = 9; x < 650; x += 30) s += `<ellipse cx="${x}" cy="336" rx="17" ry="8" fill="#e2d0a8"/>`;
  return s;
}

function riak(x: number, y: number, w: number): string {
  return line(`M${x} ${y} q${w / 4} -5 ${w / 2} 0 t${w / 2} 0`, P.putih, 2.5, 'opacity="0.75"');
}

export function latar(): string {
  return `
    <!-- langit -->
    ${rect(0, 0, 640, 180, '#dcedf5')}
    ${rect(0, 0, 640, 60, '#cfe6f2', 'opacity="0.7"')}
    ${circle(44, 40, 20, P.kuningPucat, 'opacity="0.9"')}
    ${cloud(150, 96, 0.55, 0.8)}${cloud(430, 34, 0.75, 0.85)}${cloud(300, 104, 0.45, 0.7)}
    <!-- bukit & kota jauh -->
    ${path('M0 150 C70 118 150 124 230 140 C310 116 410 110 500 132 C560 120 610 116 640 124 L640 170 L0 170 Z', '#d3e4d6')}
    <g opacity="0.75">
      ${building(70, 158, 54, 70, '#e3d7c2', { windows: false })}
      ${rrect(80, 100, 12, 14, 2, P.kaca)}${rrect(102, 100, 12, 14, 2, P.kaca)}${rrect(80, 124, 12, 14, 2, P.kaca)}${rrect(102, 124, 12, 14, 2, P.kaca)}
      ${building(186, 158, 44, 52, '#d6dfe2', { windows: false })}
      ${rrect(196, 118, 10, 12, 2, P.kaca)}${rrect(212, 118, 10, 12, 2, P.kaca)}
      ${building(360, 158, 60, 84, '#e6d9bf', { windows: false })}
      ${rrect(372, 86, 12, 14, 2, P.kaca)}${rrect(396, 86, 12, 14, 2, P.kaca)}${rrect(372, 110, 12, 14, 2, P.kaca)}${rrect(396, 110, 12, 14, 2, P.kaca)}${rrect(372, 134, 12, 14, 2, P.kaca)}${rrect(396, 134, 12, 14, 2, P.kaca)}
      ${building(470, 158, 48, 58, '#d9e4dc', { windows: false })}
      ${rrect(480, 112, 10, 12, 2, P.kaca)}${rrect(498, 112, 10, 12, 2, P.kaca)}
      ${building(540, 158, 70, 44, '#e8dcc6', { windows: false })}
      ${rrect(552, 126, 12, 12, 2, P.kaca)}${rrect(570, 126, 12, 12, 2, P.kaca)}${rrect(588, 126, 12, 12, 2, P.kaca)}
    </g>
    ${tree(34, 162, 0.62)}${tree(150, 160, 0.55)}${tree(296, 160, 0.6)}${tree(448, 160, 0.55)}${tree(622, 162, 0.6)}
    <!-- papan nama kompleks -->
    ${rect(206, 42, 6, 116, '#b9a98b')}${rect(338, 42, 6, 116, '#b9a98b')}
    ${rrect(192, 26, 166, 34, 9, P.hijau)}
    ${text(275, 49, 'KOMPLEKS USAHA', 16, P.krem)}
    <!-- pagar belakang kompleks -->
    ${rect(0, 156, 640, 12, '#e8dfcc')}
    ${rect(0, 166, 640, 4, '#d4c8ae')}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => rect(10 + i * 78, 150, 12, 20, '#dccfb3')).join('')}
    <!-- halaman tergenang -->
    ${rect(0, 170, 640, 176, AIR_LATAR)}
    ${rect(0, 170, 640, 18, AIR_MUDA)}
    <!-- rambu P (parkiran di petak kiri) -->
    ${rect(12, 132, 5, 64, '#9aa8a0')}
    ${rrect(2, 116, 26, 24, 5, P.biruMuda)}
    ${text(15, 134, 'P', 17, P.putih, 900)}
    <!-- riak air (celah antar kasus dibiarkan polos: tidak ada benda di dekat titik ketuk) -->
    ${riak(24, 184, 40)}${riak(250, 206, 32)}${riak(560, 182, 36)}${riak(460, 212, 28)}
    ${riak(14, 318, 44)}${riak(210, 326, 36)}${riak(420, 320, 40)}${riak(600, 326, 30)}
    ${riak(203, 262, 26)}${riak(412, 270, 26)}
    <!-- tanggul karung pasir & jalan kering -->
    ${rect(0, 346, 640, 134, '#e6ddcb')}
    ${rect(0, 346, 640, 8, '#d3c7ae')}
    ${karungPasir()}
    ${line('M0 452 H640', '#d3c7ae', 3, 'opacity="0.8"')}
    ${[40, 150, 260, 370, 480, 590].map((x) => line(`M${x} 468 h44`, P.putih, 4, 'opacity="0.7"')).join('')}
    <ellipse cx="236" cy="404" rx="30" ry="5" fill="${AIR_MUDA}"/>
    <ellipse cx="438" cy="410" rx="24" ry="4" fill="${AIR_MUDA}"/>`;
}

// ------------------------------------------------------------------ kasus (item)

/** Genangan di kaki objek: elips air + riak, lebar w, pusat y cy. */
export function genangan(w: number, cy: number): string {
  const cx = w / 2;
  let riakDepan = '';
  for (let x = 16; x < w - 30; x += 38) riakDepan += `M${x} ${cy - 3} q8 -4 16 0 `;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 3}" ry="11" fill="${P.air}" opacity="0.55"/>
    ${line(riakDepan, P.putih, 2.6, 'opacity="0.85"')}`;
}

/**
 * Pelat identitas tanpa tulisan, 28 x 15. SAMA PERSIS di ketiga kasus
 * (pelat mobil, pelat seri alat berat, pelat nomor gudang) supaya tidak ada
 * kasus yang pelatnya lebih menonjol (bukan petunjuk "cek nomor seri").
 */
export function pelatId(x: number, y: number): string {
  return `${rrect(x, y, 28, 15, 3, P.krem, INK_TIPIS)}
    ${circle(x + 4.5, y + 7.5, 1.6, P.besi)}${circle(x + 23.5, y + 7.5, 1.6, P.besi)}
    ${line(`M${x + 9} ${y + 5.5} H${x + 19} M${x + 9} ${y + 10} H${x + 17}`, P.tintaLembut, 1.8)}`;
}

/** Kasus A: mobil operasional (van) menghadap kiri, 190 x 104. */
export function mobilOperasional(): string {
  return `
    ${shadow(96, 92, 86, 7, 0.12)}
    ${path('M14 78 C12 66 18 58 30 56 L46 54 L64 22 C67 16 72 13 80 13 L172 13 C180 13 184 18 184 26 L184 80 C184 84 181 87 177 87 L18 87 C15 87 14 84 14 78 Z', P.biru, INK)}
    ${path('M68 22 L86 22 L86 50 L52 50 Z', P.kaca, INK_TIPIS)}
    ${rrect(92, 22, 30, 28, 4, P.kaca, INK_TIPIS)}
    ${rrect(128, 22, 30, 28, 4, P.kaca, INK_TIPIS)}
    ${rrect(164, 22, 14, 28, 4, P.kaca, INK_TIPIS)}
    ${path('M70 24 L78 24 L62 44 L58 44 Z', P.putih, 'opacity="0.55"')}
    ${rect(30, 60, 153, 8, P.kuning)}
    ${line('M89 18 V84 M124 52 V84', P.tinta, 2, 'opacity="0.4"')}
    ${rrect(98, 72, 14, 4, 2, P.besiTua)}
    ${rrect(15, 60, 12, 9, 3, '#fff1b8', INK_TIPIS)}
    ${rrect(176, 62, 8, 12, 3, P.merah, INK_TIPIS)}
    ${pelatId(4, 69)}
    ${wheel(48, 86, 15)}
    ${wheel(152, 86, 15)}
    ${genangan(190, 93)}`;
}

/** Kasus B: excavator menghadap kanan dengan pelat seri (tanpa tulisan), 190 x 108. */
export function alatBerat(): string {
  return `
    ${shadow(90, 97, 84, 7, 0.12)}
    ${rrect(98, 20, 8, 18, 3, P.besi, INK_TIPIS)}
    ${path('M118 52 L154 12 L168 22 L130 64 Z', P.kuning, INK)}
    ${line('M124 46 L152 20', P.besiMuda, 4)}
    ${path('M154 12 L186 56 L174 63 L146 24 Z', P.kuning, INK)}
    ${path('M178 58 C191 62 193 78 187 90 L166 91 C164 80 167 67 178 58 Z', P.besi, INK)}
    ${circle(158, 17, 5, P.besiTua, INK_TIPIS)}
    ${circle(179, 60, 4, P.besiTua, INK_TIPIS)}
    ${rrect(6, 70, 118, 28, 14, P.besiTua, INK)}
    ${[21, 43, 65, 87, 109].map((x) => circle(x, 84, 6.5, P.besi, INK_TIPIS)).join('')}
    ${rrect(24, 60, 84, 12, 6, P.kuningTua, INK)}
    ${rrect(10, 34, 116, 30, 9, P.kuning, INK)}
    ${rect(12, 54, 112, 6, '#000', 'opacity="0.1"')}
    ${rrect(16, 4, 50, 50, 9, '#eef3f6', INK)}
    ${rrect(24, 12, 34, 24, 5, P.kaca, INK_TIPIS)}
    ${path('M27 14 L38 14 L28 30 L26 30 Z', P.putih, 'opacity="0.55"')}
    ${pelatId(80, 41)}
    ${genangan(190, 96)}`;
}

/** Kasus C: gudang beratap pelana dengan pintu gulung & pelat nomor (tanpa tulisan), 180 x 116. */
export function gudang(): string {
  let siding = '';
  for (let x = 22; x <= 160; x += 12) siding += `M${x} 44 V100 `;
  let rolling = '';
  for (let y = 62; y < 104; y += 7) rolling += `M58 ${y} H122 `;
  return `
    ${shadow(90, 106, 84, 7, 0.12)}
    ${rrect(12, 38, 156, 66, 3, '#eadcb9', INK)}
    ${line(siding, '#d6c49c', 2)}
    ${line('M14 86 H166', '#8a7a58', 2.5, 'opacity="0.35"')}
    ${path('M4 46 L90 8 L176 46 Z', P.teal, INK)}
    ${line('M20 42 L90 14 L160 42', P.putih, 2.5, 'opacity="0.25"')}
    ${circle(90, 32, 7, P.krem, INK_TIPIS)}
    ${line('M84 32 H96', P.besi, 2)}
    ${rect(52, 50, 76, 7, P.besi)}
    ${rrect(56, 56, 68, 48, 2, P.besiMuda, INK_TIPIS)}
    ${line(rolling, P.besi, 2, 'opacity="0.7"')}
    ${rrect(22, 56, 26, 18, 3, P.kaca, INK_TIPIS)}
    ${pelatId(21, 79)}
    ${rrect(136, 62, 22, 42, 3, P.kayu, INK_TIPIS)}
    ${circle(153, 84, 2, P.besiTua)}
    ${rrect(84, 46, 12, 5, 2, P.kuningPucat)}
    ${genangan(180, 104)}`;
}

// ------------------------------------------------------------------ kartu polis (doc)

/** Kartu polis kecil di atas penyangga, 70 x 62. Semua kartu sama; beda hanya huruf. */
export function kartuBerdiri(huruf: string): string {
  return `
    ${shadow(35, 58, 26, 4)}
    ${line('M22 40 L15 57 M48 40 L55 57', P.tinta, 8)}
    ${line('M22 40 L15 57 M48 40 L55 57', P.kayu, 4)}
    ${rrect(4, 4, 62, 42, 7, P.krem, INK)}
    ${rrect(4, 4, 62, 14, 7, P.hijau)}
    ${rect(4, 12, 62, 6, P.hijau)}
    ${rrect(4, 4, 62, 42, 7, 'none', INK)}
    ${line('M12 28 H36 M12 36 H30', P.besiMuda, 3)}
    ${circle(51, 32, 10, P.kuning, INK_TIPIS)}
    ${text(51, 37, huruf, 14, P.tinta, 900)}`;
}

// ------------------------------------------------------------------ adegan

export function sceneKotaBanjir(): SceneSpec {
  const bg = art('m10-latar', 640, 480, latar());
  // Dasar ketiga kasus sejajar (y DASAR); label di bawahnya (pil 32, pusat DASAR+18);
  // stiker menumpuk ke atas. Area sentuh diperpanjang ke bawah sampai tepi bawah
  // label (LABEL_BAWAH) supaya mengetuk pil "Kasus X" juga memilih kasus itu.
  const DASAR = 300;
  const LABEL_BAWAH = DASAR + 18 + 16;
  // Kartu polis: area sentuh (tinggi 110) mulai tepat di bawah LABEL_BAWAH dan
  // mencakup label "Polis X" yang dinaikkan sedikit (labelDy).
  const KARTU_Y = 390;
  const kasus = [
    { id: 'kasus-a', x: 112, a: art('m10-mobil', 190, 104, mobilOperasional()), label: 'Kasus A' },
    { id: 'kasus-b', x: 320, a: art('m10-alat-berat', 190, 108, alatBerat()), label: 'Kasus B' },
    { id: 'kasus-c', x: 528, a: art('m10-gudang', 180, 116, gudang()), label: 'Kasus C' },
  ];
  const kartu = [
    { id: 'polis-a', refId: 'kasus-a', x: 112, huruf: 'A' },
    { id: 'polis-b', refId: 'kasus-b', x: 320, huruf: 'B' },
    { id: 'polis-c', refId: 'kasus-c', x: 528, huruf: 'C' },
  ];
  // Karyawan di jalan kering yang melambai: "semua orang sudah aman" (bukan objek pilihan).
  const karyawan = wargaKecil('m10-karyawan', { shirt: P.oranye, pants: '#3c4a52', pose: 'lambai', mood: 'senyum' });
  return {
    missionId: 'm10-grand-mission',
    background: bg,
    props: [{ id: 'karyawan', x: 30, y: 476 - karyawan.h / 2, art: karyawan, depth: 30 }],
    hero: { x: 606, y: 478, flip: true },
    walk: { minX: 80, maxX: 606, minY: 462, maxY: 478 },
    objects: [
      ...kasus.map((k) => ({
        id: k.id,
        role: 'item' as const,
        stepIds: ['produk', 'periksa', 'tindak'],
        refId: k.id,
        fx: 'tag' as const,
        x: k.x,
        y: DASAR - k.a.h / 2,
        art: k.a,
        label: k.label,
        hit: { w: k.a.w, h: 2 * (LABEL_BAWAH - (DASAR - k.a.h / 2)) },
        depth: 20,
      })),
      ...kartu.map((d) => ({
        id: d.id,
        role: 'doc' as const,
        refId: d.refId,
        x: d.x,
        y: KARTU_Y,
        art: art(`m10-kartu-${d.huruf.toLowerCase()}`, 70, 62, kartuBerdiri(d.huruf)),
        label: `Polis ${d.huruf}`,
        labelDy: -10,
        hit: { w: 100, h: 110 },
        depth: 22,
      })),
    ],
    bucketShort: {
      'produk:AUTO': 'AUTO',
      'produk:HVC': 'HVC',
      'produk:PROPERTY': 'FIRE/PROPERTY',
      'produk:CARGO': 'CARGO',
      'periksa:jaminan': 'Cek jaminan',
      'periksa:identitas': 'Cek nomor seri',
      'periksa:bukti': 'Cek bukti',
      'tindak:luar-jaminan': 'Luar jaminan',
      'tindak:klarifikasi': 'Klarifikasi',
      'tindak:survei': 'Lanjut survei',
    },
  };
}
