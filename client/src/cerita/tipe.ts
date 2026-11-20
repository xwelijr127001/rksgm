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

/**
 * Peran pemeran bagi tampilan. 'nasabah' = nasabah episode (suasananya dilacak), 'missRaksa' = mentor, 'tokoh' = pemeran
 * lain (surveyor, saksi, admin). Seni potretnya: seni Episode 1 (Bu Rina / Miss Raksa piksel) atau, bila episode memakai
 * panggung latar (`Episode.latar`), potongan sprite tokoh itu.
 */
export type JenisPotret = 'nasabah' | 'missRaksa' | 'pemain' | 'tokoh';

/** Latar panggung; tampilan memetakan ke SVG latar adegan yang sudah ada (m05 kantor, m01 parkiran). */
export type IdLatar = 'kantor' | 'parkiran';
export const DAFTAR_LATAR: readonly IdLatar[] = ['kantor', 'parkiran'];

export interface Pemeran {
  nama: KunciTeks;
  /** Peran singkat di bawah nama ("Nasabah", "Layanan Klaim"). */
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
  /** Tata panggung latar saat baris ini tampil (episode dengan `Episode.latar`). Hanya tampilan; mesin tidak membacanya. */
  tata?: CueLatar;
  /**
   * (v3) Cue presentasi saat baris ini tampil (docs/cerita/ADEGAN-AUTO1.md bagian 4): lokasi, kehadiran, pose,
   * aksi sekali jalan (masuk, pergi, kartu). Hanya tampilan; mesin tidak membacanya.
   */
  adegan?: CueAdegan;
  /** (antarmuka HP) Lampiran yang ikut tampil di obrolan bersama baris ini (id dari `Episode.lampiran`). */
  lampiran?: string;
  /**
   * (antarmuka HP) Label topik akibat (kunci teks), mis. "Berkas" / "Kabar untuk Pak Hendra": baris akibat yang
   * menjelaskan satu sisi tindakan diberi label pendek di depannya supaya akibat pengajuan & akibat komunikasi terbedakan.
   */
  topik?: KunciTeks;
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

// ------------------------------------------------------------------ panggung latar (episode 2+)

/**
 * Tata PANGGUNG LATAR: satu latar per lokasi, tokoh berdiri di slot (kiri -> kanan), lawan bicara jarak jauh di layar
 * ponsel, dan objek panggung. Dilipat seperti cue v3 (ui/latar/komposisi.ts): nilai bertahan sampai cue berikutnya;
 * `hadir: []` = panggung kosong, `telepon: null` = tidak ada panggilan. Hanya tampilan; mesin & simpanan tidak membacanya.
 */
export interface CueLatar {
  lokasi?: string;
  hadir?: IdPembicara[];
  telepon?: IdPembicara | null;
  /** Benda akibat keputusan yang terlihat (id objek LokasiIlustrasi.objek). */
  objek?: string[];
  /**
   * (T-025) Keadaan SPRITE MILIK RUANG di ruang yang punya blok `komite` (Ruang Rapat Komite Klaim): empat anggota hiasan
   * yang bukan pemeran dan tidak pernah berbicara. Bertahan sampai cue berikutnya; di ruang lain tidak digambar apa pun.
   */
  komite?: KeadaanKomite;
}

/**
 * Keadaan anggota Komite Klaim di ruangnya: `tunggu` duduk menunggu, `setuju` mengangguk + tanda SETUJU, `catatan` dua anggota
 * mengangkat tangan + tanda CATATAN, `kosong` kursi kosong.
 */
export type KeadaanKomite = 'tunggu' | 'setuju' | 'catatan' | 'kosong';
export const KEADAAN_KOMITE: readonly KeadaanKomite[] = ['tunggu', 'setuju', 'catatan', 'kosong'];

/**
 * Konfigurasi panggung latar sebuah episode (alternatif dari `panggung` dunia Episode 1). T-013 Stage 3: lokasi = ruang
 * PIKSEL (seni/piksel/ruang-ep2.json, digambar ui/latar/piksel/PanggungPiksel lewat adapter cue adeganPiksel); tokoh =
 * atlas piksel (adegan.ts PERAN_PIKSEL). Panggung ilustrasi (WebP) dan asetnya sudah dihapus.
 */
export interface KonfigLatar {
  /**
   * Lokasi -> nama tempat (kunci teks) + id ruang piksel. `komite` (T-025, ruang bersprite milik ruang): SATU kalimat per
   * keadaan untuk pembaca layar (gambarnya hiasan; tanda SETUJU / CATATAN adalah piksel, bukan teks).
   */
  lokasi: Record<string, { nama: KunciTeks; piksel: string; komite?: Record<KeadaanKomite, KunciTeks> }>;
  /** Komposisi sebelum cue mana pun. */
  awal: CueLatar;
  /**
   * Gambar kartu episode di daftar: lokasi + tokoh (urut kiri -> kanan). `ekspresi` = wajah pemeran SELAIN nasabah
   * (nasabah mengikuti status kartu: cemas / lega).
   */
  sampul: { lokasi: string; hadir: IdPembicara[]; ekspresi?: Ekspresi };
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
  /** Tata panggung latar saat node ini mulai tampil (sebelum `tata` baris-barisnya). Hanya tampilan. */
  tata?: CueLatar;
  /**
   * T-076 (Episode 1 Investigator, opt-in; node tanpa field ini = tidak berubah): JENIS INVESTIGASI node ini. Mesin tidak
   * membacanya (jenis mesin tetap dialog / pilihan / aktivitas / akhir); hanya pemutar HP, yang menggambar layar investigasi
   * untuk node itu (cerita/investigasi). Lihat NodeInvestigasi.
   */
  investigasi?: NodeInvestigasi;
}

// ------------------------------------------------------------------ T-076 Episode 1 Investigator (opt-in)

/** Kartu bukti (kontrak rencana Task 1 -> Task 2; `judul` & `sumber` = kunci teks episode). */
export interface BuktiInvestigasi {
  id: 'dashcam' | 'rambu' | 'sim';
  judul: KunciTeks;
  sumber: KunciTeks;
  ikon: 'rekaman' | 'foto' | 'kartu';
}

/** Pernyataan saksi yang bisa dicatat ke buku catatan (kontrak rencana; `teks` = kunci teks episode). */
export interface PernyataanInvestigasi {
  id: string;
  siapa: 'darto' | 'petugasTol';
  teks: KunciTeks;
}

/**
 * Jenis investigasi sebuah node (rencana: catat, bukti, keberatan, putusan, hasil-investigasi; + judul & cap untuk kartu judul
 * dan cap KEBERATAN). Tiap jenis menumpang jenis mesin yang ADA, jadi simpanan, muat ulang, dan riwayat berjalan seperti biasa:
 *  - judul            : node dialog; kartu judul kasus, "Mulai" = lanjut.
 *  - catat            : node dialog; baris terakhirnya = pernyataan `pernyataan`; tombol lanjut = "Catat" dan efek node memasang
 *                       tanda `catat:<id>`.
 *  - bukti            : node dialog (sesudah arena / temuan); kartu bukti `bukti` masuk buku, efek node memasang `bukti:<id>`.
 *  - keberatan        : percobaan 0 / 1 = node PILIHAN (id pilihan = id bukti, hanya bukti yang sudah terkumpul lewat `jika`);
 *                       percobaan 2 (dipandu) = node DIALOG: hanya bukti `tepat` yang melanjutkan. Hasil = tanda
 *                       `keb:tepat` | `keb:tepat-kedua` | `keb:dipandu`.
 *  - cap              : node dialog; cap KEBERATAN diputar, selesai = lanjut.
 *  - putusan          : node pilihan (id pilihan layak / tambahan / polis), tanda `putusan:<id>`.
 *  - hasil-investigasi: node AKHIR; layar hasil (skor, nilai, stempel, pangkat).
 */
export type NodeInvestigasi =
  | { jenis: 'judul' }
  | { jenis: 'catat'; pernyataan: string }
  | { jenis: 'bukti'; bukti: BuktiInvestigasi['id'] }
  | { jenis: 'keberatan'; pernyataan: string; tepat: BuktiInvestigasi['id']; percobaan: 0 | 1 | 2 }
  | { jenis: 'cap' }
  | { jenis: 'putusan' }
  | { jenis: 'hasil-investigasi' };

/** Data kasus investigasi sebuah episode (`Episode.investigasi`). */
export interface KonfigInvestigasi {
  /** Id kasus untuk rekaman perangkat (skor terbaik & stempel), mis. 'kasus-1'. */
  kasus: string;
  nomor: number;
  judul: KunciTeks;
  pernyataan: PernyataanInvestigasi[];
  bukti: BuktiInvestigasi[];
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
  /** Dokumen (id di `Episode.dokumen`) yang terbuka di atas pilihan: fakta yang perlu dibaca sebelum menjawab. */
  dokumen?: string;
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
  /**
   * true = AKIBAT LANGSUNG: sesudah dinilai, cabang yang cocok diterapkan dan cerita langsung pindah ke `lanjut`-nya
   * (akibatnya tampil sebagai dialog di panggung, alasan perubahan suasana ikut baris pertamanya), tanpa layar pembahasan
   * yang menandai jawaban tepat. Cabang tidak boleh punya `umpanBalik`. Dipakai episode yang menyimpan saran & alasan
   * untuk ringkasan akhir.
   */
  langsung?: boolean;
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
  /**
   * (antarmuka HP) Arena visual aktivitas (cerita/hp/arena): pola interaksi + benda/tujuan yang tampil. Susunan arena
   * ditulis ke MissionAnswer misi yang sama, jadi penilaian & pemetaan `langsung` tidak berubah.
   */
  arena?: KonfigArena;
  /**
   * (antarmuka HP) Pesan pemain ke nasabah yang lahir dari susunan aktivitas (mis. daftar dokumen yang diminta),
   * tampil sebagai balasan pemain di obrolan. null = tidak ada pesan (mis. memilih belum mengabari).
   */
  pesanObrolan?: (jawaban: MissionAnswer, tx: (k: KunciTeks, param?: Record<string, string | number>) => string) => string | null;
}

// ------------------------------------------------------------------ arena aktivitas (antarmuka HP)

/** Satu benda di arena: dokumen, kartu saksi, bagian pesan. Nama dari label item misi bila `nama` kosong. */
export interface BendaArena {
  id: string;
  /** Nama pendek di kartu (kunci teks); bawaan = label item misi. */
  nama?: KunciTeks;
  /** Keterangan satu baris di bawah nama (fakta dari naskah, bukan petunjuk jawaban). */
  keterangan?: KunciTeks;
  /** Gambar benda: id dari `Episode.seniArena` (SVG kode). */
  seni?: string;
  /** Potret tokoh (sprite panggung latar) sebagai gambar benda. */
  tokoh?: { id: IdPembicara; ekspresi?: Ekspresi };
}

/** Satu tujuan/pilihan di arena: baki, lokasi di peta, slot rencana, stempel, tindakan. */
export interface TujuanArena {
  id: string;
  /** Nama tujuan yang singkat (kunci teks). */
  label: KunciTeks;
  /** Arti/akibat yang sudah diketahui petugas (kunci teks), tampil bersama label. */
  arti?: KunciTeks;
  /** Ikon kecil (id IconKey). */
  ikon?: string;
  /** Gambar tujuan (id dari `Episode.seniArena`): gedung di peta, baki, stempel, benda di meja. */
  seni?: string;
}

/** Teks pokok arena: pertanyaan, satuan hitung, dan fakta yang dibutuhkan saat memutuskan. */
interface DasarArena {
  /** Pertanyaan satu kalimat untuk tiap langkah ("Kapan kita perlu meminta dokumen ini?"). */
  tanya: KunciTeks;
  /** Fakta yang dibutuhkan saat memutuskan: id tabel misi atau `Episode.dokumen`, tampil di arena (bukan tab lain). */
  fakta?: {
    tabel?: string;
    dokumen?: string;
    /** Hanya di tampilan daftar: tampilan gambar sudah memuat fakta ini (mis. papan rencana menunjukkan jalurnya). */
    hanyaDaftar?: boolean;
  };
  /**
   * Catatan fakta singkat dari fakta naskah yang sama: di tampilan gambar pola tujuan (mis. di bawah papan); di pola susun =
   * fakta kunci yang tetap terlihat saat konteks diringkas (mis. surat polisi belum jadi).
   */
  catatan?: KunciTeks;
  /**
   * (pola susun) Id benda yang keterangannya sudah memuat fakta `catatan` (mis. surat polisi "masih diurus"): saat benda itu
   * aktif, catatan tidak diulang di atas, karena faktanya terbaca di tempat tindakan.
   */
  catatanBenda?: string;
}

export type KonfigArena = DasarArena & (
  /**
   * Benda satu per satu ke salah satu wadah (dokumen -> baki, kartu saksi -> daftar), lalu ringkasan per wadah.
   * `satuan` = label satuan ("Dokumen 2 dari 8"). `satuanHitung` = satuan SESUDAH angka di kalimat hitungan ringkasan ("8 dari 8
   * dokumen sudah ditempatkan"): bahasa yang membedakan tunggal dan jamak menulis "tunggal|jamak" (en "document|documents"), zh
   * menyertakan kata bantu bilangannya ("份文件", "位证人"), id cukup katanya ("dokumen"). Tanpa field ini: `satuan` berhuruf kecil.
   */
  | { pola: 'susun'; langkah: string; satuan: KunciTeks; satuanHitung?: KunciTeks; gaya: 'baki' | 'papan'; benda: BendaArena[]; wadah: TujuanArena[] }
  /** Satu benda ke satu tujuan yang terlihat: peta (penugasan), lembar teruskan (bukti), papan rencana. */
  | { pola: 'tujuan'; langkah: string; benda: BendaArena; gaya: 'peta' | 'teruskan' | 'rencana'; tujuan: TujuanArena[] }
  /** Bandingkan dua catatan: tiap perbedaan ditandai dengan satu perlakuan (stempel). */
  | { pola: 'bandingkan'; langkah: string; sumber: { kiri: KunciTeks; kanan: KunciTeks }; selisih: { id: string; label: KunciTeks; /** Catatan bukti di bawah perbedaan: yang diketahui dan yang belum (kunci teks). */ catatan?: KunciTeks; /** Isi baris ini di dua kertas (T-020: teks HTML dari tabel cerita, bukan gambar). */ sel?: { kiri: KunciTeks; kanan: KunciTeks }; /** Ikon baris di kertas (penanda netral: waktu / orang / catatan). */ ikon?: 'jam' | 'wajah' | 'pensil' }[]; perlakuan: TujuanArena[] }
  /** Periksa isi bundel (tabel), pilih tindakan atas bundel, lalu pilih kabar (gelembung pesan) untuk nasabah. */
  | { pola: 'bundel'; tindakan: { langkah: string; tanya: KunciTeks; pilihan: TujuanArena[] }; kabar: { langkah: string; tanya: KunciTeks; pilihan: TujuanArena[] }; meja?: KonfigMeja }
  /** Susun pesan: ketuk bagian untuk memasukkannya ke pesan; yang tidak dimasukkan = wadah `tidak`. */
  | { pola: 'pesan'; langkah: string; masuk: string; tidak: string; benda: BendaArena[] }
  /** Periksa SIM (T-022): permainan empat langkah dengan tangan; jawaban = satu item ke wadah `bersih` (tanpa ketukan keliru) atau `ragu`. */
  | { pola: 'sim'; langkah: string; benda: string; bersih: string; ragu: string }
  /** Periksa rambu di jalan (K08): ketuk rambu -> tandai lajur sendiri (satu langkah assign per rambu) -> kesimpulan (satu langkah single). */
  | { pola: 'rambu'; jumlahLajur: number; lajurTruk: number; rambu: RambuArena[]; simpul: SimpulRambu }
  /**
   * T-064/T-065 (Episode 1 Dev): rekaman DASHCAM. Rekaman diputar, lalu pemain mengetuk kendaraan pemicu di bingkai beku.
   * Kontrak Task 1 (Fullstack) <-> Task 2 (Designer, ArenaPolaDashcam): `benda` = tiga kendaraan yang bisa diketuk, `tepat` = 'mobil'.
   * Jawaban = SATU item `item` di langkah `langkah` ke wadah `bersih` (mobil pada ketukan pertama) atau `ragu` (selain itu):
   * `tetapkan(jawaban, konfig.langkah, konfig.item, konfig.bersih | konfig.ragu)` (pola sama dengan 'sim').
   */
  | { pola: 'dashcam'; langkah: string; item: string; benda: { id: 'mobil' | 'truk' | 'truk-kecil' }[]; tepat: 'mobil'; bersih: string; ragu: string;
      /**
       * (T-068, Episode 1 lengkap K08) Langkah kedua pada bingkai beku yang SAMA: pertanyaan tokoh `penanya` (kalimat `tanya`) dengan
       * pilihan kesimpulan (langkah pilih-satu misi `langkah`). Tanpa ini arena berakhir sesudah ketukan penyebab (Episode 1 Dev kdash).
       */
      simpul?: { langkah: string; tanya: KunciTeks; judul?: KunciTeks; penanya: string; pilihan: TujuanArena[] } }
);

/** Satu rambu di arena `rambu`: langkah assign yang menyimpan lajur yang ditandai pemain (item = `${awalanItem}${nomorLajur}` -> wadah `wadah`). */
export interface RambuArena {
  langkah: string;
  wadah: string;
  awalanItem: string;
  label: KunciTeks;
  /** Bunyi rambu (kunci teks naskah, dikutip apa adanya). */
  isi: KunciTeks;
  /** Petunjuk menandai lajur untuk rambu ini (kunci teks). */
  petunjuk: KunciTeks;
  /** Lajur yang DISEBUT tulisan rambu (hanya bila tulisannya menyebut nomor lajur); dipakai membandingkan tanda pemain dengan tulisan. */
  tulisan?: number[];
}

/** Kesimpulan atas pertanyaan tokoh di arena `rambu` (satu opsi = satu alternatif naskah). */
export interface SimpulRambu {
  langkah: string;
  tanya: KunciTeks;
  pilihan: TujuanArena[];
  /** Sikap pernyataan terhadap "melanggar rambu?" (hanya yang bersikap yang dicocokkan dengan tanda pemain). */
  sikap: Record<string, 'melanggar' | 'tidak'>;
}

/** Tempat di meja kasus yang bisa menerima map (tujuan tindakan). */
export type TempatMeja = 'papan' | 'komite' | 'kontak';

/**
 * (PROTOTIPE meja kasus, D-68; hanya dipakai build VITE_MEJA_KASUS=1) Pola bundel sebagai meja kasus: map pengajuan
 * berisi kelompok berkas yang bisa dibuka (kelengkapan = baris tabel fakta `fakta.tabel`: nilai "ada" atau belum), tempat
 * tindakan di meja untuk tiap pilihan tindakan, dan kontak nasabah untuk kabar. Jawaban tetap {tindakan, kabar}; penilaian
 * & pemetaan alternatif tidak berubah.
 */
export interface KonfigMeja {
  /** Kelompok berkas di map, SEURUTAN baris tabel fakta (baris ke-i = berkas ke-i). */
  berkas: { id: string; singkat: KunciTeks; seni?: string; rincian?: KunciTeks }[];
  /** Nama objek di meja. */
  objek: { map: KunciTeks; komite: KunciTeks; papan: KunciTeks };
  /**
   * Per id pilihan tindakan: tempat map diletakkan, keadaan meja sesudah konfirmasi (fakta akibat naskah: lengkap lalu
   * masuk Komite / masuk lalu dikembalikan / laporan ke nasabah, map tetap di meja), dan status pengajuan sesudahnya.
   */
  tindakan: Record<string, { tempat: TempatMeja; akhir: 'lengkap' | 'kembali' | 'tahan'; status: KunciTeks; singkat?: KunciTeks }>;
  /** Status pengajuan sebelum konfirmasi. */
  statusAwal: KunciTeks;
}

/** Gambar kode untuk arena (SVG tanpa pembungkus), ukuran viewBox-nya. */
export interface SeniArena {
  svg: string; w: number; h: number;
  /**
   * (T-020) Seni PIKSEL: kelas CSS yang membawa PNG-nya sebagai latar (seni/aktivitas/piksel.css). Digambar PERSIS w x h px
   * (1 piksel seni = 1 px CSS, tidak pernah diskalakan); `svg` dikosongkan.
   */
  piksel?: string; /** Versi kecil 22 x 28 (sel atlas dokumen) untuk chip, kantong map dan token di papan: kelas CSS-nya. */ kecil?: string;
}

/** Lampiran obrolan (antarmuka HP): foto/dokumen yang dikirim tokoh. */
export interface LampiranCerita {
  jenis: 'foto' | 'dokumen';
  judul: KunciTeks;
  /** Id dari `Episode.seniArena`. */
  seni: string;
  /** Pengirim (bawaan nasabah). */
  dari?: IdPembicara;
}

/** Hasil aktivitas yang sudah dinilai (disimpan di state; tidak dinilai ulang). */
export interface HasilAktivitas {
  jawaban: MissionAnswer;
  /** 0..1, aturan sama dengan server (gradeStep). */
  akurasi: number;
  /**
   * Tanda hasil yang dipasang mesin: akt:<id>:tepat|sebagian|belum, akt:<id>:pilih:<opsi>, akt:<id>:lewat:<opsi>, dan
   * susunan langkah assign akt:<id>:taruh:<item>:<wadah> (dibaca kondisi cabang aktivitas berakibat langsung).
   */
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
  /**
   * (T-025) Rincian di bawah arti: satu baris per anggota (mis. empat anggota Komite Klaim), masing-masing satu kalimat peran
   * dan, bila ada, ikon piksel 32 px (`ikon` = id sel ikon, mis. 'komite-ketua'; CSS .cer-istilah-ikon[data-ikon]; hiasan,
   * kalimatnya yang membawa arti).
   */
  anggota?: { teks: KunciTeks; ikon?: string }[];
}

export interface Suasana {
  /** Batas bawah kepercayaan untuk suasana ini (daftar diurutkan menurun). */
  min: number;
  ekspresi: Ekspresi;
  label: KunciTeks;
}

/**
 * T-026 (permintaan owner 17 Nov 2026): jenis episode, ditampilkan sebagai tag di kartu daftar /cerita supaya pemain bisa
 * memilih. 'demo' = cerita contoh untuk mencoba alur (Episode 1); 'nyata' = berdasarkan modul klaim Raksa (Episode 2).
 */
export type JenisEpisode = 'demo' | 'nyata';
export const JENIS_EPISODE: readonly JenisEpisode[] = ['demo', 'nyata'];

export interface Episode {
  /**
   * T-021: titik serah panggung kantor <-> obrolan yang memakai adegan telepon. `tokoh` = pemeran yang memegang telepon (harus
   * hadir di panggung, kalau tidak: potong langsung). maju = pasangan [node panggung, node obrolan]; balik = dari node obrolan mana
   * saja di `dari` ke node panggung mana saja di `ke`.
   */
  serahTelepon?: { tokoh: string; maju: [string, string][]; balik: { dari: string[]; ke: string[] } };
  /** Id stabil ('auto-1'). */
  id: string;
  /** Versi konten. Naikkan bila perubahan membuat progres lama tidak cocok; sediakan `migrasi` bila bisa. */
  versi: number;
  produk: Product;
  /** T-026: tag jenis di kartu daftar episode (label + keterangan: kamus cerita `jenis.*` / `jenisKet.*`). Tanpa nilai = kartu tanpa tag. */
  jenis?: JenisEpisode;
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
  /**
   * Isi label nasabah di panggung. 'wajah' (bawaan, Episode 1) = perasaan dari wajah yang tampil; 'status' = status
   * hubungan KUMULATIF (pita `suasana` dari kepercayaan: berubah hanya bila statusnya berubah), sementara emosi sesaat
   * tetap terlihat di wajah tokoh. Skala naskah Episode 2 (Kecewa/Cemas/Tenang/Percaya/Puas) adalah status, bukan ekspresi.
   */
  labelSuasana?: 'wajah' | 'status';
  /**
   * Antarmuka pemain. Bawaan (Episode 1) = halaman cerita standar. 'hp' = mobile-first (cerita/hp): percakapan jarak
   * jauh sebagai obrolan yang dimainkan, adegan tatap muka ringkas (baris berurutan digabung), aktivitas di arena visual
   * dengan tampilan daftar setara, kepala & menu ringkas. Mesin, simpanan, dan penilaian sama.
   */
  antarmuka?: 'hp';
  /** (antarmuka HP) Gambar kode benda arena & lampiran obrolan. */
  seniArena?: Readonly<Record<string, SeniArena>>;
  /** (antarmuka HP) Lampiran obrolan yang dirujuk `Baris.lampiran`. */
  lampiran?: Record<string, LampiranCerita>;
  /**
   * (antarmuka HP) CUT-IN potret: kunci teks baris nasabah di obrolan yang diberi potret dekat sesaat (momen emosional
   * terpilih). Tampil hanya saat pesan itu pesan terbaru, tidak mengunci input; baris bersyarat (protes janji) hanya
   * muncul bila barisnya memang tampil. Obrolan tetap obrolan (bukan telepon/video).
   */
  cutIn?: readonly KunciTeks[];
  node: Record<IdNode, NodeCerita>;
  aktivitas: Record<IdAktivitas, DefAktivitas>;
  /**
   * Tabel teks per bahasa; kunci & parameter ({nama}) harus sama di semua bahasa episode (`bahasa`). Tabel bahasa di
   * luar `bahasa` boleh kosong: teksCerita jatuh ke Indonesia dan tampilan memberi tahu pemain.
   */
  teks: Record<Bahasa, Record<KunciTeks, string>>;
  /**
   * Bahasa naskah episode ini. Tanpa nilai = semua bahasa aplikasi (Episode 1). Episode yang naskahnya masih menunggu
   * tinjauan (mis. hanya 'id') tidak diterjemahkan diam-diam; tampilan memberi catatan di bahasa lain.
   */
  bahasa?: Bahasa[];
  /** Batas kepercayaan (status nasabah); setiap efek dijepit ke rentang ini. Tanpa nilai = tidak dijepit (Episode 1). */
  kepercayaanBatas?: { min: number; maks: number };
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
  /** Panggung latar (alternatif `panggung`): lokasi + sprite tokoh + tata per node/baris (lihat KonfigLatar). */
  latar?: KonfigLatar;
  /** Dokumen yang bisa dibaca di atas pilihan (`NodePilihan.dokumen`): id -> judul + baris label/nilai. */
  dokumen?: Record<string, DokumenCerita>;
  /**
   * Titik keputusan bernomor naskah (mis. 15 keputusan) untuk ringkasan akhir: pilihan pemain, pilihan yang disarankan,
   * dan alasan mentor. Pilihan pemain dibaca dari tanda `kep:<titik>:<alternatif>` yang dipasang efek pilihan/cabang.
   */
  titik?: TitikKeputusan[];
  /** Catatan status naskah di bawah ringkasan keputusan (mis. draf, butir konfirmasi yang belum disahkan). */
  statusNaskah?: KunciTeks;
  /**
   * T-064 (Episode 1 Dev, opt-in; episode lain tanpa field ini = tidak berubah): `teksBesar` = teks pemutar HP lebih besar
   * (badan >= 18 px, sasaran ketuk >= 48 px); `akhirKenalan` = layar akhir singkat (suasana akhir, kalimat kasus nyata, nama
   * opsional untuk kartu petugas, dua tombol) dan TANPA layar nama sebelum bermain.
   */
  tampilan?: { teksBesar?: boolean; akhirKenalan?: boolean };
  /**
   * T-076 (Episode 1 Investigator, opt-in): kasus investigasi. Dengan field ini pemutar HP menggambar layar investigasi untuk
   * node ber-`investigasi`, buku catatan menggantikan Catatan kasus, layar akhir = hasil investigasi, dan tamu bermain tanpa
   * layar nama. Episode lain tanpa field ini = tidak berubah.
   */
  investigasi?: KonfigInvestigasi;
  /** Migrasi progres dari versi lama: kembalikan state baru, atau null bila tidak bisa. */
  migrasi?: Record<number, (lama: StateCerita) => StateCerita | null>;
}

/** Dokumen pendek yang dibaca pemain sebelum memutuskan (kartu proses, linimasa, surat). Semua isi = kunci teks. */
export interface DokumenCerita {
  judul: KunciTeks;
  /** Satu baris = label + nilai (nilai boleh null: baris judul langkah saja). */
  baris: { label: KunciTeks; nilai: KunciTeks | null }[];
  catatan?: KunciTeks;
  /** Bukti visual tajam yang dibangun dari baris dokumen ini (bukan dari gambar latar); bisa diperbesar. */
  skema?: SkemaLajur;
  /**
   * Baris = tahapan: ditampilkan sebagai gambaran tahap + SATU kartu detail aktif (bisa dijelajahi, bukan checklist).
   * 'paralel' = naskah mendukung tahap yang berjalan bersamaan: urutan kartu disebut urutan penjelasan, bukan jadwal.
   */
  tahapan?: 'urut' | 'paralel';
}

/**
 * Skema bukti ruas jalan: tiruan rambu (teks = nilai baris dokumen, terbaca) + diagram lajur tampak atas (jumlah lajur,
 * dihitung dari kiri, arah lalu lintas ke atas) dengan posisi kendaraan menurut naskah. Hanya fakta naskah: tidak ada
 * tanda tafsir/kesimpulan (mis. lajur "dilarang" tidak diwarnai). Indeks merujuk `DokumenCerita.baris`; baris yang
 * dipakai skema tidak diulang di daftar teks.
 */
export interface SkemaLajur {
  jenis: 'lajur';
  jumlah: number;
  /** Rambu: baris dokumen yang isinya tulisan rambu + warna papan. */
  rambu: readonly { baris: number; warna: string }[];
  /** Baris keterangan penomoran lajur (keterangan di bawah diagram). */
  penomoran: number;
  /** Posisi kendaraan: nomor lajur (1 = paling kiri) + baris keterangannya (sumber keterangan). */
  posisi: { lajur: number; baris: number };
  /** Label kendaraan di diagram (mis. "Truk Pak Hendra"). */
  kendaraan: KunciTeks;
}

/** Klasifikasi naskah satu alternatif keputusan (bukan skor: dipakai ringkasan akhir). */
export type NilaiAlternatif = 'tepat' | 'kurang' | 'keliru';

export interface TitikKeputusan {
  /** Id stabil ('k01'); tanda pilihan = `kep:<id>:<alternatif>`. */
  id: string;
  /** Nomor keputusan di naskah (1..n). */
  nomor: number;
  judul: KunciTeks;
  /** Alternatif naskah (urut naskah A-E): id -> ringkasan tindakan + klasifikasi. */
  alternatif: Record<string, { label: KunciTeks; nilai: NilaiAlternatif }>;
  /** Id alternatif yang disarankan naskah. */
  saran: string;
  /** Alasan mentor (ringkasan akhir). */
  alasan: KunciTeks;
}

// ------------------------------------------------------------------ state & aksi

export type EntriRiwayat =
  | { jenis: 'bab'; bab: IdBab }
  | { jenis: 'baris'; node: IdNode; siapa: IdPembicara; ekspresi?: Ekspresi; teks: KunciTeks }
  | { jenis: 'pilihan'; node: IdNode; pilihan: string; teks: KunciTeks }
  /** `nilai` = kepercayaan SESUDAH efek ini (dijepit); tidak ada pada simpanan lama. Dipakai grafik status akhir. */
  | { jenis: 'alasan'; node: IdNode; teks: KunciTeks; arah: 'naik' | 'turun' | 'tetap'; nilai?: number }
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
