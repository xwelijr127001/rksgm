/**
 * Misi acara 03 - Empat Foto, Apa Tugasnya? (bengkel mitra; latar m02 dipakai utuh).
 * Mekanik: STIKER KEGUNAAN. Empat foto polaroid tergantung di tali jemuran foto. Ketuk satu
 * foto, lalu pilih kegunaannya di daftar bawah adegan; stiker kategori menempel di atas foto.
 *
 * Netral: keempat polaroid SERAGAM (bingkai, ukuran, jepitan, letak huruf); yang beda hanya isi
 * fotonya. Mobil di area kerja kuning hanya hiasan cerita (prop), bukan pilihan. Tidak ada tanda
 * benar/salah di gambar.
 *
 * Arah mobil: cerita menyebut bemper belakang KANAN, jadi mobil menghadap KANAN (sisi kanan
 * terlihat), kebalikan m02 yang menghadap kiri untuk kerusakan depan kiri.
 */

import type { SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rect, rrect, text } from '../../art/kit';
import { carSide, dentPatch } from '../../art/vehicles';
import { latar as latarBengkel } from '../m02-bengkel';

const WARNA_MOBIL = P.teal;
const KULIT = '#e0ac7e';
const RAMBUT = '#2b2118';

/** Mobil nasabah menghadap KANAN dengan penyok di bemper belakang kanan, 300 x 130 (belakang di kiri). */
function mobilPenyok(): string {
  return `<g transform="translate(300 0) scale(-1 1)">
    ${carSide(WARNA_MOBIL)}
    <g transform="translate(238 62) scale(0.8)">${dentPatch()}</g>
  </g>`;
}

/** Tali foto melintang di dinding, 640 x 24. Titik jepit (y 9) tepat di tengah tiap polaroid. */
function tali(): string {
  return `
    ${line('M0 5 Q46 12 92 9 Q168 18 244 9 Q320 18 396 9 Q472 18 548 9 Q594 12 640 5', '#000', 4, 'opacity="0.08" transform="translate(0 3)"')}
    ${line('M0 5 Q46 12 92 9 Q168 18 244 9 Q320 18 396 9 Q472 18 548 9 Q594 12 640 5', P.cokelat, 2.5)}`;
}

// ------------------------------------------------------------------ isi foto (jendela 68 x 52 di x 12, y 22)

/** Foto A: seluruh mobil dari samping. */
function fotoSeluruh(): string {
  return `
    ${rect(12, 22, 68, 52, '#f1e6cf')}
    ${rect(12, 58, 68, 16, P.beton)}
    ${line('M12 58 H80', P.betonTua, 1.5)}
    <g transform="translate(14.5 36) scale(0.21)">${mobilPenyok()}</g>`;
}

/** Foto B: bemper belakang kanan dari dekat (potongan mobil yang sama, diperbesar). */
function fotoDetail(): string {
  return `
    ${rect(12, 22, 68, 52, '#f1e6cf')}
    ${rect(12, 62, 68, 12, P.beton)}
    <g transform="translate(12 -31.8) scale(0.944)">${mobilPenyok()}</g>`;
}

/** Foto C: plat nomor dan pelat nomor rangka (huruf timbul digambar sebagai garis). */
function fotoPlat(): string {
  return `
    ${rect(12, 22, 68, 52, '#dfe6e2')}
    ${rrect(15, 26, 62, 23, 4, P.tinta)}
    ${rrect(17.5, 28.5, 57, 18, 2.5, '#f5f5f0')}
    ${text(46, 42, 'B 1703 RK', 11, P.tinta, 900)}
    ${rrect(17, 54, 58, 15, 3, P.besiMuda, INK_TIPIS)}
    ${circle(21.5, 61.5, 1.5, P.besiTua)}${circle(70.5, 61.5, 1.5, P.besiTua)}
    ${line('M27 59 H65 M27 64 H55', P.besiTua, 2)}`;
}

/** Foto D: selfie nasabah di depan bengkel (wajah dekat, papan nama di belakang). */
function fotoSelfie(): string {
  return `
    ${rect(12, 22, 68, 52, '#f4ead3')}
    ${rect(12, 66, 68, 8, P.beton)}
    ${rrect(44, 26, 34, 12, 3, P.hijau)}
    ${line('M49 32 H73', P.krem, 2.5)}
    ${rect(14, 30, 16, 36, P.langit)}${rect(13, 27, 18, 4, P.besi)}
    ${line('M60 68 L80 76', P.tinta, 9)}${line('M60 68 L80 76', KULIT, 5.5)}
    ${path('M22 76 C23 60 33 55 43 55 C53 55 63 60 64 76 Z', P.biru, INK_TIPIS)}
    ${rrect(39, 49, 8, 9, 3, KULIT, INK_TIPIS)}
    ${circle(43, 42, 11, KULIT, INK_TIPIS)}
    ${path('M32 41 C31 30 38 28 43 28 C49 28 55 30 54 41 C50 35 37 35 32 41 Z', RAMBUT)}
    ${circle(39, 43, 1.5, P.tinta)}${circle(47, 43, 1.5, P.tinta)}
    ${line('M38.5 47.5 q4.5 4 9 0', P.tinta, 1.6)}`;
}

/**
 * Polaroid seragam 92 x 100 dengan jepitan kayu. `isi` digambar di jendela foto 68 x 52
 * (x 12, y 22) dan dipotong rapi; `huruf` di tepi bawah bingkai (netral di semua bahasa).
 */
function polaroid(huruf: string, isi: string): string {
  const klip = `a03-klip-${huruf.toLowerCase()}`;
  return `
    ${rrect(8, 12, 80, 88, 4, P.tinta, 'opacity="0.14"')}
    ${rrect(6, 10, 80, 88, 4, P.putih, INK)}
    <clipPath id="${klip}"><rect x="12" y="22" width="68" height="52" rx="2"/></clipPath>
    <g clip-path="url(#${klip})">${isi}</g>
    ${rrect(12, 22, 68, 52, 2, 'none', INK_TIPIS)}
    ${text(46, 92, huruf, 15, P.tintaLembut, 900)}
    ${rrect(40, 0, 12, 20, 3, P.kayu, INK_TIPIS)}
    ${line('M40 9 H52', P.besi, 2)}`;
}

// ------------------------------------------------------------------ adegan

function sceneTugasFoto(): SceneSpec {
  const bg = art('m02-latar', 640, 480, latarBengkel());
  // Polaroid: pusat y 190 (atas 140, bawah 240); label pil di bawahnya (pusat 258, tepi bawah 275).
  // Jarak antar foto 152: stiker kategori (maks 13 huruf) dan pil label tidak saling menimpa.
  const FOTO_Y = 190;
  const LABEL_BAWAH = FOTO_Y + 50 + 18 + 17;
  const foto = [
    { id: 'foto-a', x: 92, huruf: 'A', isi: fotoSeluruh() },
    { id: 'foto-b', x: 244, huruf: 'B', isi: fotoDetail() },
    { id: 'foto-c', x: 396, huruf: 'C', isi: fotoPlat() },
    { id: 'foto-d', x: 548, huruf: 'D', isi: fotoSelfie() },
  ];
  return {
    missionId: 'a03-tugas-foto',
    background: bg,
    props: [
      // Tali: titik jepit di y dunia 147 = jepitan polaroid (y lokal 7).
      { id: 'tali', x: 320, y: 150, art: art('a03-tali', 640, 24, tali()), depth: 6 },
      // Mobil di area kerja kuning (posisi sama dengan m02; atap y 306, di bawah pil label foto).
      { id: 'mobil', x: 330, y: 345, art: art('a03-mobil', 300, 130, mobilPenyok()), depth: 8 },
    ],
    hero: { x: 604, y: 478 },
    walk: { minX: 80, maxX: 604, minY: 462, maxY: 478 },
    objects: foto.map((f) => ({
      id: f.id,
      role: 'item' as const,
      stepId: 'fungsi',
      refId: f.id,
      fx: 'tag' as const,
      x: f.x,
      y: FOTO_Y,
      art: art(`a03-${f.id}`, 92, 100, polaroid(f.huruf, f.isi)),
      label: `Foto ${f.huruf}`,
      // Area sentuh mencakup stiker di atas dan pil label di bawah (pola m10); lebar 120 < jarak 152.
      hit: { w: 120, h: 2 * (LABEL_BAWAH - FOTO_Y) },
      depth: 20,
    })),
    // Urutan entri = urutan kategori di shared/acara/a03.ts (bebas), BUKAN urutan foto A - D.
    bucketShort: {
      'fungsi:identitas': 'Identitas',
      'fungsi:tidak': 'Tak membantu',
      'fungsi:kondisi': 'Kondisi mobil',
      'fungsi:titik': 'Titik bentur',
    },
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a03-tugas-foto',
  buat: sceneTugasFoto,
};
