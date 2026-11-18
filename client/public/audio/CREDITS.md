# Kredit & lisensi audio - RAKSA GAME

Semua musik di folder ini **dihasilkan secara prosedural oleh `tools/make-music.mjs`
untuk proyek RAKSA GAME**. Tidak ada sampel, loop, atau rekaman pihak ketiga yang
diunduh atau ditempel ke dalamnya - nada, petikan, bass, dan shaker disintesis dari
nol (sine + harmonik, Karplus-Strong, noise ter-filter) lalu di-encode ke MP3.

- Tanggal dibuat: **17 September 2026**
- Pembuat: tim pengembang RAKSA GAME (script `tools/make-music.mjs`)
- Lisensi: **milik proyek RAKSA GAME / PT Asuransi Raksa Pratikara.** Bebas dipakai,
  diputar, dan diubah untuk acara perusahaan Raksa (internal maupun yang direkam).
  Tidak ada kewajiban atribusi ke pihak luar dan tidak ada royalti.
- Tidak mengandung sampel berlisensi, jadi aman untuk rekaman acara yang diunggah
  ke YouTube/Instagram perusahaan.

## Status: ini audio FINAL

| Berkas         | Judul                                | Durasi | BPM | Pemakaian                  | Status |
| -------------- | ------------------------------------ | -----: | --: | -------------------------- | ------ |
| `lobby.mp3`    | Raksa Lobby (Pagi di Kantor)         | 73,8 s | 104 | Lobby & tunggu, **loop**   | FINAL  |
| `gameplay.mp3` | Raksa Misi (Ayo Lindungi Kota)       | 68,6 s | 112 | Selama misi, **loop**      | FINAL  |
| `podium.mp3`   | Raksa Podium (Selamat, Pahlawan!)    | 11,2 s | 112 | Podium/juara, **sekali**   | FINAL  |

Format: MP3 mono 128 kbps, 44,1 kHz. Peak: lobby -2,9 dBFS, gameplay -2,2 dBFS,
podium -0,9 dBFS. RMS sekitar -16 dBFS supaya **tidak menutupi suara MC**
(volume tetap bisa diturunkan lagi dari panel Suara di halaman host/proyektor).

**Tidak ada berkas sementara/placeholder di folder ini.** Bila suatu saat ada,
namanya wajib diberi awalan `TEMP-` dan dicatat di tabel terpisah di bawah
("Audio sementara"), supaya jelas mana yang belum final.

### Audio sementara

_(kosong - saat ini semua audio sudah final)_

### Efek suara (SFX)

Efek suara (`pilih`, `bukti`, `kirim`, `naik`, `salah`, `tik`, `papan`, `confetti`,
`masuk`) **tidak ada di folder ini**. Semuanya disintesis langsung di browser dengan
Web Audio API di `client/src/audio/audio.ts` - ringan, tanpa unduhan, dan tidak
punya isu lisensi.

## Cara membuat ulang

```bash
npm install            # sekali saja; lamejs ada di devDependencies root
npm run gen:music      # = node tools/make-music.mjs
```

Script menulis ulang ketiga berkas di `client/public/audio/`, mencetak durasi, BPM,
ukuran, peak/RMS, lalu memeriksa hasilnya sendiri (durasi sesuai rentang, peak tidak
clipping, panjang tepat kelipatan bar, sambungan loop halus). Bila ada yang
melanggar, script **gagal dengan pesan jelas** dan berkas lama tidak tertimpa.

Keluarannya deterministik (PRNG ber-seed), jadi menjalankan ulang menghasilkan
berkas yang sama. Mau variasi baru? Ubah `seed` di `tools/make-music.mjs`, atau ubah
`prog`/`mel` di daftar `SONGS`.

Catatan teknis:

- Loop dibuat mulus dengan cara panjang trek dipatok tepat kelipatan bar, lalu ekor
  dengung/reverb "di-wrap" (ditambahkan) ke kepala. Delta sambungan tercetak saat
  generate (< 0,004).
- MP3 punya sedikit padding encoder, jadi `loop` bawaan `<audio>` bisa menyisakan
  jeda beberapa puluh milidetik pada beberapa browser. Untuk musik latar pelan di
  acara, ini tidak terasa. Bila suatu hari perlu benar-benar gapless, encode ke
  `.ogg`/`.webm` (Opus) atau putar lewat Web Audio `AudioBufferSourceNode.loop`.
- Bila `lamejs` tidak bisa dipakai di mesin yang menjalankan generator, script
  otomatis menulis **WAV mono 32 kHz** (`lobby.wav`, dst.), mencetak alasannya, dan
  mengingatkan untuk menyesuaikan `MUSIC_FILES` di `client/src/audio/audio.ts`.
  Ukuran berkas jadi jauh lebih besar, jadi ini hanya jalan darurat.

## Cara mengganti dengan musik lain berlisensi

1. Siapkan tiga berkas MP3 (mono/stereo, 128-192 kbps cukup): musik lobby yang
   santai dan bisa di-loop, musik gameplay yang sedikit lebih aktif dan bisa
   di-loop, serta jingle kemenangan pendek 8-14 detik.
2. Timpa `lobby.mp3`, `gameplay.mp3`, `podium.mp3` di folder ini dengan nama yang
   sama - **tidak perlu mengubah kode sama sekali**. Kalau nama berkasnya berbeda,
   ubah satu tempat saja: konstanta `MUSIC_FILES` di paling atas
   `client/src/audio/audio.ts`.
3. Turunkan level musik pengganti ke sekitar -16 dBFS RMS (peak maksimal -2 dBFS)
   supaya MC tetap terdengar. Pastikan kedua trek loop tidak "menghentak" di
   sambungan; potong tepat di batas bar.
4. Catat di tabel ini: judul, pembuat, sumber (mis. nomor lisensi/tautan pembelian),
   jenis lisensi, dan apakah boleh dipakai untuk video acara yang dipublikasikan.
   Kalau lisensinya mewajibkan atribusi, tulis teksnya di sini **dan** tampilkan di
   materi acara - halaman `/host` punya ruang untuk itu.
5. Simpan berkas lisensi/invoice di luar repo (mis. Drive panitia), jangan di folder
   publik ini karena semua isinya bisa diunduh siapa saja yang membuka aplikasi.
6. Jangan hapus `tools/make-music.mjs` - musik prosedural ini tetap jadi cadangan
   bila musik berlisensi bermasalah saat hari-H (offline, salah versi, dll).

## Mode cerita Episode 2 (ditambahkan 15 Nov 2026)

Dibuat oleh `tools/make-music-ep2.mjs` (100% disintesis di script ini: piano elektrik FM, pad sinus, bass sinus,
petikan Karplus-Strong redup, reverb ringan). Tanpa sampel, loop, atau rekaman pihak ketiga. Lisensi sama dengan lagu di
atas: milik proyek RAKSA GAME / PT Asuransi Raksa Pratikara. Lagu lama (`lobby`, `gameplay`, `podium`) tidak diubah.

**T-036 Fix 1 (18 Nov 2026): diganti lagi, gaya chiptune 8-bit ceria** (arahan pemilik sesudah mendengar; versi pastoral T-036
dibuang). Saluran ala konsol lama, semua disintesis di script: dua pulsa (duty 12,5 / 25 / 50 %, PolyBLEP), segitiga 4-bit bertangga
untuk bass, noise LFSR untuk hat, kick dan snare. Motif 4 bar ASLI yang diulang (dibangkitkan dari nada akor oleh PRNG ber-seed),
bagian A / B; bukan kutipan lagu mana pun, tanpa sampel atau rekaman.

| Berkas               | Judul              | Durasi  | BPM | Bar | Pemakaian                                               | Status |
| -------------------- | ------------------ | ------: | --: | --: | ------------------------------------------------------- | ------ |
| `cerita-kantor.mp3`  | Loket Pagi         | 110,8 s | 104 |  48 | Bagian 1 & 4: kantor dan percakapan (ringan, C mayor)   | DRAF   |
| `cerita-periksa.mp3` | Lapangan Berangkat | 120,0 s | 112 |  56 | Bagian 2 & 3: pemeriksaan (lebih bertenaga, D mayor)    | DRAF   |
| `cerita-penutup.mp3` | Berkas Beres       | 115,2 s | 100 |  48 | K15 dan layar akhir (hangat + lick kemenangan, F mayor) | DRAF   |

Metode loop: panjang = kelipatan bar, ekor di-"wrap" ke kepala, semua nada mulai dari titik nol, bass legato (sambungan maks 0,013; level awal/akhir loop beda maks 1,4 dB). Level: dinormalisasi
RMS -21/-22 dBFS, MP3 mono 80 kbps (sekitar 1,1 MB). Di game diputar 28% dari volume musik pemain (total sekitar 9 dB di bawah SFX,
volume disetujui pemilik). Kunci cache URL `?v=t036b`. Suasana (`bengkel`, `jalan`) 8 dB lebih pelan. Status **DRAF** sampai pemilik mendengar.

Efek suara mode cerita (`taruh` = dokumen ke baki: kibasan kertas + ketuk kayu + denting kecil, 0,4 s; `kertas` = berkas dibuka: kertas bergeser + pop + ekor terang, 0,3 s; `pesanTerima` = tiga nada bel naik, 0,57 s; `pesanKirim` = satu tik bel; T-036, `ketuk`, `konfirmasi`, `batal`) dan suasana tempat
(`bengkel`, `jalan`: noise ter-filter yang naik-turun pelan) disintesis di `client/src/audio/audio.ts`, tanpa berkas.

### Pemeriksaan MP3 hasil encode (15 Nov 2026, `node tools/cek-mp3-ep2.mjs`, ffmpeg)

Ketiga berkas didekode penuh tanpa galat dan tanpa clipping (peak -4,6 s/d -5,2 dBFS). Temuan yang BELUM diperbaiki (menunggu
dengar manusia, komposisi tidak diubah berdasarkan dugaan):
- Hening 16-26 ms di kepala tiap berkas (jeda encoder MP3): calon jeda kecil saat `<audio loop>` berulang.
- `cerita-periksa.mp3`: detik terakhir sekitar 8 dB lebih pelan dari detik pertama, jadi di titik loop ada lompatan level.

### sfx-tombol.wav (bunyi tombol oranye, 19 Nov 2026)

`confirmation_003` dari **Interface Sounds** oleh Kenney (www.kenney.nl), lisensi **CC0 1.0** (domain publik; boleh komersial,
tanpa wajib kredit). Dipilih owner dari halaman pilih bunyi (nomor 20). Diubah ke WAV mono 16-bit 44,1 kHz tanpa pengolahan lain
(WAV dipakai, bukan MP3, supaya tidak ada jeda encoder di kepala bunyi).

### Set efek mode cerita (19 Nov 2026, T-048)

Semua CC0 1.0 (domain publik, boleh komersial, tanpa wajib kredit), oleh Kenney (www.kenney.nl):
- `sfx-kertas.wav` = `bookFlip2` dari **RPG Audio** (berkas dibuka).
- `sfx-taruh.wav` = `bookPlace1` dari **RPG Audio** (dokumen ditaruh di baki).
- `sfx-ketuk.wav` = `select_002`, `sfx-konfirmasi.wav` = `confirmation_001`, `sfx-batal.wav` = `back_002` dari **Interface Sounds**.
Diubah ke WAV mono 16-bit 44,1 kHz, hening di kepala dipotong, maksimal 0,6 s dengan pudar 0,1 s. Bunyi pesan (pesanKirim,
pesanTerima) tetap sintesis asli T-036.
