#!/usr/bin/env node
/**
 * T-038 Fix 1: release artifact check. A production client build must not contain the audio test hook
 * (?uji-audio, __sfxLog, __rekamSfx); those exist only in dev or a VITE_UJI_AUDIO=on test build.
 *
 *   node tools/cek-rilis.mjs [folder build]      (default: client/dist)
 *
 * Exit code: 0 clean, 1 forbidden string found, 2 folder missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] ?? path.join(ROOT, 'client', 'dist'));
const TERLARANG = ['uji-audio', '__sfxLog', '__rekamSfx'];
const TEKS = /\.(js|mjs|css|html|json|map|txt|svg)$/i;

if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error(`cek-rilis: ${dir} bukan folder build (index.html tidak ada)`);
  process.exit(2);
}

const temuan = [];
let diperiksa = 0;
const jelajah = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) jelajah(p);
    else if (TEKS.test(e.name)) {
      diperiksa++;
      const isi = fs.readFileSync(p, 'utf8');
      for (const t of TERLARANG) if (isi.includes(t)) temuan.push(`${path.relative(dir, p)}: ${t}`);
    }
  }
};
jelajah(dir);

console.log(`cek-rilis: ${diperiksa} berkas teks di ${dir}`);
if (temuan.length) {
  for (const t of temuan) console.log(`GAGAL  ${t}`);
  process.exit(1);
}
console.log(`LULUS  tidak ada ${TERLARANG.join(' / ')}`);
