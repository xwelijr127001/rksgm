# Uji pemula tanpa pendamping & checklist HP fisik — Mode Cerita AUTO-1

Disusun 26 September 2026 untuk revisi v2 (`docs/rancangan-mode-cerita.md` bagian 11).

> **Status: BELUM DIJALANKAN.**
> - **Efektivitas belajar BELUM terverifikasi.** Sampai uji bagian A dijalankan dan jawabannya dicatat, jangan menulis
>   bahwa pemula "jadi paham" asuransi atau klaim. Yang sudah terbukti hanya ukuran tata letak & perilaku di emulasi
>   Chrome (rancangan bagian 11.7), bukan pemahaman orang.
> - **Checklist HP fisik (bagian B) belum dijalankan di Android maupun iPhone.** Semua pemeriksaan sampai 26 Sep memakai
>   emulasi Chrome (headless, viewport HP), bukan HP sungguhan, bukan pembaca layar sungguhan.
> - Menyelesaikan episode atau melihat tanda ✓ BUKAN bukti belajar. Catat jawaban peserta apa adanya.

Isi:

- **A. Uji pemula tanpa pendamping** (Unmoderated beginner test): skrip, tugas, pertanyaan, cara menilai, formulir hasil.
- **B. Checklist HP fisik** (Physical-device checklist): Android & iPhone, kolom Lulus/Gagal.

---

## A. Uji pemula tanpa pendamping

### A.1 Pertanyaan yang ingin dijawab

Dari brief tinjauan 26 Sep ("How to judge the revision"):

1. **Saat bermain**: apakah pemula bisa menyebut **perannya** (siapa dia, siapa yang dibantu) dan **tindakan
   berikutnya**?
2. **Sesudah bermain**: apakah pemula bisa menjelaskan **satu hal berguna** yang dipelajari, dan **menunjuk pilihan
   yang menyebabkan akhir** yang ia dapat?

Tambahan (dicatat, bukan syarat): apakah terasa seperti ujian/ada nilai; bagian yang membingungkan; apakah ia memakai
"Apa itu …?", Bantuan, Riwayat, atau "Lihat perjalananku" tanpa disuruh.

### A.2 Peserta

- **5 orang** (bila bisa 5–8), masing-masing sendiri-sendiri. Tidak bekerja di asuransi, tidak pernah melihat RAKSA
  GAME, bukan anggota tim. Catat bila pernah mengurus klaim sendiri (boleh ikut, tandai di formulir).
- Campuran usia & kebiasaan HP; setidaknya satu orang yang jarang main game. Bahasa: sebagian besar Indonesia; bila
  ada peserta en/zh, catat bahasanya.
- Minta persetujuan lisan/tertulis untuk mencatat jawaban (dan merekam layar bila dipakai). Jangan mencatat data
  pribadi selain inisial/kode peserta (P1, P2, …).

### A.3 Persiapan (sebelum tiap peserta)

| Butir | Isi |
| --- | --- |
| Versi | Catat alamat, tanggal, dan versi/commit yang dipakai (mis. hash commit atau nama berkas `index-*.js`) |
| Perangkat | Sebaiknya HP peserta sendiri (paling alami); catat merek/model, OS, browser |
| Keadaan bersih | Jendela penyamaran/Private **tidak** dianjurkan (progres & petunjuk hanya sementara). Pakai profil browser bersih, atau hapus data situs: `raksa:profil`, `raksa:cerita`, `raksa:cerita:petunjuk` (atau "Hapus data situs" di setelan browser) |
| Gerak & mode | Biarkan setelan HP apa adanya (catat bila "kurangi gerak"/"Reduce Motion" aktif). Jangan memakai `?adegan=ringan` kecuali memang diuji |
| Suara | Biarkan bawaan; catat bila peserta menyalakan suara |
| Pencatat | Formulir A.8 (kertas atau spreadsheet), jam/stopwatch. Opsional: rekaman layar HP (dengan izin) |
| Mulai dari | Halaman awal (`/`), bukan langsung `/cerita/auto-1`: pilihan pintu ikut diamati |

### A.4 Aturan tanpa pendamping (no coaching)

- Pendamping **tidak menjelaskan** asuransi, klaim, polis, tombol, atau jalan cerita, sebelum maupun selama bermain.
- Pertanyaan peserta dijawab dengan satu kalimat baku: **"Lakukan apa yang menurutmu paling masuk akal; saya tidak
  bisa membantu selama permainan."** Catat pertanyaannya (itu temuan).
- Jangan menunjuk layar, mengangguk, atau berkata "bagus/betul". Jangan mengoreksi jawaban di pos tanya.
- Bila peserta macet lebih dari **3 menit** di satu layar, catat layarnya, lalu boleh bilang: "Kalau mau, kamu boleh
  berhenti di sini." (bukan petunjuk). Macet = temuan penting, bukan kegagalan peserta.
- Versi tanpa pendamping sama sekali (jarak jauh): kirim lembar instruksi A.5 + formulir; pos tanya dijawab peserta
  sendiri di formulir sebelum lanjut.

### A.5 Kalimat pembuka (dibacakan persis)

> "Terima kasih sudah mau mencoba. Yang diuji gamenya, bukan kamu; tidak ada jawaban benar atau salah dan tidak ada
> nilai. Mulai dari halaman ini dan mainkan satu cerita sampai selesai, dengan caramu sendiri. Saya tidak bisa
> membantu selama bermain. Tiga kali saya akan minta kamu berhenti sebentar dan menjawab pertanyaan singkat; setelah
> menjawab, lanjutkan saja. Setelah selesai ada beberapa pertanyaan lagi. Kira-kira 15–20 menit."

Jangan menyebut kata "asuransi", "klaim", "polis", atau "cerita" sebelum peserta memilih pintu di halaman awal.

### A.6 Tugas & pos tanya

| Tugas | Instruksi ke peserta | Yang dicatat pengamat (tanpa bertanya) |
| --- | --- | --- |
| T1 | (Pembuka saja.) | Pintu yang dipilih (Main cerita / Latihan misi / Gabung acara); waktu sampai layar Kenalan; apakah membuka "Ubah tampilan (opsional)" |
| T2 | Mainkan sampai layar hasil akhir. | Waktu total; akhir yang didapat (judul kartu + kalimat sebab, lihat A.7); layar tempat ragu/macet; ketukan yang tidak berefek; memakai daftar atau gambar di aktivitas foto; membuka "Apa itu …?", Bantuan, Riwayat, Catatan kasus |
| T3 (opsional) | "Kalau mau, silakan lakukan apa saja di layar ini; kalau sudah, bilang selesai." | Menekan aksi utama/kedua; membuka "Lihat perjalananku"; mencoba bagian lain; langsung Selesai |

**Pos tanya** (pendamping bilang "Berhenti sebentar, ya" di saat berikut; tulis jawaban **kata per kata**):

| Pos | Kapan | Pertanyaan (dibacakan persis) |
| --- | --- | --- |
| P1 | Pertama kali tombol pilihan muncul (pertanyaan "Apa yang kamu katakan lebih dulu?") | 1a. "Di cerita ini kamu berperan sebagai siapa?" · 1b. "Siapa yang kamu bantu, dan apa masalahnya?" · 1c. "Menurutmu apa yang sebaiknya kamu lakukan sekarang?" |
| P2 | Kartu aktivitas pertama muncul ("Tugasmu …", sebelum menekan Mulai) | 2a. "Apa yang akan kamu lakukan di layar berikutnya?" · 2b. "Kenapa itu perlu?" |
| P3 | Kartu hasil akhir muncul (sebelum menekan apa pun) | 3a. "Apa yang terjadi pada Bu Rina di akhir cerita?" · 3b. "Kalau mau lanjut, tombol mana yang akan kamu tekan?" |

**Pertanyaan sesudah bermain** (dari ingatan dulu; layar boleh dilihat HANYA pada pertanyaan yang menyebutnya):

| No | Pertanyaan (dibacakan persis) | Catatan |
| --- | --- | --- |
| S1 | "Ceritakan dengan kata-katamu: apa yang terjadi tadi?" | Kata per kata |
| S2 | "Sebutkan satu hal berguna yang kamu pelajari." | Kata per kata. Bila menjawab "tidak ada", catat apa adanya; jangan memancing |
| S3 | "Akhir yang kamu dapat itu karena pilihanmu yang mana?" | Dari ingatan, kata per kata |
| S3b | "Sekarang boleh lihat layar. Tunjukkan pilihan atau bagian yang menyebabkannya." | Catat apa yang dibuka (Riwayat, "Lihat perjalananku", tidak membuka apa pun) dan yang ditunjuk |
| S4 | "Kalau kamu menjelaskan ke teman: apa arti **polis**? Apa arti **risiko sendiri**?" | Kata per kata; "tidak tahu" = jawaban sah. Ini pertanyaan riset, bukan kuis di dalam game |
| S5 | "Apakah ada bagian yang membingungkan atau terlalu panjang?" | |
| S6 | "Apakah tadi terasa seperti dinilai atau diuji? Di bagian mana?" | Memeriksa tujuan "tanpa skor/ujian" |
| S7 | "Apakah kamu mau mencoba jalan cerita lain? Kenapa?" | |

### A.7 Cara menilai jawaban (sesudah sesi, oleh dua orang bila bisa)

Nilai tiap jawaban **Ya / Sebagian / Tidak**, tetapi SIMPAN kalimat aslinya; nilai hanya ringkasan.

- **1a/1b Peran & yang dibantu** — Ya bila menyebut membantu nasabah/pelanggan/ibu (Bu Rina) yang mobilnya rusak /
  melapor kerugian di meja layanan (kata "petugas", "CS", "layanan klaim", "asuransi" tidak wajib). Sebagian bila hanya
  salah satu (peran ATAU yang dibantu). Tidak bila keliru (mis. "saya pemilik mobil", "montir") atau tidak tahu.
- **1c/2a Tindakan berikutnya** — Ya bila masuk akal untuk layar itu: P1 = mendengarkan/menanyakan keadaan atau kejadian
  (memilih "data dulu" juga dihitung "tahu apa yang harus dilakukan" bila alasannya jelas; catat pilihannya); P2 = memotret
  bukti/memilih foto kerusakan & mobil. Tidak bila tidak tahu apa yang akan dilakukan.
- **2b / 3a** — catat saja; dipakai untuk melihat apakah akibat terbaca.
- **S2 Hal berguna** — Ya bila menyebut salah satu gagasan episode dengan benar, dengan kata sendiri:
  1. dengarkan / tanyakan keadaan nasabah dulu;
  2. foto & laporkan dulu sebelum mobil diperbaiki;
  3. bukti yang membantu: seluruh mobil, detail kerusakan, plat nomor;
  4. "tercakup sesuai syarat" = dinilai dulu, belum tentu/bukan otomatis diganti;
  5. risiko sendiri = bagian kerugian yang tetap ditanggung nasabah (besarnya sesuai polis);
  6. jangan menjanjikan waktu atau hasil yang belum pasti; ralat bila terlanjur;
  7. tutup dengan menjelaskan langkah berikutnya.
  **Catat terpisah bila ada salah paham** (mis. "polis pasti mengganti", "petugas yang menyetujui klaim", "klaim
  selesai besok", "boleh diperbaiki dulu, klaim menyusul"): itu temuan serius walau jawabannya terdengar yakin.
- **S3/S3b Pilihan penyebab** — bandingkan dengan tabel di bawah (cari baris dengan judul hasil DAN awal kalimat sebab
  yang tampil di kartu). Ya = menyebut/menunjuk salah satu keputusan di kolom "Keputusan penyebab"; Sebagian = bagian
  atau tema yang benar tanpa pilihannya; Tidak = lainnya. Catat juga apakah ia perlu membuka "Lihat perjalananku".

| Judul hasil di kartu | Kalimat sebab diawali … | Aturan | Keputusan penyebab (teks pilihan, dipendekkan) |
| --- | --- | --- | --- |
| Bu Rina tahu langkah berikutnya | "Kamu meluruskan janji …" | `tuntas-ralat-janji` | Ralat di Bagian 5: "Maaf, saya perlu meluruskan, Bu: hasil dan waktunya belum pasti …" atau "Maaf, saya keliru: kerusakannya dinilai dulu …" |
| 〃 | "Kamu mengakui salah baca …" | `tuntas-baca-ulang` | "Maaf, Bu, saya salah baca. Kerusakan benturan tercakup …" |
| 〃 | "Kamu meluruskan saranmu sebelum mobil diperbaiki …" | `tuntas-ralat-saran` | "Maaf, saran saya tadi keliru …" atau "Ibu benar, saya terlalu cepat menilai …" |
| 〃 | "Kamu melengkapi foto yang terlewat …" | `tuntas-lengkapi` | "Boleh kita tambah foto yang kurang sekarang, Bu?" |
| 〃 | "Awalnya Bu Rina tegang, tetapi kamu minta maaf …" | `tuntas-pulih` | "Maaf, Bu, saya terlalu cepat. Ibu aman? …" |
| 〃 | "Mobilnya belum bisa langsung beres …" | `tuntas-jelas` | Salah satu: "Ibu sendiri tidak apa-apa? …", "Kita foto dan laporkan dulu …", tiga foto tepat, "bisa dilanjutkan untuk dinilai …", "Besok belum bisa saya pastikan …", "Laporan Ibu tercatat. Kerusakan diperiksa …" |
| Bu Rina kecewa setelah dijanjikan besok beres | "Bu Rina mengandalkan ucapanmu bahwa besok selesai …" | `janji-besok` | "Saya usahakan besok sudah selesai, Bu …" |
| 〃 | "Bu Rina mengandalkan janjimu di awal …" | `janji-awal` | "Tenang, Bu, kami bantu sampai beres. Besok mobilnya pasti bisa dipakai." (tidak diralat) |
| Bu Rina kecewa setelah dijanjikan pasti diganti | "… pasti diganti, padahal kartu …" | `janji-polis` | Di aktivitas kartu polis: "… jadi kerusakan … pasti diganti." (tidak diralat) |
| Bu Rina pulang belum tahu harus apa | "Laporannya tercatat, tetapi “nanti dikabari” …" | `dingin-singkat` | "Semua keterangan sudah saya catat lengkap … nanti dikabari." |
| Bu Rina pulang belum paham semuanya | "Bu Rina disuruh membaca kartu sendiri …" | `dingin-aturan` | "Itu sudah ketentuan polis, Bu. … silakan dibaca lagi …" |
| Bu Rina paham, tetapi belum tenang | "… sejak awal ia merasa hanya dianggap formulir …" | `dingin-awal` | "Baik, Bu. Saya perlu data asuransi Ibu …" lalu "Supaya cepat, kita isi datanya dulu, ya." |
| 〃 | "… penjelasan yang sempat berubah …" | `dingin-ralat` | Kekeliruan awal yang kemudian diralat (janji, saran bengkel/"cuma baret", atau bacaan kartu) |
| 〃 | "… ia belum merasa cukup didengar …" | `dingin-jarak` | (cadangan) cara bicara sepanjang percakapan; tunjuk pilihan komunikasi mana pun yang dingin |
| Laporan Bu Rina perlu dilengkapi belakangan | "Mobil Bu Rina diperbaiki sebelum kerusakannya tercatat …" | `tertunda-bengkel` | "Kalau memang mendesak, perbaiki dulu saja …" lalu "Foto dari HP Ibu tadi sudah cukup …" |
| 〃 | "Foto yang terlewat tidak ikut di laporan …" | `tertunda-foto` | Foto kurang dari 3 yang tepat, lalu "Sudah, Bu. Foto yang ada kita pakai saja …" |
| Bu Rina pergi sebelum urusannya jelas | "Bu Rina merasa masalahnya diremehkan …" | `pergi-sepele` | "Kalau cuma baret, mungkin tidak perlu klaim …" lalu "… kedengarannya ringan …" |
| 〃 | "Kamu bertahan pada bacaan kartu …" | `pergi-bertahan` | Penjelasan kartu yang keliru, lalu "Saya sudah membacanya dengan teliti tadi …" |

Aturan & teks sumber: `client/src/cerita/episode/auto-1/episode.ts` (`KARTU_AKHIR`) dan `teks.id.ts` (`kartu.*`).
Bila naskah berubah, perbarui tabel ini. (Pengembang bisa melihat id aturan di atribut `data-aturan` kartu.)

### A.8 Formulir hasil (salin satu baris per peserta)

**Selama bermain**

| Peserta | Tanggal | HP / OS / browser | Bahasa | Kenal asuransi? (tidak / sedikit / pernah klaim) | Pintu dipilih | P1a peran (kata per kata) | P1b yang dibantu | P1c tindakan berikut | P2a/2b | P3a | P3b tombol | Macet di (layar, menit) | Pertanyaan ke pendamping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | | | | | | | | | | | | | |
| P2 | | | | | | | | | | | | | |

**Sesudah bermain**

| Peserta | Waktu total | Judul hasil + awal kalimat sebab | Aturan (A.7) | S1 cerita | S2 hal berguna (kata per kata) | S2 nilai | Salah paham? | S3 dari ingatan | S3b yang ditunjuk / yang dibuka | S3 nilai | S4 polis / risiko sendiri | S5 bingung | S6 terasa dinilai? | Memakai "Apa itu"/Bantuan/Riwayat/Perjalananku |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | | | | | | | | | | | | | | |
| P2 | | | | | | | | | | | | | | |

**Rekap** (isi setelah semua peserta; angka = jumlah peserta, bukan persen)

| Pertanyaan | Ya | Sebagian | Tidak | Kutipan yang mewakili |
| --- | --- | --- | --- | --- |
| Menyebut peran (P1a) | | | | |
| Menyebut yang dibantu & masalahnya (P1b) | | | | |
| Tahu tindakan berikutnya (P1c / P2a) | | | | |
| Satu hal berguna (S2) | | | | |
| Menunjuk pilihan penyebab akhir (S3/S3b) | | | | |
| Salah paham materi klaim (S2/S4) | — | — | — | |
| Merasa diuji/dinilai (S6) | | | | |

Tidak ada ambang lulus yang ditetapkan lebih dulu; tim membaca jawaban asli lalu memutuskan. Pegangan (usulan): bila
2 dari 5 peserta atau lebih tidak bisa menyebut peran di P1, atau tidak bisa menunjuk pilihan penyebab di S3b,
perlakukan sebagai masalah desain, bukan kesalahan peserta. Setiap salah paham materi klaim diteruskan ke PIC Claim
bersama kalimat di layar yang memicunya.

---

## B. Checklist HP fisik (Android & iPhone)

> **Belum dijalankan di HP fisik.** Kolom hasil di bawah sengaja kosong. Angka dan tangkapan di
> `docs/rancangan-mode-cerita.md` bagian 11.7 berasal dari emulasi Chrome.

### B.1 Perangkat & persiapan

| | Android | iPhone |
| --- | --- | --- |
| Merek / model | | |
| Versi OS | | |
| Browser & versi | Chrome | Safari |
| Ukuran layar / kerapatan | | |
| Versi game (commit / tanggal) | | |
| Penguji, tanggal | | |

Siapkan: alamat game di jaringan yang sama (README bagian 5 & 5a), data situs dibersihkan, suara bawaan, gerak
mengikuti HP (`?gerak=ikut`). Uji satu episode penuh sekali di tiap HP, lalu butir khusus di bawah.

### B.2 Checklist

Isi **Lulus / Gagal / —** (— = tidak diuji) dan catatan singkat + tangkapan layar bila gagal.

| No | Pemeriksaan | Cara | Diharapkan | Android | iPhone | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Target sentuh | Ketuk dengan jari (bukan stylus) semua tombol: header (kembali, bahasa, suara, Riwayat, Catatan kasus, Bantuan), Lanjut, pilihan, "Apa itu …?", baris kartu polis, Mulai, "Lanjutkan cerita", "Kenapa begitu?", aksi kartu akhir, tombol dialog | Satu ketukan = satu aksi; tidak ada salah ketuk ke tombol tetangga; tidak ada ketukan ganda yang melompati kalimat | | | |
| 2 | Kotak dialog | Ketuk kotak saat kalimat mengetik, lalu ketuk lagi | Ketukan 1 = kalimat utuh, ketukan 2 = lanjut; mengetuk "Apa itu …?" tidak memajukan cerita | | | |
| 3 | Aktivitas foto: ketuk gambar | Ketuk objek di adegan (brosur, seluruh mobil, bemper & lampu, plat, ban, dasbor), ketuk lagi untuk membatalkan | Foto masuk/keluar album; penghitung "n/3 foto"; objek kecil tetap mudah kena | | | |
| 4 | Aktivitas foto: daftar | Tanpa menggulir setelah Mulai, cari "Pilih lewat daftar", buka, pilih lewat daftar | Terlihat utuh di atas bar kirim; daftar & gambar berbagi pilihan yang sama | | | |
| 5 | Ketukan tembus | Ketuk tombol kirim / bar bawah yang berada di atas gambar | Hanya tombol yang bereaksi; objek di bawahnya tidak ikut terpilih | | | |
| 6 | Foto belum lengkap | Kirim dengan 1 foto | Dialog "Baru 1 dari 3 foto dipilih"; "Lengkapi foto" kembali menjawab; kirim apa adanya lanjut ke cerita | | | |
| 7 | Kartu polis | Di aktivitas kartu, ketuk subjudul & tiap baris kartu | Arti terbuka/tertutup di bawah baris (+/−); pilihan jawaban tetap terjangkau dengan menggulir | | | |
| 8 | Keyboard/IME kolom nama (Kenalan) | Isi nama dengan keyboard bawaan; coba koreksi otomatis, huruf kapital, emoji; bila ada, keyboard Pinyin/Chinese; nama panjang | Kolom & tombol simpan tidak tertutup keyboard; komposisi IME tidak terpotong/terkirim setengah; nama tampil benar di dialog | | | |
| 9 | Tampilan karakter opsional | Di Kenalan menuju cerita: simpan tanpa membuka "Ubah tampilan (opsional)", lalu ulangi dengan membukanya | Keduanya bisa disimpan; pilihan tampilan tersimpan | | | |
| 10 | Rotasi | Putar ke mendatar dan kembali saat: dialog, istilah terbuka, aktivitas foto (sebelum & sesudah Mulai), umpan balik, kartu akhir, dialog "Lihat perjalananku" | Tidak kehilangan progres atau pilihan draf; adegan menyesuaikan; tombol utama tetap terjangkau; tidak ada gulir ke samping | | | |
| 11 | Ukuran teks / zoom | Android: Setelan Chrome → Aksesibilitas → Penskalaan teks 200 %. iPhone: Safari "aA" → 200 % (Dynamic Type umumnya tidak memengaruhi halaman web) | Teks terbaca, tidak terpotong; halaman boleh bergulir ke bawah tetapi tidak ke samping; dialog bisa digulir sampai tombolnya | | | |
| 12 | Kurangi gerak | Android: Aksesibilitas → Hapus animasi. iPhone: Aksesibilitas → Gerakan → Kurangi Gerakan. Buka ulang game | Kalimat langsung utuh (tanpa efek mengetik); kartu akhir & ekspresi tanpa animasi; tombol "Nyalakan animasi" hanya di halaman yang menyediakannya | | | |
| 13 | Pembaca layar (uji asap) | Android TalkBack / iPhone VoiceOver: geser untuk berpindah elemen, ketuk dua kali untuk memilih | Kalimat dialog dibacakan utuh sekali (bukan huruf demi huruf); tombol punya nama; "Apa itu …?" dan "Kenapa begitu?" mengumumkan terbuka/tertutup; saat dialog terbuka, elemen di belakangnya tidak terjangkau; pilihan dan aktivitas foto bisa diselesaikan lewat daftar; status "Tepat/Keliru/Diperbaiki" terdengar sebagai kata | | | |
| 14 | Tombol kembali sistem | Android: gestur/tombol kembali saat dialog Riwayat/Bantuan/pemilih bagian terbuka dan saat di tengah episode | Catat perilakunya (menutup dialog atau pindah halaman); progres tidak hilang | | | |
| 15 | Rasa performa | Catat waktu kira-kira: buka `/cerita/auto-1`, Mulai → gambar bisa disentuh (pertama & kedua kali), jeda ketukan pilihan; mainkan satu episode penuh | Tidak ada jeda yang terasa macet (> ±1 dtk tanpa tanda memuat); gulir lancar; HP tidak panas berlebihan | | | |
| 16 | Jaringan lambat | Aktifkan data seluler/sinyal lemah, buka aktivitas pertama kali | Tanda memuat tampil; bila gagal, pesan + "Muat ulang" (bukan layar putih); progres kembali ke titik yang sama | | | |
| 17a | Mode pribadi | Android: Chrome Incognito. iPhone: Safari Private. Main sebagian, muat ulang, lalu tutup jendela & buka lagi | Permainan jalan; muat ulang di jendela yang sama melanjutkan; setelah jendela pribadi ditutup progres hilang (perilaku browser). Catat apakah pesan penyimpanan muncul (di browser ini penyimpanan biasanya tetap bekerja selama sesi, jadi pesan tidak wajib muncul) | | | |
| 17b | Penyimpanan diblokir | iPhone: Setelan → Safari → Blokir Semua Cookie. Android: Setelan situs Chrome → blokir cookie & data situs untuk alamat game | Permainan tetap jalan; pesan "progres hanya bertahan selama halaman ini terbuka"; petunjuk "Ketuk kotak ini…" tampil lagi tiap membuka (sesuai rancangan); tidak ada layar galat | | | |
| 18 | Lanjut setelah keluar | Tutup tab di tengah episode (atau pindah aplikasi lama sampai browser memuat ulang), buka lagi | Lanjut dari kalimat terakhir; umpan balik aktivitas tidak dinilai ulang | | | |
| 19 | Kartu akhir | Selesaikan dengan akhir baik dan satu akhir lain | Judul hasil, pelajaran, dan kedua aksi terlihat tanpa gulir di tinggi layar HP itu; "Coba lagi dari bagian …" mulai di awal bagian yang disebut; "Lihat perjalananku" & pemilih bagian bisa ditutup | | | |
| 20 | Bahasa | Ganti ke EN dan 中文 di tengah episode dan di kartu akhir | Progres tetap; huruf Tionghoa tampil (bukan kotak); tombol tidak terpotong | | | |
| 21 | Safe area / notch | Perhatikan bar bawah & header di HP berponi/gestur | Tombol tidak tertimpa area gestur atau poni | | | |

### B.3 Ringkasan hasil

| Perangkat | Lulus | Gagal | Tidak diuji | Temuan terpenting |
| --- | --- | --- | --- | --- |
| Android | | | | |
| iPhone | | | | |

Setelah dijalankan, catat tanggal & perangkat di README (bagian Batasan) dan di `docs/rancangan-mode-cerita.md` 11.7,
lalu hapus kalimat "belum dijalankan" hanya untuk butir yang memang sudah diuji.
