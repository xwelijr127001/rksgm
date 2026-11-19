/**
 * Misi acara 10 - Grand Mission: Banjir Susulan.
 * Tempat SAMA dengan misi 10 (geometri latar m10; T-061c: digambar ulang sebagai piksel), kasusnya lain.
 * Mekanik: EMPAT KASUS, DUA TAHAP. Ketuk kasus (mobil / alat berat / gudang /
 * kiriman barang), lalu pilih kategorinya di bawah adegan. Stiker tiap tahap
 * menumpuk di atas kasusnya (maks 2). Kartu tiap kasus berdiri di tanggul kering
 * dan bisa dibuka kapan saja.
 *
 * Netral: keempat kasus digambar setara (skala & tebal garis sama, sama-sama
 * tergenang, pelat identitas IDENTIK tanpa tulisan lewat `pelatId`). T-061c: keempatnya seni piksel
 * (./a10.piksel.ts) pada ukuran yang sama dengan versi vektor yang diperkecil.
 * Tidak ada tanda benar/salah.
 *
 * Tata letak: jarak antar kasus 154, jadi stiker (`bucketShort`) maks 13 huruf.
 * Area sentuh kasus mencakup pil label "Kasus X"; area kartu mencakup label
 * "Polis X" (pola misi 10). Jalan kering penuh oleh empat kartu + jalur petugas,
 * jadi karyawan yang melambai ("semua orang sudah aman") naik perahu karet kecil
 * di genangan belakang, bukan berdiri di jalan.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { kartuA07 } from './a07.piksel';
import { alatBeratA10, gudangA10, kirimanA10, latarA10, mobilA10, perahuA10 } from './a10.piksel';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a10-banjir-susulan',
  buat: (): SceneSpec => {
    // T-061c: gaya piksel kasus 1 (k = 2): latar, keempat kasus, kartu, perahu = seni piksel (./a10.piksel.ts).
    const bg = gambar('a10-latar-piksel', latarA10());
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
      { id: 'kasus-a', x: KOLOM[0], a: gambar('a10-mobil-piksel', mobilA10()), label: 'Kasus A' },
      { id: 'kasus-b', x: KOLOM[1], a: gambar('a10-alat-berat-piksel', alatBeratA10()), label: 'Kasus B' },
      { id: 'kasus-c', x: KOLOM[2], a: gambar('a10-gudang-piksel', gudangA10()), label: 'Kasus C' },
      { id: 'kasus-d', x: KOLOM[3], a: gambar('a10-kiriman-piksel', kirimanA10()), label: 'Kasus D' },
    ];
    const kartu = [
      { id: 'polis-a', refId: 'kasus-a', x: KOLOM[0], huruf: 'A', dx: 0 },
      { id: 'polis-b', refId: 'kasus-b', x: KOLOM[1], huruf: 'B', dx: 0 },
      { id: 'polis-c', refId: 'kasus-c', x: KOLOM[2], huruf: 'C', dx: 0 },
      { id: 'polis-d', refId: 'kasus-d', x: KOLOM[3], huruf: 'D', dx: -8 },
    ];
    const perahu = gambar('a10-perahu-piksel', perahuA10());
    return {
      missionId: 'a10-banjir-susulan',
      gaya: 'piksel',
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
          // T-061c: kartu polis berdiri piksel (sama dengan misi acara 07, 72 x 64; beda hanya huruf).
          art: gambar(`a10-kartu-${d.huruf.toLowerCase()}-piksel`, kartuA07(d.huruf)),
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
