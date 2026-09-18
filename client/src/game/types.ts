/**
 * Kontrak adegan 2D RAKSA GAME (tanpa impor Phaser).
 *
 * Pembagian tugas:
 * - Engine (Phaser)  : menggambar adegan, animasi, karakter, dan menerima ketukan objek.
 * - React            : instruksi, dokumen, kontrol HTML, kirim jawaban, hasil.
 * - Server           : validasi jawaban, fase, deadline, skor, peringkat.
 *
 * Draft jawaban HANYA dimiliki React. Engine tidak menyimpan pilihan sendiri:
 * ia menampilkan `StageView` terbaru dan melaporkan ketukan sebagai data.
 */

import type { IconKey, MissionAnswer, MissionReveal } from '@shared/types';

/** Ukuran dunia adegan (satuan logis). Rasio 4:3 dipakai di semua layar. */
export const WORLD_W = 640;
export const WORLD_H = 480;

/** Gambar siap-rasterisasi: string SVG lengkap dengan ukuran dunia. */
export interface ArtRef {
  /** Kunci cache tekstur; gambar dengan kunci sama dirasterisasi sekali. */
  key: string;
  svg: string;
  w: number;
  h: number;
}

/**
 * Peran objek di adegan.
 * - option : opsi langkah single/multi (memilih / mengumpulkan)
 * - item   : item langkah assign (kasus/bukti yang akan dikelompokkan)
 * - bucket : kategori langkah assign (menempatkan item yang sedang dipilih)
 * - doc    : membuka dokumen kasus (kartu polis / tabel) di panel HTML
 * - info   : hanya menampilkan keterangan singkat, tidak mengubah jawaban
 */
export type ObjectRole = 'option' | 'item' | 'bucket' | 'doc' | 'info';

/** Rasa animasi saat objek dipilih. Tidak pernah menilai benar/salah. */
export type ActionFx = 'photo' | 'file' | 'note' | 'talk' | 'choose' | 'stamp' | 'tag';

export interface SceneObjectSpec {
  /** Unik dalam satu adegan. */
  id: string;
  role: ObjectRole;
  /** Langkah misi pemilik objek (option/item/bucket). */
  stepId?: string;
  /**
   * Untuk item yang dinilai di BEBERAPA langkah assign (mis. tiga kasus yang
   * sama di misi 10). Bila diisi, objek aktif pada langkah mana pun di daftar ini
   * dan stiker tiap langkah ditumpuk di atasnya. `stepId` diabaikan.
   */
  stepIds?: string[];
  /** optionId / itemId / bucketId / id dokumen / id keterangan. */
  refId: string;
  /** Titik tengah objek dalam koordinat dunia. */
  x: number;
  y: number;
  art: ArtRef;
  /** Nama singkat yang tampil di adegan (maks ~16 huruf). */
  label: string;
  fx?: ActionFx;
  /** Area sentuh minimal (dunia). Default: ukuran gambar, minimal 76x76. */
  hit?: { w: number; h: number };
  /** Geser posisi label relatif ke bawah objek. */
  labelDy?: number;
  labelDx?: number;
  /** Keterangan untuk peran 'info'. */
  info?: string;
  depth?: number;
}

export interface PropSpec {
  id: string;
  x: number;
  y: number;
  art: ArtRef;
  motion?: 'bob' | 'sway' | 'drift' | 'blink';
  depth?: number;
}

/** Papan yang menampilkan jawaban angka pemain (gema netral, bukan penilaian). */
export interface BoardSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  title: string;
  lines: { stepId: string; label: string }[];
}

export interface SceneSpec {
  missionId: string;
  background: ArtRef;
  props?: PropSpec[];
  /** Posisi awal petugas (pemain). */
  hero: { x: number; y: number; flip?: boolean };
  /** Batas jalan petugas saat mendekati objek. */
  walk?: { minX: number; maxX: number; minY: number; maxY: number };
  objects: SceneObjectSpec[];
  boards?: BoardSpec[];
  /** Tujuan animasi "masuk folder/catatan" (default: tepi bawah adegan = baki HTML). */
  collectTarget?: { x: number; y: number };
  /**
   * Langkah yang objek pilihannya berupa SLOT seragam (ukuran sama). Posisi slot
   * diacak deterministik per misi supaya urutan data (jawaban benar sering pertama)
   * tidak terbaca dari tata letak. Jangan dipakai bila objek terikat posisinya
   * (mis. penyok pada mobil).
   */
  acakPosisi?: string[];
  /**
   * Label singkat kategori assign untuk stiker di adegan (maks ~18 huruf).
   * Kunci: `${stepId}:${bucketId}`. Salinan UI, bukan materi klaim.
   */
  bucketShort?: Record<string, string>;
}

/** Mode adegan diturunkan dari fase server + status kirim. */
export type StageMode = 'intro' | 'play' | 'locked' | 'sent' | 'paused' | 'reveal';

export interface StageView {
  mode: StageMode;
  /** Langkah yang sedang dikerjakan (null = semua langkah). */
  focusStepId: string | null;
  /** Item assign yang sedang dipilih. */
  focusItemId: string | null;
  answer: MissionAnswer;
  reveal: MissionReveal | null;
  reducedMotion: boolean;
}

/** Status tampilan satu objek; dihitung murni dari StageView (lihat draft.ts). */
export interface ObjectState {
  interactive: boolean;
  selected: boolean;
  /** Urutan pilihan pada multi-select (1..n). */
  order: number | null;
  /** Untuk item assign: kategori yang dipilih pemain, satu per langkah. */
  tags: { stepId: string; refId: string; label: string; icon?: IconKey }[];
  focus: boolean;
  /** Objek milik langkah lain (dibuat samar). */
  dim: boolean;
  /** Hanya saat REVEAL: tepat / kurang tepat / terlewat. */
  verdict: 'tepat' | 'kurang' | 'terlewat' | null;
}

/** Ketukan dari engine. Token & id menjaga agar pesan lama dibuang. */
export interface StageTap {
  token: number;
  missionId: string;
  roundIndex: number;
  objectId: string;
}

export interface StageStats {
  renderer: 'webgl' | 'canvas';
  /** ms dari mulai memuat engine sampai adegan tampil. */
  loadMs: number;
  /** ms merasterisasi gambar adegan. */
  rasterMs: number;
  textures: number;
}
