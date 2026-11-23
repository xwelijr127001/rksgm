/**
 * T-076 Episode 1 Investigator (pilot): HANYA kunci BARU (bahasa Indonesia). Tabel episode = TEKS_AUTO_2_DEV (yang memuat
 * TEKS_AUTO_2: pemeran, lokasi, SIM, dashcam) + kunci ini (lihat ./teks.ts). Semua kunci cerita baru berawalan `inv.` supaya
 * tidak menimpa naskah Episode 1; hanya `judul` / `ringkas` yang ditimpa (kartu daftar episode ini).
 * Aturan penjaga teks (cerita/validasi.ts): kunci & angka sama di id / en / zh; tanpa parameter selain {nama}.
 */
export const TEKS_AUTO_2_INV_ID: Record<string, string> = {
  judul: 'Investigator · Kasus 1',
  ringkas: 'Kamu investigatornya. Catat keterangan saksi, kumpulkan bukti, lalu bantah pernyataan yang keliru. 5 menit, langsung main.',
  'inv.label': 'Kasus 1',
  'inv.kait': 'Petugas mencatat lajur 3. Benarkah?', // T-094: kalimat kait di hub Raksa Investigator
  // T-099: tautan ke cerita klaim yang sama (layar hasil) dan baris asal di daftar kasus hub
  'inv.cerita.ikuti': 'Ikuti cerita klaim Pak Hendra',
  'inv.cerita.asal': 'Dari cerita Episode 1',
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
  'inv.buka.1': 'Selamat datang, Investigator. Truk Pak Hendra menabrak pembatas tol. Pengemudinya bilang ia di lajur 2; petugas tol mencatat lajur 3, yang terlarang untuk truk.',
  // T-087: tebakan lajur di bingkai pembuka (tidak dinilai) dan kalimat "Tebakan awalmu" sesudah rekaman diputar
  'inv.tebak.1': 'Ini jalan tolnya: empat lajur. Sebelum rekamannya diputar, tebak dulu.', // T-125: gambar netral, tanpa truk
  'inv.tebak.tanya': 'Truk di lajur berapa?',
  'inv.tebak.pilih.1': 'Lajur 1',
  'inv.tebak.pilih.2': 'Lajur 2',
  'inv.tebak.pilih.3': 'Lajur 3',
  'inv.tebak.pilih.4': 'Lajur 4',
  'inv.tebak.balik.1': 'Tebakan awalmu: lajur 1. Tafsiranmu dari rekaman: lajur 2.',
  'inv.tebak.balik.2': 'Tebakan awalmu: lajur 2, sama dengan tafsiranmu dari rekaman.',
  'inv.tebak.balik.3': 'Tebakan awalmu: lajur 3. Tafsiranmu dari rekaman: lajur 2.',
  'inv.tebak.balik.4': 'Tebakan awalmu: lajur 4. Tafsiranmu dari rekaman: lajur 2.',

  // Keterangan (pernyataan yang dicatat)
  'inv.darto.1': 'Ruang wawancara. Pak Darto, pengemudi truknya, sudah menunggu.',
  'inv.darto.2': 'Siang itu saya jalan seperti biasa. Tiba-tiba ada mobil kecil memotong dari kanan.',
  'inv.darto.3': 'Saya di lajur 2. Saya banting setir ke kiri supaya tidak menabraknya.',
  'inv.pernyataan.darto': 'Saya di lajur 2. Mobil kecil tiba-tiba memotong.',
  'inv.tol.1': 'Berikutnya petugas tol yang berjaga di pos dekat lokasi kejadian.',
  'inv.tol.2': 'Saya melihatnya dari pos. Kejadiannya cepat sekali. Beberapa menit kemudian saya menulis catatannya.',
  'inv.tol.3': 'Di catatan saya, truknya di lajur 3.',
  'inv.pernyataan.tol': 'Di catatan saya, truknya di lajur 3.',
  // T-104 "Tanya lebih lanjut" (opsional, tanpa poin). Kunci inv.ui.tekan.* dipakai semua kasus (ikut tabel pembungkus).
  'inv.ui.tekan.1': 'Sebelum lanjut, kamu boleh bertanya satu hal lagi. Tanpa poin, tanpa waktu.',
  'inv.ui.tekan.pilih': 'Mau bertanya lebih lanjut?',
  // T-127 (babak 2): beberapa pertanyaan per kunjungan saksi, pilih SATU; dipakai semua kasus
  'inv.ui.tekan.apa': 'Mau bertanya apa?',
  'inv.ui.tekan.satu': 'Pilih satu pertanyaan. Tanpa poin, tanpa waktu.',
  'inv.ui.tekan.lanjut': 'Lanjut tanpa bertanya',
  'inv.tekan.tol.tanya': 'Tanya: Bapak berdiri di mana waktu melihatnya?',
  'inv.tekan.tol.jawab': 'Di dalam pos, di samping jalan. Dari jendela itu saya melihat kendaraannya dari samping, berjajar.',
  // T-127: teks alt gambar pandangan dari pos (pertanyaan yang berguna) dan pertanyaan kedua (sopan, tidak membuka hal baru)
  'inv.tekan.tol.gambar': 'Pandangan dari jendela pos petugas ke jalan tol, dari samping: sebuah mobil kecil di depan sebuah truk.',
  'inv.tekan.tol.rambu.tanya': 'Tanya: Apa yang dilarang rambu di ruas itu?',
  'inv.tekan.tol.rambu.jawab': 'Truk dan trailer dilarang memakai lajur 3 dan 4. Itu sebabnya saya mencatat lajurnya.', // [konfirmasi PIC]
  'inv.selisih.1': 'Lajur 2 atau lajur 3? Dua keterangan itu tidak mungkin sama-sama benar. Kita butuh bukti.',

  // Bukti
  'inv.kdash.1': 'Truk Pak Hendra punya dashcam. Pak Darto menyerahkan kartu memorinya.',
  'inv.kdash.2': 'Silakan diputar. Semuanya terekam di situ.',
  // T-127: umpan balik aktivitas dashcam (dipakai ulang dari Episode 1 Dev) TANPA nomor lajur: di kasus ini lajurnya ditafsirkan pemain sesudahnya. Hanya tabel episode ini; Episode 1 Dev tidak berubah
  'arena.dashcam.tepat': 'Betul, mobil kecil itu memotong tepat di depan truk.',
  'arena.dashcam.jelas': 'Mobil kecil itu berpindah lajur tepat di depan truk. Truk menghindar ke kiri.',
  'inv.bukti.rekaman.1': 'Rekaman 14:32 masuk ke buku catatanmu. Di rekaman itu juga terlihat rambu di bahu jalan; kamu memotretnya.',
  'inv.bukti.dashcam.judul': 'Rekaman 14:32',
  'inv.bukti.dashcam.sumber': 'Sumber: dashcam truk Pak Hendra',
  'inv.bukti.rambu.judul': 'Foto rambu',
  'inv.bukti.rambu.sumber': 'Sumber: foto rambu dari rekaman',
  'inv.ksim.1': 'Satu hal lagi: apakah Pak Darto berhak mengemudikan truk itu? Pak Bima, pemeriksa kejadian, membantumu.',
  'inv.sim.1': 'Satu hal lagi: apakah Pak Darto berhak mengemudikan truk itu? Kamu memintanya menunjukkan SIM.',
  'inv.sim.2': 'Ini SIM saya, dan ini STNK truknya. Silakan diperiksa.',
  'inv.bukti.sim.1': 'SIM Pak Darto sah untuk truk trailer itu. Catatannya masuk ke buku catatanmu.', // [konfirmasi PIC]
  'inv.bukti.sim.judul': 'SIM dan STNK',
  'inv.bukti.sim.sumber': 'Sumber: SIM Pak Darto dan STNK truk, diperiksa di meja wawancara',
  // T-127 (babak 2) TAFSIR: pemain membaca buktinya sendiri (formatif, tanpa poin). lajur = bingkai 14:32; sim = catatan SIM dan kendaraan
  'inv.baca.1': 'Rekaman berhenti di bingkai 14:32, sesaat sebelum truk membanting setir.',
  'inv.tafsir.lajur.tanya': 'Bingkai 14:32, sebelum truk membanting setir. Kepala truk di lajur berapa?',
  // T-130 (tinjauan Codex): teks alt gambar tafsir = yang TERLIHAT (letak, isian kotak), tanpa kesimpulannya
  'inv.tafsir.lajur.gambar': 'Bingkai rekaman dari atas, jam 14:32. Dari kiri: bahu jalan, lalu empat lajur yang dipisahkan tiga garis putus-putus. Truk berada di antara garis pertama dan garis kedua, dekat garis kedua. Sebuah mobil kecil berada di antara garis kedua dan garis ketiga, sedikit di depan truk.',
  'inv.tafsir.lajur.pilih.2': 'Lajur 2',
  'inv.tafsir.lajur.pilih.3': 'Lajur 3',
  'inv.tafsir.lajur.pilih.kabur': 'Tidak jelas',
  'inv.tafsir.lajur.salah.3': 'Lajur dihitung dari kiri, mulai sesudah bahu jalan. Hitung garis putus-putusnya, lalu lihat lagi kepala truknya.',
  'inv.tafsir.lajur.salah.kabur': 'Berhati-hati itu baik. Tapi garis lajurnya terlihat di bingkai ini: hitung dari kiri, lalu cari kepala truknya.',
  'inv.tafsir.lajur.alasan': 'Dari kiri: bahu jalan, lajur 1, lalu lajur 2. Kepala truk ada di lajur 2, dekat garis ke lajur 3. Yang di lajur 3 itu mobil kecil.',
  // T-139 (pemilik: salah = peringatan sampai benar): kunci `*.lagi*` dan `*.4` = kalimat sesudah kekeliruan KEDUA dst. (penunjuk yang
  // lebih kuat, tanpa jawabannya). Kunci lama `*.pandu.*` dan `*.3` tidak dipakai graf lagi; tetap di sini untuk riwayat simpanan lama.
  'inv.tafsir.lajur.lagi': 'Mulai dari bahu jalan di kiri: tiap garis putus-putus menutup satu lajur. Berapa garis sebelum kepala truk?',
  'inv.tafsir.lajur.benar': 'Kepala truk di lajur 2, dihitung dari kiri. Mobil kecil di lajur 3.',
  'inv.tafsir.lajur.temuan': 'Rekaman 14:32: kepala truk di lajur 2, mobil kecil di lajur 3.',
  'inv.tafsir.lajur.ringkas': 'truk di lajur 2',
  'inv.tafsir.sim.tanya': 'Catatan SIM dan catatan kendaraan. Apa yang kamu catat?',
  'inv.tafsir.sim.gambar': 'Dua catatan berdampingan. Catatan SIM: foto pengemudi, kotak golongan bertuliskan B II UMUM, dan gambar kalender dengan tahun 2029. Catatan kendaraan: gambar truk dengan trailer dan kotak golongan bertuliskan B II UMUM.', // [konfirmasi PIC] golongan SIM dan masa berlaku yang tertulis di gambar
  'inv.tafsir.sim.pilih.cocok': 'Golongan cocok',
  'inv.tafsir.sim.pilih.beda': 'Golongan beda',
  'inv.tafsir.sim.pilih.tanggal': 'Tahun tak terbaca',
  'inv.tafsir.sim.salah.beda': 'Lihat kotak golongan di kedua catatan. Bandingkan tulisannya satu per satu.',
  'inv.tafsir.sim.salah.tanggal': 'Tahunnya tertulis di samping gambar kalender: 2029. Sekarang bandingkan kotak golongan di kedua catatan.', // [konfirmasi PIC]
  'inv.tafsir.sim.alasan': 'Kedua kotak golongan bertuliskan B II Umum: cocok. SIM itu berlaku sampai 2029.', // [konfirmasi PIC]
  'inv.tafsir.sim.lagi': 'Tutup foto dan kalendernya dengan jarimu. Baca hanya dua kotak golongan, huruf demi huruf.',
  'inv.tafsir.sim.benar': 'Golongan di SIM, B II Umum, sama dengan yang diwajibkan untuk truk trailer ini. Berlaku sampai 2029.', // [konfirmasi PIC]
  'inv.tafsir.sim.temuan': 'SIM Pak Darto: golongan B II Umum, sama dengan yang diwajibkan untuk truk trailer; berlaku sampai 2029.', // [konfirmasi PIC]
  'inv.tafsir.sim.ringkas': 'golongan cocok',

  // Keberatan
  'inv.keb-buka.1': 'Tiga kartu bukti sudah ada di buku catatanmu. Kamu menemui petugas tol sekali lagi.',
  'inv.keb-buka.2': 'Catatan saya tidak berubah: truknya di lajur 3.',
  'inv.keb-buka.3': 'Pernyataan itu bisa dibantah dengan salah satu buktimu. Tunjukkan yang tepat!',
  'inv.keb.1': 'Pilih dua catatan yang tidak cocok: satu keterangan dan satu bukti.',
  'inv.keb.2': 'Coba lagi. Cari kartu yang menunjukkan posisi truk di jalan.',
  'inv.keb.3': 'Tunjukkan rekaman dashcam kepada petugas tol.',
  'inv.keb.4': 'Coba sekali lagi. Pilih kartu yang belum kamu coba.',
  'inv.keb.tanya': 'Bukti mana yang membantah "truknya di lajur 3"?',
  // T-127 (babak 2) TEMUAN BERPASANGAN di percobaan pertama KEBERATAN: satu keterangan + satu bukti
  'inv.pasang.tanya': 'Catatan mana yang tidak cocok?',
  'inv.pasang.ket': 'Pilih satu keterangan dan satu bukti.',
  'inv.pasang.salah.darto': 'Keterangan Pak Darto tidak berbeda dari bukti di bukumu. Cari keterangan yang berbeda dari buktimu.',
  'inv.pasang.alasan': 'Petugas tol mencatat lajur 3, dan catatan itulah yang membuat klaim ini dipersoalkan. Keterangan itu yang perlu diuji dengan buktimu.',
  'inv.pasang.temuan': 'Catatan petugas tol (lajur 3) tidak cocok dengan rekaman 14:32 (lajur 2).',
  'inv.keb.pilih.dashcam': 'Tunjukkan rekaman dashcam',
  'inv.keb.pilih.rambu': 'Tunjukkan foto rambu',
  'inv.keb.pilih.sim': 'Tunjukkan SIM',
  'inv.keb.salah.rambu': 'Rambu itu aturannya: truk dilarang di lajur 3 dan 4. Rambu tidak menunjukkan truknya berjalan di lajur berapa. Coba kartu lain.',
  'inv.keb.salah.sim': 'SIM membuktikan Pak Darto berhak mengemudikan truk itu. SIM tidak menunjukkan truknya di lajur berapa. Coba kartu lain.',
  'inv.keb.pandu.rambu': 'Rambu hanya aturannya, bukan posisi truk. Mari kita lihat bersama.',
  'inv.keb.pandu.sim': 'SIM hanya soal pengemudinya, bukan posisi truk. Mari kita lihat bersama.',
  'inv.keb.lagi.rambu': 'Rambu hanya aturannya, bukan posisi truk. Coba lagi: cari kartu yang memperlihatkan truknya sendiri di jalan.',
  'inv.keb.lagi.sim': 'SIM hanya soal pengemudinya, bukan posisi truk. Coba lagi: cari kartu yang memperlihatkan truknya sendiri di jalan.',
  'inv.keb.cap': 'KEBERATAN! Rekaman dashcam menunjukkan truk di lajur 2, bukan lajur 3.',
  'inv.akui.1': 'Tapi saya ingat betul: waktu itu ada kendaraan di lajur 3.',
  // T-127: baris ini hanya tampil bila pemain tadi menanyakan tempat petugas berdiri (tanda jeli)
  'inv.akui.pos': 'Kamu ingat jawabannya tadi: dari pos, ia melihat kendaraannya dari samping.',
  'inv.akui.2': 'Oh... yang di lajur 3 itu mobil kecilnya. Kepala truknya di lajur 2.',
  'inv.akui.4': 'Dari pos, mobil itu menutupi kepala truknya. Saya salah catat lajurnya. Saya perbaiki laporannya.',
  'inv.akui.3': 'Terima kasih. Saya memang di lajur 2.',
  'inv.koreksi.1': 'Petugas tol membuka buku catatannya dan memperbaiki laporannya.',

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
  'inv.pesan.baik': 'Catatan lajur sudah diperbaiki, Pak: truk Bapak di lajur 2. Berkasnya kami teruskan untuk persetujuan. Saya kabari begitu ada keputusan.', // [konfirmasi PIC]
  'inv.pesan.datar': 'Hasil pemeriksaan: klaim layak dijamin. Berkas akan diproses sesuai prosedur yang berlaku. Mohon ditunggu.', // [konfirmasi PIC]
  'inv.pesan.janji': 'Kabar baik, Pak Hendra! Semua bukti berpihak kepada Bapak, jadi tidak ada lagi yang perlu dikhawatirkan. Klaim Bapak pasti cair minggu ini, saya sendiri yang menjamin. Bapak boleh langsung mengabari bengkel.', // [konfirmasi PIC]
  'inv.pesan.baik.alasan': 'Pak Hendra tahu hasilnya, alasannya, dan langkah berikutnya.',
  'inv.pesan.janji.alasan': 'Pak Hendra senang, tetapi tanggal itu belum tentu bisa ditepati.',
  'inv.pesan.baik.1': 'Syukurlah. Terima kasih sudah memeriksa dengan teliti dan menjelaskan langkahnya.',
  'inv.pesan.datar.1': 'Oh... baik. Tapi soal lajur itu bagaimana? Dan saya harus menunggu apa?',
  'inv.pesan.datar.2': 'Pesanmu benar, tetapi tidak menyebut soal lajur dan tidak memberi tahu apa yang ditunggu.',
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
  'inv.ui.tamuBaru': 'Tamu baru',
  'inv.ui.tamuBaruKet': 'Hapus skor dan stempel di perangkat ini, lalu mulai dari awal?',
  'inv.ui.tamuBaruYa': 'Ya, tamu baru',
  'inv.ui.batal': 'Batal',
  // T-087: hasil (kalimat Pak Hendra menurut pesan yang dikirim), main lagi / latihan, gerbang lanjut-atau-mulai-baru
  'inv.balas.baik': 'Terima kasih, Investigator. Saya tahu hasilnya, alasannya, dan apa yang terjadi berikutnya. Saya bisa menunggu dengan tenang.',
  'inv.balas.datar': 'Klaimnya layak, itu melegakan. Tapi saya masih belum tahu harus menunggu apa.',
  'inv.balas.janji': 'Minggu ini cair, kan? Saya sudah bilang ke bengkel. Semoga janjinya benar-benar ditepati.',
  'inv.hasil.lihat': 'Lihat hasil investigasi',
  'inv.hasil.selesai': 'Selesai',
  'inv.hasil.rekor': 'Rekor baru!',
  // T-090: total semua kasus ("Total 185 / 200"), jarak ke pangkat Senior, arsip kasus (dipakai semua kasus)
  'inv.hasil.total': 'Total',
  'inv.hasil.menuju': '1 kasus lagi menuju Senior',
  'inv.hasil.arsip': 'Arsip kasus',
  'inv.hasil.arsipKet': 'Garis waktu dan pesanmu',
  'inv.hasil.tutup': 'Tutup',
  'inv.hasil.terbaik': 'Terbaik',
  'inv.lagi.lemah': 'Coba lagi pilihan terlemahmu',
  'inv.lagi.lemahKet': 'Latihan saja: skor terbaik kasus tidak berubah.',
  'inv.lagi.langkah.keberatan': 'Bukti untuk keberatan',
  'inv.lagi.langkah.putusan': 'Putusan klaim',
  'inv.lagi.langkah.pesan': 'Pesan untuk Pak Hendra',
  'inv.lagi.awal': 'Ulang dari awal',
  'inv.lagi.awalKet': 'Seluruh kasus dari kartu judul. Skor terbaik dan stempel tetap tersimpan.',
  'inv.lagi.sempurna': 'Skor sempurna! Inilah laporan petugas tol yang dikoreksi berkat buktimu.',
  'inv.latihan.label': 'Latihan',
  'inv.latihan.hasil': 'Hasil latihan',
  'inv.latihan.tadi': 'Tadi',
  'inv.latihan.kini': 'Latihan ini',
  'inv.latihan.naik': 'Lebih baik dari tadi! Skor terbaik kasus tetap dari permainan penuh.',
  'inv.latihan.sama': 'Skor terbaik kasus tetap dari permainan penuh. Ulang dari awal untuk mencatat rekor.',
  'inv.latihan.kirim': 'Kirim pesan',
  'inv.latihan.kembali': 'Kembali ke hasil',
  'inv.latihan.cobaLagi': 'Coba sekali lagi',
  'inv.gerbang.judul': 'Kasus ini belum selesai',
  'inv.gerbang.ket': 'Ada penyelidikan yang tersimpan di perangkat ini.',
  'inv.gerbang.lanjut': 'Lanjutkan kasus',
  'inv.gerbang.baru': 'Mulai baru',
  'inv.gerbang.tanya': 'Mulai baru menghapus kemajuan kasus ini serta skor dan stempel Investigator di perangkat ini. Lanjut?',
  'inv.gerbang.ya': 'Ya, mulai baru',
  // Nama tamu tanpa profil (pages/CeritaMain.tsx, sama dengan Episode 1 Dev)
  'kenalan.namaBawaan': 'Tamu',
};
