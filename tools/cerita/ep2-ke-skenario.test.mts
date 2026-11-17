/**
 * T-028: uji KONVERTER Episode 2 solo -> skenario Story Room (tools/cerita/ep2-ke-skenario.mts) terhadap SUMBERNYA, yaitu
 * episode solo itu sendiri (client/src/cerita/episode/auto-2). Dijalankan `npm run test:client` (tsconfig client, karena
 * konverter mengimpor kode client); sisi server (validasi dengan pustaka aset DB, penerbitan seed, room) diuji di
 * server/src/story/seed.test.ts dan room.test.ts.
 *
 * Yang dijaga: 15 babak = 15 titik bernomor (ksim bukan babak); satu pilihan per alternatif dasar a..e dengan klasifikasi dan
 * perubahan status naskah serta akurasi 1 / 0,5 / 0; tiap baris, pertanyaan, pilihan, akibat dan alasan berasal dari naskah (id
 * dan en) dan TIDAK ADA kalimat lain selain TEKS_KONVERTER; tanda tertunda hanya yang dibaca babak sesudahnya; laporan
 * menyebut setiap varian yang diratakan dan setiap baris bersyarat yang tidak dibawa; seed di repo = hasil konversi sekarang.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EPISODE_AUTO_2 as ep } from '../../client/src/cerita/episode/auto-2/episode';
import type { Baris, Efek, NodeAktivitas, NodeDialog, NodePilihan } from '../../client/src/cerita/tipe';
import { EP2_TRAILER_CONTENT } from '../../server/src/story/seed/ep2Trailer';
import { TEXT_LIMITS, textKey, type ContentLocale } from '../../shared/story/content';
import { BAHASA_RUANG, BERKAS_SEED, konversiEp2, RENCANA, sumberLaporan, sumberSeed, TEKS_KONVERTER, tulisTs } from './ep2-ke-skenario.mts';

const hasil = konversiEp2();
const { konten, laporan } = hasil;
const ALT = ['a', 'b', 'c', 'd', 'e'];
const titik = ep.titik!;
const tx = (bahasa: ContentLocale, kunci: string) => ep.teks[bahasa][kunci]!;
const teksRuang = (bahasa: ContentLocale, kunci: string) => konten.text[bahasa]![kunci] ?? '';
/** Cabang naskah (pilihan / hasil aktivitas) milik alternatif `alt` titik `id`: yang memasang `kep:<id>:<alt>`. */
function cabang(id: string, alt: string): { efek: Efek; lanjut: string }[] {
  const n = ep.node[id] as NodePilihan | NodeAktivitas;
  const semua = n.jenis === 'pilihan' ? n.pilihan.map((p) => ({ efek: p.efek!, lanjut: p.lanjut })) : n.hasil.map((h) => ({ efek: h.efek!, lanjut: h.lanjut }));
  return semua.filter((x) => x.efek.pasang?.includes(`kep:${id}:${alt}`));
}
const akibatDasar = (id: string, alt: string): Baris[] => (ep.node[`${id}-${alt}`] as NodeDialog).baris;

test('15 babak = 15 titik keputusan bernomor, urut naskah; ksim bukan babak; id + en saja', () => {
  assert.equal(titik.length, 15);
  assert.deepEqual(konten.rounds.map((r) => r.id), titik.map((t) => t.id));
  assert.ok(ep.node.ksim && !konten.rounds.some((r) => r.id === 'ksim'), 'ksim ada di episode solo, tidak di room');
  assert.deepEqual([konten.locales, Object.keys(konten.text), [...BAHASA_RUANG]], [['id', 'en'], ['id', 'en'], ['id', 'en']]);
  assert.ok(Object.keys(ep.teks.zh).length > 0, 'naskah zh ada, tetapi tidak dikonversi');
  assert.deepEqual([konten.initialMood, konten.contentSource, konten.categoryId, konten.difficulty], [ep.kepercayaanAwal, 'demo', 'auto', 2]);
  for (const bahasa of BAHASA_RUANG) {
    assert.equal(teksRuang(bahasa, textKey.title()), tx(bahasa, 'judul'));
    assert.equal(teksRuang(bahasa, textKey.synopsis()), `${tx(bahasa, 'ringkas')} ${TEKS_KONVERTER.sinopsis[bahasa]}`);
    assert.deepEqual(konten.intro.map((l) => teksRuang(bahasa, textKey.introLine(l.id))), (ep.node[ep.mulai] as NodeDialog).baris.map((b) => tx(bahasa, b.teks)), 'pembuka = baris pembuka Miss Raksa, utuh');
  }
  assert.ok(konten.intro.every((l) => l.speaker === 'officer'));
});

test('satu pilihan per alternatif dasar a..e: klasifikasi, perubahan status dan akurasi naskah; waktu habis = delta terburuk; babak kunci = bobot ganda', () => {
  const akurasi = { tepat: 1, kurang: 0.5, keliru: 0 } as const;
  const klas = { tepat: 'tepat', kurang: 'kurang_tepat', keliru: 'keliru' } as const;
  const deltaSaran: number[] = [];
  titik.forEach((t, i) => {
    const r = konten.rounds[i]!;
    assert.deepEqual(r.choices.map((c) => c.id), ALT.map((a) => `alt-${a}`), t.id);
    assert.deepEqual(Object.keys(t.alternatif).sort(), ALT, `${t.id}: lima alternatif dasar di naskah`);
    const delta = ALT.map((alt) => {
      const milik = cabang(t.id, alt);
      const dasar = milik.find((x) => x.lanjut === `${t.id}-${alt}`)!;
      assert.ok(dasar, `${t.id}-${alt}: cabang dasar`);
      assert.ok(milik.every((x) => x.efek.kepercayaan === dasar.efek.kepercayaan), `${t.id}-${alt}: varian tidak mengubah delta`);
      return dasar.efek.kepercayaan!;
    });
    ALT.forEach((alt, k) => {
      const c = r.choices[k]!;
      const nilai = t.alternatif[alt]!.nilai;
      assert.deepEqual([c.classification, c.accuracy, c.moodDelta], [klas[nilai], akurasi[nilai], delta[k]], `${t.id}-${alt}`);
      if (nilai === 'tepat') {
        assert.equal(alt, t.saran, `${t.id}: saran naskah`);
        deltaSaran.push(delta[k]!);
      }
    });
    assert.equal(r.timeout.moodDelta, Math.min(...delta), `${t.id}: waktu habis`);
  });
  // Naskah: titik kunci 6, 12, 14 berbobot ganda.
  assert.deepEqual(konten.rounds.filter((r) => r.keyRound).map((r) => r.id), titik.filter((_, i) => deltaSaran[i]! > Math.min(...deltaSaran)).map((t) => t.id));
  assert.deepEqual(konten.rounds.filter((r) => r.keyRound).map((r) => r.id), ['k06', 'k12', 'k14']);
});

test('tata letak, pertanyaan, baris pembuka dan teks pilihan berasal dari node naskah (id dan en)', () => {
  titik.forEach((t, i) => {
    const r = konten.rounds[i]!;
    const n = ep.node[t.id] as NodePilihan | NodeAktivitas;
    const pesan = n.jenis === 'aktivitas' && ep.aktivitas[n.aktivitas]!.arena?.pola === 'pesan';
    assert.equal(r.layout, n.jenis === 'pilihan' || pesan ? 'chat' : 'dossier', t.id);
    assert.equal(n.jenis === 'aktivitas', t.id in RENCANA, `${t.id}: rancangan konversi hanya untuk titik aktivitas`);
    for (const bahasa of BAHASA_RUANG) {
      assert.equal(teksRuang(bahasa, textKey.roundTitle(t.id)), tx(bahasa, t.judul));
      assert.equal(teksRuang(bahasa, textKey.roundMeta(t.id)), tx(bahasa, `bab.${n.bab}.judul`));
      assert.equal(teksRuang(bahasa, textKey.roundReason(t.id)), tx(bahasa, t.alasan), `${t.id}: alasan Miss Raksa utuh`);
      assert.equal(teksRuang(bahasa, textKey.roundPrompt(t.id)), tx(bahasa, n.jenis === 'pilihan' ? n.tanya : RENCANA[t.id]!.tanya ?? `akt.${n.aktivitas}.instruksi`));
      assert.equal(teksRuang(bahasa, textKey.roundLesson(t.id)), '', 'tanpa teks pelajaran: tidak ada alasan yang dipotong');
      assert.equal(teksRuang(bahasa, textKey.roundAction(t.id)), '');
      // Baris pembuka tanpa syarat = baris node, urut.
      assert.deepEqual(r.lines.filter((l) => !l.ifFlag).map((l) => teksRuang(bahasa, textKey.line(t.id, l.id))), n.baris.map((b) => tx(bahasa, b.teks)), `${t.id} ${bahasa}`);
      ALT.forEach((alt) => {
        const sumber = n.jenis === 'pilihan' ? tx(bahasa, `${t.id}.${alt}`) : tx(bahasa, RENCANA[t.id]!.pilihan?.(alt) ?? `titik.${t.id}.${alt}`);
        const kurung = /^\(.*\)$/.test(sumber);
        assert.equal(teksRuang(bahasa, textKey.choiceText(t.id, `alt-${alt}`)), kurung ? sumber.slice(1, -1) : sumber, `${t.id}-${alt} ${bahasa}`);
        const c = r.choices.find((x) => x.id === `alt-${alt}`)!;
        assert.equal(c.form, n.jenis === 'pilihan' ? (kurung ? 'action' : 'message') : RENCANA[t.id]!.bentuk ?? 'action', `${t.id}-${alt}: bentuk`);
      });
    }
    assert.deepEqual(r.lines.filter((l) => !l.ifFlag).map((l) => l.speaker), n.baris.map((b) => (b.siapa === 'narasi' ? 'narrator' : b.siapa === 'hendra' ? 'customer' : b.siapa === 'missRaksa' ? 'officer' : 'cast')));
    assert.deepEqual(r.lines.filter((l) => l.speaker === 'cast').map((l) => l.castId), n.baris.filter((b) => !['narasi', 'hendra', 'missRaksa'].includes(b.siapa)).map((b) => b.siapa));
  });
  // Balasan dalam kurung = tindakan tanpa pesan: tepat satu di naskah (K12 E).
  assert.deepEqual(konten.rounds.flatMap((r) => (r.layout === 'chat' && ep.node[r.id]!.jenis === 'pilihan' ? r.choices.filter((c) => c.form === 'action').map((c) => `${r.id} ${c.id}`) : [])), ['k12 alt-e']);
  assert.deepEqual(konten.cast.map((m) => m.id), ['rudi', 'bima', 'admin'], 'tokoh pendukung = pemeran yang berbicara di baris pembuka');
});

test('akibat: tiap baris akibat dasar tanpa syarat ada di balasan atau konsekuensi, urut naskah; alasan netral menjadi alasan (atau konsekuensi bila akibatnya hanya kutipan)', () => {
  for (const bahasa of BAHASA_RUANG) {
    for (const t of titik) {
      for (const alt of ALT) {
        const id = `alt-${alt}`;
        const balasan = teksRuang(bahasa, textKey.choiceReply(t.id, id));
        const konsekuensi = teksRuang(bahasa, textKey.choiceConsequence(t.id, id));
        const alasan = teksRuang(bahasa, textKey.choiceReason(t.id, id));
        assert.ok(konsekuensi, `${t.id}-${alt} ${bahasa}: konsekuensi wajib`);
        const gabung = `${balasan}\u0001${konsekuensi}`;
        let dari = 0;
        const baris = akibatDasar(t.id, alt).filter((b) => !b.jika);
        for (const b of baris) {
          const di = gabung.indexOf(tx(bahasa, b.teks), dari);
          assert.ok(di >= 0, `${t.id}-${alt} ${bahasa}: baris akibat ${b.teks} hilang atau tidak urut`);
          dari = di + tx(bahasa, b.teks).length;
        }
        for (const b of akibatDasar(t.id, alt).filter((x) => x.jika)) assert.ok(!gabung.includes(tx(bahasa, b.teks)), `${t.id}-${alt}: baris bersyarat ${b.teks} tidak dibawa`);
        const netral = tx(bahasa, `${t.id}.${alt}.alasan`);
        // Alasan netral = alasan pilihan, kecuali bila sudah menjadi konsekuensinya: akibat yang hanya kutipan responden, atau
        // narasi akibat yang kata demi kata sama dengan alasan itu (tidak diulang).
        assert.deepEqual([alasan, konsekuensi === netral], konsekuensi === netral ? ['', true] : [netral, false], `${t.id}-${alt} ${bahasa}: alasan netral`);
        const hanyaKutipan = baris.length > 0 && balasan === baris.map((b) => tx(bahasa, b.teks)).join(' ');
        if (hanyaKutipan) assert.equal(konsekuensi, netral, `${t.id}-${alt} ${bahasa}: akibat hanya kutipan`);
        // Balasan hanya berisi ucapan responden babak (tanpa nama, tanpa tanda kutip tambahan).
        if (balasan) {
          const r = konten.rounds.find((x) => x.id === t.id)!;
          assert.ok(r.respondent, `${t.id}: balasan butuh responden`);
          const siapa = r.respondent!.speaker === 'customer' ? 'hendra' : r.respondent!.castId;
          let n = 0;
          while (baris[n] && baris[n]!.siapa === siapa) n++;
          assert.equal(balasan, baris.slice(0, n).map((b) => tx(bahasa, b.teks)).join(' '), `${t.id}-${alt} ${bahasa}`);
        }
        assert.ok([...balasan].length <= TEXT_LIMITS.reply && [...konsekuensi].length <= TEXT_LIMITS.consequence);
      }
      assert.equal(teksRuang(bahasa, textKey.timeoutConsequence(t.id)), TEKS_KONVERTER.waktuHabis[bahasa].replace('{nasabah}', tx(bahasa, 'pemeran.hendra.nama')));
    }
  }
  // Responden: tanpa responden berarti tidak ada balasan sama sekali di babak itu.
  for (const r of konten.rounds) if (!r.respondent) for (const c of r.choices) assert.equal(teksRuang('id', textKey.choiceReply(r.id, c.id)), '', r.id);
  assert.deepEqual(konten.rounds.filter((r) => !r.respondent).map((r) => r.id), ['k09', 'k10', 'k11']);
  assert.deepEqual(konten.rounds.filter((r) => r.respondent?.speaker === 'cast').map((r) => [r.id, r.respondent!.castId]), [['k07', 'bima']]);
});

test('tidak ada kalimat selain naskah: tiap teks room tersusun dari teks naskah, TEKS_KONVERTER, dan perekat (nama + titik dua + tanda kutip)', () => {
  for (const bahasa of BAHASA_RUANG) {
    const sumber = new Set<string>(Object.values(ep.teks[bahasa]));
    for (const v of [...sumber]) {
      // Aturan mekanis konverter: kurung luar balasan dilepas; judul berkas terlalu panjang dipisah di keterangan dalam kurung.
      const kurung = /^\((.*)\)$/.exec(v);
      if (kurung) sumber.add(kurung[1]!);
      const ekor = /^(.*\S)\s*\(([^()]+)\)$/.exec(v);
      if (ekor) {
        sumber.add(ekor[1]!);
        sumber.add(ekor[2]!);
      }
    }
    sumber.add(TEKS_KONVERTER.sinopsis[bahasa]);
    sumber.add(TEKS_KONVERTER.waktuHabis[bahasa].replace('{nasabah}', tx(bahasa, 'pemeran.hendra.nama')));
    const urut = [...sumber].filter((s) => s.trim()).sort((a, b) => b.length - a.length);
    let diperiksa = 0;
    for (const [kunci, nilai] of Object.entries(konten.text[bahasa]!)) {
      let sisa = nilai;
      for (const s of urut) if (sisa.includes(s)) sisa = sisa.split(s).join('\u0000');
      assert.ok(!/[\p{L}\p{N}]/u.test(sisa), `${bahasa} ${kunci}: ada teks yang bukan dari naskah: "${sisa.replace(/\u0000/g, ' ').trim()}"`);
      diperiksa++;
    }
    assert.ok(diperiksa > 400, `${bahasa}: ${diperiksa} teks diperiksa`);
  }
  assert.deepEqual(laporan.teksKonverter.map((x) => [x.id, x.en]), [[TEKS_KONVERTER.sinopsis.id, TEKS_KONVERTER.sinopsis.en], [TEKS_KONVERTER.waktuHabis.id, TEKS_KONVERTER.waktuHabis.en]], 'laporan mencantumkan semua teks buatan konverter');
});

test('tanda tertunda: hanya janji tanggal 20 (K12 A) yang dibaca babak sesudahnya (K14: baris protes untuk pemegangnya + status turun); kep dan catat tidak menjadi tanda', () => {
  const cek = ep.node['k14-cek']!;
  const protes = ep.node['k14-janji'] as NodeDialog;
  assert.ok(cek.jenis === 'cabang' && cek.lainnya === 'k14' && protes.lanjut === 'k14');
  const semuaTanda = konten.rounds.flatMap((r) => r.choices.filter((c) => c.setsFlag).map((c) => `${r.id} ${c.id} ${c.setsFlag}`));
  assert.deepEqual(semuaTanda, ['k12 alt-a janji-20']);
  assert.ok(cabang('k12', 'a')[0]!.efek.pasang!.includes('janji-20'));
  const k14 = konten.rounds[13]!;
  assert.deepEqual(k14.flagEffects, [{ flag: 'janji-20', moodDelta: protes.efek!.kepercayaan }]);
  assert.equal(protes.efek!.kepercayaan, -12);
  for (const bahasa of BAHASA_RUANG) {
    assert.deepEqual(k14.lines.filter((l) => l.ifFlag).map((l) => [l.ifFlag, l.speaker, teksRuang(bahasa, textKey.line('k14', l.id))]), protes.baris.map((b) => ['janji-20', 'customer', tx(bahasa, b.teks)]));
    assert.equal(teksRuang(bahasa, textKey.flagLabel('janji-20')), '', 'tanpa label: naskah hanya punya kalimat utuh');
  }
  assert.equal(k14.lines[0]!.ifFlag, 'janji-20', 'protes lebih dulu, seperti naskah');
  assert.ok(!JSON.stringify(konten.rounds).includes('kep:'), 'tanda ringkasan solo tidak dibawa');
});

test('berkas: fakta bersama aktivitas dan dokumen naskah, tanpa tanda yang membocorkan jawaban; akhir dari status saja', () => {
  const jenis = Object.fromEntries(konten.rounds.map((r) => [r.id, r.evidence.map((e) => `${e.kind}:${e.id}:${e.rows.length}`)]));
  assert.deepEqual(jenis, {
    k01: [],
    k02: ['checklist:daftar:8'],
    k03: ['timeline:proses:4'],
    k04: ['document:kartu:0'],
    k05: ['document:kartu:0'],
    k06: ['timeline:linimasa:3'],
    k07: ['compare:rencana:3'],
    k08: ['compare:rambu:4'],
    k09: ['checklist:daftar:5'],
    k10: ['compare:fakta:4', 'checklist:daftar:3'],
    k11: ['checklist:isi-bundel:7'],
    k12: [],
    k13: ['compare:surat:4'],
    k14: ['compare:banding:3'],
    k15: ['document:kartu:0'],
  });
  // Tanda status hanya di isi bundel K11 (nilai naskah "Ada" x6, "Belum ada di berkas" x1); daftar lain tanpa tanda.
  const bertanda = konten.rounds.flatMap((r) => r.evidence.flatMap((e) => e.rows.filter((w) => w.mark !== 'none').map((w) => `${r.id}:${e.id}:${w.id}:${w.mark}`)));
  assert.deepEqual(bertanda, ['k11:isi-bundel:r1:ok', 'k11:isi-bundel:r2:ok', 'k11:isi-bundel:r3:ok', 'k11:isi-bundel:r4:ok', 'k11:isi-bundel:r5:ok', 'k11:isi-bundel:r6:ok', 'k11:isi-bundel:r7:missing']);
  for (const bahasa of BAHASA_RUANG) {
    // Daftar dokumen K02 memakai urutan aktivitas solo (acak), bukan urutan kelompok jawabannya.
    const berkas = ep.aktivitas.berkas!.misi(bahasa).steps[0]!;
    assert.ok(berkas.kind === 'assign');
    assert.deepEqual(konten.rounds[1]!.evidence[0]!.rows.map((w) => teksRuang(bahasa, textKey.evidenceRow('k02', 'daftar', w.id))), berkas.kind === 'assign' ? berkas.items.map((x) => x.label) : []);
    for (const [idBabak, dok] of [['k03', 'proses'], ['k06', 'linimasa'], ['k08', 'rambu'], ['k13', 'surat'], ['k14', 'banding']] as const) {
      const d = ep.dokumen![dok]!;
      const e = konten.rounds.find((r) => r.id === idBabak)!.evidence.find((x) => x.id === dok)!;
      assert.deepEqual(e.rows.map((w) => [teksRuang(bahasa, textKey.evidenceRow(idBabak, dok, w.id)), teksRuang(bahasa, textKey.evidenceRowValue(idBabak, dok, w.id))]), d.baris.map((b) => [tx(bahasa, b.label), tx(bahasa, b.nilai!)]));
      assert.equal(teksRuang(bahasa, textKey.evidenceBody(idBabak, dok)), tx(bahasa, d.catatan!));
    }
    // Judul 41 / 42 karakter: keterangan dalam kurung menjadi label jenis.
    assert.equal(`${teksRuang(bahasa, textKey.evidenceTitle('k06', 'linimasa'))} (${teksRuang(bahasa, textKey.evidenceKicker('k06', 'linimasa'))})`, tx(bahasa, 'dok.linimasa.judul'));
    for (const e of konten.endings) {
      assert.deepEqual(
        [teksRuang(bahasa, textKey.endingTitle(e.id)), teksRuang(bahasa, textKey.endingText(e.id)), teksRuang(bahasa, textKey.endingCustomer(e.id)), teksRuang(bahasa, textKey.endingMentor(e.id))],
        [tx(bahasa, `akhir.${e.id}.judul`), tx(bahasa, `akhir.${e.id}.ringkas`), tx(bahasa, `akhir.${e.id}.1`), tx(bahasa, `akhir.${e.id}.2`)],
      );
    }
    assert.deepEqual(['sangat_kecewa', 'kecewa', 'ragu', 'tenang', 'senang'].map((b) => teksRuang(bahasa, `scenario.mood.${b}`)), [...ep.suasana].sort((a, b) => a.min - b.min).map((s) => tx(bahasa, s.label)));
  }
  const cek = ep.node['akhir-cek']!;
  assert.ok(cek.jenis === 'cabang');
  assert.deepEqual(konten.endings.map((e) => [e.id, e.kind, e.minMood, e.maxMood, e.minScore, e.maxScore]), [['puas', 'happy', 70, null, null, null], ['catatan', 'with_notes', 45, null, null, null], ['kurang', 'unhappy', null, null, null, null]]);
});

test('laporan menyebut setiap pendekatan: varian yang diratakan, baris akibat bersyarat, ksim, bahasa room, potret, dan hasil ukur terhadap batas', () => {
  const semua = [...laporan.pendekatan, ...laporan.pecahan].map((c) => `${c.babak ?? ''} ${c.uraian}`).join('\n');
  // Varian = cabang sebuah alternatif yang berujung di node akibat selain `<titik>-<alt>` (K09 a2; K11 b2, d2, d3, e2).
  const varian = [...new Set(titik.flatMap((t) => ALT.flatMap((alt) => cabang(t.id, alt).map((x) => x.lanjut).filter((l) => l !== `${t.id}-${alt}`))))];
  assert.deepEqual(varian.sort(), ['k09-a2', 'k11-b2', 'k11-d2', 'k11-d3', 'k11-e2']);
  for (const v of varian) assert.ok(semua.includes(`\`${v}\``), `laporan menyebut varian ${v}`);
  const bersyarat = titik.flatMap((t) => ALT.flatMap((alt) => akibatDasar(t.id, alt).filter((b) => b.jika).map((b) => b.teks)));
  assert.deepEqual(bersyarat, ['k15-b.bukti', 'k15-b.langkah', 'k15-b.nilai']);
  for (const k of bersyarat) assert.ok(semua.includes(`\`${k}\``), `laporan menyebut baris bersyarat ${k}`);
  for (const kata of ['`ksim`', "LOCALE = 'id'", 'Chinese (zh) is not converted', 'no portrait', 'Timeout', 'kep:<titik>:<alt>', '`janji-20`', '`akt.rambu.tanya`', '`k12.e`', '`dok.linimasa.judul`', 'status marks']) {
    assert.ok(semua.includes(kata), `laporan menyebut: ${kata}`);
  }
  assert.deepEqual(laporan.validasi.galat, [], 'validator tanpa galat = gerbang keras');
  assert.deepEqual([...new Set(laporan.validasi.peringatan.map((w) => w.code))].sort(), ['choice_length_hint', 'choice_long']);
  for (const u of laporan.ukuran) assert.ok(u.panjang <= u.batas, `${u.jenis}: ${u.panjang} <= ${u.batas}`);
  assert.deepEqual(laporan.babak.map((b) => b.nomor), Array.from({ length: 15 }, (_, i) => i + 1));
  const md = sumberLaporan(hasil);
  assert.ok(md.includes('## Approximations') && md.includes('## Text splits and compositions') && md.includes('## Texts written by the converter') && md.includes(laporan.hashKonten));
});

test('seed di repo (server/src/story/seed/ep2Trailer.ts) = hasil konversi episode solo SEKARANG; literal TypeScript-nya memuat data yang sama', () => {
  assert.deepEqual(EP2_TRAILER_CONTENT, konten, 'seed basi: jalankan npx tsx --tsconfig client/tsconfig.json tools/cerita/ep2-ke-skenario.mts');
  assert.equal(fs.readFileSync(BERKAS_SEED, 'utf8').replace(/\r\n/g, '\n'), sumberSeed(hasil));
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  assert.deepEqual(new Function(`return ${tulisTs(konten)};`)(), konten, 'penulis literal tidak mengubah isi (petik, baris baru, kunci bertitik)');
  assert.deepEqual(konversiEp2().konten, konten, 'konversi deterministik');
});
