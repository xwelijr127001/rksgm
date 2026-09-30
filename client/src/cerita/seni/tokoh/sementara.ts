/**
 * PENGGANTI SEMENTARA tokoh v3: siluet sederhana dengan kanvas & jangkar yang benar (ukuran.ts), supaya panggung,
 * cue, dan tata letak bisa dibangun paralel sebelum seni final selesai. Juga menjadi FALLBACK tampilan bila
 * generator final gagal (panggung tetap terbaca: bentuk + warna identitas; nama tokoh ditulis sebagai teks).
 */
import type { GambarTokoh, OpsiBuRina, OpsiMissRaksa } from './tipe';
import { KANVAS_BERDIRI, KANVAS_DUDUK } from './ukuran';

const duduk = (pose: string): boolean => pose.startsWith('duduk') || pose === 'telepon';

function siluet(duduk_: boolean, warnaKepala: string, warnaBadan: string, aksen: string): GambarTokoh {
  const k = duduk_ ? KANVAS_DUDUK : KANVAS_BERDIRI;
  const cx = k.kepala.x;
  const cy = k.kepala.y;
  const bawah = duduk_ ? k.jangkar.y + 40 : k.jangkar.y;
  const svg = [
    `<ellipse cx="${cx}" cy="${bawah}" rx="120" ry="16" fill="#000" opacity=".14"/>`,
    `<path d="M${cx - 120} ${bawah} Q${cx - 130} ${cy + 140} ${cx} ${cy + 110} Q${cx + 130} ${cy + 140} ${cx + 120} ${bawah} Z" fill="${warnaBadan}" stroke="#3a2620" stroke-width="3"/>`,
    `<circle cx="${cx}" cy="${cy}" r="62" fill="${warnaKepala}" stroke="#3a2620" stroke-width="3"/>`,
    `<path d="M${cx - 40} ${cy + 118} L${cx} ${cy + 150} L${cx + 40} ${cy + 118}" fill="none" stroke="${aksen}" stroke-width="10"/>`,
  ].join('');
  return { svg, w: k.w, h: k.h, jangkar: k.jangkar, kepala: k.kepala };
}

export function missRaksaSementara(o: OpsiMissRaksa): GambarTokoh {
  return siluet(duduk(o.pose), '#f1c7a4', '#f4cf86', '#ffffff');
}

export function buRinaSementara(o: OpsiBuRina): GambarTokoh {
  return siluet(duduk(o.pose), '#b5533a', '#2f5f8a', '#e0823a');
}
