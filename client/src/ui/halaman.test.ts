import test from 'node:test';
import assert from 'node:assert/strict';
import { judulDokumen, perluFokusJudul, type Kunjungan } from './halaman';

const ke = (kunci: string, pathname: string, jenis: Kunjungan['jenis'] = 'PUSH'): Kunjungan => ({ kunci, pathname, jenis });

test('fokus judul: muat awal & muat ulang tidak memindah fokus (urutan baca normal dari atas)', () => {
  // Dokumen baru: entri pertama react-router berkunci "default".
  assert.equal(perluFokusJudul('default', ke('default', '/', 'POP'), false), false);
  // Muat ulang entri hasil navigasi: kuncinya sudah tersimpan di history.state.
  assert.equal(perluFokusJudul('a1b2', ke('a1b2', '/cerita', 'POP'), true), false);
});

test('fokus judul: pengalihan otomatis sebelum pengguna menyentuh apa pun tidak dianggap pindah halaman', () => {
  // /cerita/auto-1 tanpa profil -> /kenalan?lanjut=... (Navigate replace) saat halaman baru dibuka.
  assert.equal(perluFokusJudul('default', ke('k1', '/kenalan', 'REPLACE'), false), false);
});

test('fokus judul: pindah halaman oleh pengguna memindah fokus ke judul', () => {
  assert.equal(perluFokusJudul('default', ke('k1', '/cerita'), true), true, 'pintu Main cerita di halaman awal');
  assert.equal(perluFokusJudul('k1', ke('k2', '/cerita/auto-1'), true), true, 'Mulai di kartu episode');
  assert.equal(perluFokusJudul('k2', ke('k1', '/cerita', 'POP'), true), true, 'tombol kembali browser');
  // Kenalan menyimpan profil lalu navigate(tujuan, { replace: true }): tetap tindakan pengguna.
  assert.equal(perluFokusJudul('k3', ke('k4', '/cerita', 'REPLACE'), true), true, 'simpan & lanjut dari kenalan');
  // Join -> /lobby (push) adalah tindakan pengguna.
  assert.equal(perluFokusJudul('k4', ke('k5', '/lobby'), true), true, 'masuk lobby dari form gabung');
});

test('fokus judul: PhaseRouter (host mengganti fase, navigate replace) tidak merebut fokus pemain', () => {
  for (const r of ['/lobby', '/tutorial', '/main', '/hasil']) {
    assert.equal(perluFokusJudul('k5', ke('k6' + r, r, 'REPLACE'), true), false, r);
  }
});

test('fokus judul: halaman yang sama dipasang ulang (entri riwayat sama) tidak memindah fokus lagi', () => {
  assert.equal(perluFokusJudul('k7', ke('k7', '/cerita/auto-1'), true), false);
});

test('judul dokumen: "<judul> – RAKSA GAME"; kosong/null = judul dasar; teks h1 dirapikan', () => {
  assert.equal(judulDokumen('Mode Cerita', 'DASAR'), 'Mode Cerita – RAKSA GAME');
  assert.equal(judulDokumen(null, 'DASAR'), 'DASAR');
  assert.equal(judulDokumen('   ', 'DASAR'), 'DASAR');
  assert.equal(judulDokumen(undefined, 'DASAR'), 'DASAR');
  assert.equal(judulDokumen('  Kenalan dulu,\n   yuk. ', 'DASAR'), 'Kenalan dulu, yuk – RAKSA GAME');
  assert.equal(judulDokumen('先认识一下吧。', 'DASAR'), '先认识一下吧 – RAKSA GAME');
  assert.equal(judulDokumen('Siap masuk?', 'DASAR'), 'Siap masuk? – RAKSA GAME');
});
