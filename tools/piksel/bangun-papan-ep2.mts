/**
 * D-102 (T-016): teks papan nama kantor sebagai PNG TRANSPARAN seukuran latar kantor (400 x 225 piksel seni), untuk latar
 * aktivitas (hp.css .hp-panggung-benda): ditumpuk di atas ep2-ruang-kantor-latar.png dengan ukuran & posisi background yang
 * sama, jadi teks jatuh persis di papan seperti di panggung (PanggungPiksel: huruf piksel, kotak & warna dari ruang-ep2.json).
 * Teks = merek (teks.id 'lokasi.kantor'), sama di id/en/zh.
 *   npx tsx --tsconfig client/tsconfig.json tools/piksel/bangun-papan-ep2.mts
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { titikTeks } from '../../client/src/cerita/ui/latar/piksel/hurufPiksel';
import { TEKS_PAPAN_KANTOR, titikPapanKantor } from '../../client/src/cerita/ui/latar/piksel/papan';

const dir = path.resolve(import.meta.dirname, '../../client/src/cerita/seni/piksel');
const m = JSON.parse(fs.readFileSync(path.join(dir, 'ruang-ep2.json'), 'utf8'));
const papan = m.lokasi['kantor-ep2'].papan;
const { titik } = titikPapanKantor(papan.kotak, m.piksel, titikTeks)!;
const png = new PNG({ width: m.dunia.pw, height: m.dunia.ph });
const [r, g, b] = [1, 3, 5].map((i) => parseInt(papan.warna.slice(i, i + 2), 16));
for (const [x, y] of titik) { const i = (y * png.width + x) * 4; png.data[i] = r!; png.data[i + 1] = g!; png.data[i + 2] = b!; png.data[i + 3] = 255; }
const out = path.join(dir, 'ep2-papan-kantor.png');
fs.writeFileSync(out, PNG.sync.write(png, { colorType: 6, deflateLevel: 9 }));
console.log(TEKS_PAPAN_KANTOR, titik.length, 'titik ->', out, fs.statSync(out).size, 'B');
