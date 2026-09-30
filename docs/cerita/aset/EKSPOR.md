# Ekspor aset mode cerita (SVG master → PNG/WebP + manifest + lembar galeri)

> **ARSIP (28 September 2026):** pemilik menolak seni SVG v3 ini (wajah terlihat menyeramkan/kaku, tangan tidak natural).
> Seni aktif kini PIXEL ART: lihat [`MISS-RAKSA-PIKSEL.md`](MISS-RAKSA-PIKSEL.md), [`BU-RINA-PIKSEL.md`](BU-RINA-PIKSEL.md),
> [`PIKSEL.md`](PIKSEL.md). Generator SVG di bawah hanya cadangan terakhir; jangan dijadikan arah seni.

Generator SVG v3 di `client/src/cerita/seni/` adalah **master/sumber** semua gambar tokoh & ruang. Alat
`tools/ekspor-aset-cerita.ts` menulis master itu sebagai berkas `.svg` mandiri, merasternya ke PNG & WebP transparan
(puppeteer-core + Chrome), memeriksa tepi, lalu menulis `manifest.json` dan empat lembar galeri. Hasil ekspor **tidak
di-commit** (`aset-ekspor/` ada di `.gitignore`); buat ulang kapan pun dari generator.

## Perintah

```
npm run ekspor:aset-cerita                      # = npx tsx --tsconfig client/tsconfig.json tools/ekspor-aset-cerita.ts
npx tsx --tsconfig client/tsconfig.json tools/ekspor-aset-cerita.ts --keluar aset-ekspor/cerita --skala 1,2
```

| Argumen | Bawaan | Arti |
| --- | --- | --- |
| `--keluar <folder>` | `aset-ekspor/cerita` | folder keluaran (relatif ke cwd). Folder yang tidak kosong hanya dikosongkan bila berpenanda `.ekspor-aset-cerita` / manifest alat ini; selain itu alat berhenti |
| `--skala 1,2` | `1,2` | skala raster (1 = 1 px per satuan dunia; 0 < s <= 4) |
| `--waktu <ISO>` | waktu jalan | waktu pembuatan yang ditulis ke manifest & lembar (untuk ekspor yang dapat diulang persis) |
| `--ekspresi-mr cerita\|semua` | `cerita` | ekspresi Miss Raksa: yang dipakai cerita (dihitung dari episode) atau kedelapannya |
| `--paralel <n>` | `2` | jumlah **peramban** Chrome (bukan tab: tab latar di satu peramban bisa macet sampai batas waktu protokol) |
| `--webp-kualitas <1-100>` | `90` | kualitas WebP (alfa tetap tanpa rugi) |
| `--tanpa-lembar` | – | lewati lembar galeri |
| `--ketat` | – | kode keluar 2 bila ada masalah tepi/id |

Env: `RAKSA_CHROME` (chrome.exe; bawaan `C:/Program Files/Google/Chrome/Application/chrome.exe`),
`RAKSA_EKSPOR_JEJAK=1` (catat waktu tiap langkah). Kode keluar **1** bila ada master yang gagal dibuat, dirender, atau
dibaca ulang, generator ruang jatuh ke pengganti sementara, atau lembar galeri rusak/terpotong. Generator tokoh diimpor
langsung (`missRaksa.ts`, `buRina.ts`), bukan lewat pembungkus `aman` di `seni/tokoh/index.ts`, jadi galat gambar tidak
diam-diam menjadi siluet pengganti. Waktu di mesin ini: ± 105 dtk untuk x1 + x2 (± 45 dtk untuk x1 saja).

## Isi & susunan keluaran

```
aset-ekspor/cerita/
  manifest.json
  svg/<grup>/<nama>.svg          master mandiri: <svg xmlns viewBox="…" width height>isi generator</svg>
  png/x<s>/<grup>/<nama>.png     transparan (omitBackground)
  webp/x<s>/<grup>/<nama>.webp   transparan, kualitas --webp-kualitas
  lembar/galeri-miss-raksa.png  galeri-bu-rina.png  galeri-ruang.png  ukuran.png
```

`<nama>` = `pose_ekspresi[_varian]`; grup & cakupan (ekspor 27 Sep: 217 master, 1085 berkas, ± 96 MB):

| Grup | Isi |
| --- | --- |
| `miss-raksa` | 7 pose × ekspresi cerita (netral, cemas, serius, tersenyum = ekspresi baris `missRaksa` + wajah mendengar `ui/adegan.ts`), lapisan `_atas-meja` (`diAtasMeja`) untuk pose duduk & telepon, `duduk-dengar_*_bicara`, `duduk-dengar_netral_kedip` |
| `bu-rina` | 7 pose × 8 ekspresi (kunci di tangan untuk berdiri/jalan/pergi, seperti panggung), `jalan-a/b_*_kanan` (langkah kepergian hadap kanan), `berdiri_*_kecil` (aktivitas), `telepon_*_kecil` (sisipan HP), `duduk_*_bicara`, `duduk_netral_kedip` |
| `potret` | Miss Raksa `v3` (> 75 px), `v3-kecil` (53–75 px), `kecil` (<= 52 px) = aturan `aturanPotret`; Bu Rina `v3` / `kecil` (= `PotretNasabah`) dan `telepon-v3` / `telepon-kecil` (= `SisipanTelepon`, jendela digeser ke kepala pose telepon). SVG = gambar penuh dengan viewBox = jendela |
| `ruang` | per lokasi (`pintu-luar`, `meja`, `parkiran`, `telepon`): `latar`, `koridor`, `pintu-daun`, `belakang-meja`, `depan-meja`, `kursi-belakang` (+ `kursi-depan` bila ada). Teks papan nama TIDAK ada di lapisan (panggung menulisnya) |
| `prop` | `map`, `kartu-polis`, `kunci`, `telepon`, `telepon-tanpa-gagang`, `gagang` |

## Skema `manifest.json` (versi 1)

Akar: `versi`, `alat`, `dibuat` (ISO), `perintah`, `episode`, `skala`, `webpKualitas`, `ekspresiMissRaksa`, `satuan`,
`sumber[] {berkas, sha256}` (semua berkas generator `seni/tokoh/*.ts` & `seni/ruang/*.ts`), `ringkas {aset, perJenis,
berkas, bytes, gagal, masalah}`, `lembar[] {berkas, bytes, px}`, `aset[]`. Tiap `aset`:

| Kunci | Arti |
| --- | --- |
| `id` | `<grup>/<nama>` (stabil; = jalur berkas tanpa ekstensi) |
| `jenis`, `tokoh`, `lapisan`, `lokasi`, `pose`, `ekspresi` | `jenis` = tokoh / potret / ruang / prop; `lapisan` = badan / diAtasMeja / potret / latar / koridor / pintu-daun / belakang-meja / depan-meja / kursi-* / prop |
| `varian` | `bicara`, `kedip`, `kecil`, `pandang` (`bawaan` = bawaan generator per pose), Bu Rina: `hadap`, `kunci`; potret: `jendela` |
| `ukuran` | `w`, `h` (satuan dunia = viewBox) + `px.x<s> {w,h}` per skala |
| `viewBox` | viewBox berkas SVG; SEMUA titik di bawah dalam koordinat viewBox ini |
| `jangkar`, `kepala`, `tangan {kiri,kanan}` | titik GambarTokoh (tangan Bu Rina = pergelangan, kiri/kanan = sisi layar); prop: `jangkar` saja |
| `posisiDunia`, `posisiGambar` | ruang: asal viewBox lapisan di dunia, dan sudut kiri atas GAMBAR ekspor di dunia (taruh PNG di sini) |
| `kotakLapisan`, `perluasan` | ruang/prop yang gambarnya meluber: kotak kontrak asli & tambahan per sisi (lihat catatan tepi) |
| `engsel`, `jendela`, `dipakai` | engsel daun pintu; jendela potret `{x,y,sisi,nama}`; ukuran tampil yang memakai potret itu |
| `sumber` | `{berkas, fungsi, opsi}`: generator & opsi PERSIS untuk membuat ulang master |
| `svg` | `{berkas, bytes, sha256}` (sha256 teks berkas SVG) |
| `raster[]` | `{skala, px, png {berkas, bytes}, webp {berkas, bytes}}` |
| `periksa` | `tepi.x<s> {sentuh (px beralfa di baris/kolom tepi), jarak (px kosong ke tiap tepi), sudutAlfa, terisi}`, `luarKotak` / `luarKotakAwal` (`px`, `dalam` per sisi), `masalah[]`, `catatan[]`, `gagal[]` |

## Pemeriksaan otomatis

- **Transparan**: PNG & WebP yang DITULIS dibaca ulang di Chrome; sudut tokoh harus alfa 0 dan alfa sudut WebP = PNG.
- **Terpotong**: render ber-pad (80 satuan tokoh, 300 ruang/prop) menghitung gambar di luar kanvas. Tokoh = masalah.
  Lapisan ruang/prop: panggung menggambar lapisan dengan `overflow` terlihat, jadi kotak ekspor **diperluas** ke gambar
  yang meluber (dijepit ke dunia 1600 × 900; sisa di luar dunia hanya dicatat). Juga dicatat: tokoh yang hanya
  <= 2 px dari tepi kanvas.
- **Id liar**: id ganda, id tanpa awalan generator (`mr`, `mrd`, `rina`, `rg-`), rujukan `url(#…)` tanpa id,
  NaN/undefined, dan `<text>/<image>/<script>` di master.
- Lembar galeri: gambar yang gagal dimuat atau isi yang lebih lebar dari lembar = gagal.

## Lembar galeri (`lembar/`)

- `galeri-miss-raksa.png`, `galeri-bu-rina.png`: PNG x1 di atas papan catur, garis putus = batas kanvas; tanda
  jangkar (silang merah), cincin kepala setinggi kepala kontrak (biru), tangan (hijau); bingkai merah = masalah.
- `galeri-ruang.png`: susunan lapisan per lokasi (teks papan dari `Episode.panggung.lokasi.nama`), susunan uji jangkar
  dengan tokoh di titik `tempat` (prop panggung tidak ditaruh), tiap lapisan dengan kotak & posisi, prop.
- `ukuran.png`: tokoh pada kepala ± 117 px (desktop) & ± 62 px (HP), potret 64/52/44/32 px pada 1× dan 2×, sisipan
  telepon; SVG master dirender Chrome langsung pada ukuran itu, potret dalam bingkai bulat seperti `.tokoh-potret`.

Lembar galeri adalah alat tinjau, bukan bukti kemiripan dengan foto referensi.

## Membuat ulang

Setelah generator berubah: `npm run ekspor:aset-cerita` (folder lama dikosongkan otomatis), lalu buka keempat lembar
dan baca `catatan`/`masalah` di ringkasan konsol. Bandingkan dua ekspor lewat `svg.sha256` per `id` di manifest (SVG
deterministik: dua ekspor berturut-turut 217/217 hash sama). PNG/WebP TIDAK identik per byte antar jalan (pembulatan
rasterisasi perangkat lunak Chrome, beda piksel ± PSNR 70 dB) dan bisa bergeser antar versi Chrome.
