/**
 * TES KAMERA panggung v3 (murni): kotak panggung selalu terisi dunia (tidak pernah memperlihatkan luar 1600 x 900),
 * bingkai lebar memperlihatkan ruangan dua tokoh + pintu, bingkai HP dirapatkan (bukan desktop yang diperkecil),
 * dan kepala + tangan kedua tokoh selalu utuh di atas pita bawah (label suasana / tombol lewati).
 * Posisi tokoh dihitung dari `tempat` ruang + jangkar/kepala gambar (pengganti sementara di sini; seni final
 * memakai kanvas & jangkar yang sama).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ruangSementara } from '../../seni/ruang/sementara';
import type { KomposisiAdegan } from '../adeganTipe';
import { gambarBuRina, gambarMissRaksa } from '../../seni/tokoh';
import { DUNIA_H, DUNIA_W, gabungKotak, kotakKepala, kotakPenting, susunAdegan, type Kotak, type PenggambarTokoh } from './dunia';
import {
  BINGKAI_HP, BINGKAI_LEBAR, jenisBingkai, keLayar, MAKS_LEBIH_PIKSEL, pandangan, pasKamera, pikselPerSeni, qPiksel, rectBingkai,
  rectDenganPintu, samaKamera, transformKamera, type Pad,
} from './kamera';
import { lapisanPiksel, pikselDari } from './piksel';
import { ruangAdegan } from '../../seni/ruang';
import { gambarTokoh } from './sumber';
import { kameraDiam, kameraKedatangan, kameraPintu, kameraUntuk, kepalaBerdiri, pabrikTransisi, pintuDiTepiKanan } from './transisi';
import { JADWAL_MASUK } from './rencana';
// Uji tokoh piksel di panggung (berkas terpisah; ikut dijalankan lewat impor ini selama daftar test:client di
// package.json belum memuatnya; hapus impor ini bila tokoh.test.ts sudah ada di daftar itu).
import './tokoh.test';

const DUA: KomposisiAdegan = {
  lokasi: 'meja',
  mentor: { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan' },
  nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false },
  pembicara: 'nasabah',
  prop: { kunci: 'meja', kartu: 'tersimpan', telepon: 'meja' },
  aksi: null,
  pembuka: false,
};

/** Kotak panggung nyata dari tata letak (cerita.css) pada viewport uji. */
const KOTAK: Record<string, [number, number]> = {
  d1440: [1280, 528],
  d1920: [1280, 620],
  d1024: [960, 396],
  tablet: [736, 368],
  h390: [366, 274],
  h360: [336, 252],
  l844: [372, 274],
  ekstremLebar: [2000, 300],
  ekstremTinggi: [300, 700],
};

const didalam = (dalam: Kotak, luar: Kotak, eps = 0.5) =>
  dalam.x >= luar.x - eps && dalam.y >= luar.y - eps && dalam.x + dalam.w <= luar.x + luar.w + eps && dalam.y + dalam.h <= luar.y + luar.h + eps;

test('kamera tidak pernah memperlihatkan area di luar dunia, di semua ukuran kotak', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarTokoh);
  for (const [nama, [W, H]] of Object.entries(KOTAK)) {
    for (const rect of [BINGKAI_LEBAR, BINGKAI_HP, { x: -300, y: -200, w: 400, h: 300 }, { x: 0, y: 0, w: DUNIA_W, h: DUNIA_H }]) {
      const k = pasKamera(W, H, rect, s.inti);
      const v = pandangan(k, W, H);
      assert.ok(didalam(v, { x: 0, y: 0, w: DUNIA_W, h: DUNIA_H }), `${nama}: pandangan ${JSON.stringify(v)} keluar dunia`);
    }
  }
});

test('jenis bingkai: <= 520 px = HP (dua tokoh dirapatkan), selain itu lebar', () => {
  assert.equal(jenisBingkai(366), 'hp');
  assert.equal(jenisBingkai(520), 'hp');
  assert.equal(jenisBingkai(521), 'lebar');
  assert.equal(jenisBingkai(1280), 'lebar');
});

test('bingkai lebar desktop memperlihatkan ruangan utuh dari panel bambu sampai pintu', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarTokoh);
  for (const nama of ['d1440', 'd1920', 'd1024']) {
    const [W, H] = KOTAK[nama]!;
    const k = pasKamera(W, H, rectBingkai('meja', jenisBingkai(W), s.inti), s.inti, { atas: 6, bawah: 44, kiri: 4, kanan: 4 });
    const v = pandangan(k, W, H);
    const pintu = s.ruang.pintu!.bukaan;
    assert.ok(v.x <= 130 && v.x + v.w >= pintu.x + pintu.w, `${nama}: pintu & sisi petugas terlihat (${Math.round(v.x)}..${Math.round(v.x + v.w)})`);
  }
});

test('bingkai HP dirapatkan pada dua tokoh: skala lebih besar daripada seluruh dunia yang diperkecil', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarTokoh);
  for (const nama of ['h390', 'h360', 'l844']) {
    const [W, H] = KOTAK[nama]!;
    const k = pasKamera(W, H, rectBingkai('meja', 'hp', s.inti), s.inti, { atas: 6, bawah: 34, kiri: 4, kanan: 4 });
    const seluruh = Math.max(W / DUNIA_W, H / DUNIA_H);
    assert.ok(k.s > seluruh * 1.3, `${nama}: skala ${k.s.toFixed(3)} vs seluruh dunia ${seluruh.toFixed(3)}`);
    // Pandangan HP tidak jauh lebih lebar daripada bingkai kontrak (x 430-1250) kecuali kepala memaksa.
    const v = pandangan(k, W, H);
    assert.ok(v.w <= BINGKAI_HP.w * 1.25, `${nama}: lebar pandangan ${Math.round(v.w)}`);
  }
});

test('kepala & tangan kedua tokoh utuh di atas pita bawah (label/tombol) pada semua ukuran', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarTokoh);
  for (const [nama, [W, H]] of Object.entries(KOTAK)) {
    const pad = { atas: 6, bawah: W <= 520 ? 34 : 44, kiri: 4, kanan: 4 };
    const k = pasKamera(W, H, rectBingkai('meja', jenisBingkai(W), s.inti), s.inti, pad);
    for (const t of s.tokoh) {
      const kepala = keLayar(k, kotakKepala(t));
      // Kepala yang berada di dalam dunia harus utuh di dalam kotak yang dikurangi pita (kecuali rasio ekstrem).
      if (nama.startsWith('ekstrem')) continue;
      assert.ok(didalam(kepala, { x: 0, y: 0, w: W, h: H - pad.bawah + 0.5 }), `${nama}: kepala ${t.siapa} ${JSON.stringify(kepala)} terpotong/tertutup pita`);
    }
  }
});

test('inti lebih besar dari bingkai: skala diperkecil supaya inti muat, atas (kepala) diutamakan', () => {
  const inti = { x: 200, y: 20, w: 1100, h: 600 };
  const k = pasKamera(366, 274, BINGKAI_HP, inti);
  const v = pandangan(k, 366, 274);
  assert.ok(v.y <= inti.y + 0.5, 'atas inti terlihat');
  assert.ok(v.x <= inti.x + 0.5 && v.x + v.w >= inti.x + inti.w - 0.5, 'lebar inti terlihat');
});

test('bingkai dengan pintu memperluas ke kanan untuk kedatangan (HP), tanpa mengubah bingkai lebar', () => {
  const r = ruangSementara('meja');
  const hp = rectDenganPintu(BINGKAI_HP, r.pintu!.bukaan);
  assert.ok(hp.x + hp.w >= r.pintu!.bukaan.x + r.pintu!.bukaan.w, 'pintu masuk bingkai HP');
  const lebar = rectDenganPintu(BINGKAI_LEBAR, r.pintu!.bukaan);
  assert.equal(lebar.x, BINGKAI_LEBAR.x);
});

test('transform kamera: translate lalu scale dengan origin 0 0', () => {
  assert.equal(transformKamera({ s: 0.5, x: 100, y: 40 }), 'translate(-50px, -20px) scale(0.5)');
  assert.deepEqual(pasKamera(0, 0, BINGKAI_LEBAR), { s: 1, x: 0, y: 0 });
});

// ------------------------------------------------------------------ kamera piksel bulat (mode piksel)

const DPR = [1, 1.25, 1.5, 2, 3] as const;
const padUntuk = (W: number): Pad => ({ atas: 6, bawah: W <= 520 ? 34 : 44, kiri: 4, kanan: 4 });
/** Mode piksel hanya menjaga pita bawah (tepi atas & samping boleh disentuh kotak wajib). */
const padPiksel = (W: number): Pad => ({ atas: 0, bawah: W <= 520 ? 34 : 44, kiri: 0, kanan: 0 });
/** Kotak panggung nyata (cerita.css) pada viewport 1440x900, 1920x1080, 390x844, 360x740, 844x390. */
const KOTAK_PIKSEL: Record<string, [number, number]> = { d1440: [1280, 528], d1920: [1280, 620], h390: [366, 274], h360: [336, 252], l844: [372, 274] };
/** Kotak sintetis tetap (tidak ikut geometri seni yang bisa berubah): kepala+tangan & papan nama. */
const INTI_UJI: Kotak = { x: 520, y: 200, w: 640, h: 480 };
const PAPAN_UJI: Kotak = { x: 610, y: 190, w: 440, h: 60 };
const WAJIB_UJI: Kotak = { x: 520, y: 190, w: 640, h: 490 };
/**
 * k (piksel perangkat per piksel seni) harapan untuk kotak sintetis, dihitung tangan: k = floor(min(skala muat
 * inti+papan di kotak dikurangi pita bawah, skala bingkai x 1,25) x 4 x dpr), min 1. Contoh d1440 (pita 44): muat =
 * min(1280/640, 484/490) = 0,9878; bingkai 0,8 x 1,25 = 1 -> x 4 = 3,95 -> 3 (dpr 1), x 5 = 4,94 -> 4 (1,25),
 * x 6 = 5,93 -> 5, x 8 = 7,90 -> 7, x 12 = 11,85 -> 11. d1920: muat = 576/490 = 1,176, bingkai 0,889 x 1,25 = 1,111
 * -> 4, 5, 6, 8, 13. HP 390 (366 x 274, pita 34): muat = 240/490 = 0,490 -> 1,96 -> 1, 2,45 -> 2, 2,94 -> 2,
 * 3,92 -> 3, 5,88 -> 5.
 */
const K_HARAPAN: Record<string, number[]> = {
  d1440: [3, 4, 5, 7, 11],
  d1920: [4, 5, 6, 8, 13],
  h390: [1, 2, 2, 3, 5],
  h360: [1, 2, 2, 3, 5],
  l844: [1, 2, 2, 3, 5],
};

test('piksel bulat: k per DPR 1/1,25/1,5/2/3 pada kotak 1440x900, 1920x1080, 390x844, 360x740, 844x390 (kotak sintetis)', () => {
  for (const [nama, [W, H]] of Object.entries(KOTAK_PIKSEL)) {
    const rect = rectBingkai('meja', jenisBingkai(W), INTI_UJI);
    DPR.forEach((dpr, i) => {
      const q = qPiksel(dpr);
      const k = pasKamera(W, H, rect, INTI_UJI, padUntuk(W), { q, wajib: PAPAN_UJI });
      assert.equal(pikselPerSeni(k, q), K_HARAPAN[nama]![i], `${nama} dpr ${dpr}: k ${k.s * q}`);
    });
  }
});

test('piksel bulat: skala x 4 x dpr bulat >= 1, wajib utuh di atas pita, terjemahan di piksel perangkat, k terbesar yang sah', () => {
  for (const [nama, [W, H]] of Object.entries(KOTAK_PIKSEL)) {
    const pad = padPiksel(W);
    const rect = rectBingkai('meja', jenisBingkai(W), INTI_UJI);
    const desain = pasKamera(W, H, rect, INTI_UJI, padUntuk(W));
    for (const dpr of DPR) {
      const q = qPiksel(dpr);
      const k = pasKamera(W, H, rect, INTI_UJI, padUntuk(W), { q, wajib: PAPAN_UJI });
      const n = pikselPerSeni(k, q);
      assert.ok(n !== null && n >= 1, `${nama} dpr ${dpr}: k bulat (${k.s * q})`);
      const l = keLayar(k, WAJIB_UJI);
      assert.ok(didalam(l, { x: pad.kiri, y: pad.atas, w: W - pad.kiri - pad.kanan, h: H - pad.atas - pad.bawah }, 0.01), `${nama} dpr ${dpr}: wajib ${JSON.stringify(l)}`);
      for (const t of [-k.x * k.s * dpr, -k.y * k.s * dpr]) assert.ok(Math.abs(t - Math.round(t)) < 1e-6, `${nama} dpr ${dpr}: terjemahan ${t} bukan piksel perangkat bulat`);
      const s1 = (n! + 1) / q;
      const muat = Math.min((W - pad.kiri - pad.kanan) / WAJIB_UJI.w, (H - pad.atas - pad.bawah) / WAJIB_UJI.h);
      assert.ok(s1 > muat + 1e-9 || s1 > desain.s * MAKS_LEBIH_PIKSEL + 1e-9, `${nama} dpr ${dpr}: k ${n} bukan yang terbesar`);
      const v = pandangan(k, W, H);
      const langkah = 1 / (k.s * dpr) + 1e-6;
      if (v.w <= DUNIA_W) assert.ok(v.x >= -1e-6 && v.x + v.w <= DUNIA_W + 1e-6, `${nama} dpr ${dpr}: x ${v.x}`);
      else assert.ok(Math.abs(v.x - (DUNIA_W - v.w) / 2) <= langkah, `${nama} dpr ${dpr}: letterbox x dipusatkan`);
      if (v.h <= DUNIA_H) assert.ok(v.y >= -1e-6 && v.y + v.h <= DUNIA_H + 1e-6, `${nama} dpr ${dpr}: y ${v.y}`);
      else assert.ok(Math.abs(v.y - (DUNIA_H - v.h) / 2) <= langkah, `${nama} dpr ${dpr}: letterbox y dipusatkan`);
      const m = /scale\(([\d.]+)\)/.exec(transformKamera(k));
      assert.ok(m && Math.abs(Number(m[1]) * q - n!) < 1e-4, `${nama} dpr ${dpr}: transform ${transformKamera(k)}`);
    }
  }
});

test('piksel bulat: letterbox hanya bila k bulat membuat pandangan lebih besar daripada dunia (1440x900 dpr 1 vs 1,25)', () => {
  const [W, H] = KOTAK_PIKSEL.d1440!;
  const k = pasKamera(W, H, BINGKAI_LEBAR, INTI_UJI, padUntuk(W), { q: qPiksel(1), wajib: PAPAN_UJI });
  assert.equal(k.s, 0.75);
  assert.ok(pandangan(k, W, H).w > DUNIA_W, 'pandangan lebih lebar daripada dunia');
  assert.equal(Math.round(-k.x * k.s), 40, 'dunia dipusatkan: pita tepi 40 px kiri & kanan');
  const k2 = pasKamera(W, H, BINGKAI_LEBAR, INTI_UJI, padUntuk(W), { q: qPiksel(1.25), wajib: PAPAN_UJI });
  assert.equal(k2.s, 0.8, 'dpr 1,25: skala bingkai 0,8 sudah bulat (k 4)');
  assert.ok(pandangan(k2, W, H).w <= DUNIA_W + 1e-6, 'tanpa letterbox');
});

/** Penggambar tokoh SVG (generator lama lewat seni/tokoh tanpa opsi `piksel`): panggung dengan tokoh SVG. */
const gambarSvg: PenggambarTokoh = (o) => {
  const { siapa, ...x } = o;
  return siapa === 'mentor' ? gambarMissRaksa(x as Parameters<typeof gambarMissRaksa>[0]) : gambarBuRina(x as Parameters<typeof gambarBuRina>[0]);
};

test('piksel bulat: tanpa opsi piksel kamera tidak berubah; kameraUntuk ruang SVG + tokoh SVG mengabaikan dpr', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarSvg);
  assert.ok(s.tokoh.every((t) => !pikselDari(t.gambar)), 'tokoh SVG');
  for (const [W, H] of Object.values(KOTAK_PIKSEL)) assert.deepEqual(kameraUntuk(s, W, H, { dpr: 2 }), kameraUntuk(s, W, H));
});

test('piksel bulat: ruang SVG (PNG ruang gagal) + tokoh RASTER = kamera tetap k bulat, kepala & tangan utuh', () => {
  const s = susunAdegan(DUA, ruangSementara('meja'), gambarTokoh);
  assert.ok(s.tokoh.length === 2 && s.tokoh.every((t) => !!pikselDari(t.gambar)), 'penggambar panggung = tokoh raster (atlas nyata)');
  for (const [nama, [W, H]] of Object.entries(KOTAK_PIKSEL)) {
    for (const dpr of DPR) {
      const k = kameraUntuk(s, W, H, { dpr });
      assert.ok(pikselPerSeni(k, qPiksel(dpr)) !== null, `${nama} dpr ${dpr}: k bulat`);
    }
  }
});

test('piksel bulat: kameraUntuk ruang raster = k bulat, kepala + tangan + papan nama utuh; bingkai kedatangan memuat pintu', () => {
  const r0 = ruangSementara('meja');
  const ruang = {
    ...r0,
    latar: lapisanPiksel('uji.png', { w: 400, h: 225 }, { x: 0, y: 0, w: 400, h: 225 }, 0, 0),
    papanNama: { x: 612, y: 196, w: 440, h: 60, ukuranHuruf: 42, warna: '#fff' },
  };
  const s = susunAdegan(DUA, ruang, gambarTokoh);
  for (const [nama, [W, H]] of Object.entries(KOTAK_PIKSEL)) {
    const pad = padPiksel(W);
    for (const dpr of DPR) {
      const q = qPiksel(dpr);
      const k = kameraUntuk(s, W, H, { dpr });
      const n = pikselPerSeni(k, q);
      assert.ok(n !== null, `${nama} dpr ${dpr}: bulat`);
      const l = keLayar(k, gabungKotak(s.inti, ruang.papanNama)!);
      assert.ok(didalam(l, { x: pad.kiri, y: pad.atas, w: W - pad.kiri - pad.kanan, h: H - pad.atas - pad.bawah }, 0.01) || n === 1, `${nama} dpr ${dpr}: wajib ${JSON.stringify(l)}`);
      const kp = kameraUntuk(s, W, H, { dpr, pintu: true });
      assert.ok(pikselPerSeni(kp, q) !== null, `${nama} dpr ${dpr}: bingkai pintu bulat`);
      const pintu = keLayar(kp, ruang.pintu!.bukaan);
      assert.ok(pintu.x >= -0.01 && pintu.x + pintu.w <= W + 0.01, `${nama} dpr ${dpr}: bukaan pintu terlihat mendatar ${JSON.stringify(pintu)}`);
    }
  }
});

test('piksel bulat: asal kotak panggung di pecahan piksel perangkat (mis. tepi 1 px pada dpr 1,5): asal + terjemahan bulat', () => {
  for (const [nama, [W, H]] of Object.entries(KOTAK_PIKSEL)) {
    for (const dpr of DPR) {
      for (const asal of [{ x: 0.5, y: 0.25 }, { x: 0.333, y: 0.75 }]) {
        const q = qPiksel(dpr);
        const k = pasKamera(W, H, rectBingkai('meja', jenisBingkai(W), INTI_UJI), INTI_UJI, padUntuk(W), { q, wajib: PAPAN_UJI, asal });
        const dx = asal.x - k.x * k.s * dpr;
        const dy = asal.y - k.y * k.s * dpr;
        assert.ok(Math.abs(dx - Math.round(dx)) < 1e-6 && Math.abs(dy - Math.round(dy)) < 1e-6, `${nama} dpr ${dpr} asal ${JSON.stringify(asal)}: ${dx}, ${dy}`);
        const l = keLayar(k, WAJIB_UJI);
        const pad = padPiksel(W);
        assert.ok(didalam(l, { x: pad.kiri, y: pad.atas, w: W, h: H - pad.bawah }, 1 / dpr + 0.01), `${nama} dpr ${dpr}: wajib ${JSON.stringify(l)}`);
      }
    }
  }
});

test('qPiksel & pikselPerSeni', () => {
  assert.equal(qPiksel(1), 4);
  assert.equal(qPiksel(1.5), 6);
  assert.equal(qPiksel(0), 4, 'dpr tidak sah = 1');
  assert.equal(pikselPerSeni({ s: 0.75, x: 0, y: 0 }, 4), 3);
  assert.equal(pikselPerSeni({ s: 0.8, x: 0, y: 0 }, 4), null, 'skala bingkai 0,8 x 4 = 3,2 bukan bulat');
  assert.equal(pikselPerSeni({ s: 5 / 6, x: 0, y: 0 }, 6), 5);
});

// ------------------------------------------------------------------ bingkai kedatangan/kepergian v5 (review HP 28 Sep)

const AWAL_BERDIRI: KomposisiAdegan = {
  lokasi: 'meja',
  mentor: { pose: 'berdiri-sambut', ekspresi: 'tersenyum', pandang: 'pemain' },
  nasabah: null,
  pembicara: 'mentor',
  prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' },
  aksi: null,
  pembuka: true,
};
const DUDUK_MASUK: KomposisiAdegan = { ...DUA, aksi: { jenis: 'masuk', kunci: 'uji#masuk' } };
/** Kotak panggung nyata + kotak HP kecil (412 px dpr 2,625; 360 px dpr 3) untuk bingkai pintu. */
const KOTAK_PINTU: Record<string, [number, number, readonly number[]]> = {
  d1440: [1280, 528, [1, 1.25, 1.5]],
  d1920: [1280, 620, [1]],
  h390: [366, 275, [2, 3]],
  h412: [388, 290, [2.625]],
  h360: [336, 252, [2, 3]],
  l844: [362, 274, [2]],
};
const kPiksel = (k: { s: number }, dpr: number) => Math.round(k.s * qPiksel(dpr) * 1000) / 1000;

test('kedatangan & kepergian (mode piksel): skala piksel = kamera percakapan, tidak pernah menjauh ke seluruh ruangan', () => {
  const r = ruangAdegan('meja');
  const duduk = susunAdegan(DUDUK_MASUK, r, gambarTokoh);
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const konv = kameraUntuk(duduk, W, H, { dpr });
      for (const jenis of ['masuk', 'pergi'] as const) {
        const k = kameraPintu(duduk, W, H, jenis, gambarTokoh, { dpr });
        assert.equal(kPiksel(k, dpr), kPiksel(konv, dpr), `${nama} dpr ${dpr} ${jenis}: k ${kPiksel(k, dpr)} = k percakapan ${kPiksel(konv, dpr)}`);
        const n = pikselPerSeni(k, qPiksel(dpr));
        assert.ok(n !== null && n > 1, `${nama} dpr ${dpr} ${jenis}: k bulat > 1`);
        for (const t of [-k.x * k.s * dpr, -k.y * k.s * dpr]) assert.ok(Math.abs(t - Math.round(t)) < 1e-6, `${nama} dpr ${dpr} ${jenis}: terjemahan ${t} di piksel perangkat`);
        const v = pandangan(k, W, H);
        if (v.w <= DUNIA_W) assert.ok(v.x >= -1e-6 && v.x + v.w <= DUNIA_W + 1e-6, `${nama} dpr ${dpr} ${jenis}: di dalam dunia`);
        if (v.h <= DUNIA_H) assert.ok(v.y >= -1e-6 && v.y + v.h <= DUNIA_H + 1e-6, `${nama} dpr ${dpr} ${jenis}: di dalam dunia (tegak)`);
      }
    }
  }
});

test('kedatangan (mode piksel): kepala Miss Raksa mempersilakan + Bu Rina berdiri utuh (rapat), sebagian pintu tampak di HP; desktop = kamera percakapan', () => {
  const r = ruangAdegan('meja');
  const duduk = susunAdegan(DUDUK_MASUK, r, gambarTokoh);
  const berdiri = kepalaBerdiri(duduk, true, gambarTokoh)!;
  const b = r.pintu!.bukaan;
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const k = kameraPintu(duduk, W, H, 'masuk', gambarTokoh, { dpr });
      const v = pandangan(k, W, H);
      const lebih = Math.max(0, berdiri.w - v.w) / 2;
      // Kotak kepala rapat masih bermargin ± 5 piksel seni: kelebihan (HP 360 px dpr 3) dibagi rata, maks 3 piksel seni.
      assert.ok(lebih <= 12, `${nama} dpr ${dpr}: kelebihan wajib ${lebih} satuan per sisi`);
      // Toleransi 1 piksel perangkat (pembulatan terjemahan ke piksel perangkat) bila wajib dibagi rata.
      const t = lebih > 0 ? 1 / (k.s * dpr) + 1e-6 : 1e-6;
      assert.ok(v.x <= berdiri.x + lebih + t && v.x + v.w >= berdiri.x + berdiri.w - lebih - t, `${nama} dpr ${dpr}: kepala kedua tokoh berdiri utuh mendatar ${JSON.stringify(v)} vs ${JSON.stringify(berdiri)}`);
      assert.ok(v.y <= berdiri.y + 1e-6, `${nama} dpr ${dpr}: puncak kepala berdiri terlihat`);
      if (nama.startsWith('d')) {
        const konv = kameraUntuk(duduk, W, H, { dpr });
        if (nama === 'd1440' && dpr === 1) assert.ok(samaKamera(k, konv), `${nama} dpr ${dpr}: kedatangan desktop tanpa gerak kamera`);
        assert.ok(v.x + v.w >= b.x + b.w - 1e-6, `${nama} dpr ${dpr}: seluruh bukaan pintu tampak di desktop`);
      }
      if (dpr === 2) assert.ok(v.x + v.w >= b.x + (nama === 'h390' || nama === 'l844' ? 96 : 40), `${nama} dpr 2: sebagian bukaan pintu tampak (>= 24 / 10 piksel seni) (tepi kanan ${Math.round(v.x + v.w)} vs bukaan ${b.x})`);
    }
  }
});

test('kepergian (mode piksel): Miss Raksa yang tetap duduk (kepala + tangan di meja) utuh', () => {
  const r = ruangAdegan('meja');
  const duduk = susunAdegan(DUA, r, gambarTokoh);
  const miss = duduk.tokoh.find((t) => t.siapa === 'mentor')!;
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const k = kameraPintu(duduk, W, H, 'pergi', gambarTokoh, { dpr });
      const v = pandangan(k, W, H);
      const p = kotakPenting(miss, true);
      assert.ok(v.x <= p.x + 12 && v.y <= p.y + 1e-6 && v.y + v.h >= p.y + p.h - 1e-6, `${nama} dpr ${dpr}: Miss Raksa duduk utuh ${JSON.stringify(v)} vs ${JSON.stringify(p)}`);
    }
  }
});

test('letterbox mendatar ruang layanan RATA KANAN: tepi kanan dunia (pintu) = tepi kanan panggung, perpanjangan tepi hanya di kiri', () => {
  const r = ruangAdegan('meja');
  const duduk = susunAdegan(DUA, r, gambarTokoh);
  assert.ok(pintuDiTepiKanan(duduk));
  const [W, H] = KOTAK_PIKSEL.d1440!;
  const k = kameraUntuk(duduk, W, H, { dpr: 1 });
  const v = pandangan(k, W, H);
  assert.ok(v.w > DUNIA_W, 'd1440 dpr 1: pandangan lebih lebar daripada dunia');
  assert.ok(Math.abs(v.x + v.w - DUNIA_W) <= 1 / k.s + 1e-6, `tepi kanan dunia rata kanan panggung (${v.x + v.w})`);
  assert.ok(v.x < 0, 'perpanjangan tepi di kiri');
  // Ruang sementara (pintu tidak di tepi kanan dunia) tetap dipusatkan.
  assert.ok(!pintuDiTepiKanan(susunAdegan(DUA, ruangSementara('meja'), gambarTokoh)));
});

test('rencana kedatangan HP (390/360/844 dpr 2, 390 dpr 3): skala kamera tidak pernah di bawah skala percakapan & tidak bolak-balik', () => {
  const r = ruangAdegan('meja');
  const awal = susunAdegan(AWAL_BERDIRI, r, gambarTokoh);
  const duduk = susunAdegan(DUDUK_MASUK, r, gambarTokoh);
  for (const [W, H, dpr] of [[366, 275, 2], [336, 252, 2], [362, 274, 2], [366, 275, 3]] as const) {
    const pabrik = pabrikTransisi({
      lama: awal, baru: duduk, aksi: DUDUK_MASUK.aksi, aksiBaru: true, hadapKanan: () => true, dudukTurun: () => true, dudukTurunMentor: () => true, gambar: gambarTokoh, dpr,
    })!;
    const rc = pabrik(W, H)!;
    assert.equal(rc.jenis, 'masuk');
    const kam = rc.gerak.find((g) => g.target === 'kamera');
    assert.ok(kam, `${W}x${H}@${dpr}: kamera bergerak (pembuka dekat -> pintu -> percakapan)`);
    const skala = kam!.keyframes.map((f) => Number(/scale\(([\d.]+)\)/.exec(String(f.transform))![1]));
    const akhir = skala[skala.length - 1]!;
    assert.ok(skala.every((s) => s >= akhir - 1e-6), `${W}x${H}@${dpr}: skala ${skala.join(', ')} >= skala percakapan ${akhir}`);
    for (let i = 1; i < skala.length; i++) assert.ok(skala[i]! <= skala[i - 1]! + 1e-6, `${W}x${H}@${dpr}: skala tidak naik lagi (${skala.join(', ')})`);
  }
});

// ------------------------------------------------------------------ bingkai pintu kedatangan HP (v5.1, review 29 Sep)

test('kedatangan HP sempit (mode piksel): bingkai PINTU dulu = seluruh bukaan tampak, skala & tinggi sama dengan bingkai kedatangan; desktop & HP lebar tanpa bingkai pintu', () => {
  const r = ruangAdegan('meja');
  const duduk = susunAdegan(DUDUK_MASUK, r, gambarTokoh);
  const b = r.pintu!.bukaan;
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const { pintu, bukaan } = kameraKedatangan(duduk, W, H, gambarTokoh, { dpr });
      assert.ok(samaKamera(pintu, kameraPintu(duduk, W, H, 'masuk', gambarTokoh, { dpr })), `${nama} dpr ${dpr}: bingkai kedatangan tetap kameraPintu`);
      const vp = pandangan(pintu, W, H);
      const satu = 1 / (pintu.s * dpr) + 1e-6;
      if (vp.x + vp.w >= b.x + b.w - satu) {
        assert.equal(bukaan, null, `${nama} dpr ${dpr}: bukaan sudah utuh di bingkai kedatangan = tanpa bingkai pintu`);
        continue;
      }
      assert.ok(bukaan, `${nama} dpr ${dpr}: bukaan terpotong di bingkai kedatangan (tepi kanan ${Math.round(vp.x + vp.w)}) = ada bingkai pintu`);
      const v = pandangan(bukaan!, W, H);
      assert.equal(bukaan!.s, pintu.s, `${nama} dpr ${dpr}: skala bingkai pintu = bingkai kedatangan (tokoh tidak mengecil)`);
      assert.equal(bukaan!.y, pintu.y, `${nama} dpr ${dpr}: tanpa gerak tegak`);
      assert.ok(v.x + v.w >= b.x + b.w - satu && v.x >= -1e-6, `${nama} dpr ${dpr}: seluruh bukaan tampak (${Math.round(v.x)}..${Math.round(v.x + v.w)})`);
      assert.ok(v.x > vp.x, `${nama} dpr ${dpr}: bingkai pintu di kanan bingkai kedatangan`);
      const t = -bukaan!.x * bukaan!.s * dpr;
      assert.ok(Math.abs(t - Math.round(t)) < 1e-6, `${nama} dpr ${dpr}: terjemahan ${t} di piksel perangkat`);
    }
  }
  // Ukuran review (360 x 740 & 390 x 844 dpr 2) dan iPhone 390 dpr 3 memang memakai bingkai pintu; desktop tidak.
  for (const [W, H, dpr] of [[336, 252, 2], [366, 275, 2], [366, 275, 3]] as const) assert.ok(kameraKedatangan(duduk, W, H, gambarTokoh, { dpr }).bukaan, `${W}x${H}@${dpr}: bingkai pintu`);
  for (const dpr of [1, 1.25, 1.5]) assert.equal(kameraKedatangan(duduk, 1280, 528, gambarTokoh, { dpr }).bukaan, null, `desktop dpr ${dpr}: tanpa bingkai pintu`);
  // Ruang SVG / tanpa dpr: tanpa bingkai pintu (bingkai lama).
  assert.equal(kameraKedatangan(duduk, 336, 252, gambarTokoh, {}).bukaan, null);
});

test('rencana kedatangan HP sempit: sambutan -> bingkai pintu (pintu masih tertutup) -> hanya ke kiri: bingkai kedatangan -> percakapan, skala sama; desktop tanpa bingkai pintu', () => {
  const r = ruangAdegan('meja');
  const awal = susunAdegan(AWAL_BERDIRI, r, gambarTokoh);
  const duduk = susunAdegan(DUDUK_MASUK, r, gambarTokoh);
  const J = JADWAL_MASUK;
  const geserDari = (tr: string) => { const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(tr)!; return { tx: Number(m[1]), ty: Number(m[2]), s: Number(m[3]) }; };
  for (const [W, H, dpr] of [[336, 252, 2], [366, 275, 2], [366, 275, 3], [362, 274, 2], [1280, 528, 1]] as const) {
    const pabrik = pabrikTransisi({
      lama: awal, baru: duduk, aksi: DUDUK_MASUK.aksi, aksiBaru: true, hadapKanan: () => true, dudukTurun: () => true, dudukTurunMentor: () => true, gambar: gambarTokoh, dpr,
    })!;
    const rc = pabrik(W, H)!;
    const kam = rc.gerak.find((g) => g.target === 'kamera')!;
    const kk = kameraKedatangan(duduk, W, H, gambarTokoh, { dpr });
    const pada = (t: number) => kam.keyframes.filter((f) => Math.abs((f.offset as number) * rc.durasi - t) < 1).map((f) => String(f.transform));
    if (!kk.bukaan) {
      assert.ok(!kam.keyframes.some((f) => Math.abs((f.offset as number) * rc.durasi - J.kameraMeja[0]) < 1), `${W}x${H}@${dpr}: tanpa bingkai pintu = jejak kamera lama`);
      continue;
    }
    const tb = transformKamera(kk.bukaan);
    const tp = transformKamera(kk.pintu);
    assert.ok(pada(J.kameraPintu).includes(tb), `${W}x${H}@${dpr}: kamera tiba di bingkai pintu pada ${J.kameraPintu} md`);
    assert.ok(pada(J.kameraMeja[0]).includes(tb), `${W}x${H}@${dpr}: bingkai pintu ditahan sampai ${J.kameraMeja[0]} md`);
    assert.ok(pada(J.kameraMeja[1]).includes(tp) && pada(J.kamera[0]).includes(tp), `${W}x${H}@${dpr}: bingkai kedatangan saat Miss Raksa mempersilakan`);
    // Pintu masih tertutup saat kamera tiba; Bu Rina muncul sesudah pintu mulai terbuka dan selagi bingkai pintu ditahan.
    assert.ok(J.pintuBuka[0] >= J.kameraPintu && J.jalan[0] < J.kameraMeja[0] && J.mentorToleh >= J.kameraMeja[0], 'urutan: kamera tiba -> pintu terbuka -> Bu Rina masuk -> geser ke meja saat mempersilakan');
    // Sesudah tiba di bingkai pintu: skala tetap (= percakapan), pandangan hanya bergeser ke kiri (tidak bolak-balik).
    const sesudah = kam.keyframes.filter((f) => (f.offset as number) * rc.durasi >= J.kameraPintu - 1).map((f) => geserDari(String(f.transform)));
    const sAkhir = sesudah[sesudah.length - 1]!.s;
    assert.ok(sesudah.every((g) => Math.abs(g.s - sAkhir) < 1e-6), `${W}x${H}@${dpr}: skala sama sesudah bingkai pintu`);
    for (let i = 1; i < sesudah.length; i++) assert.ok(sesudah[i]!.tx >= sesudah[i - 1]!.tx - 1e-6, `${W}x${H}@${dpr}: kamera hanya ke kiri sesudah bingkai pintu (${sesudah.map((g) => g.tx).join(', ')})`);
  }
});

test('kepergian HP (v5.1): satu geser ke bingkai kepergian lalu DIAM (tanpa kembali di ujung gerak); bingkai percakapan kembali di baris berikutnya; desktop tanpa perubahan', () => {
  const r = ruangAdegan('meja');
  const PERGI_AKSI = { jenis: 'pergi' as const, kunci: 'uji#pergi' };
  const kosong: KomposisiAdegan = { ...DUA, nasabah: null, pembicara: null, prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' }, aksi: PERGI_AKSI };
  const duduk = susunAdegan(DUA, r, gambarTokoh);
  const sesudah = susunAdegan(kosong, r, gambarTokoh);
  const miss = sesudah.tokoh.find((t) => t.siapa === 'mentor')!;
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const lbl = `${nama} dpr ${dpr}`;
      const diamPergi = kameraDiam(sesudah, W, H, PERGI_AKSI, gambarTokoh, { dpr });
      const percakapan = kameraUntuk(sesudah, W, H, { dpr });
      assert.ok(samaKamera(kameraDiam(sesudah, W, H, null, gambarTokoh, { dpr }), percakapan), `${lbl}: baris tanpa aksi = kamera percakapan`);
      assert.ok(samaKamera(diamPergi, kameraPintu(sesudah, W, H, 'pergi', gambarTokoh, { dpr })), `${lbl}: baris kepergian diam di bingkai kepergian`);
      assert.equal(kPiksel(diamPergi, dpr), kPiksel(percakapan, dpr), `${lbl}: skala sama dengan percakapan`);
      const v = pandangan(diamPergi, W, H);
      const p = kotakPenting(miss, true);
      assert.ok(v.x <= p.x + 12 && v.y <= p.y + 1e-6 && v.y + v.h >= p.y + p.h - 1e-6, `${lbl}: Miss Raksa duduk utuh di bingkai kepergian`);
      // Rencana pergi: kamera tidak kembali; kamera akhir = kamera diam baris kepergian.
      const rc = pabrikTransisi({ lama: duduk, baru: sesudah, aksi: PERGI_AKSI, aksiBaru: true, hadapKanan: () => true, dudukTurun: () => true, gambar: gambarTokoh, dpr })!(W, H)!;
      assert.equal(rc.jenis, 'pergi');
      const kam = rc.gerak.find((g) => g.target === 'kamera');
      if (samaKamera(diamPergi, percakapan)) {
        assert.ok(!kam, `${lbl}: bingkai kepergian = percakapan -> kamera tidak bergerak`);
        continue;
      }
      const tr = kam!.keyframes.map((f) => String(f.transform));
      assert.equal(tr[0], transformKamera(percakapan), `${lbl}: mulai dari kamera percakapan (Bu Rina masih duduk)`);
      const tiba = tr.findIndex((x) => x === transformKamera(diamPergi));
      assert.ok(tiba > 0 && tr.slice(tiba).every((x) => x === transformKamera(diamPergi)), `${lbl}: satu geser lalu diam di bingkai kepergian (${tr.join(' | ')})`);
      // Baris berikutnya (Miss Raksa bicara, gambar sama, tanpa aksi): kamera kembali ke percakapan lewat geser biasa.
      const lanjut = pabrikTransisi({ lama: sesudah, baru: sesudah, aksi: null, aksiLama: PERGI_AKSI, aksiBaru: false, hadapKanan: () => true, gambar: gambarTokoh, dpr });
      const g = lanjut?.(W, H);
      const kg = g?.gerak.find((x) => x.target === 'kamera');
      assert.ok(g && g.jenis === 'ganti' && kg, `${lbl}: baris sesudahnya = geser kamera ke percakapan`);
      assert.equal(String(kg!.keyframes[kg!.keyframes.length - 1]!.transform), transformKamera(percakapan));
    }
  }
  // Desktop 1440 dpr 1: bingkai kepergian = percakapan (kamera tidak bergerak; di zoom 125-150 % pandangan lebih sempit,
  // jadi kepergian memakai aturan HP di atas: satu geser lalu diam).
  for (const dpr of [1]) assert.ok(samaKamera(kameraDiam(sesudah, 1280, 528, PERGI_AKSI, gambarTokoh, { dpr }), kameraUntuk(sesudah, 1280, 528, { dpr })), `desktop dpr ${dpr}`);
});

// ------------------------------------------------------------------ percakapan di meja: satu kamera (v5 komposisi meja)

/** Baris duduk yang berbeda pose/gestur/prop (termasuk menunjuk kartu & Bu Rina condong memegang kunci di lutut). */
const BARIS_DUDUK: Record<string, KomposisiAdegan> = {
  dengar: DUA,
  kartu: { ...DUA, mentor: { pose: 'duduk-tunjuk', ekspresi: 'serius', pandang: 'bawah' }, nasabah: { pose: 'duduk', ekspresi: 'lega', pandang: 'bawah', lewatTelepon: false }, prop: { kunci: 'meja', kartu: 'meja', telepon: 'meja' } },
  jelaskanPemain: { ...DUA, mentor: { pose: 'duduk-jelaskan', ekspresi: 'tersenyum', pandang: 'pemain' }, nasabah: { pose: 'duduk', ekspresi: 'kesal', pandang: 'lawan', lewatTelepon: false } },
  condong: { ...DUA, nasabah: { pose: 'duduk-condong', ekspresi: 'senang', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' } },
  kursiKosong: { ...DUA, nasabah: null, pembicara: 'mentor' },
};

test('percakapan di meja (mode piksel): SATU kamera untuk semua baris duduk (tunjuk kartu, condong, kursi kosong), k percakapan tetap', () => {
  const r = ruangAdegan('meja');
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    for (const dpr of dprs) {
      const kamera = Object.entries(BARIS_DUDUK).map(([b, k]) => [b, kameraUntuk(susunAdegan(k, r, gambarTokoh), W, H, { dpr })] as const);
      const [, acuan] = kamera[0]!;
      for (const [b, k] of kamera) assert.ok(samaKamera(k, acuan), `${nama} dpr ${dpr}: baris ${b} ${JSON.stringify(k)} = dengar ${JSON.stringify(acuan)}`);
      assert.ok((pikselPerSeni(acuan, qPiksel(dpr)) ?? 0) >= 3, `${nama} dpr ${dpr}: k percakapan ${pikselPerSeni(acuan, qPiksel(dpr))}`);
    }
  }
});

test('percakapan di meja (mode piksel): Miss Raksa + landasan kartu di atas pita label; Bu Rina utuh di panggung & tidak di bawah label suasana (kiri)', () => {
  const r = ruangAdegan('meja');
  for (const [nama, [W, H, dprs]] of Object.entries(KOTAK_PINTU)) {
    const pad = padPiksel(W);
    for (const dpr of dprs) {
      for (const [b, komp] of Object.entries(BARIS_DUDUK)) {
        const s = susunAdegan(komp, r, gambarTokoh);
        const k = kameraUntuk(s, W, H, { dpr });
        const tol = 1 / dpr + 0.01;
        const m = s.tokoh.find((t) => t.siapa === 'mentor')!;
        const km = r.tempat.kartuMeja!;
        const zona = { x: km.x - 68, y: km.y - 40, w: 136, h: 80 };
        for (const [apa, kotak] of [['Miss Raksa', kotakPenting(m)], ['landasan kartu', zona]] as const) {
          assert.ok(didalam(keLayar(k, kotak), { x: 0, y: 0, w: W, h: H - pad.bawah }, tol), `${nama} dpr ${dpr} ${b}: ${apa} di atas pita bawah`);
        }
        const n = s.tokoh.find((t) => t.siapa === 'nasabah');
        if (!n) continue;
        const l = keLayar(k, kotakPenting(n));
        assert.ok(didalam(l, { x: 0, y: 0, w: W, h: H }, tol), `${nama} dpr ${dpr} ${b}: Bu Rina utuh ${JSON.stringify(l)}`);
        // Label suasana: pita bawah kiri (cerita.css .cer-suasana: left 8 px, maks 58 % lebar; teks 'Bu Rina · <perasaan>'
        // 13 px ± 110-150 px), jadi zona label = min(58 %, 240 px).
        assert.ok(l.x >= Math.min(0.58 * W, 240) || l.y + l.h <= H - pad.bawah + tol, `${nama} dpr ${dpr} ${b}: Bu Rina tidak di bawah label suasana ${JSON.stringify(l)}`);
      }
    }
  }
});
