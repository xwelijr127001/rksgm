/**
 * Pembantu MURNI tampilan mode cerita (tanpa React, tanpa penyimpanan): dibaca dari state + episode.
 * Mesin (../mesin.ts) tetap satu-satunya yang mengubah state; di sini hanya "apa yang terlihat".
 */
import type { Baris, Ekspresi, Episode, EntriRiwayat, HasilMuat, IdAkhir, KunciTeks, StateCerita, Suasana } from '../tipe';
import { babKini, barisTerlihat, nodeKini, suasanaNasabah } from '../mesin';
import { adalahNarasi, adeganKini } from './adegan';

// adalahNarasi & ekspresiNasabah pindah ke adegan.ts (v3: komposisi adegan memakainya; tampilan -> adegan, tanpa impor
// melingkar). Tetap diekspor dari sini untuk pemanggil lama.
export { adalahNarasi, ekspresiNasabah } from './adegan';

/** Baris yang sedang tampil di kotak dialog (baris terlihat ke-`baris`), atau null. */
export function barisKini(ep: Episode, s: StateCerita): Baris | null {
  const semua = barisTerlihat(ep, s);
  return s.baris > 0 ? semua[s.baris - 1] ?? null : null;
}

/** Kunci unik baris yang tampil: berubah setiap ada baris baru (juga saat bab diulang). Dipakai efek mengetik & live region. */
export function kunciBaris(s: StateCerita): string {
  return `${s.node}#${s.baris}#${s.langkah}`;
}

/**
 * Nasabah hadir secara fisik di bingkai panggung (meja layanan atau parkiran; bukan sisipan telepon), turunan
 * `adeganKini` (v3, docs/cerita/ADEGAN-AUTO1.md bagian 3-4): hadir sejak cue masuk di narasi pintu (b1-mentor.4),
 * tidak lagi di kursi sesudah cue pergi / waktu berlalu, dan hanya lewat telepon pada epilog "beberapa hari
 * kemudian". Episode tanpa `panggung` memakai aturan v2 (hadir sejak pernah bicara; pergi dari meja sesudah narasi
 * pertama di epilog). Ucapan nasabah tetap tampil dengan potret di kotak dialog.
 */
export function nasabahHadir(ep: Episode, s: StateCerita): boolean {
  const id = ep.nasabah;
  if (!id || ep.pemeran[id]?.potret !== 'nasabah') return false;
  const n = adeganKini(ep, s).nasabah;
  return !!n && !n.lewatTelepon;
}

/**
 * Kunci label perasaan untuk ekspresi yang TAMPIL: label suasana episode yang memakai ekspresi itu
 * (mis. 'kesal' -> suasana.kesal), atau null bila episode tidak punya (tampilan memakai kamus cerita.ekspresi.*).
 * Satu sumber kebenaran: label di panggung selalu sesuai wajah yang terlihat.
 */
export function kunciLabelEkspresi(ep: Episode, e: Ekspresi): KunciTeks | null {
  return ep.suasana.find((x) => x.ekspresi === e)?.label ?? null;
}

/** Perasaan nasabah untuk ringkasan akhir (layarAkhir). */
export interface PerasaanAkhir {
  /** Saat meninggalkan meja layanan: suasana dari kepercayaan (hasil komunikasi selama percakapan). */
  meja: Suasana;
  /** Di akhir cerita: ekspresi baris nasabah terakhir di epilog (atau ekspresi suasana bila tidak ada). */
  ekspresi: Ekspresi;
  /**
   * true = perasaan terakhir itu terjadi SESUDAH pergantian adegan di epilog (narasi sebelum baris nasabah
   * terakhir), mis. telepon beberapa hari kemudian. Ringkasan lalu menampilkan dua keadaan: saat pulang & sesudahnya.
   */
  sesudahnya: boolean;
}

export function perasaanAkhir(ep: Episode, s: StateCerita): PerasaanAkhir {
  const meja = suasanaNasabah(ep, s);
  const n = nodeKini(ep, s);
  const epilog = n?.jenis === 'akhir' ? barisTerlihat(ep, s, n) : [];
  for (let i = epilog.length - 1; i >= 0; i--) {
    const b = epilog[i]!;
    if (b.siapa === ep.nasabah && b.ekspresi) {
      return { meja, ekspresi: b.ekspresi, sesudahnya: epilog.slice(0, i).some((x) => adalahNarasi(ep, x.siapa)) };
    }
  }
  return { meja, ekspresi: meja.ekspresi, sesudahnya: false };
}

/** Nomor bab (1..n) dari id bab, 0 bila tidak dikenal. */
export function nomorBab(ep: Episode, bab: string): number {
  return ep.bab.findIndex((b) => b.id === bab) + 1;
}

/** Status episode untuk kartu di daftar (/cerita). */
export type StatusEpisode =
  | { jenis: 'baru' }
  | { jenis: 'lanjut'; nomor: number; jumlah: number }
  | { jenis: 'selesai'; akhir: IdAkhir }
  | { jenis: 'tidakCocok' };

export function statusEpisode(ep: Episode, muat: HasilMuat): StatusEpisode {
  if (muat.status === 'baru') return { jenis: 'baru' };
  if (muat.status === 'tidakCocok') return { jenis: 'tidakCocok' };
  const s = muat.state;
  const n = nodeKini(ep, s);
  if (s.akhir && n?.jenis === 'akhir') return { jenis: 'selesai', akhir: s.akhir };
  // Belum ada aksi sama sekali = tetap "baru" (stateAwal tidak disimpan, tetapi jaga-jaga).
  if (s.langkah === 0) return { jenis: 'baru' };
  const b = babKini(ep, s);
  return { jenis: 'lanjut', nomor: b?.nomor ?? 1, jumlah: ep.bab.length };
}

/** Entri riwayat yang mengubah suasana (dipakai ringkasan & riwayat): hanya yang punya teks alasan. */
export function adalahAlasan(e: EntriRiwayat): e is Extract<EntriRiwayat, { jenis: 'alasan' }> {
  return e.jenis === 'alasan' && typeof e.teks === 'string' && e.teks.length > 0;
}
