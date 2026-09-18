/**
 * Misi 6 - Paket Datang Penyok (dermaga pelabuhan).
 * Mekanik: BANDINGKAN DOKUMEN.
 * - Tiga dokumen di dermaga membuka tabel kasus: daftar kiriman (di truk),
 *   bukti terima (di meja gudang), foto peti (di dinding gudang).
 * - Delapan peti yang diterima berdiri di tengah sebagai latar (tanpa titik ketuk):
 *   peti #4 penyok & terbuka, peti #7 basah & penyok (sesuai tabel foto).
 * - Dua jawaban angka digemakan di papan "Catatan petugas" (bukan penilaian).
 * - Tindak lanjut: empat papan aksi dengan bentuk, ukuran & warna papan yang sama.
 *   Label = satu kata kerja yang sama panjang supaya tidak ada yang lebih menonjol;
 *   kalimat lengkap tetap tampil di daftar HTML dan di pengumuman setelah memilih.
 */

import type { SceneObjectSpec, SceneSpec } from '../types';
import { INK, INK_TIPIS, P, art, circle, cloud, line, path, rect, rrect, shadow, text } from '../art/kit';

const KULIT = '#e0ac7e';

// ------------------------------------------------------------------ latar

function roda(cx: number, cy: number, r: number): string {
  return circle(cx, cy, r, '#3b4640') + circle(cx, cy, r * 0.45, '#b8c2bc');
}

/** Truk kargo datar (tanpa garis tepi), menghadap kiri, ukuran asli 340 x 170. */
function truk(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${shadow(176, 162, 164, 9, 0.12)}
    ${rrect(110, 28, 222, 112, 8, '#eef1ee')}
    ${[150, 190, 230, 270].map((v) => rect(v, 34, 4, 100, '#d5ddd8')).join('')}
    ${rect(306, 30, 24, 108, '#e2e8e4')}
    ${rect(316, 70, 4, 22, '#b8c2bc')}
    ${rect(24, 124, 306, 18, '#5e6b64')}
    ${path('M20 142 L20 84 C20 70 30 62 44 62 L80 62 L104 90 L104 142 Z', '#6d9cc9')}
    ${path('M40 70 L76 70 L94 92 L40 92 Z', P.kaca)}
    ${rrect(12, 116, 14, 10, 4, '#fff1b8')}
    ${roda(58, 146, 18)}${roda(176, 146, 18)}${roda(292, 146, 18)}
  </g>`;
}

function kapal(): string {
  const warna = ['#e7a672', '#79aba7', '#f0cf7a', '#86a9d0', '#e7a672', '#79aba7'];
  let peti = '';
  for (let i = 0; i < 6; i += 1) {
    peti += rect(248 + i * 25, 160, 23, 12, warna[i]!);
    if (i > 0 && i < 5) peti += rect(248 + i * 25, 147, 23, 12, warna[(i + 2) % warna.length]!);
  }
  return `
    ${path('M232 172 L440 172 L428 208 L248 208 Z', '#5f8cb8')}
    ${rect(240, 198, 190, 5, '#48729c', 'opacity="0.6"')}
    ${rect(236, 172, 204, 4, '#eef2f2', 'opacity="0.8"')}
    ${peti}
    ${rect(402, 124, 30, 48, '#f4f0e8')}
    ${rect(398, 118, 38, 7, '#e2dccf')}
    ${rect(407, 132, 20, 7, P.kaca)}
    ${rect(412, 104, 12, 14, '#dc9468')}`;
}

function derek(): string {
  const k = '#efc86a';
  const kt = '#d8ad4c';
  return `
    ${rect(250, 48, 8, 168, k)}${rect(300, 48, 8, 168, k)}
    ${line('M254 96 L304 150 M304 96 L254 150', kt, 3)}
    ${rect(236, 40, 178, 10, k)}
    ${rect(294, 24, 18, 18, kt)}
    ${rect(346, 50, 18, 8, P.besi)}
    ${line('M355 58 V100', P.besiTua, 2)}
    ${rrect(338, 100, 34, 14, 2, '#79aba7')}
    ${rect(244, 212, 20, 6, kt)}${rect(294, 212, 20, 6, kt)}`;
}

function gudang(): string {
  let pintu = '';
  for (let y = 160; y < 252; y += 11) pintu += rect(450, y, 64, 3, '#bcae95');
  return `
    ${rect(440, 102, 200, 154, '#eadfc8')}
    ${path('M428 106 L540 76 L652 106 Z', '#a9b8bf')}
    ${rect(428, 102, 224, 9, '#93a5ad')}
    ${rect(446, 146, 72, 6, '#b7a88e')}
    ${rect(450, 152, 64, 104, '#cdc1aa')}
    ${pintu}
    ${rrect(452, 120, 60, 20, 4, P.krem)}
    ${text(482, 135, 'GUDANG', 11, P.hijau)}
    ${rect(440, 248, 200, 8, '#d9ccb2')}`;
}

function latar(): string {
  return `
    ${rect(0, 0, 640, 150, P.langit)}
    ${rect(0, 0, 640, 56, P.langitAtas, 'opacity="0.5"')}
    ${cloud(330, 30, 0.6)}${cloud(470, 58, 0.5)}
    <!-- laut -->
    ${rect(0, 126, 640, 92, '#93c8e6')}
    ${rect(0, 126, 640, 6, '#bfe0f2')}
    ${line('M18 150 q10 -5 20 0 M84 168 q10 -5 20 0 M150 146 q10 -5 20 0 M40 192 q10 -5 20 0 M128 186 q10 -5 20 0 M200 160 q10 -5 20 0', P.putih, 2.4, 'opacity="0.7"')}
    ${kapal()}
    ${derek()}
    <!-- tiang papan catatan (papan digambar engine) -->
    ${rect(34, 130, 8, 98, P.kayuTua)}${rect(202, 130, 8, 98, P.kayuTua)}
    <!-- lantai dermaga -->
    ${rect(0, 214, 640, 266, P.beton)}
    ${rect(0, 214, 440, 7, P.betonTua)}
    ${line('M0 229 H440', P.kuning, 4, 'opacity="0.55"')}
    ${line('M0 344 H640', P.betonTua, 2, 'opacity="0.45"')}
    ${[100, 250, 400, 550].map((x) => line(`M${x} 236 L${x + (x - 320) * 0.45} 480`, P.betonTua, 2, 'opacity="0.4"')).join('')}
    ${gudang()}
    <!-- meja penerimaan -->
    ${shadow(562, 344, 50, 5, 0.12)}
    ${rect(522, 306, 8, 38, P.kayuTua)}${rect(594, 306, 8, 38, P.kayuTua)}
    ${rrect(512, 298, 100, 11, 4, P.kayu)}
    <!-- truk pengantar -->
    ${truk(8, 196, 0.62)}
    <!-- zona tindak lanjut -->
    ${path('M46 436 L556 436 L572 456 L30 456 Z', P.kuning, 'opacity="0.26"')}
    ${line('M46 436 L556 436 M30 456 L572 456', P.kuningTua, 3, 'opacity="0.45"')}`;
}

// ------------------------------------------------------------------ peti (properti latar)

/** Bentuk peti 50 x 44: utuh, atau sudut atas remuk (kanan / kiri). */
const BENTUK_PETI = {
  utuh: 'M4 0 H46 Q50 0 50 4 V40 Q50 44 46 44 H4 Q0 44 0 40 V4 Q0 0 4 0 Z',
  remukKanan: 'M4 0 H30 C33 8 40 13 50 15 V40 Q50 44 46 44 H4 Q0 44 0 40 V4 Q0 0 4 0 Z',
  remukKiri: 'M20 0 H46 Q50 0 50 4 V40 Q50 44 46 44 H4 Q0 44 0 40 V15 C10 13 17 8 20 0 Z',
};

/** Satu peti 50 x 44 tanpa garis tepi tinta (latar), nomor dicat di sisi. */
function peti(x: number, y: number, nomor: string, o: { remuk?: 'kanan' | 'kiri'; terbuka?: boolean; basah?: boolean } = {}): string {
  const d = o.remuk === 'kanan' ? BENTUK_PETI.remukKanan : o.remuk === 'kiri' ? BENTUK_PETI.remukKiri : BENTUK_PETI.utuh;
  const lipat = o.remuk === 'kanan'
    ? line('M30 1 C33 9 40 14 49 16', '#6f4c2e', 3) + line('M33 18 l4 6 M40 18 l3 6 M26 8 l5 3', '#6f4c2e', 2)
    : o.remuk === 'kiri'
      ? line('M20 1 C17 9 10 14 1 16', '#6f4c2e', 3) + line('M17 18 l-4 6 M10 18 l-3 6 M24 8 l-5 3', '#6f4c2e', 2)
      : '';
  return `<g transform="translate(${x} ${y})">
    ${o.terbuka ? path('M1 1 L-6 -17 L20 -24 L25 1 Z', P.kayu) + line('M-3 -9 L21 -15', P.kayuTua, 2.5) : ''}
    ${path(d, P.kayuTua)}
    <g transform="translate(25 22) scale(0.9) translate(-25 -22)">${path(d, P.kayu)}</g>
    ${line('M3 13 H47 M3 32 H47', P.kayuTua, 3)}
    ${line('M7 5 L43 39', P.kayuTua, 2, 'opacity="0.45"')}
    ${o.terbuka ? path('M2.5 2.5 L25 2.5 L23 10 L4 10 Z', '#3f3226', 'opacity="0.85"') : ''}
    ${lipat}
    ${rrect(14, 16, 22, 16, 3, P.krem)}
    ${text(25, 29, nomor, 12, P.tinta)}
    ${o.basah ? path('M3 27 C12 23 20 31 30 27 C38 23 44 29 47 27 L47 41 L3 41 Z', P.air, 'opacity="0.65"') + circle(12, 47, 2, P.air) + circle(26, 49, 1.6, P.air) + circle(38, 47, 1.8, P.air) : ''}
  </g>`;
}

function tumpukanPeti(): string {
  // Baris atas #1-#4, baris bawah #5-#8. Ruang 26 di atas untuk tutup peti #4 yang terbuka.
  const atas = [1, 2, 3, 4].map((n, i) => peti(4 + i * 52, 26, String(n), n === 4 ? { remuk: 'kanan', terbuka: true } : {})).join('');
  const bawah = [5, 6, 7, 8].map((n, i) => peti(4 + i * 52, 70, String(n), n === 7 ? { remuk: 'kiri', basah: true } : {})).join('');
  return `${shadow(106, 115, 104, 5, 0.14)}${bawah}${atas}`;
}

// ------------------------------------------------------------------ dokumen

/** Papan klip daftar kiriman 70 x 94 (ikon kapal kecil = dokumen pengiriman). */
function papanKiriman(): string {
  return `
    ${shadow(35, 90, 28, 4)}
    ${rrect(5, 8, 60, 80, 7, P.kayu, INK)}
    ${rrect(11, 17, 48, 64, 3, P.putih)}
    ${rrect(22, 3, 26, 13, 4, P.besi, INK_TIPIS)}
    ${rect(21, 26, 8, 7, P.oranye)}${rect(30, 26, 8, 7, P.teal)}${rect(39, 28, 6, 5, P.kuningTua)}
    ${path('M16 33 L54 33 L49 42 L21 42 Z', P.biru)}
    ${line('M17 52 H53 M17 61 H49 M17 70 H42', P.tintaLembut, 3)}`;
}

/** Lembar bukti terima 72 x 92 dengan ikon peti & cap bulat. */
function lembarTerima(): string {
  return `<g transform="rotate(-4 36 46)">
    ${shadow(36, 88, 30, 4)}
    ${rrect(5, 4, 62, 80, 6, P.putih, INK)}
    ${path('M51 4 L67 20 L51 20 Z', P.kremTua, INK_TIPIS)}
    ${rrect(13, 13, 32, 10, 3, P.teal)}
    ${rrect(13, 31, 21, 17, 2, P.kayu, INK_TIPIS)}${line('M13 38 H34', P.kayuTua, 2)}
    ${line('M40 34 H58 M40 43 H54', P.besiMuda, 3)}
    ${line('M13 58 H56 M13 67 H40', P.besiMuda, 3)}
    ${circle(52, 70, 9, 'none', `stroke="${P.ungu}" stroke-width="2.5" opacity="0.8"`)}
    ${circle(52, 70, 4.5, 'none', `stroke="${P.ungu}" stroke-width="1.8" opacity="0.8"`)}
  </g>`;
}

function polaroid(x: number, y: number, sudut: number, isi: string): string {
  return `<g transform="translate(${x} ${y}) rotate(${sudut} 13 17)">
    ${rrect(0, 0, 26, 32, 2, P.putih, INK_TIPIS)}
    ${rect(3, 3, 20, 20, P.langit)}
    ${rect(3, 17, 20, 6, P.beton)}
    ${isi}
    ${circle(13, 1, 2.8, P.kuning, `stroke="${P.tinta}" stroke-width="1.2"`)}
  </g>`;
}

/** Papan gabus berisi tiga foto penerimaan, 104 x 76. */
function fotoPeti(): string {
  const tumpuk = rect(5, 13, 8, 8, P.kayu) + rect(13, 13, 8, 8, P.kayuTua) + rect(9, 6, 8, 7, P.kayu);
  const terbuka = rect(7, 12, 12, 10, P.kayu) + path('M7 12 L5 5 L12 4 L13 12 Z', P.kayuTua) + rect(8, 12, 6, 2, '#4a3a2c');
  const basah = rect(7, 10, 12, 12, P.kayu) + rect(7, 16, 12, 6, P.air, 'opacity="0.8"') + circle(10, 8, 1.3, P.air) + circle(15, 7, 1.3, P.air);
  return `
    ${shadow(52, 73, 46, 3)}
    ${rrect(4, 4, 96, 66, 6, '#d9b88a', INK)}
    ${rrect(9, 9, 86, 56, 4, '#c9a06c')}
    ${polaroid(12, 20, -6, tumpuk)}
    ${polaroid(39, 17, 3, terbuka)}
    ${polaroid(66, 21, -3, basah)}`;
}

// ------------------------------------------------------------------ papan aksi (tindak lanjut)

/** Papan aksi berdiri 84 x 84. Papan, tiang, dan ukuran SAMA untuk keempat pilihan. */
function papanAksi(ikon: string): string {
  return `
    ${shadow(42, 80, 24, 4)}
    ${rrect(20, 74, 44, 7, 3.5, P.besiTua)}
    ${rrect(38, 56, 8, 20, 3, P.besi, INK_TIPIS)}
    ${rrect(4, 4, 76, 56, 10, P.krem, INK)}
    ${ikon}`;
}

const petiKecil = `${rrect(11, 24, 30, 27, 3, P.kayu, INK_TIPIS)}${line('M12 33 H40 M12 43 H40', P.kayuTua, 2.5)}`;
const manset = rrect(52, 45, 16, 9, 2, P.biru, INK_TIPIS);
/**
 * Tangan (Tolak & Terima) diperkecil & digeser ke kiri-bawah dengan transform yang SAMA,
 * supaya pojok kanan atas papan bebas untuk titik ketuk / lencana (tidak menutupi jari).
 */
const tangan = (isi: string): string => `<g transform="translate(2 7) scale(0.9)">${isi}</g>`;

const IKON = {
  catat: `
    ${rrect(12, 12, 28, 40, 4, P.kayu, INK_TIPIS)}
    ${rrect(16, 18, 20, 29, 2, P.putih)}
    ${rrect(20, 9, 12, 7, 2, P.besi, INK_TIPIS)}
    ${line('M19 25 H33 M19 31 H33 M19 37 H28', P.tintaLembut, 2)}
    ${rrect(46, 24, 11, 7, 2, P.besi, INK_TIPIS)}
    ${rrect(40, 28, 32, 23, 5, P.besi, INK_TIPIS)}
    ${circle(56, 39.5, 7.5, P.kaca, INK_TIPIS)}
    ${circle(56, 39.5, 3, P.biru)}
    ${circle(67, 32, 1.8, P.kuning)}`,
  bayar: `
    ${rrect(11, 44, 22, 7, 3.5, P.kuning, INK_TIPIS)}
    ${rrect(11, 37, 22, 7, 3.5, P.kuning, INK_TIPIS)}
    ${rrect(13, 30, 22, 7, 3.5, P.kuning, INK_TIPIS)}
    ${path('M45 12 L61 12 L58 19 C69 23 73 32 71 41 C69 49 62 52 53 52 C44 52 37 49 35 41 C33 32 37 23 48 19 Z', P.kuningPucat, INK_TIPIS)}
    ${line('M47 18 H59', P.cokelat, 3)}
    ${text(53, 44, 'Rp', 12, P.cokelat, 900)}`,
  tolak: `
    ${petiKecil}
    ${tangan(`
      ${rrect(46, 18, 5, 16, 2.5, KULIT, INK_TIPIS)}
      ${rrect(51, 11, 5, 20, 2.5, KULIT, INK_TIPIS)}
      ${rrect(56.5, 10, 5, 21, 2.5, KULIT, INK_TIPIS)}
      ${rrect(62, 12, 5, 19, 2.5, KULIT, INK_TIPIS)}
      ${`<rect x="63" y="25" width="13" height="6" rx="3" fill="${KULIT}" ${INK_TIPIS} transform="rotate(-38 66 30)"/>`}
      ${rrect(46, 26, 22, 21, 7, KULIT, INK_TIPIS)}
      ${manset}`)}`,
  terima: `
    ${petiKecil}
    ${tangan(`
      ${rrect(48, 9, 10, 24, 5, KULIT, INK_TIPIS)}
      ${rrect(46, 25, 24, 22, 7, KULIT, INK_TIPIS)}
      ${line('M52 32 H66 M52 38 H66', P.tinta, 1.6, 'opacity="0.55"')}
      ${manset}`)}`,
};

// ------------------------------------------------------------------ adegan

export function scenePelabuhan(): SceneSpec {
  const bg = art('m06-latar', 640, 480, latar());
  const Y_AKSI = 400;
  const aksi = (id: string, refId: string, x: number, label: string, ikon: keyof typeof IKON): SceneObjectSpec => ({
    id, role: 'option', stepId: 'tindak', refId, fx: 'choose',
    x, y: Y_AKSI, art: art(`m06-aksi-${ikon}`, 84, 84, papanAksi(IKON[ikon])), label, depth: 20,
    hit: { w: 96, h: 90 },
  });
  return {
    missionId: 'm06-paket-penyok',
    acakPosisi: ['tindak'],
    background: bg,
    props: [
      { id: 'peti', x: 370, y: 255, art: art('m06-peti', 212, 120, tumpukanPeti()), depth: 8 },
    ],
    hero: { x: 598, y: 478 },
    walk: { minX: 70, maxX: 600, minY: 458, maxY: 478 },
    boards: [
      {
        id: 'catatan', x: 122, y: 14, w: 220, title: 'Catatan petugas',
        lines: [
          { stepId: 'selisih', label: 'Selisih peti' },
          { stepId: 'rusak', label: 'Kemasan rusak' },
        ],
      },
    ],
    objects: [
      {
        id: 'dok-kiriman', role: 'doc', refId: 'pengiriman',
        x: 186, y: 256, art: art('m06-kiriman', 70, 94, papanKiriman()), label: 'Daftar kiriman', depth: 20,
      },
      {
        // Kolom kanan rapat (Raki - foto - lembar - papan Terima): label foto & lembar
        // dinaikkan 6 dan lembar naik 2, supaya ada celah ~7 antara tiap label dan
        // titik ketuk di bawahnya (juga saat titik berdenyut).
        id: 'dok-foto', role: 'doc', refId: 'foto',
        x: 562, y: 144, art: art('m06-foto', 104, 76, fotoPeti()), label: 'Foto peti', depth: 20,
        labelDy: -6,
      },
      {
        id: 'dok-terima', role: 'doc', refId: 'penerimaan',
        x: 562, y: 270, art: art('m06-terima', 72, 92, lembarTerima()), label: 'Bukti terima', depth: 20,
        labelDy: -6,
      },
      aksi('aksi-catat', 'dokumentasi', 108, 'Catat', 'catat'),
      aksi('aksi-bayar', 'bayar-semua', 238, 'Bayar', 'bayar'),
      aksi('aksi-tolak', 'tolak', 368, 'Tolak', 'tolak'),
      aksi('aksi-terima', 'diam', 498, 'Terima', 'terima'),
    ],
  };
}
