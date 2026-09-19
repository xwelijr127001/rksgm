# Rancangan: alur main baru, mode solo, dan bank soal

Dokumen ini adalah **kontrak** untuk pekerjaan 19 September 2026. Tipe data ada di
`shared/bankSoal.ts` dan `shared/types.ts` (`MissionPublic.level`, `MissionPublic.image`,
`SceneKey 'gambar'`). Bila kode dan dokumen ini berbeda, perbaiki salah satunya; jangan diam-diam.

## 1. Masalah yang dipecahkan

1. "Ayo, main!" buntu bila belum ada room: orang mengisi nama + karakter lalu gagal di akhir.
2. Kode room baru diperiksa server di langkah terakhir.
3. Soal acara = soal latihan (dan `/api/practice/grade` membuka kuncinya).
4. Menambah/mengurangi soal butuh coding. Panitia ingin mengatur sendiri dari halaman host, dengan
   visual berupa gambar buatan desainer grafis.

## 2. Alur pemain

```
/            Halaman awal
               [Ayo, main!]            -> /kenalan (belum punya profil) | /solo (sudah)
               "Main sebagai X · ubah" -> /kenalan?ubah=1          (hanya bila profil ada)
               [Punya kode acara?]     -> /join
               spanduk "Acara «N» sedang dibuka · Gabung" -> /join?room=KODE
                 (hanya bila GET /api/acara-terbuka memberi acara != null)
/kenalan     Miss Raksa menyambut. Nama + karakter (CharacterPicker). Simpan -> profil perangkat.
               ?lanjut=/join?room=ABCD  -> setelah simpan kembali ke tujuan itu; bawaan /solo
/solo        Peta misi (paket latihan): 10 titik, bintang per misi, total skor, rekor pribadi.
/solo/main?misi=N   Main satu misi. Waktu hanya memengaruhi bonus cepat; tidak pernah mengunci.
               Ada tombol jeda. Dinilai server lewat POST /api/practice/grade.
/solo/hasil  Karakter pemain, total skor, bintang, lencana, rekor pribadi, sapaan Mr Roger.
               [Main lagi] [Punya kode acara?]
/join        Langkah 1: kode -> diperiksa LANGSUNG (GET /api/room/:code/info) -> kartu konfirmasi
               "Acara … · N pemain menunggu". Kode salah/room sudah mulai: pesan di langkah ini.
             Langkah 2: profil ada -> "Main sebagai X · ubah" + [Ikut bermain]; belum ada -> isi di sini
               (Miss Raksa tetap ada). Profil yang diisi di sini ikut tersimpan.
/latihan     Dialihkan ke /solo (dan /latihan?misi=N -> /solo/main?misi=N). Tautan lama tetap hidup.
```

Profil perangkat: `localStorage['raksa:profil'] = { nickname, look }` (fungsi di `client/src/state/profil.ts`:
`savedProfil()`, `simpanProfil()`, `useProfil()`; `savedLook()` lama di store tetap bekerja). Bila penyimpanan
diblokir (mode privat), profil hidup di memori selama tab terbuka supaya alur tidak berputar. Progres solo:
`localStorage['raksa:solo'] = { misi: { [missionId]: { akurasi, poin, bintang, kali } }, rekor }`.
Bintang: 3 = semua tepat, 2 = akurasi >= 0,6, 1 = sudah dicoba.

**Miss Raksa wajib hadir di layar pembuatan karakter** (`/kenalan` dan langkah 2 `/join`).

## 3. Bank soal

| Asal | Isi | Tempat | Visual |
| --- | --- | --- | --- |
| `latihan` | 10 misi lama (m01–m10) | `shared/missions.ts`, kunci `server/src/answerKeys.ts` | adegan 2D |
| `acara` | 10 misi baru (a01–a10), makin sulit | `shared/missions.acara.ts` + `shared/acara/aNN.ts`, kunci `server/src/acara/` | adegan 2D |
| `kustom` | buatan panitia | SQLite `soal_kustom` + berkas gambar | gambar unggahan |

- Room punya **playlist** = daftar id soal berurutan (1–20). Bawaan: paket `CONFIG.paketBawaan`
  (`RAKSA_PAKET`, bawaan `acara`; bila paket acara kosong -> `latihan`). `new Room()` tanpa argumen
  tetap memakai `latihan` supaya tes lama berlaku.
- `totalRounds = playlist.length`. Ronde penentuan = indeks `playlist.length` (tetap misi `m11-penentuan`).
- Misi yang dikirim ke client: `{ ...misi, number: posisi + 1 }`. Cache terjemahan (`shared/i18n/misi.ts`)
  tidak boleh mengembalikan `number` lama.
- Playlist TIDAK disiarkan ke pemain (judul soal berikutnya tidak bocor). Host mengambilnya lewat
  `host:attach` (data.playlist) dan `host:playlist`.
- `POST /api/practice/grade` hanya menerima paket `latihan` + tutorial. Id lain -> 404. Dengan begitu
  kunci paket acara & soal kustom tidak bisa dipancing dari luar.
- Lencana, CSV, dan simpan-pertandingan memakai playlist room, bukan `MISSIONS`.

### Soal kustom -> misi

`SoalKustom` (lihat `shared/bankSoal.ts`) diubah server menjadi `MissionPublic` + `MissionKey`:
`scene: 'gambar'`, `image`, `level = tingkat`, `productLabel` dari produk, `interactionLabel` umum,
`rakiBriefing = story`, `briefingSeconds` = bawaan misi lain, langkah `single|multi|number`
(`requiredSelections = benar.length`). Id soal `k-<8 huruf>`; id langkah `s1..`, id opsi `o1..`
dibuat server bila kosong. Tanpa terjemahan: tampil apa adanya di semua bahasa.

Validasi server (pesan Indonesia, daftar di `rincian`): panjang teks (`BATAS_KUSTOM`), 1–4 langkah,
2–6 opsi, single tepat 1 benar, multi >= 1 benar dan tidak semua opsi, number butuh `nilai` terhingga,
durasi 20–180 detik, `image.src` harus `/gambar-soal/...` hasil unggahan atau null.

### API

Otorisasi API bank yang **menulis atau membuka kunci**: header `x-room-code` + `x-host-token`
(room hidup mana pun) DAN, bila `PANITIA_PIN` dipasang, header `x-panitia-pin`. Bila `PANITIA_PIN`
dipasang, `host:create` juga mewajibkan `pin`. `GET /api/config` menambah `butuhPin: boolean`,
`paketBawaan`. Tanpa PIN: terbuka seperti halaman host sekarang (catat di README sebagai batasan).

| Metode | Alamat | Otorisasi | Hasil |
| --- | --- | --- | --- |
| GET | `/api/room/:code/info` | - | `InfoRoom` / 404 `{ ok:false, error:'Kode tidak ditemukan' }` |
| GET | `/api/acara-terbuka` | - | `AcaraTerbuka` (null bila `RAKSA_IKLAN_ROOM=off`, 0 atau >1 room di lobby) |
| GET | `/api/bank` | - | `BankSoal` (ringkasan, tanpa isi & kunci) |
| GET | `/api/bank/soal/:id` | host (+PIN) | `{ ok, soal: SoalKustom }` hanya soal kustom |
| POST | `/api/bank/soal` | host (+PIN) | `{ ok, soal }` / 400 `{ ok:false, error, rincian: string[] }` |
| PUT | `/api/bank/soal/:id` | host (+PIN) | sama |
| DELETE | `/api/bank/soal/:id` | host (+PIN) | `{ ok }`; ditolak bila soal ada di playlist room yang sedang berjalan |
| POST | `/api/bank/gambar` | host (+PIN) | badan = byte gambar, `Content-Type: image/png|jpeg|webp`, <= 3 MB -> `{ ok, src }` |
| GET | `/gambar-soal/<nama>` | - | berkas gambar, cache 1 hari |

Socket: `host:create { eventName, paket?, pin? }`; `host:playlist { code, hostToken, playlist?: string[] }`
-> `{ ok, data: { playlist: string[] } }` (tanpa `playlist` = baca saja; mengubah hanya saat `LOBBY`;
id harus ada di bank, tanpa duplikat, 1–20). Setelah diubah, state room disiarkan (`totalRounds` baru).

Gambar disimpan di folder `gambar-soal/` di sebelah berkas DB (`CONFIG.dbFile`), nama = hash isi +
ekstensi dari *magic bytes* (bukan dari nama kiriman). SVG ditolak.

## 4. Client: adegan gambar

`mission.image` ada (atau `scene === 'gambar'`) -> `AdeganGambar` menggantikan kanvas Phaser di slot
adegan yang sama (grid-area `adegan`), rasio 4:3, `object-fit: contain`, `alt` dari data. Pemain
menjawab lewat daftar pilihan HTML yang sudah ada; pembahasan memakai `HasilMisi` seperti biasa.
Layar proyektor (`AdeganLayar`) menampilkan gambar yang sama. Tidak ada engine yang dimuat.

## 5. Catatan implementasi (menyimpang dari rancangan awal, disengaja)

- **Soal dibekukan per pertandingan.** Isi soal dicari ulang saat `startMatch`/`reset`, lalu beku: suntingan
  panitia di tengah pertandingan tidak mengubah ronde yang berjalan. Id yang sudah dihapus dibuang dari playlist.
- **DELETE soal** menjawab 409 bila soal dipakai room yang sedang berjalan; room di lobby otomatis kehilangan
  soal itu (playlist yang jadi kosong diganti paket bawaan). Gambar dihapus bila tidak dipakai soal lain.
- **Validasi lebih ketat:** cerita, tugas, pelajaran, pertanyaan, penjelasan wajib diisi; `alt` kosong = judul soal.
- **Batas:** 200 soal kustom, 500 berkas gambar; rem tebak PIN 8x salah per 5 menit per alamat (429).
- **Lencana bernomor misi** (detektif, teliti, pahlawan-kota) hanya diberikan bila playlist = paket bawaan utuh.
- **/join?room=KODE** langsung maju ke langkah 2 bila room bisa dimasuki (alur QR). Jaringan gagal saat memeriksa
  kode tidak mengunci pemain: tombol Lanjut tetap aktif, server memeriksa lagi saat gabung.
- **/solo/main boleh tanpa profil** (tautan lama `/latihan?misi=N` tetap langsung main); hanya `/solo` yang meminta kenalan.
- **Spanduk acara terbuka** melayang (fixed) supaya kemunculannya tidak menggeser tombol utama.
- **Paket acara** diisi per berkas: `shared/acara/aNN.ts`, `server/src/acara/aNN.ts`, `shared/i18n/acara/aNN.ts`,
  `client/src/game/scenes/acara/aNN.ts` + `aNN.label.ts`. Berkas rintisan (null) dilewati registri.

## 6. Yang sengaja tidak dikerjakan

- Soal kustom jenis `assign`/`order`, dan titik ketuk di atas gambar (hotspot): belum.
- Terjemahan soal kustom: belum (satu bahasa sesuai ketikan panitia).
- Akun/kata sandi host: hanya `PANITIA_PIN` opsional.
- Progres solo lintas perangkat: tidak ada (tersimpan di perangkat itu saja).
