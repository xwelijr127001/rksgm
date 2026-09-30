/**
 * PINTU ruang layanan: daun pintu kayu (lapisan terpisah, engsel di tepi KIRI; panggung memutarnya dengan skala-X +
 * skew dari engsel) dan KORIDOR terang di balik bukaan (terlihat saat daun terbuka). Juga dipakai `pintu-luar`
 * (dari sisi koridor; di balik bukaan = sekilas ruang layanan kuning hangat).
 */
import { GARIS, cahaya, elips, gores, gradLinear, jalur, klipKotak, kotak, n, poli, tepi } from './alat';
import { WARNA } from './dinding';

type Kotak = { x: number; y: number; w: number; h: number };

/**
 * Daun pintu kayu jati hangat: serat vertikal, jendela intip kaca buram (sisi gagang), gagang tuas kuningan di
 * kanan (engsel kiri), bayang kusen di tepi atas & kiri. `tinggiGagang` = y dunia gagang.
 */
export function daunPintu(id: string, b: Kotak, tinggiGagang: number): string {
  const { x, y, w, h } = b;
  const kanan = x + w;
  const bawah = y + h;
  let s = `<defs>${gradLinear(`${id}-kayu`, x, y, kanan, bawah, [[0, '#a36a43'], [0.5, '#8a5634'], [1, '#6f4127']])}</defs>`;
  s += kotak(x, y, w, h, `url(#${id}-kayu)`);
  // Serat vertikal halus.
  let serat = '';
  for (let i = 1; i < 14; i += 1) {
    const sx = x + (w * i) / 14 + ((i * 37) % 7) - 3;
    serat += `M${n(sx)} ${n(y + 4)} C${n(sx + 3)} ${n(y + h * 0.3)} ${n(sx - 3)} ${n(y + h * 0.65)} ${n(sx + 1)} ${n(bawah - 4)} `;
  }
  s += gores(serat, '#4f2c16', 1.1, 'opacity=".28"');
  // Panel timbul (dua bidang) — garis halus terang/gelap.
  const px = x + w * 0.12;
  const pw = w * 0.42;
  for (const [py, ph] of [[y + h * 0.08, h * 0.44], [y + h * 0.58, h * 0.34]] as const) {
    s += kotak(px, py, pw, ph, 'none', `stroke="#c48b5f" stroke-width="1.6" opacity=".55"`);
    s += kotak(px + 2, py + 2, pw - 4, ph - 4, 'none', `stroke="#4a2814" stroke-width="1.4" opacity=".45"`);
  }
  // Jendela intip kaca buram di sisi gagang.
  const kx = x + w * 0.66;
  const kw = w * 0.16;
  const ky = y + h * 0.1;
  const kh = h * 0.42;
  s += `<defs>${gradLinear(`${id}-kaca`, kx, ky, kx + kw, ky + kh, [[0, '#fbf5e6'], [0.6, '#efe5cf'], [1, '#d9cbb0']])}</defs>`;
  s += kotak(kx - 3, ky - 3, kw + 6, kh + 6, '#c9a877', tepi(1, 0.6));
  s += kotak(kx, ky, kw, kh, `url(#${id}-kaca)`, tepi(0.9, 0.5));
  s += gores(`M${n(kx + kw * 0.25)} ${n(ky + 8)} L${n(kx + kw * 0.7)} ${n(ky + kh * 0.4)}`, '#ffffff', 2, 'opacity=".55"');
  // Pelat tendang bawah.
  s += kotak(x + 6, bawah - h * 0.07, w - 12, h * 0.055, '#b99a6e', 'opacity=".55"');
  // Gagang tuas kuningan (menunjuk ke engsel) + lubang kunci.
  const gx = kanan - w * 0.13;
  s += kotak(gx - 4, tinggiGagang - 16, 9, 36, '#b8954f', tepi(0.9, 0.7));
  s += jalur(`M${n(gx + 2)} ${n(tinggiGagang - 3)} h-30 q-5 0 -5 4 q0 4 5 4 h30 Z`, '#d8b86c', tepi(0.9, 0.8));
  s += gores(`M${n(gx - 1)} ${n(tinggiGagang - 1.5)} h-26`, '#fff1c2', 1.2, 'opacity=".8"');
  s += elips(gx + 0.5, tinggiGagang + 12, 1.6, 2.6, '#3a2412');
  // Bayang kusen di atas & kiri (cahaya kiri atas), sorot di kanan.
  s += `<defs>${gradLinear(`${id}-bayA`, 0, y, 0, y + 22, [[0, '#1d0f06', 0.5], [1, '#1d0f06', 0]])}${gradLinear(`${id}-bayK`, x, 0, x + 18, 0, [[0, '#1d0f06', 0.45], [1, '#1d0f06', 0]])}</defs>`;
  s += kotak(x, y, w, 22, `url(#${id}-bayA)`) + kotak(x, y, 18, h, `url(#${id}-bayK)`);
  s += kotak(x, y, w, h, 'none', tepi(1.4, 0.8));
  // Engsel (dua daun engsel di tepi kiri).
  for (const ey of [y + h * 0.12, y + h * 0.5, y + h * 0.86]) s += kotak(x + 1, ey, 4, 20, '#c8a860', tepi(0.7, 0.6));
  return s;
}

/**
 * Koridor terang di balik bukaan (dilihat dari ruang layanan): dinding krem bercahaya siang, lantai batu terang,
 * kusen samping kanan (reveal) karena titik hilang di kiri, tanaman di tepi kanan. Seluruh isi DIPOTONG ke bukaan
 * (clipPath): daun tanaman dulu meluber ± 12 satuan ke kanan bukaan & tampak di atas kusen walau pintu tertutup.
 */
export function koridorTerang(id: string, b: Kotak): string {
  const { x, y, w, h } = b;
  const kanan = x + w;
  const bawah = y + h;
  const lantaiY = bawah - 40;
  let s = `<defs>${gradLinear(`${id}-dd`, x, y, kanan, lantaiY, [[0, '#fffaf0'], [0.55, '#f5ead4'], [1, '#e6d4b2']])}</defs>`;
  s += kotak(x, y, w, h, `url(#${id}-dd)`);
  // Berkas cahaya siang dari kiri (jendela di luar bingkai).
  s += poli([[x, y + 20], [x + w * 0.42, y + 20], [x + w * 0.2, lantaiY], [x, lantaiY]], '#ffffff', 'opacity=".35"');
  // Lampu dinding kecil hangat.
  s += cahaya(`${id}-lampu`, x + w * 0.62, y + h * 0.36, 44, 60, '#ffe3a1', 0.55);
  s += kotak(x + w * 0.62 - 7, y + h * 0.36 - 12, 14, 22, '#e9d3a2', tepi(0.8, 0.5));
  // Plint & lantai batu.
  s += kotak(x, lantaiY - 8, w, 8, '#cdb996');
  s += `<defs>${gradLinear(`${id}-lt`, 0, lantaiY, 0, bawah, [[0, '#eadfca'], [1, '#d4c3a3']])}</defs>`;
  s += kotak(x, lantaiY, w, bawah - lantaiY, `url(#${id}-lt)`);
  s += gores(`M${n(x)} ${n(lantaiY + 16)} H${n(kanan)}`, '#b9a57f', 1, 'opacity=".5"');
  // Tanaman pot di tepi kanan, sedikit masuk dari reveal supaya tampak utuh saat daun pintu terbuka.
  const tx = kanan - 12;
  s += kotak(tx - 34, lantaiY - 46, 30, 46, '#b9754f', tepi(0.9, 0.5));
  for (const [dx, dy, r] of [[-26, -70, 18], [-12, -92, 20], [-4, -62, 16], [-20, -112, 14]] as const) {
    s += elips(tx + dx, lantaiY + dy, r, r * 1.3, '#4c8a4a', 'opacity=".95"');
  }
  s += elips(tx - 22, lantaiY - 96, 10, 16, '#7fb86a', 'opacity=".6"');
  // Reveal kusen kanan (tebal dinding) & bawah kepala kusen.
  s += poli([[kanan, y], [kanan, bawah], [kanan - 13, bawah - 5], [kanan - 13, y + 7]], WARNA.kusen, tepi(1, 0.6));
  s += poli([[x, y], [kanan, y], [kanan - 13, y + 7], [x, y + 7]], '#4e2d18');
  return klipKotak(id, b, s) + kotak(x, y, w, h, 'none', `stroke="${GARIS}" stroke-width="1.2" opacity=".5"`);
}

/**
 * Sekilas ruang layanan dari koridor (di balik pintu `pintu-luar`): dinding oker hangat, bilah bambu, cahaya.
 * Isi DIPOTONG ke bukaan: pendar sorot berpusat di tepi atas bukaan dulu meluber ± 380 satuan ke atas & menerangi
 * ambang/dinding di atas pintu yang tertutup pada shot pembuka.
 */
export function sekilasRuang(id: string, b: Kotak): string {
  const { x, y, w, h } = b;
  const bawah = y + h;
  let s = `<defs>${gradLinear(`${id}-dd`, x, y, x + w, bawah, [[0, '#f3cf82'], [1, '#d7a24c']])}</defs>`;
  s += kotak(x, y, w, h, `url(#${id}-dd)`);
  s += cahaya(`${id}-sorot`, x + w * 0.5, y, w * 0.6, h * 0.6, '#fff0c4', 0.6);
  for (let i = 0; i < 6; i += 1) {
    const bx = x + w * 0.06 + i * 11;
    s += kotak(bx, y, 9, h - 60, i % 2 ? '#3f8a4f' : '#2f6d37');
  }
  s += kotak(x, bawah - 60, w, 60, '#c99a62');
  s += kotak(x + w * 0.45, bawah - 118, w * 0.55, 58, '#d9ad72', tepi(1, 0.5));
  return klipKotak(id, b, s) + kotak(x, y, w, h, 'none', `stroke="${GARIS}" stroke-width="1.2" opacity=".5"`);
}

/**
 * Lebar daun pintu SEKAT sebenarnya (90 cm pada skala tokoh 1): hanya ± 224 satuan dari engsel yang tampak di dunia,
 * sisanya (termasuk gagang) di luar tepi kanan. Tinggi 210 cm: puncak & kaki daun di luar dunia.
 */
export const LEBAR_DAUN_SEKAT = 480;

/**
 * Daun pintu SEKAT (ruang layanan, engsel KIRI di tepi kotak): kayu jati MADU (v5: lebih terang & hangat daripada jati
 * tua v4, supaya pintu tidak menjadi bidang gelap besar di HP) dengan serat vertikal, panel timbul
 * (bevel terang kiri-atas, gelap kanan-bawah), tiga daun engsel kuningan, bayang kusen di tepi engsel. Bentuk mengikuti
 * daun selebar LEBAR_DAUN_SEKAT lalu dipotong ke bukaan yang tampak.
 */
export function daunSekat(id: string, b: Kotak): string {
  const { x, y, w, h } = b;
  const W = LEBAR_DAUN_SEKAT;
  const atas = y - 92;
  const tinggi = 1092;
  let s = `<defs>${gradLinear(`${id}-kayu`, x, 0, x + W, 0, [[0, '#c7925f'], [0.5, '#b37c4b'], [1, '#9d683c']])}</defs>`;
  s += kotak(x, y, w, h, `url(#${id}-kayu)`);
  let serat = '';
  for (let i = 1; i < 10; i += 1) {
    const sx = x + (W * i) / 14 + ((i * 37) % 7) - 3;
    serat += `M${n(sx)} ${n(y)} C${n(sx + 3)} ${n(y + h * 0.3)} ${n(sx - 3)} ${n(y + h * 0.65)} ${n(sx + 1)} ${n(y + h)} `;
  }
  s += gores(serat, '#6e4526', 1.1, 'opacity=".22"');
  // Panel timbul (bevel 1 piksel).
  const px = x + W * 0.12;
  const pw = W * 0.42;
  for (const [py, ph] of [[atas + tinggi * 0.08, tinggi * 0.42], [atas + tinggi * 0.56, tinggi * 0.36]] as const) {
    s += kotak(px, py, pw, ph, '#9a643a', 'opacity=".3"');
    s += kotak(px, py, pw, 4, '#e2b682', 'opacity=".8"') + kotak(px, py, 4, ph, '#e2b682', 'opacity=".8"');
    s += kotak(px, py + ph - 4, pw, 4, '#6e4526', 'opacity=".7"') + kotak(px + pw - 4, py, 4, ph, '#6e4526', 'opacity=".7"');
  }
  // Bayang kusen di tepi engsel (cahaya dari kiri atas) & engsel kuningan.
  s += `<defs>${gradLinear(`${id}-bayK`, x, 0, x + 20, 0, [[0, '#3a2412', 0.35], [1, '#3a2412', 0]])}</defs>`;
  s += kotak(x, y, 20, h, `url(#${id}-bayK)`);
  for (const f of [0.12, 0.5, 0.86]) {
    const ey = Math.round((atas + tinggi * f) / 4) * 4;
    if (ey > y && ey < y + h - 28) s += kotak(x + 4, ey, 8, 28, '#c8a860', tepi(0.7, 0.6)) + kotak(x + 4, ey, 4, 28, '#eed79a');
  }
  s += kotak(x, y, w, h, 'none', tepi(1.4, 0.8));
  return klipKotak(`${id}-potong`, b, s);
}

/**
 * Koridor terang di balik bukaan SEKAT (dilihat dari ruang layanan): dinding krem bercahaya siang, lantai batu terang
 * menjauh, lampu dinding kecil, tanaman pot di tepi kanan. Seluruh isi DIPOTONG ke bukaan.
 */
export function koridorSekat(id: string, b: Kotak): string {
  const { x, y, w, h } = b;
  const kanan = x + w;
  const lantaiY = y + h * 0.74;
  let s = `<defs>${gradLinear(`${id}-dd`, x, y, kanan, lantaiY, [[0, '#fffaf0'], [0.55, '#f5ead4'], [1, '#e6d4b2']])}</defs>`;
  s += kotak(x, y, w, h, `url(#${id}-dd)`);
  // Berkas cahaya siang dari kiri (jendela di luar bingkai).
  s += poli([[x, y], [x + w * 0.5, y], [x + w * 0.22, lantaiY], [x, lantaiY]], '#ffffff', 'opacity=".4"');
  // Lampu dinding kecil hangat.
  s += cahaya(`${id}-lampu`, x + w * 0.64, y + h * 0.36, 52, 76, '#ffe3a1', 0.5);
  s += kotak(x + w * 0.64 - 8, y + h * 0.36 - 16, 16, 28, '#e9d3a2', tepi(0.8, 0.5));
  // Plint & lantai batu menjauh.
  s += kotak(x, lantaiY - 12, w, 12, '#cdb996');
  s += `<defs>${gradLinear(`${id}-lt`, 0, lantaiY, 0, y + h, [[0, '#eadfca'], [1, '#cdb893']])}</defs>`;
  s += kotak(x, lantaiY, w, y + h - lantaiY, `url(#${id}-lt)`);
  for (const f of [0.25, 0.55, 0.9]) s += kotak(x, lantaiY + (y + h - lantaiY) * f, w, 4, '#b9a57f', 'opacity=".5"');
  // Tanaman pot di tepi kanan.
  const tx = kanan - 8;
  s += kotak(tx - 56, lantaiY - 76, 52, 76, '#b9754f', tepi(0.9, 0.5)) + kotak(tx - 56, lantaiY - 76, 52, 8, '#d08f63');
  for (const [dx, dy, r] of [[-40, -112, 28], [-18, -148, 30], [-6, -100, 24], [-32, -184, 22]] as const) {
    s += elips(tx + dx, lantaiY + dy, r, r * 1.3, '#4c8a4a', 'opacity=".95"');
  }
  s += elips(tx - 34, lantaiY - 150, 14, 22, '#7fb86a', 'opacity=".7"');
  return klipKotak(id, b, s) + kotak(x, y, w, h, 'none', `stroke="${GARIS}" stroke-width="1.2" opacity=".5"`);
}
