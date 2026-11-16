/**
 * Susunan MURNI panggung piksel Episode 2 (tanpa React/CSS, bisa diuji di node): letak tokoh, kotak kepala, kamera, dan letak
 * sisipan telepon (T-015). Dipakai PanggungPiksel.tsx.
 */
import { susunTokoh, type SusunanTokoh } from '../../../seni/piksel';
import { pasKamera, qPiksel, jenisBingkai, type Kamera } from '../../panggung/kamera';
import { DUNIA_H, DUNIA_W, gabungKotak, type Kotak } from '../../panggung/dunia';
import type { AdeganPiksel, TokohDiPiksel } from './adegan';
import { SATUAN_RUANG, type RuangPiksel } from './ruang';

const K = SATUAN_RUANG;
/** Perbesaran di atas skala bingkai yang boleh dipakai piksel bulat (Episode 1: 1,25; kantor HP butuh wajah lebih besar). */
const MAKS_LEBIH = 1.6;
const MAKS_LEBIH_LEBAR = 1.15;
/** D-101: lebar dunia minimum yang tampil di kartu episode (125 piksel seni). */
const LEBAR_MIN_KARTU = 125 * K;

// ------------------------------------------------------------------ susunan murni

export interface TokohTersusun {
  t: TokohDiPiksel;
  s: SusunanTokoh;
  /** Pojok kiri-atas frame di dunia (sebelum cermin). */
  x: number;
  y: number;
  /** Titik kaki di dunia (sumbu cermin). */
  kakiX: number;
}

/** Susun tokoh adegan (pose/arah dari adapter; mata & mulut dari animasi). */
export function susunAdeganPiksel(a: AdeganPiksel, r: RuangPiksel, gerak: { kedip: boolean; mulut: boolean }): TokohTersusun[] {
  const hasil: TokohTersusun[] = [];
  for (const t of a.tokoh) {
    // balikMeja (kantor) bila ruang punya; selain itu slot berdiri ke-i dari n (ruang-ep2.json slot).
    const dasar = (t.tempat === 'balikMeja' ? r.tempat.balikMeja : undefined) ?? r.slot[Math.max(1, t.jumlahSlot)]?.[t.slot] ?? r.slot[1]?.[0];
    if (!dasar) continue;
    const xKhusus = (dasar as { xTokoh?: Record<string, number> }).xTokoh?.[t.id];
    const titik = typeof xKhusus === 'number' ? { ...dasar, x: xKhusus } : dasar;
    const s = susunTokoh(t.tokoh, {
      pose: t.pose as never, hadap: t.satuArah ?? t.hadap, ekspresi: t.ekspresi,
      mata: gerak.kedip ? 'tutup' : 'buka', mulut: t.bicara && gerak.mulut ? 'buka' : 'tutup',
    });
    if (!s) continue;
    hasil.push({ t, s, x: titik.x - s.jangkar.x * K, y: titik.y - s.jangkar.y * K, kakiX: titik.x });
  }
  return hasil;
}

/** Kotak kepala (dunia) tokoh tersusun. */
export function kotakKepalaPiksel(x: TokohTersusun): Kotak {
  const h = x.s.kepalaTinggi * K;
  // + 30 % ke atas: topi/peci tokoh samping (tol, polisi, darto) ikut utuh di bingkai.
  const cx = x.t.cermin ? 2 * x.kakiX - (x.x + x.s.kepala.x * K) : x.x + x.s.kepala.x * K;
  return { x: cx - h / 2, y: x.y + x.s.kepala.y * K - h * 0.8, w: h, h: h * 1.3 };
}

/** Kamera diam piksel bulat: bingkai ruang per kelas layar, kepala + papan wajib terlihat di atas pita dialog. */
export function kameraPiksel(r: RuangPiksel, tokoh: readonly TokohTersusun[], W: number, H: number, dpr: number, bawah: number, penuh = false): Kamera {
  const kepala = tokoh.map(kotakKepalaPiksel).reduce<Kotak | null>((a, b) => gabungKotak(a, b), null);
  const jenis = jenisBingkai(W);
  const rect = r.bingkai[jenis];
  const q = qPiksel(dpr);
  // D-95: layar lebar memperlihatkan ruangnya (perbesaran maks 1,15); HP boleh lebih dekat (wajah terbaca).
  const k = pasKamera(W, H, rect, kepala, { atas: 0, kiri: 0, kanan: 0, bawah }, { q, wajib: gabungKotak(r.papan?.kotak ?? null, r.fokus), maksLebih: jenis === 'lebar' ? MAKS_LEBIH_LEBAR : MAKS_LEBIH });
  if (!penuh) return turunkanKeKaki(k, r, tokoh, W, H, dpr);
  const jepit = (v: number, maks: number) => Math.min(Math.max(0, v), Math.max(0, maks));
  // Kartu episode. (1) D-97 "cover": bila pandangan kamera biasa lebih besar daripada dunia, pakai skala bulat berikutnya yang
  // MENGISI kotak. (2) D-101: skala tidak boleh memperlihatkan kurang dari 125 piksel seni lebarnya (turun skala bulat).
  let kk = Math.round(k.s * q);
  if (W / k.s > DUNIA_W + 1e-6 || H / k.s > DUNIA_H + 1e-6) kk = Math.ceil(Math.max(W / DUNIA_W, H / DUNIA_H) * q - 1e-6);
  while (kk > 1 && W / (kk / q) < LEBAR_MIN_KARTU - 1e-6) kk--;
  if (kk === Math.round(k.s * q)) return k;
  const s = kk / q, vw = W / s, vh = H / s;
  const bulat = (v: number) => Math.round(v * s * dpr) / (s * dpr);
  // Bingkai bawaan (D-97): dipusatkan pada kepala tokoh + fokus ruang. Kartu HP memakai ini (tidak berubah).
  const pusat = gabungKotak(kepala, r.fokus) ?? { x: 0, y: 0, w: DUNIA_W, h: DUNIA_H };
  const x0 = jepit(pusat.x + pusat.w / 2 - vw / 2, DUNIA_W - vw), y0 = jepit(pusat.y + pusat.h / 2 - vh / 2, DUNIA_H - vh);
  // (3) D-101: bingkai WAJIB memuat seluruh kepala tokoh, puncak rambut, dan kaca depan retak (15-57 % kotak fokus kabin, terukur
  // dari tangkapan layar). Bila bingkai bawaan memotongnya (kartu hampir persegi di tata letak lebar): mendatar di TENGAH antara
  // kepala dan kaca depan (angka Designer), tepi atas 5 piksel seni di atas rambut.
  if (tokoh.length && kepala) {
    const kacaKiri = r.fokus ? r.fokus.x + r.fokus.w * 0.15 : kepala.x, kacaKanan = r.fokus ? r.fokus.x + r.fokus.w * 0.57 : kepala.x + kepala.w;
    const rambut = Math.min(...tokoh.map((x) => x.y));
    // Kepala sebenarnya (tepi kiri kotak kamera `kepala` ± tepi rambut).
    const kepalaKiri = kepala.x + kepala.w * 0.03;
    if (!(x0 <= kepalaKiri + 1 && x0 + vw >= kacaKanan - 1 && y0 <= rambut + 1)) {
      const cx = (kepala.x + kepala.w / 2 + (kacaKiri + kacaKanan) / 2) / 2;
      // Kepala utuh menang atas kaca bila keduanya tidak muat.
      const x = Math.min(Math.max(cx - vw / 2, kacaKanan - vw), kepalaKiri);
      return { s, x: bulat(jepit(x, DUNIA_W - vw)), y: bulat(jepit(rambut - 5 * K, DUNIA_H - vh)) };
    }
  }
  return { s, x: bulat(x0), y: bulat(y0) };
}

/** Sisipan telepon di kanvas (px PERANGKAT): jendela dalam (x0, y0, sisi), bingkai `tepi`, skala bulat `k`, dan sudutnya. */
export interface TataSisipan { x0: number; y0: number; sisi: number; tepi: number; k: number; letak: 'kanan-atas' | 'kiri-atas' | 'kiri-bawah-papan' | 'kanan-bawah-papan' }
const potong = (a: Kotak, b: Kotak) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** Kotak luar sisipan (jendela + bingkai). */
export const kotakLuarSisipan = (t: TataSisipan): Kotak => ({ x: t.x0 - t.tepi, y: t.y0 - t.tepi, w: t.sisi + 2 * t.tepi, h: t.sisi + 2 * t.tepi });

/**
 * T-015: letak sisipan telepon. Sisipan TIDAK PERNAH boleh menutupi kotak kepala tokoh di panggung (bug owner: wajah Hendra
 * tepat di atas kepala Miss Raksa di HP). Semua kotak dalam px perangkat kanvas (W x H); `bawah` = pita dialog.
 * Urutan calon: kanan atas (bawaan) -> kiri atas -> kiri di bawah papan -> kanan di bawah papan. Dipilih calon pertama yang
 * bebas dari SEMUA kepala DAN papan nama; bila tidak ada, skala bulat diturunkan (sampai 50 %); bila tetap tidak ada, calon
 * pertama yang bebas dari kepala saja (kepala menang atas papan). Tanpa calon sama sekali = kanan atas (tidak terjadi di naskah;
 * dijaga uji).
 */
export function tataSisipan(W: number, H: number, dpr: number, bawah: number, sisiSeni: number, kepala: readonly Kotak[], papan: Kotak | null): TataSisipan {
  const k0 = Math.max(1, Math.round((H * 0.34) / sisiSeni));
  const tepi = Math.max(2, Math.round(2 * dpr));
  const m = Math.round(10 * dpr) + tepi;
  const calon = (k: number): TataSisipan[] => {
    const sisi = sisiSeni * k;
    const yPapan = papan ? Math.round(papan.y + papan.h) + m : null;
    const c: TataSisipan[] = [{ x0: W - sisi - m, y0: m, sisi, tepi, k, letak: 'kanan-atas' }, { x0: m, y0: m, sisi, tepi, k, letak: 'kiri-atas' }];
    if (yPapan !== null) c.push({ x0: m, y0: yPapan, sisi, tepi, k, letak: 'kiri-bawah-papan' }, { x0: W - sisi - m, y0: yPapan, sisi, tepi, k, letak: 'kanan-bawah-papan' });
    // Harus utuh di kanvas dan di atas pita dialog.
    return c.filter((t) => t.x0 - tepi >= 0 && t.x0 + sisi + tepi <= W && t.y0 + sisi + tepi <= H - bawah);
  };
  const kMin = Math.max(1, Math.ceil(k0 * 0.5));
  const bebas = (t: TataSisipan, papanJuga: boolean) => { const l = kotakLuarSisipan(t); return !kepala.some((h) => potong(l, h)) && !(papanJuga && papan && potong(l, papan)); };
  for (const papanJuga of [true, false]) for (let k = k0; k >= kMin; k--) { const t = calon(k).find((x) => bebas(x, papanJuga)); if (t) return t; }
  const sisi = sisiSeni * k0;
  return { x0: W - sisi - m, y0: m, sisi, tepi, k: k0, letak: 'kanan-atas' };
}

/** Kotak dunia -> px perangkat kanvas untuk kamera `k`. */
const keLayar = (b: Kotak, k: Kamera, dpr: number): Kotak => ({ x: (b.x - k.x) * k.s * dpr, y: (b.y - k.y) * k.s * dpr, w: b.w * k.s * dpr, h: b.h * k.s * dpr });

/** Letak sisipan telepon untuk adegan tersusun (kepala + 2 piksel seni: lompat/napas pembicara ikut aman). null = tanpa telepon. */
export function sisipanAdegan(r: RuangPiksel, tokoh: readonly TokohTersusun[], kamera: Kamera, W: number, H: number, dpr: number, bawah: number, sisiSeni: number): { tata: TataSisipan; kepala: Kotak[] } {
  const kepala = tokoh.map((x) => { const b = kotakKepalaPiksel(x); return keLayar({ x: b.x - 2 * K, y: b.y - 2 * K, w: b.w + 4 * K, h: b.h + 4 * K }, kamera, dpr); });
  return { tata: tataSisipan(Math.round(W * dpr), Math.round(H * dpr), dpr, Math.round(bawah * dpr), sisiSeni, kepala, r.papan ? keLayar(r.papan.kotak, kamera, dpr) : null), kepala };
}

/** Udara minimum di atas kepala sesudah kamera diturunkan (dunia) = 2 piksel seni. */
const UDARA_KEPALA = 2 * K;

/**
 * D-126: di ruang LAPANGAN (tanpa meja layanan: pool, bengkel, tol, wawancara) tokoh berdiri berbadan penuh, jadi telapaknya
 * harus terlihat. Bila tepi bawah pandangan memotong kaki SEDIKIT, kamera diturunkan sebanyak itu (kelipatan piksel seni),
 * asalkan kepala tertinggi masih punya 2 piksel seni udara, kotak wajib ruang (fokus/papan) tetap utuh, dan tidak keluar dunia;
 * bila syarat itu tidak terpenuhi (bidikan dekat), kamera dibiarkan.
 * Skala tidak berubah. Kantor (tokoh di balik meja, bingkai disetujui) dan kartu episode tidak disentuh.
 */
export function turunkanKeKaki(k: Kamera, r: RuangPiksel, tokoh: readonly TokohTersusun[], W: number, H: number, dpr: number): Kamera {
  if (r.tempat.balikMeja || !tokoh.length) return k;
  const vh = H / k.s;
  if (vh > DUNIA_H) return k;
  // Telapak = titik kaki + 1 piksel seni (baris jangkar ikut terlihat).
  const kaki = Math.max(...tokoh.map((x) => x.y + (x.s.jangkar.y + 1) * K));
  const perlu = Math.ceil((kaki - (k.y + vh)) / K - 1e-6) * K;
  if (perlu <= 0) return k;
  const kepala = Math.min(...tokoh.map((x) => x.y));
  const wajib = gabungKotak(r.papan?.kotak ?? null, r.fokus);
  const boleh = Math.min(perlu, kepala - UDARA_KEPALA - k.y, DUNIA_H - vh - k.y, wajib ? wajib.y - k.y : Infinity);
  // Hanya bila kaki bisa UTUH: bidikan dekat HP saat tokoh berbicara (setengah badan, kaki terpotong ~40 piksel seni) memang
  // disengaja dan tidak digeser setengah-setengah.
  if (boleh < perlu) return k;
  const geser = perlu;
  const s = k.s * dpr;
  return { ...k, y: Math.round((k.y + geser) * s) / s };
}

// ------------------------------------------------------------------ T-017: jalan masuk (D-104)

/**
 * Lama satu pose jalan (md) = LANGKAH_MS Bu Rina di Episode 1 (ui/panggung/rencana.ts; tidak diimpor: modul itu berat).
 * SATU-SATUNYA angka tempo: bila owner merasa langkahnya terlalu cepat di HP, ubah ke 300 di baris ini saja (D-125).
 */
export const LANGKAH_JALAN_MS = 270;
/**
 * Jarak tempuh sasaran per pose (dunia) = 41 piksel seni = panjang langkah yang TERGAMBAR di bingkai Rudi (D-125: pada 96
 * kaki meluncur 41 % tiap langkah; pada 164 sisa selip <= 5 piksel seni per pose).
 */
export const LANGKAH_JALAN_DUNIA = 164;
/** Jumlah pose jalan paling sedikit / paling banyak. */
export const POSE_JALAN_MIN = 3;
export const POSE_JALAN_MAKS = 6;

export interface RencanaJalan { awal: number; tujuan: number; n: number; durasi: number; arah: 'kiri' | 'kanan' }

/**
 * Rencana jalan masuk tokoh ke titik kaki `tujuan` (dunia): mulai tepat di luar tepi pandangan TERDEKAT (selebar frame),
 * jumlah pose n = bulat(jarak / LANGKAH_JALAN_DUNIA) dijepit POSE_JALAN_MIN..POSE_JALAN_MAKS, tiap pose LANGKAH_JALAN_MS.
 */
export function rencanaJalan(tujuan: number, lebarFrame: number, kamera: Kamera, W: number): RencanaJalan {
  const vw = W / kamera.s;
  const dariKiri = tujuan < kamera.x + vw / 2;
  const awal = dariKiri ? Math.min(kamera.x, tujuan) - lebarFrame : Math.max(kamera.x + vw, tujuan) + lebarFrame;
  const n = Math.min(POSE_JALAN_MAKS, Math.max(POSE_JALAN_MIN, Math.round(Math.abs(tujuan - awal) / LANGKAH_JALAN_DUNIA)));
  return { awal, tujuan, n, durasi: n * LANGKAH_JALAN_MS, arah: dariKiri ? 'kanan' : 'kiri' };
}

/**
 * Keadaan jalan pada waktu t (md): null = sudah tiba (berdiri). Gerak linear, x dipaskan ke piksel seni BULAT relatif tujuan.
 * Bingkai bergantian kontak ('jalan-a') / lintas ('jalan-b'); bingkai TERAKHIR selalu lintas (serah-terima ke berdiri), jadi
 * untuk n ganjil urutan dimulai dari lintas.
 */
export function posisiJalan(r: RencanaJalan, t: number): { x: number; pose: 'jalan-a' | 'jalan-b'; bingkai: number } | null {
  if (!(t < r.durasi)) return null;
  const tt = Math.max(0, t);
  const i = Math.min(r.n - 1, Math.floor(tt / LANGKAH_JALAN_MS));
  const x = r.awal + (r.tujuan - r.awal) * (tt / r.durasi);
  return { x: r.tujuan + Math.round((x - r.tujuan) / K) * K, pose: (r.n - 1 - i) % 2 === 0 ? 'jalan-b' : 'jalan-a', bingkai: i };
}

/** true = atlas tokoh punya kedua bingkai jalan (tanpa cadangan pose). */
export function punyaJalan(tokoh: TokohDiPiksel['tokoh']): boolean {
  return (['jalan-a', 'jalan-b'] as const).every((pose) => susunTokoh(tokoh, { pose: pose as never, ekspresi: 'netral' })?.pose === pose);
}
