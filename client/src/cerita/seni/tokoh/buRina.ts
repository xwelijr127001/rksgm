/**
 * BU RINA v3 — generator seni nasabah AUTO-1 (docs/cerita/ADEGAN-AUTO1.md bagian 6-7): ibu pemilik usaha katering,
 * 40-an, kerudung (khimar) warna bata dengan bros kecil kuning, tunik biru selutut berlis jingga di atas celana gelap,
 * celemek pinggang krem bertepi jingga (kain TIPIS: berdiri = tergantung dari tali pinggang sampai ± lutut; duduk =
 * rebah di atas paha lalu jatuh melewati lutut, tanpa volume bantal), kunci mobil. Digambar ULANG
 * dengan gaya Miss Raksa v3 (kandidat C): semi-realis hangat, proporsi dewasa ± 7 kepala, garis tipis cokelat tua
 * #3a2620 (dalam: #7b4636), bentuk dari gradien dasar + lapisan bayang/sorot tembus bertumpuk, cahaya dari KIRI ATAS.
 * Tanpa filter, tanpa clipPath, tanpa raster.
 *
 * Cara kerja (satu keluarga gambar untuk panggung, potret, dan aktivitas):
 * - KEPALA = model 3D simetris ditulis tangan (titik x, y, z; bukan hasil vektorisasi foto). Arah pandang/toleh memutar
 *   ulang titik yang sama, jadi semua ekspresi & arah tetap orang yang sama. Wajah dibingkai bukaan kerudung.
 * - KHIMAR = busur kubah dari model kepala (puncak rendah, kepala bulat di balik kain) + juntaian yang jatuh tegak di
 *   tengkuk, berbelok di lereng bahu, membulat di pangkal lengan, keliman bergelombang TIDAK rata di dada; bidang
 *   cahaya (atas bahu terang, samping bahu gelap, bayang dagu), lipatan jatuh tegak dari bros ke keliman + ayunan U
 *   di bawah bros; kilap kain redup (katun, bukan plastik).
 * - BADAN = rangka per pose (bahu, siku, pergelangan, pinggul, lutut, pergelangan kaki) + bentuk kain. TANGAN = rangka
 *   jari (punggung tangan + empat jari tiga ruas + ibu jari). Semua titik dihitung dalam koordinat kanvas; menghadap
 *   kanan (berdiri-pergi, atau `hadap: 'kanan'` pada berdiri/jalan) = titik dicerminkan SEBELUM diarsir, sehingga cahaya
 *   tetap dari kiri atas; kepala digambar dari model 3D yang menoleh (bukan dicerminkan).
 * - ARSIR = pita bayang di sisi bentuk yang normalnya menjauhi cahaya (pitaTepi) + sorot di sisi yang menghadap cahaya;
 *   tepi lembut = 2-3 pita bertumpuk. Pita dihitung di DALAM bentuk, jadi tanpa clipPath.
 * - Ekspresi = alis, kelopak, mulut, pipi, miring/angguk kepala, bahu, dan GESTUR tangan (bukan simbol).
 *
 * Kanvas & jangkar dari ukuran.ts (berdiri 420x1000 telapak 210,985; duduk 460x900 pinggul 230,560).
 * Id gradien diawali `opsi.id` (bawaan 'rina'). `polos` (internal, nasabah.ts) = tanpa id sama sekali.
 */
import type { ArahPandang, Ekspresi, PoseNasabah } from '../../tipe';
import type { GambarTokoh, OpsiBuRina, Titik } from './tipe';
import { KANVAS_BERDIRI, KANVAS_DUDUK } from './ukuran';
import { BAYANG, CAHAYA, GARIS, buatCache, halus, rangkai } from './gaya';

export const ID_BAWAAN_RINA = 'rina';

// =================================================================================================================
// Alat kecil
// =================================================================================================================

type T2 = [number, number];
type T3 = [number, number, number];
const RAD = Math.PI / 180;

const f = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) || r === 0 ? '0' : String(r);
};
const pt = (p: T2): string => `${f(p[0])} ${f(p[1])}`;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerp2 = (a: T2, b: T2, t: number): T2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const jepit = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const tambah2 = (p: T2, d: T2, k = 1): T2 => [p[0] + d[0] * k, p[1] + d[1] * k];
const geser = (p: T2[], dx: number, dy: number): T2[] => p.map(([x, y]) => [x + dx, y + dy]);
const putar = (p: T2, c: T2, derajat: number): T2 => {
  const a = derajat * RAD;
  const dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
const normal2 = (v: T2): T2 => {
  const L = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / L, v[1] / L];
};
/** Interpolasi tabel (x naik) linear. */
function tabel(t: [number, number][], x: number): number {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (x <= t[i][0]) return lerp(t[i - 1][1], t[i][1], (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0]));
  }
  return t[t.length - 1][1];
}

/** Titik rapat di sepanjang kurva yang sama dengan `halus` (untuk pita arsir & potong). */
function sampel(p: T2[], tutup = true, per = 5, k = 1 / 6): T2[] {
  const n = p.length;
  if (n < 2) return p.slice();
  const ambil = (i: number): T2 => (tutup ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const out: T2[] = [];
  const akhir = tutup ? n : n - 1;
  for (let i = 0; i < akhir; i++) {
    const p0 = ambil(i - 1), p1 = ambil(i), p2 = ambil(i + 1), p3 = ambil(i + 2);
    const c1: T2 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: T2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    for (let j = 0; j < per; j++) {
      const t = j / per, u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  if (!tutup) out.push(p[n - 1]);
  return out;
}

/** Angka path ringkas dari persepuluhan bulat ("0.5" → ".5"). */
function angka10(d: number): string {
  if (d === 0) return '0';
  const a = Math.abs(d);
  const t = a % 10 === 0 ? String(a / 10) : a < 10 ? `.${a}` : `${Math.floor(a / 10)}.${a % 10}`;
  return d < 0 ? `-${t}` : t;
}
/** Poligon garis lurus (titik rapat) sebagai path RELATIF ringkas: M awal lalu l selisih (tanpa galat menumpuk). */
function poli(p: T2[], tutup = true, bulat = false): string {
  if (!p.length) return '';
  // bulat = presisi 1 satuan (pita arsir lembut; ± 1 px di panggung), bawaan 0,1 satuan
  const q = (v: number): number => (bulat ? Math.round(v) * 10 : Math.round(v * 10));
  let cx = q(p[0][0]), cy = q(p[0][1]);
  let d = `M${angka10(cx)} ${angka10(cy)}l`;
  let awal = true;
  for (let i = 1; i < p.length; i++) {
    const x = q(p[i][0]), y = q(p[i][1]);
    const dx = x - cx, dy = y - cy;
    if (dx === 0 && dy === 0) continue;
    for (const v of [dx, dy]) {
      const t = angka10(v);
      d += awal || t[0] === '-' ? t : ` ${t}`;
      awal = false;
    }
    cx = x;
    cy = y;
  }
  if (awal) d += '0 0';
  return tutup ? `${d}Z` : d;
}

const jl = (d: string, gaya: string): string => (d ? `<path d="${d}" ${gaya}/>` : '');
const isi = (warna: string, op?: number): string => (op === undefined ? `fill="${warna}"` : `fill="${warna}" fill-opacity="${Math.round(op * 1000) / 1000}"`);
const garis = (warna: string, tebal: number, op?: number): string =>
  `fill="none" stroke="${warna}" stroke-width="${f(tebal)}" stroke-linecap="round" stroke-linejoin="round"${op === undefined ? '' : ` stroke-opacity="${Math.round(op * 1000) / 1000}"`}`;
const elips = (c: T2, rx: number, ry: number, gaya: string, sudut = 0): string =>
  `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}"${sudut ? ` transform="rotate(${f(sudut)} ${pt(c)})"` : ''} ${gaya}/>`;

/** Luas bertanda (orientasi poligon). */
function luas(p: T2[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return a / 2;
}

/** Arah bayangan di layar (menjauhi cahaya kiri atas, gaya.ts CAHAYA). */
const ARAH_BAYANG: T2 = normal2([-CAHAYA[0], -CAHAYA[1]]);
const ARAH_SOROT: T2 = [-ARAH_BAYANG[0], -ARAH_BAYANG[1]];

/**
 * Pita di dalam tepi poligon rapat `p` di bagian yang normal luarnya searah `arah`: lebar = lebar·((s-ambang)/(1-ambang))^pangkat.
 * Ujung pita meruncing sendiri (s → ambang), jadi tampak seperti terminator lembut. Tanpa clipPath.
 */
function pitaTepi(p: T2[], lebar: number, arah: T2, ambang = 0.08, pangkat = 1): string {
  const n = p.length;
  if (n < 3 || lebar <= 0) return '';
  const tanda = luas(p) > 0 ? 1 : -1;
  const nor: T2[] = p.map((_, i) => {
    const a = p[(i - 1 + n) % n], b = p[(i + 1) % n];
    const t = normal2([b[0] - a[0], b[1] - a[1]]);
    return [tanda * t[1], -tanda * t[0]];
  });
  const s = nor.map((q) => q[0] * arah[0] + q[1] * arah[1]);
  const mulai = s.findIndex((v) => v <= ambang);
  const bagian: string[] = [];
  let run: number[] = [];
  const tutup = (): void => {
    if (run.length >= 3) {
      const luar = run.map((i) => p[i]);
      const dalam = run
        .map((i): T2 => {
          const g = Math.pow(jepit((s[i] - ambang) / (1 - ambang), 0, 1), pangkat) * lebar;
          return [p[i][0] - nor[i][0] * g, p[i][1] - nor[i][1] * g];
        })
        .reverse();
      bagian.push(poli([...luar, ...dalam], true, true));
    }
    run = [];
  };
  if (mulai < 0) {
    // seluruh tepi searah (jarang): pita penuh
    run = p.map((_, i) => i);
    tutup();
    return bagian.join('');
  }
  for (let k = 0; k <= n; k++) {
    const i = (mulai + k) % n;
    if (s[i] > ambang && k < n) run.push(i);
    else tutup();
  }
  return bagian.join('');
}

/** Potong poligon `subjek` dengan poligon cembung `pemotong` (Sutherland–Hodgman). Pengganti clipPath. */
function potong(subjek: T2[], pemotong: T2[]): T2[] {
  let keluar = subjek.slice();
  const tanda = luas(pemotong) > 0 ? 1 : -1;
  for (let i = 0; i < pemotong.length && keluar.length; i++) {
    const a = pemotong[i], b = pemotong[(i + 1) % pemotong.length];
    const dalam = (p: T2): boolean => tanda * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const potongGaris = (p: T2, q: T2): T2 => {
      const A1 = b[1] - a[1], B1 = a[0] - b[0], C1 = A1 * a[0] + B1 * a[1];
      const A2 = q[1] - p[1], B2 = p[0] - q[0], C2 = A2 * p[0] + B2 * p[1];
      const det = A1 * B2 - A2 * B1 || 1e-9;
      return [(B2 * C1 - B1 * C2) / det, (A1 * C2 - A2 * C1) / det];
    };
    const masuk = keluar;
    keluar = [];
    for (let j = 0; j < masuk.length; j++) {
      const cur = masuk[j], prev = masuk[(j - 1 + masuk.length) % masuk.length];
      if (dalam(cur)) {
        if (!dalam(prev)) keluar.push(potongGaris(prev, cur));
        keluar.push(cur);
      } else if (dalam(prev)) keluar.push(potongGaris(prev, cur));
    }
  }
  return keluar;
}

/** Selubung cembung (monotone chain). */
function selubung(p: T2[]): T2[] {
  const s = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const silang = (o: T2, a: T2, b: T2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const bawah: T2[] = [];
  for (const q of s) {
    while (bawah.length >= 2 && silang(bawah[bawah.length - 2], bawah[bawah.length - 1], q) <= 0) bawah.pop();
    bawah.push(q);
  }
  const atas: T2[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (atas.length >= 2 && silang(atas[atas.length - 2], atas[atas.length - 1], q) <= 0) atas.pop();
    atas.push(q);
  }
  return [...bawah.slice(0, -1), ...atas.slice(0, -1)];
}

const lingkaran = (c: T2, rx: number, ry = rx, n = 24): T2[] =>
  Array.from({ length: n }, (_, i): T2 => [c[0] + rx * Math.cos((i / n) * 2 * Math.PI), c[1] + ry * Math.sin((i / n) * 2 * Math.PI)]);

/** Pita lancip melalui titik (tebal per titik) → path tertutup (alis, garis kelopak, bibir tipis). */
function pita(p: T2[], tebal: number[]): string {
  const n = p.length;
  const kiri: T2[] = [];
  const kanan: T2[] = [];
  for (let i = 0; i < n; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
    const t = normal2([b[0] - a[0], b[1] - a[1]]);
    const h = tebal[i] / 2;
    kiri.push([p[i][0] - t[1] * h, p[i][1] + t[0] * h]);
    kanan.push([p[i][0] + t[1] * h, p[i][1] - t[0] * h]);
  }
  return halus([...kiri, ...kanan.reverse()], true);
}

// =================================================================================================================
// Warna (identitas Bu Rina tetap: kerudung bata, busana biru berlis jingga, bros kuning; krem = benang lis keliman)
// =================================================================================================================

export const WARNA_RINA = {
  garis: GARIS.warna,
  garisDalam: GARIS.dalam,
  kulit: '#e2a47c',
  kulitTerang: '#f4c6a2',
  kulitBawah: '#cc8a62',
  bayang: '#9a4a32',
  bayangTua: '#6b2c1e',
  pipi: '#e0735e',
  sorotKulit: BAYANG.sorot,
  bibir: '#b4655a',
  bibirTua: '#83392f',
  bibirTerang: '#e29b8d',
  alis: '#4a3027',
  iris: '#3a2217',
  irisTerang: '#8e5b37',
  pupil: '#130a07',
  sklera: '#f7eee6',
  gigi: '#fbf6ee',
  mulutDalam: '#57201c',
  kerudung: '#b95a43',
  kerudungTerang: '#dc8266',
  kerudungTua: '#8c3f2e',
  kerudungBayang: '#4f1b12',
  kerudungSorot: '#ffc9ae',
  ciput: '#6e2c20',
  blus: '#35607a',
  blusTerang: '#6390ab',
  blusTua: '#264a61',
  blusBayang: '#0f2233',
  blusSorot: '#d7ecf6',
  celemek: '#f4e4c4',
  celemekTerang: '#fbf1dc',
  celemekTua: '#d9c092',
  celemekBayang: '#8a6a3e',
  lis: '#e8833a',
  celana: '#474b58',
  celanaTerang: '#656b7b',
  celanaTua: '#30333d',
  celanaBayang: '#101218',
  sepatu: '#5d3b2a',
  sepatuTerang: '#8e6149',
  sepatuTua: '#3a2419',
  bros: '#f2c14e',
  brosTerang: '#fff0b8',
  brosTua: '#9c7419',
  fob: '#2b2a2e',
  besi: '#c8cdd2',
  besiTua: '#7a8288',
  lampu: '#f6c445',
  telepon: '#2b2f36',
  teleponLayar: '#44505c',
} as const;
const W = WARNA_RINA;

// =================================================================================================================
// Kuas: tebal garis, gradien berawalan id (atau warna datar bila `polos`)
// =================================================================================================================

class Kuas {
  readonly defs: string[] = [];
  private readonly ada = new Set<string>();
  /** Garis tepi badan & kepala (satuan dunia skala 1; versi kecil menebal). */
  readonly lg: number;
  readonly lgk: number;
  constructor(
    readonly id: string,
    readonly polos: boolean,
    readonly kecil: boolean,
  ) {
    this.lg = kecil ? 2.4 : 1.05;
    this.lgk = kecil ? 2.6 : 1.15;
  }
  /** Isi gradien linear kiri-atas (terang) → kanan-bawah (gelap). */
  grad(nama: string, terang: string, tengah: string, gelap: string): string {
    if (this.polos) return `fill="${tengah}"`;
    const gid = `${this.id}-${nama}`;
    if (!this.ada.has(gid)) {
      this.ada.add(gid);
      this.defs.push(
        `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${terang}"/><stop offset=".48" stop-color="${tengah}"/><stop offset="1" stop-color="${gelap}"/></linearGradient>`,
      );
    }
    return `fill="url(#${gid})"`;
  }
  /** Gradien di ruang kanvas (userSpaceOnUse): beberapa bentuk bersambung (lengan atas & bawah) berwarna sama di sambungan. */
  gradRuang(nama: string, a: T2, b: T2, terang: string, tengah: string, gelap: string): string {
    if (this.polos) return `fill="${tengah}"`;
    const gid = `${this.id}-${nama}`;
    if (!this.ada.has(gid)) {
      this.ada.add(gid);
      this.defs.push(
        `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"><stop offset="0" stop-color="${terang}"/><stop offset=".5" stop-color="${tengah}"/><stop offset="1" stop-color="${gelap}"/></linearGradient>`,
      );
    }
    return `fill="url(#${gid})"`;
  }
  tepi(w?: number, warna: string = W.garis): string {
    return `stroke="${warna}" stroke-width="${f(w ?? this.lg)}" stroke-linejoin="round"`;
  }
}

// =================================================================================================================
// Item gambar badan (dalam koordinat kanvas; dicerminkan sebelum diarsir bila menghadap kanan)
// =================================================================================================================

interface Arsir {
  /** [warna, lebar, opasitas] pita bayang (sisi menjauhi cahaya). */
  bayang?: [string, number, number][];
  /** [warna, lebar, opasitas] pita sorot (sisi menghadap cahaya). */
  sorot?: [string, number, number][];
  /** Pita tambahan dengan arah sendiri (mis. bawah kain). */
  pita?: { warna: string; lebar: number; op: number; arah: T2; ambang?: number }[];
}

type Item =
  | { k: 'bentuk'; p: T2[]; isi: (kuas: Kuas) => string; garis?: number | false; warnaGaris?: string; arsir?: Arsir; lurus?: boolean; garisTerbuka?: T2[] }
  | { k: 'garis'; p: T2[]; warna: string; tebal: number; op?: number; tutup?: boolean }
  | { k: 'isi'; p: T2[]; warna: string; op?: number; lurus?: boolean; bulat?: boolean }
  | { k: 'elips'; c: T2; rx: number; ry: number; warna: string; op?: number; sudut?: number; garis?: number }
  | { k: 'kepala' }
  | { k: 'svg'; s: string };

function geserItem(it: Item, dx: number, dy: number): Item {
  switch (it.k) {
    case 'bentuk':
      return { ...it, p: geser(it.p, dx, dy), ...(it.garisTerbuka ? { garisTerbuka: geser(it.garisTerbuka, dx, dy) } : {}) };
    case 'garis':
    case 'isi':
      return { ...it, p: geser(it.p, dx, dy) };
    case 'elips':
      return { ...it, c: [it.c[0] + dx, it.c[1] + dy] };
    default:
      return it;
  }
}

function cerminItem(it: Item, lebarKanvas: number): Item {
  const m = (p: T2[]): T2[] => p.map(([x, y]) => [lebarKanvas - x, y]);
  switch (it.k) {
    case 'bentuk':
      return { ...it, p: m(it.p), ...(it.garisTerbuka ? { garisTerbuka: m(it.garisTerbuka) } : {}) };
    case 'garis':
    case 'isi':
      return { ...it, p: m(it.p) };
    case 'elips':
      return { ...it, c: [lebarKanvas - it.c[0], it.c[1]], sudut: it.sudut ? -it.sudut : 0 };
    default:
      return it;
  }
}

function gambarItem(it: Item, kuas: Kuas): string {
  switch (it.k) {
    case 'bentuk': {
      const padat = it.lurus ? it.p : sampel(it.p, true, 3);
      const d = it.lurus ? poli(it.p) : halus(it.p, true);
      // garis tepi tertutup menempel di path isi (satu path, SVG lebih kecil); pita arsir menumpang di sisi dalamnya
      const tebalG = it.garis ? (kuas.kecil ? it.garis * 2.2 : it.garis) : undefined;
      const satuPath = it.garis !== false && !it.garisTerbuka;
      let s = jl(d, satuPath ? `${it.isi(kuas)} ${kuas.tepi(tebalG, it.warnaGaris)}` : it.isi(kuas));
      const a = it.arsir;
      if (a && !kuas.kecil) {
        for (const [w, l, op] of a.bayang ?? []) s += jl(pitaTepi(padat, l, ARAH_BAYANG), isi(w, op));
        for (const [w, l, op] of a.sorot ?? []) s += jl(pitaTepi(padat, l, ARAH_SOROT, 0.2), isi(w, op));
        for (const q of a.pita ?? []) s += jl(pitaTepi(padat, q.lebar, normal2(q.arah), q.ambang ?? 0.1), isi(q.warna, q.op));
      } else if (a && kuas.kecil) {
        // versi kecil: satu pita bayang saja (bentuk tetap terbaca tanpa rincian halus)
        const b = a.bayang?.[0];
        if (b) s += jl(pitaTepi(padat, b[1] * 1.3, ARAH_BAYANG), isi(b[0], b[2] * 1.4));
      }
      if (it.garis !== false && it.garisTerbuka) s += jl(it.lurus ? poli(it.garisTerbuka, false) : halus(it.garisTerbuka), `fill="none" ${kuas.tepi(tebalG, it.warnaGaris)}`);
      return s;
    }
    case 'garis':
      if (kuas.kecil && it.tebal < 1.2) return '';
      return jl(it.tutup ? halus(it.p, true) : halus(it.p), garis(it.warna, kuas.kecil ? it.tebal * 1.8 : it.tebal, it.op));
    case 'isi':
      // bulat = pita arsir lembut (lipatan) berpresisi 1 satuan: ± 0,5 px di panggung, SVG lebih kecil
      return jl(it.lurus ? poli(it.p, true, !!it.bulat) : halus(it.p, true), isi(it.warna, it.op));
    case 'elips':
      return elips(it.c, it.rx, it.ry, `${isi(it.warna, it.op)}${it.garis ? ` ${kuas.tepi(kuas.kecil ? it.garis * 2 : it.garis)}` : ''}`, it.sudut);
    case 'svg':
      return it.s;
    default:
      return '';
  }
}

// =================================================================================================================
// KEPALA: model 3D simetris (x ke kanan layar saat menghadap depan, y ke bawah, z ke arah kamera)
// Pusat (0,0) = pusat kepala (puncak kerudung ± -63, dagu 57.6). Satuan dunia skala 1.
// =================================================================================================================

/** Kedalaman profil wajah per y & setengah lebar wajah per y. */
const PROFIL_Z: [number, number][] = [[-36, 24], [-22, 31], [-6, 34], [6, 33], [20, 36], [30, 37], [40, 36], [50, 33], [58, 28], [66, 19]];
const PROFIL_X: [number, number][] = [[-36, 33], [-22, 38.5], [0, 41.5], [16, 41.5], [30, 39.6], [40, 36.2], [50, 29.6], [58, 20], [66, 9]];
/** Permukaan wajah z(x, y). */
function zWajah(x: number, y: number): number {
  const ax = tabel(PROFIL_X, y);
  const u = jepit(Math.abs(x) / ax, 0, 1);
  return tabel(PROFIL_Z, y) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.2))) - 4;
}
/** Tonjolan hidung (ditambahkan ke permukaan) di garis tengah. */
const TONJOL_HIDUNG: [number, number][] = [[-4, 0], [0, 2.4], [8, 4.6], [16, 7.6], [21, 10.4], [24, 9.4], [27, 3], [29, 0]];
function zHidung(x: number, y: number): number {
  const b = tabel(TONJOL_HIDUNG, y);
  const lebarH = y > 18 ? 8.5 : 5.5;
  const u = jepit(Math.abs(x) / lebarH, 0, 1);
  return zWajah(x, y) + b * (1 - u * u);
}
const p3 = (x: number, y: number, dz = 0): T3 => [x, y, zWajah(x, y) + dz];

/** Bukaan kerudung (tepi wajah), setengah kanan dari dahi-tengah ke dagu. */
const TEPI_KANAN: T2[] = [
  [0, -31], [12, -30], [22.5, -26], [30.5, -18.5], [35.6, -8], [38.2, 4], [38.4, 15], [36.8, 26], [33, 36.8], [26.8, 46], [18.4, 52.6], [8.8, 56.4], [0, 57.6],
];
/** Cincin penuh searah jarum jam: dahi → sisi kanan → dagu → sisi kiri. */
const CINCIN: T2[] = [...TEPI_KANAN, ...TEPI_KANAN.slice(1, -1).reverse().map(([x, y]): T2 => [-x, y])];
const I_DAGU = TEPI_KANAN.length - 1; // 12
const nCincin = CINCIN.length; // 24

interface Mata {
  dalam: T2;
  luar: T2;
  atas: T2[];
  bawah: T2[];
  iris: T2;
  r: number;
}
/** Mata kanan model (x > 0); kiri = cermin. */
const MATA: Mata = {
  dalam: [8.6, 6.0],
  luar: [24.6, 4.8],
  atas: [[11.2, 2.4], [14.6, 0.7], [18.4, 0.4], [21.9, 1.7]],
  bawah: [[11.6, 8.3], [15.4, 9.3], [19.3, 9.1], [22.6, 7.3]],
  iris: [16.8, 5.2],
  r: 4.35,
};
/** Alis kanan model: [x, y, tebal] dalam → luar. Alis alami cokelat tua: pangkal lembut, badan tipis-sedang, ekor meruncing. */
const ALIS: [number, number, number][] = [[6.4, -7.0, 2.3], [9.8, -8.8, 2.8], [14.4, -10.1, 2.9], [19.0, -10.4, 2.5], [23.4, -9.2, 1.7], [27.4, -6.8, 0.45]];

interface RautMulut {
  lebar: number;
  /** Naik (-) / turun (+) sudut bibir [kiri model, kanan model]. */
  sudut: [number, number];
  /** Geser garis tengah bibir (+ turun). */
  tengah: number;
  /** Bukaan tetap (tanpa bicara). */
  buka: number;
  gigi: number;
  atas: number;
  bawah: number;
  condong: number;
  jenis: 'biasa' | 'tawa' | 'tekan';
}
interface Raut {
  alisKiri: [T2, T2, T2];
  alisKanan: [T2, T2, T2];
  alisTebal: number;
  /** Kelopak atas turun (+) di tengah [kiri, kanan]; luar = turun di sisi luar (sedih); dalam = turun di sisi hidung (marah). */
  atas: [number, number];
  luar: number;
  dalam: number;
  /** Kelopak bawah naik (-). */
  bawah: number;
  bukaMata: number;
  iris: number;
  irisY: number;
  mulut: RautMulut;
  pipi: number;
  rona: number;
  miring: number;
  angguk: number;
  toleh: number;
  kerut: number;
  dahi: number;
  /** Bahu naik (-) / turun (+). */
  bahu: number;
  /** Pengali tambahan geser alis & kelopak atas di versi kecil (ekspresi yang di 32-52 px mirip ekspresi lain). */
  kecilAlis?: number;
  /**
   * Penyesuaian khusus versi kecil (potret <= 75 px): alisY = alis turun tambahan (satuan), atas/bawah = kelopak atas/
   * bawah PENGGANTI, sudut = sudut bibir pengganti (kedua sisi). Untuk pasangan yang mirip di potret kecil.
   */
  kecilTambah?: { alisY?: number; atas?: number; bawah?: number; sudut?: number };
}

const sama = (a: [T2, T2, T2]): { alisKiri: [T2, T2, T2]; alisKanan: [T2, T2, T2] } => ({ alisKiri: a, alisKanan: a });
const DASAR_MULUT: RautMulut = { lebar: 1, sudut: [0.5, 0.5], tengah: 0, buka: 0, gigi: 0, atas: 2.8, bawah: 4.2, condong: 0, jenis: 'biasa' };

/** Delapan ekspresi naskah. Pembeda utama = alis, kelopak, mulut, pipi, sikap kepala & bahu (bukan simbol). */
const RAUT: Record<Ekspresi, Raut> = {
  // Tenang tetapi lelah terburu-buru: sudut bibir sedikit turun, kelopak santai.
  netral: {
    ...sama([[0, 0], [0, 0], [0, 0]]),
    alisTebal: 1, atas: [0.5, 0.5], luar: 0.3, dalam: 0, bawah: 0, bukaMata: 1, iris: 1, irisY: 0,
    mulut: { ...DASAR_MULUT },
    pipi: 0.1, rona: 0.12, miring: 0, angguk: 0, toleh: 0, kerut: 0, dahi: 0, bahu: 0,
  },
  // Cemas: ujung dalam alis naik & mendekat, mata terbuka lebar (iris kecil), bibir ditekan turun, bahu naik.
  cemas: {
    ...sama([[1.3, -4.6], [0, -1.8], [0, 1.6]]),
    alisTebal: 0.95, atas: [-1.3, -1.3], luar: 0.9, dalam: -0.7, bawah: -0.3, bukaMata: 1.1, iris: 0.86, irisY: 0,
    mulut: { lebar: 0.8, sudut: [1.9, 1.9], tengah: 0.6, buka: 0, gigi: 0, atas: 2.2, bawah: 3.4, condong: 0, jenis: 'tekan' },
    pipi: 0, rona: 0, miring: -3, angguk: 3, toleh: 0, kerut: 0.8, dahi: 0.8, bahu: -7,
  },
  // Kesal: alis turun & mengumpul (V lembut), mata menyipit, bibir ditekan dengan satu sudut tertarik turun, pipi memerah.
  kesal: {
    ...sama([[1.6, 3.2], [0, 1.5], [0, -0.3]]),
    alisTebal: 1.04, atas: [1.9, 1.9], luar: 0, dalam: 1.5, bawah: -1.3, bukaMata: 0.93, iris: 1, irisY: 0,
    mulut: { lebar: 0.88, sudut: [2.6, 1.5], tengah: -0.4, buka: 0, gigi: 0, atas: 2.0, bawah: 3.7, condong: 0, jenis: 'tekan' },
    pipi: 0, rona: 0.32, miring: 2, angguk: -3, toleh: 0, kerut: 1, dahi: 0, bahu: -2,
  },
  // Bingung: satu alis naik tinggi, satu turun; satu mata menyipit; mulut miring ke satu sisi; kepala miring.
  bingung: {
    alisKiri: [[0.5, 1.9], [0, 1.6], [0, 0.8]],
    alisKanan: [[0, -3.2], [0, -5.2], [0, -3.4]],
    alisTebal: 1, atas: [1.7, -0.9], luar: 0, dalam: 0, bawah: -0.4, bukaMata: 1, iris: 0.95, irisY: -1.1,
    mulut: { lebar: 0.82, sudut: [1.7, -1.1], tengah: 0.2, buka: 0, gigi: 0, atas: 2.4, bawah: 3.8, condong: 2.4, jenis: 'biasa' },
    pipi: 0.1, rona: 0.06, miring: 8, angguk: 0, toleh: 4, kerut: 0.35, dahi: 0.4, bahu: 0,
  },
  // Lega: kelopak turun lembut, alis dalam sedikit naik, senyum kecil dengan bibir sedikit terbuka (menghela), bahu turun.
  lega: {
    ...sama([[0.4, -2.3], [0, -1.1], [0, 0.6]]),
    alisTebal: 0.95, atas: [2.9, 2.9], luar: 0.6, dalam: 0, bawah: -0.8, bukaMata: 1, iris: 1, irisY: 0,
    mulut: { lebar: 1.1, sudut: [-2.5, -2.5], tengah: 0.2, buka: 1.7, gigi: 0.6, atas: 2.6, bawah: 4.2, condong: 0, jenis: 'biasa' },
    pipi: 0.5, rona: 0.2, miring: 4, angguk: -4, toleh: 0, kerut: 0, dahi: 0, bahu: 6,
  },
  // Senang: tawa terbuka memperlihatkan gigi atas, mata tersenyum (kelopak bawah naik), pipi naik & merona.
  senang: {
    ...sama([[0, -2.6], [0, -2.9], [0, -1.6]]),
    alisTebal: 1, atas: [0.9, 0.9], luar: 0, dalam: 0, bawah: -2.7, bukaMata: 0.95, iris: 1, irisY: 0,
    mulut: { lebar: 1.14, sudut: [-3.7, -3.7], tengah: 0.6, buka: 8, gigi: 3.4, atas: 2.4, bawah: 3.4, condong: 0, jenis: 'tawa' },
    pipi: 1, rona: 0.36, miring: 5, angguk: -2, toleh: 0, kerut: 0, dahi: 0, bahu: -3,
  },
  // Serius: alis datar sedikit turun, mata fokus, bibir garis tegas, kepala sedikit maju.
  serius: {
    ...sama([[1, 1.8], [0, 1.3], [0, 0.4]]),
    alisTebal: 1, atas: [1.2, 1.2], luar: 0, dalam: 0.5, bawah: -0.5, bukaMata: 0.97, iris: 1, irisY: 0,
    mulut: { lebar: 0.94, sudut: [0.9, 0.9], tengah: 0, buka: 0, gigi: 0, atas: 2.1, bawah: 3.7, condong: 0, jenis: 'tekan' },
    pipi: 0, rona: 0, miring: -2, angguk: 4, toleh: 0, kerut: 0.5, dahi: 0, bahu: 0, kecilAlis: 1.6,
    kecilTambah: { alisY: 1.5, sudut: 0.2 },
  },
  // Tersenyum: senyum tertutup lebar, mata lembut (kelopak bawah naik), pipi naik, kepala sedikit miring.
  tersenyum: {
    ...sama([[0, -1.3], [0, -1.3], [0, -0.4]]),
    alisTebal: 1, atas: [0.6, 0.6], luar: 0, dalam: 0, bawah: -1.9, bukaMata: 1, iris: 1, irisY: 0,
    mulut: { lebar: 1.08, sudut: [-3.1, -3.1], tengah: 0.4, buka: 0, gigi: 0, atas: 2.7, bawah: 4.3, condong: 0, jenis: 'biasa' },
    pipi: 0.8, rona: 0.28, miring: 5, angguk: 0, toleh: 0, kerut: 0, dahi: 0, bahu: 0,
    kecilTambah: { atas: 0, bawah: -1 },
  },
};

interface Pandang {
  toleh: number;
  angguk: number;
  /** Geser iris (fraksi lebar mata, - = ke kiri layar). */
  iris: number;
  irisY: number;
  kelopak: number;
}
/** Arah pandang untuk badan menghadap KIRI (ke meja/Miss Raksa) dan KANAN (ke pintu, berdiri-pergi). */
const PANDANG_KIRI: Record<ArahPandang, Pandang> = {
  lawan: { toleh: -34, angguk: 1, iris: -0.26, irisY: 0.2, kelopak: 0 },
  pemain: { toleh: -13, angguk: 0, iris: -0.16, irisY: 0, kelopak: 0 },
  bawah: { toleh: -24, angguk: 15, iris: -0.06, irisY: 1.7, kelopak: 2.4 },
  depan: { toleh: -22, angguk: 0, iris: 0.02, irisY: 0, kelopak: 0 },
};
const PANDANG_KANAN: Record<ArahPandang, Pandang> = {
  depan: { toleh: 36, angguk: 0, iris: 0.14, irisY: 0, kelopak: 0 },
  lawan: { toleh: -8, angguk: 0, iris: -0.3, irisY: 0, kelopak: 0 },
  pemain: { toleh: 8, angguk: 0, iris: -0.2, irisY: 0, kelopak: 0 },
  bawah: { toleh: 28, angguk: 15, iris: 0.06, irisY: 1.7, kelopak: 2.4 },
};

type Proyeksi = (p: T3) => T2;
function buatProyeksi(toleh: number, angguk: number): Proyeksi {
  const t = toleh * RAD, a = angguk * RAD;
  const ct = Math.cos(t), st = Math.sin(t), ca = Math.cos(a), sa = Math.sin(a);
  return ([x, y, z]) => {
    const xp = x * ct + z * st;
    const zp = -x * st + z * ct;
    return [xp, y * ca + (zp - 20) * sa];
  };
}

/**
 * Skala kepala terhadap kanvas: wajah dibingkai kerudung (tepi pipi tertutup kain), jadi model sedikit diperbesar
 * supaya lebar wajah TERLIHAT setara Miss Raksa pada skala panggung yang sama (tinggi puncak kerudung → dagu ± 130).
 */
const SKALA_KEPALA = 1.06;
const skalaK = (q: T2): T2 => [q[0] * SKALA_KEPALA, q[1] * SKALA_KEPALA];

/** Titik putar miring kepala (pangkal leher, lokal). */
const PUTAR_LEHER: T2 = [0, 52];

interface HasilKepala {
  /** Wajah + tepi kerudung di sekitar wajah (lokal, sudah diputar miring). */
  svg: string;
  /** Busur kubah kerudung dari sisi kiri layar melewati puncak ke sisi kanan (lokal, sudah diputar). */
  kubah: T2[];
  /** Titik bawah dagu (lokal, sudah diputar). */
  dagu: T2;
  /** Titik "telinga" sisi dekat (untuk telepon), lokal. */
  telinga: T2;
}

interface OpsiKepala {
  kuas: Kuas;
  raut: Raut;
  pd: Pandang;
  bicara: boolean;
  kedip: boolean;
  /** Miring tambahan dari pose (derajat). */
  miringPose: number;
}

/**
 * Ukuran kubah kerudung (elipsoid kepala + volume rambut di dalamnya). `hAtas` = setengah tinggi bagian atas (puncak
 * 4,5 satuan lebih rendah dari `h`: kain mengikuti tengkorak bulat, bukan puncak lancip).
 */
const KUBAH = { c: [0, -5, -16] as T3, a: 53, c3: 58, h: 51, hAtas: 46.5 };

function busurKubah(P: Proyeksi, toleh: number): T2[] {
  const c = P(KUBAH.c);
  const t = toleh * RAD;
  const w = Math.sqrt(KUBAH.a ** 2 * Math.cos(t) ** 2 + KUBAH.c3 ** 2 * Math.sin(t) ** 2);
  const out: T2[] = [];
  for (let phi = 150; phi <= 390; phi += 8) {
    const a = phi * RAD;
    // puncak sedikit rata (kain ditarik ke belakang), belakang kepala (sisi menjauhi wajah) sedikit lebih penuh
    const sisiBelakang = Math.cos(a) * Math.sign(-toleh || 1) > 0 ? 1.04 : 1;
    // elips biasa: puncak bulat mengikuti tengkorak (bukan kotak/helm)
    const ca = Math.cos(a), sa = Math.sin(a);
    const eks = 1;
    const x = Math.sign(ca) * Math.pow(Math.abs(ca), eks);
    const y = Math.sign(sa) * Math.pow(Math.abs(sa), eks);
    out.push([c[0] + w * x * sisiBelakang, c[1] + (y < 0 ? KUBAH.hAtas : KUBAH.h) * y]);
  }
  return out;
}

/**
 * Versi kecil (potret 32–52 px): raut dilebihkan supaya perbedaan ekspresi tetap terbaca saat wajah hanya 11–18 px
 * (alis & kelopak bergeser lebih jauh, sudut bibir lebih jelas, kepala lebih miring). Bentuk dasar wajah sama.
 */
function rautKecil(r: Raut): Raut {
  const kali = (a: [T2, T2, T2], k: number): [T2, T2, T2] => a.map(([x, y]) => [x * k, y * k]) as [T2, T2, T2];
  return {
    ...r,
    alisKiri: kali(r.alisKiri, 1.6 * (r.kecilAlis ?? 1)),
    alisKanan: kali(r.alisKanan, 1.6 * (r.kecilAlis ?? 1)),
    atas: [r.atas[0] * 1.3 * (r.kecilAlis ?? 1), r.atas[1] * 1.3 * (r.kecilAlis ?? 1)],
    luar: r.luar * 1.4,
    dalam: r.dalam * 1.5,
    bawah: r.bawah * 1.3,
    bukaMata: 1 + (r.bukaMata - 1) * 1.6,
    mulut: { ...r.mulut, sudut: [r.mulut.sudut[0] * 1.45, r.mulut.sudut[1] * 1.45], buka: r.mulut.buka * 1.15, lebar: 1 + (r.mulut.lebar - 1) * 1.5 },
    miring: r.miring * 1.3,
    ...tambahKecil(r),
  };
}

/** Penggantian versi kecil dari `Raut.kecilTambah` (dipanggil sesudah pengali umum rautKecil). */
function tambahKecil(r: Raut): Partial<Raut> {
  const t = r.kecilTambah;
  if (!t) return {};
  const k = 1.6 * (r.kecilAlis ?? 1);
  const turun = (a: [T2, T2, T2]): [T2, T2, T2] => a.map(([x, y]) => [x * k, y * k + (t.alisY ?? 0)]) as [T2, T2, T2];
  const hasil: Partial<Raut> = {};
  if (t.alisY) {
    hasil.alisKiri = turun(r.alisKiri);
    hasil.alisKanan = turun(r.alisKanan);
  }
  if (t.atas !== undefined) hasil.atas = [t.atas, t.atas];
  if (t.bawah !== undefined) hasil.bawah = t.bawah;
  if (t.sudut !== undefined) {
    const m = r.mulut;
    hasil.mulut = { ...m, sudut: [t.sudut, t.sudut], buka: m.buka * 1.15, lebar: 1 + (m.lebar - 1) * 1.5 };
  }
  return hasil;
}

function gambarKepala(o: OpsiKepala): HasilKepala {
  const { kuas, pd } = o;
  const k = kuas.kecil;
  const r = k ? rautKecil(o.raut) : o.raut;
  const toleh = pd.toleh + r.toleh * Math.sign(pd.toleh || -1);
  const P = buatProyeksi(toleh, pd.angguk + r.angguk);
  const lg = kuas.lgk;
  const out: string[] = [];
  /** Sisi jauh model: tanda x yang searah pergeseran hidung. */
  const sJauh = toleh < 0 ? -1 : 1;

  // ---- tepi wajah: bukaan kerudung (sisi dekat) + siluet pipi (sisi jauh) -----------------------------------------
  const tepi: T2[] = CINCIN.map(([x, y]) => {
    const q = P(p3(x, y));
    if (x * sJauh > 0 && Math.abs(toleh) > 4) {
      // siluet permukaan pipi di sisi jauh bisa melewati tepi kain
      let ekstrem = q[0];
      for (let s = 0.35; s <= 1.001; s += 0.08) {
        const c = P(p3(x * s, y));
        if ((c[0] - ekstrem) * sJauh > 0) ekstrem = c[0];
      }
      return [ekstrem, q[1]];
    }
    return q;
  });
  const tepiPadat = sampel(tepi, true, 4);
  const dWajah = halus(tepi, true);

  // ---- kulit -------------------------------------------------------------------------------------------------
  out.push(jl(dWajah, kuas.grad('kulit', W.kulitTerang, W.kulit, W.kulitBawah)));
  const bw: string[] = [];
  // Terminator: sisi kanan layar wajah (bidang samping saat menoleh kiri; bidang depan menjauhi cahaya saat menoleh kanan).
  const lebarTerm = toleh < 0 ? 6 + Math.abs(toleh) * 0.28 : 9 + toleh * 0.34;
  const arahTerm = normal2([1, 0.28]);
  if (!k) bw.push(jl(pitaTepi(tepiPadat, lebarTerm * 1.5, arahTerm, 0.12), isi(W.bayang, 0.06)));
  bw.push(jl(pitaTepi(tepiPadat, lebarTerm, arahTerm, 0.12), isi(W.bayang, 0.07)));
  bw.push(jl(pitaTepi(tepiPadat, lebarTerm * 0.55, arahTerm, 0.12), isi(W.bayang, 0.08)));
  // Bawah rahang & dagu (menghadap ke bawah).
  bw.push(jl(pitaTepi(tepiPadat, 7, [0.15, 1], 0.35), isi(W.bayang, 0.1)));
  // Bayang kain di dahi (tepi kerudung menaungi dahi).
  bw.push(jl(pitaTepi(tepiPadat, 7, [0, -1], 0.3), isi(W.bayangTua, 0.1)));
  bw.push(jl(pitaTepi(tepiPadat, 4, [0, -1], 0.3), isi(W.bayangTua, 0.1)));
  // Sorot: dahi kiri-atas, tulang pipi kiri (menghadap cahaya), batang hidung, dagu.
  const sorot = (c: T2, rx: number, ry: number, op: number, sudut = 0): void => {
    bw.push(elips(c, rx, ry, isi(W.sorotKulit, op * 0.45), sudut), elips(c, rx * 0.66, ry * 0.66, isi(W.sorotKulit, op * 0.45), sudut), elips(c, rx * 0.36, ry * 0.36, isi(W.sorotKulit, op * 0.4), sudut));
  };
  const naik = -2.4 * r.pipi;
  if (!k) {
    sorot(P(p3(-8, -18)), 15, 8, 0.55, -8);
    sorot(P(p3(-22, 15 + naik)), 8, 5.5, 0.4 + 0.3 * r.pipi, -20);
    sorot(P(p3(-1, 54)), 6, 3.2, 0.45);
  }
  // Rona pipi (tumpuk elips, tanpa gradien).
  const rona = (c: T2, rx: number, ry: number, op: number): void => {
    if (op <= 0) return;
    bw.push(elips(c, rx, ry, isi(W.pipi, op * 0.35)), elips(c, rx * 0.7, ry * 0.7, isi(W.pipi, op * 0.35)), elips(c, rx * 0.42, ry * 0.42, isi(W.pipi, op * 0.3)));
  };
  const ronaOp = r.rona + 0.08;
  rona(P(p3(-21, 22 + naik)), 9.5, 6.5, ronaOp);
  rona(P(p3(21, 22 + naik)), 9.5, 6.5, ronaOp * 0.9);
  if (!k) {
    // Rongga mata (di bawah alis, gelap di pangkal hidung).
    for (const s of [-1, 1]) {
      const rongga = [p3(s * 6, -4), p3(s * 13, -6.5), p3(s * 21, -6), p3(s * 27, -2.5), p3(s * 24, 3), p3(s * 15, 0), p3(s * 8.5, 4)].map(P);
      bw.push(jl(halus(rongga, true), isi(W.bayang, s === 1 ? 0.1 : 0.08)));
      bw.push(jl(halus([p3(s * 5.5, -2), p3(s * 8.5, -1), p3(s * 9.5, 5), p3(s * 6.5, 7)].map(P), true), isi(W.bayang, 0.1)));
    }
    // Bidang samping hidung (sisi kanan model menghadap kanan-layar saat menoleh kiri → bayang).
    if (toleh < 6) {
      const sisi: T3[] = [[1.4, -1, zHidung(1.4, -1)], [2.2, 10, zHidung(2.2, 10)], [3.2, 19, zHidung(3.2, 19)], [6.8, 22.2, zHidung(6.8, 22.2)], [8.6, 16, zWajah(8.6, 16) + 1], [6.2, 5, zWajah(6.2, 5) + 1.5], [4.8, -1, zWajah(4.8, -1) + 2]];
      bw.push(jl(halus(sisi.map(P), true), isi(W.bayang, 0.15)));
    } else {
      const sisi: T3[] = [[-1.4, -1, zHidung(-1.4, -1)], [-2.2, 10, zHidung(-2.2, 10)], [-3.2, 19, zHidung(-3.2, 19)], [-5.4, 22, zHidung(-5.4, 22)], [-6.6, 15, zWajah(-6.6, 15) + 1], [-4.8, 3, zWajah(-4.8, 3) + 1.5]];
      bw.push(jl(halus(sisi.map(P), true), isi(W.bayang, 0.05)));
    }
    // Bayang jatuh ujung hidung ke bibir atas (kanan bawah).
    bw.push(jl(halus([[-3, 27], [3.5, 26.6], [10, 28.4], [6.5, 31.4], [-0.5, 30.6]].map(([x, y]): T2 => P(p3(x, y, 1))), true), isi(W.bayang, 0.2)));
    // Bawah bibir & lekuk dagu.
    bw.push(jl(halus([[-7.5, 46.2], [0.5, 47.8], [8.5, 46.2], [4.5, 50.5], [-4, 50.5]].map(([x, y]): T2 => P(p3(x, y))), true), isi(W.bayang, 0.14)));
    // Pipi bawah menjauhi cahaya (sisi kanan layar).
    bw.push(jl(halus([[16, 28], [26, 30], [30, 38], [22, 46], [16, 40]].map(([x, y]): T2 => P(p3(x * -sJauh * -1, y))), true), isi(W.bayang, 0.05)));
  }
  // Sorot batang & ujung hidung (sisi kiri model menghadap cahaya).
  if (!k) {
    bw.push(jl(halus([[-1.4, 3], [-1.1, 12], [-1.6, 18.5], [-2.4, 12]].map(([x, y]): T2 => P([x, y, zHidung(x, y) + 0.5])), true), isi(W.sorotKulit, 0.22)));
    const ujung = P([-1.8, 21.5, zHidung(-1.8, 21.5) + 0.5]);
    bw.push(elips(ujung, 1.7, 1.2, isi(W.sorotKulit, 0.4)));
  }
  out.push(bw.join(''));

  // ---- garis usia halus: lipatan senyum (nasolabial) & bawah mata ------------------------------------------------
  if (!k) {
    for (const s of [-1, 1]) {
      const opLipat = 0.07 + 0.22 * r.pipi;
      out.push(jl(halus([[s * 8.8, 26.4], [s * 12.6, 32.4], [s * 15.4, 40.6]].map(([x, y]): T2 => P(p3(x, y)))), garis(W.bayang, 0.95, opLipat)));
      out.push(jl(halus([[s * 11.4, 11.6], [s * 17, 13.1], [s * 22.6, 11]].map(([x, y]): T2 => P(p3(x, y)))), garis(W.bayang, 0.55, 0.06 + 0.08 * Math.max(0, -r.bawah / 2.7))));
    }
    if (r.kerut > 0) {
      out.push(jl(halus([P(p3(-3.2, -6.5)), P(p3(-2.6, -1.8))]), garis(W.bayang, 0.9, 0.4 * r.kerut)));
      out.push(jl(halus([P(p3(3, -6.5)), P(p3(2.4, -1.8))]), garis(W.bayang, 0.9, 0.35 * r.kerut)));
    }
    if (r.dahi > 0) {
      out.push(jl(halus([[-14, -19.5], [-6, -21], [4, -21], [14, -19.5]].map(([x, y]): T2 => P(p3(x, y)))), garis(W.bayang, 0.7, 0.2 * r.dahi)));
    }
  }

  // ---- hidung (garis) --------------------------------------------------------------------------------------
  const gh = k ? 1.6 : 0.8;
  const xS = sJauh; // sisi siluet hidung
  const xD = -sJauh;
  const Ph = (x: number, y: number, dz = 0): T2 => P([x, y, zHidung(x, y) + dz]);
  // garis siluet batang hidung (sisi jauh) — hanya bagian bawah, lembut
  out.push(jl(halus([Ph(xS * 2.4, 9), Ph(xS * 3.2, 16), Ph(xS * 3.9, 21.2), Ph(xS * 3.6, 24.2)]), garis(W.garisDalam, gh, k ? 0.8 : 0.55)));
  // cuping dekat (sayap hidung) + bawah ujung
  out.push(jl(halus([Ph(xD * 5.6, 21.2), Ph(xD * 7.8, 23.4), Ph(xD * 7.6, 26), Ph(xD * 4.9, 27)]), garis(W.garisDalam, gh, 0.75)));
  if (!k) out.push(jl(halus([Ph(xS * 2.8, 26.6), Ph(0, 27.2), Ph(xD * 2.6, 27.1)]), garis(W.garisDalam, 0.6, 0.45)));
  // lubang hidung
  out.push(
    jl(halus([Ph(xD * 2.2, 26), Ph(xD * 4.2, 25.4), Ph(xD * 5.6, 26.4), Ph(xD * 3.8, 27.1)], true), isi(W.bayangTua, 0.6)),
    jl(halus([Ph(xS * 1.6, 26.2), Ph(xS * 3, 25.8), Ph(xS * 3.6, 26.6), Ph(xS * 2.4, 27)], true), isi(W.bayangTua, 0.45)),
  );

  // ---- mulut -------------------------------------------------------------------------------------------------
  out.push(gambarMulut(P, r.mulut, o.bicara, kuas));

  // ---- mata & alis -------------------------------------------------------------------------------------------
  for (const s of [-1, 1] as const) out.push(gambarMata(P, s, r, pd, o.kedip, kuas));
  for (const s of [-1, 1] as const) out.push(gambarAlis(P, s, r, kuas));

  // ---- garis tepi wajah: sisi dekat (bertemu kain) garis dalam, siluet sisi jauh garis luar -----------------------
  out.push(jl(dWajah, garis(W.garisDalam, lg * 0.85, 0.9)));
  const idxJauh = CINCIN.map(([x], i) => (x * sJauh > 2 ? i : -1)).filter((i) => i >= 0);
  if (idxJauh.length > 2) {
    const urut = idxJauh.map((i) => tepi[i]);
    out.push(jl(halus(urut), garis(W.garis, lg)));
  }

  // ---- tepi kerudung di sekeliling wajah: ciput tipis di dahi + lipatan tepi kain (menutup tepi wajah) ----------
  const tepiKain: T2[] = CINCIN.map(([x, y]) => P(p3(x, y)));
  const cx = tepiKain.reduce((a, q) => a + q[0], 0) / nCincin;
  const cy = tepiKain.reduce((a, q) => a + q[1], 0) / nCincin;
  const keluar = (q: T2, d: number): T2 => {
    const v = normal2([q[0] - cx, (q[1] - cy) * 0.9]);
    return [q[0] + v[0] * d, q[1] + v[1] * d];
  };
  // indeks: pelipis jauh → atas → sisi dekat sampai rahang dekat
  const iJauhPelipis = sJauh < 0 ? nCincin - 3 : 3; // (-30.5,-18.5) atau (30.5,-18.5)
  const urutTepi: number[] = [];
  if (sJauh < 0) {
    for (let i = iJauhPelipis; i < nCincin; i++) urutTepi.push(i);
    for (let i = 0; i <= 8; i++) urutTepi.push(i);
  } else {
    for (let i = iJauhPelipis; i >= 0; i--) urutTepi.push(i);
    for (let i = nCincin - 1; i >= nCincin - 8; i--) urutTepi.push(i);
  }
  const garisTepi = urutTepi.map((i) => tepiKain[i]);
  // ciput: garis tipis gelap di dahi, di bawah pet kerudung
  const iCiput = urutTepi.slice(0, 7);
  const ciputLuar = iCiput.map((i) => tepiKain[i]);
  const ciputDalam = iCiput.map((i, j) => keluar(tepiKain[i], -(1.4 + 1.6 * Math.sin((Math.PI * j) / 6)))).reverse();
  out.push(jl(halus([...ciputLuar, ...ciputDalam], true), isi(W.ciput)));
  // pet/tepi kerudung: tebal di dahi (± 5), menipis di pipi, habis di rahang dekat
  const nT = garisTepi.length;
  const tebalTepi = (j: number): number => (j <= 6 ? 4.6 + 1.4 * Math.sin((Math.PI * j) / 6) : lerp(4.6, 1.2, (j - 6) / Math.max(1, nT - 7)));
  const kainDalam = garisTepi.map((q, j) => keluar(q, j <= 6 ? -0.6 : 0.4));
  const kainLuar = garisTepi.map((q, j) => keluar(q, tebalTepi(j))).reverse();
  const dKain = halus([...kainDalam, ...kainLuar], true);
  out.push(jl(dKain, kuas.grad('krd-tepi', W.kerudungTerang, W.kerudung, W.kerudungTua)));
  if (!k) {
    out.push(jl(pitaTepi(sampel([...kainDalam, ...kainLuar], true, 4), 2.4, ARAH_BAYANG, 0.1), isi(W.kerudungBayang, 0.18)));
    out.push(jl(halus(garisTepi.slice(1, 9).map((q, j) => keluar(q, 1.6 + 0.4 * Math.sin((Math.PI * j) / 7)))), garis(W.kerudungSorot, 1, 0.15)));
  }
  out.push(jl(dKain, `fill="none" ${kuas.tepi(lg * 0.8)}`));

  const miring = r.miring + o.miringPose;
  const rot = (q: T2): T2 => putar(q, PUTAR_LEHER, miring);
  const svg = `<g transform="rotate(${f(miring)} ${pt(PUTAR_LEHER)})">${out.join('')}</g>`;
  const kubah = busurKubah(P, toleh).map(rot).map(skalaK);
  const dagu = skalaK(rot(P(p3(0, 57.6))));
  const telinga = skalaK(rot(P([-sJauh * 40, 8, -2])));
  return { svg, kubah, dagu, telinga };
}

/**
 * Turun kelopak atas di tengah mata (raut + arah pandang). Pandang BAWAH (isyarat kartu): dibatasi ± separuh bukaan
 * mata supaya iris tetap tampak di bawah kelopak — lega/kesal + bawah tidak terbaca tertidur di HP.
 */
const BATAS_KELOPAK_BAWAH = 3.4;
function turunKelopak(r: Raut, pd: Pandang, iSisi: number): number {
  const v = r.atas[iSisi] + pd.kelopak;
  return pd.kelopak > 0 ? Math.min(v, BATAS_KELOPAK_BAWAH) : v;
}

function gambarMata(P: Proyeksi, s: -1 | 1, r: Raut, pd: Pandang, kedip: boolean, kuas: Kuas): string {
  const k = kuas.kecil;
  const out: string[] = [];
  const iSisi = s < 0 ? 0 : 1;
  const turunA = turunKelopak(r, pd, iSisi);
  const m = (q: T2, dz = -1.5): T2 => P(p3(s * q[0], q[1], dz));
  // kelopak atas: dalam → luar (t 0 → 1)
  const n = MATA.atas.length;
  const cyMata = (MATA.dalam[1] + MATA.luar[1]) / 2;
  const atas: T2[] = MATA.atas.map((q, i) => {
    const t = (i + 1) / (n + 1);
    const tengah = 1 - Math.abs(t - 0.5) * 1.1;
    const dy = turunA * tengah + r.luar * t * 1.2 + r.dalam * (1 - t) * 1.2;
    const y = cyMata + (q[1] - cyMata) * r.bukaMata + dy;
    return m([q[0], y]);
  });
  const bawah: T2[] = MATA.bawah.map((q, i) => {
    const t = (i + 1) / (MATA.bawah.length + 1);
    const tengah = 1 - Math.abs(t - 0.5) * 1.3;
    let y = cyMata + (q[1] - cyMata) * r.bukaMata + r.bawah * tengah;
    const yAtas = MATA.atas[Math.min(i, n - 1)][1] + turunA * tengah;
    y = Math.max(y, yAtas + 1.2);
    return m([q[0], y]);
  });
  const dalam = m(MATA.dalam), luar = m(MATA.luar);
  // skala versi kecil (mata lebih besar supaya terbaca)
  const pusat: T2 = [(dalam[0] + luar[0]) / 2, (dalam[1] + luar[1]) / 2];
  const sk = k ? 1.32 : 1.08;
  const S = (q: T2): T2 => [pusat[0] + (q[0] - pusat[0]) * sk, pusat[1] + (q[1] - pusat[1]) * sk];
  // urutan kiri-layar → kanan-layar
  const kiriKe = dalam[0] > luar[0]; // sudut dalam di kanan layar
  const gA: T2[] = (kiriKe ? [luar, ...atas.slice().reverse(), dalam] : [dalam, ...atas, luar]).map(S);
  const gB: T2[] = (kiriKe ? [dalam, ...bawah, luar] : [luar, ...bawah.slice().reverse(), dalam]).map(S);
  const lebar = Math.abs(dalam[0] - luar[0]) * sk;
  const tebalLid = (k ? 2.3 : 1.25);

  if (kedip) {
    const tutup: T2[] = gA.map(([x, y], i) => {
      const b = gB[gB.length - 1 - i] ?? gB[0];
      return [x, lerp(y, b[1], 0.7)];
    });
    tutup[0] = gA[0];
    tutup[tutup.length - 1] = gA[gA.length - 1];
    out.push(jl(rangkai([gA, gB]), isi(W.kulit)));
    out.push(jl(rangkai([gA, tutup.slice().reverse()]), isi(W.bayang, 0.16)));
    out.push(jl(halus(tutup), garis(W.garis, tebalLid)));
    if (!k) out.push(jl(halus(gA.slice(1, -1).map(([x, y]): T2 => [x, y - 1.2])), garis(W.garisDalam, 0.6, 0.45)));
    return out.join('');
  }

  const dBuka = rangkai([gA, gB]);
  // sklera
  out.push(jl(dBuka, isi(W.sklera)));
  const bukaPadat = selubung([...sampel(gA, false, 4), ...sampel(gB, false, 4)]);
  // bayang sudut mata (bola mata membulat)
  if (!k) {
    out.push(jl(poli(potong(lingkaran(gA[0], lebar * 0.28, lebar * 0.2, 12), bukaPadat)), isi('#b89184', 0.35)));
    out.push(jl(poli(potong(lingkaran(gA[gA.length - 1], lebar * 0.28, lebar * 0.2, 12), bukaPadat)), isi('#b89184', 0.3)));
  }
  // iris & pupil (dipotong bukaan mata tanpa clipPath)
  const ip = m(MATA.iris, 0.5);
  const cMata = m([(MATA.dalam[0] + MATA.luar[0]) / 2, cyMata]);
  const ix = pusat[0] + (ip[0] - cMata[0]) * 0.4 + lebar * pd.iris;
  const iy = S(ip)[1] + pd.irisY + r.irisY;
  const lebarModel = Math.abs(MATA.luar[0] - MATA.dalam[0]);
  const ry = MATA.r * sk * r.iris * (k ? 1.08 : 1);
  const rx = ry * jepit(0.45 + 0.55 * (lebar / sk / lebarModel), 0.5, 1);
  const irisP = potong(lingkaran([ix, iy], rx, ry, 28), bukaPadat);
  out.push(jl(poli(irisP), isi(W.iris)));
  if (!k) out.push(jl(poli(potong(lingkaran([ix + rx * 0.18, iy + ry * 0.35], rx * 0.62, ry * 0.45, 20), bukaPadat)), isi(W.irisTerang, 0.55)));
  out.push(jl(poli(potong(lingkaran([ix, iy], rx * 0.46, ry * 0.46, 16), bukaPadat)), isi(W.pupil)));
  // bayang kelopak atas di bola mata
  const bandAtas = [...gA, ...gA.map(([x, y]): T2 => [x, y + (k ? 1.6 : 2)]).reverse()];
  out.push(jl(poli(potong(sampel(bandAtas, true, 3), bukaPadat)), isi('#4a2a20', 0.38)));
  // kilau
  const kilau: T2 = [ix - rx * 0.38, iy - ry * 0.34];
  out.push(`<circle cx="${f(kilau[0])}" cy="${f(kilau[1])}" r="${f(k ? 1.25 : 0.95)}" fill="#fff" fill-opacity=".95"/>`);
  // garis kelopak atas (bulu mata alami, sedikit menebal ke luar) — tanpa sayap eyeliner
  const nA = gA.length;
  const tebal = gA.map((_, i) => {
    const t = kiriKe ? 1 - i / (nA - 1) : i / (nA - 1); // 1 = sisi luar
    return tebalLid * (0.55 + 0.6 * t);
  });
  out.push(jl(pita(gA, tebal), isi(W.garis)));
  // lipatan kelopak (kelopak ganda) + sedikit berat di sisi luar (usia)
  if (!k) {
    const lipat = gA.map(([x, y], i): T2 => {
      const t = kiriKe ? 1 - i / (nA - 1) : i / (nA - 1);
      return [x, y - 2.4 - 0.6 * Math.sin(Math.PI * t) + (r.luar > 0 ? t * 0.6 : 0)];
    });
    out.push(jl(halus(lipat.slice(1, -1)), garis(W.garisDalam, 0.7, 0.55)));
    out.push(jl(rangkai([gA.slice(1, -1), lipat.slice(1, -1).reverse()]), isi(W.bayang, 0.1)));
    // bulu mata halus di sisi luar
    const iL = kiriKe ? 0 : nA - 1;
    const arah = kiriKe ? -1 : 1;
    const [lx, ly] = gA[iL];
    const [lx2, ly2] = gA[kiriKe ? 1 : nA - 2];
    out.push(jl(`M${pt([lx, ly])} q${f(arah * 1.2)} ${f(-1)} ${f(arah * 2.4)} ${f(-1.1)}M${pt([lx2, ly2 - 0.6])} q${f(arah * 0.8)} ${f(-1.2)} ${f(arah * 1.8)} ${f(-1.8)}`, garis(W.garis, 0.55, 0.8)));
  }
  // kelopak bawah: garis tipis terang + tonjolan saat tersenyum
  out.push(jl(halus(gB), garis(W.garisDalam, k ? 1.3 : 0.65, k ? 0.8 : 0.7)));
  if (!k && r.bawah < -0.8) out.push(jl(halus(gB.slice(1, -1).map(([x, y]): T2 => [x, y + 2])), garis(W.bayang, 0.7, 0.3)));
  return out.join('');
}

function gambarAlis(P: Proyeksi, s: -1 | 1, r: Raut, kuas: Kuas): string {
  const k = kuas.kecil;
  const [gD, gP, gL] = s < 0 ? r.alisKiri : r.alisKanan;
  const n = ALIS.length;
  const titik: T2[] = ALIS.map(([x, y], i) => {
    const t = i / (n - 1);
    const wD = Math.max(0, 1 - t / 0.4);
    const wL = Math.max(0, (t - 0.5) / 0.5);
    const wP = Math.max(0, 1 - wD - wL);
    const dx = gD[0] * wD + gP[0] * wP + gL[0] * wL; // + = ke tengah wajah
    const dy = gD[1] * wD + gP[1] * wP + gL[1] * wL;
    return P(p3(s * (x - dx), y + dy, 1));
  });
  const tebal = ALIS.map(([, , t]) => t * r.alisTebal * (k ? 1.45 : 1));
  const out = [jl(pita(titik, tebal), isi(W.alis, k ? 0.9 : 0.86))];
  if (!k) {
    // pangkal alis lebih lembut + helai tipis
    out.push(jl(pita(titik.slice(0, 2), [tebal[0] * 0.6, tebal[1] * 0.35]), isi('#6a4a3a', 0.35)));
    out.push(jl(halus(titik.slice(1, 5).map(([x, y]): T2 => [x, y - 0.6])), garis('#1e130e', 0.5, 0.35)));
  }
  return out.join('');
}

function gambarMulut(P: Proyeksi, m: RautMulut, bicara: boolean, kuas: Kuas): string {
  const k = kuas.kecil;
  const out: string[] = [];
  const N = 10;
  const Y0 = 39.6;
  const L: T2 = [-13.4 * m.lebar + m.condong, Y0 + m.sudut[0]];
  const R: T2 = [13.4 * m.lebar + m.condong, Y0 + m.sudut[1]];
  const tengahY = Y0 + m.tengah;
  const garisT: T2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = lerp(L[0], R[0], t);
    const y = lerp(L[1], R[1], t) + (tengahY - (L[1] + R[1]) / 2) * 4 * t * (1 - t);
    garisT.push([x, y]);
  }
  const Pm = (q: T2, dz = 0): T2 => P(p3(q[0], q[1], 1.2 + dz + 2.5 * (1 - Math.pow(Math.abs(q[0] - m.condong) / 14, 2))));
  const busur = (t: number): number => {
    const d = t - 0.5;
    const dasar = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(d) / 0.5, 1.7)), 0.85);
    const puncak = Math.exp(-Math.pow((Math.abs(d) - 0.16) / 0.1, 2)) * 0.22;
    const lekuk = Math.exp(-Math.pow(d / 0.05, 2)) * 0.18;
    return dasar + puncak - lekuk;
  };
  const buka = m.buka + (bicara ? (m.jenis === 'tawa' ? 2.4 : 4.2) : 0);
  const terbuka = buka > 0.2;
  const tebalAtas = m.jenis === 'tekan' ? m.atas * 0.72 : m.atas;
  const tebalBawah = m.jenis === 'tekan' ? m.bawah * 0.78 : m.bawah;
  const atasLuar = garisT.map(([x, y], i): T2 => [x, y - tebalAtas * busur(i / N)]);
  const tepiAtas = garisT.map(([x, y], i): T2 => [x, y - (terbuka ? buka * (m.jenis === 'tawa' ? 0.12 : 0.2) * Math.sin((Math.PI * i) / N) : 0)]);
  const tepiBawah = garisT.map(([x, y], i): T2 => {
    const sN = Math.sin((Math.PI * i) / N);
    return [x, y + (terbuka ? buka * (m.jenis === 'tawa' ? 1 : 0.8) * Math.pow(sN, m.jenis === 'tawa' ? 0.7 : 0.85) : 0)];
  });
  const bawahLuar = tepiBawah.map(([x, y], i): T2 => {
    const b = Math.pow(Math.sin((Math.PI * i) / N), 0.75);
    return [x + 0.3 * b, y + tebalBawah * b * (m.jenis === 'tawa' ? 0.8 : 1)];
  });
  const pA = atasLuar.map((q) => Pm(q)), pTA = tepiAtas.map((q) => Pm(q)), pTB = tepiBawah.map((q) => Pm(q, -0.5)), pB = bawahLuar.map((q) => Pm(q, -0.3));

  if (terbuka) {
    out.push(jl(rangkai([pTA, pTB.slice().reverse()]), isi(W.mulutDalam)));
    const gigi = m.gigi + (bicara ? 1.2 : 0);
    if (gigi > 0.2) {
      const bawahGigi = tepiAtas.map(([x, y], i): T2 => [x, y + gigi * Math.pow(Math.sin((Math.PI * i) / N), 0.5)]);
      out.push(jl(rangkai([pTA.slice(1, -1), bawahGigi.slice(1, -1).map((q) => Pm(q, -0.4)).reverse()]), isi(W.gigi, 0.96)));
      if (!k && m.jenis === 'tawa') {
        // celah gigi seri (dua garis tipis) supaya deret gigi tidak tampak seperti satu pita putih
        for (const t of [0.38, 0.62]) {
          const a = Pm(tepiAtas[Math.round(t * N)], -0.4);
          out.push(jl(`M${pt(a)}l0 ${f(gigi * 0.8)}`, garis('#d9cfc3', 0.5, 0.8)));
        }
      }
    }
    if (buka > 3) {
      const lidah = tepiBawah.slice(3, -3).map((q) => Pm([q[0], q[1] - Math.min(2.2, buka * 0.3)], -0.5));
      out.push(jl(halus(lidah), garis('#b0504c', Math.min(3, buka * 0.35), 0.7)));
    }
  }
  // bibir atas (lebih gelap: menghadap bawah) & bawah (lebih terang, kilap kecil)
  out.push(jl(rangkai([pA, pTA.slice().reverse()]), isi(W.bibir)));
  out.push(jl(rangkai([pA, pTA.slice().reverse()]), isi(W.bibirTua, 0.35)));
  out.push(jl(rangkai([pTB, pB.slice().reverse()]), isi(W.bibir)));
  out.push(jl(rangkai([pTB.slice(5), pB.slice(5).reverse()]), isi(W.bibirTua, 0.22)));
  if (!k) {
    const kilap = [3, 4, 5].map((i) => lerp2(pTB[i], pB[i], 0.5));
    out.push(jl(halus(kilap), garis(W.bibirTerang, 1.1, 0.6)));
    out.push(jl(halus([2, 3, 4].map((i): T2 => [pA[i][0], pA[i][1] - 0.6])), garis('#fbe3d6', 0.7, 0.35)));
  }
  // garis antar-bibir (tegas di sudut) & tepi bibir tipis
  out.push(jl(halus(pTA), garis(W.bibirTua, k ? 1.7 : (m.jenis === 'tekan' ? 1.15 : 0.95), 0.95)));
  if (terbuka) out.push(jl(halus(pTB), garis(W.bibirTua, k ? 1.1 : 0.6, 0.7)));
  out.push(jl(halus(pA), garis(W.bibirTua, k ? 0.9 : 0.5, 0.45)));
  // sudut bibir: lesung saat senyum / garis turun saat tekan-cemberut
  if (!k) {
    const a = pTA[0], b = pTA[N];
    if (m.sudut[0] < -1) out.push(jl(`M${pt([a[0] + 0.6, a[1] - 1.6])} q${f(-1.8)} ${f(0.9)} ${f(-1.4)} ${f(3.2)}`, garis(W.garisDalam, 0.7, 0.5)));
    if (m.sudut[1] < -1) out.push(jl(`M${pt([b[0] - 0.6, b[1] - 1.6])} q${f(1.8)} ${f(0.9)} ${f(1.4)} ${f(3.2)}`, garis(W.garisDalam, 0.7, 0.45)));
    if (m.sudut[0] > 1.2) out.push(jl(`M${pt(a)} q${f(-0.8)} ${f(1.4)} ${f(-1.2)} ${f(3)}`, garis(W.bayang, 0.8, 0.4)));
    if (m.sudut[1] > 1.2) out.push(jl(`M${pt(b)} q${f(0.8)} ${f(1.4)} ${f(1.2)} ${f(3)}`, garis(W.bayang, 0.8, 0.35)));
  } else if (!terbuka && Math.min(m.sudut[0], m.sudut[1]) < -2.5) {
    // versi kecil: ujung senyum tertutup naik sebagai lengkung pendek (tersenyum terbaca beda dari lega di 44-64 px)
    const a = pTA[0], b = pTA[N];
    out.push(jl(`M${pt([a[0] + 1.4, a[1] + 0.8])} q${f(-1.4)} ${f(-0.3)} ${f(-2.2)} ${f(-2.6)}M${pt([b[0] - 1.4, b[1] + 0.8])} q${f(1.4)} ${f(-0.3)} ${f(2.2)} ${f(-2.6)}`, garis(W.bibirTua, 1.4, 0.9)));
  }
  return out.join('');
}

// =================================================================================================================
// BADAN: bentuk-bentuk kain, lengan/kaki tabung, tangan, sepatu, kunci, telepon
// =================================================================================================================

/** Tabung (lengan/kaki) melalui sendi dengan lebar per sendi → poligon tertutup rapat + tepi kiri/kanan. */
function tabung(sendi: T2[], lebar: number[], per = 6): { p: T2[]; tengah: T2[]; w: number[]; terbuka: T2[] } {
  const c = sampel(sendi, false, per);
  const segs = sendi.length - 1;
  const w = c.map((_, i) => {
    const u = (i / (c.length - 1)) * segs;
    const s = Math.min(segs - 1, Math.floor(u));
    return lerp(lebar[s], lebar[s + 1], u - s);
  });
  const kiri0: T2[] = [];
  const kanan0: T2[] = [];
  const arah: T2[] = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const t = normal2([b[0] - a[0], b[1] - a[1]]);
    const h = w[i] / 2;
    arah.push(t);
    kiri0.push([c[i][0] - t[1] * h, c[i][1] + t[0] * h]);
    kanan0.push([c[i][0] + t[1] * h, c[i][1] - t[0] * h]);
  }
  // Tekukan tajam (siku bersilang/terlipat, lutut duduk-turun): tepi DALAM tekukan berbalik arah dan membentuk "ekor
  // walet" (segitiga runcing yang mencuat bergaris tepi). Titik tepi yang mundur terhadap arah sumbu dibuang, jadi
  // lipatan dalam menjadi sudut lembut; tepi luar (siku/lutut membulat) tidak berubah.
  const rapikan = (sisi: T2[]): T2[] => {
    const out: T2[] = [sisi[0]];
    for (let i = 1; i < sisi.length; i++) {
      const a = out[out.length - 1];
      if ((sisi[i][0] - a[0]) * arah[i][0] + (sisi[i][1] - a[1]) * arah[i][1] > 0.05 || i === sisi.length - 1) out.push(sisi[i]);
    }
    return out;
  };
  const kiri = rapikan(kiri0);
  const kanan = rapikan(kanan0);
  // tutup ujung setengah lingkaran
  const tutupUjung = (pusat: T2, arah: T2, r: number): T2[] => {
    const res: T2[] = [];
    const a0 = Math.atan2(arah[1], arah[0]);
    for (let j = 1; j < 6; j++) {
      const a = a0 - Math.PI / 2 + (j / 6) * Math.PI;
      res.push([pusat[0] + Math.cos(a) * r, pusat[1] + Math.sin(a) * r]);
    }
    return res;
  };
  const nC = c.length;
  const arahAkhir = normal2([c[nC - 1][0] - c[nC - 2][0], c[nC - 1][1] - c[nC - 2][1]]);
  const arahAwal = normal2([c[0][0] - c[1][0], c[0][1] - c[1][1]]);
  const akhir = tutupUjung(c[nC - 1], arahAkhir, w[nC - 1] / 2);
  const awal = tutupUjung(c[0], arahAwal, w[0] / 2);
  // urutan: kiri (awal→akhir), tutup akhir (kiri→kanan), kanan (akhir→awal), tutup awal
  const akhirR = akhir.reverse();
  const p: T2[] = [...kiri, ...akhirR, ...kanan.slice().reverse(), ...awal.reverse()];
  // garis tepi tanpa tutup pangkal: sambungan ke bagian lengan lain tidak bergaris
  const terbuka: T2[] = [...kiri, ...akhirR, ...kanan.slice().reverse()];
  return { p, tengah: c, w, terbuka };
}

const isiBlus = (kuas: Kuas): string => kuas.grad('blus', W.blusTerang, W.blus, W.blusTua);
/** Lengan: gradien di ruang kanvas (sambungan lengan atas/bawah tanpa beda warna). */
const isiLengan = (kuas: Kuas): string => kuas.gradRuang('lgn', [60, 200], [380, 620], W.blusTerang, W.blus, W.blusTua);
const isiKerudung = (kuas: Kuas): string => kuas.grad('krd', W.kerudungTerang, W.kerudung, W.kerudungTua);
const isiKulit = (kuas: Kuas): string => kuas.grad('tgn', W.kulitTerang, W.kulit, W.kulitBawah);
const isiCelana = (kuas: Kuas): string => kuas.grad('cln', W.celanaTerang, W.celana, W.celanaTua);
const isiSepatu = (kuas: Kuas): string => kuas.grad('spt', W.sepatuTerang, W.sepatu, W.sepatuTua);

const ARSIR_BLUS: Arsir = {
  bayang: [[W.blusBayang, 24, 0.12], [W.blusBayang, 9, 0.16]],
  sorot: [[W.blusSorot, 20, 0.1], [W.blusSorot, 7, 0.14]],
};
/** Tunik duduk: pangkuan tertutup celemek, jadi satu pita sorot saja (SVG lebih kecil, tampak sama). */
const ARSIR_BLUS_DUDUK: Arsir = {
  bayang: [[W.blusBayang, 24, 0.12], [W.blusBayang, 9, 0.16]],
  sorot: [[W.blusSorot, 14, 0.13]],
};
const ARSIR_LENGAN: Arsir = {
  bayang: [[W.blusBayang, 16, 0.12], [W.blusBayang, 7, 0.16]],
  sorot: [[W.blusSorot, 12, 0.16]],
};
const ARSIR_KULIT: Arsir = {
  bayang: [[W.bayang, 4.5, 0.2]],
  sorot: [[W.sorotKulit, 3, 0.3]],
};
// sorot kain kerudung separuh putaran 2 (kilap memanjang membuat kain tampak seperti karet/plastik)
const ARSIR_KERUDUNG: Arsir = {
  bayang: [[W.kerudungBayang, 20, 0.12], [W.kerudungBayang, 7, 0.18]],
  sorot: [[W.kerudungSorot, 11, 0.08]],
  pita: [{ warna: W.kerudungBayang, lebar: 5, op: 0.18, arah: [0, 1], ambang: 0.5 }],
};
const ARSIR_CELANA: Arsir = {
  bayang: [[W.celanaBayang, 9, 0.18], [W.celanaBayang, 4, 0.18]],
  sorot: [[W.celanaTerang, 5, 0.25]],
};

type JenisTangan = 'lepas' | 'kepal' | 'datar' | 'dagu' | 'pegang' | 'genggam' | 'rangkul';

/**
 * TANGAN = rangka jari (bukan templat siluet): telapak/punggung tangan + empat jari tiga ruas + ibu jari, masing-masing
 * bentuk sendiri bergaris tepi, jadi jari terbaca terpisah (bukan sarung tangan). Ruang lokal: pergelangan di (0,0),
 * sumbu +x ke ujung jari, ibu jari di sisi -y, punggung tangan menghadap kamera. `tekuk` = putar per sendi (derajat,
 * + = ke sisi telapak/+y); tampak samping = sumbu y dipipihkan (`pipih`). Panjang pergelangan → ujung jari tengah ± 86
 * (± 0,66 tinggi kepala, setara tangan Miss Raksa). Dipasang dengan putar/cermin di kode (bukan transform SVG),
 * sehingga arsir tetap dari kiri atas.
 */
interface Jari {
  p: T2;
  a: number;
  l: [number, number, number];
  w: number;
}
/** Panjang jari berbeda (tengah terpanjang, kelingking jauh lebih pendek), lebar menyempit ke ujung (JARI_RUNCING). */
const JARI: Record<'telunjuk' | 'tengah' | 'manis' | 'kelingking', Jari> = {
  telunjuk: { p: [43, -12.2], a: -5, l: [13.4, 8.2, 5.6], w: 9.6 },
  tengah: { p: [46.5, -3.8], a: -1, l: [15.8, 9.8, 6.6], w: 10.1 },
  manis: { p: [44.5, 4.8], a: 3.5, l: [14.6, 9, 6], w: 9.5 },
  kelingking: { p: [40.5, 12.4], a: 9, l: [10.4, 6.4, 4.8], w: 7.9 },
};
/** Lebar relatif jari per sendi (pangkal → ujung): meruncing, ujung membulat kecil (bukan tabung seragam). */
const JARI_RUNCING = [1, 0.93, 0.81, 0.64];
const IBU_JARI: Jari = { p: [10, -10.5], a: -38, l: [13, 11.5, 7.5], w: 11 };
/** Punggung tangan (pergelangan → buku jari). */
const TELAPAK: T2[] = [[-3, -12.5], [10, -14.5], [24, -16], [36, -16.2], [44, -15], [48.6, -9], [50.4, -2], [49.6, 6], [46.4, 12.6], [41, 17.4], [30, 16.4], [16, 14.4], [-3, 12.5]];

interface ModelTangan {
  /** Pipih sumbu y (1 = punggung tangan penuh, < 1 = tampak menyamping). */
  pipih: number;
  /** Tekuk [pangkal, tengah, ujung] per jari: telunjuk, tengah, manis, kelingking. */
  tekuk: [number, number, number][];
  /** Geser arah jari (derajat) per jari (rapat/renggang). */
  arah?: number[];
  ibu: { a: number; tekuk: [number, number, number] };
  /** true = jari digambar di belakang punggung tangan (kepalan: ruas yang melipat tersembunyi). */
  jariDulu: boolean;
  /** Kuku tampak (punggung tangan menghadap kamera). */
  kuku: boolean;
}
const MODEL_TANGAN: Record<JenisTangan, ModelTangan> = {
  datar: { pipih: 1, tekuk: [[4, 6, 4], [3, 6, 4], [3, 6, 4], [4, 7, 5]], arah: [1, 0, -1, -1], ibu: { a: -32, tekuk: [0, 12, 6] }, jariDulu: false, kuku: true },
  lepas: { pipih: 0.55, tekuk: [[10, 16, 10], [14, 20, 12], [18, 22, 12], [22, 22, 12]], arah: [6, 2, -2, -5], ibu: { a: -10, tekuk: [0, 14, 8] }, jariDulu: false, kuku: false },
  kepal: { pipih: 0.74, tekuk: [[78, 92, 40], [80, 94, 40], [82, 94, 40], [84, 92, 40]], arah: [6, 1, -3, -8], ibu: { a: 4, tekuk: [18, 34, 10] }, jariDulu: true, kuku: false },
  genggam: { pipih: 0.78, tekuk: [[52, 66, 30], [56, 70, 30], [60, 70, 30], [64, 70, 30]], arah: [4, 0, -3, -7], ibu: { a: -6, tekuk: [16, 26, 8] }, jariDulu: false, kuku: false },
  dagu: { pipih: 0.8, tekuk: [[-2, 4, 2], [80, 94, 40], [82, 94, 40], [84, 92, 40]], arah: [-6, 1, -3, -8], ibu: { a: 6, tekuk: [20, 30, 10] }, jariDulu: false, kuku: false },
  pegang: { pipih: 0.92, tekuk: [[22, 38, 22], [24, 40, 22], [26, 40, 22], [30, 40, 20]], arah: [2, 0, -1, -3], ibu: { a: -26, tekuk: [6, 16, 8] }, jariDulu: false, kuku: true },
  // bersedekap (kesal): jari rebah melingkar lembut di atas lengan, tidak mencengkeram (bukan cakar)
  rangkul: { pipih: 0.9, tekuk: [[12, 20, 12], [14, 22, 12], [17, 24, 11], [22, 22, 10]], arah: [7, 1, -5, -11], ibu: { a: -24, tekuk: [4, 10, 6] }, jariDulu: false, kuku: true },
};

/** Titik sendi jari: pangkal → buku tengah → buku ujung → ujung (belum termasuk tutup bulat ujung). */
function sendiJari(p: T2, a0: number, l: [number, number, number], t: [number, number, number]): T2[] {
  const out: T2[] = [p];
  let a = a0;
  let q = p;
  for (let i = 0; i < 3; i++) {
    a += t[i];
    q = [q[0] + Math.cos(a * RAD) * l[i], q[1] + Math.sin(a * RAD) * l[i]];
    out.push(q);
  }
  return out;
}

/**
 * Bentuk jari ringkas (sisi kiri, tutup ujung, sisi kanan) di ruang LAYAR: kurva halus sedikit titik (SVG kecil),
 * pangkal terbuka (menyatu ke punggung tangan tanpa garis melintang).
 */
function bentukJari(s: T2[], w: number[]): { p: T2[]; terbuka: T2[] } {
  const n = s.length;
  const kiri: T2[] = [];
  const kanan: T2[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    const t = normal2([b[0] - a[0], b[1] - a[1]]);
    kiri.push([s[i][0] - t[1] * w[i] / 2, s[i][1] + t[0] * w[i] / 2]);
    kanan.push([s[i][0] + t[1] * w[i] / 2, s[i][1] - t[0] * w[i] / 2]);
  }
  const e = s[n - 1];
  const d = normal2([e[0] - s[n - 2][0], e[1] - s[n - 2][1]]);
  const r = w[n - 1] / 2;
  const ujung: T2[] = [
    [e[0] + d[0] * r * 0.72 - d[1] * r * 0.72, e[1] + d[1] * r * 0.72 + d[0] * r * 0.72],
    [e[0] + d[0] * r, e[1] + d[1] * r],
    [e[0] + d[0] * r * 0.72 + d[1] * r * 0.72, e[1] + d[1] * r * 0.72 - d[0] * r * 0.72],
  ];
  const terbuka = [...kiri, ...ujung, ...kanan.slice().reverse()];
  return { p: terbuka, terbuka };
}

const ARSIR_JARI: Arsir = { bayang: [[W.bayang, 2.4, 0.2]] };

/** Pasang tangan: pergelangan `w`, sudut sumbu (derajat), cermin (ibu jari pindah sisi), skala. */
function itemTangan(jenis: JenisTangan, w: T2, sudut: number, cermin = false, skala = 1): Item[] {
  const M = MODEL_TANGAN[jenis];
  const ca = Math.cos(sudut * RAD), sa = Math.sin(sudut * RAD);
  const tr = ([x, y]: T2): T2 => {
    const yy = (cermin ? -y : y) * M.pipih * skala, xx = x * skala;
    return [w[0] + xx * ca - yy * sa, w[1] + xx * sa + yy * ca];
  };
  const jari: Item[] = [];
  const kuku: Item[] = [];
  const garisBuku: Item[] = [];
  const nama = ['kelingking', 'manis', 'tengah', 'telunjuk'] as const;
  // kelingking dulu, telunjuk terakhir (paling dekat ke ibu jari & kamera)
  nama.forEach((nm) => {
    const i = ['telunjuk', 'tengah', 'manis', 'kelingking'].indexOf(nm);
    const J = JARI[nm];
    const s = sendiJari(J.p, J.a + (M.arah?.[i] ?? 0), J.l, M.tekuk[i]).map(tr);
    const ww = JARI_RUNCING.map((v) => v * J.w * skala * (0.55 + 0.45 * M.pipih));
    const b = bentukJari(s, ww);
    jari.push({ k: 'bentuk', p: b.p, garisTerbuka: b.terbuka, isi: isiKulit, garis: 0.8 });
    const total = M.tekuk[i][0] + M.tekuk[i][1] + M.tekuk[i][2];
    if (M.kuku && total < 70) {
      const [q2, q3] = [s[2], s[3]];
      const dir = normal2([q3[0] - q2[0], q3[1] - q2[1]]);
      const c: T2 = [q3[0] - dir[0] * 1.2 * skala, q3[1] - dir[1] * 1.2 * skala];
      kuku.push({ k: 'elips', c, rx: J.w * 0.3 * skala, ry: J.w * 0.24 * skala * M.pipih, warna: '#f1c7b3', op: 0.9, sudut: Math.atan2(dir[1], dir[0]) / RAD });
    }
    if (M.kuku && total < 40) {
      // kerut buku jari tengah (dua lengkung pendek)
      const c = s[1];
      const dir = normal2([s[2][0] - s[0][0], s[2][1] - s[0][1]]);
      const nx: T2 = [-dir[1] * J.w * 0.3 * skala, dir[0] * J.w * 0.3 * skala];
      garisBuku.push({ k: 'garis', p: [[c[0] - nx[0], c[1] - nx[1]], [c[0] + dir[0] * 0.8, c[1] + dir[1] * 0.8], [c[0] + nx[0], c[1] + nx[1]]], warna: W.garisDalam, tebal: 0.6, op: 0.4 });
    }
  });
  const telapak: Item = { k: 'bentuk', p: TELAPAK.map(tr), isi: isiKulit, garis: 0.9, arsir: ARSIR_KULIT };
  const I = IBU_JARI;
  const sIbu = sendiJari(I.p, M.ibu.a, I.l, M.ibu.tekuk).map(tr);
  const bIbu = bentukJari(sIbu, [I.w, I.w * 0.93, I.w * 0.84, I.w * 0.7].map((v) => v * skala * (0.7 + 0.3 * M.pipih)));
  const ibu: Item = { k: 'bentuk', p: bIbu.p, garisTerbuka: bIbu.terbuka, isi: isiKulit, garis: 0.85, arsir: ARSIR_JARI };
  const items: Item[] = [];
  if (M.jariDulu) items.push(...jari, telapak);
  else items.push(telapak, ...jari);
  items.push(...garisBuku, ...kuku, ibu);
  return items;
}

/**
 * Tangan bertaut (cemas/senang): tangan jauh mengepal (dari kiri, ibu jari di atas) digenggam tangan dekat (dari kanan)
 * yang jari-jarinya melingkar turun menutup kepalan. Pusat `c`.
 */
function itemTangkup(c: T2, skala = 1, miring = 0): Item[] {
  const a = miring;
  const pusat = (dx: number, dy: number): T2 => {
    const q = putar([dx * skala, dy * skala], [0, 0], a);
    return [c[0] + q[0], c[1] + q[1]];
  };
  return [
    ...itemTangan('kepal', pusat(-40, 6), a - 2, false, skala * 0.92),
    ...itemTangan('pegang', pusat(42, -4), a + 176, true, skala * 0.95),
  ];
}

/**
 * Ujung jari tangan yang terselip (bersedekap/kesal): tangan jauh masuk di balik lengan atas dekat, dan tiga ujung jarinya
 * muncul dari tepi luar lengan itu, melingkar ke depan (bukan telapak utuh / sarung tangan). `tepi` = titik di tepi luar
 * lengan atas dekat (pangkal jari tengah), `sudut` = arah jari (derajat; jari berbaris sepanjang tepi lengan).
 */
function itemJariSelip(tepi: T2, sudut: number, skala = 1): Item[] {
  const items: Item[] = [];
  const a = sudut * RAD;
  const sepanjang: T2 = [-Math.sin(a), Math.cos(a)];
  // telunjuk (atas) → manis (bawah): panjang & lebar berbeda, pangkal sedikit tersembunyi di balik tepi lengan; jari
  // melingkari lengan (ruas memendek karena melengkung menjauh), sedikit turun ke ujung
  const jari: [number, number, [number, number, number], [number, number, number]][] = [
    [9.5, 9, [5, 12, 7], [-4, -8, -10]],
    [0, 9.6, [5, 13.5, 7.5], [0, -8, -10]],
    [-9.2, 8.8, [5, 11, 6.5], [4, -6, -10]],
  ];
  for (const [d, w, l, t] of jari) {
    const p0: T2 = tambah2(tepi, sepanjang, d * skala);
    const s = sendiJari(p0, sudut, [l[0] * skala, l[1] * skala, l[2] * skala], t);
    const b = bentukJari(s, JARI_RUNCING.map((v) => v * w * skala));
    items.push({ k: 'bentuk', p: b.p, garisTerbuka: b.terbuka, isi: isiKulit, garis: 0.8, arsir: ARSIR_JARI });
    // kuku kecil di ujung (jari melingkar ke kamera)
    const e = s[3], q = s[2];
    const dir = normal2([e[0] - q[0], e[1] - q[1]]);
    items.push({ k: 'elips', c: [e[0] - dir[0] * 1.4, e[1] - dir[1] * 1.4], rx: w * 0.27 * skala, ry: w * 0.21 * skala, warna: '#f1c7b3', op: 0.9, sudut: Math.atan2(dir[1], dir[0]) / RAD });
  }
  // bayang lembut di lengan tepat di bawah jari (jari menempel, bukan melayang)
  const maju: T2 = [Math.cos(a), Math.sin(a)];
  const b0 = tambah2(tambah2(tepi, sepanjang, -14 * skala), maju, 4);
  const b1 = tambah2(tambah2(tepi, sepanjang, -14 * skala), maju, 20 * skala);
  items.unshift({ k: 'garis', p: [b0, lerp2(b0, b1, 0.5), b1].map((q): T2 => [q[0], q[1] + 2]), warna: W.blusBayang, tebal: 5, op: 0.28 });
  return items;
}

/** Tepi luar lengan atas (sisi menjauhi badan) pada fraksi `t` bahu → siku, dan arah masuk ke lengan (derajat). */
function tepiLuarLenganAtas(L: Lengan, t: number): { p: T2; sudut: number } {
  const [bahu, siku] = L.sendi;
  const u = normal2([siku[0] - bahu[0], siku[1] - bahu[1]]);
  const n: T2 = [u[1], -u[0]];
  const setengah = (lerp(45, 40, jepit((t - 0.55) / 0.45, 0, 1)) * (L.jauh ? 0.94 : 1)) / 2;
  return { p: tambah2(lerp2(bahu, siku, t), n, setengah - 2), sudut: Math.atan2(-n[1], -n[0]) / RAD - 4 };
}

/** Sepatu datar (flat) menghadap kiri; `a` = bawah pergelangan kaki, `angkat` = derajat (tumit terangkat +). */
function itemSepatu(a: T2, skala = 1, angkat = 0): Item[] {
  const tr = ([x, y]: number[]): T2 => {
    const q = putar([x * skala, y * skala], [16 * skala, 12 * skala], angkat);
    return [a[0] + q[0], a[1] + q[1]];
  };
  const p: T2[] = [[14, -9], [18, 0], [17, 8], [12, 12.4], [-8, 13.4], [-34, 13.2], [-52, 11.4], [-60, 7], [-58, 1], [-48, -3.6], [-30, -7], [-12, -9.6], [2, -11]];
  return [
    { k: 'bentuk', p: p.map(tr), isi: isiSepatu, garis: 1, arsir: { bayang: [[W.sepatuTua, 4, 0.3]], sorot: [[W.sepatuTerang, 3, 0.5]] } },
    { k: 'garis', p: [[-48, 8.6], [-24, 11], [6, 10.4]].map(tr), warna: W.sepatuTua, tebal: 1.4, op: 0.55 },
    { k: 'garis', p: [[-40, -3.4], [-20, -6.6], [0, -7.4]].map(tr), warna: '#c9977a', tebal: 0.9, op: 0.5 },
  ];
}

/** Kunci mobil tergantung dari titik genggam `g`: cincin, anak kunci, remote hitam berlampu kuning. */
function itemKunci(g: T2, skala = 1, ayun = 0): Item[] {
  const tr = ([x, y]: number[]): T2 => {
    const q = putar([x * skala, y * skala], [0, 0], ayun);
    return [g[0] + q[0], g[1] + q[1]];
  };
  return [
    { k: 'garis', p: lingkaran([0, 8], 6.2, 6.2, 14).map(tr), warna: W.besiTua, tebal: 2.4, tutup: true },
    { k: 'garis', p: lingkaran([0, 8], 6.2, 6.2, 14).map(tr), warna: W.besi, tebal: 1.2, tutup: true },
    { k: 'bentuk', p: [[-2.4, 13], [2.4, 13], [3.4, 17], [3, 33], [1.2, 36], [-1.6, 34], [-2.6, 17]].map(tr), isi: () => `fill="${W.besi}"`, garis: 0.8, arsir: { bayang: [[W.besiTua, 2, 0.5]] }, lurus: false },
    { k: 'bentuk', p: [[-15, 14], [-5, 12.6], [-3.6, 18], [-4.6, 34], [-9, 38], [-15.4, 36.6], [-17.4, 30], [-17, 19]].map(tr), isi: () => `fill="${W.fob}"`, garis: 0.9, arsir: { sorot: [['#8a8a94', 2.4, 0.5]] } },
    { k: 'elips', c: tr([-10.4, 22]), rx: 2.3 * skala, ry: 2.3 * skala, warna: W.lampu, op: 1 },
    { k: 'elips', c: tr([-10.4, 30]), rx: 2.1 * skala, ry: 1.6 * skala, warna: '#55555e', op: 1 },
  ];
}

// -----------------------------------------------------------------------------------------------------------------
// Rangka pose
// -----------------------------------------------------------------------------------------------------------------

export type Gestur = 'kunci' | 'turun' | 'pangkuan' | 'genggam' | 'silang' | 'dagu' | 'dada' | 'tepuk' | 'meja' | 'meja-genggam' | 'telepon' | 'jalan-a' | 'jalan-b' | 'raih';
type Lapis = 'belakang' | 'badan' | 'depan' | 'atas';

interface Lengan {
  sendi: [T2, T2, T2];
  lapisAtas: Lapis;
  lapisBawah: Lapis;
  tangan: { jenis: JenisTangan; sudut: number; cermin?: boolean } | null;
  /** Lengan jauh sedikit lebih kecil (jauh dari kamera). */
  jauh?: boolean;
}

/** Dua tangan bertaut (pusat, skala, lapis, miring). */
type Tangkup = { c: T2; skala: number; lapis: Lapis; miring: number };
/**
 * Letak kunci mobil: titik tetap, di genggaman tangan dekat (d) / jauh (j), atau di tangan bertaut. Kunci selalu di
 * tangan KIRI Bu Rina (anatomis): menghadap kiri = tangan dekat, menghadap kanan (pergi) = tangan jauh; keduanya jatuh
 * di sisi KANAN layar (`tangan.kanan`).
 */
type TempatKunci = T2 | 'tangan-d' | 'tangan-j' | 'tangkup';

/** Gestur tangan per (pose, ekspresi). Gestur memperkuat ekspresi wajah (bukan simbol). Diekspor untuk uji. */
export function gesturUntuk(pose: PoseNasabah, e: Ekspresi): Gestur {
  if (pose === 'jalan-a' || pose === 'jalan-b') return pose;
  // bingkai antara berdiri ↔ duduk: kedua tangan meraih ke lutut/kursi (ekspresi tetap di wajah & bahu)
  if (pose === 'duduk-turun') return 'raih';
  if (pose === 'telepon') return 'telepon';
  if (pose === 'duduk-condong') return e === 'cemas' || e === 'bingung' ? 'meja-genggam' : 'meja';
  if (pose === 'berdiri-pergi') return e === 'kesal' || e === 'serius' ? 'turun' : 'kunci';
  switch (e) {
    case 'cemas':
      return 'genggam';
    case 'kesal':
      return 'silang';
    case 'bingung':
      return 'dagu';
    case 'lega':
      return 'dada';
    case 'senang':
      return 'tepuk';
    default:
      return pose === 'duduk' ? 'pangkuan' : 'kunci';
  }
}

/** Pangkal lengan (sendi bahu) berdiri; `b` = bahu naik/turun. Duduk = digeser (+20,+30) oleh pemanggil. */
const bahuJ = (b: number, dy = 0): T2 => [156, 252 + b + dy];
const bahuD = (b: number, dy = 0): T2 => [286, 248 + b + dy];

/**
 * Lengan untuk gestur, koordinat BERDIRI menghadap kiri (duduk = digeser +20,+30 oleh pemanggil kecuali gestur khusus
 * duduk). `kunciJauh` = versi untuk badan yang nanti dicerminkan menghadap kanan: kunci pindah ke tangan jauh supaya
 * tetap di tangan kiri anatomis.
 */
function lenganGestur(g: Gestur, b: number, kunciJauh = false): { J: Lengan; D: Lengan; tangkup?: Tangkup; kunci?: TempatKunci } {
  const bJ = bahuJ(b), bD = bahuD(b);
  const lepasJ: Lengan = { sendi: [bJ, [146, 398], [154, 506]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'lepas', sudut: 92, cermin: true }, jauh: true };
  const lepasD: Lengan = { sendi: [bD, [300, 396], [294, 506]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'lepas', sudut: 94, cermin: true } };
  switch (g) {
    case 'genggam':
      return {
        J: { sendi: [bJ, [146, 384], [168, 420]], lapisAtas: 'belakang', lapisBawah: 'atas', tangan: null, jauh: true },
        D: { sendi: [bD, [302, 380], [240, 418]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: null },
        tangkup: { c: [204, 422], skala: 1, lapis: 'atas', miring: -4 },
        kunci: 'tangkup',
      };
    case 'tepuk':
      return {
        J: { sendi: [bJ, [138, 372], [170, 342]], lapisAtas: 'belakang', lapisBawah: 'atas', tangan: null, jauh: true },
        D: { sendi: [bD, [304, 366], [240, 340]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: null },
        tangkup: { c: [205, 336], skala: 1, lapis: 'atas', miring: 6 },
        kunci: 'tangkup',
      };
    case 'silang':
      return {
        J: { sendi: [bJ, [142, 394], [290, 390]], lapisAtas: 'belakang', lapisBawah: 'badan', tangan: null, jauh: true },
        D: { sendi: [bD, [306, 404], [186, 380]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: { jenis: 'rangkul', sudut: 196, cermin: true } },
        kunci: [284, 396],
      };
    case 'dagu':
      return {
        J: { sendi: [bJ, [144, 390], [246, 410]], lapisAtas: 'belakang', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: 4, cermin: true }, jauh: true },
        D: { sendi: [bD, [282, 384], [232, 254]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: { jenis: 'dagu', sudut: -104 } },
        kunci: [286, 420],
      };
    case 'dada':
      return {
        // tangan pemegang kunci 9 satuan ke luar badan: remote tergantung bebas di luar siluet tunik
        J: { sendi: [bJ, [131, 398], [113, 500]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'kepal', sudut: 100, cermin: true }, jauh: true },
        D: { sendi: [bD, [302, 386], [244, 344]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: { jenis: 'datar', sudut: -146, cermin: true } },
        kunci: 'tangan-j',
      };
    case 'turun':
      return kunciJauh
        ? { J: { sendi: [bJ, [140, 396], [120, 500]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'kepal', sudut: 98, cermin: true }, jauh: true }, D: lepasD, kunci: 'tangan-j' }
        : { J: lepasJ, D: { sendi: [bD, [300, 398], [292, 506]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: 98, cermin: true } }, kunci: 'tangan-d' };
    default: // 'kunci'
      return kunciJauh
        ? { J: { sendi: [bJ, [136, 392], [112, 488]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'kepal', sudut: 104, cermin: true }, jauh: true }, D: lepasD, kunci: 'tangan-j' }
        : { J: lepasJ, D: { sendi: [bD, [304, 394], [262, 476]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: 138, cermin: true } }, kunci: 'tangan-d' };
  }
}

/**
 * Lengan berjalan (berdiri menghadap kiri; `kunciJauh` = versi yang dicerminkan ke kanan). Lengan berayun berlawanan
 * dengan kaki; tangan pemegang kunci berayun lebih kecil dan tetap di depan badan supaya kunci terlihat di kedua langkah.
 */
function lenganJalan(pose: 'jalan-a' | 'jalan-b', turun: number, kunciJauh: boolean): { J: Lengan; D: Lengan; kunci: TempatKunci } {
  const bJ = bahuJ(0, turun), bD = bahuD(0, turun);
  const a = pose === 'jalan-a';
  if (kunciJauh) {
    return {
      J: { sendi: [bJ, a ? [128, 388] : [140, 392], a ? [104, 482] : [118, 488]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'kepal', sudut: a ? 106 : 100, cermin: true }, jauh: true },
      D: { sendi: [bD, a ? [314, 388] : [284, 392], a ? [338, 472] : [248, 476]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'lepas', sudut: a ? 70 : 118, cermin: true } },
      kunci: 'tangan-j',
    };
  }
  return {
    J: { sendi: [bJ, a ? [128, 386] : [174, 390], a ? [108, 480] : [200, 476]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'lepas', sudut: a ? 106 : 74, cermin: true }, jauh: true },
    D: { sendi: [bD, a ? [314, 388] : [284, 392], a ? [338, 470] : [248, 474]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: a ? 70 : 122, cermin: true } },
    kunci: 'tangan-d',
  };
}

// -----------------------------------------------------------------------------------------------------------------
// Bentuk kain (berdiri, menghadap kiri). Duduk = badan atas yang sama digeser (+20, +30) + pangkuan.
// -----------------------------------------------------------------------------------------------------------------

/**
 * Gerak kain saat melangkah (berdiri, menghadap kiri; hadap kanan = ikut dicerminkan). Keliman tunik & celemek terayun
 * `geser` satuan BERLAWANAN dengan sisi kaki yang maju (sisi dekat = kanan layar, sisi jauh = kiri), garis keliman
 * miring `miring` derajat (sisi kaki depan terangkat), dan lutut depan mendorong kain (`lutut`: tonjolan + sorot).
 * Dua langkah bergantian → keliman berayun kiri-kanan, bukan lonceng kaku.
 */
interface Langkah {
  geser: number;
  miring: number;
  lutut: T2;
}
const LANGKAH: Record<'jalan-a' | 'jalan-b', Langkah> = {
  // jalan-a: kaki DEKAT maju → keliman terayun ke sisi jauh (kiri), sisi dekat (kanan) terangkat
  'jalan-a': { geser: -7, miring: -2.5, lutut: [214, 758] },
  // jalan-b: kaki JAUH maju → keliman terayun ke sisi dekat (kanan), sisi jauh (kiri) terangkat
  'jalan-b': { geser: 7, miring: 2.5, lutut: [168, 752] },
};
/** Pusat putar miring keliman tunik (berdiri). */
const PUSAT_KELIM: T2 = [212, 760];

/** Titik kain di bawah pinggul digeser langkah (bobot naik dari pinggul ke keliman); `k` = kekuatan (celemek < 1). */
function kainLangkah(q: T2, lk: Langkah | null, k = 1): T2 {
  if (!lk) return q;
  const w = Math.pow(jepit((q[1] - 520) / (760 - 520), 0, 1), 1.3) * k;
  if (w <= 0) return q;
  const d = Math.exp(-Math.pow((q[0] - lk.lutut[0]) / 36, 2)) * jepit((q[1] - 640) / 100, 0, 1);
  const x = q[0] + lk.geser * w - 2.5 * d * k;
  const y = q[1] + (q[0] - PUSAT_KELIM[0]) * Math.tan(lk.miring * RAD) * w + 3.5 * d * k;
  return [x, y];
}

/** Tunik biru selutut (berdiri) di atas celana panjang. `b` = bahu, `lk` = gerak kain melangkah (jalan). */
function tunikBerdiri(b: number, lk: Langkah | null = null): T2[] {
  const p: T2[] = [
    [176, 214 + b], [150, 230 + b], [134, 258], [124, 300], [126, 342], [136, 392], [131, 452], [124, 530], [120, 630], [117, 700], [115, 748],
    [140, 760], [180, 766], [200, 768], [220, 768], [242, 766], [262, 764], [308, 750], [310, 690], [314, 600], [318, 516], [300, 436], [304, 360], [310, 296], [300, 250 + b], [272, 226 + b], [230, 212 + b],
  ];
  return p.map((q) => kainLangkah(q, lk));
}

/** Pinggul pose duduk (= jangkar KANVAS_DUDUK): poros condong badan atas. */
const PINGGUL_DUDUK: T2 = [230, 560];
/** Condong badan atas `duduk-condong` (derajat; − = ke depan, ke arah meja): bersiap pergi terbaca jelas. */
const CONDONG = -11;
/**
 * Paha duduk dipendekkan secara PROYEKSI (3/4, bukan profil): titik di depan perut (x < 150) dirapatkan ke x 150
 * dengan faktor 0,84, jadi lutut ± 16 satuan lebih dekat ke badan dan siluet duduk lebih ramping. Dipakai tunik,
 * celemek, tulang kering, dan bayang telapak pose duduk.
 */
const PAHA_X0 = 150;
const PAHA_K = 0.84;
const paha = (q: T2): T2 => (q[0] < PAHA_X0 ? [PAHA_X0 - (PAHA_X0 - q[0]) * PAHA_K, q[1]] : q);
const pahaP = (p: T2[]): T2[] => p.map(paha);

/**
 * Tunik saat duduk (kanvas duduk, menghadap 3/4 kiri di kursi pengunjung): badan atas = berdiri (+20,+30) lalu
 * `putarAtas` (condong); pangkuan & bokong TIDAK ikut berputar. Paha mengarah ke kiri-depan dengan puncak paha rata
 * (tampak sedikit dari atas), lutut jauh sedikit lebih tinggi, patahan lutut jelas di depan; bokong di dudukan dipangkas
 * ± 15 % dari putaran 2 (volume duduk setara berdiri). Pangkuan tertutup celemek (celemekDuduk); tunik tampak di
 * badan, pinggul belakang, dan bokong.
 */
function tunikDuduk(b: number, putarAtas: (q: T2) => T2): T2[] {
  const depan: T2[] = [[196, 244 + b], [170, 260 + b], [154, 288], [144, 330], [148, 372], [160, 418], [161, 458]];
  // puncak paha (lebih rendah & rata) → lutut jauh → depan lutut → patahan lutut → bawah paha dekat → dudukan
  const pangkuan: T2[] = [[142, 486], [114, 494], [88, 500], [70, 505], [58, 512], [50, 526], [49, 542], [55, 554], [64, 562], [96, 572], [132, 577], [168, 582], [204, 587], [240, 589], [276, 588], [306, 582], [324, 568], [331, 546], [331, 518]];
  const belakang: T2[] = [[326, 488], [320, 452], [322, 420], [324, 390], [330, 326], [320, 280 + b], [292, 256 + b], [250, 242 + b]];
  return [...depan.map(putarAtas), ...pahaP(pangkuan), ...belakang.map(putarAtas)];
}

/**
 * CELEMEK saat duduk: kain yang SAMA dengan celemek berdiri, kini rebah TIPIS di atas paha lalu jatuh melewati lutut
 * (tanpa volume bantal). Bidang: puncak paha (terang, menghadap atas), jurai pendek di sisi paha dekat (lebih gelap;
 * tunik biru tetap tampak di bawahnya sampai dudukan), jatuhan di depan lutut (tegak, sudut kain jatuh di lutut dekat).
 * Lipatan: satu lembah di celah dua paha, satu lipatan tegak di jatuhan, kerut pendek di jurai; garis patah di lutut
 * (punggung terang). Tali pinggang ikut badan atas (`putarAtas`, condong); panel mengikuti paha yang tidak berputar.
 */
function celemekDuduk(putarAtas: (q: T2) => T2, kecil: boolean): Item[] {
  const items: Item[] = [];
  const Pa = (p: T2[]): T2[] => p.map(putarAtas);
  // tali pinggang (koordinat duduk tegak, lalu condong)
  const taliAtas = Pa([[151, 469], [180, 475], [216, 479], [256, 477], [292, 472], [322, 465]]);
  const taliBawah = Pa([[323, 474], [292, 482], [256, 487], [216, 489], [180, 485], [151, 479]]);
  // garis punggung paha dekat (puncak → sisi) & patahan lutut (puncak → jatuhan)
  const punggung: T2[] = pahaP([[314, 520], [262, 527], [206, 534], [156, 542], [114, 551], [86, 560], [72, 567]]);
  const patah: T2[] = pahaP([[56, 513], [58, 530], [63, 548], [70, 566]]);
  // keliman: jurai sisi paha dekat (± 20 di bawah punggung) → sudut kain jatuh di lutut dekat → jatuhan depan lutut
  const kelim: T2[] = pahaP([[313, 541], [262, 548], [206, 555], [158, 562], [124, 569], [106, 577], [98, 596], [96, 605], [74, 610], [52, 607], [46, 605]]);
  const panel: T2[] = [
    ...taliBawah.slice().reverse(), // (151,479) → (323,474)
    [320, 500], [317, 522],
    ...kelim,
    ...pahaP([[44, 600], [43, 578], [45, 558], [47, 538], [52, 520], [60, 510], [80, 502], [108, 496], [136, 489]]),
  ];
  // bayang jatuh celemek: di tunik (di bawah jurai) & di tulang kering (di bawah jatuhan)
  items.push({ k: 'isi', p: [...kelim.slice(0, 6), ...kelim.slice(0, 6).map(([x, y]): T2 => [x + 2, y + 6]).reverse()], warna: W.blusBayang, op: 0.3 });
  items.push({ k: 'isi', p: pahaP([[57, 606], [74, 609], [96, 604], [100, 622], [74, 628], [58, 622]]), warna: W.celanaBayang, op: 0.3 });
  items.push({ k: 'bentuk', p: panel, isi: isiCelemek, garis: 0.9, arsir: { sorot: [[W.celemekTerang, 6, 0.25]] } });
  if (!kecil) {
    // bayang perut & lengan di pangkal pangkuan (tepat di bawah tali pinggang)
    items.push({ k: 'isi', p: [...taliBawah, ...taliBawah.map(([x, y]): T2 => [x - 4, y + 14]).reverse()], warna: W.celemekBayang, op: 0.16 });
    // jurai sisi paha dekat: bidang menjauhi cahaya (sedikit gelap) + kerut tegak pendek (kain menggantung)
    items.push({ k: 'isi', p: [...punggung, ...kelim.slice(0, 6).reverse()], warna: W.celemekBayang, op: 0.18 });
    items.push(
      ...pahaP([[252, 528], [190, 536], [140, 545]]).flatMap(([x, y]) => lipatan([[x, y + 3], [x + 1, y + 12], [x + 2, y + 21]], 4.5, 0.16, W.celemekBayang, W.celemekTerang, 0)),
      // lembah di celah dua paha (kain melesak di antara paha), punggung terang di atasnya
      ...lipatan(pahaP([[214, 500], [160, 510], [110, 522], [74, 532]]), 7, 0.18, W.celemekBayang, W.celemekTerang, 0.9),
      // jatuhan di depan lutut: satu lipatan tegak
      ...lipatan(pahaP([[62, 562], [61, 584], [63, 604]]), 5, 0.16, W.celemekBayang, W.celemekTerang, 0),
    );
    // punggung terang di patahan lutut; puncak lutut jauh di bawah kain
    items.push({ k: 'garis', p: patah, warna: W.celemekTerang, tebal: 2.4, op: 0.8 });
    items.push({ k: 'elips', c: paha([74, 508]), rx: 13, ry: 5, warna: W.celemekTerang, op: 0.5, sudut: -14 });
  }
  // lis jingga: keliman (pita) + tepi dekat (garis)
  const atasLis: T2[] = kelim.map(([x, y], i): T2 => [x + (i === 6 || i === 7 ? 2 : 0), y - 6.5]);
  items.push({ k: 'isi', p: [...atasLis, ...kelim.map(([x, y]): T2 => [x, y + 1.2]).reverse()], warna: W.lis, op: 0.95 });
  items.push({ k: 'garis', p: [[320, 480], [319, 506], [317, 524], [314, 540]], warna: W.lis, tebal: 2.6, op: 0.9 });
  // tali pinggang jingga + simpul & ujung tali di pinggul dekat
  const isiTali = (kuas: Kuas): string => kuas.grad('tali', '#f4a867', W.lis, '#b8591e');
  items.push({ k: 'bentuk', p: [...taliAtas, ...taliBawah], isi: isiTali, garis: 0.8 });
  const simpul = putarAtas([316, 477]);
  items.push(
    { k: 'bentuk', p: [[simpul[0] - 2, simpul[1] + 3], [simpul[0] + 6, simpul[1] + 5], [331, 538], [332, 560], [325, 562], [321, 538]], isi: isiTali, garis: 0.7 },
    { k: 'elips', c: simpul, rx: 6.5, ry: 5.5, warna: '#d66d2a', op: 1, garis: 0.7 },
  );
  return items;
}

/**
 * Kerudung (khimar) bagian menjuntai sesudah busur kubah kepala, koordinat berdiri: kain jatuh hampir tegak di tengkuk
 * (leher terbaca, bukan kerucut), berbelok landai di lereng bahu, membulat di pangkal lengan, lalu turun sedikit di
 * lengan atas; keliman bergelombang (lipatan) dengan titik terendah di depan dada di bawah dagu; sisi depan membulat
 * mengikuti dada. Urutan: sisi belakang (10 titik) → keliman (13) → sisi depan (8).
 * Keliman = 6 lengkung TIDAK sama (lebar 20–33, dalam 2,5–7 satuan) di antara 7 ujung lipatan (sedikit terangkat):
 * kain jatuh tak beraturan, bukan renda seragam. Lipatan tegak dari bros berakhir di ujung-ujung ini (UJUNG_LIPAT).
 */
function juntaiBerdiri(b: number, kepala: T2, dyBadan = 0): T2[] {
  const dx = kepala[0] - 210, dy = kepala[1] - 120 - dyBadan;
  const ikut = (q: T2, w: number): T2 => [q[0] + dx * w, q[1] + dy * w + dyBadan];
  const bh = (q: T2, w = 0.9): T2 => [q[0], q[1] + b * w + dyBadan];
  const bd = (q: T2): T2 => [q[0], q[1] + dyBadan];
  return [
    ikut([273, 160], 1), ikut([268, 178], 0.9), ikut([266, 194], 0.7), bh([275, 207], 0.8), bh([290, 216]), bh([304, 225]), bh([313, 238]), bh([317, 255]), bh([318, 272], 0.8), bh([314, 287], 0.6),
    ...KELIM_JUNTAI.map(bd),
    bh([143, 289], 0.6), bh([138, 268], 0.8), bh([139, 248], 0.9), bh([146, 229], 1), ikut([157, 211], 0.6), ikut([161, 194], 0.8), ikut([164, 176], 1), ikut([167, 158], 1),
  ];
}
/** Keliman kerudung (berdiri, lengan dekat → sisi depan): ujung lipatan & tengah lengkung bergantian. */
const KELIM_JUNTAI: T2[] = [
  [304, 292.5], [294, 297], [284, 296], [270, 306.6], [257, 306.4], [240, 324.6], [224, 324.5], [214, 333], [204, 331.8], [189, 336], [174, 320.8], [163, 317], [152, 305],
];
/** Ujung lipatan tegak kerudung di keliman (berdiri): lipatan dari bros berakhir di sini. */
const UJUNG_LIPAT = { dekat: KELIM_JUNTAI[4], tengah: KELIM_JUNTAI[6], jauh: KELIM_JUNTAI[10] };
/** Indeks keliman di `juntaiBerdiri` (sudut lengan → sisi depan). */
const KELIM_KERUDUNG: [number, number] = [9, 24];

// =================================================================================================================
// Perakit
// =================================================================================================================

const POSE_DUDUK: ReadonlySet<PoseNasabah> = new Set(['duduk', 'duduk-condong', 'telepon']);

function pandangBawaan(pose: PoseNasabah): ArahPandang {
  switch (pose) {
    case 'jalan-a':
    case 'jalan-b':
    case 'telepon':
    case 'berdiri-pergi':
      return 'depan';
    default:
      return 'lawan';
  }
}

/**
 * Lengan → item per lapis. Satu tabung utuh bahu → siku → pergelangan bila satu lapis; bila lengan bawah di lapis
 * lain (di depan kerudung/badan), lengan atas digambar di lapisnya dan lengan bawah dimulai dari tengah lengan atas
 * TANPA garis pangkal, jadi sambungan siku tidak tampak seperti sendi boneka.
 */
function itemLengan(L: Lengan, kecil: boolean): { lapis: Lapis; it: Item }[] {
  const [bahu, siku, pergelangan] = L.sendi;
  const s = L.jauh ? 0.94 : 1;
  const hasil: { lapis: Lapis; it: Item }[] = [];
  const perpanjang = (a: T2, b: T2, d: number): T2 => tambah2(b, normal2([b[0] - a[0], b[1] - a[1]]), d);
  const lebar = [50 * s, 45 * s, 40 * s, 35 * s, 31 * s];
  const sendi5: T2[] = [bahu, lerp2(bahu, siku, 0.55), siku, lerp2(siku, pergelangan, 0.5), pergelangan];
  const u = normal2([siku[0] - bahu[0], siku[1] - bahu[1]]);
  const v = normal2([pergelangan[0] - siku[0], pergelangan[1] - siku[1]]);
  const dotUV = u[0] * v[0] + u[1] * v[1];
  let bawah: ReturnType<typeof tabung>;
  if (L.lapisAtas === L.lapisBawah) {
    bawah = tabung(sendi5, lebar, 4);
    hasil.push({ lapis: L.lapisBawah, it: { k: 'bentuk', p: bawah.p, isi: isiLengan, arsir: ARSIR_LENGAN, lurus: true } });
  } else if (dotUV < 0.3) {
    // tekukan tajam (> ± 73°: bersedekap, tangan di dada/dagu, tangan bertaut): lengan bawah = tabung sendiri mulai DI
    // siku dengan ujung siku membulat bergaris (lengan bawah di depan lengan atas). Satu tabung yang melipat melewati
    // siku membuat tepi dalamnya berbalik → segitiga runcing di siku (juri-3).
    const atas = tabung([bahu, lerp2(bahu, siku, 0.55), siku], [50 * s, 45 * s, 40 * s], 4);
    hasil.push({ lapis: L.lapisAtas, it: { k: 'bentuk', p: atas.p, isi: isiLengan, arsir: ARSIR_LENGAN, lurus: true } });
    bawah = tabung([siku, lerp2(siku, pergelangan, 0.5), pergelangan], [42.5 * s, 36 * s, 31 * s], 4);
    hasil.push({ lapis: L.lapisBawah, it: { k: 'bentuk', p: bawah.p, isi: isiLengan, arsir: ARSIR_LENGAN, lurus: true } });
  } else {
    const atas = tabung([bahu, lerp2(bahu, siku, 0.55), perpanjang(bahu, siku, 3)], [50 * s, 45 * s, 40 * s], 4);
    hasil.push({ lapis: L.lapisAtas, it: { k: 'bentuk', p: atas.p, isi: isiLengan, arsir: ARSIR_LENGAN, lurus: true } });
    const mulai = lerp2(bahu, siku, 0.62);
    bawah = tabung([mulai, lerp2(bahu, siku, 0.82), siku, lerp2(siku, pergelangan, 0.5), pergelangan], [43.5 * s, 41.6 * s, 40 * s, 35 * s, 31 * s], 4);
    hasil.push({ lapis: L.lapisBawah, it: { k: 'bentuk', p: bawah.p, garisTerbuka: bawah.terbuka, isi: isiLengan, arsir: ARSIR_LENGAN, lurus: true } });
  }
  // lipatan siku: satu-dua lengkung lembut di sisi dalam tekukan (hanya tekukan sedang; tekukan tajam = lengan bawah
  // menutupi siku, lipatan tidak terlihat)
  const silang = u[0] * v[1] - u[1] * v[0];
  if (!kecil && Math.abs(silang) > 0.25 && dotUV >= 0.3) {
    const arah = silang > 0 ? 1 : -1;
    const bagi = normal2([v[0] - u[0], v[1] - u[1]]);
    const dalam: T2 = tambah2(siku, [-u[1] * arah, u[0] * arah], -9 * s);
    const kerut = (d: number, pj: number, op: number): Item => ({
      k: 'garis',
      p: [tambah2(tambah2(dalam, bagi, d), [-bagi[1], bagi[0]], -pj), tambah2(dalam, bagi, d + 1.6), tambah2(tambah2(dalam, bagi, d), [-bagi[1], bagi[0]], pj)],
      warna: W.blusBayang,
      tebal: 1,
      op,
    });
    hasil.push({ lapis: L.lapisBawah, it: kerut(-2, 7, 0.3) }, { lapis: L.lapisBawah, it: kerut(5, 5, 0.22) });
  }
  // manset (pita biru tua di ujung lengan)
  const w0 = 32 * s;
  const tE = normal2([pergelangan[0] - siku[0], pergelangan[1] - siku[1]]);
  const nE: T2 = [-tE[1], tE[0]];
  const a = tambah2(pergelangan, tE, -10);
  // manset: pita lurus melingkari pergelangan (ujungnya tertutup tangan; tanpa tangan = ujung tumpul, bukan runcing)
  const ujung = tambah2(pergelangan, tE, L.tangan ? 0 : 2);
  const manset: T2[] = [tambah2(a, nE, w0 / 2), tambah2(ujung, nE, w0 / 2 + 0.6), tambah2(ujung, nE, -w0 / 2 - 0.6), tambah2(a, nE, -w0 / 2)];
  hasil.push({ lapis: L.lapisBawah, it: { k: 'bentuk', p: manset, isi: (kuas) => kuas.grad('mst', W.blus, W.blusTua, '#1c3a4f'), garis: 0.9, lurus: true } });
  if (L.tangan) {
    const tg = L.tangan;
    const sk = L.jauh ? 0.94 : 1;
    for (const it of itemTangan(tg.jenis, tambah2(pergelangan, tE, -2), tg.sudut, tg.cermin, sk)) hasil.push({ lapis: L.lapisBawah, it });
  }
  return hasil;
}

/** Kaki celana (tabung) + sepatu. */
function itemKaki(sendi: [T2, T2, T2], lebar: [number, number, number], sepatu: { skala: number; angkat: number }, kecil: boolean): Item[] {
  const t = tabung(sendi, lebar, 4);
  const items: Item[] = [];
  const pk = sendi[2];
  items.push(...itemSepatu([pk[0], pk[1] + 10], sepatu.skala, sepatu.angkat));
  items.push({ k: 'bentuk', p: t.p, isi: isiCelana, arsir: ARSIR_CELANA, lurus: true });
  if (!kecil) {
    const lutut = sendi[1];
    items.push({ k: 'garis', p: [[lutut[0] - 8, lutut[1] - 10], [lutut[0] - 2, lutut[1] + 2], [lutut[0] + 6, lutut[1] + 10]], warna: W.celanaBayang, tebal: 1, op: 0.35 });
  }
  return items;
}

interface Susunan {
  items: { lapis: string; it: Item }[];
  kepala: T2;
  miringPose: number;
  lebar: number;
  tangan: { J?: T2; D?: T2 };
  kunci?: T2;
  bayangKontak: Item[];
  /** Badan turun (langkah jalan). */
  turun?: number;
  /** Dua tangan bertaut (cemas/senang/condong-cemas). */
  tangkupData?: Tangkup;
  /** Kunci di tangan jauh (di balik badan: digambar di lapis belakang). */
  kunciJauh?: boolean;
}

const URUT_LAPIS = ['kontak', 'kaki', 'belakang', 'badan0', 'badan', 'kerudung', 'kepala', 'atas', 'prop'] as const;

/**
 * Pita lancip (titik poligon, bukan string) di sepanjang sumbu: tebal 0 → `lebar` → 0. Dipakai lipatan kain supaya
 * ikut dicerminkan sebelum digambar (arah hadap kanan).
 */
function pitaTitik(p: T2[], lebar: number, profil: number[] = [0.15, 0.8, 1, 0.55, 0.1]): T2[] {
  const s = sampel(p, false, 2);
  const n = s.length;
  const kiri: T2[] = [];
  const kanan: T2[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    const t = normal2([b[0] - a[0], b[1] - a[1]]);
    const u = (i / (n - 1)) * (profil.length - 1);
    const j = Math.min(profil.length - 2, Math.floor(u));
    const h = (lerp(profil[j], profil[j + 1], u - j) * lebar) / 2;
    kiri.push([s[i][0] - t[1] * h, s[i][1] + t[0] * h]);
    kanan.push([s[i][0] + t[1] * h, s[i][1] - t[0] * h]);
  }
  return [...kiri, ...kanan.reverse()];
}

/**
 * Lipatan kain lembut: lembah gelap + (lipatan lebar) punggung terang bergeser ke arah cahaya (kiri atas). `kTerang` =
 * kekuatan punggung terang relatif lembah (kerudung katun: redup); `profil` = lebar sepanjang sumbu (lihat pitaTitik).
 */
function lipatan(sumbu: T2[], lebar: number, op: number, gelap: string, terang: string, kTerang = 0.8, profil?: number[]): Item[] {
  const geserT: T2 = [ARAH_SOROT[0] * lebar * 0.9, ARAH_SOROT[1] * lebar * 0.9];
  const lembah: Item = { k: 'isi', p: pitaTitik(sumbu, lebar, profil), warna: gelap, op, lurus: true, bulat: true };
  if (lebar <= 4.2 || kTerang <= 0) return [lembah];
  return [lembah, { k: 'isi', p: pitaTitik(sumbu.map(([x, y]): T2 => [x + geserT[0], y + geserT[1]]), lebar * 0.7, profil), warna: terang, op: op * kTerang, lurus: true, bulat: true }];
}

/** Rincian tunik berdiri: lipatan, garis kancing depan, pita keliman (biru tua + lis jingga), tonjolan lutut (jalan). */
function rincianTunikBerdiri(lk: Langkah | null, kecil: boolean): Item[] {
  const items: Item[] = [];
  const L = (p: T2[]): T2[] => p.map((q) => kainLangkah(q, lk));
  const kelim: T2[] = L([[115, 748], [140, 760], [180, 766], [200, 768], [220, 768], [242, 766], [262, 764], [308, 750]]);
  const atasKelim: T2[] = kelim.map(([x, y], i): T2 => [x + (i === 0 ? 1.5 : i === kelim.length - 1 ? -0.5 : 0), y - 24]);
  items.push({ k: 'isi', p: [...atasKelim, ...kelim.slice().reverse()], warna: W.blusBayang, op: 0.32 });
  items.push({ k: 'garis', p: atasKelim, warna: W.lis, tebal: 2.2, op: 0.9 });
  if (!kecil) {
    items.push({ k: 'garis', p: atasKelim.map(([x, y]): T2 => [x, y + 5]), warna: W.celemek, tebal: 0.9, op: 0.45 });
    // lipatan jatuh dari dada/pinggul ke keliman (sisi dekat; bagian depan tertutup celemek)
    items.push(
      ...lipatan(L([[140, 470], [134, 600], [126, 740]]), 5, 0.2, W.blusBayang, W.blusSorot),
      ...lipatan(L([[296, 540], [302, 650], [304, 746]]), 6, 0.22, W.blusBayang, W.blusSorot),
      ...lipatan([[168, 344], [176, 420], [170, 500]], 4, 0.14, W.blusBayang, W.blusSorot),
    );
    if (lk) {
      // lutut depan mendorong kain: lipatan tarik dari pinggul ke lutut (ujung bawahnya tampak di bawah celemek)
      items.push(...lipatan(L([[lk.lutut[0] + 22, 590], [lk.lutut[0] + 12, 680], [lk.lutut[0] + 4, 746]]), 5, 0.22, W.blusBayang, W.blusSorot));
    }
    // garis kancing (tengah depan badan 3/4) + kancing kecil
    items.push({ k: 'garis', p: [[199, 332], [195, 400], [193, 452]], warna: W.blusBayang, tebal: 1.2, op: 0.4 });
    for (const y of [352, 384, 416]) items.push({ k: 'elips', c: [198 - (y - 332) * 0.06, y], rx: 2.6, ry: 2.6, warna: W.blusTua, op: 1, garis: 0.6 });
  }
  return items;
}

// krem identitas (#f4e4c4) = warna TERANG; tengah lebih hangat & sedikit lebih gelap (putaran 4) supaya celemek tidak
// jadi bidang paling terang di tokoh/panggung
const isiCelemek = (kuas: Kuas): string => kuas.grad('clm', W.celemek, '#e7d1a6', W.celemekTua);
/** Faktor lebar panel celemek berdiri (terhadap tepi jauh x 130). */
const SEMPIT_CELEMEK = 0.905;
// kain tipis: bayang HANYA di tepi dekat (badan berbelok menjauhi cahaya), tanpa pita bayang di keliman (pita
// melingkar di bawah membuat kain tampak menggembung seperti bantal)
const ARSIR_CELEMEK: Arsir = {
  sorot: [[W.celemekTerang, 8, 0.16]],
  pita: [
    { warna: W.celemekBayang, lebar: 30, op: 0.09, arah: [1, 0.1], ambang: 0.3 },
    { warna: W.celemekBayang, lebar: 10, op: 0.13, arah: [1, 0.1], ambang: 0.3 },
  ],
};

/**
 * CELEMEK pinggang krem bertepi jingga (berdiri, menghadap kiri; identitas katering v2). Kain TIPIS yang menempel di
 * depan tunik: tali pinggang jingga melingkar dari sisi jauh ke sisi dekat (simpul & dua ujung tali di pinggul
 * dekat), panel krem tergantung sampai ± 40 satuan di atas lutut (lis jingga tunik tetap tampak di bawahnya), 3 lipatan
 * kerut lembut dari tali, lis jingga di keliman & kedua tepi, satu saku kecil. Keliman ikut ayunan langkah (`lk`, 85 %).
 */
function celemekBerdiri(lk: Langkah | null, kecil: boolean): Item[] {
  // panel ± 10 % lebih sempit dari putaran 3 (tepi dekat 296 → ± 281; tepi jauh tetap di siluet depan): tunik biru
  // tampak di sisi badan, celemek tidak lagi menutup hampir seluruh lebar badan. Tali pinggang tetap melingkar penuh.
  const L = (p: T2[]): T2[] => p.map((q) => kainLangkah([130 + (q[0] - 130) * SEMPIT_CELEMEK, q[1]], lk, 0.85));
  const items: Item[] = [];
  // panel: atas = bawah tali pinggang; tepi jauh menempel siluet tunik; tepi dekat di peralihan depan → samping badan
  // keliman sedikit bergelombang: naik di ujung lembah lipatan (x ± 154, 214, 268), turun di punggungnya
  const kelim: T2[] = L([[299, 704], [284, 709], [268, 711.5], [248, 716], [230, 719], [214, 718], [196, 720], [176, 719.5], [154, 713], [138, 711], [124, 707]]);
  const panel: T2[] = [...L([[133, 449], [160, 455], [196, 459], [236, 457], [272, 452], [297, 446], [296, 500], [297, 580], [298, 650]]), ...kelim, ...L([[123, 640], [126, 560], [129, 496]])];
  // bayang jatuh tipis celemek di tunik (kain berlapis): hanya di bawah keliman
  items.push({ k: 'isi', p: [...kelim, ...kelim.map(([x, y]): T2 => [x + 3, y + 6]).reverse()], warna: W.blusBayang, op: 0.28 });
  items.push({ k: 'bentuk', p: panel, isi: isiCelemek, arsir: ARSIR_CELEMEK, garis: 0.9 });
  // lis jingga: keliman (pita) + tepi jauh & dekat (garis)
  const atasLis = kelim.map(([x, y], i): T2 => [x + (i === 0 ? -1 : i === kelim.length - 1 ? 1 : 0), y - 7]);
  // pita lis sampai sedikit di bawah keliman (menutup lengkung halus tepi panel)
  items.push({ k: 'isi', p: [...atasLis, ...kelim.map(([x, y]): T2 => [x, y + 1.2]).reverse()], warna: W.lis, op: 0.95 });
  items.push({ k: 'garis', p: L([[296, 452], [296, 540], [297, 620], [298, 700]]), warna: W.lis, tebal: 2.6, op: 0.9 });
  items.push({ k: 'garis', p: L([[133, 455], [128, 540], [125, 620], [126, 700]]), warna: W.lis, tebal: 2.2, op: 0.85 });
  if (!kecil) {
    // lipatan kerut dari tali pinggang (lembah hangat, punggung terang ke kiri atas)
    items.push(
      ...lipatan(L([[164, 464], [160, 590], [154, 708]]), 8, 0.2, W.celemekBayang, W.celemekTerang, 0.9),
      ...lipatan(L([[208, 468], [211, 600], [214, 714]]), 6.5, 0.16, W.celemekBayang, W.celemekTerang, 0.9),
      ...lipatan(L([[254, 464], [263, 590], [268, 707]]), 8, 0.22, W.celemekBayang, W.celemekTerang, 0.9),
      // kerut pendek di bawah tali (kain dikerutkan ke tali pinggang)
      ...[182, 232, 280].flatMap((x) => lipatan([[x, 462], [x + 1, 490]], 4, 0.16, W.celemekBayang, W.celemekTerang, 0)),
    );
    // saku tempel kecil (sisi dekat) dengan lis jingga di bibir saku
    const saku: T2[] = L([[226, 530], [268, 526], [270, 578], [229, 582]]);
    items.push({ k: 'bentuk', p: saku, isi: () => `fill="${W.celemek}"`, garis: 0.7, warnaGaris: W.celemekBayang, lurus: true });
    items.push({ k: 'isi', p: [...saku.slice(0, 2), ...saku.slice(0, 2).map(([x, y]): T2 => [x, y + 5]).reverse()], warna: W.lis, op: 0.9, lurus: true });
    items.push({ k: 'garis', p: [saku[2], saku[3]], warna: W.celemekBayang, tebal: 1.2, op: 0.35 });
  }
  // tali pinggang jingga (melingkar: tengah depan paling rendah) + simpul & dua ujung tali di pinggul dekat
  const tali: T2[] = [[131, 439], [160, 445], [196, 449], [236, 447], [272, 442], [302, 435], [303, 444], [272, 452], [236, 457], [196, 459], [160, 455], [131, 449]];
  items.push({ k: 'bentuk', p: tali, isi: (kuas) => kuas.grad('tali', '#f4a867', W.lis, '#b8591e'), garis: 0.8 });
  items.push(
    { k: 'bentuk', p: [[294, 450], [302, 452], [314, 500], [316, 524], [309, 526], [304, 502]], isi: (kuas) => kuas.grad('tali', '#f4a867', W.lis, '#b8591e'), garis: 0.7 },
    { k: 'bentuk', p: [[288, 452], [296, 452], [302, 486], [299, 508], [292, 506], [291, 482]], isi: (kuas) => kuas.grad('tali', '#f4a867', W.lis, '#b8591e'), garis: 0.7 },
    { k: 'elips', c: [296, 447], rx: 6.5, ry: 5.5, warna: '#d66d2a', op: 1, garis: 0.7 },
  );
  return items;
}

function susunBerdiri(pose: PoseNasabah, e: Ekspresi, r: Raut, kunci: boolean, kecil: boolean, kanan: boolean): Susunan {
  const b = r.bahu;
  const jalan = pose === 'jalan-a' || pose === 'jalan-b';
  // badan sedikit turun saat melangkah (berat berpindah); dua langkah beda 1,5 satuan = ayun naik-turun kecil
  const turun = pose === 'jalan-a' ? 8 : pose === 'jalan-b' ? 6.5 : 0;
  const lk = jalan ? LANGKAH[pose] : null;
  // menghadap kanan (ke pintu) = sedang pergi: gestur kepergian (kunci / tangan turun), kunci di tangan jauh
  const g = kanan && pose === 'berdiri' ? gesturUntuk('berdiri-pergi', e) : gesturUntuk(pose, e);
  const items: { lapis: string; it: Item }[] = [];
  const add = (lapis: string, ...its: Item[]): void => {
    for (const it of its) items.push({ lapis, it: lapis === 'badan0' && turun ? geserItem(it, 0, turun) : it });
  };
  // kepala: ekspresi menggeser sedikit (angguk maju / mundur)
  const kepala: T2 = [210 + (r.angguk > 0 ? -r.angguk * 0.6 : -r.angguk * 0.3), 120 + turun + b * 0.4 + Math.max(0, r.angguk) * 0.4];

  // ---- kaki -------------------------------------------------------------------------------------------------
  let kakiJ: [T2, T2, T2], kakiD: [T2, T2, T2];
  let sepJ = { skala: 0.95, angkat: 0 }, sepD = { skala: 1, angkat: 0 };
  if (pose === 'jalan-a') {
    // kaki dekat melangkah maju (kiri-bawah), kaki jauh di belakang dengan tumit terangkat
    kakiD = [[242, 560 + turun], [214, 758], [180, 952]];
    kakiJ = [[190, 562 + turun], [214, 752], [240, 924]];
    sepD = { skala: 1, angkat: -12 };
    sepJ = { skala: 0.95, angkat: 30 };
  } else if (pose === 'jalan-b') {
    kakiJ = [[190, 562 + turun], [168, 752], [138, 940]];
    kakiD = [[242, 560 + turun], [258, 760], [272, 936]];
    sepJ = { skala: 0.95, angkat: -12 };
    sepD = { skala: 1, angkat: 30 };
  } else {
    kakiJ = [[190, 562], [192, 750], [188, 950]];
    kakiD = [[242, 564], [238, 758], [232, 962]];
    if (pose === 'berdiri-pergi') {
      // mulai berbalik ke pintu: kaki jauh (sesudah dicermin = kaki depan) sedikit melangkah
      kakiJ = [[190, 562], [180, 752], [166, 946]];
    }
  }
  // kaki jauh di balik kaki dekat
  add('kaki', ...itemKaki(kakiJ, [50, 44, 40], sepJ, kecil), ...itemKaki(kakiD, [54, 47, 43], sepD, kecil));

  // ---- lengan ----------------------------------------------------------------------------------------------
  let J: Lengan, D: Lengan;
  let tangkup: Tangkup | undefined;
  let kunciDi: TempatKunci | undefined;
  if (g === 'jalan-a' || g === 'jalan-b') {
    const lj = lenganJalan(g, turun, kanan);
    J = lj.J;
    D = lj.D;
    kunciDi = lj.kunci;
  } else {
    const lg = lenganGestur(g, b, kanan);
    J = lg.J;
    D = lg.D;
    tangkup = lg.tangkup;
    kunciDi = lg.kunci;
  }
  for (const x of itemLengan(J, kecil)) add(x.lapis, x.it);

  // ---- tunik (lis jingga di keliman) + celemek pinggang di atasnya (keduanya ikut ayunan langkah) -----------------
  add('badan0', { k: 'bentuk', p: tunikBerdiri(b, lk), isi: isiBlus, arsir: ARSIR_BLUS });
  add('badan0', ...rincianTunikBerdiri(lk, kecil));
  add('badan0', ...celemekBerdiri(lk, kecil));
  if (g === 'silang') {
    // tangan jauh terselip di balik lengan atas dekat: ujung jari muncul di tepi luarnya (di bawah lengan bawah dekat)
    const t = tepiLuarLenganAtas(D, 0.8);
    add('atas', ...itemJariSelip(t.p, t.sudut));
  }
  for (const x of itemLengan(D, kecil)) add(x.lapis, x.it);

  return {
    items,
    kepala,
    miringPose: jalan ? (pose === 'jalan-a' ? -1.5 : 1.5) : 0,
    turun,
    lebar: KANVAS_BERDIRI.w,
    tangan: { J: J.sendi[2], D: D.sendi[2] },
    kunci: kunci ? posisiKunci(kunciDi, J, D, tangkup) : undefined,
    kunciJauh: kunciDi === 'tangan-j',
    bayangKontak: [
      { k: 'elips', c: [212, 984], rx: 78, ry: 10, warna: BAYANG.kontak, op: 0.18 },
      { k: 'elips', c: [212, 984], rx: 46, ry: 5.5, warna: BAYANG.kontak, op: 0.2 },
    ],
    ...(tangkup ? { tangkupData: tangkup } : {}),
  };
}

/** Titik gantung cincin kunci: bawah kepalan (sisi kelingking), di tangan bertaut, atau titik tetap. */
function posisiKunci(k: TempatKunci | undefined, J: Lengan, D: Lengan, tangkup?: Tangkup): T2 | undefined {
  if (!k) return undefined;
  if (k === 'tangan-d' || k === 'tangan-j') {
    const [, siku, w] = (k === 'tangan-d' ? D : J).sendi;
    const tE = normal2([w[0] - siku[0], w[1] - siku[1]]);
    return tambah2(w, tE, 34);
  }
  if (k === 'tangkup') return tangkup ? [tangkup.c[0] - 4, tangkup.c[1] + 16] : undefined;
  return k;
}

function susunDuduk(pose: PoseNasabah, e: Ekspresi, r: Raut, kunci: boolean, kecil: boolean): Susunan {
  const b = r.bahu;
  const g = gesturUntuk(pose, e);
  const items: { lapis: string; it: Item }[] = [];
  const add = (lapis: string, ...its: Item[]): void => {
    for (const it of its) items.push({ lapis, it });
  };
  const condong = pose === 'duduk-condong' ? CONDONG : 0;
  /** Badan atas: geser berdiri → duduk (+20,+30), lalu condong di sekitar pinggul. */
  const B = (q: T2): T2 => (condong ? putar([q[0] + 20, q[1] + 30], PINGGUL_DUDUK, condong) : [q[0] + 20, q[1] + 30]);
  const Bc = (q: T2): T2 => (condong ? putar(q, PINGGUL_DUDUK, condong) : q);
  const kepala: T2 = B([210 + (r.angguk > 0 ? -r.angguk * 0.6 : -r.angguk * 0.3), 120 + b * 0.4 + Math.max(0, r.angguk) * 0.4]);

  // ---- tulang kering & sepatu: dari bawah lutut (kaki jauh di belakang) ke lantai. Lutut → telapak ± 257 satuan
  // (putaran 2: ± 310, lebih panjang dari berdiri); di panggung lantai kursi di luar bingkai, tampak di lembar pose.
  add('kaki', ...itemKaki(pahaP([[78, 548], [82, 676], [86, 782]]) as [T2, T2, T2], [44, 40, 36], { skala: 0.95, angkat: 0 }, kecil));
  add('kaki', ...itemKaki(pahaP([[98, 566], [103, 690], [107, 800]]) as [T2, T2, T2], [48, 43, 39], { skala: 1.02, angkat: 0 }, kecil));

  // ---- lengan ------------------------------------------------------------------------------------------------
  let J: Lengan, D: Lengan;
  let tangkup: Tangkup | undefined;
  let kunciDi: TempatKunci | undefined;
  const bJ = B(bahuJ(b)), bD = B(bahuD(b));
  if (g === 'pangkuan') {
    // kedua tangan rebah di atas paha: tangan jauh di paha jauh, tangan dekat di paha dekat dekat lutut
    // (jari tangan jauh berakhir di atas lutut, tidak melewati tepi paha yang kini lebih pendek)
    J = { sendi: [bJ, [162, 424], [182, 493]], lapisAtas: 'belakang', lapisBawah: 'badan', tangan: { jenis: 'datar', sudut: 188 }, jauh: true };
    D = { sendi: [bD, [318, 436], [228, 512]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'datar', sudut: 176, cermin: true } };
    kunciDi = [196, 528];
  } else if (g === 'meja' || g === 'meja-genggam') {
    // bersiap pergi: badan condong 11° dari pinggul; tangan jauh bertumpu di tepi meja (tepi dekat meja ± y 490
    // kanvas duduk), tangan dekat menggenggam kunci di atas paha (remote tergantung di sisi paha)
    J = { sendi: [bJ, [118, 428], [96, 474]], lapisAtas: 'belakang', lapisBawah: 'atas', tangan: g === 'meja' ? { jenis: 'datar', sudut: 192 } : null, jauh: true };
    D = { sendi: [bD, [272, 416], [172, 494]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: g === 'meja' ? { jenis: 'kepal', sudut: 160, cermin: true } : null };
    if (g === 'meja-genggam') {
      tangkup = { c: [146, 488], skala: 1, lapis: 'atas', miring: -8 };
      J = { ...J, sendi: [bJ, [122, 430], [118, 484]] };
      D = { ...D, sendi: [bD, [268, 420], [178, 492]] };
    }
    kunciDi = g === 'meja' ? 'tangan-d' : 'tangkup';
  } else if (g === 'telepon') {
    // telepon: siku dekat turun, lengan bawah naik ke telinga; tangan jauh menyangga siku
    J = { sendi: [bJ, [154, 410], [236, 442]], lapisAtas: 'belakang', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: 4, cermin: true }, jauh: true };
    D = { sendi: [bD, [322, 386], [284, 232]], lapisAtas: 'badan', lapisBawah: 'atas', tangan: null };
  } else {
    const lg = lenganGestur(g, b);
    const geserL = (L: Lengan): Lengan => ({ ...L, sendi: [B(L.sendi[0]), B(L.sendi[1]), B(L.sendi[2])] });
    J = geserL(lg.J);
    D = geserL(lg.D);
    if (g === 'dada') {
      // tangan jauh di pangkuan (bukan tergantung)
      J = { sendi: [bJ, [164, 424], [182, 495]], lapisAtas: 'belakang', lapisBawah: 'badan', tangan: { jenis: 'datar', sudut: 188 }, jauh: true };
    }
    if (g === 'genggam') {
      // tangan bertaut di pangkuan (lebih rendah dari berdiri), bahu naik
      J = { ...J, sendi: [J.sendi[0], [166, 424], [190, 488]] };
      D = { ...D, sendi: [D.sendi[0], [314, 424], [256, 492]] };
      tangkup = { c: [222, 494], skala: 1, lapis: 'atas', miring: -4 };
    } else if (lg.tangkup) {
      tangkup = { ...lg.tangkup, c: B(lg.tangkup.c) };
    }
    kunciDi = lg.kunci === 'tangkup' || lg.kunci === 'tangan-d' || lg.kunci === 'tangan-j' ? lg.kunci : lg.kunci ? B(lg.kunci as T2) : undefined;
    if (g === 'dada') kunciDi = [206, 528];
  }
  for (const x of itemLengan(J, kecil)) add(x.lapis, x.it);

  // ---- tunik: badan + pangkuan (paha & lutut di balik kain) + celemek rebah di pangkuan ---------------------------
  add('badan0', { k: 'bentuk', p: tunikDuduk(b, Bc), isi: isiBlus, arsir: ARSIR_BLUS_DUDUK });
  if (!kecil) {
    add(
      'badan0',
      // pinggul belakang & bokong (tidak tertutup celemek): lipatan tarik ke dudukan
      ...lipatan([Bc([306, 480]), [322, 522], [326, 560]], 4, 0.2, W.blusBayang, W.blusSorot),
      ...lipatan([Bc([188, 376]), Bc([194, 430]), Bc([190, 466])], 4, 0.14, W.blusBayang, W.blusSorot),
      { k: 'garis', p: [Bc([219, 362]), Bc([215, 420]), Bc([213, 452])], warna: W.blusBayang, tebal: 1.2, op: 0.4 },
    );
    for (const y of [382, 414, 446]) add('badan0', { k: 'elips', c: Bc([218 - (y - 362) * 0.06, y]), rx: 2.6, ry: 2.6, warna: W.blusTua, op: 1, garis: 0.6 });
  }
  add('badan0', ...celemekDuduk(Bc, kecil));
  if (g === 'silang') {
    const t = tepiLuarLenganAtas(D, 0.8);
    add('atas', ...itemJariSelip(t.p, t.sudut));
  }
  for (const x of itemLengan(D, kecil)) add(x.lapis, x.it);

  const tangan: Susunan['tangan'] = { J: J.sendi[2], D: D.sendi[2] };
  return {
    items,
    kepala,
    miringPose: condong ? 2 : 0,
    lebar: KANVAS_DUDUK.w,
    tangan,
    kunci: kunci ? posisiKunci(kunciDi, J, D, tangkup) : undefined,
    bayangKontak:
      pose === 'telepon'
        ? []
        : [
            // telapak di lantai + bayang kontak di dudukan kursi: tepat di bawah pinggul (di belakang badan, hanya tepi
            // kanan & bawah bokong yang tampak). Kecil: berakhir di x <= 348 kanvas (dunia ± 1185), tidak menjalar ke
            // sisi kursi (ruang-3: elips lebar 120 tampak sebagai pita gelap di tepi bawah panggung).
            { k: 'elips', c: paha([98, 824]), rx: 66, ry: 8.5, warna: BAYANG.kontak, op: 0.18 },
            { k: 'elips', c: [268, 580], rx: 80, ry: 12, warna: BAYANG.kontak, op: 0.25 },
          ],
    ...(tangkup ? { tangkupData: tangkup } : {}),
  };
}

// -----------------------------------------------------------------------------------------------------------------
// DUDUK-TURUN: bingkai antara berdiri ↔ duduk (hanya animasi panggung: datang lalu duduk; bangkit untuk pergi)
// -----------------------------------------------------------------------------------------------------------------

/** Pinggul (tengah panggul) pose berdiri di kanvas berdiri: di antara pangkal kaki jauh (190) & dekat (242). */
const PINGGUL_BERDIRI_T2: T2 = [216, 562];
/**
 * Badan atas duduk-turun = badan atas berdiri digeser (+56, +84) lalu condong TURUN_CONDONG di pinggul: pinggul turun
 * ± separuh jalan ke dudukan (berdiri → duduk di panggung: ± 164 satuan kanvas) dan mundur ± 60 di belakang telapak
 * (duduk ke belakang), badan condong sedikit ke depan (ke meja) seperti orang yang menurunkan badan ke kursi.
 */
const TURUN_GESER: T2 = [56, 84];
const TURUN_CONDONG = -6;
const PINGGUL_TURUN_T2: T2 = [PINGGUL_BERDIRI_T2[0] + TURUN_GESER[0], PINGGUL_BERDIRI_T2[1] + TURUN_GESER[1]];
const atasTurun = (q: T2): T2 => putar([q[0] + TURUN_GESER[0], q[1] + TURUN_GESER[1]], PINGGUL_TURUN_T2, TURUN_CONDONG);

/** Pinggul pose `duduk-turun` di kanvasnya (kanvas BERDIRI, telapak di jangkar 210,985). Untuk panggung. */
export const PINGGUL_TURUN: Titik = { x: PINGGUL_TURUN_T2[0], y: PINGGUL_TURUN_T2[1] };
/** Pinggul pose berdiri di kanvas berdiri. Untuk panggung. */
export const PINGGUL_BERDIRI: Titik = { x: PINGGUL_BERDIRI_T2[0], y: PINGGUL_BERDIRI_T2[1] };

/**
 * Kanvas & arti jangkar sebuah pose Bu Rina: 'berdiri' = KANVAS_BERDIRI, jangkar = telapak (berdiri, jalan, pergi,
 * DUDUK-TURUN); 'duduk' = KANVAS_DUDUK, jangkar = pinggul di dudukan (duduk, duduk-condong, telepon). Catatan:
 * `pose.startsWith('duduk')` SALAH untuk duduk-turun (jangkarnya telapak, bukan pinggul).
 */
export function kanvasPoseRina(pose: PoseNasabah): 'berdiri' | 'duduk' {
  return POSE_DUDUK.has(pose) ? 'duduk' : 'berdiri';
}

/**
 * Titik dunia untuk jangkar (telapak) pose `duduk-turun` supaya pinggulnya jatuh pada fraksi `t` (bawaan ½) di antara
 * pinggul berdiri (gambar berdiri dengan telapak di `berdiri`) dan pinggul duduk (`duduk` = jangkar pose duduk), pada
 * skala `skala` yang sama. Di kantor (TEMPAT_MEJA, s 1,05): telapak ± (1038, 1029), setinggi lantai berdiri (1031).
 */
export function titikTurunRina(berdiri: Titik, duduk: Titik, skala: number, t = 0.5): Titik {
  const J = KANVAS_BERDIRI.jangkar;
  const pb = { x: berdiri.x + (PINGGUL_BERDIRI.x - J.x) * skala, y: berdiri.y + (PINGGUL_BERDIRI.y - J.y) * skala };
  const tujuan = { x: lerp(pb.x, duduk.x, t), y: lerp(pb.y, duduk.y, t) };
  return { x: tujuan.x - (PINGGUL_TURUN.x - J.x) * skala, y: tujuan.y - (PINGGUL_TURUN.y - J.y) * skala };
}

/** Kaki duduk-turun [pangkal paha, lutut, pergelangan kaki]: telapak tetap di lantai, lutut maju ke kiri. */
const KAKI_TURUN_J: [T2, T2, T2] = [[238, 640], [128, 732], [188, 950]];
const KAKI_TURUN_D: [T2, T2, T2] = [[282, 652], [150, 748], [232, 962]];
/** Keliman tunik duduk-turun: depan di lutut jauh → atas lutut dekat → sepanjang bawah paha dekat → bawah bokong. */
const KELIM_TURUN: T2[] = [[104, 724], [116, 732], [134, 738], [156, 748], [180, 754], [218, 740], [258, 721], [296, 703], [328, 688], [350, 674]];

/**
 * Tunik duduk-turun: badan atas = berdiri (atasTurun); di bawah pinggang kain menutup perut, puncak paha jauh (turun ±
 * 40° ke lutut), dan bawah paha dekat. Tunik selutut TERTARIK naik oleh lutut yang menekuk: keliman di lutut, jadi
 * tempurung lutut & tulang kering (celana) tampak; bokong mundur ke kanan (duduk ke belakang).
 */
function tunikTurun(b: number): T2[] {
  const depan: T2[] = [[176, 214 + b], [150, 230 + b], [134, 258], [124, 300], [126, 342], [136, 392], [131, 452]];
  // perut → kain menjembatani lipat paha → puncak paha jauh → atas lutut jauh → keliman → bokong
  const bawah: T2[] = [[182, 572], [186, 598], [182, 626], [166, 652], [146, 674], [126, 694], [110, 710], ...KELIM_TURUN, [360, 650], [362, 620], [356, 588], [348, 556]];
  const belakang: T2[] = [[300, 436], [304, 360], [310, 296], [300, 250 + b], [272, 226 + b], [230, 212 + b]];
  return [...depan.map(atasTurun), ...bawah, ...belakang.map(atasTurun)];
}

/**
 * Celemek duduk-turun: kain yang sama (tali pinggang ikut badan atas; panel rebah di perut & puncak paha, jurai pendek
 * di sisi paha dekat, jatuh sedikit melewati lutut). Lis jingga di keliman & tepi dekat, simpul di pinggul dekat, kedua
 * ujung tali tergantung tegak.
 */
function celemekTurun(kecil: boolean): Item[] {
  const items: Item[] = [];
  const T = (p: T2[]): T2[] => p.map(atasTurun);
  const taliAtas = T([[131, 439], [160, 445], [196, 449], [236, 447], [272, 442], [302, 435]]);
  const taliBawah = T([[303, 444], [272, 452], [236, 457], [196, 459], [160, 455], [131, 449]]);
  // punggung paha dekat (garis patah puncak ↔ sisi) & keliman jurai (± 20 di bawahnya) → sudut di lutut → jatuhan
  const punggung: T2[] = [[330, 590], [300, 618], [264, 646], [226, 674], [190, 700], [160, 720], [140, 730]];
  const kelim: T2[] = [[346, 610], [312, 638], [272, 666], [232, 692], [194, 716], [166, 734], [150, 742], [138, 748], [122, 746], [108, 740], [99, 734]];
  const panel: T2[] = [
    ...taliBawah.slice().reverse(),
    [348, 548], [350, 580],
    ...kelim,
    [97, 720], [104, 706], [118, 692], [138, 674], [158, 656], [174, 634], [181, 610], [182, 584], [179, 562],
  ];
  // bayang jatuh celemek di tunik (di bawah jurai)
  items.push({ k: 'isi', p: [...kelim.slice(0, 7), ...kelim.slice(0, 7).map(([x, y]): T2 => [x + 2, y + 7]).reverse()], warna: W.blusBayang, op: 0.3 });
  items.push({ k: 'bentuk', p: panel, isi: isiCelemek, garis: 0.9, arsir: { sorot: [[W.celemekTerang, 6, 0.25]] } });
  if (!kecil) {
    // bayang perut di pangkal pangkuan (di bawah tali) & jurai sisi paha dekat (menjauhi cahaya)
    items.push({ k: 'isi', p: [...taliBawah, ...taliBawah.map(([x, y]): T2 => [x - 3, y + 13]).reverse()], warna: W.celemekBayang, op: 0.16 });
    items.push({ k: 'isi', p: [...punggung, ...kelim.slice(0, 7).reverse()], warna: W.celemekBayang, op: 0.18 });
    items.push(
      // kerut pendek di jurai (kain menggantung di sisi paha)
      ...([[304, 624], [258, 656], [212, 688]] as T2[]).flatMap(([x, y]) => lipatan([[x, y + 3], [x + 2, y + 11], [x + 3, y + 19]], 4.5, 0.16, W.celemekBayang, W.celemekTerang, 0)),
      // lembah di lipat paha (kain melesak antara perut & paha) dan satu lipatan tarik ke lutut
      ...lipatan([[318, 566], [270, 592], [224, 620], [188, 640]], 7, 0.18, W.celemekBayang, W.celemekTerang, 0.9),
      ...lipatan([[176, 660], [150, 690], [128, 716]], 5, 0.15, W.celemekBayang, W.celemekTerang, 0.8),
    );
    // punggung terang di garis patah paha dekat; puncak lutut jauh di bawah kain
    items.push({ k: 'garis', p: punggung, warna: W.celemekTerang, tebal: 2.4, op: 0.7 });
    items.push({ k: 'elips', c: [116, 706], rx: 12, ry: 5, warna: W.celemekTerang, op: 0.45, sudut: -42 });
  }
  const atasLis: T2[] = kelim.map(([x, y]): T2 => [x, y - 6.5]);
  items.push({ k: 'isi', p: [...atasLis, ...kelim.map(([x, y]): T2 => [x, y + 1.2]).reverse()], warna: W.lis, op: 0.95 });
  items.push({ k: 'garis', p: [T([[300, 452]])[0], [349, 560], [350, 586], [347, 604]], warna: W.lis, tebal: 2.6, op: 0.9 });
  const isiTali = (kuas: Kuas): string => kuas.grad('tali', '#f4a867', W.lis, '#b8591e');
  items.push({ k: 'bentuk', p: [...taliAtas, ...taliBawah], isi: isiTali, garis: 0.8 });
  // simpul di pinggul dekat; kedua ujung tali tergantung TEGAK (gravitasi), tidak ikut condong badan
  const [sx, sy] = atasTurun([296, 447]);
  items.push(
    { k: 'bentuk', p: [[sx + 2, sy + 3], [sx + 9, sy + 4], [sx + 13, sy + 46], [sx + 12, sy + 72], [sx + 5, sy + 73], [sx + 5, sy + 46]], isi: isiTali, garis: 0.7 },
    { k: 'bentuk', p: [[sx - 5, sy + 4], [sx + 2, sy + 5], [sx + 4, sy + 36], [sx + 1, sy + 56], [sx - 6, sy + 55], [sx - 4, sy + 34]], isi: isiTali, garis: 0.7 },
    { k: 'elips', c: [sx, sy], rx: 6.5, ry: 5.5, warna: '#d66d2a', op: 1, garis: 0.7 },
  );
  return items;
}

/**
 * Pose `duduk-turun` (kanvas BERDIRI, telapak di jangkar 210,985; menghadap 3/4 kiri): telapak tetap di lantai, lutut
 * menekuk ke depan (kiri), pinggul setengah turun & mundur di atas dudukan, badan atas condong 6° ke depan, kedua
 * tangan meraih ke arah lutut/lengan kursi. Wajah & bahu mengikuti ekspresi (RAUT); gestur tangan tetap `raih`. Kunci
 * (bila `kunci`) tergantung di kepalan tangan dekat seperti pose berdiri/jalan. Arah hadap selalu kiri.
 */
function susunTurun(r: Raut, kunci: boolean, kecil: boolean): Susunan {
  const b = r.bahu;
  const items: { lapis: string; it: Item }[] = [];
  const add = (lapis: string, ...its: Item[]): void => {
    for (const it of its) items.push({ lapis, it });
  };
  const kepala = atasTurun([210 + (r.angguk > 0 ? -r.angguk * 0.6 : -r.angguk * 0.3), 120 + b * 0.4 + Math.max(0, r.angguk) * 0.4]);

  // ---- kaki: telapak di lantai (seperti berdiri), lutut menekuk ke depan, paha turun ke pinggul yang mundur ----------
  add('kaki', ...itemKaki(KAKI_TURUN_J, [50, 44, 40], { skala: 0.95, angkat: 0 }, kecil));
  add('kaki', ...itemKaki(KAKI_TURUN_D, [54, 47, 43], { skala: 1, angkat: 0 }, kecil));

  // ---- lengan: meraih ke lutut / lengan kursi ---------------------------------------------------------------------
  const bJ = atasTurun(bahuJ(b)), bD = atasTurun(bahuD(b));
  const J: Lengan = { sendi: [bJ, [158, 468], [136, 558]], lapisAtas: 'belakang', lapisBawah: 'belakang', tangan: { jenis: 'lepas', sudut: 110, cermin: true }, jauh: true };
  const D: Lengan = kunci
    ? { sendi: [bD, [312, 468], [254, 556]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'kepal', sudut: 128, cermin: true } }
    : { sendi: [bD, [312, 468], [252, 556]], lapisAtas: 'badan', lapisBawah: 'badan', tangan: { jenis: 'lepas', sudut: 122, cermin: true } };
  for (const x of itemLengan(J, kecil)) add(x.lapis, x.it);

  // ---- tunik + rincian + keliman + celemek -----------------------------------------------------------------------
  add('badan0', { k: 'bentuk', p: tunikTurun(b), isi: isiBlus, arsir: ARSIR_BLUS });
  // keliman tunik: pita biru tua + lis jingga (sama dengan berdiri), mengikuti keliman yang tertarik lutut
  const atasKelim: T2[] = KELIM_TURUN.map(([x, y], i): T2 => [x + (i === 0 ? 2 : 0), y - 20]);
  add('badan0', { k: 'isi', p: [...atasKelim, ...KELIM_TURUN.slice().reverse()], warna: W.blusBayang, op: 0.32 });
  add('badan0', { k: 'garis', p: atasKelim, warna: W.lis, tebal: 2.2, op: 0.9 });
  if (!kecil) {
    add(
      'badan0',
      // bokong & bawah paha: kain tertarik dari bokong ke belakang lutut
      ...lipatan([[346, 600], [356, 632], [346, 664]], 4, 0.2, W.blusBayang, W.blusSorot),
      ...lipatan([[322, 664], [270, 690], [212, 718]], 5, 0.2, W.blusBayang, W.blusSorot, 0.6),
      ...lipatan(([[168, 344], [176, 420], [170, 470]] as T2[]).map(atasTurun), 4, 0.14, W.blusBayang, W.blusSorot),
      { k: 'garis', p: ([[199, 332], [195, 400], [193, 452]] as T2[]).map(atasTurun), warna: W.blusBayang, tebal: 1.2, op: 0.4 },
    );
    for (const y of [352, 384, 416]) add('badan0', { k: 'elips', c: atasTurun([198 - (y - 332) * 0.06, y]), rx: 2.6, ry: 2.6, warna: W.blusTua, op: 1, garis: 0.6 });
  }
  add('badan0', ...celemekTurun(kecil));
  for (const x of itemLengan(D, kecil)) add(x.lapis, x.it);

  return {
    items,
    kepala,
    miringPose: 1.5,
    lebar: KANVAS_BERDIRI.w,
    tangan: { J: J.sendi[2], D: D.sendi[2] },
    kunci: kunci ? posisiKunci('tangan-d', J, D) : undefined,
    bayangKontak: [
      { k: 'elips', c: [212, 984], rx: 80, ry: 10, warna: BAYANG.kontak, op: 0.18 },
      { k: 'elips', c: [212, 984], rx: 48, ry: 5.5, warna: BAYANG.kontak, op: 0.2 },
    ],
  };
}

// =================================================================================================================
// gambarBuRina
// =================================================================================================================

interface OpsiInternal extends OpsiBuRina {
  /** Tanpa id sama sekali (gradien → warna datar). Dipakai nasabah.ts (potongan setengah badan lama). */
  polos?: boolean;
}

const cache = buatCache<GambarTokoh>(160);

/**
 * Gambar Bu Rina. Arah hadap (`hadap`): bawaan kiri (ke meja/Miss Raksa). 'kanan' didukung untuk pose BERDIRI:
 * berdiri, jalan-a, jalan-b (dan berdiri-pergi, yang selalu menghadap kanan). Badan dirakit menghadap kiri lalu
 * titiknya dicerminkan SEBELUM diarsir (cahaya tetap kiri atas); kepala digambar ulang dari model 3D menoleh ke kanan
 * (bukan dicerminkan), bros tetap di bawah dagu, kunci tetap di tangan kiri anatomis (tangan jauh = `tangan.kanan`
 * layar). Pose duduk mengabaikan `hadap`.
 */
export function gambarBuRina(opsi: OpsiBuRina): GambarTokoh {
  const o = opsi as OpsiInternal;
  const kunciCache = [o.id ?? '', o.pose, o.ekspresi, o.pandang ?? '', o.bicara ? 1 : 0, o.kedip ? 1 : 0, o.kecil ? 1 : 0, o.kunci ? 1 : 0, o.polos ? 1 : 0, o.hadap ?? ''].join('|');
  const hasil = cache.ambil(kunciCache, () => buat(o));
  return { ...hasil, jangkar: { ...hasil.jangkar }, kepala: { ...hasil.kepala }, tangan: hasil.tangan ? { ...hasil.tangan } : undefined };
}

/**
 * Versi TANPA id sama sekali (gradien → warna datar, tanpa clipPath) untuk SVG yang disisipkan inline berkali-kali
 * di satu halaman tanpa awalan unik (nasabah.ts `nasabahSetengahBadan`).
 */
export function gambarBuRinaPolos(opsi: Omit<OpsiBuRina, 'id'>): GambarTokoh {
  return gambarBuRina({ ...opsi, polos: true } as OpsiInternal);
}

/** Pose + arah hadap yang benar-benar digambar menghadap kanan (untuk uji & panggung). */
export function menghadapKanan(pose: PoseNasabah, hadap?: 'kiri' | 'kanan'): boolean {
  return pose === 'berdiri-pergi' || (hadap === 'kanan' && (pose === 'berdiri' || pose === 'jalan-a' || pose === 'jalan-b'));
}

function buat(o: OpsiInternal): GambarTokoh {
  const id = o.id ?? ID_BAWAAN_RINA;
  const kuas = new Kuas(id, !!o.polos, !!o.kecil);
  const pose: PoseNasabah = o.pose;
  const duduk = POSE_DUDUK.has(pose);
  const K = duduk ? KANVAS_DUDUK : KANVAS_BERDIRI;
  const r = RAUT[o.ekspresi] ?? RAUT.netral;
  const kanan = menghadapKanan(pose, o.hadap);
  const arah = o.pandang ?? pandangBawaan(kanan ? 'berdiri-pergi' : pose);
  const pd = (kanan ? PANDANG_KANAN : PANDANG_KIRI)[arah];
  const turunPose = pose === 'duduk-turun';
  // badan atas dipindah dari koordinat berdiri (duduk/condong/duduk-turun): kerudung & rinciannya ikut dipetakan
  const atasPindah = duduk || turunPose;
  const sus = duduk
    ? susunDuduk(pose, o.ekspresi, r, !!o.kunci, kuas.kecil)
    : turunPose
      ? susunTurun(r, !!o.kunci, kuas.kecil)
      : susunBerdiri(pose, o.ekspresi, r, !!o.kunci, kuas.kecil, kanan);

  // Kepala dihitung di dunia AKHIR (tanpa cermin; arsir wajah tetap dari kiri atas). Busur kubah untuk kerudung
  // dihitung pada toleh dasar (menghadap kiri) supaya dapat dicerminkan bersama badan.
  const kepalaAkhir: T2 = kanan ? [K.w - sus.kepala[0], sus.kepala[1]] : sus.kepala;
  const miringDasar = sus.miringPose;
  const kep = gambarKepala({ kuas, raut: r, pd, bicara: !!o.bicara, kedip: !!o.kedip, miringPose: kanan ? -miringDasar : miringDasar });
  // busur kubah di koordinat dasar (sebelum cermin): pakai toleh bercermin
  const pdDasar: Pandang = kanan ? { ...pd, toleh: -pd.toleh } : pd;
  const rDasar: Raut = kanan ? { ...r, miring: -r.miring } : r;
  const kepDasar = kanan ? gambarKepalaKubah(rDasar, pdDasar, miringDasar) : { kubah: kep.kubah, dagu: kep.dagu };
  const kubahKanvas = kepDasar.kubah.map((q): T2 => [q[0] + sus.kepala[0], q[1] + sus.kepala[1]]);
  const daguKanvas: T2 = [kepDasar.dagu[0] + sus.kepala[0], kepDasar.dagu[1] + sus.kepala[1]];

  // ---- kerudung (khimar): busur kubah + juntaian (satu siluet, satu gradien) + bidang cahaya & lipatan ------------
  const turun = sus.turun ?? 0;
  const juntai = atasPindah ? juntaiDuduk(pose, r.bahu, sus.kepala) : juntaiBerdiri(r.bahu, sus.kepala, turun);
  const kerudungP: T2[] = [...kubahKanvas, ...juntai];
  // bayang jatuh kerudung di tunik & lengan atas (kain berlapis di atas badan)
  const tepiBawah = sampel(juntai.slice(KELIM_KERUDUNG[0], KELIM_KERUDUNG[1]), false, 3);
  // garis tepi kerudung lebih tipis dari badan (kain ringan; keliman tidak tampak seperti pinggiran karet tebal)
  const itemKerudung: Item[] = [
    { k: 'isi', p: [...tepiBawah, ...tepiBawah.map(([x, y]): T2 => [x + 5, y + 10]).reverse()], warna: W.blusBayang, op: 0.13, lurus: true },
    { k: 'isi', p: [...tepiBawah, ...tepiBawah.map(([x, y]): T2 => [x + 2.5, y + 5]).reverse()], warna: W.blusBayang, op: 0.16, lurus: true },
    { k: 'bentuk', p: kerudungP, isi: isiKerudung, arsir: ARSIR_KERUDUNG, garis: 0.8 },
  ];
  // Rincian ditulis di koordinat BERDIRI lalu dipetakan ke pose (duduk/condong, turun saat jalan).
  const Bk = (q: T2): T2 => (atasPindah ? geserDudukKerudung(pose, q) : [q[0], q[1] + (q[1] > 150 ? turun : 0)]);
  const dgB: T2 = atasPindah ? balikDudukKerudung(pose, daguKanvas) : [daguKanvas[0], daguKanvas[1] - turun];
  const bb = r.bahu;
  if (!kuas.kecil) {
    const Wk = (p: T2[]): T2[] => p.map(Bk);
    // bros di koordinat berdiri: lipatan tegak menyebar dari titik semat ke ujung-ujung lipatan keliman
    const brB: T2 = [dgB[0] - 2, dgB[1] + 17];
    const KT = 0.4; // punggung lipatan kerudung redup (katun)
    const TURUN: number[] = [0.08, 0.45, 0.85, 1, 0.7]; // lipatan dari titik semat: sempit di bros, melebar ke bawah
    itemKerudung.push(
      // bidang atas bahu dekat (menghadap atas → terang) & bidang samping bahu/lengan (menjauhi cahaya → gelap)
      { k: 'isi', p: Wk([[266, 199 + bb], [282, 208 + bb], [300, 218 + bb], [312, 231 + bb], [304, 238], [288, 228], [270, 214]]), warna: W.kerudungSorot, op: 0.1 },
      { k: 'isi', p: Wk([[276, 236], [300, 240], [314, 256], [318, 280], [306, 293], [290, 291], [280, 272]]), warna: W.kerudungBayang, op: 0.16 },
      // bayang dagu jatuh di kain (lebar, dua lapis) — panel dada di bawah dagu
      { k: 'isi', p: Wk([[dgB[0] - 26, dgB[1] - 2], [dgB[0] - 6, dgB[1] + 6], [dgB[0] + 20, dgB[1] + 2], [dgB[0] + 36, dgB[1] + 10], [dgB[0] + 12, dgB[1] + 20], [dgB[0] - 18, dgB[1] + 12]]), warna: W.kerudungBayang, op: 0.14 },
      { k: 'isi', p: Wk([[dgB[0] - 14, dgB[1] + 1], [dgB[0] + 8, dgB[1] + 3], [dgB[0] + 18, dgB[1] + 8], [dgB[0] + 2, dgB[1] + 12], [dgB[0] - 10, dgB[1] + 7]]), warna: W.kerudungBayang, op: 0.14 },
      // lipatan: tiga lipatan jatuh TEGAK dari bros ke ujung lipatan keliman (lembah gelap), ayunan U pendek di bawah
      // bros, pemisah panel dada & bahu, tengkuk → bahu
      ...lipatan(Wk([[brB[0] - 5, brB[1] + 6], [brB[0] - 16, brB[1] + 48], [UJUNG_LIPAT.jauh[0] + 2, UJUNG_LIPAT.jauh[1] - 4]]), 7.5, 0.22, W.kerudungBayang, W.kerudungSorot, KT, TURUN),
      ...lipatan(Wk([[brB[0] + 1, brB[1] + 8], [brB[0] + 6, brB[1] + 60], [UJUNG_LIPAT.tengah[0], UJUNG_LIPAT.tengah[1] - 4]]), 6, 0.18, W.kerudungBayang, W.kerudungSorot, KT, TURUN),
      ...lipatan(Wk([[brB[0] + 7, brB[1] + 5], [brB[0] + 30, brB[1] + 50], [UJUNG_LIPAT.dekat[0] - 1, UJUNG_LIPAT.dekat[1] - 4]]), 8, 0.22, W.kerudungBayang, W.kerudungSorot, KT, TURUN),
      ...lipatan(Wk([[dgB[0] - 22, dgB[1] + 32], [dgB[0] - 6, dgB[1] + 46], [dgB[0] + 20, dgB[1] + 47], [dgB[0] + 42, dgB[1] + 34]]), 4.2, 0.14, W.kerudungBayang, W.kerudungSorot, 0),
      ...lipatan(Wk([[dgB[0] + 46, dgB[1] + 16], [258, 240], [270, 296]]), 4.6, 0.18, W.kerudungBayang, W.kerudungSorot, 0),
      ...lipatan(Wk([[262, 186 + bb * 0.7], [276, 212 + bb], [292, 250], [294, 286]]), 4.4, 0.18, W.kerudungBayang, W.kerudungSorot, 0),
      ...lipatan(Wk([[166, 250], [160, 280], [158, 300]]), 3.6, 0.14, W.kerudungBayang, W.kerudungSorot, 0),
      // tepi keliman: kain berbalik (garis terang tipis di atas keliman)
      { k: 'garis', p: juntai.slice(KELIM_KERUDUNG[0] + 1, KELIM_KERUDUNG[1] - 1).map(([x, y]): T2 => [x + 0.5, y - 2.2]), warna: W.kerudungSorot, tebal: 0.8, op: 0.15 },
    );
    // lipatan kubah pendek di belakang pet (kain ditarik ke belakang)
    const kb = kubahKanvas;
    const n = kb.length;
    const arcIn = kb.slice(Math.round(n * 0.4), Math.round(n * 0.66)).map((q): T2 => lerp2(q, [sus.kepala[0] + 6, sus.kepala[1] + 2], 0.2));
    itemKerudung.push({ k: 'garis', p: arcIn, warna: W.kerudungBayang, tebal: 1.4, op: 0.14 });
  } else {
    // versi kecil: satu lipatan tengah + bayang dagu (bentuk khimar tetap terbaca)
    itemKerudung.push(
      { k: 'isi', p: ([[dgB[0] - 20, dgB[1]], [dgB[0] + 22, dgB[1] + 2], [dgB[0] + 4, dgB[1] + 14]] as T2[]).map(Bk), warna: W.kerudungBayang, op: 0.22 },
      { k: 'garis', p: ([[dgB[0] + 40, dgB[1] + 18], [256, 250], [268, 300]] as T2[]).map(Bk), warna: W.kerudungBayang, tebal: 1.4, op: 0.35 },
    );
  }
  // bros kecil di bawah dagu (di tengah; tampak sama saat menghadap kanan)
  const bros: T2 = [daguKanvas[0] - 2, daguKanvas[1] + 17];
  itemKerudung.push(
    { k: 'elips', c: bros, rx: 5, ry: 5, warna: W.bros, op: 1, garis: 0.8 },
    { k: 'elips', c: [bros[0] + 1.2, bros[1] + 1.2], rx: 3, ry: 3, warna: W.brosTua, op: 0.45 },
    { k: 'elips', c: [bros[0] - 1.4, bros[1] - 1.5], rx: 1.6, ry: 1.3, warna: W.brosTerang, op: 0.95 },
  );

  // ---- tangkup (dua tangan bertaut) & kunci & telepon ----------------------------------------------------------
  const ekstra: { lapis: string; it: Item }[] = [];
  if (sus.tangkupData) {
    const t = sus.tangkupData;
    for (const it of itemTangkup(t.c, t.skala, t.miring)) ekstra.push({ lapis: t.lapis, it });
  }
  if (sus.kunci) {
    const lapisK = sus.tangkupData ? 'atas' : sus.kunciJauh ? 'belakang' : 'prop';
    for (const it of itemKunci(sus.kunci, kuas.kecil ? 1.3 : 1, pose === 'jalan-a' ? 18 : pose === 'jalan-b' ? -12 : 0)) ekstra.push({ lapis: lapisK, it });
  }
  if (pose === 'telepon') {
    // telepon genggam menempel di kerudung sisi dekat; tangan dekat menggenggamnya
    const tl: T2 = [kep.telinga[0] + kepalaAkhir[0], kep.telinga[1] + kepalaAkhir[1]];
    const hp: T2[] = [[tl[0] - 10, tl[1] - 26], [tl[0] + 12, tl[1] - 22], [tl[0] + 20, tl[1] + 30], [tl[0] - 2, tl[1] + 34]];
    ekstra.push({ lapis: 'atas', it: { k: 'bentuk', p: hp, isi: () => `fill="${W.telepon}"`, garis: 1, lurus: true, arsir: { sorot: [['#8c96a3', 2.6, 0.55]] } } });
    ekstra.push({ lapis: 'atas', it: { k: 'garis', p: [[tl[0] - 6, tl[1] - 22], [tl[0] + 3, tl[1] + 30]], warna: W.teleponLayar, tebal: 1.2, op: 0.7 } });
    const wD = sus.tangan.D ?? tl;
    const sudutT = Math.atan2(tl[1] - wD[1], tl[0] - wD[0]) / RAD;
    for (const it of itemTangan('genggam', wD, sudutT, true, 1)) ekstra.push({ lapis: 'atas', it });
  }

  // ---- rakit: cermin (bila menghadap kanan) → arsir → urut lapis ----------------------------------------------
  const semua: { lapis: string; it: Item }[] = [
    ...sus.bayangKontak.map((it) => ({ lapis: 'kontak', it })),
    ...sus.items,
    ...itemKerudung.map((it) => ({ lapis: 'kerudung', it })),
    ...ekstra,
  ];
  const lapisSvg = new Map<string, string[]>();
  for (const { lapis, it } of semua) {
    const it2 = kanan ? cerminItem(it, K.w) : it;
    const s = gambarItem(it2, kuas);
    if (!lapisSvg.has(lapis)) lapisSvg.set(lapis, []);
    lapisSvg.get(lapis)!.push(s);
  }
  const kepSvg = `<g transform="translate(${pt(kepalaAkhir)}) scale(${SKALA_KEPALA})">${kep.svg}</g>`;
  const badan = URUT_LAPIS.map((l) => (l === 'kepala' ? kepSvg : (lapisSvg.get(l) ?? []).join(''))).join('');
  const svg = `${kuas.defs.length ? `<defs>${kuas.defs.join('')}</defs>` : ''}<g stroke-linecap="round">${badan}</g>`;

  const cer = (q: T2 | undefined): Titik | undefined => (q ? { x: kanan ? K.w - q[0] : q[0], y: q[1] } : undefined);
  const tJ = cer(sus.tangan.J), tD = cer(sus.tangan.D);
  // kiri/kanan = sisi LAYAR
  const tangan: GambarTokoh['tangan'] = {};
  const pair = [tJ, tD].filter((x): x is Titik => !!x).sort((a, b) => a.x - b.x);
  if (pair[0]) tangan.kiri = pair[0];
  if (pair[1]) tangan.kanan = pair[1];
  return {
    svg,
    w: K.w,
    h: K.h,
    jangkar: { ...K.jangkar },
    kepala: { x: Math.round(kepalaAkhir[0] * 10) / 10, y: Math.round(kepalaAkhir[1] * 10) / 10 },
    tangan,
  };
}

/** Busur kubah & dagu saja (untuk pose bercermin: dihitung di koordinat dasar). */
function gambarKepalaKubah(r: Raut, pd: Pandang, miringPose: number): { kubah: T2[]; dagu: T2 } {
  const toleh = pd.toleh + r.toleh * Math.sign(pd.toleh || -1);
  const P = buatProyeksi(toleh, pd.angguk + r.angguk);
  const miring = r.miring + miringPose;
  const rot = (q: T2): T2 => putar(q, PUTAR_LEHER, miring);
  return { kubah: busurKubah(P, toleh).map(rot).map(skalaK), dagu: skalaK(rot(P(p3(0, 57.6)))) };
}

/**
 * Juntaian kerudung pose yang badan atasnya dipindah dari berdiri (duduk, condong, duduk-turun): juntaian berdiri
 * digeser lalu dicondongkan ikut badan (geserDudukKerudung).
 */
function juntaiDuduk(pose: PoseNasabah, b: number, kepala: T2): T2[] {
  return juntaiBerdiri(b, balikDudukKerudung(pose, kepala)).map((q) => geserDudukKerudung(pose, q));
}
/** Titik pose → koordinat berdiri (kebalikan geserDudukKerudung). */
function balikDudukKerudung(pose: PoseNasabah, q: T2): T2 {
  if (pose === 'duduk-turun') {
    const c = putar(q, PINGGUL_TURUN_T2, -TURUN_CONDONG);
    return [c[0] - TURUN_GESER[0], c[1] - TURUN_GESER[1]];
  }
  const c = pose === 'duduk-condong' ? putar(q, PINGGUL_DUDUK, -CONDONG) : q;
  return [c[0] - 20, c[1] - 30];
}
/** Badan atas berdiri → pose: duduk (+20,+30), condong (lalu putar di pinggul), duduk-turun (atasTurun). */
function geserDudukKerudung(pose: PoseNasabah, q: T2): T2 {
  if (pose === 'duduk-turun') return atasTurun(q);
  const g: T2 = [q[0] + 20, q[1] + 30];
  return pose === 'duduk-condong' ? putar(g, PINGGUL_DUDUK, CONDONG) : g;
}
