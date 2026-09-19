# Tangkapan layar adegan 2D (hasil aktual)

Diambil otomatis oleh `npm run test:e2e` pada 18 September 2026 dari build produksi, di
**Chrome headless dengan emulasi perangkat** (bukan HP fisik). Pertandingan sungguhan:
1 host, 4 pemain di proses browser terpisah, dan 1 proyektor.

| Berkas | Perangkat (emulasi) | Isi |
| --- | --- | --- |
| `01-hp-tutorial.png`, `02-hp-tutorial-dipilih.png` | HP 390x844 | Pemanasan: kartu tugas dengan Raki & bantuan "cara main" terbuka, pilihan tercatat |
| `m01-hp-briefing.png` | HP 390x844 | Briefing: gambar di atas (belum bisa disentuh), Miss Raksa membawakan kasus, satu kalimat "Tugasmu" |
| `m01-hp-terkirim.png` | HP 390x844 | "Terkirim!" + jumlah pemain; ringkasan jawaban dilipat |
| `m02-hp-aktif.png` | HP 390x844 | Kamera bukti: 3 foto bernomor di adegan & album |
| `m02-hp-jeda.png` | HP 390x844 | Dijeda panitia: tata letak tetap, adegan & pilihan terkunci, pemberitahuan di atas pilihan |
| `m02-hp-pembahasan.png`, `m04-hp-pembahasan.png`, `m10-hp-pembahasan.png` | HP 390x844 | Pembahasan: gambar bertanda ✓/✕/! di atas, Bu Isti (juri) membacakan hasil + poin; rincian dilipat |
| `m03`–`m10-hp-aktif.png` | HP 390x844 | Adegan tiap misi saat menjawab |
| `m02-hp360-ringan.png`, `m05-hp360-ringan.png` | HP 360x740, mode ringan | Tanpa engine: gambar sederhana + daftar pilihan HTML |
| `m04-hp-mendatar.png`, `m10-hp-mendatar.png` | HP 844x390 mendatar | Adegan kiri, kartu tugas & jawaban kanan, bar aksi ringkas |
| `m02-desktop-aktif.png` … `m10-desktop-pembahasan.png` | Desktop 1280x800 | Dua kolom |
| `proyektor-pembahasan.png`, `91-proyektor-podium.png` | 1366x768 | Layar besar: jawaban tepat ditandai di adegan; podium dengan ketiga tokoh |
| `latihan-m04-360.png`, `latihan-m04-360-hasil.png` | HP 360x740 | Mode latihan |

### Tokoh Raksa: Mr Roger, Miss Raksa, Bu Isti

Diambil dengan skrip terpisah (satu pemain + proyektor, build yang sama). Banner koneksi putus
diuji dengan mematikan server saat pemain sedang menjawab.

| Berkas | Perangkat (emulasi) | Isi |
| --- | --- | --- |
| `tokoh-awal-hp.png`, `tokoh-awal-desktop.png` | HP 390x844, desktop 1280x800 | Halaman awal: Mr Roger melambai di samping Raki |
| `tokoh-join-miss-raksa-hp.png` | HP 390x844 | Halaman gabung: Miss Raksa menyambut |
| `tokoh-lobby-hp.png` | HP 390x844 | Lobby pemain: sapaan Mr Roger |
| `tokoh-briefing-hp.png` | HP 390x844 | Briefing: Miss Raksa membawakan kasus di panel (tidak ada tokoh di adegan) |
| `tokoh-koneksi-putus-hp.png` | HP 390x844 | Koneksi putus saat menjawab: pesan dari Bu Isti |
| `tokoh-proyektor-lobby.png` | 1366x768 | Lobby proyektor: Bu Isti menjelaskan cara bergabung, Mr Roger menyambut |
| `tokoh-proyektor-briefing.png` | 1366x768 | Briefing: Miss Raksa di kolom kiri, adegan bersih di kanan |
| `tokoh-proyektor-papan.png` | 1366x768 | Papan peringkat: Bu Isti membawakan ringkasan ronde |
| `tokoh-proyektor-podium.png`, `tokoh-hasil-hp.png` | 1366x768, HP 390x844 | Podium: ketiga tokoh bersama; hasil HP: ucapan Mr Roger |

Bu Isti juga menjadi **juri** yang membacakan hasil tiap misi (lihat `m*-hp-pembahasan.png` dan `proyektor-pembahasan.png`).

### Momen dibuat ringan (gambar dulu, sedikit teks & warna)

Sebelum/sesudah briefing, terkirim, dan pembahasan: [`momen-ringan/`](momen-ringan/README.md).

### Perbaikan UI/UX layar misi

Pasangan sebelum/sesudah di 6 ukuran layar: [`perbaikan-ui/`](perbaikan-ui/README.md).

Catatan: adegan dirender dengan WebGL perangkat lunak (SwiftShader). Warna dan ketajaman di HP
sungguhan bisa sedikit berbeda.
