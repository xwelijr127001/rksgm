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
/** T-019: jumlah pose jalan Hendra di kantor pada 360 / 390 / 1280 (sama dengan POSE_HARAPAN_HENDRA di tools/cek-jalan-t017.mjs). */
const POSE_HENDRA = [6, 5, 7];
const komp = (k: Partial<KomposisiLatar>): KomposisiLatar => ({ lokasi: 'kantor', hadir: [], telepon: null, objek: [], ...k });
const tl = (id: string, ekspresi: Ekspresi = 'netral', bicara = false) => ({ id, ekspresi, bicara });

test('pemetaan cue: kantor -> ruang piksel, Miss Raksa berdiri di balik meja hadap kanan, pengunjung di depan meja hadap kiri (cermin, D-93)', () => {
  const h = adeganPiksel(ep, komp({ hadir: [tl('missRaksa', 'serius', true), tl('hendra', 'lega')] }));
  assert.ok(h.piksel, String(h.alasan));
  assert.equal(h.piksel.ruang, 'kantor-ep2');
  assert.deepEqual(h.piksel.tokoh.map((x) => [x.id, x.tokoh, x.tempat, x.pose, x.hadap, x.cermin, x.ekspresi, x.bicara]), [
    ['missRaksa', 'missRaksa', 'balikMeja', 'berdiri', 'kanan', false, 'serius', true],
    ['hendra', 'hendra', 'slot', 'berdiri', 'kiri', true, 'lega', false],
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
  assert.deepEqual(poseHilang(m, { hendra: { tokoh: 'hendra', tempat: 'slot', pose: 'duduk', hadap: 'kanan', satuArah: 'kanan' } }), ['hendra: pose duduk/kanan tidak ada di atlas hendra']);
  assert.deepEqual(poseHilang(m, { hendra: { tokoh: 'hendra', tempat: 'slot', pose: 'berdiri', hadap: 'kiri' } }), ['hendra: pose berdiri/kiri tidak ada di atlas hendra']);
  // D-93: frame atlas Hendra & tokoh samping bernama -kanan (seni menghadap kanan); tidak ada frame -kiri (kiri = cermin).
  for (const id of ['hendra', 'rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const) assert.deepEqual(Object.keys(m(id)!.pose.berdiri!).filter((k) => k === 'kiri' || k === 'kanan'), ['kanan'], id);
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
        const arah = t.satuArah ?? t.hadap;
        assert.equal(t.cermin, !!t.satuArah && t.satuArah !== t.hadap, `${t.id}: cermin hanya untuk atlas satu arah`);
        const s = susunTokoh(t.tokoh, { pose: t.pose as never, hadap: arah, ekspresi: e })!;
        assert.ok(s, `${t.id} tersusun`);
        assert.equal(s.pose, t.pose, `${t.id}/${e}: pose tanpa cadangan`);
        assert.equal(s.hadap, arah, `${t.id}/${e}: arah atlas tanpa cadangan`);
        assert.notEqual(s.ekspresi, '', `${t.id}/${e}: wajah ekspresi ada`);
        diminta.add(`${l.lokasi}/${h.piksel.tokoh.filter((x) => x.tempat === 'slot').length}:${t.id}:${t.hadap}`);
      }
    }
    if (h.piksel.telepon) for (const e of EKSPRESI) assert.ok(penyusunPiksel.teleponSisipan(e, 56, { tokoh: h.piksel.telepon.tokoh }), `sisipan ${e}`);
  }
  assert.ok(piksel > 0);
  // Stage 2: TIDAK ADA komposisi naskah yang jatuh ke ilustrasi.
  assert.deepEqual([...alasan], []);
  assert.deepEqual([...lokasi].sort(), ['bengkel', 'kantor', 'pool', 'tol', 'wawancara']);
  // Arah per adegan (D-93): kantor pengunjung kiri; pool/tol kanan; bengkel admin kiri; wawancara 1 kanan, 2 saling berhadapan,
  // 3 = kiri & tengah kanan, kanan kiri.
  assert.deepEqual([...diminta].sort(), [
    'bengkel/1:admin:kiri', 'kantor/0:missRaksa:kanan', 'kantor/1:bima:kiri', 'kantor/1:hendra:kiri', 'kantor/1:missRaksa:kanan', 'pool/1:rudi:kanan', 'tol/1:bima:kanan',
    'wawancara/1:bima:kanan', 'wawancara/2:bima:kanan', 'wawancara/2:darto:kiri', 'wawancara/3:bima:kanan', 'wawancara/3:polisi:kiri', 'wawancara/3:tol:kanan',
  ]);
});

test('ekspresi Hendra: pemetaan owner (lega -> senang) dan setiap ekspresi cerita punya wajah sendiri', () => {
  const peta: Record<string, string> = { bingung: 'panik', cemas: 'cemas', kesal: 'kecewa', netral: 'tenang', serius: 'tenang', lega: 'senang', senang: 'senang', tersenyum: 'senang' };
  for (const [e, w] of Object.entries(peta)) assert.equal(susunTokoh('hendra', { pose: 'berdiri', ekspresi: e as Ekspresi })!.ekspresi, w, e);
});

test('sampul episode (kartu /cerita): pool + Hendra di panggung piksel', () => {
  const h = adeganPiksel(ep, { lokasi: ep.latar!.sampul.lokasi, hadir: ep.latar!.sampul.hadir.map((id) => tl(id, 'cemas')), telepon: null, objek: [] }).piksel!;
  assert.equal(h.ruang, 'pool-ep2');
  assert.deepEqual(h.tokoh.map((x) => [x.id, x.pose, x.hadap, x.cermin]), [['hendra', 'berdiri', 'kanan', false]]);
});

test('tokoh samping: dua wajah (netral/prihatin) sesuai peta D-85', () => {
  for (const id of ['rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const) {
    for (const e of ['netral', 'tersenyum', 'senang', 'lega'] as Ekspresi[]) assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: e })!.ekspresi, 'netral', `${id}/${e}`);
    for (const e of ['cemas', 'serius', 'bingung', 'kesal'] as Ekspresi[]) assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: e })!.ekspresi, 'prihatin', `${id}/${e}`);
  }
});

test('D-94/D-96: trailer pool 240 x ~124 piksel seni di art x 160 dengan roda di y 172; tokoh samping punya strip kedip', () => {
  const tr = RUANG_PIKSEL['pool-ep2']!.lapisan.find((l) => l.id === 'trailer')!;
  assert.equal(tr.x, 640);
  assert.equal(tr.w, 960);
  assert.equal(tr.y + tr.h, 688);
  assert.deepEqual(RUANG_PIKSEL['pool-ep2']!.fokus, { x: 640, y: 240, w: 400, h: 460 });
  for (const id of ['rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const) {
    assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: 'netral', mata: 'tutup' })!.mata, 'tutup', id);
    assert.equal(susunTokoh(id, { pose: 'berdiri', ekspresi: 'cemas', mata: 'tutup' })!.mata, 'tutup', id);
  }
});

test('T-015: sisipan telepon tidak pernah menutupi kotak kepala tokoh (setiap adegan kantor bertelepon, 360/390/1280 + sapuan ukuran)', async () => {
  const { susunAdeganPiksel, kameraPiksel, sisipanAdegan, kotakLuarSisipan } = await import('./tata');
  const potong = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  // Kotak panggung terukur di browser (tools/cek-sisipan-t015.mjs): 360x740 DPR2, 390x844 DPR3, 1280x800 DPR1; pita dialog 22.
  const UKURAN: [number, number, number][] = [[336, 336, 2], [366, 366, 3], [780, 432, 1]];
  for (let w = 280; w <= 1300; w += 60) for (const rasio of [1, 0.8, 0.5625]) for (const dpr of [1, 2, 3]) UKURAN.push([w, Math.round(w * rasio), dpr]);
  const adegan = new Map<string, KomposisiLatar>();
  for (const l of semuaKomposisi()) {
    if (l.lokasi !== 'kantor' || !l.telepon) continue;
    const hadir = l.hadir.filter((x) => x !== l.telepon);
    if (hadir.length) adegan.set(hadir.join('+') + '/' + l.telepon, { lokasi: l.lokasi, hadir: hadir.map((id) => tl(id)), telepon: tl(l.telepon), objek: l.objek });
  }
  // T-019: tiga akhir kini tatap muka, jadi naskah TIDAK lagi punya adegan kantor bersisipan + tokoh di panggung. Aturannya
  // tetap dijaga: Miss Raksa + telepon Hendra (susunan akhir yang lama) dan Bima + telepon.
  assert.deepEqual([...adegan.keys()], []);
  adegan.set('missRaksa/hendra', komp({ hadir: [tl('missRaksa')], telepon: tl('hendra') }));
  adegan.set('missRaksa+bima/hendra', komp({ hadir: [tl('missRaksa'), tl('bima')], telepon: tl('hendra') }));
  const letakHp = new Set<string>();
  for (const [nama, k] of adegan) {
    const a = adeganPiksel(ep, k).piksel!;
    const r = RUANG_PIKSEL[a.ruang]!;
    const tokoh = susunAdeganPiksel(a, r, { kedip: false, mulut: false });
    for (const [W, H, dpr] of UKURAN) {
      const kam = kameraPiksel(r, tokoh, W, H, dpr, 22);
      const { tata, kepala } = sisipanAdegan(r, tokoh, kam, W, H, dpr, 22, 56);
      const luar = kotakLuarSisipan(tata);
      assert.equal(kepala.length, tokoh.length);
      assert.ok(!kepala.some((h) => potong(luar, h)), `${nama} ${W}x${H}@${dpr}: sisipan ${tata.letak} menutupi kepala`);
      assert.ok(luar.x >= 0 && luar.y >= 0 && luar.x + luar.w <= W * dpr && luar.y + luar.h <= (H - 22) * dpr, `${nama} ${W}x${H}@${dpr}: sisipan keluar panggung`);
      if (nama === 'missRaksa/hendra' && (W === 336 || W === 366) && H === W) letakHp.add(tata.letak);
    }
  }
  // HP: kanan atas = di atas kepala Miss Raksa (bug owner), jadi sisipan pindah ke kiri di bawah papan (papan tetap terbaca).
  assert.deepEqual([...letakHp], ['kiri-bawah-papan']);
});

test('D-102 (T-016): teks papan latar aktivitas = teks papan panggung (merek, sama di semua bahasa) dan muat di papan', async () => {
  const { TEKS_PAPAN_KANTOR, titikPapanKantor } = await import('./papan');
  const { titikTeks } = await import('./hurufPiksel');
  const { TEKS_AUTO_2_ID: TEKS_ID } = await import('../../../episode/auto-2/teks.id');
  const papan = RUANG_PIKSEL['kantor-ep2']!.papan!;
  assert.equal(TEKS_ID[papan.teksKunci], TEKS_PAPAN_KANTOR);
  const t = titikPapanKantor(papan.kotak, 4, titikTeks)!;
  assert.ok(t && t.titik.length > 100);
  for (const [x, y] of t.titik) assert.ok(x * 4 >= papan.kotak.x && x * 4 < papan.kotak.x + papan.kotak.w && y * 4 >= papan.kotak.y && y * 4 < papan.kotak.y + papan.kotak.h);
});

test('T-017 (D-104): Rudi punya dua bingkai jalan di atlas samping; rencana jalan K04 pool = dari tepi kiri ke slot 420', async () => {
  const { kameraPiksel, LANGKAH_JALAN_MS, posisiJalan, punyaJalan, rencanaJalan, susunAdeganPiksel } = await import('./tata');
  // Rudi (T-017) dan Hendra (T-019, D-105); tokoh lain tetap luncur 180 md.
  assert.deepEqual((['missRaksa', 'hendra', 'rudi', 'bima', 'darto', 'admin', 'tol', 'polisi'] as const).filter((id) => punyaJalan(id)), ['hendra', 'rudi']);
  const berdiri = susunTokoh('rudi', { pose: 'berdiri', hadap: 'kanan', ekspresi: 'netral' })!;
  for (const pose of ['jalan-a', 'jalan-b'] as const) {
    const s = susunTokoh('rudi', { pose: pose as never, hadap: 'kanan', ekspresi: 'cemas', mata: 'tutup' })!;
    assert.equal(s.pose, pose);
    assert.equal(s.hadap, 'kanan');
    // Wajah terpanggang: hanya lapisan tubuh (tanpa ekspresi / kedip), tinggi = berdiri (pitch 4,35: tanpa lompatan saat berhenti).
    assert.equal(s.lapisan.length, 1, pose);
    assert.equal(s.ukuran.h, berdiri.ukuran.h, pose);
    assert.equal(s.jangkar.y, berdiri.jangkar.y, pose);
    // Kepala tidak melompat mendatar: selisih pusat kepala terhadap jangkar sama dengan berdiri (± 0,5 piksel seni).
    assert.ok(Math.abs((s.kepala.x - s.jangkar.x) - (berdiri.kepala.x - berdiri.jangkar.x)) <= 0.5, pose);
  }
  const a = adeganPiksel(ep, komp({ lokasi: 'pool', hadir: [tl('rudi')] })).piksel!;
  const r = RUANG_PIKSEL[a.ruang]!;
  const tokoh = susunAdeganPiksel(a, r, { kedip: false, mulut: false });
  assert.equal(tokoh[0]!.kakiX, 420);
  for (const [W, H, dpr] of [[336, 336, 2], [366, 366, 3], [780, 432, 1]] as const) {
    const kam = kameraPiksel(r, tokoh, W, H, dpr, 0);
    const rj = rencanaJalan(420, tokoh[0]!.s.ukuran.w * 4, kam, W);
    assert.equal(rj.arah, 'kanan', 'masuk dari kiri, berjalan ke kanan');
    assert.ok(rj.awal + tokoh[0]!.s.ukuran.w * 4 <= kam.x + 1e-6, 'mulai di luar tepi kiri pandangan');
    assert.ok(rj.n >= 3 && rj.n <= 6);
    assert.equal(rj.durasi, rj.n * LANGKAH_JALAN_MS);
    let lalu = -Infinity;
    for (let t = 0; t < rj.durasi; t += 15) {
      const p = posisiJalan(rj, t)!;
      assert.equal((p.x - 420) % 4 === 0, true, 'piksel seni bulat');
      assert.ok(p.x >= lalu && p.x <= 420, 'maju terus, tidak melewati slot');
      lalu = p.x;
    }
    assert.equal(posisiJalan(rj, rj.durasi - 1)!.pose, 'jalan-b', 'bingkai terakhir = lintas');
    assert.notEqual(posisiJalan(rj, rj.durasi - 1 - LANGKAH_JALAN_MS)!.pose, 'jalan-b', 'bergantian');
    assert.equal(posisiJalan(rj, rj.durasi), null, 'tiba = berdiri');
  }
});

test('T-017 fix D-125: 41 piksel seni per pose -> K04 pool 4 / 3 / 4 pose di 360 / 390 / 1280; berakhir lintas', async () => {
  const { kameraPiksel, LANGKAH_JALAN_DUNIA, LANGKAH_JALAN_MS, posisiJalan, rencanaJalan, susunAdeganPiksel } = await import('./tata');
  assert.equal(LANGKAH_JALAN_DUNIA, 164);
  assert.equal(LANGKAH_JALAN_MS, 270);
  const a = adeganPiksel(ep, komp({ lokasi: 'pool', hadir: [tl('rudi')] })).piksel!;
  const r = RUANG_PIKSEL[a.ruang]!;
  const tokoh = susunAdeganPiksel(a, r, { kedip: false, mulut: false });
  // Kotak panggung pool terukur (tools/cek-kaki-t017.mjs): 360 -> 336x252 DPR2, 390 -> 366x275 DPR3, 1280 -> 780x400 DPR1.
  const hasil = ([[336, 252, 2], [366, 275, 3], [780, 400, 1]] as const).map(([W, H, dpr]) => {
    const rj = rencanaJalan(420, tokoh[0]!.s.ukuran.w * 4, kameraPiksel(r, tokoh, W, H, dpr, 0), W);
    assert.equal(posisiJalan(rj, rj.durasi - 1)!.pose, 'jalan-b');
    const perPose = Math.abs(rj.tujuan - rj.awal) / rj.n / 4;
    assert.ok(perPose >= 34 && perPose <= 46, `${W}: ${perPose} piksel seni per pose (gambar: 41)`);
    return [rj.n, posisiJalan(rj, 0)!.pose];
  });
  assert.deepEqual(hasil, [[4, 'jalan-a'], [3, 'jalan-b'], [4, 'jalan-a']]);
});

test('T-019 (D-105): akhir tatap muka: Hendra punya dua bingkai jalan, masuk dari tepi KANAN (cermin) ke x 1040 (D-135); tanpa sisipan', async () => {
  const { kameraPiksel, langkahJalan, LANGKAH_JALAN_MS, POSE_JALAN_MAKS, posisiJalan, rencanaJalan, susunAdeganPiksel } = await import('./tata');
  // D-136: jarak per pose per tokoh (Hendra 128 dunia = 32 piksel seni; Rudi tetap 164), paling banyak 7 pose.
  assert.deepEqual([langkahJalan('hendra'), langkahJalan('rudi'), POSE_JALAN_MAKS], [128, 164, 7]);
  const berdiri = susunTokoh('hendra', { pose: 'berdiri', hadap: 'kanan', ekspresi: 'netral' })!;
  // Jangkar Designer (hendra-jalan-v1.md): kontak x51 y194, lintas x37 y195.
  const JANGKAR = { 'jalan-a': { x: 51, y: 194 }, 'jalan-b': { x: 37, y: 195 } } as const;
  for (const pose of ['jalan-a', 'jalan-b'] as const) {
    const s = susunTokoh('hendra', { pose: pose as never, hadap: 'kanan', ekspresi: 'kesal', mata: 'tutup' })!;
    assert.equal(s.pose, pose);
    assert.equal(s.hadap, 'kanan');
    assert.equal(s.lapisan.length, 1, 'wajah terpanggang: tanpa lapisan ekspresi / kedip');
    assert.deepEqual(s.jangkar, JANGKAR[pose]);
    assert.ok(Math.abs(s.ukuran.h - berdiri.ukuran.h) <= 1, 'tinggi = berdiri (kontak 1 piksel seni lebih rendah: naik-turun langkah tergambar)');
    assert.ok(Math.abs((s.kepala.x - s.jangkar.x) - (berdiri.kepala.x - berdiri.jangkar.x)) <= 0.5, 'kepala tidak melompat mendatar');
  }
  // Tiga akhir di naskah: kantor, Miss Raksa di balik meja + Hendra di slot tamu hadap kiri (cermin), TANPA telepon.
  for (const akhir of ['puas', 'catatan', 'kurang']) {
    const t = ep.node[`akhir-${akhir}`]!.tata!;
    const a = adeganPiksel(ep, komp({ lokasi: t.lokasi!, hadir: (t.hadir ?? []).map((id) => tl(id)), telepon: null })).piksel!;
    assert.equal(a.telepon, null);
    assert.deepEqual(a.tokoh.map((x) => [x.id, x.tempat, x.hadap, x.cermin]), [['missRaksa', 'balikMeja', 'kanan', false], ['hendra', 'slot', 'kiri', true]]);
  }
  const a = adeganPiksel(ep, komp({ hadir: [tl('missRaksa'), tl('hendra')] })).piksel!;
  const r = RUANG_PIKSEL[a.ruang]!;
  const tokoh = susunAdeganPiksel(a, r, { kedip: false, mulut: false });
  const h = tokoh.find((x) => x.t.id === 'hendra')!;
  // D-135: Hendra di x 1040 (xTokoh), Pak Bima di slot yang sama tetap 980.
  assert.equal(h.kakiX, 1040);
  const bima = adeganPiksel(ep, komp({ hadir: [tl('bima')] })).piksel!;
  assert.equal(susunAdeganPiksel(bima, r, { kedip: false, mulut: false })[0]!.kakiX, 980);
  // Kotak panggung kantor terukur (tools/cek-akhir-t019.mjs): 360 -> 336x210 DPR2, 390 -> 366x229 DPR3, 1280 -> 780x400 DPR1.
  const hasil = ([[336, 210, 2], [366, 229, 3], [780, 400, 1]] as const).map(([W, H, dpr]) => {
    const kam = kameraPiksel(r, tokoh, W, H, dpr, 22);
    const rj = rencanaJalan(h.kakiX, h.s.ukuran.w * 4, kam, W, langkahJalan('hendra'));
    const perPose = Math.abs(rj.tujuan - rj.awal) / rj.n / 4;
    assert.ok(perPose >= 29 && perPose <= 37, `${W}: ${perPose} piksel seni per pose (gambar Hendra: 29 lalu 37)`);
    assert.equal(rj.arah, 'kiri', 'masuk dari kanan, berjalan ke kiri');
    assert.ok(rj.awal - h.s.ukuran.w * 4 >= kam.x + W / kam.s - 1e-6, 'mulai di luar tepi kanan pandangan');
    assert.ok(rj.n >= 3 && rj.n <= 7);
    assert.equal(rj.durasi, rj.n * LANGKAH_JALAN_MS);
    let lalu = Infinity;
    for (let t = 0; t < rj.durasi; t += 15) {
      const p = posisiJalan(rj, t)!;
      assert.equal((p.x - 1040) % 4 === 0, true, 'piksel seni bulat');
      assert.ok(p.x <= lalu && p.x >= 1040, 'maju terus ke kiri, tidak melewati slot');
      lalu = p.x;
    }
    assert.equal(posisiJalan(rj, rj.durasi - 1)!.pose, 'jalan-b', 'bingkai terakhir = lintas');
    assert.equal(posisiJalan(rj, rj.durasi), null, 'tiba = berdiri');
    return rj.n;
  });
  assert.deepEqual(hasil, POSE_HENDRA);
});

test('T-017 fix D-126: ruang lapangan, kamera turun sampai telapak utuh bila kepala masih punya 2 piksel seni udara; bidikan dekat & kantor tidak disentuh', async () => {
  const { kameraPiksel, susunAdeganPiksel, turunkanKeKaki } = await import('./tata');
  const lihat = (lokasi: string, id: string, W: number, H: number, dpr: number) => {
    const a = adeganPiksel(ep, komp({ lokasi, hadir: [tl(id)] })).piksel!;
    const r = RUANG_PIKSEL[a.ruang]!;
    const tokoh = susunAdeganPiksel(a, r, { kedip: false, mulut: false });
    const k = kameraPiksel(r, tokoh, W, H, dpr, 0);
    const x = tokoh[0]!;
    return { k, potong: (x.y + (x.s.jangkar.y + 1) * 4 - (k.y + H / k.s)) / 4, udara: (x.y - k.y) / 4, r, tokoh };
  };
  // 1280 (780x400): pool, bengkel, tol dulu memotong 11 / 8 / 11 piksel seni sepatu; sekarang utuh, kepala >= 2 piksel seni dari tepi.
  for (const [lokasi, id] of [['pool', 'rudi'], ['bengkel', 'admin'], ['tol', 'bima']] as const) {
    const v = lihat(lokasi, id, 780, 400, 1);
    assert.ok(v.potong <= 0, `${lokasi} 1280: kaki terpotong ${v.potong}`);
    assert.ok(v.udara >= 2, `${lokasi} 1280: udara kepala ${v.udara}`);
    assert.equal((v.k.y * v.k.s) % 1, 0, 'tetap di piksel perangkat bulat');
  }
  // 390 pool (366x275 DPR3): dulu 4,5 piksel seni terpotong.
  const p390 = lihat('pool', 'rudi', 366, 275, 3);
  assert.ok(p390.potong <= 0 && p390.udara >= 2, JSON.stringify([p390.potong, p390.udara]));
  // Bidikan dekat HP (bengkel 336x252: kaki terpotong ~40 piksel seni) tidak bisa utuh -> kamera TIDAK diubah.
  const dekat = lihat('bengkel', 'admin', 336, 252, 2);
  assert.ok(dekat.potong > 30);
  assert.deepEqual(turunkanKeKaki(dekat.k, dekat.r, dekat.tokoh, 336, 252, 2), dekat.k);
  // Kantor (meja layanan): tidak pernah digeser.
  const a = adeganPiksel(ep, komp({ hadir: [tl('missRaksa'), tl('bima')] })).piksel!;
  const rk = RUANG_PIKSEL[a.ruang]!;
  const tk = susunAdeganPiksel(a, rk, { kedip: false, mulut: false });
  const kk = { s: 0.5, x: 0, y: 0 };
  assert.equal(turunkanKeKaki(kk, rk, tk, 780, 400, 1), kk);
});
