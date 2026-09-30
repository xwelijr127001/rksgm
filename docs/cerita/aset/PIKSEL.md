# Kontrak seni piksel (tokoh & ruang) — AUTO-1

Satu halaman kontrak bersama untuk semua aset piksel panggung cerita. Rincian per aset:
[`MISS-RAKSA-PIKSEL.md`](MISS-RAKSA-PIKSEL.md), [`BU-RINA-PIKSEL.md`](BU-RINA-PIKSEL.md), [`RUANG.md`](RUANG.md).

> **Sumber gambar hanya lokal.** `character/miss-raksa-pixel-v4/`, `character/bu-rina-pixel-v1/`, dan keluaran antara
> `character/piksel/` tidak ada di repo publik. Aset jadi di `client/src/cerita/seni/piksel/` sudah cukup untuk build &
> uji; alat `tools/piksel/bangun-*.mjs` hanya bisa dijalankan di mesin yang memiliki sumber itu.

## 1. Skala & tampilan

- **1 piksel seni = 4 satuan dunia.** Dunia 1600 × 900 = 400 × 225 piksel seni.
- Tampil hanya dengan **jumlah piksel perangkat BULAT per piksel seni** saat diam (kamera panggung `kamera.ts`
  dipaskan: `4 · skala · dpr` bulat) dan **nearest-neighbour** (`image-rendering: pixelated`). Tidak ada skala pecahan
  pada sprite saat diam; animasi (geser/crossfade) boleh pecahan sementara.
- Tokoh selalu **skala 1** di dunia. Kepala tokoh (puncak sanggul/hijab → dagu) ± 52-54 piksel seni; Miss Raksa 54,
  Bu Rina 45-46 (hijab tanpa sanggul) dengan wajah (jarak pupil, lebar pipi) disamakan.
- Posisi: `kiriAtas = (round(duniaX / 4 − jangkar.x), round(duniaY / 4 − jangkar.y))` di piksel seni, lalu × skala
  kamera bulat. Titik tempat di `ruang.json` (`tempat.mentor`, `mentorBerdiri`, `nasabahDuduk`, `nasabahBerdiri`, …)
  semuanya kelipatan 4.

## 2. Berkas gambar

- PNG **alpha biner** (0 atau 255 saja). RGB piksel ber-alpha 0 tidak berarti (sumber generatif menyimpan RGB tersembunyi
  di sana): alat tidak pernah membacanya dan **tidak memakai chroma key**.
- Atlas tokoh = **PNG terindeks 8-bit + tRNS** (indeks 0 transparan), **≤ 40 warna** per tokoh. Warna garis tergelap
  **`#0f0b11`** dipakai bersama Miss Raksa & Bu Rina (putih mata `#f7f2ea` juga sama). Ruang memakai paletnya sendiri
  (≤ 48, garis `#3a2620`).
- Build **deterministik**: dua kali bangun = byte identik (hash dicatat di laporan tiap alat).

## 3. Manifest tokoh (bentuk bersama Bu Rina & Miss Raksa)

Koordinat = **piksel seni relatif pojok kiri-atas frame** (rect trim di atlas); titik berada di batas piksel.

```
{ versi, dibuat, tokoh, piksel: 4, gambar, ukuranAtlas: [w, h], palet: [...hex], ekspresi: [...], varian: ['dasar','kedip','bawah','bicara'],
  urutanGambar, frame: { <id>: {
    rect: [x, y, w, h]                 // atlas
    hadap: 'kiri' | 'kanan', jenisJangkar: 'kaki' | 'pinggul', jangkar {x,y}
    kaki {x,y} | pinggul {x,y}          // (Bu Rina: kaki selalu ada; Miss duduk: pinggul, kaki tersembunyi meja)
    kepala {x,y}, leher {x,y}, titikWajah {x,y}
    tangan?: { kunci | telepon | telunjuk | telapak: {x,y} }
    wajah: { kotak: [x,y,w,h], mata: [...], mulut: [...] }
    ekspresi: { <e>: { dasar, kedip, bawah, bicara } }   // rect atlas; ukuran = kotak / mata / mata / mulut
    asal, ... } },
  pose: { <pose>: { kiri, kanan, ... } }, potret: { frame, jendela: {32,44,52,64,96}, dekat: {52,64,96} },
  telepon: { frame, jendela }, aktivitas: { frame, ekspresi }, berkas: { byte, warna } }
```

**Urutan gambar satu tokoh**: tubuh (`rect`, wajah netral sudah terpanggang) → `ekspresi[e].dasar` di `wajah.kotak` →
`kedip` ATAU `bawah` di `wajah.mata` → `bicara` di `wajah.mulut`. Tubuh saja sudah sah (cadangan bila lapisan gagal).

**Wajah terkunci-kepala**: kepala tidak pernah bergerak ketika kedip/bicara/ganti ekspresi; hanya piksel fitur yang
berganti. Setiap alat membuktikannya dengan diff (0 piksel berubah di luar `wajah.kotak` untuk ekspresi, 0 di luar
`wajah.mata`/`wajah.mulut` untuk varian).

**Varian `bawah` = lirik ke bawah, BUKAN mata terpejam** (ronde 3). Pada 2-3 px perangkat per piksel seni, kelopak yang
turun sampai tersisa 1 baris iris terbaca tertutup (temuan verifikasi momen kartu). Aturan: garis bulu mata turun tepat
1 baris dari mata dasar (satu baris gelap, bukan dua), dan di bawahnya **iris ≥ 2 baris + putih mata di sisi** tetap
terlihat, untuk SETIAP ekspresi (mata yang dasarnya sudah 2 baris tidak diturunkan lagi; mata tertutup-senyum diberi
celah iris di bawah lengkungnya). Alat menggagalkan build bila aturan ini dilanggar (`bangun-miss.periksaMataBawah`,
`bangun-rina` lewat `rina-wajah.lirikBawah`). Varian `kedip` tetap satu-satunya mata tertutup.

## 4. Tokoh di balik meja (Miss Raksa duduk)

- Frame duduk memuat `garisMeja` (y tepi JAUH meja di frame) = `pinggul.y − 34` = `tempat.garisMejaMentor` (656 dunia).
- Di bawah `garisMeja` frame hanya berisi lengan bawah & tangan yang bertumpu di meja; badan di bawah garis itu sengaja
  kosong (tertutup meja). Karena itu `diAtasMeja` boleh berupa satu kotak selebar frame:
  panggung menggambar **gambar yang SAMA, transform yang SAMA**, dipotong ke `diAtasMeja`, sesudah permukaan meja & prop
  dan sebelum depan meja. Tidak ada salinan lengan kedua, tidak ada celah pergelangan.
- **Garis tepi jauh meja** (lapisan `belakangMeja`: 1 baris gelap `#3a2620` di y seni 163 = baris `garisMeja − 1` frame)
  TIDAK boleh melintang di lengan yang bertumpu di meja. Karena itu `diAtasMeja` = daftar kotak: kotak selebar frame
  mulai `garisMeja`, **ditambah kotak 1 baris di `garisMeja − 1` HANYA di kolom lengan** yang melintas tepi. Kolom torso
  tidak ikut, jadi pinggang tetap di balik tepi meja; lengan yang turun ke pangkuan (tunjuk, telepon) juga tidak ikut.
  Bila bibir meja kelak 2 baris, naikkan kotak lengan menjadi 2 baris. Panggung menerima banyak kotak
  (`diAtasMejaPiksel: Kotak[]`, satuan kanvas = piksel seni × 4).
- Jangkar pinggul boleh berada di bawah `rect` (pinggul tertutup meja).
- **Bingkai antara `duduk-turun`** (Bu Rina: di depan kursi; Miss Raksa ronde 3: di balik meja): `jenisJangkar: 'kaki'`
  (BUKAN pinggul walau namanya `duduk-*`), jangkar di y LANTAI tempat berdiri, x dipilih panggung supaya kepala di tengah
  kepala berdiri & duduk (`bingkaiTurun`). Miss: tubuh di bawah tepi meja tidak digambar, jadi jangkar kakinya berada di
  bawah `rect` dan frame harus digambar DI BALIK meja; `garisMeja` frame itu hanya keterangan (berlaku bila kaki di y 900),
  tanpa `diAtasMeja`. Manifest memberi `pose['duduk-turun']` dan `animasi.duduk` / `animasi.berdiriDariDuduk`.

## 5. Ekspresi yang terbaca di ukuran kecil

Ekspresi dibedakan lewat **bentuk**, bukan hanya warna: pada 44-64 px ×1 satu piksel fitur ≈ satu piksel layar, jadi
ganti warna bibir/alis saja tidak terbaca. Pedoman (dipakai Miss Raksa ronde 2): tiap ekspresi berbeda ≥ 30 piksel dari
`netral` dan mengubah paling tidak satu siluet fitur (lebar/tinggi mulut ≥ 2 px, posisi alis ≥ 1 px sepanjang alis,
atau bukaan mata ≥ 1 baris). Periksa **sendiri** (tanpa pembanding di sebelahnya) pada p44/p64 ×1 dan di bingkai HP
2×, selain berdampingan. Senyum tetap bermata terbuka (iris terlihat), supaya tidak terbaca puas/licik.

## 5b. Ikon kepala mini (potret < 44 px CSS)

Jendela potret 1:1 pada slot 28-32 px hanya memuat wajah (sanggul, rambut, hijab, seragam hilang). Karena itu slot potret
dengan ukuran TAMPIL < 44 px CSS (`nasabah.ts BATAS_IKON_PX`; Riwayat 32, label "Pelajaran" kartu akhir 32) memakai
**ikon kepala mini** gambar tangan: `client/src/cerita/seni/piksel/ikon.json` + `ikon-miss-raksa.png` /
`ikon-bu-rina.png`, dibangun `tools/piksel/bangun-ikon.mjs` (deterministik, sha256 di manifest), dibaca
`client/src/cerita/seni/piksel/ikon.ts`. Kotak 32 × 32, 1 piksel ikon = 1 px CSS × dpr bulat pada slot 32; kepala utuh +
kerah/bros di dalam lingkaran isi 28 (cincin putih 2 px); huruf grid = indeks palet manifest tokohnya (palet sama dengan
atlas); kepala terkunci antar ekspresi (hanya kotak `wajah` ikon berubah). Tanpa varian kedip/bawah/bicara. Belum
ditinjau PIC/pemilik.

## 6. Pemeriksaan wajib per build

Jumlah warna ≤ 40 & semua di palet manifest; alpha {0,255}; ukuran tiap lapisan = kotaknya; diff kepala terkunci (lihat
atas); lembar tinjau dilihat pada ukuran tampil NYATA (1×, 2×, 3×) dan 4× — bukan hanya zoom besar. Klaim yang tidak
diperiksa (HP fisik, pemain pemula, kemiripan dengan orang nyata) tidak ditulis sebagai fakta.
