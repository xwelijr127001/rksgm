/**
 * Lapisan ruang v4 PIKSEL (docs/cerita/aset/RUANG.md). SVG: semua lokasi punya generator final, SVG rapi & aman (tanpa
 * teks/gambar luar), id gradien unik. GEOMETRI piksel: semua titik tempat/jangkar/kotak kelipatan 4 (1 piksel seni =
 * 4 satuan), tokoh selalu skala 1 (jalur masuk tanpa skala pecahan), wajah piksel kedua tokoh duduk bebas dari
 * monitor/meja/pintu/plakat dan muat di bingkai HP bersama teks plakat, telepon & landasan kartu, kartu disodorkan dari
 * tepi dekat meja di sisi pemain. KELUARAN piksel (seni/piksel/ruang.json + ruang-*.png): segar terhadap geometri,
 * PNG native (ukuran dunia = PNG × 4), alpha biner, warna dari palet bersama <= 48, teks plakat = LOKASI_AUTO_1.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { DAFTAR_LOKASI_ADEGAN } from '../../tipe';
import { LOKASI_AUTO_1 } from '../../episode/auto-1/teks';
import {
  BINGKAI_PIKSEL, CAKRAWALA, GARIS_MEJA_MENTOR, JALUR_DEPAN_MULAI, KURSI, LANDASAN_KARTU, LILIN_X, MEJA, MONITOR, PAPAN, PIKSEL,
  PINGGUL_DI_BAWAH_MEJA, PINTU, SEKAT, TEKS_PAPAN, TINGGI_LILIN, UKURAN_TOKOH_PIKSEL, kepalaDudukPiksel, yTepiJauh,
} from './geometri';
import { BENTUK_KURSI, KOTAK_KURSI, titikKursi } from './kursi';
import {
  propCangkir, propGagang, propKartuPolis, propKartuTangan, propKunci, propMap, propTelepon, ruangAdegan, yTepiDekat, type PropRuang,
} from './index';
import { BINGKAI_LUAR } from './luar';
import { CANGKIR } from './meja';
import { PENYOK_PARKIRAN } from './parkiran';
import { SUDUT_KARTU } from './prop';
import { ruangSementara } from './sementara';
import type { LapisanSvg, RuangAdegan } from './tipe';

type Kotak = { x: number; y: number; w: number; h: number };
const beririsan = (a: Kotak, b: Kotak): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const di = (a: Kotak, b: Kotak): boolean => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const lebarkan = (k: Kotak, m: number): Kotak => ({ x: k.x - m, y: k.y - m, w: k.w + 2 * m, h: k.h + 2 * m });
const HP: Kotak = BINGKAI_PIKSEL.hp;
const U = UKURAN_TOKOH_PIKSEL;
const kelipatan = (v: number) => Number.isInteger(v / PIKSEL);

const lapisanDari = (r: RuangAdegan): [string, LapisanSvg][] =>
  ([
    ['latar', r.latar],
    ['koridor', r.koridor],
    ['daun', r.pintu?.daun],
    ['belakangMeja', r.belakangMeja],
    ['depanMeja', r.depanMeja],
    ['kursiBelakang', r.kursi?.belakang],
    ['kursiDepan', r.kursi?.depan],
  ] as [string, LapisanSvg | undefined][]).filter((x): x is [string, LapisanSvg] => !!x[1]);

/** Pemeriksa tag sederhana: setiap elemen terbuka ditutup berurutan (SVG yang disuntikkan panggung harus rapi). */
function tagSeimbang(svg: string): boolean {
  const tumpuk: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    const [, tutup, nama, sendiri] = m;
    if (sendiri) continue;
    if (tutup) {
      if (tumpuk.pop() !== nama) return false;
    } else tumpuk.push(nama);
  }
  return tumpuk.length === 0;
}

const kotakProp = (p: PropRuang, t: { x: number; y: number }): Kotak => ({ x: t.x - p.jangkar.x, y: t.y - p.jangkar.y, w: p.w, h: p.h });

// ------------------------------------------------------------------ SVG (cadangan & sumber piksel)

test('semua lokasi: generator final, lapisan valid & rapi, kotak kelipatan 4, tanpa teks/gambar/tautan luar, di-cache', () => {
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    const r = ruangAdegan(lok);
    assert.equal(r.lokasi, lok);
    assert.notEqual(r.latar.svg, ruangSementara(lok).latar.svg, `${lok}: bukan pengganti sementara`);
    assert.deepEqual([r.latar.x, r.latar.y, r.latar.w, r.latar.h], [0, 0, 1600, 900], `${lok}: latar menutup dunia`);
    for (const [nama, l] of lapisanDari(r)) {
      assert.ok(l.svg.length > 100 && l.w > 0 && l.h > 0 && Number.isFinite(l.x + l.y), `${lok}.${nama}: ukuran & isi`);
      assert.ok(l.x >= 0 && l.y >= 0 && l.x + l.w <= 1600 && l.y + l.h <= 900, `${lok}.${nama}: di dalam dunia`);
      assert.ok([l.x, l.y, l.w, l.h].every(kelipatan), `${lok}.${nama}: kotak ${[l.x, l.y, l.w, l.h]} kelipatan ${PIKSEL}`);
      assert.ok(!/<text|<image|<script|<foreignObject|href=|https?:|NaN|undefined/.test(l.svg), `${lok}.${nama}: tanpa teks/gambar/tautan`);
      assert.ok(tagSeimbang(l.svg), `${lok}.${nama}: tag seimbang`);
    }
    assert.equal(ruangAdegan(lok), r, `${lok}: di-cache`);
  }
});

test('id gradien/klip: berawalan rg-, unik lintas SEMUA lapisan & lokasi, dan setiap url(#…) merujuk id di lapisan yang sama', () => {
  const semua = new Set<string>();
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    for (const [nama, l] of lapisanDari(ruangAdegan(lok))) {
      const ids = [...l.svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
      for (const id of ids) {
        assert.ok(id.startsWith(`rg-${lok}-`), `${lok}.${nama}: id ${id} berawalan lokasi`);
        assert.ok(!semua.has(id), `${lok}.${nama}: id ${id} unik`);
        semua.add(id);
      }
      for (const m of l.svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), `${lok}.${nama}: url(#${m[1]}) terdefinisi di lapisan ini`);
    }
  }
  assert.ok(semua.size > 30);
});

// ------------------------------------------------------------------ geometri piksel

test('grid piksel: semua titik tempat, jalur, prop, kotak penting & bingkai saran kelipatan 4; tokoh skala 1', () => {
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    const t = ruangAdegan(lok).tempat;
    assert.equal(t.skalaMentor, 1, `${lok}: Miss Raksa skala 1`);
    assert.equal(t.skalaNasabah, 1, `${lok}: Bu Rina skala 1`);
    const titik = [t.mentor, t.mentorBerdiri, t.nasabahDuduk, t.nasabahBerdiri, ...t.jalurMasuk.map((j) => j.titik), t.kartuSimpan, t.kartuMeja, t.kunciMeja, t.telepon];
    for (const p of titik) if (p) assert.ok(kelipatan(p.x) && kelipatan(p.y), `${lok}: titik ${p.x},${p.y} kelipatan ${PIKSEL}`);
    for (const j of t.jalurMasuk) assert.equal(j.skala, 1, `${lok}: jalur skala 1`);
    if (t.garisMejaMentor !== undefined) assert.ok(kelipatan(t.garisMejaMentor), `${lok}: garis meja`);
  }
  for (const k of [PINTU, LANDASAN_KARTU, MONITOR, KOTAK_KURSI, BINGKAI_PIKSEL.hp, BINGKAI_PIKSEL.lebar, BINGKAI_PIKSEL.datang, { x: PAPAN.x, y: PAPAN.y, w: PAPAN.w, h: PAPAN.h }, TEKS_PAPAN]) {
    assert.ok([k.x, k.y, k.w, k.h].every(kelipatan), `kotak ${JSON.stringify(k)} kelipatan ${PIKSEL}`);
  }
  for (const [x, y] of [MEJA.JB, MEJA.JK, MEJA.DK, MEJA.DB, [CANGKIR.x, CANGKIR.y], [KURSI.x, KURSI.y]]) assert.ok(kelipatan(x) && kelipatan(y), `titik ${x},${y}`);
  for (const p of [propKartuPolis(), propKartuTangan(), propKunci(), propTelepon(), propTelepon({ gagang: false }), propGagang(), propMap(), propCangkir()]) {
    assert.ok([p.w, p.h, p.jangkar.x, p.jangkar.y].every(kelipatan), `prop ${p.w}x${p.h} jangkar ${p.jangkar.x},${p.jangkar.y}`);
  }
});

test('meja: wajah piksel kedua tokoh duduk bebas dari monitor, meja, kursi, pintu & plakat; muat di bingkai HP bersama teks', () => {
  for (const lok of ['meja', 'telepon'] as const) {
    const r = ruangAdegan(lok);
    const t = r.tempat;
    const mentor = kepalaDudukPiksel('mentor');
    const rina = kepalaDudukPiksel('nasabah');
    for (const [nama, w] of [['Miss Raksa', mentor], ['Bu Rina', rina]] as const) {
      for (const l of [r.belakangMeja!, r.depanMeja!]) assert.ok(!beririsan(w, l), `${lok}: ${nama} tidak tertutup lapisan meja`);
      assert.ok(!beririsan(w, MONITOR), `${lok}: monitor tidak menutupi wajah ${nama}`);
      assert.ok(!beririsan(w, r.pintu!.bukaan) && w.x + w.w <= SEKAT.x - SEKAT.sisi, `${lok}: wajah ${nama} tidak di depan sekat/pintu`);
      assert.ok(!beririsan(w, TEKS_PAPAN), `${lok}: teks plakat tidak di balik wajah ${nama}`);
      assert.ok(di(w, HP), `${lok}: wajah ${nama} utuh di bingkai HP`);
    }
    assert.ok(di(TEKS_PAPAN, HP) && di({ x: PAPAN.x, y: PAPAN.y - 8, w: PAPAN.w, h: PAPAN.h + 8 }, HP), `${lok}: plakat & teks di bingkai HP`);
    assert.ok(di(TEKS_PAPAN, { x: PAPAN.x, y: PAPAN.y, w: PAPAN.w, h: PAPAN.h }), `${lok}: kotak teks di dalam plakat`);
    // Percakapan setara (v5 komposisi meja): GARIS MATA kedua tokoh duduk sejajar (± 2 piksel seni) dan di cakrawala
    // kamera (setinggi mata orang duduk, ± 2 piksel). Puncak kepala boleh beda (sanggul Miss Raksa lebih tinggi dari
    // puncak hijab; ≤ 12 piksel) & plakat di antara keduanya.
    const mataMentor = GARIS_MEJA_MENTOR - U.mentorMataAtasMeja * PIKSEL;
    const mataRina = t.nasabahDuduk.y - U.nasabahMataPinggul * PIKSEL;
    assert.ok(Math.abs(mataMentor - mataRina) <= 2 * PIKSEL, `${lok}: garis mata duduk sejajar (${mataMentor} vs ${mataRina})`);
    for (const m of [mataMentor, mataRina]) assert.ok(Math.abs(m - CAKRAWALA) <= 2 * PIKSEL, `${lok}: garis mata ${m} di cakrawala ${CAKRAWALA}`);
    assert.ok(Math.abs(mentor.y - rina.y) <= 12 * PIKSEL, `${lok}: puncak kepala duduk (${mentor.y} vs ${rina.y})`);
    assert.ok(PAPAN.x >= mentor.x + mentor.w + 4 && PAPAN.x + PAPAN.w <= rina.x - 4, `${lok}: plakat di antara kepala`);
    // Monitor di kiri badan Miss Raksa (badan chibi ± 31 piksel di kiri-kanan pusat) & di luar bingkai HP.
    assert.ok(MONITOR.x + MONITOR.w <= t.mentor.x - 31 * PIKSEL, `${lok}: monitor di kiri badan Miss Raksa`);
    assert.ok(MONITOR.x + MONITOR.w <= HP.x, `${lok}: monitor di luar bingkai HP`);
    // Garis meja: bingkai duduk 100 piksel di atas tepi jauh meja; pinggul (jangkar) 34 piksel di bawahnya.
    assert.equal(t.garisMejaMentor, GARIS_MEJA_MENTOR);
    assert.equal(yTepiJauh(t.mentor.x), GARIS_MEJA_MENTOR, `${lok}: garis meja = tepi jauh di badan Miss Raksa`);
    assert.equal(t.mentor.y, GARIS_MEJA_MENTOR + PINGGUL_DI_BAWAH_MEJA, `${lok}: pinggul dari garis meja`);
    assert.equal(PINGGUL_DI_BAWAH_MEJA, 34 * PIKSEL);
    // Prop di permukaan meja, di antara tepi jauh & dekat.
    for (const k of ['kartuSimpan', 'kartuMeja', 'kunciMeja', 'telepon'] as const) {
      const p = t[k]!;
      assert.ok(p.y > yTepiJauh(p.x) && p.y < yTepiDekat(p.x), `${lok}: ${k} di atas permukaan meja`);
    }
  }
  assert.ok(ruangAdegan('telepon').kursi?.belakang, 'telepon: kursi pengunjung tampil (kosong)');
  assert.notEqual(ruangAdegan('telepon').belakangMeja!.svg, ruangAdegan('meja').belakangMeja!.svg, 'telepon: meja berbeda (beberapa hari kemudian)');
});

test('jalur masuk SKALA 1: dari bukaan pintu sekat kanan ke samping kursi, mendatar di satu garis lantai, tanpa LOD', () => {
  const r = ruangAdegan('meja');
  const j = r.tempat.jalurMasuk;
  const b = r.pintu!.bukaan;
  assert.ok(j.length >= 3);
  assert.ok(j[0].titik.x >= b.x + 40 && j[0].titik.x <= b.x + b.w - 40, `titik awal (${j[0].titik.x}) di dalam bukaan tampak ${b.x}–${b.x + b.w}`);
  for (let i = 0; i < j.length; i++) {
    assert.equal(j[i].skala, 1, `titik ${i} skala 1`);
    assert.equal(j[i].titik.y, j[0].titik.y, `titik ${i} di garis lantai yang sama`);
    if (i) assert.ok(j[i].titik.x < j[i - 1].titik.x, `titik ${i} makin ke kiri (menuju kursi)`);
  }
  const akhir = j[j.length - 1];
  assert.deepEqual(akhir.titik, r.tempat.nasabahBerdiri, 'berakhir di tempat berdiri samping kursi');
  assert.equal(akhir.skala, r.tempat.skalaNasabah);
  assert.ok(JALUR_DEPAN_MULAI > 0 && JALUR_DEPAN_MULAI < j.length);
  // Engsel di tepi kiri bukaan; daun & koridor = bukaan; daun lebih tinggi dari tokoh (kusen atas di luar dunia).
  assert.deepEqual(r.pintu!.engsel, { x: b.x, y: b.y + b.h / 2 });
  assert.deepEqual([r.pintu!.daun.x, r.pintu!.daun.y, r.pintu!.daun.w, r.pintu!.daun.h], [b.x, b.y, b.w, b.h]);
  assert.ok(b.y <= 0 && b.y + b.h >= 900, 'bukaan setinggi dunia');
  // Bu Rina berdiri (191 piksel): kepala di dalam dunia, lebih tinggi dari kepala duduk; kaki setinggi lantai duduknya.
  const kepalaBerdiri = akhir.titik.y - U.nasabahBerdiri * PIKSEL;
  assert.ok(kepalaBerdiri >= 0 && kepalaBerdiri < kepalaDudukPiksel('nasabah').y - 20 * PIKSEL, `kepala berdiri ${kepalaBerdiri}`);
  // Titik telapak frame duduk = baris bawah frame - 1 (pinggul + 40 piksel); v5 (komposisi meja): tepat = telapak berdiri
  // (y 904, di luar dunia), jadi duduk <-> berdiri tanpa lompatan tegak (dulu 1 piksel lebih tinggi).
  assert.equal(r.tempat.nasabahDuduk.y + (U.nasabahPinggulKaki - 1) * PIKSEL, akhir.titik.y, 'telapak berdiri = telapak duduk (di luar dunia)');
});

test('parkiran & pintu-luar: tanpa meja; tokoh skala 1; kerusakan mobil di antara kedua tokoh di bingkai HP; plakat pembuka di bingkai HP', () => {
  const p = ruangAdegan('parkiran');
  assert.equal(p.belakangMeja, undefined);
  assert.equal(p.pintu, undefined);
  assert.equal(p.papanNama, undefined, 'parkiran tanpa papan nama');
  const t = p.tempat;
  assert.ok(t.mentorBerdiri.x < t.nasabahBerdiri.x, 'Miss Raksa kiri, Bu Rina kanan');
  for (const [pt, tinggi] of [[t.mentorBerdiri, U.mentorBerdiri], [t.nasabahBerdiri, U.nasabahBerdiri]] as const) {
    assert.ok(pt.y - tinggi * PIKSEL >= 0, 'kepala berdiri di dalam dunia');
  }
  // Kerusakan di antara badan kedua tokoh (setengah lebar badan berdiri ± 30 piksel) & di pandangan HP berpusat pada keduanya.
  const cx = (t.mentorBerdiri.x + t.nasabahBerdiri.x) / 2;
  const pandang = { x: cx - HP.w / 2, w: HP.w };
  const kanan = PENYOK_PARKIRAN.x + PENYOK_PARKIRAN.w;
  assert.ok(PENYOK_PARKIRAN.x >= pandang.x && kanan <= pandang.x + pandang.w, 'kerusakan di pandangan HP');
  const pusat = PENYOK_PARKIRAN.x + PENYOK_PARKIRAN.w / 2;
  assert.ok(pusat > t.mentorBerdiri.x + 30 * PIKSEL && pusat < t.nasabahBerdiri.x - 30 * PIKSEL, `pusat kerusakan ${pusat.toFixed(0)} di antara kedua tokoh`);
  const l = ruangAdegan('pintu-luar');
  assert.equal(l.belakangMeja, undefined);
  assert.ok(l.papanNama && di(l.papanNama, BINGKAI_LUAR.hp), 'teks papan di bingkai HP pembuka');
  assert.ok(l.pintu && di(l.pintu.bukaan, BINGKAI_LUAR.hp), 'pintu di bingkai HP pembuka');
  assert.deepEqual(l.tempat.jalurMasuk, []);
});

test('plakat: lilin di antara kepala & di bawah plakat; tokoh berdiri tidak menutupi teks', () => {
  const t = ruangAdegan('meja').tempat;
  const m = kepalaDudukPiksel('mentor');
  const r = kepalaDudukPiksel('nasabah');
  for (const x of LILIN_X) assert.ok(x - 8 > m.x + m.w && x + 8 < r.x, `lilin ${x} di antara kepala duduk`);
  const nyala = PAPAN.rakAtas - 4 - TINGGI_LILIN - 16;
  assert.ok(nyala >= PAPAN.y + PAPAN.h, `nyala lilin (${nyala}) di bawah plakat`);
  // Siluet terukur (atlas Bu Rina 27 Sep, ruang-piksel/ukur-rina.mjs): hijab duduk-condong mulai x >= 1004 di pita
  // y 264–424; berdiri mulai x >= 1224 di pita kepala-bahu y 144–432. Miss Raksa berdiri: kepala ± 23 piksel dari pusat.
  const HIJAB_CONDONG_KIRI = 1004;
  assert.ok(HIJAB_CONDONG_KIRI - (TEKS_PAPAN.x + TEKS_PAPAN.w) >= 24, 'teks plakat bebas hijab condong');
  assert.ok(t.nasabahBerdiri.x - 96 > TEKS_PAPAN.x + TEKS_PAPAN.w, 'teks plakat bebas Bu Rina berdiri');
  assert.ok(t.mentorBerdiri.x + 23 * PIKSEL + 16 < TEKS_PAPAN.x, 'teks plakat bebas kepala Miss Raksa berdiri');
});

/** Kotak kertas kartu polis (tanpa bayang) bila jangkarnya di `t`. */
const kertasKartu = (t: { x: number; y: number }): Kotak => {
  const k = propKartuPolis();
  const xs = SUDUT_KARTU.map((p) => t.x - k.jangkar.x + p[0]);
  const ys = SUDUT_KARTU.map((p) => t.y - k.jangkar.y + p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

test('meja: landasan kartu kosong & terlihat; kunci di kanannya, bebas pangkuan Bu Rina; map tidak mirip kartu', () => {
  const kartu = propKartuPolis();
  // Pangkuan Bu Rina (atlas 27 Sep, semua frame duduk termasuk condong) mulai x >= 952 di pita y 648–840.
  const PANGKUAN_KIRI = 952;
  for (const lok of ['meja', 'telepon'] as const) {
    const t = ruangAdegan(lok).tempat;
    assert.ok(di(kotakProp(kartu, t.kartuMeja!), LANDASAN_KARTU), `${lok}: kartu di meja di dalam landasan`);
    assert.ok(di(LANDASAN_KARTU, HP), `${lok}: landasan di bingkai HP`);
    const kunci = kotakProp(propKunci(), t.kunciMeja!);
    const lain: [string, Kotak][] = [
      ['kunci', kunci],
      ['telepon', kotakProp(propTelepon(), t.telepon!)],
      ['monitor', MONITOR],
      ['formulir', { x: 168, y: 704, w: 96, h: 48 }],
    ];
    if (lok === 'telepon') lain.push(['cangkir', kotakProp(propCangkir(), CANGKIR)]);
    for (const [nama, k] of lain) assert.ok(!beririsan(k, LANDASAN_KARTU), `${lok}: ${nama} di luar landasan kartu`);
    assert.ok(kunci.x + kunci.w <= PANGKUAN_KIRI - 8, `${lok}: kunci (sampai x ${kunci.x + kunci.w}) bebas pangkuan Bu Rina`);
    assert.ok(LANDASAN_KARTU.x + LANDASAN_KARTU.w <= PANGKUAN_KIRI - 40, `${lok}: landasan jauh dari pangkuan`);
    assert.ok(di(kunci, HP), `${lok}: kunci di bingkai HP`);
  }
  const map = propMap();
  assert.ok(map.w >= kartu.w * 1.4, 'map jauh lebih lebar dari kartu');
  for (const warna of ['#2f7a4b', '#fffdf6', '#efe8d6', '#e9c46a', '#3d9160', '#fbf8ef']) assert.ok(!map.svg.includes(warna), `map tanpa warna kartu ${warna}`);
});

test('kartu polis disodorkan PEMAIN: titik awal di tepi dekat meja, kiri kamera, utuh di bingkai HP, bebas monitor & telepon', () => {
  for (const lok of ['meja', 'telepon'] as const) {
    const t = ruangAdegan(lok).tempat;
    const awal = kertasKartu(t.kartuSimpan!);
    const k = propKartuPolis();
    const [, , C, D] = SUDUT_KARTU.map((p): [number, number] => [t.kartuSimpan!.x - k.jangkar.x + p[0], t.kartuSimpan!.y - k.jangkar.y + p[1]]);
    for (const [nama, s] of [['kiri-dekat', D], ['kanan-dekat', C]] as const) {
      const jarak = yTepiDekat(s[0]) - s[1];
      assert.ok(jarak >= 2 && jarak <= 14, `${lok}: sudut ${nama} kartu ${jarak.toFixed(1)} di atas tepi dekat (2–14)`);
    }
    assert.ok(di(awal, HP) && awal.x >= HP.x + 40, `${lok}: kartu awal x ${awal.x.toFixed(0)} utuh di bingkai HP`);
    assert.ok(t.kartuSimpan!.x < t.mentor.x, `${lok}: kartu awal di kiri badan Miss Raksa (sisi pemain)`);
    assert.ok(t.kartuMeja!.x - t.kartuSimpan!.x >= 120, `${lok}: lintasan kartu terlihat`);
    assert.ok(!beririsan(awal, LANDASAN_KARTU), `${lok}: kartu awal di luar landasan (kartu benar-benar bergerak)`);
    assert.ok(!beririsan(awal, MONITOR), `${lok}: kartu awal bebas monitor`);
    assert.ok(!beririsan(awal, lebarkan(kotakProp(propTelepon(), t.telepon!), 8)), `${lok}: kartu awal bebas telepon (+8)`);
    // Tangan Miss Raksa bertumpu di garis meja .. + 12 piksel; kertas kartu awal di bawahnya.
    assert.ok(awal.y >= GARIS_MEJA_MENTOR + 12 * PIKSEL, `${lok}: kartu awal (y ${awal.y.toFixed(0)}) di bawah pita tangan Miss Raksa`);
  }
});

test('telepon meja: utuh di bingkai HP dengan jarak dari tepi kiri, di atas permukaan meja', () => {
  const t = ruangAdegan('meja').tempat;
  const telp = kotakProp(propTelepon(), t.telepon!);
  assert.ok(telp.x >= HP.x + 12, `telepon mulai x ${telp.x} (>= tepi HP ${HP.x} + 12)`);
  assert.ok(di(telp, HP), 'telepon di bingkai HP');
  assert.ok(t.telepon!.y < yTepiDekat(t.telepon!.x) - 20, 'telepon jauh dari tepi dekat');
  assert.ok(telp.x + telp.w <= t.mentor.x - 16 * PIKSEL, 'telepon di kiri tangan Miss Raksa');
});

test('bayang kontak: kursi pengunjung (kolong, bayang jatuh, lipatan) & meja (bayang lantai kanan) tersedia', () => {
  for (const lok of ['meja', 'telepon'] as const) {
    const r = ruangAdegan(lok);
    for (const b of ['kolong', 'jatuh', 'lipat']) assert.ok(r.kursi!.belakang.svg.includes(`rg-${lok}-kursi-${b}`), `${lok}: kursi ${b}`);
    for (const b of ['baymeja', 'kontakmeja']) assert.ok(r.latar.svg.includes(`rg-${lok}-latar-${b}`), `${lok}: meja ${b}`);
  }
});

test('kursi pengunjung: titik duduk = pinggul Bu Rina, bentuk di kotak lapisan, jauh dari kunci/landasan/cangkir & di bawah wajah', () => {
  const B = BENTUK_KURSI;
  assert.deepEqual(titikKursi(0, 0, 0).map(Math.round), [KURSI.x, KURSI.y]);
  for (const lok of ['meja', 'telepon'] as const) {
    const t = ruangAdegan(lok).tempat;
    assert.ok(Math.abs(t.nasabahDuduk.x - KURSI.x) <= 20 && Math.abs(t.nasabahDuduk.y - KURSI.y) <= 12, `${lok}: titik duduk Bu Rina di dudukan kursi`);
    const svg = ruangAdegan(lok).kursi!.belakang.svg;
    const id = `rg-${lok}-kursi`;
    for (const b of ['dalam', 'luar', 'atas', 'dudukan', 'bantal', 'badan', 'kaki']) assert.ok(svg.includes(`url(#${id}-${b})`), `${lok}: kursi ${b}`);
    assert.equal(svg.split(`url(#${id}-kaki)`).length - 1, 4, `${lok}: empat kaki`);
  }
  const t = ruangAdegan('meja').tempat;
  const kunci = kotakProp(propKunci(), t.kunciMeja!);
  const wajah = kepalaDudukPiksel('nasabah');
  for (let i = 0; i <= 40; i += 1) {
    const th = (Math.PI * i) / 40;
    for (const tt of [0, 1]) {
      const a = B.a0 - (B.raDalam + tt * B.tebal) * Math.sin(th);
      const b = (B.rbDalam + tt * B.tebal) * Math.cos(th);
      for (const [x, y] of [titikKursi(a - B.rebah * Math.sin(th) ** 2, b, B.tinggiSandar), titikKursi(a, b, B.dasar)]) {
        const p = { x, y, w: 0, h: 0 };
        assert.ok(x >= KOTAK_KURSI.x && x <= KOTAK_KURSI.x + KOTAK_KURSI.w && y >= KOTAK_KURSI.y, `titik kursi (${x.toFixed(0)}, ${y.toFixed(0)}) di kotak lapisan`);
        assert.ok(!beririsan(p, lebarkan(kunci, 8)) && !beririsan(p, LANDASAN_KARTU), 'kursi jauh dari kunci & landasan kartu');
        // Sandaran (di kanan punggungnya) boleh setinggi bahu; di kolom wajah kursi tetap di bawah wajah (90 % kotak kepala:
        // mata & mulut jauh di atasnya; sisa 10 % = dagu/leher yang tertutup hijab).
        if (x >= wajah.x && x <= wajah.x + wajah.w) assert.ok(y > wajah.y + wajah.h * 0.9, `kursi (${x.toFixed(0)}, ${y.toFixed(0)}) di bawah wajah Bu Rina`);
      }
    }
  }
});

test('pintu: isi koridor DIPOTONG ke bukaan (meja, telepon, pintu-luar)', () => {
  for (const lok of ['meja', 'telepon', 'pintu-luar'] as const) {
    const r = ruangAdegan(lok);
    const b = r.pintu!.bukaan;
    const k = r.koridor!;
    assert.deepEqual([k.x, k.y, k.w, k.h], [b.x, b.y, b.w, b.h], `${lok}: kotak koridor = bukaan`);
    const klip = `rg-${lok}-koridor-klip`;
    const isi = k.svg.replace(/^<g transform="[^"]*">/, '').replace(/<\/g>$/, '');
    const awal = `<defs><clipPath id="${klip}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></clipPath></defs><g clip-path="url(#${klip})">`;
    assert.ok(isi.startsWith(awal), `${lok}: isi diawali klip seukuran bukaan`);
    assert.match(isi.slice(isi.lastIndexOf('</g>')), /^<\/g><rect [^>]*fill="none"[^>]*\/>$/, `${lok}: hanya garis tepi di luar klip`);
  }
});

test('prop: ukuran & jangkar valid, tanpa teks; telepon dengan/tanpa gagang berbeda', () => {
  for (const p of [propKartuPolis(), propKartuTangan(), propKunci(), propTelepon(), propTelepon({ gagang: false }), propGagang(), propMap(), propCangkir()]) {
    assert.ok(p.w > 0 && p.h > 0);
    assert.ok(p.jangkar.x > 0 && p.jangkar.x < p.w && p.jangkar.y > 0 && p.jangkar.y < p.h);
    assert.ok(!/<text|<image|href=/.test(p.svg) && tagSeimbang(p.svg));
  }
  assert.notEqual(propTelepon().svg, propTelepon({ gagang: false }).svg);
});

// ------------------------------------------------------------------ keluaran piksel (seni/piksel)

const DIR_PIKSEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../piksel');
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Buffer } } } };
interface LapisanM { id: string; berkas: string; x: number; y: number; w: number; h: number; pw: number; ph: number; z: number; alpha: boolean; engsel?: { x: number; y: number } }
const MAN = JSON.parse(fs.readFileSync(path.join(DIR_PIKSEL, 'ruang.json'), 'utf8')) as {
  piksel: number; palet: string[]; teksPapan: string;
  lokasi: Record<string, { lapisan: LapisanM[]; bukaan?: Kotak; papan?: { teks: string; kotak: Kotak; baris: Kotak[] }; tempat: unknown }>;
  prop: Record<string, { berkas: string; w: number; h: number; pw: number; ph: number; jangkar: { x: number; y: number } }>;
};
const baca = (f: string) => PNG.sync.read(fs.readFileSync(path.join(DIR_PIKSEL, f)));
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

test('manifest piksel SEGAR: kotak lapisan, tempat, bukaan, engsel, prop = geometri kini (bangun ulang bila gagal)', () => {
  assert.equal(MAN.piksel, PIKSEL);
  const nama: Record<string, (r: RuangAdegan) => LapisanSvg | undefined> = {
    latar: (r) => r.latar, koridor: (r) => r.koridor, daun: (r) => r.pintu?.daun, belakangMeja: (r) => r.belakangMeja, depanMeja: (r) => r.depanMeja, kursiBelakang: (r) => r.kursi?.belakang,
  };
  for (const lok of DAFTAR_LOKASI_ADEGAN) {
    const r = ruangAdegan(lok);
    const m = MAN.lokasi[lok];
    assert.ok(m, `${lok}: ada di manifest`);
    const ada = lapisanDari(r).map(([n]) => n).filter((n) => n in nama);
    assert.deepEqual(m.lapisan.map((l) => l.id).sort(), ada.sort(), `${lok}: daftar lapisan`);
    for (const l of m.lapisan) {
      const s = nama[l.id](r)!;
      assert.deepEqual([l.x, l.y, l.w, l.h], [s.x, s.y, s.w, s.h], `${lok}.${l.id}: kotak = lapisan SVG kini (jalankan tools/piksel/bangun-ruang.mjs)`);
      assert.deepEqual([l.w, l.h], [l.pw * PIKSEL, l.ph * PIKSEL], `${lok}.${l.id}: dunia = PNG × ${PIKSEL}`);
      if (l.id === 'daun') assert.deepEqual(l.engsel, r.pintu!.engsel, `${lok}: engsel`);
    }
    assert.deepEqual(m.tempat, JSON.parse(JSON.stringify(r.tempat)), `${lok}: tempat manifest = geometri kini`);
    if (r.pintu) assert.deepEqual(m.bukaan, r.pintu.bukaan, `${lok}: bukaan`);
    const zs = m.lapisan.map((l) => l.z);
    assert.deepEqual(zs, [...zs].sort((a, b) => a - b), `${lok}: lapisan urut z`);
  }
  const prop: Record<string, PropRuang> = {
    kartu: propKartuPolis(), kartuTangan: propKartuTangan(), kunci: propKunci(), telepon: propTelepon(), teleponTanpaGagang: propTelepon({ gagang: false }),
    gagang: propGagang(), map: propMap(), cangkir: propCangkir(),
  };
  assert.deepEqual(Object.keys(MAN.prop).sort(), Object.keys(prop).sort());
  for (const [id, p] of Object.entries(prop)) {
    const m = MAN.prop[id];
    assert.deepEqual([m.w, m.h, m.jangkar.x, m.jangkar.y], [p.w, p.h, p.jangkar.x, p.jangkar.y], `prop ${id}: ukuran & jangkar`);
    assert.deepEqual([m.w, m.h], [m.pw * PIKSEL, m.ph * PIKSEL], `prop ${id}: dunia = PNG × ${PIKSEL}`);
  }
});

test('PNG piksel: ukuran native, alpha tepat 0/255 (buram penuh untuk latar/koridor/daun), warna hanya dari palet <= 48', () => {
  assert.ok(MAN.palet.length <= 48 && MAN.palet.length >= 24, `palet ${MAN.palet.length} warna`);
  const palet = new Set(MAN.palet.map((h) => hexRgb(h).join(',')));
  const berkas = new Map<string, boolean>();
  for (const lok of Object.values(MAN.lokasi)) for (const l of lok.lapisan) berkas.set(l.berkas, l.alpha);
  for (const p of Object.values(MAN.prop)) berkas.set(p.berkas, true);
  for (const f of fs.readdirSync(DIR_PIKSEL)) if (/^ruang-.*\.png$/.test(f)) assert.ok(berkas.has(f), `${f} dirujuk manifest (tanpa berkas yatim)`);
  const ukuran = new Map<string, [number, number]>();
  for (const lok of Object.values(MAN.lokasi)) for (const l of lok.lapisan) ukuran.set(l.berkas, [l.pw, l.ph]);
  for (const p of Object.values(MAN.prop)) ukuran.set(p.berkas, [p.pw, p.ph]);
  let total = 0;
  for (const [f, alpha] of berkas) {
    const png = baca(f);
    total += fs.statSync(path.join(DIR_PIKSEL, f)).size;
    assert.deepEqual([png.width, png.height], ukuran.get(f), `${f}: ukuran native`);
    let buram = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const a = png.data[i + 3];
      assert.ok(a === 0 || a === 255, `${f}: alpha biner`);
      if (!alpha) assert.equal(a, 255, `${f}: buram penuh`);
      if (a === 255) {
        buram++;
        const k = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`;
        assert.ok(palet.has(k), `${f}: warna ${k} dari palet`);
      }
    }
    assert.ok(buram > 0, `${f}: tidak kosong`);
  }
  assert.ok(total < 150 * 1024, `total PNG ruang ${(total / 1024).toFixed(1)} KB`);
});

test('teks plakat piksel = LOKASI_AUTO_1.nama, di kotak papan, tinta emas benar-benar tergambar & tidak ditutup lapisan lain', () => {
  assert.equal(MAN.teksPapan, LOKASI_AUTO_1.nama);
  for (const lok of ['meja', 'telepon', 'pintu-luar'] as const) {
    const m = MAN.lokasi[lok];
    const r = ruangAdegan(lok);
    assert.ok(m.papan, `${lok}: papan`);
    assert.equal(m.papan!.teks, LOKASI_AUTO_1.nama);
    const p = r.papanNama!;
    assert.deepEqual(m.papan!.kotak, { x: p.x, y: p.y, w: p.w, h: p.h }, `${lok}: kotak papan = papanNama`);
    const latar = m.lapisan.find((l) => l.id === 'latar')!;
    const png = baca(latar.berkas);
    const emas = hexRgb('#e9c46a');
    let n = 0;
    for (const b of m.papan!.baris) {
      assert.ok(di(b, lebarkan(m.papan!.kotak, 4)), `${lok}: baris "${b}" di kotak papan`);
      for (let y = b.y / PIKSEL; y < (b.y + b.h) / PIKSEL; y++) for (let x = b.x / PIKSEL; x < (b.x + b.w) / PIKSEL; x++) {
        const i = (y * png.width + x) * 4;
        if (png.data[i] === emas[0] && png.data[i + 1] === emas[1] && png.data[i + 2] === emas[2]) n++;
      }
      // Lapisan tumpang lain tidak menutup teks.
      for (const l of m.lapisan.filter((x) => x.id !== 'latar' && x.alpha)) assert.ok(!beririsan(b, l), `${lok}: ${l.id} tidak menutup teks`);
    }
    assert.ok(n >= 60, `${lok}: ${n} piksel tinta emas`);
  }
  assert.equal(MAN.lokasi.parkiran.papan, undefined);
});
