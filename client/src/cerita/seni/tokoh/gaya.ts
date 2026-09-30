/**
 * GAYA BERSAMA tokoh v3 (Miss Raksa & Bu Rina; docs/cerita/ADEGAN-AUTO1.md bagian 7): palet garis & bayang, arah
 * cahaya, dan alat gambar murni (string SVG saja, tanpa DOM) supaya kedua tokoh punya tebal garis, cahaya, dan
 * cara membentuk volume yang SAMA.
 *
 * Aturan gaya (ringkas):
 * - Garis tepi tipis cokelat tua hangat `GARIS.warna` (#3a2620), tebal ± 0,8 % tinggi kepala (`GARIS.tepi`); garis
 *   dalam (lipatan, kelopak, telinga) lebih terang `GARIS.dalam`.
 * - Cahaya dari KIRI ATAS (`CAHAYA`). Volume = 2 nada: gradien isi (terang kiri-atas → gelap kanan-bawah) + lapisan
 *   bayang tembus bertumpuk (`BAYANG`, 8–30 %) di sisi yang membelakangi cahaya; sorot hangat `BAYANG.sorot` di kiri-atas.
 *   Tanpa <filter> (murah di HP): tepi lembut = 2–3 bentuk tembus yang makin kecil.
 * - Tanpa simbol emosi besar; ekspresi dari mata, alis, mulut, dan sikap kepala.
 * - Semua id gradien/klip diawali `opsi.id` pemanggil (dua salinan di satu halaman tidak bentrok).
 *
 * Titik ditulis tangan dari pengukuran referensi (BUKAN vektorisasi otomatis foto).
 */

export type T2 = [number, number];
export type T3 = [number, number, number];

// ------------------------------------------------------------------ palet bersama

/** Garis tepi & dalam. `tepi` = tebal garis luar badan/wajah pada skala 1 (kepala 130 satuan). */
export const GARIS = {
  warna: '#3a2620',
  dalam: '#7b4636',
  tepi: 1.05,
  /** Pengali tebal garis versi `kecil` (kepala < 60 px) supaya tetap terbaca saat diperkecil: kepala & badan. */
  kaliKecil: 2.3,
  kaliKecilBadan: 1.6,
} as const;

/** Arah MENUJU cahaya (vektor satuan, y ke bawah): kiri atas. */
export const CAHAYA: T2 = [-0.6, -0.8];

/** Bayang & sorot hangat (dipakai tembus, bertumpuk). */
export const BAYANG = {
  /** Bayang kulit/kain hangat (seperti multiply cokelat kemerahan). */
  hangat: '#b0604a',
  /** Rongga dalam (lubang hidung, sudut bibir, lipatan tajam). */
  tua: '#7e3a2c',
  /** Bayang kontak di lantai/meja. */
  kontak: '#2a1a12',
  /** Sorot hangat dari lampu kiri atas. */
  sorot: '#fff6ec',
  /** Pantulan hangat dinding kuning (tepi kanan bawah bentuk). */
  pantul: '#f3c46a',
} as const;

// ------------------------------------------------------------------ angka & kurva

/** Angka 1 desimal, tanpa "-0" (SVG ringkas & deterministik). */
export const f = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) || r === 0 ? '0' : String(r);
};
export const pt = (p: T2): string => `${f(p[0])} ${f(p[1])}`;
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerp2 = (a: T2, b: T2, t: number): T2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const lerp3 = (a: T3, b: T3, t: number): T3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const geser = (p: readonly T2[], dx: number, dy: number): T2[] => p.map(([x, y]) => [x + dx, y + dy]);

/** Bulatkan ke 0,1 (bilangan bulat persepuluhan, supaya selisih relatif tidak menumpuk galat pembulatan). */
const r10 = (n: number): number => Math.round(n * 10);
/** Angka path ringkas dari persepuluhan bulat: "0.5" → ".5", "-0.5" → "-.5". */
function angka(d10: number): string {
  if (d10 === 0) return '0';
  const neg = d10 < 0;
  const a = Math.abs(d10);
  const s = a % 10 === 0 ? String(a / 10) : a < 10 ? `.${a}` : `${Math.floor(a / 10)}.${a % 10}`;
  return neg ? `-${s}` : s;
}
/** Gabung angka path: spasi dihilangkan sebelum tanda minus. */
function gabungAngka(a: number[]): string {
  let s = '';
  a.forEach((v, i) => {
    const t = angka(v);
    s += i === 0 || t[0] === '-' ? t : ` ${t}`;
  });
  return s;
}

/**
 * Kurva Catmull-Rom → Bézier kubik melalui titik (terbuka atau tertutup). `k` = kelenturan (1/6 = baku).
 * Ditulis sebagai perintah RELATIF `c` yang ringkas (titik awal absolut `M`); selisih dihitung dari titik yang
 * sudah dibulatkan sehingga tidak ada galat yang menumpuk.
 */
export function halus(p: readonly T2[], tutup = false, k = 1 / 6): string {
  if (p.length < 2) return '';
  const n = p.length;
  const ambil = (i: number): T2 => (tutup ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  let cx = r10(p[0][0]), cy = r10(p[0][1]);
  let d = `M${gabungAngka([cx, cy])}c`;
  const akhir = tutup ? n : n - 1;
  const bil: number[] = [];
  for (let i = 0; i < akhir; i++) {
    const p0 = ambil(i - 1), p1 = ambil(i), p2 = ambil(i + 1), p3 = ambil(i + 2);
    const x1 = r10(p1[0] + (p2[0] - p0[0]) * k), y1 = r10(p1[1] + (p2[1] - p0[1]) * k);
    const x2 = r10(p2[0] - (p3[0] - p1[0]) * k), y2 = r10(p2[1] - (p3[1] - p1[1]) * k);
    const x = r10(p2[0]), y = r10(p2[1]);
    bil.push(x1 - cx, y1 - cy, x2 - cx, y2 - cy, x - cx, y - cy);
    cx = x;
    cy = y;
  }
  d += gabungAngka(bil);
  return tutup ? `${d}Z` : d;
}

/** Beberapa kurva terbuka yang bersambung (ujung = pangkal berikutnya) → satu path dengan sudut tajam di sambungan. */
export function rangkai(segmen: readonly (readonly T2[])[], tutup = true): string {
  let d = '';
  segmen.forEach((s, i) => {
    const h = halus(s);
    // segmen berikutnya: "M x y" menjadi garis lurus "L x y" ke pangkalnya (aman juga bila tidak persis bersambung),
    // lalu perintah relatif dilanjutkan dari titik itu
    d += i === 0 ? h : h.replace(/^M/, 'L');
  });
  return tutup ? `${d}Z` : d;
}

/** Normal satuan di titik i sebuah polilinia (kiri arah jalan, y ke bawah). */
function normal(p: readonly T2[], i: number): T2 {
  const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [-dy / L, dx / L];
}

/** Pita lancip melalui titik (tebal per titik) → path tertutup. Untuk alis, garis bulu mata, helai, lipatan. */
export function pita(p: readonly T2[], tebal: readonly number[], geserNormal = 0): string {
  const kiri: T2[] = [];
  const kanan: T2[] = [];
  for (let i = 0; i < p.length; i++) {
    const [nx, ny] = normal(p, i);
    const h = tebal[i] / 2;
    kiri.push([p[i][0] + nx * (h + geserNormal), p[i][1] + ny * (h + geserNormal)]);
    kanan.push([p[i][0] - nx * (h - geserNormal), p[i][1] - ny * (h - geserNormal)]);
  }
  return halus([...kiri, ...kanan.reverse()], true);
}

/**
 * Garis berlebar variabel sebagai BENTUK TERISI (bukan stroke): meruncing di kedua ujung dan MENEBAL di sisi yang
 * membelakangi cahaya. Memberi garis tepi yang "hidup" seperti tinta: tipis di kiri atas (terkena cahaya), tebal di
 * kanan bawah. `lebar` = tebal dasar; `luar` = sisi luar bentuk relatif arah jalan titik (+1 = kiri, -1 = kanan;
 * untuk kontur searah jarum jam di layar, luar = -1); `cahaya` 0..1 = kekuatan modulasi; `awal/akhir` = sisa lebar
 * di ujung (0 = runcing, 1 = tumpul).
 */
export function garisTinta(
  p: readonly T2[],
  lebar: number,
  o: { luar?: 1 | -1; cahaya?: number; awal?: number; akhir?: number; porsi?: number } = {},
): string {
  const n = p.length;
  if (n < 2) return '';
  const cahaya = o.cahaya ?? 0.5;
  const luar = o.luar ?? -1;
  const porsi = o.porsi ?? 0.2;
  const tebal = p.map((_, i) => {
    const t = i / (n - 1);
    let w = lebar;
    if (t < porsi) w *= lerp(o.awal ?? 0.15, 1, t / porsi);
    else if (t > 1 - porsi) w *= lerp(o.akhir ?? 0.15, 1, (1 - t) / porsi);
    const [nx, ny] = normal(p, i);
    const dot = luar * (nx * CAHAYA[0] + ny * CAHAYA[1]); // + = sisi luar menghadap cahaya
    return Math.max(0.1, w * (1 - cahaya * dot));
  });
  return pita(p, tebal);
}

// ------------------------------------------------------------------ elemen ringkas

/** Elemen path ringkas. */
export const jl = (d: string, atribut: string): string => `<path d="${d}" ${atribut}/>`;
/** fill (+ opacity) untuk bayang/sorot bertumpuk. */
export const isi = (warna: string, op?: number): string => (op === undefined ? `fill="${warna}"` : `fill="${warna}" fill-opacity="${f(op)}"`);
/** Garis stroke tanpa isi. */
export const garis = (warna: string, tebal: number, op?: number): string =>
  `fill="none" stroke="${warna}" stroke-width="${f(tebal)}" stroke-linecap="round" stroke-linejoin="round"${op === undefined ? '' : ` stroke-opacity="${f(op)}"`}`;
/** Garis tepi (dipakai bersama fill). */
export const tepi = (tebal: number = GARIS.tepi, warna: string = GARIS.warna): string =>
  `stroke="${warna}" stroke-width="${f(tebal)}" stroke-linejoin="round"`;
/** Bentuk halus tertutup dengan atribut bebas. */
export const tutup = (p: readonly T2[], atribut: string, k = 1 / 6): string => jl(halus(p, true, k), atribut);
/** Bentuk halus tertutup berisi warna (bayang/sorot tembus). */
export const bentuk = (p: readonly T2[], warna: string, op?: number): string => jl(halus(p, true), isi(warna, op));

/** Bayangan kontak dua lapis (lantai/meja) di bawah tokoh. */
export function bayangKontak(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${isi(BAYANG.kontak, 0.2)}/>` +
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.55)}" ${isi(BAYANG.kontak, 0.2)}/>`
  );
}

/** Gradien linear 2–3 henti (id sudah berawalan). */
export function gradienLinear(id: string, x2: number, y2: number, henti: readonly (readonly [number, string, number?])[]): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${f(x2)}" y2="${f(y2)}">${henti
    .map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${f(a)}"`}/>`)
    .join('')}</linearGradient>`;
}

/** Gradien radial memudar ke tepi (rona pipi, sorot lembut) tanpa filter blur. */
export function gradienPudar(id: string, warna: string, op: number): string {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${warna}" stop-opacity="${f(op)}"/><stop offset=".55" stop-color="${warna}" stop-opacity="${f(op * 0.45)}"/><stop offset="1" stop-color="${warna}" stop-opacity="0"/></radialGradient>`;
}

// ------------------------------------------------------------------ proyeksi kepala 2,5D

const RAD = Math.PI / 180;
export type Proyeksi = (p: T3) => T2;

/**
 * Proyektor kepala 2,5D. Titik (x, y, z) ditulis pada pose ACUAN (kepala menoleh `acuan` derajat ke kanan gambar);
 * z = kedalaman dari sumbu putar leher (hidung ± 55, mata ± 42, telinga ± 0, belakang kepala negatif).
 * `toleh` = sudut toleh yang diinginkan (acuan = tanpa perubahan), `angguk` + = menunduk. Menoleh memutar ulang titik
 * yang SAMA (mata jauh memendek, hidung bergeser, telinga & sanggul ikut): orang yang sama di semua arah pandang.
 */
export function buatProyeksi(toleh: number, angguk = 0, acuan = 20, sumbuX = 3.3, pusatAngguk = 30): Proyeksi {
  const c1 = Math.cos(acuan * RAD), s1 = Math.sin(acuan * RAD);
  const ct = Math.cos(toleh * RAD), st = Math.sin(toleh * RAD), ca = Math.cos(angguk * RAD), sa = Math.sin(angguk * RAD);
  return ([x, y, z]) => {
    const X = (x - sumbuX - z * s1) / c1;
    const zk = -X * st + z * ct;
    return [X * ct + z * st + sumbuX, y * ca + (zk - pusatAngguk) * sa];
  };
}

/** Kurva halus melalui titik 3D yang diproyeksikan. */
export const halus3 = (P: Proyeksi, p: readonly T3[], tutupKurva = false, k?: number): string => halus(p.map(P), tutupKurva, k);

// ------------------------------------------------------------------ cache

/** Cache kecil berbatas (LRU sederhana) untuk hasil generator per kunci opsi. */
export function buatCache<V>(maks = 96): { ambil(k: string, buat: () => V): V; hapus(): void; ukuran(): number } {
  const m = new Map<string, V>();
  return {
    ambil(k, buat) {
      const ada = m.get(k);
      if (ada !== undefined) {
        m.delete(k);
        m.set(k, ada);
        return ada;
      }
      const v = buat();
      m.set(k, v);
      if (m.size > maks) m.delete(m.keys().next().value as string);
      return v;
    },
    hapus: () => m.clear(),
    ukuran: () => m.size,
  };
}
