/**
 * Background music of a Story Room page. Built-in tracks go through the shared music engine (audio/audio.ts: fades,
 * autoplay handling, the header mute button). An uploaded BGM asset plays through its own looping <audio> element that
 * follows the same mute/music/volume preferences. Players can always mute (header button).
 */
import { useEffect } from 'react';
import type { StoryPublicState } from '@shared/story/protocol';
import { getAudioPrefs, setTrack, subscribeAudio, type Track } from '../audio/audio';
import { withBase } from './base';
import type { RoomAssetMap } from './stage/StoryStage';

const BUILTIN_TRACK: Record<string, Track> = { 'builtin:bgm:gameplay': 'game', 'builtin:bgm:lobby': 'lobby' };

export function useStoryMusic(room: Pick<StoryPublicState, 'phase' | 'scenario'>, assets: RoomAssetMap | null): void {
  const bgm = room.scenario.bgmAssetId;
  const playing = room.phase !== 'lobby' && room.phase !== 'finished' && room.phase !== 'interrupted';
  const uploaded = bgm && assets?.get(bgm)?.builtin === false ? assets.get(bgm)?.url ?? null : null;
  const builtin: Track = room.phase === 'lobby' ? 'lobby' : playing && bgm ? BUILTIN_TRACK[bgm] ?? null : null;

  useEffect(() => {
    setTrack(uploaded && playing ? null : builtin);
  }, [builtin, uploaded, playing]);
  useEffect(() => () => setTrack(null), []);

  useEffect(() => {
    if (!uploaded || !playing) return;
    const el = new Audio(withBase(uploaded));
    el.loop = true;
    const apply = () => {
      const p = getAudioPrefs();
      el.volume = Math.max(0, Math.min(1, p.musicVolume));
      if (p.muted || !p.musicEnabled) el.pause();
      else void el.play().catch(() => undefined); // autoplay may need a tap; the header button retries
    };
    apply();
    const unsubscribe = subscribeAudio(apply);
    return () => {
      unsubscribe();
      el.pause();
      el.src = '';
    };
  }, [uploaded, playing]);
}
