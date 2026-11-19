/**
 * Misi acara 01 - Setelah Api Padam (toko kain pasca kebakaran yang SUDAH aman).
 * Mekanik: KETUK DUA TINDAKAN. Lima benda-tindakan berukuran sama di meja panjang;
 * ketuk untuk memilih (maks 2), ketuk lagi untuk membatalkan. Tanpa dokumen, tanpa folder.
 *
 * T-054: latar, lampu, kain, pemilik, dan kelima kartu kini seni PIKSEL (./a01.piksel.ts, ./a01.pemilik.ts) dengan tata
 * letak latar m03 yang sama; latar m03 sendiri (misi latihan) tidak berubah.
 *
 * Tata letak (dunia 640 x 480), slot meja m03 yang sudah teruji:
 * - Kolom x 186 / 364 / 542, baris y 136 / 276. Lima pilihan menempati tiga slot belakang
 *   dan slot depan kiri + kanan; posisinya diacak antar slot (`acakPosisi`).
 * - Slot depan-tengah tanpa pilihan: di situ tumpukan gulungan kain (prop pucat tanpa garis
 *   tepi, penanda "toko kain"). Akibatnya dua label baris depan tidak pernah bertetangga.
 * - Pemilik toko (prop, kepala & bahu) berdiri di balik meja, di ambang pintu rolling, di sela kolom tengah & kanan
 *   (T-054 Fix 1: x 453, tepi bawah y 120; papan "TOKO KAIN" kini di dinding kiri).
 *
 * Lebar label (teks tebal 20 px + bantalan 44): jarak kolom 178 berarti jumlah lebar dua label
 * bertetangga di baris belakang <= 356, dan label kolom kanan <= 184 supaya tidak dijepit tepi.
 * "Foto kerusakan" ~188, "Buka toko saja" ~181, "Buang barang" ~176, "Perbaiki dulu" ~169,
 * "Lapor klaim" ~155. Label silabus "Buang yang hangus" (~229) terlalu lebar untuk slot ini.
 *
 * Susunan SETELAH acak slot (deterministik, benih = id misi + id langkah): belakang = Perbaiki dulu,
 * Lapor klaim, Buka toko saja (celah ~16 & ~10 px; adegan m03 yang teruji hanya ~2 px); depan =
 * Foto kerusakan, (kain), Buang barang. AWAS: "Foto kerusakan" + "Buka toko saja" (~369) TIDAK muat
 * bersebelahan di baris belakang. Bila id misi/langkah, jumlah opsi, atau label berubah, susunan
 * ikut berubah: ukur ulang (juga label en/zh di ./a01.label.ts).
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import { Piksel } from '../../art/piksel';
import { kainA01, kartuA01, lampuA01, latarA01, type JenisKartuA01 } from './a01.piksel';
import { PEMILIK_A01, PEMILIK_A01_PETA } from './a01.pemilik';

/** Ukuran seragam semua benda-tindakan (sama menonjol; syarat `acakPosisi`). */
const OW = 96;
const OH = 88;

/**
 * T-054: seni PIKSEL (./a01.piksel.ts, 1 sel = 4 dunia) menggantikan seni vektor lama; tata letak, id, label, dan acakPosisi
 * TIDAK berubah. Kunci tekstur baru (akhiran -piksel) supaya tidak bertabrakan dengan cache m03.
 */
const kartu = (j: JenisKartuA01): ArtRef => art(`a01-${j}-piksel`, OW, OH, kartuA01(j).svg(4));

/**
 * Pemilik toko (T-054 Fix 1): Ibu pemilik toko kain, tokoh BARU dari bagian tokoh cerita (wanita atlas tokoh samping, blus
 * marun + celemek toko krem bertali jingga; ./a01.pemilik.ts), diperkecil 2 : 1, menghadap meja, kepala & bahu.
 */
function pemilikToko(): ArtRef {
  const p = new Piksel(PEMILIK_A01[0]!.length, PEMILIK_A01.length).pola(0, 0, PEMILIK_A01, PEMILIK_A01_PETA);
  return art('a01-pemilik-piksel', p.w * 4, p.h * 4, p.svg(4));
}

// ------------------------------------------------------------------ adegan

function sceneApiPadam(): SceneSpec {
  // Slot meja m03: jarak kolom 178, jarak baris 140 (label baris belakang tidak menyentuh baris depan).
  const kol = [186, 364, 542];
  const baris = [136, 276];
  const pemilik = pemilikToko();
  return {
    missionId: 'a01-api-padam',
    acakPosisi: ['tindakan'],
    // T-054: label & tanda pilihan piksel (kotak bertangga, bingkai jingga + centang) hanya untuk adegan ini.
    gaya: 'piksel',
    background: art('a01-latar-piksel', 640, 480, latarA01().svg(4)),
    props: [
      { id: 'lampu', x: 334, y: 34, art: art('a01-lampu-piksel', 40, 68, lampuA01().svg(4)), motion: 'sway', depth: 5 },
      // T-054 Fix 1: Ibu pemilik toko kain berdiri di ambang pintu rolling, di balik meja, kepala & bahu utuh (tidak terpotong
      // tepi): tepi bawah gambar y 120, 24 dunia terakhir (bahu) di balik kartu baris belakang yang digambar di atasnya.
      { id: 'pemilik', x: 453, y: 120 - pemilik.h / 2, art: pemilik, depth: 6 },
      { id: 'kain', x: kol[1]!, y: 282, art: art('a01-kain-piksel', 132, 84, kainA01().svg(4)), depth: 6 },
    ],
    hero: { x: 60, y: 478 },
    walk: { minX: 60, maxX: 600, minY: 458, maxY: 478 },
    objects: [
      // Baris belakang
      {
        id: 'perbaiki', role: 'option', stepId: 'tindakan', refId: 'perbaiki', fx: 'choose',
        x: kol[0]!, y: baris[0]!, art: kartu('perbaiki'), label: 'Perbaiki dulu',
      },
      {
        id: 'buang', role: 'option', stepId: 'tindakan', refId: 'buang', fx: 'choose',
        x: kol[1]!, y: baris[0]!, art: kartu('buang'), label: 'Buang barang',
      },
      {
        id: 'lapor', role: 'option', stepId: 'tindakan', refId: 'lapor', fx: 'choose',
        x: kol[2]!, y: baris[0]!, art: kartu('lapor'), label: 'Lapor klaim',
      },
      // Baris depan (slot tengah ditempati tumpukan kain)
      {
        id: 'foto', role: 'option', stepId: 'tindakan', refId: 'foto', fx: 'choose',
        x: kol[0]!, y: baris[1]!, art: kartu('foto'), label: 'Foto kerusakan',
      },
      {
        id: 'abaikan', role: 'option', stepId: 'tindakan', refId: 'abaikan', fx: 'choose',
        x: kol[2]!, y: baris[1]!, art: kartu('buka'), label: 'Buka toko saja',
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a01-api-padam',
  buat: sceneApiPadam,
};
