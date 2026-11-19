/**
 * T-064 Episode 1 Dev ("Kenalan Raksa"): HANYA kunci BARU (bahasa Indonesia). Semua baris cerita yang dipakai ulang tetap
 * dari TEKS_AUTO_2 (lihat ./teks.ts: tabel episode = TEKS_AUTO_2 + kunci ini, kunci ini menang). `judul` / `ringkas` ditimpa
 * hanya untuk episode ini (kartu daftar). Kunci & parameter sama di id / en / zh.
 */
export const TEKS_AUTO_2_DEV_ID: Record<string, string> = {
  judul: 'Episode 1 Dev · Kenalan Raksa',
  ringkas: 'Versi 5 menit kasus truk trailer: tiga keputusan, cek SIM, dan rekaman dashcam. Langsung main, tanpa daftar.',
  'dev.label': 'Episode 1 Dev',

  // Kartu cara main (Pandu, Task 2 Designer): SIM dan dashcam, satu kalimat.
  'cara.sim': 'Ketuk tiap baris data Satpas untuk mencocokkannya dengan SIM.',
  'cara.dashcam': 'Tonton rekamannya, lalu ketuk penyebabnya.',

  // Momen dashcam (node kdash)
  'kdash.1': 'Pagi itu dashcam truk Pak Hendra merekam semuanya. Pak Bima memutar rekamannya untukmu.',
  'kdash.2': 'Kejadian yang terlihat jelas tetap harus dibuktikan. Siapa yang memicunya?',
  'kdash-a.1': 'Betul. Mobil kecil pindah dari lajur 3 ke lajur 2 tepat di depan truk, jadi truk membanting setir ke kiri. Tetap kita cocokkan dengan rambu dan keterangan saksi: rekaman saja belum cukup.',
  'kdash-b.1': 'Penyebabnya mobil kecil yang memotong dari lajur 3 ke lajur 2. Truk hanya menghindar. Itulah kenapa kita memutar ulang bukti dan mencocokkannya dengan saksi, bukan menebak.',
  'kdash.a.alasan': 'Kamu menemukan pemicunya dari rekaman.',
  'kdash.b.alasan': 'Pemicunya baru jelas sesudah dijelaskan.',

  // Arena dashcam (dibaca ArenaPolaDashcam, Task 2)
  'arena.dashcam.tanya': 'Ketuk kendaraan yang memicu kejadian.',
  'arena.dashcam.putar': 'Putar lagi',
  'arena.dashcam.lanjut': 'Lanjut',
  'arena.dashcam.benda.mobil': 'Mobil kecil',
  'arena.dashcam.benda.truk': 'Truk Pak Hendra',
  'arena.dashcam.benda.truk-kecil': 'Truk kecil yang berhenti',
  'arena.dashcam.tepat': 'Betul, mobil kecil itu memotong dari lajur 3 ke lajur 2.',
  'arena.dashcam.salah': 'Belum. Putar lagi dan lihat siapa yang pindah lajur lebih dulu.',
  'arena.dashcam.jelas': 'Mobil kecil itu pindah dari lajur 3 ke lajur 2 di depan truk. Truk menghindar ke kiri.',
  'arena.dashcam.diputar': 'Rekaman sedang diputar…',

  // Misi sintetis aktivitas dashcam (format jawaban; tampilannya arena)
  'akt.dashcam.judul': 'Rekaman dashcam',
  'akt.dashcam.produk': 'Asuransi Kendaraan',
  'akt.dashcam.lokasi': 'Jalan tol',
  'akt.dashcam.cerita': 'Rekaman dashcam truk Pak Hendra di jalan tol.',
  'akt.dashcam.instruksi': 'Tonton rekamannya, lalu ketuk kendaraan yang memicu kejadian.',
  'akt.dashcam.labelInteraksi': 'Rekaman',
  'akt.dashcam.tanya': 'Ketuk kendaraan yang memicu kejadian.',
  'akt.dashcam.petunjuk': 'Tonton rekamannya sampai berhenti.',
  'akt.dashcam.item.rekaman': 'Rekaman dashcam',
  'akt.dashcam.wadah.bersih': 'Pemicu ditemukan dari rekaman',
  'akt.dashcam.wadah.ragu': 'Pemicu ditemukan sesudah dijelaskan',
  'akt.dashcam.kirim': 'Lanjut',

  // Akhir singkat (akhirKenalan)
  'kenalan.nyata': 'Ini kasus nyata yang pernah Raksa tangani.',
  'kenalan.suasana': 'Pak Hendra sekarang: {suasana}',
  'kenalan.namaLabel': 'Namamu di kartu (boleh dikosongkan)',
  'kenalan.namaBawaan': 'Tamu',
  'kenalan.kartu': 'Kartu petugasmu. Simpan dengan tangkapan layar.',
  'kenalan.lengkap': 'Main versi lengkap',
  'kenalan.raksa': 'Kenal Raksa lebih jauh',
  'kenalan.tabBaru': '(tab baru)',
};
