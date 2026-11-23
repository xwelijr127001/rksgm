/**
 * T-076 EPISODE 1 · INVESTIGATOR (pilot; spec docs/superpowers/specs/2026-11-20-episode-1-investigator-design.md, plan Task 1):
 * satu kasus 5 menit bergaya detektif di atas kasus truk trailer. Episode TERPISAH (id `auto-2-inv`, simpanan cerita sendiri,
 * rute pendek /cerita/investigator); Episode 1 lengkap (`auto-2`) dan Episode 1 Dev (`auto-2-dev`) tidak berubah: episode ini
 * hanya MEMAKAI ULANG latar, seni, pemeran, aktivitas SIM (auto-2) dan aktivitas dashcam (auto-2-dev).
 *
 * Fiksi kasus (keputusan Lead): catatan petugas tol menyebut truk di LAJUR 3 (terlarang untuk truk), jadi klaim terlihat tidak
 * dijamin; pemain membuktikan dengan dashcam bahwa truk di LAJUR 2. Putarannya MELINDUNGI nasabah yang jujur.
 *
 * Alur (b1-b4 = bagian di kepala layar; jenis investigasi tiap node di kurung, lihat NodeInvestigasi di cerita/tipe.ts):
 *  b1 judul (judul) -> buka (SATU baris) -> tebak (tebak, PILIHAN lajur 1-4, T-087) -> darto (catat) -> tol (catat) -> selisih
 *  b2 kdash [arena dashcam] -> bukti-rekaman (bukti dashcam + rambu dalam SATU halaman buku, T-087; kalimat "Tebakan awalmu")
 *     -> ksim (periksa-sim, T-080) -> bukti-sim (bukti)
 *  b3 keb-buka -> keb0 (keberatan 0, PILIHAN) --tepat--> keb-cap
 *                    |--keliru--> keb0-<kartu> -> keb1 (keberatan 1, PILIHAN) --tepat--> keb-cap
 *                                                   |--keliru--> keb1-<kartu> -> keb2 (keberatan 2 dipandu, DIALOG) -> keb-cap
 *     keb-cap (cap) -> keb-akui (petugas mengakui kekeliruannya) -> keb-koreksi (koreksi: ia mencoret 3 dan menulis 2, T-087)
 *  b4 putusan-buka -> putusan (putusan, PILIHAN) -> putusan-<x> -> pesan (PILIHAN di obrolan Pak Hendra) -> pesan-<x>
 *     -> akhir-cek -> akhir-tuntas | akhir-tinjau (hasil-investigasi; AKHIR)
 * Kekeliruan tidak pernah menghentikan pemain (tanpa nyawa, tanpa waktu): hanya poin yang berbeda. Kartu yang tepat (dashcam)
 * selalu terkumpul di jalur wajib sebelum keberatan; pilihan keberatan memakai `jika: bukti:<id>` supaya kartu yang belum
 * terkumpul tidak pernah bisa dipilih.
 *
 * Skor (cerita/investigasi/skor.ts) dibaca dari TANDA: keb:<tepat|tepat-kedua|dipandu>, putusan:<layak|tambahan|polis>,
 * pesan:<baik|datar|janji>. Dua akhir (penjaga episode mewajibkan >= 2): `tuntas` = putusan layak, `tinjau` = putusan lain
 * (diluruskan Miss Raksa; klaim tetap dijamin di kedua akhir). Status Pak Hendra (30 = Cemas) hanya berubah oleh pesan.
 *
 * T-127 BABAK 2 (masukan Pak Peterson, rencana docs/superpowers/plans/2026-11-22-peterson-feedback.md "1 · Truck"). Semua
 * tambahan FORMATIF: tanpa poin, bukan pilihan bernilai (investigasi/acara.ts), tanpa tanda yang dibaca skor. Yang TIDAK berubah:
 * id node lama, id pilihan yang dinilai (kartu KEBERATAN, putusan, pesan) dan urutan percobaannya, tanda skor, versi episode.
 *  b1 tol-tanya = PILIHAN dua pertanyaan (+ lanjut): 'tekan' -> tol-tekan (di mana petugas berdiri: BERGUNA, tanda jeli, gambar
 *     pandangan dari pos) | 'tekan-rambu' -> tol-tekan-rambu (apa yang dilarang rambu: sopan, tidak membuka hal baru)
 *  b2 kdash -> baca-rekaman (BARU, tafsir 'lajur': bingkai 14:32 tanpa nomor lajur; lajur 2 / lajur 3 / tidak jelas) -> bukti-rekaman
 *     ksim  = tafsir 'sim' (golongan cocok / tidak cocok / tahun tidak terbaca) menggantikan tiga ketukan "COCOK"
 *  b3 keb-buka dua baris (kalimat Miss Raksa yang menunjuk jawabannya dilepas); keb0 = TEMUAN BERPASANGAN (satu keterangan +
 *     satu bukti; kartu buktinya tetap pilihan bernilai yang sama); keb-akui = petugas lebih dulu berkeberatan ("ada kendaraan di
 *     lajur 3"), lalu membedakan mobil kecil dari kepala truk, baru mengoreksi laporannya
 *  b4 pesan: tiga pesan ditulis ulang (id dan nilai sama): yang terbaik pendek, janji pembayaran yang paling panjang tetap keliru
 * Simpanan di tengah kasus: semua node lama masih ada dan terjangkau; node baru hanya DISISIPKAN (kdash -> baca-rekaman ->
 * bukti-rekaman). Simpanan yang sudah melewati titik itu tidak punya tanda `tafsir:*`: slip buktinya tanpa baris tafsir, dan
 * temuannya muncul begitu laporan dikoreksi (status.ts temuanKasus).
 */
import type { Baris, CueLatar, DefAktivitas, Efek, Ekspresi, Episode, IdNode, KonfigInvestigasi, Kondisi, MusikNode, NodeCerita, NodeInvestigasi, Press } from '../../tipe';
import { LAJUR, PILIH_LANJUT, PILIH_TEKAN, tandaBukti, tandaCatat, tandaKeberatan, tandaKoreksi, tandaPesan, tandaPutusan, tandaTafsir, tandaTebak, tandaTekan } from '../../investigasi/status';
import { EPISODE_AUTO_2 } from '../auto-2/episode';
import { EPISODE_AUTO_2_DEV } from '../auto-2-dev/episode';
import { TEKS_AUTO_2_INV } from './teks';

type Siapa = 'missRaksa' | 'hendra' | 'bima' | 'darto' | 'tol' | 'narasi';
const b = (teks: string, siapa: Siapa, ekspresi?: Ekspresi, tata?: CueLatar): Baris => ({ siapa, teks, ...(ekspresi ? { ekspresi } : {}), ...(tata ? { tata } : {}) });
const tanda = (t: string): Kondisi => ({ tanda: t });

// Tata panggung (komposisi yang sudah dipakai auto-2: kantor + Miss Raksa, ruang wawancara 1-2 tokoh, obrolan Pak Hendra).
const KANTOR: CueLatar = { lokasi: 'kantor', hadir: ['missRaksa'], telepon: null, objek: [] };
const RUANG = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: null, objek: [] });
/** Miss Raksa memandu lewat telepon (sisipan wajah) saat pemain di lapangan; tokoh di ruangan tetap. */
const RUANG_TELEPON = (...hadir: string[]): CueLatar => ({ lokasi: 'wawancara', hadir, telepon: 'missRaksa', objek: [] });
const TELEPON_HENDRA: CueLatar = { lokasi: 'kantor', hadir: [], telepon: 'hendra', objek: [] };

/**
 * T-090: data KASUS 1 (`Episode.investigasi`). Yang dulu konstanta di berkas ini / di LayarInvestigasi (urutan kartu KEBERATAN,
 * kartu tepat, pernyataan yang dibantah, tebakan lajur, tabel putusan, nasabah) sekarang data; graf, id, tanda dan teksnya
 * tidak berubah.
 */
/**
 * T-104 "Tanya lebih lanjut" pada keterangan petugas tol. T-127: DUA pertanyaan, pilih satu.
 *  - 'lihat' (id dan tanda lama `press:tol:lihat`): "Bapak berdiri di mana waktu melihatnya?" = BERGUNA: jawabannya (dari pos, dari
 *    samping) menjelaskan garis pandangnya, dengan gambar pandangan dari pos (seni T-128). Simpanan lama yang sudah membuka
 *    pertanyaan lamanya ("melihat sendiri?") ikut mendapat tanda jeli: isinya sama, tentang apa yang ia lihat sendiri.
 *  - 'rambu': "Apa yang dilarang rambu di ruas itu?" = dijawab dengan sopan, tetapi tidak membuka hal baru (tanpa tanda jeli).
 */
const TEKAN_TOL: Press = { id: 'lihat', questionKey: 'inv.tekan.tol.tanya', answerKey: 'inv.tekan.tol.jawab', berguna: true, seni: 'k1-pos-petugas', seniKet: 'inv.tekan.tol.gambar' };
const TEKAN_TOL_RAMBU: Press = { id: 'rambu', questionKey: 'inv.tekan.tol.rambu.tanya', answerKey: 'inv.tekan.tol.rambu.jawab' };
/** Id pilihan pertanyaan kedua di node tawar (investigasi/status.ts pilihTekan). */
const PILIH_TEKAN_RAMBU = `${PILIH_TEKAN}-${TEKAN_TOL_RAMBU.id}`;

const KASUS: KonfigInvestigasi = {
  kasus: 'kasus-1',
  nomor: 1,
  judul: 'inv.kasus.judul',
  awalan: 'inv',
  kait: 'inv.kait',
  nasabah: 'hendra',
  balasan: { baik: 'lega', datar: 'bingung', janji: 'senang' },
  bingkai: 'dashcam',
  pernyataan: [
    { id: 'darto', siapa: 'darto', teks: 'inv.pernyataan.darto' },
    { id: 'tol', siapa: 'petugasTol', teks: 'inv.pernyataan.tol', press: TEKAN_TOL, pressLain: [TEKAN_TOL_RAMBU] },
  ],
  // Urut terkumpul (buku catatan); urutan di layar keberatan = keberatan.urutan.
  bukti: [
    // T-127: judul kartu NETRAL (nama sumbernya); gambar slip dashcam dan SIM = seni babak 2 tanpa nomor lajur / tanpa centang.
    { id: 'dashcam', judul: 'inv.bukti.dashcam.judul', sumber: 'inv.bukti.dashcam.sumber', ikon: 'rekaman', seni: 'k1-bingkai-1432' },
    { id: 'rambu', judul: 'inv.bukti.rambu.judul', sumber: 'inv.bukti.rambu.sumber', ikon: 'foto' },
    { id: 'sim', judul: 'inv.bukti.sim.judul', sumber: 'inv.bukti.sim.sumber', ikon: 'kartu', seni: 'k1-catatan-sim' },
  ],
  // T-127 TAFSIR (formatif). 'lajur': batas lajur di gambar 288 px = kontrak seni T-128 (ui/seniR2.ts LAJUR_K1_BINGKAI; disalin
  // sebagai angka karena berkas episode tidak boleh mengimpor gambar). Mapan sesudah petugas mengoreksi laporannya.
  // 'sim': catatan SIM vs catatan kendaraan; SIM Pak Darto tetap sah (pilihan keliru hanya salah baca), mapan begitu dibaca.
  tafsir: [
    {
      id: 'lajur', bukti: 'dashcam', tampilan: 'bingkai', seni: 'k1-bingkai-1432', seniKet: 'inv.tafsir.lajur.gambar', lajur: [[24, 90], [90, 156], [156, 222], [222, 288]],
      tanya: 'inv.tafsir.lajur.tanya', tepat: '2', hampir: ['kabur'],
      opsi: [{ id: '2', teks: 'inv.tafsir.lajur.pilih.2' }, { id: '3', teks: 'inv.tafsir.lajur.pilih.3' }, { id: 'kabur', teks: 'inv.tafsir.lajur.pilih.kabur' }],
      temuan: 'inv.tafsir.lajur.temuan', ringkas: 'inv.tafsir.lajur.ringkas', mapanSaat: tandaKoreksi('tol'),
    },
    {
      id: 'sim', bukti: 'sim', tampilan: 'bingkai', seni: 'k1-catatan-sim', seniKet: 'inv.tafsir.sim.gambar',
      tanya: 'inv.tafsir.sim.tanya', tepat: 'cocok', hampir: ['tanggal'],
      opsi: [{ id: 'beda', teks: 'inv.tafsir.sim.pilih.beda' }, { id: 'cocok', teks: 'inv.tafsir.sim.pilih.cocok' }, { id: 'tanggal', teks: 'inv.tafsir.sim.pilih.tanggal' }],
      temuan: 'inv.tafsir.sim.temuan', ringkas: 'inv.tafsir.sim.ringkas',
    },
  ],
  tebak: { pilihan: LAJUR.map((n) => ({ id: String(n), teks: `inv.tebak.pilih.${n}` })), balikPada: 'dashcam' },
  // Urutan kartu di layar KEBERATAN: kartu yang tepat tidak di urutan pertama.
  // T-127: `pasangan` = di percobaan pertama pemain memilih DUA catatan (keterangan + bukti); kartu bukti tetap pilihan bernilai.
  keberatan: {
    pernyataan: 'tol', tepat: 'dashcam', urutan: ['rambu', 'dashcam', 'sim'], tanya: 'inv.keb.tanya', perbesar: ['dashcam'], reaksi: 'tol-kaget',
    pasangan: { tanya: 'inv.pasang.tanya', ket: 'inv.pasang.ket', temuan: 'inv.pasang.temuan' },
  },
  putusan: { layak: 30, tambahan: 15, polis: 0 },
  // T-090: kartu "Kasus 2" di layar hasil = tautan ke kasus 2 (bila episodenya ada di build ini).
  berikut: 'auto-2-inv-2',
  // T-099: kasus ini = kejadian Episode 1 (cerita klaim Pak Hendra); layar hasil menautkannya, hub menyebut asalnya.
  cerita: { episode: 'auto-2', ajakan: 'inv.cerita.ikuti', asal: 'inv.cerita.asal' },
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
    id, bab: '', jenis: 'pilihan', tata: RUANG('tol', 'darto'), baris: [b(pengantar, 'narasi')], tanya: KEB.tanya,
    investigasi: { jenis: 'keberatan', pernyataan: KEB.pernyataan, tepat: TEPAT, percobaan: n },
    pilihan: KEB.urutan.map((x) => ({
      id: x,
      teks: `inv.keb.pilih.${x}`,
      jika: tanda(tandaBukti(x)),
      efek: { pasang: [x === TEPAT ? tandaKeberatan(n === 0 ? 'tepat' : 'tepat-kedua') : `keb:keliru:${n}:${x}`] },
      lanjut: x === TEPAT ? 'keb-cap' : `${id}-${x}`,
    })),
  };
  const salah = KEB.urutan.filter((x) => x !== TEPAT).map((x) =>
    dialog(`${id}-${x}`, RUANG_TELEPON('tol', 'darto'), [b(kunciSalah(x), 'missRaksa', n === 0 ? 'netral' : 'serius')], lanjutSalah));
  return [pilihan, ...salah];
}

function bangunNode(): NodeCerita[] {
  return [
    // ---------------------------------------------------------------- b1: kartu judul, pembuka, dua keterangan
    dialog('judul', KANTOR, [b('inv.judul.kartu', 'narasi')], 'buka', { investigasi: { jenis: 'judul' } }),
    // T-087 (review pilot butir 1: tamu ikut menyelidik dalam 30 detik): pembuka SATU baris, lalu tamu mengetuk lajur yang
    // diperdebatkan di bingkai pembuka. Tanpa benar / salah: keempat pilihan hanya memasang tanda tebakannya.
    dialog('buka', KANTOR, [b('inv.buka.1', 'missRaksa', 'serius')], 'tebak'),
    {
      id: 'tebak', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv.tebak.1', 'narasi')], tanya: 'inv.tebak.tanya',
      investigasi: { jenis: 'tebak' },
      pilihan: KASUS.tebak.pilihan.map((p) => ({ id: p.id, teks: p.teks, efek: { pasang: [tandaTebak(p.id)] }, lanjut: 'darto' })),
    },
    dialog('darto', RUANG('darto'), [b('inv.darto.1', 'narasi'), b('inv.darto.2', 'darto', 'cemas'), b('inv.darto.3', 'darto', 'serius')], 'tol',
      { efek: { pasang: [tandaCatat('darto')] }, investigasi: { jenis: 'catat', pernyataan: 'darto' } }),
    dialog('tol', RUANG('tol'), [b('inv.tol.1', 'narasi'), b('inv.tol.2', 'tol', 'netral'), b('inv.tol.3', 'tol', 'serius')], 'tol-tanya',
      { efek: { pasang: [tandaCatat('tol')] }, investigasi: { jenis: 'catat', pernyataan: 'tol' } }),
    // T-104 "Tanya lebih lanjut" (opsional, tanpa poin, NodeDasar.tekan): simpangan SESUDAH keterangan petugas tol dicatat. Node
    // 'tol' (id, efek catat:tol, titik lanjut simpanan lama) tidak berubah; kedua cabang maju ke 'selisih', tanpa putaran.
    {
      id: 'tol-tanya', bab: '', jenis: 'pilihan', tata: RUANG('tol'), baris: [b('inv.ui.tekan.1', 'narasi')], tanya: 'inv.ui.tekan.pilih',
      tekan: { pernyataan: 'tol', press: TEKAN_TOL.id, langkah: 'tawar' },
      // T-127: dua pertanyaan, pilih satu (atau lanjut). Id 'tekan' dan 'lanjut' = id lama; pertanyaan kedua = 'tekan-rambu'.
      pilihan: [
        { id: PILIH_TEKAN, teks: TEKAN_TOL.questionKey, lanjut: 'tol-tekan' },
        { id: PILIH_TEKAN_RAMBU, teks: TEKAN_TOL_RAMBU.questionKey, lanjut: 'tol-tekan-rambu' },
        { id: PILIH_LANJUT, teks: 'inv.ui.tekan.lanjut', lanjut: 'selisih' },
      ],
    },
    {
      ...dialog('tol-tekan', RUANG('tol'), [b(TEKAN_TOL.answerKey, 'tol', 'netral')], 'selisih', { efek: { pasang: [tandaTekan('tol', TEKAN_TOL.id)] } }),
      tekan: { pernyataan: 'tol', press: TEKAN_TOL.id, langkah: 'jawab' },
    },
    {
      ...dialog('tol-tekan-rambu', RUANG('tol'), [b(TEKAN_TOL_RAMBU.answerKey, 'tol', 'netral')], 'selisih', { efek: { pasang: [tandaTekan('tol', TEKAN_TOL_RAMBU.id)] } }),
      tekan: { pernyataan: 'tol', press: TEKAN_TOL_RAMBU.id, langkah: 'jawab' },
    },
    dialog('selisih', RUANG_TELEPON('tol'), [b('inv.selisih.1', 'missRaksa', 'serius')], 'kdash'),

    // ---------------------------------------------------------------- b2: tiga kartu bukti (dashcam, rambu dari bingkai rekaman, SIM)
    {
      id: 'kdash', bab: '', jenis: 'aktivitas', aktivitas: 'dashcam', langsung: true, tata: RUANG('darto'),
      baris: [b('inv.kdash.1', 'narasi'), b('inv.kdash.2', 'darto', 'netral')],
      hasil: [{ lanjut: 'baca-rekaman' }],
    },
    // T-127 TAFSIR 'lajur' (formatif): sesudah menonton, pemain MEMBACA bingkai 14:32 sendiri (kepala truk di lajur berapa?) sebelum
    // kartunya masuk buku. Node baru yang disisipkan; simpanan lama di 'kdash' lewat sini, yang sudah di 'bukti-rekaman' tidak.
    dialog('baca-rekaman', RUANG('darto'), [b('inv.baca.1', 'narasi')], 'bukti-rekaman',
      { efek: { pasang: [tandaTafsir('lajur')] }, investigasi: { jenis: 'tafsir', tafsir: 'lajur' } }),
    // T-087: kartu dashcam dan kartu rambu (dari bingkai rekaman yang sama) dijepit dalam SATU langkah buku catatan.
    dialog('bukti-rekaman', RUANG('darto'), [b('inv.bukti.rekaman.1', 'narasi')], 'ksim',
      { efek: { pasang: [tandaBukti('dashcam'), tandaBukti('rambu')] }, investigasi: { jenis: 'bukti', bukti: 'dashcam', juga: ['rambu'] } }),
    // T-080 (Designer): periksa SIM DI MEJA wawancara (3 ketukan: golongan vs STNK, hologram, pindai QR), bukan arena SIM Satpas
    // Episode 1. Node dialog biasa + tampilan 'periksa-sim'; kartu bukti SIM tetap diberikan node 'bukti-sim' seperti semula.
    // T-127: layarnya kini SATU pilihan formatif (tafsir 'sim', lihat KASUS.tafsir); id node, jenis dan lanjutannya tidak berubah.
    dialog('ksim', RUANG('darto'), [b('inv.sim.1', 'narasi'), b('inv.sim.2', 'darto', 'netral')], 'bukti-sim',
      { efek: { pasang: [tandaTafsir('sim')] }, investigasi: { jenis: 'periksa-sim' } }),
    dialog('bukti-sim', RUANG('darto'), [b('inv.bukti.sim.1', 'narasi')], 'keb-buka',
      { efek: { pasang: [tandaBukti('sim')] }, investigasi: { jenis: 'bukti', bukti: 'sim' } }),

    // ---------------------------------------------------------------- b3: KEBERATAN (pernyataan petugas tol vs satu kartu bukti)
    // T-127: kalimat Miss Raksa "pernyataan itu bisa dibantah dengan salah satu buktimu" (inv.keb-buka.3) dilepas dari graf: ia
    // menunjuk jawabannya. Pemain kini memasangkan sendiri dua catatan di layar berikutnya. Kunci teksnya tetap ada (riwayat lama).
    dialog('keb-buka', RUANG('tol', 'darto'), [
      b('inv.keb-buka.1', 'narasi'),
      b('inv.keb-buka.2', 'tol', 'serius'),
    ], 'keb0'),
    ...keberatan(0, 'inv.keb.1', 'keb1', (x) => `inv.keb.salah.${x}`),
    // T-139 (pemilik: salah = peringatan sampai benar): kalimat sesudah kartu keliru KEDUA tidak lagi "mari kita lihat bersama"
    // (inv.keb.pandu.*) melainkan penunjuk + coba lagi (inv.keb.lagi.*); baris node keb2 tidak lagi menyebut kartunya (inv.keb.3
    // -> inv.keb.4). Kunci lama tetap ada di berkas teks (riwayat simpanan lama menyimpan kunci).
    ...keberatan(1, 'inv.keb.2', 'keb2', (x) => `inv.keb.lagi.${x}`),
    // Percobaan ketiga dst. (node dialog; id, efek keb:dipandu dan nilainya tidak berubah): pemain memilih sendiri; hanya kartu
    // tepat yang melanjutkan (ketukan kartu itu = lanjut). Kartu yang sudah dicoba mati di layar (LayarInvestigasi KeberatanKasus).
    dialog('keb2', RUANG('tol', 'darto'), [b('inv.keb.4', 'narasi')], 'keb-cap',
      { efek: { pasang: [tandaKeberatan('dipandu')] }, investigasi: { jenis: 'keberatan', pernyataan: KEB.pernyataan, tepat: TEPAT, percobaan: 2 } }),
    dialog('keb-cap', RUANG('tol', 'darto'), [b('inv.keb.cap', 'narasi')], 'keb-akui', { investigasi: { jenis: 'cap' } }),
    // T-127 (butir 18): petugas tidak langsung mengaku. Ia lebih dulu berkeberatan dengan sopan (ia memang melihat kendaraan di
    // lajur 3), lalu membedakan mobil kecil itu dari kepala truk, baru mengoreksi laporannya. Tanpa putaran tanya-jawab baru.
    // Baris 'inv.akui.pos' hanya untuk pemain yang tadi menanyakan tempat ia berdiri (tanda jeli).
    dialog('keb-akui', RUANG('tol', 'darto'), [
      b('inv.akui.1', 'tol', 'serius'),
      { ...b('inv.akui.pos', 'narasi'), jika: tanda(tandaTekan('tol', TEKAN_TOL.id)) },
      b('inv.akui.2', 'tol', 'bingung'),
      b('inv.akui.4', 'tol', 'netral'),
      b('inv.akui.3', 'darto', 'lega'),
    ], 'keb-koreksi'),
    // T-087 / T-088: petugas mencoret "3" dan menulis "2"; sejak itu buku catatan menulis "Laporan dikoreksi: lajur 2".
    dialog('keb-koreksi', RUANG('tol', 'darto'), [b('inv.koreksi.1', 'narasi')], 'putusan-buka',
      { efek: { pasang: [tandaKoreksi(KEB.pernyataan)] }, investigasi: { jenis: 'koreksi', pernyataan: KEB.pernyataan } }),

    // ---------------------------------------------------------------- b4: putusan, pesan untuk Pak Hendra, hasil
    dialog('putusan-buka', KANTOR, [b('inv.putusan.1', 'missRaksa', 'tersenyum'), b('inv.putusan.2', 'missRaksa', 'serius')], 'putusan'),
    {
      id: 'putusan', bab: '', jenis: 'pilihan', tata: KANTOR, baris: [b('inv.putusan.3', 'narasi')], tanya: 'inv.putusan.tanya',
      investigasi: { jenis: 'putusan' },
      pilihan: (['layak', 'tambahan', 'polis'] as const).map((x) => ({ id: x, teks: `inv.putusan.${x}`, efek: { pasang: [tandaPutusan(x)] }, lanjut: `putusan-${x}` })),
    },
    dialog('putusan-layak', KANTOR, [b('inv.putusan.layak.1', 'missRaksa', 'tersenyum')], 'pesan'),
    dialog('putusan-tambahan', KANTOR, [b('inv.putusan.tambahan.1', 'missRaksa', 'serius')], 'pesan'),
    dialog('putusan-polis', KANTOR, [b('inv.putusan.polis.1', 'missRaksa', 'serius')], 'pesan'),
    {
      id: 'pesan', bab: '', jenis: 'pilihan', tata: TELEPON_HENDRA, baris: [b('inv.pesan.1', 'narasi'), b('inv.pesan.2', 'hendra', 'cemas')], tanya: 'inv.pesan.tanya',
      pilihan: [
        { id: 'janji', teks: 'inv.pesan.janji', efek: { kepercayaan: 10, alasan: 'inv.pesan.janji.alasan', pasang: [tandaPesan('janji')] }, lanjut: 'pesan-janji' },
        { id: 'baik', teks: 'inv.pesan.baik', efek: { kepercayaan: 30, alasan: 'inv.pesan.baik.alasan', pasang: [tandaPesan('baik')] }, lanjut: 'pesan-baik' },
        { id: 'datar', teks: 'inv.pesan.datar', efek: { pasang: [tandaPesan('datar')] }, lanjut: 'pesan-datar' },
      ],
    },
    dialog('pesan-baik', TELEPON_HENDRA, [b('inv.pesan.baik.1', 'hendra', 'lega')], 'akhir-cek'),
    dialog('pesan-datar', TELEPON_HENDRA, [b('inv.pesan.datar.1', 'hendra', 'bingung'), b('inv.pesan.datar.2', 'narasi')], 'akhir-cek'),
    dialog('pesan-janji', TELEPON_HENDRA, [b('inv.pesan.janji.1', 'hendra', 'senang'), b('inv.pesan.janji.2', 'narasi')], 'akhir-cek'),
    { id: 'akhir-cek', bab: '', jenis: 'cabang', cabang: [{ jika: tanda(tandaPutusan('layak')), lanjut: 'akhir-tuntas' }], lainnya: 'akhir-tinjau' },
    ...(['tuntas', 'tinjau'] as const).map((akhir): NodeCerita => ({
      id: `akhir-${akhir}`, bab: '', jenis: 'akhir', akhir, tata: KANTOR,
      baris: [b(`inv.akhir.${akhir}.1`, 'missRaksa', akhir === 'tuntas' ? 'tersenyum' : 'netral')],
      investigasi: { jenis: 'hasil-investigasi' },
    })),
  ];
}

/** Bagian tiap node (kepala layar "BAGIAN n/4"; id b2 / b3 = musik pemeriksaan, hp/audioTema.ts). */
function babInv(id: IdNode): string {
  if (['judul', 'buka', 'tebak', 'darto', 'tol', 'tol-tanya', 'tol-tekan', 'tol-tekan-rambu', 'selisih'].includes(id)) return 'b1';
  if (id.startsWith('kdash') || id.startsWith('ksim') || id.startsWith('bukti-') || id.startsWith('baca-')) return 'b2';
  if (id.startsWith('keb')) return 'b3';
  return 'b4';
}

/**
 * T-085 musik per FASE investigasi (trek asli 8-bit detektif, tools/make-music-inv.mjs; hanya episode ini):
 *  Investigasi  kartu judul, pengarahan Miss Raksa, dan pengumpulan bukti (b2): tema utama yang mengendap-endap;
 *  Keterangan   dua wawancara + "ada yang tidak cocok": jarang, detak jam (kilas balik = sapuan filter, hp/AudioCerita.tsx);
 *  Keberatan    seluruh b3 (konfrontasi sampai petugas memperbaiki catatannya); di cap KEBERATAN musik hening 0,4 detik;
 *  Terungkap    b4 (putusan, pesan, hasil): jingle resolusi mayor sekali, lalu loop tenang sampai kartu hasil.
 */
function musikInv(id: IdNode): MusikNode {
  if (['darto', 'tol', 'tol-tanya', 'tol-tekan', 'tol-tekan-rambu', 'selisih'].includes(id)) return 'inv-keterangan';
  const bab = babInv(id);
  if (bab === 'b3') return 'inv-keberatan';
  if (bab === 'b4') return 'inv-terungkap';
  return 'inv-investigasi';
}

/** T-127: salinan aktivitas dashcam dengan arena ber-`tanpaNomor` (aktivitas asalnya tidak diubah). */
function dashcamTanpaNomor(a: DefAktivitas): DefAktivitas {
  return a.arena?.pola === 'dashcam' ? { ...a, arena: { ...a.arena, tanpaNomor: true } } : a;
}

function bangun(asal: Episode, dev: Episode): Episode {
  return {
    id: 'auto-2-inv',
    versi: 1,
    produk: 'AUTO',
    jenis: 'nyata',
    judul: 'judul',
    ringkas: 'ringkas',
    durasiMenit: 5,
    mulai: 'judul',
    pemeran: { missRaksa: asal.pemeran.missRaksa!, hendra: asal.pemeran.hendra!, bima: asal.pemeran.bima!, darto: asal.pemeran.darto!, tol: asal.pemeran.tol! },
    nasabah: 'hendra',
    bab: ([1, 2, 3, 4] as const).map((n) => ({ id: `b${n}`, judul: `inv.bab.${n}.judul`, tujuan: `inv.bab.${n}.tujuan` })),
    akhir: {
      tuntas: { judul: 'inv.akhir.tuntas.judul', ringkas: 'inv.akhir.tuntas.ringkas', nada: 'baik', pelajaran: ['inv.pelajaran.1'] },
      tinjau: { judul: 'inv.akhir.tinjau.judul', ringkas: 'inv.akhir.tinjau.ringkas', nada: 'campuran', pelajaran: ['inv.pelajaran.1'] },
    },
    paham: {},
    proses: {},
    catatan: {},
    kepercayaanAwal: 30,
    kepercayaanBatas: { min: 0, maks: 100 },
    labelSuasana: 'status',
    antarmuka: 'hp',
    seniArena: asal.seniArena,
    lampiran: asal.lampiran,
    suasana: asal.suasana,
    node: Object.fromEntries(bangunNode().map((n) => [n.id, { ...n, bab: babInv(n.id), musik: musikInv(n.id) }])),
    // Aktivitas dipakai ulang: rekaman dashcam (auto-2-dev, T-065..T-073). T-127: di kasus ini rekamannya diputar TANPA nomor lajur
    // (`tanpaNomor`), karena lajurnya ditafsirkan pemain sesudahnya; Episode 1 Dev tetap bernomor.
    aktivitas: { dashcam: dashcamTanpaNomor(dev.aktivitas.dashcam!) },
    teks: TEKS_AUTO_2_INV,
    bahasa: ['id', 'en', 'zh'],
    latar: asal.latar,
    tampilan: { teksBesar: true },
    investigasi: KASUS,
  };
}

/**
 * Episode 1 Investigator. Build tanpa auto-2 (VITE_CERITA_TANPA=auto-2): vite.config ikut mengganti modul ini dengan rintisan
 * null, jadi isi kasusnya tidak terbawa lewat episode ini.
 */
export const EPISODE_AUTO_2_INV: Episode = bangun(EPISODE_AUTO_2, EPISODE_AUTO_2_DEV);
