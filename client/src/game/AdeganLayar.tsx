/**
 * Adegan 2D untuk layar besar (proyektor): hanya tontonan, tanpa jawaban pemain.
 * Saat pembahasan, jawaban tepat dari server ditandai langsung di gambar.
 *
 * Misi bergambar (soal buatan panitia): gambar yang sama dengan di HP pemain, tanpa engine dan
 * tanpa tanda di gambar; kunci & penjelasan tetap tampil di kolom pembahasan proyektor.
 */

import { useMemo } from 'react';
import type { MissionAnswer, MissionPublic, MissionReveal, PlayerLook } from '@shared/types';
import { useReducedMotion } from '../hooks';
import { misiDalamBahasa, t, useBahasa } from '../i18n';
import { AdeganGambar } from './AdeganGambar';
import { misiBergambar } from './gambar';
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
  const { bahasa } = useBahasa();
  // Misi dalam bahasa aktif (aman bila pemanggil sudah menerjemahkannya: id sama, hasil sama).
  const misi = useMemo(() => misiDalamBahasa(mission, bahasa), [mission, bahasa]);
  const bergambar = useMemo(() => misiBergambar(misi), [misi]);
  // Bahasa berganti -> label adegan berganti -> GameStage membuat instance baru.
  const spec = useMemo(() => (bergambar ? null : sceneFor(misi, bahasa)), [misi, bahasa, bergambar]);
  const reduced = useReducedMotion();
  const view: StageView = useMemo(() => {
    const answer = jawabanDariReveal(reveal);
    // Multi-select dengan satu jawaban tetap berbentuk daftar.
    for (const s of misi.steps) if (s.kind === 'multi' && typeof answer[s.id] === 'string') answer[s.id] = [answer[s.id] as string];
    return { mode: reveal ? 'reveal' : 'intro', focusStepId: null, focusItemId: null, answer, reveal, reducedMotion: reduced };
  }, [reveal, reduced, misi]);
  // Tanpa engine. Kunci = misi + ronde: soal berikutnya mulai dari keadaan "memuat", tidak mewarisi status gambar lama.
  if (bergambar) return <div className="adegan-layar"><AdeganGambar key={`${misi.id}:${roundIndex}`} mission={misi} penonton /></div>;
  return <div className="adegan-layar"><GameStage mission={misi} spec={spec} roundIndex={roundIndex} look={PETUGAS} view={view} onTap={() => {}} label={t('layar.adeganLabel', { lokasi: misi.location })} /></div>;
}
