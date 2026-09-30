import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../../shared/missions';
import { MISSIONS_ACARA } from '../../../shared/missions.acara';
import type { Bahasa } from '../../../shared/bahasa';
import type { MissionPublic, MissionReveal, StepReveal } from '../../../shared/types';
import { DAFTAR_EPISODE } from '../cerita/episode';
import { aturBahasa, misiDalamBahasa, t } from '../i18n';
import {
  ID_CHECKLIST, PETUNJUK_KETUK_GAMBAR, adeganBertanda, aksesInfo, fxLangkah, gambarStatisDariSpec, idDokumenHtml, kunciPetunjuk,
  lapisanStatis, lebarLabelStatis, teksInfoAdegan, teksSebaris, tombolUntuk,
} from './aksesInfo';
import { objectStates, stepIdsOf } from './draft';
import { misiBergambar } from './gambar';
import { ADEGAN, sceneFor } from './scenes';
import type { StageView } from './types';

/**
 * Temuan review A (26 Sep 2026): checklist misi 3 hanya ada di objek adegan "Folder laporan", jadi
 * hilang di mode ringan. Tes ini menjaga SEMUA misi: setiap objek adegan `doc`/`info` punya jalur
 * HTML, dan misi yang punya checklist/kartu polis/tabel punya tombol HTML untuk membukanya.
 */

const BAHASA: Bahasa[] = ['id', 'en', 'zh'];

/** Misi per bahasa: paket latihan, pemanasan, penentuan, paket acara, dan aktivitas mode cerita yang adegannya terdaftar. */
function semuaMisi(b: Bahasa): MissionPublic[] {
  const dasar = [TUTORIAL_MISSION, ...MISSIONS, TIEBREAK_MISSION, ...MISSIONS_ACARA].map((m) => misiDalamBahasa(m, b));
  const cerita = DAFTAR_EPISODE.flatMap((ep) => Object.values(ep.aktivitas).map((a) => a.misi(b))).filter((m) => Boolean(ADEGAN[m.id]));
  return [...dasar, ...cerita];
}

for (const b of BAHASA) {
  test(`akses info (${b}): tiap objek adegan doc/info punya jalur HTML, dokumen misi punya tombol`, () => {
    aturBahasa(b);
    try {
      let jumlahInfo = 0;
      let jumlahDoc = 0;
      for (const m of semuaMisi(b)) {
        const spec = sceneFor(m, b);
        const akses = aksesInfo(m, spec);
        const html = idDokumenHtml(m);
        assert.deepEqual(akses.yatim, [], `${m.id}: objek adegan tanpa padanan HTML`);

        for (const o of spec?.objects ?? []) {
          if (o.role === 'doc') {
            jumlahDoc++;
            assert.ok(html.has(o.refId), `${m.id}/${o.id}: dokumen '${o.refId}' tidak ada di kartu polis/tabel/checklist misi`);
            assert.ok(akses.docAdegan.some((d) => d.objectId === o.id && d.docId === o.refId), `${m.id}/${o.id}: tidak tercatat di docAdegan`);
            // Dibuka dari kanvas: fokus kembali ke tombol HTML yang juga membuka dokumen ini.
            assert.ok(tombolUntuk(akses, o.refId), `${m.id}/${o.id}: tidak ada tombol HTML untuk dokumen ini`);
          } else if (o.role === 'info') {
            jumlahInfo++;
            const i = akses.info.find((x) => x.objectId === o.id);
            assert.ok(i, `${m.id}/${o.id}: keterangan info tidak masuk "Catatan di adegan"`);
            const teks = teksInfoAdegan(m.id, o.id, i.teks, b, t);
            assert.ok(teks.length > 0, `${m.id}/${o.id}: teks info kosong`);
            assert.ok(!teks.includes('\n'), `${m.id}/${o.id}: teks HTML masih berbaris`);
            assert.ok(akses.tombolDokumen, `${m.id}: ada catatan di adegan tetapi tombol Dokumen tidak tampil`);
            if (b !== 'id') {
              // Teks yang terbaca harus sudah diterjemahkan, bukan kalimat Indonesia dari berkas adegan.
              const asli = sceneFor(m, 'id')!.objects.find((x) => x.id === o.id)!;
              assert.notEqual(teks, teksSebaris(asli.info ?? asli.label), `${m.id}/${o.id} (${b}): keterangan info masih bahasa Indonesia`);
            }
          }
        }

        assert.equal(akses.tombolChecklist, Boolean(m.checklist?.length), `${m.id}: tombol checklist`);
        if (m.policyCards?.length || m.tables?.length) assert.ok(akses.tombolDokumen, `${m.id}: punya dokumen tetapi tanpa tombol Dokumen`);
        for (const id of akses.dokumen) assert.ok(html.has(id));
      }
      assert.ok(jumlahDoc > 0 && jumlahInfo > 0, 'ada adegan dengan objek doc dan info');
    } finally {
      aturBahasa('id');
    }
  });
}

test('misi 3: checklist "Folder laporan" terbuka lewat tombol Lihat checklist, juga tanpa adegan', () => {
  const m03 = MISSIONS.find((m) => m.number === 3)!;
  const akses = aksesInfo(m03, sceneFor(m03, 'id'));
  assert.equal(akses.tombolChecklist, true);
  assert.deepEqual(akses.docAdegan.map((d) => d.docId), [ID_CHECKLIST]);
  assert.equal(tombolUntuk(akses, ID_CHECKLIST), 'checklist');
  // Mode ringan / engine gagal memakai data misi yang sama: kontrolnya tidak bergantung pada kanvas.
  const tanpaAdegan = aksesInfo(m03, null);
  assert.equal(tanpaAdegan.tombolChecklist, true);
  assert.equal(tanpaAdegan.tombolDokumen, false);
});

test('misi 7: kalender "Tanggal kejadian" terbaca di HTML dalam tiga bahasa', () => {
  const m07 = MISSIONS.find((m) => m.number === 7)!;
  const harap: Record<Bahasa, string> = {
    id: 'Tanggal kejadian: 05 Sep 2026',
    en: 'Date of incident: 05 Sep 2026',
    zh: '事故日期：2026年九月05日',
  };
  for (const b of BAHASA) {
    aturBahasa(b);
    try {
      const akses = aksesInfo(m07, sceneFor(m07, b));
      const kalender = akses.info.find((i) => i.objectId === 'kalender')!;
      assert.equal(teksInfoAdegan(m07.id, 'kalender', kalender.teks, b, t), harap[b]);
      assert.equal(akses.tombolDokumen, true);
    } finally {
      aturBahasa('id');
    }
  }
});

test('misi bergambar (tanpa adegan): dokumen tetap punya tombol, tanpa catatan adegan', () => {
  const dasar = MISSIONS.find((m) => m.policyCards?.length)!;
  const akses = aksesInfo({ ...dasar, image: { src: 'x.png', alt: 'x' } }, null);
  assert.equal(akses.tombolDokumen, true);
  assert.deepEqual(akses.info, []);
  assert.deepEqual(akses.docAdegan, []);
  assert.equal(tombolUntuk(akses, 'semua'), 'dokumen');
  const kosong = aksesInfo({ ...dasar, policyCards: undefined, tables: undefined, checklist: undefined }, null);
  assert.equal(kosong.tombolDokumen, false);
  assert.equal(kosong.tombolChecklist, false);
  assert.equal(tombolUntuk(kosong, 'semua'), null);
});

test('teksSebaris: baris baru di teks adegan jadi satu kalimat', () => {
  assert.equal(teksSebaris('Tanggal kejadian:\n05 Sep 2026'), 'Tanggal kejadian: 05 Sep 2026');
  assert.equal(teksSebaris('  a \n\n b  '), 'a b');
});

/**
 * Reveal tiruan (TANPA kunci server): opsi/kategori pertama dianggap benar. Cukup untuk menentukan objek
 * mana yang diberi tanda oleh adegan saat pembahasan (draft.ts objectStates), bukan untuk menilai.
 */
function revealTiruan(m: MissionPublic): MissionReveal {
  const steps: StepReveal[] = m.steps.map((s) => ({
    stepId: s.id, prompt: s.prompt, weight: 1, correctText: [], explanation: '',
    correct: s.kind === 'single' || s.kind === 'multi' ? { optionIds: [s.options[0]!.id] }
      : s.kind === 'assign' ? { assign: Object.fromEntries(s.items.map((i) => [i.id, s.buckets[0]!.id])) }
      : s.kind === 'number' ? { value: 1 } : {},
  }));
  return { missionId: m.id, roundIndex: -1, summary: '', learning: '', steps };
}

test('legenda tanda: tampil tepat bila pembahasan memberi tanda di adegan (semua misi)', () => {
  let bertanda = 0;
  let tanpa = 0;
  for (const m of semuaMisi('id')) {
    const spec = sceneFor(m, 'id');
    const harap = adeganBertanda(m, spec);
    if (spec) {
      const view: StageView = { mode: 'reveal', focusStepId: null, focusItemId: null, answer: {}, reveal: revealTiruan(m), reducedMotion: true };
      const ada = Object.values(objectStates(m, spec, view)).some((s) => s.verdict !== null);
      assert.equal(harap, ada, `${m.id}: legenda ${harap ? 'tampil' : 'tidak tampil'}, padahal tanda di adegan ${ada ? 'ada' : 'tidak ada'}`);
    } else {
      assert.equal(harap, false, `${m.id}: tanpa adegan, tanpa legenda`);
    }
    if (harap) bertanda++; else tanpa++;
  }
  assert.ok(bertanda > 0 && tanpa > 0);
  const cerita = semuaMisi('id').filter((m) => m.id.startsWith('cerita-'));
  // Aktivitas polis mode cerita: hanya kartu dokumen di adegan -> tanpa legenda. Aktivitas bukti: foto bertanda.
  assert.equal(adeganBertanda(cerita.find((m) => m.id === 'cerita-auto1-polis')!, sceneFor(cerita.find((m) => m.id === 'cerita-auto1-polis')!, 'id')), false);
  assert.equal(adeganBertanda(cerita.find((m) => m.id === 'cerita-auto1-bukti')!, sceneFor(cerita.find((m) => m.id === 'cerita-auto1-bukti')!, 'id')), true);
  const m01 = MISSIONS.find((m) => m.number === 1)!;
  assert.equal(adeganBertanda(m01, sceneFor(m01, 'id')), true);
  assert.equal(adeganBertanda(m01, null), false);
});

/**
 * Temuan peninjau (aktivitas cerita polis): kartu tugas & kartu "Siap mulai" menulis "Ketuk satu di gambar atau
 * pilih dari daftar", padahal satu-satunya objek adegan adalah kartu polis (membuka dokumen, bukan menjawab).
 * Aturannya untuk SEMUA misi: petunjuk "ketuk di gambar" hanya untuk langkah yang punya objek pilihan/item di adegan.
 */
for (const b of BAHASA) {
  test(`petunjuk (${b}): "ketuk di gambar" hanya untuk langkah yang punya objek jawaban di adegan`, () => {
    aturBahasa(b);
    try {
      let ketuk = 0;
      let daftar = 0;
      for (const m of semuaMisi(b)) {
        const bergambar = misiBergambar(m);
        const spec = bergambar ? null : sceneFor(m, b);
        for (const s of m.steps) {
          const punyaObjek = Boolean(spec?.objects.some((o) => stepIdsOf(o).includes(s.id) && (o.role === 'option' || o.role === 'item')));
          const fx = fxLangkah(spec, s.id);
          assert.equal(fx !== null, punyaObjek, `${m.id}/${s.id}: fxLangkah`);
          // Adegan bisa diketuk.
          const aktif = kunciPetunjuk(s, fx, true, bergambar);
          if (PETUNJUK_KETUK_GAMBAR.has(aktif)) { ketuk++; assert.ok(punyaObjek, `${m.id}/${s.id}: petunjuk "${t(aktif)}" meminta mengetuk gambar, padahal langkah ini tidak punya objek jawaban di adegan`); }
          else if (s.kind !== 'number') daftar++;
          // Mode ringan / engine gagal / memuat: tidak pernah meminta mengetuk gambar.
          assert.ok(!PETUNJUK_KETUK_GAMBAR.has(kunciPetunjuk(s, fx, false, bergambar)), `${m.id}/${s.id}: petunjuk tanpa kanvas`);
          assert.notEqual(t(aktif), aktif, `${m.id}/${s.id}: kunci ${aktif} tidak ada di kamus ${b}`);
        }
      }
      assert.ok(ketuk > 0 && daftar > 0, 'ada langkah berobjek dan langkah lewat daftar');
    } finally {
      aturBahasa('id');
    }
  });
}

test('petunjuk aktivitas cerita: polis lewat daftar (kartu polis hanya dokumen), bukti lewat foto di gambar', () => {
  const cerita = semuaMisi('id').filter((m) => m.id.startsWith('cerita-'));
  const polis = cerita.find((m) => m.id === 'cerita-auto1-polis')!;
  const bukti = cerita.find((m) => m.id === 'cerita-auto1-bukti')!;
  const sPolis = sceneFor(polis, 'id');
  assert.ok(sPolis?.objects.some((o) => o.role === 'doc'), 'adegan polis punya kartu dokumen');
  for (const s of polis.steps) {
    assert.equal(kunciPetunjuk(s, fxLangkah(sPolis, s.id), true), 'misi.petunjukSingleDaftar', `polis/${s.id}`);
    assert.doesNotMatch(t('misi.petunjukSingleDaftar'), /gambar/i);
  }
  const sBukti = sceneFor(bukti, 'id');
  assert.equal(kunciPetunjuk(bukti.steps[0]!, fxLangkah(sBukti, bukti.steps[0]!.id), true), 'misi.petunjukMultiFoto');
  assert.equal(kunciPetunjuk(bukti.steps[0]!, fxLangkah(sBukti, bukti.steps[0]!.id), false), 'misi.petunjukMultiDaftar');
  // Pola yang sama di misi latihan: misi 7 (polis di dialog dokumen) lewat daftar, misi 1 boleh diketuk di gambar.
  const m07 = MISSIONS.find((m) => m.number === 7)!;
  for (const s of m07.steps) assert.equal(kunciPetunjuk(s, fxLangkah(sceneFor(m07, 'id'), s.id), true), 'misi.petunjukSingleDaftar', `m07/${s.id}`);
  const m01 = MISSIONS.find((m) => m.number === 1)!;
  assert.equal(kunciPetunjuk(m01.steps[0]!, fxLangkah(sceneFor(m01, 'id'), m01.steps[0]!.id), true), 'misi.petunjukSingleAdegan');
});

test('gambar statis mode ringan: aktivitas cerita disusun dari SceneSpec, misi latihan/acara tetap gambar lama', () => {
  for (const m of semuaMisi('id')) {
    const cerita = m.id.startsWith('cerita-');
    assert.equal(gambarStatisDariSpec(m.id), cerita, m.id);
    if (!cerita) continue;
    const spec = sceneFor(m, 'id')!;
    const { latar, lapisan, label } = lapisanStatis(spec);
    assert.deepEqual([latar.x, latar.y, latar.w, latar.h], [0, 0, 640, 480], `${m.id}: latar memenuhi dunia`);
    // Semua hiasan & objek ikut, berpusat di (x, y), urut kedalaman (stabil) seperti engine.
    assert.equal(lapisan.length, (spec.props?.length ?? 0) + spec.objects.length, `${m.id}: jumlah lapisan`);
    for (const o of spec.objects) {
      const l = lapisan.find((x) => x.kunci === 'objek:' + o.id)!;
      assert.ok(l, `${m.id}/${o.id}: objek tidak digambar`);
      assert.deepEqual([l.x + l.w / 2, l.y + l.h / 2], [o.x, o.y], `${m.id}/${o.id}: posisi`);
    }
    const kedalaman = (k: string) => {
      const [jenis, id] = k.split(':');
      return jenis === 'hiasan' ? spec.props!.find((p) => p.id === id)!.depth ?? 5 : spec.objects.find((o) => o.id === id)!.depth ?? 20;
    };
    for (let i = 1; i < lapisan.length; i++) assert.ok(kedalaman(lapisan[i - 1]!.kunci) <= kedalaman(lapisan[i]!.kunci), `${m.id}: urutan kedalaman`);
    for (const l of [latar, ...lapisan]) {
      assert.ok(!l.svg.includes('__W__') && !l.svg.includes('__H__'), `${m.id}/${l.kunci}: penanda ukuran belum diganti`);
      assert.ok(l.svg.startsWith('<svg') && l.svg.includes(`width="${l.w}"`) && l.svg.includes(`height="${l.h}"`), `${m.id}/${l.kunci}: ukuran svg`);
    }
    // Label objek di dalam adegan (pil dijepit seperti engine).
    assert.equal(label.length, spec.objects.filter((o) => o.label.trim()).length);
    for (const l of label) assert.ok(l.x - l.w / 2 >= 0 && l.x + l.w / 2 <= 640, `${m.id}/${l.kunci}: label keluar adegan`);
  }
  assert.ok(lebarLabelStatis('保单') > lebarLabelStatis('ab'), 'aksara CJK lebih lebar dari huruf Latin');
});
