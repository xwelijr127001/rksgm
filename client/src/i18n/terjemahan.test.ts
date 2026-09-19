import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../../shared/missions';
import { MISSIONS_ACARA } from '../../../shared/missions.acara';
import { KAMUS_MISI, terjemahkanMisi, terjemahkanReveal } from '../../../shared/i18n/misi';
import { MISI_EN } from '../../../shared/i18n/misi.en';
import { MISI_ZH } from '../../../shared/i18n/misi.zh';
import type { MissionPublic, OptionDef, StepDef } from '../../../shared/types';
// Hanya di tes: teks pembahasan server (tidak pernah di-import client).
import { MISSION_KEYS, TIEBREAK_KEY, TUTORIAL_KEY, buildReveal, keyForMissionId } from '../../../server/src/answerKeys';
import { PEMBAHASAN_I18N as PEMBAHASAN_LATIHAN } from '../../../server/src/answerKeys.i18n';
import { KUNCI_ACARA, PEMBAHASAN_ACARA_I18N } from '../../../server/src/acara';
import { KAMUS } from './kamus';
import { sceneFor } from '../game/scenes';
import { LABEL } from '../game/scenes/label';

// Paket latihan + paket acara: keduanya wajib lengkap dalam tiga bahasa.
const SEMUA: MissionPublic[] = [TUTORIAL_MISSION, ...MISSIONS, TIEBREAK_MISSION, ...MISSIONS_ACARA];
const PEMBAHASAN_I18N = {
  en: { ...PEMBAHASAN_LATIHAN.en, ...PEMBAHASAN_ACARA_I18N.en },
  zh: { ...PEMBAHASAN_LATIHAN.zh, ...PEMBAHASAN_ACARA_I18N.zh },
};
const LAIN = ['en', 'zh'] as const;
const MISI = KAMUS_MISI;

/**
 * Penjaga angka: SEMUA angka di teks sumber wajib ada di terjemahan (nominal, persen, jumlah
 * peti, nomor seri, tahun). Dinormalkan: tanpa pemisah ribuan ("Rp100.000.000" = "100000000")
 * dan tanpa nol di depan ("03" = "3"). Terjemahan hanya boleh MENAMBAH angka 1-12, karena
 * tanggal ditulis berbeda antar bahasa ("03 Sep 2026" -> "2026年9月3日": bulan menjadi angka).
 */
const angka = (s: string): string[] => (s.match(/\d[\d.,]*\d|\d/g) ?? []).map((x) => x.replace(/[.,]/g, '').replace(/^0+(?=\d)/, ''));
function samaAngka(terjemahan: string, sumber: string): boolean {
  const sisa = angka(terjemahan);
  for (const n of angka(sumber)) {
    const i = sisa.indexOf(n);
    if (i < 0) return false;
    sisa.splice(i, 1);
  }
  return sisa.every((n) => n.length <= 2 && Number(n) >= 1 && Number(n) <= 12);
}

test('kamus UI: kunci & parameter en/zh sama persis dengan id, tanpa teks kosong', () => {
  for (const [ruang, k] of Object.entries(KAMUS)) {
    const kunciId = Object.keys(k.id).sort();
    assert.ok(kunciId.length > 0, `kamus ${ruang} kosong`);
    for (const b of LAIN) {
      assert.deepEqual(Object.keys(k[b]).sort(), kunciId, `kamus ${ruang}.${b}: himpunan kunci berbeda dari id`);
      for (const kunci of kunciId) {
        assert.ok(k[b][kunci]!.trim().length > 0, `${ruang}.${kunci} (${b}) kosong`);
        const p = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        assert.deepEqual(p(k[b][kunci]!), p(k.id[kunci]!), `${ruang}.${kunci} (${b}): parameter {..} berbeda`);
      }
    }
  }
});

// Satu tes per misi: kegagalan satu misi tidak menutupi misi lain (paket acara diisi per berkas).
for (const m of SEMUA) test(`konten misi ${m.id}: langkah, opsi, dan dokumen punya terjemahan; angka tidak berubah`, () => {
  const ids = (d: OptionDef[]) => d.map((o) => o.id).sort();
  for (const b of LAIN) {
    {
      const t = MISI[b][m.id];
      assert.ok(t, `${b}: misi ${m.id} belum diterjemahkan`);
      for (const f of ['title', 'productLabel', 'location', 'story', 'instruction', 'interactionLabel', 'learning', 'rakiBriefing'] as const) {
        assert.ok(t[f]?.trim(), `${b}/${m.id}: ${f} kosong`);
      }
      assert.ok(samaAngka(t.story, m.story), `${b}/${m.id}: angka di cerita berubah`);
      for (const s of m.steps) {
        const ts = t.steps[s.id];
        assert.ok(ts?.prompt?.trim(), `${b}/${m.id}/${s.id}: prompt`);
        assert.ok(samaAngka(ts.prompt, s.prompt), `${b}/${m.id}/${s.id}: angka di pertanyaan berubah`);
        const cek = (nama: string, asal: OptionDef[], teks: Record<string, { label: string }> | undefined) => {
          assert.deepEqual(Object.keys(teks ?? {}).sort(), ids(asal), `${b}/${m.id}/${s.id}: id ${nama} tidak lengkap`);
          for (const o of asal) {
            assert.ok(teks![o.id]!.label.trim(), `${b}/${m.id}/${s.id}/${o.id}: label kosong`);
            assert.ok(samaAngka(teks![o.id]!.label, o.label), `${b}/${m.id}/${s.id}/${o.id}: angka di label berubah`);
          }
        };
        if (s.kind === 'single' || s.kind === 'multi') cek('opsi', s.options, ts.opsi);
        if (s.kind === 'assign') { cek('item', s.items, ts.item); cek('kategori', s.buckets, ts.kategori); }
        if (s.kind === 'order') cek('item', s.items, ts.item);
        if (s.kind === 'number' && s.unit) assert.ok(ts.unit?.trim(), `${b}/${m.id}/${s.id}: satuan`);
      }
      for (const [nama, daftar, teks] of [['kartu polis', m.policyCards ?? [], t.policyCards], ['tabel', m.tables ?? [], t.tables]] as const) {
        for (const d of daftar) {
          const td = teks?.[d.id];
          assert.ok(td?.title?.trim(), `${b}/${m.id}: ${nama} ${d.id}`);
          if (!td) continue;
          assert.equal(td.rows.length, d.rows.length, `${b}/${m.id}/${d.id}: jumlah baris`);
          d.rows.forEach((r, i) => assert.ok(samaAngka(td.rows[i]!.value, r.value), `${b}/${m.id}/${d.id} baris ${i + 1}: angka berubah`));
        }
      }
      if (m.checklist) assert.equal(t.checklist?.length, m.checklist.length, `${b}/${m.id}: checklist`);
    }
  }
});

test('terjemahkanMisi tidak mengubah id, urutan, durasi, ikon, atau flag (draft, kunci, skor aman)', () => {
  const bentuk = (m: MissionPublic) => JSON.stringify({
    id: m.id, n: m.number, d: m.durationSeconds, b: m.briefingSeconds, scene: m.scene, product: m.product,
    steps: m.steps.map((s: StepDef) => ({
      id: s.id, kind: s.kind, w: s.weight,
      o: 'options' in s ? s.options.map((o) => [o.id, o.icon]) : null,
      i: 'items' in s ? s.items.map((o) => [o.id, o.icon]) : null,
      k: s.kind === 'assign' ? s.buckets.map((o) => [o.id, o.icon]) : null,
      r: s.kind === 'multi' ? s.requiredSelections : null,
      sg: s.kind === 'number' ? [s.suggestions, s.format] : null,
    })),
    docs: [...(m.policyCards ?? []), ...(m.tables ?? [])].map((d) => [d.id, d.rows.map((r) => r.flag ?? null)]),
  });
  for (const b of LAIN) for (const m of SEMUA) assert.equal(bentuk(terjemahkanMisi(m, b)), bentuk(m), `${b}/${m.id}`);
  assert.equal(terjemahkanMisi(MISSIONS[0]!, 'id'), MISSIONS[0], 'bahasa bawaan = objek asli');
});

for (const key of [TUTORIAL_KEY, ...MISSION_KEYS, TIEBREAK_KEY, ...KUNCI_ACARA]) test(`pembahasan (server) ${key.missionId}: ringkasan & penjelasan tiap langkah ada untuk en & zh; angka tidak berubah`, () => {
  for (const b of LAIN) {
    {
      const t = PEMBAHASAN_I18N[b][key.missionId];
      assert.ok(t?.summary?.trim(), `${b}/${key.missionId}: ringkasan`);
      assert.ok(samaAngka(t.summary, key.summary), `${b}/${key.missionId}: angka di ringkasan berubah`);
      for (const s of key.steps) {
        assert.ok(t.steps[s.stepId]?.trim(), `${b}/${key.missionId}/${s.stepId}: penjelasan`);
        assert.ok(samaAngka(t.steps[s.stepId]!, s.explanation), `${b}/${key.missionId}/${s.stepId}: angka di penjelasan berubah`);
      }
    }
  }
});

test('pembahasan (server): terjemahan ikut terkirim dan tampil dalam bahasa terpilih', () => {
  // Pembahasan yang dikirim server memuat terjemahan, dan client menampilkannya dalam bahasa terpilih.
  const m = MISSIONS[0]!;
  const reveal = buildReveal(m, keyForMissionId(m.id)!);
  assert.ok(reveal.terjemahan?.en && reveal.terjemahan.zh);
  const en = terjemahkanReveal(reveal, terjemahkanMisi(m, 'en'), 'en');
  assert.equal(en.summary, PEMBAHASAN_I18N.en[m.id]!.summary);
  assert.equal(en.steps[0]!.correctText[0], MISI_EN[m.id]!.steps.s1!.opsi!.dokumentasi!.label);
  assert.deepEqual(en.steps[0]!.correct, reveal.steps[0]!.correct, 'kunci mesin tidak berubah');
  assert.equal(terjemahkanReveal(reveal, m, 'id'), reveal);
});

for (const m of SEMUA) test(`label adegan ${m.id}: semua objek, stiker kategori, dan papan punya terjemahan yang cukup pendek`, () => {
  const BATAS = { en: 20, zh: 9 };
  for (const b of LAIN) {
    {
      const asli = sceneFor(m, 'id');
      if (!asli) continue;
      const t = LABEL[b][m.id];
      assert.ok(t, `${b}: label adegan ${m.id}`);
      for (const o of asli.objects) {
        const teks = t.objek[o.id];
        assert.ok(teks?.trim(), `${b}/${m.id}: label objek ${o.id}`);
        assert.ok([...teks].length <= BATAS[b], `${b}/${m.id}/${o.id}: "${teks}" terlalu panjang (maks ${BATAS[b]})`);
      }
      assert.deepEqual(Object.keys(t.kategori ?? {}).sort(), Object.keys(asli.bucketShort ?? {}).sort(), `${b}/${m.id}: stiker kategori`);
      for (const teks of Object.values(t.kategori ?? {})) assert.ok([...teks].length <= BATAS[b], `${b}/${m.id}: stiker "${teks}" terlalu panjang`);
      for (const p of asli.boards ?? []) {
        assert.ok(t.papan?.[p.id]?.title?.trim(), `${b}/${m.id}: papan ${p.id}`);
        assert.equal(t.papan?.[p.id]?.lines.length, p.lines.length, `${b}/${m.id}/${p.id}: jumlah baris papan`);
      }
      const hasil = sceneFor(m, b)!;
      assert.deepEqual(hasil.objects.map((o) => [o.id, o.x, o.y, o.refId]), asli.objects.map((o) => [o.id, o.x, o.y, o.refId]), `${b}/${m.id}: posisi/id objek berubah`);
    }
  }
});
