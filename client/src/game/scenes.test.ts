/**
 * Penjaga anti-melenceng antara konten misi (shared/missions.ts) dan adegan 2D.
 * Setiap adegan yang ada wajib lolos; adegan kosong (null) memakai tampilan sederhana.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../../shared/missions';
import { MISSIONS_ACARA } from '../../../shared/missions.acara';
import type { MissionPublic } from '../../../shared/types';
import { ADEGAN, acakSlot } from './scenes';
import { stepIdsOf } from './draft';
import { WORLD_H, WORLD_W, type SceneObjectSpec, type SceneSpec } from './types';

const SEMUA: MissionPublic[] = [TUTORIAL_MISSION, ...MISSIONS, TIEBREAK_MISSION, ...MISSIONS_ACARA];

function adegan(m: MissionPublic): SceneSpec | null {
  const buat = ADEGAN[m.id];
  assert.ok(buat, `${m.id} terdaftar di scenes/index.ts`);
  return buat!();
}

test('setiap misi (termasuk tutorial & penentuan) terdaftar', () => {
  for (const m of SEMUA) assert.ok(ADEGAN[m.id], m.id);
});

for (const m of SEMUA) {
  test(`adegan ${m.id}: id objek cocok dengan konten misi`, () => {
    const s = adegan(m);
    if (!s) return;
    assert.equal(s.missionId, m.id);
    const ids = new Set<string>();
    for (const o of s.objects) {
      assert.ok(!ids.has(o.id), `id objek unik: ${o.id}`);
      ids.add(o.id);
      assert.ok(o.x >= 0 && o.x <= WORLD_W && o.y >= 0 && o.y <= WORLD_H, `${o.id} di dalam adegan`);
      assert.ok(o.label.length > 0 && o.label.length <= 18, `${o.id}: label singkat (${o.label})`);
      if (o.role === 'doc') {
        const dok = [...(m.policyCards ?? []).map((c) => c.id), ...(m.tables ?? []).map((t) => t.id), ...(m.checklist?.length ? ['checklist'] : [])];
        assert.ok(dok.includes(o.refId), `${o.id}: dokumen ${o.refId} ada di misi`);
        continue;
      }
      if (o.role === 'info') continue;
      const langkah = stepIdsOf(o);
      assert.ok(langkah.length > 0, `${o.id}: punya stepId`);
      for (const sid of langkah) {
        const step = m.steps.find((x) => x.id === sid);
        assert.ok(step, `${o.id}: langkah ${sid} ada`);
        if (o.role === 'option') {
          assert.ok(step!.kind === 'single' || step!.kind === 'multi', `${o.id}: option hanya untuk single/multi`);
          if (step!.kind === 'single' || step!.kind === 'multi') assert.ok(step!.options.some((x) => x.id === o.refId), `${o.id}: opsi ${o.refId}`);
        } else {
          assert.equal(step!.kind, 'assign', `${o.id}: item/bucket hanya untuk assign`);
          if (step!.kind === 'assign') {
            const daftar = o.role === 'item' ? step!.items : step!.buckets;
            assert.ok(daftar.some((x) => x.id === o.refId), `${o.id}: ${o.role} ${o.refId}`);
          }
        }
      }
    }
    // Bila sebuah langkah multi/assign ditampilkan di adegan, SEMUA opsinya harus ada
    // (adegan tidak boleh hanya memuat sebagian pilihan, itu memberi petunjuk).
    for (const step of m.steps) {
      const obj: SceneObjectSpec[] = s.objects.filter((o: SceneObjectSpec) => stepIdsOf(o).includes(step.id));
      if (!obj.length) continue;
      if (step.kind === 'multi' || step.kind === 'single') {
        const ada = new Set<string>(obj.filter((o: SceneObjectSpec) => o.role === 'option').map((o: SceneObjectSpec) => o.refId));
        if (step.kind === 'multi' || ada.size > 0) assert.deepEqual([...ada].sort(), step.options.map((o) => o.id).sort(), `${m.id}/${step.id}: semua opsi tampil`);
      }
      if (step.kind === 'assign') {
        const items = new Set<string>(obj.filter((o: SceneObjectSpec) => o.role === 'item').map((o: SceneObjectSpec) => o.refId));
        if (items.size) assert.deepEqual([...items].sort(), step.items.map((o) => o.id).sort(), `${m.id}/${step.id}: semua item tampil`);
        const buckets = new Set<string>(obj.filter((o: SceneObjectSpec) => o.role === 'bucket').map((o: SceneObjectSpec) => o.refId));
        if (buckets.size) assert.deepEqual([...buckets].sort(), step.buckets.map((o) => o.id).sort(), `${m.id}/${step.id}: semua kategori tampil`);
      }
    }
    for (const [k, v] of Object.entries(s.bucketShort ?? {})) {
      const [sid, bid] = k.split(':');
      const step = m.steps.find((x) => x.id === sid);
      assert.ok(step && step.kind === 'assign' && step.buckets.some((b) => b.id === bid), `bucketShort ${k} valid`);
      assert.ok(v.length <= 20, `bucketShort ${k} singkat`);
    }
    for (const b of s.boards ?? []) for (const l of b.lines) assert.ok(m.steps.some((x) => x.id === l.stepId && x.kind === 'number'), `papan ${b.id}: ${l.stepId}`);
    assert.equal(s.background.w, WORLD_W);
    assert.equal(s.background.h, WORLD_H);
  });
}

test('kunci gambar unik antar adegan (tidak saling menimpa cache tekstur)', () => {
  const svgPerKunci = new Map<string, string>();
  for (const m of SEMUA) {
    const s = adegan(m);
    if (!s) continue;
    for (const a of [s.background, ...(s.props ?? []).map((p) => p.art), ...s.objects.map((o) => o.art)]) {
      const ada = svgPerKunci.get(a.key);
      assert.ok(ada === undefined || ada === a.svg, `kunci gambar ${a.key} dipakai untuk gambar berbeda`);
      svgPerKunci.set(a.key, a.svg);
    }
  }
});

test('kode adegan tidak pernah menyentuh kunci jawaban', () => {
  const dir = path.join(import.meta.dirname, 'scenes');
  const dirArt = path.join(import.meta.dirname, 'art');
  // Menelusuri subfolder juga (scenes/acara/): adegan paket acara ikut dijaga.
  const berkas = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? berkas(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const d of [dir, dirArt, path.join(import.meta.dirname, 'engine')]) {
    for (const f of berkas(d)) {
      const isi = fs.readFileSync(f, 'utf8');
      assert.ok(!/answerKeys|MISSION_KEYS|KUNCI_ACARA|server\//.test(isi), `${path.relative(import.meta.dirname, f)} tidak mengimpor kunci jawaban`);
    }
  }
});

test('acak posisi slot hanya menukar slot seragam, tidak menambah/menghapus posisi', () => {
  for (const m of SEMUA) {
    const s = adegan(m);
    if (!s?.acakPosisi?.length) continue;
    const a = acakSlot(s)!;
    for (const st of s.acakPosisi) {
      const o: SceneObjectSpec[] = s.objects.filter((x: SceneObjectSpec) => x.role === 'option' && x.stepId === st);
      const n: SceneObjectSpec[] = a.objects.filter((x: SceneObjectSpec) => x.role === 'option' && x.stepId === st);
      assert.equal(new Set(o.map((x) => `${x.art.w}x${x.art.h}`)).size, 1, `${m.id}/${st}: slot seragam`);
      assert.deepEqual(n.map((x) => `${x.x},${x.y}`).sort(), o.map((x) => `${x.x},${x.y}`).sort(), `${m.id}/${st}: posisi sama, hanya ditukar`);
      assert.deepEqual(acakSlot(s)!.objects.map((x: SceneObjectSpec) => `${x.id}@${x.x},${x.y}`), a.objects.map((x: SceneObjectSpec) => `${x.id}@${x.x},${x.y}`), 'deterministik');
    }
  }
});
