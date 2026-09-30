/**
 * KURSI PENGUNJUNG berlengan model "tub" (foto 09: kursi mauve bersandaran cangkang melengkung di Silver Club):
 * cangkang empuk yang melengkung dari lengan jauh → sandaran → lengan dekat, tepi atas bergulung ber-piping, ujung
 * lengan membulat, bantal dudukan tebal bertepi depan membulat yang menjorok di depan lengan, badan kursi berlapis kain,
 * kaki walnut meruncing bersepatu kuningan. Kain mauve/dusty rose kusam (hangat, satu keluarga dengan oker & madu
 * ruangan), cahaya dari kiri atas. Menghadap 3/4 KIRI (ke Miss Raksa) dengan perspektif 3/4 yang sama dengan meja
 * (alat.ts `proyektor`), skala 1,05.
 *
 * Seluruh kursi ada di `kursi.belakang` (di balik badan Bu Rina; posisi & z lapisan TETAP): saat ia duduk, yang tampak =
 * sandaran & sisi cangkang di kanan punggungnya; saat kosong (awal, telepon, sesudah pergi) kursi tampil utuh.
 * Urutan lukis (jauh → dekat): bayang lantai → kaki jauh → siluet cangkang → muka DALAM (ujung & lengan jauh +
 * sandaran) → badan & bantal dudukan → muka LUAR sisi dekat (memutar ke ujung lengan dekat) → gulungan tepi atas →
 * jahitan/sorot → kaki dekat.
 * Catatan kamera: kaki & bayang kontak lantai ada di y > 790 dunia (lantai s 1,05 = y 1031, di luar dunia); bingkai
 * desktop/HP berhenti di y ± 790 (tablet ± 821), jadi yang tampak di panggung = cangkang, bantal & tepi badan kursi.
 */
import { cahaya, gores, gradLinear, halus, jalur, n, proyektor, tepi, type Tt } from './alat';
import { KURSI } from './geometri';

/** Arah hadap kursi (X kanan, Z menjauh): kiri & sedikit ke kamera. R = sisi kanan pendudukan (menjauhi kamera). */
const F = { x: -0.95, z: -0.31 };
const R = { x: F.z, z: -F.x };

/**
 * Bentuk kursi (cm). a = maju (arah hadap), b = ke kanan pendudukan (+ = sisi JAUH dari kamera), y = atas dari
 * permukaan dudukan (y 0 = titik duduk = KURSI.y di pusat).
 */
export const BENTUK_KURSI = {
  /** Denah cangkang: busur elips di belakang (pusat a0; jari-jari dalam raDalam ke belakang, rbDalam ke samping)
   *  + lengan lurus sampai `lenganDepan` (ujung setengah lingkaran; ± 17 satuan di kanan kotak kunci di meja). Tebal 7. */
  a0: -4,
  raDalam: 16,
  rbDalam: 23,
  tebal: 7,
  lenganDepan: 3,
  /** Tinggi tepi atas cangkang di atas dudukan: lengan 17 (turun 2 ke ujung), puncak sandaran 32, condong 3. */
  tinggiLengan: 17,
  turunLengan: 2,
  tinggiSandar: 32,
  rebah: 3,
  /** Bantal dudukan: tepi depan a 19 (sudut depan membulat r 6), tebal 10; badan kursi sampai y −17; lantai −44. */
  dudukDepan: 19,
  sudutDepan: 6,
  bantal: 10,
  dasar: -17,
  lantai: -44,
} as const;
const B = BENTUK_KURSI;

const P = proyektor(KURSI.x, KURSI.y, KURSI.s, { datar: 0.3, geserZ: -0.08 });

/** Titik kursi (cm, lihat BENTUK_KURSI) → dunia. Dipakai juga oleh uji (jangkauan kursi vs prop & tokoh). */
export function titikKursi(a: number, b: number, y: number): Tt {
  return P(a * F.x + b * R.x, y, a * F.z + b * R.z);
}

interface Sampel {
  a: number;
  b: number;
  /** Sudut busur: 0 = sisi jauh, π/2 = tengah belakang, π = sisi dekat (lengan & ujungnya: 0 / π). */
  th: number;
  /** Turunnya tepi atas (cm) menuju ujung lengan. */
  turun: number;
}

const N_BUSUR = 14;
/** Sudut (dari F ke R) tempat muka tegak berhenti tampak: normal n = cos ψ·F + sin ψ·R tampak bila tan ψ < 0,417. */
const SILUET = Math.atan(0.417);

/** Kontur denah cangkang, dari ujung lengan JAUH → belakang → ujung lengan DEKAT. t 0 = sisi dalam, 1 = sisi luar. */
function kontur(t: number): Sampel[] {
  const ra = B.raDalam + t * B.tebal;
  const rb = B.rbDalam + t * B.tebal;
  const turun = (a: number) => B.turunLengan * ((a - B.a0) / (B.lenganDepan - B.a0)) ** 2;
  const s: Sampel[] = [];
  for (let i = 0; i < 3; i += 1) {
    const a = B.lenganDepan + ((B.a0 - B.lenganDepan) * i) / 3;
    s.push({ a, b: rb, th: 0, turun: turun(a) });
  }
  for (let i = 0; i <= N_BUSUR; i += 1) {
    const th = (Math.PI * i) / N_BUSUR;
    s.push({ a: B.a0 - ra * Math.sin(th), b: rb * Math.cos(th), th, turun: 0 });
  }
  for (let i = 1; i <= 3; i += 1) {
    const a = B.a0 + ((B.lenganDepan - B.a0) * i) / 3;
    s.push({ a, b: -rb, th: Math.PI, turun: turun(a) });
  }
  return s;
}

/**
 * Ujung lengan (setengah lingkaran di denah). sisi +1 = lengan jauh (φ 0 = titik dalam → π = titik luar), −1 = lengan
 * dekat (φ 0 = titik luar → π = titik dalam). Normal luar di φ = (sin φ, −cos φ): tampak bila φ < 90° + (90° − SILUET).
 */
function ujung(sisi: 1 | -1, dari: number, sampai: number, langkah = 6): Sampel[] {
  const r = B.tebal / 2;
  const c = B.rbDalam + r;
  const s: Sampel[] = [];
  for (let i = 0; i <= langkah; i += 1) {
    const f = dari + ((sampai - dari) * i) / langkah;
    s.push({ a: B.lenganDepan + r * Math.sin(f), b: sisi * c - r * Math.cos(f), th: sisi > 0 ? 0 : Math.PI, turun: B.turunLengan + 0.8 * Math.sin(f) });
  }
  return s;
}
const PHI_TAMPAK = Math.PI - (Math.PI / 2 - SILUET);

/** Tinggi tepi atas cangkang: naik halus dari lengan ke puncak sandaran. */
const tinggiAtas = (th: number): number => B.tinggiLengan + (B.tinggiSandar - B.tinggiLengan) * Math.sin(th) ** 1.6;
/** Titik tepi atas (sandaran condong ke belakang). */
const puncak = (s: Sampel, dy = 0): Tt => titikKursi(s.a - B.rebah * Math.sin(s.th) ** 2, s.b, tinggiAtas(s.th) - s.turun + dy);
const pada = (s: Sampel, y: number): Tt => titikKursi(s.a, s.b, y);

/** Muka LUAR sampel i menghadap kamera? (normal luar denah → dunia; arah pandang proyektor ≈ (0,08; −0,3; 1)). */
function luarTampak(k: Sampel[], i: number): boolean {
  const p = k[Math.max(0, i - 1)];
  const q = k[Math.min(k.length - 1, i + 1)];
  const na = q.b - p.b;
  const nb = -(q.a - p.a);
  return 0.08 * (na * F.x + nb * R.x) + (na * F.z + nb * R.z) < 0;
}

/** Jalur tertutup: kurva halus `atas`, garis ke kurva halus `bawah` (keduanya searah jalur), tutup. */
const pita = (atas: readonly Tt[], bawah: readonly Tt[]): string =>
  `M${n(atas[0][0])} ${n(atas[0][1])} ${halus(atas)}L${n(bawah[0][0])} ${n(bawah[0][1])} ${halus(bawah)}Z`;
/** Seperti `pita`, tetapi tepi bawah garis lurus (bawah bertangga yang tersembunyi di balik bantal). */
const pitaTangga = (atas: readonly Tt[], bawah: readonly Tt[]): string =>
  `M${n(atas[0][0])} ${n(atas[0][1])} ${halus(atas)}${bawah.map((p) => `L${n(p[0])} ${n(p[1])}`).join(' ')} Z`;
const garisHalus = (ps: readonly Tt[]): string => `M${n(ps[0][0])} ${n(ps[0][1])} ${halus(ps)}`;
const poligon = (ps: readonly Tt[]): string => `M${ps.map((p) => `${n(p[0])} ${n(p[1])}`).join(' L')} Z`;

/**
 * Kontur tepi bantal dudukan bagian DEPAN (di depan lengan): sudut depan-jauh (mulai sudut `dari`°, 90 = sisi jauh,
 * 22,6 = siluet) → tepi depan → sudut depan-dekat → sisi dekat sampai ujung lengan (sesudahnya tertutup muka luar
 * cangkang). `sisip` = masuk ke dalam (cm), untuk badan kursi & garis sorot.
 */
function tepiBantal(y: number, sisip = 0, dari = (SILUET * 180) / Math.PI): Tt[] {
  const r = B.sudutDepan;
  const ad = B.dudukDepan - sisip;
  const bb = B.rbDalam - sisip;
  const ps: Tt[] = [];
  const langkah = Math.max(2, Math.round(dari / 15));
  for (let i = 0; i <= langkah; i += 1) {
    const u = ((dari - (dari * i) / langkah) * Math.PI) / 180;
    ps.push(titikKursi(ad - r + r * Math.cos(u), bb - r + r * Math.sin(u), y));
  }
  for (let i = 1; i <= 6; i += 1) {
    const u = (-(90 * i) / 6 * Math.PI) / 180;
    ps.push(titikKursi(ad - r + r * Math.cos(u), -bb + r + r * Math.sin(u), y));
  }
  for (let i = 1; i <= 3; i += 1) ps.push(titikKursi(ad - r + ((B.lenganDepan - (ad - r)) * i) / 3, -bb, y));
  return ps;
}

/** Warna kain (mauve/dusty rose kusam) & walnut. */
const KAIN = {
  sorot: '#f0d5cf',
  terang: '#dcaaa2',
  muda: '#c9948d',
  sedang: '#b27d7b',
  teduh: '#98645f',
  gelap: '#76484b',
  lipat: '#4a282d',
  piping: '#7a4a51',
};

export function kursiPengunjungSvg(lok: string): string {
  const id = `rg-${lok}-kursi`;
  const dalam = kontur(0);
  const luar = kontur(1);
  const tengah = kontur(0.5);
  // Batas muka luar tampak (siluet di sudut belakang-dekat): muka luar tampak dari indeks iL sampai ujung lengan
  // dekat; muka dalam tampak dari ujung lengan jauh sampai iL (saling melengkapi).
  const iL = Math.max(1, luar.findIndex((_, i) => luarTampak(luar, i)));
  const dalamTampak = dalam.slice(0, iL + 1);
  // Muka tegak yang tampak: [ujung lengan jauh (siluet → titik dalam)] + dalam; dan luar + [ujung lengan dekat].
  const ujJauh = ujung(1, PHI_TAMPAK, 0);
  const ujDekatTampak = ujung(-1, 0, PHI_TAMPAK);
  const mukaDalam = [...ujJauh, ...dalamTampak.slice(1)];
  const mukaLuar = [...luar.slice(iL - 1), ...ujDekatTampak.slice(1)];

  // Titik acuan gradien.
  const xUjungJauh = puncak(ujJauh[0])[0];
  const xSiluet = puncak(luar[iL])[0];
  const xUjungDekat = puncak(ujDekatTampak[ujDekatTampak.length - 1])[0];
  const belakang = puncak(dalam[3 + N_BUSUR / 2]);
  const bantalDepan = titikKursi(B.dudukDepan, B.rbDalam, 0);
  const bantalDekat = titikKursi(B.dudukDepan - B.sudutDepan, -B.rbDalam, -B.bantal);
  const fr = (x: number) => Math.max(0, Math.min(1, (x - xUjungJauh) / (xSiluet - xUjungJauh)));

  let s = '<defs>';
  // Muka dalam: ujung lengan jauh (menghadap kiri, terang) → sisi dalam lengan jauh (menghadap kanan-kamera, redup)
  // → sandaran (menghadap kiri, terang) → menjelang siluet (gelap).
  s += gradLinear(`${id}-dalam`, xUjungJauh, 0, xSiluet, 0, [[0, KAIN.muda], [0.09, KAIN.teduh], [0.45, KAIN.sedang], [0.74, KAIN.muda], [1, KAIN.teduh]]);
  // Muka luar sisi dekat: ujung lengan (menghadap kiri, terang) → sisi (redup) → memutar ke belakang (terminator).
  s += gradLinear(`${id}-luar`, xUjungDekat, 0, xSiluet, 0, [[0, KAIN.muda], [0.12, KAIN.sedang], [0.55, KAIN.teduh], [1, KAIN.gelap]]);
  const yLuarAtas = pada(luar[luar.length - 1], B.tinggiLengan)[1];
  const yLuarBawah = pada(luar[luar.length - 1], B.dasar)[1];
  s += gradLinear(`${id}-luarY`, 0, yLuarAtas, 0, yLuarBawah, [[0, '#fff3ea', 0.16], [0.22, '#fff3ea', 0], [0.62, '#2a1015', 0], [1, '#2a1015', 0.32]]);
  s += gradLinear(`${id}-atas`, xUjungJauh, 0, xSiluet, 0, [[0, KAIN.terang], [0.3, KAIN.muda], [fr(belakang[0]), KAIN.terang], [1, KAIN.muda]]);
  s += gradLinear(`${id}-dudukan`, bantalDepan[0], bantalDepan[1], belakang[0], belakang[1] + 150, [[0, KAIN.terang], [0.55, KAIN.muda], [1, KAIN.sedang]]);
  s += gradLinear(`${id}-bantal`, bantalDepan[0], 0, bantalDekat[0] + 70, 0, [[0, KAIN.muda], [0.45, KAIN.sedang], [1, KAIN.teduh]]);
  s += gradLinear(`${id}-badan`, bantalDepan[0], 0, bantalDekat[0] + 70, 0, [[0, KAIN.teduh], [1, KAIN.gelap]]);
  s += gradLinear(`${id}-kaki`, 0, 0, 1, 0, [[0, '#7a4a2c'], [1, '#4a2915']]).replace('gradientUnits="userSpaceOnUse"', 'gradientUnits="objectBoundingBox"');
  s += gradLinear(`${id}-lipat`, xUjungJauh, 0, xSiluet, 0, [[0, KAIN.lipat, 0.12], [0.75, KAIN.lipat, 0.42], [1, KAIN.lipat, 0.3]]);
  s += gradLinear(`${id}-sorot`, xUjungJauh, 0, xSiluet, 0, [[0, KAIN.sorot, 0.5], [0.3, KAIN.sorot, 0.3], [0.62, KAIN.sorot, 0.85], [0.9, KAIN.sorot, 0.45], [1, KAIN.sorot, 0]]);
  s += '</defs>';

  // 1. Bayang lantai: ruang gelap di bawah badan kursi sampai tepi bawah dunia + bayang jatuh ke kanan-belakang. Tepi
  //    atas poligon ada DI DALAM siluet badan kursi (tertutup), jadi yang tampak hanya bagian di bawah badan.
  const kolongKiri = titikKursi(B.dudukDepan - 2, B.rbDalam - 2, B.dasar);
  const kolongKanan = pada(luar[iL + 2], B.dasar);
  s += `<defs>${gradLinear(`${id}-kolong`, 0, kolongKiri[1], 0, 900, [[0, '#2a1508', 0.34], [0.6, '#2a1508', 0.22], [1, '#2a1508', 0.1]])}</defs>`;
  s += jalur(`M${n(kolongKiri[0])} ${n(kolongKiri[1])} L${n(kolongKanan[0])} ${n(kolongKanan[1])} L${n(kolongKanan[0] + 16)} 900 L${n(kolongKiri[0] - 8)} 900 Z`, `url(#${id}-kolong)`);
  s += cahaya(`${id}-jatuh`, kolongKanan[0] + 24, 900, 104, 60, '#2a1508', 0.28);

  // 2. Kaki walnut meruncing & sedikit mengembang, bersepatu kuningan; jauh dulu (dekat di akhir).
  const kaki = (a: number, b: number): string => {
    const t1 = titikKursi(a, b, B.dasar + 1);
    const t2 = titikKursi(a * 1.08, b * 1.1, B.lantai + 2);
    const t3 = titikKursi(a * 1.08, b * 1.1, B.lantai);
    const w1 = 5.4 * KURSI.s;
    const w2 = 2.6 * KURSI.s;
    let k = jalur(`M${n(t1[0] - w1)} ${n(t1[1])} L${n(t1[0] + w1)} ${n(t1[1])} L${n(t2[0] + w2)} ${n(t2[1])} L${n(t2[0] - w2)} ${n(t2[1])} Z`, `url(#${id}-kaki)`, tepi(1, 0.8));
    k += gores(`M${n(t1[0] - w1 * 0.45)} ${n(t1[1] + 4)} L${n(t2[0] - w2 * 0.4)} ${n(t2[1] - 2)}`, '#b5835a', 1.2, 'opacity=".6"');
    k += jalur(`M${n(t2[0] - w2)} ${n(t2[1])} L${n(t2[0] + w2)} ${n(t2[1])} L${n(t3[0] + w2 * 0.9)} ${n(t3[1])} L${n(t3[0] - w2 * 0.9)} ${n(t3[1])} Z`, '#c9a55e', tepi(0.8, 0.6));
    return k;
  };
  s += kaki(-B.raDalam - 5, B.rbDalam - 2) + kaki(B.dudukDepan - 4, B.rbDalam - 4);

  // 3. Siluet cangkang (alas gelap: muka luar belakang/jauh yang membelakangi kamera; menutup celah antarmuka).
  s += jalur(pita(luar.map((p) => puncak(p)), luar.map((p) => pada(p, B.dasar)).reverse()), KAIN.gelap);

  // 4. Muka dalam yang tampak: ujung lengan jauh (turun ke badan kursi) + sisi dalam lengan jauh + sandaran (turun ke
  //    dudukan), lalu bayang di bawah gulungan & jahitan kanal sandaran.
  const bawahDalam = [...ujJauh.map((p) => pada(p, B.dasar)), ...dalamTampak.slice(1).map((p) => pada(p, 0))];
  s += jalur(pitaTangga(mukaDalam.map((p) => puncak(p)), bawahDalam.reverse()), `url(#${id}-dalam)`, tepi(1.1, 0.7));
  s += gores(garisHalus(dalamTampak.map((p) => puncak(p, -2.2))), KAIN.lipat, 3.4, 'opacity=".2"');
  for (const th of [0.32, 0.5, 0.68].map((f) => f * Math.PI)) {
    const sp: Sampel = { a: B.a0 - B.raDalam * Math.sin(th), b: B.rbDalam * Math.cos(th), th, turun: 0 };
    const t = puncak(sp, -3.2);
    const m = titikKursi(sp.a + 1.6, sp.b, tinggiAtas(th) * 0.45);
    const bw = pada(sp, 2.5);
    s += gores(`M${n(t[0] + 2)} ${n(t[1] + 1)} Q${n(m[0] + 2)} ${n(m[1])} ${n(bw[0] + 2)} ${n(bw[1])}`, KAIN.teduh, 3, 'opacity=".3"');
    s += gores(`M${n(t[0])} ${n(t[1])} Q${n(m[0])} ${n(m[1])} ${n(bw[0])} ${n(bw[1])}`, KAIN.piping, 1, 'opacity=".4"');
    s += gores(`M${n(t[0] - 2.5)} ${n(t[1] + 1)} Q${n(m[0] - 2.5)} ${n(m[1])} ${n(bw[0] - 2.5)} ${n(bw[1])}`, KAIN.sorot, 1, 'opacity=".28"');
  }

  // 5. Badan dudukan (di bawah bantal, sedikit masuk) lalu bantal: tepi depan membulat, puncak, lipatan belakang.
  s += jalur(pita(tepiBantal(-B.bantal, 1.5), tepiBantal(B.dasar, 1.5).reverse()), `url(#${id}-badan)`, tepi(1.1, 0.8));
  s += jalur(pita(tepiBantal(0), tepiBantal(-B.bantal).reverse()), `url(#${id}-bantal)`, tepi(1.2, 0.85));
  // Puncak bantal: sisi jauh (dari ujung lengan) → sudut & tepi depan → sisi dekat → kontur dalam cangkang (balik).
  s += jalur(poligon([titikKursi(B.lenganDepan, B.rbDalam, 0), ...tepiBantal(0, 0, 90), ...dalam.map((p) => pada(p, 0)).reverse()]), `url(#${id}-dudukan)`, tepi(1.2, 0.85));
  // Bayang kontak di lipatan bantal–cangkang (pita lebar memudar + garis lipat).
  s += gores(garisHalus(dalamTampak.map((p) => pada(p, 0.6))), `url(#${id}-lipat)`, 9);
  s += gores(garisHalus(dalamTampak.map((p) => pada(p, 0.2))), KAIN.lipat, 1.6, 'opacity=".45"');
  // Piping tepi depan bantal (gelap), sorot punggung tepi membulat (terang), bayang di bawah bantal.
  s += gores(garisHalus(tepiBantal(-0.6)), KAIN.piping, 1.6, 'opacity=".7"');
  s += gores(garisHalus(tepiBantal(0.4, 2.2, 60).slice(1, 6)), KAIN.sorot, 1.6, 'opacity=".3"');
  s += gores(garisHalus(tepiBantal(-B.bantal + 1)), KAIN.lipat, 2.2, 'opacity=".35"');

  // 6. Muka luar sisi dekat (memutar dari siluet belakang ke ujung lengan dekat) + gradasi tinggi + jahitan.
  const muka = pita(mukaLuar.map((p) => puncak(p)), mukaLuar.map((p) => pada(p, B.dasar)).reverse());
  s += jalur(muka, `url(#${id}-luar)`, tepi(1.3, 0.85));
  s += jalur(muka, `url(#${id}-luarY)`);
  s += gores(garisHalus(mukaLuar.map((p) => puncak(p, -2.4))), '#2a1015', 3, 'opacity=".16"');
  const kampuh = luar[3 + Math.round(N_BUSUR * 0.86)];
  const k1 = puncak(kampuh, -2);
  const k2 = pada(kampuh, B.dasar + 2);
  s += gores(`M${n(k1[0])} ${n(k1[1])} Q${n((k1[0] + k2[0]) / 2 + 3)} ${n((k1[1] + k2[1]) / 2)} ${n(k2[0])} ${n(k2[1])}`, KAIN.piping, 1.2, 'opacity=".45"');
  // Sorot tegak di ujung lengan dekat (bagian membulat yang menghadap cahaya) & piping pertemuan cangkang–badan.
  const sd = ujDekatTampak[Math.round(ujDekatTampak.length * 0.6)];
  const s1 = puncak(sd, -3);
  const s2 = pada(sd, B.dasar + 3);
  s += gores(`M${n(s1[0])} ${n(s1[1])} L${n(s2[0])} ${n(s2[1])}`, KAIN.sorot, 2, 'opacity=".3"');
  s += gores(garisHalus(mukaLuar.map((p) => pada(p, -B.bantal - 1))), KAIN.piping, 1.4, 'opacity=".5"');

  // 7. Gulungan tepi atas (seluruh U + kedua ujung lengan, tampak dari atas) + sorot punggung gulungan + piping luar.
  const atasLoop = [
    ...luar.map((p) => puncak(p)),
    ...ujung(-1, 0, Math.PI).slice(1, -1).map((p) => puncak(p)),
    ...[...dalam].reverse().map((p) => puncak(p)),
    ...ujung(1, 0, Math.PI).slice(1, -1).map((p) => puncak(p)),
  ];
  s += jalur(`M${n(atasLoop[0][0])} ${n(atasLoop[0][1])} ${halus([...atasLoop, atasLoop[0]])}Z`, `url(#${id}-atas)`, tepi(1.2, 0.85));
  s += gores(garisHalus([puncak(ujung(1, 0, Math.PI)[3], 0.6), ...tengah.slice(0, iL + 4).map((p) => puncak(p, 0.8))]), `url(#${id}-sorot)`, 2.4);
  s += gores(garisHalus([...luar.map((p) => puncak(p)), ...ujDekatTampak.slice(1).map((p) => puncak(p))]), KAIN.piping, 1.5, 'opacity=".65"');

  // 8. Kaki dekat (di depan badan kursi).
  s += kaki(-B.raDalam - 5, -B.rbDalam + 2) + kaki(B.dudukDepan - 4, -B.rbDalam + 4);
  return s;
}

/**
 * Kotak lapisan kursi (dunia, kelipatan 4) — dihitung dari bentuk: cangkang (atas & dasar), ujung lengan, tepi bantal,
 * + tepi 40 (garis, bayang jatuh), sampai tepi bawah dunia (kaki & lantai kursi di luar dunia pada skala ini).
 */
export const KOTAK_KURSI = (() => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const th = (Math.PI * i) / 40;
    for (const t of [0, 1]) {
      const a = B.a0 - (B.raDalam + t * B.tebal) * Math.sin(th);
      const b = (B.rbDalam + t * B.tebal) * Math.cos(th);
      for (const [x, y] of [titikKursi(a - B.rebah * Math.sin(th) ** 2, b, B.tinggiSandar), titikKursi(a, b, B.dasar)]) { xs.push(x); ys.push(y); }
    }
  }
  for (const sisi of [1, -1]) for (let a = B.a0; a <= B.dudukDepan; a += 1) {
    const [x, y] = titikKursi(a, sisi * B.rbDalam, 0);
    xs.push(x); ys.push(y);
  }
  const x = Math.floor((Math.min(...xs) - 40) / 4) * 4;
  const y = Math.floor((Math.min(...ys) - 16) / 4) * 4;
  const x2 = Math.min(1600, Math.ceil((Math.max(...xs) + 40) / 4) * 4);
  return { x, y, w: x2 - x, h: 900 - y } as const;
})();
