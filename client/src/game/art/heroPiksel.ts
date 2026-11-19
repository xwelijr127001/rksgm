/**
 * T-055: petugas (pemain) PIKSEL di adegan bergaya piksel (SceneSpec.gaya 'piksel'): kepala & bahu = kisi potret piksel pemain
 * yang sama dengan gelembung obrolan dan kartu petugas (T-052, art/AvatarPiksel.tsx, dari profil.look), lalu badan diteruskan
 * ke bawah: baju seragam, tangan, sabuk, celana arang, sepatu, garis tepi tinta. 18 x 34 sel, 3 dunia per sel (tampil x 0,8 =
 * 2,4 dunia, dekat dengan sel halus adegan 2 dunia). Satu gambar untuk semua pose tangan (gaya piksel tidak memakai prop tangan).
 */
import type { PlayerLook } from '@shared/types';
import { SKIN_TONES } from '@shared/brand';
import { kisiAvatarPiksel } from '../../art/AvatarPiksel';
import type { ArtRef } from '../types';
import { art } from './kit';
import { Piksel } from './piksel';

const TINTA = '#2a211e';
const CELANA = '#33363f';
const CELANA_G = '#26282f';
const SEPATU = '#1d1b20';

function pilih(daftar: readonly string[], i: number): string {
  const n = daftar.length;
  const b = Number.isFinite(i) ? Math.trunc(i) : 0;
  return daftar[((b % n) + n) % n]!;
}

/** Kisi warna 18 x 34 petugas piksel (murni; dipakai juga alat pratinjau). */
export function kisiHeroPiksel(look: PlayerLook): (string | null)[][] {
  const W = 18, H = 34;
  const g: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null));
  const kepala = kisiAvatarPiksel(look);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y]![x + 1] = kepala[y]![x]!;
  // lebar badan dari baris bawah potret
  const isi = g[15]!.map((c, x) => (c ? x : -1)).filter((x) => x >= 0);
  const kiri = Math.min(...isi), kanan = Math.max(...isi);
  const kulit = pilih(SKIN_TONES, look.skin);
  for (let y = 16; y < 22; y++) for (let x = kiri; x <= kanan; x++) g[y]![x] = g[15]![x]!;
  for (const y of [20, 21]) { g[y]![kiri] = kulit; g[y]![kanan] = kulit; }
  for (let x = kiri + 1; x < kanan; x++) g[22]![x] = CELANA;
  const tengah = Math.floor((kiri + kanan) / 2);
  for (let y = 23; y < 31; y++) {
    for (let x = kiri + 1; x < tengah; x++) g[y]![x] = x === tengah - 1 ? CELANA_G : CELANA;
    for (let x = tengah + 1; x < kanan; x++) g[y]![x] = x === kanan - 1 ? CELANA_G : CELANA;
  }
  for (const y of [31, 32]) {
    for (let x = kiri; x < tengah; x++) g[y]![x] = SEPATU;
    for (let x = tengah + 1; x <= kanan; x++) g[y]![x] = SEPATU;
  }
  // garis tepi tinta di luar siluet
  const o = g.map((r) => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y]![x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy!]?.[x + dx!])) o[y]![x] = TINTA;
  }
  return o;
}

export function heroPiksel(look: PlayerLook): ArtRef {
  const o = kisiHeroPiksel(look);
  const W = o[0]!.length, H = o.length;
  const p = new Piksel(W, H);
  o.forEach((r, y) => r.forEach((c, x) => { if (c) p.set(x, y, c); }));
  const kunci = `hero-piksel-${look.body}-${look.skin}-${look.hair}-${look.color}-${look.accessory}`;
  return art(kunci, W * 3, H * 3, p.svg(3));
}
