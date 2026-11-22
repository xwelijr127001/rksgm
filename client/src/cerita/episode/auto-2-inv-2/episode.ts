/**
 * T-090 INVESTIGATOR · KASUS 2 "Malam di Jalan Melati" (spec docs/superpowers/specs/2026-11-21-investigator-kasus-2-design.md;
 * tinjauan konsep Codex di team/REVIEW.md "Investigator Kasus 2 concept review (2026-11-21)"). Episode TERPISAH (id
 * `auto-2-inv-2`, simpanan cerita sendiri, rute pendek /cerita/investigator/2); kasus 1 (`auto-2-inv`), Episode 1 lengkap dan
 * Episode 1 Dev tidak berubah. Kantor, ruang wawancara dan Miss Raksa dipakai ulang dari auto-2; Pak Yusuf dan Mas Agus dari
 * ./pemeran.ts (milik Designer, T-091).
 *
 * Fiksi kasus: MPV pribadi, polis penggunaan PRIBADI tanpa perluasan penggunaan komersial pada tanggal kejadian. Malam hari di
 * Jalan Melati sebuah motor menyenggol bumper depan kiri jam 21:18. Pak Yusuf mengklaim bumpernya. Tamu menemukan bahwa mobil
 * sedang membawa penumpang berbayar, lalu menjelaskan putusan yang tidak diharapkan itu dengan hormat. ANTI-TUJUAN (spec): tidak
 * menyebut nasabah pembohong / penipu, tidak menilai niat, tanpa merek aplikasi nyata, tanpa kalimat hukum yang belum
 * dikonfirmasi: semua kalimat polis, dasar putusan dan jalur peninjauan bertanda `// [konfirmasi PIC]` (di sini dan di teks).
 *
 * Alur (struktur sama dengan kasus 1; b1-b4 = bagian di kepala layar):
 *  b1 judul (judul) -> buka (SATU baris) -> bukti-foto (bukti 'foto-interior': foto surveyor langsung masuk buku, tanpa aktivitas
 *     ketuk) -> tebak (tebak, PILIHAN keluarga / penumpang / belum; tidak dinilai) -> yusuf (catat) -> agus (catat) -> selisih
 *  b2 kjalan (periksa-perjalanan: garis waktu, satu-satunya penyelidikan yang sungguhan) -> bukti-struk (bukti 'struk'; kalimat
 *     "Tebakan awalmu") -> kpolis (periksa-polis: satu ketukan) -> bukti-polis (bukti 'polis-kasus2')
 *  b3 keb-buka -> keb0 (keberatan 0, PILIHAN) --tepat--> keb-cap
 *                    |--keliru--> keb0-<kartu> -> keb1 (keberatan 1, PILIHAN) --tepat--> keb-cap
 *                                                   |--keliru--> keb1-<kartu> -> keb2 (keberatan 2 dipandu, DIALOG) -> keb-cap
 *     keb-cap (cap) -> keb-akui (Pak Yusuf, tenang dan bermartabat) -> keb-koreksi (koreksi: "Keterangan diperbarui")
 *  b4 putusan-buka -> putusan (putusan, PILIHAN) -> putusan-<x> -> pesan (PILIHAN di obrolan Pak Yusuf) -> pesan-<x>
 *     -> akhir-cek -> akhir-tuntas | akhir-tinjau (hasil-investigasi; AKHIR)
 * Kekeliruan tidak pernah menghentikan pemain (tanpa nyawa, tanpa waktu): hanya poin yang berbeda.
 *
 * Skor (cerita/investigasi/skor.ts) dari TANDA yang sama dengan kasus 1; tabel putusan KASUS INI: masalah pertanggungan 30,
 * butuh bukti tambahan 15, layak dijamin 0. Dua akhir: `tuntas` = putusan "ada masalah pertanggungan", `tinjau` = putusan lain
 * (diluruskan Miss Raksa). Status Pak Yusuf (30 = Cemas) hanya berubah oleh pesan.
 *
 * T-130 BABAK 2 (masukan Pak Peterson, rencana docs/superpowers/plans/2026-11-22-peterson-feedback.md "2 · Night trip"), di atas
 * sambungan bersama T-127. Semua tambahan FORMATIF: tanpa poin, bukan pilihan bernilai, tanpa tanda yang dibaca skor. Yang TIDAK
 * berubah: id node lama, id pilihan yang dinilai (kartu KEBERATAN, putusan, pesan) dan urutan percobaannya, tanda skor, versi.
 *  b1 pembuka tanpa jam benturan (jamnya dibaca pemain); judul kartu foto netral
 *  b2 kjalan  = tafsir 'jam' (formulir kejadian + tiga slip 21:05 / 21:18 / 21:24: slip mana jam benturan?) menggantikan garis waktu
 *     seret-satu-kartu -> baca-struk (BARU, tafsir 'struk': di mana 21:18 pada perjalanan di struk?) -> bukti-struk
 *     yusuf-tanya = PILIHAN dua pertanyaan: 'tekan' -> yusuf-tekan (kapan perjalanan ditutup: BERGUNA, tanda jeli) |
 *     'tekan-dudukan' -> yusuf-tekan-dudukan (kenapa HP di dasbor: sopan, tidak membuka hal baru)
 *     kurang (BARU, tafsir 'dokumen': berkas belum lengkap = "perlu bukti tambahan"; dokumen apa yang kurang?) -> kpolis
 *     kpolis  = tafsir 'klausul' (kutipan polis tiga klausul: penggunaan / wilayah / pengemudi) menggantikan satu ketukan
 *  b3 keb-buka dua baris; keb0 = TEMUAN BERPASANGAN (keterangan + bukti; kartunya tetap pilihan bernilai yang sama); keb-akui =
 *     Pak Yusuf lebih dulu berkeberatan dengan wajar ("struk hanya mencatat kapan saya menutup aplikasinya"), lalu keterangan Mas
 *     Agus (penumpang turun SESUDAH benturan) menjawabnya, baru ia meluruskan keterangannya
 *  b4 putusan-buka satu baris; pesan: tiga pesan ditulis ulang (id dan nilai sama, lihat komentar node 'pesan')
 * Simpanan di tengah kasus: semua node lama masih ada dan terjangkau; tiga node baru hanya DISISIPKAN. Simpanan yang sudah
 * melewati titik itu tidak punya tanda `tafsir:*`: slip buktinya tanpa baris tafsir.
 */
import type { Baris, CueLatar, Efek, Ekspresi, Episode, IdNode, KonfigInvestigasi, Kondisi, MusikNode, NodeCerita, NodeInvestigasi, Press } from '../../tipe';
import { PILIH_LANJUT, PILIH_TEKAN, tandaBukti, tandaCatat, tandaKeberatan, tandaKoreksi, tandaPesan, tandaPutusan, tandaTafsir, tandaTebak, tandaTekan } from '../../investigasi/status';
import { EPISODE_AUTO_2 } from '../auto-2/episode';
import { PEMERAN_KASUS_2 } from './pemeran';
import { TEKS_AUTO_2_INV_2 } from './teks';

type Siapa = 'missRaksa' | 'yusuf' | 'agus' | 'narasi';
const b = (teks: string, siapa: Siapa, ekspresi?: Ekspresi, tata?: CueLatar): Baris => ({ siapa, teks, ...(ekspresi ? { ekspresi } : {}), ...(tata ? { tata } : {}) });
const tanda = (t: string): Kondisi => ({ tanda: t });

// Tata panggung (komposisi yang sama dengan kasus 1: kantor + Miss Raksa, ruang wawancara, obrolan nasabah).
const KANTOR: CueLatar = { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] };
const RUANG = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: null, objek: [] });
/** Miss Raksa memandu lewat telepon (sisipan wajah) saat pemain di ruang wawancara; tokoh di ruangan tetap. */
const RUANG_TELEPON = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: 'missRaksa', objek: [] });
const TELEPON_YUSUF: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'yusuf', objek: [] };

/**
 * Data KASUS 2 (`Episode.investigasi`): semua yang berbeda dari kasus 1 ada di sini (lihat KonfigInvestigasi, cerita/tipe.ts).
 * Kunci teks naskahnya berawalan `inv2`.
 */
/**
 * T-104 "Tanya lebih lanjut" pada keterangan Pak Yusuf. T-130: DUA pertanyaan, pilih satu.
 *  - 'tutup' (id dan tanda lama `press:yusuf:tutup`): "Kapan perjalanan itu ditutup di aplikasi?" = BERGUNA: ia menutupnya SESUDAH
 *    mobil menepi. Itulah yang nanti menjelaskan keberatan wajarnya ("struk hanya mencatat kapan saya menutup aplikasinya").
 *  - 'dudukan': "Kenapa HP itu terpasang di dasbor?" = dijawab dengan sopan, tidak membuka hal baru (tanpa tanda jeli).
 */
const TEKAN_YUSUF: Press = { id: 'tutup', questionKey: 'inv2.tekan.yusuf.tanya', answerKey: 'inv2.tekan.yusuf.jawab', berguna: true };
const TEKAN_YUSUF_DUDUKAN: Press = { id: 'dudukan', questionKey: 'inv2.tekan.yusuf.dudukan.tanya', answerKey: 'inv2.tekan.yusuf.dudukan.jawab' };
const PILIH_TEKAN_DUDUKAN = `${PILIH_TEKAN}-${TEKAN_YUSUF_DUDUKAN.id}`;

const KASUS: KonfigInvestigasi = {
  kasus: 'kasus-2',
  nomor: 2,
  judul: 'inv2.kasus.judul',
  awalan: 'inv2',
  kait: 'inv2.kait',
  nasabah: 'yusuf',
  // Wajah Pak Yusuf saat membalas (./pemeran.ts: lega / senang -> lega, cemas / bingung -> cemas).
  balasan: { baik: 'lega', datar: 'cemas', janji: 'senang' },
  bingkai: 'seni',
  pernyataan: [
    { id: 'yusuf', siapa: 'yusuf', teks: 'inv2.pernyataan.yusuf', press: TEKAN_YUSUF, pressLain: [TEKAN_YUSUF_DUDUKAN] },
    { id: 'agus', siapa: 'agus', teks: 'inv2.pernyataan.agus' },
  ],
  // Urut terkumpul (buku catatan): foto di pembuka, struk dari garis waktu, polis dari halaman polis.
  bukti: [
    // T-130: judul kartu NETRAL (nama sumbernya); gambar slip struk dan polis = seni babak 2 (struk yang ditutup, kutipan tiga klausul).
    { id: 'foto-interior', judul: 'inv2.bukti.foto.judul', sumber: 'inv2.bukti.foto.sumber', ikon: 'foto' },
    { id: 'struk', judul: 'inv2.bukti.struk.judul', sumber: 'inv2.bukti.struk.sumber', ikon: 'struk', seni: 'k2-struk' },
    { id: 'polis-kasus2', judul: 'inv2.bukti.polis.judul', sumber: 'inv2.bukti.polis.sumber', ikon: 'polis', seni: 'k2-polis' },
  ],
  // T-130 TAFSIR (formatif, urut alur):
  //  jam      formulir kejadian + tiga slip waktu (seni T-128): slip mana jam benturan? Tanpa kartu (formulir bukan kartu bukti)
  //           dan tanpa baris temuan sendiri: jamnya tertulis di temuan struk. Begitu juga 'dokumen' (langkah antara).
  //  struk    struk yang ditutup: di mana jam itu pada perjalanannya? Mapan sesudah Pak Yusuf meluruskan keterangannya.
  //  dokumen  [konfirmasi PIC] berkas belum lengkap = "perlu bukti tambahan": dokumen yang kurang = status perluasan penggunaan
  //           pada tanggal kejadian; pengecoh = identitas penumpang (privasi), foto bumper kedua. Tanpa gambar bukti.
  //  klausul  [konfirmasi PIC] kutipan polis tiga klausul: yang menentukan = 1 (penggunaan); 2 wilayah, 3 pengemudi.
  tafsir: [
    {
      id: 'jam', tampilan: 'bingkai', seni: 'k2-formulir', seniKet: 'inv2.tafsir.jam.gambar', tanya: 'inv2.tafsir.jam.tanya', tepat: '2118',
      opsi: (['2105', '2118', '2124'] as const).map((x) => ({ id: x, teks: `inv2.tafsir.jam.pilih.${x}`, seni: `${x.slice(0, 2)}:${x.slice(2)}`, ket: `inv2.tafsir.jam.ket.${x}` })),
    },
    {
      id: 'struk', bukti: 'struk', tampilan: 'bingkai', seni: 'k2-struk', seniKet: 'inv2.tafsir.struk.gambar', tanya: 'inv2.tafsir.struk.tanya', tepat: 'tengah',
      opsi: (['sebelum', 'tengah', 'sesudah'] as const).map((x) => ({ id: x, teks: `inv2.jalan.l3.${x}` })),
      temuan: 'inv2.tafsir.struk.temuan', ringkas: 'inv2.tafsir.struk.ringkas', mapanSaat: tandaKoreksi('yusuf'),
    },
    {
      id: 'dokumen', tampilan: 'daftar', tanya: 'inv2.tafsir.dokumen.tanya', tepat: 'perluasan', hadiah: 'k2-endorsemen',
      opsi: (['identitas', 'perluasan', 'foto'] as const).map((x) => ({ id: x, teks: `inv2.tafsir.dokumen.pilih.${x}` })),
    },
    {
      id: 'klausul', bukti: 'polis-kasus2', tampilan: 'bingkai', seni: 'k2-polis', seniKet: 'inv2.tafsir.klausul.gambar', tanya: 'inv2.tafsir.klausul.tanya', tepat: '1',
      opsi: (['1', '2', '3'] as const).map((x) => ({ id: x, teks: `inv2.tafsir.klausul.pilih.${x}` })),
      temuan: 'inv2.tafsir.klausul.temuan', ringkas: 'inv2.tafsir.klausul.ringkas',
    },
  ],
  tebak: {
    pilihan: (['keluarga', 'penumpang', 'belum'] as const).map((id) => ({ id, teks: `inv2.tebak.pilih.${id}` })),
    balikPada: 'struk',
  },
  // Kartu yang tepat (struk) tidak di urutan pertama. Pertanyaan kasus tampil di layar pada percobaan pertama.
  keberatan: {
    pernyataan: 'yusuf',
    tepat: 'struk',
    urutan: ['foto-interior', 'struk', 'polis-kasus2'],
    tanya: 'inv2.keb.tanya',
    layar: { tanya: 'inv2.keb.tanya', petunjuk1: 'inv2.keb.petunjuk1', petunjuk2: 'inv2.keb.petunjuk2' },
    // T-130: percobaan pertama = pemain memilih DUA catatan (keterangan + bukti); kartu bukti tetap pilihan bernilai yang sama.
    pasangan: { tanya: 'inv2.pasang.tanya', ket: 'inv2.pasang.ket', temuan: 'inv2.pasang.temuan' },
    // T-130: struk dan kutipan polis bisa diperbesar (gambar netralnya); lembar perbesar memilih kartu yang DIBUKA (perbaikan T-131).
    perbesar: ['struk', 'polis-kasus2'],
    // Potret di bawah cap = sel potret reaksi Designer (T-091): Pak Yusuf menjelaskan dengan tenang, kedua telapak tangan terbuka.
    reaksi: 'yusuf-terbuka',
  },
  // [konfirmasi PIC] Tabel putusan: nilai penuh untuk "ada masalah pertanggungan" HANYA karena klausul penggunaan dan status
  // perluasan pada tanggal kejadian diperlihatkan kepada tamu (tinjauan Codex butir 1).
  putusan: { polis: 30, tambahan: 15, layak: 0 },
  putusanLayar: { ket: 'inv2.putusan.ket', sebab: { layak: 'inv2.putusan.layak.sebab', tambahan: 'inv2.putusan.tambahan.sebab', polis: 'inv2.putusan.polis.sebab' } },
  koreksi: { judul: 'inv2.koreksi.judul', ket: 'inv2.koreksi.ket', baris: 'inv2.koreksi.baris' },
  // T-106: tautan lanjut ke kasus 3. Layar hasil (kartu 5) menggambar SATU tindakan berikutnya dari daftar kasus seri dan tetap
  // menampilkan tombol arsip kasus ini.
  berikut: 'auto-2-inv-3',
  // Kenang-kenangan: garis waktu perjalanan + pesan yang dikirim tamu, terbaca lagi di layar hasil tanpa main ulang.
  arsip: { judul: 'inv2.bukti.struk.judul', garis: ['inv2.garis.1', 'inv2.garis.2', 'inv2.garis.3'], sorot: 1, pesan: 'inv2.arsip.pesan' },
};
type IdBukti = KonfigInvestigasi['bukti'][number]['id'];
const KEB = KASUS.keberatan;
const TEPAT: IdBukti = KEB.tepat;

const dialog = (id: IdNode, tata: CueLatar, baris: Baris[], lanjut: IdNode, opsi: { efek?: Efek; investigasi?: NodeInvestigasi } = {}): NodeCerita =>
  ({ id, bab: '', jenis: 'dialog', tata, baris, lanjut, ...(opsi.efek ? { efek: opsi.efek } : {}), ...(opsi.investigasi ? { investigasi: opsi.investigasi } : {}) });

/** Percobaan keberatan ke-n (0 / 1) = node pilihan: kartu tepat -> cap; kartu keliru -> penjelasan Miss Raksa -> percobaan berikut. */
function keberatan(n: 0 | 1, pengantar: string, lanjutSalah: IdNode, kunciSalah: (id: IdBukti) => string): NodeCerita[] {
  const id = `keb${n}`;
  const pilihan: NodeCerita = {
    id, bab: '', jenis: 'pilihan', tata: RUANG('yusuf'), baris: [b(pengantar, 'narasi')], tanya: KEB.tanya,
    investigasi: { jenis: 'keberatan', pernyataan: KEB.pernyataan, tepat: TEPAT, percobaan: n },
    pilihan: KEB.urutan.map((x) => ({
      id: x,
      teks: `inv2.keb.pilih.${x}`,
      jika: tanda(tandaBukti(x)),
      efek: { pasang: [x === TEPAT ? tandaKeberatan(n === 0 ? 'tepat' : 'tepat-kedua') : `keb:keliru:${n}:${x}`] },
      lanjut: x === TEPAT ? 'keb-cap' : `${id}-${x}`,
    })),
  };
  const salah = KEB.urutan.filter((x) => x !== TEPAT).map((x) =>
    dialog(`${id}-${x}`, RUANG_TELEPON('yusuf'), [b(kunciSalah(x), 'missRaksa', n === 0 ? 'netral' : 'serius')], lanjutSalah));
  return [pilihan, ...salah];
}

function bangunNode(): NodeCerita[] {
  return [
    // ---------------------------------------------------------------- b1: kartu judul, foto surveyor, tebakan, dua keterangan
    dialog('judul', KANTOR, [b('inv2.judul.kartu', 'narasi')], 'buka', { investigasi: { jenis: 'judul' } }),
    dialog('buka', KANTOR, [b('inv2.buka.1', 'missRaksa', 'serius')], 'bukti-foto'),
    // Spec butir 1: foto interior surveyor DISIMPAN sebagai kartu sejak pembuka (tanpa aktivitas ketuk).
    dialog('bukti-foto', KANTOR, [b('inv2.bukti.foto.1', 'narasi')], 'tebak',
      { efek: { pasang: [tandaBukti('foto-interior')] }, investigasi: { jenis: 'bukti', bukti: 'foto-interior' } }),
    // Tebakan tanpa benar / salah: ketiga pilihan hanya memasang tanda tebakannya (tebak:keluarga | penumpang | belum).
    {
      id: 'tebak', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv2.tebak.1', 'narasi')], tanya: 'inv2.tebak.tanya',
      investigasi: { jenis: 'tebak' },
      pilihan: KASUS.tebak.pilihan.map((p) => ({ id: p.id, teks: p.teks, efek: { pasang: [tandaTebak(p.id)] }, lanjut: 'yusuf' })),
    },
    dialog('yusuf', RUANG('yusuf'), [b('inv2.yusuf.1', 'narasi'), b('inv2.yusuf.2', 'yusuf', 'cemas'), b('inv2.yusuf.3', 'yusuf', 'netral')], 'agus',
      { efek: { pasang: [tandaCatat('yusuf')] }, investigasi: { jenis: 'catat', pernyataan: 'yusuf' } }),
    dialog('agus', RUANG('agus'), [b('inv2.agus.1', 'narasi'), b('inv2.agus.2', 'agus', 'serius'), b('inv2.agus.3', 'agus', 'netral')], 'selisih',
      { efek: { pasang: [tandaCatat('agus')] }, investigasi: { jenis: 'catat', pernyataan: 'agus' } }),
    dialog('selisih', RUANG_TELEPON('agus'), [b('inv2.selisih.1', 'missRaksa', 'serius')], 'kjalan'),

    // ---------------------------------------------------------------- b2: garis waktu perjalanan (kartu struk), halaman polis (kartu polis)
    // Pak Yusuf memperlihatkan SATU struk dengan sukarela (nama dan alamat penumpang ditutup); layarnya ui/PeriksaPerjalanan.
    // T-130: layar node ini kini tafsir 'jam' (slip mana jam benturan?); id node, jenis dan dua baris pengantarnya tidak berubah.
    dialog('kjalan', RUANG('yusuf'), [b('inv2.jalan.1', 'narasi'), b('inv2.jalan.2', 'yusuf', 'netral')], 'baca-struk',
      { efek: { pasang: [tandaTafsir('jam')] }, investigasi: { jenis: 'periksa-perjalanan' } }),
    // T-130 TAFSIR 'struk' (formatif, node BARU yang disisipkan): pemain menaruh jam benturan pada perjalanan di struk. Simpanan lama
    // di 'kjalan' lewat sini; yang sudah di 'bukti-struk' tidak.
    dialog('baca-struk', RUANG('yusuf'), [b('inv2.baca.struk.1', 'narasi')], 'bukti-struk',
      { efek: { pasang: [tandaTafsir('struk')] }, investigasi: { jenis: 'tafsir', tafsir: 'struk' } }),
    dialog('bukti-struk', RUANG('yusuf'), [b('inv2.bukti.struk.1', 'narasi')], 'yusuf-tanya',
      { efek: { pasang: [tandaBukti('struk')] }, investigasi: { jenis: 'bukti', bukti: 'struk' } }),
    // T-104 "Tanya lebih lanjut" (opsional, tanpa poin, NodeDasar.tekan): simpangan sesudah struk tersimpan; kedua cabang maju ke
    // 'kpolis', tanpa putaran. Node 'yusuf' dan 'bukti-struk' (id, efek, titik lanjut simpanan lama) tidak berubah.
    {
      id: 'yusuf-tanya', bab: '', jenis: 'pilihan', tata: RUANG('yusuf'), baris: [b('inv.ui.tekan.1', 'narasi')], tanya: 'inv.ui.tekan.pilih',
      tekan: { pernyataan: 'yusuf', press: TEKAN_YUSUF.id, langkah: 'tawar' },
      // T-130: dua pertanyaan, pilih satu (atau lanjut). Id 'tekan' dan 'lanjut' = id lama; pertanyaan kedua = 'tekan-dudukan'.
      pilihan: [
        { id: PILIH_TEKAN, teks: TEKAN_YUSUF.questionKey, lanjut: 'yusuf-tekan' },
        { id: PILIH_TEKAN_DUDUKAN, teks: TEKAN_YUSUF_DUDUKAN.questionKey, lanjut: 'yusuf-tekan-dudukan' },
        { id: PILIH_LANJUT, teks: 'inv.ui.tekan.lanjut', lanjut: 'kurang' },
      ],
    },
    {
      ...dialog('yusuf-tekan', RUANG('yusuf'), [b(TEKAN_YUSUF.answerKey, 'yusuf', 'netral')], 'kurang', { efek: { pasang: [tandaTekan('yusuf', TEKAN_YUSUF.id)] } }),
      tekan: { pernyataan: 'yusuf', press: TEKAN_YUSUF.id, langkah: 'jawab' },
    },
    {
      ...dialog('yusuf-tekan-dudukan', RUANG('yusuf'), [b(TEKAN_YUSUF_DUDUKAN.answerKey, 'yusuf', 'netral')], 'kurang', { efek: { pasang: [tandaTekan('yusuf', TEKAN_YUSUF_DUDUKAN.id)] } }),
      tekan: { pernyataan: 'yusuf', press: TEKAN_YUSUF_DUDUKAN.id, langkah: 'jawab' },
    },
    // T-130 TAFSIR 'dokumen' (formatif, node BARU; rencana butir 16): SEBELUM polisnya dibaca, berkas belum lengkap. Jawaban jujurnya
    // saat itu "perlu bukti tambahan", dan pemain menyebut dokumen yang kurang. Putusan akhirnya (node 'putusan', bernilai) tidak
    // berubah: di sana berkas sudah lengkap. [konfirmasi PIC] dokumen yang menentukan dan urutan memintanya.
    dialog('kurang', KANTOR, [b('inv2.kurang.1', 'narasi')], 'kpolis',
      { efek: { pasang: [tandaTafsir('dokumen')] }, investigasi: { jenis: 'tafsir', tafsir: 'dokumen' } }),
    // [konfirmasi PIC] Halaman polis fiktif: klausul penggunaan + status perluasan pada tanggal kejadian (ui/PeriksaPolis, satu ketukan).
    // T-130: layarnya kini tafsir 'klausul' (penggunaan / wilayah / pengemudi) atas kutipan polis; id node dan jenisnya tidak berubah.
    dialog('kpolis', KANTOR, [b('inv2.polis.1', 'missRaksa', 'serius')], 'bukti-polis',
      { efek: { pasang: [tandaTafsir('klausul')] }, investigasi: { jenis: 'periksa-polis' } }),
    dialog('bukti-polis', KANTOR, [b('inv2.bukti.polis.1', 'narasi')], 'keb-buka', // [konfirmasi PIC]
      { efek: { pasang: [tandaBukti('polis-kasus2')] }, investigasi: { jenis: 'bukti', bukti: 'polis-kasus2' } }),

    // ---------------------------------------------------------------- b3: KEBERATAN (kalimat Pak Yusuf vs satu catatan); tanpa menuduh
    // T-130: kalimat Miss Raksa "tunjukkan satu catatan yang menjawab: apa yang terjadi jam 21:18?" (inv2.keb-buka.3) dilepas dari
    // graf: ia menunjuk jawabannya. Pemain kini memasangkan sendiri dua catatan. Kunci teksnya tetap ada (riwayat simpanan lama).
    dialog('keb-buka', RUANG('yusuf'), [
      b('inv2.keb-buka.1', 'narasi'),
      b('inv2.keb-buka.2', 'yusuf', 'netral'),
    ], 'keb0'),
    ...keberatan(0, 'inv2.keb.1', 'keb1', (x) => `inv2.keb.salah.${x}`),
    ...keberatan(1, 'inv2.keb.2', 'keb2', (x) => `inv2.keb.pandu.${x}`),
    // Percobaan ketiga = dipandu: hanya kartu tepat yang melanjutkan (node dialog; ketukan kartu itu = lanjut).
    dialog('keb2', RUANG('yusuf'), [b('inv2.keb.3', 'narasi')], 'keb-cap',
      { efek: { pasang: [tandaKeberatan('dipandu')] }, investigasi: { jenis: 'keberatan', pernyataan: KEB.pernyataan, tepat: TEPAT, percobaan: 2 } }),
    dialog('keb-cap', RUANG('yusuf'), [b('inv2.keb.cap', 'narasi')], 'keb-akui', { investigasi: { jenis: 'cap' } }),
    // Pak Yusuf tenang dan bermartabat ('tersenyum' = wajah TERBUKA di ./pemeran.ts: menjelaskan dengan tenang, bukan pose malu);
    // niatnya tidak dinilai. Miss Raksa berterima kasih.
    // T-130 (butir 18): Pak Yusuf tidak langsung meluruskan. Keberatannya WAJAR: struk hanya mencatat kapan ia menutup aplikasinya,
    // bukan kapan penumpangnya turun. Catatan kedua (keterangan Mas Agus: turun SESUDAH benturan) menjawabnya; baru ia meluruskan
    // keterangannya, tetap tenang. Tanpa putaran tanya-jawab baru, tanpa menuduh. Baris 'inv2.akui.tutup' hanya untuk pemain yang
    // tadi menanyakan kapan perjalanan itu ditutup (tanda jeli).
    dialog('keb-akui', RUANG('yusuf'), [
      b('inv2.akui.tapi', 'yusuf', 'netral'),
      { ...b('inv2.akui.tutup', 'narasi'), jika: tanda(tandaTekan('yusuf', TEKAN_YUSUF.id)) },
      b('inv2.akui.agus', 'narasi'),
      b('inv2.akui.1', 'yusuf', 'tersenyum'),
      b('inv2.akui.2', 'missRaksa', 'tersenyum', RUANG_TELEPON('yusuf')),
    ], 'keb-koreksi'),
    // Baris keterangannya di buku catatan mendapat tanda "Keterangan diperbarui".
    dialog('keb-koreksi', RUANG('yusuf'), [b('inv2.koreksi.1', 'narasi')], 'putusan-buka',
      { efek: { pasang: [tandaKoreksi(KEB.pernyataan)] }, investigasi: { jenis: 'koreksi', pernyataan: KEB.pernyataan } }),

    // ---------------------------------------------------------------- b4: putusan, pesan untuk Pak Yusuf, hasil
    // T-130: satu baris (kalimat penegasan 'inv2.putusan.1' dilepas dari graf untuk menjaga panjang kasus; kuncinya tetap ada).
    dialog('putusan-buka', KANTOR, [b('inv2.putusan.2', 'missRaksa', 'serius')], 'putusan'),
    {
      id: 'putusan', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv2.putusan.3', 'narasi')], tanya: 'inv2.putusan.tanya',
      investigasi: { jenis: 'putusan' },
      pilihan: (['layak', 'tambahan', 'polis'] as const).map((x) => ({ id: x, teks: `inv2.putusan.${x}`, efek: { pasang: [tandaPutusan(x)] }, lanjut: `putusan-${x}` })),
    },
    // [konfirmasi PIC] Tiga penjelasan putusan (dasar putusan dan siapa yang berwenang memutuskan).
    dialog('putusan-polis', KANTOR, [b('inv2.putusan.polis.1', 'missRaksa', 'tersenyum')], 'pesan'),
    dialog('putusan-tambahan', KANTOR, [b('inv2.putusan.tambahan.1', 'missRaksa', 'serius')], 'pesan'),
    dialog('putusan-layak', KANTOR, [b('inv2.putusan.layak.1', 'missRaksa', 'serius')], 'pesan'),
    {
      id: 'pesan', bab: '', jenis: 'pilihan', tata: TELEPON_YUSUF, baris: [b('inv2.pesan.1', 'narasi'), b('inv2.pesan.2', 'yusuf', 'cemas')], tanya: 'inv2.pesan.tanya',
      // [konfirmasi PIC] 'baik' = mengakui, menyebut ketentuan + temuan, jalur peninjauan ulang (kanal), perluasan ke depan terpisah
      // dari kerugian ini; 'datar' = alasan benar dan sopan tanpa jalur peninjauan; 'janji' = janji pembayaran tanpa dasar.
      // T-130 (butir 15): TIGA pilihan, id dan nilai tidak berubah (rubrik bersama hanya mengenal baik / datar / janji, jadi pengecoh
      // keempat tidak bisa ditambah tanpa id baru). Yang berubah hanya kalimatnya: 'baik' kini lebih pendek (ketentuan yang berlaku +
      // jalur peninjauan ulang); 'datar' = benar tetapi penuh istilah dan PALING panjang, tanpa jalur peninjauan; 'janji' = janji
      // pembayaran tanpa dasar yang juga menjanjikan data penumpang (pelanggaran privasi).
      pilihan: [
        { id: 'janji', teks: 'inv2.pesan.janji', efek: { kepercayaan: 10, alasan: 'inv2.pesan.janji.alasan', pasang: [tandaPesan('janji')] }, lanjut: 'pesan-janji' },
        { id: 'baik', teks: 'inv2.pesan.baik', efek: { kepercayaan: 30, alasan: 'inv2.pesan.baik.alasan', pasang: [tandaPesan('baik')] }, lanjut: 'pesan-baik' },
        { id: 'datar', teks: 'inv2.pesan.datar', efek: { pasang: [tandaPesan('datar')] }, lanjut: 'pesan-datar' },
      ],
    },
    dialog('pesan-baik', TELEPON_YUSUF, [b('inv2.pesan.baik.1', 'yusuf', 'netral')], 'akhir-cek'),
    dialog('pesan-datar', TELEPON_YUSUF, [b('inv2.pesan.datar.1', 'yusuf', 'cemas'), b('inv2.pesan.datar.2', 'narasi')], 'akhir-cek'),
    dialog('pesan-janji', TELEPON_YUSUF, [b('inv2.pesan.janji.1', 'yusuf', 'senang'), b('inv2.pesan.janji.2', 'narasi')], 'akhir-cek'),
    { id: 'akhir-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaPutusan('polis')), lanjut: 'akhir-tuntas' }], lainnya: 'akhir-tinjau' },
    ...(['tuntas', 'tinjau'] as const).map((akhir): NodeCerita => ({
      id: `akhir-${akhir}`, bab: '', jenis: 'akhir', akhir, tata: KANTOR,
      baris: [b(`inv2.akhir.${akhir}.1`, 'missRaksa', akhir === 'tuntas' ? 'tersenyum' : 'netral')],
      investigasi: { jenis: 'hasil-investigasi' },
    })),
  ];
}

/** Bagian tiap node (kepala layar "BAGIAN n/4"). */
function babInv2(id: IdNode): string {
  if (['judul', 'buka', 'bukti-foto', 'tebak', 'yusuf', 'agus', 'selisih'].includes(id)) return 'b1';
  if (['kjalan', 'baca-struk', 'bukti-struk', 'yusuf-tanya', 'yusuf-tekan', 'yusuf-tekan-dudukan', 'kurang', 'kpolis', 'bukti-polis'].includes(id)) return 'b2';
  if (id.startsWith('keb')) return 'b3';
  return 'b4';
}

/**
 * Musik per FASE, sama dengan kasus 1 (trek T-085 dipakai ulang, tanpa musik baru):
 *  Investigasi  kartu judul, pembuka, tebakan, dan pengumpulan bukti (b2);
 *  Keterangan   dua wawancara + "kita cari catatan yang ada jamnya";
 *  Keberatan    seluruh b3 (di cap KEBERATAN musik hening 0,4 detik);
 *  Terungkap    b4 (putusan, pesan, hasil): jingle sekali, lalu loop tenang.
 */
function musikInv2(id: IdNode): MusikNode {
  if (['yusuf', 'agus', 'selisih'].includes(id)) return 'inv-keterangan';
  const bab = babInv2(id);
  if (bab === 'b3') return 'inv-keberatan';
  if (bab === 'b4') return 'inv-terungkap';
  return 'inv-investigasi';
}

function bangun(asal: Episode): Episode {
  return {
    id: 'auto-2-inv-2',
    versi: 1,
    produk: 'AUTO',
    jenis: 'nyata',
    judul: 'judul',
    ringkas: 'ringkas',
    durasiMenit: 5,
    mulai: 'judul',
    pemeran: { missRaksa: asal.pemeran.missRaksa!, ...PEMERAN_KASUS_2 },
    nasabah: KASUS.nasabah,
    bab: ([1, 2, 3, 4] as const).map((n) => ({ id: `b${n}`, judul: `inv2.bab.${n}.judul`, tujuan: `inv2.bab.${n}.tujuan` })),
    akhir: {
      tuntas: { judul: 'inv2.akhir.tuntas.judul', ringkas: 'inv2.akhir.tuntas.ringkas', nada: 'baik', pelajaran: ['inv2.pelajaran.1'] },
      tinjau: { judul: 'inv2.akhir.tinjau.judul', ringkas: 'inv2.akhir.tinjau.ringkas', nada: 'campuran', pelajaran: ['inv2.pelajaran.1'] },
    },
    paham: {},
    proses: {},
    catatan: {},
    kepercayaanAwal: 30,
    kepercayaanBatas: { min: 0, maks: 100 },
    labelSuasana: 'status',
    antarmuka: 'hp',
    // Tanpa arena dan tanpa lampiran obrolan (lampiran auto-2 dikirim Pak Hendra, yang bukan pemeran kasus ini).
    suasana: asal.suasana,
    node: Object.fromEntries(bangunNode().map((n) => [n.id, { ...n, bab: babInv2(n.id), musik: musikInv2(n.id) }])),
    // Tanpa arena: garis waktu dan halaman polis adalah layar investigasi (node dialog), bukan aktivitas mesin.
    aktivitas: {},
    teks: TEKS_AUTO_2_INV_2,
    bahasa: ['id', 'en', 'zh'],
    // Latar auto-2 (kantor, ruang wawancara); gambar kartu daftar episode = Pak Yusuf di ruang wawancara.
    latar: asal.latar ? { ...asal.latar, sampul: { lokasi: 'wawancara', hadir: ['yusuf'] } } : undefined,
    tampilan: { teksBesar: true },
    investigasi: KASUS,
  };
}

/**
 * Investigator kasus 2. Build tanpa auto-2 (VITE_CERITA_TANPA=auto-2): vite.config ikut mengganti modul ini dengan rintisan
 * null, jadi isi kasusnya tidak terbawa lewat episode ini.
 */
export const EPISODE_AUTO_2_INV_2: Episode = bangun(EPISODE_AUTO_2);
