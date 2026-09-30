/**
 * EPISODE AUTO-1 "Baret di Parkiran" - graf cerita (docs/rancangan-mode-cerita.md bagian 3 & 3.1).
 *
 * Id node, bab, pilihan, tanda, dan efek mengikuti tabel 3.1 PERSIS; kalimatnya ada di teks.id.ts
 * (kunci '<node>.<n>', '<node>.<pilihan>', '<node>.<pilihan>.alasan', '<node>.hasil.<n>.<m>').
 * Aktivitas (misi sintetis + rubrik klien): aktivitas.ts.
 *
 * Tanda yang dipakai: dengar-dulu, langsung-prosedur, janji-awal, pulih-komunikasi, cerita-singkat,
 * perbaiki-dulu, bukti-seadanya, menolak-awal, bukti-belum-lengkap, janji-polis, janji-waktu, jawab-aturan, rangkum.
 * Tanda hasil aktivitas dipasang mesin: akt:<id>:tepat|sebagian|belum, akt:<id>:pilih:<opsi>, akt:<id>:lewat:<opsi>.
 *
 * Butir catatan `bagian-disimpan` hanya muncul SETELAH Bu Rina menyebutnya: barisnya ada di node
 * b2-cerita-bagian (dicapai lewat cabang b2-cerita-cabang bila `dengar-dulu`), dan node itu yang mencatatnya.
 *
 * Kejelasan `langkah-berikut` HANYA dipasang oleh penutup `b5-tutup/rangkum`, dan hanya bila ringkasan itu
 * benar-benar diterima (node b5-rangkum-jelas): bila janji masih berlaku atau saran "langsung ke bengkel" belum
 * diluruskan, Bu Rina menanggapi ringkasan dengan janji/rencana lamanya (b5-rangkum-janji / -bengkel) dan butir
 * itu tidak dipasang. Jawaban di b5-keberatan (jujur/ralat) tidak menyebut urutan langkah, jadi tidak memasangnya.
 * Akibatnya akhir `tuntas` (yang mensyaratkan `langkah-berikut`) tidak tercapai dengan penutup `singkat`.
 *
 * Revisi naskah v2 (docs/rancangan-mode-cerita.md 11.3-11.5): perkenalan peran hanya di b1-mentor (masalah Bu Rina
 * di baris ke-3), baris yang mengulang dipangkas (kuncinya pensiun di teks.*, simpan.ts menjepit `baris`), istilah
 * ditandai di baris pertama pemakaiannya (`istilah`), dan opsi kartu `ambang-tlo` dipensiunkan dari misi. Id node,
 * pilihan, tanda, dan efek TIDAK berubah, jadi `versi` tetap 1.
 *
 * Adegan v3 (docs/cerita/ADEGAN-AUTO1.md bagian 3-4): cue presentasi (`adegan`) menempel pada baris / node lewat
 * kunci stabil, tidak pernah lewat kalimat; `panggung` = lokasi "Raksa Silver Club" (papan nama & parameter teks
 * {lokasi}) + komposisi awal. Cue hanya dibaca tampilan (ui/adegan.ts); mesin & simpanan tidak berubah, `versi` tetap 1.
 */
import type {
  AturanAkhir, Baris, CueAdegan, Efek, Ekspresi, Episode, Istilah, KonfigPanggung, Kondisi, MaknaAlasan, NodeCerita, Pilihan,
} from '../../tipe';
import { AKTIVITAS_AUTO_1 } from './aktivitas';
import { LOKASI_AUTO_1, TEKS_AUTO_1 } from './teks';

// ------------------------------------------------------------------ pembantu data

type Pembicara = 'nasabah' | 'missRaksa' | 'pemain' | 'narasi';

/**
 * Baris ke-n node (kunci teks '<node>.<n>'). `istilah` = id di ISTILAH yang PERTAMA kali muncul di baris ini
 * (pada jalur yang melewatinya); tampilan memberi tombol "Apa itu …?".
 */
function b(node: string, n: number, siapa: Pembicara, ekspresi?: Ekspresi, jika?: Kondisi, istilah?: string[]): Baris {
  const baris: Baris = { siapa, teks: `${node}.${n}` };
  if (ekspresi) baris.ekspresi = ekspresi;
  if (jika) baris.jika = jika;
  if (istilah?.length) baris.istilah = istilah;
  return baris;
}

/** Pilihan (kunci teks '<node>.<id>'); efek yang mengubah kepercayaan otomatis diberi alasan '<node>.<id>.alasan'. */
function p(node: string, id: string, lanjut: string, efek?: Efek, jika?: Kondisi): Pilihan {
  const pilihan: Pilihan = { id, teks: `${node}.${id}`, lanjut };
  if (efek) pilihan.efek = efek.kepercayaan !== undefined && !efek.alasan ? { ...efek, alasan: `${node}.${id}.alasan` } : efek;
  if (jika) pilihan.jika = jika;
  return pilihan;
}

/** Baris yang membawa cue adegan (v3). */
const dgn = (baris: Baris, adegan: CueAdegan): Baris => ({ ...baris, adegan });

const tanda = (t: string): Kondisi => ({ tanda: t });
const tidak = (k: Kondisi): Kondisi => ({ tidak: k });
const salahSatu = (...k: Kondisi[]): Kondisi => ({ salahSatu: k });
const semua = (...k: Kondisi[]): Kondisi => ({ semua: k });

/** Sudah ada janji sebelum bab menutup (janji-waktu baru bisa muncul di b5-keberatan). */
const ADA_JANJI = salahSatu(tanda('janji-awal'), tanda('janji-polis'));
/** Janji yang masih berlaku setelah b5-keberatan (termasuk janji waktu yang baru dibuat di sana). */
const JANJI_BERLAKU = salahSatu(tanda('janji-awal'), tanda('janji-polis'), tanda('janji-waktu'));
/** Janji soal waktu ("besok pasti bisa dipakai" di awal, atau "besok selesai" di b5-keberatan). */
const JANJI_WAKTU = salahSatu(tanda('janji-awal'), tanda('janji-waktu'));
/** Tiga butir kejelasan yang disyaratkan akhir 'tuntas' (selain kepercayaan >= 3). */
const PAHAM_SEMUA = semua({ paham: 'langkah-berikut' }, { paham: 'polis-dinilai' }, { paham: 'risiko-sendiri' });
/** Risiko sendiri sudah dijelaskan singkat di b4-polis-tepat (hanya bila kartu langsung dibaca tepat). */
const SUDAH_DENGAR_RISIKO: Kondisi = { proses: 'baca-polis', nilai: 'tepat' };
/** Salah satu dari tiga bukti yang dibutuhkan tidak dipilih di aktivitas bukti. */
const ADA_BUKTI_TERLEWAT = salahSatu(tanda('akt:bukti:lewat:foto-full'), tanda('akt:bukti:lewat:foto-penyok'), tanda('akt:bukti:lewat:foto-plat'));
/** Saran "langsung ke bengkel, foto seadanya cukup" tidak pernah diluruskan. */
const SARAN_BENGKEL = tanda('bukti-seadanya');
/**
 * Pemain sempat keliru menjelaskan/menyarankan lalu meluruskannya sendiri (minta maaf di awal, meralat saran
 * bengkel/"tidak usah klaim", membaca ulang kartu, atau menarik janji). Menambah foto yang terlewat (bukti
 * `dikoreksi`) bukan ralat penjelasan, jadi tidak dihitung.
 */
const ADA_RALAT = salahSatu(
  tanda('pulih-komunikasi'),
  { proses: 'dokumentasi-dulu', nilai: 'dikoreksi' },
  { proses: 'baca-polis', nilai: 'dikoreksi' },
  { proses: 'tanpa-janji', nilai: 'dikoreksi' },
);

// ------------------------------------------------------------------ adegan (v3, docs/cerita/ADEGAN-AUTO1.md bagian 3-4)
// Komposisi = lipatan cue (ui/adegan.ts): nilai bertahan sampai cue berikutnya; pose/pandang per baris yang tidak
// ditulis di sini diturunkan dari pembicara (Miss Raksa duduk mendengar / menjelaskan saat serius, tatapan ke lawan
// bicara). `aksi` diputar sekali saat barisnya baru dicapai; komposisi di baris itu = keadaan SESUDAH aksi.

/** Komposisi awal: Miss Raksa berdiri menyambut pemain di sisi petugas, kursi pengunjung kosong, pintu tertutup. */
const PANGGUNG: KonfigPanggung = {
  lokasi: LOKASI_AUTO_1,
  // Slot kosong: belum ada foto fasad Wisma BSG yang teridentifikasi (ADEGAN-AUTO1.md bagian 1 & 5).
  eksterior: null,
  awal: {
    lokasi: 'meja',
    mentor: { pose: 'berdiri-sambut', pandang: 'pemain' },
    nasabah: null,
    prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' },
  },
};

/** b1-mentor.4 (narasi pintu): pintu membuka, Bu Rina masuk membawa kunci, Miss Raksa menoleh & mempersilakan; keduanya duduk, kunci ke meja. */
const MASUK: CueAdegan = {
  aksi: 'masuk',
  mentor: { pose: 'duduk-dengar', pandang: 'lawan' },
  nasabah: { pose: 'duduk', pandang: 'pemain', lewatTelepon: false },
  prop: { kunci: 'meja' },
};
/** Bab 3 (node latar parkiran): keduanya berdiri dekat mobil; kunci di tangan Bu Rina (bagasi). */
const DI_PARKIRAN: CueAdegan = {
  lokasi: 'parkiran',
  mentor: { pose: 'berdiri' },
  nasabah: { pose: 'berdiri', lewatTelepon: false },
  prop: { kunci: 'tangan', kartu: 'tersimpan' },
};
/** b3-bukti-intro.1 "Kalian keluar ke parkiran kantor.": pindah lokasi. */
const KE_PARKIRAN: CueAdegan = { lokasi: 'parkiran', aksi: 'pindah' };
/** b3-seadanya (tetap di kantor): Bu Rina bersiap ke bengkel, condong ke depan, kunci di tangan. */
const BERSIAP_PERGI: CueAdegan = { lokasi: 'meja', nasabah: { pose: 'duduk-condong', lewatTelepon: false }, prop: { kunci: 'tangan' } };
/** Bab 4 dimulai di meja layanan (kembali dari parkiran / Bu Rina duduk lagi sebentar): keduanya duduk, kunci di meja. */
const DI_MEJA: CueAdegan = {
  lokasi: 'meja',
  mentor: { pose: 'duduk-dengar' },
  nasabah: { pose: 'duduk', lewatTelepon: false },
  prop: { kunci: 'meja' },
};
/** b4-polis-intro.1/.2 (narasi membuka kartu): kartu polis ke tengah meja, Miss Raksa menunjuk, keduanya melihat kartu. */
const BUKA_KARTU: CueAdegan = {
  aksi: 'kartu',
  mentor: { pose: 'duduk-tunjuk', pandang: 'bawah' },
  nasabah: { pandang: 'bawah' },
  prop: { kartu: 'meja' },
};
/** Baris Miss Raksa yang ditujukan kepada Bu Rina (bukan bisikan ke pemain): ia menatap Bu Rina, Bu Rina menatapnya. */
const KE_NASABAH: CueAdegan = { mentor: { pandang: 'lawan' } };
/** Narasi pergi (akhir-pergi.3/.4, akhir-dingin.3): Bu Rina berdiri, berjalan ke pintu, keluar; kursi kosong sesudahnya. */
const PERGI: CueAdegan = { aksi: 'pergi', nasabah: null, prop: { kunci: 'tangan' } };
/**
 * Narasi waktu berlalu (akhir-tertunda.1/.4): pergantian adegan, kursi pengunjung kosong; Bu Rina tidak lagi di kantor
 * (bicara berikutnya hanya lewat telepon). `pindah` = transisi adegan (waktu), lokasi tetap meja.
 */
const WAKTU_BERLALU: CueAdegan = {
  aksi: 'pindah',
  mentor: { pose: 'duduk-dengar', pandang: 'depan' },
  nasabah: null,
  prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' },
};
/** akhir-janji.2 "Beberapa hari kemudian, Bu Rina menelepon.": kantor, kursi kosong, Miss Raksa mengangkat telepon. */
const TELEPON_MASUK: CueAdegan = {
  lokasi: 'telepon',
  aksi: 'pindah',
  mentor: { pose: 'telepon', pandang: 'depan' },
  nasabah: { pose: 'telepon', pandang: 'depan', lewatTelepon: true },
  prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'tangan' },
};
/** Ucapan Bu Rina sesudah waktu berlalu (akhir-tertunda.3/.5/.7): hanya lewat telepon. */
const LEWAT_TELEPON: CueAdegan = {
  lokasi: 'telepon',
  mentor: { pose: 'telepon' },
  nasabah: { pose: 'telepon', lewatTelepon: true },
  prop: { telepon: 'tangan' },
};
/** Pesan Miss Raksa sesudah telepon (akhir-janji.5, akhir-tertunda.6): gagang diletakkan, bicara kepada pemain. */
const TELEPON_SELESAI: CueAdegan = { mentor: { pose: 'duduk-dengar' }, nasabah: null, prop: { telepon: 'meja' } };

// ------------------------------------------------------------------ node

const NODE: NodeCerita[] = [
  // ================================================================ BAB 1 - MENYAMBUT
  {
    id: 'b1-mentor',
    bab: 'menyambut',
    latar: 'kantor',
    jenis: 'dialog',
    // Satu kalimat peran (bertugas di meja layanan {lokasi}, didampingi mentor, simulasi), lalu pintu terbuka: masalah
    // Bu Rina = baris ke-3. .2 dan .3 pensiun (v2): tugas & catatan simulasi kini di kartu aktivitas / layar akhir.
    // v3: .1 tanpa istilah (nasabah & klaim ditandai di baris pertama yang benar-benar memakainya); .4 = cue masuk.
    baris: [
      b('b1-mentor', 1, 'missRaksa', 'tersenyum'),
      dgn(b('b1-mentor', 4, 'narasi', undefined, undefined, ['nasabah']), MASUK),
    ],
    lanjut: 'b1-datang',
  },
  {
    id: 'b1-datang',
    bab: 'menyambut',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [b('b1-datang', 1, 'nasabah', 'kesal'), b('b1-datang', 2, 'nasabah', 'cemas')],
    tanya: 'b1-datang.tanya',
    pilihan: [
      p('b1-datang', 'prosedur', 'b1-pulih', { kepercayaan: -1, pasang: ['langsung-prosedur'], catat: ['masalah', 'kebutuhan'] }),
      p('b1-datang', 'dengar', 'b2-cerita', {
        kepercayaan: 2,
        pasang: ['dengar-dulu'],
        catat: ['masalah', 'kebutuhan'],
      }),
      p('b1-datang', 'janji', 'b2-cerita', {
        kepercayaan: 1,
        pasang: ['janji-awal'],
        proses: { 'tanpa-janji': 'keliru' },
        catat: ['masalah', 'kebutuhan'],
      }),
    ],
  },
  {
    id: 'b1-pulih',
    bab: 'menyambut',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [b('b1-pulih', 1, 'nasabah', 'kesal'), b('b1-pulih', 2, 'missRaksa', 'serius')],
    tanya: 'b1-pulih.tanya',
    pilihan: [
      p('b1-pulih', 'maaf', 'b2-cerita', {
        kepercayaan: 2,
        pasang: ['pulih-komunikasi', 'dengar-dulu'],
      }),
      p('b1-pulih', 'tetap', 'b2-singkat', { kepercayaan: -1, pasang: ['cerita-singkat'] }),
    ],
  },

  // ================================================================ BAB 2 - MENGGALI
  {
    id: 'b2-cerita',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [
      b('b2-cerita', 1, 'nasabah', 'lega', tanda('janji-awal')),
      b('b2-cerita', 2, 'nasabah', 'netral', tanda('pulih-komunikasi')),
      b('b2-cerita', 3, 'nasabah', 'lega', semua(tanda('dengar-dulu'), tidak(tanda('pulih-komunikasi')))),
      // .4 (kronologi yang mengulang b1-datang) pensiun; .5 kini memuat belanja, foto HP, dan rencana bengkel.
      b('b2-cerita', 5, 'nasabah'),
    ],
    efek: { catat: ['rencana-bengkel'] },
    lanjut: 'b2-cerita-cabang',
  },
  // Didengar lebih dulu -> Bu Rina menambah detail (pecahan lampu yang ia simpan). Dicatat setelah ia menyebutnya.
  {
    id: 'b2-cerita-cabang',
    bab: 'menggali',
    jenis: 'cabang',
    cabang: [{ jika: tanda('dengar-dulu'), lanjut: 'b2-cerita-bagian' }],
    lainnya: 'b2-saran',
  },
  {
    id: 'b2-cerita-bagian',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [b('b2-cerita', 6, 'nasabah', 'netral')],
    efek: { catat: ['bagian-disimpan'] },
    lanjut: 'b2-saran',
  },
  {
    id: 'b2-singkat',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'dialog',
    // .1 pensiun (mengulang b1-datang.1 kata per kata); jawaban seperlunya tetap terlihat di .2.
    baris: [b('b2-singkat', 2, 'nasabah', 'kesal')],
    efek: { catat: ['rencana-bengkel'] },
    lanjut: 'b2-saran',
  },
  {
    id: 'b2-saran',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [
      b('b2-saran', 1, 'nasabah', 'kesal', tanda('cerita-singkat'), ['klaim']),
      b('b2-saran', 2, 'nasabah', 'cemas', tidak(tanda('cerita-singkat')), ['klaim']),
    ],
    tanya: 'b2-saran.tanya',
    pilihan: [
      p('b2-saran', 'bengkel', 'b2-bengkel-akibat', {
        kepercayaan: 1,
        pasang: ['perbaiki-dulu'],
        proses: { 'dokumentasi-dulu': 'keliru' },
      }),
      p('b2-saran', 'dokumentasi', 'b3-bukti-intro', {
        kepercayaan: 1,
        proses: { 'dokumentasi-dulu': 'tepat' },
        paham: ['langkah-sekarang'],
      }),
      p('b2-saran', 'ringan', 'b2-ringan-akibat', { kepercayaan: -1, proses: { 'dokumentasi-dulu': 'keliru' } }),
    ],
  },
  {
    id: 'b2-bengkel-akibat',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [b('b2-bengkel-akibat', 1, 'missRaksa', 'serius'), b('b2-bengkel-akibat', 2, 'nasabah', 'bingung')],
    tanya: 'b2-bengkel-akibat.tanya',
    pilihan: [
      p('b2-bengkel-akibat', 'biarkan', 'b3-seadanya', {
        kepercayaan: 0,
        pasang: ['bukti-seadanya'],
        proses: { bukti: 'keliru' },
      }),
      p('b2-bengkel-akibat', 'koreksi', 'b3-bukti-intro', {
        kepercayaan: 0,
        cabut: ['perbaiki-dulu'],
        proses: { 'dokumentasi-dulu': 'dikoreksi' },
        paham: ['langkah-sekarang'],
      }),
    ],
  },
  {
    id: 'b2-ringan-akibat',
    bab: 'menggali',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [b('b2-ringan-akibat', 1, 'nasabah', 'kesal'), b('b2-ringan-akibat', 2, 'missRaksa', 'serius')],
    tanya: 'b2-ringan-akibat.tanya',
    pilihan: [
      p('b2-ringan-akibat', 'lihat-dulu', 'b3-bukti-intro', {
        kepercayaan: 1,
        proses: { 'dokumentasi-dulu': 'dikoreksi' },
        paham: ['langkah-sekarang'],
      }),
      p('b2-ringan-akibat', 'tetap-ringan', 'akhir-pergi', { kepercayaan: -2, pasang: ['menolak-awal'] }),
    ],
  },

  // ================================================================ BAB 3 - BUKTI
  {
    id: 'b3-bukti-intro',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'dialog',
    baris: [
      dgn(b('b3-bukti-intro', 1, 'narasi'), KE_PARKIRAN),
      dgn(b('b3-bukti-intro', 2, 'missRaksa', 'tersenyum', tanda('dengar-dulu')), KE_NASABAH),
      b('b3-bukti-intro', 3, 'nasabah', 'kesal', tanda('cerita-singkat')),
      // .4 pensiun: mengulang tugas di kartu aktivitas (isinya kini petunjuk aktivitas `akt.bukti.petunjuk`).
    ],
    lanjut: 'b3-bukti',
  },
  {
    id: 'b3-bukti',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'aktivitas',
    aktivitas: 'bukti',
    baris: [b('b3-bukti', 1, 'nasabah', 'netral')],
    hasil: [
      {
        jika: tanda('akt:bukti:tepat'),
        efek: { proses: { bukti: 'tepat' }, catat: ['bukti'] },
        umpanBalik: [{ siapa: 'missRaksa', ekspresi: 'tersenyum', teks: 'b3-bukti.hasil.1.1' }],
        lanjut: 'b3-bukti-tepat',
      },
      {
        // lainnya (sebagian / belum): SATU kalimat mentor tentang akibatnya. Foto mana yang terlewat / tidak membantu
        // beserta alasannya tampil per foto di panel umpan balik (DefAktivitas.alasanOpsi), jadi tidak diulang di sini
        // (v2 11.5; baris lama 2.1-2.3 per foto dipensiunkan). 2.4 hanya untuk kiriman >3 foto tanpa bukti terlewat
        // (tidak bisa lewat UI, tetapi sah bagi mesin).
        efek: { proses: { bukti: 'keliru' }, catat: ['bukti'] },
        umpanBalik: [
          { siapa: 'missRaksa', ekspresi: 'netral', teks: 'b3-bukti.hasil.2.5', jika: ADA_BUKTI_TERLEWAT },
          { siapa: 'missRaksa', ekspresi: 'netral', teks: 'b3-bukti.hasil.2.4', jika: tidak(ADA_BUKTI_TERLEWAT) },
        ],
        lanjut: 'b3-bukti-kurang',
      },
    ],
  },
  {
    id: 'b3-bukti-tepat',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'dialog',
    baris: [
      b('b3-bukti-tepat', 1, 'nasabah', 'bingung'),
      dgn(b('b3-bukti-tepat', 2, 'missRaksa', 'tersenyum'), KE_NASABAH),
      b('b3-bukti-tepat', 3, 'nasabah', 'netral'),
    ],
    lanjut: 'b4-polis-intro',
  },
  {
    id: 'b3-bukti-kurang',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'pilihan',
    baris: [b('b3-bukti-kurang', 1, 'nasabah', 'cemas')],
    tanya: 'b3-bukti-kurang.tanya',
    pilihan: [
      p('b3-bukti-kurang', 'lengkapi', 'b3-lengkapi', { kepercayaan: 0, proses: { bukti: 'dikoreksi' } }),
      p('b3-bukti-kurang', 'cukup', 'b3-cukup', { kepercayaan: 0, pasang: ['bukti-belum-lengkap'] }),
    ],
  },
  // Foto yang terlewat benar-benar ditambahkan (narasi menyebut ketiga bukti) dan Catatan kasus diperbarui.
  {
    id: 'b3-lengkapi',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'dialog',
    baris: [b('b3-lengkapi', 1, 'narasi'), b('b3-lengkapi', 2, 'nasabah', 'netral')],
    efek: { catat: ['bukti-lengkap'] },
    lanjut: 'b4-polis-intro',
  },
  // Laporan jalan dengan foto yang ada: Bu Rina lega, Miss Raksa menyebut akibatnya bagi nasabah.
  {
    id: 'b3-cukup',
    bab: 'bukti',
    latar: 'parkiran',
    adegan: DI_PARKIRAN,
    jenis: 'dialog',
    baris: [b('b3-cukup', 1, 'nasabah', 'lega'), b('b3-cukup', 2, 'missRaksa', 'serius')],
    efek: { catat: ['bukti-kurang'] },
    lanjut: 'b4-polis-intro',
  },
  {
    id: 'b3-seadanya',
    bab: 'bukti',
    latar: 'kantor',
    // Tidak ke parkiran: tetap di meja, Bu Rina bersiap ke bengkel.
    adegan: BERSIAP_PERGI,
    jenis: 'dialog',
    baris: [b('b3-seadanya', 1, 'nasabah', 'lega'), b('b3-seadanya', 2, 'narasi')],
    lanjut: 'b4-polis-intro',
  },

  // ================================================================ BAB 4 - POLIS
  {
    id: 'b4-polis-intro',
    bab: 'polis',
    latar: 'kantor',
    // Kembali ke meja (dari parkiran) / Bu Rina duduk lagi sebentar (jalur seadanya). Perpindahan lokasi terlihat dari
    // `lokasi` yang berubah; aksi baris .1/.2 = kartu.
    adegan: DI_MEJA,
    jenis: 'dialog',
    baris: [
      // Tepat satu dari .1/.2 tampil; keduanya baris pertama yang memakai "polis" & "Comprehensive" di jalurnya.
      dgn(b('b4-polis-intro', 1, 'narasi', undefined, tidak(tanda('bukti-seadanya')), ['polis', 'comprehensive']), BUKA_KARTU),
      dgn(b('b4-polis-intro', 2, 'narasi', undefined, tanda('bukti-seadanya'), ['polis', 'comprehensive']), BUKA_KARTU),
      b('b4-polis-intro', 3, 'nasabah', 'lega', tanda('janji-awal')),
      b('b4-polis-intro', 4, 'nasabah', 'cemas', tidak(tanda('janji-awal'))),
    ],
    lanjut: 'b4-polis',
  },
  {
    id: 'b4-polis',
    bab: 'polis',
    latar: 'kantor',
    jenis: 'aktivitas',
    aktivitas: 'polis',
    // Baris node aktivitas tampil di kartu aktivitas (tanpa tombol istilah), jadi istilah ditandai di b4-polis-intro.
    baris: [b('b4-polis', 1, 'missRaksa', 'netral')],
    hasil: [
      {
        jika: tanda('akt:polis:pilih:bisa-dinilai'),
        efek: {
          kepercayaan: 1,
          alasan: 'b4-polis.hasil.1.alasan',
          proses: { 'baca-polis': 'tepat' },
          paham: ['polis-dinilai'],
          catat: ['polis'],
        },
        umpanBalik: [
          { siapa: 'nasabah', ekspresi: 'netral', teks: 'b4-polis.hasil.1.1' },
          { siapa: 'missRaksa', ekspresi: 'tersenyum', teks: 'b4-polis.hasil.1.2' },
        ],
        lanjut: 'b4-polis-tepat',
      },
      // Semua cabang mencatat 'polis': isi kartu (bukan tafsiran pemain) tetap bisa dibaca ulang di Catatan kasus,
      // termasuk di node pemulihan (b4-polis-salah: "baca lagi baris Kerusakan benturan"; b5-keberatan/ralat-polis).
      {
        jika: tanda('akt:polis:pilih:pasti-diganti'),
        efek: {
          kepercayaan: 1,
          alasan: 'b4-polis.hasil.2.alasan',
          pasang: ['janji-polis'],
          proses: { 'baca-polis': 'keliru', 'tanpa-janji': 'keliru' },
          catat: ['polis'],
        },
        umpanBalik: [
          { siapa: 'nasabah', ekspresi: 'senang', teks: 'b4-polis.hasil.2.1' },
          { siapa: 'missRaksa', ekspresi: 'serius', teks: 'b4-polis.hasil.2.2' },
        ],
        lanjut: 'b4-polis-janji',
      },
      {
        jika: tanda('akt:polis:pilih:tidak-tercakup'),
        efek: { kepercayaan: -2, alasan: 'b4-polis.hasil.3.alasan', proses: { 'baca-polis': 'keliru' }, catat: ['polis'] },
        umpanBalik: [{ siapa: 'nasabah', ekspresi: 'kesal', teks: 'b4-polis.hasil.3.1' }],
        lanjut: 'b4-polis-salah',
      },
      {
        // Cadangan: jawaban kosong / tak cocok. Opsi `ambang-tlo` sudah pensiun dari misi (v2); cabang ini & baris .1
        // tetap ada supaya simpanan lama yang sedang menampilkan umpan balik opsi itu masih benar
        // (aktivitas.ts OPSI_POLIS_PENSIUN, validasi.ts `opsiPensiun`).
        efek: { kepercayaan: -1, alasan: 'b4-polis.hasil.4.alasan', proses: { 'baca-polis': 'keliru' }, catat: ['polis'] },
        umpanBalik: [
          { siapa: 'nasabah', ekspresi: 'bingung', teks: 'b4-polis.hasil.4.1', jika: tanda('akt:polis:pilih:ambang-tlo') },
          { siapa: 'nasabah', ekspresi: 'bingung', teks: 'b4-polis.hasil.4.2', jika: tidak(tanda('akt:polis:pilih:ambang-tlo')) },
        ],
        lanjut: 'b4-polis-salah',
      },
    ],
  },
  {
    id: 'b4-polis-tepat',
    bab: 'polis',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [
      b('b4-polis-tepat', 1, 'nasabah', 'bingung', undefined, ['risiko-sendiri']),
      b('b4-polis-tepat', 2, 'pemain'),
      b('b4-polis-tepat', 3, 'nasabah', 'cemas'),
    ],
    lanjut: 'b5-keberatan',
  },
  {
    id: 'b4-polis-janji',
    bab: 'polis',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [b('b4-polis-janji', 1, 'nasabah', 'senang'), b('b4-polis-janji', 2, 'narasi')],
    lanjut: 'b5-keberatan',
  },
  {
    id: 'b4-polis-salah',
    bab: 'polis',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [b('b4-polis-salah', 1, 'missRaksa', 'serius'), b('b4-polis-salah', 2, 'nasabah', 'kesal')],
    tanya: 'b4-polis-salah.tanya',
    pilihan: [
      p('b4-polis-salah', 'bertahan', 'akhir-pergi', { kepercayaan: -2 }),
      p('b4-polis-salah', 'baca-ulang', 'b5-keberatan', {
        kepercayaan: 1,
        proses: { 'baca-polis': 'dikoreksi' },
        paham: ['polis-dinilai'],
        catat: ['polis'],
      }),
    ],
  },

  // ================================================================ BAB 5 - MENUTUP
  {
    id: 'b5-keberatan',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [
      // Ada janji sebelumnya: "Tadi katanya pasti..."
      b('b5-keberatan', 1, 'nasabah', 'senang', tanda('janji-polis')),
      b('b5-keberatan', 2, 'nasabah', 'lega', semua(tanda('janji-awal'), tidak(tanda('janji-polis')))),
      // Risiko sendiri belum pernah disebut (kartu tidak langsung dibaca tepat): .4/.7 = baris pertama istilahnya.
      b('b5-keberatan', 3, 'nasabah', 'netral', semua(ADA_JANJI, SUDAH_DENGAR_RISIKO)),
      b('b5-keberatan', 4, 'nasabah', 'netral', semua(ADA_JANJI, tidak(SUDAH_DENGAR_RISIKO)), ['risiko-sendiri']),
      // Tanpa janji: kapan beres & kenapa ada risiko sendiri. Bila saran "langsung ke bengkel" dibiarkan,
      // mobil sudah akan diperbaiki siang ini, jadi yang ia tanyakan adalah klaimnya.
      b('b5-keberatan', 5, 'nasabah', 'cemas', semua(tidak(ADA_JANJI), tidak(SARAN_BENGKEL))),
      // v3: baris dialog pertama yang memakai kata "klaim" (jalur bengkel + biarkan) -> tombol "Apa itu klaim?".
      b('b5-keberatan', 8, 'nasabah', 'cemas', semua(tidak(ADA_JANJI), SARAN_BENGKEL), ['klaim']),
      b('b5-keberatan', 6, 'nasabah', 'bingung', semua(tidak(ADA_JANJI), SUDAH_DENGAR_RISIKO)),
      b('b5-keberatan', 7, 'nasabah', 'bingung', semua(tidak(ADA_JANJI), tidak(SUDAH_DENGAR_RISIKO)), ['risiko-sendiri']),
    ],
    tanya: 'b5-keberatan.tanya',
    pilihan: [
      p('b5-keberatan', 'janjikan', 'b5-tutup', { kepercayaan: 1, pasang: ['janji-waktu'], proses: { 'tanpa-janji': 'keliru' } }),
      // Menunjuk aturan tanpa menjelaskan: langkah klaimnya tidak keliru (tidak ada janji), komunikasinya yang
      // buruk. Tanpa janji sebelumnya, butir "tidak menjanjikan" = tepat; bila janji lama masih berlaku, janji itu
      // tidak diluruskan sehingga butir tetap keliru (pilihan `aturan-janji`, kalimat sama).
      p('b5-keberatan', 'aturan', 'b5-tutup', { kepercayaan: -2, pasang: ['jawab-aturan'], proses: { 'tanpa-janji': 'tepat' } }, tidak(ADA_JANJI)),
      p('b5-keberatan', 'aturan-janji', 'b5-tutup', { kepercayaan: -2, pasang: ['jawab-aturan'] }, ADA_JANJI),
      // Jawaban jujur menyebut pemeriksaan, waktu yang belum pasti, dan risiko sendiri; urutan langkah
      // berikutnya baru dirangkum di b5-tutup (butir `langkah-berikut` TIDAK dipasang di sini).
      p(
        'b5-keberatan',
        'jujur',
        'b5-tutup',
        { kepercayaan: 1, paham: ['risiko-sendiri'], proses: { 'tanpa-janji': 'tepat' } },
        tidak(ADA_JANJI),
      ),
      // Janji di awal (kartu dibaca tepat): meluruskan janji hasil & waktu.
      p(
        'b5-keberatan',
        'ralat-janji',
        'b5-tutup',
        {
          kepercayaan: -1,
          cabut: ['janji-awal', 'janji-polis', 'janji-waktu'],
          paham: ['risiko-sendiri'],
          proses: { 'tanpa-janji': 'dikoreksi' },
        },
        semua(tanda('janji-awal'), tidak(tanda('janji-polis'))),
      ),
      // Kartu polis sempat dijelaskan "pasti diganti": meluruskan isi kartunya juga, jadi nasabah
      // kini paham kerusakannya dinilai sesuai syarat kartu (jalur pemulihan bisa berakhir baik bila ditutup
      // dengan ringkasan langkah).
      p(
        'b5-keberatan',
        'ralat-polis',
        'b5-tutup',
        {
          kepercayaan: -1,
          cabut: ['janji-awal', 'janji-polis', 'janji-waktu'],
          paham: ['polis-dinilai', 'risiko-sendiri'],
          proses: { 'tanpa-janji': 'dikoreksi', 'baca-polis': 'dikoreksi' },
        },
        tanda('janji-polis'),
      ),
    ],
  },
  {
    id: 'b5-tutup',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'pilihan',
    baris: [
      // Reaksi atas jawaban di b5-keberatan.
      b('b5-tutup', 1, 'nasabah', 'senang', tanda('janji-waktu')),
      b('b5-tutup', 2, 'nasabah', 'netral', semua({ proses: 'tanpa-janji', nilai: 'tepat' }, tidak(tanda('jawab-aturan')))),
      b('b5-tutup', 3, 'nasabah', 'kesal', { proses: 'tanpa-janji', nilai: 'dikoreksi' }),
      b('b5-tutup', 4, 'nasabah', 'kesal', tanda('jawab-aturan')),
      b('b5-tutup', 5, 'nasabah'),
    ],
    tanya: 'b5-tutup.tanya',
    pilihan: [
      p('b5-tutup', 'rangkum', 'b5-rangkum', { kepercayaan: 1, pasang: ['rangkum'] }),
      p('b5-tutup', 'singkat', 'cabang-akhir', { kepercayaan: -1 }),
    ],
  },
  // Tanggapan Bu Rina atas ringkasan: hanya bila tidak ada janji / saran bengkel yang menggantung, ringkasan
  // itu diterima dan ia paham langkah berikutnya.
  {
    id: 'b5-rangkum',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'cabang',
    cabang: [
      { jika: SARAN_BENGKEL, lanjut: 'b5-rangkum-bengkel' },
      { jika: JANJI_BERLAKU, lanjut: 'b5-rangkum-janji' },
    ],
    lainnya: 'b5-rangkum-jelas',
  },
  {
    id: 'b5-rangkum-jelas',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [b('b5-rangkum', 1, 'nasabah', 'netral')],
    efek: { paham: ['langkah-berikut'] },
    lanjut: 'cabang-akhir',
  },
  {
    id: 'b5-rangkum-janji',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [
      b('b5-rangkum', 2, 'nasabah', 'senang', JANJI_WAKTU),
      b('b5-rangkum', 3, 'nasabah', 'senang', semua(tanda('janji-polis'), tidak(JANJI_WAKTU))),
    ],
    lanjut: 'cabang-akhir',
  },
  {
    id: 'b5-rangkum-bengkel',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'dialog',
    baris: [b('b5-rangkum', 4, 'nasabah', 'bingung')],
    lanjut: 'cabang-akhir',
  },
  {
    id: 'cabang-akhir',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'cabang',
    cabang: [
      { jika: salahSatu(SARAN_BENGKEL, tanda('bukti-belum-lengkap')), lanjut: 'akhir-tertunda' },
      { jika: JANJI_BERLAKU, lanjut: 'akhir-janji' },
      // PAHAM_SEMUA memuat `langkah-berikut`, yang hanya dipasang b5-rangkum-jelas (penutup `rangkum`).
      { jika: semua({ kepercayaan: { min: 3 } }, PAHAM_SEMUA), lanjut: 'akhir-tuntas' },
    ],
    lainnya: 'akhir-dingin',
  },

  // ================================================================ AKHIR
  {
    id: 'akhir-tuntas',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'akhir',
    akhir: 'tuntas',
    baris: [
      b('akhir-tuntas', 1, 'nasabah', 'lega'),
      // "Sudah jelas dari awal" hanya bila tidak ada yang perlu diluruskan; selain itu ia berterima kasih atas ralatnya.
      b('akhir-tuntas', 2, 'nasabah', 'tersenyum', tidak(ADA_RALAT)),
      b('akhir-tuntas', 6, 'nasabah', 'tersenyum', ADA_RALAT),
      b('akhir-tuntas', 3, 'missRaksa', 'tersenyum', tanda('pulih-komunikasi')),
      b('akhir-tuntas', 4, 'missRaksa', 'tersenyum', { proses: 'tanpa-janji', nilai: 'dikoreksi' }),
      b(
        'akhir-tuntas',
        5,
        'missRaksa',
        'tersenyum',
        semua(tidak(tanda('pulih-komunikasi')), tidak({ proses: 'tanpa-janji', nilai: 'dikoreksi' })),
      ),
    ],
  },
  {
    id: 'akhir-janji',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'akhir',
    akhir: 'janji',
    baris: [
      b('akhir-janji', 1, 'nasabah', 'senang'),
      // "Beberapa hari kemudian, Bu Rina menelepon.": kursi kosong, .3/.4 hanya lewat telepon.
      dgn(b('akhir-janji', 2, 'narasi'), TELEPON_MASUK),
      b('akhir-janji', 3, 'nasabah', 'kesal', JANJI_WAKTU),
      b('akhir-janji', 4, 'nasabah', 'kesal', tidak(JANJI_WAKTU)),
      dgn(b('akhir-janji', 5, 'missRaksa', 'serius'), TELEPON_SELESAI),
    ],
  },
  {
    id: 'akhir-dingin',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'akhir',
    akhir: 'dingin',
    baris: [
      b('akhir-dingin', 1, 'nasabah', 'kesal', { kepercayaan: { maks: 0 } }),
      b('akhir-dingin', 2, 'nasabah', 'netral', { kepercayaan: { min: 1 } }),
      // "... ia pergi dengan dahi masih berkerut.": Bu Rina keluar lewat pintu; pesan mentor sesudahnya di kursi kosong.
      dgn(b('akhir-dingin', 3, 'narasi'), PERGI),
      // Pesan mentor sesuai penyebabnya (tepat satu yang tampil):
      //  .6 ditutup "nanti dikabari" -> ia tidak tahu langkah berikutnya;
      //  .4 sudah dirangkum, tetapi hal lain belum dijelaskan (mis. risiko sendiri saat menunjuk aturan);
      //  .5 sudah paham semuanya, tetapi kepercayaan kurang (ia belum merasa didengar).
      b('akhir-dingin', 6, 'missRaksa', 'netral', tidak(tanda('rangkum'))),
      b('akhir-dingin', 4, 'missRaksa', 'netral', semua(tanda('rangkum'), tidak(PAHAM_SEMUA))),
      b('akhir-dingin', 5, 'missRaksa', 'netral', semua(tanda('rangkum'), PAHAM_SEMUA)),
    ],
  },
  {
    id: 'akhir-tertunda',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'akhir',
    akhir: 'tertunda',
    // Adegan: narasi .1/.4 = waktu berlalu (kursi kosong); ucapan Bu Rina sesudahnya hanya lewat telepon.
    baris: [
      // Jalur bengkel + biarkan: mobil sudah diperbaiki, kondisi awal tak bisa diulang.
      dgn(b('akhir-tertunda', 1, 'narasi', undefined, tanda('bukti-seadanya')), WAKTU_BERLALU),
      b('akhir-tertunda', 2, 'narasi', undefined, tanda('bukti-seadanya')),
      dgn(b('akhir-tertunda', 3, 'nasabah', 'kesal', tanda('bukti-seadanya')), LEWAT_TELEPON),
      // Jalur bukti kurang + cukup. Bila ditutup dengan ringkasan, ia setidaknya sudah tahu akan dikabari.
      dgn(b('akhir-tertunda', 4, 'narasi', undefined, tidak(tanda('bukti-seadanya'))), WAKTU_BERLALU),
      dgn(b('akhir-tertunda', 5, 'nasabah', 'kesal', semua(tidak(tanda('bukti-seadanya')), tidak(tanda('rangkum')))), LEWAT_TELEPON),
      dgn(b('akhir-tertunda', 7, 'nasabah', 'kesal', semua(tidak(tanda('bukti-seadanya')), tanda('rangkum'))), LEWAT_TELEPON),
      // v3: satu-satunya baris dialog yang memakai kata "nasabah" -> tombol "Apa itu nasabah?".
      dgn(b('akhir-tertunda', 6, 'missRaksa', 'serius', undefined, ['nasabah']), TELEPON_SELESAI),
    ],
  },
  {
    id: 'akhir-pergi',
    bab: 'menutup',
    latar: 'kantor',
    jenis: 'akhir',
    akhir: 'pergi',
    baris: [
      b('akhir-pergi', 1, 'nasabah', 'kesal', tanda('menolak-awal')),
      b('akhir-pergi', 2, 'nasabah', 'kesal', tidak(tanda('menolak-awal'))),
      // Narasi pergi: Bu Rina keluar lewat pintu; pesan mentor sesudahnya di kursi kosong.
      dgn(b('akhir-pergi', 3, 'narasi', undefined, tanda('menolak-awal')), PERGI),
      dgn(b('akhir-pergi', 4, 'narasi', undefined, tidak(tanda('menolak-awal'))), PERGI),
      b('akhir-pergi', 5, 'missRaksa', 'serius', tanda('menolak-awal')),
      b('akhir-pergi', 6, 'missRaksa', 'serius', tidak(tanda('menolak-awal'))),
    ],
  },
];

// ------------------------------------------------------------------ kartu akhir (v2) & makna alasan

const dikoreksi = (proses: string): Kondisi => ({ proses, nilai: 'dikoreksi' });

/** Aturan satu kartu akhir; kunci teks 'kartu.<id>.sebab|pelajaran', judul bisa dipakai bersama. */
function aturan(id: string, akhir: string, judul: string, lain: Omit<AturanAkhir, 'id' | 'akhir' | 'judul' | 'sebab' | 'pelajaran'> = {}): AturanAkhir {
  return { id, akhir, judul: `kartu.${judul}.judul`, sebab: `kartu.${id}.sebab`, pelajaran: `kartu.${id}.pelajaran`, ...lain };
}

/**
 * Kartu akhir (docs/rancangan-mode-cerita.md bagian 11). Urutan PENTING: aturan pertama yang cocok dipakai.
 * Tiap akhir diakhiri aturan tanpa `jika` (cadangan) dan urutannya mengikuti baris epilog, jadi kalimat kartu
 * tidak pernah bertentangan dengan epilog yang baru dibaca (mis. janji waktu lebih dulu daripada janji polis,
 * sama seperti akhir-janji.3/.4). Titik ulang = bab tempat keputusan penyebabnya bisa diubah.
 */
const KARTU_AKHIR: AturanAkhir[] = [
  // tuntas: ralat yang paling berpengaruh ditonjolkan; tidak ada langkah keliru yang tersisa di akhir ini.
  aturan('tuntas-ralat-janji', 'tuntas', 'tuntas', { jika: dikoreksi('tanpa-janji') }),
  aturan('tuntas-baca-ulang', 'tuntas', 'tuntas', { jika: dikoreksi('baca-polis'), latihan: 5 }),
  aturan('tuntas-ralat-saran', 'tuntas', 'tuntas', { jika: dikoreksi('dokumentasi-dulu'), latihan: 1 }),
  aturan('tuntas-lengkapi', 'tuntas', 'tuntas', { jika: dikoreksi('bukti'), latihan: 2 }),
  aturan('tuntas-pulih', 'tuntas', 'tuntas', { jika: tanda('pulih-komunikasi') }),
  aturan('tuntas-jelas', 'tuntas', 'tuntas', { latihan: 5 }),
  // janji: sama dengan epilog (JANJI_WAKTU -> akhir-janji.3, selain itu .4).
  aturan('janji-besok', 'janji', 'janji-waktu', { jika: tanda('janji-waktu'), ulang: [{ bab: 'menutup' }] }),
  aturan('janji-awal', 'janji', 'janji-waktu', { jika: tanda('janji-awal'), ulang: [{ bab: 'menutup' }] }),
  aturan('janji-polis', 'janji', 'janji-polis', { ulang: [{ bab: 'polis' }], latihan: 5 }),
  // dingin: sama dengan pesan mentor di epilog (.6 tanpa rangkum, .4 belum paham semua, .5 belum merasa didengar).
  aturan('dingin-singkat', 'dingin', 'dingin-singkat', { jika: tidak(tanda('rangkum')), ulang: [{ bab: 'menutup' }] }),
  aturan('dingin-aturan', 'dingin', 'dingin-aturan', { jika: tanda('jawab-aturan'), ulang: [{ bab: 'menutup' }], latihan: 9 }),
  aturan('dingin-awal', 'dingin', 'dingin-jarak', { jika: tanda('cerita-singkat'), ulang: [{ bab: 'menyambut' }] }),
  aturan('dingin-ralat', 'dingin', 'dingin-jarak', {
    jika: salahSatu(dikoreksi('tanpa-janji'), dikoreksi('baca-polis'), dikoreksi('dokumentasi-dulu')),
    // Bab kekeliruan pertama yang kemudian diralat: janji di awal (bukan dari kartu), saran bengkel/"ringan", kartu.
    ulang: [
      { jika: semua(dikoreksi('tanpa-janji'), tidak(tanda('akt:polis:pilih:pasti-diganti'))), bab: 'menyambut' },
      { jika: dikoreksi('dokumentasi-dulu'), bab: 'menggali' },
      { bab: 'polis' },
    ],
  }),
  aturan('dingin-jarak', 'dingin', 'dingin-jarak', { ulang: [{ bab: 'menyambut' }] }),
  // tertunda: sama dengan epilog (bukti-seadanya -> .1-.3, selain itu .4).
  aturan('tertunda-bengkel', 'tertunda', 'tertunda', { jika: SARAN_BENGKEL, ulang: [{ bab: 'menggali' }], latihan: 1 }),
  aturan('tertunda-foto', 'tertunda', 'tertunda', { ulang: [{ bab: 'bukti' }], latihan: 2 }),
  // pergi: sama dengan epilog (menolak-awal -> .1/.3/.5, selain itu bertahan pada bacaan kartu -> .2/.4/.6).
  aturan('pergi-sepele', 'pergi', 'pergi', { jika: tanda('menolak-awal'), ulang: [{ bab: 'menggali' }], latihan: 1 }),
  aturan('pergi-bertahan', 'pergi', 'pergi', { ulang: [{ bab: 'polis' }], latihan: 5 }),
];

/**
 * Makna tiap alasan bagi tinjauan "Lihat perjalananku". Arah suasana bukan ukuran benar: janji yang membuat
 * Bu Rina lega tetap 'perhatian'; ralat yang membuatnya kecewa sesaat tetap 'ralat'. `diluruskan` = kondisi
 * di akhir perjalanan yang menandai kekeliruan itu sudah diperbaiki (lalu tampil lewat alasan ralatnya).
 */
const MAKNA: Record<string, MaknaAlasan> = {
  'b1-datang.prosedur.alasan': { nilai: 'perhatian', diluruskan: tanda('pulih-komunikasi') },
  'b1-datang.dengar.alasan': { nilai: 'membantu' },
  'b1-datang.janji.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('tanpa-janji') },
  'b1-pulih.maaf.alasan': { nilai: 'ralat' },
  'b1-pulih.tetap.alasan': { nilai: 'perhatian' },
  'b2-saran.bengkel.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('dokumentasi-dulu') },
  'b2-saran.dokumentasi.alasan': { nilai: 'membantu' },
  'b2-saran.ringan.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('dokumentasi-dulu') },
  'b2-bengkel-akibat.biarkan.alasan': { nilai: 'perhatian' },
  'b2-bengkel-akibat.koreksi.alasan': { nilai: 'ralat' },
  'b2-ringan-akibat.lihat-dulu.alasan': { nilai: 'ralat' },
  'b2-ringan-akibat.tetap-ringan.alasan': { nilai: 'perhatian' },
  'b3-bukti-kurang.lengkapi.alasan': { nilai: 'ralat' },
  'b3-bukti-kurang.cukup.alasan': { nilai: 'perhatian' },
  'b4-polis.hasil.1.alasan': { nilai: 'membantu' },
  'b4-polis.hasil.2.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('baca-polis') },
  'b4-polis.hasil.3.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('baca-polis') },
  'b4-polis.hasil.4.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('baca-polis') },
  'b4-polis-salah.bertahan.alasan': { nilai: 'perhatian' },
  'b4-polis-salah.baca-ulang.alasan': { nilai: 'ralat' },
  'b5-keberatan.janjikan.alasan': { nilai: 'perhatian' },
  'b5-keberatan.aturan.alasan': { nilai: 'perhatian' },
  'b5-keberatan.aturan-janji.alasan': { nilai: 'perhatian' },
  'b5-keberatan.jujur.alasan': { nilai: 'membantu' },
  'b5-keberatan.ralat-janji.alasan': { nilai: 'ralat' },
  'b5-keberatan.ralat-polis.alasan': { nilai: 'ralat' },
  'b5-tutup.rangkum.alasan': { nilai: 'membantu' },
  'b5-tutup.singkat.alasan': { nilai: 'perhatian' },
};

// ------------------------------------------------------------------ istilah (v2)

/**
 * Istilah yang dijelaskan di tempat (docs/rancangan-mode-cerita.md 11.4): kunci teks 'istilah.<id>.label|arti'.
 * Baris dialog pertama pemakaiannya diberi `istilah` di atas: b4-polis-intro.1/.2 (polis & Comprehensive),
 * b4-polis-tepat.1 / b5-keberatan.4 / .7 (risiko sendiri), dan (v3, sejak b1-mentor.1 hanya menyebut peran & tempat)
 * b1-mentor.4 (nasabah, narasi pintu) serta b2-saran.1/.2 (klaim), yang dilewati semua jalur; b5-keberatan.8 (klaim)
 * & akhir-tertunda.6 (nasabah) tetap bertanda untuk pemain yang memutar ulang bab dari tengah. Arti = DRAF (TINJAUAN-PIC-CLAIM.md bagian S).
 */
const ISTILAH: Record<string, Istilah> = Object.fromEntries(
  ['nasabah', 'klaim', 'polis', 'comprehensive', 'risiko-sendiri'].map((id) => [id, { label: `istilah.${id}.label`, arti: `istilah.${id}.arti` }]),
);

// ------------------------------------------------------------------ episode

export const EPISODE_AUTO_1: Episode = {
  id: 'auto-1',
  versi: 1,
  produk: 'AUTO',
  judul: 'ep.judul',
  ringkas: 'ep.ringkas',
  durasiMenit: 8,
  mulai: 'b1-mentor',
  pemeran: {
    nasabah: { nama: 'pemeran.nasabah.nama', peran: 'pemeran.nasabah.peran', potret: 'nasabah', diPanggung: true },
    missRaksa: { nama: 'pemeran.missRaksa.nama', peran: 'pemeran.missRaksa.peran', potret: 'missRaksa' },
  },
  nasabah: 'nasabah',
  bab: [
    { id: 'menyambut', judul: 'bab.menyambut.judul', tujuan: 'bab.menyambut.tujuan' },
    { id: 'menggali', judul: 'bab.menggali.judul', tujuan: 'bab.menggali.tujuan' },
    { id: 'bukti', judul: 'bab.bukti.judul', tujuan: 'bab.bukti.tujuan' },
    { id: 'polis', judul: 'bab.polis.judul', tujuan: 'bab.polis.tujuan' },
    { id: 'menutup', judul: 'bab.menutup.judul', tujuan: 'bab.menutup.tujuan' },
  ],
  akhir: {
    tuntas: {
      judul: 'akhir.tuntas.judul',
      ringkas: 'akhir.tuntas.ringkas',
      nada: 'baik',
      pelajaran: ['akhir.tuntas.pelajaran.1', 'akhir.tuntas.pelajaran.2', 'akhir.tuntas.pelajaran.3'],
    },
    janji: {
      judul: 'akhir.janji.judul',
      ringkas: 'akhir.janji.ringkas',
      nada: 'campuran',
      pelajaran: ['akhir.janji.pelajaran.1', 'akhir.janji.pelajaran.2', 'akhir.janji.pelajaran.3'],
    },
    dingin: {
      judul: 'akhir.dingin.judul',
      ringkas: 'akhir.dingin.ringkas',
      nada: 'campuran',
      pelajaran: ['akhir.dingin.pelajaran.1', 'akhir.dingin.pelajaran.2', 'akhir.dingin.pelajaran.3'],
    },
    tertunda: {
      judul: 'akhir.tertunda.judul',
      ringkas: 'akhir.tertunda.ringkas',
      nada: 'buruk',
      pelajaran: ['akhir.tertunda.pelajaran.1', 'akhir.tertunda.pelajaran.2', 'akhir.tertunda.pelajaran.3'],
    },
    pergi: {
      judul: 'akhir.pergi.judul',
      ringkas: 'akhir.pergi.ringkas',
      nada: 'buruk',
      pelajaran: ['akhir.pergi.pelajaran.1', 'akhir.pergi.pelajaran.2', 'akhir.pergi.pelajaran.3'],
    },
  },
  paham: {
    'langkah-sekarang': 'paham.langkah-sekarang',
    'polis-dinilai': 'paham.polis-dinilai',
    'risiko-sendiri': 'paham.risiko-sendiri',
    'langkah-berikut': 'paham.langkah-berikut',
  },
  proses: {
    'dokumentasi-dulu': 'proses.dokumentasi-dulu',
    bukti: 'proses.bukti',
    'baca-polis': 'proses.baca-polis',
    'tanpa-janji': 'proses.tanpa-janji',
  },
  catatan: {
    masalah: 'catatan.masalah',
    kebutuhan: 'catatan.kebutuhan',
    'bagian-disimpan': 'catatan.bagian-disimpan',
    'rencana-bengkel': 'catatan.rencana-bengkel',
    bukti: 'catatan.bukti',
    'bukti-lengkap': 'catatan.bukti-lengkap',
    'bukti-kurang': 'catatan.bukti-kurang',
    polis: 'catatan.polis',
  },
  kepercayaanAwal: 0,
  // <= -2 Kesal, -1..0 Cemas, 1..2 Mulai tenang, >= 3 Tenang (menurun; min -100 = "lainnya").
  suasana: [
    { min: 3, ekspresi: 'lega', label: 'suasana.tenang' },
    { min: 1, ekspresi: 'netral', label: 'suasana.mulai-tenang' },
    { min: -1, ekspresi: 'cemas', label: 'suasana.cemas' },
    { min: -100, ekspresi: 'kesal', label: 'suasana.kesal' },
  ],
  node: Object.fromEntries(NODE.map((n) => [n.id, n])),
  aktivitas: AKTIVITAS_AUTO_1,
  teks: TEKS_AUTO_1,
  latihanTerkait: [1, 2, 5, 9],
  kartuAkhir: KARTU_AKHIR,
  makna: MAKNA,
  istilah: ISTILAH,
  panggung: PANGGUNG,
};
