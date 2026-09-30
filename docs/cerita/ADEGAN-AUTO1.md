# Adegan AUTO-1: ruang layanan Raksa Silver Club, dua tokoh piksel, kedatangan yang terlihat

Kontrak visual & presentasi AUTO-1. **v3** (27 September 2026): panggung dunia berlapis, dua tokoh di meja, kedatangan,
cue adegan (brief `Desktop/raksa-visual-followup-20260927/PROMPT-CLAUDE-VISUAL.md`). **v4** (28 September 2026): seni
tokoh & ruang diganti **pixel art hangat** (brief `character/miss-raksa-pixel-v4/PROMPT-CLAUDE.md`; review
`Desktop/raksa-pixel-review-20260927/REVIEW.md`), karena pemilik menolak wajah/tangan SVG semi-realistis v3. Alur,
cue, dan mesin tidak berubah. Kontrak alur & ending tetap `docs/rancangan-mode-cerita.md` bagian 11; bagian 12 dokumen
itu merangkum v3/v4.

## 1. Keputusan

| Hal | Keputusan |
| --- | --- |
| Lokasi | **Raksa Silver Club** (satu nama; `LOKASI_AUTO_1` di `client/src/cerita/episode/auto-1/teks.ts` → `Episode.panggung.lokasi`, parameter teks `{lokasi}`, label lokasi aktivitas polis, dan tulisan papan yang dipanggang ke PNG ruang). Pilihan artistik, bukan pernyataan kelayakan layanan, syarat keanggotaan, batas pertanggungan, atau janji fasilitas. Nama klub lain tidak muncul. |
| Eksterior Wisma BSG | **Slot kosong** (`Episode.panggung.eksterior = null`): tidak ada foto fasad yang teridentifikasi resmi. Pembuka mulai dari koridor/pintu ruang layanan. Bagian 5. |
| Peran pemain | Petugas layanan klaim di LUAR bingkai (sisi kamera kiri). Ucapan pemain berlabel nama profil + "Petugas Layanan Klaim". Miss Raksa = mentor, tidak pernah memilih jawaban. |
| Mesin | Phaser + React tetap. Panggung cerita = React + SVG/`<image>` + CSS (Web Animations). Phaser hanya di aktivitas. |
| Sumber kebenaran | State cerita (`mesin.ts`) + metadata episode. Presentasi diturunkan murni (`adeganKini`), tidak menulis state, tidak memajukan dialog, tidak menilai. |
| Save | Data gameplay tidak berubah → `versi` episode TETAP 1. Metadata adegan & seni tidak disimpan di state. |
| Seni (v4) | Pixel art: 1 piksel seni = 4 satuan dunia, kamera skala BULAT per piksel perangkat, nearest-neighbour. Kontrak: `docs/cerita/aset/PIKSEL.md`. |

## 2. Komposisi (dunia 1600 × 900 satuan = 400 × 225 piksel seni)

Koordinat otoritatif: `client/src/cerita/seni/ruang/geometri.ts` (dan `seni/piksel/ruang.json` hasil build). Semua
titik kelipatan 4. Ringkasan (v5, 28 Sep: pintu/kamera oleh agen ruang-kamera, meja/tempat duduk oleh agen komposisi-meja):

| Unsur | Posisi dunia | Catatan |
| --- | --- | --- |
| Papan nama | papan x 760–984, y 216–316 (teks 772–972 × 228–304) di ANTARA kedua kepala | "Raksa" + "Silver Club", font bitmap 7 px, dipanggang dari `LOKASI_AUTO_1`. |
| Pintu | sekat kanan dekat: bukaan x 1376–1600, engsel (1376, 450) (v5) | Dipindah dari dinding belakang (v3) supaya Bu Rina masuk pada skala 1 tanpa penskalaan pecahan; daun pintu lapisan sendiri, berayun dari engsel. |
| Meja | tepi jauh y 640 (datar; v5, dulu 656), tepi dekat ± 772; sudut JB (316,640) JK (1116,640) DK (1276,772) DB (76,772) | Depan meja = lapisan sendiri. |
| Miss Raksa duduk | pinggul (656, 776); garis meja frame = y 640 (34 piksel seni di atas pinggul) | Tangan di atas meja = potongan frame yang SAMA (`diAtasMeja`), transform sama. Garis mata y 376–378 = cakrawala. |
| Miss Raksa berdiri | telapak (656, 884) (tepat di depan kursinya) | Sambut menghadap pemain (kiri), persilakan menghadap kursi (kanan). |
| Bu Rina duduk / berdiri | pinggul (1148, 744) / telapak (1276, 904); titik telapak duduk juga y 904 | Gestur duduk per ekspresi (kesal lipat tangan, cemas genggam, bingung dagu, lega dada). |
| Jalur masuk | (1536,904) → (1428,904) → (1276,904), semua skala 1 | Jalan dua bingkai (jalan-a / jalan-b), lalu berdiri, duduk-turun, duduk. |
| Prop | telepon (508,724), kartuSimpan (640,748) di tepi dekat = sisi pemain, kartuMeja (768,704), kunciMeja (904,700); `LANDASAN_KARTU` x 700–836 y 664–744 | Kartu muncul dari sisi pemain (pemain yang membuka kartu), meluncur rendah di bawah ujung jari, mendarat; lalu Miss Raksa menunjuk. |
| Parkiran | Miss (560,1000), Bu Rina (1040,1000); kerusakan mobil di tengah | |

**Kamera**: `kamera.ts` memilih skala terbesar yang memuat kotak wajib (kedua kepala + tangan kunci + papan nama; + pintu
saat kedatangan) di atas pita bawah, lalu **membulatkan** `4 × skala × devicePixelRatio` ke bilangan bulat dan
menempatkan asal dunia di piksel perangkat; dihitung ulang saat ukuran/zoom/DPR berubah. Animasi kamera boleh pecahan;
bingkai diam selalu bulat. Contoh terukur: 1440×900@1 = 3 px perangkat per piksel seni, 1920×1080@1 = 4, 390×844@2 dan
360×740@2 = 3, 844×390@2 = 3.

**Kamera percakapan di meja (v5)**: di lokasi `meja` dengan Miss Raksa duduk, SEMUA baris duduk memakai satu kamera
(`transisi.ts percakapanMeja`): zona landasan kartu ikut kotak wajib, Bu Rina (kanan) wajib utuh di panggung tanpa
pita bawah karena label suasana ada di pita bawah KIRI, dan kotak tangan tokoh raster 0,2 × tinggi kepala. Jadi
menunjuk kartu, gestur Bu Rina, Bu Rina condong memegang kunci, dan kursi kosong sesudah ia pergi tidak menggeser/
memperbesar kamera per baris; kamera akhir kedatangan & kepergian = kamera ini. Garis mata kedua tokoh duduk di
cakrawala (± 1 piksel seni; gestur Bu Rina ± 4). Rincian: `aset/RUANG.md` bagian "Komposisi meja v5".

**Kamera kedatangan & kepergian di HP (v5.1, review HP 29 Sep)**: skala piksel selalu = skala percakapan (tokoh
tidak pernah mengecil). *Kedatangan*: bila bingkai kedatangan (`pasKameraPintu`: kepala Miss Raksa utuh) hanya
memperlihatkan potongan bukaan pintu (HP: 360@2/3, 390@2/3, 412@2,625, 844×390@2), kamera lebih dulu tiba di **bingkai pintu**
(`kamera.ts pasKameraBukaan` / `transisi.ts kameraKedatangan`: rata kanan dunia, seluruh bukaan tampak, tinggi sama)
SEBELUM daun mulai berayun (380 md); Bu Rina muncul di ambang dan berjalan ke kursi di bingkai itu; saat Miss Raksa
menoleh mempersilakan kamera bergeser SATU arah ke kiri ke bingkai kedatangan (1050–1700 md), lalu ke percakapan
sesudah Bu Rina duduk (2000–3000 md). Miss Raksa boleh terpotong di tepi kiri selama bingkai pintu. Desktop & HP lebar
(bukaan sudah utuh): tanpa bingkai pintu. *Kepergian*: baris kepergian (aksi `pergi`, kursi kosong) memakai bingkai
kepergian sebagai kamera DIAM-nya (`transisi.ts kameraDiam`): satu geser di awal (Bu Rina masih duduk), lalu diam
selama ia berdiri, berjalan keluar lewat tepi pintu, dan kursi kosong; bingkai percakapan kembali saat baris berikutnya
(Miss Raksa bicara), bukan geser bolak-balik di ujung gerak pergi. Desktop 100 %: bingkai kepergian = percakapan.

**Lapisan (z, bawah → atas)**: latar → koridor → daun pintu → tokoh di belakang meja → meja belakang & prop → tangan di
atas meja → depan meja → kursi belakang → Bu Rina (pengunjung) → label. Label & tombol HTML tidak pernah menutupi wajah
atau tangan. **"Lewati pembuka" (v5.1) ada di LUAR gambar**: sel kiri baris kaki kotak dialog, di samping Lanjut
(portal dari panggung, `KotakDialog slotLewati`), satu sel dengan petunjuk "Ketuk kotak ini…" (petunjuk tak terlihat
tetapi tetap memesan tempat selama tombol ada), jadi tinggi kotak dialog & posisi Lanjut tidak berubah saat tombol
muncul/hilang (diuji `tools/uji-panggung.mjs tempatlewati`). Karena tombol kini di dalam kotak dialog ("ketuk kotak =
lanjut"): ketukan yang meleset tipis di sel tombol tidak memajukan cerita, dan ketukan POINTER ke kotak dialog 500 md
sesudah lewati ditelan (ketuk ganda tidak pernah sekaligus memajukan cerita; keyboard tidak terpengaruh). Cadangan tanpa
baris kaki: pojok kanan-bawah panggung.

## 3. Lokasi & kehadiran per bagian

| Bagian / node | Lokasi | Hadir | Catatan |
| --- | --- | --- | --- |
| Pembuka (episode baru) | `pintu-luar` → `meja` | Miss Raksa | ± 2 dtk + kedatangan ± 3 dtk; "Lewati pembuka" sejak bingkai pertama (baris kaki kotak dialog, bukan di gambar). |
| b1-mentor.1 | `meja` | Miss Raksa berdiri, sambut (telapak bertemu di dada) menghadap pemain | Pintu tertutup. |
| **b1-mentor.4** (narasi pintu) | `meja` | + Bu Rina: `aksi: masuk` | Daun pintu berayun, Bu Rina masuk dari kanan membawa kunci, Miss Raksa menoleh & mempersilakan, Bu Rina duduk (bingkai duduk-turun), kunci ke meja, Miss Raksa duduk. Narasi: "…masuk tergesa dan menaruh kunci mobilnya di meja." |
| Bab 1–2 | `meja` | Keduanya duduk | Ekspresi, gestur, & arah pandang per baris; Miss Raksa menghadap kanan saat bicara/mendengar Bu Rina, kiri saat bicara ke pemain. |
| b3-bukti-intro … (bab 3) | `parkiran` | Keduanya berdiri dekat mobil | b3-seadanya: `meja`, Bu Rina condong (bersiap pergi). |
| b4-polis-intro.1/.2 | `meja` (larut dari parkiran dulu bila perlu) | Keduanya duduk + `aksi: kartu` | Kartu dari sisi pemain ke tengah meja; Miss Raksa `duduk-tunjuk` hadap kanan + mata ke bawah. |
| akhir-janji.2 (telepon) | `telepon` | Miss Raksa memegang SATU gagang (bagian dari frame-nya); meja hanya menampilkan pesawat tanpa gagang; kursi pengunjung KOSONG; Bu Rina hanya di sisipan panggilan | Miss Raksa tidak ikut larut (kursinya sama). |
| akhir-pergi.3/.4, akhir-dingin.3 | `meja` | Bu Rina `aksi: pergi` (duduk → duduk-turun → berdiri hadap kanan → jalan ke kanan keluar) | Kursi kosong sesudahnya. HP: kamera diam di bingkai kepergian sampai baris berikutnya (v5.1). |
| akhir-tertunda.1/.4 | `meja` → `telepon` bila Bu Rina bicara lagi | Kursi kosong | |
| Aktivitas (Phaser) | adegan aktivitas | Bu Rina piksel (frame `aktivitas`, NEAREST, skala bulat) | Latar aktivitas masih vektor datar (lihat KEBUTUHAN-ASET). |
| Layar akhir, Riwayat, hub, pemandu | kartu/potret | Potret piksel skala bulat; < 44 px = ikon kepala mini 32 px | |

## 4. Model cue & aturan panggung

Tipe di `client/src/cerita/tipe.ts` (`CueAdegan`, `Baris.adegan`, `NodeDasar.adegan`, `Episode.panggung`); fungsi murni
`adeganKini(ep, state)` di `client/src/cerita/ui/adegan.ts`. Panduan penulisan: `PANDUAN-EPISODE.md` bagian 4.4.

- **Kunci stabil**: cue menempel pada baris (kunci teks, mis. `b1-mentor.4`) atau node, tidak pernah dicocokkan dengan
  kalimat. Kunci aksi = `${episode}:${node}#${baris}@${langkah}`.
- **Aksi sekali jalan** (masuk, pergi, kartu, pindah) diputar hanya bila baris itu baru dicapai di sesi ini. Muat
  ulang, ganti bahasa, resize, Bantuan/Riwayat/Catatan, dan kembali ke tab = langsung komposisi akhir. Ulang bab
  menaikkan `langkah`. Pembuka diputar sekali per tab (sessionStorage).
- **Lanjut saat bergerak**: gerak diselesaikan ke komposisi akhir, lalu semantik Lanjut berjalan SEKALI. "Lewati
  pembuka" hanya menyelesaikan gambar; bila tombol itu hilang sendiri saat fokus ada padanya, fokus pindah ke Lanjut.
- **Pergantian pose**: tukar seketika dengan antisipasi/settle kecil (bukan crossfade dua tubuh); tidak ada bingkai
  dengan dua tubuh satu tokoh > 25 %. Duduk/berdiri memakai bingkai `duduk-turun`; jarak mendatar berdiri↔duduk dibagi
  di titik tukar. Larut lokasi 450 ms; tokoh yang tetap di kursinya (meja → telepon) tidak ikut larut.
- **Kedip & mulut**: kedip acak tak serempak (tidak pada tokoh yang bicara), mulut bergerak hanya selama barisnya
  diketik; hanya piksel wajah yang berubah (kepala terkunci); animasi kedip/mulut dibatalkan sebelum komposisi baru
  dilukis. Tanpa ayunan badan terus-menerus.
- **Gerak dikurangi / mode ringan** (`prefers-reduced-motion`, `?adegan=ringan`, disimpan juga sebelum alih ke
  /kenalan dan dari hub): komposisi akhir langsung. **Tab tersembunyi**: gerak kecil berhenti. **Resize tinggi saja
  < 15 %** (bilah alamat HP): kamera dipaskan ulang tanpa menyelesaikan gerak.
- **Aset**: PNG didekode sebelum dunia ditampilkan; dialog tidak menunggu. PNG ruang gagal → ruang SVG; atlas tokoh
  gagal → siluet netral bernama; cerita tetap jalan. Seni dimuat di chunk cerita (lazy): ± 137 KB PNG total (atlas Miss
  ± 21 KB, Bu Rina ± 55 KB, ruang & prop sisanya).
- **Baris istilah**: ruang baris "Apa itu …?" dipesan selama kalimat diketik (tak terlihat, bukan tombol), jadi Lanjut
  tidak melompat saat kalimat selesai.

## 5. Shot list pembuka & slot eksterior

| # | Shot | Durasi target | Status |
| --- | --- | --- | --- |
| 0 | Eksterior Wisma BSG + label lokasi | 1,2 dtk | **SLOT KOSONG**: butuh foto fasad resmi yang teridentifikasi. Setelah tersedia: lapisan piksel 400×225 (kontrak PIKSEL.md), label dari `Episode.panggung.eksterior`. Jangan memakai foto gedung generik. |
| 1 | Koridor & pintu ruang layanan (`pintu-luar`, kamera mendorong pelan) | ± 1,6 dtk | Dikerjakan (piksel). |
| 2 | Ruang layanan: Miss Raksa berdiri menyambut | ± 0,5 dtk | Dikerjakan. |
| 3 | Narasi pintu: pintu berayun, Bu Rina masuk dari kanan membawa kunci (HP sempit: bingkai pintu dulu, pintu masih tertutup saat kamera tiba) | ± 1,5 dtk | Dikerjakan (v5.1 bingkai pintu HP). |
| 4 | Miss Raksa mempersilakan; Bu Rina duduk (duduk-turun), kunci ke meja; Miss Raksa duduk; pintu menutup | ± 1,4 dtk | Dikerjakan. |

Interior adalah adaptasi ilustratif dari foto referensi, bukan rekonstruksi denah resmi.

## 6. Seni tokoh (v4 piksel)

- Master & alat: Miss Raksa dari `character/miss-raksa-pixel-v4/*.png` (tidak diubah) lewat
  `tools/piksel/bangun-miss.mjs`; Bu Rina dari `character/bu-rina-pixel-v1/*.jpg` lewat `tools/piksel/bangun-rina.mjs`;
  ruang lewat `tools/piksel/bangun-ruang.mjs`; ikon mini lewat `tools/piksel/bangun-ikon.mjs`. Semua deterministik.
- Runtime: `client/src/cerita/seni/piksel/{miss-raksa,bu-rina}.png/.json` (atlas terindeks + manifest bentuk bersama),
  `ruang-*.png` + `ruang.json`, `ikon-*.png` + `ikon.json`; penyusun murni `seni/piksel/susun.ts` (pose/ekspresi cerita →
  frame & lapisan wajah); pintu masuk `seni/tokoh/index.ts` (`gambarMissRaksa/gambarBuRina` dengan `piksel: true` →
  GambarTokoh raster: potongan PNG + tempelan wajah/mata/mulut + kotak di atas meja).
- Pose Miss Raksa: `berdiri`, `berdiri-sambut`, `berdiri-persilakan`, `duduk-dengar`, `duduk-jelaskan`, `duduk-tunjuk`,
  `telepon` (+ `duduk-turun` bila tersedia), hadap kiri/kanan. Wajah: netral, senyum, prihatin, serius, lega (peta dari
  `Ekspresi` naskah: tersenyum/senang→senyum, cemas/bingung→prihatin, serius/kesal→serius, lega→lega) × dasar/kedip/
  bawah/bicara.
- Pose Bu Rina: `berdiri`, `jalan-a`, `jalan-b`, `duduk-turun`, `duduk` (+ gestur per ekspresi), `duduk-condong`,
  `telepon` (sisipan), hadap kanan untuk pergi; 8 ekspresi × dasar/kedip/bawah/bicara.
- Seni SVG v3 (`seni/tokoh/missRaksa.ts`, `buRina.ts`) tidak lagi menjadi arah seni; hanya cadangan di luar panggung.
  `tools/ekspor-aset-cerita.ts` (EKSPOR.md) mengekspor seni SVG v3 itu, bukan seni piksel.

## 7. Gaya

Pixel art hangat bergaya game retro yang rapi: kepala agak besar supaya ekspresi terbaca, garis luar gelap hangat
`#0f0b11`, bayangan lembut 2–3 nada, cahaya dari kiri atas, palet ≤ 40 warna per tokoh, ruang ≤ 48 warna. Teks UI
tetap HTML tajam; gaya piksel hanya untuk dunia & tokoh. Miss Raksa: wajah ramah, pipi lembut, mata teduh, sanggul
hitam, jas emas pucat, kerah & manset putih, lencana netral, tanpa headset. Bu Rina: ibu pemilik katering 40-an,
hijab bata + bros kuning, tunik biru, celemek krem bertepi jingga, celana gelap, kunci mobil.
