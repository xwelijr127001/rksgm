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
 *   tebak:<idTebakan>                        (T-087) tebakan di pembuka; tidak dinilai. Kasus 1: tebak:1..4 (lajur); T-090
 *                                            kasus 2: tebak:keluarga | tebak:penumpang | tebak:belum (id = konfig.tebak.pilihan)
 *   koreksi:<idPernyataan>                   (T-087) pernyataan itu sudah dikoreksi pembuatnya (petugas tol: lajur 3 -> 2)
 *   panel:<idBabak>:first|second|guided      (T-102, kasus ber-panel) hasil SATU babak panel; kasus 1-2 dan simpanan lama
 *                                            tetap memakai keb:* (babak tunggal 'keberatan')
 *   panel-keliru:<idBabak>:<0|1>:<idBukti>   (T-102) kartu keliru yang diajukan di percobaan itu (tidak dinilai sendiri)
 *   press:<idPernyataan>:<idPress>           (T-102) "Tanya lebih lanjut" pernyataan itu sudah dibuka (tanpa poin)
 *
 * Tipe kontrak (rencana "Interfaces", dipakai komponen Task 2): Bukti, Pernyataan, HasilKeberatan.
 */
import { LEGACY_ROUND_ID, ROUND_OUTCOMES, type RoundOutcome } from '@shared/investigator/rubric';
import type { BuktiInvestigasi, Episode, PernyataanInvestigasi, PesanInvestigasi, Press, PutusanInvestigasi, Round, StateCerita } from '../tipe';

export type Bukti = BuktiInvestigasi;
export type Pernyataan = PernyataanInvestigasi;
export type HasilKeberatan = 'tepat' | 'tepat-kedua' | 'dipandu';
export type Putusan = PutusanInvestigasi;
export type Pesan = PesanInvestigasi;

export const HASIL_KEBERATAN: readonly HasilKeberatan[] = ['tepat', 'tepat-kedua', 'dipandu'];
export const PUTUSAN: readonly Putusan[] = ['layak', 'tambahan', 'polis'];
export const PESAN: readonly Pesan[] = ['baik', 'datar', 'janji'];

export const tandaCatat = (id: string): string => `catat:${id}`;
export const tandaBukti = (id: string): string => `bukti:${id}`;
export const tandaKeberatan = (h: HasilKeberatan): string => `keb:${h}`;
export const tandaPutusan = (p: Putusan): string => `putusan:${p}`;
export const tandaPesan = (p: Pesan): string => `pesan:${p}`;
/** T-087: lajur yang ditebak tamu di bingkai pembuka (kasus 1). */
export type Lajur = 1 | 2 | 3 | 4;
export const LAJUR: readonly Lajur[] = [1, 2, 3, 4];
/** T-090: id tebakan apa pun (kasus 1: 1..4 = `tebak:1`..`tebak:4` seperti semula; kasus 2: 'keluarga' | 'penumpang' | 'belum'). */
export const tandaTebak = (id: string | number): string => `tebak:${id}`;
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

/**
 * T-087 / T-090: tebakan pembuka = id pilihan `konfig.tebak.pilihan` yang tandanya terpasang (null = belum menebak, mis.
 * progres lama dari sebelum T-087). Kasus 1 mengembalikan '1'..'4'.
 */
export function tebakanAwal(ep: Pick<Episode, 'investigasi'>, s: Tanda): string | null {
  return (ep.investigasi?.tebak.pilihan ?? []).find((p) => punya(s, tandaTebak(p.id)))?.id ?? null;
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

// ------------------------------------------------------------------ T-102: babak panel, "Tanya lebih lanjut", hasil lengkap

/** Hasil satu babak (rubrik bersama): 'first' | 'second' | 'guided'. */
export type HasilBabak = RoundOutcome;
/** Padanan hasil KEBERATAN lama dengan hasil babak rubrik bersama (kasus 1-2: babak tunggal 'keberatan'). */
export const KE_HASIL_BABAK: Readonly<Record<HasilKeberatan, HasilBabak>> = { tepat: 'first', 'tepat-kedua': 'second', dipandu: 'guided' };
export const KE_HASIL_KEBERATAN: Readonly<Record<HasilBabak, HasilKeberatan>> = { first: 'tepat', second: 'tepat-kedua', guided: 'dipandu' };

export const tandaPanel = (idBabak: string, hasil: HasilBabak): string => `panel:${idBabak}:${hasil}`;
export const tandaPanelKeliru = (idBabak: string, percobaan: 0 | 1, idBukti: string): string => `panel-keliru:${idBabak}:${percobaan}:${idBukti}`;
export const tandaTekan = (idPernyataan: string, idPress: string): string => `press:${idPernyataan}:${idPress}`;
/** Id pilihan tetap node tawar "Tanya lebih lanjut" (`NodeDasar.tekan` langkah 'tawar', T-104). */
export const PILIH_TEKAN = 'tekan';
export const PILIH_LANJUT = 'lanjut';

/** Babak panel kasus ini, urut naskah ([] = kasus satu KEBERATAN). */
export function babakPanel(ep: Pick<Episode, 'investigasi'>): Round[] {
  return ep.investigasi?.panel?.rounds ?? [];
}

/** Id babak yang dinilai, urut rubrik: babak panel, atau babak tunggal 'keberatan' (kasus 1-2). */
export function idBabakKasus(ep: Pick<Episode, 'investigasi'>): string[] {
  const b = babakPanel(ep);
  return b.length ? b.map((x) => x.id) : [LEGACY_ROUND_ID];
}

/** Hasil satu babak, atau null selama belum selesai. Babak tunggal 'keberatan' dibaca dari tanda lama keb:*. */
export function hasilBabak(ep: Pick<Episode, 'investigasi'>, s: Tanda, idBabak: string): HasilBabak | null {
  if (!babakPanel(ep).length) {
    const h = idBabak === LEGACY_ROUND_ID ? hasilKeberatan(s) : null;
    return h ? KE_HASIL_BABAK[h] : null;
  }
  return ROUND_OUTCOMES.find((o) => punya(s, tandaPanel(idBabak, o))) ?? null;
}

/** Hasil SEMUA babak urut rubrik; null selama salah satunya belum selesai. */
export function hasilSemuaBabak(ep: Pick<Episode, 'investigasi'>, s: Tanda): HasilBabak[] | null {
  const hasil: HasilBabak[] = [];
  for (const id of idBabakKasus(ep)) {
    const h = hasilBabak(ep, s, id);
    if (!h) return null;
    hasil.push(h);
  }
  return hasil;
}

/** Babak panel pertama yang belum selesai (null = semua selesai, atau kasus tanpa panel). Babak yang selesai tidak diulang. */
export function babakBerjalan(ep: Pick<Episode, 'investigasi'>, s: Tanda): Round | null {
  return babakPanel(ep).find((b) => !hasilBabak(ep, s, b.id)) ?? null;
}

/** "Tanya lebih lanjut" pernyataan itu sudah dibuka? */
export function sudahTekan(s: Tanda, idPernyataan: string, idPress: string): boolean {
  return punya(s, tandaTekan(idPernyataan, idPress));
}

/** Pernyataan (urut naskah) yang "Tanya lebih lanjut"-nya sudah dibuka: buku catatan menulis tanya-jawabnya dengan sumbernya. */
export function tekananTerbuka(ep: Pick<Episode, 'investigasi'>, s: Tanda): { pernyataan: Pernyataan; press: Press }[] {
  const hasil: { pernyataan: Pernyataan; press: Press }[] = [];
  for (const p of ep.investigasi?.pernyataan ?? []) if (p.press && sudahTekan(s, p.id, p.press.id)) hasil.push({ pernyataan: p, press: p.press });
  return hasil;
}

/** SEMUA pernyataan yang sudah dikoreksi pembuatnya, urut naskah (kasus ber-panel bisa lebih dari satu). */
export function semuaPernyataanDikoreksi(ep: Pick<Episode, 'investigasi'>, s: Tanda): Pernyataan[] {
  return (ep.investigasi?.pernyataan ?? []).filter((p) => punya(s, tandaKoreksi(p.id)));
}

/** Hasil yang dinilai dalam bentuk rubrik bersama (semua kasus): hasil tiap babak urut rubrik, putusan, pesan. */
export interface HasilLengkap { babak: HasilBabak[]; putusan: Putusan; pesan: Pesan }

/**
 * Seperti hasilKasus, untuk SEMUA kasus: kasus 1-2 (dan simpanan lamanya) memberi satu babak dari keb:*, kasus ber-panel satu
 * hasil per babak. null selama salah satu hasil belum ada.
 */
export function hasilKasusLengkap(ep: Pick<Episode, 'investigasi'>, s: Tanda): HasilLengkap | null {
  const babak = hasilSemuaBabak(ep, s);
  const putusan = putusanDipilih(s);
  const pesan = pesanDipilih(s);
  return babak && putusan && pesan ? { babak, putusan, pesan } : null;
}
