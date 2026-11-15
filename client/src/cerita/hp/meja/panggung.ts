/**
 * Membuat & membersihkan satu instance Phaser untuk meja kasus (PROTOTIPE K11, D-68), memakai fondasi engine yang sama
 * dengan adegan misi (game/engine): chunk Phaser lazy (`prefetchEngine`), rasterisasi seni kode ber-cache (`rasterize`),
 * sentuhan tidak menahan gulir halaman (touch capture mati, windowEvents mati), dan destroy() yang melepas konteks WebGL.
 * Gagal / waktu habis = promise ditolak; pemanggil memakai tampilan daftar (HTML) dengan state yang sama.
 */
import type Phaser from 'phaser';
import { art } from '../../../game/art/kit';
import { rasterize, rasterScaleFor } from '../../../game/engine/raster';
import { prefetchEngine } from '../../../game/engine/stage';
import type { SeniArena } from '../../tipe';
import { defineMejaScene, type MejaSceneInstance, type PandangMeja } from './MejaScene';
import { MEJA_H, MEJA_W } from './tata';

export interface HandleMeja {
  atur(p: PandangMeja): void;
  destroy(): void;
  renderer: 'webgl' | 'canvas';
}

declare global {
  interface Window {
    /** Diagnostik uji browser: instance meja aktif & sasaran sentuh yang aktif (koordinat layar CSS). */
    __raksaMeja?: {
      live: number;
      created: number;
      destroyed: number;
      renderer?: 'webgl' | 'canvas';
      sasaran?: () => { id: string; x: number; y: number; w: number; h: number }[];
    };
  }
}

function hematDaya(): boolean {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 2;
}

/** Potret bundar untuk kartu kontak (kanvas 2D, tanpa masker engine). Gagal = tanpa potret. */
async function potretBundar(url: string, px: number): Promise<HTMLCanvasElement | null> {
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    if (!g) return null;
    g.beginPath();
    g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
    g.clip();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    g.drawImage(img, (img.naturalWidth - s) / 2, 0, s, s, 0, 0, px, px);
    return c;
  } catch {
    return null;
  }
}

let hidup = 0;
function catat(): NonNullable<Window['__raksaMeja']> {
  window.__raksaMeja ??= { live: 0, created: 0, destroyed: 0 };
  return window.__raksaMeja;
}

export async function buatPanggungMeja(opts: {
  parent: HTMLElement;
  seni: Readonly<Record<string, SeniArena>>;
  /** Id seni (Episode.seniArena) yang dipakai adegan. */
  kunciSeni: string[];
  seniBerkas: Record<string, string | undefined>;
  avatarUrl: string | null;
  pandang: PandangMeja;
  onKetuk(id: string): void;
  timeoutMs?: number;
}): Promise<HandleMeja> {
  const P = await prefetchEngine();
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const ukur = () => {
    const w = Math.round(Math.max(200, opts.parent.clientWidth || 320) * dpr);
    return { w, h: Math.round((w * MEJA_H) / MEJA_W) };
  };
  const awal = ukur();
  const skala = rasterScaleFor(awal.w, MEJA_W);
  const tekstur = new Map<string, HTMLCanvasElement>();
  await Promise.all(opts.kunciSeni.map(async (id) => {
    const s = opts.seni[id];
    if (!s) return;
    tekstur.set(id, await rasterize(art(`meja:${id}`, s.w, s.h, s.svg), skala));
  }));
  const potret = opts.avatarUrl ? await potretBundar(opts.avatarUrl, Math.round(58 * skala)) : null;
  if (potret) tekstur.set('meja.avatar', potret);

  const Scene = defineMejaScene(P);
  return new Promise<HandleMeja>((resolve, reject) => {
    let selesai = false;
    const batas = window.setTimeout(() => {
      if (selesai) return;
      selesai = true;
      try { game.destroy(true); } catch { /* abaikan */ }
      reject(new Error('meja-timeout'));
    }, opts.timeoutMs ?? 12000);

    const game: Phaser.Game = new P.Game({
      type: P.AUTO,
      parent: opts.parent,
      width: awal.w,
      height: awal.h,
      backgroundColor: '#c99862',
      banner: false,
      audio: { noAudio: true },
      scale: { mode: P.Scale.NONE, width: awal.w, height: awal.h, zoom: 1 / dpr },
      // Sentuhan di kanvas tetap bisa menggulung halaman; ketukan pada HTML di atas kanvas tidak diproses engine.
      input: { touch: { capture: false }, activePointers: 1, keyboard: false, gamepad: false, windowEvents: false },
      render: { antialias: true, roundPixels: false, powerPreference: 'default' },
      fps: { target: 60, limit: hematDaya() ? 30 : 0 },
      disableContextMenu: true,
      callbacks: {
        postBoot: (g) => {
          const c = g.canvas;
          c.style.touchAction = 'manipulation';
          c.style.display = 'block';
          c.setAttribute('aria-hidden', 'true');
          c.dataset.raksaMeja = '1';
        },
      },
    });

    const adegan = (): MejaSceneInstance | null => (game.scene?.getScene('meja') as MejaSceneInstance | null) ?? null;
    let mati = false;
    let ro: ResizeObserver | null = null;

    game.scene.add('meja', Scene, true, {
      tekstur,
      seniBerkas: opts.seniBerkas,
      pandang: opts.pandang,
      onKetuk: (id: string) => { if (!mati) opts.onKetuk(id); },
      onSiap: () => {
        if (selesai) return;
        selesai = true;
        window.clearTimeout(batas);
        const renderer: HandleMeja['renderer'] = game.renderer && game.renderer.type === P.WEBGL ? 'webgl' : 'canvas';
        const reg = catat();
        hidup += 1;
        reg.live = hidup;
        reg.created += 1;
        reg.renderer = renderer;
        reg.sasaran = () => {
          const s = adegan();
          const kanvas = game.canvas?.getBoundingClientRect();
          if (!s || !kanvas) return [];
          const f = kanvas.width / MEJA_W;
          return [...s.zona].filter(([, z]) => z.input?.enabled).map(([id, z]) => ({
            id, x: kanvas.left + z.x * f, y: kanvas.top + z.y * f, w: z.width * f, h: z.height * f,
          }));
        };
        resolve({
          renderer,
          atur: (p) => { if (!mati) adegan()?.atur(p); },
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
            const r = catat();
            r.live = hidup;
            r.destroyed += 1;
            if (!hidup) r.sasaran = undefined;
          },
        });
      },
    });

    if (typeof ResizeObserver !== 'undefined') {
      let terakhir = awal.w;
      ro = new ResizeObserver(() => {
        if (mati) return;
        const u = ukur();
        if (Math.abs(u.w - terakhir) < 2) return;
        terakhir = u.w;
        game.scale.resize(u.w, u.h);
        game.scale.setZoom(1 / dpr);
        adegan()?.ubahUkuran(u.w);
      });
      ro.observe(opts.parent);
    }
  });
}
