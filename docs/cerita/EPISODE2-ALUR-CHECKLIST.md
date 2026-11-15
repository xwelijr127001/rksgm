# Episode 2: daftar periksa K01-K15 (14 Nov 2026)

Dibuat dari penelusuran kode (`episode/auto-2/`, `hp/`, `hp/arena/`) dan tangkapan layar build nyata. Status: **Diubah** = ada perubahan pada 14 Nov;
**Tetap** = sudah memenuhi ringkasan tugas dan sengaja tidak diubah perilakunya (hanya tampilan dasar: font/palet `.hp-layar`).
Semua teks antarmuka baru berstatus DRAF (lihat D-69/D-70 di `docs/prd-v02/DECISIONS.md`). Isi kasus = naskah draf, belum disahkan Tim Claim.

| Titik | Tujuan pemain | Bukti yang dibutuhkan | Interaksi utama | Hasil yang terlihat | Komponen | Ketidakpastian isi | Status |
|---|---|---|---|---|---|---|---|
| K01 Kabar pertama | Tenangkan Pak Hendra, mulai klaim | Pesan Pak Hendra; foto truk (lampiran obrolan setelah dibalas) | Pilih satu dari lima balasan, kirim | Reaksi Pak Hendra + catatan status; foto masuk obrolan | `Obrolan`, `PilihBalasan`, lampiran | Gambar foto truk = ilustrasi; 17 butir naskah belum disahkan | Tetap |
| K02 Dokumen | Minta dokumen yang tepat sekarang/menyusul/tidak | "Surat polisi masih diurus" (catatan di tempat) | Satu benda aktif ke tiga baki; ringkasan per baki bisa diubah | Benda terbang ke baki; daftar dokumen jadi pesan terkirim | `ArenaSusun` (gaya baki) | Daftar dokumen wajib = draf | Tetap |
| K03 Menjelaskan | Jelaskan proses sejak awal | Kartu proses 4 tahap di samping balasan | Pilih balasan | Reaksi + status | `PilihBalasan` + `KartuDokumen` | Lama tiap tahap & batas rusak total menunggu konfirmasi (tertulis di kartu) | Tetap |
| K04 Pemeriksaan truk | Tentukan di mana truk diperiksa | Kondisi truk (di pool, tak bisa jalan) | Ketuk tempat di peta | Mas Rudi (potret) pindah ke tempat itu sebelum dikirim | `ArenaTujuan` (peta) | Tanpa waktu tempuh/geografi | Tetap |
| K05 Bengkel penuh | Teruskan foto kerusakan | Foto dari Mas Rudi, bengkel penuh | Ketuk penerima | Foto menempel ke penerima; "Dipilih" | `ArenaTujuan` (teruskan) | Tanpa bukti kerusakan baru | Tetap |
| K06 Kapan keputusan | Jawab kapan keputusan jadi | Kartu linimasa 3 tahap | Pilih balasan | Reaksi + status | `PilihBalasan` + `KartuDokumen` | Tanpa tenggat pasti | Tetap |
| K07 Perlu periksa lapangan | Letakkan pemeriksaan di rencana kerja | Papan rencana (hitungan bengkel berjalan) | Ketuk slot/jalur | Kartu pemeriksaan menempel ke slot pilihan | `ArenaTujuan` (rencana) | Tafsir jalur paralel = naskah | Tetap |
| **K08 Rambu di lokasi** | Periksa dua rambu, tandai lajur, simpulkan | Bunyi rambu 1 dan 2, penomoran lajur, posisi truk (keterangan supir) | Ketuk rambu -> ketuk lajur (ketuk lagi = batal) -> kesimpulan | Tanda arsir/garis di jalan; jalan bertanda terlihat saat menyimpulkan; sesudah kirim: tanggapan Pak Bima atas tanda + akibat naskah | **`ArenaRambu`** (baru), `RingkasRambu`, `lokasi/Adegan` + aset | Tafsir "lajur kiri" BELUM dikonfirmasi (tidak dibandingkan/dinilai); posisi lajur 2 hanya keterangan supir | **Diubah (baru)** |
| K09 Siapa ditanya | Susun rencana wawancara | Peran tiap orang; mobil kecil pergi, tak dikenal | Satu kartu orang ke Wawancarai/Tidak perlu | Rencana berpotret + nama + peran, bisa diubah | `ArenaSusun` (papan) | Tak ada jawaban saksi di naskah (tidak dikarang) | **Diubah** (ringkasan berpotret) |
| K10 Keterangan berbeda | Tentukan cara mencatat tiap perbedaan | Tiga perbedaan beserta catatan buktinya; fakta pokok (dilipat) | Satu cap per perbedaan | Cap menempel di kartu | `ArenaBandingkan` | Ketiadaan di catatan polisi BELUM terkonfirmasi; nama disamarkan; tanpa jawaban klarifikasi | **Diubah** |
| K11 Sebelum Komite | Periksa berkas, pilih tindakan, kabari nasabah | Map pengajuan 6 dari 7 kelompok | Tiga langkah berurutan | Pratinjau pesan; konfirmasi berlabel | `ArenaBundel` (+ meja prototipe `VITE_MEJA_KASUS`) | Surat polisi: status tak konsisten antar-babak (naskah) | Tetap |
| K12 Cicilan & tanggal 20 | Tanggapi beban cicilan | Pesan Pak Hendra (cut-in) | Pilih balasan | Reaksi + status; janji tanggal 20 ditagih di K14 bila diberikan | `Obrolan`, `PilihBalasan` | Tanpa tenggat/angka pembayaran | Tetap |
| K13 Penawaran leasing | Jelaskan surat penawaran | Kartu surat | Pilih balasan | Reaksi + status | `PilihBalasan` + `KartuDokumen` | Isi surat = naskah | Tetap |
| K14 Keberatan | Tanggapi keberatan | Kartu banding | Pilih balasan | Reaksi + status | `PilihBalasan` + `KartuDokumen` | Hasil banding tidak dinyatakan | Tetap |
| K15 Penutup | Susun pesan penutup | Enam bagian pesan | Masukkan/keluarkan bagian | Pratinjau pesan terkirim; akhir dari status | `ArenaPesan` | Tawaran polis/5 bintang = pilihan naskah | Tetap |
| Akhir | Terima hasil | Status akhir 3 tingkat | Lihat ringkasan 15 keputusan; "Coba jalur lain" (ulang bab) | Layar akhir + grafik status | `LayarAkhir` | Klaim selalu dibayar (naskah) | Tetap |

## Dasar visual bersama
Antarmuka HP (`.hp-layar`): Plus Jakarta Sans, hijau hutan/krem/sage/kuning; aset adegan jalan di `lokasi/seni/` (README + lisensi). Chat dan adegan tatap muka
(K01, K03, K06, K12-K14) sengaja tetap dialog pendek, tanpa minigame buatan, sesuai ringkasan tugas.

## Yang tidak diselesaikan / sengaja tidak dilakukan
- Perilaku K02, K04, K05, K07, K11, K15 tidak diubah: pengujian dan tangkapan layar menunjukkan sudah memenuhi ringkasan (satu benda aktif, tujuan terlihat sebelum
  kirim, langkah berurutan, pilihan bisa diganti). Hanya font dan palet yang kini seragam.
- Pertanyaan klarifikasi dari prototipe /kejadian TIDAK digabung ke K10: alternatif naskah tetap lima perlakuan; menggabungkannya menambah aksi di luar naskah.
- Belum diuji di HP fisik dan belum diuji pemain nyata (kenyamanan dan keterlibatan tidak terbukti oleh uji otomatis).

## Pembaruan integrasi desain Claude Design (14 Nov 2026, malam)
- **K02 (Diubah)**: latar ilustrasi kantor Raksa (panel bambu hijau, dinding kuning, ceruk kayu berlampu) kini tampil di belakang close-up meja (`hp.css`, gaya baki). Perilaku susun tidak berubah.
- **K08 (Diubah)**: keadaan tanda lajur bertentangan dengan kesimpulan C memakai teks netral (tampilan saja); keputusan substansi menunggu owner (D-71).
- **Sudah ada di game sebelum integrasi (tidak diubah)**: satu benda aktif + konfirmasi penempatan + Ubah (K02), konteks sebelum memilih dan token tujuan (K04/K05), aset /lokasi dan alur periksa-tandai-simpulkan (K08), pratinjau pesan dengan "Di pesan"/"Masukkan" (K15), Menu/Kembali/Riwayat asli, label bagian 1-4 sesuai pemetaan.
- **Sengaja tidak diadopsi dari prototipe**: "Siapkan balasan" (pengungkapan bertahap) di percakapan; K10 satu persoalan dengan dua kartu sumber berisi angka (data sumber per persoalan tidak ada di naskah); inspeksi dokumen dengan keterangan kosong; panel reviewer; Menu/Kembali placeholder.

## Integrasi desain putaran 2 (14 Nov 2026, malam): adopsi komposisi prototipe Claude Design
Pembanding: rendering game 390 x 844 pada state yang sama (simpanan `titik.json` dari mesin), sebelum dan sesudah. Prototipe tidak bisa
dirender lokal (butuh runtime platform Claude Design); pembanding prototipe = sumber `raksa-ep2-desain-paket/src/*.dc.html`.
Bukti berdampingan: `rksgm-uji-auto01/episode2/bukti/desain-banding/pasangan/`.

| Adegan | Komposisi prototipe | Game sebelum | Selisih | Yang diimplementasikan |
|---|---|---|---|---|
| K01 percakapan | Pesan fokus, pilihan, pratinjau kalimat lengkap sebelum kirim | Lima balasan panjang tetap terbuka sampai kirim | Tidak ada pratinjau; daftar menumpuk | Ketuk balasan = daftar dilipat jadi pratinjau kalimat naskah + "Ganti balasan"; panah keyboard tetap memilih di daftar |
| K02 meja | Meja close-up + latar kantor, dokumen aktif, tiga baki sejajar berlabel + jumlah, konfirmasi dengan Batalkan/Ubah, isi baki bisa dibuka | Tiga kartu baki vertikal besar berpenjelasan, tutorial hijau, catatan surat polisi di atas | Baki raksasa, pengantar padat | Baki ringkas 3 kolom + lencana jumlah; arti baki dilipat; konfirmasi gelap dengan Batalkan + Ubah; "Isi (n)" per baki; catatan atas hanya lewat kartu surat polisi |
| K04/K05 | Papan ilustratif: tempat bergambar, ketuk = lihat, "Pilih" = token, detail terpisah | Lima kartu vertikal, ketuk = langsung memilih | Bukan papan; lihat = pilih | `PapanTujuan`: 5 tempat di papan (bukan peta), detail + "Pilih tujuan ini", token Mas Rudi / foto di tempat terpilih |
| K08 akibat | Satu diagram, potret kecil + satu tanggapan, penjelasan bisa dibuka | Ilustrasi lokasi besar + diagram + dua kartu tanggapan | Ilustrasi & kartu menumpuk | Ilustrasi lokasi tidak ditampilkan di akibat berdiagram; satu tanggapan utama (pertentangan didahulukan) berpotret Pak Bima; sisanya di "Lihat penjelasan" |
| K09 | Papan rencana hijau + kartu kontak berpotret + detail dengan dua pilihan | Satu kartu orang aktif + dua wadah besar | Rencana tidak terlihat sebagai papan | `PapanSaksi`: papan "Rencana wawancara" (label "Belum diwawancarai"), kisi kontak berpotret & status, detail Wawancarai/Tidak perlu (ketuk lagi = batal) |
| K10 | Satu persoalan aktif, ringkasan naskah + catatan bukti, tindakan menempel, ringkasan bisa dibuka | Tiga kartu + laci, pengantar panjang | Semua sekaligus | Tab Perbedaan 1-3, kartu "Ringkasan dari naskah" + "Catatan bukti", cap menempel, "Perbedaan berikutnya", ringkasan pilihan terlipat; kutipan/cerita/fakta pokok dilipat ke "Pesan & info tugas" |
| K11 | Map bertab: tab bernomor, satu lembar terbuka, status di lembar | Ilustrasi map + slot kosong + daftar terlipat | Tidak bertab | `MapBertab`: 7 tab (centang / lingkaran putus), lembar terbuka dengan status naskah; tiga langkah & jawaban tidak berubah |
| K15 | Komposer + pratinjau mudah ditemukan | Draf di atas daftar | Pratinjau jauh dari aksi kirim | Pratinjau dipindah tepat di atas Kirim + tautan "Draf pesan (n) ↓"; label "✓ Ada di pesan" / "+ Masukkan" |

### Adaptasi dengan alasan
- K15: prototipe memakai pratinjau lengket; di game pratinjau TIDAK lengket karena uji aksesibilitas melarang elemen tetap menutupi isi. Gantinya: pratinjau tepat di atas Kirim + tautan lompat.
- K11 di HP <= 400 px: tujuh tab jadi dua baris (4 + 3) agar tiap tab >= 44 px.
- K10: prototipe menampilkan dua slip sumber berisi nilai; naskah hanya punya kalimat ringkas, jadi game menampilkannya sebagai "Ringkasan dari naskah" (bukan kutipan dokumen asli).
- K02: inspeksi dokumen terpisah tidak dibuat; keterangan (hanya SIM dan surat polisi) tampil langsung di kartu karena satu ketukan tambahan tidak menambah informasi.
- Huruf label minimum dinaikkan ke 13 px (uji: >= 12,5 px).

### Belum / terpisah
- D-71 (K08 konflik vs kenaikan status) tetap MENUNGGU OWNER; tidak diubah di putaran ini.
- Panggung percakapan K01 (ilustrasi WhatsApp besar + narasi) tidak dirombak; hanya komposer yang diringkas.

## Ritme Episode 2 (15 Nov 2026): pahami situasi -> bertindak -> lihat respons
Sumber masalah: tujuh screenshot pengguna di `raksa-ep2-flow-review/referensi`. Semua murni tampilan; node, efek mesin, riwayat, draf, dan simpanan tidak berubah.
- **Obrolan (01-03)**: sesi WhatsApp yang dimulai titik keputusan (K01, K06, K12-K14) dibuka dengan gerbang "Tujuan + Mulai percakapan"; tujuan tidak lagi dipajang di atas obrolan. Narasi node kini diringkas ("Hari ke-1, pagi." + "Konteks"). Pesan nasabah baru didahului "sedang mengetik" 750 ms (bisa "Tampilkan"; gerak dikurangi = tanpa indikator; muat ulang = langsung tampil). Pilihan baru terbuka lewat "Balas Pak Hendra" (adegan tatap muka: "Pilih jawabanmu"), lalu pratinjau kalimat lengkap sebelum Kirim. Pemain yang membaca ke atas tidak digulir paksa: penanda "Pesan baru ↓". Potret cut-in diperkecil. Sesi yang dibuka oleh AKIBAT keputusan (mis. K08-D) tidak bergerbang.
- **Penempatan dokumen (04)**: SFX sintetis `taruh` (desis kertas + ketuk kayu lembut, sama untuk semua baki, diredam bila ketukan < 140 ms, mengikuti mute) dari handler ketukan, bukan effect. Angka baki & konfirmasi sudah langsung.
- **Ringkasan dokumen (05)**: tiga kelompok ringkas "Nama (n)", tertutup di awal, paling banyak satu terbuka; total "n dari N dokumen sudah ditempatkan"; tombol kirim tepat di bawah.
- **Kartu proses (06)**: dokumen `proses` dan `linimasa` (`DokumenCerita.tahapan`) tampil sebagai gambaran tahap + satu kartu "Tahap n dari N" + sebelumnya/berikutnya; tanpa carousel otomatis; catatan ketidakpastian tetap terlihat; `proses` diberi keterangan "urutan penjelasan, bukan jadwal" karena K07 naskah mendukung pemeriksaan bersamaan dengan hitungan.
- **K07 (07)**: kartu situasi (hitungan biaya perbaikan · Sedang berjalan + fakta kendaraan lain), pertanyaan konkret, papan waktu dua baris (Sekarang / Sesudah hitungan) yang berubah sebelum kirim, dua pilihan papan + "Pilihan lain" (ketiga alternatif lain tetap terlihat). Label tampilan: "Mulai sekarang" / "Tunggu hitungan selesai" (makna = naskah `akt.jalur.wadah.*`). Pemetaan jawaban diverifikasi = mesin (k07-a..e).
- **Audit (6)**: mekanisme gerbang + Balas berlaku untuk semua keputusan percakapan; K06 memakai kartu tahapan linimasa. K10/K11/K15 sudah diringkas di putaran desain sebelumnya; tidak ditambah tombol Lanjut baru.
- **Tidak diubah**: D-71 (scoring K08), Episode 1 (antarmuka lama, tidak memakai komponen HP).

## Audio & ritme Episode 2 (15 Nov 2026)
Satu pengelola audio (`client/src/audio/audio.ts`) diperluas; tidak ada sistem kedua atau dependency baru.
- **Musik** (`tools/make-music-ep2.mjs`, disintesis, lisensi proyek; DRAF karena belum didengar manusia): `cerita-kantor` (bagian 1 & 4), `cerita-periksa` (bagian 2 & 3), `cerita-penutup` (K15 & layar akhir). 55% dari volume musik, crossfade 1,6 s hanya saat tema berganti; berhenti cepat saat tab tersembunyi, bisu, atau keluar dari Episode 2. Musik cerita aktif bawaan kecuali pemain membisukan (preferensi bisu lama dihormati) atau mematikannya di Menu; mode lain tidak ikut berubah.
- **Suasana** (sintesis, tanpa berkas): `bengkel` (pool/bengkel) dan `jalan` (ruas tol; desir jauh naik-turun pelan, tanpa klakson/benturan). Kantor, ruang wawancara, dan obrolan tanpa suasana.
- **SFX tindakan** (netral, bukan penilaian): `taruh` dokumen ke baki, `kertas` berkas/tugas dibuka, `pesanKirim` balasan terkirim, `pesanTerima` pesan nasabah tampil (sesudah indikator mengetik; tidak saat muat ulang), `ketuk` tanda lajur/Balas, `konfirmasi` pilih lokasi/tugas dikirim/jawaban tatap muka, `batal` Batalkan. Peredam 80 ms per efek cerita; mode lain tidak berubah.
- **Kontrol** di Menu: Semua suara, Musik & suasana, Efek suara, volume musik, volume efek, dan "Coba suara" (tiga tema + tujuh SFX). Petunjuk kecil "Suara tersedia" sekali di pembukaan, bisa ditutup.
- **Ritme**: balasan yang sudah dibuka/dipilih pulih sesudah muat ulang (sessionStorage per node, dihapus saat dikirim); K07 tiga alternatif tanpa pemeriksaan di lokasi berada di balik "Lihat 3 pilihan lainnya" dengan judul kelompok netral ("Dengan pemeriksaan di lokasi (2)" / "Tanpa pemeriksaan di lokasi (3)").
