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
 *
 * T-061a: gaya PIKSEL kasus 1 (k = 2). Latar = bengkel Episode 2 (./a03.gen.ts, character/acara-t061/bangun.mjs); mobil, tali,
 * dan keempat polaroid = ./a03.piksel.ts. Id, posisi, label (id/en/zh), area sentuh, kategori, dan perilaku TIDAK berubah.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { FOTO_A03, mobilA03, polaroidA03, taliA03 } from './a03.piksel';
import { LATAR_A03 } from './a03.gen';
import { pikselDariRle } from './rle';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

// ------------------------------------------------------------------ adegan

function sceneTugasFoto(): SceneSpec {
  const bg = gambar('a03-latar-piksel', pikselDariRle(LATAR_A03));
  // Polaroid: pusat y 190 (atas 140, bawah 240); label pil di bawahnya (pusat 258, tepi bawah 275).
  // Jarak antar foto 152: stiker kategori (maks 13 huruf) dan pil label tidak saling menimpa.
  const FOTO_Y = 190;
  const LABEL_BAWAH = FOTO_Y + 50 + 18 + 17;
  const foto = [
    { id: 'foto-a', x: 92, huruf: 'A', isi: FOTO_A03.seluruh },
    { id: 'foto-b', x: 244, huruf: 'B', isi: FOTO_A03.detail },
    { id: 'foto-c', x: 396, huruf: 'C', isi: FOTO_A03.plat },
    { id: 'foto-d', x: 548, huruf: 'D', isi: FOTO_A03.selfie },
  ];
  return {
    missionId: 'a03-tugas-foto',
    gaya: 'piksel',
    background: bg,
    props: [
      // Tali: titik jepit di y dunia 147 = jepitan polaroid (y lokal 7).
      { id: 'tali', x: 320, y: 150, art: gambar('a03-tali-piksel', taliA03()), depth: 6 },
      // Mobil di area kerja kuning (posisi sama dengan m02; atap y 306, di bawah pil label foto).
      { id: 'mobil', x: 330, y: 345, art: gambar('a03-mobil-piksel', mobilA03()), depth: 8 },
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
      art: gambar(`a03-${f.id}-piksel`, polaroidA03(f.huruf, f.isi)),
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
