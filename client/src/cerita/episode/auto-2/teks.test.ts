/**
 * T-014: kelengkapan terjemahan EPISODE AUTO-2 (spec team/specs/2026-11-16-T-014-ep2-en-zh.md Rev 1.1).
 *  - himpunan kunci id / en / zh SAMA PERSIS, tanpa nilai kosong, himpunan {parameter} identik per kunci;
 *  - Episode.bahasa memuat en & zh, validasiEpisode bersih (angka & parameter per bahasa dijaga di sana juga);
 *  - jelajah data 3 bahasa: setiap kunci teks yang dirujuk episode (node, latar, istilah, akhir, dokumen), arena, lampiran,
 *    dan misi sintetis aktivitas terselesaikan di tabel bahasanya sendiri: bukan kunci mentah, bukan jatuh ke Indonesia;
 *  - tidak ada kata Indonesia yang tertinggal di en / zh; yang sengaja sama dengan Indonesia = daftar eksplisit (nama, merek).
 * Makna terjemahan TIDAK diuji di sini (tinjauan Designer/owner).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Bahasa } from '@shared/bahasa';
import { teksCerita } from '../../teks';
import { validasiEpisode } from '../../validasi';
import { ARENA_AUTO_2, LAMPIRAN_AUTO_2 } from './arena';
import { EPISODE_AUTO_2 as EP } from './episode';
import { TEKS_AUTO_2 } from './teks';
import type { MissionAnswer } from '@shared/types';
import { ringkasTindakan } from '../../hp/arena/ringkas';
import { alihLajur, daftarLajur, paramTanggapan, pilihSimpul, ringkasTanda, tanggapan, type ArenaRambu } from '../../hp/arena/rambu';
import { PESAN_AUTO_2 } from './arena';
import type { KunciTeks } from '../../tipe';
import { aturBahasa, t as teksUi } from '../../../i18n';
import { bentukHitung, satuanSesudahAngka } from '../../hp/arena/logika';

const ID = TEKS_AUTO_2.id;
const LAIN: Bahasa[] = ['en', 'zh'];
const SEMUA: Bahasa[] = ['id', 'en', 'zh'];
const param = (s: string) => [...new Set(s.match(/\{(\w+)\}/g) ?? [])].sort().join(' ');
const PARAM = new RegExp("[{][a-z]+[}]", "gi");
const punya = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Sengaja SAMA dengan teks Indonesia: nama orang/perusahaan, merek papan nama, kata serapan; T-020: isi sel kertas K10 (jam, nama fiktif, "?"). */
const SAMA_DENGAN_ID: Record<string, string[]> = {
  en: ['pemeran.missRaksa.nama', 'lokasi.kantor', 'istilah.surveyor.label', 'istilah.leasing.label', 'arena.surveyor.rudi.ket', 'daftar.pemisah', 'daftar.titik', 'daftar.titikDua', 'daftar.antarKalimat', 'arena.rambu.lajurPemisah', 'arena.selisih.sel.jam.kiri', 'arena.selisih.sel.jam.kanan', 'arena.selisih.sel.nama.kiri', 'arena.selisih.sel.nama.kanan', 'arena.selisih.sel.antisipasi.kiri', 'arena.sim.tempat.satpas'],
  zh: ['pemeran.missRaksa.nama', 'lokasi.kantor', 'istilah.leasing.label', 'arena.selisih.sel.jam.kiri', 'arena.selisih.sel.jam.kanan', 'arena.selisih.sel.nama.kiri', 'arena.selisih.sel.nama.kanan', 'arena.selisih.sel.antisipasi.kiri', 'arena.sim.tempat.satpas'],
};
/** Kata yang hanya ada di kalimat Indonesia (bukan nama): penanda teks yang lupa diterjemahkan. */
const KATA_ID = /\b(yang|dan|tidak|untuk|dengan|sudah|belum|saya|kamu|truk|Pak|Mas|Bapak|klaim|bengkel|lajur|rambu|supir|surat|berkas)\b/i;

test('T-014: Episode.bahasa memuat id, en, zh dan episode tetap sah', () => {
  assert.deepEqual(EP.bahasa, ['id', 'en', 'zh']);
  assert.deepEqual(validasiEpisode(EP), []);
});

test('T-014: kunci id/en/zh sama persis, tanpa nilai kosong, parameter identik', () => {
  const kunciId = Object.keys(ID).sort();
  assert.equal(kunciId.length, 1019);
  for (const b of LAIN) {
    const t = TEKS_AUTO_2[b];
    assert.deepEqual(Object.keys(t).sort(), kunciId, `kunci ${b}`);
    for (const k of kunciId) {
      assert.ok(typeof t[k] === 'string' && t[k]!.trim().length > 0, `${b} "${k}" kosong`);
      assert.equal(param(t[k]!), param(ID[k]!), `${b} "${k}": parameter`);
    }
  }
});

test('T-014: tidak ada teks Indonesia yang tertinggal; yang sama dengan Indonesia hanya nama/merek', () => {
  for (const b of LAIN) {
    const t = TEKS_AUTO_2[b];
    const sama = Object.keys(ID).filter((k) => t[k] === ID[k]).sort();
    assert.deepEqual(sama, [...SAMA_DENGAN_ID[b]!].sort(), `${b}: nilai sama dengan Indonesia`);
    for (const [k, v] of Object.entries(t)) if (!SAMA_DENGAN_ID[b]!.includes(k)) assert.doesNotMatch(v.replace(PARAM, ""), KATA_ID, `${b} "${k}": ${v}`);
  }
  // Merek papan nama piksel: identik di tiga bahasa (font piksel hanya Latin; lihat HANDOFF T-014).
  for (const b of LAIN) assert.equal(TEKS_AUTO_2[b]['lokasi.kantor'], ID['lokasi.kantor']);
  // Jabatan Miss Raksa per T-002.
  assert.equal(TEKS_AUTO_2.en['pemeran.missRaksa.peran'], 'Claims Officer');
  assert.equal(TEKS_AUTO_2.zh['pemeran.missRaksa.peran'], '理赔专员');
});

/** Semua string di dalam nilai (objek/array bersarang; fungsi dilewati). */
function semuaString(v: unknown, hasil: string[] = [], dilihat = new Set<unknown>()): string[] {
  if (typeof v === 'string') hasil.push(v);
  else if (v && typeof v === 'object' && !dilihat.has(v)) {
    dilihat.add(v);
    for (const x of Array.isArray(v) ? v : Object.values(v)) semuaString(x, hasil, dilihat);
  }
  return hasil;
}

test('T-014: jelajah data tiga bahasa: setiap kunci yang dirujuk terselesaikan di bahasanya sendiri', () => {
  const { teks: _teks, ...isiEpisode } = EP;
  void _teks;
  const dirujuk = new Set([...semuaString(isiEpisode), ...semuaString(ARENA_AUTO_2), ...semuaString(LAMPIRAN_AUTO_2)].filter((s) => punya(ID, s)));
  // Kunci dinamis (dirakit saat jalan): alasan per alternatif, ringkasan titik, akibat bundel, tanggapan rambu, akhir.
  for (const k of Object.keys(ID)) if (/^(k\d\d\.[a-e]\d?\.alasan|titik\.|k11\.akibat\.|arena\.|akt\.|akhir\.|kartu\.|suasana\.|catatan\.|dok\.|meja\.)/.test(k)) dirujuk.add(k);
  assert.ok(dirujuk.size > 600, `kunci dirujuk: ${dirujuk.size}`);
  for (const b of SEMUA) {
    for (const k of dirujuk) {
      const v = teksCerita(EP, k, b, { nama: 'Weli' });
      assert.notEqual(v, k, `${b}: kunci mentah ${k}`);
      assert.ok(punya(TEKS_AUTO_2[b], k), `${b}: ${k} jatuh ke Indonesia`);
      if (/\{nama\}/.test(ID[k]!)) assert.match(v, /Weli/, `${b} ${k}: {nama} terisi`);
      assert.doesNotMatch(v, /\{nama\}/, `${b} ${k}`);
    }
  }
});

test('T-014: misi sintetis tiap aktivitas (label, opsi, wadah) memakai bahasa yang diminta', () => {
  const bentukKunci = /^[a-z][\w-]*(\.[\w-]+)+$/;
  for (const [id, a] of Object.entries(EP.aktivitas ?? {})) {
    const idStr = semuaString(a.misi('id'));
    for (const b of LAIN) {
      const str = semuaString(a.misi(b));
      assert.equal(str.length, idStr.length, `${id} ${b}: bentuk misi`);
      const nilaiBahasa = new Set(Object.values(TEKS_AUTO_2[b]));
      let terjemah = 0;
      for (const s of str) {
        if (nilaiBahasa.has(s)) terjemah++;
        if (s.includes(' ')) assert.doesNotMatch(s, KATA_ID, `${id} ${b}: "${s}"`);
        if (bentukKunci.test(s)) assert.ok(!punya(ID, s), `${id} ${b}: kunci mentah "${s}"`);
      }
      assert.ok(terjemah >= 5, `${id} ${b}: hanya ${terjemah} teks dari tabel ${b}`);
    }
  }
});

// ------------------------------------------------------------------ T-014 fix (QA B-01): kalimat yang DIRAKIT kode

/**
 * Kata fungsi Indonesia (penyambung, kata depan, kata umum naskah) yang tidak boleh muncul di teks en / zh yang dirakit kode:
 * daftar "A, B dan C", "lajur 1 dan 3", ringkasan tindakan, tanggapan rambu. Batas kata Latin, tanpa peduli huruf besar.
 */
const KATA_FUNGSI_ID = /(^|[^A-Za-z])(dan|atau|ke|di|dari|hari|lajur|rambu|belum|ada|ini|itu|juga|yang|tidak|untuk|dengan|sudah|saya|kamu|truk|Pak|Bapak|klaim|bengkel|supir|berkas|surat|minggu)(?![A-Za-z])/i;

/** Semua kalimat yang dirakit kode untuk bahasa b: pesan obrolan dari aktivitas, ringkasan tindakan, daftar lajur, tanggapan. */
function kalimatRakitan(b: Bahasa): string[] {
  const tx = (k: KunciTeks, par?: Record<string, string | number>) => teksCerita(EP, k, b, { nama: 'Weli', ...par });
  const hasil: string[] = [];
  for (const [id, a] of Object.entries(EP.aktivitas ?? {})) {
    const k = a.arena;
    if (!k) continue;
    // Jawaban buatan: benda dibagi rata ke semua wadah (daftar 2 dan 3+ butir), tujuan/perlakuan pertama.
    const jawaban: MissionAnswer[] = [];
    if (k.pola === 'susun') for (let geser = 0; geser < k.wadah.length; geser++) jawaban.push({ [k.langkah]: Object.fromEntries(k.benda.map((x, i) => [x.id, k.wadah[(Math.floor(i / 3) + geser) % k.wadah.length]!.id])) });
    else if (k.pola === 'tujuan') for (const tj of k.tujuan) jawaban.push({ [k.langkah]: { [k.benda.id]: tj.id } });
    else if (k.pola === 'bandingkan') jawaban.push({ [k.langkah]: Object.fromEntries(k.selisih.map((x, i) => [x.id, k.perlakuan[i % k.perlakuan.length]!.id])) });
    else if (k.pola === 'pesan') jawaban.push({ [k.langkah]: Object.fromEntries(k.benda.map((x) => [x.id, k.masuk])) });
    else if (k.pola === 'rambu') {
      const kr = k as ArenaRambu;
      for (const [m1, m2] of [[[], [1]], [[3], [1]], [[1, 3], [1, 2, 3]], [[2, 3, 4], [2, 4]]] as [number[], number[]][]) {
        let j: MissionAnswer = {};
        m1.forEach((n) => { j = alihLajur(kr, j, 0, n); });
        m2.forEach((n) => { j = alihLajur(kr, j, 1, n); });
        for (const alt of Object.keys(kr.simpul.sikap)) {
          const jj = pilihSimpul(kr, j, alt);
          jawaban.push(jj);
          hasil.push(ringkasTanda(kr, jj, tx));
          for (const t of tanggapan(kr, jj)) hasil.push(tx(t.teks, paramTanggapan(t, tx)));
        }
        hasil.push(tx('arena.rambu.pilihanmu', { lajur: daftarLajur(m1, tx) }), tx('arena.rambu.pilihanmu', { lajur: daftarLajur(m2, tx) }));
      }
    }
    for (const j of jawaban) {
      const r = ringkasTindakan(EP, id, j, tx);
      if (r) hasil.push(r);
      const pesan = PESAN_AUTO_2[id]?.(j, tx);
      if (pesan) hasil.push(pesan);
    }
  }
  return hasil;
}

test('T-014 fix: kalimat yang dirakit kode (daftar, lajur, ringkasan, tanggapan) tanpa kata Indonesia di en / zh', () => {
  // Kendali: pemindai memang menangkap kata sambung di keluaran Indonesia (kalau tidak, uji ini tidak membuktikan apa-apa).
  const id = kalimatRakitan('id');
  assert.ok(id.length > 40, String(id.length));
  assert.ok(id.some((x) => / dan /.test(x)) && id.some((x) => /lajur \d/.test(x)));
  assert.ok(id.filter((x) => KATA_FUNGSI_ID.test(x)).length > 20);
  for (const b of LAIN) {
    const kal = kalimatRakitan(b);
    assert.equal(kal.length, id.length, b);
    for (const x of kal) assert.doesNotMatch(x, KATA_FUNGSI_ID, `${b}: ${x}`);
  }
  const en = (k: KunciTeks, par?: Record<string, string | number>) => teksCerita(EP, k, 'en', par);
  const zh = (k: KunciTeks, par?: Record<string, string | number>) => teksCerita(EP, k, 'zh', par);
  assert.deepEqual([[], [3], [1, 3], [2, 3, 4]].map((n) => daftarLajur(n, en)), ['no lane yet', 'lane 3', 'lanes 1 and 3', 'lanes 2, 3 and 4']);
  assert.deepEqual([[], [3], [1, 3], [2, 3, 4]].map((n) => daftarLajur(n, zh)), ['还没有车道', '第 3 车道', '第 1、3 车道', '第 2、3、4 车道']);
  // Contoh Designer (D-123): daftar tanpa koma sebelum "and"; zh "、" + "和", spasi Han-Latin, titik "。", tanpa spasi sesudah "：".
  const berkas = { berkas: { formulir: 'sekarang', stnk: 'sekarang', ktp: 'sekarang', sim: 'sekarang', suratpolisi: 'menyusul' } };
  assert.equal(PESAN_AUTO_2.berkas!(berkas, en), 'Mr Hendra, please send these documents: Claim form, Truck registration, Mr Hendra’s ID card and Mr Darto’s driving licence. These may follow once they are ready: Police report.');
  assert.equal(PESAN_AUTO_2.berkas!(berkas, zh), 'Hendra 先生，麻烦您发一下这些文件：理赔申请表、卡车行驶证、Hendra 先生的身份证和 Darto 先生的驾驶证。以下可以办好后再补：警方证明。');
  // D-124: ringkasan tindakan zh memakai tanda baca lebar penuh ("：", "、", "。"), bukan ASCII.
  const saksi = ringkasTindakan(EP, 'saksi', { saksi: { tol: 'ya', hendra: 'ya', polisi: 'ya', darto: 'ya', mobilkecil: 'tidak' } }, zh)!;
  assert.doesNotMatch(saksi, /[,.:] /, saksi);
  assert.match(saksi, /：.+、.+。.+：/, saksi);
});

test('T-014 fix: tidak ada penyambung Indonesia tertulis di kode sumber antarmuka cerita (hanya lewat tabel teks)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const akar = path.resolve(import.meta.dirname, '../..');
  const berkas: string[] = [];
  const jalan = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) jalan(p); else if (/\.tsx?$/.test(e.name) && !/\.test\.|teks\.(id|en|zh)\.ts$/.test(e.name)) berkas.push(p); } };
  // lokasi/logika.ts = prototipe "Lokasi" berbahasa Indonesia (halaman /lokasi, hanya build VITE_KEJADIAN=1). Episode 2 hanya
  // mengimpor lajurTertulisRambu1() darinya (angka lajur, bukan teks), jadi kalimat Indonesianya tidak sampai ke en / zh.
  const KECUALI = [path.join('lokasi', 'logika.ts')];
  for (const d of ['hp', 'ui', 'lokasi', 'episode/auto-2']) jalan(path.join(akar, d));
  // String/templat yang MERAKIT kalimat dengan kata sambung Indonesia: "... dan ...", "lajur ${...}", ", dan ".
  const pola = /[`'"][^`'"\n]*(\}| )(dan|atau) (\$\{|[a-z])[^`'"\n]*[`'"]|[`'"]lajur \$\{|[`'"]belum ada lajur/;
  const temuan: string[] = [];
  for (const f of berkas.filter((x) => !KECUALI.some((k) => x.endsWith(k)))) fs.readFileSync(f, 'utf8').split('\n').forEach((baris, i) => { const b = baris.trim(); if (!b.startsWith('//') && !b.startsWith('*') && !b.startsWith('/*') && pola.test(b)) temuan.push(`${path.relative(akar, f)}:${i + 1}: ${b.slice(0, 120)}`); });
  assert.deepEqual(temuan, []);
});

test('Kalimat hitungan ringkasan susun: jamak Inggris, kata bantu bilangan Mandarin, Indonesia tetap', () => {
  assert.deepEqual(
    [bentukHitung('document|documents', 1), bentukHitung('document|documents', 8), bentukHitung('document|documents', 0), bentukHitung('dokumen', 1), bentukHitung('份文件', 8)],
    ['document', 'documents', 'documents', 'dokumen', '份文件'],
  );
  // Baris total persis seperti yang dirakit ArenaSusun (kamus antarmuka + satuan arena dalam bahasa yang sama).
  const baris = (b: Bahasa, id: 'berkas' | 'saksi', total: number): string => {
    const k = ARENA_AUTO_2[id];
    if (k.pola !== 'susun') throw new Error(`${id} bukan arena susun`);
    aturBahasa(b, false);
    try { return teksUi('ceritaHp.totalDitempatkan', { n: total, total, satuan: satuanSesudahAngka(k, (kunci) => teksCerita(EP, kunci, b), total) }); } finally { aturBahasa('id', false); }
  };
  assert.deepEqual(SEMUA.map((b) => baris(b, 'berkas', 8)), ['8 dari 8 dokumen sudah ditempatkan.', '8 of 8 documents placed.', '已放置 8/8 份文件。']);
  assert.deepEqual(SEMUA.map((b) => baris(b, 'saksi', 5)), ['5 dari 5 saksi sudah ditempatkan.', '5 of 5 witnesses placed.', '已放置 5/5 位证人。']);
  // Tunggal hanya bila bendanya satu (angka yang tepat mendahului katanya).
  assert.deepEqual(SEMUA.map((b) => baris(b, 'berkas', 1)), ['1 dari 1 dokumen sudah ditempatkan.', '1 of 1 document placed.', '已放置 1/1 份文件。']);
  // Arena tanpa satuanHitung: perilaku lama (label satuan berhuruf kecil).
  assert.equal(satuanSesudahAngka({ satuan: 'arena.berkas.satuan' }, (kunci) => teksCerita(EP, kunci, 'en'), 8), 'document');
});
