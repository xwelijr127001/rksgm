/**
 * Sprite tokoh Raksa (Mr Roger, Miss Raksa, Bu Isti) untuk panel HTML. Tokoh tidak
 * digambar di adegan supaya tidak pernah menutupi objek, label, atau tanda pembahasan.
 * Gambar di client/public/karakter/ dibuat oleh `node tools/siapkan-karakter.mjs`.
 * Bila gambar gagal dimuat, tokoh dilewati diam-diam: permainan tetap jalan.
 *
 * Miss Raksa memakai SENI PIKSEL v4 (sheet disusun dari atlas piksel cerita, nearest-neighbour x`piksel.skala`):
 * `SPRITE_BESAR.missRaksa.piksel` memuat ukuran seni asli. Tampilan piksel selalu pada jumlah piksel PERANGKAT bulat
 * per piksel seni (`ukuranSpritePiksel`, `potretSpritePiksel`), bukan skala pecahan; Mr Roger & Bu Isti tidak berubah.
 */

import { useSyncExternalStore } from 'react';
import { TOKOH, type IdTokoh } from '@shared/brand';
import meta from './art/karakter-sprite.json';

/** Ukuran seni asli sheet piksel (satu frame, piksel seni) + titik untuk potret. */
export interface SpritePiksel {
  /** Piksel berkas per piksel seni di sheet (nearest-neighbour). */
  skala: number;
  frameW: number;
  frameH: number;
  kaki: { x: number; y: number };
  kepala: { x: number; y: number };
  kepalaTinggi: number;
  /** Kotak wajah (piksel seni, frame 0). */
  wajah: { x: number; y: number; w: number; h: number } | null;
}

export interface SpriteBesar {
  dasar: string;
  /** Ukuran frame di BERKAS (px). */
  frameW: number;
  frameH: number;
  frames: number;
  /** Ada = seni piksel (tampil pada piksel perangkat bulat, image-rendering pixelated). */
  piksel?: SpritePiksel;
}

type MetaTokoh = { berkas: string; besar: { frameW: number; frameH: number }; piksel?: SpritePiksel };
const M = meta as unknown as { frames: number } & Record<IdTokoh, MetaTokoh>;
const sprite = (id: IdTokoh): SpriteBesar => ({
  dasar: `/karakter/${M[id].berkas}-besar`,
  frameW: M[id].besar.frameW,
  frameH: M[id].besar.frameH,
  frames: M.frames,
  ...(M[id].piksel ? { piksel: M[id].piksel } : {}),
});

/** Sheet besar (halaman HTML & proyektor) per tokoh: awalan berkas + ukuran frame. */
export const SPRITE_BESAR: Record<IdTokoh, SpriteBesar> = {
  ceo: sprite('ceo'),
  missRaksa: sprite('missRaksa'),
  isti: sprite('isti'),
};
const sudahDiunduh: HTMLImageElement[] = [];

/**
 * Unduh sprite halaman selagi koneksi masih ada. Bu Isti tampil justru saat koneksi HP
 * terputus, jadi gambarnya harus sudah ada di memori sebelum itu terjadi.
 */
export function prefetchSpriteHalaman(): void {
  if (sudahDiunduh.length) return;
  // Pilih format yang sama dengan yang dipakai CSS (image-set WebP, selain itu PNG).
  const webp = typeof CSS !== 'undefined' && CSS.supports('background-image', 'image-set(url("a.webp") type("image/webp"))');
  for (const id of ['isti', 'missRaksa', 'ceo'] as const) {
    if (!TOKOH[id].aktif) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = `${SPRITE_BESAR[id].dasar}.${webp ? 'webp' : 'png'}`;
    sudahDiunduh.push(img);
  }
}

/** Kalimat bergiliran menurut nomor (misi), supaya tiap misi terasa berbeda. */
export function kalimatKe(daftar: readonly string[], nomor: number): string {
  if (!daftar.length) return '';
  const n = Math.abs(Math.trunc(nomor));
  return daftar[n % daftar.length]!;
}

// ------------------------------------------------------------------ piksel perangkat (seni piksel)

/** devicePixelRatio kini (1 di luar peramban atau bila nilainya tidak sah). */
export function dprKini(): number {
  const d = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
  return typeof d === 'number' && d > 0 && Number.isFinite(d) ? d : 1;
}

/**
 * Berlangganan perubahan devicePixelRatio (zoom peramban, pindah ke layar lain): media query resolusi KINI, dipasang
 * ulang setiap kali berubah. Tanpa matchMedia = tidak pernah memberi tahu.
 */
export function langgananDpr(f: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  let mq: MediaQueryList | null = null;
  const lepas = () => {
    if (!mq) return;
    if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', ubah);
    else mq.removeListener?.(ubah);
  };
  function ubah(): void {
    pasang();
    f();
  }
  function pasang(): void {
    lepas();
    mq = window.matchMedia(`(resolution: ${dprKini()}dppx)`);
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', ubah);
    else mq.addListener?.(ubah);
  }
  pasang();
  return lepas;
}

/** devicePixelRatio yang ikut berubah (re-render) saat zoom / layar berganti. */
export function useDpr(): number {
  return useSyncExternalStore(langgananDpr, dprKini, () => 1);
}

/**
 * Piksel PERANGKAT bulat per piksel seni untuk menampilkan seni setinggi `seniPx` piksel seni kira-kira setinggi
 * `cssPx` px CSS: bulat terdekat, minimal 1 (seni piksel tidak pernah dikecilkan di bawah 1:1 karena piksel akan
 * hilang).
 */
export function skalaPerangkat(cssPx: number, seniPx: number, dpr: number): number {
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  if (!(seniPx > 0) || !(cssPx > 0)) return 1;
  return Math.max(1, Math.round((cssPx * d) / seniPx));
}

/**
 * Piksel perangkat MINIMUM per piksel seni untuk sprite badan penuh global (v5): floor(dpr), yaitu ± 1 px CSS per
 * piksel seni pada dpr bulat. Alasan (review v4): sheet badan penuh setinggi 184 piksel seni; dengan pembulatan terdekat
 * saja, slot 96-116 px di HP dpr 2 jatuh ke 1 piksel perangkat = 92 px CSS dan wajah hanya ± 12 px CSS (lebih kecil dari
 * slot lama), sedangkan desktop dpr 1 sudah 184 px CSS. Dengan batas ini ukuran CSS sama di HP dpr 2/3 dan desktop dpr 1
 * (184 px, wajah 24 px), dpr pecahan dibulatkan ke bawah (1,25 -> 147 px, 1,5 -> 123 px, 2,625 -> 140 px) supaya layar
 * laptop 125-150 % tidak membengkak. Tinggi diminta yang lebih besar tetap dibulatkan ke terdekat.
 */
export function skalaMinSpritePiksel(dpr: number): number {
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  return Math.max(1, Math.floor(d + 1e-9));
}

/**
 * Ukuran tampil (px CSS) sprite piksel yang diminta setinggi `tinggi` px: n piksel perangkat per piksel seni (bulat,
 * `skalaPerangkat`, minimal `skalaMinSpritePiksel`), jadi tingginya n x frameH / dpr (bisa berbeda dari `tinggi`).
 */
export function ukuranSpritePiksel(p: SpritePiksel, tinggi: number, dpr: number): { w: number; h: number; n: number } {
  const n = Math.max(skalaMinSpritePiksel(dpr), skalaPerangkat(tinggi, p.frameH, dpr));
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  return { w: (n * p.frameW) / d, h: (n * p.frameH) / d, n };
}

/**
 * Ukuran permintaan jendela potret piksel cerita (px) + piksel perangkat per px permintaan: dpr bulat (1, 2, 3) =
 * ukuran CSS (potongan sama di semua perangkat, x dpr), dpr pecahan = piksel perangkat (x 1).
 */
export function ukuranPermintaanPotret(tampil: number, dpr: number): { px: number; kali: number } {
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  const bulat = Math.round(d);
  if (bulat >= 1 && Math.abs(d - bulat) < 0.01) return { px: Math.max(1, Math.round(tampil)), kali: bulat };
  return { px: Math.max(1, Math.round(tampil * d)), kali: 1 };
}

/** Sisi jendela potret acuan (piksel seni): kepala + bahu seperti jendela potret 52 manifest cerita. */
export const SISI_POTRET_PIKSEL = 52;

/**
 * Potret bulat `ukuran` px CSS dari frame 0 sheet piksel: n piksel perangkat per piksel seni (bulat; acuan jendela
 * SISI_POTRET_PIKSEL), jendela persegi `sisi` piksel seni = ukuran x dpr / n. Letak mengikuti jendela potret manifest
 * cerita: jendela >= 58 memperlihatkan kepala utuh (atas = puncak sanggul - 1), 50-57 seperti jendela 52 manifest
 * (atas = puncak + 3), keduanya kepala dipusatkan; jendela lebih kecil dipusatkan ke wajah dan boleh memotong
 * sanggul, dagu tetap di dalam. `x`/`y` = pojok kiri-atas
 * jendela (piksel seni, bulat), `q` = px CSS per piksel seni.
 */
export function potretSpritePiksel(p: SpritePiksel, ukuran: number, dpr: number): { x: number; y: number; sisi: number; n: number; q: number } {
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  const n = skalaPerangkat(ukuran, SISI_POTRET_PIKSEL, d);
  const sisi = (ukuran * d) / n;
  const puncak = p.kepala.y - p.kepalaTinggi / 2;
  const w = p.wajah ?? { x: p.kepala.x - 12, y: p.kepala.y - 2, w: 24, h: 24 };
  const cx = sisi >= 50 ? p.kepala.x : w.x + w.w / 2;
  const x = Math.round(cx - sisi / 2);
  const bawahWajah = w.y + w.h + 4;
  const y = sisi >= 58 ? Math.round(puncak - 1)
    : sisi >= 50 ? Math.round(puncak + 3)
      : Math.round(Math.min(Math.max(bawahWajah - sisi, puncak), w.y - 2));
  return { x, y, sisi, n, q: n / d };
}
