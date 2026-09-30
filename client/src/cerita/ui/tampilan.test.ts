/**
 * TES PERILAKU tampilan mode cerita (murni, tanpa React) pada episode AUTO-1 sungguhan, dijalankan lewat MESIN:
 *  - ringkasan akhir tidak boleh menulis perasaan yang bertentangan dengan epilog (temuan: "Tenang" pada akhir
 *    yang isinya kekecewaan Bu Rina);
 *  - nasabah tidak lagi berdiri di meja sesudah epilog berpindah adegan ("Beberapa hari kemudian ... menelepon");
 *  - (v3) nasabah terlihat sejak narasi pintu terbuka (cue masuk), bukan baru saat ia bicara;
 *  - label suasana di panggung mengikuti wajah yang tampil, bukan kepercayaan kumulatif;
 *  - Catatan kasus: hasil aktivitas berstatus (tepat / belum / diperbaiki) dan kartu polis terbaca sejak
 *    aktivitasnya dimulai, juga bagi pemain yang salah membaca kartu.
 * Harapan ditulis dari NASKAH (epilog, reaksi) dan temuan peninjau, bukan dihitung ulang dengan fungsi yang diuji.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { jalankan, pilihanTersedia } from '../mesin';
import { teksCerita } from '../teks';
import type { AksiCerita, Ekspresi, IdAkhir, StateCerita } from '../tipe';
import { intiState, jawab, majuSampaiKeputusan, mainkanJalur, titikKeputusan, type LangkahJalur } from '../uji/jalurEpisode';
import { kandidatJawaban } from '../validasi';
import { EPISODE_AUTO_1 as EP } from '../episode/auto-1/episode';
import { aktivitasBerkartu, prosesAktivitas, ringkasAktivitas } from './hasilAktivitas';
import { ekspresiNasabah, kunciLabelEkspresi, nasabahHadir, perasaanAkhir } from './tampilan';

const tx = (k: string) => teksCerita(EP, k, 'id', { nama: 'Weli' });
const BUKTI_TEPAT: MissionAnswer = { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] };
const BUKTI_ASAL: MissionAnswer = { bukti: ['foto-full', 'foto-menu', 'foto-dasbor'] };
const polis = (opsi: string): MissionAnswer => ({ penjelasan: opsi });
/** Wajah yang berarti nasabah puas/lega: tidak boleh menjadi perasaan akhir pada akhir 'campuran' / 'buruk'. */
const WAJAH_POSITIF: Ekspresi[] = ['lega', 'senang', 'tersenyum'];

const JANJI: LangkahJalur[] = ['b1-datang/janji', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/janjikan', 'b5-tutup/rangkum'];
const TERBAIK: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'];
const RALAT_POLIS: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_ASAL), 'b3-bukti-kurang/lengkapi', jawab('b4-polis', polis('pasti-diganti')), 'b5-keberatan/ralat-polis'];
const TERTUNDA: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'];

/** Semua keadaan AKHIR (epilog tampil semua) yang terjangkau dari setiap titik keputusan. */
function semuaAkhir(): StateCerita[] {
  const hasil = new Map<string, StateCerita>();
  const abaikan = (t: string) => t.startsWith('akt:');
  for (const s of titikKeputusan(EP, { abaikanTanda: abaikan })) {
    const n = EP.node[s.node]!;
    const aksi: AksiCerita[] = n.jenis === 'pilihan'
      ? pilihanTersedia(EP, s, n).map((p) => ({ jenis: 'pilih', node: s.node, pilihan: p.id }))
      : n.jenis === 'aktivitas' ? (kandidatJawaban(EP, n.aktivitas) ?? []).map((j) => ({ jenis: 'aktivitas', node: s.node, jawaban: j })) : [];
    for (const a of aksi) {
      const b = majuSampaiKeputusan(EP, jalankan(EP, s, a));
      if (EP.node[b.node]?.jenis === 'akhir') hasil.set(intiState(b, abaikan), b);
    }
  }
  return [...hasil.values()];
}

/** Ekspresi ucapan nasabah terakhir di epilog, dibaca dari RIWAYAT (apa yang benar-benar tampil). */
function ekspresiTerakhirDiEpilog(s: StateCerita): Ekspresi | null {
  const baris = s.riwayat.filter((e) => e.jenis === 'baris' && e.node === s.node && e.siapa === EP.nasabah && e.ekspresi);
  const b = baris[baris.length - 1];
  return b && b.jenis === 'baris' ? b.ekspresi ?? null : null;
}

test('ringkasan akhir: perasaan akhir = ucapan terakhir nasabah di epilog; akhir campuran/buruk tidak berwajah lega', () => {
  const akhir = semuaAkhir();
  const ditemukan = new Set(akhir.map((s) => s.akhir));
  for (const a of Object.keys(EP.akhir)) assert.ok(ditemukan.has(a), `akhir "${a}" terjangkau`);
  for (const s of akhir) {
    const pa = perasaanAkhir(EP, s);
    const harap = ekspresiTerakhirDiEpilog(s);
    if (harap) assert.equal(pa.ekspresi, harap, `${s.akhir}: wajah akhir sama dengan ucapan terakhir di epilog`);
    const nada = EP.akhir[s.akhir as IdAkhir]!.nada;
    if (nada !== 'baik') {
      assert.ok(!WAJAH_POSITIF.includes(pa.ekspresi), `${s.akhir} (${nada}): perasaan akhir bukan wajah lega/senang (${pa.ekspresi})`);
      assert.notEqual(kunciLabelEkspresi(EP, pa.ekspresi), 'suasana.tenang', `${s.akhir}: tidak diringkas "Tenang"`);
    }
  }
});

test('akhir "janji" & "tertunda": dua keadaan (tenang saat pulang, kesal sesudahnya), bukan "Tenang" saja', () => {
  for (const [nama, jalur, akhir] of [['janji', JANJI, 'janji'], ['tertunda', TERTUNDA, 'tertunda']] as const) {
    const s = mainkanJalur(EP, jalur).state;
    assert.equal(s.akhir, akhir, `${nama}: jalur mencapai akhir ${akhir}`);
    const pa = perasaanAkhir(EP, s);
    assert.equal(pa.meja.label, 'suasana.tenang', `${nama}: komunikasi di meja memang membuatnya tenang`);
    assert.equal(pa.ekspresi, 'kesal', `${nama}: sesudahnya Bu Rina kesal (epilog)`);
    assert.equal(pa.sesudahnya, true, `${nama}: kekecewaan terjadi sesudah pergantian adegan`);
    assert.equal(kunciLabelEkspresi(EP, pa.ekspresi), 'suasana.kesal');
  }
  // Akhir tuntas: tidak ada pergantian adegan, satu keadaan.
  const tuntas = perasaanAkhir(EP, mainkanJalur(EP, TERBAIK).state);
  assert.equal(tuntas.sesudahnya, false);
  assert.ok(WAJAH_POSITIF.includes(tuntas.ekspresi));
});

test('panggung: nasabah tidak lagi berdiri di meja sesudah narasi di epilog (telepon beberapa hari kemudian)', () => {
  const { jejak } = mainkanJalur(EP, JANJI);
  const epilog = jejak.filter((s) => s.node === 'akhir-janji');
  const baris1 = epilog.find((s) => s.baris === 1)!;
  const baris2 = epilog.find((s) => s.baris === 2)!;
  assert.equal(tx('akhir-janji.2'), 'Beberapa hari kemudian, Bu Rina menelepon.', 'baris 2 = narasi pergantian adegan');
  assert.equal(nasabahHadir(EP, baris1), true, 'baris 1 (masih di meja): hadir');
  assert.equal(nasabahHadir(EP, baris2), false, 'sesudah narasi: tidak berdiri di meja');
  for (const s of epilog.filter((x) => x.baris > 2)) assert.equal(nasabahHadir(EP, s), false, `baris ${s.baris}: tetap tidak di meja`);
  // Akhir tuntas tanpa narasi: tetap di meja sampai baris terakhir.
  for (const s of mainkanJalur(EP, TERBAIK).jejak.filter((x) => x.node === 'akhir-tuntas')) assert.equal(nasabahHadir(EP, s), true);
});

test('panggung (v3): Bu Rina hadir sejak narasi pintu terbuka (cue masuk), bukan baru saat ia mulai bicara', () => {
  const h = mainkanJalur(EP, []);
  assert.equal(h.awal.node, 'b1-mentor');
  assert.equal(nasabahHadir(EP, h.awal), false, 'b1-mentor.1: Miss Raksa menyambut, kursi pengunjung masih kosong');
  const pintu = h.jejak.find((s) => s.node === 'b1-mentor' && s.baris === 2)!;
  assert.equal(tx('b1-mentor.4'), 'Pintu terbuka. Seorang nasabah masuk tergesa dan menaruh kunci mobilnya di meja.', 'baris 2 = narasi pintu');
  assert.equal(nasabahHadir(EP, pintu), true, 'narasi pintu: Bu Rina masuk dan terlihat (sebelumnya baru muncul saat bicara)');
  // Keluar lewat pintu (akhir pergi): tidak lagi di meja sesudah narasinya.
  const pergi = mainkanJalur(EP, ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan']).jejak.filter((s) => s.node === 'akhir-pergi');
  assert.deepEqual(pergi.map((s) => nasabahHadir(EP, s)), [true, false, false], 'ucapan terakhir di meja, lalu pergi, lalu pesan mentor');
});

test('panggung: label suasana mengikuti wajah yang tampil (ralat-polis: kesal, bukan "Tenang")', () => {
  const s = mainkanJalur(EP, RALAT_POLIS).state; // b5-tutup, baris reaksi pertama
  assert.equal(s.node, 'b5-tutup');
  assert.equal(ekspresiNasabah(EP, s), 'kesal', 'naskah: Bu Rina kesal setelah janji diralat');
  assert.equal(kunciLabelEkspresi(EP, ekspresiNasabah(EP, s)), 'suasana.kesal');
  // Baris pertama episode: wajah kesal -> label kesal (sebelumnya "Cemas" dari kepercayaan 0).
  const awal = mainkanJalur(EP, []).jejak.find((x) => x.node === 'b1-datang' && x.baris === 1)!;
  assert.equal(kunciLabelEkspresi(EP, ekspresiNasabah(EP, awal)), 'suasana.kesal');
});

test('catatan kasus: aktivitas berstatus; pilihan keliru ditandai salah; ralat & kelengkapan ditandai diperbaiki', () => {
  assert.deepEqual(prosesAktivitas(EP, 'polis'), ['baca-polis']);
  assert.deepEqual(prosesAktivitas(EP, 'bukti'), ['bukti']);

  const ralat = ringkasAktivitas(EP, mainkanJalur(EP, RALAT_POLIS).state, 'id', tx);
  const p = ralat.find((a) => a.id === 'polis')!;
  assert.equal(p.status, 'dikoreksi');
  assert.equal(p.statusAwal, 'belum');
  assert.deepEqual(p.pilihan, [{ teks: tx('akt.polis.opsi.pasti-diganti'), tanda: 'salah' }]);
  assert.deepEqual(p.terlewat, [tx('akt.polis.opsi.bisa-dinilai')]);
  const b = ralat.find((a) => a.id === 'bukti')!;
  assert.equal(b.status, 'dikoreksi', 'bukti dilengkapi di b3-bukti-kurang');
  assert.ok(b.pilihan.some((x) => x.teks === tx('akt.bukti.opsi.foto-dasbor') && x.tanda === 'salah'), 'foto dasbor tidak tercatat sebagai bukti tepat');

  const terbaik = ringkasAktivitas(EP, mainkanJalur(EP, TERBAIK).state, 'id', tx);
  assert.deepEqual(terbaik.map((a) => [a.id, a.status, a.terlewat.length]), [['bukti', 'tepat', 0], ['polis', 'tepat', 0]]);

  const salah = ringkasAktivitas(EP, mainkanJalur(EP, [...TERBAIK.slice(0, 3), jawab('b4-polis', polis('tidak-tercakup'))]).state, 'id', tx);
  assert.equal(salah.find((a) => a.id === 'polis')!.status, 'belum', 'belum diluruskan: tetap "belum tepat"');
});

test('catatan kasus: kartu polis terbaca sejak aktivitasnya dimulai, juga setelah salah membaca', () => {
  const sebelum = mainkanJalur(EP, TERBAIK.slice(0, 2)).state; // di aktivitas bukti
  assert.deepEqual(aktivitasBerkartu(EP, sebelum, 'id'), []);
  const diPolis = mainkanJalur(EP, TERBAIK.slice(0, 3)).state; // node aktivitas b4-polis, belum dijawab
  assert.equal(diPolis.node, 'b4-polis');
  assert.deepEqual(aktivitasBerkartu(EP, diPolis, 'id'), ['polis']);
  const tidakTercakup = mainkanJalur(EP, [...TERBAIK.slice(0, 3), jawab('b4-polis', polis('tidak-tercakup'))]).state;
  assert.deepEqual(aktivitasBerkartu(EP, tidakTercakup, 'id'), ['polis'], 'mentor menyuruh membaca ulang kartu: kartu tersedia');
  // Tidak bergantung pada butir catatan 'polis' di naskah: aktivitas yang sudah dinilai cukup.
  assert.deepEqual(aktivitasBerkartu(EP, { ...tidakTercakup, catatan: tidakTercakup.catatan.filter((c) => c !== 'polis') }, 'id'), ['polis']);
});
