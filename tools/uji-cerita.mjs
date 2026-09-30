/**
 * UJI BROWSER MODE CERITA - episode AUTO-1 "Baret di Parkiran" (docs/rancangan-mode-cerita.md bagian 7 & 11).
 *
 *   npm install --no-save puppeteer-core
 *   npm run build && npm start        # server di http://127.0.0.1:4000 (ubah lewat UI_BASE, mis. Vite dev)
 *   npm run test:cerita               # semua uji; "npm run test:cerita -- akhir,muat" = uji tertentu saja
 *
 * Env: UI_BASE (bawaan http://127.0.0.1:4000), RAKSA_CHROME (chrome.exe), RAKSA_SHOTS (folder tangkapan;
 *      kosong = tanpa tangkapan), RAKSA_GERAK=kurang (uji dengan "kurangi gerak"; bawaan gerak AKTIF seperti
 *      kebanyakan HP, karena Chrome headless mewarisi setelan OS).
 * Mode cerita sepenuhnya di klien: uji ini tidak membuat room dan tidak menyentuh server permainan.
 * Teks yang diharapkan (id/en/zh, termasuk parameter {lokasi} v3), jenis node, aturan kartu akhir, makna alasan, dan
 * istilah per baris dibaca dari MODUL episode.ts (proses anak `node --import tsx`, lihat bacaEpisode); kamus UI dari
 * kamus/cerita.ts, ceritaAkhir.ts, ceritaAkt.ts, misi.ts. Terhadap Vite dev tanpa server permainan (GET /api/health &
 * /api/missions dicoba sekali di awal dan tidak menjawab JSON), galat console jabat tangan WebSocket socket.io yang
 * memang muncul DIABAIKAN (satu baris INFO); dengan backend, galat console apa pun tetap GAGAL "console bersih".
 *
 * Uji (nama = filter):
 *  akhir   1,2,5  sembilan jalur lewat UI -> lima akhir (tuntas terbaik, tuntas lewat pemulihan komunikasi, janji,
 *                 dingin, "terbaik tapi menutup singkat" -> dingin, bukti kurang [pengecoh ban] + lengkapi ->
 *                 tuntas, bukti kurang [pengecoh dasbor] + cukup -> tertunda, bengkel+biarkan -> tertunda,
 *                 ringan+tetap-ringan -> pergi); node yang dilewati diperiksa dari riwayat. Tiap pilihan (bagian
 *                 11.3): TANPA gema "Kamu: …", satu kalimat ajar netral (tanpa "Suasana membaik/memburuk", gaya sama
 *                 untuk naik/turun/tetap, baru tampil setelah kalimat utuh, ikut dibacakan live region), angka
 *                 kepercayaan tidak tampil, label suasana = kata untuk WAJAH yang tampil. Aktivitas (11.5): kartu
 *                 satu tugas (tanpa kartu polis / cara main / catatan waktu), album ringkas "n/3 foto", kartu polis
 *                 di atas tiga pilihan & barisnya bisa diperiksa saat menjawab, umpan balik per foto + alasan,
 *                 "Kenapa begitu?". Kartu akhir (11.1) per aturan kartuAkhir: wajah & label perasaan, nama akhir
 *                 (ikon + kata nada), judul hasil, sebab, pelajaran, DUA aksi, tanpa epilog; <= 90 kata; aksi
 *                 terlihat tanpa gulir di 390x844. "Lihat perjalananku": tiga kelompok, sisi perasaan / langkah /
 *                 paham, "Diperbaiki", kelompok kosong jujur, akhir ditemukan n/5 (yang belum tersamar), <= 1
 *                 latihan. Ulang dari awal lewat pemilih bagian (+ konfirmasi bertumpuk; arsip, yang terlama
 *                 dirotasi), Main lagi dari daftar cerita, "Coba lagi dari bagian 2" (akhir pergi).
 *  kartu   11.1   kartu akhir dari rekaman 7 jalur: 390x844 / 360x740 / 1440x900 (judul, pelajaran, kedua aksi
 *                 terlihat tanpa gulir; <= 90 kata; target >= 44 px; tanpa luber), 844x390 & zoom 200 %, en/zh;
 *                 "Coba lagi dari bagian …" mendarat di awal bab yang benar untuk tiap akhir yang belum baik;
 *                 pemilih bagian (fokus terkunci, Escape, pilih Bagian 3); ulang dari awal lewat tinjauan ->
 *                 pemilih -> konfirmasi (arsip, akhir ditemukan tetap); muat ulang = kartu lagi (epilog tidak
 *                 diulang); ganti bahasa tidak mengubah state; urutan & cincin fokus keyboard; animasi <= 200 md /
 *                 tanpa animasi saat gerak dikurangi.
 *  muat    3      muat ulang di tengah dialog, setelah memilih, saat umpan balik aktivitas (bukti & polis), di
 *                 akhir (tombol "Lihat hasil", fokus ke judul hasil, epilog tidak diulang): penyimpanan identik,
 *                 posisi sama, tanpa penilaian ulang / efek ganda; ketukan ganda.
 *  bahasa  4      ganti bahasa (id -> en -> zh -> id) di tengah dialog & di tengah aktivitas: state identik
 *                 byte-per-byte, teks & riwayat berganti.
 *  rusak   6      progres versi lain / node tak dikenal / JSON rusak -> dialog pemulihan, tidak dihapus
 *                 diam-diam; Kembali tidak mengubah apa pun; Mulai ulang mengarsipkan dengan `sebab` = alasan
 *                 tidak cocok (atau mencadangkan data yang tidak terbaca).
 *  ringan  7      aktivitas bukti & polis di mode ringan (?adegan=ringan) dan saat chunk phaser digagalkan:
 *                 catatan "pilihannya tersedia sebagai daftar", selesai lewat daftar HTML, kartu polis bisa
 *                 diperiksa, Dokumen terbaca, pilihan pertama / baris kartu tidak tertutup bar aksi; panggung cerita
 *                 v3 di mode ringan tanpa gerak (tanpa pembuka / "Lewati pembuka" / animasi) sejak baris pertama.
 *  ketik   8      teks mengetik (gerak aktif & dikurangi), Enter/Spasi, petunjuk penggunaan pertama SEKALI per
 *                 perangkat, "Apa itu …?" di baris yang ditandai episode (v3: b1-mentor.1 tanpa istilah, "nasabah" di
 *                 narasi pintu b1-mentor.4, "klaim" di b2-saran.1/.2 di atas pilihan; ketuk/Enter/Spasi membuka &
 *                 menutup arti tanpa memajukan cerita, >= 44 px, animasi <= 200 md / tanpa animasi), Riwayat,
 *                 Catatan kasus & Bantuan (Modal). Panggung v3: pembuka berjalan bersama baris pertama dengan
 *                 "Lewati pembuka" >= 44 px dan diselesaikan oleh ketukan pertama; gerak dikurangi = komposisi akhir
 *                 langsung (Bu Rina sudah duduk di narasi pintu, tanpa animasi).
 *  tata    9      360x740, 390x844, 768x1024, 844x390, 1440x900, zoom 200 %: tanpa luber, tombol terjangkau & tidak
 *                 tertutup (>= 44 px; termasuk "Apa itu …?" di narasi pintu & di keputusan b2-saran), "Pilih lewat
 *                 daftar" terlihat & tidak tertutup bar aksi setelah "Mulai",
 *                 penghitung ringkas "0/3 foto", dialog foto belum lengkap khusus cerita (tanpa poin/waktu,
 *                 "Lengkapi foto" / "Kirim dengan 1 foto" -> cabang b3-bukti-kurang), kartu polis di atas pilihan,
 *                 tombol HTML di atas kanvas tidak diteruskan ke objek adegan (klik tembus), fokus keyboard di
 *                 aktivitas bukti & polis tidak tertutup bar aksi lengket (pola periksaFokusBar
 *                 tools/e2e-browser.mjs), kartu akhir, console bersih.
 * Keluar kode 1 bila ada GAGAL. Terhadap Vite dev: matikan HMR (server.hmr=false) bila ada yang menyunting
 * berkas selama uji, supaya halaman tidak di-remount di tengah alur.
 */
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.UI_BASE || 'http://127.0.0.1:4000').replace(/\/+$/, '');
const CHROME = process.env.RAKSA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.env.RAKSA_SHOTS ? path.resolve(process.env.RAKSA_SHOTS) : null;
const GERAK = process.env.RAKSA_GERAK === 'kurang' ? 'reduce' : 'no-preference';
const SEMUA_UJI = ['akhir', 'kartu', 'muat', 'bahasa', 'rusak', 'ringan', 'ketik', 'tata'];
const HANYA = process.argv[2] ? process.argv[2].split(',').map((s) => s.trim()).filter(Boolean) : SEMUA_UJI;
const AKAR = path.resolve(import.meta.dirname, '..');
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const NAMA = 'Weli';
const PROFIL = JSON.stringify({ nickname: NAMA, look: { body: 1, skin: 2, hair: 2, color: 2, accessory: 'topi' } });
const EP = 'auto-1';
const HALAMAN = '/cerita/' + EP;

// ------------------------------------------------------------------ teks yang diharapkan

/** Ambil objek literal dari berkas TS (tabel teks / kamus) tanpa kompilasi: `<penanda> = { ... };`. */
function bacaObjek(rel, penanda) {
  const src = fs.readFileSync(path.join(AKAR, rel), 'utf8');
  const i = src.indexOf(penanda);
  if (i < 0) throw new Error(`penanda "${penanda}" tidak ada di ${rel}`);
  const awal = src.indexOf('{', i);
  const akhir = src.lastIndexOf('};');
  return new Function(`return (${src.slice(awal, akhir + 1)});`)();
}

/**
 * Data episode yang dibaca tampilan, diambil dari MODUL episode.ts (bukan regex atas sumber TS: literal node v3 memuat
 * cue adegan, objek bersarang, dan komentar): teks id/en/zh, jenis tiap node, aturan kartu akhir, alasan bermakna
 * ralat, istilah per baris, dan nama lokasi panggung (parameter teks {lokasi}). Satu proses anak `node --import tsx`
 * (tsx sudah dipakai test:client), jadi uji tetap dijalankan dengan `node tools/uji-cerita.mjs`.
 */
function bacaEpisode() {
  const kode = `
    const { EPISODE_AUTO_1: ep } = await import('./client/src/cerita/episode/auto-1/episode.ts');
    const istilah = {};
    for (const n of Object.values(ep.node)) {
      for (const b of n.baris ?? []) istilah[b.teks] = [...new Set([...(istilah[b.teks] ?? []), ...(b.istilah ?? [])])];
    }
    process.stdout.write(JSON.stringify({
      teks: ep.teks,
      lokasi: ep.panggung?.lokasi?.nama ?? null,
      jenis: Object.fromEntries(Object.values(ep.node).map((n) => [n.id, n.jenis])),
      aturan: (ep.kartuAkhir ?? []).map((a) => ({
        id: a.id, akhir: a.akhir, judul: a.judul, sebab: a.sebab, pelajaran: a.pelajaran,
        ulang: a.ulang?.length === 1 && !a.ulang[0].jika ? a.ulang[0].bab : null,
        latihan: a.latihan ?? null,
      })),
      ralat: Object.entries(ep.makna ?? {}).filter(([, m]) => m.nilai === 'ralat').map(([k]) => k),
      istilah,
    }));
  `;
  const keluar = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', kode], {
    cwd: AKAR, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, TSX_TSCONFIG_PATH: 'client/tsconfig.json' },
  });
  return JSON.parse(keluar);
}
const EPISODE = bacaEpisode();
const TEKS = EPISODE.teks;
const KAMUS = bacaObjek('client/src/i18n/kamus/cerita.ts', 'const kamus');
const KAMUS_AKHIR = bacaObjek('client/src/i18n/kamus/ceritaAkhir.ts', 'const kamus');
const KAMUS_AKT = bacaObjek('client/src/i18n/kamus/ceritaAkt.ts', 'const kamus');
const KAMUS_MISI = bacaObjek('client/src/i18n/kamus/misi.ts', 'const kamus');
const isi = (s, param = {}) => String(s).replace(/\{(\w+)\}/g, (u, k) => (k in param ? String(param[k]) : u));
/**
 * Teks episode seperti teksCerita(): bahasa diminta -> Indonesia -> kunci; {nama} = nama pemain, (v3) {lokasi} = nama
 * lokasi panggung (episode.panggung.lokasi.nama, diisi otomatis seperti di teks.ts).
 */
const T = (b, kunci) => isi(TEKS[b]?.[kunci] ?? TEKS.id[kunci] ?? kunci, { ...(EPISODE.lokasi ? { lokasi: EPISODE.lokasi } : {}), nama: NAMA });
const dariKamus = (kamus) => (b, kunci, param) => isi(kamus[b]?.[kunci] ?? kamus.id[kunci] ?? kunci, param);
/** Teks UI mode cerita (kamus `cerita`). */
const K = dariKamus(KAMUS);
/** Kartu akhir, pemilih bagian, "Lihat perjalananku" (kamus `ceritaAkhir`). */
const KA = dariKamus(KAMUS_AKHIR);
/** Aktivitas cerita v2: penghitung foto, dialog foto belum lengkap, kartu polis (kamus `ceritaAkt`). */
const KT = dariKamus(KAMUS_AKT);
/** Teks misi bersama (kamus `misi`). */
const KM = dariKamus(KAMUS_MISI);
const rapat = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
/** Nama nasabah dalam bahasa b (parameter {nama} kamus UI). */
const NASABAH = (b) => T(b, 'pemeran.nasabah.nama');

// ------------------------------------------------------------------ data episode (kontrak bagian 3 & 11)

const AKT = { 'b3-bukti': 'bukti', 'b4-polis': 'polis' };
const MISI_AKT = { bukti: 'cerita-auto1-bukti', polis: 'cerita-auto1-polis' };
const BUKTI_TEPAT = ['foto-full', 'foto-penyok', 'foto-plat'];
/** Pengecoh aktivitas bukti (aktivitas.ts OPSI_BUKTI): detail bagian mobil yang TIDAK rusak. */
const PENGECOH_BAN = 'foto-ban';
const PENGECOH_DASBOR = 'foto-dasbor';
/** Tiga opsi aktivitas polis (v2: `ambang-tlo` dipensiunkan, bagian 11.5). */
const OPSI_POLIS = ['pasti-diganti', 'tidak-tercakup', 'bisa-dinilai'];
const PROSES = ['dokumentasi-dulu', 'bukti', 'baca-polis', 'tanpa-janji'];
const PAHAM = ['langkah-sekarang', 'polis-dinilai', 'risiko-sendiri', 'langkah-berikut'];
const BAB = ['menyambut', 'menggali', 'bukti', 'polis', 'menutup'];
const NADA = { tuntas: 'baik', janji: 'campuran', dingin: 'campuran', tertunda: 'buruk', pergi: 'buruk' };
const JUMLAH_AKHIR = Object.keys(NADA).length;
/** Batas arsip perjalanan biasa per episode, dibaca dari simpan.ts (MAKS_ARSIP_PER_EPISODE). */
const MAKS_ARSIP = Number(/MAKS_ARSIP_PER_EPISODE\s*=\s*(\d+)/.exec(fs.readFileSync(path.join(AKAR, 'client/src/cerita/simpan.ts'), 'utf8'))?.[1] ?? 5);

/**
 * Aturan kartu akhir (episode.kartuAkhir): kunci judul/sebab/pelajaran, bab titik ulang (bila satu bab tanpa syarat)
 * dan misi latihan. Titik ulang bersyarat (dingin-ralat) = null; jalur uji yang memakainya menulis `ulang` sendiri.
 */
const ATURAN = Object.fromEntries(EPISODE.aturan.map(({ id, ...a }) => [id, a]));
/** Jenis tiap node graf (episode.node): titik bab di node 'akhir'/'cabang' tidak bisa diulang (mesin.babBisaDiulang). */
const JENIS_NODE = EPISODE.jenis;
/** Bab yang bisa diulang dari state ini (urutan episode): ada titik bab dan node-nya bukan akhir/cabang. */
const babBisaDiulang = (st) => BAB.filter((b) => { const n = st?.cadangan?.[b]?.node; return !!n && !!JENIS_NODE[n] && !['akhir', 'cabang'].includes(JENIS_NODE[n]); });
/** Kunci alasan yang bermakna "ralat" (episode.makna): ditandai "Diperbaiki" di tinjauan. */
const RALAT = new Set(EPISODE.ralat);
/**
 * Istilah "Apa itu …?" yang ditandai pada sebuah baris (kunci teks -> id istilah, urutan episode). v3: b1-mentor.1 tanpa
 * istilah; `nasabah` di narasi pintu b1-mentor.4, `klaim` di b2-saran.1/.2.
 */
const ISTILAH_BARIS = (kunci) => EPISODE.istilah[kunci] ?? [];
/** Kunci baris epilog sebuah akhir (node akhir-<id>): TIDAK boleh diulang di kartu akhir. */
const EPILOG = (akhir) => Object.keys(TEKS.id).filter((k) => k.startsWith(`akhir-${akhir}.`));
if (Object.keys(ATURAN).length < 10 || !RALAT.size || Object.keys(JENIS_NODE).length < 20 || !['id', 'en', 'zh'].every((b) => Object.keys(TEKS[b] ?? {}).length > 100)) {
  throw new Error('teks / aturan kartu akhir / makna alasan / node tidak terbaca dari episode.ts');
}
if (Object.values(TEKS).some((t) => Object.values(t).some((s) => String(s).includes('{lokasi}'))) && !EPISODE.lokasi) throw new Error('teks memakai {lokasi} tetapi episode.panggung.lokasi.nama kosong');

/**
 * Label suasana di panggung mengikuti WAJAH yang tampil (Panggung.tsx `.cer-suasana[data-ekspresi]`,
 * bagian.tsx labelPerasaan): ekspresi yang dipakai tabel suasana episode memakai label suasana itu, ekspresi
 * lain memakai kamus UI `cerita.ekspresi.<e>`.
 */
const LABEL_WAJAH = { lega: 'suasana.tenang', netral: 'suasana.mulai-tenang', cemas: 'suasana.cemas', kesal: 'suasana.kesal' };
const labelWajah = (b, e) => (LABEL_WAJAH[e] ? T(b, LABEL_WAJAH[e]) : K(b, `ekspresi.${e}`));
/** Kata arah suasana lama ("Suasana membaik/memburuk/tetap"): tidak boleh tampil lagi di mode cerita v2. */
const KATA_ARAH = (b) => ['naik', 'turun', 'tetap'].map((a) => K(b, `arah.${a}`));

/**
 * Baris umpan balik aktivitas bukti (episode.ts b3-bukti.hasil), v2: satu kalimat mentor. 2.5 bila ada bukti terlewat,
 * 2.4 bila tidak ada yang terlewat tetapi ada pengecoh (kiriman >3 foto). 2.1-2.3 (per foto) dipensiunkan: rincian per
 * foto kini di panel (akt.bukti.alasan.*) dan tidak boleh tampil sebagai ucapan mentor.
 */
const UMPAN_BUKTI = ['b3-bukti.hasil.1.1', 'b3-bukti.hasil.2.1', 'b3-bukti.hasil.2.2', 'b3-bukti.hasil.2.3', 'b3-bukti.hasil.2.4', 'b3-bukti.hasil.2.5'];
function umpanBukti(jawab) {
  if (harapHasil('b3-bukti', jawab) === 'tepat') return ['b3-bukti.hasil.1.1'];
  return [BUKTI_TEPAT.some((x) => !jawab.includes(x)) ? 'b3-bukti.hasil.2.5' : 'b3-bukti.hasil.2.4'];
}

const JALUR_TERBAIK = [['b1-datang', 'dengar'], ['b2-saran', 'dokumentasi'], ['b3-bukti', BUKTI_TEPAT], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'jujur'], ['b5-tutup', 'rangkum']];

/**
 * Jalur uji wajib. Langkah = [node, id pilihan | jawaban aktivitas]. `lewat` / `tidakLewat` = node yang (tidak)
 * menampilkan baris di perjalanan ini (dibaca dari riwayat state). `harap(st)` = [ok, keterangan] tambahan.
 * `aturan` = aturan kartu akhir yang harus dipakai (episode.ts KARTU_AKHIR, urutan pertama yang cocok).
 * Jalur TERAKHIR harus berakhir "pergi" (dipakai uji "coba lagi dari bagian").
 */
const JALUR = [
  {
    nama: 'terbaik', akhir: 'tuntas', aturan: 'tuntas-jelas',
    langkah: JALUR_TERBAIK,
    lewat: ['b2-cerita-bagian', 'b3-bukti-tepat', 'b5-rangkum-jelas'],
  },
  {
    nama: 'pemulihan komunikasi', akhir: 'tuntas', aturan: 'tuntas-pulih',
    langkah: [['b1-datang', 'prosedur'], ['b1-pulih', 'maaf'], ['b2-saran', 'dokumentasi'], ['b3-bukti', BUKTI_TEPAT], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'jujur'], ['b5-tutup', 'rangkum']],
    lewat: ['b1-pulih', 'b2-cerita-bagian', 'b5-rangkum-jelas'],
  },
  {
    // Kartu memakai kalimat janji "besok selesai" (kontrak 11.2: jalur janjikan).
    nama: 'janji', akhir: 'janji', aturan: 'janji-besok',
    langkah: [['b1-datang', 'janji'], ['b2-saran', 'dokumentasi'], ['b3-bukti', BUKTI_TEPAT], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'janjikan'], ['b5-tutup', 'rangkum']],
    // Janji masih berlaku: ringkasan ditanggapi dengan janji lama, jadi `langkah-berikut` tidak dipasang.
    lewat: ['b5-rangkum-janji'],
    tidakLewat: ['b2-cerita-bagian', 'b5-rangkum-jelas'],
    harap: (st) => [!st.paham.includes('langkah-berikut'), 'ringkasan tidak memasang "langkah berikutnya" selama janji berlaku'],
  },
  {
    nama: 'dingin', akhir: 'dingin', aturan: 'dingin-singkat',
    langkah: [['b1-datang', 'prosedur'], ['b1-pulih', 'tetap'], ['b2-saran', 'dokumentasi'], ['b3-bukti', BUKTI_TEPAT], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'aturan'], ['b5-tutup', 'singkat']],
    lewat: ['b2-singkat'],
    tidakLewat: ['b2-cerita-bagian', 'b5-rangkum-jelas'],
  },
  {
    // Penutup `singkat` tidak pernah memasang `langkah-berikut`: semua langkah lain tepat & kepercayaan tinggi
    // tetap berakhir "Benar, tapi Berjarak" (episode.ts cabang-akhir).
    nama: 'terbaik tapi menutup singkat', akhir: 'dingin', aturan: 'dingin-singkat',
    langkah: [...JALUR_TERBAIK.slice(0, -1), ['b5-tutup', 'singkat']],
    lewat: ['b2-cerita-bagian', 'b3-bukti-tepat'],
    tidakLewat: ['b5-rangkum-jelas'],
    harap: (st) => [
      st.kepercayaan >= 3 && !st.paham.includes('langkah-berikut') && PAHAM.filter((x) => x !== 'langkah-berikut').every((x) => st.paham.includes(x))
        && PROSES.every((x) => st.proses[x] === 'tepat'),
      'kepercayaan tinggi, semua langkah tepat, hanya "langkah berikutnya" yang belum dipahami',
    ],
  },
  {
    nama: 'bukti kurang (pengecoh ban) + lengkapi', akhir: 'tuntas', aturan: 'tuntas-lengkapi',
    langkah: [['b1-datang', 'dengar'], ['b2-saran', 'dokumentasi'], ['b3-bukti', ['foto-full', 'foto-penyok', PENGECOH_BAN]], ['b3-bukti-kurang', 'lengkapi'], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'jujur'], ['b5-tutup', 'rangkum']],
    lewat: ['b3-bukti-kurang', 'b3-lengkapi', 'b5-rangkum-jelas'],
    tidakLewat: ['b3-cukup', 'b3-bukti-tepat'],
    harap: (st) => [st.proses.bukti === 'dikoreksi' && st.catatan.includes('bukti-lengkap') && !st.catatan.includes('bukti-kurang'), 'bukti "diperbaiki" & Catatan kasus: bukti dilengkapi'],
  },
  {
    nama: 'bukti kurang (pengecoh dasbor) + cukup', akhir: 'tertunda', aturan: 'tertunda-foto',
    langkah: [['b1-datang', 'dengar'], ['b2-saran', 'dokumentasi'], ['b3-bukti', ['foto-full', PENGECOH_DASBOR, 'foto-plat']], ['b3-bukti-kurang', 'cukup'], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'jujur'], ['b5-tutup', 'rangkum']],
    lewat: ['b3-bukti-kurang', 'b3-cukup'],
    tidakLewat: ['b3-lengkapi'],
    harap: (st) => [st.proses.bukti === 'keliru' && st.catatan.includes('bukti-kurang') && st.tanda.includes('bukti-belum-lengkap'), 'bukti "keliru", Catatan kasus: bukti belum lengkap'],
  },
  {
    nama: 'bengkel + biarkan', akhir: 'tertunda', aturan: 'tertunda-bengkel',
    langkah: [['b1-datang', 'dengar'], ['b2-saran', 'bengkel'], ['b2-bengkel-akibat', 'biarkan'], ['b4-polis', 'bisa-dinilai'], ['b5-keberatan', 'jujur'], ['b5-tutup', 'rangkum']],
    // Saran bengkel tidak diluruskan: ringkasan ditanggapi dengan rencana bengkel, `langkah-berikut` tidak dipasang.
    lewat: ['b3-seadanya', 'b5-rangkum-bengkel'],
    tidakLewat: ['b5-rangkum-jelas'],
  },
  {
    nama: 'ringan + tetap-ringan', akhir: 'pergi', aturan: 'pergi-sepele',
    langkah: [['b1-datang', 'dengar'], ['b2-saran', 'ringan'], ['b2-ringan-akibat', 'tetap-ringan']],
    lewat: ['b2-cerita-bagian', 'b2-ringan-akibat'],
  },
];
for (const j of JALUR) if (!ATURAN[j.aturan] || ATURAN[j.aturan].akhir !== j.akhir) throw new Error(`aturan kartu "${j.aturan}" untuk jalur ${j.nama} tidak ada`);
/** Jalur yang akhirnya direkam untuk uji `kartu` (tujuh keadaan akhir: lima akhir + pemulihan + tertunda karena bengkel). */
const KARTU_JALUR = ['terbaik', 'pemulihan komunikasi', 'janji', 'dingin', 'bukti kurang (pengecoh dasbor) + cukup', 'bengkel + biarkan', 'ringan + tetap-ringan'];
const jalurBernama = (n) => JALUR.find((j) => j.nama === n);
/** Bab titik ulang kartu jalur ini (null = akhir baik, tanpa "Coba lagi dari bagian …"). */
const babUlang = (j) => (NADA[j.akhir] === 'baik' ? null : j.ulang ?? ATURAN[j.aturan].ulang);

function harapHasil(node, jawab) {
  if (AKT[node] === 'bukti') {
    const benar = jawab.filter((x) => BUKTI_TEPAT.includes(x)).length;
    return benar === 3 && jawab.length === 3 ? 'tepat' : benar > 0 ? 'sebagian' : 'belum';
  }
  return jawab === 'bisa-dinilai' ? 'tepat' : 'belum';
}

/** Node yang menampilkan baris di perjalanan ini (riwayat menyimpan node tiap baris). */
const nodeDilewati = (st) => new Set((st?.riwayat ?? []).filter((e) => e.jenis === 'baris').map((e) => e.node));

// ------------------------------------------------------------------ pencatat

const mulaiUji = Date.now();
let jumlahCek = 0;
const gagal = [];
const catatan = [];
const durasi = {};
let grup = '';
const cek = (ok, pesan) => {
  jumlahCek++;
  const baris = `[${grup}] ${pesan}`;
  console.log((ok ? 'ok    ' : 'GAGAL ') + baris);
  if (!ok) gagal.push(baris);
  return Boolean(ok);
};
const info = (pesan) => { const baris = `[${grup}] ${pesan}`; console.log('info  ' + baris); catatan.push(baris); };

/**
 * Server TANPA backend permainan (mis. Vite dev tanpa proxy /api): GET /api/health lalu /api/missions dicoba sekali di
 * awal; tidak ada yang menjawab 2xx + JSON = tanpa backend. Hanya dalam keadaan itu galat console jabat tangan WebSocket
 * socket.io (klien permainan mencoba tersambung) diabaikan, dengan satu baris INFO. Dengan backend, galat itu tetap GAGAL.
 * Pola sama dengan GALAT_ABAIKAN tools/uji-panggung.mjs, tetapi dipersempit ke pesan WebSocket socket.io saja.
 */
async function adaBackend() {
  for (const jalur of ['/api/health', '/api/missions']) {
    try {
      const r = await fetch(BASE + jalur, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue;
      JSON.parse(await r.text());
      return true;
    } catch { /* coba jalur berikut */ }
  }
  return false;
}
const BACKEND = await adaBackend();
const GALAT_ABAIKAN = BACKEND ? null : /^console: WebSocket connection to 'wss?:\/\/[^']*\/socket\.io\/[^']*' failed\b/;
if (!BACKEND) {
  const baris = `[umum] ${BASE} tanpa backend (GET /api/health & /api/missions tidak menjawab JSON): galat console jabat tangan WebSocket socket.io diabaikan`;
  console.log('info  ' + baris);
  catatan.push(baris);
}
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
/** Jeda sebelum mengetuk tombol yang baru muncul (layar menggulir halus ±400 md saat gerak aktif). */
const jedaGulir = (p) => tidur(p.__gerak === 'reduce' ? 60 : 450);

/** Angka kepercayaan mentah di teks yang terlihat: "+2", "-1", "Kepercayaan: 3", "trust 2". */
function angkaMentah(teks) {
  return /(^|[\s(（:：])[+\-−]\s?\d+(?![\d/])/.test(teks) || /(kepercayaan|trust|信任)\s*[:：=]?\s*[+\-−]?\d/i.test(teks);
}
/**
 * Bahasa skor / poin / timer / streak yang TIDAK boleh ada di mode cerita (bagian 11.0), id/en/zh. "point"
 * tunggal sengaja tidak termasuk: naskah en memakai "the point of damage" (titik kerusakan).
 */
const POLA_SKOR = /\b(poin|skor|points|scores?|timer|streak|bonus|dtk|detik|seconds?)\b|waktu habis|time'?s up|积分|分数|得分|计时|倒计时|连胜/i;

// ------------------------------------------------------------------ browser & halaman

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  protocolTimeout: 180000,
});

const HP390 = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const HP360 = { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const MENDATAR = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
/** Desktop 1440x900 dengan zoom browser 200 % (tata letak 720x450 CSS px). */
const ZOOM200 = { width: 720, height: 450, deviceScaleFactor: 2 };
const semuaKonteks = [];

/**
 * Halaman di konteks baru (= perangkat baru: localStorage kosong). Profil & bahasa Indonesia dipasang
 * sebelum skrip halaman berjalan (hanya bila belum ada, jadi ganti bahasa bertahan saat muat ulang).
 * `izinGalat` = pola galat console yang memang diharapkan (mis. chunk yang sengaja digagalkan).
 */
async function halaman(nama, vp, { gerak = GERAK, izinGalat = null, blokir = null } = {}) {
  const ctx = await browser.createBrowserContext();
  semuaKonteks.push(ctx);
  const p = await ctx.newPage();
  p.__nama = nama;
  p.__gerak = gerak;
  p.__galat = [];
  p.__diblokir = 0;
  await p.setViewport(vp);
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: gerak }]);
  await p.evaluateOnNewDocument((profil) => {
    try {
      if (!localStorage.getItem('raksa:profil')) localStorage.setItem('raksa:profil', profil);
      if (!localStorage.getItem('raksa:bahasa')) localStorage.setItem('raksa:bahasa', 'id');
    } catch { /* about:blank */ }
    // Posisi objek adegan (diagnostik engine window.__raksaStage.scene) disalin ke __ujiAdegan: di Vite dev
    // (StrictMode) instance pertama yang dibuang bisa mengosongkan catatan milik instance kedua.
    try {
      let s;
      const reg = { live: 0, created: 0, destroyed: 0 };
      Object.defineProperty(reg, 'scene', { enumerable: true, configurable: true, get: () => s, set: (v) => { s = v; if (v) window.__ujiAdegan = v; } });
      window.__raksaStage = reg;
    } catch { /* abaikan */ }
  }, PROFIL);
  const catatGalat = (teks) => {
    if (izinGalat && izinGalat.test(teks)) return;
    if (GALAT_ABAIKAN && GALAT_ABAIKAN.test(teks)) return;
    p.__galat.push(teks.slice(0, 300));
  };
  p.on('pageerror', (e) => catatGalat('pageerror: ' + String(e?.message ?? e)));
  p.on('console', (m) => { if (m.type() === 'error') catatGalat('console: ' + m.text()); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) catatGalat(`http ${r.status()}: ${r.url()}`); });
  if (blokir) {
    await p.setRequestInterception(true);
    p.on('request', (r) => {
      if (blokir.test(r.url())) { p.__diblokir++; void r.abort('failed'); } else void r.continue();
    });
  }
  return p;
}

async function tutupHalaman(p) {
  try { await p.browserContext().close(); } catch { /* sudah tertutup */ }
}

function cekKonsol(p, label = p.__nama) {
  const unik = [...new Set(p.__galat)];
  cek(unik.length === 0, `${label}: console/pageerror bersih` + (unik.length ? ` -> ${unik.slice(0, 4).join(' | ')}` : ''));
  p.__galat.length = 0;
}

async function tangkap(p, nama, { penuh = false } = {}) {
  if (!OUT) return;
  try { await p.screenshot({ path: path.join(OUT, nama + '.png'), fullPage: penuh, timeout: 20000 }); } catch (e) { info(`tangkapan ${nama} gagal: ${String(e?.message ?? e).slice(0, 80)}`); }
}

/** Tunggu sampai fn(arg) di halaman bernilai benar. Timeout = GAGAL (kecuali `diam`). */
async function tunggu(p, fn, label, ms = 20000, arg, diam = false) {
  const batas = Date.now() + ms;
  while (Date.now() < batas) {
    try { if (await p.evaluate(fn, arg)) return true; } catch { /* halaman sedang berganti */ }
    await tidur(80);
  }
  if (!diam) cek(false, `timeout: ${label}`);
  return false;
}

async function buka(p, jalur) {
  await p.goto(BASE + jalur, { waitUntil: 'domcontentloaded' });
  return tunggu(p, () => !!document.querySelector('.cer-main, .cer-pulih, .cer-hub'), `halaman ${jalur} tampil`, 30000);
}

async function muatUlang(p) {
  await p.reload({ waitUntil: 'domcontentloaded' });
  return tunggu(p, () => !!document.querySelector('.cer-main, .cer-pulih'), 'halaman tampil lagi setelah muat ulang', 30000);
}

/**
 * Klik nyata: gulir ke elemen, tunggu posisinya diam (animasi / gulir halus selesai, seperti pemain yang
 * mengetuk setelah layar berhenti bergerak), lalu klik di titik tengahnya. Dicoba ulang bila elemen dirender ulang.
 */
async function klik(p, sel) {
  let galatKlik = null;
  for (let i = 0; i < 4; i++) {
    try {
      const el = await p.$(sel);
      if (!el) { await tidur(120); continue; }
      let lama = null;
      for (let j = 0; j < 25; j++) {
        const kotak = await el.evaluate((e) => {
          // Di luar layar, atau titik tengahnya tertutup elemen lain (mis. bar aksi lengket): pemain menggulir dulu.
          const r0 = e.getBoundingClientRect();
          const atas = document.elementFromPoint(r0.left + r0.width / 2, r0.top + r0.height / 2);
          const tertutup = !atas || !(atas === e || e.contains(atas));
          if (r0.top < 0 || r0.bottom > window.innerHeight || tertutup) e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
          const r = e.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height].map(Math.round).join(',');
        });
        if (kotak === lama) break;
        lama = kotak;
        await tidur(60);
      }
      await el.click();
      return true;
    } catch (e) { galatKlik = String(e?.message ?? e).slice(0, 160); await tidur(120); }
  }
  if (galatKlik) info(`klik ${sel} gagal: ${galatKlik}`);
  return false;
}

/** Klik tombol berdasarkan awal teksnya (daftar alternatif dibuka dulu bila tertutup). */
async function klikTeks(p, selektor, teks) {
  // Adegan yang (dibuat ulang lalu) selesai dimuat melipat daftar alternatif (mis. setelah ganti bahasa):
  // seperti pemain, tunggu layar tenang, buka lagi daftarnya bila terlipat, lalu ketuk.
  for (let i = 0; i < 3; i++) {
    await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', '', 30000, undefined, true);
    const ada = await p.evaluate((sel, t) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      document.querySelectorAll('details.daftar-alternatif:not([open])').forEach((d) => { d.open = true; });
      document.querySelectorAll('[data-uji-sasaran]').forEach((e) => e.removeAttribute('data-uji-sasaran'));
      const b = [...document.querySelectorAll(sel)].find((x) => !x.disabled && x.getBoundingClientRect().height > 0 && norm(x.textContent).startsWith(norm(t)));
      if (!b) return false;
      b.setAttribute('data-uji-sasaran', '');
      return true;
    }, selektor, teks);
    if (!ada) return false;
    if (await klik(p, '[data-uji-sasaran]')) return true;
    info(`"${teks.slice(0, 30)}" belum bisa diketuk (daftar pilihan terlipat lagi saat adegan selesai dimuat); dibuka & diketuk ulang`);
    await tidur(300);
  }
  return false;
}

/** Klik elemen `sel` di dalam dialog TERATAS (dialog bisa bertumpuk: konfirmasi di atas pemilih bagian). */
async function klikDialogAtas(p, sel) {
  const ada = await p.evaluate((s) => {
    document.querySelectorAll('[data-uji-sasaran]').forEach((e) => e.removeAttribute('data-uji-sasaran'));
    const d = [...document.querySelectorAll('[role="dialog"]')].pop();
    const el = d?.querySelector(s);
    if (!el) return false;
    el.setAttribute('data-uji-sasaran', '');
    return true;
  }, sel);
  return ada ? klik(p, '[data-uji-sasaran]') : false;
}

const jumlahDialog = (p) => p.evaluate(() => document.querySelectorAll('[role="dialog"]').length);

/** Keadaan layar + progres tersimpan (satu kali evaluate). */
function keadaan(p) {
  return p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const main = q('.cer-main');
    let raw = null;
    try { raw = localStorage.getItem('raksa:cerita'); } catch { raw = null; }
    let st = null;
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; st = data?.episode?.['auto-1']?.state ?? null; } catch { st = null; }
    return {
      tampilan: main?.getAttribute('data-tampilan') ?? null,
      node: main?.getAttribute('data-node') ?? null,
      opsi: [...document.querySelectorAll('.cer-opsi[data-pilihan]')].map((b) => b.getAttribute('data-pilihan')),
      lanjut: !!q('.cer-lanjut'),
      labelLanjut: (q('.cer-lanjut')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      sisa: q('.cer-dialog-sisa')?.textContent?.length ?? 0,
      teks: q('.cer-dialog-teks')?.textContent ?? '',
      akt: q('.cer-aktivitas')?.getAttribute('data-mode') ?? null,
      misi: q('.misi')?.getAttribute('data-mode') ?? null,
      akhir: !!q('.akh-kartu'),
      pulih: !!q('.cer-pulih'),
      dialog: !!q('[role="dialog"]'),
      raw,
      data,
      st,
    };
  });
}

/** Baris terakhir yang tampil (kunci teks) menurut riwayat state. */
const barisTerakhir = (st) => [...(st?.riwayat ?? [])].reverse().find((e) => e.jenis === 'baris') ?? null;

/**
 * Kalimat yang sedang diketik ditampilkan utuh. Pemeriksaan "masih mengetik" dan ketukannya terjadi dalam SATU
 * evaluate (tanpa balapan: ketukan pada kalimat yang baru saja utuh akan memajukan cerita).
 */
async function utuhkan(p) {
  await p.evaluate(() => {
    if ((document.querySelector('.cer-dialog-sisa')?.textContent?.length ?? 0) > 0) document.querySelector('.cer-dialog-teks')?.click();
  });
  return tunggu(p, () => !document.querySelector('.cer-dialog-sisa'), 'kalimat tampil utuh', 12000);
}

/** Maju satu langkah cerita (kalimat diutuhkan dulu). true bila `langkah` tersimpan naik. */
async function majuSatu(p, label) {
  await utuhkan(p);
  const a = await keadaan(p);
  const l0 = a.st?.langkah ?? -1;
  await klik(p, '.cer-lanjut');
  return tunggu(p, (l) => {
    try { return (JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah ?? -1) > l; } catch { return false; }
  }, `${label}: maju satu langkah`, 8000, l0);
}

/** Tekan "Lanjut" (termasuk ketukan pertama yang mengutuhkan kalimat) sampai syarat(keadaan) terpenuhi. */
async function majuSampai(p, syarat, label, ms = 45000) {
  const batas = Date.now() + ms;
  while (Date.now() < batas) {
    const k = await keadaan(p);
    if (syarat(k)) return k;
    if (k.tampilan === 'dialog' && k.lanjut && !k.dialog) { await klik(p, '.cer-lanjut'); await tidur(40); continue; }
    await tidur(120);
  }
  const k = await keadaan(p);
  cek(false, `timeout: ${label} (layar ${k.tampilan}, node ${k.node}, aktivitas ${k.akt})`);
  await diagnosa(p, label);
  return null;
}

async function ketukDunia(p, x, y, sentuh) {
  const r = await p.evaluate(() => {
    const el = document.querySelector('.adegan');
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
    const q = el?.getBoundingClientRect();
    return q ? { x: q.x, y: q.y, w: q.width, h: q.height } : null;
  });
  if (!r) return false;
  await tidur(120);
  const px = r.x + (x / 640) * r.w;
  const py = r.y + (y / 480) * r.h;
  if (sentuh) await p.touchscreen.tap(px, py);
  else await p.mouse.click(px, py);
  return true;
}

// ------------------------------------------------------------------ pilihan & kalimat ajar (bagian 11.3)

/** Gaya kalimat ajar pertama yang terlihat (warna teks, latar, tepi): harus sama untuk arah naik/turun/tetap. */
const GAYA_ALASAN = { pertama: null, arah: new Set() };
const rgb = (s) => (s || '').match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
/** Warna yang jelas hijau atau merah (penanda benar/salah): tidak boleh dipakai kalimat ajar. */
const berwarnaNilai = (s) => { const [r, g, b] = rgb(s); return (g > r + 40 && g > b + 20) || (r > g + 60 && r > b + 60); };

/** Pilihan cerita lewat tombol nyata + pemeriksaan konsekuensi (uji 2, bagian 11.3). */
async function pilih(p, node, id, { bahasa = 'id', label = '', periksa = true } = {}) {
  const sel = `.cer-opsi[data-pilihan="${id}"]`;
  if (!(await tunggu(p, (s) => !!document.querySelector(s), `${label}: pilihan ${node}/${id} tersedia`, 15000, sel))) return false;
  const a = await keadaan(p);
  await jedaGulir(p);
  await klik(p, sel);
  if (!(await tunggu(p, (n) => document.querySelector('.cer-main')?.getAttribute('data-node') !== n, `${label}: pilihan ${node}/${id} diproses`, 10000, node))) return false;
  // Selagi reaksi diketik, kalimat ajar belum tampil (satu hal dalam satu waktu).
  const awal = await p.evaluate(() => ({ ketik: !!document.querySelector('.cer-dialog-sisa'), alasan: !!document.querySelector('.cer-dialog .cer-alasan') }));
  const k = await keadaan(p);
  const kp = k.st?.keputusan?.at(-1);
  cek(kp?.node === node && kp?.pilihan === id && k.st.keputusan.length === (a.st?.keputusan?.length ?? 0) + 1, `${label}: keputusan ${node}/${id} tercatat sekali`);
  if (!periksa || k.tampilan !== 'dialog') return true;
  if (awal.ketik && k.st?.terakhir?.alasan) cek(!awal.alasan, `${label}: kalimat ajar baru tampil setelah reaksi selesai diketik (${node}/${id})`);

  await utuhkan(p);
  await tidur(120); // live region diisi 60 md setelah baris berganti
  const tampak = await p.evaluate(() => {
    const al = document.querySelector('.cer-dialog .cer-alasan');
    const cs = al ? getComputedStyle(al) : null;
    return {
      kamu: !!document.querySelector('.cer-kamu'),
      dialog: document.querySelector('.cer-dialog')?.textContent ?? '',
      alasan: al?.textContent ?? '',
      arah: al?.getAttribute('data-arah') ?? null,
      ikonArah: !!al?.querySelector('.cer-arah'),
      gaya: cs ? { teks: cs.color, latar: cs.backgroundColor, tepi: cs.borderTopColor } : null,
      siar: document.querySelector('.cer-dialog [aria-live]')?.textContent ?? '',
      teks: document.querySelector('.cer-layar')?.innerText ?? '',
    };
  });
  const ucapan = T(bahasa, `${node}.${id}`);
  const tanpaGema = !tampak.kamu && !rapat(tampak.dialog).includes(rapat(ucapan));
  cek(tanpaGema, `${label}: tanpa gema "${K(bahasa, 'kamu')}: …" (ucapan ${node}/${id} tidak diulang di kotak dialog)`);
  const alasan = k.st?.terakhir?.alasan;
  if (alasan) {
    const delta = k.st.kepercayaan - a.st.kepercayaan;
    const arah = delta > 0 ? 'naik' : delta < 0 ? 'turun' : 'tetap';
    const kataArah = KATA_ARAH(bahasa).filter((w) => rapat(tampak.alasan).includes(w) || rapat(tampak.siar).includes(w));
    const ok2 = rapat(tampak.alasan).includes(rapat(T(bahasa, alasan))) && tampak.arah === arah && kataArah.length === 0 && !tampak.ikonArah;
    cek(ok2, `${label}: satu kalimat ajar netral setelah ${node}/${id} (tanpa kata/ikon arah suasana)` + (ok2 ? '' : ` -> "${rapat(tampak.alasan).slice(0, 90)}" (${tampak.arah}${kataArah.length ? ', kata ' + kataArah.join('/') : ''})`));
    if (tampak.gaya) {
      const g = JSON.stringify(tampak.gaya);
      GAYA_ALASAN.pertama ??= g;
      GAYA_ALASAN.arah.add(arah);
      cek(g === GAYA_ALASAN.pertama && !berwarnaNilai(tampak.gaya.latar) && !berwarnaNilai(tampak.gaya.tepi), `${label}: gaya kalimat ajar netral & sama untuk semua arah (${arah}: latar ${tampak.gaya.latar}, tepi ${tampak.gaya.tepi})`);
    }
    cek(rapat(tampak.siar).includes(rapat(T(bahasa, alasan))), `${label}: live region membacakan reaksi + kalimat ajar (${node}/${id})`);
  } else {
    cek(!tampak.alasan, `${label}: tanpa kalimat ajar bila suasana tidak disentuh (${node}/${id})`);
  }
  cek(!angkaMentah(tampak.teks), `${label}: angka kepercayaan tidak tampil setelah ${node}/${id}`);
  await periksaSuasana(p, bahasa, `${label}: setelah ${node}/${id}`);
  return true;
}

/**
 * Label suasana di panggung = kata untuk WAJAH yang tampil (bukan dari angka kepercayaan): ekspresi chip sama
 * dengan wajah tokoh di panggung, dan teks chip / teks pembaca layar memakai labelWajah(ekspresi itu).
 * Mengembalikan ekspresi yang tampil, atau null bila nasabah tidak berdiri di panggung.
 */
async function periksaSuasana(p, bahasa, label) {
  const s = await p.evaluate(() => {
    const el = document.querySelector('.cer-suasana');
    if (!el) return null;
    return {
      e: el.getAttribute('data-ekspresi'),
      wajah: document.querySelector('.cer-tokoh [data-ekspresi]')?.getAttribute('data-ekspresi') ?? null,
      chip: el.querySelector('[aria-hidden="true"]')?.textContent ?? '',
      aria: el.querySelector('.sr-only')?.textContent ?? '',
    };
  });
  if (!s) return null;
  const nama = NASABAH(bahasa);
  const kata = labelWajah(bahasa, s.e);
  const dikenal = Boolean(LABEL_WAJAH[s.e] || KAMUS.id[`ekspresi.${s.e}`]);
  const ok = dikenal && s.wajah === s.e
    && rapat(s.chip) === rapat(K(bahasa, 'suasanaChip', { nama, suasana: kata }))
    && rapat(s.aria) === rapat(K(bahasa, 'suasanaAria', { nama, suasana: kata }));
  cek(ok, `${label}: label suasana mengikuti wajah "${s.e}" -> "${rapat(K(bahasa, 'suasanaChip', { nama, suasana: kata }))}"`
    + (ok ? '' : ` (wajah tokoh ${s.wajah}, chip "${rapat(s.chip)}", aria "${rapat(s.aria)}")`));
  return s.e;
}

// ------------------------------------------------------------------ aktivitas (bagian 11.5)

/** Penghitung album foto ringkas ("n/3 foto") tanpa slot kosong setinggi kartu. */
async function periksaAlbum(p, n, label, bahasa = 'id') {
  const r = await p.evaluate(() => ({
    hitung: document.querySelector('.misi-panel .baki-hitung')?.textContent ?? null,
    kosong: document.querySelectorAll('.misi-panel .slot-kosong').length,
    ringkas: !!document.querySelector('.misi-panel .baki-ringkas'),
  }));
  const harap = KT(bahasa, 'hitungFoto', { n, maks: BUKTI_TEPAT.length });
  cek(rapat(r.hitung) === rapat(harap) && r.kosong === 0 && r.ringkas, `${label}: album ringkas "${rapat(r.hitung)}" (harap "${harap}", slot kosong ${r.kosong})`);
}

/**
 * Kartu polis yang bisa diperiksa SAAT MENJAWAB (MissionPlay sisipanJawab): baris "Kerusakan benturan" dibuka dengan
 * ketukan (aria-expanded + arti awam), ditutup lagi; jawaban & progres tidak berubah.
 */
async function periksaKartuPolis(p, label, bahasa = 'id') {
  const r0 = await p.evaluate(() => {
    const kartu = document.querySelector('.misi-panel .cer-akt-sisipan .kpp');
    return {
      kartu: !!kartu,
      judul: kartu?.querySelector('.kpp-judul')?.textContent ?? '',
      tombol: [...(kartu?.querySelectorAll('.kpp-tombol') ?? [])].map((b) => ({ teks: b.textContent, exp: b.getAttribute('aria-expanded'), tinggi: Math.round(b.getBoundingClientRect().height) })),
      opsi: [...document.querySelectorAll('.misi-panel button.opsi')].map((b) => b.getAttribute('aria-checked') ?? b.className),
    };
  });
  if (!cek(r0.kartu && rapat(r0.judul) === rapat(T(bahasa, 'akt.polis.kartu.judul')), `${label}: kartu polis tampil di atas pilihan saat menjawab`)) return;
  // Subjudul + 4 baris punya arti (aktivitas.ts kartuArti).
  cek(r0.tombol.length === 5 && r0.tombol.every((b) => b.exp === 'false'), `${label}: subjudul & ${r0.tombol.length - 1} baris kartu bisa diperiksa (aria-expanded, tertutup)`);
  const k0 = await keadaan(p);
  const labelBaris = T(bahasa, 'akt.polis.kartu.benturan.label');
  const bukaTutup = async () => {
    await klikTeks(p, '.misi-panel .cer-akt-sisipan .kpp-tombol', labelBaris);
    await tidur(150);
    return p.evaluate(() => {
      const b = document.querySelector('[data-uji-sasaran]');
      const a = b ? document.getElementById(b.getAttribute('aria-controls')) : null;
      return { exp: b?.getAttribute('aria-expanded') ?? null, arti: a && !a.hidden && a.getClientRects().length ? a.textContent : null };
    });
  };
  const r1 = await bukaTutup();
  cek(r1.exp === 'true' && rapat(r1.arti) === rapat(T(bahasa, 'akt.polis.kartu.benturan.arti')), `${label}: ketuk baris "${labelBaris}" membuka arti awam (${r1.exp})`);
  const r2 = await bukaTutup();
  const k1 = await keadaan(p);
  const opsi1 = await p.evaluate(() => [...document.querySelectorAll('.misi-panel button.opsi')].map((b) => b.getAttribute('aria-checked') ?? b.className));
  cek(r2.exp === 'false' && r2.arti === null && k1.raw === k0.raw && k1.misi === 'play' && JSON.stringify(opsi1) === JSON.stringify(r0.opsi), `${label}: ketuk lagi menutup arti; jawaban & progres tidak berubah`);
}

/**
 * Kerjakan aktivitas: kartu "Mulai" -> MissionPlay (adegan atau daftar HTML) -> kirim -> umpan balik.
 * Mengembalikan { hasil, judul, teks } dari panel umpan balik, atau null.
 */
async function kerjakanAktivitas(p, node, jawab, { bahasa = 'id', viaAdegan = false, label = node, periksaKartu = true, periksaAwal = false, sebelumKirim = null, tangkapan = null } = {}) {
  const idAkt = AKT[node];
  if (!(await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'intro', `${label}: kartu aktivitas ${idAkt} tampil`, 40000))) return null;
  if (periksaKartu) {
    // Kartu SATU tugas (11.5): baris pengantar terakhir + tugas + "Mulai" saja.
    const intro = await p.evaluate(() => {
      const m = document.querySelector('.cer-akt-mulai');
      return {
        tugas: m?.querySelector('.status-tugas h2')?.textContent ?? '',
        lain: [...(m?.querySelectorAll('.kpp, .cer-akt-kartu, .policy-card, .misi-mulai-cara, .misi-cara-ringkas, .misi-mulai-bonus') ?? [])].map((e) => e.className),
        tombol: [...(m?.querySelectorAll('button, a') ?? [])].filter((e) => e.getClientRects().length).map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()),
        teks: m?.innerText ?? '',
      };
    });
    cek(rapat(intro.tugas) === rapat(T(bahasa, `akt.${idAkt}.instruksi`)), `${label}: kartu aktivitas ${idAkt} menampilkan tugas satu kalimat`);
    cek(intro.lain.length === 0 && intro.tombol.length === 1 && intro.tombol[0].startsWith(K(bahasa, 'mulaiAktivitas')), `${label}: kartu aktivitas hanya pengantar + tugas + "Mulai" (tanpa kartu polis / cara main / catatan waktu)` + (intro.lain.length || intro.tombol.length !== 1 ? ` -> ${JSON.stringify(intro)}`.slice(0, 200) : ''));
    cek(!POLA_SKOR.test(intro.teks) && !intro.teks.includes(K(bahasa, 'tanpaWaktu')), `${label}: kartu aktivitas tanpa bahasa poin/waktu`);
  }
  if (tangkapan) await tangkap(p, tangkapan + '-intro');
  await jedaGulir(p);
  await klik(p, '.cer-akt-mulai .primary-action');
  if (!(await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `${label}: aktivitas ${idAkt} bisa dikerjakan`, 15000))) return null;

  const daftar = Array.isArray(jawab) ? jawab : [jawab];
  const labelOpsi = (id) => T(bahasa, `akt.${idAkt}.opsi.${id}`);
  // Seperti pemain: tunggu layar tenang dulu. Saat adegan selesai dimuat, daftar alternatif dilipat
  // (tata letak bergeser), jadi ketukan pada daftar selagi adegan memuat bisa meleset.
  await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', `${label}: adegan ${idAkt} selesai dimuat`, 40000);
  await tidur(150);
  if (periksaAwal) await periksaAwalAktivitas(p, idAkt, label);
  if (periksaKartu) {
    if (idAkt === 'bukti') await periksaAlbum(p, 0, label, bahasa);
    else {
      const opsi = await p.evaluate(() => [...document.querySelectorAll('.misi-panel button.opsi')].map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim()));
      const harap = OPSI_POLIS.map((id) => rapat(labelOpsi(id)));
      cek(opsi.length === 3 && harap.every((h) => opsi.some((o) => o.startsWith(h))) && !opsi.some((o) => o.startsWith(rapat(T(bahasa, 'akt.polis.opsi.ambang-tlo')))), `${label}: tiga pilihan penjelasan kartu (tanpa ambang 75%/TLO) (${opsi.length})`);
      await periksaKartuPolis(p, label, bahasa);
    }
  }
  let lewatAdegan = false;
  if (viaAdegan) {
    let siap = await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') === 'ready', `${label}: adegan ${idAkt} siap diketuk`, 40000);
    // Posisi objek dibaca dari diagnostik engine (salinan __ujiAdegan, lihat halaman()).
    if (siap && !(await tunggu(p, (m) => (window.__ujiAdegan ?? window.__raksaStage?.scene)?.missionId === m, '', 3000, MISI_AKT[idAkt], true))) {
      info(`${label}: posisi objek adegan tidak tersedia, jawab lewat daftar HTML`);
      siap = false;
    }
    if (siap) {
      const obj = await p.evaluate(() => (window.__ujiAdegan ?? window.__raksaStage?.scene)?.objects ?? []);
      const sentuh = Boolean(p.viewport()?.hasTouch);
      for (const id of daftar) {
        const o = obj.find((x) => x.refId === id && x.role === 'option');
        if (!cek(o, `${label}: objek adegan untuk ${id} ada`)) continue;
        await ketukDunia(p, o.x, o.y, sentuh);
        await tidur(450);
      }
      lewatAdegan = true;
    }
  }
  if (!lewatAdegan) {
    for (const id of daftar) {
      const ok = await klikTeks(p, '.misi-panel button.opsi', labelOpsi(id));
      await tidur(120);
      const dipilih = await p.evaluate(() => document.querySelector('[data-uji-sasaran]')?.getAttribute('aria-checked') === 'true');
      cek(ok && dipilih, `${label}: opsi "${labelOpsi(id)}" dipilih lewat daftar HTML`);
    }
  }
  const terpilih = await p.evaluate(() => ({
    slot: [...document.querySelectorAll('.misi-panel .slot-isi .slot-teks')].map((e) => (e.textContent || '').trim()),
    tunggal: [...document.querySelectorAll('.misi-panel button.opsi.dipilih .opsi-teks')].map((e) => (e.firstChild?.textContent || '').trim()),
  }));
  if (Array.isArray(jawab)) {
    const kurang = daftar.filter((id) => !terpilih.slot.includes(labelOpsi(id)));
    cek(kurang.length === 0, `${label}: ${daftar.length} pilihan masuk album (${lewatAdegan ? 'ketukan adegan' : 'daftar HTML'})${kurang.length ? ' - kurang ' + kurang.join(', ') : ''}`);
    if (periksaKartu) await periksaAlbum(p, daftar.length, label, bahasa);
  } else {
    cek(terpilih.tunggal.length === 1 && terpilih.tunggal[0] === labelOpsi(jawab), `${label}: pilihan "${jawab}" tercatat di daftar`);
  }
  if (sebelumKirim) await sebelumKirim();
  if (tangkapan) await tangkap(p, tangkapan + '-main');
  await klik(p, '.misi-aksi .primary-action');
  await tidur(250);
  // Jawaban lengkap: tidak ada dialog. Dialog yang muncul = klik tembus ke objek adegan (GAGAL, lalu ditutup).
  await tutupDialogTembus(p, `${label}: tombol kirim aktivitas ${idAkt}`);
  if (!(await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal' && !!document.querySelector('.cer-umpan'), `${label}: umpan balik aktivitas ${idAkt} tampil`, 15000))) return null;
  await tidur(200);
  if (tangkapan) await tangkap(p, tangkapan + '-umpan-balik');
  return p.evaluate(() => ({
    hasil: document.querySelector('.cer-umpan')?.getAttribute('data-hasil') ?? null,
    judul: document.querySelector('.cer-umpan h2')?.textContent ?? '',
    teks: document.querySelector('.cer-umpan')?.innerText ?? '',
  }));
}

/**
 * Umpan balik aktivitas (11.5): pilihan dikelompokkan (membantu / terlewat / kurang membantu) dengan alasan singkat
 * per pilihan; pilih-satu yang tepat tidak diulang. "Kenapa begitu?" = pengungkap opsional (aria-expanded) yang
 * tidak mengubah progres. Tanpa bahasa poin/waktu.
 */
async function periksaUmpan(p, node, jawab, label, bahasa = 'id') {
  const idAkt = AKT[node];
  const r = await p.evaluate(() => ({
    kelompok: [...document.querySelectorAll('.cer-umpan .cer-opsi-kelompok')].map((g) => ({
      jenis: g.getAttribute('data-kelompok'),
      opsi: [...g.querySelectorAll('li[data-opsi]')].map((li) => ({ id: li.getAttribute('data-opsi'), teks: li.textContent ?? '' })),
    })),
    kenapa: document.querySelector('.cer-umpan .cer-kenapa-tombol')?.getAttribute('aria-expanded') ?? null,
    teks: document.querySelector('.cer-umpan')?.innerText ?? '',
  }));
  const harap = {};
  if (idAkt === 'bukti') {
    const d = Array.isArray(jawab) ? jawab : [jawab];
    harap.membantu = d.filter((x) => BUKTI_TEPAT.includes(x));
    harap.terlewat = BUKTI_TEPAT.filter((x) => !d.includes(x));
    harap.kurang = d.filter((x) => !BUKTI_TEPAT.includes(x));
  } else if (jawab !== 'bisa-dinilai') {
    harap.kurang = [jawab];
    harap.terlewat = ['bisa-dinilai'];
  }
  const salah = [];
  for (const jenis of ['membantu', 'terlewat', 'kurang']) {
    const dapat = r.kelompok.find((g) => g.jenis === jenis)?.opsi ?? [];
    const h = harap[jenis] ?? [];
    if (JSON.stringify(dapat.map((o) => o.id).sort()) !== JSON.stringify([...h].sort())) salah.push(`${jenis}: ${dapat.map((o) => o.id).join('/') || '-'} (harap ${h.join('/') || '-'})`);
    for (const o of dapat) {
      if (!rapat(o.teks).includes(rapat(T(bahasa, `akt.${idAkt}.opsi.${o.id}`))) || !rapat(o.teks).includes(rapat(T(bahasa, `akt.${idAkt}.alasan.${o.id}`)))) salah.push(`${o.id} tanpa label/alasan`);
    }
  }
  cek(salah.length === 0, `${label}: umpan balik ${idAkt} per pilihan dengan alasan singkat${idAkt === 'polis' && jawab === 'bisa-dinilai' ? ' (pilihan tepat tidak diulang)' : ''}${salah.length ? ' -> ' + salah.join('; ') : ''}`);
  cek(!POLA_SKOR.test(r.teks), `${label}: umpan balik ${idAkt} tanpa bahasa poin/waktu`);
  if (r.kenapa === null) { cek(false, `${label}: tombol "${K(bahasa, 'kenapa')}" ada`); return; }
  const k0 = await keadaan(p);
  const buka = async () => {
    await klik(p, '.cer-umpan .cer-kenapa-tombol');
    await tidur(150);
    return p.evaluate(() => {
      const b = document.querySelector('.cer-umpan .cer-kenapa-tombol');
      const i = b ? document.getElementById(b.getAttribute('aria-controls')) : null;
      return { exp: b?.getAttribute('aria-expanded'), isi: i && !i.hidden && i.getClientRects().length ? (i.textContent ?? '') : null };
    });
  };
  const a = await buka();
  const b = await buka();
  const k1 = await keadaan(p);
  cek(r.kenapa === 'false' && a.exp === 'true' && rapat(a.isi).length > 20 && b.exp === 'false' && b.isi === null && k1.raw === k0.raw, `${label}: "${K(bahasa, 'kenapa')}" opsional: buka/tutup (aria-expanded), progres tidak berubah`);
}

/**
 * Ketukan pada kontrol HTML yang kebetulan berada DI ATAS kanvas adegan (bar aksi lengket, tombol dialog) tidak
 * boleh ikut mengetuk objek adegan di bawahnya. Bila dialog muncul tanpa diminta, itu klik tembus: GAGAL,
 * lalu dialog ditutup supaya alur uji tetap berjalan.
 */
async function tutupDialogTembus(p, label) {
  await tidur(150);
  const judul = await p.evaluate(() => (document.querySelector('[role="dialog"]') ? document.querySelector('[role="dialog"] .mdl-judul')?.textContent ?? '?' : null));
  if (judul === null) return false;
  cek(false, `${label}: ketukan ikut diteruskan ke objek adegan di bawahnya (klik tembus membuka "${rapat(judul)}")`);
  await tidur(650); // dialog dokumen mengabaikan tutup < 500 md setelah dibuka
  await p.keyboard.press('Escape');
  await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: dialog klik tembus tertutup`, 5000);
  return true;
}

/**
 * Uji klik tembus yang disengaja: gulir sampai tombol kirim (bar aksi lengket) tepat menutupi objek adegan,
 * lalu ketuk tombolnya (sentuhan di HP, mouse di desktop). Harus: jawaban terkirim, tidak ada dialog dari adegan.
 */
async function periksaKlikTembus(p, label) {
  await tunggu(p, () => ((window.__ujiAdegan ?? window.__raksaStage?.scene)?.objects?.length ?? 0) > 0, '', 3000, undefined, true);
  const g = await p.evaluate(() => {
    const bt = document.querySelector('.misi-aksi .primary-action');
    const aksi = document.querySelector('.misi-aksi');
    const ad = document.querySelector('.adegan');
    const objek = (window.__ujiAdegan ?? window.__raksaStage?.scene)?.objects ?? [];
    if (!bt || !aksi || !ad || ad.getAttribute('data-status') !== 'ready' || !objek.length) {
      return { alasan: `tombol ${!!bt}, bar ${!!aksi}, adegan ${ad?.getAttribute('data-status')}, objek ${objek.length}, mode ${document.querySelector('.misi')?.getAttribute('data-mode')}` };
    }
    const a = ad.getBoundingClientRect();
    const r = bt.getBoundingClientRect();
    return {
      lengket: getComputedStyle(aksi).position === 'sticky',
      objek,
      a: { top: a.top + window.scrollY, left: a.left, w: a.width, h: a.height },
      b: { top: r.top, left: r.left, w: r.width, h: r.height },
    };
  });
  if (!g || g.alasan || !g.lengket) { info(`${label}: uji klik tembus dilewati (${g?.alasan ?? 'bar aksi tidak lengket'})`); return; }
  // Objek adegan yang titiknya berada dalam rentang horizontal tombol.
  const o = g.objek.map((x) => ({ ...x, px: g.a.left + (x.x / 640) * g.a.w, py: g.a.top + (x.y / 480) * g.a.h }))
    .find((x) => x.px > g.b.left + 8 && x.px < g.b.left + g.b.w - 8);
  if (!o) { info(`${label}: uji klik tembus dilewati (tidak ada objek di bawah rentang tombol)`); return; }
  const cy = g.b.top + g.b.h / 2;
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), o.py - cy);
  await tidur(300);
  const posisi = await p.evaluate((x) => {
    const bt = document.querySelector('.misi-aksi .primary-action');
    const r = bt.getBoundingClientRect();
    const a = document.querySelector('.adegan').getBoundingClientRect();
    const y = r.top + r.height / 2;
    const atas = document.elementFromPoint(x, y);
    return { y, diTombol: !!atas && (atas === bt || bt.contains(atas)), diAtasKanvas: y > a.top && y < a.bottom && x > a.left && x < a.right, aktif: !bt.disabled };
  }, o.px);
  if (!posisi.diTombol || !posisi.diAtasKanvas || !posisi.aktif) { info(`${label}: uji klik tembus dilewati (tombol tidak bisa diletakkan di atas objek ${o.id})`); return; }
  if (p.viewport()?.hasTouch) await p.touchscreen.tap(o.px, posisi.y);
  else await p.mouse.click(o.px, posisi.y);
  await tidur(700);
  const r = await p.evaluate(() => ({
    dialog: document.querySelector('[role="dialog"] .mdl-judul')?.textContent ?? null,
    mode: document.querySelector('.misi')?.getAttribute('data-mode') ?? null,
  }));
  cek(r.dialog === null, `${label}: ${p.viewport()?.hasTouch ? 'ketukan' : 'klik'} tombol kirim di atas objek adegan "${o.id}" tidak diteruskan ke adegan${r.dialog ? ` (membuka "${rapat(r.dialog)}")` : ''}`);
  cek(r.mode === 'reveal', `${label}: ${p.viewport()?.hasTouch ? 'ketukan' : 'klik'} tombol kirim di atas adegan mengirim jawaban (mode ${r.mode})`);
  if (r.dialog !== null) {
    await p.keyboard.press('Escape');
    await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: dialog klik tembus tertutup`, 5000);
  }
  if (r.mode !== 'reveal') {
    // Kirim lewat keyboard (tidak melewati adegan) supaya alur uji berikutnya tetap berjalan.
    await p.focus('.misi-aksi .primary-action');
    await p.keyboard.press('Enter');
    await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'reveal', `${label}: kirim lewat keyboard`, 8000);
  }
}

/**
 * Tepat setelah "Mulai" (layar sudah berhenti bergeser): kontrol jawaban pertama terlihat di atas bar aksi
 * lengket, tidak tertutup (pola target C review: pilihan pertama terlihat tanpa mencari).
 */
async function periksaPilihanPertama(p, label) {
  await tidur(p.__gerak === 'reduce' ? 150 : 900);
  const r = await p.evaluate(() => {
    const panel = document.querySelector('.misi-panel');
    const pertama = [...(panel?.querySelectorAll('.opsi, .angka, .kolom, .item-chip') ?? [])]
      .find((el) => el.getClientRects().length > 0 && !el.closest('details:not([open])'))
      ?? panel?.querySelector('.baki .slot') ?? panel?.querySelector('.baki');
    if (!pertama) return null;
    const q = pertama.getBoundingClientRect();
    const aksi = document.querySelector('.misi-aksi');
    const lengket = aksi && getComputedStyle(aksi).position === 'sticky';
    const batas = lengket ? Math.min(window.innerHeight, aksi.getBoundingClientRect().top) : window.innerHeight;
    const atas = document.elementFromPoint(q.left + q.width / 2, Math.min(q.top + q.height / 2, window.innerHeight - 1));
    return {
      teks: (pertama.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
      atas: Math.round(q.top), bawah: Math.round(q.bottom), batas: Math.round(batas),
      penutup: atas && !(atas === pertama || pertama.contains(atas)) ? `${atas.tagName.toLowerCase()}.${String(atas.className).split(' ')[0]}` : null,
    };
  });
  if (!cek(r, `${label}: kontrol jawaban pertama ada`)) return;
  const ok = cek(r.atas >= 0 && r.bawah <= r.batas && !r.penutup, `${label}: setelah Mulai, pilihan pertama "${r.teks}" terlihat di atas bar aksi (y ${r.atas}-${r.bawah}, bar ${r.batas}${r.penutup ? ', tertutup ' + r.penutup : ''})`);
  if (!ok) await tangkap(p, 'pilihan-pertama-' + label.replace(/[^\w-]+/g, '-'));
}

/**
 * Aktivitas foto dengan adegan yang bisa diketuk (11.5): setelah "Mulai" pada posisi gulir awal, ringkasan daftar
 * "Pilih lewat daftar" terlihat UTUH di atas bar aksi lengket dan tidak tertutup (tengah + empat sudut). Tanpa kanvas
 * (daftar sudah terbuka) = pilihan pertama terlihat (periksaPilihanPertama).
 */
async function periksaPembukaDaftar(p, label) {
  await tidur(p.__gerak === 'reduce' ? 250 : 1000);
  const r = await p.evaluate(() => {
    const d = document.querySelector('.misi-panel details.daftar-alternatif');
    if (!d) return null;
    if (d.open) return { terbuka: true };
    const s = d.querySelector('summary');
    const q = s.getBoundingClientRect();
    const aksi = document.querySelector('.misi-aksi');
    const lengket = aksi && getComputedStyle(aksi).position === 'sticky';
    const batas = lengket ? Math.min(innerHeight, aksi.getBoundingClientRect().top) : innerHeight;
    const tutup = [[0.5, 0.5], [0.06, 0.12], [0.94, 0.12], [0.06, 0.88], [0.94, 0.88]].map(([fx, fy]) => {
      const x = q.left + q.width * fx;
      const y = q.top + q.height * fy;
      if (y < 0 || y >= innerHeight) return 'di luar layar';
      const a = document.elementFromPoint(x, y);
      return a && (a === s || s.contains(a)) ? null : (a ? `${a.tagName.toLowerCase()}.${String(a.className).split(' ')[0]}` : 'kosong');
    }).filter(Boolean);
    return { terbuka: false, teks: (s.textContent || '').trim(), y: `${Math.round(q.top)}-${Math.round(q.bottom)}`, ok: q.top >= 0 && q.bottom <= batas + 0.5, batas: Math.round(batas), tutup, tinggi: Math.round(q.height), sy: Math.round(scrollY) };
  });
  if (!cek(r, `${label}: daftar pilihan HTML ada`)) return;
  if (r.terbuka) { await periksaPilihanPertama(p, label); return; }
  const ok = cek(r.ok && r.tutup.length === 0, `${label}: setelah Mulai, "${r.teks}" terlihat utuh di atas bar aksi & tidak tertutup (y ${r.y}, bar ${r.batas}, gulir ${r.sy}${r.tutup.length ? ', tertutup ' + [...new Set(r.tutup)].join('/') : ''})`);
  cek(r.tinggi >= 44, `${label}: "${r.teks}" tinggi >= 44 px (${r.tinggi})`);
  if (!ok) await tangkap(p, 'pembuka-daftar-' + label.replace(/[^\w-]+/g, '-'));
}

/**
 * Aktivitas polis (11.5): kartu polis tampil DI ATAS pilihan; setelah "Mulai" baris kartu pertama terlihat di atas
 * bar aksi & tidak tertutup. Posisi pilihan pertama dicatat (kartu dibaca dulu; pilihan bisa perlu digulir).
 */
async function periksaKartuPolisAwal(p, label) {
  await tidur(p.__gerak === 'reduce' ? 250 : 1000);
  const r = await p.evaluate(() => {
    const kartu = document.querySelector('.misi-panel .cer-akt-sisipan .kpp');
    const baris = kartu?.querySelector('.kpp-tombol');
    const opsi = [...document.querySelectorAll('.misi-panel button.opsi')].find((e) => e.getClientRects().length && !e.closest('details:not([open])'));
    const aksi = document.querySelector('.misi-aksi');
    const batas = aksi && getComputedStyle(aksi).position === 'sticky' ? Math.min(innerHeight, aksi.getBoundingClientRect().top) : innerHeight;
    const k = kartu?.getBoundingClientRect();
    const b = baris?.getBoundingClientRect();
    const o = opsi?.getBoundingClientRect();
    const atas = b ? document.elementFromPoint(b.left + b.width / 2, Math.min(b.top + b.height / 2, innerHeight - 1)) : null;
    return {
      ada: !!kartu, urut: !!(k && o && k.bottom <= o.top + 1),
      barisY: b ? `${Math.round(b.top)}-${Math.round(b.bottom)}` : null,
      barisOk: !!b && b.top >= 0 && b.bottom <= batas + 0.5 && !!atas && (atas === baris || baris.contains(atas)),
      opsiY: o ? `${Math.round(o.top)}-${Math.round(o.bottom)}` : '-', opsiTerlihat: !!o && o.top >= 0 && o.bottom <= batas + 0.5,
      batas: Math.round(batas),
    };
  });
  cek(r.ada && r.urut, `${label}: kartu polis di atas pilihan jawaban`);
  cek(r.barisOk, `${label}: setelah Mulai, baris kartu polis pertama terlihat di atas bar aksi & tidak tertutup (y ${r.barisY}, bar ${r.batas})`);
  info(`${label}: pilihan pertama y ${r.opsiY} (bar ${r.batas})${r.opsiTerlihat ? ', terlihat tanpa gulir' : ', perlu digulir di bawah kartu'}`);
}

/** Pemeriksaan posisi awal setelah "Mulai" sesuai jenis aktivitas. */
function periksaAwalAktivitas(p, idAkt, label) {
  return idAkt === 'polis' ? periksaKartuPolisAwal(p, label) : periksaPembukaDaftar(p, label);
}

/**
 * Fokus keyboard tidak tertutup bar aksi lengket (WCAG 2.4.11). Salinan periksaFokusBar di tools/e2e-browser.mjs
 * (sama persis, `periksa` -> `cek`): mulai dari pertanyaan, Tab melewati kartu tugas & panel jawaban (daftar
 * terlipat dibuka dengan Enter seperti pemain); kotak setiap elemen yang difokus tidak boleh beririsan dengan
 * .misi-aksi yang sedang lengket dan tidak boleh di luar layar. Opsi pertama juga dipilih dengan Spasi (album/
 * pilihan bertambah = tata letak bergeser) lalu diukur lagi. Mengubah jawaban: pakai halaman sendiri (di sini:
 * aktivitas disuntik ulang dari rekaman, jawabannya tidak dikirim).
 */
async function periksaFokusBar(p, label) {
  // Seperti pemain: layar tenang dulu (setelah "Mulai" pertanyaan difokus & halaman digeser pada frame berikutnya).
  await tidur(600);
  await p.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.misi-tanya')?.focus({ preventScroll: true }); });
  const ukur = () => p.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body || !a.closest('.misi-tugas, .misi-panel')) return null;
    const r = a.getBoundingClientRect();
    const bar = document.querySelector('.misi-aksi');
    const b = bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect() : null;
    return {
      teks: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
      tag: a.tagName, tutup: a.tagName === 'SUMMARY' && !a.closest('details')?.open, opsi: a.classList.contains('opsi'),
      y: `${Math.round(r.top)}..${Math.round(r.bottom)}`, bar: b ? Math.round(b.top) : null,
      iris: b ? Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)) : 0,
      luar: r.top < -0.5 || r.bottom > innerHeight + 0.5,
    };
  });
  const masalah = [];
  const cekSatu = (f, apa) => { if (f && (f.iris > 0.5 || f.luar)) masalah.push(`${apa} "${f.teks}" y=${f.y} bar=${f.bar}${f.luar ? ' di luar layar' : ''}`); };
  let stop = 0;
  let spasi = false;
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    await tidur(140);
    let f = await ukur();
    if (!f) break;
    stop++;
    cekSatu(f, `Tab ${i + 1}`);
    if (f.tutup) { await p.keyboard.press('Enter'); await tidur(300); f = await ukur(); cekSatu(f, 'Enter (buka daftar)'); }
    else if (f.opsi && !spasi) { spasi = true; await p.keyboard.press('Space'); await tidur(450); cekSatu(await ukur(), 'Spasi (memilih)'); }
  }
  cek(stop > 0 && spasi, `${label}: Tab mencapai pilihan jawaban (${stop} tab stop)`);
  const ok = cek(masalah.length === 0, `${label}: fokus keyboard tidak tertutup bar aksi / keluar layar${masalah.length ? ': ' + masalah.join(' | ') : ''}`);
  if (!ok) await tangkap(p, 'fokus-bar-' + label.replace(/[^\w-]+/g, '-'));
}

/** "Lanjutkan cerita" dari umpan balik aktivitas. */
async function lanjutUmpan(p, node, label) {
  await jedaGulir(p);
  const diklik = await klik(p, '.cer-umpan-aksi .primary-action');
  const ok = await tunggu(p, (n) => document.querySelector('.cer-main')?.getAttribute('data-node') !== n, `${label}: lanjut dari umpan balik ${node}`, 10000, node);
  if (!ok) await diagnosa(p, `${label}-umpan-${node}`, { diklik });
  return ok;
}

/** Saat gagal: cetak keadaan layar & simpan tangkapan (bila RAKSA_SHOTS diisi) untuk ditelusuri. */
async function diagnosa(p, nama, tambahan = {}) {
  try {
    const k = await keadaan(p);
    const d = await p.evaluate(() => ({
      url: location.pathname + location.search,
      aktif: document.activeElement ? `${document.activeElement.tagName.toLowerCase()}.${document.activeElement.className}` : null,
      tombol: [...document.querySelectorAll('.cer-main button')].slice(0, 8).map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)),
      scrollY: Math.round(window.scrollY),
    }));
    info(`diagnosa ${nama}: ${JSON.stringify({ ...tambahan, tampilan: k.tampilan, node: k.node, akt: k.akt, misi: k.misi, dialog: k.dialog, st: k.st ? { node: k.st.node, baris: k.st.baris, langkah: k.st.langkah, umpanBalik: k.st.umpanBalik } : null, ...d })}`);
    await tangkap(p, 'diagnosa-' + nama.replace(/[^\w-]+/g, '-'), { penuh: true });
  } catch (e) { info(`diagnosa ${nama} gagal: ${String(e?.message ?? e).slice(0, 80)}`); }
}

/** Mainkan satu jalur dari posisi sekarang sampai layar akhir. `rekam(node, keadaan)` dipanggil di tiap langkah. */
async function jalankanJalur(p, j, opsi = {}) {
  if (!(await jalankanLangkah(p, j.langkah, { label: j.nama, ...opsi }))) return false;
  return !!(await majuSampai(p, (x) => x.tampilan === 'akhir' && x.akhir, `${opsi.label ?? j.nama}: menuju layar akhir`));
}

/** Jalankan daftar langkah [node, pilihan | jawaban aktivitas] dari posisi sekarang. */
async function jalankanLangkah(p, langkah, { bahasa = 'id', viaAdegan = false, label = '', rekam = null, tangkapan = null, periksa = true } = {}) {
  for (const [node, jawab] of langkah) {
    const k = await majuSampai(p, (x) => (x.tampilan === 'dialog' && x.opsi.length > 0) || (x.tampilan === 'aktivitas' && x.akt !== null) || x.tampilan === 'akhir', `${label}: menuju ${node}`);
    if (!k) return false;
    if (!cek(k.node === node, `${label}: sampai di ${node}${k.node === node ? '' : ' (malah ' + k.node + ')'}`)) return false;
    if (rekam) await rekam(node, k);
    if (AKT[node]) {
      const r = await kerjakanAktivitas(p, node, jawab, { bahasa, viaAdegan: viaAdegan && node === 'b3-bukti', label, periksaKartu: periksa, tangkapan: tangkapan ? `${tangkapan}-${AKT[node]}` : null });
      if (!r) return false;
      const harap = harapHasil(node, jawab);
      cek(r.hasil === harap && rapat(r.judul) === K(bahasa, `hasil.${harap}`), `${label}: aktivitas ${AKT[node]} dinilai "${harap}" (${r.hasil})`);
      if (periksa) cek(!angkaMentah(r.teks), `${label}: umpan balik ${AKT[node]} tanpa angka kepercayaan`);
      if (periksa && AKT[node] === 'bukti') {
        // Mentor menyebut foto yang terlewat dan pengecoh yang dipilih; baris lain tidak tampil.
        const harapUmpan = umpanBukti(jawab);
        const meleset = UMPAN_BUKTI.filter((x) => rapat(r.teks).includes(rapat(T(bahasa, x))) !== harapUmpan.includes(x));
        cek(meleset.length === 0, `${label}: umpan balik bukti = ${harapUmpan.join(' + ')}` + (meleset.length ? ` (tidak sesuai: ${meleset.join(', ')})` : ''));
      }
      if (periksa) await periksaUmpan(p, node, jawab, label, bahasa);
      if (!(await lanjutUmpan(p, node, label))) return false;
    } else if (!(await pilih(p, node, jawab, { bahasa, label, periksa }))) return false;
  }
  return true;
}

// ------------------------------------------------------------------ kartu akhir (bagian 11.1)

/**
 * Isi kartu akhir sesuai aturan kartuAkhir jalur ini: wajah akhir + label perasaan, nama akhir (ikon + kata nada),
 * judul hasil (h2), satu kalimat sebab, pelajaran, dua aksi (baik: Selesai + Coba jalur lain; lainnya: Coba lagi
 * dari bagian <titik ulang> + Selesai, dengan kalimat akibat), "Lihat perjalananku" + catatan simulasi; epilog,
 * daftar bab, "Episode berikutnya", angka kepercayaan, dan bahasa skor/waktu tidak ada.
 */
async function periksaIsiKartu(p, j, label, bahasa = 'id', { fokusJudul = false } = {}) {
  const a = ATURAN[j.aturan];
  const nada = NADA[j.akhir];
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const kartu = q('.akh-kartu');
    const utama = q('[data-ukur="aksi-utama"]');
    const idKet = utama?.getAttribute('aria-describedby');
    return {
      akhir: kartu?.getAttribute('data-akhir') ?? null,
      nada: kartu?.getAttribute('data-nada') ?? null,
      aturan: kartu?.getAttribute('data-aturan') ?? null,
      judul: q('[data-ukur="akhir-judul"]')?.textContent ?? '',
      judulTag: q('[data-ukur="akhir-judul"]')?.tagName ?? null,
      namaAkhir: q('.akh-nama-akhir')?.textContent ?? '',
      ikonNada: !!q('.akh-nama-akhir .akh-nada svg'),
      perasaan: q('.akh-perasaan')?.textContent ?? '',
      ekspresi: q('.akh-kepala [data-ekspresi]')?.getAttribute('data-ekspresi') ?? null,
      sebab: q('.akh-sebab')?.textContent ?? '',
      pelajaranLabel: q('[data-ukur="akhir-pelajaran"] .akh-pelajaran-label')?.textContent ?? '',
      pelajaran: q('[data-ukur="akhir-pelajaran"] .akh-pelajaran-teks')?.textContent ?? '',
      aksi: [...document.querySelectorAll('.akh-aksi > a, .akh-aksi > button')].map((e) => ({
        ukur: e.getAttribute('data-ukur'), tag: e.tagName, href: e.getAttribute('href'), bab: e.getAttribute('data-bab'), teks: (e.textContent || '').replace(/\s+/g, ' ').trim(),
      })),
      ket: idKet ? document.getElementById(idKet)?.textContent ?? '' : null,
      lihat: q('.akh-kaki .akh-lihat')?.textContent ?? '',
      simulasi: q('.akh-kaki .akh-simulasi')?.textContent ?? '',
      teks: kartu?.textContent ?? '',
      dialogCerita: !!q('.cer-dialog'),
      tautanEpisode: kartu ? kartu.querySelectorAll('a[href^="/cerita/"]').length : -1,
      daftarBab: kartu ? kartu.querySelectorAll('.akh-pemilih-bab').length : -1,
      fokus: document.activeElement?.id ?? null,
    };
  });
  cek(r.akhir === j.akhir && r.nada === nada && r.aturan === j.aturan, `${label}: kartu akhir "${j.akhir}" (${r.nada}) dengan aturan "${j.aturan}"${r.aturan === j.aturan ? '' : ` (malah ${r.aturan})`}`);
  cek(r.judulTag === 'H2' && rapat(r.judul) === rapat(T(bahasa, a.judul)), `${label}: judul hasil "${rapat(T(bahasa, a.judul))}"` + (rapat(r.judul) === rapat(T(bahasa, a.judul)) ? '' : ` (tampil "${rapat(r.judul)}")`));
  if (fokusJudul) cek(r.fokus === 'akh-judul', `${label}: fokus pindah ke judul hasil (${r.fokus})`);
  cek(rapat(r.sebab) === rapat(T(bahasa, a.sebab)), `${label}: satu kalimat sebab-akibat "${rapat(T(bahasa, a.sebab)).slice(0, 70)}…"`);
  cek(rapat(r.pelajaranLabel) === KA(bahasa, 'pelajaranLabel') && rapat(r.pelajaran) === rapat(T(bahasa, a.pelajaran)), `${label}: pelajaran kartu (${a.pelajaran})`);
  cek(r.ikonNada && rapat(r.namaAkhir).includes(K(bahasa, `nada.${nada}`)) && rapat(r.namaAkhir).includes(rapat(T(bahasa, `akhir.${j.akhir}.judul`))), `${label}: nama akhir kecil dengan ikon + kata nada ("${rapat(r.namaAkhir)}")`);
  const suasana = r.ekspresi ? labelWajah(bahasa, r.ekspresi) : '?';
  const rasa = [KA(bahasa, 'perasaanAkhir', { nama: NASABAH(bahasa), suasana }), KA(bahasa, 'perasaanSesudah', { suasana })].map(rapat);
  cek(rasa.includes(rapat(r.perasaan)), `${label}: potret Bu Rina wajah akhir "${r.ekspresi}" + label perasaan "${rapat(r.perasaan)}"`);
  const ulang = babUlang(j);
  const harapAksi = ulang === null
    ? [{ ukur: 'aksi-utama', tag: 'A', href: '/cerita', teks: KA(bahasa, 'selesai') }, { ukur: 'aksi-kedua', tag: 'BUTTON', teks: KA(bahasa, 'cobaJalurLain') }]
    : [{ ukur: 'aksi-utama', tag: 'BUTTON', bab: ulang, teks: KA(bahasa, 'cobaLagiDari', { judul: T(bahasa, `bab.${ulang}.judul`) }) }, { ukur: 'aksi-kedua', tag: 'A', href: '/cerita', teks: KA(bahasa, 'selesai') }];
  const okAksi = r.aksi.length === 2 && harapAksi.every((h, i) => Object.entries(h).every(([kk, v]) => (kk === 'teks' ? rapat(r.aksi[i][kk]) === rapat(v) : r.aksi[i][kk] === v)));
  cek(okAksi, `${label}: dua aksi ${harapAksi.map((h) => `"${h.teks}"`).join(' + ')}` + (okAksi ? '' : ` -> ${JSON.stringify(r.aksi)}`));
  if (ulang !== null) cek(rapat(r.ket) === KA(bahasa, 'ulangKet'), `${label}: kalimat akibat "Coba lagi" terhubung ke tombolnya (aria-describedby)`);
  cek(rapat(r.lihat) === KA(bahasa, 'lihatPerjalanan') && rapat(r.simulasi) === rapat(KM(bahasa, 'catatanSimulasiPeriksa')), `${label}: "${KA(bahasa, 'lihatPerjalanan')}" + catatan simulasi`);
  const epilog = EPILOG(j.akhir).filter((x) => rapat(r.teks).includes(rapat(T(bahasa, x))));
  cek(epilog.length === 0 && !r.dialogCerita && r.tautanEpisode === 0 && r.daftarBab === 0, `${label}: epilog tidak diulang, tanpa daftar bab / episode berikutnya di kartu` + (epilog.length ? ` (epilog: ${epilog.join(', ')})` : ''));
  cek(!angkaMentah(r.teks) && !POLA_SKOR.test(r.teks), `${label}: kartu tanpa angka kepercayaan / bahasa skor, poin, waktu`);
  return r;
}

/**
 * Ukuran kartu di layar (gulir 0): judul, pelajaran, dan KEDUA aksi terlihat tanpa gulir (HP 390x844 & 360x740,
 * juga desktop), <= 90 kata tampil (bahasa Indonesia), tanpa luber, semua kontrol kartu >= 44 px & tidak tertutup.
 */
async function periksaUkuranKartu(p, label, { tanpaGulir = true, kata = true } = {}) {
  const m = await p.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Kata TAMPIL di .cer-main (tanpa .sr-only / tersembunyi / lipatan tertutup), cara hitung ukur.mjs.
    const kataTampil = (sel) => {
      const root = document.querySelector(sel);
      if (!root) return -1;
      let n = 0;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const t = w.currentNode;
        const el = t.parentElement;
        if (!el || el.closest('.sr-only, [hidden], script, style')) continue;
        if (!el.getClientRects().length) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        n += (t.textContent.match(/[\p{L}\p{N}][\p{L}\p{N}’'.,-]*/gu) ?? []).length;
      }
      return n;
    };
    const bawah = (s) => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; return Math.round(e.getBoundingClientRect().bottom + window.scrollY); };
    return {
      bJudul: bawah('[data-ukur="akhir-judul"]'), bPelajaran: bawah('[data-ukur="akhir-pelajaran"]'),
      bUtama: bawah('[data-ukur="aksi-utama"]'), bKedua: bawah('[data-ukur="aksi-kedua"]'),
      vh: window.innerHeight, kata: kataTampil('.cer-main'), tinggi: document.documentElement.scrollHeight,
    };
  });
  const semua = [m.bJudul, m.bPelajaran, m.bUtama, m.bKedua];
  const terlihat = semua.every((x) => x !== null && x <= m.vh);
  if (tanpaGulir) cek(terlihat, `${label}: judul, pelajaran & kedua aksi terlihat tanpa gulir (aksi utama y<=${m.bUtama}, kedua y<=${m.bKedua}, layar ${m.vh})`);
  else info(`${label}: aksi utama y<=${m.bUtama}, kedua y<=${m.bKedua}, layar ${m.vh}, halaman ${m.tinggi}${terlihat ? ' (terlihat tanpa gulir)' : ' (perlu digulir)'}`);
  if (kata) cek(m.kata > 0 && m.kata <= 90, `${label}: ${m.kata} kata tampil di kartu (<= 90, termasuk label & catatan simulasi)`);
  await periksaLuber(p, label);
  await periksaTerjangkau(p, '.akh-kartu a, .akh-kartu button', `${label} kartu`, { minTinggi: 44 });
  return m;
}

/**
 * "Lihat perjalananku" (Modal): tiga kelompok (membantu / perlu diperhatikan / kenapa), sisi perasaan (alasan),
 * langkah klaim (proses: nilai dari state, "Belum dilakukan" = kosong), dan pemahaman nasabah dipisah; ralat ditandai
 * "Diperbaiki"; kelompok kosong ditulis jujur; akhir ditemukan n/5 (yang belum tersamar); paling banyak satu latihan.
 * Membuka & menutupnya tidak mengubah state; Escape mengembalikan fokus ke tombolnya.
 */
async function periksaPerjalanan(p, j, ditemukan, label, bahasa = 'id') {
  const k0 = await keadaan(p);
  const st = k0.st;
  const a = ATURAN[j.aturan];
  const m = await bukaModal(p, '.akh-lihat', `${label}: Lihat perjalananku`);
  if (!m) return;
  cek(m.fokusDiDalam && m.latarInert && rapat(m.judul) === KA(bahasa, 'perjalananJudul'), `${label}: "${KA(bahasa, 'lihatPerjalanan')}" = Modal "${rapat(m.judul)}" (fokus di dalam, latar inert)`);
  const r = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      grup: [...d.querySelectorAll('.akh-kelompok')].map((g) => ({
        k: g.getAttribute('data-kelompok'),
        h: g.querySelector('h4')?.textContent ?? '',
        kosong: g.querySelector('.akh-kosong')?.textContent ?? null,
        sub: [...g.querySelectorAll('.akh-sub')].map((s) => ({
          h: s.querySelector('h5')?.textContent ?? '',
          butir: [...s.querySelectorAll('li')].map((li) => ({ teks: li.querySelector('.akh-daftar-teks')?.textContent ?? li.textContent ?? '', nilai: li.getAttribute('data-nilai'), ralat: !!li.querySelector('.akh-tag-ralat') })),
        })),
      })),
      kenapa: d.querySelector('.akh-kenapa')?.textContent ?? '',
      temuan: d.querySelector('#akh-tj-temuan')?.textContent ?? '',
      ada: d.querySelectorAll('.akh-temuan li[data-ada="ya"]').length,
      samar: [...d.querySelectorAll('.akh-temuan li[data-ada="tidak"]')].map((li) => li.textContent ?? ''),
      ini: d.querySelector('.akh-temuan li[aria-current="true"]')?.textContent ?? '',
      latihan: [...d.querySelectorAll('.akh-tautan')].map((x) => x.getAttribute('href')),
      arahIkon: d.querySelectorAll('.cer-arah, [data-arah]').length,
      teks: d.textContent ?? '',
    };
  });
  const nama = NASABAH(bahasa);
  const urut = r.grup.map((g) => g.k);
  cek(JSON.stringify(urut.slice(0, 4)) === JSON.stringify(['membantu', 'perhatian', 'kenapa', 'temuan'])
    && r.grup.slice(0, 3).map((g) => rapat(g.h)).join('|') === ['membantu', 'perhatian', 'kenapa'].map((x) => KA(bahasa, x)).join('|'),
  `${label}: tinjauan "${KA(bahasa, 'membantu')}" / "${KA(bahasa, 'perhatian')}" / "${KA(bahasa, 'kenapa')}" (${urut.join(', ')})`);
  const sub = (k, h) => r.grup.find((g) => g.k === k)?.sub.find((s) => rapat(s.h) === rapat(h))?.butir ?? [];
  const urutkan = (x) => JSON.stringify([...x].sort());
  // Langkah klaim: nilai dari state (tepat/diperbaiki membantu; keliru/belum dilakukan perlu diperhatikan).
  const baik = (x) => st.proses?.[x] === 'tepat' || st.proses?.[x] === 'dikoreksi';
  const langkahDapat = [...sub('membantu', KA(bahasa, 'subLangkah')).map((b) => `+${rapat(b.teks)}=${b.nilai}`), ...sub('perhatian', KA(bahasa, 'subLangkah')).map((b) => `-${rapat(b.teks)}=${b.nilai}`)];
  const langkahHarap = PROSES.map((x) => `${baik(x) ? '+' : '-'}${rapat(T(bahasa, `proses.${x}`))}=${st.proses?.[x] ?? 'kosong'}`);
  cek(urutkan(langkahDapat) === urutkan(langkahHarap), `${label}: sisi "${KA(bahasa, 'subLangkah')}" sesuai state (${PROSES.map((x) => st.proses?.[x] ?? 'kosong').join(',')})` + (urutkan(langkahDapat) === urutkan(langkahHarap) ? '' : ` -> ${langkahDapat.join(' | ').slice(0, 200)}`));
  const pahamDapat = [...sub('membantu', KA(bahasa, 'subPaham', { nama })).map((b) => `+${rapat(b.teks)}`), ...sub('perhatian', KA(bahasa, 'subBelumPaham', { nama })).map((b) => `-${rapat(b.teks)}`)];
  const pahamHarap = PAHAM.map((x) => `${st.paham?.includes(x) ? '+' : '-'}${rapat(T(bahasa, `paham.${x}`))}`);
  cek(urutkan(pahamDapat) === urutkan(pahamHarap), `${label}: sisi pemahaman ${nama} sesuai state (${PAHAM.map((x) => (st.paham?.includes(x) ? 'ya' : 'tidak')).join(',')})`);
  // Perasaan: dari alasan perjalanan ini, gaya netral (tanpa kata / ikon arah suasana).
  const rasa = [...sub('membantu', KA(bahasa, 'subPerasaan', { nama })), ...sub('perhatian', KA(bahasa, 'subPerasaan', { nama }))];
  const alasanRiwayat = new Set((st.riwayat ?? []).filter((e) => e.jenis === 'alasan').map((e) => rapat(T(bahasa, e.teks))));
  const asing = rasa.filter((b) => !alasanRiwayat.has(rapat(b.teks)));
  const kataArah = KATA_ARAH(bahasa).filter((w) => r.teks.includes(w));
  cek(asing.length === 0 && kataArah.length === 0 && r.arahIkon === 0, `${label}: sisi perasaan ${nama} = alasan perjalanan ini (${rasa.length}), netral tanpa kata/ikon arah suasana` + (asing.length ? ` (asing: ${asing.map((b) => b.teks.slice(0, 40)).join(' | ')})` : '') + (kataArah.length ? ` (kata ${kataArah.join('/')})` : ''));
  const nRalat = new Set((st.riwayat ?? []).filter((e) => e.jenis === 'alasan' && RALAT.has(e.teks)).map((e) => e.teks)).size;
  const nTag = rasa.filter((b) => b.ralat).length;
  cek(nTag === nRalat, `${label}: ralat ditandai "${KA(bahasa, 'diperbaiki')}" (${nTag}, harap ${nRalat})`);
  for (const [k, kunci] of [['membantu', 'kosongMembantu'], ['perhatian', 'kosongPerhatian']]) {
    const g = r.grup.find((x) => x.k === k);
    const n = g ? g.sub.reduce((s, x) => s + x.butir.length, 0) : -1;
    cek(n > 0 ? g.kosong === null : rapat(g?.kosong) === KA(bahasa, kunci), `${label}: kelompok "${KA(bahasa, k)}" ${n > 0 ? `berisi ${n} butir` : `kosong ditulis jujur ("${KA(bahasa, kunci)}")`}`);
  }
  cek(rapat(r.kenapa) === rapat(T(bahasa, a.sebab)), `${label}: "${KA(bahasa, 'kenapa')}" memakai kalimat sebab kartu`);
  const n = ditemukan.size;
  cek(rapat(r.temuan) === KA(bahasa, 'temuan', { n, total: JUMLAH_AKHIR }) && r.ada === n && r.samar.length === JUMLAH_AKHIR - n
    && r.samar.every((x) => rapat(x).includes(K(bahasa, 'akhirTersamar'))) && rapat(r.ini).includes(rapat(T(bahasa, `akhir.${j.akhir}.judul`))),
  `${label}: "${rapat(r.temuan)}", akhir ini ditandai, yang belum ditemukan tersamar`);
  const harapLatihan = a.latihan ? [`/solo/main?misi=${a.latihan}`] : [];
  cek(JSON.stringify(r.latihan) === JSON.stringify(harapLatihan), `${label}: paling banyak satu saran latihan (${r.latihan.join(', ') || 'tanpa'})`);
  cek(!angkaMentah(r.teks) && !POLA_SKOR.test(r.teks), `${label}: tinjauan tanpa angka kepercayaan / bahasa skor, poin, waktu`);
  await p.keyboard.press('Escape');
  await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: tinjauan tertutup dengan Escape`, 5000);
  const f = await p.evaluate(() => document.activeElement?.classList.contains('akh-lihat') ?? false);
  const k1 = await keadaan(p);
  cek(f && k1.raw === k0.raw && k1.akhir, `${label}: Escape mengembalikan fokus ke "${KA(bahasa, 'lihatPerjalanan')}", state tidak berubah`);
}

/** Periksa layar akhir setelah bermain: state, akhir ditemukan, isi kartu, ukuran di layar ini, tinjauan. */
async function periksaAkhir(p, j, ditemukan, label, bahasa = 'id') {
  const k = await keadaan(p);
  cek(k.st?.akhir === j.akhir, `${label}: state mencapai akhir "${j.akhir}" (${k.st?.akhir})`);
  const tersimpan = k.data?.akhir?.[EP] ?? [];
  const harap = [...ditemukan];
  cek(harap.every((a) => tersimpan.includes(a)) && tersimpan.length === harap.length && new Set(tersimpan).size === tersimpan.length, `${label}: akhir tersimpan tanpa duplikat [${tersimpan.join(',')}]`);
  await periksaIsiKartu(p, j, label, bahasa, { fokusJudul: true });
  await periksaUkuranKartu(p, label);
  await periksaPerjalanan(p, j, ditemukan, label, bahasa);
}

/**
 * Pemilih bagian (Modal) dari "Coba jalur lain" (akhir baik) atau dari tinjauan ("Coba dari bagian lain"): satu
 * tombol per bab yang bisa diulang, kalimat akibat, "Disarankan" pada titik ulang, "Ulang dari awal sebagai
 * perjalanan baru". Mengembalikan true bila pemilih terbuka.
 */
async function bukaPemilih(p, { label, lewatTinjauan = false, disarankan = null }) {
  const k0 = await keadaan(p);
  if (lewatTinjauan) {
    if (!(await bukaModal(p, '.akh-lihat', `${label}: Lihat perjalananku`))) return false;
    await klikDialogAtas(p, '.mdl-aksi button:not(.btn-netral)');
  } else {
    await klik(p, '[data-ukur="aksi-kedua"]');
  }
  if (!(await tunggu(p, () => !!document.querySelector('[role="dialog"] .akh-ulang-baru'), `${label}: pemilih bagian terbuka`, 8000))) return false;
  await tidur(350);
  const pm = await p.evaluate(() => {
    const d = [...document.querySelectorAll('[role="dialog"]')].pop();
    return {
      n: document.querySelectorAll('[role="dialog"]').length,
      judul: d.querySelector('.mdl-judul')?.textContent ?? '',
      ket: d.querySelector('.akh-pemilih-ket')?.textContent ?? '',
      bab: [...d.querySelectorAll('.akh-pemilih-bab')].map((b) => ({ bab: b.getAttribute('data-bab'), judul: b.querySelector('b')?.textContent ?? '', saran: !!b.querySelector('.akh-tag'), tinggi: Math.round(b.getBoundingClientRect().height) })),
      ulangBaru: d.querySelector('.akh-ulang-baru')?.textContent ?? '',
      tinggiUlang: Math.round(d.querySelector('.akh-ulang-baru')?.getBoundingClientRect().height ?? 0),
      fokus: d.contains(document.activeElement),
      latarInert: !!document.querySelector('.cer-layar')?.closest('[inert]'),
    };
  });
  const harapBab = babBisaDiulang(k0.st);
  cek(pm.n === 1 && rapat(pm.judul) === KA('id', 'pemilihJudul') && pm.fokus && pm.latarInert, `${label}: pemilih bagian = satu Modal dari ${lewatTinjauan ? 'tinjauan' : `"${KA('id', 'cobaJalurLain')}"`} (fokus di dalam, latar inert)`);
  const okBab = JSON.stringify(pm.bab.map((b) => b.bab)) === JSON.stringify(harapBab)
    && pm.bab.every((b) => rapat(b.judul) === KA('id', 'bagianN', { n: BAB.indexOf(b.bab) + 1, judul: T('id', `bab.${b.bab}.judul`) }));
  cek(okBab, `${label}: satu tombol per bagian yang bisa diulang (${pm.bab.map((b) => b.bab).join(', ')}; harap ${harapBab.join(', ')})`);
  cek(pm.bab.filter((b) => b.saran).map((b) => b.bab).join() === (disarankan ?? ''), `${label}: tanda "${KA('id', 'disarankan')}" ${disarankan ? 'pada bagian ' + disarankan : 'tidak ada (akhir baik)'}`);
  cek(rapat(pm.ket) === KA('id', 'pemilihKet') && rapat(pm.ulangBaru) === KA('id', 'ulangBaru'), `${label}: kalimat akibat & "${KA('id', 'ulangBaru')}" di pemilih`);
  cek(pm.bab.every((b) => b.tinggi >= 44) && pm.tinggiUlang >= 44, `${label}: tombol pemilih >= 44 px (${pm.bab.map((b) => b.tinggi).join('/')}, ulang ${pm.tinggiUlang})`);
  const k1 = await keadaan(p);
  cek(k1.raw === k0.raw, `${label}: membuka pemilih tidak mengubah state`);
  return true;
}

/**
 * Ulang dari awal lewat pemilih bagian: "Ulang dari awal sebagai perjalanan baru" -> konfirmasi yang ada, DITUMPUK
 * di atas pemilih (Batal = kembali ke pemilih, fokus ke tombol ulang, state tetap) -> Ya = arsip + mulai dari awal.
 */
async function ulangLewatPemilih(p, { label, lewatTinjauan = false, batalDulu = false, disarankan = null }) {
  const k0 = await keadaan(p);
  if (!(await bukaPemilih(p, { label, lewatTinjauan, disarankan }))) return false;
  const bukaKonfirmasi = async () => {
    await klikDialogAtas(p, '.akh-ulang-baru');
    const ok = await tunggu(p, () => document.querySelectorAll('[role="dialog"]').length === 2, `${label}: konfirmasi ulang ditumpuk di atas pemilih`, 5000);
    await tidur(300);
    return ok;
  };
  if (!(await bukaKonfirmasi())) return false;
  const kf = await p.evaluate(() => {
    const d = [...document.querySelectorAll('[role="dialog"]')].pop();
    return { judul: d.querySelector('.mdl-judul')?.textContent ?? '', fokus: d.contains(document.activeElement) };
  });
  cek(rapat(kf.judul) === K('id', 'ulangJudul') && kf.fokus, `${label}: konfirmasi "${K('id', 'ulangJudul')}" (fokus di dalam)`);
  if (batalDulu) {
    await klikDialogAtas(p, '.mdl-aksi .btn-netral');
    await tunggu(p, () => document.querySelectorAll('[role="dialog"]').length === 1, `${label}: Batal menutup konfirmasi saja`, 5000);
    await tidur(200);
    const f = await p.evaluate(() => document.activeElement?.classList.contains('akh-ulang-baru') ?? false);
    const k1 = await keadaan(p);
    cek(f && k1.raw === k0.raw && k1.akhir, `${label}: Batal -> kembali ke pemilih (fokus ke tombol ulang), progres & kartu tidak berubah`);
    if (!(await bukaKonfirmasi())) return false;
  }
  await klikDialogAtas(p, '.mdl-aksi .btn-utama');
  return tunggu(p, () => document.querySelector('.cer-main')?.getAttribute('data-node') === 'b1-mentor' && !document.querySelector('[role="dialog"]'), `${label}: ulang dari awal kembali ke b1-mentor, semua dialog tertutup`, 10000);
}

/**
 * "Coba lagi dari bagian …" (aksi utama akhir yang belum baik): langsung ulangBab ke awal bab titik ulang. State =
 * cadangan bab itu, akhir null, bab sesudahnya dibuang, header "Bagian n/5", akhir ditemukan & arsip tetap.
 */
async function periksaCobaLagi(p, j, label) {
  const lama = await keadaan(p);
  const bab = babUlang(j);
  const cad = lama.st?.cadangan?.[bab];
  if (!cek(bab && cad, `${label}: cadangan bab titik ulang "${bab}" tersedia`)) return false;
  await klik(p, '[data-ukur="aksi-utama"]');
  const ok = await tunggu(p, (n) => document.querySelector('.cer-main')?.getAttribute('data-tampilan') === 'dialog' && document.querySelector('.cer-main')?.getAttribute('data-node') === n, `${label}: "Coba lagi" kembali ke awal bagian ${bab}`, 10000, cad.node);
  if (!ok) return false;
  const b = await keadaan(p);
  const header = await p.evaluate(() => document.querySelector('.cer-bab-no')?.textContent ?? '');
  const n = BAB.indexOf(bab) + 1;
  cek(b.st?.node === cad.node && b.st?.akhir === null && JSON.stringify(b.st?.keputusan) === JSON.stringify(cad.keputusan) && b.st?.kepercayaan === cad.kepercayaan, `${label}: state = cadangan bagian ${bab} (node ${b.st?.node}, ${b.st?.keputusan?.length} keputusan)`);
  const sesudah = BAB.slice(n);
  cek(sesudah.every((x) => !b.st?.cadangan?.[x]) && BAB.slice(0, n).every((x) => !lama.st?.cadangan?.[x] || !!b.st?.cadangan?.[x]), `${label}: cadangan bab sesudahnya dibuang, sebelumnya tetap`);
  cek(rapat(header) === K('id', 'bagian', { n, total: BAB.length }) && !b.dialog, `${label}: header "${rapat(header)}", tanpa dialog terbuka`);
  cek(JSON.stringify(b.data?.akhir?.[EP]) === JSON.stringify(lama.data?.akhir?.[EP]) && JSON.stringify(b.data?.arsip) === JSON.stringify(lama.data?.arsip), `${label}: akhir ditemukan & arsip tetap`);
  return true;
}

/** Tombol terjangkau (digulir ke tengah) dan titik tengahnya tidak tertutup elemen lain. */
async function periksaTerjangkau(p, selektor, label, { minTinggi = 0, bukaDaftar = false } = {}) {
  const hasil = await p.evaluate(async (sel, buka) => {
    if (buka) document.querySelectorAll('details.daftar-alternatif:not([open])').forEach((d) => { d.open = true; });
    const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
    const els = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const out = [];
    for (const el of els) {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      await tunggu(80);
      const r = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const titik = [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]].map(([fx, fy]) => {
        const x = Math.min(Math.max(r.left + r.width * fx, 0), vw - 1);
        const y = Math.min(Math.max(r.top + r.height * fy, 0), vh - 1);
        const atas = document.elementFromPoint(x, y);
        return { ok: !!atas && (atas === el || el.contains(atas)), atas: atas ? `${atas.tagName.toLowerCase()}.${String(atas.className?.baseVal ?? atas.className ?? '').split(' ')[0]}` : 'kosong' };
      });
      const tutup = titik.find((t) => !t.ok);
      out.push({
        teks: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 32),
        tertutup: tutup ? tutup.atas : null,
        keluar: r.left < -0.5 || r.right > vw + 0.5 || r.top < -0.5 || r.bottom > vh + 0.5,
        tinggi: Math.round(r.height),
      });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    return out;
  }, selektor, bukaDaftar);
  if (!cek(hasil.length > 0, `${label}: ${selektor} ada`)) return;
  const tertutup = hasil.filter((h) => h.tertutup);
  const keluar = hasil.filter((h) => h.keluar);
  const pendek = minTinggi ? hasil.filter((h) => h.tinggi < minTinggi) : [];
  cek(tertutup.length === 0, `${label}: ${hasil.length} tombol ${selektor} tidak tertutup` + (tertutup.length ? ' -> ' + tertutup.map((h) => `"${h.teks}" oleh ${h.tertutup}`).join('; ') : ''));
  cek(keluar.length === 0, `${label}: ${selektor} bisa digulir masuk layar` + (keluar.length ? ' -> ' + keluar.map((h) => h.teks).join('; ') : ''));
  if (minTinggi) cek(pendek.length === 0, `${label}: ${selektor} tinggi >= ${minTinggi}px` + (pendek.length ? ' -> ' + pendek.map((h) => `${h.teks}(${h.tinggi})`).join('; ') : ''));
}

async function periksaLuber(p, label) {
  const r = await p.evaluate(() => ({ x: document.documentElement.scrollWidth - document.documentElement.clientWidth, b: document.body.scrollWidth - document.documentElement.clientWidth }));
  cek(r.x <= 0 && r.b <= 0, `${label}: tanpa luber horizontal (${Math.max(r.x, r.b)}px)`);
}

/** Tulis progres mentah lalu buka halaman episode (seperti perangkat yang menyimpan progres itu). */
async function suntik(p, raw, jalur = HALAMAN) {
  await p.evaluate((v) => { if (v === null) localStorage.removeItem('raksa:cerita'); else localStorage.setItem('raksa:cerita', v); }, raw);
  return buka(p, jalur);
}

/** Suntik keadaan akhir lalu tunggu kartu akhir tampil. */
async function bukaKartu(p, raw, label) {
  await suntik(p, raw);
  const ok = await tunggu(p, () => !!document.querySelector('.akh-kartu'), `${label}: kartu akhir tampil`, 15000);
  await tidur(300);
  return ok;
}

async function bukaModal(p, tombol, label) {
  await klik(p, tombol);
  if (!(await tunggu(p, () => !!document.querySelector('[role="dialog"]'), `${label}: dialog terbuka`, 8000))) return null;
  // Seperti pemain yang membaca dulu: dialog dokumen misi mengabaikan tutup < 500 md setelah dibuka (penjaga klik hantu).
  await tidur(650);
  return p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      fokusDiDalam: !!d && d.contains(document.activeElement),
      latarInert: !!document.querySelector('.cer-layar')?.closest('[inert]'),
      judul: d?.querySelector('.mdl-judul')?.textContent ?? '',
      // textContent: innerText ikut text-transform CSS (judul bagian huruf kapital).
      teks: d?.textContent ?? '',
    };
  });
}

// ------------------------------------------------------------------ rekaman progres (dipakai uji lain)

/** Progres mentah di titik penting jalur terbaik (keputusan pertama, aktivitas bukti & polis, akhir) + akhir tiap jalur. */
const REKAM = { jalur: {} };
async function rekamTitik(node, k) {
  if (node === 'b1-datang' && !REKAM.pilihan) REKAM.pilihan = k.raw;
  if (node === 'b3-bukti' && !REKAM.bukti) REKAM.bukti = k.raw;
  if (node === 'b4-polis' && !REKAM.polis) REKAM.polis = k.raw;
}
async function pastikanRekaman() {
  if (REKAM.akhir && REKAM.pilihan && REKAM.bukti && REKAM.polis) return true;
  const simpanGrup = grup;
  grup = 'rekaman';
  const p = await halaman('rekaman', { width: 1280, height: 800 });
  await buka(p, HALAMAN);
  const ok = await jalankanJalur(p, JALUR[0], { rekam: rekamTitik, periksa: false, label: 'rekaman jalur terbaik' });
  if (ok) { REKAM.akhir = (await keadaan(p)).raw; REKAM.jalur[JALUR[0].nama] ??= REKAM.akhir; }
  await tutupHalaman(p);
  grup = simpanGrup;
  return cek(ok && REKAM.pilihan && REKAM.bukti && REKAM.polis && REKAM.akhir, 'rekaman progres jalur terbaik tersedia');
}
/** Keadaan akhir satu jalur (direkam uji `akhir`; bila uji itu tidak dijalankan, jalurnya dimainkan tanpa pemeriksaan). */
async function pastikanRekamanJalur(j) {
  if (REKAM.jalur[j.nama]) return true;
  if (j === JALUR[0]) return pastikanRekaman();
  const simpanGrup = grup;
  grup = 'rekaman';
  const p = await halaman('rekaman ' + j.nama, { width: 1280, height: 800 });
  await buka(p, HALAMAN);
  const ok = await jalankanJalur(p, j, { periksa: false, label: `rekaman ${j.nama}` });
  if (ok) REKAM.jalur[j.nama] = (await keadaan(p)).raw;
  await tutupHalaman(p);
  grup = simpanGrup;
  return cek(ok, `rekaman akhir jalur "${j.nama}" tersedia`);
}

// ================================================================== UJI 1, 2, 5 - lima akhir lewat UI

async function ujiAkhir() {
  const p = await halaman('akhir HP 390', HP390);
  await buka(p, HALAMAN);
  const ditemukan = new Set();
  await tangkap(p, '01-hp-percakapan');

  for (let i = 0; i < JALUR.length; i++) {
    const j = JALUR[i];
    const label = `jalur ${j.nama}`;
    const pertama = i === 0;
    const ok = await jalankanJalur(p, j, {
      label,
      viaAdegan: pertama,
      rekam: pertama ? async (node, k) => {
        await rekamTitik(node, k);
        if (node === 'b1-datang') await tangkap(p, '02-hp-keputusan');
      } : null,
      tangkapan: pertama ? '04-hp-aktivitas' : null,
    });
    if (!ok) { cek(false, `${label}: jalur tidak selesai, uji akhir dihentikan`); break; }
    ditemukan.add(j.akhir);
    await tidur(300);
    REKAM.jalur[j.nama] = (await keadaan(p)).raw;
    if (pertama) REKAM.akhir = REKAM.jalur[j.nama];
    await tangkap(p, `08-hp-akhir-${j.akhir}-${j.aturan}`);
    await periksaAkhir(p, j, ditemukan, label);
    {
      const st = (await keadaan(p)).st;
      const dilewati = nodeDilewati(st);
      const kurang = (j.lewat ?? []).filter((n) => !dilewati.has(n));
      const lebih = (j.tidakLewat ?? []).filter((n) => dilewati.has(n));
      cek(kurang.length === 0 && lebih.length === 0, `${label}: node yang dilewati sesuai naskah (${[...(j.lewat ?? []), ...(j.tidakLewat ?? []).map((n) => 'tanpa ' + n)].join(', ')})`
        + (kurang.length ? ` - tidak tampil: ${kurang.join(', ')}` : '') + (lebih.length ? ` - malah tampil: ${lebih.join(', ')}` : ''));
      if (j.harap && st) { const [ok2, ket] = j.harap(st); cek(ok2, `${label}: ${ket}`); }
    }
    cekKonsol(p, label);

    if (i === JALUR.length - 1) break;
    const lama = await keadaan(p);
    const baik = NADA[j.akhir] === 'baik';
    if (j.akhir === 'dingin' && !JALUR.slice(0, i).some((x) => x.akhir === 'dingin')) {
      // Dari daftar cerita: kartu "Selesai" + akhir ditemukan -> "Main lagi dari awal" (diarsipkan).
      await buka(p, '/cerita');
      const kartu = await p.evaluate(() => ({
        status: document.querySelector('.cer-ep')?.getAttribute('data-status') ?? null,
        akhir: document.querySelector('.cer-ep .cer-ep-akhir')?.textContent ?? '',
      }));
      cek(kartu.status === 'selesai' && rapat(kartu.akhir) === K('id', 'akhirDitemukan', { n: ditemukan.size, total: JUMLAH_AKHIR }), `daftar cerita: kartu "Selesai" · "${rapat(kartu.akhir)}"`);
      await klik(p, '.cer-ep-aksi button.primary-action');
      await tunggu(p, () => location.pathname === '/cerita/auto-1' && document.querySelector('.cer-main')?.getAttribute('data-node') === 'b1-mentor', 'Main lagi dari awal membuka episode dari awal', 15000);
    } else {
      // Akhir baik: "Coba jalur lain" -> pemilih; akhir lain: "Lihat perjalananku" -> "Coba dari bagian lain" -> pemilih.
      // Lalu "Ulang dari awal sebagai perjalanan baru" + konfirmasi (pertama kali: Batal dulu, state tidak berubah).
      await ulangLewatPemilih(p, { label: `${j.nama} -> ulang`, lewatTinjauan: !baik, batalDulu: pertama, disarankan: babUlang(j) });
    }
    const baru = await keadaan(p);
    const arsipLama = lama.data?.arsip ?? [];
    const arsipBaru = baru.data?.arsip ?? [];
    const terarsip = arsipBaru.at(-1);
    cek(!baru.data?.episode?.[EP] && baru.tampilan === 'dialog' && baru.node === 'b1-mentor', `${j.nama} -> ulang: cerita mulai dari awal (progres aktif dikosongkan)`);
    // Perjalanan biasa (sebab 'perjalanan') maks MAKS_ARSIP per episode: yang terlama dirotasi (simpan.ts).
    const dirotasi = arsipLama.length + 1 > MAKS_ARSIP;
    cek(arsipBaru.length === Math.min(arsipLama.length + 1, MAKS_ARSIP) && terarsip?.episode === EP && terarsip?.sebab === 'perjalanan' && terarsip?.state?.akhir === j.akhir && JSON.stringify(terarsip?.state) === JSON.stringify(lama.st), `${j.nama} -> ulang: perjalanan lama diarsipkan utuh, sebab "perjalanan" (arsip ${arsipBaru.length}/${MAKS_ARSIP})`);
    if (dirotasi) cek(JSON.stringify(arsipBaru.slice(0, -1)) === JSON.stringify(arsipLama.slice(1)), `${j.nama} -> ulang: arsip penuh, perjalanan terlama dirotasi, sisanya utuh`);
    cek(JSON.stringify(baru.data?.akhir?.[EP]) === JSON.stringify(lama.data?.akhir?.[EP]), `${j.nama} -> ulang: akhir ditemukan tetap (${(baru.data?.akhir?.[EP] ?? []).length})`);
  }
  cek(GAYA_ALASAN.arah.size >= 2, `kalimat ajar diperiksa untuk beberapa arah suasana (${[...GAYA_ALASAN.arah].join(', ')})`);

  // Akhir "pergi": pemilih dari tinjauan (Bagian 1 & 2, "Disarankan" pada titik ulang; Escape -> fokus kembali),
  // lalu aksi utama "Coba lagi dari bagian Menggali Cerita": cadangan bab dipulihkan, bab sesudahnya dibuang.
  const lama = await keadaan(p);
  const jPergi = JALUR.at(-1);
  if (lama.akhir && lama.st?.akhir === 'pergi') {
    if (await bukaPemilih(p, { label: 'akhir pergi', lewatTinjauan: true, disarankan: babUlang(jPergi) })) {
      await tangkap(p, '09-hp-pemilih-pergi');
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), 'akhir pergi: pemilih tertutup dengan Escape', 5000);
      const f = await p.evaluate(() => document.activeElement?.classList.contains('akh-lihat') ?? false);
      cek(f, `akhir pergi: menutup pemilih (dibuka dari tinjauan) mengembalikan fokus ke "${KA('id', 'lihatPerjalanan')}"`);
    }
    const cad = lama.st.cadangan?.[babUlang(jPergi)];
    if (await periksaCobaLagi(p, jPergi, 'coba lagi dari bagian 2')) {
      // Jalur lain betul-betul bisa diambil.
      const k = await majuSampai(p, (x) => x.opsi.length > 0, 'coba lagi: menuju b2-saran');
      if (k) {
        cek(k.node === 'b2-saran' && k.opsi.includes('dokumentasi'), 'coba lagi: keputusan Bagian 2 bisa dipilih ulang');
        await pilih(p, 'b2-saran', 'dokumentasi', { label: 'coba lagi' });
        const c = await keadaan(p);
        cek(c.node === 'b3-bukti-intro' && c.st.keputusan.length === cad.keputusan.length + 1, 'coba lagi: jalur baru berjalan (b3-bukti-intro)');
      }
    }
  } else cek(false, 'coba lagi dari bagian: layar akhir "pergi" tidak tercapai');
  cekKonsol(p);
  await tutupHalaman(p);
}

// ================================================================== UJI kartu - kartu akhir di berbagai layar

async function ujiKartu() {
  const daftar = KARTU_JALUR.map(jalurBernama);
  for (const j of daftar) await pastikanRekamanJalur(j);
  const ada = daftar.filter((j) => REKAM.jalur[j.nama]);
  if (!cek(ada.length === daftar.length, `rekaman akhir ${ada.length}/${daftar.length} jalur tersedia`) && !ada.length) return;
  const nm = (j) => `${j.akhir}/${j.aturan}`;

  // a) HP 390x844 & 360x740, desktop 1440x900: isi, aksi tanpa gulir, <= 90 kata, 44 px, tanpa luber.
  for (const [vpNama, vp] of [['390x844', HP390], ['360x740', HP360], ['1440x900', DESKTOP]]) {
    const p = await halaman('kartu ' + vpNama, vp);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const j of ada) {
      const label = `${vpNama} ${nm(j)}`;
      if (!(await bukaKartu(p, REKAM.jalur[j.nama], label))) continue;
      await periksaIsiKartu(p, j, label);
      await periksaUkuranKartu(p, label);
      if (vpNama !== '1440x900' || j.akhir === 'janji') await tangkap(p, `kartu-${vpNama}-${j.akhir}-${j.aturan}`);
    }
    cekKonsol(p, `kartu ${vpNama}`);
    await tutupHalaman(p);
  }

  // b) HP mendatar & zoom 200 %: tanpa luber, semua kontrol kartu terjangkau (boleh digulir), >= 44 px.
  for (const [vpNama, vp] of [['844x390', MENDATAR], ['zoom200', ZOOM200]]) {
    const p = await halaman('kartu ' + vpNama, vp);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const j of ada.filter((x) => ['janji', 'tuntas'].includes(x.akhir) && x.aturan !== 'tuntas-pulih')) {
      const label = `${vpNama} ${nm(j)}`;
      if (!(await bukaKartu(p, REKAM.jalur[j.nama], label))) continue;
      await periksaIsiKartu(p, j, label);
      await periksaUkuranKartu(p, label, { tanpaGulir: false, kata: false });
      await tangkap(p, `kartu-${vpNama}-${j.akhir}`);
      if (j.akhir === 'janji') {
        const m = await bukaModal(p, '.akh-lihat', `${label}: Lihat perjalananku`);
        const g = await p.evaluate(() => { const i = document.querySelector('[role="dialog"] .mdl-isi'); return i ? { sh: i.scrollHeight, ch: i.clientHeight } : null; });
        await p.evaluate(() => { const i = document.querySelector('[role="dialog"] .mdl-isi'); i?.focus(); });
        await p.keyboard.press('PageDown');
        await tidur(400);
        const st = await p.evaluate(() => document.querySelector('[role="dialog"] .mdl-isi')?.scrollTop ?? 0);
        cek(m && g && (g.sh <= g.ch + 1 || st > 0), `${label}: isi "Lihat perjalananku" bisa digulir keyboard (PageDown ${st}px, isi ${g?.sh}/${g?.ch})`);
        await tangkap(p, `kartu-${vpNama}-janji-perjalanan`);
        await p.keyboard.press('Escape');
        await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: tinjauan tertutup`, 5000);
      }
    }
    cekKonsol(p, `kartu ${vpNama}`);
    await tutupHalaman(p);
  }

  // c) en & zh di 360x740: judul & aksi dalam bahasa itu, aksi terlihat tanpa gulir, tanpa luber.
  for (const bahasa of ['en', 'zh']) {
    const p = await halaman('kartu ' + bahasa, HP360);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.evaluate((b) => localStorage.setItem('raksa:bahasa', b), bahasa);
    for (const j of ada) {
      const label = `${bahasa} 360x740 ${nm(j)}`;
      if (!(await bukaKartu(p, REKAM.jalur[j.nama], label))) continue;
      await periksaIsiKartu(p, j, label, bahasa);
      await periksaUkuranKartu(p, label, { kata: false });
      if (j.akhir === 'janji' || j.akhir === 'tuntas') await tangkap(p, `kartu-${bahasa}-360-${j.akhir}-${j.aturan}`);
    }
    cekKonsol(p, `kartu ${bahasa}`);
    await tutupHalaman(p);
  }

  // d) "Coba lagi dari bagian …" untuk tiap akhir yang belum baik; e) pemilih dari akhir baik; f) ulang dari awal
  //    lewat tinjauan -> pemilih -> konfirmasi; g) muat ulang; h) ganti bahasa.
  {
    const p = await halaman('kartu aksi 390', HP390);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const j of ada.filter((x) => babUlang(x) !== null)) {
      if (!(await bukaKartu(p, REKAM.jalur[j.nama], `coba lagi ${nm(j)}`))) continue;
      if (await periksaCobaLagi(p, j, `coba lagi ${nm(j)}`)) await tangkap(p, `kartu-coba-lagi-${j.aturan}`);
    }
    // e) Akhir baik: "Coba jalur lain" -> pemilih; Tab terkunci; Escape -> fokus kembali; pilih Bagian 3.
    const jBaik = ada.find((x) => x.aturan === 'tuntas-jelas');
    if (jBaik && (await bukaKartu(p, REKAM.jalur[jBaik.nama], 'pemilih'))) {
      if (await bukaPemilih(p, { label: 'pemilih tuntas' })) {
        await tangkap(p, 'kartu-pemilih-tuntas');
        let keluar = 0;
        for (let i = 0; i < 8; i++) {
          await p.keyboard.press('Tab');
          if (!(await p.evaluate(() => !!document.querySelector('[role="dialog"]')?.contains(document.activeElement)))) keluar++;
        }
        cek(keluar === 0, `pemilih tuntas: Tab 8x tetap di dalam pemilih (${keluar} keluar)`);
        await p.keyboard.press('Escape');
        await tunggu(p, () => !document.querySelector('[role="dialog"]'), 'pemilih tuntas: tertutup dengan Escape', 5000);
        const f = await p.evaluate(() => document.activeElement?.getAttribute('data-ukur'));
        cek(f === 'aksi-kedua', `pemilih tuntas: Escape mengembalikan fokus ke "${KA('id', 'cobaJalurLain')}" (${f})`);
      }
      const lama = await keadaan(p);
      if (await bukaPemilih(p, { label: 'pemilih tuntas (2)' })) {
        const cad = lama.st?.cadangan?.bukti;
        // Pemilih mengabaikan ketukan pointer < 500 ms setelah terbuka (penjaga klik ganda "Coba jalur lain"): tunggu
        // seperti pemain sungguhan sebelum memilih bab.
        await tidur(650);
        await klikDialogAtas(p, '.akh-pemilih-bab[data-bab="bukti"]');
        const ok = await tunggu(p, (n) => document.querySelector('.cer-main')?.getAttribute('data-node') === n && !document.querySelector('[role="dialog"]'), 'pemilih: Bagian 3 dibuka', 10000, cad?.node);
        const b = await keadaan(p);
        cek(ok && b.st?.node === cad?.node && b.st?.akhir === null && JSON.stringify(b.data?.akhir?.[EP]) === JSON.stringify(lama.data?.akhir?.[EP]), `pemilih: "Bagian 3" mendarat di awal bab bukti (${b.st?.node}), akhir ditemukan tetap`);
      }
    }
    // f) Akhir janji: ulang dari awal lewat tinjauan -> pemilih -> konfirmasi (Batal dulu) -> arsip.
    const jJanji = ada.find((x) => x.akhir === 'janji');
    if (jJanji && (await bukaKartu(p, REKAM.jalur[jJanji.nama], 'ulang janji'))) {
      const lama = await keadaan(p);
      if (await ulangLewatPemilih(p, { label: 'ulang janji', lewatTinjauan: true, batalDulu: true, disarankan: babUlang(jJanji) })) {
        const baru = await keadaan(p);
        const ar = baru.data?.arsip ?? [];
        cek(ar.length === Math.min((lama.data?.arsip?.length ?? 0) + 1, MAKS_ARSIP) && ar.at(-1)?.state?.akhir === 'janji' && ar.at(-1)?.sebab === 'perjalanan' && JSON.stringify(baru.data?.akhir?.[EP]) === JSON.stringify(lama.data?.akhir?.[EP]), `ulang janji: perjalanan diarsipkan (${ar.length}), akhir ditemukan tetap`);
      }
    }
    // g) Muat ulang di akhir: kartu langsung tampil, epilog tidak diulang, penyimpanan identik (juga setelah
    //    membuka & menutup tinjauan).
    if (jJanji && (await bukaKartu(p, REKAM.jalur[jJanji.nama], 'muat ulang janji'))) {
      const z1 = await keadaan(p);
      await bukaModal(p, '.akh-lihat', 'muat ulang janji: tinjauan');
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), 'muat ulang janji: tinjauan tertutup', 5000);
      await muatUlang(p);
      await tunggu(p, () => !!document.querySelector('.akh-kartu'), 'muat ulang janji: kartu tampil lagi', 15000);
      await tidur(300);
      const z2 = await keadaan(p);
      cek(z2.raw === z1.raw && z2.tampilan === 'akhir' && !(await p.$('.cer-dialog')), 'muat ulang di akhir: kartu langsung tampil, epilog tidak diulang, penyimpanan identik');
      // h) Ganti bahasa di kartu: teks berganti, state identik.
      for (const b of ['en', 'zh', 'id']) {
        await gantiBahasa(p, b);
        const harap = rapat(T(b, ATURAN[jJanji.aturan].judul));
        const ok = await tunggu(p, (t) => (document.querySelector('[data-ukur="akhir-judul"]')?.textContent ?? '').replace(/\s+/g, ' ').trim() === t, `kartu: judul berganti ke ${b}`, 8000, harap);
        const utama = await p.evaluate(() => (document.querySelector('[data-ukur="aksi-utama"]')?.textContent ?? '').replace(/\s+/g, ' ').trim());
        const k = await keadaan(p);
        cek(ok && k.raw === z1.raw && rapat(utama) === rapat(KA(b, 'cobaLagiDari', { judul: T(b, `bab.${babUlang(jJanji)}.judul`) })), `kartu: ganti ke ${b} -> judul & aksi berganti, state identik`);
      }
    }
    cekKonsol(p, 'kartu aksi 390');
    await tutupHalaman(p);
  }

  // i) Keyboard (1440x900): judul -> aksi utama -> aksi kedua -> "Lihat perjalananku", cincin fokus terlihat; Enter
  //    membuka tinjauan; Escape kembali.
  {
    const p = await halaman('kartu keyboard', DESKTOP);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const j of ada.filter((x) => ['tuntas-jelas', 'janji-besok'].includes(x.aturan))) {
      const label = `keyboard ${nm(j)}`;
      if (!(await bukaKartu(p, REKAM.jalur[j.nama], label))) continue;
      await p.evaluate(() => document.getElementById('akh-judul')?.focus());
      const urut = [];
      for (let i = 0; i < 3; i++) {
        await p.keyboard.press('Tab');
        await tidur(80);
        urut.push(await p.evaluate(() => {
          const a = document.activeElement;
          const cs = a ? getComputedStyle(a) : null;
          const cincin = !!cs && ((cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'));
          return { id: a?.getAttribute('data-ukur') ?? (a?.classList.contains('akh-lihat') ? 'lihat' : a?.tagName), cincin };
        }));
      }
      cek(urut.map((x) => x.id).join(',') === 'aksi-utama,aksi-kedua,lihat', `${label}: Tab dari judul -> aksi utama -> aksi kedua -> "Lihat perjalananku" (${urut.map((x) => x.id).join(', ')})`);
      cek(urut.every((x) => x.cincin), `${label}: cincin fokus terlihat di setiap aksi`);
      await p.keyboard.press('Enter');
      const buka2 = await tunggu(p, () => !!document.querySelector('[role="dialog"] .akh-tinjauan') && !!document.querySelector('[role="dialog"]')?.contains(document.activeElement), `${label}: Enter membuka tinjauan dengan fokus di dalam`, 5000);
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: tinjauan tertutup`, 5000);
      const f = await p.evaluate(() => document.activeElement?.classList.contains('akh-lihat') ?? false);
      cek(buka2 && f, `${label}: tinjauan dibuka dengan keyboard, Escape mengembalikan fokus`);
    }
    cekKonsol(p, 'kartu keyboard');
    await tutupHalaman(p);
  }

  // j) Gerak: kartu muncul <= 200 md; gerak dikurangi = tanpa animasi.
  const jBaik = ada.find((x) => x.aturan === 'tuntas-jelas') ?? ada[0];
  for (const gerak of ['no-preference', 'reduce']) {
    const p = await halaman('kartu gerak ' + gerak, HP390, { gerak });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    if (await bukaKartu(p, REKAM.jalur[jBaik.nama], `gerak ${gerak}`)) {
      const an = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.akh-kartu')); return { nama: s.animationName, dur: s.animationDuration }; });
      const dtk = parseFloat(an.dur) * (an.dur.endsWith('ms') ? 0.001 : 1);
      if (gerak === 'reduce') cek(an.nama === 'none' || dtk === 0, `gerak dikurangi: kartu akhir tanpa animasi (${an.nama} ${an.dur})`);
      else cek(an.nama !== 'none' && dtk > 0 && dtk <= 0.2, `gerak aktif: kartu akhir muncul <= 200 md (${an.nama} ${an.dur})`);
    }
    await tutupHalaman(p);
  }
}

// ================================================================== UJI 3 - muat ulang

async function ujiMuat() {
  const p = await halaman('muat HP 390', HP390);
  await buka(p, HALAMAN);
  // a) di tengah dialog (baris pertama Bu Rina, b1-datang)
  await majuSampai(p, (k) => k.st?.node === 'b1-datang' && k.st?.baris === 1, 'menuju baris pertama b1-datang');
  const a = await keadaan(p);
  const kunci = barisTerakhir(a.st)?.teks;
  await muatUlang(p);
  const b = await keadaan(p);
  cek(b.raw === a.raw, 'muat ulang di tengah dialog: penyimpanan identik (memuat tidak menulis)');
  cek(b.node === a.node && b.tampilan === 'dialog' && rapat(b.teks) === rapat(T('id', kunci)), `muat ulang di tengah dialog: posisi & kalimat sama (${b.node}, baris ${b.st?.baris})`);
  cek(await majuSatu(p, 'setelah muat ulang'), 'setelah muat ulang: Lanjut bekerja');
  const c = await keadaan(p);
  cek(c.st.langkah === a.st.langkah + 1 && c.st.baris === a.st.baris + 1, 'setelah muat ulang: satu ketukan = satu langkah');

  // b) setelah memilih (kalimat ajar tampil lagi tanpa gema "Kamu: …", efek tidak dobel)
  await majuSampai(p, (k) => k.opsi.length > 0, 'menuju pilihan b1-datang');
  await pilih(p, 'b1-datang', 'dengar', { label: 'muat' });
  const d = await keadaan(p);
  await muatUlang(p);
  await utuhkan(p);
  const e = await keadaan(p);
  const tampak = await p.evaluate(() => ({ kamu: !!document.querySelector('.cer-kamu'), alasan: document.querySelector('.cer-dialog .cer-alasan')?.textContent ?? '' }));
  cek(e.raw === d.raw && e.st.kepercayaan === d.st.kepercayaan, 'muat ulang setelah memilih: penyimpanan identik, efek tidak diterapkan lagi');
  cek(!tampak.kamu && rapat(tampak.alasan).includes(rapat(T('id', 'b1-datang.dengar.alasan'))), 'muat ulang setelah memilih: kalimat ajar tampil lagi (tanpa gema "Kamu: …")');

  // c) ketukan ganda pada pilihan = satu keputusan
  await majuSampai(p, (k) => k.node === 'b2-saran' && k.opsi.length > 0, 'menuju b2-saran');
  const f = await keadaan(p);
  await jedaGulir(p);
  await p.evaluate(() => { const t = document.querySelector('.cer-opsi[data-pilihan="dokumentasi"]'); t?.click(); t?.click(); });
  await tunggu(p, () => document.querySelector('.cer-main')?.getAttribute('data-node') !== 'b2-saran', 'pilihan ganda diproses', 8000);
  await tidur(200);
  const g = await keadaan(p);
  cek(g.st.keputusan.length === f.st.keputusan.length + 1 && g.st.kepercayaan === f.st.kepercayaan + 1 && g.st.langkah === f.st.langkah + 1, 'ketukan ganda pada pilihan: tercatat & berefek sekali');

  // d) saat umpan balik aktivitas bukti
  await majuSampai(p, (k) => k.tampilan === 'aktivitas' && k.akt !== null, 'menuju aktivitas bukti');
  const r1 = await kerjakanAktivitas(p, 'b3-bukti', BUKTI_TEPAT, { label: 'muat bukti', periksaKartu: false });
  const h = await keadaan(p);
  const umpan1 = r1?.teks ?? '';
  await muatUlang(p);
  await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal' && !!document.querySelector('.cer-umpan'), 'umpan balik bukti tampil lagi setelah muat ulang', 30000);
  const i1 = await keadaan(p);
  const umpan2 = await p.evaluate(() => document.querySelector('.cer-umpan')?.innerText ?? '');
  const nAkt = (st) => (st?.riwayat ?? []).filter((x) => x.jenis === 'aktivitas').length;
  cek(i1.raw === h.raw, 'muat ulang saat umpan balik bukti: penyimpanan identik (tanpa penilaian ulang)');
  cek(rapat(umpan2) === rapat(umpan1) && nAkt(i1.st) === 1, 'muat ulang saat umpan balik bukti: pembahasan sama dari jawaban tersimpan');
  await lanjutUmpan(p, 'b3-bukti', 'muat');
  const j1 = await keadaan(p);
  cek(j1.node === 'b3-bukti-tepat' && j1.st.kepercayaan === h.st.kepercayaan && nAkt(j1.st) === 1, 'setelah umpan balik bukti: lanjut sekali, efek tidak dobel');

  // e) saat umpan balik aktivitas polis (efek kepercayaan +1 hanya sekali)
  await majuSampai(p, (k) => k.tampilan === 'aktivitas' && k.akt !== null && k.node === 'b4-polis', 'menuju aktivitas polis');
  const sebelumPolis = (await keadaan(p)).st.kepercayaan;
  await kerjakanAktivitas(p, 'b4-polis', 'bisa-dinilai', { label: 'muat polis', periksaKartu: false });
  const m1 = await keadaan(p);
  await muatUlang(p);
  await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal', 'umpan balik polis tampil lagi setelah muat ulang', 30000);
  const m2 = await keadaan(p);
  cek(m2.raw === m1.raw && m1.st.kepercayaan === sebelumPolis + 1, 'muat ulang saat umpan balik polis: penyimpanan identik, kepercayaan naik sekali');
  await lanjutUmpan(p, 'b4-polis', 'muat');
  const m3 = await keadaan(p);
  cek(m3.node === 'b4-polis-tepat' && m3.st.kepercayaan === sebelumPolis + 1 && m3.st.proses['baca-polis'] === 'tepat', 'setelah umpan balik polis: efek tidak diterapkan lagi');

  // f) di akhir: baris epilog terakhir memberi tombol "Lihat hasil"; kartu memindah fokus ke judul hasil; muat
  //    ulang langsung membuka kartu (epilog tidak diulang).
  await majuSampai(p, (k) => k.node === 'b5-keberatan' && k.opsi.length > 0, 'menuju b5-keberatan');
  await pilih(p, 'b5-keberatan', 'jujur', { label: 'muat', periksa: false });
  await majuSampai(p, (k) => k.opsi.length > 0, 'menuju b5-tutup');
  await pilih(p, 'b5-tutup', 'rangkum', { label: 'muat', periksa: false });
  const epilog = await majuSampai(p, (k) => k.akhir || (k.node === 'akhir-tuntas' && k.labelLanjut === K('id', 'lihatRingkasan') && k.sisa === 0), 'menuju baris epilog terakhir');
  cek(epilog && !epilog.akhir && epilog.labelLanjut === K('id', 'lihatRingkasan'), `baris epilog terakhir: tombol "${K('id', 'lihatRingkasan')}" (${epilog?.labelLanjut})`);
  await klik(p, '.cer-lanjut');
  await tunggu(p, () => !!document.querySelector('.akh-kartu'), 'kartu akhir tampil setelah "Lihat hasil"', 10000);
  await tidur(300);
  const z1 = await keadaan(p);
  await periksaIsiKartu(p, JALUR[0], 'kartu setelah "Lihat hasil"', 'id', { fokusJudul: true });
  const judul1 = await p.evaluate(() => document.querySelector('#akh-judul')?.textContent ?? '');
  await muatUlang(p);
  await tunggu(p, () => !!document.querySelector('.akh-kartu'), 'kartu akhir tampil langsung setelah muat ulang', 15000);
  const z2 = await keadaan(p);
  const judul2 = await p.evaluate(() => document.querySelector('#akh-judul')?.textContent ?? '');
  cek(z2.raw === z1.raw && judul2 === judul1 && rapat(judul2) === rapat(T('id', ATURAN[JALUR[0].aturan].judul)), 'muat ulang di akhir: kartu yang sama, penyimpanan identik');
  cek(z2.tampilan === 'akhir' && !(await p.$('.cer-dialog')), 'muat ulang di akhir: epilog tidak diulang');
  cek(JSON.stringify(z2.data?.akhir?.[EP]) === JSON.stringify(['tuntas']), 'muat ulang di akhir: akhir ditemukan tidak dobel');
  cekKonsol(p);
  await tutupHalaman(p);
}

// ================================================================== UJI 4 - ganti bahasa

async function gantiBahasa(p, b) {
  await p.select('.pilih-bahasa select', b);
  return tunggu(p, (bb) => { try { return localStorage.getItem('raksa:bahasa') === bb; } catch { return false; } }, `bahasa ${b} aktif`, 5000, b);
}

async function ujiBahasa() {
  const p = await halaman('bahasa HP 390', HP390);
  await buka(p, HALAMAN);
  await majuSampai(p, (k) => k.opsi.length > 0, 'menuju b1-datang');
  await pilih(p, 'b1-datang', 'dengar', { label: 'bahasa' });
  await majuSatu(p, 'bahasa');
  await utuhkan(p);
  const a = await keadaan(p);
  const kunci = barisTerakhir(a.st)?.teks;
  // Wajah yang tampil (bukan kepercayaan) menentukan label; ganti bahasa tidak boleh mengubah wajahnya.
  const wajah = await periksaSuasana(p, 'id', 'bahasa id');
  cek(wajah !== null, `bahasa: Bu Rina di panggung dengan label suasana (${wajah})`);

  for (const b of ['en', 'zh', 'id']) {
    await gantiBahasa(p, b);
    const ok = await tunggu(p, (t) => (document.querySelector('.cer-dialog-teks')?.textContent ?? '').replace(/\s+/g, ' ').trim() === t, `teks dialog berganti ke ${b}`, 8000, rapat(T(b, kunci)));
    const k = await keadaan(p);
    const layar = await p.evaluate(() => ({
      bab: document.querySelector('.cer-bab-judul')?.textContent ?? '',
      tujuan: document.querySelector('.cer-tujuan')?.textContent ?? '',
      lang: document.documentElement.lang,
    }));
    cek(k.raw === a.raw, `ganti ke ${b}: state tersimpan identik byte-per-byte`);
    cek(ok && k.node === a.node, `ganti ke ${b}: kalimat yang sama tampil dalam bahasa baru (${a.node})`);
    cek(rapat(layar.bab) === rapat(T(b, 'bab.menggali.judul')) && rapat(layar.tujuan).includes(rapat(T(b, 'bab.menggali.tujuan'))), `ganti ke ${b}: judul & tujuan bab berganti`);
    const wajahB = await periksaSuasana(p, b, `ganti ke ${b}`);
    cek(wajahB === wajah, `ganti ke ${b}: wajah Bu Rina tetap "${wajah}" (${wajahB}), hanya kata labelnya yang berganti`);
    const m = await bukaModal(p, '.cer-alat .cer-alat-tombol:first-child', `riwayat ${b}`);
    if (m) {
      const isiRiwayat = rapat(m.teks);
      // Pilihan pemain tetap di Riwayat (gema "Kamu: …" hanya dihapus dari kotak dialog).
      cek(rapat(m.judul) === K(b, 'riwayatJudul') && isiRiwayat.includes(rapat(T(b, 'b1-mentor.1'))) && isiRiwayat.includes(rapat(T(b, 'b1-datang.dengar'))) && isiRiwayat.includes(rapat(T(b, 'b1-datang.dengar.alasan'))), `ganti ke ${b}: riwayat (termasuk pilihanmu) ikut bahasa baru`);
      if (b !== 'id') cek(!isiRiwayat.includes(rapat(T('id', 'b1-datang.1'))), `ganti ke ${b}: riwayat tanpa kalimat Indonesia tersisa`);
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), 'riwayat tertutup', 5000);
    }
    const k2 = await keadaan(p);
    cek(k2.raw === a.raw, `ganti ke ${b} + buka riwayat: state tetap identik`);
  }

  // Ganti bahasa di tengah aktivitas: draf pilihan tetap, label berganti, state tidak tersentuh.
  await gantiBahasa(p, 'zh');
  await majuSampai(p, (k) => k.opsi.length > 0, 'menuju b2-saran (zh)');
  await pilih(p, 'b2-saran', 'dokumentasi', { bahasa: 'zh', label: 'bahasa zh' });
  await majuSampai(p, (k) => k.tampilan === 'aktivitas' && k.akt === 'intro', 'menuju aktivitas bukti (zh)');
  await jedaGulir(p);
  await klik(p, '.cer-akt-mulai .primary-action');
  await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', 'aktivitas bukti bisa dikerjakan (zh)', 15000);
  for (const id of BUKTI_TEPAT.slice(0, 2)) cek(await klikTeks(p, '.misi-panel button.opsi', T('zh', `akt.bukti.opsi.${id}`)), `bahasa: opsi zh "${T('zh', `akt.bukti.opsi.${id}`)}" dipilih`);
  await periksaAlbum(p, 2, 'bahasa zh', 'zh');
  const s1 = await keadaan(p);
  await gantiBahasa(p, 'en');
  const harapEn = BUKTI_TEPAT.slice(0, 2).map((id) => T('en', `akt.bukti.opsi.${id}`));
  const okSlot = await tunggu(p, (hh) => JSON.stringify([...document.querySelectorAll('.misi-panel .slot-isi .slot-teks')].map((e) => (e.textContent || '').trim())) === JSON.stringify(hh), 'draf aktivitas tetap & berganti ke en', 8000, harapEn);
  const s2 = await keadaan(p);
  cek(okSlot && s2.misi === 'play', 'ganti bahasa di tengah aktivitas: dua pilihan tetap, label berganti ke en');
  cek(s2.raw === s1.raw, 'ganti bahasa di tengah aktivitas: state tersimpan identik');
  await periksaAlbum(p, 2, 'bahasa en', 'en');
  const ok3 = await klikTeks(p, '.misi-panel button.opsi', T('en', 'akt.bukti.opsi.foto-plat'));
  if (!ok3) {
    const opsi = await p.evaluate(() => [...document.querySelectorAll('.misi-panel button.opsi')].map((b) => { const r = b.getBoundingClientRect(); return `${(b.textContent || '').trim().slice(0, 22)}|${b.disabled ? 'mati' : 'aktif'}|y${Math.round(r.top)} h${Math.round(r.height)} w${Math.round(r.width)}|open ${b.closest('details')?.open}|vis ${getComputedStyle(b).visibility}|pe ${getComputedStyle(b).pointerEvents}|${b.hasAttribute('data-uji-sasaran') ? 'SASARAN' : ''}`; }));
    await diagnosa(p, 'bahasa-opsi-ketiga', { opsi, adegan: await p.evaluate(() => document.querySelector('.adegan')?.getAttribute('data-status')) });
  }
  cek(ok3, 'bahasa: opsi ketiga dipilih dalam en');
  await klik(p, '.misi-aksi .primary-action');
  await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal', 'umpan balik bukti (en)', 15000);
  const u = await p.evaluate(() => ({ hasil: document.querySelector('.cer-umpan')?.getAttribute('data-hasil'), judul: document.querySelector('.cer-umpan h2')?.textContent ?? '' }));
  cek(u.hasil === 'tepat' && rapat(u.judul) === K('en', 'hasil.tepat'), 'aktivitas setelah ganti bahasa dinilai tepat (judul en)');
  await periksaUmpan(p, 'b3-bukti', BUKTI_TEPAT, 'bahasa en', 'en');
  const s3 = await keadaan(p);
  await gantiBahasa(p, 'id');
  const okUmpan = await tunggu(p, (t) => (document.querySelector('.cer-umpan h2')?.textContent ?? '').trim() === t, 'umpan balik berganti ke id', 8000, K('id', 'hasil.tepat'));
  const s4 = await keadaan(p);
  cek(okUmpan && s4.raw === s3.raw, 'ganti bahasa saat umpan balik: teks berganti, state identik');
  await tangkap(p, 'bahasa-umpan-balik-id');
  cekKonsol(p);
  await tutupHalaman(p);
}

// ================================================================== UJI 6 - progres lama / rusak

async function ujiRusak() {
  await pastikanRekaman();
  const asli = JSON.parse(REKAM.pilihan);
  const stAsli = asli.episode[EP].state;
  const varian = [
    {
      nama: 'versi episode berbeda', alasan: 'versi',
      raw: JSON.stringify({ format: 1, episode: { [EP]: { versi: 99, state: { ...stAsli, versi: 99 }, disimpan: 1 } }, akhir: { [EP]: ['pergi'] }, arsip: [] }),
    },
    {
      nama: 'node tak dikenal', alasan: 'node-hilang',
      raw: JSON.stringify({ format: 1, episode: { [EP]: { versi: stAsli.versi, state: { ...stAsli, node: 'b9-hilang' }, disimpan: 1 } }, akhir: { [EP]: ['pergi'] }, arsip: [] }),
    },
    { nama: 'JSON rusak', alasan: 'rusak', raw: '{"format":1,"episode":{"auto-1":{"versi":1,"state":{"node":"b2-cer' },
  ];
  for (const v of varian) {
    const p = await halaman('rusak ' + v.alasan, HP390);
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await suntik(p, v.raw, '/cerita');
    const kartu = await p.evaluate(() => ({ status: document.querySelector('.cer-ep')?.getAttribute('data-status'), teks: document.querySelector('.cer-ep-status')?.textContent ?? '' }));
    cek(kartu.status === 'tidakCocok' && rapat(kartu.teks).includes(K('id', 'statusTidakCocok')), `${v.nama}: kartu di daftar cerita "${K('id', 'statusTidakCocok')}"`);
    await buka(p, HALAMAN);
    const m = await tunggu(p, () => !!document.querySelector('[role="dialog"]') && !!document.querySelector('.cer-pulih'), `${v.nama}: dialog pemulihan tampil`, 10000);
    const d = await p.evaluate(() => {
      const dl = document.querySelector('[role="dialog"]');
      return { judul: dl?.querySelector('.mdl-judul')?.textContent ?? '', teks: dl?.innerText ?? '', fokus: !!dl && dl.contains(document.activeElement) };
    });
    const k = await keadaan(p);
    cek(m && rapat(d.judul) === K('id', 'pulihJudul') && rapat(d.teks).includes(K('id', `pulih.${v.alasan}`)) && rapat(d.teks).includes(K('id', 'pulihArsip')), `${v.nama}: dialog menjelaskan alasan (${v.alasan}) & arsip`);
    cek(d.fokus, `${v.nama}: fokus di dalam dialog pemulihan`);
    cek(k.raw === v.raw, `${v.nama}: data lama tidak disentuh saat dibuka`);
    if (v.alasan === 'versi') await tangkap(p, 'pulih-versi');
    // Kembali: tidak ada yang berubah.
    await klik(p, '.mdl-aksi .btn-netral');
    await tunggu(p, () => location.pathname === '/cerita' && !!document.querySelector('.cer-hub'), `${v.nama}: Kembali ke daftar`, 10000);
    const k2 = await keadaan(p);
    cek(k2.raw === v.raw, `${v.nama}: setelah Kembali data lama tetap utuh`);
    // Mulai ulang: diarsipkan (atau dicadangkan bila tidak terbaca), akhir ditemukan tetap.
    await buka(p, HALAMAN);
    await tunggu(p, () => !!document.querySelector('[role="dialog"]'), `${v.nama}: dialog pemulihan tampil lagi`, 10000);
    await klik(p, '.mdl-aksi .btn-utama');
    await tunggu(p, () => document.querySelector('.cer-main')?.getAttribute('data-node') === 'b1-mentor' && !document.querySelector('[role="dialog"]'), `${v.nama}: Mulai ulang membuka episode dari awal`, 10000);
    const k3 = await keadaan(p);
    const cadangan = await p.evaluate(() => Object.keys(localStorage).filter((x) => x.startsWith('raksa:cerita:rusak:')).map((x) => localStorage.getItem(x)));
    if (v.alasan === 'rusak') {
      cek(cadangan.length === 1 && cadangan[0] === v.raw, `${v.nama}: data mentah lama dicadangkan utuh (raksa:cerita:rusak:*)`);
      cek(k3.data?.format === 1 && !k3.data?.episode?.[EP], `${v.nama}: penyimpanan cerita kembali terbaca`);
    } else {
      const lama = JSON.parse(v.raw);
      const ar = k3.data?.arsip ?? [];
      cek(!k3.data?.episode?.[EP] && ar.length === 1 && JSON.stringify(ar[0].state) === JSON.stringify(lama.episode[EP].state) && ar[0].versi === lama.episode[EP].versi, `${v.nama}: Mulai ulang mengarsipkan progres lama utuh`);
      // Arsip progres tidak cocok disematkan dengan alasannya (tidak pernah dirotasi, simpan.ts).
      cek(ar[0]?.sebab === v.alasan, `${v.nama}: arsip mencatat sebab "${v.alasan}" (${ar[0]?.sebab})`);
      cek(JSON.stringify(k3.data?.akhir?.[EP]) === JSON.stringify(['pergi']), `${v.nama}: akhir ditemukan tetap`);
      cek(cadangan.length === 0, `${v.nama}: tanpa cadangan "rusak" yang tidak perlu`);
    }
    cek(await majuSatu(p, v.nama), `${v.nama}: cerita baru berjalan setelah Mulai ulang`);
    const k4 = await keadaan(p);
    cek(k4.data?.episode?.[EP]?.versi === stAsli.versi && k4.st?.langkah === 1, `${v.nama}: progres baru tersimpan (versi ${k4.data?.episode?.[EP]?.versi})`);
    cekKonsol(p);
    await tutupHalaman(p);
  }
}

// ================================================================== UJI 7 - mode ringan & engine gagal

async function ujiRingan() {
  const varian = [
    { nama: 'mode ringan', vp: HP360, jalur: HALAMAN + '?adegan=ringan', status: 'static', blokir: null },
    { nama: 'engine gagal', vp: HP390, jalur: HALAMAN, status: 'failed', blokir: /phaser/i, izin: /ERR_FAILED|Failed to load resource|dynamically imported module|Importing a module script failed/i },
  ];
  for (const v of varian) {
    const p = await halaman(v.nama, v.vp, { blokir: v.blokir, izinGalat: v.izin ?? null });
    await buka(p, v.jalur);
    if (v.status === 'static') {
      // Mode ringan juga berlaku untuk panggung cerita v3 sejak baris pertama: tanpa pembuka / kedatangan beranimasi.
      await tunggu(p, () => !!document.querySelector('.cer-panggung'), `${v.nama}: panggung cerita tampil`, 15000);
      await tidur(300);
      const pg = await bacaPanggung(p);
      cek(pg.diam && !pg.gerak && !pg.lewati && pg.anim === 0, `${v.nama}: panggung cerita tanpa gerak sejak baris pertama (${v.jalur.split('?')[1]}) (${JSON.stringify(pg)})`);
    }
    await jalankanLangkah(p, [['b1-datang', 'dengar'], ['b2-saran', 'dokumentasi']], { label: v.nama, periksa: false });
    const k0 = await majuSampai(p, (k) => k.tampilan === 'aktivitas' && k.akt !== null, `${v.nama}: menuju aktivitas bukti`);
    if (!k0) { await tutupHalaman(p); continue; }
    // Sebelum "Mulai": gambar tidak bisa disentuh -> catatan di bawahnya menyebut pilihannya berupa daftar.
    await tunggu(p, (s) => document.querySelector('.adegan')?.getAttribute('data-status') === s, `${v.nama}: adegan '${v.status}' sebelum Mulai`, 30000, v.status);
    await tidur(200);
    const ket = await p.evaluate(() => document.querySelector('.adegan-ket')?.textContent ?? '');
    cek(rapat(ket) === rapat(KT('id', 'ketDaftarMulai', { tombol: K('id', 'mulaiAktivitas') })), `${v.nama}: catatan sebelum Mulai "${rapat(ket).slice(0, 70)}"`);
    let adegan = null;
    const r = await kerjakanAktivitas(p, 'b3-bukti', BUKTI_TEPAT, {
      label: `${v.nama} bukti`,
      periksaAwal: true,
      sebelumKirim: async () => {
        adegan = await p.evaluate(() => ({
          status: document.querySelector('.adegan')?.getAttribute('data-status') ?? null,
          kanvas: document.querySelectorAll('.adegan canvas').length,
          catatan: document.querySelector('.adegan-catatan')?.textContent ?? '',
          daftarTerbuka: !!document.querySelector('details.daftar-alternatif[open]'),
        }));
        await tangkap(p, `${v.nama.replace(/\s+/g, '-')}-bukti`);
      },
    });
    cek(adegan?.status === v.status && adegan?.kanvas === 0, `${v.nama}: adegan ${adegan?.status}, tanpa kanvas (${adegan?.kanvas})`);
    cek(adegan?.daftarTerbuka, `${v.nama}: daftar pilihan HTML terbuka`);
    if (v.status === 'failed') {
      cek(p.__diblokir > 0, `${v.nama}: request chunk phaser digagalkan (${p.__diblokir}x)`);
      cek(rapat(adegan?.catatan).length > 0, `${v.nama}: pemberitahuan adegan gagal tampil ("${rapat(adegan?.catatan).slice(0, 50)}")`);
    }
    cek(r?.hasil === 'tepat', `${v.nama}: aktivitas bukti selesai lewat daftar HTML (${r?.hasil})`);
    if (r) await periksaUmpan(p, 'b3-bukti', BUKTI_TEPAT, `${v.nama} bukti`);
    await lanjutUmpan(p, 'b3-bukti', v.nama);
    await majuSampai(p, (k) => k.tampilan === 'aktivitas' && k.akt === 'intro' && k.node === 'b4-polis', `${v.nama}: menuju aktivitas polis`);
    const r2 = await kerjakanAktivitas(p, 'b4-polis', 'bisa-dinilai', {
      label: `${v.nama} polis`,
      periksaAwal: true,
      sebelumKirim: async () => {
        await tangkap(p, `${v.nama.replace(/\s+/g, '-')}-polis`);
        const m = await bukaModal(p, '.misi [data-misi-buka="dokumen"]', `${v.nama}: Dokumen`);
        cek(m && m.fokusDiDalam && rapat(m.teks).includes(rapat(T('id', 'akt.polis.kartu.judul'))) && rapat(m.teks).includes(rapat(T('id', 'akt.polis.kartu.benturan.nilai'))), `${v.nama}: tombol Dokumen membuka kartu polis (fokus di dalam)`);
        await p.keyboard.press('Escape');
        await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${v.nama}: dokumen tertutup`, 5000);
        const kembali = await p.evaluate(() => document.activeElement?.getAttribute('data-misi-buka') ?? document.activeElement?.tagName);
        cek(kembali === 'dokumen', `${v.nama}: Escape mengembalikan fokus ke tombol Dokumen (${kembali})`);
      },
    });
    cek(r2?.hasil === 'tepat', `${v.nama}: aktivitas polis selesai lewat daftar HTML (${r2?.hasil})`);
    if (r2) await periksaUmpan(p, 'b4-polis', 'bisa-dinilai', `${v.nama} polis`);
    await lanjutUmpan(p, 'b4-polis', v.nama);
    const k = await keadaan(p);
    cek(k.node === 'b4-polis-tepat' && k.tampilan === 'dialog', `${v.nama}: cerita berlanjut setelah aktivitas (${k.node})`);
    if (v.status === 'static') {
      const pg = await bacaPanggung(p);
      cek(pg.ada && pg.diam && !pg.gerak && pg.anim === 0, `${v.nama}: panggung cerita tetap tanpa gerak setelah aktivitas (${JSON.stringify(pg)})`);
    }
    cekKonsol(p);
    await tutupHalaman(p);
  }
}

// ================================================================== UJI 8 - teks mengetik, istilah, keyboard, Modal

/**
 * Keadaan panggung v3 (Panggung.tsx): `data-diam` = tanpa gerak (gerak dikurangi / mode ringan), `data-gerak` = aksi
 * yang sedang diputar (pembuka, masuk, …), tombol "Lewati pembuka", Bu Rina di ruang, dan animasi yang masih berjalan
 * di dalam panggung.
 */
function bacaPanggung(p) {
  return p.evaluate(() => {
    const pg = document.querySelector('.cer-panggung');
    return {
      ada: !!pg,
      diam: pg?.hasAttribute('data-diam') ?? false,
      gerak: pg?.getAttribute('data-gerak') ?? null,
      lewati: !!document.querySelector('.cer-pg-lewati'),
      nasabah: !!pg?.querySelector('.cer-tokoh'),
      anim: document.getAnimations().filter((x) => x.playState === 'running' && x.effect?.target?.closest?.('.cer-panggung')).length,
    };
  });
}

/**
 * "Apa itu …?" di baris yang memakai istilah pertama kali (11.4): tombol per istilah (>= 44 px, aria-expanded,
 * aria-controls) baru tampil setelah kalimat utuh; ketuk / Enter / Spasi membuka & menutup arti 1-2 kalimat di
 * bawahnya; ketukan pada arti atau tombolnya TIDAK memajukan cerita. Animasi arti <= 200 md, gerak dikurangi = tanpa.
 */
async function periksaIstilah(p, label, ids) {
  // Tombol muncul setelah kalimat utuh (pada render berikutnya): beri waktu bila baris ini memang bertanda istilah.
  if (ids.length) await tunggu(p, () => document.querySelectorAll('.cer-dialog .cer-istilah-tombol').length > 0, `${label}: tombol istilah tampil setelah kalimat utuh`, 3000);
  else await tidur(200);
  const tb = await p.evaluate(() => [...document.querySelectorAll('.cer-dialog .cer-istilah-tombol')].map((b) => ({
    id: b.getAttribute('data-istilah'), teks: (b.textContent || '').replace(/\s+/g, ' ').trim(), exp: b.getAttribute('aria-expanded'),
    kontrol: !!document.getElementById(b.getAttribute('aria-controls') ?? ''), tinggi: Math.round(b.getBoundingClientRect().height),
  })));
  const okTombol = JSON.stringify(tb.map((b) => b.id)) === JSON.stringify(ids)
    && tb.every((b) => b.teks === rapat(K('id', 'apaItu', { istilah: T('id', `istilah.${b.id}.label`) })) && b.exp === 'false' && b.kontrol && b.tinggi >= 44);
  if (!ids.length) {
    // Baris tanpa istilah (v3: b1-mentor.1 hanya menyebut peran & tempat): tidak ada tombol "Apa itu …?".
    cek(okTombol, `${label}: baris tanpa istilah, tanpa tombol "Apa itu …?"` + (okTombol ? '' : ` -> ${JSON.stringify(tb)}`));
    return;
  }
  cek(okTombol, `${label}: tombol ${tb.map((b) => `"${b.teks}"`).join(' + ') || '(tidak ada)'} (harap ${ids.join(' + ')}; aria-expanded, >= 44 px)` + (okTombol ? '' : ` -> ${JSON.stringify(tb)}`));
  if (!tb.length) return;
  const id = ids[0];
  const sel = `.cer-dialog .cer-istilah-tombol[data-istilah="${id}"]`;
  const baca = () => p.evaluate((s) => {
    const b = document.querySelector(s);
    const a = b ? document.getElementById(b.getAttribute('aria-controls')) : null;
    const cs = a ? getComputedStyle(a) : null;
    return { exp: b?.getAttribute('aria-expanded') ?? null, arti: a && !a.hidden && a.getClientRects().length ? a.textContent : null, anim: cs ? { nama: cs.animationName, dur: cs.animationDuration } : null };
  }, sel);
  const s0 = await keadaan(p);
  const sama = (s) => s.raw === s0.raw && rapat(s.teks) === rapat(s0.teks) && s.st?.langkah === s0.st?.langkah;
  await klik(p, sel);
  await tidur(150);
  const r1 = await baca();
  const s1 = await keadaan(p);
  cek(r1.exp === 'true' && rapat(r1.arti) === rapat(T('id', `istilah.${id}.arti`)) && sama(s1), `${label}: ketuk "Apa itu ${T('id', `istilah.${id}.label`)}?" membuka arti tanpa memajukan cerita`);
  if (r1.anim) {
    const dtk = parseFloat(r1.anim.dur) * (r1.anim.dur.endsWith('ms') ? 0.001 : 1);
    if (p.__gerak === 'reduce') cek(r1.anim.nama === 'none' || dtk === 0, `${label}: arti muncul tanpa animasi saat gerak dikurangi (${r1.anim.nama} ${r1.anim.dur})`);
    else cek(dtk <= 0.2, `${label}: animasi arti <= 200 md (${r1.anim.nama} ${r1.anim.dur})`);
  }
  await klik(p, `.cer-dialog [data-istilah-arti="${id}"]`);
  await tidur(150);
  cek(sama(await keadaan(p)) && (await baca()).exp === 'true', `${label}: mengetuk teks arti tidak memajukan cerita`);
  await p.focus(sel);
  await p.keyboard.press('Enter');
  await tidur(150);
  const r2 = await baca();
  await p.keyboard.press('Space');
  await tidur(150);
  const r3 = await baca();
  cek(r2.exp === 'false' && r2.arti === null && r3.exp === 'true' && sama(await keadaan(p)), `${label}: Enter menutup, Spasi membuka lagi (tanpa memajukan cerita)`);
  await klik(p, sel);
  await tidur(120);
  cek((await baca()).exp === 'false', `${label}: ketuk lagi menutup arti`);
}

async function ujiKetik() {
  // a) gerak aktif: ketukan pertama = kalimat utuh (tanpa maju), ketukan kedua = lanjut.
  {
    const p = await halaman('ketik gerak aktif', HP390, { gerak: 'no-preference' });
    await buka(p, HALAMAN);
    await tunggu(p, () => !!document.querySelector('.cer-dialog'), 'kotak dialog tampil', 15000);
    const a = await keadaan(p);
    cek(a.sisa > 0, `gerak aktif: kalimat pertama sedang diketik (sisa ${a.sisa} huruf)`);
    // Panggung v3: pembuka (dorongan kamera ke pintu) berjalan BERSAMA baris pertama (tidak menahan kalimat), dengan
    // tombol "Lewati pembuka" yang cukup besar.
    const pb = await tunggu(p, () => document.querySelector('.cer-panggung')?.getAttribute('data-gerak') === 'pembuka', '', 2000, undefined, true);
    const lw = await p.evaluate(() => { const e = document.querySelector('.cer-pg-lewati'); return e ? { teks: (e.textContent || '').trim(), tinggi: Math.round(e.getBoundingClientRect().height) } : null; });
    cek(pb && lw && lw.teks === K('id', 'lewatiPembuka') && lw.tinggi >= 44, `gerak aktif: pembuka panggung berjalan dengan tombol "${K('id', 'lewatiPembuka')}" >= 44 px (${pb ? 'pembuka' : 'tanpa pembuka'}, ${JSON.stringify(lw)})`);
    const pt = await p.evaluate(() => ({ teks: document.querySelector('.cer-dialog-petunjuk')?.textContent ?? null, tercatat: localStorage.getItem('raksa:cerita:petunjuk') }));
    cek(rapat(pt.teks) === K('id', 'ketukLanjut') && pt.tercatat !== null, `petunjuk penggunaan pertama tampil di baris pertama & dicatat di perangkat ("${rapat(pt.teks)}")`);
    await klik(p, '.cer-lanjut');
    await tidur(80);
    const b = await keadaan(p);
    cek(b.sisa === 0 && rapat(b.teks) === rapat(T('id', 'b1-mentor.1')) && b.raw === null, 'gerak aktif: ketukan pertama menampilkan kalimat utuh tanpa maju');
    // Ketukan yang sama menyelesaikan gerak panggung ke komposisi akhir (tanpa aktor sementara yang tertinggal).
    await tunggu(p, () => !document.querySelector('.cer-panggung[data-gerak], .cer-pg-lewati'), '', 1500, undefined, true);
    const pg1 = await p.evaluate(() => ({ gerak: document.querySelector('.cer-panggung')?.getAttribute('data-gerak') ?? null, lewati: !!document.querySelector('.cer-pg-lewati'), sementara: document.querySelectorAll('.cer-panggung [data-aktor^="x:"]').length }));
    cek(!pg1.gerak && !pg1.lewati && pg1.sementara === 0, `gerak aktif: ketukan pertama juga menyelesaikan pembuka panggung (${JSON.stringify(pg1)})`);
    // v3: b1-mentor.1 hanya menyebut peran & tempat ({lokasi}); istilah ditandai di baris pertama yang memakainya.
    await periksaIstilah(p, 'gerak aktif b1-mentor.1', ISTILAH_BARIS('b1-mentor.1'));
    await klik(p, '.cer-lanjut');
    await tunggu(p, () => { try { return JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah === 1; } catch { return false; } }, 'ketukan kedua maju', 5000);
    // Satu evaluate: "masih mengetik" dan "belum ada tombol istilah" diukur pada saat yang sama.
    const c0 = await p.evaluate(() => ({ sisa: document.querySelector('.cer-dialog-sisa')?.textContent?.length ?? 0, tombol: document.querySelectorAll('.cer-istilah-tombol').length }));
    const c = await keadaan(p);
    cek(c.st?.langkah === 1 && c.st?.baris === 2 && c0.sisa > 0, 'gerak aktif: ketukan kedua lanjut ke kalimat berikutnya (mulai diketik lagi)');
    cek(c0.sisa > 0 && c0.tombol === 0, `gerak aktif: tombol "Apa itu …?" di ${barisTerakhir(c.st)?.teks} belum tampil selama kalimat diketik (sisa ${c0.sisa}, tombol ${c0.tombol})`);
    cek(!(await p.$('.cer-dialog-petunjuk')), 'petunjuk penggunaan pertama hilang setelah maju');
    // Keyboard: Enter lalu Spasi dengan fokus di halaman.
    const barisIstilah = [];
    for (const tombol of ['Enter', 'Space']) {
      const s0 = (await keadaan(p)).st;
      await p.evaluate(() => document.activeElement?.blur?.());
      const sisa = (await keadaan(p)).sisa;
      if (sisa > 30) {
        await p.keyboard.press(tombol);
        await tidur(80);
        const d = await keadaan(p);
        cek(d.sisa === 0 && d.st?.langkah === s0.langkah, `gerak aktif: ${tombol} pertama menampilkan kalimat utuh`);
      } else { info(`gerak aktif: ${tombol} pertama tidak diuji (kalimat sudah hampir utuh, sisa ${sisa})`); await utuhkan(p); }
      // Narasi pintu b1-mentor.4 (baris pertama yang memakai "nasabah", saat Bu Rina masuk): istilah bisa dibuka & ditutup
      // tanpa memajukan cerita, juga selagi panggung baru saja menyelesaikan kedatangan.
      const kunciBaris = barisTerakhir(s0)?.teks;
      if (ISTILAH_BARIS(kunciBaris).length) {
        barisIstilah.push(kunciBaris);
        await periksaIstilah(p, `gerak aktif ${kunciBaris}`, ISTILAH_BARIS(kunciBaris));
        await tangkap(p, 'ketik-istilah');
      }
      await p.evaluate(() => document.activeElement?.blur?.());
      await p.keyboard.press(tombol);
      await tunggu(p, (l) => { try { return (JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah ?? -1) === l; } catch { return false; } }, `${tombol} memajukan dialog`, 5000, s0.langkah + 1);
      const e = await keadaan(p);
      cek(e.st?.langkah === s0.langkah + 1, `gerak aktif: ${tombol} memajukan dialog satu langkah (${s0.node}#${s0.baris} -> ${e.st?.node}#${e.st?.baris})`);
    }
    cek(barisIstilah.length > 0, `gerak aktif: "Apa itu …?" diuji di baris pertama yang bertanda istilah (${barisIstilah.join(', ') || 'tidak ada di tiga baris awal'})`);
    // Modal Riwayat, Catatan kasus & Bantuan.
    for (const [i, nama] of [[1, 'Riwayat'], [2, 'Catatan kasus'], [3, 'Bantuan']]) {
      const tombol = `.cer-alat .cer-alat-tombol:nth-child(${i})`;
      const s0 = await keadaan(p);
      const m = await bukaModal(p, tombol, nama);
      cek(m && m.fokusDiDalam && m.latarInert, `${nama}: Modal terbuka, fokus di dalam, latar inert`);
      cek(m && rapat(m.judul) === K('id', ['riwayatJudul', 'catatanKasus', 'bantuanJudul'][i - 1]), `${nama}: judul "${rapat(m?.judul)}"`);
      if (i === 1) cek(m && rapat(m.teks).includes(rapat(T('id', 'b1-mentor.1'))), 'Riwayat: kalimat yang sudah lewat terbaca');
      else if (i === 2) cek(m && rapat(m.teks).includes(K('id', 'catatanDiketahui')) && rapat(m.teks).includes(K('id', 'catatanKet')), 'Catatan kasus: bagian catatan tampil');
      else {
        const t = rapat(m?.teks);
        cek(m && ['bantuanLanjut', 'bantuanRiwayat', 'bantuanCatatan', 'bantuanIstilah'].every((x) => t.includes(rapat(K('id', x)))) && !POLA_SKOR.test(t), 'Bantuan: empat baris cara memakai layar cerita, tanpa bahasa poin/waktu');
      }
      for (let t = 0; t < 6; t++) await p.keyboard.press('Tab');
      const tab = await p.evaluate(() => !!document.querySelector('[role="dialog"]')?.contains(document.activeElement));
      await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift');
      const stab = await p.evaluate(() => !!document.querySelector('[role="dialog"]')?.contains(document.activeElement));
      cek(tab && stab, `${nama}: Tab & Shift+Tab tetap di dalam dialog`);
      await p.evaluate(() => document.querySelector('.mdl-judul')?.focus());
      await p.keyboard.press('Enter');
      await tidur(120);
      const s1 = await keadaan(p);
      cek(s1.raw === s0.raw, `${nama}: Enter di dalam dialog tidak memajukan cerita`);
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${nama}: tertutup dengan Escape`, 5000);
      const f = await p.evaluate((sel) => document.activeElement === document.querySelector(sel), tombol);
      cek(f, `${nama}: Escape mengembalikan fokus ke tombol pembuka`);
    }
    await tangkap(p, 'ketik-gerak-aktif');
    // Petunjuk SEKALI per perangkat: episode dibuka lagi dari awal di perangkat yang sama -> tanpa petunjuk.
    await p.evaluate(() => localStorage.removeItem('raksa:cerita'));
    await muatUlang(p);
    await tunggu(p, () => !!document.querySelector('.cer-dialog'), 'kotak dialog tampil lagi', 15000);
    const lagi = await keadaan(p);
    cek(lagi.st === null && rapat(lagi.teks).length > 0 && !(await p.$('.cer-dialog-petunjuk')), 'petunjuk penggunaan pertama tidak tampil lagi di perangkat yang sama (Bantuan tetap tersedia)');
    cekKonsol(p);
    await tutupHalaman(p);
  }
  // b) gerak dikurangi: kalimat langsung utuh, satu ketukan = satu langkah.
  {
    const p = await halaman('ketik gerak dikurangi', HP390, { gerak: 'reduce' });
    await buka(p, HALAMAN);
    await tunggu(p, () => !!document.querySelector('.cer-dialog'), 'kotak dialog tampil', 15000);
    const a = await keadaan(p);
    cek(a.sisa === 0 && rapat(a.teks) === rapat(T('id', 'b1-mentor.1')), 'gerak dikurangi: kalimat langsung utuh');
    cek(!!(await p.$('.cer-dialog-petunjuk')), 'gerak dikurangi: petunjuk penggunaan pertama tampil di perangkat baru');
    // Panggung v3 saat gerak dikurangi: komposisi akhir langsung (tanpa pembuka, tombol lewati, atau animasi).
    const pg0 = await bacaPanggung(p);
    cek(pg0.diam && !pg0.gerak && !pg0.lewati && pg0.anim === 0, `gerak dikurangi: panggung tanpa pembuka, tombol lewati, atau animasi (${JSON.stringify(pg0)})`);
    await periksaIstilah(p, 'gerak dikurangi b1-mentor.1', ISTILAH_BARIS('b1-mentor.1'));
    await klik(p, '.cer-lanjut');
    await tunggu(p, () => { try { return JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah === 1; } catch { return false; } }, 'ketukan pertama maju', 5000);
    const b = await keadaan(p);
    cek(b.st?.baris === 2 && b.sisa === 0 && rapat(b.teks) === rapat(T('id', 'b1-mentor.4')), 'gerak dikurangi: ketukan pertama langsung lanjut, kalimat berikut utuh');
    const pg4 = await bacaPanggung(p);
    cek(pg4.nasabah && !pg4.gerak && !pg4.lewati && pg4.anim === 0, `gerak dikurangi: di narasi pintu Bu Rina langsung duduk (komposisi akhir kedatangan, tanpa animasi) (${JSON.stringify(pg4)})`);
    // Narasi pintu (Bu Rina masuk): "Apa itu nasabah?" tanpa animasi, tanpa memajukan cerita.
    await periksaIstilah(p, 'gerak dikurangi b1-mentor.4', ISTILAH_BARIS('b1-mentor.4'));
    // Enter -> baris pertama Bu Rina (masalahnya di baris ke-3 episode), Spasi -> baris kedua.
    for (const [tombol, langkah, kunci] of [['Enter', 2, 'b1-datang.1'], ['Space', 3, 'b1-datang.2']]) {
      await p.evaluate(() => document.activeElement?.blur?.());
      await p.keyboard.press(tombol);
      await tunggu(p, (l) => { try { return JSON.parse(localStorage.getItem('raksa:cerita'))?.episode?.['auto-1']?.state?.langkah === l; } catch { return false; } }, `${tombol} maju`, 5000, langkah);
      const c = await keadaan(p);
      cek(c.st?.langkah === langkah && c.sisa === 0 && rapat(c.teks) === rapat(T('id', kunci)), `gerak dikurangi: ${tombol} memajukan dialog (${c.st?.node} baris ${c.st?.baris})`);
    }
    // "klaim" pertama kali di ucapan Bu Rina b2-saran (.1 bila cerita singkat, .2 bila tidak): tombolnya tampil di atas
    // pilihan; membuka & menutup arti tidak memilih apa pun dan tidak memajukan cerita.
    await pilih(p, 'b1-datang', 'dengar', { label: 'gerak dikurangi', periksa: false });
    const saran = await majuSampai(p, (k) => k.node === 'b2-saran' && k.opsi.length > 0, 'gerak dikurangi: menuju pilihan b2-saran');
    if (saran) {
      const kunciSaran = barisTerakhir(saran.st)?.teks;
      cek(ISTILAH_BARIS(kunciSaran).includes('klaim'), `gerak dikurangi: baris ${kunciSaran} menandai istilah "klaim" (${ISTILAH_BARIS(kunciSaran).join(', ') || 'tanpa istilah'})`);
      await periksaIstilah(p, `gerak dikurangi ${kunciSaran}`, ISTILAH_BARIS(kunciSaran));
      const s = await keadaan(p);
      cek(s.raw === saran.raw && s.node === 'b2-saran' && JSON.stringify(s.opsi) === JSON.stringify(saran.opsi), `gerak dikurangi ${kunciSaran}: pilihan tetap tersedia, tidak ada keputusan tercatat`);
      await tangkap(p, 'ketik-istilah-klaim');
    }
    cekKonsol(p);
    await tutupHalaman(p);
  }
}

// ================================================================== UJI 9 - tata letak

const UKURAN = [
  { nama: '360x740', vp: HP360, hp: true },
  { nama: '390x844', vp: HP390, hp: true },
  { nama: '768x1024', vp: { width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, hp: true },
  { nama: '844x390', vp: MENDATAR, hp: true },
  { nama: '1440x900', vp: DESKTOP, hp: false },
  // Desktop 1440x900 dengan zoom browser 200 %.
  { nama: 'zoom200', vp: ZOOM200, hp: false },
];

/**
 * Dialog "foto belum lengkap" khusus cerita (MissionPlay konfirmasiKurang, 11.5): judul "Baru 1 dari 3 foto dipilih",
 * akibat jujur untuk laporan Bu Rina, "Lengkapi foto" + "Kirim dengan 1 foto"; tanpa teks poin solo/multiplayer.
 * Mengembalikan data dialog (masih terbuka) atau null.
 */
async function bukaDialogFotoKurang(p, label) {
  await klik(p, '.misi-aksi .primary-action');
  if (!(await tunggu(p, () => !!document.querySelector('[role="dialog"]'), `${label}: dialog foto belum lengkap`, 6000))) return null;
  await tidur(300);
  const d = await p.evaluate(() => {
    const dl = document.querySelector('[role="dialog"]');
    return {
      judul: dl?.querySelector('.mdl-judul')?.textContent ?? '',
      isi: dl?.querySelector('.mdl-isi')?.textContent ?? '',
      teks: dl?.textContent ?? '',
      netral: dl?.querySelector('.mdl-aksi .btn-netral')?.textContent ?? '',
      utama: dl?.querySelector('.mdl-aksi .btn-utama')?.textContent ?? '',
      tinggi: [...(dl?.querySelectorAll('.mdl-aksi button') ?? [])].map((b) => Math.round(b.getBoundingClientRect().height)),
      fokus: !!dl?.contains(document.activeElement),
    };
  });
  const nama = NASABAH('id');
  cek(rapat(d.judul) === KT('id', 'fotoKurangJudul', { n: 1, total: 3 }) && rapat(d.isi).includes(rapat(KT('id', 'fotoKurangAkibat', { nama }))) && d.fokus, `${label}: dialog "${rapat(d.judul)}" dengan akibat jujur (fokus di dalam)`);
  cek(rapat(d.netral) === KT('id', 'lengkapiFoto') && rapat(d.utama) === KT('id', 'kirimFotoSatu', { n: 1 }) && d.tinggi.length === 2 && d.tinggi.every((x) => x >= 44), `${label}: tombol "${rapat(d.netral)}" & "${rapat(d.utama)}" (>= 44 px)`);
  cek(!POLA_SKOR.test(d.teks) && !rapat(d.teks).includes(rapat(KM('id', 'konfirmasiCatatan'))), `${label}: dialog tanpa bahasa poin/waktu (bukan teks solo "${KM('id', 'konfirmasiCatatan').slice(0, 40)}…")`);
  return d;
}

/** "Kirim dengan 1 foto": cabang "belum lengkap" episode tetap ada (umpan balik sebagian -> b3-bukti-kurang). */
async function periksaKirimFotoKurang(p, label) {
  await suntik(p, REKAM.bukti);
  if (!(await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'intro', `${label}: kartu aktivitas bukti`, 40000))) return;
  await klik(p, '.cer-akt-mulai .primary-action');
  await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `${label}: aktivitas bukti dimainkan`, 15000);
  await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', `${label}: adegan selesai dimuat`, 40000);
  await klikTeks(p, '.misi-panel button.opsi', T('id', `akt.bukti.opsi.${BUKTI_TEPAT[0]}`));
  await tidur(150);
  if (!(await bukaDialogFotoKurang(p, label))) return;
  await klik(p, '.mdl-aksi .btn-utama');
  const ok = await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal' && !!document.querySelector('.cer-umpan'), `${label}: dikirim dengan 1 foto`, 15000);
  if (!ok) return;
  await tidur(200);
  const h = await p.evaluate(() => document.querySelector('.cer-umpan')?.getAttribute('data-hasil'));
  cek(h === 'sebagian', `${label}: dinilai "sebagian" (${h})`);
  await periksaUmpan(p, 'b3-bukti', [BUKTI_TEPAT[0]], label);
  await tangkap(p, 'tata-390x844-umpan-foto-kurang');
  await lanjutUmpan(p, 'b3-bukti', label);
  const k = await keadaan(p);
  cek(k.node === 'b3-bukti-kurang' && k.st?.proses?.bukti === 'keliru', `${label}: cabang "belum lengkap" (${k.node}, bukti ${k.st?.proses?.bukti})`);
}

async function ujiTata() {
  await pastikanRekaman();
  for (const u of UKURAN) {
    const label = u.nama;
    const shot = (n, o) => (u.nama === '390x844' || u.nama === '1440x900' || u.nama === '844x390' || u.nama === '360x740' ? tangkap(p, `tata-${u.nama}-${n}`, o) : Promise.resolve());
    const p = await halaman('tata ' + u.nama, u.vp);
    // Percakapan (awal episode): Lanjut, alat, dan "Apa itu …?" terjangkau.
    await buka(p, HALAMAN);
    await tunggu(p, () => !!document.querySelector('.cer-lanjut'), `${label}: tombol Lanjut tampil`, 15000);
    const awal = await p.evaluate(() => { const r = document.querySelector('.cer-lanjut')?.getBoundingClientRect(); return r ? { atas: Math.round(r.top), bawah: Math.round(r.bottom), vh: window.innerHeight } : null; });
    info(`${label}: Lanjut di awal episode y=${awal?.atas}-${awal?.bawah} (tinggi layar ${awal?.vh})${awal && awal.bawah <= awal.vh ? ', terlihat tanpa gulir' : ', perlu digulir'}`);
    await utuhkan(p);
    await periksaLuber(p, `${label} percakapan`);
    await periksaTerjangkau(p, '.cer-lanjut', `${label} percakapan`, { minTinggi: 44 });
    await periksaTerjangkau(p, '.cer-alat-tombol', `${label} percakapan`, { minTinggi: 44 });
    await shot('percakapan');
    // v3: "Apa itu nasabah?" ada di narasi pintu b1-mentor.4 (Bu Rina masuk; panggung sedang memutar kedatangan).
    await majuSatu(p, `${label} menuju narasi pintu`);
    await utuhkan(p);
    const kunciPintu = barisTerakhir((await keadaan(p)).st)?.teks;
    if (cek(ISTILAH_BARIS(kunciPintu).length > 0, `${label}: baris ${kunciPintu} bertanda istilah (${ISTILAH_BARIS(kunciPintu).join(', ')})`)) {
      await tunggu(p, () => document.querySelectorAll('.cer-istilah-tombol').length > 0, `${label}: tombol istilah tampil di ${kunciPintu}`, 3000);
      await periksaLuber(p, `${label} percakapan ${kunciPintu}`);
      await periksaTerjangkau(p, '.cer-istilah-tombol', `${label} percakapan ${kunciPintu}`, { minTinggi: 44 });
      await periksaTerjangkau(p, '.cer-lanjut', `${label} percakapan ${kunciPintu}`, { minTinggi: 44 });
      await shot('percakapan-istilah');
    }
    // Keputusan: dicapai lewat ketukan (pilihan digulir ke dalam layar oleh halaman).
    await majuSampai(p, (k) => k.opsi.length > 0, `${label}: menuju keputusan pertama`);
    await tidur(700);
    const lihat = await p.evaluate(() => { const r = document.querySelector('.cer-opsi')?.getBoundingClientRect(); return r ? { atas: Math.round(r.top), bawah: Math.round(r.bottom), vh: window.innerHeight } : null; });
    cek(lihat && lihat.atas >= 0 && lihat.bawah <= lihat.vh, `${label}: pilihan pertama terlihat tanpa gulir manual saat muncul (y=${lihat?.atas}-${lihat?.bawah})`);
    await shot('keputusan');
    await periksaLuber(p, `${label} keputusan`);
    await periksaTerjangkau(p, '.cer-opsi', `${label} keputusan`, { minTinggi: 48 });
    // Konsekuensi.
    await pilih(p, 'b1-datang', 'dengar', { label: `${label}` });
    await utuhkan(p);
    await periksaLuber(p, `${label} konsekuensi`);
    await periksaTerjangkau(p, '.cer-lanjut', `${label} konsekuensi`, { minTinggi: 44 });
    await shot('konsekuensi');
    // Keputusan dengan istilah (v3: "Apa itu klaim?" di ucapan Bu Rina b2-saran): tombol istilah & pilihan terjangkau.
    const saran = await majuSampai(p, (k) => k.node === 'b2-saran' && k.opsi.length > 0, `${label}: menuju keputusan b2-saran`);
    if (saran) {
      await tidur(700);
      const kunciSaran = barisTerakhir(saran.st)?.teks;
      if (cek(ISTILAH_BARIS(kunciSaran).length > 0, `${label}: baris ${kunciSaran} bertanda istilah (${ISTILAH_BARIS(kunciSaran).join(', ')})`)) {
        await periksaTerjangkau(p, '.cer-istilah-tombol', `${label} keputusan ${kunciSaran}`, { minTinggi: 44 });
      }
      await periksaTerjangkau(p, '.cer-opsi', `${label} keputusan ${kunciSaran}`, { minTinggi: 48 });
      await periksaLuber(p, `${label} keputusan ${kunciSaran}`);
      await shot('keputusan-istilah');
    }
    // Aktivitas bukti (dari rekaman): Mulai, "Pilih lewat daftar", satu foto -> dialog belum lengkap, lengkapi, kirim.
    await suntik(p, REKAM.bukti);
    await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'intro', `${label}: kartu aktivitas bukti`, 40000);
    await periksaLuber(p, `${label} kartu aktivitas`);
    await periksaTerjangkau(p, '.cer-akt-mulai .primary-action', `${label} kartu aktivitas`, { minTinggi: 44 });
    await shot('aktivitas-kartu');
    await klik(p, '.cer-akt-mulai .primary-action');
    await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `${label}: aktivitas bukti dimainkan`, 15000);
    await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', `${label}: adegan selesai dimuat`, 40000);
    await periksaPembukaDaftar(p, `${label} aktivitas bukti`);
    await periksaAlbum(p, 0, `${label} aktivitas bukti`);
    await shot('aktivitas-bukti-awal');
    await periksaTerjangkau(p, '.misi-panel button.opsi', `${label} aktivitas bukti`, { minTinggi: 44, bukaDaftar: true });
    await klikTeks(p, '.misi-panel button.opsi', T('id', `akt.bukti.opsi.${BUKTI_TEPAT[0]}`));
    await tidur(150);
    await periksaAlbum(p, 1, `${label} aktivitas bukti`);
    if (await bukaDialogFotoKurang(p, `${label} kirim 1 foto`)) {
      await shot('aktivitas-foto-kurang');
      await klik(p, '.mdl-aksi .btn-netral');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: "Lengkapi foto" menutup dialog`, 5000);
      await tidur(200);
      const f = await p.evaluate(() => ({ mode: document.querySelector('.misi')?.getAttribute('data-mode'), fokus: document.activeElement?.matches('.misi-panel .daftar-alternatif > summary') ?? false, a: document.activeElement?.tagName }));
      cek(f.mode === 'play' && f.fokus, `${label}: "Lengkapi foto" kembali menjawab, fokus ke pembuka daftar (${f.a})`);
    }
    for (const id of BUKTI_TEPAT.slice(1)) await klikTeks(p, '.misi-panel button.opsi', T('id', `akt.bukti.opsi.${id}`));
    await periksaAlbum(p, 3, `${label} aktivitas bukti`);
    await periksaLuber(p, `${label} aktivitas bukti`);
    await periksaTerjangkau(p, '.misi-aksi .primary-action', `${label} aktivitas bukti (kirim)`, { minTinggi: 44 });
    await shot('aktivitas-bukti');
    await klik(p, '.misi-aksi .primary-action');
    await tidur(250);
    cek(!(await p.$('[role="dialog"]')), `${label}: tiga foto dikirim tanpa dialog konfirmasi`);
    await tutupDialogTembus(p, `${label}: kirim tiga foto`);
    await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'reveal', `${label}: umpan balik bukti`, 15000);
    await tidur(300);
    await periksaLuber(p, `${label} umpan balik`);
    await periksaTerjangkau(p, '.cer-umpan-aksi .primary-action', `${label} umpan balik`, { minTinggi: 44 });
    await periksaTerjangkau(p, '.cer-umpan .cer-kenapa-tombol', `${label} umpan balik`, { minTinggi: 44 });
    await shot('umpan-balik', { penuh: true });
    // Aktivitas polis: kartu di atas tiga pilihan, baris kartu bisa diperiksa, dokumen.
    await suntik(p, REKAM.polis);
    await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'intro', `${label}: kartu aktivitas polis`, 40000);
    await periksaLuber(p, `${label} kartu polis`);
    await periksaTerjangkau(p, '.cer-akt-mulai .primary-action', `${label} kartu polis`, { minTinggi: 44 });
    await shot('polis-kartu', { penuh: true });
    await klik(p, '.cer-akt-mulai .primary-action');
    await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `${label}: aktivitas polis dimainkan`, 15000);
    await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', `${label}: adegan polis selesai dimuat`, 40000);
    await periksaKartuPolisAwal(p, `${label} aktivitas polis`);
    await shot('polis-awal');
    await periksaTerjangkau(p, '.misi-panel .kpp-tombol', `${label} kartu polis (baris)`, { minTinggi: 44 });
    await klikTeks(p, '.misi-panel button.opsi', T('id', 'akt.polis.opsi.bisa-dinilai'));
    await periksaTerjangkau(p, '.misi-panel button.opsi', `${label} aktivitas polis`, { minTinggi: 44 });
    await periksaTerjangkau(p, '.misi-aksi .primary-action', `${label} aktivitas polis (kirim)`, { minTinggi: 44 });
    await periksaLuber(p, `${label} aktivitas polis`);
    const m = await bukaModal(p, '.misi [data-misi-buka="dokumen"]', `${label} dokumen polis`);
    cek(m && m.fokusDiDalam, `${label}: dokumen polis terbuka dengan fokus di dalam`);
    await periksaTerjangkau(p, '.mdl-aksi button', `${label} dokumen polis`, { minTinggi: 44 });
    await shot('polis-dokumen');
    // Tutup lewat tombol "Tutup" (klik nyata): dialog harus tertutup dan tidak terbuka lagi oleh adegan di bawahnya.
    await klik(p, '.mdl-aksi .btn-netral');
    await tidur(700);
    const masihTerbuka = await p.evaluate(() => !!document.querySelector('[role="dialog"]'));
    cek(!masihTerbuka, `${label}: tombol Tutup menutup dokumen polis (tidak terbuka lagi)`);
    if (masihTerbuka) {
      await p.keyboard.press('Escape');
      await tunggu(p, () => !document.querySelector('[role="dialog"]'), `${label}: dokumen tertutup`, 5000);
    }
    // Tombol kirim lengket di atas objek adegan: tidak boleh diteruskan ke adegan.
    await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') === 'ready', `${label}: adegan polis siap`, 40000);
    await periksaKlikTembus(p, `${label} aktivitas polis`);
    // Keyboard: fokus tidak tertutup bar aksi lengket (aktivitas disuntik ulang: jawaban dari Spasi tidak dikirim).
    for (const [rekaman, akt] of [[REKAM.bukti, 'bukti'], [REKAM.polis, 'polis']]) {
      await suntik(p, rekaman);
      if (!(await tunggu(p, () => document.querySelector('.cer-aktivitas')?.getAttribute('data-mode') === 'intro', `${label}: kartu aktivitas ${akt} (keyboard)`, 40000))) continue;
      await klik(p, '.cer-akt-mulai .primary-action');
      await tunggu(p, () => document.querySelector('.misi')?.getAttribute('data-mode') === 'play', `${label}: aktivitas ${akt} dimainkan (keyboard)`, 15000);
      await tunggu(p, () => document.querySelector('.adegan')?.getAttribute('data-status') !== 'loading', `${label}: adegan ${akt} selesai dimuat (keyboard)`, 40000);
      await periksaFokusBar(p, `${label} keyboard aktivitas ${akt}`);
    }
    if (u.nama === '390x844') await periksaKirimFotoKurang(p, `${label} kirim dengan 1 foto`);
    // Kartu akhir.
    await suntik(p, REKAM.akhir);
    await tunggu(p, () => !!document.querySelector('.akh-kartu'), `${label}: kartu akhir`, 15000);
    await tidur(300);
    await periksaUkuranKartu(p, `${label} akhir`, { tanpaGulir: ['390x844', '360x740', '1440x900'].includes(u.nama), kata: true });
    await periksaTerjangkau(p, '.cer-alat-tombol', `${label} akhir`, { minTinggi: 44 });
    await shot('akhir', { penuh: true });
    cekKonsol(p, label);
    await tutupHalaman(p);
  }
}

// ================================================================== jalankan

const UJI = { akhir: ujiAkhir, kartu: ujiKartu, muat: ujiMuat, bahasa: ujiBahasa, rusak: ujiRusak, ringan: ujiRingan, ketik: ujiKetik, tata: ujiTata };
console.log(`UJI MODE CERITA ${BASE} · gerak ${GERAK === 'reduce' ? 'DIKURANGI' : 'aktif'} · uji: ${HANYA.join(', ')}${OUT ? ' · tangkapan ' + OUT : ''}`);
try {
  for (const nama of HANYA) {
    const fn = UJI[nama];
    if (!fn) { grup = 'umum'; cek(false, `uji "${nama}" tidak dikenal (pilihan: ${SEMUA_UJI.join(', ')})`); continue; }
    grup = nama;
    const t0 = Date.now();
    console.log(`\n=== ${nama}`);
    try { await fn(); } catch (e) { cek(false, `uji ${nama} berhenti karena galat: ${String(e?.stack ?? e).slice(0, 400)}`); }
    durasi[nama] = Math.round((Date.now() - t0) / 1000);
  }
} finally {
  for (const c of semuaKonteks) { try { await c.close(); } catch { /* abaikan */ } }
  await browser.close();
}
const total = Math.round((Date.now() - mulaiUji) / 1000);
console.log('\nDURASI: ' + Object.entries(durasi).map(([k, v]) => `${k} ${v} dtk`).join(', ') + ` · total ${total} dtk`);
console.log(`RINGKASAN: ${jumlahCek} pemeriksaan, ${jumlahCek - gagal.length} lulus, ${gagal.length} GAGAL (gerak ${GERAK === 'reduce' ? 'dikurangi' : 'aktif'})`);
if (gagal.length) console.log('\nGAGAL:\n' + gagal.join('\n'));
if (OUT) fs.writeFileSync(path.join(OUT, 'uji-cerita.json'), JSON.stringify({ base: BASE, gerak: GERAK, jumlahCek, gagal, catatan, durasi, total }, null, 1));
process.exit(gagal.length ? 1 : 0);
