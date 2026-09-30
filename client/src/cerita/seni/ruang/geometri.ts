/**
 * GEOMETRI RUANG LAYANAN (lokasi `meja` & `telepon`), satuan DUNIA 1600 x 900. Satu sumber angka untuk lapisan
 * (SVG & piksel), titik tempat tokoh/prop, dan lembar verifikasi. Rincian & alasan: docs/cerita/aset/RUANG.md.
 *
 * KONTRAK PIKSEL (keputusan lead, 27 Sep): 1 piksel seni = 4 satuan dunia (dunia = 400 x 225 piksel seni). Semua
 * titik tempat/jangkar/kotak di sini kelipatan 4 (diuji). Tokoh piksel (Miss Raksa & Bu Rina) SELALU skala 1: seni
 * piksel tidak boleh diskalakan pecahan saat diam, dan tidak ada LOD (lihat JALUR_MASUK).
 *
 * Model kamera (ilustratif, "dicurangi" untuk proporsi chibi ± 3,5–4 kepala): kamera setinggi mata orang DUDUK di sisi
 * petugas; cakrawala y 376 (setinggi mata kedua tokoh duduk). Lantai pada kedalaman berskala s: y = 376 + 624·s
 * (tokoh skala 1 menapak y 1000, di luar dunia). Dinding belakang s ≈ 0,36 (garis lantai y 600).
 * Kepala tokoh piksel (sanggul/hijab → dagu) ± 53 piksel = 212 satuan (SVG lama 130): komposisi dirapatkan di sekitar
 * kedua wajah supaya muat di HP dengan skala piksel bulat.
 */
import { KANVAS_DUDUK } from '../tokoh/ukuran';
import type { Tt } from './alat';

/** Satuan dunia per piksel seni. */
export const PIKSEL = 4;
/** Ukuran dunia dalam piksel seni. */
export const DUNIA_PIKSEL = { w: 400, h: 225 } as const;
/** Bulatkan ke grid piksel seni (kelipatan 4 satuan dunia). */
export const keGrid = (v: number): number => Math.round(v / PIKSEL) * PIKSEL;

export const CAKRAWALA = 376;
/** y lantai pada kedalaman berskala s (s 1 = kedalaman tokoh skala 1). */
export const yLantai = (s: number): number => CAKRAWALA + 624 * s;
/** Garis pertemuan dinding belakang & lantai. */
export const LANTAI_Y = 600;
/** Skala kedalaman dinding belakang (dari LANTAI_Y). */
export const SKALA_DINDING = (LANTAI_Y - CAKRAWALA) / 624;
/** Titik hilang (perspektif satu titik: meja sejajar dinding belakang). */
export const TITIK_HILANG: Tt = [800, CAKRAWALA];

/**
 * UKURAN TOKOH PIKSEL yang DIASUMSIKAN komposisi (piksel seni, skala 1; brief lead + lembar referensi
 * character/miss-raksa-pixel-v4 & bu-rina-pixel-v1). Atlas final boleh berbeda beberapa piksel; uji & lembar tinjau
 * memakai angka ini. Seni berubah jauh → ukur ulang (docs RUANG.md "Ukur ulang").
 */
export const UKURAN_TOKOH_PIKSEL = {
  /** Tinggi kepala (puncak sanggul/hijab → dagu). */
  kepala: 53,
  /** Lebar kepala: Miss Raksa (tanpa sanggul samping) & Bu Rina (hijab). */
  lebarKepalaMentor: 46,
  lebarKepalaNasabah: 56,
  /** Miss Raksa duduk di balik meja: bingkai pinggang ke atas, puncak kepala 100 piksel di atas garis meja. */
  mentorAtasMeja: 100,
  /**
   * Garis mata (tengah putih mata) di atas garis meja, Miss Raksa duduk: atlas v5 (miss-raksa.json frame duduk
   * `mataDiAtasMeja` 65,5; garisMeja 102). Garis mata Bu Rina duduk di atas pinggul: 91,5 (frame `duduk`/`dada`;
   * gestur lain 89,5-95,5). Komposisi v5: keduanya di cakrawala kamera (percakapan setara).
   */
  mentorMataAtasMeja: 65.5,
  nasabahMataPinggul: 91.5,
  /**
   * Bu Rina duduk (atlas bu-rina.json 27 Sep, frame `duduk` 86 × 159, jangkar pinggul 54,118): puncak hijab → pinggul
   * 118, pinggul → telapak 41, pusat kepala 11 piksel di KIRI pinggul (badan & pita celemek ke kanan).
   */
  nasabahKepalaPinggul: 118,
  nasabahPinggulKaki: 41,
  nasabahKepalaDx: -11,
  /** Tinggi berdiri (puncak → telapak). */
  mentorBerdiri: 187,
  nasabahBerdiri: 191,
} as const;
const U = UKURAN_TOKOH_PIKSEL;

// ------------------------------------------------------------------ dinding belakang

/** Panel bambu hijau (kiri). */
export const BAMBU = { x: 60, x2: 344 } as const;

/**
 * SEKAT PINTU MASUK di kanan (dinding dekat, sejajar dinding belakang, sedalam kursi pengunjung = skala 1). Pintu
 * DIPINDAH dari dinding belakang ke sini supaya Bu Rina masuk & pergi pada skala 1 (tanpa skala pecahan / LOD):
 * tinggi pintu 210 cm pada skala tokoh melebihi tinggi dunia, jadi kusen atas di luar bingkai; hanya sisi engsel
 * (kiri) yang tampak, daun meluas ke kanan di luar dunia. `x` = muka sekat; `sisi` = tebal sekat yang tampak (muka
 * kiri, menjauh ke titik hilang).
 * v5 (review HP 28 Sep): kusen engsel LANGSUNG di muka sekat (tanpa pita oker 28 satuan di antaranya) dan sekat 8 satuan
 * lebih ke kiri: bukaan yang tampak 224 (dulu 188), jadi bingkai kedatangan HP (skala piksel percakapan, kepala Miss
 * Raksa utuh di kiri) tetap memperlihatkan sebagian pintu & koridor terang, juga di 360 px.
 */
export const SEKAT = { x: 1360, sisi: 16 } as const;
/** Kusen (bingkai kayu) di kiri bukaan, digambar di latar (tepat di muka sekat). */
export const KUSEN = 16;
/**
 * Bukaan pintu yang TAMPAK (engsel di tepi KIRI x 1376 = muka sekat + kusen; bukaan sebenarnya ± 470 satuan, sisanya
 * di luar dunia). Panggung memutar daun dari `engsel` (rotateY berperspektif) seperti sebelumnya.
 */
export const PINTU = { x: SEKAT.x + KUSEN, y: 0, w: 1600 - SEKAT.x - KUSEN, h: 900 } as const;

/**
 * Plakat nama walnut DI ANTARA kedua kepala duduk (bukan lagi papan lebar di atas kepala): kepala piksel yang besar
 * menutup papan lama, dan pita teks di tinggi wajah selalu ikut terlihat bila kedua wajah terlihat (kamera HP).
 * rakAtas/rakBawah = rak lilin di bawah plakat.
 */
export const PAPAN = { x: 760, y: 216, w: 224, h: 100, rakAtas: 364, rakBawah: 376 } as const;
/**
 * Kotak teks plakat. Lapisan PIKSEL: teks dibakar ke latar dari LOKASI_AUTO_1.nama (font bitmap, 2 baris:
 * "Raksa" tebal + "Silver Club"). Lapisan SVG (cadangan): panggung menulis teks di kotak ini seperti dulu.
 */
export const TEKS_PAPAN = { x: 772, y: 228, w: 200, h: 76, ukuranHuruf: 26, warna: '#e9c46a' } as const;
/** Dua lilin LED di rak di bawah plakat (x dunia), di antara kedua kepala duduk. */
export const LILIN_X = [808, 936] as const;
/** Tinggi lilin LED (nyala ± 8 di atasnya). */
export const TINGGI_LILIN = 28;
/** Panel bilah zaitun di belakang badan kedua tokoh (di bawah rak sampai plint). */
export const BILAH = { x: 548, x2: 1252, y: 380 } as const;

// ------------------------------------------------------------------ meja

/**
 * Puncak meja layanan (kayu + kaca), sejajar dinding (perspektif satu titik ke TITIK_HILANG): tepi jauh DATAR y 640
 * (garis rapi di piksel), sisi kiri & kanan menyempit ke titik hilang, tepi dekat y 772.
 * JB = jauh-kiri, JK = jauh-kanan, DK = dekat-kanan, DB = dekat-kiri.
 * v5 (komposisi meja, review 28 Sep "Miss terlihat terlalu rendah/terbenam"): tepi jauh 656 -> 640 (4 piksel seni lebih
 * dalam; sudut jauh tetap di garis sisi menuju titik hilang), jadi tempat duduk Miss Raksa (garis meja frame = tepi
 * jauh) naik 16 satuan: garis matanya (y 378) setinggi garis mata Bu Rina duduk & cakrawala kamera (376). Tepi dekat,
 * panel depan, telepon, kartu awal & kunci tetap.
 */
export const MEJA = {
  JB: [316, 640] as Tt,
  JK: [1116, 640] as Tt,
  DK: [1276, 772] as Tt,
  DB: [76, 772] as Tt,
  /** Tebal bibir meja (kayu + tepi kaca) di tepi dekat. */
  bibir: 12,
} as const;

/** y tepi JAUH meja pada x tertentu. */
export const yTepiJauh = (x: number): number => MEJA.JB[1] + ((x - MEJA.JB[0]) * (MEJA.JK[1] - MEJA.JB[1])) / (MEJA.JK[0] - MEJA.JB[0]);
/** y tepi DEKAT meja pada x tertentu. */
export const yTepiDekat = (x: number): number => MEJA.DB[1] + ((x - MEJA.DB[0]) * (MEJA.DK[1] - MEJA.DB[1])) / (MEJA.DK[0] - MEJA.DB[0]);

/** Monitor di belakang-kiri meja, membelakangi kamera (di kiri badan Miss Raksa & di luar bingkai HP). */
export const MONITOR = { x: 256, y: 496, w: 168, h: 152 } as const;
/** Tumpukan formulir (kiri meja, di luar bingkai HP). */
export const FORMULIR = { x: 176, y: 736 } as const;

/**
 * Garis siku = tepi jauh meja dalam koordinat KANVAS DUDUK SVG lama (tokoh/ukuran.ts, pinggul 230,560). Dipakai seni
 * SVG Miss Raksa (cadangan); tetap 423.
 */
export const MEJA_KANVAS_DUDUK = 423;
const MENTOR_X = 656;
/** y tepi jauh meja di badan Miss Raksa: garis meja bingkai piksel duduk jatuh di sini. */
export const GARIS_MEJA_MENTOR = yTepiJauh(MENTOR_X);
/**
 * Jarak pinggul (jangkar duduk) di bawah garis meja, satuan dunia: 136 = 34 piksel. SVG: kanvas duduk (560 − 423,
 * dibulatkan ke grid). PIKSEL: bingkai Miss Raksa duduk menaruh jangkarnya 34 piksel di bawah garis mejanya, ATAU
 * panggung menaruh garis meja bingkai di `GARIS_MEJA_MENTOR` (keduanya sama).
 */
export const PINGGUL_DI_BAWAH_MEJA = keGrid(KANVAS_DUDUK.jangkar.y - MEJA_KANVAS_DUDUK);

/**
 * Kursi pengunjung: pusat dudukan (dunia) & skala bentuk (proyektor kursi.ts). Menghadap 3/4 kiri (ke Miss Raksa).
 * v5: 8 satuan lebih rendah (dulu y 744), ikut pinggul Bu Rina duduk (dudukan tetap di bawahnya).
 */
export const KURSI = { x: 1156, y: 752, s: 1.2 } as const;

/** Tempat tokoh (jangkar sesuai kontrak tokoh; SEMUA skala 1). */
export const TEMPAT_MEJA = {
  /**
   * Pinggul Miss Raksa duduk (garis meja 640 + 136 = 776; v5, dulu 792): kepala piksel (sanggul → dagu) ± y 236–452,
   * garis mata y 378. Frame duduk atlas v5 (garisMeja 102, pinggul 30,136): dada, lengan atas & lengan bawah di meja.
   */
  mentor: { x: MENTOR_X, y: GARIS_MEJA_MENTOR + PINGGUL_DI_BAWAH_MEJA },
  /**
   * Telapak Miss Raksa berdiri (tertutup meja) TEPAT di depan kursinya (v5: dulu 56 satuan di kirinya): bangkit/duduk
   * tanpa geser mendatar, dan bingkai kedatangan HP memuat kepala Miss Raksa + Bu Rina berdiri + sebagian pintu pada
   * skala piksel percakapan. v5 komposisi meja: y 884 (dulu 900) = naik bersama tempat duduknya (16), jadi langkah
   * kepala berdiri -> duduk-turun -> duduk tetap sama. Kepala piksel ± x 568–740, y 156–372; teks plakat mulai x 772.
   */
  mentorBerdiri: { x: 656, y: 884 },
  skalaMentor: 1,
  /**
   * Pinggul Bu Rina di kursi pengunjung (v5: y 744, dulu 736): kepala piksel ± y 272–484 (pusat x 1104), garis mata
   * gestur duduk/dada y 378 = Miss Raksa (cemas 370, bingung 374, kesal 362, condong 386), telapak y 904 = telapak
   * berdiri (duduk <-> berdiri tanpa lompatan tegak). Telapak & kaki kursi di bawah tepi dunia pada semua bingkai.
   */
  nasabahDuduk: { x: 1148, y: 744 },
  skalaNasabah: 1,
  /**
   * Telapak Bu Rina berdiri di depan sisi kanan kursi (ujung jalur masuk / awal pergi), setinggi lantai telapak duduknya
   * (y 904, 1 piksel di bawah dunia): kepala ± y 148–356, 30 piksel lebih tinggi dari kepala duduk. v5: 44 satuan lebih
   * ke kiri (dulu 1320): bingkai kedatangan HP pada skala piksel percakapan memuat kepala berdiri kedua tokoh juga di
   * HP 360-412 px dpr 2,6-3 (k 5), dan jarak berdiri -> duduk lebih pendek.
   */
  nasabahBerdiri: { x: 1276, y: 904 },
} as const;

/**
 * JALUR MASUK (telapak kaki, SKALA 1 di setiap titik): dari bukaan pintu di sekat kanan → samping kanan kursi.
 * Keputusan piksel: pintu dipindah ke sisi kursi supaya tidak ada skala pecahan maupun LOD (satu set sprite jalan).
 * Pejalan hanya bergeser mendatar di y 1000; langkah kaki ditangani panggung.
 * Titik indeks < JALUR_DEPAN_MULAI: lapisan "tokoh di belakang meja" (tetap di atas latar/pintu); mulai indeks 1:
 * lapisan pengunjung (di depan kursi & meja).
 */
export const JALUR_MASUK: readonly { titik: { x: number; y: number }; skala: number }[] = [
  { x: 1536 },
  { x: 1428 },
  { x: TEMPAT_MEJA.nasabahBerdiri.x },
].map(({ x }) => ({ titik: { x, y: TEMPAT_MEJA.nasabahBerdiri.y }, skala: 1 }));
export const JALUR_DEPAN_MULAI = 1;

/**
 * Prop (titik sentuh di permukaan meja = jangkar prop; kotak prop piksel dari prop.ts × SKALA_PROP, kelipatan 4):
 * - telepon (kotak 136 × 88, jangkar 68,64): kiri-depan Miss Raksa → kotak x 440–576, y 660–748; utuh di bingkai HP
 *   (tepi kiri 424) dengan sisa 16.
 * - kartuSimpan (kotak 120 × 64, jangkar 60,32): titik AWAL kartu polis di TEPI DEKAT meja sisi pemain (kiri kamera):
 *   kertas x ± 586–695, y ± 723–768 (sudut dekat 4–12 di atas tepi dekat y 772), ≥ 10 di kanan kotak telepon.
 * - kartuMeja: landasan kartu di kaca KOSONG di kanan tangan Miss Raksa: kotak kartu x 740–860, y 672–736 (v5: 8
 *   lebih jauh, dulu y 712). v5 tangan (28 Sep): lengan tunjuk digambar ulang sebagai "L" (lengan atas turun di sisi
 *   badan, siku bertumpu di meja, lengan bawah menjulur ke kanan-bawah), jadi kartu kembali ke x 800 (ronde meja 2
 *   sempat 768 untuk siku yang ditekuk keluar): ujung telunjuk duduk-tunjuk (816, 692) di kartu kanan-tengah, tangan di
 *   tepi atas kartu, sebagian besar kartu tetap terlihat. Landasan x 732–868 berakhir tepat di kotak kunci (868).
 * - kunciMeja (kotak 72 × 40, jangkar 36,24): kunci Bu Rina di kanan landasan: kotak x 868–940, y 676–716; siluet
 *   pangkuan Bu Rina (atlas 27 Sep, semua frame duduk termasuk condong) mulai x ≥ 952 di pita y 648–840.
 */
export const PROP_MEJA = {
  kartuSimpan: { x: 640, y: 748 },
  kartuMeja: { x: 800, y: 704 },
  kunciMeja: { x: 904, y: 700 },
  telepon: { x: 508, y: 724 },
} as const;
/** Kotak (dunia) landasan kartu (kotak kartu + 8), dijaga kosong dari benda meja tetap & prop lain. */
export const LANDASAN_KARTU = { x: 732, y: 664, w: 136, h: 80 } as const;
/** Cangkir epilog telepon (di luar landasan kartu). */
export const CANGKIR = { x: 1000, y: 700 } as const;

// ------------------------------------------------------------------ kamera yang disarankan

/**
 * Bingkai kamera yang DISARANKAN untuk tokoh piksel (dunia; panggung pemiliknya). Semua kelipatan 4.
 * - hp: kedua wajah + teks plakat + telepon meja + landasan kartu + tangan Bu Rina di pangkuan (± 196 × 142 piksel).
 * - lebar: desktop/tablet (sekat & pintu tampak di kanan).
 * - datang: kedatangan/kepergian (Miss Raksa berdiri + pintu sekat + Bu Rina berdiri). SARAN LAMA: sejak v5 panggung
 *   memakai kamera.ts `pasKameraPintu` (skala piksel percakapan, bergeser ke pintu; pintu boleh terpotong di HP).
 */
export const BINGKAI_PIKSEL = {
  hp: { x: 424, y: 200, w: 800, h: 592 },
  lebar: { x: 40, y: 140, w: 1520, h: 660 },
  datang: { x: 440, y: 120, w: 1160, h: 660 },
} as const;

/** Kotak kepala piksel (dunia) tokoh duduk, dari tempat & UKURAN_TOKOH_PIKSEL (dipakai uji & lembar tinjau). */
export function kepalaDudukPiksel(siapa: 'mentor' | 'nasabah'): { x: number; y: number; w: number; h: number } {
  const t = siapa === 'mentor' ? TEMPAT_MEJA.mentor : TEMPAT_MEJA.nasabahDuduk;
  const lebar = (siapa === 'mentor' ? U.lebarKepalaMentor : U.lebarKepalaNasabah) * PIKSEL;
  const atas = siapa === 'mentor'
    ? GARIS_MEJA_MENTOR - U.mentorAtasMeja * PIKSEL
    : t.y - U.nasabahKepalaPinggul * PIKSEL;
  const cx = t.x + (siapa === 'mentor' ? 0 : U.nasabahKepalaDx * PIKSEL);
  return { x: cx - lebar / 2, y: atas, w: lebar, h: U.kepala * PIKSEL };
}
