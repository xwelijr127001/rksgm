/**
 * Bendera PROTOTIPE meja kasus K11 (D-68). Build biasa: `MEJA_KASUS` false -> kode meja tidak ikut dibundel dan pola
 * bundel lama tampil tanpa perubahan. Build prototipe (VITE_MEJA_KASUS=1): meja kasus aktif, kecuali pemain memilih
 * versi sekarang untuk membandingkan (`?k11=lama`, kembali dengan `?k11=meja`; disimpan per peramban).
 */
declare const __MEJA_KASUS__: boolean | undefined;
/** Diganti konstanta oleh vite.config (`define`); di luar Vite (tes node) tidak terdefinisi = false. */
export const MEJA_KASUS: boolean = typeof __MEJA_KASUS__ === 'boolean' ? __MEJA_KASUS__ : false;

const KUNCI = 'raksa:proto:k11';

export function mejaAktif(): boolean {
  if (!MEJA_KASUS) return false;
  try {
    const q = new URLSearchParams(window.location.search).get('k11');
    if (q === 'lama' || q === 'meja') localStorage.setItem(KUNCI, q);
    return localStorage.getItem(KUNCI) !== 'lama';
  } catch {
    return true;
  }
}
