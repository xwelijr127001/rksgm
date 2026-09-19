/** Pembersih teks kiriman luar (nama, nama acara, isi soal kustom). Tanpa dependensi lain. */

/**
 * Karakter kontrol dibuang, spasi dirapikan, lalu dipotong sesuai batas.
 * Nilai yang bukan teks/angka (objek, array, fungsi) diubah lewat String() seperti biasa;
 * pemanggil yang menerima data sembarang sebaiknya memakai `teksAman`.
 */
export function cleanText(raw: unknown, max: number): string {
  let out = '';
  for (const ch of String(raw ?? '')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue;
    out += ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Seperti cleanText, tetapi TIDAK memotong (untuk validasi panjang) dan hanya menerima teks/angka. */
export function teksAman(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  return cleanText(raw, Number.MAX_SAFE_INTEGER);
}
