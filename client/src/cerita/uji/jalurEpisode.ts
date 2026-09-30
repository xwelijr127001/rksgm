/**
 * PEMBANTU TES untuk episode SUNGGUHAN (bukan fixture): menjalankan jalur cerita lewat MESIN (`jalankan`)
 * persis seperti pemain - 'lanjut' sampai mesin menunggu keputusan, lalu memilih / mengirim jawaban
 * aktivitas yang ditentukan. Dipakai client/src/cerita/episode/<id>/episode.test.ts.
 *
 * Sengaja tanpa node:assert: jalur yang putus melempar Error yang menyebut node & baris, supaya mudah
 * dilacak. Tidak ada logika episode yang disalin di sini; semua hasil datang dari mesin.
 */
import type { MissionAnswer } from '@shared/types';
import { jalankan, pilihanTersedia, stateAwal } from '../mesin';
import type { AksiCerita, Episode, IdNode, KunciTeks, StateCerita } from '../tipe';
import { kandidatJawaban } from '../validasi';

export const LANJUT: AksiCerita = { jenis: 'lanjut' };

/** Satu keputusan di jalur: 'node/pilihan' di node pilihan, atau jawaban aktivitas di node aktivitas. */
export type LangkahJalur = `${string}/${string}` | { node: IdNode; jawaban: MissionAnswer };

/** Langkah aktivitas: kirim `jawaban` di node aktivitas `node`. */
export const jawab = (node: IdNode, jawaban: MissionAnswer): LangkahJalur => ({ node, jawaban });

export const salinJson = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export interface OpsiJalur {
  /** Mulai dari state ini (bawaan: stateAwal). */
  dari?: StateCerita;
  /** true = setiap state hasil aksi di-JSON-kan lalu diurai lagi (meniru simpan + muat ulang di tiap langkah). */
  muatUlang?: boolean;
  /** Dipanggil untuk setiap state yang akan diberi aksi berikutnya (mis. `bekukan` untuk uji kemurnian). */
  amati?: (s: StateCerita) => void;
}

export interface HasilJalur {
  awal: StateCerita;
  /** State terakhir (mesin menunggu keputusan berikutnya, atau episode selesai). */
  state: StateCerita;
  /** Semua aksi sah yang diterapkan, urut. */
  aksi: AksiCerita[];
  /** jejak[i] = state hasil aksi[i]. */
  jejak: StateCerita[];
}

const BATAS_LANJUT = 500;

/**
 * Mainkan jalur: sebelum tiap langkah, 'lanjut' sampai mesin menolak 'lanjut' (pilihan/aktivitas menunggu);
 * setelah langkah terakhir, 'lanjut' lagi sampai berhenti. Langkah yang tidak cocok dengan node kini, atau
 * aksi yang ditolak mesin, melempar Error.
 */
export function mainkanJalur(ep: Episode, langkah: readonly LangkahJalur[], opsi: OpsiJalur = {}): HasilJalur {
  const awal = opsi.dari ?? stateAwal(ep);
  let s = awal;
  const aksi: AksiCerita[] = [];
  const jejak: StateCerita[] = [];

  const coba = (a: AksiCerita): boolean => {
    opsi.amati?.(s);
    const b = jalankan(ep, s, a);
    if (b === s) return false;
    aksi.push(a);
    s = opsi.muatUlang ? salinJson(b) : b;
    jejak.push(s);
    return true;
  };
  const wajib = (a: AksiCerita): void => {
    if (!coba(a)) throw new Error(`aksi ${JSON.stringify(a)} ditolak mesin di node "${s.node}" (baris ${s.baris})`);
  };
  const maju = (): void => {
    for (let i = 0; i < BATAS_LANJUT; i++) if (!coba(LANJUT)) return;
    throw new Error(`'lanjut' tidak pernah berhenti (node "${s.node}")`);
  };

  for (const l of langkah) {
    maju();
    if (typeof l === 'string') {
      const i = l.indexOf('/');
      const node = l.slice(0, i);
      const pilihan = l.slice(i + 1);
      if (s.node !== node) throw new Error(`jalur mengharapkan pilihan di node "${node}", mesin berada di "${s.node}" (langkah "${l}")`);
      const ada = pilihanTersedia(ep, s).map((p) => p.id);
      if (!ada.includes(pilihan)) throw new Error(`pilihan "${pilihan}" tidak tersedia di "${node}" (tersedia: ${ada.join(', ')})`);
      wajib({ jenis: 'pilih', node, pilihan });
    } else {
      if (s.node !== l.node) throw new Error(`jalur mengharapkan aktivitas di node "${l.node}", mesin berada di "${s.node}"`);
      wajib({ jenis: 'aktivitas', node: l.node, jawaban: l.jawaban });
    }
  }
  maju();
  return { awal, state: s, aksi, jejak };
}

/** Terapkan ulang daftar aksi dari state `dari`; setiap aksi WAJIB sah. Mengembalikan state terakhir. */
export function ulangiAksi(ep: Episode, dari: StateCerita, aksi: readonly AksiCerita[]): StateCerita {
  let s = dari;
  for (const a of aksi) {
    const b = jalankan(ep, s, a);
    if (b === s) throw new Error(`aksi ${JSON.stringify(a)} ditolak mesin di node "${s.node}" (baris ${s.baris})`);
    s = b;
  }
  return s;
}

/** 'lanjut' sampai mesin menunggu keputusan (atau episode selesai). */
export function majuSampaiKeputusan(ep: Episode, s: StateCerita): StateCerita {
  for (let i = 0; i < BATAS_LANJUT; i++) {
    const b = jalankan(ep, s, LANJUT);
    if (b === s) return s;
    s = b;
  }
  throw new Error(`'lanjut' tidak pernah berhenti (node "${s.node}")`);
}

/** Kunci teks baris yang BENAR-BENAR tampil untuk `node` (dari riwayat), urut. */
export function barisDitampilkan(s: StateCerita, node: IdNode): KunciTeks[] {
  return s.riwayat.flatMap((e) => (e.jenis === 'baris' && e.node === node ? [e.teks] : []));
}

/** Node yang pernah tampil di perjalanan ini (urut kemunculan pertama). */
export function nodeDilewati(s: StateCerita): IdNode[] {
  const hasil: IdNode[] = [];
  for (const e of s.riwayat) if ('node' in e && !hasil.includes(e.node)) hasil.push(e.node);
  return hasil;
}

/** Semua string di dalam nilai (termasuk kunci objek), rekursif. */
export function semuaString(x: unknown, hasil: string[] = []): string[] {
  if (typeof x === 'string') hasil.push(x);
  else if (Array.isArray(x)) for (const v of x) semuaString(v, hasil);
  else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      hasil.push(k);
      semuaString(v, hasil);
    }
  }
  return hasil;
}

/** Bekukan dalam (rekursif). Modul ES = mode ketat: mesin yang mengubah state masukan akan melempar TypeError. */
export function bekukan<T>(x: T): T {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const v of Object.values(x)) bekukan(v);
  }
  return x;
}

/**
 * Bagian state yang bermakna bagi masa depan cerita (untuk membedakan akibat pilihan).
 * `abaikanTanda` = tanda yang tidak ikut dibandingkan (mis. tanda hasil aktivitas 'akt:*').
 */
export function intiState(s: StateCerita, abaikanTanda?: (t: string) => boolean): string {
  return JSON.stringify({
    node: s.node,
    kepercayaan: s.kepercayaan,
    tanda: s.tanda.filter((t) => !abaikanTanda?.(t)).sort(),
    paham: [...s.paham].sort(),
    proses: Object.entries(s.proses).sort(([a], [b]) => a.localeCompare(b)),
    catatan: [...s.catatan].sort(),
  });
}

/**
 * Semua state yang MENUNGGU KEPUTUSAN (node pilihan dengan semua baris tampil, atau aktivitas yang belum
 * dikirim) yang terjangkau dari awal: setiap pilihan tersedia & setiap kandidat jawaban aktivitas
 * (`kandidatJawaban`). State yang intinya sama hanya dikembalikan sekali.
 *
 * `abaikanTanda`: tanda yang tidak membedakan keadaan. Tanpa itu, tanda hasil aktivitas ('akt:<id>:pilih:<opsi>')
 * memecah setiap kombinasi jawaban menjadi keadaan tersendiri dan jumlahnya meledak; pemanggil yang memakainya
 * WAJIB memastikan tanda itu tidak dibaca kondisi mana pun di luar node aktivitasnya sendiri.
 */
export function titikKeputusan(ep: Episode, opsi: { abaikanTanda?: (t: string) => boolean; batas?: number } = {}): StateCerita[] {
  const batas = opsi.batas ?? 20_000;
  const hasil: StateCerita[] = [];
  const dilihat = new Set<string>();
  const tumpukan: StateCerita[] = [stateAwal(ep)];
  while (tumpukan.length) {
    const s = majuSampaiKeputusan(ep, tumpukan.pop()!);
    const sig = JSON.stringify([intiState(s, opsi.abaikanTanda), s.baris, s.umpanBalik, Object.keys(s.aktivitas).sort()]);
    if (dilihat.has(sig)) continue;
    dilihat.add(sig);
    if (dilihat.size > batas) throw new Error(`titikKeputusan: lebih dari ${batas} keadaan`);
    const n = ep.node[s.node];
    if (n?.jenis === 'pilihan') {
      hasil.push(s);
      for (const p of pilihanTersedia(ep, s, n)) tumpukan.push(jalankan(ep, s, { jenis: 'pilih', node: s.node, pilihan: p.id }));
    } else if (n?.jenis === 'aktivitas' && !s.umpanBalik) {
      hasil.push(s);
      for (const j of kandidatJawaban(ep, n.aktivitas) ?? []) tumpukan.push(jalankan(ep, s, { jenis: 'aktivitas', node: s.node, jawaban: j }));
    }
  }
  return hasil;
}
