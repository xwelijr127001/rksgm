/**
 * Rasterisasi gambar SVG (ArtRef) menjadi kanvas untuk tekstur engine.
 * Hasil di-cache per kunci+skala, jadi pergantian ronde tidak menggambar ulang.
 *
 * Seni PIKSEL (`ArtRef.piksel`): potongan atlas PNG disusun ke kanvas 1 px per piksel seni tanpa penghalusan; kanvas
 * ditandai `data-piksel="1"` supaya MissionScene memasang filter NEAREST & skala perangkat bulat. Atlas gagal
 * dimuat = SVG cadangan ArtRef yang sama (adegan tetap jalan).
 */

import type { ArtPiksel, ArtRef } from '../types';

const cache = new Map<string, Promise<HTMLCanvasElement>>();
const MAKS_CACHE = 160;

function muatGambar(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('svg-gagal-didekode'));
    };
    img.src = url;
  });
}

const atlas = new Map<string, Promise<HTMLImageElement>>();

/** Muat & dekode PNG atlas sekali per URL (gagal = dicoba lagi pada permintaan berikutnya). */
function muatAtlas(url: string): Promise<HTMLImageElement> {
  const ada = atlas.get(url);
  if (ada) return ada;
  const kerja = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const ok = () => (img.naturalWidth > 0 ? resolve(img) : reject(new Error('atlas-kosong')));
      if (typeof img.decode === 'function') img.decode().then(ok, ok);
      else ok();
    };
    img.onerror = () => reject(new Error('atlas-gagal-dimuat'));
    img.src = url;
  });
  kerja.catch(() => atlas.delete(url));
  atlas.set(url, kerja);
  return kerja;
}

/** Susun seni piksel ke kanvas 1:1 (piksel seni), tanpa penghalusan. */
async function rasterPiksel(p: ArtPiksel): Promise<HTMLCanvasElement> {
  const img = await muatAtlas(p.url);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(p.w));
  canvas.height = Math.max(1, Math.round(p.h));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('kanvas-2d-tidak-tersedia');
  ctx.imageSmoothingEnabled = false;
  for (const l of p.lapisan) ctx.drawImage(img, l.sx, l.sy, l.w, l.h, l.x, l.y, l.w, l.h);
  canvas.dataset.piksel = '1';
  return canvas;
}

export function rasterize(a: ArtRef, scale: number): Promise<HTMLCanvasElement> {
  if (a.piksel) {
    const kunci = `${a.key}@piksel`;
    const ada = cache.get(kunci);
    if (ada) return ada;
    const kerja = rasterPiksel(a.piksel).catch(() => rasterSvg(a, scale));
    kerja.catch(() => cache.delete(kunci));
    cache.set(kunci, kerja);
    return kerja;
  }
  return rasterSvg(a, scale);
}

function rasterSvg(a: ArtRef, scale: number): Promise<HTMLCanvasElement> {
  const w = Math.max(1, Math.ceil(a.w * scale));
  const h = Math.max(1, Math.ceil(a.h * scale));
  const kunci = `${a.key}@${w}x${h}`;
  const ada = cache.get(kunci);
  if (ada) return ada;
  const kerja = muatGambar(a.svg.replace('__W__', String(w)).replace('__H__', String(h))).then((img) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('kanvas-2d-tidak-tersedia');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  });
  kerja.catch(() => cache.delete(kunci));
  cache.set(kunci, kerja);
  if (cache.size > MAKS_CACHE) {
    const pertama = cache.keys().next().value;
    if (pertama) cache.delete(pertama);
  }
  return kerja;
}

/** Skala rasterisasi yang cukup tajam untuk lebar kanvas fisik tertentu. */
export function rasterScaleFor(pixelWidth: number, worldWidth: number): number {
  const s = pixelWidth / worldWidth;
  return Math.min(2.5, Math.max(1, Math.ceil(s * 4) / 4));
}
