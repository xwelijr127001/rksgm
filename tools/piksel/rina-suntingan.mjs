/**
 * Bu Rina — SUNTINGAN TANGAN yang tercatat (semua koordinat = piksel seni).
 * Setiap operasi dicatat jumlah piksel yang berubah di character/piksel/bu-rina/native/log-suntingan.json.
 *
 * Jenis operasi:
 *  { op: 'hapusBaris', frame, y, n }            hapus n baris mulai y, isi di bawahnya naik n (memendekkan tulang kering)
 *  { op: 'px', frame, warna: '#rrggbb'|null, titik: [[x,y],...] }  cat piksel (null = transparan)
 *  { op: 'kotak', frame, warna, kotak: [x,y,w,h] }                    cat kotak
 *  { op: 'ganti', frame, kotak: [x,y,w,h], dari: ['#..'], ke: '#..' } ganti warna tertentu di kotak
 *  { op: 'salinKeluarga', dari, ke: [...], yMulai }  (koordinat kanvas keluarga) salin baris >= yMulai dari frame `dari`
 */

/** Tahap A: di koordinat native masing-masing (sesudah palet). */
export const SUNTING_NATIVE = [
  // Tulang kering duduk-condong (lembar pose) 5 px lebih panjang dari keluarga gestur duduk bila pangkuan disejajarkan;
  // hapus 5 baris di zona betis lurus (di bawah kunci yang menggantung, di atas sepatu) supaya kaki menapak lantai yang sama.
  { op: 'hapusBaris', frame: 'duduk-condong', y: 132, n: 5, alasan: 'samakan panjang betis dengan keluarga gestur duduk' },
  // Reviu 27 Sep: kantong latar putih JPG (sumber gestur-duduk ± x1140,y160; < 30 px sehingga tidak dibuang rina-latar)
  // tersisa di celah jari telunjuk-rahang = bintik putih/"mata" kecil di dagu pada semua ekspresi `bingung`. Diisi
  // bayangan kulit (bukan alpha 0: celah itu tertutup garis jari & rahang). rina-tinjau kini memeriksa kantong putih.
  { op: 'px', frame: 'dagu', warna: '#a05422', titik: [[36, 43], [36, 44], [37, 44]], alasan: 'kantong latar putih di celah jari-dagu -> bayangan kulit' },
];

/** Tahap B: di koordinat kanvas keluarga duduk (sesudah registrasi). */
export const SUNTING_KELUARGA = [
  // Kaki, sepatu & ujung bawah gaun identik untuk semua badan gestur duduk: ganti gestur tidak membuat kaki meloncat.
  { op: 'salinKeluarga', dari: 'duduk', ke: ['lipat-tangan', 'genggam', 'dagu', 'dada', 'telepon'], yMulai: 131, alasan: 'bagian bawah (betis, sepatu) seragam antar gestur' },
];

/**
 * Bingkai jalan kedua `jalan-b` = bingkai LINTAS (rina-jalan.bangunJalanB). Koordinat: `yPotong` di kanvas native
 * `jalan-a`; `kakiDari`, `kakiJauh`, `lututJauh` di kanvas native `berdiri`.
 *  - yPotong 146: baris pertama di bawah garis keliman `jalan-a` (keliman belakang y145, selangkangan x43-44 mulai y146).
 *  - kakiDari 150: baris pertama celana `berdiri` di bawah garis kelimannya (y149).
 *  - geser dx -5: selangkangan berdiri x48,5 -> x43,5 (jalan-a); dy -4: telapak dekat berdiri y191 -> y187 = telapak
 *    jalan-a (y186) + bob 1.
 *  - kakiJauh = kaki kiri gambar (x <= 47; sepatu kanan mulai x47 di y >= 187), lutut y166; di bawah lutut diangkat 4 px
 *    dan digeser miring ke kanan (0 di lutut -> +7 di telapak): telapak jauh terangkat & terselip di belakang kaki dekat
 *    (posisi lintas), bukan dua telapak rapat berdampingan. Varian 2/1, 3/3, 4/5 dicoba; 4/7 paling terbaca di 1x & 3x.
 */
export const JALAN_B = {
  yPotong: 146, kakiDari: 150, geser: { dx: -5, dy: -4 }, bob: 1,
  kakiJauh: [[0, 150, 48, 37], [0, 187, 47, 5]], lututJauh: 166, angkat: 4, geserX: 7,
};

/** Piksel tubuh yang TIDAK boleh ditimpa wajah (koordinat native frame): jari di dagu, tangan+gagang telepon. */
export const PENGHALANG = {
  dagu: [[20, 41, 20, 22], [40, 47, 2, 10]],
  telepon: [[10, 38, 25, 26]],
};

/** Kunci logam (bilah) terang di tepi siluet: jangan dibersihkan sebagai pijar. Koordinat native. */
export const LINDUNG_TEPI = {
  berdiri: [[0, 60, 16, 50]],
  'jalan-a': [[0, 60, 16, 50]],
  'duduk-condong': [[15, 105, 20, 30]],
  'duduk-turun': [[10, 100, 25, 35]],
};

/**
 * Kotak mata kiri-gambar (mk), mata kanan-gambar (mn), mulut — di koordinat kepala ekspresi yang sudah disejajarkan ke
 * kepala `netral` (66 x 79). Diukur dari kisi 14x per ekspresi (lembar tinjau varian).
 */
export const KOTAK_WAJAH = {
  netral: { mk: [9, 26, 16, 30], mn: [21, 26, 29, 30], mulut: [13, 39, 24, 42] },
  kesal: { mk: [9, 26, 16, 30], mn: [21, 26, 29, 30], mulut: [13, 38, 24, 42] },
  cemas: { mk: [9, 25, 17, 30], mn: [21, 25, 30, 30], mulut: [14, 39, 24, 42] },
  bingung: { mk: [9, 26, 16, 31], mn: [21, 26, 30, 31], mulut: [12, 39, 24, 43], bicara: 'manual' },
  lega: { mk: [9, 26, 16, 30], mn: [21, 26, 29, 30], mulut: [12, 38, 25, 42] },
  senang: { mk: null, mn: null, mulut: [12, 38, 25, 42] },
  serius: { mk: [9, 26, 16, 30], mn: [21, 26, 29, 31], mulut: [13, 39, 24, 42] },
  tersenyum: { mk: [9, 26, 16, 31], mn: [21, 26, 30, 31], mulut: [12, 38, 25, 42] },
};

/**
 * Kotak fitur (koordinat kepala netral 70 x 80). Wajah tiap ekspresi = wajah netral + piksel FITUR kepala ekspresi di
 * dalam kotak ini saja (rina-wajah.susunFitur): alis+mata (termasuk kerut di antara alis) dan mulut+sudut/lipatan.
 * Hidung (y 33-36), garis dagu (y >= 44), pipi, dahi dan tepi wajah selalu milik netral -> kulit tidak berubah saat ekspresi ganti.
 * Ambang: kulit dengan L OKLab < 0,66 (#cc6e27 dan lebih gelap) dihitung fitur (lipatan senyum/cemberut).
 */
export const KOTAK_FITUR = { mataAlis: [9, 19, 40, 14], mulut: [12, 37, 23, 7] };
export const AMBANG_FITUR = 0.66;

/**
 * Suntingan ekspresi (koordinat kepala netral 70 x 80) supaya ekspresi mirip tetap terbedakan di 44-64 px.
 * frame '*' = semua ekspresi. 'kelopak' = kelopak atas kedua mata turun n px (rina-wajah.mataBawah, kotak KOTAK_WAJAH).
 */
export const SUNTING_EKSPRESI = [
  // (Bercak oranye apron / krem / biru di kulit wajah ditangani otomatis oleh rina-wajah.bersihWajah + paletWajah.)
  // Reviu 27 Sep: netral terbaca murung (sudut mulut turun), serius ~ netral di 44-64 px, lega terbaca mengantuk.
  // Pembeda sekarang ALIS + MULUT, bukan kelopak: serius TANPA kelopak turun.
  // NETRAL: garis mulut datar (sudut kanan naik dari y41 ke y40), bibir bawah merah dilunakkan -> tidak cemberut.
  { op: 'px', frame: 'netral', warna: '#962e19', titik: [[24, 40]], alasan: 'netral: sudut mulut kanan sejajar garis (datar)' },
  { op: 'px', frame: 'netral', warna: '#f19b4b', titik: [[24, 41]], alasan: 'netral: sudut mulut turun dihapus' },
  { op: 'px', frame: 'netral', warna: '#b86225', titik: [[19, 42], [20, 42]], alasan: 'netral: bibir bawah merah -> bayangan lembut (tidak manyun)' },
  // SERIUS: alis lurus menurun ke dalam (luar y23 -> dalam y25, sisi dalam 2 kolom/3 kolom turun 1 px), mulut garis
  // gelap pendek (7 px) tanpa bibir bawah & tanpa sudut turun (bibir terkatup).
  { op: 'px', frame: 'serius', warna: '#f5a755', titik: [[15, 23], [22, 23], [23, 23]], alasan: 'serius: ujung dalam alis turun (atas dikosongkan)' },
  { op: 'px', frame: 'serius', warna: '#290e05', titik: [[15, 24]], alasan: 'serius: alis kiri menurun ke dalam' },
  { op: 'px', frame: 'serius', warna: '#3d1406', titik: [[15, 25], [16, 25], [21, 25], [22, 25], [23, 25]], alasan: 'serius: ujung dalam alis turun 1 px' },
  { op: 'px', frame: 'serius', warna: '#712b14', titik: [[16, 40], [17, 40], [18, 40], [19, 40], [20, 40], [21, 40], [22, 40]], alasan: 'serius: garis mulut tegas' },
  { op: 'px', frame: 'serius', warna: '#f19b4b', titik: [[17, 41], [18, 41], [19, 41], [20, 41], [21, 41], [22, 41], [23, 41], [24, 41]], alasan: 'serius: bibir terkatup, sudut tidak turun' },
  { op: 'px', frame: 'serius', warna: '#e99042', titik: [[18, 42], [19, 42], [20, 42]], alasan: 'serius: bayangan bibir bawah dilunakkan' },
  // LEGA vs TERSENYUM: kelopak turun 1 px saja (teduh, bukan mengantuk) + ujung DALAM alis naik 1 px (lega, "fiuh");
  // senyum lembut sumber tetap. Tersenyum: mata terbuka, alis biasa.
  { op: 'kelopak', frame: 'lega', turun: 1, alasan: 'lega: mata teduh (maks 1 px)' },
  { op: 'px', frame: 'lega', warna: '#3d1406', titik: [[15, 21], [16, 21], [16, 22], [22, 21], [23, 21], [21, 22]], alasan: 'lega: ujung dalam alis naik 1 px' },
  { op: 'px', frame: 'lega', warna: '#f5a755', titik: [[15, 23], [16, 23], [21, 23], [22, 23], [23, 23]], alasan: 'lega: bekas ujung dalam alis -> kulit' },
];

/**
 * Suntingan varian (sesudah varian otomatis dibuat), koordinat kepala netral. Mulut 'bingung' sudah terbuka menyeringai
 * (gigi) di sumber; membukanya lagi menghasilkan bentuk kacau, jadi varian bicaranya = mulut MENUTUP (garis bergelombang).
 * Bergantian dasar <-> bicara tetap terbaca sebagai berbicara.
 */
export const SUNTING_VARIAN = [
  // Ronde 3: `senang` bermata tertutup-senyum (lengkung ∩, tanpa putih) sehingga lirikBawah tidak berlaku. Varian
  // bawahnya = lengkung yang sama menjadi kelopak atas, dengan iris gelap + putih di celah di bawah lengkung (baris 28,
  // di antara kaki lengkung): mata tersenyum melirik ke bawah, bukan tertutup. Hanya piksel kulit di celah itu berubah.
  { op: 'px', frame: 'senang', varian: 'bawah', warna: '#f7f2ea', titik: [[13, 28], [25, 28], [28, 28]], alasan: 'senang lirik bawah: putih mata di bawah lengkung' },
  { op: 'px', frame: 'senang', varian: 'bawah', warna: '#3d1406', titik: [[14, 28], [26, 28]], alasan: 'senang lirik bawah: iris' },
  { op: 'px', frame: 'senang', varian: 'bawah', warna: '#290e05', titik: [[15, 28], [27, 28]], alasan: 'senang lirik bawah: pupil' },
  { op: 'px', frame: 'bingung', varian: 'bicara', warna: '#852a15', titik: [[20, 41], [21, 41], [22, 41], [23, 41]], alasan: 'bingung bicara: celah gigi ditutup garis bibir' },
  { op: 'px', frame: 'bingung', varian: 'bicara', warna: '#f19b4b', titik: [[18, 42], [19, 42], [20, 42], [21, 42], [22, 42], [23, 42]], alasan: 'bingung bicara: bibir bawah ke kulit' },
];
