/**
 * Adegan 2D untuk layar besar (proyektor): hanya tontonan, tanpa jawaban pemain.
 * Saat pembahasan, jawaban tepat dari server ditandai langsung di gambar.
 */

import { useMemo } from 'react';
import type { MissionAnswer, MissionPublic, MissionReveal, PlayerLook } from '@shared/types';
import { useReducedMotion } from '../hooks';
import { GameStage } from './GameStage';
import { sceneFor } from './scenes';
import type { StageView } from './types';
import './stage.css';

const PETUGAS: PlayerLook = { body: 0, skin: 1, hair: 0, accessory: 'topi', color: 0 };

/** Jawaban tepat dari payload REVEAL (id, bukan teks). */
export function jawabanDariReveal(reveal: MissionReveal | null): MissionAnswer {
  const a: MissionAnswer = {};
  for (const s of reveal?.steps ?? []) {
    const c = s.correct;
    if (!c) continue;
    if (c.assign) a[s.stepId] = c.assign;
    else if (typeof c.value === 'number') a[s.stepId] = c.value;
    else if (c.optionIds) a[s.stepId] = c.optionIds.length === 1 ? c.optionIds[0]! : c.optionIds;
  }
  return a;
}

export function AdeganLayar({ mission, roundIndex, reveal }: { mission: MissionPublic; roundIndex: number; reveal: MissionReveal | null }) {
  const spec = useMemo(() => sceneFor(mission), [mission]);
  const reduced = useReducedMotion();
  const view: StageView = useMemo(() => {
    const answer = jawabanDariReveal(reveal);
    // Multi-select dengan satu jawaban tetap berbentuk daftar.
    for (const s of mission.steps) if (s.kind === 'multi' && typeof answer[s.id] === 'string') answer[s.id] = [answer[s.id] as string];
    return { mode: reveal ? 'reveal' : 'intro', focusStepId: null, focusItemId: null, answer, reveal, reducedMotion: reduced };
  }, [reveal, reduced, mission]);
  return <div className="adegan-layar"><GameStage mission={mission} spec={spec} roundIndex={roundIndex} look={PETUGAS} view={view} onTap={() => {}} label={`Adegan ${mission.location}`} /></div>;
}
