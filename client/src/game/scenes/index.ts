/**
 * Daftar adegan 2D per misi. Data tata letak & gambar HANYA di client; kunci
 * jawaban tetap di server. Id objek memakai id langkah/opsi dari shared/missions.ts
 * (dijaga oleh scenes.test.ts supaya tidak melenceng).
 */

import type { Bahasa } from '@shared/bahasa';
import { LABEL } from './label';
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
import { ADEGAN_ACARA } from './acara';

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
  // Paket acara (a01-a10): lihat ./acara/
  ...ADEGAN_ACARA,
};

const cache = new Map<string, SceneSpec | null>();

/** Ganti teks yang digambar di adegan (label, stiker kategori, papan); posisi & id tidak berubah. */
function denganLabel(spec: SceneSpec, bahasa: Bahasa): SceneSpec {
  if (bahasa === 'id') return spec;
  const t = LABEL[bahasa][spec.missionId];
  if (!t) return spec;
  return {
    ...spec,
    objects: spec.objects.map((o) => (t.objek[o.id] ? { ...o, label: t.objek[o.id]! } : o)),
    bucketShort: spec.bucketShort ? { ...spec.bucketShort, ...(t.kategori ?? {}) } : spec.bucketShort,
    boards: spec.boards?.map((b) => {
      const p = t.papan?.[b.id];
      return p ? { ...b, title: p.title, lines: b.lines.map((l, i) => ({ ...l, label: p.lines[i] ?? l.label })) } : b;
    }),
  };
}

export function sceneFor(mission: MissionPublic, bahasa: Bahasa = 'id'): SceneSpec | null {
  const kunci = `${mission.id}:${bahasa}`;
  if (cache.has(kunci)) return cache.get(kunci) ?? null;
  const buat = ADEGAN[mission.id];
  const dasar = buat ? acakSlot(buat()) : null;
  const spec = dasar ? denganLabel(dasar, bahasa) : null;
  cache.set(kunci, spec);
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
