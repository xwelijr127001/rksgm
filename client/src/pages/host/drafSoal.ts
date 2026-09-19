/**
 * Draf soal kustom di editor host: bentuk isian (angka masih berupa teks ketikan), konversi
 * dari/ke `SoalKustom`, dan validasi di client yang MENCERMINKAN validasi server
 * (docs/rancangan-bank-soal.md "Validasi server"). Server tetap penentu akhir; validasi di sini
 * hanya supaya panitia tahu salahnya sebelum menekan simpan.
 *
 * Tanpa React & tanpa teks tampil: galat berupa kunci kamus `bank.*` + parameter, diterjemahkan
 * saat render.
 */

import { BATAS_KUSTOM, type JenisLangkahKustom, type LangkahKustom, type SoalKustom, type Tingkat } from '@shared/bankSoal';
import type { Product } from '@shared/types';

export interface DrafOpsi {
  id: string;
  label: string;
}

export interface DrafLangkah {
  id: string;
  kind: JenisLangkahKustom;
  prompt: string;
  hint: string;
  options: DrafOpsi[];
  benar: string[];
  nilai: string;
  toleransi: string;
  unit: string;
  format: 'rupiah' | 'angka';
  penjelasan: string;
}

export interface DrafSoal {
  /** Kosong = soal baru (server yang membuat id `k-...`). */
  id: string;
  title: string;
  product: Product;
  tingkat: Tingkat;
  story: string;
  instruction: string;
  learning: string;
  durasi: string;
  image: { src: string; alt: string } | null;
  steps: DrafLangkah[];
}

/** Batas yang tidak ada di BATAS_KUSTOM (teks pendek pendamping). */
export const BATAS_LAIN = { alt: 140, satuan: 12, durasiBawaan: 60 } as const;

export const DAFTAR_PRODUK: Product[] = ['AUTO', 'HVC', 'FIRE', 'CARGO', 'MIX'];
export const DAFTAR_TINGKAT: Tingkat[] = [1, 2, 3];
export const DAFTAR_JENIS: JenisLangkahKustom[] = ['single', 'multi', 'number'];

/** Id pertama berpola `<awalan><n>` yang belum dipakai (s1.., o1..: sama dengan buatan server). */
export function idBaru(awalan: string, terpakai: string[]): string {
  let n = 1;
  while (terpakai.includes(`${awalan}${n}`)) n += 1;
  return `${awalan}${n}`;
}

export function langkahKosong(terpakai: string[]): DrafLangkah {
  return {
    id: idBaru('s', terpakai),
    kind: 'single',
    prompt: '',
    hint: '',
    options: [
      { id: 'o1', label: '' },
      { id: 'o2', label: '' },
    ],
    benar: [],
    nilai: '',
    toleransi: '0',
    unit: '',
    format: 'angka',
    penjelasan: '',
  };
}

export function drafKosong(): DrafSoal {
  return {
    id: '',
    title: '',
    product: 'AUTO',
    tingkat: 1,
    story: '',
    instruction: '',
    learning: '',
    durasi: String(BATAS_LAIN.durasiBawaan),
    image: null,
    steps: [langkahKosong([])],
  };
}

export function drafDari(soal: SoalKustom): DrafSoal {
  const steps: DrafLangkah[] = [];
  for (const s of soal.steps) {
    const options = (s.options ?? []).map((o, i) => ({ id: o.id || `o${i + 1}`, label: o.label ?? '' }));
    while (options.length < BATAS_KUSTOM.opsiMin) options.push({ id: idBaru('o', options.map((o) => o.id)), label: '' });
    steps.push({
      id: s.id || idBaru('s', steps.map((x) => x.id)),
      kind: s.kind === 'multi' || s.kind === 'number' ? s.kind : 'single',
      prompt: s.prompt ?? '',
      hint: s.hint ?? '',
      options,
      benar: (s.benar ?? []).filter((id) => options.some((o) => o.id === id)),
      nilai: Number.isFinite(s.nilai) ? String(s.nilai) : '',
      toleransi: Number.isFinite(s.toleransi) ? String(s.toleransi) : '0',
      unit: s.unit ?? '',
      format: s.format === 'rupiah' ? 'rupiah' : 'angka',
      penjelasan: s.penjelasan ?? '',
    });
  }
  return {
    id: soal.id,
    title: soal.title ?? '',
    product: DAFTAR_PRODUK.includes(soal.product) ? soal.product : 'MIX',
    tingkat: DAFTAR_TINGKAT.includes(soal.tingkat) ? soal.tingkat : 2,
    story: soal.story ?? '',
    instruction: soal.instruction ?? '',
    learning: soal.learning ?? '',
    durasi: String(Number.isFinite(soal.durationSeconds) ? soal.durationSeconds : BATAS_LAIN.durasiBawaan),
    image: soal.image?.src ? { src: soal.image.src, alt: soal.image.alt ?? '' } : null,
    steps: steps.length > 0 ? steps : [langkahKosong([])],
  };
}

/**
 * Ketikan panitia -> angka; teks lain -> NaN. Cara tulis Indonesia didahulukan:
 * "1.500.000" dan "1.500" = ribuan, "1,5" = desimal. "12.5" (bukan pola ribuan) = desimal.
 */
export function bacaAngka(teks: string): number {
  const rapat = teks.replace(/\s/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(rapat)) return Number(rapat.replace(/\./g, '').replace(',', '.'));
  if (/^-?\d+(,\d+)?$/.test(rapat)) return Number(rapat.replace(',', '.'));
  if (/^-?\d+\.\d+$/.test(rapat)) return Number(rapat);
  return Number.NaN;
}

/** Draf -> kiriman ke server. Panggil setelah `periksaDraf` bersih. */
export function soalDariDraf(d: DrafSoal): SoalKustom {
  const steps: LangkahKustom[] = d.steps.map((s) => {
    const dasar = { id: s.id, kind: s.kind, prompt: s.prompt.trim(), penjelasan: s.penjelasan.trim() };
    const hint = s.hint.trim() ? { hint: s.hint.trim() } : {};
    if (s.kind === 'number') {
      const toleransi = bacaAngka(s.toleransi);
      return {
        ...dasar,
        ...hint,
        nilai: bacaAngka(s.nilai),
        toleransi: Number.isFinite(toleransi) ? toleransi : 0,
        format: s.format,
        ...(s.unit.trim() ? { unit: s.unit.trim() } : {}),
      };
    }
    const options = s.options.map((o) => ({ id: o.id, label: o.label.trim() }));
    const benar = options.map((o) => o.id).filter((id) => s.benar.includes(id));
    return { ...dasar, ...hint, options, benar };
  });
  return {
    id: d.id,
    title: d.title.trim(),
    product: d.product,
    tingkat: d.tingkat,
    story: d.story.trim(),
    instruction: d.instruction.trim(),
    learning: d.learning.trim(),
    durationSeconds: Math.round(bacaAngka(d.durasi)),
    image: d.image ? { src: d.image.src, alt: d.image.alt.trim() } : null,
    steps,
  };
}

// ------------------------------------------------------------------ validasi

export interface GalatIsian {
  /** Kunci kamus (ruang `bank`), mis. 'bank.vWajib'. */
  kunci: string;
  param?: Record<string, string | number>;
}

/** Alamat isian -> galat. Alamat: 'title', 'image.alt', 'steps.0.prompt', 'steps.0.options.2', 'steps.0.benar'. */
export type GalatDraf = Record<string, GalatIsian>;

function teks(galat: GalatDraf, alamat: string, nilai: string, maks: number, wajib: boolean): void {
  const n = nilai.trim().length;
  if (wajib && n === 0) galat[alamat] = { kunci: 'bank.vWajib' };
  else if (n > maks) galat[alamat] = { kunci: 'bank.vTerlaluPanjang', param: { maks } };
}

export function periksaDraf(d: DrafSoal): GalatDraf {
  const g: GalatDraf = {};
  teks(g, 'title', d.title, BATAS_KUSTOM.judul, true);
  teks(g, 'story', d.story, BATAS_KUSTOM.cerita, true);
  teks(g, 'instruction', d.instruction, BATAS_KUSTOM.tugas, true);
  teks(g, 'learning', d.learning, BATAS_KUSTOM.pelajaran, true);

  const durasi = bacaAngka(d.durasi);
  if (!Number.isFinite(durasi) || !Number.isInteger(durasi) || durasi < BATAS_KUSTOM.durasiMin || durasi > BATAS_KUSTOM.durasiMaks) {
    g.durasi = { kunci: 'bank.vDurasi', param: { min: BATAS_KUSTOM.durasiMin, maks: BATAS_KUSTOM.durasiMaks } };
  }

  if (d.image) {
    if (d.image.alt.trim().length === 0) g['image.alt'] = { kunci: 'bank.vAlt' };
    else teks(g, 'image.alt', d.image.alt, BATAS_LAIN.alt, true);
  }

  if (d.steps.length < 1 || d.steps.length > BATAS_KUSTOM.langkahMaks) {
    g.steps = { kunci: 'bank.vJumlahLangkah', param: { maks: BATAS_KUSTOM.langkahMaks } };
  }

  d.steps.forEach((s, i) => {
    const a = `steps.${i}`;
    teks(g, `${a}.prompt`, s.prompt, BATAS_KUSTOM.prompt, true);
    teks(g, `${a}.hint`, s.hint, BATAS_KUSTOM.prompt, false);
    teks(g, `${a}.penjelasan`, s.penjelasan, BATAS_KUSTOM.penjelasan, true);

    if (s.kind === 'number') {
      if (!Number.isFinite(bacaAngka(s.nilai))) g[`${a}.nilai`] = { kunci: 'bank.vAngka' };
      const tol = s.toleransi.trim() === '' ? 0 : bacaAngka(s.toleransi);
      if (!Number.isFinite(tol) || tol < 0) g[`${a}.toleransi`] = { kunci: 'bank.vToleransi' };
      teks(g, `${a}.unit`, s.unit, BATAS_LAIN.satuan, false);
      return;
    }

    if (s.options.length < BATAS_KUSTOM.opsiMin || s.options.length > BATAS_KUSTOM.opsiMaks) {
      g[`${a}.options`] = { kunci: 'bank.vJumlahOpsi', param: { min: BATAS_KUSTOM.opsiMin, maks: BATAS_KUSTOM.opsiMaks } };
    }
    const dilihat = new Set<string>();
    s.options.forEach((o, j) => {
      teks(g, `${a}.options.${j}`, o.label, BATAS_KUSTOM.opsi, true);
      const kunci = o.label.trim().toLowerCase();
      if (kunci && dilihat.has(kunci) && !g[`${a}.options.${j}`]) g[`${a}.options.${j}`] = { kunci: 'bank.vOpsiKembar' };
      dilihat.add(kunci);
    });
    const benar = s.benar.filter((id) => s.options.some((o) => o.id === id));
    if (s.kind === 'single' && benar.length !== 1) g[`${a}.benar`] = { kunci: 'bank.vSatuBenar' };
    if (s.kind === 'multi' && (benar.length < 1 || benar.length >= s.options.length)) g[`${a}.benar`] = { kunci: 'bank.vMultiBenar' };
  });

  return g;
}
