/**
 * TES KOMPOSISI ADEGAN v3 (`adeganKini`, docs/cerita/ADEGAN-AUTO1.md bagian 3-4) pada episode AUTO-1 sungguhan,
 * dijalankan lewat MESIN ke SEMUA keadaan yang terjangkau (setiap baris, setiap pilihan, setiap kandidat jawaban
 * aktivitas; gaya penelusuran ui/tinjauan.test.ts).
 *
 * Harapan ditulis dari NASKAH (kapan pintu terbuka, kapan Bu Rina pergi, kapan waktu berlalu / telepon, siapa bicara
 * kepada siapa) dan kontrak adegan, bukan dihitung ulang dari cue episode. Baris dikenali lewat KUNCI teks yang stabil
 * ('b1-mentor.4'), tidak pernah lewat kalimat.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { MissionAnswer } from '@shared/types';
import { barisTerlihat, jalankan, latarKini, nodeKini, pilihanTersedia, stateAwal } from '../mesin';
import type { AksiCerita, Ekspresi, Episode, IdBab, StateCerita } from '../tipe';
import { bekukan, jawab, LANJUT, mainkanJalur, salinJson, semuaString, type LangkahJalur } from '../uji/jalurEpisode';
import { buatEpisodeUji } from '../uji/episodeUji';
import { kandidatJawaban } from '../validasi';
import { EPISODE_AUTO_1 as EP } from '../episode/auto-1/episode';
import { adeganKini } from './adegan';
import type { KomposisiAdegan } from './adeganTipe';
import { barisKini, ekspresiNasabah } from './tampilan';

// ------------------------------------------------------------------ harapan dari naskah (kunci baris stabil)

/** Narasi pintu: "Pintu terbuka. Seorang nasabah masuk tergesa dan menaruh kunci mobilnya di meja." */
const PINTU = 'b1-mentor.4';
/** Narasi Bu Rina pergi dari meja layanan. */
const PERGI = ['akhir-pergi.3', 'akhir-pergi.4', 'akhir-dingin.3'];
/** Narasi waktu berlalu / telepon beberapa hari kemudian: sesudahnya Bu Rina tidak lagi di kursi kantor. */
const LOMPAT = ['akhir-janji.2', 'akhir-tertunda.1', 'akhir-tertunda.4'];
/** Narasi membuka kartu polis. */
const KARTU = ['b4-polis-intro.1', 'b4-polis-intro.2'];
/** Node bab 3 yang berlatar parkiran kantor (b3-seadanya tetap di kantor). */
const NODE_PARKIRAN = ['b3-bukti-intro', 'b3-bukti', 'b3-bukti-tepat', 'b3-bukti-kurang', 'b3-lengkapi', 'b3-cukup'];
/** Wajah Miss Raksa saat mendengarkan = cermin perasaan Bu Rina (kontrak bagian 6: cemas = wajah prihatin). */
const CERMIN: Record<Ekspresi, Ekspresi> = {
  kesal: 'cemas', cemas: 'cemas', bingung: 'cemas', lega: 'lega', senang: 'tersenyum', tersenyum: 'tersenyum', netral: 'netral', serius: 'netral',
};

const BUKTI_TEPAT: MissionAnswer = { bukti: ['foto-full', 'foto-penyok', 'foto-plat'] };
const polis = (opsi: string): MissionAnswer => ({ penjelasan: opsi });
const TERBAIK: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'];
const JANJI: LangkahJalur[] = ['b1-datang/janji', 'b2-saran/dokumentasi', jawab('b3-bukti', BUKTI_TEPAT), jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/janjikan', 'b5-tutup/rangkum'];
const TERTUNDA: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/bengkel', 'b2-bengkel-akibat/biarkan', jawab('b4-polis', polis('bisa-dinilai')), 'b5-keberatan/jujur', 'b5-tutup/rangkum'];
const SEPELE: LangkahJalur[] = ['b1-datang/dengar', 'b2-saran/ringan', 'b2-ringan-akibat/tetap-ringan'];

/** Kunci teks baris yang sudah tampil di perjalanan ini (riwayat = apa yang benar-benar ditampilkan mesin). */
const sudahTampil = (s: StateCerita): Set<string> => new Set(s.riwayat.flatMap((e) => (e.jenis === 'baris' ? [e.teks] : [])));
/** Kunci baris yang sedang tampil di kotak dialog (null saat umpan balik aktivitas tampil). */
const kunciKini = (s: StateCerita): string | null => (s.umpanBalik ? null : barisKini(EP, s)?.teks ?? null);
const fisik = (k: KomposisiAdegan): boolean => !!k.nasabah && !k.nasabah.lewatTelepon;

// ------------------------------------------------------------------ penelusuran semua keadaan

interface Jelajah {
  keadaan: StateCerita[];
  /** Pasangan (sebelum, sesudah) untuk setiap 'lanjut' yang sah. */
  lanjut: [StateCerita, StateCerita][];
}

let tembolok: Jelajah | null = null;

/**
 * Semua keadaan terjangkau. Keadaan yang sama maknanya bagi komposisi (node, baris, umpan balik, kepercayaan, tanda,
 * urutan riwayat) hanya ditelusuri sekali; tanda `akt:bukti:pilih:<foto>` tidak ikut dibandingkan karena tidak dibaca
 * kondisi mana pun (yang dibaca: tepat/sebagian/belum & lewat:<foto>).
 */
function jelajah(): Jelajah {
  if (tembolok) return tembolok;
  const keadaan: StateCerita[] = [];
  const lanjut: [StateCerita, StateCerita][] = [];
  const dilihat = new Set<string>();
  const kandidat = new Map<string, MissionAnswer[]>();
  const tumpukan: StateCerita[] = [stateAwal(EP)];
  while (tumpukan.length) {
    const s = tumpukan.pop()!;
    const sig = JSON.stringify([
      s.node, s.baris, s.umpanBalik, s.kepercayaan,
      s.tanda.filter((t) => !t.startsWith('akt:bukti:pilih:')).sort(),
      s.riwayat.map((e) => ('teks' in e ? e.teks : e.jenis)),
    ]);
    if (dilihat.has(sig)) continue;
    dilihat.add(sig);
    keadaan.push(s);
    const n = EP.node[s.node]!;
    const aksi: AksiCerita[] = [LANJUT];
    if (n.jenis === 'pilihan') for (const p of pilihanTersedia(EP, s, n)) aksi.push({ jenis: 'pilih', node: s.node, pilihan: p.id });
    if (n.jenis === 'aktivitas' && !s.umpanBalik) {
      if (!kandidat.has(n.aktivitas)) kandidat.set(n.aktivitas, kandidatJawaban(EP, n.aktivitas) ?? []);
      for (const j of kandidat.get(n.aktivitas)!) aksi.push({ jenis: 'aktivitas', node: s.node, jawaban: j });
    }
    for (const a of aksi) {
      const b = jalankan(EP, s, a);
      if (b === s) continue;
      if (a.jenis === 'lanjut') lanjut.push([s, b]);
      tumpukan.push(b);
    }
  }
  tembolok = { keadaan, lanjut };
  return tembolok;
}

/** Komposisi per keadaan (dihitung sekali per objek state). */
const komposisi = new WeakMap<StateCerita, KomposisiAdegan>();
const k = (s: StateCerita): KomposisiAdegan => {
  let x = komposisi.get(s);
  if (!x) komposisi.set(s, (x = adeganKini(EP, s)));
  return x;
};

// ------------------------------------------------------------------ kehadiran

test('semua keadaan: Miss Raksa hadir; lokasi dikenal; pembicara selalu hadir (di bingkai atau lewat telepon)', () => {
  const { keadaan } = jelajah();
  assert.ok(keadaan.length > 5000, `keadaan ditelusuri: ${keadaan.length}`);
  for (const a of Object.keys(EP.akhir)) assert.ok(keadaan.some((s) => s.akhir === a), `akhir "${a}" tercapai`);
  for (const s of keadaan) {
    const x = k(s);
    const di = `${s.node}#${s.baris}${s.umpanBalik ? '+umpan' : ''}`;
    assert.ok(x.mentor, `${di}: Miss Raksa hadir`);
    assert.ok(['meja', 'parkiran', 'telepon'].includes(x.lokasi), `${di}: lokasi ${x.lokasi} (pintu-luar hanya untuk pembuka panggung)`);
    if (x.pembicara === 'nasabah') assert.ok(x.nasabah, `${di}: Bu Rina bicara, jadi hadir (atau lewat telepon)`);
    if (x.pembicara === 'mentor') assert.ok(x.mentor, `${di}: Miss Raksa bicara`);
    if (x.lokasi === 'telepon') assert.ok(!fisik(x), `${di}: lokasi telepon = kursi pengunjung kosong`);
    if (x.nasabah?.lewatTelepon) assert.equal(x.lokasi, 'telepon', `${di}: telepon hanya di adegan telepon`);
  }
});

test('Bu Rina tidak ada sebelum narasi pintu, masuk tepat di narasi pintu, dan tetap di meja sampai naskah membuatnya pergi', () => {
  for (const s of jelajah().keadaan) {
    const x = k(s);
    const tampil = sudahTampil(s);
    const di = `${s.node}#${s.baris}`;
    if (!tampil.has(PINTU)) {
      assert.equal(x.nasabah, null, `${di}: sebelum pintu terbuka, kursi pengunjung kosong`);
      continue;
    }
    const pergi = PERGI.some((t) => tampil.has(t));
    const lompat = LOMPAT.some((t) => tampil.has(t));
    if (pergi) assert.equal(x.nasabah, null, `${di}: sesudah narasi pergi, Bu Rina tidak ada`);
    else if (lompat) assert.ok(!fisik(x), `${di}: sesudah waktu berlalu / telepon, Bu Rina tidak duduk di kantor`);
    else assert.ok(fisik(x), `${di}: Bu Rina hadir di bingkai (meja atau parkiran)`);
  }
});

test('narasi pintu: aksi masuk, keduanya duduk berhadapan, kunci di meja, Miss Raksa menoleh ke Bu Rina', () => {
  const { jejak } = mainkanJalur(EP, []);
  const awal = stateAwal(EP);
  const pintu = jejak.find((s) => kunciKini(s) === PINTU)!;
  const ka = k(awal);
  assert.equal(ka.nasabah, null);
  assert.deepEqual([ka.mentor?.pose, ka.mentor?.pandang], ['berdiri-sambut', 'pemain'], 'Miss Raksa berdiri menyambut pemain');
  assert.equal(ka.pembicara, 'mentor');
  assert.deepEqual(ka.prop, { kunci: 'tangan', kartu: 'tersimpan', telepon: 'meja' });
  const kp = k(pintu);
  assert.equal(kp.aksi?.jenis, 'masuk');
  assert.equal(kp.pembicara, 'narasi');
  assert.equal(kp.lokasi, 'meja');
  assert.deepEqual([kp.mentor?.pose, kp.mentor?.pandang], ['duduk-dengar', 'lawan']);
  assert.equal(kp.nasabah?.pose, 'duduk');
  assert.equal(kp.nasabah?.lewatTelepon, false);
  assert.equal(kp.prop.kunci, 'meja', 'kunci mobil diletakkan di meja setelah duduk');
  // Baris berikut (Bu Rina bicara): aksi sudah lewat, tidak diputar lagi.
  const datang = jejak.find((s) => kunciKini(s) === 'b1-datang.1')!;
  assert.equal(k(datang).aksi, null);
  assert.equal(k(datang).pembicara, 'nasabah');
});

test('adegan akhir: pergi lewat pintu, waktu berlalu, dan telepon beberapa hari kemudian (kursi kosong)', () => {
  const pergi = mainkanJalur(EP, SEPELE);
  const narasiPergi = pergi.jejak.find((s) => kunciKini(s) === 'akhir-pergi.3')!;
  assert.equal(k(narasiPergi).aksi?.jenis, 'pergi');
  assert.equal(k(narasiPergi).nasabah, null);
  assert.notEqual(k(narasiPergi).prop.kunci, 'meja', 'kunci ikut dibawa pergi');
  const pesan = k(pergi.state);
  assert.equal(pesan.pembicara, 'mentor');
  assert.equal(pesan.nasabah, null, 'pesan mentor sesudahnya: kursi kosong');
  assert.equal(pesan.mentor?.pandang, 'pemain', 'pesan mentor ditujukan ke pemain');

  const janji = mainkanJalur(EP, JANJI);
  const telepon = janji.jejak.find((s) => kunciKini(s) === 'akhir-janji.2')!;
  const kt = k(telepon);
  assert.equal(kt.lokasi, 'telepon');
  assert.equal(kt.aksi?.jenis, 'pindah', 'pergantian adegan (beberapa hari kemudian)');
  assert.equal(kt.nasabah?.lewatTelepon, true);
  assert.equal(kt.mentor?.pose, 'telepon');
  assert.equal(kt.prop.telepon, 'tangan');
  assert.equal(kt.prop.kartu, 'tersimpan', 'kartu polis tidak lagi di meja beberapa hari kemudian');
  assert.deepEqual([kt.nasabah?.ekspresi, kt.mentor?.ekspresi], ['netral', 'netral'], 'telepon berdering: wajah senang di meja tidak terbawa');
  const kesal = janji.jejak.find((s) => kunciKini(s) === 'akhir-janji.3')!;
  assert.equal(k(kesal).pembicara, 'nasabah');
  assert.equal(k(kesal).nasabah?.lewatTelepon, true, 'keluhan Bu Rina hanya lewat telepon');
  assert.equal(k(kesal).nasabah?.ekspresi, 'kesal');
  const akhir = k(janji.state);
  assert.equal(akhir.nasabah, null, 'telepon selesai: pesan mentor untuk pemain');
  assert.deepEqual([akhir.mentor?.pose, akhir.mentor?.pandang, akhir.prop.telepon], ['duduk-jelaskan', 'pemain', 'meja']);

  const tertunda = mainkanJalur(EP, TERTUNDA);
  const lompat = tertunda.jejak.find((s) => kunciKini(s) === 'akhir-tertunda.1')!;
  assert.equal(k(lompat).nasabah, null, 'siang itu: Bu Rina sudah di bengkel');
  assert.equal(k(lompat).aksi?.jenis, 'pindah');
  const keluh = tertunda.jejak.find((s) => kunciKini(s) === 'akhir-tertunda.3')!;
  assert.equal(k(keluh).nasabah?.lewatTelepon, true, 'keluhan sesudah waktu berlalu hanya lewat telepon');
});

// ------------------------------------------------------------------ lokasi

test('lokasi: parkiran hanya di node parkiran bab 3; lokasi selalu sesuai latar node', () => {
  const dipakai = new Set<string>();
  for (const s of jelajah().keadaan) {
    const x = k(s);
    const di = `${s.node}#${s.baris}`;
    assert.equal(x.lokasi === 'parkiran', NODE_PARKIRAN.includes(s.node), `${di}: lokasi ${x.lokasi}`);
    const latar = latarKini(EP, s);
    assert.ok(latar === 'parkiran' ? x.lokasi === 'parkiran' : x.lokasi === 'meja' || x.lokasi === 'telepon', `${di}: latar ${latar} vs lokasi ${x.lokasi}`);
    dipakai.add(x.lokasi);
    if (x.lokasi === 'parkiran') {
      assert.equal(x.mentor?.pose, 'berdiri', `${di}: Miss Raksa berdiri di parkiran`);
      assert.equal(x.nasabah?.pose, 'berdiri', `${di}: Bu Rina berdiri di parkiran`);
      assert.equal(x.prop.kunci, 'tangan', `${di}: kunci mobil di tangan Bu Rina`);
    }
  }
  assert.deepEqual([...dipakai].sort(), ['meja', 'parkiran', 'telepon']);
  // Keluar ke parkiran = aksi pindah pada narasinya; kembali ke meja di bab 4.
  const s = mainkanJalur(EP, TERBAIK.slice(0, 2)).jejak.find((x) => kunciKini(x) === 'b3-bukti-intro.1')!;
  assert.equal(k(s).aksi?.jenis, 'pindah');
  assert.equal(k(s).lokasi, 'parkiran');
});

// ------------------------------------------------------------------ aksi sekali jalan

test('aksi: hanya di baris bercue aksi, kunci unik per (node, baris, langkah), tidak diputar lagi di baris berikutnya', () => {
  const { keadaan, lanjut } = jelajah();
  const kunci = new Map<string, string>();
  const jenis = new Set<string>();
  for (const s of keadaan) {
    const x = k(s);
    const cue = s.umpanBalik ? undefined : barisKini(EP, s)?.adegan?.aksi;
    const di = `${s.node}#${s.baris}`;
    assert.equal(x.aksi?.jenis, cue, `${di}: aksi hanya bila baris kini membawa cue aksi`);
    if (!x.aksi) continue;
    jenis.add(x.aksi.jenis);
    assert.equal(x.aksi.kunci, `${EP.id}:${s.node}#${s.baris}@${s.langkah}`);
    const tempat = `${s.node}#${s.baris}@${s.langkah}`;
    assert.equal(kunci.get(x.aksi.kunci) ?? tempat, tempat, `kunci ${x.aksi.kunci} dipakai dua tempat`);
    kunci.set(x.aksi.kunci, tempat);
  }
  assert.deepEqual([...jenis].sort(), ['kartu', 'masuk', 'pergi', 'pindah']);
  for (const [a, b] of lanjut) {
    const ka = k(a).aksi;
    const kb = k(b).aksi;
    if (ka && kb) assert.notEqual(kb.kunci, ka.kunci, `${a.node}#${a.baris} -> ${b.node}#${b.baris}: aksi lama tidak diputar ulang`);
  }
  // Aksi bernaskah (kontrak bagian 3): kartu pada narasi membuka kartu polis.
  for (const s of keadaan.filter((x) => KARTU.includes(kunciKini(x) ?? ''))) {
    const x = k(s);
    assert.equal(x.aksi?.jenis, 'kartu');
    assert.equal(x.prop.kartu, 'meja');
    assert.deepEqual([x.mentor?.pose, x.mentor?.pandang, x.nasabah?.pandang], ['duduk-tunjuk', 'bawah', 'bawah'], 'keduanya melihat kartu, Miss Raksa menunjuk');
    assert.equal(x.lokasi, 'meja', 'kembali ke meja layanan');
  }
});

test('aksi: ulang bab memutar aksi bab itu lagi dengan kunci baru; muat ulang tidak mengubah kunci', () => {
  const h = mainkanJalur(EP, TERBAIK);
  const kartuLama = h.jejak.find((s) => kunciKini(s) === 'b4-polis-intro.1')!;
  const ulang = jalankan(EP, h.state, { jenis: 'ulangBab', bab: 'polis' });
  assert.equal(kunciKini(ulang), 'b4-polis-intro.1');
  assert.equal(k(ulang).aksi?.jenis, 'kartu');
  assert.notEqual(k(ulang).aksi?.kunci, k(kartuLama).aksi?.kunci, 'putaran baru = kunci baru');
  assert.deepEqual(adeganKini(EP, salinJson(ulang)), k(ulang), 'muat ulang: kunci & komposisi sama');
});

// ------------------------------------------------------------------ pembuka, muat ulang, ulang bab

test('pembuka hanya pada awal episode baru; mulai ulang & ulang bab 1 langsung ke komposisi awal tanpa pembuka', () => {
  for (const s of jelajah().keadaan) assert.equal(k(s).pembuka, s.langkah === 0, `${s.node}#${s.baris}: pembuka hanya di langkah 0`);
  const awal = adeganKini(EP, stateAwal(EP));
  assert.equal(awal.pembuka, true);
  const selesai = mainkanJalur(EP, TERBAIK).state;
  for (const s of [jalankan(EP, selesai, { jenis: 'mulaiUlang' }), jalankan(EP, selesai, { jenis: 'ulangBab', bab: 'menyambut' })]) {
    assert.equal(s.node, EP.mulai);
    assert.deepEqual(adeganKini(EP, s), { ...awal, pembuka: false });
  }
});

test('ulang bab: tiap bab mulai dengan komposisi yang masuk akal (riwayat bab sebelumnya tetap menentukan kehadiran)', () => {
  const harap: Record<IdBab, (x: KomposisiAdegan) => void> = {
    menyambut: (x) => assert.equal(x.nasabah, null),
    menggali: (x) => assert.deepEqual([x.lokasi, x.nasabah?.pose, x.mentor?.pose], ['meja', 'duduk', 'duduk-dengar']),
    bukti: (x) => assert.deepEqual([x.lokasi, x.nasabah?.pose, x.mentor?.pose, x.aksi?.jenis], ['parkiran', 'berdiri', 'berdiri', 'pindah']),
    polis: (x) => assert.deepEqual([x.lokasi, x.nasabah?.pose, x.prop.kartu, x.aksi?.jenis], ['meja', 'duduk', 'meja', 'kartu']),
    menutup: (x) => assert.deepEqual([x.lokasi, x.nasabah?.pose, x.prop.kartu, x.prop.kunci], ['meja', 'duduk', 'meja', 'meja']),
  };
  for (const jalur of [TERBAIK, JANJI]) {
    const s = mainkanJalur(EP, jalur).state;
    for (const bab of EP.bab.map((b) => b.id)) {
      const u = jalankan(EP, s, { jenis: 'ulangBab', bab });
      assert.notEqual(u, s, `${bab} bisa diulang`);
      harap[bab]!(adeganKini(EP, u));
      assert.deepEqual(adeganKini(EP, salinJson(u)), adeganKini(EP, u), `${bab}: sama setelah muat ulang`);
    }
  }
  // Jalur bengkel: bab 3 tidak ke parkiran (b3-seadanya di kantor), Bu Rina bersiap pergi dengan kunci di tangan.
  const t = mainkanJalur(EP, TERTUNDA).state;
  const u = adeganKini(EP, jalankan(EP, t, { jenis: 'ulangBab', bab: 'bukti' }));
  assert.deepEqual([u.lokasi, u.nasabah?.pose, u.prop.kunci], ['meja', 'duduk-condong', 'tangan']);
});

test('muat ulang: komposisi sama setelah JSON (simpan + muat) dan tidak bergantung bahasa (hanya id, tanpa teks)', () => {
  const { keadaan } = jelajah();
  // Kosakata id komposisi (kunci & nilai): tidak ada kalimat/teks bahasa apa pun yang bisa masuk.
  const KOSAKATA = new Set([
    'lokasi', 'mentor', 'nasabah', 'pembicara', 'prop', 'aksi', 'pembuka', 'pose', 'ekspresi', 'pandang', 'lewatTelepon', 'jenis', 'kunci', 'kartu', 'telepon',
    'pintu-luar', 'meja', 'parkiran', 'berdiri-sambut', 'berdiri-persilakan', 'duduk-dengar', 'duduk-jelaskan', 'duduk-tunjuk', 'berdiri',
    'jalan-a', 'jalan-b', 'duduk', 'duduk-condong', 'berdiri-pergi', 'netral', 'cemas', 'kesal', 'bingung', 'lega', 'senang', 'serius', 'tersenyum',
    'lawan', 'pemain', 'bawah', 'depan', 'narasi', 'tangan', 'tersimpan', 'masuk', 'pergi', 'pindah',
  ]);
  keadaan.forEach((s, i) => {
    const x = k(s);
    // Semua keadaan dengan aksi + sampel teratur lainnya (JSON seluruh state beserta cadangannya mahal).
    if (x.aksi || i % 7 === 0) assert.deepEqual(adeganKini(EP, salinJson(s)), x, `${s.node}#${s.baris}: sama setelah muat ulang`);
    const kunciAksi = x.aksi?.kunci;
    for (const v of semuaString(x)) assert.ok(KOSAKATA.has(v) || v === kunciAksi, `${s.node}#${s.baris}: "${v}" bukan id komposisi`);
  });
  // Murni: tidak mengubah state (beku) dan hasilnya sama pada panggilan berulang.
  const s = bekukan(salinJson(mainkanJalur(EP, JANJI).state));
  assert.deepEqual(adeganKini(EP, s), adeganKini(EP, s));
});

// ------------------------------------------------------------------ pose, ekspresi, arah pandang

test('pose: menyambut hanya di pembuka; duduk mendengar / menjelaskan (serius) / menunjuk kartu; bingkai aksi tidak pernah jadi komposisi', () => {
  for (const s of jelajah().keadaan) {
    const x = k(s);
    const m = x.mentor!;
    const di = `${s.node}#${s.baris}`;
    const kini = s.umpanBalik ? null : barisKini(EP, s);
    assert.equal(m.pose === 'berdiri-sambut', s.node === 'b1-mentor' && s.baris === 1, `${di}: berdiri-sambut hanya di b1-mentor.1`);
    assert.notEqual(m.pose, 'berdiri-persilakan', `${di}: mempersilakan = bagian aksi masuk`);
    assert.ok(!['jalan-a', 'jalan-b', 'berdiri-pergi'].includes(x.nasabah?.pose ?? ''), `${di}: bingkai jalan/pergi hanya dalam aksi`);
    assert.equal(m.pose === 'duduk-tunjuk', KARTU.includes(kunciKini(s) ?? ''), `${di}: menunjuk hanya saat kartu dibuka`);
    // Umpan balik aktivitas tampil di layar aktivitas (bukan panggung): pose duduknya tidak diperiksa di sini.
    if (x.lokasi === 'meja' && !s.umpanBalik && !(s.node === 'b1-mentor' && s.baris === 1) && !KARTU.includes(kunciKini(s) ?? '')) {
      const serius = x.pembicara === 'mentor' && (kini ?? null)?.ekspresi === 'serius';
      assert.equal(m.pose, serius ? 'duduk-jelaskan' : 'duduk-dengar', `${di}: pose duduk (${m.pose})`);
    }
    if (x.nasabah?.lewatTelepon) assert.deepEqual([m.pose, x.prop.telepon], ['telepon', 'tangan'], `${di}: Miss Raksa menerima telepon`);
    else assert.notEqual(x.prop.telepon, 'tangan', `${di}: gagang telepon hanya diangkat saat ada panggilan`);
    if (x.prop.kunci === 'meja') assert.ok(fisik(x) && x.lokasi === 'meja', `${di}: kunci di meja hanya bila Bu Rina duduk di meja`);
  }
});

test('ekspresi: Bu Rina = ekspresiNasabah (netral sesudah lompatan waktu sampai ia bicara); Miss Raksa bicara = ekspresi barisnya, mendengarkan = cermin wajah Bu Rina', () => {
  const wajahMentor = new Set<string>();
  for (const s of jelajah().keadaan) {
    const x = k(s);
    const di = `${s.node}#${s.baris}`;
    // Naskah: "Beberapa hari kemudian, Bu Rina menelepon." -> perasaannya belum diketahui sampai ia bicara (bukan wajah
    // senang dari meja beberapa hari sebelumnya).
    const baruBerdering = kunciKini(s) === 'akhir-janji.2';
    if (x.nasabah) assert.equal(x.nasabah.ekspresi, baruBerdering ? 'netral' : ekspresiNasabah(EP, s), `${di}: wajah Bu Rina`);
    const kini = s.umpanBalik ? null : barisKini(EP, s);
    const m = x.mentor!;
    wajahMentor.add(m.ekspresi);
    if (!kini) continue;
    if (x.pembicara === 'mentor') assert.equal(m.ekspresi, kini.ekspresi ?? 'netral', `${di}: Miss Raksa bicara`);
    else if (x.nasabah) assert.equal(m.ekspresi, CERMIN[x.nasabah.ekspresi], `${di}: Miss Raksa mendengarkan Bu Rina (${x.nasabah.ekspresi})`);
    else assert.equal(m.ekspresi, 'netral', `${di}: tanpa Bu Rina`);
  }
  // Wajah benar-benar berganti sepanjang cerita (bukan satu senyum untuk semua baris).
  // Kelima wajah minimum brief (dengar, senyum, prihatin, serius, lega) benar-benar tampil di permainan.
  for (const e of ['netral', 'tersenyum', 'cemas', 'serius', 'lega']) assert.ok(wajahMentor.has(e), `Miss Raksa pernah berwajah ${e}`);
});

test('arah pandang: pembicara menatap lawan bicaranya; pemain bicara -> keduanya ke pemain; narasi -> tatapan tetap', () => {
  const { keadaan, lanjut } = jelajah();
  for (const s of keadaan) {
    const x = k(s);
    const di = `${s.node}#${s.baris}`;
    if (s.umpanBalik || !x.nasabah || !fisik(x)) continue;
    if (x.pembicara === 'nasabah') {
      assert.equal(x.mentor?.pandang, 'lawan', `${di}: Miss Raksa menatap Bu Rina yang bicara`);
      assert.ok(['pemain', 'lawan'].includes(x.nasabah.pandang), `${di}: Bu Rina menatap lawan bicaranya (${x.nasabah.pandang})`);
    }
    if (x.pembicara === 'pemain') assert.deepEqual([x.mentor?.pandang, x.nasabah.pandang], ['pemain', 'pemain'], `${di}: pemain bicara`);
    if (x.pembicara === 'mentor' && x.mentor?.pandang === 'lawan') assert.equal(x.nasabah.pandang, 'lawan', `${di}: disapa Miss Raksa, Bu Rina menatapnya`);
  }
  // Naskah: siapa bicara kepada siapa (kunci baris stabil).
  const tepat = mainkanJalur(EP, TERBAIK).jejak;
  const di = (kunci: string): KomposisiAdegan => k(tepat.find((s) => kunciKini(s) === kunci)!);
  assert.deepEqual([di('b1-datang.1').nasabah?.pandang, di('b1-datang.1').mentor?.pandang], ['pemain', 'lawan'], 'Bu Rina mengadu kepada petugas (pemain)');
  assert.deepEqual([di('b3-bukti-intro.2').mentor?.pandang, di('b3-bukti-intro.2').nasabah?.pandang], ['lawan', 'lawan'], '"...tetap disimpan, ya, Bu." kepada Bu Rina');
  assert.deepEqual([di('b3-bukti-tepat.2').mentor?.pandang, di('b3-bukti-tepat.3').nasabah?.pandang], ['lawan', 'lawan'], 'Bu Rina menjawab Miss Raksa');
  assert.deepEqual([di('b4-polis-tepat.2').mentor?.pandang, di('b4-polis-tepat.2').nasabah?.pandang], ['pemain', 'pemain'], 'pemain menjelaskan risiko sendiri');
  assert.equal(di('akhir-tuntas.5').mentor?.pandang, 'pemain', 'pesan mentor untuk pemain');
  const pulih = mainkanJalur(EP, ['b1-datang/prosedur']).jejak;
  assert.equal(k(pulih.find((s) => kunciKini(s) === 'b1-pulih.2')!).mentor?.pandang, 'pemain', '(pelan) ... kepada pemain');
  // Narasi tanpa cue pandang: tatapan tetap seperti baris sebelumnya.
  let narasi = 0;
  for (const [a, b] of lanjut) {
    const kini = kunciKini(b) ? barisKini(EP, b) : null;
    if (!kini || kini.siapa !== 'narasi' || a.node !== b.node || a.umpanBalik) continue;
    const cue = kini.adegan;
    const ka = k(a);
    const kb = k(b);
    if (!cue?.mentor?.pandang && ka.mentor && kb.mentor && ka.lokasi === kb.lokasi) assert.equal(kb.mentor.pandang, ka.mentor.pandang, `${b.node}#${b.baris}: narasi, tatapan Miss Raksa tetap`);
    if (!cue?.nasabah?.pandang && ka.nasabah && kb.nasabah && ka.lokasi === kb.lokasi) assert.equal(kb.nasabah.pandang, ka.nasabah.pandang, `${b.node}#${b.baris}: narasi, tatapan Bu Rina tetap`);
    narasi++;
  }
  assert.ok(narasi > 0, 'ada pasangan narasi yang diperiksa');
});

test('prop: kartu polis di meja sejak dibuka sampai waktu berlalu; kunci di meja selama Bu Rina duduk di meja', () => {
  for (const s of jelajah().keadaan) {
    const x = k(s);
    const tampil = sudahTampil(s);
    const di = `${s.node}#${s.baris}`;
    const dibuka = KARTU.some((t) => tampil.has(t));
    const lompat = LOMPAT.some((t) => tampil.has(t));
    assert.equal(x.prop.kartu === 'meja', dibuka && !lompat && x.lokasi !== 'parkiran', `${di}: kartu ${x.prop.kartu}`);
    if (fisik(x) && x.lokasi === 'meja' && s.node !== 'b3-seadanya') assert.equal(x.prop.kunci, 'meja', `${di}: kunci di meja`);
  }
});

// ------------------------------------------------------------------ episode tanpa panggung (fixture v2)

test('episode tanpa panggung: perilaku v2 (nasabah hadir sejak bicara, pergi dari meja sesudah narasi epilog), tanpa aksi', () => {
  const ep: Episode = buatEpisodeUji();
  assert.equal(ep.panggung, undefined);
  const awal = stateAwal(ep);
  assert.equal(adeganKini(ep, awal).nasabah, null, 'mentor membuka, nasabah belum bicara');
  const s = mainkanJalur(ep, []).state;
  assert.equal(nodeKini(ep, s)?.id, 'n1-pilih');
  assert.ok(adeganKini(ep, s).nasabah, 'nasabah hadir setelah bicara');
  assert.ok(barisTerlihat(ep, s).length > 0);
  for (const x of [awal, s].map((y) => adeganKini(ep, y))) {
    assert.equal(x.aksi, null);
    assert.ok(x.mentor);
  }
  const pergi = mainkanJalur(ep, ['n1-pilih/usir']).state;
  assert.equal(pergi.akhir, 'pergi');
  assert.equal(adeganKini(ep, pergi).nasabah, null, 'epilog narasi: tidak lagi di meja');
});
