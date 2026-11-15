/**
 * Tes K08 sebagai aktivitas arena 'rambu' di Episode 2 sungguhan: tanda lajur <-> jawaban, draf & muat ulang, kesimpulan = alternatif
 * naskah (tanda lajur tidak mengubah percabangan), tanggapan atas tanda, rambu 2 tidak dikarang, dan progres lama (K08 sebagai
 * pilihan) tetap termuat. Lewat mesin dan penyimpanan sungguhan, tanpa peramban.
 */
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { sanitizeDraft } from '../../game/draft';
import { jalankan, pilihanTersedia, semuaBarisTampil, stateAwal } from '../mesin';
import { aturUlangMemoriCerita, muatProgres, simpanProgres } from '../simpan';
import { teksCerita } from '../teks';
import type { AksiCerita, KunciTeks, NodeAktivitas, StateCerita } from '../tipe';
import { EPISODE_AUTO_2 as EP } from '../episode/auto-2/episode';
import { TEKS_AUTO_2_ID } from '../episode/auto-2/teks.id';
import { ketukanBelumUtuh } from './alur';
import { jawabanKirim } from './arena/logika';
import {
  LANGKAH_AWAL, alihLajur, bolehLanjut, bukaUlang, daftarLajur, ketukRambu, lajurDitandai, lanjutRambu, pulihkanLangkah, rambuAktif, rambuTerbuka,
  ringkasTanda, selesaiPeriksa, serialLangkah, simpulDipilih, sisaRambu, tahap, tanggapan, uraiLangkah, pilihSimpul, type ArenaRambu,
} from './arena/rambu';
import { ringkasTindakan } from './arena/ringkas';

const K = EP.aktivitas.rambu!.arena as ArenaRambu;
const tx = (k: KunciTeks, p?: Record<string, string | number>) => teksCerita(EP, k, 'id', { nama: 'Rina', ...p });
const LANJUT: AksiCerita = { jenis: 'lanjut' };
const DELTA: Record<string, number> = { a: -6, b: -3, c: 6, d: 0, e: 0 };

function kirim(s: StateCerita, aksi: AksiCerita): StateCerita {
  let x = jalankan(EP, s, aksi);
  for (let i = 0; i < 12 && ketukanBelumUtuh(EP, x); i++) x = jalankan(EP, x, LANJUT);
  return x;
}

/** Jalur saran sampai K08 siap dijawab (semua baris pengantar tampil), persis seperti pemain. */
function sampaiK08(): StateCerita {
  const TEPAT: Record<string, AksiCerita> = {
    k01: { jenis: 'pilih', node: 'k01', pilihan: 'a' }, k03: { jenis: 'pilih', node: 'k03', pilihan: 'c' }, k06: { jenis: 'pilih', node: 'k06', pilihan: 'b' },
  };
  const JAWAB: Record<string, MissionAnswer> = {
    k02: { berkas: { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul', kk: 'tidak', slip: 'tidak', rekening: 'tidak' } },
    k04: { tujuan: { rudi: 'pool' } }, k05: { tujuan: { bundel: 'mitra' } }, k07: { jalur: { periksa: 'paralel' } },
  };
  let s = stateAwal(EP);
  for (let i = 0; i < 400; i++) {
    if (s.node === 'k08' && semuaBarisTampil(EP, s)) return s;
    const n = EP.node[s.node]!;
    if (semuaBarisTampil(EP, s) && n.jenis === 'pilihan' && TEPAT[s.node]) s = kirim(s, TEPAT[s.node]!);
    else if (semuaBarisTampil(EP, s) && n.jenis === 'aktivitas' && JAWAB[s.node]) s = kirim(s, { jenis: 'aktivitas', node: s.node, jawaban: JAWAB[s.node]! });
    else s = kirim(s, LANJUT);
  }
  throw new Error('tidak sampai ke k08');
}

/** Jawaban rambu: lajur yang ditandai untuk rambu 1 dan 2, lalu kesimpulan. */
function jawab(m1: number[], m2: number[], simpul: string | null): MissionAnswer {
  let j: MissionAnswer = {};
  m1.forEach((n) => { j = alihLajur(K, j, 0, n); });
  m2.forEach((n) => { j = alihLajur(K, j, 1, n); });
  return simpul ? pilihSimpul(K, j, simpul) : j;
}

// ------------------------------------------------------------------ susunan <-> jawaban

test('tanda lajur: menyalakan, mematikan, terurut, per rambu terpisah, nomor di luar jalan diabaikan', () => {
  let j = alihLajur(K, {}, 0, 4);
  j = alihLajur(K, j, 0, 3);
  assert.deepEqual(lajurDitandai(K, j, 0), [3, 4]);
  assert.deepEqual(lajurDitandai(K, j, 1), []);
  assert.deepEqual(lajurDitandai(K, alihLajur(K, j, 0, 4), 0), [3]);
  assert.deepEqual(alihLajur(K, j, 0, 0), j); assert.deepEqual(alihLajur(K, j, 0, 5), j); assert.deepEqual(alihLajur(K, j, 1, 2.5), j);
  assert.deepEqual(alihLajur(K, j, 9, 1), j, 'rambu yang tidak ada diabaikan');
  assert.deepEqual(Object.keys((j.r1 as Record<string, string>)).sort(), ['r1l3', 'r1l4']);
});

test('draf arena: tanda & kesimpulan lolos pembersihan draf yang sama dengan antarmuka standar', () => {
  const misi = EP.aktivitas.rambu!.misi('id');
  const j = jawab([3, 4], [1], 'c');
  assert.deepEqual(sanitizeDraft(misi, JSON.parse(JSON.stringify(j))), j);
  // Item/wadah/opsi yang tidak ada dibuang, bukan dipercaya.
  const rusak = { r1: { r1l3: 'tanda', r1l9: 'tanda', r1l1: 'lain' }, simpul: 'z' };
  const bersih = sanitizeDraft(misi, rusak);
  assert.deepEqual(bersih.r1, { r1l3: 'tanda' });
  assert.equal(bersih.simpul, undefined);
});

test('kelengkapan: kirim hanya bila kedua rambu bertanda dan ada kesimpulan', () => {
  assert.equal(sisaRambu(K, {}), 3);
  assert.equal(sisaRambu(K, jawab([3], [], 'c')), 1);
  assert.equal(sisaRambu(K, jawab([3], [1], null)), 1);
  assert.equal(sisaRambu(K, jawab([3], [1], 'c')), 0);
  assert.equal(simpulDipilih(K, jawab([], [], 'a')), 'a');
  assert.equal(simpulDipilih(K, { simpul: 'z' }), null);
});

// ------------------------------------------------------------------ langkah layar & muat ulang

test('urutan langkah: ketuk -> tandai -> ketuk -> tandai -> kesimpulan; tidak melompat; rambu lama bisa dibuka ulang', () => {
  let s = LANGKAH_AWAL; let j: MissionAnswer = {};
  assert.equal(tahap(K, s), 'ketuk'); assert.equal(rambuAktif(K, s), 0);
  assert.deepEqual(lanjutRambu(K, j, s), s, 'lanjut tanpa menandai ditolak');
  s = ketukRambu(K, s);
  assert.deepEqual(ketukRambu(K, s), s, 'ketuk ganda tidak melompat');
  assert.equal(tahap(K, s), 'tandai'); assert.equal(bolehLanjut(K, j, s), false);
  j = alihLajur(K, j, 0, 3);
  s = lanjutRambu(K, j, s);
  assert.equal(tahap(K, s), 'ketuk'); assert.equal(rambuAktif(K, s), 1);
  assert.deepEqual(rambuTerbuka(K, s), [0]);
  assert.deepEqual(bukaUlang(K, s, 1), s, 'rambu 2 belum dibuka tidak bisa dibuka ulang');
  const lihat = bukaUlang(K, s, 0);
  assert.equal(tahap(K, lihat), 'tandai'); assert.equal(lihat.progres, 2, 'kemajuan tidak mundur');
  j = alihLajur(K, j, 0, 4);
  assert.deepEqual(lajurDitandai(K, j, 0), [3, 4]);
  s = lanjutRambu(K, j, lihat);
  assert.equal(s.lihat, null); assert.equal(s.progres, 2);
  s = ketukRambu(K, s); j = alihLajur(K, j, 1, 1); s = lanjutRambu(K, j, s);
  assert.equal(tahap(K, s), 'putus'); assert.equal(selesaiPeriksa(K, s), true);
  assert.deepEqual(rambuTerbuka(K, s), [0, 1]);
});

test('muat ulang: langkah tersimpan dipulihkan; tanpa catatan langkah diperkirakan dari tanda; nilai rusak ditolak', () => {
  for (const s of [LANGKAH_AWAL, { progres: 1, lihat: null }, { progres: 3, lihat: 0 }, { progres: 4, lihat: null }]) {
    assert.deepEqual(uraiLangkah(serialLangkah(s)), s);
  }
  assert.equal(uraiLangkah('x'), null); assert.equal(uraiLangkah(5), null); assert.equal(uraiLangkah('9:9:9'), null);
  assert.deepEqual(pulihkanLangkah(K, {}, null), { progres: 0, lihat: null });
  assert.deepEqual(pulihkanLangkah(K, jawab([3, 4], [], null), null), { progres: 2, lihat: null }, 'rambu 1 bertanda -> ketuk rambu 2');
  assert.deepEqual(pulihkanLangkah(K, jawab([3], [1], null), null), { progres: 4, lihat: null });
  assert.deepEqual(pulihkanLangkah(K, jawab([], [], 'c'), null), { progres: 4, lihat: null }, 'kesimpulan sudah dipilih -> langkah kesimpulan');
  assert.deepEqual(pulihkanLangkah(K, {}, { progres: 99, lihat: null }), { progres: 0, lihat: null }, 'progres di luar batas diabaikan');
  assert.deepEqual(pulihkanLangkah(K, {}, { progres: 1, lihat: 1 }), { progres: 1, lihat: null }, 'lihat rambu yang belum dibuka diabaikan');
});

// ------------------------------------------------------------------ mesin: kesimpulan = alternatif, tanda tidak mengubah percabangan

test('lima kesimpulan -> lima alternatif naskah dengan status naskah; apa pun tanda lajurnya (percabangan tidak berubah)', () => {
  const dasar = sampaiK08();
  for (const alt of ['a', 'b', 'c', 'd', 'e']) {
    for (const [m1, m2] of [[[3, 4], [1]], [[1, 2], [2, 3, 4]], [[2, 3, 4], [1, 2]], [[4], [3]]] as [number[], number[]][]) {
      const s = kirim(dasar, { jenis: 'aktivitas', node: 'k08', jawaban: jawabanKirim(K, jawab(m1, m2, alt)) });
      assert.ok(s.tanda.includes(`kep:k08:${alt}`), `${alt} tanda ${m1}/${m2}`);
      assert.equal(s.node, `k08-${alt}`, `${alt}: node akibat`);
      assert.equal(s.kepercayaan, dasar.kepercayaan + DELTA[alt]!, `${alt}: status naskah`);
      assert.ok(s.catatan.includes('catatan.rambu') || s.catatan.includes('rambu'), 'catatan kasus ikut tercatat');
    }
  }
});

test('tanda & kesimpulan tercatat di state (untuk riwayat, muat ulang, dan tanggapan); ringkasan tindakan menyebut lajur', () => {
  const dasar = sampaiK08();
  const j = jawab([3, 4], [1], 'c');
  const s = kirim(dasar, { jenis: 'aktivitas', node: 'k08', jawaban: j });
  const h = s.aktivitas.rambu!;
  assert.deepEqual(lajurDitandai(K, h.jawaban, 0), [3, 4]);
  assert.deepEqual(lajurDitandai(K, h.jawaban, 1), [1]);
  assert.ok(h.tanda.includes('akt:rambu:taruh:r1l3:tanda') && h.tanda.includes('akt:rambu:taruh:r2l1:tanda') && h.tanda.includes('akt:rambu:pilih:c'));
  assert.equal(ringkasTindakan(EP, 'rambu', h.jawaban, tx), 'Rambu 1: lajur 3 dan 4. Rambu 2: lajur 1.');
  assert.equal(ringkasTanda(K, h.jawaban, tx), 'Rambu 1: lajur 3 dan 4. Rambu 2: lajur 1.');
});

test('aktivitas dinilai sekali: kirim ulang di node akibat tidak mengubah apa pun', () => {
  const dasar = sampaiK08();
  const s1 = kirim(dasar, { jenis: 'aktivitas', node: 'k08', jawaban: jawab([3, 4], [1], 'c') });
  const s2 = jalankan(EP, s1, { jenis: 'aktivitas', node: 'k08', jawaban: jawab([1], [1], 'a') });
  assert.deepEqual(s2.tanda, s1.tanda);
});

// ------------------------------------------------------------------ tanggapan

const kunciTanggap = (j: MissionAnswer) => tanggapan(K, j).map((x) => x.jenis);

test('tanggapan: tanda sama dengan tulisan rambu dan sejalan -> satu kalimat netral; kesimpulan lain tanpa sikap tidak ditanyai', () => {
  assert.deepEqual(kunciTanggap(jawab([3, 4], [1], 'c')), ['sama']);
  for (const alt of ['b', 'd', 'e']) assert.deepEqual(kunciTanggap(jawab([3, 4], [1], alt)), ['sama'], alt);
});

test('tanggapan: tanda berbeda dari tulisan rambu disebut apa adanya, tanpa kata penilaian', () => {
  const r = tanggapan(K, jawab([1, 2], [1], 'e'));
  assert.deepEqual(r.map((x) => x.jenis), ['tulisan']);
  const teks = tx(r[0]!.teks, r[0]!.param);
  assert.match(teks, /lajur 1 dan 2/); assert.match(teks, /lajur 3 dan 4/);
  assert.doesNotMatch(teks, /salah|benar/i);
});

test('tanggapan: "melanggar" padahal lajur truk tidak ditandai, dan "tidak melanggar" padahal ditandai -> dipertanyakan', () => {
  assert.deepEqual(kunciTanggap(jawab([3, 4], [1], 'a')), ['sikap']);
  assert.match(tx(tanggapan(K, jawab([3, 4], [1], 'a'))[0]!.teks, tanggapan(K, jawab([3, 4], [1], 'a'))[0]!.param), /apa dasar/);
  assert.deepEqual(kunciTanggap(jawab([2, 3, 4], [1], 'c')), ['tulisan', 'sikap']);
  assert.match(tx(tanggapan(K, jawab([2, 3, 4], [1], 'c'))[1]!.teks, tanggapan(K, jawab([2, 3, 4], [1], 'c'))[1]!.param), /mana yang kamu maksud/);
});

test('rambu 2: tafsir "lajur kiri" tidak pernah dibandingkan atau dinilai (belum dikonfirmasi naskah)', () => {
  for (const m2 of [[1], [1, 2], [3], [1, 2, 3, 4]]) assert.deepEqual(kunciTanggap(jawab([3, 4], m2, 'c')), ['sama'], `tanda rambu 2 ${m2}`);
  assert.equal(K.rambu[1]!.tulisan, undefined);
  // Kunci aktivitas pun tidak mengarang jawaban benar untuk rambu 2.
  assert.deepEqual(EP.aktivitas.rambu!.kunci.find((x) => x.stepId === 'r2')!.assign, {});
  assert.equal(daftarLajur([2, 3, 4]), 'lajur 2, 3, dan 4'); assert.equal(daftarLajur([]), 'belum ada lajur');
});

test('teks antarmuka rambu: tanpa penilaian atau hasil klaim; tulisan rambu dikutip apa adanya dari naskah', () => {
  const larangan = /\b(benar|salah(?! satu)|tepat|bagus|dibayar|ditolak|disetujui|layak|penipuan|bohong)\b/i;
  for (const [k, v] of Object.entries(TEKS_AUTO_2_ID)) if (k.startsWith('arena.rambu.') || k.startsWith('akt.rambu.')) assert.doesNotMatch(v, larangan, k);
  assert.equal(tx(K.rambu[0]!.isi), 'Truk dan trailer dilarang menggunakan lajur 3 dan 4.');
  assert.deepEqual(K.rambu[0]!.tulisan, [3, 4]);
});

// ------------------------------------------------------------------ progres lama

const penyimpanan = new Map<string, string>();
beforeEach(() => {
  penyimpanan.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem: (k: string) => penyimpanan.get(k) ?? null, setItem: (k: string, v: string) => { penyimpanan.set(k, String(v)); }, removeItem: (k: string) => { penyimpanan.delete(k); } },
    configurable: true, writable: true,
  });
  aturUlangMemoriCerita();
});

test('progres lama: tersimpan di K08 (sebelum menjawab) tetap termuat dan bisa dilanjutkan sebagai aktivitas', () => {
  const s = sampaiK08();
  assert.equal(simpanProgres(EP, s), true);
  const h = muatProgres(EP);
  assert.equal(h.status, 'lanjut');
  if (h.status !== 'lanjut') return;
  assert.equal(h.state.node, 'k08');
  const lanjutan = kirim(h.state, { jenis: 'aktivitas', node: 'k08', jawaban: jawab([3, 4], [1], 'c') });
  assert.equal(lanjutan.node, 'k08-c');
});

test('progres lama: K08 sudah dijawab sebagai PILIHAN (tanpa data aktivitas rambu) tetap termuat dan berjalan sampai akhir', () => {
  const baru = kirim(sampaiK08(), { jenis: 'aktivitas', node: 'k08', jawaban: jawab([3, 4], [1], 'c') });
  // Bentuk simpanan lama: riwayat 'pilihan' untuk k08 dan tidak ada hasil aktivitas 'rambu'.
  const lama: StateCerita = JSON.parse(JSON.stringify(baru));
  delete lama.aktivitas.rambu;
  lama.riwayat = lama.riwayat.map((e) => (e.jenis === 'aktivitas' && e.node === 'k08' ? { jenis: 'pilihan' as const, node: 'k08', pilihan: 'c', teks: 'k08.c' } : e));
  lama.tanda = lama.tanda.filter((t) => !t.startsWith('akt:rambu:'));
  assert.ok(lama.tanda.includes('kep:k08:c'));
  assert.equal(simpanProgres(EP, lama), true);
  const h = muatProgres(EP);
  assert.equal(h.status, 'lanjut', JSON.stringify(h));
  if (h.status !== 'lanjut') return;
  let s = h.state;
  for (let i = 0; i < 40 && s.node !== 'k09'; i++) s = kirim(s, LANJUT);
  assert.equal(s.node, 'k09');
  assert.equal((EP.node.k08 as NodeAktivitas).jenis, 'aktivitas');
});

// ------------------------------------------------------------------ ulang bab & riwayat

test('ulang bab 3: K08 bisa dimainkan lagi dari awal (hasil & tanda lama dilepas, bukan menumpuk)', () => {
  let s = kirim(sampaiK08(), { jenis: 'aktivitas', node: 'k08', jawaban: jawab([3, 4], [1], 'a') });
  assert.ok(s.tanda.includes('kep:k08:a'));
  // Mainkan terus sampai akhir dengan jawaban seadanya agar snapshot bab tercatat.
  const JAWAB: Record<string, () => MissionAnswer> = {
    k09: () => ({ saksi: { hendra: 'ya', darto: 'ya', tol: 'ya', polisi: 'ya', mobilkecil: 'tidak' } }),
    k10: () => ({ selisih: { jam: 'catat', nama: 'catat', antisipasi: 'catat' } }),
    k11: () => ({ bundel: 'lengkapi', kabar: 'persetujuan' }),
    k15: () => ({ pesan: { kabar: 'masuk', bukti: 'masuk', langkah: 'masuk', jujur: 'masuk', bintang: 'tidak', polis: 'tidak' } }),
  };
  for (let i = 0; i < 500 && EP.node[s.node]!.jenis !== 'akhir'; i++) {
    const n = EP.node[s.node]!;
    if (semuaBarisTampil(EP, s) && n.jenis === 'pilihan') s = kirim(s, { jenis: 'pilih', node: s.node, pilihan: pilihanPertama(s) });
    else if (semuaBarisTampil(EP, s) && n.jenis === 'aktivitas' && !s.umpanBalik) s = kirim(s, { jenis: 'aktivitas', node: s.node, jawaban: JAWAB[s.node]!() });
    else s = kirim(s, LANJUT);
  }
  assert.equal(EP.node[s.node]!.jenis, 'akhir');
  const ulang = kirim(s, { jenis: 'ulangBab', bab: 'b3' });
  assert.equal(EP.node[ulang.node]!.bab, 'b3');
  assert.equal(ulang.aktivitas.rambu, undefined, 'hasil aktivitas K08 dilepas saat bab 3 diulang');
  assert.ok(!ulang.tanda.some((t) => t.startsWith('kep:k08:') || t.startsWith('akt:rambu:')), 'tanda K08 lama dilepas');
  // Dimainkan lagi dengan kesimpulan lain: tercatat satu kali.
  const lagi = kirim(sampaiDi(ulang, 'k08'), { jenis: 'aktivitas', node: 'k08', jawaban: jawab([2], [1], 'e') });
  assert.deepEqual(lagi.tanda.filter((t) => t.startsWith('kep:k08:')), ['kep:k08:e']);
});

function pilihanPertama(s: StateCerita): string {
  return pilihanTersedia(EP, s)[0]!.id;
}
function sampaiDi(s: StateCerita, node: string): StateCerita {
  let x = s;
  const JAWAB: Record<string, MissionAnswer> = { k07: { jalur: { periksa: 'paralel' } } };
  for (let i = 0; i < 100 && !(x.node === node && semuaBarisTampil(EP, x)); i++) {
    const n = EP.node[x.node]!;
    if (semuaBarisTampil(EP, x) && n.jenis === 'aktivitas' && !x.umpanBalik && JAWAB[x.node]) x = kirim(x, { jenis: 'aktivitas', node: x.node, jawaban: JAWAB[x.node]! });
    else x = kirim(x, LANJUT);
  }
  return x;
}

test('K08-C bertentangan dengan tanda: teks pengganti netral ada, efek mesin tidak diubah (D-71)', () => {
  const ADA = (k: string) => Object.prototype.hasOwnProperty.call(TEKS_AUTO_2_ID, k);
  assert.ok(ADA('k08-c.konflik') && ADA('k08.c.alasanKonflik'));
  // Kesimpulan "tidak melanggar" + lajur truk ditandai terlarang = tanggapan sikapTidak (pemicu penggantian tampilan).
  let j: MissionAnswer = {};
  j = alihLajur(K, j, 0, K.lajurTruk);
  j = pilihSimpul(K, j, 'c');
  assert.ok(tanggapan(K, j).some((x) => x.teks === 'arena.rambu.tanggap.sikapTidak'));
  // Tanda sesuai tulisan rambu: tidak bertentangan, teks asli dipakai.
  let ok: MissionAnswer = {};
  ok = alihLajur(K, ok, 0, 3);
  ok = alihLajur(K, ok, 0, 4);
  ok = pilihSimpul(K, ok, 'c');
  assert.ok(!tanggapan(K, ok).some((x) => x.teks === 'arena.rambu.tanggap.sikapTidak'));
  // Penggantian hanya tampilan: delta alternatif c tetap +6.
  assert.equal(DELTA.c, 6);
  assert.match(TEKS_AUTO_2_ID['k08-c.konflik']!, /ditinjau/);
});
