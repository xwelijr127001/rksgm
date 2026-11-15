/**
 * Huruf piksel 3 x 5 (D-88): teks papan nama runtime di kanvas panggung piksel digambar dengan piksel seni yang sama, bukan
 * fon sistem. Font = tools/piksel/lib.mjs FONT (huruf besar, angka, tanda baca dasar). Teks dengan karakter di luar font
 * (mis. aksara zh) -> null: pemakai kembali ke fillText.
 */
const FONT: Readonly<Record<string, string>> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', '/': '001001010100100',
  '_': '000000000000111', ' ': '000000000000000', 'x': '000101010101000', '(': '010100100100010', ')': '010001001001010', '=': '000111000111000', '%': '101001010100101',
};

/** D-98: glyph LEBAR 5 x 5 (M dan W tidak terbaca pada 3 kolom: KLAIM terbaca KLAIN). */
const LEBAR: Readonly<Record<string, string>> = { M: '1000111011101011000110001', W: '1000110001101011101110001' };

/** Titik-titik piksel (x, y piksel seni relatif kiri-atas) untuk teks, atau null bila ada karakter tanpa glyph. */
export function titikTeks(teks: string): { titik: [number, number][]; w: number; h: number } | null {
  const t = teks.toUpperCase();
  const titik: [number, number][] = [];
  let x = 0;
  for (const ch of t) {
    const l = LEBAR[ch];
    if (l) { for (let i = 0; i < 25; i++) if (l[i] === '1') titik.push([x + (i % 5), Math.floor(i / 5)]); x += 6; continue; }
    const f = FONT[ch];
    if (f === undefined) return null;
    for (let i = 0; i < 15; i++) if (f[i] === '1') titik.push([x + (i % 3), Math.floor(i / 3)]);
    x += 4;
  }
  return { titik, w: Math.max(0, x - 1), h: 5 };
}
