/**
 * T-076 Episode 1 Investigator (pilot): HANYA kunci BARU (bahasa Indonesia). Tabel episode = TEKS_AUTO_2_DEV (yang memuat
 * TEKS_AUTO_2: pemeran, lokasi, SIM, dashcam) + kunci ini (lihat ./teks.ts). Semua kunci cerita baru berawalan `inv.` supaya
 * tidak menimpa naskah Episode 1; hanya `judul` / `ringkas` yang ditimpa (kartu daftar episode ini).
 * Aturan penjaga teks (cerita/validasi.ts): kunci & angka sama di id / en / zh; tanpa parameter selain {nama}.
 */
export const TEKS_AUTO_2_INV_ID: Record<string, string> = {
  judul: 'Episode 1 · Investigator',
  ringkas: 'Kamu investigatornya. Catat keterangan saksi, kumpulkan bukti, lalu bantah pernyataan yang keliru. 5 menit, langsung main.',
  'inv.label': 'Kasus 1',
  'inv.kasus.judul': 'Truk di Tol',

  // Bagian (kepala layar)
  'inv.bab.1.judul': 'Keterangan saksi',
  'inv.bab.1.tujuan': 'Dengarkan dua keterangan dan catat pernyataannya.',
  'inv.bab.2.judul': 'Bukti',
  'inv.bab.2.tujuan': 'Kumpulkan tiga kartu bukti.',
  'inv.bab.3.judul': 'Keberatan',
  'inv.bab.3.tujuan': 'Bantah pernyataan yang keliru dengan bukti yang tepat.',
  'inv.bab.4.judul': 'Putusan',
  'inv.bab.4.tujuan': 'Putuskan klaimnya, lalu kabari Pak Hendra.',

  // Pembuka
  'inv.judul.kartu': 'Kasus #1 · Truk di Tol',
  'inv.buka.1': 'Selamat datang, Investigator. Ada kasus yang butuh matamu.',
  'inv.buka.2': 'Truk trailer Pak Hendra menabrak pembatas di jalan tol. Pengemudinya, Pak Darto, bilang ia berjalan di lajur 2.',
  'inv.buka.3': 'Tetapi catatan petugas tol bilang truknya di lajur 3, lajur yang terlarang untuk truk. Kalau itu benar, klaimnya bisa tidak dijamin. Benarkah? Ayo kita buktikan.',

  // Keterangan (pernyataan yang dicatat)
  'inv.darto.1': 'Ruang wawancara. Pak Darto, pengemudi truknya, sudah menunggu.',
  'inv.darto.2': 'Pagi itu saya jalan seperti biasa. Tiba-tiba ada mobil kecil memotong dari kanan.',
  'inv.darto.3': 'Saya di lajur 2. Saya banting setir ke kiri supaya tidak menabraknya.',
  'inv.pernyataan.darto': 'Saya di lajur 2. Mobil kecil tiba-tiba memotong.',
  'inv.tol.1': 'Berikutnya petugas tol yang datang ke lokasi sesudah kejadian.',
  'inv.tol.2': 'Waktu saya tiba, truknya sudah menempel di pembatas. Saya langsung mencatat posisinya.',
  'inv.tol.3': 'Di catatan saya, truknya di lajur 3.',
  'inv.pernyataan.tol': 'Di catatan saya, truknya di lajur 3.',
  'inv.selisih.1': 'Lajur 2 atau lajur 3? Dua keterangan itu tidak mungkin sama-sama benar. Kita butuh bukti.',

  // Bukti
  'inv.kdash.1': 'Truk Pak Hendra punya dashcam. Pak Darto menyerahkan kartu memorinya.',
  'inv.kdash.2': 'Silakan diputar. Semuanya terekam di situ.',
  'inv.bukti.dashcam.1': 'Rekamannya jelas: truk berjalan di lajur 2 sampai mobil kecil memotong di depannya.',
  'inv.bukti.dashcam.judul': 'Rekaman dashcam: truk di lajur 2',
  'inv.bukti.dashcam.sumber': 'Sumber: dashcam truk Pak Hendra',
  'inv.bukti.rambu.1': 'Di rekaman yang sama terlihat rambu di bahu jalan. Kamu memotretnya.',
  'inv.bukti.rambu.judul': 'Rambu: truk dilarang di lajur 3 dan 4',
  'inv.bukti.rambu.sumber': 'Sumber: foto rambu dari rekaman',
  'inv.ksim.1': 'Satu hal lagi: apakah Pak Darto berhak mengemudikan truk itu? Pak Bima, pemeriksa kejadian, membantumu.',
  'inv.sim.1': 'Satu hal lagi: apakah Pak Darto berhak mengemudikan truk itu? Kamu memintanya menunjukkan SIM.',
  'inv.sim.2': 'Ini SIM saya, dan ini STNK truknya. Silakan diperiksa.',
  'inv.bukti.sim.1': 'SIM Pak Darto asli dan golongannya sesuai untuk truk trailer.',
  'inv.bukti.sim.judul': 'SIM B II Umum asli',
  'inv.bukti.sim.sumber': 'Sumber: SIM Pak Darto, diperiksa di meja wawancara',

  // Keberatan
  'inv.keb-buka.1': 'Tiga kartu bukti sudah ada di buku catatanmu. Kamu menemui petugas tol sekali lagi.',
  'inv.keb-buka.2': 'Catatan saya tidak berubah: truknya di lajur 3.',
  'inv.keb-buka.3': 'Pernyataan itu bisa dibantah dengan salah satu buktimu. Tunjukkan yang tepat!',
  'inv.keb.1': 'Pilih satu kartu bukti untuk membantah pernyataan petugas tol.',
  'inv.keb.2': 'Coba lagi. Cari kartu yang menunjukkan posisi truk di jalan.',
  'inv.keb.3': 'Tunjukkan rekaman dashcam kepada petugas tol.',
  'inv.keb.tanya': 'Bukti mana yang membantah "truknya di lajur 3"?',
  'inv.keb.pilih.dashcam': 'Tunjukkan rekaman dashcam',
  'inv.keb.pilih.rambu': 'Tunjukkan foto rambu',
  'inv.keb.pilih.sim': 'Tunjukkan SIM',
  'inv.keb.salah.rambu': 'Rambu itu aturannya: truk dilarang di lajur 3 dan 4. Rambu tidak menunjukkan truknya berjalan di lajur berapa. Coba kartu lain.',
  'inv.keb.salah.sim': 'SIM membuktikan Pak Darto berhak mengemudikan truk itu. SIM tidak menunjukkan truknya di lajur berapa. Coba kartu lain.',
  'inv.keb.pandu.rambu': 'Rambu hanya aturannya, bukan posisi truk. Mari kita lihat bersama.',
  'inv.keb.pandu.sim': 'SIM hanya soal pengemudinya, bukan posisi truk. Mari kita lihat bersama.',
  'inv.keb.cap': 'KEBERATAN! Rekaman dashcam menunjukkan truk di lajur 2, bukan lajur 3.',
  'inv.akui.1': 'Lajur 2? Coba saya lihat... Benar. Waktu saya tiba truknya sudah melintang, jadi saya keliru menghitung lajurnya.',
  'inv.akui.2': 'Oh, saya salah catat lajurnya. Saya perbaiki laporannya.',
  'inv.akui.3': 'Terima kasih. Saya memang di lajur 2.',

  // Putusan
  'inv.putusan.1': 'Kerja bagus, Investigator. Laporan petugas tol sudah diperbaiki.',
  'inv.putusan.2': 'Sekarang putusanmu. Dari bukti yang ada, bagaimana klaim Pak Hendra?',
  'inv.putusan.3': 'Pilih satu putusan.',
  'inv.putusan.tanya': 'Bagaimana klaim ini?',
  'inv.putusan.layak': 'Klaim layak dijamin',
  'inv.putusan.tambahan': 'Butuh bukti tambahan',
  'inv.putusan.polis': 'Ada masalah pertanggungan',
  'inv.putusan.layak.1': 'Tepat. Truk berjalan di lajur yang benar, SIM pengemudinya sah, dan pemicunya mobil yang memotong. Klaim layak dijamin.',
  'inv.putusan.tambahan.1': 'Teliti itu baik, tetapi buktinya sudah cukup: rekaman, rambu, dan SIM saling menguatkan. Menunda tanpa alasan membuat nasabah menunggu. Putusannya: klaim layak dijamin.',
  'inv.putusan.polis.1': 'Belum tepat. Masalah pertanggungan baru ada kalau truk di lajur terlarang, dan rekaman membuktikan truknya di lajur 2. Putusannya: klaim layak dijamin.',

  // Pesan untuk Pak Hendra
  'inv.pesan.1': 'Terakhir, kabari Pak Hendra, pemilik truk. Ia menunggu sejak pagi.',
  'inv.pesan.2': 'Bagaimana hasilnya? Saya dengar ada masalah soal lajur truk saya.',
  'inv.pesan.tanya': 'Pesan mana yang kamu kirim?',
  'inv.pesan.baik': 'Pak Hendra, pemeriksaan selesai. Rekaman dashcam membuktikan truk Bapak di lajur 2, jadi catatan petugas sudah diperbaiki dan klaim Bapak layak dijamin. Berikutnya berkas kami teruskan untuk persetujuan. Saya kabari begitu ada hasilnya.',
  'inv.pesan.datar': 'Klaim layak dijamin. Tunggu proses selanjutnya.',
  'inv.pesan.janji': 'Beres, Pak! Klaim Bapak pasti cair minggu ini, saya jamin.',
  'inv.pesan.baik.alasan': 'Pak Hendra tahu hasilnya, alasannya, dan langkah berikutnya.',
  'inv.pesan.janji.alasan': 'Pak Hendra senang, tetapi tanggal itu belum tentu bisa ditepati.',
  'inv.pesan.baik.1': 'Syukurlah. Terima kasih sudah memeriksa dengan teliti dan menjelaskan langkahnya.',
  'inv.pesan.datar.1': 'Oh... baik. Tapi soal lajur itu bagaimana? Dan saya harus menunggu apa?',
  'inv.pesan.datar.2': 'Pesanmu benar, tetapi Pak Hendra masih bertanya-tanya.',
  'inv.pesan.janji.1': 'Wah, minggu ini? Saya pegang janjinya, ya!',
  'inv.pesan.janji.2': 'Persetujuan belum keluar. Janji tanggal yang belum pasti bisa menjadi masalah baru.',

  // Akhir
  'inv.akhir.tuntas.1': 'Kasus selesai, Investigator. Kamu melindungi nasabah yang jujur dengan bukti, bukan dengan dugaan.',
  'inv.akhir.tinjau.1': 'Kasus selesai. Buktinya kamu temukan sendiri; putusannya kita luruskan bersama.',
  'inv.akhir.tuntas.judul': 'Kasus tuntas',
  'inv.akhir.tuntas.ringkas': 'Catatan lajur diperbaiki dan klaim dinyatakan layak dijamin.',
  'inv.akhir.tinjau.judul': 'Kasus selesai dengan catatan',
  'inv.akhir.tinjau.ringkas': 'Buktinya ditemukan; putusannya diluruskan Miss Raksa.',
  'inv.pelajaran.1': 'Pernyataan dibantah dengan bukti yang menunjukkan hal yang sama, bukan dengan dugaan.',

  // Antarmuka pembungkus Task 1 (teks komponen Task 2 ada di kamus aplikasi `investigasi`)
  'inv.ui.sematJudul': 'Pernyataan penting. Sematkan ke buku catatanmu.',
  'inv.ui.sematTombol': 'Sematkan ke buku catatan',
  'inv.ui.tersematBuku': 'Tersemat di buku catatan',
  'inv.ui.buktiBaru': 'Bukti baru!',
  'inv.ui.simpan': 'Simpan ke buku catatan',
  'inv.ui.lanjut': 'Lanjut',
  'inv.ui.terbaik': 'Skor terbaik di perangkat ini:',
  'inv.ui.tamuBaru': 'Tamu baru',
  'inv.ui.tamuBaruKet': 'Hapus skor dan stempel di perangkat ini, lalu mulai dari awal?',
  'inv.ui.tamuBaruYa': 'Ya, tamu baru',
  'inv.ui.batal': 'Batal',
  // Nama tamu tanpa profil (pages/CeritaMain.tsx, sama dengan Episode 1 Dev)
  'kenalan.namaBawaan': 'Tamu',
};
