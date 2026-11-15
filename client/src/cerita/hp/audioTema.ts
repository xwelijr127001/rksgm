/** Pemetaan MURNI audio mode cerita (tanpa React/DOM): tema musik per bagian & suasana per lokasi. Diuji di audio-cerita.test.ts. */
import type { Suasana, Track } from '../../audio/audio';

export type TemaCerita = Extract<Track, 'cerita-kantor' | 'cerita-periksa' | 'cerita-penutup'>;

/** Tema menurut bagian: b1 & b4 percakapan = kantor; b2-b3 = pemeriksaan; K15 & akhir = penutup. */
export function temaUntuk(babId: string | undefined, node: string, akhir: boolean): TemaCerita {
  if (akhir || node === 'k15' || node.startsWith('k15-') || node.startsWith('akhir')) return 'cerita-penutup';
  if (babId === 'b2' || babId === 'b3') return 'cerita-periksa';
  return 'cerita-kantor';
}

/** Suasana menurut lokasi adegan; obrolan (WhatsApp) & kantor tanpa suasana. */
export function suasanaUntuk(lokasi: string | undefined, obrolan: boolean): Suasana {
  if (obrolan || !lokasi) return null;
  if (lokasi === 'tol') return 'jalan';
  if (lokasi === 'pool' || lokasi === 'bengkel') return 'bengkel';
  return null;
}

