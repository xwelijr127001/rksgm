/**
 * Miss Raksa — lapisan wajah per frame, atlas (rak/skyline, potongan identik di-dedup) dan manifest.
 * Skema manifest = skema Bu Rina (docs/cerita/aset/BU-RINA-PIKSEL.md) + tambahan yang didokumentasikan di
 * docs/cerita/aset/MISS-RAKSA-PIKSEL.md (ekspresiDari, pinggul, garisMeja, diAtasMeja, ujungTelunjuk, kepalaTinggi, pandang).
 */
import crypto from 'node:crypto';
import * as L from './lib.mjs';
import * as M from './miss-lib.mjs';
import * as W from './miss-wajah.mjs';
import { KANVAS } from './miss-tubuh.mjs';
import { PALET, FRAME, DUDUK } from './miss-suntingan.mjs';

/** Ekspresi cerita (tipe.ts Ekspresi) -> wajah Miss Raksa (sama dengan seni/tokoh/missRaksa.ts wajahDari). */
export const EKSPRESI_DARI = { netral: 'netral', tersenyum: 'senyum', senang: 'senyum', cemas: 'prihatin', bingung: 'prihatin', serius: 'serius', kesal: 'serius', lega: 'lega' };

const sama = (a, b, x, y) => { const i = L.idx(a, x, y); return a.d[i + 3] === b.d[i + 3] && (!a.d[i + 3] || (a.d[i] === b.d[i] && a.d[i + 1] === b.d[i + 1] && a.d[i + 2] === b.d[i + 2])); };

export function jangkarKaki(img) {
  const b = L.kotakAlpha(img); const yb = b.y + b.h;
  let x0 = Infinity, x1 = -Infinity;
  for (let y = yb - 8; y < yb; y++) for (let x = 0; x < img.w; x++) if (M.buramXY(img, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); }
  return { x: (x0 + x1) / 2, y: yb };
}

/** Titik kepala per arah (kanvas): puncak sanggul, dagu, tengah wajah; dari kepala dasar & kulit wajah. */
function ukurKepala(kepala) {
  const k = L.kotakAlpha(kepala);
  // dagu = baris terbawah kulit wajah (bukan kerah/leher): cari baris terakhir bersambung kulit di kolom tengah wajah
  const kulit = new Set(['#fcaf7d', '#fdbb88', '#f9a474', '#f29a69']);
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < 55; y++) for (let x = 0; x < kepala.w; x++) if (M.buramXY(kepala, x, y) && kulit.has(L.hex(M.warna(kepala, x, y)))) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const dagu = y1 + 1;
  return { puncak: k.y, dagu, wajah: { x: (x0 + x1 + 1) / 2, y: (y0 + dagu) / 2 }, kiriKepala: k.x, kananKepala: k.x + k.w };
}

export function susun(F, log) {
  const arahan = ['kiri', 'kanan'];
  const render = F.render;
  const kotak = Object.fromEntries(arahan.map((a) => [a, W.kotakFitur(render, a, F.pengganti)]));
  const ukur = Object.fromEntries(arahan.map((a) => [a, ukurKepala(F.kepalaNetral[a])]));

  const potongan = [];
  const info = {};
  for (const f of Object.values(F.frame)) {
    const a = f.arah; const kb = kotak[a];
    const b = L.kotakAlpha(f.img);
    const tr = { x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2 };
    potongan.push({ kunci: `tubuh:${f.id}`, img: L.potong(f.img, tr.x, tr.y, tr.w, tr.h) });
    // piksel wajah yang boleh ditimpa lapisan: kepala buram & tidak tertutup (tangan/gagang di depan)
    const netral = F.kepalaNetral[a];
    const boleh = (x, y) => M.buramXY(netral, x, y) && sama(f.img, netral, x, y);
    let tertutup = 0;
    { const [x0, y0, w, h] = kb.wajah; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (M.buramXY(netral, x, y) && !sama(f.img, netral, x, y)) tertutup++; }
    const lapis = (e, v, [x0, y0, w, h]) => {
      // varian bawah dengan mata pengganti per frame (duduk-tunjuk-kiri: lirik kanan-bawah ke kartu)
      let kunciR = `${a}:${e}:${v}`;
      if (v === 'bawah' && f.mataBawah) { kunciR += ':' + f.mataBawah; if (!render[kunciR]) throw new Error('render mata pengganti tak ada: ' + kunciR); }
      const src = render[kunciR]; const o = L.buat(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (boleh(x0 + x, y0 + y)) M.setel(o, x, y, M.warna(src, x0 + x, y0 + y));
      return o;
    };
    for (const e of W.EKSPRESI) {
      potongan.push({ kunci: `wajah:${f.id}:${e}:dasar`, img: lapis(e, 'dasar', kb.wajah) });
      potongan.push({ kunci: `wajah:${f.id}:${e}:kedip`, img: lapis(e, 'kedip', kb.mata) });
      potongan.push({ kunci: `wajah:${f.id}:${e}:bawah`, img: lapis(e, 'bawah', kb.mata) });
      potongan.push({ kunci: `wajah:${f.id}:${e}:bicara`, img: lapis(e, 'bicara', kb.mulut) });
    }
    info[f.id] = { tr, tertutup };
  }

  /* ---------- atlas */
  const unik = new Map(); const peta = {};
  for (const p of potongan) {
    const h = crypto.createHash('sha1').update(p.img.d).update(`${p.img.w}x${p.img.h}`).digest('hex');
    if (!unik.has(h)) unik.set(h, { img: p.img, h, kunci: p.kunci });
    peta[p.kunci] = h;
  }
  const daftar = [...unik.values()];
  let pilih = null;
  for (const Wc of [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024]) {
    const it = daftar.map((u) => ({ w: u.img.w, h: u.img.h, u, kunci: u.kunci }));
    let Hc; try { Hc = M.kemas(it, Wc); } catch { continue; }
    if (Hc > 1024) continue;
    if (!pilih || Wc * Hc < pilih.W * pilih.H) pilih = { W: Wc, H: Hc, it };
  }
  for (const t of pilih.it) { t.u.x = t.x; t.u.y = t.y; }
  const atlas = L.buat(pilih.W, pilih.H);
  for (const u of daftar) L.tempel(atlas, u.img, u.x, u.y);
  const rect = (kunci) => { const u = unik.get(peta[kunci]); return u ? [u.x, u.y, u.img.w, u.img.h] : null; };

  /* ---------- manifest */
  const rel = (tr, p) => (p ? { x: +(p.x - tr.x).toFixed(2), y: +(p.y - tr.y).toFixed(2) } : undefined);
  const relK = (tr, k) => [k[0] - tr.x, k[1] - tr.y, k[2], k[3]];
  const frame = {};
  for (const f of Object.values(F.frame)) {
    const R = FRAME[f.pose]; const a = f.arah; const tr = info[f.id].tr; const u = ukur[a]; const kb = kotak[a];
    const kepala = { x: (u.kiriKepala + u.kananKepala) / 2, y: (u.puncak + u.dagu) / 2 };
    const o = {
      rect: rect(`tubuh:${f.id}`), hadap: a, jenisJangkar: f.jenis === 'duduk' ? 'pinggul' : 'kaki',
    };
    if (f.jenis === 'duduk') { o.jangkar = rel(tr, f.jangkar); o.pinggul = rel(tr, f.jangkar); }
    else if (f.jenis === 'turun') { o.jangkar = rel(tr, f.jangkar); o.kaki = rel(tr, f.jangkar); }
    else { const k = jangkarKaki(f.img); o.jangkar = rel(tr, k); o.kaki = rel(tr, k); }
    o.kepala = rel(tr, kepala); o.kepalaTinggi = u.dagu - u.puncak;
    const kw = kb.wajah; const tw = { x: kw[0] + kw[2] / 2, y: kw[1] + kw[3] / 2 };
    o.leher = rel(tr, { x: tw.x + 2, y: u.dagu + 1 }); o.titikWajah = rel(tr, tw);
    const tangan = {};
    if (R.ujungTelunjuk) { o.ujungTelunjuk = rel(tr, R.ujungTelunjuk[a]); tangan.telunjuk = o.ujungTelunjuk; }
    if (R.gagang) { tangan.telepon = rel(tr, R.gagang[a]); }
    if (R.telapak) tangan.telapak = rel(tr, R.telapak[a]);
    if (Object.keys(tangan).length) o.tangan = tangan;
    o.teleponTergambar = !!R.gagang;
    o.wajah = { kotak: relK(tr, kb.wajah), mata: relK(tr, kb.mata), mulut: relK(tr, kb.mulut) };
    o.ekspresi = {};
    for (const e of W.EKSPRESI) o.ekspresi[e] = { dasar: rect(`wajah:${f.id}:${e}:dasar`), kedip: rect(`wajah:${f.id}:${e}:kedip`), bawah: rect(`wajah:${f.id}:${e}:bawah`), bicara: rect(`wajah:${f.id}:${e}:bicara`) };
    if (f.jenis === 'duduk') {
      o.garisMeja = f.garisMeja - tr.y;
      let ada = false; for (let y = f.garisMeja; y < f.img.h && !ada; y++) for (let x = 0; x < f.img.w; x++) if (M.buramXY(f.img, x, y)) { ada = true; break; }
      o.diAtasMeja = ada ? [[0, o.garisMeja, tr.w, tr.h - o.garisMeja]] : [];
      // + 1 baris di atas garisMeja HANYA di kolom lengan yang melintas tepi jauh meja (garis tepi 1 baris gelap di
      // lapisan belakangMeja jatuh di baris ini); kolom torso tidak -> pinggang tetap di balik tepi meja.
      for (const [x0, x1] of f.tepiLengan || []) o.diAtasMeja.push([x0 - tr.x, o.garisMeja - 1, x1 - x0 + 1, 1]);
      // v5: garis mata (tengah baris putih mata wajah netral, koordinat frame) & tingginya di atas garisMeja, supaya
      // panggung dapat menyamakan garis mata Miss & Bu Rina; tanganMeja = titik tangan di permukaan meja (keterangan)
      o.garisMata = garisMata(render[`${a}:netral:dasar`]) - tr.y;
      o.mataDiAtasMeja = +(o.garisMeja - o.garisMata).toFixed(2);
      if (f.tanganMeja) o.tanganMeja = f.tanganMeja.map((p) => rel(tr, p));
    }
    if (f.jenis === 'turun') {
      // garisMeja hanya keterangan (berlaku bila kaki di y lantai tempat.mentorBerdiri); tanpa diAtasMeja: tidak ada
      // piksel di bawah garis, tangan berhenti di tepi jauh meja.
      o.garisMeja = f.garisMeja - tr.y;
      o.turun = {
        dariBerdiri: f.turun.dariBerdiri, keDuduk: f.turun.keDuduk,
        catatan: `bingkai antara berdiri <-> duduk: jangkar kaki di y lantai tempat.mentorBerdiri; badan ${f.turun.dariBerdiri} px seni lebih rendah dari berdiri, ${f.turun.keDuduk} di atas duduk; x kaki = x kaki berdiri arah sama (kepala tepat di tengah bila x dipilih seperti bingkaiTurun Bu Rina); badan di bawah garisMeja tidak digambar (tertutup meja): gambar DI BALIK meja`,
      };
    }
    if (f.mataBawah) o.mataBawah = { sprite: f.mataBawah, catatan: 'varian bawah frame ini = mata melirik kanan-bawah (ke kartu di kanan gambar); kepala tetap menghadap pemain' };
    o.kanvas = { x: tr.x, y: tr.y };
    o.asal = { sel: f.sel, kepala: 'e-netral (lembar ekspresi; fitur master dipertahankan) + cangkok sel ekspresi terdaftar + suntingan tangan tercatat', bawah: f.jenis === 'berdiri' ? 'master (rok, kaki, sepatu)' : f.jenis === 'turun' ? 'tidak digambar (tertutup meja)' : undefined, cermin: a === 'kanan' ? 'badan dicermin di sumbu kerah + detail depan jas diperbaiki; kepala kanan (belahan dipindah)' : undefined };
    if (info[f.id].tertutup) o.wajahTertutup = { piksel: info[f.id].tertutup, catatan: 'piksel wajah.kotak yang tertutup tangan/gagang; lapisan wajah frame ini transparan di sana' };
    frame[f.id] = o;
  }
  return { atlas, frame, daftar, ukur, kotak, render };
}

/** Garis mata (kanvas): tengah rentang baris (20..44, di atas kerah putih) yang memuat putih mata #f7f2ea di kepala. */
export function garisMata(kepala) {
  let y0 = Infinity, y1 = -Infinity;
  for (let y = 20; y < 45; y++) for (let x = 0; x < kepala.w; x++) if (M.buramXY(kepala, x, y) && L.hex(M.warna(kepala, x, y)) === '#f7f2ea') { y0 = Math.min(y0, y); y1 = Math.max(y1, y); break; }
  return (y0 + y1 + 1) / 2;
}

/** Jendela potret persegi di sekitar titik (koordinat frame). */
export function jendela(f, sisi, skala, pusat) {
  return { frame: f, x: Math.round(pusat.x - sisi / 2), y: Math.round(pusat.y - sisi / 2), sisi, skala, tampil: sisi * skala };
}
