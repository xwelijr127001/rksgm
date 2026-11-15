# Tinjauan PIC Claim — Episode AUTO-1 "Baret di Parkiran"

Status dokumen: **DRAF, belum ditinjau PIC Claim** (27 September 2026, revisi 5: perkenalan peran & letak tombol istilah
untuk adegan v3 di bagian A, S, dan R5; revisi 4: kartu akhir v2 di bagian N; naskah v2, istilah di tempat, dan
aktivitas di bagian S, P, dan R4).
Naskah: `client/src/cerita/episode/auto-1/teks.id.ts` (kunci teks di kolom "Kunci"). Graf & efek: `episode.ts`.
Aktivitas & kartu polis: `aktivitas.ts`. Kontrak: `docs/rancangan-mode-cerita.md` bagian 1 & 3.

Riwayat:
- Revisi 1 (26 Sep): naskah awal + pilihan `ralat-polis` (bagian D dan K).
- Revisi 2 (26 Sep, setelah tinjauan internal klaim-terjemahan & ux-cerita): perubahan materi klaim dirangkum di
  bagian R. Paling penting untuk PIC: N2 (urutan langkah) dan N10 (padanan m05) berubah kalimat, distraktor kartu
  polis ditulis ulang, dan akibat "langkah berikutnya" kini hanya dari ringkasan penutup (bagian M).
- Revisi 3 (26 Sep, temuan tinjauan internal "pengecoh bukti terlalu konyol"): dua pengecoh aktivitas bukti
  diganti foto bagian mobil yang tidak rusak, yaitu "Foto dekat ban depan" dan "Foto dasbor dari jendela"
  (menggantikan swafoto dan kucing). Pembahasan & umpan balik bukti ikut berubah. Lihat N15, bagian C & G,
  pertanyaan I.12, dan bagian R3.
- Revisi 4 (26 Sep, tinjauan "alur cerita & belajar pemula", `docs/rancangan-mode-cerita.md` bagian 11): kartu akhir
  (bagian N), lalu naskah v2: satu perkenalan peran dengan kata sehari-hari lebih dulu (pelanggan asuransi →
  nasabah, laporan kerugian → klaim, dokumen perlindungan → polis), baris yang mengulang dipangkas (kuncinya
  dipensiunkan, bagian P), panjang pilihan diseimbangkan, **arti lima istilah** dan **arti awam baris kartu polis**
  (BARU, bagian S), alasan per opsi aktivitas, dan pengecoh kartu `ambang-tlo` (75% / TLO) **dihapus** dari opsi.
  Ringkasan: bagian R4. Paling perlu dicek PIC: bagian S (N16-N18) dan pertanyaan I.14-I.17.
- Revisi 5 (27 Sep, adegan v3 "ruang layanan Raksa Silver Club", `docs/cerita/ADEGAN-AUTO1.md`; review lanjutan butir 6
  "pengenalan istilah masih padat"): `b1-mentor.1` kini satu kalimat peran yang menyebut tempat (**Raksa Silver Club**,
  lewat parameter `{lokasi}` yang sama dengan papan nama), tanpa istilah; tombol "Apa itu nasabah?" pindah ke narasi
  pintu `b1-mentor.4` ("Seorang nasabah masuk …") dan "Apa itu klaim?" ke ucapan Bu Rina `b2-saran.1` / `.2`
  ("Urusan klaim belakangan"), dua baris yang dilewati semua jalur. Pilihan `b1-datang.dengar` tidak lagi berkata
  "Silakan duduk dulu" (di adegan v3 Bu Rina sudah dipersilakan duduk saat masuk). Tidak ada janji layanan, syarat
  keanggotaan, kelayakan, atau prosedur klaim baru. Ringkasan: bagian R5; pertanyaan I.18.

## Cara membaca

- **Cakupan.** SETIAP kunci teks episode di `teks.id.ts` tercantum di dokumen ini (ditulis lengkap dalam tanda
  kode). Kunci yang **menyentuh materi klaim** ada di bagian A–G, K, N, dan S beserta sumbernya; kunci pensiun di bagian P. Kunci yang **tidak**
  menyentuh materi klaim (ucapan emosi, reaksi, narasi suasana, judul, label UI) ada di Lampiran L beserta
  alasannya, supaya PIC bisa memeriksa bahwa tidak ada yang terlewat. Kelengkapan ini dijaga tes otomatis
  (`episode.test.ts`: setiap kunci `teks.id.ts` harus muncul di dokumen ini). Satu teks UI mode cerita di luar
  `teks.id.ts` yang bermateri klaim (catatan simulasi) dicantumkan di bagian A.
- Sumber yang diizinkan hanya: **m01** (dokumentasi & lapor lewat kanal klaim sebelum perbaikan), **m02** (tiga
  bukti: keseluruhan, detail kerusakan, identitas), **m05** (Comprehensive "tercakup sesuai syarat kartu" →
  "dapat dilanjutkan untuk penilaian" vs TLO ambang kerusakan total 75%), **m09** (risiko sendiri), dan **catatan
  simulasi** ("Simulasi edukasi. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa.").
- Kolom **Jenis**:
  - **Turunan**: parafrasa langsung dari sumber.
  - **BARU**: kalimat baru yang tidak tertulis di sumber (mis. definisi, urutan langkah, akibat). **Paling perlu
    dicek.**
  - **Distraktor**: pilihan yang sengaja SALAH. Pastikan salahnya jelas dan tidak menyesatkan di luar permainan.
- Semua baris berstatus **perlu konfirmasi PIC Claim** sampai ditandatangani.
- Teks en/zh diterjemahkan dari teks Indonesia ini; perubahan dari PIC Claim cukup ditulis untuk teks Indonesia.

## Ringkasan kalimat BARU (prioritas tinjauan)

| # | Kalimat baru | Kunci utama | Dipakai untuk |
| --- | --- | --- | --- |
| N1 | Risiko sendiri = "bagian kerugian yang tetap Ibu tanggung; besarnya sesuai ketentuan polis" | `b4-polis-tepat.2`, `paham.risiko-sendiri`, `b5-keberatan.ralat-polis` | Definisi awam risiko sendiri untuk AUTO (m09 hanya contoh hitungan HVC) |
| N2 | **(revisi 2)** Urutan tindak lanjut: "Laporan tercatat → kerusakan diperiksa dan dinilai sesuai polis → **langkah perbaikan mengikuti hasil penilaian**". Menggantikan "… lalu perbaikan setelah koordinasi", yang terbaca seolah klaim pasti berujung perbaikan. | `b5-tutup.rangkum`, `paham.langkah-berikut`, `b5-rangkum.1` | Penutup layanan |
| N3 | "Bila ada yang kurang, saya kabari" (petugas mengabari bila ada yang perlu dilengkapi) | `b5-tutup.rangkum`, `akhir-tertunda.7` | Penutup layanan |
| N4 | "Waktunya belum bisa dipastikan" / "besok belum bisa saya pastikan" | `b5-keberatan.jujur`, `b5-keberatan.ralat-janji`, `b5-keberatan.ralat-polis`, `akhir.tuntas.pelajaran.3` | Menolak menjanjikan waktu |
| N5 | Bukti kurang → "laporan perlu dilengkapi" dan nasabah harus meluangkan waktu lagi; bila sudah diperbaiki, kondisi awal "tak bisa difoto ulang" | `akhir-tertunda.2`, `akhir-tertunda.4`, `b3-cukup.2`, `akhir.tertunda.ringkas` | Akibat bukti tidak lengkap |
| N6 | "Bagian yang rusak jangan dibuang dulu" (pecahan lampu disimpan) | `b3-bukti-intro.2`, `catatan.bagian-disimpan` | Diturunkan dari distraktor m01 "Membuang bagian yang rusak" |
| N7 | Nasabah mengirim foto dari HP untuk laporan | `b3-seadanya.1`, `b3-seadanya.2` | Jalur "foto seadanya" |
| N8 | "Kerusakan dinilai setelah dilihat, bukan dari cerita" | `akhir-pergi.5`, `akhir.pergi.pelajaran.1` | Pelajaran jalur "baret ringan" |
| N9 | Baris kartu "Risiko sendiri: Berlaku sesuai ketentuan polis" | `akt.polis.kartu.risiko.label`, `akt.polis.kartu.risiko.nilai` | Kartu polis simulasi (kontrak 3.2) |
| N10 | **(revisi 2)** "Kerusakan ini bisa **dilanjutkan untuk dinilai** sesuai syarat kartu". Menggantikan "bisa diajukan dan dinilai", yang mencampur hak mengajukan dengan jaminan. Kini paling dekat dengan m05 "Dapat dilanjutkan untuk penilaian kerusakan benturan". | `akt.polis.opsi.bisa-dinilai`, `paham.polis-dinilai`, `akt.polis.ringkasan`, `akt.polis.bahas.penjelasan` | Jawaban tepat kartu polis |
| N11 | Petugas **meralat sendiri** penjelasan kartu polis yang keliru ("saya keliru soal kartu tadi …"), lalu jalur itu masih bisa berakhir baik | `b5-keberatan.ralat-polis` (+ efek, bagian K) | Pemulihan setelah menjanjikan "pasti diganti" |
| N12 | **(baru, revisi 2)** Foto yang terlewat ditambahkan saat itu juga, dan laporan "kini punya tiga bukti" | `b3-lengkapi.1`, `catatan.bukti-lengkap` | Jalur "lengkapi" (sebelumnya pilihan ini tidak menampilkan apa pun) |
| N13 | **(revisi 2)** Data (nomor polis dsb.) "bisa menyusul" setelah nasabah didengar | `b1-pulih.2`, `akhir.tuntas.pelajaran.1` | Urutan layanan (belum tercantum di revisi 1) |
| N14 | **(baru, revisi 2)** Distraktor kartu polis yang masuk akal: membaca "tercakup" sebagai "pasti diganti", dan mengira syarat kartu = ambang 75%. **Revisi 4: pengecoh ambang 75% dihapus** (materi TLO tidak diajarkan episode; tetap di misi 5), kuncinya pensiun (bagian P) | `akt.polis.opsi.pasti-diganti`, `akt.polis.opsi.ambang-tlo` | Bagian G & pertanyaan I.7 |
| N15 | **(baru, revisi 3)** Pengecoh bukti yang masuk akal: foto dekat ban depan dan foto dasbor dari jendela = foto bagian mobil yang **tidak menunjukkan titik kerusakan di belakang maupun identitas mobil**, jadi tidak membantu pemeriksaan kasus ini. Alasannya diturunkan dari m02 `learning` ("Bukti harus membantu menghubungkan kendaraan, lokasi kerusakan, dan kejadian") dan penjelasan m02 (foto detail = titik benturan; foto identitas = kendaraan yang diperiksa benar). | `akt.bukti.opsi.foto-ban`, `akt.bukti.opsi.foto-dasbor`, `akt.bukti.bahas.bukti`, `b3-bukti.hasil.2.4` | Bagian C & G, pertanyaan I.12 |
| N16 | **(baru, revisi 4)** Arti awam lima istilah, tampil lewat tombol "Apa itu …?" di baris pertama pemakaiannya: nasabah, klaim, polis, Comprehensive, risiko sendiri (bagian S) | `istilah.nasabah.arti`, `istilah.klaim.arti`, `istilah.polis.arti`, `istilah.comprehensive.arti`, `istilah.risiko-sendiri.arti` | Pemula paham istilah tanpa halaman glosarium |
| N17 | **(baru, revisi 4)** Arti awam tiap baris kartu polis simulasi (diketuk/ditekan saat menjawab), termasuk "“Sesuai syarat kartu” berarti dinilai dulu, bukan otomatis diganti" | `akt.polis.kartu.sub.arti`, `akt.polis.kartu.kendaraan.arti`, `akt.polis.kartu.benturan.arti`, `akt.polis.kartu.status.arti`, `akt.polis.kartu.risiko.arti` | Membaca kartu sebelum menjawab (bagian S) |
| N18 | **(baru, revisi 4)** Satu alasan singkat per opsi aktivitas, tampil SETELAH jawaban dikirim (diturunkan dari pembahasan m02/m05 yang sudah ada) | `akt.bukti.alasan.foto-full` dst., `akt.polis.alasan.bisa-dinilai` dst. | Bagian C & D |

## A. Catatan simulasi & peran

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `b1-mentor.1` (**revisi 5**; satu-satunya perkenalan peran, tanpa tombol istilah; `{lokasi}` = "Raksa Silver Club" dari konfigurasi panggung, sama dengan papan nama ruang) | Pagi, {nama}. Hari ini kamu bertugas di meja layanan {lokasi}, aku mendampingimu. Ini simulasi. (tampil: "... meja layanan Raksa Silver Club ..."). Revisi 4: "Pagi, {nama}. Di meja layanan ini kamu membantu pelanggan asuransi (nasabah) yang melaporkan kerugian (klaim). Aku di sampingmu; ini simulasi." | Kontrak 3.1 (peran petugas) + catatan simulasi; nama ruang = pilihan artistik adegan v3 (bukan pernyataan kelayakan layanan atau keanggotaan Bu Rina, I.18) | Turunan (peran & simulasi); definisi klaim tidak lagi di baris ini (tetap di `istilah.klaim.arti`, N16) | perlu konfirmasi PIC Claim |
| `b1-mentor.2`, `b1-mentor.3` | **(pensiun revisi 4)** Tugas petugas dan catatan simulasi di pembuka dihapus (mengulang kartu aktivitas & layar akhir; masalah Bu Rina kini muncul di baris ke-3). Kalimat lama: bagian P. | Catatan simulasi tetap tampil di kartu polis (`akt.polis.kartu.catatan`) dan layar akhir (`misi.catatanSimulasiPeriksa`) | — | — |
| `akt.polis.kartu.catatan` | Kartu simulasi untuk latihan. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa. | m05 (catatan kartu) + catatan simulasi | Turunan | perlu konfirmasi PIC Claim |
| UI `misi.catatanSimulasiPeriksa` (`client/src/i18n/kamus/misi.ts`, sama dengan latihan misi; tampil di umpan balik aktivitas & layar akhir cerita). Kunci lama `cerita.catatanSimulasi` sudah dihapus. | Simulasi edukasi. Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa. | Catatan simulasi | Turunan (istilah en/zh kini seragam dengan naskah: inspection / 查勘, lihat J.T19) | perlu konfirmasi PIC Claim |
| `akhir.janji.pelajaran.2` | Hasil dan waktu klaim mengikuti polis dan pemeriksaan, jadi jangan dijanjikan di meja. | Catatan simulasi + kontrak bagian 1 (tanpa janji) | Turunan (+ "waktu" BARU, lihat N4) | perlu konfirmasi PIC Claim |
| `pemeran.missRaksa.peran` | Layanan Klaim | Kontrak 3 (mentor) | BARU (sebutan jabatan, lihat J.T13) | perlu konfirmasi PIC Claim |
| `bab.bukti.tujuan` | Kumpulkan bukti yang dibutuhkan pemeriksa. | m02 | Turunan (petunjuk bab) | perlu konfirmasi PIC Claim |
| `bab.polis.tujuan` | Baca kartu polis, lalu jelaskan dengan tepat. | m05 `rakiBriefing` | Turunan (petunjuk bab) | perlu konfirmasi PIC Claim |
| `bab.menutup.tujuan` | Jelaskan langkah berikutnya dengan jujur. | Kontrak bagian 1 | Turunan (petunjuk bab) | perlu konfirmasi PIC Claim |

## B. Dokumentasi & lapor sebelum perbaikan (m01)

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `b2-saran.1` / `b2-saran.2` (**revisi 5**: menambah "Urusan klaim belakangan" dan tombol "Apa itu klaim?") | Intinya saya langsung ke bengkel saja, kan? Urusan klaim belakangan, waktu saya tidak banyak. / Jadi saya langsung ke bengkel saja, kan? Urusan klaim belakangan, besok mobilnya harus jalan. (Revisi 4: tanpa "Urusan klaim belakangan"; `.2` berbunyi "…, kan, biar cepat? Besok mobilnya harus jalan.") | m01 (situasi: nasabah ingin langsung memperbaiki; anggapan keliru nasabah yang dikoreksi pilihan `dokumentasi`) | Turunan (ucapan nasabah, bukan pernyataan petugas) | perlu konfirmasi PIC Claim |
| `b2-saran.dokumentasi` | Kita foto dan laporkan dulu sebelum ke bengkel, Bu, supaya kondisinya tercatat. | m01 opsi `dokumentasi` | Turunan | perlu konfirmasi PIC Claim |
| `b2-saran.dokumentasi.alasan` | Bu Rina mengangguk karena kamu menjelaskan kenapa mobil perlu tercatat sebelum diperbaiki. | m01 | Turunan | perlu konfirmasi PIC Claim |
| `b2-saran.bengkel.alasan` | Bu Rina senang boleh langsung ke bengkel, padahal kondisi kerusakannya belum tercatat. | m01 penjelasan | Turunan | perlu konfirmasi PIC Claim |
| `b2-saran.ringan.alasan` | Bu Rina tersinggung karena kerusakannya dianggap sepele sebelum kamu melihatnya. | m01 (distraktor "mengabaikan kejadian") + N8 | Turunan | perlu konfirmasi PIC Claim |
| `b2-bengkel-akibat.1` | Sebentar, {nama}. Kalau diperbaiki sekarang, kondisi kerusakannya tak bisa dilihat lagi. | m01 penjelasan ("memperbaiki ... membuat bukti hilang") | Turunan | perlu konfirmasi PIC Claim |
| `b2-bengkel-akibat.koreksi` | Maaf, saran saya tadi keliru, Bu. Kita foto dan laporkan dulu, baru ke bengkel. | m01 | Turunan | perlu konfirmasi PIC Claim |
| `b2-ringan-akibat.2` | (pelan) Sudah kamu lihat sendiri kerusakannya, {nama}? | m01 + N8 | Turunan | perlu konfirmasi PIC Claim |
| `b2-ringan-akibat.lihat-dulu` | Ibu benar, saya terlalu cepat menilai. Boleh kita lihat mobilnya dulu? | m01 (distraktor "mengabaikan kejadian") | Turunan | perlu konfirmasi PIC Claim |
| `b2-ringan-akibat.lihat-dulu.alasan` | Bu Rina sedikit lega karena kamu mengakui terlalu cepat menilai dan mau melihat sendiri. | N8 | Turunan | perlu konfirmasi PIC Claim |
| `b2-ringan-akibat.tetap-ringan.alasan` | Bu Rina merasa masalahnya diremehkan, padahal kamu belum melihat mobilnya. | N8 | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti-intro.2` | Pecahan lampu di bagasi tetap disimpan, ya, Bu. Bagian yang rusak jangan dibuang dulu. | m01 distraktor `buang` + penjelasan | **BARU (N6)** | perlu konfirmasi PIC Claim |
| `catatan.bagian-disimpan` | Pecahan penutup lampu disimpan di bagasi, tidak dibuang. | m01 | **BARU (N6)** | perlu konfirmasi PIC Claim |
| `paham.langkah-sekarang` | Sekarang dokumentasi dan lapor dulu; mobil belum diperbaiki. | m01 | Turunan | perlu konfirmasi PIC Claim |
| `proses.dokumentasi-dulu` | Dokumentasi dan lapor sebelum perbaikan | m01 | Turunan | perlu konfirmasi PIC Claim |
| `akhir.tuntas.pelajaran.2` | Dokumentasi dan laporan sebelum perbaikan menjaga jejak kejadian. | m01 penjelasan ("Dokumentasi + laporan menjaga jejak kejadian") | Turunan | perlu konfirmasi PIC Claim |
| `akhir.tertunda.pelajaran.2` | Dokumentasi dulu sebelum perbaikan; kondisi yang sudah diperbaiki tak bisa dilihat lagi. | m01 | Turunan | perlu konfirmasi PIC Claim |
| `akhir-pergi.5` | Kerusakan dinilai setelah dilihat, {nama}, bukan dari cerita. Kita coba lagi, ya. | m01 + m02 | **BARU (N8)** | perlu konfirmasi PIC Claim |
| `akhir.pergi.pelajaran.1` | Jangan menilai kerusakan atau isi polis sebelum melihat dan membacanya. | m02 + m05 ("Baca kartunya dulu") | **BARU (N8)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.8` (revisi 2; hanya bila saran "langsung ke bengkel" dibiarkan; revisi 5: diberi tombol "Apa itu klaim?", bagian S) | Siang ini mobil saya langsung ke bengkel, ya. Terus klaimnya kapan beres? | m01 (akibat perbaikan sebelum dokumentasi) | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b5-rangkum.4` (revisi 2; nasabah menanggapi ringkasan pada jalur yang sama) | Dinilai dulu? Tapi mobil saya tetap ke bengkel siang ini, kan? Tadi katanya boleh. | m01 | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |

Catatan: m01 menyebut "laporkan kejadian melalui **kanal klaim**". Naskah memakai "laporkan" saja karena
nasabah sudah berada di meja layanan klaim. Mohon konfirmasi bahwa meja layanan kantor boleh diperlakukan sebagai
kanal klaim di simulasi ini.

## C. Tiga bukti (m02)

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `b3-bukti-intro.4` | **(pensiun revisi 4)** Mengulang tugas di kartu aktivitas; isinya kini di `akt.bukti.petunjuk`. Kalimat lama: bagian P. | m02 (tiga bukti) + kontrak 3.1 | — | — |
| `akt.bukti.instruksi` (satu kalimat tugas di kartu aktivitas) | **(revisi 4)** Pilih 3 foto yang membantu pemeriksa. | m02 instruksi | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.tanya` | **(revisi 4)** Foto mana yang masuk laporan Bu Rina? | m02 prompt | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.briefing` (tidak tampil di mode cerita) | **(revisi 4)** Yang menarik belum tentu berguna untuk laporan. | m02 `rakiBriefing` | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-full` | Foto seluruh mobil | m02 opsi benar (keseluruhan) | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-penyok` | Foto dekat bemper & lampu belakang | m02 opsi benar (detail kerusakan) | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-plat` | Foto plat nomor | m02 opsi benar (identitas) | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.pelajaran` | Bukti harus membantu menghubungkan kendaraan, lokasi kerusakan, dan kejadian. | m02 `learning` (sama persis) | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.petunjuk` ("Butuh petunjuk?") | **(revisi 4)** Pikirkan yang perlu dilihat pemeriksa: mobil yang mana, dan rusaknya di mana. | m02 `hint` + penjelasan; pindahan isi `b3-bukti-intro.4` | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.bahas.bukti` | **(revisi 3)** Foto seluruh mobil menunjukkan kondisi kendaraan, foto dekat bemper & lampu belakang menunjukkan titik kerusakan, dan plat nomor memastikan mobil yang diperiksa benar. Ban depan dan dasbor tidak menunjukkan titik kerusakan di belakang maupun identitas mobil, dan brosur tidak berkaitan dengan kejadian. Ketiganya tidak membantu pemeriksaan. | m02 penjelasan + m02 `learning` ("menghubungkan kendaraan, lokasi kerusakan, dan kejadian") | Turunan + **BARU (N15)**. Revisi 2: "… Brosur, swafoto, dan kucing tidak membantu pemeriksaan." | perlu konfirmasi PIC Claim |
| `akt.bukti.ringkasan` | Tiga bukti yang menghubungkan kendaraan, titik kerusakan, dan identitasnya. | m02 ringkasan (sama persis) | Turunan | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-full` (alasan per foto, revisi 4; tampil setelah dikirim) | Menunjukkan kondisi kendaraan secara utuh. | `akt.bukti.bahas.bukti` (m02) | Turunan (N18) | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-penyok` | Menunjukkan titik kerusakan di bemper dan lampu belakang. | `akt.bukti.bahas.bukti` (m02) | Turunan (N18) | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-plat` | Memastikan mobil yang diperiksa memang mobil Bu Rina. | `akt.bukti.bahas.bukti` (m02 "foto identitas memastikan kendaraan yang diperiksa benar") | Turunan (N18) | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-ban` | Ban depan tidak menunjukkan titik kerusakan di belakang maupun identitas mobil. | `akt.bukti.bahas.bukti` (N15) | Turunan (N15, N18) | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-dasbor` | Dasbor tidak menunjukkan titik kerusakan maupun identitas mobil. | `akt.bukti.bahas.bukti` (N15) | Turunan (N15, N18) | perlu konfirmasi PIC Claim |
| `akt.bukti.alasan.foto-menu` | Brosur tidak berkaitan dengan kejadian. | `akt.bukti.bahas.bukti` (m02 distraktor) | Turunan (N18) | perlu konfirmasi PIC Claim |
| `b3-bukti.hasil.1.1` | **(revisi 4)** Pas. Dengan tiga foto ini, pemeriksa bisa memastikan mobilnya dan titik kerusakannya. (Sebelumnya: "Tiga-tiganya tepat: seluruh mobil, detail kerusakan, dan plat nomor.", kini tiap foto + alasannya tampil di panel.) | m02 `learning` | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti.hasil.2.5` | **(BARU, revisi 4)** Laporannya belum lengkap: ada bukti yang dibutuhkan pemeriksa yang belum terpotret. (Satu kalimat mentor untuk hasil sebagian/belum; foto mana yang terlewat + alasannya tampil per foto dari `akt.bukti.alasan.*`.) | m02 | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti.hasil.2.1` | Foto seluruh mobil belum ada. Itu yang menunjukkan kondisi kendaraan secara utuh. | m02 penjelasan | Turunan | **pensiun (revisi 4)**: tidak tampil di naskah v2, lihat bagian P |
| `b3-bukti.hasil.2.2` | Detail bemper dan lampu belakang belum terpotret. Di situlah titik kerusakannya. | m02 penjelasan | Turunan | **pensiun (revisi 4)**: tidak tampil di naskah v2, lihat bagian P |
| `b3-bukti.hasil.2.3` | Plat nomor belum terpotret. Tanpa itu, sulit memastikan mobil mana yang diperiksa. | m02 penjelasan | Turunan | **pensiun (revisi 4)**: tidak tampil di naskah v2, lihat bagian P |
| `b3-bukti.hasil.2.4` (revisi 4: hanya bila >3 foto dikirim tanpa bukti terlewat; tidak terjangkau lewat UI yang membatasi 3 foto) | **(revisi 3)** Foto yang tidak menunjukkan titik kerusakan atau identitas mobil tidak membantu pemeriksa. | m02 penjelasan (foto detail = titik benturan; foto identitas = kendaraan yang diperiksa benar) | Turunan (N15). Revisi 2: "Foto yang tidak berkaitan dengan kerusakan …", kurang jelas untuk ban depan & dasbor, yang memang bagian dari mobil Bu Rina | perlu konfirmasi PIC Claim |
| `b3-bukti-tepat.2` | Justru itu, Bu. Plat memastikan mobil yang diperiksa memang mobil Ibu. | m02 penjelasan ("foto identitas memastikan kendaraan yang diperiksa benar") | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti-kurang.lengkapi` | Boleh kita tambah foto yang kurang sekarang, Bu? Sebentar saja. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti-kurang.lengkapi.alasan` | Bu Rina menunggu sebentar lagi, dan laporannya kini punya bukti yang dibutuhkan. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `b3-bukti-kurang.cukup.alasan` | Bu Rina tidak keberatan, tapi laporannya dibuat dengan bukti yang belum lengkap. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `b3-lengkapi.1` (revisi 2) | Kamu memotret yang tadi terlewat. Kini laporan punya tiga bukti: seluruh mobil, detail bemper & lampu belakang, dan plat nomor. | m02 | **BARU (N12)** | perlu konfirmasi PIC Claim |
| `catatan.bukti-lengkap` (revisi 2) | Foto dilengkapi sebelum Bu Rina pergi: seluruh mobil, detail bemper & lampu belakang, plat nomor. | m02 | **BARU (N12)** | perlu konfirmasi PIC Claim |
| `b3-cukup.2` (revisi 2) | (pelan) Foto yang terlewat belum ada di laporan, {nama}. Kalau nanti diminta, Bu Rina harus meluangkan waktu lagi. | m02 + N5 | **BARU (N5)** | perlu konfirmasi PIC Claim |
| `catatan.bukti-kurang` (revisi 2) | Foto belum lengkap: yang terlewat belum terpotret. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `catatan.bukti` | Foto bukti diambil di parkiran kantor. | m02 (lokasi fiksi) | Turunan | perlu konfirmasi PIC Claim |
| `b2-bengkel-akibat.biarkan.alasan` | Bu Rina senang bisa segera pergi, tapi foto seadanya belum tentu cukup untuk pemeriksa. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `proses.bukti` | Tiga bukti: seluruh mobil, detail kerusakan, identitas | m02 | Turunan | perlu konfirmasi PIC Claim |
| `akhir.tertunda.pelajaran.1` | Tiga bukti: seluruh mobil, detail kerusakan, dan identitas kendaraan. | m02 | Turunan | perlu konfirmasi PIC Claim |
| `akhir-tertunda.6` (revisi 5: diberi tombol "Apa itu nasabah?", bagian S) | Bukti yang lengkap sejak awal menghemat waktu semua orang, {nama}. Terutama nasabah. | m02 `rakiBriefing` ("Bukti yang tepat bikin pemeriksaan lebih cepat") | Turunan | perlu konfirmasi PIC Claim |
| `akhir.tertunda.pelajaran.3` | Menambah foto sekarang lebih ringan daripada meminta nasabah mengulang nanti. | m02 | BARU (ringan) | perlu konfirmasi PIC Claim |
| `akhir-tertunda.4` | Laporan Bu Rina kemudian perlu dilengkapi dengan foto yang kurang. | Kontrak 3.1 (akhir-tertunda) | **BARU (N5)** | perlu konfirmasi PIC Claim |
| `akhir-tertunda.5` | Kenapa tidak sekalian waktu saya di sana? Sekarang saya harus atur waktu lagi. | N5 (reaksi nasabah) | BARU (N5) | perlu konfirmasi PIC Claim |
| `akhir-tertunda.7` (revisi 2; bila penutupnya merangkum) | Tadi memang dibilang akan dikabari kalau ada yang kurang. Tapi kenapa tidak sekalian waktu saya di sana? | N3 + N5 (reaksi nasabah) | BARU (N3, N5) | perlu konfirmasi PIC Claim |
| `akhir.tertunda.ringkas` | Bukti belum lengkap, jadi laporan Bu Rina perlu dilengkapi belakangan. | Kontrak 3.1 | **BARU (N5)** | perlu konfirmasi PIC Claim |
| `akhir-tertunda.1` | Siang itu mobil Bu Rina langsung diperbaiki di bengkel. | Kontrak 3.1 (jalur bengkel) | BARU (epilog) | perlu konfirmasi PIC Claim |
| `akhir-tertunda.2` | Laporannya kemudian perlu dilengkapi, padahal kondisi sebelum perbaikan tak bisa difoto ulang. | m01 + kontrak 3.1 | **BARU (N5)** | perlu konfirmasi PIC Claim |
| `akhir-tertunda.3` | Mobilnya sudah diperbaiki. Kondisi yang dulu mau difoto dari mana lagi? | m01 + kontrak 3.1 | **BARU (N5)** | perlu konfirmasi PIC Claim |
| `b3-seadanya.1` | Oke, foto dari HP saya kirim sekarang. Habis ini saya langsung ke bengkel. | Kontrak 3.1 (b3-seadanya) | **BARU (N7)** | perlu konfirmasi PIC Claim |
| `b3-seadanya.2` | Laporan dibuat dari foto seadanya: agak buram, dan plat nomornya tidak kelihatan. | Kontrak 3.1 (b3-seadanya) | **BARU (N7)** | perlu konfirmasi PIC Claim |

Catatan: m02 menyebut identitas kendaraan sebagai "plat & nomor rangka". Kontrak 3.2 memakai opsi `foto-plat`
(plat nomor) saja. Mohon konfirmasi bahwa plat nomor cukup untuk simulasi ini.

## D. Kartu polis Comprehensive vs TLO (m05)

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `akt.polis.kartu.judul` | Kartu Polis Bu Rina | Fiksi simulasi | Turunan (judul) | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.sub` | Comprehensive (simulasi) | m05 Kartu Polis A | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.benturan.label` / `akt.polis.kartu.benturan.nilai` | Kerusakan benturan: Tercakup sesuai syarat kartu | m05 Kartu Polis A (sama persis) | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.status.label` / `akt.polis.kartu.status.nilai` | Status polis: Aktif | m05 Kartu Polis A | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.kendaraan.label` / `akt.polis.kartu.kendaraan.nilai` | Kendaraan & plat: Minibus keluarga · B 1726 RN | Fiksi simulasi | BARU (data fiktif) | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.risiko.label` / `akt.polis.kartu.risiko.nilai` | Risiko sendiri: Berlaku sesuai ketentuan polis | Kontrak 3.2 + m09 | **BARU (N9)** | perlu konfirmasi PIC Claim |
| `akt.polis.instruksi` (satu kalimat tugas; tidak mengulang tujuan bab `bab.polis.tujuan`) | **(revisi 4)** Pilih penjelasan yang sesuai dengan isi kartu. | m05 instruksi | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.petunjuk` ("Butuh petunjuk?") | **(revisi 4)** Baris "Kerusakan benturan" menjawab pertanyaan Bu Rina. | m05 Kartu Polis A + `b4-polis-salah.1` | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis-intro.1` (revisi 4; tombol "Apa itu polis?" & "Apa itu Comprehensive?") | Kalian kembali ke meja layanan. Kamu membuka ringkasan dokumen perlindungan Bu Rina: kartu polis Comprehensive. | Kontrak 3.2 (kartu polis simulasi) + m05 Kartu Polis A ("Comprehensive (simulasi)") | **BARU (N16)**: kartu polis = ringkasan dokumen perlindungan | perlu konfirmasi PIC Claim |
| `b4-polis-intro.2` (revisi 4; jalur foto seadanya; tombol "Apa itu polis?" & "Apa itu Comprehensive?") | Sebelum Bu Rina berangkat, kamu membuka ringkasan dokumen perlindungannya: kartu polis Comprehensive. | Sama dengan `b4-polis-intro.1` | **BARU (N16)** | perlu konfirmasi PIC Claim |
| `akt.polis.cerita` | Bu Rina bertanya apakah polisnya bisa dipakai untuk bemper dan lampu belakang yang penyok dan retak. | Fiksi simulasi (pertanyaan nasabah) | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.opsi.bisa-dinilai` (jawaban tepat) | **(revisi 2)** Kerusakan ini bisa dilanjutkan untuk dinilai sesuai syarat kartu polis Ibu. | m05 bucket `lanjut` ("Dapat dilanjutkan untuk penilaian kerusakan benturan") | **BARU (N10)** | perlu konfirmasi PIC Claim |
| `paham.polis-dinilai` | **(revisi 2)** Kerusakan bisa dilanjutkan untuk dinilai sesuai syarat kartu, bukan pasti diganti. | m05 + kontrak bagian 3 | **BARU (N10)** | perlu konfirmasi PIC Claim |
| `akt.polis.bahas.penjelasan` | **(revisi 4)** Kartu menyatakan kerusakan benturan tercakup sesuai syarat kartu, jadi kerusakan ini bisa dilanjutkan untuk dinilai. "Tercakup" belum berarti "pasti diganti": hasilnya menunggu penilaian. "Tidak tercakup" bertentangan dengan kartu. (Revisi 2 masih menambah kalimat ambang 75% / TLO; dihapus bersama pengecohnya.) | m05 penjelasan | Turunan (N10) | perlu konfirmasi PIC Claim |
| `akt.polis.alasan.bisa-dinilai` (alasan per opsi, revisi 4; tampil setelah dikirim) | Sesuai kartu: kerusakan benturan tercakup sesuai syarat, jadi bisa dilanjutkan untuk dinilai. | `akt.polis.bahas.penjelasan` (m05) | Turunan (N10, N18) | perlu konfirmasi PIC Claim |
| `akt.polis.alasan.pasti-diganti` | "Tercakup" belum berarti pasti diganti; hasilnya menunggu penilaian. | `akt.polis.bahas.penjelasan` (m05) | Turunan (N18) | perlu konfirmasi PIC Claim |
| `akt.polis.alasan.tidak-tercakup` | Bertentangan dengan kartu, yang menulis kerusakan benturan tercakup sesuai syarat kartu. | `akt.polis.bahas.penjelasan` (m05) | Turunan (N18) | perlu konfirmasi PIC Claim |
| `akt.polis.ringkasan` | **(revisi 2)** Kartu Comprehensive: kerusakan benturan bisa dilanjutkan untuk dinilai sesuai syarat kartu, bukan pasti diganti. | m05 ringkasan | Turunan (N10) | perlu konfirmasi PIC Claim |
| `akt.polis.pelajaran` | Jaminan mengikuti kartu polis. Baca kartunya dulu sebelum menjelaskan ke nasabah. | m05 `learning` + `rakiBriefing` | Turunan | perlu konfirmasi PIC Claim |
| `akt.polis.briefing` (tidak tampil di mode cerita) | **(revisi 4)** Kartu polis adalah pegangan penjelasanmu. | m05 `rakiBriefing` | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.1` (revisi 4; tampil di kartu aktivitas) | (pelan) Bu Rina berharap jawabannya "ya", {nama}. Tetap sampaikan apa yang tertulis di kartu. | m05 `rakiBriefing` ("Baca kartunya dulu") + kontrak bagian 1 (perasaan nasabah vs ketepatan langkah) | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.1.1` | **(revisi 2)** Dinilai dulu, ya. Oke, setidaknya bisa lanjut. | m05 | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.1.2` | Pas. Kartunya menulis tercakup sesuai syarat, bukan otomatis diganti. | m05 | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.1.alasan` | **(revisi 2)** Bu Rina lebih tenang karena penjelasanmu sesuai kartu: kerusakannya bisa dilanjutkan untuk dinilai. | m05 | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.2.1` | Pasti diganti? Syukurlah! | Reaksi atas distraktor | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.2.2` | (pelan) Kartunya menulis "tercakup sesuai syarat kartu". Apa itu sama dengan "pasti"? | m05 | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.2.alasan` | Bu Rina lega mendengar "pasti diganti", padahal hasilnya masih menunggu penilaian. | m05 | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.3.1` | Tidak tercakup? Terus buat apa saya bayar polis? | Reaksi atas distraktor | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.3.alasan` | Bu Rina kecewa berat: penjelasanmu membuatnya merasa polisnya percuma. | Reaksi atas distraktor | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.4.1` (revisi 4: hanya tampil pada simpanan lama yang sempat memilih pengecoh ambang 75%) | Tujuh puluh lima persen? Mobil saya cuma penyok, bukan hancur. | Reaksi atas distraktor TLO (m05 Kartu B) | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.4.2` | Jadi bagaimana? Saya belum dapat jawaban. | Reaksi (jawaban kosong) | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `b4-polis.hasil.4.alasan` | **(revisi 4)** Bu Rina bingung karena belum mendapat penjelasan yang cocok dengan kartunya. | m05 | Turunan (kini untuk jawaban kosong; revisi 2 menyebut "syarat yang kamu sebut" = ambang TLO) | perlu konfirmasi PIC Claim |
| `b4-polis-salah.1` | {nama}, baca lagi baris "Kerusakan benturan" di kartunya. | Kontrak 3.1 + m05. Kartu kini selalu bisa dibuka ulang di Catatan kasus (bagian M) | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis-salah.baca-ulang` | **(revisi 2)** Maaf, Bu, saya salah baca. Kerusakan benturan tercakup sesuai syarat kartu, jadi bisa dinilai. | m05 | Turunan (N10) | perlu konfirmasi PIC Claim |
| `b4-polis-salah.baca-ulang.alasan` | Bu Rina kembali tenang karena kamu mengakui salah baca dan menjelaskan isi kartunya. | m05 | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis-salah.bertahan.alasan` | Bu Rina kehilangan kepercayaan karena kamu bertahan pada bacaan yang tidak sesuai kartu. | m05 | Turunan | perlu konfirmasi PIC Claim |
| `catatan.polis` | Comprehensive (simulasi), aktif. Kerusakan benturan tercakup sesuai syarat kartu; risiko sendiri sesuai polis. | m05 + kontrak 3.2 | Turunan (+N9) | perlu konfirmasi PIC Claim |
| `proses.baca-polis` | Membaca kartu polis dengan tepat | m05 | Turunan | perlu konfirmasi PIC Claim |
| `akhir-janji.4` | Katanya pasti diganti. Ternyata masih dinilai, dan ada yang tetap saya tanggung. | m05 + m09 | BARU (epilog) | perlu konfirmasi PIC Claim |
| `b5-keberatan.ralat-polis` (ralat; hanya muncul setelah kartu dijelaskan "pasti diganti") | **(revisi 4, dipersingkat ke 20 kata)** Maaf, saya keliru: kerusakannya dinilai dulu sesuai syarat, bukan pasti diganti. Waktunya belum pasti, dan sebagian kerugian tetap Ibu tanggung. | m05 + m09 + catatan simulasi | Turunan (m05) + **BARU (N1, N4, N11)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.ralat-polis.alasan` | Bu Rina kecewa kabarnya berubah, tapi kini ia paham isi kartunya dan tahu keadaan yang sebenarnya. | Komunikasi (bukan materi klaim) | BARU (N11) | perlu konfirmasi PIC Claim |
| `b5-rangkum.3` (revisi 2; ringkasan ditutup saat janji "pasti diganti" masih berlaku) | Iya, iya. Tapi pasti diganti, kan? Tadi sudah dibilang begitu. | m05 (akibat janji) | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |

## E. Risiko sendiri (m09)

m09 hanya berisi contoh hitungan HVC (10% dari kerugian yang disetujui, minimum Rp5.000.000). Naskah **tidak**
menyebut nominal, persentase, atau cara hitung risiko sendiri AUTO. Yang dipakai hanya pengertian umumnya, dan
risiko sendiri Bu Rina berasal dari baris kartu simulasinya (N9).

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `b4-polis-tepat.1` | Terus ini, "risiko sendiri berlaku sesuai ketentuan polis". Maksudnya apa? | Kartu (N9) | Turunan | perlu konfirmasi PIC Claim |
| `b4-polis-tepat.2` (ucapan petugas) | Ada bagian kerugian yang tetap Ibu tanggung, Bu. Besarnya sesuai ketentuan polis. | m09 (konsep) + kontrak bagian 1 | **BARU (N1)** | perlu konfirmasi PIC Claim |
| `b4-polis-tepat.3` | Jadi tetap ada yang keluar dari kantong saya. Hm. | N1 (pemahaman nasabah) | BARU (N1) | perlu konfirmasi PIC Claim |
| `paham.risiko-sendiri` | Ada bagian kerugian yang tetap ia tanggung sesuai polis (risiko sendiri). | m09 + kontrak | **BARU (N1)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.jujur` (jawaban terbaik) | **(revisi 4)** Besok belum bisa saya pastikan, Bu. Ada pemeriksaan sesuai polis, dan sebagian kerugian tetap Ibu tanggung. | m09 + catatan simulasi | **BARU (N1, N4)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.ralat-janji` | Maaf, saya perlu meluruskan, Bu: hasil dan waktunya belum pasti, dan sebagian kerugian tetap Ibu tanggung. | m09 + catatan simulasi | **BARU (N1, N4)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.ralat-polis` | (lihat bagian D: ralat kartu polis + risiko sendiri + waktu belum pasti) | m05 + m09 + catatan simulasi | **BARU (N1, N4, N10, N11)** | perlu konfirmasi PIC Claim |
| `akhir.tuntas.pelajaran.3` | **(revisi 2)** Jelaskan apa adanya: dinilai sesuai polis, ada risiko sendiri **bila tercantum di polis**, dan waktunya belum bisa dipastikan. | m05 + m09 + catatan simulasi | **BARU (N1, N4)**. Revisi 2 menambah "bila tercantum di polis" supaya pelajaran umum ini tidak terbaca "setiap klaim AUTO pasti ada risiko sendiri". | perlu konfirmasi PIC Claim |

## F. Langkah berikutnya, urutan layanan & waktu

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `b5-tutup.rangkum` (jawaban terbaik) | **(revisi 4, isi sama)** Laporan Ibu tercatat. Kerusakan diperiksa dan dinilai sesuai polis; langkah perbaikan mengikuti hasilnya. Kalau ada yang kurang, saya kabari. | Catatan simulasi (pemeriksaan) + m05 (penilaian) | **BARU (N2, N3)** | perlu konfirmasi PIC Claim |
| `paham.langkah-berikut` | **(revisi 2)** Laporan tercatat, lalu kerusakan diperiksa dan dinilai sesuai polis; langkah perbaikan mengikuti hasil penilaian. | Sama | **BARU (N2)** | perlu konfirmasi PIC Claim |
| `b5-rangkum.1` (revisi 2; nasabah mengulang dengan kata-katanya sendiri) | Oke. Jadi dinilai dulu, lalu perbaikannya mengikuti hasil penilaian. Saya catat. | N2 | BARU (N2) | perlu konfirmasi PIC Claim |
| `b5-tutup.rangkum.alasan` | Bu Rina lebih tenang karena kamu merangkum langkahnya dan siapa yang akan mengabari. | N2, N3 | BARU | perlu konfirmasi PIC Claim |
| `akhir.dingin.pelajaran.3` | Tutup dengan ringkasan langkah berikutnya dan siapa yang akan mengabari. | N2, N3 | BARU | perlu konfirmasi PIC Claim |
| `akhir-dingin.6` (revisi 2; bila ditutup "nanti dikabari") | "Nanti dikabari" belum menjawab pertanyaannya, {nama}: setelah ini ia harus apa? Rangkum langkahnya sebelum ia pergi. | N2 | BARU | perlu konfirmasi PIC Claim |
| `proses.tanpa-janji` | Tidak menjanjikan hasil atau waktu | Catatan simulasi + kontrak bagian 1 | Turunan | perlu konfirmasi PIC Claim |
| `b1-datang.janji.alasan` | Bu Rina lega mendengar janji itu, padahal hasil dan waktunya belum bisa dipastikan. | Catatan simulasi | **BARU (N4)** | perlu konfirmasi PIC Claim |
| `b5-keberatan.janjikan.alasan` | Bu Rina senang dijanjikan besok selesai, padahal waktunya belum bisa dipastikan. | Catatan simulasi | **BARU (N4)** | perlu konfirmasi PIC Claim |
| `akhir-tuntas.1` | Oke, mobil belum bisa langsung beres. Besok saya pinjam mobil adik untuk antar pesanan. | Kontrak 3.1 (akhir-tuntas) | BARU (N4) | perlu konfirmasi PIC Claim |
| `b5-rangkum.2` (revisi 2; janji waktu masih berlaku) | Iya, iya. Tapi besok sudah beres, kan? Tadi sudah dijanjikan. | Akibat janji (N4) | Turunan (ucapan nasabah) | perlu konfirmasi PIC Claim |
| `akhir-janji.3` | Katanya besok beres. Saya sudah terlanjur janji ke pelanggan, akhirnya pontang-panting. | N4 (akibat janji waktu) | BARU (epilog) | perlu konfirmasi PIC Claim |
| `akhir-janji.5` | Ia senang di meja kita, {nama}, tapi kecewa sesudahnya. Janji di luar proses hanya menunda kecewa. | Catatan simulasi + kontrak bagian 1 | BARU | perlu konfirmasi PIC Claim |
| `b1-pulih.2` | (pelan) Datanya bisa menyusul, {nama}. Apa yang paling ia butuhkan sekarang? | Kontrak 3.1 (b1-pulih) | **BARU (N13)** | perlu konfirmasi PIC Claim |
| `akhir.tuntas.pelajaran.1` | Tanyakan keadaan dan kebutuhan nasabah dulu; data menyusul lebih lancar. | Kontrak bagian 1 | **BARU (N13)** | perlu konfirmasi PIC Claim |

## G. Distraktor (pilihan yang sengaja salah)

Semua distraktor mendapat akibat negatif di cerita (proses `keliru`, kepercayaan turun, atau akhir campuran/buruk),
lalu dijelaskan oleh Miss Raksa atau di pembahasan.

| Kunci | Kalimat (SALAH) | Mengapa salah | Sumber | Status |
| --- | --- | --- | --- | --- |
| `b1-datang.janji` | Tenang, Bu, kami bantu sampai beres. Besok mobilnya pasti bisa dipakai. | Menjanjikan hasil & waktu | Catatan simulasi | perlu konfirmasi PIC Claim |
| `b1-datang.prosedur` (+ `b1-datang.prosedur.alasan`) | **(revisi 4)** Baik, Bu. Saya perlu data asuransi Ibu dan foto kerusakannya dulu, ya. | Isinya wajar, urutannya kurang tepat (komunikasi). Revisi 4: "nomor polis" → "data asuransi" (istilah polis baru dijelaskan di bab 4; lihat H) | Kontrak 3.1 | perlu konfirmasi PIC Claim |
| `b1-pulih.tetap` | Saya mengerti, Bu. Supaya cepat, kita isi datanya dulu, ya. | Urutan kurang tepat (komunikasi); "isi data" bukan prosedur resmi baru | Kontrak 3.1 | perlu konfirmasi PIC Claim |
| `b2-saran.bengkel` | Kalau memang mendesak, perbaiki dulu saja, Bu. Klaimnya bisa menyusul. | Memperbaiki sebelum dokumentasi | m01 opsi `perbaiki` | perlu konfirmasi PIC Claim |
| `b2-saran.ringan` | Kalau cuma baret, mungkin tidak perlu klaim, Bu. Mobilnya masih bisa jalan, kan? | Mengabaikan kejadian | m01 opsi `abaikan` | perlu konfirmasi PIC Claim |
| `b2-bengkel-akibat.biarkan` | Foto dari HP Ibu tadi sudah cukup, Bu. Silakan ke bengkel. | Bukti seadanya lalu diperbaiki | m01 + m02 | perlu konfirmasi PIC Claim |
| `b2-ringan-akibat.tetap-ringan` | **(revisi 4)** Dari cerita Ibu, kedengarannya ringan. Sebaiknya tidak usah diperpanjang supaya Ibu tidak repot. | Menilai tanpa melihat | m01 | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-menu` | Brosur menu katering di kaca | Tidak berkaitan dengan kejadian; tidak membantu pemeriksaan | m02 distraktor (foto makanan) | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-ban` | **(revisi 3)** Foto dekat ban depan | Foto detail mobil, tetapi bagian yang tidak rusak: tidak menunjukkan titik kerusakan (bemper & lampu belakang) maupun identitas mobil (N15). Masuk akal dipilih karena m02 memang meminta foto detail, jadi yang diuji adalah **detail bagian mana**. Menggantikan "Swafoto di depan mobil". | m02 `learning` + penjelasan ("foto detail … menunjukkan titik benturan") | perlu konfirmasi PIC Claim |
| `akt.bukti.opsi.foto-dasbor` | **(revisi 3)** Foto dasbor dari jendela | Foto bagian mobil yang tidak rusak dan tidak menunjukkan identitas mobil (N15). Menggantikan "Kucing yang tidur di kap". Lihat pertanyaan I.12 (apakah foto dasbor/odometer pernah diminta dalam klaim AUTO). | m02 `learning` + penjelasan ("foto identitas memastikan kendaraan yang diperiksa benar") | perlu konfirmasi PIC Claim |
| `b3-bukti-kurang.cukup` | Sudah, Bu. Foto yang ada kita pakai saja supaya Ibu tidak terlambat. | Bukti tidak lengkap | m02 | perlu konfirmasi PIC Claim |
| `akt.polis.opsi.pasti-diganti` | **(revisi 4)** Di kartu Ibu tertulis "tercakup", jadi kerusakan bemper dan lampu belakangnya pasti diganti. (Revisi 2: "Kartu Ibu menulis “tercakup”, jadi kerusakannya pasti diganti.") | Membaca "tercakup" tanpa "sesuai syarat kartu"; mendahului penilaian (janji). Kalimat lama ("polis Ibu Comprehensive, pasti diganti") diganti supaya pengecoh ini juga berangkat dari isi kartu (N14). | m05 + catatan simulasi | perlu konfirmasi PIC Claim |
| `akt.polis.opsi.tidak-tercakup` | **(revisi 4)** Kerusakan kecil seperti penyok dan retak ini tidak tercakup di polis Ibu. | Bertentangan dengan kartu | m05 | perlu konfirmasi PIC Claim |
| `akt.polis.opsi.ambang-tlo` (**pensiun revisi 4**: tidak ditawarkan lagi; bagian P) | **(revisi 2)** Sesuai syarat kartu, kerusakan ini baru dijamin bila mencapai 75% nilai mobil. | Ambang 75% adalah ambang kerusakan total polis TLO (Total Loss Only), bukan syarat kartu Comprehensive ini. Revisi 1 berbunyi "Klaim baru bisa **diajukan** kalau …", yang bersama pembahasannya bisa terbaca "pada TLO klaim tidak bisa diajukan"; kini distraktornya soal **jaminan**, bukan hak melapor/mengajukan (N14). | m05 Kartu B | perlu konfirmasi PIC Claim |
| `b4-polis-salah.bertahan` | **(revisi 4)** Saya sudah membacanya dengan teliti tadi, Bu. Supaya Ibu tidak bingung, kesimpulan saya tetap sama. | Bertahan pada bacaan salah (alasannya terdengar sopan, tetapi tetap tidak membaca ulang kartu) | m05 | perlu konfirmasi PIC Claim |
| `b5-keberatan.janjikan` | **(revisi 4)** Saya usahakan besok sudah selesai, Bu. Nanti saya bantu kejar prosesnya supaya Ibu tidak perlu menunggu lama. | Menjanjikan waktu | Catatan simulasi | perlu konfirmasi PIC Claim |
| `b5-keberatan.aturan` / `b5-keberatan.aturan-janji` | **(revisi 4)** Itu sudah ketentuan polis, Bu. Semuanya tertulis di kartu Ibu; silakan dibaca lagi supaya Ibu yakin. | Benar isinya, tapi tidak menjelaskan (komunikasi). Dua kunci = kalimat sama; `aturan-janji` dipakai bila janji lama masih berlaku (bagian M) | Kontrak 3.1 | perlu konfirmasi PIC Claim |
| `b5-tutup.singkat` (+ `b5-tutup.singkat.alasan`) | **(revisi 4)** Semua keterangan sudah saya catat lengkap, Bu. Ibu tidak perlu repot memikirkannya lagi; tinggal tunggu saja di rumah, nanti dikabari. | Tidak menjelaskan langkah berikutnya | Kontrak 3.1 | perlu konfirmasi PIC Claim |

**Pengecoh aktivitas bukti (revisi 3).** Tinjauan internal menilai brosur, swafoto, dan kucing terlalu mudah
ditebak (tidak ada pengecoh yang masuk akal secara pemeriksaan). Swafoto dan kucing kini diganti dua foto **bagian
mobil Bu Rina yang tidak rusak**: "Foto dekat ban depan" dan "Foto dasbor dari jendela" (objek baru di roda depan
dan kaca pintu depan pada adegan 2D parkiran; kontrak 3.2 diperbarui). Keduanya tampak seperti bukti karena memang
foto mobil yang benar, tetapi tidak menunjukkan titik kerusakan di belakang maupun identitas mobil, jadi pemain perlu
menimbang apa yang dibutuhkan pemeriksa (m02: "Bukti harus membantu menghubungkan kendaraan, lokasi kerusakan, dan
kejadian"). Brosur menu tetap (turunan "foto makan siang" m02). Tiga jawaban tepat tidak berubah. Lihat N15 dan
pertanyaan I.12.

## H. Yang sengaja TIDAK ada di naskah

- Janji hasil/persetujuan klaim, kata "disetujui/ditolak", atau kewenangan petugas menyetujui/menolak.
- Kepastian bahwa klaim berujung perbaikan: ringkasan penutup menyebut "langkah perbaikan mengikuti hasil
  penilaian" (revisi 2), bukan "lalu perbaikan".
- SLA, tenggat, atau jumlah hari. "Beberapa hari kemudian" (`akhir-janji.2`) hanya penanda waktu cerita di
  epilog, bukan janji layanan.
- Nominal, persentase, atau cara hitung risiko sendiri AUTO.
- Prosedur resmi baru (nomor laporan, formulir resmi, dokumen tambahan selain tiga foto dan kartu polis). Kata
  **"formulir"**, **"isi data"**, dan **"nomor polis"** memang muncul, tetapi hanya sebagai ucapan nasabah atau
  distraktor komunikasi, tidak sebagai langkah yang diajarkan:
  - `b1-pulih.1` (nasabah): "Sebentar. Saya lagi bingung, bukan cuma mau isi formulir."
  - `b1-pulih.tetap.alasan`: "… ia merasa hanya dianggap formulir." (akibat komunikasi)
  - `b1-pulih.tetap` (distraktor): "… kita isi datanya dulu, ya."
  - `b1-datang.prosedur` dan `b1-datang.prosedur.alasan` (distraktor urutan): revisi 4 memakai "data asuransi … dan foto
    kerusakannya" (revisi 1-3: "nomor polis"), supaya istilah polis tidak muncul sebelum dijelaskan.
  Mohon konfirmasi bahwa meminta "data asuransi" (atau "nomor polis") sebagai data awal tidak keliru.
- Pihak ketiga / tanggung gugat: pelaku yang pergi hanya bagian kronologi, tidak dibahas lebih lanjut.

## I. Pertanyaan untuk PIC Claim

1. **N1**: Apakah "bagian kerugian yang tetap Ibu tanggung; besarnya sesuai ketentuan polis" tepat sebagai
   penjelasan awam risiko sendiri polis AUTO?
2. **N2 (revisi 2)**: Apakah urutan "laporan tercatat → kerusakan diperiksa dan dinilai sesuai polis → langkah
   perbaikan mengikuti hasil penilaian" tepat? Khususnya:
   a. Apakah "langkah perbaikan **mengikuti hasil penilaian**" cukup jelas bahwa perbaikan (dan jaminannya) belum
      pasti, sehingga tidak terbaca "klaim pasti berujung perbaikan"?
   b. Revisi 1 memakai "perbaikan **setelah koordinasi**" (di m01 kata "koordinasi" hanya muncul di distraktor
      "Langsung memperbaiki tanpa dokumentasi atau koordinasi"). Kata itu dihapus. Perlukah dikembalikan, dan
      apa maknanya bagi nasabah?
   c. Adakah tahap resmi di antaranya yang sebaiknya disebut (mis. survei)? Bila ada, mohon disebutkan, supaya
      tidak dikarang.
3. **N3**: Apakah pantas petugas layanan berkata "Bila ada yang kurang, saya kabari"?
4. **N5/N7**: Apakah nasabah boleh mengirim foto dari HP sebagai bahan laporan awal, dan apakah "laporan perlu
   dilengkapi" (bukan "ditolak") menggambarkan akibat bukti kurang dengan benar?
5. **N6**: Apakah menyimpan bagian yang rusak (pecahan penutup lampu) tepat untuk kasus AUTO?
6. **N10 (revisi 2)**: Apakah "bisa **dilanjutkan untuk dinilai** sesuai syarat kartu" boleh dipakai sebagai
   padanan awam m05 "dapat dilanjutkan untuk penilaian"? Revisi 1 memakai "bisa diajukan dan dinilai", yang
   dihapus karena mengaitkan hak mengajukan klaim dengan jaminan.
7. **N14 / distraktor TLO (revisi 2)**: Distraktor kini berbunyi "Sesuai syarat kartu, kerusakan ini baru dijamin
   bila mencapai 75% nilai mobil", dan pembahasannya "ambang 75% adalah ambang kerusakan total pada polis TLO
   (Total Loss Only), bukan syarat kartu Comprehensive ini". Apakah penjelasan TLO ini tepat, dan tidak memberi
   kesan bahwa pemegang polis TLO tidak perlu/tidak bisa melapor? **Revisi 4: tidak berlaku lagi untuk episode**:
   pengecoh ini dan kalimat TLO di pembahasan dihapus (materi Comprehensive vs TLO tetap di latihan misi 5).
8. Identitas kendaraan: cukup plat nomor, atau perlu ditambah nomor rangka seperti m02?
9. Meja layanan kantor boleh dianggap sebagai "kanal klaim" (m01) di simulasi ini?
10. **N13**: Apakah petugas boleh mendahulukan mendengar nasabah dan meminta data (nomor polis dsb.) sesudahnya
    ("datanya bisa menyusul")?
11. **Penilaian `aturan` (bagian M)**: Menyuruh nasabah membaca kartu sendiri, tanpa janji apa pun, dinilai
    **tepat** untuk butir "Tidak menjanjikan hasil atau waktu" (komunikasinya tetap buruk dan berakhir "Benar,
    tapi Berjarak"). Setuju?
12. **Pengecoh aktivitas bukti (N15, revisi 3)** (bagian G): swafoto dan kucing sudah diganti "Foto dekat ban
    depan" dan "Foto dasbor dari jendela", dengan alasan "tidak menunjukkan titik kerusakan di belakang maupun
    identitas mobil". Mohon konfirmasi:
    a. Apakah alasan itu tepat, dan tidak terbaca "foto bagian lain mobil tidak pernah berguna"?
    b. Dalam praktik klaim AUTO, apakah foto dasbor (mis. odometer atau lampu peringatan) atau foto ban pernah
       diminta? Bila ya, pengecoh itu perlu diganti, karena di simulasi keduanya dinilai tidak membantu. Naskah
       **tidak** menyebut odometer atau dokumen tambahan apa pun.
    c. Adakah contoh kesalahan foto yang sering terjadi di lapangan yang lebih cocok?
13. **N11 / ralat**: lihat pertanyaan di bagian K.
14. **N16 (revisi 4)**: Arti lima istilah di bagian S (nasabah, klaim, polis, Comprehensive, risiko sendiri) tepat
    dan cukup awam? Khususnya: "klaim = laporan kerugian dari nasabah kepada perusahaan asuransi; hasilnya mengikuti
    polis dan pemeriksaan", dan "kartu polis = ringkasan dokumen perlindungan" (`b4-polis-intro.1`).
15. **N16 / Comprehensive**: Artinya sengaja dibatasi pada kartu Bu Rina ("pada kartunya, kerusakan benturan
    termasuk yang dilindungi, sesuai syarat kartu"), tanpa definisi umum produk. Cukup, atau ada rumusan resmi
    Raksa yang sebaiknya dipakai?
16. **N17**: Arti baris kartu, terutama "Aktif berarti perlindungan di kartu ini sedang berlaku" dan "Risiko sendiri:
    besarnya mengikuti ketentuan polis, tidak tertulis di kartu ini". Tepat?
17. **`b1-datang.prosedur` (revisi 4)**: "data asuransi" menggantikan "nomor polis" di pengecoh urutan (bagian H).
    Keberatan?
18. **`b1-mentor.1` & ruang layanan (revisi 5)**: Adegan kini berlatar ruang layanan bernama "Raksa Silver Club"
    (papan nama + "Hari ini kamu bertugas di meja layanan Raksa Silver Club"). Ini pilihan artistik, bukan pernyataan
    bahwa Bu Rina anggota / berhak atas layanan Silver Club, dan tidak ada syarat keanggotaan, batas pertanggungan,
    atau fasilitas yang disebut. Apakah nama ini boleh dipakai untuk simulasi pelaporan klaim kendaraan, atau ada nama
    ruang layanan lain yang lebih tepat? (Nama cukup diganti di konfigurasi `Episode.panggung.lokasi.nama`.)

## J. Istilah terjemahan yang perlu ditinjau

Terjemahan: `teks.en.ts` (Inggris Britania, seperti `shared/i18n/misi.en.ts`) dan `teks.zh.ts` (简体中文).
Status: **DRAF**, belum ditinjau penutur asli maupun PIC Claim (26 September 2026). Istilah sengaja disamakan
dengan misi m01, m02, m05, m09 dan kamus UI (`catatanSimulasiPeriksa`, `pintuCeritaIsi`) supaya pemain melihat
istilah yang sama di latihan misi dan di mode cerita. Kolom **Peninjau**: PIC = PIC Claim (makna klaim), PA =
penutur asli (kewajaran bahasa).

| # | Istilah Indonesia | English | 中文 | Kunci contoh | Yang perlu dicek | Peninjau |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | risiko sendiri | deductible | 免赔额 | `akt.polis.kartu.risiko.nilai`, `b4-polis-tepat.2`, `paham.risiko-sendiri` | Mengikuti m09. Asuransi kendaraan di Inggris lazim memakai "excess"; dipertahankan "deductible" agar sama dengan m09. Definisi awam = N1. | PIC, PA |
| T2 | pemeriksaan / pemeriksa | inspection / inspector | 查勘 / 查勘员 | `akt.polis.kartu.catatan`, `bab.bukti.tujuan`, `b3-bukti.hasil.2.4` | "Pemeriksa" belum ada padanannya di materi lama. Apakah Raksa lebih lazim memakai "surveyor" (EN) dan 定损员 / 查勘员 (ZH)? | PIC |
| T3 | dinilai / penilaian | assessed / assessment | 评估 | `b4-polis.hasil.2.alasan`, `akt.polis.bahas.penjelasan` | Mengikuti m05. Di klaim kendaraan berbahasa Mandarin, istilah khusus penilaian kerusakan adalah 定损; dipakai 评估 yang lebih umum. | PIC, PA |
| T4 | **(revisi 2)** bisa dilanjutkan untuk dinilai (N10) | can proceed to assessment | 可以继续评估 | `akt.polis.opsi.bisa-dinilai`, `paham.polis-dinilai`, `b4-polis-salah.baca-ulang`, `b5-keberatan.ralat-polis` | Kini sama dengan m05 ("Can proceed to assessment" / 可以继续进行…评估). Revisi 1 "can be submitted and assessed" dihapus: dalam bahasa Inggris yang diajukan adalah klaim, bukan kerusakan. | PIC |
| T5 | pasti diganti (distraktor) | definitely paid for | 一定会赔 | `akt.polis.opsi.pasti-diganti`, `b4-polis.hasil.2.1`, `akhir-janji.4` | Sengaja BUKAN "covered" / 保障 agar tidak rancu dengan baris kartu "Covered, subject to the card terms" / 按卡片条款属于保障范围. | PIC, PA |
| T6 | tercakup sesuai syarat kartu | Covered, subject to the card terms | 按卡片条款属于保障范围 | `akt.polis.kartu.benturan.nilai`, `catatan.polis` | Disalin persis dari m05 Kartu Polis A. | PIC |
| T7 | berlaku sesuai ketentuan polis (N9) | Applies according to the policy terms | 按保单条款适用 | `akt.polis.kartu.risiko.nilai`, `b4-polis-tepat.1` | Ketentuan polis = policy terms / 保单条款 (disclaimer `layar`). | PIC |
| T8 | **(revisi 2)** lapor / laporan tercatat (N2) | report / your report is recorded | 报案 / 报案已记录 | `b5-tutup.rangkum`, `paham.langkah-berikut`, `akhir-dingin.3` | Revisi 1 memakai "logged" / 登记, yang bisa terbaca sebagai nomor registrasi resmi; kini "recorded" / 已记录. Kalimat EN juga diperbaiki: yang diperiksa mobil ("the car is inspected"), yang dinilai kerusakannya, bukan laporannya. | PIC, PA |
| T9 | laporan perlu dilengkapi (N5) | the report needed completing | 报案资料需要补充 | `akhir-tertunda.2`, `akhir-tertunda.4`, `akhir.tertunda.ringkas` | Laporan sebagai berkas diterjemahkan 报案资料 (bukan 报告). | PIC, PA |
| T10 | **(dihapus di revisi 2)** perbaikan setelah koordinasi | (repairs after coordination) | (沟通确认后再安排维修) | — | Diganti "langkah perbaikan mengikuti hasil penilaian" = "the repair steps follow the outcome of the assessment" / 维修安排以评估结果为准 (lihat I.2). | PIC, PA |
| T11 | bila ada yang kurang, saya kabari (N3) | If anything’s missing, I’ll let you know | 如有需要补充的，我会通知您 | `b5-tutup.rangkum` | Sama dengan N3: apakah petugas pantas menjanjikan kabar ini? | PIC |
| T12 | waktunya belum bisa dipastikan (N4) | the timing can’t be confirmed yet | 时间还无法确定 | `b5-keberatan.jujur`, `b1-datang.janji.alasan` | Pastikan tidak terbaca sebagai janji waktu apa pun. | PIC |
| T13 | petugas layanan klaim / Layanan Klaim | claims service officer / Claims Officer | 理赔服务专员 / 理赔专员 | `pemeran.missRaksa.peran` | Jabatan Miss Raksa kini sama di seluruh UI: "Layanan Klaim" / Claims Officer / 理赔专员 (kamus `tokoh.missRaksa.jabatan`, `shared/brand.ts`, dan naskah cerita; dulu "Raksa CS Icon" / Raksa 客服形象大使 di luar cerita). Sebutan ini usulan tim game: **menunggu konfirmasi PIC** (dan Corporate Communication, karena Miss Raksa ikon perusahaan). | PIC |
| T14 | Bu Rina | Mrs Rina | Rina 女士 | `pemeran.nasabah.nama` dan semua baris | Pola episode uji ("Mrs Uji" / "Uji 女士"). Catatan: "Bu Isti" di kamus UI tidak diterjemahkan; untuk tokoh fiktif dipilih sapaan yang lazim bagi pembaca asing. Sapaan "Bu" dalam ucapan petugas diganti "you" / 您. | PA |
| T15 | minibus keluarga | Family MPV | 家用 MPV | `akt.polis.kartu.kendaraan.nilai` | "Minibus" dalam bahasa Inggris berarti kendaraan belasan kursi; gambar mobil Bu Rina adalah MPV (`seni/mobil.ts`). Data fiktif. | PA |
| T16 | **(revisi 2)** Laporan Tertunda (judul akhir) | Incomplete Report | 报案资料待补充 | `akhir.tertunda.judul` | Revisi 1: EN "Report on Hold" (dalam bahasa asuransi terbaca sebagai klaim yang ditangguhkan penanggung) dan ZH 报案延误 (= **terlambat melapor**, konsep lain yang bisa berdampak pada klaim; padahal Bu Rina melapor di hari yang sama). Kini keduanya berarti "laporan belum lengkap". Pertanyaan untuk PIC: apakah judul Indonesia "Laporan Tertunda" juga bisa terbaca "keterlambatan pelaporan"? Alternatif: "Laporan Belum Lengkap". | PIC, PA |
| T17 | **(revisi 2; revisi 4: tidak lagi di naskah aktif, hanya kunci pensiun)** TLO | TLO (Total Loss Only) | TLO（Total Loss Only） | `akt.polis.bahas.penjelasan` | Kini diurai sekali di pembahasan, seperti subjudul m05 Kartu B "TLO - Total Loss Only (simulasi)". Sebelumnya singkatan ini tidak pernah dijelaskan di episode. | PIC |
| T18 | **(revisi 2)** Didengar dan Jelas (judul akhir) | Heard and Clear | 被倾听，也说清楚了 | `akhir.tuntas.judul` | ZH revisi 1 听得见，说得清: 听得见 berarti "terdengar (suara)", bukan "didengarkan". | PA |
| T19 | catatan simulasi UI cerita | Educational simulation. Real claims follow the policy and Raksa’s **inspection**. | 教学模拟。实际理赔以保单和 Raksa 的**查勘**为准。 | UI `misi.catatanSimulasiPeriksa` (kamus misi, sama dengan latihan misi; di luar naskah episode) | **Sudah diseragamkan**: UI cerita kini memakai `misi.catatanSimulasiPeriksa` (inspection / 查勘, sama dengan `b1-mentor.3` dan `akt.polis.kartu.catatan`); kunci lama `cerita.catatanSimulasi` (assessment / 审核) dihapus. Yang tersisa: istilah "pemeriksaan" itu sendiri (lihat T2). | PIC, PA |
| T20 | **(revisi 4)** Label istilah (N16): nasabah / klaim / polis / Comprehensive / risiko sendiri | customer / claim / policy / Comprehensive / deductible | 客户 / 理赔 / 保单 / Comprehensive / 免赔额 | `istilah.nasabah.label`, `istilah.klaim.label`, `istilah.polis.label`, `istilah.comprehensive.label`, `istilah.risiko-sendiri.label` | Label = kata PERSIS seperti tertulis di baris yang diberi tombol "Apa itu …?" di tiap bahasa (dijaga tes). Pasangan kata sehari-hari di EN/ZH: "insurance customers … report a loss, known as a claim" / 保险客户 … 报告损失 … 理赔; "cover documents: her policy card" / 保障文件的摘要：保单卡. | PIC, PA |
| T21 | **(revisi 4)** data asuransi (pengecoh urutan) | insurance details | 保险资料 | `b1-datang.prosedur` | Menggantikan "nomor polis" / policy number / 保单号. | PA |

Catatan untuk penutur asli (bukan materi klaim):
- Label suasana: Tenang / Mulai tenang / Cemas / Kesal = Calm / Calming down / Worried / Annoyed = 平静 / 渐渐平静 /
  担心 / 恼火.
- Judul akhir: Heard and Clear / Brief Relief / Right, but Distant / Incomplete Report / The Customer Leaves =
  被倾听，也说清楚了 / 一时的安心 / 做对了，却有距离 / 报案资料待补充 / 客户走了.
- `akhir-pergi.6` ZH (revisi 2): 让她离开的，是固执己见 (impersonal, seperti ID "Yang membuatnya pergi adalah
  bertahan"); revisi 1 让她离开的，是你不肯改口 menambah "你" sehingga langsung menyalahkan pemain.
- "Kotak katering" = catering boxes / 盒饭 (nasi kotak); "adik" (gender tidak disebut di naskah Indonesia) diterjemahkan
  "sister" / 妹妹; "bagasi" = boot / 后备箱; "lampu belakang" = rear light / 尾灯 (label adegan memakai "Bumper & lamp").
- Pengecoh bukti (revisi 3): "Foto dekat ban depan" = Close-up of the front tyre / 前轮近照 (label adegan "Front tyre" /
  前轮; "tyre" ejaan Britania); "Foto dasbor dari jendela" = Photo of the dashboard through the window / 透过车窗拍的仪表盘
  (label adegan "Dashboard" / 仪表盘).

## K. Pemulihan (ralat) dan efeknya

Yang perlu ditinjau bukan hanya kalimatnya, tetapi juga **apa yang diajarkan efeknya**. Semua hasil di bagian ini
diperiksa dengan mesin cerita sungguhan (tes `episode.test.ts`, 26 September 2026, revisi 2).

**Kapan `ralat-polis` muncul.** Hanya bila di aktivitas kartu polis pemain memilih distraktor `pasti-diganti`, lalu
Bu Rina di `b5-keberatan` menagih: "Tadi katanya pasti diganti. Jadi besok mobil saya sudah bisa dipakai, kan?"
(`b5-keberatan.1`). Pada jalur ini `ralat-janji` tidak ditawarkan (`ralat-janji` hanya untuk janji di awal
percakapan ketika kartu sudah dibaca tepat). Pilihan lain di node yang sama: `janjikan` (menjanjikan besok) dan
`aturan-janji` (menyuruh membaca kartu sendiri).

**Kalimat petugas** (`b5-keberatan.ralat-polis`, revisi 4): "Maaf, saya keliru: kerusakannya dinilai dulu sesuai
syarat, bukan pasti diganti. Waktunya belum pasti, dan sebagian kerugian tetap Ibu tanggung." (Revisi 2: "Maaf, Bu,
saya keliru soal kartu tadi: …"; dipersingkat supaya pilihan 8-20 kata, isinya sama.)

**Efek di permainan:**

| Aspek | Akibat |
| --- | --- |
| Suasana nasabah | Kepercayaan turun sedikit (-1; angka tidak pernah ditampilkan), dengan alasan: "Bu Rina kecewa kabarnya berubah, tapi kini ia paham isi kartunya dan tahu keadaan yang sebenarnya." |
| Reaksi berikutnya (`b5-tutup.3`) | "Kok jadi berubah... Ya sudah. Lebih baik saya tahu sekarang daripada besok." |
| Janji | Semua janji dicabut (`janji-awal`, `janji-polis`, `janji-waktu`), jadi jalur ini tidak lagi otomatis berakhir "Lega Sesaat" |
| Yang dipahami nasabah | **(revisi 2)** Kerusakan dinilai sesuai syarat kartu (bukan pasti diganti) dan risiko sendiri. **Bukan** "langkah berikutnya": kalimat ralat tidak menyebut urutan langkah. Butir itu baru tercapai bila pemain kemudian merangkum (`b5-tutup.rangkum`). Revisi 1 keliru menandai "langkah berikutnya" sudah dipahami di sini. |
| Ringkasan "Ketepatan langkah klaim" | "Membaca kartu polis dengan tepat" dan "Tidak menjanjikan hasil atau waktu" = **Diperbaiki** (bukan Tepat) |
| Akhir | Bila pemain lalu merangkum dan kepercayaan masih cukup: **"Didengar dan Jelas"**. Bu Rina berkata "Terima kasih sudah mau meluruskan. Sekarang saya jadi tahu harus apa." (`akhir-tuntas.6`, revisi 2), bukan "Terima kasih sudah jelas dari awal" (`akhir-tuntas.2`, kini hanya untuk jalur tanpa ralat). Mentor: "Meluruskan janji itu tidak enak, {nama}, tapi karena itulah ia bisa percaya." (`akhir-tuntas.4`). Bila ditutup "nanti dikabari": **"Benar, tapi Berjarak"**, dan mentor menunjuk penutupnya (`akhir-dingin.6`). |

Hasil mesin (revisi 2): dengar → dokumentasi → tiga bukti tepat → `pasti-diganti` → `ralat-polis` → `rangkum` =
"Didengar dan Jelas"; jalur yang sama dengan `singkat` = "Benar, tapi Berjarak"; prosedur → tetap → … →
`ralat-polis` → `rangkum` = "Benar, tapi Berjarak" (kepercayaan kurang); janji → … → `pasti-diganti` →
`ralat-polis` → `rangkum` = "Didengar dan Jelas".

**Ralat lain dengan pola yang sama** (semuanya berakhir baik hanya bila ditutup dengan ringkasan):

| Kunci | Kalimat | Catatan |
| --- | --- | --- |
| `b5-keberatan.ralat-janji` | (lihat bagian E) | Meluruskan janji "besok pasti bisa dipakai". Memasang pemahaman risiko sendiri, bukan langkah berikutnya. |
| `akhir-tuntas.4` | Meluruskan janji itu tidak enak, {nama}, tapi karena itulah ia bisa percaya. | Pesan mentor setelah ralat janji/kartu. |
| `akhir-tuntas.6` (revisi 2) | Terima kasih sudah mau meluruskan. Sekarang saya jadi tahu harus apa. | Tampil pada jalur yang sempat keliru lalu diluruskan: minta maaf di awal (`b1-pulih.maaf`), meralat saran bengkel/"tidak usah klaim", membaca ulang kartu, atau meralat janji. |
| `akhir.janji.pelajaran.3` | Terlanjur berjanji? Luruskan secepatnya. Tidak enak sekarang lebih ringan daripada kecewa nanti. | Pelajaran akhir "Lega Sesaat"; berkaitan langsung dengan pertanyaan K.2. |

**Pertanyaan untuk PIC Claim:**

1. Apakah meralat sendiri di depan nasabah ("saya keliru soal kartu tadi") adalah respons yang Raksa harapkan dari
   petugas layanan setelah salah menjelaskan jaminan? Kalimatnya sudah tepat?
2. Apakah pantas jalur yang sempat menjanjikan "pasti diganti" masih bisa berakhir baik bila diralat dan ditutup
   dengan ringkasan (ringkasan menandai "Diperbaiki"), atau ralat seperti ini seharusnya tetap berakhir campuran?
3. Dalam praktik, apakah petugas perlu melakukan hal lain setelah salah menjelaskan (mis. mencatat atau melapor ke
   atasan)? Naskah **tidak** menyebut langkah tambahan apa pun; bila ada, mohon disebutkan agar tidak dikarang.

## M. Efek graf yang ikut mengajarkan (revisi 2)

Keputusan berikut tidak berupa kalimat baru, tetapi menentukan apa yang ditandai "Sudah paham" / "Tepat" di
layar akhir, jadi ikut ditinjau.

| Keputusan | Akibat di permainan | Alasan |
| --- | --- | --- |
| Butir kejelasan "langkah berikutnya" (`paham.langkah-berikut`) **hanya** dari penutup `b5-tutup.rangkum`, dan hanya bila ringkasan itu diterima | Jawaban jujur/ralat di `b5-keberatan` tidak lagi memasangnya. Menutup dengan "nanti dikabari" tidak pernah berakhir "Didengar dan Jelas". Bila janji masih berlaku, Bu Rina menanggapi ringkasan dengan janji lamanya (`b5-rangkum.2`, `b5-rangkum.3`). Bila saran "langsung ke bengkel" dibiarkan, ia menanyakan rencana bengkelnya (`b5-rangkum.4`). Pada kedua jalur itu butir ini tidak dipasang. | Revisi 1: penutup "nanti dikabari" setelah jawaban jujur tetap berakhir baik dan menandai "Sudah paham: langkah berikutnya"; pilihan penutup (keputusan K4) tidak berakibat. |
| `b5-keberatan.aturan` tanpa janji sebelumnya → "Tidak menjanjikan hasil atau waktu" = **Tepat**; dengan janji lama yang masih berlaku (`b5-keberatan.aturan-janji`) → tetap **Keliru** | Jalur "Benar, tapi Berjarak" kini menampilkan empat langkah klaim tepat, dan komunikasinya yang buruk tercermin di suasana nasabah. | Revisi 1 menampilkan "Tidak tersentuh" padahal pemain tidak menjanjikan apa pun. Lihat I.11. |
| Kartu polis tercatat di Catatan kasus setelah aktivitas kartu dinilai, **apa pun** pilihannya | Di `b4-polis-salah` ("baca lagi baris Kerusakan benturan") dan saat `ralat-polis`, pemain bisa membuka ulang kartunya. Yang ditampilkan isi kartu, bukan tafsiran pemain. | Revisi 1 hanya mencatatnya bila penjelasan pertama tepat. |
| `b3-bukti-kurang.lengkapi` → adegan `b3-lengkapi` (foto yang terlewat ditambahkan, Catatan kasus "Foto dilengkapi …"); `b3-bukti-kurang.cukup` → adegan `b3-cukup` (Bu Rina lega, Miss Raksa menyebut akibatnya) | Dua pilihan kini punya kelanjutan yang berbeda dan terlihat. | Revisi 1: keduanya langsung ke meja polis dengan kalimat yang sama. |
| Baris kartu polis tanpa label "? info" | Tidak ada chip yang tampak seperti tombol bantuan. Flag ok/no tetap tidak dipakai (akan membocorkan jawaban). | Tinjauan ux-cerita. |

## R. Ringkasan perubahan revisi 2 (untuk PIC yang sudah membaca revisi 1)

| Perubahan | Kunci | Bagian |
| --- | --- | --- |
| "perbaikan setelah koordinasi" → "langkah perbaikan mengikuti hasil penilaian" | `b5-tutup.rangkum`, `paham.langkah-berikut` | F, I.2 |
| "bisa diajukan dan dinilai" → "bisa dilanjutkan untuk dinilai" (m05) | `akt.polis.opsi.bisa-dinilai`, `paham.polis-dinilai`, `akt.polis.ringkasan`, `akt.polis.bahas.penjelasan`, `b4-polis.hasil.1.1`, `b4-polis.hasil.1.alasan`, `b4-polis-salah.baca-ulang`, `b5-keberatan.ralat-polis` | D, I.6 |
| Distraktor TLO: soal jaminan, bukan hak mengajukan; TLO diurai | `akt.polis.opsi.ambang-tlo`, `akt.polis.bahas.penjelasan` | D, G, I.7 |
| Distraktor "pasti diganti" berangkat dari salah baca kartu | `akt.polis.opsi.pasti-diganti` | G |
| "ada risiko sendiri" → "ada risiko sendiri bila tercantum di polis" | `akhir.tuntas.pelajaran.3` | E |
| Kalimat baru jalur lengkapi/cukup | `b3-lengkapi.1`, `b3-lengkapi.2`, `b3-cukup.1`, `b3-cukup.2`, `catatan.bukti-lengkap`, `catatan.bukti-kurang` | C, M |
| Tanggapan atas ringkasan (janji/saran bengkel) & pertanyaan nasabah jalur bengkel | `b5-rangkum.1`, `b5-rangkum.2`, `b5-rangkum.3`, `b5-rangkum.4`, `b5-keberatan.8` | B, D, F, M |
| Terima kasih "sudah mau meluruskan" di jalur ralat | `akhir-tuntas.6` | K |
| Pesan mentor & reaksi khusus penutup | `akhir-dingin.6`, `akhir-tertunda.7` | C, F |
| Jawaban terbaik dipersingkat / distraktor diberi alasan yang masuk akal (supaya pilihan tidak bisa ditebak dari panjangnya) | `b4-polis-salah.bertahan`, `b4-polis-salah.baca-ulang`, `b5-keberatan.janjikan`, `b5-keberatan.aturan`, `b5-keberatan.aturan-janji`, `b5-keberatan.ralat-polis`, `b5-tutup.singkat`, `b5-tutup.rangkum.alasan` | D, G |
| Judul akhir EN/ZH, dua baris ZH | `akhir.tertunda.judul`, `akhir.tuntas.judul`, `akhir-pergi.6` | J |
| Kunci bermateri klaim yang belum tercantum di revisi 1 kini tercantum | `proses.tanpa-janji`, `b2-saran.bengkel.alasan`, `b2-bengkel-akibat.biarkan.alasan`, `b3-bukti-kurang.lengkapi.alasan`, `b3-bukti-kurang.cukup.alasan`, `b1-pulih.2`, `akhir.tuntas.pelajaran.1`, `akt.bukti.briefing`, `akt.polis.instruksi`, `akt.polis.petunjuk`, `b4-polis-tepat.3`, `akhir-janji.5`, `akhir.janji.pelajaran.3`, UI `cerita.catatanSimulasi` | A–G, K |

## R3. Ringkasan perubahan revisi 3

| Perubahan | Kunci | Bagian |
| --- | --- | --- |
| Pengecoh bukti "Swafoto di depan mobil" → **"Foto dekat ban depan"**, "Kucing yang tidur di kap" → **"Foto dasbor dari jendela"** (id opsi `foto-selfie` → `foto-ban`, `foto-kucing` → `foto-dasbor`; adegan 2D: objek di roda depan & kaca pintu depan mobil Bu Rina). Tiga jawaban tepat dan brosur tidak berubah. | `akt.bukti.opsi.foto-ban`, `akt.bukti.opsi.foto-dasbor` | G, N15, I.12 |
| Pembahasan menyebut alasan pengecoh: tidak menunjukkan titik kerusakan di belakang maupun identitas mobil (m02) | `akt.bukti.bahas.bukti` | C, N15 |
| Umpan balik pengecoh: "tidak berkaitan dengan kerusakan" → "tidak menunjukkan titik kerusakan atau identitas mobil" | `b3-bukti.hasil.2.4` | C, N15 |

## R4. Ringkasan perubahan revisi 4 (naskah v2, 26 September 2026)

Tujuan: pemula paham siapa yang dibantu, langkah berikutnya, kenapa tindakannya berpengaruh, dan satu konsep asuransi
(`docs/rancangan-mode-cerita.md` bagian 11). Id node, pilihan, tanda, efek, dan kelima akhir TIDAK berubah (diuji mesin).
Semua kalimat baru/berubah di bawah berstatus **DRAF, belum ditinjau PIC Claim**.

| Perubahan | Kunci | Bagian |
| --- | --- | --- |
| Satu perkenalan peran di awal, kata sehari-hari lebih dulu (pelanggan asuransi → nasabah, laporan kerugian → klaim); masalah Bu Rina kini baris ke-3 (sebelumnya ke-5) | `b1-mentor.1` (baru), `b1-mentor.2` & `b1-mentor.3` (pensiun) | A, P |
| Baris yang mengulang dipangkas: kronologi yang mengulang b1-datang, jawaban singkat yang mengulangnya kata per kata, dan instruksi mentor yang mengulang kartu aktivitas | `b2-cerita.4`, `b2-singkat.1`, `b3-bukti-intro.4` (pensiun); `b2-cerita.5` (kini memuat belanja, foto HP, rencana bengkel) | C, L, P |
| "Polis" diperkenalkan sebagai ringkasan dokumen perlindungan jenis "Comprehensive" saat kartu dibuka; baris mentor di kartu aktivitas tidak lagi mengulang tugas aktivitas (kini: Bu Rina berharap "ya", tetap sampaikan isi kartu) | `b4-polis-intro.1`, `b4-polis-intro.2`, `b4-polis.1` | D |
| Arti lima istilah (tombol "Apa itu …?" di baris pertama pemakaiannya) dan arti awam tiap baris kartu polis | `istilah.*`, `akt.polis.kartu.*.arti` | S |
| Pengecoh kartu ambang 75% / TLO dihapus dari opsi (di luar materi episode; tetap di misi 5), kalimat TLO dihapus dari pembahasan; cabang hasil & reaksinya tetap untuk simpanan lama | `akt.polis.opsi.ambang-tlo` (pensiun), `akt.polis.bahas.penjelasan`, `b4-polis.hasil.4.1`, `b4-polis.hasil.4.alasan` | D, G, P, I.7 |
| Umpan balik foto: per bukti yang terlewat (2.1-2.3) diganti SATU kalimat mentor tentang akibatnya (2.5); rincian foto + alasannya di panel. Kalimat hasil tepat (1.1) tidak lagi mengulang daftar foto | `b3-bukti.hasil.1.1`, `b3-bukti.hasil.2.5` (baru), `b3-bukti.hasil.2.1`-`2.3` (pensiun) | C, P |
| Satu kalimat tugas per aktivitas; tanya / petunjuk / briefing / cerita / label tidak saling mengulang | `akt.bukti.instruksi`, `akt.bukti.tanya`, `akt.bukti.petunjuk`, `akt.bukti.briefing`, `akt.bukti.labelInteraksi`, `akt.polis.instruksi`, `akt.polis.labelInteraksi`, `akt.polis.petunjuk`, `akt.polis.briefing` | C, D, L |
| Alasan singkat per opsi, tampil setelah jawaban dikirim | `akt.bukti.alasan.*`, `akt.polis.alasan.*` | C, D |
| Panjang pilihan diseimbangkan (8-20 kata; yang menolong tidak lagi selalu terpanjang: kini 3 dari 11 titik pilihan, sebelumnya 8 dari 11); makna & akibat tiap pilihan tetap | `b2-ringan-akibat.tetap-ringan`, `b4-polis-salah.bertahan`, `b5-keberatan.janjikan`, `b5-keberatan.aturan`, `b5-keberatan.aturan-janji`, `b5-keberatan.jujur`, `b5-keberatan.ralat-polis`, `b5-tutup.rangkum`, `b5-tutup.singkat`, `akt.polis.opsi.pasti-diganti`, `akt.polis.opsi.tidak-tercakup` | D, E, F, G, K |
| "Nomor polis" di pengecoh urutan → "data asuransi" (istilah polis belum dijelaskan di bab 1) | `b1-datang.prosedur`, `b1-datang.prosedur.alasan` | G, H, I.17 |

## R5. Ringkasan perubahan revisi 5 (adegan v3, 27 September 2026)

Tujuan: ruang layanan terasa sebagai ruang layanan Raksa ("Raksa Silver Club" di papan nama dan dialog, satu nama
dari konfigurasi `Episode.panggung.lokasi`), dan pembuka tidak lagi padat istilah (review lanjutan butir 6). Cue
adegan (masuk, pergi, kartu, pindah lokasi) hanya presentasi: id node, pilihan, tanda, efek, kelima akhir, dan
`versi` episode TIDAK berubah (diuji mesin). Semua kalimat berubah di bawah berstatus **DRAF, belum ditinjau PIC Claim**.

| Perubahan | Kunci | Bagian |
| --- | --- | --- |
| Perkenalan peran jadi satu kalimat peran yang menyebut tempat lewat `{lokasi}` ("Raksa Silver Club"), tanpa istilah nasabah/klaim; "ini simulasi" tetap diucapkan mentor | `b1-mentor.1` (id/en/zh) | A, I.18 |
| Tombol "Apa itu nasabah?" pindah ke narasi pintu ("Seorang nasabah masuk …", sebelumnya "Seorang ibu …"); "Apa itu klaim?" ke ucapan Bu Rina yang kini menambah "Urusan klaim belakangan" (dua baris ini dilewati semua jalur; arti istilah tidak berubah). Tetap bertanda juga di baris lama untuk putar ulang bab | `b1-mentor.4`, `b2-saran.1`, `b2-saran.2` (id/en/zh); `b5-keberatan.8`, `akhir-tertunda.6` | B, S |
| Narasi pintu menyebut tindakan yang terlihat di panggung: "Pintu terbuka. Seorang nasabah masuk tergesa dan menaruh kunci mobilnya di meja." (sebelumnya "…, kunci mobil masih di tangan."; di adegan v3 kunci berakhir di meja). Label lokasi aktivitas polis memakai nama ruang yang sama: "Meja Layanan {lokasi}" (sebelumnya "Meja Layanan Kantor Raksa") | `b1-mentor.4`, `akt.polis.lokasi` (id/en/zh) | - (bukan materi klaim) |
| Pilihan menolong di bab 1 tidak lagi mempersilakan duduk (di adegan v3 Bu Rina sudah duduk saat masuk): "Silakan duduk dulu, ceritakan dari awal" → "Tarik napas dulu, lalu ceritakan dari awal"; makna, efek, dan alasan tetap | `b1-datang.dengar` (id/en/zh) | - (bukan materi klaim) |
| Parameter teks baru `{lokasi}` (diisi otomatis dari konfigurasi panggung; tidak ada kalimat lain yang memakainya) | `b1-mentor.1` | A |

## N. Kartu akhir v2 (revisi 4, 26 September 2026): DRAF, belum ditinjau PIC Claim

Layar akhir kini menampilkan SATU kartu: judul hasil dari sisi Bu Rina, satu kalimat sebab-akibat, dan satu
pelajaran 15-25 kata (kontrak: `docs/rancangan-mode-cerita.md` bagian 11). Kalimat dipilih dari keputusan nyata
lewat aturan `KARTU_AKHIR` di `episode.ts` (urutan aturan = urutan epilog, jadi kartu tidak bertentangan dengan
epilog). Semua kalimat di bawah **BARU**, tetapi isinya hanya merangkum epilog, pelajaran akhir, dan efek jalur
yang sudah ada di bagian B-F dan K; tidak ada batas, biaya, tenggat, cakupan, atau prosedur Raksa baru.

Hal yang perlu dicek PIC Claim:
- "“Tercakup sesuai syarat” berarti kerusakan dinilai dulu, bukan otomatis diganti" (`kartu.tuntas-jelas.pelajaran`,
  `kartu.janji-polis.pelajaran`): turunan m05 + N10.
- "Waktu dan hasil klaim mengikuti polis dan pemeriksaan" (`kartu.janji-besok.pelajaran`): turunan catatan simulasi
  dan `akhir.janji.pelajaran.2`.
- "Kondisi kerusakan yang sudah diperbaiki tidak bisa dilihat lagi oleh pemeriksa" (`kartu.tertunda-bengkel.pelajaran`):
  turunan m01 + `akhir.tertunda.pelajaran.2`.

| Kunci | Kalimat | Dipakai untuk | Sumber | Jenis |
| --- | --- | --- | --- | --- |
| `kartu.tuntas.judul` | Bu Rina tahu langkah berikutnya | Judul hasil, akhir `tuntas` | Ringkasan epilog | BARU |
| `kartu.janji-waktu.judul` | Bu Rina kecewa setelah dijanjikan besok beres | Judul hasil, akhir `janji` | Ringkasan epilog | BARU |
| `kartu.janji-polis.judul` | Bu Rina kecewa setelah dijanjikan pasti diganti | Judul hasil, akhir `janji` | Ringkasan epilog | BARU |
| `kartu.dingin-singkat.judul` | Bu Rina pulang belum tahu harus apa | Judul hasil, akhir `dingin` | Ringkasan epilog | BARU |
| `kartu.dingin-aturan.judul` | Bu Rina pulang belum paham semuanya | Judul hasil, akhir `dingin` | Ringkasan epilog | BARU |
| `kartu.dingin-jarak.judul` | Bu Rina paham, tetapi belum tenang | Judul hasil, akhir `dingin` | Ringkasan epilog | BARU |
| `kartu.tertunda.judul` | Laporan Bu Rina perlu dilengkapi belakangan | Judul hasil, akhir `tertunda` | Ringkasan epilog | BARU |
| `kartu.pergi.judul` | Bu Rina pergi sebelum urusannya jelas | Judul hasil, akhir `pergi` | Ringkasan epilog | BARU |
| `kartu.tuntas-ralat-janji.sebab` | Kamu meluruskan janji yang belum pasti, jadi Bu Rina bisa menyiapkan rencana lain untuk pesanannya besok. | Sebab, aturan `tuntas-ralat-janji` | Epilog & efek jalur | BARU |
| `kartu.tuntas-ralat-janji.pelajaran` | Meluruskan janji memang tidak enak, tetapi informasi yang bisa dipercaya membantu nasabah mengatur rencananya sendiri. | Pelajaran, aturan `tuntas-ralat-janji` | pelajaran akhir yang ada | BARU |
| `kartu.tuntas-baca-ulang.sebab` | Kamu mengakui salah baca dan menjelaskan isi kartunya, jadi Bu Rina kembali percaya dan tahu langkah berikutnya. | Sebab, aturan `tuntas-baca-ulang` | Epilog & efek jalur | BARU |
| `kartu.tuntas-baca-ulang.pelajaran` | Salah baca bisa terjadi; mengakuinya lalu menjelaskan isi kartu apa adanya membuat nasabah kembali percaya. | Pelajaran, aturan `tuntas-baca-ulang` | m05 / pelajaran akhir yang ada | BARU |
| `kartu.tuntas-ralat-saran.sebab` | Kamu meluruskan saranmu sebelum mobil diperbaiki, jadi kerusakannya sempat difoto dan dilaporkan dulu. | Sebab, aturan `tuntas-ralat-saran` | Epilog & efek jalur | BARU |
| `kartu.tuntas-ralat-saran.pelajaran` | Dokumentasi dan laporan sebelum perbaikan menjaga kondisi kerusakan tetap bisa diperiksa, walau nasabah sedang terburu-buru. | Pelajaran, aturan `tuntas-ralat-saran` | m01 / pelajaran akhir yang ada | BARU |
| `kartu.tuntas-lengkapi.sebab` | Kamu melengkapi foto yang terlewat sebelum Bu Rina pergi, jadi laporannya memuat tiga bukti yang dibutuhkan. | Sebab, aturan `tuntas-lengkapi` | Epilog & efek jalur | BARU |
| `kartu.tuntas-lengkapi.pelajaran` | Seluruh mobil, detail kerusakan, dan plat nomor: melengkapi foto sekarang lebih ringan daripada meminta nasabah datang lagi. | Pelajaran, aturan `tuntas-lengkapi` | m02 / pelajaran akhir yang ada | BARU |
| `kartu.tuntas-pulih.sebab` | Awalnya Bu Rina tegang, tetapi kamu minta maaf dan mendengarkan, jadi ia pulang tahu langkah berikutnya. | Sebab, aturan `tuntas-pulih` | Epilog & efek jalur | BARU |
| `kartu.tuntas-pulih.pelajaran` | Terlalu cepat ke prosedur bisa diperbaiki: akui, tanyakan keadaan nasabah, lalu jelaskan langkahnya dengan jujur. | Pelajaran, aturan `tuntas-pulih` | pelajaran akhir yang ada | BARU |
| `kartu.tuntas-jelas.sebab` | Mobilnya belum bisa langsung beres, tetapi Bu Rina tahu apa yang terjadi berikutnya dan menyiapkan rencana lain. | Sebab, aturan `tuntas-jelas` | Epilog & efek jalur | BARU |
| `kartu.tuntas-jelas.pelajaran` | Foto dan laporan membantu pemeriksaan, dan “tercakup sesuai syarat” berarti kerusakan dinilai dulu, bukan otomatis diganti. | Pelajaran, aturan `tuntas-jelas` | m05 / pelajaran akhir yang ada | BARU |
| `kartu.janji-besok.sebab` | Bu Rina mengandalkan ucapanmu bahwa besok selesai, padahal waktunya belum bisa dipastikan. | Sebab, aturan `janji-besok` | Epilog & efek jalur | BARU |
| `kartu.janji-besok.pelajaran` | Menenangkan nasabah perlu disertai informasi yang bisa dipercaya; waktu dan hasil klaim mengikuti polis dan pemeriksaan. | Pelajaran, aturan `janji-besok` | pelajaran akhir yang ada | BARU |
| `kartu.janji-awal.sebab` | Bu Rina mengandalkan janjimu di awal bahwa besok mobilnya bisa dipakai, padahal waktunya belum bisa dipastikan. | Sebab, aturan `janji-awal` | Epilog & efek jalur | BARU |
| `kartu.janji-awal.pelajaran` | Janji yang belum pasti sebaiknya diluruskan sebelum nasabah pergi; kabar tidak enak sekarang lebih ringan daripada kecewa nanti. | Pelajaran, aturan `janji-awal` | pelajaran akhir yang ada | BARU |
| `kartu.janji-polis.sebab` | Bu Rina mengandalkan ucapanmu bahwa kerusakannya pasti diganti, padahal kartu hanya menulis tercakup sesuai syarat. | Sebab, aturan `janji-polis` | Epilog & efek jalur | BARU |
| `kartu.janji-polis.pelajaran` | “Tercakup sesuai syarat” berarti kerusakan dinilai dulu; sampaikan isi kartu apa adanya, bukan hasil yang belum pasti. | Pelajaran, aturan `janji-polis` | m05 / pelajaran akhir yang ada | BARU |
| `kartu.dingin-singkat.sebab` | Laporannya tercatat, tetapi “nanti dikabari” belum menjawab apa yang perlu Bu Rina lakukan setelah ini. | Sebab, aturan `dingin-singkat` | Epilog & efek jalur | BARU |
| `kartu.dingin-singkat.pelajaran` | Tutup layanan dengan ringkasan langkah berikutnya dan siapa yang akan mengabari, supaya nasabah pulang dengan jelas. | Pelajaran, aturan `dingin-singkat` | pelajaran akhir yang ada | BARU |
| `kartu.dingin-aturan.sebab` | Bu Rina disuruh membaca kartu sendiri, jadi ia pulang belum paham kenapa sebagian kerugian tetap ia tanggung. | Sebab, aturan `dingin-aturan` | Epilog & efek jalur | BARU |
| `kartu.dingin-aturan.pelajaran` | Menunjuk aturan tanpa menjelaskan membuat nasabah merasa sendirian; jelaskan risiko sendiri dengan kata-kata yang sederhana dan jujur. | Pelajaran, aturan `dingin-aturan` | m09 / pelajaran akhir yang ada | BARU |
| `kartu.dingin-awal.sebab` | Bu Rina paham langkahnya, tetapi sejak awal ia merasa hanya dianggap formulir, jadi ia belum tenang. | Sebab, aturan `dingin-awal` | Epilog & efek jalur | BARU |
| `kartu.dingin-awal.pelajaran` | Tanyakan keadaan dan kebutuhan nasabah lebih dulu; langkah yang tepat lebih mudah diterima bila ia merasa didengar. | Pelajaran, aturan `dingin-awal` | pelajaran akhir yang ada | BARU |
| `kartu.dingin-ralat.sebab` | Bu Rina paham langkahnya, tetapi penjelasan yang sempat berubah membuatnya belum sepenuhnya tenang. | Sebab, aturan `dingin-ralat` | Epilog & efek jalur | BARU |
| `kartu.dingin-ralat.pelajaran` | Penjelasan yang tepat sejak awal lebih menenangkan daripada ralat; bila keliru, meluruskannya tetap lebih baik daripada dibiarkan. | Pelajaran, aturan `dingin-ralat` | pelajaran akhir yang ada | BARU |
| `kartu.dingin-jarak.sebab` | Bu Rina paham langkahnya, tetapi ia belum merasa cukup didengar selama percakapan. | Sebab, aturan `dingin-jarak` | Epilog & efek jalur | BARU |
| `kartu.dingin-jarak.pelajaran` | Langkah yang tepat perlu disampaikan dengan cara yang membuat nasabah merasa didengar, bukan sekadar diberi tahu. | Pelajaran, aturan `dingin-jarak` | pelajaran akhir yang ada | BARU |
| `kartu.tertunda-bengkel.sebab` | Mobil Bu Rina diperbaiki saat buktinya baru foto seadanya, jadi kondisi awalnya tidak bisa difoto ulang untuk melengkapi laporan. (Diperbaiki setelah tinjauan internal: di jalur ini laporan memang dibuat dari foto HP seadanya, `b3-seadanya.2`.) | Sebab, aturan `tertunda-bengkel` | Epilog & efek jalur | BARU |
| `kartu.tertunda-bengkel.pelajaran` | Foto dan lapor dulu sebelum perbaikan; kondisi kerusakan yang sudah diperbaiki tidak bisa dilihat lagi oleh pemeriksa. | Pelajaran, aturan `tertunda-bengkel` | m01 / pelajaran akhir yang ada | BARU |
| `kartu.tertunda-foto.sebab` | Foto yang terlewat tidak ikut di laporan, jadi Bu Rina perlu meluangkan waktu lagi untuk melengkapinya. | Sebab, aturan `tertunda-foto` | Epilog & efek jalur | BARU |
| `kartu.tertunda-foto.pelajaran` | Seluruh mobil, detail kerusakan, dan plat nomor: menambah foto yang kurang saat itu juga menghemat waktu nasabah. | Pelajaran, aturan `tertunda-foto` | m02 / pelajaran akhir yang ada | BARU |
| `kartu.pergi-sepele.sebab` | Bu Rina merasa masalahnya diremehkan sebelum mobilnya dilihat, jadi ia memilih mengurusnya sendiri. | Sebab, aturan `pergi-sepele` | Epilog & efek jalur | BARU |
| `kartu.pergi-sepele.pelajaran` | Kerusakan dinilai setelah dilihat dan dicatat, bukan dari cerita; dengarkan dan periksa dulu sebelum menyimpulkan apa pun. | Pelajaran, aturan `pergi-sepele` | m01 / pelajaran akhir yang ada | BARU |
| `kartu.pergi-bertahan.sebab` | Kamu bertahan pada bacaan kartu yang tidak sesuai tulisannya, jadi Bu Rina berhenti percaya pada penjelasanmu. | Sebab, aturan `pergi-bertahan` | Epilog & efek jalur | BARU |
| `kartu.pergi-bertahan.pelajaran` | Salah baca bisa terjadi; mengakui lalu membaca ulang kartu lebih menjaga kepercayaan nasabah daripada bertahan pada jawaban. | Pelajaran, aturan `pergi-bertahan` | m05 / pelajaran akhir yang ada | BARU |


## S. Istilah di tempat & arti kartu polis (BARU, revisi 4): DRAF, belum ditinjau PIC Claim

Istilah dijelaskan saat pertama muncul lewat tombol "Apa itu …?" di kotak dialog (tanpa hover, tanpa halaman
glosarium); baris kartu polis bisa diketuk/ditekan untuk artinya saat menjawab. Semua arti di bawah **BARU** dan hanya
memakai materi m01/m02/m05/m09 + catatan simulasi: tidak ada janji persetujuan, pembayaran penuh, tanggal perbaikan,
ambang, biaya, tenggat, cakupan, atau prosedur Raksa baru. Baris yang diberi tombol: `b4-polis-intro.1` /
`b4-polis-intro.2` (polis, Comprehensive), `b4-polis-tepat.1` / `b5-keberatan.4` / `b5-keberatan.7` (risiko sendiri;
mana yang tampil lebih dulu bergantung jalur, dijaga tes), dan sejak **revisi 5** `b1-mentor.4` (nasabah; narasi pintu
saat Bu Rina masuk) serta `b2-saran.1` / `b2-saran.2` (klaim; ucapan Bu Rina "Urusan klaim belakangan", tepat sebelum
dua pilihan pemain yang juga memakai kata "klaim"). Sebelumnya keduanya di `b1-mentor.1`, yang kini tidak memakai
istilah (review lanjutan butir 6). Kedua baris baru dilewati SEMUA jalur, jadi pemula selalu bisa membuka artinya
sebelum bab 3 (dijaga tes "v3 istilah inti"). `b5-keberatan.8` (klaim) dan `akhir-tertunda.6` (nasabah) tetap bertanda
untuk pemain yang memutar ulang bab dari tengah. Arti tidak berubah.

| Kunci | Kalimat | Sumber | Jenis | Status |
| --- | --- | --- | --- | --- |
| `istilah.nasabah.label` / `istilah.nasabah.arti` | nasabah: Pelanggan asuransi, yaitu orang yang dilindungi asuransi. Di cerita ini: Bu Rina. | Tinjauan pemula ("nasabah" → "pelanggan asuransi") | **BARU (N16)** | perlu konfirmasi PIC Claim |
| `istilah.klaim.label` / `istilah.klaim.arti` | klaim: Laporan kerugian dari nasabah kepada perusahaan asuransi. Hasilnya mengikuti dokumen perlindungannya (polis) dan pemeriksaan. | m01 (laporkan kejadian) + catatan simulasi ("mengikuti polis dan pemeriksaan") | **BARU (N16)** | perlu konfirmasi PIC Claim |
| `istilah.polis.label` / `istilah.polis.arti` | polis: Dokumen yang menjelaskan perlindungan dan syarat asuransi. Kartu polis meringkas isinya. | Tinjauan pemula ("dokumen yang menjelaskan perlindungan dan syarat asuransi") + m05 (kartu polis) | **BARU (N16)** | perlu konfirmasi PIC Claim |
| `istilah.comprehensive.label` / `istilah.comprehensive.arti` | Comprehensive: Jenis polis Bu Rina di simulasi ini. Pada kartunya, kerusakan benturan termasuk yang dilindungi, sesuai syarat kartu. | m05 Kartu Polis A ("Comprehensive (simulasi)", "Kerusakan benturan: Tercakup sesuai syarat kartu"); sengaja TANPA definisi umum produk (I.15) | **BARU (N16)** | perlu konfirmasi PIC Claim |
| `istilah.risiko-sendiri.label` / `istilah.risiko-sendiri.arti` | risiko sendiri: Bagian kerugian yang tetap ditanggung nasabah sendiri. Besarnya sesuai ketentuan polis. | m09 (konsep) + N1 | **BARU (N1, N16)** | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.sub.arti` (subjudul "Comprehensive (simulasi)") | Nama jenis polis ini (simulasi). Apa saja yang dilindungi dibaca dari baris-baris kartu di bawahnya. | m05 | **BARU (N17)** | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.kendaraan.arti` | Mobil yang dilindungi kartu ini. Foto plat nomor memastikan mobil yang diperiksa memang mobil ini. | m02 (foto identitas) | **BARU (N17)** | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.benturan.arti` | Kerusakan karena benturan, misalnya disenggol, termasuk yang dilindungi. "Sesuai syarat kartu" berarti dinilai dulu, bukan otomatis diganti. | m05 ("dapat dilanjutkan untuk penilaian") + N10 | **BARU (N17)** | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.status.arti` | Aktif berarti perlindungan di kartu ini sedang berlaku. | m05 ("Status polis: Aktif", "asumsikan polis aktif") | **BARU (N17)** | perlu konfirmasi PIC Claim |
| `akt.polis.kartu.risiko.arti` | Bagian kerugian yang tetap ditanggung Bu Rina sendiri. Besarnya mengikuti ketentuan polis, tidak tertulis di kartu ini. | m09 + N1, N9 | **BARU (N1, N17)** | perlu konfirmasi PIC Claim |

## P. Kunci pensiun (revisi 4)

Kunci di bawah ini tidak dipakai naskah lagi, tetapi TETAP ada di `teks.id.ts` / `teks.en.ts` / `teks.zh.ts` (blok
"PENSIUN", daftar `KUNCI_PENSIUN`) supaya Riwayat dan hasil aktivitas dari progres yang tersimpan sebelum revisi 4
tetap terbaca (versi episode tidak dinaikkan; `simpan.ts` menjepit posisi baris saat memuat). Tidak perlu ditinjau
ulang; kalimatnya sama dengan revisi sebelumnya.

| Kunci | Kalimat terakhir | Alasan dipensiunkan |
| --- | --- | --- |
| `b1-mentor.2` | Tugas kita: dengarkan nasabah, kumpulkan info dan bukti, lalu jelaskan langkah berikutnya. | Peran & tugas diulang di layar lain; masalah Bu Rina harus muncul paling lambat baris ke-3 |
| `b1-mentor.3` | Oh ya, ini simulasi. Klaim sebenarnya tetap mengikuti polis dan pemeriksaan Raksa. | "Ini simulasi" kini di `b1-mentor.1`; catatan simulasi lengkap tetap di kartu polis & layar akhir |
| `b2-cerita.4` | Saya belanja sebentar. Pas balik, bemper sudah penyok dan yang nyenggol sudah pergi. | Mengulang `b1-datang.1` / `b1-datang.2`; "belanja sebentar" pindah ke `b2-cerita.5` |
| `b2-singkat.1` | Disenggol di parkiran pasar tadi pagi. Orangnya pergi. | Mengulang `b1-datang.1` hampir kata per kata |
| `b3-bukti-intro.4` | Tiga foto saja, {nama}. Apa yang perlu dilihat pemeriksa untuk memastikan mobil dan kerusakannya? | Mengulang tugas kartu aktivitas; isinya kini `akt.bukti.petunjuk` |
| `b3-bukti.hasil.2.1`, `b3-bukti.hasil.2.2`, `b3-bukti.hasil.2.3` | (lihat bagian C) | Mengulang alasan per foto yang kini tampil di panel umpan balik (`akt.bukti.alasan.*`); diganti satu kalimat mentor `b3-bukti.hasil.2.5` |
| `akt.polis.opsi.ambang-tlo` | Sesuai syarat kartu, kerusakan ini baru dijamin bila mencapai 75% nilai mobil. | Ambang 75% / TLO di luar materi yang diajarkan episode (misi 5 mengajarkannya); cabang hasil ke-4 dan `b4-polis.hasil.4.1` tetap untuk simpanan lama |

## L. Lampiran: kunci yang tidak menyentuh materi klaim

Kunci di bawah ini tidak memuat pernyataan tentang jaminan, prosedur, bukti, polis, risiko sendiri, atau waktu
klaim. Isinya judul, label, pertanyaan pilihan, ucapan/perasaan nasabah, narasi suasana, atau alasan perubahan
suasana yang murni soal komunikasi. Dicantumkan supaya PIC bisa memastikan tidak ada kalimat bermateri klaim yang
terlewat. Bila PIC menilai salah satunya menyentuh materi klaim, mohon ditandai.

- **Judul, pemeran, bab, suasana:** `ep.judul`, `ep.ringkas`, `pemeran.nasabah.nama`, `pemeran.nasabah.peran`,
  `pemeran.missRaksa.nama`, `bab.menyambut.judul`, `bab.menyambut.tujuan`, `bab.menggali.judul`,
  `bab.menggali.tujuan`, `bab.bukti.judul`, `bab.polis.judul`, `bab.menutup.judul`, `suasana.tenang`,
  `suasana.mulai-tenang`, `suasana.cemas`, `suasana.kesal`.
- **Fakta cerita di Catatan kasus** (kronologi & kebutuhan nasabah): `catatan.masalah`, `catatan.kebutuhan`,
  `catatan.rencana-bengkel`.
- **Pertanyaan di atas pilihan:** `b1-datang.tanya`, `b1-pulih.tanya`, `b2-saran.tanya`, `b2-bengkel-akibat.tanya`,
  `b2-ringan-akibat.tanya`, `b3-bukti-kurang.tanya`, `b4-polis-salah.tanya`, `b5-keberatan.tanya`, `b5-tutup.tanya`.
- **Bab 1 (sambutan, kronologi, empati):** `b1-mentor.4`, `b1-datang.1`, `b1-datang.2`,
  `b1-datang.dengar`, `b1-datang.dengar.alasan`, `b1-pulih.maaf`, `b1-pulih.maaf.alasan`. (`b1-pulih.1`,
  `b1-pulih.tetap`, `b1-pulih.tetap.alasan` dibahas di bagian G dan H; `b1-mentor.1` kini di bagian A, revisi 4.)
- **Bab 2 (cerita nasabah & reaksi):** `b2-cerita.1`, `b2-cerita.2`, `b2-cerita.3`, `b2-cerita.5` (revisi 4: "Tadi saya
  belanja sebentar. Sudah saya foto pakai HP, seadanya; siang ini rencananya langsung ke bengkel."),
  `b2-cerita.6` (nasabah menyebut pecahan lampu yang ia simpan; butir catatannya di bagian B),
  `b2-singkat.2`, `b2-bengkel-akibat.2`, `b2-bengkel-akibat.koreksi.alasan`, `b2-ringan-akibat.1`. (`b2-saran.1` /
  `b2-saran.2` sejak revisi 5 menyebut "Urusan klaim belakangan", jadi ditinjau di bagian B.)
- **Bab 3 (suasana di parkiran):** `b3-bukti-intro.1`, `b3-bukti-intro.3`, `b3-bukti.1`, `b3-bukti-tepat.1`,
  `b3-bukti-tepat.3`, `b3-bukti-kurang.1`, `b3-lengkapi.2`, `b3-cukup.1`.
- **Bab 4 (kembali ke meja, reaksi):** `b4-polis-intro.3`, `b4-polis-intro.4` (`b4-polis-intro.1` / `.2` kini di
  bagian D, revisi 4), `b4-polis-janji.1`, `b4-polis-janji.2`, `b4-polis-salah.2`.
- **Bab 5 (pertanyaan & reaksi nasabah, alasan komunikasi):** `b5-keberatan.1`, `b5-keberatan.2`,
  `b5-keberatan.3`, `b5-keberatan.4`, `b5-keberatan.5`, `b5-keberatan.6`, `b5-keberatan.7`,
  `b5-keberatan.aturan.alasan`, `b5-keberatan.aturan-janji.alasan`, `b5-keberatan.jujur.alasan`,
  `b5-keberatan.ralat-janji.alasan`, `b5-tutup.1`, `b5-tutup.2`, `b5-tutup.3`, `b5-tutup.4`, `b5-tutup.5`.
  (Pertanyaan nasabah soal risiko sendiri, `b5-keberatan.3`, `b5-keberatan.4`, `b5-keberatan.6`,
  `b5-keberatan.7`, tidak memuat pernyataan petugas; jawabannya di bagian E.)
- **Epilog & pesan mentor soal komunikasi:** `akhir-tuntas.2`, `akhir-tuntas.3`, `akhir-tuntas.5`,
  `akhir-janji.1`, `akhir-janji.2`, `akhir-dingin.1`, `akhir-dingin.2`, `akhir-dingin.3`, `akhir-dingin.4`,
  `akhir-dingin.5`, `akhir-pergi.1`, `akhir-pergi.2`, `akhir-pergi.3`, `akhir-pergi.4`, `akhir-pergi.6`.
- **Info akhir (judul, ringkasan, pelajaran komunikasi):** `akhir.tuntas.judul`, `akhir.tuntas.ringkas`,
  `akhir.janji.judul`, `akhir.janji.ringkas`, `akhir.janji.pelajaran.1`, `akhir.dingin.judul`,
  `akhir.dingin.ringkas`, `akhir.dingin.pelajaran.1`, `akhir.dingin.pelajaran.2`, `akhir.tertunda.judul` (lihat
  J.T16), `akhir.pergi.judul`, `akhir.pergi.ringkas`, `akhir.pergi.pelajaran.2`, `akhir.pergi.pelajaran.3`.
- **Label aktivitas (judul, produk, lokasi, label tombol):** `akt.bukti.judul`, `akt.bukti.produk`,
  `akt.bukti.lokasi`, `akt.bukti.cerita`, `akt.bukti.labelInteraksi` (revisi 4: "Foto bukti untuk laporan"), `akt.bukti.kirim` (revisi 4: "Pakai foto ini", tanpa jumlah karena tombol juga aktif saat foto belum 3), `akt.polis.judul`,
  `akt.polis.produk`, `akt.polis.lokasi`, `akt.polis.labelInteraksi` (revisi 4: "Satu penjelasan untuk Bu Rina"), `akt.polis.tanya`, `akt.polis.kirim`.
- **Kunci pensiun (revisi 4):** `b1-mentor.2`, `b1-mentor.3`, `b2-cerita.4`, `b2-singkat.1`, `b3-bukti-intro.4`,
  `akt.polis.opsi.ambang-tlo`: tidak tampil di naskah baru, lihat bagian P.

## Tanda tangan tinjauan

| Peninjau | Tanggal | Keputusan | Catatan |
| --- | --- | --- | --- |
| PIC Claim | | | |
