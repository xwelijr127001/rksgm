# Kebutuhan aset visual Mode Cerita

**Revisi v4 (PIXEL ART), 28 September 2026.** Pemilik menolak wajah & tangan SVG semi-realistis v3 (terlihat
menyeramkan/kaku, lengan-tangan tidak natural) dan memilih pixel art hangat seperti folder `character/` (brief
`character/miss-raksa-pixel-v4/PROMPT-CLAUDE.md`). Kontrak piksel: [`aset/PIKSEL.md`](aset/PIKSEL.md); kontrak adegan:
`docs/cerita/ADEGAN-AUTO1.md`. Status: **SELESAI** (dipakai game), **CADANGAN** (fallback yang tetap terbaca), **BELUM**
(slot kosong / butuh sumber atau keputusan). Bagian 2 dst. di bawah = arsip seni SVG v3 (kini hanya fallback terakhir
untuk halaman di luar panggung bila atlas tidak ada).

**Polish v5 (28 September 2026, review `Desktop/raksa-v4-review-20260928`)**: wajah Miss Raksa kini memakai fitur
master (mata, alis, mulut dari sel ekspresi yang di-resample; tidak lagi dihapus lalu digambar ulang generik), postur
duduk dinaikkan 11 piksel seni terhadap meja (dada & lengan atas terlihat, tangan bertumpu), pose menunjuk & telepon
digambar ulang, ruang lebih tenang (dinding pasir, meja jati terpisah dari jas emas, bambu diredam, pintu kayu madu +
koridor terang), kamera kedatangan HP tanpa menjauh ke seluruh ruang, garis & tekstur Bu Rina diselaraskan, sprite global
Miss di HP minimal floor(dpr) piksel perangkat per piksel seni. Bukti: `Desktop/raksa-v5-polish-bukti/`.

## 1. Ringkasan status (v4 piksel)

| Aset | Status | Sumber / master | Catatan |
| --- | --- | --- | --- |
| Miss Raksa piksel: 7 pose kontrak × hadap kiri/kanan, 5 wajah (netral, senyum, prihatin, serius, lega) × dasar/kedip/bawah/bicara, jendela potret, sisipan telepon | **SELESAI** (dibuat dari 3 master generatif pemilik; bukan pixel-perfect) | master: `character/miss-raksa-pixel-v4/*.png` (tidak diubah); resep & native: `character/piksel/miss-raksa/`, `tools/piksel/bangun-miss.mjs` + `miss-*.mjs`; runtime `client/src/cerita/seni/piksel/miss-raksa.png/.json` | [`aset/MISS-RAKSA-PIKSEL.md`](aset/MISS-RAKSA-PIKSEL.md). Lencana = batang emas netral (bukan logo). Hadap kanan = cermin + perbaikan belahan rambut, kancing, lencana. Tangan telepon masih agak besar di pipi. |
| Bu Rina piksel: berdiri, jalan-a/jalan-b, duduk-turun, duduk + 4 gestur duduk (kesal/cemas/bingung/lega), duduk-condong, telepon, hadap kanan (cermin) × 8 ekspresi × dasar/kedip/bawah/bicara | **SELESAI** (dibuat dari 4 lembar Canva berbasis teks) | lembar: `character/bu-rina-pixel-v1/*.jpg` (tidak diubah); `character/piksel/bu-rina/`, `tools/piksel/bangun-rina.mjs` + `rina-*.mjs`; runtime `seni/piksel/bu-rina.png/.json` | [`aset/BU-RINA-PIKSEL.md`](aset/BU-RINA-PIKSEL.md). Identitas dipertahankan: hijab bata + bros, tunik biru, celemek krem bertepi jingga, kunci, celana gelap. Keluar (hadap kanan) = cermin (pakaian hampir simetris). |
| Ikon kepala mini 32 px (Riwayat, label Pelajaran kartu akhir) | **SELESAI** | `tools/piksel/bangun-ikon.mjs` → `seni/piksel/ikon-*.png` + `ikon.json` | Digambar tangan pada resolusinya sendiri supaya sanggul/hijab tetap tampak di bawah 44 px. |
| Ruang Raksa Silver Club (meja, pintu di sekat kanan, kursi, papan nama), telepon, parkiran, koridor pintu-luar, prop (kartu polis, kunci, telepon tanpa/dengan gagang) | **SELESAI** (render SVG ruang → piksel terkuantisasi, bukan gambar tangan) | `seni/ruang/*` (geometri = sumber koordinat) → `tools/piksel/bangun-ruang.mjs` → `seni/piksel/ruang-*.png` + `ruang.json` | [`aset/RUANG.md`](aset/RUANG.md). Tulisan papan dipanggang dari `LOKASI_AUTO_1` dengan font bitmap 7 px; bangun ulang bila nama/geometri berubah. |
| Sprite global Miss Raksa (beranda, kenalan, join, host, proyektor, pemandu misi solo) | **SELESAI** | `tools/siapkan-karakter.mjs` dari atlas piksel → `client/public/karakter/miss-raksa-besar.*` | Skala bulat per perangkat; di HP ukurannya bisa lebih kecil dari slot lama (keputusan tata letak pemilik). Mr Roger & Bu Isti TIDAK diubah (gaya halus lama). |
| Bu Rina di adegan aktivitas Phaser (bukti) | **SELESAI** (frame `aktivitas`, filter NEAREST, skala bulat) | `game/scenes/cerita/auto1-bukti.ts` | Latar aktivitas Phaser masih vektor datar: gaya bercampur (keputusan pemilik). |
| Seni SVG v3 (Miss Raksa, Bu Rina) | **CADANGAN** terakhir untuk halaman luar panggung; panggung memakai siluet netral bila atlas gagal | `seni/tokoh/missRaksa.ts`, `buRina.ts` | Ditolak pemilik sebagai tampilan utama; jangan dipakai lagi sebagai arah seni. |
| Siluet pengganti | **CADANGAN** | `seni/tokoh/sementara.ts` | Nama tokoh ditulis sebagai teks. |
| Eksterior Wisma BSG | **BELUM** (slot kosong) | — | Butuh foto fasad resmi yang teridentifikasi (`ADEGAN-AUTO1.md` bagian 5). |
| Varian lanjutan berbasis gambar master (mis. Miss Raksa hadap kanan asli, pose telepon, frame transisi) | **BELUM** (dibuat lewat sunting piksel) | `character/miss-raksa-pixel-v4/PROMPTS-IMAGEGEN.md` | Generator gambar dengan rujukan master tidak tersedia untuk agen (unggah berkas lokal ke layanan luar ditolak); pemilik dapat membuatnya dengan prompt tersebut lalu diproses ulang dengan `tools/piksel`. |
| Nasabah & latar episode berikutnya | **BELUM** | — | Pola: lembar sumber → `tools/piksel` (normalisasi, palet, wajah terkunci) → atlas + manifest bentuk yang sama. |

## 2. ARSIP v3 SVG — Bu Rina (kini hanya cadangan)

**Identitas tetap** (dari v2; brief v3: "pertahankan identitas yang sudah ada"): ibu pemilik usaha katering 40-an;
kerudung (khimar) warna bata #b95a43 dengan pet/tepi di dahi, ciput tipis gelap, dan **bros kuning** kecil di bawah
dagu; **tunik biru** #35607a selutut dengan manset biru tua dan lis jingga #e8833a di keliman; **celemek pinggang krem
#f4e4c4 bertepi & bertali jingga** #e8833a (baru dari dapur); celana panjang gelap abu-biru #474b58, sepatu datar
cokelat; **kunci mobil** (remote hitam berlampu kuning). Orang yang berbeda dari Miss Raksa dan dari pria di foto #5:
kulit lebih gelap & hangat, wajah lebih bulat, alis alami, tanpa riasan tebal, garis usia halus (lipatan senyum,
bawah mata).

**Keputusan celemek (lead, putaran 3, 27 Sep):** celemek DIKEMBALIKAN di semua pose sebagai kain TIPIS. Putaran 2
menghapusnya karena versi duduk lama terbaca sebagai bantal di pangkuan; tanpa celemek, tidak ada tanda katering di
badannya (juri putaran 2). Bentuk sekarang:
- berdiri / jalan / pergi: celemek pinggang dengan tali jingga melingkar pinggang (simpul & dua ujung tali di pinggul
  dekat), panel krem tergantung sampai ± 40 satuan di atas lutut (lis jingga tunik tetap tampak di bawahnya), 3 lipatan
  kerut dari tali, lis jingga di keliman & kedua tepi, satu saku tempel kecil. Keliman celemek ikut ayunan langkah
  (85 % ayunan tunik);
- duduk / condong / telepon: kain yang sama rebah di atas paha (bidang puncak paha terang), jurai pendek di sisi paha
  dekat (tunik biru tetap tampak di bawahnya sampai dudukan), jatuhan tegak di depan lutut dengan keliman lurus
  berlis jingga; satu lembah lipatan di celah dua paha, satu lipatan di jatuhan, garis patah di lutut. Tanpa pita
  bayang melingkar (yang membuat kain menggembung) — bukan bantal;
- hadap kanan: titik dicerminkan sebelum diarsir (simpul pindah ke pinggul dekat yang baru), cahaya tetap kiri atas.
Pemilik produk masih perlu menyetujui tampilannya (lihat bagian 3).

**Gaya = Miss Raksa v3** (`seni/tokoh/gaya.ts`): garis tipis cokelat tua `GARIS.warna` #3a2620 (tebal 1,05–1,15
satuan; garis dalam #7b4636), cahaya dari kiri atas (`CAHAYA`), isi gradien terang kiri-atas → gelap kanan-bawah +
pita bayang/sorot tembus bertumpuk di sisi yang menjauhi/menghadap cahaya, tanpa `<filter>`, tanpa raster, tanpa
clipPath (iris & bayang kelopak dipotong secara analitik). Kepala = model 3D simetris ditulis tangan (titik x, y, z)
yang diproyeksikan ulang per arah pandang, jadi semua ekspresi & arah = wajah yang sama.

| Pose (`PoseNasabah`) | Kanvas | Isi |
| --- | --- | --- |
| `berdiri` | 420 × 1000, telapak (210, 985) | Kunci di tangan dekat; gestur ikut ekspresi (lihat bawah). `hadap: 'kanan'` = berbalik ke pintu. |
| `jalan-a`, `jalan-b` | sama | Dua langkah: kaki bergantian (tumit belakang terangkat), lengan berayun berlawanan, badan turun 8 / 6,5 satuan (naik-turun 1,5), keliman tunik & celemek terayun 7 satuan berlawanan dengan sisi kaki depan dan miring 2,5°, lutut depan mendorong kain. Hadap kiri (masuk) & kanan (keluar). |
| `berdiri-pergi` | sama | Badan & kepala berbalik ke KANAN (pintu): titik dicerminkan sebelum diarsir, cahaya tetap kiri atas. `pandang: 'lawan'` = menoleh balik ke Miss Raksa. |
| `duduk` | 460 × 900, pinggul (230, 560) | 3/4 menghadap kiri; puncak paha rata, lutut ± 65, bokong di dudukan (dipangkas ± 15 % dari putaran 2), celemek di pangkuan, lutut → telapak ± 257 satuan (± y 820; di panggung di luar bingkai); bayang kontak di dudukan (300, 578). |
| `duduk-condong` | sama | Badan atas & kepala condong 11° dari pinggul (bersiap pergi); tangan jauh bertumpu di tepi meja (tepi dekat meja ± y 490 kanvas), tangan dekat menggenggam kunci di atas paha. |
| `telepon` | sama | Telepon genggam di telinga (di atas kerudung), tangan jauh menyangga siku; untuk sisipan panggilan. |

Ekspresi (`netral cemas kesal bingung lega senang serius tersenyum`) dibedakan oleh alis, kelopak atas/bawah, besar
bukaan & iris, bentuk mulut, rona, miring/angguk kepala, **bahu**, dan **gestur tangan** (bukan simbol; tanda marah,
keringat, tanda tanya, kilau lama dihapus):

| Ekspresi | Wajah | Gestur (berdiri/duduk) |
| --- | --- | --- |
| netral | kelopak santai, sudut bibir sedikit turun | kunci di tangan / tangan di pangkuan |
| cemas | ujung dalam alis naik & mendekat, mata lebar (iris kecil), bibir ditekan turun, garis dahi | kedua tangan bertaut, bahu naik |
| kesal | alis turun mengumpul, mata menyipit, bibir ditekan dengan satu sudut turun, pipi merona | tangan bersedekap |
| bingung | satu alis naik tinggi, satu turun, mata tidak sama, mulut miring, kepala miring 8° | telunjuk di rahang, tangan lain menyangga siku |
| lega | kelopak turun lembut, senyum kecil agak lebar, bibir sedikit terbuka, kepala sedikit mendongak | tangan di dada, bahu turun |
| senang | tawa terbuka (gigi atas), mata tersenyum, pipi naik & merona | tangan bertaut di dada |
| serius | alis datar agak turun, mata fokus, bibir garis tegas, kepala maju | seperti netral |
| tersenyum | senyum tertutup lebar, kelopak bawah naik, kepala miring | seperti netral |

Opsi lain: `pandang` `lawan | pemain | bawah | depan` (`bawah` = isyarat kartu: kelopak atas turun paling banyak
± separuh bukaan, iris tetap tampak — tidak terbaca tidur di HP); `bicara` (mulut terbuka, dipakai bergantian oleh
panggung); `kedip`; `kecil` (garis ± 2,3×, mata 1,32×, alis 1,85× dan raut dilebihkan untuk potret ≤ 75 px; serius:
alis 1,5 satuan lebih turun + bibir garis datar; tersenyum: mata terbuka + ujung senyum naik, beda dari lega yang
kelopaknya turun); `kunci`; `hadap`. Titik `tangan.kiri/kanan` = sisi LAYAR (tangan pemegang kunci = sisi kanan layar
di kedua arah). `kepala` = pusat kepala sebenarnya (bergeser sedikit per ekspresi/condong/langkah). Ukuran SVG
± 56–60 KB (versi kecil ± 36–39 KB), ± 1,2–1,6 ms per panggilan pertama, hasil di-cache (`buatCache`).

Kerudung (khimar) putaran 3: puncak 4,5 satuan lebih rendah (kepala bulat di balik kain), kilap separuh putaran 2
(katun, bukan karet), tiga lipatan jatuh tegak dari bros ke keliman, keliman bergelombang tidak rata (lebar 20–33,
dalam 2,5–7 satuan), garis tepi kain lebih tipis (0,8). Tangan: jari meruncing dengan panjang berbeda (tengah
terpanjang); genggaman bersedekap (kesal) lembut, tidak mencengkeram.

**Pintu masuk lama tetap bekerja** (`seni/nasabah.ts`): `nasabahSetengahBadan(ekspresi, kecil?)` / `svgNasabah` =
potongan v3 versi POLOS (tanpa id/gradien, aman disisipkan inline berulang), `SETENGAH_BADAN` / `NASABAH_W/H`
360 × 420 (rasio lama 120:140; memuat tali pinggang celemek), `JENDELA_POTRET_NASABAH` = `JENDELA_POTRET_V3`,
`JENDELA_POTRET_NASABAH_SEDANG` (= Miss Raksa `JENDELA_POTRET_SEDANG`), `JENDELA_POTRET_NASABAH_KECIL`,
`aturanPotretNasabah(ukuran)`, `nasabahBadanPenuh()` + `RINA_PENUH` untuk aktivitas.

Penjaga: `seni/tokoh/buRina.test.ts` (semua kombinasi sah, kanvas & jangkar, id berawalan & rujukan terpenuhi,
polos tanpa id, 8 wajah berbeda, gestur, jalan & naik-turun langkah, hadap kanan tanpa cermin CSS, celemek krem bertepi
jingga di semua pose & arah, condong 10–12°, bayang kontak dudukan, kecil lebih tebal, ukuran < 63 000 B) dan
`seni/seni.test.ts` (pintu masuk lama + tali pinggang di potongan kartu, aturan potret sama dengan Miss Raksa untuk
20–160 px, awalan `useId`, aktivitas v3 bercelemek, animasi ganti ekspresi ≤ 200 ms + gerak dikurangi).

## 3. Kesenjangan Bu Rina yang masih ada

1. **Persetujuan pemilik atas celemek.** Celemek dikembalikan (keputusan lead) sebagai kain tipis; pemilik produk
   belum melihat versi duduk baru. Bila ditolak, celemek hanya satu fungsi (`celemekBerdiri` / `celemekDuduk`) di
   `buRina.ts` dan dapat dilepas tanpa mengubah kanvas atau API.
2. **Potret 32 px.** Kedelapan ekspresi terbedakan berdampingan di 44–64 px (versi kecil, jendela kecil/sedang). Di
   32 px hanya kesal, senang, bingung (tangan), dan lega yang jelas; netral/serius/tersenyum/cemas rapat. Label
   perasaan tetap selalu ditulis sebagai teks.
3. **Menyerahkan dokumen/HP ke meja** (foto #5) tidak punya pose khusus; `duduk-condong` (condong 11°, tangan di tepi
   meja) dipakai untuk momen bersiap pergi.
4. **Tangan & lipatan kain** dibangkitkan dari rangka (tabung lengan/kaki + rangka jari): jari meruncing dan terbaca
   di panggung, tetapi kepalan (kunci, telepon) masih skematis pada perbesaran 2× dan kurang halus dari tangan Miss
   Raksa.
5. **Pangkuan duduk** masih digambar hampir menyamping (lutut bertumpuk tegak), sementara meja 3/4; paha sudah
   dipendekkan secara proyeksi (lebar siluet duduk 271 vs 291 satuan di putaran 2) tetapi perspektifnya belum satu.
6. **Belum diperiksa**: perangkat fisik (HP sungguhan), pembaca layar (gambar hiasan, `aria-hidden`), penilaian
   penutur asli/pemula atas kemiripan "ibu katering 40-an". Kemiripan wajah ke orang nyata TIDAK dituju (tokoh fiktif).

## 4. Spesifikasi untuk menambah/mengganti seni tokoh

- **API** (`seni/tokoh/tipe.ts`, dibekukan lead): generator `(opsi) => GambarTokoh { svg, w, h, jangkar, kepala,
  tangan? }`, satuan dunia skala 1, kanvas dari `seni/tokoh/ukuran.ts`, id gradien berawalan `opsi.id`.
- **Gaya**: pakai `seni/tokoh/gaya.ts` (garis, cahaya, bayang, `halus`, `buatCache`); tanpa filter/raster; merah/hijau
  tidak dipakai sebagai tanda benar/salah; perasaan tidak boleh hanya dibedakan warna atau simbol.
- **Keterbacaan**: setiap ekspresi dikenali di panggung desktop (kepala ± 130 px), HP (± 62 px), dan potret
  32–64 px lewat alis, mata, mulut, sikap kepala, dan gestur. Sertakan lembar uji.
- **Tanpa foto orang sungguhan** di repo atau di dalam seni (foto referensi hanya di folder kerja sesi).

## 5. Memasang / memeriksa

- Pasang generator: `seni/tokoh/index.ts` `pasangGenerator({ buRina: gambarBuRina })` (lead) atau impor langsung.
- Uji: `npx tsx --tsconfig client/tsconfig.json --test client/src/cerita/seni/tokoh/buRina.test.ts
  client/src/cerita/seni/seni.test.ts client/src/game/scenes/cerita/cerita.test.ts client/src/game/aksesInfo.test.ts`.
- Lembar bukti (lama vs baru, 8 ekspresi di panggung/HP/potret, semua pose, berdampingan dengan Miss Raksa di ruang
  lead, adegan aktivitas) dirender dengan puppeteer-core dari skrip di folder kerja sesi (tidak disimpan di repo).
- Periksa di 390×844, 360×740, 1440×900, 844×390, gerak dikurangi, dan mode ringan / engine gagal (aktivitas
  memakai susunan statis dari `SceneSpec` yang sama).
