/**
 * T-020 batch 2: potong atlas sembilan-iris kartu saksi (kartu-9i.png, 4 sel 18 x 18) dan tombol aksi (tombol-9i.png, 2 sel 18 x 22)
 * menjadi satu berkas per sel, karena CSS border-image tidak bisa menunjuk satu sel atlas. Lossless: palet, tRNS dan kedalaman bit
 * sama dengan sumbernya; hanya pikselnya yang dipotong. Sumber: character/aktivitas-ep2-pixel-v1/saksi/ (tidak diubah).
 * Keluaran: client/src/cerita/seni/aktivitas/saksi/{kartu-biasa,kartu-tempel,kartu-bayangan,kartu-pilih,tombol-biasa,tombol-tekan}-9i.png
 *   node tools/piksel/potong-atlas-t020.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const P = ROOT.split(path.sep).join('/') + '/'; const R = P + 'client/src/';
// PNG berindeks -> potong sel -> PNG berindeks (palet, tRNS, kedalaman bit sama). Lossless.
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const potongan = (tipe, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(tipe, 'latin1'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const baca = (file) => {
  const b = fs.readFileSync(file); let o = 8; const ch = {}; const idat = [];
  while (o < b.length) { const l = b.readUInt32BE(o); const t = b.toString('latin1', o + 4, o + 8); const d = b.subarray(o + 8, o + 8 + l); if (t === 'IDAT') idat.push(d); else ch[t] = d; o += 12 + l; }
  const w = ch.IHDR.readUInt32BE(0); const h = ch.IHDR.readUInt32BE(4); const bit = ch.IHDR[8]; const warna = ch.IHDR[9];
  if (warna !== 3 || ch.IHDR[12] !== 0) throw new Error(file + ': bukan PNG berindeks tanpa interlace');
  const raw = zlib.inflateSync(Buffer.concat(idat)); const bpl = Math.ceil((w * bit) / 8); const px = new Uint8Array(w * h); let prev = Buffer.alloc(bpl);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (bpl + 1)]; const ln = Buffer.from(raw.subarray(y * (bpl + 1) + 1, (y + 1) * (bpl + 1)));
    for (let i = 0; i < bpl; i++) { const a = i >= 1 ? ln[i - 1] : 0; const up = prev[i]; const ul = i >= 1 ? prev[i - 1] : 0;
      let v = ln[i]; if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1; else if (f === 4) { const p = a + up - ul; const pa = Math.abs(p - a); const pb = Math.abs(p - up); const pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      ln[i] = v & 255; }
    for (let x = 0; x < w; x++) px[y * w + x] = bit === 8 ? ln[x] : (ln[(x * bit) >> 3] >> (8 - bit - ((x * bit) & 7))) & ((1 << bit) - 1);
    prev = ln;
  }
  return { w, h, bit, px, PLTE: ch.PLTE, tRNS: ch.tRNS };
};
const tulis = (file, im, x0, y0, w, h) => {
  const bpl = Math.ceil((w * im.bit) / 8); const raw = Buffer.alloc(h * (bpl + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = im.px[(y0 + y) * im.w + x0 + x]; const o = y * (bpl + 1) + 1 + ((x * im.bit) >> 3); raw[o] |= im.bit === 8 ? v : v << (8 - im.bit - ((x * im.bit) & 7)); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = im.bit; ihdr[9] = 3;
  const bagian = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), potongan('IHDR', ihdr), potongan('PLTE', im.PLTE)];
  if (im.tRNS) bagian.push(potongan('tRNS', im.tRNS));
  bagian.push(potongan('IDAT', zlib.deflateSync(raw, { level: 9 })), potongan('IEND', Buffer.alloc(0)));
  fs.writeFileSync(file, Buffer.concat(bagian)); return fs.statSync(file).size;
};
const SUMBER = P + 'character/aktivitas-ep2-pixel-v1/saksi/'; const TUJUAN = R + 'cerita/seni/aktivitas/saksi/';
const kartu = baca(SUMBER + 'kartu-9i.png'); const tombol = baca(SUMBER + 'tombol-9i.png');
const hasil = {};
['biasa', 'tempel', 'bayangan', 'pilih'].forEach((n, i) => { hasil[`kartu-${n}-9i.png`] = tulis(TUJUAN + `kartu-${n}-9i.png`, kartu, i * 18, 0, 18, 18); });
['biasa', 'tekan'].forEach((n, i) => { hasil[`tombol-${n}-9i.png`] = tulis(TUJUAN + `tombol-${n}-9i.png`, tombol, i * 18, 0, 18, 22); });
for (const n of ['kartu-9i.png', 'tombol-9i.png']) if (fs.existsSync(TUJUAN + n)) fs.unlinkSync(TUJUAN + n);
console.log(JSON.stringify(hasil));
