/**
 * PEMERIKSAAN BUNDEL (PRD FR-C7, brief §8): build client produksi tidak boleh memuat isi skenario (teks pilihan,
 * konsekuensi, alasan) atau kunci jawaban. Skenario hanya ada di database dan dikirim server per peserta.
 *   npm run build && node tools/uji-bundel-kunci.mjs [client/dist]
 * Sampel teks diambil dari seed demo server (bukan dari bundel), lalu dicari di semua berkas JS/CSS/HTML hasil build.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] || 'client/dist');
const seeds = ['server/src/story/seed/demoBaret.ts', 'server/src/story/seed/demoBanjir.ts'].map((f) => fs.readFileSync(f, 'utf8'));
// Long quoted Indonesian sentences from the seeds (choice texts, consequences, reasons, endings).
const samples = [...new Set(seeds.flatMap((s) => [...s.matchAll(/'([^'\\]{60,})'/g)].map((m) => m[1])))];
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|css|html|json)$/.test(e.name)) files.push(p);
  }
})(DIST);
const bundle = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const leaked = samples.filter((s) => bundle.includes(s));
const seedMarkers = ['demoBaretContent', 'demoBanjirContent', 'buildDemo('].filter((m) => bundle.includes(m));
console.log(`berkas diperiksa: ${files.length}; sampel teks skenario: ${samples.length}`);
console.log(`teks skenario di bundel: ${leaked.length}${leaked.length ? ' — ' + leaked.slice(0, 3).join(' | ') : ''}`);
console.log(`kode seed demo di bundel: ${seedMarkers.length ? seedMarkers.join(', ') : 'tidak ada'}`);
process.exitCode = leaked.length || seedMarkers.length || samples.length < 50 ? 1 : 0;
