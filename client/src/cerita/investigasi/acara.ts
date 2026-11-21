/**
 * T-106 (Investigator lengkap, kartu 5): SAMBUNGAN SEMPIT untuk papan acara (kartu 6). Berkas ini tidak tahu server, tidak
 * menyimpan apa pun, dan tanpa pendaftar (keadaan bawaan, main sendiri) tidak mengubah apa pun:
 *
 *  1. PILIHAN BERNILAI. Pemutar HP mengirim setiap pilihan yang dinilai (kartu babak, putusan, pesan) lewat
 *     `kirimPilihanBernilai`. Main sendiri: pilihan langsung diterapkan ke mesin cerita (serentak, seperti semula). Mode acara
 *     (kartu 6 memasang penilai lewat `pasangPenilaiAcara`): pilihan yang SAMA baru diterapkan sesudah server mengakuinya
 *     (penilai mengembalikan true); false = tidak diterapkan (kartu 6 menampilkan coba lagi / lanjut tanpa peringkat).
 *     Tahap memakai id tahap rubrik bersama (`round:<babak>:<percobaan>` | 'verdict' | 'message'), jadi sama dengan `Decision`.
 *  2. TITIK PASANG di hub: kartu 6 mendaftarkan komponen `InvestigatorEventEntry` lewat `pasangEntriAcara`; hub menggambarnya
 *     di bawah daftar kasus. Tanpa pendaftar, hub tidak menampilkan apa pun tentang papan acara.
 *  3. SIMPANAN CERITA TERPISAH untuk satu run acara: `episodeAcara(ep, runId)` = episode yang sama dengan id
 *     `<id>@acara-<runId>`. Simpanan cerita berkunci id episode, jadi run acara mulai dari awal, dilanjutkan dengan runId yang
 *     sama, dan tidak pernah menyentuh simpanan main sendiri. (Belum dipakai siapa pun; kartu 6 yang memasangnya ke pemutar.)
 */
import type { ComponentType } from 'react';
import { LEGACY_ROUND_ID, roundStage, STAGE_MESSAGE, STAGE_VERDICT, type StageId } from '@shared/investigator/rubric';
import type { Episode, NodeCerita } from '../tipe';

export interface PilihanBernilai {
  /** Id episode yang sedang dimainkan (untuk run acara: id ber-akhiran `@acara-<runId>`). */
  episode: string;
  /** Id kasus (`KonfigInvestigasi.kasus`). */
  kasus: string;
  tahap: StageId;
  /** Id kartu / putusan / pesan. */
  pilihan: string;
}
export type PenilaiAcara = (p: PilihanBernilai) => Promise<boolean>;

let penilai: PenilaiAcara | null = null;
/** Kartu 6: pasang penilai mode acara; kembaliannya melepas (kembali ke main sendiri). */
export function pasangPenilaiAcara(f: PenilaiAcara): () => void {
  penilai = f;
  return () => { if (penilai === f) penilai = null; };
}
export const modeAcara = (): boolean => penilai !== null;

/** Tahap rubrik sebuah node yang dinilai, atau null (node cerita biasa, tebakan, "Tanya lebih lanjut": tidak dinilai). */
export function tahapBernilai(ep: Pick<Episode, 'investigasi'>, node: NodeCerita): StageId | null {
  if (!ep.investigasi) return null;
  const inv = node.investigasi;
  if (inv?.jenis === 'panel') return roundStage(inv.round, inv.attempt);
  if (inv?.jenis === 'keberatan') return roundStage(LEGACY_ROUND_ID, inv.percobaan);
  if (inv?.jenis === 'putusan') return STAGE_VERDICT;
  return node.id === 'pesan' && node.jenis === 'pilihan' ? STAGE_MESSAGE : null;
}

/**
 * Kirim satu pilihan. Mengembalikan true bila `terapkan` SUDAH dijalankan dan diterima mesin (main sendiri, atau node yang tidak
 * dinilai); false bila ditolak mesin ATAU masih menunggu pengakuan server (mode acara: `terapkan` dijalankan nanti, sekali).
 */
export function kirimPilihanBernilai(ep: Episode, node: NodeCerita, pilihan: string, terapkan: () => boolean): boolean {
  const tahap = penilai ? tahapBernilai(ep, node) : null;
  if (!penilai || !tahap || !ep.investigasi) return terapkan();
  void penilai({ episode: ep.id, kasus: ep.investigasi.kasus, tahap, pilihan }).then((ok) => { if (ok) terapkan(); }, () => undefined);
  return false;
}

// ------------------------------------------------------------------ titik pasang di hub

export interface PropsEntriAcara { /** Kode acara dari alamat (/investigator?acara=KODE) atau null. */ kode: string | null }
let Entri: ComponentType<PropsEntriAcara> | null = null;
/** Kartu 6: daftarkan `InvestigatorEventEntry` (sekali, saat modulnya dimuat). */
export function pasangEntriAcara(C: ComponentType<PropsEntriAcara> | null): void { Entri = C; }
export const entriAcara = (): ComponentType<PropsEntriAcara> | null => Entri;

// ------------------------------------------------------------------ simpanan cerita run acara

const PEMISAH_ACARA = '@acara-';
/** Episode untuk SATU run acara: simpanan ceritanya terpisah dari main sendiri dan terikat ke runId itu. */
export function episodeAcara(ep: Episode, runId: string): Episode {
  return { ...ep, id: `${ep.id}${PEMISAH_ACARA}${runId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)}` };
}
/** Id episode asal dari id run acara (atau id itu sendiri). */
export const idEpisodeAsal = (id: string): string => id.split(PEMISAH_ACARA)[0]!;

// ------------------------------------------------------------------ "Tamu baru" (T-109)

const pendengarTamu = new Set<() => void>();
/** Kartu 6: dipanggil saat hub menjalankan "Tamu baru" (sesi papan acara di perangkat ini ikut diakhiri). */
export function saatTamuBaru(f: () => void): () => void { pendengarTamu.add(f); return () => { pendengarTamu.delete(f); }; }
export function kabariTamuBaru(): void { pendengarTamu.forEach((f) => { try { f(); } catch { /* pendengar tidak boleh menggagalkan "Tamu baru" */ } }); }
