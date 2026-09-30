# Tangkapan layar: perbaikan review 26 September 2026 + mode cerita (v2)

**Semua tangkapan adalah emulasi Chrome (headless, emulasi viewport & sentuh), bukan HP fisik.**
Kinerja, rasa sentuhan, dan tampilan di perangkat sungguhan belum diuji.

| | SEBELUM (`sebelum-*.png`) | SESUDAH (`sesudah-*.png`, `cerita-*.png`, `checklist-*.png`) |
| --- | --- | --- |
| Sumber | Review live 26 Sep 2026 (catatan review lokal, tidak di repo), situs dev = build 99fb182 | Kode lokal 26 Sep 2026, build produksi (`npm run build`) yang dilayani server uji lokal `http://localhost:4230`; mode cerita = revisi v2 (`docs/rancangan-mode-cerita.md` bagian 11) |
| Diambil oleh | Skrip review (CDP) | `tools/uji-temuan-review.mjs` (`npm run test:review`), sekali jalan bersama pemeriksaannya |
| Skala | deviceScaleFactor 1 | Pasangan: deviceScaleFactor 1 (ukuran sama dengan sebelum). Mode cerita HP: deviceScaleFactor 2 (780x1688 px) |
| Profil | "Review" | "Weli" (`raksa:profil`), konteks browser baru per skenario (kunjungan pertama) |
| Gerak | bawaan review | animasi menyala (`prefers-reduced-motion: no-preference`); pemeriksaan juga lulus dengan `RAKSA_GERAK=kurang` |

Ambil ulang (server/Vite harus berjalan, lihat kepala skrip):

```
UI_BASE=http://localhost:4312 RAKSA_SHOTS=docs/tangkapan-cerita npm run test:review -- --cerita
```

Skrip menimpa berkas `sesudah-*`, `cerita-*`, dan `checklist-*`; berkas `sebelum-*` disalin tangan dari folder review.
Tangkapan desktop 1440 px lebar penuh; tangkapan review 1425 px karena batang gulir Chrome sungguhan ikut terhitung.

## Sebelum / sesudah per temuan

Angka = posisi y (px CSS) di viewport, diukur skrip yang sama yang mengambil tangkapan sesudah.

| Temuan | Viewport | Sebelum | Sesudah | Yang berubah |
| --- | --- | --- | --- | --- |
| A. Checklist misi 3 hilang di mode ringan | 1440x900, halaman penuh | ![](sebelum-mission3-light.png) | ![](sesudah-mission3-light.png) | Tombol HTML "Lihat checklist" di baris alat dan di kepala Folder laporan; bisa dicapai Tab, membuka dialog berisi 4 butir. Lulus juga di mode penuh dan saat chunk Phaser dicegat (engine gagal). |
| A. Cara main mode ringan | 1440x900, halaman penuh | ![](sebelum-mission3-light-help.png) | ![](sesudah-mission3-light-help.png) | "Pilih dari daftar / ketuk jawaban di daftar", tidak lagi "ketuk dokumen di gambar". |
| B. Fokus keluar dari dialog | 390x844 | ![](sebelum-modal-focus-behind.png) | ![](sesudah-modal-focus-behind.png) | Setelah Tab: sebelum = fokus di "Cara main" di belakang dialog; sesudah = fokus di wilayah isi dialog. Tab & Shift+Tab 10x tetap di dalam, `#root` inert, Escape mengembalikan fokus ke tombol Dokumen. |
| C. Onboarding HP panjang, bonus sudah jalan | 390x844, layar pertama | ![](sebelum-mission1-mobile-viewport.png) | ![](sesudah-mission1-mobile-viewport.png) | Kartu "Siap mulai" (y 489-541) tanpa gulir; bonus tetap 20 dtk selama 3,5 dtk menunggu (sebelum: 18 -> 16 dtk tanpa interaksi). Setelah mulai (`sesudah-mission1-mobile-mulai.png`): opsi pertama y 677-739, di atas bar aksi y 747 (sebelum: opsi 968, bar aksi 747, adegan 608). 360x740: opsi 579-635, bar aksi 643. |
| D. Hasil HP mendahulukan ilustrasi | 390x844, halaman penuh | ![](sebelum-mission1-wrong-mobile.png) | ![](sesudah-mission1-wrong-mobile.png) | Vonis y 156 (sebelum 539), "Coba lagi" y 597-655 (sebelum 807), adegan turun ke y 825. |
| E. Bintang membingungkan (hasil) | 390x844 | (sama dengan D) | (sama dengan D) | Jawaban 0%: 0 dari 3 bintang (sebelum 1), arti bintang + "percobaanmu tetap tercatat sebagai sudah dicoba". |
| E. Bintang di peta (progres lama) | 1440x900, halaman penuh | ![](sebelum-progress-persisted.png) | ![](sesudah-progress-persisted.png) | Progres format lama yang sama disuntik (misi 1 0% dengan `bintang:1`, misi 2 & 9 tepat): misi 1 kini 0 bintang + "Sudah dicoba", total 6/30 (sebelum 7/30), legenda arti bintang; data mentah lama dicadangkan di `raksa:solo:cadangan-v1`. |
| F. Halaman awal HP | 390x844 | ![](sebelum-home-mobile.png) | ![](sesudah-home-mobile.png) | Tiga pintu: Main cerita (utama, y 257-398), Latihan misi, Gabung acara; bingkai potret bulat yang sama. |
| F. Halaman awal desktop | 1440x900 | ![](sebelum-home-desktop.png) | ![](sesudah-home-desktop.png) | Tiga pintu terlihat di layar pertama; wordmark bersama. |
| F. Layar host | 1440x900, halaman penuh | ![](sebelum-host-desktop.png) | ![](sesudah-host-desktop.png) | Header wordmark bersama (sama dengan pemain & proyektor); tombol utama hijau rgb(33, 92, 64), sudut 13px sama dengan tombol pemain (sebelum kuning); font judul sama. |

Tangkapan SESUDAH tambahan (tidak ada padanan sebelum):

| Berkas | Viewport | Isi |
| --- | --- | --- |
| `sesudah-mission1-mobile-mulai.png` | 390x844 | Misi 1 sesaat setelah "Siap mulai": pertanyaan, adegan, opsi pertama utuh di atas bar aksi |
| `sesudah-briefing-acara-hp.png` | 390x844 | Multiplayer (room uji 1 pemain di backend 4230, paket acara a01): panel BRIEFING dengan cara main ringkas, tanpa tombol "Siap mulai"; durasi briefing & ronde tetap dari server |
| `sesudah-mission2-sebagian-mobile.png` | 390x844 | Misi 2 jawaban sebagian: vonis, "Kamu pilih", "Sudah tepat", "Masih terlewat", alasan singkat, lalu tombol, semua di layar pertama |
| `sesudah-dialog-panjang-mendatar.png` | 844x390 | Dialog Dokumen misi 10 di HP mendatar: isi panjang digulir panah, PageDown, dan geser jari |

## Tangkapan mode cerita v2 (episode AUTO-1 "Baret di Parkiran", jalur terbaik)

HP = 390x844 deviceScaleFactor 2 (sentuh); desktop = 1440x900 deviceScaleFactor 1. Tanpa cincin fokus sisa klik skrip
(ketukan jari sungguhan tidak menampilkannya), kecuali di tangkapan dialog.

| Momen | HP | Desktop | Isi |
| --- | --- | --- | --- |
| Percakapan | `cerita-percakapan-hp.png` | `cerita-percakapan-desktop.png` | Bagian 1/5, tujuan bab, panggung meja layanan, Bu Rina "Cemas", kotak dialog dengan potret & tombol Lanjut |
| Keputusan | `cerita-keputusan-hp.png` | `cerita-keputusan-desktop.png` | Pilihan pertama (K1): tiga ucapan sebagai tombol |
| Aktivitas bukti | `cerita-aktivitas-bukti-hp.png` | `cerita-aktivitas-bukti-desktop.png` | Parkiran kantor, mobil Bu Rina; dua foto sudah dipilih lewat ketukan adegan, album ringkas "2/3 foto" (tanpa slot kosong), "Pilih lewat daftar" di atas bar aksi |
| Umpan balik | `cerita-umpan-balik-hp.png` | `cerita-umpan-balik-desktop.png` | Aktivitas bukti tepat: vonis, satu kalimat Miss Raksa, tiga foto "Yang membantu" masing-masing dengan alasan singkat, "Lanjutkan cerita", "Kenapa begitu?" (tertutup), adegan bertanda ✓ |
| Aktivitas polis (dokumen) | `cerita-aktivitas-polis-hp.png` | `cerita-aktivitas-polis-desktop.png` | Dialog Dokumen berisi Kartu Polis Bu Rina (Comprehensive, simulasi), dibuka dari tombol Dokumen |
| Aktivitas polis (menjawab) | `cerita-aktivitas-polis-kartu-hp.png` | `cerita-aktivitas-polis-kartu-desktop.png` | Kartu polis yang bisa diperiksa di atas tiga pilihan; satu baris dibuka menampilkan arti awamnya |
| Akhir cerita | `cerita-akhir-hp.png` | `cerita-akhir-desktop.png` | Satu kartu (akhir baik "Didengar dan Jelas"): potret Bu Rina, judul hasil, satu kalimat sebab-akibat, pelajaran, **Selesai** & **Coba jalur lain**, "Lihat perjalananku", catatan simulasi; tanpa epilog ulang |
| Lihat perjalananku | `cerita-akhir-ringkasan-hp.png` | | Dialog tinjauan: Yang membantu / Yang perlu diperhatikan / Kenapa berakhir begini; sisi perasaan, langkah klaim, dan pemahaman terpisah; akhir yang ditemukan |
| Pemilih bagian | `cerita-akhir-pemilih-hp.png` | | Dialog "Coba jalur lain": lima bagian, kalimat akibat mengulang, "Ulang dari awal sebagai perjalanan baru" |
| Checklist mode ringan | `checklist-ringan-hp.png` | `checklist-ringan-desktop.png` | Misi 3 `?adegan=ringan` (tanpa kanvas): dialog checklist 4 butir dari tombol "Lihat checklist" |

## Catatan

- Emulasi Chrome, bukan HP fisik. Kanvas dirender WebGL perangkat lunak (SwiftShader).
- Sesudah = build produksi di server uji lokal (Chrome headless); kecepatan muat tetap bukan ukuran HP sungguhan.
- Pasangan sebelum/sesudah memakai profil & data yang berbeda (nama pemain, sisa detik bonus); yang dibandingkan adalah tata letak dan perilaku.
- Tangkapan cerita memakai teks Bahasa Indonesia; kalimat klaim di dalamnya ditinjau lewat `docs/cerita/TINJAUAN-PIC-CLAIM.md`.
