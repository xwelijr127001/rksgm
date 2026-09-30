/**
 * PARKIRAN KANTOR (bab 3): gedung kantor generik (TIDAK diberi nama/label; bukan klaim rupa Wisma BSG), kanopi pintu
 * masuk, trotoar, aspal dengan garis petak, dan mobil Bu Rina (seni mobil.ts apa adanya, garis ditipiskan &
 * dihangatkan supaya selaras gaya v3; plat TANPA tulisan) terparkir di belakang kedua tokoh. Kamera setinggi mata orang
 * berdiri (cakrawala y 360). Tokoh piksel SKALA 1 (telapak y 1000, di luar dunia): Miss Raksa kiri, Bu Rina kanan;
 * sudut belakang kanan mobil yang rusak jatuh DI ANTARA keduanya (keduanya menatap kerusakan).
 */
import { SISIPAN, mobilRinaUtuh } from '../mobil';
import { GARIS, acak, cahaya, elips, gores, gradLinear, jalur, kotak, lapisan, modePiksel, n, poli, tepi, type Tt } from './alat';
import type { RuangAdegan } from './tipe';

const LOK = 'parkiran';
const CAKRAWALA = 360;
const yLantai = (s: number): number => CAKRAWALA + 640 * s;
const VP: Tt = [800, CAKRAWALA];
/** Mobil pada s 0,36: 1 satuan lokal mobil ≈ 1 cm → faktor 5,2·s (skala cm tokoh piksel). */
const S_MOBIL = 0.36;
const F_MOBIL = 5.2 * S_MOBIL;
const DASAR_MOBIL = yLantai(S_MOBIL);
/** Tempat berdiri tokoh (telapak, skala 1). */
const TOKOH_X = { mentor: 560, nasabah: 1040 } as const;
/**
 * Mobil diletakkan supaya pusat kerusakan (sisipan penyok mobil.ts, lokal 439,141) jatuh di tengah kedua tokoh
 * (x 800): moncong mobil sedikit keluar tepi kiri dunia.
 */
const MOBIL_X = Math.round((TOKOH_X.mentor + TOKOH_X.nasabah) / 2 - SISIPAN.penyok.x * F_MOBIL);
const MOBIL_Y = DASAR_MOBIL - 198 * F_MOBIL;
const GEDUNG_DASAR = Math.round(yLantai(0.14));

/** Titik pada garis menuju titik hilang: dari (x, y) ke kedalaman y2. */
const keVp = (x: number, y: number, y2: number): number => VP[0] + ((x - VP[0]) * (y2 - VP[1])) / (y - VP[1]);

function langit(id: string): string {
  let s = `<defs>${gradLinear(`${id}-lgt`, 0, 0, 0, 420, [[0, '#8ec2e4'], [0.6, '#c6e0ec'], [1, '#eef0e2']])}</defs>`;
  s += kotak(0, 0, 1600, 440, `url(#${id}-lgt)`);
  const awan = (x: number, y: number, k: number): string =>
    [[0, 0, 70], [60, -18, 56], [118, 2, 62], [52, 16, 60]].map(([dx, dy, r]) => elips(x + dx * k, y + dy * k, r * k, r * 0.55 * k, '#ffffff', 'opacity=".85"')).join('')
    + elips(x + 60 * k, y + 22 * k, 120 * k, 22 * k, '#d8e6ef', 'opacity=".6"');
  s += awan(1180, 70, 1) + awan(1440, 150, 0.7) + awan(80, 40, 0.6);
  return s;
}

function pohon(x: number, dasar: number, k: number, benih: number): string {
  const r = acak(benih);
  let s = jalur(`M${n(x - 5 * k)} ${n(dasar)} L${n(x - 3 * k)} ${n(dasar - 90 * k)} L${n(x + 3 * k)} ${n(dasar - 90 * k)} L${n(x + 5 * k)} ${n(dasar)} Z`, '#6b4a30', tepi(1, 0.6));
  const warna = ['#3f7a3e', '#4f8c45', '#5f9c4c', '#356a36'];
  for (let i = 0; i < 9; i += 1) {
    const a = r() * Math.PI * 2;
    const d = r() * 40 * k;
    s += elips(x + Math.cos(a) * d, dasar - 120 * k + Math.sin(a) * d * 0.7, (30 + r() * 18) * k, (26 + r() * 14) * k, warna[i % warna.length]);
  }
  s += elips(x - 18 * k, dasar - 140 * k, 22 * k, 16 * k, '#9cc97a', 'opacity=".45"');
  return s;
}

function gedung(id: string): string {
  const dasar = GEDUNG_DASAR; // ± 387
  const kanan = 1130;
  const lt1 = dasar - 262; // atap lantai dasar
  let s = '';
  // Pepohonan jauh di kanan gedung.
  for (let i = 0; i < 9; i += 1) s += elips(1150 + i * 58, dasar - 40 - (i % 3) * 12, 52, 44, i % 2 ? '#6f9a5e' : '#5d8b52', 'opacity=".9"');
  s += kotak(kanan, dasar - 34, 470, 34, '#d9cfb9') + kotak(kanan, dasar - 34, 470, 4, '#efe6d2');
  // Badan gedung (krem) & pita jendela lantai atas.
  s += `<defs>${gradLinear(`${id}-fas`, 0, 0, kanan, 0, [[0, '#f3e8cf'], [1, '#dccbaa']])}</defs>`;
  s += kotak(-10, 0, kanan + 10, dasar, `url(#${id}-fas)`);
  s += kotak(-10, lt1 - 22, kanan + 10, 22, '#e9dcc0') + kotak(-10, lt1 - 2, kanan + 10, 2, '#b9a47e');
  s += `<defs>${gradLinear(`${id}-kaca`, 0, 0, 0, lt1, [[0, '#7fa9b8'], [1, '#b8d3d6']])}</defs>`;
  for (let x = 20; x < kanan - 40; x += 140) {
    s += kotak(x, 10, 110, lt1 - 52, `url(#${id}-kaca)`, tepi(1, 0.45));
    s += poli([[x + 12, 10], [x + 40, 10], [x + 14, lt1 - 42], [x, lt1 - 42]], '#ffffff', 'opacity=".22"');
  }
  // Lantai dasar: dinding kaca bermulion, cahaya hangat di dalam.
  s += `<defs>${gradLinear(`${id}-kd`, 0, lt1, 0, dasar, [[0, '#6f98a3'], [0.6, '#9dbfc3'], [1, '#c9d9d2']])}</defs>`;
  s += kotak(30, lt1 + 10, kanan - 60, dasar - lt1 - 16, `url(#${id}-kd)`);
  for (let i = 0; i < 5; i += 1) s += cahaya(`${id}-dalam${i}`, 150 + i * 220, dasar - 110, 70, 50, '#ffe2a6', 0.35);
  let mulion = '';
  for (let x = 30; x <= kanan - 30; x += 86) mulion += `M${x} ${lt1 + 10} V${dasar - 6} `;
  s += gores(mulion, '#51656a', 3) + gores(`M30 ${lt1 + 60} H${kanan - 30}`, '#51656a', 2.4);
  s += poli([[80, lt1 + 12], [150, lt1 + 12], [70, dasar - 8], [30, dasar - 8]], '#ffffff', 'opacity=".16"');
  // Kanopi pintu masuk (fascia hijau Raksa, tanpa tulisan) + tiang + pintu kaca.
  const kx1 = 300;
  const kx2 = 700;
  s += kotak(430, dasar - 190, 170, 184, '#3d5a60', tepi(1, 0.5));
  s += gores(`M515 ${dasar - 188} V${dasar - 6}`, '#b8c9c6', 2);
  s += cahaya(`${id}-pintu`, 515, dasar - 100, 90, 90, '#fff0c8', 0.4);
  s += kotak(kx1, dasar - 226, kx2 - kx1, 26, '#e7ddc6', tepi(1.2, 0.7)) + kotak(kx1, dasar - 204, kx2 - kx1, 7, '#2f7a4b');
  s += kotak(kx1 + 16, dasar - 200, 10, 196, '#cfc3a8', tepi(1, 0.6)) + kotak(kx2 - 26, dasar - 200, 10, 196, '#cfc3a8', tepi(1, 0.6));
  s += `<defs>${gradLinear(`${id}-bk`, 0, dasar - 200, 0, dasar - 150, [[0, '#2a1a0c', 0.25], [1, '#2a1a0c', 0]])}</defs>`;
  s += kotak(kx1, dasar - 200, kx2 - kx1, 50, `url(#${id}-bk)`);
  // Pot tanaman di kaki gedung.
  for (const px of [120, 790, 1000]) {
    s += kotak(px - 34, dasar - 34, 68, 34, '#b7a88c', tepi(1, 0.55));
    s += elips(px, dasar - 44, 40, 22, '#4f8c45') + elips(px - 14, dasar - 52, 22, 14, '#6ea85a');
  }
  // Tepi gedung kanan.
  s += kotak(kanan - 14, 0, 14, dasar, '#cdbb97', tepi(1, 0.55));
  return s;
}

function aspal(id: string): string {
  const atas = GEDUNG_DASAR;
  let s = '';
  // Trotoar & kerb.
  s += kotak(0, atas, 1600, 22, '#dcd2bf') + kotak(0, atas, 1600, 3, '#efe7d7');
  s += kotak(0, atas + 22, 1600, 8, '#b6aa93');
  if (modePiksel()) {
    // Piksel: aspal 2 pita lebar (jauh lebih terang) tanpa gradien yang pecah menjadi garis tegas.
    s += kotak(0, atas + 30, 1600, 900 - atas - 30, '#8f8a82') + kotak(0, atas + 30, 1600, 120, '#9c978e');
  } else {
    s += `<defs>${gradLinear(`${id}-asp`, 0, atas + 30, 0, 900, [[0, '#a8a39a'], [1, '#77726b']])}</defs>`;
    s += kotak(0, atas + 30, 1600, 900 - atas - 30, `url(#${id}-asp)`);
  }
  // Tekstur halus & tambalan.
  const r = acak(31);
  for (let i = 0; i < 18; i += 1) {
    const y = atas + 40 + r() * (900 - atas - 60);
    const k = (y - CAKRAWALA) / (900 - CAKRAWALA);
    s += elips(r() * 1600, y, (40 + r() * 90) * k, (6 + r() * 10) * k, r() < 0.5 ? '#6f6a63' : '#b3aea4', 'opacity=".25"');
  }
  // Garis petak parkir: sejajar sisi mobil (menjauh ke kiri atas) + garis ujung.
  const garisPetak = (x0: number, y0: number, x1: number, y1: number): string => {
    const tebal = 3 + ((y0 - CAKRAWALA) / 600) * 6;
    return gores(`M${n(x0)} ${n(y0)} L${n(x1)} ${n(y1)}`, '#f3f0e6', tebal, 'opacity=".85"');
  };
  // Petak mobil: garis ujung di belakang buritan (kanan) & garis samping menuju titik hilang; petak kosong di kanan.
  const ujung = MOBIL_X + 470 * F_MOBIL;
  for (const xa of [ujung, ujung + 300 * F_MOBIL]) s += garisPetak(keVp(xa, 900, DASAR_MOBIL + 60), DASAR_MOBIL + 60, keVp(xa, 900, atas + 44), atas + 44);
  s += garisPetak(keVp(ujung, 900, DASAR_MOBIL + 60), DASAR_MOBIL + 60, keVp(ujung + 300 * F_MOBIL, 900, DASAR_MOBIL + 60), DASAR_MOBIL + 60);
  // Bayang lembut di kaki gedung.
  s += `<defs>${gradLinear(`${id}-ao`, 0, atas + 30, 0, atas + 60, [[0, '#2a2622', 0.3], [1, '#2a2622', 0]])}</defs>`;
  s += kotak(0, atas + 30, 1600, 30, `url(#${id}-ao)`);
  return s;
}

/** Mobil Bu Rina dari mobil.ts: garis ditipiskan (3 → 1,2 satuan lokal) & tinta hijau diganti cokelat hangat. */
function mobil(id: string): string {
  const asli = mobilRinaUtuh({ teksPlat: false });
  const hangat = asli
    // Garis benturan jingga (penanda gaya aktivitas lama) tidak dipakai di panggung v3: kerusakan cukup terlihat.
    .replace(/<path[^>]*stroke="#e8833a"[^>]*\/>/g, '')
    .replace(/#17362a/g, GARIS)
    .replace(/stroke-width="([\d.]+)"/g, (_m, w: string) => `stroke-width="${n(Number(w) * 0.42)}"`);
  let s = '';
  // Bayang kontak di aspal (cahaya kiri atas → condong ke kanan).
  s += elips(MOBIL_X + 250 * F_MOBIL, DASAR_MOBIL + 4, 250 * F_MOBIL, 16 * F_MOBIL, '#2a2622', 'opacity=".32"');
  s += `<g transform="translate(${n(MOBIL_X)} ${n(MOBIL_Y)}) scale(${n(F_MOBIL)})">${hangat}</g>`;
  // Sorot langit di atap & kilau hangat samping (selaras cahaya kiri atas).
  s += cahaya(`${id}-kilau`, MOBIL_X + 150 * F_MOBIL, MOBIL_Y + 40 * F_MOBIL, 120 * F_MOBIL, 30 * F_MOBIL, '#ffffff', 0.25);
  return s;
}

function latarParkiran(): string {
  const id = `rg-${LOK}-latar`;
  let s = langit(id) + gedung(id) + aspal(id);
  s += pohon(1290, GEDUNG_DASAR - 4, 1.3, 4);
  s += mobil(id);
  // Tiang lampu (bayang kontak di kakinya) & bolard.
  s += elips(1548, yLantai(0.34) + 1, 20, 4.5, '#2a2622', 'opacity=".3"');
  s += gores(`M1540 ${yLantai(0.34)} V120`, '#5d6b67', 7) + jalur('M1540 124 q0 -18 -26 -18 h-34 v10 h34 q14 0 14 8 Z', '#5d6b67', tepi(1, 0.6));
  s += elips(1478, 116, 16, 5, '#fff3cf', 'opacity=".9"');
  for (const bx of [60, 250]) {
    const by = yLantai(0.45);
    s += kotak(bx - 8, by - 60, 16, 60, '#e2b43c', tepi(1.2, 0.8)) + kotak(bx - 8, by - 48, 16, 8, '#3a3a36');
    s += elips(bx + 10, by, 18, 4, '#2a2622', 'opacity=".25"');
  }
  return s;
}

export function parkiranKantor(): RuangAdegan {
  const kaki = yLantai(1);
  return {
    lokasi: LOK,
    latar: lapisan(latarParkiran(), 0, 0, 1600, 900),
    tempat: {
      mentor: { x: TOKOH_X.mentor, y: kaki },
      mentorBerdiri: { x: TOKOH_X.mentor, y: kaki },
      skalaMentor: 1,
      nasabahDuduk: { x: TOKOH_X.nasabah, y: kaki },
      skalaNasabah: 1,
      nasabahBerdiri: { x: TOKOH_X.nasabah, y: kaki },
      jalurMasuk: [],
    },
  };
}

/** Kotak mobil di parkiran (dunia), untuk panggung yang tidak ingin menutupinya. */
export const MOBIL_PARKIRAN = { x: MOBIL_X, y: MOBIL_Y, w: 460 * F_MOBIL, h: 230 * F_MOBIL } as const;

/** Kotak kerusakan (lampu retak + bemper penyok, sisipan mobil.ts) di dunia: harus tampak di bingkai HP. */
export const PENYOK_PARKIRAN = {
  x: MOBIL_X + (SISIPAN.penyok.x - SISIPAN.penyok.w / 2) * F_MOBIL,
  y: MOBIL_Y + (SISIPAN.penyok.y - SISIPAN.penyok.h / 2) * F_MOBIL,
  w: SISIPAN.penyok.w * F_MOBIL,
  h: SISIPAN.penyok.h * F_MOBIL,
} as const;
