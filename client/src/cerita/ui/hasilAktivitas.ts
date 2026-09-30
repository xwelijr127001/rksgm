/**
 * Pembantu MURNI hasil aktivitas cerita (tanpa React): reveal sintetis dari rubrik klien, status tiap aktivitas
 * yang sudah dinilai (termasuk "diperbaiki" bila cerita meluruskannya sesudahnya), dan kartu polis yang boleh
 * dibaca ulang di Catatan kasus. Dipakai Aktivitas.tsx (umpan balik) dan CatatanKasus.tsx (baca ulang).
 *
 * Tidak ada logika episode yang disalin: status diperbaiki dibaca dari butir `proses` yang diatur SEMUA cabang
 * hasil aktivitas itu (mis. aktivitas `polis` -> proses `baca-polis`), jadi episode baru tidak perlu data tambahan.
 *
 * Simpanan lama tetap terbaca (kontrak 11.5): jawaban yang memakai opsi yang sudah DIHAPUS dari misi (mis. pengecoh
 * polis `ambang-tlo`) diberi label dari kunci teksnya `akt.<aktivitas>.opsi.<id>` bila masih ada (lihat labelOpsi).
 * Data v2 (`alasanOpsi`, `kartuArti`) boleh belum ada: tanpa data = tanpa alasan / kartu hanya dibaca.
 */
import type { Bahasa } from '@shared/bahasa';
import type { MissionAnswer, MissionPublic, MissionReveal, StepDef, StepReveal } from '@shared/types';
import { asList, asText } from '../../game/draft';
import { nilaiMisi, type BarisHasil } from '../../game/hasil';
import { nodeKini } from '../mesin';
import type { DefAktivitas, Episode, IdAktivitas, KunciTeks, StateCerita } from '../tipe';

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);

/** Teks episode bila kuncinya ada; teksCerita mengembalikan kunci itu sendiri bila teksnya tidak ada. */
function teksAda(tx: (k: KunciTeks) => string, k: KunciTeks | null | undefined): string | null {
  if (!k) return null;
  const s = tx(k);
  return s && s !== k ? s : null;
}

/**
 * Label opsi yang aman untuk jawaban tersimpan: label di misi; opsi yang sudah dihapus dari misi = kunci teksnya
 * `akt.<aktivitas>.opsi.<id>` (tetap disimpan di teks episode untuk perjalanan lama); selain itu id-nya.
 */
export function labelOpsi(def: DefAktivitas, step: StepDef | undefined, id: string, tx: (k: KunciTeks) => string): string {
  const o = step && (step.kind === 'single' || step.kind === 'multi') ? step.options.find((x) => x.id === id) : undefined;
  return o?.label ?? teksAda(tx, `akt.${def.id}.opsi.${id}`) ?? id;
}

/** Alasan singkat satu opsi (DefAktivitas.alasanOpsi), atau null bila tidak ada datanya. */
export function alasanOpsi(def: DefAktivitas, id: string, tx: (k: KunciTeks) => string): string | null {
  return ada(def.alasanOpsi, id) ? teksAda(tx, def.alasanOpsi![id]) : null;
}

/** Pilihan pemain pada satu langkah pilih-satu / pilih-banyak (urut dipilih). */
function pilihanLangkah(step: StepDef, jawaban: MissionAnswer | null | undefined): string[] {
  const v = jawaban?.[step.id];
  if (step.kind === 'single') return asText(v) ? [asText(v)] : [];
  if (step.kind === 'multi') return asList(v);
  return [];
}

/**
 * Langkah misi + opsi yang pernah dijawab tetapi sudah tidak ada di misi (label dari labelOpsi), supaya penilaian
 * tampilan (nilaiMisi) menulis kalimatnya, bukan id mentah. Langkah tanpa opsi hilang dikembalikan apa adanya.
 */
export function langkahDenganJawaban(def: DefAktivitas, steps: StepDef[], jawaban: MissionAnswer | null | undefined, tx: (k: KunciTeks) => string): StepDef[] {
  return steps.map((s) => {
    if (s.kind !== 'single' && s.kind !== 'multi') return s;
    const hilang = pilihanLangkah(s, jawaban).filter((id) => !s.options.some((o) => o.id === id));
    if (!hilang.length) return s;
    return { ...s, options: [...s.options, ...hilang.map((id) => ({ id, label: labelOpsi(def, s, id, tx) }))] };
  });
}

/** Satu opsi di umpan balik: label + alasan singkatnya (null bila episode tidak memberi alasan). */
export interface OpsiHasil {
  id: string;
  label: string;
  alasan: string | null;
}

/**
 * Rincian satu langkah untuk umpan balik aktivitas (setelah dikirim): pilihan yang membantu (dipilih & tepat), yang
 * terlewat (tepat tetapi tidak dipilih), dan yang kurang membantu (dipilih tetapi bukan yang tepat), masing-masing
 * dengan alasan singkat. `jenis` 'lain' = langkah selain pilih-satu/pilih-banyak (tampilan memakai rincian umum).
 */
export interface RincianOpsi {
  stepId: string;
  jenis: 'single' | 'multi' | 'lain';
  /** Tidak ada yang terlewat & tidak ada pilihan yang keliru. */
  tepat: boolean;
  membantu: OpsiHasil[];
  terlewat: OpsiHasil[];
  kurang: OpsiHasil[];
  /** Pembahasan panjang langkah ini (DefAktivitas.penjelasan), '' bila tidak ada. */
  penjelasan: string;
}

export function rincianOpsi(def: DefAktivitas, misi: MissionPublic, jawaban: MissionAnswer | null | undefined, tx: (k: KunciTeks) => string): RincianOpsi[] {
  const steps = langkahDenganJawaban(def, misi.steps, jawaban, tx);
  return def.kunci.flatMap((k): RincianOpsi[] => {
    const s = steps.find((x) => x.id === k.stepId);
    if (!s) return [];
    const penjelasan = ada(def.penjelasan, k.stepId) ? teksAda(tx, def.penjelasan[k.stepId]) ?? '' : '';
    if (s.kind !== 'single' && s.kind !== 'multi') {
      return [{ stepId: s.id, jenis: 'lain' as const, tepat: false, membantu: [], terlewat: [], kurang: [], penjelasan }];
    }
    const benar = k.single !== undefined ? [k.single] : k.multi ?? [];
    const dipilih = pilihanLangkah(s, jawaban);
    const opsi = (id: string): OpsiHasil => ({ id, label: labelOpsi(def, s, id, tx), alasan: alasanOpsi(def, id, tx) });
    const membantu = dipilih.filter((id) => benar.includes(id)).map(opsi);
    const kurang = dipilih.filter((id) => !benar.includes(id)).map(opsi);
    const terlewat = benar.filter((id) => !dipilih.includes(id)).map(opsi);
    return [{ stepId: s.id, jenis: s.kind, tepat: !kurang.length && !terlewat.length && membantu.length > 0, membantu, terlewat, kurang, penjelasan }];
  });
}

/**
 * Arti awam baris kartu polis (DefAktivitas.kartuArti) dalam bahasa aktif, untuk KartuPolisPeriksa. Kunci yang
 * teksnya belum ada = null (baris itu hanya dibaca). null bila kartu ini tidak punya data arti sama sekali.
 */
export function artiKartu(def: DefAktivitas, idKartu: string, tx: (k: KunciTeks) => string): { sub: string | null; baris: (string | null)[] } | null {
  const a = ada(def.kartuArti, idKartu) ? def.kartuArti![idKartu] : undefined;
  if (!a) return null;
  const hasil = { sub: teksAda(tx, a.sub), baris: (Array.isArray(a.baris) ? a.baris : []).map((k) => teksAda(tx, k)) };
  return hasil.sub || hasil.baris.some(Boolean) ? hasil : null;
}

/** MissionReveal sintetis dari rubrik klien: `correct.optionIds` membuat adegan memberi tanda ✓ ✕ !. */
export function buatReveal(def: DefAktivitas, misi: MissionPublic, tx: (k: KunciTeks) => string): MissionReveal {
  const steps: StepReveal[] = def.kunci.map((k) => {
    const st = misi.steps.find((s) => s.id === k.stepId);
    const opsi = st && (st.kind === 'single' || st.kind === 'multi') ? st.options : [];
    const ids = k.single !== undefined ? [k.single] : k.multi ?? [];
    const label = (id: string) => opsi.find((o) => o.id === id)?.label ?? id;
    const kunciPenjelasan = def.penjelasan[k.stepId];
    return {
      stepId: k.stepId,
      prompt: st?.prompt ?? '',
      weight: k.weight,
      correctText: k.assign ? Object.entries(k.assign).map(([a, b]) => `${a}: ${b}`) : k.number ? [String(k.number.value)] : ids.map(label),
      explanation: kunciPenjelasan ? tx(kunciPenjelasan) : '',
      correct: k.assign ? { assign: k.assign } : k.number ? { value: k.number.value } : { optionIds: ids },
    };
  });
  return { missionId: misi.id, roundIndex: -1, summary: tx(def.ringkasan), learning: misi.learning, steps };
}

/** Status hasil aktivitas: dari akurasi saat dinilai, atau 'dikoreksi' bila cerita meluruskannya sesudahnya. */
export type StatusAktivitas = 'tepat' | 'sebagian' | 'belum' | 'dikoreksi';

export function statusAkurasi(akurasi: number): 'tepat' | 'sebagian' | 'belum' {
  return akurasi >= 0.999 ? 'tepat' : akurasi > 0 ? 'sebagian' : 'belum';
}

/**
 * Butir `proses` milik aktivitas: yang diatur oleh SETIAP cabang hasil node aktivitas itu (irisan), mis. polis ->
 * ['baca-polis'] (cabang `pasti-diganti` juga mengatur 'tanpa-janji', tetapi cabang lain tidak).
 */
export function prosesAktivitas(ep: Episode, idAkt: IdAktivitas): string[] {
  let irisan: string[] | null = null;
  for (const n of Object.values(ep.node)) {
    if (n.jenis !== 'aktivitas' || n.aktivitas !== idAkt) continue;
    for (const c of n.hasil) {
      const kunci = Object.keys(c.efek?.proses ?? {});
      irisan = irisan === null ? kunci : irisan.filter((k) => kunci.includes(k));
    }
  }
  return irisan ?? [];
}

export interface RingkasAktivitas {
  id: IdAktivitas;
  judul: string;
  status: StatusAktivitas;
  /** Status saat dinilai (sebelum diperbaiki). */
  statusAwal: 'tepat' | 'sebagian' | 'belum';
  /** Pilihan pemain, masing-masing bertanda tepat / salah. */
  pilihan: BarisHasil[];
  /** Jawaban tepat yang tidak dipilih (kosong bila semuanya sudah dipilih). */
  terlewat: string[];
}

/** Hasil aktivitas yang sudah dinilai di perjalanan ini, urut definisi episode. */
export function ringkasAktivitas(ep: Episode, s: StateCerita, bahasa: Bahasa, tx: (k: KunciTeks) => string): RingkasAktivitas[] {
  const hasil: RingkasAktivitas[] = [];
  for (const [id, def] of Object.entries(ep.aktivitas)) {
    if (!ada(s.aktivitas, id)) continue;
    const h = s.aktivitas[id]!;
    const misi = def.misi(bahasa);
    // Opsi yang sudah dihapus dari misi tetap terbaca (perjalanan lama).
    const rinci = nilaiMisi(langkahDenganJawaban(def, misi.steps, h.jawaban, tx), buatReveal(def, misi, tx), h.jawaban);
    const statusAwal = statusAkurasi(h.akurasi);
    const diperbaiki = statusAwal !== 'tepat' && prosesAktivitas(ep, id).some((p) => ada(s.proses, p) && s.proses[p] === 'dikoreksi');
    hasil.push({
      id,
      judul: misi.title,
      status: diperbaiki ? 'dikoreksi' : statusAwal,
      statusAwal,
      pilihan: rinci.flatMap((r) => r.pilihan),
      terlewat: rinci.flatMap((r) => r.tepat.filter((x) => x.tanda === 'terlewat').map((x) => x.teks)),
    });
  }
  return hasil;
}

/**
 * Aktivitas yang kartu polisnya boleh dibaca ulang: sejak aktivitasnya dimulai (node aktivitas sedang tampil)
 * atau sudah dinilai, dan semua bila butir catatan 'polis' sudah tercatat. Pemain yang salah membaca kartu
 * justru paling membutuhkannya.
 */
export function aktivitasBerkartu(ep: Episode, s: StateCerita, bahasa: Bahasa): IdAktivitas[] {
  const n = nodeKini(ep, s);
  const semua = s.catatan.includes('polis');
  return Object.entries(ep.aktivitas)
    .filter(([id, def]) => (def.misi(bahasa).policyCards?.length ?? 0) > 0
      && (semua || ada(s.aktivitas, id) || (n?.jenis === 'aktivitas' && n.aktivitas === id)))
    .map(([id]) => id);
}
