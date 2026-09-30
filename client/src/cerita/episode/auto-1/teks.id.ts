/**
 * EPISODE AUTO-1 "Baret di Parkiran" - naskah Bahasa Indonesia (bahasa sumber).
 * Rancangan: docs/rancangan-mode-cerita.md bagian 3. Graf & efek: ./episode.ts. Aktivitas: ./aktivitas.ts.
 *
 * Konvensi kunci:
 *  '<node>.<n>'                baris ke-n (mulai 1) di node itu
 *  '<node>.tanya'              pertanyaan di atas tombol pilihan
 *  '<node>.<pilihan>'          ucapan pemain (tombol pilihan; tercatat di Riwayat)
 *  '<node>.<pilihan>.alasan'   sebab-akibat perubahan suasana nasabah
 *  '<node>.hasil.<n>.<m>'      umpan balik aktivitas: cabang hasil ke-n, baris ke-m (mulai 1)
 *  '<node>.hasil.<n>.alasan'   alasan efek cabang hasil ke-n
 *  'istilah.<id>.label|arti'   istilah yang dijelaskan saat pertama muncul (Episode.istilah, v2)
 *  'akt.<id>.alasan.<opsi>'    alasan per opsi aktivitas, tampil setelah dikirim (DefAktivitas.alasanOpsi, v2)
 *  'akt.polis.kartu.<baris>.arti' | 'akt.polis.kartu.sub.arti'  arti awam baris kartu polis (DefAktivitas.kartuArti)
 *  'bab.* | akhir.* | paham.* | proses.* | catatan.* | suasana.* | pemeran.* | akt.* | ep.* | kartu.*'
 *
 * Kunci yang dihapus dari naskah TIDAK dibuang: pindah ke blok PENSIUN di akhir berkas (KUNCI_PENSIUN), supaya
 * Riwayat & hasil aktivitas dari simpanan lama tetap terbaca (docs/rancangan-mode-cerita.md 11.3).
 *
 * Parameter: {nama} (nama panggilan pemain) dan (v3) {lokasi} (nama ruang layanan dari `Episode.panggung.lokasi.nama`,
 * sama dengan papan nama; diisi otomatis oleh teksCerita). Pemain TIDAK disapa dengan sapaan bergender.
 * Materi klaim hanya dari m01, m02, m05, m09 + catatan simulasi; kalimat yang menyentuh materi klaim
 * dicatat di docs/cerita/TINJAUAN-PIC-CLAIM.md (menunggu tinjauan PIC Claim).
 * Kutipan di dalam teks memakai tanda kutip tipografis “ ”.
 */
export const TEKS_ID: Record<string, string> = {
  // ------------------------------------------------------------------ episode & pemeran
  'ep.judul': 'Baret di Parkiran',
  'ep.ringkas':
    'Mobil Bu Rina disenggol di parkiran pasar, padahal besok pagi ada 150 kotak katering yang harus diantar. Dengarkan, kumpulkan bukti, dan jelaskan langkahnya dengan jujur.',

  'pemeran.nasabah.nama': 'Bu Rina',
  'pemeran.nasabah.peran': 'Nasabah',
  'pemeran.missRaksa.nama': 'Miss Raksa',
  'pemeran.missRaksa.peran': 'Senior Layanan Klaim',

  // ------------------------------------------------------------------ bab
  'bab.menyambut.judul': 'Menyambut',
  'bab.menyambut.tujuan': 'Pahami masalah Bu Rina.',
  'bab.menggali.judul': 'Menggali Cerita',
  'bab.menggali.tujuan': 'Gali kejadiannya, lalu sarankan langkah pertama.',
  'bab.bukti.judul': 'Mengumpulkan Bukti',
  'bab.bukti.tujuan': 'Kumpulkan bukti yang dibutuhkan pemeriksa.',
  'bab.polis.judul': 'Membaca Polis',
  'bab.polis.tujuan': 'Baca kartu polis, lalu jelaskan dengan tepat.',
  'bab.menutup.judul': 'Menutup Layanan',
  'bab.menutup.tujuan': 'Jelaskan langkah berikutnya dengan jujur.',

  // ------------------------------------------------------------------ suasana nasabah
  'suasana.tenang': 'Tenang',
  'suasana.mulai-tenang': 'Mulai tenang',
  'suasana.cemas': 'Cemas',
  'suasana.kesal': 'Kesal',

  // ------------------------------------------------------------------ kejelasan (paham)
  'paham.langkah-sekarang': 'Sekarang dokumentasi dan lapor dulu; mobil belum diperbaiki.',
  'paham.polis-dinilai': 'Kerusakan bisa dilanjutkan untuk dinilai sesuai syarat kartu, bukan pasti diganti.',
  'paham.risiko-sendiri': 'Ada bagian kerugian yang tetap ia tanggung sesuai polis (risiko sendiri).',
  'paham.langkah-berikut': 'Laporan tercatat, lalu kerusakan diperiksa dan dinilai sesuai polis; langkah perbaikan mengikuti hasil penilaian.',

  // ------------------------------------------------------------------ ketepatan langkah klaim (proses)
  'proses.dokumentasi-dulu': 'Dokumentasi dan lapor sebelum perbaikan',
  'proses.bukti': 'Tiga bukti: seluruh mobil, detail kerusakan, identitas',
  'proses.baca-polis': 'Membaca kartu polis dengan tepat',
  'proses.tanpa-janji': 'Tidak menjanjikan hasil atau waktu',

  // ------------------------------------------------------------------ catatan kasus
  'catatan.masalah': 'Disenggol di parkiran pasar pagi ini, pelaku pergi. Bemper & lampu belakang penyok, retak.',
  'catatan.kebutuhan': 'Besok pagi harus mengantar 150 kotak katering.',
  'catatan.bagian-disimpan': 'Pecahan penutup lampu disimpan di bagasi, tidak dibuang.',
  'catatan.rencana-bengkel': 'Berniat langsung ke bengkel siang ini.',
  'catatan.bukti': 'Foto bukti diambil di parkiran kantor.',
  'catatan.bukti-lengkap': 'Foto dilengkapi sebelum Bu Rina pergi: seluruh mobil, detail bemper & lampu belakang, plat nomor.',
  'catatan.bukti-kurang': 'Foto belum lengkap: yang terlewat belum terpotret.',
  'catatan.polis': 'Comprehensive (simulasi), aktif. Kerusakan benturan tercakup sesuai syarat kartu; risiko sendiri sesuai polis.',

  // ------------------------------------------------------------------ istilah (v2; tombol "Apa itu …?" di baris pertama)
  // Arti = DRAF dari materi episode (m01/m02/m05/m09 + catatan simulasi); TINJAUAN-PIC-CLAIM.md bagian S.
  'istilah.nasabah.label': 'nasabah',
  'istilah.nasabah.arti': 'Pelanggan asuransi, yaitu orang yang dilindungi asuransi. Di cerita ini: Bu Rina.',
  'istilah.klaim.label': 'klaim',
  'istilah.klaim.arti': 'Laporan kerugian dari nasabah kepada perusahaan asuransi. Hasilnya mengikuti dokumen perlindungannya (polis) dan pemeriksaan.',
  'istilah.polis.label': 'polis',
  'istilah.polis.arti': 'Dokumen yang menjelaskan perlindungan dan syarat asuransi. Kartu polis meringkas isinya.',
  'istilah.comprehensive.label': 'Comprehensive',
  'istilah.comprehensive.arti': 'Jenis polis Bu Rina di simulasi ini. Pada kartunya, kerusakan benturan termasuk yang dilindungi, sesuai syarat kartu.',
  'istilah.risiko-sendiri.label': 'risiko sendiri',
  'istilah.risiko-sendiri.arti': 'Bagian kerugian yang tetap ditanggung nasabah sendiri. Besarnya sesuai ketentuan polis.',

  // ================================================================== BAB 1 - MENYAMBUT
  // Satu-satunya perkenalan peran (v3): satu kalimat peran yang menyebut tempat ({lokasi}), tanpa istilah; "nasabah"
  // dijelaskan di narasi pintu (.4, saat nasabah muncul) dan "klaim" di b2-saran.1/.2 (semua jalur melewatinya).
  // Masalah Bu Rina = baris ke-3.
  'b1-mentor.1': 'Pagi, {nama}. Hari ini kamu bertugas di meja layanan {lokasi}, aku mendampingimu. Ini simulasi.',
  'b1-mentor.4': 'Pintu terbuka. Seorang nasabah masuk tergesa dan menaruh kunci mobilnya di meja.',

  'b1-datang.1': 'Pagi. Mobil saya disenggol di parkiran pasar tadi. Yang nyenggol langsung pergi.',
  'b1-datang.2': 'Bemper belakang penyok, lampunya retak. Besok pagi saya harus antar 150 kotak katering.',
  'b1-datang.tanya': 'Apa yang kamu katakan lebih dulu?',
  'b1-datang.prosedur': 'Baik, Bu. Saya perlu data asuransi Ibu dan foto kerusakannya dulu, ya.',
  'b1-datang.dengar': 'Ibu sendiri tidak apa-apa? Tarik napas dulu, lalu ceritakan dari awal.',
  'b1-datang.janji': 'Tenang, Bu, kami bantu sampai beres. Besok mobilnya pasti bisa dipakai.',
  'b1-datang.prosedur.alasan': 'Bu Rina makin tegang: ia datang membawa masalah, tapi yang ditanya lebih dulu data asuransinya.',
  'b1-datang.dengar.alasan': 'Bu Rina mulai tenang karena kamu menanyakan keadaannya lebih dulu.',
  'b1-datang.janji.alasan': 'Bu Rina lega mendengar janji itu, padahal hasil dan waktunya belum bisa dipastikan.',

  'b1-pulih.1': 'Sebentar. Saya lagi bingung, bukan cuma mau isi formulir.',
  'b1-pulih.2': '(pelan) Datanya bisa menyusul, {nama}. Apa yang paling ia butuhkan sekarang?',
  'b1-pulih.tanya': 'Bagaimana kamu menanggapinya?',
  'b1-pulih.maaf': 'Maaf, Bu, saya terlalu cepat. Ibu aman? Ceritakan dulu apa yang terjadi.',
  'b1-pulih.tetap': 'Saya mengerti, Bu. Supaya cepat, kita isi datanya dulu, ya.',
  'b1-pulih.maaf.alasan': 'Bu Rina mulai melunak karena kamu mengakui terlalu cepat dan menanyakan keadaannya.',
  'b1-pulih.tetap.alasan': 'Bu Rina menurut, tapi menjawab seperlunya: ia merasa hanya dianggap formulir.',

  // ================================================================== BAB 2 - MENGGALI
  'b2-cerita.1': 'Syukurlah. Pesanan besok itu besar, saya tidak bisa batal.',
  'b2-cerita.2': 'Iya, maaf, saya juga lagi panik. Oke, dari awal, ya.',
  'b2-cerita.3': 'Saya tidak apa-apa, cuma kaget. Makasih sudah tanya.',
  // v2: kronologi (.4, pensiun) digabung ke .5; kejadiannya sudah diceritakan di b1-datang.
  'b2-cerita.5': 'Tadi saya belanja sebentar. Sudah saya foto pakai HP, seadanya; siang ini rencananya langsung ke bengkel.',
  'b2-cerita.6': 'Oh ya, pecahan penutup lampunya saya pungut. Ada di bagasi.',

  // v2: .1 (pensiun) hanya mengulang b1-datang.1; jawaban seperlunya tetap terlihat di .2.
  'b2-singkat.2': 'Bemper sama lampu belakang. Sudah saya foto. Habis ini saya ke bengkel.',

  'b2-saran.1': 'Intinya saya langsung ke bengkel saja, kan? Urusan klaim belakangan, waktu saya tidak banyak.',
  'b2-saran.2': 'Jadi saya langsung ke bengkel saja, kan? Urusan klaim belakangan, besok mobilnya harus jalan.',
  'b2-saran.tanya': 'Apa saranmu?',
  'b2-saran.bengkel': 'Kalau memang mendesak, perbaiki dulu saja, Bu. Klaimnya bisa menyusul.',
  'b2-saran.dokumentasi': 'Kita foto dan laporkan dulu sebelum ke bengkel, Bu, supaya kondisinya tercatat.',
  'b2-saran.ringan': 'Kalau cuma baret, mungkin tidak perlu klaim, Bu. Mobilnya masih bisa jalan, kan?',
  'b2-saran.bengkel.alasan': 'Bu Rina senang boleh langsung ke bengkel, padahal kondisi kerusakannya belum tercatat.',
  'b2-saran.dokumentasi.alasan': 'Bu Rina mengangguk karena kamu menjelaskan kenapa mobil perlu tercatat sebelum diperbaiki.',
  'b2-saran.ringan.alasan': 'Bu Rina tersinggung karena kerusakannya dianggap sepele sebelum kamu melihatnya.',

  'b2-bengkel-akibat.1': 'Sebentar, {nama}. Kalau diperbaiki sekarang, kondisi kerusakannya tak bisa dilihat lagi.',
  'b2-bengkel-akibat.2': 'Lho, jadi bagaimana? Tadi katanya boleh.',
  'b2-bengkel-akibat.tanya': 'Apa yang kamu lakukan?',
  'b2-bengkel-akibat.biarkan': 'Foto dari HP Ibu tadi sudah cukup, Bu. Silakan ke bengkel.',
  'b2-bengkel-akibat.koreksi': 'Maaf, saran saya tadi keliru, Bu. Kita foto dan laporkan dulu, baru ke bengkel.',
  'b2-bengkel-akibat.biarkan.alasan': 'Bu Rina senang bisa segera pergi, tapi foto seadanya belum tentu cukup untuk pemeriksa.',
  'b2-bengkel-akibat.koreksi.alasan': 'Bu Rina sempat bingung karena saranmu berubah, tapi ia menghargai kamu meluruskannya.',

  'b2-ringan-akibat.1': 'Masa tidak usah? Penyoknya lumayan, lampunya juga retak.',
  'b2-ringan-akibat.2': '(pelan) Sudah kamu lihat sendiri kerusakannya, {nama}?',
  'b2-ringan-akibat.tanya': 'Bagaimana kamu menanggapinya?',
  'b2-ringan-akibat.lihat-dulu': 'Ibu benar, saya terlalu cepat menilai. Boleh kita lihat mobilnya dulu?',
  'b2-ringan-akibat.tetap-ringan': 'Dari cerita Ibu, kedengarannya ringan. Sebaiknya tidak usah diperpanjang supaya Ibu tidak repot.',
  'b2-ringan-akibat.lihat-dulu.alasan': 'Bu Rina sedikit lega karena kamu mengakui terlalu cepat menilai dan mau melihat sendiri.',
  'b2-ringan-akibat.tetap-ringan.alasan': 'Bu Rina merasa masalahnya diremehkan, padahal kamu belum melihat mobilnya.',

  // ================================================================== BAB 3 - BUKTI
  'b3-bukti-intro.1': 'Kalian keluar ke parkiran kantor. Mobil Bu Rina terparkir dekat pintu.',
  'b3-bukti-intro.2': 'Pecahan lampu di bagasi tetap disimpan, ya, Bu. Bagian yang rusak jangan dibuang dulu.',
  'b3-bukti-intro.3': 'Cepat, ya. Saya masih harus ke bengkel.',
  // v2: .4 (pensiun) mengulang tugas kartu aktivitas; isinya kini di petunjuk aktivitas (akt.bukti.petunjuk).

  'b3-bukti.1': 'Silakan. Saya tunggu di sini.',
  'b3-bukti.hasil.1.1': 'Pas. Dengan tiga foto ini, pemeriksa bisa memastikan mobilnya dan titik kerusakannya.',
  'b3-bukti.hasil.2.4': 'Foto yang tidak menunjukkan titik kerusakan atau identitas mobil tidak membantu pemeriksa.',
  'b3-bukti.hasil.2.5': 'Laporannya belum lengkap: ada bukti yang dibutuhkan pemeriksa yang belum terpotret.',

  'b3-bukti-tepat.1': 'Plat nomor juga difoto? Itu kan jelas mobil saya.',
  'b3-bukti-tepat.2': 'Justru itu, Bu. Plat memastikan mobil yang diperiksa memang mobil Ibu.',
  'b3-bukti-tepat.3': 'Oh, begitu. Masuk akal.',

  'b3-bukti-kurang.1': 'Sudah cukup, kan? Saya tidak bisa lama-lama.',
  'b3-bukti-kurang.tanya': 'Apa yang kamu lakukan?',
  'b3-bukti-kurang.lengkapi': 'Boleh kita tambah foto yang kurang sekarang, Bu? Sebentar saja.',
  'b3-bukti-kurang.cukup': 'Sudah, Bu. Foto yang ada kita pakai saja supaya Ibu tidak terlambat.',
  'b3-bukti-kurang.lengkapi.alasan': 'Bu Rina menunggu sebentar lagi, dan laporannya kini punya bukti yang dibutuhkan.',
  'b3-bukti-kurang.cukup.alasan': 'Bu Rina tidak keberatan, tapi laporannya dibuat dengan bukti yang belum lengkap.',
  'b3-lengkapi.1': 'Kamu memotret yang tadi terlewat. Kini laporan punya tiga bukti: seluruh mobil, detail bemper & lampu belakang, dan plat nomor.',
  'b3-lengkapi.2': 'Oh, jadi itu yang kurang. Untung sekalian sekarang.',
  'b3-cukup.1': 'Makasih. Jadi lebih cepat.',
  'b3-cukup.2': '(pelan) Foto yang terlewat belum ada di laporan, {nama}. Kalau nanti diminta, Bu Rina harus meluangkan waktu lagi.',

  'b3-seadanya.1': 'Oke, foto dari HP saya kirim sekarang. Habis ini saya langsung ke bengkel.',
  'b3-seadanya.2': 'Laporan dibuat dari foto seadanya: agak buram, dan plat nomornya tidak kelihatan.',

  // ================================================================== BAB 4 - POLIS
  // v2: "dokumen perlindungan" lebih dulu, lalu istilahnya; baris ini diberi tombol "Apa itu polis?" & "Apa itu Comprehensive?".
  'b4-polis-intro.1': 'Kalian kembali ke meja layanan. Kamu membuka ringkasan dokumen perlindungan Bu Rina: kartu polis Comprehensive.',
  'b4-polis-intro.2': 'Sebelum Bu Rina berangkat, kamu membuka ringkasan dokumen perlindungannya: kartu polis Comprehensive.',
  'b4-polis-intro.3': 'Tadi katanya dibantu sampai beres. Berarti polis saya bisa dipakai, kan?',
  'b4-polis-intro.4': 'Polis saya bisa dipakai, kan? Saya bayar tiap tahun, lho.',

  // v2: tidak lagi mengulang tugas kartu aktivitas (baris ini tampil di kartu aktivitas); menunjuk tarikan perasaan vs isi kartu.
  'b4-polis.1': '(pelan) Bu Rina berharap jawabannya “ya”, {nama}. Tetap sampaikan apa yang tertulis di kartu.',
  'b4-polis.hasil.1.1': 'Dinilai dulu, ya. Oke, setidaknya bisa lanjut.',
  'b4-polis.hasil.1.2': 'Pas. Kartunya menulis tercakup sesuai syarat, bukan otomatis diganti.',
  'b4-polis.hasil.1.alasan': 'Bu Rina lebih tenang karena penjelasanmu sesuai kartu: kerusakannya bisa dilanjutkan untuk dinilai.',
  'b4-polis.hasil.2.1': 'Pasti diganti? Syukurlah!',
  'b4-polis.hasil.2.2': '(pelan) Kartunya menulis “tercakup sesuai syarat kartu”. Apa itu sama dengan “pasti”?',
  'b4-polis.hasil.2.alasan': 'Bu Rina lega mendengar “pasti diganti”, padahal hasilnya masih menunggu penilaian.',
  'b4-polis.hasil.3.1': 'Tidak tercakup? Terus buat apa saya bayar polis?',
  'b4-polis.hasil.3.alasan': 'Bu Rina kecewa berat: penjelasanmu membuatnya merasa polisnya percuma.',
  // Cabang 4 = jawaban kosong / tak cocok. .1 hanya untuk simpanan lama yang memilih opsi `ambang-tlo` (pensiun v2).
  'b4-polis.hasil.4.1': 'Tujuh puluh lima persen? Mobil saya cuma penyok, bukan hancur.',
  'b4-polis.hasil.4.2': 'Jadi bagaimana? Saya belum dapat jawaban.',
  'b4-polis.hasil.4.alasan': 'Bu Rina bingung karena belum mendapat penjelasan yang cocok dengan kartunya.',

  'b4-polis-tepat.1': 'Terus ini, “risiko sendiri berlaku sesuai ketentuan polis”. Maksudnya apa?',
  'b4-polis-tepat.2': 'Ada bagian kerugian yang tetap Ibu tanggung, Bu. Besarnya sesuai ketentuan polis.',
  'b4-polis-tepat.3': 'Jadi tetap ada yang keluar dari kantong saya. Hm.',

  'b4-polis-janji.1': 'Kalau pasti diganti, saya lega. Satu beban hilang.',
  'b4-polis-janji.2': 'Untuk pertama kalinya pagi ini, Bu Rina tersenyum.',

  'b4-polis-salah.1': '{nama}, baca lagi baris “Kerusakan benturan” di kartunya.',
  'b4-polis-salah.2': 'Jadi yang benar yang mana? Saya butuh jawaban, bukan tebakan.',
  'b4-polis-salah.tanya': 'Apa yang kamu lakukan?',
  'b4-polis-salah.bertahan': 'Saya sudah membacanya dengan teliti tadi, Bu. Supaya Ibu tidak bingung, kesimpulan saya tetap sama.',
  'b4-polis-salah.baca-ulang': 'Maaf, Bu, saya salah baca. Kerusakan benturan tercakup sesuai syarat kartu, jadi bisa dinilai.',
  'b4-polis-salah.bertahan.alasan': 'Bu Rina kehilangan kepercayaan karena kamu bertahan pada bacaan yang tidak sesuai kartu.',
  'b4-polis-salah.baca-ulang.alasan': 'Bu Rina kembali tenang karena kamu mengakui salah baca dan menjelaskan isi kartunya.',

  // ================================================================== BAB 5 - MENUTUP
  'b5-keberatan.1': 'Tadi katanya pasti diganti. Jadi besok mobil saya sudah bisa dipakai, kan?',
  'b5-keberatan.2': 'Tadi katanya besok pasti bisa dipakai. Jadi saya tinggal tunggu, kan?',
  'b5-keberatan.3': 'Soal risiko sendiri tadi, itu tidak jadi masalah, kan?',
  'b5-keberatan.4': 'Oh ya, “risiko sendiri” di kartu itu apa? Tidak ngaruh, kan?',
  'b5-keberatan.5': 'Oke. Terus kapan mobil saya beres? Besok pagi pesanan harus jalan.',
  'b5-keberatan.6': 'Dan risiko sendiri tadi, kenapa saya masih harus tanggung sebagian?',
  'b5-keberatan.7': 'Lalu di kartu ada “risiko sendiri”. Itu maksudnya apa?',
  'b5-keberatan.8': 'Siang ini mobil saya langsung ke bengkel, ya. Terus klaimnya kapan beres?',
  'b5-keberatan.tanya': 'Bagaimana kamu menjawab?',
  // v2: panjang pilihan diseimbangkan (8-20 kata; jawaban yang menolong tidak selalu terpanjang, dijaga tes).
  'b5-keberatan.janjikan': 'Saya usahakan besok sudah selesai, Bu. Nanti saya bantu kejar prosesnya supaya Ibu tidak perlu menunggu lama.',
  'b5-keberatan.aturan': 'Itu sudah ketentuan polis, Bu. Semuanya tertulis di kartu Ibu; silakan dibaca lagi supaya Ibu yakin.',
  'b5-keberatan.aturan-janji': 'Itu sudah ketentuan polis, Bu. Semuanya tertulis di kartu Ibu; silakan dibaca lagi supaya Ibu yakin.',
  'b5-keberatan.jujur': 'Besok belum bisa saya pastikan, Bu. Ada pemeriksaan sesuai polis, dan sebagian kerugian tetap Ibu tanggung.',
  'b5-keberatan.ralat-janji':
    'Maaf, saya perlu meluruskan, Bu: hasil dan waktunya belum pasti, dan sebagian kerugian tetap Ibu tanggung.',
  'b5-keberatan.janjikan.alasan': 'Bu Rina senang dijanjikan besok selesai, padahal waktunya belum bisa dipastikan.',
  'b5-keberatan.aturan.alasan': 'Bu Rina merasa ditinggal sendiri karena disuruh membaca kartu tanpa dijelaskan.',
  'b5-keberatan.aturan-janji.alasan': 'Bu Rina merasa ditinggal sendiri karena disuruh membaca kartu tanpa dijelaskan.',
  'b5-keberatan.jujur.alasan': 'Bu Rina menghargai kejujuranmu: kabarnya tidak enak, tapi ia tahu apa yang dihadapi.',
  'b5-keberatan.ralat-janji.alasan': 'Bu Rina kecewa janjinya ditarik, tapi kini ia tahu keadaan yang sebenarnya.',
  'b5-keberatan.ralat-polis': 'Maaf, saya keliru: kerusakannya dinilai dulu sesuai syarat, bukan pasti diganti. Waktunya belum pasti, dan sebagian kerugian tetap Ibu tanggung.',
  'b5-keberatan.ralat-polis.alasan': 'Bu Rina kecewa kabarnya berubah, tapi kini ia paham isi kartunya dan tahu keadaan yang sebenarnya.',

  'b5-tutup.1': 'Nah, begitu. Saya pegang janjinya, ya.',
  'b5-tutup.2': 'Hm. Tidak enak didengar, tapi saya lebih suka yang jujur.',
  'b5-tutup.3': 'Kok jadi berubah... Ya sudah. Lebih baik saya tahu sekarang daripada besok.',
  'b5-tutup.4': 'Baca sendiri? Saya ke sini justru supaya dijelaskan.',
  'b5-tutup.5': 'Jadi setelah ini saya harus apa?',
  'b5-tutup.tanya': 'Bagaimana kamu menutup?',
  'b5-tutup.rangkum': 'Laporan Ibu tercatat. Kerusakan diperiksa dan dinilai sesuai polis; langkah perbaikan mengikuti hasilnya. Kalau ada yang kurang, saya kabari.',
  'b5-tutup.singkat': 'Semua keterangan sudah saya catat lengkap, Bu. Ibu tidak perlu repot memikirkannya lagi; tinggal tunggu saja di rumah, nanti dikabari.',
  'b5-tutup.rangkum.alasan': 'Bu Rina lebih tenang karena kamu merangkum langkahnya dan siapa yang akan mengabari.',
  'b5-tutup.singkat.alasan': 'Bu Rina masih bertanya-tanya: “nanti dikabari” tidak menjelaskan langkah berikutnya.',
  'b5-rangkum.1': 'Oke. Jadi dinilai dulu, lalu perbaikannya mengikuti hasil penilaian. Saya catat.',
  'b5-rangkum.2': 'Iya, iya. Tapi besok sudah beres, kan? Tadi sudah dijanjikan.',
  'b5-rangkum.3': 'Iya, iya. Tapi pasti diganti, kan? Tadi sudah dibilang begitu.',
  'b5-rangkum.4': 'Dinilai dulu? Tapi mobil saya tetap ke bengkel siang ini, kan? Tadi katanya boleh.',

  // ================================================================== AKHIR
  'akhir-tuntas.1': 'Oke, mobil belum bisa langsung beres. Besok saya pinjam mobil adik untuk antar pesanan.',
  'akhir-tuntas.2': 'Terima kasih sudah jelas dari awal. Saya jadi tahu harus apa.',
  'akhir-tuntas.3': 'Awalnya sempat tersendat, tapi kamu memperbaikinya. Itu juga keterampilan, {nama}.',
  'akhir-tuntas.4': 'Meluruskan janji itu tidak enak, {nama}, tapi karena itulah ia bisa percaya.',
  'akhir-tuntas.5': 'Kerja bagus, {nama}. Ia tidak dapat semua yang ia harapkan, tapi pulang dengan jelas.',
  'akhir-tuntas.6': 'Terima kasih sudah mau meluruskan. Sekarang saya jadi tahu harus apa.',

  'akhir-janji.1': 'Makasih, ya. Lega saya dengarnya.',
  'akhir-janji.2': 'Beberapa hari kemudian, Bu Rina menelepon.',
  'akhir-janji.3': 'Katanya besok beres. Saya sudah terlanjur janji ke pelanggan, akhirnya pontang-panting.',
  'akhir-janji.4': 'Katanya pasti diganti. Ternyata masih dinilai, dan ada yang tetap saya tanggung.',
  'akhir-janji.5': 'Ia senang di meja kita, {nama}, tapi kecewa sesudahnya. Janji di luar proses hanya menunda kecewa.',

  'akhir-dingin.1': 'Ya sudah. Saya pulang dulu.',
  'akhir-dingin.2': 'Oke. Terima kasih, ya.',
  'akhir-dingin.3': 'Laporan Bu Rina tercatat, tapi ia pergi dengan dahi masih berkerut.',
  'akhir-dingin.4': 'Laporannya berjalan, {nama}, tapi ia pulang belum paham semuanya. Apa yang terlewat?',
  'akhir-dingin.5': 'Langkahnya jelas, {nama}, tapi ia belum merasa didengar. Sejak kapan jaraknya muncul?',
  'akhir-dingin.6': '“Nanti dikabari” belum menjawab pertanyaannya, {nama}: setelah ini ia harus apa? Rangkum langkahnya sebelum ia pergi.',

  'akhir-tertunda.1': 'Siang itu mobil Bu Rina langsung diperbaiki di bengkel.',
  'akhir-tertunda.2': 'Laporannya kemudian perlu dilengkapi, padahal kondisi sebelum perbaikan tak bisa difoto ulang.',
  'akhir-tertunda.3': 'Mobilnya sudah diperbaiki. Kondisi yang dulu mau difoto dari mana lagi?',
  'akhir-tertunda.4': 'Laporan Bu Rina kemudian perlu dilengkapi dengan foto yang kurang.',
  'akhir-tertunda.5': 'Kenapa tidak sekalian waktu saya di sana? Sekarang saya harus atur waktu lagi.',
  'akhir-tertunda.6': 'Bukti yang lengkap sejak awal menghemat waktu semua orang, {nama}. Terutama nasabah.',
  'akhir-tertunda.7': 'Tadi memang dibilang akan dikabari kalau ada yang kurang. Tapi kenapa tidak sekalian waktu saya di sana?',

  'akhir-pergi.1': 'Ya sudah, kalau memang dianggap sepele. Saya urus sendiri saja.',
  'akhir-pergi.2': 'Kalau polisnya saja dibaca begitu, saya cari penjelasan di tempat lain.',
  'akhir-pergi.3': 'Bu Rina pergi tanpa laporan, dan tanpa tahu langkah berikutnya.',
  'akhir-pergi.4': 'Bu Rina pergi dengan wajah kecewa, tanpa tahu langkah berikutnya.',
  'akhir-pergi.5': 'Kerusakan dinilai setelah dilihat, {nama}, bukan dari cerita. Kita coba lagi, ya.',
  'akhir-pergi.6': 'Salah baca bisa terjadi, {nama}. Yang membuatnya pergi adalah bertahan. Kita coba lagi, ya.',

  // ------------------------------------------------------------------ info akhir
  'akhir.tuntas.judul': 'Didengar dan Jelas',
  'akhir.tuntas.ringkas': 'Mobil belum bisa langsung beres, tapi Bu Rina didengar, paham langkahnya, dan menyiapkan rencana lain.',
  'akhir.tuntas.pelajaran.1': 'Tanyakan keadaan dan kebutuhan nasabah dulu; data menyusul lebih lancar.',
  'akhir.tuntas.pelajaran.2': 'Dokumentasi dan laporan sebelum perbaikan menjaga jejak kejadian.',
  'akhir.tuntas.pelajaran.3': 'Jelaskan apa adanya: dinilai sesuai polis, ada risiko sendiri bila tercantum di polis, dan waktunya belum bisa dipastikan.',

  'akhir.janji.judul': 'Lega Sesaat',
  'akhir.janji.ringkas': 'Bu Rina pulang senang, tapi janji yang tak sesuai proses berubah jadi kecewa.',
  'akhir.janji.pelajaran.1': 'Nasabah senang belum tentu langkahnya benar.',
  'akhir.janji.pelajaran.2': 'Hasil dan waktu klaim mengikuti polis dan pemeriksaan, jadi jangan dijanjikan di meja.',
  'akhir.janji.pelajaran.3': 'Terlanjur berjanji? Luruskan secepatnya. Tidak enak sekarang lebih ringan daripada kecewa nanti.',

  'akhir.dingin.judul': 'Benar, tapi Berjarak',
  'akhir.dingin.ringkas': 'Laporan berjalan, tapi Bu Rina pulang masih ragu atau belum paham semuanya.',
  'akhir.dingin.pelajaran.1': 'Langkah yang tepat perlu disampaikan dengan cara yang membuat nasabah merasa didengar.',
  'akhir.dingin.pelajaran.2': 'Menunjuk aturan tanpa menjelaskan membuat nasabah merasa sendirian.',
  'akhir.dingin.pelajaran.3': 'Tutup dengan ringkasan langkah berikutnya dan siapa yang akan mengabari.',

  'akhir.tertunda.judul': 'Laporan Tertunda',
  'akhir.tertunda.ringkas': 'Bukti belum lengkap, jadi laporan Bu Rina perlu dilengkapi belakangan.',
  'akhir.tertunda.pelajaran.1': 'Tiga bukti: seluruh mobil, detail kerusakan, dan identitas kendaraan.',
  'akhir.tertunda.pelajaran.2': 'Dokumentasi dulu sebelum perbaikan; kondisi yang sudah diperbaiki tak bisa dilihat lagi.',
  'akhir.tertunda.pelajaran.3': 'Menambah foto sekarang lebih ringan daripada meminta nasabah mengulang nanti.',

  'akhir.pergi.judul': 'Nasabah Pergi',
  'akhir.pergi.ringkas': 'Bu Rina pergi tanpa arah karena merasa diabaikan atau dinilai terlalu cepat.',
  'akhir.pergi.pelajaran.1': 'Jangan menilai kerusakan atau isi polis sebelum melihat dan membacanya.',
  'akhir.pergi.pelajaran.2': 'Mengakui salah baca lebih baik daripada bertahan.',
  'akhir.pergi.pelajaran.3': 'Nasabah yang pergi tanpa arah tidak terbantu, sekecil apa pun kerusakannya.',

  // ------------------------------------------------------------------ kartu akhir v2 (episode.ts KARTU_AKHIR)
  // judul = hasil dari sisi Bu Rina; sebab = satu kalimat sebab-akibat; pelajaran = 15-25 kata (dijaga tes).
  // DRAF materi klaim: dicatat di docs/cerita/TINJAUAN-PIC-CLAIM.md bagian N (belum ditinjau PIC Claim).
  'kartu.tuntas.judul': 'Bu Rina tahu langkah berikutnya',
  'kartu.janji-waktu.judul': 'Bu Rina kecewa setelah dijanjikan besok beres',
  'kartu.janji-polis.judul': 'Bu Rina kecewa setelah dijanjikan pasti diganti',
  'kartu.dingin-singkat.judul': 'Bu Rina pulang belum tahu harus apa',
  'kartu.dingin-aturan.judul': 'Bu Rina pulang belum paham semuanya',
  'kartu.dingin-jarak.judul': 'Bu Rina paham, tetapi belum tenang',
  'kartu.tertunda.judul': 'Laporan Bu Rina perlu dilengkapi belakangan',
  'kartu.pergi.judul': 'Bu Rina pergi sebelum urusannya jelas',

  'kartu.tuntas-ralat-janji.sebab': 'Kamu meluruskan janji yang belum pasti, jadi Bu Rina bisa menyiapkan rencana lain untuk pesanannya besok.',
  'kartu.tuntas-ralat-janji.pelajaran': 'Meluruskan janji memang tidak enak, tetapi informasi yang bisa dipercaya membantu nasabah mengatur rencananya sendiri.',
  'kartu.tuntas-baca-ulang.sebab': 'Kamu mengakui salah baca dan menjelaskan isi kartunya, jadi Bu Rina kembali percaya dan tahu langkah berikutnya.',
  'kartu.tuntas-baca-ulang.pelajaran': 'Salah baca bisa terjadi; mengakuinya lalu menjelaskan isi kartu apa adanya membuat nasabah kembali percaya.',
  'kartu.tuntas-ralat-saran.sebab': 'Kamu meluruskan saranmu sebelum mobil diperbaiki, jadi kerusakannya sempat difoto dan dilaporkan dulu.',
  'kartu.tuntas-ralat-saran.pelajaran': 'Dokumentasi dan laporan sebelum perbaikan menjaga kondisi kerusakan tetap bisa diperiksa, walau nasabah sedang terburu-buru.',
  'kartu.tuntas-lengkapi.sebab': 'Kamu melengkapi foto yang terlewat sebelum Bu Rina pergi, jadi laporannya memuat tiga bukti yang dibutuhkan.',
  'kartu.tuntas-lengkapi.pelajaran': 'Seluruh mobil, detail kerusakan, dan plat nomor: melengkapi foto sekarang lebih ringan daripada meminta nasabah datang lagi.',
  'kartu.tuntas-pulih.sebab': 'Awalnya Bu Rina tegang, tetapi kamu minta maaf dan mendengarkan, jadi ia pulang tahu langkah berikutnya.',
  'kartu.tuntas-pulih.pelajaran': 'Terlalu cepat ke prosedur bisa diperbaiki: akui, tanyakan keadaan nasabah, lalu jelaskan langkahnya dengan jujur.',
  'kartu.tuntas-jelas.sebab': 'Mobilnya belum bisa langsung beres, tetapi Bu Rina tahu apa yang terjadi berikutnya dan menyiapkan rencana lain.',
  'kartu.tuntas-jelas.pelajaran': 'Foto dan laporan membantu pemeriksaan, dan “tercakup sesuai syarat” berarti kerusakan dinilai dulu, bukan otomatis diganti.',

  'kartu.janji-besok.sebab': 'Bu Rina mengandalkan ucapanmu bahwa besok selesai, padahal waktunya belum bisa dipastikan.',
  'kartu.janji-besok.pelajaran': 'Menenangkan nasabah perlu disertai informasi yang bisa dipercaya; waktu dan hasil klaim mengikuti polis dan pemeriksaan.',
  'kartu.janji-awal.sebab': 'Bu Rina mengandalkan janjimu di awal bahwa besok mobilnya bisa dipakai, padahal waktunya belum bisa dipastikan.',
  'kartu.janji-awal.pelajaran': 'Janji yang belum pasti sebaiknya diluruskan sebelum nasabah pergi; kabar tidak enak sekarang lebih ringan daripada kecewa nanti.',
  'kartu.janji-polis.sebab': 'Bu Rina mengandalkan ucapanmu bahwa kerusakannya pasti diganti, padahal kartu hanya menulis tercakup sesuai syarat.',
  'kartu.janji-polis.pelajaran': '“Tercakup sesuai syarat” berarti kerusakan dinilai dulu; sampaikan isi kartu apa adanya, bukan hasil yang belum pasti.',

  'kartu.dingin-singkat.sebab': 'Laporannya tercatat, tetapi “nanti dikabari” belum menjawab apa yang perlu Bu Rina lakukan setelah ini.',
  'kartu.dingin-singkat.pelajaran': 'Tutup layanan dengan ringkasan langkah berikutnya dan siapa yang akan mengabari, supaya nasabah pulang dengan jelas.',
  'kartu.dingin-aturan.sebab': 'Bu Rina disuruh membaca kartu sendiri, jadi ia pulang belum paham kenapa sebagian kerugian tetap ia tanggung.',
  'kartu.dingin-aturan.pelajaran': 'Menunjuk aturan tanpa menjelaskan membuat nasabah merasa sendirian; jelaskan risiko sendiri dengan kata-kata yang sederhana dan jujur.',
  'kartu.dingin-awal.sebab': 'Bu Rina paham langkahnya, tetapi sejak awal ia merasa hanya dianggap formulir, jadi ia belum tenang.',
  'kartu.dingin-awal.pelajaran': 'Tanyakan keadaan dan kebutuhan nasabah lebih dulu; langkah yang tepat lebih mudah diterima bila ia merasa didengar.',
  'kartu.dingin-ralat.sebab': 'Bu Rina paham langkahnya, tetapi penjelasan yang sempat berubah membuatnya belum sepenuhnya tenang.',
  'kartu.dingin-ralat.pelajaran': 'Penjelasan yang tepat sejak awal lebih menenangkan daripada ralat; bila keliru, meluruskannya tetap lebih baik daripada dibiarkan.',
  'kartu.dingin-jarak.sebab': 'Bu Rina paham langkahnya, tetapi ia belum merasa cukup didengar selama percakapan.',
  'kartu.dingin-jarak.pelajaran': 'Langkah yang tepat perlu disampaikan dengan cara yang membuat nasabah merasa didengar, bukan sekadar diberi tahu.',

  'kartu.tertunda-bengkel.sebab': 'Mobil Bu Rina diperbaiki saat buktinya baru foto seadanya, jadi kondisi awalnya tidak bisa difoto ulang untuk melengkapi laporan.',
  'kartu.tertunda-bengkel.pelajaran': 'Foto dan lapor dulu sebelum perbaikan; kondisi kerusakan yang sudah diperbaiki tidak bisa dilihat lagi oleh pemeriksa.',
  'kartu.tertunda-foto.sebab': 'Foto yang terlewat tidak ikut di laporan, jadi Bu Rina perlu meluangkan waktu lagi untuk melengkapinya.',
  'kartu.tertunda-foto.pelajaran': 'Seluruh mobil, detail kerusakan, dan plat nomor: menambah foto yang kurang saat itu juga menghemat waktu nasabah.',

  'kartu.pergi-sepele.sebab': 'Bu Rina merasa masalahnya diremehkan sebelum mobilnya dilihat, jadi ia memilih mengurusnya sendiri.',
  'kartu.pergi-sepele.pelajaran': 'Kerusakan dinilai setelah dilihat dan dicatat, bukan dari cerita; dengarkan dan periksa dulu sebelum menyimpulkan apa pun.',
  'kartu.pergi-bertahan.sebab': 'Kamu bertahan pada bacaan kartu yang tidak sesuai tulisannya, jadi Bu Rina berhenti percaya pada penjelasanmu.',
  'kartu.pergi-bertahan.pelajaran': 'Salah baca bisa terjadi; mengakui lalu membaca ulang kartu lebih menjaga kepercayaan nasabah daripada bertahan pada jawaban.',

  // ================================================================== AKTIVITAS (misi sintetis)
  // --- bukti: parkiran kantor, mobil Bu Rina
  'akt.bukti.judul': 'Tiga Foto untuk Laporan',
  'akt.bukti.produk': 'AUTO - Kendaraan Bermotor',
  'akt.bukti.lokasi': 'Parkiran Kantor Raksa',
  // v2: satu kalimat tugas (instruksi); tanya / petunjuk / briefing / cerita / labelInteraksi tidak saling mengulang.
  'akt.bukti.cerita': 'Mobil Bu Rina disenggol di parkiran pasar tadi pagi. Bemper dan lampu belakangnya penyok dan retak.',
  'akt.bukti.instruksi': 'Pilih 3 foto yang membantu pemeriksa.',
  'akt.bukti.labelInteraksi': 'Foto bukti untuk laporan',
  'akt.bukti.pelajaran': 'Bukti harus membantu menghubungkan kendaraan, lokasi kerusakan, dan kejadian.',
  'akt.bukti.briefing': 'Yang menarik belum tentu berguna untuk laporan.',
  'akt.bukti.tanya': 'Foto mana yang masuk laporan Bu Rina?',
  'akt.bukti.petunjuk': 'Pikirkan yang perlu dilihat pemeriksa: mobil yang mana, dan rusaknya di mana.',
  'akt.bukti.opsi.foto-menu': 'Brosur menu katering di kaca',
  'akt.bukti.opsi.foto-full': 'Foto seluruh mobil',
  'akt.bukti.opsi.foto-ban': 'Foto dekat ban depan',
  'akt.bukti.opsi.foto-penyok': 'Foto dekat bemper & lampu belakang',
  'akt.bukti.opsi.foto-dasbor': 'Foto dasbor dari jendela',
  'akt.bukti.opsi.foto-plat': 'Foto plat nomor',
  'akt.bukti.bahas.bukti':
    'Foto seluruh mobil menunjukkan kondisi kendaraan, foto dekat bemper & lampu belakang menunjukkan titik kerusakan, dan plat nomor memastikan mobil yang diperiksa benar. Ban depan dan dasbor tidak menunjukkan titik kerusakan di belakang maupun identitas mobil, dan brosur tidak berkaitan dengan kejadian. Ketiganya tidak membantu pemeriksaan.',
  'akt.bukti.ringkasan': 'Tiga bukti yang menghubungkan kendaraan, titik kerusakan, dan identitasnya.',
  'akt.bukti.kirim': 'Pakai foto ini',
  // Alasan per foto (v2), tampil SETELAH dikirim; diturunkan dari akt.bukti.bahas.bukti.
  'akt.bukti.alasan.foto-menu': 'Brosur tidak berkaitan dengan kejadian.',
  'akt.bukti.alasan.foto-full': 'Menunjukkan kondisi kendaraan secara utuh.',
  'akt.bukti.alasan.foto-ban': 'Ban depan tidak menunjukkan titik kerusakan di belakang maupun identitas mobil.',
  'akt.bukti.alasan.foto-penyok': 'Menunjukkan titik kerusakan di bemper dan lampu belakang.',
  'akt.bukti.alasan.foto-dasbor': 'Dasbor tidak menunjukkan titik kerusakan maupun identitas mobil.',
  'akt.bukti.alasan.foto-plat': 'Memastikan mobil yang diperiksa memang mobil Bu Rina.',

  // --- polis: meja layanan, kartu polis Bu Rina
  'akt.polis.judul': 'Kartu Polis Bu Rina',
  'akt.polis.produk': 'AUTO - Kendaraan Bermotor',
  'akt.polis.lokasi': 'Meja Layanan {lokasi}',
  'akt.polis.cerita': 'Bu Rina bertanya apakah polisnya bisa dipakai untuk bemper dan lampu belakang yang penyok dan retak.',
  'akt.polis.instruksi': 'Pilih penjelasan yang sesuai dengan isi kartu.',
  'akt.polis.labelInteraksi': 'Satu penjelasan untuk Bu Rina',
  'akt.polis.pelajaran': 'Jaminan mengikuti kartu polis. Baca kartunya dulu sebelum menjelaskan ke nasabah.',
  'akt.polis.briefing': 'Kartu polis adalah pegangan penjelasanmu.',
  'akt.polis.tanya': 'Apa yang kamu sampaikan ke Bu Rina?',
  'akt.polis.petunjuk': 'Baris “Kerusakan benturan” menjawab pertanyaan Bu Rina.',
  // v2: tiga opsi (ambang-tlo pensiun); panjangnya diseimbangkan, jawaban tepat bukan yang terpanjang.
  'akt.polis.opsi.pasti-diganti': 'Di kartu Ibu tertulis “tercakup”, jadi kerusakan bemper dan lampu belakangnya pasti diganti.',
  'akt.polis.opsi.tidak-tercakup': 'Kerusakan kecil seperti penyok dan retak ini tidak tercakup di polis Ibu.',
  'akt.polis.opsi.bisa-dinilai': 'Kerusakan ini bisa dilanjutkan untuk dinilai sesuai syarat kartu polis Ibu.',
  // Alasan per opsi (v2), tampil SETELAH dikirim; diturunkan dari akt.polis.bahas.penjelasan.
  'akt.polis.alasan.pasti-diganti': '“Tercakup” belum berarti pasti diganti; hasilnya menunggu penilaian.',
  'akt.polis.alasan.tidak-tercakup': 'Bertentangan dengan kartu, yang menulis kerusakan benturan tercakup sesuai syarat kartu.',
  'akt.polis.alasan.bisa-dinilai': 'Sesuai kartu: kerusakan benturan tercakup sesuai syarat, jadi bisa dilanjutkan untuk dinilai.',
  'akt.polis.kartu.judul': 'Kartu Polis Bu Rina',
  'akt.polis.kartu.sub': 'Comprehensive (simulasi)',
  'akt.polis.kartu.kendaraan.label': 'Kendaraan & plat',
  'akt.polis.kartu.kendaraan.nilai': 'Minibus keluarga · B 1726 RN',
  'akt.polis.kartu.benturan.label': 'Kerusakan benturan',
  'akt.polis.kartu.benturan.nilai': 'Tercakup sesuai syarat kartu',
  'akt.polis.kartu.status.label': 'Status polis',
  'akt.polis.kartu.status.nilai': 'Aktif',
  'akt.polis.kartu.risiko.label': 'Risiko sendiri',
  'akt.polis.kartu.risiko.nilai': 'Berlaku sesuai ketentuan polis',
  'akt.polis.kartu.catatan': 'Kartu simulasi untuk latihan. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.',
  // Arti awam kartu (v2), dibuka dengan mengetuk/menekan baris kartu; hanya dalam cakupan m02/m05/m09.
  'akt.polis.kartu.sub.arti': 'Nama jenis polis ini (simulasi). Apa saja yang dilindungi dibaca dari baris-baris kartu di bawahnya.',
  'akt.polis.kartu.kendaraan.arti': 'Mobil yang dilindungi kartu ini. Foto plat nomor memastikan mobil yang diperiksa memang mobil ini.',
  'akt.polis.kartu.benturan.arti': 'Kerusakan karena benturan, misalnya disenggol, termasuk yang dilindungi. “Sesuai syarat kartu” berarti dinilai dulu, bukan otomatis diganti.',
  'akt.polis.kartu.status.arti': 'Aktif berarti perlindungan di kartu ini sedang berlaku.',
  'akt.polis.kartu.risiko.arti': 'Bagian kerugian yang tetap ditanggung Bu Rina sendiri. Besarnya mengikuti ketentuan polis, tidak tertulis di kartu ini.',
  'akt.polis.bahas.penjelasan': 'Kartu menyatakan kerusakan benturan tercakup sesuai syarat kartu, jadi kerusakan ini bisa dilanjutkan untuk dinilai. “Tercakup” belum berarti “pasti diganti”: hasilnya menunggu penilaian. “Tidak tercakup” bertentangan dengan kartu.',
  'akt.polis.ringkasan': 'Kartu Comprehensive: kerusakan benturan bisa dilanjutkan untuk dinilai sesuai syarat kartu, bukan pasti diganti.',
  'akt.polis.kirim': 'Sampaikan ke Bu Rina',

  // ================================================================== PENSIUN (tidak dipakai naskah v2)
  // JANGAN dihapus: Riwayat & hasil aktivitas dari simpanan lama masih merujuk kunci ini (tanpa menaikkan versi
  // episode; simpan.ts menjepit `baris`). Teks = kalimat terakhir sebelum dipensiunkan. Daftar: KUNCI_PENSIUN.
  'b1-mentor.2': 'Tugas kita: dengarkan nasabah, kumpulkan info dan bukti, lalu jelaskan langkah berikutnya.',
  'b1-mentor.3': 'Oh ya, ini simulasi. Klaim sebenarnya tetap mengikuti polis dan pemeriksaan Raksa.',
  'b2-cerita.4': 'Saya belanja sebentar. Pas balik, bemper sudah penyok dan yang nyenggol sudah pergi.',
  'b2-singkat.1': 'Disenggol di parkiran pasar tadi pagi. Orangnya pergi.',
  'b3-bukti-intro.4': 'Tiga foto saja, {nama}. Apa yang perlu dilihat pemeriksa untuk memastikan mobil dan kerusakannya?',
  // Opsi kartu polis (ambang 75% / TLO) di luar materi episode; perbandingan Comprehensive vs TLO ada di misi 5.
  'akt.polis.opsi.ambang-tlo': 'Sesuai syarat kartu, kerusakan ini baru dijamin bila mencapai 75% nilai mobil.',
  // v2: umpan balik foto per bukti -> satu kalimat mentor; alasan per foto kini di panel (akt.bukti.alasan.*).
  'b3-bukti.hasil.2.1': 'Foto seluruh mobil belum ada. Itu yang menunjukkan kondisi kendaraan secara utuh.',
  'b3-bukti.hasil.2.2': 'Detail bemper dan lampu belakang belum terpotret. Di situlah titik kerusakannya.',
  'b3-bukti.hasil.2.3': 'Plat nomor belum terpotret. Tanpa itu, sulit memastikan mobil mana yang diperiksa.',
};

/** Kunci teks yang dipensiunkan di revisi v2 (tetap ada di id/en/zh untuk simpanan lama; tidak dirujuk graf). */
export const KUNCI_PENSIUN: readonly string[] = [
  'b1-mentor.2', 'b1-mentor.3', 'b2-cerita.4', 'b2-singkat.1', 'b3-bukti-intro.4', 'akt.polis.opsi.ambang-tlo',
  'b3-bukti.hasil.2.1', 'b3-bukti.hasil.2.2', 'b3-bukti.hasil.2.3',
];
