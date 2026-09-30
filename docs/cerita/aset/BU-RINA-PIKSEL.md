# Bu Rina — frame produksi pixel art (v4)

Status 27 Sep 2026 (revisi 2, sesudah reviu juri): atlas + manifest **siap diintegrasikan**, belum dipasang ke panggung
(tidak ada kode aplikasi yang diubah). Belum ditinjau pemilik. **Ronde 3 (28 Sep)**: varian `bawah` digambar ulang
sebagai lirik ke bawah dengan iris terlihat (lihat "Wajah terkunci-kepala"); tubuh, rect, kotak wajah/mata/mulut, dasar,
kedip dan bicara tidak berubah (dibandingkan piksel demi piksel terhadap atlas sebelumnya).
**v5 (28 Sep, harmonisasi dengan wajah Miss v5)**: garis siluet, tepi dan tekstur diselaraskan dengan gaya Miss
(`tools/piksel/rina-harmoni.mjs`, lihat "Harmonisasi v5" di bawah). Pose, wajah/ekspresi, palet (40 warna, urutan sama),
jangkar, potret & jendela telepon tidak berubah; atlas dikemas ulang 768 x 428. Revisi 2 memperbaiki 4 temuan reviu: bintik putih di dagu
(`dagu`/bingung), ekspresi kecil sulit dibedakan (netral murung, serius ~ netral, lega mengantuk), kulit wajah "meletup"
saat ganti ekspresi, dan jalan 2 bingkai yang terbaca langkah-rapat (lihat "Revisi 2" di bawah).
Bukan klaim pixel-perfect: sumber adalah JPG "bergaya piksel" dari Canva tanpa grid
piksel yang konsisten, jadi hasilnya adalah **re-sampling + normalisasi + suntingan tercatat**, bukan salinan grid asli.

## Berkas

| Berkas | Isi |
| --- | --- |
| `character/bu-rina-pixel-v1/*.jpg` | Sumber dari lead (Canva, putih, tanpa alpha). **Tidak diubah.** |
| `character/piksel/bu-rina/sumber/<lembar>-alfa.png` | Sumber dengan latar dilepas (resolusi asli, alpha 0/255) + `laporan-latar.json` |
| `character/piksel/bu-rina/native/mentah/*.png` | Hasil sampling per figur (sebelum palet) |
| `character/piksel/bu-rina/native/palet/*.png` | Sesudah bersih tepi + palet 40 warna (sebelum suntingan) |
| `character/piksel/bu-rina/native/<frame>.png` | Frame final native (wajah netral terpanggang), kanvas sebelum trim |
| `character/piksel/bu-rina/native/wajah/<ekspresi>-<varian>.png` | Kepala ekspresi tersejajar (kanvas kepala 70 x 80) |
| `character/piksel/bu-rina/native/log-suntingan.json` | Log semua suntingan tangan + registrasi + pencocokan wajah |
| `client/src/cerita/seni/piksel/bu-rina.png` | Atlas 768 x 428 (v5; ronde 3 1024 x 321), PNG terindeks 8-bit + tRNS, 40 warna, ± 53 KB |
| `client/src/cerita/seni/piksel/bu-rina.json` | Manifest (skema di bawah) |
| `client/src/cerita/seni/piksel/ikon-bu-rina.png` + `ikon.json` | Ikon kepala mini untuk potret < 44 px CSS (`tools/piksel/bangun-ikon.mjs`; lihat [`PIKSEL.md`](PIKSEL.md) §5b) |
| `tools/piksel/rina-*.mjs`, `tools/piksel/bangun-rina.mjs` | Alat (plain node + pngjs + ffmpeg untuk decode JPG); `rina-jalan.mjs` merakit `jalan-b`; `rina-harmoni.mjs` harmonisasi v5 |

Bangun ulang (deterministik, hash atlas sama tiap jalan):

```
node tools/piksel/rina-latar.mjs          # sekali: JPG -> sumber/*-alfa.png
node tools/piksel/bangun-rina.mjs         # native, suntingan, wajah, atlas, manifest (± 8 dtk)
node tools/piksel/rina-tinjau.mjs <dir>   # lembar tinjau, disusun ulang HANYA dari atlas + manifest
```

## Skala (kontrak lead: 1 px seni = 4 satuan dunia)

Wajah Bu Rina disamakan dengan wajah Miss Raksa pada skala native master-nya (7,34 px sumber / px seni).

| Ukuran | Miss Raksa (master, diukur manual) | Bu Rina (frame final) |
| --- | --- | --- |
| Jarak pupil | 93,6 px sumber = **12,8 px seni** | **13,0 px seni** |
| Lebar wajah (kulit, pipi ke pipi) | ± 192 px sumber = ± 26 px seni | **26 px seni** (di dalam hijab) |
| Garis mata -> bawah dagu | ± 128 px sumber = ± 17,4 px seni | ± 19 px seni (dagu Bu Rina lebih panjang; kepala Miss agak miring) |
| Kepala (puncak -> dagu) | sanggul -> dagu 397 px = 54 px seni | hijab -> dagu 45-46 px seni (tanpa sanggul) |
| Tinggi berdiri | ± 185 px seni | 189 px seni (756 satuan dunia) |

Pitch sampling per lembar (px sumber per px seni) = 4,00 x skala kotak kulit wajah lembar itu terhadap lembar pose:
`pose` 4,000 · `jalan` 3,634 · `gestur-duduk` 3,042 · `ekspresi` 5,285. Di lembar `pose` pitch ini kebetulan hampir sama
dengan grid bawaan gambar (skor fasa 1,4-1,55); lembar lain tidak punya grid yang cocok (skor ± 1,05 = acak), jadi di
sana hasilnya murni re-sampling moda inti sel.

## Pipa

1. **Latar** (`rina-latar.mjs`): isi-banjir dari tepi gambar lewat piksel hampir putih (min RGB >= 226, max-min <= 30),
   berhenti di garis gelap; halo JPEG maks 3 putaran; kantong putih tertutup >= 30 px dengan max-min rata-rata <= 9
   dibuang (celah lengan/tumit). Putih mata diukur max-min 9,9-15 sehingga tetap. Lembar ekspresi: kantong tidak dibuang
   (semuanya putih mata). Diperiksa di latar gelap & hijau.
2. **Sampling** (`rina-native.mjs`): moda klaster di 55 % tengah sel (`lib.sampelGrid`), fasa grid = energi tepi terbesar.
3. **Tepi**: pijar terang di luar garis gelap dibuang; pijar pucat tanpa garis di dalamnya diwarnai garis. Bilah kunci
   dilindungi (`LINDUNG_TEPI`).
4. **Palet**: hampir-hitam netral diseragamkan ke warna garis Miss Raksa `#0f0b11` (persentil 5-25 piksel tepi master
   14,10,17..17,11,20); palet gabungan 40 warna (median cut + k-means OKLab dari `lib.mjs`) dengan kunci garis, putih mata
   `#f7f2ea`, perak kunci `#bcbab6`; bintik beda-nada tipis dibuang.
5. **Suntingan tercatat** (`rina-suntingan.mjs`, log di `native/log-suntingan.json`):
   - `duduk-condong`: 5 baris betis dihapus (y 132-136) supaya panjang kaki sama dengan keluarga gestur duduk.
   - Keluarga gestur duduk: betis + sepatu (baris kanvas >= 144) disalin dari `duduk` ke lipat-tangan (649 px),
     genggam (636), dagu (759), dada (459), telepon (471) -> ganti gestur tidak membuat kaki meloncat.
   - `dagu`: 3 px sisa latar putih JPG di celah jari telunjuk-rahang (kantong < 30 px, tidak dibuang langkah 1) diisi
     bayangan kulit `#a05422` (bukan alpha 0: celah itu tertutup garis jari & rahang).
   - Ekspresi (revisi 2, pembeda = ALIS + MULUT, bukan kelopak): `netral` sudut mulut kanan diratakan (y41 -> y40) dan
     bibir bawah merah dilunakkan (tidak cemberut); `serius` TANPA kelopak turun, alis lurus menurun ke dalam (luar y23 ->
     dalam y25), mulut garis gelap 7 px, bibir terkatup; `lega` kelopak turun 1 px saja (bukan 2) + ujung dalam alis naik
     1 px, senyum lembut sumber tetap. Koordinat & alasan per piksel di `rina-suntingan.SUNTING_EKSPRESI`.
   - `bingung` + bicara: mulut sumber sudah menyeringai terbuka; varian bicaranya = mulut MENUTUP (10 px).
   - Wajah: warna di luar palet wajah (biru baju, krem/tan apron, oranye trim) di dalam mask wajah dipetakan ke warna
     wajah terdekat (12-26 px per ekspresi).
5b. **Harmonisasi v5** (`rina-harmoni.mjs`, sesudah suntingan tahap A, sebelum `jalan-b` & keluarga duduk): lihat bagian
   "Harmonisasi v5". Jangkar kaki dihitung dari frame SEBELUM langkah ini (tepi sepatu yang dirapikan tidak menggeser
   titik lantai).
6. **Wajah terkunci-kepala** (`rina-wajah.mjs`): lihat bagian Wajah. Sejak revisi 2 setiap wajah ekspresi = wajah netral +
   fitur ekspresi saja (`susunFitur`).
6b. **`jalan-b`** (`rina-jalan.mjs`): bingkai lintas dirakit dari `jalan-a` (badan atas) + `berdiri` (kaki); lihat Revisi 2.
7. **Atlas**: potongan identik di-dedup, dikemas skyline, lebar dipilih luas terkecil; PNG terindeks.

## Frame (semua hadap kiri = ke meja, kecuali `-kanan`)

| Frame | Sumber | Jangkar | Catatan |
| --- | --- | --- | --- |
| `berdiri` | pose #1 | kaki | kunci di tangan depan; diam/tiba & `aktivitas` (bukan lagi bingkai jalan) |
| `jalan-a` | pose #2 | kaki | langkah (kontak); jalan 2 bingkai = `jalan-a` <-> `jalan-b` |
| `jalan-b` | dirakit | kaki | lintas: badan atas = `jalan-a` (identik), kaki `berdiri`, kaki jauh terangkat 4 px; jangkar x = `jalan-a`, badan 1 px lebih tinggi |
| `duduk-turun` | jalan #4 | kaki | bingkai antara berdiri <-> duduk, kunci di lutut |
| `duduk` | gestur #5 | pinggul | tangan di pangkuan; tubuh untuk netral/serius/tersenyum/senang |
| `lipat-tangan` | gestur #1 | pinggul | tubuh `kesal` |
| `genggam` | gestur #2 | pinggul | tubuh `cemas` |
| `dagu` | gestur #3 | pinggul | tubuh `bingung` (jari di dagu dilindungi dari wajah) |
| `dada` | gestur #4 | pinggul | tubuh `lega` |
| `telepon` | gestur #6 | pinggul | gagang di telinga; hanya untuk sisipan panggilan |
| `duduk-condong` | pose #4 | pinggul | condong, kunci di lutut |
| `berdiri-kanan`, `jalan-a-kanan`, `jalan-b-kanan` | cermin | kaki | keluar ke pintu (`berdiri-pergi`) |

Cermin diperiksa: kunci pindah ke tangan kiri Bu Rina (tetap tangan depan, masuk akal), ikatan apron tetap di belakang
punggung, bros hijab di tengah. Tidak ada tulisan/lencana yang terbalik.

Lembar pose #3 dan jalan #1-3 hanya disimpan sebagai referensi (`native/palet/ref-*.png`): proporsi lembar gestur berbeda
(kepala relatif lebih besar); mencampur `duduk` pose #3 dengan tubuh gestur membuat badan berubah ± 8 % saat ekspresi ganti.

## Skema manifest `bu-rina.json`

Koordinat = piksel seni relatif ke pojok kiri-atas frame (setelah trim); titik berada di batas piksel. Posisi dunia:
`kiriAtas = round(duniaX / 4 - jangkar.x), round(duniaY / 4 - jangkar.y)` lalu kalikan skala kamera BULAT, nearest.

```
{ versi, dibuat, tokoh: 'bu-rina', piksel: 4, gambar: 'bu-rina.png', ukuranAtlas: [w, h], palet: [...40 hex],
  ekspresi: [8], varian: ['dasar','kedip','bawah','bicara'],
  frame: { <id>: {
    rect: [x, y, w, h]            // di atlas
    hadap: 'kiri' | 'kanan', jenisJangkar: 'kaki' | 'pinggul',
    jangkar {x,y}                 // kaki: tengah kaki di garis lantai; pinggul: pinggul di dudukan
    kaki {x,y}                    // selalu ada: titik lantai (untuk transisi duduk <-> berdiri)
    kepala {x,y}, leher {x,y}, titikWajah {x,y}
    tangan?: { kunci {x,y} } | { telepon {x,y} }, kunciTergambar, teleponTergambar
    wajah: { kotak: [x,y,w,h], mata: [x,y,w,h], mulut: [x,y,w,h] }   // relatif frame
    ekspresi: { <e>: { dasar, kedip, bawah, bicara } }             // rect atlas; ukuran = kotak/mata/mulut
    asal, cerminDari? } },
  pose: { berdiri, 'jalan-a', 'jalan-b' (-> frame jalan-b), 'berdiri-pergi', 'duduk-turun', duduk{ tubuhEkspresi }, 'duduk-condong', telepon },
  animasi: { jalan: { kiri: ['jalan-a','jalan-b'], kanan: ['jalan-a-kanan','jalan-b-kanan'] }, duduk: [...], berdiriDariDuduk: [...] },
  keluargaDuduk, potret: { frame:'duduk', jendela: {32,44,52,64,96}, dekat: {52,64,96}, saran },
  telepon: { frame:'telepon', jendela (56 px: kepala utuh + gagang) }, aktivitas: { frame:'berdiri', ekspresi:'netral' }, berkas }
```

**Urutan gambar** (satu tokoh): tubuh `rect` -> `ekspresi[e].dasar` di `wajah.kotak` -> (`kedip` ATAU `bawah`) di
`wajah.mata` -> `bicara` di `wajah.mulut`. Semua potongan beralpha biner; hanya piksel di dalam mask wajah yang buram.
Tubuh sendiri sudah berwajah netral, jadi tubuh tanpa lapisan wajah tetap sah (fallback bila potongan gagal).

**Pemetaan tubuh ekspresi saat `duduk`**: kesal -> `lipat-tangan`, cemas -> `genggam`, bingung -> `dagu`,
lega -> `dada`, netral/serius/tersenyum/senang -> `duduk`. Frame ini berbagi jangkar pinggul & kaki identik, tetapi
kepala bergeser antar gestur (terhadap `duduk`): lipat-tangan +3/-4,5 px, genggam +2,5/-2, dagu +1,5/-1, dada & telepon
0. Itu perubahan postur; panggung boleh crossfade singkat saat ganti tubuh.

`pandang`: `bawah` -> varian `bawah`; `lawan`/`pemain` -> dasar (mata sudah ke kiri = ke meja & kamera-kiri);
`depan` tidak punya frame menghadap kamera (pakai dasar).

**Relasi dengan `ruang.json`** (lokasi `meja`): `tempat.nasabahDuduk` (1148, 736) = jangkar pinggul,
`tempat.nasabahBerdiri` (1320, 904) = jangkar kaki. Diuji di Chrome headless di atas lapisan ruang: pinggul jatuh di
dudukan kursi, kaki di lantai. Kaki pose duduk = jangkar + (-30, +40) px seni = dunia (1028, 896), 290 satuan di kiri
titik berdiri: untuk transisi duduk, taruh `duduk-turun` dengan `kaki` di antara keduanya atau geser tokoh selama bingkai
itu. Kursi (`kursiBelakang`, z 70) harus digambar SEBELUM Bu Rina.

## Wajah terkunci-kepala

- Kepala ekspresi (lembar ekspresi) disejajarkan ke kepala `netral` dengan mencocokkan siluet hijab (geser <= 1 px),
  lalu satu mask wajah bersama (kulit + fitur di dalam bingkai hijab) dipakai untuk semua ekspresi.
- Per tubuh: mask kulit wajah tubuh itu (+ piksel mata/alis yang menempel garis pipi), dikurangi `PENGHALANG`
  (jari di dagu, tangan + gagang telepon). Wajah netral dicocokkan ke tubuh lewat peta gelap (alis, mata, hidung, mulut),
  hanya translasi. Semua ekspresi & varian memakai geser yang sama.
- **Ekspresi = netral + fitur** (revisi 2, `rina-wajah.susunFitur`, kotak `rina-suntingan.KOTAK_FITUR` di koordinat kepala
  netral: alis+mata [9,19,40,14], mulut+sudut/lipatan [12,37,23,7]). Di dalam kotak, piksel yang FITUR di netral atau di
  ekspresi (bukan kulit, atau kulit gelap L OKLab < 0,66 = lipatan) diambil dari kepala ekspresi; piksel yang kulit di
  keduanya tetap milik netral. Hidung, pipi, dahi, garis dagu & tepi wajah selalu netral. Diukur (piksel beda vs netral di
  luar kotak `wajah.mata`/`wajah.mulut`, semua frame): sebelum 131-219 px (33-95 beda warna besar), sesudah 30-63 px, dan
  sisanya hanya alis (di atas kotak mata) serta sudut/lipatan mulut (di luar kotak mulut).
- Hijab, garis kepala, dagu, dan badan tidak pernah berubah: `rina-tinjau` membandingkan SEMUA frame x 8 ekspresi x
  {dasar, kedip, bawah, bicara, kedip+bicara, bawah+bicara} terhadap netral: **0 piksel berubah di luar `wajah.kotak`**
  (maks 159 piksel berubah di dalamnya; revisi 1: 356), dan varian kedip/bawah/bicara: **0 piksel di luar kotak mata/mulut**.
- `rina-tinjau` juga memeriksa **kantong putih**: komponen piksel hampir putih (L > 0,9, kroma < 0,04) di luar
  `wajah.mata` (+1 px) yang dikelilingi piksel tidak terang (< 3 tetangga-8 ber-L >= 0,8). Revisi 1: 1 temuan (`dagu`,
  3 px, tepat lokasi reviu); revisi 2: **0** di semua frame x ekspresi x varian. Kilap krem apron (dikelilingi krem) lolos.
- `kedip` = mata tertutup (garis kelopak, satu warna kelopak per mata); `bicara` = garis mulut gelap dibuka 1 px
  rongga + bibir bawah (bingung: menutup). `senang` sudah bermata tertutup-senyum: kedip = dasar.
- `bawah` (ronde 3, 28 Sep) = **lirik ke bawah, iris tetap terlihat** (`rina-wajah.lirikBawah`). Versi lama (kelopak turun
  2 px dari piksel non-kulit teratas) menyisakan 1 baris iris dan terbaca MATA TERPEJAM di 1440, 390@2 dan 844x390@2,
  terutama `lega` (kelopaknya sudah turun 1 px): temuan verifikasi di momen kartu `b4-polis-intro#1` berlabel "Tenang".
  Sekarang garis bulu mata diletakkan di baris putih mata teratas mata dasar (bukaan turun tepat 1 baris; di atasnya satu
  warna kelopak), baris di bawahnya (iris gelap + putih di kedua sisi + kelopak bawah) tidak diubah; hanya kolom mata
  (putih ± 2 px) yang disentuh, garis wajah/tepi hijab tidak. Mata yang bukaannya sudah 2 baris (`serius` kiri) tidak
  diturunkan lagi. Build GAGAL bila bukaan sesudahnya < 2 baris untuk salah satu mata (dicatat `lirikBawah` di
  log-suntingan: bukaan netral 2/2, cemas 3/3, kesal 3/3, bingung 3/3, lega 2/2, serius 2/3, tersenyum 3/3).
  `senang`: lengkung ∩ tetap menjadi kelopak atas, celah di bawahnya diberi putih + iris 2 px (`SUNTING_VARIAN`, 7 px):
  mata tersenyum melirik ke bawah. Diperiksa pada 2 dan 3 px perangkat per piksel seni, di ruang dan di aplikasi.

## Potret

Jendela di frame `duduk` + wajah ekspresi, skala bulat: 32 (32 x1), 44 (44 x1), 52 (52 x1), 64 (64 x1), 96 (48 x2);
dekat: 52 (26 x2), 64 (32 x2), 96 (32 x3). Revisi 2, dilihat pada ukuran tampil nyata (latar terang & gelap): di jendela
`dekat` 64/96 ke-8 ekspresi terbedakan; netral kini datar (tidak murung), serius = alis menurun + garis mulut gelap, lega
= alis dalam naik + kelopak teduh 1 px + senyum (beda dari tersenyum yang bermata terbuka). Di 44 px x1 fitur hanya 1 px:
serius vs netral terbaca bila berdampingan (alis lebih gelap/menurun) tetapi masih halus bila dilihat sendiri; saran tetap
jendela `dekat` untuk avatar. Belum diuji pada HP fisik, belum diuji dengan pemain (keterbacaan emosi = penilaian visual).

## Batasan yang diketahui

- Sumber JPG: noise & drift grid; tepi garis kaki/sepatu masih ada beberapa piksel lepas; bayangan bawah dagu agak
  kasar di beberapa frame. Tidak diklaim pixel-perfect.
- Jalan 2 bingkai: `jalan-a` (kontak) <-> `jalan-b` (lintas). Badan atas identik (140 baris pertama sama persis bila
  disejajarkan di titik kepala; 10 piksel celah selangkangan tepat di atas keliman diisi warna celana), kepala naik-turun
  1 px, jangkar x sama. Karena badan atas dikunci, lengan TIDAK berayun di bingkai lintas (lengan belakang tetap di posisi
  langkah). Kedua kaki sewarna, jadi "kaki mana di depan" tidak terbaca (disengaja: kontak <-> lintas terbaca bergantian).
  Berhenti = `jalan-a` -> `berdiri` sekali: kepala naik 5 px & gambar badan berganti (dua figur sumber berbeda).
- Panggung saat ini menambah naik-turun transform 6 satuan dunia (1,5 px seni, pecahan) di tengah tiap langkah; dengan
  frame piksel naik-turun sudah ada di bingkai (1 px) -> transform itu sebaiknya 0 atau kelipatan 4 satuan.
- `duduk-condong` & `duduk-turun` dari lembar lain; proporsi dekat tetapi tidak identik dengan keluarga gestur.
- Tidak ada frame hadap-kanan untuk duduk; tidak ada frame berdiri tanpa kunci (kunci tergambar di berdiri/jalan).
- Titik pinggul duduk (56,120 native `duduk`) adalah perkiraan visual; tidak ada kursi di sumber.
- Pembanding Miss Raksa di lembar tinjau memakai master v4 yang disampel cepat (belum atlas Miss final).
- Naskah, ID, gameplay, dan save tidak disentuh; integrasi panggung dikerjakan agen lain.

## Harmonisasi v5 (28 Sep) — gaya garis & tekstur sama dengan Miss Raksa

Brief v4-polish §6: "selaraskan bayangan, sorotan, ketebalan garis, dan kepadatan detail Miss dan Bu Rina". Temuan terukur
(alat ukur di scratchpad v5/konsistensi, frame `duduk`/`berdiri` vs Miss `berdiri`/`duduk-dengar`): tepi siluet Miss
61 % cokelat tua hangat (#461605/#340d03) + 31 % hitam, Bu Rina 44-50 % hitam #0f0b11 dan 13-15 % tanpa garis sama
sekali; taji tepi Miss 4 per frame, Bu Rina 15-19; lekuk 13 vs 20-34; bercak 1-3 px nada tetangga di hijab, tunik dan
celana (sisa JPG). Langkah (deterministik, hanya warna palet yang sudah ada, parameter di `HARMONI`):

| Langkah | Aturan | Piksel per frame |
| --- | --- | --- |
| taji / lekuk / lepas | taji (>= 3 tetangga-4 transparan) dibuang, lekuk (>= 3 tetangga-4 buram) diisi warna tetangga tergelap, komponen lepas <= 2 px dibuang | 11-32 / 10-27 / 0 |
| garis siluet | tepi hitam (#0f0b11, #180401) -> cokelat tua #290e05 (logika garis Miss), kecuali di bahan gelap (L < 0,36) dan kotak lindung (kunci, gagang, jari) | 57-119 |
| tepi pipi | abu-cokelat keruh (#76502f, #53473d) antara kulit & hijab/transparan di baris kepala -> #3d1406 | 0-5 |
| pijar tepi | krem kusam di tepi siluet yang sisi dalamnya bahan gelap (tepi kiri celana) -> garis | 1-6 |
| goresan celana | kontras sedang (< 0,16 OKLab), <= 2 tetangga sewarna, mayoritas abu celana (L 0,25-0,5, kroma < 0,035) -> abu celana | 48-121 |
| bintik | <= 2 tetangga-8 sewarna, >= 5 tetangga satu warna, beda nada < 0,075 OKLab -> warna mayoritas (2 putaran) | 256-312 |
| kulit wajah (kepala netral) | bintik yang sama, hanya di mask wajah, di luar kotak fitur (alis, mata, mulut tidak disentuh) | 4 |

Tidak diubah (disengaja): bentuk tubuh, pose, ekspresi, warna kulit (identitas; kulit Bu Rina tetap lebih gelap & oranye
daripada Miss), hijab bata, tunik biru, apron, bros, kunci, jumlah & urutan palet (ikon kepala mini tetap sah). Arah cahaya
kedua tokoh sama logikanya (sisi lebar wajah yang menghadap kamera terang, sisi yang berpaling berbayang), jadi tidak
digambar ulang. Hasil: `rina-tinjau` 0 piksel berubah di luar kotak wajah/mata/mulut, kantong putih 0; satu-satunya
perubahan geometri manifest = `duduk-turun` kotak wajah 1 kolom lebih sempit (kepala x 29 -> 29,5).

## Revisi 2 (reviu juri 27 Sep) — ringkas

| Temuan | Perbaikan | Bukti |
| --- | --- | --- |
| Bintik putih 3 px di dagu (`dagu`, semua `bingung`) | suntingan tercatat `px dagu #a05422` + cek `kantongPutih` di `rina-tinjau` | kantongPutih = [] (revisi 1: 1 temuan tepat di lokasi reviu) |
| Netral murung, serius ~ netral, lega mengantuk | suntingan alis/mulut/kelopak (Pipa 5) | potret ukuran nyata 44/52/64/96 + dekat, terang & gelap, sebelum/sesudah |
| Kulit wajah meletup saat ganti ekspresi | ekspresi = netral + fitur (`susunFitur`) | beda vs netral di luar kotak mata/mulut 30-63 px (dulu 131-219), hanya alis & sudut mulut |
| Jalan langkah-rapat, kepala 5 px, badan beda gambar | `jalan-b` lintas (`rina-jalan.mjs`), `animasi.jalan` = a <-> b | kepala 1 px, 140 baris badan atas identik; gerak 270 md/bingkai di 1x & 3x (GIF + strip sampel) |

Belum: HP fisik, uji pemula, lengan berayun di bingkai lintas (butuh gambar baru), bingkai hadap-kanan untuk duduk.
