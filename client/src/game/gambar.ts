/**
 * Logika MURNI (tanpa React/engine) untuk misi bergambar - soal buatan panitia yang visualnya
 * gambar desainer, bukan adegan 2D (lihat docs/rancangan-bank-soal.md bagian 4).
 *
 * Satu pintu untuk keputusan "pakai gambar atau adegan": MissionPlay (HP pemain) dan
 * AdeganLayar (proyektor) memanggil visualMisi() yang sama, jadi keduanya selalu sepakat
 * dan engine tidak pernah dimuat untuk misi bergambar.
 */

import type { MissionPublic } from '@shared/types';

export type VisualMisi =
  /** Adegan 2D (GameStage). Tanpa spec adegan, GameStage sendiri jatuh ke ilustrasi statis. */
  | { jenis: 'adegan' }
  /** Gambar unggahan panitia di bingkai 4:3. */
  | { jenis: 'gambar'; src: string; alt: string }
  /** Soal bergambar yang gambarnya kosong: bingkai netral berisi judul misi. */
  | { jenis: 'netral' };

/**
 * Visual sebuah misi. Gambar menang atas adegan: bila `image` terisi, adegan 2D tidak dipakai
 * walau id misinya punya adegan. `scene === 'gambar'` tanpa gambar = bingkai netral (bukan galat).
 */
export function visualMisi(mission: Pick<MissionPublic, 'scene' | 'image' | 'title'>): VisualMisi {
  const src = typeof mission.image?.src === 'string' ? mission.image.src.trim() : '';
  if (src) {
    const alt = typeof mission.image?.alt === 'string' ? mission.image.alt.trim() : '';
    // Tanpa keterangan dari panitia, judul misi lebih baik daripada gambar bisu bagi pembaca layar.
    return { jenis: 'gambar', src, alt: alt || mission.title };
  }
  if (mission.scene === 'gambar') return { jenis: 'netral' };
  return { jenis: 'adegan' };
}

/** true = misi ini TIDAK memakai engine adegan (gambar atau bingkai netral). */
export function misiBergambar(mission: Pick<MissionPublic, 'scene' | 'image' | 'title'>): boolean {
  return visualMisi(mission).jenis !== 'adegan';
}

/** Keadaan bingkai gambar. */
export type StatusGambar = 'memuat' | 'siap' | 'gagal' | 'netral';

/**
 * Padanan status bingkai gambar ke status adegan yang dipahami pemanggil MissionPlay
 * (Play melaporkan "adegan siap" ke server untuk status apa pun selain 'loading').
 * Gagal muat tetap dihitung selesai: pemain menjawab lewat daftar, host tidak menunggu selamanya.
 */
export const STATUS_ADEGAN = {
  memuat: 'loading',
  siap: 'ready',
  gagal: 'failed',
  netral: 'static',
} as const satisfies Record<StatusGambar, 'static' | 'loading' | 'ready' | 'failed'>;

/**
 * Angka dari ketikan pemain.
 * - `bebas = false` (misi ber-adegan): hanya digit, persis perilaku lama ("Rp 1.500" -> 1500).
 * - `bebas = true` (soal kustom, kuncinya boleh pecahan/negatif): koma = desimal (kebiasaan
 *   Indonesia) dan titik = pemisah ribuan; satu titik yang TIDAK diikuti tepat tiga angka
 *   dibaca desimal ("2.5" -> 2,5 tetapi "1.500" -> 1500).
 * Tanpa digit = null (draft tidak disentuh).
 */
export function bacaAngka(teks: string, bebas = false): number | null {
  if (!bebas) {
    const bersih = teks.replace(/[^\d]/g, '');
    return bersih ? Number(bersih) : null;
  }
  let s = teks.trim().replace(/−/g, '-').replace(/[^\d.,-]/g, '');
  const negatif = s.startsWith('-');
  s = s.replace(/-/g, '');
  if (s.includes(',')) {
    const [bulat = '', ...pecahan] = s.split(',');
    s = `${bulat.replace(/\./g, '')}.${pecahan.join('').replace(/\./g, '')}`;
  } else {
    const bagian = s.split('.');
    s = bagian.length === 2 && bagian[1]!.length !== 3 ? `${bagian[0]}.${bagian[1]}` : bagian.join('');
  }
  if (!/\d/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negatif && n !== 0 ? -n : n;
}
