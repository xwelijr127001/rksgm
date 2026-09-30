/**
 * KAMERA PANGGUNG v3 (docs/cerita/ADEGAN-AUTO1.md bagian 2): memilih persegi dunia 1600 x 900 yang tampil di kotak
 * panggung (px). MURNI (tanpa DOM) supaya bisa diuji.
 *
 * Aturan:
 *  - Kotak panggung selalu terisi dunia (tidak pernah memperlihatkan area di luar 1600 x 900).
 *  - Persegi bingkai (`rect`) diusahakan utuh terlihat ("contain"); bila rasio kotak berbeda, dunia di sekitarnya
 *    ikut terlihat, bukan dipotong ke tengah.
 *  - `inti` (kepala + tangan tokoh) WAJIB terlihat di dalam kotak dikurangi `pad` (mis. pita bawah untuk label
 *    suasana), walau harus memperkecil skala; kepala diutamakan (atas menang). ("Lewati pembuka" v5.1 di kotak dialog.)
 *  - Bingkai: 'lebar' (desktop/tablet, dua tokoh + pintu) dan 'hp' (<= 520 px: dua tokoh dirapatkan, bukan
 *    seluruh desktop yang diperkecil). Tidak ada potong ke wajah per baris.
 *  - Kedatangan/kepergian mode piksel (v5): `pasKameraPintu` = skala piksel percakapan, hanya bergeser ke pintu
 *    (pintu boleh terpotong; tokoh tidak pernah diperkecil demi memuat pintu/ruangan utuh).
 *  - Kedatangan HP sempit (v5.1): `pasKameraBukaan` = bingkai PINTU lebih dulu (skala sama, bukaan utuh), baru kembali
 *    ke bingkai kedatangan saat Miss Raksa mempersilakan.
 */
import type { IdLokasiAdegan } from '../../tipe';
import { DUNIA_H, DUNIA_W, gabungKotak, potongKeDunia, skalaKotak, type Kotak } from './dunia';
import { SATUAN_PIKSEL } from './piksel';

export type JenisBingkai = 'lebar' | 'hp';

/** Pandangan kamera: skala (px per satuan dunia) + sudut kiri-atas pandangan dalam satuan dunia. */
export interface Kamera {
  s: number;
  x: number;
  y: number;
}

export interface Pad {
  atas: number;
  bawah: number;
  kiri: number;
  kanan: number;
}

export const TANPA_PAD: Pad = { atas: 0, bawah: 0, kiri: 0, kanan: 0 };

/** Batas lebar kotak panggung untuk bingkai HP (kontrak: `dua-hp` <= 520 px). */
export const BATAS_HP = 520;

export function jenisBingkai(lebarPx: number): JenisBingkai {
  return lebarPx <= BATAS_HP ? 'hp' : 'lebar';
}

/** Bingkai dasar kontrak: `dua` = dunia x 120-1560; `dua-hp` = x 430-1250, y 170-790. */
export const BINGKAI_LEBAR: Kotak = { x: 120, y: 130, w: 1440, h: 660 };
export const BINGKAI_HP: Kotak = { x: 430, y: 170, w: 820, h: 620 };

/**
 * Persegi bingkai untuk lokasi & jenis layar. Parkiran di HP dipusatkan pada tokoh (posisi tokoh berasal dari
 * `tempat` ruang, bukan angka tetap). `pintu-luar` = seluruh dunia (pembuka mengatur dorongan kameranya sendiri).
 */
export function rectBingkai(lokasi: IdLokasiAdegan, jenis: JenisBingkai, inti: Kotak | null): Kotak {
  if (lokasi === 'pintu-luar') return { x: 0, y: 0, w: DUNIA_W, h: DUNIA_H };
  if (jenis === 'lebar') return BINGKAI_LEBAR;
  if (lokasi === 'parkiran' && inti) {
    const cx = inti.x + inti.w / 2;
    return { x: cx - BINGKAI_HP.w / 2, y: BINGKAI_HP.y, w: BINGKAI_HP.w, h: BINGKAI_HP.h };
  }
  return BINGKAI_HP;
}

const batas = (v: number, min: number, maks: number) => Math.min(maks, Math.max(min, v));

/**
 * Opsi piksel bulat (mode piksel, docs/cerita/aset/PIKSEL.md): saat DIAM, px CSS per satuan dunia x SATUAN_PIKSEL (4)
 * x devicePixelRatio harus bilangan bulat k >= 1 (satu piksel seni = k piksel perangkat, tanpa skala pecahan).
 */
export interface OpsiPiksel {
  /** Piksel perangkat per satuan dunia pada skala 1 = SATUAN_PIKSEL x devicePixelRatio (mis. 4, 5, 6, 8, 12). */
  q: number;
  /**
   * Kotak yang WAJIB utuh di dalam kotak dikurangi pad (kedua wajah, tangan kunci, papan nama; saat kedatangan juga
   * pintu). Digabung dengan `inti`. k dipilih sebesar mungkin yang masih memuat kotak ini.
   */
  wajib?: Kotak | null;
  /**
   * Batas atas perbesaran terhadap skala bingkai (desain) supaya bingkai tidak berubah menjadi potret dekat saat kotak
   * wajib kecil (satu tokoh): k <= skala desain x `maksLebih` x q. Bawaan 1,25.
   */
  maksLebih?: number;
  /**
   * Pecahan piksel perangkat (0..1) posisi asal kotak panggung di halaman (x, y), mis. 0,5 bila kotak mulai di
   * px CSS 80,333 pada dpr 1,5. Terjemahan dipilih supaya ASAL + terjemahan jatuh di piksel perangkat bulat.
   */
  asal?: { x: number; y: number };
  /**
   * Pandangan lebih LEBAR daripada dunia (letterbox mendatar): tepi kanan dunia rata dengan tepi kanan panggung, jadi
   * perpanjangan tepi latar hanya di KIRI. Untuk ruang yang tepi kanannya BUKAAN PINTU (ruang layanan: daun pintu
   * meluas ke luar dunia): perpanjangan kolom pintu/koridor di kanan terbaca sebagai bidang gelap/aneh, sedangkan
   * dinding & lantai kiri berlanjut wajar. Tanpa nilai = dunia dipusatkan.
   */
  rataKanan?: boolean;
  /**
   * Kotak yang wajib utuh di dalam kotak panggung TANPA pita bawah: tokoh yang tidak pernah berada di bawah label
   * suasana (pita bawah KIRI), mis. Bu Rina di kanan ruang layanan. Ikut menentukan k (muat tanpa pita) & rentang
   * posisi, sama seperti `wajib` tetapi tanpa `pad.bawah`.
   */
  bebas?: Kotak | null;
}

/** Perbesaran maksimum di atas skala bingkai yang boleh dipakai pemaskan piksel bulat. */
export const MAKS_LEBIH_PIKSEL = 1.25;

/** Skala muat (px per satuan dunia) sebuah kotak dunia di ruang W x H dikurangi pad; Infinity bila tanpa kotak. */
function skalaMuat(kotak: Kotak | null, W: number, H: number, pad: Pad): number {
  if (!kotak) return Infinity;
  const ruangW = Math.max(1, W - pad.kiri - pad.kanan);
  const ruangH = Math.max(1, H - pad.atas - pad.bawah);
  return Math.min(ruangW / Math.max(1, kotak.w), ruangH / Math.max(1, kotak.h));
}

/**
 * Menyesuaikan kamera ke kotak W x H (px). `rect` = yang diusahakan terlihat; `inti` = yang wajib terlihat di dalam
 * kotak dikurangi `pad` (px).
 *
 * `piksel` (mode piksel, kamera DIAM): skala dipilih k / q dengan k bulat terbesar yang (a) masih memuat
 * `inti` + `piksel.wajib` di kotak dikurangi pad dan (b) tidak melebihi skala bingkai x maksLebih; k >= 1. Bila
 * pandangan itu lebih besar daripada dunia, dunia dipusatkan (letterbox: latar panggung = warna tepi ruang), jadi
 * sisi dunia bisa terlihat. Pergeseran dipaskan supaya tepi piksel seni jatuh di piksel perangkat (terjemahan x
 * dpr bulat, relatif terhadap kotak panggung). Selama animasi kamera boleh pecahan (tanpa opsi ini).
 */
export function pasKamera(W: number, H: number, rect: Kotak, inti: Kotak | null = null, pad: Pad = TANPA_PAD, piksel?: OpsiPiksel | null): Kamera {
  if (!(W > 0) || !(H > 0)) return { s: 1, x: 0, y: 0 };
  const sMin = Math.max(W / DUNIA_W, H / DUNIA_H);
  let s = Math.max(sMin, Math.min(W / rect.w, H / rect.h));
  const intiDunia = potongKeDunia(inti);
  if (intiDunia) {
    const sInti = skalaMuat(intiDunia, W, H, pad);
    if (s > sInti) s = Math.max(sMin, sInti);
  }
  const q = piksel && piksel.q > 0 && Number.isFinite(piksel.q) ? piksel.q : 0;
  const wajib = q ? gabungKotak(intiDunia, potongKeDunia(piksel!.wajib ?? null)) : intiDunia;
  const bebas = q ? potongKeDunia(piksel!.bebas ?? null) : null;
  if (q) {
    // Piksel bulat: hanya pita bawah (label suasana / tombol) yang dijaga; tepi atas & samping boleh disentuh kotak
    // wajib, supaya lompatan k (mis. 2,98 -> 2) tidak terjadi hanya karena margin hiasan beberapa px.
    pad = { atas: 0, bawah: pad.bawah, kiri: 0, kanan: 0 };
    const sMaks = Math.min(skalaMuat(wajib, W, H, pad), skalaMuat(bebas, W, H, TANPA_PAD), s * (piksel!.maksLebih ?? MAKS_LEBIH_PIKSEL));
    s = Math.max(1, Math.floor(sMaks * q + 1e-6)) / q;
  }
  const vw = W / s;
  const vh = H / s;
  let x = rect.x + rect.w / 2 - vw / 2;
  let y = rect.y + rect.h / 2 - vh / 2;
  // Rentang posisi yang menjaga kotak wajib utuh (x <= kiri, x + vw >= kanan; sama untuk y).
  let rx: [number, number] = [-Infinity, Infinity];
  let ry: [number, number] = [-Infinity, Infinity];
  if (wajib) {
    const kiri = wajib.x - pad.kiri / s;
    const kanan = wajib.x + wajib.w + pad.kanan / s;
    const atas = wajib.y - pad.atas / s;
    const bawah = wajib.y + wajib.h + pad.bawah / s;
    rx = [kanan - vw, kiri];
    ry = [bawah - vh, atas];
  }
  if (bebas) {
    rx = [Math.max(rx[0], bebas.x + bebas.w - vw), Math.min(rx[1], bebas.x)];
    ry = [Math.max(ry[0], bebas.y + bebas.h - vh), Math.min(ry[1], bebas.y)];
  }
  // Masuk rentang; tidak muat = sisi kiri/atas (kepala) diutamakan.
  x = Math.min(Math.max(x, rx[0]), rx[1]);
  y = Math.min(Math.max(y, ry[0]), ry[1]);
  // Pandangan lebih besar daripada dunia (hanya mungkin di mode piksel): dunia dipusatkan (letterbox), atau rata kanan
  // (OpsiPiksel.rataKanan: ruang bertepi kanan pintu).
  x = vw > DUNIA_W ? (q && piksel!.rataKanan ? DUNIA_W - vw : (DUNIA_W - vw) / 2) : batas(x, 0, DUNIA_W - vw);
  y = vh > DUNIA_H ? (DUNIA_H - vh) / 2 : batas(y, 0, DUNIA_H - vh);
  if (q) {
    x = geserBulat(x, s, q, vw, DUNIA_W, rx, piksel!.asal?.x ?? 0);
    y = geserBulat(y, s, q, vh, DUNIA_H, ry, piksel!.asal?.y ?? 0);
  }
  return { s, x, y };
}

/** Ruang napas (satuan dunia = 8 piksel seni) di kiri kotak wajib bingkai pintu, bila lebar pandangan cukup. */
export const NAPAS_PINTU = 32;

/** Masukan bingkai kedatangan/kepergian (pasKameraPintu). */
export interface OpsiPintu {
  /** Piksel perangkat per satuan dunia pada skala 1 (qPiksel(dpr)). */
  q: number;
  /** Kotak yang WAJIB utuh (kepala rapat + tangan tokoh selama gerak masuk/pergi), di atas pita `pad.bawah`. */
  wajib: Kotak;
  /** Bukaan pintu: pandangan digeser ke kanan seperlunya supaya bagian bukaan sebanyak mungkin tampak. */
  pintu: Kotak | null;
  pad: Pad;
  asal?: { x: number; y: number };
}

/**
 * BINGKAI KEDATANGAN / KEPERGIAN mode piksel (v5, review HP 28 Sep): skala piksel SAMA dengan kamera percakapan
 * `dasar` (k bulat yang sama; tidak pernah menjauh ke seluruh ruangan dengan tokoh kecil), hanya bergeser:
 *  - mendatar: dari x percakapan, geser ke kanan seperlunya sampai tepi kanan bukaan pintu tampak (dipotong bila tidak
 *    muat), tetapi tepi kiri `wajib` (kepala Miss Raksa) tetap utuh: pintu boleh terpotong, tokoh tidak;
 *  - tegak: y percakapan bila `wajib` + pita bawah muat, selain itu geser seminimal mungkin (atas = kepala diutamakan);
 *  - pandangan lebih lebar/tinggi daripada dunia (desktop): sumbu itu sama dengan kamera percakapan (tanpa gerak).
 * k TIDAK PERNAH turun di bawah k percakapan: bila `wajib` sedikit lebih lebar daripada pandangan (HP 360 px dpr 3),
 * kelebihannya dibagi rata kiri-kanan (kotak kepala rapat masih bermargin ± 5 piksel seni); pintu lalu tidak tampak.
 * Tegak tidak muat = atas (kepala) diutamakan. Diam = piksel bulat & terjemahan di piksel perangkat (seperti pasKamera).
 */
export function pasKameraPintu(W: number, H: number, dasar: Kamera, o: OpsiPintu): Kamera {
  if (!(W > 0) || !(H > 0) || !(o.q > 0)) return dasar;
  const q = o.q;
  const s = dasar.s;
  const vw = W / s;
  const vh = H / s;
  const w = potongKeDunia(o.wajib) ?? o.wajib;
  const kiri = w.x;
  const kanan = w.x + w.w;
  const atas = w.y;
  const bawah = w.y + w.h + o.pad.bawah / s;
  let x = dasar.x;
  if (vw <= DUNIA_W) {
    // Ruang napas di kiri kepala Miss Raksa (sanggul tidak menempel tepi/sudut membulat panggung): 8 piksel seni,
    // paling banyak seperempat sisa lebar, sisanya untuk pintu.
    const napas = Math.max(0, Math.min(NAPAS_PINTU, (vw - (kanan - kiri)) / 4));
    if (o.pintu) x = Math.max(x, Math.min(DUNIA_W, o.pintu.x + o.pintu.w) - vw);
    x = kanan - kiri > vw ? (kiri + kanan - vw) / 2 : Math.max(Math.min(x, kiri - napas), kanan - vw);
    x = batas(x, 0, DUNIA_W - vw);
  }
  let y = dasar.y;
  if (vh <= DUNIA_H) {
    if (y + vh < bawah) y = bawah - vh;
    if (y > atas) y = atas;
    y = batas(y, 0, DUNIA_H - vh);
  }
  const f = o.asal ?? { x: 0, y: 0 };
  if (vw <= DUNIA_W) x = geserBulat(x, s, q, vw, DUNIA_W, [kanan - vw, kiri], f.x);
  if (vh <= DUNIA_H) y = geserBulat(y, s, q, vh, DUNIA_H, [bawah - vh, atas], f.y);
  return { s, x, y };
}

/**
 * BINGKAI PINTU kedatangan (v5.1, review HP 29 Sep). Di HP sempit bingkai kedatangan `kp` (pasKameraPintu: kepala
 * Miss Raksa utuh di kiri) hanya memperlihatkan potongan tipis bukaan di tepi kanan, jadi pintu yang dibuka tidak
 * terbaca. Bingkai ini dipakai LEBIH DULU (pintu dibuka, Bu Rina masuk): skala & tinggi SAMA dengan `kp` (k tidak turun,
 * tokoh tidak mengecil, tidak ada gerak tegak), hanya digeser ke kanan sampai tepi kanan bukaan yang tampak (= tepi kanan
 * dunia) masuk pandangan. Miss Raksa boleh terpotong di tepi kiri selama itu; kamera kembali ke `kp` saat ia
 * mempersilakan (rencana.ts JADWAL_MASUK). Diam = piksel bulat & terjemahan di piksel perangkat.
 * null = tidak perlu: bukaan sudah utuh di `kp` (desktop, HP lebar) atau pandangan lebih lebar daripada dunia.
 */
export function pasKameraBukaan(W: number, H: number, kp: Kamera, bukaan: Kotak, q: number, asal?: { x: number; y: number }): Kamera | null {
  if (!(W > 0) || !(H > 0) || !(q > 0)) return null;
  const vw = W / kp.s;
  if (vw > DUNIA_W) return null;
  const kanan = Math.min(DUNIA_W, bukaan.x + bukaan.w);
  // Toleransi satu piksel perangkat (pembulatan terjemahan kp).
  const satu = SATUAN_PIKSEL / (kp.s * q);
  if (kp.x + vw >= kanan - satu - 1e-6) return null;
  const x = geserBulat(batas(kanan - vw, 0, DUNIA_W - vw), kp.s, q, vw, DUNIA_W, [kanan - vw, DUNIA_W - vw], asal?.x ?? 0);
  return { s: kp.s, x, y: kp.y };
}

/**
 * Posisi pandangan (satuan dunia) dipaskan supaya tepi piksel seni jatuh di piksel perangkat: posisi perangkat asal
 * dunia (asal kotak panggung + terjemahan) bulat, yaitu x * s * dpr = m + `f` (m bulat, f = pecahan piksel perangkat
 * asal kotak panggung di halaman; 0 bila kotak sudah di piksel perangkat). Dipilih titik kisi terdekat di dalam
 * rentang sah = di dalam dunia (bila pandangan muat) DAN rentang yang menjaga kotak wajib utuh (`rentang`). Rentang
 * lebih sempit daripada satu piksel perangkat = sisi kiri/atas wajib diutamakan (kepala), sisi lawannya boleh
 * meleset < 1 piksel perangkat.
 */
function geserBulat(x: number, s: number, q: number, v: number, dunia: number, rentang: [number, number], f = 0): number {
  const dpr = q / SATUAN_PIKSEL;
  const langkah = 1 / (s * dpr); // satuan dunia per piksel perangkat
  const e = 1e-9;
  const dekat = (a: number) => (Math.round(a / langkah - f) + f) * langkah;
  const naik = (a: number) => (Math.ceil(a / langkah - f - e) + f) * langkah;
  const turun = (a: number) => (Math.floor(a / langkah - f + e) + f) * langkah;
  let b = dekat(x);
  if (v <= dunia) {
    const min = Math.max(0, rentang[0]);
    const maks = Math.min(dunia - v, rentang[1]);
    if (min <= maks + e) {
      if (b < min - e) b = naik(min);
      if (b > maks + e) b = turun(maks);
      if (b < min - e) b = Math.max(naik(0), turun(maks));
    }
    if (b < -e) b = naik(0);
    if (b + v > dunia + e) b = turun(dunia - v);
  }
  return Math.abs(b) < e ? 0 : b;
}

/** Pecahan (0..1) posisi piksel perangkat; nilai sangat dekat bilangan bulat = 0 (derau pecahan). */
export function pecahanPiksel(v: number): number {
  const f = v - Math.floor(v);
  return f < 1e-3 || f > 1 - 1e-3 ? 0 : Math.round(f * 1000) / 1000;
}

/** q untuk devicePixelRatio: piksel perangkat per satuan dunia pada skala 1 (SATUAN_PIKSEL x dpr). */
export function qPiksel(dpr: number): number {
  return SATUAN_PIKSEL * (dpr > 0 && Number.isFinite(dpr) ? dpr : 1);
}

/** Piksel perangkat per piksel seni untuk kamera ini (k), atau null bila bukan bilangan bulat (animasi / mode SVG). */
export function pikselPerSeni(k: Kamera, q: number): number | null {
  const v = k.s * q;
  const b = Math.round(v);
  return b >= 1 && Math.abs(v - b) < 1e-6 ? b : null;
}

/** Transform CSS untuk elemen dunia (transform-origin 0 0). Presisi tinggi: skala piksel bulat tidak boleh bergeser. */
export function transformKamera(k: Kamera): string {
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return `translate(${r(-k.x * k.s)}px, ${r(-k.y * k.s)}px) scale(${Math.round(k.s * 1e6) / 1e6})`;
}

export function samaKamera(a: Kamera, b: Kamera): boolean {
  return Math.abs(a.s - b.s) < 1e-4 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
}

/** Persegi dunia yang terlihat dari kamera pada kotak W x H. */
export function pandangan(k: Kamera, W: number, H: number): Kotak {
  return { x: k.x, y: k.y, w: W / k.s, h: H / k.s };
}

/** Kotak dunia -> kotak px di dalam panggung. */
export function keLayar(k: Kamera, kotak: Kotak): Kotak {
  return { x: (kotak.x - k.x) * k.s, y: (kotak.y - k.y) * k.s, w: kotak.w * k.s, h: kotak.h * k.s };
}

/** Bingkai yang juga memperlihatkan pintu (kedatangan / kepergian): bingkai biasa + bukaan pintu. */
export function rectDenganPintu(rect: Kotak, bukaan: Kotak | null | undefined): Kotak {
  if (!bukaan) return rect;
  return gabungKotak(rect, { x: bukaan.x - 30, y: bukaan.y - 20, w: bukaan.w + 60, h: bukaan.h + 20 })!;
}

/**
 * Dorongan kamera pembuka (pintu-luar): dari pandangan lebar ke pintu + papan nama. Tanpa titik fokus = tengah
 * dunia. Mengembalikan persegi awal & akhir (satuan dunia).
 */
export function rectPembuka(fokus: Kotak | null): { dari: Kotak; ke: Kotak } {
  const f = fokus ?? skalaKotak({ x: 0, y: 0, w: DUNIA_W, h: DUNIA_H }, 0.6);
  const ke = skalaKotak(f, 1.12);
  const dari = skalaKotak(f, 1.5);
  return { dari, ke };
}
