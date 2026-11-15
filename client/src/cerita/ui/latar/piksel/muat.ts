/** Pemuat PNG panggung piksel Episode 2 (cache per dokumen: sekali muat + dekode per URL; gagal boleh diulang). */
const cache = new Map<string, Promise<HTMLImageElement>>();
/** Gambar yang sudah didekode (siap digambar ke kanvas tanpa menunggu). */
export const siap = new Map<string, HTMLImageElement>();

export function muatPng(url: string): Promise<HTMLImageElement> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((ok, gagal) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).then(() => { siap.set(url, img); ok(img); }, gagal); };
      img.onerror = () => gagal(new Error('gagal ' + url));
      img.src = url;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}
