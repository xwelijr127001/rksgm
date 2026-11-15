# Aset adegan "Periksa rambu"

Sumber: ekspor Claude Design `Raksa Game — Periksa rambu.html` (14 Nov 2026), lima halaman dalam satu bundel. Hanya aset yang berguna
yang diambil; pembungkus pameran, galeri aset, iframe berukuran tetap, dan pustaka pengemasnya TIDAK ikut.

| Berkas | Asal | Catatan |
|---|---|---|
| `svg/jalan-empat-lajur.svg` | Aset · Jalan empat lajur | Markup asli. Ruang 360 x 360, jalan x 44..316, pembatas lajur di 112/180/248, pepohonan, tekstur butir. Hanya atribut pembungkus `<svg>` diubah (xmlns, width/height). |
| `svg/truk-biru.svg` | Aset · Truk | Markup asli, viewBox 60 x 170. |
| `svg/arsir-lajur.svg` | Aset · Arsiran pilihan lajur | Markup asli (merah #D4553B); `preserveAspectRatio="none"` agar direntang ke kotak lajur. |
| `svg/arsir-lajur-biru.svg` | TURUNAN arsiran asli | Warna truk #2F6FB0 dan arah arsiran dibalik, untuk tanda Rambu 2 (dibedakan dengan pola, bukan hanya warna). Bukan bagian dari ekspor. |
| `svg/ikon-periksa.svg` | Aset · Ikon periksa | Markup asli, ukuran tetap 24. |
| `PlusJakartaSans-latin.woff2` | Font di ekspor | Subset latin Plus Jakarta Sans, dipakai untuk bobot 400-800. |
| `LISENSI-PlusJakartaSans.txt` | Komentar kepala ekspor | SIL Open Font License 1.1 + hak cipta. WAJIB ikut bila font diteruskan. |

Ikon kecil (tandai, centang, ulang, contoh arsir) disalin sebagai jalur gambar inline di `Aset.tsx` dari markup ekspor.

## Pemakaian
- DOM (sekarang): `Aset.tsx` memuat berkas svg lewat `?raw` dan memberi sufiks unik pada id di dalamnya (`svg.ts`).
- Phaser (nanti): muat berkas `svg/*.svg` langsung (`this.load.svg`) dan pakai `geometri.ts` untuk koordinat (ruang 360 x 360).
- `geometri.ts` memuat angka jalan/lajur/truk; `seni.test.ts` memastikan angka itu cocok dengan isi berkas SVG.

## Yang sengaja tidak diambil dari ekspor
Teks kasus yang disederhanakan (pertanyaan "Ya/Tidak" soal Rambu 1) tidak menggantikan isi kasus kami. Isi kasus tetap dari naskah Episode 2
(`teks.id.ts`, kunci `dok.rambu.*` dan `k08*`). Teks antarmuka baru ditandai DRAF di `lokasi/logika.ts`.
