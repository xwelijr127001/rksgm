/**
 * Tes aset adegan "Periksa rambu": angka geometri.ts cocok dengan berkas SVG asli, SVG tidak memuat templating atau skrip,
 * dan unikkan() membuat id unik tanpa merusak rujukannya.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JALAN_X0, JALAN_X1, JUMLAH_LAJUR, LAJUR_TRUK, LEBAR_LAJUR, RUANG, TRUK_LEBAR_PERSEN, TRUK_VIEWBOX, kiriTrukPersen, persenLajur, tengahLajur, tinggiTrukPersen, xLajur } from './geometri';
import { idDalamSvg, unikkan } from './svg';

const DIR = path.join(import.meta.dirname, 'svg');
const baca = (n: string) => fs.readFileSync(path.join(DIR, n), 'utf8');
const SEMUA = ['jalan-empat-lajur.svg', 'truk-biru.svg', 'arsir-lajur.svg', 'arsir-lajur-biru.svg', 'ikon-periksa.svg'];

test('semua berkas SVG ada, satu elemen svg, tanpa templating, skrip, atau tautan luar', () => {
  for (const n of SEMUA) {
    const s = baca(n);
    assert.ok(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), n);
    assert.equal((s.match(/<svg/g) ?? []).length, 1, n);
    assert.ok(!s.includes('{{') && !/<script|onload=|javascript:|href="http/i.test(s), n);
  }
});

test('jalan: ruang 360, jalan x 44..316, pembatas lajur di 112/180/248 (sesuai geometri.ts)', () => {
  const s = baca('jalan-empat-lajur.svg');
  assert.match(s, new RegExp(`viewBox="0 0 ${RUANG} ${RUANG}"`));
  assert.match(s, new RegExp(`<rect x="${JALAN_X0}" y="0" width="${JALAN_X1 - JALAN_X0}" height="${RUANG}" fill="#5A6066"`));
  for (let n = 2; n <= JUMLAH_LAJUR; n++) assert.match(s, new RegExp(`<line x1="${xLajur(n)}" y1="-6" x2="${xLajur(n)}"`), `pembatas lajur ${n}`);
  assert.equal(LEBAR_LAJUR, 68);
});

test('persen lajur sama dengan yang dipakai desain (12.222%, 31.111%, 50%, 68.889%; lebar 18.889%)', () => {
  const k = [1, 2, 3, 4].map((n) => Number(persenLajur(n).kiri.toFixed(3)));
  assert.deepEqual(k, [12.222, 31.111, 50, 68.889]);
  assert.equal(Number(persenLajur(1).lebar.toFixed(3)), 18.889);
});

test('truk: viewBox 60x170 dan tengahnya berimpit dengan tengah lajur 2 (keterangan supir)', () => {
  const s = baca('truk-biru.svg');
  assert.match(s, new RegExp(`viewBox="0 0 ${TRUK_VIEWBOX.w} ${TRUK_VIEWBOX.h}"`));
  const tengah = kiriTrukPersen(LAJUR_TRUK) + TRUK_LEBAR_PERSEN / 2;
  assert.ok(Math.abs(tengah - (tengahLajur(LAJUR_TRUK) / RUANG) * 100) < 1e-9);
  assert.ok(Math.abs(kiriTrukPersen(LAJUR_TRUK) - 33.056) < 0.01, 'sama dengan left: 33.056% pada desain');
  assert.ok(tinggiTrukPersen() > 40 && tinggiTrukPersen() < 45);
});

test('arsiran biru turunan: pola dibalik dan id beda dari yang merah (tidak bentrok bila keduanya di halaman)', () => {
  const m = baca('arsir-lajur.svg'); const b = baca('arsir-lajur-biru.svg');
  assert.match(m, /rotate\(45\)/); assert.match(b, /rotate\(-45\)/);
  assert.match(m, /#D4553B/); assert.match(b, /#2F6FB0/);
  assert.deepEqual(idDalamSvg(m), ['rk-lane-hatch']); assert.deepEqual(idDalamSvg(b), ['rk-lane-hatch-biru']);
});

test('unikkan: id dan rujukan url(#) diberi sufiks yang sama; dua salinan tidak berbagi id', () => {
  const s = baca('arsir-lajur.svg');
  const a = unikkan(s, 'a1'); const b = unikkan(s, 'b2');
  assert.ok(a.includes('id="rk-lane-hatch-a1"') && a.includes('url(#rk-lane-hatch-a1)'));
  assert.ok(!a.includes('url(#rk-lane-hatch)'));
  assert.notDeepEqual(idDalamSvg(a), idDalamSvg(b));
  const jalan = unikkan(baca('jalan-empat-lajur.svg'), 'x');
  for (const id of idDalamSvg(jalan)) assert.ok(id.endsWith('-x'), id);
});

test('lisensi font ikut disimpan (SIL OFL + hak cipta) dan berkas font ada', () => {
  const lis = fs.readFileSync(path.join(import.meta.dirname, 'LISENSI-PlusJakartaSans.txt'), 'utf8');
  assert.match(lis, /SIL OPEN FONT LICENSE Version 1\.1/); assert.match(lis, /Plus Jakarta Sans Project Authors/);
  assert.ok(fs.statSync(path.join(import.meta.dirname, 'PlusJakartaSans-latin.woff2')).size > 10_000);
});
