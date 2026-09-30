# Panduan: menambah episode Mode Cerita

Untuk pengembang dan penulis naskah. Ditulis 26 September 2026 dari kode yang ada (episode AUTO-1); diperbarui
malam harinya untuk revisi v2 (kartu akhir, makna alasan, istilah di tempat, alasan per opsi, arti kartu, kunci
pensiun: bagian 3a, 4.1, 6, 7).

| Rujukan | Isi |
| --- | --- |
| `client/src/cerita/tipe.ts` | Kontrak data: episode, node, kondisi, efek, state, aksi, `AturanAkhir`, `MaknaAlasan`, `Istilah` |
| `docs/rancangan-mode-cerita.md` | Keputusan produk, graf AUTO-1, **Catatan implementasi** (bagian 10), **revisi v2** (bagian 11, berlaku bila bertentangan) |
| `client/src/cerita/episode/auto-1/` | Contoh lengkap satu episode (termasuk `KARTU_AKHIR`, `MAKNA`, `ISTILAH`, blok PENSIUN) |
| `client/src/cerita/ui/tinjauan.ts` | Cara kartu akhir & "Lihat perjalananku" membaca metadata episode |
| `client/src/cerita/uji/episodeUji.ts` | Episode mini yang memakai semua fitur (fixture tes, tidak didaftarkan) |
| `docs/cerita/TINJAUAN-PIC-CLAIM.md` | Contoh dokumen tinjauan materi klaim (bagian N = kartu akhir, S = istilah & arti kartu, P = kunci pensiun) |
| `docs/cerita/KEBUTUHAN-ASET.md` | Kesenjangan seni nasabah & spesifikasi untuk ilustrator |
| `docs/cerita/UJI-PEMULA.md` | Skrip uji pemula tanpa pendamping + checklist HP fisik (formulir hasil) |

Saat ini baru **satu** episode yang terdaftar: AUTO-1 "Baret di Parkiran". Episode di bagian 9 adalah
**usulan**: belum dibuat dan tidak terdaftar.

---

## 1. Urutan kerja

1. **Rancang dulu, tanpa kode.** Tulis situasi, nasabah, 3–6 bab, butir `paham` (hal yang perlu dipahami
   nasabah) dan `proses` (langkah klaim yang dinilai), aktivitas, akhir, lalu graf dalam tabel seperti
   `rancangan-mode-cerita.md` bagian 3.1 (node, jenis, pilihan → akibat) beserta **jalur uji wajib**. Simpan
   sebagai `docs/cerita/<id>.md`.
2. **Tanyakan materi klaim ke PIC Claim sebelum menulis naskah** (bagian 5). Yang belum jelas jangan dikarang.
3. Salin folder `client/src/cerita/episode/auto-1/` menjadi `episode/<id>/` (id: huruf kecil, angka, tanda
   minus, mis. `hvc-1`). Ganti isinya, pertahankan polanya.
4. Tulis `episode.ts` (graf), `teks.id.ts` (naskah sumber), `aktivitas.ts` (misi sintetis + rubrik, `alasanOpsi`,
   `kartuArti`).
5. Tulis metadata tampilan v2 di `episode.ts` (bagian 3a): `kartuAkhir` (aturan kartu akhir per akhir, dengan titik
   ulang & paling banyak satu latihan), `makna` (satu entri per kunci alasan), `istilah` + `Baris.istilah`.
6. Buat adegan 2D untuk tiap aktivitas di `client/src/game/scenes/cerita/` dan daftarkan (bagian 4.2).
7. Siapkan seni nasabah & latar. **Episode kedua butuh perluasan kontrak dulu** (bagian 4.3). Tulis
   `panggung` dan cue adegan (masuk, pergi, dokumen, lokasi) di `episode.ts` (bagian 4.4).
8. Terjemahkan ke `teks.en.ts` dan `teks.zh.ts` (kunci, parameter, dan angka harus sama).
9. Tulis `episode/<id>/episode.test.ts` (bagian 8) dan tambahkan berkasnya ke skrip `test:client` di
   `package.json` (skrip itu berisi daftar berkas tes, bukan pola).
10. Buat dokumen tinjauan PIC Claim untuk episode ini (bagian 5), termasuk kalimat kartu akhir, arti istilah, alasan
    per opsi, dan arti kartu.
11. **Baru setelah lengkap dan lolos semua cek**, daftarkan di `client/src/cerita/episode/index.ts`. Episode
    yang belum didaftarkan tidak tampil sebagai kartu; halaman `/cerita` cukup menulis "Episode berikutnya
    sedang disiapkan".
12. Main sendiri sampai tiap akhir di HP emulasi (360×740 dan 390×844) dan desktop, dalam tiga bahasa, dengan
    gerak aktif dan dikurangi; periksa kartu akhir tiap aturan (checklist bagian 3a.5). Perluas `tools/uji-cerita.mjs`
    (`npm run test:cerita`) untuk episode baru; per 26 Sep malam skrip itu masih memeriksa layar akhir v1 dan perlu
    diperbarui dulu (`rancangan-mode-cerita.md` bagian 7).
13. Jalankan uji HP fisik dan uji pemula tanpa pendamping (`docs/cerita/UJI-PEMULA.md`) sebelum mengklaim episode
    membantu pemula belajar.

---

## 2. Berkas satu episode

| Berkas | Isi |
| --- | --- |
| `episode/<id>/episode.ts` | Objek `Episode`: graf node, bab, akhir, `paham`, `proses`, `catatan`, suasana, pemeran |
| `episode/<id>/teks.id.ts` | Naskah Indonesia (bahasa sumber). Satu kunci = satu kalimat utuh |
| `episode/<id>/teks.en.ts`, `teks.zh.ts` | Terjemahan dengan kunci & parameter yang sama |
| `episode/<id>/teks.ts` | Menggabungkan tiga tabel: `{ id, en, zh }` |
| `episode/<id>/aktivitas.ts` | `DefAktivitas` per aktivitas: misi sintetis (`MissionPublic`) + rubrik klien |
| `episode/<id>/episode.test.ts` | Validasi, penjelajahan semua jalur, jalur uji wajib |
| `game/scenes/cerita/<id>-<aktivitas>.ts` | Adegan 2D aktivitas (`SceneSpec`); AUTO-1: `auto1-bukti.ts`, `auto1-polis.ts` |
| `game/scenes/cerita/<id>.label.ts` | Label objek adegan en/zh; AUTO-1: `auto1.label.ts` |
| `docs/cerita/<id>.md`, `docs/cerita/TINJAUAN-PIC-CLAIM-<id>.md` | Rancangan & tinjauan materi klaim |

Bidang `Episode` yang sering terlupa:

| Bidang | Catatan |
| --- | --- |
| `versi` | Mulai 1. Naikkan bila perubahan membuat progres tersimpan tidak cocok (bagian 6) |
| `produk` | `AUTO` / `HVC` / `FIRE` / `CARGO` / `MIX` (label kartu dari kamus `cerita.produk.*`) |
| `durasiMenit` | Perkiraan jujur (AUTO-1: 8). Tampil "± n menit" di kartu |
| `pemeran` | Selain `pemain` & `narasi` (id itu dicadangkan). Nasabah `potret: 'nasabah'`, `diPanggung: true` |
| `nasabah` | Id pemeran yang suasananya dilacak |
| `suasana` | Urut menurun berdasarkan `min`; baris terakhir `min: -100` = "lainnya" |
| `latihanTerkait` | Nomor misi latihan (1–10). Sejak v2 **tidak ditampilkan** lagi (hanya divalidasi); saran latihan di layar akhir berasal dari `AturanAkhir.latihan` (paling banyak satu per akhir) |
| `kartuAkhir` | (v2) Aturan kartu akhir: judul hasil, satu sebab, satu pelajaran, titik ulang, latihan. Tanpa bidang ini kartu memakai judul & `ringkas` akhir tanpa pelajaran (bagian 3a.1) |
| `makna` | (v2) Makna tiap kunci alasan bagi "Lihat perjalananku": `membantu` / `perhatian` / `ralat` (bagian 3a.2) |
| `istilah` | (v2) Istilah yang dijelaskan di tempat: `{ id: { label, arti } }` (bagian 3a.3) |
| `migrasi` | `{ [versiLama]: (state) => stateBaru \| null }` bila progres lama bisa dipetakan |

---

## 3. Pola node, kondisi, dan efek

### 3.1 Konvensi kunci teks (dari `teks.id.ts`)

| Kunci | Arti |
| --- | --- |
| `<node>.<n>` | Baris ke-n (mulai 1) di node itu |
| `<node>.tanya` | Pertanyaan di atas tombol pilihan |
| `<node>.<pilihan>` | Ucapan pemain di tombol pilihan (sejak v2 tidak digemakan sebagai "Kamu: …"; dibaca ulang di Riwayat sebagai "Pilihanmu") |
| `<node>.<pilihan>.alasan` | Kalimat ajar: sebab perubahan perasaan nasabah (tampil netral sesudah reaksi) |
| `<node>.hasil.<n>.<m>` / `<node>.hasil.<n>.alasan` | Umpan balik aktivitas: cabang hasil ke-n, baris ke-m / alasannya |
| `kartu.<judul>.judul`, `kartu.<aturan>.sebab`, `kartu.<aturan>.pelajaran` | (v2) Kartu akhir (bagian 3a.1); judul boleh dipakai beberapa aturan |
| `istilah.<id>.label`, `istilah.<id>.arti` | (v2) Istilah di tempat (bagian 3a.3) |
| `akt.<akt>.alasan.<opsi>` | (v2) Alasan singkat per opsi aktivitas, tampil setelah dikirim (`alasanOpsi`) |
| `akt.<akt>.kartu.<baris>.arti`, `akt.<akt>.kartu.sub.arti` | (v2) Arti awam baris & subjudul kartu polis (`kartuArti`) |
| `bab.*`, `akhir.*`, `paham.*`, `proses.*`, `catatan.*`, `suasana.*`, `pemeran.*`, `akt.*`, `ep.*` | Metadata |

Kunci yang tidak lagi dipakai naskah **tidak dihapus**: pindahkan ke blok PENSIUN di akhir `teks.id/en/zh.ts` dan
daftar `KUNCI_PENSIUN` (bagian 6).

Satu-satunya parameter: `{nama}` (nama panggilan pemain). Pemain tidak disapa dengan sapaan bergender.
Jangan menyusun kalimat dari potongan kunci: urutan kata berbeda di en/zh.

### 3.2 Pembantu di `episode.ts`

Salin dua pembantu ini dari AUTO-1; keduanya menjaga konvensi kunci dan memberi `alasan` otomatis:

```ts
/** Baris ke-n node (kunci '<node>.<n>'); `istilah` = id istilah yang PERTAMA kali muncul di baris ini (v2). */
function b(node: string, n: number, siapa: Pembicara, ekspresi?: Ekspresi, jika?: Kondisi, istilah?: string[]): Baris
/** Pilihan (kunci '<node>.<id>'); efek yang mengubah kepercayaan otomatis diberi alasan '<node>.<id>.alasan'. */
function p(node: string, id: string, lanjut: string, efek?: Efek, jika?: Kondisi): Pilihan
/** (v2) Aturan kartu akhir: kunci 'kartu.<judul>.judul', 'kartu.<id>.sebab', 'kartu.<id>.pelajaran'. */
function aturan(id: string, akhir: string, judul: string, lain?: { jika?, ulang?, latihan? }): AturanAkhir
```

### 3.3 Dialog: baris bersyarat dan efek saat keluar

```ts
{
  id: 'b2-cerita', bab: 'menggali', latar: 'kantor', jenis: 'dialog',
  baris: [
    b('b2-cerita', 1, 'nasabah', 'lega', tanda('janji-awal')),       // reaksi atas janji di node sebelumnya
    b('b2-cerita', 2, 'nasabah', 'netral', tanda('pulih-komunikasi')),
    b('b2-cerita', 4, 'nasabah'),                                     // tanpa jika = selalu tampil
  ],
  efek: { catat: ['rencana-bengkel'] },   // diterapkan SEKALI saat pindah ke `lanjut`
  lanjut: 'b2-cerita-cabang',             // node cabang (bagian 3.6), lalu b2-saran
}
```

### 3.4 Pilihan (keputusan) dan node pemulihan

```ts
{
  id: 'b2-saran', bab: 'menggali', latar: 'kantor', jenis: 'pilihan',
  baris: [b('b2-saran', 2, 'nasabah', 'cemas')],
  tanya: 'b2-saran.tanya',
  pilihan: [
    p('b2-saran', 'bengkel', 'b2-bengkel-akibat', { kepercayaan: 1, pasang: ['perbaiki-dulu'], proses: { 'dokumentasi-dulu': 'keliru' } }),
    p('b2-saran', 'dokumentasi', 'b3-bukti-intro', { kepercayaan: 1, proses: { 'dokumentasi-dulu': 'tepat' }, paham: ['langkah-sekarang'] }),
  ],
},
// Pemulihan: mentor memberi isyarat, pemain boleh meralat (proses 'dikoreksi') atau bertahan.
{
  id: 'b2-bengkel-akibat', bab: 'menggali', latar: 'kantor', jenis: 'pilihan',
  baris: [b('b2-bengkel-akibat', 1, 'missRaksa', 'serius'), b('b2-bengkel-akibat', 2, 'nasabah', 'bingung')],
  tanya: 'b2-bengkel-akibat.tanya',
  pilihan: [
    p('b2-bengkel-akibat', 'koreksi', 'b3-bukti-intro', { kepercayaan: 0, cabut: ['perbaiki-dulu'], proses: { 'dokumentasi-dulu': 'dikoreksi' } }),
    p('b2-bengkel-akibat', 'biarkan', 'b3-seadanya', { kepercayaan: 0, pasang: ['bukti-seadanya'], proses: { bukti: 'keliru' } }),
  ],
},
```

Perhatikan pilihan `bengkel`: nasabah **senang** (+1) walau langkahnya **keliru**. Pemisahan komunikasi vs
proses sengaja dibuat terlihat.

### 3.5 Aktivitas dan cabang hasil

```ts
{
  id: 'b3-bukti', bab: 'bukti', latar: 'parkiran', jenis: 'aktivitas', aktivitas: 'bukti',
  baris: [b('b3-bukti', 1, 'nasabah', 'netral')],   // baris TERAKHIR juga tampil di kartu aktivitas
  hasil: [
    { jika: tanda('akt:bukti:tepat'), efek: { proses: { bukti: 'tepat' }, catat: ['bukti'] },
      umpanBalik: [{ siapa: 'missRaksa', ekspresi: 'tersenyum', teks: 'b3-bukti.hasil.1.1' }], lanjut: 'b3-bukti-tepat' },
    { // TERAKHIR tanpa jika = cadangan (sebagian, belum, jawaban kosong)
      efek: { proses: { bukti: 'keliru' }, catat: ['bukti'] },
      // v2: SATU kalimat mentor tentang akibatnya; foto mana + alasannya tampil per opsi di panel (alasanOpsi),
      // jadi jangan diulang di sini.
      umpanBalik: [
        { siapa: 'missRaksa', teks: 'b3-bukti.hasil.2.5', jika: ADA_BUKTI_TERLEWAT },       // salah satu lewat:<opsi>
        { siapa: 'missRaksa', teks: 'b3-bukti.hasil.2.4', jika: tidak(ADA_BUKTI_TERLEWAT) }, // >3 foto, tak ada yang terlewat
      ],
      lanjut: 'b3-bukti-kurang' },
  ],
}
```

Tanda hasil dipasang mesin setelah menilai: `akt:<id>:tepat|sebagian|belum` (akurasi ≥ 0,999 / > 0 / 0),
`akt:<id>:pilih:<opsi>` untuk tiap opsi yang dipilih, `akt:<id>:lewat:<opsi>` untuk tiap opsi benar yang
tidak dipilih. Awalan `akt:` dicadangkan (efek tidak boleh memasangnya).

### 3.6 Cabang otomatis dan akhir

```ts
{
  id: 'cabang-akhir', bab: 'menutup', jenis: 'cabang',
  cabang: [
    { jika: salahSatu(tanda('bukti-seadanya'), tanda('bukti-belum-lengkap')), lanjut: 'akhir-tertunda' },
    { jika: semua({ kepercayaan: { min: 3 } }, PAHAM_SEMUA), lanjut: 'akhir-tuntas' },
  ],
  lainnya: 'akhir-dingin',            // wajib; tiap cabang wajib punya jika
},
{ id: 'akhir-tuntas', bab: 'menutup', jenis: 'akhir', akhir: 'tuntas',
  baris: [b('akhir-tuntas', 1, 'nasabah', 'lega'), b('akhir-tuntas', 3, 'missRaksa', 'tersenyum', tanda('pulih-komunikasi'))] },
```

Urutan cabang = prioritas. AUTO-1 menaruh "bukti tidak lengkap" dan "ada janji" **sebelum** "tuntas", jadi
nasabah yang senang tetap tidak mendapat akhir baik bila langkah klaimnya keliru.

Node `cabang` juga dipakai di tengah cerita untuk baris yang hanya muncul di satu jalur **dan** efek yang harus
ikut jalur itu (efek tidak punya `jika`):

```ts
{ id: 'b2-cerita-cabang', bab: 'menggali', jenis: 'cabang',
  cabang: [{ jika: tanda('dengar-dulu'), lanjut: 'b2-cerita-bagian' }], lainnya: 'b2-saran' },
{ id: 'b2-cerita-bagian', bab: 'menggali', latar: 'kantor', jenis: 'dialog',
  baris: [b('b2-cerita', 6, 'nasabah', 'netral')],   // "pecahan penutup lampunya saya pungut"
  efek: { catat: ['bagian-disimpan'] },              // dicatat SETELAH Bu Rina menyebutnya
  lanjut: 'b2-saran' },
```

Pola yang sama untuk tanggapan yang bergantung keadaan: `b5-tutup/rangkum` → cabang `b5-rangkum` →
`b5-rangkum-jelas` (ringkasan diterima: memasang `langkah-berikut`) / `b5-rangkum-janji` / `b5-rangkum-bengkel`
(nasabah menanggapi dengan janji atau rencana lamanya: butir itu TIDAK dipasang).

### 3.7 Kondisi

| Bentuk | Benar bila |
| --- | --- |
| `{ tanda: 'x' }` | tanda `x` terpasang |
| `{ tidak: K }`, `{ semua: [K…] }`, `{ salahSatu: [K…] }` | logika biasa |
| `{ kepercayaan: { min?, maks? } }` | kepercayaan dalam rentang (batas ikut) |
| `{ paham: 'x' }` | nasabah sudah paham `x` |
| `{ proses: 'x', nilai: 'tepat' \| [...] }` | butir proses `x` bernilai salah satu nilai itu (belum tersentuh = tidak) |

Dipakai di: `Baris.jika` (variasi kalimat), `Pilihan.jika` (pilihan hanya muncul bila…), `CabangHasil.jika`,
dan cabang node `cabang`.

### 3.8 Efek

| Bidang | Arti |
| --- | --- |
| `pasang` / `cabut` | Tanda (tidak boleh sama dalam satu efek) |
| `kepercayaan` | Delta suasana nasabah. **Wajib** disertai `alasan` (pembantu `p()` mengisinya) |
| `alasan` | Kunci kalimat ajar (sebab-akibat) yang tampil ke pemain dengan gaya netral; arah naik/turun/tetap dari tanda delta hanya dicatat di riwayat, tidak ditampilkan sebagai warna atau kata. Wajib punya entri `makna` (bagian 3a.2) |
| `paham` | Butir kejelasan yang kini dipahami nasabah (bertambah, tidak pernah dicabut) |
| `proses` | `{ butir: 'tepat' \| 'dikoreksi' \| 'keliru' }`; nilai terakhir menang |
| `catat` | Butir Catatan kasus yang kini diketahui |

### 3.9 Perilaku mesin & tampilan yang memengaruhi penulisan

- **Efek hanya sekali, saat transisi.** Efek dialog diterapkan saat meninggalkan node. Memuat ulang, membaca
  riwayat, ketukan ganda, atau mengirim aktivitas dua kali tidak menerapkan apa pun lagi.
- **`Efek` tidak punya `jika`.** Untuk mencatat sesuatu hanya pada jalur tertentu, pisahkan baris & efeknya ke
  node sendiri yang dicapai lewat node `cabang` (contoh `b2-cerita-bagian`, bagian 3.6). Jangan memasangnya lebih
  awal di pilihan sebelumnya: Catatan kasus lalu menampilkan butir yang belum diucapkan nasabah (temuan AUTO-1
  gelombang 1).
- **Butir `paham` hanya dipasang oleh kalimat yang benar-benar menyampaikannya.** Contoh AUTO-1: `langkah-berikut`
  hanya dari penutup `rangkum`, dan hanya bila ringkasan itu diterima (`b5-rangkum-jelas`); jawaban jujur/ralat di
  `b5-keberatan` tidak menyebut urutan langkah, jadi tidak memasangnya. Bila nasabah masih memegang janji atau
  rencana lama, tanggapannya dibuat node sendiri tanpa butir itu.
- **Kalimat ajar (alasan) hanya tampil bersama baris PERTAMA node tujuan**, sesudah kalimat itu utuh (v2: tanpa
  gema "Kamu: …"; ucapan pemain hanya di Riwayat). Jadikan baris pertama node tujuan reaksi atas pilihan tadi, dan
  tulis reaksi itu sehingga pemain mengerti apa yang dipilihnya tanpa gema. Bila beberapa pilihan menuju node yang
  sama, pakai baris bersyarat (contoh `b5-tutup` baris 1–4).
- **Kalimat ajar = SATU kalimat** dari sudut nasabah yang menyebut sebabnya ("Bu Rina mulai tenang karena kamu
  menanyakan keadaannya lebih dulu."). Tampil netral (ikon info, tanpa hijau/merah, tanpa "Suasana membaik"), jadi
  kalimatnya sendiri yang harus menjelaskan arah; jangan menilai benar/salah langkah klaim di sini (itu bagian proses).
- **Kepercayaan 0 + alasan** = pemain melihat kalimat ajarnya saja (arah `tetap` tidak ditampilkan). Tanpa bidang
  `kepercayaan` tidak ada kalimat ajar yang tampil. Detektor cabang palsu menganggap 0 sama dengan tidak ada, jadi dua
  pilihan yang hanya beda alasan tetap dianggap cabang palsu.
- **Urutan pilihan di data = urutan tampil** (tidak diacak). Jangan selalu menaruh pilihan terbaik di depan.
- **Setiap node pilihan harus menyisakan ≥ 2 pilihan di SEMUA jalur**, termasuk setelah `Pilihan.jika` menyaring.
  Penjelajahan jalur memeriksanya.
- **Angka kepercayaan tidak pernah tampil**; pemain hanya melihat label suasana dan alasan.
- **Siapa hadir di panggung ditentukan cue adegan (v3, bagian 4.4)**, bukan kalimat: di AUTO-1 Bu Rina masuk pada
  narasi pintu (`b1-mentor.4`, aksi `masuk`) dan Miss Raksa sudah di meja sejak awal. Episode TANPA `panggung`
  memakai perilaku v2: nasabah muncul setelah ia bicara pertama kali. Pemain tidak pernah digambar (ia petugas di
  luar bingkai, sisi petugas); pemeran lain yang tidak ada di panggung tampil sebagai potret bulat di kotak dialog.
- **Label suasana di panggung mengikuti WAJAH yang tampil**, bukan angka kepercayaan: wajah = ekspresi baris
  nasabah terakhir yang sudah tampil di node kini (selain itu ekspresi suasana dari kepercayaan); kata labelnya
  diambil dari tabel `suasana` episode bila ekspresi itu ada di sana, selain itu dari kamus `cerita.ekspresi.*`.
  Jadi beri ekspresi pada baris nasabah yang reaksinya penting (mis. `bingung`), dan pakai ekspresi tabel suasana
  bila perasaannya memang "Tenang/Cemas/…".
- **Konvensi node akhir**: di node `akhir`, **baris narasi menandai pergantian adegan** (nasabah pergi, waktu
  berlalu, kabar lewat telepon), dan sejak v3 pergantian itu WAJIB ditulis sebagai cue pada narasi tersebut
  (`pergi`, `pindah` + `lewatTelepon`, atau `nasabah: null`; bagian 4.4). Validasi menolak nasabah yang duduk di
  kantor saat adegan telepon. Episode tanpa `panggung`: sesudah narasi pertama tampil, nasabah tidak lagi berdiri di
  panggung. Ucapannya tetap tampil dengan potret di kotak dialog. Jangan memakai narasi di epilog untuk hal lain. **Ucapan terakhir
  nasabah di epilog wajib berekspresi**: kartu akhir memakai ekspresi itu untuk potret nasabah, dan bila ucapan itu
  datang sesudah pergantian adegan, labelnya "Sesudahnya: …" (mis. "Sesudahnya: Kesal"); tanpa pergantian adegan
  "Bu Rina: …". Contoh AUTO-1: `akhir-janji` (pulang senang, beberapa hari kemudian menelepon dengan kesal).
- **Epilog dibaca sekali**: layar akhir v2 TIDAK mengulang epilog. Setelah baris epilog terakhir tombolnya "Lihat
  hasil", lalu kartu akhir. Jadi epilog harus sudah menceritakan akibatnya; kartu hanya merangkum sebabnya.
- **Latar**: node tanpa `latar` mewarisi latar node sebelumnya; node `mulai` wajib punya latar.
- **Bab**: saat pertama masuk sebuah bab, mesin menyimpan cadangan state untuk "Coba jalur lain" / "Coba lagi dari
  bagian X". Bab yang cadangannya langsung berupa node akhir tidak ditawarkan. Judul & kalimat tujuan bab tampil di
  pemilih bagian ("Bagian n: judul" + tujuan), jadi keduanya harus bisa dimengerti tanpa konteks.
- **Istilah hanya di kotak dialog**: baris node `aktivitas` tampil di kartu pengantar aktivitas, yang tidak memberi
  tombol "Apa itu …?"; tandai istilah di baris dialog sebelumnya (AUTO-1: `b4-polis-intro`, bukan `b4-polis`).
- **Aktivitas**: satu aktivitas dipakai tepat satu node. Hasilnya dinilai sekali dan disimpan; muat ulang saat
  umpan balik menampilkan pembahasan yang sama tanpa menilai ulang. Tidak ada timer.
- **Ganti bahasa di tengah episode aman**: state dan riwayat hanya menyimpan kunci teks.

---

## 3a. Layar akhir & alur belajar (v2): kartu akhir, makna, istilah, pilihan

Layar akhir v2 = SATU kartu (wajah akhir nasabah, nama akhir, judul hasil, satu kalimat sebab, satu pelajaran, dua
aksi, "Lihat perjalananku"). Isinya TIDAK dihitung dari angka kepercayaan atau urutan alasan, melainkan dari metadata
yang ditulis penulis episode. Kontrak lengkap: `docs/rancangan-mode-cerita.md` bagian 11.

### 3a.1 `kartuAkhir`: aturan kartu akhir

```ts
const dikoreksi = (p: string): Kondisi => ({ proses: p, nilai: 'dikoreksi' });
const KARTU_AKHIR: AturanAkhir[] = [
  // Urutan PENTING: aturan pertama yang akhir-nya sama dan jika-nya terpenuhi dipakai.
  aturan('tuntas-ralat-janji', 'tuntas', 'tuntas', { jika: dikoreksi('tanpa-janji') }),
  aturan('tuntas-jelas', 'tuntas', 'tuntas', { latihan: 5 }),                               // cadangan akhir tuntas
  aturan('janji-besok', 'janji', 'janji-waktu', { jika: tanda('janji-waktu'), ulang: [{ bab: 'menutup' }] }),
  aturan('janji-polis', 'janji', 'janji-polis', { ulang: [{ bab: 'polis' }], latihan: 5 }), // cadangan akhir janji
  aturan('dingin-ralat', 'dingin', 'dingin-jarak', {
    jika: salahSatu(dikoreksi('tanpa-janji'), dikoreksi('baca-polis'), dikoreksi('dokumentasi-dulu')),
    ulang: [                                          // kandidat titik ulang, dicoba urut
      { jika: semua(dikoreksi('tanpa-janji'), tidak(tanda('akt:polis:pilih:pasti-diganti'))), bab: 'menyambut' },
      { jika: dikoreksi('dokumentasi-dulu'), bab: 'menggali' },
      { bab: 'polis' },
    ],
  }),
  // …
];
```

- **Satu aturan = satu penjelasan** untuk satu akhir: `judul` (hasil dari sisi nasabah, ≤ 8 kata), `sebab` (SATU
  kalimat sebab-akibat tentang nasabah, ≤ 22 kata, menyebut keputusan pemain yang menyebabkannya), `pelajaran` (SATU
  kalimat 15–25 kata Indonesia yang bisa dibawa pulang, tanpa angka/ambang/tenggat baru). Batas kata dijaga tes
  (`hitungKata`).
- **Pilih dari keputusan nyata**: `jika` membaca tanda, `proses` (termasuk `dikoreksi`), atau `paham`. Jangan
  memakai `kepercayaan`: tes AUTO-1 mengubah angka kepercayaan dan membalik riwayat untuk memastikan kartu tidak
  berubah.
- **Urutan = prioritas, dan harus sama dengan epilog.** Aturan dievaluasi urut; tulis urutannya mengikuti baris
  bersyarat epilog node akhir itu, supaya kartu tidak membantah kalimat yang baru dibaca pemain (AUTO-1: janji waktu
  lebih dulu dari janji kartu, sama seperti `akhir-janji.3/.4`). Untuk akhir baik, tonjolkan ralat yang paling
  berpengaruh lebih dulu.
- **Wajib satu aturan cadangan tanpa `jika` per akhir**, diletakkan terakhir di antara aturan akhir itu (validasi:
  aturan sesudah cadangan tidak pernah dipakai = galat).
- **`ulang`** (hanya berarti untuk akhir yang belum baik): daftar kandidat `{ jika?, bab }` = bab tempat keputusan
  penyebabnya bisa diubah. Kandidat pertama yang `jika`-nya terpenuhi dipakai; bila bab itu tidak bisa diulang di
  perjalanan ini (`babBisaDiulang`), dipakai bab terakhir yang bisa diulang SEBELUM bab itu; tanpa kandidat cocok, bab
  terakhir yang bisa diulang. Akhir baik tidak punya titik ulang (pemain memakai "Coba jalur lain").
- **`latihan`**: paling banyak SATU nomor misi latihan yang benar-benar mengajarkan penyebabnya (AUTO-1: misi 1
  dokumentasi, 2 bukti, 5 kartu polis, 9 risiko sendiri). Validasi hanya memeriksa bilangan bulat ≥ 1, jadi pastikan
  misinya ada.
- Judul boleh dipakai bersama beberapa aturan (`aturan(id, akhir, judul)` → `kartu.<judul>.judul`); sebab & pelajaran
  selalu per aturan. Semua kalimat kartu masuk dokumen tinjauan PIC Claim.

### 3a.2 `makna`: arti tiap kalimat ajar bagi "Lihat perjalananku"

```ts
const MAKNA: Record<string, MaknaAlasan> = {
  'b1-datang.dengar.alasan': { nilai: 'membantu' },
  'b1-datang.janji.alasan': { nilai: 'perhatian', diluruskan: dikoreksi('tanpa-janji') },
  'b1-pulih.maaf.alasan': { nilai: 'ralat' },
  // … satu entri untuk SETIAP kunci alasan yang dipakai graf (AUTO-1: 28)
};
```

- `membantu` = langkah komunikasi yang baik; `perhatian` = yang perlu diperhatikan; `ralat` = pemain memperbaiki
  sesuatu (tampil di "Yang membantu" dengan tanda "Diperbaiki").
- **Arah suasana BUKAN ukuran benar.** Janji yang membuat nasabah lega tetap `perhatian`; ralat yang membuatnya kecewa
  sesaat tetap `ralat`.
- `diluruskan` (hanya untuk `perhatian`): kondisi di state AKHIR yang menandai kekeliruan itu sudah diperbaiki; bila
  terpenuhi, butir itu tidak tampil sebagai belum beres (ralatnya yang tampil).
- Validasi: setiap alasan graf wajib punya makna; makna untuk kunci yang tidak dipakai graf = galat. Tes episode juga
  memakai `makna` untuk aturan panjang pilihan (bagian 3a.4).

### 3a.3 `istilah`: arti di tempat, tanpa hover dan tanpa glosarium

- Daftarkan di `Episode.istilah` (`{ label: 'istilah.<id>.label', arti: 'istilah.<id>.arti' }`) dan tandai
  `Baris.istilah` (argumen ke-6 `b()`) di baris **PERTAMA** yang memakai kata itu **pada setiap jalur**. Bila jalur
  berbeda punya baris pertama berbeda, tandai semuanya (AUTO-1: risiko sendiri di `b4-polis-tepat.1`,
  `b5-keberatan.4`, dan `.7`).
- `label` = kata persis seperti tertulis di baris itu dalam tiap bahasa (tes: label harus termuat di teks baris
  bertanda, id/en/zh). `arti` = 1–2 kalimat kata sehari-hari, hanya dari materi yang boleh dipakai (bagian 5).
- Tulis kata sehari-hari lebih dulu bila muat di kalimatnya, istilah sesudahnya ("pelanggan asuransi (nasabah)", "dokumen perlindungan …
  kartu polis"). Jangan memakai istilah di pilihan sebelum istilah itu dijelaskan (AUTO-1 mengganti "nomor polis" di
  pilihan pertama menjadi "data asuransi").
- **Jangan** menandai baris node `aktivitas` (tidak ada tombolnya di kartu pengantar; tes menolak).
- Tombol "Apa itu …?" muncul setelah kalimat utuh; pemain tidak wajib membukanya. Tidak ada kuis.

### 3a.4 Pilihan & naskah: aturan panjang dan pengulangan

- 2–3 pilihan tampil di setiap titik; tiap pilihan **8–20 kata** (Indonesia).
- Tepat SATU pilihan yang menolong per titik (`makna` membantu/ralat), dan pilihan itu **tidak selalu yang
  terpanjang**: terpanjang di paling banyak separuh titik (AUTO-1: 3 dari 11). Samakan panjang, bukan maknanya;
  perbedaan makna & akibat tetap harus jelas.
- Opsi aktivitas pilih-satu: jawaban tepat bukan yang terpanjang (AUTO-1 kartu polis: 11 kata vs 13 & 12).
- Satu perkenalan peran di awal episode; masalah nasabah paling lambat baris ke-3. Halaman lain (kartu episode, kartu
  aktivitas) tidak mengulang peran & instruksi.
- Kartu aktivitas: `akt.<id>.instruksi` SATU kalimat (≤ 12 kata); instruksi/tanya/petunjuk/briefing/cerita/label dan
  tujuan bab tidak boleh berisi kalimat yang sama (dijaga tes).
- Buang baris yang mengulang baris sebelumnya atau kartu aktivitas; kuncinya dipensiunkan (bagian 6).
- Tes AUTO-1 yang menjaga semua ini ada di `episode.test.ts` ("v2 …"); salin untuk episode baru.

### 3a.5 Checklist kartu akhir (per aturan, sebelum mendaftarkan)

- [ ] Setiap keadaan akhir yang terjangkau mendapat aturan yang cocok dengan epilognya (bukan cadangan yang kebetulan).
- [ ] Judul hasil dari sisi nasabah; sebab menyebut keputusan pemain yang menyebabkannya, bukan hanya perasaannya.
- [ ] Pelajaran 15–25 kata, satu gagasan, bisa dipahami orang yang tidak kenal asuransi; tanpa janji hasil, tenggat,
      angka, atau prosedur baru; tercatat di dokumen tinjauan PIC Claim.
- [ ] Akhir yang belum baik: titik ulang = bab tempat keputusan penyebabnya bisa diubah, dan bab itu memang tersedia
      di jalur itu (tes `babBisaDiulang`).
- [ ] Paling banyak satu latihan; misinya ada dan relevan.
- [ ] Di 390×844 dan 360×740: judul hasil, pelajaran, dan KEDUA aksi terlihat tanpa gulir; ≤ 90 kata Indonesia di
      kartu termasuk label & catatan simulasi (tanpa mengecilkan huruf). Periksa juga en/zh (teks lebih panjang).
- [ ] "Lihat perjalananku" jujur: tidak ada langkah keliru di "Yang membantu", tidak ada langkah benar di "Yang perlu
      diperhatikan", kekeliruan yang sudah diralat tampil "Diperbaiki", langkah yang tidak dilakukan tampil "Belum
      dilakukan".
- [ ] Kata di kartu tidak memakai skor, poin, waktu, atau nilai; nasabah yang senang tidak disebut "benar".

---

## 4. Aktivitas, adegan, dan seni

### 4.1 Misi sintetis (`aktivitas.ts`)

- `misi(bahasa)` membuat `MissionPublic` yang dimainkan lewat `MissionPlay` yang sama dengan latihan misi.
  Id misi `cerita-<episode>-<aktivitas>` unik dan tetap; id langkah & opsi **sama di semua bahasa**.
- `kunci`: satu `StepKey` per langkah (bidang `explanation` diisi `''`, tidak dipakai). `penjelasan`: kunci teks
  per `stepId`. `ringkasan`, `labelKirim` ("Pakai foto ini"), `fokus` (`'baca'` = daftar dulu, `'adegan'` =
  gambar dulu).
- Jenis langkah: `single` dan `multi` memberi tanda `pilih:`/`lewat:` per opsi, jadi umpan balik bisa menyebut
  apa yang terlewat. `assign`, `order`, `number` hanya memberi `tepat|sebagian|belum`; penjelajahan jalur hanya
  mencoba jawaban rubrik dan jawaban kosong untuk jenis ini.
- `multi`: penjelajahan mencoba semua kombinasi berukuran `requiredSelections` (+ kosong), maksimal 5000
  kandidat per aktivitas. Jangan membuat opsi berlebihan.
- Kartu polis: **baris TANPA `flag`**. Flag ok/no membocorkan jawaban, dan chip "info" di setiap baris tampak
  seperti tombol bantuan padahal tidak bisa diketuk (tinjauan ux-cerita, 26 Sep). Urutan opsi di data diacak
  manual. Ikon opsi netral.
- (v2) **`alasanOpsi`**: `{ [idOpsi]: 'akt.<akt>.alasan.<opsi>' }` untuk SEMUA opsi langkah pilih-satu/pilih-banyak
  (tes AUTO-1 mewajibkan semuanya). Satu kalimat pendek kenapa opsi itu membantu atau tidak; tampil hanya SETELAH
  dikirim (kelompok "Yang membantu / Yang terlewat / Kurang membantu", atau "Kamu pilih / Yang tepat"), jadi boleh
  menyebut benar-tidaknya. Jangan mengulang kalimat yang sama di baris umpan balik mentor (`<node>.hasil.*`): pemain
  akan membacanya dua kali (masalah yang masih terbuka di AUTO-1, `rancangan-mode-cerita.md` 11.8).
- (v2) **`kartuArti`**: `{ [idKartu]: { sub?, baris: [kunci | null, …] } }`; `baris` sejajar dan sama panjang dengan
  `rows` kartu (validasi menghitungnya), `null` = baris tanpa arti (tidak bisa diketuk). Arti 1–2 kalimat awam yang
  hanya menjelaskan apa yang TERTULIS di kartu; tidak menambah cakupan, angka, atau syarat.
- (v2) Kartu tugas aktivitas: `akt.<akt>.instruksi` satu kalimat tugas (≤ 12 kata); kartu pengantar hanya
  menampilkan baris pengantar terakhir, tugas itu, dan Mulai (cara main, dokumen, dan kartu polis ada di layar
  menjawab). Kartu polis tampil di atas pilihan saat menjawab.
- (v2) **Menghapus opsi aktivitas** tanpa menaikkan versi: keluarkan dari misi, catat id-nya di `opsiPensiun` pada
  definisi aktivitas (saat ini perluasan tipe lokal di `aktivitas.ts`; `validasi.ts` membacanya lewat bentuk dan
  menolak opsi pensiun yang masih ditawarkan), pertahankan cabang hasil & baris umpan balik yang membaca
  `akt:<akt>:pilih:<opsi>`, dan pindahkan label opsinya ke blok PENSIUN (contoh AUTO-1: `ambang-tlo`).
- Pengecoh harus masuk akal secara pemeriksaan, bukan konyol: AUTO-1 memakai foto bagian mobil yang TIDAK rusak dan
  tidak menunjukkan identitas (`foto-ban` "Foto dekat ban depan", `foto-dasbor` "Foto dasbor dari jendela") plus
  `foto-menu` (turunan distraktor m02). Tiap opsi = objek adegan (kontrak 3.2), jadi mengganti pengecoh berarti
  mengubah `aktivitas.ts`, adegan, label en/zh, naskah umpan balik, dan dokumen tinjauan bersamaan.
- Rubrik ada di klien dan terbaca di bundel. Ini diterima karena materinya turunan Paket Latihan (kuncinya juga
  terbuka lewat latihan solo). **Jangan** menyalin soal/kunci Paket Acara (`a01`–`a10`) atau soal buatan
  panitia, dan jangan mengimpor `server/` atau `answerKeys`.

### 4.2 Adegan 2D

- Satu berkas per aktivitas di `client/src/game/scenes/cerita/`, mengekspor id misi dan fungsi yang
  mengembalikan `SceneSpec` (`missionId` = id misi sintetis). Objek merujuk opsi lewat `refId`. Contoh:
  `auto1-bukti.ts` (kamera bukti), `auto1-polis.ts` (meja + kartu polis sebagai dokumen).
- Label Indonesia di adegan; label en/zh di `<id>.label.ts` (batas yang diuji: en ≤ 20 huruf, zh ≤ 9 aksara).
- Daftarkan di `ADEGAN_CERITA` dan `LABEL_CERITA` (`scenes/cerita/index.ts`); keduanya otomatis masuk registri
  adegan & label utama.
- **`scenes/cerita/cerita.test.ts` saat ini mengunci daftar adegan = dua adegan AUTO-1** dan memeriksa tata letak
  per id. Saat menambah adegan, perluas tes itu (ulangi pemeriksaan untuk semua adegan terdaftar).
- Aturan yang dijaga tes: objek di dalam dunia, area ketuk ≥ 86 satuan, objek bersarang tidak saling menumpuk,
  label tidak bertumpuk (id/en/zh), petugas & properti tidak menutupi objek, kunci tekstur unik, kode adegan
  tidak mengimpor kode pertandingan atau kunci jawaban. Aturan umum adegan: README bagian 4a.

### 4.3 Seni nasabah & latar: perlu perluasan kontrak sebelum episode kedua

Keadaan sekarang (bukan pilihan desain jangka panjang):

- `IdLatar` hanya `'kantor' | 'parkiran'` (`tipe.ts`), digambar `cerita/seni/latar.ts`.
- `TokohNasabah` dan `PotretNasabah` **selalu menggambar Bu Rina** (tanpa parameter), dan dipakai panggung,
  kartu episode di `/cerita`, layar akhir, serta potret pembicara `potret: 'nasabah'`.

Jadi episode dengan nasabah atau lokasi lain butuh perubahan kontrak lebih dulu (keputusan pemilik kontrak):
tambah id latar di `IdLatar` + `DAFTAR_LATAR` + `seni/latar.ts`; buat seni nasabah bisa dipilih per episode
(mis. bidang baru `Pemeran.seni` + registri di `cerita/seni/`), lalu sesuaikan `Panggung`, `TokohNasabah`,
`PotretNasabah`, kartu di `pages/Cerita.tsx`, `validasi.ts` (daftar potret), dan `cerita.test.ts`.

Gaya seni (v4, pixel art): Miss Raksa dan Bu Rina adalah atlas PIKSEL + manifest
(`cerita/seni/piksel/{miss-raksa,bu-rina}.png/.json`) yang dibangun deterministik dari lembar sumber di `character/`
dengan `tools/piksel/*` (normalisasi grid, palet ≤ 40 warna, alpha biner, wajah terkunci: ekspresi/kedip/bicara/
mata-bawah hanya mengubah piksel wajah). Kontrak skala & manifest: `docs/cerita/aset/PIKSEL.md` (1 piksel seni = 4
satuan dunia; tampil hanya pada jumlah piksel perangkat bulat, nearest-neighbour). Penyusun murni
`cerita/seni/piksel/susun.ts` memetakan pose/ekspresi naskah ke frame; panggung, potret (skala bulat; < 44 px = ikon
kepala mini), kartu hub, dan sprite aktivitas memakai atlas yang sama. Ruang juga piksel (`seni/piksel/ruang-*.png`,
dirender dari `seni/ruang/*` oleh `tools/piksel/bangun-ruang.mjs`; tulisan papan dipanggang dari nama lokasi, jadi
bangun ulang bila nama atau `geometri.ts` berubah). Tokoh baru: siapkan lembar sumber (pose, ekspresi, gestur) dengan
wajah seukuran tokoh yang ada, proses dengan `tools/piksel`, lalu tulis manifest bentuk yang sama. Status & sisa:
`docs/cerita/KEBUTUHAN-ASET.md`. Seni SVG v3 (`seni/tokoh/missRaksa.ts`, `buRina.ts`) dan `cerita/seni/latar.ts`
hanya cadangan / episode tanpa `panggung`; jangan jadikan arah seni.

### 4.4 Adegan panggung v3: cue presentasi (`CueAdegan`)

Kontrak lengkap: `docs/cerita/ADEGAN-AUTO1.md`. Cue hanya PRESENTASI: gameplay (node, pilihan, tanda, efek,
penilaian) tetap sumber kebenaran, dan cue tidak mengubah `versi` episode maupun format simpanan.

**Tempat menulis.**
- `Episode.panggung`: `lokasi` (`{ nama, tema }`; satu nama per ruang, dipakai papan nama DAN parameter teks
  `{lokasi}`, yang diisi otomatis oleh `teks.ts`), `eksterior` (`null` = slot kosong; isi hanya dengan foto gedung
  yang terverifikasi, jangan menamai foto gedung generik), dan `awal` (komposisi sebelum baris pertama).
- `NodeDasar.adegan`: berlaku saat node dimulai (mis. semua node parkiran bab 3 memakai `DI_PARKIRAN`).
- `Baris.adegan`: berlaku saat baris itu tampil; tulis dengan pembantu `dgn(b(...), CUE)`. Simpan cue sebagai
  konstanta bernama di atas `episode.ts` (AUTO-1: `MASUK`, `KE_PARKIRAN`, `BUKA_KARTU`, `PERGI`, `TELEPON_MASUK`, …).

**Bidang.** `lokasi` (`meja` | `parkiran` | `telepon`; `pintu-luar` hanya untuk pembuka, bukan nilai cue),
`mentor` `{ pose?, pandang? }` atau `null` (tidak hadir), `nasabah` `{ pose?, pandang?, lewatTelepon? }` atau `null`,
`aksi` (`masuk` | `pergi` | `kartu` | `pindah`), `prop` (`kunci` | `kartu` | `telepon` → `tangan` | `meja` |
`tersimpan`). Bidang yang tidak ditulis mewarisi nilai sebelumnya; `null` = tidak hadir.

**Cara komposisi dihitung.** `adeganKini(ep, state)` (`cerita/ui/adegan.ts`, fungsi murni) melipat `awal` → cue node &
baris dari riwayat (dicari lewat node + kunci teks, TIDAK pernah lewat kalimat) → cue node kini → baris node kini yang
sudah tampil. Turunan otomatis bila baris tidak membawa cue:
- pose Miss Raksa duduk: `duduk-jelaskan` saat ia bicara berekspresi `serius`, selain itu `duduk-dengar`; pose gerak
  (`duduk-jelaskan`, `duduk-tunjuk`) hanya berlaku di baris yang membawanya;
- pandang: pembicara menatap lawan bicaranya; Miss Raksa bicara → ke pemain (baris untuk Bu Rina diberi
  `mentor: { pandang: 'lawan' }`); pemain bicara (baris, pilihan, jawaban aktivitas) → keduanya ke pemain; narasi →
  tatapan tetap;
- ekspresi: Bu Rina = ekspresi baris terakhirnya (lalu suasana); Miss Raksa bicara = ekspresi barisnya, mendengar =
  cermin wajah Bu Rina (kesal/cemas/bingung → prihatin, lega/senang/tersenyum → senyum).

**Aksi (sekali jalan).**
- Satu aksi per baris, hanya pada baris dialog/narasi (bukan cue node, `awal`, baris node aktivitas, atau umpan
  balik). Kuncinya `${episode}:${node}#${baris}@${langkah}`: panggung memutarnya sekali saat baris itu BARU dicapai.
  Muat ulang, ubah ukuran layar, ganti bahasa, dan membuka Bantuan/Riwayat/Catatan tidak memutar ulang; putar ulang
  bab menaikkan `langkah`, jadi aksinya boleh diputar lagi.
- `masuk` harus membuat nasabah hadir, `pergi` membuatnya `null`, `kartu` menaruh kartu di meja, `pindah` mengubah
  lokasi atau kehadiran (juga dipakai untuk lompatan waktu: panggung memudar, bukan tokoh lenyap).
- Bila `lokasi` berubah pada baris yang aksinya bukan `pindah` (AUTO-1 `b4-polis-intro.1`: kembali ke meja + kartu),
  panggung tetap memudar ke lokasi baru dulu, lalu memutar aksinya.
- Akhir animasi tidak pernah memajukan cerita, menilai, atau mengirim jawaban. Lanjut/Enter/ketuk saat animasi
  menyelesaikan gambar ke komposisi akhir lalu menjalankan Lanjut SEKALI; "Lewati pembuka" hanya menyelesaikan
  gambar. Gerak berkurang (`prefers-reduced-motion`) dan mode ringan langsung menampilkan komposisi akhir.

**Dijaga validasi (`validasi.ts`) dan tes (`cerita/ui/adegan.test.ts`).** Nilai cue dikenal; aksi hanya di baris dialog;
pose gerak/bingkai jalan tidak dipakai sebagai nilai cue; tiap aksi konsisten dengan isinya; parameter teks hanya
`{nama}` dan `{lokasi}`; analisis alur menandai nasabah yang muncul lagi tanpa `masuk`, bicara saat tidak hadir, duduk
di kantor saat adegan telepon, `masuk` saat sudah hadir, atau `pergi` saat sudah pergi. `adegan.test.ts` menjelajah
semua state yang terjangkau (AUTO-1: ± 20 ribu) dan memastikan komposisi murni & stabil setelah JSON. Perilaku di
browser (lewati, Lanjut cepat, Enter ditahan, ganti bahasa/ukuran saat gerak, tab tersembunyi, muat ulang di tengah
kedatangan, putar ulang bab, aset gagal, gerak berkurang): `node tools/uji-panggung.mjs`.

**Aturan naskah yang terkait.**
- Jangan mencocokkan kalimat (mis. "Pintu terbuka") untuk memicu gambar; pakai cue di baris itu.
- Ucapan pemain tetap ucapan pemain (label = nama pemain), tidak dipindahkan ke Miss Raksa, dan mentor tidak memilih
  jawaban.
- Tulis narasi yang sesuai dengan gambar: bila narasi menyebut pintu terbuka, baris itu membawa `masuk`; bila pilihan
  pemain menyuruh duduk, nasabah belum duduk (AUTO-1 v3: pilihan `b1-datang.dengar` tidak lagi berkata "Silakan duduk"
  karena Bu Rina sudah dipersilakan duduk saat masuk).
- Pose atau lokasi baru butuh seni lebih dulu (daftar pose yang ada: `PoseMentor`, `PoseNasabah` di `tipe.ts`; status
  aset: `KEBUTUHAN-ASET.md`).

**Checklist cue (per episode).**
1. `panggung.lokasi.nama` = satu nama ruang; tidak mencampur dua nama klub; tidak ada syarat keanggotaan, batas
   pertanggungan, atau janji fasilitas di teks yang memakai `{lokasi}`.
2. Baris pertama yang menghadirkan nasabah membawa `masuk`; setiap kepergian/lompatan waktu membawa `pergi` / `pindah`.
3. Setiap momen dokumen (kartu, foto) punya cue prop yang cocok dengan narasi.
4. `npm run test:client` (validasi + `adegan.test.ts`) hijau; tangkapan layar desktop 1440×900 dan HP 390×844 untuk
   momen masuk, reaksi, dokumen, dan akhir sudah dilihat.

---

## 5. Materi klaim dan tinjauan PIC Claim

**Sumber yang boleh dipakai:** materi Paket Latihan yang sudah ada (`shared/missions.ts` m01–m10: cerita,
kartu, tabel, opsi, `learning`, `rakiBriefing`, dan penjelasan pembahasannya) serta catatan simulasi ("Klaim
sebenarnya mengikuti polis dan pemeriksaan Raksa").

**Tidak boleh ada** (kecuali sudah dikonfirmasi tertulis oleh PIC Claim):

- janji hasil atau persetujuan klaim; kata "disetujui/ditolak" sebagai keputusan petugas; kewenangan petugas
  menyetujui/menolak;
- SLA, tenggat, atau jumlah hari; nominal, persentase, atau cara hitung baru;
- prosedur resmi baru (formulir, nomor laporan, dokumen wajib selain yang ada di materi);
- pembahasan pihak ketiga / tanggung gugat di luar kronologi; nama produk atau pasal polis sungguhan.

**Dokumen tinjauan per episode** (`docs/cerita/TINJAUAN-PIC-CLAIM-<id>.md`, format sama dengan AUTO-1):

1. Setiap kalimat atau pilihan yang menyentuh materi klaim: Kunci | Kalimat | Sumber | Jenis | Status.
   Jenis: **Turunan** (parafrasa sumber), **BARU** (tidak tertulis di sumber; paling perlu dicek),
   **Distraktor** (sengaja salah; pastikan salahnya jelas dan tidak menyesatkan di luar permainan).
2. Ringkasan kalimat BARU (N1, N2, …) di bagian atas.
3. Efek pilihan yang mengajarkan sesuatu (mis. ralat yang masih bisa berakhir baik), bukan hanya kalimatnya.
4. Hal yang sengaja tidak ada di naskah, pertanyaan untuk PIC Claim, istilah terjemahan (PIC & penutur asli),
   tabel tanda tangan.

Status "DRAF, belum ditinjau PIC Claim" dicatat juga di README (Batasan) sampai ditandatangani. Perubahan dari
PIC Claim cukup ditulis untuk teks Indonesia; terjemahan menyusul dengan kunci yang sama.

---

## 6. Versi dan migrasi progres

Progres tersimpan di perangkat (`localStorage['raksa:cerita']`, lihat `cerita/simpan.ts`). Saat episode dibuka,
`muatProgres` memeriksa versi, bentuk data, dan keberadaan node tempat pemain berhenti.

| Perubahan | Naikkan `versi`? | Yang terjadi pada progres lama |
| --- | --- | --- |
| Kalimat diperbaiki (kunci sama), terjemahan | Tidak | Lanjut normal |
| Baris ditambah/dihapus di sebuah node | Biasanya tidak | Lanjut; `jepitBaris` menjepit `baris` tersimpan (dan tiap cadangan bab) ke jumlah baris terlihat saat dimuat, jadi node yang dipendekkan tidak macet. Pemain yang sedang berada di node itu bisa melihat baris bergeser satu. Kunci baris yang dihapus dipensiunkan (di bawah) |
| Opsi aktivitas dihapus | Tidak, bila dipensiunkan | `opsiPensiun` + cabang hasil & kuncinya dipertahankan (bagian 4.1); simpanan lama yang memilih opsi itu tetap selesai |
| Node/pilihan baru tanpa menghapus/mengganti id lama | Biasanya tidak | Lanjut; pemain yang sudah lewat tidak melihat node baru |
| Id node dihapus/diganti | Ya | Pemain yang berhenti di node itu mendapat "node hilang" (terdeteksi walau versi tidak naik); titik "coba jalur lain" ke node itu dilewati |
| Arti tanda/efek/kondisi berubah, id bab/aktivitas/akhir berganti | **Ya** | Tanpa migrasi: pemain melihat dialog pemulihan |

- Dengan `migrasi[versiLama]`: fungsi menerima salinan state lama dan mengembalikan state baru (versinya diisi
  otomatis) atau `null`. Kuncinya versi **tersimpan**, tidak berantai: dari versi 1 ke 3 perlu `migrasi[1]` yang
  langsung menghasilkan state versi 3. Hasilnya divalidasi ulang; titik "coba jalur lain" yang node-nya hilang
  dilewati.
- Tanpa migrasi: layar "Progres lama tidak bisa dilanjutkan" dengan **Mulai ulang** (progres lama diarsipkan)
  atau **Kembali ke daftar**. Tidak ada penghapusan diam-diam; data yang tidak terbaca dicadangkan ke
  `raksa:cerita:rusak:<waktu>` sebelum ditimpa.
- Arsip (`arsip[]`, bidang `sebab`): perjalanan biasa yang diulang (`sebab: 'perjalanan'`, "Ulang episode" / "Main
  lagi dari awal") maks 5 per episode, yang terlama dirotasi. Progres tidak cocok (`sebab: 'versi' | 'rusak' |
  'node-hilang'`, dan entri lama tanpa `sebab`) **tidak pernah dirotasi**: dialog pemulihan menjanjikan progres itu
  tidak dihapus.
- Akhir yang pernah ditemukan disimpan terpisah dan bertahan; id akhir yang dihapus tidak lagi dihitung.
- Uji migrasi di tes episode: buat state versi lama, simpan, muat dengan episode baru.

**Kunci pensiun** (v2). Riwayat dan hasil aktivitas menyimpan KUNCI teks, jadi kunci yang dihapus dari naskah
membuat Riwayat simpanan lama menampilkan kunci mentah. Karena itu:

1. Pindahkan kunci itu (dengan kalimat terakhirnya) ke blok `PENSIUN` di akhir `teks.id.ts`, `teks.en.ts`, dan
   `teks.zh.ts`, dan tambahkan ke `KUNCI_PENSIUN` (`teks.id.ts`). Jangan dihapus.
2. Pastikan graf tidak lagi merujuknya (tes AUTO-1 "v2 pensiun": kunci pensiun tidak dirujuk graf, ada di tiga
   bahasa, parameternya terisi).
3. Bila yang dihapus baris node, `jepitBaris` menangani posisi; tulis tes muat simpanan di node itu (contoh
   `simpan.test.ts` "AUTO-1 v2: simpanan lama di node yang kini lebih pendek …").
4. Catat di dokumen tinjauan PIC Claim (AUTO-1: bagian P).

---

## 7. Checklist kualitas (sebelum mendaftarkan)

Dijaga otomatis oleh `validasiEpisode` + `jelajahiSemuaJalur` (tetap periksa pesannya):

- [ ] Semua rujukan node ada; semua node terjangkau; tiap node punya jalan ke akhir; semua jalur berakhir.
- [ ] ≥ 2 akhir berbeda yang terjangkau (AUTO-1: 5).
- [ ] Tanpa cabang palsu: pilihan dalam satu node punya akibat (lanjut/efek) berbeda.
- [ ] Tiap node pilihan menyisakan ≥ 2 pilihan di semua jalur.
- [ ] Tiap perubahan kepercayaan punya alasan; kunci teks lengkap di id/en/zh; parameter dan angka sama.
- [ ] Cabang hasil aktivitas terakhir tanpa `jika`; rubrik cocok dengan misi; id misi unik.
- [ ] (v2) `kartuAkhir`: id unik, tiap akhir punya aturan cadangan (terakhir), bab `ulang` ada, kunci & kondisi sah.
- [ ] (v2) `makna` untuk setiap alasan graf, tanpa makna yatim; `diluruskan` hanya untuk `perhatian`.
- [ ] (v2) `Baris.istilah` merujuk id di `istilah`; `alasanOpsi`/`kartuArti` merujuk opsi, kartu, dan jumlah baris
      yang ada; opsi pensiun tidak lagi ditawarkan.

Dijaga tes episode (salin pola `episode/auto-1/episode.test.ts` "v2 …" dan `ui/tinjauan.test.ts`):

- [ ] Semua keadaan akhir terjangkau punya aturan kartu, titik ulang yang bisa diulang (akhir belum baik), dan
      tinjauan jujur; pelajaran 15–25 kata, sebab ≤ 22, judul ≤ 8.
- [ ] Pilihan 8–20 kata, 2–3 tampil, pilihan yang menolong tidak selalu terpanjang; istilah di baris pertama
      pemakaiannya; kalimat aktivitas tidak mengulang; kunci pensiun terbaca.

Diperiksa manusia (penulis + peninjau):

- [ ] **≥ 3 keputusan bermakna**: pilihan yang mengubah jalan cerita, akhir, atau ringkasan, bukan sekadar variasi
      kalimat.
- [ ] **≥ 2 akhir yang benar-benar berbeda** maknanya, termasuk akhir baik yang tidak memenuhi semua harapan
      nasabah (AUTO-1: mobil belum beres, tetapi Bu Rina tahu langkahnya).
- [ ] **Jalur pemulihan**: kesalahan komunikasi dan kesalahan proses masing-masing bisa diperbaiki (proses
      `dikoreksi`), dan perbaikan itu terlihat di ringkasan ("Diperbaiki", bukan "Tepat").
- [ ] **Pilihan masuk akal untuk orang dewasa**: tiap pilihan keliru adalah kesalahan yang wajar dilakukan
      petugas sungguhan (terburu-buru, ingin menyenangkan, berlindung di balik aturan), bukan pilihan konyol.
      Pengecoh aktivitas juga harus menuntut pertimbangan (mis. foto bagian mobil yang tidak rusak), bukan lelucon.
- [ ] **Tanpa cabang palsu yang lolos validasi.** Validasi hanya melihat efek & tujuan, jadi periksa juga apa yang
      DILIHAT pemain dan apakah keputusan itu mengubah akhir. Dua contoh AUTO-1 yang lolos validasi tetapi
      tertangkap tinjauan (26 Sep): (1) `b3-bukti-kurang`: `lengkapi` dan `cukup` punya efek berbeda tetapi keduanya
      langsung ke meja polis dengan kalimat yang sama, jadi pemain tidak melihat akibat apa pun (kini `b3-lengkapi` /
      `b3-cukup`); (2) di jalur terbaik, menutup dengan `singkat` ("nanti dikabari") tetap berakhir "Didengar dan
      Jelas" dan menandai "Sudah paham: langkah berikutnya", karena jawaban `jujur` sebelumnya sudah memasang
      `langkah-berikut`; keputusan penutup tidak berakibat (kini butir itu hanya dari ringkasan yang diterima).
- [ ] **Kalimat ajar (alasan)** = satu kalimat dari sudut nasabah yang menyebut sebabnya ("Bu Rina mulai tenang
      karena kamu menanyakan keadaannya lebih dulu."), tanpa angka, tanpa kata "suasana membaik/memburuk", dan
      tanpa menilai langkah klaim.
- [ ] **Satu penjelasan per akibat**: reaksi tokoh + paling banyak satu kalimat ajar; baris mentor di umpan balik
      aktivitas tidak mengulang alasan per opsi yang tampil di bawahnya.
- [ ] **Kartu akhir**: checklist bagian 3a.5.
- [ ] **Komunikasi dan proses dipisah**: ada pilihan yang menyenangkan nasabah tetapi langkahnya keliru, dan
      sebaliknya; urutan `cabang` akhir tidak memberi akhir baik hanya karena nasabah senang.
- [ ] **Tanpa janji, SLA, atau kewenangan karangan**; semua kalimat materi klaim tercatat di dokumen tinjauan.
- [ ] Mentor memberi arah tanpa membocorkan jawaban aktivitas.
- [ ] Baris pertama tiap node tujuan pilihan = reaksi atas pilihan itu (tanpa gema "Kamu: …", reaksi itulah yang
      memberi tahu pemain apa yang baru ia katakan); baris terakhir sebelum aktivitas = pengantar yang berguna (tampil
      lagi di kartu aktivitas).
- [ ] Kalimat pendek (satu-dua kalimat per baris) dan terbaca di HP 360×740 dalam tiga bahasa.
- [ ] Tiap bab punya satu kalimat tujuan; `durasiMenit` sesuai hasil main sungguhan.
- [ ] Tidak ada nama orang atau merek sungguhan selain tokoh Raksa yang sudah disetujui.

---

## 8. Cek dan tes

```bash
npm run typecheck          # nol galat
npm run test:client        # termasuk validasi, mesin, simpan, adegan cerita, kartu akhir (tinjauan), tes episode, terjemahan
npm test                   # server + client
npm run test:cerita        # browser (prasyarat: README, bagian pengujian browser); v2: kartu akhir, tinjauan, aktivitas, istilah
```

`client/src/cerita/seni/seni.test.ts` (potret) dan `client/src/cerita/ui/hasilAktivitas.test.ts` (rincian per opsi) ikut
`test:client`.

Pembantu tes bersama: `client/src/cerita/uji/jalurEpisode.ts` (`mainkanJalur`, `jawab`, `titikKeputusan`,
`intiState`, `bekukan`, …) menjalankan jalur lewat mesin sungguhan seperti pemain dan melempar galat yang menyebut
node bila jalur putus. Contoh lengkap: `episode/auto-1/episode.test.ts` (validasi, konsekuensi tiap keputusan,
tanpa cabang palsu di setiap titik, muat ulang di setiap langkah, aksi ganda, kemurnian, bahasa, aktivitas,
jawaban kosong, coba jalur lain). Kerangka minimum `episode/<id>/episode.test.ts` (dicoba terhadap AUTO-1 pada
26 September 2026, lulus):

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { jawab, mainkanJalur } from '../../uji/jalurEpisode';
import { jelajahiSemuaJalur, validasiEpisode } from '../../validasi';
import { EPISODE_X as EP } from './episode';

test('episode sah', () => assert.deepEqual(validasiEpisode(EP), []));

test('semua jalur berakhir dan semua akhir tercapai', () => {
  const h = jelajahiSemuaJalur(EP);
  assert.deepEqual(h.masalah, []);
  for (const a of Object.keys(EP.akhir)) assert.ok((h.akhir[a] ?? 0) > 0, `akhir ${a} tidak tercapai`);
});

test('jalur uji wajib: terbaik -> tuntas', () => {
  // Pilihan = 'node/pilihan'; aktivitas = jawab(node, { stepId: opsi }) (multi = daftar opsi).
  const { state } = mainkanJalur(EP, [
    'b1-datang/dengar',
    'b2-saran/dokumentasi',
    jawab('b3-bukti', { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] }),
    jawab('b4-polis', { penjelasan: 'bisa-dinilai' }),
    'b5-keberatan/jujur',
    'b5-tutup/rangkum',
  ]);
  assert.equal(state.akhir, 'tuntas');
});
```

Satu tes per jalur uji wajib di dokumen rancangan episode, termasuk tiap jalur pemulihan. Untuk kartu akhir, salin
pola `cerita/ui/tinjauan.test.ts` (fungsi `semuaAkhir()` menjelajahi semua keadaan akhir, termasuk beda tanda `akt:`,
lalu memeriksa `kartuAkhir` & `tinjauanPerjalanan` di masing-masing).

Ukuran penjelajahan sebagai patokan (AUTO-1, 34 node): sebelum v2 12.900 jalur lengkap, 73.078 keadaan, ±0,4 detik;
sesudah v2 (opsi `ambang-tlo` pensiun, diukur 26 September 2026 malam) **9.428 jalur, 55.046 keadaan, ±0,3 detik**.
Batas bawaan 1.000 langkah per jalur dan 200.000 keadaan; bila terlampaui, penjelajahan melaporkan
masalah. Keadaan dibedakan hanya oleh bagian state yang bisa memengaruhi masa depan (node, kepercayaan, serta
tanda/paham/proses yang dirujuk suatu kondisi), jadi ledakan biasanya berasal dari terlalu banyak tanda yang
diperiksa kondisi, rentang kepercayaan yang lebar, atau aktivitas `multi` dengan opsi berlebihan.

---

## 9. Peta: misi latihan → episode berikutnya (USULAN)

Belum dibuat, tidak terdaftar, dan belum dibahas dengan PIC Claim. Tiap usulan memakai materi misi latihan
yang disebut; semua butir di kolom terakhir wajib ditanyakan sebelum naskah ditulis.

| Usulan | Misi sumber | Nasabah & peran | Keputusan inti yang mungkin | Aktivitas (misi sintetis) | Perlu dikonfirmasi PIC Claim |
| --- | --- | --- | --- | --- | --- |
| **HVC-1 "Excavator Tergelincir"** (HVC) | m04 (4 informasi: identitas/nomor seri, posisi unit, bagian rusak, keterangan operator), m09 (risiko sendiri) | Pengawas lapangan kontraktor, dikejar jadwal proyek; operator sebagai saksi yang takut disalahkan | Menenangkan tanpa menyalahkan operator; mengumpulkan empat informasi sebelum unit dipindah/diperbaiki; menolak menjanjikan unit cepat beroperasi; menjelaskan risiko sendiri tanpa angka baru | Temukan 4 informasi di lokasi proyek (`multi`, pola m04) | Istilah identitas unit (nomor seri vs nomor rangka); boleh tidaknya petugas layanan menjelaskan hitungan risiko sendiri m09; apakah menyarankan unit tidak dioperasikan sebelum diperiksa boleh diucapkan petugas |
| **HVC-2 "Forklift Terbentur"** (HVC) | m08 (benturan vs keausan, kartu HVC "keausan bertahap dikecualikan", perlu pemeriksaan teknis), m09 | Kepala gudang yang yakin semua kerusakan akibat benturan | Memisahkan kerusakan baru, kondisi lama (catatan servis), dan yang perlu pemeriksaan teknis; menyampaikan bahwa sebagian mungkin tidak terkait kejadian tanpa memutuskan jaminan sendiri | Klasifikasi bukti (`assign`, pola m08; hanya tepat/sebagian/belum) | Cara petugas layanan menyampaikan "kondisi sebelum kejadian" tanpa terdengar menolak; siapa yang melakukan pemeriksaan teknis (jangan dikarang) |
| **FIRE-1 "Ruko Setelah Kebakaran"** (FIRE/PROPERTY) | m03 (laporan awal: kronologi, foto kerusakan, daftar barang terdampak, estimasi kerugian; lokasi sudah aman) | Pemilik toko di ruko, terguncang, ingin segera bersih-bersih dan buka lagi | Empati dan keselamatan dulu; tidak membuang barang rusak sebelum didokumentasikan; menyusun empat isi laporan; tidak menaksir nilai kerugian untuk nasabah | Masukkan dokumen ke folder sesuai checklist (`multi`, pola m03; checklist wajib terbaca lewat HTML) | Siapa yang menyusun estimasi kerugian; apakah bersih-bersih/membuang barang perlu menunggu; dokumen lain (mis. keterangan pihak berwenang) hanya bila ada di materi resmi |
| **CARGO-1 "Peti yang Kurang"** (CARGO) | m06 (10 peti dikirim, 8 diterima, 2 kemasan rusak; dokumentasikan ketidaksesuaian & lengkapi dokumen pengangkutan) | Staf penerima barang di gudang pelabuhan, marah pada pengangkut | Tidak ikut menyalahkan pengangkut; membandingkan dokumen; tidak menyimpulkan "dibayar penuh" atau "tolak saja"; mencatat ketidaksesuaian | Bandingkan dokumen, dua angka + tindak lanjut (`number` + `single`, pola m06) | Istilah dokumen serah terima & catatan keberatan; ada/tidaknya batas waktu pemberitahuan (JANGAN dikarang); peran pengangkut dalam cerita |
| **FIRE-2 / MIX "Banjir di Gudang dan Kompleks"** (FIRE, MIX) | m07 (perluasan banjir tercantum + periode polis), m10 (tiga aset: mobil "banjir tidak tercakup pada kartu", alat berat nomor seri beda → klarifikasi, gudang lengkap → survei) | Pengelola kompleks usaha dengan tiga aset, ingin satu jawaban untuk semuanya; cocok sebagai episode penutup | Memisahkan per aset dan per kartu; menyampaikan kabar tidak enak (di luar jaminan kartu simulasi) dengan jujur tanpa bertindak sebagai pemutus; meminta klarifikasi identitas unit; memeriksa periode polis | Pilih polis + alasan (`single` ×2, pola m07); tiga tahap per aset (`assign`, pola m10) | Kalimat petugas layanan untuk "di luar jaminan yang tercantum" tanpa kesan menolak klaim (kewenangan); istilah "perluasan"; siapa yang meminta klarifikasi nomor seri |

Catatan lintas usulan:

- Semua usulan butuh seni nasabah & latar baru, jadi perluasan kontrak di bagian 4.3 harus selesai dulu.
  Latar bisa diturunkan dari latar misi yang sama (proyek, gudang forklift, ruko, pelabuhan, gudang/kota banjir),
  seperti parkiran AUTO-1 diturunkan dari m01.
- Mentor tetap Miss Raksa. Butir `proses` sebaiknya memakai langkah materi misi sumber (mis. "empat informasi
  pemeriksaan", "pisahkan kondisi sebelum kejadian"), `paham` memakai hal yang perlu dipahami nasabah.
- AUTO lanjutan (m05 kartu TLO, ambang 75%) juga mungkin, tetapi belum diusulkan rinci.
