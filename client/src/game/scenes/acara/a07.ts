/**
 * Misi acara 07 - Tiga Polis, Satu Banjir (Gudang Sentra Niaga).
 * Mekanik: PILAH TIGA BERKAS. Ketuk binder (Berkas A/B/C), lalu pilih hasil pemeriksaannya di
 * bawah adegan; stiker kategori menempel di atas binder. Kartu polis tiap berkas berdiri di rak
 * bawah meja, dan laporan kejadian tergantung di dinding: keduanya membuka panel dokumen.
 * Langkah kedua (tanggapan untuk pemilik) berupa kalimat, jadi dijawab lewat kontrol HTML saja.
 *
 * Latar = latar Misi 7 yang diparametrikan (kunci tekstur sendiri: `a07-latar`): meja kering
 * dilebarkan supaya tiga binder berstiker muat berjajar (jarak 150), palang bawah diturunkan
 * menjadi rak kartu, ember & pel dipindah keluar dari kolong meja.
 *
 * Netral: ketiga binder SERAGAM (bentuk, ukuran, warna; beda hanya hurufnya) dan warnanya sengaja
 * di luar empat warna stiker kategori, supaya tidak ada binder yang terkesan "cocok" dengan satu
 * stiker. Ketiga kartu polis juga identik. Tidak ada tanggal atau tulisan petunjuk di gambar.
 */

import type { SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, rect, rrect, shadow, text } from '../../art/kit';
import { binder } from '../../art/props';
import { kardusBasah, latar } from '../m07-gudang';

/** Meja kering a07: x 110 - 530 (poros tetap x=320). */
const MEJA = { x0: 110, x1: 530 };
/** Palang bawah meja diturunkan menjadi rak tempat kartu polis berdiri. */
const RAK_Y = 410;

/**
 * Papan klip laporan kejadian yang digantung di dinding, 72 x 86. Tanpa tulisan & tanpa tanggal:
 * isinya dibaca di panel dokumen. Kepala lembar berwarna netral (bukan warna stiker kategori).
 */
function papanLaporan(): string {
  return `
    ${rrect(12, 18, 56, 66, 6, P.tinta, 'opacity="0.12"')}
    ${line('M36 5 L22 16 M36 5 L50 16', P.besiTua, 2)}
    ${circle(36, 5, 3.5, P.besiTua)}
    ${rrect(8, 14, 56, 66, 6, P.kayu, INK)}
    ${rrect(13, 22, 46, 53, 3, P.putih)}
    ${rrect(24, 10, 24, 12, 3, P.besi, INK_TIPIS)}
    ${rrect(18, 28, 30, 8, 3, P.cokelatMuda)}
    ${line('M18 44 H54 M18 53 H48 M18 62 H54 M18 70 H40', P.tintaLembut, 3)}`;
}

/** Kartu polis kecil di atas penyangga, 70 x 62 (gaya kartu berdiri Misi 10). Beda hanya huruf. */
function kartuPolis(huruf: string): string {
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

function buat(): SceneSpec {
  const bg = art('a07-latar', 640, 480, latar({
    meja: MEJA,
    palangY: RAK_Y,
    // Pel bersandar di dinding tepat di kanan ujung meja; ember di lantai dekat pintu gulung.
    pel: { dx: 24, dy: 0 },
    ember: { dx: -420, dy: -68 },
    riakKardus: { x: 64, y: 439 },
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
        art: art(`a07-binder-${k.huruf.toLowerCase()}`, 80, 100, binder(P.besiTua, k.huruf)),
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
        art: art(`a07-kartu-${k.huruf.toLowerCase()}`, 70, 62, kartuPolis(k.huruf)),
        label: `Polis ${k.huruf}`,
        labelDy: -12,
        // 342-430: mulai tepat di bawah area binder, tidak menyentuh area kardus (x <= 118).
        hit: { w: 96, h: 88 },
        depth: 22,
      })),
      // Laporan kejadian di poros tengah, di antara papan nama gudang dan stiker Berkas B.
      {
        id: 'laporan', role: 'doc', refId: 'laporan',
        x: 320, y: 108, art: art('a07-laporan', 72, 86, papanLaporan()), label: 'Laporan kejadian', depth: 20,
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
        x: 62, y: 393, art: art('a07-kardus', 128, 100, kardusBasah()), label: 'Kardus basah', depth: 20,
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
