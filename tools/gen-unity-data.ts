/**
 * Menghasilkan data misi untuk proyek Unity dari SATU sumber: shared/missions.ts.
 *
 *   npm run gen:unity
 *
 * Keluaran:
 *  - unity/Assets/Editor/Generated/raksa-missions.json  (dipakai generator scene)
 *  - unity/Assets/Scripts/Generated/RaksaIds.cs         (konstanta ID untuk runtime)
 *
 * Tujuannya: ID objek di scene Unity TIDAK BOLEH menyimpang dari ID opsi di
 * data misi, karena ID itulah penghubung antara ketukan di canvas dan draft
 * jawaban di React. Kunci jawaban TIDAK ikut dibuat ke sini.
 */

import fs from 'node:fs';
import path from 'node:path';
import { MISSIONS, TIEBREAK_MISSION, TUTORIAL_MISSION } from '../shared/missions';
import { anchorId } from '../shared/unityBridge';
import type { MissionPublic, StepDef } from '../shared/types';

const ROOT = path.resolve(import.meta.dirname, '..');
const JSON_OUT = path.join(ROOT, 'unity/Assets/Editor/Generated/raksa-missions.json');
const CS_OUT = path.join(ROOT, 'unity/Assets/Scripts/Generated/RaksaIds.cs');

interface GenObject {
  stepId: string;
  optionId: string;
  label: string;
  kind: 'hotspot' | 'bukti' | 'dokumen' | 'kasus' | 'angka';
  multi: boolean;
  anchor: string;
  /** Posisi seed dari adegan 2D (persen 0-100) bila ada; dipakai generator 3D. */
  hotspot?: { x: number; y: number };
}

interface GenStep {
  id: string;
  kind: StepDef['kind'];
  presentation: string | null;
  prompt: string;
  requiredSelections: number | null;
  /** Untuk assign: daftar bucket yang sah. */
  buckets: { id: string; label: string }[];
  objects: GenObject[];
}

interface GenMission {
  id: string;
  number: number;
  scene: string;
  product: string;
  title: string;
  location: string;
  durationSeconds: number;
  steps: GenStep[];
  /** Sudut kamera yang berguna untuk misi ini. */
  cameraViews: string[];
}

function kindFor(step: StepDef): GenObject['kind'] {
  if (step.kind === 'multi') {
    if (step.presentation === 'hotspot') return 'hotspot';
    if (step.presentation === 'folder') return 'dokumen';
    return 'bukti';
  }
  if (step.kind === 'assign') return 'kasus';
  if (step.kind === 'number') return 'angka';
  return 'bukti';
}

function objectsFor(step: StepDef): GenObject[] {
  const kind = kindFor(step);
  const multi = step.kind === 'multi';

  if (step.kind === 'single' || step.kind === 'multi') {
    return step.options.map((o) => ({
      stepId: step.id,
      optionId: o.id,
      label: o.label,
      kind,
      multi,
      anchor: anchorId(step.id, o.id),
      ...(o.hotspot ? { hotspot: { x: o.hotspot.x, y: o.hotspot.y } } : {}),
    }));
  }
  if (step.kind === 'assign') {
    // Item adalah objek yang diketuk; bucket dipilih lewat UI HTML / panel.
    return step.items.map((it) => ({
      stepId: step.id,
      optionId: it.id,
      label: it.label,
      kind: 'kasus' as const,
      multi: false,
      anchor: anchorId(step.id, it.id),
    }));
  }
  if (step.kind === 'order') {
    return step.items.map((it) => ({
      stepId: step.id,
      optionId: it.id,
      label: it.label,
      kind: 'bukti' as const,
      multi: false,
      anchor: anchorId(step.id, it.id),
    }));
  }
  // number: tidak ada objek yang diketuk di scene
  return [];
}

function viewsFor(m: MissionPublic): string[] {
  // Misi inspeksi kendaraan/unit dapat memakai tombol sudut pandang.
  const inspeksi = ['m02-detektif-penyok', 'm04-excavator', 'm08-benturan-keausan'];
  if (inspeksi.includes(m.id)) return ['default', 'depan', 'kiri', 'kanan'];
  if (m.id === 'm10-grand-mission') return ['default', 'atas'];
  return ['default'];
}

function convert(m: MissionPublic): GenMission {
  return {
    id: m.id,
    number: m.number,
    scene: m.scene,
    product: m.product,
    title: m.title,
    location: m.location,
    durationSeconds: m.durationSeconds,
    cameraViews: viewsFor(m),
    steps: m.steps.map((s) => ({
      id: s.id,
      kind: s.kind,
      presentation: 'presentation' in s && s.presentation ? s.presentation : null,
      prompt: s.prompt,
      requiredSelections: s.kind === 'multi' ? s.requiredSelections : null,
      buckets: s.kind === 'assign' ? s.buckets.map((b) => ({ id: b.id, label: b.label })) : [],
      objects: objectsFor(s),
    })),
  };
}

const semua = [...MISSIONS, TUTORIAL_MISSION, TIEBREAK_MISSION].map(convert);

// ------------------------------------------------------------------ JSON

const payload = {
  generatedFrom: 'shared/missions.ts',
  catatan: 'JANGAN diedit manual. Jalankan: npm run gen:unity',
  missions: semua,
};

fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

// ------------------------------------------------------------------ C#

function csString(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function csIdent(s: string): string {
  const t = s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[0-9]/.test(t) ? '_' + t : t;
}

const lines: string[] = [];
lines.push('// <auto-generated>');
lines.push('//  Dihasilkan dari shared/missions.ts oleh tools/gen-unity-data.ts');
lines.push('//  JANGAN diedit manual. Jalankan: npm run gen:unity');
lines.push('// </auto-generated>');
lines.push('using System.Collections.Generic;');
lines.push('');
lines.push('namespace Raksa.Generated');
lines.push('{');
lines.push('    /// <summary>ID misi & objek yang sah. Dipakai untuk validasi runtime.</summary>');
lines.push('    public static class RaksaIds');
lines.push('    {');
for (const m of semua) {
  lines.push(`        public const string ${csIdent(m.id).toUpperCase()} = ${csString(m.id)};`);
}
lines.push('');
lines.push('        /// <summary>missionId -> daftar anchor objek yang sah.</summary>');
lines.push('        public static readonly Dictionary<string, HashSet<string>> AnchorsByMission =');
lines.push('            new Dictionary<string, HashSet<string>>');
lines.push('        {');
for (const m of semua) {
  const anchors = m.steps.flatMap((s) => s.objects.map((o) => o.anchor));
  const isi = anchors.map(csString).join(', ');
  lines.push(`            { ${csString(m.id)}, new HashSet<string> { ${isi} } },`);
}
lines.push('        };');
lines.push('');
lines.push('        /// <summary>missionId -> scene key untuk memilih diorama.</summary>');
lines.push('        public static readonly Dictionary<string, string> SceneByMission =');
lines.push('            new Dictionary<string, string>');
lines.push('        {');
for (const m of semua) {
  lines.push(`            { ${csString(m.id)}, ${csString(m.scene)} },`);
}
lines.push('        };');
lines.push('');
lines.push('        public static bool IsKnownMission(string missionId)');
lines.push('        {');
lines.push('            return missionId != null && AnchorsByMission.ContainsKey(missionId);');
lines.push('        }');
lines.push('');
lines.push('        public static bool IsKnownAnchor(string missionId, string anchor)');
lines.push('        {');
lines.push('            HashSet<string> set;');
lines.push('            if (missionId == null || anchor == null) return false;');
lines.push('            return AnchorsByMission.TryGetValue(missionId, out set) && set.Contains(anchor);');
lines.push('        }');
lines.push('    }');
lines.push('}');

fs.mkdirSync(path.dirname(CS_OUT), { recursive: true });
fs.writeFileSync(CS_OUT, lines.join('\n') + '\n', 'utf8');

const totalObjek = semua.reduce((a, m) => a + m.steps.reduce((b, s) => b + s.objects.length, 0), 0);
console.log(`gen:unity  ${semua.length} misi, ${totalObjek} objek dapat diketuk`);
console.log(`  -> ${path.relative(ROOT, JSON_OUT)}`);
console.log(`  -> ${path.relative(ROOT, CS_OUT)}`);
