/**
 * TES kartu akhir sebab-akibat & tinjauan "Lihat perjalananku" (layar akhir v2, docs/rancangan-mode-cerita.md
 * bagian 11) pada episode AUTO-1 sungguhan, dimainkan lewat MESIN.
 *
 * Yang dijaga (dari brief v2):
 *  - penjelasan utama dipilih dari keputusan nyata (tanda, proses, koreksi, akhir), BUKAN dari tiga alasan pertama
 *    atau angka kepercayaan; jalur janjikan memakai kalimat "mengandalkan ucapanmu bahwa besok selesai";
 *  - kekeliruan yang sudah diperbaiki tidak tampil sebagai belum beres, bukti yang kurang tidak tampil lengkap,
 *    langkah yang keliru tidak dimaafkan oleh suasana yang membaik;
 *  - akhir yang belum baik selalu punya titik "Coba lagi dari bagian …" yang benar-benar bisa diulang;
 *  - pelajaran 15-25 kata; semua keadaan akhir yang terjangkau punya aturan yang sesuai dengan epilognya.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { babBisaDiulang, jalankan, pilihanTersedia, stateAwal } from '../mesin';
import { teksCerita } from '../teks';
import type { AksiCerita, StateCerita } from '../tipe';
import { intiState, jawab, majuSampaiKeputusan, mainkanJalur, salinJson, type LangkahJalur } from '../uji/jalurEpisode';
import { kandidatJawaban } from '../validasi';
import { EPISODE_AUTO_1 as EP } from '../episode/auto-1/episode';
import { hitungKata, kartuAkhir, tinjauanPerjalanan } from './tinjauan';

const id = (k: string) => teksCerita(EP, k, 'id', { nama: 'Weli' });
const BUKTI_TEPAT: MissionAnswer = { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] };
const BUKTI_KURANG: MissionAnswer = { bukti: ['foto-full', 'foto-penyok', 'foto-ban'] };
const polis = (opsi: string): MissionAnswer => ({ penjelasan: opsi });
const main = (jalur: LangkahJalur[]): StateCerita => mainkanJalur(EP, jalur).state;

const AWAL_BAIK: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT)];
const JALUR = {
  tuntas: [...AWAL_BAIK, jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  janjikan: [...AWAL_BAIK, jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/janjikan', 'b5-tutup/rangkum'],
  janjiPolis: [...AWAL_BAIK, jawab('b4-polis', polis('pasti-diganti')), 'b5-keberatan/aturan-janji', 'b5-tutup/rangkum'],
  janjiAwal: ['b1-datang/janji', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/aturan-janji', 'b5-tutup/rangkum'],
  ralatJanji: ['b1-datang/janji', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/ralat-janji', 'b5-tutup/rangkum'],
  pulih: ['b1-datang/prosedur', 'b1-pulih/maaf', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  lengkapi: ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_KURANG), 'b3-bukti-kurang/lengkapi', jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  cukup: ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_KURANG), 'b3-bukti-kurang/cukup', jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  bengkel: ['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  singkat: [...AWAL_BAIK, jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/singkat'],
  aturan: [...AWAL_BAIK, jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/aturan', 'b5-tutup/rangkum'],
  dinginAwal: ['b1-datang/prosedur', 'b1-pulih/tetap', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'],
  sepele: ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan'],
  bertahan: [...AWAL_BAIK, jawab('b4-polis', polis('tidak-tercakup')), 'b4-polis-salah/bertahan'],
} satisfies Record<string, LangkahJalur[]>;

/**
 * Semua keadaan AKHIR (epilog tampil semua) yang terjangkau, termasuk beda tanda hasil aktivitas (akt:…): setiap
 * keputusan & setiap kandidat jawaban aktivitas dicoba dari setiap keadaan yang belum pernah dikunjungi.
 */
function semuaAkhir(): StateCerita[] {
  const hasil = new Map<string, StateCerita>();
  const dikunjungi = new Set<string>();
  const kandidat = new Map<string, MissionAnswer[]>();
  const tumpukan: StateCerita[] = [majuSampaiKeputusan(EP, stateAwal(EP))];
  while (tumpukan.length) {
    const s = tumpukan.pop()!;
    const n = EP.node[s.node]!;
    if (n.jenis === 'akhir') {
      hasil.set(intiState(s), s);
      continue;
    }
    const kunci = intiState(s);
    if (dikunjungi.has(kunci)) continue;
    dikunjungi.add(kunci);
    if (n.jenis === 'aktivitas' && !kandidat.has(n.aktivitas)) kandidat.set(n.aktivitas, kandidatJawaban(EP, n.aktivitas) ?? []);
    const aksi: AksiCerita[] = n.jenis === 'pilihan'
      ? pilihanTersedia(EP, s, n).map((p) => ({ jenis: 'pilih', node: s.node, pilihan: p.id }))
      : n.jenis === 'aktivitas' ? kandidat.get(n.aktivitas)!.map((j) => ({ jenis: 'aktivitas', node: s.node, jawaban: j })) : [];
    for (const a of aksi) {
      const b = jalankan(EP, s, a);
      if (b !== s) tumpukan.push(majuSampaiKeputusan(EP, b));
    }
  }
  return [...hasil.values()];
}

test('kartu akhir: jalur janjikan menonjolkan janji waktu (kalimat brief), wajah kecewa sesudahnya, ulang dari Menutup', () => {
  const s = main(JALUR.janjikan);
  const k = kartuAkhir(EP, s)!;
  assert.equal(s.akhir, 'janji');
  assert.equal(k.aturan, 'janji-besok');
  assert.equal(id(k.sebab), 'Bu Rina mengandalkan ucapanmu bahwa besok selesai, padahal waktunya belum bisa dipastikan.');
  assert.equal(k.ekspresi, 'kesal', 'potret memakai perasaan AKHIR (telepon beberapa hari kemudian), bukan lega di meja');
  assert.equal(k.sesudahnya, true);
  assert.equal(k.ulang, 'menutup');
  assert.match(id(k.judul), /kecewa/);
});

test('kartu akhir: tiap akhir & jalur pemulihan memakai aturan yang sesuai keputusannya', () => {
  const harap: Record<keyof typeof JALUR, [akhir: string, aturan: string, ulang: string | null]> = {
    tuntas: ['tuntas', 'tuntas-jelas', null],
    janjikan: ['janji', 'janji-besok', 'menutup'],
    janjiPolis: ['janji', 'janji-polis', 'polis'],
    janjiAwal: ['janji', 'janji-awal', 'menutup'],
    ralatJanji: ['tuntas', 'tuntas-ralat-janji', null],
    pulih: ['tuntas', 'tuntas-pulih', null],
    lengkapi: ['tuntas', 'tuntas-lengkapi', null],
    cukup: ['tertunda', 'tertunda-foto', 'bukti'],
    bengkel: ['tertunda', 'tertunda-bengkel', 'menggali'],
    singkat: ['dingin', 'dingin-singkat', 'menutup'],
    aturan: ['dingin', 'dingin-aturan', 'menutup'],
    dinginAwal: ['dingin', 'dingin-awal', 'menyambut'],
    sepele: ['pergi', 'pergi-sepele', 'menggali'],
    bertahan: ['pergi', 'pergi-bertahan', 'polis'],
  };
  for (const [nama, jalur] of Object.entries(JALUR) as [keyof typeof JALUR, LangkahJalur[]][]) {
    const s = main(jalur);
    const k = kartuAkhir(EP, s)!;
    const [akhir, aturan, ulang] = harap[nama];
    assert.equal(s.akhir, akhir, `${nama}: akhir`);
    assert.equal(k.aturan, aturan, `${nama}: aturan`);
    assert.equal(k.ulang, ulang, `${nama}: titik ulang`);
    if (ulang) assert.ok(babBisaDiulang(EP, s).includes(ulang), `${nama}: titik ulang benar-benar bisa diulang`);
  }
});

test('kartu akhir: tidak bergantung pada angka kepercayaan atau urutan alasan', () => {
  for (const jalur of [JALUR.janjikan, JALUR.aturan, JALUR.dinginAwal, JALUR.pulih]) {
    const s = main(jalur);
    const asli = kartuAkhir(EP, s)!;
    for (const kepercayaan of [-9, 0, 9]) {
      assert.equal(kartuAkhir(EP, { ...s, kepercayaan })!.aturan, asli.aturan, 'kepercayaan diubah -> aturan sama');
    }
    const dibalik = salinJson(s);
    dibalik.riwayat.reverse();
    assert.equal(kartuAkhir(EP, dibalik)!.aturan, asli.aturan, 'urutan riwayat dibalik -> aturan sama');
    assert.equal(kartuAkhir(EP, { ...s, riwayat: s.riwayat.filter((e) => e.jenis !== 'alasan') })!.aturan, asli.aturan, 'tanpa alasan -> aturan sama');
  }
});

test('tinjauan: janji yang menenangkan tetap perlu diperhatikan; langkah keliru tidak dimaafkan', () => {
  const t = tinjauanPerjalanan(EP, main(JALUR.janjikan));
  assert.ok(t.perhatian.komunikasi.some((x) => x.teks === 'b5-keberatan.janjikan.alasan'), 'janji (suasana naik) masuk perhatian');
  assert.ok(!t.membantu.komunikasi.some((x) => x.teks === 'b5-keberatan.janjikan.alasan'), 'janji tidak masuk yang membantu');
  assert.deepEqual(t.perhatian.proses.map((p) => [p.id, p.nilai]), [['tanpa-janji', 'keliru']]);
  assert.ok(!t.membantu.proses.some((p) => p.id === 'tanpa-janji'));
  assert.equal(t.kenapa.sebab, 'kartu.janji-besok.sebab');
});

test('tinjauan: kekeliruan yang sudah diperbaiki tampil sebagai ralat, bukan belum beres', () => {
  const ralat = tinjauanPerjalanan(EP, main(JALUR.ralatJanji));
  assert.ok(!ralat.perhatian.komunikasi.some((x) => x.teks === 'b1-datang.janji.alasan'), 'janji awal yang diluruskan tidak di perhatian');
  assert.ok(ralat.membantu.komunikasi.some((x) => x.teks === 'b5-keberatan.ralat-janji.alasan' && x.ralat), 'ralat (suasana turun) masuk yang membantu');
  assert.ok(ralat.membantu.proses.some((p) => p.id === 'tanpa-janji' && p.nilai === 'dikoreksi'));
  assert.equal(ralat.perhatian.proses.length, 0);

  const pulih = tinjauanPerjalanan(EP, main(JALUR.pulih));
  assert.ok(!pulih.perhatian.komunikasi.some((x) => x.teks === 'b1-datang.prosedur.alasan'), 'prosedur dulu yang dipulihkan tidak di perhatian');
  assert.ok(pulih.membantu.komunikasi.some((x) => x.teks === 'b1-pulih.maaf.alasan' && x.ralat));

  const lengkap = tinjauanPerjalanan(EP, main(JALUR.lengkapi));
  assert.ok(lengkap.membantu.proses.some((p) => p.id === 'bukti' && p.nilai === 'dikoreksi'), 'foto dilengkapi = diperbaiki');
  assert.ok(!lengkap.perhatian.proses.some((p) => p.id === 'bukti'));
});

test('tinjauan: bukti yang kurang tidak tampil lengkap; langkah yang tidak dilakukan tampil belum dilakukan', () => {
  const cukup = tinjauanPerjalanan(EP, main(JALUR.cukup));
  assert.ok(cukup.perhatian.proses.some((p) => p.id === 'bukti' && p.nilai === 'keliru'), 'bukti kurang = perhatian');
  assert.ok(cukup.perhatian.komunikasi.some((x) => x.teks === 'b3-bukti-kurang.cukup.alasan'));
  assert.ok(!cukup.membantu.proses.some((p) => p.id === 'bukti'));

  const pergi = tinjauanPerjalanan(EP, main(JALUR.sepele));
  for (const p of ['bukti', 'baca-polis', 'tanpa-janji']) {
    assert.ok(pergi.perhatian.proses.some((x) => x.id === p && x.nilai === null), `${p}: belum dilakukan`);
  }
  assert.ok(pergi.perhatian.paham.length > 0, 'Bu Rina pergi belum paham');
});

test('kartu akhir: semua keadaan akhir terjangkau punya aturan, titik ulang, dan tinjauan yang jujur', () => {
  const akhir = semuaAkhir();
  const aturanTerpakai = new Set<string>();
  for (const a of Object.keys(EP.akhir)) assert.ok(akhir.some((s) => s.akhir === a), `akhir "${a}" terjangkau`);
  for (const s of akhir) {
    const k = kartuAkhir(EP, s)!;
    assert.ok(k.aturan, `${s.akhir}: ada aturan`);
    aturanTerpakai.add(k.aturan);
    if (k.nada !== 'baik') {
      assert.ok(k.ulang && babBisaDiulang(EP, s).includes(k.ulang), `${k.aturan}: titik ulang tersedia`);
    } else assert.equal(k.ulang, null);
    // Epilog janji: janji waktu (akhir-janji.3) <-> kartu janji waktu.
    if (s.akhir === 'janji') {
      const waktu = s.tanda.includes('janji-awal') || s.tanda.includes('janji-waktu');
      assert.equal(k.aturan !== 'janji-polis', waktu, 'kartu janji sesuai epilog');
    }
    const t = tinjauanPerjalanan(EP, s);
    assert.deepEqual(t.tanpaMakna, [], 'semua alasan punya makna');
    for (const p of t.membantu.proses) assert.ok(['tepat', 'dikoreksi'].includes(s.proses[p.id] ?? ''), 'membantu hanya langkah tepat/diperbaiki');
    for (const p of t.perhatian.proses) assert.ok(!['tepat', 'dikoreksi'].includes(s.proses[p.id] ?? ''), 'perhatian hanya langkah keliru/tidak dilakukan');
    if (s.akhir === 'tuntas') assert.equal(t.perhatian.proses.length, 0, 'akhir baik tanpa langkah keliru');
  }
  for (const a of EP.kartuAkhir ?? []) {
    if (a.id === 'dingin-jarak') continue; // cadangan pengaman; semua jalur dingin saat ini ditangani aturan sebelumnya
    assert.ok(aturanTerpakai.has(a.id), `aturan "${a.id}" terpakai di salah satu jalur`);
  }
});

test('kartu akhir: pelajaran 15-25 kata, kalimat sebab & judul ringkas (bahasa Indonesia)', () => {
  for (const a of EP.kartuAkhir ?? []) {
    const n = hitungKata(id(a.pelajaran));
    assert.ok(n >= 15 && n <= 25, `${a.id}: pelajaran ${n} kata`);
    assert.ok(hitungKata(id(a.sebab)) <= 22, `${a.id}: sebab paling banyak 22 kata`);
    assert.ok(hitungKata(id(a.judul)) <= 8, `${a.id}: judul paling banyak 8 kata`);
    for (const b of ['en', 'zh'] as const) assert.notEqual(teksCerita(EP, a.pelajaran, b), a.pelajaran, `${a.id}: pelajaran ${b} ada`);
  }
});

test('tinjauan: akhir yang belum baik tidak pernah ditulis "tidak ada yang tertinggal"', () => {
  // Semua kekeliruan diluruskan, tetapi kepercayaan tetap < 3 -> dingin-ralat dengan daftar perhatian kosong.
  const s = main(['b1-datang/janji', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('tidak-tercakup')), 'b4-polis-salah/baca-ulang', 'b5-keberatan/ralat-janji', 'b5-tutup/rangkum']);
  assert.equal(s.akhir, 'dingin');
  assert.equal(kartuAkhir(EP, s)!.aturan, 'dingin-ralat');
  assert.equal(tinjauanPerjalanan(EP, s).perhatianKosong, 'diluruskan');
  assert.equal(tinjauanPerjalanan(EP, main(JALUR.tuntas)).perhatianKosong, 'beres');
  assert.equal(tinjauanPerjalanan(EP, main(JALUR.janjikan)).perhatianKosong, null);
  for (const st of semuaAkhir()) {
    const t = tinjauanPerjalanan(EP, st);
    if (t.perhatianKosong === 'beres') assert.equal(EP.akhir[st.akhir!]!.nada, 'baik', `${st.akhir}: "beres" hanya untuk akhir baik`);
  }
});
