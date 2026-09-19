/**
 * SOAL KUSTOM (buatan panitia): validasi + konversi ke bentuk misi. SERVER ONLY.
 *
 * `SoalKustom` memuat kunci jawaban (dibutuhkan editor host), jadi hanya boleh keluar lewat
 * API bank yang terotorisasi. Yang dikirim ke pemain adalah hasil `kustomKeMisi().misi`
 * (tanpa kunci); `kunci`-nya diperlakukan sama seperti answerKeys.ts: baru terbuka saat REVEAL.
 * Fungsi di sini murni (tanpa DB / berkas) supaya mudah diuji. Kontrak: docs/rancangan-bank-soal.md
 */

import { randomInt } from 'node:crypto';
import {
  BATAS_KUSTOM,
  type JenisLangkahKustom,
  type LangkahKustom,
  type OpsiKustom,
  type SoalKustom,
  type Tingkat,
} from '../../shared/bankSoal';
import { PHASE_DURATIONS } from '../../shared/brand';
import { formatRupiah, type MissionKey, type StepKey } from '../../shared/scoring';
import type { MissionPublic, Product, StepDef } from '../../shared/types';
import { teksAman } from './teks';

export const POLA_ID_KUSTOM = /^k-[a-z0-9]{8}$/;
/** Alamat gambar hasil unggahan: nama = hash isi + ekstensi dari magic bytes (lihat gambarSoal.ts). */
export const POLA_SRC_GAMBAR = /^\/gambar-soal\/[a-f0-9]{32}\.(png|jpg|webp)$/;

const HURUF_ID = 'abcdefghjkmnpqrstuvwxyz23456789';
const PRODUK: Product[] = ['AUTO', 'HVC', 'FIRE', 'CARGO', 'MIX'];
const JENIS: JenisLangkahKustom[] = ['single', 'multi', 'number'];
const POLA_ID_BAGIAN = /^[A-Za-z0-9][A-Za-z0-9-]{0,23}$/;
const BATAS_SATUAN = 12;
const NILAI_MAKS = 1e15;

/** Label produk yang tampil di kartu misi (sama gayanya dengan shared/missions.ts). */
export const LABEL_PRODUK: Record<Product, string> = {
  AUTO: 'AUTO - Kendaraan Bermotor',
  HVC: 'HVC - Alat Berat',
  FIRE: 'FIRE / PROPERTY - Kebakaran & Harta Benda',
  CARGO: 'CARGO - Pengangkutan Barang',
  MIX: 'Gabungan Produk',
};

/** Soal kustom tidak punya lokasi di peta; label netral ini yang tampil di chip lokasi. */
const LOKASI_KUSTOM = 'Kota Raksa';

export function idKustomBaru(): string {
  let id = 'k-';
  for (let i = 0; i < 8; i++) id += HURUF_ID[randomInt(HURUF_ID.length)];
  return id;
}

export type HasilValidasi = { ok: true; soal: SoalKustom } | { ok: false; rincian: string[] };

export interface OpsiValidasi {
  /** Id soal yang dipakai pada hasil (id kiriman client diabaikan). */
  id: string;
  /** Cek berkas gambar benar-benar ada (hasil unggahan). Tanpa ini hanya pola alamat yang dicek. */
  gambarAda?: (src: string) => boolean;
}

function objek(raw: unknown): Record<string, unknown> | null {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

/** Id langkah/opsi kiriman client: hanya huruf, angka, tanda hubung; bukan nama bawaan Object. */
function idBagian(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const id = raw.trim();
  if (!POLA_ID_BAGIAN.test(id) || id in {}) return '';
  return id;
}

/**
 * Periksa & rapikan soal kustom kiriman editor. Semua pelanggaran dikumpulkan di `rincian`
 * (teks Indonesia, siap tampil) supaya panitia bisa memperbaiki sekaligus.
 */
export function validasiSoalKustom(raw: unknown, opsi: OpsiValidasi): HasilValidasi {
  const src = objek(raw);
  if (!src) return { ok: false, rincian: ['Data soal tidak terbaca.'] };
  const rincian: string[] = [];

  /** Teks wajib/opsional dengan batas panjang. */
  const teks = (nilai: unknown, nama: string, maks: number, wajib: boolean): string => {
    const s = teksAman(nilai);
    if (!s && wajib) rincian.push(`${nama} wajib diisi.`);
    if (s.length > maks) rincian.push(`${nama} maksimal ${maks} karakter.`);
    return s;
  };

  const title = teks(src.title, 'Judul', BATAS_KUSTOM.judul, true);
  const story = teks(src.story, 'Cerita', BATAS_KUSTOM.cerita, true);
  const instruction = teks(src.instruction, 'Tugas', BATAS_KUSTOM.tugas, true);
  const learning = teks(src.learning, 'Pelajaran', BATAS_KUSTOM.pelajaran, true);

  const product = PRODUK.find((p) => p === src.product);
  if (!product) rincian.push('Produk tidak dikenal.');

  const tingkat = [1, 2, 3].find((n) => n === src.tingkat) as Tingkat | undefined;
  if (!tingkat) rincian.push('Tingkat harus 1, 2, atau 3.');

  const durasi = typeof src.durationSeconds === 'number' ? Math.round(src.durationSeconds) : NaN;
  if (!Number.isFinite(durasi) || durasi < BATAS_KUSTOM.durasiMin || durasi > BATAS_KUSTOM.durasiMaks) {
    rincian.push(`Durasi harus antara ${BATAS_KUSTOM.durasiMin} dan ${BATAS_KUSTOM.durasiMaks} detik.`);
  }

  // ---------------------------------------------------------------- gambar
  let image: SoalKustom['image'] = null;
  if (src.image !== null && src.image !== undefined) {
    const g = objek(src.image);
    const alamat = g && typeof g.src === 'string' ? g.src : '';
    if (!POLA_SRC_GAMBAR.test(alamat)) {
      rincian.push('Gambar harus berasal dari unggahan di halaman ini.');
    } else if (opsi.gambarAda && !opsi.gambarAda(alamat)) {
      rincian.push('Berkas gambar tidak ditemukan. Unggah ulang gambarnya.');
    } else {
      // Teks alternatif kosong -> judul soal, supaya pembaca layar tetap punya keterangan.
      const alt = teks(g?.alt, 'Keterangan gambar', BATAS_KUSTOM.tugas, false) || title;
      image = { src: alamat, alt };
    }
  }

  // ---------------------------------------------------------------- pertanyaan
  const langkahMentah = Array.isArray(src.steps) ? src.steps : [];
  if (langkahMentah.length < 1 || langkahMentah.length > BATAS_KUSTOM.langkahMaks) {
    rincian.push(`Soal harus punya 1 sampai ${BATAS_KUSTOM.langkahMaks} pertanyaan.`);
  }

  const steps: LangkahKustom[] = [];
  const idLangkahTerpakai = new Set<string>();
  langkahMentah.slice(0, BATAS_KUSTOM.langkahMaks).forEach((mentah, i) => {
    const n = i + 1;
    const l = objek(mentah) ?? {};
    const sebut = `Pertanyaan ${n}`;

    let id = idBagian(l.id);
    if (id && idLangkahTerpakai.has(id)) {
      rincian.push(`${sebut}: id pertanyaan tidak boleh sama dengan pertanyaan lain.`);
    }
    if (!id) {
      // Id buatan server: s1.. (lompati yang sudah dipakai kiriman client).
      let k = n;
      while (idLangkahTerpakai.has(`s${k}`)) k++;
      id = `s${k}`;
    }
    idLangkahTerpakai.add(id);

    const kind = JENIS.find((j) => j === l.kind);
    if (!kind) rincian.push(`${sebut}: jenis harus single, multi, atau number.`);

    const prompt = teks(l.prompt, `${sebut}: teks pertanyaan`, BATAS_KUSTOM.prompt, true);
    const hint = teks(l.hint, `${sebut}: petunjuk`, BATAS_KUSTOM.prompt, false);
    const penjelasan = teks(l.penjelasan, `${sebut}: penjelasan`, BATAS_KUSTOM.penjelasan, true);

    const hasil: LangkahKustom = { id, kind: kind ?? 'single', prompt, penjelasan };
    if (hint) hasil.hint = hint;

    if (kind === 'single' || kind === 'multi') {
      const opsiMentah = Array.isArray(l.options) ? l.options : [];
      if (opsiMentah.length < BATAS_KUSTOM.opsiMin || opsiMentah.length > BATAS_KUSTOM.opsiMaks) {
        rincian.push(`${sebut}: butuh ${BATAS_KUSTOM.opsiMin} sampai ${BATAS_KUSTOM.opsiMaks} pilihan.`);
      }
      const options: OpsiKustom[] = opsiMentah.slice(0, BATAS_KUSTOM.opsiMaks).map((om, j) => {
        const o = objek(om) ?? {};
        return {
          id: idBagian(o.id) || `o${j + 1}`,
          label: teks(o.label, `${sebut}, pilihan ${j + 1}: teks`, BATAS_KUSTOM.opsi, true),
        };
      });
      const idOpsi = options.map((o) => o.id);
      if (new Set(idOpsi).size !== idOpsi.length) rincian.push(`${sebut}: id pilihan tidak boleh sama.`);

      const benarMentah = Array.isArray(l.benar) ? l.benar.filter((x): x is string => typeof x === 'string') : [];
      const benar = Array.from(new Set(benarMentah));
      if (benar.some((b) => !idOpsi.includes(b))) {
        rincian.push(`${sebut}: jawaban benar harus salah satu pilihan.`);
      } else if (kind === 'single' && benar.length !== 1) {
        rincian.push(`${sebut}: tandai tepat 1 jawaban benar.`);
      } else if (kind === 'multi' && benar.length < 1) {
        rincian.push(`${sebut}: tandai minimal 1 jawaban benar.`);
      } else if (kind === 'multi' && benar.length >= options.length) {
        rincian.push(`${sebut}: jawaban benar tidak boleh semua pilihan.`);
      }
      hasil.options = options;
      // Urutan kunci mengikuti urutan pilihan supaya pembahasan tampil konsisten.
      hasil.benar = idOpsi.filter((x) => benar.includes(x));
    }

    if (kind === 'number') {
      const nilai = typeof l.nilai === 'number' ? l.nilai : typeof l.nilai === 'string' && l.nilai.trim() !== '' ? Number(l.nilai) : NaN;
      if (!Number.isFinite(nilai)) rincian.push(`${sebut}: nilai jawaban harus berupa angka.`);
      else if (Math.abs(nilai) > NILAI_MAKS) rincian.push(`${sebut}: nilai jawaban terlalu besar.`);
      const toleransi = l.toleransi === undefined || l.toleransi === null ? 0 : Number(l.toleransi);
      if (!Number.isFinite(toleransi) || toleransi < 0 || toleransi > NILAI_MAKS) {
        rincian.push(`${sebut}: toleransi harus angka 0 atau lebih.`);
      }
      const unit = teks(l.unit, `${sebut}: satuan`, BATAS_SATUAN, false);
      hasil.nilai = nilai;
      hasil.toleransi = toleransi;
      if (unit) hasil.unit = unit;
      hasil.format = l.format === 'rupiah' ? 'rupiah' : 'angka';
    }

    steps.push(hasil);
  });

  if (rincian.length || !product || !tingkat) return { ok: false, rincian };

  return {
    ok: true,
    soal: { id: opsi.id, title, product, tingkat, story, instruction, learning, durationSeconds: durasi, image, steps },
  };
}

/** Jawaban benar satu pertanyaan sebagai teks (untuk ringkasan pembahasan). */
function teksBenar(l: LangkahKustom): string {
  if (l.kind === 'number') {
    const nilai = l.nilai ?? 0;
    return l.format === 'rupiah' ? formatRupiah(nilai) : `${nilai}${l.unit ? ' ' + l.unit : ''}`;
  }
  return (l.benar ?? []).map((id) => l.options?.find((o) => o.id === id)?.label ?? id).join(', ');
}

function labelInteraksi(steps: LangkahKustom[]): string {
  if (steps.length > 1) return `Jawab ${steps.length} pertanyaan`;
  const l = steps[0];
  if (!l) return 'Pilih jawaban';
  if (l.kind === 'multi') return `Pilih ${l.benar?.length ?? 1} jawaban`;
  if (l.kind === 'number') return 'Isi angka yang tepat';
  return 'Pilih satu jawaban';
}

/**
 * SoalKustom (sudah tervalidasi) -> misi publik + kunci. `number` = 0 dan `roundIndex` = -1:
 * keduanya diisi room sesuai posisi soal di playlist.
 */
export function kustomKeMisi(soal: SoalKustom): { misi: MissionPublic; kunci: MissionKey } {
  const steps: StepDef[] = [];
  const kunciLangkah: StepKey[] = [];

  for (const l of soal.steps) {
    const dasar = { id: l.id, prompt: l.prompt, weight: 1, ...(l.hint ? { hint: l.hint } : {}) };
    const options = (l.options ?? []).map((o) => ({ id: o.id, label: o.label }));
    const benar = l.benar ?? [];

    if (l.kind === 'single') {
      steps.push({ ...dasar, kind: 'single', options, presentation: 'list' });
      kunciLangkah.push({ stepId: l.id, weight: 1, single: benar[0] ?? '', explanation: l.penjelasan });
    } else if (l.kind === 'multi') {
      steps.push({ ...dasar, kind: 'multi', options, requiredSelections: benar.length, presentation: 'checklist' });
      kunciLangkah.push({
        stepId: l.id,
        weight: 1,
        multi: [...benar],
        requiredSelections: benar.length,
        explanation: l.penjelasan,
      });
    } else {
      steps.push({
        ...dasar,
        kind: 'number',
        format: l.format === 'rupiah' ? 'rupiah' : 'angka',
        ...(l.unit ? { unit: l.unit } : {}),
      });
      kunciLangkah.push({
        stepId: l.id,
        weight: 1,
        number: { value: l.nilai ?? 0, tolerance: l.toleransi ?? 0 },
        explanation: l.penjelasan,
      });
    }
  }

  const misi: MissionPublic = {
    id: soal.id,
    number: 0,
    title: soal.title,
    product: soal.product,
    productLabel: LABEL_PRODUK[soal.product],
    location: LOKASI_KUSTOM,
    scene: 'gambar',
    story: soal.story,
    instruction: soal.instruction,
    interactionLabel: labelInteraksi(soal.steps),
    durationSeconds: soal.durationSeconds,
    briefingSeconds: PHASE_DURATIONS.briefingMs / 1000,
    steps,
    learning: soal.learning,
    rakiBriefing: soal.story,
    level: soal.tingkat,
    image: soal.image ? { ...soal.image } : null,
  };

  const kunci: MissionKey = {
    missionId: soal.id,
    roundIndex: -1,
    summary: soal.steps.map(teksBenar).join(' | '),
    steps: kunciLangkah,
  };

  return { misi, kunci };
}
