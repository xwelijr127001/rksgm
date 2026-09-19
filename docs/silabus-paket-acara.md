# Silabus Paket Acara RAKSA GAME (a01 - a10)

> **Status: DRAF tim game, 19 Sep 2026. BELUM ditinjau PIC Claim.**
> Semua kasus adalah simulasi edukasi. Setiap konsep klaim di bawah bersumber dari materi yang
> SUDAH ADA di `shared/missions.ts` + `server/src/answerKeys.ts` (m01 - m11) atau prinsip asuransi
> umum yang tidak kontroversial. Tidak ada aturan, nominal, atau ketentuan polis baru. Hal yang
> tetap perlu dikonfirmasi ada di [bagian 5](#5-perlu-konfirmasi-pic-claim).
>
> Dokumen ini adalah silabus (rancangan isi). Berkas misi (`shared/acara/aNN.ts`), kunci
> (`server/src/acara/aNN.ts`), dan adegan (`client/src/game/scenes/aNN-*.ts`) BELUM dibuat.
> Kontrak struktur berkas: `docs/rancangan-bank-soal.md`.

## 1. Ringkasan

| # | Id misi | Judul | Produk | Tingkat | sceneKey | Langkah | Masukan | Waktu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a01-api-padam` | Setelah Api Padam | FIRE | 1 | `ruko` | multi 2 dari 5 | 2 | 45 dtk |
| 2 | `a02-jepret-kiriman` | Jepret Dulu, Baru Angkut | CARGO | 1 | `parkiran` | multi 3 dari 6 (kamera) | 3 | 45 dtk |
| 3 | `a03-tugas-foto` | Empat Foto, Apa Tugasnya? | AUTO | 1 | `bengkel` | assign 4 ke 4 | 4 | 50 dtk |
| 4 | `a04-peti-kurang` | Peti yang Tak Sampai | CARGO | 2 | `pelabuhan` | number, number, single | 3 | 60 dtk |
| 5 | `a05-nasib-beda` | Kerusakan Sama, Nasib Beda | AUTO | 2 | `kantor` | number, assign 3 ke 3 | 4 | 60 dtk |
| 6 | `a06-urutan-gudang` | Satu per Satu, Pak Kepala Gudang | HVC | 2 | `gudang-forklift` | assign 5 ke 5 (nomor urut) | 5 | 65 dtk |
| 7 | `a07-tiga-polis` | Tiga Polis, Satu Banjir | FIRE | 2 | `gudang` | assign 3 ke 4, single | 4 | 70 dtk |
| 8 | `a08-linimasa-ex` | Lini Masa Excavator | HVC | 3 | `proyek` | assign 5 ke 3, single | 6 | 80 dtk |
| 9 | `a09-hitung-lapis` | Hitung Berlapis | HVC | 3 | `kantor-hitung` | number x 3 | 3 | 85 dtk |
| 10 | `a10-banjir-susulan` | Grand Mission: Banjir Susulan | MIX | 3 | `kota-banjir` | assign 4 ke 5, assign 4 ke 5 | 8 | 90 dtk |

Total waktu aktif 650 detik. Ronde penentuan tetap `m11-penentuan`.

**Cakupan produk:** FIRE a01, a07 | CARGO a02, a04 | AUTO a03, a05 | HVC a06, a08, a09 | MIX a10
(keempat produk sekaligus). Paket latihan hanya punya satu misi CARGO; paket acara punya dua
ditambah satu kasus di a10. HVC muncul tiga kali karena a08 dan a09 adalah satu "episode"
(excavator EX-2085) yang sengaja bersambung.

**Sepuluh latar lama, masing-masing dipakai tepat satu kali, dengan mekanik yang BERBEDA dari misi
latihan pemilik latar itu:**

| Latar | Di paket latihan | Di paket acara |
| --- | --- | --- |
| ruko (m03) | masukkan 4 dokumen ke folder | a01: ketuk 2 tindakan |
| parkiran (m01) | pilih 1 tindakan | a02: kamera bukti 3 foto |
| bengkel (m02) | kamera bukti | a03: tempel stiker fungsi di 4 foto |
| pelabuhan (m06) | 2 angka + papan aksi | a04: 2 angka gabungan 3 dokumen + papan aksi (satu-satunya mekanik yang serupa; kasus dan jebakannya baru) |
| kantor (m05) | stempel 2 map | a05: hitung persen dulu, lalu stempel 3 map |
| gudang-forklift (m08) | pilah bukti ke nampan | a06: stiker nomor urut |
| gudang (m07) | pilih polis + alasan | a07: pilah 3 berkas polis + alasan |
| proyek (m04) | cari 4 informasi | a08: pilah 5 bagian unit dengan 3 dokumen |
| kantor-hitung (m09) | 3 angka berperancah | a09: 3 angka tanpa perancah, dasar hitung disusun sendiri |
| kota-banjir (m10) | 3 kasus x 3 tahap | a10: 4 kasus x 2 tahap, jawaban sengaja berbeda dari m10 |

**Lencana** (`shared/scoring.ts` terikat indeks ronde): ronde 2 dan 4 = "Detektif Bukti" -> a02
(foto bukti) dan a04 (detektif dokumen & foto); ronde 9 = "Hitung Teliti" -> a09; ronde 10 =
"Pahlawan Kota" -> a10 (kompleks usaha kota). Urutan silabus sengaja cocok.

## 2. Keputusan penyuntingan

Dua usulan digabung: satu dari sudut pedagogi (tangga kompetensi, keseimbangan produk), satu dari
sudut keseruan & visual (tiap latar sekali, variasi mekanik, alur bersambung).

Diambil dari usulan pedagogi:
- Tangga kompetensi mengenali -> memilah -> menggabung informasi -> menghitung -> kasus campuran, dengan
  pola spiral: tidak ada konsep yang muncul pertama kali di soal sulit.
- a01 (prinsip m01 dipindah ke properti), a03 (menguji FUNGSI bukti, bukan memilih foto lagi), inti
  a05 (kerusakan rupiah sama, hasil beda; persen tidak tertulis di kartu), a07 (periode benar-benar
  menjadi pembeda; tanggal kejadian di dokumen terpisah), hitungan 3 langkah tanpa perancah, chip
  pengecoh = hasil satu kekeliruan yang masuk akal, semua baris kartu berbendera `info`.

Diambil dari usulan keseruan & visual:
- Tiap latar dipakai sekali dengan mekanik baru; a04 (tekanan sopir), a06 (urutan proses lewat
  stiker nomor, karena jenis langkah `order` belum didukung layar main), episode a08 -> a09
  (excavator EX-2085), a10 di tempat yang sama dengan m10 tetapi jawabannya berbeda (anti-hafalan),
  dan ketentuan risiko sendiri a09 yang SAMA PERSIS dengan m09 (10%, minimum Rp5.000.000).

Perubahan penyunting:
- a02 dipindah dari dermaga ke parkiran kota (kiriman kurir di depan toko) supaya latar pelabuhan
  hanya dipakai sekali dan latar parkiran tidak menganggur.
- a03: kategori pengecoh "membuktikan siapa yang bersalah" (klaim baru, tidak ada di materi) diganti
  foto ke-4 (selfie) dengan kategori "tidak membantu pemeriksaan", yang kalimatnya ada di kunci m02.
- a04: tabel foto dibuat satu baris per FOTO kerusakan (peti #20 difoto dua kali), sehingga jebakan
  "hitung peti, bukan foto" nyata; chip 16 (= 21 - 5) ditambahkan.
- a05: satu langkah angka + tiga stempel m05 apa adanya; dua map mendapat stempel yang sama dan satu
  stempel tidak terpakai, jadi tidak bisa ditebak lewat eliminasi.
- a09: 3 baris papan (bukan 4) supaya latar `m09-latar` bisa dipakai tanpa diubah.
- a10: tanpa tahap hitung (lihat "Varian opsional" di rincian a10): 8 penempatan + 4 kartu netral
  dalam 90 detik sudah padat untuk HP.
- Batas lebar stiker/label di adegan rapat (temuan baru, lihat bagian 6 butir 7 - 8).

Tidak dipakai: misi "tempel stiker produk di kota" (terlalu mudah, bukan misi bukti untuk lencana
ronde 2, dan butuh konfirmasi truk niaga = AUTO); "dapur kafe" (mekanik, latar, dan checklist sama
dengan m03 sehingga terasa mengulang); "enam peti tiga dokumen" (status peti ketika bukti terima dan
foto bertentangan bisa diperdebatkan); varian hitung dengan minimum Rp10.000.000 dan nilai
pertanggungan sebagai pengecoh (angka baru yang tidak perlu).

## 3. Tangga kesulitan

| Tingkat | Misi | Ciri |
| --- | --- | --- |
| 1 Mudah | a01 - a03 | Satu langkah, tanpa dokumen, tanpa angka, pengecoh jelas salah bagi yang paham m01/m02. 2 - 4 masukan, 45 - 50 detik. Naik tipis: pilih 2 -> pilih 3 -> jelaskan fungsi. |
| 2 Sedang | a04 - a07 | 2 - 4 dokumen harus digabung, persen dihitung sendiri, kategori tidak satu-lawan-satu, urutan proses, pengecoh yang diucapkan tokoh cerita. 3 - 5 masukan, 60 - 70 detik. |
| 3 Sulit | a08 - a10 | Kunci ada pada perbandingan TANGGAL antar 3 dokumen (a08); hitungan berlapis dengan dua jebakan independen: dasar hitung + minimum yang mengikat (a09); empat produk, kartu tanpa bendera, satu kasus nyaris lolos, tempat sama dengan m10 tetapi jawaban beda (a10). 80 - 90 detik. |

Cara menaikkan kesulitan yang dipakai hanya yang sah: pengecoh masuk akal, informasi tersebar di
beberapa dokumen, multi-langkah, hitungan berlapis pola m09, kasus campuran, urutan proses.
Penyusutan dan batas pertanggungan yang mengikat TIDAK dipakai (tidak ada di materi).

## 4. Rincian per misi

Konvensi: semua kartu polis/tabel berlabel "(simulasi)" dan semua barisnya `flag: 'info'` (netral,
warna kartu tidak membocorkan jawaban). Urutan opsi di data bebas (tampilan diacak `urutanTampil`).
`briefingSeconds`: 10 (tingkat 1 - 2), 12 (tingkat 3). `level` = tingkat.

---

### a01-api-padam - Setelah Api Padam

FIRE | tingkat 1 | 45 detik | lokasi: Toko Kain Jalan Kenanga | sceneKey `ruko`

**Konsep klaim.** Tindakan pertama setelah kejadian dan kondisi aman: dokumentasikan kerusakan, lalu
laporkan lewat kanal klaim. Membuang barang rusak, memperbaiki dulu, atau mengabaikan membuat bukti
hilang. Prinsip m01 dipindahkan dari kendaraan ke properti.

**Cerita.** Api di toko kain nasabah sudah padam dan petugas pemadam menyatakan lokasi aman. Pemilik
ingin toko cepat buka lagi dan bertanya, "Sekarang saya harus apa dulu?" (Tanpa dokumen.)

**Langkah**
1. `tindakan` - multi (cards), pilih 2, bobot 1 - "Pilih 2 tindakan yang tepat dilakukan lebih dulu"
   - `foto` Foto kerusakan dan barang terdampak sebelum dipindahkan
   - `lapor` Laporkan kejadian melalui kanal klaim
   - `buang` Buang barang hangus supaya toko cepat rapi
   - `perbaiki` Panggil tukang untuk memperbaiki dulu, lapor setelah selesai
   - `abaikan` Buka toko seperti biasa; tidak perlu lapor karena api sudah padam
   - **Kunci:** `foto` + `lapor`. Penjelasan: dokumentasi + laporan menjaga jejak kejadian; membuang,
     memperbaiki dulu, atau mengabaikan membuat bukti hilang.

**Adegan.** Latar `m03-latar` dipakai utuh (ekspor `latar()` dari `m03-ruko.ts`, kunci tekstur sama).
Lima objek `option` seragam 96 x 88 di slot meja m03 (kolom x 186/364/542, baris y 136/276; satu slot
kosong), `fx: 'choose'`, `acakPosisi: ['tindakan']`. Label: "Foto kerusakan", "Lapor klaim",
"Buang yang hangus", "Perbaiki dulu", "Buka toko saja". Bahan gambar: `props.phone()`,
`props.docSheet()`, `props.trashBin()`, `props.toolbox()`, papan "BUKA" (baru). Prop: pemilik toko
(`personArt`) di dekat pintu rolling. Tidak ada objek `doc`; folder m03 tidak dipakai.

**Kenapa tingkat 1.** Satu langkah, tanpa dokumen/angka, 2 - 3 ketukan. Sedikit di atas m01 karena
memilih DUA dari lima dan produknya lain (menguji prinsip, bukan hafalan soal).

**Sumber materi.** m01 (opsi + penjelasan kunci), m03 (foto kerusakan & barang terdampak; "lokasi
dinyatakan aman").

---

### a02-jepret-kiriman - Jepret Dulu, Baru Angkut

CARGO | tingkat 1 | 45 detik | lokasi: Parkiran Ruko Jalan Melati | sceneKey `parkiran`

**Konsep klaim.** Bukti yang relevan menghubungkan objek secara keseluruhan, titik kerusakan, dan
identitas objek. Prinsip m02 dipindahkan ke barang kiriman (identitas = label kiriman & nomor peti).

**Cerita.** Truk kurir menurunkan kiriman suku cadang di parkiran depan toko nasabah. Peti nomor 5
terlihat penyok di satu sisi. Peti akan segera diangkut ke dalam, jadi kamu hanya sempat mengambil
tiga foto. (Tanpa dokumen.)

**Langkah**
1. `bukti` - multi (cards), pilih 3, bobot 1 - "Pilih 3 foto yang paling berguna untuk pemeriksaan"
   - `tumpukan` Foto seluruh tumpukan peti saat diterima
   - `penyok` Foto dekat sisi peti nomor 5 yang penyok
   - `label` Foto label kiriman dan nomor peti
   - `selfie` Selfie bersama kurir
   - `spanduk` Foto spanduk promo toko sebelah
   - `gerobak` Foto gerobak es di trotoar
   - **Kunci:** `tumpukan` + `penyok` + `label`. Penjelasan: tumpukan menunjukkan kondisi kiriman saat
     diterima, foto dekat menunjukkan titik kerusakan, label/nomor memastikan peti yang diperiksa
     benar. Tiga lainnya tidak membantu pemeriksaan.

**Adegan.** Latar `m01-latar` dipakai utuh (ekspor `latar()` dari `m01-parkiran.ts`). Prop: truk
kurir (`vehicles.truck()`) di petak parkir, kurir (`personArt`). Enam objek `option` dengan
`fx: 'photo'` (baki "Album bukti", maks 3), posisi terikat benda sehingga TANPA `acakPosisi`, titik
ketuk seragam: "Tumpukan peti" (palet 4 - 5 `props.crate()` di belakang truk), "Sisi penyok"
(`crate({ rusak: true, nomor: '5' })` di depan tumpukan, depth lebih tinggi - pola mobil/penyok m02),
"Label peti" (label kiriman, baru), "Selfie kurir", "Spanduk promo" (di awning ruko), "Gerobak es"
(trotoar, baru).

**Kenapa tingkat 1.** Satu langkah 3 dari 6, pengecoh mudah dikenali. Lebih menuntut dari m02 hanya
karena pemain harus menerjemahkan "identitas kendaraan" menjadi "label & nomor peti".

**Sumber materi.** m02 (kunci: foto keseluruhan, detail titik kerusakan, identitas), m06 (foto
penerimaan: tumpukan peti, peti bernomor dengan kemasan rusak).

---

### a03-tugas-foto - Empat Foto, Apa Tugasnya?

AUTO | tingkat 1 | 50 detik | lokasi: Bengkel Mitra | sceneKey `bengkel`

**Konsep klaim.** Memahami FUNGSI tiap bukti: foto keseluruhan = kondisi kendaraan, foto detail =
titik benturan, foto identitas = memastikan kendaraan yang diperiksa benar; foto lain tidak membantu
pemeriksaan.

**Cerita.** Mobil nasabah ditabrak dari belakang; bemper belakang kanan penyok. Empat foto sudah
tercetak dan digantung di bengkel. Kepala bengkel bertanya, "Masing-masing foto ini sebenarnya
membuktikan apa?" (Tanpa dokumen.)

**Langkah**
1. `fungsi` - assign (match), bobot 1 - "Cocokkan tiap foto dengan kegunaannya"
   - Item: `foto-a` Foto A - seluruh mobil dari samping | `foto-b` Foto B - bemper belakang kanan dari
     dekat | `foto-c` Foto C - plat nomor dan nomor rangka | `foto-d` Foto D - selfie nasabah di depan
     bengkel
   - Kategori: `kondisi` Menunjukkan kondisi kendaraan secara keseluruhan | `titik` Menunjukkan titik
     benturan | `identitas` Memastikan kendaraan yang diperiksa benar | `tidak` Tidak membantu
     pemeriksaan
   - **Kunci:** foto-a -> kondisi; foto-b -> titik; foto-c -> identitas; foto-d -> tidak.

**Adegan.** Latar `m02-latar` dipakai utuh (ekspor `latar()` dari `m02-bengkel.ts`). Prop: mobil
(`carSide()` warna baru + `dentPatch()` di belakang) di area kerja kuning. Empat objek `item`
polaroid seragam 92 x 100 pada tali foto melintang di dinding (y sekitar 190; x 92/244/396/548),
`fx: 'tag'`: "Foto A" - "Foto D" (isi polaroid menggambarkan fotonya). Kategori lewat daftar HTML
(pola m10). `bucketShort` (maks 13 huruf karena jarak 152): "Kondisi mobil", "Titik bentur",
"Identitas", "Tak membantu".

**Kenapa tingkat 1 (penutup).** Satu langkah, empat pasangan yang hubungannya jelas. Lebih tinggi
dari a02 karena pemain harus menjelaskan MENGAPA bukti itu relevan: jembatan ke "memilah" di tingkat 2.

**Sumber materi.** m02 (teks penjelasan kunci, termasuk "tidak membantu pemeriksaan").

---

### a04-peti-kurang - Peti yang Tak Sampai

CARGO | tingkat 2 | 60 detik | lokasi: Pelabuhan & Logistik | sceneKey `pelabuhan`

**Konsep klaim.** Jumlah barang, kondisi penerimaan, dan dokumen diperiksa bersama; ketidaksesuaian
didokumentasikan dan dokumen pengangkutan dilengkapi; jangan menyimpulkan semua otomatis dijamin dan
jangan menerima tanpa catatan.

**Cerita.** Kiriman suku cadang tiba di pelabuhan. Sopir truk ingin bukti terima segera
ditandatangani supaya bisa berangkat lagi. Cocokkan dulu ketiga dokumen.

**Dokumen** (tables)
- `pengiriman` Daftar Pengiriman: Jumlah peti dikirim 24 peti | Jenis barang Suku cadang mesin |
  Tanggal muat 02 Sep 2026
- `penerimaan` Bukti Penerimaan: Jumlah peti diterima 21 peti | Catatan kondisi Sebagian kemasan
  rusak, lihat foto | Tanggal terima 10 Sep 2026
- `foto` Foto Penerimaan: Foto 1 Tumpukan peti di gudang penerima | Foto 2 Peti #3 kemasan penyok |
  Foto 3 Peti #9 kemasan basah | Foto 4 Peti #15 kemasan terbuka | Foto 5 Peti #20 sisi kiri penyok |
  Foto 6 Peti #20 sisi bawah basah. Catatan tabel: "Semua peti berkemasan rusak sudah difoto."

**Langkah**
1. `selisih` - number (peti), chip 1/2/3/4/5, bobot 1 - "Berapa peti yang belum diterima?"
   **Kunci: 3** (24 - 21).
2. `baik` - number (peti), chip 16/17/18/20/21, bobot 1 - "Berapa peti diterima dengan kemasan baik?"
   **Kunci: 17** (21 diterima - 4 peti berkemasan rusak: #3, #9, #15, #20). Pengecoh: 16 = menghitung
   5 foto kerusakan padahal peti #20 difoto dua kali; 18 = 21 - 3 (tertukar dengan selisih);
   20 = 24 - 4; 21 = tidak dikurangi.
3. `tindak` - single (cards), bobot 2 - "Sopir menunggu. Apa tindak lanjutnya?"
   - `catat` Dokumentasikan selisih jumlah dan kemasan rusak, lalu lengkapi dokumen pengangkutan untuk
     pemeriksaan
   - `ttd` Tanda tangani bukti terima tanpa catatan supaya truk bisa segera berangkat
   - `semua` Simpulkan 24 peti otomatis dijamin dan ajukan penggantian penuh
   - `separuh` Catat selisih jumlah saja; kemasan rusak tidak perlu dicatat
   - **Kunci:** `catat`.

**Adegan.** Latar `m06-latar` utuh; ekspor `latar()`, `peti()`, `papanKiriman()`, `lembarTerima()`,
`fotoPeti()`, `papanAksi()` dari `m06-pelabuhan.ts`. Tata letak m06 dipakai: tiga objek `doc`
("Daftar kiriman" 186,256; "Foto peti" 562,144; "Bukti terima" 562,270), empat papan aksi `option`
84 x 84 di y 400 (x 108/238/368/498), `fx: 'choose'`, `acakPosisi: ['tindak']`: "Catat lengkap",
"Tanda tangan", "Klaim semua", "Catat selisih" (dua ikon baru: pena tanda tangan, daftar separuh).
Papan (boards) "Catatan petugas": baris "Belum diterima" (`selisih`) dan "Kemasan baik" (`baik`).
Prop baru: tumpukan peti lebih besar dengan #3, #9, #15, #20 tampak rusak (pemain jeli bisa
menghitung dari adegan), sopir melirik jam (`motion: 'bob'`).

**Kenapa tingkat 2.** Tiga langkah, tiga dokumen. Angka kedua hanya bisa dijawab dengan menggabung
bukti terima + foto dan ada jebakan satu peti dua foto. Pengecoh tindak lanjut masuk akal (tekanan
sopir; catat separuh).

**Sumber materi.** m06 (selisih, kemasan rusak, "dokumentasikan ketidaksesuaian dan lengkapi dokumen
pengangkutan", larangan menyimpulkan otomatis dijamin, opsi salah "terima saja").

---

### a05-nasib-beda - Kerusakan Sama, Nasib Beda

AUTO | tingkat 2 | 60 detik | lokasi: Kantor Raksa | sceneKey `kantor`

**Konsep klaim.** Kerusakan yang sama ditangani berbeda karena jaminan polis berbeda, dan ambang TLO
(minimal 75%) dihitung terhadap NILAI KENDARAAN masing-masing. TLO tidak selalu berarti "tidak".

**Cerita.** Tiga mobil masuk meja klaim hari ini. Dua di antaranya rusak berat dengan estimasi yang
sama, Rp160 juta. Asumsikan semua polis aktif dan kondisi lain dalam simulasi terpenuhi.

**Dokumen** (policyCards; kartu TIDAK menampilkan persentase)
- `polis-a` Kartu Polis A - Comprehensive (simulasi): Nilai kendaraan Rp250.000.000 | Kerusakan
  benturan Tercakup sesuai syarat kartu | Estimasi kerusakan Rp10.000.000 | Status polis Aktif
- `polis-b` Kartu Polis B - TLO (simulasi): Nilai kendaraan Rp200.000.000 | Ambang kerusakan total
  Minimal 75% nilai kendaraan | Estimasi kerusakan Rp160.000.000 | Status polis Aktif
- `polis-c` Kartu Polis C - TLO (simulasi): Nilai kendaraan Rp400.000.000 | Ambang kerusakan total
  Minimal 75% nilai kendaraan | Estimasi kerusakan Rp160.000.000 | Status polis Aktif

**Langkah**
1. `persen` - number (%), chip 40/64/75/80, bobot 1 - "Kerusakan Kasus B = berapa persen dari nilai
   kendaraannya?" **Kunci: 80** (Rp160 juta / Rp200 juta). Pengecoh: 40 = dibagi nilai Polis C;
   64 = dibagi nilai Polis A; 75 = angka ambang.
2. `simpul` - assign (match), bobot 2 - "Stempel kesimpulan untuk tiap map kasus"
   - Item: `kasus-a` Kasus A - Kartu Polis A (Comprehensive) | `kasus-b` Kasus B - Kartu Polis B (TLO)
     | `kasus-c` Kasus C - Kartu Polis C (TLO)
   - Kategori: `lanjut` Dapat dilanjutkan untuk penilaian | `tidak-ambang` Kerusakan tidak memenuhi
     ambang TLO dalam simulasi | `perlu-data` Perlu informasi tambahan sebelum disimpulkan
   - **Kunci:** kasus-a -> lanjut (benturan tercakup pada kartu); kasus-b -> lanjut (80% >= 75%);
     kasus-c -> tidak-ambang (Rp160 juta / Rp400 juta = 40% < 75%). `perlu-data` tidak terpakai.

**Adegan.** Latar m05 DIPARAMETRIKAN (tiga alas kerja) -> kunci baru `a05-latar`; ekspor `latar()`,
`stempel()`, `mapKasus()` (tambah huruf C), `kartuPolis()` dari `m05-kantor.ts`. Tiga stempel
`bucket` di rak (x 104/308/512, y 94; gambar & kunci tekstur m05 boleh dipakai ulang karena SVG
identik): "Lanjut dinilai", "Di bawah ambang", "Perlu info". Tiga map `item` (`fx: 'stamp'`) di
x 112/320/528: "Kasus A/B/C". Tiga objek `doc` "Polis A/B/C": kartu berdiri kecil 70 x 62
(`kartuBerdiri()` m10) di samping tiap map, map diperkecil ke lebar sekitar 130 bila perlu.
`bucketShort` sama dengan m05. Tanpa papan (dinding penuh rak stempel); langkah `persen` dijawab
lewat chip HTML.

**Kenapa tingkat 2.** Persen tidak lagi tertulis di kartu, ada kasus TLO yang MEMENUHI ambang
(penghafal "TLO = tidak" terjebak), dua kasus dengan rupiah sama berakhir beda, dan dua map mendapat
stempel yang sama sehingga eliminasi tidak menolong.

**Sumber materi.** m05 (Comprehensive vs TLO, "ambang kerusakan total minimal 75% nilai kendaraan",
pola Rp4 juta / Rp200 juta = 2%, tiga kategori).

---

### a06-urutan-gudang - Satu per Satu, Pak Kepala Gudang

HVC | tingkat 2 | 65 detik | lokasi: Gudang Alat Berat | sceneKey `gudang-forklift`

**Konsep klaim.** Urutan proses: dokumentasi (kerusakan, posisi unit, nomor seri) -> lapor melalui
kanal klaim -> survei / penilaian sesuai prosedur -> perbaikan setelah koordinasi. Membuang bagian
rusak menghilangkan bukti.

**Cerita.** Forklift menyenggol rak besi di gudang alat berat. Semua orang aman dan area sudah
diamankan. Kepala gudang ingin semuanya beres hari ini juga: "Las saja sekarang, patahannya buang!"
Susun urutan penanganannya, dan temukan satu hal yang jangan dilakukan dulu. (Tanpa dokumen.)

**Langkah**
1. `urutan` - assign (stage), bobot 1 - "Beri nomor urut tiap tindakan (satu jangan dilakukan dulu)"
   - Item: `dok` Dokumentasikan kerusakan, posisi unit, dan nomor seri | `lapor` Laporkan kejadian
     melalui kanal klaim | `survei` Survei / penilaian kerusakan sesuai prosedur | `perbaiki`
     Perbaikan unit setelah ada koordinasi | `buang` Buang komponen yang patah supaya gudang rapi
   - Kategori: `l1` Langkah 1 | `l2` Langkah 2 | `l3` Langkah 3 | `l4` Langkah 4 | `jangan` Jangan
     dilakukan dulu
   - **Kunci:** dok -> l1; lapor -> l2; survei -> l3; perbaiki -> l4; buang -> jangan. Nilai parsial per
     kartu otomatis (rumus assign).

**Adegan.** Latar `m08-latar` utuh + prop forklift m08 (ekspor `latar()` dan `forklift()`; kunci
`m08-forklift` sama). Prop baru: rak besi penyok; kepala gudang menunjuk jam (`bob`). Lima objek
`item` seragam sekitar 96 x 88 di atas meja sortir yang sudah ada di latar (x 76/188/300/412/524),
`fx: 'tag'`, posisi kiri-kanan sengaja TIDAK mengikuti urutan benar. Label pendek (maks 11 huruf
karena jarak 112): "Foto & seri" (kamera + pelat seri), "Lapor klaim" (`phone()`), "Survei"
(`clipboard()` + helm), "Perbaikan" (`toolbox()` + percikan las), "Buang sisa" (`trashBin()` +
potongan garpu). Kategori lewat HTML; `bucketShort`: "Langkah 1" - "Langkah 4", "Jangan dulu". Saat
pembahasan, stiker 1-2-3-4 berjajar di gudang. Nampan m08 tidak dipakai.

**Kenapa tingkat 2.** Lima kartu ke lima slot menuntut paham ALUR (bukan satu fakta), ada tekanan
cerita untuk "perbaiki dulu", dan satu kartu jebakan yang bukan bagian urutan. Spiral dari a01.

**Sumber materi.** m01 (ringkasan kunci: dokumentasikan lebih dulu, lalu laporkan; perbaikan tanpa
dokumentasi/koordinasi dan membuang bagian rusak = salah), m04 (nomor seri & posisi unit), m10
(lanjutkan ke survei / penilaian sesuai prosedur).

---

### a07-tiga-polis - Tiga Polis, Satu Banjir

FIRE | tingkat 2 | 70 detik | lokasi: Gudang Sentra Niaga | sceneKey `gudang`

**Konsep klaim.** Jaminan relevan bila JENIS RISIKO tercantum DAN periode polis mencakup tanggal
kejadian. Nilai pertanggungan terbesar atau polis terbaru bukan alasan.

**Cerita.** Gudang Sentra Niaga terendam banjir. Pemilik menyodorkan tiga polis simulasi dan
berkata, "Pakai Polis B saja, itu yang paling baru dan nilainya paling besar."

**Dokumen**
- table `laporan` Laporan Kejadian: Tanggal kejadian 14 Feb 2026 | Penyebab Banjir | Objek Gudang
  Sentra Niaga
- `polis-a` Polis A - Property All Risk (simulasi): Perluasan banjir Tercantum | Periode polis
  01 Mar 2025 - 28 Feb 2026 | Objek Gudang Sentra Niaga | Nilai pertanggungan Rp2.000.000.000
- `polis-b` Polis B - Property All Risk (simulasi): Perluasan banjir Tercantum | Periode polis
  01 Mar 2026 - 28 Feb 2027 | Objek Gudang Sentra Niaga | Nilai pertanggungan Rp3.000.000.000
- `polis-c` Polis C - Kebakaran standar (simulasi): Perluasan banjir Tidak tercantum | Periode polis
  01 Jan 2026 - 31 Des 2026 | Objek Gudang Sentra Niaga | Nilai pertanggungan Rp2.000.000.000

**Langkah**
1. `periksa` - assign (match), bobot 2 - "Tentukan hasil pemeriksaan tiap polis untuk kejadian ini"
   - Item: `berkas-a` Berkas A - Polis A | `berkas-b` Berkas B - Polis B | `berkas-c` Berkas C - Polis C
   - Kategori: `sesuai` Perluasan banjir tercantum dan periode mencakup tanggal kejadian |
     `luar-periode` Tanggal kejadian di luar periode polis | `tanpa-banjir` Perluasan banjir tidak
     tercantum | `objek-beda` Objek berbeda dari yang tertulis di polis (pengecoh)
   - **Kunci:** berkas-a -> sesuai; berkas-b -> luar-periode (periode baru mulai 01 Mar 2026);
     berkas-c -> tanpa-banjir.
2. `alasan` - single (list), bobot 1 - "Pemilik ingin memakai Polis B karena paling baru dan nilainya
   terbesar. Tanggapanmu?"
   - `risiko-periode` Yang menentukan adalah jenis risiko yang tercantum dan periode yang mencakup
     tanggal kejadian
   - `terbaru` Setuju, polis terbaru berlaku untuk semua kejadian
   - `nilai-besar` Setuju, pilih polis dengan nilai pertanggungan terbesar
   - `selalu-dijamin` Ketiganya bisa dipakai karena banjir selalu dijamin polis properti
   - **Kunci:** `risiko-periode`.

**Adegan.** Latar m07 DIPARAMETRIKAN -> kunci baru `a07-latar`: meja kering m07 hanya x 210 - 430,
terlalu sempit untuk tiga binder berstiker (lihat bagian 6 butir 8); lebarkan meja ke sekitar
x 110 - 530 dan pindahkan ember/pel. Ekspor `latar()` (berparameter) dan `kardusBasah()` dari
`m07-gudang.ts`. Tiga objek `item` binder seragam (`props.binder()`, x 170/320/470), `fx: 'tag'`:
"Berkas A/B/C". Tiga objek `doc` kartu berdiri kecil di depan tiap binder (`kartuBerdiri()` m10):
"Polis A/B/C". Satu objek `doc` papan klip di dinding menggantikan kalender m07: "Laporan kejadian"
(refId `laporan`). Objek `info` "Kardus basah" dipertahankan. Kategori lewat HTML; `bucketShort`
(maks 12 huruf): "Sesuai", "Luar periode", "Tanpa banjir", "Objek beda". Langkah `alasan` lewat HTML.

**Kenapa tingkat 2 (puncak).** Empat dokumen dibaca silang, empat kategori untuk tiga item, lalu
langkah alasan dengan pengecoh yang diucapkan tokoh cerita. Di m07 kedua periode identik sehingga
periode tidak pernah menjadi pembeda; di sini Polis B gagal HANYA karena periode dan tanggal kejadian
tidak tertulis di kartu.

**Sumber materi.** m07 (perluasan banjir tercantum/tidak, periode vs tanggal kejadian; alasan salah:
nilai lebih besar, banjir selalu dijamin), m10 (kesesuaian objek).

---

### a08-linimasa-ex - Lini Masa Excavator

HVC | tingkat 3 | 80 detik | lokasi: Proyek Jalan Baru | sceneKey `proyek`

**Konsep klaim.** Benturan dijamin, keausan bertahap dikecualikan. Temuan yang sesuai kronologi
diperiksa sebagai terkait kejadian; yang sudah tercatat sebelum tanggal kejadian dipisahkan; yang
penyebabnya belum jelas menunggu pemeriksaan teknis.

**Cerita.** Pada 09 Agu 2026 excavator EX-2085 membentur dinding galian saat berputar. Operator
selamat dan area sudah diamankan. Bengkel mencatat lima temuan pada unit. Bandingkan buku servis
dengan laporan kejadian, lalu pilah tiap temuan.

**Dokumen**
- `kartu-hvc` Kartu Polis HVC - Alat Berat (simulasi): Benturan Termasuk jaminan sesuai syarat |
  Keausan bertahap Dikecualikan | Objek Excavator EX-2085
- table `laporan` Laporan Kejadian: Tanggal kejadian 09 Agu 2026 | Kronologi Saat berputar, boom dan
  kabin membentur dinding galian | Kondisi Operator selamat, area diamankan
- table `servis` Buku Servis EX-2085: 21 Jul 2026 Track shoe aus, disarankan ganti | 21 Jul 2026
  Selang hidrolik rembes ringan, dipantau | 21 Jul 2026 Boom, kaca kabin, mesin: kondisi baik |
  11 Agu 2026 Pemeriksaan setelah kejadian: boom penyok, kaca kabin pecah, mesin sulit hidup
  (penyebab belum diketahui)

**Langkah**
1. `pilah` - assign (sort), bobot 2 - "Pilah tiap temuan bengkel"
   - Item (label sengaja tidak menyebut kapan kerusakan muncul): `boom` Boom penyok | `kaca` Kaca
     kabin pecah | `track` Track shoe aus | `selang` Selang hidrolik rembes | `mesin` Mesin sulit hidup
   - Kategori: `terkait` Periksa sebagai kerusakan terkait kejadian | `sebelumnya` Pisahkan sebagai
     kondisi sebelum kejadian | `teknis` Perlu pemeriksaan teknis tambahan
   - **Kunci:** boom -> terkait; kaca -> terkait (keduanya sesuai kronologi, tercatat baik pada 21 Jul
     dan baru rusak pada pemeriksaan 11 Agu); track -> sebelumnya; selang -> sebelumnya (keduanya sudah
     tercatat 21 Jul, sebelum kejadian 09 Agu); mesin -> teknis (muncul setelah kejadian tetapi
     penyebab belum diketahui).
2. `simpul` - single (list), bobot 1 - "Kesimpulan awal yang tepat?"
   - `pisah` Kerusakan terkait benturan diperiksa, kondisi lama dipisahkan, yang belum jelas menunggu
     pemeriksaan teknis
   - `semua` Semua temuan otomatis dijamin karena terjadi benturan
   - `tolak` Seluruh laporan di luar jaminan karena unit punya keausan
   - `tunda` Perbaiki semuanya dulu, pemilahan dilakukan belakangan
   - **Kunci:** `pisah`.

**Adegan.** Latar `m04-latar` utuh + badan excavator m04; ekspor `latar()`, `badanDunia()`,
`potong()`, `boomLokal()`, `rodaRantaiLokal()`, `labelKe()` dari `m04-proyek.ts`. Lima objek `item`
berupa potongan yang menempel di badan unit (teknik `potong()`), `fx: 'tag'`, kontras setara:
"Boom penyok", "Track shoe" (dua potongan m04), dan BARU: "Kaca kabin" (retak), "Selang hidrolik"
(tetes oli), "Mesin" (kap terbuka). Dua objek `doc`: "Buku servis" (dipegang operator di kiri, refId
`servis`) dan "Laporan" (papan klip di barikade, refId `laporan`); kartu polis lewat tombol Dokumen.
`bucketShort` pendek karena bagian unit berdekatan: "Terkait", "Kondisi lama", "Cek teknis". Objek
pengecoh m04 (spanduk, warung, awan) tidak dipakai. Langkah `simpul` lewat HTML.

**Kenapa tingkat 3.** Lima item, tiga dokumen, dan kuncinya ada pada perbandingan TANGGAL antar
dokumen: "selang rembes" tampak seperti kerusakan baru dan "mesin sulit hidup" tampak seperti akibat
benturan, keduanya hanya terpilah benar oleh yang membaca buku servis. Di m08 label item hampir sama
dengan label kategori; di sini tidak.

**Sumber materi.** m08 (kartu HVC, tiga kategori, penjelasan kunci), m04 (identitas unit, bagian
rusak, kronologi), m07 (membandingkan tanggal), m06 (jangan simpulkan otomatis dijamin), m01
(perbaikan tanpa koordinasi).

---

### a09-hitung-lapis - Hitung Berlapis

HVC | tingkat 3 | 85 detik | lokasi: Meja Hitung Kantor Raksa | sceneKey `kantor-hitung`

**Konsep klaim.** Hitungan berlapis pola m09: (1) tentukan dasar hitung, hanya kerusakan terkait
kejadian, keausan dikeluarkan; (2) risiko sendiri = persentase dari kerugian yang disetujui ATAU
minimum, pakai yang lebih besar (di sini MINIMUM yang mengikat, kebalikan m09); (3) hasil = dasar -
risiko sendiri.

**Cerita.** Lanjutan kasus excavator EX-2085. Pemeriksaan teknis selesai: mesin sulit hidup ternyata
karena keausan, bukan benturan. Bengkel mengirim estimasi senilai total Rp60.000.000. Asumsikan
seluruh kerusakan akibat benturan disetujui sesuai estimasi dan tidak ada batas atau pengurang lain
dalam soal. (Misi ini berdiri sendiri: tiap baris estimasi sudah diberi keterangan, jadi tetap bisa
dimainkan bila a08 tidak ada di playlist.)

**Dokumen**
- `kartu-hvc` Kartu Polis HVC - Alat Berat (simulasi): Benturan Termasuk jaminan sesuai syarat |
  Keausan bertahap Dikecualikan | Risiko sendiri 10% dari kerugian yang disetujui | Minimum risiko
  sendiri Rp5.000.000 | Batas / pengurang lain Tidak ada
- table `estimasi` Estimasi Bengkel EX-2085: Boom penyok (akibat benturan) Rp28.000.000 | Kaca kabin
  pecah (akibat benturan) Rp12.000.000 | Track shoe & selang hidrolik (tercatat di servis sebelum
  kejadian) Rp15.000.000 | Mesin (hasil pemeriksaan teknis: keausan) Rp5.000.000 | Total estimasi
  Rp60.000.000

**Langkah** (semua number, format rupiah)
1. `dasar` - bobot 2 - "Kerugian terkait kejadian yang masuk hitungan" - chip Rp28.000.000 /
   Rp40.000.000 / Rp55.000.000 / Rp60.000.000. **Kunci: Rp40.000.000** (28 + 12 juta). Pengecoh: 28 =
   boom saja; 55 = hanya mesin yang dikeluarkan; 60 = total estimasi.
2. `risiko` - bobot 1 - "Risiko sendiri yang dipakai" (hint: bandingkan hasil persentase dengan nilai
   minimum) - chip Rp4.000.000 / Rp5.000.000 / Rp5.500.000 / Rp6.000.000. **Kunci: Rp5.000.000**
   (10% x Rp40 juta = Rp4 juta, lebih kecil dari minimum Rp5 juta). Pengecoh: 4 = lupa minimum;
   5,5 = 10% x 55 juta; 6 = 10% x total estimasi.
3. `hasil` - bobot 2 - "Hasil akhir simulasi" - chip Rp35.000.000 / Rp36.000.000 / Rp54.000.000 /
   Rp55.000.000. **Kunci: Rp35.000.000** (Rp40 juta - Rp5 juta). Pengecoh: 36 = lupa minimum;
   54 = dasar total estimasi (60 - 6); 55 = dasar total + minimum (60 - 5).

**Adegan.** Latar `m09-latar` dipakai TANPA perubahan (papan tetap 3 baris, `PAPAN.baris = 3`);
ekspor `latar()` dan `lembarData()` dari `m09-hitung.ts`. Dua objek `doc` setara di meja (y sekitar
264): "Estimasi bengkel" (refId `estimasi`, gambar berbasis `lembarData()` + ikon kunci pas, kunci
tekstur baru) dan "Kartu polis" (refId `kartu-hvc`, `props.policyCard()`). Papan "Lembar hitung"
(x 250, y 24, w 410): "Masuk hitungan", "Risiko sendiri", "Hasil akhir". Prop pemanis: miniatur
excavator kuning di meja (`bob`) sebagai penanda kasus yang sama dengan misi 8. Tidak ada objek
option/item.

**Kenapa tingkat 3.** Tiga langkah berantai tanpa perancah (m09 memberi langkah "10% x ..." dan
kerugian sudah jadi), dua dokumen harus digabung, dua jebakan independen (dasar hitung & minimum),
dan setiap chip pengecoh adalah hasil satu kekeliruan yang masuk akal. Menggabung a08 (memilah) dan
m09 (menghitung).

**Sumber materi.** m09 (risiko sendiri 10% dari kerugian yang disetujui, minimum Rp5.000.000, hasil =
kerugian - risiko sendiri, "tidak ada batas/pengurang lain"; ketentuan SAMA, angka kerugian beda), m08
(keausan & kondisi sebelum kejadian dipisahkan).

---

### a10-banjir-susulan - Grand Mission: Banjir Susulan

MIX (AUTO + HVC + PROPERTY + CARGO) | tingkat 3 | 90 detik | lokasi: Kompleks Usaha Kota | sceneKey
`kota-banjir`

**Konsep klaim.** Kasus campuran empat produk; tiap kasus memanggil pembeda produknya: AUTO = ambang
TLO, HVC = kesesuaian identitas & bukti, PROPERTY = perluasan + periode, CARGO = kesesuaian
jumlah/kondisi antar dokumen. Periksa objek, jaminan, periode, dan bukti sebelum menentukan langkah.

**Cerita.** Banjir susulan melanda Kompleks Usaha Kota pada 14 Mar 2026. Semua orang sudah aman.
Empat laporan masuk sekaligus: mobil operasional, alat berat, gudang, dan kiriman barang. Hati-hati:
tempatnya sama, kasusnya tidak.

**Dokumen** (policyCards; SEMUA kartu punya baris periode supaya baris itu bukan petunjuk)
- `kasus-a` Kasus A - Mobil operasional (AUTO): Jenis polis TLO, ambang minimal 75% nilai kendaraan |
  Banjir Tercakup pada kartu | Nilai kendaraan Rp200.000.000 | Estimasi kerusakan Rp30.000.000 |
  Periode polis 01 Jan 2026 - 31 Des 2026
- `kasus-b` Kasus B - Alat berat (HVC): Banjir Tercakup pada kartu | Nomor seri kartu polis EX-4471 |
  Nomor seri pada laporan EX-4471 | Periode polis 01 Jan 2026 - 31 Des 2026 | Bukti awal Lengkap
- `kasus-c` Kasus C - Gudang (FIRE): Perluasan banjir Tercantum | Periode polis 01 Mar 2025 -
  28 Feb 2026 | Objek Sesuai kartu polis | Bukti awal Lengkap
- `kasus-d` Kasus D - Kiriman barang (CARGO): Daftar pengiriman 40 peti | Bukti penerimaan 38 peti,
  5 kemasan basah | Foto penerimaan Belum dilampirkan | Periode polis 01 Jan 2026 - 31 Des 2026

**Langkah**
1. `temuan` - assign (stage), bobot 1 - "Tahap 1 - Apa temuan utama di tiap kasus?"
   - Item: `kasus-a` Kasus A - Mobil operasional | `kasus-b` Kasus B - Alat berat | `kasus-c` Kasus C -
     Gudang | `kasus-d` Kasus D - Kiriman barang
   - Kategori: `ambang` Nilai kerusakan di bawah ambang polis | `periode` Tanggal kejadian di luar
     periode polis | `selisih` Jumlah / kondisi barang berbeda antar dokumen | `sesuai` Jaminan,
     periode, identitas, dan bukti sesuai | `seri` Nomor seri unit berbeda (pengecoh: jawaban m10)
   - **Kunci:** kasus-a -> ambang (Rp30 juta / Rp200 juta = 15% < 75%); kasus-b -> sesuai; kasus-c ->
     periode (berakhir 28 Feb 2026, kejadian 14 Mar 2026); kasus-d -> selisih.
2. `tindak` - assign (stage), bobot 2 - "Tahap 2 - Pilih tindak lanjut" (item sama)
   - Kategori: `tidak-ambang` Kerusakan tidak memenuhi ambang TLO dalam simulasi | `luar-periode` Di
     luar periode yang tercantum pada kartu simulasi | `dokumentasi` Dokumentasikan ketidaksesuaian dan
     lengkapi dokumen pengangkutan | `survei` Lanjutkan ke survei / penilaian sesuai prosedur |
     `klarifikasi` Klarifikasi identitas unit sebelum melanjutkan penilaian (pengecoh: jawaban m10)
   - **Kunci:** kasus-a -> tidak-ambang; kasus-b -> survei; kasus-c -> luar-periode; kasus-d ->
     dokumentasi. Anti-hafalan: di m10 jawabannya A luar jaminan, B klarifikasi, C survei.

**Adegan.** Latar `m10-latar` utuh; ekspor `latar()`, `mobilOperasional()`, `alatBerat()`,
`gudang()`, `kartuBerdiri()`, `wargaKecil()`, `genangan()` dari `m10-kota.ts`. Empat objek `item`
sejajar (x 88/243/397/552, lebar sekitar 140), `stepIds: ['temuan', 'tindak']` sehingga dua stiker
menumpuk (pola m10, `fx: 'tag'`): "Kasus A" van, "Kasus B" excavator, "Kasus C" gudang (tiga gambar
m10 diperkecil sekitar 0,74 -> SVG berubah, jadi kunci tekstur BARU `a10-*`), "Kasus D" BARU: palet
`crate({ basah: true })` setengah tergenang. Empat objek `doc` kartu berdiri "Polis A" - "Polis D" di
tanggul kering (y sekitar 390). Area sentuh kasus mencakup pil labelnya (pola m10). Prop: karyawan
melambai, riak air, perahu karet kecil lewat (`drift`). `bucketShort` maks 13 huruf (jarak antar
kasus sekitar 155): temuan = "Bawah ambang", "Luar periode", "Data selisih", "Semua sesuai",
"Seri berbeda"; tindak = "Tak capai TLO", "Periode habis", "Lengkapi dok.", "Lanjut survei",
"Klarifikasi".

**Kenapa tingkat 3 (puncak).** Empat produk, delapan penempatan ke 5 + 5 kategori (ada pengecoh di
tiap tahap), kartu tanpa bendera, satu kasus nyaris lolos (periode lewat dua minggu), satu kasus
butuh hitung persen, dan tempat yang sama dengan m10 menghukum hafalan. Tiap temuan sudah dilatih
sendiri-sendiri: TLO a05, dokumen kargo a04, periode a07, identitas/bukti m10.

**Sumber materi.** m10 (struktur kasus, klarifikasi/survei, pembelajaran objek-jaminan-periode-bukti),
m05 (ambang TLO 75%), m07 (perluasan banjir + periode), m06 (selisih & kemasan basah -> dokumentasikan
& lengkapi dokumen pengangkutan).

**Varian opsional (TIDAK termasuk silabus dasar).** Bila uji main menunjukkan pemain terbaik selesai
di bawah 60 detik, tambahkan tahap 3 `hasil` (number, rupiah, bobot 1) untuk Kasus B dengan tabel
"Lembar Penilaian B (setelah survei)": kerugian disetujui Rp120.000.000, risiko sendiri 10% minimum
Rp5.000.000, tidak ada batas/pengurang lain -> 10% = Rp12.000.000 (lebih besar dari minimum) -> kunci
Rp108.000.000; chip 103 / 108 / 115 / 120 juta (103 = mengurangkan 10% dan minimum sekaligus, 115 =
memakai minimum, 120 = lupa risiko sendiri). Papan satu baris "Hasil akhir".

## 5. Perlu konfirmasi PIC Claim

Umum
1. Semua angka (nilai kendaraan, estimasi, jumlah peti), tanggal, nomor seri, dan ketentuan risiko
   sendiri adalah angka SIMULASI berpola m05/m06/m07/m09, bukan ketentuan polis Raksa. Mohon
   konfirmasi tidak ada angka/istilah yang menyesatkan dan label "(simulasi)" di tiap kartu cukup.
2. Bendera baris kartu (ok/no) dinetralkan menjadi `info` di seluruh paket acara agar peserta
   membandingkan sendiri. Mohon konfirmasi tidak ada keberatan dari sisi materi.
3. Penyusutan dan batas pertanggungan yang mengikat sengaja TIDAK diuji: materi latihan tidak
   menyebut tarif/dasar penyusutan maupun urutan hitung (risiko sendiri sebelum atau sesudah batas).
   Bila PIC ingin lapisan ini, mohon berikan rumus dan urutan resminya; bisa menjadi langkah tambahan
   di a09 tanpa mengubah adegan.
4. Istilah yang dipakai ulang dari paket latihan: "kanal klaim", "risiko sendiri", "kerugian yang
   disetujui", "ambang kerusakan total", "perluasan banjir", "kondisi sebelum kejadian", "pemeriksaan
   teknis tambahan", "survei / penilaian sesuai prosedur", "dokumen pengangkutan". Mohon tinjau
   konsistensinya; bila ada istilah dokumen resmi (mis. berita acara / nota klaim ke pengangkut) yang
   lebih tepat dari "dokumen pengangkutan", beri tahu.

Per misi
5. a01 (FIRE): prinsip m01 "dokumentasi dulu, lalu lapor lewat kanal klaim; jangan membuang atau
   memperbaiki dulu" berlaku sama untuk properti pasca kebakaran, termasuk kalimat "foto barang
   terdampak sebelum dipindahkan" dan "jangan membuang barang hangus sebelum didokumentasikan".
6. a02 (CARGO): tiga foto paling relevan untuk kiriman rusak = seluruh tumpukan saat diterima, detail
   sisi rusak, label kiriman + nomor peti. Foto alat angkut/plat truk sengaja TIDAK dijadikan opsi
   supaya tidak diperdebatkan; mohon konfirmasi. Konteks kiriman kurir darat ke toko tetap wajar untuk
   produk CARGO.
7. a03 (AUTO): empat kegunaan disalin dari penjelasan kunci m02. Mohon konfirmasi rumusan "memastikan
   kendaraan yang diperiksa benar" untuk foto plat & nomor rangka.
8. a04 (CARGO): (a) kalimat jawaban benar "dokumentasikan selisih jumlah dan kemasan rusak, lalu
   lengkapi dokumen pengangkutan"; (b) "tanda tangani bukti terima tanpa catatan" dinilai salah
   (turunan opsi m06 "terima saja"); (c) satu peti yang difoto dua kali / punya dua jenis kerusakan
   dihitung SATU peti.
9. a05 (AUTO): (a) kerusakan 80% pada polis TLO berambang minimal 75% dinilai "dapat dilanjutkan
   untuk penilaian" (kebalikan logis m05; angka tepat 75% sengaja dihindari); (b) pembanding ambang =
   estimasi kerusakan terhadap "nilai kendaraan" seperti kalimat kartu m05 (bukan harga pasar / nilai
   pertanggungan); (c) satu kategori "dapat dilanjutkan untuk penilaian" dipakai untuk Comprehensive
   (kerusakan sebagian) dan TLO yang memenuhi ambang.
10. a06 (HVC): urutan dokumentasi -> lapor kanal klaim -> survei/penilaian -> perbaikan setelah
    koordinasi diturunkan dari m01 + m10, bukan dari SOP tertulis. Mohon konfirmasi sesuai praktik
    Raksa: apakah lapor boleh mendahului dokumentasi (bila ya, kartu `dok` dan `lapor` digabung
    menjadi satu kartu "Dokumentasikan lalu laporkan" sehingga urutan di antara keduanya tidak
    dinilai; kunci assign hanya menerima satu kategori per kartu), apakah ada pengecualian perbaikan
    darurat, dan perlakuan salvage/komponen patah
    pada alat berat ("jangan dibuang dulu").
11. a07 (FIRE): untuk polis berurutan (A: 01 Mar 2025 - 28 Feb 2026, B: 01 Mar 2026 - 28 Feb 2027)
    kejadian 14 Feb 2026 diperiksa pada Polis A; pernyataan "polis terbaru berlaku untuk semua
    kejadian" aman dijadikan pengecoh. Tiga polis atas gudang yang sama hanya alat banding (seperti dua
    polis di m07), BUKAN materi polis ganda/kontribusi.
12. a08 (HVC): klasifikasi lima temuan, terutama (a) "selang hidrolik rembes" yang sudah tercatat di
    buku servis sebelum kejadian dikunci "kondisi sebelum kejadian" (bukan "pemeriksaan teknis"
    dengan alasan mungkin diperparah benturan); (b) "mesin sulit hidup" yang muncul setelah kejadian
    tetapi penyebabnya belum diketahui dikunci "pemeriksaan teknis"; (c) "membentur dinding galian"
    sah disebut benturan pada kartu simulasi; (d) istilah teknis track shoe, selang hidrolik, boom.
13. a09 (HVC): (a) dasar hitung = hanya kerusakan terkait kejadian, pos keausan/kondisi lama
    dikeluarkan sebelum risiko sendiri dihitung; (b) bila 10% lebih kecil dari minimum, minimum yang
    dipakai; (c) asumsi "seluruh kerusakan akibat benturan disetujui sesuai estimasi" boleh dipakai.
14. a10 (MIX): (a) Kasus A: polis TLO dengan banjir tercakup dan kerusakan sebagian 15% dinilai
    "tidak memenuhi ambang TLO" - wajar sebagai simulasi? (b) Kasus B: semua sesuai -> "lanjutkan ke
    survei / penilaian sesuai prosedur"; (c) Kasus C: kalimat "Di luar periode yang tercantum pada
    kartu simulasi" untuk polis berakhir 28 Feb 2026 dan kejadian 14 Mar 2026 (sejajar dengan "di luar
    jaminan yang tercantum" di m10); perlukah disebut kemungkinan perpanjangan? (d) Kasus D: konteks
    banjir tidak mengubah tindak lanjut awal CARGO (dokumentasikan ketidaksesuaian & lengkapi dokumen
    pengangkutan).

## 6. Catatan teknis untuk pelaksana

Semua butir sudah diperiksa di kode pada 19 Sep 2026.

1. **`order` belum didukung layar main.** `client/src/game/MissionPlay.tsx` (`KontrolLangkah`) hanya
   menangani multi/single/assign/number dan jatuh ke `misi.jenisBelumDidukung` untuk jenis lain
   (server bisa menilainya, pemain tidak bisa menjawab). Silabus ini tidak memakai `order`; urutan
   proses (a06) dibuat sebagai `assign` ke slot Langkah 1 - 4.
2. **Latar privat.** `latar()` dan pembantu gambar di tiap `scenes/mNN-*.ts` tidak diekspor; pakai
   ulang = tambah `export`. `scenes.test.ts` mengizinkan kunci tekstur yang sama dipakai ulang ASAL
   SVG identik, jadi `m03-latar`, `m01-latar`, `m02-latar`, `m06-latar`, `m08-latar`, `m04-latar`,
   `m09-latar`, `m10-latar` dipakai apa adanya. Latar yang diparametrikan wajib kunci baru:
   `a05-latar` (tiga alas kerja) dan `a07-latar` (meja lebih lebar).
3. **Aturan `scenes.test.ts`:** label objek <= 18 huruf; `bucketShort` <= 20; `option` hanya untuk
   single/multi, `item`/`bucket` hanya untuk assign; bila satu opsi/item/kategori sebuah langkah tampil
   di adegan maka SEMUA harus tampil; papan hanya untuk langkah number; `acakPosisi` hanya untuk slot
   seragam; refId objek `doc` harus id policyCards/tables/`checklist`. Daftar `SEMUA` di tes itu baru
   berisi `MISSIONS`: tambahkan `MISSIONS_ACARA`.
4. **Chip item assign** memakai `label.split(' - ')[0]`: tulis "Kasus A - ...", "Foto A - ...",
   "Berkas A - ...". Item a06 dan a08 sengaja tanpa " - " supaya chip memuat nama lengkapnya.
5. **Lencana** di `shared/scoring.ts` terikat indeks ronde 1 & 3 (Detektif Bukti), 8 (Hitung Teliti),
   9 (Pahlawan Kota). Jangan menukar posisi a02, a04, a09, a10 tanpa meninjau lencana.
6. **Kerangka kosong sudah ada:** `shared/missions.acara.ts` (`MISSIONS_ACARA = []`) dan
   `server/src/acara/index.ts` (`BERKAS = []`); `assertKeysComplete()` memeriksa kunci acara saat
   boot. Satu misi = `shared/acara/aNN.ts` + `server/src/acara/aNN.ts` + adegan
   `client/src/game/scenes/aNN-*.ts` yang didaftarkan di `scenes/index.ts`. Tiap misi butuh
   terjemahan en/zh: teks misi, `label.en.ts` / `label.zh.ts`, dan `pembahasan` di berkas kunci.
7. **Warna stiker hanya empat** (`WARNA_TAG` di `engine/MissionScene.ts`, indeks kategori modulo 4).
   Langkah dengan lima kategori (a06 `urutan`, a10 `temuan` & `tindak`) membuat kategori ke-5 berwarna
   sama dengan kategori ke-1. Stiker tetap terbaca dari teksnya; menambah satu warna adalah perubahan
   engine kecil dan opsional.
8. **Lebar stiker vs jarak objek.** Stiker = teks 18 px + bantalan 24 px dan digambar tepat di atas
   objek, jadi item yang berdekatan saling menimpa bila `bucketShort` panjang (m10 aman karena jarak
   kasus 208). Patokan: jarak 150 -> maks 12 - 13 huruf; jarak 112 -> maks 9 - 11 huruf. Berlaku untuk
   a03, a06, a07, a08, a10; label objek di a06 juga harus pendek. Inilah alasan meja m07 (lebar 220)
   tidak cukup untuk tiga binder berstiker.
9. **SceneKey & ikon.** Semua misi memakai `SceneKey` yang sudah ada (dipakai ilustrasi cadangan);
   ikon opsi harus dari `IconKey` yang ada. Tidak ada perubahan `shared/types.ts`.
10. **Kunci acara tidak bisa dipancing:** `POST /api/practice/grade` hanya menerima paket latihan
    (kontrak di `docs/rancangan-bank-soal.md`); pastikan tetap begitu setelah misi acara diisi.
11. **Pustaka gambar siap pakai:** `art/props.ts` (docSheet, clipboard, binder, policyCard, crate,
    stamp, tray, phone, calculator, toolbox, trashBin, cone, floodWater), `art/vehicles.ts` (carSide,
    dentPatch, excavator, forklift, truck, wheel), `art/characters.ts` (personArt). Gambar baru yang
    dibutuhkan kecil: papan BUKA, label kiriman, gerobak es, 4 polaroid, 2 ikon papan aksi, rak besi
    penyok, 3 potongan excavator (kaca, selang, mesin), lembar estimasi, palet peti basah.
