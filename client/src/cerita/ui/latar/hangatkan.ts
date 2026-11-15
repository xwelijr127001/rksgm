/**
 * PEMANASAN LAPISAN ADEGAN (T-010 G3). Memuat & men-decode latar (+ lapisan depan) SATU komposisi di luar DOM, memakai
 * `sizes` + `srcset` yang SAMA dengan PanggungLatar (lebar dunia dari fungsi potongan yang sama), supaya browser memilih
 * varian yang sama dan adegan berikutnya langsung dari cache.
 *
 * - <= 2 gambar ter-decode dipegang (decode RGBA bisa beberapa MB); yang lebih lama dilepas.
 * - Sama kunci (srcset|sizes) = tidak diulang. Lebar dunia / DPR / orientasi berubah = semua dilepas (pilihan varian bisa
 *   berubah). Batal = hasil diabaikan & referensi dilepas (permintaan jaringan yang sudah jalan tidak bisa dihentikan).
 * - Dijalankan saat idle (requestIdleCallback, cadangan setTimeout). Tidak pernah dari halaman awal kecuali kartu Mode Cerita
 *   disentuh/difokus. Catatan uji: window.__raksaHangat.
 */
import { useSyncExternalStore } from 'react';
import type { Episode, IdNode, LokasiIlustrasi, StateCerita, VarianGambar } from '../../tipe';
import { dekatTokoh, kotakTokohIlustrasi, srcsetDari, letakBerdiri, potonganIlustrasi, potonganSubjek } from './ilustrasi';
import { barisNode, komposisiLatar, terapkanCue, type KomposisiLatar, type Lipatan } from './komposisi';

/** Tinggi pita label lokasi (sama dengan PanggungLatar). */
export const PITA_LABEL = 38;

/**
 * Lebar dunia adegan (px CSS) = lebar gambar sumber x skala potongan kamera. SATU-SATUNYA tempat perhitungan ini; dipakai
 * PanggungLatar (render) dan pemanasan (prediksi), jadi `sizes` keduanya selalu sama untuk ukuran panggung yang sama.
 */
export function ukuranDunia(ep: Episode, lok: LokasiIlustrasi, komposisi: KomposisiLatar, w: number, h: number, ruangBawah: number) {
  const berdiri = letakBerdiri(ep, lok, komposisi);
  const pot = lok.tokoh.jenis === 'berdiri'
    ? potonganSubjek(lok, w, h, berdiri.subjek, berdiri.bebasLabel, PITA_LABEL, ruangBawah)
    : potonganIlustrasi(lok, w, h);
  const s = w / pot.w;
  return { berdiri, pot, s, lebar: lok.w * s };
}

interface Catatan {
  diminta: number;
  selesai: { kunci: string; currentSrc: string; ms: number; gen: number; sizes: string; dpr: number }[];
  gagal: number;
  dilepas: number;
  generasi: number;
  cocok: { src: string; hangat: string | null; sama: boolean }[];
}
declare global { interface Window { __raksaHangat?: Catatan } }
/**
 * Diagnostik HANYA untuk pengembangan/uji (R-15): dev build, atau localStorage `raksa:diag` = "1" (diatur harness). Daftar
 * dibatasi 20 entri. Produksi biasa: tidak ada objek global, tidak ada riwayat yang tumbuh.
 */
const DIAG: boolean = (() => {
  if (typeof window === 'undefined') return false;
  if (import.meta.env?.DEV) return true;
  try { return localStorage.getItem('raksa:diag') === '1'; } catch { return false; }
})();
const BATAS_CATATAN = 20;
const catatan = (): Catatan | null => {
  if (!DIAG) return null;
  return (window.__raksaHangat ??= { diminta: 0, selesai: [], gagal: 0, dilepas: 0, generasi: 0, cocok: [] });
};
const dorong = <T,>(a: T[], x: T) => { a.push(x); if (a.length > BATAS_CATATAN) a.splice(0, a.length - BATAS_CATATAN); };
const dprKini = () => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);

const MAKS = 2;
/** Gambar ter-decode yang dipegang (terbaru di akhir). */
let pegang: { kunci: string; img: HTMLImageElement; currentSrc: string }[] = [];
/** Kunci yang sedang/sudah dipanaskan pada generasi ini. */
const dikenal = new Map<string, number>();
let generasi = 0;
let pantau = false;

const pelanggan = new Set<() => void>();
function lepasSemua() {
  generasi += 1;
  const c = catatan();
  if (c) { c.dilepas += pegang.length; c.generasi = generasi; }
  pegang = [];
  dikenal.clear();
  // R-14: pemanggil memanaskan ulang komposisi yang kini dimaksud dengan ukuran baru.
  pelanggan.forEach((fn) => fn());
}

/**
 * Lebar / DPR / orientasi berubah: pilihan varian bisa berbeda, jadi semua hasil lama tidak berlaku dan pelanggan diberi
 * tahu. DPR: media query resolusi (berubah saat zoom / pindah layar) dipasang ulang untuk nilai baru.
 */
function pasangPantau() {
  if (pantau || typeof window === 'undefined') return;
  pantau = true;
  let w = window.innerWidth;
  let h = window.innerHeight;
  let dpr = dprKini();
  let mq: MediaQueryList | null = null;
  const cek = () => {
    const w2 = window.innerWidth, h2 = window.innerHeight, d2 = dprKini();
    const putar = (w2 > h2) !== (w > h);
    if (Math.abs(w2 - w) >= 1 || d2 !== dpr || putar) { w = w2; h = h2; const dprBerubah = d2 !== dpr; dpr = d2; if (dprBerubah) pasangMq(); lepasSemua(); }
  };
  const pasangMq = () => {
    mq?.removeEventListener?.('change', cek);
    try { mq = window.matchMedia(`(resolution: ${dpr}dppx)`); mq.addEventListener?.('change', cek); } catch { mq = null; }
  };
  pasangMq();
  window.addEventListener('resize', cek);
  window.addEventListener('orientationchange', cek);
}

/** Langganan "ukuran/DPR berubah, hasil pemanasan dibuang" (untuk useSyncExternalStore). */
export function langgananUkuran(fn: () => void): () => void {
  pasangPantau();
  pelanggan.add(fn);
  return () => { pelanggan.delete(fn); };
}
/** Versi ukuran kini (naik tiap kali hasil pemanasan dibuang). */
export const versiUkuran = (): number => generasi;
/** Hook: berubah saat ukuran/DPR/orientasi membuang hasil pemanasan; dipakai sebagai dependensi efek pemanasan (R-14). */
export function useVersiUkuran(): number {
  return useSyncExternalStore(langgananUkuran, versiUkuran, () => 0);
}

function nantiSaatIdle(fn: () => void): () => void {
  const w = window as unknown as { requestIdleCallback?: (f: () => void, o: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(fn, { timeout: 1200 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 120);
  return () => window.clearTimeout(id);
}

/**
 * Panaskan satu gambar responsif. `pegang` false = hanya diunduh ke cache HTTP (tidak di-decode, tidak dipegang; untuk gambar
 * tokoh, supaya batas 2 gambar ter-decode tetap). Mengembalikan fungsi batal (hasil diabaikan, referensi dilepas).
 */
export function hangatkanGambar(varian: readonly VarianGambar[], sizes: string, pegangDecode = true): () => void {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || !varian.length) return () => {};
  pasangPantau();
  const srcset = srcsetDari(varian);
  const kunci = `${srcset}|${sizes}`;
  if (dikenal.has(kunci)) return () => {};
  const gen = generasi;
  dikenal.set(kunci, gen);
  let batal = false;
  const c = catatan();
  const hentikanIdle = nantiSaatIdle(() => {
    if (batal || gen !== generasi) return;
    if (c) c.diminta += 1;
    const t0 = performance.now();
    const img = new Image();
    img.decoding = 'async';
    img.sizes = sizes; // sizes + srcset SEBELUM src: browser memilih varian seperti <img> panggung
    img.srcset = srcset;
    img.src = varian[varian.length - 1]!.src;
    const tunggu = pegangDecode ? img.decode() : new Promise<void>((ok, gagal) => { img.onload = () => ok(); img.onerror = () => gagal(new Error('gagal')); });
    tunggu.then(() => {
      if (batal || gen !== generasi) return;
      if (!pegangDecode) { if (c) dorong(c.selesai, { kunci: img.currentSrc.split('/').pop() + '|' + sizes + '|unduh', currentSrc: img.currentSrc, ms: Math.round(performance.now() - t0), gen, sizes, dpr: dprKini() }); return; }
      pegang = [...pegang.filter((p) => p.kunci !== kunci), { kunci, img, currentSrc: img.currentSrc }].slice(-MAKS);
      if (c) dorong(c.selesai, { kunci: img.currentSrc.split('/').pop() + '|' + sizes, currentSrc: img.currentSrc, ms: Math.round(performance.now() - t0), gen, sizes, dpr: dprKini() });
    }, () => {
      if (c) c.gagal += 1;
      dikenal.delete(kunci); // gagal = bukan "sudah hangat"; boleh dicoba lagi nanti
    });
  });
  return () => {
    batal = true;
    hentikanIdle();
    if (dikenal.get(kunci) === gen && !pegang.some((p) => p.kunci === kunci)) dikenal.delete(kunci);
  };
}

/** Varian yang dipilih pemanasan untuk srcset ini (null = belum dipanaskan). */
export function hasilHangat(varian: readonly VarianGambar[]): string | null {
  const srcset = srcsetDari(varian);
  return pegang.find((p) => p.kunci.startsWith(srcset + '|'))?.currentSrc ?? null;
}

/**
 * Diagnostik: apakah <img> panggung (ukuran `sizes`) memakai berkas yang sama dengan pemanasan GENERASI KINI dengan sizes & DPR
 * yang sama (hasil generasi/ukuran lama tidak dibandingkan). Hanya saat DIAG; dev: peringatan bila beda.
 */
export function catatCocok(varian: readonly VarianGambar[], sizes: string, currentSrc: string) {
  const c = catatan();
  if (!c) return;
  const kunci = `${srcsetDari(varian)}|${sizes}`;
  const p = pegang.find((x) => x.kunci === kunci);
  const hangat = p && dikenal.get(kunci) === generasi ? p.currentSrc : null;
  if (!hangat) return;
  dorong(c.cocok, { src: currentSrc, hangat, sama: hangat === currentSrc });
  if (import.meta.env?.DEV && hangat !== currentSrc) console.warn('[hangat] varian beda', { panggung: currentSrc, hangat });
}

/**
 * Panaskan latar + depan komposisi ini (ter-decode, dipegang) untuk panggung berukuran w x h. `tokoh` true = gambar tokoh
 * yang tampil di awal ikut DIUNDUH (tanpa dipegang); hanya untuk komposisi yang ekspresinya pasti (komposisi pertama dari
 * state tersimpan), karena tebakan ekspresi yang salah = unduhan sia-sia.
 */
export function hangatkanKomposisi(ep: Episode, komposisi: KomposisiLatar, w: number, h: number, ruangBawah = 0, tokoh = false): () => void {
  const lok = ep.latar?.lokasi[komposisi.lokasi]?.ilustrasi;
  if (!lok || !(w > 0) || !(h > 0)) return () => {};
  const { lebar, berdiri, s } = ukuranDunia(ep, lok, komposisi, w, h, ruangBawah);
  const sizes = `${Math.round(lebar)}px`;
  const batal = [hangatkanGambar(lok.latar, sizes), lok.depan ? hangatkanGambar(lok.depan, sizes) : () => {}];
  if (tokoh) {
    // Sama dengan PanggungLatar: TokohDekat (slot tokoh.slot[n][i], kotakTokohIlustrasi) / LapisAdegan (kotak lapis berdiri).
    const t0 = lok.tokoh;
    if (t0.jenis === 'dekat') {
      const n = Math.min(3, komposisi.hadir.length) as 0 | 1 | 2 | 3;
      komposisi.hadir.slice(0, 3).forEach((tk, i) => {
        const g = dekatTokoh(ep, tk.id, tk.ekspresi);
        const x = (n ? t0.slot[n] : [])[i];
        if (g && x !== undefined) batal.push(hangatkanGambar(g.varian, `${Math.round(kotakTokohIlustrasi(t0, g, x).w * s)}px`, false));
      });
    } else {
      for (const l of berdiri.lapis) if (l.jenis === 'tokoh' && l.badan) batal.push(hangatkanGambar(l.badan.varian, `${Math.round(l.kotak.w * s)}px`, false));
    }
  }
  return () => batal.forEach((f) => f());
}

/** Sinyal "adegan kini sudah tampil" (PanggungLatar bergerbang): pemanasan berikutnya baru mulai sesudahnya, tidak berebut jaringan. */
export const ADEGAN_SIAP = 'raksa:adegan-siap';
export function sesudahAdeganSiap(akar: Element | null, fn: () => () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let batal: (() => void) | null = null;
  const jalan = () => { window.removeEventListener(ADEGAN_SIAP, jalan); batal ??= fn(); };
  if (akar?.querySelector('.cer-ilustrasi[data-siap]')) jalan();
  else window.addEventListener(ADEGAN_SIAP, jalan);
  return () => { window.removeEventListener(ADEGAN_SIAP, jalan); batal?.(); };
}

/**
 * Perkiraan ukuran panggung adegan HP (hp.css: .hp-main padding 12 px, kolom maks; panggung dekat 1:1 maks 54dvh) untuk
 * halaman yang belum memasang panggung (daftar episode). Diverifikasi sesudahnya lewat catatCocok.
 */
export function perkiraanPanggung(): { w: number; h: number } {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = vw < 600 ? vw - 24 : Math.min(vw - 40, 640);
  return { w, h: Math.min(w, vh * 0.54) };
}

/** Komposisi pertama episode untuk state ini (lanjutan tersimpan atau awal). */
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
