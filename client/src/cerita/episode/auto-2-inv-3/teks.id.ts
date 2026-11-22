/**
 * T-104 Investigator KASUS 3 "Dua Baris di Bengkel" (sampai T-125: "Satu Baris Terlalu Banyak"): HANYA kunci BARU (bahasa Indonesia). Tabel episode = TEKS_AUTO_2
 * + teks antarmuka pembungkus kasus 1 (`inv.ui.*`, `inv.hasil.*`, `inv.lagi.*`, `inv.latihan.*`, `inv.gerbang.*`) + kunci ini
 * (lihat ./teks.ts). Naskah kasus ini berawalan `inv3.` (KonfigInvestigasi.awalan).
 * Aturan penjaga teks (cerita/validasi.ts): kunci & angka sama di id / en / zh; tanpa parameter selain {nama}.
 *
 * [konfirmasi PIC]: setiap baris bertanda ini memuat nama / wewenang panel, persetujuan memperlihatkan bukti, penanganan
 * baris yang tidak diperdebatkan (bumper), jalur pemeriksaan, atau hak menambahkan keterangan, dan HARUS dikonfirmasi PIC klaim
 * sebelum dipakai di depan tamu (spec 2026-11-21). Panel ini simulasi telaah bukti: tanpa putusan mengikat, tanpa pembayaran
 * atau penolakan otomatis, tanpa penetapan pidana, tanpa tuduhan terbuka. Semua nama, bengkel, dan tanggal di kasus ini fiktif
 * ("tanggal 3 / 14 / 15" hanya urutan hari); tidak ada nama merek.
 */
export const TEKS_AUTO_2_INV_3_ID: Record<string, string> = {
  judul: 'Investigator · Kasus 3',
  ringkas: 'Satu perkiraan biaya, dua baris: bumper dan spion. Tunjukkan buktinya satu per satu, dengarkan penjelasannya, lalu tentukan langkah berikutnya. 5 menit.',
  'inv.label': 'Kasus 3',
  'inv3.kait': 'Dua baris di perkiraan biaya. Satu kejadian?',
  'inv3.kasus.judul': 'Dua Baris di Bengkel', // T-125: judul netral (judul lama "Satu Baris Terlalu Banyak" menjawab pertanyaan pembuka)
  'pemeran.pemohon.nama': 'Pak Gilang',
  'pemeran.pemohon.peran': 'Pemohon klaim · pemilik mobil',
  'pemeran.penaksir.nama': 'Pak Seno',
  'pemeran.penaksir.peran': 'Penaksir biaya bengkel',
  'pemeran.ketua.nama': 'Pak Arya',
  'pemeran.ketua.peran': 'Penelaah klaim · ketua panel', // [konfirmasi PIC] nama jabatan

  // Bagian (kepala layar)
  'inv3.bab.1.judul': 'Berkas',
  'inv3.bab.1.tujuan': 'Baca kartu kejadian, lalu catat dua keterangan.',
  'inv3.bab.2.judul': 'Bukti',
  'inv3.bab.2.tujuan': 'Periksa foto sebelum kejadian dan kutipan pesan pengajuan.',
  'inv3.bab.3.judul': 'Panel',
  'inv3.bab.3.tujuan': 'Tunjukkan bukti yang menjawab tiap keterangan, satu per satu.',
  'inv3.bab.4.judul': 'Tindak lanjut',
  'inv3.bab.4.tujuan': 'Simpulkan temuannya, lalu jelaskan langkah berikutnya dengan hormat.',

  // Pembuka: kartu kejadian langsung masuk buku, lalu tebakan yang tidak dinilai
  'inv3.judul.kartu': 'Kasus #3 · Dua Baris di Bengkel',
  'inv3.buka.1': 'Kasus baru, Investigator. Tanggal 14, mobil Pak Gilang tertabrak di area parkir. Perkiraan biaya bengkelnya berisi dua baris: bumper dan spion. Mulai dari kartu kejadiannya.',
  'inv3.bukti.kejadian.1': 'Kartu kejadian tanggal 14: sebuah mobil mundur dan mengenai bumper. Petugas parkir menguatkan benturan itu. Di kolom kerusakan tertulis: bumper penyok, spion retak.',
  'inv3.bukti.kejadian.judul': 'Kartu kejadian: benturan bumper di area parkir',
  'inv3.bukti.kejadian.sumber': 'Sumber: laporan kejadian tanggal 14, dikuatkan petugas parkir',
  'inv3.tebak.1': 'Tidak ada benar atau salah. Tebakanmu kita cek lagi sesudah buktinya terkumpul.',
  'inv3.tebak.tanya': 'Apakah kedua bagian rusak pada kejadian yang sama?',
  'inv3.tebak.pilih.sama': 'Ya, kejadian yang sama',
  'inv3.tebak.pilih.beda': 'Tidak, beda kejadian',
  'inv3.tebak.pilih.belum': 'Belum tahu',
  'inv3.tebak.balik.sama': 'Tebakan awalmu: kejadian yang sama. Foto tanggal 3 menunjukkan retak spion sudah ada. Tidak apa-apa: sekarang kamu punya buktinya.',
  'inv3.tebak.balik.beda': 'Tebakan awalmu: beda kejadian. Sekarang ada foto tanggal 3, jadi itu bukan lagi dugaan.',
  'inv3.tebak.balik.belum': 'Tebakan awalmu: belum tahu. Sikap yang baik. Sekarang foto tanggal 3 yang menjawab.',

  // Keterangan (pernyataan yang dicatat)
  'inv3.pemohon.1': 'Ruang wawancara. Pak Gilang, pemilik mobil, membawa perkiraan biaya dari bengkel.',
  'inv3.pemohon.2': 'Mobil saya sedang terparkir. Ada mobil mundur dan menabrak bumper saya.',
  'inv3.pemohon.3': 'Bumper dan spion itu rusak malam itu juga.',
  'inv3.pernyataan.pemohon': 'Bumper dan spion itu rusak malam itu juga.',
  'inv3.penaksir.1': 'Berikutnya Pak Seno, penaksir biaya di bengkel yang memeriksa mobil itu.',
  'inv3.penaksir.2': 'Mobilnya masuk sehari sesudah kejadian. Saya periksa, lalu saya susun perkiraannya.',
  'inv3.penaksir.3': 'Saya hanya menulis perkiraan biaya.',
  'inv3.pernyataan.penaksir': 'Saya hanya menulis perkiraan biaya.',
  'inv3.bukti.penawaran.1': 'Perkiraan biaya bengkel: dua baris, bumper dan spion, masing-masing dengan harganya. Tidak tertulis kapan tiap kerusakan terjadi.',
  'inv3.bukti.penawaran.judul': 'Perkiraan biaya: dua baris, bumper dan spion',
  'inv3.bukti.penawaran.sumber': 'Sumber: bengkel, disusun Pak Seno',
  'inv3.selisih.1': 'Benturan bumpernya dikuatkan petugas parkir. Spionnya belum. Kita tidak menduga dan tidak menuduh: kita cari catatan yang bertanggal.',

  // Bukti 1: foto pemeriksaan sebelum kejadian
  'inv3.foto.1': 'Kamu bertanya baik-baik: apakah bengkel punya catatan mobil ini dari sebelum kejadian?',
  'inv3.foto.2': 'Ada. Mobil ini pernah servis berkala di sini. Ini foto pemeriksaannya.',
  'inv3.bukti.foto.1': 'Foto pemeriksaan kendaraan tanggal 3: nomor rangkanya sama dengan mobil Pak Gilang, dan retak bercabang di sudut kaca spion sudah terlihat.',
  'inv3.bukti.foto.judul': 'Foto pemeriksaan tanggal 3: retak spion sudah ada',
  'inv3.bukti.foto.sumber': 'Sumber: lembar servis berkala bengkel, nomor rangka sama',
  'inv3.tekan.penaksir.tanya': 'Tanya: Kapan foto pemeriksaan ini diambil?',
  'inv3.tekan.penaksir.jawab': 'Tanggal 3, waktu servis berkala. Tanggal dan nomor rangkanya tercetak otomatis di lembar pemeriksaan.',

  // Bukti 2: kutipan pesan pengajuan, diperlihatkan dengan persetujuan pemohon
  'inv3.kutipan.1': 'Di berkas bengkel ada pesan pengajuan dari Pak Gilang. Kamu meminta izinnya dulu sebelum membacanya.', // [konfirmasi PIC] persetujuan memperlihatkan bukti
  'inv3.kutipan.2': 'Silakan. Kutipan itu boleh diperlihatkan.', // [konfirmasi PIC]
  'inv3.bukti.pesan.1': 'Kutipan pesan Pak Gilang kepada bengkel, tanggal 15: “Retak spion itu sudah lama. Tolong masukkan saja sebagai kerusakan kejadian ini.”',
  'inv3.bukti.pesan.judul': 'Kutipan pesan tanggal 15: retak lama diminta masuk',
  'inv3.bukti.pesan.sumber': 'Sumber: pesan Pak Gilang kepada bengkel, diperlihatkan dengan persetujuannya', // [konfirmasi PIC]
  'inv3.tekan.pemohon.tanya': 'Tanya: Siapa yang menyetujui kutipan pesan ini?',
  'inv3.tekan.pemohon.jawab': 'Saya sendiri. Pesan itu dari nomor saya, dan saya mengizinkan kutipannya dipakai untuk telaah ini.', // [konfirmasi PIC]

  // Panel telaah (simulasi telaah bukti; bukan sidang)
  'inv3.panel-buka.1': 'Panel telaah klaim. Pak Arya memimpin; Pak Seno dan Pak Gilang hadir, dan keduanya boleh menjelaskan.', // [konfirmasi PIC] nama panel
  'inv3.panel-buka.2': 'Panel ini menelaah bukti di berkas. Panel tidak menjatuhkan putusan akhir dan tidak menuduh siapa pun. Setiap pihak boleh mengoreksi keterangannya.', // [konfirmasi PIC] wewenang panel
  'inv3.panel-buka.3': 'Berkasnya berisi dua baris: bumper dan spion. Saya hanya menulis perkiraan biaya.',
  'inv3.panel-buka.4': 'Kita mulai dari keterangan Pak Gilang: bumper dan spion rusak malam itu juga.',
  'inv3.panel.pilih.kartu-kejadian': 'Tunjukkan kartu kejadian',
  'inv3.panel.pilih.foto-inspeksi': 'Tunjukkan foto pemeriksaan',
  'inv3.panel.pilih.pesan-pengajuan': 'Tunjukkan kutipan pesan',
  'inv3.panel.pilih.penawaran': 'Tunjukkan perkiraan biaya',

  // Babak 1 'kronologi': "spion rusak malam itu juga" dijawab foto bertanggal
  'inv3.panel.kronologi.nama': 'Babak 1 · kapan retaknya ada',
  'inv3.panel.kronologi.1': 'Pilih satu bukti untuk ditunjukkan kepada panel.',
  'inv3.panel.kronologi.2': 'Coba lagi. Cari bukti yang bertanggal sebelum kejadian.',
  'inv3.panel.kronologi.3': 'Tunjukkan foto pemeriksaan tanggal 3 kepada panel.',
  'inv3.panel.kronologi.tanya': 'Bukti mana yang menunjukkan kapan retak spion itu sudah ada?',
  'inv3.panel.kronologi.petunjuk1': 'Belum tepat. Bukti mana yang tanggalnya sebelum kejadian tanggal 14?',
  'inv3.panel.kronologi.petunjuk2': 'Kejadian parkir tanggal 14. Foto pemeriksaan tanggal 3 sudah menunjukkan retak spion. Pakai foto itu.',
  'inv3.panel.kronologi.salah.kartu-kejadian': 'Kartu kejadian mencatat apa yang dilaporkan, bukan kapan retak spion itu mulai ada.',
  'inv3.panel.kronologi.salah.penawaran': 'Perkiraan biaya hanya menunjukkan harga, bukan kapan kerusakannya terjadi.',
  'inv3.panel.kronologi.pandu.kartu-kejadian': 'Kartu itu hanya laporannya. Mari kita lihat bersama bukti yang bertanggal sebelum kejadian.',
  'inv3.panel.kronologi.pandu.penawaran': 'Perkiraan itu hanya soal harga. Mari kita lihat bersama bukti yang bertanggal sebelum kejadian.',
  'inv3.panel.kronologi.koreksi': 'Keterangan dikoreksi: retak spion sudah ada sebelum kejadian',
  'inv3.kronologi.jawab.1': 'Foto pemeriksaan tanggal 3 menunjukkan retak spion sudah ada, sebelas hari sebelum kejadian parkir tanggal 14.',
  'inv3.kronologi.jawab.2': 'Pak Gilang, silakan menanggapi.', // [konfirmasi PIC] hak menanggapi
  'inv3.kronologi.jawab.3': 'Benar. Retak itu sudah ada sebelum kejadian parkir. Keterangan saya tadi keliru.',
  'inv3.kronologi.koreksi.1': 'Pak Gilang mengoreksi keterangannya. Kamu memperbaruinya di buku catatanmu.',
  'inv3.koreksi.judul': 'Keterangan diperbarui',
  'inv3.koreksi.ket': 'Pak Gilang sendiri yang meluruskan keterangannya di depan panel. Tidak ada yang dituduh.',

  // Keterangan kedua (niat masih terbuka sesudah babak 1)
  'inv3.kira.1': 'Lalu mengapa retak lama itu ada di perkiraan biaya kejadian ini?',
  'inv3.kira.2': 'Saya kira kedua perbaikan memang harus ditulis sebagai kerusakan baru.',
  'inv3.pernyataan.pemohon-panel': 'Saya kira kedua perbaikan memang harus ditulis sebagai kerusakan baru.',

  // Babak 2 'pengajuan': "saya kira harus ditulis baru" dijawab permintaan di kutipan pesan
  'inv3.panel.pengajuan.nama': 'Babak 2 · apa yang diminta',
  'inv3.panel.pengajuan.1': 'Pilih satu bukti untuk ditunjukkan kepada panel.',
  'inv3.panel.pengajuan.2': 'Coba lagi. Cari bukti yang memuat kata-kata Pak Gilang sendiri.',
  'inv3.panel.pengajuan.3': 'Tunjukkan kutipan pesan tanggal 15 kepada panel.',
  'inv3.panel.pengajuan.tanya': 'Bukti mana yang menunjukkan apa yang diminta Pak Gilang kepada bengkel?',
  'inv3.panel.pengajuan.petunjuk1': 'Belum tepat. Bukti mana yang memuat kata-kata Pak Gilang sendiri?',
  'inv3.panel.pengajuan.petunjuk2': 'Di kutipan pesan tanggal 15, Pak Gilang menulis bahwa retaknya sudah lama dan meminta itu dimasukkan. Pakai kutipan itu.',
  'inv3.panel.pengajuan.salah.penawaran': 'Perkiraan biaya menunjukkan dua baris dan harganya, bukan apa yang diminta Pak Gilang.',
  'inv3.panel.pengajuan.salah.foto-inspeksi': 'Foto itu menunjukkan kapan retaknya sudah ada, bukan apa yang diminta untuk ditulis.',
  'inv3.panel.pengajuan.pandu.penawaran': 'Perkiraan itu hanya daftar dan harga. Mari kita lihat bersama kata-kata Pak Gilang sendiri.',
  'inv3.panel.pengajuan.pandu.foto-inspeksi': 'Foto itu sudah menjawab soal waktu. Mari kita lihat bersama kata-kata Pak Gilang sendiri.',
  'inv3.panel.pengajuan.koreksi': 'Keterangan dikoreksi: retak lama diminta masuk sebagai kerusakan kejadian ini',
  'inv3.pengajuan.jawab.1': 'Di kutipan pesan tanggal 15, Pak Gilang menulis bahwa retak spion itu sudah lama dan meminta agar dimasukkan sebagai kerusakan kejadian ini.',
  'inv3.pengajuan.jawab.2': 'Pak Gilang, Pak Seno, silakan menanggapi.', // [konfirmasi PIC] hak menanggapi
  'inv3.pengajuan.jawab.3': 'Ya, itu pesan saya. Saya tahu retaknya sudah lama, dan saya yang meminta itu dimasukkan. Saya ingin memperbaikinya sekalian.',
  'inv3.pengajuan.jawab.4': 'Saya menulisnya sesuai permintaan. Seharusnya baris itu saya tandai.',
  'inv3.pengajuan.jawab.5': 'Terima kasih sudah menjelaskan. Keterangan Bapak berdua kami catat apa adanya.', // [konfirmasi PIC]
  'inv3.pengajuan.koreksi.1': 'Pak Gilang mengoreksi keterangannya sekali lagi. Kamu memperbaruinya di buku catatanmu.',

  // Kesimpulan (tabel kasus ini: teruskan untuk pemeriksaan 30, minta klarifikasi saja 15, nyatakan seluruh klaim curang 0)
  'inv3.putusan.1': 'Kedua pihak sudah menjelaskan dan mengoreksi keterangannya.', // [konfirmasi PIC]
  'inv3.putusan.2': 'Investigator, apa yang bisa kita simpulkan dari bukti ini?',
  'inv3.putusan.3': 'Pilih satu kesimpulan.',
  'inv3.putusan.tanya': 'Apa yang bisa kita simpulkan dari bukti ini?',
  'inv3.putusan.tambahan': 'Teruskan untuk pemeriksaan', // [konfirmasi PIC] nama tindakan
  'inv3.putusan.layak': 'Minta klarifikasi saja', // [konfirmasi PIC]
  'inv3.putusan.polis': 'Nyatakan seluruh klaim curang', // [konfirmasi PIC]
  'inv3.putusan.ket': 'Foto dan kutipan pesan sudah di buku catatanmu. Pilih satu kesimpulan.',
  'inv3.putusan.tambahan.sebab': 'Baris spion diteruskan kepada tim yang berwenang memeriksa. Kerusakan bumper dicatat terpisah.', // [konfirmasi PIC] jalur pemeriksaan + penanganan bumper
  'inv3.putusan.layak.sebab': 'Cukup minta penjelasan sekali lagi, tanpa mencatat atau meneruskan selisih yang sudah terbukti.', // [konfirmasi PIC]
  'inv3.putusan.polis.sebab': 'Baris spion bermasalah, jadi seluruh klaim dinyatakan curang.', // [konfirmasi PIC]
  'inv3.putusan.tambahan.1': 'Tepat. Di berkas ini, foto dan pesan itu mendukung temuan bahwa baris spion sengaja ditambahkan. Temuan itu kita teruskan kepada tim yang berwenang, dan kerusakan bumper yang terbukti dicatat terpisah. Kita tidak memutuskan bayar, tolak, atau salah di sini.', // [konfirmasi PIC] temuan, wewenang, penanganan bumper
  'inv3.putusan.layak.1': 'Bertanya itu baik, tetapi keduanya sudah menjelaskan di panel. Selisih yang sudah terbukti perlu dicatat dan diteruskan kepada tim yang berwenang; kerusakan bumper dicatat terpisah.', // [konfirmasi PIC]
  'inv3.putusan.polis.1': 'Belum tepat. Yang terbukti hanya soal baris spion; benturan bumpernya dikuatkan petugas parkir. Kita tidak menyatakan seseorang curang: temuan itu diteruskan kepada tim yang berwenang, dan bumper dicatat terpisah.', // [konfirmasi PIC]

  // Pesan untuk Pak Gilang (30: hormat + temuan dan alasan + langkah berikutnya + hak menambahkan keterangan; 15: isi benar saja; 0: janji tanpa dasar)
  'inv3.pesan.1': 'Terakhir, kabari Pak Gilang. Sampaikan temuannya, alasannya, dan langkah berikutnya dengan hormat.',
  'inv3.pesan.2': 'Jadi bagaimana kelanjutan klaim saya?',
  'inv3.pesan.tanya': 'Pesan mana yang kamu kirim?',
  'inv3.pesan.baik': 'Terima kasih sudah menjelaskan, Pak Gilang. Saya akan mencatat kerusakan bumper dan meminta tim berwenang menelaah bagian spion, karena foto tanggal 3 dan pesan Bapak menunjukkan retaknya sudah lama. Bapak bisa menambahkan keterangan.', // [konfirmasi PIC] langkah berikutnya + hak menambahkan keterangan
  'inv3.pesan.datar': 'Bagian spion kami teruskan untuk diperiksa karena retaknya sudah ada sebelum kejadian. Bumper dicatat terpisah.', // [konfirmasi PIC]
  'inv3.pesan.janji': 'Tenang Pak, bumper dan spionnya saya usahakan tetap diganti semuanya.',
  'inv3.pesan.baik.alasan': 'Pak Gilang tahu temuannya, alasannya, dan bahwa ia boleh menambahkan keterangan.', // [konfirmasi PIC]
  'inv3.pesan.janji.alasan': 'Pak Gilang lega sekarang, tetapi janji itu tidak punya dasar.',
  'inv3.pesan.baik.1': 'Saya mengerti. Terima kasih sudah menjelaskannya baik-baik. Saya akan menambahkan keterangan saya.',
  'inv3.pesan.datar.1': 'Begitu... Lalu apa yang bisa saya lakukan sekarang?',
  'inv3.pesan.datar.2': 'Isinya benar, tetapi Pak Gilang tidak tahu ia boleh menambahkan keterangan.', // [konfirmasi PIC]
  'inv3.pesan.janji.1': 'Wah, syukurlah! Jadi dua-duanya diganti, ya.',
  'inv3.pesan.janji.2': 'Temuannya tidak berubah. Janji tanpa dasar akan mengecewakan Pak Gilang dua kali.',

  // Akhir
  'inv3.akhir.tuntas.1': 'Kasus selesai, Investigator. Kamu menunjukkan buktinya satu per satu, memberi kesempatan menjelaskan, lalu meneruskan temuannya ke tempat yang tepat.',
  'inv3.akhir.tinjau.1': 'Kasus selesai. Buktinya kamu temukan sendiri; langkah berikutnya kita luruskan bersama.',
  'inv3.akhir.tuntas.judul': 'Kasus tuntas',
  'inv3.akhir.tuntas.ringkas': 'Baris spion diteruskan untuk pemeriksaan, bumper dicatat terpisah, dan Pak Gilang mendapat penjelasannya.', // [konfirmasi PIC]
  'inv3.akhir.tinjau.judul': 'Kasus selesai dengan catatan',
  'inv3.akhir.tinjau.ringkas': 'Buktinya ditemukan; langkah berikutnya diluruskan Miss Raksa.',
  'inv3.pelajaran.1': 'Bukti dulu, baru kesimpulan. Beri kesempatan menjelaskan, lalu teruskan temuan kepada pihak yang berwenang.', // [konfirmasi PIC] rumusan pelajaran

  // Layar hasil: kalimat Pak Gilang menurut pesan yang dikirim, arsip (berkas yang sudah dikoreksi)
  'inv3.balas.baik': 'Terima kasih sudah menjelaskan dengan baik, Investigator. Saya tahu apa yang diperiksa, dan saya akan menambahkan keterangan saya.', // [konfirmasi PIC]
  'inv3.balas.datar': 'Alasannya saya mengerti. Tapi saya masih tidak tahu apa yang bisa saya lakukan.',
  'inv3.balas.janji': 'Dua-duanya diganti, kan? Saya sudah bilang ke bengkel. Semoga benar begitu.',
  'inv3.arsip.judul': 'Berkas yang sudah dikoreksi',
  'inv3.garis.1': 'Tanggal 3 · foto pemeriksaan: retak spion sudah ada',
  'inv3.garis.2': 'Tanggal 14 · kejadian parkir: bumper penyok, dikuatkan petugas parkir',
  'inv3.garis.3': 'Tanggal 15 · pesan pengajuan: retak lama diminta masuk',
  'inv3.arsip.pesan': 'Pesanmu untuk Pak Gilang',
  // Teks pembungkus yang menyebut isi kasus (kunci sama dengan kasus 1, isinya untuk kasus ini)
  'inv.lagi.langkah.pesan': 'Pesan untuk Pak Gilang',
  'inv.lagi.sempurna': 'Skor sempurna! Inilah keterangan Pak Gilang yang dikoreksi berkat buktimu.',
};
