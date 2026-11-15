/**
 * SYNTHETIC DEMO scenario 2 of 2 (Auto). NOT a settled case, NOT approved by the joint committee. Coverage statements
 * are deliberately conditional ("tergantung polis"): whether flood damage is covered depends on the actual policy and
 * its extensions, which only official content may state. See docs/prd-v02/CONTENT-HANDOFF.md.
 */
import { buildDemo, type DemoScenario } from './builder';

export const DEMO_BANJIR: DemoScenario = {
  title: '[DEMO] Mobil Terendam Banjir',
  synopsis:
    'Hujan deras semalam. Air masuk ke kompleks rumah Bu Rina dan merendam mobilnya setinggi roda. Bantu ia mengambil langkah yang aman dan memahami klaimnya sampai tuntas. (Konten DEMO sintetis: kunci jawaban belum ditetapkan komite.)',
  difficulty: 2,
  initialMood: 15,
  rounds: [
    {
      title: 'Telepon darurat',
      bg: 'telepon',
      lines: [
        ['narrator', 'Pukul enam pagi, telepon layanan Raksa berdering.'],
        ['customer', 'Mobil saya terendam banjir! Airnya sudah surut sedikit. Saya nyalakan saja ya, biar bisa dipindah?'],
      ],
      variants: { sangat_kecewa: 'Suara Bu Rina panik dan terengah-engah.' },
      prompt: 'Apa jawaban pertamamu?',
      choices: [
        ['keliru', 0, -12, 'Silakan dinyalakan dan pindahkan ke tempat yang lebih tinggi.', 'Mesin tersendat lalu mati. Kerusakan mesin bisa bertambah parah karena air.', 'Menyalakan mesin yang terendam air berisiko memperparah kerusakan mesin. Arahan pertama harus mencegah kerusakan bertambah.'],
        ['tepat', 1, 10, 'Pastikan Bu Rina dan keluarga aman, minta mobil JANGAN dinyalakan, lalu jelaskan langkah berikutnya.', 'Bu Rina menahan diri dan tidak menyalakan mobil. "Untung saya telepon dulu," katanya, mulai lebih tenang.', 'Keselamatan orang nomor satu. Mesin yang terendam sebaiknya tidak dinyalakan agar kerusakan tidak bertambah.'],
        ['kurang_tepat', 0.5, 2, 'Minta mobil jangan dinyalakan, tanpa menanyakan keadaan Bu Rina.', 'Mobil aman dari kerusakan tambahan, tapi Bu Rina merasa kamu hanya peduli pada mobilnya.', 'Arahan teknisnya tepat, tetapi menanyakan keselamatan orang lebih dulu menunjukkan empati dan prioritas yang benar.'],
        ['keliru', 0, -8, 'Bilang kantor belum buka, telepon lagi jam sembilan.', 'Bu Rina mencoba menyalakan mobil sendiri sambil menunggu. Mesinnya mati.', 'Situasi darurat butuh arahan segera; menunda bisa membuat customer mengambil langkah yang merugikan.'],
        ['kurang_tepat', 0.4, 1, 'Sarankan Bu Rina bertanya ke tetangga yang paham mesin.', 'Tetangga memberi saran berbeda-beda. Bu Rina makin bingung.', 'Saran dari pihak lain tidak terkendali. Petugas sebaiknya memberi arahan yang jelas dan aman.'],
      ],
      timeout: [-8, 'Telepon hening terlalu lama. Bu Rina hampir menyalakan mobilnya sendiri.', 'Dalam keadaan darurat, jawaban cepat dan jelas sangat penting.'],
    },
    {
      title: 'Foto di lokasi',
      bg: 'telepon',
      lines: [
        ['customer', 'Saya harus apa sekarang? Airnya masih ada sedikit di jalan.'],
        ['officer', 'Bukti kondisi awal sangat membantu, asalkan diambil dengan aman.'],
      ],
      prompt: 'Apa yang kamu minta Bu Rina lakukan?',
      choices: [
        ['tepat', 1, 8, 'Bila aman, foto mobil dan bekas tinggi air dari beberapa sudut tanpa masuk ke air dalam.', 'Bu Rina memotret garis bekas air di pintu dan ban. Foto-foto ini nanti sangat membantu.', 'Foto bekas tinggi air dan posisi mobil adalah bukti awal yang penting. Keselamatan tetap didahulukan.'],
        ['keliru', 0, -9, 'Minta Bu Rina masuk ke mobil dan memotret dasbor yang terendam.', 'Bu Rina terpeleset di air keruh. Untungnya hanya lecet.', 'Mendorong customer masuk ke area banjir membahayakan keselamatannya. Bukti tidak boleh mengorbankan keamanan.'],
        ['kurang_tepat', 0.5, 2, 'Minta satu foto mobil saja.', 'Fotonya tidak memperlihatkan seberapa tinggi air merendam mobil.', 'Satu foto sering tidak cukup menunjukkan tingkat rendaman; bekas tinggi air perlu terlihat.'],
        ['keliru', 0, -6, 'Bilang foto tidak perlu karena surveyor akan datang.', 'Saat surveyor datang, air sudah surut dan bekasnya mulai pudar.', 'Kondisi awal cepat berubah. Dokumentasi segera membantu pemeriksaan nanti.'],
        ['kurang_tepat', 0.5, 3, 'Minta foto dari beberapa sudut, tapi tidak mengingatkan soal keselamatan.', 'Fotonya bagus, tapi Bu Rina sempat berdiri di genangan dekat kabel listrik.', 'Instruksi dokumentasi perlu disertai pengingat keselamatan di area banjir.'],
      ],
      timeout: [-5, 'Bu Rina menunggu instruksi tanpa jawaban. Bekas air mulai mengering.', 'Bukti kondisi awal berumur pendek; arahan cepat itu penting.'],
    },
    {
      title: 'Memindahkan mobil',
      bg: 'telepon',
      lines: [
        ['customer', 'Satpam kompleks menawarkan mendorong mobil saya ke jalan yang lebih tinggi.'],
        ['officer', 'Cara memindahkan mobil yang terendam juga menentukan kondisinya.'],
      ],
      variants: { kecewa: 'Bu Rina terdengar ragu dan lelah.', tenang: 'Bu Rina bertanya dengan lebih tenang sekarang.' },
      prompt: 'Apa saranmu?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Boleh didorong, asal mesinnya tidak dinyalakan.', 'Mobil berhasil dipindah, tapi Bu Rina tidak tahu ada layanan derek yang mungkin tersedia di polisnya.', 'Tidak menyalakan mesin sudah benar, tetapi customer juga perlu tahu pilihan derek sesuai ketentuan polisnya.'],
        ['tepat', 1, 9, 'Cek apakah polisnya punya layanan derek, bantu atur derek bila tersedia, dan pastikan mesin tetap tidak dinyalakan.', 'Derek datang dua jam kemudian. Bu Rina tidak perlu mengeluarkan biaya tambahan.', 'Memeriksa fasilitas di polis dan membantu mengaturnya mencegah kerusakan tambahan dan biaya yang tidak perlu.'],
        ['keliru', 0, -10, 'Sarankan mesin dinyalakan sebentar saja supaya bisa jalan sendiri.', 'Mesin mati di tengah jalan. Kerusakan bertambah.', 'Menyalakan mesin yang terendam berisiko merusak mesin, meski hanya sebentar.'],
        ['keliru', 0, -6, 'Bilang terserah Bu Rina saja.', 'Bu Rina bingung harus memutuskan sendiri dalam keadaan panik.', 'Customer membutuhkan arahan, bukan diserahkan sepenuhnya, terutama saat panik.'],
        ['kurang_tepat', 0.4, 1, 'Sarankan memanggil derek swasta tanpa memeriksa polisnya.', 'Derek datang, tapi Bu Rina harus membayar sendiri.', 'Sebelum menyarankan layanan berbayar, cek dulu fasilitas yang mungkin tersedia di polis customer.'],
      ],
      timeout: [-6, 'Tanpa arahan, satpam hampir menyalakan mesin untuk memindahkan mobil.', 'Arahan yang terlambat bisa berujung kerusakan tambahan.'],
    },
    {
      title: 'Membuat laporan klaim',
      bg: 'meja',
      lines: [
        ['narrator', 'Siang harinya Bu Rina datang ke kantor.'],
        ['customer', 'Kata tetangga, klaim banjir harus cepat dilaporkan. Benar?'],
      ],
      prompt: 'Bagaimana kamu memulai laporan klaimnya?',
      choices: [
        ['tepat', 1, 8, 'Catat laporan hari ini juga, termasuk waktu kejadian dan kronologi, lalu jelaskan batas waktu pelaporan di polisnya.', 'Laporan tercatat lengkap hari itu. Bu Rina lega prosesnya sudah dimulai.', 'Melaporkan segera dan mencatat kronologi lengkap menjaga hak customer dan memperlancar proses.'],
        ['keliru', 0, -7, 'Bilang tidak perlu buru-buru, minggu depan juga bisa.', 'Bu Rina menunda, lalu khawatir terlambat melapor.', 'Ketentuan waktu pelaporan bisa berlaku. Petugas harus mengecek polis, bukan menebak.'],
        ['kurang_tepat', 0.5, 2, 'Catat laporan, tapi tidak menjelaskan apakah ada batas waktu.', 'Laporan tercatat, tapi Bu Rina masih cemas soal batas waktu.', 'Mencatat laporan sudah benar; menjelaskan aturan waktu di polis menghapus kecemasan customer.'],
        ['keliru', 0, -8, 'Minta Bu Rina mengisi laporan online sendiri di rumah.', 'Bu Rina sudah jauh-jauh datang. Ia pulang dengan kecewa.', 'Customer yang datang langsung sebaiknya dilayani saat itu; kanal online adalah pilihan, bukan pengusiran.'],
        ['kurang_tepat', 0.5, 3, 'Catat laporan singkat dan janjikan detailnya menyusul.', 'Laporan dibuat, tapi kronologinya terlalu ringkas.', 'Laporan awal yang ringkas sering perlu dilengkapi lagi; lebih baik lengkap sejak awal.'],
      ],
      timeout: [-5, 'Bu Rina menunggu di depan meja. Laporan belum juga dibuat.', 'Laporan klaim sebaiknya segera dibuat saat customer datang.'],
    },
    {
      title: 'Apakah banjir dijamin?',
      bg: 'meja',
      lines: [
        ['customer', 'Jadi banjir dijamin, kan? Saya bayar asuransi tiap tahun.'],
        ['officer', 'Kerusakan karena banjir bergantung pada jenis polis dan perluasan jaminannya. Periksa, jangan menebak.'],
      ],
      variants: { sangat_kecewa: 'Bu Rina memandangmu curiga, siap mendengar kata "tidak".', senang: 'Bu Rina bertanya sambil tersenyum penuh harap.' },
      prompt: 'Bagaimana kamu menjawab?',
      choices: [
        ['keliru', 0, -10, 'Jawab "pasti dijamin" supaya Bu Rina tenang.', 'Bu Rina tenang sesaat. Janji itu bisa berbalik jika polisnya tidak memuat perluasan banjir.', 'Menjanjikan jaminan sebelum memeriksa polis menimbulkan kekecewaan besar bila ternyata tidak dijamin.'],
        ['keliru', 0, -9, 'Jawab "banjir tidak pernah dijamin" tanpa melihat polis.', 'Bu Rina hampir membatalkan klaim yang mungkin sebenarnya dijamin.', 'Menolak tanpa memeriksa polis sama kelirunya dengan menjanjikan; keputusan harus berdasarkan isi polis.'],
        ['tepat', 1, 9, 'Periksa polisnya bersama, jelaskan apakah ada perluasan jaminan banjir, dan apa artinya untuk kasus ini.', 'Bu Rina melihat sendiri bagian perluasan jaminan di polisnya. Ia paham dasar klaimnya.', 'Jaminan banjir mengikuti isi polis. Memeriksanya bersama customer memberi kepastian dan mencegah salah paham.'],
        ['kurang_tepat', 0.5, 2, 'Bilang akan dicek dulu tanpa memberi waktu kapan kabarnya.', 'Bu Rina menunggu dua hari tanpa kepastian.', 'Mengecek dulu itu benar, tetapi customer perlu tahu kapan ia akan mendapat jawaban.'],
        ['kurang_tepat', 0.5, 3, 'Jelaskan secara umum bahwa banjir bisa dijamin jika ada perluasan, tanpa memeriksa polis Bu Rina.', 'Bu Rina mengerti konsepnya, tapi belum tahu apakah polisnya sendiri memuat perluasan itu.', 'Penjelasan umum membantu, tetapi jawaban harus spesifik pada polis milik customer.'],
      ],
      timeout: [-6, 'Pertanyaan terpenting Bu Rina tidak terjawab. Ia mulai menebak-nebak sendiri.', 'Pertanyaan soal jaminan harus dijawab berdasarkan polis, dengan jelas.'],
    },
    {
      title: 'Dokumen pendukung',
      bg: 'meja',
      lines: [
        ['customer', 'Dokumen apa saja yang harus saya siapkan?'],
        ['officer', 'Beri daftar yang jelas sesuai kejadiannya supaya tidak bolak-balik.'],
      ],
      prompt: 'Apa yang kamu lakukan?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Sebutkan dokumennya secara lisan.', 'Di rumah, Bu Rina lupa dua dokumen yang kamu sebutkan.', 'Daftar lisan mudah terlupa; daftar tertulis membantu customer menyiapkan semuanya.'],
        ['tepat', 1, 8, 'Beri daftar tertulis dokumen sesuai kejadian banjir, tandai yang sudah ada, dan jelaskan cara mengirim yang belum ada.', 'Bu Rina melengkapi dokumen dalam sekali kirim.', 'Daftar tertulis yang disesuaikan dengan kejadian mempercepat kelengkapan dan mengurangi bolak-balik.'],
        ['keliru', 0, -7, 'Minta semua dokumen yang mungkin pernah dibutuhkan, untuk berjaga-jaga.', 'Bu Rina kewalahan mengumpulkan dokumen yang sebagian tidak perlu.', 'Meminta dokumen yang tidak relevan membebani customer dan memperlambat proses.'],
        ['keliru', 0, -6, 'Bilang dokumen bisa menyusul kapan saja, tidak ada batasnya.', 'Bu Rina santai, lalu prosesnya tertahan karena dokumen belum masuk.', 'Customer perlu tahu bahwa kelengkapan dokumen memengaruhi kecepatan proses.'],
        ['kurang_tepat', 0.5, 3, 'Beri daftar tertulis umum untuk semua klaim kendaraan.', 'Daftarnya membantu, tapi ada dokumen yang tidak relevan untuk banjir.', 'Daftar umum lebih baik daripada lisan, tetapi menyesuaikannya dengan kejadian lebih jelas.'],
      ],
      timeout: [-5, 'Bu Rina pulang tanpa daftar dokumen.', 'Customer perlu daftar dokumen yang jelas sebelum pulang.'],
    },
    {
      title: 'Perkiraan waktu proses',
      bg: 'meja',
      lines: [
        ['narrator', 'Banyak mobil di kota terendam. Laporan klaim sedang menumpuk.'],
        ['customer', 'Berapa lama sampai mobil saya beres?'],
      ],
      prompt: 'Bagaimana kamu menjawab?',
      choices: [
        ['tepat', 1, 9, 'Jelaskan jujur bahwa antrean sedang tinggi, beri perkiraan tahapan dan waktunya, serta janjikan kabar berkala.', 'Bu Rina kecewa antreannya panjang, tapi menghargai kejujuranmu dan tahu kapan akan dikabari.', 'Perkiraan waktu yang jujur, termasuk kendala yang ada, lebih dihargai daripada janji cepat yang tidak terpenuhi.'],
        ['keliru', 0, -9, 'Janjikan selesai dalam tiga hari supaya Bu Rina senang.', 'Tiga hari berlalu, survei saja belum. Bu Rina merasa dibohongi.', 'Janji waktu yang tidak realistis merusak kepercayaan saat tidak terpenuhi.'],
        ['kurang_tepat', 0.5, 2, 'Bilang "tergantung" tanpa penjelasan lebih lanjut.', 'Bu Rina tidak mendapat gambaran apa pun.', 'Waktu memang bergantung pada banyak hal, tetapi customer tetap perlu gambaran tahapan dan perkiraannya.'],
        ['keliru', 0, -7, 'Sarankan Bu Rina mencari kenalan di kantor supaya didahulukan.', 'Miss Raksa menegurmu: semua customer harus diperlakukan adil.', 'Mendahulukan karena kenalan tidak adil dan melanggar prinsip layanan yang setara.'],
        ['kurang_tepat', 0.5, 3, 'Beri perkiraan waktu tanpa menyebut bahwa antrean sedang tinggi.', 'Perkiraanmu meleset karena antrean. Bu Rina bingung kenapa lebih lama.', 'Memberi perkiraan sudah baik, tetapi menyebut kendala yang diketahui membuat harapan lebih realistis.'],
      ],
      timeout: [-6, 'Pertanyaan Bu Rina soal waktu tidak terjawab. Ia membayangkan yang terburuk.', 'Customer berhak mendapat gambaran waktu proses.'],
    },
    {
      title: 'Survei kerusakan',
      bg: 'parkiran',
      lines: [
        ['narrator', 'Surveyor memeriksa mobil Bu Rina di parkiran.'],
        ['customer', 'Saya boleh lihat juga, kan? Saya mau tahu apa saja yang rusak.'],
      ],
      variants: { tenang: 'Bu Rina memperhatikan dengan saksama.', kecewa: 'Bu Rina berdiri agak jauh dengan wajah murung.' },
      prompt: 'Bagaimana kamu melibatkan Bu Rina saat survei?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Biarkan Bu Rina melihat, tapi tidak menjelaskan apa yang diperiksa.', 'Bu Rina melihat surveyor membuka kap mesin, tapi tidak mengerti apa artinya.', 'Melibatkan customer itu baik, tetapi penjelasan membuatnya paham apa yang sedang terjadi.'],
        ['tepat', 1, 8, 'Ajak Bu Rina melihat, jelaskan bagian yang diperiksa (mesin, interior, kelistrikan) dengan bahasa sederhana, dan jawab pertanyaannya.', 'Bu Rina paham kenapa interior dan kelistrikan ikut diperiksa. Ia merasa dilibatkan.', 'Keterlibatan dan penjelasan sederhana selama pemeriksaan membangun kepercayaan pada hasil survei.'],
        ['keliru', 0, -7, 'Minta Bu Rina menunggu di dalam, survei bukan urusannya.', 'Bu Rina merasa disembunyikan sesuatu. Ia curiga pada hasilnya nanti.', 'Mengeluarkan customer dari proses tanpa alasan menimbulkan kecurigaan.'],
        ['keliru', 0, -8, 'Sampaikan hasil sementara sebelum survei selesai.', 'Hasil akhirnya ternyata berbeda. Bu Rina bingung mana yang benar.', 'Hasil sementara sebelum pemeriksaan selesai bisa menyesatkan; sampaikan hasil setelah pemeriksaan tuntas.'],
        ['kurang_tepat', 0.5, 3, 'Jelaskan pemeriksaannya, tapi gunakan istilah teknis.', 'Bu Rina mengangguk-angguk, tapi sebenarnya tidak paham.', 'Penjelasan perlu memakai bahasa sehari-hari agar benar-benar dipahami customer awam.'],
      ],
      timeout: [-5, 'Survei berjalan tanpa penjelasan. Bu Rina menonton dari jauh dengan cemas.', 'Customer yang dilibatkan lebih mudah menerima hasil pemeriksaan.'],
    },
    {
      title: 'Hasil survei: kerusakan berat',
      bg: 'parkiran',
      lines: [
        ['narrator', 'Surveyor menemukan kerusakan cukup berat pada mesin dan kelistrikan.'],
        ['customer', 'Mobil saya masih bisa diperbaiki atau tidak?'],
      ],
      prompt: 'Bagaimana kamu menyampaikan hasil ini?',
      choices: [
        ['keliru', 0, -9, 'Bilang mobilnya pasti diganti baru.', 'Bu Rina sudah berharap mobil baru. Keputusan akhirnya berbeda dan ia kecewa berat.', 'Keputusan perbaikan atau penggantian mengikuti penilaian dan ketentuan polis; jangan menjanjikan hasil sebelum diputuskan.'],
        ['tepat', 1, 9, 'Jelaskan temuan dengan jujur, sebutkan bahwa ada penilaian apakah diperbaiki atau dihitung kerugian total, dan kapan keputusannya keluar.', 'Bu Rina cemas, tapi paham ada dua kemungkinan dan kapan ia akan tahu hasilnya.', 'Menjelaskan kemungkinan hasil dan dasar penilaiannya secara jujur menyiapkan customer menghadapi keputusan.'],
        ['kurang_tepat', 0.5, 2, 'Bilang kerusakannya berat, nanti dikabari keputusannya.', 'Bu Rina pulang dengan cemas karena tidak tahu apa artinya "berat".', 'Kejujuran sudah ada, tetapi customer perlu tahu kemungkinan langkah dan kapan keputusan keluar.'],
        ['keliru', 0, -7, 'Bilang "pasrah saja, Bu".', 'Bu Rina merasa ditinggalkan di saat paling sulit.', 'Kalimat yang meremehkan menghilangkan harapan dan kepercayaan customer.'],
        ['kurang_tepat', 0.5, 3, 'Jelaskan semua istilah penilaian kerugian secara rinci.', 'Bu Rina mendengar banyak istilah dan sulit menangkap intinya.', 'Rincian berguna, tetapi intinya (kemungkinan hasil dan waktunya) harus jelas lebih dulu.'],
      ],
      timeout: [-6, 'Bu Rina menunggu jawaban. Diammu membuatnya membayangkan mobilnya hilang.', 'Kabar sulit tetap perlu disampaikan dengan jelas dan tepat waktu.'],
    },
    {
      title: 'Keputusan perbaikan',
      bg: 'meja',
      lines: [
        ['narrator', 'Penilaian selesai: mobil diputuskan diperbaiki, dengan beberapa komponen kelistrikan diganti.'],
        ['customer', 'Syukurlah. Jadi apa saja yang diganti, dan apa yang saya tanggung?'],
      ],
      prompt: 'Bagaimana kamu menjelaskan keputusan ini?',
      choices: [
        ['tepat', 1, 9, 'Jelaskan rincian perbaikan, bagian yang dijamin, biaya yang menjadi tanggungan Bu Rina menurut polis, dan dasarnya, secara tertulis.', 'Bu Rina menerima rincian tertulis dan tahu persis apa yang ia tanggung. Tidak ada kejutan.', 'Rincian tertulis tentang apa yang dijamin dan yang ditanggung customer mencegah sengketa di akhir.'],
        ['kurang_tepat', 0.5, 2, 'Sebutkan bahwa mobil diperbaiki, rinciannya bisa ditanyakan ke bengkel.', 'Bu Rina harus bertanya lagi ke bengkel dan mendapat jawaban berbeda.', 'Customer sebaiknya menerima rincian keputusan dari pihak yang memutuskan, bukan dioper ke pihak lain.'],
        ['keliru', 0, -8, 'Jangan sebut biaya yang ditanggung Bu Rina supaya ia tetap senang.', 'Saat mengambil mobil, Bu Rina kaget harus membayar.', 'Biaya yang disembunyikan sampai akhir terasa seperti jebakan.'],
        ['keliru', 0, -7, 'Bilang keputusannya sudah final dan tidak bisa ditanyakan.', 'Bu Rina merasa tidak dihargai dan berniat mengajukan keluhan.', 'Customer berhak bertanya dan memahami dasar keputusan klaimnya.'],
        ['kurang_tepat', 0.5, 3, 'Jelaskan rinciannya secara lisan saja.', 'Bu Rina paham saat itu, tapi lupa sebagian di rumah.', 'Penjelasan lisan baik, tetapi rincian tertulis membantu customer mengingat dan memeriksa.'],
      ],
      timeout: [-5, 'Pertanyaan Bu Rina soal rincian tidak terjawab.', 'Rincian keputusan perlu dijelaskan saat customer menanyakannya.'],
    },
    {
      title: 'Barang pribadi di mobil',
      bg: 'meja',
      lines: [
        ['customer', 'Di dalam mobil ada laptop dan kardus berisi peralatan katering. Itu juga diganti, kan?'],
        ['officer', 'Polis kendaraan biasanya fokus pada kendaraannya. Cek dan jelaskan dengan jujur.'],
      ],
      variants: { sangat_kecewa: 'Bu Rina sudah menduga jawabannya dan terlihat murung.', tenang: 'Bu Rina bertanya dengan nada biasa.' },
      prompt: 'Bagaimana kamu menjawab?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Bilang barang pribadi tidak dijamin, tanpa menunjukkan dasarnya di polis.', 'Bu Rina menerima, tapi merasa jawabanmu asal.', 'Jawabannya mungkin benar, tetapi menunjukkan dasar di polis membuat customer percaya bahwa itu bukan keputusan sepihak.'],
        ['keliru', 0, -9, 'Janjikan laptop ikut diganti supaya Bu Rina tidak kecewa.', 'Belakangan ternyata tidak dijamin. Bu Rina merasa ditipu.', 'Menjanjikan hal di luar polis selalu berakhir dengan kekecewaan yang lebih besar.'],
        ['tepat', 1, 8, 'Periksa polisnya, jelaskan dengan jujur apa yang dijamin untuk kendaraan dan barang di dalamnya, lalu sarankan cek asuransi lain yang mungkin ia punya.', 'Bu Rina kecewa soal laptopnya, tapi menghargai kejujuranmu dan teringat ia punya asuransi lain.', 'Kejujuran tentang batas jaminan, disertai saran yang membantu, menjaga kepercayaan walau jawabannya tidak menyenangkan.'],
        ['keliru', 0, -7, 'Alihkan pembicaraan ke topik lain.', 'Bu Rina sadar pertanyaannya dihindari dan jadi curiga.', 'Menghindari pertanyaan sulit merusak kepercayaan.'],
        ['kurang_tepat', 0.5, 3, 'Bilang akan ditanyakan ke atasan, lalu kabari keesokan harinya.', 'Keesokan harinya Bu Rina mendapat jawaban yang jelas, meski harus menunggu.', 'Memastikan jawaban itu baik, tetapi hal yang bisa dicek di polis sebaiknya dijawab langsung.'],
      ],
      timeout: [-6, 'Pertanyaan soal barang pribadi tidak terjawab. Bu Rina berharap semuanya diganti.', 'Harapan yang tidak diluruskan akan berujung kecewa.'],
    },
    {
      title: 'Antrean bengkel',
      bg: 'telepon',
      lines: [
        ['narrator', 'Bengkel penuh oleh mobil-mobil korban banjir.'],
        ['customer', 'Sudah seminggu mobil saya belum dikerjakan. Kenapa?'],
      ],
      prompt: 'Apa yang kamu lakukan?',
      choices: [
        ['keliru', 0, -9, 'Bilang semua bengkel juga penuh, sabar saja.', 'Bu Rina merasa tidak ada yang memperjuangkan kepentingannya.', 'Customer butuh informasi dan tindakan, bukan sekadar disuruh bersabar.'],
        ['tepat', 1, 9, 'Cek status ke bengkel, sampaikan posisi antrean dan perkiraan mulai dikerjakan, lalu jadwalkan kabar berikutnya.', 'Bu Rina tahu mobilnya di urutan ke berapa dan kapan akan dikerjakan. Ia lebih tenang.', 'Informasi konkret tentang posisi dan perkiraan waktu mengubah menunggu tanpa kepastian menjadi menunggu dengan rencana.'],
        ['kurang_tepat', 0.5, 2, 'Minta maaf dan bilang akan dicek.', 'Bu Rina menunggu kabar lagi tanpa tahu kapan.', 'Permintaan maaf dan janji mengecek perlu dilengkapi waktu kapan customer akan dikabari.'],
        ['keliru', 0, -7, 'Sarankan Bu Rina memindahkan mobil ke bengkel lain sendiri.', 'Pemindahan tanpa koordinasi membuat proses klaim kacau.', 'Perpindahan bengkel perlu koordinasi agar proses klaim tidak terganggu.'],
        ['kurang_tepat', 0.5, 3, 'Cek status dan sampaikan perkiraan, tanpa menjadwalkan kabar berikutnya.', 'Bu Rina tenang sesaat, tapi harus menelepon lagi minggu depan.', 'Menjadwalkan kabar berikutnya membuat customer tidak perlu terus mengejar informasi.'],
      ],
      timeout: [-6, 'Keluhan Bu Rina tidak ditanggapi. Ia mengunggah keluhan di media sosial.', 'Keluhan keterlambatan perlu ditanggapi cepat.'],
    },
    {
      title: 'Bukti status klaim',
      bg: 'telepon',
      lines: [
        ['customer', 'Kantor tempat saya titip katering minta bukti bahwa mobil saya sedang diperbaiki. Bisa?'],
      ],
      prompt: 'Bagaimana kamu menanggapi?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Bilang secara lisan bahwa mobilnya sedang diperbaiki.', 'Bu Rina tidak punya apa pun untuk ditunjukkan.', 'Kebutuhan customer akan bukti tertulis sebaiknya dipenuhi bila sesuai prosedur.'],
        ['tepat', 1, 8, 'Berikan keterangan status klaim tertulis sesuai prosedur, berisi informasi yang memang boleh dibagikan.', 'Bu Rina menunjukkan keterangan itu dan urusannya beres.', 'Membantu kebutuhan administratif customer dengan dokumen resmi yang sesuai prosedur menunjukkan kepedulian tanpa membuka data yang tidak perlu.'],
        ['keliru', 0, -8, 'Kirim foto layar sistem klaim yang berisi data internal.', 'Data internal tersebar ke pihak lain. Miss Raksa menegurmu.', 'Data internal dan data pribadi tidak boleh dibagikan sembarangan; gunakan dokumen resmi.'],
        ['keliru', 0, -6, 'Tolak karena "bukan urusan kantor".', 'Bu Rina kesulitan menjelaskan ke mitra kateringnya.', 'Menolak kebutuhan wajar tanpa mencari solusi membuat customer merasa tidak dibantu.'],
        ['kurang_tepat', 0.5, 3, 'Janjikan surat keterangan, tapi baru dikirim seminggu kemudian.', 'Suratnya benar, tapi terlambat untuk keperluan Bu Rina.', 'Bantuan yang tepat isi tetapi terlambat kurang bermanfaat; tanyakan kapan dibutuhkan.'],
      ],
      timeout: [-5, 'Permintaan Bu Rina tidak dijawab. Ia kehilangan satu pesanan katering.', 'Kebutuhan customer yang mendesak perlu ditanggapi.'],
    },
    {
      title: 'Serah terima mobil',
      bg: 'parkiran',
      lines: [
        ['narrator', 'Mobil Bu Rina selesai diperbaiki.'],
        ['customer', 'Mesinnya halus. Tapi bau apek di kabin masih ada sedikit.'],
      ],
      variants: { senang: 'Bu Rina mengelus kap mobilnya dengan lega.' },
      prompt: 'Apa yang kamu lakukan?',
      choices: [
        ['tepat', 1, 9, 'Periksa bersama, catat keluhan bau di kabin, dan pastikan bengkel menanganinya sebelum klaim ditutup.', 'Bengkel membersihkan ulang kabin. Bau hilang, Bu Rina puas.', 'Keluhan di serah terima ditangani sebelum penutupan agar hasil sesuai harapan wajar customer.'],
        ['keliru', 0, -8, 'Bilang bau itu wajar untuk mobil bekas banjir, tidak bisa apa-apa.', 'Bu Rina kecewa; keluhannya tidak ditanggapi.', 'Keluhan perlu diperiksa dan ditangani, bukan langsung dianggap wajar.'],
        ['kurang_tepat', 0.5, 2, 'Sarankan Bu Rina membeli pengharum mobil.', 'Bu Rina tersenyum kecut. Keluhannya tidak benar-benar ditangani.', 'Saran praktis boleh, tetapi keluhan hasil perbaikan seharusnya diteruskan ke bengkel.'],
        ['keliru', 0, -6, 'Tutup klaim dulu, keluhan diurus belakangan.', 'Setelah klaim ditutup, keluhan Bu Rina sulit ditindaklanjuti.', 'Keluhan yang belum selesai sebaiknya ditangani sebelum klaim ditutup.'],
        ['kurang_tepat', 0.5, 3, 'Catat keluhan, lalu minta Bu Rina kembali sendiri ke bengkel.', 'Bau tertangani, tapi Bu Rina harus mengurusnya sendiri.', 'Mencatat keluhan sudah baik; mengoordinasikannya dengan bengkel lebih memudahkan customer.'],
      ],
      timeout: [-5, 'Serah terima selesai tanpa membahas keluhan bau.', 'Keluhan saat serah terima perlu ditanggapi saat itu juga.'],
    },
    {
      title: 'Penutupan dan pencegahan',
      bg: 'meja',
      lines: [
        ['narrator', 'Klaim banjir Bu Rina siap ditutup.'],
        ['officer', 'Penutupan juga kesempatan membantu customer bersiap menghadapi musim hujan berikutnya.'],
        ['customer', 'Semoga tidak kejadian lagi, ya.'],
      ],
      prompt: 'Bagaimana kamu menutup klaim ini?',
      choices: [
        ['kurang_tepat', 0.5, 2, 'Rangkum proses klaim, lalu pamit.', 'Bu Rina paham prosesnya, tapi belum tahu cara mencegah kejadian serupa.', 'Rangkuman sudah baik; tips pencegahan menambah nilai bagi customer.'],
        ['tepat', 1, 10, 'Rangkum prosesnya, beri tips sederhana saat banjir (jangan menyalakan mesin, segera lapor), jelaskan cara menghubungi Raksa, dan berterima kasih.', 'Bu Rina mencatat tipsnya di ponsel. "Sekarang saya tahu harus apa kalau banjir lagi."', 'Penutupan yang merangkum proses dan memberi edukasi pencegahan membuat customer lebih siap dan percaya.'],
        ['keliru', 0, -7, 'Tawarkan langsung perpanjangan polis dengan premi lebih tinggi.', 'Bu Rina merasa momen penutupannya dijadikan ajang jualan.', 'Menawarkan produk boleh, tetapi bukan pengganti penutupan yang berfokus pada kebutuhan customer.'],
        ['keliru', 0, -6, 'Tutup klaim tanpa kabar apa pun.', 'Bu Rina tidak tahu klaimnya sudah selesai.', 'Penutupan klaim harus dikomunikasikan kepada customer.'],
        ['kurang_tepat', 0.5, 3, 'Beri tips pencegahan, tapi tidak merangkum prosesnya.', 'Bu Rina mendapat tips berguna, tapi masih ragu apakah semua urusannya selesai.', 'Customer perlu kepastian bahwa semua urusan tuntas, selain tips untuk ke depan.'],
      ],
      timeout: [-5, 'Klaim berakhir tanpa penutupan yang jelas.', 'Penutupan yang jelas adalah bagian dari layanan klaim.'],
    },
  ],
  endings: [
    {
      id: 'happy',
      kind: 'happy',
      minMood: 75,
      minScore: 9000,
      title: 'Mobil pulih, Bu Rina siap hadapi musim hujan',
      text: 'Mobil Bu Rina kembali normal. Ia paham apa yang dijamin, apa yang tidak, dan kenapa. Kini ia menyimpan nomor layanan Raksa dan tips saat banjir di ponselnya.',
    },
    {
      id: 'notes',
      kind: 'with_notes',
      minMood: 40,
      minScore: null,
      title: 'Klaim selesai, ada catatan',
      text: 'Klaim banjir Bu Rina tuntas, tetapi ada tahap yang membuatnya bingung atau menunggu tanpa kepastian.',
    },
    {
      id: 'kecewa',
      kind: 'with_notes',
      minMood: null,
      minScore: null,
      title: 'Klaim selesai, kepercayaan menurun',
      text: 'Klaim akhirnya selesai, tetapi Bu Rina merasa banyak janji yang tidak ditepati dan informasi yang terlambat. Ia ragu menghubungi Raksa lagi.',
    },
  ],
};

export const demoBanjirContent = () => buildDemo(DEMO_BANJIR);
