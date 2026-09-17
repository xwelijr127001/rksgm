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
