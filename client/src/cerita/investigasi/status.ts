/**
 * T-076 EPISODE 1 INVESTIGATOR (rencana Task 1): STATUS investigasi, dibaca MURNI dari state cerita (tanda). Tanpa React,
 * tanpa penyimpanan: muat ulang di tengah kasus memberi status yang sama karena state cerita yang menyimpannya (simpan.ts
 * cerita, entri per episode: auto-2, auto-2-dev, auto-2-inv tidak saling bocor).
 *
 * Tanda (dipasang efek node episode, lihat NodeInvestigasi di cerita/tipe.ts):
 *   catat:<idPernyataan>                     pernyataan dicatat ke buku
 *   bukti:<idBukti>                          kartu bukti terkumpul
 *   keb:tepat | keb:tepat-kedua | keb:dipandu   hasil KEBERATAN (percobaan pertama / kedua / dipandu Miss Raksa)
 *   putusan:layak | putusan:tambahan | putusan:polis
 *   pesan:baik | pesan:datar | pesan:janji   pesan ke nasabah
 *   tebak:1..4                               (T-087) tebakan lajur di pembuka; tidak dinilai
 *   koreksi:<idPernyataan>                   (T-087) pernyataan itu sudah dikoreksi pembuatnya (petugas tol: lajur 3 -> 2)
 *
 * Tipe kontrak (rencana "Interfaces", dipakai komponen Task 2): Bukti, Pernyataan, HasilKeberatan.
 */
import type { BuktiInvestigasi, Episode, PernyataanInvestigasi, StateCerita } from '../tipe';

export type Bukti = BuktiInvestigasi;
export type Pernyataan = PernyataanInvestigasi;
export type HasilKeberatan = 'tepat' | 'tepat-kedua' | 'dipandu';
export type Putusan = 'layak' | 'tambahan' | 'polis';
export type Pesan = 'baik' | 'datar' | 'janji';

export const HASIL_KEBERATAN: readonly HasilKeberatan[] = ['tepat', 'tepat-kedua', 'dipandu'];
export const PUTUSAN: readonly Putusan[] = ['layak', 'tambahan', 'polis'];
export const PESAN: readonly Pesan[] = ['baik', 'datar', 'janji'];

export const tandaCatat = (id: string): string => `catat:${id}`;
export const tandaBukti = (id: string): string => `bukti:${id}`;
export const tandaKeberatan = (h: HasilKeberatan): string => `keb:${h}`;
export const tandaPutusan = (p: Putusan): string => `putusan:${p}`;
export const tandaPesan = (p: Pesan): string => `pesan:${p}`;
/** T-087: lajur yang ditebak tamu di bingkai pembuka. */
export type Lajur = 1 | 2 | 3 | 4;
export const LAJUR: readonly Lajur[] = [1, 2, 3, 4];
export const tandaTebak = (n: Lajur): string => `tebak:${n}`;
export const tandaKoreksi = (id: string): string => `koreksi:${id}`;

type Tanda = Pick<StateCerita, 'tanda'>;
const punya = (s: Tanda, t: string): boolean => s.tanda.includes(t);

/** Pernyataan yang sudah dicatat, urut naskah (`Episode.investigasi.pernyataan`). */
export function pernyataanTercatat(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan[] {
  return (ep.investigasi?.pernyataan ?? []).filter((p) => punya(s, tandaCatat(p.id)));
}

/** Kartu bukti yang sudah terkumpul, urut naskah. Hanya kartu ini yang boleh ditawarkan di layar KEBERATAN. */
export function buktiTerkumpul(ep: Pick<Episode, 'investigasi'>, s: Tanda): Bukti[] {
  return (ep.investigasi?.bukti ?? []).filter((b) => punya(s, tandaBukti(b.id)));
}

export function hasilKeberatan(s: Tanda): HasilKeberatan | null {
  return HASIL_KEBERATAN.find((h) => punya(s, tandaKeberatan(h))) ?? null;
}

export function putusanDipilih(s: Tanda): Putusan | null {
  return PUTUSAN.find((p) => punya(s, tandaPutusan(p))) ?? null;
}

export function pesanDipilih(s: Tanda): Pesan | null {
  return PESAN.find((p) => punya(s, tandaPesan(p))) ?? null;
}

/** T-087: tebakan lajur di pembuka (null = belum menebak, mis. progres lama dari sebelum T-087). */
export function tebakanLajur(s: Tanda): Lajur | null {
  return LAJUR.find((n) => punya(s, tandaTebak(n))) ?? null;
}

/** T-087: pernyataan yang sudah dikoreksi pembuatnya (buku catatan menulis "Laporan dikoreksi" di bawahnya), atau null. */
export function pernyataanDikoreksi(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan | null {
  return (ep.investigasi?.pernyataan ?? []).find((p) => punya(s, tandaKoreksi(p.id))) ?? null;
}

/** Tiga hasil yang dinilai; null selama salah satunya belum ada (kasus belum selesai). */
export function hasilKasus(s: Tanda): { keberatan: HasilKeberatan; putusan: Putusan; pesan: Pesan } | null {
  const keberatan = hasilKeberatan(s);
  const putusan = putusanDipilih(s);
  const pesan = pesanDipilih(s);
  return keberatan && putusan && pesan ? { keberatan, putusan, pesan } : null;
}
