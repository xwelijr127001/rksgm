/**
 * T-076 EPISODE 1 INVESTIGATOR: SKOR satu kasus (fungsi murni, kontrak rencana "Interfaces"). 100 poin:
 *   Bukti (KEBERATAN) 40: percobaan pertama 40, kedua 25, dipandu 10
 *   Putusan           30: menurut TABEL PUTUSAN KASUS (`Episode.investigasi.putusan`, T-090): kasus 1 layak 30 / tambahan 15 /
 *                         polis 0; kasus 2 polis 30 / tambahan 15 / layak 0
 *   Penanganan        30: pesan jelas + hormat + langkah berikutnya 30, benar tetapi dingin 15, janji tanpa dasar 0
 * Nilai: S >= 90, A >= 75, B >= 50, selain itu C. Tanpa nyawa, tanpa waktu: kekeliruan hanya mengurangi poin.
 *
 * T-102 (Investigator lengkap, kartu 1): RUBRIK kini satu sumber di `shared/investigator/rubric.ts` (dipakai juga server papan
 * acara). Berkas ini = penyesuai lokalnya:
 *   - pemanggil LAMA (`skorKasus(h, tabel)`, `poinKeberatan`, `langkahTerlemah`, ...) tidak berubah tanda tangan maupun hasilnya;
 *   - kasus ber-panel (kasus 3): bukti 40 = DUA babak, tiap babak 20 / 12 / 5, lewat `skorKasusLengkap(konfig, hasil)` yang
 *     memanggil `score()` rubrik bersama; `bukti` kini bilangan (40, 32, 25, 24, 17, 10), bukan lagi 40 | 25 | 10;
 *   - latihan: `titikTerlemah` memilih BABAK atau pilihan terlemah (kasus 1-2: sama dengan `langkahTerlemah`).
 */
import {
  CASE_MAX,
  gradeOf,
  LEGACY_ROUND_ID,
  manifestOf,
  messageMax,
  roundPoints,
  roundResults,
  score,
  verdictMax,
  type CaseScore,
  type Grade,
} from '@shared/investigator/rubric';
import type { KonfigInvestigasi } from '../tipe';
import { KE_HASIL_BABAK, type HasilBabak, type HasilKeberatan, type HasilLengkap, type Pesan, type Putusan } from './status';

export type NilaiKasus = Grade;

/** Skor satu kasus = `CaseScore` rubrik bersama: { bukti, putusan, penanganan, total, nilai }. */
export type SkorKasus = CaseScore;

export const SKOR_MAKS = CASE_MAX;
/** Babak tunggal kasus 1-2 dan pesan: tabel yang sama dengan manifes rubrik bersama (kasus 1). */
const TUNGGAL = manifestOf('kasus-1')!;
const POIN_BUKTI: Record<HasilKeberatan, number> = {
  tepat: roundPoints(TUNGGAL, LEGACY_ROUND_ID, 'first')!,
  'tepat-kedua': roundPoints(TUNGGAL, LEGACY_ROUND_ID, 'second')!,
  dipandu: roundPoints(TUNGGAL, LEGACY_ROUND_ID, 'guided')!,
};
/** T-090: tabel putusan sebuah kasus (`KonfigInvestigasi.putusan`). */
export type TabelPutusan = Readonly<Record<Putusan, number>>;
const POIN_PESAN = TUNGGAL.messages as Readonly<Record<Pesan, number>>;

export const poinKeberatan = (h: HasilKeberatan): number => POIN_BUKTI[h];
export const poinPutusan = (tabel: TabelPutusan, p: Putusan): number => tabel[p];
/** T-090: putusan yang bernilai penuh di kasus ini (reaksi Miss Raksa di layar hasil, cabang akhir). */
export const putusanTepat = (tabel: TabelPutusan, p: Putusan): boolean => tabel[p] === 30;
export const poinPesan = (p: Pesan): number => POIN_PESAN[p];

/** T-087: tiga langkah yang dinilai, urut alur kasus, dengan poin maksimumnya. */
export type LangkahNilai = 'keberatan' | 'putusan' | 'pesan';
export const MAKS_LANGKAH: Record<LangkahNilai, number> = { keberatan: 40, putusan: 30, pesan: 30 };
export function poinLangkah(s: SkorKasus, l: LangkahNilai): number {
  return l === 'keberatan' ? s.bukti : l === 'putusan' ? s.putusan : s.penanganan;
}
/**
 * T-087 ("Coba lagi pilihan terlemahmu"): langkah dengan poin HILANG terbanyak; seri = yang lebih awal di alur kasus.
 * null = skor sempurna (tidak ada yang perlu dilatih).
 */
export function langkahTerlemah(s: SkorKasus): LangkahNilai | null {
  let lemah: LangkahNilai | null = null;
  let hilang = 0;
  for (const l of ['keberatan', 'putusan', 'pesan'] as const) {
    const h = MAKS_LANGKAH[l] - poinLangkah(s, l);
    if (h > hilang) { hilang = h; lemah = l; }
  }
  return lemah;
}

export const nilaiDari = (total: number): NilaiKasus => gradeOf(total);

/** Kasus satu KEBERATAN (kasus 1-2), tabel putusan dari konfig kasus. Tanda tangan dan hasil tidak berubah sejak T-090. */
export function skorKasus(h: { keberatan: HasilKeberatan; putusan: Putusan; pesan: Pesan }, tabel: TabelPutusan): SkorKasus {
  const bukti = POIN_BUKTI[h.keberatan];
  const putusan = tabel[h.putusan];
  const penanganan = POIN_PESAN[h.pesan];
  const total = bukti + putusan + penanganan;
  return { bukti, putusan, penanganan, total, nilai: nilaiDari(total) };
}

// ------------------------------------------------------------------ T-102: rubrik bersama (semua kasus, termasuk panel)

type Kasus = Pick<KonfigInvestigasi, 'kasus'>;

/** Versi rubrik kasus ini di build ini (dikirim saat memulai run papan acara); null = kasus tanpa manifes. */
export const versiRubrik = (konfig: Kasus): number | null => manifestOf(konfig.kasus)?.rubricVersion ?? null;

/**
 * Skor lewat `score()` rubrik bersama: hasil tiap babak urut rubrik + putusan + pesan (lihat status.ts hasilKasusLengkap).
 * Untuk kasus 1-2 hasilnya SAMA dengan `skorKasus(h, konfig.putusan)`. null = kasus tanpa manifes, atau jumlah babak / id
 * tidak cocok dengan manifes.
 */
export function skorKasusLengkap(konfig: Kasus, h: HasilLengkap): SkorKasus | null {
  const m = manifestOf(konfig.kasus);
  return m ? score(m.caseId, m.rubricVersion, h.babak, h.putusan, h.pesan) : null;
}

/** Poin satu hasil babak di kasus ini (latihan satu babak); 0 = babak / kasus tak dikenal. */
export function poinBabak(konfig: Kasus, idBabak: string, hasil: HasilBabak): number {
  const m = manifestOf(konfig.kasus);
  return (m && roundPoints(m, idBabak, hasil)) ?? 0;
}
/** Seperti poinBabak untuk layar yang masih memakai hasil KEBERATAN lama (tepat / tepat-kedua / dipandu). */
export const poinBabakDari = (konfig: Kasus, idBabak: string, h: HasilKeberatan): number => poinBabak(konfig, idBabak, KE_HASIL_BABAK[h]);

/** Rincian bukti per babak: { id, hasil, poin, maks } urut rubrik ([] = tak dikenal). */
export interface RincianBabak { id: string; hasil: HasilBabak; poin: number; maks: number }
export function rincianBabak(konfig: Kasus, babak: readonly HasilBabak[]): RincianBabak[] {
  const m = manifestOf(konfig.kasus);
  return ((m && roundResults(m, babak)) ?? []).map((r) => ({ id: r.id, hasil: r.outcome, poin: r.points, maks: r.max }));
}

/**
 * Titik latihan = SATU babak, atau putusan, atau pesan. `langkah` memakai nama LangkahNilai supaya kunci teks lama
 * (`inv.lagi.langkah.<langkah>`) tetap dipakai; `babak` membedakan babak pada kasus ber-panel.
 */
export type TitikLatihan = { langkah: 'keberatan'; babak: string; poin: number; maks: number } | { langkah: 'putusan' | 'pesan'; poin: number; maks: number };

/**
 * "Coba lagi pilihan terlemahmu" untuk semua kasus: titik dengan poin HILANG terbanyak di antara tiap babak, putusan, dan
 * pesan; seri = yang lebih awal di alur kasus. null = sempurna atau kasus tanpa manifes. Kasus 1-2 (satu babak 40 poin):
 * langkahnya sama dengan `langkahTerlemah`.
 */
export function titikTerlemah(konfig: Kasus, h: HasilLengkap): TitikLatihan | null {
  const m = manifestOf(konfig.kasus);
  const s = skorKasusLengkap(konfig, h);
  if (!m || !s) return null;
  const titik: TitikLatihan[] = [
    ...rincianBabak(konfig, h.babak).map((r): TitikLatihan => ({ langkah: 'keberatan', babak: r.id, poin: r.poin, maks: r.maks })),
    { langkah: 'putusan', poin: s.putusan, maks: verdictMax(m) },
    { langkah: 'pesan', poin: s.penanganan, maks: messageMax(m) },
  ];
  let lemah: TitikLatihan | null = null;
  for (const t of titik) if (t.maks - t.poin > (lemah ? lemah.maks - lemah.poin : 0)) lemah = t;
  return lemah;
}

/**
 * Pemeriksaan naskah (dipakai validasi / skrip periksa, bukan saat main): selisih antara data kasus (`Episode.investigasi`) dan
 * manifes rubrik bersama. [] = cocok: tabel putusan, id babak, kartu tiap babak, dan kartu yang diterima sama, sehingga skor
 * lokal dan skor server tidak bisa berbeda.
 */
export function selisihManifes(konfig: KonfigInvestigasi): string[] {
  const m = manifestOf(konfig.kasus);
  if (!m) return [`kasus "${konfig.kasus}" tidak punya manifes rubrik`];
  const salah: string[] = [];
  const sama = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
  if (konfig.nomor !== m.number) salah.push(`nomor ${konfig.nomor} != manifes ${m.number}`);
  const tabel = konfig.putusan as Readonly<Record<string, number>>;
  if (!sama(Object.keys(tabel), Object.keys(m.verdicts)) || Object.keys(tabel).some((k) => tabel[k] !== m.verdicts[k])) salah.push('tabel putusan != manifes verdicts');
  const babak = konfig.panel?.rounds.map((r) => ({ id: r.id, kartu: r.evidenceIds as string[], terima: r.acceptedIds as string[] }))
    ?? [{ id: LEGACY_ROUND_ID, kartu: konfig.keberatan.urutan as string[], terima: [konfig.keberatan.tepat as string] }];
  if (babak.length !== m.rounds.length) salah.push(`jumlah babak ${babak.length} != manifes ${m.rounds.length}`);
  babak.forEach((b, i) => {
    const r = m.rounds[i];
    if (!r) return;
    if (b.id !== r.id) salah.push(`babak[${i}] id "${b.id}" != manifes "${r.id}"`);
    if (!sama(b.kartu, r.cards)) salah.push(`babak "${b.id}": kartu != manifes cards`);
    if (!sama(b.terima, r.accepted)) salah.push(`babak "${b.id}": kartu diterima != manifes accepted`);
    if (b.terima.some((x) => !b.kartu.includes(x))) salah.push(`babak "${b.id}": kartu diterima tidak ditawarkan`);
    if (b.kartu[0] !== undefined && b.terima.includes(b.kartu[0])) salah.push(`babak "${b.id}": kartu diterima tampil pertama`);
  });
  return salah;
}
