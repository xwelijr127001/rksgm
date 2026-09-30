/**
 * PROP adegan (SVG kecil mandiri untuk panggung): kartu polis, kunci mobil, telepon meja, gagang telepon, map.
 * Satuan dunia pada skala meja (± 1,15). `jangkar` = titik sentuh di permukaan meja (atau titik genggam untuk
 * gagang); panggung menaruh jangkar di titik `TempatAdegan` (kartuSimpan/kartuMeja/kunciMeja/telepon).
 * Tanpa teks (kartu hanya memakai pita warna & garis), garis hangat tipis, cahaya dari kiri atas.
 */
import { GARIS, elips, gores, gradLinear, jalur, kotak, n, poli, tepi, type Tt } from './alat';
import type { Titik } from '../tokoh/tipe';
import { PIKSEL } from './geometri';

export interface PropRuang {
  /** Isi SVG untuk viewBox `0 0 w h`. */
  svg: string;
  w: number;
  h: number;
  jangkar: Titik;
}

/**
 * Skala prop terhadap satuan gambar dasar di bawah (1,2): tangan tokoh piksel chibi lebih besar dari tangan SVG lama,
 * jadi kartu/telepon/kunci diperbesar supaya tetap terbaca & sebanding (kartu 120 × 60 = 30 × 15 piksel seni).
 */
export const SKALA_PROP = 1.2;

/**
 * Terapkan SKALA_PROP lalu geser gambar supaya jangkar & ukuran kelipatan 4 (grid piksel seni): jangkar dibulatkan ke
 * atas, gambar digeser sebesar selisihnya (bukan jangkar yang meleset dari gambar).
 */
function skalakan(p: PropRuang): PropRuang & { geser: Tt } {
  const k = SKALA_PROP;
  const jx = Math.ceil((p.jangkar.x * k) / PIKSEL) * PIKSEL;
  const jy = Math.ceil((p.jangkar.y * k) / PIKSEL) * PIKSEL;
  const dx = jx - p.jangkar.x * k;
  const dy = jy - p.jangkar.y * k;
  const w = Math.ceil((p.w * k + dx) / PIKSEL) * PIKSEL;
  const h = Math.ceil((p.h * k + dy) / PIKSEL) * PIKSEL;
  return { svg: `<g transform="translate(${n(dx)} ${n(dy)}) scale(${k})">${p.svg}</g>`, w, h, jangkar: { x: jx, y: jy }, geser: [dx, dy] };
}
const tanpaGeser = ({ svg, w, h, jangkar }: PropRuang): PropRuang => ({ svg, w, h, jangkar });

const bayang = (cx: number, cy: number, rx: number, ry: number, a = 0.22): string => elips(cx, cy, rx, ry, '#2a1a0c', `opacity="${a}"`);

/**
 * Map kulit cokelat tua TERTUTUP tergeletak di meja (hiasan di bawah tangan Miss Raksa). Sengaja TIDAK mirip kartu polis:
 * lebih besar (± 23 cm), gelap, tanpa kertas mengintip, tanpa pita hijau/label emas; hanya jahitan & tali karet.
 */
export function propMap(id = 'rg-map'): PropRuang {
  return tanpaGeser(skalakan(mapDasar(id)));
}
function mapDasar(id: string): PropRuang {
  const w = 154;
  const h = 52;
  const A: [number, number] = [12, 13];
  const B: [number, number] = [138, 7];
  const C: [number, number] = [148, 35];
  const D: [number, number] = [4, 43];
  let s = bayang(78, 45, 74, 7, 0.26);
  // Tebal map (sisi dekat) lalu sampul kulit.
  s += poli([D, C, [C[0], C[1] + 4], [D[0], D[1] + 4]], '#2f170b', tepi(0.9, 0.7));
  s += `<defs>${gradLinear(`${id}-kulit`, 4, 7, 148, 43, [[0, '#8a5230'], [0.55, '#6b3a1f'], [1, '#4b2612']])}</defs>`;
  s += poli([A, B, C, D], `url(#${id}-kulit)`, tepi(1.1, 0.85));
  // Jahitan tepi (putus-putus) & sorot tepi jauh (cahaya kiri atas).
  s += gores('M15 17.5 L134 11.8 L142 32.4 L10 39.4 Z', '#d2a578', 0.9, 'stroke-dasharray="3 2.4" opacity=".55"');
  s += gores(`M${A[0] + 2} ${A[1] + 1} L${B[0] - 2} ${B[1] + 1}`, '#c08658', 1.2, 'opacity=".7"');
  // Tali karet gelap melintang dekat tepi kanan.
  s += poli([[116, 8.1], [123, 7.8], [131, 36.6], [124, 37]], '#24140b', 'opacity=".9"');
  return { svg: s, w, h, jangkar: { x: 74, y: 28 } };
}

/** Sudut kertas kartu polis dalam satuan gambar DASAR (sebelum SKALA_PROP). */
const SUDUT_KARTU_DASAR: readonly [Tt, Tt, Tt, Tt] = [[10, 12], [88, 5], [96, 36], [5, 43]];

/**
 * Kartu polis (bukan KTP: kartu dokumen ± 15 × 10 cm) tergeletak miring di meja: pita kepala hijau, lambang
 * bundar emas, baris data sebagai garis (tanpa teks).
 */
export function propKartuPolis(id = 'rg-kartu'): PropRuang {
  return tanpaGeser(skalakan(kartuDasar(id)));
}
function kartuDasar(id: string): PropRuang {
  const w = 100;
  const h = 50;
  const [A, B, C, D] = SUDUT_KARTU_DASAR;
  let s = bayang(52, 42, 48, 7, 0.25);
  s += `<defs>${gradLinear(`${id}-krt`, 5, 5, 96, 43, [[0, '#fffdf6'], [1, '#efe8d6']])}</defs>`;
  s += poli([A, B, C, D], `url(#${id}-krt)`, tepi(1, 0.8));
  // Pita kepala (sepertiga atas).
  const t = 0.33;
  const kiri: [number, number] = [A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t];
  const kanan: [number, number] = [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t];
  s += poli([A, B, kanan, kiri], '#2f7a4b');
  s += gores(`M${n(A[0] + 2)} ${n(A[1] + 1)} L${n(B[0] - 2)} ${n(B[1] + 1)}`, '#8fd0a4', 1, 'opacity=".8"');
  s += elips(24, 14, 5.5, 3.6, '#e9c46a', tepi(0.6, 0.6));
  // Baris data.
  s += gores('M16 25 L60 22 M16 30 L74 26.5 M15 35 L52 32.5', '#8f8878', 1.8, 'opacity=".8"');
  s += poli([[66, 29], [84, 27.5], [86, 33], [67, 34.5]], '#d8e7dc', tepi(0.6, 0.4));
  s += poli([A, B, C, D], 'none', tepi(1, 0.8));
  return { svg: s, w, h, jangkar: { x: 50, y: 26 } };
}

/** Kunci mobil Bu Rina tergeletak: remote gelap, cincin, bilah kunci, gantungan bundar kuning. */
export function propKunci(): PropRuang {
  return tanpaGeser(skalakan(kunciDasar()));
}
function kunciDasar(): PropRuang {
  const w = 56;
  const h = 30;
  let s = bayang(28, 24, 26, 5, 0.25);
  s += jalur('M6 12 Q6 6 13 6 L24 7 Q29 8 28 13 L27 18 Q26 23 20 22 L10 21 Q5 20 6 15 Z', '#2c2f33', tepi(1, 0.85));
  s += elips(16, 12, 3.4, 2.4, '#5d636b');
  s += gores('M9 9 L20 9.5', '#6e747c', 1, 'opacity=".8"');
  s += elips(34, 15, 6.5, 4.2, 'none', `stroke="#b9bec4" stroke-width="1.8"`);
  s += jalur('M38 14 L52 12.5 L53 15 L49 15.4 L48 17 L39 17.6 Z', '#aeb4ba', tepi(0.8, 0.7));
  s += elips(31, 22, 5.2, 3.6, '#f2c230', tepi(0.8, 0.7));
  s += elips(29.8, 21, 1.6, 1, '#fff2b8');
  return { svg: s, w, h, jangkar: { x: 28, y: 18 } };
}

/** Telepon meja: badan abu gelap, papan tombol miring; `gagang` = gagang terletak di dudukan. */
export function propTelepon(opsi: { gagang?: boolean; id?: string } = {}): PropRuang {
  return tanpaGeser(skalakan(teleponDasar(opsi)));
}
function teleponDasar(opsi: { gagang?: boolean; id?: string }): PropRuang {
  const gagang = opsi.gagang ?? true;
  const id = opsi.id ?? 'rg-telp';
  const w = 110;
  const h = 70;
  let s = bayang(56, 60, 52, 8, 0.26);
  s += `<defs>${gradLinear(`${id}-bdn`, 8, 20, 100, 64, [[0, '#55595f'], [1, '#2b2e32']])}</defs>`;
  // Badan (trapesium miring) + muka tombol.
  s += jalur('M12 30 L90 24 Q98 24 100 32 L104 54 Q104 62 96 62 L14 64 Q6 64 6 56 L8 36 Q8 30 12 30 Z', `url(#${id}-bdn)`, tepi(1.1, 0.85));
  s += poli([[46, 34], [92, 30.5], [96, 50], [48, 53]], '#3b3f44', tepi(0.7, 0.6));
  for (let r = 0; r < 3; r += 1) {
    for (let k = 0; k < 4; k += 1) {
      const x = 52 + k * 10 + r * 0.8;
      const y = 36.5 + r * 5.6 - k * 0.8;
      s += kotak(x, y, 6.5, 3.6, '#c9ced4', 'rx="1"');
    }
  }
  s += poli([[50, 27.5], [70, 26], [70.5, 30], [50.5, 31.4]], '#1c2a2c');
  s += gores('M52 28.5 L64 27.6', '#62c3b3', 1, 'opacity=".8"');
  // Dudukan gagang (kiri).
  s += poli([[10, 32], [42, 29.5], [44, 38], [10, 41]], '#23262a', tepi(0.8, 0.6));
  if (gagang) {
    s += jalur('M6 30 Q4 22 12 20 L40 17 Q48 16.5 48 24 Q48 30 42 30.5 L14 33 Q7 34 6 30 Z', '#34383d', tepi(1.1, 0.9));
    s += gores('M12 22.5 L40 20', '#7a8088', 1.3, 'opacity=".8"');
    s += gores('M8 33 C0 40 10 44 4 50 C0 55 8 58 10 62', '#26292d', 1.8);
  }
  return { svg: s, w, h, jangkar: { x: 56, y: 52 } };
}

/** Gagang telepon saja (dipegang Miss Raksa di telinga): tegak, kabel spiral pendek menjuntai. */
export function propGagang(): PropRuang {
  return tanpaGeser(skalakan(gagangDasar()));
}
function gagangDasar(): PropRuang {
  const w = 40;
  const h = 128;
  let s = jalur('M14 6 Q24 2 29 10 L31 24 Q32 30 26 32 L24 84 Q30 88 30 96 L29 106 Q24 114 14 110 Q8 106 9 98 L11 32 Q6 28 7 20 L8 12 Q9 8 14 6 Z', '#34383d', tepi(1.2, 0.9));
  s += gores('M12 14 L13 100', '#7a8088', 1.4, 'opacity=".7"');
  s += elips(20, 16, 5, 3, '#23262a') + elips(20, 100, 5, 3, '#23262a');
  s += gores('M22 110 c-8 2 -2 5 -8 7 c-6 2 0 5 -6 7', GARIS, 1.6, 'opacity=".8"');
  return { svg: s, w, h, jangkar: { x: 20, y: 58 } };
}

/**
 * Sudut kertas kartu polis dalam koordinat prop AKHIR (sesudah SKALA_PROP & geser grid): kiri-jauh, kanan-jauh,
 * kanan-dekat, kiri-dekat (tanpa bayang).
 */
export const SUDUT_KARTU: readonly [Tt, Tt, Tt, Tt] = (() => {
  const { geser } = skalakan(kartuDasar('rg-kartu'));
  return SUDUT_KARTU_DASAR.map(([x, y]) => [x * SKALA_PROP + geser[0], y * SKALA_PROP + geser[1]] as Tt) as unknown as readonly [Tt, Tt, Tt, Tt];
})();

/** Cangkir teh di atas tatakan (epilog telepon, "beberapa hari kemudian"); jangkar = pusat tatakan di meja. */
export function propCangkir(): PropRuang {
  return tanpaGeser(skalakan(cangkirDasar()));
}
function cangkirDasar(): PropRuang {
  const x = 28;
  const y = 26;
  let s = elips(x, y + 2, 22, 5, '#2a1a0c', 'opacity=".2"');
  s += elips(x, y, 20, 5, '#f7f2e6', tepi(0.8, 0.5));
  s += jalur(`M${x - 11} ${y - 18} L${x + 11} ${y - 18} Q${x + 10} ${y - 2} ${x} ${y - 1} Q${x - 10} ${y - 2} ${x - 11} ${y - 18} Z`, '#fbf7ee', tepi(0.9, 0.6));
  s += elips(x, y - 18, 11, 2.6, '#9a5b2a', tepi(0.6, 0.5));
  s += gores(`M${x + 10} ${y - 14} q8 1 5 7 q-2 3 -6 2`, GARIS, 1.3, 'opacity=".6"');
  s += gores(`M${x - 7} ${y - 14} l0 9`, '#ffffff', 1.6, 'opacity=".7"');
  return { svg: s, w: 58, h: 34, jangkar: { x, y } };
}

/**
 * Kartu polis DI TANGAN (tegak, sedikit miring; dipegang di tepi bawah): muka krem, pita kepala hijau, lambang bundar
 * emas, baris data sebagai garis (tanpa teks). Jangkar = titik genggam di tepi bawah (ditaruh di titik tangan tokoh).
 */
export function propKartuTangan(id = 'rg-kartu-tangan'): PropRuang {
  return tanpaGeser(skalakan(kartuTanganDasar(id)));
}
function kartuTanganDasar(id: string): PropRuang {
  const A: Tt = [6, 6];
  const B: Tt = [62, 3];
  const C: Tt = [65, 42];
  const D: Tt = [9, 45];
  const t = 0.3;
  const kiri: Tt = [A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t];
  const kanan: Tt = [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t];
  let s = `<defs>${gradLinear(`${id}-krt`, 6, 3, 65, 45, [[0, '#fffdf6'], [1, '#efe8d6']])}</defs>`;
  s += poli([A, B, C, D], `url(#${id}-krt)`, tepi(1, 0.8));
  s += poli([A, B, kanan, kiri], '#2f7a4b');
  s += elips(18, 10, 4, 3, '#e9c46a', tepi(0.6, 0.6));
  s += gores('M14 24 L50 22 M15 30 L56 28 M16 36 L42 35', '#8f8878', 2, 'opacity=".8"');
  s += poli([A, B, C, D], 'none', tepi(1, 0.8));
  return { svg: s, w: 70, h: 50, jangkar: { x: 36, y: 44 } };
}
