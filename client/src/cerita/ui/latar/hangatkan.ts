/**
 * PEMANASAN PANGGUNG PIKSEL Episode 2 (T-013 Stage 3; menggantikan pemanasan ilustrasi T-010). PNG piksel sebuah komposisi
 * (ruang + prop + atlas tokoh, beberapa belas KB) dimuat & didekode lebih dulu supaya adegan tampil tanpa menunggu:
 * dari daftar episode / kartu Mode Cerita di halaman awal (komposisi pertama) dan dari adegan yang sedang tampil (lokasi
 * berikutnya menurut naskah). Tidak bergantung ukuran layar / DPR (satu berkas per gambar), jadi tidak ada generasi ukuran.
 */
import { barisNode, komposisiLatar, terapkanCue, type KomposisiLatar, type Lipatan } from './komposisi';
import type { Episode, IdNode, StateCerita } from '../../tipe';
import { susunTokoh } from '../../seni/piksel';
import { adeganPiksel } from './piksel/adegan';
import { RUANG_PIKSEL } from './piksel/ruang';
import { muatPng } from './piksel/muat';

/** URL PNG yang dibutuhkan sebuah komposisi di panggung piksel ([] = tidak terpetakan). */
export function urlKomposisi(ep: Episode, k: KomposisiLatar): string[] {
  const a = adeganPiksel(ep, k).piksel;
  const r = a ? RUANG_PIKSEL[a.ruang] : undefined;
  if (!a || !r) return [];
  const u = new Set<string>(r.lapisan.map((l) => l.url));
  for (const p of a.prop) if (r.prop[p]) u.add(r.prop[p]!.url);
  // T-025: sprite milik ruang (atlas anggota + tanda) ikut dipanaskan bersama ruangnya.
  if (r.komite) { u.add(r.komite.url); u.add(r.komite.tanda.url); }
  for (const t of a.tokoh) { const s = susunTokoh(t.tokoh, { pose: t.pose as never, ekspresi: t.ekspresi }); if (s?.url) u.add(s.url); }
  return [...u].filter((x) => x && !x.startsWith('file:'));
}

/** Muat & dekode PNG komposisi ini (gagal = diam; panggung menanganinya sendiri saat tampil). */
export function hangatkanKomposisi(ep: Episode, k: KomposisiLatar): void {
  if (typeof window === 'undefined') return;
  for (const u of urlKomposisi(ep, k)) void muatPng(u).catch(() => undefined);
}

/** Event jendela saat panggung piksel selesai menggambar adegannya. */
export const ADEGAN_SIAP = 'raksa:adegan-siap';
/** Jalankan fn sesudah adegan di `akar` siap (sudah siap = langsung). Mengembalikan pembatal. */
export function sesudahAdeganSiap(akar: Element | null, fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let sudah = false;
  const jalan = () => { window.removeEventListener(ADEGAN_SIAP, jalan); if (!sudah) { sudah = true; fn(); } };
  if (akar?.querySelector('.cer-piksel[data-siap]')) jalan();
  else window.addEventListener(ADEGAN_SIAP, jalan);
  return () => window.removeEventListener(ADEGAN_SIAP, jalan);
}

/** Komposisi pertama yang akan tampil untuk state ini. */
export function komposisiAwal(ep: Episode, s: StateCerita): KomposisiLatar {
  return komposisiLatar(ep, s);
}

const ada = (rec: object | null | undefined, k: string) => !!rec && Object.prototype.hasOwnProperty.call(rec, k);

/**
 * Komposisi berikutnya yang PINDAH LOKASI dari state ini (penelusuran melebar: sisa baris node kini, lalu node penerus
 * lewat lanjut / pilihan / hasil / cabang). Lokasi sama tidak perlu dipanaskan (latarnya sudah tampil). null = tidak ada /
 * tidak diketahui.
 */
export function komposisiBerikut(ep: Episode, s: StateCerita): KomposisiLatar | null {
  if (!ep.latar) return null;
  const kini = komposisiLatar(ep, s);
  const awal: Lipatan = { lokasi: kini.lokasi, hadir: kini.hadir.map((x) => x.id), telepon: kini.telepon?.id ?? null, objek: kini.objek };
  const jadi = (k: Lipatan): KomposisiLatar => ({ lokasi: k.lokasi, hadir: k.hadir.filter((id) => id !== k.telepon).map((id) => ({ id, ekspresi: 'netral', bicara: false })), telepon: null, objek: k.objek });
  const n0 = ada(ep.node, s.node) ? ep.node[s.node]! : null;
  let k = awal;
  for (const b of barisNode(n0).slice(s.baris)) {
    k = terapkanCue(k, b.tata);
    if (k.lokasi !== kini.lokasi) return jadi(k);
  }
  const lihat = new Set<IdNode>([s.node]);
  let antre: { id: IdNode; k: Lipatan }[] = penerus(n0).map((id) => ({ id, k }));
  for (let langkah = 0; langkah < 40 && antre.length; langkah++) {
    const berikut: typeof antre = [];
    for (const { id, k: k0 } of antre) {
      if (lihat.has(id) || !ada(ep.node, id)) continue;
      lihat.add(id);
      const n = ep.node[id]!;
      let kk = terapkanCue(k0, n.tata);
      if (kk.lokasi !== kini.lokasi) return jadi(kk);
      for (const b of barisNode(n)) { kk = terapkanCue(kk, b.tata); if (kk.lokasi !== kini.lokasi) return jadi(kk); }
      for (const p of penerus(n)) berikut.push({ id: p, k: kk });
    }
    antre = berikut;
  }
  return null;
}

function penerus(n: Episode['node'][string] | null): IdNode[] {
  if (!n) return [];
  switch (n.jenis) {
    case 'dialog': return [n.lanjut];
    case 'pilihan': return n.pilihan.map((p) => p.lanjut);
    case 'aktivitas': return n.hasil.map((h) => h.lanjut);
    case 'cabang': return [...n.cabang.map((c) => c.lanjut), n.lainnya];
    default: return [];
  }
}
