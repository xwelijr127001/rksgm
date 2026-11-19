/**
 * Misi acara 08 - Lini Masa Excavator (proyek jalan baru; latar & unit milik m04).
 * Mekanik: PILAH TEMUAN. Lima bagian unit EX-2085 menempel di badan excavator
 * (teknik `potong()` m04): ketuk bagian, lalu pilih kategorinya di bawah adegan.
 * Stiker kategori muncul DI ATAS bagian itu. Langkah `simpul` dijawab lewat HTML.
 *
 * Netral: kelima bagian sama-sama memperlihatkan kondisinya (penyok, retak, aus,
 * tetes oli, kap terbuka) dengan kontras setara, tanpa tanda tanya / tanggal /
 * warna penilaian. KAPAN kerusakan muncul hanya bisa dibaca dari dua dokumen:
 * buku servis (dipegang operator) dan laporan kejadian (papan klip di barikade).
 * Kartu polis dibuka lewat tombol Dokumen.
 *
 * Tata letak (bagian unit berdekatan, jadi label & stiker dihitung; diperiksa dengan
 * pratinjau: stiker terpanjang "Kondisi lama" di KELIMA bagian sekaligus tidak bertumpuk):
 * - stiker = tepat di atas kotak gambar; jangkar stiker bertetangga berjarak >= 60 satuan
 *   vertikal (y: boom 117, kaca 177, mesin 238, track 328; selang 239 tetapi jauh di kanan);
 * - label "Boom penyok" di ATAS tempat stikernya (di bawah boom ada kabin & roda rantai),
 *   empat lainnya di bawah bagiannya. "Kaca" sengaja satu kata: ruang di antara kap mesin
 *   dan pangkal boom hanya ~90 satuan, jadi terjemahan label `kaca` harus sependek itu
 *   (dan `mesin` <= ~105 satuan supaya tidak menyentuh label "Buku servis" / track);
 * - roda rantai utuh = properti (potongan m04); item "Track shoe" hanya separuh DEPAN-nya
 *   (tanda aus), supaya stikernya tidak menutupi ruang mesin. Label "Mesin" menutupi ujung
 *   BELAKANG roda rantai yang bukan item.
 *
 * T-061c: gaya PIKSEL kasus 1 (k = 2): latar proyek, excavator per lapis, operator, laporan = seni piksel. Id, posisi, label,
 * kategori, dan perilaku TIDAK berubah.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { PX, PY, RANTAI, ROOT, SIKU, dunia, kotakLokal, labelKe, potong } from '../m04-proyek';
import { badanA08, boomA08, kacaA08, laporanA08, latarA08, mesinA08, rantaiA08, selangA08, tapakA08 } from './a08.piksel';
import { OPERATOR_A08 } from './a08.gen';
import { potongDunia } from './piksel-umum';
import { pikselDariRle } from './rle';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

/**
 * T-061c: kotak bagian dihitung PERSIS seperti potong() m04 (titik + pad), lalu lapis piksel dunia dipotong di kotak itu
 * (dibulatkan ke sel 4 dunia: pusat bergeser <= 2 satuan). Kembali: ArtRef + pusat dunia.
 */
function bagian(kunci: string, titik: [number, number][], pad: number, lapis: Piksel): { art: ArtRef; x: number; y: number } {
  const k = potong(kunci, titik, pad, '');
  const c = potongDunia(lapis, k.x - k.art.w / 2, k.y - k.art.h / 2, k.art.w, k.art.h);
  return { art: gambar(`${kunci}-piksel`, c.p), x: c.x, y: c.y };
}

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  // T-061c: latar & semua lapis excavator = seni piksel (./a08.piksel.ts), geometri m04 yang sama.
  const bg = gambar('a08-latar-piksel', latarA08());
  const siku = dunia(SIKU[0], SIKU[1]);
  const badan = bagian(
    'a08-excavator',
    [dunia(-214, -210), dunia(10, -210), dunia(-214, 0), dunia(10, 0), [siku[0] - 16, siku[1] - 16], [siku[0] + 90, 380], [PX - 210, PY + 16]],
    8,
    badanA08(),
  );
  const rantai = bagian('a08-rantai', kotakLokal(RANTAI.x, RANTAI.y, RANTAI.w, RANTAI.h), 6, rantaiA08());
  const boom = bagian(
    'a08-boom',
    [dunia(ROOT[0] - 18, ROOT[1] + 12), dunia(ROOT[0] + 20, ROOT[1] + 12), dunia(SIKU[0] + 14, SIKU[1] - 20), dunia(SIKU[0] + 16, SIKU[1] + 16), dunia(SIKU[0] - 40, SIKU[1] - 20)],
    6,
    boomA08(),
  );

  // Potongan baru.
  const kaca = bagian('a08-kaca', kotakLokal(-96, -208, 78, 64), 4, kacaA08());
  const mesin = bagian('a08-mesin', kotakLokal(-196, -160, 80, 84), 6, mesinA08());
  const track = bagian('a08-track', kotakLokal(-112, RANTAI.y, 112, RANTAI.h), 6, tapakA08());
  const selang = bagian('a08-selang', [[430, 252], [492, 380]], 5, selangA08());

  // T-061c: operator proyek = orang baru dari tokoh samping (helm kuning, baju biru, rompi), memegang buku servis teal.
  const operator = gambar('a08-operator-piksel', pikselDariRle(OPERATOR_A08));

  return {
    missionId: 'a08-linimasa-ex',
    gaya: 'piksel',
    background: bg,
    props: [
      { id: 'excavator', x: badan.x, y: badan.y, art: badan.art, depth: 10 },
      { id: 'roda-rantai', x: rantai.x, y: rantai.y, art: rantai.art, depth: 11 },
    ],
    hero: { x: 40, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 462, maxY: 478 },
    bucketShort: {
      'pilah:terkait': 'Terkait',
      'pilah:sebelumnya': 'Kondisi lama',
      'pilah:teknis': 'Cek teknis',
    },
    objects: [
      // Dokumen: dua sumber tanggal, sama-sama di tepi adegan (kiri & kanan unit).
      {
        id: 'buku-servis', role: 'doc', refId: 'servis',
        x: 40, y: 250, art: operator, label: 'Buku servis', depth: 20,
        // T-061c: pil (~162) di x 40 keluar tepi kiri: pusat 89 (tepi 8), naik 6 supaya bebas dari pil 'Mesin'.
        labelDx: 49, labelDy: -6,
        hit: { w: 80, h: 150 },
      },
      {
        id: 'laporan', role: 'doc', refId: 'laporan',
        x: 591, y: 270, art: gambar('a08-laporan-piksel', laporanA08()), label: 'Laporan', depth: 20,
        // T-061c: pil (zh ~126) keluar tepi kanan: pusat 568 (tepi >= 8).
        labelDx: -23,
        hit: { w: 90, h: 130 },
      },
      // Bagian unit (item). Kedalaman bagian kecil lebih tinggi supaya ketukannya menang
      // di tepi kotak boom yang diagonal.
      {
        id: 'mesin', role: 'item', stepId: 'pilah', refId: 'mesin', fx: 'tag',
        x: mesin.x, y: mesin.y, art: mesin.art, label: 'Mesin', depth: 22,
        // Label di bawah ruang mesin, sedikit ke kiri: menutupi ujung BELAKANG roda rantai
        // (properti, bukan item), tidak menyentuh separuh depan yang bisa diketuk.
        labelDx: -4,
      },
      {
        id: 'kaca', role: 'item', stepId: 'pilah', refId: 'kaca', fx: 'tag',
        x: kaca.x, y: kaca.y, art: kaca.art, label: 'Kaca', depth: 24,
        // Celah antara ruang mesin (kiri) dan pangkal boom (kanan) lebih sempit daripada labelnya:
        // geser 5 satuan ke kiri supaya bebas dari poros boom; yang tertimpa hanya bantalan kosong kotak mesin.
        labelDx: -5, labelDy: -4, hit: { w: 84, h: 84 },
      },
      {
        id: 'boom', role: 'item', stepId: 'pilah', refId: 'boom', fx: 'tag',
        x: boom.x, y: boom.y, art: boom.art, label: 'Boom penyok', depth: 21,
        // Label di atas TEMPAT STIKER (stiker = 32 satuan tepat di atas ujung boom).
        hit: { w: 92, h: 188 }, ...labelKe(boom, 376, 76),
      },
      {
        id: 'track', role: 'item', stepId: 'pilah', refId: 'track', fx: 'tag',
        x: track.x, y: track.y, art: track.art, label: 'Track shoe', depth: 20,
        // T-061c: geser 8 ke kiri supaya tidak menyentuh pil 'Selang hidrolik'.
        labelDx: -8,
      },
      {
        id: 'selang', role: 'item', stepId: 'pilah', refId: 'selang', fx: 'tag',
        x: selang.x, y: selang.y, art: selang.art, label: 'Selang hidrolik', depth: 24,
        // Label digeser ke kanan supaya tidak menyentuh ujung depan roda rantai.
        hit: { w: 80, h: 138 }, labelDx: 36,
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a08-linimasa-ex', buat };
