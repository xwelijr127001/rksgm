/**
 * TES pembantu murni hasil aktivitas cerita v2 (docs/rancangan-mode-cerita.md 11.5): rincian per opsi setelah
 * dikirim (membantu / terlewat / kurang membantu + alasan), label opsi yang dipensiunkan (simpanan lama), arti baris
 * kartu polis.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPISODE_AUTO_1 as EP } from '../episode/auto-1/episode';
import { teksCerita } from '../teks';
import { umpanBalikKini } from '../mesin';
import { jawab, mainkanJalur, type LangkahJalur } from '../uji/jalurEpisode';
import {
  artiKartu, labelOpsi, langkahDenganJawaban, rincianOpsi, ringkasAktivitas,
} from './hasilAktivitas';

const tx = (k: string) => teksCerita(EP, k, 'id', { nama: 'Weli' });
const txEn = (k: string) => teksCerita(EP, k, 'en', { nama: 'Weli' });
const bukti = EP.aktivitas.bukti!;
const polis = EP.aktivitas.polis!;

test('rincianOpsi: foto membantu / terlewat / kurang membantu + alasan', () => {
  const misi = bukti.misi('id');
  const [r] = rincianOpsi(bukti, misi, { bukti: ['foto-plat', 'foto-menu'] }, tx);
  assert.equal(r!.jenis, 'multi');
  assert.equal(r!.tepat, false);
  assert.deepEqual(r!.membantu.map((o) => o.id), ['foto-plat']);
  assert.deepEqual(r!.kurang.map((o) => o.id), ['foto-menu']);
  assert.deepEqual(r!.terlewat.map((o) => o.id).sort(), ['foto-full', 'foto-penyok']);
  for (const o of [...r!.membantu, ...r!.kurang, ...r!.terlewat]) {
    assert.ok(o.label && !o.label.startsWith('akt.'), `label ${o.id}`);
    if (bukti.alasanOpsi) assert.ok(o.alasan && !o.alasan.startsWith('akt.'), `alasan ${o.id}`);
  }
  const [t3] = rincianOpsi(bukti, misi, { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] }, tx);
  assert.equal(t3!.tepat, true);
  assert.equal(t3!.terlewat.length + t3!.kurang.length, 0);
  assert.ok(t3!.penjelasan.length > 0);
});

test('rincianOpsi pilih-satu: tepat / keliru', () => {
  const misi = polis.misi('id');
  const [ok] = rincianOpsi(polis, misi, { penjelasan: 'bisa-dinilai' }, tx);
  assert.equal(ok!.jenis, 'single');
  assert.equal(ok!.tepat, true);
  const [salah] = rincianOpsi(polis, misi, { penjelasan: 'pasti-diganti' }, tx);
  assert.equal(salah!.tepat, false);
  assert.deepEqual(salah!.kurang.map((o) => o.id), ['pasti-diganti']);
  assert.deepEqual(salah!.terlewat.map((o) => o.id), ['bisa-dinilai']);
});

test('opsi yang sudah dihapus (ambang-tlo) tetap berlabel kalimat, bukan id', () => {
  const misi = polis.misi('id');
  const step = misi.steps[0]!;
  const ada = step.kind === 'single' && step.options.some((o) => o.id === 'ambang-tlo');
  const l = labelOpsi(polis, step, 'ambang-tlo', tx);
  assert.notEqual(l, 'ambang-tlo');
  assert.ok(/75/.test(l), l);
  const langkah = langkahDenganJawaban(polis, misi.steps, { penjelasan: 'ambang-tlo' }, tx);
  const s0 = langkah[0]!;
  assert.ok(s0.kind === 'single' && s0.options.some((o) => o.id === 'ambang-tlo' && o.label === l));
  if (!ada) assert.notEqual(langkah[0], step, 'langkah diperluas bila opsinya tidak ada');
  // Tanpa opsi hilang = objek langkah yang sama.
  assert.equal(langkahDenganJawaban(polis, misi.steps, { penjelasan: 'bisa-dinilai' }, tx)[0], step);
  // Tidak ada kunci teks sama sekali = id apa adanya.
  assert.equal(labelOpsi(polis, step, 'tidak-pernah-ada', tx), 'tidak-pernah-ada');
  console.log('opsi polis kini:', step.kind === 'single' ? step.options.map((o) => o.id).join(', ') : '-', '| label ambang-tlo:', l);
});

test('perjalanan lama dengan ambang-tlo: umpan balik & Catatan kasus terbaca', () => {
  const BUKTI_TEPAT = { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] };
  const jalur: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', { penjelasan: 'ambang-tlo' })];
  const h = mainkanJalur(EP, jalur);
  const saatUmpan = h.jejak.find((s) => s.umpanBalik?.node === 'b4-polis')!;
  assert.ok(saatUmpan, 'ada state umpan balik polis');
  const ub = umpanBalikKini(EP, saatUmpan)!;
  assert.equal(ub.cabang.lanjut, 'b4-polis-salah');
  const [r] = rincianOpsi(polis, polis.misi('id'), saatUmpan.aktivitas.polis!.jawaban, tx);
  assert.equal(r!.kurang[0]!.id, 'ambang-tlo');
  assert.ok(/75/.test(r!.kurang[0]!.label));
  const ringkas = ringkasAktivitas(EP, h.state, 'id', tx).find((a) => a.id === 'polis')!;
  assert.ok(ringkas.pilihan.every((p) => p.teks !== 'ambang-tlo'), JSON.stringify(ringkas.pilihan));
  const ringkasEn = ringkasAktivitas(EP, h.state, 'en', txEn).find((a) => a.id === 'polis')!;
  assert.ok(ringkasEn.pilihan.every((p) => p.teks !== 'ambang-tlo'), JSON.stringify(ringkasEn.pilihan));
});

test('artiKartu: kartu polis punya arti per baris (bila data v2 ada), kunci hilang = null', () => {
  const a = artiKartu(polis, 'polis-rina', tx);
  if (!polis.kartuArti) { assert.equal(a, null); return; }
  assert.ok(a);
  const kartu = polis.misi('id').policyCards![0]!;
  assert.equal(a!.baris.length, kartu.rows.length);
  assert.ok(a!.baris.some(Boolean));
  for (const x of [a!.sub, ...a!.baris]) if (x) assert.ok(!x.startsWith('akt.'), x);
  assert.equal(artiKartu(polis, 'kartu-lain', tx), null);
  assert.equal(artiKartu({ ...polis, kartuArti: { 'polis-rina': { sub: 'akt.tidak.ada', baris: ['akt.tidak.ada'] } } }, 'polis-rina', tx), null);
});
