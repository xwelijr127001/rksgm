/**
 * Tes MEJA KASUS (prototipe K11, D-68): satu sumber state (draf meja), tindakan lewat tempat di meja, pemeriksaan tidak
 * mengubah kelengkapan / jawaban, draf kompatibel dengan pola bundel lama, sembilan kombinasi tempat x kabar = alternatif &
 * akibat yang sama dengan sebelumnya, konfirmasi tercatat sekali, dan lompat ke K11 lewat jalur sah.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDraft } from '../../../game/draft';
import { KOMBINASI_BUNDEL, EPISODE_AUTO_2 as EP } from '../../episode/auto-2/episode';
import { jalankan, semuaBarisTampil } from '../../mesin';
import type { NodeAktivitas, StateCerita, TempatMeja } from '../../tipe';
import { validasiEpisode } from '../../validasi';
import type { ArenaBundel } from '../arena/logika';
import { stateDiTitik } from './lompat';
import {
  akibatMeja, bacaMeja, drafSimpan, jalankanMeja, jawabanKonfirmasi, kurangKonfirmasi, petunjukMeja, statusBerkas, tempatKini,
  tindakanDiTempat, type MejaDraf,
} from './logika';

const K = EP.aktivitas.bundel!.arena as ArenaBundel;
const MISI = EP.aktivitas.bundel!.misi('id');
const kosong = (): MejaDraf => bacaMeja(K, null, {});
const ADA = [true, true, true, true, true, true, false];

/** State di K11 dengan semua baris pengantar tampil (tugas siap dikerjakan). */
function siapK11(): StateCerita {
  let s = stateDiTitik(EP, 'k11');
  assert.ok(s, 'jalur saran sampai ke k11');
  while (!semuaBarisTampil(EP, s!)) s = jalankan(EP, s!, { jenis: 'lanjut' });
  return s!;
}

test('konfig meja K11 sah: validator episode tanpa galat; tiap tindakan punya tempat sendiri', () => {
  assert.deepEqual(validasiEpisode(EP), []);
  const tempat = (['papan', 'komite', 'kontak'] as TempatMeja[]).map((tp) => tindakanDiTempat(K, tp));
  assert.deepEqual(tempat, ['lengkapi', 'sekarang', 'hendra']);
  assert.equal(K.meja!.berkas.length, MISI.tables!.find((x) => x.id === 'isi-bundel')!.rows.length);
});

test('periksa: membuka berkas mencatat jejak saja; kelengkapan tetap dari fakta skenario, jawaban tidak berubah', () => {
  let m = kosong();
  assert.equal(petunjukMeja(K, m), 'periksa');
  m = jalankanMeja(K, m, { jenis: 'buka-map' });
  assert.equal(m.fokus, 'map');
  assert.equal(m.mapDibuka, true);
  assert.equal(petunjukMeja(K, m), 'tindakan', 'map dibuka -> langkah berikutnya tindakan, tanpa wajib membuka semua berkas');
  const sebelum = statusBerkas(K, m, ADA);
  assert.deepEqual(sebelum.map((x) => x.status), ['belum-diperiksa', 'belum-diperiksa', 'belum-diperiksa', 'belum-diperiksa', 'belum-diperiksa', 'belum-diperiksa', 'belum-tersedia']);
  m = jalankanMeja(K, m, { jenis: 'periksa', berkas: 'laporan' });
  m = jalankanMeja(K, m, { jenis: 'periksa', berkas: 'suratpolisi' });
  const sesudah = statusBerkas(K, m, ADA);
  assert.equal(sesudah.find((x) => x.id === 'laporan')!.status, 'diperiksa');
  assert.equal(sesudah.find((x) => x.id === 'suratpolisi')!.status, 'belum-tersedia', 'dibuka pun tetap belum tersedia');
  assert.deepEqual(m.jawaban, {});
  assert.equal(jalankanMeja(K, m, { jenis: 'periksa', berkas: 'laporan' }), m, 'periksa ulang = no-op');
  assert.equal(jalankanMeja(K, m, { jenis: 'periksa', berkas: 'tidak-ada' }), m);
});

test('tindakan lewat tempat: menaruh map = rencana (draf) yang bisa dipindah; kabar terpisah; konfirmasi butuh keduanya', () => {
  let m = jalankanMeja(K, kosong(), { jenis: 'buka-map' });
  assert.equal(kurangKonfirmasi(K, m), 'tindakan');
  m = jalankanMeja(K, m, { jenis: 'taruh', tempat: 'komite' });
  assert.equal(m.fokus, 'meja');
  assert.equal(tempatKini(K, m), 'komite');
  assert.deepEqual(m.jawaban, { bundel: 'sekarang' });
  m = jalankanMeja(K, m, { jenis: 'taruh', tempat: 'papan' });
  assert.deepEqual(m.jawaban, { bundel: 'lengkapi' }, 'dipindah = rencana diganti, bukan ditambah');
  assert.equal(kurangKonfirmasi(K, m), 'kabar');
  assert.equal(petunjukMeja(K, m), 'kabar');
  m = jalankanMeja(K, m, { jenis: 'kabar', kabar: 'nanti' });
  assert.equal(kurangKonfirmasi(K, m), null);
  assert.equal(petunjukMeja(K, m), 'konfirmasi');
  assert.deepEqual(jawabanKonfirmasi(K, m), { bundel: 'lengkapi', kabar: 'nanti' });
  assert.equal(jalankanMeja(K, m, { jenis: 'kabar', kabar: 'bohong' }), m, 'kabar tak dikenal ditolak');
});

test('draf: satu objek tersimpan; muat ulang = draf sama; pola bundel lama membaca jawaban yang sama (jejak meja diabaikan)', () => {
  let m = jalankanMeja(K, kosong(), { jenis: 'buka-map' });
  m = jalankanMeja(K, m, { jenis: 'periksa', berkas: 'foto' });
  m = jalankanMeja(K, m, { jenis: 'taruh', tempat: 'kontak' });
  m = jalankanMeja(K, m, { jenis: 'kabar', kabar: 'persetujuan' });
  const simpan = JSON.parse(JSON.stringify(drafSimpan(m)));
  const lagi = bacaMeja(K, simpan, sanitizeDraft(MISI, simpan));
  assert.deepEqual(lagi, m);
  assert.deepEqual(sanitizeDraft(MISI, simpan), { bundel: 'hendra', kabar: 'persetujuan' }, 'versi lama melihat jawaban yang sama');
  // Draf versi lama (tanpa jejak meja) terbaca di meja.
  const dariLama = bacaMeja(K, { bundel: 'sekarang' }, sanitizeDraft(MISI, { bundel: 'sekarang' }));
  assert.deepEqual(dariLama, { jawaban: { bundel: 'sekarang' }, diperiksa: [], mapDibuka: false, fokus: 'meja' });
  // Draf rusak = kosong.
  assert.deepEqual(bacaMeja(K, { _meja: { diperiksa: [1, 'x', 'foto', 'foto'], fokus: 'aneh' } }, {}), { jawaban: {}, diperiksa: ['foto'], mapDibuka: true, fokus: 'meja' });
});

test('sembilan kombinasi tempat x kabar: alternatif & node akibat sama dengan KOMBINASI_BUNDEL; meja hasil membaca keputusan tersimpan', () => {
  const awal = siapK11();
  const tempatUntuk: Record<string, TempatMeja> = { lengkapi: 'papan', sekarang: 'komite', hendra: 'kontak' };
  const akhirUntuk: Record<string, string> = { lengkapi: 'lengkap', sekarang: 'kembali', hendra: 'tahan' };
  for (const x of KOMBINASI_BUNDEL) {
    let m = jalankanMeja(K, kosong(), { jenis: 'taruh', tempat: tempatUntuk[x.bundel]! });
    m = jalankanMeja(K, m, { jenis: 'kabar', kabar: x.kabar });
    const s = jalankan(EP, awal, { jenis: 'aktivitas', node: 'k11', jawaban: jawabanKonfirmasi(K, m) });
    assert.notEqual(s, awal, `${x.bundel}+${x.kabar} diterima mesin`);
    assert.equal(s.node, `k11-${x.akibat}`, `${x.bundel}+${x.kabar}`);
    assert.ok(s.riwayat.some((e) => e.jenis === 'alasan' && e.teks === `k11.${x.alt}.alasan`), `${x.bundel}+${x.kabar}: alasan alternatif ${x.alt}`);
    const a = akibatMeja(EP, s);
    assert.deepEqual(a && { tindakan: a.tindakan, kabar: a.kabar, akhir: a.akhir }, { tindakan: x.bundel, kabar: x.kabar, akhir: akhirUntuk[x.bundel] });
    // Konfirmasi kedua (ketukan ganda / muat ulang) tidak mengubah apa pun.
    assert.equal(jalankan(EP, s, { jenis: 'aktivitas', node: 'k11', jawaban: jawabanKonfirmasi(K, m) }), s);
    // Sesudah akibat selesai, meja hasil tidak lagi berlaku.
    let t = s;
    while (!semuaBarisTampil(EP, t)) t = jalankan(EP, t, { jenis: 'lanjut' });
    t = jalankan(EP, t, { jenis: 'lanjut' });
    assert.equal(t.node, 'k12');
    assert.equal(akibatMeja(EP, t), null);
  }
});

test('lompat ke meja: jalur saran sampai ke awal K11 (node aktivitas bundel), tanpa keputusan K11', () => {
  const s = stateDiTitik(EP, 'k11')!;
  assert.equal(s.node, 'k11');
  assert.equal((EP.node.k11 as NodeAktivitas).aktivitas, 'bundel');
  assert.equal(s.aktivitas.bundel, undefined);
  assert.equal(stateDiTitik(EP, 'tidak-ada'), null);
});
