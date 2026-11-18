/**
 * T-052: potret PIKSEL karakter pemain (profil.look) untuk mode cerita: kepala & bahu 16 x 16 sel seni, digambar sebagai SVG rect
 * (shape-rendering crispEdges) di atas cakram krem bertangga. Tampil pada kelipatan bulat 16 (32 = 2 px CSS per sel) supaya
 * pikselnya utuh, sama dengan potret piksel tokoh lain di cerita. Warna = daftar bersama (UNIFORM_COLORS keluarga Raksa,
 * SKIN_TONES, HAIR_COLORS) + aksen tetap PALET.md bagian 12; bentuk rambut = `body` (0 pendek, 1 belah samping, 2 sanggul,
 * 3 keriting), aksesori = helm / jaket / headset / topi seperti avatar bulat (art/Avatar.tsx).
 */
import { useMemo } from 'react';
import type { PlayerLook } from '@shared/types';
import { HAIR_COLORS, SKIN_TONES, UNIFORM_COLORS } from '@shared/brand';

const N = 16;
const KUNING = '#F6D25C';
const ARANG = '#33363F';
const TINTA = '#2a211e';
const KREM = '#FFF1E2';
const KREM_TEPI = '#ECD5CB';
const PUTIH = '#F7F2EA';
const MULUT = '#8f4c26';

function pilih(daftar: readonly string[], i: number): string {
  const n = daftar.length;
  const b = Number.isFinite(i) ? Math.trunc(i) : 0;
  return daftar[((b % n) + n) % n]!;
}
/** Campur warna dengan hitam (bayangan) atau putih (kilap); t 0..1. */
function campur(hex: string, ke: 0 | 255, t: number): string {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + v.map((c) => Math.round(c + (ke - c) * t).toString(16).padStart(2, '0')).join('');
}

/** Kisi warna 16 x 16 (null = transparan) untuk satu tampilan. Murni (bisa diuji). */
export function kisiAvatarPiksel(look: PlayerLook): (string | null)[][] {
  const g: (string | null)[][] = Array.from({ length: N }, () => Array<string | null>(N).fill(null));
  const set = (x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y]![x] = c; };
  const baris = (y: number, x0: number, x1: number, c: string) => { for (let x = x0; x <= x1; x++) set(x, y, c); };
  const kulit = pilih(SKIN_TONES, look.skin), kulitG = campur(kulit, 0, 0.18);
  const rambut = pilih(HAIR_COLORS, look.hair);
  const baju = pilih(UNIFORM_COLORS, look.color), bajuG = campur(baju, 0, 0.22), bajuT = campur(baju, 255, 0.18);
  const body = ((Math.trunc(Number.isFinite(look.body) ? look.body : 0) % 4) + 4) % 4;
  const jaket = look.accessory === 'jaket';

  // badan (baris 12..15): lebar mengikuti postur; sisi kanan gambar sedikit gelap
  const w = 5 + Math.min(body, 2);
  for (let y = 12; y < N; y++) {
    const l = y === 12 ? w - 1 : w;
    baris(y, 8 - l, 7 + l, jaket ? bajuG : baju);
    set(7 + l, y, jaket ? campur(baju, 0, 0.36) : bajuG);
    if (y === 13 && !jaket) set(8 - l, y, bajuT);
  }
  if (jaket) { baris(14, 8 - w, 7 + w, KUNING); set(7, 13, campur(baju, 0, 0.5)); set(7, 15, campur(baju, 0, 0.5)); }
  else { set(8, 14, TINTA); } // kancing gelap seragam resmi
  // seragam navy resmi: lis tenun merah-putih di garis leher
  if (!jaket && pilih(UNIFORM_COLORS, look.color).toUpperCase() === '#1C1D30') { [5, 10].forEach((x) => set(x, 12, '#C02430')); set(4, 13, PUTIH); set(11, 13, '#C02430'); }
  // leher + kerah putih berbentuk V
  baris(10, 7, 8, kulitG); baris(11, 7, 8, kulit);
  set(6, 12, PUTIH); set(9, 12, PUTIH); set(7, 12, kulit); set(8, 12, kulitG); set(7, 13, PUTIH); set(8, 13, PUTIH);
  // lencana Raksa di dada kiri gambar (kuning bertepi tinta)
  if (!jaket) { set(4, 14, KUNING); set(5, 14, KUNING); set(4, 15, KUNING); set(5, 15, TINTA); }
  // kepala (baris 3..10) + telinga
  baris(3, 5, 10, kulit);
  for (let y = 4; y <= 9; y++) baris(y, 4, 11, kulit);
  baris(10, 5, 10, kulit);
  set(11, 9, kulitG); set(10, 10, kulitG);
  set(3, 6, kulit); set(3, 7, kulitG); set(12, 6, kulit); set(12, 7, kulitG);
  // wajah senang: mata, pipi, senyum
  set(6, 6, TINTA); set(9, 6, TINTA);
  set(5, 8, campur(kulit, 0, 0.12)); set(10, 8, campur(kulit, 0, 0.12));
  set(6, 8, MULUT); set(7, 9, MULUT); set(8, 9, MULUT); set(9, 8, MULUT);
  // rambut per gaya
  baris(1, 5, 10, rambut); baris(2, 4, 11, rambut); baris(3, 4, 11, rambut);
  set(4, 4, rambut); set(11, 4, rambut); set(4, 5, rambut); set(11, 5, rambut);
  if (body === 1) { baris(4, 5, 8, rambut); set(9, 3, campur(rambut, 255, 0.25)); }
  else if (body === 2) { baris(4, 5, 6, rambut); set(12, 1, rambut); set(13, 1, rambut); set(12, 2, rambut); set(13, 2, rambut); set(12, 3, rambut); }
  else if (body === 3) { set(3, 3, rambut); set(3, 4, rambut); set(12, 3, rambut); set(12, 4, rambut); set(7, 0, rambut); set(8, 0, rambut); baris(4, 5, 6, rambut); baris(4, 9, 10, rambut); }
  else { baris(4, 5, 7, rambut); }
  // aksesori kepala (berhenti di atas mata, baris <= 4)
  if (look.accessory === 'helm') {
    baris(0, 6, 9, KUNING); baris(1, 5, 10, KUNING); baris(2, 4, 11, KUNING); baris(3, 4, 11, KUNING); baris(4, 3, 12, campur(KUNING, 0, 0.15));
    set(7, 1, campur(KUNING, 255, 0.4)); set(7, 0, campur(KUNING, 0, 0.2)); set(8, 0, campur(KUNING, 0, 0.2));
  } else if (look.accessory === 'topi') {
    baris(1, 5, 10, ARANG); baris(2, 4, 11, ARANG); baris(3, 4, 11, ARANG); baris(4, 3, 11, KUNING); set(7, 0, KUNING); set(8, 0, KUNING);
  } else if (look.accessory === 'headset') {
    baris(1, 5, 10, TINTA); set(4, 2, TINTA); set(11, 2, TINTA);
    for (let y = 5; y <= 7; y++) { set(3, y, TINTA); set(12, y, TINTA); }
    set(3, 8, TINTA); set(4, 9, TINTA); set(5, 9, KUNING);
  }
  return g;
}

/** Garis tepi gelap 1 sel di luar siluet (gaya piksel cerita). */
function tepi(g: (string | null)[][]): (string | null)[][] {
  const o = g.map((r) => r.slice());
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (g[y]![x]) continue;
    const dekat = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy!]?.[x + dx!]);
    if (dekat && y < N - 1) o[y]![x] = TINTA;
  }
  return o;
}

export function AvatarPiksel({ look, ukuran = 32, label, className = '' }: { look: PlayerLook; ukuran?: number; label?: string; className?: string }) {
  const rect = useMemo(() => {
    const g = tepi(kisiAvatarPiksel(look));
    const out: string[] = [];
    // cakram krem bertangga (latar potret, seperti potret tokoh lain)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
      if (!g[y]![x] && d <= 8) g[y]![x] = d > 7.2 ? KREM_TEPI : KREM;
    }
    for (let y = 0; y < N; y++) {
      let x = 0;
      while (x < N) {
        const c = g[y]![x];
        if (!c) { x++; continue; }
        let e = x + 1;
        while (e < N && g[y]![e] === c) e++;
        out.push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${c}"/>`);
        x = e;
      }
    }
    return out.join('');
  }, [look.body, look.skin, look.hair, look.color, look.accessory]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg className={'avatar-piksel ' + className} width={ukuran} height={ukuran} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} dangerouslySetInnerHTML={{ __html: rect }} />
  );
}
