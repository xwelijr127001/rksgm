/**
 * RENCANA GERAK panggung v3 (docs/cerita/ADEGAN-AUTO1.md bagian 4-5): fungsi MURNI yang mengubah "komposisi lama ->
 * komposisi baru" menjadi daftar aktor sementara + keyframe Web Animations. Tidak menyentuh DOM atau state cerita.
 *
 * Prinsip (membuat lewati/selesaikan aman):
 *  - DOM panggung SELALU berisi komposisi AKHIR. Rencana hanya menambah aktor sementara (pose lama, pose jalan,
 *    salinan adegan lama) dan animasi yang menahan elemen akhir di keadaan awalnya (fill 'both').
 *  - Keyframe terakhir tiap elemen akhir = gaya bawaannya; aktor sementara bergaya bawaan tak terlihat. Jadi
 *    membatalkan semua animasi kapan pun = komposisi akhir yang benar, tanpa kedip dan tanpa tokoh hantu.
 *  - Semua animasi satu rencana memakai durasi yang sama (offset keyframe), sehingga selalu sinkron.
 *  - TANPA BADAN GANDA: dua badan tokoh yang sama (pose lama & baru) tidak pernah sama-sama terlihat > 25 %. Ganti
 *    pose = tukar SEKETIKA di titik gerak (antisipasi kecil pada pose lama, lalu pose baru menetap: turun saat
 *    duduk, naik saat berdiri, angguk kecil di tempat), bukan silang-pudar. Bila tempat berdiri & duduk berbeda
 *    (Miss Raksa berdiri 60 satuan di kiri kursinya), jarak itu DIBAGI DUA: pose lama bergeser separuh jalan selama
 *    antisipasi, pose baru muncul di separuh sisanya lalu meluncur ke tempatnya (gerak mendatar bersambung, tanpa
 *    lompatan). Pindah lokasi: tokoh di adegan baru baru memudar masuk sesudah salinan adegan lama <= 25 %; KECUALI
 *    tokoh yang tetap di kursinya (lokasi lain di ruang yang sama, mis. meja -> telepon): ia tidak ikut larut
 *    (tetap penuh terlihat) dan posenya ditukar seketika saat larut selesai.
 *
 * Target animasi (atribut `data-aktor` di panggung): 'kamera', 'pintu', 'chip', 'telepon-sisip',
 * 'tokoh:mentor', 'tokoh:nasabah', 'prop:<id>', dan aktor sementara 'x:<kunci>' (+ 'x:<kunci>:<salinan>' untuk pose
 * jalan, 'x:<kunci>:kamera' untuk dunia salinan adegan).
 */
import type { Titik } from '../../seni/tokoh';
import type { AksiAdegan } from '../../tipe';
import { cariTokoh, titikDunia, type LetakProp, type LetakTokoh, type OpsiTokoh, type SiapaTokoh, type SusunanAdegan, Z } from './dunia';
import { samaKamera, transformKamera, type Kamera } from './kamera';
import { kunciTergambar, pikselDari, titikKisi } from './piksel';

export type JenisRencana = 'pembuka' | AksiAdegan | 'ganti';

/** Salinan pose di dalam pejalan (bergantian terlihat). */
export interface SalinanJalan {
  id: string;
  opsi: OpsiTokoh;
  /**
   * Dicerminkan horizontal di sekitar jangkar (berjalan ke arah sebaliknya). Hanya cadangan bila generator tidak
   * mendukung `hadap: 'kanan'` (cermin ikut membalik detail asimetris tokoh).
   */
  cermin: boolean;
}

export type AktorTransien =
  /** Tokoh diam sementara (pose lama, pose antara). Gaya bawaan: tak terlihat. */
  | { jenis: 'tokoh'; kunci: string; letak: LetakTokoh }
  /** Pejalan: titik jangkar di `titik0` (skala 1), bergerak lewat transform; salinan pose bergantian. */
  | { jenis: 'jalan'; kunci: string; titik0: Titik; z: number; salinan: SalinanJalan[] }
  | { jenis: 'prop'; kunci: string; prop: LetakProp }
  /**
   * Salinan satu adegan utuh (dunia sendiri, kamera sendiri) di atas panggung. `menyatu` = tokoh salinan ini yang
   * tepat menutupi badannya di dunia utama (tempat, pose & kamera sama) selama salinan terlihat: satu badan yang
   * sama (tidak ikut larut), bukan dua badan.
   */
  | { jenis: 'adegan'; kunci: string; susunan: SusunanAdegan; kamera: Kamera; tanpaTokoh: boolean; menyatu?: SiapaTokoh[] }
  /** Eksterior gedung (slot aset; hanya bila konfigurasi episode menyediakannya). */
  | { jenis: 'eksterior'; kunci: string; nama: string; aset: string };

export interface GerakAktor {
  target: string;
  keyframes: Keyframe[];
}

export interface Rencana {
  jenis: JenisRencana;
  /** Durasi semua animasi rencana ini (md). */
  durasi: number;
  aktor: AktorTransien[];
  gerak: GerakAktor[];
  /** Tombol "Lewati pembuka" tampil selama rencana ini berjalan. */
  lewati: boolean;
}

// ------------------------------------------------------------------ jejak keyframe

type Nilai = string | number;
/** Titik jejak: waktu (md), nilai, easing segmen SESUDAH titik ini. */
export type Jejak = [number, Nilai, string?];

/**
 * Keyframe satu properti dari titik waktu (md) pada durasi T. Titik 0 & T ditambahkan dari nilai pertama/terakhir;
 * dua titik di waktu yang sama = lompatan (tanpa interpolasi).
 */
export function kf(prop: string, T: number, jejak: readonly Jejak[]): Keyframe[] {
  const urut = [...jejak].sort((a, b) => a[0] - b[0]);
  if (!urut.length) return [];
  if (urut[0]![0] > 0) urut.unshift([0, urut[0]![1]]);
  if (urut[urut.length - 1]![0] < T) urut.push([T, urut[urut.length - 1]![1]]);
  return urut.map(([t, v, e]) => {
    const k: Keyframe = { offset: Math.min(1, Math.max(0, t / T)), [prop]: v };
    if (e) k.easing = e;
    return k;
  });
}

const OUT = 'cubic-bezier(.2,.7,.3,1)';
const IN_OUT = 'cubic-bezier(.45,0,.3,1)';

/** Pudar masuk: tak terlihat sampai `t0`, penuh di `t1`. */
const pudarMasuk = (T: number, t0: number, t1: number) => kf('opacity', T, [[0, 0], [t0, 0], [t1, 1]]);
/** Pudar keluar: penuh sampai `t0`, hilang di `t1`. */
const pudarKeluar = (T: number, t0: number, t1: number) => kf('opacity', T, [[0, 1], [t0, 1], [t1, 0]]);

/** Jarak mendatar (satuan dunia) dibagi dua untuk tukar pose: [separuh pertama (pose lama), separuh sisanya (baru)]. */
const bagiDua = (dx: number): [number, number] => {
  const a = Math.round(dx / 2);
  return [a, Math.round(dx) - a];
};

/** Transform elemen `gerak` (di dalam tokoh berskala s): geser dalam satuan DUNIA. */
const geser = (dx: number, dy: number, s: number) => `translate(${r2(dx / (s || 1))}px, ${r2(dy / (s || 1))}px)`;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Turun menetap (meletakkan prop): dari `naik` satuan dunia di atas ke posisinya. */
function menetap(T: number, t0: number, t1: number, naik: number, s: number): Keyframe[] {
  return kf('transform', T, [[0, geser(0, -naik, s)], [t0, geser(0, -naik, s), OUT], [t1, geser(0, 0, s)]]);
}

/**
 * Pecahan durasi larut lokasi saat tokoh di adegan baru mulai memudar masuk. Salinan adegan lama memudar linear
 * 1 -> 0, jadi di atas 25 % hanya sampai 0,75; badan baru melewati 25 % baru di ± 0,79: tidak pernah dua badan.
 */
export const LARUT_TOKOH = 0.72;

// ------------------------------------------------------------------ tukar pose tanpa badan ganda

/** Satu penggal waktu sebuah badan tokoh (elemen akhir atau aktor pose sementara) terlihat. */
export interface Penggal {
  target: string;
  /** Terlihat mulai t0 (md; <= 0 = sejak awal) sampai t1 (>= durasi = sampai akhir). */
  t0: number;
  t1: number;
  /** Skala tokoh (geser dalam satuan dunia). */
  skala: number;
  /** Muncul tergeser sejauh ini (satuan dunia) lalu menetap ke 0 selama `lamaMasuk` md. */
  dari?: readonly [number, number];
  lamaMasuk?: number;
  /** Antisipasi: bergeser ke sini selama `lamaKeluar` md terakhir penggalnya (mulai duduk / mulai berdiri). */
  ke?: readonly [number, number];
  lamaKeluar?: number;
  /** Pudar masuk (md) di awal penggal. Hanya bila badan lain tokoh ini <= 25 % (mis. sesudah larut lokasi). */
  pudar?: number;
}

/**
 * Keyframe opacity (+ transform bila ada geser) untuk penggal-penggal badan. Penggal satu tokoh diatur berurutan
 * oleh pemanggil (t1 penggal = t0 penggal berikutnya), sehingga di setiap saat tepat satu badan terlihat: pose
 * berganti SEKETIKA, geraknya (antisipasi + menetap) yang membuat pergantian terbaca, bukan silang-pudar.
 */
export function gerakPenggal(T: number, daftar: readonly Penggal[]): GerakAktor[] {
  const perTarget = new Map<string, Penggal[]>();
  for (const p of daftar) perTarget.set(p.target, [...(perTarget.get(p.target) ?? []), p]);
  const gerak: GerakAktor[] = [];
  for (const [target, ps] of perTarget) {
    ps.sort((a, b) => a.t0 - b.t0);
    const op: Jejak[] = [[0, ps[0]!.t0 <= 0 && !ps[0]!.pudar ? 1 : 0]];
    const tr: Jejak[] = [];
    let adaGeser = false;
    for (const p of ps) {
      const t0 = Math.max(0, p.t0);
      const t1 = Math.min(T, p.t1);
      if (p.pudar) op.push([t0, 0], [Math.min(t1, t0 + p.pudar), 1]);
      else if (t0 > 0) op.push([t0, 0], [t0, 1]);
      if (t1 < T) op.push([t1, 1], [t1, 0]);
      if (p.dari) {
        adaGeser = true;
        tr.push([t0, geser(p.dari[0], p.dari[1], p.skala), OUT], [Math.min(t1, t0 + (p.lamaMasuk ?? 160)), geser(0, 0, p.skala)]);
      } else {
        tr.push([t0, geser(0, 0, p.skala)]);
      }
      if (p.ke && t1 < T) {
        adaGeser = true;
        tr.push([Math.max(t0, t1 - (p.lamaKeluar ?? 100)), geser(0, 0, p.skala), 'ease-in'], [t1, geser(p.ke[0], p.ke[1], p.skala)]);
      }
    }
    gerak.push({ target, keyframes: kf('opacity', T, op) });
    if (adaGeser) gerak.push({ target, keyframes: kf('transform', T, tr) });
  }
  return gerak;
}

const poseAdalahDuduk = (l: LetakTokoh) => l.opsi.pose.startsWith('duduk') || l.opsi.pose === 'telepon';
export const samaTempat = (a: LetakTokoh, b: LetakTokoh) =>
  Math.abs(a.titik.x - b.titik.x) < 1 && Math.abs(a.titik.y - b.titik.y) < 1 && Math.abs(a.skala - b.skala) < 1e-6;

/**
 * Gerak tukar pose a -> b: duduk = pose berdiri sedikit merendah lalu pose duduk turun menetap; berdiri = pose duduk
 * sedikit terangkat lalu pose berdiri naik dari bawah; lainnya = angguk kecil. Tempat a & b berjauhan mendatar
 * (dx satuan dunia): pose lama bergeser dx/2 selama antisipasi, pose baru muncul dx/2 sebelum tempatnya lalu
 * meluncur masuk, jadi badan bergerak bersambung (di titik tukar kedua badan berada di posisi dunia yang sama).
 */
export function arahTukar(a: LetakTokoh, b: LetakTokoh): { ke?: [number, number]; dari: [number, number]; lamaMasuk: number } {
  const da = poseAdalahDuduk(a);
  const db = poseAdalahDuduk(b);
  const [separuh, sisa] = bagiDua(b.titik.x - a.titik.x);
  if (!da && db) return { ke: [separuh, 10], dari: [-sisa, -16], lamaMasuk: 300 };
  if (da && !db) return { ke: [separuh, -8], dari: [-sisa, 14], lamaMasuk: 180 };
  if (separuh || sisa) return { ke: [separuh, 0], dari: [-sisa, -4], lamaMasuk: 200 };
  return { dari: [0, -4], lamaMasuk: 160 };
}

function kfKamera(T: number, jejak: readonly [number, Kamera, string?][]): Keyframe[] {
  return kf('transform', T, jejak.map(([t, k, e]) => [t, transformKamera(k), e] as Jejak));
}

const PINTU_TUTUP = 'perspective(900px) rotateY(0deg)';
const PINTU_BUKA = 'perspective(900px) rotateY(-78deg)';

// ------------------------------------------------------------------ konteks

export interface KonteksRencana {
  lama: SusunanAdegan | null;
  baru: SusunanAdegan;
  /** Kamera akhir komposisi lama & baru pada kotak panggung saat ini. */
  kamLama: Kamera | null;
  kamBaru: Kamera;
  /** Kamera yang juga memperlihatkan pintu (kedatangan / kepergian); null = sama dengan kamBaru. */
  kamPintu?: Kamera | null;
  /**
   * Kedatangan HP sempit (v5.1, transisi.ts kameraKedatangan): bingkai PINTU (skala = kamPintu, bukaan utuh) yang
   * dipakai lebih dulu selama pintu dibuka & Bu Rina masuk; null/tanpa nilai = langsung kamPintu (desktop, HP lebar).
   */
  kamBukaan?: Kamera | null;
  /**
   * Indeks titik `jalurMasuk` mulai mana pejalan berada di lapisan pengunjung (di depan meja & kursi); sebelumnya di
   * lapisan "tokoh di belakang meja". Tanpa nilai = pertengahan jalur.
   */
  depanMulai?: number;
  /**
   * Generator Bu Rina mendukung `hadap: 'kanan'` (berjalan ke pintu tanpa mencerminkan gambar). false/tanpa nilai =
   * cadangan: pose jalan dicerminkan (detail asimetris ikut terbalik).
   */
  hadapKanan?: boolean;
  /**
   * Generator Bu Rina punya bingkai antara `duduk-turun`: berdiri -> duduk-turun -> duduk (datang) dan sebaliknya
   * (pergi). false/tanpa nilai = tukar berdiri <-> duduk seketika (cadangan).
   */
  dudukTurun?: boolean;
  /**
   * Atlas Miss Raksa punya bingkai antara `duduk-turun`: di kedatangan berdiri-persilakan -> duduk-turun (tahan singkat)
   * -> pose duduk akhir. false/tanpa nilai = tukar persilakan -> duduk seketika (cadangan, perilaku lama).
   */
  mentorTurun?: boolean;
}

/** Pecahan jarak (0..1) titik ke-i di sepanjang jalur. */
export function pecahanTitik(jalur: readonly { titik: Titik }[], i: number): number {
  let total = 0;
  let sampai = 0;
  for (let k = 1; k < jalur.length; k++) {
    const d = Math.hypot(jalur[k]!.titik.x - jalur[k - 1]!.titik.x, jalur[k]!.titik.y - jalur[k - 1]!.titik.y);
    total += d;
    if (k <= i) sampai += d;
  }
  return total > 0 ? sampai / total : 0;
}

/** Pecahan jalur MASUK saat pejalan pindah ke lapisan pengunjung (tengah segmen menuju titik `depanMulai`). */
export function pecahanDepan(jalur: readonly { titik: Titik }[], depanMulai: number | undefined): number {
  if (depanMulai === undefined || depanMulai <= 0 || depanMulai >= jalur.length) return 0.5;
  return (pecahanTitik(jalur, depanMulai - 1) + pecahanTitik(jalur, depanMulai)) / 2;
}

// ------------------------------------------------------------------ jalan

/** Titik & skala di sepanjang jalur pada pecahan jarak u (0..1). */
export function titikJalur(jalur: readonly { titik: Titik; skala: number }[], u: number): { titik: Titik; skala: number } {
  if (jalur.length === 1) return jalur[0]!;
  const panjang: number[] = [];
  let total = 0;
  for (let i = 1; i < jalur.length; i++) {
    const a = jalur[i - 1]!.titik;
    const b = jalur[i]!.titik;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    panjang.push(d);
    total += d;
  }
  if (total <= 0) return jalur[jalur.length - 1]!;
  let sisa = Math.min(1, Math.max(0, u)) * total;
  for (let i = 0; i < panjang.length; i++) {
    const d = panjang[i]!;
    if (sisa <= d || i === panjang.length - 1) {
      const f = d > 0 ? Math.min(1, sisa / d) : 1;
      const a = jalur[i]!;
      const b = jalur[i + 1]!;
      return {
        titik: { x: a.titik.x + (b.titik.x - a.titik.x) * f, y: a.titik.y + (b.titik.y - a.titik.y) * f },
        skala: a.skala + (b.skala - a.skala) * f,
      };
    }
    sisa -= d;
  }
  return jalur[jalur.length - 1]!;
}

/** Lama satu langkah (md): pose jalan-a / jalan-b bergantian. */
export const LANGKAH_MS = 270;

/**
 * Gerak pejalan dari t0 ke t1 sepanjang jalur: transform (posisi + skala + sedikit naik-turun tiap langkah) dan
 * pergantian salinan pose 'a'/'b'. Mengembalikan keyframe transform + keyframe opacity per salinan jalan.
 */
export function gerakJalan(T: number, t0: number, t1: number, jalur: readonly { titik: Titik; skala: number }[], titik0: Titik) {
  const tr: Jejak[] = [];
  const setengah = LANGKAH_MS / 2;
  const n = Math.max(2, Math.round((t1 - t0) / setengah));
  const posisi = (u: number, naik: number) => {
    const p = titikJalur(jalur, u);
    return `translate(${r2(p.titik.x - titik0.x)}px, ${r2(p.titik.y - titik0.y - naik * p.skala)}px) scale(${r2(p.skala * 1000) / 1000})`;
  };
  tr.push([0, posisi(0, 0)]);
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    // Badan sedikit naik di tengah tiap langkah (perpindahan berat badan), turun saat kaki menapak.
    tr.push([t, posisi(i / n, i % 2 === 1 && i < n ? 6 : 0)]);
  }
  // Sebelum berjalan kedua salinan jalan tak terlihat (salinan 'diam' yang tampil): tanpa badan ganda.
  const langkah: { a: Jejak[]; b: Jejak[] } = { a: [[0, 0], [t0, 0]], b: [[0, 0], [t0, 0]] };
  let k = 0;
  for (let t = t0; t < t1; t += LANGKAH_MS, k++) {
    const aTerlihat = k % 2 === 0 ? 1 : 0;
    langkah.a.push([t, aTerlihat], [Math.min(t1, t + LANGKAH_MS), aTerlihat]);
    langkah.b.push([t, 1 - aTerlihat], [Math.min(t1, t + LANGKAH_MS), 1 - aTerlihat]);
  }
  // Sesudah berjalan salinan 'a'/'b' tidak terlihat (salinan 'diam' mengambil alih).
  langkah.a.push([t1, 0]);
  langkah.b.push([t1, 0]);
  return { transform: kf('transform', T, tr), a: kf('opacity', T, langkah.a), b: kf('opacity', T, langkah.b) };
}

// ------------------------------------------------------------------ bantuan umum

/**
 * Pose sementara Miss Raksa / Bu Rina di titik & skala tertentu (dari letak akhir, hanya opsi yang diganti). Gambar
 * RASTER: skala 1 dan sudut kiri-atas di kisi piksel seni (sama dengan dunia.ts buatLetak), jadi pose antara pun
 * sejajar dengan piksel ruang saat diam.
 */
function letakDengan(dasar: LetakTokoh, opsi: OpsiTokoh, titik: Titik, skala: number, z: number, gambar: (o: OpsiTokoh) => LetakTokoh['gambar']): LetakTokoh {
  const g = gambar(opsi);
  const raster = !!pikselDari(g);
  return { ...dasar, opsi, gambar: g, titik: raster ? titikKisi(titik, g.jangkar) : titik, skala: raster ? 1 : skala, z, tanda: `${opsi.siapa}|${opsi.pose}|sementara` };
}

/** Lama bingkai antara `duduk-turun` terlihat saat duduk / bangkit (md): cukup untuk terbaca, tidak menahan gerak. */
export const TAHAN_TURUN = 140;

/**
 * Bingkai antara `duduk-turun` untuk tukar berdiri <-> duduk Bu Rina (kanvas berdiri, jangkar telapak kaki, skala
 * pose berdiri). Telapaknya di titik berdiri, digeser ke arah kursi seperlunya supaya KEPALANYA di tengah antara
 * kepala berdiri & kepala duduk (dijepit di antara titik berdiri & titik duduk). `keAntara` / `keDuduk` = jarak
 * mendatar kepala (satuan dunia) berdiri -> antara dan antara -> duduk; masing-masing dibagi dua di titik tukarnya
 * (seperti arahTukar), jadi kepala bergerak bersambung tanpa lompatan mendatar.
 */
export function bingkaiTurun(
  berdiri: { gambar: LetakTokoh['gambar']; titik: Titik; skala: number },
  duduk: LetakTokoh,
  gambar: (o: OpsiTokoh) => LetakTokoh['gambar'],
): { letak: LetakTokoh; keAntara: number; keDuduk: number } {
  const opsi = { ...duduk.opsi, pose: 'duduk-turun' } as OpsiTokoh;
  const g = gambar(opsi);
  const kb = titikDunia(berdiri.gambar, berdiri.gambar.kepala, berdiri.titik, berdiri.skala);
  const kd = titikDunia(duduk.gambar, duduk.gambar.kepala, duduk.titik, duduk.skala);
  const diTelapak = titikDunia(g, g.kepala, berdiri.titik, berdiri.skala);
  const bawah = Math.min(berdiri.titik.x, duduk.titik.x);
  const atas = Math.max(berdiri.titik.x, duduk.titik.x);
  const x = Math.round(Math.min(atas, Math.max(bawah, berdiri.titik.x + (kb.x + kd.x) / 2 - diTelapak.x)));
  const letak = letakDengan(duduk, opsi, { x, y: berdiri.titik.y }, berdiri.skala, Z.nasabah, () => g);
  const kt = titikDunia(g, g.kepala, letak.titik, letak.skala);
  return { letak, keAntara: kt.x - kb.x, keDuduk: kd.x - kt.x };
}

/**
 * Lama bingkai antara `duduk-turun` Miss Raksa terlihat di kedatangan (md): muncul & menetap (80 md), tertahan diam
 * (± 90 md), lalu mulai turun ke kursi (70 md terakhir). Terbaca sebagai satu pose, tidak menahan gerak (kedatangan
 * tetap 3 dtk).
 */
export const TAHAN_TURUN_MENTOR = 240;
/** Pose duduk Miss Raksa muncul paling banyak sejauh ini (satuan dunia) di atas tempatnya lalu menetap (4 piksel seni). */
const NAIK_DUDUK = 16;

/**
 * Bingkai antara `duduk-turun` Miss Raksa (berdiri mempersilakan -> duduk di kursinya), frame RASTER atlas. Pandang
 * lawan (hadap kanan, sama dengan mempersilakan), ekspresi pose akhir. Jangkar TELAPAK = telapak di lantai tempat
 * berdiri (lutut menekuk; meja menutupi kaki); jangkar PINGGUL = pinggul setinggi tempat duduk (seperti frame duduk:
 * garis meja frame tetap di tepi meja). Mendatar: kepala di tengah antara kepala mempersilakan & kepala duduk, jangkar
 * dijepit di antara tempat berdiri & tempat duduk. `keAntara` / `keDuduk` = geser kepala [x, y] (satuan dunia)
 * mempersilakan -> antara dan antara -> duduk (rencanaMasuk membagi mendatarnya dua di titik tukar; tegaknya hanya
 * sejauh yang tersembunyi meja).
 */
export function bingkaiTurunMentor(
  silakan: LetakTokoh,
  duduk: LetakTokoh,
  gambar: (o: OpsiTokoh) => LetakTokoh['gambar'],
): { letak: LetakTokoh; keAntara: [number, number]; keDuduk: [number, number] } {
  const opsi = { ...duduk.opsi, pose: 'duduk-turun', pandang: 'lawan' } as OpsiTokoh;
  const g = gambar(opsi);
  const pinggul = (g as { jenisJangkar?: unknown }).jenisJangkar === 'pinggul';
  const dasar = pinggul ? duduk : silakan;
  const kb = titikDunia(silakan.gambar, silakan.gambar.kepala, silakan.titik, silakan.skala);
  const kd = titikDunia(duduk.gambar, duduk.gambar.kepala, duduk.titik, duduk.skala);
  const diDasar = titikDunia(g, g.kepala, dasar.titik, dasar.skala);
  const bawah = Math.min(silakan.titik.x, duduk.titik.x);
  const atas = Math.max(silakan.titik.x, duduk.titik.x);
  const x = Math.round(Math.min(atas, Math.max(bawah, dasar.titik.x + (kb.x + kd.x) / 2 - diDasar.x)));
  const letak = letakDengan(duduk, opsi, { x, y: dasar.titik.y }, dasar.skala, Z.belakang, () => g);
  const kt = titikDunia(g, g.kepala, letak.titik, letak.skala);
  return { letak, keAntara: [kt.x - kb.x, kt.y - kb.y], keDuduk: [kd.x - kt.x, kd.y - kt.y] };
}

function gerakKamera(ctx: KonteksRencana, T: number, jejak: [number, Kamera, string?][]): GerakAktor[] {
  const semuaSama = jejak.every(([, k]) => samaKamera(k, ctx.kamBaru));
  return semuaSama ? [] : [{ target: 'kamera', keyframes: kfKamera(T, jejak) }];
}

/**
 * Perubahan kecil antarbaris (pose/ekspresi/pandang, kehadiran, prop, kamera): <= 240 ms, bukan potong kamera.
 * Pose/wajah di tempat yang sama = langsung berganti + anggukan kecil; pindah tempat (duduk <-> berdiri) = tukar
 * dengan antisipasi (tanpa silang-pudar, jadi tanpa badan ganda); hadir/pergi = pudar. Dipakai juga oleh aksi untuk
 * tokoh yang tidak ikut aksinya.
 */
function gantiKecil(ctx: KonteksRencana, T: number, lewati: { mentor?: boolean; nasabah?: boolean; prop?: Set<string> } = {}) {
  const aktor: AktorTransien[] = [];
  const gerak: GerakAktor[] = [];
  const penggal: Penggal[] = [];
  const P = 190;
  for (const siapa of ['mentor', 'nasabah'] as const) {
    if (lewati[siapa]) continue;
    const a = cariTokoh(ctx.lama, siapa);
    const b = cariTokoh(ctx.baru, siapa);
    if (a && b && a.tanda === b.tanda) continue;
    if (a && b) {
      if (samaTempat(a, b)) {
        // Respons kecil pendengar/pembicara: gambar langsung berganti, anggukan tipis membuatnya terbaca.
        gerak.push({ target: `tokoh:${siapa}`, keyframes: kf('transform', T, [[0, geser(0, 4, b.skala), OUT], [Math.min(T, P + 40), geser(0, 0, b.skala)]]) });
      } else {
        const tk = Math.round(Math.min(110, T * 0.4));
        const arah = arahTukar(a, b);
        aktor.push({ jenis: 'tokoh', kunci: `lama-${siapa}`, letak: a });
        penggal.push(
          { target: `x:lama-${siapa}`, t0: 0, t1: tk, skala: a.skala, ke: arah.ke, lamaKeluar: tk },
          { target: `tokoh:${siapa}`, t0: tk, t1: T, skala: b.skala, dari: arah.dari, lamaMasuk: Math.min(arah.lamaMasuk, T - tk) },
        );
      }
    } else if (a) {
      aktor.push({ jenis: 'tokoh', kunci: `lama-${siapa}`, letak: a });
      gerak.push({ target: `x:lama-${siapa}`, keyframes: pudarKeluar(T, 0, P) });
    } else if (b) {
      gerak.push({ target: `tokoh:${siapa}`, keyframes: pudarMasuk(T, 0, P) });
    }
  }
  gerak.push(...gerakPenggal(T, penggal));
  const idProp = (p: LetakProp) => `${p.id}:${p.tempat}:${Math.round(p.titik.x)},${Math.round(p.titik.y)}`;
  const propLama = new Map((ctx.lama?.prop ?? []).map((p) => [p.id, p] as const));
  for (const p of ctx.baru.prop) {
    if (lewati.prop?.has(p.id)) continue;
    const l = propLama.get(p.id);
    if (!l || idProp(l) !== idProp(p)) gerak.push({ target: `prop:${p.id}`, keyframes: pudarMasuk(T, 0, P) });
  }
  const propBaru = new Map(ctx.baru.prop.map((p) => [p.id, p] as const));
  for (const l of ctx.lama?.prop ?? []) {
    if (lewati.prop?.has(l.id)) continue;
    const p = propBaru.get(l.id);
    if (!p || idProp(l) !== idProp(p)) {
      aktor.push({ jenis: 'prop', kunci: `lama-prop-${l.id}`, prop: l });
      gerak.push({ target: `x:lama-prop-${l.id}`, keyframes: pudarKeluar(T, 0, P) });
    }
  }
  const telLama = !!ctx.lama?.komposisi.nasabah?.lewatTelepon;
  const telBaru = !!ctx.baru.komposisi.nasabah?.lewatTelepon;
  if (telBaru && !telLama) gerak.push({ target: 'telepon-sisip', keyframes: pudarMasuk(T, 0, 240) });
  const chipLama = !!cariTokoh(ctx.lama, 'nasabah');
  const chipBaru = !!cariTokoh(ctx.baru, 'nasabah');
  if (chipBaru && !chipLama) gerak.push({ target: 'chip', keyframes: pudarMasuk(T, 0, P) });
  return { aktor, gerak };
}

// ------------------------------------------------------------------ rencana per jenis

/** Perubahan biasa antarbaris / antar-node (tanpa aksi): silang-pudar singkat, kamera meluncur bila perlu. */
export function rencanaGanti(ctx: KonteksRencana): Rencana | null {
  const kameraBeda = !!ctx.kamLama && !samaKamera(ctx.kamLama, ctx.kamBaru);
  const T = kameraBeda ? 420 : 240;
  const { aktor, gerak } = gantiKecil(ctx, T);
  if (kameraBeda) gerak.push(...gerakKamera(ctx, T, [[0, ctx.kamLama!, IN_OUT], [T, ctx.kamBaru]]));
  if (!aktor.length && !gerak.length) return null;
  return { jenis: 'ganti', durasi: T, aktor, gerak, lewati: false };
}

/** Lama pose baru menetap sesudah tukar di tempat (tokoh tetap di kursinya saat larut lokasi), md. */
const MENETAP_TETAP = 200;
/** Kamera dunia utama meluncur dari kamera lama ke kamera baru sesudah larut (tokoh tetap di kursinya), md. */
const LUNCUR_TETAP = 320;

/**
 * Tokoh yang TETAP di kursinya melewati pindah lokasi: ada di kedua adegan di titik & skala dunia yang sama (lokasi
 * lain di ruang yang sama, mis. meja -> telepon). `kecuali` = tokoh yang diatur pemanggil sendiri.
 */
function tokohTetap(ctx: KonteksRencana, kecuali: { mentor?: boolean; nasabah?: boolean } = {}): SiapaTokoh[] {
  const hasil: SiapaTokoh[] = [];
  for (const siapa of ['mentor', 'nasabah'] as const) {
    const a = cariTokoh(ctx.lama, siapa);
    const b = cariTokoh(ctx.baru, siapa);
    if (!kecuali[siapa] && a && b && samaTempat(a, b)) hasil.push(siapa);
  }
  return hasil;
}

/** Durasi pindah lokasi: larut D, ditambah tukar pose / luncur kamera sesudahnya bila ada tokoh yang tetap. */
function durasiPindah(ctx: KonteksRencana, D: number): number {
  const tetap = tokohTetap(ctx);
  if (!tetap.length || !ctx.kamLama) return D;
  const tukar = tetap.some((siapa) => cariTokoh(ctx.lama, siapa)!.tanda !== cariTokoh(ctx.baru, siapa)!.tanda);
  const luncur = !samaKamera(ctx.kamLama, ctx.kamBaru);
  return D + Math.max(tukar ? MENETAP_TETAP : 0, luncur ? LUNCUR_TETAP : 0);
}

/**
 * Larut lokasi (bagian awal pindah & kartu-sesudah-pindah): salinan adegan lama (dengan tokohnya) di atas, memudar
 * linear selama `D` md. Tokoh yang juga ada di adegan baru baru memudar masuk mulai LARUT_TOKOH·D (tanpa badan
 * ganda); sisipan telepon ikut memudar masuk. `kecuali` = tokoh yang diatur pemanggil sendiri.
 *
 * Tokoh yang TETAP di kursinya (tokohTetap) tidak ikut larut: dunia utama memakai kamera LAMA selama larut (salinan
 * & dunia utama tepat berimpit), badannya di dunia utama = pose lama yang terlihat penuh sejak awal (di bawah
 * salinan yang memuat pose lama yang sama: satu badan, tanpa celup), lalu tepat saat salinan habis pose ditukar
 * seketika + menetap kecil, dan kamera meluncur ke kamera baru bila berbeda.
 */
function larutLokasi(ctx: KonteksRencana, T: number, D: number, kecuali: { mentor?: boolean; nasabah?: boolean } = {}) {
  const tetap = ctx.kamLama ? tokohTetap(ctx, kecuali) : [];
  const aktor: AktorTransien[] = [{ jenis: 'adegan', kunci: 'lama', susunan: ctx.lama!, kamera: ctx.kamLama!, tanpaTokoh: false, ...(tetap.length ? { menyatu: tetap } : {}) }];
  const gerak: GerakAktor[] = [{ target: 'x:lama', keyframes: kf('opacity', T, [[0, 1], [D, 0]]) }];
  const t0 = Math.round(D * LARUT_TOKOH);
  const penggal: Penggal[] = [];
  for (const siapa of ['mentor', 'nasabah'] as const) {
    if (kecuali[siapa] || !cariTokoh(ctx.baru, siapa)) continue;
    const a = cariTokoh(ctx.lama, siapa);
    const b = cariTokoh(ctx.baru, siapa)!;
    if (a && tetap.includes(siapa)) {
      if (a.tanda === b.tanda) continue; // pose sama: badan akhir sudah benar sejak awal
      aktor.push({ jenis: 'tokoh', kunci: `lama-${siapa}`, letak: a });
      penggal.push(
        { target: `x:lama-${siapa}`, t0: 0, t1: D, skala: a.skala },
        { target: `tokoh:${siapa}`, t0: D, t1: T, skala: b.skala, dari: [0, -4], lamaMasuk: Math.max(1, Math.min(MENETAP_TETAP, T - D)) },
      );
      continue;
    }
    if (a) gerak.push({ target: `tokoh:${siapa}`, keyframes: pudarMasuk(T, t0, D) });
  }
  gerak.push(...gerakPenggal(T, penggal));
  // Prop di tempat yang sama tetapi berganti keadaan (pesawat telepon: lengkap di meja -> tanpa gagang karena
  // gagangnya dipegang pose telepon): keadaan lama ikut bertahan penuh sampai larut selesai, lalu tukar seketika
  // bersama pose tokohnya (gagang tidak lenyap sebelum diangkat).
  if (tetap.length) {
    const propLama = new Map((ctx.lama?.prop ?? []).map((p) => [p.id, p] as const));
    for (const p of ctx.baru.prop) {
      const l = propLama.get(p.id);
      if (!l || l.tempat === p.tempat || Math.abs(l.titik.x - p.titik.x) > 1 || Math.abs(l.titik.y - p.titik.y) > 1) continue;
      aktor.push({ jenis: 'prop', kunci: `lama-prop-${p.id}`, prop: l });
      gerak.push(
        { target: `x:lama-prop-${p.id}`, keyframes: kf('opacity', T, [[0, 1], [D, 1], [D, 0]]) },
        { target: `prop:${p.id}`, keyframes: kf('opacity', T, [[0, 0], [D, 0], [D, 1]]) },
      );
    }
  }
  if (tetap.length && ctx.kamLama && !samaKamera(ctx.kamLama, ctx.kamBaru)) {
    gerak.push({ target: 'kamera', keyframes: kfKamera(T, [[0, ctx.kamLama], [D, ctx.kamLama, IN_OUT], [Math.min(T, D + LUNCUR_TETAP), ctx.kamBaru]]) });
  }
  if (ctx.baru.komposisi.nasabah?.lewatTelepon && !ctx.lama?.komposisi.nasabah?.lewatTelepon) {
    gerak.push({ target: 'telepon-sisip', keyframes: pudarMasuk(T, Math.round(D * 0.5), D) });
  }
  return { aktor, gerak };
}

/** Pindah lokasi / waktu berlalu: salinan adegan lama di atas, memudar ± 0,45 dtk ke adegan baru. */
export function rencanaPindah(ctx: KonteksRencana, jenis: JenisRencana = 'pindah'): Rencana {
  const D = 450;
  if (!ctx.lama || !ctx.kamLama) return { jenis, durasi: D, aktor: [], gerak: [], lewati: false };
  const T = durasiPindah(ctx, D);
  const { aktor, gerak } = larutLokasi(ctx, T, D);
  return { jenis, durasi: T, aktor, gerak, lewati: false };
}

/**
 * Jadwal kedatangan (md), ± 3 dtk: pintu, berjalan, menoleh & mempersilakan, duduk, kunci ke meja, pintu menutup.
 * v5.1: pintu baru mulai terbuka saat kamera tiba di bingkai pembuka kedatangan (`kameraPintu`), jadi pintu yang MASIH
 * TERTUTUP lalu terbuka terlihat (dulu 0-550 md, sebagian besar selagi kamera masih bergerak); Bu Rina muncul di ambang
 * saat daun sudah separuh terbuka dan berjalan sedikit lebih cepat ("masuk tergesa"); durasi total sama.
 */
export const JADWAL_MASUK = {
  total: 3000,
  pintuBuka: [380, 860],
  jalan: [600, 1800],
  diam: [1800, 1950],
  duduk: [1950, 2250],
  mentorToleh: 1150,
  mentorDuduk: [2300, 2600],
  pintuTutup: [2350, 2950],
  kamera: [2000, 3000],
  /** Kamera tiba di bingkai pembuka kedatangan (bingkai pintu di HP sempit, bingkai kedatangan di tempat lain). */
  kameraPintu: 380,
  /** HP sempit (ctx.kamBukaan): satu geser tenang dari bingkai pintu ke bingkai kedatangan saat Miss Raksa mempersilakan. */
  kameraMeja: [1050, 1700],
} as const;

/**
 * Kedatangan nasabah (aksi 'masuk'): daun pintu berputar di engselnya, Bu Rina masuk lewat bukaan pintu dengan pose
 * jalan bergantian mengikuti skala jalur, Miss Raksa menoleh & mempersilakan, Bu Rina duduk (turun menetap), kunci
 * ke meja, Miss Raksa duduk, pintu menutup. Setiap ganti pose = tukar seketika (tanpa badan ganda). Tanpa
 * jalur/pintu (ruang tanpa pintu) = ganti kecil biasa.
 */
export function rencanaMasuk(ctx: KonteksRencana, gambar: (o: OpsiTokoh) => LetakTokoh['gambar']): Rencana {
  const J = JADWAL_MASUK;
  const T = J.total;
  const r = ctx.baru.ruang;
  const jalur = r.tempat.jalurMasuk;
  const nasabah = cariTokoh(ctx.baru, 'nasabah');
  if (!nasabah || jalur.length < 2) {
    const g = rencanaGanti(ctx);
    return { ...(g ?? { durasi: 240, aktor: [], gerak: [] }), jenis: 'masuk', lewati: false };
  }
  const aktor: AktorTransien[] = [];
  const gerak: GerakAktor[] = [];
  const penggal: Penggal[] = [];

  // Pintu.
  if (r.pintu) {
    gerak.push({
      target: 'pintu',
      keyframes: kf('transform', T, [[0, PINTU_TUTUP], [J.pintuBuka[0], PINTU_TUTUP, OUT], [J.pintuBuka[1], PINTU_BUKA], [J.pintuTutup[0], PINTU_BUKA, IN_OUT], [J.pintuTutup[1], PINTU_TUTUP]]),
    });
  }

  // Bu Rina berjalan dari ambang pintu ke samping kursi (pose jalan-a/jalan-b bergantian, kunci di tangan).
  const titik0 = jalur[0]!.titik;
  const sAkhir = jalur[jalur.length - 1]!.skala;
  const dasarOpsi = nasabah.opsi.siapa === 'nasabah' ? nasabah.opsi : null;
  const opsiJalan = (pose: 'jalan-a' | 'jalan-b' | 'berdiri'): OpsiTokoh => ({
    siapa: 'nasabah', pose, ekspresi: dasarOpsi?.ekspresi ?? 'netral', pandang: 'depan', kunci: true,
  });
  aktor.push({
    jenis: 'jalan', kunci: 'jalan', titik0, z: Z.belakang,
    salinan: [
      { id: 'a', opsi: opsiJalan('jalan-a'), cermin: false },
      { id: 'b', opsi: opsiJalan('jalan-b'), cermin: false },
      { id: 'diam', opsi: { ...opsiJalan('berdiri'), pandang: 'lawan' }, cermin: false },
    ],
  });
  const j = gerakJalan(T, J.jalan[0], J.jalan[1], jalur, titik0);
  const tDepan = Math.round(J.jalan[0] + pecahanDepan(jalur, ctx.depanMulai) * (J.jalan[1] - J.jalan[0]));
  const ujung = jalur[jalur.length - 1]!;
  const opsiDiam: OpsiTokoh = { ...opsiJalan('berdiri'), pandang: 'lawan' };
  // Bingkai antara duduk-turun (bila generator punya): berdiri -> duduk-turun (TAHAN_TURUN md) -> duduk.
  const turun = ctx.dudukTurun ? bingkaiTurun({ gambar: gambar(opsiDiam), titik: ujung.titik, skala: sAkhir }, nasabah, gambar) : null;
  // Jarak mendatar ujung jalur (berdiri di samping kursi) -> tempat duduk, dibagi dua di titik tukar.
  const dxDuduk = bagiDua(nasabah.titik.x - ujung.titik.x);
  const [keAntara, dariAntara] = bagiDua(turun?.keAntara ?? 0);
  const [keDuduk, dariDuduk] = bagiDua(turun?.keDuduk ?? 0);
  const tDuduk = turun ? J.duduk[0] + TAHAN_TURUN : J.duduk[0];
  gerak.push(
    { target: 'x:jalan', keyframes: j.transform },
    // Muncul di ambang pintu (dari koridor terang); hilang SEKETIKA saat pose duduk(-turun) mengambil alih.
    { target: 'x:jalan', keyframes: kf('opacity', T, [[0, 0], [J.jalan[0], 0], [J.jalan[0] + 160, 1], [J.duduk[0], 1], [J.duduk[0], 0]]) },
    // Di dekat pintu: di belakang meja; mulai titik `depanMulai`: di depan meja & kursi (lapisan nasabah).
    { target: 'x:jalan', keyframes: kf('zIndex', T, [[0, Z.belakang], [tDepan, Z.belakang], [tDepan, Z.nasabah]]) },
    { target: 'x:jalan:a', keyframes: j.a },
    { target: 'x:jalan:b', keyframes: j.b },
    { target: 'x:jalan:diam', keyframes: kf('opacity', T, [[0, 0], [J.diam[0], 0], [J.diam[0], 1]]) },
    // Antisipasi duduk: lutut menekuk sedikit sebelum pose berikutnya, badan mulai bergeser separuh jalan ke kursi.
    { target: 'x:jalan:diam', keyframes: kf('transform', T, [[0, geser(0, 0, sAkhir)], [J.duduk[0] - 90, geser(0, 0, sAkhir), 'ease-in'], [J.duduk[0], geser(turun ? keAntara : dxDuduk[0], 10, sAkhir)]]) },
  );
  if (turun) {
    // Pose antara: muncul di separuh jarak sisanya, turun sedikit, lalu bergeser separuh jalan ke pose duduk.
    aktor.push({ jenis: 'tokoh', kunci: 'turun', letak: turun.letak });
    penggal.push(
      { target: 'x:turun', t0: J.duduk[0], t1: tDuduk, skala: turun.letak.skala, dari: [-dariAntara, -6], lamaMasuk: 70, ke: [keDuduk, 8], lamaKeluar: 60 },
      { target: 'tokoh:nasabah', t0: tDuduk, t1: T, skala: nasabah.skala, dari: [-dariDuduk, -12], lamaMasuk: Math.max(200, J.duduk[1] - tDuduk) },
    );
  } else {
    // Duduk: pose akhir muncul (saat pose berdiri hilang) di separuh jarak sisanya, lalu turun menetap ± 20 satuan.
    penggal.push({ target: 'tokoh:nasabah', t0: J.duduk[0], t1: T, skala: nasabah.skala, dari: [-dxDuduk[1], -20], lamaMasuk: J.duduk[1] - J.duduk[0] });
  }
  // Kunci diletakkan di meja: bersama pose duduk-turun (tangannya sudah melepas kunci, seperti pose duduk), atau
  // sesaat sesudah duduk (cadangan tanpa bingkai antara). Frame duduk-turun raster yang MASIH memegang kunci (di
  // lutut): kunci meja baru muncul bersama pose duduk, jadi tidak pernah ada dua kunci.
  if (ctx.baru.prop.some((p) => p.id === 'kunci')) {
    const kunci = ctx.baru.prop.find((p) => p.id === 'kunci')!;
    const tk = turun ? (kunciTergambar(turun.letak.gambar) ? tDuduk : J.duduk[0]) : J.duduk[0] + 60;
    gerak.push(
      { target: 'prop:kunci', keyframes: pudarMasuk(T, tk, tk + (turun ? 60 : 100)) },
      { target: 'prop:kunci', keyframes: menetap(T, tk, turun ? tk + 220 : J.duduk[1] + 60, 26, kunci.skala) },
    );
  }
  gerak.push({ target: 'chip', keyframes: pudarMasuk(T, J.duduk[1], J.duduk[1] + 200) });

  // Miss Raksa: pose lama -> menoleh & mempersilakan (berdiri) -> pose akhir (duduk menetap); tukar seketika.
  const mLama = cariTokoh(ctx.lama, 'mentor');
  const mBaru = cariTokoh(ctx.baru, 'mentor');
  const S1 = J.mentorToleh;
  const S2 = J.mentorDuduk[0];
  if (mBaru) {
    const sama = !!mLama && mLama.tanda === mBaru.tanda;
    if (mLama && !sama) aktor.push({ jenis: 'tokoh', kunci: 'lama-mentor', letak: mLama });
    const sebelum = mLama ? { target: sama ? 'tokoh:mentor' : 'x:lama-mentor', letak: mLama } : null;
    const persilakan: OpsiTokoh = { siapa: 'mentor', pose: 'berdiri-persilakan', ekspresi: 'tersenyum', pandang: 'lawan' };
    if (mBaru.opsi.pose === 'berdiri-persilakan') {
      const a = sebelum ? arahTukar(sebelum.letak, mBaru) : null;
      if (sebelum && sebelum.target !== 'tokoh:mentor') penggal.push({ target: sebelum.target, t0: 0, t1: S1, skala: sebelum.letak.skala, ke: a?.ke, lamaKeluar: 100 });
      penggal.push(sebelum && sebelum.target !== 'tokoh:mentor'
        ? { target: 'tokoh:mentor', t0: S1, t1: T, skala: mBaru.skala, dari: a!.dari, lamaMasuk: a!.lamaMasuk }
        : { target: 'tokoh:mentor', t0: 0, t1: T, skala: mBaru.skala });
    } else {
      const silakan = letakDengan(mBaru, persilakan, r.tempat.mentorBerdiri, r.tempat.skalaMentor, Z.belakang, gambar);
      aktor.push({ jenis: 'tokoh', kunci: 'silakan', letak: silakan });
      const keSilakan = sebelum ? arahTukar(sebelum.letak, silakan) : null;
      const keAkhir = arahTukar(silakan, mBaru);
      // Bingkai antara duduk-turun (atlas Miss Raksa punya): persilakan -> duduk-turun (TAHAN_TURUN_MENTOR) -> duduk.
      // Mendatar: jarak kepala dibagi dua di tiap titik tukar (bersambung). Tegak: geser hanya yang TERSEMBUNYI meja:
      // pose berdiri TIDAK merendah (telapaknya di tepi bawah dunia: sepatu akan tampak di bawah meja depan di HP),
      // bingkai antara (terpotong 1 piksel di bawah garis meja) muncul paling banyak sampai garis meja, lalu turun di
      // balik meja sampai kepala bertemu kepala pose duduk yang muncul <= NAIK_DUDUK di atas tempatnya (tangan di meja
      // menetap, bawah badannya tetap di balik meja).
      const turun = ctx.mentorTurun && poseAdalahDuduk(mBaru) ? bingkaiTurunMentor(silakan, mBaru, gambar) : null;
      const [ax, bx] = bagiDua(turun?.keAntara[0] ?? 0);
      const [cx, dx] = bagiDua(turun?.keDuduk[0] ?? 0);
      let by = 0;
      let cy = 0;
      let dy = 0;
      if (turun) {
        const lt = turun.letak;
        const bawahTurun = lt.titik.y + (lt.gambar.h - lt.gambar.jangkar.y) * lt.skala;
        const garis = r.tempat.garisMejaMentor;
        const naikTurun = garis === undefined ? 0 : Math.max(0, bawahTurun - garis);
        by = Math.round(Math.min(naikTurun, Math.max(0, turun.keAntara[1])));
        dy = Math.round(Math.min(NAIK_DUDUK, Math.max(0, turun.keDuduk[1])));
        cy = Math.round(turun.keDuduk[1]) - dy;
      }
      const keLepas: readonly [number, number] | undefined = turun ? [ax, 0] : keAkhir.ke;
      if (sebelum) penggal.push({ target: sebelum.target, t0: 0, t1: S1, skala: sebelum.letak.skala, ke: keSilakan!.ke, lamaKeluar: 100 });
      penggal.push(
        sebelum
          ? { target: 'x:silakan', t0: S1, t1: S2, skala: silakan.skala, dari: keSilakan!.dari, lamaMasuk: keSilakan!.lamaMasuk, ke: keLepas, lamaKeluar: 100 }
          : { target: 'x:silakan', t0: 0, t1: S2, skala: silakan.skala, pudar: 200, ke: keLepas, lamaKeluar: 100 },
      );
      if (turun) {
        const S3 = S2 + TAHAN_TURUN_MENTOR;
        aktor.push({ jenis: 'tokoh', kunci: 'turun-mentor', letak: turun.letak });
        penggal.push(
          { target: 'x:turun-mentor', t0: S2, t1: S3, skala: turun.letak.skala, dari: [-bx, -by], lamaMasuk: 80, ke: [cx, cy], lamaKeluar: 70 },
          { target: 'tokoh:mentor', t0: S3, t1: T, skala: mBaru.skala, dari: [-dx, -dy], lamaMasuk: Math.max(200, J.mentorDuduk[1] - S3) },
        );
      } else {
        penggal.push({ target: 'tokoh:mentor', t0: S2, t1: T, skala: mBaru.skala, dari: keAkhir.dari, lamaMasuk: Math.max(keAkhir.lamaMasuk, J.mentorDuduk[1] - J.mentorDuduk[0]) });
      }
    }
  } else if (mLama) {
    aktor.push({ jenis: 'tokoh', kunci: 'lama-mentor', letak: mLama });
    gerak.push({ target: 'x:lama-mentor', keyframes: pudarKeluar(T, 0, 200) });
  }
  gerak.push(...gerakPenggal(T, penggal));

  // Prop lain & sisipan telepon (jarang berubah bersamaan): ganti kecil biasa.
  const kecil = gantiKecil(ctx, T, { mentor: true, nasabah: true, prop: new Set(['kunci']) });
  aktor.push(...kecil.aktor);
  gerak.push(...kecil.gerak.filter((g) => g.target !== 'chip'));

  // Kamera: bingkai yang memperlihatkan pintu selama kedatangan, lalu meluncur ke bingkai dua tokoh. HP sempit
  // (kamBukaan): bingkai pintu dulu (pintu tertutup -> terbuka, Bu Rina masuk), lalu hanya ke kiri: bingkai
  // kedatangan (Miss Raksa mempersilakan) -> percakapan; skala sama sepanjang jalan.
  const kp = ctx.kamPintu ?? ctx.kamBaru;
  const kb = ctx.kamBukaan && !samaKamera(ctx.kamBukaan, kp) ? ctx.kamBukaan : null;
  const pertama = kb ?? kp;
  const awal = ctx.kamLama ?? pertama;
  const jejakKamera: [number, Kamera, string?][] = [[0, awal, IN_OUT], [samaKamera(awal, pertama) ? 0 : J.kameraPintu, pertama]];
  if (kb) jejakKamera.push([J.kameraMeja[0], kb, IN_OUT], [J.kameraMeja[1], kp]);
  jejakKamera.push([J.kamera[0], kp, IN_OUT], [J.kamera[1], ctx.kamBaru]);
  gerak.push(...gerakKamera(ctx, T, jejakKamera));
  return { jenis: 'masuk', durasi: T, aktor, gerak, lewati: true };
}

/** Jadwal kepergian (md), ± 2,9 dtk. */
export const JADWAL_PERGI = {
  total: 2900,
  /**
   * Pose duduk terangkat sedikit, lalu SEKETIKA berganti pose berdiri yang naik menetap; sesudah kamera melebar
   * (kamera: 340 md) supaya kepala yang berdiri tidak terpotong di HP.
   */
  berdiri: [380, 540],
  kamera: 340,
  jalan: [620, 2050],
  keluar: [2050, 2200],
  pintuBuka: [1450, 1950],
  pintuTutup: [2250, 2850],
} as const;

/**
 * Kepergian nasabah (aksi 'pergi'): berdiri (pose berbalik ke pintu), berjalan kembali sepanjang jalur masuk
 * menghadap kanan (`hadap: 'kanan'`; cermin hanya cadangan), pintu terbuka, keluar lewat bukaan, pintu menutup.
 * Kursi kosong sesudahnya.
 */
export function rencanaPergi(ctx: KonteksRencana, gambar?: (o: OpsiTokoh) => LetakTokoh['gambar']): Rencana {
  const J = JADWAL_PERGI;
  const T = J.total;
  const r = ctx.baru.ruang;
  const jalurMasuk = r.tempat.jalurMasuk;
  const nLama = cariTokoh(ctx.lama, 'nasabah');
  if (!nLama || jalurMasuk.length < 2) {
    const g = rencanaGanti(ctx);
    return { ...(g ?? { durasi: 240, aktor: [], gerak: [] }), jenis: 'pergi', lewati: false };
  }
  const aktor: AktorTransien[] = [];
  const gerak: GerakAktor[] = [];
  const jalur = [...jalurMasuk].reverse();
  const titik0 = jalur[0]!.titik;
  const s0 = jalur[0]!.skala;
  const ekspresi = nLama.opsi.ekspresi;
  const kanan = ctx.hadapKanan === true;
  const opsi = (pose: 'jalan-a' | 'jalan-b' | 'berdiri-pergi'): OpsiTokoh => ({
    siapa: 'nasabah', pose, ekspresi, pandang: 'depan', kunci: true, ...(kanan && pose !== 'berdiri-pergi' ? { hadap: 'kanan' as const } : {}),
  });

  // Bingkai antara duduk-turun (bila generator punya): duduk -> duduk-turun (TAHAN_TURUN md) -> berdiri berbalik.
  const turun = ctx.dudukTurun && gambar ? bingkaiTurun({ gambar: gambar(opsi('berdiri-pergi')), titik: titik0, skala: s0 }, nLama, gambar) : null;
  const tBerdiri = turun ? J.berdiri[0] + TAHAN_TURUN : J.berdiri[0];
  // Jarak mendatar kursi -> awal jalan (berdiri di samping kursi), dibagi dua di titik tukar. Dengan bingkai antara:
  // jarak kepala duduk -> antara dan antara -> berdiri, masing-masing dibagi dua.
  const dxBerdiri = bagiDua(titik0.x - nLama.titik.x);
  const [keAntara, dariAntara] = bagiDua(-(turun?.keDuduk ?? 0));
  const [keBerdiri, dariBerdiri] = turun ? bagiDua(-turun.keAntara) : dxBerdiri;
  aktor.push({ jenis: 'tokoh', kunci: 'lama-nasabah', letak: nLama });
  const penggal: Penggal[] = [{ target: 'x:lama-nasabah', t0: 0, t1: J.berdiri[0], skala: nLama.skala, ke: [turun ? keAntara : dxBerdiri[0], -8], lamaKeluar: 120 }];
  if (turun) {
    aktor.push({ jenis: 'tokoh', kunci: 'turun', letak: turun.letak });
    penggal.push({ target: 'x:turun', t0: J.berdiri[0], t1: tBerdiri, skala: turun.letak.skala, dari: [-dariAntara, 6], lamaMasuk: 70, ke: [keBerdiri, -6], lamaKeluar: 60 });
  }
  gerak.push(...gerakPenggal(T, penggal));
  if (ctx.lama?.prop.some((p) => p.id === 'kunci') && !ctx.baru.prop.some((p) => p.id === 'kunci')) {
    const k = ctx.lama.prop.find((p) => p.id === 'kunci')!;
    aktor.push({ jenis: 'prop', kunci: 'lama-kunci', prop: k });
    // Diambil saat bangkit: habis tepat saat pose berdiri (kunci di tangan) muncul. Frame duduk-turun raster yang
    // sudah memegang kunci: kunci meja hilang SEKETIKA saat frame itu muncul (tidak pernah dua kunci).
    const pegang = !!turun && kunciTergambar(turun.letak.gambar);
    gerak.push({
      target: 'x:lama-kunci',
      keyframes: pegang ? kf('opacity', T, [[0, 1], [J.berdiri[0], 1], [J.berdiri[0], 0]])
        : turun ? pudarKeluar(T, J.berdiri[0] + 40, tBerdiri) : pudarKeluar(T, J.berdiri[0], J.berdiri[1]),
    });
  }
  aktor.push({
    jenis: 'jalan', kunci: 'jalan', titik0, z: Z.nasabah,
    salinan: [
      { id: 'a', opsi: opsi('jalan-a'), cermin: !kanan },
      { id: 'b', opsi: opsi('jalan-b'), cermin: !kanan },
      { id: 'diam', opsi: opsi('berdiri-pergi'), cermin: false },
    ],
  });
  const j = gerakJalan(T, J.jalan[0], J.jalan[1], jalur, titik0);
  const tBelakang = Math.round(J.jalan[0] + (1 - pecahanDepan(jalurMasuk, ctx.depanMulai)) * (J.jalan[1] - J.jalan[0]));
  gerak.push(
    { target: 'x:jalan', keyframes: j.transform },
    // Muncul SEKETIKA saat pose duduk(-turun) hilang; memudar hanya saat keluar lewat bukaan pintu.
    { target: 'x:jalan', keyframes: kf('opacity', T, [[0, 0], [tBerdiri, 0], [tBerdiri, 1], [J.keluar[0], 1], [J.keluar[1], 0]]) },
    { target: 'x:jalan', keyframes: kf('zIndex', T, [[0, Z.nasabah], [tBelakang, Z.nasabah], [tBelakang, Z.belakang]]) },
    { target: 'x:jalan:a', keyframes: j.a },
    { target: 'x:jalan:b', keyframes: j.b },
    { target: 'x:jalan:diam', keyframes: kf('opacity', T, [[0, 1], [J.jalan[0], 1], [J.jalan[0], 0]]) },
    // Berdiri: pose berdiri naik dari sedikit di bawah posisinya (dan dari separuh jarak mendatar sisanya).
    {
      target: 'x:jalan:diam',
      keyframes: kf('transform', T, [[0, geser(-dariBerdiri, turun ? 10 : 14, s0)], [tBerdiri, geser(-dariBerdiri, turun ? 10 : 14, s0), OUT], [turun ? Math.min(J.jalan[0], tBerdiri + 100) : J.berdiri[1], geser(0, 0, s0)]]),
    },
  );
  if (r.pintu) {
    gerak.push({
      target: 'pintu',
      keyframes: kf('transform', T, [[0, PINTU_TUTUP], [J.pintuBuka[0], PINTU_TUTUP, OUT], [J.pintuBuka[1], PINTU_BUKA], [J.pintuTutup[0], PINTU_BUKA, IN_OUT], [J.pintuTutup[1], PINTU_TUTUP]]),
    });
  }
  const kecil = gantiKecil(ctx, T, { nasabah: true, prop: new Set(['kunci']) });
  aktor.push(...kecil.aktor);
  gerak.push(...kecil.gerak);
  const kp = ctx.kamPintu ?? ctx.kamBaru;
  const awal = ctx.kamLama ?? kp;
  gerak.push(...gerakKamera(ctx, T, [[0, awal, IN_OUT], [samaKamera(awal, kp) ? 0 : J.kamera, kp], [J.pintuTutup[0], kp, IN_OUT], [T, ctx.kamBaru]]));
  return { jenis: 'pergi', durasi: T, aktor, gerak, lewati: false };
}

/**
 * Jadwal kartu (md, sesudah larut lokasi bila ada): kartu MUNCUL di tepi dekat meja di sisi pemain (`kartuSimpan`;
 * pemain di luar bingkai, kiri kamera, yang membukanya) sambil terdorong masuk sedikit (`masuk` = selesai muncul),
 * lalu meluncur ke tengah meja (`geser` = mendarat) dalam SATU dorongan (JALUR_KARTU); Bu Rina melirik kartu saat
 * kartu bergerak; Miss Raksa baru menunjuk SESUDAH kartu mendarat (ia menanggapi kartu yang dibuka pemain, bukan
 * memindahkannya).
 */
export const JADWAL_KARTU = { larut: 450, masuk: 160, geser: 620, lihat: 260, tunjuk: 680, total: 960 } as const;

/**
 * Jalur kartu (satuan dunia): Bezier kubik dari arah pemain ke landasan (`kartuMeja`), TIDAK lurus. Tangan Miss Raksa
 * bertumpu di meja (pose dengar/jelaskan) tepat di atas titik simpan dan tetap di sana sampai ia menunjuk, sedangkan
 * kartu digambar di BAWAH lapisan tangan-di-meja: jalur lurus/lengkung tipis ke landasan melintas di bawah jari
 * (kesannya kartu menembus tangan). Jadi kartu tetap RENDAH, di pita antara ujung jari dan bibir meja dekat
 * (`rendah`: ± 1 piksel seni di bawah `kartuSimpan`, supaya tepi belakang kartu tidak menyentuh ujung jari), dan baru
 * berbelok naik di bawah landasan (`belok`), di kanan tangan.
 * - `dorong`: titik mula (tersembunyi), kiri-bawah `kartuSimpan` (arah pemain); kartu muncul sambil terdorong masuk.
 *   Rendah = pita SEMPIT: tepi belakang kartu 1 piksel seni di bawah ujung jari, tepi bawahnya 1 baris di balik bibir
 *   meja dekat (lapisan depanMeja) selama melintas di depan tangan; lebih rendah = garis bawah kartu hilang di bibir meja.
 * - `rendah`: titik kendali 1 = kartuSimpan + (dx, dy).
 * - `belok`: titik kendali 2 = (x landasan + dx, y terendah kartuSimpan/landasan + dy).
 * Celah kartu ke piksel tangan di meja >= 1 piksel seni di seluruh jalur untuk semua frame duduk Miss Raksa selain
 * tunjuk (rencana.test.ts: masker piksel atlas + PNG kartu; tools/uji-panggung.mjs: bingkai demi bingkai di peramban).
 */
export const JALUR_KARTU = { dorong: [-14, 6], rendah: [44, 4], belok: [-10, 4], cuplik: 16 } as const;

/** Titik Bezier kubik pada parameter u. */
function bezier3(p: readonly Titik[], u: number): Titik {
  const v = 1 - u;
  const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return { x: a * p[0]!.x + b * p[1]!.x + c * p[2]!.x + d * p[3]!.x, y: a * p[0]!.y + b * p[1]!.y + c * p[2]!.y + d * p[3]!.y };
}

/**
 * Keyframe transform kartu (relatif titik akhirnya): diam di titik mula sampai `t0`, lalu satu dorongan sepanjang
 * JALUR_KARTU sampai `t1` (pelan-cepat-pelan: smoothstep, dicuplik `cuplik` segmen linear).
 */
function jejakKartu(dari: Titik, ke: Titik, t0: number, t1: number, s: number): Jejak[] {
  const J = JALUR_KARTU;
  const p: Titik[] = [
    { x: dari.x + J.dorong[0], y: dari.y + J.dorong[1] },
    { x: dari.x + J.rendah[0], y: dari.y + J.rendah[1] },
    { x: ke.x + J.belok[0], y: Math.max(dari.y, ke.y) + J.belok[1] },
    ke,
  ];
  const hasil: Jejak[] = [];
  for (let i = 0; i <= J.cuplik; i++) {
    const tau = i / J.cuplik;
    const b = i === J.cuplik ? ke : bezier3(p, tau * tau * (3 - 2 * tau));
    hasil.push([Math.round(t0 + (t1 - t0) * tau), geser(b.x - ke.x, b.y - ke.y, s)]);
  }
  return hasil;
}

/**
 * Kartu polis (aksi 'kartu'): bila lokasinya berganti di baris yang sama (b4-polis-intro.1: parkiran -> meja),
 * LARUT lokasi dulu (tokoh di meja muncul dengan pose sebelum kartu), BARU kartu muncul di tepi dekat meja di sisi
 * pemain, meluncur ke tengah meja, dan sesudah mendarat Miss Raksa menunjuk. Pose berganti seketika di titik gerak
 * (tanpa badan ganda).
 */
export function rencanaKartu(ctx: KonteksRencana, gambar?: (o: OpsiTokoh) => LetakTokoh['gambar']): Rencana {
  const J = JADWAL_KARTU;
  const pindah = !!ctx.lama && !!ctx.kamLama && ctx.lama.komposisi.lokasi !== ctx.baru.komposisi.lokasi;
  const D = pindah ? J.larut : 0;
  const T = D + J.total;
  const kartu = ctx.baru.prop.find((p) => p.id === 'kartu');
  const dari = ctx.baru.ruang.tempat.kartuSimpan;
  const aktor: AktorTransien[] = [];
  const gerak: GerakAktor[] = [];
  const penggal: Penggal[] = [];
  if (pindah) {
    const l = larutLokasi(ctx, T, D, { mentor: true, nasabah: true });
    aktor.push(...l.aktor);
    gerak.push(...l.gerak);
    if (cariTokoh(ctx.baru, 'nasabah') && !cariTokoh(ctx.lama, 'nasabah')) gerak.push({ target: 'chip', keyframes: pudarMasuk(T, Math.round(D * LARUT_TOKOH), D) });
  }
  if (kartu) {
    gerak.push({ target: 'prop:kartu', keyframes: pudarMasuk(T, D, D + J.masuk) });
    if (dari) {
      // Terdorong masuk dari tepi dekat sambil muncul, meluncur rendah di depan tangan Miss Raksa, lalu berbelok naik
      // ke landasan (JALUR_KARTU): tidak pernah melintas di bawah tangan yang bertumpu di meja.
      gerak.push({ target: 'prop:kartu', keyframes: kf('transform', T, jejakKartu(dari, kartu.titik, D, D + J.geser, kartu.skala)) });
    }
  }
  // Tokoh: pose sebelum kartu (pose lama di tempat yang sama; sesudah pindah lokasi: pose mendengar di kursinya,
  // menatap lawan bicara) -> pose akhir (menunjuk / melihat kartu) di titik gerak.
  const tLarut = Math.round(D * LARUT_TOKOH);
  for (const siapa of ['mentor', 'nasabah'] as const) {
    const b = cariTokoh(ctx.baru, siapa);
    const a = cariTokoh(ctx.lama, siapa);
    const tukar = D + (siapa === 'mentor' ? J.tunjuk : J.lihat);
    const tunjuk: [number, number] = siapa === 'mentor' ? [-6, 3] : [0, 3];
    if (!b) {
      if (a && !pindah) {
        aktor.push({ jenis: 'tokoh', kunci: `lama-${siapa}`, letak: a });
        gerak.push({ target: `x:lama-${siapa}`, keyframes: pudarKeluar(T, 0, 190) });
      }
      continue;
    }
    let pra: LetakTokoh | null = null;
    if (!pindah) {
      if (a && a.tanda !== b.tanda) pra = a;
    } else if (gambar) {
      const o = b.opsi;
      const opsiPra: OpsiTokoh = o.siapa === 'mentor'
        ? { ...o, pose: poseAdalahDuduk(b) ? 'duduk-dengar' : o.pose, pandang: 'lawan' }
        : { ...o, pandang: 'lawan' };
      if (JSON.stringify(opsiPra) !== JSON.stringify(o)) pra = letakDengan(b, opsiPra, b.titik, b.skala, b.z, gambar);
    }
    if (!pra) {
      if (pindah) penggal.push({ target: `tokoh:${siapa}`, t0: tLarut, t1: T, skala: b.skala, pudar: D - tLarut });
      else if (!a) gerak.push({ target: `tokoh:${siapa}`, keyframes: pudarMasuk(T, 0, 190) });
      continue;
    }
    const kunci = pindah ? `pra-${siapa}` : `lama-${siapa}`;
    aktor.push({ jenis: 'tokoh', kunci, letak: pra });
    const arah = samaTempat(pra, b) ? { dari: tunjuk, lamaMasuk: 220, ke: undefined } : arahTukar(pra, b);
    penggal.push(
      pindah
        ? { target: `x:${kunci}`, t0: tLarut, t1: tukar, skala: pra.skala, pudar: D - tLarut, ke: arah.ke, lamaKeluar: 100 }
        : { target: `x:${kunci}`, t0: 0, t1: tukar, skala: pra.skala, ke: arah.ke, lamaKeluar: 100 },
      { target: `tokoh:${siapa}`, t0: tukar, t1: T, skala: b.skala, dari: arah.dari, lamaMasuk: arah.lamaMasuk },
    );
  }
  gerak.push(...gerakPenggal(T, penggal));
  if (!pindah) {
    const kecil = gantiKecil(ctx, T, { mentor: true, nasabah: true, prop: new Set(['kartu']) });
    aktor.push(...kecil.aktor);
    gerak.push(...kecil.gerak);
    if (ctx.kamLama && !samaKamera(ctx.kamLama, ctx.kamBaru)) gerak.push(...gerakKamera(ctx, T, [[0, ctx.kamLama, IN_OUT], [420, ctx.kamBaru]]));
  }
  return { jenis: 'kartu', durasi: T, aktor, gerak, lewati: false };
}

/** Jadwal pembuka (md): [eksterior 1,3 dtk bila ada] + koridor/pintu didorong pelan ± 1,65 dtk + larut ± 0,45 dtk. */
export const JADWAL_PEMBUKA = { eksterior: 1300, dorong: 1650, larut: 450 } as const;

/**
 * Pembuka lokasi: (eksterior bila tersedia) -> pintu ruang layanan + papan nama dengan dorongan kamera pelan ->
 * larut ke meja layanan (komposisi akhir: Miss Raksa menyambut). Hanya visual; tidak mengubah state.
 */
export function rencanaPembuka(luar: SusunanAdegan, kamDari: Kamera, kamKe: Kamera, eksterior: { nama: string; aset: string } | null): Rencana {
  const J = JADWAL_PEMBUKA;
  const e = eksterior ? J.eksterior : 0;
  const T = e + J.dorong + J.larut;
  const aktor: AktorTransien[] = [{ jenis: 'adegan', kunci: 'pembuka', susunan: luar, kamera: kamKe, tanpaTokoh: true }];
  const gerak: GerakAktor[] = [
    { target: 'x:pembuka:kamera', keyframes: kfKamera(T, [[0, kamDari], [e, kamDari, IN_OUT], [e + J.dorong, kamKe]]) },
    { target: 'x:pembuka', keyframes: kf('opacity', T, [[0, 1], [e + J.dorong, 1, 'ease-in-out'], [T, 0]]) },
  ];
  if (eksterior) {
    aktor.push({ jenis: 'eksterior', kunci: 'eksterior', nama: eksterior.nama, aset: eksterior.aset });
    gerak.push({ target: 'x:eksterior', keyframes: kf('opacity', T, [[0, 1], [e - 300, 1, 'ease-in-out'], [e, 0]]) });
  }
  return { jenis: 'pembuka', durasi: T, aktor, gerak, lewati: true };
}

/** Semua target yang dipakai rencana (untuk uji & diagnosis). */
export function targetRencana(r: Rencana): string[] {
  return [...new Set(r.gerak.map((g) => g.target))];
}
