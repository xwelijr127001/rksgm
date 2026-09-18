# Asal & lisensi aset adegan 2D

| Aset | Asal | Lisensi / status |
| --- | --- | --- |
| Engine adegan: **Phaser 4.2.1** (`node_modules/phaser`) | npm, Phaser Studio Inc. | MIT |
| Semua gambar adegan: latar, objek, kendaraan, dokumen, NPC, petugas (`client/src/game/art/*.ts`, `client/src/game/scenes/*.ts`) | Digambar sebagai kode SVG di repo ini (September 2026), dirasterisasi di browser saat adegan dimuat | Milik proyek; tidak memakai gambar, sprite, atau font pihak ketiga |
| Bentuk maskot Raki (panel HTML, tidak lagi di adegan) | Komponen `client/src/art/Raki.tsx` yang sudah ada | Usulan karakter game, **belum** maskot resmi |
| Palet warna | Token `shared/brand.ts` / `theme.css` | Usulan desain game, **belum** diverifikasi dengan brand guideline Raksa |
| Huruf di adegan | Font sistem perangkat (Segoe UI / Roboto / Arial) | Tidak ada font yang diunduh |
| Musik & efek suara | Tidak berubah: lihat `client/public/audio/CREDITS.md` | Milik proyek |
| Ilustrasi statis cadangan (`client/src/art/Scene.tsx`) | Sudah ada sebelumnya | Milik proyek |
| Mr Roger (CEO): `client/public/karakter/ceo-besar.{webp,png}` | Diturunkan dari `character/owner-pixel-wave-sheet.png` (pixel art 4 frame, diberikan tim) oleh `tools/siapkan-karakter.mjs`: dipotong & diperkecil saja, tanpa mengubah gambar | Menggambarkan **orang sungguhan**. Pembuat gambar & lisensi sumber **belum tercatat**; pemakaian wajah dan kalimat sapaan perlu **persetujuan beliau** sebelum acara |
| Bu Isti (Direktur IT): `isti-besar.{webp,png}` | Dari `character/Direktur IT Isti Marlisa wave.png` (diberikan tim), cara yang sama | Menggambarkan **orang sungguhan**; status sama dengan Mr Roger |
| Miss Raksa (ikon Raksa CS): `miss-raksa-besar.{webp,png}` | Dari `character/Miss Raksa.png` (diberikan tim), cara yang sama | Ikon perusahaan menurut tim; pemakaian di game perlu dikonfirmasi pemilik brand |

## Status jujur

- Tidak ada **placeholder pihak ketiga**. Semua gambar buatan proyek sendiri dengan gaya datar yang
  seragam (garis tepi tinta pada objek yang bisa disentuh, latar pucat tanpa garis tepi).
- Ilustrasi masih **gaya vektor sederhana** buatan kode, belum dikerjakan ilustrator profesional.
  Cukup jelas untuk dimainkan, tetapi belum boleh disebut aset final.
- Logo resmi Raksa **belum** dipakai di adegan.
- Tokoh Mr Roger, Miss Raksa, dan Bu Isti adalah satu-satunya aset bitmap (pixel art), jadi gayanya sengaja berbeda dari vektor
  datar: mereka tampil sebagai "tamu" yang menyapa di panel (potret bulat), tidak pernah di atas adegan. Menonaktifkan satu tokoh
  cukup dengan `TOKOH.<id>.aktif = false` di `shared/brand.ts`.

## Menambah / mengganti gambar

Gambar objek cukup berupa fungsi yang mengembalikan string SVG (`art(kunci, lebar, tinggi, isi)`).
Kunci harus unik dan diawali prefiks misi, misalnya `m04-excavator`. Bila ingin memakai gambar
buatan ilustrator (PNG/SVG), simpan di `client/public/adegan/`, catat asal & lisensinya di tabel
di atas, lalu ganti isi fungsi gambar dengan elemen `<image href="...">`.
