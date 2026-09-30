/**
 * MISS RAKSA v3: generator SVG FINAL (sumber/master untuk panggung, potret, dan aktivitas; kini cadangan di balik seni piksel v4+).
 * Dasar: kandidat C panel desain 27 Sep (semi-realis berbasis cahaya, tanpa filter) + perbaikan juri + cangkok A/B.
 * Putaran 2 (27 Sep): mata almond gelap (iris besar, satu garis mata meruncing + sayap kecil), hidung dari bidang
 * (sorot ujung + lubang hidung lembut, tanpa garis kait), pipi bawah membulat ke dagu kecil, alis tipis meruncing,
 * rambut dengan garis rambut lembut + belahan terang + pita kilau + sanggul yang tampak pada 3/4; lengan dari SENDI
 * (bahu → siku → pergelangan, siku menekuk, manset tipis) + tangan berjari terbaca; gagang telepon bagian dari pose;
 * potret kecil (<= POTRET_KECIL_MAKS_PX) memakai JENDELA_POTRET_KECIL + versi kecil (`aturanPotret`).
 * Putaran 3 (juri ke-2, 27 Sep): dagu di garis tengah wajah + rahang dekat diagonal (tidak lagi "ember" pada pandang
 * pemain/lawan), mata tanpa kesan "glam" (sayap pendek, sorot lembut, kelopak bertudung), pandang bawah = membaca,
 * kerah tertutup di depan, alis lebih tebal & sedikit lebih rendah, hidung lebih lebar & lembut, kulit peach + rona
 * tinggi, lengan bawah sembah tersambung ke telapak, jas lebih pas, potret kecil/sedang/mini (`aturanPotret`).
 * Putaran 4 (27 Sep, perbaikan kecil; wajah tidak dirombak): lengan jauh sembah UTUH dari sendi (bahu → siku di luar
 * pinggang → lengan bawah naik ke manset tepat di bawah telapak, kancing di ujung manset), telapak mempersilakan ditarik
 * ke dalam (marjin kanan kanvas >= 8), dua betis + dua sepatu pada pose duduk, mata potret kecil lebih ringan (celah
 * sklera di kedua sisi iris) dan dengar vs serius kecil dibedakan (senyum tipis vs alis datar + mulut lurus).
 *
 * Wajah ditulis tangan sebagai titik 2,5D (x, y, z): pose acuan = kepala menoleh
 * ± 20° ke kanan; arah pandang lain memutar ulang titik yang sama (gaya.ts `buatProyeksi`), jadi setiap ekspresi,
 * arah pandang, dan pose memakai KONSTRUKSI WAJAH YANG SAMA (tokoh yang sama).
 *
 * Seragam: jas kuning pucat keemasan, kerah mandarin putih tegak yang memeluk leher (tertutup di
 * depan, takik V kecil), bukaan diagonal dari kaki kerah ke arah KANAN pemakai (kiri gambar) dengan kancing cokelat
 * tua, lencana emas polos + pin kecil terpisah di dada KIRI pemakai (kanan gambar), manset putih tipis + 3 kancing
 * lengan, kuku merah, anting mutiara. Rok/kaki tidak terlihat di referensi mana pun: rok cokelat tua = CADANGAN (menunggu konfirmasi pemilik).
 *
 * Susunan SVG: badan belakang → leher (mengikuti rahang kepala) → kerah → kepala → lengan depan. Pose duduk: lengan
 * bawah + tangan di meja dikelompokkan `<g class="lapis-tangan">` DAN dikembalikan terpisah sebagai `diAtasMeja`
 * (id berawalan `${id}d`, tidak pernah bentrok dengan SVG utama) supaya panggung bisa menggambarnya SESUDAH puncak
 * meja. Garis siku = GARIS_SIKU (423, = ruang/geometri.ts MEJA_KANVAS_DUDUK).
 *
 * Semua id gradien/klip diawali `opsi.id` (bawaan 'mr'). Tanpa <filter>, tanpa raster.
 */
import type { ArahPandang, Ekspresi, PoseMentor } from '../../tipe';
import type { GambarTokoh, JendelaPotret, OpsiMissRaksa, Titik } from './tipe';
import { JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, KANVAS_BERDIRI, KANVAS_DUDUK, POTRET_KECIL_MAKS_PX } from './ukuran';
import {
  BAYANG,
  CAHAYA,
  GARIS,
  type Proyeksi,
  type T2,
  type T3,
  bentuk,
  buatCache,
  buatProyeksi,
  f,
  garis,
  geser,
  gradienLinear,
  gradienPudar,
  halus,
  isi,
  jl,
  lerp,
  lerp2,
  lerp3,
  pita,
  pt,
  rangkai,
  tepi,
  tutup,
} from './gaya';

const ID_BAWAAN = 'mr';

/** Garis siku = y kanvas duduk tempat tepi JAUH meja jatuh (ruang/geometri.ts `MEJA_KANVAS_DUDUK`). */
export const GARIS_SIKU = 423;

/** Hasil generator Miss Raksa: kontrak GambarTokoh + lapisan tangan di atas meja (pose duduk). */
export type GambarMissRaksa = GambarTokoh & {
  /**
   * Lengan bawah + tangan pose duduk sebagai SVG mandiri (viewBox sama `0 0 w h`), id berawalan `${id}d`.
   * Panggung menggambarnya sesudah puncak meja + prop dan sebelum bagian depan meja.
   */
  diAtasMeja?: string;
};

// =================================================================================================================
// PALET

// Putaran 3 (juri: kulit krem-pink pucat seperti boneka porselen di samping Bu Rina): kulit satu langkah ke PEACH hangat
// (kurang abu-merah muda), rona pipi ± 30 % kurang jenuh & sedikit ke koral.
export const WARNA = {
  garis: GARIS.warna,
  garisDalam: GARIS.dalam,
  kulit: '#f2be9b',
  kulitTerang: '#fde1cb',
  kulitBawah: '#e4a684',
  bayang: BAYANG.hangat,
  bayangTua: BAYANG.tua,
  pipi: '#ea8f80',
  bibir: '#c3283a',
  bibirTua: '#861626',
  bibirTerang: '#f3959a',
  rambut: '#141010',
  rambutTengah: '#2e2624',
  rambutKilap: '#a39896',
  alis: '#3b2a24',
  liner: '#1d110e',
  iris: '#1e120d',
  irisTerang: '#6e4a32',
  pupil: '#0c0605',
  sklera: '#e2d0c8',
  gigi: '#fbf7f1',
  mulutDalam: '#5a1a1c',
  mutiara: '#f6f1e8',
  mutiaraBayang: '#c9bba8',
} as const;

export const SERAGAM = {
  jas: '#f7cc80',
  jasTerang: '#fde3ab',
  jasBayang: '#b98437',
  jasTua: '#8a5a22',
  putih: '#fbf8f1',
  putihBayang: '#b9ac9c',
  kancing: '#4a2d22',
  kancingSorot: '#9a735f',
  emas: '#d8a73c',
  emasTerang: '#f8dc8c',
  emasTua: '#8c6420',
  merah: '#b8322c',
  rok: '#4e3a30',
  rokTerang: '#6e5647',
  kulit: '#f3c6a2',
  kulitBayang: '#b0604a',
  stoking: '#e8b89a',
  sepatu: '#35231c',
  kuku: '#c0243a',
  garisDalam: GARIS.dalam,
} as const;

// =================================================================================================================
// EKSPRESI & PANDANG

/** Lima wajah Miss Raksa (kontrak: netral→dengar, tersenyum/senang→senyum, cemas/bingung→prihatin, serius/kesal→serius). */
export type IdWajah = 'dengar' | 'senyum' | 'prihatin' | 'serius' | 'lega';

export function wajahDari(e: Ekspresi): IdWajah {
  switch (e) {
    case 'tersenyum':
    case 'senang':
      return 'senyum';
    case 'cemas':
    case 'bingung':
      return 'prihatin';
    case 'serius':
    case 'kesal':
      return 'serius';
    case 'lega':
      return 'lega';
    default:
      return 'dengar';
  }
}

interface Mulut {
  /** Sudut dekat (L) & jauh (R) pada pose acuan. */
  L: T3;
  R: T3;
  /** Lengkung garis bibir: + = tengah lebih rendah dari tali busur (senyum), − = cemberut. */
  lengkung: number;
  /** Tebal bibir atas & bawah di tengah. */
  atas: number;
  bawah: number;
  /** Bukaan saat bicara & tampak gigi atas. */
  buka: number;
  gigi: number;
  /** Celah bibir saat diam (lega: menghela napas). */
  celah?: number;
}

interface Raut {
  /** Geser alis [dalam, puncak, luar] (dx, dy). */
  alis: [T2, T2, T2];
  alisTebal: number;
  /**
   * Kelopak atas turun (+) / naik (−) sebagai PECAHAN tinggi bukaan mata (sama untuk mata dekat & jauh, sehingga
   * "mata teduh" tidak menjadi kedipan pada mata jauh yang lebih sempit); tambahan di sisi luar/dalam.
   */
  kelopakAtas: number;
  kelopakLuar: number;
  kelopakDalam: number;
  /** Kelopak bawah turun (+) / naik (−, mata tersenyum), pecahan tinggi bukaan. */
  kelopakBawah: number;
  mulut: Mulut;
  /** Pipi terangkat 0..1. */
  pipi: number;
  /** Miring kepala (derajat, + = searah jarum jam) & angguk tambahan. */
  miring: number;
  angguk: number;
  /** Kerut tipis pangkal alis (hanya prihatin). */
  kerut: number;
}

const RAUT: Record<IdWajah, Raut> = {
  // Senyum tertutup, sudut bibir naik, kelopak bawah terangkat, pipi naik; kelopak atas teduh (putaran 3:
  // tudung + ± 0,9 satuan, mata tidak lagi almond "boneka" yang terbuka lebar).
  senyum: {
    alis: [[0, 0], [0, 0], [0, 0]],
    alisTebal: 1,
    kelopakAtas: 0.1,
    kelopakLuar: 0,
    kelopakDalam: 0,
    kelopakBawah: -0.3,
    mulut: { L: [2.2, 37.6, 30], R: [27.4, 40, 25], lengkung: 3.2, atas: 2.4, bawah: 5.6, buka: 4.6, gigi: 2.2 },
    pipi: 1,
    miring: 0,
    angguk: 0,
    kerut: 0,
  },
  // Mendengarkan: mata terbuka tenang (sedikit bertudung), alis sedikit naik (perhatian), senyum tipis sopan.
  // Putaran 5 (juri-3: dengar + pandang lawan di panggung terbaca dingin/angkuh): senyum lembut lebih jelas (sudut bibir
  // naik & mulut sedikit lebih lebar), pipi sedikit naik, kelopak bawah sedikit terangkat (mata ramah), kelopak atas
  // lebih terbuka. Tetap berbeda dari serius (serius: mulut lurus, alis datar & turun).
  dengar: {
    alis: [[0, -1.1], [0, -1.2], [0, -0.5]],
    alisTebal: 1,
    kelopakAtas: -0.03,
    kelopakLuar: 0,
    kelopakDalam: 0,
    kelopakBawah: -0.06,
    mulut: { L: [4.2, 39.4, 30], R: [25.4, 40.8, 25], lengkung: 1.9, atas: 2.3, bawah: 4.6, buka: 3.8, gigi: 1.4 },
    pipi: 0.5,
    miring: -2,
    angguk: 1,
    kerut: 0,
  },
  // Prihatin/empati: pangkal alis naik & mendekat, bibir rapat lembut, kepala miring ke lawan bicara.
  // Putaran 5 (juri-3: mata setengah tertutup menatap ke bawah + mulut kecil merapat = dingin): kelopak luar tidak lagi
  // turun (mata terbuka ke Bu Rina), pangkal alis naik lebih jelas (cemas-peduli), ekor alis sedikit kurang
  // turun, mulut lebih lebar & hampir datar (lembut, bukan cemberut), angguk kepala lebih kecil.
  prihatin: {
    alis: [[-1.0, -4.8], [0, -1.2], [0, 1.4]],
    alisTebal: 0.95,
    kelopakAtas: -0.04,
    kelopakLuar: 0.04,
    kelopakDalam: -0.16,
    kelopakBawah: 0.02,
    mulut: { L: [4, 40.7, 30], R: [25.6, 42, 25], lengkung: -0.2, atas: 2.2, bawah: 4.4, buka: 3.0, gigi: 0.8 },
    pipi: 0.15,
    miring: 6,
    angguk: 2,
    kerut: 0.7,
  },
  // Serius menjelaskan: alis lebih lurus & sedikit turun (fokus, bukan marah), kelopak sedikit menyipit, bibir lurus.
  serius: {
    alis: [[-0.3, 1.2], [0, 1.8], [0, 1.0]],
    alisTebal: 1.05,
    kelopakAtas: 0.2,
    kelopakLuar: 0,
    kelopakDalam: 0.08,
    kelopakBawah: -0.05,
    mulut: { L: [5.4, 40.4, 30], R: [24.4, 41.6, 25], lengkung: -0.2, atas: 1.8, bawah: 3.5, buka: 3.6, gigi: 1.2 },
    pipi: 0,
    miring: -5,
    angguk: 0,
    kerut: 0,
  },
  // Lega: kedua mata teduh sama rata (iris tetap tampak), alis dalam naik, senyum hangat, mendongak. Putaran 5 (juri-3:
  // di HP mata teduh menjadi celah gelap; lega kini tampil saat Bu Rina lega): kelopak 0,4 → 0,3 + batas kelopak total.
  lega: {
    alis: [[0, -2.2], [0, -1.2], [0, 0.3]],
    alisTebal: 0.95,
    kelopakAtas: 0.3,
    kelopakLuar: 0.04,
    kelopakDalam: 0,
    kelopakBawah: -0.12,
    mulut: { L: [3.8, 38.6, 30], R: [25.8, 40.6, 25], lengkung: 1.6, atas: 2.3, bawah: 5.2, buka: 3.4, gigi: 1.6, celah: 1.2 },
    pipi: 0.8,
    miring: 3,
    angguk: -3,
    kerut: 0,
  },
};

/**
 * Versi kecil (kepala < 60 px): perbedaan antarwajah dibesar-besarkan supaya dengar/senyum/serius tidak menyatu
 * (juri: serius = alis 1,5 lebih rendah & datar + mulut lebih pendek dan rapat; senyum = sudut bibir naik 2 + pipi
 * naik; dengar = mata sedikit lebih lebar). `mini` (potret <= POTRET_MINI_MAKS_PX, mis. layar akhir 28 px & riwayat
 * 32 px; putaran 3): prihatin = pangkal alis naik 2 × + mulut melengkung turun, serius = alis lebih rendah & lurus +
 * mulut datar pendek, dengar = alis naik + senyum kecil, supaya dengar/prihatin/serius tetap bisa dibedakan.
 * Putaran 4 (44–52 px): dengar = netral lembut + senyum tipis (tanpa mata melotot), serius = alis datar sedikit turun +
 * mulut lurus + kelopak sedikit menyipit.
 * Putaran 5 (juri-3: pada 28/32 px dan 44 px layar 1× dengar/serius/prihatin hanya beda 1–2 piksel): nilai MUTLAK
 * (tidak lagi turunan raut normal) dan dilebihkan lagi — prihatin = pangkal alis naik jelas + ekor turun + mulut kecil
 * melengkung turun; serius = alis datar & turun + mulut lurus tipis; dengar = alis santai sedikit naik + senyum tipis
 * lebar. Mini (28–36 px) paling kuat, dan mulut/alis mini digambar lebih besar (`gambarMulut`/`gambarAlis`).
 */
function rautKecil(w: IdWajah, r: Raut, mini = false): Raut {
  const m = { ...r.mulut };
  const k: Raut = { ...r, mulut: m };
  if (w === 'serius') {
    // alis DATAR & turun (puncak turun lebih banyak dari pangkal & ekor), mulut lurus tipis agak pendek, kelopak
    // sedikit menyipit
    k.alis = [[-0.3, 2.4], [0, 3.8], [0, 2.2]];
    k.alisTebal = 1.1;
    m.L = [7.6, 41, 30];
    m.R = [22.4, 41.8, 25];
    m.lengkung = 0;
    m.atas = 1.35;
    m.bawah = 2.4;
    k.kelopakAtas = 0.22;
  } else if (w === 'senyum') {
    m.L = [m.L[0] - 0.8, m.L[1] - 2.4, m.L[2]];
    m.R = [m.R[0] + 0.6, m.R[1] - 2.4, m.R[2]];
    m.lengkung = 4.4;
    k.pipi = 1.2;
    // mata tetap terbuka (tudung senyum versi normal membuat mata kecil menjadi garis gelap)
    k.kelopakAtas = 0.04;
    k.kelopakBawah = -0.28;
  } else if (w === 'dengar') {
    // netral lembut + senyum tipis yang lebar (sebelumnya kelopak −0,3 = mata melotot bercincin putih pada 44–52 px),
    // alis santai sedikit naik
    k.alis = [[0, -1.4], [0, -1.6], [0, -0.8]];
    k.kelopakAtas = 0.04;
    k.kelopakBawah = 0.02;
    m.L = [4, 39, 30];
    m.R = [25.6, 40.4, 25];
    m.lengkung = 2.6;
    m.atas = 2.2;
    m.bawah = 4.4;
    k.pipi = 0.6;
  } else if (w === 'prihatin') {
    // pangkal alis naik jelas + ekor turun (miring cemas), mulut kecil melengkung turun
    k.alis = [[-1.6, -7.2], [0, -2], [0, 3.2]];
    m.L = [7, 41.6, 30];
    m.R = [22.6, 42.6, 25];
    m.lengkung = -3.4;
    m.atas = 2;
    m.bawah = 4;
    // mata cemas lebih terbuka (kelopak luar yang turun + garis mata tebal terbaca melotot/galak pada 44–52 px)
    k.kelopakAtas = -0.04;
    k.kelopakLuar = 0.08;
    k.kelopakDalam = -0.2;
  }
  if (mini) {
    if (w === 'prihatin') {
      k.alis = [[-3, -13], [0, -3.6], [0, 5]];
      m.L = [7.6, 42, 30];
      m.R = [22.2, 43, 25];
      m.lengkung = -4;
      m.atas = 2.2;
      m.bawah = 4.2;
    } else if (w === 'serius') {
      k.alis = [[-0.5, 5.2], [0, 6], [0, 4.6]];
      k.alisTebal = 1.2;
      m.L = [5.8, 41.2, 30];
      m.R = [24, 42, 25];
      m.lengkung = 0;
      m.atas = 1.6;
      m.bawah = 2.4;
    } else if (w === 'dengar') {
      k.alis = [[0, -3], [0, -3.2], [0, -1.6]];
      m.L = [4.2, 39.2, 30];
      m.R = [25.4, 40.4, 25];
      m.lengkung = 3.2;
      m.atas = 2.2;
      m.bawah = 4.6;
    }
  }
  return k;
}

/**
 * Arah pandang → sudut toleh, angguk, geser iris (pecahan lebar mata), kelopak turun (pecahan) & alis naik (−, satuan).
 * Putaran 3: `bawah` (kartu) = MEMBACA dengan perhatian, bukan lirikan: kelopak hanya turun 0,15, iris lebih ke bawah
 * daripada ke samping, alis naik 0,8, dan sudut bibir disejajarkan dengan garis mata (tanpa kesan senyum miring).
 */
// Putaran 5 (juri-3: pandang lawan terbaca melirik dingin dari balik kelopak): kepala sudah menoleh ke Bu Rina, jadi
// iris hanya sedikit ke samping (bukan di sudut mata = lirikan), sedikit NAIK (mata sejajar mata Bu Rina, tidak
// menunduk), kelopak atas terangkat sedikit (mata lebih terbuka ke lawan bicara), kepala tidak mengangguk.
const PANDANG: Record<ArahPandang, { toleh: number; angguk: number; iris: number; irisY: number; kelopak: number; alis: number }> = {
  depan: { toleh: 20, angguk: 0, iris: 0.07, irisY: 0, kelopak: 0, alis: 0 },
  pemain: { toleh: 9, angguk: 0, iris: -0.1, irisY: 0, kelopak: 0, alis: 0 },
  lawan: { toleh: 31, angguk: 0, iris: 0.12, irisY: -0.35, kelopak: -0.08, alis: -0.3 },
  bawah: { toleh: 26, angguk: 11, iris: 0.06, irisY: 1.6, kelopak: 0.15, alis: -0.8 },
};

// =================================================================================================================
// GEOMETRI KEPALA (koordinat lokal, pose acuan toleh 20°; (0,0) = pusat kepala; puncak rambut → dagu ± 129)

/**
 * Tepi wajah (kulit) searah jarum jam dari dahi di bawah rambut. Dagu kecil membulat di bawah garis tengah wajah.
 * Putaran 3 (juri: rahang "ember" pada pandang pemain/lawan): rahang dekat meruncing sejak y ± 27 (diagonal cuping →
 * dagu, tanpa ruas tegak), dan dagu dipindah ke GARIS TENGAH wajah dalam 3D (X sejati ± 0, di bawah tengah mulut,)
 * — sebelumnya dagu 7 satuan ke sisi dekat sehingga saat toleh 9° (pemain) wajah bawah menggembung ke kiri.
 * z rahang dekat naik bertahap dari ramus (± 6) ke dagu (32) supaya lebar wajah bawah pada pemain <= ± 71 % garis mata.
 */
const TEPI_WAJAH: T3[] = [
  [-22, -31, 22],
  [-29.5, -14, 14],
  [-32.2, 3, 7],
  [-32.6, 16, 6],
  [-31.8, 27, 7],
  [-30.4, 36.2, 10],
  [-27.6, 44, 14],
  [-23.2, 51, 18],
  [-16.4, 57, 22.5],
  [-7.4, 61, 27],
  [3.6, 63.2, 30.5],
  [12, 63.8, 32],
  [18.6, 63, 31.5],
  [22.8, 60.8, 29.5],
  [26.2, 57.2, 27.5],
  [29.4, 52.4, 25],
  [33.4, 46, 24],
  [36.2, 39.2, 24],
  [38.8, 30.6, 24],
  [40.2, 20, 24],
  [40.7, 8, 24],
  [40.5, -4, 23],
  [37, -20, 22],
  [27, -34, 30],
  [9, -40, 36],
  [-8, -38, 32],
];
/** Indeks rahang: dari bawah telinga dekat (3) sampai rahang jauh (16); dagu = 11; titik leher jauh keluar = 12. */
const RAHANG_DARI = 3;
const RAHANG_SAMPAI = 16;
const LEHER_JAUH = 12;

/** Siluet luar rambut (atas telinga → belakang & puncak → pelipis jauh). Kubah tinggi, penuh di belakang-atas. */
const RAMBUT_LUAR: T3[] = [
  [-40.8, 4, -19],
  [-41.2, -8, -20],
  [-41, -18, -20],
  [-40, -28, -19],
  [-38, -38, -17],
  [-35.6, -47.4, -14],
  [-30.4, -55.2, -11],
  [-24, -61.8, -7],
  [-14.6, -65.8, -3],
  [-4.2, -66.2, 1],
  [5.4, -64.2, 4],
  [13.2, -59.2, 7],
  [20.2, -52, 10],
  [25.6, -43.8, 13],
  [31.4, -35.2, 16],
  [36.2, -25.2, 18],
  [39.4, -15, 20],
  [41.2, -6, 21],
  [41.6, 1.5, 22],
];

/** Garis rambut di dahi (pelipis jauh → belahan → menyapu RENDAH menutupi pelipis dekat → atas telinga). */
const GARIS_RAMBUT: T3[] = [
  [41.6, 1.5, 22],
  [39.6, -6.5, 25],
  [35.4, -12.8, 29],
  [29.4, -18.8, 33],
  [21.6, -24.4, 37],
  [13, -28.8, 39.5],
  [5.2, -31.4, 40],
  [-1.2, -29.4, 39],
  [-8.4, -25, 36],
  [-14, -20, 32],
  [-19, -13.8, 27],
  [-23.2, -7.4, 22],
  [-26.4, -1.4, 17],
  [-29, 3.4, 12],
  [-31.6, 7.8, 8],
];
const ATAS_TELINGA: T3[] = [
  [-31.6, 7.8, 8],
  [-34, 1.6, 2],
  [-38.6, -1, -3],
  [-40.8, 4, -19],
];

/** Belahan samping (garis kulit kepala tipis) dari garis rambut ke atas-belakang. */
const BELAHAN: T3[] = [
  [5.2, -31.6, 40],
  [3.8, -38.4, 34],
  [1.6, -44.4, 27],
  [-1.4, -49.8, 20],
  [-4.6, -54.6, 12],
];

/**
 * Sanggul di belakang-atas: gulungan bulat yang menyembul sedikit di belakang kubah pada toleh 20° (depan) dan makin
 * tampak saat menoleh ke lawan (3/4). Tinggi: pusat setinggi garis alis-dahi atas, tidak menambah tinggi kepala.
 */
const SANGGUL = { c: [-31, -24, -46] as T3, rx: 13, ry: 14 };

const TELINGA_LUAR: T3[] = [
  [-32.8, 3, 2],
  [-36.8, -0.4, -2],
  [-40.8, 1.4, -6],
  [-42.8, 7, -8],
  [-42.2, 14, -7],
  [-39.8, 18.8, -5],
  [-36.4, 21.4, -3],
  [-33.8, 20.6, 0],
  [-32.6, 17.2, 2],
];
const MUTIARA: T3 = [-34.4, 23.6, 0];

/** Alis: garis tengah dalam → luar + tebal (lengkung lembut, puncak ± 2/3, ekor meruncing). */
// Putaran 2: lebih tipis, pangkal lembut, ekor sangat runcing. Putaran 3 (juri: alis terlalu tinggi & tipis, puncak alis
// jauh runcing): sepertiga tengah lebih tebal (maks 2,7), garis tengah turun 1–1,2 (tebal tambahan tumbuh ke BAWAH, jadi
// tepi bawah alis ± 1,6 lebih dekat ke mata; ditambah kelopak bertudung jarak alis–mata tampak ± 2,5 lebih rapat) dan
// puncak alis jauh diratakan ± 0,8 (penurunan penuh 2,5–3 membuat alis terlalu rendah).
const ALIS_DEKAT: { p: T3; t: number }[] = [
  { p: [15.2, 1.7, 48], t: 1.6 },
  { p: [11.4, 0.2, 46], t: 2.4 },
  { p: [6.8, -0.9, 43], t: 2.7 },
  { p: [1.8, -1.3, 40], t: 2.6 },
  { p: [-3, -0.5, 36], t: 1.8 },
  { p: [-7.2, 1.2, 32], t: 0.9 },
  { p: [-9.6, 2.6, 30], t: 0.25 },
];
// Alis jauh: kedalaman ekor tidak lagi turun tajam (z 25 → 29), jadi saat menunduk (pandang bawah) ekor tidak
// terangkat menjadi puncak runcing.
const ALIS_JAUH: { p: T3; t: number }[] = [
  { p: [25.4, 5.5, 47], t: 1.6 },
  { p: [28.6, 4.3, 45], t: 2.2 },
  { p: [32.2, 3.3, 42], t: 2.1 },
  { p: [35.8, 2.9, 37.5], t: 1.6 },
  { p: [38.6, 2.9, 32.5], t: 0.9 },
  { p: [39.6, 3.7, 29], t: 0.25 },
];

/** Bukaan mata: kelopak atas & bawah. */
interface Mata {
  luar: T3;
  dalam: T3;
  /** Kelopak atas, urut dari sudut kiri gambar ke kanan. */
  atas: T3[];
  /** Kelopak bawah, urut dari sudut kanan gambar ke kiri. */
  bawah: T3[];
  iris: T3;
  r: number;
  /** +1 = sudut luar di kiri (mata dekat), −1 = di kanan (mata jauh). */
  sisi: 1 | -1;
}
// Putaran 2: bukaan lebih tinggi (± 7,5 di tengah) dan iris jauh lebih besar & gelap sehingga
// putih mata hanya tampak sebagai segitiga kecil di sudut (mata gelap, almond, bergaris tegas).
// Putaran 3 (juri: iris "boneka" terlalu besar): iris sedikit lebih kecil (5,8 / 4,9), kelopak atas bertudung lewat RAUT.
const MATA_DEKAT: Mata = {
  luar: [-6.6, 8.5, 35],
  dalam: [11.8, 9.4, 44.5],
  atas: [[-3.8, 5.7, 37.5], [0.4, 4, 40], [4.8, 3.8, 42], [8.9, 5.2, 43.6]],
  bawah: [[9.8, 11, 44], [5, 11.7, 42], [0, 11.6, 39.5], [-3.8, 10.5, 37]],
  iris: [3.6, 8.3, 42],
  r: 5.8,
  sisi: 1,
};
const MATA_JAUH: Mata = {
  luar: [39.2, 9.8, 31],
  dalam: [26, 10.6, 44.5],
  atas: [[28.4, 7.9, 43], [31.8, 6.8, 40.5], [35.6, 7.3, 36.5]],
  bawah: [[36.4, 12.4, 35.5], [32, 13, 39.5], [28.4, 12.6, 42.5]],
  iris: [32.6, 10.3, 40],
  r: 4.9,
  sisi: -1,
};

/** Titik putar miring kepala (pangkal leher, lokal). */
export const PUTAR_LEHER: T2 = [-4, 52];

// =================================================================================================================
// KEPALA

const tambah = (a: T3, dx: number, dy: number, dz = 0): T3 => [a[0] + dx, a[1] + dy, a[2] + dz];

/** Skala titik 2D di sekitar pusat (fitur diperbesar untuk versi kecil). */
const skalaDi = (p: T2, c: T2, s: number): T2 => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s];

/** Pita satu sisi: tepi bawah = garis titik, tepi atas digeser ke normal "atas" sejauh tebal. */
function pitaAtas(p: T2[], tebal: number[]): string {
  const atas: T2[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    dx /= L;
    dy /= L;
    let nx = dy, ny = -dx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    atas.push([p[i][0] + nx * tebal[i], p[i][1] + ny * tebal[i]]);
  }
  return halus([...p, ...atas.reverse()], true, 0.16);
}

interface OpsiKepala {
  id: string;
  wajah: IdWajah;
  pandang: ArahPandang;
  bicara: boolean;
  kedip: boolean;
  kecil: boolean;
  /** Potret mini (<= POTRET_MINI_MAKS_PX): raut kecil yang lebih dilebihkan (hanya bersama `kecil`). */
  mini: boolean;
  /** Miring tambahan dari pose badan (derajat). */
  miringPose: number;
}

interface HasilKepala {
  /** Isi grup kepala (koordinat lokal, rotasi miring sudah diterapkan). */
  svg: string;
  defs: string;
  /** Rahang (lokal, sesudah miring) dari bawah telinga dekat → rahang jauh, untuk bayang kepala di leher. */
  rahang: T2[];
  /** Titik rahang jauh tempat tepi leher jauh keluar dari bawah dagu (lokal, sesudah miring). */
  leherJauh: T2;
}

function gambarKepala(o: OpsiKepala): HasilKepala {
  const r = o.kecil ? rautKecil(o.wajah, RAUT[o.wajah], o.mini) : RAUT[o.wajah];
  const pd = PANDANG[o.pandang];
  const P: Proyeksi = buatProyeksi(pd.toleh, pd.angguk + r.angguk);
  const id = o.id;
  const k = o.kecil;
  const lg = k ? GARIS.tepi * GARIS.kaliKecil : GARIS.tepi * 1.05;
  const W = WARNA;
  const out: string[] = [];

  // ---- gradien & klip -----------------------------------------------------------------------------------------
  const tepiW = TEPI_WAJAH.map(P);
  const dWajah = halus(tepiW, true);
  const defs = [
    gradienLinear(`${id}-gk`, 1, 1, [[0, W.kulitTerang], [0.45, W.kulit], [1, W.kulitBawah]]),
    gradienLinear(`${id}-gr`, 0.8, 1, [[0, W.rambutTengah], [0.5, W.rambut], [1, '#0d0908']]),
    gradienPudar(`${id}-gp`, W.pipi, 0.64),
    gradienPudar(`${id}-gs`, BAYANG.sorot, 0.8),
    `<clipPath id="${id}-kw"><path d="${dWajah}"/></clipPath>`,
  ];

  // ---- sanggul & rambut belakang ------------------------------------------------------------------------------
  const sc = P(SANGGUL.c);
  out.push(`<ellipse cx="${f(sc[0])}" cy="${f(sc[1])}" rx="${SANGGUL.rx}" ry="${SANGGUL.ry}" transform="rotate(-18 ${pt(sc)})" fill="url(#${id}-gr)" ${tepi(lg)}/>`);
  // Putaran 3 (juri: sanggul tampak bola terpisah): bayang bersama di sisi sanggul yang menempel ke kubah (rambut
  // terkumpul di belakang, bukan bola yang ditempel) + kilau melingkar lebih redup; alur gulungan dari kiri-atas.
  out.push(
    `<ellipse cx="${f(sc[0] + SANGGUL.rx * 0.38)}" cy="${f(sc[1] + SANGGUL.ry * 0.12)}" rx="${f(SANGGUL.rx * 0.62)}" ry="${f(SANGGUL.ry * 0.84)}" transform="rotate(-18 ${pt(sc)})" ${isi('#000', 0.42)}/>`,
    jl(`M${pt([sc[0] - SANGGUL.rx * 0.78, sc[1] + 3])}A${f(SANGGUL.rx * 0.8)} ${f(SANGGUL.ry * 0.78)} 0 0 1 ${pt([sc[0] + SANGGUL.rx * 0.3, sc[1] - SANGGUL.ry * 0.76])}`, garis(W.rambutKilap, k ? 2.4 : 2.2, k ? 0.26 : 0.18)),
  );
  if (!k) {
    out.push(
      jl(
        [0.45, 0.72, 0.95].map((t) => `M${pt([sc[0] - SANGGUL.rx * t * 0.95, sc[1] + 1.5])}A${f(SANGGUL.rx * t * 0.95)} ${f(SANGGUL.ry * t * 0.9)} 0 0 1 ${pt([sc[0] + SANGGUL.rx * t * 0.55, sc[1] - SANGGUL.ry * t * 0.75])}`).join(''),
        garis('#6a5d5a', 0.5, 0.45),
      ),
    );
  }
  const luar = RAMBUT_LUAR.map(P);
  out.push(jl(halus([...luar, P([38, 12, 18]), P([10, 20, 10]), P([-30, 22, -4]), P([-40.5, 20, -12])], true), isi(W.rambut)));

  // ---- telinga + mutiara ------------------------------------------------------------------------------------
  out.push(jl(halus(TELINGA_LUAR.map(P), true), `fill="url(#${id}-gk)" ${tepi(lg * 0.9)}`));
  if (!k) {
    out.push(
      jl(halus([P([-35.6, 2, -2]), P([-39.8, 3.4, -6]), P([-40.6, 9, -7]), P([-39.2, 15, -5]), P([-37, 18, -3])]), garis(W.garisDalam, 0.8, 0.8)),
      jl(halus([P([-34.6, 6.5, 0]), P([-37.8, 8, -3]), P([-37.8, 12.6, -3]), P([-35.4, 15.6, -1]), P([-33.8, 12.2, 1])], true), isi(W.bayang, 0.35)),
    );
  }
  const mt = P(MUTIARA);
  const rm = k ? 2.8 : 2.3;
  out.push(
    `<circle cx="${f(mt[0])}" cy="${f(mt[1])}" r="${f(rm)}" fill="${W.mutiara}" stroke="${W.garis}" stroke-width="${f(lg * 0.6)}"/>`,
    `<circle cx="${f(mt[0] + 0.5)}" cy="${f(mt[1] + 0.7)}" r="${f(rm * 0.62)}" ${isi(W.mutiaraBayang, 0.5)}/>`,
    `<circle cx="${f(mt[0] - 0.7)}" cy="${f(mt[1] - 0.7)}" r="${f(rm * 0.35)}" fill="#fff"/>`,
  );

  // ---- wajah (kulit) + bayang/sorot di dalam klip ---------------------------------------------------------------
  out.push(jl(dWajah, `fill="url(#${id}-gk)"`));
  const bw: string[] = [];
  // Bidang wajah jauh (kanan, menjauhi cahaya): 2 lapis makin sempit ke tepi.
  const bidangJauh = (x0: number, op: number): string =>
    jl(halus([P([x0 + 6, -40, 30]), P([x0 + 9, -8, 38]), P([x0 + 7, 12, 44]), P([x0 + 10, 26, 44]), P([x0 + 8, 40, 34]), P([x0 + 2, 54, 30]), P([x0 - 4, 70, 28]), P([60, 70, 20]), P([60, -40, 20])], true), isi(W.bayang, op));
  bw.push(bidangJauh(19, 0.1), bidangJauh(25, 0.11));
  // Terminator lembut sepanjang pipi jauh.
  bw.push(jl(halus([P([36, -10, 26]), P([36.6, 8, 27]), P([35.6, 24, 27]), P([33, 36, 26]), P([27, 47, 26]), P([20, 55, 27]), P([24, 64, 20]), P([48, 50, 18]), P([48, -10, 18])], true), isi(W.bayang, 0.1)));
  // Rahang dekat: SATU lapis tipis (volume pipi bawah tanpa kesan dagu ganda).
  // Putaran 2: sabit makin tebal ke pipi bawah (pipi bulat membola, lebar setinggi mulut) lalu menipis ke dagu kecil.
  bw.push(
    jl(halus([P([-34, 12, 6]), P([-28.8, 30, 13]), P([-25, 42, 18]), P([-18.6, 50.6, 23]), P([-8.4, 56.6, 27]), P([4, 59.4, 30]), P([14, 58.6, 30]), P([22, 66, 26]), P([0, 71, 28]), P([-36, 52, 8])], true), isi(W.bayang, 0.08)),
    jl(halus([P([-34, 26, 6]), P([-30.6, 40, 13]), P([-24.8, 50.4, 21]), P([-15, 57.6, 26]), P([-3, 61.6, 29]), P([-2, 70, 28]), P([-36, 56, 8])], true), isi(W.bayang, 0.07)),
  );
  // Bayang garis rambut di dahi.
  bw.push(jl(halus([...GARIS_RAMBUT.slice(0, 13).map(P), P([-24, 1, 20]), P([-12, -14, 34]), P([8, -26, 40]), P([30, -16, 30]), P([37, 0, 24])], true), isi(W.bayang, 0.13)));
  // Rongga mata (di bawah alis), lebih gelap di pangkal hidung.
  bw.push(
    jl(halus([P([-10, 3.4, 31]), P([0, 0.4, 41]), P([12, 2.4, 47]), P([13.6, 9, 47]), P([4, 6.8, 43]), P([-7, 7.6, 34])], true), isi(W.bayang, 0.1)),
    jl(halus([P([24, 5.8, 47]), P([32, 3.8, 40]), P([39.6, 3.4, 28]), P([39.6, 10, 30]), P([31, 8.8, 40]), P([25.4, 10.4, 45])], true), isi(W.bayang, 0.12)),
    jl(halus([P([12.4, 4.4, 48]), P([15.6, 8.4, 50]), P([15.2, 16, 50]), P([12.4, 12, 46])], true), isi(W.bayang, 0.12)),
  );
  // Hidung: sisi jauh & bayang jatuh ke bibir atas.
  bw.push(
    jl(halus([P([18.5, 12, 50]), P([22.5, 19, 53]), P([26.4, 25, 53]), P([26.6, 30, 52]), P([23.5, 27, 51]), P([20.5, 18, 50])], true), isi(W.bayang, 0.12)),
    jl(halus([P([15, 32.4, 47]), P([22, 33.2, 50]), P([28.5, 32, 47]), P([27, 36, 40]), P([19, 35.8, 42])], true), isi(W.bayang, 0.16)),
  );
  // Bawah bibir (lekuk dagu), tipis.
  bw.push(jl(halus([P([8, 46.6, 32]), P([16, 49.4, 34]), P([23, 46.6, 28]), P([16, 51.4, 32])], true), isi(W.bayang, 0.08)));
  // Rona pipi TINGGI di tulang pipi tepat di bawah sudut luar mata (rona tinggi & di bawah mata, bukan cakram bulat
  // rendah di pipi; putaran 3 naik ± 5 satuan, elips melebar) + sorot hangat tulang pipi dekat.
  const naik = -2.5 * r.pipi;
  const pipiDekat = P([-12, 16.5 + naik, 34]);
  const pipiJauh = P([34.4, 17 + naik, 35]);
  const pangkal = P([10, 19.5, 47]);
  bw.push(
    `<ellipse cx="${f(pipiDekat[0])}" cy="${f(pipiDekat[1])}" rx="17" ry="9" transform="rotate(-8 ${pt(pipiDekat)})" fill="url(#${id}-gp)" opacity="${f(0.72 + 0.25 * r.pipi)}"/>`,
    `<ellipse cx="${f(pipiJauh[0])}" cy="${f(pipiJauh[1])}" rx="9.5" ry="7.5" transform="rotate(8 ${pt(pipiJauh)})" fill="url(#${id}-gp)" opacity="${f(0.64 + 0.25 * r.pipi)}"/>`,
    `<ellipse cx="${f(pangkal[0])}" cy="${f(pangkal[1])}" rx="7" ry="4" fill="url(#${id}-gp)" opacity=".22"/>`,
  );
  const sDahi = P([-6, -20, 38]);
  const sPipi = P([-13, 15 + naik * 0.6, 34]);
  const sDagu = P([11, 57, 30]);
  bw.push(
    `<ellipse cx="${f(sDahi[0])}" cy="${f(sDahi[1])}" rx="17" ry="11" fill="url(#${id}-gs)" opacity=".8"/>`,
    `<ellipse cx="${f(sPipi[0])}" cy="${f(sPipi[1])}" rx="12" ry="7" transform="rotate(-14 ${pt(sPipi)})" fill="url(#${id}-gs)" opacity="${f(0.3 + 0.15 * r.pipi)}"/>`,
    `<ellipse cx="${f(sDagu[0])}" cy="${f(sDagu[1])}" rx="5.5" ry="3.4" fill="url(#${id}-gs)" opacity=".6"/>`,
  );
  // Ujung hidung bulat LEBAR & lembut: sisi jauh ujung melebur ke pipi jauh (bidang lebar tipis, bukan garis),
  // sorot bulat besar di ujung + sorot tipis batang hidung dekat.
  bw.push(
    jl(halus([P([24.6, 22.6, 53]), P([27.4, 26, 53]), P([27.8, 29.6, 52]), P([26, 32, 50]), P([29, 31, 46]), P([30.4, 26.6, 46]), P([28.4, 22.6, 48])], true), isi(W.bayang, 0.14)),
    jl(halus([P([15.4, 22.2, 49]), P([20.4, 21.2, 53]), P([25, 23, 53]), P([20.6, 23.2, 53])], true), isi(W.bayang, 0.07)),
  );
  const uh = P([19.4, 26.4, 55]);
  const bh = P([15.6, 17, 50]);
  bw.push(
    `<ellipse cx="${f(uh[0])}" cy="${f(uh[1])}" rx="3.6" ry="2.8" fill="url(#${id}-gs)" opacity=".38"/>`,
    `<ellipse cx="${f(uh[0] - 0.6)}" cy="${f(uh[1] - 0.5)}" rx="1.4" ry="1" ${isi(BAYANG.sorot, 0.18)}/>`,
    `<ellipse cx="${f(bh[0])}" cy="${f(bh[1])}" rx="1.6" ry="5.5" transform="rotate(-12 ${pt(bh)})" fill="url(#${id}-gs)" opacity=".7"/>`,
  );
  out.push(`<g clip-path="url(#${id}-kw)">${bw.join('')}</g>`);

  // ---- hidung: ujung bulat lebar & lembut dari BIDANG, tanpa garis kait profil ----------------------------
  // bayang bawah ujung (sabit lembut dari cuping dekat ke cuping jauh), cuping dekat membulat, lubang hidung = bayang
  // lembut. Putaran 3 (juri: hidung kecil kartun, dua titik lubang gelap): pangkal cuping ± 15 % lebih lebar ke sisi
  // dekat, lubang hidung ± 35 % kegelapan semula, sorot ujung separuh (posisi ujung tetap).
  const lh = P([14.6, 31.1, 48]);
  const lj = P([23.8, 31.6, 51]);
  out.push(
    jl(halus([P([8.6, 29, 44]), P([13.4, 31.3, 47]), P([19.6, 31.8, 51]), P([24.4, 31.4, 52]), P([27, 29.6, 51]), P([25, 33.4, 48]), P([19.4, 34.4, 47]), P([12, 33.4, 44])], true), isi(W.bayang, k ? 0.3 : 0.22)),
    jl(halus([P([9, 25.6, 44]), P([7.4, 28.6, 43]), P([8.4, 31.6, 44]), P([11.6, 32.6, 46]), P([9.6, 30, 45]), P([9.4, 27.6, 45])], true), isi(W.bayang, k ? 0.4 : 0.24)),
    `<ellipse cx="${f(lh[0])}" cy="${f(lh[1])}" rx="${k ? 2.6 : 2.5}" ry="${k ? 1.3 : 1}" transform="rotate(10 ${pt(lh)})" ${isi(W.bayangTua, k ? 0.38 : 0.18)}/>`,
    `<ellipse cx="${f(lj[0])}" cy="${f(lj[1])}" rx="${k ? 1.8 : 1.6}" ry="${k ? 1.1 : 0.9}" transform="rotate(-6 ${pt(lj)})" ${isi(W.bayangTua, k ? 0.32 : 0.15)}/>`,
  );
  if (k) out.push(jl(halus([P([10.4, 31.4, 45]), P([16, 32.6, 49]), P([22, 32.8, 51]), P([26, 31.2, 51])]), garis(W.garisDalam, 1.4, 0.55)));

  // ---- mulut, mata, alis --------------------------------------------------------------------------------------
  // Pandang bawah (kartu): sudut bibir disejajarkan dengan garis mata, jadi membaca kartu tidak tampak menyeringai.
  let mulut = r.mulut;
  if (o.pandang === 'bawah') {
    const eD = P(MATA_DEKAT.iris), eJ = P(MATA_JAUH.iris);
    const mL = P(mulut.L), mR = P(mulut.R);
    mulut = { ...mulut, R: tambah(mulut.R, 0, mL[1] + ((eJ[1] - eD[1]) / (eJ[0] - eD[0])) * (mR[0] - mL[0]) - mR[1]) };
  }
  out.push(gambarMulut(P, mulut, o.bicara, k, o.mini));
  const opsMata: OpsMata = { r, pd, P, id, k, kedip: o.kedip };
  out.push(gambarMata(MATA_DEKAT, 'd', opsMata), gambarMata(MATA_JAUH, 'j', opsMata));
  out.push(gambarAlis(ALIS_DEKAT, r, P, k, 1, pd.alis, o.mini), gambarAlis(ALIS_JAUH, r, P, k, -1, pd.alis, o.mini));
  if (r.kerut > 0 && !k) out.push(jl(halus([P([15.6, 1.8, 48]), P([16.4, 5.4, 49])]), garis(W.bayang, 0.7, 0.4 * r.kerut)));

  // ---- garis tepi wajah: SATU kontur rahang bersih (sisi dekat garis dalam, dagu → pipi jauh garis luar) -------------
  out.push(jl(halus(TEPI_WAJAH.slice(4, 12).map(P)), garis(W.garisDalam, lg * 0.75, 0.6)));
  out.push(jl(halus(TEPI_WAJAH.slice(10, 21).map(P)), garis(W.garis, lg * 0.85)));

  // ---- rambut depan (kubah + garis rambut) --------------------------------------------------------------------
  const dKubah = rangkai([RAMBUT_LUAR.map(P), GARIS_RAMBUT.map(P), ATAS_TELINGA.map(P)]);
  defs.push(`<clipPath id="${id}-kr"><path d="${dKubah}"/></clipPath>`);
  out.push(jl(dKubah, `fill="url(#${id}-gr)"`));
  out.push(`<g clip-path="url(#${id}-kr)">${helaiRambut(P, k)}</g>`);
  out.push(jl(halus(RAMBUT_LUAR.map(P)), garis(W.garis, lg * (k ? 1.1 : 1))));
  // Garis rambut LEMBUT (bukan helm): tepi tipis + pita rambut tembus di sisi kulit (rambut halus yang menipis).
  const gr = halus(GARIS_RAMBUT.map(P));
  out.push(jl(gr, garis(W.rambut, k ? 2.4 : 2.8, k ? 0.3 : 0.22)), jl(gr, garis(W.rambut, k ? 1.2 : 1, k ? 0.8 : 0.55)));
  // Belahan samping: pita terang meruncing (kulit kepala + kilau).
  const bl = BELAHAN.map(P);
  out.push(jl(pita(bl, k ? [0.6, 1.8, 1.6, 1.2, 0.3] : [0.4, 1.7, 1.5, 1.1, 0.2]), isi('#8f8280', k ? 0.8 : 0.72)));
  if (!k) {
    out.push(jl(halus(bl.slice(0, 4)), garis('#d2c3bd', 0.5, 0.55)));
    // anak rambut halus di pelipis dekat & jauh, dan beberapa helai di dahi yang disisir ke belahan
    out.push(
      jl(
        `${halus([P([-27.2, 0, 16]), P([-29, 4.5, 12]), P([-30.2, 8, 9])])}${halus([P([-24.8, -5.5, 20]), P([-26.8, -0.5, 16])])}` +
          `${halus([P([-20.4, -11.6, 26]), P([-22.6, -7, 22])])}`,
        garis(W.rambut, 0.45, 0.55),
      ),
    );
  }

  const miring = r.miring + o.miringPose;
  const rad = (miring * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad);
  const putar = ([x, y]: T2): T2 => {
    const dx = x - PUTAR_LEHER[0], dy = y - PUTAR_LEHER[1];
    return [PUTAR_LEHER[0] + dx * cs - dy * sn, PUTAR_LEHER[1] + dx * sn + dy * cs];
  };
  return {
    svg: `<g transform="rotate(${f(miring)} ${pt(PUTAR_LEHER)})">${out.join('')}</g>`,
    defs: defs.join(''),
    rahang: TEPI_WAJAH.slice(RAHANG_DARI, RAHANG_SAMPAI + 1).map((p) => putar(P(p))),
    leherJauh: putar(P(TEPI_WAJAH[LEHER_JAUH])),
  };
}

/** Garis bantu (hanya lembar perbandingan): kontur utama sebagai garis berwarna di atas gambar acuan (lembar kerja lokal, bukan repo). */
export function garisBantuKepala(wajah: IdWajah = 'senyum', pandang: ArahPandang = 'depan'): string {
  const r = RAUT[wajah];
  const pd = PANDANG[pandang];
  const P = buatProyeksi(pd.toleh, pd.angguk + r.angguk);
  const g = (d: string, w: string): string => jl(d, garis(w, 0.7));
  const mata = (x: Mata): string =>
    x.sisi === 1
      ? halus([P(x.luar), ...x.atas.map(P), P(x.dalam), ...x.bawah.map(P)], true)
      : halus([P(x.dalam), ...x.atas.map(P), P(x.luar), ...x.bawah.map(P)], true);
  return `<g transform="rotate(${f(r.miring)} ${pt(PUTAR_LEHER)})">${[
    g(halus(TEPI_WAJAH.slice(3, 21).map(P)), '#00e5ff'),
    g(halus(RAMBUT_LUAR.map(P)), '#ff2bd6'),
    g(halus(GARIS_RAMBUT.map(P)), '#ff2bd6'),
    g(halus(TELINGA_LUAR.map(P), true), '#00e5ff'),
    g(mata(MATA_DEKAT), '#7CFF00'),
    g(mata(MATA_JAUH), '#7CFF00'),
    g(halus(ALIS_DEKAT.map((a) => P(a.p))), '#ffe600'),
    g(halus(ALIS_JAUH.map((a) => P(a.p))), '#ffe600'),
    g(halus([P(r.mulut.L), P(lerp3(r.mulut.L, r.mulut.R, 0.5)), P(r.mulut.R)]), '#ff3030'),
  ].join('')}</g>`;
}

/** Rambut licin: kilau pita di kubah kiri-atas (cahaya) + helai tipis mengikuti arah sisir ke sanggul. */
function helaiRambut(P: Proyeksi, k: boolean): string {
  const W = WARNA;
  // Pita kilau mengkilap mengikuti lengkung kubah (rambut licin, bukan helm): lebar lembut + inti sempit lebih terang.
  const jalurKilau: T3[] = [[-38.4, -20, -12], [-36.4, -38, -10], [-28, -51.5, -5], [-14, -58, 0], [0, -57.6, 5], [12.6, -52, 10], [22.6, -43.6, 13]];
  const pk = jalurKilau.map(P);
  const s = [
    jl(pita(pk, [0.6, 4.5, 7, 7.6, 6.4, 4, 0.6]), isi(W.rambutKilap, k ? 0.2 : 0.17)),
    jl(pita(geser(pk, 0.4, 0.4), [0.3, 1.6, 2.6, 2.8, 2.2, 1.2, 0.3]), isi('#c8bebb', k ? 0.28 : 0.26)),
  ];
  s.push(jl(halus([P([12, -53, 10]), P([22, -46, 14]), P([30, -36, 17]), P([27, -33, 20]), P([19, -42, 16]), P([10, -47, 12])], true), isi(W.rambutKilap, 0.12)));
  if (k) return s.join('');
  // Helai = interpolasi antara dua kurva pemandu (deterministik); digabung per warna menjadi SATU path.
  const RENTANG: [number, number][] = [[0, 4], [1, 5], [0, 3], [2, 5], [0, 5], [1, 4]];
  const terang: string[] = [];
  const gelap: string[] = [];
  const helai = (A: T3[], B: T3[], jumlah: number): void => {
    for (let i = 0; i < jumlah; i++) {
      const t = (i + 0.5) / jumlah;
      const g = Math.sin(i * 12.9898) * 0.5;
      const [a0, a1] = RENTANG[i % RENTANG.length];
      const titik = A.map((a, j) => {
        const p = lerp3(a, B[j], t);
        return P([p[0] + g * (j / A.length), p[1] + g * 0.6, p[2]]);
      }).slice(a0, a1);
      (i % 3 === 1 ? terang : gelap).push(halus(titik));
    }
  };
  helai([[-29, 3, 13], [-33.5, -8, 4], [-37, -21, -10], [-37, -36, -14], [-32, -48, -12]], [[5.6, -32.6, 40], [1, -43, 30], [-6, -53, 18], [-15, -59.5, 4], [-25, -57, -6]], 8);
  helai([[9.6, -32.6, 40], [9.8, -41, 32], [8, -50, 22], [3, -57.5, 10], [-4, -62.5, 0]], [[41.2, 0, 21], [40, -12, 18], [36, -26, 16], [29, -39.5, 12], [19.4, -51, 8]], 5);
  s.push(jl(terang.join(''), garis(W.rambutKilap, 0.42, 0.3)), jl(gelap.join(''), garis('#6a5446', 0.34, 0.18)));
  s.push(jl(`${halus([P([-20, -12, 26]), P([-30, -30, 0]), P([-34, -48, -10])])}${halus([P([-8, -26, 36]), P([-18, -44, 12]), P([-22, -59, -4])])}${halus([P([20, -30, 36]), P([26, -40, 16]), P([22, -52, 8])])}`, garis('#000', 0.85, 0.22)));
  return s.join('');
}

interface OpsMata {
  r: Raut;
  pd: (typeof PANDANG)[ArahPandang];
  P: Proyeksi;
  id: string;
  k: boolean;
  kedip: boolean;
}

function gambarMata(m: Mata, akhiran: string, o: OpsMata): string {
  const { r, pd, P, id, k } = o;
  const W = WARNA;
  const s: string[] = [];
  const kiriKe = m.sisi === 1; // mata dekat: sudut luar di kiri
  const luar = P(m.luar), dalam = P(m.dalam);
  const pusat: T2 = [(luar[0] + dalam[0]) / 2, (luar[1] + dalam[1]) / 2 + 1];
  // Tinggi bukaan di tiap titik kelopak atas = jarak ke kelopak bawah yang sepadan (dipakai untuk pecahan kelopak).
  const na = m.atas.length, nb = m.bawah.length;
  const bawahDi = (t: number): T3 => {
    // t: 0 = sudut kiri gambar, 1 = kanan; kelopak bawah urut kanan → kiri
    const u = (1 - t) * (nb + 1) - 1;
    const i0 = Math.max(0, Math.min(nb - 1, Math.floor(u))), i1 = Math.max(0, Math.min(nb - 1, i0 + 1));
    return lerp3(m.bawah[i0], m.bawah[i1], Math.max(0, Math.min(1, u - i0)));
  };
  // Putaran 5 (juri-3: senyum/lega + pandang bawah di HP = celah gelap tanpa iris): kelopak atas total dibatasi
  // 0,34 supaya iris & sorot tetap tampak pada skala panggung HP (± 0,44 px/satuan).
  const turun = Math.min(0.34, r.kelopakAtas + pd.kelopak);
  const atas: T3[] = m.atas.map((p, i) => {
    const tGambar = (i + 1) / (na + 1);
    const tLuar = kiriKe ? 1 - tGambar : tGambar; // 1 = sisi luar
    const tinggi = Math.max(1, bawahDi(tGambar)[1] - p[1]);
    const tengah = 1 - Math.abs(tGambar - 0.5) * 1.2;
    const frac = turun * tengah + r.kelopakLuar * tLuar * 1.2 + r.kelopakDalam * (1 - tLuar);
    return tambah(p, 0, frac * tinggi);
  });
  const bawah: T3[] = m.bawah.map((p, i) => {
    const t = (i + 1) / (nb + 1);
    const tengah = 1 - Math.abs(t - 0.5) * 1.4;
    return tambah(p, 0, r.kelopakBawah * 5.5 * tengah);
  });
  const gA0: T2[] = kiriKe ? [luar, ...atas.map(P), dalam] : [dalam, ...atas.map(P), luar];
  const gB0: T2[] = kiriKe ? [dalam, ...bawah.map(P), luar] : [luar, ...bawah.map(P), dalam];
  const skala = k ? 1.32 : 1;
  const gA = gA0.map((p) => skalaDi(p, pusat, skala));
  const gB = gB0.map((p) => skalaDi(p, pusat, skala));
  const dBuka = rangkai([gA, gB]);
  const lebar = Math.abs(dalam[0] - luar[0]) * skala;
  const nA = gA.length;
  const sudutLuar = kiriKe ? gA[0] : gA[nA - 1];
  const arahL = kiriKe ? -1 : 1;

  // Bayang kelopak (smoky): pita gelap di atas garis bulu + bayang lembut sampai lipatan, melebar ke sudut luar.
  const lipat = gA.map(([x, y], i) => {
    const tLuar = kiriKe ? 1 - i / (nA - 1) : i / (nA - 1);
    return [x + arahL * tLuar * 1.2, y - (i === 0 || i === nA - 1 ? 0.8 : 2.6 + (k ? 0.4 : 0)) - tLuar * 0.6] as T2;
  });
  if (o.kedip) {
    // Mata tertutup: kelopak kulit menutup bukaan, garis bulu melengkung ke bawah.
    const tutupK: T2[] = gA.map(([x, y], i) => [x, lerp(y, (gB[gB.length - 1 - i] ?? gB[0])[1], 0.72)] as T2);
    tutupK[0] = gA[0];
    tutupK[nA - 1] = gA[nA - 1];
    s.push(jl(dBuka, `fill="url(#${id}-gk)"`));
    s.push(jl(rangkai([gA, [...lipat].reverse()]), isi('#8a4a40', 0.22)));
    s.push(jl(pita(tutupK, tutupK.map((_, i) => (k ? 1.6 : 0.8) + (kiriKe ? 1 - i / (nA - 1) : i / (nA - 1)) * (k ? 1.2 : 1.1))), isi(W.liner)));
    return s.join('');
  }
  // versi kecil: bayang kelopak ± 30 % lebih terang (juri: mata kecil menjadi massa hitam = riasan tebal)
  s.push(jl(rangkai([gA, [...lipat].reverse()]), isi('#8a4a40', k ? 0.18 : 0.24)));
  s.push(jl(rangkai([gA, gA.map(([x, y]) => [x, y - 1.5] as T2).reverse()]), isi('#4a2420', k ? 0.1 : 0.3)));
  if (!k) s.push(jl(halus(lipat.slice(1, -1)), garis(W.garisDalam, 0.5, 0.3)));

  // sklera redup hangat + iris gelap (klip bukaan). Versi kecil: sklera lebih terang & iris lebih kecil supaya selalu
  // tampak celah putih di KEDUA sisi iris. Putaran 4 (ekspor/juri: mata kecil 44/52 px masih terbaca riasan hitam tebal):
  // sklera kecil makin terang, bayang sudut & bayang kelopak di bola mata makin tipis, iris 0,8 × dan DIJEPIT di dalam
  // bukaan dengan celah >= 22 % lebar mata di tiap sisi.
  s.push(jl(dBuka, isi(k ? '#f7efea' : W.sklera)));
  const klip = `${id}-km${akhiran}`;
  const ip = P(m.iris);
  let ix = pusat[0] + (ip[0] - (luar[0] + dalam[0]) / 2) * 0.35 + lebar * pd.iris;
  const iy = ip[1] + pd.irisY - 0.3;
  const ry = m.r * (k ? 0.8 : 1) * skala;
  const rx = ry * Math.min(1, 0.4 + 0.6 * (lebar / skala / 18)) * (kiriKe ? 0.96 : 1.06);
  if (k) {
    const kiri = Math.min(luar[0], dalam[0]), kanan = Math.max(luar[0], dalam[0]);
    const c0 = pusat[0] - (pusat[0] - kiri) * skala, c1 = pusat[0] + (kanan - pusat[0]) * skala;
    const celah = lebar * 0.22;
    ix = Math.min(Math.max(ix, c0 + celah + rx), c1 - celah - rx);
  }
  // y kelopak atas (gA urut kiri → kanan gambar) di x sorot; sorot minimal sejarak jari-jarinya di bawah kelopak
  const xSorot = ix - rx * 0.36;
  let yKelopak = gA[0][1];
  for (let i = 1; i < gA.length; i++) {
    const [x0, y0] = gA[i - 1], [x1, y1] = gA[i];
    if (xSorot >= Math.min(x0, x1) && xSorot <= Math.max(x0, x1)) {
      yKelopak = lerp(y0, y1, (xSorot - x0) / (x1 - x0 || 1));
      break;
    }
  }
  const sorotMin = yKelopak + (k ? 1.1 : kiriKe ? 1.05 : 0.88) + 0.35;
  const isiKlip = [
    // bayang sudut (bola mata membulat) + bayang kelopak atas yang jatuh di bola mata
    `<ellipse cx="${f(pusat[0])}" cy="${f(pusat[1])}" rx="${f(lebar * 0.62)}" ry="${f(lebar * 0.4)}" fill="none" stroke="#9a7068" stroke-opacity="${k ? '.1' : '.4'}" stroke-width="${f(lebar * 0.24)}"/>`,
    `<ellipse cx="${f(ix)}" cy="${f(iy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${W.iris}"/>`,
    `<ellipse cx="${f(ix + rx * 0.1)}" cy="${f(iy + ry * 0.42)}" rx="${f(rx * 0.62)}" ry="${f(ry * 0.36)}" ${isi(W.irisTerang, 0.5)}/>`,
    `<ellipse cx="${f(ix)}" cy="${f(iy)}" rx="${f(rx * 0.44)}" ry="${f(ry * 0.44)}" fill="${W.pupil}"/>`,
    // bayang kelopak atas di bola mata (putaran 5: lebih tipis & dangkal pada versi normal: mata panggung tidak menjadi
    // celah gelap setengah tertutup)
    jl(rangkai([gA, gA.map(([x, y]) => [x, y + (k ? 1.6 : 2)] as T2).reverse()]), isi('#2a1410', k ? 0.28 : 0.4)),
    // sorot lembut kecil di kiri-atas iris (putaran 3: bukan bulatan putih terang yang membuat tatapan "glam"). Putaran 5
    // (juri-3: di HP mata senyum tanpa titik cahaya): sedikit lebih besar & terang, dan dijaga di bawah kelopak atas
    // (turun ke dalam bukaan) supaya tetap tampak saat kelopak turun (senyum, lega, pandang bawah).
    `<circle cx="${f(ix - rx * 0.36)}" cy="${f(Math.max(iy - ry * 0.3, sorotMin))}" r="${f(k ? 1.1 : kiriKe ? 1.05 : 0.88)}" fill="#fff6ee" fill-opacity="${k ? '.75' : '.78'}"/>`,
  ];
  s.push(`<clipPath id="${klip}"><path d="${dBuka}"/></clipPath><g clip-path="url(#${klip})">${isiKlip.join('')}</g>`);
  // sudut dalam merah muda (karunkel) kecil
  if (!k) {
    const sd = kiriKe ? gA[nA - 1] : gA[0];
    s.push(`<ellipse cx="${f(sd[0] - arahL * 1.2)}" cy="${f(sd[1] + 0.2)}" rx="1.2" ry=".8" ${isi('#c9837c', 0.55)}/>`);
  }

  // SATU garis mata atas meruncing: tipis di sudut dalam, tebal di luar + sayap kecil. Putaran 3 (juri: garis mata
  // "glam"): sayap ± 50 % lebih pendek & rendah, tebal di sisi luar ± 30 % lebih tipis; versi kecil ± 30 % lebih ringan.
  // Putaran 4: versi kecil ± 33 % lebih tipis lagi (0,8–1,4), sayap pendek, garis bawah tipis cokelat (bukan cincin hitam).
  const tebal = gA.map((_, i) => {
    const t = kiriKe ? 1 - i / (nA - 1) : i / (nA - 1); // 1 = sisi luar
    return k ? 0.8 + 0.6 * t : 0.6 + 0.78 * t + 0.38 * t * t;
  });
  // sayap mata jauh memendek saat kepala menoleh jauh (tidak menjulur keluar kontur pipi)
  const panjangSayap = kiriKe ? (k ? 0.8 : 1.3) : Math.max(0.4, (k ? 0.6 : 1.05) - Math.max(0, pd.toleh - 20) * 0.07);
  const sayap: T2 = [sudutLuar[0] + arahL * panjangSayap, sudutLuar[1] - (k ? 0.5 : 0.55) * (kiriKe ? 1 : 0.8)];
  const garisLash = kiriKe ? [sayap, ...gA] : [...gA, sayap];
  const tebalLash = kiriKe ? [0.2, ...tebal] : [...tebal, 0.2];
  s.push(jl(pitaAtas(garisLash, tebalLash), isi(W.liner)));
  // Kelopak bawah: garis lembut menebal ke sudut luar (sepertiga luar lebih gelap), tidak sampai sudut dalam.
  const nB = gB.length;
  const tebalBawah = gB.map((_, i) => {
    const t = kiriKe ? i / (nB - 1) : 1 - i / (nB - 1); // 1 = sisi luar
    return k ? 0.45 + 0.35 * t * t : 0.28 + 0.8 * t * t;
  });
  s.push(jl(pita(gB, tebalBawah, 0.15), k ? isi('#6a4034', 0.42) : isi('#4a2a22', 0.62)));
  if (!k && r.kelopakBawah < 0) {
    // tonjolan lembut bawah mata (mata tersenyum): sorot tipis + garis bayang di bawahnya
    s.push(jl(halus(gB.slice(1, -1).map(([x, y]) => [x, y + 1.8] as T2)), garis(BAYANG.sorot, 1, 0.16)));
    s.push(jl(halus(gB.slice(1, -1).map(([x, y]) => [x, y + 2.8] as T2)), garis(W.bayang, 0.7, 0.24)));
  }
  return s.join('');
}

function gambarAlis(titik: { p: T3; t: number }[], r: Raut, P: Proyeksi, k: boolean, sisi: 1 | -1, naik = 0, mini = false): string {
  const n = titik.length;
  const [gd, gp, gl] = r.alis;
  let pts: T2[] = titik.map(({ p }, i) => {
    const t = i / (n - 1); // 0 = dalam, 1 = luar
    const wD = Math.max(0, 1 - t / 0.45), wL = Math.max(0, (t - 0.45) / 0.55), wP = 1 - wD - wL;
    return P(tambah(p, (gd[0] * wD + gp[0] * wP + gl[0] * wL) * sisi, gd[1] * wD + gp[1] * wP + gl[1] * wL + naik));
  });
  if (k) {
    const c: T2 = [(pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2];
    pts = pts.map((p) => skalaDi(p, c, mini ? 1.3 : 1.18));
  }
  const tebal = titik.map(({ t }) => t * r.alisTebal * (mini ? 1.8 : k ? 1.45 : 1));
  return jl(pita(pts, tebal), isi(WARNA.alis, k ? 1 : 0.92));
}

function gambarMulut(P: Proyeksi, m: Mulut, bicara: boolean, k: boolean, mini = false): string {
  const W = WARNA;
  const s: string[] = [];
  const N = 9;
  const garisTengah: T3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const b = 4 * t * (1 - t);
    const p = lerp3(m.L, m.R, t);
    garisTengah.push([p[0], p[1] + m.lengkung * b, p[2] + 6 * b]);
  }
  // bentuk busur cupid: dua puncak di ± 0,17 dari tengah, lekuk kecil di tengah
  const busur = (t: number): number => {
    const d = t - 0.5;
    return Math.pow(Math.max(0, 1 - Math.pow(Math.abs(d) / 0.5, 1.6)), 0.9) + Math.exp(-Math.pow((Math.abs(d) - 0.17) / 0.09, 2)) * 0.28 - Math.exp(-Math.pow(d / 0.05, 2)) * 0.22;
  };
  const buka = (bicara ? m.buka : 0) + (m.celah ?? 0);
  const terbuka = buka > 0;
  const atasLuar = garisTengah.map((p, i) => tambah(p, 0, -m.atas * busur(i / N)));
  const tepiAtas = garisTengah.map((p, i) => tambah(p, 0, terbuka ? -buka * 0.18 * Math.sin((Math.PI * i) / N) : 0));
  const tepiBawah = garisTengah.map((p, i) => tambah(p, 0, terbuka ? buka * 0.82 * Math.pow(Math.sin((Math.PI * i) / N), 0.8) : 0));
  const bawahLuar = tepiBawah.map((p, i) => {
    const b = Math.pow(Math.sin((Math.PI * i) / N), 0.75);
    return tambah(p, 0.4 * b, m.bawah * b);
  });
  // versi kecil: mulut diperbesar 1,4 × di sekitar pusatnya (mini 1,7 ×: bentuk senyum/cemberut/lurus terbaca di 28–32 px)
  const c = P(lerp3(m.L, m.R, 0.5));
  const Q = (p: T3): T2 => (k ? skalaDi(P(p), [c[0], c[1] + 1.5], mini ? 1.7 : 1.4) : P(p));
  const pAL = atasLuar.map(Q), pTA = tepiAtas.map(Q), pTB = tepiBawah.map(Q), pBL = bawahLuar.map(Q);
  if (terbuka) {
    s.push(jl(rangkai([pTA, [...pTB].reverse()]), isi(W.mulutDalam)));
    if (m.gigi > 0 && bicara) {
      const gigiBawah = tepiAtas.map((p, i) => tambah(p, 0, m.gigi * Math.pow(Math.sin((Math.PI * i) / N), 0.6)));
      s.push(jl(rangkai([pTA.slice(1, -1), gigiBawah.slice(1, -1).map(Q).reverse()]), isi(W.gigi, 0.95)));
    }
    if (bicara) s.push(jl(halus(tepiBawah.slice(2, -2).map((p) => Q(tambah(p, 0, -0.9)))), garis('#b04a4f', 1.6, 0.6)));
  }
  s.push(jl(rangkai([pAL, [...pTA].reverse()]), isi(W.bibir)));
  s.push(jl(rangkai([pAL.slice(4), [...pTA.slice(4)].reverse()]), isi(W.bibirTua, 0.3)));
  s.push(jl(rangkai([pTB, [...pBL].reverse()]), isi(W.bibir)));
  s.push(jl(rangkai([pTB.slice(5), [...pBL.slice(5)].reverse()]), isi(W.bibirTua, 0.26)));
  if (!k) {
    const kilap = [2, 3, 4, 5].map((i) => Q(tambah(lerp3(tepiBawah[i], bawahLuar[i], 0.45), -0.3, 0)));
    // kilap bibir separuh (putaran 3: bibir tidak lagi "glossy" tipis)
    s.push(jl(pita(kilap, [0.3, 1.1, 1.1, 0.3]), isi(W.bibirTerang, 0.38)));
    s.push(jl(halus([2, 3, 4].map((i) => Q(tambah(atasLuar[i], 0, -0.7)))), garis('#fff2e8', 0.8, 0.2)));
  }
  s.push(jl(halus(pTA), garis(W.bibirTua, k ? 2 : 0.9, 0.95)));
  s.push(jl(halus(pAL), garis(W.bibirTua, k ? 0.9 : 0.5, 0.5)));
  return s.join('');
}

// =================================================================================================================
// BADAN (koordinat kanvas pose; berdiri: kepala di (210,120); duduk = berdiri digeser (+20, +30))

const S = SERAGAM;

interface HasilBadan {
  /** Kaki, rok, lengan jauh atas, jas (sebelum leher). */
  belakang: string;
  /** Kerah mandarin (sesudah leher, sebelum kepala). */
  kerah: string;
  /** Lengan depan & tangan (sesudah kepala). */
  depan: string;
  defs: string;
  kepala: T2;
  tangan: { kiri?: T2; kanan?: T2 };
  /** Pose duduk: lengan bawah + tangan di meja (dibangun dengan awalan id apa pun). */
  meja?: (id: string) => string;
}

function defsSeragam(id: string): string {
  return [
    gradienLinear(`${id}-gj`, 1, 0.9, [[0, S.jasTerang], [0.42, S.jas], [1, '#e8b25f']]),
    gradienLinear(`${id}-grok`, 1, 0, [[0, S.rokTerang], [0.55, S.rok], [1, '#3a2a22']]),
    gradienLinear(`${id}-gt`, 0.35, 1, [[0, '#d49a77'], [0.55, '#e1a883'], [1, '#ebb894']]),
    defsLengan(id),
  ].join('');
}
/** Gradien lengan (jas) & tangan (kulit): dipakai SVG utama & lapisan meja (awalan masing-masing). */
function defsLengan(id: string): string {
  return (
    gradienLinear(`${id}-gl`, 1, 0, [[0, S.jasTerang], [0.5, S.jas], [1, '#e0aa58']]) +
    gradienLinear(`${id}-gh`, 1, 1, [[0, '#fcd9bc'], [0.6, S.kulit], [1, '#dd9f7a']])
  );
}

const LG = GARIS.tepi;

function kancing(x: number, y: number, r = 3.8): string {
  return (
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${S.kancing}" stroke="${GARIS.warna}" stroke-width=".6"/>` +
    `<circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.38)}" ${isi(S.kancingSorot, 0.8)}/>` +
    `<path d="M${pt([x - r * 0.8, y + r * 1.15])}q${f(r)} ${f(r * 0.5)} ${f(r * 1.8)} ${f(-0.2)}" ${garis(S.jasBayang, 1, 0.35)}/>`
  );
}
const kancingKecil = (x: number, y: number): string => `<circle cx="${f(x)}" cy="${f(y)}" r="1.7" fill="${S.kancing}" stroke="${GARIS.warna}" stroke-width=".45"/>`;

/**
 * Lencana nama emas POLOS (tanpa huruf: teks nama bukan milik tokoh & tidak digenerasi) dengan emblem kecil merah di
 * ujung kiri, + pin kecil TERPISAH di atasnya. Miring mengikuti dada jauh.
 */
function lencana(x: number, y: number, miring: number): string {
  return `<g transform="rotate(${f(miring)} ${pt([x, y])})"><rect x="${f(x)}" y="${f(y)}" width="24" height="7" rx="1.3" fill="${S.emas}" stroke="${S.emasTua}" stroke-width=".7"/><rect x="${f(x + 1)}" y="${f(y + 0.9)}" width="22" height="2" rx="1" ${isi(S.emasTerang, 0.8)}/><rect x="${f(x + 8.5)}" y="${f(y + 3.8)}" width="13" height="1.4" rx=".6" ${isi(S.emasTua, 0.5)}/><path d="M${pt([x + 2, y + 5.6])}l2.3-4.4l2.3 4.4z" ${isi(S.merah, 0.85)}/><path d="M${pt([x, y + 8.4])}h24" ${garis(S.jasBayang, 1.1, 0.35)}/><ellipse cx="${f(x + 15)}" cy="${f(y - 6)}" rx="2.4" ry="2.9" fill="${S.emas}" stroke="${S.emasTua}" stroke-width=".55"/><ellipse cx="${f(x + 15)}" cy="${f(y - 6)}" rx="1.3" ry="1.6" fill="${S.merah}"/></g>`;
}

/**
 * Kerah mandarin putih tegak (± 19 satuan) MEMELUK leher: separuh dekat + separuh jauh yang sempit. Putaran 3 (juri:
 * celah kulit tegak sampai kancing pertama terbaca sebagai tali/pipa): kerah TERTUTUP di depan — kedua
 * separuh bertemu di satu jahitan, hanya takik V kecil (± 4 satuan) di tepi atas; bukaan diagonal jas mulai tepat di
 * bawah kaki kerah.
 */
function kerah(dx: number, dy: number, lg: number): string {
  const g = (p: T2[]): T2[] => geser(p, dx, dy);
  const dekat: T2[] = g([[175.4, 170.2], [184, 173], [193, 176], [202, 179], [209.6, 181.6], [216, 184.2], [218.2, 190.2], [218.5, 197], [218.6, 205.2], [204, 200.8], [193, 197.4], [183, 194], [174, 190.6], [173.6, 180]]);
  const jauh: T2[] = g([[220.4, 184.6], [225, 184.2], [229.4, 183.6], [230.2, 194], [230.2, 202.6], [225.6, 204], [218.7, 205.3], [218.6, 197], [218.4, 190.4]]);
  return [
    // takik V di tepi atas depan: bayang leher di dalam kerah
    jl(`M${pt(g([[215.2, 183.4]])[0])}L${pt(g([[221.4, 183.8]])[0])}L${pt(g([[218.4, 191.4]])[0])}Z`, isi('#9a5440', 0.5)),
    tutup(dekat, `fill="${S.putih}" ${tepi(lg * 0.8)}`, 0.12),
    bentuk(g([[174, 183], [192, 189.4], [212, 196.4], [218.2, 199], [218.3, 204.6], [196, 198], [175, 190]]), S.putihBayang, 0.28),
    jl(halus(g([[177, 174], [194, 179.6], [211, 185.6]])), garis('#fff', 1.1, 0.8)),
    tutup(jauh, `fill="${S.putih}" ${tepi(lg * 0.8)}`, 0.12),
    bentuk(g([[219.4, 196], [229.6, 194], [229.8, 202.4], [219.4, 204.6]]), S.putihBayang, 0.35),
  ].join('');
}

/**
 * Leher: tepi dekat (tengkuk, tetap di badan) dari bawah telinga ke kerah; tepi jauh keluar dari BAWAH rahang
 * (titik `leherJauh` kepala) turun ke kerah, jadi leher mengikuti toleh/miring kepala dan tidak melebar melewati dagu.
 * Bayang kepala di leher = pita lembut mengikuti rahang (bukan di wajah: tidak ada kesan dagu ganda).
 */
function leher(id: string, kx: number, ky: number, dx: number, dy: number, rahang: T2[], leherJauh: T2, lg: number): string {
  const c = (p: T2): T2 => [p[0] + kx, p[1] + ky];
  const g = (p: T2[]): T2[] => geser(p, dx, dy);
  const J = c(leherJauh);
  const K: T2 = [223.2 + dx, 185 + dy];
  const dekatAtas: T2[] = g([[180, 126], [178.6, 150], [177.4, 170]]);
  const bawah: T2[] = g([[176, 182], [192, 192], [208, 197.6], [219, 199.4]]);
  const R = rahang.map(c);
  // rahang dari leherJauh balik ke dekat (tersembunyi di bawah wajah, menutup bentuk)
  const iJ = R.findIndex((p) => p[0] >= J[0] - 0.01);
  const rahangBalik = (iJ > 0 ? R.slice(0, iJ) : R).map((p) => [p[0], p[1] - 4] as T2).reverse();
  const bentukLeher: T2[] = [...dekatAtas, ...bawah, K, [J[0], J[1] - 2], ...rahangBalik];
  // bayang kepala di leher: rahang digeser turun (lapisan makin sempit)
  const bayang = (turun: number, op: number): string =>
    jl(halus([...R.map((p) => [p[0], p[1] - 3] as T2), [J[0] + 2, J[1] + turun * 0.6], ...R.map((p, i) => [p[0], p[1] + turun * Math.sin((Math.PI * (i + 1)) / (R.length + 1)) + turun * 0.3] as T2).reverse()], true), isi('#7e3a2c', op));
  return [
    `<clipPath id="${id}-kl"><path d="${halus(bentukLeher, true, 0.12)}"/></clipPath>`,
    jl(halus(bentukLeher, true, 0.12), `fill="url(#${id}-gt)"`),
    `<g clip-path="url(#${id}-kl)">${bayang(16, 0.16)}${bayang(8, 0.2)}${bentuk(g([[176, 128], [192, 142], [198, 160], [196, 176], [186, 184], [174, 184]]), '#7e3a2c', 0.2)}</g>`,
    jl(halus(dekatAtas), garis(GARIS.warna, lg * 0.9)),
    jl(halus([[J[0], J[1] - 1], K]), garis(GARIS.warna, lg * 0.85)),
  ].join('');
}

/** Kuku merah (oval) dengan kilap kecil. */
function kuku(x: number, y: number, sudut: number, w: number, h: number): string {
  return `<g transform="rotate(${f(sudut)} ${pt([x, y])})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w / 2)}" ry="${f(h / 2)}" fill="${S.kuku}" stroke="#7a1422" stroke-width=".45"/><ellipse cx="${f(x - w * 0.15)}" cy="${f(y - h * 0.15)}" rx="${f(w * 0.14)}" ry="${f(h * 0.22)}" ${isi('#ffc2c6', 0.75)}/></g>`;
}

/**
 * Bukaan depan diagonal (ke KANAN pemakai = kiri gambar) + kancing. `titik` = garis bukaan; kancing di sepanjangnya.
 */
function bukaanDepan(titik: T2[], kancingY: number[]): string {
  const xPada = (y: number): number => {
    for (let i = 1; i < titik.length; i++) {
      const [x0, y0] = titik[i - 1], [x1, y1] = titik[i];
      if (y >= y0 && y <= y1) return lerp(x0, x1, (y - y0) / (y1 - y0 || 1));
    }
    return titik[titik.length - 1][0];
  };
  return (
    jl(halus(titik.map(([x, y]) => [x + 2, y + 1] as T2)), garis(S.jasBayang, 2.2, 0.35)) +
    jl(halus(titik), garis(GARIS.warna, 1)) +
    kancingY.map((y, i) => kancing(xPada(y) - 3, y, i === 0 ? 3.5 : 3.8)).join('')
  );
}

// LENGAN & TANGAN (putaran 2): lengan dibangun dari SENDI bahu → siku → pergelangan dengan lebar meruncing (lengan atas
// : lengan bawah ± 1 : 0,9 panjang sebenarnya; yang tampak lebih pendek = memendek ke arah kamera), siku yang benar-benar
// menekuk (titik siku membulat di sisi luar, lipatan kain di sisi dalam), manset putih TIPIS, lalu tangan dari bentuk
// lokal (pergelangan di (0,0), jari ke +x) yang diputar & diletakkan di ujung manset. Jari terbaca: garis antarjari,
// buku jari, kuku merah.

/** Sendi lengan (kanvas) + lebar penuh [bahu, lengan atas tengah, siku, lengan bawah tengah, pergelangan]. */
interface Sendi {
  bahu: T2;
  siku: T2;
  pergelangan: T2;
  lebar: [number, number, number, number, number];
}

const arahSatuan = (a: T2, b: T2): T2 => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
};
const normalOf = (u: T2): T2 => [-u[1], u[0]];
const maju = (p: T2, u: T2, s: number): T2 => [p[0] + u[0] * s, p[1] + u[1] * s];

interface RangkaLengan {
  /** Sisi +n dan −n (bahu → pergelangan); siku luar punya 3 titik, lipatan dalam 1 titik. */
  a: T2[];
  b: T2[];
  u1: T2;
  u2: T2;
  n2: T2;
  /** Titik lipatan dalam siku (null bila lengan hampir lurus). */
  lipat: T2 | null;
  /** Tekukan tajam (> ± 115°): digambar dua bagian bertumpuk (lengan bawah menutupi ujung lengan atas). */
  tajam: boolean;
}

function rangkaLengan(s: Sendi): RangkaLengan {
  const u1 = arahSatuan(s.bahu, s.siku), u2 = arahSatuan(s.siku, s.pergelangan);
  const n1 = normalOf(u1), n2 = normalOf(u2);
  const silang = u1[0] * u2[1] - u1[1] * u2[0];
  const sejajar = u1[0] * u2[0] + u1[1] * u2[1];
  let nb: T2 = [n1[0] + n2[0], n1[1] + n2[1]];
  const Lb = Math.hypot(nb[0], nb[1]) || 1;
  nb = [nb[0] / Lb, nb[1] / Lb];
  const miter = Math.max(0.42, nb[0] * n1[0] + nb[1] * n1[1]);
  const [wB, wA, wS, wL, wP] = s.lebar;
  const tA = lerp2(s.bahu, s.siku, 0.5), tL = lerp2(s.siku, s.pergelangan, 0.5);
  const lurus = Math.abs(silang) < 0.08 && sejajar > 0;
  const sisi = (g: 1 | -1): T2[] => {
    const dalam = g * silang > 0;
    const siku: T2[] = lurus
      ? [maju(s.siku, nb, (g * wS) / 2)]
      : dalam
        ? [maju(s.siku, nb, ((g * wS) / 2 / miter) * 0.9)]
        : [maju(s.siku, n1, (g * wS) / 2), maju(s.siku, nb, ((g * wS) / 2) * 1.1), maju(s.siku, n2, (g * wS) / 2)];
    return [maju(s.bahu, n1, (g * wB) / 2), maju(tA, n1, (g * wA) / 2), ...siku, maju(tL, n2, (g * wL) / 2), maju(s.pergelangan, n2, (g * wP) / 2)];
  };
  const tanda = silang > 0 ? 1 : -1;
  return {
    a: sisi(1),
    b: sisi(-1),
    u1,
    u2,
    n2,
    lipat: lurus ? null : maju(s.siku, nb, ((tanda * wS) / 2 / miter) * 0.9),
    tajam: sejajar < -0.42,
  };
}

interface OpsiLengan {
  lg: number;
  /** Isi kain (url gradien lengan dengan awalan pemanggil). */
  kain: string;
  /** 'penuh' = bahu → pergelangan; 'bawah' = dari atas siku (lapisan meja; tanpa garis potong di atas). */
  bagian: 'penuh' | 'bawah';
  /** Sisi tiga kancing kecil dekat manset (+1/−1 = sisi a/b), 0 = tanpa. */
  kancing?: 1 | -1 | 0;
  kecil: boolean;
}

/** Lengan jas (lengan atas + siku + lengan bawah) + manset tipis. Mengembalikan SVG & pangkal tangan (ujung manset). */
function gambarLengan(s: Sendi, o: OpsiLengan): { svg: string; pangkal: T2; arah: T2 } {
  const R = rangkaLengan(s);
  const out: string[] = [];
  const tp = `stroke="${GARIS.warna}" stroke-width="${f(o.lg)}" stroke-linejoin="round"`;
  const tutupBahu = maju(s.bahu, R.u1, -s.lebar[0] * 0.34);
  // bagian bawah: mulai sedikit di atas siku (menumpuk tepat di atas gambar lengan utama)
  const mulai = (p: T2[]): T2[] => (o.bagian === 'penuh' ? p : [lerp2(p[1], p[2], 0.55), ...p.slice(2)]);
  const bayang = (tebal: number): T2[][] => {
    // sisi yang membelakangi cahaya (kanan-bawah): pita bayang; sisi terang: pita sorot
    const g = R.n2[0] * CAHAYA[0] + R.n2[1] * CAHAYA[1] < 0 ? 1 : -1;
    const tepiG = mulai(g === 1 ? R.a : R.b);
    const lawanG = mulai(g === 1 ? R.b : R.a);
    const n = Math.min(tepiG.length, lawanG.length);
    const dalamG: T2[] = [];
    for (let i = 0; i < n; i++) {
      const p = tepiG[Math.round((i * (tepiG.length - 1)) / (n - 1))];
      const q = lawanG[Math.round((i * (lawanG.length - 1)) / (n - 1))];
      dalamG.push(lerp2(p, q, tebal));
    }
    return [tepiG, dalamG];
  };
  /** Isi kain lengan; bagian 'bawah' tanpa garis di tepi potong atas (tidak ada garis melintang di lengan atas). */
  const bagianLengan = (a: T2[], b: T2[]): void => {
    const A = mulai(a), B = mulai(b);
    if (o.bagian === 'penuh') {
      out.push(jl(rangkai([A, [A[A.length - 1], B[B.length - 1]], [...B].reverse(), [B[0], tutupBahu, A[0]]]), `fill="${o.kain}" ${tp}`));
    } else {
      out.push(jl(rangkai([A, [A[A.length - 1], B[B.length - 1]], [...B].reverse()]), `fill="${o.kain}"`));
      out.push(jl(halus(A) + halus(B) + halus([A[A.length - 1], B[B.length - 1]]), garis(GARIS.warna, o.lg)));
    }
  };
  if (R.tajam && o.bagian === 'penuh') {
    // Tekukan tajam (telepon): lengan atas bulat di ujung siku, lengan bawah ditumpuk di atasnya.
    const [wB, wA, wS, wL, wP] = s.lebar;
    const n1 = normalOf(R.u1);
    const atas: T2[] = [maju(s.bahu, n1, wB / 2), maju(lerp2(s.bahu, s.siku, 0.5), n1, wA / 2), maju(s.siku, n1, wS / 2), maju(s.siku, R.u1, wS * 0.45), maju(s.siku, n1, -wS / 2), maju(lerp2(s.bahu, s.siku, 0.5), n1, -wA / 2), maju(s.bahu, n1, -wB / 2), tutupBahu];
    out.push(tutup(atas, `fill="${o.kain}" ${tp}`, 0.14));
    out.push(bentuk([maju(s.siku, n1, wS * 0.1), maju(s.siku, R.u1, wS * 0.4), maju(s.siku, n1, -wS / 2), maju(lerp2(s.bahu, s.siku, 0.6), n1, -wA / 2)], S.jasBayang, 0.3));
    const pangkalB = maju(s.siku, R.u2, wS * 0.1);
    const bawah: T2[] = [maju(pangkalB, R.n2, wS / 2), maju(lerp2(s.siku, s.pergelangan, 0.5), R.n2, wL / 2), maju(s.pergelangan, R.n2, wP / 2), maju(s.pergelangan, R.n2, -wP / 2), maju(lerp2(s.siku, s.pergelangan, 0.5), R.n2, -wL / 2), maju(pangkalB, R.n2, -wS / 2), maju(pangkalB, R.u2, -wS * 0.5)];
    out.push(jl(rangkai([bawah.slice(0, 3), [bawah[2], bawah[3]], [...bawah.slice(3), bawah[0]]]), `fill="${o.kain}" ${tp}`));
    const g = R.n2[0] * CAHAYA[0] + R.n2[1] * CAHAYA[1] < 0 ? 1 : -1;
    out.push(bentuk([maju(pangkalB, R.n2, (g * wS) / 2), maju(lerp2(s.siku, s.pergelangan, 0.5), R.n2, (g * wL) / 2), maju(s.pergelangan, R.n2, (g * wP) / 2), maju(s.pergelangan, R.n2, g * wP * 0.12), maju(lerp2(s.siku, s.pergelangan, 0.5), R.n2, g * wL * 0.1)], S.jasBayang, 0.28));
    if (!o.kecil) {
      // lipatan kain di siku (lengan bawah menekan lengan atas)
      const c = maju(pangkalB, R.u2, 4);
      out.push(jl(halus([maju(c, R.n2, -wS * 0.35), maju(c, R.u2, 7), maju(c, R.n2, wS * 0.2)]) + halus([maju(c, R.u2, 12), maju(maju(c, R.u2, 16), R.n2, -wS * 0.15)]), garis(S.jasBayang, 1, 0.5)));
    }
  } else {
    bagianLengan(R.a, R.b);
    const [tepiG, dalamG] = bayang(0.36);
    out.push(jl(halus([...tepiG, ...[...dalamG].reverse()], true, 0.14), isi(S.jasBayang, 0.26)));
    const [tepiT, dalamT] = ((): T2[][] => {
      const g = R.n2[0] * CAHAYA[0] + R.n2[1] * CAHAYA[1] < 0 ? -1 : 1;
      const t = mulai(g === 1 ? R.a : R.b), l = mulai(g === 1 ? R.b : R.a);
      const n = Math.min(t.length, l.length);
      const d: T2[] = [];
      for (let i = 0; i < n; i++) d.push(lerp2(t[Math.round((i * (t.length - 1)) / (n - 1))], l[Math.round((i * (l.length - 1)) / (n - 1))], 0.22));
      return [t.map((p, i) => lerp2(p, l[Math.min(i, l.length - 1)], 0.06)), d];
    })();
    out.push(jl(halus([...tepiT, ...[...dalamT].reverse()], true, 0.14), isi('#fff4d6', 0.26)));
    if (R.lipat && !o.kecil) {
      // lipatan kain di sisi dalam siku: tiga garis pendek menyebar dari lipatan
      const c = R.lipat;
      out.push(
        jl(
          halus([maju(c, R.u1, -10), maju(lerp2(c, s.siku, 0.3), R.u1, -7), maju(lerp2(c, s.siku, 0.55), R.u1, -2)]) +
            halus([maju(c, R.u2, 6), maju(lerp2(c, s.siku, 0.35), R.u2, 5), maju(lerp2(c, s.siku, 0.6), R.u2, 1)]) +
            halus([maju(c, R.u2, 16), maju(lerp2(c, s.siku, 0.3), R.u2, 14)]),
          garis(S.jasBayang, 1, 0.42),
        ),
      );
    }
  }
  // manset putih tipis (kemeja di bawah jas) + tiga kancing lengan
  const wP = s.lebar[4];
  const ujung = maju(s.pergelangan, R.u2, 5.2);
  const manset: T2[] = [maju(s.pergelangan, R.n2, wP * 0.44), maju(ujung, R.n2, wP * 0.41), maju(ujung, R.n2, -wP * 0.41), maju(s.pergelangan, R.n2, -wP * 0.44)];
  out.push(jl(`M${pt(manset[0])}L${pt(manset[1])}L${pt(manset[2])}L${pt(manset[3])}Z`, `fill="${S.putih}" stroke="${GARIS.warna}" stroke-width="${f(o.lg * 0.8)}" stroke-linejoin="round"`));
  const gB = R.n2[0] * CAHAYA[0] + R.n2[1] * CAHAYA[1] < 0 ? 1 : -1;
  out.push(jl(`M${pt(maju(s.pergelangan, R.n2, gB * wP * 0.44))}L${pt(maju(ujung, R.n2, gB * wP * 0.41))}L${pt(ujung)}L${pt(s.pergelangan)}Z`, isi(S.putihBayang, 0.35)));
  if (o.kancing && !o.kecil) {
    for (const t of [5, 9.5, 14]) {
      const p = maju(maju(s.pergelangan, R.u2, -t), R.n2, o.kancing * (wP / 2 - 3.4));
      out.push(kancingKecil(p[0], p[1]));
    }
  }
  return { svg: out.join(''), pangkal: maju(s.pergelangan, R.u2, 4.4), arah: R.u2 };
}

/** Bentuk tangan lokal: pergelangan di (0,0), jari ke +x; sisi −y = sisi ibu jari. */
interface BentukTangan {
  garis: T2[];
  ibu?: T2[];
  /** Garis antarjari / lipatan (terbuka). */
  jari: T2[][];
  /** Kuku: [x, y, sudut, lebar, tinggi]. */
  kuku: [number, number, number, number, number][];
  /** Sorot buku jari / bayang bawah (tertutup). */
  sorot?: T2[][];
  bayang?: T2[][];
  /** Titik pegangan prop (lokal). */
  pegang: T2;
}

/** Punggung tangan rebah di meja: jari rapat, ujung jari bertingkat, ibu jari di sisi atas, kuku merah tampak. */
const TANGAN_REBAH: BentukTangan = {
  garis: [[0, -10.4], [10, -11.4], [20, -11.6], [30, -10.6], [42, -9.2], [52, -8.4], [56.4, -8.2], [58.6, -6.4], [58.4, -4.4], [60.8, -4], [62.2, -1.8], [61.4, 0.6], [60.6, 1.6], [60.4, 3.6], [58.6, 5.4], [55.4, 5.8], [55, 7.8], [52.8, 9.2], [47, 9.4], [38, 10], [28, 10.8], [18, 11.2], [8, 11], [0, 10.4]],
  ibu: [[4, -10.2], [13, -14.4], [23, -16.4], [31.6, -16.6], [36.4, -15], [35.8, -12.6], [30, -11.6], [20, -10.8], [10, -10]],
  jari: [[[30, -5.8], [42, -4.8], [53, -4.4], [58, -4.2]], [[31, -1], [44, 0], [55, 0.9], [60.2, 1.4]], [[30, 3.8], [42, 4.6], [51, 5.4], [55, 5.8]]],
  kuku: [[55.4, -6.4, 4, 3.8, 2.7], [59.8, -1.9, 4, 3.8, 2.7], [58.6, 2.8, 6, 3.6, 2.6], [53.4, 7.4, 10, 3.2, 2.3], [34.2, -15.2, 4, 3.4, 2.4]],
  sorot: [[[24, -9], [30, -9.6], [34, -8], [28, -7.2]], [[26, -3.6], [32, -4.4], [36, -2.8], [30, -2]], [[26, 1.4], [31, 0.6], [35, 2.2], [29.4, 3]]],
  bayang: [[[4, 8.2], [20, 8.6], [36, 7.8], [50, 7.4], [53, 9], [40, 10], [20, 11.2], [4, 10.8]]],
  pegang: [34, 0],
};

/** Telunjuk lurus menunjuk; jari lain menggenggam ringan (lengkung bertingkat), ibu jari di atas jari tengah. */
const TANGAN_TUNJUK: BentukTangan = {
  garis: [[0, -10], [10, -11], [21, -11.4], [28, -10.6], [38, -9.4], [50, -8.4], [60, -7.6], [65.6, -7.2], [67.6, -5.4], [66.8, -3.6], [61, -3], [50, -3.4], [40, -3.4], [35, -2.8], [39, 0], [41, 4], [39.8, 8], [35, 10.8], [27, 11.8], [16, 11.6], [7, 11], [0, 10]],
  ibu: [[6, -10.2], [15, -13.8], [25, -14.6], [31.8, -12.6], [31.6, -9.4], [25, -9.4], [14, -9.2]],
  jari: [[[33, -2.6], [36, 1], [35, 4.8]], [[30.4, 2], [33, 5.4], [30.6, 8.8]], [[27.6, 6.8], [29, 9.4], [27, 11.2]]],
  kuku: [[64.6, -6.3, 2, 3.6, 2.5], [29.8, -12.6, -8, 3.2, 2.3]],
  sorot: [[[23, -8.6], [29, -9.2], [33, -7.8], [27, -7]], [[40, -8.2], [54, -7.2], [62, -6.6], [54, -6], [40, -6.8]]],
  bayang: [[[6, 8.6], [20, 9], [32, 8.4], [37, 9.2], [26, 11.4], [6, 10.6]]],
  pegang: [66, -5.2],
};

/** Telapak terbuka (menghadap atas/depan), jari sedikit merenggang, ibu jari terbuka. */
const TANGAN_TERBUKA: BentukTangan = {
  garis: [[0, -10], [12, -11.4], [23, -12.6], [36, -14], [46.6, -14.4], [51.4, -12.8], [50, -10.6], [38, -9.8], [29, -8.6], [41, -7.6], [52, -7], [56.6, -5], [55.2, -3], [42, -3], [29.4, -3.2], [41, -1.4], [51.8, 0.6], [54.8, 2.8], [52.6, 4.6], [40, 3.8], [29, 3], [38, 5.8], [45.4, 8.4], [47, 10.2], [44.6, 11.6], [35, 10], [24, 10.6], [12, 10.8], [0, 10]],
  ibu: [[2, -9.4], [9, -14.4], [16.6, -20], [22.4, -23.6], [25.8, -22.4], [24.4, -18.6], [18.6, -13.4], [12, -9.6]],
  jari: [[[9, -4.6], [17, -6.8], [26, -6.6]], [[9, 1.6], [17, 0], [26.4, -1.6]]],
  kuku: [],
  sorot: [[[6, -6], [18, -8], [26, -4], [20, 4], [8, 4]]],
  bayang: [[[2, 7.4], [16, 7.6], [26, 7], [34, 8.6], [24, 10.4], [4, 10]]],
  pegang: [24, -1],
};

/** Genggaman gagang telepon: punggung tangan + empat jari melingkar (kuku di ujung, di sisi pipi). */
const TANGAN_GENGGAM: BentukTangan = {
  garis: [[0, -9.4], [10, -10.8], [20, -11.4], [28, -11], [36, -9.4], [41.6, -6.4], [44, -2], [43.6, 3.4], [41, 7.8], [35.4, 10.6], [26, 11.4], [16, 11], [7, 10.4], [0, 9.4]],
  jari: [[[26, -5.6], [34, -5.4], [42.4, -4.6]], [[27, -0.4], [35, -0.2], [43.8, 0.4]], [[26, 4.8], [34, 5.2], [42.4, 5.6]]],
  kuku: [[41.6, -7.2, 30, 3, 2.3], [43.8, -2.4, 10, 3, 2.3], [43.6, 2.8, -6, 3, 2.3], [41, 7.8, -30, 2.8, 2.1]],
  sorot: [[[24, -8.6], [29, -9.4], [33, -7.6], [28, -6.8]], [[26, -3.2], [31, -3.8], [34, -2], [29, -1.4]], [[26, 1.8], [31, 1.2], [34, 3], [29, 3.6]]],
  bayang: [[[4, 7.8], [20, 8.4], [34, 8], [40, 8.4], [30, 11], [6, 10.2]]],
  pegang: [34, 0],
};

/**
 * Skala tangan [panjang, lebar] per sudut pandang: bentuk lokal ± 62 × 22 satuan; punggung tangan dewasa ± 0,45 × panjang
 * lebarnya, jadi lebar diperbesar lebih banyak. Telapak menghadap atas dilihat miring → lebar dipipihkan.
 */
const SKALA_TANGAN = {
  rebah: [1.12, 1.36],
  tunjuk: [1.12, 1.3],
  telapakAtas: [1.16, 0.92],
  telapak: [1.12, 1.24],
  genggam: [1.18, 1.34],
} as const;
const letak = (di: T2, sudut: number, skala: readonly [number, number], cermin = false): LetakTangan => ({ di, sudut, sx: skala[0], sy: skala[1], cermin });

interface LetakTangan {
  /** Pangkal (pergelangan) di kanvas. */
  di: T2;
  /** Sudut arah jari (derajat, 0 = kanan, + = searah jarum jam). */
  sudut: number;
  /** Skala panjang & lebar (lebar < panjang = telapak dilihat miring). */
  sx: number;
  sy: number;
  /** Cerminkan sisi ibu jari (tangan kiri / terbalik). */
  cermin?: boolean;
}

/** Titik lokal tangan → kanvas. */
function keKanvas(L: LetakTangan, p: T2): T2 {
  const a = (L.sudut * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const x = p[0] * L.sx, y = p[1] * L.sy * (L.cermin ? -1 : 1);
  return [L.di[0] + x * c - y * s, L.di[1] + x * s + y * c];
}

function gambarTangan(B: BentukTangan, L: LetakTangan, isiKulit: string, lg: number, kecil: boolean): string {
  const k = (ps: T2[]): T2[] => ps.map((p) => keKanvas(L, p));
  const out: string[] = [];
  const tp = `stroke="${GARIS.warna}" stroke-width="${f(lg * 0.85)}" stroke-linejoin="round"`;
  out.push(jl(halus(k(B.garis), true, 0.13), `fill="${isiKulit}" ${tp}`));
  for (const b of B.bayang ?? []) out.push(jl(halus(k(b), true), isi(S.kulitBayang, 0.24)));
  for (const s of B.sorot ?? []) if (!kecil) out.push(jl(halus(k(s), true), isi('#fff1e4', 0.5)));
  if (B.jari.length) out.push(jl(B.jari.map((j) => halus(k(j))).join(''), garis(S.garisDalam, kecil ? 0.9 : 0.62, kecil ? 0.7 : 0.6)));
  if (B.ibu) out.push(jl(halus(k(B.ibu), true, 0.14), `fill="${isiKulit}" ${tp}`));
  for (const [x, y, sd, w, h] of B.kuku) {
    const p = keKanvas(L, [x, y]);
    out.push(kuku(p[0], p[1], L.sudut + (L.cermin ? -sd : sd), w * L.sx, h * Math.abs(L.sy)));
  }
  return out.join('');
}

type LenganBerdiri = 'sembah' | 'persilakan' | 'biasa';

/**
 * Sudut jari telapak jauh mempersilakan (derajat; − = naik). Putaran 4 (ekspor: ujung jari 1 satuan dari tepi kanan
 * kanvas 420): pergelangan ditarik ± 9 satuan ke dalam + telapak sedikit lebih naik → marjin kanan >= 8 satuan.
 */
const SUDUT_TANGAN_PERSILAKAN = -33;

/** Lebar lengan (penuh) berdiri: dekat & jauh (jauh sedikit lebih ramping karena perspektif). */
const LEBAR_DEKAT: Sendi['lebar'] = [36, 31, 29, 27, 24];
const LEBAR_JAUH: Sendi['lebar'] = [32, 28, 26.5, 24.5, 22];

function badanBerdiri(id: string, lengan: LenganBerdiri, kecil: boolean): HasilBadan {
  const b: string[] = [];
  const d: string[] = [];
  const lg = kecil ? LG * GARIS.kaliKecilBadan : LG;
  const tp = (w = lg): string => tepi(w);
  const kain = `url(#${id}-gl)`;
  const kulit = `url(#${id}-gh)`;

  // --- bayangan kontak & kaki (rok & kaki: CADANGAN, tidak ada di referensi) -----------------------------------
  b.push(`<ellipse cx="228" cy="984" rx="66" ry="9" ${isi(BAYANG.kontak, 0.22)}/><ellipse cx="228" cy="984" rx="40" ry="5" ${isi(BAYANG.kontak, 0.22)}/>`);
  b.push(tutup([[222, 792], [222, 844], [229, 900], [234, 938], [245, 938], [252, 892], [258, 842], [256, 792]], `fill="${S.stoking}" ${tp()}`), bentuk([[242, 800], [256, 842], [250, 894], [243, 936], [239, 900], [246, 846]], S.kulitBayang, 0.25));
  b.push(tutup([[233, 934], [231, 960], [234, 975], [252, 978], [277, 980], [281, 973], [270, 962], [250, 946], [246, 934]], `fill="${S.sepatu}" ${tp()}`), `<path d="M233 972L235 986L243 986L241 973Z" fill="${S.sepatu}"/>`);
  b.push(tutup([[182, 792], [177, 840], [182, 898], [191, 946], [206, 946], [212, 898], [216, 840], [214, 792]], `fill="${S.stoking}" ${tp()}`), bentuk([[202, 800], [215, 842], [210, 898], [204, 944], [200, 900], [206, 846]], S.kulitBayang, 0.22));
  b.push(tutup([[191, 944], [188, 968], [190, 983], [214, 987], [238, 988], [242, 981], [232, 970], [214, 956], [207, 944]], `fill="${S.sepatu}" ${tp()}`), `<path d="M189 978L190 992L199 992L199 982Z" fill="${S.sepatu}"/>`);
  b.push(jl(halus([[198, 958], [218, 966], [236, 978]]) + halus([[240, 948], [258, 958], [274, 970]]), garis('#8a6a5a', 1, 0.5)));
  // rok
  b.push(tutup([[166, 494], [166, 560], [170, 680], [176, 798], [218, 808], [264, 802], [272, 682], [278, 570], [286, 500]], `fill="url(#${id}-grok)" ${tp()}`));
  b.push(jl(halus([[236, 690], [235, 760], [234, 804]]), garis('#2a1c16', 1.2, 0.6)), bentuk([[252, 520], [274, 600], [270, 720], [264, 800], [250, 802], [254, 700], [254, 600]], '#20140f', 0.25));

  // --- lengan jauh (di belakang badan; bahu jauh lebih rendah: badan menyerong) --------------------------------
  const jauhSendi: Record<LenganBerdiri, Sendi> = {
    // Putaran 4: siku jauh di sisi luar pinggang atas (sedikit keluar dari siluet badan), lengan bawah NAIK menyerong
    // ke pergelangan tepat di bawah telapak (manset di bawah telapak, kancing di ujung manset). Sendi bahu sedikit ke
    // dalam & turun: sudut luar pangkal lengan jatuh tepat di garis bahu jas (tanpa punuk di atas bahu jauh).
    // Putaran 5 (juri-3: lengan bawah jauh pendek & curam, siku setinggi pinggul): siku 18 satuan lebih tinggi & sedikit
    // keluar, lengan bawah ± 30° (sebelumnya ± 46°) sehingga kedua lengan bawah bertemu telapak hampir sejajar.
    sembah: { bahu: [259, 242], siku: [328, 368], pergelangan: [296, 350], lebar: LEBAR_JAUH },
    persilakan: { bahu: [266, 228], siku: [317, 352], pergelangan: [350, 319], lebar: LEBAR_JAUH },
    biasa: { bahu: [266, 226], siku: [298, 382], pergelangan: [280, 404], lebar: LEBAR_JAUH },
  };
  const js = jauhSendi[lengan];
  if (lengan === 'persilakan') {
    // lengan jauh terentang ke kanan-depan, telapak terbuka menghadap atas ke kursi (pose rsc-persilakan dicerminkan)
    const L = gambarLengan(js, { lg, kain, bagian: 'penuh', kancing: 1, kecil });
    b.push(L.svg);
    b.push(gambarTangan(TANGAN_TERBUKA, letak(L.pangkal, SUDUT_TANGAN_PERSILAKAN, SKALA_TANGAN.telapakAtas), kulit, lg, kecil));
  } else if (lengan === 'sembah') {
    // Lengan jauh UTUH dari sendi (putaran 4; juri: potongan lengan "menggantung" di bawah telapak): bahu → lengan atas
    // turun di sisi jauh → siku menekuk tajam di luar siluet pinggang → lengan bawah naik ke manset di bawah telapak.
    // Di lapis belakang: badan menutup pangkal lengan atas, tangan jauh (lapis depan) menutup ujung manset.
    b.push(gambarLengan(js, { lg, kain, bagian: 'penuh', kancing: -1, kecil }).svg);
  } else {
    // lengan atas jauh saja (lengan bawah & tangan jauh di depan dada/perut, digambar di lapis depan)
    b.push(tutup([[256, 216], [274, 225], [288, 241], [298, 268], [304, 310], [308, 352], [306, 380], [292, 384], [286, 350], [284, 300], [278, 258], [266, 230]], `fill="${kain}" ${tp()}`));
    b.push(bentuk([[292, 250], [302, 300], [306, 350], [302, 378], [296, 330]], S.jasBayang, 0.3));
  }

  // --- jas: garis leher mengikuti kerah yang memeluk leher; bahu dekat lebar, bahu jauh turun --------------------
  // Putaran 3 (juri: tunik kotak lurus): jas PAS badan — pinggang (y ± 425) ± 8 % lebih ramping lalu melebar
  // lagi ke panggul, puncak bahu luar turun ± 3 satuan (bahu miring, tidak persegi).
  const badan: T2[] = [
    [173, 190], [160, 195], [148, 204.5], [138, 217], [132.4, 236.5], [133, 263], [138, 292], [150, 332], [164, 380], [171, 425], [167, 468], [162, 509],
    [200, 516], [240, 518], [276, 513], [298, 505], [291, 470], [280, 430], [280, 380], [282, 330], [281, 290], [278, 259], [272, 239],
    [264, 224], [250, 213], [236, 205], [226, 204], [216, 205], [200, 200], [186, 195],
  ];
  b.push(tutup(badan, `fill="url(#${id}-gj)" ${tp()}`, 0.14));
  b.push(
    bentuk([[252, 224], [270, 240], [279, 300], [279, 380], [276, 430], [289, 470], [294, 504], [270, 512], [268, 440], [264, 360], [260, 280]], S.jasBayang, 0.2),
    bentuk([[168, 300], [200, 316], [236, 320], [256, 328], [256, 340], [216, 338], [180, 330]], S.jasBayang, 0.1),
    bentuk([[174, 412], [210, 418], [256, 420], [277, 424], [276, 440], [240, 436], [196, 434], [174, 430]], S.jasBayang, 0.14),
    bentuk([[150, 216], [178, 208], [200, 220], [204, 262], [190, 290], [164, 290], [150, 262]], '#fff6dc', 0.34),
    jl(halus([[262, 224], [260, 262], [263, 330], [266, 420]]) + halus([[262, 392], [272, 404], [278, 424]]) + halus([[266, 412], [276, 428], [286, 454]]), garis(S.jasBayang, 0.95, 0.42)),
    jl(halus([[176, 420], [196, 425], [214, 427]]), garis(S.jasBayang, 1, 0.4)),
  );
  // saku berpenutup (panel jauh)
  b.push(jl('M244 454L272 451L273 458L245 461Z', `fill="#f2c677" ${tp(lg * 0.8)}`), jl('M245 461L273 458', garis(S.jasBayang, 1.3, 0.4)));
  // bukaan depan: dari celah kerah menyerong ke kanan pemakai (kiri gambar), lalu turun
  b.push(bukaanDepan([[218.4, 205], [208, 222], [196, 245], [187, 270], [183, 300], [185, 350], [189, 400], [193, 460], [196, 516]], [214, 242, 274, 310, 352, 398, 448]));
  // lencana + pin di dada KIRI pemakai (kanan gambar, bidang dada jauh)
  b.push(lencana(222, 246, -4));

  // --- lengan depan & tangan -------------------------------------------------------------------------------------
  let tangan: { kiri?: T2; kanan?: T2 } = {};
  const tanganIsi = `fill="${kulit}" ${tp(lg * 0.85)}`;
  if (lengan === 'sembah') {
    // tangan jauh (sedikit bergeser ke kanan-atas: ujung jari & kuku tampak di balik jari tangan dekat)
    d.push(tutup([[284, 352], [293, 348], [297, 322], [298.5, 296], [297, 274], [294, 259], [289.4, 252.6], [285.6, 257], [284.4, 300], [282.6, 340]], tanganIsi));
    d.push(bentuk([[290, 260], [296, 276], [297, 300], [296, 330], [291.6, 346], [290.6, 300]], S.kulitBayang, 0.22));
    d.push(kuku(292.6, 256.8, 14, 2.7, 4.4), kuku(295.8, 266.6, 10, 2.5, 4.2), kuku(297.6, 279.4, 6, 2.4, 4));
    // lengan dekat: siku di pinggang, lengan bawah datar ke depan dada, manset tipis tegak
    const L = gambarLengan({ bahu: [148, 222], siku: [150, 362], pergelangan: [244, 336], lebar: [34, 33, 32, 31, 30] }, { lg, kain, bagian: 'penuh', kancing: -1, kecil });
    d.push(L.svg);
    // tangan dekat: telapak menempel, jari rapat; garis antarjari, buku jari, kuku merah pendek
    d.push(tutup([[251, 347], [249.4, 330], [251, 312], [254.6, 298], [257.6, 280], [260.6, 264], [263.6, 255], [267.6, 250.4], [272, 248.2], [276.4, 247.6], [280, 249.6], [283, 253.6], [285.4, 259], [287.2, 266.4], [287.4, 276], [286, 292], [284.8, 310], [282.2, 328], [276.6, 342], [266, 348.5]], tanganIsi, 0.15));
    d.push(
      jl(halus([[262.4, 300], [264.6, 280], [267.6, 262], [270, 254]]) + halus([[270, 302], [272.4, 282], [275.2, 264], [277.4, 253]]) + halus([[277.6, 304], [279.6, 286], [282, 270], [284, 261]]), garis(S.garisDalam, kecil ? 0.9 : 0.6, 0.55)),
      jl(halus([[257, 304], [265, 300.5], [273, 301.5], [282, 305]]), garis(S.garisDalam, 0.55, 0.32)),
      bentuk([[275, 262], [285, 262], [287, 290], [284, 326], [276, 342], [273, 320], [276, 290]], S.kulitBayang, 0.16),
      bentuk([[254, 300], [259, 272], [264, 257], [261, 280], [257, 304]], '#fff1e4', 0.45),
    );
    d.push(kuku(266.6, 253.2, 16, 3.1, 4.4), kuku(274, 250.2, 10, 3.2, 4.6), kuku(281.2, 253.4, 18, 3, 4.4), kuku(285.8, 262.8, 16, 2.7, 4));
    // ibu jari di tepi kiri (menghadap dada)
    d.push(tutup([[249.4, 332], [248.2, 314], [249.4, 298], [251.8, 290.6], [255, 290], [256.6, 296], [255.8, 312], [255, 328]], tanganIsi), kuku(253.2, 293.4, 4, 3, 4.2));
    tangan = { kiri: [268, 300], kanan: [290, 300] };
    // bayang telapak di dada (hanya di bidang jas, tidak menggelapkan lengan jauh di luar siluet)
    b.push(bentuk([[276, 300], [281, 320], [281, 362], [272, 372], [258, 360]], S.jasTua, 0.14));
  } else if (lengan === 'persilakan') {
    // Mempersilakan duduk (pose rsc-persilakan dicerminkan; orang lain, hanya pose): lengan bawah dekat menyeberang
    // di depan pinggang, telapak terbuka menghadap atas ke arah kursi (kanan); lengan jauh terentang (lapis belakang).
    const L = gambarLengan({ bahu: [148, 222], siku: [156, 386], pergelangan: [246, 392], lebar: LEBAR_DEKAT }, { lg, kain, bagian: 'penuh', kancing: 1, kecil });
    d.push(L.svg);
    const T = letak(L.pangkal, -4, SKALA_TANGAN.telapakAtas);
    d.push(gambarTangan(TANGAN_TERBUKA, T, kulit, lg, kecil));
    const TJ = letak(maju(js.pergelangan, arahSatuan(js.siku, js.pergelangan), 4.4), SUDUT_TANGAN_PERSILAKAN, SKALA_TANGAN.telapakAtas);
    tangan = { kiri: keKanvas(T, TANGAN_TERBUKA.pegang), kanan: keKanvas(TJ, TANGAN_TERBUKA.pegang) };
  } else {
    // berdiri biasa: kedua tangan bertaut di depan perut (tangan dekat di atas, jari terkulai ke kanan-bawah)
    const Lj = gambarLengan(js, { lg, kain, bagian: 'bawah', kecil });
    const TJ = letak(Lj.pangkal, 160, [1.02, 1.24], true);
    d.push(Lj.svg, gambarTangan(TANGAN_REBAH, TJ, kulit, lg, kecil));
    const L = gambarLengan({ bahu: [148, 222], siku: [156, 386], pergelangan: [236, 404], lebar: LEBAR_DEKAT }, { lg, kain, bagian: 'penuh', kancing: 1, kecil });
    d.push(L.svg);
    const T = letak(L.pangkal, 20, [1.06, 1.3]);
    d.push(gambarTangan(TANGAN_REBAH, T, kulit, lg, kecil));
    tangan = { kiri: keKanvas(T, TANGAN_REBAH.pegang), kanan: keKanvas(TJ, TANGAN_REBAH.pegang) };
  }
  return { belakang: b.join(''), kerah: kerah(0, 0, lg), depan: d.join(''), defs: defsSeragam(id), kepala: [210, 120], tangan };
}

type LenganDuduk = 'dengar' | 'jelaskan' | 'tunjuk' | 'telepon';

/** Gagang telepon (bagian pose `telepon`; panggung tidak menggambarnya): telinga dekat → depan dagu. */
const GAGANG: { titik: T2[]; tebal: number[] } = {
  titik: [[184.6, 143], [188.6, 152], [196, 166], [205, 180.6], [213.6, 194.4], [221, 206], [226.4, 215]],
  tebal: [13.6, 12.4, 9.4, 8.8, 9.2, 12, 13.2],
};

/** POSE DUDUK: badan berdiri yang sama digeser (+20, +30), lebih menyerong ke kanan; lengan bawah di meja (siku 423). */
function badanDuduk(id: string, lengan: LenganDuduk, kecil: boolean): HasilBadan {
  const b: string[] = [];
  const lg = kecil ? LG * GARIS.kaliKecilBadan : LG;
  const tp = (w = lg): string => tepi(w);
  const DX = 20, DY = 30;
  const g = (p: T2[]): T2[] => geser(p, DX, DY);

  // --- kaki & rok (di balik meja; tetap digambar supaya siluet utuh bila meja tidak menutup) -----------------------
  // Putaran 4 (ekspor: satu betis tipis pada sprite duduk tanpa meja): DUA betis + dua sepatu. Lutut rapat ke kanan-depan
  // (badan menyerong ke kanan): betis jauh sedikit ke kanan & lebih tinggi (lebih jauh dari kamera, lebih gelap), betis
  // dekat di depannya; betis membulat di sisi belakang (kiri), tulang kering lurus di depan. Rok pensil berakhir di lutut.
  b.push(`<ellipse cx="262" cy="884" rx="80" ry="10" ${isi(BAYANG.kontak, 0.2)}/><ellipse cx="340" cy="884" rx="34" ry="5" ${isi(BAYANG.kontak, 0.22)}/>`);
  // betis & sepatu jauh
  b.push(
    tutup([[331, 604], [327, 650], [330, 720], [335, 800], [338, 846], [350, 848], [353, 800], [358, 722], [362, 652], [362, 618], [354, 600]], `fill="${S.stoking}" ${tp()}`),
    bentuk([[331, 606], [327, 650], [330, 720], [335, 800], [338, 846], [350, 848], [353, 800], [358, 722], [362, 652], [362, 618], [354, 600]], S.kulitBayang, 0.3),
    tutup([[337, 840], [334, 860], [338, 868], [366, 873], [381, 870], [378, 861], [360, 851], [351, 842]], `fill="${S.sepatu}" ${tp()}`),
    `<path d="M335 860L336 874L343 874L343 864Z" fill="${S.sepatu}"/>`,
  );
  // betis & sepatu dekat
  b.push(
    tutup([[305, 606], [300, 652], [303, 722], [308, 800], [312, 854], [326, 856], [330, 800], [336, 722], [341, 654], [341, 620], [332, 606]], `fill="${S.stoking}" ${tp()}`),
    bentuk([[331, 624], [340, 654], [335, 722], [329, 800], [324, 852], [321, 800], [326, 722], [331, 660]], S.kulitBayang, 0.24),
    bentuk([[306, 640], [310, 700], [313, 780], [309, 780], [304, 700]], '#fff1e4', 0.3),
    tutup([[311, 848], [308, 870], [312, 880], [344, 886], [359, 883], [356, 873], [336, 859], [327, 848]], `fill="${S.sepatu}" ${tp()}`),
    `<path d="M309 870L310 889L318 889L318 876Z" fill="${S.sepatu}"/>`,
    jl(halus([[318, 866], [336, 874], [352, 880]]), garis('#8a6a5a', 1, 0.5)),
  );
  // rok (paha ke lutut): ujung rok menutup pangkal kedua betis; garis paha dekat memisahkan dua paha
  b.push(tutup([[176, 520], [182, 574], [240, 598], [300, 612], [326, 618], [348, 613], [360, 598], [356, 572], [300, 540], [250, 520]], `fill="url(#${id}-grok)" ${tp()}`));
  b.push(
    jl(halus([[244, 566], [296, 580], [336, 590], [356, 594]]), garis('#2a1c16', 1.1, 0.45)),
    bentuk([[190, 574], [240, 592], [300, 606], [326, 612], [348, 608], [330, 604], [300, 598], [240, 584]], '#20140f', 0.25),
  );

  // --- sendi lengan per pose (kanvas duduk). Siku di/dekat tepi jauh meja (GARIS_SIKU) kecuali telepon. -------------
  // Putaran 3: lengan atas dekat miring ± 14° (sebelumnya ± 5°) — siku menjauh dari badan, tidak terbaca sebagai tiang.
  const SENDI: Record<LenganDuduk, { dekat: Sendi; jauh: Sendi }> = {
    dengar: {
      dekat: { bahu: [168, 254], siku: [131, 408], pergelangan: [238, 446], lebar: [36, 31, 29.5, 28, 25] },
      jauh: { bahu: [286, 258], siku: [324, 404], pergelangan: [300, 444], lebar: [32, 28, 27, 27, 26] },
    },
    tunjuk: {
      dekat: { bahu: [168, 254], siku: [133, 408], pergelangan: [274, 440], lebar: [36, 31, 29.5, 28, 25] },
      jauh: { bahu: [286, 258], siku: [318, 402], pergelangan: [292, 486], lebar: [32, 28, 27, 27, 26] },
    },
    jelaskan: {
      dekat: { bahu: [168, 254], siku: [131, 408], pergelangan: [236, 448], lebar: [36, 31, 29.5, 28, 25] },
      jauh: { bahu: [286, 258], siku: [326, 410], pergelangan: [372, 362], lebar: [32, 28, 27, 26, 24] },
    },
    telepon: {
      dekat: { bahu: [168, 250], siku: [142, 344], pergelangan: [174, 214], lebar: [36, 31, 29.5, 28, 24] },
      jauh: { bahu: [286, 258], siku: [318, 404], pergelangan: [296, 446], lebar: [32, 28, 27, 27, 26] },
    },
  };
  const sd = SENDI[lengan];

  // --- lengan jauh atas (di belakang badan) -----------------------------------------------------------------------
  b.push(tutup([sd.jauh.bahu, [300, 272], [312, 320], [sd.jauh.siku[0] + 14, sd.jauh.siku[1] - 6], [sd.jauh.siku[0] + 4, sd.jauh.siku[1] + 10], [sd.jauh.siku[0] - 12, sd.jauh.siku[1] - 4], [292, 320], [282, 280], [270, 248], [264, 236]], `fill="url(#${id}-gl)" ${tp()}`, 0.14), bentuk([[306, 280], [314, 320], [sd.jauh.siku[0] + 12, sd.jauh.siku[1] - 8], [sd.jauh.siku[0] + 4, sd.jauh.siku[1] + 6], [308, 330]], S.jasBayang, 0.3));

  // --- jas (lebih menyerong: sisi jauh dipersempit, pinggang sedikit masuk supaya tidak kotak) ----------------------
  b.push(tutup(g([
    [173, 190], [160, 195], [148, 204.5], [138, 217], [132.4, 236.5], [134, 263], [140, 292], [150, 332], [162, 380], [167, 425], [164, 468], [161, 509],
    [196, 518], [236, 522], [266, 516], [286, 505], [280, 470], [271, 430], [272, 380], [274, 330], [275, 290], [272, 259], [266, 239],
    [258, 224], [248, 213], [236, 205], [226, 204], [216, 205], [200, 200], [186, 195],
  ]), `fill="url(#${id}-gj)" ${tp()}`, 0.14));
  b.push(
    bentuk(g([[248, 224], [264, 240], [271, 300], [270, 380], [268, 430], [278, 470], [284, 504], [262, 514], [262, 440], [256, 360], [254, 280]]), S.jasBayang, 0.2),
    bentuk(g([[150, 214], [178, 208], [200, 220], [204, 262], [190, 290], [164, 290], [150, 262]]), '#fff6dc', 0.34),
    bentuk(g([[168, 412], [206, 418], [250, 420], [276, 424], [276, 440], [236, 436], [192, 434], [168, 430]]), S.jasBayang, 0.14),
    jl(halus(g([[258, 222], [256, 262], [258, 330], [264, 420]])) + halus(g([[260, 392], [272, 404], [280, 424]])), garis(S.jasBayang, 0.95, 0.42)),
  );
  b.push(bukaanDepan(g([[218.4, 205], [208, 222], [197, 245], [189, 270], [185, 300], [187, 350], [191, 400], [195, 460], [198, 518]]), [244, 272, 304, 340, 382, 428, 478]));
  b.push(lencana(240, 277, -5));

  const tangan: { kiri?: T2; kanan?: T2 } = {};
  const kainDari = (idl: string): string => `url(#${idl}-gl)`;
  const kulitDari = (idl: string): string => `url(#${idl}-gh)`;

  // --- lengan dekat (lapis depan): lengan penuh; bagian lengan bawah + tangan diulang di lapisan meja -------------
  const depan: string[] = [];
  if (lengan === 'telepon') {
    // siku terangkat ke depan (lengan atas memendek), lengan bawah naik ke telinga, tangan menggenggam GAGANG
    const L = gambarLengan(sd.dekat, { lg, kain: kainDari(id), bagian: 'penuh', kancing: -1, kecil });
    depan.push(jl(pita(GAGANG.titik, GAGANG.tebal), `fill="#2d2522" ${tp(lg * 0.8)}`));
    if (!kecil) depan.push(jl(halus([[185.4, 147], [190, 157], [197.6, 170], [206, 184]]), garis('#8d817b', 1.3, 0.55)), jl(halus([[217, 204], [222, 212.4]]), garis('#8d817b', 1.1, 0.45)));
    depan.push(L.svg);
    const T = letak(L.pangkal, -34, SKALA_TANGAN.genggam);
    depan.push(gambarTangan(TANGAN_GENGGAM, T, kulitDari(id), lg, kecil));
    tangan.kiri = keKanvas(T, TANGAN_GENGGAM.pegang);
  } else {
    if (lengan === 'tunjuk') {
      // lengan bawah jauh turun ke pangkuan (tertutup meja di panggung)
      depan.push(gambarLengan(sd.jauh, { lg, kain: kainDari(id), bagian: 'bawah', kecil }).svg);
    }
    depan.push(gambarLengan(sd.dekat, { lg, kain: kainDari(id), bagian: 'penuh', kecil }).svg);
  }

  // --- lengan bawah & tangan di meja (lapisan meja): dibangun per awalan id ----------------------------------------
  const meja = (idl: string): string => {
    const m: string[] = [];
    const kain = kainDari(idl), kulit = kulitDari(idl);
    // bayang lengan di meja
    if (lengan !== 'telepon') m.push(bentuk([[140, 428], [230, 458], [262, 470], [300, 486], [330, 494], [344, 488], [300, 478], [256, 462], [180, 436]], '#5a3a22', 0.16));
    // lengan jauh: lengan bawah (dari siku di meja) + tangan. Tunjuk: tangan jauh di pangkuan (di balik meja, lapis
    // badan), supaya telunjuk ke kartu terbaca jelas tanpa tangan lain di dekatnya.
    let lenganJauh = '';
    let tanganJauh = '';
    if (lengan !== 'tunjuk') {
      const LJ = gambarLengan(sd.jauh, { lg, kain, bagian: 'bawah', kancing: lengan === 'jelaskan' ? 1 : 0, kecil });
      let TJ: LetakTangan;
      let bentukJ: BentukTangan;
      if (lengan === 'jelaskan') {
        // siku jauh di meja, lengan bawah terangkat, telapak terbuka menghadap atas-nasabah (menerangkan, bukan melambai)
        TJ = letak(LJ.pangkal, -22, [1.14, 0.98]);
        bentukJ = TANGAN_TERBUKA;
      } else {
        // dengar/telepon: tangan jauh rebah menumpang ringan di atas punggung tangan dekat (bertumpuk)
        TJ = letak(LJ.pangkal, lengan === 'dengar' ? 160 : 158, SKALA_TANGAN.rebah, true);
        bentukJ = TANGAN_REBAH;
      }
      lenganJauh = LJ.svg;
      tanganJauh = gambarTangan(bentukJ, TJ, kulit, lg, kecil);
      tangan.kanan = keKanvas(TJ, bentukJ.pegang);
    }
    // lengan dekat: lengan bawah rebah di meja dari siku ke depan-kanan
    let tanganDekat = '';
    let lenganDekat = '';
    if (lengan !== 'telepon') {
      const LD = gambarLengan(sd.dekat, { lg, kain, bagian: 'bawah', kancing: 1, kecil });
      lenganDekat = LD.svg;
      if (lengan === 'tunjuk') {
        const T = letak(LD.pangkal, 8, SKALA_TANGAN.tunjuk);
        tanganDekat = gambarTangan(TANGAN_TUNJUK, T, kulit, lg, kecil);
        tangan.kiri = keKanvas(T, TANGAN_TUNJUK.pegang);
      } else {
        const T = letak(LD.pangkal, lengan === 'dengar' ? 22 : 18, SKALA_TANGAN.rebah);
        tanganDekat = gambarTangan(TANGAN_REBAH, T, kulit, lg, kecil);
        tangan.kiri = keKanvas(T, TANGAN_REBAH.pegang);
      }
    }
    if (lengan === 'dengar') m.push(lenganJauh, lenganDekat, tanganDekat, tanganJauh);
    else m.push(lenganJauh, tanganJauh, lenganDekat, tanganDekat);
    return m.join('');
  };
  // panggil sekali untuk mengisi titik tangan
  meja(id);
  return { belakang: b.join(''), kerah: kerah(DX, DY, lg), depan: depan.join(''), defs: defsSeragam(id), kepala: [230, 150], tangan, meja };
}

// =================================================================================================================
// GENERATOR

const POSE_DUDUK: ReadonlySet<PoseMentor> = new Set(['duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'telepon']);

/** Pandang bawaan per pose bila opsi.pandang kosong. */
function pandangBawaan(pose: PoseMentor): ArahPandang {
  switch (pose) {
    case 'berdiri-sambut':
    case 'berdiri':
      return 'pemain';
    case 'duduk-tunjuk':
      return 'bawah';
    case 'telepon':
      return 'depan';
    default:
      return 'lawan';
  }
}

function badanUntuk(id: string, pose: PoseMentor, kecil: boolean): HasilBadan {
  switch (pose) {
    case 'berdiri-sambut':
      return badanBerdiri(id, 'sembah', kecil);
    case 'berdiri-persilakan':
      return badanBerdiri(id, 'persilakan', kecil);
    case 'berdiri':
      return badanBerdiri(id, 'biasa', kecil);
    case 'duduk-jelaskan':
      return badanDuduk(id, 'jelaskan', kecil);
    case 'duduk-tunjuk':
      return badanDuduk(id, 'tunjuk', kecil);
    case 'telepon':
      return badanDuduk(id, 'telepon', kecil);
    default:
      return badanDuduk(id, 'dengar', kecil);
  }
}

/** Miring kepala tambahan per pose (derajat): sambut sedikit condong. */
const MIRING_POSE: Partial<Record<PoseMentor, number>> = { 'berdiri-sambut': 1, 'duduk-dengar': 1.5, 'berdiri-persilakan': 2 };

const cache = buatCache<GambarMissRaksa>(96);

function buat(o: OpsiMissRaksa, mini: boolean): GambarMissRaksa {
  const id = o.id ?? ID_BAWAAN;
  const duduk = POSE_DUDUK.has(o.pose);
  const K = duduk ? KANVAS_DUDUK : KANVAS_BERDIRI;
  const kecil = !!o.kecil;
  const badan = badanUntuk(id, o.pose, kecil);
  const kepala = gambarKepala({
    id,
    wajah: wajahDari(o.ekspresi),
    pandang: o.pandang ?? pandangBawaan(o.pose),
    bicara: !!o.bicara,
    kedip: !!o.kedip,
    kecil,
    mini: kecil && mini,
    miringPose: MIRING_POSE[o.pose] ?? 0,
  });
  const [kx, ky] = badan.kepala;
  const [dx, dy] = duduk ? [20, 30] : [0, 0];
  const lg = kecil ? LG * GARIS.kaliKecilBadan : LG;
  const tangan = badan.meja ? `<g class="lapis-tangan">${badan.meja(id)}</g>` : '';
  const svg =
    `<defs>${badan.defs}${kepala.defs}</defs><g stroke-linecap="round"><g class="lapis-badan">${badan.belakang}` +
    leher(id, kx, ky, dx, dy, kepala.rahang, kepala.leherJauh, lg) +
    `${badan.kerah}<g transform="translate(${f(kx)} ${f(ky)})">${kepala.svg}</g>${badan.depan}</g>${tangan}</g>`;
  const hasil: GambarMissRaksa = {
    svg,
    w: K.w,
    h: K.h,
    jangkar: { ...K.jangkar },
    kepala: { ...K.kepala },
    tangan: {
      ...(badan.tangan.kiri ? { kiri: { x: Number(f(badan.tangan.kiri[0])), y: Number(f(badan.tangan.kiri[1])) } } : {}),
      ...(badan.tangan.kanan ? { kanan: { x: Number(f(badan.tangan.kanan[0])), y: Number(f(badan.tangan.kanan[1])) } } : {}),
    },
  };
  if (badan.meja) {
    const idm = `${id}d`;
    hasil.diAtasMeja = `<defs>${defsLengan(idm)}</defs><g stroke-linecap="round">${badan.meja(idm)}</g>`;
  }
  return hasil;
}

/**
 * Generator Miss Raksa (kontrak GeneratorMissRaksa). Hasil di-cache per kunci opsi (gambar murni & deterministik);
 * salinan objek dikembalikan supaya pemanggil boleh mengubahnya tanpa merusak cache.
 */
export function gambarMissRaksa(o: OpsiMissRaksa): GambarMissRaksa {
  return ambil(o, false);
}

function ambil(o: OpsiMissRaksa, mini: boolean): GambarMissRaksa {
  const m = mini && !!o.kecil;
  const kunci = `${o.pose}|${o.ekspresi}|${o.pandang ?? ''}|${o.bicara ? 1 : 0}${o.kedip ? 1 : 0}${o.kecil ? 1 : 0}${m ? 1 : 0}|${o.id ?? ''}`;
  const h = cache.ambil(kunci, () => buat(o, m));
  const salin = (t?: Titik): Titik | undefined => (t ? { ...t } : undefined);
  const tangan = h.tangan ? { ...(h.tangan.kiri ? { kiri: salin(h.tangan.kiri) } : {}), ...(h.tangan.kanan ? { kanan: salin(h.tangan.kanan) } : {}) } : undefined;
  return { ...h, jangkar: { ...h.jangkar }, kepala: { ...h.kepala }, tangan };
}

/**
 * Jendela potret Miss Raksa <= POTRET_KECIL_MAKS_PX: JENDELA_POTRET_KECIL kontrak dinaikkan 6 satuan (x & sisi sama =
 * skala wajah tetap sama dengan Bu Rina; putaran 3, juri: puncak kubah/sanggul terpotong lingkaran).
 */
export const JENDELA_POTRET_KECIL_MR: JendelaPotret = { x: JENDELA_POTRET_KECIL.x, y: JENDELA_POTRET_KECIL.y - 6, sisi: JENDELA_POTRET_KECIL.sisi };
/** Jendela potret 53–75 px (mis. hub cerita 56 px): kepala ± 65 % lingkaran (di JENDELA_POTRET_V3 hanya ± separuh). */
export const JENDELA_POTRET_SEDANG: JendelaPotret = { x: 138, y: 58, sisi: 188 };
/** Sampai ukuran ini (px CSS) potret memakai JENDELA_POTRET_SEDANG + `kecil` (kepala tampil < 45 px di jendela V3). */
export const POTRET_SEDANG_MAKS_PX = 75;
/** Sampai ukuran ini (px CSS) potret memakai raut `mini` (layar akhir 28 px, riwayat 32 px). */
export const POTRET_MINI_MAKS_PX = 36;

/** Hasil `aturanPotret`: jendela (viewBox) + versi gambar untuk satu ukuran tampil. */
export interface AturanPotret {
  jendela: JendelaPotret;
  kecil: boolean;
  mini: boolean;
}

/**
 * Aturan potret menurut ukuran tampil (px CSS): <= POTRET_KECIL_MAKS_PX → JENDELA_POTRET_KECIL_MR + versi `kecil`
 * (<= POTRET_MINI_MAKS_PX juga raut `mini`); 53–75 px → JENDELA_POTRET_SEDANG + `kecil` (kepala tampil < 45 px);
 * 76 px ke atas → JENDELA_POTRET_V3 versi normal (garis tebal versi kecil tampak berat pada 96 px; lembar galeri).
 * Dipakai ulang (putaran 4) oleh potret lain & sisipan panggung: ambang POTRET_KECIL_MAKS_PX (ukuran.ts) /
 * POTRET_SEDANG_MAKS_PX / POTRET_MINI_MAKS_PX dan JENDELA_POTRET_SEDANG berlaku untuk tokoh mana pun; hanya
 * JENDELA_POTRET_KECIL_MR khusus Miss Raksa (kontrak kecil naik 6) — tokoh lain memakai JENDELA_POTRET_KECIL.
 */
export function aturanPotret(ukuran: number): AturanPotret {
  if (ukuran <= POTRET_KECIL_MAKS_PX) return { jendela: JENDELA_POTRET_KECIL_MR, kecil: true, mini: ukuran <= POTRET_MINI_MAKS_PX };
  if (ukuran <= POTRET_SEDANG_MAKS_PX) return { jendela: JENDELA_POTRET_SEDANG, kecil: true, mini: false };
  return { jendela: JENDELA_POTRET_V3, kecil: false, mini: false };
}

/**
 * Potret kepala-bahu (pose duduk-dengar yang sama dengan panggung): isi SVG + viewBox. `ukuran` (px tampil) memilih
 * jendela & versi lewat `aturanPotret`; tanpa `ukuran`: `kecil` → jendela kecil, selain itu JENDELA_POTRET_V3.
 */
export function potretMissRaksa(o: { ekspresi: Ekspresi; kecil?: boolean; ukuran?: number; pandang?: ArahPandang; bicara?: boolean; kedip?: boolean; id?: string }): { svg: string; viewBox: string } {
  const aturan = o.ukuran !== undefined ? aturanPotret(o.ukuran) : { jendela: o.kecil ? JENDELA_POTRET_KECIL_MR : JENDELA_POTRET_V3, kecil: !!o.kecil, mini: false };
  const g = ambil({ pose: 'duduk-dengar', ekspresi: o.ekspresi, pandang: o.pandang ?? 'pemain', bicara: o.bicara, kedip: o.kedip, kecil: aturan.kecil, id: o.id }, aturan.mini);
  const J = aturan.jendela;
  return { svg: g.svg, viewBox: `${J.x} ${J.y} ${J.sisi} ${J.sisi}` };
}