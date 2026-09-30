/**
 * TES SUTRADARA & GERAK KECIL panggung v3 dengan Animation & jam PALSU (tanpa DOM). Yang dijaga:
 *  - Rencana selesai sendiri tepat sekali; `selesaikan()` di tengah = semua animasi dibatalkan + selesai sekali;
 *    callback timer lama yang terlambat tidak menyelesaikan rencana baru (token generasi).
 *  - Rencana baru menggantikan yang lama tanpa memanggil selesai milik rencana lama (tidak ada tokoh hantu).
 *  - `hentikan()` (unmount) membersihkan animasi & timer tanpa callback. Animator yang melempar tidak menghentikan
 *    panggung.
 *  - Gerak kecil: kedip terjadwal 3-6 dtk per tokoh dan tidak serempak, dijeda saat tab tersembunyi, tidak saat
 *    tokoh itu bicara; mulut bergantian hanya selama bicara; semua timer lepas saat henti. Kedip yang sedang
 *    berjalan dibatalkan saat gambar berganti (batalKedip).
 *  - Rencana yang ditahan (`tunggu`): tetap di keadaan awal sampai bingkai mengalir (atau batas waktu), lalu berjalan
 *    utuh; selesaikan/hentikan saat ditahan membatalkan permintaan bingkainya.
 *  - Penjadwal idle pemanas (panas.ts): satu langkah per giliran bila waktu idle sempit, beberapa bila longgar;
 *    batal = tidak ada langkah lagi; langkah yang melempar menghentikan pemanasan tanpa galat.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Rencana } from './rencana';
import { GerakKecil, kfTerlihat, Sutradara, TUNGGU_MAKS, type AnimasiLike, type Animator, type Jam } from './sutradara';
import { jalankanSaatIdle, type JamIdle } from './panas';

class AnimasiPalsu implements AnimasiLike {
  batal = 0;
  jeda = 0;
  main = 0;
  currentTime: number | null = null;
  constructor(readonly el: Element, readonly kf: Keyframe[], readonly opsi: KeyframeAnimationOptions) {}
  cancel() { this.batal++; }
  pause() { this.jeda++; }
  play() { this.main++; }
}

function palsu() {
  const semua: AnimasiPalsu[] = [];
  const animator: Animator = (el, kf, opsi) => {
    const a = new AnimasiPalsu(el, kf, opsi);
    semua.push(a);
    return a;
  };
  let kini = 0;
  let id = 0;
  const timer = new Map<number, { t: number; fn: () => void }>();
  const jam: Jam = {
    setTimeout: (fn, ms) => { timer.set(++id, { t: kini + ms, fn }); return id; },
    clearTimeout: (x) => { timer.delete(x as number); },
  };
  const maju = (ms: number) => {
    const batas = kini + ms;
    for (;;) {
      const berikut = [...timer.entries()].filter(([, v]) => v.t <= batas).sort((a, b) => a[1].t - b[1].t)[0];
      if (!berikut) break;
      timer.delete(berikut[0]);
      kini = berikut[1].t;
      berikut[1].fn();
    }
    kini = batas;
  };
  return { semua, animator, jam, maju, timer };
}

const el = (nama: string) => ({ nama }) as unknown as Element;
const RENCANA: Rencana = {
  jenis: 'masuk',
  durasi: 3000,
  aktor: [],
  gerak: [
    { target: 'pintu', keyframes: [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }] },
    { target: 'tokoh:nasabah', keyframes: [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }] },
    { target: 'hilang', keyframes: [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }] },
  ],
  lewati: true,
};
const cari = (t: string) => (t === 'hilang' ? [] : [el(t)]);

test('rencana berjalan dengan durasi sama & fill both, lalu selesai sendiri tepat sekali', () => {
  const p = palsu();
  const s = new Sutradara(p.animator, p.jam);
  let selesai = 0;
  s.mainkan(RENCANA, cari, () => { selesai++; });
  assert.equal(p.semua.length, 2, 'target tanpa elemen dilewati');
  assert.ok(p.semua.every((a) => a.opsi.duration === 3000 && a.opsi.fill === 'both'));
  assert.equal(s.aktif?.jenis, 'masuk');
  p.maju(2999);
  assert.equal(selesai, 0);
  p.maju(100);
  assert.equal(selesai, 1);
  assert.ok(p.semua.every((a) => a.batal === 1), 'animasi dilepas (elemen kembali ke gaya bawaan = komposisi akhir)');
  assert.equal(s.aktif, null);
  p.maju(10_000);
  assert.equal(selesai, 1);
});

test('selesaikan di tengah (Lanjut / Lewati pembuka) = komposisi akhir seketika, selesai sekali, timer lama mati', () => {
  const p = palsu();
  const s = new Sutradara(p.animator, p.jam);
  let selesai = 0;
  s.mainkan(RENCANA, cari, () => { selesai++; });
  p.maju(800);
  assert.equal(s.selesaikan(), true);
  assert.equal(selesai, 1);
  assert.ok(p.semua.every((a) => a.batal === 1));
  assert.equal(s.selesaikan(), false, 'tekanan berikutnya tidak menemukan gerak (tidak ada efek ganda)');
  assert.equal(p.timer.size, 0);
  p.maju(5000);
  assert.equal(selesai, 1);
});

test('rencana baru menggantikan: yang lama dibatalkan TANPA memanggil selesai-nya; timer lama tidak menyelesaikan yang baru', () => {
  const p = palsu();
  const s = new Sutradara(p.animator, p.jam);
  const log: string[] = [];
  const g1 = s.mainkan(RENCANA, cari, () => log.push('lama'));
  p.maju(1000);
  const g2 = s.mainkan({ ...RENCANA, durasi: 5000 }, cari, () => log.push('baru'));
  assert.ok(g2 > g1);
  assert.ok(p.semua.slice(0, 2).every((a) => a.batal === 1), 'animasi lama dibatalkan');
  p.maju(2100); // saat timer rencana lama semestinya jatuh
  assert.deepEqual(log, [], 'rencana baru tidak diselesaikan oleh timer lama');
  p.maju(3000);
  assert.deepEqual(log, ['baru']);
});

test('dipaskan ulang (tinggi kotak berubah sedikit): rencana dilanjutkan dari posisinya, selesai tepat sekali di akhir durasi', () => {
  const p = palsu();
  let kini = 0;
  const s = new Sutradara(p.animator, { ...p.jam, sekarang: () => kini });
  const log: string[] = [];
  s.mainkan(RENCANA, cari, () => log.push('pertama'));
  kini = 1200;
  assert.equal(s.waktu, 1200, 'posisi dari jam bila animasi tidak melaporkan posisinya (null)');
  // Seperti Panggung: hentikan (tanpa callback) lalu mainkan rencana yang dihitung ulang mulai 1200 md.
  s.hentikan();
  s.mainkan(RENCANA, cari, () => log.push('lanjutan'), 1200);
  const baru = p.semua.slice(-2);
  assert.ok(baru.every((a) => a.currentTime === 1200), 'animasi baru mulai di posisi lama');
  assert.equal(s.waktu, 1200, 'currentTime animasi = posisi');
  p.maju(1799);
  assert.deepEqual(log, [], 'tidak selesai sebelum sisa durasi habis');
  p.maju(100);
  assert.deepEqual(log, ['lanjutan'], 'selesai sekali pada sisa durasi (3000 - 1200 md)');
  assert.equal(s.waktu, null);
});

test('hentikan (unmount) membersihkan tanpa callback; animator yang melempar tidak menghentikan panggung', () => {
  const p = palsu();
  let lempar = true;
  const animator: Animator = (e, k, o) => { if (lempar) { lempar = false; throw new Error('keyframe'); } return p.animator(e, k, o); };
  const s = new Sutradara(animator, p.jam);
  let selesai = 0;
  s.mainkan(RENCANA, cari, () => { selesai++; });
  assert.equal(p.semua.length, 1);
  s.hentikan();
  assert.equal(selesai, 0);
  assert.equal(p.timer.size, 0);
  assert.equal(p.semua[0]!.batal, 1);
});

test('kedip: terjadwal 3-6 dtk per tokoh, tidak serempak, 120 md; dijeda saat tab tersembunyi; henti melepas timer', () => {
  const p = palsu();
  const acak = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4];
  let i = 0;
  const g = new GerakKecil(p.animator, p.jam, () => acak[i++ % acak.length]!);
  const mentor = { kunci: 'mentor', napas: el('napasM'), dasar: el('dasarM'), kedip: el('kedipM') };
  const nasabah = { kunci: 'nasabah', napas: el('napasN'), dasar: el('dasarN'), kedip: el('kedipN') };
  g.mulai([mentor, nasabah]);
  const napas = p.semua.filter((a) => a.opsi.iterations === Infinity);
  assert.equal(napas.length, 2, 'napas per tokoh');
  assert.notEqual(napas[0]!.opsi.delay, napas[1]!.opsi.delay, 'napas tidak serempak');
  const jadwal = [...p.timer.values()].map((v) => v.t);
  assert.equal(jadwal.length, 2);
  assert.ok(jadwal.every((t) => t >= 3000 && t <= 6000), `jadwal kedip 3-6 dtk: ${jadwal}`);
  assert.notEqual(jadwal[0], jadwal[1], 'kedip tidak serempak');
  p.maju(6000);
  const kedip = p.semua.filter((a) => a.opsi.duration === 120);
  assert.equal(kedip.length, 4, 'dua kedip (salinan mata tertutup + dasar disembunyikan)');
  assert.ok(kedip.some((a) => (a.el as unknown as { nama: string }).nama === 'kedipM'));
  g.jeda();
  assert.equal(p.timer.size, 0, 'tab tersembunyi: tidak ada jadwal kedip');
  assert.ok(napas.every((a) => a.jeda === 1), 'napas dijeda');
  const sebelum = p.semua.length;
  p.maju(20_000);
  assert.equal(p.semua.length, sebelum, 'tidak ada gerak selama tersembunyi');
  g.lanjutkan();
  assert.equal(p.timer.size, 2);
  assert.ok(napas.every((a) => a.main === 1));
  g.henti();
  assert.equal(p.timer.size, 0);
  assert.ok(napas.every((a) => a.batal === 1));
});

test('mulut bicara: bergantian hanya selama bicara, tokoh yang bicara tidak berkedip, berhenti = mulut tertutup', () => {
  const p = palsu();
  const g = new GerakKecil(p.animator, p.jam, () => 0);
  const mentor = { kunci: 'mentor', napas: null, dasar: el('dasarM'), kedip: el('kedipM') };
  g.mulai([mentor]);
  g.bicara(mentor.dasar, el('bicaraM'));
  const mulut = p.semua.filter((a) => a.opsi.iterations === Infinity);
  assert.equal(mulut.length, 2);
  p.maju(3000);
  assert.equal(p.semua.filter((a) => a.opsi.duration === 120).length, 0, 'tidak berkedip saat bicara');
  g.bicara(null, null);
  assert.ok(mulut.every((a) => a.batal === 1), 'mulut kembali ke salinan dasar (tertutup)');
  p.maju(3000);
  assert.equal(p.semua.filter((a) => a.opsi.duration === 120).length, 2, 'kedip lagi sesudah diam');
});

test('pola mulut: salinan terbuka & tertutup tidak pernah terlihat bersamaan', () => {
  const pola = [100, 150, 90];
  const a = kfTerlihat(pola, true);
  const b = kfTerlihat(pola, false);
  for (let i = 0; i < a.length; i++) assert.notEqual(a[i]!.visibility, b[i]!.visibility);
  assert.equal(a[0]!.visibility, 'visible', 'mulai dari mulut tertutup');
});

// ------------------------------------------------------------------ penjadwal idle pemanas (panas.ts)

function idlePalsu() {
  const antre: { id: number; fn: (sisa: () => number) => void }[] = [];
  let n = 0;
  const jam: JamIdle = {
    minta: (fn) => { antre.push({ id: ++n, fn }); return n; },
    batal: (id) => { const i = antre.findIndex((x) => x.id === id); if (i >= 0) antre.splice(i, 1); },
  };
  /** Jalankan satu giliran idle dengan sisa waktu tetap (md). */
  const giliran = (sisa: number) => { const x = antre.shift(); x?.fn(() => sisa); return !!x; };
  return { jam, giliran, antre };
}

test('jalankanSaatIdle: satu langkah per giliran sempit, beberapa bila longgar, selesai = tanpa giliran lagi', () => {
  const { jam, giliran, antre } = idlePalsu();
  const dijalankan: number[] = [];
  function* langkah() { for (let i = 0; i < 5; i++) { dijalankan.push(i); yield; } }
  jalankanSaatIdle(langkah(), jam, 25);
  assert.equal(dijalankan.length, 0, 'tidak ada yang berjalan sebelum idle');
  giliran(0);
  assert.deepEqual(dijalankan, [0], 'idle sempit: tepat satu langkah');
  giliran(10);
  assert.deepEqual(dijalankan, [0, 1]);
  giliran(40); // longgar: terus sampai habis
  assert.deepEqual(dijalankan, [0, 1, 2, 3, 4]);
  giliran(40);
  assert.equal(antre.length, 0, 'selesai: tidak meminta giliran lagi');
});

test('jalankanSaatIdle: batal menghentikan langkah berikutnya; langkah yang melempar menghentikan tanpa galat', () => {
  const { jam, giliran, antre } = idlePalsu();
  const dijalankan: number[] = [];
  function* langkah() { for (let i = 0; i < 5; i++) { dijalankan.push(i); yield; } }
  const batal = jalankanSaatIdle(langkah(), jam, 25);
  giliran(0);
  batal();
  assert.equal(antre.length, 0, 'giliran yang menunggu dibatalkan');
  assert.equal(giliran(0), false);
  assert.deepEqual(dijalankan, [0]);
  const b = idlePalsu();
  function* rusak() { yield; throw new Error('generator seni gagal'); }
  jalankanSaatIdle(rusak(), b.jam, 25);
  b.giliran(0);
  assert.doesNotThrow(() => b.giliran(0));
  assert.equal(b.antre.length, 0, 'berhenti sesudah galat');
});

test('kedip: salinan kedip yang basi (data-basi, belum diperbarui untuk pose kini) tidak pernah dikedipkan', () => {
  const p = palsu();
  const g = new GerakKecil(p.animator, p.jam, () => 0);
  let basi = true;
  const kedip = { nama: 'kedipN', hasAttribute: (a: string) => a === 'data-basi' && basi } as unknown as Element;
  g.mulai([{ kunci: 'nasabah', napas: null, dasar: el('dasarN'), kedip }]);
  p.maju(6100);
  assert.equal(p.semua.filter((a) => a.opsi.duration === 120).length, 0, 'basi: tidak berkedip');
  assert.equal(p.timer.size, 1, 'jadwal kedip tetap berjalan');
  basi = false;
  p.maju(6100);
  assert.ok(p.semua.filter((a) => a.opsi.duration === 120).length >= 2, 'sesudah diperbarui: berkedip lagi');
});

// ------------------------------------------------------------------ putaran 4: kedip dibatalkan, rencana ditahan sampai bingkai mengalir

test('kedip yang sedang berjalan dibatalkan saat gambar berganti (batalKedip); jadwal kedip tetap', () => {
  const p = palsu();
  const g = new GerakKecil(p.animator, p.jam, () => 0);
  g.mulai([{ kunci: 'nasabah', napas: el('napasN'), dasar: el('dasarN'), kedip: el('kedipN') }]);
  p.maju(3000); // kedip pertama tepat dimulai (acak 0 -> 3000 md)
  const kedip = p.semua.filter((a) => a.opsi.duration === 120);
  assert.equal(kedip.length, 2, 'kedip berjalan: salinan mata tertutup tampil, dasar disembunyikan');
  assert.ok(kedip.every((a) => a.batal === 0));
  g.batalKedip();
  assert.ok(kedip.every((a) => a.batal === 1), 'kedip lama dibatalkan seketika (dasar kembali tampil, salinan kedip lama tersembunyi)');
  assert.ok(p.semua.filter((a) => a.opsi.iterations === Infinity).every((a) => a.batal === 0), 'napas tidak terganggu');
  assert.equal(p.timer.size, 1, 'jadwal kedip berikutnya tetap');
  g.batalKedip(); // tanpa kedip berjalan: aman
  assert.ok(kedip.every((a) => a.batal === 1));
});

/** Jam palsu + rAF palsu: `bingkai(t)` menjalankan callback bingkai yang menunggu dengan cap waktu t. */
function palsuBingkai() {
  const p = palsu();
  let kini = 0;
  const antre = new Map<number, (t: number) => void>();
  let id = 0;
  const jam: Jam = {
    ...p.jam,
    sekarang: () => kini,
    bingkai: (fn) => { antre.set(++id, fn); return id; },
    batalBingkai: (x) => { antre.delete(x as number); },
  };
  const bingkai = (t: number) => {
    kini = t;
    const fs = [...antre.values()];
    antre.clear();
    for (const f of fs) f(t);
  };
  return { ...p, jam, bingkai, antre };
}

test('rencana ditahan (tunggu): keadaan awal sampai dua bingkai berturut-turut < SELA_LANCAR, baru jam animasi & timer selesai berjalan', () => {
  const p = palsuBingkai();
  const s = new Sutradara(p.animator, p.jam);
  let selesai = 0;
  s.mainkan(RENCANA, cari, () => { selesai++; }, 0, { tunggu: true });
  assert.ok(s.tertahan);
  assert.ok(p.semua.every((a) => a.jeda === 1 && a.main === 0), 'animasi dibuat lalu dijeda di posisi awal (fill both)');
  assert.equal(p.timer.size, 0, 'timer selesai belum berjalan');
  assert.equal(s.waktu, 0, 'posisi awal selama ditahan');
  p.bingkai(16);
  p.bingkai(16 + 1100); // bingkai tertahan lama di GPU: belum lancar
  assert.ok(s.tertahan && p.semua.every((a) => a.main === 0));
  assert.equal(s.waktu, 0, 'jam animasi tidak berjalan selama bingkai tertahan');
  p.bingkai(16 + 1100 + 33); // mengalir
  assert.ok(!s.tertahan);
  assert.ok(p.semua.every((a) => a.main === 1), 'animasi dimainkan dari awal');
  assert.equal(p.timer.size, 1);
  p.maju(RENCANA.durasi + 40);
  assert.equal(selesai, 1, 'selesai sekali, dihitung dari saat mulai berjalan');
});

test('rencana ditahan: batas TUNGGU_MAKS; selesaikan/hentikan saat ditahan membatalkan permintaan bingkai', () => {
  const p = palsuBingkai();
  const s = new Sutradara(p.animator, p.jam);
  s.mainkan(RENCANA, cari, () => undefined, 0, { tunggu: true });
  for (let t = 0; t < TUNGGU_MAKS; t += 500) p.bingkai(t); // selalu lambat (500 md)
  assert.ok(s.tertahan);
  p.bingkai(TUNGGU_MAKS + 10);
  assert.ok(!s.tertahan, 'lewat batas: mulai walau belum lancar');
  // Selesaikan saat masih ditahan (Lanjut / Lewati pembuka): komposisi akhir, selesai sekali, tanpa bingkai menunggu.
  const q = palsuBingkai();
  const s2 = new Sutradara(q.animator, q.jam);
  let n = 0;
  s2.mainkan(RENCANA, cari, () => { n++; }, 0, { tunggu: true });
  assert.equal(q.antre.size, 1);
  assert.equal(s2.selesaikan(), true);
  assert.equal(n, 1);
  assert.equal(q.antre.size, 0, 'permintaan bingkai dibatalkan');
  assert.ok(q.semua.every((a) => a.batal === 1 && a.main === 0));
  q.bingkai(10); q.bingkai(20);
  assert.equal(q.timer.size, 0, 'tidak ada timer selesai dari rencana yang sudah diselesaikan');
  // Tanpa `tunggu` atau jam tanpa rAF: langsung berjalan seperti sebelumnya.
  const r = palsu();
  const s3 = new Sutradara(r.animator, r.jam);
  s3.mainkan(RENCANA, cari, () => undefined, 0, { tunggu: true });
  assert.ok(!s3.tertahan && r.semua.every((a) => a.jeda === 0) && r.timer.size === 1);
});
