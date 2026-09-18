/**
 * Daftar adegan 2D per misi. Data tata letak & gambar HANYA di client; kunci
 * jawaban tetap di server. Id objek memakai id langkah/opsi dari shared/missions.ts
 * (dijaga oleh scenes.test.ts supaya tidak melenceng).
 */

import type { MissionPublic } from '@shared/types';
import type { SceneSpec } from '../types';
import { urutanTampil } from '../draft';
import { sceneParkiran } from './m01-parkiran';
import { sceneBengkel } from './m02-bengkel';
import { sceneRuko } from './m03-ruko';
import { sceneProyek } from './m04-proyek';
import { scenePolisMana } from './m05-kantor';
import { scenePelabuhan } from './m06-pelabuhan';
import { sceneGudangBanjir } from './m07-gudang';
import { sceneForklift } from './m08-forklift';
import { sceneHitung } from './m09-hitung';
import { sceneKotaBanjir } from './m10-kota';
import { scenePenentuan } from './m11-penentuan';
import { sceneTutorial } from './tutorial';

type Pembuat = () => SceneSpec | null;

export const ADEGAN: Record<string, Pembuat> = {
  tutorial: sceneTutorial,
  'm01-parkir': sceneParkiran,
  'm02-detektif-penyok': sceneBengkel,
  'm03-berkas-ruko': sceneRuko,
  'm04-excavator': sceneProyek,
  'm05-polis-mana': scenePolisMana,
  'm06-paket-penyok': scenePelabuhan,
  'm07-banjir-gudang': sceneGudangBanjir,
  'm08-benturan-keausan': sceneForklift,
  'm09-hitung-teliti': sceneHitung,
  'm10-grand-mission': sceneKotaBanjir,
  'm11-penentuan': scenePenentuan,
};

const cache = new Map<string, SceneSpec | null>();

export function sceneFor(mission: MissionPublic): SceneSpec | null {
  if (cache.has(mission.id)) return cache.get(mission.id) ?? null;
  const buat = ADEGAN[mission.id];
  const spec = buat ? acakSlot(buat()) : null;
  cache.set(mission.id, spec);
  return spec;
}

/** Tukar posisi slot seragam antar objek pilihan (lihat SceneSpec.acakPosisi). */
export function acakSlot(spec: SceneSpec | null): SceneSpec | null {
  if (!spec?.acakPosisi?.length) return spec;
  const objects = spec.objects.map((o) => ({ ...o }));
  for (const stepId of spec.acakPosisi) {
    const milik = objects.filter((o) => o.role === 'option' && o.stepId === stepId);
    const slot = milik.map((o) => ({ x: o.x, y: o.y, labelDx: o.labelDx, labelDy: o.labelDy, hit: o.hit, depth: o.depth }));
    const baru = urutanTampil(slot, `${spec.missionId}:${stepId}:adegan`);
    milik.forEach((o, i) => Object.assign(o, baru[i]));
  }
  return { ...spec, objects };
}
