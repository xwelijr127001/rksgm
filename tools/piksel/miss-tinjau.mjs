/**
 * Miss Raksa — lembar tinjau & pemeriksaan, disusun ulang HANYA dari atlas + manifest (client/src/cerita/seni/piksel/
 * miss-raksa.png/.json), ditambah lapisan ruang (ruang.json) dan atlas Bu Rina untuk pembanding.
 *
 *   node tools/piksel/miss-tinjau.mjs <folder-keluaran>
 *
 * Lembar:
 *  01-pose-ekspresi-4x-<arah>.png   tiap frame x 5 ekspresi (4 px/px seni)
 *  02-ruang-<skala>x-<momen>.png    frame di ruang piksel pada titik tempat nyata (4x & 2x) + Bu Rina skala sama
 *  03-tangan-4x.png / 03b-tangan-nyata.png   close-up tangan sambut/dengar/jelaskan/tunjuk/telepon (4x & ukuran nyata)
 *  04-varian-diff-<arah>.png        dasar/kedip/bawah/bicara per ekspresi + beda (magenta) vs netral
 *  05-kiri-kanan.png                kiri vs kanan berdampingan (lencana, belahan, tangan penunjuk)
 *  06-potret-nyata.png              potret 32/44/52/64/96 + dekat (ukuran tampil nyata)
 *  07-ruang-*.png                   semua frame x ekspresi di ruang (titik tempat nyata)
 *  08-duduk-turun.png               berdiri-persilakan -> duduk-turun -> duduk-dengar di ruang (2x, 3x, tumpang)
 *  laporan-tinjau.json              pemeriksaan angka (warna, alpha, piksel berubah di luar kotak, dll.)
 */
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';

const P = path.join(L.ROOT, 'client', 'src', 'cerita', 'seni', 'piksel');
export const MAN = () => JSON.parse(fs.readFileSync(path.join(P, 'miss-raksa.json'), 'utf8'));
export const ATLAS = () => L.baca(path.join(P, 'miss-raksa.png'));

/** Gambar satu frame + ekspresi + varian ('dasar'|'kedip'|'bawah'|'bicara'|'kedip+bicara'|'bawah+bicara') dari atlas. */
export function gambar(man, atlas, id, e = 'netral', v = 'dasar') {
  const f = man.frame[id];
  const o = L.potong(atlas, ...f.rect);
  const tempel = (r, k) => { if (!r) return; L.tempel(o, L.potong(atlas, ...r), k[0], k[1]); };
  const x = f.ekspresi[e];
  tempel(x.dasar, f.wajah.kotak);
  if (v.includes('kedip')) tempel(x.kedip, f.wajah.mata);
  if (v.includes('bawah')) tempel(x.bawah, f.wajah.mata);
  if (v.includes('bicara')) tempel(x.bicara, f.wajah.mulut);
  return o;
}

/* ------------------------------------------------------------------ ruang */
const RJ = () => JSON.parse(fs.readFileSync(path.join(P, 'ruang.json'), 'utf8'));
const BRJ = () => JSON.parse(fs.readFileSync(path.join(P, 'bu-rina.json'), 'utf8'));

/**
 * Titik kaki (px seni) bingkai antara `duduk-turun-<arah>`: y = lantai tempat.mentorBerdiri; x sehingga kepala tepat di
 * tengah kepala `berdiri-persilakan-<arah>` (di mentorBerdiri) & `duduk-dengar-<arah>` (di mentor), dijepit di antara
 * x kedua titik (aturan bingkaiTurun Bu Rina di panggung).
 */
export function titikTurun(man, t, id) {
  const arah = man.frame[id].hadap; const f = man.frame[id];
  const b = man.frame[`berdiri-persilakan-${arah}`], d = man.frame[`duduk-dengar-${arah}`];
  const kb = t.mentorBerdiri.x / 4 - b.jangkar.x + b.kepala.x, kd = t.mentor.x / 4 - d.jangkar.x + d.kepala.x;
  const x = Math.min(Math.max(t.mentorBerdiri.x, t.mentor.x) / 4, Math.max(Math.min(t.mentorBerdiri.x, t.mentor.x) / 4, (kb + kd) / 2 - f.kepala.x + f.jangkar.x));
  return { x: Math.round(x), y: t.mentorBerdiri.y / 4 };
}

/**
 * Susun adegan di ruang (400 x 225 px seni): latar -> [Miss duduk & berdiri: DI BALIK meja seperti panggung] ->
 * belakangMeja -> prop -> [Miss diAtasMeja] -> depanMeja -> kursiBelakang -> Bu Rina. Titik = ruang.json tempat
 * (duduk-turun: titikTurun).
 */
export function adegan({ man, atlas, lok = 'meja', miss, e = 'netral', v = 'dasar', rina = 'duduk', kartu = false, kunci = false }) {
  const R = RJ(); const L0 = R.lokasi[lok]; const t = L0.tempat;
  const c = L.buat(400, 225, [0, 0, 0, 255]);
  const lap = (id) => { const l = L0.lapisan.find((q) => q.id === id); if (l) L.tempel(c, L.baca(path.join(P, l.berkas)), l.x / 4, l.y / 4); };
  for (const id of ['latar', 'koridor', 'daun']) lap(id);
  let mImg = null, mPos = null, f = null;
  if (miss) {
    f = man.frame[miss]; mImg = gambar(man, atlas, miss, e, v);
    const k = miss.startsWith('duduk-turun') ? titikTurun(man, t, miss) : null;
    const titik = f.jenisJangkar === 'pinggul' ? { x: t.mentor.x / 4, y: t.mentor.y / 4 } : k ?? { x: t.mentorBerdiri.x / 4, y: t.mentorBerdiri.y / 4 };
    mPos = { x: Math.round(titik.x - f.jangkar.x), y: Math.round(titik.y - f.jangkar.y) };
    // panggung: Miss berdiri (Z.belakang) & duduk sama-sama di balik meja; hanya diAtasMeja digambar lagi di depan
    L.tempel(c, mImg, mPos.x, mPos.y);
  }
  lap('belakangMeja');
  const prop = (nm, titik) => { const p = R.prop[nm]; L.tempel(c, L.baca(path.join(P, p.berkas)), Math.round(titik.x / 4 - p.jangkar.x / 4), Math.round(titik.y / 4 - p.jangkar.y / 4)); };
  if (L0.lapisan.find((q) => q.id === 'belakangMeja')) {
    if (kartu) prop('kartu', t.kartuMeja);
    if (kunci) prop('kunci', t.kunciMeja);
    prop(miss && miss.startsWith('telepon') ? 'teleponTanpaGagang' : 'telepon', t.telepon);
  }
  if (mImg && f.jenisJangkar === 'pinggul') for (const [x, y, w, h] of f.diAtasMeja || []) L.tempel(c, L.potong(mImg, x, y, w, h), mPos.x + x, mPos.y + y);
  lap('depanMeja');
  lap('kursiBelakang');
  if (rina) {
    const BR = BRJ(); const BA = L.baca(path.join(P, 'bu-rina.png')); const fr = BR.frame[rina];
    const tt = fr.jenisJangkar === 'pinggul' ? t.nasabahDuduk : t.nasabahBerdiri;
    L.tempel(c, L.potong(BA, ...fr.rect), Math.round(tt.x / 4 - fr.jangkar.x), Math.round(tt.y / 4 - fr.jangkar.y));
  }
  return c;
}

/* ------------------------------------------------------------------ pemeriksaan */

export function periksa(man, atlas) {
  const lap = { warnaAtlas: L.hitungWarna(atlas).size, alphaBukanBiner: 0, diLuarPalet: 0, diLuarKotak: {}, varianDiLuarKotak: {}, ekspresiDiLuarKotakWajah: 0, ukuranLapisanSalah: [] };
  const pal = new Set(man.palet);
  for (let i = 0; i < atlas.d.length; i += 4) { const a = atlas.d[i + 3]; if (a !== 0 && a !== 255) lap.alphaBukanBiner++; if (a === 255 && !pal.has(L.hex([atlas.d[i], atlas.d[i + 1], atlas.d[i + 2]]))) lap.diLuarPalet++; }
  const dalam = (x, y, k) => x >= k[0] && y >= k[1] && x < k[0] + k[2] && y < k[1] + k[3];
  let maksDiLuar = 0, maksVarian = 0;
  for (const [id, f] of Object.entries(man.frame)) {
    for (const e of man.ekspresi) {
      const x = f.ekspresi[e];
      for (const [r, k] of [[x.dasar, f.wajah.kotak], [x.kedip, f.wajah.mata], [x.bawah, f.wajah.mata], [x.bicara, f.wajah.mulut]]) if (r[2] !== k[2] || r[3] !== k[3]) lap.ukuranLapisanSalah.push(id + ':' + e);
    }
    const netral = gambar(man, atlas, id, 'netral', 'dasar');
    const tubuh = L.potong(atlas, ...f.rect);
    // netral dasar = tubuh apa adanya
    const bn = M.selisih(tubuh, netral).length; if (bn) lap.diLuarKotak[id + ':netralVsTubuh'] = bn;
    for (const e of man.ekspresi) {
      const d = gambar(man, atlas, id, e, 'dasar');
      for (const [x, y] of M.selisih(netral, d)) if (!dalam(x, y, f.wajah.kotak)) lap.ekspresiDiLuarKotakWajah++;
      for (const v of ['kedip', 'bawah', 'bicara', 'kedip+bicara', 'bawah+bicara']) {
        const g = gambar(man, atlas, id, e, v);
        let n = 0; for (const [x, y] of M.selisih(d, g)) if (!dalam(x, y, f.wajah.mata) && !dalam(x, y, f.wajah.mulut)) n++;
        if (n) lap.varianDiLuarKotak[`${id}:${e}:${v}`] = n;
        maksVarian = Math.max(maksVarian, n);
      }
    }
  }
  lap.maksVarianDiLuarKotak = maksVarian;
  lap.garisMejaDiTubuh = garisMejaDiTubuh(man, atlas);
  return lap;
}

/**
 * Garis tepi jauh meja (belakangMeja, #3a2620, y seni garisMejaMentor/4 - 1) yang masih tergambar di atas piksel tokoh
 * yang BERSAMBUNG melintasi tepi (buram di baris garis & baris bawahnya), per frame duduk: "n/total". Sisa n = kolom
 * torso di samping lengan yang sengaja tetap di balik tepi (di bawahnya garis luar gelap lengan), bukan lengan.
 */
export function garisMejaDiTubuh(man, atlas) {
  const t = RJ().lokasi.meja.tempat; const o = {};
  for (const [id, f] of Object.entries(man.frame)) {
    if (f.jenisJangkar !== 'pinggul' || !(f.diAtasMeja || []).length) continue;
    const c = adegan({ man, atlas, miss: id, rina: null }); const g = gambar(man, atlas, id);
    const px = Math.round(t.mentor.x / 4 - f.jangkar.x), py = Math.round(t.mentor.y / 4 - f.jangkar.y);
    const yG = t.garisMejaMentor / 4 - 1, fy = yG - py; let n = 0, tot = 0;
    for (let fx = 0; fx < g.w; fx++) {
      if (!M.buramXY(g, fx, fy) || !M.buramXY(g, fx, fy + 1)) continue;
      tot++; if (L.hex(M.warna(c, px + fx, yG)) === '#3a2620' && L.hex(M.warna(g, fx, fy)) !== '#3a2620') n++;
    }
    o[id] = `${n}/${tot}`;
  }
  return o;
}

/** Potret dari jendela manifest (potret.jendela[n] / potret.dekat[n]) -> gambar ukuran tampil (skala bulat). */
export function potret(man, atlas, e, j, v = 'dasar') {
  const g = gambar(man, atlas, j.frame, e, v);
  return L.perbesar(L.potong(g, j.x, j.y, j.sisi, j.sisi), j.skala);
}
const lingkaran = (img, bg) => { const o = L.datarkan(img, bg); const r = img.w / 2; for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if ((x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 > r * r) M.setel(o, x, y, [200, 200, 200]); return o; };

/** Posisi kanvas kanonik pojok kiri-atas frame (dari jangkar kanonik tersimpan di manifest.kanvas). */
function trimDari(f) { return f.kanvas || { x: 0, y: 0 }; }

/* ------------------------------------------------------------------ utilitas lembar */
const HIJAU = [72, 160, 96];
const datar = (img, bg = HIJAU) => L.datarkan(img, bg);
const beda = (a, b) => { const o = L.datarkan(b, [255, 255, 255]); for (const [x, y] of M.selisih(a, b)) M.setel(o, x, y, [255, 0, 255]); return o; };

export function lembar(out, svgPng = null) {
  fs.mkdirSync(out, { recursive: true });
  const man = MAN(), atlas = ATLAS();
  const ids = Object.keys(man.frame);
  const lapor = periksa(man, atlas);
  // 01 pose x ekspresi (4x) per arah
  for (const arah of ['kiri', 'kanan']) {
    const baris = ids.filter((id) => man.frame[id].hadap === arah).map((id) => L.susun(man.ekspresi.map((e) => { const g = gambar(man, atlas, id, e); return { img: L.perbesar(datar(g), 4), label: `${id} ${e}` }; }), { kLabel: 2 }));
    L.tulis(path.join(out, `01-pose-ekspresi-4x-${arah}.png`), L.tumpuk(baris));
  }
  // 04 varian + beda per arah (frame duduk-dengar & berdiri), 6x kepala
  for (const arah of ['kiri', 'kanan']) {
    const id = `duduk-dengar-${arah}`; const f = man.frame[id]; const k = f.wajah.kotak;
    const pot = (g) => L.potong(g, k[0] - 6, k[1] - 6, k[2] + 12, k[3] + 12);
    const baris = man.ekspresi.map((e) => {
      const dasar = gambar(man, atlas, id, e);
      const it = [];
      for (const v of ['dasar', 'kedip', 'bawah', 'bicara', 'kedip+bicara']) { const g = gambar(man, atlas, id, e, v); it.push({ img: L.perbesar(datar(pot(g)), 6), label: `${e} ${v}` }); if (v !== 'dasar') it.push({ img: L.perbesar(pot(beda(dasar, g)), 6), label: 'beda' }); }
      it.push({ img: L.perbesar(pot(beda(gambar(man, atlas, id, 'netral'), dasar)), 6), label: 'vs netral' });
      return L.susun(it, { kLabel: 1 });
    });
    L.tulis(path.join(out, `04-varian-diff-${arah}.png`), L.tumpuk(baris));
  }
  // 02 di ruang piksel pada titik tempat nyata, bersama Bu Rina (atlasnya sendiri), skala 4x & 2x
  const momen = [
    { nama: 'sambut-kiri', miss: 'berdiri-sambut-kiri', rina: null, e: 'senyum' },
    { nama: 'persilakan-kanan', miss: 'berdiri-persilakan-kanan', rina: 'berdiri', e: 'senyum' },
    { nama: 'berdiri-kiri', miss: 'berdiri-kiri', rina: 'berdiri', e: 'netral' },
    { nama: 'dengar-kanan', miss: 'duduk-dengar-kanan', rina: 'duduk', e: 'netral' },
    { nama: 'dengar-kiri', miss: 'duduk-dengar-kiri', rina: 'duduk', e: 'prihatin' },
    { nama: 'jelaskan-kanan', miss: 'duduk-jelaskan-kanan', rina: 'duduk', e: 'serius', v: 'bicara' },
    { nama: 'jelaskan-kiri', miss: 'duduk-jelaskan-kiri', rina: 'duduk', e: 'senyum', v: 'bicara' },
    { nama: 'tunjuk-kanan', miss: 'duduk-tunjuk-kanan', rina: 'duduk', e: 'netral', v: 'bawah', kartu: true },
    { nama: 'tunjuk-kiri', miss: 'duduk-tunjuk-kiri', rina: 'duduk', e: 'senyum', v: 'bawah', kartu: true },
    { nama: 'lega-kanan', miss: 'duduk-dengar-kanan', rina: 'dada', e: 'lega' },
    { nama: 'telepon-kiri', miss: 'telepon-kiri', rina: null, e: 'netral', v: 'bicara', lok: 'telepon' },
    { nama: 'telepon-kanan', miss: 'telepon-kanan', rina: null, e: 'serius', lok: 'telepon' },
  ];
  const kecil = [];
  for (const m of momen) {
    const c = adegan({ man, atlas, lok: m.lok || 'meja', miss: m.miss, e: m.e, v: m.v || 'dasar', rina: m.rina, kartu: m.kartu, kunci: !!m.rina && m.rina !== 'berdiri' });
    L.tulis(path.join(out, `02-ruang-4x-${m.nama}.png`), L.perbesar(L.potong(c, 100, 40, 220, 185), 4));
    kecil.push({ img: L.perbesar(c, 2), label: m.nama });
  }
  L.tulis(path.join(out, '02-ruang-2x-semua.png'), L.tumpuk([L.susun(kecil.slice(0, 3)), L.susun(kecil.slice(3, 6)), L.susun(kecil.slice(6, 9)), L.susun(kecil.slice(9))]));
  // 03 tangan: 4x dan ukuran nyata (1x, 2x, 3x)
  const tangan = [
    ['berdiri-sambut-kiri', [34, 58, 52, 40]], ['berdiri-sambut-kanan', [34, 58, 52, 40]],
    ['duduk-dengar-kiri', [22, 80, 76, 28]], ['duduk-dengar-kanan', [22, 80, 76, 28]],
    ['duduk-jelaskan-kiri', [8, 60, 90, 46]], ['duduk-jelaskan-kanan', [22, 60, 90, 46]],
    ['duduk-tunjuk-kiri', [58, 78, 50, 40]], ['duduk-tunjuk-kanan', [62, 78, 50, 40]], // v5 tangan: lengan 'L' s.d. x 101/105, telunjuk y 113
    ['telepon-kiri', [40, 24, 50, 70]], ['telepon-kanan', [30, 24, 50, 70]],
    ['berdiri-persilakan-kanan', [40, 56, 70, 50]], ['duduk-turun-kanan', [22, 70, 76, 38]],
  ].filter(([id]) => man.frame[id]);
  const b03 = [], b03n = [];
  for (const [id, [x, y, w, h]] of tangan) {
    // kotak di kanvas kanonik bersama -> koordinat frame lewat frame.kanvas (pojok trim di kanvas)
    const f = man.frame[id]; const g = gambar(man, atlas, id);
    const tr = trimDari(f);
    const pot = L.potong(g, x - tr.x, y - tr.y, w, h);
    b03.push({ img: L.perbesar(datar(pot), 4), label: id });
    b03n.push({ img: L.susun([1, 2, 3].map((k) => ({ img: L.perbesar(datar(pot, [230, 200, 140]), k), label: 'x' + k })), { kLabel: 1, jarak: 4 }), label: id });
  }
  L.tulis(path.join(out, '03-tangan-4x.png'), L.tumpuk([L.susun(b03.slice(0, 4)), L.susun(b03.slice(4, 8)), L.susun(b03.slice(8))]));
  L.tulis(path.join(out, '03b-tangan-nyata.png'), L.tumpuk(b03n.map((b) => b.img)));
  // 05 kiri vs kanan
  const pasang = ['berdiri', 'berdiri-sambut', 'berdiri-persilakan', 'duduk-turun', 'duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'telepon'].filter((p) => man.pose[p]);
  L.tulis(path.join(out, '05-kiri-kanan-3x.png'), L.tumpuk([L.susun(pasang.slice(0, 4).flatMap((p) => ['kiri', 'kanan'].map((a) => ({ img: L.perbesar(datar(gambar(man, atlas, `${p}-${a}`)), 3), label: `${p} ${a}` })))), L.susun(pasang.slice(4).flatMap((p) => ['kiri', 'kanan'].map((a) => ({ img: L.perbesar(datar(gambar(man, atlas, `${p}-${a}`)), 3), label: `${p} ${a}` }))))]));
  // 07 SEMUA frame x ekspresi di ruang (titik tempat nyata) bersama Bu Rina: 2x (satu lembar) & 4x (satu berkas per frame)
  const strip2 = [];
  for (const id of ids) {
    const f = man.frame[id]; const duduk = f.jenisJangkar === 'pinggul';
    const lok = id.startsWith('telepon') ? 'telepon' : 'meja';
    const rina = lok === 'telepon' ? null : duduk || id.startsWith('duduk-turun') ? 'duduk' : 'berdiri';
    const v = id.includes('tunjuk') ? 'bawah' : 'dasar';
    const it2 = [], it4 = [];
    for (const e of man.ekspresi) {
      const c = adegan({ man, atlas, lok, miss: id, e, v, rina, kartu: id.includes('tunjuk'), kunci: duduk && lok === 'meja' });
      it2.push({ img: L.perbesar(L.potong(c, 104, 30, 196, 160), 2), label: `${id} ${e}` });
      it4.push({ img: L.perbesar(L.potong(c, 118, duduk ? 64 : 36, 100, duduk ? 124 : 190), 4), label: `${id} ${e}` });
    }
    strip2.push(L.susun(it2, { kLabel: 1 }));
    L.tulis(path.join(out, `07-ruang-4x-${id}.png`), L.susun(it4, { kLabel: 2 }));
  }
  L.tulis(path.join(out, '07-ruang-2x-semua.png'), L.tumpuk(strip2));
  // 08 duduk-turun: berdiri-persilakan -> duduk-turun -> duduk-dengar (arah sama) di ruang, ukuran nyata 2x & 3x, + tumpang
  // (bingkai antara di atas dua ujungnya, 50%) untuk melihat kepala turun dua langkah
  if (man.pose['duduk-turun']) {
    const b08 = [];
    for (const arah of ['kanan', 'kiri']) {
      const urut = [`berdiri-persilakan-${arah}`, `duduk-turun-${arah}`, `duduk-dengar-${arah}`];
      const cs = urut.map((id) => adegan({ man, atlas, miss: id, e: 'senyum', rina: 'duduk' }));
      const pot = (c) => L.potong(c, 110, 40, 110, 150);
      b08.push(L.susun(cs.map((c, i) => ({ img: L.perbesar(pot(c), 2), label: urut[i] + ' 2x' })), { kLabel: 1 }));
      b08.push(L.susun(cs.map((c, i) => ({ img: L.perbesar(pot(c), 3), label: urut[i] + ' 3x' })), { kLabel: 1 }));
      const camp = L.salin(pot(cs[0])); const a = pot(cs[1]), z = pot(cs[2]);
      for (let i = 0; i < camp.d.length; i += 4) for (let k = 0; k < 3; k++) camp.d[i + k] = Math.round((camp.d[i + k] + 2 * a.d[i + k] + z.d[i + k]) / 4);
      b08.push(L.susun([{ img: L.perbesar(camp, 3), label: `tumpang ${arah}: berdiri 25% + antara 50% + duduk 25%` }], { kLabel: 1 }));
    }
    L.tulis(path.join(out, '08-duduk-turun.png'), L.tumpuk(b08));
    lapor.dudukTurun = Object.fromEntries(['kanan', 'kiri'].map((arah) => {
      const t = RJ().lokasi.meja.tempat; const id = `duduk-turun-${arah}`; const f = man.frame[id]; const k = titikTurun(man, t, id);
      const b = man.frame[`berdiri-persilakan-${arah}`], d = man.frame[`duduk-dengar-${arah}`];
      const kepala = (fr, tx, ty) => ({ x: tx - fr.jangkar.x + fr.kepala.x, y: ty - fr.jangkar.y + fr.kepala.y });
      return [arah, { kaki: k, kepalaBerdiri: kepala(b, t.mentorBerdiri.x / 4, t.mentorBerdiri.y / 4), kepalaAntara: kepala(f, k.x, k.y), kepalaDuduk: kepala(d, t.mentor.x / 4, t.mentor.y / 4), bawahRect: k.y - f.jangkar.y + f.rect[3], garisMejaDunia: k.y - f.jangkar.y + f.garisMeja }];
    }));
  }
  // 06 potret ukuran nyata (+ sebelum: PNG potret SVG v3 bila folder svgPng diberikan)
  const KREM = [246, 236, 214];
  const EKS_SVG = { netral: 'netral', senyum: 'tersenyum', prihatin: 'cemas', serius: 'serius', lega: 'lega' };
  const baris06 = man.ekspresi.map((e) => {
    const it = [];
    if (svgPng) for (const u of [44, 52, 64, 96]) { const fp = path.join(svgPng, `${EKS_SVG[e]}-${u}.png`); if (fs.existsSync(fp)) it.push({ img: L.datarkan(L.baca(fp), KREM), label: 'svg' + u }); }
    for (const n of [32, 44, 52, 64, 96]) it.push({ img: L.datarkan(potret(man, atlas, e, man.potret.jendela[n]), KREM), label: 'p' + n });
    for (const n of [52, 64, 96]) it.push({ img: L.datarkan(potret(man, atlas, e, man.potret.dekat[n]), KREM), label: 'd' + n });
    for (const n of [44, 64, 96]) it.push({ img: lingkaran(potret(man, atlas, e, man.potret.dekat[n] || man.potret.jendela[n]), KREM), label: 'o' + n });
    return L.susun(it, { kLabel: 1, jarak: 6 });
  });
  L.tulis(path.join(out, '06-potret-nyata.png'), L.tumpuk(baris06));
  L.tulis(path.join(out, '06b-potret-3x.png'), L.perbesar(L.tumpuk(baris06), 3));
  fs.writeFileSync(path.join(out, 'laporan-tinjau.json'), JSON.stringify(lapor, null, 1));
  return lapor;
}

if (process.argv[1]?.endsWith('miss-tinjau.mjs')) {
  const out = process.argv[2] || path.join(L.ROOT, 'tmp-tinjau-miss');
  const r = lembar(out, process.argv[3] || null);
  console.log(JSON.stringify({ warna: r.warnaAtlas, alpha: r.alphaBukanBiner, diLuarPalet: r.diLuarPalet, ekspresiDiLuarKotakWajah: r.ekspresiDiLuarKotakWajah, maksVarianDiLuarKotak: r.maksVarianDiLuarKotak, ukuranSalah: r.ukuranLapisanSalah.length, netralVsTubuh: r.diLuarKotak, garisMejaDiTubuh: r.garisMejaDiTubuh }));
}
