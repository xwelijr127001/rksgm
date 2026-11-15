/**
 * Assets of one room (`GET /api/story/rooms/:code/assets`): only what that room's frozen scenario version uses, and
 * only for rounds the room has reached (the server withholds later evidence). Fetched again when the round changes;
 * the previous list stays in use until the new one arrives, so the stage never flickers to its fallback, and it says
 * whether it is the current round's list yet (a device reports its pictures ready only from that one). A failure
 * leaves the last list (or an empty one) and the stage falls back to text.
 */
import { useEffect, useState } from 'react';
import { serverUrl } from './base';
import type { RoomAsset, RoomAssetMap } from './stage/StoryStage';

async function load(code: string, round: number): Promise<RoomAssetMap | null> {
  try {
    const r = await fetch(serverUrl(`/api/story/rooms/${encodeURIComponent(code)}/assets?babak=${round}` /* `babak` only keys the browser cache; the server decides from the room's progress */), { headers: { accept: 'application/json' } });
    if (!r.ok) return null;
    const j = (await r.json()) as { assets?: RoomAsset[] };
    return new Map((j.assets ?? []).map((a) => [a.id, a]));
  } catch {
    return null;
  }
}

export interface RoomAssetState {
  /** The latest list (possibly an earlier round's while the current one loads); null before the first arrives. */
  assets: RoomAssetMap | null;
  /** true once the list was loaded for `roundNumber`; until then an asset of this round may simply not be listed yet. */
  current: boolean;
}

export function useRoomAssetState(code: string | null, roundNumber: number): RoomAssetState {
  const [state, setState] = useState<{ code: string; round: number; map: RoomAssetMap } | null>(null);
  useEffect(() => {
    if (!code) return;
    let alive = true;
    void load(code, roundNumber).then((map) => {
      if (alive && map) setState({ code, round: roundNumber, map });
    });
    return () => {
      alive = false;
    };
  }, [code, roundNumber]);
  const mine = state && state.code === code ? state : null;
  return { assets: mine ? mine.map : null, current: mine !== null && mine.round === roundNumber };
}

/** The latest asset list of the room (shared screens, which report no readiness). */
export function useRoomAssets(code: string | null, roundNumber: number): RoomAssetMap | null {
  return useRoomAssetState(code, roundNumber).assets;
}
