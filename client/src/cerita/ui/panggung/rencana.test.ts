/**
 * TES RENCANA GERAK panggung v3 (murni). Yang dijaga:
 *  - Keyframe sah (offset 0..1 menaik, mulai 0 & berakhir 1) untuk semua rencana.
 *  - Keadaan AKHIR tiap animasi elemen komposisi akhir = gaya bawaannya (terlihat, tanpa geser), dan aktor
 *    sementara berakhir tak terlihat: membatalkan/menyelesaikan kapan pun tidak meninggalkan tokoh hantu.
 *  - Kedatangan: pintu berputar di engsel lalu menutup, Bu Rina berjalan dari ambang pintu sepanjang jalur dengan
 *    pose jalan bergantian, pindah lapisan dari belakang meja ke depan, lalu duduk; Miss Raksa mempersilakan lalu
 *    duduk; tombol "Lewati pembuka" tampil. Kepergian: kebalikannya, kursi kosong. Dengan bingkai antara
 *    `duduk-turun` (bila generator punya): berdiri -> duduk-turun -> duduk dan sebaliknya, tetap satu badan.
 *    Kartu muncul di tepi dekat meja di sisi pemain, meluncur ke tengah meja, lalu Miss Raksa menunjuk.
 *  - Aksi dibaca dari komposisi KINI (bukan dari susunan yang dimemo tanpa aksi).
 *  - Seni kartu episode (/cerita): potongan ruang v3 diam dengan papan nama utuh & Bu Rina.
 *  - Perubahan antarbaris (ekspresi) = respons kecil <= 200 ms; tanpa perubahan = tanpa rencana.
 *  - TANPA BADAN GANDA: di setiap saat (dicuplik tiap 5 md) paling banyak satu badan per tokoh > 25 % terlihat,
 *    termasuk salinan adegan lama saat pindah lokasi. Kartu sesudah pindah lokasi: larut dulu, baru kartu & menunjuk.
 *  - Tokoh yang tetap di kursinya saat pindah lokasi (meja -> telepon) tidak ikut larut (tanpa celup); tukar
 *    berdiri <-> duduk di tempat berbeda bergeser mendatar bersambung (tanpa lompatan).
 *  - Pemanas cache (panas.ts): pratinjau komposisi berikutnya murni (state tidak berubah), dan opsi gambar yang
 *    dipanaskan MEMUAT semua gambar yang nanti diminta rencana transisi & salinan kedip/mulut sungguhan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ruangSementara } from '../../seni/ruang/sementara';
import { ruangAdegan } from '../../seni/ruang';
import type { KomposisiAdegan } from '../adeganTipe';
import { cariTokoh, susunAdegan, Z, type LetakTokoh, type SusunanAdegan } from './dunia';
import { transformKamera, type Kamera } from './kamera';
import { kotakDiAtasMeja, pikselDari } from './piksel';
import {
  arahTukar, gerakJalan, gerakPenggal, JADWAL_KARTU, JADWAL_MASUK, JADWAL_PERGI, kf, LARUT_TOKOH, rencanaGanti, rencanaKartu, rencanaMasuk, rencanaPembuka,
  rencanaPergi, rencanaPindah, TAHAN_TURUN, TAHAN_TURUN_MENTOR, titikJalur, type Rencana,
} from './rencana';
import { gambarTokoh } from './sumber';
import { jalankan, stateAwal } from '../../mesin';
import { EPISODE_AUTO_1 } from '../../episode/auto-1/episode';
import { majuSampaiKeputusan, salinJson } from '../../uji/jalurEpisode';
import { adeganKini } from '../adegan';
import { komposisiBerikut, kunciOpsi, opsiPanas, type OpsiGambar } from './panas';
import { ambilRuang } from './sumber';
import { pabrikTransisi } from './transisi';
import { seniKartuRuang } from './kartuRuang';

const K1: Kamera = { s: 0.8, x: 0, y: 150 };
const K2: Kamera = { s: 0.45, x: 420, y: 160 };

const kom = (x: Partial<KomposisiAdegan>): KomposisiAdegan => ({
  lokasi: 'meja',
  mentor: { pose: 'duduk-dengar', ekspresi: 'netral', pandang: 'lawan' },
  nasabah: null,
  pembicara: 'narasi',
  prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'meja' },
  aksi: null,
  pembuka: false,
  ...x,
});
const susun = (k: KomposisiAdegan): SusunanAdegan => susunAdegan(k, ruangSementara(k.lokasi), gambarTokoh);

const SAMBUT_K = kom({ mentor: { pose: 'berdiri-sambut', ekspresi: 'tersenyum', pandang: 'pemain' } });
const SAMBUT = susun(SAMBUT_K);
const DUDUK_K = kom({
  nasabah: { pose: 'duduk', ekspresi: 'kesal', pandang: 'lawan', lewatTelepon: false },
  prop: { kunci: 'meja', kartu: 'tersimpan', telepon: 'meja' },
  aksi: { jenis: 'masuk', kunci: 'auto-1:0:b1-mentor#2' },
});
const DUDUK = susun(DUDUK_K);
const KOSONG = susun(kom({ aksi: { jenis: 'pergi', kunci: 'auto-1:0:akhir-pergi#3' } }));

/** Nilai properti di keyframe terakhir (offset 1) sebuah target. */
function akhir(r: Rencana, target: string, prop: string): unknown[] {
  return r.gerak.filter((g) => g.target === target && g.keyframes.some((k) => prop in k)).map((g) => g.keyframes[g.keyframes.length - 1]![prop]);
}
function awal(r: Rencana, target: string, prop: string): unknown[] {
  return r.gerak.filter((g) => g.target === target && g.keyframes.some((k) => prop in k)).map((g) => g.keyframes[0]![prop]);
}

function periksaKeyframe(r: Rencana) {
  for (const g of r.gerak) {
    assert.ok(g.keyframes.length >= 2, `${r.jenis}/${g.target}: minimal 2 keyframe`);
    assert.equal(g.keyframes[0]!.offset, 0, `${r.jenis}/${g.target}: mulai offset 0`);
    assert.equal(g.keyframes[g.keyframes.length - 1]!.offset, 1, `${r.jenis}/${g.target}: berakhir offset 1`);
    for (let i = 1; i < g.keyframes.length; i++) {
      assert.ok((g.keyframes[i]!.offset as number) >= (g.keyframes[i - 1]!.offset as number), `${r.jenis}/${g.target}: offset menaik`);
    }
  }
}

/** Target yang ada di DOM panggung: elemen komposisi akhir + aktor sementara rencana ini. */
function targetSah(r: Rencana, s: SusunanAdegan): Set<string> {
  const t = new Set(['kamera', 'pintu', 'chip', 'telepon-sisip', ...s.tokoh.map((x) => `tokoh:${x.siapa}`), ...s.prop.map((p) => `prop:${p.id}`)]);
  for (const a of r.aktor) {
    t.add(`x:${a.kunci}`);
    if (a.jenis === 'jalan') for (const c of a.salinan) t.add(`x:${a.kunci}:${c.id}`);
    if (a.jenis === 'adegan') t.add(`x:${a.kunci}:kamera`);
  }
  return t;
}

/** Aktor sementara berakhir tak terlihat; elemen akhir berakhir terlihat & tanpa geser. */
function periksaTanpaHantu(r: Rencana, s: SusunanAdegan) {
  const sah = targetSah(r, s);
  for (const g of r.gerak) assert.ok(sah.has(g.target), `${r.jenis}: target ${g.target} tidak ada di panggung`);
  for (const a of r.aktor) {
    for (const v of akhir(r, `x:${a.kunci}`, 'opacity')) assert.equal(v, 0, `${r.jenis}: aktor ${a.kunci} berakhir tak terlihat`);
  }
  for (const t of [...s.tokoh.map((x) => `tokoh:${x.siapa}`), ...s.prop.map((p) => `prop:${p.id}`), 'chip', 'telepon-sisip']) {
    for (const v of akhir(r, t, 'opacity')) assert.equal(v, 1, `${r.jenis}: ${t} berakhir terlihat`);
    for (const v of akhir(r, t, 'transform')) assert.equal(v, 'translate(0px, 0px)', `${r.jenis}: ${t} berakhir tanpa geser`);
  }
  for (const v of akhir(r, 'pintu', 'transform')) assert.match(String(v), /rotateY\(0deg\)/, `${r.jenis}: pintu berakhir tertutup`);
}

/** Nilai numerik properti pada pecahan u (interpolasi linear; lompatan di offset sama = nilai sesudahnya). */
function nilaiDi(kfs: Keyframe[], prop: string, u: number): number {
  const ks = kfs.filter((k) => prop in k);
  let lalu = ks[0]!;
  for (const k of ks) {
    const o = k.offset as number;
    if (o > u) {
      const po = lalu.offset as number;
      return Number(lalu[prop]) + (Number(k[prop]) - Number(lalu[prop])) * ((u - po) / (o - po));
    }
    lalu = k;
  }
  return Number(lalu[prop]);
}

/** Nilai transform (string) keyframe terakhir dengan offset <= u. */
function nilaiTransform(kfs: Keyframe[], u: number): unknown {
  let v: unknown = kfs[0]!.transform;
  for (const k of kfs) if ((k.offset as number) <= u + 1e-9 && 'transform' in k) v = k.transform;
  return v;
}

/** Geser translate (px keyframe) pada pecahan u: interpolasi linear antar-keyframe (jalur kartu dicuplik linear). */
function geserDi(kfs: Keyframe[], u: number): { x: number; y: number } {
  const ks = kfs.filter((k) => 'transform' in k).map((k) => {
    const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(String(k.transform));
    return { o: k.offset as number, x: m ? Number(m[1]) : 0, y: m ? Number(m[2]) : 0 };
  });
  let lalu = ks[0]!;
  for (const k of ks) {
    if (k.o > u) {
      const f = k.o > lalu.o ? (u - lalu.o) / (k.o - lalu.o) : 1;
      return { x: lalu.x + (k.x - lalu.x) * f, y: lalu.y + (k.y - lalu.y) * f };
    }
    lalu = k;
  }
  return { x: lalu.x, y: lalu.y };
}

/** Opasitas target pada u (tanpa animasi opacity = gaya bawaan). */
function opasitas(r: Rencana, target: string, u: number, bawaan: number): number {
  const g = r.gerak.filter((x) => x.target === target && x.keyframes.some((k) => 'opacity' in k));
  return g.length ? g.reduce((v, x) => v * nilaiDi(x.keyframes, 'opacity', u), 1) : bawaan;
}

/** Semua badan satu tokoh di panggung selama rencana: elemen akhir, pose sementara, pejalan, salinan adegan. */
function badan(r: Rencana, s: SusunanAdegan, siapa: 'mentor' | 'nasabah', u: number): number[] {
  const hasil: number[] = [];
  if (s.tokoh.some((t) => t.siapa === siapa)) hasil.push(opasitas(r, `tokoh:${siapa}`, u, 1));
  for (const a of r.aktor) {
    if (a.jenis === 'tokoh' && a.letak.siapa === siapa) hasil.push(opasitas(r, `x:${a.kunci}`, u, 0));
    if (a.jenis === 'jalan' && siapa === 'nasabah') {
      const wadah = opasitas(r, `x:${a.kunci}`, u, 0);
      for (const c of a.salinan) hasil.push(wadah * opasitas(r, `x:${a.kunci}:${c.id}`, u, 0));
    }
    // Tokoh salinan yang MENYATU (tetap di kursinya: tempat, pose & kamera sama dengan badan di dunia utama) = badan
    // yang sama di bawahnya, bukan badan kedua (keserasiannya diperiksa tes epilog telepon).
    if (a.jenis === 'adegan' && !a.tanpaTokoh && !a.menyatu?.includes(siapa) && a.susunan.tokoh.some((t) => t.siapa === siapa)) hasil.push(opasitas(r, `x:${a.kunci}`, u, 0));
  }
  return hasil;
}

/** Tidak pernah dua badan tokoh yang sama sama-sama > 25 % (dicuplik tiap 5 md). */
function periksaTanpaBadanGanda(r: Rencana, s: SusunanAdegan) {
  for (let t = 0; t <= r.durasi; t += 5) {
    for (const siapa of ['mentor', 'nasabah'] as const) {
      const b = badan(r, s, siapa, t / r.durasi);
      assert.ok(b.filter((o) => o > 0.25).length <= 1, `${r.jenis} t=${t}: ${siapa} tampil ganda (${b.map((o) => o.toFixed(2)).join(', ')})`);
    }
  }
}

test('kf: titik 0 & T ditambahkan, lompatan di waktu sama dipertahankan, easing per segmen', () => {
  const k = kf('opacity', 1000, [[200, 0], [200, 1, 'ease-out'], [600, 0.5]]);
  assert.deepEqual(k.map((x) => x.offset), [0, 0.2, 0.2, 0.6, 1]);
  assert.deepEqual(k.map((x) => x.opacity), [0, 0, 1, 0.5, 0.5]);
  assert.equal(k[2]!.easing, 'ease-out');
});

test('titik jalur mengikuti jarak (bukan jumlah titik) dan skala diinterpolasi', () => {
  const j = [{ titik: { x: 0, y: 0 }, skala: 0.5 }, { titik: { x: 100, y: 0 }, skala: 1 }, { titik: { x: 100, y: 300 }, skala: 2 }];
  assert.deepEqual(titikJalur(j, 0), { titik: { x: 0, y: 0 }, skala: 0.5 });
  assert.deepEqual(titikJalur(j, 1), { titik: { x: 100, y: 300 }, skala: 2 });
  const tengah = titikJalur(j, 0.25);
  assert.equal(tengah.titik.x, 100);
  assert.equal(tengah.titik.y, 0);
});

test('jalan: pose a/b bergantian (tidak pernah keduanya terlihat), berakhir di ujung jalur', () => {
  const j = [{ titik: { x: 1335, y: 600 }, skala: 0.72 }, { titik: { x: 1100, y: 700 }, skala: 1 }];
  const g = gerakJalan(3000, 300, 1750, j, j[0]!.titik);
  for (let t = 300; t < 1750; t += 45) {
    const nilai = (kfs: Keyframe[]) => {
      const u = t / 3000;
      let v = kfs[0]!.opacity as number;
      for (const k of kfs) if ((k.offset as number) <= u) v = k.opacity as number;
      return v;
    };
    assert.equal(nilai(g.a) + nilai(g.b), 1, `t=${t}: tepat satu pose jalan terlihat`);
  }
  assert.equal(g.transform[g.transform.length - 1]!.transform, 'translate(-235px, 100px) scale(1)');
});

test('kedatangan: pintu, jalan, pindah lapisan, duduk, mentor mempersilakan lalu duduk, tombol lewati', () => {
  const r = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1 }, gambarTokoh);
  assert.equal(r.jenis, 'masuk');
  assert.ok(r.durasi >= 2500 && r.durasi <= 3500, `durasi ± 3 dtk (${r.durasi})`);
  assert.equal(r.lewati, true);
  periksaKeyframe(r);
  periksaTanpaHantu(r, DUDUK);
  // Pintu: masih TERTUTUP sampai kamera tiba di bingkai pembuka kedatangan (v5.1: di HP pintu tertutup lalu terbuka
  // terlihat, bukan terbuka selagi kamera masih bergerak), terbuka penuh <= 900 md, Bu Rina muncul di ambang sesudah
  // daun mulai terbuka, lalu pintu menutup. (v5: terbuka 0-550 md.)
  const pintu = r.gerak.find((g) => g.target === 'pintu')!;
  const buka = pintu.keyframes.find((k) => String(k.transform).includes('-78deg'))!;
  const tutupSampai = pintu.keyframes.filter((k) => String(k.transform).includes('rotateY(0deg)') && (k.offset as number) * r.durasi <= JADWAL_MASUK.kameraPintu + 1e-6);
  assert.ok(tutupSampai.some((k) => Math.abs((k.offset as number) * r.durasi - JADWAL_MASUK.kameraPintu) < 1), 'pintu masih tertutup saat kamera tiba di bingkai pembuka');
  assert.ok((buka.offset as number) * r.durasi <= 900, 'pintu terbuka penuh <= 900 md');
  assert.ok(JADWAL_MASUK.jalan[0] > JADWAL_MASUK.pintuBuka[0] + 150 && JADWAL_MASUK.jalan[0] < JADWAL_MASUK.pintuBuka[1], 'Bu Rina muncul saat daun sudah mulai terbuka');
  // Pejalan: salinan jalan-a, jalan-b, berdiri dengan kunci di tangan; mulai di ambang pintu (jalur[0]).
  const jalan = r.aktor.find((a) => a.jenis === 'jalan');
  assert.ok(jalan && jalan.jenis === 'jalan');
  assert.deepEqual(jalan.salinan.map((c) => c.opsi.pose), ['jalan-a', 'jalan-b', 'berdiri']);
  assert.ok(jalan.salinan.every((c) => c.opsi.siapa === 'nasabah' && c.opsi.kunci === true), 'kunci di tangan saat masuk');
  assert.deepEqual(jalan.titik0, ruangSementara('meja').tempat.jalurMasuk[0]!.titik);
  assert.deepEqual(awal(r, 'x:jalan', 'zIndex'), [Z.belakang]);
  assert.deepEqual(akhir(r, 'x:jalan', 'zIndex'), [Z.nasabah]);
  // Miss Raksa: pose menyambut memudar, mempersilakan tampil, lalu duduk (elemen akhir) muncul sesudahnya.
  const silakan = r.aktor.find((a) => a.kunci === 'silakan');
  assert.ok(silakan && silakan.jenis === 'tokoh' && silakan.letak.opsi.pose === 'berdiri-persilakan');
  assert.ok(r.aktor.some((a) => a.kunci === 'lama-mentor'), 'pose menyambut lama memudar');
  const mentorMuncul = r.gerak.find((g) => g.target === 'tokoh:mentor' && g.keyframes.some((k) => 'opacity' in k))!;
  const t1 = mentorMuncul.keyframes.find((k) => k.opacity === 1)!.offset as number;
  const nasabahMuncul = r.gerak.find((g) => g.target === 'tokoh:nasabah' && g.keyframes.some((k) => 'opacity' in k))!;
  const t2 = nasabahMuncul.keyframes.find((k) => k.opacity === 1)!.offset as number;
  assert.ok(t2 * r.durasi >= JADWAL_MASUK.jalan[1], 'Bu Rina duduk sesudah berjalan');
  assert.ok(t1 > t2, 'Miss Raksa duduk sesudah Bu Rina duduk');
  // Kunci diletakkan di meja setelah duduk.
  assert.ok(r.gerak.some((g) => g.target === 'prop:kunci'));
  // Tanpa silang-pudar: pose berdiri hilang tepat saat pose duduk muncul (Bu Rina & Miss Raksa).
  periksaTanpaBadanGanda(r, DUDUK);
  const u = JADWAL_MASUK.duduk[0] / r.durasi;
  assert.equal(opasitas(r, 'tokoh:nasabah', u - 0.001, 1), 0);
  assert.equal(opasitas(r, 'tokoh:nasabah', u, 1), 1);
  const um = JADWAL_MASUK.mentorDuduk[0] / r.durasi;
  assert.equal(opasitas(r, 'x:silakan', um - 0.001, 0), 1);
  assert.equal(opasitas(r, 'x:silakan', um, 0), 0);
  assert.equal(opasitas(r, 'tokoh:mentor', um, 1), 1);
});

test('kedatangan: mentor yang sudah duduk berdiri mempersilakan lalu duduk lagi, tanpa badan ganda', () => {
  const lama = susun(kom({}));
  const r = rencanaMasuk({ lama, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1 }, gambarTokoh);
  periksaKeyframe(r);
  periksaTanpaHantu(r, DUDUK);
  periksaTanpaBadanGanda(r, DUDUK);
  assert.equal(opasitas(r, 'tokoh:mentor', 0, 1), 1, 'pose akhir terlihat sebelum menoleh');
});

test('kedatangan tanpa jalur/pintu (lokasi tanpa pintu) = silang-pudar biasa, tanpa tombol lewati', () => {
  const parkir = susun(kom({ lokasi: 'parkiran', mentor: { pose: 'berdiri', ekspresi: 'netral', pandang: 'lawan' }, nasabah: { pose: 'berdiri', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false } }));
  const r = rencanaMasuk({ lama: null, baru: parkir, kamLama: null, kamBaru: K1 }, gambarTokoh);
  assert.equal(r.lewati, false);
  assert.ok(r.durasi <= 500);
  periksaKeyframe(r);
  periksaTanpaHantu(r, parkir);
});

test('kepergian: berdiri, berjalan ke pintu (hadap kanan; cermin hanya cadangan), keluar, pintu menutup, kursi kosong', () => {
  const r = rencanaPergi({ lama: DUDUK, baru: KOSONG, kamLama: K2, kamBaru: K2, kamPintu: K2, hadapKanan: true });
  assert.equal(r.jenis, 'pergi');
  periksaKeyframe(r);
  periksaTanpaHantu(r, KOSONG);
  periksaTanpaBadanGanda(r, KOSONG);
  assert.ok(r.aktor.some((a) => a.kunci === 'lama-nasabah'), 'pose duduk lama berganti ke pose berdiri');
  const jalan = r.aktor.find((a) => a.jenis === 'jalan');
  assert.ok(jalan && jalan.jenis === 'jalan');
  const langkah = jalan.salinan.filter((c) => c.id !== 'diam');
  assert.ok(langkah.every((c) => !c.cermin && c.opsi.siapa === 'nasabah' && c.opsi.hadap === 'kanan'), 'berjalan ke arah pintu dengan pose hadap kanan (tanpa cermin)');
  const cadangan = rencanaPergi({ lama: DUDUK, baru: KOSONG, kamLama: K2, kamBaru: K2, kamPintu: K2 });
  const jc = cadangan.aktor.find((a) => a.jenis === 'jalan');
  assert.ok(jc && jc.jenis === 'jalan' && jc.salinan.filter((c) => c.id !== 'diam').every((c) => c.cermin && !(c.opsi.siapa === 'nasabah' && c.opsi.hadap)), 'generator tanpa hadap kanan: cermin');
  assert.equal(jalan.salinan.find((c) => c.id === 'diam')!.opsi.pose, 'berdiri-pergi');
  assert.deepEqual(akhir(r, 'x:jalan', 'zIndex'), [Z.belakang], 'di dekat pintu: di belakang meja');
  assert.ok(r.aktor.some((a) => a.kunci === 'lama-kunci'), 'kunci diambil dari meja');
});

const KARTU = susun(kom({
  mentor: { pose: 'duduk-tunjuk', ekspresi: 'serius', pandang: 'bawah' },
  nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'bawah', lewatTelepon: false },
  prop: { kunci: 'meja', kartu: 'meja', telepon: 'meja' },
  aksi: { jenis: 'kartu', kunci: 'auto-1:b4-polis-intro#1@15' },
}));

test('kartu polis muncul di tepi dekat meja di sisi pemain, meluncur ke tengah meja; Miss Raksa menunjuk SESUDAH kartu mendarat', () => {
  const lama = susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'meja', kartu: 'tersimpan', telepon: 'meja' } }));
  const r = rencanaKartu({ lama, baru: KARTU, kamLama: K1, kamBaru: K1 });
  assert.equal(r.durasi, JADWAL_KARTU.total);
  periksaKeyframe(r);
  periksaTanpaHantu(r, KARTU);
  periksaTanpaBadanGanda(r, KARTU);
  const t = ruangSementara('meja').tempat;
  const dx = t.kartuSimpan!.x - t.kartuMeja!.x;
  const dy = t.kartuSimpan!.y - t.kartuMeja!.y;
  const tr = r.gerak.find((g) => g.target === 'prop:kartu' && g.keyframes.some((k) => 'transform' in k))!;
  // Mula-mula sedikit di kiri-bawah titik simpan (arah pemain, kiri kamera), terdorong masuk di tepi dekat sambil muncul.
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(String(tr.keyframes[0]!.transform))!;
  assert.ok(Number(m[1]) < dx && Number(m[2]) > dy, `mulai dari arah pemain: ${tr.keyframes[0]!.transform}`);
  // Selesai muncul masih di tepi dekat, dekat titik simpan (JALUR_KARTU: satu dorongan, belum berbelok naik ke landasan).
  const g = geserDi(tr.keyframes, JADWAL_KARTU.masuk / r.durasi);
  assert.ok(Math.abs(g.x - dx) <= 48 && g.y >= dy - 2, `selesai muncul di dekat titik simpan (tepi dekat meja): ${JSON.stringify(g)} vs ${dx},${dy}`);
  assert.equal(opasitas(r, 'prop:kartu', 0, 1), 0, 'belum terlihat sebelum muncul');
  assert.equal(opasitas(r, 'prop:kartu', JADWAL_KARTU.masuk / r.durasi, 1), 1);
  assert.equal(nilaiTransform(tr.keyframes, JADWAL_KARTU.geser / r.durasi), 'translate(0px, 0px)', 'mendarat di tengah meja');
  assert.ok(JADWAL_KARTU.tunjuk > JADWAL_KARTU.geser, 'Miss Raksa menanggapi kartu yang dibuka pemain: menunjuk sesudah kartu mendarat');
  assert.ok(r.aktor.some((a) => a.kunci === 'lama-mentor'), 'pose mentor lama berganti ke pose menunjuk');
  const u = JADWAL_KARTU.tunjuk / r.durasi;
  assert.equal(opasitas(r, 'x:lama-mentor', u - 0.001, 0), 1);
  assert.equal(opasitas(r, 'tokoh:mentor', u, 1), 1);
  assert.equal(opasitas(r, 'x:lama-mentor', u, 0), 0);
  assert.equal(opasitas(r, 'tokoh:mentor', JADWAL_KARTU.geser / r.durasi, 1), 0, 'belum menunjuk selama kartu bergerak');
});

test('kartu: titik simpan ruang v3 di sisi pemain (tepi dekat meja, kiri kamera, di dalam potongan HP x >= 430)', () => {
  const t = ambilRuang('meja').tempat;
  assert.ok(t.kartuSimpan && t.kartuMeja);
  assert.ok(t.kartuSimpan.x < t.kartuMeja.x && t.kartuSimpan.y > t.kartuMeja.y, `kartu datang dari kiri-depan: ${JSON.stringify(t.kartuSimpan)} -> ${JSON.stringify(t.kartuMeja)}`);
  assert.ok(t.kartuSimpan.x >= 430, 'di dalam potongan kamera HP');
});

// ------------------------------------------------------------------ kartu vs tangan Miss Raksa di meja (piksel)

const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Buffer } } } };
const DIR_PIKSEL = path.join(import.meta.dirname, '../../seni/piksel');
const cachePng = new Map<string, { width: number; height: number; data: Buffer }>();
function bacaPng(url: string) {
  const f = url.startsWith('file:') ? fileURLToPath(url) : path.join(DIR_PIKSEL, path.basename(url.split('?')[0]!));
  let p = cachePng.get(f);
  if (!p) cachePng.set(f, (p = PNG.sync.read(fs.readFileSync(f))));
  return p;
}
type Px = readonly [number, number];

/**
 * Piksel tangan-di-meja sebuah letak tokoh raster (piksel seni DUNIA, kiri-atas tiap piksel): piksel buram potongan
 * atlas di dalam kotak `diAtasMejaPiksel` (lapisan yang digambar DI ATAS kartu). Tokoh skala 1.
 */
function pikselTanganDiMeja(l: Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>): Px[] {
  const p = pikselDari(l.gambar);
  const kotak = kotakDiAtasMeja(l.gambar);
  if (!p || !kotak.length) return [];
  assert.equal(l.skala, 1, 'tokoh piksel skala 1');
  const png = bacaPng(p.url);
  const x0 = (l.titik.x - l.gambar.jangkar.x) / 4;
  const y0 = (l.titik.y - l.gambar.jangkar.y) / 4;
  const hasil: Px[] = [];
  for (let y = 0; y < p.sumber.h; y++) for (let x = 0; x < p.sumber.w; x++) {
    if (!png.data[((p.sumber.y + y) * png.width + p.sumber.x + x) * 4 + 3]) continue;
    if (kotak.some((k) => x * 4 >= k.x && x * 4 < k.x + k.w && y * 4 >= k.y && y * 4 < k.y + k.h)) hasil.push([x0 + x, y0 + y]);
  }
  return hasil;
}

/** Piksel buram kartu (piksel seni relatif kiri-atas PNG) + jangkar (satuan dunia) dari manifest ruang piksel. */
function pikselKartu(): { px: Px[]; jangkar: { x: number; y: number } } {
  const m = JSON.parse(fs.readFileSync(path.join(DIR_PIKSEL, 'ruang.json'), 'utf8')) as { prop: { kartu: { berkas: string; jangkar: { x: number; y: number } } } };
  const png = bacaPng(m.prop.kartu.berkas);
  const px: Px[] = [];
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) if (png.data[(y * png.width + x) * 4 + 3]) px.push([x, y]);
  return { px, jangkar: m.prop.kartu.jangkar };
}

/** Celah (Chebyshev, piksel seni) antara dua himpunan piksel satuan; kartu boleh di posisi pecahan. < 0 = beririsan. */
function celahPiksel(a: readonly Px[], ax: number, ay: number, b: readonly Px[]): number {
  let min = Infinity;
  for (const [x, y] of a) {
    const X = ax + x, Y = ay + y;
    for (const [bx, by] of b) {
      const d = Math.max(bx - (X + 1), X - (bx + 1), by - (Y + 1), Y - (by + 1));
      if (d < min) min = d;
    }
  }
  return min;
}

/**
 * Kartu tidak pernah melintas di BAWAH tangan Miss Raksa yang bertumpu di meja (lapisan di atas meja digambar sesudah
 * prop): dicuplik tiap 5 md selama kartu bergerak, celah piksel kartu ke piksel tangan-di-meja >= 1 piksel seni
 * (tidak beririsan, tidak bersentuhan) untuk setiap badan Miss Raksa yang terlihat selain frame tunjuk (pose akhir:
 * telunjuk sengaja di atas kartu yang sudah mendarat).
 */
function periksaKartuLewatTangan(r: Rencana, baru: SusunanAdegan, lain: readonly Pick<LetakTokoh, 'gambar' | 'titik' | 'skala'>[] = []) {
  const kartu = baru.prop.find((p) => p.id === 'kartu')!;
  const K = pikselKartu();
  const tr = r.gerak.find((g) => g.target === 'prop:kartu' && g.keyframes.some((k) => 'transform' in k))!;
  const badan: { nama: string; px: Px[]; op: (u: number) => number }[] = [];
  for (const a of r.aktor) {
    if (a.jenis === 'tokoh' && a.letak.siapa === 'mentor') badan.push({ nama: `${a.kunci} ${pikselDari(a.letak.gambar)?.sumber.x},${pikselDari(a.letak.gambar)?.sumber.y}`, px: pikselTanganDiMeja(a.letak), op: (u) => opasitas(r, `x:${a.kunci}`, u, 0) });
  }
  const akhirMentor = cariTokoh(baru, 'mentor');
  assert.ok(akhirMentor && akhirMentor.opsi.pose === 'duduk-tunjuk');
  for (const [i, l] of lain.entries()) badan.push({ nama: `pose lain #${i}`, px: pikselTanganDiMeja(l), op: () => 1 });
  assert.ok(badan.some((b) => b.px.length > 50), 'pose sebelum kartu punya tangan di meja (uji bermakna)');
  let min = Infinity;
  let di = '';
  for (let t = 0; t <= r.durasi; t += 5) {
    const u = t / r.durasi;
    if (opasitas(r, 'prop:kartu', u, 1) <= 0.02) continue;
    const g = geserDi(tr.keyframes, u);
    const kx = (kartu.titik.x + g.x * kartu.skala - K.jangkar.x) / 4;
    const ky = (kartu.titik.y + g.y * kartu.skala - K.jangkar.y) / 4;
    for (const b of badan) {
      if (b.op(u) <= 0.02 || !b.px.length) continue;
      const c = celahPiksel(K.px, kx, ky, b.px);
      if (c < min) { min = c; di = `t=${t} ${b.nama} kartu@${(kx * 4).toFixed(1)},${(ky * 4).toFixed(1)}`; }
    }
  }
  assert.ok(min >= 0.99, `${r.jenis}: kartu melintas di bawah/menyentuh tangan Miss Raksa di meja (celah ${min.toFixed(2)} piksel seni, ${di})`);
  return min;
}

test('kartu (ruang & tokoh PIKSEL): tidak melintas di bawah tangan Miss Raksa yang bertumpu di meja, bingkai demi bingkai', () => {
  const R = ambilRuang('meja');
  const susunP = (k: KomposisiAdegan): SusunanAdegan => susunAdegan(k, R, gambarTokoh);
  const komBaru = kom({
    mentor: { pose: 'duduk-tunjuk', ekspresi: 'serius', pandang: 'bawah' },
    nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'bawah', lewatTelepon: false },
    prop: { kunci: 'meja', kartu: 'meja', telepon: 'meja' },
    aksi: { jenis: 'kartu', kunci: 'auto-1:b4-polis-intro#1@15' },
  });
  const baru = susunP(komBaru);
  assert.ok(pikselDari(cariTokoh(baru, 'mentor')!.gambar), 'Miss Raksa raster (atlas piksel) di uji ini');
  assert.deepEqual(R.tempat.kartuSimpan, { x: 640, y: 748 });
  // Semua frame duduk Miss Raksa selain tunjuk (dengar/jelaskan x arah pandang), di kursinya: jalur aman untuk pose
  // sebelum kartu mana pun.
  const lain: LetakTokoh[] = [];
  const dilihat = new Set<string>();
  for (const pose of ['duduk-dengar', 'duduk-jelaskan'] as const) {
    for (const pandang of ['lawan', 'pemain', 'bawah', 'depan'] as const) {
      const m = cariTokoh(susunP(kom({ mentor: { pose, ekspresi: 'netral', pandang } })), 'mentor');
      const p = m && pikselDari(m.gambar);
      if (!m || !p || dilihat.has(`${p.sumber.x},${p.sumber.y}`)) continue;
      dilihat.add(`${p.sumber.x},${p.sumber.y}`);
      lain.push(m);
    }
  }
  assert.ok(dilihat.size >= 3, `frame duduk dengar/jelaskan kiri & kanan: ${[...dilihat].join(' ')}`);
  // 1) Di tempat (mendengar -> menunjuk).
  const lama = susunP(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'meja', kartu: 'tersimpan', telepon: 'meja' } }));
  const r1 = rencanaKartu({ lama, baru, kamLama: K1, kamBaru: K1 });
  periksaKeyframe(r1);
  periksaKartuLewatTangan(r1, baru, lain);
  // 2) Sesudah pindah lokasi (parkiran -> meja): pose sebelum kartu = mendengar di kursinya.
  const parkir = susunAdegan(kom({
    lokasi: 'parkiran', mentor: { pose: 'berdiri', ekspresi: 'tersenyum', pandang: 'lawan' },
    nasabah: { pose: 'berdiri', ekspresi: 'netral', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' },
  }), ambilRuang('parkiran'), gambarTokoh);
  const r2 = rencanaKartu({ lama: parkir, baru, kamLama: K2, kamBaru: K1 }, gambarTokoh);
  periksaKeyframe(r2);
  assert.ok(r2.aktor.some((a) => a.kunci === 'pra-mentor'));
  periksaKartuLewatTangan(r2, baru);
  // 3) Detektor bermakna: jalur yang lewat TEPAT di bawah tangan yang bertumpu di meja (pusat piksel tangan pose
  //    sebelum kartu) tertangkap. v4: jalur LAMA (lurus, lengkung tipis) melintas di bawah jari; v5 (komposisi meja)
  //    Miss Raksa duduk 4 piksel seni lebih tinggi sehingga jalur lama kini lewat di bawah tangannya dengan celah, jadi
  //    kontrolnya memakai pusat tangan langsung.
  const dx = R.tempat.kartuSimpan!.x - R.tempat.kartuMeja!.x;
  const dy = R.tempat.kartuSimpan!.y - R.tempat.kartuMeja!.y;
  const T = r1.durasi;
  const pra = r1.aktor.find((a) => a.jenis === 'tokoh' && a.letak.siapa === 'mentor');
  assert.ok(pra && pra.jenis === 'tokoh', 'pose Miss Raksa sebelum kartu ada di rencana');
  const tangan = pikselTanganDiMeja(pra.letak);
  const hx = (tangan.reduce((a, p) => a + p[0], 0) / tangan.length) * 4 + 2 - R.tempat.kartuMeja!.x;
  const hy = (tangan.reduce((a, p) => a + p[1], 0) / tangan.length) * 4 + 2 - R.tempat.kartuMeja!.y;
  const lamaJalur: Rencana = { ...r1, gerak: [
    ...r1.gerak.filter((g) => !(g.target === 'prop:kartu' && g.keyframes.some((k) => 'transform' in k))),
    { target: 'prop:kartu', keyframes: kf('transform', T, [[0, `translate(${dx - 14}px, ${dy + 12}px)`], [JADWAL_KARTU.masuk, `translate(${dx}px, ${dy}px)`], [(JADWAL_KARTU.masuk + JADWAL_KARTU.geser) / 2, `translate(${hx}px, ${hy}px)`], [JADWAL_KARTU.geser, 'translate(0px, 0px)']]) },
  ] };
  assert.throws(() => periksaKartuLewatTangan(lamaJalur, baru), /melintas di bawah/);
});

test('kartu di baris yang juga pindah lokasi (parkiran -> meja): larut dulu, lalu kartu meluncur dari sisi pemain & Miss Raksa menunjuk sesudah mendarat', () => {
  const parkir = susun(kom({
    lokasi: 'parkiran', mentor: { pose: 'berdiri', ekspresi: 'tersenyum', pandang: 'lawan' },
    nasabah: { pose: 'berdiri', ekspresi: 'netral', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' },
  }));
  const r = rencanaKartu({ lama: parkir, baru: KARTU, kamLama: K2, kamBaru: K1 }, gambarTokoh);
  const D = JADWAL_KARTU.larut;
  assert.equal(r.durasi, D + JADWAL_KARTU.total);
  periksaKeyframe(r);
  periksaTanpaHantu(r, KARTU);
  periksaTanpaBadanGanda(r, KARTU);
  // Salinan adegan parkiran di atas, habis tepat saat larut selesai; tokoh parkiran TIDAK muncul di dunia meja.
  const lamaAdegan = r.aktor.find((a) => a.jenis === 'adegan');
  assert.ok(lamaAdegan && lamaAdegan.jenis === 'adegan' && lamaAdegan.susunan === parkir && !lamaAdegan.tanpaTokoh);
  assert.equal(opasitas(r, 'x:lama', D / r.durasi, 0), 0);
  assert.ok(!r.aktor.some((a) => a.jenis === 'tokoh' && a.letak.opsi.pose === 'berdiri'), 'tanpa pose berdiri parkiran di meja');
  // Kartu belum terlihat / belum bergerak selama larut; mendarat sesudahnya.
  assert.equal(opasitas(r, 'prop:kartu', (D - 5) / r.durasi, 1), 0);
  const tr = r.gerak.find((g) => g.target === 'prop:kartu' && g.keyframes.some((k) => 'transform' in k))!;
  assert.equal(tr.keyframes[0]!.transform, tr.keyframes.find((k) => Math.abs((k.offset as number) - D / r.durasi) < 1e-9)!.transform, 'kartu diam di laci selama larut');
  // Pose sebelum kartu: Miss Raksa mendengar di kursinya, lalu menunjuk sesudah kartu mendarat.
  const pra = r.aktor.find((a) => a.kunci === 'pra-mentor');
  assert.ok(pra && pra.jenis === 'tokoh' && pra.letak.opsi.pose === 'duduk-dengar');
  const ut = (D + JADWAL_KARTU.tunjuk) / r.durasi;
  assert.equal(opasitas(r, 'tokoh:mentor', ut - 0.001, 1), 0);
  assert.equal(opasitas(r, 'tokoh:mentor', ut, 1), 1);
  assert.ok(!r.gerak.some((g) => g.target === 'kamera'), 'kamera adegan baru tidak meluncur dari kamera parkiran');
});

test('ganti antarbaris: ekspresi/pose di tempat = langsung berganti + angguk <= 240 ms (tanpa badan lama); tidak berubah = tanpa rencana', () => {
  const a = susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false } }));
  const b = susun(kom({ mentor: { pose: 'duduk-jelaskan', ekspresi: 'serius', pandang: 'lawan' }, nasabah: { pose: 'duduk', ekspresi: 'lega', pandang: 'lawan', lewatTelepon: false } }));
  const r = rencanaGanti({ lama: a, baru: b, kamLama: K1, kamBaru: K1 })!;
  assert.ok(r.durasi <= 250);
  periksaKeyframe(r);
  periksaTanpaHantu(r, b);
  periksaTanpaBadanGanda(r, b);
  assert.equal(r.aktor.length, 0, 'tanpa salinan pose lama (tidak ada silang-pudar)');
  const angguk = r.gerak.find((g) => g.target === 'tokoh:nasabah')!;
  assert.ok((angguk.keyframes.find((k) => k.transform === 'translate(0px, 0px)')!.offset as number) * r.durasi <= 240, 'angguk selesai <= 240 md');
  // Pindah tempat (berdiri -> duduk): tukar dengan antisipasi, tetap tanpa badan ganda.
  const berdiri = susun(kom({ mentor: { pose: 'berdiri', ekspresi: 'netral', pandang: 'lawan' } }));
  const g = rencanaGanti({ lama: berdiri, baru: a, kamLama: K1, kamBaru: K1 })!;
  periksaKeyframe(g);
  periksaTanpaHantu(g, a);
  periksaTanpaBadanGanda(g, a);
  assert.ok(g.aktor.some((x) => x.kunci === 'lama-mentor'));
  assert.equal(rencanaGanti({ lama: a, baru: susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false }, pembicara: 'mentor' })), kamLama: K1, kamBaru: K1 }), null, 'ganti pembicara saja = tanpa rencana');
});

test('epilog telepon: kursi kosong, sisipan panggilan muncul, Bu Rina tidak duduk di kantor', () => {
  const a = susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false } }));
  const b = susun(kom({ lokasi: 'telepon', mentor: { pose: 'telepon', ekspresi: 'netral', pandang: 'depan' }, nasabah: { pose: 'telepon', ekspresi: 'kesal', pandang: 'depan', lewatTelepon: true }, prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'tangan' } }));
  assert.equal(b.tokoh.some((t) => t.siapa === 'nasabah'), false);
  const r = rencanaPindah({ lama: a, baru: b, kamLama: K1, kamBaru: K1 });
  periksaKeyframe(r);
  periksaTanpaHantu(r, b);
  periksaTanpaBadanGanda(r, b);
  const g = rencanaGanti({ lama: a, baru: b, kamLama: K1, kamBaru: K1 })!;
  assert.ok(g.gerak.some((x) => x.target === 'telepon-sisip'), 'sisipan panggilan memudar masuk');
  periksaTanpaHantu(g, b);
});

test('pindah lokasi di ruang yang sama (meja -> telepon): Miss Raksa tetap di kursinya, tidak ikut larut, pose ditukar saat larut selesai', () => {
  const a = susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false } }));
  const b = susun(kom({ lokasi: 'telepon', mentor: { pose: 'telepon', ekspresi: 'netral', pandang: 'depan' }, nasabah: { pose: 'telepon', ekspresi: 'kesal', pandang: 'depan', lewatTelepon: true }, prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'tangan' } }));
  const D = 450;
  for (const [kamLama, kamBaru] of [[K1, K1], [K2, K1]] as const) {
    const r = rencanaPindah({ lama: a, baru: b, kamLama, kamBaru });
    periksaKeyframe(r);
    periksaTanpaHantu(r, b);
    periksaTanpaBadanGanda(r, b);
    const salinan = r.aktor.find((x) => x.jenis === 'adegan');
    assert.ok(salinan && salinan.jenis === 'adegan' && salinan.menyatu?.includes('mentor'), 'Miss Raksa di salinan menyatu dengan badannya di dunia utama');
    assert.ok(r.durasi > D, `tukar pose sesudah larut (${r.durasi} md)`);
    // Tanpa celup: di setiap saat tepat satu badan Miss Raksa di dunia utama terlihat PENUH, dan selama salinan masih
    // terlihat badan itu = pose lama (sama dengan pose di salinan) -> komposit selalu 100 %.
    for (let t = 0; t <= r.durasi; t += 5) {
      const u = t / r.durasi;
      const lama = opasitas(r, 'x:lama-mentor', u, 0);
      const akhirnya = opasitas(r, 'tokoh:mentor', u, 1);
      assert.equal(lama + akhirnya, 1, `t=${t}: tepat satu badan Miss Raksa, penuh`);
      if (opasitas(r, 'x:lama', u, 0) > 0) assert.equal(lama, 1, `t=${t}: selama salinan terlihat, pose lama yang tampil`);
    }
    // Pesawat telepon lengkap (gagang di meja) bertahan sampai tukar; sesudahnya pesawat tanpa gagang (gagang di tangan).
    assert.ok(r.aktor.some((x) => x.jenis === 'prop' && x.kunci === 'lama-prop-telepon' && x.prop.tempat === 'meja'));
    assert.equal(opasitas(r, 'x:lama-prop-telepon', (D - 5) / r.durasi, 0), 1);
    assert.equal(opasitas(r, 'prop:telepon', (D - 5) / r.durasi, 1), 0);
    assert.equal(opasitas(r, 'prop:telepon', D / r.durasi, 1), 1);
    assert.equal(opasitas(r, 'x:lama-prop-telepon', D / r.durasi, 0), 0);
    const lamaMentor = r.aktor.find((x) => x.kunci === 'lama-mentor');
    assert.ok(lamaMentor && lamaMentor.jenis === 'tokoh' && lamaMentor.letak.tanda === cariTokoh(a, 'mentor')!.tanda, 'pose lama = pose Miss Raksa di salinan');
    // Kamera dunia utama = kamera salinan selama larut (berimpit), lalu meluncur ke kamera baru bila berbeda.
    const kam = r.gerak.find((x) => x.target === 'kamera');
    if (kamLama === kamBaru) assert.equal(kam, undefined, 'kamera sama: tanpa luncur');
    else {
      assert.ok(kam, 'kamera berbeda: luncur sesudah larut');
      assert.equal(nilaiTransform(kam.keyframes, 0), transformKamera(kamLama));
      assert.equal(nilaiTransform(kam.keyframes, D / r.durasi), transformKamera(kamLama));
      assert.equal(kam.keyframes[kam.keyframes.length - 1]!.transform, transformKamera(kamBaru));
    }
  }
  // Pose sama di kedua lokasi: tanpa aktor pose lama & tanpa animasi badan (sudah benar sejak awal).
  const c = susun(kom({ lokasi: 'telepon', nasabah: { pose: 'telepon', ekspresi: 'kesal', pandang: 'depan', lewatTelepon: true }, prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'meja' } }));
  const r2 = rencanaPindah({ lama: a, baru: c, kamLama: K1, kamBaru: K1 });
  assert.equal(r2.durasi, D);
  assert.ok(!r2.aktor.some((x) => x.kunci === 'lama-mentor'));
  assert.ok(!r2.gerak.some((x) => x.target === 'tokoh:mentor'), 'badan Miss Raksa tidak dianimasikan');
  periksaTanpaBadanGanda(r2, c);
  // Lokasi lain (parkiran -> meja: tempat berbeda) tetap larut biasa: tokoh baru menunggu salinan <= 25 %.
  const parkir = susun(kom({ lokasi: 'parkiran', mentor: { pose: 'berdiri', ekspresi: 'netral', pandang: 'lawan' } }));
  const r3 = rencanaPindah({ lama: parkir, baru: a, kamLama: K2, kamBaru: K1 });
  assert.equal(opasitas(r3, 'tokoh:mentor', (LARUT_TOKOH * r3.durasi - 1) / r3.durasi, 1), 0);
  assert.ok(!(r3.aktor.find((x) => x.jenis === 'adegan') as { menyatu?: string[] }).menyatu);
});

test('tukar berdiri <-> duduk di tempat berbeda: jarak mendatar dibagi dua (pose lama bergeser, pose baru meluncur masuk), tanpa lompatan', () => {
  const duduk = susun(kom({}));
  const t = ruangSementara('meja').tempat;
  // Miss Raksa berdiri 60 satuan di kiri kursinya (seperti geometri ruang final).
  const berdiri = { ...susun(kom({ mentor: { pose: 'berdiri-persilakan', ekspresi: 'tersenyum', pandang: 'lawan' } })) };
  const mD = cariTokoh(duduk, 'mentor')!;
  const mB = { ...cariTokoh(berdiri, 'mentor')!, titik: { x: mD.titik.x - 60, y: t.mentorBerdiri.y } };
  const naik = arahTukar(mD, mB);
  assert.deepEqual(naik.ke, [-30, -8], 'duduk -> berdiri: pose duduk bergeser 30 ke kiri sambil terangkat');
  assert.deepEqual(naik.dari, [30, 14], 'pose berdiri muncul 30 di kanan tempatnya lalu meluncur masuk');
  const turun = arahTukar(mB, mD);
  assert.deepEqual(turun.ke, [30, 10]);
  assert.deepEqual(turun.dari, [-30, -16]);
  // Di titik tukar kedua badan berada di posisi dunia yang sama (mendatar).
  assert.equal(mD.titik.x + naik.ke![0], mB.titik.x + naik.dari[0]);
  assert.equal(mB.titik.x + turun.ke![0], mD.titik.x + turun.dari[0]);
  // Tempat sama: angguk kecil saja (tanpa geser mendatar).
  assert.deepEqual(arahTukar(mD, mD), { dari: [0, -4], lamaMasuk: 160 });
});

test('penggal: tepat satu badan terlihat, antisipasi di akhir penggal, menetap ke posisi di awal penggal berikutnya', () => {
  const g = gerakPenggal(1000, [
    { target: 'x:a', t0: 0, t1: 400, skala: 1, ke: [0, 10], lamaKeluar: 100 },
    { target: 'x:b', t0: 400, t1: 700, skala: 1, dari: [0, -16], lamaMasuk: 200 },
    { target: 'tokoh:c', t0: 700, t1: 1000, skala: 2, dari: [0, 8] },
  ]);
  const op = (t: string, u: number) => nilaiDi(g.find((x) => x.target === t && x.keyframes.some((k) => 'opacity' in k))!.keyframes, 'opacity', u);
  for (let t = 0; t <= 1000; t += 5) {
    const u = t / 1000;
    assert.equal(op('x:a', u) + op('x:b', u) + op('tokoh:c', u), 1, `t=${t}: tepat satu badan`);
  }
  const trA = g.find((x) => x.target === 'x:a' && x.keyframes.some((k) => 'transform' in k))!.keyframes;
  assert.equal(trA.find((k) => k.offset === 0.4)!.transform, 'translate(0px, 10px)');
  const trC = g.find((x) => x.target === 'tokoh:c' && x.keyframes.some((k) => 'transform' in k))!.keyframes;
  assert.equal(trC[trC.length - 1]!.transform, 'translate(0px, 0px)', 'badan akhir berakhir tanpa geser');
  assert.equal(trC.find((k) => k.offset === 0.7)!.transform, 'translate(0px, 4px)', 'geser dalam satuan dunia (dibagi skala)');
});

test('pembuka: dorongan kamera ± 1,65 dtk + larut ± 0,45 dtk, eksterior opsional menambah 1,3 dtk, bisa dilewati', () => {
  const luar = susun(kom({ lokasi: 'pintu-luar', mentor: null }));
  const r = rencanaPembuka(luar, K2, K1, null);
  assert.equal(r.durasi, 2100);
  assert.equal(r.lewati, true);
  periksaKeyframe(r);
  assert.deepEqual(akhir(r, 'x:pembuka', 'opacity'), [0]);
  const e = rencanaPembuka(luar, K2, K1, { nama: 'Wisma BSG', aset: '/x.webp' });
  assert.equal(e.durasi, 3400);
  assert.deepEqual(akhir(e, 'x:eksterior', 'opacity'), [0]);
  periksaKeyframe(e);
});

// ------------------------------------------------------------------ pemanas cache seni (panas.ts)

test('komposisiBerikut: pratinjau murni sesudah Lanjut / tiap pilihan tersedia; state tidak berubah', () => {
  const ep = EPISODE_AUTO_1;
  const s0 = stateAwal(ep);
  const salinan = salinJson(s0);
  const b = komposisiBerikut(ep, s0);
  assert.deepEqual(s0, salinan, 'state tidak diubah');
  assert.equal(b.length, 1);
  assert.deepEqual(b[0], adeganKini(ep, jalankan(ep, s0, { jenis: 'lanjut' })));
  assert.equal(b[0]!.aksi?.jenis, 'masuk', 'baris berikutnya membawa kedatangan');
  const pilih = majuSampaiKeputusan(ep, s0);
  const node = ep.node[pilih.node];
  assert.equal(node?.jenis, 'pilihan');
  const bp = komposisiBerikut(ep, pilih);
  assert.ok(bp.length >= 2 && node?.jenis === 'pilihan' && bp.length <= node.pilihan.length, `satu komposisi per pilihan (${bp.length})`);
});

test('kunciOpsi: tidak bergantung urutan properti; false/undefined = tidak ada', () => {
  assert.equal(kunciOpsi({ siapa: 'nasabah', pose: 'duduk', ekspresi: 'cemas' }), kunciOpsi({ ekspresi: 'cemas', pose: 'duduk', siapa: 'nasabah', kunci: false }));
  assert.notEqual(kunciOpsi({ siapa: 'nasabah', pose: 'duduk', ekspresi: 'cemas' }), kunciOpsi({ siapa: 'nasabah', pose: 'duduk', ekspresi: 'cemas', kedip: true }));
});

test('opsiPanas: memuat SEMUA gambar yang diminta transisi kedatangan sungguhan (pose akhir, rencana, pejalan, kedip)', () => {
  const ep = EPISODE_AUTO_1;
  const s0 = stateAwal(ep);
  const kLama = adeganKini(ep, s0);
  const lama = susunAdegan(kLama, ambilRuang(kLama.lokasi), gambarTokoh);
  const [kBaru] = komposisiBerikut(ep, s0);
  const panas = opsiPanas(lama, kBaru!, 390, 292, { gerak: true, hadapKanan: () => true });
  const kunci = new Set(panas.map(kunciOpsi));
  // Permintaan sungguhan: susunan baru + pabrik rencana dengan penggambar pencatat, salinan pejalan, varian kedip.
  const diminta: OpsiGambar[] = [];
  const catat = (o: OpsiGambar & { id?: string }) => { const { id: _id, ...x } = o; void _id; diminta.push(x); return gambarTokoh(o); };
  const baru = susunAdegan(kBaru!, ambilRuang(kBaru!.lokasi), catat);
  const r = pabrikTransisi({ lama, baru, aksiBaru: true, hadapKanan: () => true, gambar: catat })!(390, 292)!;
  assert.equal(r.jenis, 'masuk');
  for (const a of r.aktor) if (a.jenis === 'jalan') diminta.push(...a.salinan.map((c) => c.opsi));
  for (const l of baru.tokoh) diminta.push({ ...l.opsi, kedip: true });
  const kurang = diminta.filter((o) => !kunci.has(kunciOpsi(o)));
  assert.deepEqual(kurang, [], 'tidak ada gambar yang terlewat pemanasan');
  const pose = new Set(panas.map((o) => `${o.siapa}:${o.pose}`));
  for (const p of ['nasabah:jalan-a', 'nasabah:jalan-b', 'nasabah:berdiri', 'nasabah:duduk', 'mentor:berdiri-persilakan']) assert.ok(pose.has(p), p);
  // Gerak mati: hanya pose akhir (tanpa pose rencana, tanpa kedip).
  const diam = opsiPanas(lama, kBaru!, 390, 292, { gerak: false, hadapKanan: () => true });
  assert.ok(diam.every((o) => !o.kedip && !o.pose.startsWith('jalan')), 'gerak mati: tanpa pose jalan / kedip');
  assert.deepEqual(new Set(diam.map((o) => o.siapa)), new Set(baru.tokoh.map((t) => t.siapa)));
});

test('opsiPanas: epilog telepon memanaskan potret sisipan (versi kecil sesuai aturan ukuran)', () => {
  const a = susun(kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false } }));
  const k = kom({ lokasi: 'telepon', mentor: { pose: 'telepon', ekspresi: 'netral', pandang: 'depan' }, nasabah: { pose: 'telepon', ekspresi: 'kesal', pandang: 'depan', lewatTelepon: true }, prop: { kunci: 'tersimpan', kartu: 'tersimpan', telepon: 'tangan' } });
  const o = opsiPanas(a, k, 390, 292, { gerak: true, hadapKanan: () => true, sisipanKecil: true });
  assert.ok(o.some((x) => x.siapa === 'nasabah' && x.pose === 'telepon' && x.ekspresi === 'kesal' && x.kecil === true));
  assert.ok(o.some((x) => x.siapa === 'mentor' && x.pose === 'telepon' && !x.kedip));
});

// ------------------------------------------------------------------ putaran 4: aksi basi, bingkai duduk-turun, kartu episode

test('pabrikTransisi: aksi dari komposisi KINI, bukan dari susunan yang dimemo (baris beraksi dengan gambar sama tetap memutar aksinya)', () => {
  // Panggung memo susunan pada tanda gambar (lokasi, tokoh, prop) TANPA aksi: baris beraksi yang gambarnya sama dengan
  // baris sebelumnya mendapat susunan LAMA (aksi null). Aksi dioper tersendiri.
  const k1 = kom({ nasabah: { pose: 'duduk', ekspresi: 'cemas', pandang: 'lawan', lewatTelepon: false }, prop: { kunci: 'meja', kartu: 'meja', telepon: 'meja' } });
  const k2: KomposisiAdegan = { ...k1, aksi: { jenis: 'kartu', kunci: 'auto-1:x#1@99' } };
  const memo = susun(k1);
  const g = gambarTokoh;
  assert.equal(pabrikTransisi({ lama: memo, baru: memo, aksiBaru: true, hadapKanan: () => false, gambar: g }), null, 'tanpa aksi eksplisit: susunan basi = tanpa rencana (perilaku lama)');
  const p = pabrikTransisi({ lama: memo, baru: memo, aksi: k2.aksi, aksiBaru: true, hadapKanan: () => false, gambar: g });
  assert.ok(p, 'aksi dari komposisi kini: rencana dibuat');
  assert.equal(p(1280, 528)?.jenis, 'kartu');
  // Aksi sudah dilihat (aksiBaru false) atau komposisi kini tanpa aksi: tidak diputar.
  assert.equal(pabrikTransisi({ lama: memo, baru: memo, aksi: k2.aksi, aksiBaru: false, hadapKanan: () => false, gambar: g }), null);
  assert.equal(pabrikTransisi({ lama: memo, baru: susun(k2), aksi: null, aksiBaru: true, hadapKanan: () => false, gambar: g }), null);
});

/**
 * Penggambar uji yang mendukung `duduk-turun`: gambar berdiri dengan kepala lebih rendah & condong ke kiri. `pegang` =
 * frame antara itu masih menggambar kunci (raster `kunciTergambar`, seperti atlas Bu Rina: kunci di lutut).
 */
const buatGambarTurun = (pegang: boolean) => (o: Parameters<typeof gambarTokoh>[0]) => {
  if (o.siapa === 'nasabah' && o.pose === 'duduk-turun') {
    const g = gambarTokoh({ ...o, pose: 'berdiri' });
    return { ...g, svg: g.svg + '<!--turun-->', kepala: { x: g.kepala.x - 40, y: g.kepala.y + 230 }, kunciTergambar: pegang };
  }
  return gambarTokoh(o);
};
const gambarTurun = buatGambarTurun(false);

test('kedatangan dengan bingkai antara: berdiri -> duduk-turun (± 140 md) -> duduk, satu badan, kunci ke meja bersama duduk-turun', () => {
  const r = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1, dudukTurun: true }, gambarTurun);
  periksaKeyframe(r);
  periksaTanpaHantu(r, DUDUK);
  periksaTanpaBadanGanda(r, DUDUK);
  const turun = r.aktor.find((a) => a.kunci === 'turun');
  assert.ok(turun && turun.jenis === 'tokoh' && turun.letak.opsi.pose === 'duduk-turun');
  const n = cariTokoh(DUDUK, 'nasabah')!;
  const ujung = ruangSementara('meja').tempat.jalurMasuk.at(-1)!;
  assert.equal(turun.letak.skala, ujung.skala, 'skala pose berdiri');
  assert.equal(turun.letak.opsi.siapa === 'nasabah' && !!turun.letak.opsi.kunci, n.opsi.siapa === 'nasabah' && !!n.opsi.kunci, 'kunci seperti pose duduk');
  const t1 = JADWAL_MASUK.duduk[0];
  const t2 = t1 + TAHAN_TURUN;
  assert.ok(TAHAN_TURUN >= 120 && TAHAN_TURUN <= 160, 'tahan 120-160 md supaya terbaca');
  const u = (t: number) => t / r.durasi;
  // Berdiri (pejalan) sampai t1, duduk-turun t1..t2, duduk sejak t2.
  assert.equal(opasitas(r, 'x:jalan', u(t1 - 1), 0), 1);
  assert.equal(opasitas(r, 'x:jalan', u(t1), 0), 0);
  assert.equal(opasitas(r, 'x:turun', u(t1), 0), 1);
  assert.equal(opasitas(r, 'x:turun', u(t2 - 1), 0), 1);
  assert.equal(opasitas(r, 'x:turun', u(t2), 0), 0);
  assert.equal(opasitas(r, 'tokoh:nasabah', u(t2 - 1), 1), 0);
  assert.equal(opasitas(r, 'tokoh:nasabah', u(t2), 1), 1);
  // Kunci mulai tampil di meja bersama pose duduk-turun (tangan sudah melepasnya).
  assert.equal(opasitas(r, 'prop:kunci', u(t1 - 1), 1), 0);
  assert.equal(opasitas(r, 'prop:kunci', u(t1 + 60), 1), 1);
  // Frame antara raster yang MASIH memegang kunci (atlas Bu Rina: kunci di lutut): kunci meja baru tampil bersama pose
  // duduk, jadi tidak pernah ada dua kunci (lutut + meja).
  const rp = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1, dudukTurun: true }, buatGambarTurun(true));
  if (rp.aktor.some((a) => a.kunci === 'turun' && a.jenis === 'tokoh' && pikselDari(a.letak.gambar))) {
    assert.equal(opasitas(rp, 'prop:kunci', u(t2 - 1), 1), 0, 'kunci meja belum tampil selama duduk-turun memegang kunci');
    assert.equal(opasitas(rp, 'prop:kunci', u(t2 + 60), 1), 1, 'kunci meja tampil bersama pose duduk');
  }
  // Telapak di titik berdiri atau digeser ke arah kursi (di antara keduanya).
  assert.ok(turun.letak.titik.x <= Math.max(ujung.titik.x, n.titik.x) && turun.letak.titik.x >= Math.min(ujung.titik.x, n.titik.x));
  assert.equal(turun.letak.titik.y, ujung.titik.y);
  // Tanpa dukungan generator: tukar seketika seperti sebelumnya (tanpa aktor antara).
  const cadangan = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1 }, gambarTurun);
  assert.ok(!cadangan.aktor.some((a) => a.kunci === 'turun'));
  assert.equal(opasitas(cadangan, 'tokoh:nasabah', u(t1), 1), 1);
});

test('kepergian dengan bingkai antara: duduk -> duduk-turun -> berdiri berbalik, satu badan, kunci diambil saat bangkit', () => {
  const r = rencanaPergi({ lama: DUDUK, baru: KOSONG, kamLama: K2, kamBaru: K2, kamPintu: K2, hadapKanan: true, dudukTurun: true }, gambarTurun);
  periksaKeyframe(r);
  periksaTanpaHantu(r, KOSONG);
  periksaTanpaBadanGanda(r, KOSONG);
  const turun = r.aktor.find((a) => a.kunci === 'turun');
  assert.ok(turun && turun.jenis === 'tokoh' && turun.letak.opsi.pose === 'duduk-turun');
  const b0 = JADWAL_PERGI.berdiri[0];
  const b1 = b0 + TAHAN_TURUN;
  const u = (t: number) => t / r.durasi;
  assert.equal(opasitas(r, 'x:lama-nasabah', u(b0 - 1), 0), 1);
  assert.equal(opasitas(r, 'x:lama-nasabah', u(b0), 0), 0);
  assert.equal(opasitas(r, 'x:turun', u(b0), 0), 1);
  assert.equal(opasitas(r, 'x:turun', u(b1), 0), 0);
  assert.equal(opasitas(r, 'x:jalan', u(b1 - 1), 0), 0);
  assert.equal(opasitas(r, 'x:jalan', u(b1), 0), 1);
  assert.equal(nilaiDi(r.gerak.find((g) => g.target === 'x:lama-kunci')!.keyframes, 'opacity', u(b1)), 0, 'kunci meja habis saat pose berdiri (kunci di tangan) muncul');
  // Tanpa penggambar (pemanggil lama): tukar seketika seperti sebelumnya.
  assert.ok(!rencanaPergi({ lama: DUDUK, baru: KOSONG, kamLama: K2, kamBaru: K2, kamPintu: K2, hadapKanan: true, dudukTurun: true }).aktor.some((a) => a.kunci === 'turun'));
});

test('pabrikTransisi: dukungan duduk-turun dicek hanya untuk aksi masuk/pergi, lalu diteruskan ke rencana', () => {
  let cek = 0;
  const dudukTurun = () => { cek++; return true; };
  const p = pabrikTransisi({ lama: SAMBUT, baru: DUDUK, aksiBaru: true, hadapKanan: () => true, dudukTurun, gambar: gambarTurun })!;
  assert.ok(p(1280, 528)!.aktor.some((a) => a.kunci === 'turun'));
  const kartu = pabrikTransisi({ lama: DUDUK, baru: KARTU, aksiBaru: true, hadapKanan: () => true, dudukTurun, gambar: gambarTurun })!;
  kartu(1280, 528);
  assert.equal(cek, 1, 'dicek sekali (hanya kedatangan)');
});

/**
 * Penggambar dengan bingkai antara `duduk-turun` Miss Raksa: frame NYATA atlas bila ada (sumber.ts gambarTokoh), selain
 * itu pengganti uji (pose persilakan dengan kepala 15 piksel seni lebih rendah, berjangkar telapak).
 */
const gambarTurunMentor = (o: Parameters<typeof gambarTokoh>[0]) => {
  if (o.siapa === 'mentor' && (o.pose as string) === 'duduk-turun') {
    const nyata = gambarTokoh(o) as ReturnType<typeof gambarTokoh> & { frame?: string };
    if (nyata.frame?.startsWith('duduk-turun')) return nyata;
    const g = gambarTokoh({ ...o, pose: 'berdiri-persilakan' });
    return { ...g, svg: g.svg + '<!--turun-->', kepala: { x: g.kepala.x, y: g.kepala.y + 60 } };
  }
  return gambarTurun(o);
};

test('kedatangan dengan bingkai antara Miss Raksa: persilakan -> duduk-turun (tahan singkat) -> duduk, satu badan, kepala bersambung', () => {
  // Ruang NYATA (geometri meja v3: kepala duduk Miss Raksa di bawah kepala berdirinya), tokoh raster.
  const nyata = (k: KomposisiAdegan): SusunanAdegan => susunAdegan(k, ruangAdegan(k.lokasi), gambarTokoh);
  const SAMBUT = nyata(SAMBUT_K);
  const DUDUK = nyata(DUDUK_K);
  const r = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1, dudukTurun: true, mentorTurun: true }, gambarTurunMentor);
  periksaKeyframe(r);
  periksaTanpaHantu(r, DUDUK);
  periksaTanpaBadanGanda(r, DUDUK);
  const silakan = r.aktor.find((a) => a.kunci === 'silakan');
  const turun = r.aktor.find((a) => a.kunci === 'turun-mentor');
  assert.ok(silakan && silakan.jenis === 'tokoh' && turun && turun.jenis === 'tokoh' && turun.letak.opsi.pose === ('duduk-turun' as string));
  assert.equal(turun.letak.siapa, 'mentor');
  assert.equal(turun.letak.z, Z.belakang, 'di balik meja seperti Miss Raksa lainnya');
  assert.equal(turun.letak.opsi.pandang, 'lawan', 'hadap kanan (sama dengan mempersilakan, ke kursi pengunjung)');
  const frame = (turun.letak.gambar as { frame?: string }).frame;
  if (frame) assert.equal(frame, 'duduk-turun-kanan', 'frame atlas nyata');
  assert.ok(TAHAN_TURUN_MENTOR >= 160 && TAHAN_TURUN_MENTOR <= 320, 'tahan singkat yang terbaca');
  const T = r.durasi;
  const S2 = JADWAL_MASUK.mentorDuduk[0];
  const S3 = S2 + TAHAN_TURUN_MENTOR;
  const u = (t: number) => t / T;
  // persilakan sampai S2, duduk-turun S2..S3, duduk sejak S3 (tukar seketika: 0 bingkai hantu).
  assert.equal(opasitas(r, 'x:silakan', u(S2 - 1), 0), 1);
  assert.equal(opasitas(r, 'x:silakan', u(S2), 0), 0);
  assert.equal(opasitas(r, 'x:turun-mentor', u(S2), 0), 1);
  assert.equal(opasitas(r, 'x:turun-mentor', u(S3 - 1), 0), 1);
  assert.equal(opasitas(r, 'x:turun-mentor', u(S3), 0), 0);
  assert.equal(opasitas(r, 'tokoh:mentor', u(S3 - 1), 1), 0);
  assert.equal(opasitas(r, 'tokoh:mentor', u(S3), 1), 1);
  assert.ok(S3 + 200 <= T, 'duduk menetap sebelum kedatangan selesai');
  // Telapak di lantai tempat berdiri (jangkar kaki), mendatar di antara tempat berdiri & tempat duduk.
  const m = cariTokoh(DUDUK, 'mentor')!;
  const t = ruangAdegan('meja').tempat;
  assert.equal(turun.letak.titik.y, silakan.letak.titik.y);
  assert.ok(turun.letak.titik.x >= Math.min(t.mentorBerdiri.x, m.titik.x) - 2 && turun.letak.titik.x <= Math.max(t.mentorBerdiri.x, m.titik.x) + 2);
  // Kepala bersambung di kedua titik tukar: posisi kepala badan lama (dengan geser antisipasinya) = kepala badan baru
  // (dengan geser munculnya), ± 1 satuan dunia.
  const kepala = (l: LetakTokoh, target: string, uu: number) => {
    const g = r.gerak.find((x) => x.target === target && x.keyframes.some((k) => 'transform' in k));
    const d = g ? geserDi(g.keyframes, uu) : { x: 0, y: 0 };
    const k = { x: l.titik.x + (l.gambar.kepala.x - l.gambar.jangkar.x) * l.skala, y: l.titik.y + (l.gambar.kepala.y - l.gambar.jangkar.y) * l.skala };
    return { x: k.x + d.x * l.skala, y: k.y + d.y * l.skala };
  };
  const eps = 1e-6;
  // Tukar 1 (berdiri -> antara): mendatar bersambung; tegak hanya turun (langkah pose), tidak pernah naik.
  // Tukar 2 (antara -> duduk): bersambung penuh.
  for (const [a, ta, b, tb, tt, penuh] of [[silakan.letak, 'x:silakan', turun.letak, 'x:turun-mentor', S2, false], [turun.letak, 'x:turun-mentor', m, 'tokoh:mentor', S3, true]] as const) {
    const ka = kepala(a, ta, u(tt) - eps);
    const kb = kepala(b, tb, u(tt));
    assert.ok(Math.abs(ka.x - kb.x) <= 1, `t=${tt}: kepala mendatar bersambung (${JSON.stringify(ka)} vs ${JSON.stringify(kb)})`);
    if (penuh) assert.ok(Math.abs(ka.y - kb.y) <= 1, `t=${tt}: kepala tegak bersambung (${ka.y} vs ${kb.y})`);
    else assert.ok(kb.y >= ka.y - 1 && kb.y - ka.y <= 64, `t=${tt}: langkah pose turun <= 16 piksel seni (${ka.y} -> ${kb.y})`);
  }
  // Geser tegak hanya yang tersembunyi meja, dicuplik tiap 5 md: pose berdiri tidak pernah merendah (sepatu di tepi
  // bawah dunia), tepi potong bawah bingkai antara tidak pernah di atas garis meja, pose duduk naik <= 16 satuan.
  const tyDi = (target: string, uu: number) => { const g = r.gerak.find((x) => x.target === target && x.keyframes.some((k) => 'transform' in k)); return g ? geserDi(g.keyframes, uu).y : 0; };
  const garis = ruangAdegan('meja').tempat.garisMejaMentor!;
  const bawahTurun = turun.letak.titik.y + (turun.letak.gambar.h - turun.letak.gambar.jangkar.y) * turun.letak.skala;
  for (let tt = 0; tt <= T; tt += 5) {
    assert.ok(tyDi('x:silakan', u(tt)) <= 0, `t=${tt}: pose berdiri tidak merendah`);
    if (tt >= S2 && tt < S3) assert.ok(bawahTurun + tyDi('x:turun-mentor', u(tt)) >= garis - 1e-6, `t=${tt}: bingkai antara tidak terpotong di atas meja`);
    if (tt >= S3) assert.ok(tyDi('tokoh:mentor', u(tt)) >= -16 - 1e-6, `t=${tt}: pose duduk naik <= 16`);
  }
  // Kepala antara di antara kepala berdiri & kepala duduk (tegak), jadi turun dua langkah, bukan satu lompatan.
  const kS = kepala(silakan.letak, 'x:silakan', u(S2 - 200));
  const kT = kepala(turun.letak, 'x:turun-mentor', u(S3 - 100));
  const kD = kepala(m, 'tokoh:mentor', 1);
  assert.ok(kT.y > kS.y + 8 && kT.y < kD.y - 8, `kepala antara ${kT.y} di antara ${kS.y} & ${kD.y}`);
  // Tanpa dukungan: tukar seketika seperti sebelumnya.
  const cadangan = rencanaMasuk({ lama: SAMBUT, baru: DUDUK, kamLama: K1, kamBaru: K1, kamPintu: K1, dudukTurun: true }, gambarTurunMentor);
  assert.ok(!cadangan.aktor.some((a) => a.kunci === 'turun-mentor'));
  assert.equal(opasitas(cadangan, 'tokoh:mentor', u(S2), 1), 1);
  // Pabrik: dukungan Miss dicek sekali, hanya untuk kedatangan.
  let cek = 0;
  const p = pabrikTransisi({ lama: SAMBUT, baru: DUDUK, aksiBaru: true, hadapKanan: () => true, dudukTurunMentor: () => { cek++; return true; }, gambar: gambarTurunMentor })!;
  assert.ok(p(1280, 528)!.aktor.some((a) => a.kunci === 'turun-mentor'));
  pabrikTransisi({ lama: DUDUK, baru: KARTU, aksiBaru: true, hadapKanan: () => true, dudukTurunMentor: () => { cek++; return true; }, gambar: gambarTurunMentor })!(1280, 528);
  assert.equal(cek, 1);
});

test('kartu episode (/cerita): potongan ruang v3 memuat papan nama utuh + kepala Bu Rina, HP lebar & kolom desktop; SVG diam', () => {
  for (const [W, H] of [[356, 150], [326, 150], [280, 238], [280, 309], [700, 240]] as const) {
    const s = seniKartuRuang(W, H, 'Raksa Silver Club', 'cemas', 'uji');
    const p = s.potongan;
    assert.ok(Math.abs(p.w / p.h - W / H) < 0.01, `${W}x${H}: rasio potongan = rasio kotak`);
    assert.ok(p.x <= 660 && p.x + p.w >= 1000, `${W}x${H}: tulisan papan utuh (${JSON.stringify(p)})`);
    assert.ok(p.x + p.w >= 1300 && p.y <= 40, `${W}x${H}: badan & kepala Bu Rina utuh`);
    assert.ok(p.y + p.h <= 900 && p.x >= 0 && p.x + p.w <= 1600, 'di dalam dunia');
    assert.match(s.svg, />Raksa Silver Club</);
    assert.doesNotMatch(s.svg, /<animate|<script|@keyframes/, 'diam: tanpa animasi');
    assert.doesNotMatch(s.svg, /\sid="(?!uji)/, 'semua id berawalan unik salinan ini');
  }
  // Kotak HP (lebar-pendek) tidak memuat lapisan meja & kursi yang sama sekali di luar potongan (tetap ringan).
  assert.ok(seniKartuRuang(356, 150, 'Raksa Silver Club', 'cemas', 'uji').svg.length < seniKartuRuang(280, 309, 'Raksa Silver Club', 'cemas', 'uji').svg.length);
});
