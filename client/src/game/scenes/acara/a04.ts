/**
 * Misi acara 04 - Peti yang Tak Sampai (dermaga pelabuhan; latar misi 6 dipakai utuh).
 * Mekanik: COCOKKAN TIGA DOKUMEN, lalu pilih tindak lanjut.
 * - Tata letak misi 6 yang sudah teruji: daftar kiriman (di truk), foto peti (dinding gudang),
 *   bukti terima (meja gudang), papan "Catatan petugas", empat papan aksi seragam di zona kuning.
 * - 21 peti yang diterima berdiri di tengah sebagai latar (tanpa titik ketuk): 7 kolom x 3 tingkat,
 *   nomor naik dari bawah ke atas per kolom. Kemasan rusak digambar sesuai tabel foto:
 *   #3 penyok, #9 basah, #15 terbuka, #20 penyok & basah. Pemain jeli bisa menghitungnya dari sini.
 * - Papan foto memuat ENAM foto (sesuai tabel), bukan tiga seperti misi 6.
 * - Sopir truk melirik jam di depan bak truknya (properti latar, bukan tokoh pemandu).
 * - Label papan aksi = satu kata pendek. Jarak antar papan 130 dan pil label = teks + 44, jadi
 *   label dua kata ("Catat lengkap" +-170 lebar) pasti bertumpuk; batas aman +-8 huruf Latin.
 *   Kalimat lengkap tetap tampil di daftar HTML dan di pengumuman setelah memilih.
 *
 * T-061a: gaya PIKSEL kasus 1 (k = 2): latar, truk, sopir (orang baru dari tokoh samping), 21 peti, papan foto, dokumen, dan
 * papan aksi = seni piksel (./a04.piksel.ts, ./a04.gen.ts, ./truk.gen.ts). Id, posisi, label (id/en/zh), urutan slot
 * acakPosisi, papan catatan, dan kunci jawaban TIDAK berubah.
 */

import type { ArtRef, SceneObjectSpec, SceneSpec } from '../../types';
import { art } from '../../art/kit';
import type { Piksel } from '../../art/piksel';
import { fotoEnamA04, lembarTerimaA04, papanAksiA04, papanKirimanA04, tumpukanA04, type IkonAksiA04 } from './a04.piksel';
import { LATAR_A04, SOPIR_A04 } from './a04.gen';
import { pikselDariRle } from './rle';
import { TRUK_ACARA } from './truk.gen';

/** Piksel k = 2 -> ArtRef (1 sel tata letak = 4 dunia). */
const gambar = (kunci: string, p: Piksel): ArtRef => art(kunci, p.w * 4, p.h * 4, p.svg(4));

// ------------------------------------------------------------------ adegan

function buat(): SceneSpec {
  const Y_AKSI = 400;
  const aksi = (refId: IkonAksiA04, x: number, label: string): SceneObjectSpec => ({
    id: `aksi-${refId}`, role: 'option', stepId: 'tindak', refId, fx: 'choose',
    x, y: Y_AKSI, art: gambar(`a04-aksi-${refId}-piksel`, papanAksiA04(refId)), label, depth: 20,
    hit: { w: 96, h: 90 },
  });
  const sopir = gambar('a04-sopir-piksel', pikselDariRle(SOPIR_A04));
  const truk = gambar('acara-truk-piksel', pikselDariRle(TRUK_ACARA));
  return {
    missionId: 'a04-peti-kurang',
    acakPosisi: ['tindak'],
    // T-061a: gaya piksel; latar = halaman gudang Episode 2 + pelabuhan (derek, peti kemas) di balik pagar (./a04.gen.ts).
    gaya: 'piksel',
    background: gambar('a04-latar-piksel', pikselDariRle(LATAR_A04)),
    props: [
      // Di depan bak truk, di antara kabin dan papan klip; kaki berhenti tepat di atas label "Daftar kiriman".
      // Truk kiriman di kiri (dulu bagian latar misi 6): daftar kiriman tergantung di baknya.
      { id: 'truk', x: 128, y: 222, art: truk, depth: 6 },
      { id: 'sopir', x: 112, y: 307 - sopir.h / 2, art: sopir, motion: 'bob', depth: 7 },
      { id: 'peti', x: 376, y: 260, art: gambar('a04-peti-piksel', tumpukanA04()), depth: 8 },
    ],
    hero: { x: 598, y: 478 },
    walk: { minX: 70, maxX: 600, minY: 458, maxY: 478 },
    boards: [
      {
        // Lebar 236 (misi 6: 220): nilai dua digit ("17 peti") butuh ruang di samping "Kemasan baik".
        id: 'catatan', x: 122, y: 14, w: 236, title: 'Catatan petugas',
        lines: [
          { stepId: 'selisih', label: 'Belum tiba' },
          { stepId: 'baik', label: 'Kemasan baik' },
        ],
      },
    ],
    objects: [
      {
        id: 'dok-kiriman', role: 'doc', refId: 'pengiriman',
        x: 186, y: 256, art: gambar('a04-kiriman-piksel', papanKirimanA04()), label: 'Daftar kiriman', depth: 20,
      },
      {
        // Kolom kanan rapat (foto - lembar - papan aksi): label dinaikkan 6 seperti misi 6.
        id: 'dok-foto', role: 'doc', refId: 'foto',
        x: 562, y: 144, art: gambar('a04-foto-piksel', fotoEnamA04()), label: 'Foto peti', depth: 20,
        labelDy: -6,
      },
      {
        id: 'dok-terima', role: 'doc', refId: 'penerimaan',
        x: 562, y: 270, art: gambar('a04-terima-piksel', lembarTerimaA04()), label: 'Bukti terima', depth: 20,
        labelDy: -6,
      },
      // x di sini hanya daftar slot: engine mengacaknya secara deterministik (acakPosisi, benih id misi),
      // jadi urutan DAFTAR ini yang menentukan papan mana menempati slot mana. Urutan dipilih supaya
      // susunan papan tidak mengulang susunan misi 6 (papan & dua ikonnya dipakai ulang dari sana):
      // bila daftar ini diubah, periksa ulang hasil acakSlot() untuk kedua misi.
      aksi('ttd', 108, 'Teken'),
      aksi('catat', 238, 'Lengkapi'),
      aksi('separuh', 368, 'Selisih'),
      aksi('semua', 498, 'Klaim'),
    ],
  };
}

export const adegan: { missionId: string; buat: () => SceneSpec } = { missionId: 'a04-peti-kurang', buat };
