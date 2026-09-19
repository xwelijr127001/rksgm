# Momen briefing, terkirim, dan pembahasan: dibuat ringan (19 September 2026)

Keluhan: "terlalu banyak informasi yang harus dicerna, gambarnya malah di paling bawah, terlalu
banyak warna". Di pertandingan, pembahasan hanya tampil ±14 detik dan briefing ±10 detik, jadi
layar HP harus terbaca sekali lirik; layar proyektor tetap memuat pembahasan lengkap.

Semua gambar dari build produksi di **Chrome headless dengan emulasi perangkat**, bukan HP fisik.

## Prinsip

1. **Gambar dulu.** Di semua keadaan selain menjawab, adegan ada di atas. Saat pembahasan adegan
   sudah bertanda ✓ ✕ !, dengan legenda satu baris di bawahnya.
2. **Satu kalimat hasil, dibacakan juri (Bu Isti)**, lalu paling banyak tiga baris per
   pertanyaan: ✕ *Kamu pilih*, ✓ *Sudah tepat*, ! *Yang tepat / Masih terlewat*. Tanda "!" sama
   dengan tanda "yang seharusnya" di gambar.
3. **Penjelasan dilipat** ("Kenapa begitu?" / "Lihat rinciannya"), satu tombol utama.
4. **Warna:** hijau + satu aksen merah bata (hanya ikon ✕ dan kata statusnya). Tidak ada kotak
   berlatar merah muda/hijau/kuning. Kuning hanya berarti "pilihan tersimpan" saat menjawab.
5. Bila semua tepat, cukup "Jawabanmu tepat!" (+poin); daftar per pertanyaan tidak ditampilkan.

## Sebelum / sesudah

| Pasangan | Yang berubah |
| --- | --- |
| `*-latihan-hp-belum-tepat` | Gambar naik ke atas; kepala merah muda, kartu "Pilihanmu/Langkah yang tepat", "Kenapa?", kotak kuning "Intinya", tautan "Lihat adegan", dan baris Mr Roger diganti: Bu Isti + "Belum tepat." + 2 baris + lipatan + tombol |
| `*-latihan-hp-sebagian` | Empat baris berlatar hijau (termasuk centang hijau berkata "Terlewat") jadi dua baris: ✓ Sudah tepat, ! Masih terlewat |
| `*-latihan-desktop-belum-tepat` | Panel kanan tinggal kepala juri, 2 baris, lipatan, tombol, dan "Intinya" satu baris |
| `*-pertandingan-hp-briefing` | Gambar di atas; chip "Bersiap", heading "Kasusnya", kotak "Tugasmu", kartu "cara main" beranimasi, dan dua catatan diganti: Miss Raksa membawakan kasus + satu kalimat tugas |
| `*-pertandingan-hp-terkirim` | "Terkirim!" + jumlah pemain; ringkasan jawaban dilipat ("Lihat jawabanku") |
| `*-pertandingan-hp-pembahasan` | Tiga kartu rinci berlatar hijau diganti kepala juri + poin besar; rincian dilipat |

Hanya "sesudah": `sesudah-latihan-hp360-belum-tepat.png` (HP 360×740, semuanya muat satu layar),
`sesudah-latihan-hp-mendatar.png`, `sesudah-latihan-tablet.png`, `sesudah-latihan-hp-tepat.png`,
`sesudah-latihan-m10-mendatar-banyak-pertanyaan.png` (satu baris status per pertanyaan),
`sesudah-pemanasan-hp.png` (Raki sebagai juri pemanasan), dan
`sesudah-proyektor-juri-bu-isti.png` (Bu Isti membacakan "Yang dibawa pulang" di layar besar).

Catatan: kalimat Raki/Miss Raksa per misi (`rakiBriefing`) tidak lagi tampil di HP saat briefing
karena hanya mengulang tugas; **cerita kasus** tetap tampil karena memuat konteks jawaban
(mis. misi 2 "benturan di depan kiri"). Kalimat itu masih dipakai di layar proyektor.
