/**
 * T-029: PALET RAKSA v1 di seluruh game (character/palet-raksa-v1/PALET.md; DESIGN-REVIEW D-268..D-288). Tiga pemeriksaan:
 *
 *  A. PINDAI WARNA LAMA. Daftar = tools/cek-palet-t029.data.json: `merek` (tujuh warna merek lama dari tugas: #215c40 #163e2b
 *     #2e9a66 #176b45 #f6c445 #d8a41f #e0b84f), `palet` (warna lama yang disebut PALET.md) dan `pensiun` (389 warna lama di
 *     peta-hex.csv Designer yang SEMUA pemakaiannya berubah dan yang bukan nilai baru). Bentuk yang dicari: #rrggbb(aa), #rgb,
 *     0xrrggbb, rgb()/rgba().
 *       sumber : client/src/**.css -> tidak boleh ada satu pun; client/src/**.ts(x) -> hanya di berkas SENI (daftar izin di
 *                bawah, tiap butir beralasan: tokoh, adegan, diagram mempertahankan warnanya, D-276 / PALET 7); client/index.html
 *                -> hanya di dalam <template id="pra-tpl"> (salinan gambar Raki).
 *       build  : <dist>/assets/*.css -> tidak boleh ada, kecuali di dalam url(data:...) (seni piksel yang disisipkan);
 *                <dist>/assets/*.js -> setiap temuan harus warna yang memang ada di berkas seni sumber (kode seni ikut
 *                terbundel sebagai teks; pemindaian sumber menjamin warna itu tidak dipakai di luar seni);
 *                <dist>/index.html -> seperti sumbernya; client/public/*.svg dan <dist>/*.svg (favicon) -> tidak boleh ada.
 *  B. TOKEN: nilai token di CSS build (--hijau = --kuning = --utama = #ff9000, --fokus = #212121, ...) dan kontras WCAG pasangan
 *     yang dijanjikan PALET: cincin fokus >= 3 : 1 pada halaman #FFF9F5, blush #F9EEEA dan putih; label di atas jingga, jingga
 *     sebagai teks, teks status di atas pucatnya, putih di atas isi status >= 4,5 : 1.
 *  C. LAYAR (butuh server uji): 12 layar kunci x 390x745 (DPR 2) dan 1280x800, untuk Designer: beranda, pemilih episode, obrolan
 *     K01, aktivitas berkas K02, K-SIM, ruang Komite (K11), kartu akhir, host, proyektor, join, lobi, masuk CMS; ditambah lembar
 *     balasan K01 (nomor pilihan, D-284), pemilih skenario host, tiga layar babak 1 room (peserta, proyektor, host) dan, bila
 *     mode lama aktif di server uji, halaman /solo dan proyektor kuis lama tanpa room (/acara/layar, latar gelap). Tiap layar diperiksa dari gaya TERHITUNG: tidak ada teks terang di atas
 *     isi jingga, tidak ada teks jingga di latar terang (kecuali wordmark .mrk, PALET 6), tombol utama nonaktif memakai satu
 *     tampilan (D-289: isi #E0E0E0, label #5F5F5F, tepi = isi, opasitas 1), dan di beranda cincin fokus tiap perhentian Tab
 *     >= 3 : 1 terhadap latarnya. Kontras teks di bawah 4,5 : 1 (3 : 1 untuk teks besar) DICATAT, bukan gagal:
 *     latar bergambar tidak bisa dihitung dan sebagian adalah teks nonaktif.
 *
 *   node tools/cek-palet-t029.mjs --dist <folder build> --tanpa-layar
 *   UI_BASE=http://127.0.0.1:4003 RAKSA_KREDENSIAL=<uji>/dev-staff-credentials.json node tools/cek-palet-t029.mjs --dist <folder build>
 *        [--hanya-layar] [--kasus potongan-nama]
 *   Server uji = build uji + DB uji (aturan tools/cek-room-t028.mjs): alat ini MEMBUKA ROOM, jadi UI_BASE harus loopback dan
 *   port 4000-4002 ditolak. RAKSA_KREDENSIAL = akun uji dari story:dev-setup (isinya tidak pernah dicetak). State cerita =
 *   team/evidence/T-013/states.json. Satu browser (Chromium), prioritas rendah, penjaga 12 menit.
 * Tangkapan layar + hasil.json (jalan penuh; jalan sebagian: hasil-sebagian.json) -> team/evidence/T-029/fullstack/. Kode keluar: 0 lulus, 1 ada yang gagal, 2 argumen / env / penjaga.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'client', 'src');
const OUT = path.join(ROOT, 'team/evidence/T-029/fullstack');
const argumen = (nama, bawaan = null) => { const i = process.argv.indexOf(nama); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : bawaan; };
const DIST = path.resolve(ROOT, argumen('--dist', process.env.RAKSA_DIST || 'client/dist'));
const tanpaLayar = process.argv.includes('--tanpa-layar');
const hanyaLayar = process.argv.includes('--hanya-layar');
const hanyaKasus = argumen('--kasus');
function tolak(pesan) { console.error(`DITOLAK: ${pesan}`); process.exit(2); }

const DATA = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'cek-palet-t029.data.json'), 'utf8'));
const MEREK = new Set(DATA.merek); const LAMA = new Set([...DATA.merek, ...DATA.palet, ...DATA.pensiun]);

/**
 * Berkas SENI di client/src (awalan jalur): warna lama di sini disengaja. `warna` (opsional) membatasi izin ke warna itu saja.
 * Aturan (PALET 2.5 dan 7; D-276): PNG, kanvas dan SVG seni tidak diwarnai ulang; tokoh mempertahankan warnanya.
 */
const SENI = [
  { jalur: 'art/', alasan: 'seni vektor: adegan jalan halaman awal, peta kota, Raki, surveyor, avatar (tokoh dan seragam mempertahankan warnanya)' },
  { jalur: 'cerita/seni/', alasan: 'seni piksel / vektor cerita: ruang, tokoh, benda' },
  { jalur: 'cerita/ui/panggung/prop.ts', alasan: 'benda panggung cerita (seni)' },
  { jalur: 'cerita/ui/latar/piksel/', alasan: 'latar piksel (seni)' },
  { jalur: 'game/art/', alasan: 'palet gambar adegan misi lama (seni kanvas)' },
  { jalur: 'game/scenes/', alasan: 'adegan misi lama (seni kanvas)' },
  { jalur: 'cerita/ui/BuktiLajur.tsx', alasan: 'diagram bukti lajur jalan: aspal, marka, pelat rambu (warna benda)' },
  { jalur: 'pages/ProtoKejadian.tsx', alasan: 'prototipe diagram kejadian: SVG kendaraan dan jalan (warna benda)' },
  { jalur: 'cerita/hp/meja/MejaScene.ts', warna: ['#f7f3e8'], alasan: 'kertas berkas di meja kasus (warna benda); antarmuka kanvasnya sudah disapu' },
];
const seniUntuk = (rel) => SENI.find((s) => rel === s.jalur || (s.jalur.endsWith('/') && rel.startsWith(s.jalur)));

const hasil = []; let gagal = 0;
function lapor(nama, lulus, data) { hasil.push({ nama, lulus, ...data }); if (!lulus) gagal++; console.log(lulus ? 'PASS' : 'FAIL', nama, JSON.stringify(data)); }
// hasil.json = jalan PENUH saja; jalan sebagian (--tanpa-layar, --hanya-layar, --kasus) menulis hasil-sebagian.json supaya tidak menimpanya.
const BERKAS_HASIL = tanpaLayar || hanyaLayar || hanyaKasus ? 'hasil-sebagian.json' : 'hasil.json';
const tulisHasil = () => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, BERKAS_HASIL), JSON.stringify(hasil, null, 1)); };

// ================================================================== A. pindai warna lama

const h2 = (n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0');
const WARNA = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|\b0x([0-9a-fA-F]{6})\b|rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/g;
/** Semua warna lama di `teks`: [{ hex, i, bentuk }]. */
function temuan(teks) {
  const out = []; let m; WARNA.lastIndex = 0;
  while ((m = WARNA.exec(teks))) {
    let x;
    if (m[1]) { x = m[1].toLowerCase(); if (x.length <= 4) x = [...x.slice(0, 3)].map((c) => c + c).join(''); else x = x.slice(0, 6); }
    else if (m[2]) x = m[2].toLowerCase();
    else x = h2(m[3]) + h2(m[4]) + h2(m[5]);
    if (LAMA.has('#' + x)) out.push({ hex: '#' + x, i: m.index, bentuk: m[0] });
  }
  return out;
}
const baris = (teks, i) => teks.slice(0, i).split('\n').length;
const sekitar = (teks, i, n = 46) => teks.slice(Math.max(0, i - n), i + n).replace(/\s+/g, ' ');
const jalan = (d, uji) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? jalan(path.join(d, e.name), uji) : uji(e.name) ? [path.join(d, e.name)] : [])) : []);
const tanpaKomentarBlok = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const tanpaKomentarBaris = (s) => s.split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
const ringkas = (daftar, n = 12) => ({ jumlah: daftar.length, ...(daftar.length ? { contoh: daftar.slice(0, n) } : {}) });
/** Bagian index.html di luar templat pra-JS (di dalamnya = salinan gambar Raki, seni). */
const luarTemplat = (html) => html.replace(/<template id="pra-tpl">[\s\S]*?<\/template>/, (m) => m.replace(/[^\n]/g, ' '));

function pindai() {
  // ---- sumber
  const cssSalah = []; const tsSalah = []; const seniHex = new Set(); const seniBerkas = new Map();
  for (const f of jalan(SRC, (n) => /\.(css|ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n))) {
    const rel = path.relative(SRC, f).split(path.sep).join('/'); const css = f.endsWith('.css');
    let s = tanpaKomentarBlok(fs.readFileSync(f, 'utf8')); if (!css) s = tanpaKomentarBaris(s);
    for (const t of temuan(s)) {
      const izin = css ? null : seniUntuk(rel);
      if (izin && (!izin.warna || izin.warna.includes(t.hex))) { seniHex.add(t.hex); seniBerkas.set(rel, (seniBerkas.get(rel) ?? 0) + 1); continue; }
      (css ? cssSalah : tsSalah).push(`${rel}:${baris(s, t.i)} ${t.bentuk}${MEREK.has(t.hex) ? ' (merek)' : ''}`);
    }
  }
  lapor('sumber-css', cssSalah.length === 0, { ...ringkas(cssSalah), catatan: 'client/src/**/*.css: tidak boleh ada warna lama' });
  lapor('sumber-ts', tsSalah.length === 0, { ...ringkas(tsSalah), seni: { berkas: seniBerkas.size, pemakaian: [...seniBerkas.values()].reduce((a, b) => a + b, 0), warna: seniHex.size } });
  const indeks = fs.readFileSync(path.join(ROOT, 'client/index.html'), 'utf8'); const diLuar = temuan(luarTemplat(indeks));
  for (const t of temuan(indeks)) seniHex.add(t.hex);
  lapor('sumber-index', diLuar.length === 0, { ...ringkas(diLuar.map((t) => `index.html:${baris(indeks, t.i)} ${t.bentuk}`)), catatan: 'di luar <template id="pra-tpl"> (gambar Raki)' });
  // client/public/*.svg di tingkat atas (favicon, D-296): ikon antarmuka, bukan seni tokoh; subfolder (karakter/) = seni, tidak dipindai.
  const publik = path.join(ROOT, 'client/public'); const svgSalah = [];
  for (const n of fs.existsSync(publik) ? fs.readdirSync(publik).filter((x) => x.endsWith('.svg')) : []) { const s = fs.readFileSync(path.join(publik, n), 'utf8'); for (const t of temuan(s)) svgSalah.push(`${n}:${baris(s, t.i)} ${t.bentuk}`); }
  lapor('sumber-publik', svgSalah.length === 0, { ...ringkas(svgSalah), catatan: 'client/public/*.svg (favicon)' });

  // T-030 / T-031: setiap hex di client/src/gaya-game.css ada di PALET.md (atau empat rona baru T-031).
  const palet = new Set([...fs.readFileSync(path.join(ROOT, 'character/palet-raksa-v1/PALET.md'), 'utf8').matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()).concat(['#f3ded3', '#ffd9a8', '#ffe4c2', '#fff1e2', '#ecd5cb']));
  const gg = path.join(SRC, 'gaya-game.css'); const hexBaru = fs.existsSync(gg) ? [...new Set([...tanpaKomentarBlok(fs.readFileSync(gg, 'utf8')).matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()))].filter((h) => !palet.has(h)) : ['gaya-game.css tidak ada'];
  lapor('gaya-game-hex', hexBaru.length === 0, { diluarPalet: hexBaru });
  // ---- build
  const aset = path.join(DIST, 'assets');
  if (!fs.existsSync(aset)) { lapor('bangun', false, { sebab: [`folder build tidak ada: ${aset} (--dist)`] }); return; }
  const cssB = jalan(aset, (n) => n.endsWith('.css')); const jsB = jalan(aset, (n) => n.endsWith('.js'));
  const salahCss = []; let diData = 0;
  for (const f of cssB) {
    const s = fs.readFileSync(f, 'utf8'); const data = [...s.matchAll(/url\((["']?)data:[^)]*\)/g)].map((m) => [m.index, m.index + m[0].length]);
    for (const t of temuan(s)) { if (data.some(([a, b]) => t.i >= a && t.i < b)) { diData++; continue; } salahCss.push(`${path.basename(f)} ${t.bentuk}${MEREK.has(t.hex) ? ' (merek)' : ''} | ${sekitar(s, t.i)}`); }
  }
  lapor('bangun-css', cssB.length > 0 && salahCss.length === 0, { berkas: cssB.length, ...ringkas(salahCss, 20), diDataUri: diData });
  const salahJs = []; let dijelaskan = 0; const merekSeni = new Map();
  for (const f of jsB) {
    const s = fs.readFileSync(f, 'utf8');
    for (const t of temuan(s)) {
      if (seniHex.has(t.hex)) { dijelaskan++; if (MEREK.has(t.hex)) merekSeni.set(t.hex, (merekSeni.get(t.hex) ?? 0) + 1); continue; }
      salahJs.push(`${path.basename(f)} ${t.bentuk} | ${sekitar(s, t.i)}`);
    }
  }
  lapor('bangun-js', jsB.length > 0 && salahJs.length === 0, { berkas: jsB.length, ...ringkas(salahJs, 20), dijelaskanSeni: dijelaskan, merekDiSeni: Object.fromEntries(merekSeni) });
  const idx = path.join(DIST, 'index.html');
  if (fs.existsSync(idx)) { const h = fs.readFileSync(idx, 'utf8'); const d = temuan(luarTemplat(h)); lapor('bangun-index', d.length === 0, ringkas(d.map((t) => `${t.bentuk} | ${sekitar(h, t.i)}`))); }
  const svgB = []; for (const n of fs.readdirSync(DIST).filter((x) => x.endsWith('.svg'))) { const s = fs.readFileSync(path.join(DIST, n), 'utf8'); for (const t of temuan(s)) svgB.push(`${n} ${t.bentuk}`); }
  lapor('bangun-publik', svgB.length === 0, { ...ringkas(svgB), catatan: '<dist>/*.svg (favicon)' });

  // ================================================================ B. token dan kontras
  const semuaCss = cssB.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const tok = (nama) => { const m = new RegExp(`--${nama}:\\s*(#[0-9a-fA-F]{3,8})`).exec(semuaCss); if (!m) return null; let x = m[1].slice(1).toLowerCase(); if (x.length === 3) x = [...x].map((c) => c + c).join(''); return '#' + x.slice(0, 6); };
  const harap = { hijau: '#ff9000', kuning: '#ff9000', utama: '#ff9000', 'hijau-tua': '#e07e00', 'utama-tekan': '#e07e00', 'utama-tepi': '#b25c00', 'di-utama': '#212121', 'utama-teks': '#9a4f00', 'utama-teks-tua': '#7a3e00', krem: '#fff9f5', panel: '#f9eeea', 'panel-tepi': '#ecd5cb', pilih: '#fff5ec', tinta: '#212121', 'tinta-lembut': '#5f5f5f', garis: '#e0e0e0', fokus: '#212121', putih: '#ffffff',
    tepat: '#2f7d57', 'tepat-teks': '#1f5c3f', 'tepat-pucat': '#e6f1ea', kurang: '#3e7285', 'kurang-teks': '#2c5a6b', 'kurang-pucat': '#e4eef2', keliru: '#d32f2f', 'keliru-teks': '#b3261e', 'keliru-pucat': '#fdecea', 'hp-hijau': '#ff9000', 'hp-latar': '#fff9f5', 'hp-kertas': '#ffffff', 'hp-tinta': '#212121' };
  const T = Object.fromEntries(Object.keys(harap).map((k) => [k, tok(k)]));
  const bedaToken = Object.keys(harap).filter((k) => T[k] !== harap[k]).map((k) => `--${k}: ${T[k]} (seharusnya ${harap[k]})`);
  lapor('token-nilai', bedaToken.length === 0, { ...ringkas(bedaToken, 40), diperiksa: Object.keys(harap).length });
  const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const kontras = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
  const PASANG = [
    ['cincin fokus pada halaman', 'fokus', 'krem', 3], ['cincin fokus pada blush', 'fokus', 'panel', 3], ['cincin fokus pada putih', 'fokus', 'putih', 3], ['cincin fokus pada rona terpilih', 'fokus', 'pilih', 3],
    ['label di atas jingga', 'di-utama', 'utama', 4.5], ['label di atas jingga ditekan', 'di-utama', 'utama-tekan', 4.5],
    ['jingga-teks pada putih', 'utama-teks', 'putih', 4.5], ['jingga-teks pada halaman', 'utama-teks', 'krem', 4.5], ['jingga-teks pada blush', 'utama-teks', 'panel', 4.5], ['jingga-teks pada rona terpilih', 'utama-teks', 'pilih', 4.5],
    ['tinta pada halaman', 'tinta', 'krem', 4.5], ['tinta pada blush', 'tinta', 'panel', 4.5], ['teks abu pada halaman', 'tinta-lembut', 'krem', 4.5], ['teks abu pada blush', 'tinta-lembut', 'panel', 4.5],
    ['putih di atas tepat', 'putih', 'tepat', 4.5], ['putih di atas kurang', 'putih', 'kurang', 4.5], ['putih di atas keliru', 'putih', 'keliru', 4.5],
    ['teks tepat pada pucatnya', 'tepat-teks', 'tepat-pucat', 4.5], ['teks kurang pada pucatnya', 'kurang-teks', 'kurang-pucat', 4.5], ['teks keliru pada pucatnya', 'keliru-teks', 'keliru-pucat', 4.5],
    ['tepi tombol utama pada halaman (grafik)', 'utama-tepi', 'krem', 3],
  ];
  const nilai = PASANG.map(([n, a, b, min]) => ({ n, k: T[a] && T[b] ? kontras(T[a], T[b]) : 0, min }));
  lapor('token-kontras', nilai.every((x) => x.k >= x.min), { kurang: nilai.filter((x) => x.k < x.min).map((x) => `${x.n}: ${x.k} < ${x.min}`), nilai: Object.fromEntries(nilai.map((x) => [x.n, x.k])) });
}

// ================================================================== C. layar

/** Pemeriksaan gaya terhitung satu halaman (dijalankan di browser). */
const auditHalaman = () => {
  const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const kontras = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const campur = (atas, bawah) => ({ r: atas.r * atas.a + bawah.r * (1 - atas.a), g: atas.g * atas.a + bawah.g * (1 - atas.a), b: atas.b * atas.a + bawah.b * (1 - atas.a), a: 1 });
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const jingga = (c) => { const r = c.r / 255, g = c.g / 255, b = c.b / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return false; const d = mx - mn; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return h >= 24 && h <= 40 && s >= 0.85 && l >= 0.4 && l <= 0.56; };
  /** Latar efektif: lapisan warna leluhur sampai yang padat; null bila ada gambar latar di jalan (tidak bisa dihitung). */
  const latar = (el) => { const lapis = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); let w = rgb(c.backgroundColor); if (c.backgroundImage && c.backgroundImage !== 'none') { const muka = (c.getPropertyValue('--k-muka') || c.getPropertyValue('--c-muka')).trim(); if (/^#[0-9a-f]{6}$/i.test(muka)) w = { r: parseInt(muka.slice(1, 3), 16), g: parseInt(muka.slice(3, 5), 16), b: parseInt(muka.slice(5, 7), 16), a: 1 }; else if (!w || w.a < 0.99) return null; } if (w && w.a > 0.01) { lapis.push(w); if (w.a >= 0.99) break; } } let d = { r: 255, g: 255, b: 255, a: 1 }; for (const w of lapis.reverse()) d = campur(w, d); return d; };
  const nama = (el) => { const k = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''; return el.tagName.toLowerCase() + k; };
  const tampak = (el) => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) < 0.05) return false; if (c.position === 'absolute' && (c.clip === 'rect(0px, 0px, 0px, 0px)' || (parseFloat(c.width) <= 1 && parseFloat(c.height) <= 1))) return false; } return true; };
  const putihDiJingga = [], jinggaDiTerang = [], rendah = []; let teks = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const punyaTeks = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!punyaTeks || !tampak(el)) continue;
    const c = getComputedStyle(el); const w0 = rgb(c.color); if (!w0 || w0.a < 0.05) continue; const bg = latar(el); if (!bg) continue; teks++;
    const w = campur(w0, bg); const isi = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 32); const ket = `${nama(el)} "${isi}" ${hex(w)} di ${hex(bg)}`;
    if (jingga(bg) && lum(w) > 0.55) putihDiJingga.push(ket);
    if (jingga(w) && lum(bg) > 0.6 && !el.closest('.mrk')) jinggaDiTerang.push(ket);
    const k = kontras(w, bg); const besar = parseFloat(c.fontSize) >= 24 || (parseFloat(c.fontSize) >= 18.66 && Number(c.fontWeight) >= 700);
    if (k < (besar ? 3 : 4.5) && !el.closest('.mrk') && !el.closest('[disabled], [aria-disabled="true"]')) rendah.push([Math.round(k * 100) / 100, ket]);
  }
  // ikon garis / isi terang di dalam isi jingga (currentColor ikut label; yang dicari = putih yang ditulis langsung)
  const ikon = [];
  for (const el of document.querySelectorAll('svg, svg *')) { if (!tampak(el)) continue; const c = getComputedStyle(el); for (const p of ['stroke', 'fill']) { const w = rgb(c[p]); if (!w || w.a < 0.5 || lum(w) < 0.7) continue; const induk = el.closest('svg')?.parentElement; const bg = induk ? latar(induk) : null; if (bg && jingga(bg) && el.closest('svg').getBoundingClientRect().width <= 40) ikon.push(`${nama(induk)} > svg ${p} ${hex(w)}`); } }
  // D-289 (T-029 Fix 1): tombol utama nonaktif punya SATU tampilan: isi #E0E0E0, label #5F5F5F, tepi = isi, opasitas 1; di atas
  // proyektor gelap isi #424242, label #A4A4A4. Pengecualian yang disengaja: "Kamu siap" di lobi kuis lama (.lobby-focus).
  const nonaktifSalah = []; let nonaktif = 0;
  for (const el of document.querySelectorAll('button.primary-action:disabled, button.btn:disabled, button.lk-btn-utama:disabled')) {
    if (!tampak(el) || el.closest('.lobby-focus')) continue; nonaktif++;
    const c = getComputedStyle(el); const gelap = !!el.closest('.proyektor'); const isi = gelap ? 'rgb(66, 66, 66)' : 'rgb(224, 224, 224)'; const label = gelap ? 'rgb(164, 164, 164)' : 'rgb(95, 95, 95)';
    const tepi = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(c['border' + s + 'Width']) > 0 && c['border' + s + 'Color'] !== isi);
    const hx = (v) => { const m = /^#([0-9a-f]{6})$/i.exec(String(v).trim()); return m ? `rgb(${parseInt(m[1].slice(0, 2), 16)}, ${parseInt(m[1].slice(2, 4), 16)}, ${parseInt(m[1].slice(4, 6), 16)})` : null; };
    const muka = hx(c.getPropertyValue('--k-muka')) ?? c.backgroundColor; const tepiK = hx(c.getPropertyValue('--k-tepi'));
    const tepiSalah = tepiK ? (tepiK !== isi ? [tepiK] : []) : tepi;
    if (muka !== isi || c.color !== label || Number(c.opacity) !== 1 || tepiSalah.length) nonaktifSalah.push(`${nama(el)} "${el.textContent.trim().slice(0, 24)}" isi ${muka} label ${c.color} opasitas ${c.opacity}${tepiSalah.length ? ' tepi ' + tepiSalah[0] : ''}`);
  }
  // T-030: setiap tombol bergaya tombol memakai tanda pixel key: --k-muka terisi, >= 9 lapis gradien, sudut 0. Tombol jingga polos
  // yang tidak ikut daftar kelas juga dicari (warna isi #FF9000 tanpa gradien). Tombol ikon bundar: lingkaran + alas 2 px.
  const KUNCI = '.primary-action, .btn, .lp-pintu-aksi, .akh-kedua, .hp-lembar-kembali, .akh-navigasi button, .hp-opsi, .lk-btn, .kj-kedua, .meja-sekunder, .cer-tombol-garis, .bank-btn';
  const kunciSalah = []; let kunci = 0;
  for (const el of document.querySelectorAll(KUNCI)) { if (!tampak(el)) continue; kunci++; const c = getComputedStyle(el); const lapis = (c.backgroundImage.match(/linear-gradient/g) || []).length;
    if (!c.getPropertyValue('--k-muka').trim() || lapis < 9 || parseFloat(c.borderTopLeftRadius) > 0) kunciSalah.push(`${nama(el)} "${el.textContent.trim().slice(0, 20)}" lapis ${lapis} sudut ${c.borderTopLeftRadius}`); }
  for (const el of document.querySelectorAll('button, a')) { if (!tampak(el) || el.matches(KUNCI) || el.closest('svg')) continue; const c = getComputedStyle(el); if (c.backgroundColor === 'rgb(255, 144, 0)' && c.backgroundImage === 'none' && el.getBoundingClientRect().height >= 32) kunciSalah.push(`${nama(el)} "${el.textContent.trim().slice(0, 20)}" tombol jingga polos tanpa pixel key`); }
  const bundarSalah = []; for (const el of document.querySelectorAll('.pilih-bahasa, .sound-button, .hp-kembali')) { if (!tampak(el)) continue; const c = getComputedStyle(el); if (!/0px 2px 0px/.test(c.boxShadow)) bundarSalah.push(`${nama(el)} alas ${c.boxShadow}`); }
  // T-031: kartu K1 / K1 ringan / K4 bersudut tangga (border-radius <= 2 px, --c-muka terisi)
  const kartuSalah = []; let kartu = 0;
  for (const el of document.querySelectorAll('.lp-halaman .lp-pintu, .cer-ep, .stf-kartu, .stf-masuk-kartu, .lp-join, .hp-lembar, .hp-gelembung, .lp-kota-balon, .hp-status-catatan, section.hp-aksi, .akh-pelajaran')) { if (!tampak(el)) continue; kartu++; const c = getComputedStyle(el); if (parseFloat(c.borderTopLeftRadius) > 2 || !c.getPropertyValue('--c-muka').trim()) kartuSalah.push(`${nama(el)} sudut ${c.borderTopLeftRadius}`); }
  const latarPiksel = [...document.querySelectorAll('.lp-halaman, .cer-hub-layar, .hp-layar, .stf')].filter((e) => /gradient/.test(getComputedStyle(e).backgroundImage)).map((e) => e.tagName.toLowerCase() + '.' + [...e.classList].join('.'));
  // Catatan pemilik 2 (18 Nov): (A) tidak ada sudut > 2 px di cangkang cerita / beranda / pemilih kecuali lingkaran ikon dan avatar;
  // (B) isi teks pertama kartu K1/K4 >= 14 px dari tepi kiri luar; (C) tab K4 di garis atas; (D) tombol di dalam kartu terinset >= 14 px.
  const KECUALI = /penanda|skala|mood|potret|avatar|ikon|titik|tokoh|tanda|nada|arah|bulat|wajah|pilih-bahasa|sound-button|hp-kembali/;
  const sudutSalah = [];
  for (const el of document.querySelectorAll(':is(.hp-layar, .hp-tema, .lp-halaman, .cer-hub-layar, .akh-kartu, .player-ui, .stf, .sr-layar, .proyektor) *')) {
    if (el.closest('svg') || el.tagName === 'IMG' || !tampak(el)) continue; const c = getComputedStyle(el);
    if (parseFloat(c.borderTopLeftRadius) > 2 && !el.matches('input[type="checkbox"], input[type="radio"]') && !KECUALI.test(String(el.className)) && !(el.parentElement && el.parentElement.getAttribute('role') === 'radio')) sudutSalah.push(nama(el) + ' ' + c.borderTopLeftRadius);
  }
  const RINGAN = '.hp-gelembung, .lp-kota-balon, .hp-status-catatan, .cer-istilah-tombol, .cer-istilah-tombol-bentuk, .akh-gelembung';
  const dalamSalah = []; let bingkai = 0;
  for (const k of document.querySelectorAll('*')) {
    if (!tampak(k)) continue; const c = getComputedStyle(k); if (!c.getPropertyValue('--c-muka').trim() || k.matches(RINGAN) || !/gradient/.test(c.backgroundImage)) continue; bingkai++;
    const kr = k.getBoundingClientRect(); const tab = k.querySelector('.hp-aksi-label, .akh-pelajaran-label, .hp-tindakan > b');
    const teks = [...k.querySelectorAll('*')].find((e) => e !== tab && !e.closest('button, a.primary-action, .lp-pintu-aksi') && tampak(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    if (teks && teks.getBoundingClientRect().left - kr.left < 13.5) dalamSalah.push(nama(k) + ': teks "' + teks.textContent.trim().slice(0, 18) + '" ' + Math.round(teks.getBoundingClientRect().left - kr.left) + ' px dari tepi');
    for (const t of k.querySelectorAll(KUNCI)) { if (!tampak(t)) continue; const r = t.getBoundingClientRect(); const ins = [r.left - kr.left, kr.right - r.right, kr.bottom - r.bottom].map((x) => Math.round(x * 10) / 10); if (ins.some((x) => x < 13.5)) dalamSalah.push(nama(k) + ': tombol "' + t.textContent.trim().slice(0, 14) + '" inset ' + ins.join('/')); }
    if (tab) { const tr = tab.getBoundingClientRect(); const pusat = tr.top + tr.height / 2 - kr.top; if (Math.abs(pusat - 1.5) > 2) dalamSalah.push(nama(k) + ': tab pusat ' + Math.round(pusat * 10) / 10 + ' px dari tepi atas'); }
  }
  rendah.sort((a, b) => a[0] - b[0]);
  return { teks, sudutSalah, dalamSalah, bingkai, nonaktif, nonaktifSalah, kunci, kunciSalah, bundarSalah, kartu, kartuSalah, latarPiksel, putihDiJingga: [...new Set(putihDiJingga)], jinggaDiTerang: [...new Set(jinggaDiTerang)], ikonTerangDiJingga: [...new Set(ikon)].slice(0, 8), kontrasRendah: [...new Map(rendah.map((x) => [x[1], x])).values()].slice(0, 10).map(([k, s]) => `${k} : 1 ${s}`), kontrasRendahJumlah: new Set(rendah.map((x) => x[1])).size };
};

async function layar() {
  const BASE = (process.env.UI_BASE || '').replace(/\/+$/, '');
  let url; try { url = new URL(BASE); } catch { tolak('UI_BASE wajib untuk bagian layar, mis. http://127.0.0.1:4003 (atau --tanpa-layar)'); }
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) tolak(`UI_BASE harus server uji loopback, bukan ${url.hostname}`);
  if (['4000', '4001', '4002'].includes(url.port || '80')) tolak(`port ${url.port} milik server lain (pemilik / reviewer): alat ini membuka room`);
  const berkasKred = process.env.RAKSA_KREDENSIAL;
  if (!berkasKred || !fs.existsSync(berkasKred)) tolak('RAKSA_KREDENSIAL wajib untuk bagian layar: dev-staff-credentials.json dari story:dev-setup DB uji');
  let KRED; try { KRED = JSON.parse(fs.readFileSync(berkasKred, 'utf8')); } catch { tolak('RAKSA_KREDENSIAL tidak terbaca sebagai JSON (isinya tidak ditampilkan)'); }
  if (typeof KRED['uji.host'] !== 'string') tolak('RAKSA_KREDENSIAL tidak berisi akun uji.host');
  const berkasState = path.join(ROOT, 'team/evidence/T-013/states.json');
  if (!fs.existsSync(berkasState)) tolak('state cerita tidak ada: team/evidence/T-013/states.json');
  const S = JSON.parse(fs.readFileSync(berkasState, 'utf8'));
  const { bukaGulir, denganBatas, luncur, pasangPenjaga, siap, tunggu } = await import('./t018-umum.mjs');
  const { mulaiPrioritasRendah } = await import('./prioritas-rendah.mjs');
  mulaiPrioritasRendah(); // pemilik bekerja di PC yang sama
  fs.mkdirSync(OUT, { recursive: true });
  const HP = { n: '390x745', w: 390, h: 745, dpr: 2 }; const LEBAR = { n: '1280', w: 1280, h: 800, dpr: 1 };
  let b = null;
  const batal = pasangPenjaga(12, () => { lapor('penjaga', false, { sebab: ['bagian layar melewati batas waktu'] }); tulisHasil(); try { b?.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
  b = await denganBatas(luncur('chromium'), 45000, 'luncur chromium');

  const sampai = async (p, fn, arg, ms, nama) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await tunggu(150); } throw new Error(`batas waktu ${Math.round(ms / 1000)} d: ${nama}`); };
  const klik = (p, sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => !x.disabled && x.getBoundingClientRect().width > 0); if (!el) return false; el.click(); return true; }, sel);
  const isi = (p, daftar) => p.evaluate((d) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; for (const [sel, i, nilai] of d) { const el = document.querySelectorAll(sel)[i]; set.call(el, nilai); el.dispatchEvent(new Event('input', { bubbles: true })); } }, daftar);
  /** Halaman staf / room: konteks sendiri, tanpa profil pemain; isMobile tetap false supaya ganti ukuran tidak memuat ulang. */
  const bukaPolos = async (vp, jalur, hp = false) => {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); p.setDefaultTimeout(20000); p.setDefaultNavigationTimeout(30000);
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: hp, hasTouch: hp });
    await p.evaluateOnNewDocument(() => { try { localStorage.setItem('raksa:bahasa', 'id'); sessionStorage.setItem('raksa:loader:v1', '1'); } catch { /* abaikan */ } });
    const galat = []; p.on('pageerror', (e) => galat.push(String(e?.message ?? e).slice(0, 160)));
    await gerakBiasa(p);
    await p.goto(BASE + jalur, { waitUntil: 'domcontentloaded' });
    return { p, galat, tutup: () => denganBatas(ctx.close(), 10000, 'tutup konteks').catch(() => {}) };
  };
  // Chrome tanpa kepala di sesi jarak jauh melaporkan prefers-reduced-motion: reduce, lalu beranda memuat baris "Animasi dimatikan".
  // Tangkapan untuk Designer memakai keadaan biasa; dipasang begitu halaman dibuat, sebelum interaksi apa pun.
  const gerakBiasa = (p) => p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]).catch(() => {});
  const tenang = async (p, ms = 700) => { await denganBatas(p.evaluate(() => document.fonts?.ready.then(() => true)), 5000, 'font').catch(() => null); await tunggu(ms); };
  /** Tangkap + periksa satu layar. `vpNama` hanya untuk nama berkas. */
  const tangkap = async (h, nama, vpNama, tambahan = {}) => {
    await tenang(h.p, 1100); // animasi masuk selesai dulu
    const a = await denganBatas(h.p.evaluate(auditHalaman), 20000, 'audit ' + nama);
    // Tangkapan `fullPage` mengubah ukuran layar SAAT menangkap, dan animasi masuk lalu berputar ulang (lembar balasan dan
    // adegan beranda tertangkap setengah pudar). Jadi: halaman yang menggulir ditinggikan dulu setinggi isinya, animasi
    // berhingga ditunggu selesai, baru ditangkap sebagai layar biasa; layar terkunci (cangkang HP 100dvh) ditangkap apa adanya.
    const selesaiAnimasi = () => h.p.evaluate(() => Promise.race([
      Promise.all(document.getAnimations().filter((x) => { const t = x.effect?.getComputedTiming?.(); return t && t.iterations !== Infinity; }).map((x) => x.finished.catch(() => null))),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(() => true)).catch(() => null);
    const tinggi = await h.p.evaluate(() => ({ isi: document.scrollingElement.scrollHeight, layar: window.innerHeight }));
    const vp0 = h.p.viewport();
    if (tinggi.isi > tinggi.layar + 1 && vp0) { await h.p.setViewport({ ...vp0, height: Math.min(tinggi.isi, 8000) }); await tunggu(500); }
    await selesaiAnimasi();
    await h.p.screenshot({ path: path.join(OUT, `${nama}-${vpNama}.png`) });
    if (tinggi.isi > tinggi.layar + 1 && vp0) { await h.p.setViewport(vp0); await tunggu(200); }
    const LATAR = { '01-beranda': 'lp-halaman', '02-pemilih': 'cer-hub-layar', '03-obrolan': 'hp-layar', '03b-lembar': 'hp-layar', '04-berkas': 'hp-layar', '05-ksim': 'hp-layar', '06-ruang': 'hp-layar', '07-kartu': 'hp-layar', '08-host': 'stf', '12-cms': 'stf', '15-host': 'stf' };
    const perlu = Object.entries(LATAR).find(([k]) => nama.startsWith(k))?.[1]; const tanpaLatar = perlu && !a.latarPiksel.some((x) => x.includes('.' + perlu)) ? ['latar piksel ' + perlu + ' tidak ada'] : [];
    const sebab = [...a.sudutSalah.map((x) => 'sudut membulat: ' + x), ...a.dalamSalah.map((x) => 'kartu: ' + x), ...a.kunciSalah.map((x) => 'tombol tanpa pixel key: ' + x), ...a.bundarSalah.map((x) => 'tombol bundar tanpa alas 2 px: ' + x), ...a.kartuSalah.map((x) => 'kartu tidak bersudut tangga: ' + x), ...tanpaLatar, ...a.putihDiJingga.map((x) => 'teks terang di atas jingga: ' + x), ...a.jinggaDiTerang.map((x) => 'teks jingga di latar terang: ' + x), ...a.nonaktifSalah.map((x) => 'tombol utama nonaktif bukan tampilan D-289: ' + x), ...h.galat.map((x) => 'galat halaman: ' + x)];
    lapor(`${nama}-${vpNama}`, sebab.length === 0, { sebab, teks: a.teks, bingkaiDiukur: a.bingkai, tombolKunci: a.kunci, kartu: a.kartu, latar: a.latarPiksel, tombolNonaktif: a.nonaktif, ikonTerangDiJingga: a.ikonTerangDiJingga, kontrasRendah: a.kontrasRendahJumlah, contohKontrasRendah: a.kontrasRendah, ...tambahan });
  };
  const mau = (nama) => !hanyaKasus || nama.includes(hanyaKasus);
  // ---- 00 uji diri: pemeriksaan gaya terhitung harus menemukan tiga pelanggaran buatan (kalau tidak, hasil "bersih" tidak berarti)
  {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage();
    await p.setContent('<body style="background:#fff9f5"><button style="background:#ff9000;color:#fff;border:0">Putih di jingga</button><p style="color:#ff9000">Jingga di terang</p><span style="color:#a4a4a4">Abu lemah</span><p style="color:#212121">Tinta</p><button class="btn" disabled style="background:#ff9000;color:#212121;opacity:.45;border:1px solid #b25c00">Nonaktif salah</button></body>');
    const a = await p.evaluate(auditHalaman); await ctx.close();
    lapor('00-uji-diri-audit', a.putihDiJingga.length === 1 && a.jinggaDiTerang.length === 1 && a.kontrasRendahJumlah === 3 && a.teks === 5 && a.nonaktifSalah.length === 1, { putihDiJingga: a.putihDiJingga, jinggaDiTerang: a.jinggaDiTerang, kontrasRendah: a.kontrasRendah, nonaktifSalah: a.nonaktifSalah });
  }
  const coba = async (nama, fn) => { if (!mau(nama)) return; try { await denganBatas(fn(), 110000, nama); } catch (e) { lapor(nama, false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 220)] }); } };

  // ---- 01 beranda (+ cincin fokus), 02 pemilih episode: halaman pemain dengan profil tersimpan
  for (const vp of [HP, LEBAR]) {
    await coba('01-beranda', async () => {
      const h = await bukaGulir('chromium', b, BASE, vp, 'id', null, '/'); await gerakBiasa(h.p);
      await sampai(h.p, () => !!document.querySelector('.lp-halaman .lp-pintu-aksi'), null, 20000, 'beranda');
      let fokus = null;
      if (vp === HP) {
        await tenang(h.p); fokus = [];
        for (let i = 0; i < 8; i++) {
          await h.p.keyboard.press('Tab');
          fokus.push(await h.p.evaluate(() => {
            const el = document.activeElement; if (!el || el === document.body) return null; const c = getComputedStyle(el);
            const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
            const lum = (x) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(x.r) + 0.7152 * f(x.g) + 0.0722 * f(x.b); };
            let bg = null; for (let e = el.parentElement; e; e = e.parentElement) { const w = rgb(getComputedStyle(e).backgroundColor); if (w && w.a >= 0.99) { bg = w; break; } }
            bg ??= { r: 255, g: 255, b: 255 }; const o = rgb(c.outlineColor);
            const k = o && c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 ? (Math.max(lum(o), lum(bg)) + 0.05) / (Math.min(lum(o), lum(bg)) + 0.05) : null;
            const nm = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
            return { el: nm, cincin: c.outlineStyle === 'none' ? 'tanpa garis luar' : `${c.outlineWidth} ${c.outlineColor}`, kontras: k === null ? null : Math.round(k * 100) / 100 };
          }));
        }
        fokus = fokus.filter(Boolean);
        await h.p.evaluate(() => document.activeElement?.blur?.());
        const lemah = fokus.filter((f) => f.kontras === null || f.kontras < 3);
        lapor('01-beranda-cincin-fokus', fokus.length >= 6 && lemah.length === 0, { sebab: lemah.map((f) => `${f.el}: ${f.cincin} (${f.kontras})`), perhentian: fokus.map((f) => `${f.el} ${f.kontras}`) });
      }
      await tangkap(h, '01-beranda', vp.n); await h.tutup();
    });
    await coba('02-pemilih', async () => {
      const h = await bukaGulir('chromium', b, BASE, vp, 'id', null, '/cerita'); await gerakBiasa(h.p);
      await sampai(h.p, () => document.querySelectorAll('.cer-ep').length >= 2, null, 20000, 'pemilih episode');
      await tangkap(h, '02-pemilih', vp.n); await h.tutup();
    });
    // ---- 03..07 Episode 2 dari state tersimpan
    const ep2 = (nama, state, masuk) => coba(nama, async () => {
      if (!S[state]) throw new Error('state ' + state + ' tidak ada');
      const h = await bukaGulir('chromium', b, BASE, vp, 'id', S[state].nilai); await gerakBiasa(h.p);
      await siap(h.p); const data = await masuk(h.p);
      await tangkap(h, nama, vp.n, data); await h.tutup();
    });
    await ep2('03-obrolan-k01', 'tel-panik', async (p) => {
      for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.querySelector('.hp-obrolan .hp-ucapan, .hp-obrolan [data-balas], .hp-obrolan .hp-pesan'))); i++) { if (!await klik(p, '[data-mulai-percakapan], [data-lanjut]')) await tunggu(500); await tunggu(900); await siap(p, 5000); }
      await siap(p, 8000);
      return { tampilan: await p.evaluate(() => document.querySelector('.hp-layar')?.getAttribute('data-tampilan') ?? null) };
    });
    await ep2('03b-lembar-balasan-k01', 'tel-panik', async (p) => {
      // HP: lembar balasan (.hp-lembar); desktop: pilihan yang sama tampil di halaman.
      for (let i = 0; i < 8 && !(await p.evaluate(() => document.querySelectorAll('.hp-opsi').length >= 2)); i++) { if (!await klik(p, '[data-balas], .hp-obrolan .hp-kirim-tombol, [data-mulai-percakapan], [data-lanjut]')) await tunggu(500); await tunggu(900); await siap(p, 5000); }
      await sampai(p, () => document.querySelectorAll('.hp-opsi').length >= 2, null, 15000, 'pilihan balasan');
      await tunggu(900); await p.evaluate(() => document.querySelectorAll('.hp-opsi')[1]?.click()); await tunggu(700);
      return { opsi: await p.evaluate(() => document.querySelectorAll('.hp-opsi').length), dipilih: await p.evaluate(() => document.querySelectorAll('.hp-opsi.dipilih').length), lembar: await p.evaluate(() => !!document.querySelector('.hp-lembar')) };
    });
    const tugas = async (p) => {
      for (let i = 0; i < 10 && !(await p.evaluate(() => !!document.querySelector('[data-mulai-tugas]'))); i++) { if (!await klik(p, '[data-lanjut], [data-mulai-percakapan]')) break; await tunggu(900); await siap(p, 4000); }
      if (!await klik(p, '[data-mulai-tugas]')) throw new Error('kartu tugas tidak tercapai');
      await tunggu(1300);
      const t = await p.evaluate(() => document.querySelector('.hp-layar')?.getAttribute('data-tampilan') ?? null);
      if (t !== 'arena') throw new Error('aktivitas tidak terbuka (tampilan ' + t + ')');
      return { tampilan: t, node: await p.evaluate(() => document.querySelector('.hp-main')?.getAttribute('data-node') ?? null) };
    };
    await ep2('04-berkas-k02', 'tel-cemas', tugas);
    await ep2('05-ksim', 'akt-saksi', tugas);
    await ep2('06-ruang-komite', 'berkas', async (p) => {
      await p.evaluate(() => new Promise((r) => { const t0 = Date.now(); const f = () => (document.querySelector('.hp-vn .cer-piksel[data-siap]') || Date.now() - t0 > 6000 ? r(1) : setTimeout(f, 100)); f(); }));
      return { lokasi: await p.evaluate(() => document.querySelector('.hp-vn .cer-latar')?.getAttribute('data-lokasi') ?? null) };
    });
    await ep2('07-kartu-akhir', 'akhir-puas', async (p) => {
      // State akhir-* berhenti di adegan penutup: ketuk Lanjut sampai kartu akhir tampil (seperti cek-layar-t018 `adegan(p, 'akhir')`).
      for (let i = 0; i < 14 && !(await p.evaluate(() => !!document.querySelector('.akh-kartu'))); i++) { await klik(p, '.hp-vn-aksi [data-lanjut], [data-lanjut]'); await tunggu(800); await siap(p, 4000); }
      await sampai(p, () => !!document.querySelector('.akh-kartu'), null, 15000, 'kartu akhir'); await tunggu(900);
      return { token: await p.evaluate(() => [...document.querySelectorAll('.akh-token-gambar')].map((e) => e.getAttribute('data-nilai') ?? 'tepat').join(',').slice(0, 160)) };
    });
    // ---- 16 mode lama /solo (hanya bila server uji berjalan dengan RAKSA_LEGACY=on; kalau tidak, dilewati dan dicatat)
    await coba('16-solo', async () => {
      const h = await bukaGulir('chromium', b, BASE, vp, 'id', null, '/solo'); await gerakBiasa(h.p);
      await tenang(h.p, 1500);
      const ada = await h.p.evaluate(() => !!document.querySelector('[class*="solo-"]'));
      if (!ada) { console.log('LEWAT 16-solo-' + vp.n + ' (mode lama tidak aktif di server uji)'); await h.tutup(); return; }
      await tangkap(h, '16-solo', vp.n); await h.tutup();
    });
    // ---- 17 proyektor kuis lama tanpa room (mode lama saja): latar tinta; tombol "Tampilkan layar" nonaktif = D-289 di latar gelap
    await coba('17-proyektor-lama', async () => {
      const h = await bukaPolos(vp, '/acara/layar', vp === HP);
      await tenang(h.p, 1500);
      const ada = await h.p.evaluate(() => !!document.querySelector('.proyektor'));
      if (!ada) { console.log('LEWAT 17-proyektor-lama-' + vp.n + ' (mode lama tidak aktif di server uji)'); await h.tutup(); return; }
      await tangkap(h, '17-proyektor-lama', vp.n); await h.tutup();
    });
    // ---- 12 masuk CMS
    await coba('12-cms-masuk', async () => {
      const h = await bukaPolos(vp, '/cms');
      await sampai(h.p, () => !!document.querySelector('.stf-masuk-kartu input'), null, 30000, 'form masuk CMS');
      await tangkap(h, '12-cms-masuk', vp.n); await h.tutup();
    });
  }

  // ---- 08 host, 09 proyektor, 10 join, 11 lobi: satu room uji (lalu babak 1: 13 peserta, 14 proyektor, 15 host)
  if (mau('08-host') || mau('09-proyektor') || mau('10-join') || mau('11-lobi') || mau('13-') || mau('14-') || mau('15-') || mau('18-') || mau('19-')) {
    let host = null; const orang = []; let pry = null;
    try {
      await denganBatas((async () => {
        host = await bukaPolos(LEBAR, '/host');
        await sampai(host.p, () => document.querySelectorAll('.stf-masuk-kartu input').length >= 2, null, 30000, 'form masuk staf');
        await isi(host.p, [['.stf-masuk-kartu input', 0, 'uji.host'], ['.stf-masuk-kartu input', 1, KRED['uji.host']]]);
        await host.p.click('.stf-masuk-kartu button[type=submit]');
        await sampai(host.p, () => !!document.querySelector('.stf-pilih-skenario .stf-opsi'), null, 30000, 'pemilih skenario host');
        const judul = await host.p.evaluate(() => { const semua = [...document.querySelectorAll('.stf-pilih-skenario .stf-opsi')]; const pilih = semua.find((l) => /Truk Trailer/.test(l.textContent)) ?? semua[0]; pilih.querySelector('input').click(); return pilih.querySelector('b')?.textContent.trim() ?? ''; });
        await sampai(host.p, () => !!document.querySelector('.stf-pilih-skenario .stf-opsi.terpilih'), null, 5000, 'skenario terpilih');
        await host.p.evaluate(() => { const c = document.querySelector('.stf-pilih-skenario').closest('.stf-kartu').querySelector('.stf-centang input'); if (c?.checked) c.click(); });
        if (mau('08-host')) { await tangkap(host, '08-host-pemilih', LEBAR.n, { skenario: judul }); }
        await host.p.evaluate(() => document.querySelector('.stf-pilih-skenario').closest('.stf-kartu').querySelector('button.btn-utama').click());
        await sampai(host.p, () => !!document.querySelector('.stf-room-kode') && new URL(location.href).searchParams.get('room'), null, 20000, 'room terbuka');
        const kode = await host.p.evaluate(() => new URL(location.href).searchParams.get('room'));
        for (const [vp, nama] of [[HP, 'Ani'], [LEBAR, 'Budi']]) {
          const x = await bukaPolos(vp, `/join?room=${kode}`, vp === HP); orang.push(x);
          await sampai(x.p, () => !!document.querySelector('.sr-join-nama input.kolom'), null, 30000, `${nama}: langkah nama`);
          await isi(x.p, [['.sr-join-nama input.kolom', 0, nama]]);
          if (mau('10-join')) await tangkap(x, '10-join', vp.n);
          await x.p.evaluate(() => { const c = document.querySelector('.sr-setuju input'); if (c && !c.checked) c.click(); });
          await x.p.click('.sr-join-nama button[type=submit]');
          await sampai(x.p, () => location.pathname.startsWith('/room/') && !!document.querySelector('.sr-lobi'), null, 20000, `${nama}: lobi`);
          if (mau('11-lobi')) await tangkap(x, '11-lobi', vp.n);
        }
        await sampai(host.p, () => (document.body.innerText.match(/Ani|Budi/g) ?? []).length >= 2, null, 15000, 'host melihat dua peserta').catch(() => null);
        const duaUkuran = async (h, nama, tambahan = {}) => { for (const vp of [LEBAR, HP]) { await h.p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: false, hasTouch: false }); await tunggu(500); await tangkap(h, nama, vp.n, tambahan); } await h.p.setViewport({ width: LEBAR.w, height: LEBAR.h, deviceScaleFactor: 1, isMobile: false, hasTouch: false }); };
        if (mau('08-host')) await duaUkuran(host, '08-host', { fase: 'lobi', kode: 'room uji' });
        pry = await bukaPolos(LEBAR, `/projector?room=${kode}`);
        await sampai(pry.p, (k) => document.body.innerText.includes(k), kode, 30000, 'proyektor memuat room');
        if (mau('09-proyektor')) await duaUkuran(pry, '09-proyektor', { fase: 'lobi' });
        // babak 1 (adegan): host menekan tombol utama satu kali
        if (mau('13-') || mau('14-') || mau('15-') || mau('18-') || mau('19-')) {
          await sampai(host.p, () => { const t = document.querySelector('.stf-room-kendali .stf-tombol .btn-utama'); return t && !t.disabled; }, null, 15000, 'tombol mulai host');
          await host.p.click('.stf-room-kendali .stf-tombol .btn-utama');
          await sampai(orang[0].p, () => !!document.querySelector('.sr-ronde[data-fase]'), null, 30000, 'babak 1 di HP peserta');
          await tunggu(1500);
          const fase = await orang[0].p.evaluate(() => document.querySelector('.sr-ronde[data-fase]')?.getAttribute('data-fase'));
          if (mau('13-')) { await tangkap(orang[0], '13-room-babak1', HP.n, { fase }); await tangkap(orang[1], '13-room-babak1', LEBAR.n, { fase }); }
          if (mau('14-')) await duaUkuran(pry, '14-proyektor-babak1', { fase });
          if (mau('15-')) await duaUkuran(host, '15-host-babak1', { fase });
          // T-030 Fix 1: babak 1 sampai akibat dan peringkat (kedua peserta menjawab pilihan pertama)
          if (mau('18-') || mau('19-')) {
            const faseDari = (p) => p.evaluate(() => document.querySelector('.sr-ronde[data-fase]')?.getAttribute('data-fase') ?? '');
            const tombolHost = async (labels) => { const t0 = Date.now(); while (Date.now() - t0 < 40000) { const ok = await host.p.evaluate((ls) => { const b = document.querySelector('.stf-room-kendali .stf-tombol .btn-utama'); if (b && !b.disabled && ls.some((l) => b.textContent.includes(l))) { b.click(); return true; } return false; }, labels).catch(() => false); if (ok) return true; await tunggu(400); } return false; };
            await tombolHost(['Buka pilihan']);
            for (const x of orang) {
              await sampai(x.p, () => document.querySelectorAll('[data-pilihan]').length > 0, null, 40000, 'pilihan tampil');
              await x.p.evaluate(() => { const k = document.querySelector('[data-pilihan]'); k.scrollIntoView({ block: 'center' }); k.click(); });
              await tunggu(300); await x.p.evaluate(() => document.querySelector('[data-kirim]')?.click()); await tunggu(500);
            }
            const t1 = Date.now(); while (Date.now() - t1 < 45000 && (await faseDari(orang[0].p)) !== 'consequence') await tunggu(500);
            await tunggu(1200);
            if (mau('18-')) { await tangkap(orang[0], '18-akibat', HP.n, { fase: await faseDari(orang[0].p) }); await tangkap(orang[1], '18-akibat', LEBAR.n, { fase: await faseDari(orang[1].p) }); }
            await tombolHost(['Lanjut ke peringkat', 'peringkat']);
            const t2 = Date.now(); while (Date.now() - t2 < 30000 && (await faseDari(orang[0].p)) !== 'leaderboard') await tunggu(500);
            await tunggu(1200);
            if (mau('19-')) { await tangkap(orang[0], '19-peringkat', HP.n, { fase: await faseDari(orang[0].p) }); await tangkap(orang[1], '19-peringkat', LEBAR.n, { fase: await faseDari(orang[1].p) }); await duaUkuran(pry, '19-proyektor-peringkat', {}); }
          }
        }
      })(), 240000, 'room uji');
    } catch (e) { lapor('room-uji', false, { sebab: ['galat alat: ' + String(e?.message ?? e).slice(0, 220)] }); }
    for (const x of [...orang, pry, host]) await x?.tutup();
  }
  batal();
  await denganBatas(b.close(), 15000, 'tutup browser').catch(() => { try { b.process?.()?.kill('SIGKILL'); } catch { /* abaikan */ } });
}

if (!hanyaLayar) pindai();
if (!tanpaLayar) await layar();
tulisHasil();
console.log(gagal ? `FAILED ${gagal} / ${hasil.length}` : `ALL PASS (${hasil.length})`);
process.exit(gagal ? 1 : 0);
