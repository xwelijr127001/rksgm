# Ruang adegan v4 PIKSEL: Raksa Silver Club, koridor pembuka, parkiran

> **Revisi v5 (28 Sep, agen ruang-kamera, review pemilik "raksa-v4-review-20260928")**: lihat bagian "Revisi v5" di
> bawah. Kamera kedatangan/kepergian HP tidak lagi menjauh ke seluruh ruangan (k 1), pintu & koridor terang (tanpa
> bidang gelap), dinding lebih tenang, meja jati terpisah dari jas emas. Angka di tabel koordinat sudah angka v5.
>
> **Komposisi meja v5 (28 Sep, agen komposisi-meja)**: tepi jauh meja 656 -> 640 sehingga Miss Raksa duduk 4 piksel seni
> lebih tinggi, Bu Rina & kursinya 2 piksel lebih rendah: garis mata keduanya di cakrawala (percakapan setara), telapak
> duduk Bu Rina = telapak berdiri; satu kamera untuk semua baris duduk. Lihat bagian "Komposisi meja v5".

Lapisan latar panggung cerita (kontrak `docs/cerita/ADEGAN-AUTO1.md` bagian 2, 3, 5, 7; API
`client/src/cerita/seni/ruang/tipe.ts`) dalam dua bentuk dengan geometri yang SAMA:

- **PIKSEL (utama, 27 Sep, agen ruang-piksel)**: PNG RGBA native `client/src/cerita/seni/piksel/ruang-*.png` + manifest
  `ruang.json`, dibangun deterministik oleh `tools/piksel/bangun-ruang.mjs` dari generator SVG gaya piksel. Panggung
  memuatnya lewat `import.meta.glob` (`ui/panggung/sumberPiksel.ts`) dan membacanya dengan `bacaManifestRuang`
  (`ui/panggung/piksel.ts`, milik agen panggung).
- **SVG (cadangan & sumber)**: generator tulisan tangan di `seni/ruang/*` (path, gradien, klip) yang juga menjadi sumber
  render lapisan piksel. Tanpa foto, tanpa bitmap jiplakan.

**Adaptasi ilustratif dari foto referensi, bukan denah resmi ruang layanan mana pun.** Nama klub lain, daftar layanan,
dan slogan papan foto tidak digambar. Nama plakat berasal dari `LOKASI_AUTO_1.nama` (`episode/auto-1/teks.ts`).

## Kontrak piksel (keputusan lead)

- 1 piksel seni = **4 satuan dunia**; dunia 1600 × 900 = **400 × 225 piksel**. Tampil tajam hanya bila kamera memberi
  jumlah piksel perangkat BULAT per piksel seni (`4 · s · dpr` bulat; panggung: `data-piksel`), nearest-neighbour.
- Setiap kotak lapisan, titik tempat, jangkar prop, titik jalur, dan bingkai saran = **kelipatan 4** (diuji).
- Tokoh piksel **selalu skala 1** (tanpa skala pecahan saat diam, tanpa LOD). Kepala (sanggul/hijab → dagu) ± 53 piksel.

## Keputusan: pintu masuk dipindah ke sekat kanan (jalan masuk skala 1)

Di v3 Bu Rina berjalan dari pintu di dinding belakang (skala 0,37) ke kursi (1,05): skala berubah terus. Seni piksel
tidak boleh diskalakan pecahan, dan LOD (sprite ½, ¾, 1) berarti set jalan tambahan per ukuran + lompatan ukuran yang
terlihat. **Dipilih: pintu pindah ke SEKAT dekat (kanan, sedalam kursi pengunjung), Bu Rina masuk & pergi pada
skala 1** — satu set sprite jalan, hanya geser mendatar. Pada skala tokoh, pintu 90 × 210 cm lebih tinggi dari dunia:
yang tampak = kusen engsel + ± 56 piksel daun (v5; daun sebenarnya `LEBAR_DAUN_SEKAT` 480 satuan, gagang di luar dunia).
Panggung tetap memutar daun dari `pintu.engsel` (skala-X + skew); koridor terang terlihat di balik bukaan.

## Berkas

| Berkas | Isi |
| --- | --- |
| `seni/ruang/geometri.ts` | SATU sumber angka (dunia): kontrak piksel (`PIKSEL`, `keGrid`), `UKURAN_TOKOH_PIKSEL` (asumsi ukuran tokoh), dinding, sekat & pintu, plakat, meja, kursi, tempat, jalur, prop, landasan, `BINGKAI_PIKSEL`, `kepalaDudukPiksel()` |
| `seni/ruang/alat.ts` | helper SVG + **gaya piksel** (`denganGaya('piksel', fn)`, `modePiksel()`): garis tekstur samar dibuang, garis/tepi ≥ 4 satuan |
| `seni/ruang/dinding.ts` | latar `meja`/`telepon`: dinding oker + genangan cahaya, bambu, plakat walnut + rak lilin, bilah zaitun, lantai, sandaran kursi petugas, **sekat pintu** (kusen engsel); cabang gaya piksel untuk tiap bagian |
| `seni/ruang/pintu.ts` | `daunSekat` / `koridorSekat` (ruang layanan, potong ke bukaan) + `daunPintu` / `sekilasRuang` (pintu-luar) |
| `seni/ruang/meja.ts` | `belakangMeja` (puncak kayu + kaca, monitor, formulir; `telepon`: + cangkir) & `depanMeja` |
| `seni/ruang/kursi.ts` | kursi tub mauve (skala 1,2), `KOTAK_KURSI` dihitung dari bentuk |
| `seni/ruang/prop.ts` | prop (× `SKALA_PROP` 1,2, jangkar & ukuran kelipatan 4): kartu polis, **kartu di tangan**, kunci, telepon ± gagang, gagang, map, **cangkir** |
| `seni/ruang/luar.ts`, `parkiran.ts` | `pintu-luar` (bukaan pintu kini kelipatan 4) & `parkiran` (tokoh skala 1, mobil di belakang keduanya) |
| `seni/ruang/sumberPiksel.ts` | sumber lapisan gaya piksel per lokasi + prop untuk alat bangun (tidak dipakai panggung) |
| `tools/piksel/bangun-ruang.mjs` | alat bangun deterministik (render Chrome → kuantisasi → rapikan → teks plakat → PNG + manifest; `--tinjau`) |
| `seni/piksel/ruang-*.png`, `ruang.json` | KELUARAN (jangan disunting tangan; bangun ulang) |
| `seni/ruang/ruang.test.ts` | 17 uji (geometri piksel, SVG, keluaran piksel segar/valid) |

Bangun ulang (± 10 dtk; wajib sesudah mengubah geometri/generator, uji "manifest piksel SEGAR" gagal bila lupa):

```
npx tsx --tsconfig client/tsconfig.json tools/piksel/bangun-ruang.mjs [--tinjau <folder>] [--kering]
```

## Asumsi ukuran tokoh (`UKURAN_TOKOH_PIKSEL`, piksel seni)

| | Nilai | Sumber |
| --- | --- | --- |
| Kepala (puncak → dagu) | 53 | brief lead; atlas Bu Rina |
| Miss Raksa duduk di balik meja | puncak kepala **100** di atas garis meja, lebar kepala ± 46 | brief lead (atlas belum ada 27 Sep) |
| Garis mata duduk | Miss Raksa 65,5 di atas garis meja; Bu Rina 91,5 di atas pinggul (gestur lain 89,5–95,5) | atlas v5 (`mataDiAtasMeja`, `wajah.mata`); `mentorMataAtasMeja`, `nasabahMataPinggul` |
| Miss Raksa berdiri | 187 | master v4 pada pitch 7,34 |
| Bu Rina duduk (`duduk`, 86 × 159, jangkar pinggul 54,118) | puncak → pinggul **118**, pinggul → telapak 41, pusat kepala 11 di kiri pinggul | `seni/piksel/bu-rina.json` 27 Sep |
| Bu Rina berdiri (`berdiri`, 79 × 191) | 191 | idem |

Siluet Bu Rina TERUKUR di tempatnya (atlas 27 Sep, skrip lembar kerja `ukur-rina.mjs`): hijab paling kiri x ≥ 1044
(`duduk-condong` ≥ 1004) di pita kepala y 264–424; pangkuan/lutut x ≥ 952 (semua frame duduk, termasuk condong) di pita
y 648–840; berdiri x ≥ 1224 di pita kepala-bahu. Atlas berubah → ukur ulang & sesuaikan angka di uji.

## Koordinat (dunia; piksel seni = /4)

### Ruang layanan `meja` / `telepon`

| Unsur | Nilai | Catatan |
| --- | --- | --- |
| Cakrawala / lantai | y 376; lantai(s) = 376 + 624·s; dinding belakang y **600** | setinggi mata tokoh duduk: v5 garis mata Miss Raksa duduk 376–378, Bu Rina duduk 362–386 (per gestur) |
| Panel bambu | x 60–344, y 0–588 | |
| **Plakat nama** (`PAPAN`) | x **760–984**, y **216–316**; bingkai atas y 208; rak lilin y 364–376 | DI ANTARA kedua kepala duduk (bukan di atasnya) |
| Kotak teks (`TEKS_PAPAN`) | x 772–972, y 228–304 | piksel: "Raksa" tebal (x 812–932, y 232–260) + "Silver Club" (x 780–960, y 272–300) |
| Lilin LED | x 808 & 936, badan y 336–360, nyala ± 320 | |
| Bilah zaitun | x 548–1252, y 380–588 | di belakang badan kedua tokoh |
| **Sekat pintu** (`SEKAT`) | muka x ≥ 1360, sisi tebal x 1344–1360 (v5; dulu 1368) | sedalam kursi pengunjung; kusen langsung di muka sekat |
| **Bukaan pintu** (`PINTU`) | x **1376–1600** (224 lebar; v5, dulu 1412–1600), y 0–900; kusen engsel x 1360–1376; **engsel (1376, 450)** | daun & koridor = kotak ini; latar di balik bukaan diisi terang (dinding + lantai koridor), bukan gelap |
| Puncak meja | JB **(316,640)** · JK **(1116,640)** · DK (1276,772) · DB (76,772); bibir 12 | tepi jauh DATAR y **640** (v5 komposisi meja; dulu 656), sisi menyempit ke titik hilang (800, 376) |
| Monitor | x 256–424, y 496–648 (+ alas ± y 690) | di luar bingkai HP |
| Formulir | (176, 736) | |
| **Miss Raksa duduk** | pinggul **(656, 776)** (v5; dulu 792); `garisMejaMentor` **640**; kepala piksel ± y 236–452, garis mata y 376–378 | bingkai piksel: garis meja bingkai (102) di y 640 (= jangkar 34 piksel di bawah garis meja); sandaran kursi petugas ikut tepi jauh |
| **Miss Raksa berdiri** | telapak **(656, 884)** (v5: tepat di depan kursinya, dulu 600; y naik 16 bersama tempat duduk); kepala piksel ± x 568–740, y 156–372 | tertutup meja dari y 640; bangkit/duduk tanpa geser mendatar, langkah kepala berdiri → duduk-turun → duduk tetap |
| **Bu Rina duduk** | pinggul **(1148, 744)** (v5; dulu 736); kepala ± y 272–484 (pusat x 1104); garis mata gestur duduk/dada y 378; titik telapak y 904 = telapak berdiri | |
| **Bu Rina berdiri** | telapak **(1276, 904)** (v5, dulu 1320); kepala ± y 148–360 (siluet terukur) | depan sisi kanan kursi, 1 piksel di bawah dunia |
| **Jalur masuk** (skala 1 semua) | **(1536, 904) → (1428, 904) → (1276, 904)**; `JALUR_DEPAN_MULAI` = 1 | pergi = jalur dibalik (hadap kanan) |
| Kursi pengunjung | pusat dudukan **(1156, 752)** (v5, ikut Bu Rina), s 1,2; kotak lapisan x 928–1408, y 448–900 | |
| Telepon (prop, kotak 136 × 88, jangkar 68,64) | **(508, 724)** → kotak x 440–576, y 660–748 | 16 dari tepi kiri bingkai HP |
| Kartu awal `kartuSimpan` (kotak 120 × 64, jangkar 60,32) | **(640, 748)**; kertas ± x 586–695, y 723–768 | tepi dekat meja sisi pemain, ≥ 10 kanan telepon |
| Kartu di meja `kartuMeja` | **(768, 704)** (v5 meja ronde 2; dulu 800 / y 712) → kotak x 708–828, y 672–736 | ujung telunjuk duduk-tunjuk (726, 696; lengan tunjuk dengan siku ditekuk keluar, tangan di depan bahu) di sepertiga kiri kartu; x 768 = batas `kartuSimpan` + 120 (lintasan terlihat) dengan kertas awal tetap di luar landasan |
| `LANDASAN_KARTU` | x **700–836**, y **664–744** | kosong dari benda lain (diuji); juga kotak wajib kamera percakapan (bagian Komposisi meja v5) |
| Kunci `kunciMeja` (kotak 72 × 40, jangkar 36,24) | **(904, 700)** → kotak x 868–940, y 676–716 | 12 di kiri pangkuan Bu Rina |
| Cangkir (`telepon`) | (1000, 700) | |

Map kulit v3 TIDAK lagi digambar di meja (meja tidak muat telepon + kartu awal + map + landasan + kunci pada ukuran prop
chibi); `propMap()` tetap ada (prop PNG `map`, ekspor aset).

### Bingkai kamera yang disarankan (`BINGKAI_PIKSEL`; kamera milik panggung)

| | Kotak (dunia) | Isi |
| --- | --- | --- |
| `hp` | x 424–1224, y 200–792 (200 × 148 piksel) | kedua wajah, teks plakat, telepon, landasan, kunci, tangan di pangkuan |
| `lebar` | x 40–1560, y 140–800 | desktop/tablet, sekat & pintu tampak |
| `datang` | x 440–1600, y 120–780 | SARAN LAMA (v4). Sejak v5 panggung memakai `pasKameraPintu` (bagian Revisi v5) |

Terukur di panggung asli (Vite 27 Sep, gerak dikurangi, seni tokoh SVG lama): desktop 1440 × 900 → 3 px per piksel seni
(pandangan 426 × 176 piksel), HP 390/360 (dpr 3) → 5 px perangkat per piksel seni; plakat terbaca di keduanya.

### `parkiran`

Cakrawala y 360, lantai(s) = 360 + 640·s. Miss Raksa **(560, 1000)**, Bu Rina **(1040, 1000)**, skala 1. Mobil
(`mobil.ts`, s 0,36, faktor 1,872) di belakang keduanya, x −22 … 839: pusat kerusakan (`PENYOK_PARKIRAN`,
x ± 732–867, y ± 394–574) tepat di tengah kedua tokoh (x 800).

### `pintu-luar`

Tanpa tokoh (titik cadangan skala 1 di (760, 1000) & (1220, 1000)). Papan walnut x 385–945, teks x 410–920, y 262–340
(piksel: satu baris tebal x 480–848); **pintu x 1008–1280, y 148–780** (dulu 1010 × 270: dibulatkan ke grid);
engsel (1008, 464).

## Lapisan piksel & manifest (`seni/piksel/ruang.json`)

```
{ versi, piksel: 4, dunia: {w,h,pw,ph}, palet: [48 hex], warnaTepi, teksPapan,
  lokasi: { <lokasi>: { lapisan: [{ id, berkas, x, y, w, h, pw, ph, z, alpha, engsel? }], bukaan?,
                        papan?: { teks, kotak, baris: [{teks, tebal, x, y, w, h}] }, tempat } },
  prop: { <id>: { berkas, w, h, pw, ph, jangkar } } }
```

| Lokasi | Lapisan (z) | Ukuran piksel |
| --- | --- | --- |
| `meja` / `telepon` | latar 10 (400 × 225, buram), koridor 20 & daun 30 (56 × 225, buram; v4 47 × 225), belakangMeja 50 (306 × 74), depanMeja 60 (306 × 33), kursiBelakang 70 (120 × 115) | `telepon` berbagi semua berkas `meja` kecuali belakangMeja (+ cangkir) |
| `pintu-luar` | latar, koridor (sekilas ruang), daun (68 × 158) | |
| `parkiran` | latar | |
| prop | kartu 30 × 16, kartuTangan 22 × 16, kunci 18 × 10, telepon & teleponTanpaGagang 34 × 22, gagang 12 × 39, map 47 × 17, cangkir 18 × 11 | |

19 berkas, ± 60 KB total. Alpha lapisan tumpang & prop tepat 0/255; latar/koridor/daun buram penuh; setiap warna dari palet
bersama (48; 21 warna kunci identitas: garis hangat, emas teks & bayangnya, nada oker dinding, walnut, mauve kursi,
jingga nyala, abu kartu, perak kunci). `tempat` manifest = geometri kini (diuji segar); pembaca panggung
menggabungkannya di atas tempat SVG.

**Teks plakat** dibakar di latar dengan font bitmap buatan tangan (huruf besar/asender 7 piksel, x-height 5, desender 2,
proporsional, baris tebal = +1 kolom), emas `#e9c46a` + bayang 1 piksel `#26120a`. Nama tidak muat satu baris →
kata pertama tebal di baris 1, sisanya baris 2 (ruang layanan: "Raksa" / "Silver Club"); pintu-luar: satu baris tebal.
Huruf yang tidak ada di font = galat bangun (bukan huruf palsu). Panggung piksel TIDAK menulis teks lagi di papan.

**Alur bangun**: (1) generator SVG gaya piksel (`sumberPiksel.ts`) → (2) Chrome headless (SwiftShader) halaman baru per
lapisan, supersampel 8 × 8 per piksel → (3) palet bersama: moda ember 5 bit tiap sel semua lapisan, median cut + k-means
OKLab (`lib.mjs`), warna kunci tetap → (4) tiap sel: sampel dipetakan ke palet, warna = MODA suara; alpha = mayoritas
→ (5) rapikan: piksel yatim yang mirip tetangga dilebur, bintik/lubang alpha dibuang, garis luar 1 piksel (warna sendiri
digelapkan) di tepi siluet lapisan tumpang & prop → (6) teks plakat → (7) dedupe berkas identik, tulis. Dua jalan berturut
menghasilkan berkas identik byte-per-byte (diperiksa 27 Sep).

**Gaya piksel** (cabang `modePiksel()` di generator): dinding oker datar + genangan cahaya sorot elips 3 nada (gradien
lama pecah menjadi noda), plakat walnut datar + bevel 1 piksel, lilin 4 piksel + nyala jingga 2 piksel, batang bambu &
bilah selebar kelipatan 4 dengan satu kolom sorot, papan lantai lebih jarang, kaca meja tanpa rona (kayu madu tetap),
aspal parkiran 2 pita, vinyet pintu-luar dibuang, garis tekstur samar (< 0,3) dibuang.

## Integrasi panggung (agen panggung-piksel)

- `bacaManifestRuang(json, cariUrl, cadangan)` membaca bentuk A manifest ini (lapisan per berkas, `papan.kotak` = papan
  dengan tulisan dipanggang, `prop` → `kartu`, `kartuTangan`, `kunci`, `telepon`, `teleponTanpaGagang`, `gagang`).
- Tokoh piksel Miss Raksa duduk: taruh garis meja bingkai di `tempat.garisMejaMentor` (656) — setara jangkar 34 piksel
  di bawah garis meja di `tempat.mentor`.
- Bu Rina: jangkar pinggul di `nasabahDuduk`, telapak di `nasabahBerdiri`/jalur (y 904).
- Kelas SVG `.rg-nyala` / `.rg-cahaya-pintu` hanya ada di lapisan SVG; PNG tidak punya pendar lilin/cahaya pintu terpisah.

## Revisi v5 (28 Sep): kamera kedatangan, pintu, warna

Review pemilik (P1 "kamera HP terlalu jauh saat kedatangan", P2 "pemisahan karakter dan latar masih lemah"):

**Sebab bidang gelap & tokoh kecil (v4).** Bingkai kedatangan mewajibkan SELURUH bukaan pintu (x 1412–1600, **y 0–900**)
utuh di atas pita tombol "Lewati pembuka": 900 satuan tinggi tidak muat di panggung HP 275 px, jadi k turun ke **1**
(pandangan ± 2 930 × 2 200 satuan, dunia 1 600 × 900 dipusatkan): tokoh ± 1/3 ukuran percakapan, dan ruang di luar dunia
diisi perpanjangan kolom/baris tepi latar. Kolom tepi kanan latar ada di BALIK bukaan pintu (dulu diisi `#22150c`): itulah
"bidang gelap besar di kanan" (review 08/09) dan pita gelap 40 px di kanan desktop 1440 (review 05).

**Kamera (ui/panggung/kamera.ts, transisi.ts, dunia.ts).**
- `pasKameraPintu` + `transisi.kameraPintu`: bingkai kedatangan/kepergian mode piksel memakai **k yang sama dengan kamera
  percakapan** (tidak pernah lebih kecil; tidak ada k 1 di HP), hanya BERGESER. Wajib utuh = kepala RAPAT
  (`kotakKepalaRapat`, lebar 1,0 × tinggi kepala) + tangan gestur Miss Raksa mempersilakan + kepala Bu Rina berdiri di
  ujung jalur (kepergian: juga Miss Raksa duduk + tangan di meja); lalu digeser ke kanan seperlunya supaya sebanyak
  mungkin bukaan pintu tampak (pintu boleh terpotong), dengan ruang napas 8 piksel di kiri kepala Miss Raksa bila lebar
  cukup. Tegak: y percakapan bila muat. Wajib sedikit lebih lebar daripada pandangan (HP 360 px dpr 3) = kelebihan dibagi
  rata (maks 3 piksel seni), k tetap.
- Urutan HP 390×844@2: pembuka k 4 (Miss Raksa menyambut) → **satu** bingkai masuk k 3 (0,42 dtk; pintu terbuka, Bu Rina
  masuk dari kanan, Miss Raksa mempersilakan; ditahan sampai 2,0 dtk) → **satu** geser mendatar pendek ke percakapan k 3
  (2,0–3,0 dtk). Skala tidak pernah naik lagi (tanpa dekat-jauh-dekat). Desktop 1440: bingkai percakapan sudah memuat
  pintu, jadi kedatangan TANPA gerak kamera. Kepergian: percakapan → geser ke pintu (0,34 dtk) → kembali (2,25–2,9 dtk).
- Letterbox mendatar ruang layanan RATA KANAN (`OpsiPiksel.rataKanan`, `transisi.pintuDiTepiKanan`): tepi kanan dunia
  (pintu) = tepi kanan panggung, perpanjangan tepi hanya di kiri (dinding & lantai berlanjut wajar).
- Terukur (unit, ruang & atlas nyata): k masuk = k pergi = k percakapan di 1440 (dpr 1/1,25/1,5), 1920, 390 (dpr 2/3),
  412 (2,625), 360 (2/3), 844×390; bukaan pintu tampak 115 satuan (29 piksel seni) di 390@2, 104 di 844×390@2, 44 di
  360@2, 31 di 390@3; di 412@2,625 & 360@3 pintu tidak tampak (kepala berdiri kedua tokoh memakai seluruh lebar).
- **v5.1 (review HP 29 Sep: pintu hanya potongan tipis di 360/390)**: bila bingkai kedatangan tidak memuat seluruh bukaan,
  kamera lebih dulu tiba di **bingkai pintu** (`pasKameraBukaan`: k & y sama, rata kanan dunia, bukaan 224 utuh) pada
  0,38 dtk, SEBELUM daun berayun (jadwal pintu 0,38–0,86 dtk, dulu 0–0,55; Bu Rina muncul 0,6 dtk, jalan sampai 1,8 dtk);
  Miss Raksa terpotong di tepi kiri selama itu. Saat ia mempersilakan: satu geser ke kiri ke bingkai kedatangan
  (1,05–1,7 dtk), lalu ke percakapan (2,0–3,0 dtk); sesudah bingkai pintu kamera hanya bergerak ke kiri, k tetap. Bingkai
  pintu dipakai di 360@2/3, 390@2/3, 412@2,625, 844×390@2; tidak di desktop. Kepergian HP: satu geser ke bingkai
  kepergian lalu DIAM (kamera diam baris kepergian, `kameraDiam`); percakapan kembali di baris berikutnya. Tombol
  "Lewati pembuka" pindah ke baris kaki kotak dialog (tidak lagi di pita bawah panggung).

**Ruang (seni/ruang, dibangun ulang `bangun-ruang.mjs`).**
- Pintu: sekat 8 satuan ke kiri & kusen langsung di muka sekat (bukaan tampak 224, dulu 188); daun jati MADU lebih terang &
  hangat (`#c7925f` → `#9d683c`, dulu `#a36a43` → `#6f4127`), kusen `#a4724a`; latar di balik bukaan = dinding & lantai
  koridor terang (tidak pernah hitam bila diperpanjang). Koridor terang tampak saat daun terbuka (HP & desktop).
- Dinding: oker jenuh → pasir hangat (`#d5b788`, dulu `#e3b35c`), genangan sorot 2 nada berdekatan (dulu 3 nada kontras).
  Jas emas Miss Raksa & tulisan emas plakat kini satu-satunya emas jenuh.
- Meja: madu terang (`#e8bd80`…) → jati sedang (`#bc8353` → `#9a653b`; pita pantulan jati terang PADAT: putih
  transparan dulu terkuantisasi ke mauve kursi); panel depan `#a06e45` → `#6c4428`. Jelas terpisah dari jas emas (nilai
  & saturasi), tangan & manset putih terbaca, telepon/kartu/kunci tetap kontras.
- Bilah zaitun di balik leher/bahu kedua tokoh: celah zaitun tua (dulu hampir hitam), bilah 2 nada berdekatan, sorot kolom
  tipis, pendar lampu hanya di tengah (di bawah lilin, di antara kepala). Panel bambu: latar sela lebih terang, batang hijau
  diredam (tanpa hijau-kuning menyala), sorot/ruas lebih tipis.
- Warna kunci palet (`KUNCI_RUANG`) mengikuti warna datar baru. Tanpa properti baru; lokasi, bentuk & identitas
  hijau-kayu-emas tetap. Pintu-luar (pembuka) ikut dinding/bambu/bilah yang sama.

## Komposisi meja v5 (28 Sep): postur duduk & kamera percakapan

Review pemilik (P1 "pose duduk & proporsi kedua tokoh belum seimbang": Miss Raksa terbenam, Bu Rina duduk tinggi dengan
paha & kaki dominan). Atlas Miss Raksa v5 (agen wajah-postur) sudah menaikkan badan duduk 11 piksel terhadap garis meja
frame (garisMeja 91 -> 102; dada & lengan atas tampak, lengan bawah bertumpu di meja). Yang dikerjakan di ruang/panggung:

- **Model kamera dipakai sungguh-sungguh**: kamera setinggi mata orang duduk (cakrawala y 376), jadi garis mata kedua
  tokoh duduk harus di cakrawala, berapa pun kedalamannya. v4: mata Miss Raksa y 394 (4,5 piksel di bawah), Bu Rina
  354–370 (1,5–5,5 di atas) = selisih 6–10 piksel seni.
- **Tepi jauh meja 656 -> 640** (sudut jauh digeser di garis sisi menuju titik hilang: meja 4 piksel seni lebih dalam,
  tepi dekat/panel depan tetap). Tempat duduk Miss Raksa mengikuti (garis meja frame = tepi jauh): pinggul 792 -> 776,
  mata y 376–378; sandaran kursi petugas (latar) ikut tepi jauh; berdiri 900 -> 884 (langkah kepala berdiri ->
  duduk-turun -> duduk sama dengan atlas). Menggeser jangkar saja tanpa meja = potongan badan di atas tepi meja.
- **Bu Rina & kursi 8 satuan lebih rendah** (pinggul 736 -> 744, KURSI.y 744 -> 752): mata gestur duduk/dada y 378 =
  Miss Raksa; cemas 370, bingung 374, kesal 362, condong 386 (atlas Bu Rina: kepala tiap gestur beda 4–6 piksel) =
  semua <= 4 piksel seni dari Miss Raksa (diuji `ui/panggung/tokoh.test.ts`). Titik telapak duduknya kini y 904 = telapak berdiri
  (dulu 896/904): duduk <-> berdiri tanpa lompatan tegak. Kaki & kaki kursi tetap di bawah tepi dunia di SEMUA bingkai
  (lantai skala 1 = y 1000 menurut model kamera): tidak pernah tampak melayang; bingkai memotongnya di tengah betis
  (1440, 1920, 390, 360, 844), bukan di pergelangan.
- **Kartu**: `kartuMeja` 712 -> 704 & LANDASAN y 664–744 supaya ujung telunjuk duduk-tunjuk (778, 700) jatuh di baris
  tengah kartu. Telepon, kartu awal (sisi pemain), kunci tetap; jalur kartu tetap bercelah >= 1 piksel dari tangan.
- **Palet ruang**: palet bersama 48 warna dihitung dari SEMUA lapisan, jadi mengubah meja menggeser beberapa warna
  palet sedikit dan SEMUA PNG ruang/prop ikut terbangun ulang (tanpa perubahan bentuk selain meja/kursi/sandaran).
  Geometri lama menghasilkan PNG lama byte-identik (diperiksa), dan dua jalan berturut identik.

**Kamera percakapan (ui/panggung/transisi.ts `percakapanMeja`, kamera.ts `OpsiPiksel.bebas`, dunia.ts
`FAKTOR_TANGAN_PIKSEL`).** v4 menggeser kamera tegak per baris: kotak tangan telunjuk (kartu) & kunci di lutut Bu Rina
(condong) + pita label mendorong pandangan turun 8–60 satuan, dan di 360 px Bu Rina condong bahkan menurunkan k ke 2.
Sekarang, di ruang `meja` dengan Miss Raksa duduk: (1) zona landasan kartu = kotak wajib (di atas pita label), jadi
baris kartu = kamera baris lain; (2) Bu Rina (selalu di kanan) wajib utuh di panggung TANPA pita bawah, karena label
suasana ada di pita bawah KIRI; (3) jari-jari kotak tangan tokoh raster 0,2 x tinggi kepala (SVG tetap 0,28). Hasil
terukur (panggung dev): SATU kamera untuk dengar/jelaskan/tunjuk/condong/kursi kosong di 1440 (k 3, y 109), 1920 (k 4),
390@2 (k 3, y 116), 360@2 (k 3, y 168), 844×390@2 (k 3); kamera akhir kedatangan & kepergian = kamera ini.

## Verifikasi

- `npx tsx --tsconfig client/tsconfig.json --test client/src/cerita/seni/ruang/ruang.test.ts`: 17 uji (grid kelipatan 4
  & skala 1; wajah piksel duduk vs monitor/meja/sekat/plakat & bingkai HP; jalur skala 1 lewat bukaan; parkiran
  kerusakan di antara tokoh; plakat vs hijab condong/tokoh berdiri (siluet terukur); landasan, kunci vs pangkuan
  terukur; kartu awal dari tepi dekat; telepon di bingkai HP; kursi; klip koridor; prop; manifest SEGAR; PNG native,
  alpha 0/255, warna dari palet ≤ 48, total < 150 KB; teks plakat = `LOKASI_AUTO_1.nama` benar-benar tergambar).
- Lembar tinjau (folder kerja sesi, di luar repo) `scratchpad/v4/ruang-piksel/final/`: tiap lokasi & momen pada 4 dan
  2 px/piksel seni, potongan bingkai HP, bingkai saran bertanda; `final/lembar/` sebelum/sesudah vs panggung SVG review
  27 Sep + render SVG cadangan pada geometri baru. Tokoh: atlas Bu Rina asli; **Miss Raksa = PENGGANTI** (sel lembar
  referensi v4 dicerminkan & diperkecil ke kepala 53, hanya untuk tinjau, tidak masuk repo).
- Panggung asli (Vite, gerak dikurangi): ruang piksel & prop piksel tampil di 1440/390/360; `tools/uji-panggung.mjs`
  275/275 (Vite terpisah :5441).
- v5: `client/src/cerita/ui/panggung/kamera.test.ts` (5 uji baru: k pintu = k percakapan di 6 ukuran × 1–3 dpr, kepala
  rapat utuh, pintu tampak di HP dpr 2, desktop tanpa gerak, letterbox rata kanan, rencana masuk tanpa skala naik) dan
  `tools/uji-panggung.mjs kamera` (transform kamera tiap bingkai selama kedatangan di 390@2, 360@2, 844×390@2, 390@3,
  1440: k min = k akhir, tanpa skala naik, pintu tampak).

## Batas yang masih ada

- **Atlas Miss Raksa belum ada** saat ruang dipasang: tinggi 100 piksel di atas meja, lebar kepala 46, tangan di pita
  garis meja … +12 piksel, dan tinggi berdiri 187 = asumsi. Atlas tiba → periksa kepala vs plakat, tangan vs kartu awal &
  landasan (ujung telunjuk `duduk-tunjuk`), lalu sesuaikan `UKURAN_TOKOH_PIKSEL` & uji.
- Bu Rina berdiri (191) dan Miss Raksa berdiri (187) pada kepala sama: proporsi dari atlas masing-masing, tidak disamakan.
- Sekat pintu dekat mengubah blocking kedatangan (dari kanan bingkai, bukan dari dinding belakang). Tanpa pendar lilin
  & cahaya pintu animasi di PNG.
- v5: di HP sempit ber-dpr tinggi (412@2,625, 360@3) bingkai masuk pada k percakapan tidak memuat pintu (Bu Rina masuk dari
  tepi kanan bingkai). Kaki Bu Rina selalu terpotong tepi bawah bingkai (telapak y 904, di luar dunia): tidak pernah
  "mengambang" di atas perpanjangan tepi; ambang/lantai di kaki sekat tidak digambar (di luar semua bingkai yang dipakai).
- Mobil parkiran = seni datar `mobil.ts` yang dipikselkan (bukan digambar ulang); kerusakan kecil (± 34 × 45 piksel).
- Kaki kursi & lantai di depan meja di luar dunia; bentuk kursi tub dari SVG, bukan gambar tangan piksel.
- Teks plakat: font sendiri 7 piksel, terbaca di 2 & 4 px/piksel (diperiksa di lembar & panggung); belum diuji di HP fisik.
- Tidak ada klaim piksel-sempurna: sumber = render vektor yang dikuantisasi; beberapa garis diagonal (lantai, sisi meja)
  punya anak tangga tidak rata.
