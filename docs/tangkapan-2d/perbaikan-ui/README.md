# Perbaikan UI/UX layar misi: sebelum & sesudah (18 September 2026)

> Tangkapan "sesudah" untuk **pembahasan** di folder ini sudah memakai tampilan yang lebih ringan
> dari putaran 19 September (gambar dulu, Bu Isti sebagai juri); lihat [`../momen-ringan/`](../momen-ringan/README.md).

Semua gambar diambil dari build produksi di **Chrome headless dengan emulasi perangkat**
(WebGL perangkat lunak), bukan HP fisik. Mode latihan (`/latihan?misi=N`), kecuali disebut lain.
"Sebelum" = versi yang dilaporkan pengguna; "sesudah" = versi saat ini.

| Pasangan | Ukuran | Yang berubah |
| --- | --- | --- |
| `*-m1-hp-bermain` | HP 390×844 | Kartu tugas (pertanyaan + petunjuk satu kalimat) sebelum adegan; kartu "cara main" besar dan label mekanik ganda dihapus; titik ketuk digabung ke label |
| `*-m1-hp360-bermain` | HP 360×740 | Sama, di HP kecil: adegan utuh terlihat di layar pertama |
| `*-m1-hp-pembahasan` | HP 390×844 | Mr Roger tidak lagi menutupi label & petugas; "0% Makin paham, kan?" diganti "Belum tepat. Yuk, lihat langkah yang benar."; urutan status → Pilihanmu → Langkah yang tepat → Kenapa → Intinya → tombol |
| `*-m1-desktop-dipilih` | 1280×800 | "Pilihanmu: … · Tersimpan" di atas daftar; opsi terpilih diberi teks "Dipilih" (bukan warna saja) |
| `*-m1-desktop-pembahasan` | 1280×800 | Hasil jadi kolom utama, adegan diperkecil; satu tombol utama sesuai hasil ("Coba lagi"), "Lanjut ke misi 2" tetap tersedia; "Gabung acara/Pilih misi" keluar dari hasil |
| `*-m1-hp-mendatar` | HP 844×390 | Header & bar aksi ringkas; cerita terlipat di layar pendek; pilihan terlihat bersama adegan |
| `*-m1-tablet-pembahasan` | 768×1024 | Satu kolom 680 px; hasil dulu, adegan sesudahnya |
| `*-m4-hp-bermain` | HP 390×844 | Petunjuk tidak mengulang pertanyaan; baki "Catatan temuan" ringkas (satu baris kosong, bukan 4) |
| `*-m5-desktop-bermain` | 1280×800 | Panel tanpa kotak gulir di dalam; bar aksi desktop ikut alur (tidak menutupi pilihan ke-3) |
| `*-m9-hp-hitung-penuh` | HP 390×844 | Misi hitung: jawaban sebelum adegan (ruang membaca dulu) |
| `*-m10-hp-mendatar` | HP 844×390 | Tidak ada lagi kartu tutorial & tombol lengket yang memenuhi panel |

Hanya "sesudah" (keadaan baru):

| Berkas | Isi |
| --- | --- |
| `sesudah-m4-hp-sebagian-tepat.png`, `sesudah-m4-desktop-sebagian-tepat.png` | "Sebagian sudah tepat": pilihan tepat, lalu **yang masih terlewat** saja (tidak diulang); tanda ✓/!/✕ + kata di adegan |
| `sesudah-m9-desktop1440-hitung.png` | Misi hitung di 1440×900: panel jawaban lebih lebar, papan di adegan menggemakan jawaban |
| `sesudah-m2-hp-cara-main.png` | Bantuan "Cara main" dibuka lewat tombol (tidak tampil otomatis) |
| `sesudah-m1-desktop1440-pembahasan.png` | Pembahasan di 1440×900 |

Keadaan pertandingan (briefing, jeda, terkirim, pembahasan, koneksi putus) ada di folder
induk: `m01-hp-briefing.png`, `m02-hp-jeda.png`, `m01-hp-terkirim.png`, `m*-hp-pembahasan.png`,
`tokoh-koneksi-putus-hp.png`.
