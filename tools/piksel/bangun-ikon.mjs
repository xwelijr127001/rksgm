/**
 * IKON KEPALA MINI (potret bulat < 44 px: Riwayat 32, label "Pelajaran" kartu akhir) — Miss Raksa & Bu Rina.
 *
 *   node tools/piksel/bangun-ikon.mjs                 (tulis PNG + manifest, deterministik)
 *   node tools/piksel/bangun-ikon.mjs --tinjau <dir>  (juga lembar tinjau: bingkai potret 32 @1x/2x/3x + kisi 8x)
 *
 * Kenapa: jendela potret 1:1 manifest untuk 28/32 px hanya memuat wajah (kepala tokoh ± 54 piksel seni), jadi sanggul
 * Miss Raksa, rambut, seragam, dan hijab Bu Rina hilang; di ukuran nyata terbaca seperti cakram kulit dengan alis
 * (temuan verifikasi 28 Sep). Ikon ini digambar TANGAN pada resolusinya sendiri (1 piksel ikon = 1 px CSS pada slot
 * 32, piksel perangkat bulat x dpr): kepala UTUH (puncak sanggul/hijab sampai dagu ± 22 piksel) + kerah/bros, di
 * dalam lingkaran isi 28 (bingkai .tokoh-potret: cincin putih 2 px). Titik tolak: frame potret atlas diperkecil
 * ± 0,43/0,46 (hanya sebagai panduan bentuk), lalu setiap baris ditulis ulang tangan di bawah ini; wajah (alis, mata,
 * hidung, mulut) digambar per ekspresi sebagai tempelan kecil (kepala terkunci: hanya piksel di kotak wajah berubah).
 *
 * Huruf grid = indeks palet manifest tokoh (a = palet[0], b = palet[1], ...; '.' = transparan), jadi ikon memakai
 * palet yang SAMA dengan atlas tokohnya (<= 40 warna, garis #0f0b11).
 *
 * Keluaran: client/src/cerita/seni/piksel/ikon-miss-raksa.png, ikon-bu-rina.png (PNG terindeks, alpha biner),
 *           client/src/cerita/seni/piksel/ikon.json (skema & pemakaian: client/src/cerita/seni/piksel/ikon.ts).
 * Pemeriksaan tiap build: grid 32 x 32 & huruf di palet, kepala terkunci (0 piksel berubah di luar kotak wajah),
 * <= 40 warna, alpha biner; hash sha256 dicatat di manifest (dua kali bangun = byte identik).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as L from './lib.mjs';
import { tulisPngIndeks } from './miss-lib.mjs';

const DIR = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const HURUF = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const SISI = 32;
/** Diameter lingkaran isi yang dirancang (slot 32 dikurangi cincin putih 2 px kiri-kanan). */
export const ISI = 28;
const CELAH = 1;

// ------------------------------------------------------------------ Miss Raksa (palet miss-raksa.json)
// a #0f0b11 garis | b-g rambut gelap->terang | i-k coklat tua (garis rahang) | n-u kulit gelap->terang | v bibir
// l iris coklat | E/F/D/C seragam emas | J/I/H/G kerah putih->abu | x/w tepi seragam

const MISS_DASAR = [
  '................................',
  '................................',
  '................................',
  '................aaaaa...........',
  '...............adfgfda..........',
  '..............adfggfeca.........',
  '.............acdeffedcba........',
  '...........acedcbbbedcba........',
  '..........aefeddefedccba........',
  '.........adfgeddefgedcba........',
  '........adegfddeffeddcdba.......',
  '........adefentsffedccbca.......',
  '.......adeeotuuusmdccbcba.......',
  '.......addpuuuuuutodcbbca.......',
  '.......adntuuuuutsrodcbba.......',
  '.......adntuuuuuutsrodcba.......',
  '.......adnuuuuuuutssrdcba.......',
  '........adtuuuuuuttssrdca.......',
  '........antuuuuuutttssoca.......',
  '.........ntuuuuuuttssrodb.......',
  '.........jtuuuuuuttssrjda.......',
  '.........jstuuuuuttssrjda.......',
  '..........jtuuuuutssrja.........',
  '..........jstuuuttssja..........',
  '...........jsttttssrj...........',
  '............jjrrrrjj............',
  '.............jGssIIG............',
  '............aHJIGJJIHa..........',
  '.........aawHJJIaJJJHwaa........',
  '........axEEEHIJaJIHEEEEa.......',
  '.......axEEEEEEEaEEEEEEEEa......',
  '......axEFEEEEEEaEEEEEEEEEa.....',
];

/** Kotak wajah Miss Raksa (tempelan ekspresi hanya boleh mengubah piksel di sini). */
const MISS_WAJAH = { x: 8, y: 13, w: 14, h: 11 };

/** Tempelan wajah per wajah seni Miss Raksa (baris MISS_WAJAH.y.., kolom MISS_WAJAH.x..; '_' = tetap). */
const MISS_EKSPRESI = {
  // v5: mata TERBUKA dalam bahasa desain master (v4: blok gelap 2x2 = terbaca sayu): baris y16 garis bulu mata (mata
  // dekat + sayap 1 px), y17 putih mata J + iris gelap i, y18 dasar iris -> tiga baris, terbaca melek & menatap di
  // 32 px @1-3x (dua baris bulu mata + putih terbaca kelopak berat / melirik). Alis naik ke y14 (kotak wajah mulai y13
  // supaya ujung dalam alis prihatin muat). Mata sama untuk semua wajah; emosi dibaca dari alis & mulut.
  // netral: alis tipis melengkung, mulut kecil
  netral: [
    '______________',
    '__mkm_mkkm____',
    '______________',
    '__aa__aaaa____',
    '__Ji__Jii_____',
    '__ii__iii_____',
    '______________',
    '_____o________',
    '______________',
    '_____vv_______',
    '______________',
  ],
  // senyum: sudut mulut naik 1 baris + rona pipi
  senyum: [
    '______________',
    '__mkm_mkkm____',
    '______________',
    '__aa__aaaa____',
    '__Ji__Jii_____',
    '__ii__iii_____',
    '______________',
    '__r__o___r____',
    '____n__n______',
    '_____vv_______',
    '______________',
  ],
  // prihatin: ujung dalam alis naik (y13), mulut kecil redup; mata tetap terbuka memperhatikan
  prihatin: [
    '____k_k_______',
    '__mk___kkm____',
    '______________',
    '__aa__aaaa____',
    '__Ji__Jii_____',
    '__ii__iii_____',
    '______________',
    '_____o________',
    '______________',
    '_____on_______',
    '______________',
  ],
  // serius: alis datar lebih gelap & penuh (tanpa kerutan V: di ikon kecil V terbaca galak), mulut garis tenang
  serius: [
    '______________',
    '__kkk_kkkk____',
    '______________',
    '__aa__aaaa____',
    '__Ji__Jii_____',
    '__ii__iii_____',
    '______________',
    '_____o________',
    '______________',
    '_____nn_______',
    '______________',
  ],
  // lega: mata TERBUKA (v4: terpejam lengkung), alis lebih lembut, senyum kecil tanpa rona
  lega: [
    '______________',
    '__mmm_mmmm____',
    '______________',
    '__aa__aaaa____',
    '__Ji__Jii_____',
    '__ii__iii_____',
    '______________',
    '_____o________',
    '____p__p______',
    '_____vv_______',
    '______________',
  ],
};

// ------------------------------------------------------------------ Bu Rina (palet bu-rina.json)
// a #0f0b11 garis | d/e/g coklat sangat tua (alis, iris) | b putih mata | A/B/z/s/r/m/l hijab bata terang->gelap
// J/K/H/F/E/y/x kulit terang->gelap | G/N bros jingga + kilau

const RINA_DASAR = [
  '................................',
  '................................',
  '................................',
  '................aaaaaa..........',
  '..............aaBAAAAAaa........',
  '............aBBAAAAAAAAza.......',
  '...........aBAAzAAAAAAAAza......',
  '...........azreemAAAAAAAAza.....',
  '..........azeyHJHyezAAAAAAza....',
  '..........aryJJJJJKyzBAAAAza....',
  '..........asHJJJJJJKyzAAAAAza...',
  '..........asKJJJJJJKHyzAAAAza...',
  '..........asKJJJJJJKHxzAAAAAza..',
  '..........amKJJJJJJKKHyzAAAAza..',
  '..........amKJJJJJJKKHyzAAAAza..',
  '..........amKJJJJJJJKHyzAAAAza..',
  '..........amHJJJJJJJKHyzAAAzza..',
  '..........arHKJJJJJJKHxzAAAzza..',
  '..........amHKJJJJJKKFxzAAzzza..',
  '..........amFHKJJJJKKFxzAzzzsa..',
  '...........aeFHKJKKHFxrzzzsssza.',
  '............aeFHKKHFExrszzsszsa.',
  '.............aeyFFEyemrzzssszsa.',
  '............amreeeemrzsszzsssza.',
  '...........azAzsddszAAzsAAAzAAza',
  '...........aAAzdGNdzAAzsAAAAAAAz',
  '..........aAAzzdGGdzAAzsAAAAAAAA',
  '..........aAzzAzddzzAAzsAAzAAAAA',
  '.........aAAzzAzzzAAzsAAAzAAAAAA',
  '.........aAzAAzAAAAzszAAAzzAAAAA',
  '........aAzAAAzzzsssAAAAszAAAAAA',
  '........azzzAAAsssszzAAAzszAAAzr',
];

const RINA_WAJAH = { x: 12, y: 11, w: 10, h: 11 };

const RINA_EKSPRESI = {
  netral: [
    '__________',
    '_eeg_geee_',
    '__________',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__________',
    '___rmr____',
    '__________',
  ],
  cemas: [
    '__g__g____',
    '_ee___eee_',
    '__________',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__________',
    '___mm_____',
    '__________',
  ],
  kesal: [
    '__________',
    '_eee_eeee_',
    '___e_e____',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__________',
    '__mmmm____',
    '__________',
  ],
  bingung: [
    '_____geee_',
    '_eeg______',
    '__________',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__________',
    '____rm____',
    '__________',
  ],
  lega: [
    '__________',
    '_eeg_geee_',
    '__________',
    '__________',
    '_ga__gaag_',
    '__________',
    '____F_____',
    '___yE_____',
    '__x___x___',
    '___rmr____',
    '__________',
  ],
  senang: [
    '__________',
    '_eeg_geee_',
    '__________',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__m___m___',
    '___mbm____',
    '__________',
  ],
  serius: [
    '__________',
    '__________',
    '_eee_eeee_',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__________',
    '__rmmr____',
    '__________',
  ],
  // tersenyum: senyum tertutup lebih lebar, sudut naik (senang = mulut terbuka)
  tersenyum: [
    '__________',
    '_eeg_geee_',
    '__________',
    '_aa__aaa__',
    '_di__bdi__',
    '__________',
    '____F_____',
    '___yE_____',
    '__m___m___',
    '___mmm____',
    '__________',
  ],
};

// ------------------------------------------------------------------ bangun

export const TOKOH = {
  missRaksa: { manifest: 'miss-raksa.json', gambar: 'ikon-miss-raksa.png', dasar: MISS_DASAR, wajah: MISS_WAJAH, ekspresi: MISS_EKSPRESI },
  buRina: { manifest: 'bu-rina.json', gambar: 'ikon-bu-rina.png', dasar: RINA_DASAR, wajah: RINA_WAJAH, ekspresi: RINA_EKSPRESI },
};

export function gridKeGambar(grid, palet, label) {
  if (grid.length !== SISI) throw new Error(`${label}: ${grid.length} baris (harus ${SISI})`);
  const img = L.buat(SISI, SISI);
  grid.forEach((r, y) => {
    if (r.length !== SISI) throw new Error(`${label}: baris ${y} panjang ${r.length}`);
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      const h = palet[HURUF.indexOf(ch)];
      if (!h) throw new Error(`${label}: huruf '${ch}' (baris ${y}, kolom ${x}) di luar palet`);
      const c = L.dariHex(h);
      const i = L.idx(img, x, y);
      img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = 255;
    });
  });
  return img;
}

export function tempel(dasar, kotak, baris, label) {
  if (baris.length !== kotak.h) throw new Error(`${label}: ${baris.length} baris tempelan (harus ${kotak.h})`);
  const g = dasar.map((r) => [...r]);
  baris.forEach((r, i) => {
    if (r.length !== kotak.w) throw new Error(`${label}: baris tempelan ${i} panjang ${r.length} (harus ${kotak.w})`);
    [...r].forEach((ch, j) => { if (ch !== '_') g[kotak.y + i][kotak.x + j] = ch; });
  });
  return g.map((r) => r.join(''));
}

/** Semua ikon satu tokoh: { atlas, sel: {ekspresi: [x,y]}, gambar: {ekspresi: img} } + pemeriksaan kepala terkunci. */
export function bangunTokoh(id) {
  const T = TOKOH[id];
  const m = JSON.parse(fs.readFileSync(path.join(DIR, T.manifest), 'utf8'));
  const palet = m.palet;
  const urutan = m.ekspresi.filter((e) => T.ekspresi[e]);
  const hilang = m.ekspresi.filter((e) => !T.ekspresi[e]);
  if (hilang.length) throw new Error(`${id}: ikon tanpa wajah ${hilang.join(', ')}`);
  const gambar = {};
  const dasar = gridKeGambar(T.dasar, palet, `${id} dasar`);
  for (const e of urutan) {
    const g = gridKeGambar(tempel(T.dasar, T.wajah, T.ekspresi[e], `${id} ${e}`), palet, `${id} ${e}`);
    // kepala terkunci: 0 piksel berubah di luar kotak wajah
    for (let y = 0; y < SISI; y++) for (let x = 0; x < SISI; x++) {
      const dalam = x >= T.wajah.x && x < T.wajah.x + T.wajah.w && y >= T.wajah.y && y < T.wajah.y + T.wajah.h;
      const i = L.idx(g, x, y);
      if (!dalam && Buffer.compare(g.d.subarray(i, i + 4), dasar.d.subarray(i, i + 4))) throw new Error(`${id} ${e}: piksel (${x},${y}) di luar kotak wajah berubah`);
    }
    gambar[e] = g;
  }
  const W = urutan.length * (SISI + CELAH) - CELAH;
  const atlas = L.buat(W, SISI);
  const sel = {};
  urutan.forEach((e, i) => { L.tempel(atlas, gambar[e], i * (SISI + CELAH), 0); sel[e] = [i * (SISI + CELAH), 0]; });
  // ekspresi cerita -> wajah ikon (Miss Raksa: ekspresiDari manifest; Bu Rina: sama nama)
  const ekspresiDari = m.ekspresiDari && typeof m.ekspresiDari === 'object' ? { ...m.ekspresiDari } : Object.fromEntries(urutan.map((e) => [e, e]));
  return { id, T, palet, atlas, sel, gambar, urutan, ekspresiDari, dasar };
}

export function bangun() {
  const hasil = {};
  const manifest = {
    versi: 1,
    dibuat: 'tools/piksel/bangun-ikon.mjs',
    catatan: 'Ikon kepala mini digambar tangan untuk potret bulat < 44 px CSS: 1 piksel ikon = 1 px CSS pada slot 32 (x dpr bulat). Kepala utuh + kerah/bros di dalam lingkaran isi.',
    sisi: SISI,
    isi: ISI,
    tokoh: {},
  };
  for (const id of Object.keys(TOKOH)) {
    const r = bangunTokoh(id);
    const file = path.join(DIR, r.T.gambar);
    const info = tulisPngIndeks(file, r.atlas, r.palet.map(L.dariHex));
    if (info.warna > 40) throw new Error(`${id}: ${info.warna} warna (> 40)`);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
    manifest.tokoh[id] = { gambar: r.T.gambar, ukuranAtlas: [r.atlas.w, r.atlas.h], wajah: [r.T.wajah.x, r.T.wajah.y, r.T.wajah.w, r.T.wajah.h], ekspresi: r.sel, ekspresiDari: r.ekspresiDari, berkas: { byte: info.byte, warna: info.warna, sha256: hash } };
    hasil[id] = r;
  }
  fs.writeFileSync(path.join(DIR, 'ikon.json'), JSON.stringify(manifest, null, 1) + '\n');
  return { manifest, hasil };
}

// ------------------------------------------------------------------ lembar tinjau

/** Bingkai potret seperti .tokoh-potret (latar #fbefd0, cincin putih 2 px, garis luar 1 px) pada ukuran u, skala k. */
export function bingkai(ikon, u, k) {
  const o = L.buat(u * k, u * k, [251, 248, 242, 255]);
  const c = (u - 1) / 2;
  for (let y = 0; y < u; y++) for (let x = 0; x < u; x++) {
    const r = Math.hypot(x - c, y - c);
    let col;
    if (r > u / 2) col = [251, 248, 242];
    else if (r > u / 2 - 0.9) col = [226, 214, 173];
    else if (r > u / 2 - 2.6) col = [255, 255, 255];
    else {
      const ix = x + (ikon.w - u) / 2, iy = y + (ikon.h - u) / 2;
      col = L.buram(ikon, ix, iy) ? [...ikon.d.subarray(L.idx(ikon, ix, iy), L.idx(ikon, ix, iy) + 3)] : [251, 239, 208];
    }
    L.isiKotak(o, x * k, y * k, k, k, [...col, 255]);
  }
  return o;
}

function tinjau(dir, { hasil }) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, r] of Object.entries(hasil)) {
    const baris = r.urutan.map((e) => {
      const g = r.gambar[e];
      return L.susun([{ label: `${e} 32@1`, img: bingkai(g, 32, 1) }, { label: '@2', img: bingkai(g, 32, 2) }, { label: '@3', img: bingkai(g, 32, 3) }, { label: '8x', img: L.perbesar(g, 8) }], { jarak: 10, latar: [250, 248, 242] });
    });
    L.tulis(path.join(dir, `ikon-${id}.png`), L.tumpuk(baris, { jarak: 4, latar: [200, 200, 200] }));
    // ukuran NYATA tanpa pembesaran: semua ekspresi berderet (1x), lalu 2x (HP)
    for (const k of [1, 2]) {
      const b = r.urutan.map((e) => bingkai(r.gambar[e], 32, k));
      const W = b.reduce((s, i) => s + i.w + 6, 6);
      const o = L.buat(W, b[0].h + 12, [255, 255, 255, 255]);
      let x = 6;
      for (const i of b) { L.tempel(o, i, x, 6); x += i.w + 6; }
      L.tulis(path.join(dir, `ikon-${id}-nyata-${k}x.png`), o);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const r = bangun();
  for (const [id, t] of Object.entries(r.manifest.tokoh)) console.log(id, t.gambar, t.ukuranAtlas.join('x'), t.berkas.warna, 'warna', t.berkas.byte, 'byte', t.berkas.sha256);
  const i = process.argv.indexOf('--tinjau');
  if (i > 0 && process.argv[i + 1]) { tinjau(process.argv[i + 1], r); console.log('lembar tinjau ->', process.argv[i + 1]); }
}
