# Rancangan: Mode Cerita (visual novel role play) + perbaikan review 26 September 2026

Dokumen ini adalah **kontrak** pekerjaan 26 September 2026. Tipe data ada di `client/src/cerita/tipe.ts`.
Bila kode dan dokumen ini berbeda, perbaiki salah satunya dan catat alasannya; jangan diam-diam.
**Revisi v2 (bagian 11)** menggantikan aturan umpan balik pilihan, kartu aktivitas, dan layar akhir yang lama di
bagian 4 dan 10.2; bila bertentangan, bagian 11 yang berlaku. Baris lama yang terdampak diberi rujukan ke sana.
Temuan review: `C:\Users\User\Desktop\raksa-review-20260926\REVIEW.md` (live = build lokal 99fb182,
bundel `index-DjDxkO4v.js` sama). Reproduksi lokal (angka sama dengan review): lihat bagian 9.

## 1. Keputusan produk

- **Mode Cerita** = pusat pengalaman baru. Pemain berperan sebagai **petugas layanan klaim Raksa** di meja
  layanan Kantor Raksa. Tidak ada timer, tidak ada poin; yang dinilai adalah (a) **komunikasi** (nasabah merasa
  didengar & paham) dan (b) **ketepatan langkah klaim** (proses), **dipisah**. Layar akhir menunjukkan satu akibat
  dan satu pelajaran; rincian kedua sisi hanya dibuka atas permintaan ("Lihat perjalananku", bagian 11.1).
- **Latihan misi** (10 misi, bonus waktu, bintang) dan **mode acara** (host, proyektor, multiplayer) tetap ada
  dan tetap mudah dijangkau. Tidak ada yang dikunci.
- Tokoh punya peran tetap (identitas Raksa):
  | Tokoh | Peran naratif | Muncul di |
  | --- | --- | --- |
  | **Miss Raksa** (ikon Raksa CS) | Mentor senior layanan klaim: membuka episode, memberi petunjuk saat pemain perlu memperbaiki langkah, menutup dengan pembahasan | Mode cerita, kartu tugas misi |
  | **Raki** (burung hantu) | Teman latihan | Latihan misi & tutorial |
  | **Bu Isti** (Direktur IT) | Juri | Hasil misi, acara |
  | **Mr Roger** (CEO) | Tuan rumah | Halaman awal, hasil akhir, podium |
  | **Bu Rina** (baru) | Nasabah episode 1: pemilik usaha katering rumahan, praktis, sedang diburu waktu | Episode AUTO-1 |
- Halaman awal membedakan tiga pintu dengan bahasa pengguna: **Main cerita** (utama), **Latihan misi**, **Gabung
  acara** (punya kode dari panitia). Ketiganya memakai bingkai potret bulat yang sama.
- Materi klaim: HANYA dari materi yang sudah ada (m01 dokumentasi & lapor lewat kanal klaim sebelum perbaikan;
  m02 tiga bukti: keseluruhan, detail kerusakan, identitas; m05 Comprehensive "kerusakan benturan tercakup
  sesuai syarat kartu" vs TLO ambang 75% (v2: perbandingan TLO tidak lagi dipakai di episode, hanya di latihan
  misi 5; 11.5); m09 risiko sendiri = bagian kerugian yang tetap ditanggung sesuai
  polis; catatan simulasi "Klaim sebenarnya mengikuti polis dan pemeriksaan Raksa"). **Tidak ada** janji hasil,
  SLA/tenggat, kewenangan petugas menyetujui/menolak, atau prosedur resmi baru. Kalimat baru yang menyentuh
  materi klaim dicatat di `docs/cerita/TINJAUAN-PIC-CLAIM.md`.

## 2. Mesin cerita (`client/src/cerita/`)

Definisi episode (data) terpisah dari state (mesin murni) dan dari tampilan (React).

| Berkas | Isi | Pemilik |
| --- | --- | --- |
| `tipe.ts` | Tipe episode, node, kondisi, efek, state, aksi | kontrak (tetap) |
| `teks.ts` | `teksCerita(ep, kunci, bahasa, param)` | kontrak (tetap) |
| `mesin.ts` | `stateAwal`, `jalankan` (reducer murni), `nodeKini`, `barisTerlihat`, `pilihanTersedia`, `kondisiTerpenuhi`, `suasanaNasabah`, `nilaiAktivitas`, `ringkasanAkhir` | agen mesin |
| `validasi.ts` | `validasiEpisode(ep)` + `jelajahiSemuaJalur(ep)` | agen mesin |
| `simpan.ts` | simpan/muat progres, versi, arsip, akhir yang ditemukan | agen mesin |
| `episode/index.ts` | `DAFTAR_EPISODE` | kontrak |
| `episode/auto-1/{episode,teks,aktivitas}.ts` | Episode AUTO-1 | agen naskah (+ penerjemah en/zh) |
| `ui/*`, `pages/Cerita*.tsx` | Tampilan | agen panggung |
| `seni/*`, `game/scenes/cerita/*` | Potret Bu Rina, latar panggung, adegan aktivitas | agen seni |

### 2.1 Node
- `dialog`: `baris[]` lalu `lanjut`. `efek` (opsional) diterapkan SEKALI saat pindah ke `lanjut`.
- `pilihan`: `baris[]` pengantar, lalu `tanya` + `pilihan[]` (≥2 yang tampil). Pilihan = `{ id, teks, efek, lanjut, jika? }`.
- `aktivitas`: `baris[]` pengantar, lalu aktivitas klaim yang SUDAH ADA (MissionPlay: adegan 2D + daftar HTML,
  dokumen). Setelah dikirim: dinilai di klien (`gradeStep`), tanda hasil dipasang, cabang `hasil[]` pertama yang
  cocok dipilih, efeknya diterapkan SEKALI, umpan balik tampil, lalu `lanjut`.
- `cabang`: dievaluasi otomatis saat dimasuki (urut; `lainnya` bila tak ada yang cocok).
- `akhir`: `baris[]` epilog + ringkasan.

### 2.2 Kondisi & efek (secukupnya)
`Kondisi` = tanda / tidak / semua / salahSatu / kepercayaan{min,maks} / paham / proses.
`Efek` = pasang/cabut tanda, `kepercayaan` (delta, **wajib disertai `alasan`**), `paham[]` (kejelasan:
hal yang kini dipahami nasabah), `proses{}` (`tepat` | `dikoreksi` | `keliru`, nilai terakhir menang),
`catat[]` (butir Catatan kasus).

Tanda hasil aktivitas (dipasang mesin): `akt:<id>:tepat|sebagian|belum`, `akt:<id>:pilih:<opsi>` untuk tiap opsi
yang dipilih, `akt:<id>:lewat:<opsi>` untuk tiap opsi benar yang tidak dipilih.

### 2.3 State, aksi, dan jaminan
Aksi: `lanjut`, `pilih{node,pilihan}`, `aktivitas{node,jawaban}`, `ulangBab{bab}`, `mulaiUlang`.
- `jalankan` MURNI; aksi yang tidak sah untuk node kini (node lain, pilihan tak tersedia, aktivitas sudah dinilai,
  baris belum habis) = **no-op** (objek state yang sama dikembalikan).
- Efek hanya diterapkan saat transisi. Muat ulang, membaca riwayat, ketukan ganda, atau mengirim aktivitas dua
  kali TIDAK menerapkan efek lagi.
- Riwayat menyimpan KUNCI teks, bukan teks: ganti bahasa di tengah episode tidak mengubah state.
- Saat masuk bab untuk pertama kali di satu perjalanan, cadangan state disimpan per bab → "Coba jalur lain dari
  Bagian X" memulihkan cadangan itu (bab sesudahnya dibuang).
- `stateAwal` tidak menulis ke penyimpanan; komponen TIDAK boleh mengirim aksi otomatis saat mount (StrictMode).

### 2.4 Penyimpanan (`localStorage['raksa:cerita']`)
`{ format: 1, episode: { [id]: { versi, state, disimpan } }, akhir: { [id]: IdAkhir[] }, arsip: [{ episode, versi,
state, diarsipkan, sebab }] }` dengan cadangan memori bila penyimpanan diblokir (pola `state/profil.ts`).
- `muatProgres(ep)` → `baru` | `lanjut` | `tidakCocok` (versi beda tanpa migrasi, node hilang, data rusak). UI
  menampilkan pilihan pemulihan yang jelas: **Mulai ulang (progres lama diarsipkan)** atau **Kembali**. Tidak ada
  penghapusan diam-diam. `ep.migrasi[versiLama]` boleh memetakan state lama.
- Arsip punya dua kuota per episode, dibedakan bidang `sebab`: **perjalanan biasa** (`sebab: 'perjalanan'`, dari
  "Ulang episode" / "Main lagi dari awal") maks `MAKS_ARSIP_PER_EPISODE` = 5, yang terlama **dirotasi**; **progres
  tidak cocok** (`sebab: 'versi' | 'rusak' | 'node-hilang'`, juga entri lama tanpa `sebab`) **tidak pernah
  dirotasi**, karena dialog pemulihan menjanjikan progres itu tidak dihapus.
- Akhir yang pernah dicapai dicatat terpisah (bertahan walau episode diulang).

### 2.5 Validasi (dijaga tes)
Semua rujukan node ada; semua node terjangkau dari `mulai`; dari tiap node ada jalan ke `akhir`; penjelajahan
semua kombinasi pilihan & hasil aktivitas selalu berakhir (batas langkah); ≥2 akhir berbeda; tiap node pilihan
punya ≥2 pilihan dengan akibat (lanjut/efek) berbeda — **tanpa cabang palsu**; tiap `kepercayaan` punya
`alasan`; semua kunci teks ada di id/en/zh dengan parameter & angka yang sama; pembicara, ekspresi, latar,
aktivitas valid; opsi rubrik ada di misi sintetis. Aturan tambahan yang ternyata perlu: lihat 10.3.

## 3. Episode 1 — AUTO "Baret di Parkiran" (`auto-1`)

Pemain: petugas layanan klaim (nama & karakter dari profil). Nasabah: **Bu Rina**. Mentor: **Miss Raksa**.
Latar: `kantor` (meja layanan Kantor Raksa, latar m05) dan `parkiran` (parkiran kantor, latar m01).
Situasi: pagi tadi mobil Bu Rina disenggol di parkiran pasar (pelaku pergi); bemper & lampu belakang penyok/
retak. Besok pagi ia harus mengantar 150 kotak katering. Ia datang cemas dan kesal.

Kepercayaan awal 0. Suasana nasabah dari kepercayaan (tabel `suasana` episode, label + ekspresi): ≤ -2 **Kesal**
(kesal), -1..0 **Cemas** (cemas), 1..2 **Mulai tenang** (netral), ≥ 3 **Tenang** (lega). Wajah Bu Rina di panggung =
ekspresi baris Bu Rina terakhir yang sudah tampil di node kini, selain itu ekspresi suasana itu. **Label panggung
ditulis dari wajah yang tampil**, bukan dari angka: ekspresi yang ada di tabel suasana memakai labelnya
(lega → Tenang, netral → Mulai tenang, cemas → Cemas, kesal → Kesal), ekspresi lain memakai kamus UI
`cerita.ekspresi.*` (mis. bingung → Bingung, senang → Senang). Jadi wajah, label, dan catatan alasan tidak saling
membantah (`ui/tampilan.ts` `ekspresiNasabah`, `kunciLabelEkspresi`; `ui/bagian.tsx` `labelPerasaan`).

`paham` (kejelasan, 4 butir): `langkah-sekarang` (dokumentasi & lapor dulu, belum diperbaiki), `polis-dinilai`
(kerusakan bisa dilanjutkan untuk dinilai sesuai syarat kartu, bukan pasti diganti), `risiko-sendiri` (ada bagian
kerugian yang tetap ditanggung sesuai polis), `langkah-berikut` (laporan tercatat → kerusakan diperiksa & dinilai
sesuai polis → langkah perbaikan mengikuti hasil penilaian). `langkah-berikut` **hanya** dipasang bila penutup
`rangkum` benar-benar diterima (node `b5-rangkum-jelas`); jawaban di `b5-keberatan` tidak memasangnya.
`proses` (ketepatan, 4 butir): `dokumentasi-dulu`, `bukti`, `baca-polis`, `tanpa-janji`.

### 3.1 Graf (id node TETAP; kalimat boleh disempurnakan)

| Bab | Node | Jenis | Isi / pilihan → akibat |
| --- | --- | --- | --- |
| menyambut | `b1-mentor` | dialog | Miss Raksa menyambut dengan SATU perkenalan peran (`.1`: kamu membantu pelanggan asuransi (nasabah) yang melaporkan kerugian (klaim); ia mendampingi; ini simulasi; **v3**: satu kalimat peran + tempat tanpa istilah, lihat 12.1). Narasi (`.4`): nasabah datang. v2: baris tugas `.2` & catatan simulasi `.3` pensiun (11.3). → `b1-datang` |
| menyambut | `b1-datang` | pilihan **K1** | Bu Rina (cemas/kesal) menjelaskan kejadian & kebutuhan besok. catat `masalah`,`kebutuhan`. `dengar` "Ibu aman? Ceritakan dari awal" (+2, tanda `dengar-dulu`) → `b2-cerita` · `prosedur` "Saya perlu nomor polis & foto dulu" (-1, `langsung-prosedur`) → `b1-pulih` · `janji` "Tenang, kami bantu sampai beres, besok pasti bisa dipakai" (+1, `janji-awal`, proses tanpa-janji=keliru) → `b2-cerita` |
| menyambut | `b1-pulih` | pilihan **pemulihan** | Bu Rina: "Saya lagi bingung, bukan cuma mau isi formulir." Miss Raksa memberi isyarat singkat. `maaf` (+2, `pulih-komunikasi`,`dengar-dulu`) → `b2-cerita` · `tetap` "Supaya cepat, isi data dulu" (-1, `cerita-singkat`) → `b2-singkat` |
| menggali | `b2-cerita` | dialog | Kronologi lengkap; ia sempat memotret seadanya & berniat langsung ke bengkel siang ini. catat `rencana-bengkel`. → `b2-cerita-cabang` |
| menggali | `b2-cerita-cabang` | cabang | `dengar-dulu` → `b2-cerita-bagian`; lainnya → `b2-saran` |
| menggali | `b2-cerita-bagian` | dialog | Didengar lebih dulu, Bu Rina menambah detail: pecahan penutup lampu ia simpan di bagasi (`b2-cerita.6`). catat `bagian-disimpan` (dicatat SETELAH ia menyebutnya, lihat 10.1). → `b2-saran` |
| menggali | `b2-singkat` | dialog | Jawaban pendek, tanpa detail pecahan lampu. catat `rencana-bengkel`. → `b2-saran` |
| menggali | `b2-saran` | pilihan **K2** | "Saya langsung ke bengkel saja kan, biar cepat?" `dokumentasi` (+1, proses dokumentasi-dulu=tepat, paham langkah-sekarang) → `b3-bukti-intro` · `bengkel` "Kalau mendesak, perbaiki dulu, klaim menyusul" (+1, `perbaiki-dulu`, dokumentasi-dulu=keliru) → `b2-bengkel-akibat` · `ringan` "Kalau cuma baret, mungkin tak perlu klaim" (-1, dokumentasi-dulu=keliru) → `b2-ringan-akibat` |
| menggali | `b2-bengkel-akibat` | pilihan **pemulihan** | Miss Raksa: bila diperbaiki sekarang, kondisi kerusakan tak bisa dilihat lagi. `koreksi` ralat saran (0, dokumentasi-dulu=dikoreksi, paham langkah-sekarang, cabut `perbaiki-dulu`) → `b3-bukti-intro` · `biarkan` "Foto seadanya dari HP cukup" (0, `bukti-seadanya`, bukti=keliru) → `b3-seadanya` |
| menggali | `b2-ringan-akibat` | pilihan **pemulihan** | Bu Rina: "Masa nggak usah? Penyoknya lumayan." `lihat-dulu` akui terlalu cepat menilai (+1, dokumentasi-dulu=dikoreksi, paham langkah-sekarang) → `b3-bukti-intro` · `tetap-ringan` (-2, `menolak-awal`) → `akhir-pergi` |
| bukti | `b3-bukti-intro` | dialog | Keluar ke parkiran kantor. Arah tanpa membocorkan jawaban ("apa yang perlu dilihat pemeriksa: mobil yang mana, dan rusaknya di mana") kini ada di petunjuk aktivitas `akt.bukti.petunjuk`; baris mentor `.4` yang mengulang tugas pensiun (11.3). → `b3-bukti` |
| bukti | `b3-bukti` | aktivitas `bukti` | Potret 3 bukti di mobil (adegan `cerita-auto1-bukti`). tepat → (proses bukti=tepat, catat `bukti`) → `b3-bukti-tepat` · lainnya → (proses bukti=keliru, catat `bukti`) → `b3-bukti-kurang` |
| bukti | `b3-bukti-tepat` | dialog | Bu Rina paham kenapa plat juga difoto. → `b4-polis-intro` |
| bukti | `b3-bukti-kurang` | pilihan **tindak lanjut** | Tanda di adegan menunjukkan yang terlewat. `lengkapi` "Boleh kita tambah foto yang kurang sekarang?" (0, bukti=dikoreksi) → `b3-lengkapi` · `cukup` (0, `bukti-belum-lengkap`) → `b3-cukup` |
| bukti | `b3-lengkapi` | dialog | Narasi: foto yang terlewat dipotret, laporan kini punya tiga bukti; Bu Rina paham yang kurang. catat `bukti-lengkap`. → `b4-polis-intro` |
| bukti | `b3-cukup` | dialog | Bu Rina lega lebih cepat; Miss Raksa (pelan) menyebut akibatnya: bila foto yang terlewat diminta, Bu Rina harus meluangkan waktu lagi. catat `bukti-kurang`. → `b4-polis-intro` |
| bukti | `b3-seadanya` | dialog | Bu Rina bergegas ke bengkel; laporan dibuat dari foto seadanya. → `b4-polis-intro` |
| polis | `b4-polis-intro` | dialog | Kembali ke meja; kamu membuka kartu polis. Bu Rina: "Polis saya bisa dipakai, kan?" → `b4-polis` |
| polis | `b4-polis` | aktivitas `polis` | Baca Kartu Polis Bu Rina (Comprehensive, simulasi), pilih pernyataan yang tepat. `bisa-dinilai` → (+1, baca-polis=tepat, paham polis-dinilai, catat `polis`) → `b4-polis-tepat` · `pasti-diganti` → (+1, baca-polis=keliru, `janji-polis`, tanpa-janji=keliru) → `b4-polis-janji` · `tidak-tercakup` → (-2, baca-polis=keliru) → `b4-polis-salah` · `ambang-tlo` → (-1, baca-polis=keliru) → `b4-polis-salah` (v2: opsi `ambang-tlo` pensiun dan tidak ditawarkan lagi; cabang ke-4 tetap ada sebagai cadangan jawaban kosong/tak cocok dan untuk simpanan lama, 11.5) |
| polis | `b4-polis-tepat` | dialog | Bu Rina bertanya soal risiko sendiri; kamu menjawab singkat (bagian yang tetap ditanggung, besarnya sesuai polis). → `b5-keberatan` |
| polis | `b4-polis-janji` | dialog | Bu Rina lega "pasti diganti". → `b5-keberatan` |
| polis | `b4-polis-salah` | pilihan **pemulihan** | Bu Rina kecewa; Miss Raksa: "Baca lagi baris Kerusakan benturan." `baca-ulang` (+1, baca-polis=dikoreksi, paham polis-dinilai, catat `polis`) → `b5-keberatan` · `bertahan` (-2) → `akhir-pergi` |
| menutup | `b5-keberatan` | pilihan **K3** | Baris beda bila ada janji ("Tadi katanya pasti…") atau tidak ("Kapan mobil saya beres? Kenapa ada risiko sendiri?"; bila saran bengkel dibiarkan: "klaimnya kapan beres?"). `jujur` (jika TIDAK ada janji; +1, paham risiko-sendiri, tanpa-janji=tepat) · `ralat-janji` (jika `janji-awal` DAN BUKAN `janji-polis`; -1, cabut semua janji, paham risiko-sendiri, tanpa-janji=dikoreksi) · `ralat-polis` (jika `janji-polis`; -1, cabut semua janji, paham polis-dinilai & risiko-sendiri, tanpa-janji=dikoreksi, baca-polis=dikoreksi; lihat 10.1) · `janjikan` "Saya usahakan besok selesai" (+1, `janji-waktu`, tanpa-janji=keliru) · `aturan` "Itu ketentuan polis, silakan baca kartunya" (jika TIDAK ada janji; -2, `jawab-aturan`, tanpa-janji=tepat) · `aturan-janji` (kalimat sama, jika ada `janji-awal`/`janji-polis`; -2, `jawab-aturan`; janji lama tidak diluruskan, jadi tanpa-janji tetap keliru) — semua → `b5-tutup`. **Tidak ada** pilihan di node ini yang memasang `langkah-berikut`: jawaban-jawaban itu tidak menyebut urutan langkah. |
| menutup | `b5-tutup` | pilihan **K4** | Reaksi atas jawaban tadi, lalu "Jadi setelah ini saya harus apa?" `rangkum` ringkas langkah (laporan tercatat → diperiksa & dinilai sesuai polis → perbaikan mengikuti hasilnya) + kabari bila ada yang kurang (+1, `rangkum`) → `b5-rangkum` · `singkat` "Nanti dikabari" (-1) → `cabang-akhir` |
| menutup | `b5-rangkum` | cabang | Tanggapan Bu Rina atas ringkasan: `bukti-seadanya` (saran bengkel tak diluruskan) → `b5-rangkum-bengkel`; janji masih berlaku (`janji-awal`/`janji-polis`/`janji-waktu`) → `b5-rangkum-janji`; lainnya → `b5-rangkum-jelas` |
| menutup | `b5-rangkum-jelas` | dialog | Bu Rina mengulang: dinilai dulu, perbaikan mengikuti hasil penilaian. paham `langkah-berikut` (**satu-satunya** tempat butir ini dipasang). → `cabang-akhir` |
| menutup | `b5-rangkum-janji` | dialog | Bu Rina menagih janji lama ("Tapi besok sudah beres, kan?" / "Tapi pasti diganti, kan?"). Tanpa `langkah-berikut`. → `cabang-akhir` |
| menutup | `b5-rangkum-bengkel` | dialog | Bu Rina tetap berencana ke bengkel siang ini. Tanpa `langkah-berikut`. → `cabang-akhir` |
| menutup | `cabang-akhir` | cabang | 1) `bukti-seadanya` atau `bukti-belum-lengkap` → `akhir-tertunda`; 2) ada `janji-awal`/`janji-polis`/`janji-waktu` → `akhir-janji`; 3) kepercayaan ≥ 3 DAN paham `langkah-berikut`,`polis-dinilai`,`risiko-sendiri` → `akhir-tuntas`; lainnya → `akhir-dingin`. Karena `langkah-berikut` hanya dari `b5-rangkum-jelas`, penutup `singkat` tidak pernah berakhir `tuntas`. |
| menutup | `akhir-tuntas` | akhir (baik) | **Didengar dan Jelas**: mobil belum bisa langsung beres, tapi Bu Rina tahu langkahnya & menyiapkan cara lain untuk antar pesanan besok (harapan tidak semuanya terpenuhi, tetap happy ending). |
| menutup | `akhir-janji` | akhir (campuran) | **Lega Sesaat**: pulang senang; epilog beberapa hari kemudian: kecewa karena janji tak sesuai proses. Nasabah senang ≠ langkah benar. |
| menutup | `akhir-dingin` | akhir (campuran) | **Benar, tapi Berjarak**: langkah klaim beres, tapi Bu Rina masih ragu/tidak paham semuanya. |
| menutup | `akhir-tertunda` | akhir (buruk) | **Laporan Tertunda**: bukti tidak lengkap; laporan perlu dilengkapi, dan kondisi sebelum perbaikan (bila sudah ke bengkel) tak bisa diulang. |
| menutup | `akhir-pergi` | akhir (buruk) | **Nasabah Pergi**: Bu Rina pergi tanpa arah karena merasa diabaikan / dinilai terlalu cepat. |

Jalur uji wajib: terbaik (dengar, dokumentasi, bukti tepat, bisa-dinilai, jujur, rangkum) → tuntas;
**pemulihan komunikasi** (prosedur → maaf → … → tuntas); janji (janji, …, janjikan) → janji; janji lalu
ralat-janji → tuntas; dingin (prosedur → tetap → … → aturan) → dingin; **terbaik tapi menutup `singkat` → dingin**;
bukti kurang + lengkapi → tuntas; bukti kurang + cukup → tertunda; bengkel + biarkan → tertunda; ringan +
tetap-ringan → pergi; polis salah + bertahan → pergi.
Tambahan sejak `ralat-polis` (10.1): pasti-diganti → ralat-polis → rangkum → tuntas (kepercayaan cukup);
pasti-diganti → ralat-polis → singkat → dingin.

### 3.2 Aktivitas (id misi sintetis & opsi TETAP — dipakai naskah DAN adegan)
- `bukti` → misi `cerita-auto1-bukti` (adegan parkiran kantor, mobil Bu Rina). Langkah `bukti` multi, pilih 3,
  fx `photo`. Opsi: `foto-full` (seluruh mobil) ✓, `foto-penyok` (bemper & lampu belakang) ✓, `foto-plat` (plat
  nomor) ✓, `foto-menu` (brosur menu katering di kaca), `foto-ban` (foto dekat ban depan), `foto-dasbor` (foto
  dasbor dari jendela). Pengecoh = pertimbangan pemeriksaan, bukan opsi konyol: ban depan & dasbor adalah bagian
  mobil yang tidak rusak dan tidak menunjukkan identitasnya (m02: bukti menghubungkan kendaraan, lokasi kerusakan,
  dan kejadian); keduanya objek bersarang di roda depan & kaca pintu depan mobil Bu Rina. `foto-selfie` (swafoto)
  dan `foto-kucing` (kucing di kap) dihapus 26 Sep 2026 (tinjauan internal: pengecoh terlalu konyol).
- `polis` → misi `cerita-auto1-polis` (adegan meja layanan, latar m05) dengan `policyCards: [polis-rina]`
  (Comprehensive simulasi; baris: kendaraan & plat, kerusakan benturan "Tercakup sesuai syarat kartu", status
  "Aktif", risiko sendiri "Berlaku sesuai ketentuan polis"; baris **TANPA `flag`**: flag ok/no membocorkan jawaban,
  dan chip "info" di setiap baris tampak seperti tombol bantuan padahal tidak bisa diketuk).
  Langkah `penjelasan` single: `bisa-dinilai` ✓, `pasti-diganti`, `tidak-tercakup` (urutan tampil: `pasti-diganti`,
  `tidak-tercakup`, `bisa-dinilai`). `ambang-tlo` pensiun di v2 (`opsiPensiun`, 11.5). v2 juga menambah alasan per opsi
  (`alasanOpsi`, kedua aktivitas) dan arti awam subjudul & tiap baris kartu (`kartuArti`).
- Rubrik aktivitas ada di klien (`DefAktivitas.kunci`, mode cerita tidak bertanding). Kunci pertandingan tetap
  server-only; kode cerita TIDAK mengimpor `server/` atau `answerKeys`.

## 4. Tampilan cerita (panggung)

> **Catatan v3/v4:** uraian panggung di bagian ini adalah desain v1/v2 (latar datar + Bu Rina). Panggung AUTO-1 kini
> mengikuti `docs/cerita/ADEGAN-AUTO1.md` (dunia berlapis, dua tokoh piksel, cue adegan); ringkasan di bagian 12.

- `/cerita` (daftar episode + penjelasan singkat mode cerita) dan `/cerita/:episode` (pemain). Tanpa profil →
  `/kenalan?lanjut=/cerita/...`.
- HP potret: header ringkas (kembali, "Bagian n/5 · judul bab", bahasa, suara; baris kedua: tujuan bab + Riwayat,
  Catatan kasus, Bantuan) → panggung (latar SVG + Bu Rina bila hadir; label suasana "Bu Rina · Cemas" = kata untuk
  wajah yang tampil, bagian 3, gaya netral) ±220 px → kotak dialog (nama + peran pembicara, potret bulat, teks,
  tombol istilah bila ada) → pilihan (tombol ≥ 48 px). Satu tujuan per bab tampil kecil ("Tujuan: pahami masalah
  Bu Rina").
- Setelah memilih (v2, 11.3): **tanpa** gema "Kamu: …" (pilihan tetap terbaca di Riwayat, bertanda "Pilihanmu").
  Baris reaksi tokoh, lalu setelah kalimatnya utuh paling banyak SATU kalimat ajar (alasan, mis. "Bu Rina mulai
  tenang karena kamu menanyakan keadaannya lebih dulu.") bergaya netral: ikon info, tanpa hijau/merah, tanpa kata
  "Suasana membaik". Angka kepercayaan tidak pernah tampil.
- Teks mengetik boleh; ketukan pertama menampilkan kalimat utuh, ketukan kedua lanjut; `Enter`/`Spasi` sama;
  gerak dikurangi = langsung utuh. Pembaca layar menerima kalimat utuh sekali (live region: reaksi + kalimat ajar).
- Istilah (v2, 11.4): baris yang pertama kali memakai istilah memberi tombol "Apa itu …?" setelah kalimatnya utuh.
- Riwayat, Catatan kasus, dan Bantuan memakai `Modal` bersama (fokus terkunci). Catatan kasus: masalah & kebutuhan
  nasabah, bukti terkumpul, kartu polis (bila sudah dibuka; barisnya bisa diperiksa), hal yang sudah dipahami
  nasabah. Bantuan: cara memakai layar cerita (4 baris, tanpa bahasa waktu/poin).
- Aktivitas (v2, 11.5): kartu pengantar SATU tugas (baris pengantar terakhir + tugas + Mulai) → MissionPlay (adegan +
  daftar HTML, dokumen, mode ringan & engine gagal tetap jalan) → umpan balik (vonis langkah + reaksi/mentor + tiap
  pilihan dengan alasan singkatnya) → "Lanjutkan cerita"; pembahasan panjang & alasan perasaan di "Kenapa begitu?".
- Akhir (v2, 11.1): epilog dibaca SEKALI di dialog, lalu SATU kartu: wajah akhir Bu Rina + label perasaan, nama
  akhir, judul hasil, satu kalimat sebab-akibat, satu pelajaran, dua aksi, "Lihat perjalananku" + catatan simulasi.
  Pemilih bagian dan tinjauan lengkap ("Lihat perjalananku": perasaan, langkah klaim, pemahaman, akhir yang
  ditemukan n/5, paling banyak satu latihan terkait) masing-masing di dialog terpisah.
- Catatan simulasi ringkas selalu ada (kamus `misi.catatanSimulasiPeriksa`, sama dengan latihan misi).

## 5. Perbaikan temuan review (target terukur)

| Temuan | Target |
| --- | --- |
| A. Checklist misi 3 hilang di mode ringan | Tombol HTML "Lihat checklist" (penuh & ringan & engine gagal) di dekat folder; Cara main mode ringan/gagal memakai petunjuk daftar, bukan "ketuk gambar"; semua info yang hanya ada di objek adegan (`role: 'info'`, mis. kalender m07) juga terbaca lewat HTML. Tes: setiap objek doc/info adegan punya jalur HTML. |
| B. Fokus keluar dari dialog | `Modal` bersama: portal ke body, fokus masuk saat buka, Tab/Shift+Tab terkunci, latar `inert` (sadar tumpukan), Escape hanya menutup dialog teratas, fokus kembali ke pembuka atau `kembaliKe` (dibuka dari kanvas → tombol Dokumen/Checklist), isi panjang bisa digulir keyboard & sentuh. |
| C. Onboarding HP panjang, bonus sudah jalan | Solo: kartu "Siap mulai" (judul, kasus, tugas, cara main ringkas) → bonus mulai setelah "Siap mulai". Bantuan kunjungan pertama ringkas/bisa ditutup. Setelah mulai di 390×844 & 360×740: pilihan pertama terlihat di atas bar aksi. Multiplayer: deadline tidak diubah; cara main ringkas tampil saat BRIEFING. |
| D. Hasil HP mendahulukan ilustrasi | Mode pembahasan di HP: vonis → pilihanmu & yang tepat → alasan singkat (terlihat) → aksi → adegan (lebih kecil) di bawah. Di 390×844 tombol aksi utama terlihat tanpa gulir setelah hasil keluar. |
| E. Bintang membingungkan | Bintang = ketepatan terbaik (3 = semua tepat, 2 ≥ 60%, 1 > 0%, 0 = belum ada yang tepat); "sudah dicoba" = tanda terpisah; arti bintang dijelaskan di hasil & peta. Migrasi progres lama (bintang dihitung ulang dari `akurasi` tersimpan; data mentah lama dicadangkan). |
| F. Konsistensi visual | Header wordmark, bentuk tombol, tipografi, dan bingkai potret sama di halaman awal, pemain, host, proyektor; host tetap padat. Tanpa trik z-index. |

## 6. Kontrak antarkomponen (jangan dipecahkan)

Diperbarui 26 September 2026 sesuai kode gelombang 1, lalu revisi v2 (baris bertanda "(v2)" dan tabel layar akhir,
dialog, & aktivitas cerita di bawah). Semua tambahan opsional; pemanggil `MissionPlay` yang lama
(Play, SoloMain, Tutorial) tetap jalan, dan mode cerita memakai komponen yang sama (`cerita/ui/Aktivitas.tsx`).

**`MissionPlay`** (`client/src/game/MissionPlay.tsx`), prop lama tetap. Tambahan:

| Prop / tipe | Arti |
| --- | --- |
| `fokus?: 'baca' \| 'adegan'` | Menimpa heuristik tata letak saat menjawab: `baca` = jawaban dulu, `adegan` = adegan dulu |
| `kiatAwal?: boolean` | Kunjungan pertama: petunjuk satu baris yang bisa ditutup (contoh lengkap tetap di "Cara main") |
| `ketIntro?: string` | Keterangan di bawah adegan saat `mode='intro'` (bawaan: "Gambar belum bisa disentuh…") |
| `panel?: ReactNode \| ((h: PanelBantu) => ReactNode)` | Panel non-menjawab boleh berupa fungsi yang menerima `PanelBantu` |
| `PanelBantu.bukaDokumen(id?, pembuka?)` | Buka dialog dokumen; `id` = dokumen yang disorot (`'checklist'`, id kartu/tabel); `pembuka` menerima fokus lagi setelah ditutup |
| `PanelBantu.interaktif` | Adegan bisa diketuk (false = memuat, mode ringan, engine gagal, misi bergambar) |
| `PanelBantu.caraRingkas` | Cara main ringkas sadar mode adegan (daftar HTML bila tidak interaktif) |
| `PanelBantu.tombolInfo` | Tombol "Lihat checklist" / "Lihat dokumen kasus" (null bila misi tidak punya) |
| `CaraMain({ …, interaktif })` | Contoh cara main memakai mekanik daftar bila adegan tidak interaktif |
| `HasilMisi({ …, raihan })` | Isi tepat di bawah vonis (mode solo: baris bintang + arti bintang) |
| `sisipanJawab?: ReactNode` | (v2) Isi di ATAS panel jawaban saat menjawab/jeda, tetap terlihat selama memilih; tidak tampil di briefing/pembahasan. Cerita: kartu polis yang bisa diperiksa (`KartuPolisPeriksa`) |
| `konfirmasiKurang?: (info: { kurang, terisi, wajib, langkah }) => { judul, isi, kembali, kirim } \| null` | (v2) Mengganti isi dialog "kirim walau belum lengkap" untuk langkah PERTAMA yang belum lengkap; `null` = dialog bawaan (`misi.kirimSekarangTanya` / `misi.konfirmasiCatatan`, tetap dipakai solo & pertandingan). `kembali` menutup dialog dan mengembalikan fokus ke pembuka daftar pilihan; `kirim` mengirim apa adanya |
| `labelHitung?: (n, maks) => string` | (v2) Teks penghitung baki pilih-banyak (cerita: "1/3 foto", kamus `ceritaAkt.hitungFoto`). Bawaan "0 / 3" |
| `albumRingkas?: boolean` | (v2) Baki pilih-banyak ringkas: tanpa slot kosong setinggi kartu (pilihan = baris ringkas yang bisa dibatalkan + satu baris "sisa"); setelah Mulai, gulir otomatis ikut menjaga pembuka "Pilih lewat daftar" terlihat di atas bar aksi lengket |
| `statusPilihan?: boolean` | (v2) `false` = tanpa baris "Pilihanmu: …" di atas pilihan (pilihan yang dipilih sudah bertanda "Dipilih"). Cerita: hanya saat ada `sisipanJawab` (kartu polis), supaya pilihan pertama muat di atas bar aksi di 360×740 |
| `petunjukLangkah?: boolean` | (v2) Baris petunjuk di kartu tugas memakai `step.hint` (isi yang diajarkan: "mobil yang mana, dan rusaknya di mana"; "baris Kerusakan benturan …") bila ada, menggantikan petunjuk mekanik umum. Cara mengetuk tetap ada di baki ("Ketuk di gambar untuk menambah") & "Cara main" |

Keenam prop v2 tidak aktif bila tidak dikirim, jadi Play, SoloMain, dan Tutorial tidak berubah (misi solo 2 tetap
"0 / 3", slot kosong, dan dialog "poin" bawaan). Hanya `cerita/ui/Aktivitas.tsx` yang mengirimnya.

**Layar akhir cerita (v2, bagian 11.1)** — `cerita/ui/LayarAkhir.tsx`:

| Komponen | Props | Perilaku |
| --- | --- | --- |
| `LayarAkhir` | `{ ep, state, bahasa, namaPemain, tx, ditemukan, onUlangBab(bab), onUlangEpisode() }` (sama dengan sebelumnya; `namaPemain` tidak lagi dipakai karena epilog tidak diulang) | Isi dari `kartuAkhir(ep, state)`; `null` bila state belum di node akhir. Akhir baik: `Link` Selesai (→ `/cerita`) + tombol "Coba jalur lain" (buka `PemilihBagian`). Akhir lain: tombol "Coba lagi dari bagian <judul>" memanggil `onUlangBab(kartu.ulang)` LANGSUNG (tanpa dialog), dengan `aria-describedby` ke kalimat akibatnya + `Link` Selesai; bila `kartu.ulang` null: "Ulang dari awal" membuka konfirmasi ulang episode yang ada. Lalu tombol teks "Lihat perjalananku" (buka `PerjalananKu`) + catatan simulasi. Konfirmasi ulang (`cerita.ulangJudul/ulangIsi/ulangYa/batal`) boleh bertumpuk di atas pemilih; "Ya" memanggil `onUlangEpisode` (CeritaMain → `useCerita.mulaiDariAwal` → `mulaiBaru`: arsip `sebab: 'perjalanan'`) |
| `PemilihBagian` | `{ ep, state, tx, disarankan, onPilih(bab), onUlangBaru(), onTutup() }` | `Modal` (lebar 480): kalimat akibat, satu tombol per `babBisaDiulang` ("Bagian n: judul" + tujuan bab; bab = `disarankan` bertanda "Disarankan"), lalu, terpisah garis di bawah daftar, "Ulang dari awal sebagai perjalanan baru" (`onUlangBaru` → konfirmasi). Kaki dialog: Tutup |
| `PerjalananKu` | `{ ep, state, bahasa, tx, ditemukan, onCobaBagian(), onTutup() }` (ekspor juga `TandaNada`) | `Modal` (lebar 600) dari `tinjauanPerjalanan`: kelompok Yang membantu / Yang perlu diperhatikan / Kenapa berakhir begini (+ "Pesan Miss Raksa" = `InfoAkhir.pelajaran`), Akhir yang ditemukan n/total (yang belum: "Belum ditemukan"), paling banyak satu tautan latihan (`/solo/main?misi=n`). Kaki: Tutup + "Coba dari bagian lain" (tutup dialog ini, buka pemilih) |

Membuka/menutup kedua dialog, Escape, dan ganti bahasa tidak mengubah state; hanya `onUlangBab` dan konfirmasi ulang
yang mengirim aksi. Kamus: `ceritaAkhir.*` (id/en/zh, nama tokoh hanya lewat `{nama}`); kata nada, status langkah,
konfirmasi ulang, dan catatan simulasi dipakai ulang dari `cerita.*` / `misi.*`.

**Dialog & aktivitas cerita (v2)**:

| Bagian | Kontrak |
| --- | --- |
| `KotakDialog({ …, sisipan?, petunjuk?, istilah? })` | `sisipan` = kalimat ajar netral (`CatatanAlasan`), tampil bersama baris PERTAMA node sesudah pilihan dan hanya setelah kalimat utuh; `petunjuk` = "Ketuk kotak ini…" (CeritaMain mengirimnya sekali per perangkat, `localStorage['raksa:cerita:petunjuk']`; penyimpanan gagal = di baris pertama episode setiap kali); `istilah: IstilahTampil[]` (dari `istilahBaris(ep, baris, tx)`) → `DaftarIstilah`: tombol "Apa itu …?" (`aria-expanded`, `aria-controls`, ≥ 44 px) setelah kalimat utuh; ketukan di area istilah tidak memajukan dialog; yang terbuka direset tiap baris |
| `CatatanAlasan({ arah, teks })` (`ui/bagian.tsx`) | Ikon info + kalimat; `arah` hanya jadi `data-arah` (tanpa warna, tanpa kata arah). Dipakai kotak dialog & Riwayat |
| `KartuPolisPeriksa({ card, arti? })` | Kartu polis dengan subjudul & baris yang punya arti menjadi tombol pengungkap (`aria-expanded`, ikon +/−); tanpa `arti` = kartu baca saja. Dipakai aktivitas polis (`sisipanJawab`) dan Catatan kasus |
| `ui/hasilAktivitas.ts` | Pembantu murni: `labelOpsi` (juga untuk opsi pensiun: label dari `akt.<akt>.opsi.<id>`), `alasanOpsi`, `rincianOpsi` (membantu / terlewat / kurang + alasan), `artiKartu`, `langkahDenganJawaban`, `buatReveal`, `ringkasAktivitas`, … |
| `AktivitasCerita` (`ui/Aktivitas.tsx`, lazy) | intro (baris pengantar terakhir + tugas `misi.instruction` + Mulai) → play (MissionPlay + 6 prop v2) → reveal (vonis, ucapan dikelompokkan per pembicara, pilihan per kelompok + alasan, "Lanjutkan cerita" = `data-cer-fokus`, "Kenapa begitu?" dengan `aria-expanded`, catatan simulasi). Kamus `ceritaAkt.*` |

**Dialog**: `Modal` (`ui/kit.tsx`) = `({ judul, children, onTutup, aksi, kembaliKe?, lebar? })`;
`kembaliKe?: HTMLElement | (() => HTMLElement | null) | null` (fungsi dibaca SAAT ditutup), `lebar?: number | string`
(bawaan 420 px). Logika bersama di `ui/modal.ts`: satu tumpukan dialog per halaman (`tumpukanDom`), latar
`inert` sadar tumpukan (`terapkanInert`), Tab/Shift+Tab berputar (`fokusBerikut`), Escape hanya dialog teratas,
gulir halaman dikunci; `useLapisanDialog(wadahRef, { onEscape, kembaliKe, fokusAwal })` untuk dialog buatan
sendiri (editor soal host); `adaDialogTerbuka()` dipakai pendengar tombol halaman (mis. Enter/Spasi di cerita)
supaya tidak bereaksi di belakang dialog. Logika inti teruji tanpa browser (`ui/modal.test.ts`).

**Akses info**: `game/aksesInfo.ts` (`aksesInfo`, `tombolUntuk`, `teksInfoAdegan`) menjamin setiap dokumen,
checklist, dan keterangan objek `info` adegan punya jalur HTML; diuji untuk semua misi (`aksesInfo.test.ts`).

**Profil & bintang**: `state/profil.ts` `bintangUntuk(akurasi)` = 3 (≥ 0,999) / 2 (≥ 0,6) / 1 (> 0) / 0.
`raksa:solo` kini `{ versi: 2, … }` (`VERSI_SOLO = 2`); format lama dimigrasi saat dibaca (bintang dihitung ulang
dari `akurasi`; akurasi, poin, kali, rekor tidak diubah), teks mentahnya dicadangkan sekali ke
`raksa:solo:cadangan-v1` (tidak terbaca: `raksa:solo:cadangan-rusak`). `CatatanMisi` lama tetap terbaca.
Pembantu tampilan solo di `pages/soloBagian.tsx` (`bintangMisi`, `sudahDicoba`, `jumlahBintang`, arti bintang).

**Merek**: `components/Merek.tsx` `({ ukuran?, nada?, tautan?, className? })` = wordmark bersama untuk header
pemain, host, dan proyektor (host/proyektor `tautan={false}`).

**Modul cerita** (`client/src/cerita/`):

| Modul | Ekspor |
| --- | --- |
| `mesin.ts` | `stateAwal`, `jalankan`, `nodeKini`, `kondisiTerpenuhi`, `barisTerlihat`, `pilihanTersedia`, `semuaBarisTampil`, `bisaLanjut`, `suasanaNasabah`, `babKini`, `latarKini`, `umpanBalikKini`, `babBisaDiulang`, `nilaiAktivitas`, `ringkasanAkhir` |
| `validasi.ts` | `validasiEpisode`, `jelajahiSemuaJalur`, `kandidatJawaban` |
| `simpan.ts` | `muatProgres`, `simpanProgres`, `mulaiBaru`, `akhirDitemukan`, `catatAkhir`, `arsipProgres`, `berlanggananCerita` + `versiPenyimpananCerita` (untuk `useSyncExternalStore`), `MAKS_ARSIP_PER_EPISODE` (5, hanya perjalanan biasa), tipe `EntriArsipCerita` & `SebabArsip` |
| `teks.ts` | `teksCerita(ep, kunci, bahasa, param)`; cadangan: bahasa diminta → Indonesia → kunci itu sendiri |
| `episode/index.ts` | `DAFTAR_EPISODE`, `cariEpisode(id)` |
| `ui/useCerita.ts` | `useCerita(ep)` → `{ state, muat, kirim, mulaiDariAwal, hanyaMemori }` |
| `ui/tampilan.ts` | Pembantu tampilan murni: `barisKini`, `kunciBaris`, `nasabahHadir`, `ekspresiNasabah`, `kunciLabelEkspresi`, `perasaanAkhir`, `nomorBab`, `statusEpisode`, … (label panggung: `ui/bagian.tsx` `labelPerasaan`) |
| `ui/tinjauan.ts` | (v2) Pembantu murni layar akhir: `kartuAkhir(ep, s)` → `KartuAkhir` (`akhir, nada, aturan, judul, sebab, pelajaran, ulang, latihan, ekspresi, sesudahnya`), `aturanAkhir`, `babUlangAkhir`, `tinjauanPerjalanan(ep, s)`, `maknaAlasan`, `hitungKata` |
| `seni/index.ts` | `TokohNasabah`, `PotretNasabah` (di bawah 60 px memakai versi kecil, `data-rinci="kecil\|normal"`), `LatarPanggung` (+ string SVG untuk adegan) |

- Adegan cerita didaftarkan lewat `client/src/game/scenes/cerita/index.ts` (`ADEGAN_CERITA`, `LABEL_CERITA`),
  lalu digabung ke registri adegan & label utama.
- Kamus: namespace `cerita` (UI mode cerita), `ceritaAkhir` (kartu akhir, pemilih bagian, perjalananku; v2),
  `ceritaAkt` (aktivitas cerita; v2). Teks episode di `episode/<id>/teks.ts`, bukan di kamus.
- Penanda DOM untuk skrip uji (bukan untuk gaya): `data-tampilan` (`dialog|aktivitas|akhir`), `data-node` (id node
  kini) di `main.cer-main`, `data-pilihan` (id pilihan) di tombol pilihan, `data-mode` (`intro|play|reveal`) di
  `.cer-aktivitas`, `data-hasil` di panel umpan balik `.cer-umpan`, `data-kelompok` + `data-opsi` di kelompok pilihan
  umpan balik, `data-status` di kartu episode, `data-cer-fokus` = tujuan fokus, `data-ekspresi` (wajah yang tampil)
  di label suasana `.cer-suasana` dan di tokoh panggung, `data-istilah` / `data-istilah-arti` (id istilah) di tombol
  & arti istilah. Layar akhir v2: `section.akh-kartu[data-nada][data-akhir][data-aturan]` (id aturan kartu),
  `data-ukur="akhir-judul|akhir-pelajaran|aksi-utama|aksi-kedua"` (pengukuran), `data-bab` di tombol "Coba lagi
  dari bagian …" dan tombol pemilih, `data-kelompok` di kelompok "Lihat perjalananku". Kelas `.cer-akhir*`,
  `.cer-kamu`, dan `#cer-akhir-judul` (layar akhir lama) sudah dihapus.
- Server, kontrak socket, penilaian pertandingan, dan kunci jawaban server-only TIDAK diubah.

## 7. Pengujian
Unit: mesin (percabangan, efek sekali, no-op, cadangan bab), simpan (versi, arsip, rusak), validasi + jelajah
semua jalur episode, migrasi bintang, akses dokumen/checklist HTML, logika perangkap fokus. Browser (skrip di
`tools/`): episode sampai tiap akhir termasuk pemulihan, muat ulang/lanjut, ganti bahasa, ulang episode,
progres lama; checklist penuh/ringan/engine gagal; fokus modal; hasil & bintang; regresi e2e acara
(`npm run test:e2e`, `npm run test:acara`). Viewport 360×740, 390×844, 768×1024, 844×390, 1440×900; gerak
aktif & dikurangi. Semua emulasi Chrome, bukan HP fisik.
Skrip browser: `tools/uji-cerita.mjs` (`npm run test:cerita`, episode & progres) dan `tools/uji-temuan-review.mjs`
(`npm run test:review`, target terukur temuan A–F); prasyarat & hasil dicatat di README bagian 12.

**Tambahan v2 (bagian 11), unit** (semua di skrip `test:client` kecuali yang ditandai):

| Berkas | Yang dijaga |
| --- | --- |
| `cerita/ui/tinjauan.test.ts` | Kartu akhir dipilih dari keputusan nyata (bukan angka kepercayaan / urutan alasan); jalur janjikan = kalimat brief; SEMUA keadaan akhir yang terjangkau (termasuk beda tanda `akt:`) punya aturan, titik ulang yang benar-benar bisa diulang, dan tinjauan jujur; tiap aturan terpakai di suatu jalur (kecuali cadangan `dingin-jarak`); pelajaran 15–25 kata, sebab ≤ 22 kata, judul ≤ 8 kata (id) |
| `cerita/episode/auto-1/episode.test.ts` ("v2 …") | Pembuka (satu perkenalan peran, masalah Bu Rina di baris ke-3, kata sehari-hari sebelum istilah); pilihan 8–20 kata & 2–3 tampil; tepat satu pilihan yang menolong per titik dan ia terpanjang di paling banyak separuh titik; jawaban kartu yang tepat bukan yang terpanjang; lima istilah ditandai di baris PERTAMA pemakaiannya (id/en/zh), arti 1–2 kalimat, tidak di baris node aktivitas; kalimat aktivitas tidak saling mengulang (termasuk tujuan bab); alasan semua opsi, arti tiap baris kartu, tanpa 75%/TLO; kunci pensiun tetap terbaca |
| `cerita/simpan.test.ts` | `jepitBaris`: simpanan di node yang dipangkas dimuat, dijepit, dan `lanjut` maju; simpanan lama `ambang-tlo` tetap bisa selesai; kunci pensiun terbaca di Riwayat id/en/zh |
| `cerita/validasi.test.ts` | `opsiPensiun`; rujukan `alasanOpsi` / `kartuArti` (opsi, kartu, jumlah baris, kunci teks) |
| `cerita/seni/seni.test.ts` | Potret kecil, garis hangat, jendela potret, animasi ≤ 200 ms & mati saat gerak dikurangi |
| `cerita/ui/hasilAktivitas.test.ts` | Rincian per opsi setelah dikirim (membantu / terlewat / kurang membantu + alasan), label opsi pensiun dari simpanan lama, arti baris kartu polis |
| `i18n/terjemahan.test.ts` | Kunci & parameter `ceritaAkhir`, `ceritaAkt`, `cerita` sama di id/en/zh |

**Browser v2**: `tools/uji-cerita.mjs` (`npm run test:cerita`) dan `tools/uji-temuan-review.mjs --cerita`
(`npm run test:review`) sudah diperbarui untuk v2. Harapan dibaca dari sumber (teks episode id/en/zh, kamus `cerita`,
`ceritaAkhir`, `ceritaAkt`, `misi`, aturan `KARTU_AKHIR`, `MAKNA`), bukan ditulis ulang. Grup baru `kartu`: kartu akhir
per jalur (judul, sebab, pelajaran, dua aksi, tanpa epilog/daftar bab, ≤ 90 kata, aksi tanpa gulir di 390×844 &
360×740, target ≥ 44 px), "Lihat perjalananku", pemilih bagian & konfirmasi ulang (arsip), "Coba lagi" mendarat di awal
bab yang benar, muat ulang di akhir, ganti bahasa tanpa ubah state, 844×390 & zoom 200 %, keyboard, animasi ≤ 200 ms.
Grup lain ikut v2: tanpa gema "Kamu:", satu kalimat ajar netral, petunjuk sekali + Bantuan, tombol "Apa itu …?", album
"n/3 foto", dialog foto belum lengkap khusus cerita (tanpa kata poin/waktu), "Pilih lewat daftar" tidak tertutup bar,
kartu polis bisa diperiksa di atas tiga pilihan, mode ringan / engine gagal. Hasil terakhir: bagian 11.7.
Uji HP fisik & uji pemula tanpa pendamping: [`docs/cerita/UJI-PEMULA.md`](cerita/UJI-PEMULA.md) (**belum
dijalankan**).

## 8. Menambah episode
Lihat [`docs/cerita/PANDUAN-EPISODE.md`](cerita/PANDUAN-EPISODE.md): salin pola `episode/auto-1`, daftarkan di
`episode/index.ts` paling akhir, jalankan tes validasi. Episode yang belum lengkap TIDAK didaftarkan (tidak tampil
sebagai kartu yang bisa dimainkan). Peta usulan episode berikutnya (belum dibuat) ada di panduan itu, bagian 9.

## 9. Reproduksi lokal sebelum perbaikan (build 99fb182, 26 Sep)
A: mode ringan misi 3 → kanvas 0, tidak ada tombol checklist/dokumen. B: fokus tetap di "Dokumen" setelah
dialog terbuka, Tab → "Cara main" (di belakang dialog), latar tidak inert. C: kunjungan pertama misi 1 390×844 →
adegan y=608, pilihan pertama y=968, bar aksi y=747, cerita & bantuan terbuka, bonus 18→16 dtk tanpa interaksi.
D: jawaban salah → vonis y=539, "Coba lagi" y=807. E: 0 poin, "1 dari 3 bintang", tersimpan `bintang:1`.

## 10. Catatan implementasi (gelombang 1, 26 September 2026)

Penyimpangan dari kontrak di atas dan perjelasan yang muncul saat kode ditulis. Kode adalah sumber kebenaran;
baris tabel 3.1 yang terdampak sudah diberi rujukan ke sini. Hasil pengujian dicatat di README bagian 12.

### 10.1 Graf & naskah AUTO-1

1. **`bagian-disimpan` dicatat oleh node sendiri lewat cabang.** `Efek` tidak punya `jika`, jadi baris
   `b2-cerita.6` ("pecahan penutup lampunya saya pungut") dipindah ke node `b2-cerita-bagian`, yang hanya dicapai
   lewat cabang `b2-cerita-cabang` bila `dengar-dulu`; efek node itu mencatat butirnya saat Bu Rina selesai
   menyebutnya. (Gelombang 1 memasangnya di pilihan `dengar`/`maaf`, sehingga butir itu tampil di Catatan kasus
   sebelum Bu Rina menyebutnya; sudah diperbaiki.)
2. **Pilihan bernilai 0 memakai `kepercayaan: 0` + alasan.** `b2-bengkel-akibat` (`koreksi`, `biarkan`) dan
   `b3-bukti-kurang` (`lengkapi`, `cukup`): pemain melihat "Suasana tetap" beserta alasannya (arah `tetap`).
   Validasi menerima 0 dengan alasan; detektor cabang palsu menganggap 0 sama dengan tidak ada.
3. **Cabang hasil aktivitas terakhir selalu tanpa `jika` (cadangan).** `b3-bukti`: cabang 2 = sebagian, belum,
   atau jawaban kosong. `b4-polis`: cabang 4 = `ambang-tlo` DAN jawaban kosong/tak cocok (baris umpan balik 4.1
   khusus `ambang-tlo`, 4.2 untuk lainnya). Validasi kini mewajibkan pola ini.
4. **`b5-keberatan` punya dua ralat.**
   - `ralat-janji` dipersempit: tersedia bila `janji-awal` DAN BUKAN `janji-polis` (janji di awal, kartu dibaca
     tepat).
   - Baru, `ralat-polis`: tersedia bila `janji-polis` (kartu sempat dijelaskan "pasti diganti"). Efek: kepercayaan
     -1 dengan alasan; cabut `janji-awal`, `janji-polis`, `janji-waktu`; paham `polis-dinilai`, `risiko-sendiri`;
     proses `tanpa-janji` = `dikoreksi` DAN `baca-polis` = `dikoreksi`. (`langkah-berikut` tetap hanya dari
     `b5-rangkum-jelas`, lihat no. 8.)
   - Alasan: dengan kontrak lama, jalur "pasti diganti" hanya bisa meralat janji waktu tanpa meluruskan isi kartu,
     sehingga `polis-dinilai` tidak pernah terpenuhi dan jalur itu tidak punya pemulihan menuju akhir baik.
   - Diperiksa dengan mesin sungguhan (26 Sep): dengar → dokumentasi → bukti tepat → `pasti-diganti` →
     `ralat-polis` → `rangkum` = **tuntas** (ringkasan: baca-polis & tanpa-janji "Diperbaiki"); sama tetapi
     `singkat` = dingin; prosedur → tetap → … → `ralat-polis` → `rangkum` = dingin (kepercayaan kurang);
     janji → … → `pasti-diganti` → `ralat-polis` → `rangkum` = tuntas (`ralat-janji` tidak ditawarkan di jalur ini).
   - Kalimat & efeknya dicatat di `docs/cerita/TINJAUAN-PIC-CLAIM.md` bagian K.
5. **Urutan pilihan di data berbeda dari tabel 3.1** (mis. `b1-datang`: prosedur, dengar, janji; `b2-saran`:
   bengkel, dokumentasi, ringan) dan tidak diacak saat tampil: pilihan terbaik sengaja tidak selalu di depan.
6. **Latar `kantor`** = meja layanan tampak depan yang digambar dari bahan & warna latar m05, bukan latar m05 utuh
   (tampak atas dengan papan bertulisan yang akan terpotong dan bertumpuk dengan tokoh). **`parkiran`** = latar m01
   utuh + mobil Bu Rina (plat tanpa tulisan). Latar panggung tanpa teks.
7. `DAFTAR_EPISODE` menyaring `null`, jadi modul episode yang belum siap boleh mengekspor `null`.
8. **`langkah-berikut` hanya dari penutup yang benar-benar merangkum** (tinjauan internal 26 Sep). Dulu `jujur`,
   `ralat-janji`, dan `ralat-polis` ikut memasangnya, padahal kalimatnya tidak menyebut urutan langkah; akibatnya
   penutup `singkat` ("nanti dikabari") bisa berakhir `tuntas`. Kini `rangkum` → cabang `b5-rangkum` →
   `b5-rangkum-jelas` (memasang `langkah-berikut`) / `-janji` / `-bengkel` (tidak memasang, Bu Rina menanggapi
   dengan janji atau rencana lamanya). Jalur "terbaik tapi menutup `singkat`" kini berakhir `dingin`, dengan pesan
   mentor `akhir-dingin.6` ("nanti dikabari" belum menjawab "setelah ini saya harus apa").
9. **`b3-bukti-kurang` punya node tindak lanjut**: `lengkapi` → `b3-lengkapi` (narasi foto yang terlewat benar-benar
   ditambahkan; catat `bukti-lengkap`), `cukup` → `b3-cukup` (Miss Raksa menyebut akibatnya bagi nasabah; catat
   `bukti-kurang`). Sebelumnya kedua pilihan langsung ke `b4-polis-intro` tanpa menampilkan apa pun.
10. **`aturan-janji`**: kalimat sama dengan `aturan`, tersedia bila sudah ada janji. Menunjuk aturan tidak
    meluruskan janji lama, jadi butir "tidak menjanjikan" tidak berubah menjadi tepat (pada `aturan` tanpa janji
    sebelumnya butir itu tepat; komunikasinya yang buruk).
11. **Konvensi node akhir** (konvensi penulisan; untuk AUTO-1 dijaga `ui/tampilan.test.ts`): di node `akhir`, baris
    narasi menandai pergantian adegan (nasabah pergi, waktu berlalu, atau kabar lewat telepon). Sesudah narasi
    pertama tampil, Bu Rina tidak lagi berdiri di panggung (`nasabahHadir`); ucapannya tetap tampil dengan potret di
    kotak dialog. Ucapan terakhir nasabah di epilog **wajib berekspresi**: ringkasan akhir memakai ekspresi itu
    (`perasaanAkhir`), dan bila ucapan itu terjadi sesudah pergantian adegan dan katanya berbeda dari suasana saat
    pulang, ringkasan menulis dua keadaan ("Saat meninggalkan meja layanan: …" → "Sesudahnya: …").

### 10.2 Tampilan cerita (keputusan tata letak)

- **Header dua baris.** Baris 1: wordmark (hanya layar lebar) + "Daftar cerita", "Bagian n/5 · judul bab",
  bahasa, suara. Baris 2: "Tujuan: …" + tombol Riwayat dan Catatan kasus (≥ 44 px).
- **Satu tampilan pada satu waktu**: `dialog` (panggung + kotak dialog + pilihan), `aktivitas`, atau `akhir`;
  tidak ditumpuk di HP.
- ~~**"Kamu: …" dan alasan hanya bersama reaksi pertama**~~ (digantikan 11.3): gema "Kamu: …" dihapus; yang tersisa
  hanya kalimat ajar netral bersama baris PERTAMA node berikutnya, setelah kalimat itu utuh. Pilihan & kalimat ajar
  tetap ada di Riwayat; tinjauan akhir ada di "Lihat perjalananku".
- **Bu Rina muncul di panggung setelah ia bicara** pertama kali; pembuka Miss Raksa tampil dengan latar saja.
  Label suasana di panggung "Bu Rina · Cemas" (tanpa angka) **mengikuti wajah yang tampil** (bagian 3), jadi
  reaksi "bingung" tertulis "Bingung", bukan label dari angka kepercayaan. Di epilog, sesudah narasi pergantian
  adegan, Bu Rina tidak lagi berdiri di panggung (10.1 no. 11).
- **Kartu intro aktivitas** (diringkas di 11.5): "Aktivitas klaim · judul", baris pengantar terakhir, "Tugasmu"
  (satu kalimat), tombol Mulai. Kartu polis, cara main ringkas, dan "Tidak ada waktu yang berjalan" TIDAK lagi di
  kartu ini (kartu polis kini di atas pilihan saat menjawab; cara main & dokumen di kepala tugas). Umpan balik:
  vonis, reaksi/mentor, pilihan per kelompok + alasan singkat, "Lanjutkan cerita", lipatan "Kenapa begitu?", catatan
  simulasi. Chunk aktivitas (MissionPlay + engine) dimuat lazy dan diunduh lebih awal satu langkah sebelum aktivitas.
- **Mengetik** ±40 huruf/detik; ketukan/Enter/Spasi pertama = kalimat utuh, berikutnya = lanjut; Enter/Spasi
  diabaikan bila fokus di kontrol atau ada dialog terbuka. Petunjuk "Ketuk kotak ini atau tekan Enter" hanya di
  baris pertama episode, dan sejak v2 hanya SEKALI per perangkat (11.3; sesudahnya di tombol Bantuan). Gerak
  dikurangi = kalimat langsung utuh. Pembaca layar: live region sekali per baris.
- **Fokus & gulir**: saat tampilan berganti halaman kembali ke atas; bila fokus hilang, fokus pindah ke pertanyaan
  pilihan, judul kartu aktivitas, atau judul akhir (`data-cer-fokus`).
- ~~**Layar akhir**: ikhtisar dua baris, "Main lagi atau lanjut", dua kolom, empat latihan~~ (digantikan 11.1:
  satu kartu + dua dialog). Yang tetap: akhir yang belum ditemukan tersamar ("Belum ditemukan") tanpa bocoran judul;
  ulang episode meminta konfirmasi dan mengarsipkan; "coba jalur lain" per bab; perasaan nasabah mengikuti ucapan
  terakhirnya di epilog (10.1 no. 11), bukan hanya kepercayaan.
- **Daftar `/cerita`**: kartu berstatus Baru / Sedang berjalan · Bagian n/5 / Selesai ("Main lagi dari awal"
  mengarsipkan perjalanan lama; "Lihat hasil", dulu "Lihat ringkasan") / "Progres lama perlu dimulai ulang"; "Akhir
  ditemukan n/5"; tautan Latihan misi & Gabung acara; "Episode berikutnya sedang disiapkan". v2: pengantar satu
  baris (`cerita.hubIntro`) tanpa mengulang peran.
- Penyimpanan diblokir/penuh: pesan "progres hanya bertahan selama halaman ini terbuka".
- Penanda DOM untuk skrip uji: bagian 6.

### 10.3 Mesin, validasi, penyimpanan

- API mesin lebih luas dari tabel bagian 2 (pembantu tampilan); daftar lengkap di bagian 6.
- **Validasi tambahan** di luar 2.5: node `mulai` wajib punya latar; satu aktivitas dipakai tepat satu node; id
  misi sintetis unik; misi en/zh harus sama id/langkah/opsi dengan misi id; tanda `akt:` tidak boleh dipasang efek;
  tanda tidak boleh dipasang & dicabut dalam satu efek; tanda yang diperiksa harus pernah dipasang;
  `akt:<id>:lewat:<opsi>` hanya untuk opsi benar; cabang hasil tanpa `jika` hanya boleh yang terakhir dan yang
  terakhir wajib tanpa `jika`; tiap cabang node `cabang` wajib `jika` (+ `lainnya`); putaran antar node cabang;
  akhir/bab/aktivitas yang tidak terpakai; angka di teks id harus ada di terjemahan (zh boleh menambah angka bulan
  1–12). Penjelajahan jalur juga memeriksa ≥ 2 pilihan tersedia di setiap jalur dan pilihan/jawaban yang ditolak
  mesin (pemain macet), dengan batas 1.000 langkah dan 200.000 keadaan.
- **Penyimpanan**: `muatProgres` tidak pernah menulis. `simpanProgres` juga mengarsipkan entri lama yang tidak
  cocok (bukan hanya `mulaiBaru`). Data yang tidak terbaca dicadangkan ke `raksa:cerita:rusak:<ms>` sebelum
  ditimpa; bila pencadangan gagal (penyimpanan penuh), perubahan hanya disimpan di memori. `migrasi` dipilih
  berdasarkan versi tersimpan (tidak berantai). Titik "coba jalur lain" yang node-nya hilang dilewati.
  `mulaiBaru` tidak mengarsipkan progres yang belum berjalan (langkah 0). Arsip: perjalanan biasa (`sebab:
  'perjalanan'`) maks 5 per episode, yang terlama dirotasi; progres tidak cocok (`sebab` = alasan tidak cocok, atau
  entri lama tanpa `sebab`) tidak pernah dirotasi (bagian 2.4).
- **Nilai aktivitas**: `tepat` bila akurasi ≥ 0,999; tanda `pilih`/`lewat` diurutkan menurut urutan opsi di misi,
  jadi tidak bergantung urutan ketukan.

### 10.4 Perbaikan A–F: keputusan yang perlu diketahui

- **A/B**: checklist, dokumen, dan keterangan objek `info` punya tombol HTML di semua mode adegan; dialog memakai
  tumpukan `ui/modal.ts` (bagian 6).
- **C**: bonus solo berjalan setelah "Siap mulai" DAN adegan melapor siap; bila adegan tak kunjung siap, hitungan
  mulai 8 detik setelah "Siap mulai" (pemain sudah bisa menjawab lewat daftar). Kunjungan pertama: `kiatAwal`
  satu baris. Pertandingan: deadline tidak berubah; kartu briefing di HP menampilkan cara main ringkas + tombol info.
- **D**: di HP, mode intro/terkirim/waktu habis/pembahasan menaruh panel (kartu atau vonis + tombol) di atas dan
  adegan yang diperkecil di bawahnya (`game/stage.css`); berlaku untuk solo dan pertandingan.
- **E**: bintang versi 2 + migrasi (bagian 6); "sudah dicoba" = tanda terpisah; arti bintang dijelaskan di peta,
  hasil misi, dan hasil akhir.
- **F**: halaman awal tiga pintu: **Main cerita** (Miss Raksa, tanda "Mulai di sini"), **Latihan misi** (Raki),
  **Gabung acara** (Bu Isti), dengan bingkai potret bulat yang sama; wordmark `Merek` di header pemain, cerita,
  host, dan proyektor.

### 10.5 Belum beres / keputusan terbuka

- **Seni nasabah hanya Bu Rina dan latar hanya `kantor`/`parkiran`.** Episode kedua butuh perluasan kontrak
  (`docs/cerita/PANDUAN-EPISODE.md` bagian 4.3).
- `game/scenes/cerita/cerita.test.ts` mengunci daftar adegan = dua adegan AUTO-1; perlu digeneralisasi saat
  episode kedua dibuat.
- Naskah, istilah terjemahan, jalur `ralat-polis`, sebutan jabatan Miss Raksa ("Senior Layanan Klaim"), dan
  pengecoh aktivitas bukti belum ditinjau PIC Claim maupun penutur asli (`docs/cerita/TINJAUAN-PIC-CLAIM.md`).
- (Selesai) `bagian-disimpan` yang dulu tampil lebih awal di Catatan kasus: diperbaiki lewat `b2-cerita-bagian`
  (10.1 no. 1).

### 10.6 Ketahanan halaman, input adegan, judul halaman (tinjauan lanjutan 26 September 2026)

- **Klik tembus ke adegan**: tombol HTML yang kebetulan berada di atas kanvas (bar aksi lengket, kartu) tidak boleh
  ikut mengenai objek adegan di bawahnya. Dua lapis: engine Phaser dibuat dengan `input.windowEvents: false`
  (`game/engine/stage.ts`), dan ketukan hanya dihitung bila sasaran DOM event-nya kanvas itu sendiri
  (`MissionScene.dariKanvas`). Diuji browser: `tools/uji-cerita.mjs` (uji `tata`, "klik tembus").
- **Galat tingkat rute**: `BatasRute` di `App.tsx` menangkap chunk halaman yang gagal diunduh (jaringan putus sesaat,
  deploy baru mengganti nama berkas) atau galat render, lalu menampilkan pesan + "muat ulang" + tautan halaman awal
  (kamus `umum.gagalHalaman*`), bukan layar putih. Keadaan galat direset saat alamat berganti.
- **Galat aktivitas cerita**: `cerita/ui/BatasGagal.tsx` membungkus aktivitas (chunk lazy MissionPlay + adegan) per
  node; pesannya menawarkan muat ulang, dan menyebut jujur apakah progres tersimpan di perangkat (muat ulang kembali
  ke node yang sama) atau tidak (penyimpanan diblokir: cerita mulai dari awal).
- **Judul tab & fokus setelah pindah halaman**: `ui/halaman.ts` `useHalaman(judul)` (otomatis lewat `PlayerShell`;
  Host, Projector, pemain cerita, dan pesan galat rute memanggilnya sendiri). Judul "<judul> – RAKSA GAME"; setelah
  navigasi oleh pengguna, fokus pindah ke `<h1>` halaman baru (bukan `<body>`), kecuali halaman sudah memegang
  fokus. Pemain cerita: "<judul episode> · Bagian n/5" (layar akhir: judul akhir).
- **Fokus keyboard vs bar aksi lengket** di aktivitas cerita diuji dengan pola `periksaFokusBar` yang sama dengan
  latihan misi (`tools/e2e-browser.mjs` → `tools/uji-cerita.mjs` uji `tata`).

## 11. Revisi v2: alur belajar & layar akhir (26 September 2026)

Sumber: tinjauan "story flow and beginner learning" (26 Sep, build 4230;
`C:\Users\User\Desktop\raksa-story-review-20260926\REVIEW.md`). Bagian ini **menggantikan** aturan layar akhir di
bagian 4 (ringkasan dua kolom, epilog diulang, 11 aksi) dan aturan "Kamu: …" + alasan berwarna di bagian 4 / 10.2.
Mesin (`mesin.ts` tidak diubah), graf, id node/pilihan/tanda/efek, lima akhir, ralat, simpanan, titik bab, arsip,
akhir yang ditemukan, dan semantik mulai ulang TIDAK berubah; perubahan ada di tampilan, metadata tampilan, dan
naskah. `versi` AUTO-1 tetap 1.

Status: **diimplementasikan** 26 September 2026. Isi bagian ini disesuaikan dengan kode (dibaca langsung, bukan dari
laporan), termasuk penyimpangan kecil dari rumusan awal (ditandai "Penyimpangan"). Yang belum beres: 11.8.

### 11.0 Tujuan & batas

- Pemula paham: siapa yang dibantu, apa langkah berikutnya, kenapa sebuah tindakan berpengaruh, dan satu konsep
  asuransi. Lingkaran inti: **situasi → pilihan/tindakan → akibat yang terlihat → satu penjelasan singkat**.
- Tetap: palet, tokoh, premis, tiga pintu dari halaman awal, HP, tempo santai, cabang & jalur pemulihan, pemisahan
  perasaan nasabah vs ketepatan langkah klaim.
- **Tidak pernah** ditambahkan: skor, timer, streak, kuis wajib, atau bahasa "poin"/"waktu habis" di mode cerita.
- Phaser + React tetap: React/HTML untuk dialog & akhir, React/SVG untuk panggung, Phaser (lazy) untuk aktivitas.

### 11.1 Layar akhir = satu kartu (`cerita/ui/LayarAkhir.tsx`, `akhir.css`)

Epilog dibaca SEKALI di kotak dialog (tetap ada di Riwayat). Setelah baris epilog terakhir tombolnya "Lihat hasil"
(`cerita.lihatRingkasan`); muat ulang di node akhir yang epilognya sudah habis langsung membuka kartu (`akhirDibuka`).
Kartu, dari atas ke bawah:

1. Potret Bu Rina 64 px dengan wajah AKHIR (`kartuAkhir().ekspresi`: ucapan nasabah terakhir di epilog, mis. kesal
   saat menelepon beberapa hari kemudian) + label perasaan singkat: "Bu Rina: Senang" (`ceritaAkhir.perasaanAkhir`)
   atau "Sesudahnya: Kesal" (`ceritaAkhir.perasaanSesudah`) bila `sesudahnya`. Katanya dari `labelPerasaan` (bagian 3).
2. Nama akhir kecil: ikon nada (bentuk ✓ / gelombang / !, bukan warna saja) + **kata nada yang terlihat** +
   judul akhir koleksi, mis. "Akhir campuran: **Lega Sesaat**".
3. **Judul hasil** `h2#akh-judul` (`tabIndex=-1`, `data-cer-fokus`, `data-ukur="akhir-judul"`), dari sisi nasabah
   ("Bu Rina tahu langkah berikutnya").
4. Satu kalimat sebab-akibat tentang Bu Rina (`kartu.<aturan>.sebab`).
5. **Pelajaran**: label + potret kecil Miss Raksa + satu kalimat 15–25 kata (`kartu.<aturan>.pelajaran`,
   `data-ukur="akhir-pelajaran"`). Episode tanpa `kartuAkhir`: judul & ringkas `InfoAkhir`, tanpa blok pelajaran.
6. Dua aksi (`data-ukur="aksi-utama"` / `"aksi-kedua"`, tinggi ≥ 48 px):
   - akhir baik (`nada: 'baik'`): utama **Selesai** (tautan ke `/cerita`), kedua **Coba jalur lain** (pemilih bagian);
   - akhir lain: utama **Coba lagi dari bagian <judul bab>** (`kartuAkhir().ulang`, langsung `ulangBab`, tanpa dialog)
     dengan `aria-describedby` ke satu kalimat kecil "Pilihanmu sejak bagian itu diganti; akhir yang sudah ditemukan
     tetap tercatat.", kedua **Selesai**;
   - akhir lain tanpa bab yang bisa diulang (`ulang` null): utama **Ulang dari awal** → konfirmasi ulang episode
     yang ada (kalimat kecilnya `cerita.ulangIsi`).
7. Tombol teks **Lihat perjalananku** + catatan simulasi (`misi.catatanSimulasiPeriksa`).

Tidak ada di kartu: epilog, "Episode berikutnya", daftar bab, tautan latihan, skor. Kartu muncul dengan fade + geser
6 px selama 180 ms; mati saat gerak dikurangi (`:root:not([data-gerak="penuh"])`). Teks isi ±16 px; batas ≤ 90 kata
Indonesia termasuk label & catatan simulasi (terukur 60–78, 11.7).

**Pemilih bagian** (`PemilihBagian.tsx`, `Modal` lebar 480): dibuka dari "Coba jalur lain" (akhir baik) dan dari
"Coba dari bagian lain" di "Lihat perjalananku" (semua akhir). Isi: kalimat "Cerita diulang dari awal bagian itu;
pilihanmu sesudahnya diganti. Akhir yang sudah ditemukan tetap tercatat."; satu tombol per `babBisaDiulang`
("Bagian n: judul" + kalimat tujuan bab, ≥ 44 px); bab titik ulang akhir yang belum baik bertanda netral
**Disarankan**; lalu, dipisah garis, **Ulang dari awal sebagai perjalanan baru** → konfirmasi yang ada
(`cerita.ulangJudul/ulangIsi/ulangYa/batal`, bertumpuk di atas pemilih) → `useCerita.mulaiDariAwal` (`simpan.ts`
`mulaiBaru`: perjalanan lama diarsipkan dengan `sebab: 'perjalanan'`, state kembali ke awal), sama dengan "Ulang
episode" v1.
Kaki dialog: **Tutup**. *Penyimpangan*: rumusan awal menaruh "Ulang dari awal…" di kaki dialog; di HP dua tombol kaki
membungkus buruk, jadi tombol itu menjadi butir terakhir isi dialog.
Keputusan: pada akhir yang belum baik kartu tidak punya tombol pemilih (satu aksi utama + satu kedua); pemilih
tetap terjangkau lewat "Lihat perjalananku" → "Coba dari bagian lain".

**Lihat perjalananku** (`PerjalananKu.tsx`, `Modal` lebar 600, dapat digulir keyboard/sentuh): tiga kelompok (`h4`)
— **Yang membantu**, **Yang perlu diperhatikan**, **Kenapa berakhir begini** — dan di dua kelompok pertama sub-daftar
berlabel (`h5` + `aria-labelledby`): *Perasaan Bu Rina* (alasan; butir abu netral, tanpa hijau/merah atau kata arah
suasana; ralat bertanda "Diperbaiki"), *Langkah klaim* (`TandaProses`: Tepat / Diperbaiki / Keliru / "Belum
dilakukan"), *Yang dipahami / Yang belum dipahami Bu Rina*. Kelompok kosong ditulis jujur ("Belum ada yang tercatat
membantu di perjalanan ini." / "Tidak ada yang tertinggal di perjalanan ini."; kalimat terakhir HANYA untuk akhir baik:
pada akhir yang belum baik dengan semua kekeliruan sudah diluruskan, mis. dingin-ralat, `tinjauanPerjalanan().perhatianKosong`
= 'diluruskan' dan tampil "Semua langkah akhirnya diluruskan, tetapi Bu Rina belum sepenuhnya tenang. Penyebabnya ada di
bawah."). "Kenapa berakhir begini" = kalimat
sebab kartu + "Pesan Miss Raksa" (`InfoAkhir.pelajaran`). Lalu "Akhir yang ditemukan n/5" (yang belum: "?" +
"Belum ditemukan", tanpa bocoran judul; yang ini: "akhir ini") dan paling banyak SATU "Latihan terkait (tidak wajib)"
(`kartuAkhir().latihan` → `/solo/main?misi=n`). Kaki: **Tutup** + **Coba dari bagian lain** (menutup tinjauan, membuka
pemilih; menutup pemilih mengembalikan fokus ke "Lihat perjalananku").

Membuka/menutup tinjauan dan pemilih, Escape, dan ganti bahasa tidak mengubah state (hanya tombol bab, lewat aksi
`ulangBab`, dan konfirmasi ulang yang mengubahnya). Teks antarmuka: kamus `ceritaAkhir` (32 kunci, id/en/zh; nama tokoh hanya lewat
`{nama}`). Kontrak props: bagian 6.

### 11.2 Data kartu akhir & tinjauan

- Tipe (`tipe.ts`): `AturanAkhir` (`id, akhir, jika?, judul, sebab, pelajaran, ulang?, latihan?`), `MaknaAlasan`
  (`membantu | perhatian | ralat`, `diluruskan?`), `Istilah` (`label, arti`); `Episode.kartuAkhir`, `Episode.makna`,
  `Episode.istilah`, `Baris.istilah`; `DefAktivitas.alasanOpsi`, `DefAktivitas.kartuArti`.
- Pembantu murni `cerita/ui/tinjauan.ts`: `kartuAkhir(ep, s)`, `aturanAkhir`, `babUlangAkhir`,
  `tinjauanPerjalanan(ep, s)`, `maknaAlasan`, `hitungKata`. Aturan pertama yang `akhir`-nya sama dan `jika`-nya
  terpenuhi dipakai; tidak memakai tiga alasan pertama atau angka kepercayaan (dites dengan kepercayaan diubah &
  riwayat dibalik). Titik ulang = kandidat `ulang` pertama yang `jika`-nya terpenuhi; bila babnya tidak bisa diulang di
  perjalanan ini, bab terakhir yang bisa diulang sebelum bab itu; tanpa kandidat cocok, bab terakhir yang bisa diulang.
  Akhir baik tidak punya titik ulang (pemilih bagian).
- Tinjauan: alasan bermakna `perhatian` yang `diluruskan`-nya terpenuhi di state akhir tidak tampil (ralatnya tampil
  di "Yang membantu" sebagai "Diperbaiki"); proses `tepat`/`dikoreksi` → membantu, `keliru`/tak tersentuh →
  perhatian; paham sudah/belum dipisah.
- AUTO-1 (`episode.ts`): 18 aturan `KARTU_AKHIR` (tuntas 6, janji 3, dingin 5, tertunda 2, pergi 2), urutannya
  mengikuti baris epilog supaya kartu tidak membantah epilog yang baru dibaca; pembantu `aturan(id, akhir, judul, …)`
  → kunci `kartu.<judul>.judul` (8 judul dipakai bersama) dan `kartu.<id>.sebab|pelajaran`. `MAKNA` untuk ke-28
  kunci alasan. Jalur janjikan (`janji-besok`): "Bu Rina mengandalkan ucapanmu bahwa besok selesai, padahal waktunya
  belum bisa dipastikan." Kalimat kartu = DRAF (`docs/cerita/TINJAUAN-PIC-CLAIM.md` bagian N).
- Validasi (`validasi.ts`): id aturan unik, akhir ada, tiap akhir punya aturan cadangan tanpa `jika` dan tidak ada
  aturan sesudah cadangannya, kunci teks & kondisi sah, bab `ulang` ada, `latihan` bilangan bulat ≥ 1 (keberadaan
  misinya TIDAK diperiksa; tautan yang tidak ditemukan disembunyikan); `makna` untuk setiap alasan graf, tidak ada
  makna yatim, `diluruskan` hanya untuk `perhatian`; `Baris.istilah` merujuk id yang ada; label/arti istilah ada.
- Tes `cerita/ui/tinjauan.test.ts`: semua keadaan akhir terjangkau (termasuk beda tanda `akt:`) punya aturan dan titik
  ulang yang bisa diulang; tinjauan jujur (tidak ada langkah benar di "perhatian", tidak ada langkah keliru di
  "membantu", akhir tuntas tanpa langkah keliru); setiap aturan terpakai di suatu jalur kecuali cadangan
  `dingin-jarak`; pelajaran 15–25 kata, sebab ≤ 22 kata, judul ≤ 8 kata (id).

### 11.3 Tempo, orientasi, dan dialog

- **Satu perkenalan peran** di awal episode: `b1-mentor.1` ("… kamu membantu pelanggan asuransi (nasabah) yang
  melaporkan kerugian (klaim). Aku di sampingmu; ini simulasi."), lalu narasi pintu (`.4`), lalu masalah Bu Rina
  (`b1-datang.1`) = baris ke-3 (dites). Kata sehari-hari lebih dulu: "pelanggan asuransi" sebelum "nasabah",
  "kerugian" sebelum "klaim", "dokumen perlindungan" sebelum "polis"; pilihan `b1-datang.prosedur` memakai "data
  asuransi", bukan "nomor polis".
- Halaman lain tidak mengulang peran: pintu Main cerita "Bantu seorang pelanggan, langkah demi langkah. Tanpa timer."
  (`pemain.pintuCeritaIsi`); `/cerita` satu baris pengantar (`cerita.hubIntro`); Kenalan menuju `/cerita…` (bukan
  `?ubah=1`): sapaan umum, nama lebih dulu, **tampilan karakter opsional** di balik "Ubah tampilan (opsional)"
  (`aria-expanded`, `LOOK_BAWAAN` sudah terpilih sehingga bisa langsung disimpan); tujuan lain dan `?ubah=1` memakai
  tata letak lama. Kartu aktivitas: satu kalimat tugas (11.5).
- Petunjuk "Ketuk kotak ini atau tekan Enter untuk lanjut." tampil SEKALI per perangkat (`localStorage
  ['raksa:cerita:petunjuk']`, dicatat saat pertama tampil, tetap terlihat sampai pemain maju; setiap akses dalam
  try/catch). Penyimpanan tidak bisa dibaca/ditulis = tampil di baris pertama episode setiap kali (perilaku lama).
  Sesudahnya tersedia lewat tombol **Bantuan** di header (Modal "Cara bermain", 4 baris: lanjut, Riwayat, Catatan
  kasus, tombol istilah; tanpa bahasa waktu/poin).
- Setelah memilih: TIDAK ada gema "Kamu: …" (pilihan tetap di Riwayat, bertanda "Pilihanmu"). Baris reaksi tokoh,
  lalu SETELAH kalimatnya utuh paling banyak SATU kalimat ajar (alasan efek) lewat `CatatanAlasan`: ikon info + kalimat,
  tanpa hijau/merah, tanpa "Suasana membaik/memburuk". Live region membacakan reaksi + kalimat itu. Label perasaan di
  panggung netral (chip terang, tanpa hijau/merah).
- Pilihan: 2–3 tampil di setiap titik, masing-masing 8–20 kata (terukur 10–20); tepat satu pilihan yang menolong
  (`makna` membantu/ralat) per titik, dan ia terpanjang di paling banyak separuh titik (terukur: 3 dari 11 titik, yaitu
  `b5-keberatan` dengan `ralat-polis`, `b2-bengkel-akibat`, `b1-pulih`). Makna & akibat pilihan tidak berubah.
- Pemangkasan: 5 baris naskah pensiun (`b1-mentor.2`, `.3`, `b2-cerita.4`, `b2-singkat.1`, `b3-bukti-intro.4`).
  Jalur terbaik (dengar → dokumentasi → 3 foto tepat → bisa-dinilai → jujur → rangkum), dihitung lewat mesin terhadap
  kode sebelum & sesudah: aksi 33 → 29, ketukan "Lanjut" 27 → 23, baris tampil 35 → 31.
- **Kompatibilitas**: kunci yang dihapus tetap ada di `teks.id/en/zh.ts` (blok PENSIUN, daftar `KUNCI_PENSIUN`: 5
  baris dialog, 3 baris umpan balik foto `b3-bukti.hasil.2.1`–`2.3`, dan `akt.polis.opsi.ambang-tlo`) supaya Riwayat & hasil aktivitas simpanan lama tetap terbaca. `simpan.ts`
  `jepitBaris`: saat memuat, `baris` progres dan tiap cadangan bab dijepit ke jumlah baris terlihat node-nya (hanya
  bila melebihi), jadi simpanan di node yang dipendekkan tetap bisa `lanjut`. Baris yang hilang di TENGAH node bisa
  membuat pemain yang sedang di node itu melompati/mengulang satu baris (diterima). Tanpa menaikkan `versi`.

### 11.4 Istilah di tempat (tanpa hover, tanpa halaman glosarium)

- Lima istilah (`Episode.istilah`, kunci `istilah.<id>.label|arti`): nasabah, klaim, polis, Comprehensive, risiko
  sendiri. Ditandai `Baris.istilah` di baris PERTAMA pemakaiannya pada tiap jalur: `b1-mentor.1` (nasabah, klaim;
  **v3: pindah** ke narasi pintu `b1-mentor.4` (nasabah) dan ucapan Bu Rina `b2-saran.1` / `.2` (klaim), yang dilewati
  semua jalur, supaya pembuka tidak padat istilah; bagian 12);
  `b4-polis-intro.1` / `.2` (polis, Comprehensive; tepat satu tampil per jalur); `b4-polis-tepat.1`,
  `b5-keberatan.4`, `b5-keberatan.7` (risiko sendiri). Dites di semua jalur uji & titik keputusan, id/en/zh.
- Kotak dialog (`DaftarIstilah`): setelah kalimat utuh, tombol "Apa itu polis?" (`cerita.apaItu`, ≥ 44 px,
  `aria-expanded` + `aria-controls`, ketuk/Enter/Spasi) membuka arti 1–2 kalimat tepat di bawahnya. Ketukan di area
  istilah tidak memajukan dialog; yang terbuka direset tiap baris; arti yang dibuka digulir ke dalam layar
  seperlunya; fade 160 ms, mati saat gerak dikurangi.
- Baris node `aktivitas` TIDAK boleh diberi istilah: kartu pengantar aktivitas tidak menampilkan tombolnya (dites).
- Kartu polis (`KartuPolisPeriksa`): subjudul & keempat baris kartu Bu Rina bisa diketuk/ditekan untuk arti awam
  (`DefAktivitas.kartuArti` → `akt.polis.kartu.sub.arti`, `akt.polis.kartu.<baris>.arti`); keadaan terbuka = ikon +/−
  dan teksnya, bukan warna. Chip produk "AUTO" tidak ditampilkan. Dipakai di aktivitas polis & Catatan kasus.
- Semua arti = DRAF dari materi episode (m01/m02/m05/m09 + catatan simulasi), dicatat di
  `docs/cerita/TINJAUAN-PIC-CLAIM.md` bagian S (belum ditinjau). Tidak ada janji persetujuan, pembayaran penuh, tanggal
  perbaikan, atau ambang/biaya/tenggat/cakupan/prosedur baru.

### 11.5 Aktivitas (`cerita/ui/Aktivitas.tsx`, `aktivitas.css`, `hasilAktivitas.ts`)

- **Kartu pengantar**: "Aktivitas klaim · judul", baris pengantar terakhir, "Tugasmu" = satu kalimat
  (`akt.<id>.instruksi`: "Pilih 3 foto yang membantu pemeriksa." / "Pilih penjelasan yang sesuai dengan isi kartu."),
  tombol Mulai. Tanpa kartu polis, cara main, atau "Tidak ada waktu". Kalimat instruksi/tanya/petunjuk/briefing/
  cerita/label/tujuan bab tidak saling mengulang (dites). Mode ringan / engine gagal: keterangan di bawah adegan
  menyebut pilihan akan tersedia sebagai daftar (`ceritaAkt.ketDaftarMulai`).
- **Foto**: penghitung "n/3 foto" (`labelHitung`), album ringkas (`albumRingkas`), umpan balik memilih netral (tidak
  membocorkan benar), pilihan bisa dibatalkan (kanvas, daftar, atau chip), kanvas & daftar berbagi satu draf. "Pilih
  lewat daftar" tidak tertutup bar aksi pada posisi awal (11.7). Mode ringan / engine gagal tetap punya rute HTML penuh.
- **Foto belum lengkap** (khusus cerita, `konfirmasiKurang`): judul "Baru 1 dari 3 foto dipilih", isi "Foto yang belum
  dipilih tidak ikut di laporan Bu Rina.", tombol **Lengkapi foto** (kembali menjawab, fokus ke pembuka daftar) dan
  "Kirim dengan 1 foto" → cabang "belum lengkap" episode tetap sama. Teks solo & multiplayer
  (`misi.konfirmasiCatatan` dsb.) tidak berubah.
- **Polis**: opsi `ambang-tlo` (75% / TLO, di luar materi episode) pensiun: tidak ditawarkan (`opsiPensiun` di
  `aktivitas.ts`; validasi menolak opsi pensiun yang masih ada di misi), tetapi tanda `akt:polis:pilih:ambang-tlo`
  simpanan lama tetap sah dan cabang hasil ke-4 + baris `b4-polis.hasil.4.1` dipertahankan. Tersisa tiga opsi; kedua
  pengecoh masing-masing mewakili satu salah kaprah (`pasti-diganti` menjanjikan hasil, `tidak-tercakup` menyangkal isi
  kartu); jawaban tepat bukan yang terpanjang (11 kata vs 13 dan 12, `hitungKata`). Kartu polis tampil di
  ATAS pilihan saat menjawab (`sisipanJawab`) dan barisnya bisa diperiksa (11.4). Perbandingan Comprehensive vs TLO
  tetap di latihan misi 5.
- **Umpan balik**: vonis langkah ("Langkahmu tepat" dsb., bahasa tepat/keliru hanya untuk proses) → ucapan tokoh
  (baris beruntun satu pembicara dikelompokkan di bawah satu potret) → pilihan per kelompok dengan alasan singkat
  (`alasanOpsi`): foto = "Yang membantu" / "Yang terlewat" / "Kurang membantu"; pilih-satu tepat = tidak diulang;
  pilih-satu keliru = "Kamu pilih:" + "Yang tepat:" → **Lanjutkan cerita** (`data-cer-fokus`) → "Kenapa begitu?"
  (`aria-expanded`, awalnya tertutup; isinya: alasan pilihan tepat, pembahasan langkah klaim, dan "Perasaan Bu Rina"
  tanpa kotak berwarna) → catatan simulasi. Opsi pensiun di simpanan lama tetap berlabel (`labelOpsi`).
- Umpan balik foto tidak mengulang: hasil sebagian/belum = SATU kalimat Miss Raksa tentang akibatnya
  (`b3-bukti.hasil.2.5`; `2.4` hanya untuk kiriman >3 foto tanpa bukti terlewat, tidak bisa lewat UI), hasil tepat =
  `1.1` tanpa daftar foto; foto mana + alasannya hanya di panel. Baris per foto `2.1`–`2.3` dipensiunkan.

### 11.6 Visual

- Potret Bu Rina (SVG datar) diselaraskan dengan Miss Raksa sejauh bisa dengan SVG: jendela potret
  `JENDELA_POTRET_NASABAH` (skala & letak wajah), garis cokelat tua hangat (bukan tinta hijau adegan), cahaya dari
  kiri atas, wajah & mata lebih rinci; di bawah 60 px `PotretNasabah` memakai versi kecil (garis lebih tebal, alis/mata/
  mulut lebih besar) supaya kesal / cemas / bingung terbedakan di 44–52 px. `nasabahBadanPenuh` (adegan Phaser)
  sengaja tidak diubah. Dijaga `cerita/seni/seni.test.ts`.
- Label suasana panggung netral (tanpa hijau/merah). Perubahan ekspresi `cseni-ganti` 200 ms, instan saat gerak
  dikurangi.
- **Belum setara**: berdampingan di kotak dialog, Bu Rina dan Miss Raksa masih terlihat dari dua gaya gambar; butuh
  ilustrator. Kesenjangan & spesifikasi aset: `docs/cerita/KEBUTUHAN-ASET.md` (tidak diklaim beres).

### 11.7 Ukuran & uji penerimaan

Semua angka dari Chrome headless (emulasi viewport & sentuh, SwiftShader) di laptop Windows 11 pengembang, **bukan HP
fisik**. Skrip ukur sama untuk sebelum & sesudah (`ukur.mjs`, folder sementara sesi): 7 simpanan akhir (5 akhir +
`pulih` + `ralatJanji`), bahasa Indonesia, gerak penuh. Sebelum = build produksi lama di server uji lokal (26 Sep sore);
sesudah = build produksi v2 di server yang sama (27 Sep dini hari).

**Layar akhir** (semua 7 simpanan):

| Viewport | Kata di `.cer-main` | Tinggi halaman | Kontrol di kartu | Aksi utama (y) | Judul, pelajaran, kedua aksi tanpa gulir |
| --- | --- | --- | --- | --- | --- |
| 390×844 sebelum | 309–392 | 2.882–3.167 px | 11–14 | 2.467–2.805 | tidak (hanya judul) |
| 390×844 sesudah | 60–78 | 844 px | 3 | 464–586 (kedua ≤ 642) | ya, 7/7 |
| 360×740 sebelum | 309–392 | 2.945–3.284 px | 11–14 | 2.530–2.922 | tidak |
| 360×740 sesudah | 60–78 | 740–801 px | 3 | 452–577 (kedua ≤ 633) | ya, 7/7 (catatan simulasi di bawah lipatan pada 4/7) |
| 1440×900 sebelum | 309–392 | 1.822–2.038 px | 11–14 | 1.574–1.842 | tidak |
| 1440×900 sesudah | 60–78 | 900 px | 3 | 532–620 (berdampingan) | ya, 7/7 |

Teks isi kartu 16 px (sebab & pelajaran), judul 22–24 px, target 44–69 px, tanpa luber horizontal.

**Alur pemula** (profil baru, halaman awal → Kenalan → daftar → episode; satu ketukan per baris, gerak dikurangi):
ketukan sampai masalah Bu Rina tampil 8 → 6 (390×844, 360×740, 1440×900); masalah muncul di baris dialog ke-3 (sebelum
ke-5); kata tampil: Kenalan 52 → 25, daftar cerita 100 → 76, reaksi setelah memilih 40 → 26, kartu aktivitas foto 62 →
29, kartu pengantar polis 103 → 41 (kartu polis pindah ke layar menjawab: 70 → ±110 kata di sana), umpan balik polis
116 → 43. Jalur terbaik dihitung lewat mesin: ketukan "Lanjut" 27 → 23.

**Aktivitas.** "Pilih lewat daftar" setelah Mulai: 390×844 y 691–739 (bar 747; sebelum 746–794 = TERTUTUP), 1440×900
384–432 (bar 448), juga di 360×740, 844×390, zoom 200 % (dicek agen & `test:cerita`). Polis setelah Mulai: pilihan
pertama 390×844 y 655–720 (bar 747, seluruh kartu terlihat), 360×740 556–635 (bar 643), 1440×900 ketiga pilihan di atas
bar; 844×390 perlu gulir.

**Kinerja (A/B dalam kondisi sama).** Saat pengukuran sesudah, Chrome di laptop ini membatasi bingkai ±32 fps (juga di
`about:blank`), berbeda dari saat pengukuran sebelum (60 fps). Karena itu build lama & baru disajikan berdampingan
(`vite preview`, port berbeda) dan diukur bergantian dalam kondisi yang sama:

| (±32 fps) | buka → Mulai | buka → adegan siap (dingin / hangat) | ketuk daftar → DOM / → gambar | ketuk kanvas → DOM |
| --- | --- | --- | --- | --- |
| 390×844 lama | 363–394 ms | 1.190 / 498 ms | 3,3–3,9 / 43–64 ms | 44–51 ms |
| 390×844 baru | 367–394 ms | 1.214 / 507 ms | 3,6–3,8 / 63 ms | 45–46 ms |
| 1440×900 lama | 344–356 ms | 551 / 445 ms | 2,8–2,9 / 43–45 ms | 101–107 ms |
| 1440×900 baru | 360–369 ms | 580 / 502 ms | 2,9–3,0 / 40–44 ms | 101–109 ms |

CPU diperlambat 4×: lama 512–587 / 746–1.414 ms vs baru 540–567 / 765–1.475 ms (buka → Mulai / buka → adegan); ketuk
daftar → DOM 13–16 ms keduanya. Kesimpulan: selisih dalam derau pengukuran; tidak ada regresi yang terukur. Angka
sebelum pada 60 fps (26 Sep): 390×844 buka → Mulai 361 ms (dingin) / 326 ms (hangat), buka → adegan 1.234 / 465 ms.

**Siklus main ulang** (390×844, bab 3 → akhir → "Coba jalur lain" → Bagian 3, 3×): kanvas kembali 0 di setiap layar
akhir; instans engine 1 → 2 → 4 → 6 (satu per aktivitas); listener JS lama 379 → 361/363/369 → 356, baru 386 → 352 →
501/499 → 498 (naik SEKALI saat dialog pertama dibuka: wadah portal React; datar sesudahnya); node DOM di layar akhir
lama 1.819, baru 1.518; heap 9–11 MB keduanya. Tidak ada kanvas atau listener yang menumpuk.

**Uji otomatis (build final):** lihat README bagian 12. Browser: `test:cerita` (gerak aktif & dikurangi), `test:review`
(`--cerita` + gerak dikurangi), `test:e2e` (aktif & dikurangi), `test:acara`.

**Belum diverifikasi**: HP fisik (Android/iPhone), pembaca layar sungguhan, zoom browser sungguhan (200 % diuji dengan
viewport 720×450 DPR 2), dan **efektivitas belajar**. Rencana & formulir: [`docs/cerita/UJI-PEMULA.md`](cerita/UJI-PEMULA.md).
Sampai uji itu dijalankan, klaim "pemula jadi paham" tidak boleh dibuat; yang terbukti hanya ukuran tata letak &
perilaku di atas.

### 11.8 Belum beres / keputusan terbuka (v2)

- `LayarAkhir` masih menerima `namaPemain` yang tidak dipakai; kunci kamus lama `cerita.kamu`, `cerita.arah.*`, dan
  `cerita.aksiLain` dibiarkan (tidak dirujuk kartu v2).
- Naskah v2, arti istilah, kalimat kartu akhir, dan alasan per opsi = DRAF, belum ditinjau PIC Claim; terjemahan
  en/zh belum ditinjau penutur asli.
- Gaya gambar Bu Rina vs Miss Raksa (11.6) dan uji HP fisik & pemula (11.7) belum beres.
- Potret Miss Raksa hanya punya satu ekspresi (tersenyum), padahal naskah memberinya `serius`; Bu Rina badan penuh di
  adegan Phaser masih gaya NPC lama. Keduanya kebutuhan aset (`docs/cerita/KEBUTUHAN-ASET.md`).
- Mengetuk objek "Kartu polis" di kanvas membuka dialog Dokumen generik (kartu hanya-baca); arti baris ada di kartu
  yang bisa diperiksa di atas pilihan dan di Catatan kasus.
- "Pesan Miss Raksa" di "Kenapa berakhir begini" = pelajaran per AKHIR (`InfoAkhir.pelajaran`), bukan per jalur; sebab
  jalur ditulis lebih dulu. Bisa dipersempit dengan `jika` per pelajaran bila uji pemula menunjukkan kebingungan.
- HP mendatar (844×390) & zoom 200 %: kartu akhir dan pilihan polis perlu digulir (target "tanpa gulir" hanya untuk HP
  potret).

## 12. Revisi v3 (adegan) & v4 (pixel art), 27–28 September 2026

Kontrak rinci: `docs/cerita/ADEGAN-AUTO1.md` (menggantikan uraian panggung bagian 4 dan catatan tampilan 10.2/11.6
untuk AUTO-1), kontrak piksel `docs/cerita/aset/PIKSEL.md`, status aset `docs/cerita/KEBUTUHAN-ASET.md`, penulisan cue
`docs/cerita/PANDUAN-EPISODE.md` bagian 4.4.

### 12.1 Yang berubah

- **Panggung (v3)**: satu dunia 1600 × 900 berlapis dengan kamera (bukan latar datar + satu tokoh); Miss Raksa hadir di
  meja bersama Bu Rina; kedatangan terlihat (pintu berayun, masuk, dipersilakan, duduk), kartu polis, epilog telepon,
  kepergian, parkiran. Komposisi diturunkan murni dari state lewat cue (`adeganKini`, `Baris.adegan`,
  `NodeDasar.adegan`, `Episode.panggung`); `nasabahHadir` kini dari cue, bukan "sesudah bicara". Aksi sekali jalan
  berkunci `node#baris@langkah`; muat ulang/ganti bahasa/resize tidak memutar ulang.
- **Lokasi**: satu nama "Raksa Silver Club" (`LOKASI_AUTO_1`), dipakai papan nama, `{lokasi}` di dialog, dan label lokasi
  aktivitas polis.
- **Naskah (v3, DRAF, tercatat di TINJAUAN-PIC-CLAIM revisi 5)**: `b1-mentor.1` satu kalimat peran + tempat tanpa istilah
  (review lanjutan butir 6; kutipan v2 di 3.1 & 11.3 sudah lama); tombol istilah "nasabah" di narasi pintu `b1-mentor.4`
  ("…masuk tergesa dan menaruh kunci mobilnya di meja") dan "klaim" di `b2-saran.1/.2` ("Urusan klaim belakangan");
  `b1-datang.dengar` "Tarik napas dulu, lalu ceritakan dari awal" (Bu Rina sudah dipersilakan duduk). Id node/pilihan,
  efek, akhir, dan `versi` simpanan tidak berubah.
- **Seni (v4)**: pemilik menolak wajah & tangan SVG semi-realistis v3; tokoh & ruang kini pixel art (atlas + manifest,
  kamera skala bulat, nearest-neighbour). Miss Raksa dari tiga master generatif pemilik (`character/miss-raksa-pixel-v4`),
  Bu Rina dari empat lembar yang dibuat lewat Canva berbasis teks (`character/bu-rina-pixel-v1`), keduanya diproses
  `tools/piksel`. Potret di mana pun memakai atlas yang sama; sprite global Miss Raksa (beranda, kenalan, join, host,
  proyektor) juga piksel.
- **Uji**: `tools/uji-panggung.mjs` (`npm run test:panggung`: pembuka, lewati, Lanjut cepat, Enter ditahan, bahasa,
  ukuran, dialog, tab, muat ulang, bab, ringan, aset gagal, hantu, aksi, piksel, kartu vs tangan); `uji-cerita.mjs`
  membaca data episode lewat `node --import tsx`.

### 12.2 Batas yang diketahui

- Kemiripan Miss Raksa dengan orang nyata tidak dituju atau diklaim; varian (hadap kanan, telepon, frame transisi) dibuat lewat sunting
  piksel, bukan generator gambar ber-rujukan. Bu Rina keluar = cermin.
- Latar aktivitas Phaser masih vektor datar; Mr Roger & Bu Isti masih gaya lama (gaya bercampur di luar panggung).
- Belum diuji: HP fisik, pembaca layar sungguhan, peramban selain Chrome, penutur asli en/zh, dan uji pemula
  (`docs/cerita/UJI-PEMULA.md`).

### 12.3 Polish v5 (28 September 2026)

Review v4 (`Desktop/raksa-v4-review-20260928/REVIEW.md`) menemukan wajah Miss Raksa sayu (fitur master dihapus lalu
digambar ulang), Miss terlalu rendah di balik meja, kamera kedatangan HP menjauh sampai tokoh kecil dengan bidang pintu
gelap, dan tangan tunjuk/telepon kurang natural. v5 memperbaikinya tanpa mengubah alur, cue, simpanan, atau peran:
wajah dari fitur master (`tools/piksel/miss-wajah.mjs`), frame duduk dinaikkan, kamera kedatangan HP satu bingkai masuk
lalu satu geser (skala piksel sama dengan percakapan), warna ruang diredam, gestur tunjuk & telepon digambar ulang, Bu Rina
diselaraskan. Rincian: `docs/cerita/aset/MISS-RAKSA-PIKSEL.md`, `RUANG.md`, `ADEGAN-AUTO1.md`; bukti `Desktop/raksa-v5-polish-bukti/`.
