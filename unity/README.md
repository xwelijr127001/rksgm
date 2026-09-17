# Proyek Unity — RAKSA GAME

Adegan 3D "miniature city diorama" untuk RAKSA GAME. Unity menangani lingkungan,
karakter, kendaraan/alat berat, objek yang dapat diketuk, dan animasi. React tetap
menangani seluruh teks, formulir, pilihan jawaban, timer, dan leaderboard.
Node.js + Socket.IO tetap **sumber kebenaran** pertandingan.

> **Dimatikan di runtime (18 September 2026):** server memakai `UNITY_3D=off` sebagai default,
> jadi peserta mendapat adegan SVG 2D. Lihat `readUnityStatus()` di `server/src/unityServe.ts`.
> Semua isi dokumen ini tetap berlaku bila 3D-nya diteruskan — nyalakan dengan `UNITY_3D=on`.
>
> **Status build:** proyek ini **sudah pernah di-build dan dimuat di browser**
> (Unity 6000.6.1f1, unduhan 4,8 MB, bridge dua arah berfungsi). Yang belum selesai
> adalah komposisi gambar diorama, dan pengujian di perangkat HP fisik belum dilakukan.
> Lihat [Status & batasan](#10-status--batasan) untuk rinciannya.

---

## 1. Yang dibutuhkan

| Kebutuhan | Nilai |
| --- | --- |
| Unity Editor | **6000.3.x LTS** disarankan untuk acara; build terakhir dibuat dengan **6000.6.1f1** (lihat bagian 10). `ProjectVersion.txt` ditulis ulang oleh editor yang terakhir membuka proyek. |
| Modul | **Web Build Support** (`webgl` / `webgl-build-support`) |
| Lisensi | Unity Personal (gratis) atau lisensi perusahaan — harus disetujui sendiri lewat Unity Hub |
| Render pipeline | **Built-in** (sengaja; tanpa URP agar build kecil & ringan di HP) |
| Input | **Input Manager (lama)** — proyek tidak memakai package Input System |

Kenapa 6.3 LTS: Unity 6 adalah versi pertama yang **resmi mendukung browser HP**
(iOS Safari 15+, Android Chrome 58+), dan dukungan Unity 6.0 LTS berakhir Oktober 2026,
sedangkan 6.3 LTS didukung sampai Desember 2027.

### Memasang

```powershell
winget install Unity.UnityHub
unity install lts -m webgl          # Unity CLI baru
# atau di Unity Hub: Installs > Add modules > WebGL Build Support
```

Sudah terpasang tapi script tidak menemukannya:

```powershell
$env:RAKSA_UNITY = "C:\Program Files\Unity\Hub\Editor\6000.6.1f1\Editor\Unity.exe"
```

---

## 2. Membuat scene & build

Scene dibuat **prosedural** oleh generator di Editor, jadi repo tidak menyimpan file
`.unity` biner yang sulit direview.

Dari Unity Editor (menu **Raksa**):

1. `1. Terapkan Pengaturan Web` — PlayerSettings untuk Web/HP
2. `2. Generate Diorama` — membuat material, prefab, 10 diorama, dan `Assets/Scenes/RaksaGame.unity`
3. `3. Build Web` — build ke `unity/Build/Web`

Dari command line (dipakai panitia / CI):

```bash
npm run gen:unity            # 1) data misi -> Unity (WAJIB setelah mengubah shared/missions.ts)
npm run unity:build          # 2) generate scene bila perlu, lalu build Web

# varian
powershell -File unity/build.ps1 -Brotli        # lebih kecil, butuh server kirim Content-Encoding: br
powershell -File unity/build.ps1 -NoFallback    # matikan decompression fallback (lebih kecil)
powershell -File unity/build.ps1 -GenerateOnly  # hanya generate scene, tanpa build
bash unity/build.sh --brotli                    # macOS / Linux
```

Build pertama bisa 10–30 menit. Log ada di `unity/build-web.log`.

---

## 3. Satu sumber ID: `npm run gen:unity`

ID objek di scene Unity **tidak boleh** menyimpang dari ID opsi di data misi, karena
ID itulah penghubung antara ketukan di canvas dan draft jawaban di React.

```
shared/missions.ts
   └─ tools/gen-unity-data.ts
        ├─ unity/Assets/Editor/Generated/raksa-missions.json   (dipakai generator scene)
        └─ unity/Assets/Scripts/Generated/RaksaIds.cs          (validasi runtime)
```

Nama anchor objek = `"<stepId>:<optionId>"` (lihat `anchorId()` di `shared/unityBridge.ts`).
Generator scene **gagal dengan error** bila ada anchor di data yang tidak punya objek di
diorama — jadi konten dan scene tidak bisa diam-diam tidak sinkron.

Kunci jawaban **tidak** ikut dibuat ke Unity.

---

## 4. Kontrak bridge JavaScript ↔ Unity

Definisi tunggal: [`shared/unityBridge.ts`](../shared/unityBridge.ts) (`BRIDGE_VERSION = 1`).

**React → Unity** — `unityInstance.SendMessage("RaksaBridge", "Receive", json)`

| Pesan | Isi penting |
| --- | --- |
| `initialize` | `version`, `reducedMotion`, `quality`, `maxDpr` |
| `setPlayerAppearance` | `look` (4 karakter siap pakai / hasil pemilih karakter) |
| `loadMission` | `missionId`, `roundIndex`, `scene`, `objects[]` |
| `setPhase` | `missionId`, `roundIndex`, `phase` |
| `restoreSelections` | `missionId`, `roundIndex`, `selections[]` |
| `setInteractionEnabled` | `enabled` |
| `showFeedback` | `kind` = benar/salah/netral/selesai/kirim |
| `setCameraView` | `view` = default/depan/kiri/kanan/atas |
| `setReducedMotion`, `setQuality`, `ping` | — |

**Unity → React** — `RaksaBridgeSend(json)` → `window.RaksaUnityReceive(json)`

| Pesan | Isi penting |
| --- | --- |
| `unityReady` | `version` |
| `missionReady` | `missionId`, `roundIndex` — dipakai handshake kesiapan |
| `objectSelected` | `stepId`, `optionId`, `bucketId?` |
| `evidenceToggled` | `stepId`, `optionId`, `added` |
| `cameraViewChanged` | `view` |
| `sfx` | `name` (diteruskan ke pengelola audio web) |
| `interactionError` | `code`, `message` |
| `pong` | `nonce` |

Aturan yang ditegakkan di kedua sisi:

- Setiap pesan misi membawa `missionId` + `roundIndex`; pesan dari misi/ronde lama **dibuang**.
- `RaksaBridge.cs` memvalidasi versi, bentuk pesan, fase, dan anchor lewat `RaksaIds`.
- Pesan yang datang **sebelum** `initialize` ditahan di antrean, tidak hilang.
- Pesan dari Unity adalah **data**, bukan perintah: Unity tidak pernah menentukan benar/salah.
- Unity **tidak** menghitung skor. Benar/salah hanya tampil setelah React mengirim
  `showFeedback`, yaitu setelah server masuk fase `REVEAL`.

---

## 5. Cara Unity disajikan ke peserta

Build **tidak** masuk ke `client/dist` (supaya bundel web tetap kecil). Express yang
menyajikannya:

- `GET /api/unity/status` → `{ available, loaderUrl, buildName, compression, downloadMb, version }`
  Nama file **ditemukan dengan pola** `*.loader.js`, tidak di-hardcode, jadi tidak rusak
  bila nama produk berubah.
- `GET /unity/**` → file build dengan MIME & `Content-Encoding` sesuai dokumentasi Unity
  (`.wasm` → `application/wasm`, `.data.gz` → `application/gzip` karena bug Safari,
  `.gz` → `Content-Encoding: gzip`, `.br` → `br`).
- File Unity yang hilang → **404 JSON**, bukan HTML SPA (kalau HTML, loader Unity gagal
  dengan pesan yang membingungkan).
- Aset ber-hash di-cache `immutable`; loader di-cache pendek agar build baru langsung terbaca.

Diuji di `server/src/unity.test.ts` memakai fixture berisi struktur file hasil build.

Bila build **belum ada**, `available: false` dan game memakai **mode ringan** (adegan SVG
yang sudah ada). Itu bukan error — pertandingan tetap berjalan penuh.

---

## 6. Kontrol untuk peserta nonteknis

- Tidak ada joystick, tidak ada kamera bebas, tidak ada kombinasi tombol.
- Karakter berpindah **otomatis** ke lokasi misi (`CharacterMover`).
- Interaksi hanya **tap**: ketuk objek, ambil bukti, pilih dokumen.
- Kamera tetap isometrik; perpindahan hanya lewat tombol "Depan / Sisi kiri / Sisi kanan"
  (`CameraRig`, dipakai misi 2, 4, 8).
- Penanda objek punya cincin + nomor + label, **tidak** mengandalkan warna saja.
- Setiap objek 3D punya padanan kontrol HTML yang tetap berfungsi penuh — untuk
  aksesibilitas dan untuk peserta yang Unity-nya gagal dimuat.

---

## 7. Performa

Target: **~30 FPS** di HP kelas menengah, unduhan awal **< 20 MB** terkompresi.

Yang sudah diterapkan di source:

| Langkah | Di mana |
| --- | --- |
| Color space Gamma, WebGL2 saja, stripping High, tanpa exception support | `RaksaBuildWeb.ApplySettings` |
| Resolusi render dibatasi (tidak mengikuti seluruh `devicePixelRatio`) | `QualityManager` |
| Mode hemat grafis otomatis untuk perangkat memori kecil | `QualityManager.Ringan()` |
| Bayangan ringan / dimatikan, tanpa AA, tanpa reflection probe | `QualityManager.Apply` |
| Semua diorama dalam satu scene, satu aktif — tanpa memuat ulang runtime | `GameRoot` + `DioramaRoot` |
| Satu raycast terpusat saat tap, bukan `Update` per objek | `GameRoot.Update` |
| Poligon & material terkendali (target < 6000 tris/diorama) | generator scene |
| Hanya karakter pemain + NPC relevan yang tampil 3D; peserta lain lewat leaderboard HTML | `GameRoot` |

**Angka FPS, waktu loading, memori, dan ukuran build belum diukur** karena build belum
pernah dibuat. `RaksaBuildWeb` mencetak ukuran folder build dan memperingatkan bila
melampaui 20 MB.

---

## 8. Keadilan timer

Kesiapan adegan **tidak** boleh mengurangi waktu menjawab pemain:

1. Saat `BRIEFING`, React mengirim `loadMission`; Unity menjawab `missionReady`.
2. React melaporkan ke server lewat `player:sceneReady { roundIndex }`.
3. Server mencatatnya sebagai **informasi** (`PlayerPublic.sceneReady`,
   `RoomPublicState.sceneReadyCount`) — host melihat siapa yang belum siap.
4. Host boleh menunggu atau lanjut; tombol **"Minta muat ulang adegan"**
   (`retryScene`) tersedia per peserta.
5. Deadline, pause, resume, dan waktu menjawab **tetap milik server**. Tidak ada
   tambahan waktu individual — diuji di `server/src/unity.test.ts`
   ("kesiapan adegan tidak boleh menggeser deadline").
6. Bila adegan lambat/gagal, pemain **tetap bisa menjawab** lewat kontrol HTML.

---

## 9. Struktur

```
unity/
├── ProjectSettings/ProjectVersion.txt      versi editor yang di-pin
├── Packages/manifest.json                  modul minimal (tanpa URP)
├── build.ps1 / build.sh                    build CLI + deteksi editor
├── Assets/
│   ├── Plugins/WebGL/RaksaBridge.jslib     sisi JS dari bridge
│   ├── Scripts/Bridge/                     RaksaBridge.cs, BridgeMessages.cs
│   ├── Scripts/Game/                       GameRoot, DioramaRoot, Tappable,
│   │                                       CameraRig, CharacterMover, QualityManager
│   ├── Scripts/Generated/RaksaIds.cs       (hasil gen:unity — jangan edit)
│   ├── Editor/RaksaBuildWeb.cs             pengaturan + build Web
│   ├── Editor/RaksaSceneGenerator*.cs      generator diorama
│   └── Editor/Generated/raksa-missions.json (hasil gen:unity — jangan edit)
└── Build/Web/                              hasil build (tidak masuk git)
```

---

## 10. Status & batasan

Diverifikasi pada 18 September 2026, Windows 11, Unity **6000.6.1f1**, Chrome 153 headless.

### Sudah terbukti jalan

| Hal | Bukti |
| --- | --- |
| Kompilasi C# | `npm run check:csharp` -> 0 error terhadap 185 assembly Unity asli |
| Generator scene | Dijalankan Unity: 13 material, 16 prefab, scene 3 MB, 10 diorama |
| Validasi anchor | `[Raksa] validasi lolos: 55 anchor misi ada di diorama-nya` |
| Unity Web build | Berhasil, **4,8 MB** total unduhan (target < 20 MB) |
| Dimuat di browser | `Initialize engine version: 6000.6.1f1`, WebGL 2.0, PhysX, 0 error |
| Bridge dua arah | `unityReady` + `missionReady` diterima React (`npm run check:unity-load`) |
| Perpindahan diorama | 5 misi diuji (1, 4, 6, 7, 10), semuanya `missionReady` |
| Penyajian berkas | 4/4 berkas HTTP 200 dengan MIME & `Content-Encoding` benar |

Ukuran build sebenarnya:

```
Web.wasm.unityweb          3.803 KB
Web.data.unityweb            980 KB
Web.framework.js.unityweb     70 KB
Web.loader.js                 47 KB
```

### Versi Unity yang dipakai

Build ini memakai **6000.6.1f1**, bukan 6.3 LTS. Alasannya: 6.3 LTS (6000.3.24f1)
terpasang di mesin ini **tanpa modul Web Build Support**, sehingga tidak bisa
membuat build Web. `unity/build.ps1` sekarang menolak lebih awal bila tidak ada
editor bermodul Web dan mencetak perintah yang tepat:

```
unity install-modules -e 6000.3.24f1 -m webgl
```

Untuk acara, 6.3 LTS tetap lebih disarankan (didukung sampai Des 2027 vs 6.6 yang
bukan LTS). Setelah modulnya dipasang, `npm run unity:build` otomatis memilihnya.

### Belum selesai: komposisi gambar diorama

Ini batasan yang paling perlu diketahui. Unity merender, tetapi **framing adegan
belum rapi**: geometri belum terpusat di dalam frame dan sebagian area masih kosong.

Yang sudah dilakukan: framing tidak lagi memakai angka tetap, melainkan diukur dari
`Renderer.bounds` diorama aktif saat runtime (`GameRoot.HitungBounds` ->
`CameraRig.SetFitBounds`), lalu jarak kamera dihitung dari rasio canvas supaya
diorama tidak terpotong di portrait HP, area 4:3, maupun proyektor 16:9.

Diagnostik bawaan (`GameRoot.logDiagnostik`, default aktif) mencetak keadaan render
ke console browser setiap misi dimuat:

```
diag m01-parkir diorama=parkiran aktif=True
| kamera pos=(14.5, 13.6, -14.5) arah=(-0.61, -0.48, 0.63) fov=40 aspect=1.33
  clear=SolidColor bg=RGBA(1.000, 0.976, 0.914, 1.000) aktif=True
| views=1 v0.pos=(9.7, 9.0, -10.1) v0.lookAt=(0.0, 1.3, 0.0) v0.fov=40
| renderer=118 bounds pusat=(0.1, 2.2, 0.5) ukuran=(9.5, 5.3, 10.3)
```

Angka-angka itu menunjukkan perhitungan jaraknya sudah benar (23,7 = radius 7,5 x
1,08 / sin 20 derajat) dan kamera mengarah tepat ke pusat geometri. Namun hasil
gambarnya belum sesuai perhitungan, dan **penyetelan visual ini tidak dapat
diselesaikan dengan andal lewat Chrome headless**: rendernya memakai WebGL software
(SwiftShader), dan pembacaan piksel `drawImage` selalu mengembalikan transparan
tanpa `preserveDrawingBuffer` sehingga bukan alat ukur yang sah.

Langkah berikutnya memerlukan mata manusia atau GPU nyata:

1. `npm run build && npm start`, buka `/latihan` di browser desktop biasa (bukan headless).
2. Lihat console untuk baris `diag ...` di atas.
3. Setel komposisi per diorama di `RaksaSceneGenerator` (posisi objek) atau
   `CameraRig.View` (sudut pandang), lalu `npm run unity:build`.

Matikan `logDiagnostik` di komponen `GameRoot` bila tidak diperlukan lagi.

### Catatan kualitas lain

- Perkiraan poligon **5.300-10.400 tris per diorama**, melebihi target internal
  < 6.000. Jalur perbaikan ditulis sebagai komentar `ponytail:` di
  `RaksaSceneGeneratorParts.cs`. Material tetap 13 dengan GPU instancing, jadi
  draw call tetap kecil.
- Papan nama lokasi **tanpa teks**: generator hanya menggambar bentuk. Paket
  `com.unity.modules.textrendering` yang sempat dicoba **tidak ada di Unity 6**
  dan membuat build gagal resolve paket, jadi dihapus kembali.
- Diorama `kantor-hitung` (misi 9) tidak punya objek yang diketuk karena semua
  langkahnya berupa angka - sesuai data misi.
- Untuk misi hotspot (misi 4), adegan tampil **dua kali**: canvas Unity di atas
  dan adegan SVG dengan penanda angka di bawahnya, karena renderer hotspot memuat
  `<Scene>`-nya sendiri. Ketukan tetap berfungsi lewat SVG, tetapi tampilannya
  redundan dan perlu dirapikan.

### Belum diuji

- **Perangkat fisik Android/iPhone**: belum sama sekali. Pengujian hanya viewport
  360/390 px di Chrome desktop headless - itu tidak membuktikan safe area,
  keyboard HP, rotasi, WebGL di Safari, maupun performa nyata.
- **FPS, waktu loading, dan memori di HP kelas menengah**: belum diukur.
- **Unity 6.3 LTS**: belum pernah dipakai membuat build (modul Web belum terpasang).
