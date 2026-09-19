/**
 * Misi acara 04 - Peti yang Tak Sampai (dermaga pelabuhan; latar misi 6 dipakai utuh).
 * Mekanik: COCOKKAN TIGA DOKUMEN, lalu pilih tindak lanjut.
 * - Tata letak misi 6 yang sudah teruji: daftar kiriman (di truk), foto peti (dinding gudang),
 *   bukti terima (meja gudang), papan "Catatan petugas", empat papan aksi seragam di zona kuning.
 * - 21 peti yang diterima berdiri di tengah sebagai latar (tanpa titik ketuk): 7 kolom x 3 tingkat,
 *   nomor naik dari bawah ke atas per kolom. Kemasan rusak digambar sesuai tabel foto:
 *   #3 penyok, #9 basah, #15 terbuka, #20 penyok & basah. Pemain jeli bisa menghitungnya dari sini.
 * - Papan foto memuat ENAM foto (sesuai tabel), bukan tiga seperti misi 6.
 * - Sopir truk melirik jam di depan bak truknya (properti latar, bukan tokoh pemandu).
 * - Label papan aksi = satu kata pendek. Jarak antar papan 130 dan pil label = teks + 44, jadi
 *   label dua kata ("Catat lengkap" +-170 lebar) pasti bertumpuk; batas aman +-8 huruf Latin.
 *   Kalimat lengkap tetap tampil di daftar HTML dan di pengumuman setelah memilih.
 */

import type { ArtRef, SceneObjectSpec, SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rect, rrect, shadow } from '../../art/kit';
import { personArt } from '../../art/characters';
import { IKON as IKON_M06, latar, lembarTerima, papanAksi, papanKiriman, peti, polaroid } from '../m06-pelabuhan';

// ------------------------------------------------------------------ peti (properti latar)

/** Peti misi 6 (50 x 44) diperkecil supaya 7 kolom muat di antara truk dan gudang. */
const SKALA_PETI = 0.68;
const KOLOM = 7;
const TINGKAT = 3;
const PETI_W = Math.ceil((4 + KOLOM * 52 + 4) * SKALA_PETI);
const PETI_H = Math.ceil((26 + TINGKAT * 44 + 8) * SKALA_PETI);

const KEMASAN_RUSAK: Record<number, NonNullable<Parameters<typeof peti>[3]>> = {
  3: { remuk: 'kanan' },
  9: { basah: true },
  15: { terbuka: true },
  20: { remuk: 'kiri', basah: true },
};

function tumpukanPeti(): string {
  // Nomor per kolom dari bawah ke atas: #1 #2 #3 | #4 #5 #6 | ... | #19 #20 #21, sehingga #3, #9,
  // #15 ada di tingkat atas (ruang 26 untuk tutup #15 yang terbuka) dan #20 di tengah kolom akhir.
  // Tingkat bawah digambar lebih dulu supaya tetesan air dari peti di atasnya tetap terlihat.
  let isi = '';
  for (let t = 0; t < TINGKAT; t += 1) {
    for (let k = 0; k < KOLOM; k += 1) {
      const n = k * TINGKAT + t + 1;
      isi += peti(4 + k * 52, 26 + (TINGKAT - 1 - t) * 44, String(n), KEMASAN_RUSAK[n] ?? {});
    }
  }
  const lebar = 4 + KOLOM * 52;
  return `<g transform="scale(${SKALA_PETI})">
    ${shadow(lebar / 2, 27 + TINGKAT * 44, lebar / 2 - 2, 5, 0.14)}
    ${isi}
  </g>`;
}

// ------------------------------------------------------------------ sopir (properti latar)

/** Sopir truk: lengan terangkat, jam tangan di pergelangan, alis cemas (ingin cepat berangkat). */
function sopir(): ArtRef {
  const o = personArt({ key: 'a04-sopir', shirt: P.oranye, pants: '#4b5563', pose: 'lambai', mood: 'cemas' });
  const jam = `
    ${rrect(64, 55.5, 13, 5.5, 2, P.tinta)}
    ${circle(70.5, 58.2, 4.4, P.putih, INK_TIPIS)}
    ${line('M70.5 55.8 V58.2 H72.6', P.tinta, 1.3)}`;
  // viewBox tetap 80 x 152; ukuran tampil diperkecil (seperti nasabah di misi 1) supaya
  // sebanding dengan truk latar (skala 0.62).
  return { ...o, svg: o.svg.replace('</svg>', `${jam}</svg>`), w: 48, h: 91 };
}

// ------------------------------------------------------------------ dokumen

/** Papan gabus 104 x 76 berisi enam foto penerimaan (foto misi 6 diperkecil, dua baris). */
function fotoEnam(): string {
  const tepi = '#6f4c2e';
  const tumpuk = rect(5, 13, 8, 8, P.kayu) + rect(13, 13, 8, 8, P.kayuTua) + rect(9, 6, 8, 7, P.kayu);
  const penyokKanan = path('M7 10 H14 C15 13 17 14 19 14.5 V22 H7 Z', P.kayu) + line('M14 10.5 C15 13 17 14 19 14.5', tepi, 1.4);
  const basah = rect(7, 10, 12, 12, P.kayu) + rect(7, 16, 12, 6, P.air, 'opacity="0.8"') + circle(10, 8, 1.3, P.air) + circle(15, 7, 1.3, P.air);
  const terbuka = rect(7, 12, 12, 10, P.kayu) + path('M7 12 L5 5 L12 4 L13 12 Z', P.kayuTua) + rect(8, 12, 6, 2, '#4a3a2c');
  const penyokKiri = path('M12 10 H19 V22 H7 V14.5 C9 14 11 13 12 10 Z', P.kayu) + line('M12 10.5 C11 13 9 14 7 14.5', tepi, 1.4);
  const basahBawah = rect(7, 10, 12, 12, P.kayu) + rect(7, 18, 12, 4, P.air, 'opacity="0.8"') + rect(5, 21.5, 16, 1.5, P.air, 'opacity="0.8"');
  const foto = (x: number, y: number, sudut: number, isi: string): string =>
    `<g transform="translate(${x} ${y}) scale(0.74)">${polaroid(0, 0, sudut, isi)}</g>`;
  return `
    ${shadow(52, 73, 46, 3)}
    ${rrect(4, 4, 96, 66, 6, '#d9b88a', INK)}
    ${rrect(9, 9, 86, 56, 4, '#c9a06c')}
    ${foto(16, 13, -5, tumpuk)}${foto(42.5, 12, 3, penyokKanan)}${foto(69, 13, -3, basah)}
    ${foto(16, 39.5, 4, terbuka)}${foto(42.5, 39, -4, penyokKiri)}${foto(69, 39.5, 3, basahBawah)}`;
}

// ------------------------------------------------------------------ papan aksi (tindak lanjut)

/** Ikon digambar di papan misi 6 (84 x 84, bidang krem 76 x 56 mulai (4, 4)). */
const IKON = {
  // Papan klip + kamera dan koin + kantong uang dipakai ulang dari misi 6.
  catat: IKON_M06.catat,
  semua: IKON_M06.bayar,
  // Lembar bergaris dengan coretan tanda tangan + pena.
  ttd: `
    ${rrect(13, 10, 36, 44, 4, P.putih, INK_TIPIS)}
    ${rrect(19, 16, 18, 6, 2, P.teal)}
    ${line('M19 28 H43 M19 34 H39', P.besiMuda, 2.5)}
    ${line('M19 47 H43', P.tintaLembut, 1.6)}
    ${line('M20 45 c2 -7 5 -8 6 -2 c1 4 3 3 5 -1 c2 -4 4 -3 5 1 c1 2 3 2 5 0', P.biru, 2.2)}
    <g transform="translate(44 45) rotate(38)">
      ${path('M0 0 L-4.5 -9 L4.5 -9 Z', P.kuningPucat, INK_TIPIS)}
      ${rrect(-4.5, -33, 9, 24, 2, P.biru, INK_TIPIS)}
      ${rect(-4.5, -14, 9, 3, P.besiTua)}
      ${rrect(-4.5, -38, 9, 7, 2.5, P.besiTua, INK_TIPIS)}
    </g>`,
  // Papan klip tanpa kamera: hanya hitungan peti (tanda kurang), tanpa angka.
  separuh: `
    ${rrect(24, 9, 36, 46, 4, P.kayu, INK_TIPIS)}
    ${rrect(29, 16, 26, 34, 2, P.putih)}
    ${rrect(35, 6, 14, 7, 2, P.besi, INK_TIPIS)}
    ${line('M33 23 H51 M33 29 H46', P.tintaLembut, 2)}
    ${rrect(32, 35, 12, 11, 2, P.kayu, INK_TIPIS)}${line('M32 40.5 H44', P.kayuTua, 1.6)}
    ${line('M47 40.5 H52', P.tinta, 2.4)}`,
};

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  const Y_AKSI = 400;
  const aksi = (refId: keyof typeof IKON, x: number, label: string): SceneObjectSpec => ({
    id: `aksi-${refId}`, role: 'option', stepId: 'tindak', refId, fx: 'choose',
    x, y: Y_AKSI, art: art(`a04-aksi-${refId}`, 84, 84, papanAksi(IKON[refId])), label, depth: 20,
    hit: { w: 96, h: 90 },
  });
  return {
    missionId: 'a04-peti-kurang',
    acakPosisi: ['tindak'],
    // Latar misi 6 apa adanya: kunci tekstur sama, SVG identik (dijaga scenes.test.ts).
    background: art('m06-latar', 640, 480, latar()),
    props: [
      // Di depan bak truk, di antara kabin dan papan klip; kaki berhenti tepat di atas label "Daftar kiriman".
      { id: 'sopir', x: 112, y: 262, art: sopir(), motion: 'bob', depth: 7 },
      { id: 'peti', x: 376, y: 260, art: art('a04-peti', PETI_W, PETI_H, tumpukanPeti()), depth: 8 },
    ],
    hero: { x: 598, y: 478 },
    walk: { minX: 70, maxX: 600, minY: 458, maxY: 478 },
    boards: [
      {
        // Lebar 236 (misi 6: 220): nilai dua digit ("17 peti") butuh ruang di samping "Kemasan baik".
        id: 'catatan', x: 122, y: 14, w: 236, title: 'Catatan petugas',
        lines: [
          { stepId: 'selisih', label: 'Belum tiba' },
          { stepId: 'baik', label: 'Kemasan baik' },
        ],
      },
    ],
    objects: [
      {
        id: 'dok-kiriman', role: 'doc', refId: 'pengiriman',
        x: 186, y: 256, art: art('a04-kiriman', 70, 94, papanKiriman()), label: 'Daftar kiriman', depth: 20,
      },
      {
        // Kolom kanan rapat (foto - lembar - papan aksi): label dinaikkan 6 seperti misi 6.
        id: 'dok-foto', role: 'doc', refId: 'foto',
        x: 562, y: 144, art: art('a04-foto', 104, 76, fotoEnam()), label: 'Foto peti', depth: 20,
        labelDy: -6,
      },
      {
        id: 'dok-terima', role: 'doc', refId: 'penerimaan',
        x: 562, y: 270, art: art('a04-terima', 72, 92, lembarTerima()), label: 'Bukti terima', depth: 20,
        labelDy: -6,
      },
      // x di sini hanya daftar slot: engine mengacaknya secara deterministik (acakPosisi, benih id misi),
      // jadi urutan DAFTAR ini yang menentukan papan mana menempati slot mana. Urutan dipilih supaya
      // susunan papan tidak mengulang susunan misi 6 (papan & dua ikonnya dipakai ulang dari sana):
      // bila daftar ini diubah, periksa ulang hasil acakSlot() untuk kedua misi.
      aksi('ttd', 108, 'Teken'),
      aksi('catat', 238, 'Lengkapi'),
      aksi('separuh', 368, 'Selisih'),
      aksi('semua', 498, 'Klaim'),
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a04-peti-kurang', buat };
