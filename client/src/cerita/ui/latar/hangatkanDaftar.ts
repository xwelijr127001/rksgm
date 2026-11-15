/**
 * T-010 G3: panaskan komposisi PERTAMA tiap episode berpanggung latar (Episode 2) dari daftar episode, atau dari halaman awal
 * saat kartu Mode Cerita disentuh/difokus (modul ini diimpor dinamis di sana, jadi tidak masuk bundel halaman awal). Build
 * tanpa AUTO-2 (VITE_CERITA_TANPA) = DAFTAR_EPISODE tanpa episode itu = tidak ada yang dipanaskan.
 */
import { DAFTAR_EPISODE } from '../../episode';
import { stateAwal } from '../../mesin';
import { muatProgres } from '../../simpan';
import { hangatkanKomposisi, komposisiAwal, perkiraanPanggung } from './hangatkan';

export function hangatkanEpisodeAwal(): () => void {
  if (typeof window === 'undefined') return () => {};
  const { w, h } = perkiraanPanggung();
  const batal = DAFTAR_EPISODE.filter((ep) => ep.latar).map((ep) => {
    const m = muatProgres(ep);
    const s = m.status === 'lanjut' ? m.state : stateAwal(ep);
    return hangatkanKomposisi(ep, komposisiAwal(ep, s), w, h, 0, true);
  });
  return () => batal.forEach((f) => f());
}
