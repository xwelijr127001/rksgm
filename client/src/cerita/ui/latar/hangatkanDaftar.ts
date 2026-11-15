/**
 * Panaskan komposisi PERTAMA tiap episode berpanggung latar (Episode 2: PNG piksel) dari daftar episode, atau dari halaman
 * awal saat kartu Mode Cerita disentuh/difokus (modul ini diimpor dinamis di sana, jadi tidak masuk bundel halaman awal).
 * Build tanpa AUTO-2 (VITE_CERITA_TANPA) = DAFTAR_EPISODE tanpa episode itu = tidak ada yang dipanaskan.
 */
import { DAFTAR_EPISODE } from '../../episode';
import { stateAwal } from '../../mesin';
import { muatProgres } from '../../simpan';
import { hangatkanKomposisi, komposisiAwal } from './hangatkan';

export function hangatkanEpisodeAwal(): void {
  if (typeof window === 'undefined') return;
  for (const ep of DAFTAR_EPISODE.filter((e) => e.latar)) {
    const m = muatProgres(ep);
    hangatkanKomposisi(ep, komposisiAwal(ep, m.status === 'lanjut' ? m.state : stateAwal(ep)));
  }
}
