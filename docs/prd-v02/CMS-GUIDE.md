# Panduan CMS konten cerita — untuk Tim Story & Storyline

Panduan ini untuk penulis, reviewer, dan admin konten. Tidak perlu mengubah kode, JSON, atau memanggil developer:
semua dilakukan di browser lewat alamat **/cms** (contoh lokal: `http://127.0.0.1:4000/cms`).

> Status: alat ini berjalan di lingkungan lokal/uji. Dua skenario "[DEMO]" adalah contoh sintetis untuk menguji
> sistem — **bukan** kasus resmi dan **belum** disetujui komite. Penerbitan oleh akun uji hanyalah simulasi.

## 1. Masuk

1. Buka `/cms`, isi nama pengguna dan kata sandi akun staf Anda (dibuat oleh admin sistem).
2. Menu di atas hanya menampilkan alat yang boleh Anda pakai sesuai peran:
   - **Penulis konten**: membuat & menyunting skenario, mengajukan ke review.
   - **Reviewer / komite**: memeriksa, mengembalikan ke draf, mencatat anonimisasi, menerbitkan, mengarsipkan.
   - **Admin sistem**: pustaka aset (unggah), kategori, pengguna.
3. Tombol **Keluar** di kanan atas mengakhiri sesi. Sesi juga berakhir sendiri setelah 12 jam atau saat tab ditutup.
   Bila sesi berakhir saat CMS terbuka (mis. lewat 12 jam, atau kata sandi direset admin), permintaan berikutnya ke
   server (mis. menyimpan) memunculkan formulir masuk di atas layar tanpa menutupnya: masuk lagi dengan akun yang sama
   untuk melanjutkan, termasuk perubahan yang belum disimpan (lalu tekan **Simpan draf** lagi). Masuk dengan akun lain
   memulai CMS dari awal; perubahan yang belum disimpan tidak ikut.

## 2. Membuat skenario baru (penulis)

1. Di **Skenario**, buka **+ Skenario baru**: isi judul, pilih kategori (MVP: hanya **Auto** yang aktif) dan sumber cerita:
   - **Kasus klaim settled** — cerita dari kasus nyata. Wajib dianonimkan dan diperiksa reviewer sebelum terbit.
   - **DEMO sintetis** — contoh latihan; tidak pernah masuk rekap kompetisi. Sumber tidak bisa diubah setelah dibuat.
2. Tekan **Buat draf**. Editor terbuka dengan tab:

| Tab | Isi |
| --- | --- |
| Info & tokoh | Judul, sinopsis, kategori, tingkat kesulitan, **status customer awal** (0–100, hanya untuk babak 1), tokoh customer & petugas, **nama tokoh** yang tampil di dialog, musik latar (opsional), ekspresi wajah customer untuk tiap tingkat perasaan, dan bahasa teks. |
| Babak | 15 babak berurutan. Tekan **Buat kerangka 15 babak** sekali; lalu isi tiap babak (lihat §3–§4). |
| Akhir cerita | Minimal satu **Akhir bahagia (happy ending penuh)** dan satu **Selesai dengan catatan**; **Kurang puas** opsional; akhir terakhir adalah cadangan tanpa syarat. |
| Validasi | Daftar semua masalah. Klik satu baris untuk melompat ke babak/isiannya. Di bawahnya panel **Audit pilihan** untuk seluruh skenario (§4.6). |
| Pratinjau | Mainkan seluruh skenario di browser Anda sendiri dengan aturan dan tampilan babak yang sama dengan room (tidak membuat room, tidak masuk laporan). |
| Review, terbit & riwayat | Ajukan/terbitkan/arsipkan, versi terbit, riwayat siapa melakukan apa, revisi draf sebelumnya. |

3. Tekan **Simpan draf** sesering mungkin. Bila orang lain menyimpan lebih dulu, Anda akan diminta memuat ulang (tidak ada perubahan yang tertimpa diam-diam).
   Penyimpanan berjalan satu per satu; yang diketik selama menyimpan tetap ada dan tetap tercatat belum disimpan.
4. **Perubahan yang belum disimpan tidak hilang diam-diam.** Selama ada perubahan belum tersimpan, setiap jalan keluar
   dari editor bertanya dulu ("Tinggalkan editor?"): tautan ke halaman lain (mis. "← Semua skenario", menu CMS, alat
   staf lain), tombol di luar editor seperti **Keluar**, dan tombol kembali/maju browser (juga tombol mouse, Alt+←/→,
   gestur geser). Pilih **Kembali ke editor**, **Simpan draf, lalu lanjutkan**, atau **Tinggalkan tanpa menyimpan**.
   Menutup atau memuat ulang tab memunculkan peringatan browser. Bila draf sedang disimpan saat Anda keluar, editor
   menunggu penyimpanan itu; bila sesudahnya tidak ada lagi yang belum disimpan, Anda langsung dilanjutkan.

## 3. Mengisi satu babak

- **Judul babak** dan **dialog**: tambah baris Narasi / Customer / Petugas / tokoh pendukung sesuai urutan bicara
  (maks. 10 baris). Cukup satu atau dua pesan pendek sebagai konteks (sekitar 25–45 kata).
- **Latar** dan **foto/video bukti** dipilih dari pustaka aset (tidak perlu mengetik nama berkas). Adegan lapangan
  butuh latar hasil unggahan (§4.1).
- **Kegiatan babak** (chat, meja berkas, adegan lapangan, adegan klasik) dan **berkas** bersama: lihat §4.
- **Variasi kalimat sesuai status customer** (opsional): kalimat pembuka berbeda bagi peserta yang customer-nya sedang
  kecewa/ragu/tenang. Status dibawa dari babak sebelumnya — tidak direset setiap babak.
- **Pertanyaan keputusan** (satu kalimat pendek) lalu **tepat lima pilihan**. Untuk tiap pilihan isi:
  - teks pilihan (yang dibaca peserta; 8–16 kata, lihat §4.4),
  - **klasifikasi** komite: Tepat / Kurang tepat / Keliru,
  - **bobot ketepatan**: Tepat = 1, Keliru = 0, Kurang tepat di antaranya (mis. 0,5),
  - **perubahan status customer** (−40 … +40). Ingat: senang-tidaknya customer *bukan* ukuran benar-salahnya proses klaim,
  - **konsekuensi** (apa yang terjadi) dan **alasan** komite (tampil di ringkasan akhir peserta),
  - opsional: **Tindakan, bukan pesan**, **balasan** dari yang membalas (§4.4), dan **Tinggalkan tanda** (§4.5).
- **Bila waktu habis**: perubahan status dan konsekuensi bawaan (opsional: balasan bila waktu habis). Peserta yang
  tidak menjawab mendapat 0 poin dan konsekuensi ini; cerita tetap lanjut — jawaban salah tidak pernah menghentikan
  cerita lebih awal.
- **Memindah dan menghapus**: menghapus babak menghapus semua teksnya (semua bahasa); tanda yang hanya ditinggalkan
  babak itu ikut terhapus bersama efek tertunda, baris khusus, dan namanya (dialog menyebutnya dulu). Menghapus tokoh
  pendukung yang dipakai juga bertanya dulu: barisnya tetap ada tetapi menjadi **Narasi**, dan babak tempat ia membalas
  kehilangan yang membalas (teks balasan tetap; pilih penggantinya). Setelah memindah atau menghapus babak, baris
  dialog, berkas, baris berkas, efek tertunda, akhir cerita, atau tokoh, fokus keyboard tetap di tempat kerja itu
  (panah yang sama, tetangganya, tombol tambah, atau judul bagiannya), tidak melompat ke atas halaman.

Urutan pilihan diacak per peserta saat bermain; penilaian memakai ID pilihan, jadi urutan di editor tidak penting.

## 4. Kegiatan babak, berkas, dan keputusan

Setiap babak punya **satu kegiatan utama**: peserta menerima pesan atau situasi → membuka informasi yang dibutuhkan →
memilih satu dari lima tindakan → menekan satu tombol → melihat reaksi tokoh dan satu pelajaran. Timer, lima pilihan
(diacak, tanpa huruf A–E), dan tombol keputusan sama di semua kegiatan. Skenario lama tetap berjalan seperti
sebelumnya (kegiatan **Adegan klasik**).

### 4.1 Memilih kegiatan

Di kartu **Adegan**, bagian **Kegiatan babak**:

| Kegiatan | Yang dilihat peserta | Syarat |
| --- | --- | --- |
| Percakapan (chat) | Satu utas pesan: kontak di atas, pesan masuk dan keluar, berkas sebagai lampiran, lima draf balasan di area ketik, tombol "Kirim balasan" (pilihan berbentuk tindakan: "Tetapkan tindakan", §4.4). Tanpa ilustrasi di sampingnya. | Minimal satu pesan dari customer/tokoh pendukung yang tampil untuk semua (bukan baris khusus pemegang tanda), atau **Yang membalas** = customer/tokoh pendukung (§4.4; petugas adalah pihak pemain, bukan kontak); bila tidak ada, muncul peringatan chat tanpa kontak. |
| Meja berkas | Konteks singkat, kartu berkas yang bisa dibuka, lalu lima tindakan; tombol "Tetapkan tindakan". | Minimal satu berkas. |
| Adegan lapangan | Satu gambar latar dengan titik bernomor dan daftar bernomor yang sama di bawahnya, tombol "Perbesar gambar"; tombol "Tetapkan tindakan". | Latar berupa gambar hasil unggahan (latar bawaan ditolak validasi: tidak punya berkas gambar, jadi adegan dan titiknya tidak tampil) dan minimal satu berkas bertitik (§4.3). |
| Adegan klasik | Latar dengan tokoh dan dialog (gaya skenario DEMO); tombol "Tetapkan pilihan". | Seperti sebelumnya. |

Pilih kegiatan dari isi babak, bukan dari nomor babak, dan jangan membuat cara bermain yang berbeda di tiap babak.

### 4.2 Berkas (informasi bersama)

Kartu **Berkas (informasi bersama)**, maks. 5 berkas per babak. Tambah dengan tombol jenisnya:

| Jenis | Isi | Wajib |
| --- | --- | --- |
| Dokumen | teks yang dibaca, mis. ringkasan surat atau laporan (boleh beberapa paragraf) | judul + isi |
| Daftar periksa | baris berstatus Ada / Menyusul / Belum ada / Perlu dicek | judul + 1–12 baris |
| Alur (linimasa) | urutan tahap; nilai = waktu atau keterangan; status Selesai / Berjalan / Belum / Perlu dicek | judul + 1–12 baris |
| Perbandingan | baris dua sisi (label dan pembandingnya); status Cocok / Menunggu / Tidak ada / Perlu dicek | judul + 1–12 baris |
| Foto | gambar hasil unggahan dari pustaka (foto bukti atau latar; latar bawaan ditolak karena tidak punya berkas gambar) dengan keterangan opsional | judul + gambar |

Judul singkat (≤ 40 karakter) tampil di tombol berkas. **Label jenis** (opsional, ≤ 24 karakter) menggantikan kata
jenis di atas judul, mis. "Surat", "Daftar kontak", "Lokasi"; kosong = kata jenisnya ("Dokumen", "Foto", …). Status
tampil sebagai ikon + kata, tidak hanya warna. Pemilih gambar berkas hanya menawarkan gambar hasil unggahan; tautan
**Pustaka aset (tab baru)** dan **muat ulang daftar** ada di bawahnya.

**Aturan keadilan (wajib):**
- Berkas sama untuk kelima pilihan dan semua peserta. Membuka berkas tidak memberi poin atau petunjuk dan tidak
  mengubah pilihan atau timer.
- Fakta yang dipakai semua pilihan dipindah ke berkas, jangan hanya ditulis di teks pilihan yang tepat. Berkas tidak
  boleh menyebut akibat salah satu pilihan.
- Jangan menambah fakta, angka, nilai, aturan, atau status yang tidak ada di naskah sumber. Status yang tidak disebut
  naskah: pilih **Perlu dicek**, jangan menebak.
- Berkas tidak menambah waktu baca bersama dan 30 detik menjawab tidak berubah: buat isinya singkat.

Peserta melihat berkas sebagai lampiran (chat), kartu (meja berkas), atau titik bernomor dan daftar (adegan lapangan);
layar acara menampilkan isinya satu per satu bergiliran (waktu baca dibagi rata, 6–10 detik per berkas, sehingga semua
berkas tampil selama waktu baca) selama babak dimainkan, lalu pelajaran
babak (bila ada) setelah jawaban ditutup. Berkas babak berikutnya tidak terlihat sebelum babaknya tiba.

### 4.3 Titik pada adegan lapangan

Pada babak **Adegan lapangan** kartu berkas menampilkan gambar latar. Pilih berkasnya lalu klik gambar untuk menaruh
titik, atau isi **Titik X (% dari kiri)** dan **Titik Y (% dari atas)**; titik yang dipilih bisa digeser dengan tombol
panah (Shift = 5 langkah). Titik selalu berada di dalam bingkai putus-putus (6–94 %), batas yang sama dengan yang
dipakai room, supaya penanda tidak terpotong di tepi gambar; titik lama di luar batas itu tampil di tepi bingkai dan
diberi catatan kuning. **Hapus titik** = berkas hanya tampil di daftar. Nomor titik mengikuti urutan berkas (ubah
dengan ↑ ↓). Daftar bernomor di bawah gambar adalah padanan lengkap titik (keyboard, pembaca layar, gambar gagal
dimuat, dan HP mendatar yang pendek, tempat penanda disembunyikan saat menjawab), jadi informasi penting tidak boleh
hanya ada di gambar. Peserta bisa membuka gambar adegan lebih besar lewat **Perbesar gambar**.

### 4.4 Keputusan: pilihan, balasan, pelajaran, tombol

- **Pertanyaan keputusan**: satu kalimat pendek tentang tugas peserta.
- **Teks pilihan**: 8–16 kata (paling banyak 20). Kelima pilihan sebanding panjang, bentuk kalimat, nada, dan tingkat
  detailnya. Pilihan tepat tidak boleh selalu yang paling panjang, paling ramah, paling lengkap, atau satu-satunya yang
  menyebut beberapa tindakan. Pengecoh dibuat masuk akal (niat baik, tetapi melewatkan proses, waktu, bukti, atau
  komunikasi). Jangan menyamakan panjang dengan kata pengisi atau spasi.
- **Tindakan, bukan pesan** (centang per pilihan): untuk langkah tanpa pesan, mis. menunda balasan sampai ada
  keputusan; tulis teksnya tanpa tanda kurung. Kartu pilihannya tampil sama seperti pilihan lain (tanpa tanda). Di
  babak chat, begitu pilihan itu dipilih, tombol konfirmasi menjadi "Tetapkan tindakan"; sesudah dikirim, dan juga di
  hasil setelah jawaban ditutup, pilihan itu tampil sebagai catatan "Kamu: …" dengan "✓ Ditetapkan", bukan gelembung
  pesan "Terkirim". Di kegiatan lain bentuk ini tidak mengubah tampilan.
  Tidak memengaruhi kunci, nilai, atau status — jangan sampai menjadi petunjuk (mis. hanya pilihan tepat yang berupa
  tindakan, atau pilihan tindakan yang tidak pernah tepat). Bila skenario punya dua pilihan tindakan atau lebih dan
  tidak satu pun tepat, setiap pilihan tindakan mendapat saran kuning di bawah centangnya.
- **Label tombol keputusan** (opsional, ≤ 24 karakter): kosong = kata bawaan kegiatan ("Kirim balasan", "Tetapkan
  tindakan", "Tetapkan pilihan"); isi bila tindakannya khusus, mis. "Ajukan berkas". Di chat, pilihan berbentuk
  tindakan tetap dikonfirmasi dengan "Tetapkan tindakan".
- **Yang membalas sesudah keputusan**: customer, petugas, tokoh pendukung, atau "Tidak ada (hanya catatan hasil)".
  Lalu isi **Balasan … sesudah pilihan ini** per pilihan dan **Balasan … bila waktu habis** (opsional, ≤ 220
  karakter). Balasan hanya dilihat peserta yang memilihnya, setelah semua jawaban ditutup. Balasan tanpa yang membalas
  memunculkan peringatan.
- **Konsekuensi** tetap wajib: catatan singkat apa yang terjadi.
- **Pelajaran singkat** (opsional, 15–25 kata): satu pelajaran untuk semua peserta, tampil setelah jawaban ditutup
  (juga di layar acara), tidak pernah saat menjawab. Bila diisi, kartu hasil menampilkannya sebagai ganti alasan
  pilihan; alasan tetap muncul di ringkasan akhir.

### 4.5 Tanda dan efek tertunda

- **Tinggalkan tanda** pada pilihan yang berdampak di babak sesudahnya (mis. janji yang belum tentu bisa ditepati):
  ID huruf kecil, angka, `_` atau `-`, diawali huruf; tersimpan saat Enter atau pindah kolom. Mengganti ID ikut
  memindahkan efek tertunda, baris khusus, dan nama tanda; menghapus tanda meminta konfirmasi dan menyebut apa yang ikut
  terhapus.
- **Nama tanda** (opsional, ≤ 80 karakter): sebutan yang dibaca pemegang tanda di pengingat dan ringkasan, mis. "janji
  penyelesaian yang belum pasti". Kosong = "keputusanmu di babak n".
- Di babak sesudahnya: **Efek tertunda** (perubahan status −40…+40 saat babak dimulai, maks. 3 per babak) dan/atau
  baris dialog yang **hanya untuk pemegang tanda**.
- Pemegang tanda melihat pengingat pribadi saat babak itu dibaca dan dijawab (juga satu baris di bawah pertanyaan),
  catatan dampak di hasilnya ("Dampak tertunda di awal babak ini — …", sebelum status: perubahan status di hasil
  dihitung dari awal babak, sesudah dampak itu), dan di ringkasan akhir bagian "Akibat yang muncul belakangan" — juga
  bila statusnya pulih dan akhir ceritanya baik. Layar acara dan host tidak pernah melihatnya.
- Peringatan: tanda belum dipakai babak sesudahnya; tanda yang sama ditinggalkan di beberapa babak (pengingat menyebut
  babak terakhir yang meninggalkannya — pakai ID berbeda bila maksudnya berbeda).

### 4.6 Membaca Audit pilihan

Audit menjawab satu pertanyaan: bisakah pemain menebak pilihan tepat dari panjang teksnya saja?
- **Per babak** (di bawah lima pilihan): tabel Pilihan, Kunci, Kata, Karakter, Urutan panjang (1 = terpanjang;
  panjang sama berbagi urutan) dan ringkasannya, mis. "pilihan tepat paling panjang" atau "pilihan tepat terpanjang
  ke-3 dari 5". Panel terbuka sendiri bila pilihan tepat satu-satunya yang terpanjang atau ada saran.
- **Seluruh skenario** (tab **Validasi**): strategi buta "Selalu pilih yang terpanjang" dan "Selalu pilih yang
  terpendek": jumlah tepat dari 15 (bila seri: terburuk–terbaik dan nilai harapan), poin harapan (jawab di detik ke-15,
  bobot kurang tepat ikut dihitung, kebijakan nilai aktif), dan ✓/✕ terhadap target paling banyak 5 dari 15 (dinilai
  dari hasil terbaik saat seri; berlaku setelah 15 babak lengkap). Klik baris babak untuk membukanya.
- **Saran kuning** (tidak memblokir pengajuan): pilihan lebih dari 20 kata; pilihan tepat paling panjang dan ≥ 1,5
  kali median panjang pilihan lain; pelajaran lebih dari 30 kata; dua pilihan tindakan atau lebih di skenario tanpa
  satu pun yang tepat (§4.4).
- Memperbaiki: samakan panjang, bentuk, nada, dan detail; pindahkan fakta bersama ke berkas; jangan menambah kata
  pengisi atau spasi, dan jangan mengubah kunci demi audit. Audit adalah pemeriksaan desain, bukan bukti statistik.
  Kata khas tidak diukur, dan bentuk pilihan (tindakan/pesan) hanya lewat saran di atas: periksa sendiri bersama
  reviewer.

## 5. Nilai yang dilihat peserta (kebijakan sementara `story-70-30-v2`)

Tiap babak maks. 1.000 poin: 700 × bobot ketepatan, ditambah 300 × (sisa detik ÷ 30) bila bobotnya di atas 0.
Contoh pilihan Tepat: langsung = 1.000, detik ke-15 = 850, detik ke-30 = 700. Kurang tepat berbobot 0,5: langsung =
650, detik ke-15 = 500. Keliru = 0. Waktu habis = 0. Rumus ini belum disetujui komite; hasil lama yang tersimpan dengan
kebijakan sebelumnya (`story-70-30-v1`) tidak dihitung ulang. Membuka berkas, bentuk pilihan, balasan, dan pelajaran
tidak memengaruhi nilai.

## 6. Validasi sebelum diajukan

Sistem menolak pengajuan/penerbitan bila ada galat, misalnya: jumlah babak bukan 15, pilihan bukan 5, teks kosong,
konsekuensi kosong, bobot tidak sesuai klasifikasi, aset tidak ada/diarsipkan, akhir cerita kurang, teks terlalu
panjang, meja berkas tanpa berkas, adegan lapangan tanpa titik atau dengan latar bawaan, berkas tanpa
judul/isi/baris/gambar, gambar berkas berupa latar bawaan, atau `{nama}` di judul skenario/babak. Pesan selalu menyebut
babak dan isiannya ("Babak 3: konsekuensi pilihan 4 belum diisi").
**Peringatan** kuning (mis. teks mirip nomor polis/klaim/telepon, chat tanpa kontak, balasan tanpa yang membalas,
saran Audit pilihan, pilihan tindakan yang tidak pernah tepat) tidak memblokir, tetapi wajib diperiksa.

## 7. Pratinjau

Mainkan babak 1–15 dengan kegiatan, berkas, pilihan, dan kartu hasil yang sama dengan room. Pratinjau mulai saat
pilihan terbuka (tanpa waktu baca, jadi tanpa baris "Tugas: …", seperti room setelah pilihan dibuka), menampilkan
pilihan dalam urutan editor, tanpa timer berjalan, dan menutup jawaban begitu dikirim. Isi **Nama pemain
(pratinjau)** untuk `{nama}`, pilih jawaban, ubah "simulasi waktu jawab", dan lihat balasan, pelajaran, status
customer, pengingat tanda, nilai, serta akhir cerita (jenisnya ditulis "Akhir bahagia (happy ending penuh)", "Selesai
dengan catatan", atau "Kurang puas"). **Uji jalur cepat** menunjukkan akhir untuk jalur terbaik, campuran, terlemah,
semua waktu habis, dan (bila ada tanda) jalur yang memilih pilihan bertanda — pastikan jalur terbaik mendapat happy
ending dan jalur lemah tidak.

## 8. Review dan terbit

1. Penulis: tab **Review, terbit & riwayat** → **Ajukan ke review** (perlu 0 galat dan draf tersimpan). Draf terkunci.
2. Reviewer (bukan orang yang mengajukan/menyunting — prinsip empat mata):
   - **Kembalikan ke draf** dengan catatan, atau
   - untuk kasus settled: tulis bukti anonimisasi di catatan lalu **Catat pemeriksaan anonimisasi**, kemudian
   - **Terbitkan**. Versi terbit tidak bisa diubah; host langsung bisa memakainya tanpa rilis ulang aplikasi.
3. Mengubah skenario terbit membuat draf baru; versi lama tetap dipakai room sampai versi baru terbit.
   Room yang sedang/sudah berjalan selalu memakai versi saat room dibuka.
4. **Arsipkan** menyembunyikan skenario dari host. **Tarik versi** mencegah versi itu membuka room kompetisi baru.
   Hasil lama tetap tersimpan.

## 9. Pustaka aset (admin sistem)

Menu **Pustaka aset** → **+ Unggah aset**: pilih jenis (latar, tokoh & ekspresi, foto bukti, video, musik), berkas
(PNG/JPG/WebP ≤ 6 MB, MP3/OGG ≤ 15 MB, MP4/WebM ≤ 60 MB) dan **wajib** isi judul, sumber, dan lisensi/hak pakai.
Tokoh bisa diberi beberapa ekspresi (**Tambah ekspresi**). Jangan unggah foto orang nyata atau dokumen klaim/polis.
Gambar berkas (foto bukti, diagram) diunggah sebagai **foto bukti**; gambar adegan lapangan sebagai **latar**. Latar
bawaan (piksel) tidak punya berkas gambar, jadi tidak bisa dipakai untuk adegan lapangan atau gambar berkas. Dokumen
di berkas ditulis ulang sebagai teks ringkas, bukan pindaian dokumen asli.
Aset yang diarsipkan membuat skenario yang memakainya gagal validasi terbit sampai asetnya diganti.

## 10. Kategori (admin sistem)

MVP: hanya Auto yang aktif. HVC dan Property disiapkan nonaktif; Cargo tercatat sebagai permintaan masa depan.
Mengaktifkan kategori tidak membuat kontennya — konten tetap harus ditulis, direview, dan disetujui.

## 11. Yang masih menunggu keputusan pemilik

Lihat `docs/prd-v02/CONTENT-HANDOFF.md`: dua kasus Auto resmi beserta kunci jawaban komite, pemeriksa anonimisasi,
aturan pemenang, dan persetujuan rumus nilai. Kegiatan babak, berkas, dan ambang Audit pilihan adalah keputusan lokal
yang belum disetujui: lihat `DECISIONS.md` D-28–D-47.
