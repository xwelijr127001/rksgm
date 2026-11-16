/**
 * Letak teks papan nama (piksel seni) di dalam kotak papan: dipakai panggung (PanggungPiksel) DAN pembuat PNG latar aktivitas
 * (tools/piksel/bangun-papan-ep2.mts, D-102), supaya keduanya identik.
 */
import type { Kotak } from '../../panggung/dunia';

/** Teks papan kantor = merek; sama di semua bahasa (teks.id 'lokasi.kantor', diuji di adegan.test.ts). */
export const TEKS_PAPAN_KANTOR = 'Layanan Klaim Raksa';

/** Titik piksel seni ABSOLUT teks di papan (kotak dunia, K satuan dunia per piksel seni); null = tak muat / di luar font. */
export function titikPapanKantor(kotak: Kotak, K: number, titikTeks: (t: string) => { titik: [number, number][]; w: number; h: number } | null, teks = TEKS_PAPAN_KANTOR): { titik: [number, number][] } | null {
  const tt = titikTeks(teks);
  if (!tt || tt.w > kotak.w / K - 4) return null;
  const ax = Math.round(kotak.x / K + (kotak.w / K - tt.w) / 2), ay = Math.round(kotak.y / K + (kotak.h / K - tt.h) / 2);
  return { titik: tt.titik.map(([x, y]) => [ax + x, ay + y]) };
}
