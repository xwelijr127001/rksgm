/**
 * Misi acara 02 - Jepret Dulu, Baru Angkut (parkiran ruko).
 * Mekanik: KAMERA BUKTI. Ketuk benda untuk memotretnya; foto masuk album (maks 3),
 * ketuk lagi untuk membatalkan. Posisi objek terikat bendanya, jadi TANPA acakPosisi.
 * - Truk kurir & kurir hanya properti (tanpa titik ketuk).
 * - Tumpukan peti = objek besar; peti #5 berdiri di depannya dengan depth lebih tinggi
 *   (pola mobil/penyok misi latihan 2); label kiriman digambar sebagai sisipan yang diperbesar.
 * - Label tumpukan ditaruh DI ATAS tumpukan supaya tiga label di pojok kanan tidak bertumpuk.
 *
 * T-061a: gaya PIKSEL kasus 1 (k = 2). Latar = ruang parkiran cerita Episode 1 (ruko berkaca, aspal, trotoar), mobil van yang
 * terpanggang di gambar itu DIHAPUS (./a02.gen.ts, character/acara-t061/bangun.mjs); truk = trailer Episode 2 berpita kurir
 * (./truk.gen.ts); kurir = orang baru dari tokoh samping (rompi + topi jingga); keenam benda foto = ./a02.piksel.ts.
 * Id objek, posisi, label (id/en/zh), area sentuh, dan perilaku TIDAK berubah.
 */

import type { ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { gerobakA02, labelA02, petiPenyokA02, selfieA02, spandukA02, tumpukanA02 } from './a02.piksel';
import { KURIR_A02, LATAR_A02 } from './a02.gen';
import { pikselDariRle } from './rle';
import { TRUK_ACARA } from './truk.gen';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

// ------------------------------------------------------------------ adegan

function sceneJepretKiriman(): SceneSpec {
  const kurir = gambar('a02-kurir-piksel', pikselDariRle(KURIR_A02));
  const truk = gambar('acara-truk-piksel', pikselDariRle(TRUK_ACARA));
  return {
    missionId: 'a02-jepret-kiriman',
    gaya: 'piksel',
    background: gambar('a02-latar-piksel', pikselDariRle(LATAR_A02)),
    props: [
      // Truk menghadap kiri, roda di aspal (tepi bawah y ~322), di depan petak parkir.
      { id: 'truk', x: 288, y: 264, art: truk, depth: 8 },
      // Kurir berdiri di samping kabin, kaki di y ~395 seperti sebelumnya.
      { id: 'kurir', x: 150, y: 395 - kurir.h / 2, art: kurir, depth: 10 },
    ],
    hero: { x: 280, y: 478 },
    // Pita jalan sempit di tengah bawah: petugas tidak pernah menutupi swafoto (kiri) maupun peti #5 & label (kanan).
    walk: { minX: 230, maxX: 320, minY: 466, maxY: 478 },
    objects: [
      {
        id: 'spanduk', role: 'option', stepId: 'bukti', refId: 'spanduk', fx: 'photo',
        x: 280, y: 100, art: gambar('a02-spanduk-piksel', spandukA02()), label: 'Spanduk promo', depth: 20,
      },
      {
        id: 'gerobak', role: 'option', stepId: 'bukti', refId: 'gerobak', fx: 'photo',
        x: 98, y: 152, art: gambar('a02-gerobak-piksel', gerobakA02()), label: 'Gerobak es', depth: 20,
      },
      {
        // Label di atas tumpukan (di tepi trotoar), bukan di bawah: di bawahnya ada peti #5 & label kiriman.
        id: 'tumpukan', role: 'option', stepId: 'bukti', refId: 'tumpukan', fx: 'photo',
        x: 535, y: 300, art: gambar('a02-tumpukan-piksel', tumpukanA02()), label: 'Tumpukan peti', depth: 20,
        // T-061b: en 'Stack of crates' (~217 lebar pil) muat dengan tepi kanan >= 8: pusat label 519.
        labelDy: -133, labelDx: -16,
      },
      {
        // Di depan pojok kiri bawah tumpukan; depth lebih tinggi supaya ketukan di sini tidak jatuh ke tumpukan.
        id: 'penyok', role: 'option', stepId: 'bukti', refId: 'penyok', fx: 'photo',
        x: 432, y: 356, art: gambar('a02-peti5-piksel', petiPenyokA02()), label: 'Sisi penyok', depth: 24,
        hit: { w: 88, h: 78 },
      },
      {
        id: 'label', role: 'option', stepId: 'bukti', refId: 'label', fx: 'photo',
        x: 570, y: 396, art: gambar('a02-label-piksel', labelA02()), label: 'Label peti', depth: 24,
        // T-061b: pil (en 'Crate label' ~171) di dalam adegan dengan tepi >= 8: pusat 546; bawah pil 471 (tepi 9).
        labelDx: -24,
      },
      {
        id: 'selfie', role: 'option', stepId: 'bukti', refId: 'selfie', fx: 'photo',
        x: 66, y: 352, art: gambar('a02-selfie-piksel', selfieA02()), label: 'Selfie kurir', depth: 20,
        // T-061b: pil (en 'Courier selfie' ~205) tidak terpotong tepi kiri: pusat 111, tepi kiri >= 8.
        labelDx: 45,
      },
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = {
  missionId: 'a02-jepret-kiriman',
  buat: sceneJepretKiriman,
};
