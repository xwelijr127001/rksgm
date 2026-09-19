/**
 * BANK SOAL - kontrak data antara server, halaman host, dan client.
 *
 * Gagasan: daftar soal sebuah pertandingan adalah DATA ("playlist" per room), bukan kode.
 *  - Paket bawaan `latihan` = 10 misi di shared/missions.ts   (dipakai mode solo).
 *  - Paket bawaan `acara`   = 10 misi di shared/missions.acara.ts (bawaan untuk room acara).
 *  - Soal `kustom` dibuat panitia dari halaman host: gambar buatan desainer + pertanyaan.
 *    Tidak perlu coding; tampil lewat jalur "adegan gambar" (MissionPublic.image).
 *
 * PENTING: berkas ini TIDAK memuat kunci jawaban paket bawaan. `SoalKustom` memang membawa
 * kunci (dibutuhkan editor), karena itu hanya boleh lewat API bank yang terlindungi.
 * Rancangan lengkap: docs/rancangan-bank-soal.md
 */

import type { Product } from './types';

export type IdPaket = 'latihan' | 'acara';

/** 1 = mudah, 2 = sedang, 3 = sulit. */
export type Tingkat = 1 | 2 | 3;

export type AsalSoal = IdPaket | 'kustom';

/** Ringkasan satu soal untuk daftar bank & playlist (tanpa isi pertanyaan, tanpa kunci). */
export interface RingkasSoal {
  id: string;
  judul: string;
  produk: Product;
  tingkat: Tingkat;
  asal: AsalSoal;
  /** Jumlah pertanyaan (langkah) di dalam soal. */
  langkah: number;
  /** Durasi menjawab, detik. */
  durasi: number;
  /** Alamat gambar (soal kustom) atau null (adegan 2D bawaan). */
  gambar: string | null;
}

/** Jawaban GET /api/bank. */
export interface BankSoal {
  /** Urutan id tiap paket bawaan. */
  paket: Record<IdPaket, string[]>;
  /** Semua soal yang bisa dimasukkan ke playlist. */
  soal: RingkasSoal[];
  /** Paket yang dipakai room baru bila host tidak memilih. */
  bawaan: IdPaket;
}

export const BATAS_PLAYLIST = { min: 1, maks: 20 } as const;

// ------------------------------------------------------------------ soal kustom

export type JenisLangkahKustom = 'single' | 'multi' | 'number';

export interface OpsiKustom {
  id: string;
  label: string;
}

export interface LangkahKustom {
  id: string;
  kind: JenisLangkahKustom;
  prompt: string;
  hint?: string;
  /** single/multi: 2-6 opsi. */
  options?: OpsiKustom[];
  /** single: tepat 1 id; multi: 1..n id opsi yang benar. */
  benar?: string[];
  /** number: nilai benar + toleransi (bawaan 0) + satuan tampil. */
  nilai?: number;
  toleransi?: number;
  unit?: string;
  format?: 'rupiah' | 'angka';
  /** Penjelasan yang tampil saat pembahasan. */
  penjelasan: string;
}

/** Soal buatan panitia. MEMUAT KUNCI: hanya untuk editor host lewat API bank. */
export interface SoalKustom {
  id: string;
  title: string;
  product: Product;
  tingkat: Tingkat;
  /** Cerita singkat (dibawakan Miss Raksa saat briefing). */
  story: string;
  /** Kalimat tugas ("Pilih ..."). */
  instruction: string;
  /** Satu kalimat "yang dibawa pulang". */
  learning: string;
  durationSeconds: number;
  image: { src: string; alt: string } | null;
  steps: LangkahKustom[];
  diubah?: number;
}

export const BATAS_KUSTOM = {
  judul: 60,
  cerita: 280,
  tugas: 140,
  pelajaran: 200,
  prompt: 140,
  opsi: 60,
  penjelasan: 240,
  langkahMaks: 4,
  opsiMin: 2,
  opsiMaks: 6,
  durasiMin: 20,
  durasiMaks: 180,
  /** Byte. */
  gambarMaks: 3 * 1024 * 1024,
} as const;

// ------------------------------------------------------------------ info room (validasi kode)

/** Jawaban GET /api/room/:code/info (200). */
export interface InfoRoom {
  ok: true;
  code: string;
  eventName: string;
  phase: string;
  playerCount: number;
  bisaGabung: boolean;
  /** Teks Indonesia (dicocokkan client/src/i18n/galat.ts) bila bisaGabung = false. */
  alasan?: string;
}

/** Jawaban GET /api/acara-terbuka. `acara` terisi hanya bila TEPAT satu room sedang di lobby. */
export interface AcaraTerbuka {
  ok: true;
  acara: { code: string; eventName: string; playerCount: number } | null;
}
