/**
 * Pembantu murni untuk menyisipkan berkas SVG (impor ?raw) sebagai markup inline. Id di dalam SVG (pattern, gradien) diberi
 * sufiks unik per pemakaian supaya beberapa salinan pada satu halaman tidak bentrok.
 */

/** Semua id yang dideklarasikan di dalam markup. */
export function idDalamSvg(markup: string): string[] {
  return [...markup.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
}

/** Beri sufiks pada setiap id dan semua rujukannya (url(#id), href="#id"). */
export function unikkan(markup: string, sufiks: string): string {
  let out = markup;
  for (const id of idDalamSvg(markup)) {
    const baru = `${id}-${sufiks}`;
    out = out.split(`id="${id}"`).join(`id="${baru}"`).split(`url(#${id})`).join(`url(#${baru})`).split(`href="#${id}"`).join(`href="#${baru}"`);
  }
  return out;
}
