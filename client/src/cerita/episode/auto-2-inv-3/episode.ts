/**
 * T-104 INVESTIGATOR · KASUS 3 "Satu Baris Terlalu Banyak" (spec docs/superpowers/specs/2026-11-21-investigator-lengkap-design.md;
 * rencana docs/superpowers/plans/2026-11-21-investigator-lengkap.md kartu 2; kontrak T-102 di cerita/tipe.ts dan
 * shared/investigator/rubric.ts). Episode TERPISAH (id `auto-2-inv-3`, kasus `kasus-3`, alamat /investigator/3); kasus 1-2,
 * Episode 1 lengkap dan Episode 1 Dev tidak berubah. Kantor, ruang wawancara dan Miss Raksa dipakai ulang dari auto-2; tiga
 * pemeran baru di ./pemeran.ts (seni Designer T-103).
 *
 * Fiksi kasus (gabungan rekaan; tanpa orang, merek, alamat, atau tanggal nyata; "tanggal 3 / 14 / 15" hanya urutan hari):
 * tanggal 14 mobil Pak Gilang tertabrak di area parkir; perkiraan biaya bengkel berisi DUA baris, bumper dan spion. Benturan
 * bumper dikuatkan petugas parkir. Foto pemeriksaan tanggal 3 menunjukkan retak spion sudah ada, dan di kutipan pesan tanggal 15
 * Pak Gilang sendiri meminta retak lama itu dimasukkan. Tamu menunjukkan dua bukti itu berurutan di panel telaah, kedua pihak
 * menjelaskan dan mengoreksi keterangannya, lalu tamu meneruskan baris spion untuk pemeriksaan dan menjelaskannya dengan hormat.
 * ANTI-TUJUAN (spec): panel ini simulasi telaah bukti, bukan sidang; tidak ada putusan mengikat, pembayaran / penolakan otomatis,
 * penetapan pidana, atau tuduhan terbuka. Semua kalimat panel, wewenang, persetujuan, dan jalur pemeriksaan bertanda
 * `// [konfirmasi PIC]` (di sini dan di teks).
 *
 * Alur (b1-b4 = bagian di kepala layar):
 *  b1 judul (judul) -> buka -> bukti-kejadian (bukti 'kartu-kejadian') -> tebak (tebak, PILIHAN sama / beda / belum; tidak dinilai)
 *     -> pemohon (catat) -> penaksir (catat) -> bukti-penawaran (bukti 'penawaran') -> selisih
 *  b2 kfoto -> bukti-foto (bukti 'foto-inspeksi'; "Tebakan awalmu") -> penaksir-tanya (tawar "Tanya lebih lanjut")
 *     [-> penaksir-tekan] -> kpesan -> bukti-pesan (bukti 'pesan-pengajuan') -> pemohon-tanya [-> pemohon-tekan]
 *  b3 panel-buka -> BABAK 'kronologi' (pernyataan 'pemohon'):
 *       panel-kronologi-0 (panel 0, PILIHAN) --diterima--> panel-kronologi-jawab
 *         |--keliru--> panel-kronologi-0-<kartu> -> panel-kronologi-1 (panel 1, PILIHAN) --diterima--> panel-kronologi-jawab
 *                         |--keliru--> panel-kronologi-1-<kartu> -> panel-kronologi-2 (panel 2 dipandu, DIALOG) -> panel-kronologi-jawab
 *       panel-kronologi-jawab (hak jawab pemohon) -> panel-kronologi-koreksi (panel-koreksi) -> panel-kira (catat 'pemohon-panel')
 *     -> BABAK 'pengajuan' (pernyataan 'pemohon-panel'): panel-pengajuan-0 / -1 / -2 dengan bentuk yang sama
 *       -> panel-pengajuan-jawab (pemohon dan penaksir menanggapi) -> panel-pengajuan-koreksi (panel-koreksi)
 *     Babak 1 tidak pernah diulang sesudah babak 2 dimulai (alur hanya maju).
 *  b4 putusan-buka -> putusan (putusan, PILIHAN) -> putusan-<x> -> pesan (PILIHAN di obrolan Pak Gilang) -> pesan-<x>
 *     -> akhir-cek -> akhir-tuntas | akhir-tinjau (hasil-investigasi; AKHIR)
 * Kekeliruan tidak pernah menghentikan pemain (tanpa nyawa, tanpa waktu): hanya poin yang berbeda.
 *
 * Tanda (cerita/investigasi/status.ts): hasil tiap babak `panel:<babak>:first|second|guided` (dipasang pilihan kartu yang
 * diterima / node dipandu), kartu keliru `panel-keliru:<babak>:<n>:<kartu>`, koreksi `koreksi:<pernyataan>` (dipasang node
 * panel-koreksi, terpisah dari tanda hasil), "Tanya lebih lanjut" `press:<pernyataan>:<id>`, lalu putusan:* dan pesan:* seperti
 * kasus 1-2. Skor = rubrik bersama (babak 20 / 12 / 5; putusan 'tambahan' = "Teruskan untuk pemeriksaan" 30, 'layak' = minta
 * klarifikasi saja 15, 'polis' = nyatakan seluruh klaim curang 0; pesan 30 / 15 / 0). Id kartu, babak, putusan dan pesan sama
 * dengan manifes 'kasus-3' (investigasi/skor.ts selisihManifes = []).
 *
 * T-132 BABAK 2 (masukan Pak Peterson, rencana docs/superpowers/plans/2026-11-22-peterson-feedback.md "3 · Workshop"), di atas
 * sambungan bersama T-127 / T-130. Semua tambahan FORMATIF: tanpa poin, bukan pilihan bernilai, tanpa tanda yang dibaca skor. Yang
 * TIDAK berubah: id node lama, dua babak panel beserta id kartu, kartu yang diterima dan urutan percobaannya, id putusan dan pesan,
 * tanda skor, versi.
 *  b1 judul kartu NETRAL (nama sumbernya); seni kartu = seni babak 2 (kartu kejadian berkalender 14, perkiraan biaya dua baris
 *     tanpa cincin merah); perkiraan biaya hanya memberi harga
 *  b2 kfoto (dua baris, tidak lagi menyebut "sebelum kejadian") -> baca-foto (BARU, tafsir 'urutan': foto bercap 03 dipasangkan
 *     dengan kartu kejadian bertanggal 14; kapan foto itu diambil?) -> bukti-foto -> penaksir-cek (BARU, cabang): pemain yang
 *     SUDAH membaca urutannya langsung ke panel-buka. KUTIPAN PESAN TIDAK LAGI DIBACA SEBELUM PANEL (rencana: "the consented
 *     message extract is reserved for round 2"): dulu pemain sudah membaca "retak itu sudah lama, tolong masukkan" sebelum babak 1.
 *  b3 panel-buka tiga baris -> babak 'kronologi' (kartu kejadian / foto / perkiraan biaya) -> hak jawab -> koreksi ->
 *     panel-kira: Pak Gilang berkeberatan dengan wajar ("perkiraan biaya saja tidak menunjukkan apa yang saya minta"), lalu
 *     keterangan keduanya dicatat -> panel-pesan-cek (BARU, cabang) -> panel-izin (BARU: persetujuannya diminta, di depan panel)
 *     -> panel-bukti-pesan (BARU: kartu 'pesan-pengajuan') -> pemohon-panel-tanya (BARU: PILIHAN dua pertanyaan, 'tekan' =
 *     siapa yang menyetujui kutipan pesan: BERGUNA, tanda jeli | 'tekan-harga' = siapa yang menentukan harga: sopan, tidak
 *     membuka hal baru) -> babak 'pengajuan'. Dua kesimpulan tetap terpisah: kerusakan lama, lalu permintaan memasukkannya.
 *  RANTAI LAMA (hanya simpanan dari sebelum T-132; id, isi dan sambungannya tidak berubah): penaksir-tanya [-> penaksir-tekan]
 *     -> kpesan -> bukti-pesan -> pemohon-tanya [-> pemohon-tekan] -> panel-buka. Simpanan itu sudah memegang kartu pesannya, jadi
 *     panel-pesan-cek langsung meneruskannya ke babak 'pengajuan'.
 *  b4 putusan-buka satu baris; pesan: tiga pesan ditulis ulang (id dan nilai sama, lihat komentar node 'pesan')
 * Simpanan di tengah kasus: semua node lama masih ada dan terjangkau; node baru hanya DISISIPKAN. Simpanan yang sudah melewati
 * 'kfoto' tidak punya tanda `tafsir:urutan`: slip fotonya tanpa baris tafsir sampai Pak Gilang mengoreksi keterangannya.
 */
import type { Baris, CueLatar, Efek, Ekspresi, Episode, IdNode, KonfigInvestigasi, Kondisi, MusikNode, NodeCerita, NodeInvestigasi, Round } from '../../tipe';
import { PILIH_LANJUT, pilihTekan, semuaPress, tandaBukti, tandaCatat, tandaKoreksi, tandaPanel, tandaPanelKeliru, tandaPesan, tandaPutusan, tandaTafsir, tandaTebak, tandaTekan } from '../../investigasi/status';
import { EPISODE_AUTO_2 } from '../auto-2/episode';
import { PEMERAN_KASUS_3 } from './pemeran';
import { TEKS_AUTO_2_INV_3 } from './teks';

type Siapa = 'missRaksa' | 'pemohon' | 'penaksir' | 'ketua' | 'narasi';
const b = (teks: string, siapa: Siapa, ekspresi?: Ekspresi, tata?: CueLatar): Baris => ({ siapa, teks, ...(ekspresi ? { ekspresi } : {}), ...(tata ? { tata } : {}) });
const tanda = (t: string): Kondisi => ({ tanda: t });

const KANTOR: CueLatar = { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] };
const RUANG = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: null, objek: [] });
/** Ruang panel: penaksir (kiri), ketua (tengah), pemohon (kanan); urutan kursi seni Designer (PANEL_SEATS). */
const PANEL: CueLatar = RUANG('penaksir', 'ketua', 'pemohon');
const TELEPON_PEMOHON: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'pemohon', objek: [] };

/**
 * T-134: tanda pada pilihan pesan 'janji' yang dibuat SESUDAH kalimatnya diganti menjadi penolakan menyeluruh (T-132). Bukan tanda
 * skor (skor membaca pesan:janji); hanya memilih naskah tampilan (KonfigInvestigasi.pesanRagam).
 */
const TANDA_TOLAK = 'ragam:pesan:tolak';

/** Dua babak panel (kontrak beku T-102 `Round`); id, kartu dan kartu yang diterima = manifes rubrik 'kasus-3'. */
const BABAK: Round[] = [
  {
    id: 'kronologi',
    statementId: 'pemohon',
    promptKey: 'inv3.panel.kronologi.tanya',
    // Kartu yang diterima tidak di urutan pertama. Kutipan pesan SENGAJA tidak ditawarkan di babak ini (ia juga menjawabnya).
    evidenceIds: ['kartu-kejadian', 'foto-inspeksi', 'penawaran'],
    acceptedIds: ['foto-inspeksi'],
    hintKeys: ['inv3.panel.kronologi.petunjuk1', 'inv3.panel.kronologi.petunjuk2'],
    correctionKey: 'inv3.panel.kronologi.koreksi',
  },
  {
    id: 'pengajuan',
    statementId: 'pemohon-panel',
    promptKey: 'inv3.panel.pengajuan.tanya',
    evidenceIds: ['penawaran', 'pesan-pengajuan', 'foto-inspeksi'],
    acceptedIds: ['pesan-pengajuan'],
    hintKeys: ['inv3.panel.pengajuan.petunjuk1', 'inv3.panel.pengajuan.petunjuk2'],
    correctionKey: 'inv3.panel.pengajuan.koreksi',
  },
];

/** Data KASUS 3 (`Episode.investigasi`). Kunci teks naskahnya berawalan `inv3`. */
const KASUS: KonfigInvestigasi = {
  kasus: 'kasus-3',
  nomor: 3,
  judul: 'inv3.kasus.judul',
  awalan: 'inv3',
  kait: 'inv3.kait',
  nasabah: 'pemohon',
  // Wajah Pak Gilang saat membalas (seni T-103: lega / senang -> lega, cemas -> cemas).
  balasan: { baik: 'lega', datar: 'cemas', janji: 'senang' },
  // T-134 (tinjauan akhir Codex): id 'janji' (nilai 0) dulu JANJI PENGGANTIAN; sejak T-132 kalimatnya PENOLAKAN MENYELURUH. Supaya
  // permainan dan rekaman lama tidak berubah makna, pilihan baru memasang tanda TANDA_TOLAK dan ditampilkan dengan naskah 'tolak'
  // (inv3.pesan.tolak*, inv3.balas.tolak, wajah cemas); pilihan TANPA tanda itu tetap janji penggantian (inv3.pesan.janji*,
  // inv3.balas.janji, wajah senang di atas). Nilainya 0 di kedua naskah; skor hanya membaca pesan:janji.
  pesanRagam: { janji: { tanda: TANDA_TOLAK, id: 'tolak', ekspresi: 'cemas' } },
  bingkai: 'seni',
  pernyataan: [
    // "Tanya lebih lanjut" (kontrak `Press`), tanpa poin.
    // RANTAI LAMA (simpanan dari sebelum T-132): satu pertanyaan per kunjungan, id dan tanda lama. 'setuju' kini BERGUNA, jadi
    // simpanan lama yang pernah membukanya ikut mendapat tanda jeli.
    { id: 'pemohon', siapa: 'pemohon', teks: 'inv3.pernyataan.pemohon', press: { id: 'setuju', questionKey: 'inv3.tekan.pemohon.tanya', answerKey: 'inv3.tekan.pemohon.jawab', berguna: true } },
    { id: 'penaksir', siapa: 'penaksir', teks: 'inv3.pernyataan.penaksir', press: { id: 'kapan', questionKey: 'inv3.tekan.penaksir.tanya', answerKey: 'inv3.tekan.penaksir.jawab' } },
    // Keterangan kedua Pak Gilang, diucapkan di panel sesudah babak 1 (dibantah di babak 2).
    // T-132: kunjungan baru (di panel, sesudah kutipan pesannya diperlihatkan) = DUA pertanyaan, pilih satu:
    //  - 'setuju': "Siapa yang menyetujui kutipan pesan ini?" = BERGUNA (soal sumbernya: pesan itu dari nomornya sendiri dan ia
    //    sendiri yang mengizinkannya dipakai) -> tanda jeli (`press:pemohon-panel:setuju`).
    //  - 'harga': "Siapa yang menentukan harga di perkiraan itu?" = dijawab dengan sopan, tidak membuka hal baru.
    {
      id: 'pemohon-panel', siapa: 'pemohon', teks: 'inv3.pernyataan.pemohon-panel',
      press: { id: 'setuju', questionKey: 'inv3.tekan.pemohon.tanya', answerKey: 'inv3.tekan.pemohon.jawab', berguna: true },
      pressLain: [{ id: 'harga', questionKey: 'inv3.tekan.pemohon.harga.tanya', answerKey: 'inv3.tekan.pemohon.harga.jawab' }],
    },
  ],
  // Urut terkumpul (buku catatan). T-132: judul kartu NETRAL; tiga kartu memakai seni babak 2 (T-128 / T-129). `kutipan` foto =
  // apa yang TERLIHAT di lembarnya (cap tanggal, nomor rangka, cetakan sudut), bukan kesimpulannya. `lapis` = cincin di sekeliling
  // spion, baru digambar sesudah temuannya ada. Kutipan pesan tidak punya seni babak 2: gambar kartunya tetap.
  bukti: [
    { id: 'kartu-kejadian', judul: 'inv3.bukti.kejadian.judul', sumber: 'inv3.bukti.kejadian.sumber', ikon: 'kartu', kutipan: 'inv3.bukti.kejadian.1', seni: 'k3-kartu-kejadian-14' },
    { id: 'penawaran', judul: 'inv3.bukti.penawaran.judul', sumber: 'inv3.bukti.penawaran.sumber', ikon: 'polis', kutipan: 'inv3.bukti.penawaran.1', seni: 'k3-penawaran' },
    { id: 'foto-inspeksi', judul: 'inv3.bukti.foto.judul', sumber: 'inv3.bukti.foto.sumber', ikon: 'foto', kutipan: 'inv3.bukti.foto.kutipan', seni: 'k3-foto-inspeksi-03', lapis: 'k3-cincin' },
    { id: 'pesan-pengajuan', judul: 'inv3.bukti.pesan.judul', sumber: 'inv3.bukti.pesan.sumber', ikon: 'struk', kutipan: 'inv3.bukti.pesan.1' },
  ],
  // T-132 TAFSIR 'urutan' (formatif): foto pemeriksaan bercap 03 dipasangkan dengan kartu kejadian bertanggal 14. Pilihan pertama =
  // apa yang dikatakan pemohon ("malam itu juga"); yang tepat = sebelum kejadian. Tafsiran pemain sampai Pak Gilang mengoreksi
  // keterangannya di babak 1; sesudah itu temuan.
  tafsir: [
    // T-134: kartu kejadian (kalender 14) tampil di samping pertanyaannya, seperti yang dijanjikan narasi 'baca-foto'.
    {
      id: 'urutan', bukti: 'foto-inspeksi', tampilan: 'bingkai', seni: 'k3-foto-inspeksi-03', seniKet: 'inv3.tafsir.urutan.gambar', tanya: 'inv3.tafsir.urutan.tanya', tepat: 'sebelum',
      samping: 'kartu-kejadian', sampingKet: 'inv3.tafsir.urutan.samping',
      opsi: (['saat', 'sebelum', 'sesudah'] as const).map((x) => ({ id: x, teks: `inv3.tafsir.urutan.pilih.${x}` })),
      temuan: 'inv3.tafsir.urutan.temuan', ringkas: 'inv3.tafsir.urutan.ringkas', mapanSaat: tandaKoreksi(BABAK[0]!.statementId),
    },
  ],
  // T-132: kesimpulan KEDUA (permintaan memasukkan retak lama) lahir dari babak 2: tafsiran sesudah kutipan pesannya diajukan,
  // temuan sesudah Pak Gilang mengoreksi keterangan keduanya. Dua kesimpulan itu tetap dua baris terpisah di halaman "Temuan".
  temuanBabak: [{ round: 'pengajuan', bukti: 'pesan-pengajuan', temuan: 'inv3.temuan.pengajuan', ringkas: 'inv3.temuan.pengajuan.ringkas' }],
  tebak: {
    pilihan: (['sama', 'beda', 'belum'] as const).map((id) => ({ id, teks: `inv3.tebak.pilih.${id}` })),
    balikPada: 'foto-inspeksi',
  },
  // Kasus ber-panel tetap mengisi `keberatan` (= babak pertama) untuk pembaca lama; layar panel hanya membaca `panel`.
  keberatan: {
    pernyataan: BABAK[0]!.statementId,
    tepat: 'foto-inspeksi',
    urutan: BABAK[0]!.evidenceIds,
    tanya: BABAK[0]!.promptKey,
    layar: { tanya: BABAK[0]!.promptKey, petunjuk1: BABAK[0]!.hintKeys[0], petunjuk2: BABAK[0]!.hintKeys[1] },
    perbesar: ['foto-inspeksi', 'pesan-pengajuan'],
  },
  // [konfirmasi PIC] Tabel putusan (= manifes rubrik 'kasus-3'): 'tambahan' = "Teruskan untuk pemeriksaan" (baris spion ke tim
  // berwenang, bumper dicatat terpisah) 30; 'layak' = minta klarifikasi saja 15; 'polis' = nyatakan seluruh klaim curang 0.
  putusan: { tambahan: 30, layak: 15, polis: 0 },
  putusanLayar: {
    ket: 'inv3.putusan.ket',
    sebab: { layak: 'inv3.putusan.layak.sebab', tambahan: 'inv3.putusan.tambahan.sebab', polis: 'inv3.putusan.polis.sebab' },
    // Nama tampil putusan kasus ini (id internal tidak berubah).
    nama: { layak: 'inv3.putusan.layak', tambahan: 'inv3.putusan.tambahan', polis: 'inv3.putusan.polis' },
  },
  koreksi: { judul: 'inv3.koreksi.judul', ket: 'inv3.koreksi.ket', baris: BABAK[0]!.correctionKey },
  // [konfirmasi PIC] nama panel dan ketuanya (teks). `chair` = id pemeran.
  panel: { chair: 'ketua', rounds: BABAK },
  // Tanpa `berikut` / `segera`: tiga kasus adalah seluruh seri (spec: tanpa ubin Kasus 4 terkunci).
  // Arsip = berkas yang sudah dikoreksi: tiga baris bertanggal + pesan yang dikirim tamu.
  arsip: { judul: 'inv3.arsip.judul', garis: ['inv3.garis.1', 'inv3.garis.2', 'inv3.garis.3'], sorot: 1, pesan: 'inv3.arsip.pesan' },
};

const dialog = (id: IdNode, tata: CueLatar, baris: Baris[], lanjut: IdNode, opsi: { efek?: Efek; investigasi?: NodeInvestigasi } = {}): NodeCerita =>
  ({ id, bab: '', jenis: 'dialog', tata, baris, lanjut, ...(opsi.efek ? { efek: opsi.efek } : {}), ...(opsi.investigasi ? { investigasi: opsi.investigasi } : {}) });

/**
 * "Tanya lebih lanjut" pada satu pernyataan (NodeDasar.tekan): node tawar (PILIHAN) + satu node jawab per pertanyaan (DIALOG,
 * memasang press:<pernyataan>:<id>). Semuanya maju ke `lanjut`: tidak ada efek cerita yang terulang, tidak ada putaran.
 * T-132: pernyataan ber-`pressLain` = beberapa pertanyaan, pilih satu. Pertanyaan pertama tetap pilihan 'tekan' dan node
 * `<pernyataan>-tekan` (id lama); yang lain pilihan 'tekan-<id>' dan node `<pernyataan>-tekan-<id>`.
 */
function tanyaLanjut(idPernyataan: string, tata: CueLatar, ekspresi: Ekspresi, lanjut: IdNode): NodeCerita[] {
  const p = KASUS.pernyataan.find((x) => x.id === idPernyataan)!;
  const pertama = p.press!;
  const idJawab = (idPress: string): IdNode => (idPress === pertama.id ? `${idPernyataan}-tekan` : `${idPernyataan}-tekan-${idPress}`);
  return [
    {
      id: `${idPernyataan}-tanya`, bab: '', jenis: 'pilihan', tata, baris: [b('inv.ui.tekan.1', 'narasi')], tanya: 'inv.ui.tekan.pilih',
      tekan: { pernyataan: p.id, press: pertama.id, langkah: 'tawar' },
      pilihan: [
        ...semuaPress(p).map((x) => ({ id: pilihTekan(p, x.id), teks: x.questionKey, lanjut: idJawab(x.id) })),
        { id: PILIH_LANJUT, teks: 'inv.ui.tekan.lanjut', lanjut },
      ],
    },
    ...semuaPress(p).map((x): NodeCerita => ({
      ...dialog(idJawab(x.id), tata, [b(x.answerKey, p.siapa as Siapa, ekspresi)], lanjut, { efek: { pasang: [tandaTekan(p.id, x.id)] } }),
      tekan: { pernyataan: p.id, press: x.id, langkah: 'jawab' },
    })),
  ];
}

/**
 * Satu babak panel: percobaan 0 dan 1 = node PILIHAN (id pilihan = id kartu; hanya kartu yang sudah terkumpul lewat `jika`),
 * kartu keliru -> ketua menjelaskan BATAS kartu itu -> percobaan berikut; percobaan 2 = node DIALOG dipandu. Kartu yang
 * diterima / node dipandu memasang tanda hasil babak dan maju ke `sesudah`.
 */
function babakPanel(r: Round, sesudah: IdNode): NodeCerita[] {
  const awal = `panel-${r.id}`;
  const coba = (n: 0 | 1): NodeCerita[] => {
    const id = `${awal}-${n}`;
    const berikut = `${awal}-${n + 1}`;
    return [
      {
        id, bab: '', jenis: 'pilihan', tata: PANEL, baris: [b(`inv3.panel.${r.id}.${n + 1}`, 'narasi')], tanya: r.promptKey,
        investigasi: { jenis: 'panel', round: r.id, attempt: n },
        pilihan: r.evidenceIds.map((x) => {
          const terima = r.acceptedIds.includes(x);
          return {
            id: x,
            teks: `inv3.panel.pilih.${x}`,
            jika: tanda(tandaBukti(x)),
            efek: { pasang: [terima ? tandaPanel(r.id, n === 0 ? 'first' : 'second') : tandaPanelKeliru(r.id, n, x)] },
            lanjut: terima ? sesudah : `${id}-${x}`,
          };
        }),
      },
      // Kalimat sesudah kartu keliru: `<awalan>.panel.<babak>.salah.<kartu>` (percobaan 0) / `.pandu.<kartu>` (percobaan 1).
      ...r.evidenceIds.filter((x) => !r.acceptedIds.includes(x)).map((x) =>
        dialog(`${id}-${x}`, PANEL, [b(`inv3.panel.${r.id}.${n === 0 ? 'salah' : 'pandu'}.${x}`, 'ketua', n === 0 ? 'netral' : 'serius')], berikut)),
    ];
  };
  return [
    ...coba(0),
    ...coba(1),
    dialog(`${awal}-2`, PANEL, [b(`inv3.panel.${r.id}.3`, 'narasi')], sesudah,
      { efek: { pasang: [tandaPanel(r.id, 'guided')] }, investigasi: { jenis: 'panel', round: r.id, attempt: 2 } }),
  ];
}

function bangunNode(): NodeCerita[] {
  const [kronologi, pengajuan] = BABAK as [Round, Round];
  return [
    // ---------------------------------------------------------------- b1: kartu judul, kartu kejadian, tebakan, dua keterangan
    dialog('judul', KANTOR, [b('inv3.judul.kartu', 'narasi')], 'buka', { investigasi: { jenis: 'judul' } }),
    dialog('buka', KANTOR, [b('inv3.buka.1', 'missRaksa', 'serius')], 'bukti-kejadian'),
    dialog('bukti-kejadian', KANTOR, [b('inv3.bukti.kejadian.1', 'narasi')], 'tebak',
      { efek: { pasang: [tandaBukti('kartu-kejadian')] }, investigasi: { jenis: 'bukti', bukti: 'kartu-kejadian' } }),
    // Tebakan pembuka tanpa benar / salah (spec: "Apakah kedua bagian rusak pada kejadian yang sama?").
    {
      id: 'tebak', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv3.tebak.1', 'narasi')], tanya: 'inv3.tebak.tanya',
      investigasi: { jenis: 'tebak' },
      pilihan: KASUS.tebak.pilihan.map((p) => ({ id: p.id, teks: p.teks, efek: { pasang: [tandaTebak(p.id)] }, lanjut: 'pemohon' })),
    },
    dialog('pemohon', RUANG('pemohon'), [b('inv3.pemohon.1', 'narasi'), b('inv3.pemohon.2', 'pemohon', 'netral'), b('inv3.pemohon.3', 'pemohon', 'serius')], 'penaksir',
      { efek: { pasang: [tandaCatat('pemohon')] }, investigasi: { jenis: 'catat', pernyataan: 'pemohon' } }),
    dialog('penaksir', RUANG('penaksir'), [b('inv3.penaksir.1', 'narasi'), b('inv3.penaksir.2', 'penaksir', 'netral'), b('inv3.penaksir.3', 'penaksir', 'serius')], 'bukti-penawaran',
      { efek: { pasang: [tandaCatat('penaksir')] }, investigasi: { jenis: 'catat', pernyataan: 'penaksir' } }),
    dialog('bukti-penawaran', RUANG('penaksir'), [b('inv3.bukti.penawaran.1', 'narasi')], 'selisih',
      { efek: { pasang: [tandaBukti('penawaran')] }, investigasi: { jenis: 'bukti', bukti: 'penawaran' } }),
    dialog('selisih', KANTOR, [b('inv3.selisih.1', 'missRaksa', 'serius')], 'kfoto'),

    // ---------------------------------------------------------------- b2: dua sumber terbaca sebelum panel (foto, kutipan pesan)
    dialog('kfoto', RUANG('penaksir'), [b('inv3.foto.1', 'narasi'), b('inv3.foto.2', 'penaksir', 'netral')], 'baca-foto'),
    // T-132 TAFSIR 'urutan' (formatif, node BARU yang disisipkan): pemain memasangkan foto bercap tanggal dengan kartu kejadian.
    // Simpanan lama di 'kfoto' lewat sini; yang sudah di 'bukti-foto' tidak.
    dialog('baca-foto', RUANG('penaksir'), [b('inv3.baca.foto.1', 'narasi')], 'bukti-foto',
      { efek: { pasang: [tandaTafsir('urutan')] }, investigasi: { jenis: 'tafsir', tafsir: 'urutan' } }),
    dialog('bukti-foto', RUANG('penaksir'), [b('inv3.bukti.foto.1', 'narasi')], 'penaksir-cek',
      { efek: { pasang: [tandaBukti('foto-inspeksi')] }, investigasi: { jenis: 'bukti', bukti: 'foto-inspeksi' } }),
    // T-132: pemain yang sudah membaca urutannya sendiri ('baca-foto') langsung ke panel: pertanyaan lama untuk Pak Seno ("Kapan
    // foto pemeriksaan ini diambil?") sudah ia jawab sendiri, dan kutipan pesannya baru dibaca di panel, sesudah babak 1.
    // Simpanan lama yang melewati 'kfoto' sebelum T-132 (tanpa tanda tafsir itu) meneruskan RANTAI LAMA di bawah ini, tanpa perubahan.
    { id: 'penaksir-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaTafsir('urutan')), lanjut: 'panel-buka' }], lainnya: 'penaksir-tanya' },
    // ---- RANTAI LAMA (hanya simpanan dari sebelum T-132): pertanyaan Pak Seno, persetujuan, kutipan pesan, pertanyaan Pak Gilang
    ...tanyaLanjut('penaksir', RUANG('penaksir'), 'netral', 'kpesan'),
    // [konfirmasi PIC] persetujuan pemohon sebelum kutipan pesannya diperlihatkan.
    dialog('kpesan', RUANG('pemohon'), [b('inv3.kutipan.1', 'narasi'), b('inv3.kutipan.2', 'pemohon', 'netral')], 'bukti-pesan'),
    dialog('bukti-pesan', RUANG('pemohon'), [b('inv3.bukti.pesan.1', 'narasi')], 'pemohon-tanya',
      { efek: { pasang: [tandaBukti('pesan-pengajuan')] }, investigasi: { jenis: 'bukti', bukti: 'pesan-pengajuan' } }),
    ...tanyaLanjut('pemohon', RUANG('pemohon'), 'netral', 'panel-buka'),

    // ---------------------------------------------------------------- b3: PANEL TELAAH, dua babak berurutan
    // [konfirmasi PIC] nama panel, wewenangnya, dan hak tiap pihak untuk menjelaskan / mengoreksi.
    // T-132: kalimat Pak Seno yang mengulang keterangannya ('inv3.panel-buka.3') dilepas dari graf untuk menjaga panjang kasus;
    // kuncinya tetap ada (riwayat simpanan lama).
    dialog('panel-buka', PANEL, [
      b('inv3.panel-buka.1', 'narasi'),
      b('inv3.panel-buka.2', 'ketua', 'serius'),
      b('inv3.panel-buka.4', 'ketua', 'netral'),
    ], 'panel-kronologi-0'),
    ...babakPanel(kronologi, 'panel-kronologi-jawab'),
    // Hak jawab: pemohon menanggapi bukti itu dan mengoreksi keterangannya sendiri.
    dialog('panel-kronologi-jawab', PANEL, [
      b('inv3.kronologi.jawab.1', 'narasi'),
      b('inv3.kronologi.jawab.2', 'ketua', 'netral'), // [konfirmasi PIC]
      b('inv3.kronologi.jawab.3', 'pemohon', 'cemas'),
    ], 'panel-kronologi-koreksi'),
    dialog('panel-kronologi-koreksi', PANEL, [b('inv3.kronologi.koreksi.1', 'narasi')], 'panel-kira',
      { efek: { pasang: [tandaKoreksi(kronologi.statementId)] }, investigasi: { jenis: 'panel-koreksi', round: kronologi.id } }),
    // Keterangan kedua (niat masih terbuka sesudah babak 1): dicatat, lalu dibantah di babak 2.
    // T-132 (rencana: "An estimate alone doesn't show what I asked for"): SEBELUM kutipan pesannya diajukan, Pak Gilang berkeberatan
    // dengan wajar: perkiraan biaya disusun bengkel dan tidak menunjukkan apa yang ia minta. Itu benar; yang menunjukkannya adalah
    // kata-katanya sendiri (babak 2). Tanpa putaran tanya-jawab baru, tanpa menuduh.
    dialog('panel-kira', PANEL, [b('inv3.kira.1', 'ketua', 'netral'), b('inv3.kira.tapi', 'pemohon', 'netral'), b('inv3.kira.2', 'pemohon', 'cemas')], 'panel-pesan-cek',
      { efek: { pasang: [tandaCatat('pemohon-panel')] }, investigasi: { jenis: 'catat', pernyataan: 'pemohon-panel' } }),
    // T-132: kutipan pesan baru diminta DI SINI, sesudah keberatan Pak Gilang. Simpanan lama yang sudah memegang kartunya (rantai
    // lama, dibaca sebelum panel) langsung ke babak 2: persetujuannya tidak diminta dua kali.
    { id: 'panel-pesan-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaBukti('pesan-pengajuan')), lanjut: 'panel-pengajuan-0' }], lainnya: 'panel-izin' },
    // [konfirmasi PIC] persetujuan pemohon sebelum kutipan pesannya diperlihatkan (kalimat yang sama dengan 'kpesan'), kini di depan panel.
    dialog('panel-izin', PANEL, [b('inv3.kutipan.1', 'narasi'), b('inv3.kutipan.2', 'pemohon', 'netral')], 'panel-bukti-pesan'),
    dialog('panel-bukti-pesan', PANEL, [b('inv3.bukti.pesan.1', 'narasi')], 'pemohon-panel-tanya',
      { efek: { pasang: [tandaBukti('pesan-pengajuan')] }, investigasi: { jenis: 'bukti', bukti: 'pesan-pengajuan' } }),
    ...tanyaLanjut('pemohon-panel', PANEL, 'netral', 'panel-pengajuan-0'),
    ...babakPanel(pengajuan, 'panel-pengajuan-jawab'),
    // Hak jawab kedua pihak; 'tersenyum' = wajah TERBUKA pemohon (menjelaskan dengan tenang, seni T-103).
    dialog('panel-pengajuan-jawab', PANEL, [
      b('inv3.pengajuan.jawab.1', 'narasi'),
      b('inv3.pengajuan.jawab.2', 'ketua', 'netral'), // [konfirmasi PIC]
      // T-132: hanya untuk pemain bertanda jeli (tadi menanyakan siapa yang menyetujui kutipan itu; rantai lama atau baru). [konfirmasi PIC]
      { ...b('inv3.pengajuan.jawab.jeli', 'narasi'), jika: { salahSatu: [tanda(tandaTekan('pemohon-panel', 'setuju')), tanda(tandaTekan('pemohon', 'setuju'))] } },
      b('inv3.pengajuan.jawab.3', 'pemohon', 'tersenyum'),
      b('inv3.pengajuan.jawab.4', 'penaksir', 'cemas'),
      b('inv3.pengajuan.jawab.5', 'ketua', 'netral'), // [konfirmasi PIC]
    ], 'panel-pengajuan-koreksi'),
    dialog('panel-pengajuan-koreksi', PANEL, [b('inv3.pengajuan.koreksi.1', 'narasi')], 'putusan-buka',
      { efek: { pasang: [tandaKoreksi(pengajuan.statementId)] }, investigasi: { jenis: 'panel-koreksi', round: pengajuan.id } }),

    // ---------------------------------------------------------------- b4: kesimpulan, pesan untuk Pak Gilang, hasil
    // Pertanyaan ketua yang dinaskahkan spec: "Apa yang bisa kita simpulkan dari bukti ini?"
    // T-132: satu baris (kalimat penegasan 'inv3.putusan.1' dilepas dari graf untuk menjaga panjang kasus; kuncinya tetap ada).
    dialog('putusan-buka', PANEL, [b('inv3.putusan.2', 'ketua', 'serius')], 'putusan'), // [konfirmasi PIC]
    {
      id: 'putusan', bab: '', jenis: 'pilihan', tata: PANEL, baris: [b('inv3.putusan.3', 'narasi')], tanya: 'inv3.putusan.tanya',
      investigasi: { jenis: 'putusan' },
      // [konfirmasi PIC] tiga pilihan tindak lanjut; id internal layak / tambahan / polis, nama tampil = teks kasus.
      pilihan: (['layak', 'tambahan', 'polis'] as const).map((x) => ({ id: x, teks: `inv3.putusan.${x}`, efek: { pasang: [tandaPutusan(x)] }, lanjut: `putusan-${x}` })),
    },
    // [konfirmasi PIC] Tiga penjelasan (siapa yang berwenang memeriksa, bumper dicatat terpisah, tanpa putusan bayar / tolak).
    dialog('putusan-tambahan', KANTOR, [b('inv3.putusan.tambahan.1', 'missRaksa', 'tersenyum')], 'pesan'),
    dialog('putusan-layak', KANTOR, [b('inv3.putusan.layak.1', 'missRaksa', 'serius')], 'pesan'),
    dialog('putusan-polis', KANTOR, [b('inv3.putusan.polis.1', 'missRaksa', 'serius')], 'pesan'),
    {
      id: 'pesan', bab: '', jenis: 'pilihan', tata: TELEPON_PEMOHON, baris: [b('inv3.pesan.1', 'narasi'), b('inv3.pesan.2', 'pemohon', 'cemas')], tanya: 'inv3.pesan.tanya',
      // [konfirmasi PIC] 'baik' = berterima kasih, langkah berikutnya, dan hak menambahkan keterangan; 'datar' = isi benar tanpa
      // hormat dan tanpa hak itu; 'janji' = hasil yang diumumkan tanpa dasar dan tanpa wewenang.
      // T-132 (rencana: "Short respectful referral earns full credit; a long blanket rejection of both items earns zero"): TIGA
      // pilihan, id dan nilai tidak berubah (rubrik bersama hanya mengenal baik / datar / janji). Yang berubah hanya kalimatnya:
      // 'baik' = rujukan singkat yang hormat (paling pendek); 'datar' = benar tetapi dingin, tanpa hak menambahkan keterangan;
      // 'janji' (0) = penolakan menyeluruh atas KEDUA baris, paling panjang, menyebut dirinya final. Dulu pesan 0 itu janji
      // penggantian; keduanya mengumumkan hasil yang bukan wewenang Investigator. Karena isinya kini penolakan, kepercayaan Pak
      // Gilang turun (dulu naik) dan wajah balasannya cemas.
      // T-134: penolakan itu punya KUNCI TEKS SENDIRI (inv3.pesan.tolak*) dan node reaksi sendiri ('pesan-tolak'); kunci dan node
      // lama (inv3.pesan.janji*, 'pesan-janji') kembali berisi janji penggantian, jadi riwayat, arsip dan layar hasil permainan lama
      // tetap menampilkan apa yang dulu dipilih. Pilihan baru memasang TANDA_TOLAK.
      pilihan: [
        { id: 'janji', teks: 'inv3.pesan.tolak', efek: { kepercayaan: -10, alasan: 'inv3.pesan.tolak.alasan', pasang: [tandaPesan('janji'), TANDA_TOLAK] }, lanjut: 'pesan-janji-cek' },
        { id: 'baik', teks: 'inv3.pesan.baik', efek: { kepercayaan: 30, alasan: 'inv3.pesan.baik.alasan', pasang: [tandaPesan('baik')] }, lanjut: 'pesan-baik' },
        { id: 'datar', teks: 'inv3.pesan.datar', efek: { pasang: [tandaPesan('datar')] }, lanjut: 'pesan-datar' },
      ],
    },
    dialog('pesan-baik', TELEPON_PEMOHON, [b('inv3.pesan.baik.1', 'pemohon', 'lega')], 'akhir-cek'),
    dialog('pesan-datar', TELEPON_PEMOHON, [b('inv3.pesan.datar.1', 'pemohon', 'cemas'), b('inv3.pesan.datar.2', 'narasi')], 'akhir-cek'),
    // T-134: pilihan 'janji' yang baru selalu membawa TANDA_TOLAK -> 'pesan-tolak'. 'pesan-janji' = reaksi atas janji penggantian
    // (naskah lama, wajah senang): hanya untuk simpanan dari sebelum T-132 yang berdiri di node itu.
    { id: 'pesan-janji-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(TANDA_TOLAK), lanjut: 'pesan-tolak' }], lainnya: 'pesan-janji' },
    dialog('pesan-tolak', TELEPON_PEMOHON, [b('inv3.pesan.tolak.1', 'pemohon', 'cemas'), b('inv3.pesan.tolak.2', 'narasi')], 'akhir-cek'),
    dialog('pesan-janji', TELEPON_PEMOHON, [b('inv3.pesan.janji.1', 'pemohon', 'senang'), b('inv3.pesan.janji.2', 'narasi')], 'akhir-cek'),
    { id: 'akhir-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaPutusan('tambahan')), lanjut: 'akhir-tuntas' }], lainnya: 'akhir-tinjau' },
    ...(['tuntas', 'tinjau'] as const).map((akhir): NodeCerita => ({
      id: `akhir-${akhir}`, bab: '', jenis: 'akhir', akhir, tata: KANTOR,
      baris: [b(`inv3.akhir.${akhir}.1`, 'missRaksa', akhir === 'tuntas' ? 'tersenyum' : 'netral')],
      investigasi: { jenis: 'hasil-investigasi' },
    })),
  ];
}

/** Bagian tiap node (kepala layar "BAGIAN n/4"). */
function babInv3(id: IdNode): string {
  if (['judul', 'buka', 'bukti-kejadian', 'tebak', 'pemohon', 'penaksir', 'bukti-penawaran', 'selisih'].includes(id)) return 'b1';
  if (id.startsWith('panel') || id.startsWith('pemohon-panel')) return 'b3';
  if (id.startsWith('putusan') || id.startsWith('pesan') || id.startsWith('akhir')) return 'b4';
  return 'b2';
}

/** Musik per FASE, trek T-085 dipakai ulang seperti kasus 2 (tanpa musik baru). */
function musikInv3(id: IdNode): MusikNode {
  if (['pemohon', 'penaksir', 'bukti-penawaran', 'selisih'].includes(id)) return 'inv-keterangan';
  const bab = babInv3(id);
  if (bab === 'b3') return 'inv-keberatan';
  if (bab === 'b4') return 'inv-terungkap';
  return 'inv-investigasi';
}

function bangun(asal: Episode): Episode {
  return {
    id: 'auto-2-inv-3',
    versi: 1,
    produk: 'AUTO',
    jenis: 'nyata',
    judul: 'judul',
    ringkas: 'ringkas',
    durasiMenit: 5,
    mulai: 'judul',
    pemeran: { missRaksa: asal.pemeran.missRaksa!, ...PEMERAN_KASUS_3 },
    nasabah: KASUS.nasabah,
    bab: ([1, 2, 3, 4] as const).map((n) => ({ id: `b${n}`, judul: `inv3.bab.${n}.judul`, tujuan: `inv3.bab.${n}.tujuan` })),
    akhir: {
      tuntas: { judul: 'inv3.akhir.tuntas.judul', ringkas: 'inv3.akhir.tuntas.ringkas', nada: 'baik', pelajaran: ['inv3.pelajaran.1'] },
      tinjau: { judul: 'inv3.akhir.tinjau.judul', ringkas: 'inv3.akhir.tinjau.ringkas', nada: 'campuran', pelajaran: ['inv3.pelajaran.1'] },
    },
    paham: {},
    proses: {},
    catatan: {},
    kepercayaanAwal: 30,
    kepercayaanBatas: { min: 0, maks: 100 },
    labelSuasana: 'status',
    antarmuka: 'hp',
    suasana: asal.suasana,
    node: Object.fromEntries(bangunNode().map((n) => [n.id, { ...n, bab: babInv3(n.id), musik: musikInv3(n.id) }])),
    aktivitas: {},
    teks: TEKS_AUTO_2_INV_3,
    bahasa: ['id', 'en', 'zh'],
    // Latar auto-2 (kantor, ruang wawancara); gambar kartu daftar episode = Pak Gilang di ruang wawancara.
    latar: asal.latar ? { ...asal.latar, sampul: { lokasi: 'wawancara', hadir: ['pemohon'] } } : undefined,
    tampilan: { teksBesar: true },
    investigasi: KASUS,
  };
}

/**
 * Investigator kasus 3. Build tanpa auto-2 (VITE_CERITA_TANPA=auto-2): vite.config ikut mengganti modul ini dengan rintisan
 * null, jadi isi kasusnya tidak terbawa lewat episode ini.
 */
export const EPISODE_AUTO_2_INV_3: Episode = bangun(EPISODE_AUTO_2);
