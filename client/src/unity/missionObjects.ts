/**
 * Menurunkan objek & pilihan adegan Unity dari data misi (shared/missions.ts).
 *
 * Bentuknya WAJIB sama dengan tools/gen-unity-data.ts yang membuat
 * unity/Assets/Editor/Generated/raksa-missions.json - kalau anchor menyimpang,
 * ketukan di canvas tidak mengisi draft jawaban. Dijaga oleh missionObjects.test.ts.
 *
 * Kunci jawaban TIDAK pernah masuk ke sini; Unity hanya tahu label & ID opsi.
 *
 * Catatan impor: memakai path relatif ke shared/ (bukan alias @shared) supaya
 * missionObjects.test.ts bisa dijalankan langsung dengan tsx dari root repo.
 */

import type { MissionAnswer, MissionPublic, OptionDef, StepAnswer, StepDef } from '../../../shared/types';
import {
  anchorId,
  type BridgeObject,
  type BridgeObjectKind,
  type BridgeSelection,
  type ToUnityMessage,
} from '../../../shared/unityBridge';
import { sendToUnity } from './bridge';

/** Sama dengan kindFor() di tools/gen-unity-data.ts. */
function kindFor(step: StepDef): BridgeObjectKind {
  if (step.kind === 'multi') {
    if (step.presentation === 'hotspot') return 'hotspot';
    if (step.presentation === 'folder') return 'dokumen';
    return 'bukti';
  }
  if (step.kind === 'assign') return 'kasus';
  if (step.kind === 'number') return 'angka';
  return 'bukti';
}

function objectsForStep(step: StepDef): BridgeObject[] {
  const buat = (o: OptionDef, kind: BridgeObjectKind, multi: boolean): BridgeObject => ({
    stepId: step.id,
    optionId: o.id,
    label: o.label,
    kind,
    multi,
    anchor: anchorId(step.id, o.id),
  });

  if (step.kind === 'single') return step.options.map((o) => buat(o, kindFor(step), false));
  if (step.kind === 'multi') return step.options.map((o) => buat(o, kindFor(step), true));
  // Item assign/order adalah objek yang diketuk; bucket dipilih lewat kontrol HTML.
  if (step.kind === 'assign') return step.items.map((it) => buat(it, 'kasus', false));
  if (step.kind === 'order') return step.items.map((it) => buat(it, 'bukti', false));
  return []; // number: tidak ada objek yang diketuk di adegan
}

/** Semua objek yang dapat diketuk pada satu misi, urut per langkah. */
export function objectsForMission(mission: MissionPublic): BridgeObject[] {
  return mission.steps.flatMap(objectsForStep);
}

function asList(v: StepAnswer | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function asRecord(v: StepAnswer | undefined): Record<string, string> {
  if (v === null || v === undefined || typeof v !== 'object' || Array.isArray(v)) return {};
  const isi: Record<string, string> = {};
  for (const [item, bucket] of Object.entries(v)) {
    if (typeof bucket === 'string' && bucket.length > 0) isi[item] = bucket;
  }
  return isi;
}

/**
 * Pilihan pemain saat ini untuk SETIAP langkah misi. Langkah kosong tetap
 * disertakan supaya Unity bisa menghapus penanda lama saat restoreSelections.
 */
export function selectionsFromAnswer(mission: MissionPublic, answer: MissionAnswer): BridgeSelection[] {
  return mission.steps.map((step): BridgeSelection => {
    const v = answer[step.id];
    if (step.kind === 'single') {
      return { stepId: step.id, optionIds: typeof v === 'string' && v.length > 0 ? [v] : [] };
    }
    if (step.kind === 'multi' || step.kind === 'order') {
      return { stepId: step.id, optionIds: asList(v) };
    }
    if (step.kind === 'assign') {
      const assign = asRecord(v);
      return { stepId: step.id, optionIds: Object.keys(assign), assign };
    }
    return {
      stepId: step.id,
      optionIds: [],
      angka: typeof v === 'number' && Number.isFinite(v) ? v : null,
    };
  });
}

/** Pesan loadMission untuk satu misi & ronde (tanpa kunci jawaban). */
export function loadMissionMessage(mission: MissionPublic, roundIndex: number): ToUnityMessage {
  return {
    type: 'loadMission',
    missionId: mission.id,
    roundIndex,
    scene: mission.scene,
    title: mission.title,
    objects: objectsForMission(mission),
  };
}

/** Misi & ronde yang sudah dikirim; mencegah Unity memuat ulang adegan yang sama. */
let terkirim = '';

/**
 * Kirim loadMission sekali saja per (misi, ronde). BRIEFING dan layar bermain
 * sama-sama memintanya, jadi pemanggilan kedua diabaikan.
 * `paksa` dipakai saat Unity baru mengirim 'unityReady' (instance baru belum
 * punya misi apa pun).
 */
export function sendLoadMission(mission: MissionPublic, roundIndex: number, paksa = false): void {
  const kunci = `${mission.id}#${roundIndex}`;
  if (!paksa && kunci === terkirim) return;
  terkirim = kunci;
  sendToUnity(loadMissionMessage(mission, roundIndex));
}
