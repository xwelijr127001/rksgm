/**
 * KOMPOSISI PANGGUNG LATAR (fungsi MURNI): siapa berdiri di lokasi mana, siapa tampil di layar ponsel, objek apa yang
 * terlihat, dan wajah tiap tokoh, untuk episode dengan `Episode.latar`. Tanpa React, tanpa bahasa, tanpa menulis state;
 * hasil yang sama untuk state yang sama (juga setelah muat ulang, ganti bahasa, atau "coba jalur lain").
 *
 * Lipatan, urut: `latar.awal` -> riwayat (tiap node yang baru muncul: `tata` node-nya; tiap baris: `tata` barisnya,
 * dicari lewat node + kunci teks, tidak pernah lewat kalimat). Nilai bertahan sampai cue berikutnya.
 * Wajah: pembicara baris kini memakai ekspresi barisnya; nasabah yang diam memakai ekspresi baris nasabah terakhir di
 * node kini, atau suasana dari kepercayaan; tokoh lain netral.
 */
import { barisTerlihat, nodeKini } from '../../mesin';
import { adalahNarasi, ekspresiNasabah } from '../adegan';
import type { Baris, CueLatar, Ekspresi, Episode, IdNode, IdPembicara, NodeCerita, StateCerita } from '../../tipe';

export interface TokohLatar {
  id: IdPembicara;
  ekspresi: Ekspresi;
  /** Pembicara baris yang sedang tampil. */
  bicara: boolean;
}

export interface KomposisiLatar {
  lokasi: string;
  hadir: TokohLatar[];
  telepon: TokohLatar | null;
  objek: string[];
}

/** Lipatan cue tata: lokasi, yang hadir, lawan bicara di ponsel, benda akibat. */
export interface Lipatan {
  lokasi: string;
  hadir: IdPembicara[];
  telepon: IdPembicara | null;
  objek: string[];
}

const ada = (rec: object | null | undefined, kunci: string): boolean => !!rec && Object.prototype.hasOwnProperty.call(rec, kunci);

/** Terapkan satu cue ke lipatan (nilai yang tidak disebut cue bertahan). */
export function terapkanCue(k: Lipatan, c: CueLatar | undefined): Lipatan {
  if (!c) return k;
  return {
    lokasi: c.lokasi ?? k.lokasi,
    hadir: c.hadir ?? k.hadir,
    telepon: c.telepon === undefined ? k.telepon : c.telepon,
    objek: c.objek ?? k.objek,
  };
}

/** Semua baris node (pengantar/epilog + baris umpan balik cabang aktivitas), untuk mencari cue lewat kunci teks. */
export function barisNode(n: NodeCerita | null): Baris[] {
  if (!n || n.jenis === 'cabang') return [];
  const umpan = n.jenis === 'aktivitas' ? n.hasil.flatMap((c) => c.umpanBalik ?? []) : [];
  return [...n.baris, ...umpan];
}

/** Lipatan sebelum cue mana pun (`latar.awal`). */
export function lipatanAwal(ep: Episode): Lipatan {
  const awal = ep.latar!.awal;
  return {
    lokasi: awal.lokasi ?? Object.keys(ep.latar!.lokasi)[0] ?? '',
    hadir: awal.hadir ?? [],
    telepon: awal.telepon ?? null,
    objek: awal.objek ?? [],
  };
}

/**
 * Telusuri riwayat dengan lipatan cue: tiap node yang baru muncul memakai `tata` node-nya, tiap baris `tata` barisnya
 * (dicari lewat node + kunci teks, tidak pernah lewat kalimat). `tiap` menerima tiap entri bersama lipatan SESUDAH cue
 * entri itu dan baris naskahnya (entri baris). Mengembalikan lipatan akhir (node `akhirDi`, bila diberikan, ikut masuk).
 */
export function telusuriRiwayat(
  ep: Episode,
  riwayat: StateCerita['riwayat'],
  tiap?: (e: StateCerita['riwayat'][number], k: Lipatan, baris: Baris | null) => void,
  akhirDi?: IdNode,
): Lipatan {
  let k = lipatanAwal(ep);
  let nodeLalu: IdNode | null = null;
  const masukNode = (id: IdNode) => {
    if (id === nodeLalu) return;
    nodeLalu = id;
    k = terapkanCue(k, ada(ep.node, id) ? ep.node[id]!.tata : undefined);
  };
  for (const e of riwayat) {
    if (e.jenis === 'bab') { tiap?.(e, k, null); continue; }
    masukNode(e.node);
    let b: Baris | null = null;
    if (e.jenis === 'baris') {
      b = barisNode(ada(ep.node, e.node) ? ep.node[e.node]! : null).find((x) => x.teks === e.teks) ?? null;
      k = terapkanCue(k, b?.tata);
    }
    tiap?.(e, k, b);
  }
  // Node kini tanpa baris yang sudah tampil (mis. node aktivitas/pilihan tanpa pengantar): cue node tetap berlaku.
  if (akhirDi !== undefined) masukNode(akhirDi);
  return k;
}

/** Lipatan cue sampai baris yang sedang tampil (riwayat sudah memuat baris-baris node kini yang tampil). */
function lipatCue(ep: Episode, s: StateCerita): Lipatan {
  return telusuriRiwayat(ep, s.riwayat, undefined, s.node);
}

/** Komposisi panggung latar untuk state ini. Episode tanpa `latar` = panggung kosong. */
export function komposisiLatar(ep: Episode, s: StateCerita): KomposisiLatar {
  if (!ep.latar) return { lokasi: '', hadir: [], telepon: null, objek: [] };
  const k = lipatCue(ep, s);
  const n = nodeKini(ep, s);
  const tampil = n ? barisTerlihat(ep, s, n) : [];
  const terakhir = s.baris > 0 ? tampil[s.baris - 1] ?? null : null;
  // Narasi yang menyusul ucapan (satu beat: ucapan + akibatnya) tidak memadamkan pembicara: wajah & sorotan tetap milik
  // ucapan tepat sebelumnya di node ini.
  const sebelum = s.baris > 1 ? tampil[s.baris - 2] ?? null : null;
  const kini = terakhir && !terakhir.tata && adalahNarasi(ep, terakhir.siapa) && sebelum && !adalahNarasi(ep, sebelum.siapa) ? sebelum : terakhir;
  const wajah = (id: IdPembicara): TokohLatar => {
    const bicara = kini?.siapa === id;
    // Nasabah diam: ekspresi nasabah panggung Episode 1 (baris nasabah terakhir yang tampil, atau suasana).
    const ekspresi = bicara && kini?.ekspresi ? kini.ekspresi : id === ep.nasabah ? ekspresiNasabah(ep, s) : 'netral';
    return { id, ekspresi, bicara };
  };
  return {
    lokasi: k.lokasi,
    hadir: k.hadir.filter((id) => id !== k.telepon).map(wajah),
    telepon: k.telepon ? wajah(k.telepon) : null,
    objek: k.objek,
  };
}

/** Nasabah di komposisi ini (hadir di lokasi atau di ponsel obrolan), atau null. */
export function nasabahDiPanggung(ep: Episode, k: KomposisiLatar): TokohLatar | null {
  return k.hadir.find((x) => x.id === ep.nasabah) ?? (k.telepon?.id === ep.nasabah ? k.telepon : null);
}

