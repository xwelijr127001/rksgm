# Aset ilustrasi Episode 2 (Auto-2): pemetaan, pemeriksaan, kekurangan

Turunan runtime: `client/src/cerita/seni/auto-2/ilustrasi/` (WebP + `ilustrasi.json` versi 2), dibuat oleh
`tools/cerita/bangun-ilustrasi-auto2.mjs <folder-sumber>` dari salinan permanen sumber di `character/auto-2-ilustrasi/sumber/`
(`newasset` 2 Nov + `reasset` 3 Nov, nama berkas asli; sha256 tiap sumber di manifest).
Sumber asli (Downloads, Temp) tidak diubah dan tidak dibaca saat runtime. Status: turunan aset pemilik di salinan kerja,
**bukan** pedoman merek resmi. Repo origin publik: jangan di-commit tanpa persetujuan pemilik (sama dengan `character/`).

## 1. Pemetaan sumber -> id semantik

Identitas dicocokkan dari ciri visual yang sama dengan deskripsi peran di prompt aset pemilik, **bukan** dari nama berkas:

- kumis tipis dan uban di pelipis, kemeja krem = Pak Hendra;
- kacamata, kemeja slate-blue = Pak Bima;
- rompi abu di atas polo hijau = Mas Rudi;
- kemeja kerja biru lengan pendek dengan dua saku, senyum tegang = Pak Darto;
- perempuan berambut diikat, kemeja steel-blue = admin Bengkel Mitra;
- topi dan rompi oranye reflektif = petugas tol;
- tanpa topi, kemeja abu lengan digulung, rompi HIJAU-KUNING reflektif bersaku = polisi (lihat catatan di bawah tabel).

| id | Sumber (`newasset`) | Tokoh | Ekspresi naskah | Pose / catatan |
| --- | --- | --- | --- | --- |
| miss-senyum | ChatGPT Image Nov 2, 2026, 11_36_23 PM-1 | Miss Raksa | netral | dada ke atas, senyum tenang |
| miss-jelaskan | … 11_36_24 PM-2 | Miss Raksa | serius | menjelaskan, telapak terbuka (pembuka) |
| miss-salam | … 11_36_26 PM-3 | Miss Raksa | tersenyum | tangan menyatu (penutup) |
| miss-semangat | … 11_36_26 PM-4 | Miss Raksa | senang | kepalan menyemangati (belum dipakai naskah) |
| miss-pikir | … 11_36_27 PM-5 | Miss Raksa | bingung | tangan di dagu (belum dipakai naskah) |
| hendra-panik | … 11_36_35 PM-1 | Pak Hendra | bingung | kaget/panik (pesan pertama) |
| hendra-cemas | … 11_36_36 PM-2 | Pak Hendra | cemas | |
| hendra-tenang | … 11_36_37 PM-3 | Pak Hendra | netral, lega | senyum tipis |
| hendra-kecewa | … 11_36_38 PM-4 | Pak Hendra | kesal | **pendekatan**: sumber tidak punya ekspresi marah, dipakai kecewa/sedih |
| hendra-senang | … 11_36_39 PM-5 | Pak Hendra | senang | |
| bima | … 11_36_51 PM-1 | Pak Bima | (semua) | badan penuh; tanpa varian "serius" |
| darto | … 11_36_51 PM-2 | Pak Darto | (semua) | badan penuh; tanpa varian cemas |
| admin | … 11_36_52 PM-3 | Admin Bengkel Mitra | (semua) | badan penuh |
| hendra (badan) | … 11_36_59 PM-2 | Pak Hendra | - | badan penuh untuk sampul daftar episode |
| rudi | … 11_37_00 PM-3 | Mas Rudi | (semua) | badan penuh |
| tol | Friendly Indonesian Toll Worker in Safety Vest-1 | Petugas tol | (semua) | dipilih dari 4 varian: topi membedakannya dari Rudi/Darto |
| polisi (badan) | `reasset` Traffic Officer Giving a Briefing | Polisi Jalan Raya | (semua) | memberi keterangan: buku catatan, telapak terbuka |
| polisi (avatar) | `reasset` Friendly Safety Officer in High-Visibility Uniform | Polisi Jalan Raya | (semua) | orang yang sama, berdiri tenang; wajah lebih ke depan untuk potret |
| trailer | `reasset` Damaged Blue Semi-Truck with Trailer | (benda) truk kasus | - | kepala biru tampak 3/4 depan kanan, kaca retak, depan ringsek; bak putih panjang, 3 gandar |
| latar pool | `reasset` Colorful Truck Parking Yard Background | - | - | halaman beton, pos jaga, gerbang, gudang; tanpa kendaraan |
| latar bengkel | `reasset` Heavy Vehicle Workshop Forecourt | - | - | 3 bay berisi truk (antrean penuh), papan berdiri KOSONG di kanan |
| latar tol | `reasset` Vibrant Highway Overpass in Daylight | - | - | bahu jalan + rel pengaman kiri, lajur menjauh, pembatas beton, jembatan layang; tanpa rambu |
| latar wawancara | `reasset` Bright Modern Office Meeting Room | - | - | ruang rapat kosong (rak, jendela kaca buram), tanpa meja |

**Polisi**: kedua gambar `reasset` memperlihatkan orang yang sama (wajah, rambut, kemeja, rompi). Isi gambar **tidak** memuat
atribut kepolisian (seragam cokelat, lencana, tulisan POLISI, topi/helm); dari gambarnya saja ia petugas lalu lintas/keselamatan.
Dipakai sebagai Polisi Jalan Raya sesuai arahan pemilik; identitas di layar datang dari nama pemeran ("Polisi Jalan Raya")
di kartu saksi, riwayat, dan siluet cadangan. Ia jelas beda dari petugas tol: tanpa topi, kemeja abu (bukan biru dongker),
rompi hijau-kuning (bukan oranye). Bila tim ingin atribut Polri, perlu aset baru (lihat bagian 7).

## 2. Tidak dipakai (dengan alasan)

- **Miss Raksa badan penuh** (`11_36_58 PM-1`):
  - Hanya 27 % piksel tepinya bergaris tinta; 67 % berwarna (rata-rata 112,78,29).
  - Tepi tangan tanpa garis tinta, dengan pinggiran cokelat semi-transparan yang terlihat di atas latar gelap.
  - Tidak bisa dibersihkan tanpa merusak bentuk, karena garis tepinya memang tidak ada.
  - Miss Raksa hanya tampil di kantor, dan di sana potret dada-ke-atas (5 ekspresi, tepi bersih) cukup.
- **Lembar stiker** (`Indonesian Insurance Character/Team Sticker Sheet`): tokoh kecil, tepi berwarna/halo
  (46 % & 38 % tepi bertinta), latar sisa matting.
- **Petugas tol lain** (`Toll Officer -2`, `Road Worker -3`, `Toll Worker -4`): satu master per tokoh supaya wajah konsisten.
- **`reasset`: ketujuh gambar dipakai.** Ruang rapat (`Bright Modern Office Meeting Room`) dipakai untuk ruang wawancara,
  BUKAN pengganti kantor (kantor tetap interior pilihan pemilik).

## 3. Pemeriksaan transparansi & tepi (bukan sekadar "PNG punya alpha")

- Semua sumber punya alpha sungguhan. Bagian "padat" ber-alpha 253 (tembus 0,8 %); kabut alpha ≤ 4 ada di area kosong.
  Turunan: alpha ≥ 248 menjadi 255 dan ≤ 4 menjadi 0.
- Pinggiran:
  - Hanya piksel SEMI-transparan di batas siluet yang lebih terang dari garis tinta terdekat (≤ 3 px) yang diwarnai
    tinta; alpha tetap, jadi antialias terjaga.
  - Isi (rambut, headset, tangan, warna baju) tidak diubah.
  - Tepi tanpa tinta dibiarkan.
  - Statistik per aset ada di `ilustrasi.json` (`tepi`): 92–99 % piksel tepi punya tinta dalam 3 px; hendra-senang 80 %;
  polisi 100 %, trailer 93 %.
- **Bintik lepas**: komponen alpha terpisah < 300 px dibuang. Semua yang terbuang ber-alpha ≤ 11 (≤ 4 % opasitas, tak
  terlihat; mis. 7 titik di dekat tangan polisi, 430 px sisa matting di sekitar truk). Helai rambut & spion tidak tersentuh
  karena tersambung ke siluet.
- **`reasset`**: tiga gambar bertokoh/benda ber-alpha sungguhan dengan profil sama seperti `newasset` (padat 253, kabut ≤ 4).
  "Cahaya" oranye/hijau di pratinjau berlatar hitam adalah warna RGB piksel ber-alpha 0, bukan halo: alpha × 16 tidak
  menunjukkan sisa di sana. Turunan diperiksa di atas latar zaitun/terang/gelap: tepi bersih. Empat latar tanpa alpha (1672 × 941).
- Perkecil memakai Lanczos-3 di ruang PREMULTIPLIED, sehingga warna piksel transparan tidak merembes menjadi halo baru.
- Diperiksa di atas putih, hitam, kayu, dan bambu gelap, pada piksel perangkat HP DPR 3 (tangkapan uji): tanpa halo terang
  maupun berwarna.

## 4. Resolusi, ukuran unduhan, pemuatan

- **Varian**:
  - avatar 160/320 px (tampil 32–96 px CSS);
  - potret dekat lebar 480/800;
  - badan tinggi 480/960/1520 (1520 untuk close-up di balik meja pada DPR 3);
  - latar & lapisan depan kantor, latar pool/bengkel/tol/wawancara lebar 1100/1672 (resolusi sumber);
  - truk trailer lebar 560/1000/1680.
- **Ukuran berkas**: latar kantor 1672 = 118 KB (sumber PNG 2,2 MB), lapisan depan 43 KB; latar lapangan 1672 =
  102–221 KB (1100 = 61–124 KB); trailer 1000 = 77 KB; polisi badan 960 = 48 KB; potret 480 = 34–61 KB; avatar 160 = 6–7 KB.
- **Batas resolusi latar lapangan**: crop HP mengikuti tokoh, jadi pada DPR 3 latar sumber 1672 px bisa tampil diperbesar
  sampai ~1,5× (paling terasa di bengkel, crop ~720 px). Tokoh, truk, potret, papan, dan rambu tetap tajam (berkas ≥ tampil × DPR;
  tulisan = teks HTML). Uji mencatat faktor ini terpisah (`latarDiperbesar`), tidak menyembunyikannya.
- **Pemilihan berkas**: `<img srcset sizes>` (browser memilih sesuai lebar tampil × DPR) untuk semua lapisan. Tidak pernah diperbesar melewati berkas terbesar (diuji: berkas ≥ tampil × DPR × 0,85).
- **Pemuatan**: berkas dimuat saat dipakai saja (URL dari Vite, tanpa preload massal). Gambar adegan pertama
  `fetchpriority="high"`.
- **Ganti ekspresi tanpa kedip**: gambar lama (beserta kotaknya) tetap tampil sampai gambar baru selesai di-decode
  (`useGambarSiap`).
- **Rendering halus**: tidak ada `image-rendering: pixelated` pada ilustrasi. Aturan pixelated hanya milik seni piksel
  Episode 1 (`panggung/panggung.css`, `game/tokoh.css`).

## 5. Interior kantor pilihan pemilik

- **Sumber**: gambar pilihan pemilik (interior hangat, dinding bambu, ceruk kayu, meja kaca), disalin ke
  `character/auto-2-ilustrasi/sumber/latar-kantor-pilihan-user.png`. Gambar ini **bukan** foto interior Raksa Silver Club,
  jadi labelnya netral: "Layanan Klaim Raksa" (UI tajam, bukan teks di gambar); naskah tidak menetapkan RSC.
- **Lapisan**: latar → tokoh → lapisan DEPAN (meja kaca, monitor, lampu). Lapisan depan dibuat dari gambar yang sama
  dengan masker poligon antialias, sehingga tokoh berdiri di balik meja dan tidak ada meja ganda.
- **Tokoh**: memakai gambar dekat (potret dada-ke-atas, atau badan penuh untuk Bima), diskalakan menurut tinggi kepala
  (214 px sumber), puncak kepala di y 262.
- **Bingkai**: HP tegak memakai potongan 1060 px berpusat ke tokoh (kepala ≥ 55 px CSS); layar lebar memakai potongan
  1600 px. Bundel berkas babak 11 berdiri di atas meja.
- **Lokasi lapangan** memakai latarnya sendiri (bagian 6), bukan interior kantor.

## 6. Lokasi lapangan (reasset)

Satu jalur panggung untuk semua lokasi (`ui/latar/PanggungLatar.tsx`); seni kode SVG lama (dunia 720 × 225, truk kecil, papan
nama gambar) dihapus. Konfigurasi terpusat per lokasi di `seni/auto-2/ilustrasi/index.ts` (`LokasiIlustrasi`).

- **Perspektif**: keempat latar memakai cakrawala yang sama (~y 455; tol ~500), diukur dari titik hilang rak, lantai, dan
  marka. Tokoh BERDIRI berpijak di titik slot; tingginya (y kaki − cakrawala) × 1,7 / mata × tinggi relatif tokoh, jadi yang
  lebih jauh lebih kecil dan kepala dewasa di sekitar cakrawala. Bayangan kontak lembut di bawah kaki.
- **Truk trailer (pool)**: satu-satunya truk di adegan (latar pool tanpa kendaraan). Skala: kabin ~3,9 m vs orang 1,7 m pada
  alas roda depan (diuji: rasio 2,0–2,6). Lapisan diurut kedalaman (alas/kaki): Mas Rudi / Pak Hendra di depan truk.
  Kamera wajib memuat kepala truk yang ringsek; ujung belakang bak boleh terpotong tepi panggung HP.
- **Bengkel**: truk di bay adalah bagian gambar (tidak ditambah truk lagi). Papan berdiri kosong di gambar diisi tulisan kode
  "Antrean minggu ini / PENUH"; foto kerusakan (babak 5) dijepit di papan. Admin berdiri di kiri papan.
- **Tol**: gantri dua rambu digambar kode di atas jalan (teks naskah: "Truk & trailer dilarang lajur 3 dan 4", "Truk & bus
  gunakan lajur kiri") sebagai SUASANA lokasi. Lajur di gambar hasil generasi tidak bisa dihitung pasti, jadi nomor lajur
  tidak ditempel di gambar; bukti yang dibaca pemain ada di lembar bukti babak 8 (rambu terbaca + diagram lajur & posisi
  truk, D-65).
- **Ruang wawancara**: saksi berdiri berjajar (maks. 3: petugas tol, Pak Bima, polisi; atau Pak Bima & Pak Darto).
- **Kamera mengikuti subjek** (`potonganSubjek`): gabungan tokoh, kepala truk, papan wajib, benda akibat; lebar minimum per
  kelas layar; kepala tokoh & tulisan papan tidak pernah di bawah pita label lokasi (38 px CSS). Diuji untuk setiap
  komposisi naskah di 336/366/406 px (HP 360/390/430), desktop 780 px, dan kartu episode (sampul).
- **Arena**: ikon truk di peta penugasan & foto kerusakan diwarnai seperti trailer kasus (kepala biru, bak putih).

## 7. Belum tersedia (kekurangan yang diakui)

- **Polisi berseragam Polri**: aset `reasset` tanpa atribut kepolisian (bagian 1). Siluet bernama / inisial kini hanya
  cadangan bila gambar gagal dimuat. Peran tetap Polisi Jalan Raya sesuai naskah (bukan petugas tol); identitas visual
  BELUM selesai. Kebutuhan aset (bagian 8).
- **Ekspresi yang belum ada**:
  - Hendra marah (dipakai kecewa);
  - Bima serius / menunjuk bukti;
  - Darto cemas / bersaksi;
  - Rudi, admin, dan petugas tol selain netral.
- **Gaya**: latar lapangan `reasset` bergaya kartun cerah bergaris tinta (dekat dengan tokoh); interior kantor lebih
  lembut/hangat. Belum satu sistem penuh, tetapi tidak ada lagi seni kode datar.
- **Pose duduk & properti** (meja wawancara, kamera, foto kerusakan ilustrasi) belum ada; ruang wawancara tanpa meja.
- **Lajur di gambar tol**: jumlah lajur pada marka gambar tidak pasti 4. Gambar tol = suasana saja; acuan pemain = lembar
  bukti babak 8 (`dokumen.rambu.skema`: rambu terbaca + diagram 4 lajur dari kiri, truk di lajur 2 menurut supir).

## 8. Kebutuhan aset berikutnya (untuk pemilik / tim aset)

Belum dibuat diam-diam; bagian yang tersedia tetap dipakai. Gaya sama dengan `newasset`/`reasset` (kartun bergaris tinta,
PNG ber-alpha bersih, badan penuh 1024 × 1536, potret dada-ke-atas 1254 × 1254), wajah konsisten antar-pose.

1. **Polisi Jalan Raya (Polri, satuan PJR)** - prioritas: seragam dinas lalu lintas sesuai referensi resmi yang disetujui
   tim (kemeja cokelat Polri, atribut/emblem satuan, topi atau helm PJR; rompi reflektif bertulisan POLISI bila memang dipakai
   di lapangan). Jangan disimpulkan dari aset sekarang; referensi seragam perlu dari tim/humas. Pose: berdiri netral,
   memberi keterangan (buku catatan), potret dada-ke-atas netral & serius untuk avatar/kotak dialog. Satu wajah untuk semua
   pose; jelas berbeda dari petugas tol (topi & rompi oranye).
2. **Ekspresi**: Pak Hendra marah/protes (babak 14 kini memakai kecewa), Pak Bima serius/menunjuk bukti, Pak Darto cemas
   saat bersaksi, admin bengkel menyesal ("penuh").
3. **Pose duduk** (ruang wawancara dengan meja) bila adegan wawancara ingin tampak duduk; sekarang berdiri karena tidak ada
   aset duduk (tidak dipaksakan).
4. **Miss Raksa badan penuh** dengan tepi bertinta bersih (yang ada bertepi cokelat, tidak dipakai).
5. **Pak Bima potret dada-ke-atas**: close-up Bima di kantor (babak 7) memakai badan penuhnya (sumber 1530 px tinggi), jadi
   pada panggung visual novel HP tampil diperbesar ~1,2-1,45x di DPR 3 (sedikit lunak). Potret seperti Miss Raksa & Pak Hendra
   akan tajam.
