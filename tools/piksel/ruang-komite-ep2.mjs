/**
 * T-025: Ruang Rapat Komite Klaim (ruang piksel `komite-ep2`) -> client. Seni + angka = Designer
 * (character/komite-ep2-pixel-v1: README, ruang-komite.json, komite.json, 5 PNG runtime 9.867 B); berkas ini TIDAK menggambar
 * apa pun, hanya memasang:
 *
 *   node tools/piksel/ruang-komite-ep2.mjs          salin 5 PNG ke client/src/cerita/seni/piksel/ (byte sama) dan gabungkan
 *                                                   entri ruang ke seni/piksel/ruang-ep2.json (ruang lain tidak disentuh)
 *   node tools/piksel/ruang-komite-ep2.mjs --cek    hanya bandingkan (exit 1 bila client belum sama dengan sumber)
 *
 * tools/piksel/bangun-ruang-ep2.mjs memanggil `ruangKomiteEp2()` + `salinPngKomite()` di akhir, jadi membangun ulang manifest
 * ruang tidak menghilangkan ruang ini.
 *
 * Entri client = entri Designer (lapisan, slot, bingkai, fokus) + blok `komite` yang MANDIRI: anggota = sprite hiasan MILIK
 * RUANG (rev 1.1 spec T-025: bukan pemeran), dengan sel atlas + letaknya (dari komite.json), pose, peta keadaan isyarat tata
 * `komite: tunggu | setuju | catatan | kosong`, sel + letak tanda, dan sel ikon 32 px. Kolom keterangan (catatan, peran,
 * kursi, jendela potret 1 : 1) tidak ikut: tidak dipakai panggung.
 * Diperiksa saat dipasang: id anggota sama di kedua manifest, kotak dunia = piksel seni x 4, setiap sel di dalam atlasnya,
 * setiap pose / tanda / id yang dirujuk keadaan ada, ukuran PNG = ukuran yang ditulis manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SUMBER = path.join(ROOT, 'character', 'komite-ep2-pixel-v1');
const KELUAR = path.join(ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
const K = 4;
export const PNG_KOMITE = ['ep2-ruang-komite-latar.png', 'ep2-ruang-komite-meja.png', 'komite.png', 'ep2-komite-tanda.png', 'komite-ikon.png'];
const KEADAAN = ['tunggu', 'setuju', 'catatan', 'kosong'];
const SEL = ['kepala', 'badan', 'kedip', 'tangan'];

const baca = (nama) => JSON.parse(fs.readFileSync(path.join(SUMBER, nama), 'utf8'));
/** Lebar x tinggi PNG dari kepala IHDR. */
const ukuranPng = (berkas) => { const b = fs.readFileSync(berkas); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const harus = (syarat, pesan) => { if (!syarat) throw new Error('ruang komite: ' + pesan); };

/** Entri ruang `komite-ep2` untuk seni/piksel/ruang-ep2.json: { 'komite-ep2': {...} }. Melempar bila sumber tidak konsisten. */
export function ruangKomiteEp2() {
  const ruang = baca('ruang-komite.json')['komite-ep2'];
  const atlas = baca('komite.json');
  harus(ruang && ruang.komite && atlas.piksel === K, 'manifest sumber tidak lengkap');
  const km = ruang.komite;
  harus(km.atlas.gambar === atlas.gambar && km.tanda.gambar === atlas.tanda.gambar, 'nama gambar atlas / tanda berbeda di kedua manifest');
  const [aw, ah] = ukuranPng(path.join(SUMBER, atlas.gambar));
  harus(aw === atlas.ukuranAtlas[0] && ah === atlas.ukuranAtlas[1], `ukuran ${atlas.gambar} ${aw} x ${ah} bukan ${atlas.ukuranAtlas.join(' x ')}`);
  for (const l of ruang.lapisan) {
    const [w, h] = ukuranPng(path.join(SUMBER, l.berkas));
    harus(w === l.pw && h === l.ph && l.w === l.pw * K && l.h === l.ph * K, `lapisan ${l.id}: ukuran PNG / dunia tidak cocok`);
  }
  const [tw, th] = ukuranPng(path.join(SUMBER, km.tanda.gambar));
  const [iw, ih] = ukuranPng(path.join(SUMBER, atlas.potret.gambarIkon));
  const anggota = km.anggota.map((a) => {
    const m = atlas.anggota[a.id];
    harus(m, `anggota ${a.id} tidak ada di komite.json`);
    harus(a.bingkai.x === m.bingkai.x * K && a.bingkai.y === m.bingkai.y * K && a.bingkai.w === m.bingkai.w * K && a.bingkai.h === m.bingkai.h * K, `anggota ${a.id}: bingkai dunia bukan piksel seni x ${K}`);
    for (const s of SEL) {
      const [x, y, w, h] = m.sel[s];
      harus(x >= 0 && y >= 0 && x + w <= aw && y + h <= ah, `anggota ${a.id}: sel ${s} di luar atlas`);
      harus(Array.isArray(m.letak[s]) && m.letak[s].length === 2, `anggota ${a.id}: letak ${s}`);
    }
    return { id: a.id, bingkai: a.bingkai, sel: Object.fromEntries(SEL.map((s) => [s, m.sel[s]])), letak: Object.fromEntries(SEL.map((s) => [s, m.letak[s]])) };
  });
  harus(Object.keys(atlas.anggota).length === anggota.length, 'jumlah anggota berbeda di kedua manifest');
  const id = anggota.map((a) => a.id);
  const pose = Object.fromEntries(km.pose.map((p) => {
    const d = atlas.pose[p];
    harus(d && d.lapis.every((s) => SEL.includes(s)), `pose ${p}`);
    return [p, { lapis: d.lapis, ...(d.ms ? { ms: d.ms } : {}), ...(d.bingkai ? { bingkai: d.bingkai, ulang: d.ulang ?? 1 } : {}) }];
  }));
  const selTanda = km.tanda.sel;
  for (const [n, [x, y, w, h]] of Object.entries(selTanda)) harus(x + w <= tw && y + h <= th && km.tanda.w === w * K && km.tanda.h === h * K, `sel tanda ${n}`);
  for (const a of id) harus(km.tanda.letak[a] && km.tanda.letak[a].x === atlas.tanda.letak[a][0] * K && km.tanda.letak[a].y === atlas.tanda.letak[a][1] * K, `letak tanda ${a}`);
  harus(JSON.stringify(Object.keys(km.keadaan).sort()) === JSON.stringify([...KEADAAN].sort()), 'keadaan bukan tunggu / setuju / catatan / kosong');
  const keadaan = Object.fromEntries(KEADAAN.map((k) => {
    const s = km.keadaan[k];
    for (const [a, p] of Object.entries(s.pose)) harus(id.includes(a) && pose[p], `keadaan ${k}: pose ${a} = ${p}`);
    for (const [a, t] of Object.entries(s.tanda)) harus(id.includes(a) && selTanda[t], `keadaan ${k}: tanda ${a} = ${t}`);
    const urutan = s.urutan ?? [];
    harus(JSON.stringify([...urutan].sort()) === JSON.stringify(Object.keys(s.tanda).sort()), `keadaan ${k}: urutan tanda`);
    return [k, { pose: s.pose, tanda: s.tanda, ...(urutan.length ? { urutan, jedaMs: s.jedaMs } : {}), ...(s.kedip ? { kedip: true } : {}) }];
  }));
  const ikon = Object.fromEntries(id.map((a) => {
    const [x, y, w, h] = atlas.potret[a].ikon;
    harus(x + w <= iw && y + h <= ih, `ikon ${a} di luar gambar`);
    return [a, [x, y, w, h]];
  }));
  return {
    'komite-ep2': {
      warnaTepi: ruang.warnaTepi,
      lapisan: ruang.lapisan,
      tempat: ruang.tempat,
      slot: ruang.slot,
      prop: ruang.prop,
      bingkai: ruang.bingkai,
      fokus: ruang.fokus,
      komite: {
        atlas: km.atlas.gambar, z: km.z, zTanda: km.zTanda, anggota, pose, keadaan,
        tanda: { gambar: km.tanda.gambar, sel: selTanda, w: km.tanda.w, h: km.tanda.h, letak: km.tanda.letak },
        ikon: { gambar: atlas.potret.gambarIkon, sel: ikon },
      },
    },
  };
}

/** Salin PNG runtime ke `keluar` (byte sama). `cek` = hanya bandingkan. Mengembalikan [nama, byte, sama?]. */
export function salinPngKomite(keluar = KELUAR, cek = false) {
  return PNG_KOMITE.map((nama) => {
    const isi = fs.readFileSync(path.join(SUMBER, nama));
    const tujuan = path.join(keluar, nama);
    const sama = fs.existsSync(tujuan) && fs.readFileSync(tujuan).equals(isi);
    if (!sama && !cek) fs.writeFileSync(tujuan, isi);
    return [nama, isi.length, sama];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cek = process.argv.includes('--cek');
  const png = salinPngKomite(KELUAR, cek);
  const berkas = path.join(KELUAR, 'ruang-ep2.json');
  const manifest = JSON.parse(fs.readFileSync(berkas, 'utf8'));
  const entri = ruangKomiteEp2();
  const samaEntri = JSON.stringify(manifest.lokasi['komite-ep2'] ?? null) === JSON.stringify(entri['komite-ep2']);
  if (!samaEntri && !cek) {
    Object.assign(manifest.lokasi, entri);
    // Format sama dengan bangun-ruang-ep2.mjs (indent 1 + baris baru di akhir).
    fs.writeFileSync(berkas, JSON.stringify(manifest, null, 1) + '\n');
  }
  const total = png.reduce((n, x) => n + x[1], 0);
  console.log(JSON.stringify({ png: png.map(([n, b, s]) => `${n} ${b} B${s ? '' : cek ? ' (BEDA)' : ' (disalin)'}`), totalByte: total, entri: samaEntri ? 'sama' : cek ? 'BEDA' : 'digabung', byteEntri: JSON.stringify(entri).length }));
  if (cek && (!samaEntri || png.some((x) => !x[2]))) process.exit(1);
}
