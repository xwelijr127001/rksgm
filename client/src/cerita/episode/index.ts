/**
 * Daftar episode yang BISA DIMAINKAN (urutan = nomor episode di daftar /cerita). Episode yang belum lengkap tidak
 * didaftarkan di sini (tidak tampil sebagai kartu). Panduan: docs/cerita/PANDUAN-EPISODE.md
 *
 * Batas keamanan mode solo: naskah, klasifikasi, dan alasan episode ADA di bundel klien (dimainkan tanpa server dan
 * ditampilkan di ringkasan akhir). Untuk deployment lomba yang memakai kasus yang sama di room resmi, build dengan
 * VITE_CERITA_TANPA=<id,...>: vite.config mengganti modul episode itu dengan rintisan null (episode/rintisan.ts), jadi
 * isinya tidak ada di bundel sama sekali (bukan sekadar disembunyikan).
 */
import type { Episode } from '../tipe';
import { EPISODE_AUTO_1 } from './auto-1/episode';
import { EPISODE_AUTO_2 } from './auto-2/episode';
// T-064: Episode 1 Dev (potongan 5 menit auto-2; rute pendek /cerita/kenalan).
import { EPISODE_AUTO_2_DEV } from './auto-2-dev/episode';

export const DAFTAR_EPISODE: Episode[] = [EPISODE_AUTO_1, EPISODE_AUTO_2, EPISODE_AUTO_2_DEV].filter((e): e is Episode => e !== null);

export function cariEpisode(id: string | undefined): Episode | null {
  return DAFTAR_EPISODE.find((e) => e.id === id) ?? null;
}
