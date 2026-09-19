/**
 * Preferensi gerak/animasi.
 *
 * Bawaan: ikut perangkat. Bila sistem meminta "kurangi gerak" (Windows: Animation effects
 * mati; Android: Remove animations; iOS: Reduce Motion), semua animasi game berhenti:
 * tokoh tidak melambai, petugas tidak berjalan, transisi seketika.
 *
 * Banyak laptop kantor mematikan efek animasi demi performa, bukan karena kebutuhan
 * pengguna, sehingga tokoh tampak "mati" di layar acara. Panitia/pemain bisa menyalakan
 * animasi HANYA di perangkat itu (tersimpan di localStorage):
 *   ?gerak=penuh  -> animasi menyala walau sistem meminta dikurangi
 *   ?gerak=ikut   -> kembali mengikuti perangkat
 * atau lewat tombol "Nyalakan animasi" yang muncul di halaman panitia & layar proyektor.
 */

const KUNCI = 'raksa:gerak';
const ACARA = 'raksa:gerak-berubah';

export function sistemMintaKurang(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export function gerakPenuhDipaksa(): boolean {
  try { return localStorage.getItem(KUNCI) === 'penuh'; } catch { return false; }
}

/** true = game harus mengurangi gerak (dipakai hook useReducedMotion & adegan). */
export function gerakDikurangi(): boolean {
  return sistemMintaKurang() && !gerakPenuhDipaksa();
}

/** Tandai <html data-gerak="penuh"> supaya aturan CSS "kurangi gerak" tidak berlaku. */
function tandai(): void {
  const akar = document.documentElement;
  if (gerakPenuhDipaksa()) akar.dataset.gerak = 'penuh';
  else delete akar.dataset.gerak;
}

export function aturGerakPenuh(nyala: boolean): void {
  try {
    if (nyala) localStorage.setItem(KUNCI, 'penuh');
    else localStorage.removeItem(KUNCI);
  } catch { /* penyimpanan diblokir: abaikan */ }
  tandai();
  window.dispatchEvent(new Event(ACARA));
}

/** Dipanggil sekali sebelum render: baca ?gerak=... lalu tandai <html>. */
export function siapkanGerak(): void {
  try {
    const q = new URLSearchParams(window.location.search).get('gerak');
    if (q === 'penuh') localStorage.setItem(KUNCI, 'penuh');
    if (q === 'ikut') localStorage.removeItem(KUNCI);
  } catch { /* abaikan */ }
  tandai();
}

/** Berlangganan perubahan (setelan sistem atau tombol di aplikasi). Mengembalikan fungsi berhenti. */
export function pantauGerak(fn: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', fn);
  window.addEventListener(ACARA, fn);
  return () => { mq.removeEventListener('change', fn); window.removeEventListener(ACARA, fn); };
}
