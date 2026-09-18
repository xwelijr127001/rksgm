/**
 * Draft jawaban satu ronde yang selamat dari refresh.
 * Disimpan di sessionStorage (per tab) dengan kunci room+ronde+misi, dan hanya
 * dipulihkan untuk ronde & misi yang sama. Draft lama dari ronde lain dibuang.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MissionAnswer, MissionPublic, StepAnswer } from '@shared/types';
import { sanitizeDraft } from './draft';

const AWALAN = 'raksa:draft:';

function kunci(code: string, roundIndex: number, missionId: string): string {
  return `${AWALAN}${code.toUpperCase()}:${roundIndex}:${missionId}`;
}

function baca(k: string, mission: MissionPublic): MissionAnswer {
  try {
    const raw = sessionStorage.getItem(k);
    return raw ? sanitizeDraft(mission, JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function bersihkanLama(kecuali: string): void {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(AWALAN) && k !== kecuali) sessionStorage.removeItem(k);
    }
  } catch {
    /* mode privat: abaikan */
  }
}

export function useRoundDraft(code: string | null, roundIndex: number, mission: MissionPublic | null) {
  const k = code && mission && roundIndex >= 0 ? kunci(code, roundIndex, mission.id) : null;
  const [draft, setDraftState] = useState<MissionAnswer>(() => (k && mission ? baca(k, mission) : {}));
  const kRef = useRef(k);

  useEffect(() => {
    if (kRef.current === k) return;
    kRef.current = k;
    setDraftState(k && mission ? baca(k, mission) : {});
    if (k) bersihkanLama(k);
  }, [k, mission]);

  const ubah = useCallback((stepId: string, value: StepAnswer) => {
    setDraftState((lama) => {
      const baru = { ...lama, [stepId]: value };
      const kk = kRef.current;
      if (kk) {
        try { sessionStorage.setItem(kk, JSON.stringify(baru)); } catch { /* abaikan */ }
      }
      return baru;
    });
  }, []);

  const hapus = useCallback(() => {
    const kk = kRef.current;
    if (kk) {
      try { sessionStorage.removeItem(kk); } catch { /* abaikan */ }
    }
  }, []);

  return [draft, ubah, hapus] as const;
}
