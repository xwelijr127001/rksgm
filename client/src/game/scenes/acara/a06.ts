/**
 * Misi acara 06 - Satu per Satu, Pak Kepala Gudang (gudang alat berat).
 * Mekanik: STIKER NOMOR URUT. Lima tindakan berjajar di meja sortir; ketuk satu
 * tindakan, lalu pilih "Langkah 1 - 4" atau "Jangan dilakukan dulu" di bawah
 * adegan. Stiker pilihan menempel di atas tindakan itu. Nampan m08 tidak dipakai
 * dan tidak ada dokumen.
 *
 * Latar & forklift GT-220 mengikuti geometri misi 8 (T-061b: digambar ulang sebagai piksel). Properti baru: rak besi yang tiangnya bengkok di
 * belakang forklift, jam dinding, dan kepala gudang yang menunjuk jam (terburu-buru).
 *
 * Netral: kelima tindakan digambar setara (92 x 80, tatakan sama, garis tinta sama).
 * Urutan kiri-kanan SENGAJA bukan urutan proses, dan sama dengan urutan chip di
 * panel HTML (urutan data), jadi posisi tidak memberi petunjuk.
 *
 * Label dua baris: jarak antar tindakan hanya 110, sedangkan pil label 20 px +
 * penanda bisa selebar 150. Karena itu label posisi 1, 3, 5 ada di baris atas dan
 * label posisi 2, 4 diturunkan ke baris bawah; tetangga sebaris berjarak 220 sehingga
 * label, keterangan aksi ("Jangan dulu"), dan tanda pembahasan tidak bertumpuk.
 * Label BARIS ATAS dijaga pendek (maks. sekitar 7 huruf, juga saat diterjemahkan)
 * supaya tidak melebar ke kolom tetangga; label baris bawah boleh lebih panjang.
 *
 * Petugas tetap di pojok kanan bawah (pita jalan sempit, pola misi 8): lajur bawah
 * penuh label, jadi berjalan ke tindakan akan menutupi label.
 *
 * T-061b: gaya PIKSEL kasus 1 (k = 2): latar gudang (./gudang.piksel.ts, geometri m08), forklift GT-220, rak bengkok, jam,
 * kelima tindakan (./a06.piksel.ts), kepala gudang orang baru (./a06.gen.ts). Id, posisi, label, kategori, perilaku TIDAK berubah.
 */

import type { ArtRef, SceneObjectSpec, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { FORKLIFT } from '../m08-forklift';
import { forkliftA06, jamA06, rakA06, tindakanA06, type TindakanA06 } from './a06.piksel';
import { KEPALA_A06 } from './a06.gen';
import { latarA06 } from './gudang.piksel';
import { pikselDariRle } from './rle';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

/** Kotak rak dalam koordinat dunia: tepat di belakang pemberat forklift (x 406). Piksel 80 x 240. */
const RAK = { x0: 404, y0: 112, w: 80, h: 240 };

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  const bg = gambar('a06-latar-piksel', latarA06());
  // Kepala gudang berdiri di depan papan perkakas, lengan terangkat ke arah jam dinding.
  // T-061b: kepala gudang = orang baru dari tokoh samping (helm kuning, rompi jingga, wajah cemas), ./a06.gen.ts.
  const kepala = gambar('a06-kepala-gudang-piksel', pikselDariRle(KEPALA_A06));

  // Lima tindakan di atas meja sortir (permukaan meja y 412), jarak sama 110.
  // Urutan kiri-kanan = urutan data item (bukan urutan proses).
  const Y = 372;
  const X0 = 76;
  const JARAK = 110;
  // Baris label: atas = pusat y 417 (400-434), bawah = pusat y 459 (442-476). Sela 8 satuan: saat
  // pembahasan lencana ✓/✕/! membuat label sedikit lebih besar, dan sela 1 satuan membuat sudutnya bertumpuk.
  // Area sentuh selebar kolom (106 < 110) dan memanjang sampai tepi bawah label
  // masing-masing (pemain awam sering mengetuk tulisan nama); tidak ada yang saling menutup.
  // T-061b: pil punya alas tinta 4 di bawah kotak 34, jadi baris bawah lama (pusat 459) berakhir tepat di y 480. Sekarang
  // baris bawah pusat 451 (434 - 472, tepi 8) dan baris atas pusat 405 (388 - 426), sela 8 tetap; pil atas menutup tatakan.
  const ATAS = { labelDy: -25, hit: { w: 106, h: 138 } };
  const BAWAH = { labelDy: 21, hit: { w: 106, h: 208 } };
  const tindakan: { refId: TindakanA06; label: string }[] = [
    { refId: 'lapor', label: 'Lapor' },
    { refId: 'perbaiki', label: 'Perbaikan' },
    { refId: 'buang', label: 'Buang' },
    { refId: 'dok', label: 'Foto & seri' },
    { refId: 'survei', label: 'Survei' },
  ];
  const objects: SceneObjectSpec[] = tindakan.map((t, i) => ({
    id: t.refId,
    role: 'item',
    stepId: 'urutan',
    refId: t.refId,
    fx: 'tag',
    x: X0 + i * JARAK,
    y: Y,
    art: gambar(`a06-${t.refId}-piksel`, tindakanA06(t.refId)),
    label: t.label,
    depth: 22,
    ...(i % 2 === 0 ? ATAS : BAWAH),
  }));

  return {
    missionId: 'a06-urutan-gudang',
    gaya: 'piksel',
    background: bg,
    props: [
      { id: 'rak', x: RAK.x0 + RAK.w / 2, y: RAK.y0 + RAK.h / 2, art: gambar('a06-rak-piksel', rakA06()), depth: 5 },
      { id: 'forklift', x: FORKLIFT.x0 + FORKLIFT.w / 2, y: FORKLIFT.y0 + FORKLIFT.h / 2, art: gambar('a06-forklift-piksel', forkliftA06()), depth: 6 },
      { id: 'jam', x: 608, y: 66, art: gambar('a06-jam-piksel', jamA06()), depth: 4 },
      { id: 'kepala-gudang', x: 602, y: 330 - kepala.h / 2, art: kepala, motion: 'bob', depth: 8 },
    ],
    hero: { x: 604, y: 478 },
    walk: { minX: 584, maxX: 604, minY: 464, maxY: 478 },
    bucketShort: {
      'urutan:l1': 'Langkah 1',
      'urutan:l2': 'Langkah 2',
      'urutan:l3': 'Langkah 3',
      'urutan:l4': 'Langkah 4',
      'urutan:jangan': 'Jangan dulu',
    },
    objects,
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a06-urutan-gudang', buat };
