/**
 * Mode cerita AUTO-1, aktivitas `polis` (misi sintetis 'cerita-auto1-polis'): meja layanan
 * Kantor Raksa (latar misi 5 dengan SATU alas kerja lebar, kunci tekstur sendiri).
 *
 * Satu-satunya objek: Kartu Polis Bu Rina (role 'doc', refId 'polis-rina') besar di tengah;
 * diketuk = membuka kartu polis di panel HTML. Langkah `penjelasan` dijawab lewat daftar HTML,
 * jadi TIDAK ada objek pilihan di adegan. Kartu sengaja tanpa tanda ok/tidak (itu membocorkan
 * jawaban): hanya ikon mobil Bu Rina dan baris abu-abu.
 * Hiasan (bukan target, tanpa titik ketuk): secangkir teh untuk nasabah dan buku catatan + pena.
 */

import type { SceneSpec } from '../../types';
import { INK, INK_TIPIS, P, art, circle, line, path, rect, rrect, shadow, text } from '../../art/kit';
import { latar as latarKantor } from '../m05-kantor';
import { mobilRinaDasar } from '../../../cerita/seni/mobil';

export const ID_MISI_POLIS = 'cerita-auto1-polis';

const KARTU_W = 236;
const KARTU_H = 160;
const KARTU_X = 320;
const KARTU_Y = 304;

/** Kartu polis besar 236 x 160 (miring sedikit), ikon mobil Bu Rina di kiri, baris isian abu-abu. */
export function kartuPolisRina(): string {
  let baris = '';
  for (let i = 0; i < 4; i += 1) {
    const y = 66 + i * 17;
    baris += line(`M110 ${y} H142`, P.besiMuda, 4) + line(`M150 ${y} H${i % 2 ? 198 : 214}`, P.tintaLembut, 4, 'opacity="0.45"');
  }
  return `
    ${shadow(118, 154, 104, 6)}
    <g transform="rotate(-2 118 80)">
      ${rrect(6, 8, 224, 140, 12, P.krem, INK)}
      ${rrect(6, 8, 224, 36, 12, P.hijau)}${rect(6, 30, 224, 14, P.hijau)}
      ${rrect(6, 8, 224, 140, 12, 'none', INK)}
      ${text(66, 33, 'POLIS', 18, P.krem)}
      ${path('M198 15 L212 20 L212 29 C212 35 206 39 198 42 C190 39 184 35 184 29 L184 20 Z', P.kuning, INK_TIPIS)}
      ${line('M198 20 V37', P.kuningTua, 2.4)}
      ${rrect(18, 56, 80, 56, 8, P.hijauPucat, INK_TIPIS)}
      <g transform="translate(24 66) scale(0.148)">${mobilRinaDasar()}</g>
      ${baris}
      ${rrect(18, 122, 80, 16, 4, P.putih, INK_TIPIS)}
      ${line('M28 130 H88', P.tinta, 4, 'opacity="0.7"')}
      ${circle(200, 126, 13, P.kuningPucat, INK_TIPIS)}
      ${circle(200, 126, 7, 'none', `stroke="${P.kuningTua}" stroke-width="2.4"`)}
    </g>`;
}

/** Secangkir teh di atas tatakan, 70 x 56 (hiasan). */
function tehHangat(): string {
  return `
    ${shadow(35, 50, 30, 4)}
    <ellipse cx="35" cy="46" rx="30" ry="7" fill="${P.putih}" ${INK_TIPIS}/>
    ${path('M16 22 L54 22 L50 44 C49 47 46 48 43 48 L27 48 C24 48 21 47 20 44 Z', P.putih, INK)}
    <ellipse cx="35" cy="22" rx="19" ry="4.5" fill="#b8733a" ${INK_TIPIS}/>
    ${path('M54 27 C64 27 64 40 52 40', 'none', `stroke="${P.tinta}" stroke-width="3" stroke-linecap="round"`)}
    ${line('M24 32 H46', P.hijauMuda, 3, 'opacity="0.8"')}
    ${line('M29 14 q-3 -5 1 -10 M39 14 q-3 -5 1 -10', P.besiMuda, 2.2, 'opacity="0.8"')}`;
}

/** Buku catatan terbuka + pena, 84 x 62 (hiasan). */
function bukuCatatan(): string {
  return `
    ${shadow(42, 58, 38, 4)}
    <g transform="rotate(-6 42 32)">
      ${rrect(6, 8, 72, 48, 5, P.putih, INK)}
      ${line('M42 9 V55', P.besiMuda, 2)}
      ${line('M12 20 H36 M12 28 H34 M12 36 H30 M48 20 H72 M48 28 H66', P.besiMuda, 2.6)}
    </g>
    ${line('M52 50 L80 22', P.tinta, 7)}${line('M52 50 L80 22', P.biru, 3.6)}
    ${path('M50 53 L52 46 L56 50 Z', P.tinta)}`;
}

export function scenePolisRina(): SceneSpec {
  return {
    missionId: ID_MISI_POLIS,
    // Satu alas lebar di tengah meja (latar misi 5 dengan susunan alas lain = kunci tekstur lain).
    background: art('cerita-auto1-polis-latar', 640, 480, latarKantor([[96, 214, 448, 196]])),
    props: [
      { id: 'teh', x: 490, y: 300, art: art('cerita-auto1-teh', 70, 56, tehHangat()), depth: 12 },
      { id: 'catatan', x: 150, y: 318, art: art('cerita-auto1-catatan', 84, 62, bukuCatatan()), depth: 12 },
    ],
    // Petugas di kanan bawah, di luar kartu & labelnya.
    hero: { x: 560, y: 478 },
    walk: { minX: 480, maxX: 580, minY: 470, maxY: 478 },
    objects: [
      {
        id: 'kartu-polis', role: 'doc', refId: 'polis-rina',
        x: KARTU_X, y: KARTU_Y, art: art('cerita-auto1-kartu', KARTU_W, KARTU_H, kartuPolisRina()),
        label: 'Kartu polis', depth: 22,
      },
    ],
  };
}
