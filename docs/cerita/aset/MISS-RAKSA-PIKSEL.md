# Miss Raksa — frame produksi pixel art (v4 → v5 polish)

## v5b (28 Sep 2026, temuan verifikasi v5): lengan tunjuk digambar ulang + celah lengan-badan ditutup

1. **Lengan tunjuk** (`TUNJUK`, blok x 66 kiri / 70 kanan, y 81; menggantikan lengan "v5 tangan" +
   `SISI_BADAN_TUNJUK_KANAN` + `BERSIH_SISI_TUNJUK_KANAN`). Temuan: lengan v5 = lengan v4 yang dipanjangkan; lengan atas
   menyatu dengan kontur badan lewat celah 1-4 px bergerigi, siku tidak terbaca, lengan bawah rebah lalu jari jatuh tegak
   dari gumpalan tangan. Kini digambar ulang dari bawah ketiak: lengan atas lurus turun (13 → 10 px) dipisah dari badan
   oleh **celah ketiak berbentuk baji** yang bersih (2 px di baris 81 melebar ke 5-6 px, garis sisi badan 1 px digambar
   ulang) → **siku** bersudut tegas di kiri-bawah tepat di atas tepi jauh meja + lipatan siku dalam → lengan bawah
   menurun ± 25° ke kanan (terangkat, tidak rebah) → manset miring → punggung tangan, jari tertekuk (lipatan S/T),
   **telunjuk 2 px** ke kartu. Ujung telunjuk TIDAK berubah (kanvas kiri (98,114) = frame (70,115); kartuMeja tetap).
   Blok disusun dengan generator draf (scratchpad agen) lalu disunting tangan; `miss-suntingan.mjs` memuat data final.
   Arah kiri + `TUNJUK_SISI_KIRI` (sisa garis sisi badan sumber dibayangi). `tepiLengan`/`diAtasMeja` dihitung ulang
   otomatis dari gambar.
2. **Celah lengan-badan** (`CELAH_DENGAR`, `CELAH_DENGAR_KIRI`, `CELAH_JELASKAN`, `CELAH_JELASKAN_KIRI`, `CELAH_BERDIRI`,
   `CELAH_BERDIRI_KIRI`). Lembar gestur *dengar* punya celah transparan bergerigi 1-4 px antara lengan dan badan (kanvas
   kiri x 69-74, baris 81-90). Sejak badan duduk dinaikkan 11 px, celah itu seluruhnya di atas meja dan memperlihatkan
   kursi gelap → terbaca noda/sobekan di jas (paling jelas di `duduk-dengar-kanan`, kiri layar). Celah diisi kain jas yang
   menggelap ke arah lengan (F → l → L), garis sisi badan lama jadi bayang, hanya garis dalam lengan yang tersisa sebagai
   kontur. Diterapkan di duduk-dengar, duduk-jelaskan, duduk-tunjuk (lengan istirahat), telepon, dan juga `berdiri` &
   `duduk-turun` (badan yang sama; siluet tidak berubah sepanjang animasi duduk/bangkit). Garis sisi badan telepon di baris
   89 dipindah ke x 69 (dulu serpihan kontur lepas di x 71). Lubang tertutup di atas garis meja duduk-dengar: 33 → 3 px
   (sisa 3 = takik 1 px di bahu/kerah, ada sejak v4 di semua pose).
3. Atlas v5b: 768 × 229, 39 warna, 19 972 byte (sha256 `b861b3fe…`), manifest sha256 `8356d020…`; dua kali bangun
   identik. Sheet global `client/public/karakter/miss-raksa-besar.*` dibangun ulang (`node tools/siapkan-karakter.mjs
   missRaksa`; frame berdiri ikut celah tertutup; ukuran di karakter-sprite.json tidak berubah). Ikon mini tidak berubah.

## v5 (28 Sep 2026, review pemilik `raksa-v4-review-20260928`): wajah dari fitur master + postur duduk lebih tinggi

Temuan review: wajah v4 sayu (mata = strip gelap berkelopak berat), wajah rata dibanding Bu Rina, dan Miss terbenam di
balik meja (mata 15,5 px seni di bawah mata Bu Rina). Akar masalah wajah: `miss-wajah.mjs` v4 MENGHAPUS mata/alis/mulut
sumber (`WAJAH.kulit`, "kulit bersih") lalu menggambar sprite ASCII generik. v5:

1. **Wajah dasar = sel `e-netral` master**, tidak dihapus. Wilayah muka diambil dari sampel **rata-rata area**
   (`miss-native.sampelRata`, kisi 6,5 px sumber/px seni yang sama dengan sel moda, dipetakan ke `PALET_MUKA`;
   keluaran `native/rata/e-*.png`): moda inti menebalkan bulu mata jadi 2 baris dan menelan baris atas iris (itu
   sumber kesan "sayu"), rata-rata area menjaga bukaan mata, alis tipis, **rona pipi, bayangan kelopak & rahang master**
   (bayangan lembut yang v4 ratakan). Garis luar kepala, rambut, telinga, kerah tetap dari sel moda (siluet & registrasi
   kepala v4 tidak berubah → kepala tidak melompat).
2. **Mata master** dibaca ulang tangan pada kisi itu (`MATA_NETRAL`): bulu mata atas 1 baris + sayap kecil di sudut
   luar, iris gelap berkilap 1 px, putih mata di sisi dalam (segitiga master), kelopak bawah lembut. Tidak diperbesar,
   eyeliner tidak dipertebal (1 px, sama dengan master). Tatapan: `kiri` = tatapan master (ke pemain/kamera); `kanan`
   = isi bukaan mata dibalik di tempat (`tatapKanan`) → **menatap Bu Rina** (cermin murni = tetap menatap kamera).
3. **Ekspresi = cangkok dari sel master terdaftar.** Sel `e-prihatin/e-senyum/e-serius/e-lega/e-kedip` didaftarkan ke
   kepala `e-netral` (`miss-wajah.daftarSel`: geser bulat terbaik pada kelas piksel rambut/kulit/garis DI LUAR kotak
   fitur → sanggul, garis rambut, telinga, kerah; bukan fitur). Geser terdaftar (dx,dy): prihatin (5,0), senyum
   (−5,0), serius (−5,2), lega (0,2), kedip (5,2). Mulut prihatin/senyum/lega = cangkok sel RATA terdaftar, hanya di
   rentang kulit per baris (garis rahang tetap dasar). Alis tiap ekspresi = garis 1 px mengikuti garis tengah alis sel
   master (`ALIS`; rata-rata area membuat alis tipis jadi cokelat pudar 2 baris). Semua suntingan tangan tercatat
   (`log-suntingan.json`: `cangkokRata`, `wajahTangan`, `daftarSel`).
   - `netral` (mendengar): mata terbuka tenang, tatapan jelas ke lawan bicara, bibir kecil rileks (tidak tersenyum).
   - `prihatin`: ujung DALAM alis naik (sel e-prihatin), mulut kecil sudut turun; **mata tetap mata netral yang
     menatap lawan bicara** (mata sel e-prihatin menunduk → terbaca melihat ke tempat lain, tidak dicangkok).
   - `serius`: alis lebih rendah & datar, bibir tertutup datar (bukan bibir merah mengerucut sel e-serius): fokus, tenang.
   - `senyum`: lengkung senyum sel e-senyum, mata terbuka.
   - `lega`: senyum kecil sel e-lega; **mata tetap terbuka** (sel e-lega terpejam), kelopak bawah naik 1 px (santai).
   - varian (kepala terkunci; 0 piksel berubah di luar kotak mata/mulut): `kedip` = garis tutup melengkung desain sel
     e-kedip di posisi mata terbuka; `bawah` = kelopak turun 1 baris, iris 2 baris + kilap + putih tetap (membaca
     dokumen); `lirikKanan` (duduk-tunjuk-kiri); `bicara` = celah gelap kecil + bibir bawah turun 1 baris (gaya master).
   - `bangun-miss.periksaMata` menggagalkan build bila mata `dasar`/`bawah` ekspresi mana pun tidak punya iris ≥ 3 px
     pada ≥ 2 baris + putih mata, atau `kedip` masih punya putih mata.
4. **Postur duduk (semua frame duduk, kedua arah):** badan **11 px seni lebih tinggi** terhadap meja: `DUDUK.garisMeja`
   kanvas 90 → 101 (frame: 91 → **102**), pinggul tetap `garisMeja + 34` (frame y **136**, x 30) → jangkar panggung
   `tempat.mentor` (656, 792) dan garis meja ruang (`garisMejaMentor` 656) TIDAK berubah; yang berubah hanya berapa
   banyak badan di atas tepi meja: dada, lengan atas & bahu kini terlihat (v4: 38 baris badan). Lengan bawah + manset +
   tangan diturunkan ke permukaan meja (`miss-tubuh.turunkanLengan`: siku tetap, lengan bawah diregang, tangan turun
   7-8 baris; jas di balik tangan diisi) → tangan **bertumpu di meja** (bukan melayang di depan pinggang). Tunjuk
   (v5 tangan 28 Sep, `TUNJUK`): lengan digambar ULANG sebagai siluet "L": bahu (sumber) → lengan atas TURUN di sisi
   badan, menyempit 15 → 11 px, celah 3-5 px ke garis sisi badan (ruang negatif) → SIKU bertumpu di meja tepat di depan
   tepi jauh (sudut tajam di kiri-bawah + lipatan 'F' di tekukan dalam) → lengan bawah MENJULUR ± 35° ke kanan-bawah
   (maju & keluar, ke kartu / ke arah Bu Rina; sisi atas terang, sisi bawah berbayang) → manset putih miring → tangan
   seukuran tangan dengar dengan jari tertekuk → telunjuk 2 px turun ke kartu kanan-tengah (`kartuMeja` kembali ke
   x 800). Ronde meja 2 (siku ditekuk keluar '>', kartu digeser ke 768) diganti: lengan bawahnya hanya 3 baris sehingga
   tangan terbaca muncul dari bawah siku. Lengan lain = satu tangan bertumpu (`TANGAN_ISTIRAHAT`). Telepon: tangan jauh bertumpu di meja. Kepala sama di semua frame (tidak di-scale, kepala
   tidak diperbesar). `duduk-turun`: badan 10 px seni di bawah berdiri dan 10 di atas duduk (`TURUN`: kaki kanvas 172,
   garis meja 111) → kepala turun dua langkah sama.
5. **Manifest per frame duduk (baru):** `garisMata` (tengah baris putih mata wajah netral, frame; 36,5),
   `mataDiAtasMeja` (`garisMeja − garisMata` = **65,5** px seni; v4 55), `tanganMeja` (titik tangan di permukaan meja),
   selain `garisMeja` (102), `pinggul` (30,136), `diAtasMeja`, `tangan`.
6. **Ikon mini 32** (`bangun-ikon.mjs`): mata strip gelap v4 → mata terbuka (garis bulu mata + iris + titik kilap),
   alis lembut per ekspresi; lega bermata terbuka.

Garis mata di ruang (lokasi `meja`, jangkar ruang kini): Miss duduk y dunia **394** (98,5 px seni); Bu Rina `duduk`
(pinggul (1148, 736), tengah baris putih mata frame 27,5 = 90,5 di atas pinggul) y **374** → Miss **5 px seni** lebih
rendah (v4: 15,5). Gestur duduk Bu Rina lain bergeser −2…+4 (mata di atas pinggul 89,5-95,5 menurut kotak mata); di
panggung dev :5320 momen `b1-datang` (Bu Rina gestur dada, cemas) terukur **8,5 px seni** dari tangkapan 390×844. Bila
panggung ingin ≤ 6 untuk semua gestur, Miss harus naik lagi terhadap meja (ubah `DUDUK.garisMeja` + lengan di sini),
bukan hanya jangkar, supaya garis meja frame tetap di tepi meja ruang.

Atlas v5: 576 × 298, 39 warna, 24 397 byte (sha256 `265552bc…`), manifest sha256 `fe1ef8a0…`; dua kali bangun identik.
Lembar tinjau v5: scratchpad agen (`v5/miss-wajah-postur/akhir/`).

---

Status 28 Sep 2026 (ronde 2, perbaikan temuan tinjau: ekspresi serius/senyum, garis tepi meja di lengan, sisipan
telepon, pandangan tunjuk): atlas + manifest **siap diintegrasikan**, belum dipasang ke panggung (tidak ada kode
aplikasi yang diubah). Belum ditinjau pemilik/PIC.
**Ronde 3 (28 Sep, temuan verifikasi)**: (1) varian mata `bawah` digambar ulang sebagai lirik ke bawah dengan iris
terlihat (versi lama terbaca terpejam di 844x390); (2) piksel lepas `#ad5c2e` di atas tangan bertaut `duduk-dengar`
(kanvas (60,93) = frame kanan (28,94)) dihapus dan garis atas tangan disambung ke manset; (3) frame baru
**`duduk-turun`** (kanan & kiri): bingkai antara berdiri ↔ duduk. Tubuh, rect, jangkar & kotak wajah 14 frame lama tidak
berubah (dibandingkan piksel demi piksel: hanya kotak mata varian `bawah` + 2 piksel `duduk-dengar`). Kontrak umum: [`PIKSEL.md`](PIKSEL.md). Skema manifest = skema Bu Rina
([`BU-RINA-PIKSEL.md`](BU-RINA-PIKSEL.md)) + tambahan di bawah, supaya satu penyusun (compositor) melayani keduanya.

Bukan klaim pixel-perfect. Tiga master generatif `character/miss-raksa-pixel-v4/*.png` (TIDAK diubah) di-sampel ulang
ke SATU skala, palet disatukan, lalu **disunting tangan dan setiap suntingan dicatat**
(`character/piksel/miss-raksa/native/log-suntingan.json`). Wajah & fitur adalah interpretasi piksel yang ramah, bukan
klaim kemiripan dengan orang nyata. Foto referensi seragam hanya dilihat; tidak disalin ke repo.

## Berkas

| Berkas | Isi |
| --- | --- |
| `character/miss-raksa-pixel-v4/*.png` | Sumber (master berdiri, 6 gestur, 6 ekspresi). **Tidak diubah.** |
| `character/piksel/miss-raksa/native/mentah/*.png` | Hasil sampling tiap sumber/sel (sebelum palet) |
| `character/piksel/miss-raksa/native/palet/*.png` | Sesudah rapikan alpha + palet tetap (sebelum suntingan) |
| `character/piksel/miss-raksa/native/<frame>.png` | Frame final di kanvas kanonik 121 × 200 (wajah netral terpanggang) |
| `character/piksel/miss-raksa/native/wajah/*.png` | Kepala dasar per arah + render 5 ekspresi × 4 varian (kanvas kanonik) |
| `character/piksel/miss-raksa/native/log-suntingan.json` | Semua suntingan tangan (op, frame, jumlah piksel berubah, alasan) |
| `character/piksel/miss-raksa/native/laporan-native.json` | Pitch, fasa, sel ambigu per sumber |
| `client/src/cerita/seni/piksel/miss-raksa.png` | Atlas 576 × 297 (ronde 3; sebelumnya 512 × 307), PNG terindeks 8-bit + tRNS, **39 warna**, 22 986 byte, 16 frame |
| `client/src/cerita/seni/piksel/miss-raksa.json` | Manifest (± 45 KB) |
| `client/src/cerita/seni/piksel/ikon-miss-raksa.png` + `ikon.json` | Ikon kepala mini untuk potret < 44 px CSS (`tools/piksel/bangun-ikon.mjs`; lihat [`PIKSEL.md`](PIKSEL.md) §5b) |
| `tools/piksel/bangun-miss.mjs` | Bangun (native → kepala → badan → wajah → atlas + manifest) |
| `tools/piksel/miss-native.mjs`, `miss-lib.mjs`, `miss-tubuh.mjs`, `miss-wajah.mjs`, `miss-atlas.mjs` | Modul alat |
| `tools/piksel/miss-suntingan.mjs` | DATA: palet tetap, huruf palet, sprite wajah, detail jas, resep frame, lengan gambar tangan |
| `tools/piksel/miss-tinjau.mjs` | Lembar tinjau + pemeriksaan, disusun ulang HANYA dari atlas + manifest |

```
node tools/piksel/bangun-miss.mjs                       # ± 1 dtk; dua kali bangun = hash atlas/manifest sama
node tools/piksel/miss-tinjau.mjs <folder> [svg-png]    # lembar 01-07 + laporan-tinjau.json
```

## Skala & sumber

| Sumber | Pitch (px sumber / px seni) | Cara |
| --- | --- | --- |
| master 1024 × 1536 | **7,34** (cariPitch skor 1,90) | fasa grid lokal `lib.medanFasa` (fasa bergeser ≤ ½ sel) + moda inti sel |
| gestur 3 × 2 | **4,57** (per sel 4,45-4,65) | tidak ada grid kasar; pitch = siluet kepala (46 baris teratas) paling cocok dengan kepala master (IoU 0,93-0,96) |
| ekspresi 3 × 2 | **6,5** (per sel 6,45-6,55) | idem (IoU 0,97) |

Hasil: kepala puncak sanggul → dagu **54** px seni; jarak pupil ± 13,5 (Bu Rina 13,0); berdiri 182 px seni (728 satuan;
Bu Rina 189). Palet **tetap** 39 warna (`miss-suntingan.PALET`): kuantisasi OKLab gabungan semua bahan dengan kunci garis
`#0f0b11` & putih mata `#f7f2ea` (sama dengan Bu Rina), merah bibir, dan 3 warna gagang telepon ruang
(`ruang-prop-gagang.png`) supaya gagang di tangan sewarna dengan prop meja. Rok emas mengikuti sprite lama (master).

## Susunan

> Butir 1-2 di bawah = v4 (riwayat). v5 menggantinya: kepala dasar = sel `e-netral` DENGAN fitur master (wilayah muka
> dari sel rata-rata area) + mata master + cangkok ekspresi dari sel terdaftar; lihat bagian **v5** di atas. Butir 3
> (badan) masih berlaku kecuali angka duduk (v5: garis meja kanvas 101, pinggul 135, lengan diturunkan).

1. **Kepala terkunci** (`miss-wajah.mjs`): SATU kepala dasar per arah. `kiri` = sel ekspresi *netral* (kepala paling
   bersih; ukuran = master) + **kulit wajah bersih** (`WAJAH.kulit`: fitur sumber & senyum dihapus, bintik diratakan).
   `kanan` = cermin di sumbu kerah + **belahan rambut dipindah** (`WAJAH.belahanKanan`, 14 suntingan): belahan tetap
   di sisi KIRI pemakai (kanan hidung) pada kedua arah, bukan ikut tercermin.
2. **Fitur tangan** (`WAJAH.mata/alis/mulut`): sprite ASCII (alis, mata jauh, mata dekat, mulut) di atas kulit bersih.
   Ekspresi = kepala dasar + HANYA piksel sprite; kulit, hidung, pipi, rambut tidak pernah digambar ulang.
   - `netral` (mendengar, TIDAK tersenyum): alis santai melengkung, mata terbuka (iris + kilap), bibir kecil tertutup datar.
   - `senyum` (ronde 2): alis naik 1 px; mata TETAP terbuka (iris 2 baris terang + kilap), hanya sudut kelopak bawah
     naik 1 px + garis kelopak bawah melengkung; mulut 10 px (netral 6), sudut naik 2 px (tertutup); rona pipi
     `#f29a69` 2 px per pipi (`WAJAH.pipi`). Beda vs netral 54 px.
   - `prihatin`: ujung dalam alis naik, bibir kecil sudut turun.
   - `serius` (ronde 2): kedua alis lurus, turun 1 px sepanjang alis, ujung dalam turun 2 px & setebal 2 baris;
     kelopak atas menutup baris iris atas (mata `serius`); mulut garis datar gelap 4 px (`#5c352a`/`#452b29`, bukan
     bibir merah) + bayangan 1 px; saat bicara garis gelap tetap, celah terbuka di bawahnya. Beda vs netral 68 px
     (ronde 1: 17 px, hanya warna). Tegas, bukan marah: dicek pada p44/p64 ×1 dan bingkai HP 2×.
   - `lega`: kelopak atas turun setengah + kelopak bawah naik (mata teduh), senyum kecil lebih sempit dari `senyum`.
   - varian: `kedip` (tertutup; senyum/lega melengkung), `bawah` (lirik ke bawah = membaca kartu), `bicara` (mulut
     terbuka: rongga gelap + bibir bawah).
   - `bawah` (ronde 3): garis bulu mata SATU baris, turun 1 baris dari `buka` (lengkung diratakan); di bawahnya iris
     2 baris (atas gelap `xRRx` di bayang kelopak, bawah `VRRV`) diapit putih mata di kedua sisi, tanpa kilap; iris di
     kolom yang sama dengan `buka`. `senyum` & `lega` memakai `bawahSenyum` (= `bawah` + sudut kelopak bawah naik).
     Versi lama (kelopak 2 baris gelap `o`+`x` di atas 1 baris iris cokelat sedang) terbaca TERPEJAM pada 2-3 px
     perangkat per piksel seni. `bangun-miss.periksaMataBawah` menggagalkan build bila sprite `bawah` mana pun punya
     < 3 piksel iris, iris < 2 baris, atau < 2 piksel putih di bawah baris bulu mata terakhir (versi lama gagal di sini).
   - mata khusus `lirikKanan` = `bawah` dengan iris 1 px ke kanan gambar; HANYA varian `bawah` frame
     `duduk-tunjuk-kiri` (`frame.mataBawah`): kepala ke pemain, mata melirik kanan-bawah ke kartu.
   - Arah pandang: iris di tengah mata; `kiri` menatap pemain/depan, `kanan` (cermin) menatap Bu Rina.
3. **Badan** (`miss-tubuh.mjs`, resep `FRAME`): sel gestur disejajarkan di kerah (kanvas kanonik, kerah x 60 / y 52),
   kepala sel dibuang, kepala dasar dipasang. Semua frame memakai badan lembar gestur (jas lebih berisi daripada
   master), sehingga badan antar-pose konsisten.
   - Berdiri: jas sel + rok, kaki, sepatu **master** (baris master ≥ 115 → kanvas 109, x +29; ramp emas rok digeser
     1 tingkat ke emas lembar gestur).
   - `kiri`: lambang placeholder lembar dihapus → **batang emas polos** di dada kiri pemakai (kanan gambar).
   - `kanan`: badan dicermin, detail tercermin dihapus, kancing + garis bukaan ditempel TIDAK tercermin (tetap di sisi
     KANAN pemakai = kiri gambar, geser +2 menjauhi lengan dekat, kancing yang tertutup tangan dilewati), batang lencana
     polos di dada KIRI pemakai (kanan gambar; tidak menimpa tangan).
   - Duduk: garis meja kanvas y 90, pinggul y 124 (**34** px di bawah), x 58 (kiri) / 62 (kanan). Baris ≥ garis meja
     dihapus kecuali interval `simpan` (lengan bawah & tangan yang bertumpu di meja). Kolom lengan di baris 89
     (`TEPI_LENGAN`, tempat garis tepi jauh meja jatuh) dicatat per frame -> kotak `diAtasMeja` tambahan 1 baris.
     `duduk-dengar` (ronde 3): simpan baris 93 mulai x 61 (piksel (60,93) `#ad5c2e` menonjol di atas garis tangan di
     samping manset = titik lepas di depan meja) + `SAMBUNG_TANGAN_DENGAR` (garis atas tangan 'R' di (60,94) bertemu
     garis manset secara diagonal). x 60 = sumbu cermin, jadi kiri & kanan sama.
   - Antara (`duduk-turun`, ronde 3, resep `TURUN`): badan atas *dengar* yang sama (tangan bertaut, kepala terkunci)
     dengan jangkar KAKI di kanvas y 167 (berdiri: 182) → di y lantai yang sama, badan 15 px seni lebih rendah dari
     berdiri dan 16 di atas duduk. Baris ≥ 106 (= permukaan meja pada posisi itu) dibuang: lutut menekuk & paha tertutup
     meja dan tidak digambar; tangan bertaut berhenti tepat di tepi jauh meja.
   - Gambar tangan (tercatat): **telapak terbuka** jelaskan/persilakan (disederhanakan: ibu jari + jari menyatu),
     **lengan tunjuk** (`TUNJUK`, v5b: dari bawah ketiak; lengan atas lurus turun dengan celah ketiak berbentuk baji →
     siku bersudut di tepi jauh meja → lengan bawah menurun ke kanan → manset miring → punggung tangan, jari tertekuk,
     telunjuk 2 px di kartu; garis sisi badan ikut digambar dalam blok, kedua arah),
     **lengan telepon** (`TELEPON_LENGAN`: lengan bawah terangkat dari siku, manset putih 3 px di kanan kerah) +
     **tangan & gagang** (`TELEPON_TANGAN`, v5 tangan: SATU tangan menggenggam SATU gagang. Gagang satu bentuk dari
     corong dengar di telinga ke corong bicara di samping dagu, mulut tetap terlihat; kepalan kecil ± 8 × 7 px seni
     bergaris tepi penuh di TENGAH gagang (gagang lewat di balik jari, terlihat di atas & di bawah kepalan pada satu
     garis), tiga jari melingkar di depan gagang dengan lipatan di antaranya, nada kulit lebih gelap dari pipi, ibu jari
     di punggung gagang ke arah corong dengar, pergelangan sempit lurus ke manset; telinga di atas kepalan terlihat).
4. **Atlas & manifest** (`miss-atlas.mjs`): potongan identik di-dedup, dikemas skyline (lebar dengan luas terkecil).

## Frame

ID frame = `<pose>-<arah>`; `hadap` sama dengan arah. Selalu lewat `manifest.pose[pose][arah]`.

| Pose | kiri | kanan | Sumber badan | Catatan |
| --- | --- | --- | --- | --- |
| `berdiri` | ✓ | ✓ | gestur *dengar* + bawah master | tangan bertaut di pinggang |
| `berdiri-sambut` | ✓ (pembuka, ke pemain) | ✓ | gestur *sambut* + bawah master | telapak bertemu di dada, kedua lengan bawah tersambung ke manset |
| `berdiri-persilakan` | ✓ | ✓ (ke kursi pengunjung) | gestur *jelaskan* + bawah master | satu telapak terbuka, lengan lain istirahat |
| `duduk-turun` | ✓ | ✓ **bawaan** (kedatangan) | gestur *dengar*, dipotong di tepi meja | bingkai antara berdiri ↔ duduk: badan setengah turun, tangan bertaut menuju meja; jangkar **kaki**; hanya animasi panggung |
| `duduk-dengar` | ✓ | ✓ | gestur *dengar* | lengan bawah & tangan bertaut bertumpu di meja (3-16 px di bawah garis meja) |
| `duduk-jelaskan` | ✓ (telapak ke pemain) | ✓ (telapak ke Bu Rina) | gestur *jelaskan* | satu telapak terbuka, satu tangan bertumpu di meja |
| `duduk-tunjuk` | ✓ (bicara ke pemain sambil menunjuk; `bawah` = lirik ke kartu) | ✓ **bawaan / momen kartu** (+ `bawah`) | gestur *dengar* + lengan tunjuk (`TUNJUK`) | KEDUA arah menunjuk kartu di KANAN gambar (v5b: lengan atas terpisah dari badan oleh celah ketiak, siku bersudut di tepi meja, lengan bawah menurun ke kartu, telunjuk 2 px); lengan lain = satu tangan bertumpu di meja |
| `telepon` | ✓ | ✓ | gestur *dengar* + lengan & tangan telepon (`TELEPON_TANGAN`) | satu gagang, satu kepalan kecil di tengah gagang (tangan dekat, telinga dekat); lengan lain = satu tangan bertumpu di meja |

Arah `kiri` = menghadap kiri gambar (pemain di kiri kamera). `kanan` = menghadap Bu Rina / kursi pengunjung.

## Tambahan skema (di luar skema Bu Rina)

| Kunci | Arti |
| --- | --- |
| `ekspresi` | 5 wajah Miss: `netral, senyum, prihatin, serius, lega` |
| `ekspresiDari` | Ekspresi cerita (`tipe.ts`) → wajah (sama dengan `missRaksa.ts wajahDari`): tersenyum/senang→senyum, cemas/bingung→prihatin, serius/kesal→serius |
| `pandang` | `lawan`→arah kanan, `pemain`/`depan`→kiri, `bawah`→varian `bawah` (arah mengikuti pose) |
| `frame.pinggul` | = jangkar untuk frame duduk (kaki tersembunyi meja, tidak ada `kaki`) |
| `frame.kaki` (duduk-turun) | = jangkar (jenisJangkar `kaki`), di BAWAH rect (x = x kaki `berdiri` arah sama, y = `garisMeja` + 61 = 168; rect setinggi 108): tubuh di bawah tepi meja tidak digambar. Letakkan di y lantai `tempat.mentorBerdiri` (900) |
| `frame.garisMeja` (duduk-turun) | keterangan saja: baris permukaan meja pertama di frame BILA kaki di y 900 (= `kaki.y − 61`); tidak ada `diAtasMeja` (tidak ada piksel di bawahnya). Gambar tokoh DI BALIK meja (seperti berdiri) |
| `frame.turun` (duduk-turun) | `{ dariBerdiri: 15, keDuduk: 16, catatan }`: px seni badan lebih rendah dari berdiri / di atas duduk |
| `pose['duduk-turun']` | `{ kanan, kiri, bawaan: 'kanan', catatan }` (bawaan kanan = kedatangan, menghadap kursi pengunjung) |
| `animasi` | `duduk: ['berdiri-persilakan','duduk-turun','duduk-dengar']`, `berdiriDariDuduk: ['duduk-dengar','duduk-turun','berdiri']` (nama pose, arah sama; bentuk sama dengan `animasi` Bu Rina) |
| `frame.garisMeja` | y tepi jauh meja di frame = `pinggul.y − 34` = `tempat.garisMejaMentor` (v5: 102, pinggul 136) |
| `frame.garisMata` / `frame.mataDiAtasMeja` | (v5, frame duduk) garis mata = tengah baris putih mata wajah netral (frame, 36,5); tingginya di atas `garisMeja` (65,5 px seni). Untuk menyamakan garis mata dengan Bu Rina |
| `frame.tanganMeja` | (v5, frame duduk) titik tangan yang bertumpu di permukaan meja (frame; keterangan untuk prop/panggung) |
| `frame.diAtasMeja` | DAFTAR kotak [x,y,w,h] (px seni) yang digambar LAGI sesudah meja & prop: gambar & transform sama. Kotak 1 = selebar frame mulai `garisMeja`; kotak berikutnya = 1 baris di `garisMeja − 1` hanya di kolom lengan yang melintas tepi jauh meja (garis tepi tidak melintang di lengan; torso tetap di balik meja). `[]` = tidak ada (telepon). Untuk `GambarTokoh.diAtasMejaPiksel` kalikan 4 |
| `frame.mataBawah` | (duduk-tunjuk-kiri) `{ sprite: 'lirikKanan' }`: lapisan `bawah` frame ini melirik kanan-bawah ke kartu |
| `pose['duduk-tunjuk'].bawaan` / `.kartu` | `'kanan'` / `{ arah:'kanan', varian:'bawah' }`: momen kartu = telunjuk DAN pandangan ke kartu. `kiri` hanya untuk bicara ke pemain sambil menunjuk |
| `telepon.jendela` | 56 px, y 0: kepala UTUH (sanggul, 1 px di atas puncak) + gagang + tangan + mulut, x dipusatkan pada kepala+gagang (sama dengan sisipan Bu Rina) |
| `frame.ujungTelunjuk` | ujung telunjuk (duduk-tunjuk) |
| `frame.tangan` | `telapak` (jelaskan/persilakan), `telunjuk`, `telepon` (corong dengar) |
| `frame.kepalaTinggi` | 54 (puncak sanggul → dagu; untuk kotak kepala kamera: × 4 = 216 satuan) |
| `frame.kanvas` | pojok kiri-atas frame di kanvas kanonik bersama (kepala per arah berada di posisi kanvas yang sama → kepala terkunci antar frame duduk) |
| `frame.wajahTertutup` | frame telepon: jumlah piksel `wajah.kotak` yang tertutup tangan/gagang; lapisan wajah frame itu transparan di sana (tangan tidak tertimpa wajah) |

Urutan gambar: tubuh → `dasar` di `wajah.kotak` → `kedip` ATAU `bawah` di `wajah.mata` → `bicara` di `wajah.mulut`;
frame duduk: lapisan ruang `belakangMeja` + prop → potongan `diAtasMeja` dari gambar yang sama → `depanMeja`.

## Posisi di ruang (lokasi `meja`, dunia)

v5 (jangkar sama): puncak kepala duduk y dunia ± 252 (v4 296), garis mata y 394 (v4 436), tangan `duduk-dengar`
bertumpu di (672, 672) arah kanan, ujung telunjuk `duduk-tunjuk` kiri & kanan (816, 692; v5 tangan, lengan "L") di dalam kartu
`kartuMeja` (800, 704; kotak 740-860 × 672-736, telunjuk di kanan-tengah, tangan di tepi atas kartu) & `LANDASAN_KARTU`
(x 732-868, y 664-744). (Angka tempat duduk di kalimat ini dari sebelum komposisi meja v5; tempat terkini: RUANG.md.)
`duduk-turun` kepala (px seni) 70 → 80 → 90. Tabel berikut = angka v4 (riwayat).

Pinggul duduk `tempat.mentor` (656, 792), kaki berdiri `tempat.mentorBerdiri` (600, 900). Diukur dari atlas + manifest:

| | Nilai |
| --- | --- |
| Kepala duduk (x) | kiri 564-736, kanan 580-752 → papan nama mulai x 760: **tidak menutup** (sisa 8 satuan di arah kanan) |
| Puncak kepala duduk | y 296 (90 px seni di atas garis meja; asumsi ruang sebelumnya 100) |
| Tangan duduk-dengar | x 540-776, sampai y 720 (16 px seni di bawah garis meja) |
| Ujung telunjuk duduk-tunjuk | (762, 716) — 22 satuan di dalam tepi kiri kartu `kartuMeja` (kartu 740-860 × 680-744), kartu tetap terlihat; jari digambar DI ATAS kartu, tidak menembus |
| Berdiri | x 492-728 (kiri), puncak kepala y 172, tinggi 728 satuan |
| `duduk-turun` (kaki di y 900, x dipilih seperti `bingkaiTurun` Bu Rina: kepala di tengah) | kanan: kaki x 636, kepala (px seni) berdiri (149,5; 70) → antara (158,5; 85) → duduk (166,5; 101); kiri: kaki x 624, kepala (150,5; 70) → (156,5; 85) → (162,5; 101). Baris tubuh terbawah jatuh di y seni 163 (garis gelap tepi meja) |

Pemetaan panggung yang dibutuhkan (milik agen panggung, TIDAK diubah di sini): penyusun (`susun.ts`) sudah membaca
pose `duduk-turun` dari manifest (arah bawaan `pose.bawaan` = kanan, jenis jangkar `kaki`); `rencanaMasuk` menukar
`berdiri-persilakan-kanan` → `duduk-turun-kanan` (tahan singkat) → `duduk-dengar-kanan` dengan jangkar kaki di
`tempat.mentorBerdiri.y` dan z di balik meja (Z.belakang, sama dengan Miss berdiri).

## Pemeriksaan (laporan-tinjau.json)

39 warna, semua di palet manifest; 0 piksel alpha bukan-biner; semua lapisan berukuran sama dengan kotaknya;
**0 piksel berubah di luar `wajah.kotak`** untuk 5 ekspresi × 16 frame; beda vs netral di SEMUA frame: senyum 54,
prihatin 34, serius 68, lega 55 piksel; lebar mulut netral 6 / senyum 10 / serius 4 px; **0 piksel berubah di luar `wajah.mata`/
`wajah.mulut`** untuk kedip, bawah, bicara, kedip+bicara, bawah+bicara; ekspresi netral dasar = tubuh apa adanya.
Garis tepi jauh meja di atas tubuh yang bersambung melintasi tepi (`garisMejaDiTubuh`, di ruang pada titik nyata):
ronde 1 = 37/37 (dengar), 32/32 (jelaskan), 16/16 (tunjuk); ronde 2 = 4/37, 3/32, 1/16 (kanan) & 0/16 (kiri) — sisa =
kolom torso di samping lengan yang sengaja tetap di balik tepi (di bawahnya garis luar gelap lengan), dicek di 3× & 8×.
Sisipan telepon (56 px, y 0): sanggul 1 px dari tepi atas, kepala+tangan+gagang sisa 6/7 px kiri/kanan, mulut di dalam.
Dua kali bangun: atlas & manifest identik byte (ronde 3: atlas sha256 89d2aab2…, manifest 960edf95…).
Ronde 3: `periksaMataBawah` (bawah/bawahSenyum/lirikKanan: iris 8-10 px pada 2 baris, putih 2-4 px per mata) dicatat
di log-suntingan; `garisMejaDiTubuh` tidak berubah (4/37, 3/32, 1/16, 0/16).

## Lembar tinjau (miss-tinjau.mjs)

`01` semua frame × ekspresi 4×; `02` momen cerita di ruang (4× dan 2×) bersama atlas Bu Rina; `03`/`03b` tangan 4× dan
ukuran nyata 1-3×; `04` varian + beda magenta; `05` kiri vs kanan; `06` potret 32/44/52/64/96 + dekat, ukuran tampil
nyata, di samping potret SVG v3 (dirender dari `potretMissRaksa` dengan tsx + Chrome, bila folder PNG-nya diberikan);
`07` SEMUA frame × ekspresi di ruang pada titik tempat nyata (4× per frame, 2× satu lembar); `08` (ronde 3)
`berdiri-persilakan` → `duduk-turun` → `duduk-dengar` per arah di ruang, 2× & 3× + tumpang 25/50/25 %, dan
`laporan-tinjau.json.dudukTurun` (titik kaki & kepala tiga langkah). Miss (berdiri, antara, duduk) digambar di balik
meja seperti panggung; `duduk-turun` diletakkan dengan `titikTurun` (aturan `bingkaiTurun`).

## Batasan yang diketahui

- v5: mata dibaca ulang TANGAN dari lembar master (bukan cangkok piksel mata sel master apa adanya): sel moda membuat
  bulu mata 2 baris (sayu), sel rata-rata membuat iris pudar; hasil = interpretasi 1 px dari desain master. Wajah
  `kanan` = cermin + isi mata dibalik (tatapan ke Bu Rina); bayangan pipi ikut tercermin.
- v5: selisih garis mata Miss–Bu Rina 5 px seni (gestur `duduk`) sampai ± 8,5 (gestur dada/cemas, diukur di dev);
  Bu Rina tetap sedikit lebih tinggi.
- v5 tangan (28 Sep): lengan tunjuk & tangan telepon digambar ulang lagi (`TUNJUK`, `TELEPON_TANGAN`). Tunjuk:
  siluet "L" terbaca di 1440 & 390 (lengan atas, siku, lengan bawah, manset, telunjuk); lengan atas & lengan bawah
  tetap tebal (gaya chibi, sama dengan lengan dengar), sudut siku lembut 2-3 px di 4×; telunjuk 2 px (bukan jari
  terpisah), ujungnya di kartu kanan-tengah, tangan menutup tepi atas kartu sedikit. Arah `kanan` (lengan jauh) memakai
  pola yang sama digeser 4 px (tidak dibedakan perspektifnya). Telepon: jari = 3 pita terang melintang gagang dengan
  lipatan gelap, bukan jari terpisah; ibu jari 2 px. Arah kanan = cermin (cahaya ikut tercermin).
- v5: `duduk-turun` tetap badan *dengar* yang sama (tidak digambar ulang).
- v5b tunjuk: ujung telunjuk sengaja dipertahankan (kartuMeja tidak dipindah), jadi lengan harus menjangkau titik yang
  hanya ± 18 px seni di kanan bahu dan ± 50 px di bawahnya: sudut siku dalam proyeksi terbatas (± 60°) dan lengan atas
  tetap panjang (siku di tepi meja). Telunjuk 2 px mengarah turun (pergelangan menekuk ke kartu), bukan jari terpisah.
  Ruang di celah ketiak memperlihatkan latar (dinding/bambu) sebagai ruang negatif yang disengaja; tidak diuji pada
  pemain sungguhan.
- v5b celah: sisa 3 px lubang tertutup = takik 1 px di garis bahu/kerah (dari lembar gestur, ada di semua pose sejak v4).

- Wajah pada 44-64 px ×1 (ronde 2): kelima ekspresi berbeda bentuk (serius: garis mulut gelap + alis turun; senyum:
  mulut lebar naik). Pada 32 px ×1 fitur tetap 1 px; jendela `dekat` (×2/×3) tetap disarankan untuk avatar. Rona pipi
  senyum (2 px `#f29a69` per pipi) sangat halus di ×1-×2. Keterbacaan untuk pemain belum diuji (hanya penilaian visual).
- Badan `kanan` = cermin: bayangan jas ikut tercermin (cahaya dari kanan); kancing/lencana/belahan sudah dikembalikan.
- `duduk-tunjuk` kiri: badan & kepala ke pemain, lengan dekat menunjuk kartu di kanan. Varian `bawah` = lirik 1 px ke
  kanan-bawah (halus; terbaca di 4×, samar di 1-2×). Untuk momen kartu pakai `kanan` + `bawah` (`pose.duduk-tunjuk.kartu`).
- Lengan telepon & tunjuk digambar tangan (tidak ada di sumber). Sisi badan di bawah lengan telepon lebih ramping
  daripada frame lain (garis sisi badan sumber yang semula tertutup lengan).
- `berdiri-persilakan`: telapak setinggi dada (bentuk sel *jelaskan*), bukan gerakan rendah ke arah dudukan kursi.
- Mata `kiri` menatap depan/kamera (iris di tengah), bukan tepat ke kiri kamera.
- Tokoh berdiri berada di titik `mentorBerdiri` (kaki y 900); panggung menggambarnya DI BALIK meja (Z.belakang, rok
  tertutup meja dari y 656), dan `miss-tinjau` kini juga (ronde 3; sebelumnya di depan meja).
- Tangan duduk-dengar turun sampai 16 px seni di bawah garis meja; bila kartu ditampilkan di `kartuSimpan` pada saat
  yang sama, tepi atas kartu bersinggungan ± 1 px seni dengan ujung jari.
- `duduk-turun` (ronde 3) memakai badan *dengar* yang sama dengan `berdiri`/`duduk-dengar` (tangan bertaut): terbaca
  sebagai badan turun setengah jalan dengan tangan menuju meja, bukan pose baru yang digambar tangan. Lutut/paha tidak
  digambar (selalu tertutup meja pada posisi itu); bila panggung meletakkannya di depan meja atau di y lain, potongan
  lurus di garis meja akan terlihat. Belum ada di panggung (butuh rencanaMasuk agen panggung).
- Tidak ada jalan, tidak ada frame menghadap kamera penuh.
- Titik merah jambu 1 px di pita terang tepi meja tepat di atas tangan bertaut (`#dcaaa2`, terlihat juga di render
  jelaskan/tunjuk) adalah seni RUANG, bukan Miss: `ruang-meja-belakang-meja.png` & `ruang-telepon-belakang-meja.png`
  piksel (146, 42) (dunia seni (162, 164)), transisi pita `#fbe6b4` → `#e5d5b9` yang terpetakan ke warna kursi; juga
  (77-80, 42). Pemilik ruang: ganti ke `#fbe6b4`/`#e5d5b9`.
- Belum diuji di HP fisik, belum dilihat pemilik/PIC, belum diuji dengan pemain; keterbacaan emosi = penilaian visual.
