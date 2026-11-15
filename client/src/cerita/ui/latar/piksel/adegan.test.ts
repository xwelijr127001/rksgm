/**
 * T-013 Stage 1: adapter cue Episode 2 -> panggung piksel (pemetaan eksplisit) + pemeriksaan pose atlas (pose yang diminta
 * adegan kantor HARUS ada di atlas, tidak boleh jatuh ke cadangan).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPISODE_AUTO_2 } from '../../../episode/auto-2/episode';
import { penyusunPiksel, susunTokoh } from '../../../seni/piksel';
import type { Ekspresi } from '../../../tipe';
import { barisNode, lipatanAwal, terapkanCue, type KomposisiLatar, type Lipatan } from '../komposisi';
import { adeganPiksel, OBJEK_PIKSEL, PERAN_PIKSEL, poseHilang } from './adegan';
import { RUANG_PIKSEL, CATATAN_RUANG } from './ruang';

const ep = EPISODE_AUTO_2;
const komp = (k: Partial<KomposisiLatar>): KomposisiLatar => ({ lokasi: 'kantor', hadir: [], telepon: null, objek: [], ...k });
const tl = (id: string, ekspresi: Ekspresi = 'netral', bicara = false) => ({ id, ekspresi, bicara });

test('pemetaan cue: kantor -> ruang piksel, Miss Raksa berdiri di balik meja hadap kanan, Hendra di depan meja hadap kiri', () => {
  const h = adeganPiksel(ep, komp({ hadir: [tl('missRaksa', 'serius', true), tl('hendra', 'lega')] }));
  assert.ok(h.piksel, String(h.alasan));
  assert.equal(h.piksel.ruang, 'kantor-ep2');
  assert.deepEqual(h.piksel.tokoh.map((x) => [x.id, x.tokoh, x.tempat, x.pose, x.hadap, x.ekspresi, x.bicara]), [
    ['missRaksa', 'missRaksa', 'balikMeja', 'berdiri', 'kanan', 'serius', true],
    ['hendra', 'hendra', 'slot', 'berdiri', 'kiri', 'lega', false],
  ]);
});

test('pemetaan cue: telepon Hendra = sisipan wajah, objek berkas/surat = prop, kosong = ruang tanpa tokoh', () => {
  const h = adeganPiksel(ep, komp({ telepon: tl('hendra', 'cemas', true), objek: ['berkas', 'surat'] })).piksel!;
  assert.deepEqual(h.telepon, { id: 'hendra', tokoh: 'hendra', ekspresi: 'cemas', bicara: true });
  assert.deepEqual(h.prop, ['map', 'surat']);
  assert.deepEqual(adeganPiksel(ep, komp({})).piksel, { ruang: 'kantor-ep2', tokoh: [], telepon: null, prop: [] });
});

test('Stage 2: semua lokasi AUTO-2 berpiksel; cadangan hanya untuk lokasi/objek/jumlah yang memang tak terpetakan', () => {
  for (const lokasi of ['kantor', 'pool', 'bengkel', 'tol', 'wawancara']) assert.equal(adeganPiksel(ep, komp({ lokasi })).piksel?.ruang, `${lokasi}-ep2`);
  const tiga = adeganPiksel(ep, komp({ lokasi: 'wawancara', hadir: [tl('tol'), tl('bima'), tl('polisi')] })).piksel!;
  assert.deepEqual(tiga.tokoh.map((x) => [x.id, x.tempat, x.slot, x.jumlahSlot]), [['tol', 'slot', 0, 3], ['bima', 'slot', 1, 3], ['polisi', 'slot', 2, 3]]);
  assert.match(adeganPiksel(ep, komp({ lokasi: 'luar-angkasa' })).alasan!, /tanpa ruang piksel/);
  assert.match(adeganPiksel(ep, komp({ hadir: [tl('pemain')] })).alasan!, /pemeran pemain/);
  assert.match(adeganPiksel(ep, komp({ objek: ['kunci'] })).alasan!, /objek kunci/);
  assert.match(adeganPiksel(ep, komp({ hadir: ['rudi', 'bima', 'darto', 'admin'].map((x) => tl(x)) })).alasan!, /4 tokoh berdiri/);
});

test('ruang-ep2: setiap ruang punya latar, slot 1..3, dan prop untuk objek yang dipetakan di lokasi naskahnya', () => {
  assert.deepEqual(CATATAN_RUANG, []);
  assert.deepEqual(RUANG_PIKSEL['kantor-ep2']!.lapisan.map((l) => l.id), ['latar', 'meja']);
  assert.ok(RUANG_PIKSEL['kantor-ep2']!.tempat.balikMeja, 'balikMeja');
  assert.deepEqual(RUANG_PIKSEL['pool-ep2']!.lapisan.map((l) => l.id), ['latar', 'trailer'], 'trailer rusak selalu di pool');
  for (const id of ['kantor', 'pool', 'bengkel', 'tol', 'wawancara']) for (const n of [1, 2, 3]) assert.equal(RUANG_PIKSEL[`${id}-ep2`]!.slot[n]?.length, n, `${id} slot ${n}`);
});

test('pose atlas: semua pose yang bisa diminta adapter ada; pose yang tidak ada TERDETEKSI', () => {
  const m = (id: Parameters<typeof penyusunPiksel.tersedia>[0]) => penyusunPiksel.manifest[id];
  assert.deepEqual(poseHilang(m), []);
  assert.deepEqual(poseHilang(m, { hendra: { tokoh: 'hendra', tempat: 'slot', pose: 'duduk', hadap: 'kiri' } }), ['hendra: pose duduk/kiri tidak ada di atlas hendra']);
  assert.deepEqual(poseHilang(m, { hendra: { tokoh: 'hendra', tempat: 'slot', pose: 'berdiri', hadap: 'kanan' } }), ['hendra: pose berdiri/kanan tidak ada di atlas hendra']);
});

/** Semua id node penerus (setiap nilai "lanjut" di dalam node: dialog, pilihan, hasil aktivitas, cabang). */
function penerus(n: unknown): string[] {
  const hasil: string[] = [];
  const jalan = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(jalan);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k === 'lanjut' && typeof x === 'string') hasil.push(x); else jalan(x); }
  };
  jalan(n);
  return hasil;
}

/** Semua komposisi yang bisa muncul: telusuri graf naskah dari node mulai, lipatan cue dibawa sepanjang jalur. */
function semuaKomposisi(): Lipatan[] {
  const hasil: Lipatan[] = [];
  const dilihat = new Set<string>();
  const antre: [string, Lipatan][] = [[ep.mulai, lipatanAwal(ep)]];
  while (antre.length) {
    const [id, masuk] = antre.pop()!;
    const kunci = id + JSON.stringify(masuk);
    if (dilihat.has(kunci) || !ep.node[id]) continue;
    dilihat.add(kunci);
    const n = ep.node[id]!;
    let k = terapkanCue(masuk, 'tata' in n ? n.tata : undefined);
    hasil.push(k);
    for (const b of barisNode(n)) { k = terapkanCue(k, b.tata); hasil.push(k); }
    for (const p of penerus(n)) antre.push([p, k]);
  }
  return hasil;
}

test('naskah AUTO-2 (SELURUH episode): setiap komposisi = piksel tanpa cadangan; pose & ekspresi yang diminta ada di atlas', () => {
  const EKSPRESI: Ekspresi[] = ['netral', 'tersenyum', 'senang', 'cemas', 'bingung', 'serius', 'kesal', 'lega'];
  const alasan = new Set<string>();
  let piksel = 0;
  const diminta = new Set<string>();
  const lokasi = new Set<string>();
  for (const l of semuaKomposisi()) {
    const k: KomposisiLatar = { lokasi: l.lokasi, hadir: l.hadir.filter((x) => x !== l.telepon).map((id) => tl(id)), telepon: l.telepon ? tl(l.telepon) : null, objek: l.objek };
    const h = adeganPiksel(ep, k);
    if (!h.piksel) { alasan.add(h.alasan); continue; }
    piksel++;
    const r = RUANG_PIKSEL[h.piksel.ruang]!;
    assert.ok(r, h.piksel.ruang);
    for (const p of h.piksel.prop) assert.ok(r.prop[p], `${h.piksel.ruang}: prop ${p}`);
    for (const t of h.piksel.tokoh) assert.ok(t.tempat === 'balikMeja' ? r.tempat.balikMeja : r.slot[t.jumlahSlot]?.[t.slot], `${h.piksel.ruang}: tempat ${t.id}`);
    lokasi.add(l.lokasi);
    for (const t of h.piksel.tokoh) {
      for (const e of EKSPRESI) {
        const s = susunTokoh(t.tokoh, { pose: t.pose as never, hadap: t.hadap, ekspresi: e })!;
        assert.ok(s, `${t.id} tersusun`);
        assert.equal(s.pose, t.pose, `${t.id}/${e}: pose tanpa cadangan`);
        assert.equal(s.hadap, t.hadap, `${t.id}/${e}: arah tanpa cadangan`);
        assert.notEqual(s.ekspresi, '', `${t.id}/${e}: wajah ekspresi ada`);
        diminta.add(`${t.id}:${t.pose}:${t.hadap}`);
      }
    }
    if (h.piksel.telepon) for (const e of EKSPRESI) assert.ok(penyusunPiksel.teleponSisipan(e, 56, { tokoh: h.piksel.telepon.tokoh }), `sisipan ${e}`);
  }
  assert.ok(piksel > 0);
  // Stage 2: TIDAK ADA komposisi naskah yang jatuh ke ilustrasi.
  assert.deepEqual([...alasan], []);
  assert.deepEqual([...lokasi].sort(), ['bengkel', 'kantor', 'pool', 'tol', 'wawancara']);
  assert.deepEqual([...diminta].sort(), ['admin:berdiri:kiri', 'bima:berdiri:kiri', 'darto:berdiri:kiri', 'missRaksa:berdiri:kanan', 'polisi:berdiri:kiri', 'rudi:berdiri:kiri', 'tol:berdiri:kiri']);
});

test('ekspresi Hendra: pemetaan owner (lega -> senang) dan setiap ekspresi cerita punya wajah sendiri', () => {
  const peta: Record<string, string> = { bingung: 'panik', cemas: 'cemas', kesal: 'kecewa', netral: 'tenang', serius: 'tenang', lega: 'senang', senang: 'senang', tersenyum: 'senang' };
  for (const [e, w] of Object.entries(peta)) assert.equal(susunTokoh('hendra', { pose: 'berdiri', ekspresi: e as Ekspresi })!.ekspresi, w, e);
});

test('sampul episode (kartu /cerita): pool + Hendra di panggung piksel', () => {
  const h = adeganPiksel(ep, { lokasi: ep.latar!.sampul.lokasi, hadir: ep.latar!.sampul.hadir.map((id) => tl(id, 'cemas')), telepon: null, objek: [] }).piksel!;
  assert.equal(h.ruang, 'pool-ep2');
  assert.deepEqual(h.tokoh.map((x) => [x.id, x.pose, x.hadap]), [['hendra', 'berdiri', 'kiri']]);
});

test('tokoh samping: dua wajah (netral/prihatin) sesuai peta D-85', () => {
  for (const id of ['rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const) {
    for (const e of ['netral', 'tersenyum', 'senang', 'lega'] as Ekspresi[]) assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: e })!.ekspresi, 'netral', `${id}/${e}`);
    for (const e of ['cemas', 'serius', 'bingung', 'kesal'] as Ekspresi[]) assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: e })!.ekspresi, 'prihatin', `${id}/${e}`);
  }
});
