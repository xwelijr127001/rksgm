/**
 * Menyiapkan sprite tokoh (Mr Roger, Bu Isti, Miss Raksa) dari berkas sumber di character/.
 *
 *   node tools/siapkan-karakter.mjs [id ...] [--pratinjau]
 *
 * Tanpa id: semua tokoh di KARAKTER. Sumber: sheet 4 frame berjajar, latar transparan.
 * Keluaran (client/public/karakter/):
 *   <berkas>-besar.webp/.png  - tinggi frame 360 px (panel HTML & proyektor; tokoh tidak digambar
 *                               di adegan misi supaya tidak menutupi objek)
 *   WebP dipakai lebih dulu (jauh lebih kecil); PNG hanya cadangan untuk browser lama.
 *   client/src/game/art/karakter-sprite.json - ukuran frame (diimpor client)
 * Semua frame satu tokoh dipangkas ke kotak gabungan yang sama supaya animasi tidak bergeser.
 * --pratinjau menulis character/pratinjau-<id>.png (di atas latar krem) untuk memeriksa tepi.
 *
 * Memakai Chrome (puppeteer-core) untuk mengubah ukuran dengan kanvas, jadi tidak perlu
 * pustaka gambar tambahan: `npm install --no-save puppeteer-core`.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const KELUAR = path.join(ROOT, 'client', 'public', 'karakter');
const META = path.join(ROOT, 'client', 'src', 'game', 'art', 'karakter-sprite.json');
const FRAME = 4;
/** id = kunci di shared/brand.ts TOKOH; berkas = awalan nama file keluaran. */
const KARAKTER = [
  { id: 'ceo', berkas: 'ceo', sumber: 'owner-pixel-wave-sheet.png', ukuran: { besar: 360 } },
  { id: 'isti', berkas: 'isti', sumber: 'Direktur IT Isti Marlisa wave.png', ukuran: { besar: 360 } },
  { id: 'missRaksa', berkas: 'miss-raksa', sumber: 'Miss Raksa.png', ukuran: { besar: 360 } },
];
const argumen = process.argv.slice(2);
const pratinjau = argumen.includes('--pratinjau');
const dipilih = argumen.filter((a) => !a.startsWith('--'));
const CHROME = process.env.RAKSA_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const id of dipilih) if (!KARAKTER.some((k) => k.id === id)) throw new Error(`Tokoh tidak dikenal: ${id}`);
fs.mkdirSync(KELUAR, { recursive: true });
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
meta.frames = FRAME;

const br = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await br.newPage();
for (const k of KARAKTER.filter((x) => !dipilih.length || dipilih.includes(x.id))) {
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
