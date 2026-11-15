# Miss Raksa v3 (ARSIP): generator SVG

> **ARSIP (28 September 2026):** pemilik menolak seni SVG v3 ini (wajah terlihat menyeramkan/kaku, tangan tidak natural).
> Seni aktif kini PIXEL ART: lihat [`MISS-RAKSA-PIKSEL.md`](MISS-RAKSA-PIKSEL.md), [`BU-RINA-PIKSEL.md`](BU-RINA-PIKSEL.md),
> [`PIKSEL.md`](PIKSEL.md). Generator SVG di bawah hanya cadangan terakhir; jangan dijadikan arah seni.

Status 27 September 2026, **putaran 5** (perbaikan terakhir dari juri ke-3; bentuk wajah tidak dirombak): generator
final (sumber/master tunggal untuk panggung, potret, dan sprite aktivitas). Putaran 3 mengerjakan daftar juri ke-2
(rahang, mata "glam", kerah, alis, hidung, kulit/rona, lengan sembah, jas, potret kecil, bibir, sanggul). Putaran 4:
lengan jauh sembah utuh dari sendi, telapak mempersilakan menjauh dari tepi kanvas, dua kaki pada pose duduk, mata potret
kecil lebih ringan. Putaran 5: wajah mendengarkan di panggung lebih hangat (mata terbuka ke Bu Rina, senyum tipis pada
dengar, pangkal alis naik pada prihatin), sorot mata tetap tampak di HP, potret 28/32/44 px dengar/prihatin/serius
dilebihkan, potret tanpa id per pemasangan (heap), lengan bawah jauh sembah lebih mendatar. Kemiripan dengan foto #6
**belum dinilai oleh pemilik/manusia**; juri ke-3 (putaran 4) menilai wajah masih TIDAK dapat dikenali sebagai #6 dari
wajahnya saja. Daftar ketidakcocokan ada di bawah. Kontrak: `docs/cerita/ADEGAN-AUTO1.md` bagian 6–7.
Ukuran acuan foto #6 (titik wajah orang sungguhan) sengaja TIDAK disimpan di repo publik; tersimpan sebagai bahan kerja
lokal di luar repo (lihat catatan serah terima v3). Yang ada di repo hanya proporsi gambar di `missRaksa.ts`.

| Berkas | Isi |
| --- | --- |
| `client/src/cerita/seni/tokoh/missRaksa.ts` | **Master.** `gambarMissRaksa(opsi)`, `potretMissRaksa`, `aturanPotret` (+ tipe `AturanPotret`), `JENDELA_POTRET_KECIL_MR`, `JENDELA_POTRET_SEDANG`, `POTRET_MINI_MAKS_PX`, `POTRET_SEDANG_MAKS_PX`, `wajahDari`, `GARIS_SIKU`, `garisBantuKepala` (lembar perbandingan), `WARNA`, `SERAGAM`, `PUTAR_LEHER`. |
| `client/src/cerita/seni/tokoh/gaya.ts` | Gaya bersama kedua tokoh (palet garis/bayang, arah cahaya, kurva ringkas, pita, proyeksi kepala 2,5D, gradien tanpa filter, cache LRU). Putaran 2–5 tidak mengubahnya. |
| `client/src/cerita/seni/tokoh/PotretMissRaksa.tsx` | Potret bulat React `<PotretMissRaksa ekspresi ukuran label? className? pandang?>` (API tetap; `data-rinci` `mini`/`kecil`/`normal`, `data-jendela` `kecil`/`sedang`/`v3`). Putaran 5: gambar dibuat tanpa id lalu diberi awalan per salinan (`awalanId`), galat → siluet → huruf "M". |
| `client/src/cerita/seni/tokoh/missRaksa.test.ts` | 13 uji (1 120 kombinasi pose × ekspresi × pandang × bicara/kedip/kecil + aturan potret 28–150 px + varian + dua kaki di semua pose + marjin telapak mempersilakan + potret tanpa id/`awalanId` + sorot mata di dalam bukaan untuk 5 wajah × 4 pandang × normal/kecil). |

Tidak ada foto orang sungguhan, raster, atau `<filter>` di repo. Titik ditulis tangan dari pengukuran foto #6 yang
dicerminkan (tidak ada vektorisasi otomatis). **Master = kode generator**: tidak ada berkas gambar master terpisah;
SVG dibuat saat dipanggil (di-cache).

## Pemakaian

```ts
import { gambarMissRaksa, potretMissRaksa, aturanPotret } from './missRaksa';
const g = gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan', bicara, kedip, kecil, id: 'mr1' });
// g.svg (isi <svg viewBox="0 0 g.w g.h">), g.jangkar, g.kepala, g.tangan?.kiri/kanan, g.diAtasMeja? (pose duduk)
const p = potretMissRaksa({ ekspresi: 'tersenyum', ukuran: 44 }); // p.svg + p.viewBox (jendela dipilih dari ukuran), id bawaan 'mr'
const salinan = awalanId(p.svg, 'pmr1'); // ui/panggung/dunia.ts: id unik per salinan tanpa entri cache baru
```

Untuk komponen yang dipasang berkali-kali (potret dialog/riwayat, panggung): panggil generator **tanpa** `id` (satu
entri cache per ekspresi × pandang × versi) lalu beri awalan per salinan dengan `awalanId`. `id` per pemasangan masuk
ke kunci cache, jadi setiap pemasangan membuat entri baru (± 45 KB) sampai cache LRU 96 penuh.

- **Kanvas & jangkar** = `ukuran.ts`: berdiri 420 × 1000, telapak (210, 985), kepala (210, 120); duduk 460 × 900,
  pinggul (230, 560), kepala (230, 150). Tinggi kepala (puncak rambut → dagu) ± 130 satuan.
- **Pose**:
  - `berdiri-sambut`: sembah seperti #6. Lengan jauh utuh dari sendi: bahu (259, 242) → siku (328, 368) di luar
    siluet pinggang atas → pergelangan (296, 350); lengan bawah naik ± 30° (putaran 4: ± 46°, siku 18 satuan lebih
    rendah) ke manset putih tepat di bawah telapak (kancing di ujung manset).
  - `berdiri-persilakan`: lengan dekat menyeberang di depan pinggang dan lengan jauh terentang; kedua telapak terbuka
    menghadap atas ke arah kursi. Pose dari `rsc-persilakan.png` dicerminkan, hanya acuan pose. Ujung jari >= 8 satuan
    dari tepi kanan kanvas 420 (terukur 11,3 satuan pada raster 4 ×).
  - Pose duduk: dua betis (jauh sedikit ke kanan & lebih gelap, dekat di depannya) + dua sepatu, rok pensil berakhir
    di lutut. Di panggung tertutup meja; terlihat pada ekspor sprite tanpa meja.
  - `berdiri`: tangan bertaut di depan perut.
  - `duduk-dengar`: lengan bawah di meja, tangan bertumpuk.
  - `duduk-jelaskan`: siku jauh di meja, lengan bawah terangkat, telapak terbuka menghadap atas ke arah nasabah
    (menerangkan, bukan melambai).
  - `duduk-tunjuk`: telunjuk lurus ke arah kartu. Tangan jauh di pangkuan (tertutup meja), supaya tunjukan terbaca.
    Pandang bawaan `bawah`.
  - `telepon`: siku terangkat ke depan, lengan bawah naik ke telinga dekat, tangan menggenggam **gagang yang digambar
    pose ini** (panggung tidak menggambar gagang). Mulut tetap terlihat. Tangan jauh rebah di meja.
- **Wajah** (`wajahDari`): netral→dengar, tersenyum/senang→senyum, cemas/bingung→prihatin, serius/kesal→serius,
  lega→lega. Baris Miss Raksa di naskah AUTO-1 memakai netral, tersenyum, serius. Saat MENDENGARKAN, panggung
  (`ui/adegan.ts` `wajahMendengar`) memilih wajahnya dari ekspresi Bu Rina: kesal/cemas/bingung → prihatin, lega →
  lega, senang/tersenyum → senyum, lainnya → dengar. Jadi kelima wajah tampil saat bermain (lega mis. pada `reaksi` &
  `kartu`, prihatin pada `pintu` & `datang`). Yang berubah: mata (kelopak atas/bawah sebagai pecahan bukaan), alis,
  mulut, rona pipi, kemiringan & anggukan kepala. Tanpa simbol.
  - Putaran 5 (juri ke-3: dengar/prihatin + `lawan` terbaca dingin/angkuh): dengar = senyum lembut (lengkung 0,6 →
    1,9, mulut sedikit lebih lebar, pipi 0,25 → 0,5, kelopak bawah sedikit naik); prihatin = mata terbuka (kelopak
    luar 0,24 → 0,04, kelopak atas 0,08 → −0,04), pangkal alis naik lebih jelas (−3,6 → −4,8), ekor alis 1,8 → 1,4,
    mulut lebih lebar & hampir datar (−1,5 → −0,2), angguk 5 → 2; serius tetap berbeda: mulut lurus, alis datar &
    turun, kelopak 0,16 → 0,2 (sedikit menyipit); lega: kelopak 0,4 → 0,3. Kelopak atas total (raut + pandang)
    dibatasi 0,34, bayang kelopak di bola mata lebih tipis (2,6 × 50 % → 2 × 40 %), sorot mata sedikit lebih besar
    (r 1,05/0,88, 78 %) dan selalu di bawah garis kelopak atas, supaya iris & sorot tetap tampak di HP.
- **Pandang**: `lawan` (toleh 31°), `pemain` (9°), `bawah` (26° + menunduk 11°), `depan` (20° = pose foto). Titik 3D
  yang sama diputar ulang: orangnya sama di semua arah. `bawah` (momen kartu) = membaca dengan perhatian: kelopak
  turun 0,15 (dulu 0,3), iris lebih ke bawah daripada ke samping, alis naik 0,8, sudut bibir disejajarkan dengan garis
  mata (tidak menyeringai). `lawan` (putaran 5): kepala sudah menoleh ke Bu Rina, jadi iris hanya sedikit ke samping
  (0,22 → 0,12 lebar mata; di sudut mata terbaca melirik), sedikit naik (irisY 0,1 → −0,35), kelopak atas −0,08, alis
  naik 0,3, tanpa angguk (1 → 0).
- **`bicara`** (mulut terbuka + gigi atas) dan **`kedip`** (mata tertutup): hanya mulut/mata yang berubah. Badan,
  lengan, tangan, titik tangan, dan `diAtasMeja` identik (diuji), jadi salinan varian panggung bisa ditumpuk.
- **`kecil`**: garis ± 2,3 ×, mata 1,32 × (putaran 4: iris 0,8 × dan dijepit di dalam bukaan dengan celah sklera
  >= 22 % lebar mata di KEDUA sisi; sklera terang #f7efea; garis mata atas 0,8–1,4 (dulu 1,25–2,1) dengan sayap
  pendek; garis bawah tipis cokelat 42 % (dulu cincin gelap 62 %); bayang kelopak di bola mata 1,6 × 28 % (dulu
  2,6 × 50 %)), alis 1,18 × (tebal 1,45 ×), mulut 1,4 × di sekitar pusatnya. Perbedaan antarwajah dibesar-besarkan
  dengan nilai MUTLAK (putaran 5; tidak lagi turunan raut normal): serius = alis DATAR & turun [2,4 / 3,8 / 2,2] +
  mulut lurus tipis agak pendek + kelopak sedikit menyipit; senyum = sudut bibir naik + pipi naik, mata tetap terbuka;
  dengar = alis santai sedikit naik + senyum tipis lebar (lengkung 2,6), tanpa mata melotot; prihatin = pangkal alis
  naik jelas + ekor turun [−7,2 / −2 / 3,2] + mulut kecil melengkung turun (−3,4), mata terbuka. Detail halus dibuang.
  **Raut `mini`** (hanya lewat `potretMissRaksa`/`aturanPotret`, potret <= 36 px: layar akhir 28, riwayat 32), paling
  kuat, dan mulut 1,7 × + alis 1,3 × (tebal 1,8 ×): prihatin = pangkal alis naik −13 + ekor turun 5 + mulut kecil
  melengkung turun (−4); serius = alis datar & turun ± 5–6 + mulut lurus tipis; dengar = alis naik ± 3 + senyum
  tipis (lengkung 3,2, lebih sempit daripada senyum).
- **Titik tangan** (`g.tangan`, dibulatkan 0,1; semua pose duduk punya titik):

  | Pose | kiri (tangan dekat) | kanan (tangan jauh) |
  | --- | --- | --- |
  | `duduk-dengar` | (277, 462) | (262, 461), tangan atas tumpukan |
  | `duduk-jelaskan` | (276, 462) | (400, 348), telapak terangkat |
  | `duduk-tunjuk` | (352, 445), ujung telunjuk | tidak ada, tangan di pangkuan |
  | `telepon` | (208, 187), genggaman gagang | (259, 464) |
  | `berdiri-sambut` | (268, 300) | (290, 300) |
  | `berdiri-persilakan` | (278, 389) | (376, 300); putaran 4, dulu (385, 301) |
  | `berdiri` | (274, 417) | (245, 419) |

- **Id**: semua id diawali `opsi.id` (bawaan `mr`). `diAtasMeja` memakai `${id}d`, jadi tidak pernah kembar dengan SVG
  utama (diuji).
- **Cache**: hasil disimpan per kunci opsi termasuk `id` (LRU 96). Objek yang dikembalikan adalah salinan. Pemanggil
  yang dipasang berkali-kali memanggil tanpa `id` + `awalanId` (lihat Pemakaian).

### Potret (aturan ukuran)

`aturanPotret(ukuran)` → `{ jendela, kecil, mini }`:

| Ukuran | Jendela | Versi |
| --- | --- | --- |
| <= `POTRET_MINI_MAKS_PX` (36 px): 28 (layar akhir), 32 (riwayat) | `JENDELA_POTRET_KECIL_MR` {150, 70, 160} | `kecil` + raut `mini` |
| 37–52 px (`POTRET_KECIL_MAKS_PX`): 44 (aktivitas), 52 (dialog) | `JENDELA_POTRET_KECIL_MR` {150, 70, 160} | `kecil` |
| 53–75 px (`POTRET_SEDANG_MAKS_PX`): 56 (hub cerita) | `JENDELA_POTRET_SEDANG` {138, 58, 188}: kepala ± 69 % tinggi lingkaran | `kecil` |
| >= 76 px | `JENDELA_POTRET_V3` {120, 40, 220} | normal (garis versi kecil tampak berat pada 96 px) |

`JENDELA_POTRET_KECIL_MR` = `JENDELA_POTRET_KECIL` kontrak (ukuran.ts) dengan `x` & `sisi` sama (skala wajah sama
dengan Bu Rina), hanya dinaikkan 6 satuan supaya puncak kubah/sanggul tidak terpotong lingkaran. `PotretMissRaksa` dan
`potretMissRaksa({ ukuran })` memakai aturan ini. Tanpa `ukuran`: `kecil: true` memakai jendela kecil MR, selain itu V3.
`POTRET_KECIL_MAKS` di `PotretMissRaksa.tsx` = `POTRET_KECIL_MAKS_PX` (52).

**Dipakai ulang** (putaran 4; potret Bu Rina, sisipan telepon di panggung): semua diekspor dari
`client/src/cerita/seni/tokoh/missRaksa.ts` (nilai tidak berubah):

```ts
import { aturanPotret, type AturanPotret, JENDELA_POTRET_SEDANG, JENDELA_POTRET_KECIL_MR, POTRET_SEDANG_MAKS_PX, POTRET_MINI_MAKS_PX } from './missRaksa';
import { POTRET_KECIL_MAKS_PX, JENDELA_POTRET_KECIL, JENDELA_POTRET_V3 } from './ukuran';
// aturanPotret(52) → { jendela: JENDELA_POTRET_KECIL_MR, kecil: true, mini: false }
```

Ambang (`POTRET_MINI_MAKS_PX` 36, `POTRET_KECIL_MAKS_PX` 52, `POTRET_SEDANG_MAKS_PX` 75) dan `JENDELA_POTRET_SEDANG`
{138, 58, 188} berlaku untuk tokoh mana pun (kepala pose duduk di (230, 150) pada kedua tokoh). Hanya
`JENDELA_POTRET_KECIL_MR` yang khusus Miss Raksa; tokoh lain di <= 52 px memakai `JENDELA_POTRET_KECIL` kontrak. Sisipan
Miss Raksa di panggung cukup memanggil `awalanId(potretMissRaksa({ ekspresi, ukuran }).svg, awalan)` atau
`<PotretMissRaksa ukuran>`.

`<PotretMissRaksa>` (putaran 5): `isiPotret` memanggil `potretMissRaksa({ ekspresi, ukuran, pandang })` TANPA id lalu
`awalanId(svg, id)` dengan id dari `useId` (`pmr…`). Galat generator → siluet `sementara.ts`; galat siluet → huruf
"M" di bingkai yang sama. API komponen tidak berubah.

### Lapisan untuk panggung

SVG utama: `<g class="lapis-badan">` (badan, leher, kerah, kepala, lengan penuh) lalu `<g class="lapis-tangan">`
(lengan bawah + tangan di meja, pose duduk). **`g.diAtasMeja`** = lapisan tangan yang sama sebagai SVG mandiri
(viewBox sama, id `${id}d`), dimulai sedikit di atas siku **tanpa garis potong melintang**. Panggung menggambarnya
sesudah `belakangMeja` + prop dan sebelum `depanMeja`. **Garis siku** = `GARIS_SIKU` = 423 =
`ruang/geometri.ts MEJA_KANVAS_DUDUK` (diuji).

## Putaran 5: perbaikan terakhir dari juri ke-3 (27 Sep)

| Masalah (juri ke-3, berat) | Yang dikerjakan | Status |
| --- | --- | --- |
| Di panggung, dengar/prihatin + `lawan` terbaca dingin/angkuh: mata setengah tertutup menatap ke bawah, mulut merah kecil merapat (sedang) | Lihat butir **Wajah** & **Pandang**: `lawan` tanpa lirikan (iris 0,12, sedikit naik, kelopak −0,08, tanpa angguk); dengar senyum lembut; prihatin mata terbuka + pangkal alis naik + mulut lebih lebar & hampir datar; serius tetap mulut lurus + alis datar & turun. | diperbaiki pada panggung nyata `pintu`/`datang` 1440 & 390: mata terbuka menatap Bu Rina dengan sorot tampak. Mulut prihatin tetap kecil & merah (warna bibir = ciri tokoh); belum dinilai manusia |
| Di HP, mata senyum bertudung pada `kartu`/`reaksi` menjadi celah gelap (sedang) | Kelopak atas total dibatasi 0,34, lega 0,4 → 0,3, bayang kelopak di bola mata lebih tipis, sorot sedikit lebih besar & dijaga di bawah kelopak. Catatan: sejak lead memetakan Bu Rina lega → Miss Raksa lega, `reaksi` & `kartu` menampilkan wajah LEGA (bukan senyum). | diperbaiki pada panggung nyata 390 × 844 DPR 2 (`reaksi`, `kartu`: iris + sorot tampak) dan lembar senyum/lega × `lawan`/`bawah` skala panggung |
| Potret 28/32 px dan 44 px DPR 1: dengar/serius/prihatin beda 1–2 piksel (sedang) | Raut kecil & mini dengan nilai mutlak yang dilebihkan + mulut/alis mini digambar lebih besar (butir `kecil`). | sebagian: 32 & 44 px DPR 1 kini dibedakan oleh bentuk alis + mulut; 28 px DPR 1 prihatin (alis naik) & dengar (senyum) terbaca, serius = alis gelap datar + mulut garis tipis, perbedaan tetap hanya 1–2 piksel per fitur |
| Heap naik terus (17,9 MB sesudah 300 baris): id per pemasangan masuk kunci cache | `PotretMissRaksa` memanggil generator tanpa id + `awalanId`; API tetap; galat aman (siluet → huruf). | diperbaiki: simulasi Node 300 baris (dialog 52 + riwayat 32) heap sesudah GC 8,99 → 14,97 MB (cara lama) vs 8,73 → 11,70 MB datar sejak baris 50 (cara baru); aplikasi nyata: semua id di halaman unik (170/170, 252/252) |
| (opsional) Lengan bawah jauh sembah pendek & curam, siku setinggi pinggul (rendah) | Siku (322, 386) → (328, 368), pergelangan (293, 356) → (296, 350): lengan bawah ± 30° (dulu ± 46°). | membaik pada lembar 3 × / 0,9 / 0,48; siku jauh kini sedikit lebih keluar dari siluet; belum mendatar penuh seperti #6 |

Tidak diubah: kanvas & jangkar, `GARIS_SIKU` 423, SEMUA titik tangan (diuji sama persis dengan putaran 4), `diAtasMeja`,
awalan id generator, tanpa filter, gaya.ts, bentuk kepala/rahang/rambut/seragam.

## Putaran 4: perbaikan kecil (27 Sep)

| Masalah | Yang dikerjakan | Status |
| --- | --- | --- |
| Sembah: potongan lengan menggantung DI BAWAH telapak (manset & kancing di ujung bawah) pada panggung awal | Lengan jauh kini satu lengan dari sendi (`gambarLengan`, tekukan tajam seperti telepon) di lapis belakang: bahu (259, 242) → siku (322, 386) di luar siluet pinggang atas → pergelangan (293, 356). Lengan bawah naik menyerong ± 46° ke manset putih tepat di bawah telapak jauh; tiga kancing di sisi luar dekat manset. Badan menutup pangkal lengan atas, telapak jauh (lapis depan) menutup ujung manset. Sendi bahu digeser ke dalam/turun supaya tidak ada punuk di atas bahu jauh. Bayang telapak di dada dibatasi ke bidang jas. | diperbaiki pada lembar 4 × dan panggung awal 1440/390 |
| Persilakan: ujung jari 1 satuan dari tepi kanan | Siku jauh (320, 354) → (317, 352), pergelangan (358, 318) → (350, 319), sudut telapak −28° → −33° (`SUDUT_TANGAN_PERSILAKAN`). Panjang lengan & bentuk siku sama (tidak masuk jalur tekukan tajam). Marjin kanan terukur 11,3–11,5 satuan (raster 4 ×, biasa & kecil). Titik `tangan.kanan` (385, 301) → (376, 300). | diperbaiki |
| Pose duduk: satu betis tipis (hanya terlihat di ekspor tanpa meja) | Dua betis (betis membulat di belakang, tulang kering lurus di depan; betis jauh ke kanan & lebih gelap) + dua sepatu berhak; rok pensil berakhir di lutut (lipatan runcing lama dihapus) + garis paha. Uji baru: dua betis + >= 2 sepatu di SEMUA pose. | diperbaiki (tetap cadangan: kaki tidak ada di referensi) |
| Potret kecil 44/52 px: mata seperti riasan hitam tebal; dengar vs serius | Lihat butir `kecil` di atas: garis mata & garis bawah lebih tipis/terang, iris 0,8 × dijepit dengan celah sklera di kedua sisi, bayang kelopak lebih tipis. Dengar kecil: kelopak 0,06 (dulu −0,3 = melotot), sudut bibir naik 0,6 + lengkung 1,6. Serius kecil: alis [1,6 / 3,1 / 1,4] (puncak turun lebih banyak = lebih datar), lengkung mulut 0 (dulu −0,9), kelopak 0,22. Mini dengar lengkung 1,4 → 2. | diperbaiki pada lembar 44/52 px DPR 1 & 2 dan potret dialog panggung (serius); dengar tidak muncul di tangkapan panggung (hanya di lembar) |
| Aturan potret untuk dipakai ulang | Sudah diekspor; ditambah tipe `AturanPotret` + catatan pemakaian ulang (bagian Potret). | selesai |

Tidak diubah: wajah pada ukuran normal, kanvas & jangkar, `GARIS_SIKU` 423, titik tangan selain `berdiri-persilakan`
kanan, awalan id, cache, tanpa filter, gaya.ts.

## Putaran 3: daftar juri ke-2 (27 Sep)

Status: **diperbaiki** = masalah yang dilaporkan tidak terlihat lagi di lembar bukti saya; **sebagian** = membaik tetapi
sisa masih terlihat; **tidak diikuti** = pengukuran saya pada foto berbeda dengan juri (alasan di kolom kanan).

| Masalah juri (berat) | Yang dikerjakan | Status |
| --- | --- | --- |
| Rahang "ember"/wajah bulan pada `pemain`/`lawan`/`bawah` (tinggi) | Penyebab: dagu 7 satuan ke sisi dekat dari garis tengah wajah dalam 3D, jadi saat toleh 9° wajah bawah menggembung ke kiri. Dagu dipindah ke garis tengah (depan: titik terendah x 12, di bawah tengah mulut = garis ungu #6), rahang dekat meruncing sejak y 27 sebagai diagonal cuping → dagu, z rahang naik bertahap (6 → 32). Catatan: saran "+4 z" juri justru MELEBARKAN rahang pada toleh 9° (x' = 1,05 (x − 3,3) − 0,20 z + 3,3), jadi tidak diikuti. Lebar wajah di tengah mulut–dagu / lebar di garis mata: pemain 81 % → 73 %, depan 78 → 71 %, lawan 75 → 69 %, bawah 75 → 69 %. Dagu depan tetap y 63,8. | sebagian: sasaran juri <= 70 % pada pemain belum tercapai (73 %); secara visual tidak lagi bulat/ember |
| Mata "glam"/lirikan licik (tinggi) | Sayap garis mata ± 50 % lebih pendek & rendah, tebal luar ± 30 % lebih tipis; sorot putih bulat diganti sorot lembut kecil (r 0,8/0,6, 60 %) di kiri-atas iris; iris 6,2/5,3 → 5,8/4,9; kelopak atas bertudung (dengar −0,1 → 0,03, senyum 0,08 → 0,1 + kelopak bawah −0,3); `bawah`: kelopak 0,3 → 0,15, alis naik 0,8, iris lebih ke bawah, sudut bibir disejajarkan garis mata. | diperbaiki pada lembar & panggung 1440; mata tetap gaya kartun |
| Celah kulit di kerah (sedang) | Kerah tertutup: kedua separuh bertemu di satu jahitan, takik V ± 4 satuan hanya di tepi atas; leher tidak lagi turun di bawah kaki kerah; bukaan diagonal mulai tepat di bawah kaki kerah. | diperbaiki (depan/lawan/pemain, berdiri & duduk) |
| Alis terlalu tinggi & tipis (sedang) | Alis turun 1–1,2 (bukan 2,5–3), tebal maks 2,3 → 2,7 di sepertiga tengah (tebal tambahan tumbuh ke bawah), ekor tetap tipis, puncak alis jauh diratakan ± 0,8, kedalaman ekor alis jauh 25 → 29 (tidak runcing saat menunduk). Alasan: pada grid 1 satuan foto #6 (cermin, pemetaan juri) garis tengah alis dekat di puncak ± y −2,4, sama dengan gambar putaran 2; turun 3 akan menaruh alis di bawah alis foto. Jarak alis–mata tampak lebih rapat lewat alis tebal + kelopak bertudung. | sebagian (sengaja) |
| Hidung kecil kartun (sedang) | Lubang hidung = bayang lembut ± 35 % kegelapan semula, pangkal cuping ± 15 % lebih lebar ke sisi dekat, sorot ujung separuh; posisi ujung tetap. | diperbaiki |
| Kulit pucat, rona cakram rendah (sedang) | Kulit satu langkah ke peach (#f0bca2 → #f2be9b, terang/bawah ikut), leher & tangan ikut; rona #ec6f78 → koral #ea8f80 (kurang jenuh), naik ± 3–5 satuan ke tulang pipi di bawah sudut luar mata, elips melebar (17 × 9). | diperbaiki; rona kini lebih samar daripada foto |
| Tunggul lengan sembah (sedang) | Lengan bawah jauh dari siku di sisi badan NAIK menyerong ke pangkal telapak; manset putih menutup pangkal telapak; tiga kancing dekat manset. | diperbaiki (lembar & panggung awal 1440) |
| Jas kotak (sedang) | Pinggang ± 8 % lebih ramping (berdiri & duduk), bahu luar turun ± 3; lengan atas dekat duduk ± 14° dari tegak (dulu ± 5°). | sebagian: bahu dekat masih agak persegi, lengan duduk tetap tabung lurus |
| Potret kecil (sedang) | Lihat bagian Potret: garis/bayang mata kecil lebih ringan + iris lebih kecil, jendela kecil naik 6, jendela sedang 53–75 px, raut `mini` <= 36 px. | sebagian: 44/52 px terbaca; 28/32 px prihatin & serius kini dapat dibedakan tetapi dengar vs serius masih lemah pada 28 px |
| Bibir (rendah) | Bibir bawah senyum/lega ± 15 % lebih penuh, kilap separuh. **Tidak diikuti**: "sudut jauh lebih tinggi" — pada grid foto sudut DEKAT (kiri, cermin) yang lebih tinggi (± y 38 vs ± 41), sama dengan gambar. | sebagian |
| Sanggul bola terpisah (rendah) | Bayang bersama di sisi sanggul yang menempel ke kubah + kilau melingkar diredupkan. Keberadaan sanggul = keputusan pemilik (tidak tampak pada #6). | sebagian: pada `lawan` masih terbaca sebagai gulungan terpisah |
| Anting mutiara (rendah) | **Tidak diikuti**: pada grid foto mutiara #6 di ± (−32, 22), yaitu ± 2 satuan LEBIH DEPAN & ± 1 lebih tinggi daripada gambar (± −34, 23), berlawanan dengan catatan juri. Posisi tidak diubah. | tidak diubah |

Tidak diubah: kanvas & jangkar, `GARIS_SIKU` 423, titik tangan (sama persis), nama ekspor lama, API
`gambarMissRaksa`/`PotretMissRaksa`, awalan id, cache, tanpa filter, gaya.ts.

## Putaran 2: yang dikerjakan (dari catatan lead)

| Masalah | Perbaikan |
| --- | --- |
| Mata kecil, terlalu banyak putih | Bukaan sedikit lebih tinggi (± 7 satuan di tengah) dan iris besar & sangat gelap (r 6,2 dekat / 5,3 jauh), sehingga putih hanya segitiga kecil di sudut. Sklera redup hangat dengan bayang kelopak jatuh di bola mata. SATU garis mata meruncing (tipis di sudut dalam → tebal di luar) + sayap kecil pendek. Bayang kelopak lembut, garis bawah lembut (sepertiga luar lebih gelap), karunkel merah muda. Senyum: kelopak bawah terangkat. |
| Hidung kait | Garis cuping/kait dihapus. Ujung bulat lebar dari bidang: sorot ujung besar + inti, sorot batang hidung, sabit bayang bawah ujung, cuping dekat membulat (bidang, bukan garis), dua lubang hidung lembut. Sisi jauh ujung melebur ke pipi. |
| Rahang dekat lurus | Kontur rahang dekat dibuat membola (pipi bawah penuh setinggi mulut) lalu membulat ke dagu kecil. Rahang jauh bawah ± 1,4 satuan lebih penuh (sesuai tumpang foto). Dua sabit bayang tipis di pipi bawah memberi volume tanpa kesan dagu ganda. |
| Rambut seperti helm | Garis rambut lembut (tepi tipis + pita rambut tembus di sisi kulit, anak rambut). Belahan = pita terang meruncing (seperti garis abu-abu #6). Pita kilau mengikuti lengkung kubah. Helai lebih terlihat. Puncak sedikit lebih bervolume. Sanggul gulung di belakang: menyembul sedikit pada `depan`, jelas pada `lawan` (3/4). |
| Lengan tabung | Lengan dibangun dari **sendi** (bahu → siku → pergelangan) dengan lebar meruncing (deltoid 36 → siku 29 → pergelangan 24). Siku benar-benar menekuk: titik siku membulat di luar, lipatan kain di dalam. Manset = pita putih tipis (5 satuan) + tiga kancing lengan. Lengan bawah (panjang sebenarnya ± 0,9 lengan atas) memendek hanya bila mengarah ke kamera. |
| Tangan | Empat bentuk tangan lokal (punggung rebah, telunjuk, telapak terbuka, genggam gagang) dengan garis antarjari, sorot buku jari, ibu jari, dan kuku merah. Skala ± 0,5 tinggi kepala, lebar ± 0,45 panjang. Sembah dipertahankan. |
| Telepon | Siku terangkat ke depan + lipatan kain di tekukan tajam. Tangan menggenggam gagang (jari melingkar, kuku di sisi pipi). Gagang digambar pose ini dari telinga dekat ke depan dagu. |
| Alis/usia | Alis ± 15 % lebih tipis lagi (maks 2,3; putaran 1: 2,7), pangkal lembut (1,5), ekor sangat runcing, cokelat tua, sedikit lebih dekat ke mata (seperti foto). |
| Potret 32 px | `aturanPotret` + jendela kecil + versi `kecil` (mata/mulut lebih besar, garis tebal). |
| Titik tangan & varian | Titik tangan di semua pose duduk. `bicara`/`kedip` identik kecuali mulut/mata (uji baru). Awalan id `${id}d` di lapisan meja. |

Tidak diubah: kanvas & jangkar, `GARIS_SIKU` 423, nama ekspor, seragam (jas kuning pucat keemasan, kerah mandarin putih
memeluk leher, manset putih, kancing gelap, lencana emas + pin di dada KIRI pemakai), tanpa headset, tanpa filter,
cache.

## Selesai / cadangan / belum ada

- **Selesai**: 7 pose × 5 wajah × 4 pandang × bicara/kedip/kecil; potret 28–96 px; lapisan meja; titik tangan; gagang
  telepon.
- **Cadangan** (tidak ada di referensi, menunggu konfirmasi pemilik): rok cokelat tua, stoking, sepatu, bagian badan di
  bawah meja pada pose duduk (putaran 4: dua betis + dua sepatu), dan kursi yang tertutup.
- **Belum ada**:
  - penilaian kemiripan oleh manusia/pemilik;
  - uji di HP fisik (kinerja & keterbacaan);
  - animasi transisi antarpose (panggung melakukan silang-pudar);
  - variasi tangan untuk memegang kartu (`kartu: 'tangan'` tidak dipakai AUTO-1; titik `kanan ?? kiri` tetap ada).

## Cara membuat ulang lembar bukti

Skrip ada di folder kerja sesi (bukan repo, karena memuat foto #6):
`%TEMP%/claude/C--Users-User/0b51d3e7-008d-473f-bd7c-682bb838354f/scratchpad/v3/miss-raksa-3/` (putaran 2:
`.../miss-raksa-2/`; putaran 4: `.../miss-raksa-4/` dengan `iter.ts <nama> sembah persilakan kaki kecil mini dengarSerius`,
`tepi.mts` = marjin piksel tiap pose terhadap tepi kanvas, `ukur.ts`, `zoom.mjs`; putaran 5: `.../miss-raksa-5/` dengan
`iter.ts <nama> panggung potret sembah`, `wajah-panggung.mjs <BASE> <keluaran> <label>` = potongan wajah dari panggung
nyata, `lembar-wajah.mjs`, `potret-langsung.mjs` = potret komponen asli di dialog & Riwayat, `heap-potret.ts` =
simulasi heap cara lama vs baru, `banding-tangan.ts`, `ukur.ts`). Jalankan dari akar repo:

```sh
npx tsx --tsconfig client/tsconfig.json <folder>/lembar.ts       # lembar-06.png + sebelum-sesudah.png
npx tsx --tsconfig client/tsconfig.json <folder>/galeri.ts galeri # galeri.png + galeri-potret-dpr2.png
npx tsx --tsconfig client/tsconfig.json <folder>/iter.ts <nama> grid2 wajah arah ekspresi badan kerah kecil sedang mini
npx tsx --tsconfig client/tsconfig.json <folder>/ukur-rahang.ts <folder>/rahang.json   # lebar wajah bawah per pandang
node <folder>/tangkap-adegan.mjs http://127.0.0.1:5320 <keluaran> awal,datang,kartu,mentorBicara d1440,h390  # panggung
```

`<folder>/sebelum/` menyimpan salinan putaran sebelumnya (`missRaksa-jalan.ts` dapat dijalankan) untuk perbandingan.

## Bukti (folder kerja di atas)

- `lembar-06.png`: foto #6 (cermin, skala kepala sama 130/152) → Miss Raksa `depan` → tumpang 45 % → `lawan`;
  close-up foto | gambar | tumpang; lima wajah × depan / lawan / pemain (+bicara) / lawan + kedip / bawah (kartu).
- `sebelum-sesudah.png`: putaran 2 vs 3 dengan setelan & skala identik (close-up + foto; lima wajah `lawan`,
  `pemain`, `bawah`; kerah; sembah dekat; lengan/tangan tujuh pose; potret 28–64 px).
- `galeri.png`: 7 pose × 5 wajah pada skala desktop 0,9 (kepala ± 117 px) dan HP 0,48 (kepala ± 62 px); duduk dengan
  meja netral di garis siku + `diAtasMeja`; potret 28/32/44/52/56/64/96 px pada DPR 1. `galeri-potret-dpr2.png` = DPR 2.
- `panggung/`: panggung nyata (Vite 5320) 1440 × 900 (`*-d1440.png`) dan 390 × 844 DPR 2 (`*-h390.png`) untuk
  `awal` (sembah), `datang`, `kartu`, `mentorBicara`, `telepon`, `pemainBicara`; `z-gabung.png` (wajah awal,
  wajah kartu, sembah, 3 ×), `z-hp.png`, `z-potret.png` (potret dialog nyata).
- `iter/`: lembar kerja (grid 1 satuan foto vs gambar `*-grid2.png`, arah, kerah, badan, potret 3 × / 6 ×).
- Putaran 4 (`.../miss-raksa-4/`): `iter/akhir-sembah.png`, `iter/akhir-persilakan.png`, `iter/akhir-kaki.png`,
  `iter/akhir-kecil.png`, `iter/akhir-dengarSerius.png`, `iter/akhir-mini.png` (sebelum vs sesudah, setelan identik);
  `panggung/` panggung nyata 1440 × 900 & 390 × 844 DPR 2 + `z-sembah-d1440.png`, `z-sembah-h390.png`,
  `z-potret-*.png` (sebelum = tangkapan putaran 3).
- Putaran 5 (`.../miss-raksa-5/`, sebelum = salinan putaran 4 di `sebelum/`, setelan identik):
  `wajah-d1440-sebelum-sesudah.png` (3 × piksel) & `wajah-h390-sebelum-sesudah.png` (2 × piksel perangkat) = wajah
  dari panggung nyata Vite 5320 pada `pintu`, `datang`, `reaksi`, `kartu` (+ Bu Rina sebagai konteks);
  `iter/akhir-panggung.png`, `iter/akhir-panggung-vektor.png`, `iter/akhir-panggung-dekat.png` = 5 wajah × pandang pada
  skala panggung 1440 (0,80 px/satuan) & 390 (0,88 piksel perangkat/satuan); `iter/akhir-potret-dpr1.png` (3 ×) &
  `iter/akhir-potret-dpr2.png` = potret 28/32/44/52 px; `potret-langsung-sesudah.png` = potret komponen asli (dialog
  52, riwayat 32); `iter/akhir-sembah.png`.

## Kinerja

- SVG utama (putaran 5, id `mr`, 5 wajah × diam/bicara): 43,5–49,9 KB per pose (putaran 4 dengan cara ukur sama:
  43,3–49,8; dengar kini punya garis tonjolan bawah mata). Versi kecil: 38,5–44,1 KB. `diAtasMeja`: 4,7–10,3 KB. Uji
  membatasi 54 KB / 14 KB (id panjang); sasaran lead ≤ 60 KB.
- Generator: ± 0,9 ms per panggilan tanpa cache (Node, 300 panggilan unik; putaran 4 diukur ulang pada mesin yang sama:
  ± 0,9 ms), ± 0,001 ms dengan cache.
- Potret tanpa id (putaran 5): simulasi Node 300 baris × (dialog 52 + riwayat 32), 41 salinan tetap terpasang, heap
  sesudah GC: cara lama 8,99 → 14,97 MB (naik sampai cache 96 penuh), cara baru 8,73 → 11,70 MB, datar sejak baris 50.
  Panggung nyata (build kerja dari sumber bersama, 1440, 300 langkah maju, skrip S5 kinerja-2): heap 5,58 → 14,12 MB
  (putaran 3: 5,57 → 17,95 MB). Build itu juga memuat perubahan agen lain, jadi selisihnya BUKAN hanya dari potret; heap
  masih naik ± 0,4–0,6 MB per 30 langkah (sesudah GC paksa lewat CDP, satu kali jalan, bukan uji A/B terkendali).
- Decode/gambar di Chrome tidak diukur ulang putaran ini; tetap tanpa filter.

## Ketidakcocokan yang masih terlihat dengan foto #6 (jujur, sesudah putaran 5)

Dasar: lembar & catatan juri ke-3 (menilai putaran 4; skor kemiripan 6,5, ekspresi 7, kualitas 7, potret kecil 6,5)
ditambah pemeriksaan saya sesudah putaran 5. Putaran 5 TIDAK mengubah bentuk wajah, jadi butir 1–7 masih berlaku apa
adanya. Belum ada penilaian pemilik/manusia.

1. **Tidak dapat dikenali sebagai #6 dari wajahnya saja** (juri ke-3). Wajah bawah lebih panjang & berbentuk V dengan
   pipi datar, sedangkan #6 punya pipi bulat penuh saat tersenyum dan dagu lembut. Pengenalan datang dari kubah rambut,
   mutiara, bibir merah, dan seragam. Rasio lebar wajah bawah pada `pemain` 73 % (sasaran juri <= 70 %).
2. **Mata**: tetap almond bergaya dengan garis mata gelap; #6 punya mata berkerut senyum dengan kelopak bawah terdorong
   naik. Putaran 5 membuat mata mendengarkan lebih terbuka dan menambah sorot yang lebih terang, jadi mata kini sedikit
   lebih "terbuka/ramah" daripada #6 yang teduh; pada 4 × vektor sorotnya terbaca jelas.
3. **Alis**: lebih tebal di tengah, tetapi tetap lebih rapi/tipis di ujung daripada alis foto.
4. **Hidung**: lebih lebar & lembut, tetap lebih kecil daripada hidung foto.
5. **Bibir**: lebih penuh; bentuk senyum masih lebih rapi/simetris daripada foto. Mulut prihatin di panggung tetap
   kecil & merah (warna bibir = ciri tokoh), walau kini lebih lebar & hampir datar.
6. **Rambut**: kubah & belahan cocok di tumpang; sanggul (permintaan brief) tampak sebagai massa terpisah pada
   `lawan`/`pemain`/`bawah` tetapi tidak tampak pada #6 dari sudut ini (keputusan pemilik); kilau masih grafis.
7. **Kulit/rona**: kulit peach lebih hangat; rona tinggi lebih samar daripada rona foto.
8. **Badan/proporsi**: bahu dekat masih agak persegi, lengan atas duduk tabung lurus (miring). Rok/kaki/sepatu =
   cadangan: kaki duduk (terlihat hanya tanpa meja) = betis lurus tipis di bawah rok bulat.
9. **Tangan / sembah**: di HP (± 0,48) jari menyatu. Lengan jauh sembah utuh; putaran 5 menaikkan siku jauh 18 satuan
   dan lengan bawahnya kini ± 30° (dulu ± 46°), tetapi masih belum mendatar seperti #6 dan siku jauh kini sedikit lebih
   keluar dari siluet badan. Belum dinilai juri.
10. **Seragam**: sesuai #6/#09; kerah tertutup di depan. Lencana polos tanpa tulisan (sengaja).
11. **Wajah mendengarkan di panggung**: juri ke-3 menilai dengar/prihatin + `lawan` dingin/angkuh (mata setengah
    tertutup menatap ke bawah). Putaran 5: mata terbuka menatap Bu Rina, iris tidak lagi di sudut, sorot tampak pada
    1440 & 390; dengar tersenyum tipis. Pada skala panggung perbedaan dengar vs serius tetap terutama alis & mulut
    (± 1 piksel pada 1440 DPR 1). "Hangat" belum dinilai manusia.
12. **Potret kecil**: 44/52 px lima wajah terbaca; putaran 5 membuat prihatin (alis miring naik + mulut kecil turun),
    serius (alis datar & turun + mulut garis) dan dengar (alis santai + senyum tipis) berbeda bentuk pada 32 & 44 px
    DPR 1 dan pada DPR 2. Pada 28 px DPR 1 (layar akhir) setiap fitur tetap hanya 1–2 piksel: prihatin & dengar
    terbaca, serius terutama dari alis gelap datar. Pada DPR 2, prihatin mini cukup dramatis (cemberut kartun).
13. **Belum diperiksa**: penilaian pemilik/manusia (kemiripan & kehangatan), HP fisik, pembaca layar, waktu
    decode/gambar di Chrome, `client/dist` (tidak dibangun ulang; 4230 masih build pra-v3), ekspor aset (master/manifest
    belum dibuat ulang dengan perubahan putaran 5).

Jangan menyebut "mirip #6" tanpa lembar perbandingan di atas dan penilaian pemilik.
