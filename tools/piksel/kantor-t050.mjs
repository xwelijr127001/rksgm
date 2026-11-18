/**
 * T-050 item 3: Part 1 service desk additions -> client. Art + numbers = Designer (character/kantor-ep2-pixel-v1/t050:
 * bangun.mjs, kantor-t050.json, 3 PNG). This file draws nothing; it only installs:
 *
 *   node tools/piksel/kantor-t050.mjs          copy the 3 PNG to client/src/cerita/seni/piksel/ (same bytes) and merge the two
 *                                              layers (`tanda-sogok` z 12, `monitor` z 31) + `aksesori.missRaksa` (headset on
 *                                              frame berdiri-kanan) into the `kantor-ep2` entry of seni/piksel/ruang-ep2.json
 *   node tools/piksel/kantor-t050.mjs --cek    compare only (exit 1 when the client differs from the source)
 *
 * tools/piksel/bangun-ruang-ep2.mjs calls `tambahKantorT050()` + `salinPngKantorT050()`, so rebuilding the room manifest keeps them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SUMBER = path.join(ROOT, 'character', 'kantor-ep2-pixel-v1', 't050');
const KELUAR = path.join(ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const K = 4;
export const PNG_KANTOR_T050 = ['ep2-kantor-tanda-sogok.png', 'ep2-kantor-monitor.png', 'ep2-kantor-headset.png'];

const ukuranPng = (berkas) => { const b = fs.readFileSync(berkas); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const harus = (syarat, pesan) => { if (!syarat) throw new Error('kantor T-050: ' + pesan); };

/** Adds the T-050 layers and the headset accessory to a `kantor-ep2` room entry (in place; idempotent). Returns the entry. */
export function tambahKantorT050(entri) {
  const m = JSON.parse(fs.readFileSync(path.join(SUMBER, 'kantor-t050.json'), 'utf8'));
  for (const l of m.lapisan) {
    const [w, h] = ukuranPng(path.join(SUMBER, l.berkas));
    harus(w === l.pw && h === l.ph && l.w === l.pw * K && l.h === l.ph * K, `lapisan ${l.id}: ukuran PNG / dunia tidak cocok`);
  }
  for (const [id, a] of Object.entries(m.aksesori)) { const [w, h] = ukuranPng(path.join(SUMBER, a.berkas)); harus(w === a.pw && h === a.ph, `aksesori ${id}: ukuran PNG`); }
  const ids = new Set(m.lapisan.map((l) => l.id));
  entri.lapisan = [...entri.lapisan.filter((l) => !ids.has(l.id)), ...m.lapisan].sort((a, b) => a.z - b.z);
  entri.aksesori = { ...(entri.aksesori ?? {}), ...m.aksesori };
  return entri;
}

/** Copy the runtime PNGs to `keluar` (same bytes). `cek` = compare only. Returns [name, bytes, same?]. */
export function salinPngKantorT050(keluar = KELUAR, cek = false) {
  return PNG_KANTOR_T050.map((nama) => {
    const isi = fs.readFileSync(path.join(SUMBER, nama));
    const tujuan = path.join(keluar, nama);
    const sama = fs.existsSync(tujuan) && fs.readFileSync(tujuan).equals(isi);
    if (!sama && !cek) fs.writeFileSync(tujuan, isi);
    return [nama, isi.length, sama];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cek = process.argv.includes('--cek');
  const png = salinPngKantorT050(KELUAR, cek);
  const berkas = path.join(KELUAR, 'ruang-ep2.json');
  const manifest = JSON.parse(fs.readFileSync(berkas, 'utf8'));
  const lama = JSON.stringify(manifest.lokasi['kantor-ep2']);
  tambahKantorT050(manifest.lokasi['kantor-ep2']);
  const sama = lama === JSON.stringify(manifest.lokasi['kantor-ep2']);
  if (!sama && !cek) fs.writeFileSync(berkas, JSON.stringify(manifest, null, 1) + '\n');
  console.log(JSON.stringify({ png: png.map(([n, b, s]) => `${n} ${b} B${s ? '' : cek ? ' (BEDA)' : ' (disalin)'}`), entri: sama ? 'sama' : cek ? 'BEDA' : 'digabung' }));
  if (cek && (!sama || png.some((x) => !x[2]))) process.exit(1);
}
