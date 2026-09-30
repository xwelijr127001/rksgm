/**
 * Pembantu MURNI layar akhir v2 (tanpa React): kartu akhir sebab-akibat dan tinjauan "Lihat perjalananku".
 * Kontrak: docs/rancangan-mode-cerita.md bagian 11.
 *
 * - kartuAkhir: SATU penjelasan untuk akhir ini, dipilih dari metadata eksplisit episode (`Episode.kartuAkhir`)
 *   yang membaca keputusan nyata (tanda, proses, paham, koreksi). Tidak memakai urutan alasan, tiga butir
 *   pertama, atau angka kepercayaan.
 * - tinjauanPerjalanan: yang membantu / yang perlu diperhatikan / kenapa, dengan sisi komunikasi, langkah klaim,
 *   dan pemahaman nasabah yang terpisah. Makna tiap alasan dari `Episode.makna` (arah suasana BUKAN ukuran benar):
 *   kekeliruan yang sudah diluruskan tidak tampil sebagai belum beres, langkah yang tidak dilakukan tidak tampil
 *   sebagai selesai, dan langkah yang keliru tidak dimaafkan oleh suasana yang membaik.
 */
import { babBisaDiulang, kondisiTerpenuhi, nodeKini, ringkasanAkhir } from '../mesin';
import type { AturanAkhir, Ekspresi, Episode, IdAkhir, IdBab, InfoAkhir, KunciTeks, MaknaAlasan, NilaiProses, StateCerita } from '../tipe';
import { perasaanAkhir } from './tampilan';

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);

export interface KartuAkhir {
  akhir: IdAkhir;
  nada: InfoAkhir['nada'];
  /** Id aturan yang dipakai ('' = episode tanpa aturan: judul & ringkas akhir). */
  aturan: string;
  judul: KunciTeks;
  sebab: KunciTeks;
  /** null bila episode tidak punya aturan untuk akhir ini. */
  pelajaran: KunciTeks | null;
  /**
   * Bab untuk "Coba lagi dari bagian …" (akhir yang belum baik). null untuk akhir baik (pakai pemilih
   * "Coba jalur lain") atau bila tidak ada bab yang bisa diulang di perjalanan ini.
   */
  ulang: IdBab | null;
  /** Paling banyak satu latihan yang disarankan. */
  latihan: number | null;
  /** Wajah nasabah di AKHIR cerita (baris nasabah terakhir di epilog), mis. kecewa sesudahnya. */
  ekspresi: Ekspresi;
  /** Perasaan terakhir terjadi sesudah pergantian adegan di epilog (mis. telepon beberapa hari kemudian). */
  sesudahnya: boolean;
}

/** Aturan kartu akhir yang berlaku untuk state ini (pertama yang cocok), atau null. */
export function aturanAkhir(ep: Episode, s: StateCerita): AturanAkhir | null {
  if (!s.akhir) return null;
  return (ep.kartuAkhir ?? []).find((a) => a.akhir === s.akhir && (a.jika === undefined || kondisiTerpenuhi(a.jika, s))) ?? null;
}

/**
 * Bab titik ulang: kandidat pertama aturan yang `jika`-nya terpenuhi. Bila bab itu tidak bisa diulang di
 * perjalanan ini, bab terakhir yang bisa diulang SEBELUM bab itu; tanpa kandidat yang cocok, bab terakhir
 * yang bisa diulang. null bila tidak ada bab yang bisa diulang sama sekali.
 */
export function babUlangAkhir(ep: Episode, s: StateCerita, aturan: AturanAkhir | null): IdBab | null {
  const tersedia = babBisaDiulang(ep, s);
  if (!tersedia.length) return null;
  const urutan = ep.bab.map((b) => b.id);
  for (const k of aturan?.ulang ?? []) {
    if (k.jika !== undefined && !kondisiTerpenuhi(k.jika, s)) continue;
    if (tersedia.includes(k.bab)) return k.bab;
    const batas = urutan.indexOf(k.bab);
    const sebelum = tersedia.filter((b) => urutan.indexOf(b) <= batas);
    if (sebelum.length) return sebelum[sebelum.length - 1]!;
    break;
  }
  return tersedia[tersedia.length - 1]!;
}

/** Kartu akhir untuk state yang sudah sampai di node akhir; null bila belum selesai atau akhir tidak dikenal. */
export function kartuAkhir(ep: Episode, s: StateCerita): KartuAkhir | null {
  const n = nodeKini(ep, s);
  if (!s.akhir || n?.jenis !== 'akhir' || !ada(ep.akhir, s.akhir)) return null;
  const info = ep.akhir[s.akhir]!;
  const a = aturanAkhir(ep, s);
  const pa = perasaanAkhir(ep, s);
  return {
    akhir: s.akhir,
    nada: info.nada,
    aturan: a?.id ?? '',
    judul: a?.judul ?? info.judul,
    sebab: a?.sebab ?? info.ringkas,
    pelajaran: a?.pelajaran ?? null,
    ulang: info.nada === 'baik' ? null : babUlangAkhir(ep, s, a),
    latihan: a?.latihan ?? null,
    ekspresi: pa.ekspresi,
    sesudahnya: pa.sesudahnya,
  };
}

// ------------------------------------------------------------------ tinjauan "Lihat perjalananku"

export interface TinjauanPerjalanan {
  membantu: {
    /** Alasan bermakna 'membantu' atau 'ralat' (ralat = kamu memperbaiki sesuatu), urut kejadian. */
    komunikasi: { teks: KunciTeks; ralat: boolean }[];
    /** Langkah klaim yang tepat, atau yang sempat keliru lalu diperbaiki. */
    proses: { id: string; label: KunciTeks; nilai: Extract<NilaiProses, 'tepat' | 'dikoreksi'> }[];
    /** Hal yang kini dipahami nasabah. */
    paham: { id: string; label: KunciTeks }[];
  };
  perhatian: {
    /** Alasan bermakna 'perhatian' yang BELUM diluruskan di akhir perjalanan, urut kejadian. */
    komunikasi: { teks: KunciTeks }[];
    /** Langkah klaim yang keliru, atau tidak dilakukan (null) di perjalanan ini. */
    proses: { id: string; label: KunciTeks; nilai: 'keliru' | null }[];
    /** Hal yang belum dipahami nasabah. */
    paham: { id: string; label: KunciTeks }[];
  };
  kenapa: {
    sebab: KunciTeks;
    /** Pelajaran mentor untuk akhir ini (dari `InfoAkhir.pelajaran`). */
    pelajaran: KunciTeks[];
  };
  /**
   * Semua daftar 'perhatian' kosong: 'beres' pada akhir baik; 'diluruskan' pada akhir yang BELUM baik (semua kekeliruan
   * sudah diluruskan, tetapi akhirnya tetap campuran, mis. dingin-ralat) supaya tampilan tidak menulis "tidak ada yang
   * tertinggal" untuk akhir yang belum baik. null = ada butir perhatian.
   */
  perhatianKosong: 'beres' | 'diluruskan' | null;
  /** Kunci alasan yang tidak punya entri `Episode.makna` (episode belum lengkap; dijaga validasi). */
  tanpaMakna: KunciTeks[];
}

/** Makna satu kunci alasan, atau null bila episode tidak mencatatnya. */
export function maknaAlasan(ep: Episode, kunci: KunciTeks): MaknaAlasan | null {
  return ada(ep.makna, kunci) ? ep.makna![kunci]! : null;
}

export function tinjauanPerjalanan(ep: Episode, s: StateCerita): TinjauanPerjalanan {
  const r = ringkasanAkhir(ep, s);
  const kartu = kartuAkhir(ep, s);
  const info = s.akhir && ada(ep.akhir, s.akhir) ? ep.akhir[s.akhir]! : null;
  const t: TinjauanPerjalanan = {
    membantu: { komunikasi: [], proses: [], paham: [] },
    perhatian: { komunikasi: [], proses: [], paham: [] },
    kenapa: { sebab: kartu?.sebab ?? info?.ringkas ?? '', pelajaran: info ? [...info.pelajaran] : [] },
    perhatianKosong: null,
    tanpaMakna: [],
  };
  const sudah = new Set<string>();
  for (const k of r.komunikasi) {
    if (sudah.has(k.teks)) continue;
    sudah.add(k.teks);
    const m = maknaAlasan(ep, k.teks);
    if (!m) {
      t.tanpaMakna.push(k.teks);
      continue;
    }
    if (m.nilai === 'perhatian') {
      if (m.diluruskan !== undefined && kondisiTerpenuhi(m.diluruskan, s)) continue;
      t.perhatian.komunikasi.push({ teks: k.teks });
    } else {
      t.membantu.komunikasi.push({ teks: k.teks, ralat: m.nilai === 'ralat' });
    }
  }
  for (const p of r.proses) {
    if (p.nilai === 'tepat' || p.nilai === 'dikoreksi') t.membantu.proses.push({ id: p.id, label: p.label, nilai: p.nilai });
    else t.perhatian.proses.push({ id: p.id, label: p.label, nilai: p.nilai });
  }
  for (const p of r.paham) (p.sudah ? t.membantu.paham : t.perhatian.paham).push({ id: p.id, label: p.label });
  const kosong = t.perhatian.komunikasi.length + t.perhatian.proses.length + t.perhatian.paham.length === 0;
  if (kosong) t.perhatianKosong = info?.nada === 'baik' ? 'beres' : 'diluruskan';
  return t;
}

/** Jumlah kata tampil (untuk tes batas kata pelajaran). Tanda baca yang berdiri sendiri tidak dihitung. */
export function hitungKata(teks: string): number {
  return teks.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
