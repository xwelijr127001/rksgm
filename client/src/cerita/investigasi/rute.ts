/**
 * T-094 RAKSA INVESTIGATOR: ALAMAT. Hub seri ada di `/investigator`; pemain kasus ke-n di `/investigator/<n>` (pemain cerita
 * yang sama dengan `/cerita/<idEpisode>`: id episode, simpanan cerita dan rekaman `raksa:investigasi:v1` tidak berubah).
 * Alamat lama tetap hidup: `/cerita/investigator` -> `/investigator/1`, `/cerita/investigator/2` -> `/investigator/2`, dan
 * `/cerita/auto-2-inv` / `/cerita/auto-2-inv-2` membuka pemain yang sama dengan jalan pulang ke `/cerita` seperti semula.
 *
 * Berkas ini SENGAJA ringan (tanpa data episode): dipakai App (rute), PramuatCerita, CeritaMain, pemutar HP dan hub.
 */
import { useLocation } from 'react-router-dom';

export const RUTE_HUB = '/investigator';
/** Nomor kasus di alamat hub -> id episode. Menambah kasus = satu baris di sini + episodenya di episode/index.ts. */
export const EPISODE_KASUS: Readonly<Record<string, string>> = { '1': 'auto-2-inv', '2': 'auto-2-inv-2' };

export const ruteKasus = (nomor: number | string): string => `${RUTE_HUB}/${nomor}`;

/**
 * Id episode dari parameter rute: `/cerita/:episode` apa adanya; `/investigator/:kasus` lewat EPISODE_KASUS (nomor yang tidak
 * dikenal = '' supaya pemanggil memperlakukannya sebagai episode tak dikenal). Tanpa keduanya = undefined.
 */
export function idEpisodeRute(p: Readonly<{ episode?: string; kasus?: string }>): string | undefined {
  if (p.episode !== undefined) return p.episode;
  if (p.kasus === undefined) return undefined;
  return Object.prototype.hasOwnProperty.call(EPISODE_KASUS, p.kasus) ? EPISODE_KASUS[p.kasus] : '';
}

/** true = alamat ini milik hub Investigator (hub sendiri atau pemain kasus di bawahnya). */
export const diHubInvestigator = (pathname: string): boolean => pathname === RUTE_HUB || pathname.startsWith(RUTE_HUB + '/');

/**
 * Jalan pulang pemain cerita (tombol kembali, "Selesai" di layar hasil, dialog pemulihan): `/investigator` bila kasus dibuka
 * dari hub atau lewat alamat pendek Investigator, selain itu daftar episode `/cerita` seperti semula.
 */
export function useRumahCerita(): string {
  return diHubInvestigator(useLocation().pathname) ? RUTE_HUB : '/cerita';
}

/**
 * Niat yang dibawa tautan hub ke pemain (state navigasi, bukan alamat):
 *  'lewati-judul'  hub baru saja menampilkan sampul kasus itu: pemain melewati kartu judulnya (tidak tampil dua kali);
 *  'lanjut'        tamu sudah memilih "Lanjutkan Kasus N" di hub: gerbang "Lanjutkan / Mulai baru" tidak ditanyakan lagi.
 */
export type NiatHub = 'lewati-judul' | 'lanjut';
export const stateNiat = (niat: NiatHub): { inv: NiatHub } => ({ inv: niat });
export function niatHub(state: unknown): NiatHub | null {
  const n = state && typeof state === 'object' ? (state as { inv?: unknown }).inv : null;
  return n === 'lewati-judul' || n === 'lanjut' ? n : null;
}
