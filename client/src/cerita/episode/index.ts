/**
 * Daftar episode yang BISA DIMAINKAN. Episode yang belum lengkap tidak didaftarkan di sini
 * (tidak tampil sebagai kartu). Panduan: docs/cerita/PANDUAN-EPISODE.md
 */
import type { Episode } from '../tipe';
import { EPISODE_AUTO_1 } from './auto-1/episode';

export const DAFTAR_EPISODE: Episode[] = [EPISODE_AUTO_1].filter((e): e is Episode => e !== null);

export function cariEpisode(id: string | undefined): Episode | null {
  return DAFTAR_EPISODE.find((e) => e.id === id) ?? null;
}
