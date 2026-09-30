/**
 * TES SENI PIKSEL panggung (murni): manifest ruang (ruang.json) dibaca toleran & aman, potongan PNG dikenali,
 * tokoh raster selalu skala 1 di kisi piksel seni, klip tangan di atas meja, dan URL yang harus didekode.
 */
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ruangSementara } from '../../seni/ruang/sementara';
import type { GambarTokoh } from '../../seni/tokoh';
import { buatLetak, kotakKepala } from './dunia';
import {
  bacaManifestRuang, jalurKlip, kotakDiAtasMeja, kotakPapan, lapisanPiksel, markupPiksel, pikselDari, ruangPiksel, SATUAN_PIKSEL, sidikGambar,
  teksPapanPiksel, tempelanDari, tinggiKepala, titikKisi, urlRuang, urlSusunan,
} from './piksel';

const cari = (berkas: string) => (berkas === 'hilang.png' ? null : `/aset/${berkas}`);
const cadangan = () => ruangSementara('meja');

const MANIFEST = {
  satuan: 4,
  warnaTepi: '#b98a4e',
  gambar: { ruang: { berkas: 'ruang.png', w: 400, h: 500 } },
  lokasi: {
    meja: {
      latar: { gambar: 'ruang', sumber: [0, 0, 400, 225], dunia: [0, 0] },
      koridor: { gambar: 'ruang', sumber: [0, 225, 48, 113], dunia: [1248, 108] },
      pintu: { daun: { gambar: 'ruang', sumber: [48, 225, 48, 113], dunia: [1248, 108] }, engsel: [1248, 334], bukaan: [1248, 108, 192, 452] },
      belakangMeja: { gambar: 'ruang', sumber: [0, 340, 200, 60], piksel: [40, 120] },
      depanMeja: { gambar: 'ruang', sumber: [0, 400, 200, 50], piksel: [40, 150] },
      kursi: { belakang: { gambar: 'ruang', sumber: [200, 340, 60, 80], dunia: [1000, 560] } },
      papanNama: { x: 612, y: 196, w: 440, h: 60 },
    },
  },
};

test('manifest ruang: lapisan raster (dunia & piksel), pintu, kursi, papan nama, URL & warna tepi', () => {
  const m = bacaManifestRuang(MANIFEST, cari, cadangan);
  assert.deepEqual(m.catatan, []);
  const r = m.ruang.meja!;
  assert.ok(r && ruangPiksel(r));
  assert.deepEqual(pikselDari(r.latar), { url: '/aset/ruang.png', atlas: { w: 400, h: 500 }, sumber: { x: 0, y: 0, w: 400, h: 225 } });
  assert.deepEqual([r.latar.x, r.latar.y, r.latar.w, r.latar.h], [0, 0, 1600, 900], 'kotak dunia = sumber x 4');
  assert.deepEqual([r.belakangMeja!.x, r.belakangMeja!.y, r.belakangMeja!.w], [160, 480, 800], 'posisi "piksel" x 4');
  assert.equal(r.pintu!.engsel.x, 1248);
  assert.ok(r.kursi?.belakang && !r.kursi.depan);
  assert.equal(r.papanNama!.w, 440);
  assert.equal(r.papanNama!.ukuranHuruf, 42, 'ukuran huruf bawaan bila tidak ada');
  assert.deepEqual(r.tempat, ruangSementara('meja').tempat, 'tempat tokoh dari ruang SVG bila manifest tidak memuatnya');
  assert.deepEqual(m.url, ['/aset/ruang.png']);
  assert.equal(m.warnaTepi, '#b98a4e');
  assert.equal(r.latar.svg, '', 'bentuk LapisanSvg (svg kosong) supaya panggung lain tidak perlu tahu jenisnya');
});

test('manifest ruang: data cacat dilewati dengan catatan, tidak pernah melempar', () => {
  for (const cacat of [null, 42, 'x', [], {}, { lokasi: 5 }, { satuan: 2, lokasi: MANIFEST.lokasi, gambar: MANIFEST.gambar }]) {
    const m = bacaManifestRuang(cacat, cari, cadangan);
    assert.deepEqual(m.ruang, {}, JSON.stringify(cacat));
    assert.ok(m.catatan.length > 0);
  }
  // Berkas PNG tidak ditemukan -> lokasi tanpa latar -> dilewati (panggung tetap SVG).
  const hilang = bacaManifestRuang({ ...MANIFEST, gambar: { ruang: { berkas: 'hilang.png', w: 400, h: 500 } } }, cari, cadangan);
  assert.deepEqual(hilang.ruang, {});
  // Sumber di luar atlas -> lapisan dilewati.
  const luar = bacaManifestRuang({ ...MANIFEST, lokasi: { meja: { ...MANIFEST.lokasi.meja, depanMeja: { gambar: 'ruang', sumber: [300, 480, 200, 50], dunia: [0, 0] } } } }, cari, cadangan);
  assert.ok(luar.ruang.meja && !luar.ruang.meja.depanMeja);
  assert.ok(luar.catatan.some((c) => c.includes('di luar atlas')));
  // Tanpa tempat (manifest & cadangan) -> lokasi dilewati.
  const tanpaTempat = bacaManifestRuang(MANIFEST, cari, () => null);
  assert.deepEqual(tanpaTempat.ruang, {});
});

test('pikselDari: hanya potongan yang lengkap; sidikGambar membedakan raster (svg kosong)', () => {
  assert.equal(pikselDari({ svg: '<g/>' }), null);
  assert.equal(pikselDari({ piksel: { url: 'a.png', atlas: { w: 1, h: 1 } } }), null, 'tanpa sumber');
  assert.equal(pikselDari({ piksel: { url: '', atlas: { w: 1, h: 1 }, sumber: { x: 0, y: 0, w: 1, h: 1 } } }), null, 'url kosong');
  const a = lapisanPiksel('a.png', { w: 10, h: 10 }, { x: 0, y: 0, w: 5, h: 5 }, 0, 0);
  const b = lapisanPiksel('a.png', { w: 10, h: 10 }, { x: 5, y: 0, w: 5, h: 5 }, 0, 0);
  assert.notEqual(sidikGambar(a), sidikGambar(b));
  assert.equal(sidikGambar({ svg: '<g/>' }), '<g/>');
  assert.equal(sidikGambar(null), '');
});

test('tokoh raster: skala 1, sudut kiri-atas di kisi 4 satuan; kepala memakai kepalaTinggi gambar', () => {
  const g = {
    svg: '', w: 400, h: 600, jangkar: { x: 202, y: 598 }, kepala: { x: 200, y: 120 }, kepalaTinggi: 212,
    piksel: { url: 'm.png', atlas: { w: 200, h: 200 }, sumber: { x: 0, y: 0, w: 100, h: 150 } },
  } as unknown as GambarTokoh;
  const l = buatLetak({ siapa: 'mentor', pose: 'duduk-dengar', ekspresi: 'netral' }, { x: 531, y: 733 }, 1.05, 40, () => g);
  assert.equal(l.skala, 1, 'tidak pernah skala pecahan');
  assert.equal((l.titik.x - g.jangkar.x) % SATUAN_PIKSEL, 0);
  assert.equal((l.titik.y - g.jangkar.y) % SATUAN_PIKSEL, 0);
  assert.ok(Math.abs(l.titik.x - 531) <= 2 && Math.abs(l.titik.y - 733) <= 2, 'pergeseran paling banyak setengah piksel seni');
  assert.equal(kotakKepala(l).h, 1.22 * 212);
  assert.equal(tinggiKepala({}), 130, 'SVG: KEPALA_TINGGI');
  assert.deepEqual(titikKisi({ x: 10, y: 9 }, { x: 0, y: 0 }), { x: 12, y: 8 });
});

test('klip tangan di atas meja: jalur gabungan kotak; tanpa kotak = null', () => {
  assert.equal(jalurKlip([]), null);
  assert.equal(jalurKlip([{ x: 0, y: 0, w: 8, h: 4 }, { x: 20, y: 4, w: 4, h: 4 }]), "path('M0 0H8V4H0Z M20 4H24V8H20Z')");
  assert.deepEqual(kotakDiAtasMeja({ diAtasMejaPiksel: [{ x: 0, y: 0, w: 8, h: 4 }, { x: 1 }] }), [{ x: 0, y: 0, w: 8, h: 4 }]);
  assert.deepEqual(kotakDiAtasMeja({}), []);
});

test('URL yang didekode sebelum tampil: ruang + tokoh raster + varian di PNG lain, tanpa duplikat', () => {
  const r = { ...ruangSementara('meja'), latar: lapisanPiksel('r.png', { w: 4, h: 4 }, { x: 0, y: 0, w: 4, h: 4 }, 0, 0) };
  assert.deepEqual(urlRuang(r), ['r.png']);
  const tokoh = [{ gambar: { piksel: { url: 'm.png', atlas: { w: 1, h: 1 }, sumber: { x: 0, y: 0, w: 1, h: 1 } }, varianUrl: ['m-kedip.png', 'r.png'] } }, { gambar: { svg: '<g/>' } }];
  assert.deepEqual(urlSusunan({ ruang: r, tokoh }), ['r.png', 'm.png', 'm-kedip.png']);
  assert.deepEqual(urlSusunan({ ruang: ruangSementara('meja'), tokoh: [] }), [], 'seni SVG: tanpa URL');
});

test('markup potongan (kartu episode): viewBox = sumber, nearest-neighbour atribut + CSS, URL di-escape', () => {
  const m = markupPiksel({ url: 'a.png?x=1&y="2"', atlas: { w: 400, h: 500 }, sumber: { x: 8, y: 4, w: 100, h: 50 } }, 16, 32, 400, 200);
  assert.ok(m.includes('viewBox="8 4 100 50"'));
  assert.ok(m.includes('image-rendering="pixelated"') && m.includes('style="image-rendering:pixelated"'));
  assert.ok(m.includes('href="a.png?x=1&amp;y=&quot;2&quot;"'));
  assert.ok(m.includes('overflow="hidden"'));
});

// ------------------------------------------------------------------ bentuk A (tools/piksel/bangun-ruang.mjs)

const MANIFEST_A = {
  versi: 1,
  piksel: 4,
  dunia: { w: 1600, h: 900, pw: 400, ph: 225 },
  teksPapan: 'Raksa Silver Club',
  lokasi: {
    meja: {
      lapisan: [
        { id: 'latar', berkas: 'ruang-meja-latar.png', x: 0, y: 0, w: 1600, h: 900, pw: 400, ph: 225, z: 10, alpha: false },
        { id: 'koridor', berkas: 'ruang-meja-koridor.png', x: 1412, y: 0, w: 188, h: 900, pw: 47, ph: 225, z: 20, alpha: false },
        { id: 'daun', berkas: 'ruang-meja-daun.png', x: 1412, y: 0, w: 188, h: 900, pw: 47, ph: 225, z: 30, alpha: false, engsel: { x: 1412, y: 450 } },
        { id: 'belakangMeja', berkas: 'ruang-meja-belakang-meja.png', x: 64, y: 488, w: 1224, h: 296, pw: 306, ph: 74, z: 50, alpha: true },
        { id: 'depanMeja', berkas: 'ruang-meja-depan-meja.png', x: 64, y: 768, w: 1224, h: 132, pw: 306, ph: 33, z: 60, alpha: true },
        { id: 'kursiBelakang', berkas: 'ruang-meja-kursi-belakang.png', x: 928, y: 440, w: 480, h: 460, pw: 120, ph: 115, z: 70, alpha: true },
      ],
      bukaan: { x: 1412, y: 0, w: 188, h: 900 },
      papan: { teks: 'Raksa Silver Club', kotak: { x: 772, y: 228, w: 200, h: 76 } },
      tempat: {
        mentor: { x: 656, y: 792 }, mentorBerdiri: { x: 600, y: 900 }, skalaMentor: 1, nasabahDuduk: { x: 1148, y: 736 }, skalaNasabah: 1,
        nasabahBerdiri: { x: 1320, y: 904 }, jalurMasuk: [{ titik: { x: 1536, y: 904 }, skala: 1 }],
      },
    },
    parkiran: { lapisan: [{ id: 'latar', berkas: 'ruang-parkiran-latar.png', x: 0, y: 0, w: 1600, h: 900, pw: 400, ph: 225 }], tempat: { mentor: { x: 1, y: 1 }, nasabahDuduk: { x: 1, y: 1 }, jalurMasuk: [] } },
  },
  prop: {
    kartu: { berkas: 'ruang-prop-kartu.png', w: 120, h: 64, pw: 30, ph: 16, jangkar: { x: 60, y: 32 } },
    kartuTangan: { berkas: 'ruang-prop-kartu-tangan.png', w: 88, h: 64, pw: 22, ph: 16, jangkar: { x: 44, y: 56 } },
    map: { berkas: 'ruang-prop-map.png', w: 188, h: 68, pw: 47, ph: 17, jangkar: { x: 92, y: 36 }, diLapisan: { lapisan: 'belakangMeja', lokasi: ['meja'] } },
    salah: { berkas: 'ruang-prop-salah.png', w: 100, h: 64, pw: 30, ph: 16, jangkar: { x: 1, y: 1 } },
  },
};

test('manifest bentuk A (satu PNG per lapisan): lapisan, pintu + engsel, papan dipanggang, tempat, prop', () => {
  const m = bacaManifestRuang(MANIFEST_A, cari, cadangan);
  const r = m.ruang.meja!;
  assert.ok(r && ruangPiksel(r));
  assert.deepEqual(pikselDari(r.latar), { url: '/aset/ruang-meja-latar.png', atlas: { w: 400, h: 225 }, sumber: { x: 0, y: 0, w: 400, h: 225 } });
  assert.deepEqual([r.belakangMeja!.x, r.belakangMeja!.y, r.belakangMeja!.w, r.belakangMeja!.h], [64, 488, 1224, 296]);
  assert.deepEqual(r.pintu?.engsel, { x: 1412, y: 450 });
  assert.deepEqual(r.pintu?.bukaan, { x: 1412, y: 0, w: 188, h: 900 });
  assert.ok(r.kursi?.belakang && pikselDari(r.kursi.belakang));
  assert.equal(r.papanNama, undefined, 'tulisan papan dipanggang: tanpa teks panggung');
  assert.deepEqual(kotakPapan(r), { x: 772, y: 228, w: 200, h: 76 }, 'kotak papan tetap untuk kamera');
  assert.equal(teksPapanPiksel(r), 'Raksa Silver Club');
  assert.deepEqual(r.tempat.nasabahDuduk, { x: 1148, y: 736 }, 'tempat dari manifest');
  assert.ok(m.ruang.parkiran && ruangPiksel(m.ruang.parkiran), 'lokasi satu lapisan');
  assert.ok(m.prop.kartu && m.prop.kartuTangan, 'prop');
  assert.equal(m.prop.kartuTangan!.w, 88);
  assert.equal((m.prop as Record<string, unknown>).map, undefined, 'map sudah di lapisan: bukan prop panggung');
  assert.ok(m.catatan.some((c) => c.includes('prop salah')), 'prop berskala pecahan dilewati dengan catatan');
  assert.ok(m.url.includes('/aset/ruang-prop-kartu.png') && m.url.includes('/aset/ruang-meja-latar.png'));
});

test('manifest bentuk A: lapisan berskala pecahan (w != pw x 4) dilewati', () => {
  const rusak = JSON.parse(JSON.stringify(MANIFEST_A));
  rusak.lokasi.meja.lapisan[3].w = 1200;
  const m = bacaManifestRuang(rusak, cari, cadangan);
  assert.ok(m.ruang.meja && !m.ruang.meja.belakangMeja);
  assert.ok(m.catatan.some((c) => c.includes('skala pecahan')));
});

test('manifest seni/piksel/ruang.json yang terpasang (bila ada) terbaca utuh tanpa catatan', () => {
  const berkas = path.resolve(import.meta.dirname, '../../seni/piksel/ruang.json');
  if (!fs.existsSync(berkas)) return;
  const json = JSON.parse(fs.readFileSync(berkas, 'utf8'));
  const m = bacaManifestRuang(json, (b) => (fs.existsSync(path.join(path.dirname(berkas), b)) ? `/aset/${b}` : null), cadangan);
  assert.deepEqual(m.catatan, [], 'semua lapisan & prop sah');
  for (const lok of Object.keys(json.lokasi)) assert.ok(ruangPiksel(m.ruang[lok as 'meja']), `lokasi ${lok} raster`);
});

test('tempelan (lapisan wajah) gambar raster: dibaca aman, ikut sidik, URL, dan markup', () => {
  const tubuh = { url: 't.png', atlas: { w: 64, h: 96 }, sumber: { x: 0, y: 0, w: 40, h: 60 } };
  const wajah = { url: 't.png', atlas: { w: 64, h: 96 }, sumber: { x: 40, y: 0, w: 12, h: 12 } };
  const mata = { url: 'mata.png', atlas: { w: 12, h: 4 }, sumber: { x: 0, y: 0, w: 12, h: 4 } };
  const g = { svg: '', piksel: tubuh, tempelan: [{ p: wajah, x: 14, y: 4 }, { p: mata, x: 14, y: 8 }, { p: { url: '' }, x: 1, y: 1 }, null, { p: wajah, x: 'a', y: 0 }] };
  assert.deepEqual(tempelanDari(g), [{ p: wajah, x: 14, y: 4 }, { p: mata, x: 14, y: 8 }], 'tempelan cacat dilewati');
  assert.deepEqual(tempelanDari({ svg: '<g/>' }), []);
  const tanpaMata = { ...g, tempelan: [{ p: wajah, x: 14, y: 4 }] };
  assert.notEqual(sidikGambar(g), sidikGambar(tanpaMata), 'kedip (tempelan mata) = gambar berbeda');
  assert.deepEqual(urlSusunan({ ruang: ruangSementara('meja'), tokoh: [{ gambar: g }] }), ['t.png', 'mata.png']);
  const m = markupPiksel(tubuh, 0, 0, 160, 240, tempelanDari(g));
  assert.ok(m.includes('<svg x="14" y="4" width="12" height="12" viewBox="40 0 12 12" overflow="hidden">'), 'wajah di kotak wajah (koordinat viewBox tubuh)');
  assert.ok(m.includes('href="mata.png"'));
});
