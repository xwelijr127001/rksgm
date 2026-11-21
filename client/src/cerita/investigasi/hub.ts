/**
 * T-094 RAKSA INVESTIGATOR: KEADAAN HUB (fungsi murni + baca penyimpanan; tanpa React). Hub (`pages/Investigator.tsx`) dan kartu
 * "Raksa Investigator" di daftar episode membaca perangkat ini lewat dua sumber yang SUDAH ada, tanpa penyimpanan baru:
 *  - progres cerita per episode (`cerita/simpan.ts` muatProgres): kasus belum dibuka / sedang berjalan / tamat;
 *  - rekaman Investigator (`raksa:investigasi:v1`): stempel dan skor terbaik per kasus.
 * Tindakan utama hub (tinjauan penempatan Codex, butir 1):
 *   ada kasus yang sedang berjalan        -> "Lanjutkan Kasus N";
 *   selain itu kasus pertama tanpa stempel -> "Buka Kasus N" ('sampul' bila perangkat masih kosong: hub menampilkan sampul kasus itu);
 *   semua kasus sudah berstempel          -> "Main lagi" (kasus dengan skor terbaik terendah; seri = nomor terkecil).
 */
import { cariEpisode, DAFTAR_EPISODE } from '../episode';
import { muatProgres, mulaiBaru } from '../simpan';
import type { Episode, KonfigInvestigasi } from '../tipe';
import { ruteKasus } from './rute';
import { KEPALA_MIN_TOTAL } from '@shared/investigator/rubric';
import { adaRekaman, bacaRekaman, STEMPEL_SENIOR, stempelSeri, tamuBaru, totalSkor, type RekamanInvestigasi } from './simpan';
import { SKOR_MAKS } from './skor';

export type StatusKasusHub = 'baru' | 'jalan' | 'selesai';
export interface KasusHub {
  ep: Episode;
  konfig: KonfigInvestigasi;
  nomor: number;
  /** Progres cerita episode ini di perangkat. */
  status: StatusKasusHub;
  stempel: boolean;
  /** Skor terbaik kasus (0..100) atau null bila belum pernah ditamatkan. */
  terbaik: number | null;
}

/** Episode Investigator yang ada di build ini, urut nomor kasus. */
export function episodeInvestigator(): Episode[] {
  return DAFTAR_EPISODE.filter((e) => !!e.investigasi).sort((a, b) => a.investigasi!.nomor - b.investigasi!.nomor);
}

function statusKasus(ep: Episode): StatusKasusHub {
  const m = muatProgres(ep);
  if (m.status !== 'lanjut') return 'baru'; // 'tidakCocok' ditangani pemain (dialog pemulihan)
  if (m.state.akhir) return 'selesai';
  return m.state.langkah > 0 ? 'jalan' : 'baru';
}

export function daftarKasusHub(r: RekamanInvestigasi = bacaRekaman()): KasusHub[] {
  return episodeInvestigator().map((ep) => {
    const konfig = ep.investigasi!;
    const terbaik = Object.prototype.hasOwnProperty.call(r.terbaik, konfig.kasus) ? r.terbaik[konfig.kasus]! : null;
    return { ep, konfig, nomor: konfig.nomor, status: statusKasus(ep), stempel: r.stempel.includes(konfig.kasus), terbaik };
  });
}

export interface AksiHub {
  jenis: 'sampul' | 'buka' | 'lanjut' | 'lagi';
  kasus: KasusHub;
}

export function aksiUtamaHub(daftar: KasusHub[], r: RekamanInvestigasi = bacaRekaman()): AksiHub | null {
  if (!daftar.length) return null;
  const jalan = daftar.find((k) => k.status === 'jalan');
  if (jalan) return { jenis: 'lanjut', kasus: jalan };
  const berikut = daftar.find((k) => !k.stempel);
  if (berikut) {
    const kosong = !adaRekaman(r) && daftar.every((k) => k.status === 'baru');
    return { jenis: kosong ? 'sampul' : 'buka', kasus: berikut };
  }
  const terendah = daftar.reduce((a, b) => ((b.terbaik ?? 0) < (a.terbaik ?? 0) ? b : a));
  return { jenis: 'lagi', kasus: terendah };
}

/**
 * T-099: alamat kasus Raksa Investigator yang ditautkan sebuah episode cerita (Episode.kasusTerkait), di bawah hub
 * (/investigator/<n>); null bila episode itu tidak menautkan kasus atau kasusnya tidak ada di build ini.
 */
export function ruteKasusTerkait(ep: Episode): string | null {
  const kasus = ep.kasusTerkait ? cariEpisode(ep.kasusTerkait.episode)?.investigasi : undefined;
  return kasus ? ruteKasus(kasus.nomor) : null;
}

/**
 * "Tamu baru" (T-090, dipindah ke sini T-094): hapus rekaman perangkat (skor, stempel) DAN arsipkan progres cerita kasus
 * Investigator (cerita/simpan.ts `mulaiBaru`), supaya tamu berikutnya tidak membuka sebuah kasus langsung di layar hasil tamu
 * sebelumnya (yang akan mencatat stempelnya lagi). `kini` = kasus yang sedang terbuka di pemain: progresnya dimulai ulang oleh
 * pemain itu sendiri. Tanpa `kini` (hub) = semua kasus. Episode lain (bukan Investigator) dan profil tidak disentuh.
 */
export function tamuBaruSemuaKasus(kini?: Episode): void {
  tamuBaru();
  for (const e of episodeInvestigator()) if (e.id !== kini?.id) mulaiBaru(e);
}

// ------------------------------------------------------------------ T-106: satu tindakan berikutnya, tujuan pangkat berikutnya

/**
 * SATU tindakan berikutnya yang selalu bisa dijalankan (layar hasil; dihitung ulang sesudah tiap hasil):
 *   'buka'  berkas berikutnya yang belum berstempel (urut nomor kasus);
 *   'lagi'  semua sudah berstempel: main lagi kasus dengan poin yang paling banyak bisa diraih kembali (100 - skor terbaik;
 *           seri = nomor kasus terkecil);
 *   'arsip' semua kasus sudah sempurna: buka arsip kasus ini.
 */
export type AksiLanjut = { jenis: 'buka'; kasus: KasusHub } | { jenis: 'lagi'; kasus: KasusHub; pulih: number } | { jenis: 'arsip' };
export function aksiLanjut(daftar: KasusHub[]): AksiLanjut {
  const baru = daftar.find((k) => !k.stempel);
  if (baru) return { jenis: 'buka', kasus: baru };
  let lagi: KasusHub | null = null;
  let pulih = 0;
  for (const k of daftar) {
    const p = SKOR_MAKS - (k.terbaik ?? 0);
    if (p > pulih) { pulih = p; lagi = k; }
  }
  return lagi ? { jenis: 'lagi', kasus: lagi, pulih } : { jenis: 'arsip' };
}

/**
 * Tujuan pangkat berikutnya: 'senior' = `kurang` kasus lagi (sesudah stempel pertama); 'kepala' = `kurang` poin lagi menuju
 * total 255 (sesudah tiga stempel); null = belum punya stempel, atau sudah Kepala.
 */
export function tujuanPangkat(r: Pick<RekamanInvestigasi, 'stempel' | 'terbaik'>): { jenis: 'senior' | 'kepala'; kurang: number } | null {
  const n = stempelSeri(r).length;
  if (n === 0) return null;
  if (n < STEMPEL_SENIOR) return { jenis: 'senior', kurang: STEMPEL_SENIOR - n };
  const total = totalSkor(r);
  return total < KEPALA_MIN_TOTAL ? { jenis: 'kepala', kurang: KEPALA_MIN_TOTAL - total } : null;
}
