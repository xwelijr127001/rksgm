/**
 * LOGIKA ARENA (fungsi MURNI): susunan arena = MissionAnswer misi sintetis yang sama dengan antarmuka standar, jadi
 * tampilan gambar & tampilan daftar berbagi state, draf, dan penilaian (mesin: aktivitas `langsung`).
 *
 * - susun / tujuan / bandingkan: langkah assign {item: wadah}; lengkap bila semua item punya wadah.
 * - bundel: dua langkah pilih-satu {langkah: opsi}; lengkap bila keduanya terpilih.
 * - pesan: langkah assign yang disusun dengan "masukkan/keluarkan"; yang tidak dimasukkan diisi wadah `tidak` saat
 *   dikirim (jawabanKirim). Lengkap bila minimal satu bagian ada di pesan (pesan kosong tidak dikirim).
 */
import type { MissionAnswer } from '@shared/types';
import type { KonfigArena } from '../../tipe';
import { lepaskan, petaLangkah, tetapkan } from './dasar';
import { semuaItemRambu, sisaRambu } from './rambu';

export type ArenaSusun = Extract<KonfigArena, { pola: 'susun' }>;
export type ArenaTujuan = Extract<KonfigArena, { pola: 'tujuan' }>;
export type ArenaBandingkan = Extract<KonfigArena, { pola: 'bandingkan' }>;
export type ArenaBundel = Extract<KonfigArena, { pola: 'bundel' }>;
export type ArenaPesan = Extract<KonfigArena, { pola: 'pesan' }>;
export type { ArenaRambu } from './rambu';

export { lepaskan, petaLangkah, pilihOpsi, tetapkan } from './dasar';

/** Id item arena berurutan (urutan tampil). */
export function itemArena(k: KonfigArena): string[] {
  switch (k.pola) {
    case 'susun': return k.benda.map((b) => b.id);
    case 'tujuan': return [k.benda.id];
    case 'bandingkan': return k.selisih.map((s) => s.id);
    case 'pesan': return k.benda.map((b) => b.id);
    case 'bundel': return [];
    case 'rambu': return semuaItemRambu(k);
    case 'sim': return [k.benda];
    case 'dashcam': return [k.item]; // T-064: one recorded item (rekaman -> bersih / ragu)
  }
}

/** Banyak bagian yang belum diputuskan (0 = boleh dikirim). */
export function sisaArena(k: KonfigArena, j: MissionAnswer): number {
  switch (k.pola) {
    case 'susun': {
      const p = petaLangkah(j, k.langkah);
      return k.benda.filter((b) => !k.wadah.some((w) => w.id === p[b.id])).length;
    }
    case 'tujuan': {
      const p = petaLangkah(j, k.langkah);
      return k.tujuan.some((t) => t.id === p[k.benda.id]) ? 0 : 1;
    }
    case 'bandingkan': {
      const p = petaLangkah(j, k.langkah);
      return k.selisih.filter((s) => !k.perlakuan.some((w) => w.id === p[s.id])).length;
    }
    case 'bundel': {
      const ada = (langkah: string, pilihan: { id: string }[]) => pilihan.some((o) => o.id === j[langkah]);
      return (ada(k.tindakan.langkah, k.tindakan.pilihan) ? 0 : 1) + (ada(k.kabar.langkah, k.kabar.pilihan) ? 0 : 1);
    }
    case 'pesan': {
      const p = petaLangkah(j, k.langkah);
      return k.benda.some((b) => p[b.id] === k.masuk) ? 0 : 1;
    }
    case 'rambu': return sisaRambu(k, j);
    case 'sim': return petaLangkah(j, k.langkah)[k.benda] ? 0 : 1;
    case 'dashcam': return (petaLangkah(j, k.langkah)[k.item] ? 0 : 1) + (k.simpul && !k.simpul.pilihan.some((o) => o.id === j[k.simpul!.langkah]) ? 1 : 0);
  }
}

/** Item susun berikutnya yang belum punya wadah (urutan tampil), atau null bila semua sudah. */
export function itemBerikut(k: ArenaSusun, j: MissionAnswer): string | null {
  const p = petaLangkah(j, k.langkah);
  return k.benda.find((b) => !k.wadah.some((w) => w.id === p[b.id]))?.id ?? null;
}

/** Item per wadah (urutan tampil), untuk ringkasan per baki. */
export function kelompokWadah(k: ArenaSusun, j: MissionAnswer): Record<string, string[]> {
  const p = petaLangkah(j, k.langkah);
  const hasil: Record<string, string[]> = Object.fromEntries(k.wadah.map((w) => [w.id, [] as string[]]));
  for (const b of k.benda) if (p[b.id] && hasil[p[b.id]!]) hasil[p[b.id]!]!.push(b.id);
  return hasil;
}

/**
 * Bentuk hitung sebuah satuan untuk `jumlah`: teks "tunggal|jamak" (en "document|documents") memberi bentuk tunggal hanya
 * untuk jumlah 1; teks tanpa "|" (id "dokumen", zh "份文件") sama untuk semua jumlah.
 */
export function bentukHitung(teks: string, jumlah: number): string {
  const [tunggal, jamak] = teks.split('|');
  return jamak === undefined || jumlah === 1 ? tunggal! : jamak;
}

/**
 * Satuan untuk kalimat hitungan ringkasan susun ("{n} dari {total} dokumen sudah ditempatkan"). Bentuknya mengikuti angka yang
 * tepat mendahului katanya (`jumlah` = total): "1 of 1 document", "8 of 8 documents". Arena tanpa `satuanHitung` = `satuan`
 * berhuruf kecil (perilaku lama).
 */
export function satuanSesudahAngka(k: Pick<ArenaSusun, 'satuan' | 'satuanHitung'>, tx: (kunci: string) => string, jumlah: number): string {
  return k.satuanHitung !== undefined ? bentukHitung(tx(k.satuanHitung), jumlah) : tx(k.satuan).toLocaleLowerCase('id');
}

/** Bagian pesan yang sedang ada di pesan (urutan tampil). */
export function bagianDiPesan(k: ArenaPesan, j: MissionAnswer): string[] {
  const p = petaLangkah(j, k.langkah);
  return k.benda.filter((b) => p[b.id] === k.masuk).map((b) => b.id);
}

/** Masukkan/keluarkan satu bagian pesan. */
export function alihBagian(k: ArenaPesan, j: MissionAnswer, id: string): MissionAnswer {
  return petaLangkah(j, k.langkah)[id] === k.masuk ? lepaskan(j, k.langkah, id) : tetapkan(j, k.langkah, id, k.masuk);
}

/** Jawaban yang dikirim ke mesin: susunan pesan dilengkapi wadah `tidak`; pola lain apa adanya. */
export function jawabanKirim(k: KonfigArena, j: MissionAnswer): MissionAnswer {
  if (k.pola !== 'pesan') return j;
  const p = petaLangkah(j, k.langkah);
  return { ...j, [k.langkah]: Object.fromEntries(k.benda.map((b) => [b.id, p[b.id] === k.masuk ? k.masuk : k.tidak])) };
}
