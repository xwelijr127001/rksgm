import test from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import {
  babBisaDiulang, babKini, barisTerlihat, bisaLanjut, jalankan, kondisiTerpenuhi, latarKini, nilaiAktivitas, nodeKini,
  pilihanTersedia, ringkasanAkhir, semuaBarisTampil, stateAwal, suasanaNasabah, umpanBalikKini,
} from './mesin';
import type { AksiCerita, Episode, StateCerita } from './tipe';
import { buatEpisodeUji, JAWABAN_FOTO } from './uji/episodeUji';

const LANJUT: AksiCerita = { jenis: 'lanjut' };

/** Aksi yang WAJIB sah (menghasilkan objek baru). */
function sah(ep: Episode, s: StateCerita, a: AksiCerita): StateCerita {
  const b = jalankan(ep, s, a);
  assert.notEqual(b, s, `aksi ${JSON.stringify(a)} seharusnya sah di node ${s.node}`);
  assert.equal(b.langkah, s.langkah + 1, 'setiap aksi sah menaikkan langkah');
  return b;
}

/** 'lanjut' sampai tidak ada yang berubah (pilihan/aktivitas menunggu, atau akhir selesai). */
function maju(ep: Episode, s: StateCerita): StateCerita {
  for (let i = 0; i < 100 && bisaLanjut(ep, s); i++) s = sah(ep, s, LANJUT);
  return s;
}

function pilih(ep: Episode, s: StateCerita, pilihan: string): StateCerita {
  s = maju(ep, s);
  return sah(ep, s, { jenis: 'pilih', node: s.node, pilihan });
}

function kirim(ep: Episode, s: StateCerita, jawaban: MissionAnswer): StateCerita {
  s = maju(ep, s);
  return sah(ep, s, { jenis: 'aktivitas', node: s.node, jawaban });
}

/** Mainkan dari awal: string = pilihan, objek = jawaban aktivitas; lalu maju sampai berhenti. */
function mainkan(ep: Episode, langkah: (string | MissionAnswer)[], s = stateAwal(ep)): StateCerita {
  for (const x of langkah) s = typeof x === 'string' ? pilih(ep, s, x) : kirim(ep, s, x);
  return maju(ep, s);
}

const salin = (x: MissionAnswer): MissionAnswer => JSON.parse(JSON.stringify(x)) as MissionAnswer;
const TEPAT = salin(JAWABAN_FOTO.tepat);
const BELUM = salin(JAWABAN_FOTO.belum);

test('stateAwal: baris pertama tampil, bab & cadangan bab pertama tercatat, tanpa acak', () => {
  const ep = buatEpisodeUji();
  const s = stateAwal(ep);
  assert.equal(s.node, 'n1-sapa');
  assert.equal(s.baris, 1);
  assert.equal(s.langkah, 0);
  assert.equal(s.akhir, null);
  assert.deepEqual(s.riwayat, [
    { jenis: 'bab', bab: 'awal' },
    { jenis: 'baris', node: 'n1-sapa', siapa: 'mentor', ekspresi: 'tersenyum', teks: 'n1-sapa.1' },
  ]);
  assert.deepEqual(Object.keys(s.cadangan), ['awal']);
  const c = s.cadangan.awal!;
  assert.equal(c.node, 'n1-sapa');
  assert.equal(c.baris, 0, 'cadangan = keadaan SEBELUM node tampil');
  assert.deepEqual(c.riwayat, []);
  assert.equal('cadangan' in c, false, 'cadangan tidak bersarang');
  assert.deepEqual(stateAwal(ep), s, 'stateAwal deterministik');
  assert.equal(s.kepercayaan, ep.kepercayaanAwal);
});

test('lanjut: baris tampil satu per satu; efek dialog diterapkan SEKALI saat pindah node', () => {
  const ep = buatEpisodeUji();
  let s = stateAwal(ep);
  s = sah(ep, s, LANJUT);
  assert.equal(s.node, 'n1-sapa');
  assert.equal(s.baris, 2);
  assert.deepEqual(s.riwayat.at(-1), { jenis: 'baris', node: 'n1-sapa', siapa: 'narasi', teks: 'n1-sapa.2' }, 'tanpa field ekspresi kosong');
  assert.deepEqual(s.catatan, [], 'efek belum diterapkan selama baris masih tampil');

  s = sah(ep, s, LANJUT);
  assert.equal(s.node, 'n1-pilih');
  assert.equal(s.baris, 1);
  assert.deepEqual(s.catatan, ['masalah']);
  assert.equal(s.riwayat.filter((e) => e.jenis === 'bab').length, 1, 'bab sama: tidak ada entri bab baru');

  // Pilihan menunggu: 'lanjut' tidak berbuat apa-apa, efek tidak terulang.
  assert.equal(jalankan(ep, s, LANJUT), s);
  s = pilih(ep, s, 'dengar');
  s = maju(ep, s);
  assert.equal(s.node, 'n2-foto');
  assert.deepEqual(s.catatan, ['masalah', 'detail']);
  assert.deepEqual(s.paham, ['langkah']);
  const akhir = mainkan(ep, [TEPAT, 'jujur'], s);
  assert.deepEqual(akhir.catatan, ['masalah', 'detail'], 'efek tidak pernah diterapkan dua kali');
  assert.deepEqual(akhir.paham, ['langkah', 'polis']);
});

test('pilih hanya sah di node itu, setelah semua baris tampil, dan bila pilihan tersedia; selain itu objek yang sama', () => {
  const ep = buatEpisodeUji();
  const awal = stateAwal(ep);
  assert.equal(jalankan(ep, awal, { jenis: 'pilih', node: 'n1-pilih', pilihan: 'dengar' }), awal, 'node lain');

  // Jalur ketus: n3-tutup punya 2 baris (baris ke-2 hanya bila 'ketus').
  let s = pilih(ep, stateAwal(ep), 'ketus');
  s = kirim(ep, s, TEPAT);
  s = sah(ep, s, LANJUT); // umpan balik -> n3-tutup, baris 1 dari 2
  assert.equal(s.node, 'n3-tutup');
  assert.equal(s.baris, 1);
  assert.equal(barisTerlihat(ep, s).length, 2);
  assert.equal(semuaBarisTampil(ep, s), false);
  assert.equal(jalankan(ep, s, { jenis: 'pilih', node: 'n3-tutup', pilihan: 'jujur' }), s, 'baris belum habis');
  s = sah(ep, s, LANJUT);
  assert.equal(semuaBarisTampil(ep, s), true);
  assert.deepEqual(pilihanTersedia(ep, s).map((p) => p.id), ['jujur', 'janji', 'maaf']);
  assert.equal(jalankan(ep, s, { jenis: 'pilih', node: 'n3-tutup', pilihan: 'tidak-ada' }), s, 'pilihan tidak dikenal');
  assert.equal(jalankan(ep, s, { jenis: 'pilih', node: 'n1-pilih', pilihan: 'jujur' }), s, 'node salah');

  // Jalur dengar: 'maaf' (jika ketus) tidak tersedia -> no-op.
  const d = maju(ep, mainkan(ep, ['dengar', TEPAT]));
  assert.equal(d.node, 'n3-tutup');
  assert.deepEqual(pilihanTersedia(ep, d).map((p) => p.id), ['jujur', 'janji']);
  assert.equal(jalankan(ep, d, { jenis: 'pilih', node: 'n3-tutup', pilihan: 'maaf' }), d);
});

test('pilih: efek, keputusan, riwayat pilihan + alasan, ucapan terakhir; ketukan ganda = no-op', () => {
  const ep = buatEpisodeUji();
  const s0 = maju(ep, stateAwal(ep));
  const aksi: AksiCerita = { jenis: 'pilih', node: 'n1-pilih', pilihan: 'dengar' };
  const s1 = sah(ep, s0, aksi);
  assert.equal(s1.kepercayaan, 2);
  assert.deepEqual(s1.tanda, ['dengar']);
  assert.deepEqual(s1.keputusan, [{ node: 'n1-pilih', pilihan: 'dengar', langkah: s1.langkah }]);
  assert.deepEqual(s1.terakhir, { teks: 'n1-pilih.dengar', alasan: 'alasan.dengar', arah: 'naik' });
  assert.deepEqual(s1.riwayat.slice(s0.riwayat.length), [
    { jenis: 'pilihan', node: 'n1-pilih', pilihan: 'dengar', teks: 'n1-pilih.dengar' },
    { jenis: 'alasan', node: 'n1-pilih', teks: 'alasan.dengar', arah: 'naik' },
    { jenis: 'bab', bab: 'tengah' },
    { jenis: 'baris', node: 'n2-cerita', siapa: 'nasabah', teks: 'n2-cerita.1' },
  ]);
  assert.equal(jalankan(ep, s1, aksi), s1, 'ketukan kedua pada pilihan yang sama tidak menerapkan efek lagi');
  assert.deepEqual(Object.keys(s1.cadangan), ['awal', 'tengah']);

  const k = sah(ep, s0, { jenis: 'pilih', node: 'n1-pilih', pilihan: 'ketus' });
  assert.deepEqual(k.terakhir, { teks: 'n1-pilih.ketus', alasan: 'alasan.ketus', arah: 'turun' });
  assert.equal(k.kepercayaan, -1);

  // Ucapan terakhir hilang saat pindah node lewat 'lanjut' (bukan lagi reaksi atas pilihan itu).
  const pindah = maju(ep, s1);
  assert.equal(pindah.node, 'n2-foto');
  assert.equal(pindah.terakhir, null);
});

test('baris bersyarat hanya tampil bila kondisinya terpenuhi', () => {
  const ep = buatEpisodeUji();
  const dengar = pilih(ep, stateAwal(ep), 'dengar');
  const ketus = pilih(ep, stateAwal(ep), 'ketus');
  assert.deepEqual(barisTerlihat(ep, dengar).map((b) => b.teks), ['n2-cerita.1', 'n2-cerita.2', 'n2-cerita.3']);
  assert.deepEqual(barisTerlihat(ep, ketus).map((b) => b.teks), ['n2-cerita.1', 'n2-cerita.3']);
  const teksRiwayat = (s: StateCerita) => s.riwayat.flatMap((e) => (e.jenis === 'baris' && e.node === 'n2-cerita' ? [e.teks] : []));
  assert.deepEqual(teksRiwayat(maju(ep, ketus)), ['n2-cerita.1', 'n2-cerita.3']);
  assert.deepEqual(teksRiwayat(maju(ep, dengar)), ['n2-cerita.1', 'n2-cerita.2', 'n2-cerita.3']);
});

test('aktivitas: dinilai sekali, tanda hasil dipasang, cabang hasil pertama yang cocok, umpan balik lalu lanjut', () => {
  const ep = buatEpisodeUji();
  const siap = maju(ep, pilih(ep, stateAwal(ep), 'dengar'));
  assert.equal(nodeKini(ep, siap)?.jenis, 'aktivitas');
  assert.equal(jalankan(ep, siap, { jenis: 'aktivitas', node: 'n1-pilih', jawaban: TEPAT }), siap, 'node salah');

  const s = sah(ep, siap, { jenis: 'aktivitas', node: 'n2-foto', jawaban: TEPAT });
  assert.equal(s.node, 'n2-foto', 'umpan balik tampil di node aktivitas');
  assert.deepEqual(s.umpanBalik, { node: 'n2-foto', cabang: 0 });
  assert.equal(s.aktivitas.foto?.akurasi, 1);
  assert.deepEqual(s.aktivitas.foto?.tanda, ['akt:foto:tepat', 'akt:foto:pilih:full', 'akt:foto:pilih:plat', 'akt:foto:pilih:nilai']);
  for (const t of s.aktivitas.foto!.tanda) assert.ok(s.tanda.includes(t));
  assert.equal(s.kepercayaan, 3);
  assert.deepEqual(s.proses, { foto: 'tepat' });
  assert.deepEqual(s.riwayat.slice(siap.riwayat.length), [
    { jenis: 'aktivitas', node: 'n2-foto', aktivitas: 'foto', akurasi: 1 },
    { jenis: 'baris', node: 'n2-foto', siapa: 'nasabah', ekspresi: 'senang', teks: 'n2-foto.tepat' },
    { jenis: 'alasan', node: 'n2-foto', teks: 'alasan.foto-tepat', arah: 'naik' },
  ]);
  const ub = umpanBalikKini(ep, s);
  assert.deepEqual(ub?.baris.map((b) => b.teks), ['n2-foto.tepat']);
  assert.deepEqual(ub?.alasan, { teks: 'alasan.foto-tepat', arah: 'naik' });

  // Kirim dua kali (jawaban apa pun) = no-op.
  assert.equal(jalankan(ep, s, { jenis: 'aktivitas', node: 'n2-foto', jawaban: BELUM }), s);
  assert.equal(jalankan(ep, s, { jenis: 'aktivitas', node: 'n2-foto', jawaban: TEPAT }), s);

  const lanjut = sah(ep, s, LANJUT);
  assert.equal(lanjut.node, 'n3-tutup');
  assert.equal(lanjut.umpanBalik, null);
  assert.equal(umpanBalikKini(ep, lanjut), null);
  assert.equal(lanjut.kepercayaan, 3, 'efek hasil tidak diterapkan ulang saat lanjut');
  assert.equal(jalankan(ep, lanjut, { jenis: 'aktivitas', node: 'n2-foto', jawaban: TEPAT }), lanjut, 'aktivitas lama tidak bisa dikirim lagi');
});

test('aktivitas: cabang sebagian & lainnya; baris umpan balik bersyarat memakai tanda lewat', () => {
  const ep = buatEpisodeUji();
  const siap = maju(ep, pilih(ep, stateAwal(ep), 'dengar'));
  const kirimDi = (j: MissionAnswer) => sah(ep, siap, { jenis: 'aktivitas', node: 'n2-foto', jawaban: salin(j) });

  const lewat = kirimDi(JAWABAN_FOTO.lewatPlat);
  assert.equal(lewat.aktivitas.foto?.akurasi, 0.5);
  assert.deepEqual(lewat.umpanBalik, { node: 'n2-foto', cabang: 1 });
  assert.deepEqual(lewat.aktivitas.foto?.tanda, ['akt:foto:sebagian', 'akt:foto:pilih:full', 'akt:foto:pilih:kucing', 'akt:foto:lewat:plat', 'akt:foto:pilih:nilai']);
  assert.deepEqual(umpanBalikKini(ep, lewat)?.baris.map((b) => b.teks), ['n2-foto.sebagian', 'n2-foto.plat']);
  assert.deepEqual(lewat.proses, { foto: 'dikoreksi' });
  assert.equal(lewat.kepercayaan, 2, 'cabang tanpa kepercayaan: suasana tetap');

  const sebagian = kirimDi(JAWABAN_FOTO.sebagian);
  assert.deepEqual(sebagian.umpanBalik, { node: 'n2-foto', cabang: 1 });
  assert.deepEqual(umpanBalikKini(ep, sebagian)?.baris.map((b) => b.teks), ['n2-foto.sebagian'], 'plat difoto: baris plat tidak tampil');

  const belum = kirimDi(JAWABAN_FOTO.belum);
  assert.deepEqual(belum.umpanBalik, { node: 'n2-foto', cabang: 2 });
  assert.ok(belum.tanda.includes('foto-kurang'));
  assert.ok(belum.tanda.includes('akt:foto:belum'));
  assert.deepEqual(belum.proses, { foto: 'keliru' });
});

test('aktivitas tidak sah sebelum baris pengantar habis', () => {
  const ep = buatEpisodeUji();
  const n = ep.node['n2-foto']!;
  if (n.jenis !== 'aktivitas') throw new Error('fixture');
  n.baris = [...n.baris, { siapa: 'nasabah', teks: 'n2-cerita.1' }];
  let s = pilih(ep, stateAwal(ep), 'dengar');
  while (s.node !== 'n2-foto') s = sah(ep, s, LANJUT);
  assert.equal(s.baris, 1);
  assert.equal(jalankan(ep, s, { jenis: 'aktivitas', node: 'n2-foto', jawaban: TEPAT }), s);
  s = sah(ep, s, LANJUT);
  assert.notEqual(jalankan(ep, s, { jenis: 'aktivitas', node: 'n2-foto', jawaban: TEPAT }), s);
});

test('nilaiAktivitas: akurasi rubrik klien & tanda deterministik (urutan opsi misi, bukan urutan ketukan)', () => {
  const ep = buatEpisodeUji();
  const def = ep.aktivitas.foto!;
  const a = nilaiAktivitas(ep, def, { bukti: ['plat', 'full'], jelas: 'nilai' });
  const b = nilaiAktivitas(ep, def, { bukti: ['full', 'plat'], jelas: 'nilai' });
  assert.deepEqual(a.tanda, b.tanda);
  assert.equal(a.akurasi, 1);
  const belum = nilaiAktivitas(ep, def, { bukti: ['selfie', 'kucing', 'tidak-ada'], jelas: 'tolak' });
  assert.equal(belum.akurasi, 0);
  assert.deepEqual(belum.tanda, [
    'akt:foto:belum',
    'akt:foto:pilih:kucing', 'akt:foto:pilih:selfie', 'akt:foto:lewat:full', 'akt:foto:lewat:plat',
    'akt:foto:pilih:tolak', 'akt:foto:lewat:nilai',
  ]);
  const kosong = nilaiAktivitas(ep, def, {});
  assert.equal(kosong.akurasi, 0);
  assert.deepEqual(kosong.tanda, ['akt:foto:belum', 'akt:foto:lewat:full', 'akt:foto:lewat:plat', 'akt:foto:lewat:nilai']);
  assert.equal(nilaiAktivitas(ep, def, null).akurasi, 0);
});

test('node cabang dilewati otomatis; setiap akhir tercapai sesuai jalurnya', () => {
  const ep = buatEpisodeUji();
  const kasus: [string, (string | MissionAnswer)[], string][] = [
    ['terbaik', ['dengar', TEPAT, 'jujur'], 'baik'],
    ['sebagian tetap baik', ['dengar', salin(JAWABAN_FOTO.sebagian), 'jujur'], 'baik'],
    ['pemulihan: ketus lalu maaf', ['ketus', TEPAT, 'maaf', 'jujur'], 'baik'],
    ['janji', ['dengar', TEPAT, 'janji'], 'janji'],
    ['bukti kurang', ['dengar', BELUM, 'jujur'], 'tertunda'],
    ['dingin', ['ketus', TEPAT, 'jujur'], 'dingin'],
    ['pergi', ['usir'], 'pergi'],
  ];
  for (const [nama, langkah, akhir] of kasus) {
    const s = mainkan(ep, langkah);
    assert.equal(s.akhir, akhir, nama);
    assert.equal(nodeKini(ep, s)?.jenis, 'akhir', `${nama}: tidak pernah berhenti di node cabang`);
    assert.equal(s.node, `akhir-${akhir}`);
    assert.equal(semuaBarisTampil(ep, s), true);
    assert.equal(jalankan(ep, s, LANJUT), s, `${nama}: akhir selesai, lanjut = no-op`);
  }
  // Pilihan yang kembali ke node yang sama: tidak ada entri bab baru, baris diulang dari awal.
  let s = maju(ep, mainkan(ep, ['ketus', TEPAT]));
  s = pilih(ep, s, 'maaf');
  assert.equal(s.node, 'n3-tutup');
  assert.equal(s.baris, 1);
  assert.deepEqual(barisTerlihat(ep, s).map((b) => b.teks), ['n3-tutup.1'], "tanda 'ketus' dicabut");
  assert.equal(s.riwayat.filter((e) => e.jenis === 'bab' && e.bab === 'tutup').length, 1);
});

test('ulangBab memulihkan cadangan bab itu, membuang cadangan sesudahnya; pilihan lain bisa dicoba', () => {
  const ep = buatEpisodeUji();
  const setelahDengar = pilih(ep, maju(ep, stateAwal(ep)), 'dengar');
  const akhir = mainkan(ep, [TEPAT, 'jujur'], setelahDengar);
  assert.equal(akhir.akhir, 'baik');
  assert.deepEqual(Object.keys(akhir.cadangan).sort(), ['awal', 'tengah', 'tutup']);

  const u = sah(ep, akhir, { jenis: 'ulangBab', bab: 'tengah' });
  assert.equal(u.node, 'n2-cerita');
  assert.equal(u.akhir, null);
  assert.deepEqual(Object.keys(u.cadangan).sort(), ['awal', 'tengah']);
  assert.deepEqual({ ...u, langkah: 0 }, { ...setelahDengar, langkah: 0 }, 'sama persis dengan saat pertama masuk bab (kecuali penghitung langkah)');
  assert.ok(u.langkah > akhir.langkah, 'langkah terus naik');

  // Aktivitas bab itu bisa dinilai lagi; jalur baru menuju akhir lain.
  const lain = mainkan(ep, [BELUM, 'jujur'], u);
  assert.equal(lain.akhir, 'tertunda');
  assert.deepEqual(lain.keputusan.map((k) => k.pilihan), ['dengar', 'jujur']);

  assert.equal(jalankan(ep, u, { jenis: 'ulangBab', bab: 'tutup' }), u, 'cadangan sesudahnya sudah dibuang');
  assert.equal(jalankan(ep, akhir, { jenis: 'ulangBab', bab: 'tidak-ada' }), akhir);

  const dariAwal = sah(ep, akhir, { jenis: 'ulangBab', bab: 'awal' });
  assert.deepEqual({ ...dariAwal, langkah: 0 }, stateAwal(ep));
});

test('babBisaDiulang: urut cerita; bab yang langsung jatuh ke node akhir tidak ditawarkan', () => {
  const ep = buatEpisodeUji();
  assert.deepEqual(babBisaDiulang(ep, mainkan(ep, ['dengar', TEPAT, 'jujur'])), ['awal', 'tengah', 'tutup']);
  const pergi = mainkan(ep, ['usir']);
  assert.deepEqual(Object.keys(pergi.cadangan).sort(), ['awal', 'tutup']);
  assert.deepEqual(babBisaDiulang(ep, pergi), ['awal']);
});

test('mulaiUlang = state awal (langkah tetap naik)', () => {
  const ep = buatEpisodeUji();
  const akhir = mainkan(ep, ['dengar', TEPAT, 'janji']);
  const baru = sah(ep, akhir, { jenis: 'mulaiUlang' });
  assert.deepEqual({ ...baru, langkah: 0 }, stateAwal(ep));
});

test('aksi untuk episode lain / aksi tak dikenal = objek yang sama', () => {
  const ep = buatEpisodeUji();
  const s = { ...stateAwal(ep), episode: 'lain' };
  assert.equal(jalankan(ep, s, LANJUT), s);
  const t = stateAwal(ep);
  assert.equal(jalankan(ep, t, { jenis: 'terbang' } as unknown as AksiCerita), t);
});

test('jalankan MURNI: state masukan (dibekukan) tidak berubah', () => {
  const ep = buatEpisodeUji();
  const beku = <T>(x: T): T => {
    if (x && typeof x === 'object') {
      Object.values(x).forEach(beku);
      Object.freeze(x);
    }
    return x;
  };
  let s = stateAwal(ep);
  const langkah: (string | MissionAnswer)[] = ['dengar', TEPAT, 'jujur'];
  for (const x of langkah) {
    s = maju(ep, beku(s));
    const sebelum = JSON.stringify(s);
    const b = typeof x === 'string'
      ? jalankan(ep, beku(s), { jenis: 'pilih', node: s.node, pilihan: x })
      : jalankan(ep, beku(s), { jenis: 'aktivitas', node: s.node, jawaban: x });
    assert.equal(JSON.stringify(s), sebelum);
    s = b;
  }
  s = maju(ep, beku(s));
  const u = jalankan(ep, beku(s), { jenis: 'ulangBab', bab: 'tengah' });
  assert.notEqual(u, s);
});

test('state & riwayat hanya berisi KUNCI teks, tidak pernah teks (ganti bahasa tidak mengubah state)', () => {
  const ep = buatEpisodeUji();
  const semuaTeks = new Set(Object.values(ep.teks).flatMap((t) => Object.values(t)));
  const kunciAda = new Set(Object.keys(ep.teks.id));
  const jalur: (string | MissionAnswer)[][] = [['dengar', TEPAT, 'jujur'], ['ketus', BELUM, 'maaf', 'janji'], ['usir']];
  for (const langkah of jalur) {
    const s = mainkan(ep, langkah);
    const periksa = (v: unknown): void => {
      if (typeof v === 'string') assert.ok(!semuaTeks.has(v), `teks tampil masuk ke state: "${v}"`);
      else if (v && typeof v === 'object') Object.values(v).forEach(periksa);
    };
    periksa(JSON.parse(JSON.stringify(s)));
    for (const e of s.riwayat) if ('teks' in e) assert.ok(kunciAda.has(e.teks), `kunci riwayat ${e.teks}`);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, 'state bolak-balik JSON tanpa kehilangan');
  }
});

test('ringkasanAkhir memisahkan komunikasi (alasan suasana) dari ketepatan langkah klaim (proses)', () => {
  const ep = buatEpisodeUji();
  const baik = ringkasanAkhir(ep, mainkan(ep, ['dengar', TEPAT, 'jujur']));
  assert.equal(baik.akhir, 'baik');
  assert.equal(baik.suasana.label, 'suasana.tenang');
  assert.deepEqual(baik.komunikasi, [
    { teks: 'alasan.dengar', arah: 'naik' },
    { teks: 'alasan.foto-tepat', arah: 'naik' },
    { teks: 'alasan.jujur', arah: 'naik' },
  ]);
  assert.deepEqual(baik.proses, [
    { id: 'foto', label: 'proses.foto', nilai: 'tepat' },
    { id: 'tanpa-janji', label: 'proses.tanpa-janji', nilai: 'tepat' },
  ]);
  assert.deepEqual(baik.paham, [
    { id: 'langkah', label: 'paham.langkah', sudah: true },
    { id: 'polis', label: 'paham.polis', sudah: true },
  ]);
  assert.deepEqual(baik.keputusan.map((k) => `${k.node}:${k.pilihan}`), ['n1-pilih:dengar', 'n3-tutup:jujur']);

  // Nasabah senang != langkah benar: komunikasi naik, proses keliru.
  const janji = ringkasanAkhir(ep, mainkan(ep, ['dengar', TEPAT, 'janji']));
  assert.equal(janji.akhir, 'janji');
  assert.ok(janji.komunikasi.every((k) => k.arah === 'naik'));
  assert.equal(janji.proses.find((p) => p.id === 'tanpa-janji')?.nilai, 'keliru');
  assert.equal(janji.paham.find((p) => p.id === 'polis')?.sudah, false);

  const pergi = ringkasanAkhir(ep, mainkan(ep, ['usir']));
  assert.deepEqual(pergi.komunikasi, [{ teks: 'alasan.usir', arah: 'turun' }]);
  assert.deepEqual(pergi.proses.map((p) => p.nilai), [null, null], 'butir yang tidak tersentuh = null');
  assert.equal(pergi.suasana.label, 'suasana.kesal');

  assert.equal(ringkasanAkhir(ep, stateAwal(ep)).akhir, '', 'belum selesai');
});

test('suasanaNasabah: batas bawah menurun (daftar tidak urut pun benar)', () => {
  const ep = buatEpisodeUji();
  const label = (k: number) => suasanaNasabah(ep, { kepercayaan: k }).label;
  assert.deepEqual([5, 3, 2, 1, 0, -1, -2, -100].map(label), [
    'suasana.tenang', 'suasana.tenang', 'suasana.mulai-tenang', 'suasana.mulai-tenang',
    'suasana.cemas', 'suasana.cemas', 'suasana.kesal', 'suasana.kesal',
  ]);
  ep.suasana = [...ep.suasana].reverse();
  assert.equal(label(3), 'suasana.tenang');
  assert.equal(suasanaNasabah(ep, { kepercayaan: 0 }).ekspresi, 'cemas');
});

test('kondisiTerpenuhi: tanda, tidak, semua, salahSatu, kepercayaan, paham, proses', () => {
  const s = { tanda: ['a'], kepercayaan: 2, paham: ['p'], proses: { foto: 'dikoreksi' as const } };
  assert.equal(kondisiTerpenuhi({ tanda: 'a' }, s), true);
  assert.equal(kondisiTerpenuhi({ tidak: { tanda: 'a' } }, s), false);
  assert.equal(kondisiTerpenuhi({ semua: [{ tanda: 'a' }, { paham: 'p' }] }, s), true);
  assert.equal(kondisiTerpenuhi({ semua: [{ tanda: 'a' }, { paham: 'x' }] }, s), false);
  assert.equal(kondisiTerpenuhi({ salahSatu: [{ tanda: 'x' }, { paham: 'p' }] }, s), true);
  assert.equal(kondisiTerpenuhi({ salahSatu: [] }, s), false);
  assert.equal(kondisiTerpenuhi({ kepercayaan: { min: 2 } }, s), true);
  assert.equal(kondisiTerpenuhi({ kepercayaan: { min: 3 } }, s), false);
  assert.equal(kondisiTerpenuhi({ kepercayaan: { maks: 1 } }, s), false);
  assert.equal(kondisiTerpenuhi({ kepercayaan: { min: 0, maks: 2 } }, s), true);
  assert.equal(kondisiTerpenuhi({ proses: 'foto', nilai: ['tepat', 'dikoreksi'] }, s), true);
  assert.equal(kondisiTerpenuhi({ proses: 'foto', nilai: 'tepat' }, s), false);
  assert.equal(kondisiTerpenuhi({ proses: 'bukti', nilai: 'tepat' }, s), false, 'proses belum tersentuh');
  assert.equal(kondisiTerpenuhi({ aneh: 1 } as never, s), false);
});

test('bantuan tampilan: babKini, latarKini (mewarisi latar node sebelumnya), bisaLanjut', () => {
  const ep = buatEpisodeUji();
  let s = stateAwal(ep);
  assert.deepEqual(babKini(ep, s), { bab: ep.bab[0], nomor: 1, jumlah: 3 });
  assert.equal(latarKini(ep, s), 'kantor');
  assert.equal(bisaLanjut(ep, s), true);
  s = maju(ep, s);
  assert.equal(s.node, 'n1-pilih');
  assert.equal(latarKini(ep, s), 'kantor', 'node tanpa latar memakai latar sebelumnya');
  assert.equal(bisaLanjut(ep, s), false);
  s = maju(ep, pilih(ep, s, 'dengar'));
  assert.equal(s.node, 'n2-foto');
  assert.equal(latarKini(ep, s), 'parkiran');
  assert.equal(babKini(ep, s)?.nomor, 2);
  const u = jalankan(ep, mainkan(ep, [TEPAT, 'jujur'], s), { jenis: 'ulangBab', bab: 'tengah' });
  assert.equal(latarKini(ep, u), 'parkiran');
});
