/**
 * Misi acara 07 - Tiga Polis, Satu Banjir (Gudang Sentra Niaga).
 * Mekanik: PILAH TIGA BERKAS. Ketuk binder (Berkas A/B/C), lalu pilih hasil pemeriksaannya di
 * bawah adegan; stiker kategori menempel di atas binder. Kartu polis tiap berkas berdiri di rak
 * bawah meja, dan laporan kejadian tergantung di dinding: keduanya membuka panel dokumen.
 * Langkah kedua (tanggapan untuk pemilik) berupa kalimat, jadi dijawab lewat kontrol HTML saja.
 *
 * Latar = gudang Misi 7 (T-061b: piksel) dengan meja & rak a07: meja kering
 * dilebarkan supaya tiga binder berstiker muat berjajar (jarak 150), palang bawah diturunkan
 * menjadi rak kartu, ember & pel dipindah keluar dari kolong meja.
 *
 * Netral: ketiga binder SERAGAM (bentuk, ukuran, warna; beda hanya hurufnya) dan warnanya sengaja
 * di luar empat warna stiker kategori, supaya tidak ada binder yang terkesan "cocok" dengan satu
 * stiker. Ketiga kartu polis juga identik. Tidak ada tanggal atau tulisan petunjuk di gambar.
 *
 * T-061b: gaya PIKSEL kasus 1 (k = 2): latar gudang pasca banjir (./gudang.piksel.ts, geometri m07 dengan meja & rak a07),
 * binder, kartu polis, laporan, kardus basah (./a07.piksel.ts). Id, posisi, label, kategori, perilaku TIDAK berubah.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { binderA07, kardusA07, kartuA07, laporanA07 } from './a07.piksel';
import { latarA07 } from './gudang.piksel';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

/** Meja kering a07: x 110 - 530 (poros tetap x=320). */
const MEJA = { x0: 110, x1: 530 };
/** Palang bawah meja diturunkan menjadi rak tempat kartu polis berdiri. */
const RAK_Y = 410;

function buat(): SceneSpec {
  const bg = gambar('a07-latar-piksel', latarA07({
    meja: MEJA,
    palangY: RAK_Y,
    // Pel bersandar di dinding tepat di kanan ujung meja; ember di lantai dekat pintu gulung.
    pel: { dx: 24, dy: 0 },
    ember: { dx: -420, dy: -68 },
  }));
  // Satu kolom per berkas, poros x=320, jarak 150 (stiker terpanjang 12 huruf masih muat).
  const kolom = [
    { huruf: 'A', x: 170 },
    { huruf: 'B', x: 320 },
    { huruf: 'C', x: 470 },
  ];
  // Susunan tegak tiap kolom (tidak saling menimpa):
  //   stiker 188-220 | binder 212-312 (berdiri di daun meja y=304) | label "Berkas X" 307-341
  //   | kartu polis 355-417 (kaki penyangga di rak y=410) | label "Polis X" 406-440.
  const BINDER_Y = 262;
  const KARTU_Y = 386;
  return {
    missionId: 'a07-tiga-polis',
    gaya: 'piksel',
    background: bg,
    hero: { x: 590, y: 478 },
    walk: { minX: 80, maxX: 600, minY: 462, maxY: 478 },
    objects: [
      ...kolom.map((k) => ({
        id: `berkas-${k.huruf.toLowerCase()}`,
        role: 'item' as const,
        stepId: 'periksa',
        refId: `berkas-${k.huruf.toLowerCase()}`,
        fx: 'tag' as const,
        x: k.x,
        y: BINDER_Y,
        art: gambar(`a07-binder-${k.huruf.toLowerCase()}-piksel`, binderA07(k.huruf)),
        label: `Berkas ${k.huruf}`,
        labelDy: -6,
        // Area sentuh mencakup stiker di atas binder dan pil labelnya (182-342), berhenti tepat di atas kartu.
        hit: { w: 104, h: 160 },
        depth: 20,
      })),
      ...kolom.map((k) => ({
        id: `kartu-${k.huruf.toLowerCase()}`,
        role: 'doc' as const,
        refId: `polis-${k.huruf.toLowerCase()}`,
        x: k.x,
        y: KARTU_Y,
        art: gambar(`a07-kartu-${k.huruf.toLowerCase()}-piksel`, kartuA07(k.huruf)),
        label: `Polis ${k.huruf}`,
        // T-061b: pil kartu dinaikkan (pusat 412, 395 - 433) supaya label kardus di bawahnya muat di dalam adegan.
        labelDy: -24,
        // 342-430: mulai tepat di bawah area binder, tidak menyentuh area kardus (x <= 118).
        hit: { w: 96, h: 88 },
        depth: 22,
      })),
      // Laporan kejadian di poros tengah, di antara papan nama gudang dan stiker Berkas B.
      {
        id: 'laporan', role: 'doc', refId: 'laporan',
        x: 320, y: 108, art: gambar('a07-laporan-piksel', laporanA07()), label: 'Laporan kejadian', depth: 20,
        labelDy: -6,
        hit: { w: 96, h: 140 },
      },
      // Kardus basah dipindah ke kiri meja; labelnya (444-478) di bawah label "Polis A".
      // SENGAJA tanpa `info`: keterangan objek info diterjemahkan lewat kamus bersama
      // (client/src/i18n/kamus/misi.ts, kunci info.<misi>.<objek>) yang hanya menerima misi paket
      // latihan (draft.test.ts menolak kunci lain), sehingga kalimat Indonesia akan tampil apa adanya
      // di en/zh. Tanpa `info`, ketukan menampilkan label objek, dan label sudah diterjemahkan di
      // ./a07.label.ts. Penyebab kejadian tetap terbaca di cerita dan di tabel `laporan`.
      {
        id: 'kardus', role: 'info', refId: 'kardus-basah',
        x: 62, y: 393, art: gambar('a07-kardus-piksel', kardusA07()), label: 'Kardus basah', depth: 20,
        // T-061b: pil (~174) di pojok kiri bawah: pusat x 95 (tepi kiri 8), y 451 (bawah 472, tepi 8), di bawah pil 'Polis A'.
        labelDx: 33, labelDy: -10,
        hit: { w: 112, h: 100 },
      },
    ],
    bucketShort: {
      'periksa:sesuai': 'Sesuai',
      'periksa:luar-periode': 'Luar periode',
      'periksa:tanpa-banjir': 'Tanpa banjir',
      'periksa:objek-beda': 'Objek beda',
    },
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a07-tiga-polis', buat };
