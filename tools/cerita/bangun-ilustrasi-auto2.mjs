/**
 * Aset ILUSTRASI Episode 2 (potret & badan tokoh + interior kantor pilihan pemilik) dari folder sumber yang TIDAK diubah.
 *
 *   node tools/cerita/bangun-ilustrasi-auto2.mjs <folder-sumber> [--tinjau <folder-tinjauan>]
 *
 * Sumber (character/auto-2-ilustrasi/sumber): potret dada-ke-atas 1254x1254 (Miss Raksa & Pak Hendra, lima ekspresi
 * masing-masing), badan penuh 1024x1536 (Bima, Darto, admin bengkel, Hendra, Rudi, petugas tol, polisi), truk trailer
 * 1774x887, interior kantor dan latar pool/bengkel/tol/ruang wawancara 1672x941. Identitas dicocokkan dari ciri visual
 * (kumis & uban Hendra, kacamata Bima, rompi Rudi, topi & rompi oranye petugas tol, rompi hijau-kuning polisi), bukan
 * nama berkas. Lembar stiker tidak dipakai (tokoh kecil & bertepi warna); Miss Raksa badan penuh tidak dipakai (tepi tangan
 * tanpa garis tinta, pinggiran cokelat). Alasan lengkap: docs/cerita/aset/ILUSTRASI-AUTO2.md.
 *
 * Langkah tiap tokoh (tanpa menyentuh berkas asli):
 *  1. alpha >= 248 -> 255 (sumber "padat" ber-alpha 253 = tembus 0,8 %), alpha <= 4 -> 0 (kabut sisa matting);
 *  2. pinggiran: piksel SEMI-transparan di batas siluet yang lebih terang dari garis tinta terdekat (<= 3 px) diwarnai
 *     tinta itu, alpha tetap (antialias terjaga; rambut, tangan, headset, warna baju tidak disentuh karena bagian dalam
 *     tidak diubah); tepi tanpa tinta dibiarkan;
 *  3. potong ke kotak isi + kepala (deteksi leher = baris tersempit dari rentang yang memuat pusat kepala);
 *  4. perkecil Lanczos-3 di ruang PREMULTIPLIED (warna piksel transparan tidak pernah merembes jadi halo);
 *  5. WebP (ffmpeg libwebp, lossy RGB + alpha lossless) beberapa lebar untuk DPR 1-3.
 * Interior: dua lebar WebP + lapisan DEPAN (meja kaca, monitor, lampu) = masker poligon dari gambar yang sama, jadi
 * tokoh di belakang meja tertutup meja yang benar (tanpa meja ganda).
 * Keluaran: client/src/cerita/seni/auto-2/ilustrasi/<id>-<lebar>.webp + ilustrasi.json (manifest semantik).
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const KELUAR = path.join(AKAR, 'client', 'src', 'cerita', 'seni', 'auto-2', 'ilustrasi');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

/** Potret dada-ke-atas: id -> sumber, tokoh, ekspresi naskah yang memakainya, pose (untuk manifest & ASSET-MAP). */
const POTRET = [
  { id: 'miss-senyum', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_23 PM-1.png', tokoh: 'missRaksa', ekspresi: ['netral'], pose: 'senyum tenang' },
  { id: 'miss-jelaskan', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_24 PM-2.png', tokoh: 'missRaksa', ekspresi: ['serius'], pose: 'menjelaskan, telapak terbuka' },
  { id: 'miss-salam', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_26 PM-3.png', tokoh: 'missRaksa', ekspresi: ['tersenyum'], pose: 'tangan menyatu, ramah' },
  { id: 'miss-semangat', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_26 PM-4.png', tokoh: 'missRaksa', ekspresi: ['senang'], pose: 'kepalan menyemangati' },
  { id: 'miss-pikir', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_27 PM-5.png', tokoh: 'missRaksa', ekspresi: ['bingung'], pose: 'tangan di dagu, berpikir' },
  { id: 'hendra-panik', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_35 PM-1.png', tokoh: 'hendra', ekspresi: ['bingung'], pose: 'kaget/panik' },
  { id: 'hendra-cemas', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_36 PM-2.png', tokoh: 'hendra', ekspresi: ['cemas'], pose: 'cemas' },
  { id: 'hendra-tenang', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_37 PM-3.png', tokoh: 'hendra', ekspresi: ['netral', 'lega'], pose: 'tenang, senyum tipis' },
  { id: 'hendra-kecewa', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_38 PM-4.png', tokoh: 'hendra', ekspresi: ['kesal'], pose: 'kecewa/sedih (tidak ada potret marah)' },
  { id: 'hendra-senang', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_39 PM-5.png', tokoh: 'hendra', ekspresi: ['senang'], pose: 'puas, senyum lebar' },
];

/** Badan penuh (panggung lapangan, sampul) + avatar dari kepalanya. */
const BADAN = [
  { id: 'bima', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_51 PM-1.png', tokoh: 'bima', pose: 'berdiri, kacamata, kemeja slate-blue' },
  { id: 'darto', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_51 PM-2.png', tokoh: 'darto', pose: 'berdiri, senyum tegang, kemeja kerja biru' },
  { id: 'admin', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_52 PM-3.png', tokoh: 'admin', pose: 'berdiri, ramah, kemeja steel-blue' },
  { id: 'hendra', sumber: 'ChatGPT Image Nov 2, 2026, 11_36_59 PM-2.png', tokoh: 'hendra', pose: 'berdiri, cemas, kemeja krem' },
  { id: 'rudi', sumber: 'ChatGPT Image Nov 2, 2026, 11_37_00 PM-3.png', tokoh: 'rudi', pose: 'berdiri, polo hijau + rompi abu' },
  { id: 'tol', sumber: 'Friendly Indonesian Toll Worker in Safety Vest-1.png', tokoh: 'tol', pose: 'berdiri, topi, rompi oranye reflektif' },
  // Polisi Jalan Raya (reasset, 3 Nov): dua pose orang yang SAMA (wajah, rambut, kemeja abu, rompi hijau-kuning
  // reflektif, tanpa topi) - beda jelas dari petugas tol (topi & kemeja biru dongker, rompi oranye). Badan = pose memberi
  // keterangan (buku catatan, telapak terbuka); avatar dari pose berdiri tenang (wajah lebih ke depan). Gambar tidak
  // memuat atribut kepolisian (lencana/tulisan); identitas dari nama pemeran di UI (lihat ILUSTRASI-AUTO2.md).
  { id: 'polisi', sumber: 'Traffic Officer Giving a Briefing.png', avatarSumber: 'Friendly Safety Officer in High-Visibility Uniform.png', tokoh: 'polisi', pose: 'memberi keterangan, buku catatan, rompi hijau-kuning' },
];

/** Benda berdiri di lokasi (bukan tokoh): kendaraan kasus. */
const BENDA = [
  { id: 'trailer', sumber: 'Damaged Blue Semi-Truck with Trailer.png', pose: 'truk trailer kepala biru, tampak 3/4 depan kanan, depan & kaca ringsek' },
];

/**
 * Latar lokasi (1672x941). Kantor = interior pilihan pemilik + poligon lapisan depan; lapangan = latar reasset tanpa tokoh
 * (tulisan, rambu & nomor lajur digambar kode di atasnya, bukan dari gambar).
 */
const LATAR = [
  {
    id: 'kantor',
    sumber: 'latar-kantor-pilihan-user.png',
    // Meja kaca (tepi jauh 410,668 -> sudut 1052,606 -> sudut kanan 1556,762, sampai dasar gambar) + monitor & lampu di
    // kiri depan (seluruh blok x < 425 dari puncak monitor ke bawah).
    depan: [[0, 470], [36, 470], [392, 506], [425, 666], [1052, 604], [1558, 760], [1558, 941], [0, 941]],
  },
  { id: 'pool', sumber: 'Colorful Truck Parking Yard Background.png' },
  { id: 'bengkel', sumber: 'Heavy Vehicle Workshop Forecourt.png' },
  { id: 'tol', sumber: 'Vibrant Highway Overpass in Daylight.png' },
  { id: 'wawancara', sumber: 'Bright Modern Office Meeting Room.png' },
];

// 480 + resolusi penuh potongan (sampai 1254; potret dada-ke-atas ~800-840 px): bidikan dekat visual novel tetap tajam.
const LEBAR_POTRET = [480, 1254];
const TINGGI_BADAN = [480, 960, 1520];
const LEBAR_BENDA = [560, 1000, 1680];
const SISI_AVATAR = [160, 320];
const LEBAR_LATAR = [1100, 1672];
const MUTU = { tokoh: 88, latar: 82 };

// ------------------------------------------------------------------ baca/tulis & ukuran

const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function baca(f) {
  const p = PNG.sync.read(fs.readFileSync(f));
  return { w: p.width, h: p.height, d: new Uint8ClampedArray(p.data.buffer, p.data.byteOffset, p.data.length).slice() };
}
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Langkah 1-2: normalisasi alpha + pinggiran berwarna di sebelah tinta. Mengembalikan statistik tepi. */
function bersihkanTepi(img) {
  const { w, h, d } = img;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 248 ? 255 : d[i] <= 4 ? 0 : d[i];
  const bintik = buangBintik(img);
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  let tepi = 0, tinta = 0, diwarnai = 0;
  const ubah = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = d[i + 3];
    if (a === 0 || a === 255) continue;
    let dekatKosong = false;
    for (let dy = -2; dy <= 2 && !dekatKosong; dy++) for (let dx = -2; dx <= 2; dx++) if (A(x + dx, y + dy) === 0) { dekatKosong = true; break; }
    if (!dekatKosong) continue;
    tepi++;
    // tinta terdekat: piksel padat tergelap dalam radius 3
    let best = -1, bestL = 1e9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = (yy * w + xx) * 4;
      if (d[j + 3] !== 255) continue;
      const L = lum(d[j], d[j + 1], d[j + 2]);
      if (L < bestL) { bestL = L; best = j; }
    }
    if (best < 0 || bestL >= 75) continue;
    tinta++;
    if (lum(d[i], d[i + 1], d[i + 2]) > bestL + 25) ubah.push([i, best]);
  }
  for (const [i, j] of ubah) { d[i] = d[j]; d[i + 1] = d[j + 1]; d[i + 2] = d[j + 2]; diwarnai++; }
  return { pikselTepi: tepi, bertinta: tepi ? Math.round((100 * tinta) / tepi) : 0, diwarnaiTinta: diwarnai, bintikDibuang: bintik };
}

/**
 * Bintik lepas: komponen terhubung (alpha > 0, 8 arah) di bawah `min` piksel dibuang (sisa matting yang terpisah dari
 * siluet, mis. titik di dekat tangan polisi). Siluet & bagian tipis yang tersambung (spion, jari) tidak tersentuh.
 */
function buangBintik(img, min = 300) {
  const { w, h, d } = img;
  const label = new Int32Array(w * h).fill(-1);
  const antre = new Int32Array(w * h);
  let dibuang = 0;
  for (let s = 0; s < w * h; s++) {
    if (label[s] !== -1 || d[s * 4 + 3] === 0) continue;
    let kepala = 0, ekor = 0;
    antre[ekor++] = s; label[s] = s;
    while (kepala < ekor) {
      const p = antre[kepala++], x = p % w, y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx;
        if (label[q] === -1 && d[q * 4 + 3] > 0) { label[q] = s; antre[ekor++] = q; }
      }
    }
    if (ekor < min) for (let i = 0; i < ekor; i++) { d[antre[i] * 4 + 3] = 0; dibuang++; }
  }
  return dibuang;
}

/** Kotak isi (alpha >= 128) dan kepala: puncak, leher (baris tersempit dari rentang yang memuat pusat kepala), pusat x. */
function ukurTokoh(img, jenis) {
  const { w, h, d } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= 128) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const tinggi = y1 - y0 + 1;
  // pusat kepala dari 6 % teratas isi
  let sx = 0, n = 0;
  for (let y = y0; y < y0 + tinggi * 0.06; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] >= 128) { sx += x; n++; }
  const cx = Math.round(sx / Math.max(1, n));
  const run = (y) => {
    if (d[(y * w + cx) * 4 + 3] < 128) return Infinity;
    let a = cx, b = cx;
    while (a > 0 && d[(y * w + a - 1) * 4 + 3] >= 128) a--;
    while (b < w - 1 && d[(y * w + b + 1) * 4 + 3] >= 128) b++;
    return b - a + 1;
  };
  // rentang cari leher: potret = 30-62 % tinggi isi, badan = 9-17 %
  const [p, q] = jenis === 'potret' ? [0.3, 0.62] : [0.09, 0.17];
  let leher = Math.round(y0 + tinggi * p), sempit = Infinity, lebarKepala = 0;
  for (let y = y0; y < y0 + tinggi * q; y++) {
    const r = run(y);
    if (y < y0 + tinggi * p) { if (r !== Infinity) lebarKepala = Math.max(lebarKepala, r); continue; }
    if (r < sempit) { sempit = r; leher = y; }
  }
  return { isi: { x: x0, y: y0, w: x1 - x0 + 1, h: tinggi }, kepala: { atas: y0, bawah: leher, cx, lebar: lebarKepala } };
}

function potong(img, k) {
  const out = new Uint8ClampedArray(k.w * k.h * 4);
  for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++) {
    const sx = k.x + x, sy = k.y + y;
    if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
    const i = (sy * img.w + sx) * 4, j = (y * k.w + x) * 4;
    out[j] = img.d[i]; out[j + 1] = img.d[i + 1]; out[j + 2] = img.d[i + 2]; out[j + 3] = img.d[i + 3];
  }
  return { w: k.w, h: k.h, d: out };
}

/** Lanczos-3 terpisah, premultiplied. */
function perkecil(img, W, H) {
  const lanczos = (x) => (x === 0 ? 1 : Math.abs(x) >= 3 ? 0 : (3 * Math.sin(Math.PI * x) * Math.sin((Math.PI * x) / 3)) / (Math.PI * Math.PI * x * x));
  const pre = new Float32Array(img.w * img.h * 4);
  for (let i = 0; i < img.d.length; i += 4) {
    const a = img.d[i + 3] / 255;
    pre[i] = img.d[i] * a; pre[i + 1] = img.d[i + 1] * a; pre[i + 2] = img.d[i + 2] * a; pre[i + 3] = a;
  }
  const lewat = (src, sw, sh, dw, horizontal) => {
    const dh = horizontal ? sh : dw;
    const n = horizontal ? sw : sh;
    const m = horizontal ? dw : dw;
    const outW = horizontal ? dw : sw, outH = horizontal ? sh : dw;
    const out = new Float32Array(outW * outH * 4);
    const skala = n / m, sup = Math.max(1, skala) * 3;
    for (let o = 0; o < m; o++) {
      const pusat = (o + 0.5) * skala - 0.5;
      const a = Math.max(0, Math.ceil(pusat - sup)), b = Math.min(n - 1, Math.floor(pusat + sup));
      const bobot = [];
      let tot = 0;
      for (let k = a; k <= b; k++) { const wgt = lanczos((k - pusat) / Math.max(1, skala)); bobot.push(wgt); tot += wgt; }
      for (let t = 0; t < (horizontal ? sh : sw); t++) {
        let r = 0, g = 0, bl = 0, al = 0;
        for (let k = a; k <= b; k++) {
          const wgt = bobot[k - a] / tot;
          const i = horizontal ? (t * sw + k) * 4 : (k * sw + t) * 4;
          r += src[i] * wgt; g += src[i + 1] * wgt; bl += src[i + 2] * wgt; al += src[i + 3] * wgt;
        }
        const j = horizontal ? (t * outW + o) * 4 : (o * outW + t) * 4;
        out[j] = r; out[j + 1] = g; out[j + 2] = bl; out[j + 3] = al;
      }
    }
    void dh;
    return out;
  };
  const tengah = lewat(pre, img.w, img.h, W, true);
  const akhir = lewat(tengah, W, img.h, H, false);
  const d = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < d.length; i += 4) {
    const a = Math.min(1, Math.max(0, akhir[i + 3]));
    d[i + 3] = Math.round(a * 255);
    if (a > 0.002) { d[i] = akhir[i] / a; d[i + 1] = akhir[i + 1] / a; d[i + 2] = akhir[i + 2] / a; }
  }
  return { w: W, h: H, d };
}

function tulisWebp(img, berkas, mutu) {
  const tmp = path.join(os.tmpdir(), `ilustrasi-${process.pid}-${path.basename(berkas)}.png`);
  const png = new PNG({ width: img.w, height: img.h });
  png.data = Buffer.from(img.d.buffer, img.d.byteOffset, img.d.length);
  fs.writeFileSync(tmp, PNG.sync.write(png));
  const alpha = img.d.some((v, i) => i % 4 === 3 && v < 255);
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-c:v', 'libwebp', '-quality', String(mutu), '-compression_level', '6',
    '-pix_fmt', alpha ? 'yuva420p' : 'yuv420p', berkas]);
  fs.rmSync(tmp);
  return fs.statSync(berkas).size;
}

/** Masker poligon antialias (supersampling 4x4) -> salinan gambar dengan alpha = cakupan poligon. */
function lapisanDepan(img, poligon) {
  const { w, h, d } = img;
  const out = new Uint8ClampedArray(d);
  const dalam = (px, py) => {
    let ya = false;
    for (let i = 0, j = poligon.length - 1; i < poligon.length; j = i++) {
      const [xi, yi] = poligon[i], [xj, yj] = poligon[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ya = !ya;
    }
    return ya;
  };
  const minY = Math.min(...poligon.map((p) => p[1]));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = 0;
    if (y + 1 >= minY) for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (dalam(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) c++;
    out[(y * w + x) * 4 + 3] = Math.round((c / 16) * 255);
  }
  return { w, h, d: out };
}

// ------------------------------------------------------------------ utama

const args = process.argv.slice(2);
const SUMBER = args[0];
const tinjau = args.includes('--tinjau') ? args[args.indexOf('--tinjau') + 1] : null;
if (!SUMBER || !fs.existsSync(SUMBER)) throw new Error('pakai: node tools/cerita/bangun-ilustrasi-auto2.mjs <folder-sumber> [--tinjau <folder>]');
fs.mkdirSync(KELUAR, { recursive: true });
for (const f of fs.readdirSync(KELUAR)) if (f.endsWith('.webp')) fs.rmSync(path.join(KELUAR, f));

const manifest = { versi: 2, catatan: 'Dibuat tools/cerita/bangun-ilustrasi-auto2.mjs; jangan disunting tangan.', potret: {}, badan: {}, benda: {}, latar: {} };
const varian = (img, id, ukuran, sisi, mutu) => ukuran.map((u) => {
  const W = sisi === 'w' ? Math.min(u, img.w) : Math.round((img.w * Math.min(u, img.h)) / img.h);
  const H = sisi === 'w' ? Math.round((img.h * W) / img.w) : Math.min(u, img.h);
  const kecil = perkecil(img, W, H);
  const berkas = `${id}-${sisi === 'w' ? W : H}.webp`;
  const bytes = tulisWebp(kecil, path.join(KELUAR, berkas), mutu);
  if (tinjau) {
    fs.mkdirSync(tinjau, { recursive: true });
    const png = new PNG({ width: W, height: H });
    png.data = Buffer.from(kecil.d);
    fs.writeFileSync(path.join(tinjau, berkas.replace('.webp', '.png')), PNG.sync.write(png));
  }
  return { w: W, h: H, berkas, bytes };
});

function avatar(img, ukur, idAsal, jenis) {
  const { kepala } = ukur;
  const tinggiKepala = kepala.bawah - kepala.atas;
  const sisi = Math.round(tinggiKepala * (jenis === 'potret' ? 1.62 : 1.5));
  const pusatY = kepala.atas + tinggiKepala * (jenis === 'potret' ? 0.62 : 0.6);
  const kotak = { x: Math.round(kepala.cx - sisi / 2), y: Math.round(pusatY - sisi / 2), w: sisi, h: sisi };
  return { kotak, varian: varian(potong(img, kotak), `${idAsal}-avatar`, SISI_AVATAR, 'w', MUTU.tokoh) };
}

for (const p of POTRET) {
  const f = path.join(SUMBER, p.sumber);
  const img = baca(f);
  const tepi = bersihkanTepi(img);
  const ukur = ukurTokoh(img, 'potret');
  const isi = { x: ukur.isi.x - 4, y: Math.max(0, ukur.isi.y - 4), w: ukur.isi.w + 8, h: img.h - Math.max(0, ukur.isi.y - 4) };
  const dekat = potong(img, isi);
  manifest.potret[p.id] = {
    tokoh: p.tokoh, ekspresi: p.ekspresi, pose: p.pose, sumber: p.sumber, sha256: sha256(f), ukuranSumber: [img.w, img.h], tepi,
    // Koordinat kepala dinormalkan terhadap gambar "dekat" (0..1), untuk menskalakan & menaruh tokoh di panggung.
    kepala: { atas: (ukur.kepala.atas - isi.y) / isi.h, bawah: (ukur.kepala.bawah - isi.y) / isi.h, cx: (ukur.kepala.cx - isi.x) / isi.w },
    rasio: isi.w / isi.h,
    dekat: varian(dekat, p.id, LEBAR_POTRET, 'w', MUTU.tokoh),
    avatar: avatar(img, ukur, p.id, 'potret').varian,
  };
  console.log(p.id, JSON.stringify(tepi), 'kepala', ukur.kepala);
}

for (const b of BADAN) {
  const f = path.join(SUMBER, b.sumber);
  const img = baca(f);
  const tepi = bersihkanTepi(img);
  const ukur = ukurTokoh(img, 'badan');
  const isi = { x: ukur.isi.x - 6, y: ukur.isi.y - 6, w: ukur.isi.w + 12, h: ukur.isi.h + 12 };
  const badan = potong(img, isi);
  manifest.badan[b.id] = {
    tokoh: b.tokoh, pose: b.pose, sumber: b.sumber, sha256: sha256(f), ukuranSumber: [img.w, img.h], tepi,
    kepala: { atas: (ukur.kepala.atas - isi.y) / isi.h, bawah: (ukur.kepala.bawah - isi.y) / isi.h, cx: (ukur.kepala.cx - isi.x) / isi.w },
    rasio: isi.w / isi.h,
    tinggiSumber: isi.h,
    dekat: varian(badan, b.id, TINGGI_BADAN, 'h', MUTU.tokoh),
    avatar: avatar(img, ukur, b.id, 'badan').varian,
  };
  // Avatar dari pose lain orang yang sama (wajah lebih ke depan); berkas avatar badan ditimpa dengan nama yang sama.
  if (b.avatarSumber) {
    const fa = path.join(SUMBER, b.avatarSumber);
    const ia = baca(fa);
    bersihkanTepi(ia);
    manifest.badan[b.id].avatar = avatar(ia, ukurTokoh(ia, 'badan'), b.id, 'badan').varian;
    manifest.badan[b.id].avatarSumber = { sumber: b.avatarSumber, sha256: sha256(fa) };
  }
  console.log(b.id, JSON.stringify(tepi), 'kepala', ukur.kepala);
}

for (const b of BENDA) {
  const f = path.join(SUMBER, b.sumber);
  const img = baca(f);
  const tepi = bersihkanTepi(img);
  const { isi } = ukurTokoh(img, 'badan');
  const kotak = { x: isi.x - 6, y: isi.y - 6, w: isi.w + 12, h: isi.h + 12 };
  const benda = potong(img, kotak);
  // Alas (titik terbawah isi) per sepertiga lebar, dinormalkan 0..1: dasar roda belakang (kiri) & depan (kanan).
  const alas = [0, 1, 2].map((k) => {
    let y1 = -1;
    for (let y = 0; y < benda.h; y++) for (let x = Math.floor((k * benda.w) / 3); x < Math.floor(((k + 1) * benda.w) / 3); x++) if (benda.d[(y * benda.w + x) * 4 + 3] >= 128) y1 = y;
    return +(y1 / benda.h).toFixed(4);
  });
  manifest.benda[b.id] = {
    pose: b.pose, sumber: b.sumber, sha256: sha256(f), ukuranSumber: [img.w, img.h], tepi, rasio: kotak.w / kotak.h, alasPerSepertiga: alas,
    gambar: varian(benda, b.id, LEBAR_BENDA, 'w', MUTU.tokoh),
  };
  console.log(b.id, JSON.stringify(tepi), 'kotak', kotak, 'alas', alas);
}

for (const L of LATAR) {
  const f = path.join(SUMBER, L.sumber);
  const img = baca(f);
  for (let i = 3; i < img.d.length; i += 4) img.d[i] = 255;
  manifest.latar[L.id] = {
    sumber: L.sumber, sha256: sha256(f), ukuranSumber: [img.w, img.h],
    gambar: varian(img, `${L.id}-latar`, LEBAR_LATAR, 'w', MUTU.latar),
    ...(L.depan ? { poligonDepan: L.depan, depan: varian(lapisanDepan(img, L.depan), `${L.id}-depan`, LEBAR_LATAR, 'w', MUTU.latar) } : {}),
  };
  console.log('latar', L.id, 'ok');
}

fs.writeFileSync(path.join(KELUAR, 'ilustrasi.json'), JSON.stringify(manifest, null, 2) + '\n');
const total = fs.readdirSync(KELUAR).filter((f) => f.endsWith('.webp')).reduce((s, f) => s + fs.statSync(path.join(KELUAR, f)).size, 0);
console.log(`selesai: ${Object.keys(manifest.potret).length} potret, ${Object.keys(manifest.badan).length} badan, ${Object.keys(manifest.benda).length} benda, ${Object.keys(manifest.latar).length} latar; total ${(total / 1024).toFixed(0)} KB`);
