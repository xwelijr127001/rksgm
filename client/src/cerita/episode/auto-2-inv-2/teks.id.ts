/**
 * T-090 Investigator KASUS 2 "Malam di Jalan Melati": HANYA kunci BARU (bahasa Indonesia). Tabel episode = TEKS_AUTO_2 (pemeran
 * Miss Raksa, lokasi, suasana) + teks antarmuka pembungkus kasus 1 (`inv.ui.*`, `inv.hasil.*`, `inv.lagi.*`, `inv.latihan.*`,
 * `inv.gerbang.*`) + kunci ini (lihat ./teks.ts). Naskah kasus ini berawalan `inv2.` (awalan kasus, KonfigInvestigasi.awalan),
 * supaya tidak pernah bertabrakan dengan tabel reaksi / gerak / kilas balik kasus 1 yang berkunci `inv.*`.
 * Aturan penjaga teks (cerita/validasi.ts): kunci & angka sama di id / en / zh; tanpa parameter selain {nama}.
 *
 * [konfirmasi PIC]: setiap baris bertanda ini memuat kalimat polis, dasar putusan, atau jalur peninjauan ulang yang HARUS
 * dikonfirmasi PIC klaim sebelum dipakai di depan tamu (spec 2026-11-21, anti-goal "legal wording we cannot back"). Polis,
 * aplikasi perjalanan dan semua nama di kasus ini fiktif; tidak ada nama merek.
 */
export const TEKS_AUTO_2_INV_2_ID: Record<string, string> = {
  judul: 'Investigator · Kasus 2',
  ringkas: 'Mobil keluarga, benturan malam hari, dan satu struk perjalanan. Temukan faktanya tanpa menuduh, lalu jelaskan dengan hormat. 5 menit.',
  'inv.label': 'Kasus 2',
  'inv2.kait': 'Mobil keluarga... atau sedang antar penumpang?', // T-094: kalimat kait di hub Raksa Investigator
  'inv2.kasus.judul': 'Malam di Jalan Melati',
  'pemeran.yusuf.nama': 'Pak Yusuf',
  'pemeran.yusuf.peran': 'Nasabah · pemilik mobil',
  'pemeran.agus.nama': 'Mas Agus',
  'pemeran.agus.peran': 'Saksi · pengendara motor',

  // Bagian (kepala layar)
  'inv2.bab.1.judul': 'Keterangan',
  'inv2.bab.1.tujuan': 'Lihat foto surveyor, lalu catat dua keterangan.',
  'inv2.bab.2.judul': 'Bukti',
  'inv2.bab.2.tujuan': 'Cocokkan jam benturan dengan struk perjalanan, lalu baca polisnya.',
  'inv2.bab.3.judul': 'Keberatan',
  'inv2.bab.3.tujuan': 'Tunjukkan catatan yang menjawab: apa yang terjadi jam 21:18?',
  'inv2.bab.4.judul': 'Putusan',
  'inv2.bab.4.tujuan': 'Putuskan klaimnya, lalu jelaskan kepada Pak Yusuf dengan hormat.',

  // Pembuka: foto interior langsung masuk buku (tanpa aktivitas ketuk), lalu tebakan yang tidak dinilai
  'inv2.judul.kartu': 'Kasus #2 · Malam di Jalan Melati',
  'inv2.buka.1': 'Kasus baru, Investigator. Malam hari di Jalan Melati, sebuah motor menyenggol bumper depan kiri mobil Pak Yusuf jam 21:18. Ini foto kabin dari surveyor kita.',
  'inv2.bukti.foto.1': 'Foto kabin dari surveyor: HP terpasang di dudukan dasbor dengan sebuah aplikasi menyala, dan botol air minum di jok belakang.',
  'inv2.bukti.foto.judul': 'Foto interior: HP di dasbor, botol di jok belakang',
  'inv2.bukti.foto.sumber': 'Sumber: foto surveyor Raksa',
  'inv2.tebak.1': 'Tidak ada benar atau salah. Tebakanmu kita cek lagi sesudah catatannya terkumpul.',
  'inv2.tebak.tanya': 'Malam itu mobil ini dipakai untuk apa?',
  'inv2.tebak.pilih.keluarga': 'Antar keluarga',
  'inv2.tebak.pilih.penumpang': 'Antar penumpang',
  'inv2.tebak.pilih.belum': 'Belum tahu',
  'inv2.tebak.balik.keluarga': 'Tebakan awalmu: antar keluarga. Struk mencatat penumpang berbayar. Tidak apa-apa: sekarang kamu punya catatannya.',
  'inv2.tebak.balik.penumpang': 'Tebakan awalmu: antar penumpang. Sekarang ada catatannya, jadi itu bukan lagi dugaan.',
  'inv2.tebak.balik.belum': 'Tebakan awalmu: belum tahu. Sikap yang baik. Sekarang catatannya yang menjawab.',

  // Keterangan (pernyataan yang dicatat)
  'inv2.yusuf.1': 'Ruang wawancara. Pak Yusuf, pemilik mobil, datang sepulang kerja.',
  'inv2.yusuf.2': 'Motor itu muncul dari kiri dan menyenggol bumper saya. Syukurlah tidak ada yang terluka.',
  'inv2.yusuf.3': 'Malam itu saya cuma antar keluarga pulang.',
  'inv2.pernyataan.yusuf': 'Malam itu saya cuma antar keluarga pulang.',
  'inv2.agus.1': 'Berikutnya Mas Agus, pengendara motor itu. Helmnya masih di tangan.',
  'inv2.agus.2': 'Saya yang menyenggol, saya akui. Jalannya gelap dan saya terlambat mengerem.',
  'inv2.agus.3': 'Sesudah benturan, ada penumpang turun dari pintu belakang, lalu pergi jalan kaki.',
  'inv2.pernyataan.agus': 'Sesudah benturan, ada penumpang turun dari pintu belakang, lalu pergi jalan kaki.',
  'inv2.selisih.1': 'Keluarga, atau penumpang? Kita tidak menduga dan tidak menuduh. Kita cari catatan yang ada jamnya.',

  // Bukti 1: garis waktu perjalanan (layar ui/PeriksaPerjalanan membaca kunci inv2.jalan.* dan inv2.garis.* lewat useTx)
  'inv2.jalan.1': 'Kamu bertanya baik-baik: apakah aplikasi di dasbor itu mencatat perjalanan malam itu?',
  'inv2.jalan.2': 'Ada satu. Ini struknya, silakan dilihat. Nama dan alamat orangnya saya tutup, ya.',
  'inv2.jalan.judul': 'Cocokkan jamnya',
  'inv2.jalan.struk': 'Struk perjalanan',
  'inv2.jalan.struk.ket': 'Aplikasi perjalanan (fiktif). Nama dan alamat penumpang ditutup.',
  'inv2.jalan.form': 'Formulir kejadian',
  'inv2.jalan.form.jam': 'Jam benturan: 21:18',
  'inv2.jalan.tertutup': 'Ketuk untuk membuka',
  'inv2.jalan.sama': 'Tanggal sama · pelat nomor sama',
  'inv2.garis.1': '21:05 · penumpang dijemput',
  'inv2.garis.2': '21:18 · benturan',
  'inv2.garis.3': '21:24 · perjalanan ditutup di aplikasi',
  'inv2.jalan.l1.tanya': 'Ketuk struk perjalanan untuk membukanya.',
  'inv2.jalan.l1.hasil': 'Satu perjalanan berbayar: penumpang dijemput 21:05, perjalanan ditutup di aplikasi 21:24.',
  'inv2.jalan.l2.tanya': 'Ketuk formulir kejadian untuk melihat jam benturan.',
  'inv2.jalan.l2.hasil': 'Formulir kejadian mencatat benturan jam 21:18.',
  'inv2.jalan.l3.tanya': 'Di mana 21:18 pada perjalanan itu? Ketuk tempatnya.',
  'inv2.jalan.l3.sebelum': 'Sebelum 21:05',
  'inv2.jalan.l3.tengah': 'Antara 21:05 dan 21:24',
  'inv2.jalan.l3.sesudah': 'Sesudah 21:24',
  'inv2.jalan.l3.coba': 'Belum pas. Bandingkan jamnya: 21:18 sesudah 21:05, tetapi sebelum 21:24.',
  'inv2.jalan.l3.hasil': 'Tepat: 21:18 ada di tengah perjalanan berbayar itu.',
  'inv2.jalan.l4.tanya': 'Ketuk tanggal dan pelat nomor untuk mencocokkannya.',
  'inv2.jalan.l4.hasil': 'Tanggal dan pelat nomor di struk sama dengan formulir kejadian.',
  'inv2.jalan.selesai': 'Simpan hasil pemeriksaan',
  'inv2.bukti.struk.1': 'Struk dan formulir kejadian cocok: tanggal sama, pelat nomor sama. Penumpang dijemput 21:05, benturan 21:18, perjalanan ditutup di aplikasi 21:24.',
  'inv2.bukti.struk.judul': 'Struk perjalanan: penumpang berbayar 21:05-21:24',
  'inv2.bukti.struk.sumber': 'Sumber: struk dari Pak Yusuf, nama dan alamat penumpang ditutup',

  // Bukti 2: polis (layar ui/PeriksaPolis membaca kunci inv2.polis.* lewat useTx)
  // T-104 "Tanya lebih lanjut" (opsional, tanpa poin): kapan perjalanan itu ditutup
  'inv2.tekan.yusuf.tanya': 'Tanya: kapan perjalanan itu ditutup di aplikasi?',
  'inv2.tekan.yusuf.jawab': 'Jam 21:24. Saya sendiri yang menutupnya dari HP di dasbor, sesudah mobil menepi.',
  'inv2.polis.1': 'Satu catatan lagi: polisnya. Kita baca apa yang tertulis, bukan apa yang kita kira.',
  'inv2.polis.judul': 'Baca polisnya',
  'inv2.polis.tanya': 'Ketuk klausul penggunaan kendaraan.',
  'inv2.polis.kepala': 'Polis kendaraan (contoh fiktif)',
  'inv2.polis.ketuk': 'Ketuk untuk membaca',
  'inv2.polis.klausul.judul': 'Penggunaan kendaraan',
  'inv2.polis.klausul.1': 'Penggunaan: PRIBADI.', // [konfirmasi PIC] kalimat klausul penggunaan
  'inv2.polis.klausul.2': 'Tidak dijamin bila kendaraan disewakan atau menerima balas jasa, kecuali ada perluasan penggunaan komersial.', // [konfirmasi PIC] kalimat klausul + nama perluasan
  'inv2.polis.klausul.3': 'Perluasan pada tanggal kejadian: TIDAK ADA.', // [konfirmasi PIC] cara status perluasan tertulis di polis
  'inv2.polis.hasil': 'Polis ini untuk penggunaan pribadi. Pada tanggal kejadian tidak ada perluasan penggunaan komersial.', // [konfirmasi PIC]
  'inv2.polis.selesai': 'Simpan hasil pemeriksaan',
  'inv2.bukti.polis.1': 'Polis Pak Yusuf: penggunaan pribadi. Perluasan penggunaan komersial pada tanggal kejadian: tidak ada.', // [konfirmasi PIC]
  'inv2.bukti.polis.judul': 'Polis: penggunaan pribadi, tanpa perluasan', // [konfirmasi PIC]
  'inv2.bukti.polis.sumber': 'Sumber: polis kendaraan Pak Yusuf',

  // Keberatan (terhadap kalimat Pak Yusuf; tanpa menuduh)
  'inv2.keb-buka.1': 'Tiga catatan sudah ada di buku catatanmu. Kamu menemui Pak Yusuf sekali lagi.',
  'inv2.keb-buka.2': 'Seperti yang saya bilang, malam itu saya cuma antar keluarga pulang.',
  'inv2.keb-buka.3': 'Ingat, kita tidak menuduh. Tunjukkan satu catatan yang menjawab: apa yang terjadi jam 21:18?',
  'inv2.keb.1': 'Pilih satu catatan untuk ditunjukkan kepada Pak Yusuf.',
  'inv2.keb.2': 'Coba lagi. Cari catatan yang ada jamnya.',
  'inv2.keb.3': 'Tunjukkan struk perjalanan kepada Pak Yusuf.',
  'inv2.keb.tanya': 'Catatan mana yang menunjukkan mobil sedang membawa penumpang berbayar jam 21:18?',
  'inv2.keb.petunjuk1': 'Belum tepat. Catatan mana yang ada jamnya? Lihat yang disorot.',
  'inv2.keb.petunjuk2': 'Benturan terjadi jam 21:18. Struk mencatat penumpang berbayar dari 21:05 sampai 21:24. Pakai struk itu.',
  'inv2.keb.pilih.foto-interior': 'Tunjukkan foto interior',
  'inv2.keb.pilih.struk': 'Tunjukkan struk perjalanan',
  'inv2.keb.pilih.polis-kasus2': 'Tunjukkan polis',
  'inv2.keb.salah.foto-interior': 'Botol dan dudukan HP bukan bukti ada tarif. Cari yang ada JAM-nya.',
  'inv2.keb.salah.polis-kasus2': 'Polis menjelaskan aturan, bukan apa yang terjadi jam 21:18.',
  'inv2.keb.pandu.foto-interior': 'Foto itu hanya petunjuk, bukan catatan jam. Mari kita lihat bersama.',
  'inv2.keb.pandu.polis-kasus2': 'Polis hanya aturannya, bukan kejadian malam itu. Mari kita lihat bersama.',
  'inv2.keb.cap': 'Struk perjalanan mencatat penumpang berbayar dari 21:05 sampai 21:24. Benturan terjadi jam 21:18.',
  'inv2.akui.1': 'Saya sedang mengantar penumpang. Saya kira penggunaan itu sudah termasuk.',
  'inv2.akui.2': 'Terima kasih sudah terbuka, Pak.',
  'inv2.koreksi.1': 'Kamu memperbarui keterangan Pak Yusuf di buku catatanmu.',
  'inv2.koreksi.judul': 'Keterangan diperbarui',
  'inv2.koreksi.ket': 'Pak Yusuf sendiri yang meluruskan keterangannya. Tidak ada yang dituduh.',
  'inv2.koreksi.baris': 'Keterangan diperbarui: sedang mengantar penumpang berbayar',

  // Putusan (tabel kasus ini: masalah pertanggungan 30, bukti tambahan 15, layak dijamin 0)
  'inv2.putusan.1': 'Temuanmu jelas, dan Pak Yusuf sendiri sudah meluruskan keterangannya.',
  'inv2.putusan.2': 'Sekarang putusanmu. Kita menilai pemakaian mobil dan isi polisnya, bukan niat Pak Yusuf.',
  'inv2.putusan.3': 'Pilih satu putusan.',
  'inv2.putusan.tanya': 'Bagaimana klaim ini?',
  'inv2.putusan.layak': 'Klaim layak dijamin',
  'inv2.putusan.tambahan': 'Butuh bukti tambahan',
  'inv2.putusan.polis': 'Ada masalah pertanggungan',
  'inv2.putusan.ket': 'Struk dan polis sudah di buku catatanmu. Pilih satu putusan.',
  'inv2.putusan.polis.sebab': 'Saat benturan mobil membawa penumpang berbayar: di luar penggunaan pribadi, dan tanpa perluasan.', // [konfirmasi PIC] dasar putusan
  'inv2.putusan.tambahan.sebab': 'Lebih aman memeriksa sekali lagi dulu, walaupun struk berjam dan klausul polis sudah di tangan.', // [konfirmasi PIC]
  'inv2.putusan.layak.sebab': 'Bumpernya rusak karena disenggol motor, jadi kerugiannya tetap dijamin.', // [konfirmasi PIC]
  'inv2.putusan.polis.1': 'Tepat. Polisnya untuk penggunaan pribadi, struk mencatat penumpang berbayar saat benturan, dan pada tanggal itu tidak ada perluasan. Ada masalah pertanggungan. Ini soal pemakaian mobil, bukan soal niat Pak Yusuf.', // [konfirmasi PIC] dasar putusan + siapa yang berwenang memutuskan
  'inv2.putusan.tambahan.1': 'Teliti itu baik, tetapi dua hal yang menentukan sudah kamu pegang: struk berjam, dan klausul polis beserta status perluasannya. Putusannya: ada masalah pertanggungan.', // [konfirmasi PIC]
  'inv2.putusan.layak.1': 'Belum tepat. Kerusakannya nyata, tetapi saat benturan mobil dipakai di luar penggunaan yang tertulis di polis, tanpa perluasan. Putusannya: ada masalah pertanggungan.', // [konfirmasi PIC]

  // Pesan untuk Pak Yusuf (30: mengakui, menyebut ketentuan + temuan, memberi jalur peninjauan; 15: benar dan sopan tanpa jalur; 0: janji tanpa dasar)
  'inv2.pesan.1': 'Terakhir, kabari Pak Yusuf. Ini bukan kabar yang ia harapkan, jadi cara menyampaikannya penting.',
  'inv2.pesan.2': 'Jadi bagaimana klaim bumper saya?',
  'inv2.pesan.tanya': 'Pesan mana yang kamu kirim?',
  'inv2.pesan.baik': 'Pak Yusuf, terima kasih sudah terbuka, dan maaf kabarnya kurang enak. Polis Bapak untuk penggunaan pribadi, sedangkan struk mencatat penumpang berbayar saat benturan, tanpa perluasan penggunaan komersial. Karena itu klaim bumper ini tidak dapat kami setujui. Bapak dapat meminta peninjauan ulang lewat Layanan Nasabah Raksa. Untuk ke depan, Bapak bisa menanyakan perluasan penggunaan komersial.', // [konfirmasi PIC] kalimat penolakan, jalur peninjauan ulang (kanal), pilihan perluasan ke depan
  'inv2.pesan.datar': 'Mohon maaf, Pak. Klaim tidak dapat kami setujui: polis Bapak untuk penggunaan pribadi, sedangkan saat benturan mobil membawa penumpang berbayar.', // [konfirmasi PIC] kalimat penolakan
  'inv2.pesan.janji': 'Tenang Pak, saya usahakan tetap cair minggu ini.',
  'inv2.pesan.baik.alasan': 'Pak Yusuf tahu hasilnya, alasannya, dan jalur peninjauan ulangnya.', // [konfirmasi PIC] jalur peninjauan ulang
  'inv2.pesan.janji.alasan': 'Pak Yusuf lega sekarang, tetapi janji itu tidak punya dasar.',
  'inv2.pesan.baik.1': 'Saya kecewa, tapi saya mengerti alasannya. Terima kasih sudah menjelaskan dan memberi tahu jalurnya.',
  'inv2.pesan.datar.1': 'Begitu... Lalu saya harus bagaimana? Tidak ada lagi yang bisa saya lakukan?',
  'inv2.pesan.datar.2': 'Alasanmu benar dan sopan, tetapi Pak Yusuf tidak tahu ia boleh meminta peninjauan ulang.', // [konfirmasi PIC] hak meminta peninjauan ulang
  'inv2.pesan.janji.1': 'Wah, syukurlah! Saya tunggu minggu ini, ya.',
  'inv2.pesan.janji.2': 'Temuannya tidak berubah. Janji tanpa dasar akan mengecewakan Pak Yusuf dua kali.',

  // Akhir
  'inv2.akhir.tuntas.1': 'Kasus selesai, Investigator. Kamu adil ke dua arah: menemukan faktanya tanpa menuduh, lalu menjelaskannya dengan hormat.',
  'inv2.akhir.tinjau.1': 'Kasus selesai. Faktanya kamu temukan sendiri; putusannya kita luruskan bersama.',
  'inv2.akhir.tuntas.judul': 'Kasus tuntas',
  'inv2.akhir.tuntas.ringkas': 'Pemakaian mobil terbukti di luar polis, dan Pak Yusuf mendapat penjelasannya.', // [konfirmasi PIC]
  'inv2.akhir.tinjau.judul': 'Kasus selesai dengan catatan',
  'inv2.akhir.tinjau.ringkas': 'Faktanya ditemukan; putusannya diluruskan Miss Raksa.',
  'inv2.pelajaran.1': 'Penggunaan kendaraan harus sesuai dengan polisnya. Investigator adil ke dua arah dan tidak menilai niat.', // [konfirmasi PIC] rumusan pelajaran

  // Layar hasil: kalimat Pak Yusuf menurut pesan yang dikirim, arsip, kasus 3
  'inv2.balas.baik': 'Terima kasih sudah jujur kepada saya, Investigator. Saya tahu ke mana meminta peninjauan ulang, dan saya akan menanyakan perluasan itu.', // [konfirmasi PIC] jalur peninjauan ulang
  'inv2.balas.datar': 'Alasannya saya mengerti. Tapi saya masih tidak tahu apakah ada yang bisa saya lakukan.',
  'inv2.balas.janji': 'Minggu ini cair, kan? Saya sudah bilang ke bengkel. Semoga benar begitu.',
  'inv2.arsip.pesan': 'Pesanmu untuk Pak Yusuf',
  'inv2.hasil.kasus3': 'Kasus 3 · segera hadir',
  // Teks pembungkus yang menyebut isi kasus (kunci sama dengan kasus 1, isinya untuk kasus ini)
  'inv.lagi.langkah.pesan': 'Pesan untuk Pak Yusuf',
  'inv.lagi.sempurna': 'Skor sempurna! Inilah keterangan Pak Yusuf yang diperbarui berkat catatanmu.',
};
