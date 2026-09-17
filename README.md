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
eksternal. Ilustrasi 2D adalah SVG lokal, adegan 3D memakai build Unity lokal, musik latar
adalah file MP3 yang dihasilkan sendiri, dan efek suara disintesis dengan Web Audio API.

## 1a. Arsitektur

Tiga lapisan dengan tanggung jawab yang tegas:

| Lapisan | Menangani | Catatan |
| --- | --- | --- |
| **React + TypeScript** | Landing, join, pilih karakter, lobby, instruksi & pilihan jawaban, timer, tombol kirim, leaderboard, host dashboard, pengaturan audio, hasil | Semua teks & formulir tetap HTML supaya terbaca dan nyaman dengan keyboard HP |
| **Unity 6 (Web)** | Lingkungan diorama 3D, karakter & maskot, kendaraan/alat berat, objek yang diketuk, pengumpulan bukti, animasi perpindahan lokasi, respons visual | Opsional saat runtime: bila build belum ada, game memakai **mode ringan** (adegan SVG) |
| **Node.js + Socket.IO + SQLite** | Room, fase, deadline, jawaban, skor, peringkat, penyimpanan hasil | **Sumber kebenaran.** Unity tidak pernah menghitung skor |

Aturan yang dijaga lintas lapisan:

- Kunci jawaban hanya ada di `server/src/answerKeys.ts` dan baru dikirim ke client pada fase `REVEAL`.
- ID objek Unity dihasilkan dari `shared/missions.ts` (`npm run gen:unity`) sehingga ketukan
  di canvas dan pilihan di kontrol HTML mengisi **draft jawaban yang sama**.
- Pesan dari Unity adalah data, bukan perintah: pesan dari misi/ronde lama dibuang.
- Kesiapan adegan 3D tidak pernah menambah waktu menjawab siapa pun.

Kontrak pesan bridge: [`shared/unityBridge.ts`](shared/unityBridge.ts).
Detail proyek Unity: [`unity/README.md`](unity/README.md).

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

## 4a. Adegan 3D Unity

> **Adegan 3D DIMATIKAN secara default (18 September 2026).** Build Unity sudah jadi, tetapi
> komposisi diorama belum rapi: di GPU nyata adegannya tampil sebagai kotak kosong. Karena
> adegan SVG 2D sudah lengkap di 10 misi dan sudah lolos e2e, itulah yang dipakai untuk acara.
> Nyalakan kembali dengan `UNITY_3D=on` di `.env` setelah framing selesai disetel dan diuji di HP.

Unity menangani adegan; React tetap menangani seluruh UI. **Build Unity bersifat opsional**:
bila `UNITY_3D` tidak `on` atau `unity/Build/Web` belum ada, peserta memakai adegan SVG dan
pertandingan tetap berjalan penuh.

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
├── tools/
│   ├── gen-unity-data.ts    shared/missions.ts -> data & ID untuk proyek Unity
│   └── make-music.mjs       menghasilkan musik latar (MP3) secara prosedural
├── unity/                   proyek Unity 6 (lihat unity/README.md)
│   ├── Assets/Scripts/      bridge + runtime diorama
│   ├── Assets/Editor/       generator scene + build Web
│   └── build.ps1 / build.sh build CLI
└── client/src/
    ├── unity/               loader, bridge, UnityStage, mock + tes bridge
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

### Unity 3D — build berhasil, komposisi gambar belum rapi

Diverifikasi 18 September 2026 dengan Unity **6000.6.1f1** (bukan 6.3 LTS — lihat di bawah).

**Sudah terbukti jalan:**

| Hal | Bukti |
| --- | --- |
| Kompilasi C# | 0 error terhadap 185 assembly Unity asli (`npm run check:csharp`) |
| Generator scene | Dijalankan Unity: 13 material, 16 prefab, scene 3 MB, 10 diorama |
| Validasi anchor | 55/55 anchor misi ada di diorama-nya (generator gagal bila tidak) |
| Unity Web build | Berhasil, **unduhan 4,8 MB** (target < 20 MB) |
| Dimuat di browser | `Initialize engine version: 6000.6.1f1`, WebGL 2.0, PhysX, 0 error |
| Bridge dua arah | `unityReady` + `missionReady` diterima (`npm run check:unity-load`) |
| Perpindahan diorama | 5 misi diuji (1, 4, 6, 7, 10), semuanya siap |
| Penyajian berkas | 4/4 berkas HTTP 200, MIME & `Content-Encoding` benar |

**Keputusan 18 September 2026: adegan 3D dimatikan (`UNITY_3D=off`, default).** Di GPU nyata
diorama tampil sebagai kotak kosong, jadi acara memakai adegan SVG 2D yang sudah lengkap.
Efek sampingnya: masalah "misi 4 tampil dua kali" ikut hilang. Sisa catatan di bawah tetap
berlaku bila suatu saat 3D-nya diteruskan.

**Yang BELUM selesai — komposisi gambar diorama.** Unity merender, tetapi geometri
belum terpusat di dalam frame dan sebagian area masih kosong. Framing sudah tidak
memakai angka tetap (diukur dari `Renderer.bounds` diorama aktif saat runtime, lalu
jarak kamera dihitung dari rasio canvas), dan angka diagnostiknya menunjukkan
perhitungan itu benar — tetapi hasil gambarnya belum sesuai.

Penyetelan ini **tidak bisa diselesaikan lewat Chrome headless**: rendernya memakai
WebGL software (SwiftShader) dan pembacaan piksel `drawImage` selalu mengembalikan
transparan tanpa `preserveDrawingBuffer`, jadi bukan alat ukur yang sah. Perlu dilihat
di browser desktop biasa atau HP. Diagnostik sudah tersedia: `GameRoot.logDiagnostik`
mencetak posisi kamera, fov, rasio, dan bounds diorama ke console setiap misi dimuat.
Langkah lanjutannya ada di [`unity/README.md`](unity/README.md) bagian 10.

**Versi Unity.** 6.3 LTS (6000.3.24f1) terpasang **tanpa modul Web Build Support**,
sehingga tidak bisa membuat build Web; karena itu build memakai 6.6. Untuk acara,
6.3 LTS tetap lebih disarankan (didukung sampai Des 2027). Setelah modulnya dipasang:

```
unity install-modules -e 6000.3.24f1 -m webgl
npm run unity:build
```

`unity/build.ps1` menolak lebih awal bila tidak ada editor bermodul Web dan mencetak
perintah yang tepat, jadi tidak gagal dengan pesan membingungkan di tengah build.

**Catatan lain:**

- Misi hotspot (misi 4) menampilkan adegan **dua kali**: canvas Unity di atas dan
  adegan SVG berpenanda angka di bawahnya. Ketukan tetap berfungsi lewat SVG, tetapi
  tampilannya redundan dan perlu dirapikan.
- Perkiraan poligon 5.300–10.400 tris per diorama, di atas target internal < 6.000.
  Jalur perbaikan ada sebagai komentar `ponytail:` di `RaksaSceneGeneratorParts.cs`.
- Papan nama lokasi tanpa teks; paket `com.unity.modules.textrendering` **tidak ada
  di Unity 6** dan sempat membuat build gagal, jadi tidak dipakai.

### Aset brand

- Logo resmi Raksa **belum disertakan dan belum diverifikasi**. Sementara ini dipakai judul
  tipografis "RAKSA GAME"; tempat penggantinya sudah disiapkan (`BRAND.logoPath`).
- Palet warna adalah **usulan desain game**, bukan kode warna resmi perusahaan. Situs resmi
  (raksaonline.com) tidak diverifikasi dari lingkungan ini, jadi warna, tipografi, dan gaya
  ilustrasi perlu dicocokkan dengan brand guideline sebelum dipakai untuk acara resmi.
- Nama & desain maskot "Raki" adalah usulan karakter game.

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
- Beberapa kontrol sekunder masih di bawah 44 px: tombol suara & tombol "Simpan" (38 px),
  slider volume (16 px), checkbox (22 px), dan tautan logo (33 px). Semua kontrol utama
  (jawaban, Lanjut, Kirim jawaban) sudah 54-68 px.

## 12. Hasil pengujian

Semua angka di bawah berasal dari perintah yang **benar-benar dijalankan** pada
Windows 11 + Node 22.9.0 + Chrome 153 (headless), 17 September 2026.

```bash
npm run typecheck      # server + client: 0 error
npm run build          # client + server: sukses
npm test               # 44 tes server + 12 tes client = 56 lulus, 0 gagal
npm run check:csharp   # C# Unity vs 185 assembly asli: 0 error
npm run unity:build      # build Unity Web: berhasil, 4,8 MB
npm run check:unity-load # Unity dimuat di browser + bridge: berfungsi
npm run test:e2e       # 1 pertandingan penuh 10 misi di Chrome: 0 kegagalan
npm run check:audio    # isi 3 trek musik didekode & diukur: lolos
```

### Pengujian otomatis (`npm test` — 56 tes)

Aturan skor & rubric:

- jawaban benar / salah / sebagian benar / timeout / lewat batas waktu;
- multi-select: memilih semua opsi **tidak** menghasilkan skor penuh;
- rubric berbobot per langkah; langkah kosong tidak mendapat nilai;
- setiap dari 10 misi punya jawaban sempurna yang menghasilkan ketepatan 1;
- urutan peringkat (poin, lalu ketepatan, lalu waktu), penandaan seri, delta, lencana.

Integritas pertandingan:

- pengiriman ganda tidak menambah skor; jawaban ronde salah & lewat deadline ditolak;
- pause/resume menyimpan fase & sisa waktu, durasi jeda tidak menambah waktu menjawab;
- kunci jawaban tidak dikirim sebelum `REVEAL`; `/api/missions` tidak memuat kunci jawaban;
- pemain biasa tidak dapat menjalankan tindakan host (token divalidasi di server);
- refresh/reconnect mempertahankan identitas & skor;
- satu pertandingan penuh 10 misi sampai podium lewat Socket.IO sungguhan
  (1 host + 2 pemain + 1 penonton);
- hasil tersimpan di SQLite dan ekspor CSV sesuai.

Unity (tanpa Editor — memakai fixture & mock):

- MIME & `Content-Encoding` build Unity sesuai dokumentasi resmi, termasuk
  `.data.gz` menjadi `application/gzip` (bug Safari);
- file Unity yang hilang menjadi **404 JSON, bukan HTML SPA**; path traversal ditolak;
- `/api/unity/status` menemukan loader lewat pola `*.loader.js` (nama tidak di-hardcode);
- kesiapan adegan hanya berlaku untuk ronde saat ini, idempoten, direset per ronde,
  dan **tidak menggeser deadline**;
- bridge: pesan sebelum `unityReady` diantrekan lalu terkirim berurutan; pesan dari
  misi/ronde lama diabaikan; pesan cacat (bukan JSON, type asing, stepId kosong) diabaikan;
  `dispose()` melepas handler;
- anchor objek yang dikirim React **identik** dengan yang dihasilkan generator data Unity
  (penjaga anti-drift antara konten dan scene).

### Pengujian browser (`npm run test:e2e`)

Satu pertandingan penuh di Chrome headless: 1 host (1366x900) + 2 pemain (390x844, mode
sentuh) + 1 proyektor (1366x768).

| Yang diperiksa | Hasil |
| --- | --- |
| 10 misi dimainkan dengan jawaban benar lewat ketukan | **10/10 terkirim & diakui server** |
| Halaman per misi (satu pertanyaan per waktu) | 1, 1, 1, 1, 2, 3, 2, 3, 3, 9 halaman |
| Pembahasan muncul setelah ronde ditutup | 10/10 |
| Papan peringkat setelah pembahasan | 10/10 |
| Input terkunci saat BRIEFING | ya (0 opsi aktif, tombol nonaktif) |
| Podium akhir | Ani 12.899 poin (#1), Budi 2.038 poin (#2) |
| Kendali host bocor ke halaman pemain | tidak |
| Pemberitahuan simulasi edukasi di tutorial | tampil |
| Refresh pemain memulihkan identitas | ya |
| Ekspor CSV | 200, berisi data kedua pemain |
| Mode latihan | misi dimainkan & dinilai |
| Horizontal scroll (360 px & 390 px) | 0 px di semua halaman |
| Console error / HTTP 400+ | **0** |

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

- **Unity di perangkat fisik**: FPS, waktu loading, dan memori di HP kelas menengah
  belum diukur. Komposisi gambar diorama juga belum rapi (lihat bagian 11).
- **Perangkat fisik**: pengujian hanya memakai viewport 360/390 px di Chrome desktop
  headless. Itu **tidak membuktikan** kompatibilitas Android/iPhone sungguhan — safe area,
  keyboard HP, rotasi, WebGL di Safari, dan performa nyata belum diuji di perangkat.
- **Beban**: tidak ada pengujian dengan banyak peserta; jumlah koneksi yang benar-benar
  diuji adalah **4** (1 host + 2 pemain + 1 penonton).
- **Audio oleh telinga manusia** dan kenyamanan volume di ruang acara.
- **Jaringan kantor sebenarnya** (firewall, client isolation, VPN).

### Menjalankan ulang pengujian browser

Skrip uji bukan bagian dependensi proyek supaya bundel acara tetap kecil:

```bash
npm install -D puppeteer-core socket.io-client
npm run build && npm start        # server di http://127.0.0.1:4000
npm run test:e2e                  # pertandingan penuh, keluar 1 bila ada yang gagal
npm run check:audio               # ukur isi musik
```
