import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EPISODE_AUTO_1 } from './episode/auto-1/episode';
import { KUNCI_PENSIUN } from './episode/auto-1/teks.id';
import { barisTerlihat, bisaLanjut, jalankan, stateAwal, umpanBalikKini } from './mesin';
import {
  akhirDitemukan, arsipProgres, aturUlangMemoriCerita, berlanggananCerita, catatAkhir, MAKS_ARSIP_PER_EPISODE,
  muatProgres, mulaiBaru, simpanProgres, versiPenyimpananCerita,
} from './simpan';
import { teksCerita } from './teks';
import type { Episode, StateCerita } from './tipe';
import { buatEpisodeUji } from './uji/episodeUji';
import { jawab, LANJUT, mainkanJalur } from './uji/jalurEpisode';

const KUNCI = 'raksa:cerita';

/** localStorage tiruan: bisa diblokir total (lempar) atau penuh (setItem melempar). */
class PenyimpananTiruan {
  data = new Map<string, string>();
  blokir = false;
  penuh = false;
  tulis = 0;
  getItem(k: string): string | null {
    if (this.blokir) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.blokir) throw new Error('SecurityError');
    if (this.penuh) throw new Error('QuotaExceededError');
    this.tulis += 1;
    this.data.set(k, String(v));
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}

let ls: PenyimpananTiruan;
function pasangPenyimpanan(p: PenyimpananTiruan | undefined): void {
  Object.defineProperty(globalThis, 'localStorage', { value: p, configurable: true, writable: true });
}

beforeEach(() => {
  ls = new PenyimpananTiruan();
  pasangPenyimpanan(ls);
  aturUlangMemoriCerita();
});

/** State yang sudah berjalan beberapa aksi. */
function berjalan(ep: Episode, n = 3): StateCerita {
  let s = stateAwal(ep);
  for (let i = 0; i < n; i++) s = jalankan(ep, s, { jenis: 'lanjut' });
  return jalankan(ep, s, { jenis: 'pilih', node: 'n1-pilih', pilihan: 'dengar' });
}

const akar = () => JSON.parse(ls.data.get(KUNCI)!) as {
  format: number; episode: Record<string, { versi: number; state: StateCerita; disimpan: number }>; akhir: Record<string, string[]>; arsip: { episode: string; versi: number | null; state: unknown }[];
};

test('belum ada simpanan -> baru; simpan lalu muat bolak-balik utuh', () => {
  const ep = buatEpisodeUji();
  assert.deepEqual(muatProgres(ep), { status: 'baru' });
  const s = berjalan(ep);
  assert.equal(simpanProgres(ep, s), true);
  assert.deepEqual(muatProgres(ep), { status: 'lanjut', state: s });
  const a = akar();
  assert.equal(a.format, 1);
  assert.equal(a.episode['uji-1']?.versi, 1);
  assert.equal(typeof a.episode['uji-1']?.disimpan, 'number');
  assert.deepEqual(a.akhir, {});
  assert.deepEqual(a.arsip, []);
  assert.equal(simpanProgres(ep, { ...s, episode: 'lain' }), false, 'state episode lain tidak disimpan');
});

test('muatProgres tidak pernah menulis', () => {
  const ep = buatEpisodeUji();
  simpanProgres(ep, berjalan(ep));
  const sebelum = ls.tulis;
  muatProgres(ep);
  muatProgres({ ...ep, versi: 2 });
  ls.data.set(KUNCI, '{rusak');
  muatProgres(ep);
  assert.equal(ls.tulis, sebelum);
});

test('JSON rusak / bentuk rusak -> tidakCocok rusak; data mentah tetap di tempat sampai Mulai ulang (dicadangkan)', () => {
  const ep = buatEpisodeUji();
  ls.data.set(KUNCI, '{rusak');
  assert.deepEqual(muatProgres(ep), { status: 'tidakCocok', alasan: 'rusak' });
  assert.equal(ls.data.get(KUNCI), '{rusak');
  assert.deepEqual(akhirDitemukan(ep.id), []);

  const s = mulaiBaru(ep);
  assert.deepEqual(s, stateAwal(ep));
  const cadangan = [...ls.data.entries()].filter(([k]) => k.startsWith('raksa:cerita:rusak:'));
  assert.equal(cadangan.length, 1);
  assert.equal(cadangan[0]![1], '{rusak', 'data mentah lama dicadangkan, bukan dihapus');
  assert.equal(akar().format, 1);
  assert.deepEqual(muatProgres(ep), { status: 'baru' });

  ls.data.set(KUNCI, JSON.stringify({ format: 2 }));
  assert.deepEqual(muatProgres(ep), { status: 'tidakCocok', alasan: 'rusak' });

  // Akar sah, tetapi entri episode ini rusak.
  ls.data.set(KUNCI, JSON.stringify({ format: 1, episode: { 'uji-1': { versi: 1, state: { node: 'n1-sapa' } } }, akhir: {}, arsip: [] }));
  assert.deepEqual(muatProgres(ep), { status: 'tidakCocok', alasan: 'rusak', versiTersimpan: 1 });
});

test('versi beda: tanpa migrasi -> tidakCocok versi; dengan migrasi -> lanjut (state dipetakan)', () => {
  const ep = buatEpisodeUji();
  const s = berjalan(ep);
  simpanProgres(ep, s);
  const mentah = ls.data.get(KUNCI);

  const v2 = { ...buatEpisodeUji(), versi: 2 };
  assert.deepEqual(muatProgres(v2), { status: 'tidakCocok', alasan: 'versi', versiTersimpan: 1 });
  assert.equal(ls.data.get(KUNCI), mentah, 'data lama tetap di tempat');

  const gagal: Episode = { ...v2, migrasi: { 1: () => null } };
  assert.deepEqual(muatProgres(gagal), { status: 'tidakCocok', alasan: 'versi', versiTersimpan: 1 });
  const lempar: Episode = { ...v2, migrasi: { 1: () => { throw new Error('x'); } } };
  assert.deepEqual(muatProgres(lempar), { status: 'tidakCocok', alasan: 'versi', versiTersimpan: 1 });

  const bisa: Episode = { ...v2, migrasi: { 1: (lama) => ({ ...lama, kepercayaan: lama.kepercayaan + 10 }) } };
  const h = muatProgres(bisa);
  assert.equal(h.status, 'lanjut');
  if (h.status !== 'lanjut') return;
  assert.equal(h.state.versi, 2);
  assert.equal(h.state.kepercayaan, s.kepercayaan + 10);
  assert.equal(h.state.node, s.node);
});

test('node tersimpan tidak ada lagi -> tidakCocok node-hilang; titik cadangan yang hilang dilewati', () => {
  const ep = buatEpisodeUji();
  const s = berjalan(ep);
  assert.equal(s.node, 'n2-cerita');
  simpanProgres(ep, s);

  const tanpaNode = buatEpisodeUji();
  delete tanpaNode.node['n2-cerita'];
  assert.deepEqual(muatProgres(tanpaNode), { status: 'tidakCocok', alasan: 'node-hilang', versiTersimpan: 1 });

  const tanpaAwal = buatEpisodeUji();
  delete tanpaAwal.node['n1-sapa'];
  const h = muatProgres(tanpaAwal);
  assert.equal(h.status, 'lanjut');
  if (h.status === 'lanjut') assert.deepEqual(Object.keys(h.state.cadangan), ['tengah']);
});

test('mulaiBaru mengarsipkan progres lama (tidak menghapus); maks 5 perjalanan biasa per episode; arsip episode lain utuh', () => {
  const ep = buatEpisodeUji();
  const s = berjalan(ep);
  simpanProgres(ep, s);
  const baru = mulaiBaru(ep);
  assert.deepEqual(baru, stateAwal(ep));
  assert.deepEqual(muatProgres(ep), { status: 'baru' });
  const arsip = arsipProgres(ep.id);
  assert.equal(arsip.length, 1);
  assert.deepEqual(arsip[0]!.state, s);
  assert.equal(arsip[0]!.versi, 1);
  assert.equal(arsip[0]!.sebab, 'perjalanan', 'perjalanan yang masih cocok masuk kuota yang dirotasi');

  // Arsip episode lain tidak tersentuh.
  const a = akar();
  a.arsip.unshift({ episode: 'lain', versi: 3, state: { apa: 1 } });
  ls.data.set(KUNCI, JSON.stringify(a));

  for (let i = 1; i <= 6; i++) {
    simpanProgres(ep, { ...s, langkah: s.langkah + i });
    mulaiBaru(ep);
  }
  const milik = arsipProgres(ep.id);
  assert.equal(milik.length, MAKS_ARSIP_PER_EPISODE);
  assert.deepEqual(milik.map((x) => (x.state as StateCerita).langkah), [2, 3, 4, 5, 6].map((i) => s.langkah + i), 'yang terlama dibuang lebih dulu');
  assert.equal(arsipProgres('lain').length, 1);

  // Progres yang belum berjalan (langkah 0) tidak memakan jatah arsip.
  simpanProgres(ep, stateAwal(ep));
  mulaiBaru(ep);
  assert.equal(arsipProgres(ep.id).length, MAKS_ARSIP_PER_EPISODE);
  assert.deepEqual(muatProgres(ep), { status: 'baru' });
});

test('progres yang tidak cocok diarsipkan, bukan ditimpa, oleh mulaiBaru maupun simpanProgres', () => {
  const ep = buatEpisodeUji();
  const lama = berjalan(ep);
  simpanProgres(ep, lama);
  const v2 = { ...buatEpisodeUji(), versi: 2 };
  assert.equal(muatProgres(v2).status, 'tidakCocok');
  const s2 = berjalan(v2, 1);
  simpanProgres(v2, s2);
  assert.deepEqual(muatProgres(v2), { status: 'lanjut', state: s2 });
  const arsip = arsipProgres(ep.id);
  assert.equal(arsip.length, 1);
  assert.equal(arsip[0]!.versi, 1);
  assert.deepEqual(arsip[0]!.state, lama);
  assert.equal(arsip[0]!.sebab, 'versi');

  // Simpanan yang cocok ditimpa biasa (tanpa arsip).
  simpanProgres(v2, jalankan(v2, s2, { jenis: 'lanjut' }));
  assert.equal(arsipProgres(ep.id).length, 1);
});

test('progres tidak cocok yang diarsipkan tidak pernah ikut dirotasi oleh perjalanan biasa (janji dialog pemulihan)', () => {
  const v1 = buatEpisodeUji();
  const lama = berjalan(v1);
  simpanProgres(v1, lama);
  const ep: Episode = { ...buatEpisodeUji(), versi: 2 };
  assert.deepEqual(muatProgres(ep), { status: 'tidakCocok', alasan: 'versi', versiTersimpan: 1 });

  // Arsip yang ditulis sebelum kuota dipisah (tanpa `sebab`) juga tidak boleh hilang.
  const a = akar();
  a.arsip.push({ episode: ep.id, versi: 0, state: { dulu: true } });
  ls.data.set(KUNCI, JSON.stringify(a));

  // Pemain memilih "Mulai ulang (progres lama diarsipkan)", lalu bermain & mengulang berkali-kali.
  mulaiBaru(ep);
  const s = berjalan(ep);
  const putaran = (dari: number, sampai: number) => {
    for (let i = dari; i <= sampai; i++) {
      simpanProgres(ep, { ...s, langkah: s.langkah + i });
      mulaiBaru(ep);
    }
  };
  putaran(1, 3);
  // Di tengah jalan, entri episode ini rusak lalu progres baru disimpan (simpanProgres mengarsipkan yang rusak).
  const rusak = { versi: 2, state: { node: 'n1-sapa' } };
  const b = akar() as unknown as { episode: Record<string, unknown> };
  b.episode[ep.id] = rusak;
  ls.data.set(KUNCI, JSON.stringify(b));
  assert.equal(muatProgres(ep).status, 'tidakCocok');
  simpanProgres(ep, s);
  mulaiBaru(ep);
  putaran(4, MAKS_ARSIP_PER_EPISODE * 2);

  const arsip = arsipProgres(ep.id);
  const tetap = arsip.filter((x) => x.sebab !== 'perjalanan');
  assert.deepEqual(tetap.map((x) => [x.versi, x.sebab ?? null]), [[0, null], [1, 'versi'], [2, 'rusak']], 'urut terlama dulu, tidak ada yang dibuang');
  assert.deepEqual(tetap[0]!.state, { dulu: true });
  assert.deepEqual(tetap[1]!.state, lama);
  assert.deepEqual(tetap[2]!.state, rusak.state);

  const perjalanan = arsip.filter((x) => x.sebab === 'perjalanan');
  assert.equal(perjalanan.length, MAKS_ARSIP_PER_EPISODE, 'hanya perjalanan biasa yang dibatasi');
  const n = MAKS_ARSIP_PER_EPISODE * 2;
  assert.deepEqual(
    perjalanan.map((x) => (x.state as StateCerita).langkah),
    Array.from({ length: MAKS_ARSIP_PER_EPISODE }, (_, i) => s.langkah + n - MAKS_ARSIP_PER_EPISODE + 1 + i),
    'perjalanan terlama yang dirotasi',
  );
});

test('akhir yang ditemukan: tanpa duplikat, bertahan setelah mulai ulang', () => {
  const ep = buatEpisodeUji();
  catatAkhir(ep.id, 'baik');
  catatAkhir(ep.id, 'baik');
  catatAkhir(ep.id, 'janji');
  assert.deepEqual(akhirDitemukan(ep.id), ['baik', 'janji']);
  simpanProgres(ep, berjalan(ep));
  mulaiBaru(ep);
  assert.deepEqual(akhirDitemukan(ep.id), ['baik', 'janji']);
  assert.deepEqual(akhirDitemukan('lain'), []);
  const sebelum = ls.tulis;
  catatAkhir(ep.id, 'baik');
  assert.equal(ls.tulis, sebelum, 'akhir yang sudah ada tidak ditulis ulang');
});

test('localStorage diblokir total -> cadangan memori tetap berlaku selama tab terbuka', () => {
  const ep = buatEpisodeUji();
  ls.blokir = true;
  assert.deepEqual(muatProgres(ep), { status: 'baru' });
  const s = berjalan(ep);
  assert.equal(simpanProgres(ep, s), false, 'false = hanya di memori');
  assert.deepEqual(muatProgres(ep), { status: 'lanjut', state: s });
  catatAkhir(ep.id, 'dingin');
  assert.deepEqual(akhirDitemukan(ep.id), ['dingin']);
  mulaiBaru(ep);
  assert.equal(arsipProgres(ep.id).length, 1);

  // Tanpa localStorage sama sekali (lingkungan tanpa Web Storage).
  pasangPenyimpanan(undefined);
  aturUlangMemoriCerita();
  simpanProgres(ep, s);
  assert.deepEqual(muatProgres(ep), { status: 'lanjut', state: s });
});

test('localStorage penuh: tulisan terbaru di memori yang dibaca, bukan data lama di disk', () => {
  const ep = buatEpisodeUji();
  const s1 = jalankan(ep, stateAwal(ep), { jenis: 'lanjut' });
  const s2 = jalankan(ep, s1, { jenis: 'lanjut' });
  const s3 = jalankan(ep, s2, { jenis: 'pilih', node: 'n1-pilih', pilihan: 'ketus' });
  assert.ok(s1 !== s2 && s2 !== s3);
  simpanProgres(ep, s1);
  ls.penuh = true;
  assert.equal(simpanProgres(ep, s2), false);
  assert.deepEqual(muatProgres(ep), { status: 'lanjut', state: s2 });
  ls.penuh = false;
  assert.equal(simpanProgres(ep, s3), true);
  assert.deepEqual(akar().episode['uji-1']?.state, s3, 'setelah ruang tersedia, disk kembali terbaru');
});

test('berlangganan: pendengar dipanggil setiap penyimpanan berubah; berhenti setelah lepas', () => {
  const ep = buatEpisodeUji();
  let dipanggil = 0;
  const lepas = berlanggananCerita(() => { dipanggil += 1; });
  const v0 = versiPenyimpananCerita();
  simpanProgres(ep, berjalan(ep));
  catatAkhir(ep.id, 'baik');
  mulaiBaru(ep);
  assert.equal(dipanggil, 3);
  assert.equal(versiPenyimpananCerita(), v0 + 3);
  lepas();
  simpanProgres(ep, berjalan(ep));
  assert.equal(dipanggil, 3);
});

// ------------------------------------------------------------------ naskah dipangkas tanpa menaikkan versi (v2, 11.3)

/** Tulis progres mentah (seperti yang disimpan build lama) lalu muat. */
function muatMentah(ep: Episode, state: unknown): ReturnType<typeof muatProgres> {
  ls.data.set(KUNCI, JSON.stringify({ format: 1, episode: { [ep.id]: { versi: ep.versi, state, disimpan: 0 } }, akhir: {}, arsip: [] }));
  return muatProgres(ep);
}

test('baris tersimpan melebihi baris terlihat node (naskah dipangkas) -> dijepit saat dimuat, cadangan juga; state lain utuh', () => {
  const ep = buatEpisodeUji();
  const s = berjalan(ep);
  const maks = barisTerlihat(ep, s).length;
  const bab = Object.keys(s.cadangan)[0]!;
  const lama = { ...s, baris: maks + 3, cadangan: { ...s.cadangan, [bab]: { ...s.cadangan[bab]!, baris: 99 } } };
  const r = muatMentah(ep, lama);
  assert.equal(r.status, 'lanjut');
  if (r.status !== 'lanjut') return;
  assert.equal(r.state.baris, maks);
  const c = r.state.cadangan[bab]!;
  assert.equal(c.baris, barisTerlihat(ep, { ...c, cadangan: {} }).length);
  assert.deepEqual({ ...r.state, baris: 0, cadangan: {} }, { ...lama, baris: 0, cadangan: {} }, 'hanya baris yang berubah');
  // Progres yang tidak melebihi tetap identik (tanpa salinan yang berbeda).
  assert.deepEqual(muatMentah(ep, s), { status: 'lanjut', state: s });
});

test('AUTO-1 v2: simpanan lama di node yang kini lebih pendek dimuat, baris dijepit, dan "lanjut" maju (tidak macet)', () => {
  const EP = EPISODE_AUTO_1;
  // [jalur menuju node, node, baris lama (jumlah baris node itu sebelum dipangkas), node sesudah 'lanjut']
  const kasus: [Parameters<typeof mainkanJalur>[1], string, number, string][] = [
    [[], 'b1-mentor', 4, 'b1-datang'],
    [['b1-datang/dengar'], 'b2-cerita', 3, 'b2-cerita-bagian'],
    [['b1-datang/prosedur', 'b1-pulih/tetap'], 'b2-singkat', 2, 'b2-saran'],
    [['b1-datang/dengar', 'b2-saran/dokumentasi'], 'b3-bukti-intro', 3, 'b3-bukti'],
  ];
  for (const [langkah, node, barisLama, berikut] of kasus) {
    const h = mainkanJalur(EP, langkah);
    const di = [h.awal, ...h.jejak].find((x) => x.node === node);
    assert.ok(di, `${node} tercapai`);
    // Build lama menampilkan lebih banyak baris di node ini (riwayat memuat kunci yang kini pensiun).
    const lama: StateCerita = {
      ...di,
      baris: barisLama,
      cadangan: Object.fromEntries(Object.entries(di.cadangan).map(([b, c]) => [b, { ...c, baris: 9 }])),
    };
    const r = muatMentah(EP, lama);
    assert.equal(r.status, 'lanjut', node);
    if (r.status !== 'lanjut') continue;
    const terlihat = barisTerlihat(EP, r.state).length;
    assert.ok(terlihat < barisLama, `${node}: node memang dipangkas (${terlihat} < ${barisLama})`);
    assert.equal(r.state.baris, terlihat, `${node}: baris dijepit`);
    for (const c of Object.values(r.state.cadangan)) assert.ok(c.baris <= barisTerlihat(EP, { ...c, cadangan: {} }).length, `${node}: cadangan dijepit`);
    assert.ok(bisaLanjut(EP, r.state), `${node}: lanjut tersedia`);
    const maju = jalankan(EP, r.state, LANJUT);
    assert.equal(maju.node, berikut, `${node}: lanjut -> ${berikut}`);
    // Tanpa penjepitan, build baru juga tidak macet, tetapi tampilan kehilangan kalimat yang ditampilkan.
    assert.ok(barisTerlihat(EP, r.state)[r.state.baris - 1], `${node}: ada kalimat untuk ditampilkan`);
  }
});

test('AUTO-1 v2: simpanan lama yang sempat memilih opsi pensiun ambang-tlo (umpan balik cabang 4) tetap dimuat & berlanjut', () => {
  const EP = EPISODE_AUTO_1;
  const siap = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] })]).state;
  assert.equal(siap.node, 'b4-polis');
  const baru = jalankan(EP, siap, { jenis: 'aktivitas', node: 'b4-polis', jawaban: { penjelasan: 'ambang-tlo' } });
  assert.deepEqual(baru.umpanBalik, { node: 'b4-polis', cabang: 3 });
  // State seperti yang ditulis build lama: opsi masih ada di misi, jadi tanda 'pilih' terpasang dan reaksinya 4.1.
  const sisip = (t: string[]) => t.flatMap((x) => (x === 'akt:polis:belum' ? [x, 'akt:polis:pilih:ambang-tlo'] : [x]));
  const lama: StateCerita = {
    ...baru,
    tanda: sisip(baru.tanda),
    aktivitas: { ...baru.aktivitas, polis: { ...baru.aktivitas.polis!, tanda: sisip(baru.aktivitas.polis!.tanda) } },
    riwayat: baru.riwayat.map((e) => (e.jenis === 'baris' && e.teks === 'b4-polis.hasil.4.2' ? { ...e, teks: 'b4-polis.hasil.4.1' } : e)),
  };
  const r = muatMentah(EP, lama);
  assert.equal(r.status, 'lanjut');
  if (r.status !== 'lanjut') return;
  assert.deepEqual(r.state, lama, 'dimuat apa adanya');
  const ub = umpanBalikKini(EP, r.state);
  assert.deepEqual(ub?.baris.map((b) => b.teks), ['b4-polis.hasil.4.1'], 'reaksi atas ambang 75% tetap tampil');
  assert.equal(ub?.alasan?.teks, 'b4-polis.hasil.4.alasan');
  for (const b of ['id', 'en', 'zh'] as const) {
    for (const k of ['akt.polis.opsi.ambang-tlo', 'b4-polis.hasil.4.1']) assert.notEqual(teksCerita(EP, k, b), k, `${k} (${b}) terbaca`);
  }
  const lanjut = jalankan(EP, r.state, LANJUT);
  assert.equal(lanjut.node, 'b4-polis-salah');
  const akhir = mainkanJalur(EP, ['b4-polis-salah/baca-ulang', 'b5-keberatan/jujur', 'b5-tutup/rangkum'], { dari: lanjut }).state;
  assert.equal(akhir.akhir, 'tuntas');
  assert.equal(akhir.proses['baca-polis'], 'dikoreksi');
});

test('AUTO-1 v2: kunci pensiun (baris & opsi yang dihapus) tetap terbaca di Riwayat lama, di id/en/zh', () => {
  assert.ok(KUNCI_PENSIUN.includes('akt.polis.opsi.ambang-tlo'));
  for (const k of KUNCI_PENSIUN) {
    for (const b of ['id', 'en', 'zh'] as const) {
      const t = teksCerita(EPISODE_AUTO_1, k, b, { nama: 'Weli' });
      assert.ok(t !== k && t.trim().length > 0 && !/\{\w+\}/.test(t), `${k} (${b}): "${t}"`);
    }
  }
});
