/**
 * ISTILAH sebuah baris dalam bahasa aktif (bagian MURNI tombol "Apa itu ...?"; tampilannya di KotakDialog.tsx DaftarIstilah).
 * Dipisah dari KotakDialog supaya bisa diuji di node tanpa memuat komponen & CSS.
 */
import type { Baris, Episode, KunciTeks } from '../tipe';

/** Istilah yang sudah diterjemahkan pemanggil (label & arti dalam bahasa aktif). */
export interface IstilahTampil {
  id: string;
  label: string;
  arti: string;
  /** (T-025) Rincian di bawah arti: satu butir per anggota, urut naskah; `ikon` = sel ikon piksel 32 px (cerita.css). */
  anggota?: { teks: string; ikon?: string }[];
}

/**
 * Istilah sebuah baris dalam bahasa aktif (`tx` = teks episode). Id yang tidak ada di `ep.istilah`, atau episode
 * tanpa istilah sama sekali, dilewati diam-diam (validasi episode yang menjaga rujukannya).
 */
export function istilahBaris(ep: Pick<Episode, 'istilah'>, baris: Pick<Baris, 'istilah'> | null | undefined, tx: (k: KunciTeks) => string): IstilahTampil[] {
  const daftar = ep.istilah;
  if (!baris || !Array.isArray(baris.istilah) || !daftar) return [];
  return baris.istilah.flatMap((id) => {
    const i = Object.prototype.hasOwnProperty.call(daftar, id) ? daftar[id] : undefined;
    return i ? [{ id, label: tx(i.label), arti: tx(i.arti), ...(i.anggota?.length ? { anggota: i.anggota.map((a) => ({ teks: tx(a.teks), ...(a.ikon ? { ikon: a.ikon } : {}) })) } : {}) }] : [];
  });
}
