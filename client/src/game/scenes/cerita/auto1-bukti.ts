/**
 * Mode cerita AUTO-1, aktivitas `bukti` (misi sintetis 'cerita-auto1-bukti'): parkiran kantor.
 * Mekanik: KAMERA BUKTI seperti misi 2. Ketuk benda untuk memotretnya (maks 3), ketuk lagi
 * untuk membatalkan. Posisi objek terikat bendanya, jadi TANPA acakPosisi.
 *
 * Tata letak (dunia 640 x 480, latar parkiran misi 1 dipakai utuh):
 * - Mobil Bu Rina (MPV tampak 3/4 belakang) di tengah = objek besar "Seluruh mobil".
 * - Di atas mobil (depth lebih tinggi, pola mobil/penyok misi 2): dasbor di balik kaca pintu depan,
 *   ban depan, brosur menu di kaca samping, plat nomor, dan pojok bemper + lampu belakang yang rusak.
 *   Ban depan & dasbor = bagian mobil yang TIDAK rusak dan tidak menunjukkan identitasnya (pengecoh
 *   yang butuh pertimbangan, bukan pengecoh konyol). Area ketuk tiap sisipan >= 86 satuan (>= 44 px
 *   pada adegan selebar 328 px) dan TIDAK saling menumpuk (lihat cerita.test.ts).
 * - Label: brosur & kerusakan DI ATAS bendanya; dasbor, plat, dan mobil di bawah; ban depan di bawah
 *   mobil, bergeser ke kanan supaya tidak menutupi kepala petugas. Tidak ada label yang menutupi
 *   sisipan lain.
 * - Bu Rina berdiri di samping mobil (properti, tanpa titik ketuk): SENI PIKSEL v4 yang sama dengan panggung cerita,
 *   frame aktivitas manifest (`berdiri`, kunci mobil di tangan) + wajah cemas lewat penyusun seni/piksel. Engine
 *   menampilkannya dengan tekstur NEAREST pada piksel perangkat BULAT per piksel seni (MissionScene.letakPiksel):
 *   tinggi rancangan 120 dunia seperti dulu, tinggi tampil = kelipatan bulat terdekat (minimal 1 piksel perangkat
 *   per piksel seni, jadi di kanvas kecil ia tampil sedikit lebih tinggi). Telapak di tepi bawah kotak rancangan
 *   (y ± 292). Atlas gagal = seni SVG v3 lama (versi kecil) di kotak yang sama. Petugas di pojok kiri bawah dengan
 *   pita jalan pendek supaya tidak berjalan menutupi mobil.
 */

import type { ArtPiksel, ArtRef, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import { latar as latarParkiran } from '../m01-parkiran';
import {
  MOBIL_H, MOBIL_W, SISIPAN, banDepan, brosurMenu, dasborJendela, mobilRinaDasar, penyokBelakang, platRina,
} from '../../../cerita/seni/mobil';
import { RINA_PENUH, nasabahBadanPenuh } from '../../../cerita/seni/nasabah';
import { susunTokoh, tokohPikselTersedia } from '../../../cerita/seni/piksel';

export const ID_MISI_BUKTI = 'cerita-auto1-bukti';

/** Pojok kiri atas mobil di dunia. Mobil 460 x 230 -> x 88..548, y 176..406. */
const MOBIL_OX = 88;
const MOBIL_OY = 176;

/** Titik dunia dari koordinat lokal mobil. */
function diMobil(x: number, y: number): { x: number; y: number } {
  return { x: MOBIL_OX + x, y: MOBIL_OY + y };
}

/** Arah frame Bu Rina di parkiran: menghadap mobilnya (kanan gambar). */
const HADAP_RINA = 'kanan' as const;

/**
 * Bu Rina PIKSEL untuk properti adegan: frame aktivitas manifest (`berdiri`, arah HADAP_RINA) + wajah cemas, titik pijak
 * = kaki frame. undefined = seni piksel tidak tersedia (properti memakai SVG).
 */
function rinaPiksel(): ArtPiksel | undefined {
  if (!tokohPikselTersedia('buRina')) return undefined;
  try {
    const s = susunTokoh('buRina', { pose: 'berdiri', hadap: HADAP_RINA, ekspresi: 'cemas' });
    if (!s || !s.lapisan.length) return undefined;
    return {
      url: s.url,
      w: s.ukuran.w,
      h: s.ukuran.h,
      jangkar: { x: s.jangkar.x, y: s.jangkar.y },
      lapisan: s.lapisan.map((l) => ({ sx: l.sumber.x, sy: l.sumber.y, w: l.sumber.w, h: l.sumber.h, x: l.x, y: l.y })),
    };
  } catch {
    return undefined;
  }
}

export function sceneBuktiRina(): SceneSpec {
  const pusatMobil = diMobil(MOBIL_W / 2, MOBIL_H / 2);
  const penyok = diMobil(SISIPAN.penyok.x, SISIPAN.penyok.y);
  const plat = diMobil(SISIPAN.plat.x, SISIPAN.plat.y);
  const brosur = diMobil(SISIPAN.brosur.x, SISIPAN.brosur.y);
  const ban = diMobil(SISIPAN.ban.x, SISIPAN.ban.y);
  const dasbor = diMobil(SISIPAN.dasbor.x, SISIPAN.dasbor.y);
  // Bu Rina (proporsi dewasa ± 7 kepala): tinggi rancangan 120, lebar mengikuti rasio potongan SVG cadangan; telapak
  // di y 290 (SVG) / tepi bawah kotak (piksel). Seni piksel: tinggi tampil = kelipatan bulat piksel perangkat.
  const RINA_H = 120;
  const RINA_W = Math.round((RINA_H * RINA_PENUH.w) / RINA_PENUH.h);
  const piksel = rinaPiksel();
  const rina: ArtRef = {
    ...art(piksel ? 'cerita-auto1-rina-piksel' : 'cerita-auto1-rina-v3', RINA_PENUH.w, RINA_PENUH.h, nasabahBadanPenuh()),
    w: RINA_W,
    h: RINA_H,
    ...(piksel ? { piksel } : {}),
  };
  const rinaY = Math.round(290 - (RINA_PENUH.telapakY / RINA_PENUH.h) * RINA_H + RINA_H / 2);
  return {
    missionId: ID_MISI_BUKTI,
    background: art('m01-latar', 640, 480, latarParkiran()),
    props: [
      { id: 'rina', x: 50, y: rinaY, art: rina, depth: 6 },
    ],
    hero: { x: 56, y: 478 },
    // Pita jalan pendek di kiri bawah: petugas menoleh/menunjuk tanpa berdiri di depan mobil.
    walk: { minX: 56, maxX: 110, minY: 470, maxY: 478 },
    objects: [
      {
        // Label di bawah bagian SAMPING mobil (kiri), menjauh dari label plat.
        id: 'mobil', role: 'option', stepId: 'bukti', refId: 'foto-full', fx: 'photo',
        x: pusatMobil.x, y: pusatMobil.y, art: art('cerita-auto1-mobil', MOBIL_W, MOBIL_H, mobilRinaDasar()),
        label: 'Seluruh mobil', depth: 20, labelDx: -96,
      },
      {
        // Label di ATAS lampu (di kaca belakang), karena di bawahnya ada label plat.
        id: 'penyok', role: 'option', stepId: 'bukti', refId: 'foto-penyok', fx: 'photo',
        x: penyok.x, y: penyok.y, art: art('cerita-auto1-penyok', SISIPAN.penyok.w, SISIPAN.penyok.h, penyokBelakang()),
        label: 'Bemper & lampu', depth: 24, hit: { w: 88, h: 100 },
        labelDy: -(SISIPAN.penyok.h + 18 + 22),
      },
      {
        id: 'plat', role: 'option', stepId: 'bukti', refId: 'foto-plat', fx: 'photo',
        x: plat.x, y: plat.y, art: art('cerita-auto1-plat', SISIPAN.plat.w, SISIPAN.plat.h, platRina()),
        // Label sedikit ke kiri: ujung kanannya tidak menutupi pojok bemper yang penyok.
        label: 'Plat nomor', depth: 24, hit: { w: 88, h: 88 }, labelDx: -18,
      },
      {
        id: 'brosur', role: 'option', stepId: 'bukti', refId: 'foto-menu', fx: 'photo',
        x: brosur.x, y: brosur.y, art: art('cerita-auto1-brosur', SISIPAN.brosur.w, SISIPAN.brosur.h, brosurMenu()),
        label: 'Brosur menu', depth: 24, hit: { w: 86, h: 86 },
        labelDy: -(SISIPAN.brosur.h + 18 + 24),
      },
      {
        // Dasbor di balik kaca pintu depan. Label di BAWAH kaca (di pintu depan), karena label brosur
        // sudah di atas atap; sedikit ke kiri supaya tidak menyentuh brosur.
        id: 'dasbor', role: 'option', stepId: 'bukti', refId: 'foto-dasbor', fx: 'photo',
        x: dasbor.x, y: dasbor.y, art: art('cerita-auto1-dasbor', SISIPAN.dasbor.w, SISIPAN.dasbor.h, dasborJendela()),
        label: 'Dasbor', depth: 24, hit: { w: 86, h: 86 }, labelDx: -8,
      },
      {
        // Ban depan. Label di bawah mobil, bergeser ke kanan: di kiri bawah ada kepala petugas.
        id: 'ban', role: 'option', stepId: 'bukti', refId: 'foto-ban', fx: 'photo',
        x: ban.x, y: ban.y, art: art('cerita-auto1-ban', SISIPAN.ban.w, SISIPAN.ban.h, banDepan()),
        label: 'Ban depan', depth: 24, hit: { w: 86, h: 86 }, labelDx: 40,
      },
    ],
  };
}
