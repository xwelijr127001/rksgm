/**
 * Pemantau gagal-muat gambar sprite (siluet panggung latar, inisial potret).
 *
 * Event `error` dari <image> SVG tidak selalu sampai ke handler React: permintaan yang gagal sangat cepat (diblokir,
 * luring, berkas hilang) bisa selesai sebelum handler-nya terpasang (teramati di Chrome 2 Nov 2026: handler ada, event
 * buatan sampai, event asli tidak). Pemantau ini memuat URL yang sama lewat HTMLImageElement (permintaan berbagi cache
 * peramban), dan `onerror`-nya selalu terpanggil. `onError` di elemennya tetap dipasang sebagai jalur kedua.
 */
export function pantauGagalMuat(src: string, gagal: () => void): () => void {
  if (typeof Image === 'undefined' || !src) return () => {};
  let hidup = true;
  const img = new Image();
  img.onerror = () => {
    if (hidup) gagal();
  };
  img.src = src;
  return () => {
    hidup = false;
    img.onerror = null;
  };
}
