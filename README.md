# RAKSA GAME

**Raksa Claim: Misi Lindungi Kota**
_"10 misi. Ambil keputusan tepat. Jadilah pahlawan tercepat."_

Game web multiplayer untuk pengenalan produk PT Asuransi Raksa Pratikara pada acara kantor,
customer gathering, atau kegiatan perusahaan. Peserta bermain dari HP masing-masing, host
mengendalikan pertandingan dari laptop, dan perkembangan pertandingan ditampilkan di layar besar.

Produk yang dikenalkan: **AUTO** (kendaraan bermotor), **HVC** (alat berat),
**FIRE/PROPERTY** (kebakaran & harta benda), **CARGO** (pengangkutan barang).

> **Semua kasus di dalam game adalah simulasi edukasi.** Penanganan klaim yang sebenarnya
> mengikuti ketentuan polis dan hasil pemeriksaan Raksa. Pemberitahuan ini juga ditampilkan
> di tutorial dan mode latihan.

---

## 1. Kebutuhan sistem

| Kebutuhan | Versi |
| --- | --- |
| Node.js | 20.11+ (diuji pada 22.9.0) |
| npm | 9+ (diuji pada 11.5.2) |
| Browser peserta | Chrome/Safari/Edge modern di HP |
| Jaringan | Semua perangkat berada pada satu jaringan (Wi-Fi kantor / hotspot) |

Tidak butuh internet saat acara berlangsung: tidak ada font, CDN, atau layanan berbayar
eksternal. Adegan 2D digambar dari SVG buatan proyek sendiri dan dijalankan engine Phaser
yang ikut dibundel, musik latar adalah file MP3 yang dihasilkan sendiri, dan efek suara
disintesis dengan Web Audio API.

## 1a. Arsitektur

Tiga lapisan dengan tanggung jawab yang tegas:

| Lapisan | Menangani | Catatan |
| --- | --- | --- |
| **Phaser 4 (adegan 2D)** | Diorama tiap misi, petugas pemain, objek yang diketuk, animasi memotret / memasukkan ke folder / menempel stiker, tanda pembahasan | Dimuat terpisah (lazy) dan diunduh lebih awal sejak lobby. Bila gagal, gambar sederhana tampil dan pemain menjawab lewat HTML |
| **React + TypeScript** | Instruksi, dokumen kasus, daftar pilihan yang mudah diakses, baki bukti, timer, tombol kirim, status kirim, pembahasan, leaderboard, host, hasil | Semua teks & formulir tetap HTML supaya terbaca dan nyaman di HP |
| **Node.js + Socket.IO + SQLite** | Room, fase, deadline, validasi jawaban, skor, peringkat, penyimpanan hasil | **Sumber kebenaran.** Engine tidak pernah menilai atau menyimpan jawaban |

Aturan yang dijaga lintas lapisan:

- Kunci jawaban hanya ada di `server/src/answerKeys.ts` dan baru dikirim ke client pada fase `REVEAL`.
- **Draft jawaban hanya dimiliki React.** Ketukan di adegan dan tombol HTML memanggil fungsi yang
  sama (`client/src/game/draft.ts`), jadi keduanya selalu sinkron dan tunduk pada aturan yang sama.
- Engine hanya menggambar `StageView` terbaru; animasi dipicu oleh selisih status, bukan oleh ketukan.
- Ketukan dari instance/ronde/misi lama dibuang (token per instance + id misi + ronde).
- Umpan balik sebelum `REVEAL` netral (kuning/biru, tanpa benar-salah).
- Kesiapan adegan hanya informasi untuk host; tidak pernah menambah waktu menjawab siapa pun.

Kode Unity lama (`unity/`, `client/src/unity/`, `shared/unityBridge.ts`) **disimpan sebagai
referensi migrasi** dan tidak lagi dimuat oleh halaman mana pun.

## 2. Instalasi

```bash
git clone <repo>            # atau salin folder raksa-game
cd raksa-game
npm install                 # memasang dependensi server + client sekaligus (npm workspaces)
cp .env.example .env        # opsional, hanya bila ingin mengubah konfigurasi
```

Bila `better-sqlite3` gagal dipasang di komputer tanpa build tools, jalankan
`npm install better-sqlite3@11 --workspace @raksa/server` (versi 11 menyediakan binary siap
pakai untuk Node 20/22).

## 3. Menjalankan development

Satu perintah dari root menjalankan backend dan frontend sekaligus:

```bash
npm run dev
```

| Bagian | Alamat |
| --- | --- |
| Client (Vite) | `http://localhost:5173` |
| Server (API + Socket.IO) | `http://localhost:4000` |

Vite sudah mem-proxy `/api` dan `/socket.io` ke server, jadi peserta cukup membuka port 5173.

Perintah lain:

```bash
npm run dev:server     # hanya backend (tsx watch)
npm run dev:client     # hanya frontend (vite --host)
npm run typecheck      # pemeriksaan tipe server + client
npm test               # pengujian server (unit + smoke test multiplayer)
```

## 4. Build dan menjalankan hasil build

```bash
npm run build           # build client -> client/dist, compile server -> server/dist
npm start               # satu proses menyajikan game + API di port 4000
```

Setelah `npm run build`, server otomatis menyajikan hasil build client, sehingga seluruh
game diakses dari **satu port saja** (4000). Ini mode yang disarankan saat acara: lebih
sederhana untuk dibagikan ke HP peserta.

## 4a. Adegan 2D (Phaser)

Setiap misi punya diorama 2D interaktif yang digambar engine **Phaser 4.2.1** (MIT). Tidak ada
yang perlu dipasang atau di-build terpisah: `npm install` + `npm run build` sudah cukup.

| Hal | Cara kerjanya |
| --- | --- |
| Memuat | Engine berada di chunk terpisah (~380 KB gzip) dan diunduh lebih awal di lobby, tutorial, dan latihan. Berkas di `/assets` di-cache browser (`immutable`) |
| Gambar | SVG buatan proyek (`client/src/game/art`, `client/src/game/scenes`) dirasterisasi di HP sesuai kepadatan layar, jadi tetap tajam tanpa unduhan gambar |
| Sentuhan | Semua interaksi = ketuk. Geser jari di atas gambar tetap menggulung halaman. Ketukan ganda cepat diabaikan |
| Gagal dimuat | Gambar sederhana (SVG statis) tetap tampil dan daftar pilihan HTML terbuka otomatis. Pesan untuk pemain tidak memakai istilah teknis |
| Mode ringan manual | Tambahkan `?adegan=ringan` di alamat HP peserta (tersimpan di HP itu); `?adegan=penuh` untuk menyalakan lagi |
| Pembersihan | Satu instance engine per ronde; saat misi berganti, kanvas, listener, dan konteks WebGL dilepas |

Tangkapan layar hasil aktual (HP, HP mendatar, desktop, proyektor): [`docs/tangkapan-2d/`](docs/tangkapan-2d/README.md).

### Layar misi: tata letak per keadaan

Setiap tahap menjawab tiga pertanyaan pemain: *saya sedang apa, apa tindakan berikutnya, dan
apakah pilihan saya sudah tercatat*. Urutan diatur dengan CSS grid-area
(`client/src/game/stage.css`); elemen DOM tidak berpindah, jadi rotasi/resize atau berpindah ke
pembahasan tidak memuat ulang adegan dan tidak menghilangkan pilihan.

| Keadaan | HP tegak | Desktop & HP mendatar |
| --- | --- | --- |
| Menjawab | Kartu tugas (pertanyaan + petunjuk satu kalimat + tombol Cerita/Dokumen/Cara main) → adegan → "Pilihanmu: … · Tersimpan" + daftar pilihan → bar aksi lengket | Adegan kiri (lengket), kartu tugas & jawaban kanan. Desktop: tombol kirim ikut alur (tidak menutupi pilihan). HP mendatar: header & bar aksi ringkas, cerita terlipat |
| Menjawab misi hitung (6, 9) | Kartu tugas → jawaban → adegan (ruang membaca dulu) | Panel jawaban lebih lebar |
| Jeda | Tata letak menjawab tetap, adegan & pilihan terkunci, pemberitahuan di atas pilihan | sama |
| Briefing / terkirim / waktu habis | Status dulu (Miss Raksa + kasus / konfirmasi terkirim + ringkasan terkunci), adegan sesudahnya | Adegan diperkecil |
| Pembahasan | Hasil dulu: status ("Jawabanmu tepat!" / "Belum tepat. Yuk, lihat langkah yang benar." / "Sebagian sudah tepat.") → Pilihanmu → Langkah yang tepat / Yang masih terlewat → Kenapa? → Intinya → satu tombol utama. "Lihat adegan dengan tandanya" menggulir ke adegan | Hasil jadi kolom utama, adegan diperkecil |

Aturan yang dijaga:

- **Tidak ada karakter, balon, atau dekorasi di atas adegan.** Pemandu (Miss Raksa, Raki di
  pemanasan, Mr Roger di bawah hasil) punya slot potret kecil di panel. Keterangan objek
  "info" dan peringatan (baki penuh, pilih bagian dulu) tampil di panel HTML, bukan balon.
- **Satu penanda per objek**, di dalam label: ○ bisa diketuk, ✓/angka sudah dipilih, ikon lembar
  = dokumen. Sebelum pembahasan penanda netral (kuning/putih). Saat pembahasan: ✓ tepat,
  ✕ kurang tepat, ! terlewat (ikon + warna), dan penjelasannya dalam kata di panel.
- **Status per langkah** ("Pilihanmu", "Langkah yang tepat", "Terlewat") dihitung di
  `client/src/game/hasil.ts` dengan `gradeStep` yang sama dengan server; `hasil.test.ts`
  membuktikan hasilnya sama untuk semua misi (benar, salah, sebagian, kosong).
- Fokus pindah ke judul tahap baru (terkirim, pembahasan, pertanyaan berikutnya), kecuali saat
  jeda/lanjut dari jeda supaya pemain tidak dipindah tempat. Gerak dikurangi bila
  `prefers-reduced-motion`.
- Tumpang-tindih label/tanda di semua adegan diperiksa otomatis: `window.__raksaStage.kotak()`
  memberi kotak label & objek (koordinat dunia) untuk skrip uji.

Cara menambah/mengubah adegan: lihat komentar di `client/src/game/types.ts` dan contoh
`client/src/game/scenes/m02-bengkel.ts`. `npm test` menjalankan `scenes.test.ts` yang memastikan
setiap objek adegan merujuk id misi/opsi/dokumen yang benar-benar ada dan kode adegan tidak
menyentuh kunci jawaban. Asal & lisensi aset: `client/src/game/ASET.md`.

### Tokoh Raksa: Mr Roger, Miss Raksa, Bu Isti

Tiga tokoh pixel art (sumber di `character/`) menyapa dan memandu; petugas pilihan pemain tetap
satu-satunya tokoh di adegan misi. **Tokoh tidak pernah digambar di atas adegan** (tidak menutupi
objek, label, atau tanda pembahasan): di layar misi mereka tampil sebagai potret kecil di panel.
Tiap tokoh diberi peran sesuai perannya di Raksa:

| Tokoh | Peran di game | Tempat |
| --- | --- | --- |
| **Mr Roger**, CEO Asuransi Raksa | Pembuka & penutup | Halaman awal (papan nama), lobby pemain & proyektor (sapaan), **potret di bawah hasil pembahasan** tiap misi, hasil pemain (ucapan selamat) |
| **Miss Raksa**, ikon Raksa CS | "Pembawa kasus": laporan nasabah masuk lewat CS | Halaman gabung (sapaan), **kalimat briefing tiap misi** di HP & proyektor, potret di kartu tugas saat menjawab (menggantikan Raki; pemanasan tetap Raki karena teksnya "Aku Raki") |
| **Bu Isti**, Direktur IT | "Urusan sistem" | Lobby proyektor (cara bergabung lewat QR), papan peringkat proyektor (ringkasan data ronde), **pesan saat koneksi HP terputus** (lobby & layar misi) |
| Ketiganya | Penutup | Podium proyektor: berdiri bersama, Mr Roger memberi ucapan selamat |

Pengaturan di `shared/brand.ts` -> `TOKOH` (`ceo`, `missRaksa`, `isti`):

- `aktif: false` menyembunyikan satu tokoh di semua tempat (Raki / petunjuk biasa kembali dipakai).
- `nama`, `jabatan`, `tampilJabatan`: teks papan nama. Mr Roger tampil "Mr Roger" saja
  (`tampilJabatan: false`); jabatan tetap dibacakan pembaca layar. `nama: null` = hanya jabatan.
- Potret bulat di panel memakai jendela kepala-bahu per tokoh (`JENDELA_POTRET` di
  `client/src/game/KarakterTokoh.tsx`); sesuaikan bila gambar sumber diganti.
- `sapaan`: semua kalimat balon. Kalimat pembahasan Mr Roger dipilih bergiliran per
  nomor misi. Kalimat briefing Miss Raksa memakai teks briefing tiap misi (`rakiBriefing` di
  `shared/missions.ts`, tidak diubah). Semua kalimat ini **usulan** dan perlu disetujui.

Sprite yang dipakai game dibuat dari gambar sumber (dipotong rapat & diperkecil ke WebP + PNG
cadangan). Setelah mengganti gambar di `character/`, jalankan:

```
npm install --no-save puppeteer-core
node tools/siapkan-karakter.mjs            # semua tokoh; atau: ... isti missRaksa
```

Hasilnya di `client/public/karakter/`: `ceo-besar.*` (96 KB WebP), `miss-raksa-besar.*` (64 KB),
`isti-besar.*` (72 KB), dan ukuran frame di `client/src/game/art/karakter-sprite.json`. Potret
bulat di panel diambil dari sprite yang sama (diskalakan, tidak diregangkan). Nama berkas sumber
tiap tokoh diatur di bagian atas `tools/siapkan-karakter.mjs`. Ketiga sprite ikut diunduh lebih
awal di lobby, sehingga pesan Bu Isti tetap bergambar saat koneksi sudah putus. Bila gambar gagal
dimuat, permainan tetap berjalan tanpa tokoh itu.

### Unity 3D (referensi lama)

> **Tidak dipakai lagi oleh client.** Adegan 3D sempat tampil sebagai kotak kosong di GPU
> nyata, sehingga diganti adegan 2D di atas. Kode & dokumentasinya disimpan sebagai referensi
> selama migrasi. Endpoint server `/api/unity/status` dan `/unity/*` masih ada tetapi tidak
> dipanggil halaman mana pun.

```bash
npm run gen:unity      # sinkronkan data misi -> proyek Unity (wajib setelah mengubah misi)
npm run unity:build    # generate scene lalu build Web (butuh Unity Editor + modul Web)
```

Yang dibutuhkan untuk membuat build:

```powershell
winget install Unity.UnityHub
unity install lts -m webgl     # Unity 6000.3.x LTS + Web Build Support
```

Lisensi Unity (Personal gratis) harus disetujui sendiri lewat Unity Hub.

Memeriksa status build kapan saja:

```bash
curl http://localhost:4000/api/unity/status
```

Balasannya menyebutkan `available`, ukuran unduhan, dan kompresi. Halaman host juga
menampilkannya, jadi panitia tahu apakah peserta akan memakai adegan 3D atau mode ringan.

Panduan lengkap (versi Unity, kontrak bridge, performa, batasan): [`unity/README.md`](unity/README.md).

## 4b. Musik latar

Tiga trek instrumental dihasilkan secara prosedural (marimba/kalimba, petikan ukulele,
bass lembut, shaker) lalu disimpan sebagai aset lokal:

| Trek | Dipakai saat |
| --- | --- |
| `client/public/audio/lobby.mp3` | Lobby & tutorial, santai |
| `client/public/audio/gameplay.mp3` | Misi berjalan, sedikit lebih aktif |
| `client/public/audio/podium.mp3` | Jingle podium, pendek |

```bash
npm run gen:music      # buat ulang ketiga trek
```

Sumber, pembuat, dan lisensinya dicatat di
[`client/public/audio/CREDITS.md`](client/public/audio/CREDITS.md) — termasuk cara
menggantinya dengan musik lain yang berlisensi.

Perilaku audio saat acara:

- Backsound utama diputar dari **layar host/proyektor**; hanya satu layar yang boleh
  menjadi pemilik musik.
- Di HP peserta musik **nonaktif secara default**; efek suara opsional.
- Audio baru mulai setelah interaksi pengguna (mengikuti kebijakan autoplay browser).
- Saat tab berpindah ke background, musik diredam/dihentikan dan tidak menumpuk.
- Tombol suara tersedia di setiap layar; preferensi mute & volume tersimpan.

## 5. Membuka game dari HP pada jaringan kantor

1. Pastikan laptop panitia dan HP peserta berada pada jaringan yang sama.
2. Cari alamat IP laptop:
   - Windows: `ipconfig` -> lihat "IPv4 Address" (contoh `192.168.1.10`)
   - macOS/Linux: `ifconfig` atau `ip addr`
3. Server mencetak alamat jaringan saat dijalankan, contoh:

   ```
   RAKSA GAME - server aktif
   Lokal    : http://localhost:4000
   Jaringan : http://192.168.1.10:4000
   Host     : http://192.168.1.10:4000/host
   Proyektor: http://192.168.1.10:4000/projector
   ```

4. Peserta memindai QR pada layar host/proyektor, atau membuka alamat jaringan itu lalu
   menekan **Gabung Permainan** dan memasukkan kode room.
5. Bila HP tidak bisa membuka alamat tersebut, biasanya penyebabnya:
   - Firewall Windows memblokir Node.js -> izinkan pada jaringan privat.
   - Laptop tersambung VPN -> matikan VPN atau isi `PUBLIC_BASE_URL` (lihat bagian berikut).
   - Jaringan kantor memisahkan klien (client isolation) -> gunakan hotspot HP panitia.

## 5a. Menguji dari smartphone

1. Jalankan `npm run build` lalu `npm start` (satu port, paling sederhana untuk acara).
2. Catat alamat jaringan yang dicetak server, mis. `http://192.168.1.10:4000`.
3. Pastikan HP berada di jaringan yang sama, lalu buka alamat itu atau pindai QR di layar host.
4. Periksa hal-hal berikut di HP:

| Yang diperiksa | Cara |
| --- | --- |
| Alur gabung | Scan QR -> isi nama -> pilih karakter -> lobby |
| Portrait & landscape | Putar HP saat sedang menjawab; kontrol harus tetap terjangkau |
| Keyboard | Saat mengisi nama, tombol utama tidak boleh tertutup keyboard |
| Safe area / notch | Tombol bawah tidak boleh tertimpa area gesture |
| Adegan 3D | Ketuk objek; penanda harus cukup besar dan memberi respons |
| Scroll | Sentuhan di luar canvas harus tetap bisa menggulung halaman |
| Tab pindah | Pindah ke aplikasi lain lalu kembali; timer mengikuti server, bukan mulai ulang |
| Koneksi | Matikan Wi-Fi beberapa detik lalu nyalakan; skor harus tetap |
| Audio | Efek suara hanya berbunyi setelah ketukan pertama; mute tersimpan |
| Mode ringan | Bila Unity belum di-build, adegan SVG tampil tanpa pesan error menakutkan |

Bila HP tidak bisa membuka alamat: periksa firewall Windows (izinkan Node.js pada jaringan
privat), matikan VPN, atau isi `PUBLIC_BASE_URL`. Jaringan kantor dengan *client isolation*
perlu diganti hotspot HP panitia.

## 6. Konfigurasi alamat QR

QR peserta memakai `PUBLIC_BASE_URL` bila diisi, kalau tidak server mendeteksi IP LAN sendiri.
**Server tidak pernah memakai `localhost` untuk QR kecuali tidak ada IP LAN yang terdeteksi.**

Isi `.env` bila deteksi otomatis salah (misal laptop punya banyak network adapter):

```ini
# mode produksi (npm start, satu port)
PUBLIC_BASE_URL=http://192.168.1.10:4000

# mode development (npm run dev, client di Vite)
PUBLIC_BASE_URL=http://192.168.1.10:5173
```

Alamat yang dipakai QR selalu ditampilkan sebagai teks di bawah QR pada layar host dan
proyektor, jadi panitia bisa memeriksanya sebelum acara dimulai.

Variabel lain: `PORT`, `HOST`, `CLIENT_PORT`, `DB_FILE`, `MAX_PLAYERS`, `VITE_SERVER_URL`
(lihat `.env.example`).

## 7. Membuat room dan menjalankan acara

### Halaman

| Peran | Alamat |
| --- | --- |
| Pemain | `/` -> `/join` -> `/lobby` -> `/tutorial` -> `/main` -> `/hasil` |
| Host (panitia) | `/host` |
| Layar proyektor / penonton | `/projector` (atau `/projector?room=KODE`) |
| Mode latihan (tanpa room) | `/latihan` |

### Urutan menjalankan acara

1. Panitia membuka `/host`, mengisi nama acara, menekan **Buat Room**.
   Server memberi **kode room 4 karakter** dan **token host** (token disimpan di browser
   panitia; token ini berbeda dari kode room dan tidak boleh dibagikan ke peserta).
2. Buka `/projector` di layar besar lewat tombol **Buka layar proyektor**.
3. Peserta memindai QR, mengisi nama panggilan (maks 16 karakter), memilih karakter,
   lalu masuk lobby. Peserta baru hanya boleh masuk selama fase lobby.
4. Host menekan **Mulai Tutorial** agar peserta mencoba cara mengetuk dan mengirim jawaban.
5. Host menekan **Mulai Pertandingan**. Setiap ronde berjalan:
   `BRIEFING` (8-12 detik, input terkunci) -> `ACTIVE` (waktu menjawab) ->
   `REVEAL` (pembahasan) -> `LEADERBOARD` (peringkat) -> ronde berikutnya.
6. Host dapat **Jeda/Lanjutkan** kapan saja; sisa waktu tersimpan dan durasi jeda tidak
   dihitung sebagai waktu menjawab peserta.
7. Saklar **Lanjut otomatis** menentukan apakah perpindahan ronde otomatis atau manual.
8. Setelah misi ke-10, pertandingan `FINISHED` dan podium muncul. Bila ada peringkat seri
   di tiga besar, host dapat menjalankan **Ronde Penentuan** satu kali.
9. Host menekan **Ekspor CSV** untuk mengunduh hasil.

Target durasi satu pertandingan: sekitar 12-15 menit
(total waktu menjawab 7 menit 15 detik + briefing/pembahasan/peringkat).

### Aturan skor

```
basePoints = round(1000 x accuracy)
speedBonus = round(300 x accuracy x max(0, 1 - elapsedSeconds / durationSeconds))
roundScore = basePoints + speedBonus
```

- `accuracy` 0..1, dihitung server dari rubric per langkah (langkah bisa berbobot berbeda).
- Pada multi-select: `accuracy = clamp((benar - salah) / jumlahDiharapkan, 0, 1)` sehingga
  **memilih semua opsi tidak menguntungkan**.
- `elapsedSeconds` memakai waktu server, durasi jeda dikeluarkan.
- Satu jawaban final per pemain per ronde; pengiriman ulang karena jaringan tidak
  menggandakan skor; jawaban setelah batas waktu ditolak; tidak menjawab = 0 poin.
- Urutan peringkat: total poin -> total poin ketepatan -> total waktu menjawab terendah
  (ronde tanpa jawaban dihitung memakai durasi penuh). Bila masih identik, seri ditandai
  dan host dapat menjalankan ronde penentuan.

### Audio pada acara

Backsound utama diputar dari layar host/proyektor (`preferMusicOn()` otomatis di halaman itu).
Di HP peserta musik **nonaktif secara default**; efek suara bersifat opsional dan bisa
dimatikan lewat tombol suara. Audio baru mulai setelah interaksi pengguna pertama
(mengikuti aturan browser).

## 8. Mengganti logo, warna, hadiah, dan konten

Semua konfigurasi terpusat di dua file.

| Yang ingin diubah | Tempatnya |
| --- | --- |
| Nama game, tema, tagline, nama pendamping | `shared/brand.ts` -> `BRAND` |
| Warna | `shared/brand.ts` -> `BRAND.colors` **dan** token `:root` di `client/src/theme.css` |
| Logo | taruh file di `client/public/logo/`, lalu isi `BRAND.logoPath` (mis. `/logo/logo-raksa.svg`) |
| Nama acara default | `shared/brand.ts` -> `DEFAULT_EVENT_NAME` |
| Label hadiah default | `shared/brand.ts` -> `DEFAULT_PRIZES` (host juga bisa mengubah per acara di `/host`) |
| Durasi briefing / pembahasan / peringkat | `shared/brand.ts` -> `PHASE_DURATIONS` |
| Waktu menjawab & briefing per misi | `shared/missions.ts` -> `durationSeconds`, `briefingSeconds` |
| Cerita, instruksi, opsi, kartu polis, tabel dokumen | `shared/missions.ts` |
| Kunci jawaban, bobot rubric, penjelasan | `server/src/answerKeys.ts` (**hanya di server**) |
| Pilihan karakter (warna, aksesori) | `shared/brand.ts` -> `UNIFORM_COLORS`, `SKIN_TONES`, `HAIR_COLORS`, `ACCESSORIES` |
| Pemberitahuan simulasi | `shared/brand.ts` -> `DISCLAIMER` |
| Tokoh Mr Roger, Miss Raksa, Bu Isti: tampil/tidak, nama, kalimat sapaan | `shared/brand.ts` -> `TOKOH` (lihat bagian 4a) |

Bila menambah/mengubah langkah misi, `server/src/answerKeys.ts` harus ikut diperbarui.
Server memeriksa konsistensinya saat start (`assertKeysComplete()`) dan menolak berjalan bila
ada langkah tanpa kunci atau jenis kunci yang tidak cocok. Jalankan `npm test` setelah
mengubah konten misi.

**Pemisahan data**: `shared/missions.ts` hanya berisi konten yang boleh dilihat client.
Kunci jawaban tidak pernah dikirim ke client sebelum fase `REVEAL` - `GET /api/missions`
juga tidak memuat kunci jawaban (ada pengujian yang memastikan ini).

## 9. Menemukan data pertandingan

Hasil pertandingan disimpan ke SQLite di `data/raksa-game.db` (ubah lewat `DB_FILE`).
Penyimpanan terjadi otomatis setiap kali papan peringkat diperbarui dan saat pertandingan selesai.

Tabel:

| Tabel | Isi |
| --- | --- |
| `matches` | kode room, nama acara, waktu mulai/selesai, jumlah peserta, label hadiah |
| `match_players` | peringkat, total poin, total ketepatan, total waktu, lencana per pemain |
| `match_rounds` | hasil tiap ronde per pemain + jawaban yang dikirim (JSON) |

Cara mengambil data:

```bash
# daftar pertandingan tersimpan
curl http://localhost:4000/api/matches

# hasil satu room (butuh token host)
curl "http://localhost:4000/api/room/ABCD/results.json?hostToken=<TOKEN>"

# CSV (tombol Ekspor CSV di halaman host memakai URL yang sama)
curl -o hasil.csv "http://localhost:4000/api/room/ABCD/results.csv?hostToken=<TOKEN>"

# langsung dari database
sqlite3 data/raksa-game.db "SELECT code, event_name, player_count FROM matches;"
```

CSV memakai pemisah koma, desimal titik, dan diawali BOM UTF-8 agar huruf tampil benar di
Excel. Kolomnya: identitas room, peringkat, nama, total poin/ketepatan/waktu, lencana,
hadiah, lalu poin/ketepatan/detik/terjawab untuk tiap misi. Di bawah tabel utama ada
baris keterangan misi yang diawali `#`.

## 10. Struktur proyek

```
raksa-game/
├── shared/                  konten & kontrak yang dipakai bersama (TANPA kunci jawaban)
│   ├── types.ts             tipe data: fase, state room, definisi langkah misi
│   ├── unityBridge.ts       kontrak pesan JavaScript <-> Unity + validasinya
│   ├── brand.ts             konfigurasi terpusat: nama, warna, logo, hadiah, durasi
│   ├── missions.ts          konten 10 misi + tutorial + ronde penentuan
│   └── scoring.ts           rumus skor, rubric, peringkat, lencana (pure & teruji)
├── server/src/
│   ├── index.ts             Express + Socket.IO + REST + penyajian hasil build
│   ├── rooms.ts             sumber kebenaran: room, fase, deadline, jawaban, skor
│   ├── answerKeys.ts        KUNCI JAWABAN + rubric (server only)
│   ├── db.ts                penyimpanan SQLite
│   ├── csv.ts               ekspor hasil
│   ├── unityServe.ts        penyajian build Unity (MIME/Content-Encoding) + status
│   ├── config.ts            env + deteksi IP LAN untuk QR
│   └── *.test.ts            unit test + smoke test multiplayer
├── character/               gambar sumber tokoh Mr Roger, Miss Raksa, Bu Isti (pixel art 4 frame)
├── tools/
│   ├── siapkan-karakter.mjs character/ -> sprite CEO WebP/PNG di client/public/karakter
│   ├── gen-unity-data.ts    shared/missions.ts -> data & ID untuk proyek Unity
│   └── make-music.mjs       menghasilkan musik latar (MP3) secara prosedural
├── unity/                   proyek Unity 6 (lihat unity/README.md)
│   ├── Assets/Scripts/      bridge + runtime diorama
│   ├── Assets/Editor/       generator scene + build Web
│   └── build.ps1 / build.sh build CLI
└── client/src/
    ├── game/                ADEGAN 2D (Phaser) + layar misi
    │   ├── MissionPlay.tsx  satu layar misi: kartu tugas + adegan + jawaban HTML + bar aksi + hasil
    │   ├── GameStage.tsx    memasang/membersihkan engine, gambar sederhana bila gagal
    │   ├── draft.ts         aturan draft jawaban (dipakai adegan & HTML) - murni & teruji
    │   ├── hasil.ts         status pembahasan per langkah (aturan = penilaian server) - teruji
    │   ├── engine/          Phaser: scene generik, rasterisasi SVG, siklus hidup instance
    │   ├── art/             kit gambar, karakter, kendaraan, properti (SVG sebagai kode)
    │   ├── scenes/          tata letak & gambar tiap misi (+ tutorial, penentuan)
    │   ├── *.test.ts        tes draft & penjaga anti-melenceng adegan
    │   ├── KarakterTokoh.tsx, tokoh.ts/.css  tokoh Raksa di halaman & pemuat sprite
    │   └── ASET.md          asal & lisensi aset
    ├── unity/               (referensi lama) loader, bridge, UnityStage + tes bridge
    ├── public/audio/        musik latar + CREDITS.md
    ├── state/store.ts       cache state dari server + aksi (server tetap sumber kebenaran)
    ├── net/socket.ts        transport Socket.IO
    ├── audio/audio.ts       satu pengelola audio: musik MP3 + efek Web Audio
    ├── theme.css            design token & komponen dasar
    ├── ui/kit.tsx           komponen UI bersama (timer, QR, leaderboard, modal, ...)
    ├── art/                 ilustrasi SVG: ikon, avatar, Raki, 10 adegan, peta kota
    ├── interactions/        renderer tiap jenis mini game
    ├── components/          pemilih karakter, panggung misi
    └── pages/               Landing, Join, Lobby, Tutorial, Play, Result, Practice,
                             Host, Projector
```

## 11. Batasan yang masih ada

### Adegan 2D — kondisi sebenarnya (18 September 2026)

**Sudah jalan & teruji di browser (emulasi):** 10 misi + tutorial + ronde penentuan punya
adegan 2D interaktif; semua jalur jawaban juga bisa diselesaikan lewat daftar HTML; mode
ringan tanpa engine lolos satu pertandingan penuh (lihat bagian 12).

**Belum / keterbatasan:**

- **Belum diuji di HP fisik.** Semua angka berasal dari Chrome headless dengan WebGL
  perangkat lunak (SwiftShader) dan emulasi viewport/sentuh. Kelancaran di Android kelas
  bawah, Safari iOS, rotasi sungguhan, dan keyboard HP harus dicek langsung sebelum acara.
- **Ilustrasi masih gaya vektor buatan kode**, bukan karya ilustrator. Tidak ada aset
  pihak ketiga, tetapi belum layak disebut aset final (lihat `client/src/game/ASET.md`).
- Setelah memilih objek, petugas pemain berjalan sekitar 1 detik di jalurnya di tepi bawah lalu
  kembali; label & tanda selalu digambar di atasnya.
- Keterangan singkat ("Difoto", "Dipilih") muncul ±1 detik menggantikan label objek itu.
- Label di adegan tetap singkatan (mis. "Foto & lapor"); teks lengkap ada di daftar HTML.
  Di HP 360 px teks label sekitar 12 px: terbaca di emulasi, tetapi perlu dicek di HP fisik.
- Di misi 2, label "Penyok" dan "Kucing" berada di atas badan mobil karena keduanya memang
  bagian dari mobil itu (objek bersarang); label tidak saling bertumpuk.
- Bar aksi di HP lengket di bawah layar dan menutupi ±100 px sampai halaman digulir; di akhir
  halaman ia berada di bawah pilihan terakhir (diuji e2e). Setelah "Lanjut", halaman menggulir
  halus ±0,4 detik ke pertanyaan baru.
- Pengacakan urutan tampil pilihan bersifat tetap per misi (sama untuk semua pemain),
  bukan acak per pemain.
- Engine Phaser 4 memakai WebGL; renderer Canvas masih ada sebagai cadangan tetapi
  berstatus *deprecated* di Phaser 4. Bila keduanya gagal, gambar sederhana + daftar HTML dipakai.

### Materi yang perlu ditinjau PIC Claim

Tidak ada kunci jawaban atau fakta klaim yang diubah. Hal berikut ditemukan saat membuat
adegan dan **perlu keputusan PIC Claim** (belum diubah):

| Misi | Temuan |
| --- | --- |
| 1, 6, 7, 11, tutorial | Di `shared/missions.ts`, jawaban benar hampir selalu **opsi pertama**. Tampilan kini diacak tetap per misi, tetapi urutan datanya sebaiknya dibenahi. |
| 4 | Hanya 4 opsi benar yang punya keterangan tambahan (`desc`); pengecoh tidak. Di daftar HTML ini bisa menjadi petunjuk. Keterangan 'rusak' menyebut undercarriage, padahal adegan memisahkan roda rantai sebagai 'Posisi unit'. |
| 5, 7, 10 | Kartu polis menampilkan chip **"sesuai" (hijau) / "perhatikan" (merah)** dari `flag` data. Chip ini menunjuk baris penentu jawaban. Contoh: Polis B misi 7 'Perluasan banjir: Tidak tercantum' diberi 'perhatikan', dan 'Tanggal kejadian' bernilai sama di kedua polis tetapi flag-nya berbeda. |
| 5, 8 (HTML) | Ikon kategori dari data (cek/silang) kini tampil abu-abu sebelum pembahasan; pertimbangkan ikon yang tidak berkonotasi benar/salah. |
| 6 | Adegan menomori peti 1–8 (materi hanya menyebut #4 dan #7). Label aksi disingkat satu kata: Catat / Bayar / Tolak / Terima. |
| 3, 8, 11 | Label singkat di adegan: 'Estimasi rugi', 'Kondisi lama', 'Plat & kronologi'. Mohon konfirmasi. Teks lengkap tetap di daftar HTML. |
| 10 | Teks learning/briefing menyebut 'periode', tetapi tahap 2 tidak punya kategori tentang periode. |

**Salinan UI yang diubah (bukan materi klaim):** instruksi misi 2 "Potret tiga bukti yang
relevan dari enam pilihan di bengkel." (sebelumnya "...dari enam kartu bergambar"), instruksi misi 3 tanpa kata "kartu",
dan teks tutorial yang menyebut "benda di gambar" alih-alih "kartu".

### Unity 3D (referensi lama)

Build Unity 6 pernah berhasil (4,8 MB) tetapi diorama tampil sebagai kotak kosong di GPU
nyata, sehingga diganti adegan 2D. Semua catatan teknisnya ada di
[`unity/README.md`](unity/README.md); kodenya disimpan sebagai referensi selama migrasi.


### Aset brand

- Logo resmi Raksa **belum disertakan dan belum diverifikasi**. Sementara ini dipakai judul
  tipografis "RAKSA GAME"; tempat penggantinya sudah disiapkan (`BRAND.logoPath`).
- Palet warna adalah **usulan desain game**, bukan kode warna resmi perusahaan. Situs resmi
  (raksaonline.com) tidak diverifikasi dari lingkungan ini, jadi warna, tipografi, dan gaya
  ilustrasi perlu dicocokkan dengan brand guideline sebelum dipakai untuk acara resmi.
- Nama & desain maskot "Raki" adalah usulan karakter game.
- Mr Roger dan Bu Isti menggambarkan **orang sungguhan**; Miss Raksa adalah ikon perusahaan.
  Pemakaian wajah, nama, dan kalimat sapaan di `TOKOH.*.sapaan` perlu **persetujuan yang
  bersangkutan / Corporate Communication** sebelum acara. Pembuat & lisensi gambar sumber
  di `character/` belum tercatat. Gayanya pixel art, sengaja berbeda dari ilustrasi vektor lain.
- Potret tokoh adalah potongan kepala-bahu dari sprite pixel art (dikalibrasi per tokoh); di
  ukuran 40–48 px detailnya kecil. Kalimat sapaan Mr Roger di bawah hasil (`TOKOH.ceo.sapaan.pembahasan`) masih usulan.

### Konten

- Seluruh kasus, kartu polis, angka, dan ambang batas adalah **simulasi edukasi** untuk
  latihan pengambilan keputusan, bukan ketentuan polis. Perlu ditinjau tim teknik/klaim
  sebelum dipakai sebagai materi resmi.

### Audio

- Musik dihasilkan prosedural, bukan komposisi manusia. Karakternya sudah diperiksa
  (durasi, level, variasi, bernada) tetapi **belum dinilai oleh telinga manusia** untuk
  acara sebenarnya.
- Sambungan loop `gameplay.mp3` turun sekitar 9 dB di ekornya (-17,8 ke -27 dBFS), jadi
  loop bisa terasa sedikit "mengempis". `lobby.mp3` lebih rapat (-18,7 ke -22,6 dBFS).

### Teknis

- Kapasitas dirancang untuk sekitar 100 peserta per room (`MAX_PLAYERS` default 150),
  tetapi **pengujian beban belum dijalankan sama sekali**. Skripnya tersedia
  (`npm run loadtest -- --players 100`) dan belum pernah dieksekusi.
- State pertandingan ada di memori proses server; hasil dipersistensi ke SQLite, tetapi bila
  proses server di-restart di tengah pertandingan, room aktif hilang dan peserta harus
  bergabung ulang. Tidak ada mode multi-instance/cluster.
- Tidak ada autentikasi panitia selain token host per room (cukup untuk acara internal,
  tidak untuk internet publik). Deployment publik perlu HTTPS.
- Peserta yang datang setelah pertandingan dimulai hanya bisa menjadi penonton
  (`/projector?room=KODE`).
- Ronde penentuan hanya bisa dijalankan satu kali per pertandingan.
- Drag-and-drop tidak dipakai; semua interaksi memakai tap (disengaja, agar nyaman di HP).
- Di halaman pemain, kontrol di bawah 44 px tinggal tautan logo (33 px) dan "Untuk panitia" di
  landing (40 px). Di halaman host: tombol "Simpan" & suara (38 px), slider volume (16 px),
  checkbox (22 px). Semua kontrol misi (pilihan, Lanjut, Kirim laporan, Batal) >= 44 px.

## 12. Hasil pengujian

Semua angka di bawah berasal dari perintah yang **benar-benar dijalankan** pada Windows 11 +
Node 22 + Chrome headless (WebGL perangkat lunak / SwiftShader), 18 September 2026.
**Ini emulasi browser, bukan HP fisik.**

```bash
npm run typecheck      # server + client: 0 error
npm run build          # client + server: sukses (engine Phaser = chunk terpisah 382 KB gzip)
npm test               # 47 tes server + 42 tes client = 89 lulus, 0 gagal
npm run test:e2e       # 1 pertandingan penuh 10 misi, 4 pemain + proyektor: 0 kegagalan, 0 error console
```

Setelah perbaikan UI/UX layar misi (18 September 2026), keempat perintah di atas dijalankan
ulang: 89/89 tes, e2e 0 kegagalan (termasuk uji baru di bawah), 0 error console/HTTP, dan
pemeriksa tumpang-tindih label/tanda di misi 1–10 (bermain & pembahasan) bersih. Tangkapan
sebelum/sesudah di 360×740, 390×844, 768×1024, 844×390, 1280×800, dan 1440×900:
[`docs/tangkapan-2d/perbaikan-ui/`](docs/tangkapan-2d/perbaikan-ui/README.md).

Setelah tokoh Mr Roger, Miss Raksa, dan Bu Isti ditambahkan, keempat perintah di atas dijalankan ulang (18 September 2026)
dengan hasil sama: 85/85 tes, e2e 0 kegagalan, 0 error console/HTTP, tanpa luber horizontal,
adegan dimuat dalam 120–303 ms dan heap setelah ronde 22–46 MB (naik-turun, tidak terus naik).
Tampilan ketiga tokoh (halaman awal, gabung, lobby, briefing, pembahasan misi 1/4/10, papan
peringkat, podium, hasil, koneksi putus)
diperiksa lewat tangkapan layar di `docs/tangkapan-2d/`.

### Pengujian otomatis (`npm test` — 89 tes)

Semua tes lama tetap lulus. Tes baru:

- **Server:** id jawaban benar di payload REVEAL sama persis dengan kunci; host mengakhiri
  pertandingan saat **jeda** tetap membukukan jawaban ronde itu; paket socket cacat tidak
  menjatuhkan server.
- **Draft (`client/src/game/draft.test.ts`):** ketukan adegan & kontrol HTML menghasilkan
  perubahan yang identik; batas pilihan; ganti/batal pilihan; jawaban sebagian boleh dikirim
  dengan konfirmasi; draft lama disaring; ketukan saat briefing/jeda/terkirim/pembahasan
  diabaikan; **tampilan netral sebelum REVEAL walau data reveal ada**; urutan tampil acak tetap.
- **Pembahasan (`client/src/game/hasil.test.ts`):** status per langkah yang ditampilkan
  (tepat/sebagian/belum/kosong) sama dengan penilaian server untuk semua misi dengan jawaban
  benar, salah, sebagian, dan kosong; pilihan salah vs langkah yang tepat/terlewat; tidak ada
  lagi "Makin paham" untuk 0%.
- **Adegan (`client/src/game/scenes.test.ts`):** 12 adegan terdaftar; setiap objek merujuk
  id misi/langkah/opsi/dokumen yang ada; bila satu opsi tampil maka semua opsi langkah itu
  tampil; kunci gambar unik; kode adegan tidak menyentuh kunci jawaban; acak posisi hanya
  menukar slot seragam.

### Pengujian browser (`npm run test:e2e`)

Satu pertandingan penuh (tutorial + 10 misi). Tiap pemain memakai proses browser sendiri:

| Pemain | Perangkat (emulasi) | Cara menjawab |
| --- | --- | --- |
| Ani | HP 390x844, sentuh | benar, lewat **ketukan adegan** (kategori/angka lewat HTML) |
| Budi | HP 360x740, sentuh, **mode ringan** (engine tidak dimuat) | lewat daftar HTML |
| Dedi | HP mendatar 844x390, sentuh | lewat daftar HTML |
| Citra | desktop 1280x800, mouse | lewat adegan |
| proyektor | 1366x768 | menonton |

| Yang diperiksa | Hasil |
| --- | --- |
| Ani: 10 misi terkirim & diakui server, poin penuh | 10/10 (+1.181 s.d. +1.273 per misi) |
| Budi (mode ringan), Dedi, Citra: laporan terkirim tiap misi | 30/30 |
| Kontrol jawaban tidak ada saat BRIEFING; ketukan saat briefing tidak memilih | ya |
| Geser jari di atas kanvas menggulung halaman & tidak memilih objek | ya |
| Jeda host mengunci ketukan adegan (tata letak menjawab tetap, pilihan terkunci) | ya |
| Refresh di tengah menjawab memulihkan draft (2 dokumen), tanpa kanvas ganda | ya |
| Kirim diklik dua kali cepat = satu laporan | ya |
| Kanvas & instance engine hilang setelah tiap ronde | 10/10 |
| Scroll horizontal (360/390/mendatar/desktop, semua misi) | 0 px |
| Console error / HTTP 400+ | **0** |
| Refresh halaman hasil memulihkan identitas; ekspor CSV | ya |
| Mode latihan di HP 360: misi 4 lewat adegan, jawaban benar = "Jawabanmu tepat" (tanpa "Makin paham") | ya |
| HP diputar (360×740 → 740×360 → kembali): pilihan tetap & adegan tidak dimuat ulang | ya |
| Digulir sampai habis: pilihan terakhir berada di atas bar aksi lengket | ya |

### Pengukuran (emulasi, BUKAN HP fisik)

Satu halaman latihan, HP 390x844, Chrome headless + WebGL perangkat lunak:

| Kondisi | Adegan siap (misi pertama, cache kosong) | Misi berikutnya | FPS saat diam |
| --- | --- | --- | --- |
| CPU normal | 985 ms | 437–612 ms | 57–60 |
| CPU diperlambat 4x (emulasi HP kelas bawah) | 1.373 ms | 650–921 ms | 57–60 |

Rasterisasi gambar SVG per misi 9–129 ms. Dalam dua kali pertandingan E2E (5 browser berjalan
bersamaan di satu komputer) fps Ani 41–59 dan heap JS setelah tiap ronde tetap di 21–48 MB (tidak
naik terus, jadi tidak ada tanda kebocoran antar ronde). HP bertenaga rendah (<= 4 inti / <= 2 GB)
otomatis dibatasi 30 fps.


### Verifikasi isi audio (`npm run check:audio`)

Didekode di Chrome dengan Web Audio API, bukan sekadar membaca laporan generator:

| Trek | Durasi | Peak | RMS | Variasi (cv) | Senyap | Bernada |
| --- | --- | --- | --- | --- | --- | --- |
| lobby | 73,9 s | -3,4 dB | -17,0 dB | 0,17 | 0 s | ya (zcr 1302/s) |
| gameplay | 68,6 s | -2,6 dB | -16,1 dB | 0,16 | 0 s | ya (zcr 1416/s) |
| podium | 11,2 s | -1,4 dB | -17,7 dB | 0,56 | - | ya (zcr 1656/s) |

Variasi cv 0,16-0,56 menunjukkan ada bagian A/B yang berbeda, bukan satu pola pendek yang
diulang. RMS sekitar -16 sampai -17 dBFS dipilih agar tidak menutupi suara MC.

### Yang TIDAK diuji

- **HP fisik**: semua angka di atas berasal dari Chrome desktop headless dengan emulasi
  viewport/sentuh dan WebGL perangkat lunak. Itu **tidak membuktikan** kelancaran di
  Android/iPhone sungguhan: safe area, keyboard HP, rotasi nyata, WebGL di Safari iOS,
  panas & baterai, dan fps di GPU HP kelas bawah belum diuji di perangkat.
- **Beban**: jumlah koneksi yang diuji bersamaan adalah **6** (1 host + 4 pemain + 1 proyektor).
  Uji dengan ~100 peserta belum dijalankan (`npm run loadtest -- --players 100`).
- **Pembaca layar** (TalkBack/VoiceOver) belum dicoba langsung; daftar pilihan HTML memakai
  peran radio/checkbox dan pengumuman `aria-live`.
- **Audio oleh telinga manusia** dan kenyamanan volume di ruang acara.
- **Jaringan kantor sebenarnya** (firewall, client isolation, VPN, unduhan engine bersamaan).

### Menjalankan ulang pengujian browser

Skrip uji bukan bagian dependensi proyek supaya bundel acara tetap kecil:

```bash
npm install --no-save puppeteer-core   # socket.io-client sudah ada di workspace
npm run build && npm start        # server di http://127.0.0.1:4000
npm run test:e2e                  # pertandingan penuh, keluar 1 bila ada yang gagal
npm run check:audio               # ukur isi musik
```
