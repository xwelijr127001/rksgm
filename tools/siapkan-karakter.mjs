/**
 * Menyiapkan sprite tokoh (Mr Roger, Bu Isti, Miss Raksa) untuk panel HTML & proyektor.
 *
 *   node tools/siapkan-karakter.mjs [id ...] [--pratinjau]
 *
 * Tanpa id: semua tokoh di KARAKTER. Keluaran (client/public/karakter/):
 *   <berkas>-besar.webp/.png  - sheet 4 frame berjajar (panel HTML & proyektor; tokoh tidak digambar di adegan misi
 *                               supaya tidak menutupi objek). WebP dipakai lebih dulu (image-set di tokoh.css).
 *   client/src/game/art/karakter-sprite.json - ukuran frame (diimpor client)
 *
 * Dua jalur sumber:
 *  1. Sheet gambar (Mr Roger, Bu Isti): sheet 4 frame berjajar di character/, latar transparan. Semua frame satu tokoh
 *     dipangkas ke kotak gabungan yang sama supaya animasi tidak bergeser, lalu dikecilkan bertahap ke tinggi 360 px
 *     (Chrome, kanvas halus). --pratinjau menulis character/pratinjau-<id>.png (di atas latar krem).
 *  2. SENI PIKSEL (Miss Raksa, v4): frame DISUSUN dari atlas + manifest piksel cerita
 *     (client/src/cerita/seni/piksel/miss-raksa.png + .json) lewat penyusun yang SAMA dengan panggung & potret
 *     (seni/piksel/susun.ts, diimpor langsung: node >= 22.18 membuang tipe TypeScript). Tiap frame = tubuh + wajah
 *     ekspresi + mata (kedip) sesuai manifest; semua frame dijajarkan pada titik KAKI kanvas bersama (kepala terkunci:
 *     diperiksa, beda posisi kepala = galat). Pembesaran HANYA nearest-neighbour faktor bulat (`skala`), alpha 0/255.
 *     PNG ditulis pngjs (RGBA); WebP dibuat Chrome dengan kualitas 1 (lossless) lalu DIDEKODE ULANG dan dibandingkan
 *     piksel demi piksel dengan PNG: beda = galat (WebP lossy akan merusak tepi piksel). Ukuran seni asli (piksel seni
 *     per frame, titik kaki, kepala, kotak wajah) ditulis ke `piksel` di karakter-sprite.json; client menampilkan sheet
 *     ini pada jumlah piksel PERANGKAT bulat per piksel seni (game/KarakterTokoh.tsx) dengan image-rendering pixelated,
 *     minimal floor(dpr) piksel perangkat per piksel seni (game/tokoh.ts skalaMinSpritePiksel: HP tidak mengecil).
 *     Jalankan ulang setiap kali atlas/wajah Miss berubah (v5: wajah mengikuti master, sheet dibangun ulang dari atlas v5).
 *     Frame (animasi sapa, tokoh.css tokoh-sambut-mr): 0 berdiri senyum, 1 sambut (telapak bertemu di dada) senyum,
 *     2 sambut senyum kedip, 3 berdiri senyum kedip. Hadap kanan (tokoh di kiri balon sapaan / di kiri panel).
 *
 * Jalur 1 memakai Chrome (puppeteer-core) untuk mengubah ukuran dengan kanvas; jalur 2 memakai Chrome hanya untuk
 * WebP. Tanpa layanan luar.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const KELUAR = path.join(ROOT, 'client', 'public', 'karakter');
const META = path.join(ROOT, 'client', 'src', 'game', 'art', 'karakter-sprite.json');
const PIKSEL = path.join(ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const FRAME = 4;
/** id = kunci di shared/brand.ts TOKOH; berkas = awalan nama file keluaran. */
const KARAKTER = [
  { id: 'ceo', berkas: 'ceo', sumber: 'owner-pixel-wave-sheet.png', ukuran: { besar: 360 } },
  { id: 'isti', berkas: 'isti', sumber: 'Direktur IT Isti Marlisa wave.png', ukuran: { besar: 360 } },
  {
    id: 'missRaksa',
    berkas: 'miss-raksa',
    piksel: {
      tokoh: 'missRaksa',
      atlas: 'miss-raksa.png',
      manifest: 'miss-raksa.json',
      /** Piksel berkas per piksel seni (nearest-neighbour). */
      skala: 2,
      hadap: 'kanan',
      ekspresi: 'tersenyum',
      frame: [
        { pose: 'berdiri', mata: 'buka' },
        { pose: 'berdiri-sambut', mata: 'buka' },
        { pose: 'berdiri-sambut', mata: 'tutup' },
        { pose: 'berdiri', mata: 'tutup' },
      ],
    },
  },
];
const argumen = process.argv.slice(2);
const pratinjau = argumen.includes('--pratinjau');
const dipilih = argumen.filter((a) => !a.startsWith('--'));
const CHROME = process.env.RAKSA_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const id of dipilih) if (!KARAKTER.some((k) => k.id === id)) throw new Error(`Tokoh tidak dikenal: ${id}`);
fs.mkdirSync(KELUAR, { recursive: true });
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
meta.frames = FRAME;

/**
 * Sheet 4 frame dari atlas piksel lewat penyusun cerita. Hasil: { img (skala 1), frameW, frameH, info } dengan info =
 * titik seni frame bersama (kaki, kepala, kotak wajah) untuk potret & ukuran tampil di client.
 */
async function sheetPiksel(k) {
  const L = await import(pathToFileURL(path.join(ROOT, 'tools', 'piksel', 'lib.mjs')).href);
  const { buatPenyusun } = await import(pathToFileURL(path.join(PIKSEL, 'susun.ts')).href);
  const c = k.piksel;
  const json = JSON.parse(fs.readFileSync(path.join(PIKSEL, c.manifest), 'utf8'));
  const penyusun = buatPenyusun({ [c.tokoh]: { json, url: c.atlas } });
  if (penyusun.catatan.length) throw new Error(`manifest ${c.manifest}: ${penyusun.catatan.join('; ')}`);
  const atlas = L.baca(path.join(PIKSEL, c.atlas));
  const susunan = c.frame.map((f) => {
    const s = penyusun.susunTokoh(c.tokoh, { pose: f.pose, hadap: c.hadap, ekspresi: c.ekspresi, mata: f.mata });
    if (!s) throw new Error(`penyusun tidak menghasilkan ${f.pose}`);
    if (s.cadangan.length) throw new Error(`${f.pose}/${f.mata}: memakai cadangan (${s.cadangan.join('; ')})`);
    if (!s.kaki) throw new Error(`${s.frame}: tanpa titik kaki`);
    return s;
  });
  // Kanvas bersama: semua frame dijajarkan pada titik kaki.
  const kiri = Math.max(...susunan.map((s) => s.kaki.x));
  const kanan = Math.max(...susunan.map((s) => s.ukuran.w - s.kaki.x));
  const atas = Math.max(...susunan.map((s) => s.kaki.y));
  const bawah = Math.max(...susunan.map((s) => s.ukuran.h - s.kaki.y));
  const frameW = kiri + kanan;
  const frameH = atas + bawah;
  const img = L.buat(frameW * susunan.length, frameH);
  const kepala = [];
  susunan.forEach((s, i) => {
    const ox = i * frameW + kiri - s.kaki.x;
    const oy = atas - s.kaki.y;
    for (const l of s.lapisan) L.tempel(img, L.potong(atlas, l.sumber.x, l.sumber.y, l.sumber.w, l.sumber.h), ox + l.x, oy + l.y);
    kepala.push({ x: s.kepala.x + kiri - s.kaki.x, y: s.kepala.y + atas - s.kaki.y, wajah: s.wajah?.kotak ? { x: s.wajah.kotak.x + kiri - s.kaki.x, y: s.wajah.kotak.y + atas - s.kaki.y, w: s.wajah.kotak.w, h: s.wajah.kotak.h } : null });
  });
  // Kepala terkunci: kedip & ganti gestur tidak boleh menggeser kepala.
  for (const kp of kepala) {
    if (kp.x !== kepala[0].x || kp.y !== kepala[0].y || JSON.stringify(kp.wajah) !== JSON.stringify(kepala[0].wajah)) {
      throw new Error(`kepala bergeser antarframe: ${JSON.stringify(kepala)}`);
    }
  }
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3] !== 0 && img.d[i + 3] !== 255) throw new Error('alpha bukan 0/255');
  const info = {
    skala: c.skala,
    frameW,
    frameH,
    kaki: { x: kiri, y: atas },
    kepala: { x: kepala[0].x, y: kepala[0].y },
    kepalaTinggi: susunan[0].kepalaTinggi,
    wajah: kepala[0].wajah,
    hadap: c.hadap,
    frame: susunan.map((s, i) => `${s.frame} ${s.ekspresi}${c.frame[i].mata === 'tutup' ? ' kedip' : ''}`),
  };
  return { L, img, frameW, frameH, info };
}

const br = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await br.newPage();
for (const k of KARAKTER.filter((x) => !dipilih.length || dipilih.includes(x.id))) {
  if (k.piksel) {
    const { L, img, frameW, frameH, info } = await sheetPiksel(k);
    const besar = L.perbesar(img, k.piksel.skala);
    const dasar = path.join(KELUAR, `${k.berkas}-besar`);
    L.tulis(`${dasar}.png`, besar);
    const pngUrl = 'data:image/png;base64,' + fs.readFileSync(`${dasar}.png`).toString('base64');
    // WebP lossless dari Chrome, lalu didekode ulang & dibandingkan dengan PNG (piksel ber-alpha 255 harus sama persis,
    // alpha harus sama persis).
    const hasil = await page.evaluate(async (src) => {
      const muat = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
      const data = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
      const png = await muat(src);
      const c = document.createElement('canvas');
      c.width = png.width; c.height = png.height;
      c.getContext('2d').drawImage(png, 0, 0);
      const webp = c.toDataURL('image/webp', 1);
      const a = data(png);
      const b = data(await muat(webp));
      let beda = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] !== b[i + 3]) beda++;
        else if (a[i + 3] === 255 && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) beda++;
      }
      return { webp, beda };
    }, pngUrl);
    if (!hasil.webp.startsWith('data:image/webp')) throw new Error('Chrome tidak menghasilkan WebP');
    if (hasil.beda) throw new Error(`WebP tidak lossless: ${hasil.beda} piksel berbeda dari PNG`);
    fs.writeFileSync(`${dasar}.webp`, Buffer.from(hasil.webp.split(',')[1], 'base64'));
    meta[k.id] = {
      berkas: k.berkas,
      sumber: `client/src/cerita/seni/piksel/${k.piksel.atlas} + ${k.piksel.manifest} (seni piksel v4, penyusun seni/piksel/susun.ts)`,
      piksel: info,
      besar: { frameW: frameW * k.piksel.skala, frameH: frameH * k.piksel.skala },
    };
    const kb = (ext) => (fs.statSync(`${dasar}.${ext}`).size / 1024).toFixed(1);
    console.log(`${k.berkas}-besar`, `${frameW}x${frameH} piksel seni x${k.piksel.skala} per frame | webp ${kb('webp')} KB (lossless, 0 piksel beda) | png ${kb('png')} KB`);
    if (pratinjau) {
      const p = path.join(ROOT, 'character', `pratinjau-${k.berkas}.png`);
      const latar = L.buat(besar.w + 40, besar.h + 40, [250, 249, 245, 255]);
      L.tempel(latar, besar, 20, 20);
      L.tulis(p, latar);
      console.log('pratinjau:', p);
    }
    continue;
  }
  const dataUrl = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'character', k.sumber)).toString('base64');
  const hasil = await page.evaluate(async (src, n, ukuran, lihat) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    // Lebar sheet tidak selalu habis dibagi jumlah frame (mis. 1774 / 4): awal frame dibulatkan.
    const awal = (f) => Math.round((f * img.width) / n);
    const fw = Math.floor(img.width / n);
    const fh = img.height;
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    // Kotak gabungan piksel yang cukup tampak (alpha > 24) di semua frame.
    let minX = fw, minY = fh, maxX = 0, maxY = 0;
    for (let f = 0; f < n; f++) {
      for (let y = 0; y < fh; y++) for (let px = 0; px < fw; px++) {
        const a = d[(y * c.width + awal(f) + px) * 4 + 3];
        if (a > 24) { if (px < minX) minX = px; if (px > maxX) maxX = px; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
    }
    const pad = 4;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(fw - 1, maxX + pad); maxY = Math.min(fh - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    // Kecilkan bertahap (setengah demi setengah) supaya tidak bergerigi.
    const kecilkan = (sumber, w, h, tw, th) => {
      let cur = sumber; let cwid = w; let chei = h;
      while (cwid / 2 > tw) {
        const t = document.createElement('canvas');
        t.width = Math.round(cwid / 2); t.height = Math.round(chei / 2);
        const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high';
        tx.drawImage(cur, 0, 0, cwid, chei, 0, 0, t.width, t.height);
        cur = t; cwid = t.width; chei = t.height;
      }
      const o = document.createElement('canvas');
      o.width = tw; o.height = th;
      const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
      ox.drawImage(cur, 0, 0, cwid, chei, 0, 0, tw, th);
      return o;
    };
    const keluar = {};
    for (const [nama, th] of Object.entries(ukuran)) {
      const tw = Math.round((cw * th) / ch);
      const sheet = document.createElement('canvas');
      sheet.width = tw * n; sheet.height = th;
      const sx = sheet.getContext('2d');
      for (let f = 0; f < n; f++) {
        const potong = document.createElement('canvas');
        potong.width = cw; potong.height = ch;
        potong.getContext('2d').drawImage(c, awal(f) + minX, minY, cw, ch, 0, 0, cw, ch);
        sx.drawImage(kecilkan(potong, cw, ch, tw, th), f * tw, 0);
      }
      keluar[nama] = { png: sheet.toDataURL('image/png'), webp: sheet.toDataURL('image/webp', 0.9), frameW: tw, frameH: th };
    }
    let lihatUrl = null;
    if (lihat) {
      // Pratinjau di atas latar krem game, untuk memeriksa tepi/halo warna.
      const s = keluar.besar;
      const bg = document.createElement('canvas');
      bg.width = s.frameW * n + 40; bg.height = s.frameH + 40;
      const bx = bg.getContext('2d');
      bx.fillStyle = '#faf9f5'; bx.fillRect(0, 0, bg.width, bg.height);
      const im = new Image(); im.src = s.webp; await im.decode();
      bx.drawImage(im, 20, 20);
      lihatUrl = bg.toDataURL('image/png');
    }
    return { keluar, potong: { minX, minY, cw, ch, fw, fh }, lihatUrl };
  }, dataUrl, FRAME, k.ukuran, pratinjau);

  const m = { berkas: k.berkas, sumber: `character/${k.sumber}`, potong: hasil.potong };
  for (const [nama, v] of Object.entries(hasil.keluar)) {
    if (!v.webp.startsWith('data:image/webp')) throw new Error('Chrome tidak menghasilkan WebP');
    const dasar = path.join(KELUAR, `${k.berkas}-${nama}`);
    for (const ext of ['png', 'webp']) fs.writeFileSync(`${dasar}.${ext}`, Buffer.from(v[ext].split(',')[1], 'base64'));
    m[nama] = { frameW: v.frameW, frameH: v.frameH };
    const kb = (ext) => Math.round(fs.statSync(`${dasar}.${ext}`).size / 1024);
    console.log(`${k.berkas}-${nama}`, `${v.frameW}x${v.frameH} per frame | webp ${kb('webp')} KB | png ${kb('png')} KB`);
  }
  meta[k.id] = m;
  if (hasil.lihatUrl) {
    const p = path.join(ROOT, 'character', `pratinjau-${k.berkas}.png`);
    fs.writeFileSync(p, Buffer.from(hasil.lihatUrl.split(',')[1], 'base64'));
    console.log('pratinjau:', p);
  }
}
await br.close();
// Ukuran frame dibaca client lewat impor JSON.
fs.writeFileSync(META, JSON.stringify(meta, null, 2) + '\n');
