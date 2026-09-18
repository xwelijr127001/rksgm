/**
 * Rasterisasi gambar SVG (ArtRef) menjadi kanvas untuk tekstur engine.
 * Hasil di-cache per kunci+skala, jadi pergantian ronde tidak menggambar ulang.
 */

import type { ArtRef } from '../types';

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

export function rasterize(a: ArtRef, scale: number): Promise<HTMLCanvasElement> {
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
