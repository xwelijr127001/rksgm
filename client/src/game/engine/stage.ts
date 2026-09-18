/**
 * Membuat & membersihkan satu instance Phaser untuk satu ronde/misi.
 *
 * - Phaser dimuat lazy (chunk terpisah) dan bisa di-prefetch sejak lobby.
 * - Satu instance per ronde; destroy() menghapus kanvas, listener, tween, dan
 *   melepas konteks WebGL secara eksplisit (Phaser tidak melakukannya sendiri)
 *   supaya pergantian misi tidak menumpuk konteks GPU di HP.
 */

import type Phaser from 'phaser';
import type { MissionPublic, PlayerLook } from '@shared/types';
import { heroArt, type HeroProp } from '../art/characters';
import type { ArtRef, SceneSpec, StageStats, StageView } from '../types';
import { WORLD_H, WORLD_W } from '../types';
import { stepIdsOf } from '../draft';
import { defineMissionScene, type MissionSceneInstance } from './MissionScene';
import { rasterize, rasterScaleFor } from './raster';

type PhaserModule = typeof Phaser;
let modul: Promise<PhaserModule> | null = null;

/** Mulai unduh engine lebih awal (lobby/tutorial/briefing). Aman dipanggil berkali-kali. */
export function prefetchEngine(): Promise<PhaserModule> {
  if (!modul) {
    modul = import('phaser').then((m) => ((m as unknown as { default?: PhaserModule }).default ?? (m as unknown as PhaserModule)));
    modul.catch(() => { modul = null; });
  }
  return modul;
}

export interface StageHandle {
  update(view: StageView): void;
  highlight(objectIds: string[]): void;
  destroy(): void;
  stats: StageStats;
  fps(): number;
}

export interface StageOptions {
  parent: HTMLElement;
  mission: MissionPublic;
  spec: SceneSpec;
  look: PlayerLook;
  view: StageView;
  bucketShort: Record<string, string>;
  onTap(objectId: string): void;
  /** Batas waktu memuat sebelum dianggap gagal (ms). */
  timeoutMs?: number;
}

let hidup = 0;
declare global {
  interface Window {
    /** Diagnostik untuk pengujian browser: jumlah instance & kanvas engine yang aktif. */
    __raksaStage?: {
      live: number;
      created: number;
      destroyed: number;
      last?: StageStats;
      fps?: () => number;
      /** Posisi objek adegan aktif (koordinat dunia 640x480) untuk uji ketuk otomatis. */
      scene?: { missionId: string; objects: { id: string; role: string; refId: string; stepIds: string[]; x: number; y: number }[] };
      /** Kotak label & objek adegan aktif (dunia) untuk uji tumpang-tindih. */
      kotak?: () => ReturnType<MissionSceneInstance['kotakUji']>;
    };
  }
}

function hematDaya(): boolean {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 2;
}

function catat(): NonNullable<Window['__raksaStage']> {
  window.__raksaStage ??= { live: 0, created: 0, destroyed: 0 };
  return window.__raksaStage;
}

function semuaArt(spec: SceneSpec, look: PlayerLook): { list: ArtRef[]; hero: Record<HeroProp, ArtRef> } {
  const hero: Record<HeroProp, ArtRef> = {
    none: heroArt(look, 'none'),
    kamera: heroArt(look, 'kamera'),
    papan: heroArt(look, 'papan'),
    stempel: heroArt(look, 'stempel'),
    tunjuk: heroArt(look, 'tunjuk'),
    kalkulator: heroArt(look, 'kalkulator'),
  };
  const list: ArtRef[] = [spec.background, ...(spec.props ?? []).map((p) => p.art), ...spec.objects.map((o) => o.art), ...Object.values(hero)];
  const unik = new Map(list.map((a) => [a.key, a]));
  return { list: [...unik.values()], hero };
}

export async function createStage(opts: StageOptions): Promise<StageHandle> {
  const mulai = performance.now();
  const P = await prefetchEngine();
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const ukur = (): { w: number; h: number } => {
    const cssW = Math.max(200, Math.round(opts.parent.clientWidth || 320));
    const w = Math.round(cssW * dpr);
    return { w, h: Math.round((w * WORLD_H) / WORLD_W) };
  };
  const awal = ukur();
  const skala = rasterScaleFor(awal.w, WORLD_W);

  const semua = semuaArt(opts.spec, opts.look);
  const t0 = performance.now();
  const kanvas = await Promise.all(semua.list.map((a) => rasterize(a, skala).then((c) => [a.key, c] as const)));
  const rasterMs = performance.now() - t0;
  const canvases = new Map(kanvas);

  const Scene = defineMissionScene(P);
  let scene: MissionSceneInstance | null = null;

  return new Promise<StageHandle>((resolve, reject) => {
    let selesai = false;
    const batas = window.setTimeout(() => {
      if (selesai) return;
      selesai = true;
      try { game.destroy(true); } catch { /* abaikan */ }
      reject(new Error('adegan-timeout'));
    }, opts.timeoutMs ?? 12000);

    const game: Phaser.Game = new P.Game({
      type: P.AUTO,
      parent: opts.parent,
      width: awal.w,
      height: awal.h,
      backgroundColor: '#fff9e9',
      banner: false,
      audio: { noAudio: true },
      scale: { mode: P.Scale.NONE, width: awal.w, height: awal.h, zoom: 1 / dpr },
      // capture:false -> sentuhan di kanvas tetap bisa menggulung halaman.
      input: { touch: { capture: false }, activePointers: 1, keyboard: false, gamepad: false },
      render: { antialias: true, roundPixels: false, powerPreference: 'default' },
      // HP lemah (<= 4 inti atau <= 2 GB RAM): batasi 30 fps supaya tidak panas & boros baterai.
      fps: { target: 60, limit: hematDaya() ? 30 : 0 },
      disableContextMenu: true,
      callbacks: {
        postBoot: (g) => {
          const c = g.canvas;
          c.style.touchAction = 'manipulation';
          c.style.display = 'block';
          c.setAttribute('aria-hidden', 'true');
          c.dataset.raksaStage = '1';
        },
      },
    });

    const init = {
      mission: opts.mission,
      spec: opts.spec,
      view: opts.view,
      canvases,
      rasterScale: skala,
      heroArt: semua.hero,
      bucketShort: opts.bucketShort,
      onTap: opts.onTap,
      onReady: () => {
        if (selesai) return;
        selesai = true;
        window.clearTimeout(batas);
        const renderer: StageStats['renderer'] = game.renderer && game.renderer.type === P.WEBGL ? 'webgl' : 'canvas';
        const stats: StageStats = { renderer, loadMs: Math.round(performance.now() - mulai), rasterMs: Math.round(rasterMs), textures: canvases.size };
        const reg = catat();
        hidup += 1;
        reg.live = hidup;
        reg.created += 1;
        reg.last = stats;
        reg.fps = () => game.loop.actualFps;
        reg.scene = {
          missionId: opts.mission.id,
          objects: opts.spec.objects.map((o) => ({ id: o.id, role: o.role, refId: o.refId, stepIds: stepIdsOf(o), x: o.x, y: o.y })),
        };
        reg.kotak = () => (game.scene.getScene('misi') as MissionSceneInstance).kotakUji();
        resolve(handle(stats));
      },
    };
    game.scene.add('misi', Scene, true, init);
    game.events.once('ready', () => {
      scene = game.scene.getScene('misi') as MissionSceneInstance;
    });

    let ro: ResizeObserver | null = null;
    let terakhirW = awal.w;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const u = ukur();
        if (Math.abs(u.w - terakhirW) < 2) return;
        terakhirW = u.w;
        game.scale.resize(u.w, u.h);
        game.scale.setZoom(1 / dpr);
        (scene ?? (game.scene.getScene('misi') as MissionSceneInstance | null))?.ubahUkuran(u.w);
      });
      ro.observe(opts.parent);
    }

    const handle = (stats: StageStats): StageHandle => {
      let mati = false;
      const s = (): MissionSceneInstance | null => (mati ? null : scene ?? (game.scene.getScene('misi') as MissionSceneInstance | null));
      return {
        stats,
        update: (view) => s()?.atur(view),
        highlight: (ids) => s()?.sorot(ids),
        fps: () => game.loop.actualFps,
        destroy: () => {
          if (mati) return;
          mati = true;
          ro?.disconnect();
          const gl = (game.renderer as unknown as { gl?: WebGLRenderingContext }).gl;
          game.events.once('destroy', () => {
            try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* abaikan */ }
          });
          game.destroy(true);
          hidup = Math.max(0, hidup - 1);
          const reg = catat();
          reg.live = hidup;
          reg.destroyed += 1;
          if (reg.scene?.missionId === opts.mission.id) reg.scene = undefined;
        },
      };
    };
  });
}
