/**
 * Misi acara 10 - Grand Mission: Banjir Susulan.
 * Tempat SAMA dengan misi 10 (latar `m10-latar` dipakai utuh), kasusnya lain.
 * Mekanik: EMPAT KASUS, DUA TAHAP. Ketuk kasus (mobil / alat berat / gudang /
 * kiriman barang), lalu pilih kategorinya di bawah adegan. Stiker tiap tahap
 * menumpuk di atas kasusnya (maks 2). Kartu tiap kasus berdiri di tanggul kering
 * dan bisa dibuka kapan saja.
 *
 * Netral: keempat kasus digambar setara (skala & tebal garis sama, sama-sama
 * tergenang, pelat identitas IDENTIK tanpa tulisan lewat `pelatId`). Tiga gambar
 * pertama adalah gambar misi 10 yang diperkecil; palet peti (Kasus D) baru.
 * Tidak ada tanda benar/salah.
 *
 * Tata letak: jarak antar kasus 154, jadi stiker (`bucketShort`) maks 13 huruf.
 * Area sentuh kasus mencakup pil label "Kasus X"; area kartu mencakup label
 * "Polis X" (pola misi 10). Jalan kering penuh oleh empat kartu + jalur petugas,
 * jadi karyawan yang melambai ("semua orang sudah aman") naik perahu karet kecil
 * di genangan belakang, bukan berdiri di jalan.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { INK_TIPIS, P, art, circle, line, path, rect, rrect, shadow } from '../../art/kit';
import { crate } from '../../art/props';
import { alatBerat, genangan, gudang, kartuBerdiri, latar, mobilOperasional, pelatId, wargaKecil } from '../m10-kota';

/** Skala gambar kasus terhadap misi 10 (empat kasus harus muat sejajar). */
const S = 0.74;

/** Gambar kasus berskala S. SVG berbeda dari misi 10, jadi kunci teksturnya baru (`a10-*`). */
function kecil(key: string, w: number, h: number, isi: string): ArtRef {
  return art(key, Math.round(w * S), Math.round(h * S), `<g transform="scale(${S})">${isi}</g>`);
}

/** Satu peti pada posisi (x, y) dengan skala 0,78 (62 x 55). */
function peti(x: number, y: number, basah: boolean): string {
  return `<g transform="translate(${x} ${y}) scale(0.78)">${crate({ basah })}</g>`;
}

/**
 * Kasus D: palet kiriman (lima peti, baris bawah basah) setengah tergenang, 190 x 112
 * sebelum diperkecil. Pelat label kiriman = `pelatId` yang sama dengan kasus lain.
 */
function paletKiriman(): string {
  return `
    ${shadow(95, 104, 86, 7, 0.12)}
    ${rect(16, 101, 18, 7, P.kayuTua)}${rect(86, 101, 18, 7, P.kayuTua)}${rect(156, 101, 18, 7, P.kayuTua)}
    ${rrect(6, 94, 178, 9, 3, P.kayuTua, INK_TIPIS)}
    ${line('M12 98.5 H178', P.kayu, 2, 'opacity="0.7"')}
    ${peti(8, 44, true)}${peti(66, 44, true)}${peti(124, 44, true)}
    ${peti(37, -1, false)}${peti(95, -1, false)}
    ${pelatId(81, 66)}
    ${genangan(190, 101)}`;
}

/** Perahu karet kecil dengan karyawan berpelampung yang melambai, 88 x 72 (hiasan, bukan pilihan). */
function perahuKaret(): string {
  const orang = wargaKecil('a10-penumpang', { shirt: P.hijauMuda, vest: true, pose: 'lambai', mood: 'senyum' }, 0.45);
  const isi = orang.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `
    <g transform="translate(28 0)">${isi}</g>
    ${path('M4 50 C4 43 10 42 18 43 L70 43 C80 42 86 45 84 53 C82 61 74 65 64 65 L22 65 C11 65 4 59 4 50 Z', P.kuning, INK_TIPIS)}
    ${line('M14 50 H72', P.putih, 3, 'opacity="0.45"')}
    ${line('M12 58 H76', P.kuningTua, 2.5, 'opacity="0.7"')}
    ${circle(24, 54, 2.2, P.besiTua)}${circle(44, 54, 2.2, P.besiTua)}${circle(64, 54, 2.2, P.besiTua)}
    <ellipse cx="44" cy="66" rx="42" ry="5" fill="${P.air}" opacity="0.55"/>
    ${line('M6 65 q8 -4 16 0 t16 0 t16 0 t16 0', P.putih, 2.2, 'opacity="0.85"')}`;
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a10-banjir-susulan',
  buat: (): SceneSpec => {
    const bg = art('m10-latar', 640, 480, latar());
    // Dasar keempat kasus sejajar (y DASAR); label di bawahnya (pil 32, pusat DASAR+18);
    // stiker menumpuk ke atas. Area sentuh diperpanjang ke bawah sampai tepi bawah
    // label (LABEL_BAWAH) supaya mengetuk pil "Kasus X" juga memilih kasus itu.
    const DASAR = 300;
    const LABEL_BAWAH = DASAR + 18 + 16;
    // Kartu: area sentuh (tinggi 110) mulai tepat di bawah LABEL_BAWAH dan mencakup
    // label "Polis X" yang dinaikkan sedikit (labelDy).
    const KARTU_Y = 390;
    // Kolom digeser 6 ke kiri dari tengah supaya label "Polis D" tidak menimpa petugas (x 606).
    const KOLOM = [84, 238, 392, 546] as const;
    const kasus = [
      { id: 'kasus-a', x: KOLOM[0], a: kecil('a10-mobil', 190, 104, mobilOperasional()), label: 'Kasus A' },
      { id: 'kasus-b', x: KOLOM[1], a: kecil('a10-alat-berat', 190, 108, alatBerat()), label: 'Kasus B' },
      { id: 'kasus-c', x: KOLOM[2], a: kecil('a10-gudang', 180, 116, gudang()), label: 'Kasus C' },
      { id: 'kasus-d', x: KOLOM[3], a: kecil('a10-kiriman', 190, 112, paletKiriman()), label: 'Kasus D' },
    ];
    const kartu = [
      { id: 'polis-a', refId: 'kasus-a', x: KOLOM[0], huruf: 'A', dx: 0 },
      { id: 'polis-b', refId: 'kasus-b', x: KOLOM[1], huruf: 'B', dx: 0 },
      { id: 'polis-c', refId: 'kasus-c', x: KOLOM[2], huruf: 'C', dx: 0 },
      { id: 'polis-d', refId: 'kasus-d', x: KOLOM[3], huruf: 'D', dx: -8 },
    ];
    const perahu = art('a10-perahu', 88, 72, perahuKaret());
    return {
      missionId: 'a10-banjir-susulan',
      background: bg,
      // Garis air perahu di y ~201 (genangan belakang, di atas gambar kasus yang puncaknya y ~214);
      // hanyut pelan 26 ke kanan lalu kembali, tetap di antara dua tiang papan nama (x 212 - 338).
      props: [{ id: 'perahu', x: 266, y: 172, art: perahu, motion: 'drift', depth: 5 }],
      hero: { x: 606, y: 478, flip: true },
      walk: { minX: 80, maxX: 606, minY: 462, maxY: 478 },
      objects: [
        ...kasus.map((k) => ({
          id: k.id,
          role: 'item' as const,
          stepIds: ['temuan', 'tindak'],
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
          // Kartu berdiri = gambar misi 10 apa adanya (kunci tekstur sama, SVG identik).
          art: art(`m10-kartu-${d.huruf.toLowerCase()}`, 70, 62, kartuBerdiri(d.huruf)),
          label: `Polis ${d.huruf}`,
          labelDy: -10,
          labelDx: d.dx,
          hit: { w: 100, h: 110 },
          depth: 22,
        })),
      ],
      bucketShort: {
        'temuan:ambang': 'Bawah ambang',
        'temuan:periode': 'Luar periode',
        'temuan:selisih': 'Data selisih',
        'temuan:sesuai': 'Semua sesuai',
        'temuan:seri': 'Seri berbeda',
        'tindak:tidak-ambang': 'Tak capai TLO',
        'tindak:luar-periode': 'Periode habis',
        'tindak:dokumentasi': 'Lengkapi dok.',
        'tindak:survei': 'Lanjut survei',
        'tindak:klarifikasi': 'Klarifikasi',
      },
    };
  },
};
