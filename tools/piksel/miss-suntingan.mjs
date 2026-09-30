/**
 * Miss Raksa — DATA suntingan tangan (semua koordinat = piksel seni). Setiap operasi dicatat (jumlah piksel berubah)
 * di character/piksel/miss-raksa/native/log-suntingan.json oleh bangun-miss.mjs.
 */

/**
 * PALET TETAP (39 warna + transparan). Asal: lib.kuantisasi (median cut + k-means OKLab, bobot n^0,5) atas semua bahan
 * native (master + 6 sel gestur + 6 sel ekspresi), 40 warna dengan kunci: garis #0f0b11 (bersama Bu Rina), putih mata
 * #f7f2ea (sama dengan Bu Rina), merah bibir #cc4038, dan 3 warna gagang telepon ruang (ruang-prop-gagang.png:
 * #313b2c, #656662, #23281d). Kurasi: #060305 (hampir sama dengan garis) dilebur ke #0f0b11. Ditulis tetap di sini
 * supaya build deterministik dan huruf suntingan tidak bergeser.
 */
export const PALET = [
  '#0f0b11', '#1d1015', '#28191e', '#362223', '#452b29', '#5c352a', '#6e453a', '#8c7877', // garis, rambut, iris, abu
  '#340d03', '#461605', '#581f08', '#7b3914', '#8f4c26', '#ad5c2e', // garis cokelat jas/kulit
  '#cb6942', '#da7d51', '#e78c5d', '#f29a69', '#f9a474', '#fcaf7d', '#fdbb88', // kulit
  '#cc4038', // bibir
  '#b87228', '#ca812d', '#d98f35', '#e49b3d', '#eda544', '#f3ae4b', '#f8b754', '#fbc05d', '#fdc765', '#fdd172', // jas emas
  '#afa7aa', '#cdc8ce', '#e1dee2', '#f7f2ea', // kerah/manset putih
  '#23281d', '#313b2c', '#656662', // gagang telepon
];

/**
 * PALET_MUKA (v5): subset PALET untuk sampel rata-rata area wajah (miss-native.sampelRata): garis/rambut/iris, cokelat
 * garis kulit, kulit, bibir, putih mata. Tanpa emas jas, abu & warna gagang: rata-rata alis (rambut + kulit) di palet
 * penuh jatuh ke emas/abu (alis belang).
 */
export const PALET_MUKA = [
  '#0f0b11', '#1d1015', '#28191e', '#362223', '#452b29', '#5c352a', '#6e453a',
  '#340d03', '#461605', '#581f08', '#7b3914', '#8f4c26', '#ad5c2e',
  '#cb6942', '#da7d51', '#e78c5d', '#f29a69', '#f9a474', '#fcaf7d', '#fdbb88',
  '#cc4038', '#cdc8ce', '#e1dee2', '#f7f2ea',
];

/**
 * Huruf palet untuk pola ASCII suntingan. '.' = biarkan, '_' = transparan.
 */
export const HURUF = {
  o: '#0f0b11', h: '#1d1015', H: '#28191e', i: '#362223', I: '#452b29', j: '#5c352a', J: '#6e453a', Q: '#8c7877',
  x: '#340d03', R: '#461605', r: '#581f08', V: '#7b3914', v: '#8f4c26', U: '#ad5c2e',
  u: '#cb6942', T: '#da7d51', t: '#e78c5d', S: '#f29a69', s: '#f9a474', k: '#fcaf7d', K: '#fdbb88',
  m: '#cc4038',
  n: '#b87228', L: '#ca812d', l: '#d98f35', F: '#e49b3d', f: '#eda544', e: '#f3ae4b', d: '#f8b754', c: '#fbc05d', b: '#fdc765', a: '#fdd172',
  q: '#afa7aa', G: '#cdc8ce', g: '#e1dee2', w: '#f7f2ea',
  z: '#23281d', p: '#313b2c', P: '#656662',
  _: null,
};

/* ================================================================== WAJAH (koordinat sel ekspresi `e-netral`) */

// v5: fitur MASTER dipertahankan. Kepala dasar = sel e-netral apa adanya (alis, mulut, rona & bayangan pipi master);
// v4 menghapus fitur sumber (kulit bersih) lalu menempel sprite ASCII generik -> mata datar & sayu. Di sini hanya:
//  (1) suntingan tangan mata yang dibaca ulang dari lembar master pada kisi 6,5 px sumber/px seni (sampling moda
//      menebalkan bulu mata jadi 2 baris dan menelan baris atas iris -> "kelopak berat"): bulu mata 1 baris + ujung
//      sayap, iris 3 baris (atas gelap + kilap, tengah pupil, bawah cokelat) diapit putih mata, tatapan ke ARAH HADAP
//      (kiri gambar pada arah kiri = ke pemain; cermin 'kanan' = ke Bu Rina). Master menatap kamera; bila dicermin,
//      tatapan itu menjauh dari Bu Rina.
//  (2) CANGKOK alis/mulut dari sel ekspresi lain yang didaftarkan ke kepala e-netral (miss-wajah.daftarSel).
//  (3) suntingan tangan kecil (kelopak, alis, mulut bicara), semuanya tercatat di log-suntingan.
// Blok (koordinat sel): mata dekat x36..48 y33..38 · mata jauh x20..34 y35..41 · alis dekat x35..48 y29..33 ·
// mulut x31..43 y46..51.
const MD = (baris, alasan) => ({ x: 36, y: 33, baris, alasan });
const MJ = (baris, alasan) => ({ x: 20, y: 35, baris, alasan });
const AD = (baris, alasan) => ({ x: 35, y: 29, baris, alasan });
const MU = (baris, alasan) => ({ x: 31, y: 46, baris, alasan });

/**
 * Mata terbuka dasar (netral), dibaca dari lembar master pada kisi 6,5 px sumber/px seni (kiri, koordinat sel): bulu
 * mata atas SATU baris melengkung (tengah naik 1 baris: sel 34, sudut dalam & luar sel 35) + ujung sayap (47,33); iris
 * 4 baris membulat (atas gelap + kilap 'w', pupil, bawah cokelat, dasar 2 px) diapit putih mata; tatapan ke ARAH HADAP
 * (iris di sisi kiri gambar pada arah kiri = ke pemain; cermin 'kanan' = ke Bu Rina). v5 ronde 1 (bulu mata sel 35,
 * iris 3 baris) masih 1 baris lebih pendek dari master -> terbaca agak sayu di adegan.
 */
const MATA_BUKA = [
  MD([
    '...........o.', // 33 ujung sayap
    '....ooooooo..', // 34 bulu mata melengkung (tengah naik)
    '...oxRwxGGo..', // 35 sudut dalam, iris atas + kilap, putih luar di bawah kelopak
    '...gRooRwgT..', // 36 pupil
    '...tVrrVgt...', // 37 iris bawah
    '...stVVtss...', // 38 dasar iris membulat
  ], 'mata dekat: bulu mata 1 baris melengkung + sayap, iris 4 baris berkilap (bukaan master), tatapan ke arah hadap'),
  MJ([
    '...............', // 35
    '...............', // 36
    '.......oooo....', // 37 bulu mata atas melengkung
    '......xwxGGo...', // 38 iris atas + kilap, putih di sisi hidung
    '.....orooggo...', // 39 sudut luar + pupil
    '......tVVgt....', // 40 iris bawah
    '.......ttst....', // 41 kelopak bawah
  ], 'mata jauh: bulu mata melengkung naik 1 baris, iris di sudut luar (tatapan ke arah hadap), kilap, putih di sisi hidung'),
];

/** Mata lirik bawah (varian bawah): kelopak turun (lipatan sel kembali), bulu mata turun 2 baris, iris 2 baris tetap terlihat. */
const MATA_BAWAH = [
  MD([
    '...........S.', // 33 sayap dasar dihapus
    '....ttSUtvsS.', // 34 lipatan kelopak (piksel sel e-netral)
    '...SkkkkkkkoS', // 35 kelopak turun + sayap
    '...ooooooooo.', // 36 bulu mata
    '...gxRRxwgT..', // 37 iris atas (bayang kelopak)
    '...tVrrVgt...', // 38
  ], 'lirik bawah: bulu mata turun, iris 2 baris + putih tetap terlihat'),
  MJ([
    '...............', // 35
    '...............', // 36
    '.......kkkk....', // 37 bulu mata dasar -> kelopak
    '......kkkkkk...', // 38 kelopak
    '....oooooooo...', // 39 bulu mata
    '......xRxggo...', // 40 iris atas
    '.......VVgt....', // 41
  ], 'lirik bawah mata jauh'),
];

/** Lirik kanan-bawah (duduk-tunjuk-kiri: kepala ke pemain, mata ke kartu di kanan gambar). */
const MATA_LIRIK_KANAN = [
  MD([
    '...........S.', // 33
    '....ttSUtvsS.', // 34
    '...SkkkkkkkoS', // 35
    '...ooooooooo.', // 36
    '...GwgxRRxo..', // 37 iris di sisi kanan gambar
    '...ttgVrrVt..', // 38
  ], 'lirik kanan-bawah (ke kartu)'),
  MJ([
    '...............', // 35
    '...............', // 36
    '.......kkkk....', // 37
    '......kkkkkk...', // 38
    '....oooooooo...', // 39
    '......ggxRxo...', // 40
    '.......gVVt....', // 41
  ], 'lirik kanan-bawah mata jauh'),
];

/** Kedip (mata tertutup, garis kelopak melengkung seperti sel e-kedip master; ujung luar naik). */
const MATA_KEDIP = [
  MD([
    '...........S.', // 33 sayap dasar dihapus
    '....ttSUtvsS.', // 34 lipatan kelopak
    '...SkkkkkkstS', // 35 kelopak
    '...SkkKkkksoS', // 36 ujung luar naik
    '...okkkkkkoos', // 37
    '...Soooooosss', // 38 garis tutup (bawah)
  ], 'kedip: kelopak tertutup, garis bulu mata melengkung (sel e-kedip)'),
  MJ([
    '...............', // 35
    '...............', // 36
    '.......kkkk....', // 37
    '......kkkkkk...', // 38
    '......kkkkks...', // 39
    '.....oookkoo...', // 40 ujung
    '......ooooo....', // 41 garis tutup
  ], 'kedip mata jauh'),
];

/**
 * v5 MATA MASTER (dibaca dari lembar ekspresi pada kisi 6,5 px sumber/px seni; koordinat sel e-netral), di atas wajah
 * dasar sel RATA: bulu mata atas 1 baris + sayap di sudut luar, iris gelap berkilap 1 px, putih mata di sisi dalam
 * bawah (segitiga master), kelopak bawah lembut. Tatapan = tatapan master (ke kamera/pemain) pada arah kiri; arah kanan
 * ditukar isinya (keKanan: WAJAH.tatapKanan) supaya menatap Bu Rina.
 */
const MATA_NETRAL = [
  { x: 38, y: 34, alasan: 'mata dekat master: bulu mata + sayap, iris 4 px berkilap, putih sisi dalam', baris: [
    '..........o',
    '..oooooooo.',
    '.oiGhwhho..',
    '.owwxRRxo..',
    '.SwwrVVrT..',
    '..StTTTS...',
  ] },
  { x: 24, y: 37, alasan: 'mata jauh master: bulu mata, iris 3 px berkilap, putih sisi luar', baris: [
    '..........',
    '...ooooo..',
    '.oigGhwho.',
    '..owwxRxT.',
    '...SgrVrS.',
    '....SttS..',
  ] },
];

/**
 * ALIS (v5) digambar ulang 1 px bersih mengikuti garis tengah alis MASTER per sel ekspresi (dibaca di kisi 6,5 px
 * sumber/px seni sesudah registrasi): rata-rata area membuat alis tipis master jadi cokelat sedang 2 baris (pudar).
 * Blok ditulis lengkap (kulit latar = kulit sel RATA e-netral di sekitarnya) supaya alis lama terhapus.
 * Alis dekat x35..48 y29..33, alis jauh x23..32 y32..36 (koordinat sel e-netral, arah kiri).
 */
const AD5 = (baris, alasan) => ({ x: 35, y: 29, baris, alasan });
const AJ5 = (baris, alasan) => ({ x: 23, y: 32, baris, alasan });
const ALIS = {
  netral: [
    AD5(['KKKKKKKKKKkksS', 'KKKKKKKtTTTtkk', 'KKKsTIIiiiIjts', 'KKTIIjtkKkkKks', 'kSjTSssSssskks'], 'alis dekat netral master: ujung dalam (37,33) melengkung naik ke puncak baris 31, ekor 47'),
    AJ5(['HhtkkkkKKK', 'hjskkkkKKK', 'hvTjIiIjtk', 'hJIITSSsSk', 'hVsssStTTs'], 'alis jauh netral master: x25-26 baris 35, x27-30 baris 34'),
  ],
  prihatin: [
    AD5(['KKKKKKKKKKkksS', 'KKKKKKKKKKkkss', 'KjIIjtkKKKkkss', 'KKstTIIiIIjjts', 'kSSSSssSssskks'], 'alis dekat prihatin (sel e-prihatin): ujung DALAM naik 2 baris (31), menurun ke luar (32)'),
    AJ5(['HhtkkkkKKK', 'hjskkkTIjK', 'hvTjIIjtkk', 'hJIjtSSsSk', 'hVsssStTTs'], 'alis jauh prihatin (sel e-prihatin): naik ke ujung dalam (x29-31 baris 33)'),
  ],
  serius: [
    AD5(['KKKKKKKKKKkksS', 'KKKKKKKKKKkkss', 'KKKKKKTIIIIjts', 'KKtIIijtkKkkks', 'kTIjSssSssskks'], 'alis serius (sel e-serius): puncak turun ke baris 31-32, ujung dalam lebih rendah & tebal (fokus, bukan marah)'),
    AJ5(['HhtkkkkKKK', 'hjskkkkKKK', 'hvskkTTTkk', 'hJIIiIIjSk', 'hVsssStTTs'], 'alis jauh serius (sel e-serius): datar & rendah (baris 35)'),
  ],
};
/** Mulut serius: bibir tertutup datar, sudut tidak naik, merah dikurangi (sel e-serius memberi bibir merah mengerucut). */
const MULUT_SERIUS = { x: 33, y: 47, alasan: 'mulut serius: garis bibir datar tenang (cokelat kulit), merah hanya di tengah bibir bawah; bukan bibir merah mengerucut sel e-serius', baris: [
  '..........',
  '.tuUUUUut.',
  '.Ssumuss..',
  '..stTts...',
] };

/**
 * VARIAN v5 (kepala terkunci; hanya kotak mata / mulut). Posisi = mata master netral (MATA_NETRAL).
 *  - kedip: garis kelopak tertutup melengkung (desain sel e-kedip master: lengkung bawah, ujung luar naik + bulu mata),
 *    digambar di posisi mata TERBUKA (sel e-kedip miring/lebih rendah, jadi tidak dicangkok).
 *  - bawah: kelopak atas turun 1 baris, iris 2 baris di bawahnya (kilap tetap), putih tetap terlihat -> lirik ke dokumen.
 *  - lirikKanan: bawah dengan iris 1 px lebih ke kanan gambar (duduk-tunjuk-kiri: kepala ke pemain, mata ke kartu).
 *  - bicara: bibir atas tetap, celah mulut gelap kecil + bibir bawah turun 1 baris (gaya master), per ekspresi.
 */
const MATA_KEDIP5 = [
  { x: 38, y: 34, alasan: 'kedip mata dekat: kelopak tertutup, garis lengkung bawah + ujung luar naik (sel e-kedip)', baris: [
    '..........s',
    '..SSSttSSSs',
    '.SsskkkssSs',
    '.Iskkkksoo.',
    '.Sooooooss.',
    '..StTTTS...',
  ] },
  { x: 24, y: 37, alasan: 'kedip mata jauh: garis lengkung tertutup', baris: [
    '..........',
    '...SSSSS..',
    '.oSskkssS.',
    '..oooooot.',
    '...SSSSSS.',
    '....SttS..',
  ] },
];
const MATA_BAWAH5 = [
  { x: 38, y: 34, alasan: 'lirik bawah mata dekat: kelopak atas turun 1 baris, iris 2 baris + kilap, putih tetap', baris: [
    '..........s',
    '..SSttttSo.',
    '.oooooooo..',
    '.owgxRwxo..',
    '.SwwrRRrT..',
    '..StTTTS...',
  ] },
  { x: 24, y: 37, alasan: 'lirik bawah mata jauh', baris: [
    '..........',
    '...SSSSS..',
    '.ooooooo..',
    '..owgxwxT.',
    '...SgrVrS.',
    '....SttS..',
  ] },
];
const MATA_LIRIK_KANAN5 = [
  { x: 38, y: 34, alasan: 'lirik kanan-bawah mata dekat (ke kartu di kanan gambar)', baris: [
    '..........s',
    '..SSttttSo.',
    '.oooooooo..',
    '.owwgxRwx..',
    '.SGwwrRRr..',
    '..StTTTS...',
  ] },
  { x: 24, y: 37, alasan: 'lirik kanan-bawah mata jauh', baris: [
    '..........',
    '...SSSSS..',
    '.ooooooo..',
    '..owwgxwx.',
    '...SGwrVr.',
    '....SttS..',
  ] },
];
const MB = (baris, alasan) => ({ x: 33, y: 48, baris, alasan });
const BICARA5 = {
  netral: [MB(['..........', '.UrRRrT...', '.summs....', '..stts....'], 'bicara netral: celah gelap kecil + bibir bawah (gaya master)')],
  prihatin: [MB(['..........', '.urRRrTS..', '..umms....', '..stt.....'], 'bicara prihatin')],
  senyum: [MB(['..........', 'urRRRrT...', '.ummmu....', '..stts....'], 'bicara senyum: celah lebar sedikit, sudut tetap naik')],
  serius: [MB(['..........', '.SrRRrs...', '..sumus...', '...tt.....'], 'bicara serius: celah kecil, bibir tidak merah')],
  lega: [MB(['..........', 'urRRrT....', '.ummus....', '..sts.....'], 'bicara lega')],
};
/** lega: mata tetap TERBUKA, kelopak bawah sisi dalam naik sedikit (santai), bukan mata terpejam seperti sel e-lega. */
const MATA_LEGA = [
  { x: 40, y: 38, alasan: 'lega: kelopak bawah mata dekat naik sedikit (santai), iris & kilap tetap', baris: ['Tg'] },
  { x: 28, y: 41, alasan: 'lega: kelopak bawah mata jauh naik sedikit', baris: ['S'] },
];


/** Kotak cangkok ekspresi (koordinat sel e-netral): mulut. Mata TIDAK dicangkok (mata master netral), alis digambar (ALIS). */
const MULUT = [30, 46, 14, 6];

export const WAJAH = {
  /** Bukaan mata (iris + kilap + putih; koordinat sel arah kiri) yang isinya dibalik pada arah kanan (miss-wajah.tatapKanan). */
  bukaanMata: [{ x0: 40, x1: 45, y0: 36, y1: 38 }, { x0: 27, x1: 31, y0: 39, y1: 41 }],
  /**
   * Kotak mata (KANVAS kanonik, arah kiri) untuk bangun-miss.periksaMata: jauh (sel x24..33 y37..42) & dekat
   * (sel x38..47 y34..39) digeser KEPALA_GESER (+16, -3).
   */
  kotakMata: { jauh: [40, 34, 10, 6], dekat: [54, 31, 10, 6] },
  /** Suntingan kepala dasar (SEMUA ekspresi). */
  dasar: [
    { rata: 'e-netral', kotak: [18, 26, 36, 30], kulit: true, alasan: 'wajah dasar dari sel RATA e-netral (fitur & rona master)' },
    ...MATA_NETRAL,
    ...ALIS.netral,
  ],
  /** Per ekspresi (netral = dasar saja). */
  ekspresi: {
    prihatin: [
      ...ALIS.prihatin,
      { rata: 'e-prihatin', kotak: MULUT, kulit: true, alasan: 'mulut prihatin (sel RATA e-prihatin): kecil, sudut turun' },
    ],
    senyum: [
      { rata: 'e-senyum', kotak: MULUT, kulit: true, alasan: 'mulut senyum (sel RATA e-senyum): lengkung master' },
    ],
    serius: [
      ...ALIS.serius,
      MULUT_SERIUS,
    ],
    lega: [
      { rata: 'e-lega', kotak: MULUT, kulit: true, alasan: 'mulut lega (sel RATA e-lega): senyum kecil lembut' },
      ...MATA_LEGA,
    ],
  },
  /** Varian per ekspresi ('_' = semua ekspresi). kedip & bawah hanya di kotak mata, bicara hanya di kotak mulut. */
  varian: {
    kedip: { _: MATA_KEDIP5 },
    bawah: { _: MATA_BAWAH5 },
    lirikKanan: { _: MATA_LIRIK_KANAN5 },
    bicara: BICARA5,
  },
  /** Suntingan kepala 'kanan' (koordinat kanvas kanonik, SESUDAH cermin). */
  belahanKanan: [
    // belahan hasil cermin (sisi kanan pemakai) ditutup rambut
    { x: 62, y: 12, baris: ['HH'], alasan: 'tutup belahan tercermin' }, { x: 63, y: 13, baris: ['H'], alasan: 'tutup belahan tercermin' },
    { x: 64, y: 14, baris: ['H'], alasan: 'tutup belahan tercermin' }, { x: 64, y: 15, baris: ['hH'], alasan: 'tutup belahan tercermin' },
    { x: 65, y: 16, baris: ['H'], alasan: 'tutup belahan tercermin' }, { x: 66, y: 17, baris: ['h'], alasan: 'tutup belahan tercermin' },
    { x: 66, y: 18, baris: ['ii'], alasan: 'tutup belahan tercermin' },
    // belahan baru di sisi KIRI pemakai (kanan hidung), arah dari mahkota (kiri atas) ke garis rambut
    { x: 69, y: 14, baris: ['Uv'], alasan: 'belahan di sisi kiri pemakai' }, { x: 70, y: 15, baris: ['T'], alasan: 'belahan' },
    { x: 71, y: 16, baris: ['u'], alasan: 'belahan' }, { x: 71, y: 17, baris: ['TV'], alasan: 'belahan' },
    { x: 72, y: 18, baris: ['u'], alasan: 'belahan' }, { x: 73, y: 19, baris: ['u'], alasan: 'belahan' },
    { x: 73, y: 20, baris: ['tT'], alasan: 'belahan bertemu garis rambut' },
  ],
};

/* ================================================================== BADAN (koordinat kanvas kanonik, arah kiri) */

/**
 * Detail depan jas per sel (sesudah sejajar kerah): kotak kancing (piksel gelap), kotak garis bukaan/plaket (emas
 * bukan-dasar), kotak lencana lembar (lambang placeholder; DIHAPUS dan diganti batang emas polos LENCANA).
 * kananGeser: kancing & garis bukaan arah kanan ditempel tak-tercermin, digeser x (menjauh dari lengan dekat);
 * kananLewati: indeks kotak kancing yang tertutup lengan/tangan pada arah kanan (tidak ditempel).
 */
export const SEL_DETAIL = {
  'g-dengar': { kancing: [[53, 62, 4, 4], [50, 69, 5, 4], [50, 78, 5, 4], [50, 86, 5, 4]], plaket: [[54, 60, 4, 48]], lencana: [[59, 66, 10, 8]], kananGeser: 2 },
  'g-sambut': { kancing: [[53, 62, 4, 2], [50, 86, 6, 4], [50, 94, 6, 4]], plaket: [[53, 98, 4, 10]], lencana: [[59, 65, 10, 8]], kananGeser: 2, kananLewati: [1] },
  'g-jelaskan': { kancing: [[52, 62, 4, 3], [50, 69, 4, 4], [49, 78, 5, 4], [50, 86, 4, 4]], plaket: [[53, 60, 5, 48]], lencana: [[58, 66, 10, 8]], kananGeser: 2, kananLewati: [3] },
  'g-tunjuk': { kancing: [[53, 62, 3, 3], [51, 69, 3, 3], [50, 78, 4, 4], [50, 86, 5, 4]], plaket: [[53, 60, 6, 48]], lencana: [[58, 66, 10, 8]], kananGeser: 2 },
};

/** Lencana: batang emas polos (tanpa huruf/lambang) di dada KIRI pemakai = kanan gambar pada kedua arah. */
export const LENCANA = { baris: ['nnnnnn', 'nddddn', 'VVVVVV'], kiri: { x: 61, y: 70 }, kanan: { x: 61, y: 70 } };

/** Garis meja (tepi jauh meja) di kanvas kanonik & jangkar pinggul duduk: garisMeja = pinggul.y - 34 (ruang.json). */
export const DUDUK = { garisMeja: 101, pinggul: { kiri: { x: 58, y: 135 }, kanan: { x: 62, y: 135 } } };

/**
 * Duduk v5: badan 11 px seni LEBIH TINGGI terhadap meja (garisMeja kanvas 90 -> 101; pinggul tetap garisMeja + 34,
 * jadi jangkar panggung tidak berubah): dada & lengan atas terlihat di atas meja (v4: hanya 38 baris badan, Miss
 * tampak terbenam; mata 17 px seni di bawah mata Bu Rina). Lengan bawah + tangan diturunkan (miss-tubuh.turunkanLengan)
 * supaya tetap bertumpu di permukaan meja: siku di baris 86 tetap, lengan bawah diregang 86..90 -> 86..97, manset &
 * tangan bertaut turun 7 baris (sumber 94-101 -> 101-108 = tepat di belakang tepi jauh meja, di atas permukaan).
 * lengan: interval sumber per baris (kiri, kanvas) = lengan/tangan yang dipindah; pinggang: jas di balik tangan.
 */
const LENGAN_DENGAR = {
  R0: 86, R1: 91, D: 7,
  // baris lengan bawah polos (88-90: garis luar + ramp emas) diulang; 86-87 (lipatan siku) sekali
  sumber: [86, 87, 88, 88, 88, 89, 89, 89, 89, 90, 90, 90],
  lengan: {
    86: [[28, 42], [73, 90]], 87: [[28, 42], [73, 90]], 88: [[28, 43], [71, 90]], 89: [[28, 43], [69, 90]], 90: [[28, 45], [68, 90]],
    91: [[28, 45], [64, 90]], 92: [[28, 47], [62, 90]], 93: [[28, 49], [60, 90]],
    94: [[28, 90]], 95: [[28, 90]], 96: [[28, 90]], 97: [[28, 90]], 98: [[28, 90]], 99: [[28, 90]], 100: [[28, 90]],
    // di bawah tangan hanya ujung jari + tepi manset (jas & keliman di sampingnya tetap badan, tertutup meja)
    101: [[40, 43], [47, 69]], 102: [[48, 60]], 103: [[48, 58]], 104: [[49, 56]], 105: [[49, 55]],
  },
  pinggang: { dari: 90, ke: 101, kiri: [45, 41], kanan: [68, 72], plaket: 55 },
};

/**
 * Bingkai antara `duduk-turun` (ronde 3; seperti `duduk-turun` Bu Rina): badan atas gestur *dengar* (tangan bertaut,
 * sama dengan `berdiri` & `duduk-dengar`) dengan kepala terkunci, TURUN setengah jalan dari berdiri ke duduk.
 * Kanvas kanonik sama; jenisJangkar 'kaki'. Berdiri: kaki kanvas y 182 di lantai (tempat.mentorBerdiri y 900 = 225 px
 * seni) -> kanvas + 43. Duduk: pinggul kanvas y 124 di tempat.mentor y 792 (198) -> kanvas + 74. Antara: kanvas + 58
 * (kepala 15 px seni di bawah berdiri, 16 di atas duduk) -> jangkar kaki di kanvas y `kakiY` = 225 − 58 = 167, x = kaki
 * frame `berdiri` arah yang sama (diukur saat bangun). Tepi jauh meja (y seni 163/164) jatuh di kanvas 105/106:
 * `garisMeja` 106 (seperti frame duduk: baris permukaan meja pertama; garis gelap di garisMeja − 1). Baris >= garisMeja
 * dibuang (lutut menekuk & paha tertutup meja, tidak digambar); tangan bertaut tepat di tepi meja (baris 94-105;
 * baris 105 di bawah garis gelap tepi). Hanya berlaku bila kaki diletakkan di y lantai tempat.mentorBerdiri.
 */
export const TURUN = { kakiY: 172, garisMeja: 111, dariBerdiri: 10, keDuduk: 10 };

/** Bawah berdiri: rok + kaki master (baris master >= 115) mulai baris kanvas 109, digeser x +29 (tengah rok 28,5 -> 57,5). */
export const BAWAH = { dariBaris: 115, keBaris: 109, geserX: 29 };

/* ------------------------------------------------------------------ simpan di bawah garis meja (per baris: [x0,x1] inklusif) */

/**
 * Lengan bawah + tangan duduk-dengar (kiri): dua lengan dari siku ke tangan bertaut di atas meja.
 * Ronde 3: baris 93 mulai x 61 (dulu 60). Piksel (60,93) = sisa jas/kulit #ad5c2e yang menonjol 1 px di atas garis atas
 * tangan, di samping garis manset (terlihat sebagai titik lepas di depan meja; x 60 = sumbu cermin, jadi kiri & kanan
 * sama). Garis atas tangan disambung ke manset lewat `SAMBUNG_TANGAN_DENGAR`.
 */
const SIMPAN_DENGAR = {
  90: [[30, 45], [67, 87]], 91: [[30, 46], [64, 86]], 92: [[31, 47], [62, 86]], 93: [[32, 49], [61, 85]],
  94: [[33, 84]], 95: [[34, 83]], 96: [[35, 81]], 97: [[36, 79]], 98: [[38, 76]], 99: [[39, 74]], 100: [[40, 74]],
  101: [[47, 69]], 102: [[48, 60]], 103: [[49, 58]], 104: [[49, 56]], 105: [[50, 55]],
};
/**
 * Garis atas tangan bertaut (duduk-dengar) di baris 94 diteruskan 1 px (x 60, 't' -> garis 'R') sampai bertemu garis
 * manset (61,93) secara diagonal, menggantikan piksel lepas (60,93). x 60 = sumbu cermin -> sama untuk kanan.
 */
const SAMBUNG_TANGAN_DENGAR = { op: 'ascii', arah: 'keduanya', cermin: true, x: 60, y: 101, baris: ['R'], alasan: 'ronde 3: garis atas tangan bertaut disambung ke manset (ganti piksel lepas #ad5c2e di (60,93))' };

/**
 * CELAH LENGAN-BADAN (v5b, temuan verifikasi). Lembar gestur *dengar* punya celah transparan bergerigi 1-4 px antara
 * lengan yang menggantung dan sisi badan (kanvas kiri x 69-74, baris 81-90; lengan KANAN gambar). Sejak badan duduk
 * dinaikkan 11 px, celah itu seluruhnya di atas meja dan memperlihatkan kursi gelap / latar -> terbaca noda atau
 * sobekan gelap di jas (paling jelas di duduk-dengar-kanan, sisi KIRI layar = cermin). Lengan bawah bertumpu di meja
 * dan lengan atas menempel di sisi badan, jadi yang terlihat di sana adalah sisi badan yang tertutup bayang lengan:
 * celah diisi kain jas, garis sisi badan lama (x/R/v di tepi celah) jadi bagian bayang, dan hanya garis dalam lengan
 * yang tersisa sebagai satu kontur. Bayang menggelap ke arah lengan: F (#e49b3d) -> l -> L (#ca812d) -> garis lengan.
 * Blok x 67, y 81 (kanvas kiri; arah kanan = cermin). Dipakai duduk-dengar (keduanya) & duduk-tunjuk-kanan (lengan
 * istirahat = cermin sisi yang sama); duduk-tunjuk-kiri memakai lengan TUNJUK di sisi ini.
 */
const CELAH_DENGAR = [
  '...FlL', // 81  (garis lengan x 73)
  '...FFlL', // 82  (garis lengan x 74)
  '...FFlL', // 83
  '..FFFlL', // 84
  '...FFFlL', // 85  (garis lengan x 75)
  '...FFlL', // 86
  '...FlL', // 87
  '..FlL', // 88  (garis lengan x 72)
  '.FllL', // 89
  'lllLL', // 90  lipatan lengan bawah (VRV) di baris 91
];
/**
 * Sisi lengan KIRI gambar (kanvas kiri, x 43, y 86): lubang 1 px di antara garis dalam lengan dan garis sisi badan
 * (86-87 x 43; 90-91 x 44) -> diisi 'n' seperti lipatan baris 88-89 (garis x-n-x menerus, tanpa titik latar).
 * Dipakai duduk-dengar, duduk-tunjuk-kiri, telepon (keduanya; kanan = cermin).
 */
const CELAH_DENGAR_KIRI = ['n', 'n', '', '', '.n', '.n'];
/**
 * duduk-jelaskan: sisi lengan dekat yang bertumpu (kanvas kiri x 68, y 81; kanan = cermin) sama seperti CELAH_DENGAR
 * (celah 69-73 baris 81-86), dan di bawah siku telapak (x 42, baris 86-87) celah 1 px ditutup garis 'x' supaya ruang di
 * bawah siku yang terangkat mulai sebagai takik bersih di baris 88 (bukan retakan 1 px).
 */
const CELAH_JELASKAN = [
  'fFFlL', // 81
  'fFFlL', // 82
  'fFFlL', // 83
  'FFFlL', // 84
  'FFFFlL', // 85
  'FFlL', // 86
];
const CELAH_JELASKAN_KIRI = ['x', 'x'];
/**
 * `berdiri` & `duduk-turun` memakai badan *dengar* yang sama dengan tangan bertaut di pinggang (lengan tidak
 * diturunkan): celah yang sama ada di baris 81-88 (baris 89-90 sudah lipatan lengan bawah 'VRV'). Diisi dengan pola
 * yang sama supaya siluet tidak berubah (celah muncul/hilang) sepanjang animasi duduk/bangkit
 * berdiri -> duduk-turun -> duduk-dengar; duduk-turun juga digambar di depan kursi gelap.
 */
const CELAH_BERDIRI = CELAH_DENGAR.slice(0, 8);
const CELAH_BERDIRI_KIRI = ['n', 'n'];
const celah = (arah, x, y, baris, alasan) => ({ op: 'ascii', arah, cermin: true, x, y, baris, alasan });

/**
 * duduk-jelaskan v5: lengan DEKAT yang bertumpu (lengan bawah + manset + tangan) turun 8 baris ke permukaan meja (sama
 * dengan LENGAN_DENGAR; dulu tangan melintang di depan pinggang, di atas garis meja baru). Lengan telapak terbuka tetap
 * (siku terangkat saat menjelaskan = gestur wajar). Interval dibaca dari dump frame (kanvas arah kiri).
 */
const LENGAN_JELASKAN = {
  R0: 86, R1: 90, D: 8,
  sumber: [86, 87, 87, 88, 88, 88, 88, 89, 89, 89, 89, 89],
  lengan: {
    86: [[72, 86]], 87: [[68, 86]], 88: [[65, 85]], 89: [[63, 86]], 90: [[61, 86]], 91: [[60, 85]], 92: [[53, 84]], 93: [[51, 83]],
    94: [[49, 82]], 95: [[49, 80]], 96: [[48, 77]], 97: [[47, 74]], 98: [[47, 73]], 99: [[48, 73]], 100: [[48, 74]], 101: [[49, 56]], 102: [[50, 54]],
  },
  pinggang: { dari: 86, ke: 101, kiri: [44, 40], kanan: [68, 72], plaket: 54 },
  alasan: 'jelaskan: hanya lengan dekat yang bertumpu',
};

/**
 * Bawah manset tangan istirahat (v5 ronde akhir): baris 108-111 di bawah manset lengan istirahat masih memuat keliman
 * jas (sisa badan dasar yang disimpan interval `simpan`), tergambar sebagai potongan kain kuning DI ATAS permukaan
 * meja di bawah manset. Manset ditutup garis (baris 108 di bawah abu manset) dan sisa jas dibuang. Kiri: tunjuk-kiri &
 * telepon (kanan telepon = cermin). TUTUP_MANSET_KANAN: tunjuk-kanan (lengan istirahat hasil cermin badan, x 44-57).
 */
const TUTUP_MANSET = ['___xx___', '________', '________', '________'];
// (v5b: SISI_BADAN_TUNJUK_KANAN & BERSIH_SISI_TUNJUK_KANAN dihapus; sisi badan di samping lengan penunjuk kini bagian
// blok TUNJUK sendiri: garis sisi badan + celah ketiak digambar utuh dari baris 81.)
const TUTUP_MANSET_KANAN = [
  '____xxx.......',
  '_______.......',
  '_________xxxx_',
  '______________',
  '______________',
];

/**
 * TANGAN ISTIRAHAT (v5, tunjuk & telepon): satu tangan menempel di permukaan meja keluar dari manset (jari ke tengah).
 * Sebelumnya lengan lain "ke pangkuan" di balik garis meja lama; dengan badan lebih tinggi tangan bertaut dengar
 * terlihat melayang di depan pinggang. Badan di balik tangan/lengan yang dibuang dikembalikan dari 'tanpaLengan'.
 */
const TANGAN_ISTIRAHAT = [
  '...........',
  'rrrrr......',
  'kKKKkrr....',
  'kKKKKkkrr..',
  'skKKKKkksr.',
  'skkKKkkksSr',
  'SskkkkksSSr',
  'rSssskssSr_',
  '_rrSSSSSr__',
  '___rrrrr___',
];
const KEMBALI = (poligon, arah, alasan) => ({ op: 'salinPoligon', dari: 'tanpaLengan', kosongkan: true, poligon, arah, alasan });
/** Di bawah garis meja (DUDUK.garisMeja 101) badan tanpaLengan = jas bawah sumber -> dikosongkan, bukan dikembalikan. */
const KOSONG = (poligon, arah, alasan) => ({ op: 'hapusPoligon', poligon, arah, alasan });

/** duduk-jelaskan (kiri): siku lengan jauh (telapak terbuka di atas garis meja) + lengan dekat bertumpu, satu tangan. */
const SIMPAN_JELASKAN = {
  90: [[33, 38], [61, 86]], 91: [[60, 85]], 92: [[52, 84]], 93: [[51, 83]], 94: [[49, 82]], 95: [[49, 80]], 96: [[48, 77]],
  97: [[47, 74]], 98: [[47, 73]], 99: [[47, 68]], 100: [[48, 59]], 101: [[49, 56]], 102: [[50, 54]],
};

/**
 * LENGAN TUNJUK (v5b, 28 Sep, temuan verifikasi: lengan v5 = lengan v4 dipanjangkan; lengan atas menyatu dengan kontur
 * badan lewat celah 1-4 px bergerigi, siku tidak terbaca, lengan bawah rebah lalu jari jatuh tegak dari gumpalan tangan).
 * Digambar ULANG dari baris 81 (di bawah ketiak) sampai ujung jari; pola sama untuk kedua arah di lengan KANAN GAMBAR
 * (kiri x 66, kanan x 70; y 81). Alur yang dibaca di 1x: bahu (sumber, baris <= 80) -> lengan atas LURUS TURUN,
 * menyempit 13 -> 10 px, dipisah dari badan oleh CELAH KETIAK berbentuk baji yang bersih (2 px di baris 81 melebar ke
 * 5-6 px di baris 90-100; garis sisi badan 1 px digambar ulang di tepi kirinya) -> SIKU: sudut kiri-bawah tegas 'xxx'
 * (baris 99, tepat di atas tepi jauh meja) + lipatan siku dalam 'F/e' di sudut kanan-atas -> LENGAN BAWAH menurun ± 25°
 * ke kanan melintasi tepi meja (terangkat, tidak rebah di permukaan), sisi bawah berbayang d/c -> MANSET putih miring
 * (tegak lurus lengan bawah) -> TANGAN: punggung tangan terang (K) melebar dari manset, jari lain tertekuk di sisi
 * dalam (lipatan S/T), TELUNJUK 2 px (k+s) menurun ke kartu; pergelangan sedikit menekuk ke bawah (menunjuk dokumen).
 * Tangan ± 7 x 9 px termasuk garis = ukuran tangan istirahat/dengar. Lengan atas (sampai siku baris 99) + lengan bawah
 * menjangkau kartuMeja tanpa memindah kartu: ujung telunjuk (97,113) tidak berubah.
 * Menggantikan v5 tangan (lengan atas di sisi badan dengan celah sempit, siku di baris 102, lengan bawah ± 35° rebah di
 * meja, tangan gumpalan + telunjuk tegak) dan ronde meja 1-2. '.' = biarkan (badan), '_' = transparan (celah ketiak,
 * latar, meja). Arah kiri: + TUNJUK_SISI_KIRI (sisa garis sisi badan sumber di kiri garis sisi baru dibayangi 'd').
 * Blok disusun dengan generator draf lalu disunting tangan (tangan, manset, lipatan siku); di sini = data final.
 * Ujung telunjuk (kanvas kiri; piksel ujung (97,113), titik di batas bawah-kanan) = (98; 114) -> TUNJUK_UJUNG.
 */
const TUNJUK = [
  '.....x__xcbbbbbbcbbex________________', // 81 lengan atas: celah ketiak mulai 2 px
  '.....x__xcbbbbbbcbbex________________', // 82
  '....x____xcbbbbbbcbbex_______________', // 83
  '....x____xcbbbbbbcbbex_______________', // 84
  '....x____xcbbbbbbcbbex_______________', // 85
  '....x_____xcbbbbbcbbex_______________', // 86 celah melebar (baji)
  '...x______xcbbbbbcbbex_______________', // 87
  '...x______xcbbbbbcbbex_______________', // 88
  '...x______xcbbbbbcbbex_______________', // 89
  '...x_______xcbbbbcbbex_______________', // 90
  '...x_______xcbbbbcbbex_______________', // 91
  '...x_______xbbbbbbbbbx_______________', // 92 lengan atas lurus turun, menyempit ke siku
  '...x_______xbbbbbbbbbx_______________', // 93
  '....x______xbbbbbbbbbx_______________', // 94
  '....x______xbbbbbbbbbx_______________', // 95
  '....x______xbbbbbbbbFx_______________', // 96 lipatan siku dalam (F/e)
  '.....x_____xccbbbbbFebxx_____________', // 97
  '.....x_____xddccbbFebbbbx____________', // 98
  '.....x_____xxxddccbbbbbbbxx__________', // 99 siku: sudut kiri-bawah (xxx) di tepi jauh meja
  '......x_______xxddcccbbbbbdx_________', // 100
  '________________xxdddccbbcdwxx_______', // 101 garis meja; lengan bawah menurun ke kanan, manset
  '__________________xxxddccdwwwgKr_____', // 102 manset miring + punggung tangan
  '_____________________xxdddwwgKKkr____', // 103
  '_______________________xxwwwgkKKkr___', // 104
  '_________________________xxgskkKksr__', // 105 tangan (buku jari)
  '___________________________xrskkksr__', // 106
  '____________________________rSskkSr__', // 107 jari tertekuk (S/T)
  '____________________________rTkksr___', // 108
  '____________________________rrksr____', // 109 telunjuk 2 px
  '_____________________________rksr____', // 110
  '_____________________________rksr____', // 111
  '_____________________________rksr____', // 112
  '______________________________rr_____', // 113 ujung telunjuk (97,113) di kartu
  '_____________________________________', // 114
  '_____________________________________', // 115
];
/** Arah kiri saja (x 67, y 90): sisa garis sisi badan sumber di kiri garis sisi baru (baris 90-91, 94) -> bayang 'd'. */
const TUNJUK_SISI_KIRI = ['dd', '.d', '', '', '..d'];
const TUNJUK_UJUNG = { x: 98, y: 114 };

/**
 * Lengan telepon (arah kiri; kanan = cermin), x 62..87 y 48..90: manset (y48-50), lengan bawah terangkat di DEPAN (garis
 * luar kiri gelap, sisi kanan = lipatan 'e' ke lengan atas di belakangnya), lengan atas dengan satu garis luar, siku
 * membulat (y73-75), sisi badan di bawah siku menyambung ke garis sisi badan sumber (y79-89).
 */
const TELEPON_LENGAN = [
  '....xGgwwwwgGx____________', // 48 manset (v5 meja: 3 px ke kanan, terpisah dari kerah)
  '....xqGGggGGqx____________', // 49
  '....xcbbbbbbdx____________', // 50 lengan bawah tegak dari manset
  '....xcbbbbbbdx____________', // 51
  '....xcbbbbbbdx____________', // 52
  '....xcbbbbbbdx____________', // 53
  '....xcbbbbbbdx____________', // 54
  '....xcbbbbbbdx____________',
  '....xcbbbbbbdx____________',
  '.....xcbbbbbbdx___________',
  '.....xcbbbbbbdeex_________',
  '......xcbbbbbbdeex________',
  '......xcbbbbbbdedex_______',
  '.......xcbbbbbbdedex______',
  '.......xcbbbbbbdeddex_____',
  '........xcbbbbbbdedex_____',
  '........xcbbbbbbdeddex____',
  '.........xcbbbbbdeddex____',
  '.........xcbbbbbbdeddex___',
  '..........xcbbbbbdeddex___',
  '..........xcbbbbbdeddex___',
  '...........xcbbbbbdedex___',
  '...........xcbbbbbdedex___',
  '............xcbbbbdedex___',
  '............xcbbbbdedex___',
  '.............xcbbddeex____',
  '..........eeexdddddex_____',
  '..........eeexxxxxxx______',
  '..........eex_____________',
  '.........eeex_____________',
  '.........efx______________',
  '..........._______________',
  '..........._______________',
  '..........________________',
  '..........._______________',
  '..........._______________',
  '..........._______________',
  '..........._______________',
  '........x.._______________',
  '..........._______________',
  '........._________________',
  '.......x__________________', // 89 v5b: garis sisi badan x 69 (dulu x 71 = serpihan kontur lepas di samping celah 2 px)
  '..........................',
];

/**
 * Tangan & gagang telepon (v5 tangan, 28 Sep; arah kiri, kanan = cermin), blok x 56, y 29..50, digambar SESUDAH
 * TELEPON_LENGAN.
 * v4/v5 awal: tangan = blok kulit padat 11 x 9 di PIPI, gagang terbaca dua potong. Ronde meja 2: gagang menerus, tangan
 * 10 x 11 di belakang rahang dari telinga sampai rahang -> di 1440/390 terbaca sebagai bidang kulit di samping gagang
 * (menyatu dengan telinga & pipi), jari yang melintas hanya titik 1 px. Sekarang SATU tangan menggenggam SATU gagang:
 *  - gagang tetap satu bentuk: corong dengar di telinga (y 30-35) -> gagang diagonal -> corong bicara di samping dagu
 *    (y 45-50; mulut tetap terlihat); tepi kiri gagang 'o' terlihat sepanjang genggaman (gagang lewat DI BALIK jari);
 *  - kepalan kecil (± 8 x 7 px, seukuran tangan dengar) bergaris tepi 'r' penuh DI TENGAH gagang (y 38-44): tiga jari
 *    melingkar di depan gagang (baris terang 'kKK' y 39/41/43, lipatan 'T' di antaranya), nada kulit lebih gelap dari
 *    pipi ('s'/'S' -> terpisah dari wajah); ibu jari di punggung gagang ke arah corong dengar (y 36-38);
 *  - pergelangan sempit (y 44-46) lurus ke manset putih (y 47, x 66-75 = manset TELEPON_LENGAN) -> lengan bawah.
 *  Telinga di atas kepalan kembali terlihat (tidak lagi tertutup tangan).
 */
const TELEPON_TANGAN = [
  '......................', // 29
  '..............ooo.....', // 30 corong dengar di telinga
  '.............opPpo....', // 31
  '............opPppzo...', // 32
  '............opppzzo...', // 33
  '............ozpzzo....', // 34
  '...........opzzo......', // 35 gagang (telinga di kanannya tetap terlihat)
  '...........opzorr.....', // 36 ibu jari di punggung gagang
  '..........opzorkSr....', // 37
  '..........orrrrksSr...', // 38 tepi atas kepalan
  '.........orkKKksSr....', // 39 jari 1 melingkar di depan gagang
  '.........orTssSTSr....', // 40
  '........orkKKksSSr....', // 41 jari 2
  '........orTssSTSr.....', // 42
  '.......oprkKksSSr.....', // 43 jari 3
  '......opzorrTSSSr.....', // 44 gagang keluar di bawah kepalan; pergelangan
  '.....oppzo.rsSSSr.....', // 45
  '...oPppzo..rsSSr......', // 46
  '..oPppzo..xgwwwwwgGx..', // 47 manset atas
  '..oppzzo..............', // 48 corong bicara (mulut tetap terlihat)
  '..ozzzo...............', // 49
  '...ooo................', // 50
];

/** Telapak terbuka (jelaskan/persilakan, lengan kiri gambar pada arah kiri; kanan = cermin): digambar ulang lebih bersih
 * (ibu jari + empat jari menyatu, satu lipatan telapak), siluet sama dengan sumber supaya lengan & manset tetap tersambung. */
const TELAPAK = { op: 'ascii', arah: 'keduanya', cermin: true, x: 10, y: 66, alasan: 'telapak terbuka sumber berbintik/berjari seperti kipas -> telapak sederhana (ibu jari + jari menyatu)', baris: [
  '___________________',
  '_______rrr_________',
  '______rKksrr_______',
  '_______rskkkrr_____',
  '________rskKKkrr___',
  '__rrrrrrrTkKKKksr__',
  '_rskkkkkkktkKKksSr_',
  'rskKKkkkkkktkkkksSr',
  '_rsskkssskkktkkksSr',
  '__rrstTtssskkkksSSr',
  '____rrRrrtsskkksSr.',
  '_________rrTtssSr..',
  '...........rutt....',
] };

/**
 * Kolom LENGAN (bukan torso) di baris tepi jauh meja = kanvas y DUDUK.garisMeja - 1 (89), per arah, [x0,x1] inklusif.
 * Garis tepi jauh meja (lapisan belakangMeja, 1 baris gelap #3a2620 di y seni 163) jatuh di baris ini. Kotak diAtasMeja
 * dinaikkan 1 baris HANYA di kolom ini supaya lengan yang melintas tepi digambar di atas garis; kolom torso tetap di
 * belakang tepi meja (pinggang tertutup). Batas lengan/torso dibaca dari garis gelap lipatan jas (dump baris 88-90).
 * 'cermin' = cermin interval kiri (badan kanan = cermin tepat di baris ini; diperiksa).
 */
const TEPI_LENGAN = {
  // dengar: lengan jauh x29-43 (garis dalam 'x' x43), lengan dekat x69-87 (lipatan 'VRV' x69-71)
  'duduk-dengar': { kiri: [[29, 43], [69, 87]], kanan: 'cermin' },
  // jelaskan: siku lengan telapak x32-39, lengan dekat bertumpu x64-86 (garis dalam 'jj' x64-65)
  'duduk-jelaskan': { kiri: [[32, 39], [64, 86]], kanan: 'cermin' },
  // tunjuk: HANYA lengan tunjuk (lengan lain turun ke pangkuan DI BALIK meja -> tetap tertutup garis meja)
  'duduk-tunjuk': { kiri: [[71, 87]], kanan: [[77, 91]] },
};

/** Interval simpan duduk-tunjuk per baris 90-118: lengan tunjuk [x0,x1] + tangan istirahat (baris 101-111). */
function simpanTunjuk(x0, x1, istirahat) {
  const o = {};
  for (let y = 90; y <= 118; y++) o[y] = y >= 101 && y <= 111 ? [[x0, x1], istirahat] : [[x0, x1]];
  return o;
}

/**
 * Resep frame. jenis 'berdiri' (rok + kaki master, jangkar kaki) | 'duduk' (potong garis meja, jangkar pinggul).
 * arah: arah yang dibuat. simpan: interval per arah ('cermin' = cermin interval kiri).
 * tepiLengan: kolom lengan di baris garisMeja-1: 'otomatis' (v5) = kolom yang buram di baris garisMeja-1 DAN di baris
 * garisMeja (lengan/tangan yang melintas tepi jauh meja ke permukaan meja; kolom badan terpotong di garis meja).
 * tanganMeja: titik tangan yang bertumpu di permukaan meja (kanvas; keterangan untuk panggung/prop, tidak dibaca susun.ts). mataBawah: sprite mata pengganti varian `bawah`
 * per arah (duduk-tunjuk kiri: lirik kanan-bawah ke kartu).
 * suntingan / depan: operasi per arah ('keduanya' + cermin:true = kiri apa adanya, kanan dicermin). `depan` digambar
 * SESUDAH kepala (tangan + gagang di depan wajah).
 */
export const FRAME = {
  berdiri: { sel: 'g-dengar', jenis: 'berdiri', arah: ['kiri', 'kanan'], suntingan: [celah('keduanya', 67, 81, CELAH_BERDIRI, 'v5b: celah lengan-badan diisi bayang jas (sama dengan duduk-dengar)'), celah('keduanya', 43, 86, CELAH_BERDIRI_KIRI, 'v5b: lubang 1 px lengan-badan diisi lipatan n')] },
  'berdiri-sambut': { sel: 'g-sambut', jenis: 'berdiri', arah: ['kiri', 'kanan'] },
  'berdiri-persilakan': { sel: 'g-jelaskan', jenis: 'berdiri', arah: ['kanan', 'kiri'], suntingan: [TELAPAK], telapak: { kiri: { x: 16, y: 72 }, kanan: { x: 104, y: 72 } } },
  // duduk-turun (ronde 3): bingkai antara berdiri <-> duduk. Lihat TURUN.
  'duduk-turun': { sel: 'g-dengar', jenis: 'turun', arah: ['kanan', 'kiri'], suntingan: [celah('keduanya', 67, 81, CELAH_BERDIRI, 'v5b: celah lengan-badan diisi bayang jas (sama dengan duduk-dengar)'), celah('keduanya', 43, 86, CELAH_BERDIRI_KIRI, 'v5b: lubang 1 px lengan-badan diisi lipatan n')] },
  'duduk-dengar': { sel: 'g-dengar', jenis: 'duduk', arah: ['kiri', 'kanan'], lengan: LENGAN_DENGAR, suntingan: [SAMBUNG_TANGAN_DENGAR, celah('keduanya', 67, 81, CELAH_DENGAR, 'v5b: celah lengan-badan (sisi kanan gambar; kanan = kiri layar) diisi bayang jas'), celah('keduanya', 43, 86, CELAH_DENGAR_KIRI, 'v5b: lubang 1 px lengan-badan sisi kiri gambar diisi lipatan n')], simpan: { kiri: {}, kanan: {} }, tepiLengan: 'otomatis', tanganMeja: { kiri: [{ x: 55, y: 105 }], kanan: [{ x: 66, y: 105 }] } },
  'duduk-jelaskan': { sel: 'g-jelaskan', jenis: 'duduk', arah: ['kiri', 'kanan'], lengan: LENGAN_JELASKAN, suntingan: [TELAPAK, celah('keduanya', 68, 81, CELAH_JELASKAN, 'v5b: celah lengan dekat-badan diisi bayang jas'), celah('keduanya', 42, 86, CELAH_JELASKAN_KIRI, 'v5b: retakan 1 px di bawah siku telapak ditutup garis')], simpan: { kiri: SIMPAN_JELASKAN, kanan: 'cermin' }, tepiLengan: 'otomatis', tanganMeja: { kiri: [{ x: 54, y: 105 }], kanan: [{ x: 67, y: 105 }] }, telapak: { kiri: { x: 16, y: 72 }, kanan: { x: 104, y: 72 } } },
  // tunjuk v5 (lengan v5b): lengan KANAN GAMBAR menunjuk kartu (kiri = lengan dekat, kanan = lengan jauh); lengan KIRI GAMBAR
  // bertumpu di meja dengan satu tangan (TANGAN_ISTIRAHAT). Dasar = lengan dengar yang diturunkan ke meja; tangan
  // bertaut & lengan bawah penunjuk dikembalikan ke badan (tanpaLengan) lalu digambar ulang.
  'duduk-tunjuk': {
    sel: 'g-dengar', jenis: 'duduk', arah: ['kanan', 'kiri'], lengan: LENGAN_DENGAR,
    suntingan: [
      KEMBALI([[47, 94], [60, 94], [60, 90], [100, 90], [100, 101], [47, 101]], 'kiri', 'tangan bertaut & lengan bawah dekat dibuang (badan dikembalikan)'),
      KOSONG([[47, 101], [100, 101], [100, 115], [47, 115]], 'kiri', 'di bawah garis meja: tangan bertaut & lengan bawah dekat dibuang'),
      KEMBALI([[58, 94], [72, 94], [72, 90], [106, 90], [106, 101], [58, 101]], 'kanan', 'tangan bertaut & lengan bawah jauh dibuang (badan dikembalikan)'),
      KOSONG([[58, 101], [106, 101], [106, 115], [58, 115]], 'kanan', 'di bawah garis meja: tangan bertaut & lengan bawah jauh dibuang'),
      { op: 'ascii', arah: 'kiri', x: 46, y: 100, baris: TANGAN_ISTIRAHAT, alasan: 'tangan jauh bertumpu di meja (satu tangan, keluar dari manset)' },
      { op: 'ascii', arah: 'kanan', x: 58, y: 100, baris: TANGAN_ISTIRAHAT, alasan: 'tangan dekat bertumpu di meja (satu tangan, keluar dari manset)' },
      { op: 'ascii', arah: 'kiri', x: 39, y: 108, baris: TUTUP_MANSET, alasan: 'v5: manset tangan istirahat ditutup garis, sisa keliman jas di bawahnya (di permukaan meja) dibuang' },
      { op: 'ascii', arah: 'kanan', x: 44, y: 107, baris: TUTUP_MANSET_KANAN, alasan: 'v5: manset tangan istirahat ditutup garis, sisa keliman jas di bawahnya (di permukaan meja) dibuang' },
      { op: 'ascii', arah: 'kiri', x: 66, y: 81, baris: TUNJUK, alasan: 'v5b: lengan tunjuk dekat digambar ulang dari bawah ketiak: lengan atas lurus turun dengan celah ketiak berbentuk baji -> siku bersudut di tepi jauh meja + lipatan siku dalam -> lengan bawah menurun ke kanan -> manset miring -> punggung tangan, jari tertekuk, telunjuk 2 px di kartu (kanan pemakai)' },
      { op: 'ascii', arah: 'kiri', x: 67, y: 90, baris: TUNJUK_SISI_KIRI, alasan: 'v5b: sisa garis sisi badan sumber di kiri garis sisi baru dibayangi' },
      { op: 'ascii', arah: 'kanan', x: 70, y: 81, baris: TUNJUK, alasan: 'v5b: lengan tunjuk jauh digambar ulang dari bawah ketiak (pola sama dengan kiri; garis sisi badan cermin ikut digambar ulang) -> telunjuk di kartu (kiri pemakai)' },
      celah('kanan', 67, 81, CELAH_DENGAR, 'v5b: celah lengan istirahat-badan (kiri layar) diisi bayang jas'),
      celah('kiri', 43, 86, CELAH_DENGAR_KIRI, 'v5b: lubang 1 px lengan istirahat-badan diisi lipatan n'),
    ],
    // simpan (di bawah garis meja): lengan tunjuk + tangan (kiri x 72-104, kanan x 76-108) dan tangan istirahat
    simpan: { kiri: simpanTunjuk(72, 104, [28, 57]), kanan: simpanTunjuk(76, 108, [30, 70]) },
    simpanLengan: false,
    ujungTelunjuk: { kiri: { x: TUNJUK_UJUNG.x, y: TUNJUK_UJUNG.y }, kanan: { x: TUNJUK_UJUNG.x + 4, y: TUNJUK_UJUNG.y } },
    tepiLengan: 'otomatis',
    tanganMeja: { kiri: [{ x: 52, y: 105 }], kanan: [{ x: 64, y: 105 }] },
    // kiri: kepala ke pemain; varian bawah = mata melirik kanan-bawah ke kartu (bukan turun ke kiri, menjauh dari kartu)
    mataBawah: { kiri: 'lirikKanan' },
  },
  // telepon v5: satu gagang di tangan dekat (telinga dekat); lengan jauh bertumpu di meja dengan satu tangan
  telepon: {
    sel: 'g-dengar', jenis: 'duduk', arah: ['kiri', 'kanan'], lengan: LENGAN_DENGAR,
    suntingan: [
      { ...KEMBALI([[47, 94], [60, 94], [60, 86], [100, 86], [100, 101], [47, 101]], 'keduanya', 'tangan bertaut & lengan bawah dekat dibuang (badan dikembalikan)'), cermin: true },
      { ...KOSONG([[47, 101], [100, 101], [100, 115], [47, 115]], 'keduanya', 'di bawah garis meja: tangan bertaut & lengan bawah dekat dibuang'), cermin: true },
      { op: 'hapusPoligon', arah: 'keduanya', cermin: true, poligon: [[82, 62], [92, 62], [92, 92], [74, 92], [74, 79], [84, 64]], alasan: 'lengan dekat yang menggantung dibuang' },
      { op: 'ascii', arah: 'keduanya', cermin: true, x: 46, y: 100, baris: TANGAN_ISTIRAHAT, alasan: 'tangan jauh bertumpu di meja (satu tangan, keluar dari manset)' },
      { op: 'ascii', arah: 'keduanya', cermin: true, x: 39, y: 108, baris: TUTUP_MANSET, alasan: 'v5: manset tangan istirahat ditutup garis, sisa keliman jas di bawahnya (di permukaan meja) dibuang' },
      celah('keduanya', 43, 86, CELAH_DENGAR_KIRI, 'v5b: lubang 1 px lengan istirahat-badan diisi lipatan n'),
    ],
    depan: [
      { op: 'ascii', arah: 'keduanya', cermin: true, x: 62, y: 48, baris: TELEPON_LENGAN, alasan: 'lengan bawah terangkat + manset + siku, sisi badan di bawah siku' },
      { op: 'ascii', arah: 'keduanya', cermin: true, x: 56, y: 29, baris: TELEPON_TANGAN, alasan: 'v5 tangan: gagang satu bentuk telinga -> dagu; satu kepalan kecil bergaris tepi di tengah gagang (tiga jari melingkar di depan gagang, ibu jari di punggungnya), pergelangan sempit lurus ke manset putih; telinga di atas kepalan terlihat' },
    ],
    simpan: { kiri: { 101: [[28, 57]], 102: [[28, 57]], 103: [[28, 57]], 104: [[28, 57]], 105: [[28, 57]], 106: [[28, 57]], 107: [[28, 57]], 108: [[28, 57]], 109: [[28, 57]], 110: [[28, 57]], 111: [[28, 57]] }, kanan: 'cermin' },
    simpanLengan: false,
    gagang: { kiri: { x: 70, y: 33 }, kanan: { x: 50, y: 33 } },
    tepiLengan: 'otomatis',
    tanganMeja: { kiri: [{ x: 52, y: 105 }], kanan: [{ x: 69, y: 105 }] },
  },
};
