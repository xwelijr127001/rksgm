/**
 * Seni tokoh di LUAR panggung (seni piksel v4, docs/cerita/aset/PIKSEL.md):
 *  - potret bulat Miss Raksa & Bu Rina (PotretPiksel: dialog 52/44, kartu akhir 56-88, hub 56, pemandu aktivitas 44)
 *    = jendela potret manifest pada skala BULAT, piksel perangkat bulat per piksel seni di setiap devicePixelRatio,
 *    potongan sama di dpr bulat, cadangan huruf awal bila atlas gagal, SVG v3 bila manifest tidak ada;
 *  - slot < 44 px CSS (Riwayat 32, label "Pelajaran" kartu akhir 32) = IKON KEPALA MINI gambar tangan (ikon.json):
 *    kepala utuh (sanggul / hijab + bros) di lingkaran isi, skala bulat, wajah per ekspresi, kepala terkunci;
 *  - Bu Rina setengah badan piksel (TokohNasabah) & properti aktivitas Phaser (auto1-bukti: frame aktivitas manifest,
 *    tekstur NEAREST, skala perangkat bulat);
 *  - sprite global Miss Raksa (game/KarakterTokoh: sheet dari atlas piksel lewat penyusun, x2 nearest, kepala terkunci)
 *    dan ukuran tampilnya (tokoh.ts: piksel perangkat bulat per piksel seni).
 * Pintu masuk SVG lama (nasabah.ts) tetap diuji karena menjadi cadangan (manifest tidak ada / atlas Phaser gagal).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DAFTAR_EKSPRESI, type Ekspresi } from '../tipe';
import {
  JENDELA_POTRET_NASABAH as J,
  JENDELA_POTRET_NASABAH_KECIL as JK,
  JENDELA_POTRET_NASABAH_SEDANG as JS,
  NASABAH_H,
  NASABAH_W,
  POTONG_SETENGAH_PIKSEL,
  POTRET_KECIL_MAKS,
  POTRET_SEDANG_MAKS,
  RINA_PENUH,
  SETENGAH_BADAN,
  aturanPotretNasabah,
  nasabahBadanPenuh,
  nasabahSetengahBadan,
  BATAS_IKON_PX,
  potretPiksel,
  setengahBadanPiksel,
  svgNasabah,
} from './nasabah';
import { gambarBuRina } from './tokoh/buRina';
import { gambarBuRina as gambarBuRinaAman, pasangGenerator } from './tokoh';
import { awalanId } from '../ui/panggung/dunia';
import { JENDELA_POTRET_SEDANG, POTRET_SEDANG_MAKS_PX, aturanPotret, gambarMissRaksa } from './tokoh/missRaksa';
import { JENDELA_POTRET_KECIL, JENDELA_POTRET_V3, POTRET_KECIL_MAKS_PX } from './tokoh/ukuran';
import { ikonTokoh, manifestIkon, penyusunPiksel, susunTokoh, URL_ATLAS_PIKSEL, URL_IKON_PIKSEL, type IdTokohPiksel, type IdTokohPikselEp1 } from './piksel';
import {
  SPRITE_BESAR, SISI_POTRET_PIKSEL, potretSpritePiksel, skalaMinSpritePiksel, skalaPerangkat, ukuranPermintaanPotret, ukuranSpritePiksel,
} from '../../game/tokoh';
import { sceneBuktiRina } from '../../game/scenes/cerita/auto1-bukti';

const AKAR = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const baca = (...p: string[]) => fs.readFileSync(path.join(AKAR, ...p), 'utf8');
type Png = { width: number; height: number; data: Buffer };
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(b: Buffer): Png } } };
const bacaPng = (...p: string[]): Png => PNG.sync.read(fs.readFileSync(path.join(AKAR, ...p)));

const EKSPRESI_MISS: Ekspresi[] = ['netral', 'tersenyum', 'cemas', 'serius', 'lega'];
/**
 * Ukuran potret (px CSS) untuk jendela manifest: aktivitas 44, pemandu 48, dialog 52, hub 56, akhir 64/80/88, sisipan
 * 96; 28/32 tetap diuji untuk pemanggil tanpa opsi ikon (halaman memakai ikon kepala mini di bawah 44, lihat tes ikon).
 */
const UKURAN_POTRET = [28, 32, 44, 48, 52, 56, 64, 80, 88, 96];

// ------------------------------------------------------------------ potret piksel (halaman)

test('potret piksel: skala BULAT, satu piksel seni = piksel perangkat bulat di dpr 1/2/3/1.25/1.5/1.75, viewBox pas', () => {
  for (const tokoh of ['missRaksa', 'buRina'] as IdTokohPikselEp1[]) {
    const eks = tokoh === 'missRaksa' ? EKSPRESI_MISS : DAFTAR_EKSPRESI;
    for (const e of eks) {
      for (const u of UKURAN_POTRET) {
        for (const dpr of [1, 2, 3, 1.25, 1.5, 1.75]) {
          const { px, kali } = ukuranPermintaanPotret(u, dpr);
          const p = potretPiksel(tokoh, e, px);
          assert.ok(p, `${tokoh}/${e}/${u}/${dpr}: potret piksel ada`);
          const [, , vw, vh] = p.viewBox.split(' ').map(Number);
          assert.ok(Number.isInteger(p.skala) && p.skala >= 1, `${tokoh}/${e}/${u}: skala bulat ${p.skala}`);
          assert.ok(Math.abs(vw! - vh!) < 1e-9 && Math.abs(vw! * p.skala - px) < 1e-6, `${tokoh}/${u}/${dpr}: viewBox x skala = ukuran permintaan`);
          // piksel perangkat per piksel seni = (u x dpr) / vw
          const perangkat = (u * dpr) / vw!;
          const bulat = p.skala * kali;
          assert.ok(Math.abs(perangkat - bulat) < 0.02 * bulat + 0.02, `${tokoh}/${u}/${dpr}: ${perangkat.toFixed(3)} ~ ${bulat} piksel perangkat per piksel seni`);
          assert.match(p.svg, /image-rendering:pixelated/, 'nearest-neighbour');
          assert.ok(!/\bid="/.test(p.svg), 'tanpa id (aman diulang di satu halaman)');
          assert.ok(p.svg.includes(URL_ATLAS_PIKSEL[tokoh].replace(/&/g, '&amp;')), 'atlas tokoh itu');
          assert.ok(!p.asal.startsWith('dekat'), 'keluarga jendela biasa (dekat terlalu rapat)');
        }
        // dpr bulat: potongan seni SAMA di semua perangkat (hanya kerapatan pikselnya yang naik)
        const vb = [1, 2, 3].map((d) => potretPiksel(tokoh, e, ukuranPermintaanPotret(u, d).px)!.viewBox);
        assert.equal(new Set(vb).size, 1, `${tokoh}/${e}/${u}: potongan sama di dpr 1/2/3`);
      }
    }
  }
  // ukuran persis manifest dipakai apa adanya (dialog 52, aktivitas 44, riwayat 32, kartu akhir 64 di HP)
  for (const u of [32, 44, 52, 64]) {
    assert.equal(potretPiksel('missRaksa', 'netral', u)!.asal, `jendela.${u}`);
    assert.equal(potretPiksel('buRina', 'netral', u)!.asal, `jendela.${u}`);
  }
});

test('potret piksel: ekspresi berbeda di ukuran dialog, wajah & kepala di dalam jendela 44-96', () => {
  for (const tokoh of ['missRaksa', 'buRina'] as IdTokohPikselEp1[]) {
    const eks = tokoh === 'missRaksa' ? EKSPRESI_MISS : DAFTAR_EKSPRESI;
    const m = penyusunPiksel.manifest[tokoh]!;
    for (const u of [44, 52, 56, 64, 88]) {
      const isi = eks.map((e) => potretPiksel(tokoh, e, u)!.svg);
      // Bu Rina: 8 ekspresi cerita = 8 wajah; Miss Raksa: 5 ekspresi cerita = 5 wajah manifest
      assert.equal(new Set(isi).size, eks.length, `${tokoh} ${u}px: tiap ekspresi punya wajah sendiri`);
      const p = penyusunPiksel.potretTokoh(tokoh, 'netral', u)!;
      const f = m.frame[p.frame]!;
      const w = f.wajah!.kotak;
      const v = p.viewBox;
      assert.ok(w.x >= v.x && w.y >= v.y && w.x + w.w <= v.x + v.w && w.y + w.h <= v.y + v.h, `${tokoh} ${u}px: kotak wajah utuh di jendela`);
    }
  }
});

// ------------------------------------------------------------------ ikon kepala mini (< 44 px CSS)

test('ikon kepala mini: slot < 44 px = ikon gambar tangan, skala BULAT di dpr 1/2/3/1.25/1.5/1.75/2.625, ikon utuh di slot 32', () => {
  assert.ok(manifestIkon, 'ikon.json terbaca');
  assert.equal(BATAS_IKON_PX, 44);
  for (const tokoh of ['missRaksa', 'buRina'] as IdTokohPikselEp1[]) {
    const eks = tokoh === 'missRaksa' ? EKSPRESI_MISS : DAFTAR_EKSPRESI;
    for (const e of eks) {
      for (const u of [28, 32, 36, 40]) {
        for (const dpr of [1, 2, 3, 1.25, 1.5, 1.75, 2.625]) {
          const { px, kali } = ukuranPermintaanPotret(u, dpr);
          const p = potretPiksel(tokoh, e, px, { ikon: true })!;
          assert.ok(p, `${tokoh}/${e}/${u}/${dpr}: ikon ada`);
          assert.equal(p.asal, 'ikon.32');
          assert.ok(p.svg.includes(URL_IKON_PIKSEL[tokoh].replace(/&/g, '&amp;')), 'PNG ikon tokoh itu');
          assert.match(p.svg, /image-rendering:pixelated/);
          assert.ok(!/\bid="/.test(p.svg), 'tanpa id');
          const [vx, vy, vw, vh] = p.viewBox.split(' ').map(Number);
          assert.ok(Number.isInteger(p.skala) && p.skala >= 1 && Math.abs(vw! - vh!) < 1e-9 && Math.abs(vw! * p.skala - px) < 1e-6, `${tokoh}/${u}/${dpr}: skala bulat, viewBox x skala = ukuran permintaan`);
          const perangkat = (u * dpr) / vw!;
          assert.ok(Math.abs(perangkat - p.skala * kali) < 0.02 * p.skala * kali + 0.02, `${tokoh}/${u}/${dpr}: ${perangkat.toFixed(3)} piksel perangkat per piksel ikon ~ bulat`);
          // ikon 32 selalu utuh bila slot >= 32 piksel ikon (pinggir transparan pada dpr pecahan), ikon di tengah
          if (vw! >= 32 - 1e-9) assert.ok(vx! <= 0 && vy! <= 0 && vx! + vw! >= 32 && vy! + vh! >= 32, `${tokoh}/${u}/${dpr}: ikon utuh (${p.viewBox})`);
          assert.ok(Math.abs(vx! + vw! / 2 - 16) <= 0.5 / p.skala + 1e-6, 'ikon di tengah lingkaran (± setengah piksel perangkat)');
        }
      }
      // slot 32 pada dpr bulat: satu piksel ikon = 1 px CSS x dpr, ikon 32 x 32 persis (potongan sama di dpr 1/2/3)
      for (const dpr of [1, 2, 3]) assert.equal(potretPiksel(tokoh, e, ukuranPermintaanPotret(32, dpr).px, { ikon: true })!.viewBox, '0 0 32 32');
    }
    // tanpa opsi ikon: jendela manifest (pemanggil lain & uji jendela tetap sama)
    assert.equal(potretPiksel(tokoh, 'netral', 32)!.asal, 'jendela.32');
  }
});

test('ikon kepala mini: kepala UTUH di lingkaran isi 28, wajah beda per ekspresi hanya di kotak wajah, PNG sah', () => {
  const m = manifestIkon!;
  for (const tokoh of ['missRaksa', 'buRina'] as IdTokohPikselEp1[]) {
    const t = m.tokoh[tokoh]!;
    const png = bacaPng('client/src/cerita/seni/piksel', t.gambar);
    assert.deepEqual([png.width, png.height], [t.atlas.w, t.atlas.h]);
    const warna = new Set<string>();
    for (let i = 0; i < png.data.length; i += 4) {
      assert.ok(png.data[i + 3] === 0 || png.data[i + 3] === 255, 'alpha biner');
      if (png.data[i + 3]) warna.add(png.data.subarray(i, i + 3).join(','));
    }
    assert.ok(warna.size <= 40, `${tokoh}: ${warna.size} warna`);
    const at = (c: { x: number; y: number }, x: number, y: number) => {
      const i = ((c.y + y) * png.width + c.x + x) * 4;
      return png.data[i + 3] ? png.data.subarray(i, i + 3).join(',') : '';
    };
    const eks = tokoh === 'missRaksa' ? EKSPRESI_MISS : DAFTAR_EKSPRESI;
    const wajah = new Set(eks.map((e) => ikonTokoh(tokoh, e, 32)!.ekspresi));
    assert.equal(wajah.size, Object.keys(t.sel).length, `${tokoh}: tiap wajah ikon dipakai ekspresi cerita`);
    const dasar = t.sel.netral!;
    for (const [nama, c] of Object.entries(t.sel)) {
      let beda = 0;
      let atas = 99;
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const v = at(c, x, y);
        // bagian ATAS ikon (sanggul / puncak hijab sampai pelipis) seluruhnya di lingkaran isi: tidak terpotong cincin
        if (v && y < 16) {
          atas = Math.min(atas, y);
          assert.ok(Math.hypot(x + 0.5 - 16, y + 0.5 - 16) <= m.isi / 2, `${tokoh}/${nama}: piksel (${x},${y}) di luar lingkaran isi`);
        }
        const dalam = x >= t.wajah.x && x < t.wajah.x + t.wajah.w && y >= t.wajah.y && y < t.wajah.y + t.wajah.h;
        if (v !== at(dasar, x, y)) {
          assert.ok(dalam, `${tokoh}/${nama}: piksel (${x},${y}) di luar kotak wajah berubah (kepala terkunci)`);
          beda++;
        }
      }
      assert.ok(atas >= 2 && atas <= 4, `${tokoh}/${nama}: puncak kepala di baris ${atas} (kepala utuh, bukan wajah saja)`);
      if (nama !== 'netral') assert.ok(beda >= 3, `${tokoh}/${nama}: wajah berbeda dari netral (${beda} piksel)`);
    }
  }
});

test('komponen potret: PotretPiksel bersama, ukuran tampil terukur, dpr, cadangan huruf saat atlas gagal & SVG v3 tanpa manifest', () => {
  const potret = baca('client/src/cerita/seni/tokoh/PotretMissRaksa.tsx');
  const nasabah = baca('client/src/cerita/seni/TokohNasabah.tsx');
  assert.match(potret, /export const PotretPiksel = memo\(/);
  assert.match(potret, /el\.clientWidth/, 'ukuran tampil dibaca dari kotak (CSS boleh menimpa, mis. kartu akhir 80/88 px)');
  assert.match(potret, /new ResizeObserver\(baca\)/);
  assert.match(potret, /ukuranPermintaanPotret\(tampil, dpr\)/, 'jendela dari ukuran tampil x dpr');
  assert.match(potret, /useDpr\(\)/, 'ikut berubah saat zoom / dpr berubah');
  assert.match(potret, /gambarSiap\(url\) === false/, 'atlas gagal dimuat = cadangan');
  assert.match(potret, /\{huruf\}/, 'cadangan terakhir huruf awal di bingkai yang sama');
  assert.match(potret, /imageRendering: 'pixelated'/);
  assert.match(potret, /const ikon = tampil < BATAS_IKON_PX;/, 'slot tampil < 44 px CSS = ikon kepala mini');
  assert.match(potret, /potretPiksel\(tokoh, ekspresi, px, \{ ikon \}\)/);
  assert.match(potret, /data-piksel=\{piksel && !gagal \? piksel\.skala \* kali : undefined\}/, 'piksel perangkat per piksel seni tampak di DOM');
  assert.match(potret, /huruf="M"/);
  assert.match(nasabah, /<PotretPiksel\s+tokoh="buRina"/, 'PotretNasabah memakai potret piksel yang sama');
  assert.match(nasabah, /huruf="B"/);
  // cadangan SVG v3 (manifest tidak ada): tetap lewat generator berpengaman, tanpa id per mount, awalan per salinan
  assert.match(nasabah, /import \{ gambarBuRina \} from '\.\/tokoh';/, 'generator lewat pintu masuk berpengaman seni/tokoh/index.ts');
  assert.ok(!/from '\.\/tokoh\/buRina'/.test(nasabah), 'tidak memanggil generator final langsung');
  assert.equal((nasabah.match(/id: awalan/g) ?? []).length, 0, 'awalan tidak diteruskan ke generator');
  assert.match(nasabah, /awalanId\(dasar, awalan\)/, 'awalan sesudah digambar');
  assert.match(nasabah, /const \{ jendela: J, kecil \} = aturanPotretNasabah\(ukuran\)/, 'cadangan SVG memakai aturan ukuran bersama');
  // pemakai: API komponen tidak berubah
  for (const [f, re] of [
    ['client/src/cerita/ui/bagian.tsx', /<PotretNasabah ekspresi=\{ekspresi \?\? 'netral'\} ukuran=\{ukuran\}/],
    ['client/src/cerita/ui/bagian.tsx', /<PotretMissRaksa ekspresi=\{ekspresi \?\? 'netral'\} ukuran=\{ukuran\}/],
    ['client/src/cerita/ui/Riwayat.tsx', /ukuran=\{32\}/],
    ['client/src/cerita/ui/LayarAkhir.tsx', /<PotretMissRaksa ekspresi=\{wajahMentor\} ukuran=\{32\} \/>/],
    ['client/src/cerita/ui/LayarAkhir.tsx', /<PotretNasabah ekspresi=\{k\.ekspresi\} ukuran=\{64\}/],
    ['client/src/cerita/ui/Aktivitas.tsx', /<PotretMissRaksa ekspresi=\{wajahPemandu\} ukuran=\{44\} \/>/],
    ['client/src/pages/Cerita.tsx', /<PotretMissRaksa ekspresi="tersenyum" ukuran=\{56\} \/>/],
  ] as const) assert.match(baca(f), re, f);
});

test('Bu Rina setengah badan piksel: frame berdiri + wajah ekspresi, kepala sampai kunci di dalam potongan, tanpa id', () => {
  const s = susunTokoh('buRina', { pose: 'berdiri', ekspresi: 'cemas' })!;
  const P = POTONG_SETENGAH_PIKSEL;
  assert.ok(P.w <= s.ukuran.w && P.h <= s.ukuran.h, 'potongan di dalam frame');
  assert.ok(s.kepala.y - s.kepalaTinggi / 2 >= P.y, 'puncak kerudung di dalam potongan');
  const kunci = s.titikTangan.kunci;
  assert.ok(kunci && kunci.y < P.y + P.h && kunci.x >= P.x && kunci.x <= P.x + P.w, 'kunci mobil di dalam potongan');
  const isi = DAFTAR_EKSPRESI.map((e) => setengahBadanPiksel(e)!);
  assert.equal(new Set(isi.map((x) => x.svg)).size, DAFTAR_EKSPRESI.length, 'tiap ekspresi punya wajah sendiri');
  for (const x of isi) {
    assert.ok(!/\bid="/.test(x.svg) && /image-rendering:pixelated/.test(x.svg));
    assert.deepEqual([x.x, x.y, x.w, x.h], [P.x, P.y, P.w, P.h]);
  }
  const src = baca('client/src/cerita/seni/TokohNasabah.tsx');
  assert.match(src, /skalaPerangkat\(tinggi, piksel\.h, d\)/, 'tinggi diminta dibulatkan ke piksel perangkat bulat');
  assert.match(src, /Math\.floor\(\(\(tinggiWadah/, 'tanpa tinggi: skala bulat terbesar yang muat di wadah');
});

// ------------------------------------------------------------------ aktivitas Phaser (parkiran)

test('aktivitas bukti: Bu Rina = frame aktivitas manifest (berdiri) piksel, potongan di dalam atlas, cadangan SVG di kotak lama', () => {
  const s = sceneBuktiRina();
  const rina = (s.props ?? []).find((p) => p.id === 'rina')!;
  assert.ok(rina, 'properti Bu Rina ada');
  const q = rina.art.piksel!;
  assert.ok(q, 'seni piksel terpasang');
  const m = JSON.parse(baca('client/src/cerita/seni/piksel/bu-rina.json')) as { aktivitas: { frame: string }; ukuranAtlas: [number, number] };
  const susunan = susunTokoh('buRina', { pose: 'berdiri', hadap: 'kanan', ekspresi: 'cemas' })!;
  assert.ok(susunan.frame.startsWith(m.aktivitas.frame), `frame ${susunan.frame} = frame aktivitas manifest (${m.aktivitas.frame}), arah ke mobil`);
  assert.deepEqual([q.w, q.h], [susunan.ukuran.w, susunan.ukuran.h]);
  assert.deepEqual(q.jangkar, { x: susunan.jangkar.x, y: susunan.jangkar.y }, 'titik pijak = kaki frame');
  assert.equal(q.lapisan.length, susunan.lapisan.length);
  const [aw, ah] = m.ukuranAtlas;
  for (const l of q.lapisan) {
    assert.ok(l.sx >= 0 && l.sy >= 0 && l.sx + l.w <= aw && l.sy + l.h <= ah, 'potongan di dalam atlas');
    assert.ok(l.x >= 0 && l.y >= 0 && l.x + l.w <= q.w && l.y + l.h <= q.h, 'lapisan di dalam gambar');
    for (const v of [l.sx, l.sy, l.w, l.h, l.x, l.y]) assert.ok(Number.isInteger(v));
  }
  assert.equal(rina.art.key, 'cerita-auto1-rina-piksel');
  assert.ok(rina.art.svg.includes('akt-rina-'), 'cadangan SVG v3 bila atlas gagal dimuat');
  assert.equal(rina.art.h, 120, 'tinggi rancangan tetap 120 dunia');
  // engine: tekstur NEAREST + skala perangkat bulat + kanvas 1:1 tanpa penghalusan
  const scene = baca('client/src/game/engine/MissionScene.ts');
  assert.match(scene, /setFilter\(P\.Textures\.FilterMode\.NEAREST\)/);
  assert.match(scene, /Math\.max\(1, Math\.round\(\(p\.art\.h \* this\.zoom\) \/ q\.h\)\)/, 'n piksel perangkat bulat per piksel seni');
  assert.match(scene, /for \(const \{ img, p \} of this\.propPiksel\) this\.letakPiksel\(img, p\)/, 'dihitung ulang saat ukuran berubah');
  const raster = baca('client/src/game/engine/raster.ts');
  assert.match(raster, /imageSmoothingEnabled = false/);
  assert.match(raster, /canvas\.dataset\.piksel = '1'/);
  assert.match(raster, /rasterPiksel\(a\.piksel\)\.catch\(\(\) => rasterSvg\(a, scale\)\)/, 'atlas gagal = SVG cadangan');
});

// ------------------------------------------------------------------ sprite global Miss Raksa

test('sprite Miss Raksa: sheet 4 frame dari atlas piksel (x2 nearest), kepala terkunci, alpha 0/255, frame = susunan penyusun', () => {
  const meta = JSON.parse(baca('client/src/game/art/karakter-sprite.json')) as Record<string, { berkas: string; besar: { frameW: number; frameH: number }; piksel?: { skala: number; frameW: number; frameH: number; kaki: { x: number; y: number }; kepala: { x: number; y: number } } }>;
  const mr = meta.missRaksa!;
  const px = mr.piksel!;
  assert.ok(px, 'metadata piksel');
  assert.ok(!meta.ceo!.piksel && !meta.isti!.piksel, 'Mr Roger & Bu Isti tetap sheet lama');
  assert.deepEqual([mr.besar.frameW, mr.besar.frameH], [px.frameW * px.skala, px.frameH * px.skala]);
  assert.deepEqual(SPRITE_BESAR.missRaksa.piksel, JSON.parse(JSON.stringify(px)));
  const png = bacaPng('client/public/karakter/miss-raksa-besar.png');
  assert.deepEqual([png.width, png.height], [mr.besar.frameW * 4, mr.besar.frameH]);
  assert.ok(fs.statSync(path.join(AKAR, 'client/public/karakter/miss-raksa-besar.webp')).size > 1000, 'WebP ada');
  const atlas = bacaPng('client/src/cerita/seni/piksel/miss-raksa.png');
  const resep = [
    { pose: 'berdiri', mata: 'buka' }, { pose: 'berdiri-sambut', mata: 'buka' },
    { pose: 'berdiri-sambut', mata: 'tutup' }, { pose: 'berdiri', mata: 'tutup' },
  ] as const;
  resep.forEach((r, f) => {
    const s = susunTokoh('missRaksa', { pose: r.pose, hadap: 'kanan', ekspresi: 'tersenyum', mata: r.mata })!;
    assert.equal(s.cadangan.length, 0, `${r.pose}: tanpa cadangan`);
    const ox = px.kaki.x - s.kaki!.x;
    const oy = px.kaki.y - s.kaki!.y;
    assert.equal(s.kepala.x + ox, px.kepala.x, 'kepala terkunci (x)');
    assert.equal(s.kepala.y + oy, px.kepala.y, 'kepala terkunci (y)');
    // susun ulang frame ini dari atlas (lapisan berurutan, piksel buram menimpa) lalu bandingkan dengan sheet x skala
    const w = px.frameW, h = px.frameH;
    const fr = Buffer.alloc(w * h * 4);
    for (const l of s.lapisan) {
      for (let y = 0; y < l.sumber.h; y++) for (let x = 0; x < l.sumber.w; x++) {
        const si = ((l.sumber.y + y) * atlas.width + l.sumber.x + x) * 4;
        if (atlas.data[si + 3]! < 128) continue;
        const di = ((oy + l.y + y) * w + ox + l.x + x) * 4;
        atlas.data.copy(fr, di, si, si + 4);
      }
    }
    let beda = 0;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < mr.besar.frameW; x++) {
      const pi = (y * png.width + f * mr.besar.frameW + x) * 4;
      const a = png.data[pi + 3]!;
      assert.ok(a === 0 || a === 255, 'alpha biner');
      const fi = (Math.floor(y / px.skala) * w + Math.floor(x / px.skala)) * 4;
      if (a !== fr[fi + 3]! || (a === 255 && (png.data[pi] !== fr[fi] || png.data[pi + 1] !== fr[fi + 1] || png.data[pi + 2] !== fr[fi + 2]))) beda++;
    }
    assert.equal(beda, 0, `frame ${f} (${r.pose} ${r.mata}) = susunan penyusun x${px.skala}`);
  });
});

test('ukuran tampil seni piksel global: piksel perangkat bulat per piksel seni, minimal floor(dpr) (HP tidak mengecil), potret kepala-bahu di jendela', () => {
  const p = SPRITE_BESAR.missRaksa.piksel!;
  assert.equal(skalaPerangkat(0, 184, 1), 1);
  assert.equal(skalaPerangkat(50, 184, 1), 1, 'tidak pernah di bawah 1:1 (piksel hilang)');
  assert.equal(skalaPerangkat(190, 184, 2), 2);
  for (const tinggi of [96, 104, 116, 120, 150, 170, 190, 360]) {
    for (const dpr of [1, 1.25, 1.5, 2, 3]) {
      const u = ukuranSpritePiksel(p, tinggi, dpr);
      assert.ok(Number.isInteger(u.n) && u.n >= 1);
      assert.ok(Math.abs(u.h * dpr - u.n * p.frameH) < 1e-6 && Math.abs(u.w * dpr - u.n * p.frameW) < 1e-6, `${tinggi}@${dpr}: ${u.n} piksel perangkat per piksel seni`);
      // v5: minimal floor(dpr) piksel perangkat per piksel seni (± 1 px CSS per piksel seni); di atas itu terdekat ke tinggi diminta
      const min = skalaMinSpritePiksel(dpr);
      assert.ok(u.n >= min, `${tinggi}@${dpr}: n ${u.n} >= ${min}`);
      if (u.n > min) assert.ok(Math.abs(u.h - tinggi) <= (p.frameH / dpr) / 2 + 1e-6, `${tinggi}@${dpr}: sedekat mungkin ke tinggi diminta`);
    }
  }
  // Review v4: HP dpr 2 memberi 92 px CSS (wajah ± 12 px). Slot 96-116 kini sama dengan desktop dpr 1: 184 px CSS,
  // wajah 24 px CSS; dpr pecahan dibulatkan ke bawah (laptop 125-150 % tidak membengkak).
  for (const tinggi of [96, 104, 116]) {
    for (const dpr of [1, 2, 3]) assert.equal(ukuranSpritePiksel(p, tinggi, dpr).h, p.frameH, `${tinggi}@${dpr}: 1 px CSS per piksel seni`);
    assert.ok(Math.abs(ukuranSpritePiksel(p, tinggi, 1.5).h - p.frameH / 1.5) < 1e-6, `${tinggi}@1.5: 1 piksel perangkat`);
    for (const dpr of [1, 1.25, 1.5, 2, 2.625, 3]) {
      const u = ukuranSpritePiksel(p, tinggi, dpr);
      assert.ok(p.wajah!.w * (u.h / p.frameH) >= 16, `${tinggi}@${dpr}: wajah ${(p.wajah!.w * u.h / p.frameH).toFixed(1)} px CSS >= 16`);
      assert.ok(u.h <= 190, `${tinggi}@${dpr}: tidak membengkak (${u.h.toFixed(1)} px)`);
    }
  }
  for (const ukuran of [40, 44, 48, 60, 64]) {
    for (const dpr of [1, 1.25, 1.5, 2, 3]) {
      const j = potretSpritePiksel(p, ukuran, dpr);
      assert.ok(Number.isInteger(j.x) && Number.isInteger(j.y) && Number.isInteger(j.n) && j.n >= 1);
      assert.ok(Math.abs(j.q * dpr - j.n) < 1e-9 && Math.abs(j.sisi * j.q - ukuran) < 1e-6, `${ukuran}@${dpr}: jendela pas di lingkaran`);
      const w = p.wajah!;
      assert.ok(w.x >= j.x && w.y >= j.y && w.x + w.w <= j.x + j.sisi && w.y + w.h <= j.y + j.sisi, `${ukuran}@${dpr}: wajah utuh`);
    }
  }
  assert.equal(potretSpritePiksel(p, 60, 1).n, 1);
  assert.ok(SISI_POTRET_PIKSEL >= 44 && SISI_POTRET_PIKSEL <= 64);
  const css = baca('client/src/game/tokoh.css');
  assert.match(css, /\.tokoh-sprite\.tokoh-missRaksa, \.tokoh-potret-isi\.tokoh-missRaksa \{ image-rendering: pixelated; \}/);
  assert.match(css, /\.tokoh-sprite\.tokoh-missRaksa\.lambai \{ animation-name: tokoh-sambut-mr; animation-duration: 6s; \}/);
  assert.match(css, /:root:not\(\[data-gerak="penuh"\]\) \.tokoh-sprite\.lambai \{ animation: none; \}/, 'kurangi gerak tetap diam');
  const kt = baca('client/src/game/KarakterTokoh.tsx');
  assert.match(kt, /ukuranSpritePiksel\(s\.piksel, tinggi, dpr\)/);
  assert.match(kt, /potretSpritePiksel\(s\.piksel, ukuran, dpr\)/);
  assert.match(kt, /marginBottom: Math\.round\(tinggiTampil \* 0\.46\)/, 'balon mengikuti tinggi yang benar-benar tampil');
});

// ------------------------------------------------------------------ cadangan SVG v3 (manifest tidak ada / Phaser)

test('cadangan setengah badan SVG v3: polos (tanpa id/gradien), delapan ekspresi berbeda, versi kecil berbeda, di-cache', () => {
  const kecil = DAFTAR_EKSPRESI.map((e) => nasabahSetengahBadan(e, true));
  const biasa = DAFTAR_EKSPRESI.map((e) => nasabahSetengahBadan(e));
  assert.equal(new Set(biasa).size, DAFTAR_EKSPRESI.length, 'tiap ekspresi punya gambar sendiri');
  assert.equal(new Set(kecil).size, DAFTAR_EKSPRESI.length, 'tiap ekspresi kecil punya gambar sendiri');
  DAFTAR_EKSPRESI.forEach((e, i) => {
    assert.notEqual(kecil[i], biasa[i], `${e}: versi kecil menebalkan garis/fitur`);
    assert.equal(nasabahSetengahBadan(e, true), kecil[i], `${e}: versi kecil di-cache`);
    assert.equal(nasabahSetengahBadan(e, false), biasa[i], `${e}: parameter bawaan = versi biasa`);
  });
  for (const s of [...kecil, ...biasa]) {
    assert.ok(!/<text|<image|url\(|id="|<defs|Gradient|clipPath/.test(s), 'tanpa teks, gambar luar, id, gradien, atau clipPath (aman diulang inline)');
    assert.ok(s.includes('#e8833a'), 'tali pinggang / lis jingga (identitas katering)');
  }
  assert.ok(Math.abs(NASABAH_W / NASABAH_H - 120 / 140) < 0.01, 'rasio setengah badan tetap 120:140');
  for (const e of DAFTAR_EKSPRESI) {
    const g = gambarBuRina({ pose: 'berdiri', ekspresi: e, pandang: 'pemain', kunci: true, id: 's' });
    assert.ok(g.kepala.y - 66 > SETENGAH_BADAN.y, `${e}: puncak kerudung di dalam potongan`);
  }
  assert.match(svgNasabah('lega'), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+">/);
});

test('cadangan potret SVG v3: aturan ukuran & jendela sama dengan Miss Raksa v3 (kecil, sedang, biasa)', () => {
  assert.deepEqual(J, JENDELA_POTRET_V3);
  assert.deepEqual(JK, JENDELA_POTRET_KECIL);
  assert.deepEqual(JS, JENDELA_POTRET_SEDANG);
  assert.equal(POTRET_KECIL_MAKS, POTRET_KECIL_MAKS_PX);
  assert.equal(POTRET_SEDANG_MAKS, POTRET_SEDANG_MAKS_PX);
  for (let uk = 20; uk <= 160; uk++) {
    const r = aturanPotretNasabah(uk);
    const m = aturanPotret(uk);
    assert.equal(r.kecil, m.kecil, `${uk} px: versi`);
    assert.equal(r.jendela.sisi, m.jendela.sisi, `${uk} px: sisi jendela`);
    assert.equal(r.jendela.x, m.jendela.x, `${uk} px: x jendela`);
  }
  for (const jj of [J, JS, JK]) {
    const pusat = { x: jj.x + jj.sisi / 2, y: jj.y + jj.sisi / 2 };
    const r = gambarBuRina({ pose: 'duduk', ekspresi: 'cemas', pandang: 'pemain', kecil: true, id: 'p' });
    assert.ok(Math.abs(r.kepala.x - pusat.x) <= 8 && Math.abs(r.kepala.y - pusat.y) <= 8, `kepala di tengah jendela ${jj.sisi}`);
    const m = gambarMissRaksa({ pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'pemain', id: 'm' });
    assert.ok(Math.abs(m.kepala.x - pusat.x) <= 8 && Math.abs(m.kepala.y - pusat.y) <= 8);
  }
});

test('cadangan SVG: awalan per salinan dari satu gambar tanpa id, rujukan url(#…) tetap terpenuhi', () => {
  const dasar = gambarBuRinaAman({ pose: 'duduk', ekspresi: 'cemas', pandang: 'pemain', kecil: true }).svg;
  assert.equal(gambarBuRinaAman({ pose: 'duduk', ekspresi: 'cemas', pandang: 'pemain', kecil: true }).svg, dasar, 'satu entri cache untuk semua salinan');
  const a = awalanId(dasar, 'rpt-a'), b = awalanId(dasar, 'rpt-b');
  const ids = (x: string): string[] => [...x.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!);
  assert.ok(ids(a).length > 0);
  for (const id of ids(a)) assert.ok(id.startsWith('rpt-a-') && !ids(b).includes(id), id);
  for (const x of [a, b]) {
    const ada = new Set(ids(x));
    for (const [, ref] of x.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ada.has(ref!), `rujukan ${ref}`);
  }
});

test('cadangan SVG: galat generator Bu Rina → siluet pengganti (sprite aktivitas cadangan, potret cadangan), tidak melempar', () => {
  const src = baca('client/src/cerita/seni/nasabah.ts');
  assert.match(src, /import \{ gambarBuRina, type OpsiBuRina \} from '\.\/tokoh';/, 'nasabah.ts memakai generator berpengaman');
  pasangGenerator({ buRina: () => { throw new Error('uji: seni rusak'); } });
  try {
    const s = nasabahBadanPenuh();
    assert.ok(s.includes('<ellipse') && !s.includes('akt-rina-'), 'sprite aktivitas cadangan = siluet pengganti');
    const g = gambarBuRinaAman({ pose: 'duduk', ekspresi: 'kesal', pandang: 'pemain', kecil: true });
    assert.ok(g.svg.length > 0 && g.w > 0, 'potret cadangan = siluet pengganti');
    // seni piksel TIDAK bergantung pada generator SVG
    assert.ok(potretPiksel('buRina', 'kesal', 52), 'potret piksel tetap ada');
  } finally {
    pasangGenerator({ buRina: gambarBuRina });
  }
  assert.ok(nasabahBadanPenuh().includes('akt-rina-'), 'generator final terpasang kembali');
  assert.ok(RINA_PENUH.telapakY > RINA_PENUH.h * 0.95 && RINA_PENUH.telapakY < RINA_PENUH.h, 'telapak dekat tepi bawah potongan');
});

test('ganti ekspresi TokohNasabah <= 200 ms dan instan saat gerak dikurangi', () => {
  const css = baca('client/src/cerita/seni/seni.css');
  const dur = /\.cseni-ganti\s*\{[^}]*animation:\s*cseni-ganti\s+(\d+)ms/.exec(css);
  assert.ok(dur, 'animasi cseni-ganti ada');
  assert.ok(Number(dur![1]) <= 200, `durasi ${dur![1]} ms <= 200`);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root:not\(\[data-gerak="penuh"\]\) \.cseni-tokoh-bingkai\.cseni-ganti \{ animation: none; \}/, 'gerak dikurangi = ganti instan');
});
