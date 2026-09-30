/**
 * MODE CERITA - kontrak data episode, state permainan, dan aksi.
 * Rancangan & aturan: docs/rancangan-mode-cerita.md (bagian 2-3).
 *
 * Tiga lapisan terpisah:
 *  - Episode  : DATA (node percakapan/aktivitas/akhir, pilihan, kondisi, efek, teks tiga bahasa).
 *  - Mesin    : fungsi MURNI (mesin.ts) state + aksi -> state baru; tanpa React, tanpa penyimpanan.
 *  - Tampilan : React (ui/, pages/Cerita*.tsx) membaca state & teks, mengirim aksi.
 *
 * State hanya menyimpan ID & kunci teks (bukan teks), sehingga ganti bahasa tidak mengubah state
 * dan progres lama tetap terbaca selama id-nya ada.
 */
import type { Bahasa } from '@shared/bahasa';
import type { StepKey } from '@shared/scoring';
import type { MissionAnswer, MissionPublic, Product } from '@shared/types';

export type IdNode = string;
export type IdBab = string;
export type IdAkhir = string;
export type IdAktivitas = string;
/** Kunci ke tabel teks episode (`Episode.teks[bahasa][kunci]`). */
export type KunciTeks = string;
/** Id pemeran di `Episode.pemeran`, atau 'pemain' (petugas = pemain) / 'narasi'. */
export type IdPembicara = string;

export type Ekspresi = 'netral' | 'cemas' | 'kesal' | 'bingung' | 'lega' | 'senang' | 'serius' | 'tersenyum';
export const DAFTAR_EKSPRESI: readonly Ekspresi[] = ['netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum'];

/** Cara tampilan menggambar pemeran. 'nasabah' = potret/ilustrasi nasabah episode (seni/). */
export type JenisPotret = 'nasabah' | 'missRaksa' | 'pemain';

/** Latar panggung; tampilan memetakan ke SVG latar adegan yang sudah ada (m05 kantor, m01 parkiran). */
export type IdLatar = 'kantor' | 'parkiran';
export const DAFTAR_LATAR: readonly IdLatar[] = ['kantor', 'parkiran'];

export interface Pemeran {
  nama: KunciTeks;
  /** Peran singkat di bawah nama ("Nasabah", "Senior Layanan Klaim"). */
  peran: KunciTeks;
  potret: JenisPotret;
  /** true = berdiri di panggung (nasabah). Pemeran lain hanya tampil sebagai potret bulat di kotak dialog. */
  diPanggung?: boolean;
}

// ------------------------------------------------------------------ kondisi & efek

export type NilaiProses = 'tepat' | 'dikoreksi' | 'keliru';

export type Kondisi =
  | { tanda: string }
  | { tidak: Kondisi }
  | { semua: Kondisi[] }
  | { salahSatu: Kondisi[] }
  | { kepercayaan: { min?: number; maks?: number } }
  | { paham: string }
  | { proses: string; nilai: NilaiProses | NilaiProses[] };

export interface Efek {
  pasang?: string[];
  cabut?: string[];
  /** Perubahan kepercayaan nasabah (delta). WAJIB disertai `alasan`. */
  kepercayaan?: number;
  /** Hal yang kini dipahami nasabah (id dari `Episode.paham`). */
  paham?: string[];
  /** Ketepatan langkah klaim (id dari `Episode.proses`); nilai terakhir menang. */
  proses?: Record<string, NilaiProses>;
  /** Butir Catatan kasus yang kini diketahui (id dari `Episode.catatan`). */
  catat?: string[];
  /** Kalimat sebab-akibat yang tampil ke pemain setelah efek ini (mis. mengapa nasabah mulai tenang). */
  alasan?: KunciTeks;
}

// ------------------------------------------------------------------ node

export interface Baris {
  siapa: IdPembicara;
  ekspresi?: Ekspresi;
  teks: KunciTeks;
  /** Baris hanya tampil bila kondisi terpenuhi (variasi dialog berdasarkan pilihan sebelumnya). */
  jika?: Kondisi;
  /**
   * Istilah (id dari `Episode.istilah`) yang pertama kali muncul di baris ini: tampilan memberi tombol
   * "Apa itu …?" yang bisa diketuk/ditekan untuk membuka artinya (tanpa hover, tanpa halaman glosarium).
   */
  istilah?: string[];
  /**
   * (v3) Cue presentasi saat baris ini tampil (docs/cerita/ADEGAN-AUTO1.md bagian 4): lokasi, kehadiran, pose,
   * aksi sekali jalan (masuk, pergi, kartu). Hanya tampilan; mesin tidak membacanya.
   */
  adegan?: CueAdegan;
}

// ------------------------------------------------------------------ presentasi adegan (v3)

/** Lokasi panggung cerita v3. `pintu-luar` hanya untuk pembuka; `telepon` = kantor dengan kursi pengunjung kosong. */
export type IdLokasiAdegan = 'pintu-luar' | 'meja' | 'parkiran' | 'telepon';
export const DAFTAR_LOKASI_ADEGAN: readonly IdLokasiAdegan[] = ['pintu-luar', 'meja', 'parkiran', 'telepon'];
/** Arah pandang tokoh: ke lawan bicara, ke pemain (di luar bingkai, sisi petugas), ke dokumen di meja, lurus. */
export type ArahPandang = 'lawan' | 'pemain' | 'bawah' | 'depan';
export type PoseMentor = 'berdiri-sambut' | 'berdiri-persilakan' | 'duduk-dengar' | 'duduk-jelaskan' | 'duduk-tunjuk' | 'berdiri' | 'telepon';
/** `duduk-turun` = bingkai antara berdiri & duduk (lutut menekuk, pinggul setengah turun); hanya dipakai animasi panggung. */
export type PoseNasabah = 'berdiri' | 'jalan-a' | 'jalan-b' | 'duduk-turun' | 'duduk' | 'duduk-condong' | 'telepon' | 'berdiri-pergi';
/** Aksi sekali jalan yang diputar saat baris bercue dicapai (bukan saat muat ulang / ganti bahasa). */
export type AksiAdegan = 'masuk' | 'pergi' | 'kartu' | 'pindah';
export type IdPropAdegan = 'kunci' | 'kartu' | 'telepon';
export type TempatProp = 'tangan' | 'meja' | 'tersimpan';

export interface CueAdegan {
  lokasi?: IdLokasiAdegan;
  /** Pose/pandang mentor; null = tidak hadir; tanpa nilai = ikut komposisi sebelumnya. */
  mentor?: { pose?: PoseMentor; pandang?: ArahPandang } | null;
  /** Pose/pandang nasabah; null = tidak hadir (mis. sudah pergi); tanpa nilai = ikut sebelumnya. */
  nasabah?: { pose?: PoseNasabah; pandang?: ArahPandang; lewatTelepon?: boolean } | null;
  aksi?: AksiAdegan;
  prop?: Partial<Record<IdPropAdegan, TempatProp>>;
}

/** Konfigurasi panggung episode: nama lokasi (papan nama & parameter teks `{lokasi}`), tema, slot eksterior. */
export interface KonfigPanggung {
  lokasi: { nama: string; tema: 'silver' };
  /** Eksterior gedung untuk pembuka; null = belum ada referensi terverifikasi (slot kosong, pembuka mulai di pintu). */
  eksterior: { nama: string; aset: string } | null;
  /** Komposisi awal episode (sebelum cue baris mana pun). */
  awal: CueAdegan;
}

export interface Pilihan {
  id: string;
  /** Yang dikatakan/dilakukan pemain: teks tombol pilihan, lalu tercatat di Riwayat (v2: tidak digemakan di dialog). */
  teks: KunciTeks;
  efek?: Efek;
  lanjut: IdNode;
  /** Pilihan hanya tersedia bila kondisi terpenuhi. */
  jika?: Kondisi;
}

interface NodeDasar {
  /** Harus sama dengan kuncinya di `Episode.node`. */
  id: IdNode;
  bab: IdBab;
  /** Latar panggung; tanpa nilai = latar node sebelumnya. */
  latar?: IdLatar;
  /** (v3) Cue presentasi saat node ini mulai tampil (sebelum cue baris-barisnya). Hanya tampilan. */
  adegan?: CueAdegan;
}

export interface NodeDialog extends NodeDasar {
  jenis: 'dialog';
  baris: Baris[];
  /** Diterapkan SEKALI saat pindah ke `lanjut`. */
  efek?: Efek;
  lanjut: IdNode;
}

export interface NodePilihan extends NodeDasar {
  jenis: 'pilihan';
  /** Baris pengantar; pilihan tampil setelah semuanya dibaca. */
  baris: Baris[];
  /** Pertanyaan di atas tombol pilihan ("Apa yang kamu katakan lebih dulu?"). */
  tanya: KunciTeks;
  pilihan: Pilihan[];
}

export interface CabangHasil {
  /** Dievaluasi setelah tanda hasil aktivitas dipasang; cabang pertama yang cocok dipakai. Tanpa `jika` = selalu cocok. */
  jika?: Kondisi;
  efek?: Efek;
  /** Baris umpan balik yang tampil bersama tanda di adegan (reaksi nasabah / catatan mentor). */
  umpanBalik?: Baris[];
  lanjut: IdNode;
}

export interface NodeAktivitas extends NodeDasar {
  jenis: 'aktivitas';
  aktivitas: IdAktivitas;
  /** Baris pengantar sebelum aktivitas tampil. */
  baris: Baris[];
  hasil: CabangHasil[];
}

export interface NodeCabang extends NodeDasar {
  jenis: 'cabang';
  cabang: { jika: Kondisi; lanjut: IdNode }[];
  lainnya: IdNode;
}

export interface NodeAkhir extends NodeDasar {
  jenis: 'akhir';
  akhir: IdAkhir;
  /** Epilog. */
  baris: Baris[];
}

export type NodeCerita = NodeDialog | NodePilihan | NodeAktivitas | NodeCabang | NodeAkhir;

// ------------------------------------------------------------------ aktivitas

/**
 * Aktivitas klaim yang memakai mekanik yang sudah ada (MissionPlay: adegan 2D + daftar HTML + dokumen).
 * Rubrik ada di klien karena mode cerita tidak bertanding; JANGAN mengimpor kunci pertandingan server.
 */
export interface DefAktivitas {
  id: IdAktivitas;
  /**
   * Misi sintetis dalam bahasa yang diminta. `id` misi unik & tetap (mis. 'cerita-auto1-bukti') karena
   * adegan 2D didaftarkan dengan id itu di client/src/game/scenes/cerita/index.ts.
   */
  misi: (bahasa: Bahasa) => MissionPublic;
  /** Satu StepKey per langkah misi (field `explanation` tidak dipakai; teks ada di `penjelasan`). */
  kunci: StepKey[];
  /** Penjelasan per stepId (kunci teks) untuk umpan balik / tanda pembahasan. */
  penjelasan: Record<string, KunciTeks>;
  /** Ringkasan satu kalimat untuk pembahasan. */
  ringkasan: KunciTeks;
  /** Label tombol kirim ("Pakai foto ini", "Sampaikan ke Bu Rina"). */
  labelKirim: KunciTeks;
  /** Menimpa heuristik tata letak MissionPlay. */
  fokus?: 'baca' | 'adegan';
  /**
   * (v2) Alasan singkat per opsi (id opsi -> kunci teks), tampil SETELAH jawaban dikirim di samping opsi yang
   * dipilih / terlewat ("Foto seluruh mobil: menunjukkan kondisi kendaraan secara utuh").
   */
  alasanOpsi?: Record<string, KunciTeks>;
  /**
   * (v2) Arti awam baris kartu polis (id kartu di `misi.policyCards` -> kunci teks): `sub` untuk subjudul kartu
   * (mis. jenis polis), `baris[i]` untuk baris ke-i `rows`. Tampilan menjadikan baris itu bisa diketuk/ditekan.
   */
  kartuArti?: Record<string, { sub?: KunciTeks; baris: (KunciTeks | null)[] }>;
  /**
   * (v2) Id opsi yang dihapus dari misi. Tanda `akt:<id>:pilih:<opsi>` di simpanan lama tetap sah untuk kondisi
   * (validasi), dan labelnya tetap dibaca dari kunci teks `akt.<id>.opsi.<opsi>` yang dipensiunkan.
   */
  opsiPensiun?: string[];
}

/** Hasil aktivitas yang sudah dinilai (disimpan di state; tidak dinilai ulang). */
export interface HasilAktivitas {
  jawaban: MissionAnswer;
  /** 0..1, aturan sama dengan server (gradeStep). */
  akurasi: number;
  /** Tanda hasil yang dipasang mesin: akt:<id>:tepat|sebagian|belum, akt:<id>:pilih:<opsi>, akt:<id>:lewat:<opsi>. */
  tanda: string[];
}

// ------------------------------------------------------------------ episode

export interface InfoBab {
  id: IdBab;
  judul: KunciTeks;
  /** Satu kalimat tujuan bab ("Pahami masalah Bu Rina"). */
  tujuan: KunciTeks;
}

export interface InfoAkhir {
  judul: KunciTeks;
  /** Satu kalimat ringkas akhir ini (dipakai di daftar "akhir yang ditemukan"). */
  ringkas: KunciTeks;
  nada: 'baik' | 'campuran' | 'buruk';
  /** 2-3 pelajaran dari mentor untuk akhir ini. */
  pelajaran: KunciTeks[];
}

/**
 * KARTU AKHIR (v2, docs/rancangan-mode-cerita.md bagian 11): satu penjelasan sebab-akibat untuk layar akhir,
 * dipilih dari keputusan NYATA (tanda, proses, paham, koreksi) lewat metadata eksplisit, bukan dari urutan
 * alasan atau angka kepercayaan. Aturan dievaluasi urut; yang pertama dengan `akhir` sama dan `jika` terpenuhi
 * dipakai. Tiap akhir wajib punya aturan cadangan tanpa `jika` (paling akhir di antara aturan akhir itu).
 */
export interface AturanAkhir {
  /** Id stabil (dipakai tes & atribut data-aturan). */
  id: string;
  akhir: IdAkhir;
  jika?: Kondisi;
  /** Judul hasil, dari sisi nasabah ("Bu Rina tahu langkah berikutnya"). */
  judul: KunciTeks;
  /** Satu kalimat sebab-akibat tentang nasabah. */
  sebab: KunciTeks;
  /** Satu pelajaran 15-25 kata (bahasa Indonesia) yang bisa dibawa pulang. */
  pelajaran: KunciTeks;
  /**
   * Titik "Coba lagi dari bagian …" untuk akhir yang belum baik: kandidat pertama yang `jika`-nya terpenuhi DAN
   * bab-nya bisa diulang di perjalanan ini (babBisaDiulang). Tanpa kandidat yang tersedia = bab terakhir yang
   * bisa diulang sebelum kandidat itu, lalu yang mana pun yang tersedia.
   */
  ulang?: { jika?: Kondisi; bab: IdBab }[];
  /** Paling banyak SATU latihan misi yang disarankan (nomor misi). */
  latihan?: number;
}

/**
 * Makna satu alasan perubahan suasana (kunci `Efek.alasan`) bagi tinjauan "Lihat perjalananku". Arah suasana
 * (naik/turun) BUKAN ukuran benar/salah: janji yang menenangkan nasabah tetap 'perhatian', ralat yang membuatnya
 * kecewa sesaat tetap 'ralat'.
 */
export interface MaknaAlasan {
  nilai: 'membantu' | 'perhatian' | 'ralat';
  /** Khusus 'perhatian': sudah diluruskan bila kondisi ini terpenuhi di state akhir (tidak ditampilkan sebagai belum beres). */
  diluruskan?: Kondisi;
}

/** Istilah yang dijelaskan saat pertama muncul (tombol "Apa itu …?"). */
export interface Istilah {
  /** Kata seperti yang tertulis di teks ("polis"). */
  label: KunciTeks;
  /** Arti dengan kata sehari-hari, satu-dua kalimat. Materi klaim: dicatat di TINJAUAN-PIC-CLAIM.md. */
  arti: KunciTeks;
}

export interface Suasana {
  /** Batas bawah kepercayaan untuk suasana ini (daftar diurutkan menurun). */
  min: number;
  ekspresi: Ekspresi;
  label: KunciTeks;
}

export interface Episode {
  /** Id stabil ('auto-1'). */
  id: string;
  /** Versi konten. Naikkan bila perubahan membuat progres lama tidak cocok; sediakan `migrasi` bila bisa. */
  versi: number;
  produk: Product;
  judul: KunciTeks;
  /** Satu-dua kalimat untuk kartu episode. */
  ringkas: KunciTeks;
  durasiMenit: number;
  mulai: IdNode;
  /** Pemeran selain 'pemain' & 'narasi'. */
  pemeran: Record<IdPembicara, Pemeran>;
  /** Pemeran yang suasana hatinya dilacak (nasabah). */
  nasabah: IdPembicara;
  /** Urutan bab = urutan cerita. */
  bab: InfoBab[];
  akhir: Record<IdAkhir, InfoAkhir>;
  /** Kejelasan: hal yang bisa dipahami nasabah -> label. */
  paham: Record<string, KunciTeks>;
  /** Ketepatan langkah klaim: butir -> label. */
  proses: Record<string, KunciTeks>;
  /** Catatan kasus: butir -> teks (ditampilkan bila sudah `catat`). */
  catatan: Record<string, KunciTeks>;
  kepercayaanAwal: number;
  /** Diurutkan menurun berdasarkan `min`; yang pertama dengan kepercayaan >= min dipakai. */
  suasana: Suasana[];
  node: Record<IdNode, NodeCerita>;
  aktivitas: Record<IdAktivitas, DefAktivitas>;
  /** Tabel teks per bahasa; kunci & parameter ({nama}) harus sama di ketiganya. */
  teks: Record<Bahasa, Record<KunciTeks, string>>;
  /** Misi latihan terkait (nomor) untuk tautan di akhir episode. */
  latihanTerkait?: number[];
  /** Aturan kartu akhir (lihat AturanAkhir). Tanpa ini layar akhir memakai judul & ringkas akhir. */
  kartuAkhir?: AturanAkhir[];
  /** Makna tiap kunci alasan untuk tinjauan perjalanan (lihat MaknaAlasan). */
  makna?: Record<KunciTeks, MaknaAlasan>;
  /** Istilah yang dijelaskan saat pertama muncul (id -> label & arti). */
  istilah?: Record<string, Istilah>;
  /** (v3) Panggung berlapis: lokasi, eksterior, komposisi awal (docs/cerita/ADEGAN-AUTO1.md). */
  panggung?: KonfigPanggung;
  /** Migrasi progres dari versi lama: kembalikan state baru, atau null bila tidak bisa. */
  migrasi?: Record<number, (lama: StateCerita) => StateCerita | null>;
}

// ------------------------------------------------------------------ state & aksi

export type EntriRiwayat =
  | { jenis: 'bab'; bab: IdBab }
  | { jenis: 'baris'; node: IdNode; siapa: IdPembicara; ekspresi?: Ekspresi; teks: KunciTeks }
  | { jenis: 'pilihan'; node: IdNode; pilihan: string; teks: KunciTeks }
  | { jenis: 'alasan'; node: IdNode; teks: KunciTeks; arah: 'naik' | 'turun' | 'tetap' }
  | { jenis: 'aktivitas'; node: IdNode; aktivitas: IdAktivitas; akurasi: number };

export interface KeputusanTercatat {
  node: IdNode;
  pilihan: string;
  langkah: number;
}

export interface StateCerita {
  format: 1;
  episode: string;
  /** Versi episode saat state dibuat. */
  versi: number;
  node: IdNode;
  /** Jumlah baris (yang terlihat) node kini yang sudah tampil. */
  baris: number;
  tanda: string[];
  kepercayaan: number;
  paham: string[];
  proses: Record<string, NilaiProses>;
  catatan: string[];
  keputusan: KeputusanTercatat[];
  aktivitas: Record<IdAktivitas, HasilAktivitas>;
  /** Aktivitas node kini sudah dinilai dan umpan balik sedang tampil (menunggu 'lanjut'). */
  umpanBalik: { node: IdNode; cabang: number } | null;
  /** Ucapan pemain terakhir & alasan perubahan suasana, untuk ditampilkan bersama reaksi berikutnya. */
  terakhir: { teks: KunciTeks; alasan?: KunciTeks; arah?: 'naik' | 'turun' | 'tetap' } | null;
  riwayat: EntriRiwayat[];
  akhir: IdAkhir | null;
  /** Penghitung aksi yang berhasil (naik terus). */
  langkah: number;
  /** Cadangan state saat pertama kali masuk tiap bab pada perjalanan ini (untuk "coba jalur lain"). */
  cadangan: Record<IdBab, Omit<StateCerita, 'cadangan'>>;
}

export type AksiCerita =
  | { jenis: 'lanjut' }
  | { jenis: 'pilih'; node: IdNode; pilihan: string }
  | { jenis: 'aktivitas'; node: IdNode; jawaban: MissionAnswer }
  | { jenis: 'ulangBab'; bab: IdBab }
  | { jenis: 'mulaiUlang' };

/** Hasil muat progres dari penyimpanan (simpan.ts). */
export type HasilMuat =
  | { status: 'baru' }
  | { status: 'lanjut'; state: StateCerita }
  | { status: 'tidakCocok'; alasan: 'versi' | 'rusak' | 'node-hilang'; versiTersimpan?: number };

/** Ringkasan akhir episode untuk layar akhir (mesin.ts: ringkasanAkhir). */
export interface RingkasanAkhir {
  akhir: IdAkhir;
  suasana: Suasana;
  /** Alasan perubahan kepercayaan, urut kejadian. */
  komunikasi: { teks: KunciTeks; arah: 'naik' | 'turun' | 'tetap' }[];
  /** Kejelasan: tiap butir paham + sudah/belum. */
  paham: { id: string; label: KunciTeks; sudah: boolean }[];
  /** Ketepatan langkah klaim: tiap butir proses + nilainya (null = tidak tersentuh di jalur ini). */
  proses: { id: string; label: KunciTeks; nilai: NilaiProses | null }[];
  keputusan: KeputusanTercatat[];
}
